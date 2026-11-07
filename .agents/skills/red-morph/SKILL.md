---
name: red-morph
description: Build and audit professional, non-gamified apps using the RED Morph visual language derived from BBT-Bit, Redion and the UI-Kit. Use for new screens, components, motion, navigation, and visual cleanup across SwiftUI and React.
---

> **Redion-Kontext:** Redions `CLAUDE.md`, `AGENTS.md` und `.agents/skills/redion-red-morph/SKILL.md` haben Vorrang. Ursprüngliche `skills/`-/`docs/`-Pfade liegen hier unter `.agents/skills/` und `doku/red-morph-referenz/docs/`. Keine RED-Morph-Runtime übernommen.


# RED Morph — universal design and implementation skill

## Product contract
Create serious, useful, distinctive software: BBT-Bit's tactile precision and seamless player transitions combined with Redion's information density, offline-first reliability and restraint. No gamification, XP, streaks-as-rewards, fake 3D decoration, arbitrary glowing, generic dashboard templates or perpetual ambient animations. **Premium does not mean every surface is glass.**

Use this skill for new RED products and when refactoring existing RED screens. This is a portable skill, not a new runtime framework. Existing `skills/web-design/`, `.claude/skills/touch-kit/`, and `native/swiftui/` remain canonical runtime resources.

## Mandatory discovery (before code)
1. Identify target platform, runtime, minimum OS, primary task, user density, input modes, offline/data constraints and existing architecture.
2. Inspect real code, not screenshots alone. Read `AGENTS.md`, `AI_START_HERE.md`, `docs/design/UI_LANGUAGE.md`, `docs/design/MOTION.md`.
3. For native Apple: `native/swiftui/README.md`, `docs/native-swiftui/UX_RULES.md`, `docs/native-swiftui/MOTION.md`, `docs/native-swiftui/INTEGRATION_STATUS.md`, and `native/swiftui/Sources/`. Consult the four `.claude/skills/swiftui-*/` skills as appropriate.
4. For React/web: `app/src/touch/README.md`, `skills/web-design/SKILL.md`, and the relevant platform/quality references.
5. Distinguish prototype/lab from production-ready component; do not claim a React preview is SwiftUI or a simulated demo is functional.
6. Inventory duplicate components, motion tokens, layout systems, old demos and dependencies. Produce a KEEP / REWORK / ARCHIVE / DELETE-CANDIDATE table before touching any existing component.

## Style DNA
- Calm at rest, expressive on direct interaction; purpose before spectacle.
- Material hierarchy: opaque content surfaces; glass for floating chrome, contextual controls and transient overlays only.
- Light and dark themes, semantic color roles, accessible contrast, no hardcoded random gradients.
- Typography: system fonts, meaningful hierarchy, tabular numerals for amounts and tables.
- Geometry: small stable radii for dense productivity; capsules for controls; rounded artwork/cards where content justifies it.
- Depth: surface / raised / floating / active; blur, shadows and 3D are budgeted effects, not defaults.
- Brand can vary by app; interaction language, accessibility and motion remain consistent.
- Iconography must be legible, not proprietary copied glyphs.

## Motion choreography (choose the smallest effective effect)
| Intent | Technique | Target |
| --- | --- | --- |
| Press/selection feedback | spring compression or opacity | 100–180 ms |
| Tab or filter switch | directional selection pill, content continuity | 180–300 ms |
| Card → detail | shared element / matched geometry, interruptible | 280–520 ms |
| Sheet/palette | gesture-tracked spring with snap points | 180–520 ms |
| Loading | progress tied to real work, cancellable | while active |
| Success/error | one short stateful response, no celebration loop | <= 800 ms |

Motion invariants: every transition has a trigger, source, destination and stable final state; interruption preserves usable state; no false completion; no background animation when idle. Use transforms/opacity where possible; budget blur and GPU effects. Respect Reduce Motion and Reduce Transparency, and provide meaningful non-animated state changes.

## Component acceptance contract
Each reusable component must specify:
- public API, controlled/uncontrolled state ownership, callback semantics, disabled/loading/error/empty states
- touch, mouse, keyboard, screen reader, focus entry and focus return
- iPhone touch target >= 44×44 pt; no hover-only controls
- reduced-motion, reduced-transparency and high-contrast behavior
- light/dark themes, dynamic type, narrow phone and desktop/tablet layouts
- async truth: no optimistic success without actual completion; cancellation and recovery
- minimum example in native SwiftUI or React (never imply interchangeable source)
- unit/interaction tests and a visual verification checklist

## Decision workflow
1. Explain the user task and what should remain static.
2. Choose one **Calm**, one **Premium** and one **Expressive** interaction proposal; implement **Premium** by default unless task density favors Calm.
3. Reuse existing tokens and primitives. Create a new primitive only if its API and usage justify it.
4. Implement the real state machine first; add choreography second.
5. Validate focus, gestures, latency, frame pacing, reduced motion, accessibility and data integrity.
6. Report evidence: files changed, actual tests executed, remaining device/platform checks.

## Rules for cleanup
- Never mass-delete experiments, archives or skills based on visual preference.
- Classify as KEEP (production reusable), REWORK (good concept, poor semantics), ARCHIVE (interesting lab only), DELETE-CANDIDATE (proven duplicate, broken, unreferenced).
- A DELETE-CANDIDATE requires references/search, license provenance, tests, screenshots and explicit maintainer approval before deletion.
- Preserve API compatibility or provide a documented migration; do not overwrite product data.
- Keep experimental galleries isolated from production exports.
- Avoid GPL/AGPL code copying into MIT projects without license review. Preserve attribution.

## Deliverables per new app
1. Product intent + screen map and responsive shell
2. Tokens + motion choreography map
3. Reusable component inventory and API contracts
4. Functional prototypes with real interactions
5. Accessibility/performance/offline test matrix
6. Migration/cleanup table and verification log

## Reference files
- `references/STYLE_CONTRACT.md` — product-wide design constraints
- `references/COMPONENT_CONTRACT.md` — component checklist and acceptance
- `references/REPO_AUDIT.md` — UI-Kit inventory and safe cleanup decisions
- `docs/design/RED_MORPH_SYSTEM.md` — repository adoption and rollout
