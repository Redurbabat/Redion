# Touch Kit — Design-Tokens

> Automatisch aus `tokens.css` und `motion-tokens.css` erzeugt (`npm run skill`). Nicht von Hand ändern.
> Farben nutzen `light-dark(hell, dunkel)`; im eigenen CSS immer die Variablen verwenden, nie die Werte.

## Colour: semantic roles (UI_LANGUAGE.md: violet accent, cyan info, teal success, amber warning, red/pink danger)

| Token | Wert |
| --- | --- |
| `--ui-color-accent` | `light-dark(#5345e0, #a39dff)` |
| `--ui-color-accent-pressed` | `light-dark(#4336c8, #b6b1ff)` |
| `--ui-color-on-accent` | `light-dark(#ffffff, #0b0a1a)` |
| `--ui-color-accent-soft` | `light-dark(rgb(83 69 224 / 0.12), rgb(143 136 255 / 0.18))` |
| `--ui-color-info` | `light-dark(#0e7490, #22d3ee)` |
| `--ui-color-success` | `light-dark(#0f766e, #2dd4bf)` |
| `--ui-color-warning` | `light-dark(#b45309, #fbbf24)` |
| `--ui-color-danger` | `light-dark(#b81c3c, #ff7088)` |
| `--ui-color-danger-soft` | `light-dark(rgb(184 28 60 / 0.12), rgb(255 112 136 / 0.12))` |
| `--ui-color-on-danger` | `light-dark(#ffffff, #1a0508)` |

## Colour: surfaces (grouped layout like a settings screen)

| Token | Wert |
| --- | --- |
| `--ui-color-bg` | `light-dark(#f3f2f8, #000000)` |
| `--ui-color-surface` | `light-dark(#ffffff, #1c1c21)` |
| `--ui-color-surface-raised` | `light-dark(#ffffff, #2a2a31)` |
| `--ui-color-surface-sunken` | `light-dark(#e9e9ef, #0e0e11)` |
| `--ui-color-fill` | `light-dark(rgb(116 112 138 / 0.12), rgb(122 118 144 / 0.24))` |
| `--ui-color-fill-strong` | `light-dark(rgb(116 112 138 / 0.2), rgb(122 118 144 / 0.36))` |
| `--ui-color-highlight` | `light-dark(rgb(0 0 0 / 0.08), rgb(255 255 255 / 0.1))` |
| `--ui-color-scrim` | `light-dark(rgb(0 0 0 / 0.32), rgb(0 0 0 / 0.56))` |
| `--ui-color-bar` | `light-dark(rgb(249 249 251 / 0.8), rgb(22 22 26 / 0.78))` |

## Colour: text + lines (tertiary = non-text UI such as chevrons; placeholders use secondary)

| Token | Wert |
| --- | --- |
| `--ui-color-label` | `light-dark(#0b0b10, #f5f5f8)` |
| `--ui-color-label-secondary` | `light-dark(#5e5e6b, #a2a2ae)` |
| `--ui-color-label-tertiary` | `light-dark(#7a7a86, #84848f)` |
| `--ui-color-separator` | `light-dark(rgb(56 52 78 / 0.26), rgb(86 84 98 / 0.6))` |
| `--ui-color-focus` | `light-dark(#5345e0, #a39dff)` |

## Colour: shadow ink

| Token | Wert |
| --- | --- |
| `--ui-shadow-ink` | `light-dark(rgb(22 16 60 / 0.1), rgb(0 0 0 / 0.5))` |
| `--ui-shadow-ink-strong` | `light-dark(rgb(22 16 60 / 0.18), rgb(0 0 0 / 0.7))` |

## Space (4 px grid)

| Token | Wert |
| --- | --- |
| `--ui-space-1` | `4px` |
| `--ui-space-2` | `8px` |
| `--ui-space-3` | `12px` |
| `--ui-space-4` | `16px` |
| `--ui-space-5` | `20px` |
| `--ui-space-6` | `24px` |
| `--ui-space-8` | `32px` |
| `--ui-space-10` | `40px` |
| `--ui-space-12` | `48px` |

## Size

| Token | Wert |
| --- | --- |
| `--ui-hit-min` | `44px` |
| `--ui-control-height` | `44px` |
| `--ui-control-height-small` | `32px` |
| `--ui-row-min-height` | `44px` |
| `--ui-navbar-height` | `44px` |
| `--ui-tabbar-height` | `50px` |
| `--ui-hairline` | `0.5px` |

## Radius

| Token | Wert |
| --- | --- |
| `--ui-radius-xs` | `6px` |
| `--ui-radius-sm` | `10px` |
| `--ui-radius-md` | `14px` |
| `--ui-radius-lg` | `20px` |
| `--ui-radius-xl` | `28px` |
| `--ui-radius-sheet` | `32px` |
| `--ui-radius-device` | `48px` |
| `--ui-radius-pill` | `999px` |

## Depth (UI_LANGUAGE.md: surface · raised · floating · overlay)

| Token | Wert |
| --- | --- |
| `--ui-shadow-surface` | `0 0.5px 0 var(--ui-shadow-ink)` |
| `--ui-shadow-raised` | `0 1px 2px var(--ui-shadow-ink), 0 4px 12px var(--ui-shadow-ink)` |
| `--ui-shadow-floating` | `0 2px 6px var(--ui-shadow-ink), 0 12px 32px var(--ui-shadow-ink-strong)` |
| `--ui-shadow-overlay` | `0 8px 24px var(--ui-shadow-ink), 0 32px 80px var(--ui-shadow-ink-strong)` |
| `--ui-color-knob` | `#ffffff` |
| `--ui-shadow-knob` | `0 3px 8px var(--ui-shadow-ink), 0 1px 1px var(--ui-shadow-ink), 0 0 0 var(--u…` |

## Typography (system fonts only — nothing is bundled)

| Token | Wert |
| --- | --- |
| `--ui-font-rounded` | `ui-rounded, system-ui, -apple-system, 'Segoe UI Variable Text', 'Segoe UI', R…` |
| `--ui-font-mono` | `ui-monospace, 'Cascadia Code', 'Segoe UI Mono', Menlo, Consolas, monospace` |
| `--ui-text-large-title` | `700 34px / 41px var(--ui-font-display)` |
| `--ui-text-title-1` | `700 28px / 34px var(--ui-font-display)` |
| `--ui-text-title-2` | `700 22px / 28px var(--ui-font-display)` |
| `--ui-text-title-3` | `600 20px / 25px var(--ui-font-display)` |
| `--ui-text-headline` | `600 17px / 22px var(--ui-font-sans)` |
| `--ui-text-body` | `400 17px / 22px var(--ui-font-sans)` |
| `--ui-text-callout` | `400 16px / 21px var(--ui-font-sans)` |
| `--ui-text-subhead` | `400 15px / 20px var(--ui-font-sans)` |
| `--ui-text-footnote` | `400 13px / 18px var(--ui-font-sans)` |
| `--ui-text-caption` | `400 12px / 16px var(--ui-font-sans)` |
| `--ui-text-caption-2` | `500 11px / 13px var(--ui-font-sans)` |
| `--ui-tracking-tight` | `-0.022em` |
| `--ui-tracking-body` | `-0.012em` |
| `--ui-tracking-caps` | `0.06em` |

## Motion: durations (MOTION.md ranges)

| Token | Wert |
| --- | --- |
| `--ui-duration-instant` | `90ms` |
| `--ui-duration-short` | `160ms` |
| `--ui-duration-normal` | `280ms` |
| `--ui-duration-long` | `480ms` |

## Motion: curves

| Token | Wert |
| --- | --- |
| `--ui-ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` |
| `--ui-ease-emphasized` | `cubic-bezier(0.16, 1, 0.3, 1)` |
| `--ui-ease-exit` | `cubic-bezier(0.4, 0, 1, 1)` |
| `--ui-ease-press` | `cubic-bezier(0.25, 0.1, 0.25, 1)` |

## Layers

| Token | Wert |
| --- | --- |
| `--ui-z-bar` | `10` |
| `--ui-z-overlay` | `100` |
| `--ui-z-sheet` | `200` |
| `--ui-z-popover` | `300` |
| `--ui-z-toast` | `400` |

## Federn (generiert aus `motion/presets.ts`)

| Token | Wert |
| --- | --- |
| `--ui-spring-press` | `linear(…)` |
| `--ui-spring-press-duration` | `575ms` |
| `--ui-spring-snappy` | `linear(…)` |
| `--ui-spring-snappy-duration` | `542ms` |
| `--ui-spring-smooth` | `linear(…)` |
| `--ui-spring-smooth-duration` | `796ms` |
| `--ui-spring-bouncy` | `linear(…)` |
| `--ui-spring-bouncy-duration` | `887ms` |
| `--ui-spring-gentle` | `linear(…)` |
| `--ui-spring-gentle-duration` | `923ms` |

## CSS-Hilfsklassen (`base.css`)

| Klasse | Zweck |
| --- | --- |
| `.ui-touch-visually-hidden` | Text that exists for assistive technology only. |
| `.ui-touch-focus-ring` | One focus ring for every control: visible only for keyboard focus. |
