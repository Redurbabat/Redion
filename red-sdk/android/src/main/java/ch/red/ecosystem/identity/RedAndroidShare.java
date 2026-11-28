package ch.red.ecosystem.identity;
import java.util.Arrays;
import java.util.Base64;
import java.util.UUID;
import java.nio.charset.StandardCharsets;
import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;
import javax.crypto.spec.GCMParameterSpec;
import org.json.JSONArray;
import org.json.JSONObject;

public final class RedAndroidShare {
    private RedAndroidShare(){}
    private static final java.util.Set<String> APPS=new java.util.HashSet<>(Arrays.asList("red-ion","red-fit","red-poly","red-bit","red-loop","red-efz","red-kurd","red-uhr","red-yt","stran","babat-red"));
    public static final class Prepared {
        public final String source,target,channel,id,envelope;
        Prepared(String s,String t,String c,String i,String e){source=s;target=t;channel=c;id=i;envelope=e;}
    }
    static void validate(String s,String t,String c,String i){
        if(!APPS.contains(s)||!APPS.contains(t)||s.equals(t)||!c.matches("[a-z][a-z0-9_-]{0,31}")||!i.matches("[a-f0-9]{32}"))throw new IllegalArgumentException("Invalid address");
    }
    private static byte[] aad(String s,String t,String c,String i){
        validate(s,t,c,i);return new JSONArray().put("red-share-v1").put(s).put(t).put(c).put(i).toString().getBytes(StandardCharsets.UTF_8);
    }
    static byte[] decode(String value){
        if(!value.matches("[A-Za-z0-9_-]{38,60000}"))throw new IllegalArgumentException("Invalid envelope");
        byte[] v=Base64.getUrlDecoder().decode(value);
        if(v.length<28||!Base64.getUrlEncoder().withoutPadding().encodeToString(v).equals(value))throw new IllegalArgumentException("Invalid envelope");
        return v;
    }
    private static void json(byte[] bytes)throws Exception{
        String text=StandardCharsets.UTF_8.newDecoder().decode(java.nio.ByteBuffer.wrap(bytes)).toString();
        JSONObject v=new JSONObject(text);
        if(v.getInt("version")!=1||!v.has("data"))throw new IllegalArgumentException("Invalid JSON payload");
    }
    public static Prepared prepare(byte[] key,String source,String target,String channel,byte[] json)throws Exception{
        if(key.length!=32||json.length>44000)throw new IllegalArgumentException("Invalid key or data");
        json(json);String id=UUID.randomUUID().toString().replace("-","");
        Cipher c=Cipher.getInstance("AES/GCM/NoPadding");
        byte[] nonce=new byte[12];new java.security.SecureRandom().nextBytes(nonce);
        c.init(Cipher.ENCRYPT_MODE,new SecretKeySpec(key,"AES"),new GCMParameterSpec(128,nonce));
        c.updateAAD(aad(source,target,channel,id));
        byte[] payload=c.doFinal(json),combined=Arrays.copyOf(nonce,12+payload.length);
        System.arraycopy(payload,0,combined,12,payload.length);
        return new Prepared(source,target,channel,id,Base64.getUrlEncoder().withoutPadding().encodeToString(combined));
    }
    public static byte[] open(byte[] key,String target,JSONObject message)throws Exception{
        if(key.length!=32||message.getLong("expires")<=System.currentTimeMillis())throw new IllegalArgumentException("Invalid or expired message");
        byte[] raw=decode(message.getString("envelope"));
        Cipher c=Cipher.getInstance("AES/GCM/NoPadding");
        c.init(Cipher.DECRYPT_MODE,new SecretKeySpec(key,"AES"),new GCMParameterSpec(128,raw,0,12));
        c.updateAAD(aad(message.getString("source"),target,message.getString("channel"),message.getString("id")));
        byte[] result=c.doFinal(raw,12,raw.length-12);json(result);return result;
    }
}
