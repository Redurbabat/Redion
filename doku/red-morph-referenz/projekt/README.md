# RED Morph — UI Kit

RED Morph is the shared professional design and motion system for BBT-Bit, Redion and future RED apps. The repository retains experimental labs, a React Touch Kit and a native SwiftUI package.

The UI-Kit repository is the home of RED Morph. Start with `skills/red-morph/SKILL.md` and `docs/design/RED_MORPH_SYSTEM.md` for the product-wide style; existing runtime package names remain unchanged for compatibility.

## BBT-Bit Interaction Lab — 38 Live-Demos

Das **BBT-Bit Interaction Lab** ist im UI-Kit unter **#/bbt-interactions** erreichbar. Es ist ein eigenständiges Browser-Atelier mit 38 benannten und bedienbaren Konzeptstudien für die Musik-App BBT-Bit. Dazu gehören Music Island, Infinity Dock (3 Ebenen), Glass Portal, Orbit Player, Sky Shelf, Sound Ribbon, Albumkarten, Playlist-Interaktionen und mehr.

- **Aufrufen:** UI-Kit → BBT-Bit Interaction Lab, oder lokal http://localhost:5173/#/bbt-interactions.
- **Bedienen:** Buttons, Regler, Karten, Hover und Pointer-Swipes; bei jeder Studie ist der Auslöser beschrieben. Eine Vergrößerungsansicht ist über die Karte erreichbar.
- **Filtern und suchen:** vier Funktionsgruppen, Volltextsuche, Bewegungen pausieren. OS-Einstellung für reduzierte Bewegung wird unterstützt.
- **Abgrenzung:** Das Lab zeigt **UI-Zustände mit simulierten Musikdaten**. Es spielt keine Musik ab und ist **noch nicht in die native BBT-Bit-App integriert**. React-Demos sind keine SwiftUI-Komponenten.
- **Quellen:** app/src/components/bbt/BBTInteractionLab.tsx, bbtInteractionLab.css und bbtStudies.ts.
- **Prüfung:** cd app && npm ci && npm run build && npm run test:unit && npm run test:smoke; der Browser-Smoke testet 390 px und 1280 px.
- **Freigabe:** Die Live-Website bekommt den neuen Bereich erst durch einen explizit geprüften Deployment-Prozess. Ein PR allein stellt keine öffentliche Vorschau bereit.

## SwiftUI Motion Lab — Interaktive Website

Auf der bestehenden UI-Kit-Website ist das neue **`#/swiftui`** erreichbar: 30 Browser-Vorschauen für zweistufiges Dock, Karten-Morphing, Flip, Drag, Glow, Shimmer, Swipe-Actions, Tool-Paletten, Navigation und weitere Interaktionen. Neben den Demos gibt es 60 UI-/UX-Regeln, 48 App-Ideen, vier Agent-Skills und Verweise zu den echten SwiftUI-Quelltexten.

- **Route:** `#/swiftui` (auch auf der Startseite und unter „Labs“ verlinkt).
- **Vorschauen:** laufen in React/CSS/JavaScript und sind keine eingebetteten SwiftUI-Runtimes.
- **Quelle:** `app/src/components/swiftui/` für die Website-Demos, `native/swiftui/` für die native iOS/macOS-Bibliothek.
- **QA:** `cd app && npm ci && npm run build && npm run test:unit`.

## Astra

Astra ist das neue Interaction Atelier mit acht Studien zu Licht, Material, räumlicher Bewegung, Suche und Änderungsverläufen. Öffne auf der Website den Astra-Bereich oder direkt `#/astra`; bei laufendem Entwicklungsserver: [Astra lokal öffnen](http://127.0.0.1:5173/#/astra).

Die Studien bieten echte lokale Bedienelemente, eine Bewegungspause, Familienfilter und Quellcode-Downloads. Entwurf, Bedienung, Portierung, Git-Ausgangsstand und Prüfprotokoll sind in [docs/design/ASTRA.md](docs/design/ASTRA.md) dokumentiert.

## Redion Lab – 3D Elektrobauteile, Stift & Switches

Öffne im UI-Kit **`#/redion`**: Dort gibt es drei umschaltbare 3D-Studien – Schalter/Steckdose, Premium Installations-Einsatz sowie Mysterium mit Obsidian-Material, Partikeln und Bloom – (Orbit, Zoom, Wireframe/Explodieren, Drehen, Animation pausieren) sowie die Redion-ready Stiftwerkzeuge und mechanischen Schalter. Die Modelle liegen unter `app/public/redion-3d-model.html`, `app/public/redion-3d-premium.html` und `app/public/redion-3d-mysterium.html`. **Wichtig:** Three.js wird für diese 3D-Web-Demo derzeit von CDNs geladen; für eine Offline-Redion-App muss es lokal integriert werden. Siehe `docs/design/REDION_3D_LAB.md`.

## Redion-Ready Ink & Switches

Neue portable React-Bausteine im Touch Kit (`#/touch`): `InkPad` mit Stiftdruck und Objektradierer, `InkToolbar` mit Textmarker/Farben/Undo, `BrushDial` sowie die zugänglichen Ein/Aus-Schalter `FilamentSwitch` und `HaloSwitch`. Alle haben eine echte Live-Vorschau und kopierbaren Code. Sie sind als Komponenten vorbereitet, aber **noch nicht in Redion eingebaut**. Details: `docs/design/REDION_INK_COMPONENTS.md`.

## Studio Pro (Motion Presets + Vorlagen)

Der Editor `#/studio` enthält jetzt drei interaktive Startvorlagen, fünf Motion-Modi (inklusive Original), Autosave für ungespeicherte Entwürfe und Import/Export über JSON. Der Hauptkatalog zeigt zur besseren Performance nur 24 Previews auf einmal. Siehe `docs/design/STUDIO_PRO.md`.

## Creative Interaction Lab und getrennte Touch-Bibliothek

Die UI-Kit-Galerie, das neue kreative Experimentierlabor und das portable Touch Kit sind wieder zusammen erreichbar:

- `#/creative` — **11 interaktive Material-, Physik-, Morphing- und Daten-Experimente**. Klickbare Live-Preview, Filter und die bestehende Detailwerkbank mit Copy-Code und Tempo-/Farbsteuerung.
- `#/touch` — **21 Touch Kit Previews** mit dem originalen, kopierbaren React- und CSS-Code.
- `#/astra` — Astra-Atelier aus PR #8 mit acht weiteren Studien.
- `#/studio` — eigene HTML-/CSS-/JavaScript-Designs lokal anlegen.

Architektur und Review-Kriterien: `docs/design/CREATIVE_LAB.md`.
QA: `cd app && npm run build && npm run test:unit && npm run test:smoke`.

## Touch Kit — handy-artige Bauteile für jede React-Webseite

`app/src/touch/` ist ein kopierbarer Ordner mit iPhone-artigen Bauteilen, Federn und Gesten
(React 19 + TypeScript + reines CSS, keine Laufzeit-Abhängigkeit ausser React): Knöpfe mit
Druck-Feder, Schalter, Segmente, Stepper, Regler, Chips, Plaketten, Listen mit Wisch-Aktionen,
Sheets mit Rastpunkten, Action Sheets, Dialoge, Menüs, Toasts, Pull-to-Refresh, Navbar mit grossem
Titel, Suchfeld, Tab-Leiste, Navigations-Stapel mit Wischen zurück, Mini-Player → Vollbild,
Seitenwechsel per View Transitions und Liquid Glass.

| Wo | Was |
| --- | --- |
| `app/index.html` → Kategorie **Touch Kit** | jedes Bauteil live, daneben der kopierbare React-Code (die echte Quelle der Vorschau) und das CSS |
| `app/touch.html` | Demo aller Bauteile und Bewegungen, hell/dunkel, Telefon- und Desktop-Breite |
| `app/src/touch/README.md` | Aufbau des Kits und seine Regeln |
| `.claude/skills/touch-kit/` | **Claude-Skill**: damit baut Claude in jedem Projekt direkt mit dem Kit |
| `HERKUNFT.md` | woher Ideen, Werte und Code stammen (nur MIT/BSD/Apache, mit Datei und Zeilen) |

### In ein anderes Projekt übernehmen

```bash
# Kit + Skill in ein Projekt kopieren (Tests bleiben weg, wenn das Projekt kein Vitest hat)
tools/install-touch-kit.sh /pfad/zum/projekt
# nur den Skill für alle Projekte auf diesem Rechner
tools/install-touch-kit.sh --user
```

Danach im Projekt einmal `import './touch/touch.css'` und den Bereich mit
`<div className="ui-touch-root">` markieren. Alles Weitere steht im Skill.

## Entwickeln

```bash
cd app
npm install
npm run dev          # http://127.0.0.1:5173 (Hauptseite) und /touch.html (Touch-Demo)
npm run build
npm run test:unit    # inkl. Regel-Prüfer (Namen, Bewegung, Kontraste) und Skill-Abgleich
npm run skill        # Skill-Referenz und -Rezepte nach API-Änderungen neu erzeugen
npm run tokens       # Federn nach Änderungen an motion/presets.ts neu erzeugen
npm run screenshots  # Playwright: 360/390/430/1280 px, hell und dunkel, mit Kontaktbögen
npm run audit:ui     # Playwright: Namen, 44-px-Treffer, Escape schliesst jedes Overlay
```

## Native SwiftUI (iPhone + macOS)

Ein separates natives Swift Package mit zweistufigem, kontextabhängigem Dock und Motion-Tokens befindet sich unter [native/swiftui](native/swiftui/README.md). Die vier KI-Skills liegen in `.claude/skills/swiftui-*/`. UI/UX-Regeln, Animationsempfehlungen und Ideen: [docs/native-swiftui](docs/native-swiftui/UX_RULES.md). Das React-Web-Kit bleibt erhalten.

## BBT-Bit Liquid Motion Lab

Unter `#/bbt-bit` läuft ein eigenständiger, interaktiver Musik-App-Prototyp mit 18 touch-, maus- und tastaturfähigen Interaktionen (Music Island, Infinity Dock, Glass Portal, Player, Queue, Lyrics, EQ, Replay und weitere). Alle Inhalte sind simuliert; **kein Audiostream und keine echte BBT-Bit-Funktion wird verändert**. [Design- und Portierungsdokumentation](docs/design/BBT_BIT_MOTION_LAB.md).
