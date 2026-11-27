package ch.red.ecosystem.identity;

import org.json.JSONObject;
import java.net.URI;
import java.net.URL;
import javax.net.ssl.HttpsURLConnection;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.Set;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.IOException;

/** Blocking API: call on a dedicated worker, never the Android main thread.
 * Exactly one client per origin/app per process to serialize token rotation. */
public final class RedAndroidClient {
    private static final Set<String> APPS = new java.util.HashSet<>(java.util.Arrays.asList("red-ion","red-fit","red-poly","red-bit","red-loop","red-efz","red-kurd","red-uhr","red-yt","stran","babat-red"));
    public interface Store { String load(String scope) throws Exception; void save(String scope,String value) throws Exception; void clear(String scope) throws Exception; }
    public interface Transport { JSONObject request(String url,String method,JSONObject body,String token) throws Exception; }
    public static final class HttpError extends IOException {
        public final int status;
        public HttpError(int status) { super("RED ID HTTP " + status); this.status=status; }
    }
    public static final class Proof {
        public final String verifier, challenge;
        private Proof(String verifier,String challenge){this.verifier=verifier;this.challenge=challenge;}
    }
    private final String origin,app,scope;
    private final Store store;
    private final Transport transport;
    public RedAndroidClient(String origin,String app,Store store) throws Exception {
        this(origin,app,store,RedAndroidClient::https);
    }
    public RedAndroidClient(String origin,String app,Store store,Transport transport) throws Exception {
        this.scope=scope(origin,app);this.origin=origin;this.app=app;this.store=store;this.transport=transport;
    }
    private static String b64(byte[] data){return Base64.getUrlEncoder().withoutPadding().encodeToString(data);}
    public static String scope(String origin,String app) throws Exception {
        if(!APPS.contains(app))throw new IllegalArgumentException("Invalid app");
        URI u=new URI(origin);
        int port=u.getPort();
        if(!"https".equals(u.getScheme())||u.getHost()==null||u.getRawUserInfo()!=null||!"".equals(u.getRawPath())||u.getRawQuery()!=null||u.getRawFragment()!=null||port==0||port==443||port>65535||!origin.equals("https://"+u.getHost().toLowerCase(java.util.Locale.ROOT)+(port<0?"":":"+port)))throw new IllegalArgumentException("Exact HTTPS origin required");
        return b64(MessageDigest.getInstance("SHA-256").digest((origin+"\n"+app).getBytes(StandardCharsets.UTF_8)));
    }
    public static Proof makeProof() throws Exception {
        byte[] raw=new byte[32];new SecureRandom().nextBytes(raw);String verifier=b64(raw);
        java.util.Arrays.fill(raw,(byte)0);
        return new Proof(verifier,b64(MessageDigest.getInstance("SHA-256").digest(verifier.getBytes(StandardCharsets.UTF_8))));
    }
    public static String pairingRequest(String app,String challenge) throws Exception {
        if(!APPS.contains(app)||!challenge.matches("[A-Za-z0-9_-]{43}"))throw new IllegalArgumentException("Invalid pairing request");
        return new JSONObject().put("kind","red-pair").put("version",1).put("app",app).put("challenge",challenge).toString();
    }
    private static JSONObject https(String url,String method,JSONObject body,String token) throws Exception {
        HttpsURLConnection c=(HttpsURLConnection)new URL(url).openConnection();
        try {
            c.setInstanceFollowRedirects(false);c.setConnectTimeout(10000);c.setReadTimeout(15000);
            c.setUseCaches(false);c.setRequestMethod(method);c.setRequestProperty("Cache-Control","no-store");
            if(token!=null)c.setRequestProperty("Authorization","Bearer "+token);
            if(body!=null){
                byte[] bytes=body.toString().getBytes(StandardCharsets.UTF_8);
                c.setDoOutput(true);c.setRequestProperty("Content-Type","application/json");c.setFixedLengthStreamingMode(bytes.length);
                try(OutputStream out=c.getOutputStream()){out.write(bytes);}
            }
            int status=c.getResponseCode();
            if(status<200||status>=300)throw new HttpError(status);
            try(InputStream in=c.getInputStream();ByteArrayOutputStream out=new ByteArrayOutputStream()){
                byte[] buf=new byte[4096];int n;
                while((n=in.read(buf))!=-1){if(out.size()+n>65536)throw new IOException("RED response too large");out.write(buf,0,n);}
                return new JSONObject(new String(out.toByteArray(),StandardCharsets.UTF_8));
            }
        }finally{c.disconnect();}
    }
    private JSONObject request(String path,String method,JSONObject body,String token)throws Exception{
        return transport.request(origin+"/red-id/v2/"+path,method,body,token);
    }
    private JSONObject body(String key,String value)throws Exception{return new JSONObject().put("app",app).put(key,value);}
    private JSONObject valid(JSONObject v)throws Exception{
        if(v.getInt("version")!=2||!app.equals(v.getString("app"))||!v.getString("accessToken").matches("redat_[a-f0-9]{64}")||!v.getString("refreshToken").matches("redrt_[a-f0-9]{64}")||v.getJSONArray("scopes").length()!=1||!"identity:read".equals(v.getJSONArray("scopes").getString(0))||Instant.parse(v.getString("expiresAt")).isAfter(Instant.parse(v.getString("refreshExpiresAt"))))throw new IOException("Invalid RED ID response");
        return v;
    }
    private JSONObject save(JSONObject v)throws Exception{valid(v);store.save(scope,v.toString());return v;}
    private JSONObject load()throws Exception{String raw=store.load(scope);if(raw==null)throw new HttpError(401);return valid(new JSONObject(raw));}
    private JSONObject rotate(JSONObject old)throws Exception{
        try{return save(request("refresh","POST",body("refreshToken",old.getString("refreshToken")),null));}
        catch(HttpError e){if(e.status==401)store.clear(scope);throw e;}
    }
    private JSONObject current()throws Exception{
        JSONObject v=load();return Instant.parse(v.getString("expiresAt")).isAfter(Instant.now().plusSeconds(30))?v:rotate(v);
    }
    private static void proof(String verifier){if(!verifier.matches("[A-Za-z0-9._~-]{43,128}"))throw new IllegalArgumentException("Invalid verifier");}
    public synchronized void claimLogin(String verifier)throws Exception{proof(verifier);save(request("claim-login","POST",body("verifier",verifier),null));}
    public synchronized void pair(String code,String verifier)throws Exception{
        proof(verifier);if(!code.matches("redpair_[a-f0-9]{64}"))throw new IllegalArgumentException("Invalid code");
        save(request("exchange","POST",body("verifier",verifier).put("code",code),null));
    }
    public synchronized JSONObject identity()throws Exception{
        JSONObject v=current(),result;
        try{result=request("me","GET",null,v.getString("accessToken"));}
        catch(HttpError e){if(e.status!=401)throw e;result=request("me","GET",null,rotate(v).getString("accessToken"));}
        if(result.getInt("version")!=2||!app.equals(result.getString("app"))||result.getString("id").isEmpty()||result.getJSONArray("scopes").length()!=1||!"identity:read".equals(result.getJSONArray("scopes").getString(0)))throw new IOException("Invalid identity");
        result.getString("name");Instant.parse(result.getString("expiresAt"));return result;
    }
    /** Local credential deletion happens even if remote logout fails; the
     * caller must show the failure and recommend revocation in RED ION. */
    public synchronized void logout()throws Exception{
        try{JSONObject v=current();request("logout","POST",null,v.getString("accessToken"));}
        finally{store.clear(scope);}
    }
}
