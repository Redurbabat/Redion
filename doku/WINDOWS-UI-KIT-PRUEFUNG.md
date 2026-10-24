# Redion & eigenes UI-Kit: TypeScript-Prüfung unter Windows 11

**Stand:** 24. Oktober 2026. Nur Entwicklung und Prüfungen, **keine** Produkt- oder Webänderung.

## Was wurde verbessert?

`pruefungen/lauf/test578.mts` prüft Redions React-Inseln und das
bereits aus `Redurbabat/UI-Kit` übernommene Touch Kit. Die besonders
strenge TypeScript-Gegenprobe erzeugt dazu vorübergehend eine
`tsconfig` unter `os.tmpdir()`.

Vorher kamen ihre `include`-Muster direkt aus
`path.join(WURZEL, 'fremd/touch/**/*.tsx')`. Unter Windows enthielt
diese Zeichenkette Rückstriche (`C:\\...\\**\\*.tsx`), wodurch
TypeScript das Muster nicht zuverlässig erkannte (`TS18003`).
Eine Prüfung, die keine Dateien findet, kann keine Typfehler erkennen.

Die Hilfsfunktion `pruefungen/ts-glob-pfad.mjs` erzeugt stattdessen
explizit plattformneutrale `/`-Muster, inklusive absoluter
Windows-Pfade, Netzlaufwerke und Unix-Pfade.

## Prüfungen

```sh
node --test pruefungen/ts-glob-pfad.test.mjs
node pruefungen/lauf/test578.mts
```

Der kleine Node-Test prüft vier Situationen, insbesondere
`C:/Users/.../**/*.tsx` und `//server/share/.../**/*.tsx`.
Er ist auch im **Codemagic-iOS-Workflow** eingebunden, um Rückfälle
frühzeitig zu verhindern.

Die Hilfsfunktionen wurden unter Node.js 22 in einer isolierten
Testumgebung mit **4/4 erfolgreichen Gegenproben** geprüft.
Der vollständige `test578` ist noch **nicht** auf Windows 11
ausgeführt worden; er braucht die Entwicklungsabhängigkeiten des
gesamten privaten Repositories.

## Web- und iOS-Gleichstand

**`index.html`, CSS, `src/`, `quell/`, Touch-Kit-Dateien,
Notizen, IndexedDB, Capacitor und iOS-App-ID bleiben unverändert.**
Die App aus demselben Git-Commit verwendet weiterhin dieselbe
Oberfläche. Es werden keine neuen Fremd-Bibliotheken installiert.

Das eigene `Redurbabat/UI-Kit` bleibt die Quelle für Touch-Bauteile.
Es wird durch diesen Bugfix weder kopiert noch verändert.
