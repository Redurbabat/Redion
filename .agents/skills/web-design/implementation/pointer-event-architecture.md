# Pointer Event Architecture

Prefer a unified pointer-event model for interactions that must support mouse, touch and pen, then specialize only where modality provides meaningful capabilities.

Use pointer identity/type, capture, pressure/tilt where relevant, and cancellation semantics deliberately. CSS touch-action should declare which browser gestures remain native.

For direct manipulation:
- capture after the component legitimately owns the gesture;
- release on completion/cancel;
- handle pointercancel;
- do not assume pointerup always arrives on the original element;
- separate visual preview from committed state.

High-frequency drawing/manipulation may consume coalesced samples where supported. Predicted samples are speculative presentation data and must not become irreversible source truth.

Never infer real stylus quality from mouse emulation.