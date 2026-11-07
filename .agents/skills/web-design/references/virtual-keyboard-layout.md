# Virtual Keyboard and Visual Viewport

Mobile/tablet layouts must respond to the visual viewport when the software keyboard appears.

## Rules
Keep the active field/composer and its critical actions visible. Do not blindly translate the entire fixed UI upward by a guessed keyboard height.

Use platform/browser viewport signals when available, safe-area insets and measured occlusion. Recompute floating docks/sheets against the visible viewport.

Avoid double compensation when the browser already resizes layout. Test orientation changes, hardware keyboard attach/detach and focus moving between fields.

Real-device validation is required before claiming keyboard-safe behavior.