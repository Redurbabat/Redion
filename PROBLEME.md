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
| P37 | 2026-09-13 | Zwei alte Laeufe haben eine Aenderung gemeldet, die ich gar nicht vorhatte | 🟡 klein | E559 |
| P38 | 2026-09-13 | Dieselbe Feldliste, das dritte Mal — und diesmal umgedreht | 🟠 mittel | E560 |
| P39 | 2026-09-13 | Ein Knopf im DOM ist noch keine Funktion | 🟡 klein | E560 |
| P40 | 2026-09-13 | Alle Zusagen gruen, und das Bild zeigte zwei Fehler | 🟠 mittel | E561 |
| P41 | 2026-09-13 | Gemessen — am falschen Knoten | 🟡 klein | E561 |
| P42 | 2026-09-13 | Die Zusage wurde gruen, weil die Liste leer war | 🟠 mittel | E562 |
| P43 | 2026-09-13 | Die Zusage zeigte auf den Code, und schuld war mein Pruefstueck | 🟡 klein | E563 |
| P44 | 2026-09-14 | Zehn Tabellenzellen wurden zu zehn leeren Anhaengen | 🟠 mittel | E565 |
| P45 | 2026-09-14 | Zehn Boegen Pruefstuecke, und vier Bilder haben mehr gefunden | gross | E566 |
| P46 | 2026-09-14 | Zum vierten Mal war mein Pruefstueck schuld, nicht der Code | 🟡 klein | E567 |
| P47 | 2026-09-14 | Drei Zeilen im Stilblatt standen da und galten nie | 🟠 mittel | E568 |
| P48 | 2026-09-14 | Sieben Pixel Layout machten aus einem Glaetter einen kaputten Glaetter | 🟠 mittel | E568 |
| P49 | 2026-09-14 | Mein Zeilenraster zerschnitt eine Zeile in zwei | 🟡 klein | E570 |
| P50 | 2026-09-19 | Die Leiste ging nach oben, als ich sie nach unten stellte | 🟠 mittel | E622 |
| P51 | 2026-09-19 | «unten in der Mitte» war zwei Pixel breit | 🟠 mittel | E620 |
| P52 | 2026-09-19 | Die Strichprobe war unsichtbar | 🟡 klein | E623 |
| P53 | 2026-09-19 | Der Radiererzweig war toter Code | 🟠 mittel | E624 |
| P54 | 2026-09-19 | L150 behauptete das Gegenteil dessen, was gemessen war | gross | E626 |
| P55 | 2026-09-19 | Die vier Griffe erschienen gar nicht | 🟠 mittel | E628 |
| P56 | 2026-09-19 | Die Verbindung lief quer durch die Wurzel | 🟠 mittel | E628 |
| P57 | 2026-09-19 | Die Entf-Taste lief ins Leere | 🟡 klein | E628 |
| P58 | 2026-09-19 | Der geschriebene Grund stand da, wo ihn niemand sucht | 🟡 klein | E627 |
| P59 | 2026-09-19 | Meine eigene Rot-Erkennung konnte nicht rot werden | gross | — |
| P60 | 2026-09-19 | Die Gesamtsuite war seit PR #100 nicht gelaufen | gross | — |
| P61 | 2026-09-19 | Mein Wächter erfand eine Kopplung, die es nicht gab | 🟠 mittel | E629 |
| P62 | 2026-09-19 | Meine Sicherungskopie nahm die falsche Datei | gross | E629 |
| P63 | 2026-09-19 | Meine Reparatur machte den Wächter blind, und er wurde dadurch grün | gross | E631 |
| P64 | 2026-09-19 | Der Wächter klagte den Satz an, der von ihm handelt | 🟡 klein | E631 |
| P65 | 2026-09-19 | Zum zweiten Mal an einem Tag: das Aufschreiben erzeugte den nächsten Fehlalarm | 🟡 klein | E632 |
| P66 | 2026-09-20 | Die Linse zeigte gar keine Brechung — die Knöpfe lagen davor | 🟠 mittel | — |
| P67 | 2026-09-20 | Ein dunkler Balken quer durch die Linse, in jeder Fassung an derselben Stelle | 🟡 klein | — |
| P68 | 2026-09-20 | Ein Übergang ohne Anlass — und der Wächter hatte ihn ein halbes Jahr vorher beschrieben | 🟡 klein | — |
| P69 | 2026-09-20 | Fünfmal gerechnet, fünfmal zu früh: die Bauform war falsch, nicht die Formel | gross | — |
| P70 | 2026-09-20 | Eine Zusage, die nur rot werden kann, ist keine | 🟡 klein | — |
| P71 | 2026-09-20 | Der Wächter zerriss die Wähler und klagte dann die echten Regeln an | 🟠 mittel | — |
| P72 | 2026-09-20 | Der Wächter gegen Port-Kollisionen meldete grün und übersah sieben | gross | — |
| P73 | 2026-09-20 | Die zuletzt gelesene Seite ging verloren, sobald das Fenster sich meldete | gross | — |
| P74 | 2026-09-20 | Der Textur-Wächter bestrafte die neue Linse | 🟡 klein | — |
| P75 | 2026-09-20 | Die Bewegung war da und kam nicht an | gross | — |
| P76 | 2026-09-20 | Eine Feder, die auf ihr eigenes Ziel neu gestartet wird, verliert ihren Schwung | 🟡 klein | — |
| P77 | 2026-09-20 | Der vorausgeschickte Frame ging an niemanden | 🟠 mittel | — |
| P78 | 2026-09-20 | Ein `<svg>` ist kein `HTMLElement`, und `fokus.ts` wusste das | 🟠 mittel | — |
| P79 | 2026-09-20 | Ein Präfix fehlte im Verzeichnis, und die Zahl daneben stimmte schon vorher nicht | 🟡 klein | — |
| P80 | 2026-09-20 | Fett traf das erste Wort, nicht das markierte | 🟠 mittel | — |
| P81 | 2026-09-20 | Ein Schalter, der Sicherheit verspricht und nicht gelesen wird | 🟠 mittel | — |
| P82 | 2026-09-20 | Das Teure war gebaut, das Billige fehlte | 🟠 mittel | — |
| P83 | 2026-09-20 | Ein Blatt ohne Weg zurück, und ein Griff, der nichts hält | hoch | — |
| P84 | 2026-09-20 | Zweimal rot aus dem falschen Grund — derselbe Lauf | 🟠 mittel | — |
| P85 | 2026-09-20 | Eine Regel, die nur galt, weil es die Handlung nicht gab | 🟠 mittel | — |
| P86 | 2026-09-20 | Eine Erfolgsmeldung ist kein Erfolg | 🟠 mittel | — |
| P87 | 2026-09-20 | Derselbe Fehler, zwei Bögen später, an einer anderen Stelle | 🟠 mittel | — |
| P88 | 2026-09-20 | Die Lückenliste war selbst der stille Fehler | 🟠 mittel | — |
| P89 | 2026-09-20 | Der Titel ist nicht der Status | niedrig | — |
| P90 | 2026-09-20 | Vier Anläufe, vier erfundene Zahlen — und die Datei war immer in Ordnung | niedrig | — |
| P91 | 2026-09-20 | Ein Wächter, der die Höhe nicht sehen kann, die er prüft | 🟠 mittel | — |
| P92 | 2026-09-20 | Fast eine zweite Werkzeugzeile gebaut, die es schon gab | niedrig | — |
| P93 | 2026-09-20 | Die eigene Erklärung vor die des Anbieters gestellt | 🟠 mittel | — |
| P94 | 2026-09-20 | Die Gegenprobe war falsch, nicht der Code | niedrig | — |
| P95 | 2026-09-20 | Das Werkzeug für die Prüfläufe war selbst ungeprüft | 🟠 mittel | — |
| P96 | 2026-09-20 | Eine Auswertung, die mit einem Feld rechnet, das niemand schreibt | 🟠 mittel | — |
| P97 | 2026-09-20 | Ein Wächter, der an der Reihenfolge im Block scheitert | niedrig | — |
| P98 | 2026-09-20 | Das Verzeichnis der Querverweise zählt zu wenig | 🟠 mittel | — |
| P99 | 2026-09-20 | Ein Menuepunkt, der eine Zeichenkette schreibt, waehrend die Maschine danebensteht | 🟠 mittel | — |
| P100 | 2026-09-21 | Dieselbe Funktion zweimal — und E650 reparierte nur die eine | hoch | — |
| P101 | 2026-09-21 | Sechs Zusagen grün, weil die Liste leer war | 🟠 mittel | — |
| P102 | 2026-09-21 | OHNE_FRAGE ist die Zahl 30 | 🟠 mittel | — |
| P103 | 2026-09-21 | Der Punkt des breiten Füllers war ein Splitter — und der Wächter grün | 🟠 mittel | — |
| P104 | 2026-09-21 | Eine Gegenprobe, die gar nicht lief | 🟠 mittel | — |
| P105 | 2026-09-21 | Der Glätter hielt die Ecke, die Marke nicht — acht gleichmässige Punkte statt der Ecken | 🟠 mittel | — |
| P106 | 2026-09-22 | Frage 5 kam vor Frage 4 — 57 Karten in derselben Millisekunde, sortiert nach created | 🟠 mittel | — |
| P107 | 2026-09-25 | Der Graph der Karte malte „genannt“ als „benutzt“ | 🟡 klein | — |
| P108 | 2026-09-25 | Strg+Z nahm zweimal zurück — der Block und die ganze Seite | 🟠 mittel | — |
| P109 | 2026-09-25 | Der Seitenverlauf gab jedem Block neue Kennungen — und löschte die Fassungen der Unterseiten | hoch | — |
| P110 | 2026-09-25 | Ein Commit ohne seinen Inhalt — das Schreibskript war an einem Anführungszeichen gescheitert | 🟡 klein | — |
| P111 | 2026-09-25 | Eine Prüfung, die wider Erwarten grün blieb — der Audit hatte die Handformel für falsch erklärt | 🟡 klein | — |
| P112 | 2026-09-25 | Tiefe 0 wurde zu Tiefe 40 — `Number(x) || 40` hält 0 für „nichts gesagt“ | 🟡 klein | — |
| P113 | 2026-09-25 | Die Startdecke war sechs Tage lang gerissen, und kein Bogen hatte den Lauf als Nachbarn | 🟡 klein | — |
| P114 | 2026-09-26 | `window.App` gibt es nicht — und der optionale Zugriff schluckt es | 🟠 mittel | — |
| P115 | 2026-09-26 | Ein Wächter, der eine Absicht misst, die es nicht gibt | 🟠 mittel | — |
| P116 | 2026-09-26 | Ein Tastenkürzel, das im Menü steht und nie erreichbar war | 🟠 mittel | — |
| P117 | 2026-09-26 | Eine Kennung, zwei Bedeutungen: `ellipse` | 🟡 klein | — |
| P118 | 2026-09-27 | Hell und dunkel lieferten Ziffer für Ziffer dieselben Kontraste | 🟡 klein | — |
| P119 | 2026-09-27 | Ein Umschalter oben, und unten fällt ein Griff aus dem Fenster | 🟠 mittel | — |
| P120 | 2026-09-27 | Zwei Zweige, dieselben Nummern: E681 und test568 gab es zweimal | 🟠 mittel | — |
| P121 | 2026-10-05 | Git schneidet einen Eintrag mitten durch | 🟠 mittel | — |
| P122 | 2026-10-05 | Zwei Seiten schreiben dieselbe falsche Zahl, und Git nennt es keinen Konflikt | 🟠 mittel | — |
| P123 | 2026-10-05 | Drei Zweige, ein Escape-Griff | 🟠 mittel | — |
| P124 | 2026-10-05 | Drei Klebefilter für eine Bewegung | 🟡 klein | — |
| P125 | 2026-10-11 | Eine Seite nehmen verliert die Zeile der anderen | 🟠 mittel | — |
| P126 | 2026-10-11 | Der „Und“-Block mit Doppeln und einem abgeschnittenen Satz | 🟡 klein | — |
| P127 | 2026-10-11 | Eine rohe 46px, die test362 rot machte, und niemand fuhr test362 | 🟡 klein | — |
| P128 | 2026-10-11 | Eine geänderte Vorgabe, und ein Lauf, der in keiner Anpassungsliste stand | 🟡 klein | — |
| P129 | 2026-10-11 | Zwei Namen, je an zwei Stellen | 🟡 klein | — |

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


---

## P37 · Zwei alte Laeufe haben eine Aenderung gemeldet, die ich gar nicht vorhatte

*2026-09-13 · 🟡 klein · E559*

**Das Bild.** Nach E559 waren `test512` und `test513` rot: „ist '#cc0000', soll '#CC0000'" und „ist '#102a43', soll '#102A43'". Dieselben Farben, dieselben Werte — nur klein geschrieben.

**Die falsche Vermutung.** Mein erster Gedanke war, die Zusagen seien zu streng: Hex ist in CSS gleichgueltig gegen Gross und Klein, gezeichnet haette es dasselbe. Also die Pruefungen auf `toLowerCase` umstellen und weiter.

**Wie es gefunden wurde.** Der Batch nach dem Commit. Die neue Suite 514 war gruen — sie vergleicht selbst klein geschrieben und konnte es gar nicht sehen.

**Die Ursache.** `abwandeln` rechnete IMMER, auch wo gar kein `lumMod`/`tint` stand. Das Ergebnis lief dann durch `toString(16)` und kam klein geschrieben heraus. Eine Farbe, die unveraendert aus der Datei kommt, wurde also trotzdem umgeschrieben.

**Die Lösung.** Eine Zeile: steht keine Abwandlung im Knoten, kommt die Farbe unveraendert zurueck. Gerechnet wird nur, wo wirklich gerechnet werden muss.

**Warum keine Uhr.** —

**Der Beweis.** 512, 513 und 514 zusammen gruen. Und die drei roten Zusagen sind die Gegenprobe selbst: sie sind gefahren worden, nicht gebaut.

**Die Lehre.** Die Versuchung war, die PRUEFUNG zu lockern, weil der Unterschied „egal" aussah. Er war es fuer das Zeichnen — aber nicht fuer die Frage, ob der Leser Daten unveraendert durchreicht. Eine Zusage, die zufaellig streng ist, faengt genau die Aenderungen, die man nicht vorhatte; sie zu lockern haette dieses Netz zerschnitten. Und: meine eigene neue Suite konnte den Fund nicht machen, weil sie selbst klein vergleicht. Die alten Laeufe sind nicht Ballast, sie sind das Gedaechtnis.


---

## P38 · Dieselbe Feldliste, das dritte Mal — und diesmal umgedreht

*2026-09-13 · 🟠 mittel · E560*

**Das Bild.** `test515 §1` meldete beim ersten Lauf „ist '', soll 'mitte'". Die Ausrichtung wurde gelesen, stand im Absatz, und kam trotzdem nicht an der Marke an.

**Die falsche Vermutung.** Keine — ich wusste sofort, wo es liegt. Das war der eigentliche Befund.

**Wie es gefunden wurde.** Der Kommentar an der Stelle sagte es selbst: „Eine Feldliste, die aufzaehlt, vergisst beim naechsten Feld wieder." Er stand da, seit E557 dasselbe passiert war, und davor hatte E545 dasselbe erlebt.

**Die Ursache.** `marken.push` baute die Textmarke aus einer ERLAUBNISLISTE: id, art, point, breiteBox, text, fontSize, fett, farbe. Jedes neue Feld eines Absatzes faellt durch, bis jemand es eintraegt.

**Die Lösung.** Die Liste umgedreht. Was NICHT in die Ablage darf, ist kurz, bekannt und abgeschlossen — `x`/`y`/`w`/`h`/`art`, die Masse, aus denen `point` und `breiteBox` schon gerechnet sind. Alles andere reist ueber Rest-Destrukturierung mit.

**Warum keine Uhr.** —

**Der Beweis.** test515 §1 und §3 gruen, ohne dass `ausricht` irgendwo aufgezaehlt wird. Die frueheren Faelle (`verlauf`, `farbe`) reisen unveraendert weiter mit; 512, 513 und 514 bleiben gruen.

**Die Lehre.** Ein Kommentar, der eine Schwaeche BESCHREIBT, behebt sie nicht — er macht sie nur erwartbar. Zweimal habe ich hier die Zeile ergaenzt und den Hinweis daneben geschrieben; beim dritten Mal war klar, dass der Hinweis das Problem ist, nicht die Loesung. Die Frage ist nie „welches Feld fehlt", sondern „ist die Liste auf der richtigen Seite": Erlaubnislisten muessen wachsen, Verbotslisten nicht. Wo die verbotene Menge kurz und abgeschlossen ist, gehoert die Liste dorthin.


---

## P39 · Ein Knopf im DOM ist noch keine Funktion

*2026-09-13 · 🟡 klein · E560*

**Das Bild.** `test515 §5` war gruen: der Knopf steht in der Leiste, schaltet links → mitte → rechts → links. Auf dem Bild der fertigen Folie war er nirgends zu sehen.

**Die falsche Vermutung.** Erst: die Schriftgruppe erscheine nur beim Text-Werkzeug, ich haette den Knopf in die falsche Gruppe gehaengt. Dann: meine Messsonde sei falsch (sie WAR falsch — auf einer leeren Seite gibt es gar keine Zeichenleiste).

**Wie es gefunden wurde.** Auf dem richtigen Weg nachgemessen: der Knopf ist da, aber 0 x 0 und `display:none`. Und `fett` daneben genauso — eine Funktion, die es seit E360 gibt. Damit war klar, dass es nicht an meiner Zeile liegt. Die Ursache stand in `pdf-studio.css`: im Dokumentstudio liegt die ganze Schriftgruppe hinter dem Schalter `···` (E552), weil die schwebende Leiste unten nicht Platz fuer alles hat.

**Die Ursache.** Keine — das ist Absicht. Der Fehler lag in der PRUEFUNG: sie fragte, ob der Knopf im DOM steht, und das ist nicht dieselbe Frage wie „bekommt man ihn zu sehen".

**Die Lösung.** §5 oeffnet jetzt `···` und misst wirklich: vorher 0 x 0 und `display:none`, nachher 61 x 44, sichtbar, ganz im Bild — und die 44 px sind §37 gleich mitgeprueft.

**Warum keine Uhr.** —

**Der Beweis.** Die Gegenprobe G5 (Knopf weglassen) ging von 4 auf 7 rote Zusagen, seit §5 die Sichtbarkeit misst statt der Anwesenheit.

**Die Lehre.** §55.1 sagt „oeffne die Seite wirklich", und der Grund ist genau dieser: eine Zusage kann gruen sein, weil sie die bequeme Frage stellt. `querySelector` findet auch, was niemand sieht. Was zaehlt, ist eine gemessene Box — Breite, Hoehe, computed display, und ob sie im Bild liegt. Und das Bild hat die Frage ueberhaupt erst gestellt.


---

## P40 · Alle Zusagen gruen, und das Bild zeigte zwei Fehler

*2026-09-13 · 🟠 mittel · E561*

**Das Bild.** `test516` stand auf 23 gruen. Auf dem Bild stand „kleinGROSS" ohne Zwischenraum, und in der dritten Zeile lief „Wort" mitten in „mittendrin" hinein.

**Die falsche Vermutung.** Dass der Satz fertig sei, weil die Zahlen stimmten. Die Marken trugen ihre Laeufe, die Grade waren richtig, die Hoehe war richtig — alles, was ich zu pruefen gedacht hatte, war gruen.

**Wie es gefunden wurde.** §55.3 — ein Bild, wenn man etwas sehen kann. Ohne das Bild waere beides gefahren.

**Die Ursache.** Zwei verschiedene: (1) XML verschluckt den Zwischenraum am Ende eines `tspan`, wenn `xml:space="preserve"` fehlt. (2) Ich hatte jedem Stueck ein ABSOLUTES `x` aus `InkGeometry.textWidth` gegeben — und `textWidth` ist eine Schaetzung aus Buchstabenbreiten, die um bis zu 15 % danebenliegt.

**Die Lösung.** Nur das ERSTE Stueck einer Zeile bekommt ein `x`; die uebrigen fliessen, und SVG setzt sie mit den echten Massen. Die Schaetzung entscheidet weiterhin, WO umgebrochen wird — sie schreibt nur keine Stelle mehr ins Bild. Dazu `xml:space="preserve"`. Und `Stueck` traegt seither weder `x` noch `breite`: ein Feld, das aussieht wie eine Messung und eine Schaetzung ist, ist eine Falle.

**Warum keine Uhr.** —

**Der Beweis.** Gegenprobe G5 (jedem Stueck ein gerechnetes x) setzt beide Stuecke auf x = 40, also uebereinander: 22 gruen, 3 rot. §5 misst seither `getStartPositionOfChar`, nicht das Attribut.

**Die Lehre.** Eine Zusage prueft, was ich zu pruefen GEDACHT habe. Sie kann nicht pruefen, was mir nicht eingefallen ist — und genau dort sitzen die Fehler, die ein Mensch sofort sieht. Der Zwischenraum und die Ueberlappung waren beide unsichtbar fuer jede Zahl, die ich abgefragt habe, und beide sofort sichtbar auf dem Bild. Das ist kein Argument gegen Pruefungen, sondern fuer die Reihenfolge: erst hinsehen, dann die Zusage danach bauen.


---

## P41 · Gemessen — am falschen Knoten

*2026-09-13 · 🟡 klein · E561*

**Das Bild.** `getStartPositionOfChar` und `getBBox` gaben beide 0 zurueck. Kein Fehler, keine Ausnahme — nur Nullen.

**Die falsche Vermutung.** Nacheinander: der Knoten sei noch nicht gelayoutet (Zeit); er liege unterhalb des Fensters (scrollIntoView); `getBBox` sei der bessere Weg. Alle drei falsch.

**Wie es gefunden wurde.** Statt weiter zu raten eine Diagnosezeile eingebaut, die ALLE passenden Knoten auflistet — mit der Groesse ihrer `<svg>`. Ergebnis: es gibt ZWEI, der erste misst 0 x 0, der zweite 978 x 549.

**Die Ursache.** Der erste Treffer ist die Vorschau in der Folienliste. Ihr SVG ist nicht gezeichnet, und in einem nicht gezeichneten SVG liefert jede Geometriefrage Null — ohne dass etwas kaputt waere. Mein `find` nahm einfach den ersten.

**Die Lösung.** Erst filtern, dann nehmen: der Knoten, dessen `<svg>` breiter als 10 px ist. Der Kommentar daneben sagt, warum — sonst schreibt der Naechste wieder `find`.

**Warum keine Uhr.** —

**Der Beweis.** Danach 25 gruen, und die Gegenprobe G5 wird rot mit echten Zahlen (beide Stuecke auf x = 40) statt mit Nullen.

**Die Lehre.** Eine Messung, die Null zurueckgibt, ist nicht dasselbe wie eine Messung, die Null MISST. Bei Geometrie im Browser heisst Null fast immer „ich war nicht da" — und wer das fuer ein Ergebnis haelt, baut seine Zusage auf einem Knoten, den niemand sieht. Vor dem Messen gehoert die Frage: ist das ueberhaupt der Knoten, den ich meine, und ist er gezeichnet?


---

## P42 · Die Zusage wurde gruen, weil die Liste leer war

*2026-09-13 · 🟠 mittel · E562*

**Das Bild.** `test517 §3` meldete „KEINE Zeile ist breiter als ihr Kasten" — gruen. Daneben stand „Es wurden Zeilen gefunden — 0".

**Die falsche Vermutung.** Keine. Der Widerspruch stand in derselben Ausgabe, zwei Zeilen untereinander.

**Wie es gefunden wurde.** Durch die zweite Zusage, die ich daneben gesetzt hatte: „mindestens vier Zeilen fuellen ihren Kasten zur Haelfte". Sie wurde rot und hat die erste entlarvt.

**Die Ursache.** Zwei aufeinanderfolgende: (1) Der `blatt`-Block war von Hand mit `Store.addBlock` gesetzt und hing an keiner Seite — es gab gar kein Papier. (2) Nachdem das behoben war, suchte die Probe mit `find(svg => breite > 10)` und traf ein Symbol von 25 px mit null Texten statt `svg.blatt-marken`.

**Die Lösung.** Das Blatt entsteht jetzt auf dem echten Weg ueber `Einlesen.datei`, und der Knoten wird beim Namen genannt: `svg.blatt-marken`.

**Warum keine Uhr.** —

**Der Beweis.** Danach 14 gruen, und die Gegenprobe G1 (wieder schaetzen) nennt zwei Uebertreter von 21 Zeilen: a2 164,2 in 160, a6 202,2 in 200.

**Die Lehre.** Eine Zusage ueber ALLE Elemente einer Liste ist auf der leeren Liste immer wahr. `filter(...).length === 0` sieht streng aus und prueft nichts, solange niemand fragt, ob ueberhaupt etwas darin war. Jede Allaussage braucht deshalb eine Zusage daneben, die sagt: und es waren genug, und sie waren nicht alle winzig. Genau die hat hier zweimal hintereinander den Fehler gefunden.


---

## P43 · Die Zusage zeigte auf den Code, und schuld war mein Pruefstueck

*2026-09-13 · 🟡 klein · E563*

**Das Bild.** `test518 §2` meldete „Die Abdeckung ist da — ['text','text','text','text','bild']". Der Deckel kam gar nicht an, obwohl das Bild danebenstand und sich richtig drehte.

**Die falsche Vermutung.** Dass meine Drehungszeile fuer die Abdeckung nicht greift — sie steht in einem anderen Zweig als der Text, also lag der Verdacht nahe.

**Wie es gefunden wurde.** Nachgesehen, wie der Leser eine Abdeckung ueberhaupt ERKENNT: ueber `klickschritte`, und dort zaehlt nur ein `p:cTn` mit `nodeType="clickEffect"`. Mein `p:timing` hatte die Verschachtelung nach Gefuehl und dieses Attribut gar nicht.

**Die Ursache.** Das Pruefstueck war falsch, nicht der Code. Ohne `clickEffect` gibt es keinen Klickschritt, ohne Klickschritt keine Abdeckung — die Form fiel korrekt als „gefuellte Form ohne Text" durch.

**Die Lösung.** Das `p:timing` nach der gelesenen Regel gebaut statt nach Gefuehl, mit einem Kommentar daneben, woher die Form kommt.

**Warum keine Uhr.** —

**Der Beweis.** 17 gruen. Und die Gegenproben G1/G2 werden mit 9 roten Zusagen rot — die Abdeckung ist jetzt eine davon.

**Die Lehre.** §45/E21 („nachsehen, nicht erinnern") gilt auch fuer die PRUEFDATEI. Ein Pruefstueck, das ich aus dem Kopf baue, ist genauso eine Behauptung wie eine erinnerte Schnittstelle — nur faellt es staerker auf die Fuesse, weil die rote Zusage dann auf den Code zeigt, der recht hat. Beim dritten solchen Fall in dieser Sitzung (P32, P41, P43) ist das Muster deutlich: bevor ich einem roten Lauf glaube, pruefe ich, ob MEINE Seite der Messung stimmt.


---

## P44 · Zehn Tabellenzellen wurden zu zehn leeren Anhaengen

*2026-09-14 · 🟠 mittel · E565*

**Das Bild.** Auf dem Bild stand der Tabellentext, aber kein Gitter und keine Fuellung. Der Hinweis sagte: „1 Folien uebernommen, 10 BILDER aus 1 Dateien".

**Die falsche Vermutung.** Dass die Rechtecke gezeichnet, aber unsichtbar seien — Strichstaerke null oder Fuellung `none`. Ich habe zuerst `strokeWidth` nachgelesen; die Vorgabe ist 2,4, also waeren sie sichtbar gewesen.

**Wie es gefunden wurde.** Statt weiter im Zeichner zu suchen, nachgemessen, WAS das Blatt ueberhaupt traegt. Die Antwort war eindeutig: `arten` enthielt „bild" zehnmal und „rectangle" null mal.

**Die Ursache.** Mein neuer Zweig `if (o.art === 'rectangle')` war beim Einsetzen IM Abdeckzweig gelandet, nicht daneben. Damit lief er nie — und die Schleife hat keinen Auffangfall: was weder Text noch Abdeckung ist, gilt als Bild. Jede Zelle ging durch `Dateien.ablegen` und legte einen leeren Anhang an.

**Die Lösung.** Den Zweig VOR den Bildzweig gesetzt, mit einem Kommentar, der sagt, dass die Schleife keinen Auffangfall hat — sonst passiert es dem Naechsten mit der naechsten Markenart wieder.

**Warum keine Uhr.** —

**Der Beweis.** test519 §4 misst es: der Hinweis darf keine Bilder nennen, und es darf keine Bildmarke geben. Die Gegenprobe G5 setzt den Zweig hinter den Bildzweig und liefert wieder „10 Bilder aus 1 Dateien".

**Die Lehre.** Zwei Dinge. Erstens: eine Schleife OHNE Auffangfall ist ein stiller Trichter — alles Unbekannte laeuft in den letzten Zweig, und der war hier ausgerechnet der, der Dateien anlegt. Zweitens, und das zaehlt mehr: ich habe das Bild gemacht, BEVOR ich die Zusagen geschrieben habe (P40), und nur deshalb ist es aufgefallen. Haette ich zuerst die Zusagen gebaut, haette ich sie nach dem gebaut, was ich zu pruefen gedacht habe — und „legt diese Aenderung heimlich Anhaenge an" waere nicht darunter gewesen.


---

## P45 · Zehn Boegen Pruefstuecke, und vier Bilder haben mehr gefunden

*2026-09-14 · gross · E566*

**Das Bild.** Redur hat zwei Folien seiner echten Datei neben Redions Fassung gestellt. Auf Folie 1 fehlte der dunkelblaue Kasten hinter dem Titel, auf Folie 2 der rote Balken — und ALLE VIER Textfarben kamen als Schwarz an.

**Die falsche Vermutung.** Dass die grossen Posten nach E565 durch seien. Ich hatte gerade geschrieben: „die Liste der grossen Posten ist leer" und „was uebrig ist, ist alles klein".

**Wie es gefunden wurde.** Gar nicht von mir. Ich hatte nach E565 um eine echte Datei gebeten, weil bei jedem Bogen das Messen an Wirklichem mehr gefunden hatte als meine Pruefstuecke. Vier Bilder spaeter standen zwei Posten da, die keiner meiner zehn Boegen beruehrt hatte.

**Die Ursache.** Zwei: (1) `a:prstGeom` wurde nirgends gelesen — gefuellte Formen ohne Text fielen durch. (2) Die Textfarbe stand im `a:defRPr` des Platzhalters im Layout, und `vorgabenLesen` holte von genau diesem Element seit E558 nur `sz`.

**Die Lösung.** Formen ueber `a:prstGeom` auf die fuenf Marken abbilden, die Redion hat, mit Fuellung (seit E565 moeglich), Umriss aus `a:ln` und Drehung. Und `a:defRPr` auch nach der Farbe fragen. Was Redion nicht kennt, wird gezaehlt statt geraten.

**Warum keine Uhr.** —

**Der Beweis.** test520, 25 Zusagen, fuenf Gegenproben. G1 (Formen ueberspringen) ist 16 rot, G2 (Farbe nicht erben) 5 rot — und die zweite meldet genau das Symptom: alle vier Texte fallen auf Schwarz.

**Die Lehre.** Meine Pruefstuecke pruefen, was mir EINGEFALLEN ist. Sie waren richtig, sie haben gehalten, sie sind rot geworden, wenn sie sollten — und sie konnten trotzdem zehn Boegen lang nicht sehen, was in einer wirklichen Datei steht. Der nuetzlichste Satz dieser ganzen Reihe war die Bitte um eine echte Datei. Wenn ich das naechste Mal denke „die grossen Posten sind durch", ist genau das der Moment, an dem ich danach fragen muss — nicht der Moment, an dem ich weiterbaue.


---

## P46 · Zum vierten Mal war mein Pruefstueck schuld, nicht der Code

*2026-09-14 · 🟡 klein · E567*

**Das Bild.** Die Probe zeigte `schrift: null` fuer alle vier Texte. Die Farben derselben Vorgabe kamen an — also wurde das `a:defRPr` gelesen, nur die Schrift nicht.

**Die falsche Vermutung.** Der neue Code. Ich habe die Reihenfolge von `themaDoc`, `paar` und `vorgabenLesen` nachgesehen; sie stimmte.

**Wie es gefunden wurde.** `grep -c mj-lt` auf die Pruefdatei: null Treffer. Mein Ersetzen hatte die Zeile nicht getroffen, weil ich sie aus dem Kopf zitiert hatte statt sie vorher anzusehen.

**Die Ursache.** Das Pruefstueck, nicht der Code. Ohne `+mj-lt` im `a:defRPr` gibt es nichts aufzuloesen — der Leser gab korrekt '' zurueck.

**Die Lösung.** Die Zeile erst gelesen, dann ersetzt. Danach stimmte alles auf Anhieb.

**Warum keine Uhr.** —

**Der Beweis.** 16 gruen, und G1 (a:latin nicht lesen) ist 12 rot — die Zusagen koennen also wirklich rot werden.

**Die Lehre.** P32, P41, P43 und jetzt P46. VIER MAL in zwei Tagen habe ich einem roten Lauf geglaubt, obwohl meine Seite der Messung falsch war — einmal die Arithmetik, einmal der gemessene Knoten, zweimal die Pruefdatei. Das ist keine Panne mehr, sondern ein fehlender Arbeitsschritt: bevor ich bei einem roten Lauf im Code suche, pruefe ich zuerst, ob das Pruefstueck ueberhaupt das enthaelt, was es pruefen soll. Ein `grep` auf die eigene Pruefdatei kostet zehn Sekunden.


---

## P47 · Drei Zeilen im Stilblatt standen da und galten nie

*2026-09-14 · 🟠 mittel · E568*

**Das Bild.** Redur: die Stiftleiste hat „keine Qualitaet, kein gutes Gefuehl". Im Stilblatt stand seit jeher `.blatt-farbe{width:22px; border-radius:50%}` — auf dem Bildschirm standen fuenf 36 x 32 px grosse abgerundete Kacheln statt einer Farbpalette.

**Die falsche Vermutung.** Dass die Tupfer irgendwo ueberschrieben werden und ich die Stelle suchen muss. Gesucht habe ich in `pdf-studio.css`, in `marken.css`, im Studio-Block — alles falsch.

**Wie es gefunden wurde.** Die Wichtung ausgerechnet statt sie zu fuehlen: `.blatt-farbe` wiegt (0,1,0), `.blatt-werk button` wiegt (0,1,1). Die Knopfregel gewinnt, und mit ihr `border-radius:6px` und `min-width:36px`. Es gab gar keine zweite Stelle — die erste hat nie gegolten.

**Die Ursache.** Eine CSS-Eigenschaft, die im Blatt steht und von einer staerkeren Regel im selben Blatt geschlagen wird. Das sieht man beim Lesen NICHT: beide Zeilen sind richtig geschrieben, beide stehen da, und die Datei sagt nirgends, welche gewinnt.

**Die Lösung.** Die Regel auf (0,2,1) gehoben (`.blatt-werk button.blatt-farbe`). Und das Gleiche noch zweimal in derselben Leiste: `background-clip:content-box` wurde von der Kurzschrift `style="background:…"` am Element zurueckgesetzt (`!important` noetig), und `min-width` machte aus dem runden „+" ein Ei.

**Warum keine Uhr.** —

**Der Beweis.** 27 gruen in test522, Gegenprobe G2 (Kachel statt Tupfer) 5 rot. Und ein Bild: die Palette ist jetzt eine Reihe runder Punkte.

**Die Lehre.** Ein Stilblatt ist kein Text, den man lesen kann — es ist ein Wettbewerb, den man MESSEN muss. Drei Eigenschaften standen hier monatelang da und galten nie; keine Pruefung hat es gemeldet, weil keine Pruefung `getComputedStyle` gefragt hat. Wer eine Gestaltungsfrage untersucht, misst zuerst die BERECHNETEN Werte am echten Knoten (`getComputedStyle`, `getBoundingClientRect`) und liest erst danach die Datei. Und: die zweite der drei war im Studio seit E554 ebenso tot — eine tote Regel wird kopiert wie jede andere.


---

## P48 · Sieben Pixel Layout machten aus einem Glaetter einen kaputten Glaetter

*2026-09-14 · 🟠 mittel · E568*

**Das Bild.** `test366` meldete: „Der Glaetter halbiert die Punkte eines zittrigen Zugs mindestens — ohne 60, mit 60". Also: der Glaetter glaettet nicht mehr. Geaendert hatte ich an der Zeichenlogik keine Zeile — nur an der Blattleiste.

**Die falsche Vermutung.** Dass die Leiste den Glaetter-Schalter verschoben hat oder dass mein Umbau irgendwie die Stiftkette beruehrt. Ich habe angefangen, `InkStroke.glaetter` zu lesen.

**Wie es gefunden wurde.** Erst den Verdacht eingegrenzt (HEAD-Stilblatt zurueckgelegt: gruen, mit meinem: rot — es ist das CSS), dann die Zahlen geholt statt zu raten: die Zeichenflaeche begann bei y = 457, das Fenster ist 900 hoch, und der zweite Pruefzug lag fest bei `y + 440` = 897. Mit der 7 px hoeheren Leiste: 904. Ausserhalb des Bildes.

**Die Ursache.** Ein Mausklick ausserhalb des Sichtfensters kommt nicht an. Der zweite Zug entstand gar nicht, `marken[letzte]` gab noch den ersten zurueck, beide Zahlen waren gleich — und der Lauf beschrieb das als „glaettet nicht". Der Glaetter hat die ganze Zeit geglaettet.

**Die Lösung.** Die zwei Zugstellen werden jetzt aus dem WIRKLICH sichtbaren Platz gerechnet (`min(Kastenhoehe, Fensterhoehe - Kastenoberkante) - 40`), nicht als feste Zahl gesetzt. Damit haelt die Probe auch die naechste Leiste aus.

**Warum keine Uhr.** —

**Der Beweis.** 45 von 45 gruen, und die Debug-Zeile sagt wieder „ohne Glaetter 60 · mit 11" — der Unterschied, um den es geht, ist wieder da.

**Die Lehre.** Eine Pruefung, die auf feste Bildschirmkoordinaten zeigt, misst drei Pixel vom Rand entfernt, ohne es zu sagen. Sie war nicht falsch und nicht flatterhaft — sie war SPROEDE, und der Bericht zeigte auf eine ganz andere Stelle als die Ursache. Wer eine Zahl in eine Pruefung schreibt, die aus dem Layout kommt, rechnet sie aus dem Layout aus. Und der Weg zur Ursache war beide Male derselbe wie bei P47: nicht lesen, sondern messen — erst die Haelfte wegnehmen (welche Datei?), dann die Zahl holen.


---

## P49 · Mein Zeilenraster zerschnitt eine Zeile in zwei

*2026-09-14 · 🟡 klein · E570*

**Das Bild.** Die Messung meldete „die drei Breiten stehen auf zwei Zeilen" — auf dem Bild standen sie nebeneinander.

**Die falsche Vermutung.** Dass die Leiste wirklich umbricht, und ich habe angefangen, Pixel zu suchen.

**Wie es gefunden wurde.** Die Rohzahlen angesehen statt der Auswertung: die Farbtupfer sind 30 px hoch, die Knoepfe 32. Ihre OBERKANTE liegt damit 1 px tiefer. Mein Raster war `Math.round(y / 12) * 12` — und genau an der Rasterkante fielen 54 und 55 in zwei verschiedene Faecher.

**Die Ursache.** Das Raster, nicht das Layout. Eine Zeile mit zwei Elementhoehen hat keine gemeinsame Oberkante; sie hat eine gemeinsame MITTE.

**Die Lösung.** Zeilen werden nach der senkrechten Mitte gebildet, mit 9 px Toleranz — in der Messprobe und in `test522`. Danach war der gemeldete Umbruch weg, und der ECHTE Umbruch (eine Breite allein eine Zeile tiefer) blieb sichtbar und liess sich reparieren.

**Warum keine Uhr.** —

**Der Beweis.** 31 gruen in test522, darunter die neue, staerkere Zusage: keine sichtbare Gruppe reisst ueber zwei Zeilen.

**Die Lehre.** Zum vierten Mal in dieser Woche (P32, P41, P43, P46, P47) und zum ersten Mal nicht in einer Pruefdatei, sondern in der AUSWERTUNG: bevor ich einer Messung glaube, sehe ich mir an, wie sie zaehlt. Ein Raster, das eine Annahme enthaelt — hier: alle Elemente sind gleich hoch —, meldet den Bruch dieser Annahme als Befund ueber etwas ganz anderes. Und: dieselbe Messung hat danach einen ECHTEN Fehler gefunden. Ein kaputtes Messwerkzeug wegzuwerfen waere falsch gewesen; es zu reparieren war richtig.


---

## P50 · Die Leiste ging nach oben, als ich sie nach unten stellte

*2026-09-19 · 🟠 mittel · E622*

**Das Bild.** `position:sticky` mit `bottom` gesetzt — die Leiste stand danach auf y=335 statt am Blattfuss.

**Die falsche Vermutung.** Dass die Regel nicht greift, und ich habe an der Spezifität gesucht.

**Wie es gefunden wurde.** Nachgemessen statt nachgelesen: y blieb exakt gleich. Sticky mit `bottom` ZIEHT ein Element nach oben, wenn es sonst aus dem Bild liefe — es schiebt nie nach unten.

**Die Ursache.** Die Leiste stand in der Reihenfolge VOR dem Blatt. Sticky kann nur innerhalb des eigenen Elternteils wirken.

**Die Lösung.** `leisteEinordnen()` hängt die Reihe für den Platz „unten" hinter das Papier, sonst als erstes Kind.

**Warum keine Uhr.** Keine Uhr im Spiel.

**Der Beweis.** test534 §1b vergleicht den Abstand jetzt gegen `orte['oben'].y` statt gegen eine lose Schranke von 400 px — die alte Zusage blieb bei 46 px Abstand grün.

**Die Lehre.** Eine Zusage mit einer runden Zahl als Schranke ist oft gar keine Zusage.


---

## P51 · «unten in der Mitte» war zwei Pixel breit

*2026-09-19 · 🟠 mittel · E620*

**Das Bild.** Die Leiste fiel auf 2 px zusammen, sobald sie den Platz „unten" bekam.

**Die falsche Vermutung.** Dass die Breite fehlt, und ich habe Breitenangaben gesucht.

**Wie es gefunden wurde.** Im Bild gesehen, dann gemessen: `container-type:inline-size` stand auf `.blatt-reihe` UND `.blatt-werk`.

**Die Ursache.** `container-type:inline-size` ist `contain:inline-size` — ein solches Element trägt zur Breite seines Elternteils NICHTS bei. Bei einem Elternteil, der sich nach seinem Inhalt richtet, bleibt dann nichts übrig.

**Die Lösung.** Für die frei stehenden Plätze wird `container-type:normal` gesetzt.

**Warum keine Uhr.** Keine Uhr im Spiel.

**Der Beweis.** test534 misst die Breite je Platz.

**Die Lehre.** Eine Eigenschaft, die man für Abfragen setzt, kann das Layout ändern.


---

## P52 · Die Strichprobe war unsichtbar

*2026-09-19 · 🟡 klein · E623*

**Das Bild.** Die Probe sollte den echten Strich zeigen — auf dem Bild war nichts zu sehen.

**Die falsche Vermutung.** Dass sie gar nicht gezeichnet wird.

**Wie es gefunden wurde.** Kontrast gerechnet: rgb(17,17,17) auf rgb(32,32,32) = 1,2:1.

**Die Ursache.** Der Strich wurde in der Tintenfarbe auf die dunkle Leiste gemalt — ohne Papier darunter.

**Die Lösung.** Eine Papierfläche hinter die Probe (`box-shadow` in `--paper`). Danach 17,7:1.

**Warum keine Uhr.** Keine Uhr im Spiel.

**Der Beweis.** test535 misst den Kontrast, nicht das Vorhandensein.

**Die Lehre.** `getComputedStyle` sagt „opacity: 1" auch dann, wenn man nichts sieht.


---

## P53 · Der Radiererzweig war toter Code

*2026-09-19 · 🟠 mittel · E624*

**Das Bild.** Die drei Radiergrössen taten nichts.

**Die falsche Vermutung.** Dass die Knöpfe nicht ankommen.

**Wie es gefunden wurde.** Der Zweig lag INNERHALB von `if (target.dataset.act)`, und die Größenknöpfe tragen kein `data-act`.

**Die Ursache.** Eine Verzweigung an der falschen Stelle im Behandler.

**Die Lösung.** Der Zweig steht jetzt vor dem `data-act`-Block; die Markierung wird über `document.querySelectorAll` gesetzt, nicht nur am eigenen Blatt.

**Warum keine Uhr.** Keine Uhr im Spiel.

**Der Beweis.** test535 misst den Radius des `.blatt-radierkreis` (28 → 7,2), nicht die Klasse am Knopf.

**Die Lehre.** „Die Markierung wandert mit (5 → 5)" — eine Zusage, die dieselbe Zahl zweimal liest, prüft nichts.


---

## P54 · L150 behauptete das Gegenteil dessen, was gemessen war

*2026-09-19 · gross · E626*

**Das Bild.** In LUECKEN.md stand seit Monaten „heute hält die Regel … es gibt keinen Querverweis".

**Die falsche Vermutung.** Dass ich nur einen Wächter für einen sauberen Bestand schreiben muss.

**Wie es gefunden wurde.** Gemessen statt geglaubt: 523 Querverweise in 63 von 306 Bereichspaaren, über 61 fremde Namen.

**Die Ursache.** Die alte Messung suchte nach `import`-Zeilen. In `src/bereiche/` gibt es keine einzige — geladen wird über 208 `<script>`, geredet wird über globale Namen.

**Die Lösung.** Ein Verzeichnis (`bereiche-bestand.json`), das nur schrumpfen darf, und `test537`.

**Warum keine Uhr.** Keine Uhr im Spiel.

**Der Beweis.** Der Lauf zählt beide Wege, den Namen und `(window as any)`.

**Die Lehre.** Eine Lücke, die eine Behauptung über den Bestand enthält, gehört nachgemessen, bevor man sie schliesst.


---

## P55 · Die vier Griffe erschienen gar nicht

*2026-09-19 · 🟠 mittel · E628*

**Das Bild.** Ein Knoten wurde gewählt — keine Griffe.

**Die falsche Vermutung.** Dass die CSS-Regeln fehlen.

**Wie es gefunden wurde.** test538 §1 gemessen: 0 statt 4.

**Die Ursache.** `wähle` zeichnet die Karte nicht neu, es setzt nur die Marke `on` um. Die Griffe entstanden im Zeichner — also erst bei der nächsten Aenderung.

**Die Lösung.** `griffeBauen()`, von beiden Wegen benutzt.

**Warum keine Uhr.** Keine Uhr im Spiel.

**Der Beweis.** test538 zählt die Griffe VOR dem ersten Klick — nach einem Klick bleibt die Zahl auch dann richtig, wenn der Zeichner sie an jeden Knoten hängt.

**Die Lehre.** Wer eine Zusage nach dem Ereignis misst, misst manchmal das Aufräumen statt die Sache.


---

## P56 · Die Verbindung lief quer durch die Wurzel

*2026-09-19 · 🟠 mittel · E628*

**Das Bild.** Ein Klick auf die freie Verbindung wählte den Wurzelknoten.

**Die falsche Vermutung.** Dass der Klick am falschen Element hängt.

**Wie es gefunden wurde.** Den Kasten der Linie gemessen: 181 × 0 px. Sie lag vollständig hinter dem Wurzelknoten.

**Die Ursache.** Zwei Aeste links und rechts auf gleicher Höhe ergeben eine waagerechte Gerade — mitten durch alles, was dazwischen steht.

**Die Lösung.** Der Bogen weicht senkrecht zur Verbindung aus, weg von der Mitte der Karte.

**Warum keine Uhr.** Keine Uhr im Spiel.

**Der Beweis.** Danach 181 × 45 px, und `elementFromPoint` auf der Bogenmitte trifft `.gk-verb-fang`.

**Die Lehre.** Eine Linie mit Höhe null ist nicht unsichtbar — sie ist unerreichbar.


---

## P57 · Die Entf-Taste lief ins Leere

*2026-09-19 · 🟡 klein · E628*

**Das Bild.** Verbindung angeklickt, markiert, Entf gedrückt — nichts geschah.

**Die falsche Vermutung.** Dass die Taste nicht ankommt.

**Wie es gefunden wurde.** `document.activeElement` gelesen: der Körper der Seite, nicht die Bühne.

**Die Ursache.** Ohne `preventDefault` nimmt der Browser nach dem Klick auf einen SVG-Pfad den Fokus wieder weg. Ein Knoten ist ein `div` und gibt ihn an die Bühne weiter; ein SVG-Pfad tut das nicht.

**Die Lösung.** `e.preventDefault()` im Verbindungszweig.

**Warum keine Uhr.** Keine Uhr im Spiel.

**Der Beweis.** test538 §4 löscht und holt zurück.

**Die Lehre.** Fokus ist kein Zustand, den man setzt — er ist einer, den man behält.


---

## P58 · Der geschriebene Grund stand da, wo ihn niemand sucht

*2026-09-19 · 🟡 klein · E627*

**Das Bild.** `test402` meldete die Kartenleiste als Trefffläche ohne Begründung — obwohl sie ihre 44 px längst hatte.

**Die falsche Vermutung.** Dass die Fläche zu klein ist.

**Wie es gefunden wurde.** Den Lauf gelesen: er sucht acht Zeilen UEBER einer Regel und drei darunter. Der Kommentar stand DAHINTER.

**Die Ursache.** Nicht die Fläche war falsch, sondern der Ort ihres Belegs.

**Die Lösung.** Der Kommentar zieht vor die Regel; der zweite Treffer (`#ai .ki-quellschalter`, 32 px) war ein echter und bekam seinen Grund.

**Warum keine Uhr.** Keine Uhr im Spiel.

**Der Beweis.** test402 4/4.

**Die Lehre.** §37 verlangt den Grund „an Ort und Stelle" — das ist wörtlich gemeint.


---

## P59 · Meine eigene Rot-Erkennung konnte nicht rot werden

*2026-09-19 · gross · —*

**Das Bild.** Der Stück-Treiber meldete „rot bisher: 0", während Stücke mit Ausgang 1 durchliefen.

**Die falsche Vermutung.** Dass die Stücke grün sind.

**Wie es gefunden wurde.** Der Ausgang stand in derselben Zeile daneben. Erst beim zweiten Hinsehen gelesen.

**Die Ursache.** Ich suchte nach `✗ testNNN`. Der Orchestrator schreibt aber „✗ 1 von 10 Läufen gescheitert:" ohne Namen und darunter den Namen EINGERUECKT ohne Kreuz.

**Die Lösung.** Der Treiber zählt den Ausgang und hebt die Ausgabe jedes Stücks auf.

**Warum keine Uhr.** Keine Uhr im Spiel.

**Der Beweis.** Nach der Umstellung meldete dieselbe Datei 17 rote Stücke, die vorher unsichtbar waren.

**Die Lehre.** §55.2 gilt auch für Werkzeuge, die keine Prüfläufe sind. Wer eine Erkennung schreibt, prüft zuerst, ob sie überhaupt anschlagen KANN.


---

## P60 · Die Gesamtsuite war seit PR #100 nicht gelaufen

*2026-09-19 · gross · —*

**Das Bild.** 17 von 48 Stücken rot, quer durch das ganze Projekt.

**Die falsche Vermutung.** Dass die Einzelbögen dieser Woche etwas gebrochen haben.

**Wie es gefunden wurde.** Die roten Stücke liegen in Bereichen, die diese Woche niemand angefasst hat. In ERLEDIGTE-AUFGABEN.md steht zehnmal hintereinander „Nicht geprüft: die Gesamtsuite".

**Die Ursache.** Jeder Bogen war für sich sauber geprüft — nur eben nie gegen das Ganze. Erster bestätigter Einzelfund: `test164`, die Blocktypen-Inventur, rot seit E607, weil die Gedankenkarte nie in `doku/BLOCKTYPEN.md` eingetragen wurde.

**Die Lösung.** Nachlauf der 17 Stücke einzeln, mit aufgehobener Ausgabe, um die Namen zu bekommen.

**Warum keine Uhr.** Keine Uhr im Spiel.

**Der Beweis.** Stück 71–80 war im Nachlauf grün — entweder ein flockiger Lauf oder eine Wechselwirkung in der Reihenfolge. Das wird gemessen, nicht geraten.

**Die Lehre.** „Die zuständigen Prüfläufe" (§30) sind das Minimum, nicht das Ziel. `main` bewegt sich deshalb erst nach einem vollen grünen Lauf (§46).


---

## P61 · Mein Wächter erfand eine Kopplung, die es nicht gab

*2026-09-19 · 🟠 mittel · E629*

**Das Bild.** `test537` meldete „bereiche/bloecke → FORMEN (bereiche/pdf)" — die Gedankenkarte greife in den PDF-Bereich.

**Die falsche Vermutung.** Dass ich beim Bau der Gedankenkarte wirklich einen fremden Namen benutzt habe, und ich habe nach der Stelle gesucht.

**Wie es gefunden wurde.** Beide Stellen nebeneinandergelegt: `const FORMEN = [` im PDF, `const FORMEN: ReadonlyArray<…> = [` in der Karte. Der Katalog las `const NAME =` und liess die Typangabe nicht zu.

**Die Ursache.** Der Ausdruck im Namenskatalog kannte eine gültige Schreibweise nicht. Damit galt die EIGENE Liste nicht als Anmeldung — und ihre Benutzung sah aus wie ein Griff nach aussen.

**Die Lösung.** Zwischen Name und `=` darf eine Typangabe stehen. Dadurch bekommen 59 Namen erstmals einen Besitzer und zehn verlieren ihn (L193).

**Warum keine Uhr.** Keine Uhr im Spiel.

**Der Beweis.** Gegenprobe mit einem echten Querverweis (`Chronik.oeffne(0)` in bereiche/bloecke): 126 Paare gegen 125, mit Namen. Danach entfernt, 17/17 grün.

**Die Lehre.** Eine erfundene Kopplung ist schlimmer als eine übersehene: die übersehene kostet Wachsamkeit, die erfundene kostet Arbeit an etwas, das es nicht gibt.


---

## P62 · Meine Sicherungskopie nahm die falsche Datei

*2026-09-19 · gross · E629*

**Das Bild.** Nach dem Zurückschreiben stand der Inhalt von `chronik.ts` in `blatt.ts`. Der Typecheck meldete „Cannot find name 'Blatt'".

**Die falsche Vermutung.** Keine — der Fehler war sofort sichtbar. Gefährlich war er trotzdem.

**Wie es gefunden wurde.** `npm run typecheck` direkt nach dem Zurückschreiben. Ohne diesen Schritt wäre eine 320-Zeilen-Datei still überschrieben gewesen.

**Die Ursache.** `cp A || cp B` als Sicherung. Der erste Befehl gelang und legte die falsche Datei ab; der Oder-Zweig war nie dafür gedacht, die Quelle zu WÄHLEN.

**Die Lösung.** Aus dem letzten Commit zurückgeholt (`git checkout HEAD -- <datei>`), 320 Zeilen, Kopfzeile geprüft.

**Warum keine Uhr.** Keine Uhr im Spiel.

**Der Beweis.** Zeilenzahl und Kopfzeile wieder wie in HEAD, Typecheck grün, `git status` zeigt nur die zwei beabsichtigten Dateien.

**Die Lehre.** Ein Oder-Zweig, der eine Sicherung wählt, ist keine Sicherung: er sichert, was zuerst gelingt, nicht was gemeint war. Für eine Gegenprobe ist git die Sicherung — nicht eine Kopie daneben.


---

## P63 · Meine Reparatur machte den Wächter blind, und er wurde dadurch grün

*2026-09-19 · gross · E631*

**Das Bild.** `test444` klagte einen Kommentar an. Nach der Reparatur war er grün — und blieb grün, als ein echter Verstoss danebenstand.

**Die falsche Vermutung.** Dass grün nach der Reparatur bedeutet, die Reparatur sei richtig.

**Wie es gefunden wurde.** Die Gegenprobe nach §55.2: `Konten.darf('bearbeiten', page)` in echten Code eingesetzt. 13/13 grün — also fand der Lauf gar nichts mehr.

**Die Ursache.** Ich hatte `nurCode` genommen, und das leert auch Zeichenketten. Der Lauf verlangt als erstes Argument ein Wort in Anführungszeichen; aus `'bearbeiten'` wurde `''`, und das Muster traf nie wieder.

**Die Lösung.** `ohneKommentare`: nur die Prosa heraus, die Zeichenketten bleiben. Zeilentreu, weil der Lauf die Zeilennummer meldet.

**Warum keine Uhr.** Keine Uhr im Spiel.

**Der Beweis.** Mit der neuen Fassung: der eingesetzte Verstoss wird gemeldet, mit Datei und Zeile 330 — genau der Zeile, in der er stand. Nach dem Zurücknehmen wieder 13/13.

**Die Lehre.** Eine Reparatur an einem Wächter ist erst fertig, wenn er mit einem echten Verstoss rot wird. Grün nach der Reparatur beweist gar nichts — es kann heissen, dass er nichts mehr sieht.


---

## P64 · Der Wächter klagte den Satz an, der von ihm handelt

*2026-09-19 · 🟡 klein · E631*

**Das Bild.** Eine Stunde nach der Reparatur war `test444` wieder rot, mit einer Fundstelle in `src/bereiche/chronik/daten.ts`.

**Die falsche Vermutung.** Dass die Reparatur nicht gegriffen hat.

**Wie es gefunden wurde.** Die gemeldete Zeile angesehen: es ist die Chronik, erzeugt als Daten — und sie BESCHREIBT seit einer Stunde genau diesen Fehlalarm, samt der Zeile, die ihn auslöste.

**Die Ursache.** Der Wächter sieht den Unterschied zwischen einer Sache und dem Reden über die Sache nicht. Und die Kommentare zu entfernen half nicht: das Zitat steht in einer Zeichenkette, und die müssen für diesen Lauf stehen bleiben.

**Die Lösung.** Nicht den Text verändern, sondern die Fundstelle prüfen: `inZeichenkette` zählt die unmaskierten Anführungszeichen links davon. Ein Aufruf im Code steht nicht in einem String.

**Warum keine Uhr.** Keine Uhr im Spiel.

**Der Beweis.** Gegenprobe nach der zweiten Reparatur: der eingesetzte Verstoss wird weiter gemeldet, Datei und Zeile stimmen. Zurückgenommen wieder 13/13.

**Die Lehre.** Wer einen Fehlalarm dokumentiert, schreibt die auslösende Zeile in den Bestand — und erzeugt damit den nächsten. Bei textlesenden Wächtern ist das Aufschreiben selbst eine Änderung am geprüften Stoff.


---

## P65 · Zum zweiten Mal an einem Tag: das Aufschreiben erzeugte den nächsten Fehlalarm

*2026-09-19 · 🟡 klein · E632*

**Das Bild.** Kaum stand `test225` grün, war er wieder rot — Fundstelle: der Eintrag E632, den ich gerade darüber geschrieben hatte.

**Die falsche Vermutung.** Keine. Nach P64 habe ich es erwartet — und es trotzdem gemacht.

**Wie es gefunden wurde.** Der Lauf lief direkt nach dem Schreiben. Die gemeldete Fundstelle war meine eigene Zeile über die Gegenprobe.

**Die Ursache.** Die Gegenprobe stand mit Namen und Nummer im Text. Ein Wächter, der Verweise sucht, findet den Satz über den Verweis genauso wie den Verweis.

**Die Lösung.** Die Gegenprobe in Worten beschrieben statt in der Schreibweise, die der Lauf sucht.

**Warum keine Uhr.** Keine Uhr im Spiel.

**Der Beweis.** Danach 11/11, und die eingebaute Gegenrichtung des Laufs blieb grün — der Ausdruck ist also nicht weich geworden.

**Die Lehre.** Bei textlesenden Wächtern ist das Aufschreiben eine Änderung am geprüften Stoff. Zweimal an einem Tag dieselbe Falle: einmal in der Chronik (P64), einmal in ENTSCHEIDUNGEN.md.


---

## P66 · Die Linse zeigte gar keine Brechung — die Knöpfe lagen davor

*2026-09-20 · 🟠 mittel*

**Das Bild.** Der erste Prototyp hatte den Filter, die Karte und den Farbsaum — und im Bild war nichts zu sehen.

**Die falsche Vermutung.** Der Filter ist falsch gebaut. Ich habe fünf Fassungen der Verschiebungskarte nebeneinandergestellt, bevor ich weitergesucht habe.

**Wie es gefunden wurde.** Beim Ansehen des Vergleichsbilds: das Glas war da, aber der Inhalt darunter unverändert.

**Die Ursache.** `backdrop-filter` bricht, was HINTER dem Element liegt. Die Knöpfe lagen davor (z-index 2 gegen 1) — es gab schlicht nichts zu brechen.

**Die Lösung.** Die Linse über die Knöpfe, `pointer-events:none` dazu. Die Trefferfläche bleibt der Knopf, und `test539 §1` hält es.

**Warum keine Uhr.** Keine Uhr im Spiel.

**Die Lehre.** Eine Linse ist keine Fläche. Was eine Fläche verdeckt, muss unter ihr liegen; was eine Linse bricht, muss hinter ihr liegen — und das ist bei gestapelten Elementen genau umgekehrt.


---

## P67 · Ein dunkler Balken quer durch die Linse, in jeder Fassung an derselben Stelle

*2026-09-20 · 🟡 klein*

**Das Bild.** Fünf verschiedene Filterfassungen, fünfmal derselbe dunkelblaue senkrechte Balken mitten im Glas.

**Die falsche Vermutung.** Der Farbsaum ist zu stark. Ich habe den Versatz dreimal verkleinert, ohne dass sich etwas änderte.

**Wie es gefunden wurde.** Dass der Balken in ALLEN Fassungen an derselben Stelle stand, obwohl die Fassungen verschieden stark verschoben — das passt zu keinem Farbsaum.

**Die Ursache.** Der Filterbereich stand auf `x=-30% width=160%`, damit der Saum am Rand nicht abschneidet. `feImage` misst aber in Anteilen des FILTERBEREICHS, nicht des Elements — die Karte lag um dreissig Prozent verschoben über dem Glas.

**Die Lösung.** Filterbereich genau das Element (`0% / 100%`). Der Saum darf am Rand abschneiden.

**Warum keine Uhr.** Keine Uhr im Spiel.

**Die Lehre.** Wenn ein Fehler sich über alle Parameterfassungen NICHT ändert, liegt er nicht an den Parametern. Das ist ein billiges Ausschlussverfahren, und ich habe es zu spät angewandt.


---

## P68 · Ein Übergang ohne Anlass — und der Wächter hatte ihn ein halbes Jahr vorher beschrieben

*2026-09-20 · 🟡 klein*

**Das Bild.** `test114` §17 wurde rot: „Beim Start steht die Pille sofort da, statt hereinzugleiten — sie glitt 1×".

**Die falsche Vermutung.** Die `stumm`-Sperre greift nicht mehr. Ich habe sie zuerst gesucht, statt zu messen.

**Wie es gefunden wurde.** Mit `transitionstart` und dem gerechneten `transform` mitgeschrieben: bei 676 ms stand scaleX auf 1,309, bei 792 ms lief der Übergang.

**Die Ursache.** Beim Start läuft `pilleSchieben` zweimal; der zweite Ruf rückt die Pille um sechs Punkte. Die Sperre verdeckt das — aber nicht das Zurückfedern MEINER Dehnung 190 ms später, wenn die Sperre schon weg war.

**Die Lösung.** Die Dehnung läuft nicht mehr, solange `.stumm` liegt.

**Warum keine Uhr.** Zwei Uhren im Spiel, und genau ihre Entkopplung war der Fehler.

**Die Lehre.** Der Kommentar an der Sperre hatte es wörtlich vorhergesagt: „Der Schutz greift erst, wenn jemand oben Anfangswerte einträgt, die WIRKLICH gemalt werden." Ein Wächter, der ein halbes Jahr auf seinen Fall wartet, hat ihn bekommen — und ich habe den Kommentar gelesen, bevor ich den Fehler gebaut habe.


---

## P69 · Fünfmal gerechnet, fünfmal zu früh: die Bauform war falsch, nicht die Formel

*2026-09-20 · gross*

**Das Bild.** Die wandernde Fläche der Werkzeugleiste stand 55 px neben ihrem Werkzeug, Überdeckung null. `test478` meldete es.

**Die falsche Vermutung.** Drei nacheinander, und alle falsch: (1) ein Auslöser fehlt, (2) der Ursprung ist falsch berechnet, (3) die Hülle ist eine andere. Nach jedem Anlauf stand derselbe Wert da: --bx: 88px.

**Wie es gefunden wurde.** Erst ein Zähler im Element selbst — lief die Rechnung überhaupt? — brachte es: `laeufe: 5`. Sie war gelaufen, fünfmal, und jedes Mal zu früh.

**Die Ursache.** Danach rollte die Leiste zum Werkzeug (E356), brach um und klemmte Wörter weg. Eine gespeicherte Stelle veraltet bei jedem dieser Vorgänge.

**Die Lösung.** Die Bauform gedreht: der Grund bleibt am Knopf, nur der Wechsel bekommt eine kurzlebige Fläche in Bildschirmmassen. Keine Hülle, kein Versatz, keine Rollung.

**Warum keine Uhr.** Keine Uhr im Spiel — im Gegenteil, ein Zähler hätte die drei Fehlanläufe von Anfang an gespart.

**Die Lehre.** Wenn derselbe Wert drei Reparaturen überlebt, ist die Frage nicht mehr „warum ist er falsch", sondern „läuft der Code überhaupt". Und: wer Auslöser nachlegt, weiss nie, ob er alle hat. Der Beleg, dass die zweite Bauform die richtige war, kam umsonst — die drei Läufe, die den ersten widerlegt hatten, blieben UNVERÄNDERT grün.


---

## P70 · Eine Zusage, die nur rot werden kann, ist keine

*2026-09-20 · 🟡 klein*

**Das Bild.** `test539` §6 prüfte „ohne Durchsicht kein Glas" und war rot — die Seite meldete `prefers-reduced-transparency` als nicht gesetzt.

**Die falsche Vermutung.** Ich rufe `emulateMedia` an der falschen Stelle. Ich habe es am Kontext statt an der Seite versucht, dann mit dem Startschalter.

**Wie es gefunden wurde.** Ein Vierzeiler ohne Redion: Seite, Kontext und Startschalter, alle drei meldeten `false`.

**Die Ursache.** Der Chromium, den Playwright hier mitbringt, kennt das Merkmal nicht.

**Die Lösung.** §6 prüft jetzt die QUELLE statt die Seite und sagt in seinem Kommentar, warum. Dass die Regel auch WIRKT, steht als L203 offen.

**Warum keine Uhr.** Keine Uhr im Spiel.

**Die Lehre.** §55.2 sagt „prüfe zuerst, ob sie überhaupt rot werden kann". Die Umkehrung fehlte mir: prüfe auch, ob sie überhaupt GRÜN werden kann. Eine Zusage, die den Zustand nicht herstellen kann, den sie prüft, ist eine Dauerbeschwerde.


---

## P71 · Der Wächter zerriss die Wähler und klagte dann die echten Regeln an

*2026-09-20 · 🟠 mittel*

**Das Bild.** `test332` meldete 76 tote CSS-Erklärungen. Darunter Wähler, die es gar nicht geben kann: `#menueband)`, `select):focus-visible`, `:focus-visible)`.

**Die falsche Vermutung.** Erst dachte ich, das seien Schreibfehler IM Stilblatt — eine überzählige Klammer irgendwo in `bausteine.css`. Ich habe nach `)` am Wähleranfang gesucht und nichts gefunden.

**Wie es gefunden wurde.** Die Suche nach der schliessenden Klammer im Quelltext ging ins Leere. Erst da habe ich die Zeile im Lauf selbst gelesen: `r.selectorText.split(',')`.

**Die Ursache.** Nicht jedes Komma trennt. In `:is(a,b)`, `:where()`, `:not()` und `:has()` steht es INNERHALB der Klammer. `split(',')` zerriss sie, und die Bruchstücke verloren Vorfahren und `!important` — der Lauf verglich sie mit echten Regeln und meldete die echten als tot.

**Die Lösung.** Getrennt wird nur noch an einem Komma auf Klammertiefe null. Dreizehn der 76 Meldungen waren danach weg, ohne dass eine Zeile Stil angefasst wurde.

**Warum keine Uhr.** Keine Uhr im Spiel.

**Die Lehre.** Zum dritten Mal an zwei Tagen dieselbe Sorte: ein Ausdruck, der eine gültige Schreibweise nicht kennt (E629, E631, jetzt hier). Und die Lehre darüber: eine Meldung eines Wächters ist ein BEFUND, keine Wahrheit. 17 % dieses Befunds waren das Messgerät. Wer ungeprüft repariert, baut die Seite nach dem Fehler des Prüfstands um.


---

## P72 · Der Wächter gegen Port-Kollisionen meldete grün und übersah sieben

*2026-09-20 · gross*

**Das Bild.** `test424` wurde in einem Stapel von sechzehn rot, an einer Zeile, die ihren eigenen Lastverlauf im Kommentar führt. `test400` — der Wächter GEGEN genau diese Sorte Fehlalarm — war grün.

**Die falsche Vermutung.** Last. Der Kommentar der Zeile sagt selbst, dass sie im Stapel von elf durchlief und im Stapel von vierzehn brach; ich wollte die Zahl wieder anheben. Dann: mein eigener Bogen. Beides falsch.

**Wie es gefunden wurde.** Beim Nachsehen, welchen Port test424 hält, stand dort nicht `const PORT = …`, sondern `server.listen(9624, '127.0.0.1', resolve)`. Und test400 liest `/PORT = (\d+)/`.

**Die Ursache.** Acht Läufe schreiben ihre Portzahl direkt in den Aufruf. Für den Ausdruck waren sie unsichtbar — und damit sieben doppelt vergebene Ports, während der Wächter „kein Port ist zweimal vergeben" meldete.

**Die Lösung.** Beide Schreibweisen lesen; `listen(0)` als richtig zählen statt als fehlend; und PRÜFEN, dass kein Lauf mit eigenem Server ohne erkannte Zahl bleibt. Die sieben jüngeren Läufe sind auf 9643–9649 umgezogen.

**Warum keine Uhr.** Die Kollision ist zeitlos — sie wirkt nur, wenn zwei Läufe gleichzeitig laufen.

**Die Lehre.** Zum vierten Mal an zwei Tagen ein Ausdruck, der eine gültige Schreibweise nicht kennt — aber der erste, der dabei etwas ÜBERSAH statt etwas zu erfinden. Und die Zahl in der Ausgabe („374 von 481") nannte die Lücke seit Monaten; eine Zahl, die eine Lücke NENNT, ersetzt keine Prüfung, die sie schliesst. Nebenbei blieb test424 auch allein und auf dem Stand von HEAD rot: ein achtzehnter roter Lauf, der nicht meiner ist.


---

## P73 · Die zuletzt gelesene Seite ging verloren, sobald das Fenster sich meldete

*2026-09-20 · gross*

**Das Bild.** `test424` war rot: „PDF page position survives reload (ist \"0\")". Nach dem Neuladen stand das Dokument wieder auf Seite 1 statt auf der zuletzt gelesenen.

**Die falsche Vermutung.** Last im Stapel — die Zeile führt ihren eigenen Lastverlauf im Kommentar und war schon zweimal daran repariert worden. Dann: mein eigener Bogen. Beides falsch; der Lauf war auch allein und auf dem Stand von HEAD rot.

**Wie es gefunden wurde.** Ein Haken auf `Store.setMeta`, der jeden Schreibvorgang auf `dokSeite:*` mit Wert und Aufrufweg festhält. Genau ein Schreibvorgang, Wert 0, Weg: seiteMerken ⟵ nachziehen ⟵ beiGroesse.

**Die Ursache.** `nachziehen()` rechnet aus dem Rollstand, welche Seite in der Fenstermitte steht, und MERKT sie. Beim frisch geöffneten Dokument steht der Rollstand noch auf 0, während die gemerkte Seite erst im requestAnimationFrame angerollt wird. Eine Fenstermeldung in diesem Spalt beantwortet die Frage mit „Seite 1".

**Die Lösung.** Eine Reihenfolge statt einer Wartezeit: `standGesetzt` fällt erst in dem rAF, der die gemerkte Seite anrollt. Davor schweigt der Beobachter. Und ein neuer Lauf, test540, der das Rennen STELLT statt es zu gewinnen.

**Warum keine Uhr.** Die Zeiten stammen aus einem `performance.now()`-Haken in der Seite, nicht aus git — sie sind relativ und stehen deshalb nicht als Uhrzeit da.

**Die Lehre.** Derselbe Haken, der den Fehler sichtbar machte, machte ihn beim zweiten Versuch unsichtbar: ein paar Millisekunden mehr Arbeit darin, und derselbe Durchgang lief 50 von 50. Ein Wächter, der ein Rennen zufällig gewinnt, ist keiner — er muss es stellen. Das ist die dritte Fassung von §55.2 an zwei Tagen: „kann er rot werden?", „kann er grün werden?", und jetzt „gewinnt er nur zufällig?".


---

## P74 · Der Textur-Wächter bestrafte die neue Linse

*2026-09-20 · 🟡 klein*

**Das Bild.** Beim Nachfahren der achtzehn ehemals roten Läufe war test435 rot: „… und genau zwei Filter (fein, grob) im ganzen Dokument — 4".

**Die falsche Vermutung.** Die Textur legt ihre Filter jetzt doppelt an — also ein Fehler in textur.ts oder ein zweiter Halter.

**Wie es gefunden wurde.** Die Meldung nennt die Zahl, nicht die Namen. Mit den Namen: ru-linse-ruhe, ru-linse-fahrt, ru-textur-fein, ru-textur-grob. Zwei davon sind meine Linse von derselben Nacht (E639).

**Die Ursache.** Der Lauf zählte `document.querySelectorAll('filter')` — also ALLE SVG-Filter der Seite — und verlangte zwei. Die Zusage im Satz daneben lautete aber: die TEXTUR legt ihre zwei genau einmal an. Zwei verschiedene Aussagen.

**Die Lösung.** Im Halter der Textur zählen statt im Dokument. Und daneben die Frage, um die es E440 wirklich ging: teilen sich zwei Filter eine Kennung? Diese Zahl wächst nicht mit dem Programm mit.

**Warum keine Uhr.** Keine Uhr im Spiel.

**Die Lehre.** Vierte Fassung derselben Sorte an zwei Tagen (E629, E631, E642, E643): ein Ausdruck misst etwas anderes, als der Satz daneben behauptet. Diese hier war nicht falsch, sondern ZU WEIT — und ein zu weiter Wächter bestraft jede neue Funktion, die zufällig dasselbe Element benutzt. Und zum dritten Mal die Schablonen-Falle: ein Akzentzeichen im Kommentar INNERHALB von page.evaluate beendet die Zeichenkette; der Kopf der Datei warnt davor, und ich habe es trotzdem getan.


---

## P75 · Die Bewegung war da und kam nicht an

*2026-09-20 · gross*

**Das Bild.** Redurs Aufnahme der unteren Leiste zeigt vier Reiterwechsel und viermal einen einzigen Bildsprung über 140 bis 209 Pixel. Auf dem Telefon wandert die Auswahlfläche nicht.

**Die falsche Vermutung.** Zuerst: es gibt gar keine wandernde Fläche, sondern fünf eigene. Falsch — es gibt genau eine, seit E236. Dann: die SVG-Glasbrechung (E639) frisst die Bilder. Auch falsch: mit und ohne Filter dasselbe Ergebnis (5 gegen 4 Orte bei achtfacher Drosselung).

**Wie es gefunden wurde.** Dieselbe Fassung am Rechner gemessen: 16 bis 21 Zwischenorte. Also lag es nicht am Code, sondern an der Maschine — und mit `Emulation.setCPUThrottlingRate` liess sich der Unterschied herstellen: nur die beiden Wechsel, die einen ganzen Bildschirm neu aufbauen, brechen ein.

**Die Ursache.** `width` stand in der Übergangsliste. Eine Bewegung, die Layout animiert, läuft auf dem Hauptfaden und kann nicht vorankommen, während dort ein Bildschirm entsteht. Sie springt beim nächsten Bild dorthin, wo ihre Uhr inzwischen steht.

**Die Lösung.** Die Bewegung auf `transform` allein, als Federbahn über `element.animate()` (SelectionFlow). Damit darf sie auf den Compositor. Im ersten Bild: 11 % des Weges statt 31 %.

**Warum keine Uhr.** Die Zeiten stammen aus der Aufnahme (50 Bilder je Sekunde) und sind auf das Bild genau.

**Die Lehre.** Zwei falsche Vermutungen nacheinander, und beide klangen gut. Die erste kam aus dem Bild („sieht aus wie zwei Flächen"), die zweite aus dem eigenen Bogen von gestern („der neue Filter wird es sein"). Was beide widerlegt hat, war dieselbe Frage: WO tritt es auf und wo nicht? Ein Fehler, der am Rechner nicht auftritt, ist ein Fehler über Zeit, nicht über Code.


---

## P76 · Eine Feder, die auf ihr eigenes Ziel neu gestartet wird, verliert ihren Schwung

*2026-09-20 · 🟡 klein*

**Das Bild.** `test541` §6 mass die Dehnung zum Nachbarn: 1,000 statt der gerechneten 1,175. Die Fläche dehnte sich nie.

**Die falsche Vermutung.** Die Rechnung im Modul stimmt nicht — Vorzeichen, Einheiten, oder der Deckel greift zu früh.

**Wie es gefunden wurde.** Nachgerechnet stimmte alles: bei 72 px Abstand und ω = 0,033 ist das Höchsttempo 0,87 px/ms, mal 0,2 macht 1,175. Also musste der Aufruf falsch ankommen, nicht die Formel.

**Die Ursache.** `handyLeiste()` läuft je Tipp ZWEIMAL — einmal aus dem Klick, einmal aus dem Ereignis `redion:schauplatz`. Der zweite Ruf traf die laufende Feder; weil `dataset.x` da schon umgeschrieben war, kam er mit „kein Nachbar" und startete die Bahn neu.

**Die Lösung.** Wer schon dorthin unterwegs ist, wird nicht neu gestartet. Eine Zeile: die Prüfung auf das gleiche Ziel gilt jetzt auch für die laufende Bewegung.

**Warum keine Uhr.** Keine Uhr im Spiel.

**Die Lehre.** Ein Modul, das mehrfach mit demselben Ziel gerufen wird, ist der Normalfall, nicht der Sonderfall — eine Oberfläche ruft ihre Zeichner gern zweimal. Wer eine Bewegung baut, muss „nochmal dasselbe" als NICHTS behandeln, nicht als neuen Anlass.


---

## P77 · Der vorausgeschickte Frame ging an niemanden

*2026-09-20 · 🟠 mittel*

**Das Bild.** `test541` §3 wurde rot, nachdem Redurs #109 auf main war: „Sie ist unterwegs schon losgefahren — 17 → 17". Nach 60 ms war die Fläche keinen Pixel gewandert.

**Die falsche Vermutung.** Mein eigener Bogen hat etwas kaputtgemacht. Dann: die Glasbrechung hält die Bewegung auf dem Hauptfaden. Beides falsch — ohne Glas und mit `will-change` dasselbe Bild.

**Wie es gefunden wurde.** Ein Messer, der je Bild Ort, aktiven Knopf und Zahl der Animationen mitschreibt. Er zeigte zweierlei: der aktive Knopf stimmte sofort, die Animation lief — und trotzdem stand die Fläche 94 ms lang still.

**Die Ursache.** Zwei Dinge hintereinander. Erstens konnte `handyLeiste()` die Fläche gar nicht losschicken: seit E274 sticht der Schauplatz den Reiter, und der ändert sich erst beim Aufbau. Zweitens bekommt eine Animation ihre Startzeit erst mit dem ersten WIRKLICH gemalten Bild — mit einem einzigen requestAnimationFrame fiel der Bildschirmaufbau in genau dieses Bild.

**Die Lösung.** `handyLeiste(vorauf)` nimmt das Ziel entgegen, und `dockWechsel` wartet zwei Bilder statt eines. Danach: t=10 x=17, t=26 x=27 — losgefahren, bevor der Aufbau beginnt.

**Warum keine Uhr.** Die Zeiten kommen aus `performance.now()` in der Seite und sind relativ zum Klick.

**Die Lehre.** Eine gute Absicht mit dem falschen Griff sieht im Code aus wie eine Lösung. Und die zweite Hälfte ist bitterer: mein eigener Messplatz war blind. Ein Messer, der je requestAnimationFrame liest, steht genau dann still, wenn der Hauptfaden blockiert — er kann über eine Bewegung unter Last gar nichts sagen. Dafür taugt nur ein Film. Eine Zusage, die am falschen Platz geprüft wird, ist keine.


---

## P78 · Ein `<svg>` ist kein `HTMLElement`, und `fokus.ts` wusste das

*2026-09-20 · 🟠 mittel*

**Das Bild.** Der erste volle Lauf gegen das neue `main` war rot: `test272` meldete „Und alles dahinter ist stillgelegt". Bei offenem Backstage-Blatt konnte man hinter die Fläche tabben.

**Die falsche Vermutung.** Dass es wie `test270` ein Artefakt des Arbeitsbaums sei. `test270` war es wirklich — im Hauptbaum grün. `test272` und `test290` waren es nicht, und beide waren MEINE, achtundvierzig Stunden alt.

**Wie es gefunden wurde.** Nach dem Ende des Sweeps im Hauptbaum einzeln nachgemessen, wie §30 es verlangt. Danach die Schleife in `fokus.ts` gegen die Behauptung des Wächters gelesen.

**Die Ursache.** `fokus.ts` legt beim Öffnen eines Dialogs die Körperkinder still, überspringt dabei aber alles, was kein `HTMLElement` ist. E639 hat für die Glaslinse ein `<svg>` direkt an den Körper gehängt — ein `SVGElement`. Es fiel durch, und `.inert` gibt es dort gar nicht: `undefined`. Derselbe Fehler stand seit E462 in `textur.ts` daneben und fiel nur nie auf, weil dieser Halter erst bei Gebrauch entsteht.

**Die Lösung.** Nicht den Wächter gelockert, sondern den Körper aufgeräumt: beide Halter liegen jetzt in einer von Geburt an stillgelegten Hülle. Eine Ausnahme im Wächter hätte jede spätere gedeckt (§55.2). Auf die Filter wirkt es nicht — mit `node bilder.mts heute handy` nachgesehen, die Linse liegt über „Heute" und der Name bleibt lesbar.

**Warum keine Uhr.** Aus einem Prüflaufergebnis abgeleitet, nicht aus einem Commit.

**Die Lehre.** `instanceof HTMLElement` heisst nicht „jedes Element". Derselbe Bautyp wie die fünf Fehler vom Vortag: ein Ausdruck misst etwas anderes, als der Satz daneben behauptet. Und: ein zweiter Halter kann jahrelang denselben Fehler tragen, solange kein Prüflauf ihn je entstehen lässt.


---

## P79 · Ein Präfix fehlte im Verzeichnis, und die Zahl daneben stimmte schon vorher nicht

*2026-09-20 · 🟡 klein*

**Das Bild.** `test290`: „Kein Präfix fehlt im Verzeichnis — bw — bitte in doku/CSS-NAMENSRAEUME.md eintragen".

**Die falsche Vermutung.** Keine — der Wächter nennt die Sache beim Namen. Die Überraschung kam beim Eintragen.

**Wie es gefunden wurde.** Im Hauptbaum nachgemessen; dann mit dem Regex des Wächters selbst gezählt, woher `bw` kommt.

**Die Ursache.** `.bw-flug` und `.bw-wartet` kamen mit E640 dazu, zusammen mit dem älteren `.bw-trenn` sind es sieben Vorkommen. Ab vier gilt ein Präfix als eigener Namensraum. Beim Eintragen fiel auf, dass der Fliesstext derselben Datei „Es sind 144" behauptete, während das Verzeichnis 158 Einträge trug.

**Die Lösung.** `bw  7  bausteine.css` eingetragen; die Zahl im Fliesstext auf 159 nachgezählt und den Zählbefehl danebengeschrieben, statt sie fortzuschreiben.

**Warum keine Uhr.** Aus einem Prüflaufergebnis abgeleitet.

**Die Lehre.** Dieselbe Lehre wie bei der Prüflaufzahl in §30: eine Zahl im Fliesstext, die kein Lauf anfasst, driftet. Sie gehört mit ihrem Befehl aufgeschrieben oder gar nicht.


---

## P80 · Fett traf das erste Wort, nicht das markierte

*2026-09-20 · 🟠 mittel*

**Das Bild.** In „Test und Test" das zweite Wort markieren und auf Fett drücken ergibt `**Test** und Test`. Der Text ändert sich, nur an der falschen Stelle — kein Absturz, keine Meldung.

**Die falsche Vermutung.** Keine bei der Ursache — `String.replace` mit einem String ist eindeutig. Die falsche Vermutung steckte im WÄCHTER: der erste Anlauf war rot und ich hielt ihn für einen Beweis. Er war rot mit „KEIN BLOCK", weil `App.zeichneSeite(id)` ohne `App.oeffne(id)` die Bibliothek stehen lässt. Er wäre genauso rot gewesen, wenn der Fehler gar nicht existierte.

**Wie es gefunden wurde.** Die Bestandsaufnahme vom selben Tag, beim Gegenlesen des Editor-Befunds. Kein Prüflauf hatte die Auswahlleiste je angefasst.

**Die Ursache.** `umschliesse` und `linkSetzen` ersetzten mit `(b.text||'').replace(txt, …)`. Ein String als Muster trifft das erste Vorkommen. Neun Monate unauffällig, weil der Normalfall — kurzer Block, einmaliges Wort — immer richtig war.

**Die Lösung.** `auswahlOffset()` gab es schon (E289, Lückenkarten). Jetzt in drei Stufen: geprüfte Zeichenstelle im Normalfall, Reihenfolge bei gerendertem Markdown, alter Weg als Rest. Neuer Wächter `test542`, der den falschen Wert ausdruckt statt nur „passt nicht".

**Warum keine Uhr.** Aus der Bestandsaufnahme abgeleitet, nicht aus einem Commit.

**Die Lehre.** Ein roter Lauf ist noch kein Beweis. Er muss aus dem RICHTIGEN Grund rot sein — und am sichersten sieht man das daran, dass er den falschen Wert nennt, nicht nur die Ungleichheit.


---

## P81 · Ein Schalter, der Sicherheit verspricht und nicht gelesen wird

*2026-09-20 · 🟠 mittel*

**Das Bild.** Das Datenbankmenü sagt „Verknüpfte Dienste dürfen Zeilen dieser Datenbank lesen und schreiben" — und zeigte bei jeder nie angefassten Datenbank „GitHub · aus", während der GitHub-Spiegel lief.

**Die falsche Vermutung.** Dass nur die Sperre fehle. Der schlimmere Teil war die ANZEIGE: `drin.includes(id)` ist ohne das Feld für jeden Dienst falsch. Ein Knopf, der nichts tut, ist ärgerlich; einer, der „aus" sagt, während etwas läuft, ist eine falsche Auskunft über die eigenen Daten.

**Wie es gefunden wurde.** Bestandsaufnahme vom selben Tag, Gegenleser des Datenbank-Befunds. Nachgemessen mit grep: `coll.verbindungen` wurde an zwei Stellen geschrieben und nirgends als Erlaubnis gelesen.

**Die Ursache.** Die Oberfläche für ein Rechtemodell war gebaut, das Modell selbst nie. Der Spiegel hängt an `gespiegelt`/`spiegelQuelle` und kannte den Schalter nicht.

**Die Lösung.** `Spiegel.darf` beantwortet die Frage an EINER Stelle, für Anzeige und Sperre. `undefined` heisst erlaubt (Bestandsschutz — ein Schalter, der bei Einführung alle Spiegel abwürgt, wäre schlimmer als der Fehler), `[]` heisst gesperrt. Gesperrt wird VOR dem Netzruf, also auch das Lesen, denn beide Abgleichwege holen zuerst und suchen die Datenbank danach.

**Warum keine Uhr.** Aus der Bestandsaufnahme abgeleitet.

**Die Lehre.** Ein Fusstext ist eine Zusage. Wer eine schreibt, muss zeigen, wer sie einlöst — und die ANZEIGE muss dieselbe Frage stellen wie die Sperre, sonst laufen sie auseinander und die falsche Auskunft ist die gefährlichere Hälfte.


---

## P82 · Das Teure war gebaut, das Billige fehlte

*2026-09-20 · 🟠 mittel*

**Das Bild.** Eine lange KI-Antwort liess sich nur durch Schliessen des Tabs beenden. Und der Menüpunkt „Meine Quellen" öffnete nichts — er zeigte eine Zahl und ein „▸" und tat nichts.

**Die falsche Vermutung.** Dass der Abbruch erst gebaut werden müsse. Er WAR gebaut: `frage` nimmt ein Signal, reicht es bis in `fetch`, und sogar der Backoff-`schlafen` bricht ab. Nur `senden` liess das dritte Argument weg, und es gab keinen Knopf.

**Wie es gefunden wurde.** Bestandsaufnahme vom selben Tag, Bereich KI/UX. Nachgemessen mit einem `fetch`, das nie antwortet — ausser das Signal kommt an.

**Die Ursache.** Ein Argument, das beim Aufruf fehlte, und ein Menüpunkt, der `quellenKarte(e.currentTarget)` rief: ein HTML-Element an eine Funktion, die eine Liste erwartet. `!element.length` ist wahr, also lautlos `null`.

**Die Lösung.** Der Senden-Knopf wird für die Dauer des Laufs zum Stopp-Knopf — dasselbe Element, dieselbe Grösse (§37), `aria-label` wechselt mit (§38). Ein Abbruch behält die Teilantwort und sagt „Abgebrochen" statt „AbortError". Der Menüpunkt öffnet dieselbe Schalterleiste, die im Fuss steht (§8).

**Warum keine Uhr.** Aus der Bestandsaufnahme abgeleitet.

**Die Lehre.** Ein grüner Prüflauf ist so wenig ein Beweis wie ein roter. Abschnitt 2 war zuerst grün, weil er sichtbare Schalter im GANZEN Dokument zählte — und die Leiste steht ohnehin im Fuss. Gemessen werden muss, was der Klick NEU öffnet. Dritter Fall dieser Art an einem Tag.


---

## P83 · Ein Blatt ohne Weg zurück, und ein Griff, der nichts hält

*2026-09-20 · hoch*

**Das Bild.** Wer das KI-Feld am Telefon öffnete, konnte es nicht mehr schliessen. Kein Kreuz im Kopf, `#btn-ai` auf `display:none`, kein Strg+J an einem Telefon, und die untere Leiste lag unter einem 88vh hohen Blatt auf z-index 920. Der einzige Ausweg war, den Tab zu schliessen.

**Die falsche Vermutung.** Dass es irgendeinen Weg geben muss — ein Tippen daneben, die Leiste darunter, Escape. Es gab keinen. Der Escape-Griff räumt `.menu` und `.overlay`; `#ai` ist ein `<aside>` und heisst weder so noch so.

**Wie es gefunden wurde.** Bestandsaufnahme vom selben Tag, §37-Durchgang. Nachgemessen mit einem Lauf, der nicht fragt, ob ein Kreuz dasteht, sondern jeden sichtbaren Knopf im Kopf DRÜCKT und danach nachsieht, ob `.open` weg ist: „2 geprüft, 0 schliessen".

**Die Ursache.** Der Weg zurück hing seit jeher an `#btn-ai` in der Kopfleiste. Als die Kopfleiste am Telefon ausgedünnt wurde (bausteine.css:297, „sonst quetschen sich zwölf Knöpfe in 428 Pixel"), ging er mit — und niemand hat gefragt, was dann das Blatt schliesst. Dazu zeichnete `#ai::before` einen Wischgriff, dessen Kommentar die Geste ausdrücklich verspricht; gehört hat auf `#ai` nie jemand.

**Der Beweis.** `test545` gegen den alten Stand: „✗ Mindestens ein sichtbarer Knopf schliesst das Blatt wirklich — 2 geprüft, 0 schliessen — das Blatt ist eine Falle". Gegenprobe nach dem Bau: `kiGriff()` abgehängt → genau eine Zeile rot, während „Der Zug landet wirklich auf dem Kopf des Blattes" grün bleibt.

**Die Lehre.** Ein Knopf, der auf einem Bildschirm ausgeblendet wird, nimmt jede Funktion mit, die NUR an ihm hing. Wer eine Leiste ausdünnt, muss für jeden entfernten Knopf sagen, wer seine Aufgabe übernimmt — und für das Zu eines Blattes gilt das doppelt, weil es kein zweites Mal geöffnet werden kann, wenn es offen feststeckt.


---

## P84 · Zweimal rot aus dem falschen Grund — derselbe Lauf

*2026-09-20 · 🟠 mittel*

**Das Bild.** `test545` war rot, sagte aber zweimal etwas anderes, als er mass: erst „der Knopf misst 0 × 0", dann „die Geste gibt es nicht" — obwohl der Knopf 44 px hatte und die Geste gebaut war.

**Die falsche Vermutung.** Beim ersten Mal: der Knopf sei zu klein. Beim zweiten Mal: der Griff sei nicht angeschlossen. Beides falsch.

**Wie es gefunden wurde.** Nachgesehen statt geglaubt. Das Maß wurde NACH dem Klick genommen — geschlossen steht `#ai` auf `display:none`, und dann misst jeder Knopf darin 0 × 0. Und `document.elementFromPoint` an der Zugstelle nannte den wahren Empfänger: `DIV#rg-willkommen`, das Willkommensblatt über allem.

**Die Ursache.** Zwei Messfehler im Wächter, keiner im Produkt.

**Der Beweis.** Nach der Korrektur: „→ ai-zu · 44×44 px" und „Der Zug landet wirklich auf dem Kopf des Blattes" — und die Gegenprobe wird nur an der Geste rot.

**Die Lehre.** Vierter und fünfter Fall derselben Sorte an zwei Tagen, nach `test542`, `test543` und `test544`. Die Lehre steht jetzt in beide Richtungen: ein roter Lauf ist noch kein Beweis, und ein grüner erst recht nicht. Ein Wächter, der eine Stelle anfasst, prüft zuerst, WER dort liegt.


---

## P85 · Eine Regel, die nur galt, weil es die Handlung nicht gab

*2026-09-20 · 🟠 mittel*

**Das Bild.** „Die KI löscht nichts ohne Bestätigung" war wahr — aber nur, weil kein Werkzeug löschen konnte. Die Rechte des Agentenkatalogs waren `lesen` und `bearbeiten`, mehr nicht.

**Die falsche Vermutung.** Dass das vorhandene Tor für `bearbeiten` (E295 ff.) auch fürs Löschen reicht. Es reicht an drei Stellen nicht: `fragenModus()` kennt „nie", es gibt „für diesen Lauf erlauben", und `darfAllein` lässt unbeaufsichtigt schreiben.

**Wie es gefunden wurde.** Redurs Auftrag gelesen, dann den Katalog gezählt statt erinnert: 12 Werkzeuge, 2 Rechte, 0 Löschwerkzeuge.

**Die Ursache.** Eine Fähigkeit, die es nie gab, braucht keine Grenze — bis jemand sie baut. Dann fehlt die Grenze genau in dem Bogen, in dem am wenigsten Zeit dafür ist.

**Der Beweis.** `test546` gegen den alten Stand: 6/13, darunter „kein Werkzeug mit Recht loeschen". Nach dem Bau 13/13, und die Gegenprobe mit abgehängtem Tor druckt „Seite ‚Weg damit' liegt im Papierkorb" bei null Dialogen nach einem Nein.

**Die Lehre.** Das Tor gehört in die Schleife, nicht ins Werkzeug. Ein Werkzeug, das selbst fragen muss, ist ein Werkzeug, bei dem das Fragen beim nächsten Mal vergessen wird — und beim Löschen merkt man es erst, wenn etwas fehlt.


---

## P86 · Eine Erfolgsmeldung ist kein Erfolg

*2026-09-20 · 🟠 mittel*

**Das Bild.** Ein Werkzeug meldet „3 Lernkarten angelegt — sie stehen ab sofort im Lernzentrum bereit", und das Lernzentrum zählt null.

**Die falsche Vermutung.** Dass es reicht zu prüfen, ob Blöcke entstehen. Entstanden sind sie — nur mit `type:'text'`, und `Learning.cards()` filtert auf `type === 'flashcard'`.

**Wie es gefunden wurde.** Als Gegenprobe zum eigenen Wächter gestellt: im gebauten `agenten.js` den Typ von `flashcard` auf `text` geändert und den Lauf wiederholt.

**Die Ursache.** Der Satz, den ein Werkzeug zurückgibt, wird vom Werkzeug geschrieben — nicht vom Ergebnis. Er kann also alles behaupten.

**Der Beweis.** Gegenprobe: „Antwort: 3 Lernkarten … stehen ab sofort im Lernzentrum bereit" bei „Learning.cards(): 1 → 1 · neu erkannt: 0".

**Die Lehre.** Ein Wächter misst dort, wo das Ergebnis GEBRAUCHT wird, nicht dort, wo es entsteht. Beim alten Schnellbefehl „Mache Karteikarten" ist derselbe Fehler jahrelang unbemerkt geblieben: er schrieb Text ins Chatfenster, und es sah nach Karteikarten aus.


---

## P87 · Derselbe Fehler, zwei Bögen später, an einer anderen Stelle

*2026-09-20 · 🟠 mittel*

**Das Bild.** Ein Werkzeug, das eine Textstelle ersetzt, trifft die falsche — `String.replace` nimmt das erste Vorkommen. Die Gegenprobe druckt es aus: „Die Leitung liegt. Das Kabel bleibt."

**Die falsche Vermutung.** Dass E650 diesen Fehler erledigt hat. E650 hat ihn in der Auswahlleiste des Editors repariert; als ich zwei Bögen später ein Werkzeug baute, das dasselbe tut, stand er als Möglichkeit sofort wieder da.

**Wie es gefunden wurde.** Nicht gefunden — vorhergesehen. Beim Entwurf von `textBearbeiten` war E650 noch in Reichweite, also wurde die Regel „genau einmal oder gar nicht" von vornherein eingebaut und die Gegenprobe gefahren, um zu sehen, was ohne sie passiert.

**Die Ursache.** Ein Modell plant eine Ersetzung aus dem, was es GELESEN hat, und liest nicht, wie oft etwas dasteht. Die Eindeutigkeit ist deshalb keine Eingabeprüfung, sondern ein Teil der Aufgabe.

**Der Beweis.** Gegenprobe mit abgehängter Prüfung: von zwei gleichlautenden Blöcken wurde der erste geändert, der zweite nicht — und im Satz mit zwei „Das Kabel" traf es das erste.

**Die Lehre.** Ein reparierter Fehler ist nicht erledigt, sondern bekannt. Wer kurz danach etwas Ähnliches baut, hat den billigsten Moment, ihn gar nicht erst entstehen zu lassen — und die Gegenprobe zeigt, dass die Vorkehrung nicht dekorativ ist.


---

## P88 · Die Lückenliste war selbst der stille Fehler

*2026-09-20 · 🟠 mittel*

**Das Bild.** 33 offene Lücken standen unterhalb der Überschrift „Anhang B · Was erledigt ist". Wer von oben liest, hält sie für erledigt.

**Die falsche Vermutung.** Dass es ein Formatierungsproblem ist. Es ist das Gegenteil dessen, wofür die Datei da ist: §35 sagt „eine bekannte Lücke ist besser als ein stiller Fehler", und hier war eine bekannte Lücke ZU einem stillen Fehler geworden.

**Wie es gefunden wurde.** Die Warnung stand schon in der Datei — jemand hatte es gefunden und das Umsortieren vertagt, „während achtzehn Läufe rot waren" (§46). Die sind weg; also nachgemessen und repariert.

**Die Ursache.** Der Anhang endete mit seiner letzten Tabelle, und alles Spätere wurde ans Dateiende geschrieben. Eine Datei wächst über ihre Gliederung hinaus, und niemand merkt den Tag, an dem es passiert.

**Der Beweis.** `test549` gegen den alten Stand: 3/6, mit „33 offene Lücken lesen sich von oben wie erledigt", fünf fremden Schlusswörtern und „genannt 103/53/50 · gemessen 101/52/49".

**Die Lehre.** Auch eine Doku-Datei kann einen Wächter haben. Der hier liest nur Text, braucht keinen Browser und läuft in einer Sekunde — es gab keinen Grund, ihn nicht schon vor einem Jahr zu schreiben.


---

## P89 · Der Titel ist nicht der Status

*2026-09-20 · niedrig*

**Das Bild.** Der neue Wächter hielt L181 („Das Lineal steht zweimal, sobald ‚Zeichnen' offen ist") für einen Eintrag mit dem Status „offen" — und im selben Lauf das Datum „20. September 2026" für die Zählung „20/2026/103".

**Die falsche Vermutung.** Dass ein Suchwort reicht, um einen Zustand zu erkennen.

**Wie es gefunden wurde.** Beide Male war der Lauf ROT — und sagte etwas anderes, als er mass. Aufgefallen beim Lesen der eigenen Ausgabe, nicht beim Schreiben des Codes.

**Die Ursache.** Ein Wort kommt in einer Überschrift vor, ohne dort etwas zu bedeuten. Die Regel muss sagen, WO sie zählt, nicht nur WAS.

**Der Beweis.** Nach der Korrektur: dieselbe Datei, dieselben Einträge, andere Zahl — 51 statt 52 offene.

**Die Lehre.** Vierter und fünfter Fall nach test544, test545 und test548. Eine Messung, die den Titel für den Status hält, misst den Titel. Ein roter Lauf ist noch kein Beweis, und ein grüner erst recht nicht.


---

## P90 · Vier Anläufe, vier erfundene Zahlen — und die Datei war immer in Ordnung

*2026-09-20 · niedrig*

**Das Bild.** Eine Prüfung von ENTSCHEIDUNGEN.md meldete nacheinander 351, dann 253, dann 203 Index-Einträge ohne Text. Es klang jedes Mal nach einem ernsten Fund.

**Die falsche Vermutung.** Dass die Datei kaputt ist. Sie war es nie: 638 von 638 Einträgen haben ihren Text.

**Wie es gefunden wurde.** Nach dem dritten Mal nicht repariert, sondern die MESSUNG angesehen. ENTSCHEIDUNGEN.md kennt drei Überschriftsformen — `## E123`, einen Banner zwischen zwei ===-Zeilen, und einen Titel mit === darunter, der über zwei Zeilen laufen kann. Jede engere Regel übersah eine davon.

**Die Ursache.** Eine gewachsene Datei benutzt die Form, die zur Zeit ihres Eintrags üblich war. Wer sie mit der HEUTIGEN Form misst, misst das Alter, nicht den Inhalt.

**Der Beweis.** Die Regel, die keine Form voraussetzt — eine Zeile, die mit der Nummer BEGINNT und ein Trennzeichen trägt —, findet 638 von 638.

**Die Lehre.** Bei der dritten Zahl, die nach einem Fund aussieht, ist der Prüfer verdächtig, nicht die Datei. Dazu: zwei weitere „Funde" dieses Bogens standen bereits als Erklärung in der Datei — nachlesen ist billiger als nachbessern.


---

## P91 · Ein Wächter, der die Höhe nicht sehen kann, die er prüft

*2026-09-20 · 🟠 mittel*

**Das Bild.** test402 hält §37 (44 px auf den Hauptwegen) und war jahrelang grün, während sieben Knöpfe unter jeder Tabelle 26 px hoch waren.

**Die falsche Vermutung.** Dass ein grüner §37-Wächter heisst, die Trefflächen stimmen.

**Wie es gefunden wurde.** Beim Nachmessen im Browser für E660: 7 von 7 Knöpfen 26 px. Danach im Wächter nachgesehen, warum er schweigt — er sucht height/min-height im Stilblatt, und dort stand keine Höhe.

**Die Ursache.** Die 26 px entstehen aus font-size:12px und padding:3px 9px. Eine Textsuche im CSS kann eine gerechnete Höhe nicht sehen; deshalb stand die Regel auch nie im Verzeichnis masse-bestand.json.

**Der Beweis.** test551 misst die gerenderte Box: vorher 7 × 26 px, nachher 7 × 44 px — bei unverändert grünem test402.

**Die Lehre.** Dasselbe wie §55.2, an anderer Stelle: eine Messung, die nicht messen KANN, was sie behauptet, sagt immer, es passe schon. Und: ein grüner Wächter ist eine Aussage über das, was er misst, nicht über die Regel, die er im Namen trägt.


---

## P92 · Fast eine zweite Werkzeugzeile gebaut, die es schon gab

*2026-09-20 · niedrig*

**Das Bild.** Ein fertig geschriebener Wächter suchte nach .stab-daumen — einer Werkzeugzeile, die ich für das Telefon bauen wollte.

**Die falsche Vermutung.** Dass es am Telefon keinen Weg zu den Tabellenbefehlen gibt, weil die Griffe 7 px messen und ein mouseover brauchen.

**Wie es gefunden wurde.** Beim Lesen der Stelle, an der die Griffe entstehen — zwanzig Zeilen weiter stand .stab-tools mit sieben Knöpfen, und im Stilblatt die Regel aus L108, die sie am Telefon sichtbar macht.

**Die Ursache.** §45 Schritt 1 übersprungen: die Datei an der interessanten Stelle gelesen, nicht zu Ende.

**Der Beweis.** Der Wächter wurde weggeworfen und neu geschrieben; der echte Fund war 26 px statt 44, nicht dass es nichts gibt.

**Die Lehre.** Der teuerste wiederkehrende Fehler dieses Projekts ist laut §45, etwas aus dem Gedächtnis zu bauen statt nachzuschlagen. Einen Wächter wegzuwerfen ist billiger als einen zweiten Katalog zu pflegen (§8).


---

## P93 · Die eigene Erklärung vor die des Anbieters gestellt

*2026-09-20 · 🟠 mittel*

**Das Bild.** Redion meldete: Groq antwortet mit 404. Die Adresse gibt es nicht. Dahinter stand Groqs eigener Satz, dass das MODELL nicht mehr existiert.

**Die falsche Vermutung.** Beim Lesen der Meldung zuerst: die URL sei falsch oder der Schlüssel abgelaufen. Beides war in Ordnung.

**Wie es gefunden wurde.** Redur hat die Meldung wörtlich geschickt — darin stand code: model_not_found. Die Ursache war also mitgeliefert und wurde von der eigenen Tabelle verdeckt.

**Die Ursache.** FEHLERTEXT ordnet jeder Statuszahl genau einen Satz zu. Eine Zahl hat aber mehrere Ursachen, und 404 heisst bei einem Chat-Dienst fast immer: das Modell, nicht die Adresse.

**Der Beweis.** Gegenprobe mit dem alten Wurf: Die Adresse gibt es nicht (object_not_found) steht wieder da, obwohl der Körper die Wahrheit enthält.

**Die Lehre.** Wer redet, hat recht. Eine eigene Erklärung gehört dorthin, wo der andere schweigt — nicht davor. Und eine Meldung, die in die falsche Richtung zeigt, kostet mehr Zeit als gar keine.


---

## P94 · Die Gegenprobe war falsch, nicht der Code

*2026-09-20 · niedrig*

**Das Bild.** Eine Gegenprobe sollte den neuen Zweig abhängen, und der Lauf blieb grün. Kurz sah es nach einem zu schwachen Wächter aus.

**Die falsche Vermutung.** Dass der Wächter die Stelle nicht wirklich misst.

**Wie es gefunden wurde.** Die eingesetzte Zeile gelesen: const modellWeg = false && A || B. In JavaScript bindet && stärker als ||, also blieb B übrig und der Zweig lief weiter.

**Die Ursache.** Eine Gegenprobe wird schnell hingeschrieben, weil sie ja nur wegnehmen soll. Sie ist trotzdem Code.

**Der Beweis.** Mit if (modellWeg) zu if (false) wurden genau zwei Zusagen rot, die richtigen.

**Die Lehre.** Eine Gegenprobe ist ein Stück Code wie jedes andere und kann genauso falsch sein. Ein grüner Lauf nach einer Gegenprobe heisst zuerst: die Gegenprobe ansehen.


---

## P95 · Das Werkzeug für die Prüfläufe war selbst ungeprüft

*2026-09-20 · 🟠 mittel*

**Das Bild.** volllauf.mts meldete zehn rote Läufe (266 bis 277), tatsächlich war einer rot: test270.

**Die falsche Vermutung.** Beim Lesen der Meldung zuerst: ein ganzes Stück ist gescheitert, also vermutlich eine Portkollision oder der Arbeitsbaum. Es war die Auswertung.

**Wie es gefunden wurde.** Ins Protokoll gesehen statt in die Zusammenfassung. Dort stand die Bilanz von alle.mts auf zwei Zeilen: das Zeichen oben, der Name darunter.

**Die Ursache.** Die Zerlegung suchte je ZEILE nach einem Kreuz UND einer Testnummer. Keine der beiden Zeilen trägt beides, also fand sie nichts und fiel auf das ganze Stück zurück.

**Der Beweis.** Gegenprobe mit der alten Regel: genau das beobachtete Symptom, [266 bis 277] statt [270].

**Die Lehre.** Ein Werkzeug, das Prüfläufe auswertet, ist selbst ungeprüft, bis es einen Wächter hat. Dieses war zwei Stunden alt und hat in seinem ersten Ernstfall danebengegriffen. Und: der vorsichtige Rückfall war richtig — er hat nur die echte Spur unter neun falschen begraben.


---

## P96 · Eine Auswertung, die mit einem Feld rechnet, das niemand schreibt

*2026-09-20 · 🟠 mittel*

**Das Bild.** Die Wochenrückschau zeigte eine leere Liste und ein Tagesdiagramm aus Nullen, obwohl Aufgaben abgehakt waren.

**Die falsche Vermutung.** Dass die Rückschau falsch rechnet oder das Datum falsch vergleicht.

**Wie es gefunden wurde.** Gezählt, wer das Feld schreibt: im ganzen Programm genau eine Stelle, der ICS-Import. Das Kästchen im Editor schrieb nur checked.

**Die Ursache.** Das Feld wurde beim Lesen eingeplant und beim Schreiben vergessen. Zwanzig Zeilen tiefer hatten Datenbankzeilen längst einen Rückfall auf edited — Blöcke nicht.

**Der Beweis.** test554 gegen den alten Stand: in der Rückschau false, insgesamt 0 erledigte, Tagesdiagramm 0.

**Die Lehre.** Wer eine Auswertung baut, prüft nicht nur, ob sie richtig rechnet, sondern ob irgendjemand ihre Eingabe schreibt. Und: der Stempel gehört an die eine Stelle, durch die alle sechs Schreibwege gehen, nicht an jeden einzelnen.


---

## P97 · Ein Wächter, der an der Reihenfolge im Block scheitert

*2026-09-20 · niedrig*

**Das Bild.** test403 meldete im vollen Lauf: Beide stehen in einem finally — [false,true]. Der Code stand korrekt in einem finally.

**Die falsche Vermutung.** Dass beim Umbau des KI-Chats (E652) ein remove aus dem finally gerutscht ist.

**Wie es gefunden wurde.** Die Stelle angesehen: das remove stand im finally, nur nicht mehr als erste Zeile. Der Wächter sah zwei Zeilen zurück.

**Die Ursache.** E652 hat zwei Zeilen in dasselbe finally geschoben. Die Messung prüfte damit die Reihenfolge innerhalb des Blocks statt den Block.

**Der Beweis.** Nach dem Umbau auf Klammernzählen: 22 von 22 grün, und die Gegenprobe (ein remove aus dem finally geholt) wird wieder rot.

**Die Lehre.** Eine Messung, die von der Reihenfolge im Block abhängt, meldet Umbauten als Fehler. Das kostet beim nächsten vollen Lauf genau so viel Zeit wie ein echter Fund — und erzieht dazu, rote Läufe für Rauschen zu halten.


---

## P98 · Das Verzeichnis der Querverweise zählt zu wenig

*2026-09-20 · 🟠 mittel*

**Das Bild.** test537 wurde rot: 519 gegen 517 Treffer, bei unverändert 125 Paaren. Es sah nach zwei neuen Kopplungen aus.

**Die falsche Vermutung.** Dass beide neu sind. Einer war meiner (E661, zwei Griffe statt eines). Der zweite steht seit E500 im Code.

**Wie es gefunden wurde.** Die alte Fassung der Datei durch denselben Filter geschickt: roh 2 Treffer, nach ohneSchablonen 1. Der Aufruf war immer da und für den Wächter unsichtbar.

**Die Ursache.** ohneSchablonen wirft ganze Schablonen weg, damit deutsche Prosa in Backticks nicht mitzählt (E626, 88 Falschtreffer). Dabei fliegen auch echte Aufrufe heraus: ein ${Name.methode(x)} in einer Schablone ist ein Aufruf, kein Text.

**Der Beweis.** Über alle 86 Dateien in src/bereiche gemessen: 7907 Aufrufe nach nurCode, 7641 nach ohneSchablonen — 266 verdeckt, 3,4 Prozent, davon 136 allein in editor.ts.

**Die Lehre.** Ein Wächter, der zu viel wegfiltert, meldet nicht zu viel, sondern zu wenig — und seine Zahl sieht dabei genauso fest aus. Das Verzeichnis wurde NICHT angehoben: eine Zahl zu erhöhen, weil die Messung besser wurde, ist etwas anderes als eine neue Kopplung, und der Unterschied muss sichtbar bleiben. Die Wahl steht als L207 bei Redur.


---

## P99 · Ein Menuepunkt, der eine Zeichenkette schreibt, waehrend die Maschine danebensteht

*2026-09-20 · 🟠 mittel*

**Das Bild.** Der Slash-Eintrag Erinnerung schrieb @remind in den Text und war fertig. Die Hilfeseite sagt dazu ein Haekchen.

**Die falsche Vermutung.** Dass Erinnerungen noch gar nicht gebaut sind. Sie sind seit E54 vollstaendig da — Dialog, Liste, Geraete-Meldung, Weckruf am Server.

**Wie es gefunden wurde.** Gesucht, wer @remind liest: niemand. Das Muster mention und date schreibt auch nur ein Zeichen, aber dort haengt ein Menue am Tippen. Bei remind gibt es keines.

**Die Ursache.** Der Eintrag wurde nach dem Vorbild von mention und date gebaut, ohne zu pruefen, ob es das Menue dahinter gibt.

**Der Beweis.** test555 gegen den alten Stand 2/12: kein tun am Eintrag, kein Dialog, keine Erinnerung in der Liste.

**Die Lehre.** Wer einen Eintrag nach dem Vorbild eines anderen baut, uebernimmt auch dessen Voraussetzungen. Und: der Draht gehoert ins Register, wenn ein Bereich einen anderen braucht — das ist §5s dritter Weg, und er kostet keinen Querverweis.


---

## P100 · Dieselbe Funktion zweimal — und E650 reparierte nur die eine

*2026-09-21 · hoch*

**Das Bild.** Strg+B in einem Block `Ein **fetter** Satz` machte daraus `Ein fetter **Satz**`. Die vorhandene Auszeichnung war weg, ohne Absturz und ohne Meldung. Über den Knopf der Auswahlleiste kam `Ein **fetter** **Satz**` heraus.

**Die falsche Vermutung.** Dass Fett nur nicht abschaltbar ist — ein Schönheitsfehler (`****Wort****`). Der zweite Fund lag darunter.

**Wie es gefunden wurde.** Beim Lesen von `umschliesse` fiel auf, dass es den Namen ZWEIMAL gibt: einmal in auswahlleiste.ts (E650 repariert) und einmal in editor.ts, an der Tastatur.

**Die Ursache.** Die Fassung in editor.ts schrieb `ct.textContent` zurück — den gezeichneten Text ohne Markdown-Zeichen.

**Der Beweis.** test557 gegen den alten Stand 8/13, mit beiden Zeilen im Klartext: `Ein schlichter ****Satz****` und `Ein fetter **Satz**`.

**Die Lehre.** §8 wörtlich: ein zweiter Katalog läuft mit dem ersten auseinander, und niemand merkt, welcher gilt. Und die Folge für Wächter: test542 prüfte den KNOPF — ein Lauf, der nur einen von zwei Wegen misst, sagt grün über die halbe Wahrheit.


---

## P101 · Sechs Zusagen grün, weil die Liste leer war

*2026-09-21 · 🟠 mittel*

**Das Bild.** Der erste Anlauf von test558 stand bei 6/18 gegen einen Server-Weg, den es gar nicht gab. Grün waren unter anderem „Das fremde Konto steht NICHT darin“ und „Kein roher Token geht hinaus“.

**Die falsche Vermutung.** Dass sechs Zusagen schon halten, was sie sagen. Eine leere Liste enthält kein fremdes Konto und keinen Token, und zwei Kennungen aus null Einträgen sind auch verschieden.

**Wie es gefunden wurde.** Beim Lesen der roten Ausgabe: der Weg antwortete 404, und trotzdem standen sechs Häkchen da.

**Die Ursache.** Jede dieser Zusagen prüfte eine EIGENSCHAFT der Liste, ohne vorher zu verlangen, dass es eine gibt.

**Der Beweis.** Nach dem Härten: 0/18 gegen denselben Stand.

**Die Lehre.** §55.2, zum wiederholten Mal in diesem Monat: wer eine Prüfung schreibt, prüft zuerst, ob sie rot werden KANN. Eine Zusage über eine Menge braucht die Menge als Vorbedingung.


---

## P102 · OHNE_FRAGE ist die Zahl 30

*2026-09-21 · 🟠 mittel*

**Das Bild.** Der erste Lauf von test559 gab fünf Minuten lang keine einzige Zeile aus und starb am Zeitlimit.

**Die falsche Vermutung.** Zuerst: der Prüfserver liefert pdf.js nicht aus (falsche MIME-Typen für .mjs/.wasm). Dann: der Browser ist abgestürzt. Beides war falsch.

**Wie es gefunden wurde.** Nachgesehen, was `PdfEinlesen.OHNE_FRAGE` ist: `const OHNE_FRAGE = 30` — die Seitenzahl, ab der gefragt wird. Als `vorgabe` übergeben hat eine Zahl keine Felder, also fiel `alsSeiten` in den Dialog-Zweig.

**Die Ursache.** Ein Konstantenname, der wie ein Schalter klingt, und ein Aufruf aus dem Gedächtnis statt nachgeschlagen (E21).

**Der Beweis.** Mit `{ anordnung: 'untereinander', ueberGrenze: 'alle' }` lief derselbe Lauf durch und war 4/18 rot — also messbar.

**Die Lehre.** Ein Dialog ohne Menschen wartet ewig. Und: der teuerste wiederkehrende Fehler dieses Projekts hat heute einen neuen Weg gefunden — nicht die Signatur war falsch erinnert, sondern die BEDEUTUNG eines Namens.


---

## P103 · Der Punkt des breiten Füllers war ein Splitter — und der Wächter grün

*2026-09-21 · 🟠 mittel*

**Das Bild.** Nach E673 zeigte das Bild einen senkrechten Strich, wo ein 2-pt-Punkt mit dem 5-pt-Füller stehen sollte; test561 stand auf 22/22.

**Die falsche Vermutung.** „Kurze Striche bekommen eine kurze Spitze“ reicht — wenn der WEG der Spitze mit dem Strich schrumpft, bleibt ein Punkt ein Punkt.

**Wie es gefunden wurde.** node bilder.mts spitze — die vierte Zeile des Bildes (§55.1). Der Lauf hatte nur den 2,4-pt-Füller gemessen; dort ist ein 2-pt-Punkt breiter als lang und fällt nicht auf.

**Die Ursache.** Die Spitze war kurz, aber immer noch spitz: `spitzeFaktor` lief auch bei einem 2 pt langen Strich auf `min` (0,25) — bei 5 pt Breite ein Splitter von 1,25 pt Rand bei 5 pt Mitte.

**Der Beweis.** test561 §3, neu: „Punkt (2 pt) mit 5-pt-Füller: Anfang 1.25 · Mitte 5“ — rot; nach der Reparatur (die Spitze wird stumpfer, je weniger von zwei Federn in den Strich passt) 4,66 gegen 5.

**Die Lehre.** Ein Wächter hält nur die Fälle, die er enthält. Wer eine Regel für „kurze Striche“ schreibt, misst sie mit dem BREITESTEN Stift, nicht mit dem, der gerade da war — und sieht das Bild, bevor er grün sagt.


---

## P104 · Eine Gegenprobe, die gar nicht lief

*2026-09-21 · 🟠 mittel*

**Das Bild.** Beim Abhängen der Eckenerkennung (E676) druckte der Prüflauf weder ✗ noch „bestanden“ — die Zeile war leer.

**Die falsche Vermutung.** Ein `sed`, der `if (…)` in `if (false && …) // GEGENPROBE` verwandelt, ist harmlos.

**Wie es gefunden wurde.** Der `grep` auf „✗|bestanden“ gab NICHTS aus. Nicht rot, nicht grün — leer. Erst das fiel auf.

**Die Ursache.** Der angehängte `//`-Kommentar schluckte die öffnende Klammer `{` derselben Zeile; `stroke.js` hatte einen Syntaxfehler, `eval` warf, der Lauf brach vor der ersten Zusage ab.

**Der Beweis.** Zweiter Anlauf ohne Kommentar (`< KEHRE` → `< -2`): 6 von 8, „2,62 px“ — die erwarteten zwei Zusagen rot.

**Die Lehre.** Eine Gegenprobe ist ein Stück Code wie jedes andere (E661) und muss BAUEN (§52.6). Und ein Wächter, dessen Ausgabe leer ist, hat nichts gehalten — leer ist nicht grün.


---

## P105 · Der Glätter hielt die Ecke, die Marke nicht — acht gleichmässige Punkte statt der Ecken

*2026-09-21 · 🟠 mittel*

**Das Bild.** Nach E676 zeigte das Bild ein „M“ mit spitzen Gipfeln und einem runden Tal; test564 stand auf 8/8.

**Die falsche Vermutung.** Wenn der Glätter die Ecke trifft, steht sie auch in der Marke — der Rest des Wegs (Absetzen, Umriss) ist nur Zeichnen.

**Wie es gefunden wurde.** node bilder.mts ecke, dann eine Sonde auf die gespeicherten Punkte: 8 Punkte, gleichmässig, das Tal 23,7 px neben dem nächsten.

**Die Ursache.** `finish` (E115): hat RDP weniger als acht Stützpunkte übrig, nimm acht gleichmässige — ANSTELLE der RDP-Punkte. RDP hatte die fünf Ecken behalten, die Regel warf sie weg. Dahinter noch der Umriss: eine Q-Kurve durch jede Ecke, 5,12 px daneben.

**Der Beweis.** test564 §4 vorher „[4.24, 23.71, 11.5]“ (Mittellinie) und „[15.19, 23.68, 20.37]“ (Umriss); nachher [0,0,0] und [0.71,0.29,0.8]. Gegenprobe A (acht ersetzen): 23,72; Gegenprobe B (Stück ohne Ecke): 5,12.

**Die Lehre.** Ein Wächter am Kern beweist den Kern. Was der Nutzer sieht, entsteht drei Stationen später — und jede kann verlieren, was die vorige gehalten hat. Deshalb §55.3: ein Bild, wenn man etwas sehen kann; und der Wächter folgt der Sache bis dorthin, wo man sie sieht.


---

## P106 · Frage 5 kam vor Frage 4 — 57 Karten in derselben Millisekunde, sortiert nach created

*2026-09-22 · 🟠 mittel*

**Das Bild.** test565 §3 gegen den ersten Stand: „7 Prüfungsfragen, wortgleich=false“ — Karte 1 war Frage 1, die Prüfungsrunde sah richtig aus.

**Die falsche Vermutung.** Nach `created` sortiert stehen die Karten in der Reihenfolge, in der die Vorlage sie angelegt hat.

**Wie es gefunden wurde.** Der Wächter vergleicht die sieben Prüfungsfragen Zeichen für Zeichen und in der Reihenfolge des Lehrers mit dem Inhalt — nicht nur die erste.

**Die Ursache.** Die Vorlage legt alle 57 Karten in derselben Millisekunde an; `created` ist für alle gleich, `localeCompare` gibt 0, und die Sortierung fällt auf die Reihenfolge von `Object.values(Store.cache.blocks)` zurück. Dazu war die Seite nach Thema gruppiert: p5 (Gewaltentrennung) stand vor p4 (Parlament).

**Der Beweis.** test565 §3 rot (wortgleich=false); nach dem Umbau — Seitenreihenfolge über Elternblock und Stelle in `content`, Prüfungsfragen zuoberst — 54/54.

**Die Lehre.** Ein Zeitstempel ordnet nichts, was gleichzeitig entsteht. Die Reihenfolge, die zählt, ist die, die der Mensch sieht und ändern kann — die Seite. Und ein Wächter, der nur den ersten Fall prüft, hätte hier „passt schon“ gesagt (§55.2).


---

## P107 · Der Graph der Karte malte „genannt“ als „benutzt“

*2026-09-25 · 🟡 klein*

**Das Bild.** In doku/karte/Redion.md zeigte ein Pfeil vom Whiteboard auf SheetSpace und InkGeometry — beides benutzt das Whiteboard NICHT, das war gerade der Befund.

**Die falsche Vermutung.** Wenn ein Befund einen Kern nennt, benutzt das System ihn.

**Wie es gefunden wurde.** Beim Lesen des ersten erzeugten Graphen: der Pfeil widersprach dem Satz daneben („InkGeometry — NICHT genutzt“).

**Die Ursache.** Die Kante wurde aus jedem Vorkommen des Namens im Befund gerechnet, auch aus Sätzen mit „NICHT genutzt“.

**Der Beweis.** Nach der Trennung in „benutzt“ (gemeinsamGenutzt/Schnittstellen ohne Verneinung) und „nur genannt“ zeigt das Whiteboard auf Store, Register, Dateien — und SheetSpace/InkGeometry stehen unter „nur genannt“.

**Die Lehre.** Ein gerechneter Graph ist eine Behauptung wie jede andere; man liest ihn gegen den Text, aus dem er kommt, bevor man ihn zeigt.


---

## P108 · Strg+Z nahm zweimal zurück — der Block und die ganze Seite

*2026-09-25 · 🟠 mittel*

**Das Bild.** Im Schaltplan: Teil gesetzt, Strg+Z — drei Teile wie vorher, Meldung „Rückgängig“, Block neu gezeichnet, neue Kennung. Auf dem Blatt: ein Strich weg, der alte Block existiert nicht mehr.

**Die falsche Vermutung.** Wer preventDefault ruft, hat die Taste.

**Wie es gefunden wurde.** Aus dem Lesen (schale.ts hört am Dokument ohne Blick auf defaultPrevented; Planfläche und Marken ohne stopPropagation) eine Sonde gebaut und gefahren — Ausgabe wörtlich im Audit 2.4.

**Die Ursache.** Der Dokument-Horcher der Schale rief bei jedem Strg+Z Verlauf.zurueck(); der Seitenverlauf riss die Seite ab und baute sie neu.

**Der Beweis.** test568 gegen den alten Stand rot 13/25; nach einer Zeile in der Schale 26/26; Gegenprobe (Zeile raus) wieder rot.

**Die Lehre.** Eine Taste hat zwei Enden. Wer die eine Hälfte liest, sieht die Doppelung nicht — messen, mit dem Fokus dort, wo der Mensch ihn hätte.


---

## P109 · Der Seitenverlauf gab jedem Block neue Kennungen — und löschte die Fassungen der Unterseiten

*2026-09-25 · hoch*

**Das Bild.** Strg+Z auf der Elternseite: Unterseite a8da9eea… → a7ecec08…, Fassungen 1 → 0, Favorit zeigt auf die alte Kennung. Ein Bild dagegen überlebte (Dateisatz umgehängt).

**Die falsche Vermutung.** Wenn das Bild überlebt, ist der Kennungswechsel eine Schönheitsfrage.

**Wie es gefunden wurde.** Die zweite Sonde — mit einer Unterseite statt eines Bildes — nur gefahren, weil die erste zu beruhigend war.

**Die Ursache.** Verlauf.anwenden = kinderLeeren (purgeBlock je Kind: Grabsteine, purgeAnhaenge löscht versions) + baumEinfuegen („immer mit frischen IDs“). Eine Unterseite ist ein Kind der Seite.

**Der Beweis.** test569 gegen den alten Stand rot 10/20; mit Store.baumAbgleichen 36/36 (später 48/48); Sonde nach dem Bau: Fassungen 1 → 1, Kennung gleich. Vier Gegenproben rot an ihren Stellen.

**Die Lehre.** Ein Zurück, das abreisst und neu baut, ist kein Zurück, sondern ein Ersatz — und alles, was an der Identität hing, hängt dann an nichts. Die richtige Messung ist die mit dem Ding, das am meisten zu verlieren hat (Fassungen), nicht die mit dem, das am meisten Angst macht (Bytes).


---

## P110 · Ein Commit ohne seinen Inhalt — das Schreibskript war an einem Anführungszeichen gescheitert

*2026-09-25 · 🟡 klein*

**Das Bild.** Commit 680d19d hiess „L212 Punkt 2 nachgemessen: … Unterseite …“, enthielt aber nur die Bild-Sonde in messungen.md; L212 und der Audit waren unverändert.

**Die falsche Vermutung.** Wenn das Python-Skript und der Commit in derselben Befehlskette stehen, enthält der Commit, was das Skript schreiben sollte.

**Wie es gefunden wurde.** Die Fehlermeldung stand über dem Commit-Erfolg: SyntaxError, unterminated string literal — die Doku benutzt „…" mit einem ASCII-Anführungszeichen als Schlusszeichen, und das schloss meine Zeichenkette.

**Die Ursache.** Ein Parsefehler bricht das ganze Skript ab, bevor die erste Zeile läuft; `&&` hinter einem Heredoc-Python prüft nur den Exit — und den hatte ich nicht geprüft, weil die nächste Zeile ohne && folgte.

**Der Beweis.** Nachtrag f014fa3 mit den drei fehlenden Änderungen; danach test549 6/6.

**Die Lehre.** Zeichenketten mit Redions Anführungszeichen nur in dreifachen Anführungszeichen schreiben — und ein Commit gehört hinter ein `&&`, nicht hinter ein Zeilenende.


---

## P111 · Eine Prüfung, die wider Erwarten grün blieb — der Audit hatte die Handformel für falsch erklärt

*2026-09-25 · 🟡 klein*

**Das Bild.** test570 §3 sollte mit scale(0.8) am Elternteil zeigen, dass die Handformel des Whiteboards (sicht.x + (clientX - left) / sicht.z) vom Ergebnis der Matrix abweicht. Sie war grün: beide Rechnungen gaben dieselben Zahlen.

**Die falsche Vermutung.** Drei Formeln für Bildschirm → Raum, eine Matrix — also rechnen die Formeln bei jeder Transformation des Elternteils falsch (Audit D2, R3).

**Wie es gefunden wurde.** Der Wächter lief gegen den ALTEN Stand und blieb an der Stelle grün, an der er rot sein sollte (§50: ein Wächter muss rot gewesen sein). Erst rotate(180deg) trennte Formel und Matrix: „ist 394,168 soll 312,192“.

**Die Ursache.** Der viewBox des SVG wird aus demselben Kasten gerechnet, den getBoundingClientRect liefert; bei achsenparalleler Skalierung kürzt sich der Faktor heraus. Falsch wird die Formel nur bei Drehung oder Scherung.

**Der Beweis.** test570 §3 (scale) grün und §3b (rotate) rot gegen den alten Stand; mit der Matrix beide grün. Audit D2 und E686 berichtigt.

**Die Lehre.** Eine Behauptung im Audit ist eine Vermutung, bis ein Wächter sie rot gezeigt hat. Und ein Wächter, der grün bleibt, wo er rot sein sollte, ist kein zu schwacher Wächter, sondern ein Fund über die Behauptung (§55.2).


---

## P112 · Tiefe 0 wurde zu Tiefe 40 — `Number(x) || 40` hält 0 für „nichts gesagt“

*2026-09-25 · 🟡 klein*

**Das Bild.** test571: „Die Tiefe ist mindestens 1“ rot — GfxHistory.erstelle(0).stand().tiefe war 40, nicht 1.

**Die falsche Vermutung.** `Number(tiefe) || 40` sei die Vorgabe für „keine Zahl angegeben“.

**Wie es gefunden wurde.** Der Wächter, im selben Bogen wie der Kern geschrieben; der Kern war vor dem Wächter falsch, und der Lauf hat es beim ersten Mal gedruckt.

**Die Ursache.** `||` behandelt 0 wie undefined. Wer 0 sagt, meint 0 — und bekommt seither die Untergrenze 1; nur was gar keine Zahl ist (Number.isFinite falsch), fällt auf 40 zurück.

**Der Beweis.** test571 24/24 nach der Änderung; die Zusage prüft erstelle(0) → 1, erstelle(-5) → 1, erstelle() → 40.

**Die Lehre.** Vorgaben mit `??` oder Number.isFinite setzen, nie mit `||`, wenn 0 ein gültiger Wert ist.


---

## P113 · Die Startdecke war sechs Tage lang gerissen, und kein Bogen hatte den Lauf als Nachbarn

*2026-09-25 · 🟡 klein*

**Das Bild.** test388 §5: „Der Start holt 2711 KB (gzip) über 238 Dateien — Decke 2700 KB“. Rot nach Bogen 4 (E687), der 2 KB beiträgt; vor ihm stand die Zahl bei 2709.

**Die falsche Vermutung.** Die Nachbarliste eines Bogens — die Läufe, die dieselben Dateien lesen — findet, was der Bogen kaputt macht. Eine Decke über das GANZE hat aber keine Datei, die man anfasst; sie ist niemandes Nachbar.

**Wie es gefunden wurde.** Nicht wegen der Decke: test388 trägt die Zusage „die Chronik wird beim Start nicht geholt“ (E613) und lief deshalb nach dem Chronik-Nachtrag. Im vollen Lauf vom 19. September war er noch grün; zwischen dem 19. und dem 25. hat niemand ihn gefahren.

**Die Ursache.** 127 KB in neun Tagen — Studio, Trainer, NIN-Quiz, Gedankenkarte, Dock-Welle — und kein voller Lauf seit dem 19. September (§46: main bewegt sich erst nach einem grünen).

**Der Beweis.** Messung gegen bef8c3f in messungen.md §62; danach Decke 2850 und test388 19/19.

**Die Lehre.** Jeder Bogen, der eine Skriptdatei zu index.html hinzufügt, fährt test388. Und die Decke ist ein Grund mehr, den vollen Lauf nicht länger als eine Woche liegen zu lassen — sie kann nur dort reissen, wo sie gefahren wird.


---

## P114 · `window.App` gibt es nicht — und der optionale Zugriff schluckt es

*2026-09-26 · 🟠 mittel*

**Das Bild.** Ein Klick schreibt das Feld an den Block, und der Bildschirm bleibt stehen. Keine Meldung, kein Fehler in der Konsole.

**Die falsche Vermutung.** Der Zweig, der die neue Ansicht zeichnet, fehlt — oder der Kasten wird nicht gebaut.

**Wie es gefunden wurde.** Mit einer Sonde im Browser: `typeof (window as any).App` sagte `undefined`, während `typeof App` in derselben Seite `object` sagte.

**Die Ursache.** `const App = (() => …)()` in einem gewöhnlichen <script> legt eine globale LEXIKALISCHE Bindung an. Die steht im globalen Geltungsbereich, aber NICHT als Feld von `window` — anders als `var` und anders als eine ausdrückliche Zuweisung. `(window as any).App?.zeichneSeite?.()` ist damit ein optionaler Zugriff auf `undefined`: er tut nichts und meldet nichts.

**Der Beweis.** Sonde vom 26. September: `art() sagt: { art: 'redion', feld: undefined, hatZeichne: 'undefined' }` — und derselbe Aufruf über den baren Namen wirkte sofort.

**Die Lehre.** Ein `?.` auf einen globalen Namen ist kein Schutz, sondern ein Schalldämpfer. Wer prüfen will, ob es etwas gibt, schreibt `typeof X !== 'undefined'`. Und: dieselbe Zeile ist an EINEM Tag zweimal entstanden — ein Fehler, der sich wiederholt, gehört in den Code kommentiert, nicht nur in den Kopf.


---

## P115 · Ein Wächter, der eine Absicht misst, die es nicht gibt

*2026-09-26 · 🟠 mittel*

**Das Bild.** `test574 §8` meldete zweimal „am Telefon gibt es keinen Weg auf die Fläche“ — obwohl es ihn gab.

**Die falsche Vermutung.** Der Menüeintrag fehlt, oder der Griff wirkt am Telefon nicht.

**Wie es gefunden wurde.** Beim Nachlesen der Stelle, die der Lauf ansprach: `editor.ts:1955` unterdrückt `contextmenu` unter 760 px ausdrücklich — dort gehört das lange Drücken der Hebe-Geste (E83). Und Fund 2 von E83 sagt, dass der Fänger die Klick-Nachzügler nach einer Berührung 800 ms schluckt; der Lauf tippte nach 400 ms.

**Die Ursache.** Der Wächter hat den Weg des RECHNERS am Telefon gefahren und die vorhandene Geste gar nicht angefasst. Zweimal war er rot, und zweimal lag es an ihm.

**Der Beweis.** Mit `touchstart`, 750 ms Warten und `touchend` ging das Menü auf; nach weiteren 900 ms wirkte der Klick — ohne eine Zeile am Produkt.

**Die Lehre.** Eine Prüfung muss den Weg fahren, den der Mensch auf DIESEM Gerät hat, nicht den, den sie vom anderen kennt. Und wenn eine Zusage rot ist, lautet die erste Frage nicht „was ist am Produkt kaputt“, sondern „misst der Lauf überhaupt, was er behauptet“ (L206).


---

## P116 · Ein Tastenkürzel, das im Menü steht und nie erreichbar war

*2026-09-26 · 🟠 mittel*

**Das Bild.** Strg+Umschalt+↑/↓ verschiebt keinen Block. Nichts bewegt sich, auch nicht in den Daten — und das Blockmenü schreibt das Kürzel daneben.

**Die falsche Vermutung.** Die neue Sprungregel über unsichtbare Nachbarn ist falsch gebaut; oder der Prüflauf schickt die Taste am falschen Element.

**Wie es gefunden wurde.** Eine Sonde zeigte, dass `Register.seitenansichten.zeigtIn` da war, der Fokus im richtigen `.ct` stand, der versteckte Block korrekt als unsichtbar galt — und `content` der Seite trotzdem unverändert blieb. Also lief `verschiebe` gar nicht.

**Die Ursache.** Im selben Tastenbehandler steht zwölf Zeilen höher die Pfeilnavigation zwischen Blöcken: `if (e.key === 'ArrowUp' && amAnfang(ct)) { … return; }` und dasselbe für `ArrowDown` am Ende. Beide prüfen die Modifikatoren NICHT und kehren mit `return` um. In einem einzeiligen Block ist der Cursor fast immer am Anfang UND am Ende — das Verschieben war damit praktisch nie erreichbar.

**Der Beweis.** `test574 §11` in einer Liste ganz ohne versteckte Blöcke: ["X","Y","Z"] vor und nach `Control+Shift+ArrowDown`. Mit der Bedingung `!(e.ctrlKey || e.metaKey)` an den zwei Navigationszweigen: ["Y","X","Z"].

**Die Lehre.** Zwei Zweige für dieselbe Taste in einer Datei sind eine Reihenfolge, keine Alternative — wer den zweiten schreibt, muss den ersten lesen (§45). Und: ein Kürzel, das in einem Menü steht, gehört bewacht; sonst ist die Beschriftung eine Behauptung (§32). Gefunden hat es ein Prüflauf, der etwas ganz anderes messen wollte.


---

## P117 · Eine Kennung, zwei Bedeutungen: `ellipse`

*2026-09-26 · 🟡 klein*

**Das Bild.** Der neue Wächter über die Namen im Menüband war rot mit genau einer Kennung: `ellipse`. Die zwölf anderen stimmten.

**Die falsche Vermutung.** Das Menüband zeigt einen falschen Namen — der Wächter hat einen echten Anzeigefehler gefunden.

**Wie es gefunden wurde.** `test572 §12` vergleicht jeden Namen im Reiter „Zeichnen" mit dem Katalog. Er suchte mit `reg(id) ?? form(id)` — erst im Werkzeugregister, sonst bei den Studio-Formen.

**Die Ursache.** Die Kennung gibt es ZWEIMAL. `Register.werkzeuge` führt das Flächenwerkzeug `ellipse` (Zeichen `◯`, deutscher Kennungsraum neben `linie`, `pfeil`, `rechteck`); `Marken.FORMEN` führt die Studio-Form `ellipse` (Zeichen `○`, englischer Raum neben `line`, `arrow`, `rectangle`). Drei Paare trennt die Sprache, das vierte nicht — also antwortete das Register zuerst, mit dem falschen Zeichen.

**Der Beweis.** `reg('ellipse').zeichen` = `◯`, `form('ellipse').zeichen` = `○`. Das Band zeigte `○` und hatte recht; rot war der Wächter.

**Die Lehre.** Ein Kennungsraum endet nicht an der Sprache, in der er gedacht ist. Wo zwei Kataloge nebeneinander liegen, muss die HERKUNFT dabeistehen — geraten wird sie genau so lange richtig, bis zwei Wörter gleich geschrieben werden. Seither sagt im Menüband jede Zeile, aus welchem Katalog sie kommt, und der Wächter fragt beide statt des ersten, der antwortet.


---

## P118 · Hell und dunkel lieferten Ziffer für Ziffer dieselben Kontraste

*2026-09-27 · 🟡 klein*

**Das Bild.** Der Glas-Wächter mass die stille Schrift im Menü hell mit 1,43 : 1 und dunkel mit 1,43 : 1, die Hauptschrift hell mit 6,05 — eben noch 7,05.

**Die falsche Vermutung.** Die Messung über das ganze Menü sei zu grob, oder beide Modi hätten zufällig dieselben Werte.

**Wie es gefunden wurde.** Die Gleichheit selbst war der Hinweis: zwei Farbsätze, die Ziffer für Ziffer dasselbe ergeben, sind ein Satz.

**Die Ursache.** Der Lauf setzte `data-theme` von Hand. `Aussehen` setzt das Attribut kurz danach auf das gespeicherte Schema zurück (`aussehen.ts:113`) — gemessen wurde beide Male dunkel. Ob das Rücksetzen vor oder nach der Messung kam, hing am Zeitpunkt; im ersten Lauf war hell noch hell.

**Der Beweis.** Mit `App.theme(t)` statt des Attributs: hell 7,05 / dunkel 6,05 für die Hauptschrift, verschiedene Werte für die stille Schrift. Und der Lauf prüft seither, dass das gewünschte Thema wirklich gilt.

**Die Lehre.** Einen Zustand der App über den Weg der App setzen, nicht über das Attribut, das er am Ende hinterlässt. Und zwei Messungen, die exakt gleich ausfallen, sind ein Befund über die Messung, bevor sie einer über das Produkt sind.


---

## P119 · Ein Umschalter oben, und unten fällt ein Griff aus dem Fenster

*2026-09-27 · 🟠 mittel*

**Das Bild.** `test534` war seit einem Tag rot: die Studioleiste stand bei y = −103, liess sich nicht mehr «frei» ziehen und ragte nach dem Verkleinern hinaus.

**Die falsche Vermutung.** Der Glasumbau (E695) hat die Leiste verschoben — er lief ja gerade, und `test534` war sein Nachbar.

**Wie es gefunden wurde.** Gegen die ALTEN Stilblätter dieselben vier Zeilen — also nicht E695. Dann fünf Arbeitsbäume: grün bei 43432e1, rot ab 4d7436d, E690, meinem eigenen Bogen vom Vortag. Und eine Sonde, die beim Klick auf den Griff zeigte, dass die Seite um 465 px rollte (vorher 0).

**Die Ursache.** Die Spalte war `78vh` hoch, egal wo sie beginnt, und ragte schon vor E690 123 px unter den Fensterrand. E690 setzte 74 px Umschalter darüber — damit fiel auch der Griff (64. von 68 Knöpfen, tief in der rollenden Spalte) hinunter, und jeder Klick darauf rollte die Seite. E690s Nachbarliste enthielt nur Läufe, die das Neue kannten, keinen, der etwas UNTER ihm misst.

**Der Beweis.** Mit `--reihe-platz` (Raum unter der Hülle bis 12 px vor dem Rand): Spalte 409 … 949, kein Seitenrollen, 52 von 52. Ohne die Regel: 46 von 52, genau die alten Zeilen.

**Die Lehre.** Wer oben etwas einfügt, verschiebt alles darunter — die Nachbarn eines solchen Bogens sind die Läufe, die UNTER der Einfügung messen, nicht die, die sie kennen. Und ein Wächter, der nur „oben im Fenster" fragt, sieht nicht, dass unten etwas hinausragt; die Regel war „endet im Fenster".


---

## P120 · Zwei Zweige, dieselben Nummern: E681 und test568 gab es zweimal

*2026-09-27 · 🟠 mittel*

**Das Bild.** GitHub sperrte den Pull Request: „This branch has conflicts that must be resolved", neun Dateien. Redur fragte, warum er nicht pushen kann.

**Die falsche Vermutung.** Das Hochladen ist kaputt — oder die Konflikte sind nur die üblichen Versionsstempel in sw.ts und stand.ts.

**Wie es gefunden wurde.** Unter den neun Dateien stand `pruefungen/lauf/test568.mts` als „beide hinzugefügt". Der Codex-Commit 9e306b85 auf `main` (23. September) hatte einen test568 und eine E681 angelegt; der Arbeitszweig hatte am 25. September einen ANDEREN test568 (Strg+Z) und eine ANDERE E681 (Plattform-Audit).

**Die Ursache.** Beide Zweige zählten von demselben Stand aus weiter: `main` lag bei E680/test567, und jeder nahm die nächste freie Nummer — für sich. Eine Nummer ist aber erst vergeben, wenn sie auf `main` steht.

**Der Beweis.** `git show 9e306b85 --stat` gegen `git log` des Zweigs; `git status` zeigte `AA pruefungen/lauf/test568.mts`.

**Die Lehre.** Wer auf zwei Zweigen zugleich zählt, zählt doppelt. Beim Zusammenführen bekommt der NEUANKÖMMLING mit den wenigsten Verweisen die nächste freie Nummer (hier: eine Entscheidung und ein Lauf statt sechzehn und neun), und die alte Nummer steht als Herkunft dabei. Und gepusht war die ganze Zeit alles — gesperrt war das Zusammenführen.


---

## P121 · Git schneidet einen Eintrag mitten durch

*2026-10-05 · 🟠 mittel*

**Das Bild.** Beim Zusammenführen von claude/rot-zuerst-stift (E708) nach E714 und E715 hatte ENTSCHEIDUNGEN.md Konflikte. Wer je Konfliktblock beide Seiten behält, bekommt einen zerschnittenen Eintrag: die ersten zwölf Zeilen von E708 standen vor E714, der Rest hinter E715.

**Die falsche Vermutung.** „Beide Seiten je Konfliktblock behalten“ reicht für Doku — beide Seiten gehören ja hinein.

**Wie es gefunden wurde.** Beim Ansehen der Überschriften nach dem Lösen: „## E708“ mit zwölf Zeilen, dann „## E714“, „## E715“, und danach der Rest von E708 in einem Konfliktblock.

**Die Ursache.** Git richtet die Blöcke nach Zeilen aus, nicht nach Einträgen. Die drei Fassungen teilen Trennzeilen, und an diesen gemeinsamen Zeilen hat Git den neuen Text von E708 auf zwei Konfliktblöcke verteilt.

**Die Lösung.** Die Doku nach EINTRÄGEN zusammengeführt: jeder Eintrag für sich dreiseitig, neue Einträge in Nummernfolge eingesetzt (Index E706, E708, E714, E715).

**Der Beweis.** Die Zeilen nachgezählt: das Ergebnis hat gegen jede Seite genau die Zeilen mehr, die die andere Seite gegen die Basis dazubrachte — in ENTSCHEIDUNGEN 483 und 338, dazu die eine Kopfzeile. Die Zahlen für die übrigen Dateien stehen im Commit 57c1018a.

**Die Lehre.** Doku mit Einträgen wird nach Einträgen zusammengeführt, und nachgezählt. Ein Konfliktblock ist eine Zeilengrenze, keine Eintragsgrenze.


---

## P122 · Zwei Seiten schreiben dieselbe falsche Zahl, und Git nennt es keinen Konflikt

*2026-10-05 · 🟠 mittel*

**Das Bild.** Nach dem Zusammenführen 4 (claude/loeschen-fluessig, E709) stand in LUECKEN.md die Selbstzählung „126 Lücken, 70 offene“ — ohne Konflikt. Und in CLAUDE.md nannten sich alle fünf Läufe der zweiten Welle „Und 528“.

**Die falsche Vermutung.** Was ohne Konflikt hereinkommt, stimmt — sonst hätte Git sich gemeldet.

**Wie es gefunden wurde.** Neu gezählt mit der eigenen Messung von test549, statt die Zeile zu übernehmen: 127 Lücken, 71 offene.

**Die Ursache.** claude/rot-zuerst-stift und claude/loeschen-fluessig hatten die Zeile beide von „125 Lücken, 69 offene“ auf „126 Lücken, 70 offene“ geändert. Gleiche Änderung auf beiden Seiten ist für Git kein Konflikt; sie wird einmal genommen. Aber jede Seite hatte eine Lücke dazugebracht — zusammen sind es zwei. Ebenso hatte jeder Zweig seinen Lauf als den nächsten nach 527 gezählt.

**Die Lösung.** Die Zähler nach jedem Zusammenführen neu gezählt, nie von einer Seite übernommen; die „Und“-Absätze in der Folge der Testnummern neu gezählt.

**Der Beweis.** Die Messung von test549 sagt 127 Lücken und 71 offene; die Zeile, die Git ohne Konflikt genommen hatte, sagte 126 und 70.

**Die Lehre.** Zähler werden nach jedem Zusammenführen neu gezählt, nie übernommen — gerade wenn kein Konflikt kommt. Zwei Seiten, die dieselbe Zahl schreiben, haben jede für sich richtig gezählt und zusammen falsch.


---

## P123 · Drei Zweige, ein Escape-Griff

*2026-10-05 · 🟠 mittel*

**Das Bild.** E710, E711 und E713 hatten je den EINEN Escape-Griff in schale.ts erweitert. Naiv zusammengeführt nahm ein Escape die Suche UND den Zeitmesser; und mit der Fokusregel aus E713 war test587 §7 rot (96 von 97, „Escape schliesst es — über den gemeinsamen Griff“).

**Die falsche Vermutung.** Wenn jede der drei Erweiterungen die Wächter ihres Zweigs grün hält, hält es auch die Summe.

**Wie es gefunden wurde.** Mit einer Sonde (Zeitmesser offen, Strg P, ein Escape): ohne `!warOffen` am losen Feld gab sie {"vor":{"zm":true,"ov":1},"nach":{"zm":false,"ov":0}} — zwei Fenster auf einen Druck. Und mit test587 nach dem Zusammenführen 8: der Fokus stand nach einer Frage auf einem Knopf der Seite, und mit der Regel aus E713 blieb das Feld offen.

**Die Ursache.** Jeder Zweig hatte den Griff für sich erweitert: E710 nahm den Zeitmesser über `data-esc-schliesst` weg; E711 merkte sich mit `warOffen`, ob beim Druck schon ein Fenster offen war — ein Druck, ein Fenster — und räumte die Meldungen über `Hinweis.escape`; E713 setzte `data-esc-knopf` an das ✕ und drückte es nur mit dem Fokus im Feld oder nirgends. Jede Regel war auf ihrem Zweig richtig; zusammen widersprachen sie sich.

**Die Lösung.** Es gilt nur noch das ✕ (E713); `warOffen` (E711) gilt auch für das Feld; und das Feld geht zu, ausser der Fokus steht in einem Eingabefeld oder bearbeitbaren Block ausserhalb des Feldes.

**Der Beweis.** Die Sonde mit der Zeile: {"vor":{"zm":true,"ov":1},"nach":{"zm":true,"ov":0}}, erst das zweite Escape schliesst den Zeitmesser; die Gegenprobe ohne `!warOffen` rot. Fokus im Text → das Feld bleibt offen, Fokus auf einem Knopf → es geht zu; die Gegenprobe ohne die Text-Bedingung rot. Danach test296 17/17, test587 97/97, test588 72/72, test590 68/68.

**Die Lehre.** Wer drei Zweige an EINEM Griff zusammenführt, prüft jede ihrer Zusagen gegen die anderen — die Wächter jedes Zweigs zusammen, nicht nacheinander.


---

## P124 · Drei Klebefilter für eine Bewegung

*2026-10-05 · 🟡 klein*

**Das Bild.** In derselben Woche hatten drei Zweige je einen eigenen Klebefilter (Unschärfe, dann steile Alpha) gebaut: E709 `#ru-loesch-goo` (×18 − 7, Unschärfe 4), E711 `#ru-goo` (×18 − 7, Unschärfe 8), E712 `Linse.TROPFEN` (×22 − 10, Unschärfe 7). Jeder Zweig hatte einen Wächter, der „EIN Filter“ sagte, und jeder war grün.

**Die falsche Vermutung.** „EIN Filter“ in jedem Zweig heisst EIN Filter in der App.

**Wie es gefunden wurde.** Beim Zusammenführen; die Auftragsdatei verlangte einen („Nur ein Goo-Filter …“).

**Die Ursache.** Die drei Zweige wurden nebeneinander gebaut, getrennt, alle vom selben Stand b3cf1933 aus, und sahen einander nicht. Jeder Wächter zählte die Filter in der App seines eigenen Zweigs.

**Die Lösung.** Alle drei leihen `Linse.tropfenLeihen()`: der Filter kommt mit der ersten Leihe und geht mit der letzten.

**Der Beweis.** test589 §15 zählt EINE Alpha-Schwelle im Quelltext (in linse.ts), kein Stilblatt mit eigenem Klebefilter, und dass delete.ts, selection-flow.ts und tropfen.ts leihen. Zuerst rot eingecheckt (14ab08ad, die Schwelle in drei Dateien), dann grün (3945ebfe); die Gegenprobe wieder rot.

**Die Lehre.** „EIN Filter“ je Zweig heisst nicht EIN Filter in der App. Ein Wächter, der nur den eigenen Zweig sieht, kann das nicht finden.


---

## P125 · Eine Seite nehmen verliert die Zeile der anderen

*2026-10-11 · 🟠 mittel*

**Das Bild.** Zweimal beim Zusammenführen auf morgen-besser-3: (1) in src/dienst/sw.ts fehlte nach dem Nehmen der Seite mit der höheren Fassung die GRUNDSTOCK-Zeile für `register/aktionen.js` (E721) — offline hätte das Register gefehlt; (2) in CLAUDE.md §8 fehlte die Zeile für `register/ki.js` (E724), weil das Werkzeug bei allem, was kein „Und“-Absatz ist, unsere Seite nahm.

**Die falsche Vermutung.** sw.ts und stand.ts sind Erzeugtes — die Seite mit der höheren Fassung zu nehmen genügt, der Bau rechnet den Rest neu.

**Wie es gefunden wurde.** verlust.py, ein kleines Werkzeug, das nach jedem Zusammenführen jede hinzugekommene Zeile beider Seiten im Ergebnis sucht.

**Die Ursache.** sw.ts ist nur zur Hälfte erzeugt: VERSION und INHALT schreibt der Dienststand, die GRUNDSTOCK-Liste schreibt ein Mensch. Wer die ganze Datei von einer Seite nimmt, verliert die Hand der anderen. Dasselbe gilt für jede Tabelle in einer Doku, die ein Werkzeug „nach unserer Seite“ auflöst.

**Die Lösung.** swmerge.py mischt sw.ts und stand.ts dreiweg und nimmt nur die Stempel von der höheren Fassung; die Zeile in CLAUDE.md von Hand zurück. Zusammenführen 2–4 nachgeprüft: dort fehlte nichts.

**Der Beweis.** verlust.py meldet nach jedem der zehn Zusammenführen nur noch erwartete Zeilen (alte Stempel, alte Zählersätze); `register/aktionen.js` steht im GRUNDSTOCK und test400/test105 sind grün.

**Die Lehre.** „Erzeugt“ heisst nicht „ganz erzeugt“. Vor dem Nehmen einer Seite fragen, welche Zeilen ein Mensch geschrieben hat.


---

## P126 · Der „Und“-Block mit Doppeln und einem abgeschnittenen Satz

*2026-10-11 · 🟡 klein*

**Das Bild.** Im Block der „Und N“-Absätze von CLAUDE.md §30 standen test594, test595, test596 und test597 je zweimal (eine alte und eine neue Fassung nebeneinander), zweimal „Und 533“, und der Absatz zu test592 endete mit „auf seinem Zweig; beim“.

**Die falsche Vermutung.** test550 ist grün, also stimmt die Doku.

**Wie es gefunden wurde.** Beim Lesen von verlust.py beim neunten Zusammenführen: eine Zeile „Zusammenführen neu zu zählen.*“ fehlte, und die Suche danach zeigte die Doppel.

**Die Ursache.** Zwei Werkzeugfehler hintereinander. docmerge.py schlüsselt die Absätze nach ihrer Nummer N — dieselbe Fassung mit zwei Nummern (vor und nach dem Nachzählen) sind für es zwei Einträge. Und claude_und3.py beendete einen Absatz am ersten „*“ vor einer Leerzeile, auch wenn der eigentliche Absatz später endete.

**Die Lösung.** und_neu.py baut den Block aus den Zweigen: je Prüflauf genau ein Absatz, aus dem Zweig, der ihn angelegt hat, nach Testnummer, fortlaufend ab 528.

**Der Beweis.** Nach dem Neubau: 17 Absätze für 17 Läufe (test586–test603 ohne test591), jeder einmal, jeder endet mit „*“; test550 8/8.

**Die Lehre.** Absätze, die eine Nummer tragen, nach dem schlüsseln, was sie beschreiben (der Lauf), nicht nach der Nummer, die sich beim Zusammenführen ändert. Und ein grüner Zähler sagt nichts über den Text daneben.


---

## P127 · Eine rohe 46px, die test362 rot machte, und niemand fuhr test362

*2026-10-11 · 🟡 klein*

**Das Bild.** test362 §7 rot: „46“: 15 gegen die Decke 14. Die neue Regel `.blatt-platz-leiste{height:var(--platz-oben, 46px)}` aus E717 (claude/seiteneditor-ohne-stau).

**Die falsche Vermutung.** Ein Konflikt in pruefungen/marken-decke.json betrifft nur „16“ — die beiden Seiten hatten je eine 16px entfernt.

**Wie es gefunden wurde.** Beim achten Zusammenführen: der Konflikt in marken-decke.json zwang, test362 zu fahren, und der zeigte die zweite Abweichung.

**Die Ursache.** test362 stand nicht unter den Wächtern von E717 — der Zweig änderte bausteine.css, aber niemand fragte, welche Wächter Stilblätter zählen. Rot seit dem zweiten Zusammenführen, und die Datei-Wächter nach jedem Zusammenführen enthalten test362 nicht.

**Die Lösung.** `calc(var(--touch-min) + 2px)` statt der rohen Zahl — dieselbe Höhe, die Decke nicht angehoben (7f7eb14).

**Der Beweis.** test362 18/18 (vorher 17/18), test593 54/54.

**Die Lehre.** Wer ein Stilblatt ändert, fährt die Wächter, die Stilblätter zählen (test362, test401, test402, test332) — nicht nur die, die zur Funktion gehören.


---

## P128 · Eine geänderte Vorgabe, und ein Lauf, der in keiner Anpassungsliste stand

*2026-10-11 · 🟡 klein*

**Das Bild.** test469 rot auf morgen-besser-3: die Schalensuche fand nur das Skript („1 Treffer“), die Mitschrift fehlte. Auf morgen-besser-2 26/26.

**Die falsche Vermutung.** Die Suche über die Dokumente (E500) ist beim Umbau der Suche verlorengegangen.

**Wie es gefunden wurde.** Im Vereinigungslauf; danach auf claude/bibliothek-eine-suche allein nachgefahren — dort ebenso rot.

**Die Ursache.** E725 lässt die EINE Suche in einem offenen Dokument mit der gemerkten Wahl beginnen, ohne Wahl „Dieses Dokument“ (Vorgabe g). test469 öffnet ein Dokument und ruft `App.suche()`. E725 hatte neun Läufe auf die Bereiche gezogen (e510fd7); test469 stand nicht darunter, weil er nicht unter den Nachbarn des Zweigs war.

**Die Lösung.** test469 wählt `App.suche(undefined, { bereich: 'ueberall' })` — der Weg, den E500 hält, unverändert.

**Der Beweis.** test469 26/26; Gegenprobe `bereich: 'dokument'` wieder rot, zurückgenommen (3d83818).

**Die Lehre.** Wer eine Vorgabe ändert, sucht die Läufe nach dem Aufruf (`App.suche(`), nicht nach dem Namen der Funktion im Kopf.


---

## P129 · Zwei Namen, je an zwei Stellen

*2026-10-11 · 🟡 klein*

**Das Bild.** test422 rot: sieben „rohe Ereignisnamen“ in lernwelt.ts (`einmal('queue', …)` …). test274 rot mit einer neuen verwaisten Nachschlagestelle: `studio.ts: kante`.

**Die falsche Vermutung.** Beide Wächter sind zu grob — sie lesen Text und wissen nicht, was gemeint ist.

**Wie es gefunden wurde.** Im Vereinigungslauf; test274 erst im Vergleich mit morgen-besser-2 (dort derselbe Lauf rot, aber nur mit `redion-graphit`).

**Die Ursache.** Die Wächter hatten recht, nur anders als gedacht. E719 nannte einen eigenen Merker `einmal` — wie den Bus; E716 schrieb die Kennung `kante` ein zweites Mal ab, statt die Kontextkante zu fragen, die sie baut.

**Die Lösung.** Der Merker heisst `gemerkt` (058e5db); Kontextkante gibt ihre Wurzel heraus, und den Namen `kante` kennt nur sie (b2367bc). Kein ERLAUBT, keine weichere Regel.

**Der Beweis.** test422 14/14; test274 nur noch mit seinem alten Fund; test592 61/61, test595 44/44, test596 51/51.

**Die Lehre.** Wenn ein Textwächter „falsch“ anschlägt, zuerst fragen, ob der Name nicht wirklich zweimal da ist.

