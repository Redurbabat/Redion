package ch.red.ecosystem.identity;

import android.content.Context;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.AtomicFile;
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import java.security.KeyStore;
import java.nio.charset.StandardCharsets;
import java.io.File;
import java.io.FileOutputStream;
import java.io.FileNotFoundException;
import java.util.Arrays;

/** Non-exportable AndroidKeyStore AES key; encrypted session in noBackupFilesDir.
 * No plaintext preferences, no backup/sync of credentials. */
public final class RedAndroidStore implements RedAndroidClient.Store {
    private final File root;
    public RedAndroidStore(Context context){
        root=new File(context.getApplicationContext().getNoBackupFilesDir(),"red-identity");
        if(!root.isDirectory()&&!root.mkdirs())throw new IllegalStateException("Cannot open credential directory");
    }
    private static void check(String scope){if(!scope.matches("[A-Za-z0-9_-]{43}"))throw new IllegalArgumentException("Invalid scope");}
    private AtomicFile file(String scope){check(scope);return new AtomicFile(new File(root,scope+".enc"));}
    private String alias(String scope){check(scope);return "red.identity.v2."+scope;}
    private KeyStore keystore()throws Exception{KeyStore ks=KeyStore.getInstance("AndroidKeyStore");ks.load(null);return ks;}
    private SecretKey key(String scope,boolean create)throws Exception{
        String name=alias(scope);KeyStore ks=keystore();
        java.security.Key existing=ks.getKey(name,null);
        if(existing instanceof SecretKey)return (SecretKey)existing;
        if(!create)throw new IllegalStateException("Credential key unavailable");
        KeyGenerator g=KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES,"AndroidKeyStore");
        g.init(new KeyGenParameterSpec.Builder(name,KeyProperties.PURPOSE_ENCRYPT|KeyProperties.PURPOSE_DECRYPT)
            .setBlockModes(KeyProperties.BLOCK_MODE_GCM).setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
            .setKeySize(256).setRandomizedEncryptionRequired(true).build());
        return g.generateKey();
    }
    @Override public synchronized String load(String scope)throws Exception{
        byte[] raw;try{raw=file(scope).readFully();}catch(FileNotFoundException e){return null;}
        if(raw.length<29||raw.length>65536||raw[0]!=1)throw new IllegalStateException("Invalid encrypted credential");
        Cipher c=Cipher.getInstance("AES/GCM/NoPadding");
        c.init(Cipher.DECRYPT_MODE,key(scope,false),new GCMParameterSpec(128,raw,1,12));
        c.updateAAD(scope.getBytes(StandardCharsets.UTF_8));
        byte[] plain=c.doFinal(raw,13,raw.length-13);
        try{return new String(plain,StandardCharsets.UTF_8);}finally{Arrays.fill(plain,(byte)0);}
    }
    @Override public synchronized void save(String scope,String value)throws Exception{
        byte[] plain=value.getBytes(StandardCharsets.UTF_8);
        if(plain.length>60000)throw new IllegalArgumentException("Credential too large");
        Cipher c=Cipher.getInstance("AES/GCM/NoPadding");byte[] encrypted;
        try{c.init(Cipher.ENCRYPT_MODE,key(scope,true));c.updateAAD(scope.getBytes(StandardCharsets.UTF_8));encrypted=c.doFinal(plain);}
        finally{Arrays.fill(plain,(byte)0);}
        byte[] iv=c.getIV();if(iv.length!=12)throw new IllegalStateException("Unexpected GCM nonce");
        AtomicFile dest=file(scope);FileOutputStream out=dest.startWrite();
        try{out.write(1);out.write(iv);out.write(encrypted);dest.finishWrite(out);}
        catch(Exception e){dest.failWrite(out);throw e;}
    }
    @Override public synchronized void clear(String scope)throws Exception{
        // Delete encryption key first so surviving encrypted bytes cannot be read.
        keystore().deleteEntry(alias(scope));file(scope).delete();
    }
}
