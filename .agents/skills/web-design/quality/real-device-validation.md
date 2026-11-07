# Real-Device Validation

Browser emulation is necessary but not sufficient for touch-, stylus-, keyboard-, viewport- and platform-sensitive UI.

## Validate on real hardware when relevant
- touch target acquisition and accidental taps
- stylus latency, pressure, tilt, palm behavior
- virtual keyboard / visual viewport
- safe areas, browser chrome and orientation
- trackpad/mouse hover and precision
- haptics
- performance, battery and thermal behavior
- native file/share/camera flows

Record what was measured in emulation versus real hardware. Never claim a device-specific behavior is verified when only viewport emulation was used.

Prioritize real-device checks for drawing, drag/drop, bottom bars, floating docks, sheets, camera/file input and viewport-keyboard interactions.