# UI Kit Architecture

## Overview

UI Kit follows the same repository-level separation used by larger Redurbabat projects while remaining intentionally smaller.

```text
UI-Kit/
├─ .claude/skills/touch-kit/  ← Claude skill: use the Touch kit in any project
├─ AI_START_HERE.md
├─ CLAUDE.md
├─ AGENTS.md
├─ README.md
├─ app/
│  ├─ index.html
│  ├─ package.json
│  ├─ public/
│  └─ src/
│     ├─ app/
│     ├─ components/
│     ├─ registry/
│     ├─ styles/
│     ├─ touch/          ← portable Touch kit (tokens, springs, gestures, components)
│     ├─ touch-demo/     ← demo page for the Touch kit (app/touch.html)
│     ├─ touch-showcase/ ← Touch kit entries of the main library (index.html)
│     ├─ skill/          ← keeps the skill in sync (reference + type-checked recipes)
│     └─ test/
├─ docs/
│  ├─ architecture/
│  └─ design/
└─ tools/
```

## Responsibilities

### `app/src/app/`
Application shell for the showcase website: navigation, search, category filters and component detail presentation.

### `app/src/components/`
Reusable UI experiments and production-ready primitives. A component can begin as an experiment, but production primitives must follow the project naming, accessibility and motion rules.

### `app/src/registry/`
Metadata describing every component shown by the website. The registry is the source for category, title, tags, maturity and component rendering.

### `app/src/styles/`
Shared design tokens, global layout, motion primitives and reusable effects.

### `app/src/touch/`
The Touch kit: phone-like components, springs and gestures. It is deliberately
self-contained so it can be copied into other projects (e.g. STRAN) as one folder:
it imports nothing from the showcase, the registry or `styles/`, has no runtime
dependency besides React, and ships its own tokens (`tokens.css`), generated spring
easings (`motion-tokens.css`) and theming scope (`base.css`). Class names use
`ui-touch-*`, keyframes `ui-touch-*`, custom properties `--ui-*`;
`conventions.test.ts` enforces this for every kit stylesheet.

### `app/src/touch-demo/`
The demo page (`app/touch.html`) that shows every Touch component and motion in
light and dark mode. Not part of the kit.

### `app/src/touch-showcase/`
The Touch kit inside the main library (`app/index.html`, category "Touch Kit").
`entries.ts` is plain data that the registry imports; the previews, their own
source (the copyable React code) and the kit stylesheets load lazily. Every
preview is ordinary application code importing from `../../touch`, shown with
the path a project gets after copying the kit (`./touch`).

### `.claude/skills/touch-kit/` and `app/src/skill/`
The Claude skill for using the kit in other projects. `reference/*.md` is
generated from the kit source (`npm run skill`); `app/src/skill/skill.test.ts`
fails when it is stale, when SKILL.md names a component the kit does not
export, and writes every tsx recipe of SKILL.md to `app/src/skill/recipes/`,
where `tsc -b` type-checks it against the real kit.

### `tools/`
`screenshots.mjs` drives the demo page with Playwright at 360/390/430/1280 px in
light and dark mode and writes per-section screenshots plus contact sheets to
`app/test-results/screenshots/` (git-ignored). `screenshot-scenes.mjs` holds
interaction scenes (open sheet, running springs, …).

### `docs/design/`
Human-readable design language and motion specification. Code should implement these decisions rather than inventing a new visual language per component.

## Dependency direction

```text
app shell -> registry -> components -> styles/tokens
registry -> touch-showcase/entries (data only)
components/showcase -> touch-showcase (lazy) -> touch
touch-demo -> touch
skill (tests, recipes) -> touch
```

`touch/` never imports from outside its folder.

Reusable components must not import the application shell.

## Component maturity

Components use one of these maturity states:

- `experiment` — unusual concept, may change rapidly
- `candidate` — good enough for real product evaluation
- `stable` — reviewed for accessibility, motion, responsiveness and reuse

## Portability

The website is not the product dependency. BABAT RED or Redion should port/import a stable primitive intentionally rather than embedding the UI-Kit website.

## Data

The repository contains no user data model and no application database. Component metadata is static source code.
