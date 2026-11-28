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

### SDK 0.9: atomic pull and app-scoped RED Config

`createRedSync(client, scope, key, adapter, decode)` provides one explicit
pull cycle. Implement the adapter with a local transaction that compares
the generation, imports data, durably records conflicts and commits the
cursor together. If a fetch, validation or decryption fails, no cursor is
committed. Dirty records, rollbacks, missing objects and unauthenticated
tombstones are conflicts, never automatic destructive actions. The decoder
must return owned data, not a view of the temporary plaintext buffer.
Call pull from an app-controlled foreground/background scheduler, with
backoff; this package does not install one. Use a dedicated key and scope
per app and store kind. `createRedConfigContext` provides a deterministic
opaque ID and separate HKDF-derived key for theme, locale and reduced motion.
No secrets or arbitrary settings accepted. Grant Sync as before. Config is
app-scoped, not cross-app SSO or shared global preferences. Dispose keys when
not in use. Platform storage, native integration and actual conflict UI remain
app responsibilities.

When RED Config shares a sync feed with application records, pass a map of
exact record IDs to authenticated decoders (e.g. `new Map([[config.id,
config.open]])`) as the last `createRedSync` argument. Decoders must verify
context and ciphertext; the default path uses the app record key. Use
`createRedSyncCoordinator` for app lifecycle triggers, coalescing and bounded
exponential backoff. It does not create timers or continue after `stop`;
in-flight work must still be handled by the platform lifecycle.

### SDK 0.10: manual trusted-device storage-key transfer

`createRedDeviceKeyTransfer` uses ephemeral P-256 ECDH, HKDF-SHA256 and
AES-256-GCM. Exchange the two public offers on trusted devices and compare
the full 128-bit fingerprint independently before calling `confirm`.
The sender wraps an existing 32-byte app/kind storage key; the recipient
unwraps once and must save it in native secure storage. Never exchange the
fingerprint through an untrusted relay or automatically accept it. The
packet is bound to the offer transcript, origin, owner, app and kind.
No server receives the key; QR scanning, secure storage UI, key rotation
and automated recovery remain outside this helper. Restart a failed transfer
with new offers. The helper does not authenticate device ownership by itself.
