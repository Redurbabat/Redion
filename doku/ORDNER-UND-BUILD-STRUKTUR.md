# RED ION – Ordnerstruktur und Build-Ausgaben

**Stand: 23. November 2026.** Diese Ordnung orientiert sich an den lokal
vorhandenen Verzeichnissen `build/visual-web-emission`,
`build/visual-web-merged` und `build/windows-visual-mcp-dist`.
Die drei Namen sind **optionale lokale QA-/Build-Ausgaben** und keine neuen
Quellcodeordner. Die Struktur auf `main` hat bereits die passende Trennung.

## Soll-Struktur

```text
Redion/
├── src/                        # AUTHORITATIVER TypeScript-/TSX-Quellcode
│   ├── bereiche/
│   │   ├── bloecke/            # Planfläche, Schaltplan, Relaiswerkstatt
│   │   ├── dateien/            # Import/Export
│   │   ├── datenbanken/        # Ansichten, Formeln, Spiegel
│   │   ├── editor/
│   │   ├── elektro/
│   │   ├── ki/
│   │   ├── pdf/
│   │   ├── spreadsheet/
│   │   ├── verbinden/
│   │   └── wissen/
│   ├── core/                   # Gemeinsame Fachlogik
│   ├── kern/                   # Speicherung, Rechte, Abgleich, Zustand
│   ├── register/               # Deklarative Kataloge
│   ├── schale/                 # UI, Navigation, Dock
│   ├── islands/                # React-Komponenten
│   ├── dienst/                 # Service Worker
│   └── start.ts
├── quell/                      # GENERIERT aus src/; für Offline-Start im Git
│   ├── bereiche/
│   ├── core/
│   ├── kern/
│   ├── register/
│   └── schale/
├── server/                     # Cloudflare/D1/R2 und optionaler Abgleich
│   ├── mcp/                    # Cloud-MCP, OAuth, Tools, Datenbankschema
│   └── sicherheit/
├── plugins/red-ion/            # Separater lokaler Windows-MCP-Adapter
├── windows/                    # Electron und Build-/Desktop-Integrationen
├── ios/                        # Native iOS-App / Swift
├── pruefungen/                 # Automatisierte Prüfungen
├── skripte/                    # Werkzeuge und Strukturbericht
├── tools/                      # Zusätzliche Entwicklerwerkzeuge
├── doku/                       # Architektur und Entscheidungen
├── index.html                  # Doppelklick-Einstieg (muss hier bleiben)
├── sw.js                       # Generierter Service Worker (muss hier bleiben)
├── redion-einzeldatei.html     # Offline-Einzeldatei (muss hier bleiben)
└── build/                      # LOKAL – nicht auf GitHub hochladen
    ├── windows-app/            # Paketierte Weboberfläche für Electron
    ├── windows-dist/           # Reguläre Windows-Installer/Portable EXE
    ├── windows-mcp-dist/       # Bestehende MCP-/Windows-Bauausgaben
    ├── macos-dist/             # DMG/ZIP, falls gebaut
    ├── ios-capacitor/          # Temporäres Xcode-/Capacitor-Projekt
    ├── red-ion-plugin/         # Paketierte lokale MCP-Erweiterung
    ├── visual-web-emission/    # OPTIONAL: Visual-Web-Vergleichsstand
    ├── visual-web-merged/      # OPTIONAL: zusammengeführter Visual-Web-Stand
    ├── windows-visual-mcp-dist/ # OPTIONAL: Windows/Visual-MCP-QA-Paket
    └── struktur/               # Automatisch erzeugter Ordnerbaum
        └── PROJEKTBAUM.txt
```

**Wichtig:** Nicht jeder Ordner unter `build/` existiert nach einem frischen
Klon. Erst der jeweilige Build oder ein externer QA-Lauf erzeugt ihn.
`visual-web-merged` und `visual-web-emission` sind keine zweite
Wahrheit neben `src/` und `quell/`; bitte nicht von Hand zurückkopieren.

## Wo Änderungen hingehören

| Aufgabe | Bearbeiten | Nicht bearbeiten |
|---|---|---|
| Editor, Datenbanken, Elektro, PDF, Lernwelt | `src/bereiche/` | `build/visual-web-*` |
| Gemeinsame Funktionen | `src/core/`, `src/kern/` | `quell/` von Hand |
| Navigation, iPhone-kompatible Web-UI | `src/schale/` | EXE-Inhalt unter `build/` |
| Cloud-MCP für ChatGPT | `server/mcp/` | `plugins/red-ion/server/dist/` |
| Lokaler Windows-MCP-Adapter | `plugins/red-ion/` | das Paket unter `build/` |
| Windows/Desktop | `windows/` | `build/windows-dist/` |
| Native iOS-Funktionen | `ios/` | `build/ios-capacitor/` |
| Tests und Prüfsätze | `pruefungen/` | Installationsordner |

`quell/` ist eine bewusst **versionierte, erzeugte** JavaScript-Fassung:
`npm run bauen:ts` schreibt dorthin. Sie bleibt erforderlich, damit
`index.html` per Doppelklick und ohne Node/Internet läuft. Ebenso bleiben
`sw.js` und `redion-einzeldatei.html` an ihren bisherigen Orten.
Die bestehenden Tests vergleichen Quellcode und die generierten Dateien.

## Befehle

```bash
npm run struktur:pruefen
npm run struktur:bericht
```

`struktur:pruefen` kontrolliert die kanonischen Quellordner sowie die
Schutzregeln für lokale Build-Kopien, **ohne Dateien zu verschieben**.

`struktur:bericht` schreibt einen aus dem tatsächlichen lokalen Bestand
erzeugten Baum nach `build/struktur/PROJEKTBAUM.txt`. Der Bericht
zeigt vorhandene Ordner, nicht hypothetische Dateien. Private
`.env*`-, `.dev.vars*`-, Sicherungsdateien und `node_modules/` werden
nicht aufgelistet; symbolische Links werden nicht verfolgt.

## Schutz der Build-Ausgaben

Die lokal erzeugten Verzeichnisse `visual-web-emission`,
`visual-web-merged`, `windows-visual-mcp-dist` und `struktur`
werden mit exakten Git-Ignorierregeln geschützt. Zusätzlich überspringt
`pruefungen/lauf/test109.mts` **nur diese namentlich bekannten Ausgabeordner**.
Der Rest des Repositories wird weiterhin auf unerlaubte neue JavaScript-
Quelldateien geprüft. Die neue Struktur lockert diesen Wächter nicht global.

Keine automatische Migration und kein Kopieren von persönlichen Dateien.
Eine grössere Verschiebung der bestehenden Quellordner wäre ein eigener
Arbeitsschritt mit Importpfad-, Offline-, Windows-, iOS- und CI-Abnahme.

Siehe auch: [Architektur](ARCHITEKTUR.md),
[TypeScript-Migration](TYPESCRIPT-MIGRATION.md),
[Visual-MCP](RED-ION-VISUAL-MCP.md).
