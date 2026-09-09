<!-- ERZEUGT — NICHT VON HAND ÄNDERN.
     Die Quelle ist chronik/chronik.json. `node chronik.mts` schreibt
     daraus diese Datei, PROBLEME.md und die Ansicht in Redion. Wer hier
     schreibt, verliert es beim nächsten Lauf. -->

# PROBLEME.md — was schiefging und wie es gelöst wurde

Ein Eintrag je Problem: das Bild, die falsche Vermutung, der Fund, die
Lösung und der Beweis. Die falschen Vermutungen stehen mit drin — sie
sind der teuerste Teil und der lehrreichste.


## Übersicht

| Nr | Datum | Titel | Schwere | Entscheidung |
|---|---|---|---|---|
| P1 | 2026-09-08 | Die Zeichenfläche stirbt nach ein paar Minuten | 🔴 schwer | E512 |
| P2 | 2026-09-08 | „Flüssiger zeichnen" — und es war nicht die Geschwindigkeit | 🟠 mittel | E511 |
| P3 | 2026-09-08 | Eine Messung, die das Falsche mass | 🟠 mittel | E511 |
| P4 | 2026-09-08 | Die Mitte einer Linie zählte beim Kritzel-Löschen nicht | 🟠 mittel | E510 |
| P5 | 2026-09-08 | Die Adernreihe schaltete nur beim Stiftwechsel um | 🟡 klein | E509 |
| P6 | 2026-09-08 | Drei Wächter, die nie rot werden konnten | 🟠 mittel | E508, E511 |
| P7 | 2026-09-08 | Ein CSS-Einschub zerschnitt eine Regel | 🟡 klein | E509 |
| P8 | 2026-09-08 | L2 ist dasselbe Schwarz wie der erste Farbtupfer | 🟡 klein | E509 |
| P9 | 2026-09-08 | Die gewählte Ader flog nicht mit herein | 🟡 klein | E511 |
| P10 | 2026-09-08 | Die Seitenleiste war ein 20-Pixel-Streifen | 🟠 mittel | E512 |
| P11 | 2026-09-08 | Ein Zweig, den git checkout zerstört hat | 🔴 schwer | E506 |
| P12 | 2026-09-08 / 09-09 | Rückstriche in Prüflauf-Textstücken | 🟡 klein | — |
| P13 | 2026-09-09 | „Eine neue PDF kopiert die aktuelle" — nicht gefunden | ⚪ offen | — |
| P14 | 2026-09-09 | Die Werkzeugzeile kippte in eine zweite — durch Zeichen, die schöner waren | 🟠 mittel | — |
| P15 | 2026-09-09 | Drei Stifte, ein Bild — und die Reparatur, die es schlimmer machte | 🟠 mittel | — |

---

## P1 · Die Zeichenfläche stirbt nach ein paar Minuten

*2026-09-08 · 🔴 schwer · E512*

**Das Bild.** Nach 5–6 Minuten Nutzung zeichnete weder Stift noch Maus. Nur Neuladen half.

**Die falsche Vermutung.** „Nach 5–6 Minuten" klingt nach einer Uhr. Es gibt eine, die alle fünf Minuten läuft.

**Wie es gefunden wurde.** Alle zehn wiederkehrenden Uhren der App (3 s bis 24 h) einzeln ausgelöst und danach gezeichnet — jede unschuldig. Dreissig Runden Zeichnen mit Seitenwechsel und Neuzeichnen: grün. Erst die andere Frage führte hin: was KANN das Zeichnen überhaupt abschalten?

**Die Ursache.** Ein einziges verlorenes `pointerup`. Die Kennung des führenden Zeigers (Schutz gegen den zweiten Finger, E354) bleibt für immer stehen, und danach wird jeder andere Zeiger abgewiesen.

**Die Lösung.** Das Ende zählt auch am Fenster; und wer aufsetzt, während der Führende 500 ms geschwiegen hat, übernimmt — der alte Zug wird ABGESCHLOSSEN, nicht verworfen.

**Warum keine Uhr.** Ein Wecker, der einen Zug nach n Sekunden schliesst, würde auch den Strich eines Menschen durchschneiden, der beim Nachdenken die Hand aufliegen lässt.

**Der Beweis.** test479: vor der Reparatur rot in neun Zusagen, danach 13/13.


---

## P2 · „Flüssiger zeichnen" — und es war nicht die Geschwindigkeit

*2026-09-08 · 🟠 mittel · E511*

**Das Bild.** Redur: „ich muss flüssiger zeichnen können".

**Die falsche Vermutung.** Flüssiger heisst schneller.

**Wie es gefunden wurde.** Gemessen: 1200 Punkte auf einem Blatt mit 200 Marken, je vier Punkte ein Bild — 16,7 ms je Bild, im ersten wie im letzten Drittel, kein einziger Aussetzer über 20 ms.

**Die Ursache.** Nicht die Bildrate, sondern WO die Tinte liegt. Bei 0,4 px/ms — dem Tempo der Handschrift — lag die gezeichnete Spitze 7,16 px neben der Stelle, an der der Stift beim Erscheinen des Bildes wirklich ist. Und der Fehler wechselte mit dem Tempo das Vorzeichen.

**Die Lösung.** Der nasse Schwanz rechnet an den ROHEN Punkten und beginnt an der zuletzt gemessenen Stelle. Vor der Vermutung steht eine Messung.

**Was es kostet.** Bei sehr schnellem Zug bleiben 15,75 px Fehler — die 26-px-Grenze bremst mit Absicht: eine Tinte, die vierzig Pixel vorausschiesst, malt ein Häkchen, das niemand gezogen hat.

**Der Beweis.** test478 §3: bei vier Tempi und zwei Abtastraten liegt die Tinte an der Spitze.


---

## P3 · Eine Messung, die das Falsche mass

*2026-09-08 · 🟠 mittel · E511*

**Das Bild.** `getScreenCTM` kostete angeblich 15 % des Zeichenwegs.

**Die falsche Vermutung.** Man kann den Zeichenweg messen, ohne dass echte Bilder dazwischen liegen.

**Wie es gefunden wurde.** Dieselbe Messung mit echten Bildern dazwischen: 45 %.

**Die Ursache.** Der Browser merkt sich die Bildschirmmatrix, solange nichts am Aufbau schmutzig ist. Beim echten Zeichnen ist er das — der nasse Strich schreibt zwischendurch sein `d`.

**Die Lösung.** Die Messung wiederholt, mit `requestAnimationFrame` zwischen den Ereignissen. Die richtige Zahl steht in E511.

**Die Lehre.** Eine Messung ohne das, was gemessen werden soll, misst nichts. Das ist derselbe Fehler wie L103 Punkt 2, nur eine Ebene feiner.


---

## P4 · Die Mitte einer Linie zählte beim Kritzel-Löschen nicht

*2026-09-08 · 🟠 mittel · E510*

**Das Bild.** `test439` wurde rot — ein Gekritzel über einer Linie nahm sie nicht mehr weg.

**Wie es gefunden wurde.** Der Lauf war auch auf dem Stand VOR dem Bogen rot (in einem eigenen Arbeitsbaum nachgesehen). Gebrochen hatte es E504 aus demselben Durchgang.

**Die Ursache.** Die Hälfte-Regel zählte die GESPEICHERTEN Punkte einer Marke. Ein Strich hat hunderte, eine gerade Linie zwei — ihre Enden. Ein Gekritzel über die Mitte nahm sie deshalb seit E466 nie weg.

**Die Lösung.** `InkGeometry.densify` legt Messpunkte auf den Weg; die Regel misst bei beiden die Länge.

**Die Gegenrichtung.** Daneben steht die Zusage, dass ein kurzes Gekritzel am Rand die Linie NICHT wegnimmt — eine Reparatur am Löschen darf nicht mehr löschen (§51).

**Der Beweis.** test439 von 34 auf 38 Zusagen; Gegenprobe rot gesehen.


---

## P5 · Die Adernreihe schaltete nur beim Stiftwechsel um

*2026-09-08 · 🟡 klein · E509*

**Das Bild.** Wer Redion mit dem Leiterstift schloss und wieder aufmachte, sah die fünf gewöhnlichen Farben und einen Stift, der etwas anderes zeichnet.

**Wie es gefunden wurde.** DAS BILD, nicht der Prüflauf — der klickte sich zum Leiterstift durch und löste den Wechsel damit selbst aus.

**Die Ursache.** Die Umschaltung lief nur beim Stiftwechsel, nicht beim Aufbau der Leiste.

**Die Lösung.** Ein Aufruf beim Bauen, und eine Zusage, die ohne einen einzigen Klick nachsieht.

**Die Lehre.** Ein Prüflauf, der den Zustand selbst herstellt, prüft nicht den Zustand beim Öffnen.


---

## P6 · Drei Wächter, die nie rot werden konnten

*2026-09-08 · 🟠 mittel · E508, E511*

**Das Bild.** Drei Zusagen waren VOR der Arbeit schon grün.

**Wie es gefunden wurde.** Gegenprobe: das Gebaute zurückgedreht — die Zusagen blieben grün.

**Die Ursache.** Zwei suchten CSS-Regeln, die es längst gab; eine mass NACH dem Weggehen statt währenddessen. Später kam eine vierte dazu: „alle Schritte der Welle sind gleich gross" ist auch bei lauter Nullen wahr.

**Die Lösung.** Alle vier geschärft: mit der echten Maus messen, die neue Regel beim Namen nennen, im richtigen Augenblick messen, und „grösser als null" dazu.

**Die Lehre.** Wer eine neue Zusage schreibt, prüft zuerst, ob sie überhaupt rot werden KANN (§55.2).


---

## P7 · Ein CSS-Einschub zerschnitt eine Regel

*2026-09-08 · 🟡 klein · E509*

**Das Bild.** `.blatt-farbe-weg` galt nie — die gewöhnlichen Farbtupfer blieben neben den Adern stehen.

**Wie es gefunden wurde.** Erst das Bild. Der Prüflauf fragte nach der KLASSE statt nach der Sichtbarkeit und war zufrieden.

**Die Ursache.** Der Einschub landete mitten in einer mehrzeiligen Regel.

**Die Lösung.** Regel repariert, und die Zusage misst jetzt mit `getBoundingClientRect`.


---

## P8 · L2 ist dasselbe Schwarz wie der erste Farbtupfer

*2026-09-08 · 🟡 klein · E509*

**Das Bild.** Beim Öffnen leuchtete L2 auf, egal welche Ader zuletzt geführt wurde.

**Die Ursache.** Die Hervorhebung verglich FARBEN. `#111111` gibt es zweimal.

**Die Lösung.** Sie vergleicht `data-leiter`. Die Farbe ist eine Eigenschaft der Ader, nicht ihr Name.


---

## P9 · Die gewählte Ader flog nicht mit herein

*2026-09-08 · 🟡 klein · E511*

**Das Bild.** Beim Umschalten auf den Leiterstift kamen neun Tupfer als Welle — der zehnte, der gewählte, stand einfach da.

**Wie es gefunden wurde.** Der Prüflauf; er mass den Namen der Bewegung je Tupfer.

**Die Ursache.** Der Klecks hing an derselben Klasse wie die Auswahl und gewann gegen die Welle.

**Die Lösung.** Zwei Anlässe, zwei Klassen: die Welle gehört dem Erscheinen, der Klecks dem Antippen.


---

## P10 · Die Seitenleiste war ein 20-Pixel-Streifen

*2026-09-08 · 🟠 mittel · E512*

**Das Bild.** Die Werkzeugleiste links am Blatt war nicht zu erkennen.

**Wie es gefunden wurde.** Das Bild, in einer Sekunde.

**Die Ursache.** `width:auto; max-width:82px` — absolut gesetzt schrumpft eine Flexbox auf ihren Inhalt, und der hat `min-width:0`.

**Die Lösung.** Eine feste Breite: 64 px, und die Knöpfe füllen sie.

**Die Lehre.** Kein Prüflauf hätte das gefunden — es gab nichts Falsches zu messen, nur etwas Unsichtbares zu sehen.


---

## P11 · Ein Zweig, den git checkout zerstört hat

*2026-09-08 · 🔴 schwer · E506*

**Das Bild.** Die ganze Arbeit an einem Bogen war weg.

**Die Ursache.** `git checkout <datei>` auf eine Datei mit ungesicherten Änderungen. Kein Papierkorb, kein Zurück.

**Die Lösung.** Der Bogen wurde aus dem deterministischen Muster neu aufgebaut. Aufgeschrieben als Verstoss gegen den Geist von §43.

**Die Lehre.** §43 nennt reset --hard, clean und restore. checkout auf EINE Datei ist genauso endgültig und stand nicht in der Liste. Jetzt steht es in der Chronik.


---

## P12 · Rückstriche in Prüflauf-Textstücken

*2026-09-08 / 09-09 · 🟡 klein*

**Das Bild.** Ein Prüflauf liess sich plötzlich nicht mehr starten: „Expected ',' got …".

**Die Ursache.** Ein Rückstrich in einem KOMMENTAR innerhalb eines Textstücks beendet das Textstück. Fünfmal in diesem Durchgang.

**Die Lösung.** Kommentare ohne schräge Anführungszeichen schreiben. Ein Wächter durchsucht die `evaluate`-Textstücke danach.

**Die Lehre.** Derselbe Fehler fünfmal heisst: es ist kein Fehler, sondern eine Falle. Fallen gehören abgesichert, nicht gemieden.


---

## P13 · „Eine neue PDF kopiert die aktuelle" — nicht gefunden

*2026-09-09 · ⚪ offen*

**Das Bild.** Redur: beim Einfügen einer neuen PDF wird die aktuelle kopiert.

**Wie gesucht wurde.** Drei Wege gemessen: `dateiAlsDokument` mit zwei verschiedenen PDFs (zwei Dokumente, zwei Quellen, 2 gegen 4 Seiten, 600 gegen 420 pt), der Kopfknopf „PDF öffnen" bei offener erster Akte, und das „+" → „PDF einlesen" ebenso. Alle drei sauber.

**Was offen ist.** Der vierte Weg — `page-add-pdf` im Seitenmenü des Dokuments — liess sich vom Prüflauf nicht öffnen. Dort wäre auch die plausibelste Ursache: dieser Weg fügt MIT ABSICHT in das offene Dokument ein.

**Was fehlt.** Eine Angabe von Redur: welcher Knopf, in welcher Ansicht. Ein Bild mit einem Pfeil würde reichen.

**Der Stand.** Nicht behoben und nicht widerlegt. Steht als L139 — nicht gefunden ist etwas anderes als nicht vorhanden.


---

## P14 · Die Werkzeugzeile kippte in eine zweite — durch Zeichen, die schöner waren

*2026-09-09 · 🟠 mittel*

**Das Bild.** Nach dem Einbau der gezeichneten Zeichen standen die dreizehn Werkzeuge am Rechner in zwei Zeilen statt einer. test351 meldete [2,true] statt [1,true].

**Die falsche Vermutung.** Der erste Gedanke war, die Zusage sei zu streng und gehöre gelockert — genau wie zwei Tage zuvor bei test348 und test438, wo aus „zwei Zeilen" ehrlich „höchstens drei" wurde. Das wäre hier falsch gewesen: dort war ein Knopf DAZUGEKOMMEN, hier war nur ein Zeichen breiter geworden.

**Wie gesucht wurde.** Nachgemessen statt geschätzt, in einem Arbeitsbaum am alten Stand: bei 1600 px Fenster und 1184 px Leiste brauchten die dreizehn Knöpfe mit Emoji 1067 px, mit Zeichnung 1142. Der Unterschied sind rund 6 px je Knopf — die Zeichnung ist fest 18 px breit, ein Emoji war im Mittel 12.

**Die Ursache.** Nicht die Zeichen, sondern ihre feste Breite: dreizehnmal sechs Pixel.

**Die Lehre.** Ein Bild hätte das nie gemeldet — zwei Zeilen sehen ordentlich aus. Gefunden hat es eine Zahl, die seit E359 in einem Prüflauf steht. Deshalb sind Zusagen mit Zahlen mehr wert als Zusagen mit Eindrücken (§55.2).


---

## P15 · Drei Stifte, ein Bild — und die Reparatur, die es schlimmer machte

*2026-09-09 · 🟠 mittel*

**Das Bild.** Auf einem Blatt mit allen Zeichen nebeneinander sahen Füller, Kugelschreiber und Bleistift aus wie derselbe schräge Stift. In der Stiftreihe stehen sie direkt nebeneinander, und man wählt sie mit den Augen.

**Die falsche Vermutung.** „Jeder Stift ist an seiner Spitze zu erkennen.“ Der Satz stand als Kommentar im Register — beim Zeichnen geschrieben, in einer 44-px-Ansicht. In der Leiste sind es 16 px, und dort ist eine Spitze zwei Punkte gross. Der zweite Irrtum kam gleich danach: schärfere Spitzen, ein Luftloch und Griffrillen sollten helfen — gemessen stiegen die drei Paare von 73/69/54 % auf 85/83/81 %.

**Wie gesucht wurde.** Jedes Zeichen in 16 × 16 gerastert und für jedes Paar gezählt, wie viele Tintenpunkte beide teilen (Schnitt durch Vereinigung). Das gibt eine Zahl, wo vorher ein Eindruck war.

**Die Ursache.** Bei 16 px trägt der SCHAFT die ganze Tinte. Jede Verzierung liegt unter einem Punkt und verschwindet, während der gemeinsame Umriss bleibt.

**Der Stand.** Behoben. `test480 §7` hält die Grenze bei 60 %, und die Gegenprobe mit den drei alten Stiften meldet 73 %.

**Die Lehre.** Ein Bild findet, dass etwas gleich AUSSIEHT. Eine Messung sagt, ob eine Reparatur hilft — und diese hat den zweiten Irrtum in dreissig Sekunden gemeldet, statt ihn in die App zu lassen. Beides zusammen, nicht eins davon (§55).

