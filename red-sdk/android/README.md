# Native Android RED ID

Android API 26+, Java 17. Build `gradle -p red-sdk/android testDebugUnitTest assembleDebug`.
Use the reviewed AAR or local Gradle library from the same pinned commit.
Construct RedAndroidClient with the exact HTTPS origin, app identifier and
RedAndroidStore(context). Use a single client on a background worker; never
block the UI thread. makeProof → pairingRequest → owner approval → claimLogin.
The AndroidKeyStore key is non-exportable, credentials are encrypted with
AES-GCM in the app's no-backup directory. No custom CA bypass, no redirect,
no plaintext SharedPreferences. Device tests of hardware-backed availability,
lock-screen behavior and key invalidation remain necessary. API does not
provide native QR UI, cross-app payload transport, or browser OAuth SSO.

## Separate Sync-Schlüssel

`RedAndroidSyncKeys` stores explicit 32-byte data keys in a separate no-backup directory, encrypted by per-scope non-exportable AndroidKeyStore AES-GCM wrapping keys. Scope includes origin, owner, app, purpose. Insert-only; no overwrite, automatic generation of data keys, deletion or rotation. A process/file lock serializes cooperating callers; hard-link publication never replaces an existing file. Missing ciphertext with an existing wrapping key fails closed (including interrupted first installation); explicit recovery is not yet implemented. JVM tests use an injected backend; physical device tests, filesystem hard-link availability, secure transfer and app integration remain open.
