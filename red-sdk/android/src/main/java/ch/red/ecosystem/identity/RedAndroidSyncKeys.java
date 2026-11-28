package ch.red.ecosystem.identity;

import android.content.Context;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.Arrays;
import org.json.JSONArray;

/** Explicit insert-only storage. Never generates a missing data key. */
public final class RedAndroidSyncKeys {
    public enum Purpose { sync, file, localSync }
    interface Backend {
        byte[] load(String scope) throws Exception;
        boolean insertIfAbsent(String scope,byte[] value) throws Exception;
    }
    private final Backend backend;
    public RedAndroidSyncKeys(Context context){this(new RedAndroidSyncKeyBackend(context));}
    RedAndroidSyncKeys(Backend backend){this.backend=backend;}
    public static String scope(String origin,String owner,String app,Purpose purpose)throws Exception{
        String identity=RedAndroidClient.scope(origin,app);
        if(owner==null||owner.isEmpty()||owner.length()>128||purpose==null)throw new IllegalArgumentException("Invalid key scope");
        String context=new JSONArray().put("red-android-sync-key-v1").put(identity).put(owner).put(purpose.name()).toString();
        return Base64.getUrlEncoder().withoutPadding().encodeToString(MessageDigest.getInstance("SHA-256").digest(context.getBytes(StandardCharsets.UTF_8)));
    }
    public byte[] load(String origin,String owner,String app,Purpose purpose)throws Exception{
        byte[] key=backend.load(scope(origin,owner,app,purpose));
        if(key!=null&&key.length!=32){Arrays.fill(key,(byte)0);throw new IllegalStateException("Invalid stored key");}
        return key;
    }
    public void install(byte[] key,String origin,String owner,String app,Purpose purpose)throws Exception{
        if(key==null||key.length!=32)throw new IllegalArgumentException("Invalid key");
        String id=scope(origin,owner,app,purpose);
        byte[] copy=key.clone();
        try{
            if(backend.insertIfAbsent(id,copy))return;
            byte[] existing=backend.load(id);
            try{
                if(existing==null||existing.length!=32)throw new IllegalStateException("Stored key unavailable");
                if(!MessageDigest.isEqual(existing,copy))throw new IllegalStateException("Existing different key");
            }finally{if(existing!=null)Arrays.fill(existing,(byte)0);}
        }finally{Arrays.fill(copy,(byte)0);}
    }
}
