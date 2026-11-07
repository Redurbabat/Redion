# RED Morph — visual and motion contract

## Visual composition
- Content-first, not effect-first. Dense documents, tables and forms remain mostly opaque.
- Floating glass only where hierarchy benefits: mini-player, contextual dock, sheet, command surface.
- Prefer dynamic color sampled from artwork/content **only** where it doesn't reduce contrast.
- Do not imitate a specific third-party app or use Apple-owned assets/fonts/icons.
- Responsive: 360/390/430 px phone, tablet and desktop; keyboard opening must not obscure actions.
- Motion must communicate hierarchy and continuity: selection travels, cards expand, controls transform to their next role.
- Avoid neon grids, decorative 3D or animated backgrounds in productivity screens.

## Motion budgets
- Micro 100–180 ms; ordinary 180–300 ms; morph 280–520 ms; exceptional one-shot up to 800 ms.
- Native BBT-Bit guidelines prefer ~180–280 ms feedback and ~350–500 ms morphs.
- Springs must be interruptible and avoid overshoot on dense controls.
- No auto-playing motion unrelated to user action or active progress.
- Honor system Reduce Motion/Transparency, VoiceOver, Dynamic Type and high contrast.

## Platform mapping
- SwiftUI: use the existing SwiftPM package and its motion tokens. Prefer system material and matched geometry when supported; use platform fallbacks.
- React: use Touch Kit primitives, tokenized CSS and state-driven transitions; use View Transitions only with fallback.
- Cross-platform parity is behavioral, not pixel-perfect. No React component is a native SwiftUI component.

## Anti-patterns
- Gamification: XP, badges as rewards, missions, character levels.
- Permanent glass blur behind long text or forms.
- Glow as a default for every button.
- Hover-only reveal on phones.
- Unbounded animation or CPU/GPU-heavy particle effects on every screen.
- Misleading controls that simulate success or work.
