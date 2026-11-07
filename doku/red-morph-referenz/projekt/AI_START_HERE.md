# AI START HERE — RED Morph (UI Kit)

## Source of truth

GitHub `main` is the long-term source of truth. Active work happens on feature branches and is merged only after verification.

## Product

RED Morph is the professional shared design and motion language for BBT-Bit, Redion and future RED apps. UI Kit is the repository and experimental laboratory that hosts it. Read `skills/red-morph/SKILL.md` before new visual work.

The repository has two goals:

1. provide a high-quality website where components can be explored live;
2. maintain reusable design primitives, motion rules, and component patterns that can later be ported into product repositories.

## Structure

- `app/` — the actual React/TypeScript/Vite website
- `docs/architecture/` — architecture and project boundaries
- `docs/design/` — visual language, motion, interaction rules
- `tools/` — validators and maintenance scripts (screenshots, UI audit, kit installer)
- `app/src/touch/` — the portable Touch kit (copy into other projects; see `.claude/skills/touch-kit/`)
- `.claude/skills/touch-kit/` — Claude skill that teaches using the Touch kit in any project
- `CLAUDE.md` — project rules for Claude Code
- `AGENTS.md` — rules for coding agents

## Non-negotiable principles

- Do not turn this repository into BABAT RED or Redion.
- Components should be visually distinctive, not generic SaaS UI.
- Prefer interaction quality, depth, 3D, materiality and playful motion where appropriate.
- The resting state must remain readable and calm.
- Every interactive component needs keyboard focus and reduced-motion behavior.
- Avoid global generic class names such as `.button`, `.card`, `.loader`, `.pulse`, or `.rotate`.
- Reusable component styles must use the `ui-` namespace.
- Do not copy experimental snippets blindly. Extract the idea and rebuild it cleanly.
- Keep dependencies minimal.

## First command after checkout

```bash
cd app
npm install
npm run dev
```

## Verification

Before considering a change complete:

```bash
cd app
npm run build
npm run test:unit
```

For visual work, also inspect desktop and mobile layouts and test keyboard focus and reduced motion
(`npm run screenshots`, `npm run audit:ui`). After changing a Touch kit API run `npm run skill` so the
skill's reference and recipes stay in sync (the unit tests fail otherwise).
