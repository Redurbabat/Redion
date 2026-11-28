package ch.red.ecosystem.identity;
import org.junit.Test;
import static org.junit.Assert.*;
import org.json.JSONObject;
import java.util.HashMap;
import java.time.Instant;
public class RedAndroidClientTest {
    @Test public void shareInterop()throws Exception{
        byte[] key=new byte[32];for(int i=0;i<32;i++)key[i]=(byte)i;
        JSONObject message=new JSONObject().put("source","red-poly").put("channel","progress").put("id","ab".repeat(16)).put("expires",System.currentTimeMillis()+60000).put("envelope","AAECAwQFBgcICQoLPCCgfreWq3TjY626ncscDPe3pQ6LWTwTVReJ4GkMZJA7JdOBAzc9bkALwlMYEGiQhNYF2Q");
        byte[] clear=RedAndroidShare.open(key,"red-ion",message);
        assertEquals("{\"version\":1,\"data\":{\"completed\":5}}",new String(clear,java.nio.charset.StandardCharsets.UTF_8));
        try{RedAndroidShare.open(key,"red-bit",message);fail("accepted wrong target");}catch(javax.crypto.AEADBadTagException expected){}
        var p=RedAndroidShare.prepare(key,"red-poly","red-ion","progress",clear);
        assertArrayEquals(clear,RedAndroidShare.open(key,"red-ion",message.put("id",p.id).put("envelope",p.envelope)));
    }
    @Test public void proofAndOrigin()throws Exception{
        var p=RedAndroidClient.makeProof();
        assertEquals(43,p.verifier.length());assertEquals(43,p.challenge.length());
        assertNotEquals(p.verifier,RedAndroidClient.makeProof().verifier);
        assertFalse(RedAndroidClient.pairingRequest("red-fit",p.challenge).contains(p.verifier));
        assertNotEquals(RedAndroidClient.scope("https://home.example.test","red-fit"),RedAndroidClient.scope("https://home.example.test","red-poly"));
        for(String bad:new String[]{"http://home.example.test","https://home.example.test/path","https://user@home.example.test","https://home.example.test:443"}) {
            try{RedAndroidClient.scope(bad,"red-fit");fail("Accepted invalid origin");}catch(IllegalArgumentException expected){}
        }
    }
    @Test public void claimRotateAndLogout()throws Exception{
        var data=new HashMap<String,String>();
        RedAndroidClient.Store store=new RedAndroidClient.Store(){
            public String load(String k){return data.get(k);}
            public void save(String k,String v){data.put(k,v);}
            public void clear(String k){data.remove(k);}
        };
        String expiry=Instant.now().plusSeconds(900).toString(), refresh=Instant.now().plusSeconds(3600).toString();
        String a="redat_"+"a".repeat(64), b="redat_"+"b".repeat(64);
        int[] rotations={0};
        var client=new RedAndroidClient("https://home.example.test","red-fit",store,(url,method,body,token)->{
            assertTrue(url.startsWith("https://home.example.test/red-id/v2/"));
            if(url.endsWith("/me")){
                if(a.equals(token))throw new RedAndroidClient.HttpError(401);
                assertEquals(b,token);return new JSONObject().put("version",2).put("app","red-fit").put("id","owner").put("name","Owner").put("expiresAt",expiry).put("scopes",new org.json.JSONArray().put("identity:read"));
            }
            if(url.endsWith("/logout")){assertEquals(b,token);return new JSONObject();}
            boolean rotate=url.endsWith("/refresh");
            if(rotate)rotations[0]++;
            else assertTrue(url.endsWith("/claim-login"));
            return new JSONObject().put("version",2).put("app","red-fit").put("accessToken",rotate?b:a).put("refreshToken","redrt_"+(rotate?"d":"c").repeat(64)).put("expiresAt",expiry).put("refreshExpiresAt",refresh).put("scopes",new org.json.JSONArray().put("identity:read"));
        });
        client.claimLogin(RedAndroidClient.makeProof().verifier);
        assertEquals("owner",client.identity().getString("id"));assertEquals(1,rotations[0]);
        client.logout();assertTrue(data.isEmpty());
    }
}
