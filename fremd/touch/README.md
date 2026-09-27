# Touch Kit

Handy-artige Bauteile, Federn und Gesten für React 19 — gebaut mit CSS und wenig TypeScript,
ohne Laufzeit-Abhängigkeiten ausser React. Demo: `app/touch.html` (`npm run dev`, dann
`/touch.html`).

## In ein anderes Projekt übernehmen

1. Ordner `app/src/touch/` kopieren (er importiert nichts von ausserhalb).
2. Einmal im Einstieg der App: `import './touch/touch.css'`.
3. Einen Bereich mit `className="ui-touch-root"` markieren (folgt Hell/Dunkel des Systems) oder
   `data-ui-theme="light" | "dark"` setzen, um ein Thema zu erzwingen.
4. Bauteile und Helfer aus `./touch` importieren.

## Bausteine

| Datei | Inhalt |
| --- | --- |
| `tokens.css` | Farben (hell/dunkel über `light-dark()`), Abstände, Rundungen, Tiefe, Schrift, Dauern, Kurven |
| `motion-tokens.css` | **generiert**: Federn als CSS-`linear()`-Kurven, `--ui-spring-<name>` + `--ui-spring-<name>-duration` |
| `base.css` | Themen-Bereich `.ui-touch-root`, `data-ui-theme`, Hilfsklassen |
| `motion/spring.ts` | Feder-Physik (analytisch), Dauer+Bounce → Steifigkeit/Dämpfung, Feder → `linear()` |
| `motion/animateSpring.ts` | Feder auf `requestAnimationFrame`, unterbrechbar (`retarget` behält Tempo) |
| `motion/presets.ts` | benannte Federn: `press`, `snappy`, `smooth`, `bouncy`, `gentle` |

## Regeln (werden getestet)

- Klassen und Keyframes `ui-touch-*`, CSS-Variablen `--ui-*` — `conventions.test.ts`.
- Bewegung nur über `transform`/`opacity` (+ Farbwechsel); kein `transition: all`.
- Jede Datei mit Animation hat einen `prefers-reduced-motion`-Block.
- Farbpaare erfüllen Kontrast-Mindestwerte in Hell und Dunkel — `tokens.test.ts`.
- Federn ändern: `motion/presets.ts` anpassen, dann `npm run tokens`.
