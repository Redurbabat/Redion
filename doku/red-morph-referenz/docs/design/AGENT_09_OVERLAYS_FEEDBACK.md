# Agent 09 — Overlays & Feedback

Scope: `app/src/components/overlays-feedback/`. No global configuration or runtime registry modifications.

## Inventory and reuse decision

| Existing system | Decision | Reason |
| --- | --- | --- |
| `app/src/touch/` | KEEP | Portable kit; no changes or coupling |
| `app/src/components/` | KEEP | Existing experiments retained |
| Shared design tokens and motion rules | REUSE | Semantic text token, focus and reduced-motion conventions |
| New transient feedback family | ADD | Namespaced standalone React components; no global CSS |

## Components

1. FluidBottomSheet — modal bottom-anchored panel
2. GlassContextMenu — menu surface with escape dismissal
3. CompactToast — live status notification
4. InteractiveNotification — actionable notification
5. FloatingConfirmationPanel — contextual confirmation
6. CommandOverlay — modal command input
7. PopoverWithDepth — contextual floating content
8. InlineSuccessState — success status
9. AccessibleAlertDialog — keyboard-operable dialog
10. LoadingStateTransition — busy state
11. ProgressOverlay — bounded native progress
12. UndoSnackbar — reversible feedback
13. MaterialTooltip — focus and hover hint
14. SelectionActionBar — bulk action context
15. SearchOverlay — client-side filtered search
16. DragConfirmation — explicit drop confirmation
17. ModalToPageMorph — larger responsive dialog
18. ErrorRecoveryPanel — explicit retry
19. KeyboardShortcutHUD — shortcut reference
20. FeedbackSystemPlayground — interactive gallery

## Usage

```tsx
import { AccessibleAlertDialog, FeedbackSystemPlayground } from './components/overlays-feedback';

<AccessibleAlertDialog
  open={open}
  onClose={() => setOpen(false)}
  title="Delete item?"
  action={{ label: 'Confirm', onClick: confirmDelete }}
/>
<FeedbackSystemPlayground />
```

The gallery is a standalone export rather than a global app-route change. Integrators can mount it in an existing route.

## Interaction contract

The modal layer uses a backdrop, Escape handling, initial close-button focus, focus restoration, a simple Tab loop and scroll locking. Native buttons and inputs provide keyboard and touch activation. Toasts and status panels expose status roles; error recovery uses alert. The gallery provides live triggers for each of the 19 patterns.

## Limitations / integration follow-up

This is a candidate implementation, not a verified production accessibility claim. A full production dialog should use an established tested focus-scope primitive for nested portals and complex composite widgets. Context menus need full roving keyboard navigation, pointer anchoring and dismissal on outside clicks. Modal-to-page morph currently varies geometry rather than implementing shared-element animation. Toast lifetime is controlled by the consumer; no fabricated async completion. The gallery is not yet registered in the existing global component registry.

## Verification checklist

- Run `cd app && npm ci && npm run build && npm run test:unit`.
- Test keyboard Tab / Shift+Tab / Escape and focus restoration.
- Test 360px / 390px / 1280px widths and long labels.
- Test reduced motion, reduced transparency, forced colors and screen reader announcements.
- Inspect focus containment with nested interactive children.
