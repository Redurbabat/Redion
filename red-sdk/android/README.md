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
