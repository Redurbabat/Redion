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
| P16 | 2026-09-09 | „Eine neue PDF kopiert die aktuelle" — der Import war nie kaputt | hoch | — |
| P17 | 2026-09-09 | Der Laptop bekam den Arbeitsstand gar nicht — drei richtige Regeln ergaben zusammen eine Sackgasse | 🟠 mittel | — |
| P18 | 2026-09-09 | Der Wächter fing den Satz, der die Regel erklärt | 🟡 klein | — |
| P19 | 2026-09-09 | Ein Skript, das richtig rechnet und die falsche Frage beantwortet | 🟠 mittel | — |
| P20 | 2026-09-09 | Ein Zeugnis im Netz — gefunden in einem Protokoll, das wegen etwas anderem kam | hoch | — |
| P21 | 2026-09-12 | Zwei Regeln, die geschrieben waren und nie jemand gesehen hat | 🟠 mittel | E532 |
| P22 | 2026-09-12 | Ein Eintrag beschrieb einen Bau, den es nicht gab | 🟠 mittel | E533 |
| P23 | 2026-09-13 | Eine harte Zahl hat gemeldet — und was sie meldete, war nicht die Zahl | 🟡 klein | E549 |
| P24 | 2026-09-13 | Ein Menüband ohne ein einziges Zeichen — und jede Prüfung wäre grün geblieben | 🟡 klein | E550 |
| P25 | 2026-09-13 | Das Band fragte die Fensterbreite einmal — und behielt die Antwort | 🟡 klein | E550 |
| P26 | 2026-09-13 | Ein Knopf nahm dem Titel 44 Pixel — und die Zusage dagegen konnte den Fall nicht sehen | 🟠 mittel | E551 |
| P27 | 2026-09-13 | Eine Gegenprobe blieb gruen — weil die Zusage den gefaehrlichen Weg gar nicht ging | 🟠 mittel | E552 |
| P28 | 2026-09-13 | Ein Lauf, der allein gruen ist und im Stapel rot — zweimal hintereinander | 🟡 klein | E552 |
| P29 | 2026-09-13 | Zwei Knoepfe hiessen „Praesentieren" und taten Verschiedenes | 🟠 mittel | E553 |
| P30 | 2026-09-13 | Ein Zierstrich war als „zugedeckte Antwort" gebaut — sieben Stueck | 🟠 mittel | E553 |
| P31 | 2026-09-13 | Die naheliegende Farbreparatur haette den Barrierefreiheitsfall zerstoert | gross | E554 |
| P32 | 2026-09-13 | Der Pruefllauf hat meine Rechnung korrigiert, nicht den Code | 🟡 klein | E555 |
| P33 | 2026-09-13 | Dieselbe Feldliste hat dasselbe zum zweiten Mal vergessen | 🟡 klein | E557 |
| P34 | 2026-09-13 | Ein Stichwort in der Lueckenliste, das kleiner klang als es war | 🟠 mittel | E558 |
| P35 | 2026-09-13 | Eine Verbesserung, die ihren eigenen Schaden mitbrachte | 🟠 mittel | E558 |
| P36 | 2026-09-13 | Die Pruefung hatte unrecht und der Code recht | 🟡 klein | E559 |

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


---

## P16 · „Eine neue PDF kopiert die aktuelle" — der Import war nie kaputt

*2026-09-09 · hoch*

**Das Bild.** Redur: beim Einfügen einer neuen PDF oben wird immer die aktuelle kopiert. Stand seit dem 8. September als L139 offen — nicht behoben und nicht widerlegt.

**Die falsche Vermutung.** Dass es ein Import-Fehler sei. Drei Wege wurden gemessen (E513) und waren sauber; der vierte, das Seitenmenü, galt als letzter Verdächtiger, „weil dieser Weg mit Absicht ins offene Dokument einfügt". Auch das war falsch — er ist sauber. Die Messungen waren richtig gerechnet und haben trotzdem nichts bewiesen, weil sie fragten, ob der Import die richtige Datei ablegt, statt zu fragen, welchen Knopf ein Mensch drückt.

**Wie gesucht wurde.** Nachgesehen, was im Regal oben WIRKLICH SICHTBAR ist, statt im Import zu suchen. Gemessen: der Knopf der Kopfleiste ist dort ausgeblendet; sichtbar waren genau zwei, und derjenige mit dem Wort „PDF öffnen" war der, der die zuletzt geöffnete PDF zurückholt. Der, der importiert, hiess „PDF importieren". Dazu wurde der vierte Weg endlich gefahren — sein Knopf sitzt im Inspector, und der ist zu, solange ihn niemand aufmacht; ein Klick mehr, und er lässt sich prüfen.

**Die Ursache.** Ein Wort an der falschen Stelle. „PDF öffnen" stand am Knopf, der zurückführt; der Knopf, der öffnet, hiess „importieren".

**Der Stand.** Geschlossen. Der vierte Weg ist gefahren und sauber: zwei Seiten vorher, fünf nachher, zwei Quellen, fünf verschiedene Seitenbilder, die neuen an der richtigen Stelle.

**Die Lehre.** Wenn drei gute Messungen einen gemeldeten Fehler nicht finden, ist meist die FRAGE falsch, nicht der Melder. Redur hat genau beschrieben, was er sieht — „oben", „einfügen", „kopiert die aktuelle". Die Antwort stand die ganze Zeit im Bild, nicht im Datenfluss.


---

## P17 · Der Laptop bekam den Arbeitsstand gar nicht — drei richtige Regeln ergaben zusammen eine Sackgasse

*2026-09-09 · 🟠 mittel*

**Das Bild.** Redur fragte, wie er den aktuellen Stand auf den Laptop holt. Beim Nachsehen: es ging nicht. Sein Ordner zeigte tagelang denselben Stand, während hier zehn Bögen landeten.

**Die falsche Vermutung.** Dass die Frage nur nach dem BEFEHL fragt — „doppelklick holen.bat" wäre die schnelle Antwort gewesen. Sie wäre falsch gewesen: holen.bat holt main, und main hatte den Arbeitsstand nicht.

**Wie gesucht wurde.** Die drei Regeln nebeneinandergelegt: holen.bat holt main (E271), main bewegt sich erst bei grünem Gesamtlauf (§46), gearbeitet wird auf einem Zweig (§43). Jede für sich richtig; zusammen ist der Arbeitsstand unerreichbar.

**Die Ursache.** Keine kaputte Zeile — drei Regeln, die sich gegenseitig aussperren. Solche Fehler stehen in keiner Datei und lassen sich nur durch Nebeneinanderlegen finden.

**Der Stand.** Behoben. Gegenprobe rot gesehen: ein einziger Befehl zurück auf origin/main, drei Zusagen rot.

**Die Lehre.** Wenn eine Frage nach dem Weg gestellt wird, erst nachsehen, ob es den Weg gibt. Die schnelle Antwort wäre hier ein Befehl gewesen, der das Falsche tut — und Redur hätte den alten Stand geholt und geglaubt, er sei der neue.


---

## P18 · Der Wächter fing den Satz, der die Regel erklärt

*2026-09-09 · 🟡 klein*

**Das Bild.** Die neue Zusage „nirgends ein ausgeschriebener Benutzerpfad" wurde beim ersten Lauf rot — an genau der Zeile, die erklärt, warum man keinen schreiben soll. Sie schrieb ihn aus.

**Die falsche Vermutung.** Keine. Der Wächter war eine Minute alt und hat sofort etwas gefunden — das ist der Normalfall, wenn eine Zusage wirklich messen kann, statt nur zuzustimmen (§55.2).

**Wie gesucht wurde.** Ein grep über das ganze Verzeichnis danach: fünf weitere Stellen.

**Die Ursache.** Ein Beispiel im erklärenden Satz. Die häufigste Art, gegen die eigene Regel zu verstossen.

**Der Stand.** Behoben. Der Wächter misst genau die eine Datei, die jemand kopiert.

**Die Lehre.** Ein Wächter, der beim ersten Lauf grün ist, hat nichts bewiesen. Dieser war beim ersten Lauf rot, und zwar an einer Stelle, die niemand vermutet hätte.


---

## P19 · Ein Skript, das richtig rechnet und die falsche Frage beantwortet

*2026-09-09 · 🟠 mittel*

**Das Bild.** vergleichen.bat hätte Redur auf dem Arbeitszweig hunderte Unterschiede gemeldet, die keine sind — es verglich gegen main, und main liegt sechs Bögen zurück.

**Die falsche Vermutung.** Keine im engeren Sinn — der Fehler war einen Bogen zuvor selbst aufgeschrieben worden (L142, erster Punkt) und galt als „später". Dass Redur genau danach fragen würde, war absehbar: er hatte gerade den Arbeitszweig bekommen.

**Wie gesucht wurde.** Beim Lesen der Frage. Vor der Antwort nachgesehen, was das Skript tatsächlich vergleicht, statt es zu empfehlen.

**Die Ursache.** E517 hat holen.bat einen Zweig beigebracht und vergleichen.bat vergessen. Eine Umstellung, die an einer von drei Stellen halt macht.

**Der Stand.** Behoben. L142 Punkt 1 geschlossen.

**Die Lehre.** Eine Lücke, die man selbst aufschreibt, ist kein Ablagefach — sie ist eine Verabredung. Diese hier wurde nach einem einzigen Bogen fällig, und zwar durch die Frage, für die das kaputte Werkzeug gedacht war. Bevor man ein Werkzeug empfiehlt, sieht man nach, ob es die gestellte Frage beantwortet.


---

## P20 · Ein Zeugnis im Netz — gefunden in einem Protokoll, das wegen etwas anderem kam

*2026-09-09 · hoch*

**Das Bild.** Redur_Babat_FZ_MOE_Lehrpersonen.pdf (5 MB) und Schul Inhalt wurden bei jedem Cloudflare-Deploy mit veröffentlicht. Das Repository ist privat, die Seite nicht.

**Die falsche Vermutung.** Keine Vermutung — eine Auslassung, und zwar meine eigene von E270. Dort wurde .assetsignore gebaut, mit dem richtigen Satz „hier bleibt drin, was der Browser wirklich lädt". Die Regel stimmte, die Liste war unvollständig: sie kannte Werkstatt und Geheimnisse, aber nichts Persönliches — weil damals nichts Persönliches dalag. Eine Liste altert; eine Regel nicht.

**Wie gesucht wurde.** Gar nicht gesucht. Redur schickte das Protokoll wegen einer Namenswarnung; beim Zeilenlesen der 290 hochgeladenen Dateien standen die beiden mittendrin.

**Die Ursache.** Die Ausschlussliste zählte auf, statt zu prüfen. Und die Wurzel des Verzeichnisses ist zugleich das Veröffentlichungsverzeichnis — was dort landet, ist im Netz, sofern es niemand ausschliesst.

**Der Stand.** Behoben. Gegenprobe rot gesehen, und sie nennt die Datei beim Namen.

**Die Lehre.** Ein Protokoll, das wegen einer Kleinigkeit kommt, ganz lesen. Die Warnung, nach der gefragt wurde, war harmlos; darunter lag der Fehler, an dem der Deploy scheiterte, und weiter oben lag ein Zeugnis im Netz. Und: eine Ausschlussliste, die Namen aufzählt, hält bis zur nächsten Datei — eine, die gegen den echten Ordnerinhalt prüft, hält weiter.


---

## P21 · Zwei Regeln, die geschrieben waren und nie jemand gesehen hat

*2026-09-12 · 🟠 mittel · E532*

**Das Bild.** Der Glasknopf hatte keinen Schatten und keinen Druckweg; die Pflegekarte bekam ein `data-rmo="light"` und zeigte nichts. Beides sah im Quelltext vollständig aus.

**Die falsche Vermutung.** Meine eigene aus E531: „es ist kein toter Stil mehr übrig". Ich hatte die `rmo-`KLASSEN gezählt und daraus auf alles geschlossen. Attributregeln (`[data-rmo~="…"]`) und die Zielliste in `motion.ts` waren nie geprüft.

**Wie es gefunden wurde.** Nicht durch Hinsehen — die Seite sah richtig aus. Dreizehn Agenten mussten jeden Vorlagenblock einzeln gegen den Code belegen, mit Datei und Zeile je Wirkung. Dabei fiel auf, dass zwei Regeln nirgends ankommen.

**Die Ursache.** Zweimal dieselbe Sorte: eine Regel zeigt ins Leere. Beim Glasknopf gewann neun Zeilen weiter oben in DERSELBEN Datei ein stärkerer Selektor (drei Klassen gegen ein Attribut). Bei der Pflegekarte stand das Ziel in der Wirkungstabelle, und die Regel dazu wurde nie geschrieben.

**Die Lösung.** Der Glasknopf bekam einen ausreichend spezifischen Selektor und endlich seinen Körper (Kuppel, Glanzplatte, Lichtsaum). Die Pflegekarte bekam den Lichtschlitz — bewusst ohne das Anheben der Kacheln, weil sie eine Zeile in einer Liste ist und hebende Zeilen die Liste zappeln lassen.

**Warum keine Uhr.** —

**Der Beweis.** `test496` (aus E534) hält den echten Schatten am Glasknopf und war vorher rot. Für die Pflegekarte steht der Nachweis noch aus, als Teil von L149.


---

## P22 · Ein Eintrag beschrieb einen Bau, den es nicht gab

*2026-09-12 · 🟠 mittel · E533*

**Das Bild.** In ENTSCHEIDUNGEN.md stand unter E533: „Gebaut wurde in einem Zug, zehn Agenten parallel." Gebaut wurde nichts. In LUECKEN.md stand aus demselben Grund „gebaut und typgeprüft ist alles".

**Die falsche Vermutung.** Keine Vermutung — eine Reihenfolge. Der Eintrag war geschrieben, WÄHREND die Agenten liefen, im Futur gedacht und im Perfekt formuliert. Danach starben alle zehn am selben Sitzungslimit (HTTP 429), acht ohne eine Zeile, und der Absatz wurde nicht nachgezogen.

**Wie es gefunden wurde.** Beim Wiederaufnehmen der Arbeit: der Zweig war leer, die Fragmente fehlten, und der Eintrag behauptete das Gegenteil.

**Die Ursache.** Dokumentation vor der Tatsache geschrieben. Derselbe Fehler wie E21, nur nicht im Code: aufgeschrieben, was erwartet wurde, statt nachgesehen, was geschah.

**Die Lösung.** Beide Stellen berichtigt, der falsche Absatz bleibt mit Nachtrag stehen (§35: eine bekannte Lücke ist besser als ein stiller Fehler). E533 ist seither die ENTSCHEIDUNG, E535 der Bau.

**Warum keine Uhr.** —

**Der Beweis.** Die Agentenprotokolle: zehn Abbrüche mit `rate_limit`, HTTP 429, und im Arbeitsordner genau zwei geschriebene Fragmente von zehn.


---

## P23 · Eine harte Zahl hat gemeldet — und was sie meldete, war nicht die Zahl

*2026-09-13 · 🟡 klein · E549*

**Das Bild.** `test114` wurde rot: „Es führt zu einundzwanzig Sachen" — es waren zweiundzwanzig geworden, weil dieser Bogen „Präsentation" ins Anlegen-Menü gestellt hat.

**Die falsche Vermutung.** Die naheliegende Behebung: die 21 auf 22 heben, fertig. Genau das stand im Prüflauf verboten — die Zeile trug seit E236 den Satz mit, der nächste Zuwachs brauche „eine Antwort, nicht nur eine neue Zahl".

**Wie es gefunden wurde.** Im Stapel-Lauf nach dem Bogen, 1 von 13 Läufen rot. Nicht durch Hinsehen: das Blatt sieht mit 22 Wegen genauso aus wie mit 21 — man sieht ja beide Male nur den Anfang.

**Die Ursache.** Kein Fehler im Code, sondern eine überschrittene Grenze. Gemessen bei 428 × 926: 22 Wege in 6 Überschriften, Liste 757 px hoch, Inhalt 1787 px, ohne Rollen sichtbar 10 von 22. Das Blatt war als WEGWEISER gebaut — es sollte dem, der nicht weiss, dass Redion Karteikarten kann, alles zeigen. Es zeigt noch ein Drittel.

**Die Lösung.** Die Zahl gehoben UND die Antwort gegeben: L154 in `LUECKEN.md` mit den drei möglichen Ordnungen und ihren Kosten (zusammenklappbare Gruppen, Suchfeld, zwei Ebenen). Keinen Weg weggenommen — jeder ist eine echte Funktion (§47). Dazu zwei neue Zusagen in `test114`, die für eine rollende Liste gelten: dass sie wirklich rollt (1787 in 757) und dass ihr letzter Eintrag unten ankommt (64 px, ganz sichtbar).

**Warum keine Uhr.** —

**Der Beweis.** Beide neuen Zusagen rot gesehen (§50): einmal das Rollen im Messen weggenommen — „ganz sichtbar: false"; einmal die Roll-Schwelle auf +2000 gesetzt — „1787 px Inhalt in 757 px", damit klar ist, dass die Zeile die Messung liest und kein festes `true`. Beide Male 154 ok / 1 offen; behoben 155 grün.

**Die Lehre.** Eine harte Zahl in einem Prüflauf ist kein Ärgernis, sondern der einzige Melder, den eine wachsende Liste hat — und sie meldet nicht immer das, wonach sie aussieht. Hier meldete sie nicht „die Zahl stimmt nicht", sondern „das Blatt ist etwas anderes geworden". Dieselbe Zeile war ein Jahr davor schon einmal still rot (E513 → E522), weil niemand sie hörte; diesmal war der Preis nur ein Absatz statt eines vollen Laufs.


---

## P24 · Ein Menüband ohne ein einziges Zeichen — und jede Prüfung wäre grün geblieben

*2026-09-13 · 🟡 klein · E550*

**Das Bild.** Auf dem ersten Bild des Folienbands stand die ganze Reihe als nackter Text da: „Neue Folie   Folienliste   Präsentieren   Als PowerPoint   Als PDF   Drucken". Kein Symbol, keine Kachel, nur Wörter nebeneinander.

**Die falsche Vermutung.** Die naheliegende: die Einträge tragen keine Zeichen. Nachgesehen tragen sie welche — `plus`, `page`, `play`, `download`, `printer`, alle gültige Namen aus dem Symbolregister.

**Wie es gefunden wurde.** Nur durch das Bild (§55.3). Gemessen war zu dem Zeitpunkt alles richtig: 6 Knöpfe, richtige Namen, richtige Gruppen, jeder mit `title` und `aria-label`, jeder tat beim Klick das Richtige.

**Die Ursache.** `Menueband.knopf` hängt für einen Symbolnamen nur ein LEERES `<span data-sym="plus">` ein. Gemalt wird es später von `Register.symbole.fuelle(wurzel)` — im globalen Band steht dieser Aufruf an drei Stellen, im neuen Folienband an keiner.

**Die Lösung.** Ein `Register.symbole.fuelle(flaeche)` nach jedem Füllen der Bandfläche, mit `try` darum: fehlt das Register, bleibt der Name stehen — schlechter, aber nicht kaputt.

**Warum keine Uhr.** —

**Der Beweis.** Die Zusage sucht nicht `data-sym` — der Kasten kann leer sein —, sondern das GEMALTE: ein `<svg>` darin, ein Textzeichen oder eine Farbprobe. Gegenprobe gefahren (den Aufruf wieder herausgenommen): 42 grün, 1 rot, „38 Knöpfe ohne gemaltes Zeichen".

**Die Lehre.** Ein Knopf kann vollständig sein und trotzdem falsch aussehen. Alles, was ein zusammengesetzter Prüflauf fragen konnte — da? richtig benannt? tut es etwas? spricht es mit einem Vorleseprogramm? —, war mit Ja zu beantworten. Was fehlte, war das, was man SIEHT. Genau dafür steht §55.3 in der CLAUDE.md, und genau deshalb reicht dort keine Messung.


---

## P25 · Das Band fragte die Fensterbreite einmal — und behielt die Antwort

*2026-09-13 · 🟡 klein · E550*

**Das Bild.** Ein Fenster von 1440 auf 800 gezogen: das Folienband blieb stehen, obwohl es dort nicht hingehört. Umgekehrt aufgezogen: es kam nie.

**Die falsche Vermutung.** Keine — der Fehler war nie sichtbar. Er wurde beim LESEN des eigenen Diffs gefunden, mit der Frage „was würde hier schiefgehen".

**Wie es gefunden wurde.** Weder gemessen noch auf einem Bild. Beim Durchgehen der eigenen Änderung fiel `innerWidth < BAND_AB` auf: eine Zahl, die beim Zeichnen EINMAL gefragt wird, in einem Studio, das bei `resize` nicht neu zeichnet.

**Die Ursache.** `folienbandBauen` liest `innerWidth` beim Aufbau. Das Dokumentstudio hat einen `resize`-Griff (`beiGroesse`), der aber nur Höhen nachrechnet — richtig so, denn ein Neuzeichnen bei jeder Fensterbewegung wäre bei achtzig Seiten teuer. Das Band war dort nur nicht eingetragen.

**Die Lösung.** `folienbandNachziehen()` in `beiGroesse`: es vergleicht, ob ein Band da sein SOLL und ob eines da IST, und hängt nur beim Unterschied ein oder aus.

**Warum keine Uhr.** —

**Der Beweis.** Zwei Gegenproben, beide gefahren: die Funktion nichts tun lassen (49 grün, 2 rot — das Band blieb bei 800 px stehen), und sie nur AUSHÄNGEN lassen (47 grün, 4 rot — es kam beim Aufziehen nicht zurück). Die zweite war nötig, weil sonst nur die naheliegende Richtung geprüft gewesen wäre.

**Die Lehre.** Zwei Sachen. Erstens: das eigene Diff noch einmal mit der Frage lesen, was daran schiefgehen könnte — dieser Fehler stand in keiner Messung und auf keinem Bild. Zweitens: die erste Form der Gegenprobe (den AUFRUF entfernen) liess den Zweig wegen `noUnusedLocals` gar nicht mehr bauen. Eine Gegenprobe, die nicht baut, ist keine — CLAUDE.md §52.6 beschreibt genau diesen Fall, und ich bin trotzdem hineingelaufen.


---

## P26 · Ein Knopf nahm dem Titel 44 Pixel — und die Zusage dagegen konnte den Fall nicht sehen

*2026-09-13 · 🟠 mittel · E551*

**Das Bild.** Am Telefon zeigte „📽️ Folie" als einziger Knopf der Dokumentleiste sein WORT (alle anderen nur ihr Zeichen), und das Wort brach im 44-px-Kasten um. Dem Titel eines Foliensatzes blieben 70 px: „Neue Pr…".

**Die falsche Vermutung.** Beim Bauen von E549 gar keine — die Telefonbreite wurde schlicht nicht nachgemessen. Die Bilder dieses Bogens waren Rechnerbilder.

**Wie es gefunden wurde.** Auf dem Bild eines ANDEREN Bogens. Beim Nachsehen, ob die stehende Folie am Telefon mittig sitzt, fiel der umgebrochene Knopf im Kopf auf.

**Die Ursache.** Zwei Schichten. Oben: `test285` verlangt fuer den Titel ueber 100 px und haelt das seit E296 — aber er oeffnet ein PDF, und bei einem PDF ist der Folien-Knopf ohnehin versteckt. Die Zusage war da und konnte den Fall nicht sehen. Darunter: derselbe Fehler war 2026 schon einmal gemacht worden. Neben `print` steht in `pdf-studio.css` seit E493 die Zahl 70 als Kommentar — genau diese siebzig.

**Die Lösung.** Der Knopf zieht am Telefon in die Ansichtsklappe, denselben Weg, den E468 fuer die Suche und E493 fuer „Praesentieren" gegangen sind. Titel danach 114 px. `test507 §4` misst es jetzt an einem FOLIENSATZ, also dort, wo `test285` nicht hinsieht.

**Warum keine Uhr.** —

**Der Beweis.** Gegenprobe gefahren: den Knopf oben stehen lassen — 32 gruen, 2 rot, „70 px — vorher 70". Die Zahl reproduziert sich auf den Pixel.

**Die Lehre.** Eine gruene Zusage beweist nur das, was sie ansieht. `test285` prueft die Kopfleiste seit E296 sorgfaeltig — an einem PDF. Ein neuer Knopf, der nur bei EINER Dokumentart erscheint, ist damit unbeobachtet, und dass die Suite gruen bleibt, heisst nichts. Wer eine Bedingung einfuehrt (`hidden = !istFoliensatz(page)`), fuehrt einen zweiten Fall ein, den niemand misst.


---

## P27 · Eine Gegenprobe blieb gruen — weil die Zusage den gefaehrlichen Weg gar nicht ging

*2026-09-13 · 🟠 mittel · E552*

**Das Bild.** Gegenprobe G4 von `test508`: die Zeichenleiste beim Verkleinern des Fensters NICHT in Sicherheit bringen, also den Fall bauen, in dem sie beim Entfernen des Bandes mitgerissen wird. Ergebnis: 40 gruen, 0 rot. Die Zusage meldete nichts.

**Die falsche Vermutung.** Kurz die naheliegende: „dann ist der Fehler wohl gar nicht moeglich". Er war moeglich — nur wurde er nicht ausgeloest.

**Wie es gefunden wurde.** Durch die Gegenprobe selbst. Sie ist genau dafuer da: erst wenn eine Zusage nachweislich rot werden KANN, ist ihr Gruen etwas wert (§55.2, §50).

**Die Ursache.** §4 rief nach `setViewportSize(800)` ein `oeffne(deck)` — und baute damit das ganze Studio frisch auf. Die Leiste entstand dabei neu, ganz gleich, ob der Griff beim Schrumpfen sie gerettet haette. Der gefaehrliche Weg (das Band entfernen, WAEHREND die Leiste darin haengt) wurde nie gegangen.

**Die Lösung.** Nur noch das Fenster ziehen, sonst nichts — genau das, was ein Mensch tut. Danach meldet die Gegenprobe „0 Knoepfe": die Leiste waere wirklich weg gewesen.

**Warum keine Uhr.** —

**Der Beweis.** Vorher 40 gruen mit angewandter Gegenprobe; nachher 38 gruen, 2 rot, mit der Meldung „0" fuer die Zahl der Knoepfe. Dieselbe Gegenprobe, dieselbe Zeile — nur der Weg dorthin war vorher der falsche.

**Die Lehre.** Eine Zusage prueft nicht, was sie behauptet, sondern was sie TUT. Ein bequemer Zwischenschritt im Aufbau — hier ein Neuoeffnen — kann genau den Zustand wegraeumen, den die Zeile halten soll. Dritte Mal in dieser Sitzung: `every()` auf leerer Liste, das Register statt der Oberflaeche, und jetzt der Neuaufbau vor der Messung.


---

## P28 · Ein Lauf, der allein gruen ist und im Stapel rot — zweimal hintereinander

*2026-09-13 · 🟡 klein · E552*

**Das Bild.** `test424` meldete im Stapel „PDF page position survives reload" als rot. Allein gefahren: 50 von 50 gruen. Und beim zweiten Stapel wieder rot.

**Die falsche Vermutung.** Die bequeme: „Flake". §46 laesst sie nicht gelten, und zu Recht — zweimal dasselbe unter denselben Bedingungen ist kein Zufall, sondern eine Bedingung.

**Wie es gefunden wurde.** Im Regressionsstapel nach E552. Danach einzeln nachgefahren, um auszuschliessen, dass der Bogen selbst es gebrochen hat: er war es nicht (er aendert Woerter und den Ort der Zeichenleiste; der Lauf misst eine gemerkte PDF-Seite).

**Die Ursache.** Der Lauf wartet nach dem Neuladen auf `.document-workspace` — und liest dann sofort `.document-stage[data-aktiv]`. Die BUEHNE bekommt ihr `data-aktiv` aber erst, wenn die gemerkte Seite wieder gefunden ist. Unter Last (mehrere Laeufe parallel) kommt das Messen dem Zeichnen zuvor. Dieselbe Sorte Fehler stand vier Zeilen darueber schon einmal und ist dort mit `Store.flush()` repariert worden (E440) — nur eben fuer die andere Haelfte.

**Die Lösung.** Auf die Buehne warten, statt sie zu erraten: `waitFor` auf `.document-stage[data-aktiv]`, dann `waitForFunction` auf die Seitennummer, beides mit 15 s Grenze. Die Zusage selbst bleibt unveraendert.

**Warum keine Uhr.** —

**Der Beweis.** Vorher: zwei Stapel hintereinander rot, einzeln 50/50 gruen. Nachher: derselbe Stapel gruen. Laeuft die Grenze ab, meldet die Zeile wie vorher rot — entschaerft ist nichts.

**Die Lehre.** „Allein gruen, im Stapel rot" ist eine Aussage ueber den Lauf, nicht ueber die App. Und die bequeme Antwort darauf — einmal nachfahren und weitergehen — ist genau die, die §46 verbietet. Einen Lauf zu entschaerfen, statt ihn robust zu machen, waere §47 mit anderen Mitteln.


---

## P29 · Zwei Knoepfe hiessen „Praesentieren" und taten Verschiedenes

*2026-09-13 · 🟠 mittel · E553*

**Das Bild.** Redur: „wenn ich die gelbe antworten klicke geht es weiter und zeigt mir nicht die antwort". Gemessen: „Folie 1/2" -> Klick -> „Folie 2/2", der Deckel blieb zu.

**Die falsche Vermutung.** Meine erste: der Deckel sei nicht anklickbar (pointer-events, fehlendes data-ink-art, elVon liefert kein Element). Alle drei nachgesehen — alle drei in Ordnung. Der Deckel war nie das Problem.

**Wie es gefunden wurde.** Durch Messen beider Wege nebeneinander. Weg A (`Werkzeuge.praesentation`, den das Band startet): Treffer am Deckel, data-auf=1, Folie bleibt. Weg B (der Knopf in der Dokumentleiste): an der Stelle des Deckels liegt `DIV.document-zeigen-flaeche`.

**Die Ursache.** Es gibt ZWEI Vortragsmodi. `Werkzeuge.praesentation` ist der Folienvortrag mit Abdeckungen (E266/E544); `zeigenAn` ist der Dokumentvortrag mit Laserpointer (E493), gebaut fuer ein PDF an der Wand. Der legt eine Flaeche ueber alles (inset:0, z-index:40), die jeden Zeiger schluckt und einen Tipp als „blaettern" liest. Der Knopf in der Dokumentleiste startete immer den zweiten — auch bei einem Foliensatz.

**Die Lösung.** Das Dokument entscheidet: ein Foliensatz bekommt den Folienvortrag, PDF und Heft behalten den Laserpointer.

**Warum keine Uhr.** —

**Der Beweis.** Gegenprobe G3 (den Deckel-Zweig im Folienvortrag ausschalten) meldet woertlich „ist ‚2 / 2‘, soll ‚1 / 2‘" — 18 gruen, 3 rot. G2 (die Weiche auf jedes Dokument gehen lassen) nimmt dem Heft den Laserpointer: 17 gruen, 4 rot.

**Die Lehre.** Zwei Knoepfe mit demselben Namen, die Verschiedenes tun, sind kein Bedienfehler des Nutzers. Er hat den genommen, der dasteht — und er stand im Dokument, also erwartete er den Dokumentvortrag nicht, sondern den Vortrag SEINER Folien. Wo zwei Wege dasselbe Wort tragen, muss der Zustand entscheiden, nicht der Zufall der Platzierung.


---

## P30 · Ein Zierstrich war als „zugedeckte Antwort" gebaut — sieben Stueck

*2026-09-13 · 🟠 mittel · E553*

**Das Bild.** Eine Zusage legte einen Deckel von 540 x 160 Punkten an; gezeichnet wurde er als 207 x 7 px. Die Zahl passte um den Faktor acht nicht.

**Die falsche Vermutung.** Der Massstab sei falsch — viewBox gegen blattBreite/blattHoehe, `preserveAspectRatio="none"` zieht das Marken-SVG mit. Nachgemessen: viewBox 0 0 960 540, --seitenmass 960/540, alles stimmig. Der Massstab war nie das Problem.

**Wie es gefunden wurde.** Beim Nachrechnen der nicht passenden Zahl. Die Zusage hatte den ERSTEN `[data-ink-art="abdeck"]` im Baum genommen — und das war nicht ihrer, sondern der blaue Zierstrich unter der Ueberschrift des Layouts (173 x 6 Punkte).

**Die Ursache.** `linie()` in `vorlagen/folien.ts` baute die waagrechte Zierlinie als `art:'abdeck'` — „als flache Abdeckmarke in Akzentfarbe", mein eigener Kurzschluss aus E548: eine Abdeckmarke ist gefuellt, eine `rectangle` nicht, also nahm ich die gefuellte. `abdeck` heisst aber nicht „gefuellter Kasten", sondern EINE ZUGEDECKTE ANTWORT (E266): anklickbar, cursor:pointer, und beim Tipp verschwindet die Fuellung.

**Die Lösung.** `art:'line'` mit Strichstaerke (`breite`). Sieht gleich aus, verspricht nichts.

**Warum keine Uhr.** —

**Der Beweis.** Gegenprobe G4 (den Zierstrich wieder als Abdeckmarke bauen): 14 gruen, 7 rot, und die Zeile nennt die Zahl — SIEBEN Zierdeckel in acht Layouts.

**Die Lehre.** Eine Markenart ist kein Zeichenwerkzeug, sondern eine BEDEUTUNG. Wer sie nimmt, weil sie zufaellig so aussieht, wie er es braucht, erbt alles, was sie sonst noch verspricht. Dieselbe Sorte Fehler wie ein uebersetzter Feldname (§53.3): die Form stimmt, die Aussage nicht.


---

## P31 · Die naheliegende Farbreparatur haette den Barrierefreiheitsfall zerstoert

*2026-09-13 · gross · E554*

**Das Bild.** Kein Symptom — der Fehler ist nie gebaut worden. Die erste Untersuchung schlug fuer den gewaehlten Stift `background:var(--accent); color:var(--auf-accent)` vor und schrieb dazu, --auf-accent sei „genau dafuer da ... und in beiden Themen nachgerechnet".

**Die falsche Vermutung.** Genau die: dass ein Token, das in dunkel.css UND hell.css definiert ist, auch den acht SCHEMATA folgt. Es folgt ihnen nicht.

**Wie es gefunden wurde.** Durch die Gegenrede. Ein zweiter Agent hat die Behauptung nicht geglaubt, sondern die acht Schemata einzeln abgelesen und den Kontrast gerechnet. `aussehen.ts:112` setzt pro Schema NUR --accent; --auf-accent, --accent-text und --accent-schwach kommen unveraendert aus dunkel.css/hell.css.

**Die Ursache.** Zwei Begriffe, die gleich aussehen und es nicht sind: THEMA (hell/dunkel, zwei Stueck) und SCHEMA (acht Stueck). Ein Token kann „in beiden Themen nachgerechnet" sein und trotzdem in sechs von acht Schemata falsch stehen.

**Die Lösung.** Der gewaehlte Stift wird ein UMRISS: background:var(--bg-hover); color:var(--text); box-shadow:inset 0 0 0 2px var(--accent). Das Paar --text/--bg-hover ist je Thema nachgerechnet, der Akzent traegt keine Schrift — es braucht gar keine eigene Kontrastrechnung je Schema.

**Warum keine Uhr.** —

**Der Beweis.** Gegenprobe G3 baut den verworfenen Vorschlag und misst: nacht 3,07 · wald 2,26 · sand 3,87 · rose 3,15 · kontrast 1,43 — gegen heute 9,30:1. Die gemessenen Zahlen sind dieselben, die die Gegenrede vorher gerechnet hatte.

**Die Lehre.** Der Satz „ist in beiden Themen nachgerechnet" klang wie ein Beleg und war eine Verwechslung. Ein Beleg fuer zwei Faelle ist kein Beleg fuer acht. Und: eine Gegenrede, die den Vorschlag selbst nachrechnet statt ihn zu lesen, ist den Aufwand wert — dieser eine Fund haette §38 an der empfindlichsten Stelle gebrochen, und kein Waechter haette es gemeldet, weil es bis heute keinen gibt.


---

## P32 · Der Pruefllauf hat meine Rechnung korrigiert, nicht den Code

*2026-09-13 · 🟡 klein · E555*

**Das Bild.** `test511 §2` meldete beim ersten Lauf: „{x:216} — erwartet (360, 144)". Ich hatte die erwartete Lage eines gruppierten Kindes von Hand ausgerechnet.

**Die falsche Vermutung.** Meine erste Regung: die Kindabbildung sei falsch. Sie war richtig.

**Wie es gefunden wurde.** Nachgerechnet, statt am Code zu drehen. 914400 EMU sind 72 pt. Die INNENbreite der Gruppe war 144 pt, die AUSSENbreite 288. Das Kind sass also auf der halben INNENbreite, und 72 + 72·2 = 216 — nicht 360.

**Die Ursache.** Ich hatte 914400 EMU fuer die halbe Aussenbreite gehalten. Ein Kopfrechenfehler in der ZUSAGE, nicht im Code.

**Die Lösung.** Die erwartete Zahl berichtigt und die ganze Rechnung als Tabelle in den Pruefllauf geschrieben — mit allen vier Zwischenwerten, damit der naechste sie nicht wieder im Kopf macht.

**Warum keine Uhr.** —

**Der Beweis.** Die Gegenprobe ohne Abbildung setzt die Kinder auf (0,0) und (72,36) — genau die Innenkoordinaten. Mit Abbildung (72,72) und (216,144). Beide Zahlenpaare stehen jetzt im Kopf des Laufs.

**Die Lehre.** §45/E21 („nachsehen, nicht erinnern") gilt auch fuer Arithmetik. Eine erwartete Zahl, die aus dem Kopf kommt, ist genauso eine Behauptung wie eine erinnerte Schnittstelle — und wenn sie falsch ist, zeigt der rote Lauf auf den Code statt auf einen selbst. Rettung war, die Rechnung aufzuschreiben statt sie nachzubessern.


---

## P33 · Dieselbe Feldliste hat dasselbe zum zweiten Mal vergessen

*2026-09-13 · 🟡 klein · E557*

**Das Bild.** Die Farbe eines Absatzes wurde gelesen und kam trotzdem nicht an: „ist '', soll '#CC0000'". Grad und Fett desselben Absatzes kamen an.

**Die falsche Vermutung.** Das Lesen sei schuld — `getElementsByTagName('a:srgbClr')` finde den Wert im `a:rPr` nicht. Es fand ihn.

**Wie es gefunden wurde.** Durch den Widerspruch: wenn Grad und Fett ankommen, ist `rPr` gefunden. Also lag es hinter dem Lesen.

**Die Ursache.** `marken.push` baut die Textmarke aus einer FESTEN Feldliste zusammen — `id, art, point, breiteBox, text, fontSize, fett`. `farbe` stand nicht darin und fiel weg.

**Die Lösung.** `...(o.farbe ? { farbe: o.farbe } : {})`, genau wie E545 es vier Zeilen tiefer fuer `verlauf` tun musste.

**Warum keine Uhr.** —

**Der Beweis.** test512 §2 meldete den Fehler und ist nach der Zeile gruen.

**Die Lehre.** Eine Feldliste, die aufzaehlt, vergisst beim naechsten Feld wieder — und sie hat es an DIESER Stelle jetzt zweimal getan (E545 mit `verlauf`, E557 mit `farbe`). Sie bleibt trotzdem, denn ein blindes Durchreichen des ganzen Objekts naehme `x`/`y`/`w`/`h` mit in die Ablage. Was sich aendern laesst, ist der Hinweis daneben: die Zeile sagt jetzt, dass sie vergisst.


---

## P34 · Ein Stichwort in der Lueckenliste, das kleiner klang als es war

*2026-09-13 · 🟠 mittel · E558*

**Das Bild.** Redur: „ich will das die orginale pptx so wie es sich oeffnen". Eine Folie, in die in PowerPoint nur getippt wurde, kam mit geratener Lage, 40 pt und weissem Grund an — also fast jede Folie einer Vorlage.

**Die falsche Vermutung.** Der Punkt stand in L151 als „Geerbtes vom Layout und vom Master", einer von acht Aufzaehlungspunkten, und sein Satz endete mit „kommt weiss an". Das klang nach Kosmetik. Ich haette ihn beinahe hinter Ausrichtung und Drehung eingereiht.

**Wie es gefunden wurde.** Ein grep, bevor ich etwas annahm: `grep -n "slideLayout\|slideMaster\|notesSlide" src/bereiche/dateien/einlesen.ts` gab NICHTS zurueck. Nicht „unvollstaendig" — gar nichts.

**Die Ursache.** PowerPoint schreibt in das Folien-XML nur, was die Folie SELBST aendert. Die fehlende Erbkette nahm deshalb nicht nur den Hintergrund, sondern auch Lage und Schriftgrad JEDES Platzhalters — und ein Platzhalter ohne eigene Angaben ist der Normalfall, nicht der Sonderfall.

**Die Lösung.** Die zweistufige Kette Folie → Layout → Master ueber `.rels` (nicht ueber Dateinamen) und eine Karte der Platzhalter, in der der Master zuerst steht und das Layout ihn ueberschreibt. Der Hintergrund brauchte dabei keine neue Leitung: `--paper` gab es im Stil schon, es hatte nur nie jemand gesetzt.

**Warum keine Uhr.** —

**Der Beweis.** Die Gegenprobe, die die Kette nicht anwendet, faellt auf genau den alten Zustand zurueck: Titel bei (58,41) in 40 pt statt (36,18) in 44, Hintergrund "". 8 gruen, 5 rot.

**Die Lehre.** Ein Punkt in der Lueckenliste wird danach eingeschaetzt, WIE ER FORMULIERT IST, nicht danach, was er kostet. „Kommt weiss an" beschrieb den sichtbarsten, aber kleinsten Teil derselben fehlenden Leitung. Wer eine Luecke abarbeitet, misst zuerst nach, was sie WIRKLICH umfasst — ein grep vor der Schaetzung hat hier eine Kosmetikaufgabe als die groesste Einzelursache entlarvt.


---

## P35 · Eine Verbesserung, die ihren eigenen Schaden mitbrachte

*2026-09-13 · 🟠 mittel · E558*

**Das Bild.** Keins. Alle 17 Zusagen von test513 waren gruen, das Bild sah richtig aus, und der Fehler waere erst bei einer echten Datei von Redur aufgetaucht — als spurlos verschwundener Text.

**Die falsche Vermutung.** Dass ein farbiger Hintergrund eine reine Zugabe ist. Er ist es nicht: er aendert die Bedingung, unter der ALLES andere auf dem Blatt gezeichnet wird.

**Wie es gefunden wurde.** Beim Lesen des eigenen Diffs vor dem Commit, gegen den Strich: „was macht das mit dem, was schon da ist?" Dann nachgesehen statt vermutet — `marken.ts:11` gibt einer Textmarke ohne eigene Farbe `#111111`.

**Die Ursache.** Bis E558 war jedes Blatt weiss. Die feste schwarze Tinte war deshalb nie eine Annahme, sondern eine Tatsache — und sie wurde durch dieselbe Zeile zur Annahme, die den Hintergrund einfuehrte. Eine Folie mit dunklem Master und Text ohne eigene Farbe (weil sie im Original aus dem Thema kaeme) waere schwarz auf dunkelblau gewesen.

**Die Lösung.** Nicht raten, sondern rechnen: WCAG-Kontrast der Grundfarbe gegen `#111111`. Unter 4,5:1 bekommt ein Absatz OHNE eigene Farbe ausdruecklich Weiss; ein Absatz MIT eigener Farbe behaelt sie immer. Gemessene Kante: #767676 kippt (4,16), #888888 nicht (5,33).

**Warum keine Uhr.** —

**Der Beweis.** test513 §5, vier Zusagen an drei Gruenden plus Weiss. Die Gegenprobe ohne Kippen: 15 gruen, 2 rot. Und ein Bild (`bilder/pptx-tinte.png`), auf dem kein Absatz eine eigene Farbe nennt.

**Die Lehre.** Eine neue Faehigkeit ist nie nur eine Zugabe — sie hebt eine stille Voraussetzung auf, unter der der Rest gebaut wurde. Hier war es „das Blatt ist weiss". Die Frage vor jedem Commit ist deshalb nicht „funktioniert das Neue?", sondern „welche Annahme des Alten habe ich gerade gekippt?". Keine Pruefung dieses Bogens haette danach gesucht; das eigene Diff zu lesen schon.


---

## P36 · Die Pruefung hatte unrecht und der Code recht

*2026-09-13 · 🟡 klein · E559*

**Das Bild.** `test514 §4` meldete beim ersten Lauf: „`phClr` wird NICHT geraten — ist '#ffffff', soll ''". Eine Farbe, von der ich gerade geschrieben hatte, dass sie nicht auflösbar ist, kam als Weiss an.

**Die falsche Vermutung.** Dass mein `farbeAus` `phClr` doch irgendwo aufloest — etwa ueber einen Rueckfall im Thema.

**Wie es gefunden wurde.** Nachgesehen statt nachgebessert. `farbeAus` gab tatsaechlich '' zurueck. Das Weiss kam ZWANZIG Zeilen spaeter: die Lesbarkeitsregel aus E558 gibt einem Absatz ohne Farbe auf dunklem Grund ausdruecklich Weiss — und der Grund dieser Prueffolie war Schwarz.

**Die Ursache.** Meine Zusage hat zwei verschiedene Dinge fuer dasselbe gehalten: „die Farbe wurde nicht aufgeloest" und „die Marke hat keine Farbe". Seit E558 sind das nicht mehr dieselbe Aussage.

**Die Lösung.** `phClr` wird jetzt auf HELLEM Grund gemessen, wo die Tinte nicht kippt. Daneben steht der Kommentar, warum — sonst macht der naechste dieselbe Verwechslung in die andere Richtung und schwaecht die Zusage, um sie gruen zu bekommen.

**Warum keine Uhr.** —

**Der Beweis.** Die Gegenprobe G4 (phClr auf irgendwas aufloesen) ist auf dem hellen Grund rot: 12 gruen, 1 rot. Die Zusage kann also weiterhin rot werden — sie misst nur nicht mehr das Falsche.

**Die Lehre.** Wenn eine neue Pruefung rot ist, ist die Pruefung genauso verdaechtig wie der Code — und bei einer Zusage, die ich GERADE geschrieben habe, sogar mehr. Der Reflex „den Code anpassen, bis es gruen ist" haette hier eine richtige Regel kaputtgemacht. Der zweite Reflex — „die Zusage abschwaechen" — waere genauso falsch gewesen. Richtig war, den Messplatz zu wechseln, damit die Zusage wieder GENAU das misst, was sie behauptet.

