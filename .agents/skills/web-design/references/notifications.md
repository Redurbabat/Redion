# Notifications, Toasts and Banners

Use the least disruptive feedback channel.

- toast: transient confirmation that needs no decision
- inline message: feedback tied to local content/input
- banner: persistent page/system condition
- notification center/inbox: events users may need later
- modal alert: only when immediate decision/interruption is justified

Toasts must not contain essential information that disappears before it can be acted on. Avoid stacking many simultaneous toasts. Provide undo for reversible destructive actions when appropriate.

Motion should communicate arrival/removal without stealing focus.