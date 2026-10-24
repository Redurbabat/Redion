# Vollständigkeit von Redion-Sicherungen – Web und iOS

Stand: 24. Oktober 2026. Diese Änderung gilt für **beide** Varianten,
denn sie liegt in der gemeinsamen Redion-Quelle
`src/schale/aufbau/schale.ts`, nicht in einer abweichenden iOS-Oberfläche.

## Der behobene Fehler

Ein unterbrochener Import kann einen Datei-Datensatz erzeugt haben, dessen
Stücke fehlen. `Dateien.alsBlob(id)` gibt dafür zu Recht `null` zurück.

Der bisherige Export hat diesen Anhang zwar nicht ins ZIP gepackt,
den Datensatz aber trotzdem in `dateien.json` aufgeführt – und
`daten.json` konnte gleichzeitig `Vollständig` behaupten. Beim späteren
Wiederherstellen sah die Datei damit versprochen, aber nicht vorhanden aus.
Auch eine zu kurze Blob-Datei war zuvor im Export nicht gesondert abgefangen.

## Neues Verhalten

1. `dateien.json` nennt ausschliesslich diejenigen normalen (nicht
   abgeleiteten) Dateien, die wirklich unter `dateien/...` im ZIP liegen.
2. Fehlende, unfertige oder gegenüber ihrer angegebenen Grösse abweichende
   Dateien werden **nicht** als vollständig ausgegeben.
3. `daten.json` erhält bei solchen Fällen die Zahl
   `unvollstaendigeDateienAusgelassen` und einen sichtbaren `hinweis`
   mit bis zu fünf Dateinamen. Statt `Vollständig` steht dann
   `Teilweise: ...`.
4. Die anderen Notizen und vollständigen Anhänge werden weiter gesichert.
   Das System löscht oder verändert die unvollständigen Quelldateien nicht.
5. Redion meldet bei einer lückenhaften Sicherung ausdrücklich
   `Sicherung mit Lücken gespeichert` und aktualisiert nicht den
   Zeitstempel einer **vollständigen** Sicherung.
6. Die Änderung gilt gleichermassen für den Web-Download und den
   nativen iOS-Export in die Dateien-App. Bedienoberfläche,
   `index.html`, Web-Design, Datenschema und App-ID bleiben unverändert.

## Test

`node pruefungen/lauf/test100.mts` nutzt Redions echten Browser-Export,
erzeugt einen abgebrochenen 3-teiligen Upload und prüft jetzt zusätzlich:
- Kein Eintrag im ZIP.
- Kein erfundener Satz in `dateien.json`.
- Explizite Warnung und korrekte Teilweise-Kennzeichnung in `daten.json`.
- Der bestehende Rundlauf eines vollständigen Anhangs bleibt intakt.

**Status:** Diese Prüfungen sind im Pull Request ergänzt. Ohne lokalen
Browser-Test und ohne neuen Codemagic-/iPhone-Durchlauf ist die Änderung
noch nicht auf echter Hardware verifiziert.

## Regel für künftige Redion-Entwicklung

Keine getrennte Geschäftsfunktion für Website und iPhone bauen. Beide
benutzen die gemeinsame `src/`-Quelle. iOS-spezifische Capacitor-Funktionen
sind ausschliesslich zusätzliche Adapter; `ios/vergleiche-webstand.mjs`
überprüft ihre Dateiparität beim Codemagic-Build. Die bereits installierte
iPhone-App verändert sich erst nach Installation einer neuen IPA.
