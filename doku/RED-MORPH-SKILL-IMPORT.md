# RED-Morph-Skills in Redion — Übernahmeprotokoll

Stand: 7. November 2026

## Quelle und Versionsstand

- Quelle: `Redurbabat/RED-Morph` (privates Repository desselben Eigentümers)
- Quell-Branch: `main`, Commit: `b77d32e40d9f97f84473a9037ee33d0c5595f8d5`
- Ziel: `Redurbabat/Redion`, Feature-Branch `feat/red-morph-skills-20261107`
- Der Import ist eine **statische Kopie**. Keine automatische Aktualisierung, keine Runtime-Integration.

## Vollständigkeit

**199 von 199** ausgewählten RED-Morph-Quelldateien importiert und per Pfadvergleich verifiziert:

| Kategorie | Dateien | Ziel |
| --- | ---: | --- |
| `skills/` inkl. `red-morph`, `web-design` und allen Unterreferenzen | 166 | `.agents/skills/` |
| `.claude/skills/` inkl. Touch Kit, Komponenten-/Tokenreferenz, vier SwiftUI-Skills | 7 | `.agents/skills/` |
| `docs/` aus RED-Morph (Architektur, Design, native SwiftUI, Deployment) | 20 | `doku/red-morph-referenz/docs/` |
| `native/swiftui/README.md` und 5 Projekt-/Herkunftsdokumente | 6 | `doku/red-morph-referenz/native/` und `projekt/` |

Für die direkte Nutzung in Redion kommen **7 neue Claude-Skill-Verweise** sowie `.agents/skills/redion-red-morph/SKILL.md` mit Claude-Verweis hinzu.

## Originalpfade und Zielpfade

| Original | Redion |
| --- | --- |
| `skills/red-morph/` | `.agents/skills/red-morph/` |
| `skills/web-design/` | `.agents/skills/web-design/` |
| `.claude/skills/touch-kit/` | `.agents/skills/touch-kit/` |
| `.claude/skills/swiftui-*/` | `.agents/skills/swiftui-*/` |
| `docs/` | `doku/red-morph-referenz/docs/` |
| `native/swiftui/README.md` | `doku/red-morph-referenz/native/swiftui/README.md` |
| `AGENTS.md`, `AI_START_HERE.md`, `CLAUDE.md`, `HERKUNFT.md`, `README.md` | `doku/red-morph-referenz/projekt/` |

Die originalen Skill-Einstiege für RED Morph, Touch Kit und SwiftUI haben je einen kurzen Redion-Vorranghinweis erhalten. Die Unterreferenzen bleiben unveränderte Kopien des Quellstandes.

## Bewusste Grenzen und Rechte

- **Nicht importiert:** `app/` (React-Webseite und Touch-Runtime), `native/swiftui/Sources/` (Swift-Code), Build-Skripte, Konfigurationen und Pakete. Es gibt keine funktionale RED-Morph-Integration in Redions Laufzeit, keine neuen App-Funktionen und keinen Austausch des vorhandenen Touch-Kits.
- Manche Skill-Texte enthalten ursprüngliche `skills/`, `docs/`, `app/src/` oder `native/`-Pfadbezüge sowie Clone-/Installationsanweisungen. Für Redion gilt stets die obige Zuordnung bzw. ein Verweis auf die **nicht importierte** Original-Runtime. Installationsbefehle niemals blind ausführen.
- Die vorhandenen Redion-Skills und `redion-animationen` werden nicht ersetzt. Drittanbieter-Codeteile nur gemäss Redion `CLAUDE.md` §57 mit Einzelfreigabe, Herkunft, Lizenz und Testnachweis. Externe Leitlinien aus `web-design/SOURCES.md` sind keine mitkopierten Originaltexte.
- Unterlagen sind Arbeits- und Designreferenzen; kein Nachweis für eine getestete native App oder produktionsreife RED-Morph-Komponente.

## Prüfung und Freigabestatus

Pfadvollständigkeit: **199/199 geprüft**. Code-Build, Browser-, Windows-, iPhone- und macOS-Prüfungen: **NICHT GETESTET**; es wurden keine ausführbaren Redion-Quellen verändert. Änderungen befinden sich nur auf dem Feature-Branch; **kein PR, Merge oder Deployment** erfolgt.
