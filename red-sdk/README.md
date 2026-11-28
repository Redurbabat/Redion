# RED SDK v0.3 – private app identity

Build from the RED ION repository root:

```sh
npm ci
npm --prefix red-sdk run build
npm --prefix red-sdk pack
```

The SDK exports compiled ESM and TypeScript declarations. Install the locally
packed, reviewed tarball in the target app; it is not published to a registry.
Pin the package version and source commit. Each target app must implement
its own native secure-store adapter (iOS Keychain, platform credential vault).
Never store a RED credential in source control, a URL, logs or localStorage.

```ts
import { createRedPairProof, createRedIdV2Client } from '@red-ecosystem/sdk';
// The target app creates the verifier locally and displays only the challenge.
const { verifier, challenge } = await createRedPairProof();
// Display challenge to the owner; obtain the one-time code in RED ION settings.
// Keep verifier in memory, then call client.pair(code, verifier).
// NativeSecureStore is the target app's own secure credential-store adapter.
const client = createRedIdV2Client('https://your-private-server.example', 'red-fit', NativeSecureStore);
```

The 15-minute access token and 30-day maximum refresh session only authorize
identity:read. There is no implicit access to another app's documents,
no user-password login, no public registration or automatic data sharing.
The owner can revoke app sessions in RED ION. Native integration, QR scanning
and secure-storage adapters must be implemented and tested in each app.

SDK 0.3 adds QR request payload encoding, explicit app sharing transport and
AES-GCM helpers; independent secure key distribution remains required.

SDK 0.4 adds proof-bound login claim, a platform-secret-store adapter scoped to
origin and app, and P-256 ECDH/HKDF key exchange with explicit fingerprint
comparison on both trusted devices. Never confirm fingerprints from a relay.

### Native Apple SDK

For Swift applications, add `red-sdk/apple` as a local Swift package pinned
to the reviewed commit. `RedNativeClient` uses the device-only Keychain by
default. It supports PKCE, direct approval claims, legacy pairing, rotating
refresh and logout. It does not yet implement native RED Share or QR UI.

### Native Android SDK

See `red-sdk/android/README.md` for Gradle library, encrypted AndroidKeyStore
credential adapter, proof creation, claim, refresh and logout. Unit tests
use an injected transport; physical-device Keystore tests remain open.

Browser pilot: `@red-ecosystem/sdk/browser` provides an opt-in memory-only
identity client. The home server must explicitly allow the exact controlled
web origin. This client does not persist tokens or share app data.

SDK 0.6 native Share: Swift `RedNativeShare` and Java `RedAndroidShare`
produce the same AES-GCM wire format as TypeScript. The same deterministic
fixture is tested in all three implementations. Native client send/inbox/ACK
methods use the existing per-app credentials and explicit grants. App-level
key storage, key confirmation UI, business schema validation and atomic
local receipt/import remain application responsibilities.

### RED Sync / Files SDK 0.7

Use `newRedStoreId`, `prepareRedStoreWrite`, `storePut`, `storeList`,
`storeGet`, `openRedStoreRecord`, and `storeDelete`. Explicit owner grants
are required per app/kind. Preserve the original operation on retry.
On HTTP 409 fetch the latest record and ask the user or perform a verified
domain merge; never blindly rebase the local revision. Record keys remain
outside the server. File objects are small (44,000 plaintext bytes), not a
streaming file system. Browser-only identity clients remain identity-only.

### SDK 0.8: incremental RED Sync

Call `storeChanges(kind, cursor)` to retrieve metadata for only changed
objects (including tombstones). `reset:true` requires reconciliation
against the complete bounded metadata inventory. Fetch and authenticate
ciphertext with `storeGet` / `openRedStoreRecord`. Fetch may return a newer
revision; never overwrite pending local edits automatically. Apply records
and persist the returned cursor in one local transaction. An unknown cursor
(e.g. after restore) causes a fresh snapshot rather than silent data loss.
No credentials, encryption keys or plaintext are included in the feed.
