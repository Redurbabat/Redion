# RED Morph — shared style for future apps

The source of truth for this product style is `skills/red-morph/SKILL.md`. This document explains how to adopt it without collapsing distinct apps into a monolith.

## Identity
BBT-Bit provides interaction craft (shared player state, glass where meaningful, morphing artwork, native gestures). Redion provides restraint, dense tools, accessible focus, data integrity and offline-first design. The result is professional software with expressive, purposeful motion and no gamification.

## Architecture
- Shared *design decisions*: semantic tokens, motion semantics, navigation conventions, component acceptance criteria.
- Shared *runtime implementations*: `app/src/touch/` for React/TypeScript; `native/swiftui/` for native SwiftUI.
- Shared *agent instruction*: `skills/red-morph/` as a portable skill for any future project.
- Product-specific features remain in their own repositories.
- Browser labs remain experiments; never label simulated interactions as complete production features.

## Adoption sequence
1. Choose one real screen in a new app, inventory existing styles and navigation.
2. Apply RED Morph contract and map its screen states.
3. Reuse runtime-specific components and write missing primitives with tests.
4. Validate mobile and desktop, reduced motion/transparency, keyboard, screen reader and device performance.
5. Integrate only after compatibility review and evidence; record exceptions.

## Safe cleanup
No mass deletion. `skills/red-morph/references/REPO_AUDIT.md` lists KEEP, REWORK, LAB and DELETE-CANDIDATE decisions. Only remove proven dead/duplicated files after code search, build, visual QA and maintainer approval.

## Minimum QA
```bash
cd app
npm ci
npm run build
npm run test:unit
npm run test:smoke
npm run audit:ui
```
Native validation additionally requires a macOS/Xcode environment and real-device checks; a browser preview does not establish SwiftUI parity.
