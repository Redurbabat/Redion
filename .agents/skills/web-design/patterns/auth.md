# Authentication Pattern

Prioritize trust, clarity and recovery.

Keep sign-in focused. Label identity and password/passkey fields clearly. Support password managers/autofill. Expose forgotten-credential recovery without shaming users.

Use platform-native passkeys/biometrics where available and appropriate; biometrics unlock credentials/authorization rather than replacing account semantics.

Errors should distinguish invalid input from network/system failure without leaking sensitive account information. Loading must prevent accidental duplicate submission.