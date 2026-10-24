# Redion – Webversion und iPhone-App bleiben zusammen

**Stand: 24. Oktober 2026.** Diese Regel gilt für zukünftige
Redion-iOS-Änderungen. Die Webversion selbst wird hier nicht verändert.

## Ein gemeinsames Redion, zwei Laufzeitumgebungen

- **Einzige Quelle** ist der gleiche Git-Commit des Repositories.
- `index.html`, `sw.js`, `quell/`, `oeffentlich/`,
  `fremd/`, `lernpakete/` und `lernen/` werden für die
  iOS-App aus dem unveränderten Web-Build kopiert.
- Die iOS-App bekommt lediglich eine zusätzliche **native Brücke**:
  `www/redion-native-sicherung.js` und genau **einen** Skriptverweis
  in der **nur im Build erzeugten** `www/index.html`.
- Die Website-`index.html` und alle öffentlichen Webdateien bleiben
  unverändert. Die native Brücke darf **nicht** auf die Website geraten.
- Gemeinsame Funktionen, Inhalte und das UI werden in `src/` und den
  gewohnten Redion-Dateien entwickelt. Zusätzliche iOS-Funktionen
  werden über einen verfügbaren nativen Adapter eingebunden; im Web
  gelten die bisherigen Funktionen bzw. ein klarer Fallback.

## Maschinelle Schranke

Der Codemagic-Workflow führt nach dem TypeScript-Build, Kopieren und
Einfügen der iOS-Brücke diese Prüfungen aus:

```sh
node --test ios/backup-chunks.test.mjs
node --test ios/vergleiche-webstand.test.mjs
node ios/vergleiche-webstand.mjs
```

`ios/vergleiche-webstand.mjs` vergleicht **alle kopierten Dateien per
SHA-256** mit denselben Dateien im Repository-Checkout. Nur das exakt
definierte zusätzliche native Script im iOS-`www/` ist erlaubt;
jede sonstige Abweichung bricht den IPA-Build ab.

Der Prüfbericht erscheint im Codemagic-Artefakt
`build/ios-web-paritaet.json`.

## Was „gleiche Version“ ehrlich bedeutet

Der iPhone-Build verwendet **denselben Web-Code** wie ein Website-Build
aus **demselben Git-Commit**. Die über das Internet erreichbare Website
wird aber nicht automatisch neu veröffentlicht, wenn du eine IPA baust.
Damit Nutzer wirklich dieselbe Fassung bekommen, müssen sowohl die
Website-Veröffentlichung als auch der Codemagic-iOS-Build denselben
Commit verwenden.

**Kein automatisch synchronisierter Datenspeicher:** Browser und
installierte iOS-App speichern lokale Notizen zunächst in separaten
IndexedDB-Datenbanken. **Gleiches Programm bedeutet nicht gleiche
persönliche Daten**. Für gleiche Daten braucht Redion zusätzlich
einen ausdrücklich eingerichteten Synchronisierungsdienst oder
einen sicheren Export-/Importweg.

## Schutz beim Aktualisieren

- Vor dem Testen einer neuen IPA immer `.redion` sichern und
  die Datei an einem **anderen Ort als dem App-Container** kontrollieren.
- Die bisherige App nicht löschen und weder Apple-ID zum Signieren
  noch effektive Bundle-ID unbemerkt wechseln.
- Web/PWA bleiben auch dann nutzbar, wenn ein nativer Plugin-Aufruf
  in iOS fehlschlägt.
- Es gibt für diese Paritätsprüfung keine Änderung am produktiven
  Web-Datenbestand und kein automatisches Backup oder Update.
