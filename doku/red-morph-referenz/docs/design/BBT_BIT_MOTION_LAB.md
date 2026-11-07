# BBT-Bit Liquid Motion Lab

## Einstieg

Auf der UI-Kit-Website unter **`#/bbt-bit`**. Interaktive, eigenständige React-/CSS-Designstudie für die spätere **native SwiftUI-Umsetzung in BBT-Bit**. Weder Musik noch externe Daten werden geladen. Alle Titel und Hörzahlen sind rein fiktive Beispieldaten. Die Vorschau ist **keine** bereits installierte Funktion von BBT-Bit.

Die bestehende UI-Kit-Galerie und alle anderen Labs bleiben erhalten. Die Route ist lazy-loaded, CSS ist auf `.bbtm-lab` begrenzt.

## Bedienbare Interaktionen

| Idee | Finger | Maus / Tastatur | SwiftUI-Ziel |
|---|---|---|---|
| Music Island | Tippen, seitlich wischen, nach unten ziehen | Klicken und ziehen | In-App Floating Capsule; systemweite Dynamic Island erfordert Live Activities |
| Infinity Dock | Griff 1×/2× hochziehen, herunterziehen | Griff klicken; Ebene 1 / 2 / 0 | Eigenes `KitLayeredDock`-Konzept, auf BBT-Tabs angepasst |
| Glass Portal | Album oder Player öffnen | Klicken, Esc schließen | `matchedGeometryEffect`/Navigation Transition |
| Floating Vinyl | Cover halten, doppeltippen | Hover-Tilt, Doppelklick | Zielbezogene 3D-Transformation und Stopp bei Reduce Motion |
| Magnetic Controls | Play drücken | Play-Button mit Zeiger erkunden | Button Style und Hover-Feedback |
| Liquid Search | Lupe antippen | Lupe, Fokus auf Eingabe | Such-Overlay |
| Playlist Fan | Auffächern antippen, Album halten | Auffächern, Karten öffnen | Snap/Drag statt nur Dekoration |
| Orbit Menu | Cover halten oder `⋯` | `⋯` anklicken | Kontextaktionen, auch ohne Long-Press |
| Wave Scrubber | Regler ziehen | Pfeile nach Fokus, Maus ziehen | Echte Playerposition; diese Demo verändert nur Sekunden |
| Glass Stack | Mehrere Songs auswählen | Gleiche sichtbare Auswahl | Massenauswahl mit Rückmeldung |
| Liquid Volume | Lautstärke öffnen | Range-Slider | System-Volume oder App-Volume separat anbinden |
| Cover Tunnel | Cover seitlich ziehen | Pfeiltasten/Buttons, klickbares Cover | Album-Navigation |
| Lyrics Peel | Zeile halten | Zeile klicken, Teilen wählen | Textkarte ohne fremde Liedtexte |
| Magnetic Queue | Zeile ziehen | HTML-Drag, Auf-/Ab-Buttons | BBT-Queue mit stabilen Identitäten |
| Audio Prism | Regler ziehen, Ebene auffalten | Range-Slider | BBT-Equalizerwerte |
| Edge Peek | Rechten Griff nach links ziehen | Griff klicken | Kontextvorschau mit Schließen |
| Mood Portal | Stimmungs-Chip antippen | Chip klicken | Cover-basiertes Theme, kein Netz erforderlich |
| Replay Cube | Tippen, seitlich wischen | Drei Seitenbuttons | BBT-Replaydaten statt Demo-Zahlen |

## 1:1-Übernahme in native BBT-Bit

Die React-Vorschau soll die **gewünschte Interaktionschoreografie** demonstrieren, nicht den Code einer SwiftUI-App ersetzen. Für native Parität:

1. **Navigation unverändert lassen:** BBT-Bits `RootView` und `PlaybackPill` verwenden bereits `TabView` und Apple-Systemmaterialien. Das zweite Dock als zusätzliche Werkzeugeinblendung integrieren, **nicht** als konkurrierende Tab-Leiste.
2. **Music Island als optionale In-App-Ansicht:** `PlaybackController` als einzige Quelle für Titel, Wiedergabestatus und Queue. Auf dem Mac keine Änderung an systemeigenen Menüleisten-/Notch-Bereichen behaupten. Echte iPhone-Live-Activity separat entwerfen.
3. **Reale Daten statt Simulationszustand:** `position`, `volume`, `queue`, Favoriten und Equalizer mit vorhandenen BBT-Bit-Controllern verknüpfen; Fehler-, Offline- und Ladezustände vorsehen.
4. **Konsistente Motion-Tokens:** Kurzreaktion 0,18–0,28 s; Morph ca. 0,35–0,5 s; Federbewegung unterbrechbar. Kein dauerhaftes Animieren teurer Blur-/Canvas-Flächen.
5. **Barrierefreiheit:** VoiceOver, Tastatur, Dynamic Type, Kontrast, `accessibilityReduceMotion`, Transparenzreduktion sowie 44×44-pt-Treffflächen auf echten Geräten testen. Gesten nie exklusiv.
6. **Plattformprüfung:** iPhone kompakt und groß, iPad, Mac, Hoch-/Querformat, 60/120 Hz, echte Wiedergabe und paralleles YouTube-Streaming prüfen.

## Qualität und Status

- Quellen: `app/src/components/bbt-bit/BBTMotionLab.tsx`, `bbtMotionLab.css`, `motionState.ts`.
- Tests: `bbtMotionLab.test.ts` (Navigation, Queue, Timing, Beispieldaten).
- QA: `cd app && npm ci && npm run build && npm run test:unit && npm run test:smoke`.
- GitHub-Pull-Request bleibt offen, bis alle einschlägigen Checks grün sind. **Kein iOS-Archiv-Build wird durch die reine UI-Kit-Web-Preview ersetzt.** Bei fehlendem Codemagic-Archive-Nachweis erfolgt kein Merge.
