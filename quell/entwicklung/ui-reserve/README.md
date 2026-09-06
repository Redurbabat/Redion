# Redion UI-Reserve

Dieser Ordner enthält UI-Experimente und Komponenten, die geprüft, aber
derzeit nicht produktiv verwendet werden — und die **Originale** derer, die
produktiv angepasst wurden, damit der Ursprung erhalten bleibt.

Sie sind absichtlich **nicht** Teil des Redion-Designsystems und **nicht**
in die Anwendung eingebunden: nicht in `index.html`, nicht im GRUNDSTOCK des
Dienstarbeiters, in keinem Register. `test426` hält das.

## Öffnen

    npm run server
    http://localhost:8790/quell/entwicklung/ui-reserve/

Von `file://` blockiert der Browser das Laden von `katalog.json`; die Seite
sagt das dann selbst.

## Warum die Reserve unter `quell/` liegt

Der Auftrag schlug `entwicklung/ui-reserve/` vor. Redions Bauart (§54, E28)
ist aber: was der Browser lädt, liegt unter `quell/`; TypeScript-Quelle liegt
unter `src/` und wird dorthin gebaut. `reserve.ts` liegt deshalb unter
`src/entwicklung/ui-reserve/`, das erzeugte `reserve.js` daneben in diesem
Ordner — und `test105`/`test109` brauchen keine Ausnahme dafür.

## Aufbau

    ui-reserve/
    ├── README.md            diese Datei
    ├── index.html           die Galerie
    ├── reserve.css          ihr Stil (eigene Farben, weil ohne App-Stil geöffnet)
    ├── reserve.js           ERZEUGT aus src/entwicklung/ui-reserve/reserve.ts
    ├── katalog.json         alle 50 Einträge mit Entscheidung
    └── komponenten/
        ├── 01-sparkle-generate-site/
        │   ├── original.html    unverändert, wenn es vorliegt
        │   └── notizen.md       Autor, Quelle, Status, Entscheidung, Ort, Risiken
        └── …

## Gründe für Reserve

- redundant zu einer gewählten Gewinner-Komponente
- durch eine bessere Redion-Lösung ersetzt
- nur für einen künftigen Bereich interessant
- visuell passend, aber ohne echten Zustand dahinter
- CSS noch nicht geprüft
- Zugänglichkeit oder Leistung noch offen

## Die eine Regel zum Originalcode

**Fehlender Originalcode wird nicht erfunden.** 30 der 50 Einträge liegen
ohne Code vor. Ihre Karte zeigt „Originalcode noch nicht verifiziert".
Erst wenn Autor, Struktur, sichtbarer Text, Klassen und Verhalten eindeutig
übereinstimmen, darf `original.html` ergänzt werden — nicht irgendeine
Komponente desselben Autors, nicht eine Nachbildung aus dem Gedächtnis.

Und in `original.html` wird **nichts** angepasst: keine Klassen umbenannt,
keine Farben, keine Übersetzung, keine Zugänglichkeits-„Reparatur", keine
SVG-IDs. Das alles geschieht nur in der produktiven Redion-Fassung.

## Wann eine Reserve-Komponente produktiv werden darf

1. Es gibt einen konkreten Redion-Anwendungsfall.
2. Sie ist besser als die vorhandene produktive Lösung.
3. Zugänglichkeit ist geprüft (Tastatur, Fokus, ARIA, nicht nur Farbe).
4. Hell und Dunkel sind geprüft.
5. `prefers-reduced-motion` ist geprüft.
6. Keine ungekapselten CSS-Klassen, keine SVG-ID-Kollisionen.
7. Es gibt einen Eintrag in `ENTSCHEIDUNGEN.md`.
