package ch.red.ecosystem.identity;

import android.content.Context;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import java.nio.file.*;
import java.nio.channels.FileChannel;
import java.nio.channels.FileLock;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import javax.crypto.*;
import javax.crypto.spec.GCMParameterSpec;
import java.util.Arrays;

/** Separate no-backup directory and Keystore namespace; no identity credentials.
 * Cooperating processes serialize key creation and publication. */
final class RedAndroidSyncKeyBackend implements RedAndroidSyncKeys.Backend {
    private static final Object PROCESS_LOCK=new Object();
    private final Path root;
    RedAndroidSyncKeyBackend(Context context){
        root=context.getApplicationContext().getNoBackupFilesDir().toPath().resolve("red-sync-keys-v1");
        try{Files.createDirectories(root);if(!Files.isDirectory(root,LinkOption.NOFOLLOW_LINKS))throw new IllegalStateException("Invalid key directory");}
        catch(java.io.IOException e){throw new IllegalStateException("Cannot open key directory",e);}
    }
    private static String alias(String id){
        if(!id.matches("[A-Za-z0-9_-]{43}"))throw new IllegalArgumentException("Invalid scope");
        return "red.sync.keys.v1."+id;
    }
    private Path file(String id){alias(id);return root.resolve(id+".enc");}
    private KeyStore keystore()throws Exception{KeyStore ks=KeyStore.getInstance("AndroidKeyStore");ks.load(null);return ks;}
    private interface Action<T>{T run()throws Exception;}
    private <T>T locked(Action<T> action)throws Exception{
        synchronized(PROCESS_LOCK){
            try(FileChannel channel=FileChannel.open(root.resolve(".lock"),StandardOpenOption.CREATE,StandardOpenOption.WRITE);
                FileLock lock=channel.lock()){return action.run();}
        }
    }
    private byte[] read(String id)throws Exception{
        Path file=file(id);
        if(Files.notExists(file,LinkOption.NOFOLLOW_LINKS))return null;
        if(!Files.isRegularFile(file,LinkOption.NOFOLLOW_LINKS)||Files.size(file)!=61)throw new IllegalStateException("Invalid encrypted key file");
        byte[] raw=new byte[61];
        try(FileChannel input=FileChannel.open(file,StandardOpenOption.READ)){
            ByteBuffer buffer=ByteBuffer.wrap(raw);
            while(buffer.hasRemaining()){if(input.read(buffer)<0)throw new IllegalStateException("Incomplete encrypted key");}
            if(input.size()!=61||raw[0]!=1)throw new IllegalStateException("Invalid encrypted key");
        }
        java.security.Key wrapping=keystore().getKey(alias(id),null);
        if(!(wrapping instanceof SecretKey))throw new IllegalStateException("Wrapping key unavailable");
        Cipher cipher=Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.DECRYPT_MODE,(SecretKey)wrapping,new GCMParameterSpec(128,raw,1,12));
        cipher.updateAAD(id.getBytes(StandardCharsets.US_ASCII));
        return cipher.doFinal(raw,13,48);
    }
    public byte[] load(String id)throws Exception{return locked(()->read(id));}
    public boolean insertIfAbsent(String id,byte[] value)throws Exception{
        if(value.length!=32)throw new IllegalArgumentException("Invalid key");
        return locked(()->{
            Path dest=file(id);
            if(!Files.notExists(dest,LinkOption.NOFOLLOW_LINKS))return false;
            String alias=alias(id);
            // Missing ciphertext with an existing wrapping key may mean loss
            // or an interrupted installation. Never silently replace it.
            if(keystore().containsAlias(alias))throw new IllegalStateException("Key recovery required");
            KeyGenerator generator=KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES,"AndroidKeyStore");
            generator.init(new KeyGenParameterSpec.Builder(alias,KeyProperties.PURPOSE_ENCRYPT|KeyProperties.PURPOSE_DECRYPT)
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM).setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                .setKeySize(256).setRandomizedEncryptionRequired(true).build());
            SecretKey wrapping=generator.generateKey();
            Cipher cipher=Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE,wrapping);
            cipher.updateAAD(id.getBytes(StandardCharsets.US_ASCII));
            byte[] iv=cipher.getIV(),encrypted=cipher.doFinal(value);
            if(iv.length!=12||encrypted.length!=48)throw new IllegalStateException("Invalid encrypted key");
            Path stage=Files.createTempFile(root,".stage-",".enc");
            try{
                ByteBuffer data=ByteBuffer.allocate(61).put((byte)1).put(iv).put(encrypted);
                data.flip();
                try(FileChannel out=FileChannel.open(stage,StandardOpenOption.WRITE)){
                    while(data.hasRemaining())out.write(data);
                    out.force(true);
                }
                Files.createLink(dest,stage); // no replacement
                return true;
            }finally{Files.deleteIfExists(stage);Arrays.fill(encrypted,(byte)0);}
        });
    }
}
