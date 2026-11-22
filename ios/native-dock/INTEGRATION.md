# Native iOS 26 Dock — Integration Gate

This branch introduces an **opt-in, non-wired SwiftUI shell** as a starting point, not a production replacement.

## Existing app
- The repository's `ios/fixtures/capacitor8-spm-scenedelegate.swift` creates `CAPBridgeViewController` as the window root.
- Replacing it immediately would risk breaking Capacitor plugins, deep links, sharing, and the existing web router.

## Implementation requirements before activation
1. Determine the actual generated iOS project and SceneDelegate installation process.
2. Implement a typed bidirectional bridge for `navigate`, `navigationChanged`, and `ready` with input validation.
3. Keep one Capacitor controller and one web session; do not create a separate web view per tab.
4. Make web bottom navigation conditional on a verified native-shell handshake, never on user-agent detection alone.
5. Reconcile web bottom safe area with the system tab bar; test keyboard, editors, and scroll.
6. Retain the existing root controller on iOS < 26 or when native-shell feature flag is off.
7. Test deep links, file imports, sharing, login, offline persistence, and MCP actions.
8. Run an iOS build on macOS with Xcode; verify on physical iPhone.

## Current status
- SwiftUI shell prototype: added.
- Production wiring: not done.
- Tests and IPA: not run.
- No existing application behavior changed.

## Reference
- Apple: https://developer.apple.com/documentation/swiftui/tabview
- Apple: https://developer.apple.com/documentation/technologyoverviews/adopting-liquid-glass
