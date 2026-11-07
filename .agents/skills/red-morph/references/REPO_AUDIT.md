# UI-Kit audit — 2026-11-04

Basis: GitHub `Redurbabat/UI-Kit` main, repository README, AGENTS, AI_START_HERE, design docs, native SwiftUI integration docs and root directory listing. This is a **documentation and structure audit**, not a completed source-level dead-code analysis, screenshot review or device test.

| Existing area | Classification | Rationale / next action |
| --- | --- | --- |
| `native/swiftui/` | KEEP + VERIFY | Native SwiftPM core exists; 47-file archive is not fully imported; do not claim full native parity. Run Xcode/SwiftPM tests on macOS. |
| `app/src/touch/` | KEEP + REWORK | Portable React Touch Kit; reuse tokens and motion. Audit exports and remove only proven duplication. |
| `skills/web-design/` | KEEP | Broad reference router with quality gates; not a duplicate of product-specific RED Morph skill. |
| `.claude/skills/touch-kit/` | KEEP | Installed by current Touch Kit workflow. |
| `.claude/skills/swiftui-*/` | KEEP | Four native skills for component, motion, UX and ideas. |
| `#/bbt-interactions` | ARCHIVE AS LAB (retain) | 38 interactive simulated studies, not production audio components. Keep for inspiration and testing. |
| `#/bbt-bit` | ARCHIVE AS LAB (retain) | Separate 18-interaction prototype, simulated data. |
| `#/swiftui` | KEEP AS WEB PREVIEW | 30 React previews, not a native SwiftUI runtime. |
| `#/creative`, `#/astra` | KEEP AS LAB, REVIEW | Isolate experiments from production component exports. Classify decorative effects individually after code/screenshot review. |
| `#/redion` 3D models | KEEP AS LAB, REVIEW | Specialized 3D hardware demos; not default visual language for professional apps. CDN dependency must be removed before offline integration. |
| `#/studio` | KEEP | Useful design authoring workflow; separate from production runtime. |
| `app/tmp-review-glass.html` | DELETE-CANDIDATE | Name suggests temporary review artifact. Confirm imports, tests and references before deletion. |
| `HERKUNFT.md` | KEEP | Provenance and third-party attribution. |
| `docs/design/UI_LANGUAGE.md` and `MOTION.md` | KEEP | Existing foundational rules agree with premium style when interpreted as calm-at-rest. |

## Explicit exclusions from production default style
- 3D orbit/particles/holograms used as unrelated decoration.
- Animated backgrounds, endless glow/shimmer, decorative progress.
- Game-like UI for serious tools.
- Excessive glass behind text, tables or forms.
- Multiple competing navigation systems in one view.

## Next cleanup pass (not yet performed)
1. Enumerate exports, import graph, component demos and tests.
2. Identify exact duplicates or dead files with zero references.
3. Take visual snapshots and run `cd app && npm ci && npm run build && npm run test:unit && npm run test:smoke && npm run audit:ui`.
4. Propose deletion list with file paths, evidence and rollback plan.
5. Obtain explicit approval, then remove in a separate PR. No files were deleted in this pass.
