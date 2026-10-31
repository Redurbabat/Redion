# Batterieanlagen direkt in Redions Schaltplan

## Bedienung

1. In einem bestehenden Redion-Schaltplanblock **🔋 Batterien** öffnen.
2. Im eingeblendeten Fach eine Übung wählen und **„Aufgabe auf diese Fläche setzen“** drücken.
   Ist der Plan nicht leer, fordert Redion zuerst eine Bestätigung. Der
   vorherige Zustand bleibt über die normale Rückgängig-Funktion erreichbar.
3. Alle Batterien und die beiden Ausgangsklemmen **X+** und **X−** sind
   gewöhnliche Redion-Fachzeichen, in demselben Block gespeichert. Das
   Werkzeug **Leitung ziehen** nutzt den bestehenden Anschlussfang,
   rechtwinklige Leitungen, das Raster, die Netzliste und Undo/Redo.
   Die Ausgangsklemmen dürfen an Anschluss 1 **oder 2** angeschlossen
   werden. Bei reinen Parallelschaltungen stehen die Zellen nebeneinander,
   damit die Plus- und Minusschienen übersichtlich bleiben.
4. Über dem Plan erscheinen **U**, **Ri**, **Imax** und **Q** aus der
   tatsächlichen Verdrahtung. Die Anzeige erkennt Kurzschluss, offene
   Zweige, vertauschte Polarität und falsche Gesamtspannung.
5. Eine Batteriezelle auswählen: im Fach darunter **U**, **Ri**, **Imax**
   und **Q** eintragen und die Zellwerte übernehmen. Änderungen gehen durch
   die normale Schaltplan-Speicherung.
6. Mit **„Musterverdrahtung einsetzen“** kann eine überprüfte Beispielschaltung
   als echte Redion-Leitungen eingesetzt werden. Eine vorhandene Verdrahtung
   wird nur nach Bestätigung ersetzt und lässt sich zurücknehmen.
7. Optional den Widerstand eines Verbrauchers eingeben und den
   Versuchsschalter an-/ausschalten. Laststrom, Lastspannung und Leistung
   entstehen aus Leerlaufspannung und Gesamtinnenwiderstand, soweit
   beide bekannt sind.

**Es gibt keine zweite Zeichenfläche und keinen externen Tab.** Der
Schaltplan-Editor selbst zeichnet und verschiebt die Batterieelemente;
das Batterie-Fach zeigt nur Übungen, Nenndaten und die Berechnung an.

## Quellen der Aufgaben

- *Schaltungen von Spannungsquellen*, Kapitel 12.1, Aufgabe 1 a–d:
  sechs Leclanché-Zellen mit 1,5 V, Ri=0,3 Ω, Q=500 mAh,
  Imax=1 A. Zielspannungen 9 V / 1,5 V / 4,5 V / 3 V.
- *Batterieanlagen*, Blatt 57, Aufgabe 1a: sechs Leclanché-Zellen,
  Ri=0,5 Ω, Q=250 mAh, Imax=0,5 A. Ziel 9 V und 1,5 V.
- *Batterieanlagen*, Blatt 57, Aufgabe 1b: sechs Bleiakku-Zellen,
  Ri=50 mΩ, Q=72 Ah, Imax=12 A. Ziel 6 V und 4 V.
  **2 V pro Zelle wird als Annahme beschriftet.**
- *Schaltungen von Spannungsquellen*, Kapitel 12.2, Aufgaben 2 und 3:
  zwölf Zellen, geforderter Strom 12 A bzw. 3 A.
  Wo im Arbeitsblatt keine Ri-/Q-Angaben stehen, erscheinen diese
  Messergebnisse als **unbekannt**, nicht als erfundene Zahl.

Die anspruchsvolleren Aufgaben aus Kapitel 12.3–12.4 und Blatt 58
mit verschiedenartigen **Batteriepaketen** sind in dieser ersten
Fassung **noch nicht** nachgebildet. Hier werden gleichartige
*Einzelzellen* verschaltet. Die Zeichnungen der Zellen kommen aus dem
bestehenden Fachzeichenregister und nicht aus kopierten PDF-Bildern.

## Rechnungsweg

Das Modul **batterie-aufgaben.js** erzeugt gewöhnliche
\`Schaltplan.neuerPlan\`-Daten. Die Kennungen der sechs oder zwölf Zellen
und der Klemmen X+ und X− liegen in \`plan.batterieUebung\`.
Jede Zelle trägt ihre \`werte = {U, Ri?, Imax, Q?}\`.

Das Modul **batterie-labor-kern.js** bekommt die Plan-Netze direkt von
\`Stromfluss.netze(plan)\`. Es berechnet die Akkuverbände **nicht** noch
einmal mit einer selbst geschriebenen Kreuzungs- oder Fang-Geometrie.
Zuerst werden angeschlossene Klemmen zu Netzen zusammengefasst,
dann die Zellstufen und die Richtung gegen den Ausgang geprüft.

Für bekannte Innenwiderstände wird das reine Widerstandsnetz bei
1 A Teststrom gelöst. Daraus folgen Gesamt-Ri, Zellstromanteile,
Grenzstrom und eine vereinfachte Nutzkapazität bis zur ersten
entladenen Zelle. Die Berechnung gilt für identische, gleich geladene
Zellen und reine Gleichspannung. Ungleiche Zellen und Ausgleichsströme
sind **kein** unterstützter Einsatzfall.

Die vorhandene **▶ Strom**-Simulation von Redion behandelt
Spannungsquellen ideal. Sie kann parallele ideale Quellen nicht
allgemein bestimmen. Daher ist der Knopf in einer Batterieübung
gesperrt, solange das Batterie-Fach die eigenen Messwerte erzeugt.
Das vermeidet widersprüchliche Ergebnisse. In normalen Schaltplänen
bleibt die bisherige Stromsimulation unverändert.

Eine echte Glühlampe hat keinen während des Betriebs konstanten
Widerstand; das optionale Lastfeld rechnet ausdrücklich einen
**ohmschen Verbraucher**. Ohne Lastwiderstand ist sein Strom unbekannt.

## Bestandteile

- \`batterie-labor-kern.js\`: reine Netz-/Schaltungsrechnung
- \`batterie-aufgaben.js\`: Übungen, editierbare Zellwerte, Ergebnisfach
- \`src/bereiche/bloecke/arten/planflaeche.ts\`: native Werkzeugleiste,
  Panel-Einhängung, dieselben Speichern-/Undo-Wege
- \`src/bereiche/bloecke/arten/schaltplan.ts\`: erhält
  \`werte\` und \`batterieUebung\` beim Wiederöffnen
- \`index.html\`, \`src/dienst/sw.ts\`, \`bauen.mts\`: laden die
  beiden Module online, offline und in der Redion-Einzeldatei
- \`pruefungen/batterie-labor.test.cjs\`: Rechen- und Planformatproben

Die eigenständige HTML-Übungsseite des ersten Entwurfs wurde
**entfernt**, da das Lernen nun auf der normalen Zeichenfläche
stattfindet. Keine der hochgeladenen PDF-Dateien wird im Repository
gespeichert.

## Prüfung

Mit Node.js:

\`node --test pruefungen/batterie-labor.test.cjs\`

Anschliessend im vollständigen Projekt:

\`npm run bauen:ts && npm run typecheck\`

Für die Benutzeroberfläche ist zusätzlich eine echte Browserprobe
erforderlich: Redion öffnen, Schaltplan anlegen, Übung einsetzen,
Leitungen von Hand ziehen, Enden umhängen, Akkuwerte ändern, speichern,
Seite neu laden und alles erneut messen. Die zehn Rechenfälle sind
getrennt davon syntaktisch und rechnerisch geprüft; ein erfolgreicher
gesamter Browserlauf wird nicht behauptet.
