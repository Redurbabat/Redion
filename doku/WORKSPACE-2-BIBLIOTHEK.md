# Workspace 2.0 — Bibliothek und Prüfbericht vom 24. Oktober 2026

Auftrag: [Issue #134](https://github.com/Redurbabat/Redion/issues/134).
Basis: `main` bei `72b4dae5d`. Der erste Zwischenstand wurde auf Redurs
ausdrücklichen Wunsch sofort als `34ac00a62` auf `codex/redion-workspace-2`
gepusht (Entwurfs-PR #135). Nach „weiter“ folgt gemäss CLAUDE.md §43 der
frische Branch `codex/redion-workspace-2-library-review`, direkt darauf.
Dieser Bogen liefert die zuerst erlaubte Bibliothek, nicht das ganze
Workspace-Upgrade. Kein Merge nach main und kein Deployment.

## Enthalten

- Gemeinsamer Bibliothekskopf, responsive Dokumentkarten mit vorhandenen
  Vorschauen, lesbaren Titeln und tatsächlichen Metadaten.
- Direkte Favoritenaktion über die bestehende Aktionsregistrierung, mit
  Tastaturbedienung, Zustandsansage sowie Fokus-/Scroll-Erhalt.
- Suchknopf öffnet die vorhandene globale Suche; keine zweite Suchmaschine.
- Gestaltete leere Ansichten und kompaktere vorhandene Zuletzt-Karten.
- Leere Favoriten, Filter und zuletzt geöffnete Dokumente bekommen passende
  Erklärungen und echte Aktionen. Globale Ansichten zeigen keinen veralteten
  Ordnerpfad. Auf dem Telefon bleibt der Textraum frei von den Kartenaktionen.
- Der gewählte Suchtreffer hat auch während der wachsenden Auswahlmarke
  einen deckenden Grund; mehrzeilige Ausschnitte verschwinden nicht kurzzeitig
  weiss auf weiss. Die vorhandene Auswahlfeder und Suchlogik bleiben erhalten.
- Begrenzte Übergänge mit vorhandenen Motion-Marken; reduzierte Bewegung
  und Redions ruhige Darstellung schalten die neue Ankunftsbewegung ab.
- Keine Datenmigration, neue Laufzeitabhängigkeit oder Änderung am PDF-Ink.
  Die iOS-App übernimmt dieselben gemeinsamen Webdateien über Codemagic.
- Beim Bauen gefundene Altfehler behoben: sicherer Zugriff auf den bereits
  vorhandenen Sicherungseintrag statt ungeprüftem Arrayzugriff; fehlende
  Typdeklarationen der beiden bestehenden Windows-Testhilfen ergänzt.
  Das Sicherungsformat bleibt unverändert. Generierte Dateien wurden gebaut.

## Tatsächlich geprüft

- `npm run bauen:ts`, `npm run typecheck`, `npm run stand`, `npm run bauen`: grün.
- `node pruefungen/workspace-library.mts --states` und derselbe Lauf mit
  `--webkit`: je acht Kombinationen:
  390 × 844, 430 × 932, 1366 × 768, 1440 × 900, jeweils hell/dunkel.
  Geprüft: Kartenanzahl, Überlauf, 44-px-Ziele, Favorit per Leertaste,
  Fokus, tatsächliche Inhaltssuche im richtigen Ordnerbereich, PDF-Filter,
  leeren Filter zurücksetzen, Favoriten setzen/entfernen, Fokus bei entfernter
  Karte, gespeicherten Zustand nach Neuladen, Menüs, Ordner, Liste, Dokument
  per Enter, Erstellen-Aktion im leeren Ordner, Textkontrast mindestens 4,5,
  reduzierte Bewegung und Browserfehler. Die neue Prüfung war an beiden
  nachträglich gefundenen Pfad-/Suchauswahlfehlern nachweislich rot.
- `--counterprobe`: erwarteter Fehlschlag, nachdem ausschliesslich im
  isolierten Browser der Favoriten-Handler entfernt wurde. Der Test erkennt
  den fehlenden Zustandswechsel; keine Produktdatei wurde dafür verändert.
- Bestehende Regressionen: test482 **29/29** (echter PDF-Import), test600
  **214/214** (Bibliothek/Suchbereiche), test614 **122/122** (Aufwärtsgeste),
  test622 grün bei 390/820/1440 (Ink, Radierkurve, Undo/Redo und Neuladen).
- test597 nach verschärfter Messung **93/93** inklusive zweier Gegenproben;
  zuerst 85/91 wegen alter Messpunkte, danach 92/93 wegen tatsächlich
  fehlendem Textabstand. Kein Überspringen der sechs alten Zusagen.
- Architektur, gepinnte UI-Kit-Bündel, CSS-Variablen/-Namensräume,
  Quellen-/JavaScript-Abgleich, Motion-Marken und Chronik nachgeprüft:
  test537, test578, test581, test290, test298, test87, test105, test422,
  test610 und test621. test74 öffnet nur die Einzeldatei in einem frischen
  temporären Ordner: **12/12**, keine JavaScript-Fehler.
- Schnelllauf **46/47**: test109 ist rot, weil vierzehn bereits auf main
  vorhandene `.mjs`-Dateien nicht im bisherigen Null-Bestand stehen.
  Alle sind in `git ls-tree 72b4dae5d` enthalten; die betreffenden Dateien
  und der Wächter sind im Bibliotheksbogen unverändert. Keine Ausnahme
  hinzugefügt. test216 und test578 sind unter Windows inzwischen grün.
- Echte native Brücke mit denselben Paketfamilien wie Codemagic gebaut;
  **482 Webdateien bytegleich** geprüft. Eine absichtlich abweichende
  iOS-Bibliothek wird abgewiesen. 33 vorhandene native Export-/Paritäts- und
  Pfadtests grün, kein übersprungener Test. Separater Zusatzlauf mit dem
  unveränderten OCR-Hilfentest: 36/37; dessen Unix-Ausführungsfall kann unter
  Windows das Shell-Skript nicht direkt starten (ENOENT). Kein Produktfehler
  oder grüner Gesamtstand daraus abgeleitet.
- Zwei erste Windows-WebKit-Läufe hingen nach den Prüfschritten beim
  doppelten Teardown. Nur die identifizierten eigenen Testprozesse beendet;
  der letzte Kontext wird jetzt gemeinsam mit dem Browser geschlossen.
  Der vollständige Wiederholungslauf beendet sich mit Exitcode 0.
- Ein vollständiger Lauf aller nummerierten Regressionen wurde hier nicht
  gefahren. Die alten Fehlerlisten aus früheren Integrationen werden nicht
  als aktuelle Messung wiederholt.

## Echte Bilder und Nachstellen

`bilder/workspace-2/galerie.html` zeigt die acht Vorher-/Nachher-Paare sowie
je Browser und Bildschirm die Filter-, Favoriten-, Such-, Menü-, Listen- und
Leerzustände. Alle stammen aus der laufenden App, nur mit synthetischen
Prüfdaten. Bilder bleiben gemäss CLAUDE.md ausserhalb von Git.

Der neue PR-Workflow `Workspace-Bibliothek` erzeugt dieselben Bilder aus
zwei getrennten Checkouts und stellt die Galerie im herunterladbaren
Artefakt `workspace-bibliothek-vorher-nachher` bereit (14 Tage Aufbewahrung).
Er veröffentlicht keine Website. Der normale Schnelllauf bleibt unverändert.

```sh
node pruefungen/workspace-library.mts --states
node pruefungen/workspace-library.mts --webkit --states
node pruefungen/workspace-library.mts --capture=nachher
node pruefungen/workspace-gallery.mts
```

Für Vorher-Bilder einen unveränderten Basis-Checkout über
`REDION_WORKSPACE_ROOT` auswählen und `--capture=vorher` verwenden.
`--case=390-hell` beschränkt einen Diagnoselauf; ohne diese Option werden
immer alle acht Kombinationen geprüft. WebKit muss zur installierten
Playwright-Fassung passen (`npx playwright install webkit`).

Die lokale Paketprüfung `node pruefungen/workspace-parity.mts` erwartet die
bereits in Codemagic verwendeten Buildwerkzeuge in
`bilder/workspace-2/native-build/node_modules` oder in `--dependencies=...`:
`@capacitor/core@8`, `@capacitor/filesystem@8`, `@capacitor/share@8`,
`esbuild@0.25`. Keine Änderung an Redions package.json oder Sperrdatei.
Bericht: `bilder/workspace-2/ios-web-paritaet.json`.

## Noch offen vor Freigabe

- Echtes iPhone und Xcode-/IPA-Build: auf diesem Windows-Rechner nicht
  verfügbar. WebKit und bytegleiche Webdateien ersetzen keine native
  Safari-/WKWebView-Abnahme, VoiceOver oder reale Tastatur-/Safe-Areas.
- Die benannten Bestandsfehler und eine vollständige Gesamtregression.
- Die grossen Editor-/PDF-Studio- und Navigations-Upgrades aus Issue #134
  sind noch nicht implementiert. Dieser Branch beginnt mit der Bibliothek.

## Auf dem iPhone prüfen

Vorher eine externe Sicherung erstellen, vorhandene App nicht löschen.
Für einen späteren Testbuild in Codemagic genau diesen Branch und denselben
Commit wie für die Web-Testversion auswählen; den vorhandenen manuellen
iOS-Workflow verwenden. Installation/Signierung sind gesonderte Schritte.
Bibliothek hell/dunkel, Favoriten, Suche, Ordner und PDF öffnen testen;
anschliessend offline und mit reduzierter Bewegung wiederholen. Die
zusätzliche Zielleiste darf weiterhin nur beim Hochziehen aufgehen.
