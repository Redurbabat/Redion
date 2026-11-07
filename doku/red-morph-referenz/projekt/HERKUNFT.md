# HERKUNFT — woher Ideen, Werte und Code im Touch Kit stammen

Das Touch Kit (`app/src/touch/`) übernimmt, **wie** etwas gebaut ist (Technik, Bewegung,
Mechanik) — nicht Apples Marke, Symbole oder Schriften. Es gilt:

- Nur Quellen unter **MIT, BSD oder Apache-2.0**. Alle unten geprüft (LICENSE-Datei _und_
  `package.json`), Stand des jeweiligen Commits.
- **Art der Übernahme**
  - **Idee** — Konzept verstanden und selbst neu geschrieben (eigene Struktur, eigene Namen).
  - **Werte** — nur Zahlen/Kurven/Schwellen übernommen (Dauern, Faktoren, Radien).
  - **Code** — Quelltext (nahezu) wörtlich übernommen. Dann steht der Lizenztext der Quelle
    unten im Anhang, wie es MIT verlangt.
- Nicht übernommen werden: Symbole/Icon-Fonts, Bilder, App-Daten, Schriftnamen/-dateien und
  Markennamen aus den Quellen (siehe „Bewusst nicht übernommen“).

## Quellen

| Repo | Commit (Datum) | Lizenz | Copyright laut LICENSE | Hinweise |
| --- | --- | --- | --- | --- |
| [framework7io/framework7](https://github.com/framework7io/framework7) | `7622d56` (2026-09-08) | MIT | © 2014 Vladimir Kharlampidi | `package.json` = MIT. Icon-Font `src/core/icons/*` enthält iOS-ähnliche Glyphen → nicht verwenden. |
| [framework7io/framework7-appstore-react](https://github.com/framework7io/framework7-appstore-react) | `9598d4f` (2022-02-03) | MIT (LICENSE) | © 2020 Vladimir Kharlampidi | **Widerspruch:** `package.json` sagt `"UNLICENSED"`. Daher nur Ideen/Werte, **kein Code**. Bilder, App-Daten, Avatar, App-Store-Icons sind Rechte Dritter → nicht verwenden. |
| [konstaui/konsta](https://github.com/konstaui/konsta) | `e1b8591` (2026-09-02) | MIT | © 2021 Vladimir Kharlampidi | `src/color-utils/material-color-utilities/**` ist Apache-2.0 (Google) — nicht genutzt. Icon-SVGs sind iOS-Look-alikes → nicht verwenden. |
| [motiondivision/motion](https://github.com/motiondivision/motion) | `636e725` (2026-09-25) | MIT | © 2024 Motion B.V.; `packages/framer-motion`: © 2018 Framer B.V. | Wird **nicht** als Abhängigkeit im Kit benutzt (steht zwar in `package.json`, ist aber ungenutzt). |
| [emilkowalski/vaul](https://github.com/emilkowalski/vaul) | `3e97aac` (2025-10-03) | MIT | © 2023 Emil Kowalski | |
| [Temzasse/react-modal-sheet](https://github.com/Temzasse/react-modal-sheet) | `dba5010` (2026-03-27) | MIT | © 2020 Teemu Taskula | |
| [stipsan/react-spring-bottom-sheet](https://github.com/stipsan/react-spring-bottom-sheet) | `3cb57d1` (2022-06-01) | MIT | © 2020 Cody Olsen | |
| [nikdelvin/liquid-glass](https://github.com/nikdelvin/liquid-glass) | `4925186` (2025-12-25) | MIT | © 2025 Nikita Stadnik | |
| [dpawlikowski/liquid-glass](https://github.com/dpawlikowski/liquid-glass) | `0e98505` (2026-07-15) | MIT | © 2026 liquid-glass contributors | |
| [ALEXalesha/LiquidGlass](https://github.com/ALEXalesha/LiquidGlass) | `34d616f` (2026-09-25) | MIT | © 2026 ALEXalesha | |
| [emilkowalski/skills](https://github.com/emilkowalski/skills) — „apple-design“ | `d16ebe6` (2026-09-24) | MIT | © 2026 Emil Kowalski | LICENSE im Repo-Root, keine `package.json`. Gelesen als Designregeln (Text); übernommen nur Formeln/Werte. Zitate aus Apple-WWDC-Vorträgen im Text sind Material Dritter → nicht übernommen. |

Öffentliche Dokumentation (kein Code): Apples Feder-Modell „Dauer + Bounce“ (WWDC 2023,
„Animate with springs“) und die iOS-Schriftgrössen der Human Interface Guidelines — beides nur
als **Werte/Formeln**, die allgemein bekannt sind.

## Übernahmen nach Datei

### Schritt 1 — Grundlage

| Unsere Datei | Quelle (Repo · Datei) | Lizenz | Art | Was genau |
| --- | --- | --- | --- | --- |
| `app/src/touch/motion/spring.ts` · `solveSpring` | motion · `packages/motion-dom/src/animation/generators/spring.ts` (Zweige unter-/kritisch/überdämpft, ca. Z. 313–452) | MIT | Idee | Geschlossene Lösung der gedämpften Schwingung, getrennt nach Dämpfungsgrad. Eigene Umsetzung: überdämpfter Fall als Summe zweier Exponentialfunktionen (kein `sinh/cosh`-Überlauf), kritischer Fall mit Toleranz statt `ζ === 1`. |
| `app/src/touch/motion/spring.ts` · `settleDuration`, `animateSpring` `restDelta/restSpeed` | motion · `spring.ts` (`setRestThresholds`, ca. Z. 334–354) | MIT | Idee | „Ruhe“ = Abstand _und_ Geschwindigkeit unter Schwellen, in den Einheiten des Aufrufers. |
| `app/src/touch/motion/spring.ts` · `springToLinearEasing` | motion · `packages/motion-dom/src/animation/waapi/utils/linear.ts` (`generateLinearEasing`) und `spring.ts` `toString` (ca. Z. 495–511) | MIT | Idee | Feder als CSS `linear()`-Kurve abtasten, damit CSS-Transitions echte Federn fahren. Eigene Umsetzung: Punktbudget (12–48) statt fester 10/30-ms-Auflösung. |
| `app/src/touch/motion/spring.ts` · `springFromPerceptual` | Apple „Animate with springs“ (WWDC 2023); vergleichbar motion `spring.ts` `visualDuration` (Z. 232–246, dort mit Faktor 1.2) | – / MIT | Werte | Steifigkeit = (2π/Dauer)², Dämpfungsgrad = 1 − Bounce (bzw. 1/(1+Bounce) bei negativem Bounce). |
| `app/src/touch/motion/animateSpring.ts` · `retarget` | motion · Übergabe der aktuellen Geschwindigkeit an neue Animationen (`packages/motion-dom/src/value/index.ts`) | MIT | Idee | Unterbrechbare Feder: beim Umlenken laufen Position _und_ Geschwindigkeit stetig weiter (wie iOS). |
| `app/src/touch/tokens.css` · `--ui-hairline` | konsta · `src/styles/hairlines.css` | MIT | Idee | Haarlinien für Trenner (hier einfach 0.5px statt DPR-Stufen-Pseudo-Elementen). |
| `app/src/touch/tokens.css` · `--ui-text-*` | iOS Human Interface Guidelines (öffentliche Schriftgrössen) | – | Werte | Grössenstufen 34/28/22/20/17/16/15/13/12/11 px. Schrift selbst: nur Systemschriften, nichts eingebunden. |
| `app/src/touch/tokens.css` · Farben | eigene Palette nach `docs/design/UI_LANGUAGE.md` (Violett-Akzent, Cyan, Türkis, Bernstein, Rot/Pink) | – | – | Keine Apple-Systemfarben übernommen; Kontraste per Test geprüft. |

## Bewusst nicht übernommen

- Icon-Fonts und SVG-Glyphen aus Framework7 (`src/core/icons/*`, z. B. `search_ios`,
  `chevron_left_ios.svg`) und Konsta (`src/react/components/icons/*`): iOS-Symbol-Nachbauten.
  Das Kit zeichnet eigene, schlichte Glyphen.
- Alle Bilder, App-Icons, Screenshots, `src/data/*.json`, Avatar und Arcade-Grafik aus
  `framework7-appstore-react` (Rechte Dritter / Marken).
- Schriftnamen „SF Pro …“ aus fremden Font-Stacks; wir verwenden `system-ui` / `-apple-system`,
  die auf Apple-Geräten ohnehin die Systemschrift liefern.
- `motion` als Laufzeit-Abhängigkeit: Federn, Trägheit und FLIP sind klein genug, um sie selbst
  zu bauen und zu testen.

## Anhang: Lizenztexte

Wird ergänzt, sobald Code (nicht nur Ideen/Werte) übernommen wird. Aktuell: keine
Code-Übernahme.
