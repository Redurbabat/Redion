# Buttons

## Purpose
Choose buttons by action semantics, frequency, risk, and hierarchy.

## Decision table
| Need | Pattern | Why |
|---|---|---|
| dominant local action | Primary | establishes next step |
| alternative action | Secondary | available without competing |
| toolbar/low priority | Ghost | low visual weight |
| frequent compact action | Icon button | saves space |
| irreversible/destructive action | Destructive | communicates consequence |
| binary immediate setting | Toggle, not button | represents state |

## Anatomy
Label should be verb-led when practical. Optional leading icon reinforces meaning; trailing icons normally indicate direction, expansion, or external transition. Do not use an icon merely to decorate.

## Sizing
Compact 28–32px for dense desktop toolbars; standard 36–40px; touch-oriented 40–48px. Use project tokens when present.

## States
Default, hover, focus-visible, pressed, disabled, loading. Selected is valid for toggle/tool buttons. Loading must preserve width and prevent duplicate submission.

## Motion
Functional products: background/border change and optional 1px lift, 80–160ms. Expressive products may use restrained spring/magnetic behavior. Press feedback can use scale ~0.97–0.99. Destructive actions should not use playful motion.

## Placement
Keep primary action near the content it affects. In dialogs, group actions consistently. Avoid multiple primary buttons in one local action group.

## Avoid
Pill buttons everywhere, giant CTAs in utility apps, ambiguous icon-only actions, destructive red used decoratively, disabled controls that look active, hover-only meaning.
