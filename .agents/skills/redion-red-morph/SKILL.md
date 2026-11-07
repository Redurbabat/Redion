---
name: redion-red-morph
description: Safely apply the imported RED Morph design, web-design, Touch Kit and SwiftUI skill library within Redion without replacing existing product systems.
---

# Redion × RED Morph — Integrations-Skill

## Vorrang und Grenzen

1. Lies vor jeder Änderung die **aktuelle** Fassung von `CLAUDE.md`, `AGENTS.md`, `doku/ARCHITEKTUR.md`, den betroffenen Redion-Skill und vorhandenen Code. Redions Datenintegrität, Offline-Betrieb, Import/Export, Navigation und Design-Tokens haben Vorrang.
2. Der RED-Morph-Import besteht aus **Skill-Anleitungen und Referenzdaten**, nicht aus eingebautem Anwendungscode, React-Komponenten, Styles oder Native-Frameworks. Die zwölf vorhandenen Redion-Skills, besonders `redion-animationen`, bleiben unverändert.
3. Ursprüngliche Pfade `skills/`, `docs/` und `native/` sind hier in `.agents/skills/` und `doku/red-morph-referenz/` abgebildet. Demo- und Runtime-Pfade `app/src/...` des Originals wurden **nicht** übernommen.
4. Keine Installation, Löschung, Umstellung oder Fremdcode-Übernahme durch blosse Skill-Anweisungen. `CLAUDE.md` §43, §44 und §57 gelten weiterhin.

## Aufgabenspezifische Referenzen

- **Design und Komponenten:** `.agents/skills/red-morph/SKILL.md`, dazu `.agents/skills/red-morph/references/`, `doku/red-morph-referenz/docs/design/UI_LANGUAGE.md` und `docs/design/RED_MORPH_SYSTEM.md` im Original (hier unter `doku/red-morph-referenz/docs/design/`). Zusätzlich `redion-component-smith` prüfen.
- **Web, Responsive, Produktivitäts-UI, Editor, Navigation:** `.agents/skills/web-design/SKILL.md`. Lade jeweils nur relevante Dateien aus `foundations/`, `patterns/`, `references/`, `recipes/`, `platforms/`, `implementation/` und `quality/`. Redions `redion-editor` und `redion-workspace-architect` berücksichtigen.
- **Touch, Sheets, Gesten, Feder-Animationen:** `.agents/skills/touch-kit/SKILL.md` plus `reference/components.md` und `reference/tokens.md` nur als Spezifikation. Zuerst Redions `fremd/touch/`, `src/schale/bedienung/`, `quell/schale/stil/` und `redion-animationen` prüfen; **kein** Blindimport oder Löschen.
- **Tatsächlich native SwiftUI-Projekte:** `.agents/skills/swiftui-component-smith/`, `swiftui-motion-director/`, `swiftui-ux-auditor/`, `swiftui-idea-lab/`. Für WebViews gelten diese nur als Ideen. Native Referenzdokumentation: `doku/red-morph-referenz/docs/native-swiftui/`.

## Umsetzung und Abnahme

Bestehende Komponenten und Tokens inventarisieren; nach KEEP / REWORK / ARCHIVE einstufen; reale Daten- und Eingabewege nachweisen; Fokus, 44-pt/px-Touchziele, Tastatur, reduzierte Bewegung, Dark Mode, Offline-Fälle und Tests beachten. Bei jedem Änderungsvorschlag: betroffene Dateien, tatsächlich gefahrene Prüfungen, nicht getestete Plattformen und Risiken nennen. Kein Merge, kein Deployment, kein PR ohne ausdrücklichen Auftrag.

Import-Provenienz und Umfang: `doku/RED-MORPH-SKILL-IMPORT.md`; Ursprungsprojekt `Redurbabat/RED-Morph`.
