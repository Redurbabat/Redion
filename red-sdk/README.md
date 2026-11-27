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
