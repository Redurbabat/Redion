# Capability Truth

UI must not imply a capability merely because a visual control exists.

Before exposing camera, share, print, haptics, stylus prediction, filesystem, sync, AI tool or native integration, verify runtime support and permissions.

Distinguish:
- supported and ready
- supported but permission/setup required
- temporarily unavailable
- unsupported on this platform/runtime

Hide or explain unavailable capabilities according to importance. Never label decorative/simulated values as real measurements or real progress.

When capability depends on real hardware, document that emulation cannot verify it.