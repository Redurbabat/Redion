package ch.red.ecosystem.identity;
import org.junit.Test;
import static org.junit.Assert.*;
import java.util.HashMap;
import java.util.Arrays;
public class RedAndroidSyncKeysTest {
    private final String origin="https://home.example.test",owner="owner",app="red-ion";
    private final RedAndroidSyncKeys.Purpose sync=RedAndroidSyncKeys.Purpose.sync;
    @Test public void scopeIsolation()throws Exception{
        String id=RedAndroidSyncKeys.scope(origin,owner,app,sync);
        assertEquals(43,id.length());
        assertNotEquals(id,RedAndroidClient.scope(origin,app));
        assertNotEquals(id,RedAndroidSyncKeys.scope(origin,"other",app,sync));
        assertNotEquals(id,RedAndroidSyncKeys.scope(origin,owner,"red-fit",sync));
        assertNotEquals(id,RedAndroidSyncKeys.scope("https://other.example.test",owner,app,sync));
        assertNotEquals(id,RedAndroidSyncKeys.scope(origin,owner,app,RedAndroidSyncKeys.Purpose.file));
        assertNotEquals(id,RedAndroidSyncKeys.scope(origin,owner,app,RedAndroidSyncKeys.Purpose.localSync));
        assertThrows(IllegalArgumentException.class,()->RedAndroidSyncKeys.scope(origin,"",app,sync));
    }
    @Test public void insertOnlyAndCorruption()throws Exception{
        var entries=new HashMap<String,byte[]>();
        var backend=new RedAndroidSyncKeys.Backend(){
            public byte[] load(String id){byte[] v=entries.get(id);return v==null?null:v.clone();}
            public boolean insertIfAbsent(String id,byte[] v){return entries.putIfAbsent(id,v.clone())==null;}
        };
        var store=new RedAndroidSyncKeys(backend);
        byte[] key=new byte[32],other=new byte[32];Arrays.fill(key,(byte)7);Arrays.fill(other,(byte)8);
        assertNull(store.load(origin,owner,app,sync));
        store.install(key,origin,owner,app,sync);store.install(key,origin,owner,app,sync);
        assertThrows(IllegalStateException.class,()->store.install(other,origin,owner,app,sync));
        assertArrayEquals(key,store.load(origin,owner,app,sync));
        assertNull(store.load(origin,owner,app,RedAndroidSyncKeys.Purpose.file));
        assertThrows(IllegalArgumentException.class,()->store.install(new byte[1],origin,owner,app,sync));
        String id=RedAndroidSyncKeys.scope(origin,owner,app,sync);
        entries.put(id,new byte[]{1});
        assertThrows(IllegalStateException.class,()->store.load(origin,owner,app,sync));
        assertThrows(IllegalStateException.class,()->store.install(key,origin,owner,app,sync));
        assertArrayEquals(new byte[]{1},entries.get(id));
    }
}
