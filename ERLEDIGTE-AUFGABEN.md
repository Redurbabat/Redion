# ERLEDIGTE-AUFGABEN.md

## 13. Oktober 2026 · E749 · Die Zielleiste am Telefon (Bogen 2): hinaufziehen, gleiten, loslassen

**Redur**, 12. Oktober 2026: „… ich sollte direk mit hand ohne klick direk
wächseln können es sollte flüssig sein mit appel efeck usw aber zuers nur
bei handy …" — Antworten 1 und 4: die Empfehlung. Und seine Korrektur vom
13. Oktober, 01:08 UTC: „die neu dock nur wenn ich mit hand nach oven so zi
eht kommt das doet aber beim klicken nicht" — nur Hochziehen öffnet; kein
Tipp, kein Halten.

**Vorher gemessen** (Grundstand `352eed65c`): senkrechtes Ziehen auf der
Leiste rollte nichts und brach nach zwei Zügen mit `pointercancel` ab;
Chromium klickt nach einer Berührung bis 15 px Weg; Halten ist beim
Loslassen ein Klick, ein `contextmenu` kommt in der kopflosen Schale nie.

**Gebaut:**

- `SelectionFlow.ziehbar` mit der freiwilligen Übergabe `hinauf`: über der
  Oberkante (nach 10 px) oder aus einem Pillenzug übernimmt die
  Zielleiste; unter der Kante bleibt es GENAU EIN Klick, hinab wie zuvor.
- `src/schale/aufbau/tab-shelf.ts` (`TabShelf`): `#ho-ziele` neben der
  Leiste, Menü mit fünf Zielen aus `Register.navigation.ziele`, gleiten
  mit Marke und Lupe, zwischen Reitern tauscht der Inhalt, Loslassen wählt
  einmal; Tastatur über Pfeil hinauf; ohne Bewegung ohne Animation.
- `schale.ts`: die fünf Reiter EINE Tabelle (`REITER_UNTEN`, `wechsle`) —
  für die Klicks und für jedes Ort-Ziel.
- CSS in `bausteine.css`, `studio.css`, `grund.css` (Glas im Block der
  Leiste, deckend ohne Glas, `z-index:955`, `touch-action:none`);
  `index.html` und der GRUNDSTOCK; `ho-` im Verzeichnis der Namensräume;
  die Karte nachgezogen.

**Beim Bauen gefunden:** das BILD — mit `data-gehalten` stand „Dokumente"
unter der brechenden Pille doppelt da (jetzt `data-zielleiste`, `test614`
§11e); ein Pillenzug liess `data-gehalten` nach der Übergabe stehen;
„Meine Ablage" passte fett um Bruchteile nicht; und das erste Öffnen
kostete vier Stilrechnungen der ganzen Seite (21,5 ms, 4×: 130 ms), weil
jedes `hidden` die `body:has(…)`-Regeln weckt — jetzt eine (9,9 ms, 4×:
63 ms).

**Geprüft:** `test614` neu (106 Zusagen; gegen `352eed65c` rot mit 29 von
105), fünf Gegenproben rot; Nachbarn und Datei-Wächter in E749. Bilder
hell und dunkel im Kratzordner `bilder-ziel/handy/`.

**Offen:** L257 — der Rechner (Phase 2), das echte Telefon, die gekürzten
Namen unter 390 px.

---

## 13. Oktober 2026 · E748 · Die Ziele der unteren Reiter aus einer Quelle (Zielleiste, Bogen 1) — und L147

**Redur**, 12. Oktober 2026, zum Bild mit dem roten Feld über der unteren
Leiste: „… eine neu dock dort kommen und dort nur sachen die mit unteren
zutun haben dann für alle so …". Auf die vier Fragen des Entwurfs hat er
jedes Mal die Empfehlung gewählt; Frage 2 legt die fünf Ziele je Reiter
fest, Frage 3 richtet L147 („Prüfungen, Noten, Stundenplan und Schule
schalten unten künftig ‚Heute' an").

**Gefunden** (auf `ba51915dc`, Telefon 390 × 844): sechs Ansichten unter
„Heute ^" liessen unten „Lernen" leuchten — oben „Noten ^", unten „Lernen"
auf demselben Bildschirm; drinnen gewechselt blieben Reiter und Adresse
stehen, ein Neuladen führte in die Übersicht zurück. Und die Listen der 25
Ziele gab es alle schon, privat und mit keinem Reiter verbunden.

**Gebaut**, ohne neue Oberfläche:

- `Register.navigation.meldeZiele`/`ziele` mit dem Typ `Ziel`, nach dem
  Muster von `Register.kontext` (jedes Mal neu gefragt, einzeln
  abgefangen, nach Rang, höchstens fünf); Schlüssel `data-ziele` an den
  fünf Reitern in `index.html`.
- Drei Lieferanten, jeder in seinem Modul und aus seiner Liste: Bibliothek
  (`ORTE` mit `zielRang`/`kurz`, `ortOeffnen`; die Notizhefte aus
  `app-notizhefte`), Lernwelt (`KLAPPEN` + `ANSICHTEN.zielRang`/`kurz`),
  Ansichten (`TERMINE_KARTEN`, aus denen der Bildschirm jetzt zeichnet, die
  Kante „kalender", `mehrGruppen.zielRang`; `termineTun`/`mehrTun` für
  Bildschirm und Ziel).
- L147: `titelVon`/`reiterVon` nach der Klappe, `Produktwelten.lernen`
  fragt `Lernwelt.reiterVon`; drinnen zuerst die Adresse über
  `Produktwelten.routeSchreiben`, dann der Titel über `App.sonderTitel`
  (neu: nur der Titel, und der Zeichner, den sich der Verlauf merkt).
- Der Kommentar an `haupt` in `navigation.ts` berichtigt; die Karte
  (`doku/karte/register.md`) nachgezogen.

**Beim Fertigstellen gefunden**, beide mit einer Sonde und nicht vom Lauf:
am Rechner leuchtete nach „Übersicht → ‚Heute ^' → Noten" in der Kante
weiter „Lernzentrum", nach direkt geöffneten Noten „Mehr Orte" — der Titel
wurde vor der Adresse gemeldet; und wer danach weg- und mit „Zurück"
wiederkam, sah die Übersicht unter „Heute" und `#welt-lernen-noten` — der
Verlauf hatte sich den Zeichner vom Öffnen gemerkt. Jeweils erst die
Zusage (`test613` §7g rot mit 95 von 96, §7i/§7j rot mit 96 von 98), dann
die Reparatur.

**Geprüft:** `test613` neu, 98 von 98 (gegen `ba51915dc` rot mit 12 von 68,
die Endfassung 13 von 73); fünf Gegenproben rot (82/93, 88/98, 89/98, 97/98, 96/98). Geändert genau eine bestehende Zusage: `test484` §5, die die alte
Titelzeile wörtlich suchte. 90 Nachbarn unter dem gemeinsamen Schloss, 88 grün; rot nur `test274` und `test493`, beide genau so auf `ba51915dc`; die Datei-Wächter grün; der Start 1926 KB von 1950. Bilder vorher/nachher am Telefon
(hell, dunkel) und am Rechner (direkt geöffnet, drinnen gewechselt, weg und
zurück).

**Nach der Durchsicht** (13. Oktober): `test613` erkennt jeden Dialog an
seinem Kopf statt an der Zahl offener Dialoge — die Gegenprobe der
Durchsicht („Wolke" öffnet die Einstellungen, dazu Besprechung/Verbinden
über Kreuz und der Tagesplan als Wochenrückblick) war gegen die alte
Fassung 98 von 98 grün, gegen die neue 90 von 99 rot. Die drei
Termine-Karten tragen jetzt ihr `zeigen` (`termineWeg`: fehlt `Meeting`,
fehlt die Besprechung) — zuerst rot (`test613` §8g, 98 von 99), dann
gebaut, Gegenprobe ohne die Zeile wieder rot. „Aus dem DOM" in E748 und
CLAUDE.md berichtigt (Notizhefte, Übersicht und Tagesplan kommen aus
`Register.kontext`), die Kopfzeile von ENTSCHEIDUNGEN.md nennt nur noch
E749 als vergeben, und die Frage zu „Mehr Orte" am Rechner steht jetzt auch
in `AUFGABEN.md`. `test613` 99 von 99, `test537` unverändert,
`ansichten/dienst.js` +78 B gzip, Start 1926 KB von 1950; 24 Nachbarn
unter dem Schloss grün, die Datei-Wächter grün.

**Nach der zweiten Durchsicht** (13. Oktober): L147 war nur zur Hälfte
zu. `wechseln()` stellte den Reiter nicht um — auf dem Lernzentrum fiel
das nicht auf (dort entscheidet der Schauplatz), aber wer danach eine
Seite öffnete, sah die Pille zurückspringen: „Lernen → Heute ^ → Noten →
Seite" unter „Lernen", „Heute → Übersicht ^ → Trainer → Seite" unter
„Heute". Zuerst die Zusagen (`test613` §7k–§7m, gegen `7e41a4b4a` rot mit
100 von 102), dann `Produktwelten.lernReiter` — die Regel „Reiter nach der
Klappe" an einer Stelle, gerufen beim Öffnen und, wenn die Klappe
wechselt, aus `wechseln()`. `test613` 102 von 102; drei Gegenproben rot
(100/102, 100/102, 90/102 — die letzte ist Gegenprobe 2, nachgefahren, und
ihre Zeilen stehen jetzt in LUECKEN.md und E748 gleich). Die Karte
nachgezogen (alle Verweise auf `navigation.ts` hinter der eingefügten
Stelle, `register.md` neu erzeugt). Bilder vorher/nachher am Telefon, hell
und dunkel. 47 Nachbarn unter dem Schloss, 45 grün; rot `test493` wie
auf `ba51915dc` und `test567` einmal (eine Zählung über zufällig gezogene
Karten, dreimal wiederholt grün). Datei-Wächter grün, Start 1927 KB von
1950.

**Offen:** ob am Rechner für die sechs Ansichten unter „Heute ^" „Mehr
Orte" leuchten soll (so wie bei „Heute" selbst) — Redurs Frage, L123 F02,
jetzt auch in `AUFGABEN.md` beim Rest von F02. Und ein Nachbarfall am
Telefon, gemessen, nicht L147: nach „Zurück" ins Lernzentrum leuchtet auf
einer danach geöffneten Seite „Dokumente", wenn man über „Dokumente"
weggegangen war (`AUFGABEN.md`, gleiche Stelle). Die Zielleiste selbst ist
Bogen 2.

## 12. Oktober 2026 · Redurs vier Antworten — zusammengeführt auf `claude/abend-antworten`

**Der Auftrag.** Redur am 11. Oktober um 19:43 UTC: „1. verblassen / 2 .
Scnell lauf / 3.ja / 4. wie du willst". Die dritte Antwort ist E743 (`main`
vorgespult, schon auf `main`); die anderen drei wurden vier Zweige:

```txt
1  die leere Linse verblasst nach der Fahrt          E744   claude/linse-verblasst
2  die CI fährt nur den schnellen Lauf               E745   claude/ci-schnell        test610
4  Elektro L253 Punkt 4: Drehen zapft nichts an      E746   claude/elektro-drehen-ohne-anzapfen   test611
4  Elektro L253 Punkt 2: Brücken sind Verbindungen   E747   claude/elektro-klemmenbrett-bruecken  test612
```

Die Reihenfolge der Elektro-Punkte hatte Redur freigegeben; gewählt nach
§46: zuerst, was die Bedeutung eines Plans still ändert (Punkt 4), dann
eine falsche Meldung (Punkt 2). Punkt 3 (Messwerte am Telefon) und Punkt 1
(der Pfeil im Symbol) bleiben in L253.

**Wie geprüft.** Jeder Zweig mit dem Wächter zuerst rot, dann vier Runden
Durchsicht mit je einem frischen Skeptiker und eigener Gegenprobe, bis keine
Runde mehr einen schweren Fund brachte. Die schwersten Funde: eine Taste
mitten in einem Maus-Zug speicherte ein angezapftes Zwischenbild, und die
Ablage hielt einen Verweis auf den Plan (P134); der Wächter dafür schickte
seine Tasten selbst an die Fläche und sah nicht, dass mit echter Eingabe
Escape nie ankam (P135); und `--schnell` war fast so lang wie der volle
Lauf (P136).

**Zusammengeführt** von `main` 97d156b aus, vier Schritte, Konflikte nur in
Doku, Zählern und Erzeugtem (726 Entscheidungen, E1 bis E747; 553 Läufe;
151 Lücken, 93 offen). Danach 27 Browser-Läufe und die Datei-Wächter grün.
Auf GitHub lief der Job „Schneller Lauf" zum ersten Mal zu Ende (4 min 7 s)
— rot nur wegen `test274`, für den Redurs Wort aussteht.

**Neu eingetragen:** L255 (am Telefon „Offner" statt „Öffner"), L256
(lebende Verweise an `Store.updateBlock` an weiteren Stellen, nicht
gemessen).

**Nicht getan:** `main` ist nicht bewegt — E743 galt einmal.

## 11. Oktober 2026 · E747 · Eine Brücke des Klemmenbretts belegt ihre Klemmen (L253 Punkt 2)

**Redur:** „4. wie du willst", am 11. Oktober 2026 um 19:43 UTC, zur
Reihenfolge der Elektro-Punkte aus L253. Punkt 2 kam als zweiter, weil
eine falsche Warnung etwas Falsches lehrt.

**Gefunden** (auf `97d156b03`, Plan des Bildes aus L253): in Stern UND
Dreieck meldete die Fusszeile der Planfläche „M1: Anschluss W2 / U2 / V2
hängt an keiner Leitung" — gerade die Klemmen, auf denen die Brücken der
Stellung liegen. Die Rechnung kannte die Brücken seit E730; die Meldung
offener Klemmen zählte nur Klemmen je Netz der Leitungen. Sieben
Warnungen in jeder Stellung; von drei sichtbaren Plätzen belegten die
falschen zwei.

**Gebaut** (`src/bereiche/elektro/simulation.ts`): für die Meldung zählen
die Brücken der eingestellten Stellung eines mehrteiligen Bauteils wie
gezeichnete Leitungen — die Netze, die sie verbinden, sind ein Knoten.
Schaltkontakte zählen nicht, der Verbund N–PE der Quelle nicht; die
Netzliste bleibt, wie sie ist. EINE Hilfe `stellungIn` liest die Stellung
für Rechnung und Meldung (vorher zweimal dieselbe Klemmung). Im Plan des
Bildes: Stern und Dreieck 7 → 4 Warnungen, ohne Brücken 7 → 7.

**Prüfung:** `test612` zuerst rot eingecheckt (gegen 97d156b03 15/26),
mit E747 26/26; drei Gegenproben, jede wieder heraus: Brücken übergangen
15/26, Kontakte als Brücken 25/26 (§6), Brücken jeder Stellung 22/26.
Nachbarn grün: `test604` 91, `test605` 51, `test606` 17, `test607` 37,
`test608` 69, `test238` 77, `test239` 68, `test240` 100, `test241` 105,
`test242` 42, `test388` 22 (Start 1919 KB, unverändert), `test74` 12/12;
die Datei-Wächter. Bilder vorher/nachher (Rechner und Telefon, dunkel und
hell, Stern, Dreieck, ohne Brücken) angesehen; Zahlen in `messungen.md`
§104.

**Nachtrag nach der Durchsicht, im selben Zweig (E747 Punkt 6):** die
erste Fassung hatte eine richtige Meldung verschluckt. Im Dreieck ohne
Zuleitung an U1 halten U1 und W2 einander über die Brücke, der Motor
läuft auf zwei Aussenleitern (9,96 A), und M1 meldete nichts; ohne jede
Leitung nur PE. Die Regel konnte den Sternpunkt {U2, V2, W2} nicht von
der Ecke {U1, W2} unterscheiden. Jetzt sagt es die Stellung: „Stern"
trägt `sternpunkt: ['U2', 'V2', 'W2']`, und ein Knoten, den nur die
eigenen Brücken halten, wird gemeldet (einmal, mit U1), ausser er ist so
markiert. Dazu ist der Kommentar an `stellungIn` berichtigt: die EINE
Stelle innerhalb von `Stromfluss` — ausserhalb lesen fünf Stellen eine
Stellungsnummer selbst: die Planfläche für ihren Titel (`|| 0` statt
`?? 0`, verschieden nur bei NaN) und in `schalte` (ungeklemmt, nur die
nächste Zahl), die Aufgaben in `besteStellung`, `planLeuchtet` und
`planStromweg` (ihre Zahlen liegen von vornherein in der Liste). Die
Planfläche ruft die Hilfe bewusst nicht auf (§5 Regel 1). Die erste
Berichtigung nannte nur den Titel; die vollständige Liste fand die zweite
Durchsicht (E747 Punkt 5). `test612` zuerst
erweitert und rot eingecheckt (6b1de9eb6, gegen 7560b2f22 33/38), mit dem
Sternpunkt 38/38 (d9b91d74d); gegen 97d156b03 20/38. Drei neue
Gegenproben, jede wieder heraus: die Marke heraus 29/38, die Regel auch
für Knoten ohne Brücke 37/38, jede Klemme der Ecke 34/38; die drei alten
auf dem neuen Stand nachgemessen: 21/38, 37/38, 28/38. Nachbarn grün:
`test604` 91, `test605` 51, `test606` 17, `test607` 37, `test608` 69,
`test238` 77, `test239` 68, `test240` 100, `test241` 105, `test242` 42,
`test388` 22 (Start 1919 KB), `test74` 12/12; die Datei-Wächter. Bilder
nachher (Stern, Dreieck, ohne Brücken, Stern und Dreieck ohne U1;
Rechner und Telefon, dunkel und hell) angesehen. `messungen.md` §104 ist
für drei Stände neu gemessen.

**Offen geblieben** (in L253 bei Punkt 2): gezeichnete Brücken heissen
„überbrückt"; die Quelle meldet ihr freies N auch beim Drehstrommotor
(eine Frage an Redur); im Plan des Bildes meldet der FI „es fehlen
37.52 mA", obwohl die Lampe richtig angeschlossen ist; an G1 steht ohne
Brücken „0 A" neben „317 nW"; und erreicht eine Ecke des Dreiecks eine
fremde Klemme, schweigt die Meldung, auch wenn es die falsche ist.

## 12. Oktober 2026 · E746, dritte Durchsicht · Echte Maus, echte Tasten

**Die dritte Durchsicht** fuhr die Wege der zweiten mit echter Maus und
echter Tastatur und fand, dass §13 seine Tasten nur an die Fläche
GESCHICKT hatte: mit der Maus steht der Fokus im Zug auf der Seite (das
Anfassen zeichnet die Fläche neu, und der Browser setzt den Fokus beim
`mousedown` auf `body`). Escape brach darum weder einen Zug mit Teilen noch
einen Rahmen ab, und Strg+Z, Umschalt+Strg+Z und Strg+Y nahm im Zug der
Seitenverlauf — er baute die Seite neu und verwarf den Zug still (F1 bei
400,60; die Daten blieben heil). „Als Vorlage speichern" und „Als Bild
speichern" nahmen im Zug das Zwischenbild, und E746 Punkt 7 behauptete,
eine Änderung im Zug komme nur aus einem Dialog. Das Nachmessen fand dazu:
nach einem echten Klick auf ein Teil drehte „r" nichts, Umschalt+Strg+Z
(„Z") und Strg+Y nahm auch mit dem Fokus auf der Fläche der Seitenverlauf
(gemessen mit dem zurückgeholten Fokus, Gegenproben 25 und 26), und der
Hinweis eines Beispiels erschien, ohne dass es eingesetzt war.

**Gebaut** (E746 Punkt 7, dritte Durchsicht): ein Zug horcht am Dokument
auf seine Tasten, wie auf das Loslassen — Escape bricht ab (ist ein Menü
offen, schliesst erst das), Rückgängig und Wiederholen tun nichts, weder
an der Fläche noch am Seitenverlauf. Beim Loslassen über der Fläche holt
sie den Fokus zurück, wenn er auf der Seite gelandet ist — ohne Ring
(`data-zeigerfokus`; mit der Tabulatortaste ist er da). Die Wurzel nimmt
Umschalt+Strg+Z mit „Z" und Strg+Y. Vorlage und Bild verweigern im Zug und
sagen es; der Hinweis eines Beispiels kommt nur, wenn es steht. Die Liste,
was im Zug über Knöpfe und Menüs ankommt und still verloren geht, steht
gemessen in E746 und L253 Punkt 9.

**Prüfung:** `test611` §14 (alles mit echter Eingabe), zuerst rot
eingecheckt (7c0fa0ff1): gegen a8533763b 189 von 207; im Endstand 209/209,
gegen a8533763b 191 von 209 (alle 18 in §14). Zwölf Gegenproben, jede rot
und byte-genau zurückgenommen: kein Tastenhorcher am Dokument 191/207 ·
Rückgängig nicht geschluckt 203/207 · Escape ohne Fenster-Prüfung 206/207
· ohne Fokus zurück 203/207 · Wurzel nur „z" 205/207 · ohne Strg+Y 205/207
· Vorlage ohne Sperre 205/207 · Bild ohne Sperre 205/207 · Hinweis immer
206/207 · Ring für jeden `:focus-visible` 208/209 · ohne das Merkmal
208/209 · Merkmal bleibt beim Gehen 208/209. Die Sonde der Durchsicht
nachher: echtes Escape bricht ab, echtes Strg+Z lässt den Zug laufen; ihre
fünf übrigen roten Zusagen sind vorher dieselben (Annahmen der Sonde,
`messungen.md` §103). Nachbarn grün: `test611` (209/209), `test604`–`test608`, `test568` (26/26), `test238`–`test242`, `test254`, `test388`, `test74`; Datei-Wächter
`test550`, `test549`, `test225`, `test105`, `test109`, `test87`,
`test537`, `test400` grün. Start 1924 KB (`test388` §5, Decke 1950).
Bilder (Rechner und Telefon): T1 angeklickt ohne Ring, „r" gedreht, F1 im
Zug, „Erst loslassen — während eines Zugs wird keine Vorlage gespeichert.",
F1 nach Escape wieder am Platz.

**Offen:** L253 Punkt 9 — ob die Fläche sagen soll, dass Knöpfe und Menüs
im Zug nichts getan haben (Redur); Punkt 8 — Strg+Z nach dem Loslassen.

## 12. Oktober 2026 · E746, zweite Durchsicht · Während eines Zugs wird nichts gespeichert

**Die zweite Durchsicht** von E746 fand, dass die billigen Zwischenbilder
eines Zugs doch gespeichert werden konnten: alles, was WÄHREND des Zugs über
`aendere` ging, nahm das Zwischenbild als Stand von vorher. Ihre Sonde (F1
an die Lage aus `test611` §10, die Maus unten, zweimal „h", loslassen,
dreimal Strg+Z): nach dem Loslassen stimmt die Netzliste, das zweite und
dritte Strg+Z bringen {E1:X2 F1:N F1:N2 G2:N} zurück. Das Nachmessen auf
478791f5f fand vier Wege mehr: die Ablage hielt den Plan der Fläche als
dasselbe Objekt (die Schreibpause legte ein Zwischenbild in die
IndexedDB); ein Zug, losgelassen über der Palette, blieb liegen, und die
nächste Handlung speicherte ihn; ein zweiter Finger liess den ersten Zug
liegen; Strg+Z und Umschalt+Strg+Z im Zug legten das Zwischenbild auf den
anderen Stapel. Und `test611` §10 „genau EINE volle Suche" prüfte mit
`slice(-(n+1))` nichts.

**Gebaut** (E746 Punkt 7): `aendere`, `zurueck` und `vorwaerts` tun während
eines Zugs nichts; von den Tasten zählt im Zug nur Escape, und es bricht
den Zug ab (Lagen und Punkte von vorher, nichts gespeichert). Ein Zug
gehört einem Zeiger; er endet, wo auch immer dieser loslässt oder
abbricht (am Dokument gehorcht, nur solange er läuft), und setzt ein
anderer Zeiger auf, endet er dort — mit Teilen immer mit der vollen Suche.
Die Ablage bekommt eine Kopie des Plans. Gewählt ist „Tasten nicht
annehmen" statt „zuerst den Zug beenden": eine Taste beendet keine Geste.

**Prüfung:** `test611` §13 (zwölf Wege, Escape, eine Leitung über der
Palette, eine Seite, die sich im Zug neu zeichnet) und §10 „genau eine
Rechnung nach dem Loslassen, und sie ist voll", zuerst rot eingecheckt
(046d4a8c0): gegen 478791f5f 129 von 159; im Endstand 172/172, gegen
478791f5f 137 von 171 (alle 34 in §13). Elf Gegenproben, jede rot und
byte-genau zurückgenommen (die ersten neun gegen den Stand mit 170
Zusagen): `aendere` wieder im
Zug 152/169 · `zurueck` 168/170 · `vorwaerts` 168/170 · Ablage ohne Kopie
166/170 (die IndexedDB hält das Zwischenbild) · Loslassen nur an der Bühne
168/170 · ohne Aufsetzen am Dokument 168/170 · Escape ohne Abbruch 167/170
· ohne `pointercancel` am Dokument 169/170 · zweimal volle Suche beim
Loslassen 169/170 („[false,false]") · Leitung auch ausserhalb angelegt
171/172 · Fläche ausserhalb des Dokuments speichert 171/172. Die Sonde der
Durchsicht nachher: mit
„h" wie mit „r" alle drei Strg+Z wie vorher.
Nachbarn grün: `test611` (172/172), `test604`–`test608`,
`test238`–`test242`, `test254`, `test388` (Start 1924 KB), `test74`;
Datei-Wächter `test550`, `test549`, `test225`, `test105`, `test109`,
`test87`, `test537`, `test400` grün. Bilder (Rechner und Telefon): F1 im
Zug mit „r" gedrückt (ungedreht) und nach Escape wieder am Platz.

**Offen:** L253 Punkt 9 (neu: Tasten zählen im Zug nicht und sagen es
nicht; „Als Bild speichern" und „Als Vorlage speichern" lesen im Zug das
Bild, wie es dasteht) und Punkt 8 (Strg+Z nach dem Loslassen — vorher geht
es jetzt mit Escape).

## 11. Oktober 2026 · E746, Durchsicht · Ziehen billig, eigene Klemme gemeldet, Heilen gehalten

**Die Durchsicht** von E746 fand drei Dinge. (1) Das Ziehen mit der Maus
rechnete bei JEDER Bewegung die volle Wegsuche; nachgemessen (F1 um
120 × 60 px in 60 Bewegungen, CPU vierfach gedrosselt, drei Läufe): je
Bewegung im Median 23,9 bis 29,4 ms, höchstens 126,8 bis 217,3 ms, 7 bis
12 Bewegungen über 50 ms. (2) Eine Lageänderung konnte die Netzliste
weiterhin still ändern — über die EIGENE Klemme des bewegten Teils: R1
neben der Leitung E1:X2–E2:X1 gedreht, und R1:1 hing an ihr (auf `main`
genauso). (3) Die Ausnahme „heilen" (alte Pläne, L253 Punkt 7) hielt nur
`test608`, nicht `test611`.

**Gebaut:** `Schaltplan.nachziehen` kennt `schnell` (nur alter Weg,
nachgerückte Endstücke, die zwei Winkel). Die Planfläche rechnet beim
Ziehen je Bewegung `schnell`, innerhalb desselben Rasters gar nicht, und
beim Loslassen einmal voll, vom Anfassen aus, VOR `aendere` — gespeichert
wird nur das. `Schaltplan.veraendert(plan, vorher)` vergleicht nach jeder
Lageänderung, was jede Leitung berührt und welche Klemmen
aufeinanderliegen, mit dem Stand von vorher; die Fläche sagt es beim
Namen („Nach dem Drehen: R1:1 berührt jetzt die Leitung E1:X2–E2:X1 — die
Verbindungen haben sich geändert, bitte prüfen."), verhindert die Lage
aber nicht.

**Prüfung:** `test611` um §10–§12 erweitert, zuerst rot eingecheckt
(745fba801): gegen fcb6d35fa 101/110, gegen `main` 61/110; jetzt 110/110.
Sechs Gegenproben, jede rot und byte-genau zurückgenommen (keine volle
Suche beim Loslassen 102/110 · jede Bewegung voll 109/110 · ohne
Raster-Merker 109/110 · Meldung ohne `veraendert` 105/110 · `heilen` aus
108/110 · geheilte Wege ungeprüft 106/110). Nachgemessen: je Bewegung
gedrosselt im Median 2,5 bis 2,8 ms, höchstens 13,2 ms, keine über 50 ms;
das Loslassen 66 bis 132 ms in einem Stück; der ganze Zug 4373 bis
4628 ms (vorher 7383 bis 9061, `main` 6115 bis 6581). Nachbarn grün:
`test604`–`test608`, `test238`–`test242`, `test254`, `test388` (Start
1923 KB), `test74`; Datei-Wächter grün. Bilder (Rechner und Telefon,
hell und dunkel): die Meldung nach dem Drehen von R1, und der Zug am FI —
das Zwischenbild zeigt die billigen Wege (f2 läuft senkrecht bei x = 480
mitten durch den FI und über N2, im Modell nachgerechnet: Stufe 3),
losgelassen ist der Plan derselbe wie vor der Durchsicht.

**Offen:** L253 Punkt 9 (die Meldung verhindert nichts; Zwischenbilder
können über eine fremde Klemme laufen; das Loslassen kostet einmal die
volle Suche; kein Wächter für die Zeit) und Punkt 8 (Strg+Z nach einem
Zug), der mit der Meldung schwerer wiegt.

## 11. Oktober 2026 · E746 · Drehen und Ziehen zapfen nichts mehr an

**Redur:** „4. wie du willst", am 11. Oktober abends, zur Frage, in welcher
Reihenfolge die Elektro-Punkte aus L253 drankommen. Zuerst Punkt 4, weil
er still die Bedeutung eines Plans ändert (§46, §51).

**Gefunden** (`test611` gegen `main` 97d156b03, 47/79): Drehen, Spiegeln und
Ziehen führten ALLE Leitungen des Plans neu, jede als Winkel von Ende zu
Ende. Im Plan „Drehstrom, FI und Übertrager" wurde nach dem Drehen des FI
aus sechs Netzen um den FI eines — L und N der Quelle verbunden, „l-n",
nichts mehr gerechnet —, die Motorleitung w4 verlor ihren Weg und lief über
U2, V2, W2, und im alten FI aus `test608` lief b2 5 px neben N2.

**Gebaut:** `Schaltplan.vorherMerken` (was vor der Änderung feststeht: die
Klemme jedes Endes nach E738, die Punkte, was jede Leitung berührt) und
`Schaltplan.nachziehen` (führt nur neu, was an einem bewegten Teil hängt;
nimmt nur einen Weg, der genau dasselbe berührt wie vorher — alter Weg,
nachgerückte Endstücke, Winkel, anderer Winkel, Z-Wege, Hakenwege —, am
liebsten durch kein Zeichen; sonst Stufe 2/3 und eine Meldung).
`Schaltplan.kontakte` legt die Berührungsregel offen. Die Planfläche ruft
für Pfeiltaste, Drehen, Spiegeln und Ziehen nur noch diese Stelle;
`endKlemmen` und `leitungenNachziehen` sind weg. Eine fremde Leitung, deren
Ende neben seiner Klemme liegt (alter Plan), rückt beim Drehen, Spiegeln,
Ziehen weiter an die Klemme, wie E738 es zusagt — mit derselben Prüfung.

**Prüfung:** `test611` zuerst rot eingecheckt (a4bdd8c2c), dann 79/79;
gegen `main` 47/79. Drei Gegenproben, jede rot und wörtlich zurückgenommen:
alle Leitungen wieder neu 78/79, ohne Anzapf-Prüfung 59/79, ohne Vorzug
ausserhalb der Zeichen 77/79. Die strenge Variante (fremde Leitungen nie
anfassen) als Messung: `test608` 67/69 — darum bleibt die Heilung.
Nachbarn grün: `test604`–`test608`, `test238`–`test242`, `test254`,
`test388`, `test74`, `test568`, `test571`, `test572`; Datei-Wächter grün.
Bilder vorher/nachher (Rechner und Telefon, hell und dunkel, dazu dreifach
vergrösserte Ausschnitte): vorher hängen nach dem Drehen beide Leitungen
der Quelle mit Verbindungspunkten an den linken FI-Klemmen, nachher laufen
sie um die Zeichen herum an die richtigen, und die Lampe leuchtet (435 mA,
100 W). Was die Bilder noch zeigen: f3 und f4 laufen über die Beschriftung
„G2" (Beschriftungen meiden die Wege nicht), und am Telefon ist der Plan so
klein wie vorher (L253 Punkt 3). Zahlen in `messungen.md` §103.

**Offen:** L253 bleibt für die übrigen Punkte offen. Im selben Plan meldet
die Simulation schon VOR jeder Handlung „fi-loest-aus" (auf `main` genauso,
nicht untersucht). Und Strg+Z macht einen Zug mit der Maus nicht rückgängig
(Sonde: nach zweimal Strg+Z steht R1 weiter am neuen Ort; auf `main`
genauso) — eingetragen als L253 Punkt 8, nicht hier angefasst.

## 11. Oktober 2026 · E745 · Die CI fährt den schnellen Lauf, der volle bleibt auf dem Rechner

**Redur:** „2 . Scnell lauf", am 11. Oktober 2026 um 19:43 UTC, auf L254
(„Alle Prüfläufe" in der CI kann nicht fertig werden) — Weg (c): in der CI
nur der schnelle Lauf, der volle bleibt beim Menschen.

**Gefunden**, bevor etwas geändert war: `--schnell` liess genau einen Lauf
weg (test73) — 549 von 550, also kein schneller Lauf. Gemessen auf 97d156b:
551 Läufe, 509 starten einen Browser, 42 nicht; die 42 brauchen zusammen
95 s, test96 und test100 (§31, Sicherung mit echten Bytes) 8 und 4 s.

**Gebaut:** `pruefungen/alle.mts` — `--schnell` ist jetzt jeder Lauf ohne
Browser (aus der Datei gelesen) plus `SCHNELL_MIT_BROWSER` (test96,
test100, je mit Grund); neu `--liste`, das die Auswahl druckt, ohne zu
fahren, und erst nach dem Schreiben endet. `.github/workflows/pruefen.yml` —
„Alle Prüfläufe" (40 min, brach jeden vollen Lauf ab) heisst jetzt
„Schneller Lauf (ohne Browser, dazu die Sicherung)", fährt
`npm run pruefen -- --schnell`, druckt vorher die Liste, baut und prüft die
Einzeldatei weiter, holt Chromium nur für die zwei, 20 Minuten Zeit, und
der Kommentar nennt die Messung und `volllauf.mts`. Der schnelle Job
„Quelltext und Logik" ist unverändert. Doku: CLAUDE.md §30, LIESMICH,
README, MIGRATION-REZEPT, die Karte (`mcp.md`).

**Geprüft:** `test610` neu — gegen 97d156b rot mit 4 von 21 bestanden,
nachher 22/22; sechs Gegenproben rot (14, 20, 21, 21, 19, 21 von 22), jede
Byte für Byte zurückgesetzt. `npm run pruefen -- --schnell` auf dem Endstand: 45 Läufe
in 3 min 57 s, 44 grün, rot nur `test274` (auf main seit E729 rot; die
erste Messung, 4 min 14 s, lief noch vor der Doku). Datei-Wächter 550 8/8,
549 6/6, 225 11/11, 105 342/342, 109 25/25, 87 181/181, 537 18/18, 400 4/4,
553 6/6, 578 115/115; im Browser 353 105/105, 388 22/22 (Start 1919 KB,
Decke 1950). Unterwegs gefunden und gerichtet: die erste
`--liste` war in einer Röhre in 3 von 40 Fällen abgeschnitten (danach 0 von
190). L254 GESCHLOSSEN. Messung in `messungen.md` §102.

**Nach der Durchsicht** (am selben Abend, derselbe Zweig): stehende
Anweisungen, die `--schnell` in der alten Bedeutung nannten, sagen jetzt,
was sie meinten — AUFGABEN.md „Dauerhafte Regeln", `doku/TYPESCRIPT-MIGRATION.md`,
`doku/MIGRATION-REZEPT.md` (der volle Lauf wieder als eigene Zeile),
`doku/AMDION-UEBERNAHME.md`, `doku/AUFTRAG-01-ruhiges-band.md`, README,
ein Hinweis in `doku/REDION-STUDY-SUITE-AUDIT.md`; E745s zwei falsche Sätze
dazu berichtigt. L254s Beleg hiess „grün mit 4 von 21" — es war rot. Die
geschätzte Einrichtung („rund 7 Minuten", „etwa 3 Minuten") ist durch die
Zeiten von GitHub ersetzt: 32 s (Lauf 38169660632). test610 liest seinen
zweiten Weg jetzt über `ohneKommentareGenau` (neu in
`pruefungen/hilfe/quelltext.mts`, Zeichen für Zeichen; in allen 552
Dateien dieselben Kommentare wie der Parser von TypeScript) und
VERGLEICHT beide Wege — vorher verlor er über `nurCode` test587 (508 statt
509), und die Vereinigung verdeckte es. Dazu fängt er `npm run-script`,
`npm test`, `npx … alle.mts`, doppelten Leerraum, `|| true`,
`continue-on-error` und `pruefen`/`postpruefen` in package.json; acht dieser
zwölf neuen Gegenproben hatte die erste Fassung grün durchgelassen.
`test610` gegen 97d156b rot mit 7 von 25, jetzt 26/26; achtzehn
Gegenproben und zwei Positivproben in E745, jede in einer frischen Kopie
im Notizordner. Nachbarn: 550 8/8, 549 6/6, 225 11/11, 105 342/342,
109 25/25, 87 181/181, 537 18/18, 400 4/4, 553 6/6, 444 13/13 (nutzt
`quelltext.mts`; versehentlich ohne das Schloss gefahren), im Browser unter
dem Schloss 353 105/105, 388 22/22 (Start 1919 KB, Decke 1950);
`npm run pruefen -- --schnell` unter dem Schloss: 45 Läufe, 44 grün, rot
nur `test274`, 231 s von aussen gemessen (Warten auf das Schloss
eingeschlossen).

**Nach der zweiten Durchsicht** (12. Oktober, derselbe Zweig): `test610`
fängt jetzt auch `node --run pruefen`, `npm --prefix . run pruefen`,
`npm -C . run pruefen`, `echo "$(npm run pruefen)"`, dasselbe mit
Backticks und `echo … | sh` (ein `echo` ist nur noch Prosa ohne `$(`,
Backtick und Röhre); er liest JEDE Ablaufdatei unter `.github/workflows/`
(jede muss einen Job ergeben) und Zeile für Zeile jede YAML-Datei unter
`.github/`. Zwölf neue Gegenproben (G19 bis G30), alle von der Fassung
davor grün durchgelassen, jetzt rot; test610 28/28, gegen 97d156b rot mit 8 von
27. Sein Kopf und E745 sagen nicht mehr „jede Form, die einen Lauf
startet" und „ein Rot bricht den Job ab": `set +e`, `shell:` ohne `-e`,
`if:` und ein Lauf hinter einem eigenen Skript stehen jetzt als „hält er
nicht" da, dazu ein gefalteter Block in einer eigenen Action (N1 bis N5,
grün mit Absicht). `messungen.md` §102 und
pruefen.yml: „der Runner ist nicht langsamer" ist durch das gemischte Bild
ersetzt (test105 und test103 dort schneller, test578 langsamer, je ein
Lauf); „`ohneKommentare` … in 378" war mit zwei Verfahren nachgezählt 377.
In `doku/AUFTRAG-01-ruhiges-band.md` fehlte nach dem Nachtrag die
Leerzeile. Nachbarn: 550 8/8, 549 6/6, 225 11/11, 105 342/342, 109 25/25,
87 181/181, 537 18/18, 400 4/4, 553 6/6; unter dem Schloss 353 105/105,
444 13/13, 388 22/22 (Start 1919 KB, Decke 1950). Ausgelieferte Dateien
unverändert (Dienststand v1469, Einzeldatei ohne Unterschied).

**Nach der dritten Durchsicht** (12. Oktober, derselbe Zweig): `test610`
zerlegt eine Zeile jetzt auch an einem einzelnen `&` — vorher war
`echo start & npm run pruefen` (ebenso mit `printf`) EIN `echo` und fiel
als Prosa weg. Er fängt `yarn pruefen` und `pnpm pruefen` (jedes Wort
`pruefen` hinter einem Paketmanager), den Namen in Anführungszeichen
(`npm run 'pruefen'`, `npm run "pruefen"`, `node --run "pruefen"`; gesucht
wird in dem, was die Shell ausführt) und liest jede eigene Action, die ein
Schritt über `uses: ./…` ruft, auch ausserhalb von `.github/` und über eine
zweite; ihre Befehle zählen für den rufenden Job, und eine gerufene, die es
nicht gibt, ist rot. Beim Schreiben dazugefunden und ebenso gefangen: ein
`run:`-Wert über mehrere Zeilen, ein gefalteter Block mit Leerzeile oder
tiefer eingerückter Zeile, `\n`/`\u0075`/`\` am Zeilenende in doppelten
Anführungszeichen, `run: |2` und `run: | # …`, ein `\` mitten im Wort,
`echo <(…)`, `echo … > s.sh`, `rum`/`urn`/`cit`, `bun`, `deno task`,
`yarn workspace`, `npm@10`, `$'…'` und ein zweites Skript in package.json,
das den Orchestrator ruft. 33 neue Gegenproben (G31 bis G63), alle von der
Fassung davor grün durchgelassen, jetzt rot; dazu neun Gegenproben am
Werkzeug (je ein Teil zurückgedreht, die Probe kommt wieder grün durch).
test610 30/30, gegen 97d156b rot mit 10 von 29 — CLAUDE.md §30 nannte noch
7 von 25 (den Stand nach der ersten Durchsicht), jetzt steht dort wie hier,
in L254 und in E745 dieselbe Zahl. Sein Kopf sagt weiter „eine Liste, kein
Beweis" und nennt, was er nicht hält; jede dieser Behauptungen ist als
Probe gefahren und bleibt grün (N6 bis N10: `${{ matrix.… }}`, `xargs`,
`eval "$LAUF"`, `\x75` in `$'…'`, eine Action aus JavaScript). Nachbarn:
550 8/8, 549 6/6, 225 11/11, 105 342/342, 109 25/25, 87 181/181,
537 18/18, 400 4/4, 553 6/6; unter dem Schloss 353 105/105, 444 13/13,
388 22/22 (Start 1919 KB, Decke 1950). Ausgelieferte Dateien unverändert
(Dienststand v1469, Einzeldatei ohne Unterschied).

**Offen:** wie lange der ganze schnelle Lauf auf einem Runner braucht,
zeigt erst der erste Push (die Einrichtung ist gemessen: 32 s); und der Job
wird rot sein, solange `test274` rot ist — ein Fehlalarm über
`redion-graphit` in `marken.ts`, den nur Redur freigeben kann.

## 11. Oktober 2026 · E744 · Die Linse auf „Heute" verblasst nach der Fahrt

**Redur:** „1. verblassen", am 11. Oktober 2026 um 19:43 UTC — auf die
Frage aus AUFGABEN.md, „Die leere Linse neben dem Wort (E740)": seit E740
hält die Linse rechts von „Weiterdenken.", über leerem Grund, und war in
Ruhe eine Glasscheibe, die nichts trägt. Stehen lassen oder verblassen?

**Gefunden** (Bilder vorher, 1440 × 900 und 390 × 844, hell und dunkel,
dazu „weniger Bewegung"): in jedem Bild eine leere Scheibe neben dem Punkt
— dunkel ein kaum hellerer Kreis mit Lichtkante, hell ein fast weisser Stein
mit weichem Schatten; bei „weniger Bewegung" dieselbe Scheibe ohne Fahrt.

**Gebaut** (`src/schale/bedienung/linse.ts`): die Fahrt bleibt Zahl für
Zahl; am Halt eine Animation der Deckkraft 1 → 0, `delay` = Ende der Fahrt
(1650 ms), Dauer und Kurve aus den Marken (`--motion-slow` 320 ms,
`--ease-exit`), auf derselben Uhr wie die Fahrt; danach wird die Linse
entfernt. In Ruhe, beim Neuzeichnen danach und ohne Bewegung entsteht
keine. Zwei Kommentare nachgezogen (`studio.css` 8c, `lernwelt.ts`), die
noch „ruht" bzw. „liegt still" sagten.

**Geprüft:** `test589` mit Redurs Wort geändert — §16 misst die vier
Zusagen von E740 jetzt am Halt (eine Millisekunde vor dem Ende der Fahrt
angehalten), in Ruhe keine sichtbare Linse, und das Verblassen Bild für
Bild (mindestens drei Bilder dazwischen, nie heller, höchstens 700 ms);
§8: an ihrem ersten Halt bricht sie, nach der Fahrt verblasst, 1000 px
holen keine zurück, „Ruhig" und „weniger Bewegung" ohne Linse. Rot gegen
97d156b03 mit 132 ok, 14 offen; mit E744 146 von 146. Drei Gegenproben am
gebauten JavaScript, je zurückgesetzt (sha256 gleich): ohne Verblassen
142/4, ohne Verblassen und Entfernen 137/9, alter Ruhezweig 141/5.
Gemessen: 14–15 Bilder zwischen voll und leer, 279–302 ms (messungen.md
§101). Nachbarn grün: 539 (51/51), 541 (25/25), 576, 388 (22/22, Start
1919 KB, Decke 1950), 74 (12/12), 600 (214/214), 601; Datei-Wächter 550,
549, 225, 105, 109, 87, 537, 400.

**Bilder nachher:** in Ruhe auf keiner Grösse und in keinem Thema eine
Linse, die Überschrift frei; während der Fahrt (angehalten über
„Weiterdenken.", am Halt, mitten im Verblassen bei 0,675) dieselbe Linse
wie vorher, am Halt rechts vom Punkt.

**Durchsicht** (11. Oktober abends): zwei Lücken im Wächter, eine falsche
Zahl in der Entscheidung. (1) `test589` §16 liess ein „Verblassen" auf 0,5
mit `remove()` in einem Schritt durch — 146 von 146 grün. Neu: das letzte
sichtbare Bild vor „weg" zeigt höchstens 0,2, von Bild zu Bild fällt die
Deckkraft höchstens um 0,25 (gerechnet aus `--ease-exit`: ein Bild 0,083,
zwei 0,162, drei 0,239); stockt der Browser dort, wird nachgemessen. Mit
der Gegenprobe 148 ok, 4 offen. (2) §8 misst jetzt das Neuzeichnen mitten
im Verblassen: 1000 px bei gut 1800 ms — die Linse ist da, halb verblasst
und weiter fallend, rechts vom Punkt in der neuen Lage, die Abschrift in
der neuen Schriftgrösse; rot ohne `geht.currentTime = versatz` (151/1), mit
dem Halt von vor E740 (139/13) und mit der Schrift des ersten Ankommens
(151/1). (3) E744 „Was es kostet": die +191 B gzip sind Code, kein
Kommentar (`removeComments`, E715) — vor allem `verblassen()`, das Dauer und
Kurve aus den Marken liest. `test589` 152 von 152. Ein neues Bild der Fahrt,
angehalten bei 1000, 1025 und 1050 ms, zeigt die Linse quer über „en." von
„Weiterdenken." (das alte bei 1150 ms stand fast schon am Halt).

**Zweite Durchsicht** (12. Oktober): drei kleine Funde, alle in
`test589`, keiner im Produkt. (1) §8 ändert das Fenster jetzt 1690 statt
1740 ms nach dem Ankommen — gemessen wird im ersten Bild danach, und das
muss zwischen etwa 1705 und 1960 ms liegen; der Verzug steht in der
Zusage (gemessen 34–68 ms), damit ein verpasstes Fenster nicht wie ein
Fehler aussieht. Ohne `geht.currentTime = versatz` weiter rot (151/1).
(2) §8 lässt auch dieselbe Linse gelten, an Ort und Stelle neu angelegt —
erkennbar an der neuen Schrift in der Abschrift; vorher war das rot
(150/2), jetzt 152 von 152; die alte Schrift, kein Neuzeichnen und die
Schrift des ersten Ankommens bleiben rot (150/2, 150/2, 151/1). (3) Die
Bereiche „0,061–0,097 und 0,080–0,082" waren ein Lauf; in zwei weiteren
0,021–0,093 und 0,080–0,083, also etwa 0,02–0,10 und 0,08 (messungen.md
§101). `test589` 152 von 152, zweimal. Nachbarn grün: 539 (51/51), 541
(25/25), 388 (22/22, Start 1919 KB, Decke 1950), 74 (12/12); Datei-Wächter
550, 549, 225, 105, 109, 87, 537, 400.

**Offen:** nichts aus dieser Frage. Die Bilder liegen im Kratzordner, nicht
im Verzeichnis (§55.4).

## 11. Oktober 2026 · Redurs sechs Ja — zusammengeführt auf `claude/sechs-ja`

**Der Auftrag.** Redur um 11:00 UTC: „Ja für die 6 entscheideungen" — die
sechs nummerierten Fragen aus dem Bericht vom Vormittag. Was daraus wurde:

```txt
1  Suche im Dokument beginnt mit „Dieses Dokument"   kein Code; Nachtrag in E725
2  zwei alte Zweige hereinnehmen                     E730–E738 (Elektro), E739 (Dark)
3  die Linse auf „Heute" ruht neben dem Wort         E740
4  Umschalt+Rad schiebt die Fläche quer              E741
5  test319 bleibt streng, der Info-Streifen folgt    E742
6  die lokalen Arbeitsbäume aufräumen                git worktree remove, 11:50 UTC
```

**Gebaut** auf fünf Zweigen, je mit dem Wächter zuerst rot, einer
Durchsicht und Gegenproben (die Einträge darunter, je einer pro Zweig):
`claude/elektro-simulation-auf-main`, `claude/dark-fach`,
`claude/linse-neben-dem-wort`, `claude/flaeche-umschalt-quer`,
`claude/info-streifen-kontrast`. **Zusammengeführt** nacheinander auf
`claude/sechs-ja` (von `main` 1575a18), Konflikte nur in der Doku (nach
Einträgen gemischt, ohne verlorene Zeile — `verlust.py` je Schritt), in den
Zählern und im Erzeugten (nach jedem Schritt neu gebaut). Der Stand danach:
721 Entscheidungen, E1 bis E742 · 550 Läufe · 149 Lücken, 92 offen.

**Dazu, beim Zusammenführen gemessen:** „Alle Prüfläufe" in der CI bricht
auf `main` seit dem 5. Oktober nach vierzig Minuten ab — die Datei rechnet
noch mit 67 Läufen. Eingetragen als **L254**, nicht repariert: welcher Weg,
entscheidet Redur.

**Geprüft auf dem zusammengeführten Stand:** 63 Läufe grün, keiner rot — 16 Datei-Wächter (550 549 225 105 109 87 400 537 401 402 290 298 410 362 92 94) und 47 im Browser, darunter die neuen test604–test609 sowie 589, 598, 319, 584, 600, 469, 74 und test388 (Start 1919 KB gzip, Decke 1950). Danach der volle Lauf über alle 550 in Stücken (`volllauf.mts --neu`, 16:04 UTC, nach der Zeitgrenze der Sitzung einmal fortgesetzt): 537 grün, 13 rot in 158 Minuten — die dreizehn sind genau die fremden roten Läufe, die auf main schon rot waren (201 270 274 332 348 351 365 425 448 470 493 524 533); neu rot ist keiner, und test319 ist nicht mehr darunter.

**Nicht getan:** `main` ist nicht bewegt (§46; E729 galt für die dritte
Welle). Was offen bleibt, steht in L253 (Elektro), in AUFGABEN.md
(die leere Linse, Punkt 2 bei der Fläche nach E722/E723) und in L254.

## 11. Oktober 2026 · E742 · Der Info-Streifen ist im Dunkeln nicht mehr die blasseste Meldung

**Redur:** „Ja", am 11. Oktober 2026, zu einer von sechs Fragen dieses
Tages: `test319` bleibt streng, gerichtet wird die Farbe (AUFGABEN.md,
„Nach dem Zusammenführen der dritten Welle", Punkt 1, hatte gefragt, ob
der Punkt bei so hohen Werten noch etwas sagt).

**Gefunden** (`test319` auf `1575a1835`, 25/26): „Und `info` ist nicht die
blasseste der drei — info 12.09, warn 12.15, fehler 12.41". E705 gab allen
dunklen Tönungen OKLCH L 0,30; bei gleichem L hat dieses Blau (#133144)
mehr WCAG-Leuchtdichte als das Gelb (0,02752 gegen 0,02716), also weniger
Kontrast zur hellen Schrift. Im Browser nachgemessen: in allen sechs
dunklen Schemata war `info` der blasseste, in den vier hellen nie.

**Gebaut:** `--b-blue` in `dunkel.css` `#133144` → `#123043`, jeder Kanal
eine Stufe dunkler, Ton und Buntheit gleich (ΔE_OK 0,004, L 0,296); ein
Kommentar am Wert und an der E705-Zeile, damit eine neue Stimmung der
Palette #133144 nicht zurückbringt; `bausteine.css` nennt die Zahlen von
heute statt „8.30:1, gleichauf" (die zwei gleichen `.banner.info`-Zeilen
bleiben); „index.html Zeile 68 gegen 61" in `ansichten.css` und
`test319` heisst jetzt 78 gegen 61. Standard nachher 12.26 / 12.15 / 12.41;
kein Textkontrast auf `--b-blue` sinkt, hell unverändert.

**Prüfung:** `test319` zuerst rot eingecheckt (nur Kommentare, 25/26),
danach 26/26; Gegenprobe (nur der Wert zurück) wieder 25/26 mit denselben
Zahlen. `test584` 37/37, `test414` 14/14, `test47` 42/42, `test332` nur
mit seinen fünf bekannten toten Regeln, `test388` (Start 1890 → 1891 KB),
die Datei-Wächter. Zehn Schemata vorher und nachher in `messungen.md`.
Bilder vorher/nachher, Rechner und Telefon, dunkel und hell: kein
sichtbarer Unterschied — die Messung ist der Beweis.

## 11. Oktober 2026 · E741 — Umschalt+Rad schiebt die Fläche quer (Fläche nach E722/E723, Punkt 4)

**Redur** (11. Oktober 2026): „Ja" zur Frage aus `AUFGABEN.md`, ob
Umschalt+Rad auf dem Grund der Fläche quer schieben soll, wie in AFFiNE
und Figma — und eine breite Tabelle an ihrem rechten Rand soll
Umschalt+Rad ebenfalls quer weiterreichen.

**Gefunden** (gegen `1575a1835`, 1440 × 900 und 1920 × 1080): ein Rad mit
Umschalt kommt in Chromium als `deltaY` 120 mit `shiftKey` an. Über der
Tabelle rollte es seit E723 quer, auf dem Grund schob es die Fläche um
120 px LÄNGS (quer 0, längs −120), und ganz rechts in der Tabelle ebenso —
dieselbe Geste wechselte an der Kante die Richtung. Die Schiebezeile las
`deltaY` als längs; nur `rolltSelbst` kannte die Umschalt-Regel.
`AUFGABEN.md` nannte als Wächter `test598` §5 — der hält das Whiteboard
und bleibt, wie er ist; der Wächter ist §14.

**Gebaut:** `radWeg(e)` in `seitenflaeche.ts` — Umschalt mit einem Rad
ohne `deltaX` heisst quer (`{ dx: deltaY, dy: 0 }`), ein vom System schon
gedrehter Wisch (macOS: `deltaX` gesetzt) bleibt, wie er ist. EINE Regel
für zwei Leser: `rolltSelbst` (Verhalten unverändert) und das Schieben.
Strg/⌘+Rad bleibt der Zoom; README nennt die Geste.

**Prüfung:** `test598` §14 neu, sechs Zusagen — gegen `1575a1835` rot, 70
von 72 („quer 0, längs -120" am Rand der Tabelle und auf dem Grund),
danach 72 von 72. Zwei Gegenproben rot gesehen: die Schiebezeile zurück
(dieselben zwei Zeilen), unbedingtes Tauschen (die macOS-Zusage). Dazu
grün: `test105`, `test109`, `test537`, `test549`, `test550`, `test573`
(31/31), `test574` (60/60), `test575` (45/45), `test388` (Start 1890 KB
gzip, Decke 1950); Zahlen in `messungen.md` §92 („Nach E741"), auch aus
`redion-einzeldatei.html` allein im Ordner. Kein Bild: es ändert sich
nichts auf dem Bildschirm, nur wohin eine Geste schiebt (§55.3).

**Nach der Durchsicht** (selber Zweig): §14 konnte die gebaute Regel nicht
von der verworfenen unterscheiden („mit Umschalt den grösseren Anteil quer
legen") und auch nicht von einer, die den Anteil längs fallen lässt — alle
drei schieben ein gewöhnliches Umschalt+Rad und den macOS-Wisch gleich.
Jetzt acht Zusagen: ein erzeugter schräger Wisch mit Umschalt (`deltaX`
30, `deltaY` 100) muss die Fläche um genau −30, −100 schieben, wie E741
verspricht; und die Vorbedingung heisst ehrlich „eine leere Stelle auf der
Fläche" (`leer` prüft kein „neben der Tabelle"), das Lesen des `transform`
steht als eigene Vorbedingung daneben. 74 von 74; drei Gegenproben rot
gesehen und zurückgenommen (Bytes per sha256 gleich): die verworfene Regel
„quer -100, längs -30", längs fallen lassen „quer -30, längs 0", beide
73 von 74 an genau der neuen Zeile; der `transform` als gleichwertiges
`matrix(…)` macht die Lese-Vorbedingung rot mit dem Wortlaut, während die
leere Stelle grün bleibt.

## 11. Oktober 2026 · E740 · Die Linse auf „Heute“ ruht neben dem Wort

**Redur:** „Ja“ am 11. Oktober auf die Frage aus der Liste vom 5. Oktober,
„neben dem Wort ruhen?“ (AUFGABEN.md: „Die Linse auf ‚Heute‘ ruht über
‚ken‘“).

**Gefunden:** Die ruhende Linse lag über „ken“ — `P2 = Ende der zweiten
Zeile − 0,8 Schriftgrössen` — und zeigte es vergrössert ein zweites Mal:
im Gesamtbild „Weiterdenl(en“. Gemessen sechs Zeichen unter ihr („n . k e
n .“), am Rechner 72,7 px, am Telefon 56,2 px vor dem Ende der Zeile, bei
320 px dasselbe mit einer 58-px-Linse. Dazu ein Wächter, der mit dem neuen
Ort nichts mehr gemessen hätte: `test589` §13e prüfte den Kontrast IN der
ruhenden Linse — über leerem Grund 1,01 : 1, auch bei einer Linse aus
Seidenpapier.

**Gebaut:** In `linse.ts` hält die Linse eine Fünftel-Schriftgrösse rechts
vom Punkt, auf der Höhe der zweiten Zeile, in der Spalte der Überschrift;
ist daneben weniger Platz, wird sie kleiner, unter 40 px gibt es keine
(320 px). Die Fahrt dahin ist dieselbe. Das verwischte Hereinkommen der
Zeilen ist ein eigener Schritt und läuft auch ohne Linse. Die Kommentare in
`linse.ts` und `studio.css` sagen jetzt, wo sie ruht. Nichts entfernt, was
vorher ging — ausser der Linse bei 320 px, die dort nur über der Schrift
Platz hatte.

**Prüfung:** `test589` §16 neu (jeder Buchstabe beider Zeilen gegen den
Kreis der Linse, 1440 × 900 und 390 × 844, hell und dunkel, weniger
Bewegung, 320 px), §8 mit Redurs Wort „neben“ statt „auf“, §13e an den
Halt über „Aufmachen.“ verlegt (angehalten bei 780 ms, Buchstaben unter
der Linse, dann der Kontrast). Gegen 1575a183 rot mit 112 von 126, jetzt
126 von 126. Zwei Gegenproben rot: der alte Halt (113/126) und die dünne
Linse (124/126, §13e 6,68 und 3,66 : 1). Nachbarn grün: 539, 388 (Start
1890 KB, Decke 1950), 217, 424, 580, 576; Datei-Wächter 105, 109, 550.
Bilder vorher und nachher, Rechner und Telefon, hell und dunkel, dazu
weniger Bewegung — nicht im Verzeichnis (§55.4). Offen als Frage an Redur
(AUFGABEN.md): die ruhende Linse ist jetzt eine leere Scheibe — stehen
lassen oder nach der Fahrt verblassen?

**Durchsicht:** `test589` §16 übersprang die Abschrift IN der Linse — dass
sie in Ruhe nichts zeigt, war behauptet, nicht gemessen. Jetzt auch jedes
Zeichen der Abschrift gegen den Kreis (Deckkraft, Sichtbarkeit,
Ausschnitt), in allen sieben Fällen: 133 von 133. Gegenprobe (die
Abschrift mit dem alten Versatz, die Linse daneben): 127 ok, 6 offen —
„k e n .“ sichtbar in der Linse.

## 11. Oktober 2026 · E739 · Die Vorlage „Dark (2017–2020)" ist eingebaut

**Redur:** am 11. Oktober „Ja" auf die Frage, ob sein Zweig
`feat/dark-2017-fach-dossier` (30. September, „Dark-Serienfach mit
Zeitlinie und Lernkarten anlegen") als eingebaute Vorlage auf `main` kommt
— AUFGABEN.md, dritte Welle, Punkt 3: „Hineinnehmen oder liegen lassen —
Redurs Wort".

**Gefunden:** Der Zweig trug zwei Commits: die .ts (49da007a5) und eine
von Hand kopierte .js (611a28a2c). Die .ts war für sich nicht lauffähig:
keine Zeile in index.html und keine im GRUNDSTOCK, kein Kopf „ERZEUGT",
23 implizite `any` (`npm run typecheck` rot), und der Wikipedia-Verweis
`…/wiki/Dark_(Fernsehserie)` zerbrach am Link-Muster des Editors — die
Adresse ohne Ende, eine einzelne „)" dahinter (Bild `vorher-quellen-…`).
Dazu, erst von `test609` §4 gefunden: das Schaubild der Zeitlinie trug
„Adam & Sic Mundus" roh im SVG — undekodierbar, auf Seite 2 stand ein
kaputtes Bild mit dem Alternativtext (Bild `vorher-zeitlinie-…`).

**Gebaut:** Cherry-Pick von 49da007a5 mit Redur als Autor, ohne
611a28a2c (das .js erzeugt `npm run bauen:ts`). Der Kopf „ERZEUGT", die
Parameter typisiert, `Paar = [string, string]` für die vier Listen und
die Lernkarten, `Dark_%28Fernsehserie%29`, `&amp;` im Schaubild,
`window.DarkDossier` wie `NinQuiz`; die Skriptzeile direkt nach
`nin-quiz.js` (nach `register/vorlagen.js`) und dieselbe im GRUNDSTOCK.
Redurs Bezeichner und Texte sind sonst unverändert. L216 hat einen
„Stand": drei Lerninhalte im Startweg.

**Prüfung:** `test609` neu — gegen den Cherry-Pick allein 1/15, gegen den
ersten eingebundenen Stand 23/24 (das `&`), danach 24/24; drei Gegenproben
rot (Skriptzeile heraus 3/15, Klammern roh 20/24, `&` roh 23/24). Grün:
105, 109, 143, 388 (1890 → 1904 KB über 254 → 255 Dateien, Decke 1950),
86, 565, 537, 87, 530, 550, 549; `test567` einmal rot („Gespeichert steht
die falsche Antwort meist zuletzt" — eine Stichprobe von zwanzig
Ankreuzkarten, die Dark-Karten liegen in dem Lauf gar nicht vor), danach
dreimal 39/39. Einzeldatei 9 545 743 → 9 589 468 Bytes. Messung
`messungen.md` §98. Bilder vorher (Zeitlinie, Quellen) und nachher
(Wurzel mit Titelbild, Zeitlinie, Familien-Schaubild, Lernkarten,
Quellen), Rechner 1440 × 900 und Telefon 390 × 844, hell und dunkel,
ohne Seitenfehler — nicht im Verzeichnis (§55.4).

## 11. Oktober 2026 · Die Elektro-Simulation auf `main` — übertragen, nicht zusammengeführt (E730–E738)

**Redur:** „Ja" am 11. Oktober 2026 (eine von sechs Entscheidungen an diesem
Tag) — den Elektro-Zweig hineinnehmen. Die Frage stand in AUFGABEN.md, offene
Punkte, 3: „Zwei alte Zweige mit Arbeit, die nirgends steht …
Hineinnehmen oder liegen lassen — Redurs Wort."

**Gefunden:** Der Zweig (11 Commits, 12./13. September) stand 443 Commits
hinter `main`; seine Nummern E539–E547, L151–L158 und test498–501 trugen auf
`main` längst andere Einträge, und seine erzeugten Dateien (quell/*.js,
sw.js, sw.ts, stand.ts) wären Konflikte ohne Inhalt gewesen. Seine eigene
Lücke L157 nannte die Gefahr, die vor dem Mergen zu entscheiden war: vier
bestehende Zeichen (`stecker`, `fi-schutzschalter`, `steckdose`,
`steckdose-schuko`) hatten andere Klemmen bekommen. Mit einer Sonde
gemessen: ohne Auffangen fiel die Leitung am alten Stecker ab, am alten
Schuko hingen L und N zusammen (ohne Meldung), und ein gesunder Lampenkreis
hinter dem alten FI meldete „löst aus" mit 435 mA.

**Gebaut:** (1) Die acht Quell- und Stildateien per `git diff | git apply
--3way` übertragen, jede Verweisnummer umgeschrieben (E539→E730 … E547→E737,
L154→L250, test498–501→test604–607), die Läufe als `test604`–`test607` (Ports
unverändert). Nicht übernommen: `lernwelt.ts`/`.css`, `test217`, `test87` —
E544 ist durch E638 und `test400` erledigt. Der Stil der Lernansicht hält die
Marken (`--touch-min`, keine neue rohe 44px/16px), hat ein Druckbild (E720)
und einen 44-px-Schliesser. (2) `test608` rot zuerst. (3) **E738**: `frueher`
an den vier Zeichen und EIN Auflöser `Register.fachzeichen.klemmeFuer` (Ort vor
Name) für Netzliste, `anschlussLage` und das Nachziehen in der Planfläche;
gespeicherte Daten bleiben unverändert. (4) Doku: E730–E738, L248–L253 (L252
GESCHLOSSEN), `messungen.md` §97, CLAUDE.md §30 (549 Läufe),
`doku/CSS-NAMENSRAEUME.md`, `doku/karte/`.

**Prüfung:** `test604` 91/91, `test605` 51/51, `test606` 17/17, `test607`
37/37, `test608` 51/51 (rot gegen den Übernahme-Commit; vier Gegenproben
rot), nach der Durchsicht 69/69 mit §7 (der FI schon gedreht oder
gespiegelt gespeichert; fünfte Gegenprobe rot mit 59/69). Datei-Wächter 550 549 225 401 402 537 290 298 410 400 109 87 105 grün;
Nachbarn 86 203 210 211 217 238 239 240 241 242 315 362 368 388 393 438 446
464 471 477 480 565 567 576 580 596 601 grün. Start 1890 → 1904 KB gzip
(`test388` §5, Decke 1950). Bilder vorher/nachher (Planfläche mit laufender
Simulation, Lernansicht; Rechner 1440 × 900, Telefon 390 × 844, dunkel und
hell) angesehen; sie liegen nicht im Verzeichnis (§55.4). Was sie gefunden
haben und offen bleibt — der Pfeil im FI-Kasten, die Klemmenbrett-Meldung,
die winzigen Zahlen am Telefon —, steht in L253.

## 11. Oktober 2026 · Zusammenführen der dritten Welle auf `claude/morgen-besser-3`

**Redur:** Auftragsdatei vom 5. Oktober, Schritt 2: die dreizehn Punkte aus
dem PDF vom 29. September in zehn Zweigen, „**Am Schluss zusammenführen:**
alle zu `claude/morgen-besser-3` auf `claude/morgen-besser-2`, in der
Reihenfolge aus Teil A"; am 6. Oktober um 07:27 UTC: „Pusche einfache alles
nach dem was du jetzt geabut wird und danch alles auf main trotz die rote
läufe und schau mal die alten branchen ob du wirklich alles hast damit wir
etwas nicht vergessen".

**Zusammengeführt** (je `git merge --no-ff`, danach neu gebaut und die
Datei-Wächter 550, 549, 225, 401, 402, 537, 290, 298, 410, 400, 109, 87,
105): trenner-zieht (E716) → seiteneditor-ohne-stau (E717) →
ordner-bearbeiten (E718) → kein-toter-knopf-2 (E719, E720) →
menue-eine-quelle (E721) → flaeche-eine-leiste (E722, E723) → ki-am-ort
(E724) → bibliothek-eine-suche (E725) → lernzentrum-kopf (E726) →
kopf-ruhig (E727, E728). Die Doku nach Einträgen, die Zähler nachgezählt:
707 Entscheidungen, E1 bis E728 (die Klausel im Kopf, „**E716 bis E728**
sind den Zweigen des Masterprompts vom 29. September vergeben und folgen,
sobald sie landen", ist gestrichen); 544 Läufe; 142 Lücken, 86 offene, 56 geschlossene.

**Was beim Zusammenführen gefunden und gerichtet wurde:**
- Eine Seite zu nehmen verlor zweimal die Zeile der anderen — die
  GRUNDSTOCK-Zeile von `register/aktionen.js` in sw.ts und die Zeile von
  `register/ki.js` in CLAUDE.md §8 (P125). sw.ts und stand.ts werden seither
  dreiweg gemischt, nur die Stempel kommen von der höheren Fassung.
- Der „Und"-Block in CLAUDE.md §30 trug Doppel und einen abgeschnittenen
  Satz (P126); er ist aus den Zweigen neu gebaut, je Lauf ein Absatz, Und
  528–544.
- Eine rohe 46px aus E717 machte `test362` rot, seit dem zweiten
  Zusammenführen unbemerkt (P127): jetzt `calc(var(--touch-min) + 2px)`,
  dieselbe Höhe, die Decke nicht angehoben.
- `test469` wählt „Überall" ausdrücklich: seit E725 beginnt die Suche in
  einem Dokument mit „Dieses Dokument" (Vorgabe g), und der Lauf stand in
  keiner Anpassungsliste (P128).
- Zwei Namen an zwei Stellen (P129): der Merker der Kennzahlen (E719) hiess
  wie `einmal` des Busses (`test422`), und das Studio schrieb die Kennung
  `kante` der Kontextkante ab (`test274`, E716) — jetzt `gemerkt` und
  `Kontextkante.wurzel()`.
- `test86` trägt vier Register ein, die unangekündigt dastanden:
  `werkzeuge` (E689), `seitenansichten` (E690), `aktionen` (E721), `ki`
  (E724).

**Geprüft:** der Vereinigungslauf — 169 Läufe aus allen Commits der zehn
Zweige, unter dem Schloss: 152 grün; rot und auf `claude/morgen-besser-2`
Zeile für Zeile gleich rot: 201, 270, 274, 332, 348, 351, 365, 425, 448,
470, 493, 524, 533; `test436` einmal rot, danach zweimal 71/71; die vier aus
den eigenen Zweigen gerichtet. Gesamtbilder vorher (morgen-besser-2) und
nachher an allen zehn Orten, Rechner 1440 × 900 und Telefon 390 × 844, hell
und dunkel, ohne Seitenfehler; sie liegen nicht im Verzeichnis (§55.4).

**Danach, für main** (`claude/auf-main`, E729): der volle Lauf in Stücken —
544 Läufe, 524 grün, 20 rot in 154 Minuten. Jeder rote nachgefahren:
vierzehn sind auf morgen-besser-2 gleich rot (dazu `test319`, jetzt mit
Grund in AUFGABEN.md); `test98` gerichtet (seit E710 suchte er `confirm(`,
jetzt `Dialog.bestaetigen` vor jedem Löschen — drei Gegenproben rot);
`test422` gerichtet (die Chronik zitierte den Aufruf, den er sucht, P130);
`test453`, `test459`, `test466` öffnen in einem eigenen Schritt — die
Meldung „Execution context was destroyed" war kein Neuladen, sondern ein
verlorenes Versprechen im Prüfstand (P131; Sonde an `test453`: 4 von 10
rot, getrennt 15 von 15 grün); `test588` danach dreimal grün. Eine Durchsicht mit drei
Linsen und je zwei Zweiflern (35 Prüfer) prüfte alles, was über
morgen-besser-2 hinaus nach main geht: dreizehn Funde, alle eingearbeitet
— darunter ein falscher Hash in der Chronik, eine falsche Zahl und zwei
ungenaue Zitate.

**Nicht hineingenommen** (die Durchsicht der alten Zweige vom 6. Oktober):
`claude/redion-elektro-simulation` und `feat/dark-2017-fach-dossier`
tragen Arbeit, die in keinem neuen Zweig und nicht auf `main` steht — sie
warten auf Redurs Wort.

## 10. Oktober 2026 · E727, E728 (Nachtrag) · Die Durchsicht: ein Lader, der Vorleser hört den Stand, die achte Tür

**Redur:** dieselben Sätze wie unten (Masterprompt vom 29. September,
Seite 7 und Seite 23). Der Auftrag dieses Nachtrags kam aus einer
unabhängigen Durchsicht des Zweigs `claude/kopf-ruhig`.

**Fund:** Beim Einlesen standen zwei Lader im 44-px-Importknopf — die
Blase von RedionMotion 13 px links der Mitte und über den Rand, darauf der
neue Kreis —, und Vorleser hörten „PDF öffnen" statt „PDF wird gelesen …",
weil `aria-label` das verborgene Wort überdeckte. Dazu drei Versprechen
von E727, die nicht stimmten: die Auswahl „Erscheinungsbild" in den
Einstellungen tat von „Mitternacht" aus nichts, das Kürzel des Gestirns
stand fest (nach dem Umbelegen falsch), und der Schein unter dem Zeiger
blieb beim Schalter „Hoher Kontrast" und bei `prefers-contrast: more`.

**Bau:** Die Blase liegt genau an der Stelle des Zeichens, der Kreis nur
ohne sie; `aria-describedby` zeigt auf das Wort; die Auswahl ruft
`Aussehen.grundWechseln`; Kürzel und Titel aus `Aussehen.kuerzelVon('hell')`,
nachgefragt beim Zeigen und beim Fokus; kein Schein auf allen Wegen hohen
Kontrasts. Die tote Zeile im Block „weniger Bewegung" ist weg. Nichts
entfernt, was vorher ging.

**Prüfung:** `test603` §10 neu (gegen `e5b6df726` 68/73, jetzt 74/74),
`test602` §1, §2, §6 erweitert (57/65, jetzt 65/65), je erst rot;
`test603` §5 und `test580` §7 strenger (schon grün). Sieben Gegenproben
rot gesehen. Nachbarn grün: 602, 482, 580, 584, 494, 388 (Start 1855 KB,
Decke 1950), 47, 474, 128, 40, 384, 54, 424, 430, 437, 540, 581, 576, 435,
589, 114, 582, 588, 303, 126, 541, 592, 272, 37, 428. Bilder vorher und nachher (Einlesen im
Kopf, Gestirn bei hohem Kontrast, „Erscheinungsbild" bei 1440 und 390,
hell und dunkel) — nicht im Verzeichnis (§55.4).

## 6. Oktober 2026 · E727, E728 · Das Gestirn und der ruhige Kopf

**Redur:** Masterprompt vom 29. September, Seite 23 (Foto Seite 24): „das
hier für das sieht so nicht gut aus , es seiht noch nicht 100 fetig aus,
also finde für hier ewas kreatives aus," — und Seite 7 (Bild Seite 15):
„hier es sollte die sucher nur die emojis dort bleiben und alles komplet
nacht links schieiben, die suche sollte folgende animationen haben wenn ich
mist maus drauf/dürber gehe sollte es die suche sich drehen wie eine mottor
und glass efeckt haben wie beim appel."

**Fund:** Die „Sichel" des Themenknopfs war ein Schatten in fester Farbe
(#656079), der in keinem dunklen Schema den Grund traf; beide Zustände
hatten dieselbe Matrix. Darunter dieselbe Funktion dreimal mit drei Regeln:
von „Mitternacht" führte Strg⇧L hin und zurück nach „Standard", die
Staffelei verlor den Akzent. Im Kopf schob `margin-left:auto` die Suche
nach rechts (x 794 bei 1440), „PDF öffnen" trug `plus` wie „Neu" und Text,
⌘ hiess „Werkzeuge", bei offener Lade standen Suche, KI und Konto doppelt,
die Kapsel kannte weder Motor noch Glas, die Kopfknöpfe waren 38 breit.

**Bau:** `Aussehen.grundWechseln` als eine Quelle (merkt das Schema je
Grundton, behält den Akzent); `App.theme`, `StudioSchale.themaWechseln` und
die Staffelei leiten weiter. Das Gestirn: Sonne und Mond aus dem Register
in einem runden Fenster, auf- und untergehend auf der Feder, `role=switch`,
in Ruhe grau. Die Kapsel links (x 196), rechts nur Zeichen (`upload`,
neues `band`), die Zwillinge im Band am Rechner bei offener Lade verborgen
(jeder ruft dieselbe Funktion), der Kopf über dem Band; die Lupe dreht sich
einmal unter Zeiger, Fokus, Strg P und am Telefon beim Drücken, die Kapsel
wird dabei Glas; alle Kopfknöpfe 44 × 44. Und als eigener Commit: „ein Titel" auch am Rechner (die Krume tritt zurück, solange der gleichnamige Titel zu sehen ist; `test580` angepasst). Nichts entfernt ausser dem
Aussehen der Scheibe und den Regeln von `.studio-action`, die niemand mehr
trug.

**Prüfung:** `test602` neu (55/55; gegen `887e71c3` 14/55), `test603` neu
(gegen `887e71c3` 30/61), `test580`, `test584` angepasst und `test482`
erweitert, je erst rot. Gegenproben rot gesehen: der alte Rumpf von
`App.theme`, das Orb-Markup, `margin-left:auto`, die Medienregel, der Kopf
mit `z-index:2`, die Telefon-Glasregel. `test128` angepasst (er mass die verborgene `#mb-suche`; jetzt `#studio-search`). Nachbarn grün: 424, 589, 435, 580, 584, 482, 47, 510, 245, 127, 384, 385, 248, 430, 505, 40, 54, 114, 37, 67, 126, 128, 222, 272, 303, 436, 437, 540, 541, 576, 581, 582, 588, 592, 296, 258, 31, 315, 334, 362, 412, 388 (1854 KB, vorher 1852) und die Dateiwächter. Messung `messungen.md` §96. Bilder vorher und
nachher, 1440/1280/1024/800 und 390, hell und dunkel, alle zehn Schemata —
nicht im Verzeichnis (§55.4).

## 11. Oktober 2026 · E726 nach der Durchsicht — Lernpfad, Breiten, Paar, Name, Chip

**Redur** (Masterprompt vom 29. September, S. 21): „… Und die bereiche
momentan das löschen oder am beste das zur fächer wechseln".

**Fund** (unabhängige Durchsicht; `test601` erweitert, gegen eaf3ab2c2
rot, 80 von 89): eine Stufe im Lernpfad setzte den Fächerfilter und
merkte ihn (Lernpfad 3 → 1 Stufe, „Heute" 27 → 9 Karten, auch nach dem
Neuladen); das README versprach „filtert alles"; zwischen 781 und 899 px
kürzten „Schule / Ausbildung" und „Übersicht" auch ohne Filter (feste
264 px für den Chip); ein Paar hatte an der Naht eine Stufe von 1 px; das
^ neben „Übersicht" hiess „… Lernen"; der Chip sass am Telefon 6 px (ruhig
aus) bzw. 2 px (ruhig an) unter der Mitte der Reiter.

**Bau:** das Thema reist als Argument in die Themenrunde, den Filter
setzen nur Chip und „Themen & Fächer"; README sagt, was der Filter
erreicht und was nicht; `--lw-chip-decke: min(230px, 27%)` statt fester
264 px; `align-self:stretch` am ^; `titel: 'Übersicht'`; der Chip trägt
am Telefon dieselben 12 px wie die Reiterkarte; Banner an E235 und L246.6
richtiggestellt, L246.7 (Tabulatorfolge) neu.

**Prüfung:** `test601` 89/89 (§1g, §1h, §2g, §2h, §6q neu), fünf
Gegenproben G8–G12 in zwei Bauten; Nachbarn und Zahlen in E726 „Nach der
Durchsicht" und `messungen.md` §95.

## 10. Oktober 2026 · E726 — Der Kopf des Lernzentrums in einer Zeile (Masterprompt #1)

**Redur** (Masterprompt vom 29. September, S. 21, zum Foto der
Lernzentrale): „Ganz oben wo menü/ dort sollte wo heute und was neben das
ist im ^ und die unter den das die übersicht neben heute auch mit ^ es nimmt
die anderen wie lernpfand , tranier esc auch mitt. Und die bereiche momentan
das löschen oder am beste das zur fächer wechseln".

**Fund** (`test601` gegen 57a023ecf, 6 von 71): zwei Reihen und zehn
Bedienelemente über der Lernzentrale; das ⌄ an drei Gruppen war Schmuck
(`aria-hidden`, kein Menü — ein Klick sprang auf die erste Ansicht); am
Telefon rollte die Reiterleiste (440 in 232 px), „Fortschritt" stand
abgeschnitten, der Inhalt begann bei y = 169 statt 119; „Bereich" bot in
einem frischen Bestand nur „◎ Alle Bereiche"; ein Klick auf das Thema
„Elektrotechnik" änderte den Titel und liess die Zahlen (7 / 9 / 11)
stehen; `#welt-lernen-noten` und `-stundenplan` öffneten „Heute".

**Bau:** `KLAPPEN` statt `REITER` — „Heute ^" und „Übersicht ^" als
[Hauptteil | ^], der Hauptteil heisst wie die Ansicht, das ^ öffnet
`UI.wahl` (E721); der Fächer-Chip statt des Auswahlfelds (Thema der Karten
∪ Fächer-Datenbank, Filter in `lernkartenRoh` und über das Feld „Fach" in
Prüfungen, Noten, Stundenplan, gemerkt unter `lernwelt:<aktor>:fach`); der
Lebensbereich als Gruppe im Fächermenü; `Learning.topicLabel` ausgegeben;
`routeAusHash` kennt `noten` und `stundenplan`; am Telefon fällt die leere
vierte Rasterspalte weg.

**Prüfung:** `test601` 77/77, sieben Gegenproben; angepasst (nicht
gelockert) `test217` §3, `test565` §2, `test585`, `test206` §7; Nachbarn
und Zahlen in E726 und `messungen.md` §95; offen in L246.

## 11. Oktober 2026 · E725 nach der Durchsicht — ganze Namen, ein gleich breiter Kopf, Enter vor der Uhr, der Grund wie Escape

**Redur** (Masterprompt vom 29. September, S. 13): „… beim suche wenn ich
bei eine pdf oder eine dokument bin sollte mir wie es jetzt ist mir zeiget
wo ich suchen will …".

**Fund** (unabhängige Durchsicht des Stands `ed0bf9d87`; `test600` rot mit
205 von 214 in `287654138`): am Telefon zeigte die Bereichszeile in einer
PDF „Dieses Dokum… · Alle Dokume… · Übe…" (blockierend); in Regal und
Liste stand „Meine Abla… · 7"; „Als Dokumente" trug das Zeichen des Orts
„Alle"; Enter binnen 220 ms in „Dieses Dokument" tat nichts; ein Klick auf
den Grund liess den Fokus auf `<body>` fallen; `test585` prüfte die Marke
im Ortsmenü nur noch am Rechner.

**Bau** (`1136e2118`): unter 520 px weichen die Zeichen der Bereichszeile,
die Namen bleiben ganz; `.bib[data-bib-bereich]` gibt am Telefon das innere
Polster ab (Kopf 334 px in allen drei Formen); `pages` für „Als Dokumente";
Enter geht vor der Uhr direkt an die Suchleiste; der Grund schliesst über
`schliessen()`; `[data-rmo-new]` aus motion.ts.

**Prüfung:** `test600` 214/214, `test585` 93/93 (die Telefonzusage mit
eigener Gegenprobe rot gesehen); Nachbarn und Datei-Wächter in E725 („Nach
der Durchsicht"); Zahlen in `messungen.md` §94; was offen ist, in L245
Punkt 3, 7, 8 und 9.

## 10. Oktober 2026 · E725 — Bibliothek: eine Wahl je Kategorie, eine Suche mit Bereichen (Masterprompt #13)

**Redur** (Masterprompt vom 29. September, S. 13, unter dem Foto der
Bibliothek): „hier habe ich sehr viel zum sehe ich sollte von jeder
kategorie nur eine sehen und die anderen alles unterdem das beim ^ … und
die sucher hier sollte es bei der ganz obe such integriert sein beim suche
wenn ich bei eine pdf oder eine dokument bin sollte mir wie es jetzt ist
mir zeiget wo ich suchen will und lösche es von dem biblotek seite …";
Zustimmung vom 3. Oktober: „die Suchleiste ‚Dokument suchen‘ der
Bibliotheksseite in die globale Suche überführen".

**Fund** (`test600` gegen `acb876c1d`, 30 von 191): 20 Bedienelemente über
dem ersten Deckel, am Telefon der erste Deckel bei y 931 von 844; der Ort
zweimal (Ortsmenü und Wege-Zeile, drei Ziele unter anderem Namen); die
Regalsuche ein Titelfilter („Leitungsschutz" → 0 Deckel); die grosse Suche
ohne Bereich, in einer PDF nur „Überall"; in der Suchleiste ein 📚.

**Bau:** eine Zeile `.bib-wahl` mit Ort-, Art- und Formpille, je mit
`Menue.wahl` (ein Name je Ort, `ORTE` statt `REITER`; die Sammlungen als
Gruppe im Ortsmenü; die Formen nur am Formknopf); kein leeres „Zuletzt";
keine Suchfelder auf der Seite; `Bibliothek.suchBereich()` und
`reiterFilter` (die Ortsregeln einmal); `App.suche(vorgabe, { bereich })`
mit Bereichszeile (`Segment`); `DocumentMode.findenIn`, `findBereich`,
`findBereichMerken`; der Umschalter in der Suchleiste; die Ortspille auch
in „Ausbildung"; die Vorgabe des Ortsfilters heisst „Alle Orte". Gefunden
auf dem Weg: `App.suche(vorgabe)` suchte das Wort nicht; „Alle PDFs · 20"
über zwei PDFs; aus „Ausbildung" kein Weg zurück; zwei „Überall" im Kopf
der Suche.

**Prüfung:** `test600` 196/196 (neu, rot gesehen, fünf Gegenproben);
angepasst und rot gesehen: `test33`, `test202`, `test359`, `test369`,
`test424`, `test428`, `test430`, `test459`, `test585`; Nachbarn und
Datei-Wächter in E725; Zahlen in `messungen.md` §94; was offen ist, in
L245. Start 1860 → 1863 KB.

## 10. Oktober 2026 · E724 · Durchsicht: „✨ KI" ersetzt an der Stelle, 44 px am Finger

**Redur** (PDF vom 29. September, S. 16): „… dort integriert sein also im
passenden ortern" — und E724 versprach daraus: derselbe Befehl tut auf
jedem Weg dasselbe.

**Fund** (unabhängige Durchsicht an d59c5bd35). Über „✨ KI" liess
„Markierung ersetzen" den Block unverändert und hängte die Antwort als
neuen Block ans Ende — das Suchfeld des Menüs nahm die Auswahl mit. Die
acht Seitenaktionen massen 28–30 px, obwohl ihr Grund für den Nebenweg mit
der Schublade gegangen war. `test586` war rot (ein nacktes „Löschen" im
`title`). Ersetzen schrieb ohne Fassung und ohne `herkunft`; eine erwähnte
Seite „Zusammenfassen Woche" startete den Befehl; Datenbankzeilen fehlten in
„Seite erwähnen"; „Für diese Seite" und das Schild ohne Quelle lagen in acht
von zehn Schemata unter 4,5 : 1.

**Bau.** Das Befehlsmenü merkt die Markierung beim Öffnen immer; jedes
Ersetzen legt vorher eine Fassung „vor KI-Änderung" an und markiert den
Block mit `herkunft: 'ki'` (E656); 44 px am Telefon und unter grobem
Zeiger, die Originalmasse am Rechner mit Maus (Grund an der Stelle);
`--text-dim` für Überschrift und Schild; die erwähnte Seite geht vor dem
Befehlsnamen; „Datenbankzeilen" als eigene Gruppe; der Löschknopf nennt die
Fähigkeit auch im `title`; der Fuss des Befehlsmenüs verspricht „@" nur
noch für Schreibbefehle und Fähigkeiten.

**Prüfung.** `test599` erweitert (§3 am Telefon, §7a echtes Blockmenü, §7h
Ersetzen mit Fassung, §9c Erwähnung und Zeilen), zuerst rot 136/144, jetzt
144/144; `test586` 60/60. Sechs Gegenproben je rot gesehen. Lücke L244
Punkte 5 und 6.

## 6. Oktober 2026 · E724 · KI am Ort: „Werkzeuge & Kontext" löst sich auf

**Redur** (PDF vom 29. September, S. 16, am Foto des KI-Fensters): „hier
beim ki sollte alles komplet was beim werkzeuge undkontext seteh dort
integriert sein also im passenden ortern du muss entscheiden was wo kommt
und warum ." Auf Schritt 0 kam keine Antwort; gebaut ist nach den Vorgaben
D1–D11 des Plans.

**Fund.** Die Schublade hielt 19 Bedienelemente in einem 324 px hohen
Kasten, nach Thema geordnet; offen schrumpfte der Chat von 617 auf 293 px.
Dahinter fünf Kataloge und zwei Läufer — „Zusammenfassen" schickte auf drei
Wegen drei Anweisungen, „Korrekturlesen" mit Markierung nur die Anweisung.
Am Telefon lag jedes Menü, das das KI-Blatt öffnet, UNTER ihm (600 gegen
920), und ein Tipp ins sichtbare Feld wählte unsichtbar ein 1,6-GB-Modell.
„Verbundenes" hatte keinen Leser, „@Fähigkeit" war nirgends gebaut.

**Bau.** Jeder Eintrag wohnt, wo er wirkt: die Quellen als Schild mit Reglern
und Zahl am Prompt, die acht Seitenaktionen im leeren Chat („Für diese
Seite"), Nachschlagen und „Befehle und Fähigkeiten" im „+", Agent,
Besprechung, Protokoll und die Einstellungen im ⋯ des Kopfs. EIN Katalog
(`src/register/ki.ts`) und EIN Läufer für Knopf, Befehlsmenü, „@", „/",
Blockmenü, „✨ KI" und Palette; Karteikarten werden echte Karteikarten.
Die Ebenen am Telefon liegen über dem Blatt. „Verbundenes" hat einen
Draht, die Quellen einen Schreiber (Bus), die Webfrage ein Redion-Fenster,
„Fähigkeit löschen" zwei Schritte; die Einstellungen ziehen mit.

**Prüfung.** `test599` (133) neu, zuerst rot (10/92 — hier stand zuerst 9, nachgemessen in der Durchsicht; danach die Richtung Fenster → Einstellungen 116/117 und der doppelte Blatt-Titel 129/133); `test34`, `test436`
§5, `test492`, `test494`, `test544`, `test411` §7, `test537` §3b, `test545`
2b und `test596` §8 erweitert, zuerst rot. Gegenproben je rot gesehen.
Acht Gegenproben. Start 1858 → 1863 KB (Decke 1950). Lücke L244.

## 6. Oktober 2026 · Fläche: eine Leiste je Arbeitskontext, die Tabelle im Kasten (E722, E723)

**Redur:** PDF vom 29. September, Seite 18 unten: „Hier wieder die zeichnen
menüs ist doppelt , es sollte nur die ganez unter bleiben , seihet rote
markierung ,"; Seite 18 oben: „… habe ich eine tabela erstellt und ds hier
es ist hinterden und kann nicht gut lesen".

**Fund:** Ein Whiteboard im Kasten der Fläche brachte seine eigene Leiste
mit — drei Leisten bei zwei Whiteboards, drei gewählte Werkzeuge, drei
Zoomzahlen; eine Taste nahm zweimal zurück, ein Rad bewegte zwei
Ausschnitte, die Hand der Fläche stahl den Strich. Keine Leiste hatte einen
Tabstopp. Die Tabelle im Kasten ragte 51/57 px hinaus (E409 galt auch
dort), „Neu" war beim Überfahren in den hellen Schemata unsichtbar (1,15),
die Auswahlleiste lag auf der Flächenleiste (19 446 px²).

**Gebaut:** ein Schacht in der Fläche (`seitenflaeche.ts`): die Leiste
eines Blocks im Kasten wird herausgenommen und hängt unten, sobald man in
ihn tippt, mit Ring und dem Wort „Zeichenfläche"; `defaultPrevented` in
Taste und Rad; die Hand stiehlt keinen Strich; Strg+Z aus der Leiste wird
weitergereicht; Tab vom Whiteboard in seine Leiste; „Schritt vorwärts" für
die Fläche. Im Kern (`toolbar.ts`) der Tabstopp auch losgelöst. Im CSS
`.pg-flaeche > .gfx-tb-sockel`, `--db-aus:0px` und `--db-grund` im Kasten,
die Griffe im Kasten, „Neu" mit den Marken aus E705, die Auswahlleiste über
der Flächenleiste.

**Nach der Durchsicht** (derselbe Tag): Tab aus der Leiste führt weiter
HINTER das Whiteboard statt an den Anfang der Fläche (§38), und am Telefon
rollt der Streifen zum gewählten Werkzeug (§37), das Schild „Zeichenfläche"
klebt dabei links, und Tab am Telefon findet das Textfeld hinter dem
Whiteboard — `test598` §8/§9 je rot vor der Reparatur, eine Gegenprobe je
Stelle.

**Nach der zweiten Durchsicht** (10. Oktober): die breite Tabelle im
Kasten rollt auch mit dem Rad — quer und mit Umschalt rollt sie, die Fläche
bleibt stehen (vorher schob jedes Rad die Fläche, `links 0`); die mittlere
Taste schiebt ein Whiteboard, statt mit seinem Werkzeug zu zeichnen; die
Leiste nennt den Titel des Whiteboards; Tab aus der Leiste bleibt nicht an
einem Halt ohne Fokus hängen; das Schild am Telefon steht in zwei Zeilen
(106 → 63 px, ein sechstes Werkzeug ganz im Bild); `test598` §4 und
`test575` §6b können jetzt rot werden; README nennt L243.

**Geprüft:** `test598` (neu, 66 Zusagen), `test404` §9, `test572` §13,
`test575` §6b — je rot gegen `1bfaca53` bzw. `f338ae895`, grün danach;
zwanzig Gegenproben; Nachbarn siehe Commits „E722/E723". Start 1850 →
1853 KB. Messung: `messungen.md` §92. Offen: L243.

## 10. Oktober 2026 · E721 nach der Durchsicht — Decke, Ankunft, Stelle, Zeichen, Name, Meldung

**Redur** (Masterprompt vom 29. September, S. 19): „Hier füge ... und oder
beim rechts klicke sollte es mir zeigen löschen" — „Für den rechts klick
bei eine dokument oder eine text usw wo es passen kann".

**Fund** (unabhängige Durchsicht an `ef3e19693`): `test362` §7 rot (eine
rohe 22px im Platzhalter der Ecke); die Ankunft der Karten im Studio weg
(0 von 6 — der Wähler traf die neue `.bib-zelle` nicht); „Zu Favoriten"
und „Duplizieren" aus dem Seitenmenü warfen eine lange Seite an den Anfang;
das Zeichen von „In den Papierkorb" wurde unter Zeiger und Fokus weiss;
`aria-expanded` fehlte am „…" und am ⋯; „Zuletzt geöffnet" hatte kein
Menü; Gruppen in `UI.wahl` ohne Namen; eine scheiternde Aktion sagte
nichts; L242 Punkt 1 behauptete zu viel. Dazu `test580`, an `ef3e19693`
ebenfalls rot und in keiner Liste.

**Bau:** Marke statt roher Zahl (`calc(var(--touch-min) / 2)`);
`:is(.bib-deckel, .bib-zelle)` für die Ankunft; auf der Seite der alte Weg
für Favorit und Duplizieren; `:not([data-gefahr])` in `studio.css`;
`Menue.aufgeklappt` für aria-expanded; der Binder kennt
`.rmo-recent-card`; `role="group"` mit Namen in `UI.wahl`; eine Meldung,
wenn `Register.aktionen.tun` scheitert; L242 Punkt 1 genau, Punkt 5 neu
(Schlucker am Tablet, nicht nachzustellen).

**Prüfung:** `test597` 91/91 (zwölf neue Zusagen, rot gegen `ef3e19693`),
`test362` 18/18, `test580` angepasst (Gefahr am Rechner wie am Telefon
ausgenommen, „Löschen ist rot" jetzt für beide — die Rechner-Zeile ist am
Grundstand rot); zehn Gegenproben in zwei Runden; Nachbarn im Nachtrag von
E721, Zahlen in `messungen.md` §91.

## 6. Oktober 2026 · E721 — Ein Menü je Ding (Masterprompt #9)

**Redur** (Masterprompt vom 29. September, S. 19, unter dem Foto der
Bibliothekskarten, den ☆ oben rechts eingekreist): „Hier füge ... und oder
beim rechts klicke sollte es mir zeigen löschen" — „Für den rechts klick
bei eine dokument oder eine text usw wo es passen kann". S. 13: „… und auch
die rechtsk klickt sollte hier für die ordner haben ."

**Fund** (`test597` gegen 73a956937, 13/75): das ⌄ der Bibliothekskarte war
ein `<i aria-hidden>` von 20 × 20 IM Kartenknopf — für Tastatur und
Vorleser nicht da; Rechtsklick auf Karte, Ablagebaum und Seitenleiste
zeigte das Browsermenü; Umschalt+F10 tat nichts; Pfeil ab im offenen Menü
sprang auf die Karte dahinter; langes Drücken am Telefon öffnete die Seite;
Regal und Tabelle hatten keine Aktion; Entf tat nichts; am Rechner war
„In den Papierkorb" nie rot. Und dieselbe Seite hatte fünf Listen von Hand.

**Bau:** `Register.aktionen` (neu, `register/aktionen.ts`) — jeder Bereich
meldet seine Aktionen; `Menue.aktionen` zeichnet daraus das Menü;
`Menue.aktionenBinden` bindet Rechtsklick, Kontextmenü-Taste,
Umschalt+F10, Entf und langes Drücken (E83, ein Schlucker statt zwei);
Menüs mit Rolle, Pfeiltasten und Fokus zurück; `Menue.wahl` / `UI.wahl`.
Das „…" ist ein Knopf neben dem Deckel (44 × 44, oben rechts); Ablagebaum
(`baum.ts`), Regal, Tabelle, Seitenleiste (Rechtsklick → Seitenmenü, das ⋯
benannt) und Notizhefte (Heft, Fach; halten ohne Bewegung → Menü) haben
dasselbe Menü. Gefahr rot am Rechner wie am Telefon; `data-gefahr` auch an
den Lösch-Einträgen in Dokumenten (L242).

**Prüfung:** `test597` 79/79 (neu, rot gegen 73a956937 mit 13/75; §1b, die
Ecke über dem Vorschautext, rot gegen 25fb7f9d5), `test37`,
`test114` 23, `test303` §7 (erweitert, rot zuerst); fünf Gegenproben,
Nachbarn und Messung im Commit von E721 und in `messungen.md` §91. Offen:
L242 (die Dinge IN einem Dokument, die Datenbankzeile, „Rückgängig" mit der
Tastatur) und die Fragen in AUFGABEN „Nach E721".

## 6. Oktober 2026 · E719 und E720 · Das Herz ist ein Knopf, und kein Knopf wirkt tot

**Redur** (Masterprompt vom 29. September, Seiten 21/22): „die herz beim
hier funktionier nicht also wenn ich das klicke passiert nichts, behebe das
problem" — und: „beim fählermeldung habe ich keien buttons efeck also wie
bein tagesrunde … und bei alle wo eine buttons gibt füge das im
enscheideung und claude.md". Auf Schritt 0 kam keine Antwort; gebaut ist
nach den Vorgaben des Plans.

**Fund.** Das Herz war Schmuck aus E534 (`aria-hidden`, `pointer-events:
none`, der Klick traf die Karte). Und 63 Knöpfe der Lernwelt antworteten
nicht auf den Zeiger — 17 verloren gegen ihre Grundregel, weil `:where()`
der Hover-Regel das Gewicht nahm, 46 hatten gar keine (44 Tagessäulen aus
E713, das Tagesziel, „Alle Dokumente"). Der Funkel zeigte einen kurzen Tipp
nicht, und sein Schein blieb am Telefon unter dem Finger kleben.

**Bau.** E719: der eine Merker (`Merkzeichen`, neue Wahl `form: 'herz'`)
an 22 Kennzahlen aus einem Katalog, gemerkt je Lernendem in meta, Streifen
„Gemerkt" auf Heute, Rückweg mit Hinweis. E720: `:where(` → `:is(`,
Hover-Regeln, wo keine waren, vier stille Funkel neben der Tagesrunde,
`data-gedrueckt` am Funkel, sein Schein nur unter `@media (hover:hover)`;
die Regel in CLAUDE.md §38 (hart) und §39 (Richtwert).

**Prüfung.** `test595` (36) und `test596` (35) neu, beide zuerst rot
(5/34, 16/35); `test433` §7 und `test580` §1/§5 erweitert, zuerst rot. Neun
Gegenproben, je rot gesehen. Start 1850 → 1854 KB (Decke 1950). Lücken
L240 (die Regel für die ganze App) und L241 (Herzen, die Schmuck bleiben).

**Durchsicht vor dem Push** (6. Oktober). Eine unabhängige Durchsicht fand
einen blockierenden Fehler: gesperrte Funkel („Trainieren · 0" bei leerem
Bestand) leuchteten unter dem Zeiger auf und verwischten ihr Wort — ein
toter Knopf, der lebendig tat. Dazu: der Fokus fiel auf `<body>`, wenn man
im Streifen „Gemerkt" ein Herz löste; das Zurück nach einem gescheiterten
Schreiben löschte, was ein anderer Tab gemerkt hatte; der Druck war im
Hellen mit 3 : 1 kaum lesbar; im Starken Kontrast war „Starten" von
„Lernen" kaum zu unterscheiden; der Fokusring des Herzens war gekappt;
`test580` §1 hätte einen dunkel ruhenden Funkel durchgelassen. Zuerst die
Wächter (`test596` §9/§10, `test595` §5b/§6/§7b, `test580` §1 geschärft),
rot gegen 486e500a; dann der Bau — `:where(:not(:disabled))` ohne Gewicht,
Fokus-Rückgabe, reines Zurück über `metaListeAendern`, Tönung über dem
Funkelgrund (16,21 : 1), 2-px-Akzentrand im Starken Kontrast, Ring innen.
Sieben Gegenproben, je rot gesehen. `test595` und `test596` je 41/41.

**Zweite Durchsicht vor dem Push** (10. Oktober). Wieder ein blockierender
Fund: ohne Bewegung (`prefers-reduced-motion`) färbte eine alte Regel die
Buchstaben eines Funkels unter dem Zeiger weiss — seit die vier stillen
Funkel hell ruhen, stand „Trainieren · 0" (gesperrt) am Rechner und
„Trainieren · 2" am Telefon mit klebendem `:hover` weiss auf Weiss,
1,04 : 1. Dazu: der Buchstabenlauf wischte am Telefon eine Viertelsekunde
lang das Wort weg (`:hover` ohne `@media (hover:hover)`); sechs Herzen
hiessen nur in ihrer Ansicht verständlich („Zu Favoriten: fällig"); ein
Kommentar rechnete ein Gewicht falsch; die Kommentare in den Stilblättern
kosteten Startlast. Zuerst die Wächter (`test596` §9 ohne Bewegung, §11
neu, `test595` §10 neu), rot gegen ca4b23190; dann der Bau —
`color:inherit` statt `#fff`, die Wischregel geteilt, ein Feld `allein` im
Katalog der Kennzahlen, die Kommentare gekürzt (Start 1855 → 1854 KB).
Drei Gegenproben, je rot gesehen. `test595` 44/44, `test596` 50/50.

## 6. Oktober 2026 · E718 — Ordner bearbeiten (Masterprompt #12 und die Datenhälfte von #9)

**Redur** (Masterprompt vom 29. September, S. 13): „hier beiM BIBLOTEK KANN
ich wie beim biblotek die ordner farbe oder die ordner selbst nicht
bearbeiten, behebe das problem und auch die rechtsk klickt sollte hier für
die ordner haben ." — S. 19: „… beim rechts klicke sollte es mir zeigen
löschen".

**Fund** (`test594` gegen 1bfaca53, 14/62): das ⌄ „Umbenennen" der
Bibliothek sprang auf die Seite (gegen E380); „   " und Steuerzeichen
wurden gespeichert; Farbe und Name erreichten die Seitenleiste nicht; ein
eigenes Symbol fehlte auf Karte und Baum; ein Ordner auf seinem eigenen
Kind bildete einen Ring; der Papierkorb der Bibliothek schrieb nur
`alive:false` (kein `trashedAt`, im Inhalt des Elternteils, kein
Protokoll, kein Rückweg) und liess die Kinder in Alle/Zuletzt/Favoriten
stehen; und das Blockmenü löschte eine Unterseite samt Enkelseite
ENDGÜLTIG.

**Bau:** `App.umbenennen` (ein Weg für Bibliothek, Notizhefte, Seitenmenü,
Datenbankzeile), `App.nameSaeubern`, `App.nachAenderung`,
`App.inPapierkorb` mit „Rückgängig" in der Meldung (`hinweis.ts`: eine
Handlung, nur bei der neuesten Meldung), die Ring-Prüfung in
`Werkzeuge.verschiebe`, `Bibliothek.alleSeiten` ohne Kinder weggelegter
Ordner, das eigene Symbol auf Karte und im Ablagebaum. Editor: „Löschen",
der Schrägstrich-Befehl und „Ausschneiden" legen in den Papierkorb. Nach
der Durchsicht vom 6. Oktober auch das ⋯ einer Datenbank (vorher
`confirm()` und endgültig weg, samt Sammlung) und Entf auf einer
Mehrfachauswahl; `App.umbenennen` und `App.inPapierkorb` fragen das Recht
an der angefassten Seite (§26); Namen ohne Richtungs-Überschreiber, die
200er-Grenze zählt Schriftzeichen.

**Prüfung:** `test594` 76/76 (neu; nach der Durchsicht §3, §15, §16 erweitert,
rot gegen 32749689 mit 66/76), `test560` §7, `test587` §13, `test588`
§15 (erweitert); Nachbarn und Gegenproben im Commit von E718; Messung
`messungen.md` §89. Offen: L239 (alte Papierkorb-Seiten ohne Frist, die
Regel des Fachs) — Redurs Fragen.

## 6. Oktober 2026 · E717 · Der Seiteneditor ohne Stau

**Redur** (Masterprompt vom 29. September, Seite 5; OneNote-Seite 14):
„Bei pdf wenn ich seiteneditor klicke bleibt es für ca 30-40 sekunden
stiel und dann kommt die dieses seite antwortet nicht und dann kann dort
nicht mehr bearbeiten oder ändern ." Abnahme: „Fortschritt/Ladezustand
anzeigen … Fehler werden nachvollziehbar gemeldet."

**Gefunden** (rot nachgemessen auf `1bfaca53`, `test593`): jede PDF-Seite
meldete beim Bau ihrer Leiste ihre Fläche beim `Zeichenziel`, das jeden
Horcher SOFORT rief; das Menüband baute sich jedes Mal neu und zwang mit
`scrollIntoView` ein Layout der wachsenden Seite — 2N+3 Layouts, 271 bei
134 Seiten (11,4 s am Rechner, 49 s am Telefon). Dazu zeichnete die
Seitenansicht alle Seiten (rund 50 000 Knoten), und die Aufräumregel des
Zeichenziels warf jede Fläche nach der ersten weg: Band und
Werkzeugtasten trafen Seite 1, gleich welche man anfasste — auch auf jeder
gewöhnlichen Seite mit mehreren Blättern.

**Gebaut:** eine Meldung je Durchgang und `imBau` im Zeichenziel; ein
Neubau des Bands nur, wenn sich für „Zeichnen" etwas ändert; E299 für die
Seitenansicht (`Nahzeichnen` in `editor.ts`: gezeichnet wird, was eine
Bildhöhe um das Fenster liegt, fokussiert oder angetippt wird; der Rest
steht als Platz in der richtigen Höhe mit „Seite N wird vorbereitet …");
„Seiteneditor" zeigt `aria-busy`, öffnet an der gelesenen Seite, bleibt bei
einem Fehler im Dokument und meldet ihn; eine Seite, die sich nicht
zeichnen lässt, sagt es und bietet „Neu zeichnen"; am Telefon das
Seitenzeichen statt „✕". Dieselbe Seite neu gezeichnet behält die
Lesestelle (gefunden auf dem Weg).

**Geprüft:** `test593` neu (46 Zusagen, rot 8/39 gegen `1bfaca53`) und
`test247` §11 erweitert (drei Blätter), beide zuerst rot; sechs Gegenproben
je rot gesehen; die Nachbarn unter dem Schloss (`messungen.md` §88); Bilder
vorher und nachher, Rechner und Telefon, hell und dunkel, nicht im
Verzeichnis (§55.4). Nichts entfernt. Offen: L238.

**Durchsicht** (unabhängig, vor dem Push): zwei Verluste gegenüber
`1bfaca53` gefunden und behoben — ein Sprung (`App.zeigeBlock`,
`#block=`, Suchtreffer, Rückverweise) in ein Blatt, das noch ein Platz
war, fand sein Ziel nicht; und Strg+F zählte nur gezeichnete Blätter.
`Blocks.zeichneFuer` und `Blocks.zeichneFuerSuche` zeichnen jetzt vorher,
was gebraucht wird — für Strg+F nur, was der gespeicherte INHALT eines
Blatts trägt, damit nicht ein Buchstabe alle Seiten zeichnet; `test593`
§11/§12 (rot 46/53, dann 54/54), vier Gegenproben je rot. Dazu: die Lesestelle vergisst sich nach einer
Sonderansicht, und der Kommentar über die Fläche sagt, was wirklich
geschieht (eine Mikroaufgabe später, nicht „sofort").

## 6. Oktober 2026 · E716 · Der Trenner zieht wirklich

**Redur:** Masterprompt vom 29. September, Seite 25 (Foto Seite 26): „der
linie wo man die feld grösser und kleiner macht , funktioniert nicht…"

**Fund:** Die Breite der Studio-Navigation wurde als
`--studio-nav-expanded` an `<body>` geschrieben, `--studio-nav-width` aber
auf `:root` daraus abgeleitet — `var()` gilt dort, wo es steht. Die Spalte
blieb bei 184 (156 bei 761–1100 px), Attribut und Gedächtnis zogen mit
(vorher: Maus +50 → Spalte 184, aria 234; bei 1024 ohne Ziehen Spalte 156,
aria 184). `test424` hatte nur das Attribut geprüft, das der Griff selbst
schreibt.

**Bau:** Ableitung auf `body` (studio.css, beide Stellen); der Start
schreibt nur eine gemerkte Breite; das Attribut kommt aus der gezeichneten
Breite (ResizeObserver); `breiteZuruecksetzen()` für Doppelklick und den
Palettenbefehl „Navigationsbreite zurücksetzen"; `isPrimary`, rAF,
`lostpointercapture`, Escape, kein Merken beim Klick; Umschalt+←/→ und
Bild↑/↓ 32 px; 16-px-Fläche mit einer Griff-Pille wie im Touch Kit (als
Redion-CSS), Fokusrahmen, mit Finger 20 px (genau die Lücke zwischen den
Knöpfen, Kante−8 bis Kante+12) und `--touch-min` im Quadrat um den Griff;
der Palettenbefehl schweigt im Fokus-Modus. Nichts entfernt; die alten Griffe der Seitenleiste bleiben
unberührt (L237, AUFGABEN).

**Prüfung:** `test592` neu (59/59; gegen `1bfaca53` 12/58, §13 kam nach
dem Bild dazu), `test424`
(52/52) und `test40` (27/27) erweitert, je erst rot. Neun Gegenproben rot
gesehen. Nachbarn grün: 245, 272, 430, 52, 143, 303, 296, 388 (1852 KB,
vorher 1850), 362, 412, 126. Messung `messungen.md` §87. Bilder vorher und
nachher, 1440 und 1024 hell und dunkel, 390 dunkel — nicht im Verzeichnis
(§55.4).

## 5. Oktober 2026 · Zusammenführen der zweiten Welle auf `claude/morgen-besser-2`

**Redur:** Auftragsdatei vom 5. Oktober: „Lege `claude/morgen-besser-2` von
`claude/morgen-besser` (`4d9a9a3fb`) an", die acht Zweige in fester Folge,
„Zähler werden neu gezählt, nie von einer Seite übernommen", „Nur ein
Goo-Filter: Löschen-Knopf und Tropfen teilen sich `Linse.TROPFEN`."

**Zusammengeführt** (je `git merge --no-ff`, nach jedem die Datei-Wächter
550, 549, 225, 401, 402, 537, 290, 298, 410, 400, 109, 87, 105):
rot-zuerst-inseln (E714) → startlast-leichter (E715) → rot-zuerst-stift
(E708) → loeschen-fluessig (E709) → dialoge-im-kit (E710) →
suche-und-meldungen (E711) → tropfen-und-kacheln (E712) →
zeitpille-und-balken (E713). Die Doku nach EINTRÄGEN, nicht nach
Git-Blöcken (P121); die Zähler nachgezählt (P122): 694 Entscheidungen,
E1 bis E715; 532 Läufe; 131 Lücken, 75 offene, 56 geschlossene. E715 auf
die neuen Quellen der Welle: `delete.ts`, `kacheln.ts`, `tropfen.ts`
tragen die ERZEUGT-Zeile. Start 1850 KB gzip, Decke 1950.

**Was beim Zusammenführen gebaut wurde:**
- Der EINE Escape-Griff (P123): E710, E711 und E713 hatten ihn je
  erweitert; jetzt drückt er das ✕ des Zeitmessers (E713), ausser der
  Fokus steht im Text, und `warOffen` (E711) gilt auch für den Zeitmesser.
- Ein Klebefilter für die ganze App (P124): Löschen-Knopf und Meldungen
  leihen `Linse.TROPFEN`; `test589` §15.
- Eine Federsprache: „Alle gelesen" fährt die Feder `knapp` statt einer
  eigenen Kurve (`test581` §9); keine Blase unter dem offenen „+"-Menü
  (`test589` §1).
- `test33` tippt den Spaltennamen ins Fenster des Kits (E710), statt
  `value` zu setzen und einen Knopf zu suchen, den es dort nicht gibt — auf
  `claude/dialoge-im-kit` allein war er rot (104/105).

**Geprüft:** die Vereinigung der Wächter aller acht Zweige unter dem
Schloss; die Gesamtbilder (Rechner und Telefon, hell und dunkel) liegen
nicht im Verzeichnis (§55.4).

## 3. Oktober 2026 · E715 · Der Start holt ein Drittel weniger

**Redur:** am 27. September „… ohne eine funktione löschen …", am
3. Oktober ca. 19:35 UTC „Weiter ohne pause,".

**Gefunden:** Die zweite Welle (E708 bis E714) passte zusammen nicht unter
die Startdecke von 2850 KB (`test388` §5; morgen-besser stand bei 2826).
Gezählt: 1039 der 2826 KB waren Kommentare im erzeugten JavaScript — tsc
liess sie stehen (`removeComments: false`).

**Gebaut:** `removeComments: true` in `tsconfig.bauen.json`; `src/` behält
jeden Kommentar. Jede der 227 Quellen beginnt mit einer Zeile
`/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/… */`, die im `.js`
stehen bleibt (`dienststand.mts` und `chronik.mts` schreiben sie selbst).
`sw.js` behält seine Kommentare. Start 2826 → 1805 KB, Einzeldatei
11,8 → 9,1 MB; die Decke sinkt auf 1950 KB.

**Geprüft:** `test105` §3 jetzt für alle 227 erzeugten Dateien und
`test388` §5 mit der neuen Decke, beide zuerst rot gegen 4d9a9a3fb;
`test272` liest die Quelle. Jede erzeugte Datei ist Byte für Byte, was tsc
aus den Quellen von 4d9a9a3fb ohne Kommentare macht (ausser der ersten
Zeile); 34 Datei- und 103 Browserläufe, die `quell/` oder die Einzeldatei
lesen, wie auf dem Grundstand (messungen §86). Nichts gelöscht, nichts
später geladen.

**Offen:** neue Quellen der zweiten Welle (`delete.ts`, `kacheln.ts`,
`tropfen.ts`) bekommen die ERZEUGT-Zeile beim Zusammenführen; die
Kommentare der Stilblätter (261 KB) bleiben — CSS ist Quelle.

**Durchsicht (5. Oktober):** derselbe Code noch einmal, diesmal mit einem
zweiten Parser (oxc): 226 von 227 Bäumen alt mit und neu ohne Kommentare
gleich, `stand.js` im Stempel; die Zahlen selbst gezählt; 108 Bilder
Grundstand gegen Zweig (index.html und Einzeldatei, Rechner und Telefon,
zehn Schemata, „Ruhige Darstellung", Strg P, 13 Wege), kein Fehler.
`test105` §3 verlangt jetzt auch die EIGENE Quelle in der Zeile; die
Verweise auf E715 in E28, E389, E613, E688 und L216; README ohne den
veralteten Satz „Ein Prüflauf ist rot (L146)"; `umzug.mts` setzt die
Zeile selbst.

## 3. Oktober 2026 · E714 · Rot zuerst, vier Inseln

**Redur:** am 3. Oktober „Weiter ohne pause"; dazu weiter vom 27. September
ca. 22:10 „… ohne eine funktione löschen …".

**Gefunden und behoben:** In der Einzeldatei hängte das Vorwärmen der Inseln
ein Stilblatt-`<link>` auf eine Blob-Adresse ein (seit E699) — jetzt ein
angenommenes Blatt, im Ordner bleibt das `<link>`, ältere Browser bekommen
den alten Weg. `test582` wartete auf die Wandzeit, während SwiftShader über
dem Zeichenblatt das erste Bild erst nach einer halben Sekunde zusammensetzte
— jetzt auf die Uhr der Animationen, mit der Zusage „höchstens 700 ms".
`test247` las beim Keilmarker (E704) den Strich statt der Fläche, `test464`
zählte die Leiste vor „Text ändern" (E671).

**Geprüft:** `test492` erweitert und zuerst rot eingecheckt; je Lauf halbiert
und mit Gegenprobe rot gesehen; die Nachbarn in der Commit-Nachricht. Keine
Funktion weg.

**Durchsicht (4. Oktober):** jede geänderte Zusage alt gegen neu gelesen.
Eine Lücke gefunden und geschlossen: `test582` fragte „Toast und Lader sind
da" seit E714 erst nach dem Warten — jetzt steht `.show` des Toasts schon
bei 700 ms fest. `test579` §9 misst in der Einzeldatei jetzt auch, dass das
angenommene Blatt wirkt (44 px, genau eines, kein `<link>`). Beide
Erweiterungen mit Gegenprobe rot gesehen.

## 5. Oktober 2026 · E713 · Vierte Durchsicht der Zeitpille und der Balkenkarte

**Redur:** am 27. September um ca. 22:10 „… ohne eine funktione löschen …",
am 3. Oktober um ca. 19:35 „Weiter ohne pause,".

**Gefunden:** die Reparatur der dritten Durchsicht lag ungesichert im Baum
— gelesen, bytegleich neu gebaut, rot und grün gesehen, eingecheckt. Dazu,
zuerst rot: am Telefon lag ohne Netz der Offline-Streifen auf Start · Pause
· Beenden der offenen Karte; ein Tipp auf „Pause" traf den Streifen.

**Gebaut:** am Telefon steht die offene Karte über den länger lebenden
Meldungen (Streifen, Einladung, Lader), auf den Stufen des Toast-Stapels.

**Geprüft:** `test590` §16 (rot zuerst), Gegenprobe, Nachbarn und Startlast
stehen in E713 („Die vierte Durchsicht").

## 5. Oktober 2026 · E713 · Dritte Durchsicht der Zeitpille und der Balkenkarte

**Redur:** am 27. September um ca. 22:10 „… ohne eine funktione löschen …",
am 3. Oktober um ca. 19:35 „Weiter ohne pause,".

**Gefunden:** die zweite Durchsicht war fertig gebaut, aber nicht
eingecheckt — selbst nachgeprüft und eingecheckt. Dazu, je zuerst rot: am
Telefon lag ein Toast auf der offenen Karte (über Start · Pause ·
Beenden); „Beenden" mitten in der Fahrt liess eine versteckte Pille samt
Polster zurück; `test303` war seit dem Bau von E713 rot (ein Selektor
nannte `.rmo-tr-sym`).

**Gebaut:** der Toast geht bei offener Karte am Telefon nach oben (eigene
Regel neben der für offene Fenster); am Ende der Fahrt geht die Pille, wenn
die Uhr aus ist; der Selektor der verborgenen Figur nennt nur
`[data-figur]`.

**Geprüft:** `test590` §15 (rot zuerst), die Gegenproben, `test303`,
Nachbarn und Startlast stehen in E713 („Die dritte Durchsicht").

## 4./5. Oktober 2026 · E713 · Durchsicht der Zeitpille und der Balkenkarte

**Redur:** am 27. September um ca. 22:10 „… ohne eine funktione löschen …",
am 3. Oktober um ca. 19:35 „Weiter ohne pause,".

**Gefunden** (je zuerst als Lauf, `test590` §10–§14 rot gegen `fb7e590e`):
die Pille lag am Telefon auf der Werkzeugleiste der Fläche, auf dem runden
Knopf „Neu" der Notizhefte, auf der Zeichenleiste unten und auf dem Letzten
jeder Ansicht, am Rechner auf dem KI-Panel; ein Toast lag am Telefon auf
ihr; der Monatsverlauf versteckte Zahlen und Wochentage, die vorher
sichtbar waren, und seine Säulen waren am Telefon 9 px breit; beim Öffnen
sprang die Summe zurück auf 0; der Name der Pille wechselte jede Sekunde;
Escape mitten in der Fahrt tat nichts.

**Gebaut:** die Pille steht auf `--melde-boden` und bekommt ihren Platz als
Polster, der runde Knopf rückt über sie, beim Schreiben tritt sie zur
Seite, neben dem offenen KI-Panel steht sie links davon; was sonst meldet,
rückt am Telefon über sie. Der Monatsverlauf steht in Zeilen zu zehn mit
allen Zahlen und Namen, ↑/↓ gehen eine Zeile. Ein zweites Zeichnen fährt
weiter, statt neu anzukommen. Der Name der Pille nennt Minuten. Die
verwischte Kopie trägt kein `data-esc-knopf` mehr.

**Geprüft:** `test590` (sechs neue Zusagen-Gruppen, rot zuerst), die
Gegenproben, Nachbarn und Startlast stehen in E713 („Die Durchsicht").

## 28. September 2026 · E713 · Die Zeitpille und die Balkenkarte

**Redur:** um ca. 22:05 das Video „LIQUID GLASS" und dazu „Schau mal das
auch an ich will das auch haben"; um ca. 22:10 „… bessere übergagnge
besssere efeckten , bessere oberfläsche alles …".

**Gefunden:** Nach ✕ lief der Zeitmesser unsichtbar weiter
(`Zeitmesser.stand()` sagte `laeuft:true`, der Schirm nichts); das Feld
schloss nicht auf Escape und liess am Telefon den Seitentext durchscheinen.
Der Lernverlauf („Letzte 7 Tage", „Wochenverlauf", „Monatsverlauf") war
eine Reihe stummer `<progress>`, und kein Lauf las ihn.

**Gebaut:** eine dunkle Pille „⏱ 24:13 · Seite" über der unteren Leiste,
solange die Uhr läuft und das Feld zu ist; ein Tipp lässt die Karte aus ihr
wachsen (Feder des Materials, nur `transform`/`opacity`, Unschärfe als
stille Kopie), ✕ und Escape ziehen sie zurück, der Fokus folgt. Die Karte
hat die Seite als Titel, beim Timer einen echten Fortschritt, Pause ↔
Weiter tauscht im selben Knopf (Zeichen-Tausch wie im Kit); am Telefon
deckend, am Rechner Glas. Der eine Escape-Griff kennt schwebende Felder
(`data-esc-knopf`). Der Lernverlauf ist eine Karte: die Summe zählt hoch,
die Balken wachsen einmal, ein Tag lässt sich mit Tipp und Tasten wählen —
das Material aus E706 gleitet dahinter, ein Hinweis nennt „Fr · 9
Wiederholungen". Ohne Bewegung steht alles sofort.

**Geprüft:** `test590` (neu, rot zuerst), die Gegenproben und die Nachbarn
stehen in E713.

## 28. September 2026 · E712 · Tropfen, Linse und Kacheln aus dem Liquid-Glass-Video

**Redur:** um ca. 22:05 zum Video „LIQUID GLASS": „Schau mal das auch an ich
will das auch haben"; um ca. 22:10 „… ohne eine funktione löschen bessere
ordnungen bessere übergagnge besssere efeckten , bessere oberfläsche …".

**Gefunden:** Das „+" im Studio-Kopf öffnete „Neu erstellen" am Rechner bei
(0, 0) — oben links, 869 px vom Knopf. Das „⋯"-Menü lag über seinem Knopf.
Der Kreis Hell/Dunkel und das Merkzeichen hatten je zwei Abschriften.

**Gebaut:** `Menue.menu` kennt einen `anker` und stellt das Menü an ihn;
die Scheibe wächst aus dem Knopf, ein Tropfen teilt sich in drei runde
Glasknöpfe (PDF einlesen · Neue Seite · Notizbuch; Präsentieren ·
Merkzeichen · Teilen und ausgeben), jeder Eintrag bleibt darunter; zu
fliesst er zurück (`tropfen.ts`, EIN Goo-Filter `Linse.TROPFEN`, nur
während des Fliessens). Die Linse gleitet einmal über „Aufmachen. /
Weiterdenken." (`Linse.ueberSatz`, die Brechung `FAHRT`). Sieben
Glaskacheln oben in „Mehr" und in Einstellungen → Allgemein
(`kacheln.ts`), gerollt eine Chipleiste; die Felder bleiben.
`StudioSchale.themaWechseln` und `App.favoritKippen` sind je EIN Weg.

**Geprüft:** `test589` (72 ok, 0 offen), rot gegen `b3cf1933` (28 ok, 44 offen); fünf
Gegenproben rot gesehen; die dreizehn Dateiläufe grün; die Browser-Nachbarn folgen im Nachtrag.

**Durchsicht (4. Oktober 2026):** zwölf Funde, alle behoben (E712,
„Durchsicht“): der Tropfenfilter dauernd im Halter (`test539` §2 rot), ein
Gelb von Hand (`test584` §11 rot), das Merkzeichen sagte darunter das
Gegenteil, am Telefon flossen die Tropfen 743 px abwärts, Vorleser hörten
die Überschrift doppelt, die Linse lag nach einer Grössenänderung neben dem
Wort und unter Kontrast über der Schrift, der Daumen stellte die Schrift
statt zu rollen, zwei Kachelnamen abgeschnitten, der Stand unter 4,5 : 1,
ein Beobachter ohne Ende, die Bilder fehlten. `test589` 91 ok (rot gegen
`f6b9f007`: 74 ok, 17 offen), zwei Gegenproben rot gesehen, die
Browser-Nachbarn gelaufen; `test388` §5: 2840 KB.

**Nachtrag der zweiten Durchsicht (5. Oktober 2026):** sechs Funde, alle
behoben (E712 Punkte 13–18): die runden Knöpfe nahmen der Liste Platz
(„Volle Breite", „Pfadnavigation", „Seite anpassen" unter dem Rand), „Neu
erstellen" aus der Kante und „Alle Wege …" der Notizhefte wuchsen aus dem
„+" oben rechts, ein Maus-Zug am Regler endete draussen nicht, die Kachel
„Zeitmesser" stand still, die ruhende Linse zeigte „ken" doppelt, jeder
Besuch in „Mehr" liess einen Beobachter stehen. `test589` 100 ok (rot gegen
`510f3971`: 91 ok, 9 offen), zwei Gegenproben rot gesehen; `test388` §5:
2841 KB.

**Dritte Durchsicht (5. Oktober 2026):** zwei Funde, behoben (E712 Punkte
19–20): die Kachel „Zeitmesser“ in den Einstellungen öffnete die Uhr
hinter dem Fenster (stillgelegt, sichtbar nichts), die Namen unter den
runden Knöpfen lagen im Blatt am Telefon bei 4,36 bis 4,47 : 1. `test589`
103 ok (rot gegen `957abea4`: 101 ok, 2 offen), zwei Gegenproben rot
gesehen, die Browser-Nachbarn gelaufen; `test388` §5: 2841 KB.

## 4. und 5. Oktober 2026 · E711, Durchsicht · Der Fächer geht wieder zu, ein Escape tut eines, die Marke ist lesbar, der Strich kommt an, die jetzige Wahl bleibt markiert, „KI" bleibt frei, eine Kladde lässt sich unter einer Meldung wieder tragen

**Redur:** am 3. Oktober um ca. 19:35 UTC „Weiter ohne pause," — und weiter
„ohne eine funktione löschen".

**Gefunden:** Mit der Tastatur geöffnet blieb der Fächer an der Glocke nach
einem Klick daneben, nach Tab und nach Strg P stehen (über der Suche); am
Telefon nach langem Drücken. Nach „Alle gelesen" fiel der Fokus auf `body`,
und die Karten flossen ins Leere, weil die Glocke schon weg war. Ein Escape
in der Suche schloss die Suche UND räumte die Meldungen ab. Die Schrift auf
der Marke fiel in mehreren Schemata unter 4,5 : 1 (der Stern der Palette bis
1,0). Ein Strich auf der Tafel, der unter einer Meldung begann, kam mit 8
von 170 px an.

**Gebaut:** Klick oder Tipp daneben, Tab, ein Fokus anderswo schliessen den
Fächer; die Glocke sagt `aria-expanded`; der Fokus bleibt im Kopf; die
Glocke steht, bis die Karten in ihr sind. Der gemeinsame Escape-Griff merkt
sich im Einfangen, ob ein Fenster offen war. Volle Schrift auf der Marke,
der Chip ohne Tönung, der Stern in der Farbe der Zeile. Ein Zug unter einer
Meldung gehört ihr nur, wo die Fläche darunter das Waagerechte nicht selbst
nimmt; ein Schnippen zählt nach der letzten Bewegung.

**Vierte Durchsicht (5. Oktober):** im Menü mit Suche verlor die jetzige
Wahl (`.on`, „Quelle wechseln") ihre Fläche — der Akzent der Marke gilt
jetzt nur in Suche und Palette. Der Fächer flackerte, solange der Zeiger
auf der Glocke ruhte (die Karten fliegen unter ihm hervor) — ein
`pointerenter` baut ihn nicht mehr neu. Er deckte die Blase der Glocke halb
zu — sie geht, solange er offen ist. Wächter `test588` §12.

**Fünfte Durchsicht (5. Oktober):** der Fächer, der beim Zeigen aufgeht,
lag am Rechner über „KI" und „Favorit" direkt unter der Glocke; wer von der
Glocke dorthin wollte, fuhr in ihn hinein, und ein Klick traf eine Meldung
(die vierte Durchsicht hatte es Redur offen gelassen, L232 Punkt 10). Er
geht jetzt unter der Reihe auf, die direkt unter der Glocke steht
(`unterDerReihe`); wer in ihn hinein will, quert die Reihe. Wächter
`test588` §13. Dazu die acht Gegenproben, die beim Abbruch der vierten
Durchsicht noch fehlten. Die sechste Durchsicht (5. Oktober abends) hat den
Endstand gemessen — `test588`, die Sonden, `test388`, die Bilder und die
Nachbarn, unter dem Schloss — und eingecheckt.

**Sechste Durchsicht (5. Oktober abends):** in den Nachbarn waren drei
Läufe rot, die auf `b3cf1933` grün sind — alle drei von E711. Am Telefon
kam eine lange gedrückte und gezogene Kladde nicht mehr an, wenn eine
Meldung darüber lag (`test360`): der Stapel nahm jeden waagerechten Zug.
Jetzt gehört ein Zug, vor dem der Finger länger als 300 ms ruhte, dem, was
darunter liegt (Wächter `test588` §14, rot gesehen). Eine rohe `28px` zu
viel in `studio.css` (`test362`) ist weg, Bild für Bild dasselbe. Und
`test114` mass die Filter der Suche mitten im Aufgehen (41,8 statt 42 px);
er misst jetzt, wenn die Suche steht, und prüft dazu, dass sie
spätestens nach 1,5 s steht. Gegenproben (vier, alle rot gesehen) und
35 Nachbarn im Nachtrag zu E711; `test588` 72 von 72, dreimal.

**Geprüft:** `test588` §11 (rot gegen `556ffdaa`: 46 von 57), §12 (rot
gegen `6853b992`: 47 von 63, und gegen die Reparatur der Durchsicht: 58 von
63) und §13 (rot gegen die Reparatur der vierten Durchsicht: 66 von 68),
danach 69 von 69 auf dem Endstand; Gegenproben und Nachbarn im Nachtrag zu
E711, `test388` §5 2838 KB (Grundstand 2825, Decke 2850).
Nicht von E711, aber gefunden: die Trefferzeilen am Telefon sind 39 px
(L232 Punkt 9); im Schema „Starker Kontrast" ist am Telefon der aktive
Reiter der unteren Leiste leer (auf `b3cf1933` genauso, E705).

## 28. September 2026 · E711 · Die Suche wächst aus der Kapsel, die Meldungen stapeln sich

**Redur:** um ca. 22:05 das Video „Liquid Glass" und dazu „Schau mal das
auch an ich will das auch haben"; um ca. 22:10 „… bessere übergagnge
besssere efeckten , bessere oberfläsche alles …" — „ohne eine funktione
löschen".

**Gebaut:** Die Suche geht aus dem Knopf auf, der sie trägt
(`SelectionFlow.growFrom`, `--feder-sanft`); neue Treffer kommen
nacheinander (`stagger`, nur die neuen); EINE Marke gleitet mit ↑ ↓ auf der
Kit-Feder zur Wahl (`highlight`/`glide`, vier Bahnen, umlenkbar) — in der
Suche, der Befehlspalette und im Menü mit Suche, ohne die Liste je Pfeil
neu zu bauen; „↵ Enter" auf der Marke. `#toast` wird ein Stapel aus bis zu
drei Meldungen (`#ru-toast-stapel`), Escape räumt ab, ein Finger wischt
weg. Die Glocke öffnet weiter den Posteingang und fächert beim Zeigen oder
langen Drücken die letzten drei Meldungen auf; „Alle gelesen" fliesst zäh
in sie zurück (EIN Goo-Filter, nur während es fliesst). Der Posteingang
zeigt Glaskarten.

**Geprüft:** `test588` (rot auf `b3cf1933`), Nachbarn in E711.

## 5. Oktober 2026 · E710 Durchsicht · Was die Aufrufer mitbringen, bleibt

**Redur:** am 3. Oktober um ca. 19:35 „Weiter ohne pause,"; am 5. Oktober
um ca. 14:15 „Also an was du jetzt macht mache es jetzt fertig und danach
arbeite nicht mehr weiter …".

**Gefunden** (jeden Weg der Fragen im Browser nachgegangen, Rechner und
Telefon, Tastatur, file:// und Einzeldatei, ohne React): das Kit-Fenster
setzte den eigenen Abbruch eines Aufrufers immer ans Ende — bei „Blatt
löschen?" stand der Fokus auf „Löschen", und ein Enter löschte das Blatt;
vier Aufrufer, die ihren Abbruch „Abbrechen" unter der Kennung `nein`
nennen, bekamen ein zweites „Abbrechen" daneben; stolperte die Insel beim
Zeichnen, blieb eine unsichtbare Ebene über der Seite, alles still, und die
Frage kam nie; mit „Ruhige Darstellung" stand das Fenster nach der Antwort
noch 240 ms regungslos, und die letzte Insel nahm das Etikett
`data-ui-motion` (E702) mit; ohne Inseln hatte `Dialog.bestaetigen` kein
sichtbares „Abbrechen".

**Gebaut:** die Knöpfe in der Folge des Aufrufers, sein Abbruch an seiner
Stelle (`dialog.tsx`); ein „Abbrechen" unter `nein` ist DAS Abbrechen; ein
Zeichenfehler der Insel lässt das bisherige Fenster fragen, und Escape
nimmt einen Träger ohne Kit-Fenster weg (`dialog.ts`, `schale.ts`); bei
„ruhig" ist ein gehender Träger sofort unsichtbar (`aufbau.css`), und die
Brücke lässt `data-ui-motion` stehen, solange „ruhig" gilt (`bridge.tsx`);
der Rückweg für Ja/Nein mit „Abbrechen", bei Gefahr zuerst.

**Geprüft:** `test587` §12 (rot gegen den Endbau 1654e75d9: 80/17, alle
17 in §12; jetzt 97/97); in der finalen Durchsicht §12 d) auf eine frische
Seite gelegt (vorher gegen den Endbau aus dem falschen Grund grün) und je
Korrektur eine Gegenprobe; die Nachbarn, die Bilder vorher/nachher und die
Kosten im Commit „E710: Durchsicht".

## 3. und 4. Oktober 2026 · E710 Nachtrag · Der Endbau im Browser, die erste Frage aus der Einzeldatei

**Redur:** am 3. Oktober um ca. 19:35 „Weiter ohne pause,".

**Gefunden:** Der Endbau von E710 hatte keinen Browserlauf. Jetzt
gelaufen (22 Nachbarn, zweimal): grün bis auf fremde Rote (auf der Basis
`b3cf193` mit denselben Zeilen ebenso rot: 343, 348, 464, 470, 582) und
`test458` §3c — er mass das Aktionsblatt am Telefon 450 ms nach den
Knöpfen, mitten in der Feder (796 ms). `test587` §11 (neu) fand im
bisherigen Fenster einen alten Fehler: mit Enter beantwortet, kam dieselbe
Frage sofort wieder (der Tastendruck fiel auf den Knopf, dem Fokus den
Fokus zurückgab).

**Gebaut:** `frageAlt` und `mehrzeiligAlt` verhindern den Tastendruck nach
der Antwort, wie das Fenster des Kits; sonst unverändert (§43). `test458`
misst nach der Ankunft (`wahlDa`), nicht nach einer festen Pause.

**Geprüft:** `test587` §11 (Einzeldatei allein, ohne Netz: die erste Frage
nach 22 bis 71 ms im Kit; Fokus zurück zum Auslöser nach Escape, Enter und
`Dialog.bestaetigen`; Gegenprobe ohne React-Behälter), die Gegenproben für
§8 und §11 (ohne beide Rückgaben des Fokus rot), die Nachbarn und die
Bilder im Commit „E710: Nachtrag".

## 28. September 2026 · E710 · Die Fragen der Schale im Fenster des Touch Kits

**Redur:** um ca. 21:49 „was du beim touckit gebaut hast ich will alles so
haben mit redion passende inhalten"; um ca. 22:10 „du muss ofne pause an
redion arbeiten ich will wenn ich am morgen die redion öfnnen eien komplet
besseren webseit sehen ohne eine funktione löschen bessere ordnungen
bessere übergagnge besssere efeckten , bessere oberfläsche alles kannst du
nur an reddion arbeiten".

**Gefunden:** Die Fragen standen als Kasten oben im Bild (am Telefon oben
angeklebt), verschwanden ohne Übergang, die Wahl hatte keinen sichtbaren
Abbruch. Ein Kit-Fenster über einem alten legte beide still (gemessen), der
gemeinsame Escape-Griff nahm das Fenster darunter weg, „Ruhige Darstellung"
erreichte die Federn des Kits nicht, und der Zeitmesser ging auf Escape
nicht zu.

**Gebaut:** das Kit neu geholt (d21c402) und unter Redions strengen
Schaltern geprüft; die Insel „dialog" (`src/islands/dialog.tsx`) für
`Dialog.frage/wahl/mehrzeilig` — Mitte mit Feder, Glas, Hinweise, sichtbares
„Abbrechen", am Telefon ab drei Antworten das Aktionsblatt — in einem
`.overlay`-Träger, den Fokus und der Escape-Griff kennen; das bisherige
Fenster als Rückweg; Vorwärmen beim ersten Tipp; `Dialog.bestaetigen` und
`Dialog.melden` (sechs Browserfenster umgezogen); Zeitmesser auf Escape.

**Geprüft:** `test587` (neu, rot zuerst), `test578` (Neuholen, Stufe 1b,
strenge Schalter, Glas-Überschreibung), die Nachbarn im Commit
E710.

## 5. Oktober 2026 · E709 Durchsicht · Der Name sagt, was weggeht; unter dem Zeiger ganz und lesbar; der Fokus fällt nicht auf den body

**Redur:** „Weiter ohne pause" (3. Oktober).

**Gefunden:** am Rechner ruht der Zeiger nach dem Druck auf der roten Pille
— ihre rote Tönung beim Überfahren nahm dem roten Wort in fünf dunklen
Schemata den Kontrast (Standard 3,94, Wald 3,81, Mitternacht 4,19, Rosé und
Touch Kit dunkel 4,05 : 1), und bei der Übergabe blendete sie aus dem
Durchsichtigen ein (der offene Punkt 4 von AUFGABEN). Die Agenten und
Worker hiessen für Vorleser nur „Löschen", die Bereiche „Löschen: Bereich
„Schule" löschen", der Papierkorb nannte die Seite nicht. Schloss das Paar
von selbst (Grösse, Rollen, Druck daneben), fiel der Fokus auf den body.

**Gebaut:** Überfahren zeigt einen Ring statt einer Tönung (beide Pillen);
jede Stelle nennt, was weggeht, ohne das Wort zu doppeln (im Papierkorb im
title, damit die Zeile, die zurückholt, nicht „… löschen" heisst); der
Fokus geht beim Selbst-Schliessen an den Knopf zurück.

**Geprüft:** `test586` sechs Punkte mehr, rot gesehen (49 von 52, 49 von
54), dann 54 von 54; die Gegenproben G10–G13; Nachbarn 33 59 72 126 130
143 144 245 296 353 362 388 412 510 grün, `test464` nur §1 „Dreizehn
Werkzeuge" (fremd, auf `b3cf1933` genauso). Nachgesehen, welche
Löschen-Stellen fehlen: keine weitere runde; vier neue Stellen für Redurs
Wahl (L230 Punkt 5, AUFGABEN).

**Und von der Sonde über alle Stellen gefunden:** in der Bedingten Farbe
einer Datenbank lagen die Pillen unter der Seitenleiste — eine Farbregel
liess sich nicht mehr löschen; jetzt ist die Leiste ein Träger, und der
Fokus bleibt nach dem Löschen in der neu gezeichneten Leiste. Die
Chatliste der KI zeigt ihren Knopf am Rechner wieder erst beim Überfahren
(wie vor E709). `test586` §7, rot gesehen, dann 60 von 60.

## 3. Oktober 2026 · E709 Nachtrag · Die Läufe nach den zwei Korrekturen, und eine Durchsicht

**Redur:** „Weiter ohne pause".

**Nachgelesen:** Die Läufe vom 28. September (ca. 15:54 UTC, Stand von E709)
sind durchgelaufen: `test586` 45 von 45, die Gegenprobe zur Pillenbreite
rot gesehen (44 von 45) und zurück, `test362` 18 von 18, `test464` rot nur
in §1 „Dreizehn Werkzeuge" — auf `b3cf1933` genauso (fremd). Bilder neu.

**Durchsicht:** zwei Leistenknöpfe über einer Auswahl, die `test586` §2
nicht sieht (Gedankenkarte 🗑, Planfläche ✕) — nicht umgestellt, Redurs
Wahl (L230 Punkt 4, AUFGABEN).

**Am Bild gesehen und behoben:** beim Zurückfliessen sprang der Kreis im
Papierkorb von 44 auf 32 px, und der Knopf stand ein, zwei Bilder lang
blass da; ein schneller zweiter Druck nach „Abbrechen" verlor
`aria-expanded`. Jetzt fliesst die Flüssigkeit in die Grösse des Knopfs
zurück und übergibt ohne Übergang (`test586` 48 von 48, rot gesehen 45 von
48; Nachbarn 72 126 130 143 144 353 362 388 412 grün, 464 nur §1 fremd).

## 28. September 2026 · E709 · Der Löschen-Knopf, der zerfliesst — überall, wo gelöscht wird

**Redur:** um ca. 22:02 ein Video (ein runder Knopf mit rotem Papierkorb
zerfliesst in „Confirm" und „Cancel") und dazu: „Ich will das du löschen
button so ist überla wo etwas zum löschen eine buton gibt".

**Gebaut:** EIN Helfer in Redions eigenem TypeScript und CSS
(`src/schale/bedienung/delete.ts` → `RedionDelete`,
`quell/schale/stil/loeschen.css`), nachgebaut nach DeleteButton aus dem
Touch Kit, ohne React beim Start. Eine Stelle macht mit, indem ihr Knopf
`data-loeschknopf` trägt; ein Zuhörer in der Einfangphase öffnet beim ersten
Druck das Paar, erst die rote Pille lässt den Druck zum alten Griff durch.
EIN Klebefilter je Dokument, an nur während des Fliessens. 23 Stellen in 16
Dateien: Papierkorb (Seiten und Blöcke, „Endgültig löschen"), Bereiche,
Erweiterungen, Farbregeln, Filtergruppen, Auswahl-Optionen, Automationen und
Prüfsätze der Datenbanken, Notizen und Formeln im Wissen, Regeln der Tabelle,
Eingänge, Textbausteine und Regeln der Mail, Kalender-Abos, Dateien,
KI-Server, eigene Agenten und Worker, die Chatliste der KI, die Elemente der
Zeichenfläche, Konten. Die zwei `confirm()` hinter einem Papierkorbknopf
(einzeln endgültig löschen, Erweiterung entfernen) sind durch den zweiten
Schritt ersetzt; „Papierkorb leeren" fragt weiter.

**Geprüft:** `test586` (neu, rot auf `b3cf1933`), dazu die Läufe, die diese
Knöpfe drücken (`test72`, `test130`, `test144`, `test464` — erweitert: der erste Druck
fragt nur) und die Nachbarn; Zahlen in E709 und messungen §79. Offen: L230.

## 28. September bis 3. Oktober 2026 · E708 · Rot zuerst am Stift: Halten und Farbwähler wieder grün, eine Probe beim Entscheid

**Redur:** um ca. 16:45 „… dann bessere stift efeckte beim zeichnen …" und
um ca. 22:10 „… ich will wenn ich am morgen die redion öfnnen eien komplet
besseren webseit sehen ohne eine funktione löschen …" (27. September);
am 3. Oktober um ca. 19:35 „Weiter ohne pause,".

**Gefunden:** drei Wächter des Zeichnens waren auf `main` und auf dem
Grundstand `b3cf1933` rot, gesehen vom Bau von E704. Jeder mit dem Wächter
von heute gegen den Code von damals zurückverfolgt: `test461` §1/§4 und
`test201` §1 rot seit E676 (`04b8c4d5`, auf `main` mit PR #112),
`test343` §6 rot seit E697 (`9e306b85`, auf `main` mit PR #114).

**Gebaut:**
- Das Halten (E490) misst wieder die Hand: `InkStroke.glaetter(start,
  false)` ist derselbe Glätter ohne den Eckensprung aus E676 (Zahl für Zahl
  der alte), `marken.ts` füttert ihn mit jeder Meldung und misst den
  Ruhekreis an ihm. Die Tinte behält ihre Ecken. Bei ±2 Zittern 875 ms Ruhe
  statt 175 ms.
- Die Formerkennung eines gehaltenen Strichs sieht ihn nur bis dahin, wo
  die Hand zur Ruhe kam, und dazu den Punkt, an dem sie abhob (E376) — das Knäuel, das der
  Eckensprung beim Halten in die Tinte legt, machte sie blind. Die Uhr allein
  reichte nicht: der erste Stand war im Browser weiter rot (33/36). Jetzt
  wird der gehaltene Strich wieder eine Linie, auch der Schutzleiter.
- Der Systemfarbwähler der Palette (E697) übernimmt beim Schliessen
  (`change`) über denselben Weg wie jeder Tupfer — gemerkt, markiert, die
  Palette geht zu. Vorher füllte er nur das Hex-Feld; auf dem Grundstand
  brach `test343` danach ab, und §7/§8 liefen nicht mehr. Nur ein NEUER
  Wert übernimmt: ein `change` mit dem Wert, mit dem der Wähler aufging,
  tut nichts (`test343` §6 um diese Zusage erweitert, rot gesehen in der
  Gegenprobe ohne die Prüfung).
- `test201` §1 nicht angefasst: seine Probe ist ein rechter Winkel, seit
  E676 mit Absicht eine Ecke. Der Vorschlag steht in L235 Punkt 1.
- Durchsicht (4./5. Oktober): ein schneller, kurzer Strich, still
  gehalten, war auf dem Grundstand eine Linie und blieb mit E708 ein
  Strich — bis zur Ruhe hat er weniger als die acht Punkte, die die
  Erkennung verlangt. Findet die Frage bis zur Ruhe nichts, fragt sie jetzt
  die ganze Tinte wie vorher; `test461` §1 um zwei Zusagen erweitert, rot
  gesehen am Kopf von E708.

**Geprüft:** siehe E708 (Gegenproben, Nachbarn) und messungen §85.

## 28. September 2026 · E706 · Das Material des Touch Kits überall, wo man wählt

**Redur:** um ca. 21:47 die Vorschau der Tab-Leiste aus dem UI-Kit und dazu
„ich will das du auch das ¨berla nutze will wo es nötig ich also beim stift
übergangen usw"; im Fragebogen um ca. 21:45 „Wie im UI-Kit (Empfohlen)" und
„Untere Leiste besser lesbar"; um ca. 22:10 „… bessere übergagnge besssere
efeckten , bessere oberfläsche alles …".

**Gebaut:** `SelectionFlow` fährt die Feder des Touch Kits (`knapp`/`druck`)
und kann greifen (`ziehbar`): die Pille der unteren Leiste hebt sich unter
dem Daumen, folgt ihm, dehnt sich mit dem Tempo, gibt an den Enden nach wie
ein Gummiband und rastet losgelassen mit Schwung ein — der Reiter darunter
wird genau einmal geklickt. Ihre Zeichen sinken beim Drücken ein und federn
zurück. Die Linse ist in Ruhe fast klar (der aktive Name ≥ 4,5 : 1), Glas
wird sie beim Fahren und Halten. In sechs Reihen fliegt die Wahl über
`data-material`, statt zu springen: Seite/Fläche/Redion, „Heute", die Wege
im Regal, die Reiter von „Aussehen", die Liste der Einstellungen, das
Zubehör der Stiftleiste (je Gruppe). Der Werkzeugflug dehnt sich zwischen
Nachbarn. „Ruhige Darstellung" hält jetzt auch diese Bewegungen an.

**Geprüft:** `test585` (neu, zuerst rot eingecheckt); die Nachbarn in der
Commit-Nachricht. Nichts gelöscht, kein Weg verlegt: Tipp, Tastatur und
Vorleser gehen wie vorher.

**Offen:** L229 — Schieben über das Zubehör, Umschalter statt kurzer
`<select>`s, die Federn als Marken in `grund.css`.

## 28. September 2026 · E705 · Bessere Farben

**Redur:** „… bessere stift efeckte beim zeichnen bessere farben" (27.
September, ca. 16:45 UTC); im Fragebogen „9 ruhigere Akzentfarben",
„Leichter kühler Ton im Dunkeln", „Starker Kontrast ohne Glas"; und zum
Aussehen „Also beiden bei der ausehen dort aollte ich die fraben ändern
kann".

**Gebaut:** `Farben.accentSet` leitet zu jeder Akzentfarbe Schrift auf der
Fläche, Tinte, Überfahren und Tönung ab — „Starker Kontrast" schreibt
Schwarz auf Gelb, eine eigene Farbe lässt keine violetten Reste.
„Aussehen" hat neun ruhigere Akzente mit Namen und „Aa", ein beschriftetes
Feld „Eigene …", eine Vorschau und ehrliche Schemakarten. Der dunkle Grund
ist leicht kühl (#121417 …), die Leiter jedes Schemas leitet sich ab.
Notion- und Statusfarben je Modus neu gestimmt, `--gefahr-flaeche` für
Weiss auf Rot, Eingaben im Grundton (`color-scheme` an den Feldern),
Diagramme mit eigener Reihe je Grundton, Whiteboard und Gedankenkarte im
Hellen mit dunklerer Tinte, ohne gespeicherte Farben zu ändern, und keine
feste Signalfarbe mehr in den Stilblättern.

**Geprüft:** `test584`, zuerst rot gegen den Grundstand eingecheckt;
`test47` zieht den Grund von „Standard" nach. Zahlen in messungen.md §77.

**Gefunden:** L228 (Weiss auf der Astfarbe der Gedankenkarte, im Dunkeln
zu blass); die Fehlerkarte war in beiden Modi fast schwarz; `chartTyp:
'pie'` zeichnet eine leere Achse (AUFGABEN).

## 28. September 2026 · E704 · Bessere Stifteffekte beim Zeichnen

**Redur:** „… dann bessere stift efeckte beim zeichnen bessere farben"
(27. September, ca. 16:45 UTC) — im Fragebogen (ca. 21:45 UTC) „Echter
Textmarker", „Füller wie GoodNotes", „Bleistift mit Graphitkorn", „Neue
Tintenfarben".

**Gefunden:** Haarbeine und Kerben im „M" (L209 Punkt 3, gemessen 23 Punkte
der Mittellinie ausserhalb der Tinte); Kappen, die sich nach innen biegen;
ein beiger runder Marker; eine Perlenkante am Bleistift; die Vorhersage des
Browsers ungedeckelt (bis 60 pt Schwanz bei 2,5 px/ms); ein atmender
Kugelschreiber (−21 %); Polygon-Schlaufen und ein Neuaufbau je Bewegung auf
der Tafel; nach dem Teil-Radieren eine Neigung am falschen Punkt; auf der
Seitenfläche ein Radierer, der nur Punkte traf, nicht die Linie.

**Gebaut:** Gelenke und Kappen nach aussen; der Keilmarker in Sonnengelb bei
0,40, eine Fläche, der runde wählbar; Tempo macht den Füller dünner (nur mit
Sensor); feste Breite für Kugelschreiber und Marker; Graphitkorn mit Farbe
als Rückfall; Deckel und Bremse für die Vorhersage; acht Tinten zuerst, die
fünf alten unter „Weitere Farben"; die Probe auf dem echten Papier, als
echter Strich, mit Warnung in Worten und Weiss auf dunklem Papier; Tafel und
Seitenfläche mit Glätter, allen Ereignissen und einem Bild je Bild; das PDF
mit mehreren Vielecken und einer Füllung.

**Geprüft:** `test583` (neu, zuerst rot), die Nachbarn im Commit E704.
Offen: L227, AUFGABEN S1–S3.

## 28. September 2026 · E703 · Glas, wo es passt

**Redur:** „du muss mehr im redion arbeiten du kannst auch die oberfläche
bischen ruhige machen ohne etwas lösche also eine funktionen und ich will
das es flüssigere animationen , glass efeck usw alles haben dann bessere
stift efeckte beim zeichnen bessere farben" — im Fragebogen „Starker
Kontrast ohne Glas".

**Gefunden:** Kein Bild hatte je Glas gezeigt (das kopflose Chromium lässt
jede Unschärfe weg). Menüs und das Blatt am Telefon kamen als Nebel
(`opacity` auf der Glasfläche). Die zwei schwebenden Werkzeugleisten waren
graue Platten. Nur „weniger Transparenz" machte Glas deckend. Toast und
Lader lagen auf dem Dock und der Kapsel Zurück/Vor.

**Gebaut:** echte Unschärfe in `bilder.mts`, `test576`, `test582`; Glas
kommt als Scheibe (`glas-ankunft`, `glas-inhalt`); der Dock im Dokument und
die schwebende Zeichenleiste sind dichtes Glas mit auslaufendem Rand statt
Deckeln; ein Schalter mit fünf Eingängen dreht die Glasmarken auf deckend;
„Starker Kontrast" ohne jedes Glas (`data-schema` an `<html>`);
`--melde-boden` für einen Stapel über den Werkzeugen, der Lader gehört dazu;
`--glas-kante` als Lichtkante; das leichte Glas folgt dem Schema; dunkles
dichtes Glas 90 %; der Präfix zuerst; am Telefon verwischt der Schleier
des Willkommens nicht mehr.

**Geprüft:** `test582` (176 Zusagen, zuerst rot eingecheckt), `test576`
mit echter Unschärfe; L221 gemessen und geschlossen.

## 28. September 2026 · E702 · Flüssige Bewegung: die Federn des Touch Kits in Redions Schale

**Redur:** „ich will das es flüssigere animationen … haben" (27.09., ca.
16:45), im Fragebogen „Wie im UI-Kit (Empfohlen)" (ca. 21:45: Knöpfe sinken
ein und federn zurück, Seitenwechsel gleiten ohne Nachschwingen), „was du
beim touckit gebaut hast ich will alles so haben mit redion passende
inhalten" (ca. 21:49), „bessere übergagnge besssere efeckten … ohne eine
funktione löschen" (ca. 22:10).

**Gefunden:** die Mehrheit der Knöpfe am Telefon antwortete auf Druck gar
nicht, rund zwanzig `:active`-Regeln mit eigener Zahl, kein Einsinken beim
kurzen Tipp am iPhone; Blätter stiegen 16 px aus dem Nichts hinter einem in
einem Bild schwarzen Grund; Tippen auf einen Reiter ohne Ankunft; „Ruhig"
hielt Pille, Bibliothek und `::after` nicht an; ein Schalter-Verlauf glitt
beim Einschalten zur Ecke; ein `transition: all`.

**Gebaut:** fünf `--feder-*` in `grund.css` (aus `motion-tokens.css`, mit
Rückfall), `RedionSpring` (übertragen, 1953 Punkte gleich dem Kit),
`RedionPress` (eine Druckfeder statt dreizehn Regeln), der Schalter wie im
Kit, Blätter vom Rand mit Finger und Abgang, eine Ankunft für jeden
Ortswechsel (auch in den Einstellungen am Telefon), „Ruhig" überall
(`AppEinstellung.wenigBewegung`, `::after`, `data-ui-motion`).

**Geprüft:** `test581` (neu, rot zuerst), `test126` §7, `test435`;
Nachbarn im Commit. Offen: L225.

## 28. September 2026 · E701 · Ruhiger, und nichts ist weg

**Redur:** „du kannst auch die oberfläche bischen ruhige machen ohne etwas
lösche also eine funktionen" (27. September, ca. 16:45 UTC) — und im
Fragebogen „Gezeichnete Zeichen (Empfohlen)": „Alles bleibt am selben Ort."

**Gebaut:** eine Haupthandlung je Bild (auf „Heute" nur „Lernen starten"
voll; „PDF öffnen" im Kopf getönt bis zum Anfassen; „Dokumente öffnen" als
Umrissknopf; der Themenknopf im Hellen ein grauer Mond); „Zuletzt
geöffnet" dreht nur unter Zeiger oder Fokus; gezeichnete Zeichen aus
`Register.symbole` statt Emoji in Einstellungen, ⋯-Menü, „Mehr", R-Blatt,
Seitenwerkzeugen und Termine (20 neue Zeichen); AUS-Schalter grau;
Kennzahlkarten in Ruhe grau; die Bandecke im Grund des Bandes; am Telefon
blendet die Krume aus, solange der grosse gleichnamige Titel zu sehen ist.

**Geprüft:** `test580`, zuerst rot eingecheckt (42 von 85 gegen 515451f9),
jetzt 86/86 (eine Probe kam im Bau dazu: neu gezeichnet blitzt die Krume
nicht auf); jede Zusage mit ihrer Gegenprobe. Die Griffe sind gezählt,
nicht geschätzt: 19 + 47 + 13 + 12 + 5 + 3, je mit Kennung, Wort und Folge.
Laute Flächen „Heute" hell 4 → 1, Dauerbewegung im Regal 1 → 0, Emoji in
den Einstellungen 19 → 0, im ⋯-Menü 37 → 0 (messungen.md §73).

**Gefunden:** L224 — die kleinen Kurven der Kennzahlkarten zeigen in jeder
Karte dieselben festen Werte.

## 27. September 2026 · E699 · React-Inseln, Stufe 1a: die Grundlage

**Redur:** „du kannst react nutzen keien problem" — im Fragebogen „Mit React
(E80 aufheben)", je Stück „React 19.3.0, Touch Kit (dein UI-Kit), Glas-Code
(ALEXalesha, MIT)", zum Aussehen „Also beiden bei der ausehen dort aollte
ich die fraben ändern kann", zu den Federn „Wie im UI-Kit überall".

**Gebaut:** E80 aufgehoben, sein Einwand als fünf Regeln (ein Einstieg,
keine neue Seite, kein Router, an Ort und Stelle, nur Ansicht). React
19.3.0 eingepackt in `quell/fremd/react/react.js`, die Inseln in
`quell/islands/`, gebaut mit Vite 8 (`bauen-inseln.mts`, Teil von
`bauen:ts`); das Touch Kit als Kopie in `fremd/touch/`
(`skripte/touch-holen.mts`, UI-Kit @c192821). Geladen erst beim Gebrauch
(`Inseln.bereit()`), vorgewärmt nur, wo es nichts kostet; in der
Einzeldatei als nicht ausgewertete Behälter; offline über den GRUNDSTOCK.
Die Brücke legt die Marken des Kits auf Redions; „Aussehen" hat zwei
Schemata mehr, „Touch Kit hell" und „Touch Kit dunkel".

**Geprüft:** `test578` (Dateien) und `test579` (Browser), beide zuerst rot
eingecheckt. Erweitert, keiner abgeschwächt: `test109`, `test105`,
`test388`, `test290`, `test47`, `test510`. Der Start: 2761 → 2767 KB; die
Gegenprobe mit Vorwärmen auf jedem Weg gab 2843 KB — sieben unter der Decke,
die es allein nicht gemerkt hätte (messungen.md §71).

**Gefunden:** L223 — im Ordnerbetrieb steht in der Fehlerliste nur „Script
error.", für jeden unbehandelten Fehler. Und `test362` ist auf `main` rot
seit dem Zusammenführen von E697 (66 rohe `28px` gegen 65).

**Durchsicht (derselbe Tag):** zwei Fehler, je zuerst als roter Lauf —
„Touch Kit dunkel" machte Weiss auf Rot schlechter (2,65 statt 3,76 : 1;
jetzt bleibt dort Redions Rot, `test579` §5), und ein gescheitertes
Stilblatt sperrte den nächsten Ladeversuch (die Insel hing ohne ihr Blatt;
jetzt geht es wieder aus dem Kopf, `test579` §11). `test578` §6 liest die
Regeln 3 und 4 jetzt auch im gebauten Bündel. L222 nachgeführt: UI-Kit hat
drei der Punkte nach c192821 schon erledigt; neu Punkt 6, Akzent als
Schrift (vor Stufe 1b zu lösen).

---

## 27. September 2026 · E696 · Rot zuerst: eine Seitenspalte endet im Fenster

**Anlass:** der Nachbarlauf von E695 — `test534` rot, und zwar seit E690,
meinem eigenen Bogen vom Vortag (über Arbeitsbäume auf `4d7436d`
zurückverfolgt).

**Der Mangel war älter als der Rückfall.** Die Studioleiste links/rechts ist
eine Spalte an der Blatthülle mit `78vh` Höhe, egal wo sie beginnt — sie
ragte schon vor E690 123 px unter den Fensterrand. E690 setzte den
Umschalter der Ansichten darüber (74 px), und damit fiel auch der Griff
„Platz" hinunter: wer ihn erreichen wollte, musste die Seite um 465 px
rollen.

**Gebaut:** `marken.ts` rechnet `--reihe-platz`, den Raum von der Oberkante
der Hülle bis 12 px vor dem Fensterrand (mindestens 220 px); `max-height`
nimmt den kleinsten Wert. Ein gedrosselter Hörer rechnet bei neuer
Fenstergrösse nach.

**Geprüft.** `test534` auf 52 Zusagen; der neue Satz „«links»/«rechts» endet
im Fenster" war auch gegen den Stand VOR E690 rot. Gegenprobe rot mit sechs
Zeilen. Und im selben Nachbarlauf ein zweiter Roter, eine Woche alt:
`test533` zählte 13 Studio-Werkzeuge, seit E670 sind es 14 — nachgezogen.

---

## 27. September 2026 · E695 · Ein Glas statt vier

**Redur:** „Weiter an die animationen übergangen glass efeck usw alles
verbessern."

**Zuerst gezählt, dann gebaut** (messungen.md §69). §16 hatte ein Glasrezept,
und es sass auf genau einer Klasse. Menüs trugen 88 % Deckkraft und
`blur(8px)` — auf dem Bildschirm kaum Glas; die Telefonleiste eine eigene
Mischung, die PDF-Leiste eine dritte. Am Rechner war im Leerlauf kein
einziges Element sichtbar verwischt. Und fünf Stellen setzten
`backdrop-filter` ohne `-webkit-backdrop-filter` — auf jedem iPhone vor
Safari 18 also ohne Glas.

**Gebaut:** EINE Unschärfe (`--glas-blur`) für Menüs, Finder,
Auswahlleiste, Telefonleiste, PDF-Leiste und `.rb.glas`; zwei Dichten mit
einer Regel — Fläche mit Schrift dicht (`--bg-schwebend-dicht`, 92 % hell,
88 % dunkel), Fläche mit Zeichen leicht (`--bg-schwebend`); Glas nur unter
`@supports` mit Präfix, vorher deckend; ein Schleier-Token für den Grund
hinter Fenstern; und auf Glas keine blasse Schrift (`--text-faint` →
`--text-dim` in gläsernen Flächen). Vier Zierstücke (Linse, Etikett,
Glaskugel) bleiben, mit Namen und Grund im Wächter.

**Die Dichte war zuerst eine Schätzung, und die Pixel haben sie widerlegt.**
Mit 74 % hielt die Hauptschrift 6–7 : 1, die stille Schrift (Gruppentitel,
Kürzel) aber nur **1,43 : 1** — gemessen hatte ich sie zuerst gar nicht.
Die Dichten sind danach gerechnet und nachgemessen. Das Menü ist damit nicht
durchsichtiger als vorher, sondern glasiger: 20 statt 8 Pixel Unschärfe und
die gesättigte Farbe dessen, was darunter liegt.

**Ein alter Mangel nebenbei:** die Telefonleiste hatte hell für ihre Namen
nur 4,14 : 1, schon vor diesem Bogen. Jetzt 4,59.

**Geprüft.** `test576` neu, 30 Zusagen, rot eingecheckt mit elf Zeilen;
drei Gegenproben rot (Glas auf 22 % → 1,6 : 1; die Schrift-Regel heraus →
3,11 / 2,36 : 1). Zweimal war er aus dem falschen Grund rot (`color(srgb …)`
statt `rgba()`, und ein von Hand gesetztes Thema, das die App zurücksetzte —
P118). 23 von 24 Nachbarn grün; `test534` ist rot, aber seit E690 und
nicht durch diesen Bogen (gegen die alten Stilblätter dieselben vier Zeilen).

**Offen:** L221 (die leichten Leisten sind gerechnet, nicht gemessen) und die
Bewegung — siehe AUFGABEN.md, „Bewegung und Glas".

---

## 26. September 2026 · E694 · Eine Werkzeugliste statt drei (Bogen 5b, L218)

**Redur:** „Weiter."

**Gebaut:** die zwei Abschriften sind weg. `marken.ts` hält nur noch die
REIHENFOLGE der vierzehn Kennungen und ruft `Register.werkzeuge.auswahl([…])`;
`menueband.ts` hält eine Folge mit Herkunft (`['abdeck','werkzeug']`,
`['line','form']`) und holt Name, Zeichen und Hinweis über
`bandWerkzeug(id, woher)` aus dem zuständigen Katalog. `Marken.WERKZEUGE`
bleibt als NAME stehen — es ist jetzt eine Sicht auf den Katalog, damit
`document-mode.ts` (E572), der Inspector und `ordnungAbgleichen` weiter
dasselbe Feld lesen.

**Warum überhaupt.** Drei Listen für eine Sache ist §8 in Reinform, und in
diesem Projekt keine Vermutung: als „Abdecken" im Studio einmal still zu
„Abdeckband" wurde, sagte das Menüband weiter „Abdecken" (`test266 §1`).

**Der Fund, den niemand gesucht hat.** Die Kennung **`ellipse` gibt es
zweimal** — als Flächenwerkzeug (`◯`, deutscher Kennungsraum neben `linie`,
`pfeil`, `rechteck`) und als Studio-Form (`○`, englischer Raum neben `line`,
`arrow`, `rectangle`). Drei Paare trennt die Sprache, das vierte nicht. Ein
naheliegendes „erst im Register nachsehen, sonst bei den Formen" hätte im
Band still das falsche Zeichen gezeigt, ohne dass etwas kaputtgegangen wäre
ausser der Anzeige. Deshalb sagt jetzt jede Zeile, aus welchem Katalog sie
kommt. Gefunden hat es der Wächter, bevor eine Zeile repariert war — und die
erste Vermutung war, das Band habe unrecht. Es hatte recht (P117).

**Und ein Typ, der zwei Dateien weiter aufgeschlagen wäre.** `Register` ist
ein `any` (`global.d.ts`), also wäre `WERKZEUGE` zu `any[]` geworden — und
das fällt nicht in `marken.ts` auf, sondern in `document-mode.ts:2036`, das
`Marken.WERKZEUGE` liest (E572): fünf implizite `any` in einer fremden Datei.
Eine Zeile `: GfxWerkzeug[]` statt einer Stunde Suche (§52.7).

**Geprüft.** `test572` von 51 auf 59 Zusagen. §3 misst jetzt das Stärkere als
vorher — nicht mehr, dass zwei Listen dasselbe sagen, sondern dass die zwei
Abschriften weg sind; gegen den Stand davor rot mit vier Zeilen. §12 ist neu
und misst das laufende Programm; seine Gegenprobe (einen Namen von Hand
zurückschreiben) druckt genau den historischen Fehler: `abdeck`. Nachbarn
grün: `test266`, `test267`, `test268`, `test272`, `test274`, `test277`,
`test282`, `test286`, `test289` und die Studio-Läufe.

**Zweimal war der neue Abschnitt aus dem FALSCHEN Grund rot**, und beides
steht jetzt als Kommentar im Lauf: `inReiter` gibt GRUPPEN zurück, keine
flache Liste; und der Reiter „Zeichnen" zeigt ohne offenes Blatt gar keine
Werkzeuge, weil `Zeichenziel.da()` falsch ist. Beide Male stand da „0
Werkzeuge", und beide Male sah es nach einem Produktfehler aus.

**Die Bilder zeigen nichts Neues, und das ist die Zusage.** Ein Umzug, der
das Aussehen ändert, ist kein Umzug. Was sich wirklich ändert, sind zwei
Hinweistexte im Band: sie kommen jetzt aus den Titeln des Katalogs und sind
dadurch länger.

**L218 ist GESCHLOSSEN** (mit Beleg, nicht gelöscht — §35). Offen bleiben
Gedankenkarte und Planfläche (5c/5d) und die Tasten der Flächen (5e).

---

## 26. September 2026 · E693 · Auf der Fläche zeichnen — mit einem Zeichner statt zwei (A1b)

**Redur:** „weiter."

**Gebaut:** `src/core/gfx/shapes.ts` — `GfxShapes` mit `zeichne`,
`rahmenVon`, `zeilenUmbruch`, `pfeilMarke`, `sv` und den acht Farben. Er
kennt keine Fläche: kein `Store`, kein `Register`, kein `App`, keine
Dateiablage; was er über die Welt wissen muss, bekommt er als Angabe.
Darauf ist zuerst das Whiteboard umgezogen (136 Zeilen weniger, 24 dazu),
und dann hat die Seitenfläche ihre Tintenebene bekommen — acht Werkzeuge,
Farbmenü, rechnender Radierer, Rückgängig über `GfxHistory`, Strg+Z nach
E682-Mechanik, gespeichert im bestehenden Feld `shapes`.

**Die Reihenfolge war die Entscheidung.** Den Zeichner des Whiteboards zu
kopieren wäre der kurze Weg gewesen und genau der Fall, vor dem §8 warnt:
zwei Fassungen derselben Zeichnung laufen auseinander, und man sieht es
nicht beim Lesen, sondern irgendwann daran, dass ein Pfeil auf einer Fläche
eine Spitze hat und auf der anderen nicht. Also erst der Umzug in den Kern,
dann die neue Fläche darauf — dasselbe Muster wie `GfxHistory` (E687) und
`GfxToolbar` (E689).

**Die Bedingung aus L219, gemessen statt gelesen.** Die Tinte liegt IN der
bewegten Ebene, nicht daneben; damit teilen Tinte und Kästen EINEN
`transform` und es gibt keine zweite Umrechnung — daran ist es zweimal
schiefgegangen (E623, E686). `test575 §4b` misst das an der Bewegung, nicht
am Quelltext, und die Gegenprobe druckt die Zeile, um die es geht: „Tinte
×1.000 · Kasten ×0.800".

**Und zum zweiten Mal in zwei Bögen hat das BILD dieselbe Lücke gezeigt**
(§55.1): „Ins Bild holen" rechnete in E690 nur mit dem Seitenkasten und
liess die herausgezogenen Blöcke draussen, dann nur mit den Kästen und liess
die Formen draussen — auf dem Bild hing eine Ellipse rechts über der Kante,
während der Knopf „ins Bild" hiess.

**Ein Fund am Rande, der kein Prüfstandsfehler war.** `setPointerCapture`
wirft, wenn es den Zeiger nicht mehr gibt, und der Wurf brach den ganzen
Handgriff ab, bevor die erste Form entstand. Das trifft nicht nur den
Prüflauf: ein schneller Tipp, ein verlorener Stift, ein zweiter Finger
reichen. Das Fangen ist eine Bequemlichkeit, kein Grund zum Abbruch.

**Und ein Fund beim SCHREIBEN der Doku.** `doku/REDION-FORMAT.md` sollte
versprechen, dass ein Seitenblock ohne Zeichnung kein `shapes` trägt —
nachgesehen war es nicht wahr, eine leere Liste blieb stehen und mit ihr
eine `raumVersion` ohne Formen. Beide werden jetzt mit `Store.feldWeg`
entfernt, derselbe Griff wie bei `flaecheOrt` (E691). Eine Doku, die man
ehrlich schreibt, ist auch ein Wächter.

**Geprüft.** `test575` neu mit 40 Zusagen in elf Abschnitten, dreimal rot
gesehen (die Tinte eine Ebene höher, `GfxShapes` mit einem Flächennamen
darin, `feldWeg` wieder heraus). Nachbarn grün: `test573`, `test574`,
`test538`, `test570`, `test571`, `test572`, `test105`, `test109`, `test87`,
`test550`.

**L219 ist damit zur Hälfte GESCHLOSSEN.** Was bleibt, steht dort:
auswählen, verschieben, beschriften und verbinden auf der Fläche — rund 600
Zeilen Bedienung, die heute nur das Whiteboard hat. Und eine Seite mit
Zeichnung taucht in der Flächen-Übersicht der Arbeitswelt nicht auf: die
listet `whiteboard` und `blatt`, nicht Seiten.

---

## 26. September 2026 · E692 · L220 geschlossen — und ein Kürzel, das nie ankam

**Redur:** „mach L220 auch noch."

**Gebaut:** `nachbarImText` im Editor — ein Weg durch die Geschwisterliste,
der bei jedem Schritt `Register.seitenansichten.zeigtIn` fragt (§8: die Regel
bleibt an einer Stelle). Damit springt die Rücktaste zum SICHTBAREN
Vorgänger, und Strg+Umschalt+Pfeil springt ÜBER den unsichtbaren Nachbarn —
mit `splice` statt Tausch, damit die übrigen stehen bleiben. Dazu: die
laufende Nummer einer Liste wird beim Zeichnen gezählt und an
`Blocks.render(b, tiefe, nr)` weitergereicht, statt als `b.nr` in den Block
und damit in jede Sicherung zu wandern.

**Der Fund, der nicht auf der Liste stand.** Der neue Abschnitt wollte messen,
dass das Verschieben den unsichtbaren Nachbarn überspringt — und es bewegte
sich GAR NICHTS, auch in den Daten nicht. Zwölf Zeilen höher im selben
Tastenbehandler steht die Pfeilnavigation zwischen Blöcken, und sie kehrte
mit `return` um, sobald der Cursor am Anfang (für ↑) oder am Ende (für ↓)
stand. In einem einzeiligen Block ist er fast immer beides: das Kürzel, das
das Blockmenü als „Ctrl+Shift+↑" verspricht, war praktisch nie erreichbar.
Die Reparatur ist eine Bedingung — die Navigation gilt nur ohne Strg/Cmd.

**Geprüft.** `test574` von 50 auf 60 Zusagen; §10–§12 waren gegen den Stand
vor der Reparatur rot (vier Zeilen), und zwei Gegenproben machen sie wieder
rot: die Bedingung zurücknehmen und den Nachbarn wieder ungefiltert nehmen.

**L220 ist damit GESCHLOSSEN** (mit Beleg, nicht gelöscht — §35). Was offen
bleibt, steht dort: verschachtelte Nummernlisten zeigen weiter „1.", und
alte Blöcke tragen ihr `nr` noch als totes Feld.

---

## 26. September 2026 · E691 · Der Vollausbau der Fläche (A1c)

**Redur:** „ja mach den vollausbau, jeder block auf die fläche ziehbar."

**Zuerst vier Leser, dann eine Zeile Code.** AFFiNEs `displayMode`, Redions
vorhandenes Block-Ziehen, wer ausser der Inhaltsfläche noch die Kinder einer
Seite liest, und welche Wächter daran hängen — parallel, jeder mit
Datei:Zeile. Drei ihrer Funde stehen im Ergebnis, und keinen davon hätte
der Bau von selbst gemacht.

**Gebaut:** zwei optionale Felder an JEDEM Block — `flaecheOrt`
({x,y,w,raumVersion}) und `sichtbarIn` ('beides' | 'seite' | 'flaeche') —,
ein Kasten je Block auf der Fläche, Ziehen aus dem Text mit dem VORHANDENEN
Editor-Ziehen (§8, die Kennung reist über `dataTransfer`), der Rückweg durch
Ziehen in den Seitenkasten, „Auf der Seite ausblenden" mit Wort statt Farbe
(§38), der Weg am Telefon über das Blockmenü und die Hebe-Geste aus E83,
und `Store.feldWeg` im Kern, damit „kein Feld" wirklich kein Feld ist.

**Drei Entscheidungen gegen das Vorbild**, jede begründet in E691: der BLOCK
ist die Einheit (AFFiNE kann nur die Notiz); die Reihenfolge in `content`
bleibt unangetastet (AFFiNE verschiebt); ein unlesbarer Platz zählt als kein
Platz (AFFiNE macht still `[0,0,0,0]` daraus).

**Was die Leser geändert haben:** der Feldname (`zeigen` ist 41-mal als
Register-Rückruf vergeben → `sichtbarIn`), eine Regel, die zweimal dastand
(„ist der Platz lesbar?" — jetzt einmal im Register), und zwei Leser der
Kinderliste, die niemand auf dem Zettel hatte: Gliederungsstreifen und
Inhaltsverzeichnis führten Überschriften auf, die auf der Seite gar nicht
stehen.

**Was das Bild geändert hat** (§55.1): „Ins Bild holen" rechnete nur mit dem
Seitenkasten — die herausgezogenen Blöcke hingen ausserhalb, während die
Leiste „100 %" meldete.

**Geprüft.** `test574`, rot eingecheckt vor dem Bau (e388949), danach 50/50.
Zwei Gegenproben, beide rot: den Sichtbarkeitsfilter heraus (6 Zusagen rot)
und `ortLesbar` auf „immer wahr" (2 rot). Zweimal war der Lauf selbst aus
dem falschen Grund rot — `contextmenu` am Telefon (unterdrückt seit E83) und
ein Tipp 400 ms nach dem Loslassen (der Fänger schluckt 800 ms).

Nachbarn grün: `test573`, `test285`, `test105`, `test109`, `test87`,
`test294`, `test301`, `test96`, `test100`, `test139`.

**Neue Lücke:** L220 — drei Nebenwirkungen des Ausblendens (Rücktaste,
Strg+Umschalt+Pfeil, `b.nr` in der Sicherung). Keine verliert Daten, alle
drei sind „der Bildschirm bewegt sich nicht, und niemand sagt warum".

---

## 26. September 2026 · E690 · Drei Ansichten einer Seite (A1, Bogen 1)

**Redur:** zuerst „bei der affine haben wir das es wechsel die ansichten …
aber zuerst liess was die ander 2 bereicht machen bi affine" — und danach
„ich will die 2 von affine 1:1 haben auch alles komplet wie es ausehn …
und noch eien 3 für die aktuele redion … die 3 is von uns erfunden".

**Zuerst gelesen.** Der Befund steht mit Datei und Zeile in
`doku/karte/thema-ansichten.md`: AFFiNE hat GENAU ZWEI Modi, es sind zwei
Blicke auf dasselbe Dokument — und ein Cover gibt es dort gar nicht. Ohne
das Lesen wäre eine dritte Betriebsart entstanden, wo AFFiNE eine Ansicht
hat.

**Gebaut:** `Register.seitenansichten` (der Katalog, §5 Regel 3), das Feld
`seitenAnsicht` am Seitenblock (kein Feld = die Redion-Ansicht, §9), der
Umschalter auf dem vorhandenen `Segment` (Radiogruppe, seit E441-Umfeld
gebaut und bis heute nirgends benutzt), die Ansicht „Seite" (Symbol und
Titel, kein Cover, keine Werkzeugzeile) und die Ansicht „Fläche"
(Punktraster, Schieben, Zoomen 10–600 %, Kneifen, „ins Bild holen", der
Seitentext als verschiebbarer Kasten, dessen Kopf Symbol und Titel
ÜBERNIMMT statt sie nachzubauen).

**Drei Namen bewusst NICHT genommen** (§8): `Ansichten` ist der Dienst der
Datenbankansichten, `Register.ansichten` deren Katalog, `FORMEN.ansicht` die
Form eines `views`-Eintrags.

**Gemessen** (`messungen.md` §64): am Telefon Fläche 332 → 584 px hoch,
278 → 390 px breit, „ins Bild holen" 31 % → 98 %. Alle drei Zahlen kamen vom
BILD, nicht vom Wächter (§55.1). Und ein vierter Fund, der nichts meldete:
`(window as any).App` gibt es nicht — `const App` in einem gewöhnlichen
`<script>` ist eine globale lexikalische Bindung, kein Feld von `window`;
das Feld wurde geschrieben, der Bildschirm blieb stehen.

**Geprüft.** `test573` (31 Zusagen), eingecheckt rot vor dem Bau, danach
30/30 — und die Gegenprobe (`?? k.ARTEN[0].id` statt `?? k.VORGABE`) hat ihn
wieder rot gemacht und dabei eine Lücke IM WÄCHTER gezeigt: er prüfte nur,
dass nichts geschrieben wurde, nicht, was man dann sieht. Die Zusage „ohne
Feld sieht man die Redion-Ansicht" kam deshalb dazu (jetzt 31).

Nachbarn grün: `test285`, `test385`, `test391`, `test393`, `test221`,
`test272`, `test277`, `test40`, `test67`, `test114`, `test37`, `test402`,
`test332`, `test139`, `test425`, `test427`, `test429`, `test209`, `test70`,
`test105`, `test109`, `test87`, `test290`, `test315`, `test549`, `test550`.

**Zwei Zahlen nachgezogen, die vor diesem Bogen falsch waren:**
`marken-decke.json` (28 px: 64 → 65, 46 px: 15 → 14 — beide aus E689, der
Lauf stand rot) und die Hauptdatei des `pg-`-Namensraums
(`doku/CSS-NAMENSRAEUME.md`: bausteine.css → seitenansichten.css, 47
Vorkommen, mit Begründung im Text).

**Neue Lücke:** L219 — auf der Fläche kann man noch nicht zeichnen; die
Werkzeugleiste zeigt deshalb zwei Werkzeuge und nicht zwölf (§32).

---

## 26. September 2026 · E689 · EINE Werkzeugleiste für alle Flächen (W6, Bogen 5a)

**Redur:** „ich will so was haben wie die affine" · „integriere alles
zusammen". **Gebaut:** der Katalog `Register.werkzeuge` (22 Werkzeuge, davon
vier von Fläche und Studio geteilt), das Kernbauteil `GfxToolbar`
(`src/core/gfx/toolbar.ts`, kennt keine Fläche), drei neue Strichzeichen —
und das Whiteboard als erste Fläche darauf: schwebende Kapsel unter der
Fläche, Strichzeichen statt Emoji, Farben und „…" als Untermenü, am Telefon
44 px und rollend.

**Gemessen** (`messungen.md` §63): am Rechner 3 Zeilen × 67 px → 1 Zeile
× 54 px; am Telefon 4 Zeilen × 95 px → 1 Zeile × 70 px; Knöpfe 28×26 →
30×30 (Rechner) und 44×44 (Telefon).

**Geprüft.** `test572` (51 Zusagen), gegen den alten Stand rot mit 20.
Gegenprobe: den Roller zurück an den Sockel → „man kann wirklich
hineintippen" rot. **Und das Bild hat gefunden, was kein Wächter hatte:** das
Farbmenü lag gemessen richtig und war abgeschnitten (§55.1) — seither fragt
der Lauf mit `elementFromPoint`. `test209` nachgezogen (die Leiste rollt,
E356-Vorbild). Nachbarn `test568`, `test570`, `test571`, `test290`,
`test402`, `test105`, `test109`, `test388`, `test266`, `test438`, `test550`,
`test87` grün; `test537` wie gehabt (L207). Neue Lücken: L217 (untere Leiste
am Telefon), L218 (drei Werkzeuglisten bis 5b).

---

## 25. September 2026 · E688 · Die Startdecke, neun Tage später

**Der Fund.** `test388 §5` rot als Nachbar von Bogen 4: 2711 KB gegen 2700
— gerissen schon vor Bogen 4 (2709), der selbst 2 KB bringt. **Gezählt:**
127 KB seit E613, davon Studio +19, `bausteine.css` +12, NIN-Quiz 12 neu,
Trainer 9 neu, Gedankenkarte +8, Staatskunde 7 neu (`messungen.md`).

**Entschieden.** Decke auf 2850 mit Begründung im Kopf des Laufs (wie
E613); die zwei Inhaltsposten (19,5 KB Lernstoff) als L216 mit der Frage an
Redur, ob Lerninhalte erst beim Öffnen kommen. `test388` 19/19, `test549`,
`test550`, `test225`.

---

## 25. September 2026 · E687 · Die drei Flächen teilen EINEN Verlauf

**Audit D1, Bogen 4.** Whiteboard, Gedankenkarte und Planfläche hielten je
ein Paar Stapel aus JSON-Abbildern, dieselben acht Zeilen dreimal.
**Gebaut:** `src/core/gfx/history.ts` — `GfxHistory.erstelle(tiefe)`,
ohne DOM und ohne Store; der Kern gibt das Abbild zurück, die Fläche setzt
es ein. Drei Umzüge (40/40/60 bleiben), 41 Zeilen dazu, 51 weg; der erste
Ordner des GFX-Kerns. Marken (E378) und Seitenverlauf (E684) bleiben eigen.

**Geprüft.** `test571` (24 Zusagen, Kern ohne Browser, Übernahme im
gebauten JavaScript): gegen den alten Stand rot mit 8; erster Fund im Kern
selbst (`Number(0) || 40` → Tiefe 40 statt 1); Gegenprobe „merken leert das
Wiederholen nicht" → zwei rot. Nachbarn `test209`, `test568`, `test529`,
`test538`, `test238–240`, `test263`, `test105`, `test109`, `test537`,
`test550`, `test225`, `test87`. Kein Bild: nichts Sichtbares hat sich
geändert (§55.3).

---

## 25. September 2026 · E686 · Das Whiteboard trägt seine Raumfassung und rechnet über die Matrix

**Redur:** „für die 3. ja whiteboard eine raumversion". **Gebaut:**
`raumVersion: 1` mit jedem Speichern (ein Brett ohne Feld ist Fassung 1),
`punkt()` über `SheetSpace.umrechner` mit der alten Formel als Rückfall,
Typen für `shapes`/`sicht`/`hoehe`/`raumVersion`/`karte`/`plan`/`marken`,
ein Absatz in `doku/REDION-FORMAT.md`.

**Geprüft — und dabei etwas gelernt.** `test570` (12 Zusagen) sollte mit
`scale(0.8)` die Handformel rot zeigen; sie war grün, weil sich der Faktor
über den `viewBox` herauskürzt. Erst `rotate(180deg)` trennt Formel und
Matrix. Der Audit war an der Stelle zu scharf — berichtigt in E686 und im
Audit. Gegenprobe (Formel zurück): Drehung rot. Nachbarn `test209`,
`test206`, `test428`, `test568`, `test105`, `test109`, `test537`, `test550`,
`test87`.

---

## 25. September 2026 · E685 · Die zwei Fassungs-Wiederherstellungen gehen denselben Weg

**Der Fund.** `fassungen.ts:327` und `werkzeuge.ts:902` — „Ganze Fassung
zurückholen" und „Fassung wiederherstellen" — standen Zeile für Zeile so da
wie der Verlauf vor E684. Beide löschten die Fassungen der Unterseiten.

**Gebaut.** Zwei Aufrufe von `Store.baumAbgleichen`, sonst nichts.

**Geprüft.** `test569` §13/§14 fahren beide Dialoge wirklich (Klick, `confirm`
ersetzt); 48 Zusagen. Gegenprobe: alter Weg zurück → sechs rot. Nachbarn
`test98`, `test538`, `test548`, `test188`, `test105` grün.

---

## 25. September 2026 · E684 · Rückgängig ändert Inhalt, nicht Identität

**Der Fund.** Gemessen beim Plattform-Audit: ein Strg+Z auf der Elternseite
gab einer Unterseite eine neue Kennung, löschte ihre geplante Fassung
(1 → 0) und liess einen Favoriten ins Leere zeigen. `Verlauf.anwenden` riss
die Seite ab (`kinderLeeren` = Purge je Kind) und baute sie mit frischen
Kennungen neu (`baumEinfuegen`). `test70` hielt das seit jeher als Tatsache
fest.

**Wie entschieden.** Drei unabhängige Entwürfe, zwei Richter (Ablage,
Abgleich) — beide setzten dasselbe zusammen: eine eigene Funktion
`Store.baumAbgleichen`, Abgleich über die Kennung, Papierkorb statt Purge,
Unterseiten und Zeilen als Blätter, kein Stempel ohne Unterschied, keine
Ansicht wird gelöscht. Nur `Verlauf` zieht um; die Fassungen folgen als
eigener kleiner Bogen.

**Geprüft.** `test569` — eingecheckt als rot (10 von 20), BEVOR eine Zeile
Reparatur stand (§30); mit E684 36 Zusagen in zwölf Abschnitten. Vier
Gegenproben, je gebaut und gefahren: alter Weg zurück → 21 rot; fehlende
Felder nicht löschen → genau der Haken rot; immer stempeln; Purge statt
Papierkorb. Nachbarn: `test70`, `test188`, `test568`, `test226`, `test229`,
`test265`, `test48`, `test89`, `test96`, `test100`, `test105`, `test109`,
`test537`, `test550` — dreizehn grün, `test537` mit dem bekannten Stand
518 gegen 517 (L207, vor und nach dem Bogen gleich). Dieselben zwei
Sonden wie vorher: Fassungen 1 → 1.

**Nebenfunde der Richter** als L213–L215 eingetragen: gelesen, nicht
gemessen — Sperren rechnet den Dateianspruch nach dem Purge; `baumEinfuegen`
übernimmt `edited`; `baum` hängt die Sammlung an verknüpfte Ansichten.

---

## 25. September 2026 · E683 · Fremder Code darf in Redion, wenn er Redion verbessert

**Redurs Regel**, wörtlich in `FREMDCODE.md` und als CLAUDE.md §57: fremder
Code ja, wenn er Redion verbessert; nie PDFs, Bilder oder Geheimnisse an
Dritte; vorher Redur fragen; jedes Stück in `FREMDCODE.md`. **Die Zählung**,
damit die Datei mit der Wahrheit beginnt: pdf.js (eingepackt, 6.2.108,
Apache-2.0, `test177`) und WebLLM (zur Laufzeit vom CDN, ohne Fassung —
offene Frage), sonst nichts. AFFiNE und SiYuan gelesen, nichts genommen.

---

## 25. September 2026 · E682 · Strg+Z gehört der Fläche, die es genommen hat

**Der Fund.** Strg+Z in Planfläche und auf dem Blatt nahm zweimal zurück:
der Block seinen Schritt, die Schale den ganzen Seitenverlauf — Meldung
„Rückgängig", Block neu gezeichnet, neue Kennung. Das Whiteboard hatte gar
keine Taste. Gemessen mit zwei Sonden, bevor eine Zeile geändert wurde.

**Gebaut.** Eine Zeile in der Schale: eine Taste, die ein Block schon
genommen hat (`defaultPrevented`), nimmt die Schale nicht noch einmal —
nur für z und y. Das Whiteboard bekommt seine Taste über dieselben zwei
Funktionen wie seine Knöpfe, einen fokussierbaren Kasten und einen Fokus,
den man sieht (§38).

**Geprüft.** `test568`, 26 Zusagen: Schaltplan, Blatt, Whiteboard,
Gedankenkarte (zwei Schritte für Anlegen und Text — das hat den Wächter
selbst belehrt) und ein Textblock, an dem die Schale weiterhin zurücknehmen
MUSS. Gegen den alten Stand rot mit 13 von 25; Gegenprobe (Zeile raus) rot.
Zwölf Nachbarn grün; `test105` fand einen Typfehler im Wächter selbst.
Bild: Whiteboard nach Strg+Z → Strg+Umschalt+Z mit Fokusrahmen.

---

## 25. September 2026 · E681 · Der Plattform-Audit — Teil 1 und die Karte

**Der Auftrag.** Redurs Master-Prompt: erst lesen, dann ein kleinster
Schritt; GFX-Kern, Plugin-SDK, Katalog, CLI. Elf Leser je System, zwei für
die Referenzen (AFFiNE MIT, SiYuan AGPL — nur gelesen), je zwei Duplikate
gegengeprüft.

**Was herauskam** (`doku/REDION-PLATTFORM-AUDIT.md`): Redion hat schon
einen halben GFX-Kern (`SheetSpace`, `InkGeometry`, `InkShapes`,
`InkStroke`, `Folien`), den nur die PDF-Schicht benutzt; vier eigene
Rückgängig-Stapel nach demselben Muster; drei eigene Zeigerumrechnungen;
`esc` 68-mal, 54-mal ohne Apostroph; `test537` sieht `(globalThis as any)`
nicht (L211). Und zwei Messungen, aus denen E682 und E684 wurden.

**Die Karte** (`doku/karte/`, Redur: „erstelle dabei eine obsidein/graphy
datei"): `karte.json` als Quelle, `karte.mts` als Schreiber, eine Notiz je
System und je Kern, ein Graph, dessen Kanten aus den Befunden gerechnet
sind — benutzt, nicht nur genannt. Die erste Fassung hatte beides gleich
gemalt; der Fehler steht in E681.

**Offen daraus:** Teil 2 (die Kapitel A–S aus den Lesern), W6 (die
Werkzeugleiste nach dem Edgeless-Vorbild, für alle Flächen — „integriere
alles zusammen"), Bogen 3 (`raumVersion` fürs Whiteboard, von Redur
freigegeben), Bogen 4 (der gemeinsame Verlauf).

---

## 23. September 2026 · E697 (kam als E681) · Farben, Freitext und Stiftzubehör

- GitHub abgeglichen: `main` bei `552b7a23`, zuletzt aktualisierter
  Arbeitsbranch bei `a196b65d`; neuer Branch `codex/dokument-stift-freitext`.
- Direkte Palette mit benannten Markerfarben, transparenter Papier-Vorschau,
  Hex-Eingabe, Systemfarbwähler und bestehenden Farbsätzen.
- Farbwahl im offenen Freitext erhält Entwurf und Cursor; Abbruch verliert
  nichts. Kompositions-Escape bleibt beim Eingabesystem.
- Texteingaben bündeln die Geometriearbeit pro Bild. Die aufgeklappte
  Zubehörleiste zeigt nur Gruppen des aktiven Werkzeugs.
- L209 Punkt 9 geschlossen; alte Striche, Werkzeugvorlieben, Farbsätze und
  eigene Leistenordnung bleiben erhalten. Details und Grenzen in E697.
- Neuer Wächter `test577` (kam als `test568`; beim Zusammenführen am 27. September umnummeriert, weil beide Nummern auf dem Arbeitszweig schon vergeben waren): alter Stand rot, umgesetzt 29 Zusagen grün.
  Screenshots lokal in `bilder/`; kein Push und keine Veröffentlichung.


## 20. September 2026 · E666 · „Erinnerung" führt zu einer Erinnerung

**Der Fund.** Der Slash-Eintrag „Erinnerung ⏰" schrieb `@remind ` in den
Text — und **nirgends im Programm wird `@remind` gelesen**. Die Hilfeseite
sagt dazu ein Häkchen. §47, die stille Hälfte: kein Fehler, keine Meldung,
nur nichts.

**Dabei war alles da.** `Werkzeuge.erinnerungSetzen` mit Dialog, Liste,
Geräte-Meldung und Weckruf am Server steht seit E54. Erreichbar war es nur
über das Seitenmenü. Es fehlte der Draht, nicht die Maschine.

**Gebaut — und zwar im Register.** Der nächstliegende Weg wäre ein
`if (was === 'remind') Werkzeuge.…` im Editor gewesen. Das wäre ein NEUER
Querverweis: `bereiche/editor → Werkzeuge` steht bei 1 und darf nicht
wachsen (§5 Regel 1). §5 nennt für genau diesen Fall den dritten Weg —
„über `register/` bekannt machen" —, und das Muster steht schon in
`register/menueband.ts:701`. Gemessen nach dem Bogen: **518 Treffer,
unverändert.**

**Geprüft.** `test555` neu, zwölf Messungen, gegen den alten Stand 2/12.
Gegenprobe: `tun` umbenannt → genau die Zusagen werden rot, die daran
hängen. `test537` unverändert, `test87`, `test105`, `test109` grün, dazu die
sechs Speicherläufe `test95`–`test100` nach der `updateBlock`-Änderung aus
E663 — alle grün.

**Zwei Zusagen waren im ersten Anlauf grün, weil nichts lief**
(`undefined === undefined`). Beide prüfen jetzt zuerst, ob der Schritt
stattgefunden hat. Und was der Lauf NICHT beweist, steht in ihm drin.

---

## 20. September 2026 · Der volle Lauf, und E665

**Der volle Lauf.** 490 Läufe in 49 Stücken, 107 Minuten, im eigenen
Arbeitsbaum auf `74bde43`. **487 grün, 3 rot** — und keiner der drei war
ein Produktfehler:

| Lauf | was er meldete | was es war |
|---|---|---|
| `test270` | `[".git","node_modules"]` gehen ins Netz | das Arbeitsbaum-Artefakt aus §30. Im HAUPTBAUM nachgemessen: 77 ok, 0 offen. |
| `test403` | „Beide stehen in einem finally — [false,true]" | zu enges Fenster, E664 |
| `test537` | 518 gegen 517 Treffer | einer meiner (E665), einer seit E500 unsichtbar (L207) |

Dazu 27 mitmarkierte Unschuldige durch den Werkzeugfehler aus E662 — der
ist repariert, bevor er ein zweites Mal irreführt.

**E665 — ein Griff statt zwei.** `test537` meldete einen neuen Querverweis,
weil E661 in der Einstellungsseite `KI.modelleHolen(id)` UND
`KI.modelleVon(id)[0]` rief. Der Wächter hatte recht, und zwar doppelt:
„holen und dann das erste nehmen" ist eine Prozedur der KI, nicht Wissen
der Einstellungsseite. Jetzt `KI.modellWaehlen(id)` — 519 → 518.

**Und was dabei herauskam.** Der zweite Treffer ist kein neuer Aufruf:
`Einstellungen.oeffne('schluessel')` steht seit E500 im KI-Fenster und war
für den Wächter unsichtbar, weil `ohneSchablonen` ihn für Text hielt.
Nachgemessen über alle 86 Dateien: **266 echte Aufrufe (3,4 %) werden
verdeckt**, allein 136 in `editor.ts`. Die 517 sind ein Mindestwert, kein
Stand.

**Das Verzeichnis wurde NICHT angehoben.** Die drei Wege stehen mit ihren
Kosten als **L207**; §5 sagt selbst, dass die Richtung Redur gehört. Bis
dahin bleibt `test537` rot und `main` steht (§46).

---

## 20. September 2026 · E663/E664 · Die Rückschau zählt wieder, und ein Wächter sieht den ganzen Block

**E663 — was abgehakt wird, zählt.** Die Wochenrückschau rechnet mit
`erledigtAm`, und für Blöcke schrieb das Feld **niemand**: der einzige
Schreiber im ganzen Programm war der ICS-Import. Wer eine Woche lang
Aufgaben abhakte, sah am Sonntag eine leere Rückschau und ein Tagesdiagramm
aus Nullen — kein Fehler, keine Meldung, immer null (§47).

Der Stempel sitzt jetzt in `Store.updateBlock`, weil `checked` an sechs
Stellen geschrieben wird und sechs Kopien fünf Gelegenheiten zum Vergessen
wären (§8). Der Haken zurück nimmt das Datum mit. Und der Altbestand zählt
über `edited` mit — dieselbe Regel, die Datenbankzeilen zwanzig Zeilen
tiefer längst hatten.

**E664 — ein zu kleines Fenster.** Der volle Lauf meldete „Beide stehen in
einem finally — [false,true]". Der Code war richtig: `test403` sah zwei
Zeilen zurück, und E652 hatte zwei Zeilen in dasselbe `finally` geschoben.
Ein Wächter, der an der Reihenfolge innerhalb eines Blocks scheitert, prüft
die Reihenfolge und nicht den Block. Jetzt wird der Blockkopf gesucht,
Klammern zählend nach oben.

**Geprüft.** `test554` neu, elf Messungen, gegen den alten Stand 7/11, mit
zwei Gegenproben. `test403` 22/22 mit eigener Gegenprobe (ein `remove` aus
seinem `finally` geholt → wieder rot). `test550` 8/8.

**Nachgesehen, nicht angenommen:** dieselbe Redewendung
`slice(Math.max(0, i - …))` kommt in keinem der übrigen 495 Läufe vor.

---

## 20. September 2026 · E662 · Der Sweep nennt den Schuldigen, nicht sein ganzes Stück

**Der Ernstfall.** Zwei Stunden nach seinem Bau meldete `volllauf.mts` zehn
rote Läufe (266 bis 277). Im Protokoll darüber stand „✗ 1 von 10 Läufen
gescheitert: test270". Einer.

**Die Ursache.** Die Zerlegung suchte je ZEILE nach einem ✗ UND einer
Testnummer. `alle.mts` schreibt seine Bilanz auf zwei Zeilen — die erste
trägt das Zeichen, die zweite den Namen. Also fand sie nichts und fiel auf
„das ganze Stück ist rot" zurück.

**Was bleibt.** Der Rückfall. Er erfindet keinen Schuldigen (§56), und
lieber neun zu viel als einer zu wenig. Falsch war nur, ihn so leicht
auszulösen: neun grüne Läufe verstecken den einen, auf den es ankommt.

**Gebaut.** Die Bilanz wird zuerst gelesen, einzelne ✗-Zeilen danach, und
was nicht zum Stück gehört, macht keinen fremden Lauf rot. `volllauf.mts`
arbeitet nur noch, wenn es direkt gestartet wurde — importiert gibt es nur
`roteAus` her, damit ein Wächter es prüfen kann, ohne den Sweep loszutreten.

**Geprüft.** `test553` neu, sechs Messungen, mit der ECHTEN Bilanz vom
20. September als Eingabe. Gegenprobe: die alte Regel eingesetzt → genau
das beobachtete Symptom.

**Offen.** Der eine echte rote Lauf ist `test270` mit dem Artefakt, das §30
beschreibt (`.git` als Datei, `node_modules` als Symlink im Arbeitsbaum).
Er wird im Hauptbaum nachgemessen, sobald der Sweep durch ist — vorher wird
daran nichts repariert.

---

## 20. September 2026 · E661 · Groqs 404 — der Anbieter hat immer recht

**Redurs Meldung.** „Groq antwortet mit 404. Die Adresse gibt es nicht
(object_not_found)" — gefolgt von Groqs eigenem Satz, dass das MODELL
`llama-3.3-70b-versatile` nicht mehr existiert.

**Der Fund.** Die Adresse gab es sehr wohl; Groq hat sie beantwortet.
Redion hatte die richtige Erklärung in der Hand und stellte seine eigene,
falsche davor. Wer sie liest, sucht an der URL, am Schlüssel, an der
Firewall — überall ausser am Modell.

**Gebaut.** Sagt der Anbieter etwas, führt SEIN Satz die Meldung an; die
Statustabelle bleibt für den, der schweigt (leere 502, kaputter Proxy).
Bei `model_not_found` kommt dazu, was zu tun ist. Und `modelleHolen` fragt
den Anbieter unter `/models`, was er heute anbietet — beim Probelauf nach
dem Hinterlegen eines Schlüssels und über „Modelle erneut holen" im Menü.
Die eingebaute Liste ist ab jetzt ein Rückfall, keine Wahrheit.

**Was nicht geraten wurde.** Das tote Modell ist gestrichen. Was an seine
Stelle getreten ist, weiss Groq und nicht ich (§56). Im Preisverzeichnis
bleibt es stehen — dort werden bereits gelaufene Aufrufe nachgeschlagen.

**Geprüft.** `test552` neu, 15 Messungen mit Groqs echtem Fehlerkörper,
gegen den alten Stand 4/15. Zwei Gegenproben — und die erste war FALSCH,
nicht der Code: `false && A || B` lässt `B` übrig. Eine Gegenprobe ist ein
Stück Code wie jedes andere.

---

## 20. September 2026 · E660 · Die Tabellenwerkzeuge sind am Telefon zu treffen

**Der Fund.** Am Telefon sind die sieben Knöpfe unter einer Tabelle der
EINZIGE Weg, eine Spalte oder Zeile anzulegen — die Griffe daneben messen
7 px und stehen erst nach einem `mouseover` da, den ein Daumen nicht
erzeugt. Die Knöpfe waren 26 px hoch: weder die harte 44 noch die 32 eines
Nebenwegs, und ohne den geschriebenen Grund, den §37 dafür verlangt.

**Gebaut.** 44 px unter `@media(hover:none)`, dort wo L108 schon steht —
kein zweiter Katalog. Am Rechner bleibt es bei 26 px, und `test551` misst
auch das: eine Maus trifft genauer, und eine hohe Leiste unter jeder
Tabelle wäre dort nur laut.

**Was ich zuerst falsch gebaut hätte.** Ich war dabei, eine zweite
Werkzeugzeile für den Daumen zu schreiben — `.stab-tools` gibt es seit
langem, und L108 hat sie am Telefon längst sichtbar gemacht. Der fertig
geschriebene Wächter dafür wurde weggeworfen und neu geschrieben. §45
Schritt 1 heisst „bestehenden Code lesen", und er ist der Schritt, der am
häufigsten fehlt.

**Der Fund über dem Fund.** `test402` hält dieselbe Regel und konnte diese
Knöpfe nie sehen: er sucht `height`/`min-height` im Stilblatt, und die 26 px
kamen aus Innenabstand und Schriftgrösse. Eine Messung, die nicht messen
KANN, was sie behauptet, sagt immer „passt schon" — eingetragen als L206,
statt hier versprochen (§35).

**Geprüft.** `test551` neu, 9 Messungen, gegen den alten Stand 8/9 mit
genau der einen roten Zeile („7 von 7 unter 44 px"). `test402` grün,
`test549` 6/6, `test550` 8/8 — die beiden Doku-Wächter haben im selben Bogen
zugeschlagen, als L206 und `test551` die Zahlen verschoben.

**Bild.** `bilder/tabelleDaumen-handy-dunkel.png` (§55.3).

---

## 20. September 2026 · E659 · Die Doku zählt, was da ist

**Der Anlass.** §30 sagt über die Zahl der Prüfläufe: „Sie wird nicht
geschätzt, sie wird gezählt." Sie stand einmal hundertfünfzehn Läufe
daneben, dann achtundzwanzig, dann einen — und dieser eine war schon vorher
falsch. Der Satz „im selben Bogen nachziehen" steht fünfzehnmal in §30. Was
fehlte, war nie die Absicht, sondern die Prüfung.

**Gebaut.** `test550` prüft die drei Stellen in CLAUDE.md gegen die echte
Dateizahl, das Verzeichnis von ENTSCHEIDUNGEN.md gegen seinen Text (§34),
die selbstgenannte Zahl gegen die gezählte, und ob jede Lücke in der
Nummernfolge oben erklärt ist.

**Er hat sofort funktioniert** — gegen den Stand, den er selbst erzeugt
hatte: 492 Dateien, 491 in der Doku, weil `test550.mts` die 492. ist. Und
beim Nachziehen erwischte er mich beim Vorgreifen: „639 … E659" geschrieben,
bevor es E659 gab.

**Die schwierige Stelle war das Zählen.** ENTSCHEIDUNGEN.md kennt drei
Überschriftsformen; vier Anläufe meldeten nacheinander 351, 253 und 203
fehlende Einträge — jedes Mal der Prüfer, nie die Datei. Die Regel, die
hält, setzt keine Form voraus.

**Zwei Funde lösten sich beim Lesen auf:** dass E198/E199/E222/E269 ohne
Eintrag zitiert werden (steht seit langem in Zeile 35, mit Grund), und dass
Index und Text auseinanderliefen (638 von 638, stimmt). Beides steht hier,
weil das Nicht-Erfinden zur Arbeit gehört.

**Geprüft.** `test550` 8/8, gegen den alten Stand 4/8. Gegenprobe: eine der
drei Zahlen verstellt → genau diese eine Zeile wird rot. Kein Browser, kein
Port — er darf neben dem vollen Lauf laufen.

---

## 20. September 2026 · E657/E658 · Ein Werkzeug für den vollen Lauf, und eine ehrliche Lückenliste

**E657 — der volle Lauf bekommt ein Werkzeug.** §30 beschreibt seit dem
3. September, wie er gefahren wird: in Stücken, wiederaufnehmbar, mit einer
Merkdatei. Es gab das nur als Handgriff — zehn Nummern abtippen, warten,
die nächsten zehn, und im Kopf behalten, wo man war. Beim vorletzten vollen
Lauf ist genau das schiefgegangen. `pruefungen/volllauf.mts` schreibt nach
JEDEM Stück, verträgt eine Liste, die unterwegs wächst, und erfindet
keinen Schuldigen, wenn ein Stück rot ist, ohne dass die Ausgabe den Lauf
nennt. Der erste Versuch scheiterte nach vier Sekunden an etwas, das jetzt
in §30 steht: ein Arbeitsbaum enthält, was eingecheckt ist.

**E658 — die Lückenliste sagt die Wahrheit über sich selbst.** 33 OFFENE
Lücken standen unterhalb von „Anhang B · Was erledigt ist"; wer von oben
las, hielt sie für erledigt. Das ist der stille Fehler, gegen den §35
geschrieben ist — in der Datei, die ihn verhindern soll. Dazu fünf
Überschriften mit „abgearbeitet", „erledigt" oder „GELANDET" statt des
einen Wortes, das §35 nennt, und eine selbstgenannte Zahl (103/53/50), die
um zwei danebenlag.

Verschoben wurde nicht von Hand: die Datei wird in 109 Blöcke zerlegt, und
BEVOR etwas bewegt wird, muss das Zusammensetzen byteweise die alte Datei
ergeben. 6816 Zeilen sind gewandert, keine verloren (§43).

**Geprüft.** `test549` neu, sechs Messungen, gegen den alten Stand 3/6.
Gegenprobe: ein offener Eintrag ans Dateiende gehängt → Abschnitt 2 wird
rot. Er liest nur eine Datei — kein Browser, kein Port —, darf also neben
einem vollen Lauf laufen. `test105`, `test109`, `test87` grün.

**Zweimal hat der Wächter zuerst sich selbst korrigiert:** „offen" im TITEL
von L181 als Status gelesen, und das Datum im Selbstzähl-Satz für die
Zählung gehalten. Beide Male rot und beide Male das Falsche gesagt.

**Offen und Redurs Entscheidung:** `L52` ist durchgestrichen und trägt im
Titel „die Prüfseite bleibt offen". Nach der Regel zählt er als geschlossen.
Ob der Rest eine eigene Nummer bekommt, ist inhaltlich und gehört ihm.

---

## 20. September 2026 · E656 · Text ändern, ohne den alten Stand zu verlieren

**Redurs „usw."** Umschreiben, kürzen, übersetzen ging nur über das
Chatfenster; als Agentenwerkzeug fehlte es.

**Was daran anders ist.** `textBearbeiten` ist das erste Werkzeug, das
BESTEHENDEN Text anfasst. Anlegen kostet im Fehlerfall einen überflüssigen
Block; Ändern kostet den alten Stand.

**Gebaut, mit zwei Vorkehrungen.** Erstens eine Fassung „vor KI-Änderung"
VOR dem Schreiben — unabhängig von der Vier-Minuten-Sperre und vom
Schalter `autoVersionen` (E417), denn ein Schalter darf keinen Schutz
abschalten, um den gebeten wurde. Scheitert sie, wird gar nicht geändert.
Zweitens „genau einmal oder gar nicht": kommt die Stelle mehrfach vor — im
selben Block oder in zweien —, wird nichts geändert und die Zahl genannt.
Der geänderte Block trägt danach `herkunft: "ki"` (E307), und das Tor aus
E295 zeigt jetzt den Wortlaut vorher und nachher statt „höchstens ein
gespeichertes Objekt".

**Geprüft.** `test548` neu, siebzehn Messungen, gegen den alten Stand
2/17. Zwei Gegenproben, beide gefahren: ohne die Fassung steht da „0 → 0"
und „KEINE FASSUNG"; ohne die Eindeutigkeitsprüfung kommt der Fehler aus
E650 wörtlich zurück — „Die Leitung liegt. Das Kabel bleibt."
`test547`, `test546`, `test291`, `test281`, `test286`, `test87`, `test105`,
`test109` grün, `typecheck` sauber, Einzeldatei neu.

**Bild.** `bilder/kiTextTor-rechner-hell.png` (§55.3).

---

## 20. September 2026 · E655 · Lernkarten, PDF und Tabellen

**Redurs erste Hälfte.** „lernkarten erstellen pdf elssen, tabelas usw."
E654 hat die Grenze gebaut; das hier ist das, wofür sie da war.

**Der Fund.** Für alle drei gab es etwas, das fast passte, und nichts, das
passte. Den Schnellbefehl „Mache aus dieser Seite Karteikarten" — der
schreibt Text ins Chatfenster, und Text lernt niemand. Den PDF-Wortlaut in
`suchtext`, über die Suche zufällig erreichbar, gezielt nicht. Und
`datenbankAnlegen`, das eine Datenbank baut, wo drei mal vier Zellen im
Absatz gemeint waren.

**Gebaut.** `karteikartenAnlegen` (echte `flashcard`-Blöcke im Format
`Frage :: Antwort`), `pdfLesen` (Seitenspanne, kürzt mit Ansage statt
stillschweigend) und `tabelleAnlegen` (`table`-Block mit `rows`, alle Zeilen
auf gleiche Breite gefüllt). Alle drei setzen `herkunft: 'ki'` und tragen
damit den Streifen aus E307. Verteilt sind sie sparsam: der Assistent
bekommt alle drei, der Rechercheur zwei, der Redakteur nur `pdfLesen`.

**Geprüft.** `test547` neu, achtzehn Messungen, gegen den alten Stand
3/18. Die Gegenprobe ist die lehrreiche: schreibt das Kartenwerkzeug `text`
statt `flashcard`, meldet es weiterhin „3 Lernkarten … stehen ab sofort im
Lernzentrum bereit", und `Learning.cards()` zählt null. Eine
Erfolgsmeldung ist kein Erfolg. `test546`, `test291`, `test281`, `test286`,
`test87`, `test105`, `test109` grün, `typecheck` sauber, Einzeldatei neu.

**Bild.** `bilder/kiTabelle-rechner-hell.png` (§55.3).

---

## 20. September 2026 · E654 · Die KI darf löschen — und fragt jedes Mal

**Redurs Auftrag.** „die ai teil darf mehr machen z.B lernkarten erstellen
pdf elssen, tabelas usw alles machen kann ausser ohne meine bestetigung
etwas löschen." Zwei Sätze in einem; der zweite ist der, der den ersten
erst erlaubt.

**Der Fund.** Der Agentenkatalog kannte zwölf Werkzeuge und zwei Rechte —
`lesen` und `bearbeiten`. Kein Löschwerkzeug. Die Regel galt also nur,
weil es die Handlung nicht gab, und das ist keine Sicherheit, sondern eine
Lücke im Können. Das vorhandene Tor für `bearbeiten` wäre für Löschen an
drei Stellen zu weich: `fragenModus() === "nie"`, „für diesen Lauf
erlauben", und `darfAllein` im unbeaufsichtigten Lauf.

**Gebaut.** Eine eigene Rechteklasse `loeschen` mit einem Tor in der
SCHLEIFE — nicht im Werkzeug, damit es für jedes künftige Löschwerkzeug
gilt, ohne dass jemand daran denken muss. Keine der drei Weichheiten greift
dort. Das erste Werkzeug der Klasse ist `seiteLoeschen`: es ruft
`Store.trashBlock`, legt also in den Papierkorb und vernichtet nichts
(§43). Unbeaufsichtigt werden Löschwerkzeuge zusätzlich gar nicht erst
angeboten — zwei Sperren für denselben Fall.

**Geprüft.** `test546` neu, dreizehn Messungen. Gegenprobe mit abgehängtem
Tor: der Lauf druckt die Zeile, um die es geht — „Seite ‚Weg damit' liegt
im Papierkorb", bei null Dialogen, nachdem der Mensch Nein gesagt hatte.
`test291`, `test281`, `test286`, `test301`, `test87`, `test105`, `test109`
grün, `typecheck` sauber, Einzeldatei neu gebaut.

**Bild.** `bilder/kiLoeschTor-rechner-hell.png` — echter Agentenlauf, nur
das Modell abgehängt; der Fokus liegt auf „Nicht löschen" (§55.3).

**Offen und als nächstes.** Redurs erster Satz: Lernkarten, PDF-Lesen,
Tabellen. Dieser Bogen baut die Grenze, die sie sicher macht (§46).

---

## 20. September 2026 · E653 · Das KI-Blatt am Telefon hatte keinen Weg zurück

**Der Fund.** Am Telefon ist `#ai` ein Blatt, das von unten kommt — und wer
es öffnete, konnte es nicht mehr schliessen. Gemessen auf 390 × 844:
`#btn-ai` steht dort auf `display:none` (bausteine.css:300 und :2119),
`.ai-head` trug zwei Knöpfe und kein Kreuz, Strg+J gibt es an einem Telefon
nicht, und der Escape-Griff in `schale.ts` räumt `.menu` und `.overlay` —
`#ai` ist ein `<aside>`. Das Blatt ist 88vh hoch und liegt auf z-index 920;
die untere Leiste auf 401 ist vollständig verdeckt. Der einzige Ausweg war,
den Tab zu schliessen. §37 ist **[hart im Kern]**.

**Der zweite, leisere Fund.** `#ai::before` zeichnet oben den Wischgriff,
und sein eigener Kommentar sagt, was er verspricht: „er sagt ohne Wort, dass
man das Blatt wegwischen kann". Gewischt werden konnte nichts —
`wischen.ts` kennt `#handy-oben` und sonst nichts. Ein gezeichnetes
Versprechen ist dasselbe Versprechen (§47), und hier war es das einzige,
das überhaupt einen Weg zurück andeutete.

**Gebaut.** Ein Schliess-Knopf `#ai-zu` im Kopf (44 px, `aria-label`) für
BEIDE Bildschirme — ein Weg, nicht zwei (§8). Und der Griff zieht wirklich:
`pointerdown` auf `.ai-head`, mehr als 90 px nach unten schliesst, darunter
federt es zurück; nur unter 760 px, nicht auf den Knöpfen, nicht auf dem
Verlauf darunter (der rollt).

**Geprüft.** `test545` neu, zwölf Messungen, gegen den alten Stand rot mit
der Zeile, um die es geht: „2 geprüft, 0 schliessen — das Blatt ist eine
Falle". Gegenprobe: `kiGriff()` abgehängt → genau eine Zeile wird rot,
während „Der Zug landet wirklich auf dem Kopf" grün bleibt. `test544`,
`test87`, `test105`, `test109` grün, `npm run typecheck` sauber,
`redion-einzeldatei.html` neu gebaut, `npm run stand` unverändert.

**Und zweimal rot aus dem falschen Grund.** Erst mass der Lauf den Knopf
NACH dem Klick — geschlossen steht `#ai` auf `display:none`, also 0 × 0.
Dann zog er gegen `#rg-willkommen`, das Willkommensblatt über allem, und
meldete „die Geste gibt es nicht", obwohl sie gebaut war. Er prüft jetzt mit
`elementFromPoint`, wer unter dem Finger liegt. Vierter und fünfter Fall
derselben Sorte an zwei Tagen.

**Bild.** `bilder/kiBlatt-handy-dunkel.png`, neue Ansicht `kiBlatt` in
`bilder.mts` (§55.3).

---

## 20. September 2026 · E652 · Das KI-Fenster tut, was seine Knöpfe versprechen

Zwei Funde der Bestandsaufnahme, beide in `src/bereiche/ki/dienst.ts`.

**Der Chat hatte keinen Stopp-Knopf** — und das Ärgerliche daran: die ganze
Abbruchkette war gebaut. `frage` nimmt ein Signal, reicht es über
`ollamaFragen` bis in `fetch`, und sogar der Backoff-`schlafen` bricht ab.
Nur `senden` liess das dritte Argument weg, und im Markup gab es keinen
Knopf. Wer eine lange Antwort losgeschickt hatte, konnte sie nur durch
Schliessen des Tabs beenden.

**„Meine Quellen" öffnete nichts.** `quellenKarte(e.currentTarget)` — ein
HTML-Element an eine Funktion, die eine Liste erwartet. `!element.length`
ist wahr, also lautlos `null`, und selbst das wurde nirgends eingehängt.

**Gebaut.** Kein zweiter Knopf: der Senden-Knopf wird für die Dauer des
Laufs zum Stopp-Knopf — dasselbe Element, dieselbe Grösse (§37), und
`aria-label` wechselt mit (§38). Ein Abbruch behält die Teilantwort und
sagt „Abgebrochen" statt „AbortError"; das Eingabefeld bleibt gefüllt,
sonst verlöre man seine Frage. Der Menüpunkt öffnet jetzt **dieselbe**
Schalterleiste, die im Fuss steht — nicht eine zweite Liste (§8).

**Und der Wächter hätte fast danebengegriffen.** `test544` war bei den
Quellen im ersten Anlauf **grün**, ohne dass etwas repariert war: er zählte
sichtbare `[data-qs]` im ganzen Dokument, und die Leiste steht ohnehin im
Fuss. Erst mit einem `Set` der Schalter **vor** dem Klick stand da
„0 Schalter sichtbar". Dritter Fall dieser Art an einem Tag.

**Geprüft.** `test544` 11/11 (vorher 3/11) · `test34`, `test37`, `test272`,
`test391`, `test105`, `test109` grün · `npm run typecheck` ohne Befund.
`CLAUDE.md` §30/§31 auf **486**. **Bild:** `bilder/ki-stoppknopf.png` —
derselbe blaue Kreis, `■` statt `↑`, während „KI arbeitet …" läuft (§55.3).

---

## 20. September 2026 · E651 · Der Verbindungsschalter gilt wirklich

**Der Fund** kommt aus der Bestandsaufnahme desselben Tages. Das
Datenbankmenü hat einen Punkt „Verbindungen dieser Datenbank" mit einem
Fusstext, der wie eine Zusage klingt:

> „Verknüpfte Dienste dürfen Zeilen dieser Datenbank lesen und schreiben —
> etwa der GitHub-Spiegel."

`coll.verbindungen` wurde an zwei Stellen **geschrieben** und **nirgends als
Erlaubnis gelesen**. Der Spiegel hängt an `gespiegelt`/`spiegelQuelle` und
kannte den Schalter nicht.

**Der zweite Fehler war der schlimmere:** die Anzeige. Bei einer nie
angefassten Datenbank stand bei jedem Dienst „aus" — **während der Spiegel
lief.** Ein Knopf, der nichts tut, ist ärgerlich; einer, der „aus" sagt,
während etwas läuft, ist eine falsche Auskunft über die eigenen Daten.

**Gebaut.** `Spiegel.darf(coll, dienst)` beantwortet die Frage an einer
Stelle — und das Menü ruft für die **Anzeige** dieselbe Funktion, die den
Zugriff **sperrt** (§8). `undefined` heisst erlaubt, `[]` heisst gesperrt:
ein Schalter, der bei seiner Einführung jeden laufenden Spiegel abwürgt,
wäre schlimmer als der Fehler (§46, §51). Keine Migration, kein Stichtag.

**Die Sperre sitzt vor dem Netzruf.** Beide Abgleichwege holen zuerst und
suchen die Datenbank danach — hätte ich nur das Zurückschreiben gesperrt,
wäre das Lesen weitergelaufen und mit ihm das Token.

**Geprüft.** `test543` 13/13, gegen den alten Stand rot mit der Zeile, auf
die es ankommt: **„Und es geht KEIN Ruf hinaus — 1 Rufe"**. Dazu `test537`
(kein neuer Querverweis — beide Dateien liegen unter
`bereiche/datenbanken/`), `test87`, `test105`, `test109`, `test400` grün ·
`npm run typecheck` ohne Befund. `CLAUDE.md` §30/§31 auf **485** nachgezählt.

**Kein Bild:** eine Rechteprüfung hat nichts zu sehen — hier ist die Messung
der Beweis (§55.3).

---

## 20. September 2026 · E650 · Die Auswahlleiste trifft die markierte Stelle

**Der Fund** kommt aus der Bestandsaufnahme desselben Tages — aus dem
Gegenleser, dessen Auftrag war, den Editor-Befund zu widerlegen. Kein
Prüflauf hatte die Auswahlleiste je angefasst.

```ts
const neu = (b.text || '').replace(txt, marke + txt + marke);
```

`String.replace` mit einem **String** als Muster ersetzt das **erste**
Vorkommen. Nicht das markierte. Wer in „Test und Test" das zweite Wort
markiert und auf Fett drückt, bekommt das erste fett — kein Absturz, keine
Meldung, nur Text an der falschen Stelle. Dieselbe Zeile ein zweites Mal in
`linkSetzen`.

**Neun Monate unauffällig**, weil der Normalfall immer richtig war: ein
kurzer Block mit einem einmaligen Wort.

**Zuerst der Wächter** (§30). `test542` war gegen den alten Stand rot — und
beim ersten Anlauf aus dem falschen Grund: „KEIN BLOCK", weil
`App.zeichneSeite(id)` ohne `App.oeffne(id)` die Bibliothek stehen lässt. Er
wäre genauso rot gewesen, wenn es den Fehler nicht gäbe. Erst der zweite
Anlauf hat den falschen Wert ausgedruckt — `**Test** und Test` — und damit
wirklich etwas gemessen.

**Gebaut.** Drei Stufen: geprüfte Zeichenstelle aus `auswahlOffset()` im
Normalfall · die Reihenfolge des Vorkommens bei gerendertem Markdown · der
alte Weg als Rest. Der Fehler bleibt in genau diesem Rest bestehen, und das
steht so im Quelltext — ein Ratespiel an Nutzertext wäre schlimmer.

**Offen geblieben und benannt:** dieselbe Funktion kann Fett nicht
abschalten (`Strg B` auf fettem Text ergibt `****Text****`). Eine
Bedienlücke, kein falscher Text — und §43 sagt, eine Änderung hat ein Ziel.

**Geprüft.** `test542` 10/10 (vorher 5/10) · `test132`, `test202` grün —
Markdown-Kürzel und Lückenkarten, die denselben Offset benutzen ·
`test105`, `test109`, `test400` grün · `npm run typecheck` ohne Befund.
`CLAUDE.md` §30/§31 auf **484** nachgezählt.

---

## 20. September 2026 · E649 · Zwei rote Läufe, und beide waren achtundvierzig Stunden alt

**Der Anlass:** der erste volle Lauf gegen das neue `main` — 483 Läufe in 49
Stücken, drei rot.

**Die Trennung zuerst.** `test270` war im Arbeitsbaum rot und im Hauptbaum
grün: dort ist `.git` eine Datei und `node_modules` ein Symlink, und der Lauf
filtert Ordnermuster mit `istOrdner && name === …`. CLAUDE.md §30 beschreibt
genau diesen Fall; er ist eingetreten. `test272` und `test290` waren echt —
und **keiner von beiden war im Lauf vom 19. September rot.** Sie sind in den
achtundvierzig Stunden danach entstanden, in meinen eigenen Bögen E639 und
E640.

**Der Fund 1.** `fokus.ts` legt beim Öffnen eines Dialogs alles still, was
daneben im Körper steht — überspringt dabei aber alles, was kein
`HTMLElement` ist. E639 hat für die Glaslinse ein `<svg>` direkt an den
Körper gehängt. Ein `SVGElement` fällt durch das `instanceof`, und `.inert`
gibt es dort gar nicht: `undefined`. Bei offenem Backstage-Blatt konnte man
hinter die Fläche tabben. **Derselbe Fehler stand seit E462 in `textur.ts`
daneben** und fiel nur nie auf, weil dieser Halter erst bei Gebrauch
entsteht.

**Der Fund 2.** `.bw-flug` und `.bw-wartet` kamen mit E640 dazu; mit dem
älteren `.bw-trenn` sind es sieben Vorkommen, und ab vier gilt ein Präfix als
eigener Namensraum. Es stand nicht im Verzeichnis. Beim Eintragen fiel auf,
dass der Fliesstext derselben Datei „Es sind 144" behauptete, während das
Verzeichnis 158 Einträge trug.

**Gebaut.** Nicht den Wächter gelockert, sondern den Körper aufgeräumt: beide
Halter liegen jetzt in einer von Geburt an stillgelegten Hülle. Eine Ausnahme
im Wächter hätte jede spätere gedeckt (§55.2). `bw  7  bausteine.css`
eingetragen, die Zahl im Fliesstext auf 159 nachgezählt und den Zählbefehl
danebengeschrieben.

**Geprüft.** `test272` und `test290` grün · `test128`, `test435`, `test539`,
`test541` grün · `npm run typecheck` ohne Befund · `npm run stand` v1235 ·
`node bauen.mts` 10 517 KB. **Und hingesehen:** `node bilder.mts heute handy`
zeigt die Linse über „Heute", der Name darunter bleibt lesbar — die Hülle hat
den Filter nicht gebrochen (§55.3).

**Die Gegenprobe war nicht zu bauen, sie war da.** Beide Läufe *waren* rot und
sind es nicht mehr.

---

## 20. September 2026 · E646/E647 · Die Auswahlfläche wandert — auch unter Last

**Redurs Frage:** eine Bildschirmaufnahme der unteren Leiste, sieben Punkte
Kritik, und „Denkst du ist das so gut?"

**Der Fund.** Aus seiner Aufnahme, Bild für Bild bei 50 Bildern je Sekunde:
vier Reiterwechsel, viermal **ein einziges Bild** für 140 bis 209 Pixel. Am
Rechner wandert dieselbe Fassung über 16 bis 21 Zwischenorte — die Bewegung
war da und kam nicht an. Mit gedrosselter Rechenleistung brachen genau die
zwei Wechsel ein, die einen ganzen Bildschirm neu aufbauen (8×: 5 statt 16
Orte). **Die erste Vermutung war falsch:** ohne die SVG-Glasbrechung
dasselbe Ergebnis. Schuld war `width` in der Übergangsliste — wer Layout
animiert, bleibt auf dem Hauptfaden.

**Gebaut.** `src/schale/bedienung/selection-flow.ts`: eine kritisch
gedämpfte Federbahn, einmal ausgerechnet und als `transform`-Keyframes
übergeben, damit die Bewegung auf den Compositor darf. Beim Umlenken werden
Ort UND Tempo aus der Formel übernommen; eine Bahn wird nie angestellt.
Im ersten Bild: **11 % des Weges statt 31 %.** Dazu: Dehnung am Tempo statt
an einer Uhr · Farbe des ankommenden Reiters um 130 ms verzögert · im
Ruhezustand keine Brechung mehr · zwei Innenschatten statt vier.
E647 zieht die Werkzeugleiste des Schreibstudios nach (FLIP auf `transform`
statt vier Layout-Eigenschaften) — damit ist **L204 geschlossen**.

**Scrubbing wurde NICHT gebaut**, aus Redurs eigenem Vorbehalt: ein
Reiterwechsel kostet unter Last 0,8 bis 1,5 Sekunden Bildschirmaufbau.

**Geprüft.** `test541` neu (23 Zusagen, Gegenprobe gegen den alten Stand rot
gesehen: „31 % von 215px im ersten Bild") · `test539` auf die neue Linse
nachgezogen (50/50) · `test114` §17 · `test435`, `test105`, `test109`,
`test87`, `test270`, `test332`, `test126`, `test483`.

**Zwei Fehler, die erst die eigene Messung zeigte:** nach einer beendeten
Bahn blieb der Startabstand stehen, und der nächste Wechsel begann am
vorletzten Ort (im Film gesehen, jeder Wechsel startete bei x = 51) ·
`handyLeiste()` läuft je Tipp ZWEIMAL, der zweite Ruf startete die laufende
Feder neu und nahm ihr die Dehnung (1,000 statt 1,175).

---

## 20. September 2026 · E644 · Die zuletzt gelesene PDF-Seite überlebt eine Fenstergrösse

**Der Fund.** `test424` war rot — allein, im Stapel, auf dem Zweig und auf
`main`. Ein Haken auf `Store.setMeta` zeigte genau einen Schreibvorgang und
seinen Weg: `seiteMerken ⟵ nachziehen ⟵ beiGroesse`. Beim frisch geöffneten
Dokument steht der Rollstand noch auf 0, während die gemerkte Seite erst im
`requestAnimationFrame` angerollt wird; eine Fenstermeldung in diesem Spalt
beantwortet die Frage mit „Seite 1" — und merkt sie. Auf dem Telefon reicht
dafür das Drehen. Seit E349 eine gebrochene Zusage.

**Gebaut.** Eine Reihenfolge statt einer Wartezeit: `standGesetzt` fällt
erst in dem `rAF`, der die gemerkte Seite anrollt. Davor schweigt der
Beobachter.

**Geprüft.** `test540` neu — und er stellt das Rennen, statt es zu gewinnen:
derselbe Haken, der den Fehler sichtbar machte, machte ihn beim zweiten
Versuch unsichtbar (50/50 statt 49/50). `test424` (50/50), `test395`,
`test202`, `test386`.

---

## 20. September 2026 · E642/E643 · Sechsundsiebzig tote CSS-Regeln, und ein blinder Port-Wächter

**Der Fund.** Der erste volle Lauf seit PR #100 meldete 76 tote
CSS-Erklärungen. **Dreizehn davon gab es gar nicht:** `selectorText.split(',')`
zerriss die Kommas in `:is()`, `:where()`, `:not()` und `:has()` und erfand
Wähler wie `#menueband)`, die nie ein Element treffen — der Lauf verglich
sie mit den echten Regeln und meldete **die echten** als tot.

**Gebaut.** Klammertiefe statt blindem Trennen. Die übrigen 63 waren echt,
in zwei Sorten: überflüssige Zeilen (`#ai`, `.schalter i`, `#handy-oben`,
`#reiterleiste`, `.document-*`, sieben Rasterzeilen in `premium.css`,
`#kanten-lade`) und **eine Absicht, die nie wirkte** — `motion.css` hatte
die Übergangsliste von `.els-kachel` ersetzt und dabei `background`
verloren; zehn Tage lang wechselte die Kachel ihre Fläche hart statt weich.
Die letzten 35 sind die Bibliothek, seit PR #56 zweimal gestaltet (§8).

**Und dabei kam heraus, dass `test400` blind war:** er las `PORT = N` und
kannte `listen(9624, …)` nicht. Acht Läufe schreiben so, **sieben Ports
waren doppelt vergeben**, während der Wächter grün meldete — genau die Sorte
Fehlalarm, die den Sweep vom 19. September verfälscht hat.

**Geprüft.** `test332` (76 → 0), `test400` (4/4 mit zwei Gegenproben), die
vierzehn betroffenen Läufe einzeln, `test105`, `test109`, `test87` und 26
Nachbarläufe. Bild-Gegenprobe der Bibliothek: kein Pixel Unterschied.

---

## 20. September 2026 · E645 · Ein Wächter zählte das ganze Haus

**Der Fund.** `test435` §3 zählte ALLE SVG-Filter der Seite und verlangte
zwei. Das war zufällig wahr — bis die Linse der unteren Leiste (E639) zwei
eigene mitbrachte. Der Lauf bestrafte also eine neue Funktion dafür, dass
sie dasselbe Element benutzt.

**Gebaut.** Gezählt wird im Halter der Textur. Daneben steht jetzt die
Frage, um die es E440 wirklich ging: teilen sich zwei Filter eine Kennung?
Diese Zahl wächst nicht mit dem Programm mit.

**Geprüft.** `test435` (45/45), beide Gegenproben rot gesehen.

---

## 19. September 2026 · E628 · Die Gedankenkarte bekommt Griffe, Verbindungen, Formen und Vorlagen

**Redurs Bestellung, vier Punkte:** Taster oben/links/rechts/unten, die eine
Verbindung erzeugen · Verbindungen löschen können · verschiedene Formen ·
fertige Vorlagen.

**Gebaut.** Vier Griffe am gewählten Thema, und jeder kann zweierlei: tippen
legt ein Thema in dieser Richtung an (links/rechts ein Unterthema,
oben/unten ein Geschwister), ziehen zieht eine freie Verbindung auf den
Knoten, auf dem man loslässt — dieselbe Sechs-Pixel-Schwelle wie beim
Platz-Griff der Zeichenleiste (E620). Verbindungen sind gestrichelt und
tragen eine Spitze; anklicken wählt, Entf löscht, ↶ holt zurück. Sechs
Formen, sechs Vorlagen.

**Was das Hinsehen und der neue Lauf gefunden haben — vier Fehler, keiner
im Code zu sehen (§55):** die Griffe erschienen gar nicht, weil `waehle` die
Karte nicht neu zeichnet · die Verbindung zwischen zwei gleich hohen Ästen
lief als 181 × 0 px grosse Gerade mitten durch die Wurzel, und ein Klick
darauf traf die Wurzel · die Entf-Taste lief ins Leere, weil der Browser
nach dem Klick auf den SVG-Pfad den Fokus zurücknahm · und die sechs
Formknöpfe standen senkrecht untereinander, weil `.gk-formen` keine Regel
hatte.

**Zwei Entscheidungen gegen Datenverlust (§9/§18):** `rund` schreibt nichts
in die Daten — es ist die Form ohne Feld. Und eine Form, die diese Fassung
nicht kennt, BLEIBT stehen; hier stand zuerst eine Prüfung gegen die Liste
der bekannten Formen, die eine Karte aus einer neueren Fassung beim ersten
Öffnen stillschweigend beschnitten hätte.

**Geprüft.** `test538` 53/53 (neu), `test529` 56/56 unverändert, `test402`
4/4, dazu `test87`, `test105`, `test109`, `test290` — alle sieben grün.
**Vier Gegenproben einzeln rot gesehen**, und eine davon entlarvte eine
Zusicherung, die nicht rot werden konnte (die Griffe nach statt vor dem
ersten Klick zu zählen). **Nicht** geprüft: die Gesamtsuite.

**Bilder:** `gkformen` und `gkvorlagen`, Rechner und Telefon — sie haben den
Klecks statt der Pille gefunden und die senkrechte Formspalte.

---

## 19. September 2026 · E627 · Ein Grund gilt nur, wo der Lauf ihn sucht

**Rot zuerst (§46).** `test402` war rot, bevor dieser Bogen anfing — zwei
Trefflächen unter 44 px ohne geschriebenen Grund. Einer war keiner: die
Knöpfe der Gedankenkarte haben ihre 44 px über `::after`, und der Grund
stand ausführlich da — nur HINTER der Regel statt darüber, ausserhalb der
acht Zeilen, die der Lauf liest. Der zweite war echt: `#ai .ki-quellschalter`
ist 32 px hoch, und niemand hatte je aufgeschrieben, warum das ein Nebenweg
ist.

**Geprüft.** `test402` 4/4.


## 17. September 2026 · E618 · Die Tafel wird ein Kasten (W4, dritter Teil)

**Redurs Bilder 2 bis 6 zeigen alle dasselbe:** unter der Werkzeugreihe ein
Feld mit dem Zubehör des gewählten Werkzeugs. Dafür hat E614 die Ebene
eingezogen.

**Zuerst ein Rückbau an E614, einen Tag später und mit Grund.** E614 legte
ALLE Kinder in die Tafel — richtig für W2, wo sie nur eine Ebene ohne Kasten
war. Für W4 ist es falsch: ein Kasten um die Werkzeugreihe herum wäre keine
Tafel, sondern die ganze Leiste. Also ziehen Werkzeuge und Zeilenbruch
zurück in die Leiste, das Zubehör bleibt in der Tafel.

**Und genau so kostet der Rückbau fast nichts:** die 51 Kindwähler der
Gruppen bleiben unberührt, weil das Zubehör in der Tafel geblieben ist. Nur
acht Regeln ziehen mit — ein Achtel der Arbeit von E614.

**Der Kasten steht ab 1300 px Leistenbreite**, derselben Schwelle wie die
Stiftnamen aus E617. Darunter bleibt `display:contents`, und das ist **keine
Sparmassnahme, sondern die Bedingung**: am Telefon kommt die Reihenfolge aus
`order` über Werkzeuge UND Zubehör hinweg (E356), und ein Kasten dazwischen
bräche das.

**Der sichtbare Gewinn:** die Millimeter aus E616 stehen jetzt auf der
Kachel — 0,4 mm · 0,8 mm · 1,8 mm, und beim Marker das Vierfache. In der
Zeile war dafür kein Platz; im Kasten ist er.

**Zweimal hat das Bild die Arbeit korrigiert (§55).** Auf dem ersten stand
„0,4 mm0,8 mm 1,8 mm" — die Zahlen liefen ineinander, weil `.blatt-strich`
auf festen 30 px steht. Eine überlappte Zahl ist eine falsche Zahl;
`test533 §5d` misst seither ausdrücklich, dass keine über ihre Kachel
hinausläuft. Auf dem zweiten war der Kasten kaum zu sehen: `--bg-tief` gegen
`--bg-card` sind drei Hundertstel Helligkeit.

**Geprüft.** `test533` 54/54, vierzehn Zusicherungen neu. Vier Läufe
umgehängt (`test522`, `test523`, `test524`, `test533`) — keiner
weichgemacht. **Gegenprobe rot gesehen:** den Kasten zurück auf
`display:contents` → 50/54. **Nicht** geprüft: die Gesamtsuite.

**Offen bleibt von W4:** Strichvorschau, Name UND Millimeter auf einer
Kachel, der Deckkraft-Schieber (zusätzlich eine Datenfrage, §9) und der
Radierer mit Grösse und Haken.

---
## 17. September 2026 · E617 · Die Stiftkacheln tragen ihren Namen (W4, zweiter Teil)

**Redurs Bild 2: „fünf benannte Stiftkacheln".** Im Stilblatt stand, warum
das nicht geht — „sechs Stifte mit Namen sind rund 320 px und kippen die
Leiste in eine dritte Zeile". Richtig gerechnet, für ein Wort **neben** dem
Zeichen. Gestapelt kostet es Höhe, und die hat der Knopf ohnehin (§37).

**Drei Schwellen, nicht eine.** Die Werkzeuge zeigen ihr Wort ab 820 px
Leistenbreite (W3), das übrige Zubehör ab 1150 (E359), die Stifte erst ab
**1300** — ihre Namen sind lang („Kugelschreiber" macht die Kachel 77 px
statt 32), und bei 1150 gehen alle anderen Wörter gleichzeitig auf. Gemessen
kippte die Leiste bei 1180 px auf vier Zubehörzeilen und 127 px Höhe; ab
1280 blieb sie bei 91. Die Schwelle steht auf 1300, nicht auf dem Messwert.
**Nach der Umstellung ist die Leiste bei jeder geprüften Breite so hoch wie
vorher.**

**Ein halber Bogen, der nicht im Auftrag stand (§38):** der alte Weg war
`display:none` — das nimmt den Namen auch aus dem Vorlesebaum, und der
Kommentar daneben behauptete „der Name steht im Titel". Jetzt wird
geklemmt statt entfernt.

**Zwei Fehler, die mir dabei selbst unterlaufen sind.** Die erste Messung
sagte „Kachel 36 px", also „der Name wird abgeschnitten" — auf dem Bild
stand er vollständig da, nachgemessen sind es 77 px. Hätte ich der Zahl
geglaubt, wäre der Bogen als „geht nicht" abgebrochen worden; **das Bild hat
die Messung widerlegt, nicht umgekehrt.** Und `bilder.mts` konnte diesen
Zustand gar nicht zeigen: das breiteste Gerät war 1280 px, die Leiste dort
860 px — die obere Schwelle war auf keinem Bild je zu sehen. Neu: `breit`,
1920 × 1080.

**Dabei noch ein Fund:** an zwei Stellen stand `g !== 'rechner'` — einmal
für „nur ein Thema", einmal für „mit Berührung nachstellen". Mit `breit`
wäre ein 1920er Bildschirm als Tastgerät nachgestellt worden, mit
`hover: none`: der Fund aus L108 von der anderen Seite. Jetzt entscheidet
eine Menge, kein Vergleich. `laptop` bleibt absichtlich, wie es war —
**L184** fragt nach.

**Geprüft.** `test533` 40/40, elf Zusicherungen neu. **Zwei Gegenproben
einzeln rot gesehen:** Schwelle entfernt 38/40 (Leiste 127 statt 91 px),
`display:none` zurück 36/40. Sieben Nachbarläufe grün. **Nicht** geprüft:
die Gesamtsuite.

**Offen bleibt von W4:** Strichvorschau, die Millimeter sichtbar an der
Kachel, der Deckkraft-Schieber und der Radierer mit Grösse und Haken. Alle
vier brauchen die Tafel als sichtbaren Kasten.

---
## 17. September 2026 · E616 · Die Strichstärke sagt, wie dick sie ist (W4, erster Teil)

**W4 fängt nicht mit Gestaltung an, sondern mit einer Zahl, die falsch
dastand.** Auf dem Bildschirm stand „1,2" — eine Zahl ohne Einheit. Der
Kommentar daneben nannte sie „px". Beides war irreführend.

**Gemessen statt abgeschrieben.** Redurs iPad-Bilder nennen „Fein 0,3 mm ·
Mittel 0,7 mm · Markant 1,2 mm", und die naheliegende Arbeit wäre gewesen,
diese Zahlen zu übernehmen. Nachgesehen am laufenden Programm: das `viewBox`
der Zeichenfläche ist `0 0 595.28 841.89` — **A4 in PDF-Punkten**. Die
Breiten sind also Punkte, und ein Punkt ist 1/72 Zoll:

```txt
              Redion     GoodNotes      Abweichung
Fein          0,4 mm     0,3 mm         +33 %
Mittel        0,8 mm     0,7 mm         +14 %
Markant       1,8 mm     1,2 mm         +50 %
```

Hätte der Bogen die Tabelle abgeschrieben, stünde bei „Markant" 1,2 mm an
einem Strich, der 1,8 mm zieht — um die Hälfte daneben und plausibel genug,
dass es niemandem auffällt. **Die Wörter sind Redurs, die Zahlen sind
Redions.**

**Die zweite Falle an derselben Stelle:** Stift und Marker teilen sich die
drei Stufenknöpfe, aber der Marker zieht das Vierfache. Eine feste
Beschriftung hätte am Marker „0,8 mm" an einen 3,4-mm-Strich geschrieben.
Sie hängt deshalb am Werkzeug — an EINER Stelle, dem Beobachter auf
`data-tool`, der seit E356 ohnehin dort horcht.

**Geprüft.** `test438` 59/59, fünf Zusicherungen neu und zwei umgehängt.
Die neue Zusage **rechnet ihren Sollwert aus dem `viewBox`**, statt ihn
abzuschreiben. **Zwei Gegenproben einzeln rot gesehen:** „Punkte sind
Millimeter" 55/59, Marker-Faktor weg 58/59. **Nicht** geprüft: die
Gesamtsuite.

**Und §52.6 zum zweiten Mal:** die erste Gegenprobe baute gar nicht, weil
`MM_JE_PT` nur in `alsMm` benutzt war und `noUnusedLocals` abbricht. Eine
Gegenprobe, die nicht baut, ist keine — die Konstante musste mit weg.

**Offen bleibt der grössere Teil von W4**, und er hängt an einer Bedingung:
Strichvorschau, Stiftkacheln, Deckkraft und Radierer brauchen die Tafel als
sichtbaren Kasten. Die trägt seit E614 absichtlich `display:contents`. Das
ist ein eigener Bogen mit einem eigenen Bild.

---
## 17. September 2026 · E615 · Der Stift öffnet den Blick in den Ordner (L180)

**Redurs Fund vom 16. September:** das Auge am Ordnerdeckel öffnet die Karte
beim Hinschauen — aber nur mit der Maus. Mit einem Laptop-Stift passiert
nichts.

**Zwei Gründe, beide unabhängig voneinander.** Die Art ist `pen` und nicht
`mouse` — der Kommentar sagte „NUR DIE MAUS" und meinte den Finger, der
Stift war Kollateralschaden. Und `zeigerHatHover()` fragte
`(hover: hover) and (pointer: fine)`, was den **Hauptzeiger** beschreibt:
auf einem Laptop mit Berührungsbildschirm ist das der Finger, und die
Abfrage sagt dort „kein Überfahren" — sie hätte also auch die **Maus**
ausgesperrt. Das war der unterschätzte der beiden.

**Und ein dritter Punkt an derselben Stelle:** beim Antippen kommt erst
`pointerenter`, dann `pointerdown`, und dazwischen sagte nichts ab. Die Uhr
lief weiter, die Karte ging nach dem Tippen von selbst auf.

**Warum es nochmal anstand:** alles drei war in E608 gebaut und geprüft.
E609 hat E608 vollständig zurückgenommen, weil Redur die Ordnerkachel wieder
wie vorher wollte — der Fund fiel in die Lücke zurück, nicht widerlegt, nur
verschüttet. Jetzt einzeln eingesetzt, ohne am Auge etwas zu ändern.

**Geprüft.** `test476` 31/31, fünf Zusicherungen neu. **Zwei Gegenproben
einzeln rot gesehen:** gegen den alten Stand 27/31, mit entfernter
`pointerdown`-Absage 29/31 — jede Hälfte für sich gehütet. Der Finger bleibt
draussen (`test476 §6`, unverändert). **Nicht** geprüft: die Gesamtsuite.

**Vierter Fund dieser Sorte in einer Woche:** die neue Quellenzusicherung
war rot, obwohl der Code stimmte — sie traf den Kommentar, der erklärt,
warum die alte Abfrage weg ist. Nach E610, E612 und E613 jetzt E615. Die
Lehre steht in §55.2 und heisst: eine Zusage, die beim ersten Lauf grün ist,
ist ein Verdacht und keine Beruhigung.

---
## 16. September 2026 · E614 · Die Tafel als Behälter, und das Wort unter dem Zeichen (W2 + W3)

**Redur, 14. September, mit fünf Bildern:** „Siehe Bildern, so will ich es
haben." Und: „Die untere Dock sollte bleiben."

**W2 baut keine Gestaltung** — er schiebt eine Ebene ein, damit W4 dort
später eine Tafel aufgehen lassen kann. Die Zusage ist deshalb eine
Negation: *danach sieht die Leiste genauso aus wie vorher.* Gemessen auf
beiden Ständen, 1280 px, Stift gewählt: 860 px breit, **127 → 128 px hoch**,
dieselben drei Zeilen, dieselben 26 Zubehörteile. Der eine Pixel gehört W3.

**Gezählt statt geschätzt.** Der Auftrag sprach von „rund fünfzig Regeln".
Es sind **51 Regelblöcke über 104 Selektorzeilen** — und 67 weitere Regeln
(57 %) sind gar nicht betroffen, weil sie Nachfahren sind. Dazu sieben
`:scope >` im TypeScript.

**Zwei Dinge, die der Auftrag nicht vorhergesehen hat.** Die Tafel nimmt
**alle** Kinder auf und nicht nur die `[data-gruppe]`-Knoten: drei
Mechanismen wirken ausschliesslich zwischen unmittelbaren Geschwistern (der
Trenner hinter dem Zeilenbruch aus E568, Redurs Dock-Welle, und
`insertBefore` in `ordnungAnwenden`). Und sie trägt `display:contents` — ein
echter Kasten hätte `flex:1 0 100%`, `order` und `position:sticky`
gebrochen, weil alle drei Flex-**Kind**-Eigenschaften sind. Den eigenen
Kasten bekommt sie mit W4.

**Der leiseste mögliche Ausfall** war `ordnungAnwenden`: sein
`if (!bruch) return` steigt stumm aus, und die ganze Nutzerordnung aus
E570/E571 wäre wirkungslos geworden, ohne dass etwas meldet. `test533 §4`
hält genau das.

**W3.** Das Wort kostet jetzt Höhe statt Breite — und Höhe hat der Knopf
ohnehin (§37). Die Schwelle wandert von 1150 auf 820 px Leistenbreite,
gemessen: dreizehn gestapelte Werkzeuge brauchen rund 790 px statt 1142
daneben. Bei 1360 px Fenster stehen sie jetzt **mit** Wort in EINER Zeile,
vorher **ohne** Wort in zwei.

**Geprüft.** `test533` neu, 29 Zusicherungen, **zwei Gegenproben einzeln rot
gesehen** (einen Kindwähler zurücklassen → 12 Gruppen statt 6 und 163 px;
die Stapelung abklemmen → `flex-direction:row`). `test351` §3 umgehängt
statt weichgemacht — und schärfer als vorher. `test522`, `test523`,
`test524` auf die Fläche umgehängt, keiner weichgemacht (118/118).
**Nicht** geprüft: die Gesamtsuite.

**Was das Hinsehen fand (§55.3):** «Einrichten» steht allein in einer
dritten Leistenzeile. Nachgemessen auf `origin/main` — **dort genauso**.
Kein Fund dieses Bogens, aber jetzt gesehen; eingetragen als **L182** mit
drei Wegen, keiner davon gewählt.

---

## 16. September 2026 · E613 · Die Chronik kommt erst, wenn jemand sie öffnet

**`test388 §5` war rot, seit zwölf Tagen.** Gesehen hat es niemand: die
Läufe auf GitHub brechen seit Wochen nach drei Sekunden ab (Konto-Ebene,
kein Codefehler), und im Container hatte den Lauf niemand gefahren.

**Zuerst gezählt, dann gehandelt** — die Reihenfolge, die L146 Punkt 1 bis 3
verlangt hat. 2081 KB am 4. September, **2637 KB** am 16.; von den 512 KB
Zuwachs kamen 229 aus 26 neuen Dateien und 291 aus 206 gewachsenen. Die zwei
grössten Wachser sind `pdf/marken.js` (+68) und `pdf/document-mode.js`
(+64) — das Zeichen- und das Schreibstudio, E568 bis E612. Das ist Produkt,
kein Ballast.

**Der eine echte Ballast** war `chronik/daten.js`: 182 KB Chronikprosa bei
jedem Start, für einen Bildschirm hinter einem Zugangscode. Seit jetzt holt
`chronik/laden.js` sie nach — dasselbe Muster wie pdf.js in E389, mit
denselben drei Vorkehrungen (`<script>` statt `fetch` wegen `file://`, die
Bytes an einer Marke in die Einzeldatei, `daten.js` bleibt im GRUNDSTOCK).
**2637 → 2585 KB.**

**Die Decke steht jetzt auf 2700 statt 2300**, mit geschriebener Begründung
im Lauf: nicht 2600 (dann reisst sie beim nächsten Bogen und wird zum
Rauschen), nicht 3000 (dann passte pdf.js wieder unbemerkt hinein).

**Ein Fund im Nachbarlauf, teurer als der Bogen.** `test481 §7` sagte
„index.html lädt beides, die Daten zuerst" und war **nach** der Änderung
immer noch grün — die Zusicherung traf den Namen in einem HTML-Kommentar
statt in einem `<script src>`. Dritte Zusage in einer Woche, die einen
Kommentar statt Code prüft (E610, E612, E613).

**Geprüft.** `test388` 19/19 (Gegenprobe rot gesehen: 18/19), `test481`
39/39 mit fünf neuen Zusicherungen, `test270` 77 ok, `test105`/`test109`/
`test87` grün. **Nicht** geprüft: die Gesamtsuite.

---
## 16. September 2026 · E612 · Das Schreibstudio wird ruhig

**Redur:** „hier sieht es sehr viel aus und haben nicht so viel Platz für
Bearbeiten … will nicht so viel Sachen sehen aber trotzdem alles machen
kann."

**Gemessen statt geschätzt:** 301 px Bedienung über der ersten Folie, und
nichts davon war wegzuklicken. Zweimal gemessen — erst aus den Stilblättern
gerechnet, dann am laufenden Programm. Nachher 160 px, Arbeitsfläche
646 → 720 px.

**Gebaut.** Das Folienband klappt zu (74 px), die Reiterzeile bleibt als
Griff stehen, und die Dateikarte steht nur noch im Details-Fenster (95 px).
Beides hängt an `data-ruhig`, das im Studio ohnehin schon am `body` stand —
kein zweiter Schalter (§8). Der Griff ist der Reiter selbst, wie bei der
Strichstärken-Klappe aus E465.

**Nicht erfunden, sondern nachgesehen:** der gefürchtete E552-Fallstrick
(„unter 900 px keine Zeichenwerkzeuge") war bereits gelöst — die
Zeichenleiste wird dort als eigene Leiste gehängt, dasselbe Element. Die
echte Gefahr lag beim Zuklappen ab 900 px, und dort hängt ihre Sichtbarkeit
jetzt allein am Reiter.

**Geprüft.** `test532` neu, 22 Zusicherungen, zwei Gegenproben rot gesehen —
jeder der beiden Eingriffe einzeln. `test385 §4` und `test506` umgehängt
statt weichgemacht. Acht weitere Läufe grün. **Nicht** geprüft: die
Gesamtsuite.

**Was das Hinsehen fand (§55.3):** die Reiterzeile allein sagte nicht, dass
sich darunter etwas aufklappen lässt — wörtlich der Fund von E383. Ein `⌄`
am rechten Ende, das sich dreht, behebt es.

**Was aufgeschoben wurde, mit Grund:** das Lineal steht beim Reiter
„Zeichnen" zweimal. Die Regel dagegen dreht E574 um — eine zweite
Entscheidung, keine Nebenwirkung. Eingetragen als L181 mit drei Wegen,
keiner davon gewählt.

---

## 16. September 2026 · E611 · Das Auge an jedem Ordner

**Redur:** „das ist nur bei Bibliothek — ich will überall, wenn ein Ordner
erstellt wird, das haben."

**Gezählt statt geschätzt:** es gibt genau zwei Zeichner von Ordnerkacheln.
`bibliothek.ts` hatte das Auge, `notebook.ts` nicht — und dort fehlte auch
„Blick hinein" im ⋯-Menü, es gab also gar keinen Weg, in ein Fach zu sehen,
ohne es zu öffnen.

**Gebaut.** Auszeichnung und Verdrahtung stehen jetzt an EINER Stelle
(`blickKnopf`, `mitBlick`, `blickAnbringen`, `blickHinein`) und werden nach
aussen gegeben; die Notizhefte holen sie und reichen ihr eigenes `openFach`
herein, damit „Ordner öffnen" im Regal bleibt. Nachgebaut wurde bewusst
nichts: zwei Kopien laufen auseinander.

**Geprüft.** `test531` neu, 19 Zusicherungen. `test436` (71), `test476`
(26), `test264` (25), `test290` (13) grün, `typecheck` sauber. **Nicht**
geprüft: die Gesamtsuite.

**Der Fund im eigenen Wächter, und er gehört hierher:** die erste Gegenprobe
ging grün durch. Die Zusicherung „danach steht man in den Notizheften" hing
an `.nh-regal` und am Hash — beides bleibt stehen, auch wenn der falsche Weg
genommen wird. Erst `Store.getMeta('heft:fach')` misst es wirklich. Eine
Prüfung, die beim ersten Mal rot war, WEIL das Element fehlte, hat damit noch
nichts über das Verhalten gesagt.

---

## 16. September 2026 · E610 · Der Ablagename folgt dem Inhalt

**Der Fund kam aus einer Frage, nicht aus einem Plan.** Redur sah das Auge
am Ordner immer noch nicht, obwohl E609 es vollständig zurückgeholt hatte.
Der Code war in Ordnung — gemessen: drei Augen, 44 × 44 px, fünf Blätter
±14° gefächert, Deckel `rotateX(-32°)`, `test436` und `test476` grün.
Festgehalten hat es der Browser: `git revert` nahm `sw.ts` und `stand.ts`
mit zurück, die Fassung fiel von v1145 auf v1141, und der Ablagename war
`const ABLAGE = VERSION;`.

**Gebaut.** `ABLAGE = VERSION + '-' + INHALT`. Der Stempel, den
`dienststand.mts` seit E361 ohnehin rechnet, steht jetzt im Namen — gleicher
Name heisst gleiche Bytes, per Konstruktion statt per Disziplin. `VERSION`
behält seine schlichte Form, weil `test143` daran hängt.

**Geprüft.** `test530` neu, 16 Zusicherungen, davon drei am echten Dienst im
Browser (`caches.keys()` nach echter Anmeldung). Gegenprobe gelaufen und rot
gesehen: zurückgedreht heissen zwei verschiedene Inhalte wieder
`notizen-v1143` gegen `notizen-v1143`. Dazu `test353 143 31 99` mit 105/105,
`test105 109 87` grün, `npm run typecheck` sauber, `npm run stand`
unverändert. **Nicht** geprüft: die Gesamtsuite.

**Was dabei auch herauskam, und es gehört hierher:** der erste Wächter war
aus dem falschen Grund rot. Sein Muster für den Bauplan fand den alten
`const ABLAGE = VERSION;` im **Kommentar** über der Zeile. Ein Anker auf den
Zeilenanfang hat es behoben — §55.2 von der anderen Seite.

---

## 12. September 2026 · E534 · Animationsreste auf ad4ccbc

Ticket-Vorder-/Rückseite und Statistikherz ergänzt. Zahlen und Statussätze
kommen weiterhin aus den echten Komponenten. Reduzierte Bewegung wechselt
die Ticketansicht statisch. Ringüberlappung auf schmalen Gesundheitskarten
und überstimmten Glasknopf-Schatten behoben. Statistik-Teile bleiben in
einer der 15 Vorlagenfamilien zusammengefasst. `test496`: Gegenproben rot,
anschließend 148 Zusagen grün. Kein vollständiger Gesamtlauf behauptet;
restliche Prüflücken bleiben unter L149. Arbeit nur lokal, kein Push.

---

Was fertig ist. Aus `AUFGABEN.md` hierher gezogen am 3. September 2026, damit dort
nur noch steht, was noch zu tun ist.

**Nichts ist dabei weggefallen.** Diese Datei enthält den vollständigen
bisherigen Inhalt der Arbeitsliste — die Chronik, die zwölf Phasen, den
Stand des grossen Auftrags, die Visionskarte und jeden einzelnen Bogen von
E272 bis E369. Wer wissen will, warum etwas so ist, wie es ist, findet die
Begründung in `ENTSCHEIDUNGEN.md`; wer wissen will, WANN es gebaut wurde
und was dabei herauskam, findet es hier.

```txt
ENTSCHEIDUNGEN.md   Warum wurde etwas so entschieden?
AUFGABEN.md         Was ist noch zu tun?
ERLEDIGTE-AUFGABEN.md   Was ist fertig, und was kam dabei heraus?
LUECKEN.md          Was fehlt noch im Produkt?
```

Die Reihenfolge ist die der alten Datei: erst die Chronik (neu nach alt),
dann die Phasen, dann die Bögen.

---

## Inhalt

| Abschnitt | Was drinsteht |
|---|---|
| [Die Chronik](#chronik) | Jeder Arbeitstag von der jüngsten Lieferung rückwärts |
| [Die zwölf Phasen](#phasen) | Der ursprüngliche Bauplan und was daraus wurde |
| [Der grosse Auftrag](#auftrag) | Der Stand der 60 Abschnitte |
| [Die Visionskarte](#vision) | Redurs Satz, neunfach nachgemessen |
| [Die Bögen E272–E369](#boegen) | Jeder einzelne Bogen mit Fund, Bau und Prüfung |

---

<a id="chronik"></a>

## Aktueller Stand

## E528 — KI-Eingabe und zugeordnete Animationen (10. September 2026)

Große, abgerundete Eingabe mit Bedienleiste unten; aufklappbare Quellen und
vier Werkzeuggruppen. Alle zwölf KI-Aktionen nutzen den vorhandenen
Funkel-Effekt, die beiden Bau-Knöpfe bleiben unverändert. Neue, gekapselte
Bewegungsmotive für Ordner, Fach- und Metrikkarten, KI-Status, Dialoge und
PDF-Druckstatus. Die vollständige Zuordnung mit Grenzen der Übertragung
steht in `doku/ANIMATIONEN-ZUORDNUNG.md`. Keine neue Anbieterintegration.

Neue Browserprüfung `test492`, angepasste Erwartung in `test436`, Bilder
in Hell/Dunkel sowie bei 360/390 px. Lokal auf `codex/redion-motion`;
kein Push und keine Veröffentlichung. Die vollständigen Demo-Szenen aus
der gelieferten CSS-Datei sind damit nicht alle eins zu eins nachgebaut.

## E419–E427 — Die dreizehn Ansichten, angesehen statt gelesen (5. September 2026)

Neun Bögen an einem Abend, und sie hängen alle an derselben Arbeitsweise:
**jede Ansichtsart wirklich öffnen und ansehen**, statt ihren Code zu lesen.
Alle dreizehn am Rechner, die wichtigsten am Telefon.

**Was dabei herauskam, in der Reihenfolge des Gewichts:**

| Fund | Gemessen |
|---|---|
| Die Balken des Dashboards waren unsichtbar (E421) | `--b-gray` und die Bahn sind byte-identisch. Kontrast **1.00**. „Offen 3" hatte einen Balken über die volle Breite, den niemand sehen konnte |
| Der Zeitstrahl nutzte 29 % seiner Fläche (E419) | 325 px gemalt in 1130 px. Und die Mindestbreite zog 1, 2 und 3 Tage auf **dieselben 22 px** |
| Die Karte nahm die Titelspalte (E423) | `place` — der Typ, der „Ort" bedeutet — stand nicht einmal zur Wahl |
| Fünf Kataloge für dreizehn Ansichten (E422) | `pivot` und `raster` fehlten in vier davon; `timeline` hiess an zwei Stellen verschieden |
| Feed und Liste klebten ihre Werte zusammen (E424, E425) | „15.09.2026 60 CHF" als ein Wert; „01.09.2026 12.09.2026" ohne Namen |
| Am Telefon sahen zwei Einträge gleich aus (E426) | „Bericht Kapitel 1" und „Bericht Kapitel 2" standen beide als „Bericht" da |
| Der Zeitstrahl zeigte am Telefon jeden Namen zweimal (E427) | Namensspalte 190 von 334 px = 57 %; alle neun Titel standen daneben |

**Dreimal derselbe Fehler an drei Orten.** `kartenWerte` aus E411 gibt es
einmal und kann alles, was Karte, Feed und Liste brauchen. Jeder der drei
hatte trotzdem seine eigene Schleife, die Zellen mit einem Leerzeichen
aneinanderhängte.

**Und zweimal derselbe Fehler in der Vorgabe.** E414 fand, dass die
Diagramm-Gruppierung `gruppierbar[0]` nahm und damit den Titel. E423 fand
dieselbe Zeile bei der Karte. „Die erste Spalte" ist nie die richtige
Antwort auf „welche Spalte?".

### Was dieser Durchgang über das Prüfen gesagt hat

**Fünf Prüfungen konnten nicht rot werden, und alle fünf sind repariert:**

- `test351 §3` zählte Wörter mit `getClientRects()`. Ein Audit hatte
  `display:none` durch die Zugänglichkeits-Klemme ersetzt; ein geklemmtes
  Wort HAT ein Rechteck, eines von 1×1 px. Der Abschnitt meldete drei
  Runden lang dieselbe Zahl (E416).
- `test413 §1` mass `.zs-flaeche` — mit `min-width:100%` immer voll, ganz
  gleich wie schmal darin gezeichnet wird.
- `test411 §3` mass die Zellbreite statt der Randbreite; `td` hat
  `min-width:90px` und bleibt 90 px, ob der Rand da ist oder nicht.
- `test417 §2` mass den Abstand zwischen den Einträgen statt zwischen Name
  und Wert — den ersten hält der Behälter mit seinem eigenen `gap`.
- `test290` meldete drei echte Namensraum-Funde, alle aus der Arbeit
  desselben Tages (E422 Nachtrag).

**Und zwei Wächter, die ihre eigene Grenze lernen mussten.** §39 verbietet
Stil im Quelltext — aber ein Fortschrittsbalken schreibt `style="width:55%"`,
und das ist ein GERECHNETER Wert. §8 verbietet zweite Kataloge — aber
`ANSICHT_ZEICHEN` bildet auf Strichzeichen-Kennungen ab, nicht auf Namen.
Ein Wächter, der bei jedem zweiten Fund danebenliegt, wird nach dem ersten
Lauf abgeschaltet.

### Und was Bilder gefunden haben, das keine Zahl finden konnte

- Das Zeichen `⃠` vor der KI-Absage war eine KOMBINIERENDE Marke. Im
  Quelltext sieht es aus wie ein eigenes Zeichen; es legt sich über den
  folgenden Buchstaben und klebte am „D" von „Dazu" (E418).
- „Ende30.09.2026" — die Beschriftung klebte am Wert, weil die Regel dafür
  auf `.card .meta` stand und der Feed kein `.card` hat (E424).
- Der Feed zeigte nach der ersten Reparatur ALLE dreizehn Spalten in einer
  Zeile. Eine Karte im Board darf das; ein Strom zum Überfliegen nicht
  (E424).

---

---

## E415–E417 — Was der volle Lauf gefunden hat (5. September 2026)

Der volle Lauf über 36 Stücke lief gegen den Stand von E408–E414. Drei
Stücke wurden rot, und **jeder der drei Funde war echt** — zwei davon aus
meiner eigenen Arbeit des Tages.

### E415 — Zwei fehlende Semikolon, vier tote Deklarationen

`test179` und `test201` rot: `cursor:pointer position:relative;` — ein
Semikolon fehlte, und CSS verwirft dann BEIDE Deklarationen still. Ohne
`position:relative` verankerte sich die unsichtbare 44-px-Trefferfläche am
nächsten positionierten Vorfahren und legte sich über die Nachbarknöpfe.

Die Suche von Hand fand eine Stelle. Der neue Wächter `test410` fand beide —
der Unterschied war `line-height`, das in meinem Grep-Muster fehlte.

**Nachtrag:** `test362` zählt rohe `44px` mit GENAUER Gleichheit gegen
`marken-decke.json`. E407 hatte elf davon eingeführt, 152 → 163. Nicht die
Decke angehoben, sondern die elf durch `var(--touch-min)` ersetzt.

**Prüfung.** `test410`, 7 Punkte, ohne Browser. Gegenprobe: Semikolon wieder
entfernt → `test410 §1`, `test179` und `test201` rot.

### E416 — Ein Wächter, der die alte Mechanik misst, misst nichts

`test351 §3` war dauerhaft rot — auch auf `main`, seit Audit F04. Nicht weil
die App etwas falsch macht: der Wächter zählte sichtbare Wörter mit
`getClientRects().length > 0`, und F04 hatte `display:none` durch die
Zugänglichkeits-Klemme ersetzt. Ein geklemmtes Wort HAT ein Rechteck — eins
von 1×1 px.

Nachgemessen: Leiste 596 px → Wort 1 px · 1074 px → 1 px · 1241 px → 22–74 px.
`getClientRects()` meldete dreimal elf. Der Abschnitt konnte weder richtig
rot noch richtig grün werden; auch sein dritter, grüner Punkt war aus
demselben falschen Grund grün.

### E417 — Sechs Schalter ohne Draht

Statisch gemessen, während der Lauf lief: 21 Schalter werden angeboten,
sechs las niemand. Zwei davon — „Titel der Datenquelle" und „Seiten-Icon" —
konnten gar nichts ausschalten, weil es die Anzeige nie gab.

Alle sechs sind verdrahtet, zwei erst gebaut. Die Grenzen sind bewusst eng:
`erinnernInApp` hält den Streifen auf, nicht die Nachricht; `autoVersionen`
nur das Automatische, nicht das Speichern von Hand.

**Und der Wächter ist ein Verzeichnis und kein Muster.** Dieselbe Messung
meldete zwölf, sechs davon zu Unrecht: fünf `q:*` werden über einen
berechneten Namen gelesen, `sicherungErinnern` über eine Form, die meine
erste Messung nicht kannte. Zum dritten Mal an diesem Tag derselbe Befund —
ein Muster, das den NAMEN sucht, findet berechnete Formen nicht.

**Prüfung.** `test411`, 26 Punkte, PORT 9533. Gegen den unreparierten Stand
in jedem Abschnitt rot (14 von 24). Zwei Einzelgegenproben dazu.

**Und eine Prüfung, die es nicht konnte:** `§3` mass zuerst die ZELLBREITE
und blieb grün, während der Rand schon weg war — `td` hat `min-width:90px`.
Gefunden nur, weil die Gegenprobe gelaufen ist.


---

## E408–E414 — Der Schimmer und die dreizehn Ansichten (5. September 2026)

Acht Bögen an einem Tag, und sie hängen zusammen: E408 kam aus einem Bauteil,
das Redur geschickt hat; E409 bis E414 aus dem Entschluss, sich die dreizehn
Ansichtsarten wirklich ANZUSEHEN statt ihren Code zu lesen.

**Der Fund, der alles ausgelöst hat.** Ein Bildziel je Ansichtsart, alle mit
derselben Datenbank: neun Zeilen, dreizehn Spalten, echte Anhänge. Auf dem
ersten Bild standen von dreizehn Spalten fünf.

### E408 — Ein Schimmer, der sagt „hier kommt noch Text nach"

Redur schickte eine React-Komponente (AnimatedShinyText, Magic UI, MIT).
Übernommen wurde die Wirkung, nicht der Code: sechs Zeilen CSS statt React,
Radix, Tailwind und lucide-react. Er läuft nur, während die KI-Antwort noch
streamt.

Die Gefahr war eine Datengefahr: `background-clip:text` braucht durchsichtige
Schrift, und wo der Verlauf nicht gemalt wird, steht unsichtbarer Text. Im
Fehlerzweig wäre es die Fehlermeldung selbst gewesen.

**Prüfung.** `test403`, 22 Punkte, PORT 9526. Fünf Mutationen rot gesehen.

### E409 — Die Ansichten bekommen die Breite, die da ist

Gemessen: bei 1280 px Fenster stand die Datenbank in 708 px, ihre Tabelle
brauchte 1637. 57 % lagen hinter einem waagerechten Roller, den niemand
sieht. Bei 1920 px änderte sich NICHTS — links und rechts je 483 px leer.

Drei Dinge standen im Weg, zwei davon fielen erst auf einem Bild auf: der
Beobachter hing nur an `#scroll` (das sich nie ändert), `max-width:100%`
kappte die neue Breite stillschweigend, und `.blk` ist `display:flex`.

Und der Fortschrittsbalken log: `width:n%` bezog sich auf die ganze Zelle,
bei 100 % schob der Balken die Prozentzahl hinaus. 55 %, 80 % und 100 %
sahen gleich aus.

**Prüfung.** `test404`, 25 Punkte, PORT 9527. Der Karteikarten-Streifen ist
seither aus — er stand über jedem Bildschirm und über jedem Bild.

### E410 — Der Kalender zeigt Zeitspannen

Die Balken waren die ganze Zeit gebaut und sprangen nie an: `endeKey` war das
einzige Feld der Kalenderansicht ohne Vorgabewert. Zwei Fehler kamen dabei
heraus, die seit jeher dastanden — die Balken hatten GAR KEINE Farbe, und
sie lagen auf den Tageszahlen.

**Prüfung.** `test405`, 17 Punkte, PORT 9528.

### E411 — Werte auf Karten sagen, wovon sie handeln

„08.09.2026 10.09.2026 85 ▬ 0 % ★★★☆☆ Lina 📍Bern ☐" in einer Zeile.
Angeschrieben wird jetzt, was seinen Namen braucht; Etiketten und Sterne
nicht. Dabei kam der Fehler heraus, den E409 hinterlassen hatte: eine
Fehlerkarte quer über der Galerie.

**Prüfung.** `test406`, 20 Punkte, PORT 9529.

### E412 — Eine Zahl sagt, wovon sie handelt

„420" heisst jetzt „420 CHF". Und der Typ log: `Column.formel` heisst in
Wahrheit `formula`, und dreizehn Felder fehlten ihm ganz. `test294` schwieg
dazu, weil er nur prüft, ob ein Name IRGENDWO vorkommt — und „formel" kommt
im Formeldreieck der Elektrolehre vor.

**Prüfung.** `test407`, 14 Punkte, PORT 9530; `test294` von 10 auf 13.

### E413 — Der Zeitstrahl zeigt Spannen und liest sich

Dieselbe Zeile wie im Kalender, an der Nachbarstelle nicht angesehen — §45,
der zweitteuerste wiederkehrende Fehler. Neun Quadrate mit je einem
Buchstaben: „E", „\", „S". Das „\" war ein abgeschnittenes „V".

**Prüfung.** `test408`, 13 Punkte, PORT 9531.

### E414 — Das Diagramm zeigt etwas

Neun schwarze Balken der Höhe 1, gruppiert nach dem Titel, Achse „3 2 2 1 0".
Die Farbpalette war einmal eine Liste von Farben und wurde auf Paare
umgestellt; eine Stelle wurde mitgezogen, sechs nicht.

**Prüfung.** `test409`, 16 Punkte, PORT 9532.

### Was dieser Tag über das Arbeiten gesagt hat

**Dreimal habe ich mich selbst berichtigt, und das gehört hierher:**

- Ein Kommentar behauptete ein Sicherheitsloch in der Zahlenspalte. Gemessen
  kam `NaN` heraus — der Riegel sitzt in `wert()`, nicht im `esc`. Eine
  falsche Behauptung über die eigene Sicherheit ist schlimmer als keine.
- `test403 §1` blieb unter seiner EIGENEN Gegenprobe grün, weil der Auszug
  das Wort „@supports" im erklärenden Kommentar fand.
- `test406 §3` prüfte nichts: „Anfang" und „Ende" sind beide `date`, und
  `date` ist ohnehin nicht selbsterklärend. Der Abschnitt hat jetzt einen
  eigenen Satz mit zwei Auswahlspalten.

**Und die Arbeitsweise hat mitten im Durchgang gewechselt.** Statt die
restlichen Ansichten einzeln zu fotografieren, wurden alle dreizehn auf
dieselben vier Fehlerarten gemessen. Ein Treffer, und der war ein Fehlalarm.
`test404 §8` misst seither für alle dreizehn: kein Fehler beim Öffnen,
mindestens 85 % der Breite, keine abgeschnittene Zahl.

---

**4. September 2026 · „Gehen" verlässt das Band — F02 ist zu (E391)**

> E388 hat die Orte nach links geholt; der Reiter „Gehen" stand danach
> weiterhin im Band und zeigte dasselbe. Zwei Wege zum selben Ziel sind
> genau der Befund des Prüfberichts. Jetzt trägt das Band nur noch
> Dokumentwerkzeuge: Start · Einfügen · Zeichnen · Verlauf · Überprüfen ·
> Ansicht · Hilfe (sieben statt acht; über einer Startansicht vier statt
> fünf).
> DIE GEFAHR WAR NICHT DER REITER, sondern sechs Einträge, die unter ihm
> wohnen — Journal, Schnellnotizen, Vorlagen, Zeitmesser, Agenten,
> Besprechungen. Vor dem Ändern nachgemessen: alle sechs stehen in der Lade
> hinter „Mehr Orte". `test387 §7` hält das jetzt in beide Richtungen.
> Fünf Prüfläufe tragen andere Zahlen, keine davon weicher — jede mit
> geschriebenem Grund.
> ZWEI HOHLE PRÜFPUNKTE FIELEN AUF: `test247 §7` klickte auf einen Reiter
> „Elektro", den es seit E272 nicht gibt, und mass danach, welcher Reiter
> zufällig gewählt war — grün, weil das zufällig der erste war. Und mein
> eigener Helfer klickte den Kantenknopf, um die Lade zu öffnen; ein
> zweiter Klick klappt sie zu, also war „Journal" grün und „Agenten" rot,
> im Wechsel. Beides behoben.

**4. September 2026 · Eine Führung, die auf nichts zeigt (E390, L125 zu)**

> `test61` war rot — und in einem Arbeitsbaum auf dem Stand davor ebenso,
> es kam also nicht von der Leistungsarbeit. Beim Nachmessen war es viel
> mehr als der eine rote Punkt: im Grundzustand zeigten **fünf von neun**
> Schritten am Rechner auf nichts und **acht von neun** am Telefon. Drei
> Ziele waren Reiter des Bandes (seit E383 nur sichtbar, wenn man
> aufklappt), drei waren Kantenknöpfe (am Telefon gibt es die Kante nicht).
> `stellen()` versteckt das Loch dann still — genau davor warnt der Kopf
> von `rundgang.ts` seit E272, und es ist trotzdem passiert, weil `test61`
> nur den ERSTEN Schritt hielt.
> Jedes Ziel trägt jetzt mehrere Kandidaten, genommen wird der erste
> sichtbare. Danach: null von neun blind, an beiden Grössen.
> ZWEI LEHREN AUS DEM PRÜFLAUF SELBST. Der erste Entwurf las
> `Rundgang.SCHRITTE` und suchte selbst den sichtbaren Kandidaten — also
> dieselbe Rechnung daneben; bei der Gegenprobe blieb er grün, weil der
> Nachbau ja stimmte. Jetzt klickt er sich wirklich durch alle neun und
> misst das Loch. Und die Gegenprobe konnte zuerst gar nicht rot werden:
> kein Schritt hatte einen Kandidaten, der DA, ABER UNSICHTBAR ist. Erst
> mit den genauen Zielen vorne (Schritt 7 „Überprüfen", Schritt 9 „Datei")
> trägt die Sichtbarkeitsprüfung etwas — und das ist auch für den Nutzer
> besser.

**4. September 2026 · Der Start wartet nicht mehr auf 185 Skripte (E389)**

> Redur schickte einen PageSpeed-Bericht. Die Zahlen von Google kamen nicht
> an — der Netzzugang verweigert `googleapis.com` —, also selbst gemessen,
> gedrosselt wie Lighthouse mobil (4× CPU, Slow 4G, mit gzip).
>
> ```txt
>                       vorher    mit defer   + PDF bei Bedarf
>   FCP ungedrosselt   1148 ms      156 ms         156 ms
>   DOMContentLoaded   5051 ms      584 ms         556 ms
>   FCP gedrosselt     2064 ms     1712 ms        1704 ms
>   DCL gedrosselt    14811 ms    15017 ms       12390 ms
>   Übertragen         2607 KB     2607 KB        2081 KB
> ```
>
> ZWEI VERSCHIEDENE WÄNDE, und das war der eigentliche Fund: ungedrosselt
> blockierten die 185 Skripte einander (keines hatte `defer`), gedrosselt
> sind es schlicht die Bytes. `defer` bewegte die 15 Sekunden um NICHTS;
> pdf.js erst bei Bedarf zu holen nahm 526 KB weg. Wer nur eines gebaut
> hätte, hätte auf einer der beiden Seiten nichts erreicht.
> `defer` steht hinter `src` und nicht davor — sonst hätten `test87 §8` und
> `test143 §2` ihre Dateiliste nicht mehr gefunden und wären grün gewesen,
> ohne etwas zu messen.
> `test388` neu mit 18 Punkten und einer Decke von 2300 KB über den Start.
> Fünf Mutationen rot — die fünfte erst im DRITTEN Anlauf: sie fragte nach
> dem Namen `PDFJS_EINGEPACKT`, den auch `laden.js` siebenmal nennt, dann
> nach der längsten Zeile der Datei (die ist ein Lernpaket), und erst dann
> nach den Zeilen hinter der Deklaration.
> Nebenbei gefunden und NICHT von hier: `test61` ist rot, auch auf dem Stand
> davor — der Rundgang zeigt seit E383 auf einen Reiter, den man im ruhigen
> Band nicht sieht (L125). Und was bleibt, steht als L124: 2081 KB sind rund
> zehn Sekunden reine Übertragung, und dagegen hilft nur, Bereiche erst beim
> Betreten zu laden — ein Umbau, der Redur gehört.

**3. September 2026 · Ein Ort ist kein Werkzeug (E388, Audit F02)**

> Vor dem Bauen gemessen, und der Bericht stimmte nicht: F01 sagt, der
> Klick auf „Heute" lasse den Inhalt stehen — er wechselt (`schauplatz`
> bibliothek → heute, 1060 → 2739 Zeichen). Der ECHTE Befund war ein
> anderer: am Rechner gab es die fünf Knöpfe gar nicht. `#sidebar` ist seit
> E272 Phase F `display:none`, die Kante trug zehn Knöpfe und keiner davon
> war ein Ort, und seit dem ruhigen Band (E383) liegt „Gehen" hinter einem
> zugeklappten Band.
> Die Kante hat jetzt drei Abschnitte: die fünf Hauptwege oben (aus dem
> Register, `haupt: true`), die Werkzeuge des Ortes in der Mitte,
> KI/Neu/Einstellungen unten. Der Ort, an dem man steht, ist markiert —
> und NUR er.
> Zwei Funde nebenbei: die Fünf gab es dreimal und zweimal verschieden
> (Telefonleiste sagt etwas anderes als Seitenleiste), und der Ortskatalog
> mischt Orte mit Handlungen und führt „Zeitmesser" doppelt. Beides steht
> in L123, keines still behoben.
> Und einer gegen mich selbst: der erste Entwurf liess die Werkzeuge
> rollen. Gemessen `offsetWidth 53 / clientWidth 53` — Chromium zeichnet
> hier Überlagerungsbalken, auf dem Bild war NICHTS zu sehen. Was nicht
> passt, geht jetzt hinter einen „···"-Knopf, der sagt, wie viele.
> `test387` neu mit 34 Punkten, fünf Mutationen rot; `test272 §14` hat den
> ersten Entwurf gefangen, bevor er landen konnte.

**30. August 2026 · Holen und Hochladen, je ein Skript (E271)**

> Redur: „eine holt die von github auf laptop und die andere umgekehrt".
> `holen.bat` und `hochladen.bat`, je eine Richtung, keines fasst die andere
> an. Beide wirft nichts weg bzw. überschreibt nichts Fremdes.
> **Der eigentliche Fund kam aus der Prüfung: das Verzeichnis ist ÖFFENTLICH**
> (`"private": false`, nachgemessen) — und `.gitignore` deckte `*.redion`
> nicht ab. Da E270 gerade automatische `.redion`-Sicherungen eingeführt hat,
> hätte ein `git add -A` Redurs ganzen Arbeitsbereich öffentlich ins Netz
> laden können. Geschlossen, bevor es passieren konnte.
> Dazu acht in echten Git-Repos nachgemessene Fehler in den Skripten selbst,
> darunter zwei mit Datenverlust. test87 §11 mit zehn Punkten, drei
> Gegenproben rot.
> Als Nächstes E269: Auswahl-Feinschliff der Zeichenschicht.

**30. August 2026 · Deine Daten auf allen Geräten (E270)**

> Redurs Wunsch war „alles auf iCloud". Ein Browser kann das nicht — also
> zwei Wege, die es wirklich einlösen, und beide waren gebaut und keiner
> benutzbar. Der eigene Cloudflare-Server ist fertig (Konten, Abgleich,
> Drei-Wege-Merge, E2E, R2) und war nur nicht scharfgeschaltet, während
> die Oberfläche an VIER Stellen behauptete, es gäbe ihn nicht.
> Dazu ein Sicherheitsfund: `[assets] directory = "./"` hätte ohne
> `.assetsignore` das ganze Verzeichnis veröffentlicht — gemessen brach
> `wrangler deploy` sogar an einer 78,6-MB-Datei in `.git` ab, Redur
> hätte also gar nicht veröffentlichen können.
> Neu ausserdem: Sicherung in einen Ordner (liegt er in iCloud Drive,
> lädt der Dienst sie selbst hoch), alle fünf Minuten und nur bei echter
> Änderung, 7 Tage plus je Monat einer, gelöscht wird nur das eigene
> Namensmuster und erst nach `close()`.
> test270: 65 Punkte, fünf Gegenproben einzeln rot gesehen.
> **Was Redur selbst tun muss:** die sechs Befehle in
> SERVER-EINRICHTEN.md, Schritt 0 — sein Cloudflare-Konto kann ich nicht
> bedienen. Danach sagt „Wolke → Server prüfen" in Worten, ob es steht.
> Danach E271: holen.bat und hochladen.bat (erledigt, siehe oben).

**30. August 2026 · Der Zeitmesser — Lernzeit messen statt schätzen (E268)**

> Schwebendes Feld mit Stoppuhr und Timer (5/25 Min), das sich merkt, an
> welcher Seite gearbeitet wurde; jede Sitzung landet mit Dauer und Seite
> in `zeit:sitzungen` (höchstens fünfzig). Schliessen stoppt nicht.
> Löst den alten Punkt „Pomodoro/Lernzeit echt messen statt schätzen".
> test268: 15 Punkte, drei Gegenproben rot — und ein Fund über die
> Prüfung selbst: die Pausenprobe war bei 1,4 s Wartezeit keine Prüfung
> (Rundung frass den Unterschied), erst 2,6 s machen sie rotfähig (§55.2).
> Danach E270: Redions Server scharfschalten (erledigt, siehe oben).

**30. August 2026 · Haftnotiz und Lineal auf der Zeichenschicht (E267)**

> Marken-Art `zettel`: aufziehen, Redions mehrzeiliges Blatt fragt nach
> Text (neu: Dialog.mehrzeilig — kein prompt()), Tinte nach Helligkeit,
> Umbruch in tspans, Abbruch räumt weg. Lineal-Schalter rastet
> Linie/Pfeil auf 15°-Schritte. test267: 16 Punkte, drei Gegenproben
> rot. Weiter: Zeitmesser (E268), Auswahl-Feinschliff (E269).

**30. August 2026 · Das Abdeckband — Active Recall auf Blatt und PDF (E266)**

> Neue Marken-Art `abdeck` in der einen Zeichenschicht: deckende Fläche
> über Lösungen, Antippen im Schreiben-Modus deckt auf/zu — NUR als
> Laufzeit-Attribut, die Ablage schweigt (kein edited, kein Sync-
> Rauschen). Neuladen/Druck/Folien zeigen zu. Knopf „Abdecken" in
> Blatt-Leiste und Menüband. test266: 12 Punkte, drei Gegenproben rot
> gesehen. Weiter: Haftnotiz+Lineal (E267), Zeitmesser (E268),
> Auswahl-Feinschliff (E269).

**30. August 2026 · Die Heft-Bibliothek aus Redurs GoodNotes-Dossier (E265)**

> Das Regal wird die Bibliothek aus dem Dossier: Reiter Dokumente/
> Favoriten/Papierkorb (wiederherstellen ja, endgültig löschen nur in
> der einen Löschmaschine), Fächer aus normalen Seiten (additives Feld
> `heftArt`, kein Datenmodell), Neu-Menü mit Papier-Schnellwahl über
> die neuen App.erstellenWege/erstellenWeg (die Kachel bleibt der
> Ein-Klick-Weg), Gitter/Liste, klickbarer Stern, Deckelfarbe aus
> `p.color` mit Whitelist, Verschlüsseln im Kontextmenü. test265: 38
> Punkte, drei Gegenproben rot gesehen — eine davon entlarvte einen
> leer-grünen Prüfpunkt (§55.2). Als Nächstes das Abdeckband (E266).

**30. August 2026 · Die Notizhefte: ein Regal, das sofort schreiben lässt (E264)**

> Neue Ansicht „Notizhefte" (Redurs GoodNotes-Wunsch, als Ablauf, nicht
> als Optik): Weiterschreiben-Karte, Deckel mit echtem Papiermuster,
> EIN Klick bis zum Schreibzeiger im linierten Blatt. Ein Heft ist eine
> Ansichtsregel (Seite mit Blatt-Kind, keine PDF-Seite) — kein neues
> Datenmodell. Startwerte „notizhefte"/„notizheft" in Einstellungen UND
> start() im selben Schritt (E236-Lehre). test264: 25 Punkte, drei
> Gegenproben rot gesehen. Als Nächstes E265: das Regal wird die
> GoodNotes-Bibliothek aus Redurs Dossier (Fächer, Favoriten,
> Papierkorb-Reiter, Liste, Deckelfarbe, Sperren im Menü) — dann
> Abdeckband (E266), Haftnotiz+Lineal (E267), Zeitmesser (E268),
> Auswahl-Feinschliff (E269).

**29. August 2026 · Hauptknopf-Verlauf und einklinkende Reiter (E263)**

> Amdion Phase 1, weiter: die Hauptknopf-Fläche als EINE Marke
> (--haupt-flaeche, Verlauf nach unten ins Dunkle — Amdions Aufhellung
> fiel bei der Messung auf 3,77 durch), getragen von .rb.haupt UND den
> echten is-primary-Knöpfen; der Lernwelt-Hover ist jetzt je Modus
> richtig herum. Der aktive Reiter klinkt mit drei Rändern in die
> Fläche ein statt auf einer Linie zu sitzen. Sechs Suiten grün.

**29. August 2026 · „⚡ Schaltung": Netz, Türklingel und Co. (E262)**

> Redurs Wunsch, zweistufig: erst L1 und N mit Quelle auf einen Klick,
> dann fertige Beispielschaltungen „direkt im Code". Der Knopf öffnet
> jetzt ein Menü: Netz, Ausschaltung, Wechselschaltung (Treppenhaus-
> Verhalten geprüft), Türklingel an 12 V — und die eigenen Vorlagen,
> die sich bisher nur speichern, aber nirgends einsetzen liessen (§47).
> test263 auf 17 Punkte gewachsen, zwei neue Gegenproben einzeln rot.

**29. August 2026 · Schaltplan: Einfügen und Schalten gehen wieder (E261)**

> Redur fand es mit der Maus: `closest('[data-id]')` lief am SVG vorbei
> bis zum Block-Kasten (der trägt `data-id = block.type`) — Einfügen
> per Klick ging im Seiten-Editor vom ersten Tag an ins Leere, kein
> Prüflauf hatte je echt geklickt. Jetzt sucht `teilAm()` nur im SVG,
> der Teil-Dialog kommt per eigener Doppeltipp-Erkennung (dblclick
> stirbt am Neuzeichnen, am Telefon gibt es keins), und das doppelte
> CSS-Raster aus E260 ist zurückgenommen. test263 neu, drei Gegenproben
> einzeln rot, test238/239/240 grün.

**29. August 2026 · Papier-Token und geteilte Anatomien (E260)**

> Amdion Phase 1 wird sichtbar: `--paper`/`--paper-ink`/`--grid`, das
> A4-Blatt ist im Dunkeln warm statt reinweiss, der Schaltplan liegt
> auf Amdions Punktraster. Neu: `anatomie.css` (Stufe 2) mit
> stat-karte, kicker, leer-zustand, hebt und ansicht-herein — je mit
> sofortigem Nutzer in Lernwelt und Menüband. test245 fing die doppelt
> gepflegte Papier-Tinte; zehn Suiten grün, Bilder im Chat.

**29. August 2026 · Bewegung wohnt nur noch in grund.css (E259)**

> Phase-1-Vorarbeit des Amdion-Bogens: das Dauern-Doppel aus marken.css
> (E43) gegen grund.css (E198) ist aufgelöst — grund.css gewann bisher
> nur durch Ladereihenfolge. Die gerichteten Kurven ziehen mit um,
> `--ease-standard` ist jetzt ein Alias der EINEN Kurve. Gegenprobe
> einzeln rot, test126/245/40 grün.

**29. August 2026 · Amdion ist die Vorlage — der Übernahme-Bogen beginnt (E258)**

> Redur will Redion „genau so" wie seinen eigenen Prototyp Amdion.
> Übernommen wird die Gestalt, nie Code oder Datenlayouts (Amdion ist
> funktional eine Teilmenge). Das Regiebuch mit acht Phasen steht in
> doku/AMDION-UEBERNAHME.md — Phase 1 ist Designsprache und
> Shell-Look, beginnend mit dem Motion-Token-Doppel aus marken.css
> gegen grund.css.

**29. August 2026 · Die Randleiste zählt die Kopfzeile mit (E257)**

> Der doppelte Lauf-Abfang von test248 war kein Flattern: seit E236
> mass `--inhalt-oben` nur die Menüleiste, und das Inhaltsverzeichnis
> wuchs bei vielen Überschriften über die Seitenknöpfe. Jetzt zählt
> die Kopfzeile mit; test248 misst es als stehenden Wächter.

**29. August 2026 · Hausaufgaben und Lernziele je Fach (E256)**

> Die zwei fehlenden Poster-Zeilen der Schulsäule. Vorlage legt homework
> und goals an (additiv wie beim Stundenplan), das Schul-Dashboard zeigt
> beide Sektionen („N offen", Überfälliges mit dem WORT), der Haken
> schreibt die Checkbox-Spalte der Zeile selbst, die Fachseite filtert
> über die echte Fach-Relation. test262 (11 Punkte, 2 Gegenproben
> einzeln rot), test202/215/250 grün. Bilder im Chat.

**29. August 2026 · Die Löschabsicht überlebt den Import (E255, L74 zu)**

> „Ersetzen" tauschte auch meta — wartende Grabsteine (E249/E254)
> starben mit, und ohne das Oben-Set wäre die Datei-Wache erblindet
> (L6 durch die Hintertür). Jetzt rettet importAll die Vereinigung der
> drei Listen; Kennungen, die die Sicherung wieder mitbringt, nehmen
> ihren Grabstein zurück. test261 §11, Gegenprobe einzeln rot. Die
> offene Konto/Marken-Frage ist ehrlich als L76 notiert.

**29. August 2026 · Endgültig heisst endgültig — jetzt auch für Blöcke (E254, L73 zu)**

> Das Muster „Papierkorb und sofort löschen" entfernte den Satz, bevor
> je ein Abgleich lief — drüben lebte er weiter und kam sogar zurück.
> Jetzt: Merkliste `wolkeBloeckeWeg` nach dem E249-Muster, geschrieben
> in purgeTief (samt Zeilen, Ansichten, Sammlung), versandt vor dem
> Holen, basis-Wache gegen Falschmeldung, zwei Runter-Wachen gegen Echo
> und Leichen. Server unverändert. test261: 16 Punkte, echter
> Prüfserver, zeitweise drei Geräte; Gegenprobe ohne Schreibpunkt →
> 9 rot, darunter B mit {"alive":true}. Folgelücken L74/L75 notiert.

**29. August 2026 · Der Graph bekommt ein Suchfeld — und seinen Boden (E253)**

> Tippen listet Treffer aus dem ganzen Index, Klick/Enter macht den
> Treffer zum neuen Mittelpunkt, Escape leert erst die Suche (§38),
> der Leerfall nennt das Wort (§47). Beifund nach §55: Steuerzeile und
> Seitenfeld des Graphen hatten NIE Stil — rohe Fieldsets, das Panel
> floss als Fliesstext unter die Fläche. Beides steht jetzt in
> werkzeuge.css. test260 (9 Punkte, 2 Gegenproben einzeln rot).

**29. August 2026 · Kartentext sieht überall gleich aus (E252)**

> Der Karteikasten zeichnete **fett** und `Code`, die Lernwelt zeigte an
> sieben Stellen nackte Sternchen — Training, Simulation, Fehlerlisten.
> Jetzt läuft verfasster Kartentext überall durch `Blocks.inline`
> (maskiert zuerst, §19); Getipptes bleibt wörtlich. test259 sucht die
> Karte durch die Runde (die erste Karte ist die Demo-Karte!), prüft
> Auszeichnung UND Maskierung; Gegenprobe mit echtem onerror-Lauf.

**29. August 2026 · Glocke und Wolke-Punkt — am Ende in der Menüleiste (E251)**

> Der Bild-Abgleich fand drei Fertigteile ohne sichtbaren Weg:
> Ungelesenen-Zähler, Abgleichstand, Wolke-Dialog. Der erste Anlauf
> hängte Glocke und Konto an die Kopfzeile — test40/245/248 wurden zu
> Recht rot: die Kopfzeile gehört der SEITE, die App-Zeile ist die
> Menüleiste. Jetzt: `mb-glocke` erscheint nur mit Ungelesenem (auf
> allen Geräten, am Telefon 44 px), der Statuspunkt sitzt an
> `mb-konto`, der Wolke-Dialog steht unter „Mehr → Wolke". Beifang mit
> eigener Lehre: `display:grid` schlägt die `[hidden]`-Regel des
> Browsers — die „versteckte" Glocke stand sichtbar da, und nur eine
> Prüfung des GERECHNETEN Stils sieht das (test258, 15 Punkte, drei
> Gegenproben einzeln rot). test248 stellt seine Ausgangslage seither
> ausdrücklich her, statt auf meldungsfreien Zufall zu hoffen.

**29. August 2026 · Gelöscht heisst gelöscht — auf allen Geräten (E249, L6 zu)**

> Die einzige Datenintegritätszeile der Visionskarte. Lokales Löschen
> einer Datei erreichte den Server nie und wurde beim nächsten Abgleich
> sogar rückgängig gemacht. Jetzt: Merkliste `wolkeDateienWeg` mit
> Oben-Wache (nie Hochgeladenes bleibt stumm), Versand VOR dem Holen
> (sonst belebt das Holen das Gelöschte wieder), 404/403-Regeln,
> Import-„ersetzen" bewusst ohne Grabsteine (§46), Abmelden leert die
> Liste. test256: echter Prüfserver, zwei echte Geräte, 16 Punkte —
> Grabstein überlebt das Neuladen, Server räumt die Bytes, Gerät B
> verliert die Datei. Zweistufige Gegenprobe: ohne Versand behält B die
> Datei; ohne Runter-Wache holt A die eigene Löschung zurück
> (dateienGeholt: 1). Beifund L73: das Block-Vorbild ist selbst undicht.

**29. August 2026 · Die fünf kleinen Pflichten der Karte sind ab (E244–E248)**

> Aus dem Poster-Abgleich, in einem Zug: Seitenzahlen/Kopfzeile beim
> Drucken (E244, test251 liest den eigenen Ausdruck zurück), Prüflauf
> für den DOCX-Import samt handgebauter deutscher Word-Datei (E245,
> test252), Prüflauf für die Rückverweis-Fusszeile — mit der Erkenntnis,
> dass dort ZWEI Wachen dasselbe halten (E246, test253), der
> Quellen-Wähler im Diagramm-Block: Datenbank wählen, gruppieren,
> messen, und Loslassen beim Rückweg (E247, test254), und die Uhr in
> der Elektro-Prüfung: 90 s je Aufgabe, Ablauf gibt ab wie auf Papier
> (E248, test255). Zusammen 53 neue Prüfpunkte, jede Änderung mit
> einzeln rot bewiesenen Gegenproben.

**28. August 2026 · Der Ausdruck wird abgabefähig (E244)**

> Aus dem Poster-Abgleich, „kleine Pflicht" mit grosser Sichtbarkeit:
> Drucken hat jetzt Kopfzeile (Titel), Datum und „Seite X von Y" — in
> @page-Randkästen, die der Browser auf jeder Seite wiederholt und
> selbst zählt. Erste Seite ohne Kopf (dort steht der H1), Rand zieht
> von body nach @page um (kein Doppelrand), Titel mit " und \ sprengen
> die content-Regel nicht. test251 beweist es mit echten Bytes: das
> gedruckte PDF wird über Redions eigenen Einlese-Weg zurückgeholt, und
> Seite 2 trägt „Seite 2 von N" im Suchtext. Zwei Gegenproben einzeln
> rot.

**28. August 2026 · Das Zielbild-Poster, und zwei Löcher noch am selben Abend zu (E242, E243)**

> Redur schickte sein Zielbild als Poster: „So was will ich — da steht
> alles, wie es sein sollte." Sechs Delta-Leser haben die Poster-Punkte
> gemessen (Nachtrag unter „Die Visionskarte"), und die zwei grössten
> Schul-Löcher sind seither gebaut:
>
> **E242 · Zeugnisnote je Semester (L71 zu).** Die Noten-Ansicht mittelte
> alle Schuljahre in einen Topf; ab dem zweiten Semester wäre die Kopfzahl
> falsch gewesen. Jetzt: drei Zeitraum-Knöpfe (Dieses/Letztes Semester,
> Alle), Vorgabe „Dieses Semester", Semestergrenzen Feb/Aug wie die
> Schweizer Schule, Undatiertes zählt zum aktuellen — und die Kopfzeile
> sagt das dazu. test249 §5.
>
> **E243 · Der Stundenplan-Knopf hält sein Versprechen (L70 zu).** Hinter
> „Stundenplan" stand nur die Ausbildungsseite. Jetzt: eigene
> Wochenansicht (Mo–Sa, Samstag nur wenn belegt), Lektionen nach Uhrzeit,
> „Jetzt: Elektrotechnik bis 09:20 in B204" in der Kopfzeile, das WORT
> „jetzt" an der laufenden Lektion (§38), zwei Leerfälle mit Wegen (§47);
> die Schulvorlage legt die Datenbank an — auch nachträglich, ohne
> Doppel. test250, 15 Punkte.

**28. August 2026 · Die Visionskarte: Redurs Satz, neunfach nachgemessen**

> „Kein Word, Excel, PowerPoint mehr … Schule, Noten, Lernen … PDF,
> Fachzeichnen, Elektro-Simulator … Notion, GoodNotes, Graphy, Obsidian."
> Neun strenge Leser haben jede Säule gegen den Bestand gehalten — nur
> Belegbares zählt. Ergebnis als eigener Abschnitt **„Die Visionskarte"**
> weiter unten: sechs Säulen tragen heute nachweislich, Schule trägt zur
> Hälfte, und die grössten Löcher heissen jetzt L69 (.pptx), L70
> (Stundenplan), L71 (Zeugnisnote ohne Semester), L72 (DOCX-Klartext).

**28. August 2026 · Noten: das Heft war da, jetzt rechnet jemand (E241)**

> Redur: „es sollte meine Schule alles begleiten, Noten, Lernen,
> Lernziele." Das Wort NOTEN kam in Redion genau einmal vor — als
> Datenbank der Schulvorlage. Eintragen ging, gerechnet hat niemand.
>
> Neu: Ansicht „Noten" neben den Prüfungen. Je Fach gewichteter Schnitt,
> Zeugnisnote (auf halbe Noten), Balken der letzten Noten, Zielrechner
> („für eine 4.0 braucht die nächste Prüfung mindestens eine …").
> Punkte→Note nach Schweizer Formel; Werte ausserhalb 1–6 fallen heraus
> statt den Schnitt zu heben (Gegenprobe: 13.63). test249, zwölf Punkte,
> drei Gegenproben einzeln rot.

**28. August 2026 · Redurs vier iPhone-Fotos: das Menüband stand dauerhaft offen (E240)**

> Ein einziger Reitertipp schrieb „Band offen" in EINEN Schlüssel für alle
> Startansichten — und zuklappen konnte nur der Pfeil. Auf den Fotos stand
> das Band mit 371 von 844 px über Termine, Lernen, Heute und einer Seite.
>
> Am Telefon ist es jetzt ein MENÜ: liegt über dem Inhalt statt ihn zu
> verdrängen, schliesst bei Tipp daneben, bei Bereichswechsel und nach
> jedem Befehl, und „offen" wird dort nicht mehr gemerkt — geerbte Merker
> von echten Geräten sind damit geheilt, ohne dass jemand etwas löscht.
> Am Rechner bleibt die gemerkte Wahl. Vier neue Punkte in test247 §8,
> drei Gegenproben einzeln rot. Untersucht mit vier parallelen Lesern.

**28. August 2026 · Redion öffnet dort, wo die Sachen liegen (E236)**

> Redur hat zwei Bildschirmfotos einer Notiz-App geschickt und beschrieben,
> wie Redion sich öffnen soll. Fünf Teile — und das meiste davon gab es
> schon, nur an der falschen Stelle.
>
> | | was gewollt war | was es schon gab | was ich tat |
> |---|---|---|---|
> | **1** | Regal mit Deckeln | `Bibliothek` als Tabelle | dritte Form: ein Deckel je Dokument, die Art abgelesen aus dem Inhalt |
> | **2** | „+ Neu" fragt was | `erstellenBlatt()` mit 11 Wegen, versteckt hinterm Stift | 19 Wege in 6 Gruppen, überall erreichbar |
> | **3** | zuletzt geöffnete PDF beim Start | die Einstellung gab es, ausgewertet hat sie niemand | Vorgabe „Dokument, sonst Regal" |
> | **4** | Menüleiste wie am Rechner | `#menueband` (E210), meist versteckt | ganz oben, 35 px, räumt sich selbst auf |
> | **5** | unten max 4–5 | 6 Kreise **oben** | fünf Wege unten, jeder mit Namen |
>
> **Der rote Faden:** kein einziger neuer Katalog (§8). Fünf Umzüge.
>
> **E219 ist zurückgenommen.** Er versteckte die Menüleiste über
> Startansichten, weil dort „sieben Dinge stehen, die alle sagen: nicht
> jetzt". Der Fehler war nicht die Leiste, sondern ihr Inhalt — drei ihrer
> sechs Reiter brauchen eine offene Seite. Das steht jetzt an einer Stelle
> im Register, und die Leiste räumt sich selbst auf.
>
> **Sieben Fehler fand nur das Bild (§55):** die Deckel zeigten „Seite
> 1Seite 2Seite 3" statt Papier; ein `<button>` zentriert seinen Inhalt
> senkrecht; sechs `.menu-liste` schnitten sich gegenseitig ab; der aktive
> Weg unten lag hinter der gleitenden Fläche; die Schublade deckte die neue
> Wegeleiste zu; die Titel auf den Deckeln waren HART abgeschnitten
> („Was Notion 10 0"), weil `text-overflow` für ein Inline-Element nicht
> gilt; und die Papierlinien liefen quer durch den Text wie ein
> Durchstreichen.
>
> **Vier fanden Prüfungen:** test202 kam nicht mehr zum
> Ausbildungs-Dashboard, test141 fand die zugedeckte Schublade und einen
> Punkt Fehler in `--hunten`, test126 den verlorenen Antipp-Übergang, und
> test67 den schwersten: die Sicherungswarnung und die Platzkarte standen
> nur noch in der alten Tabellenform — eine Sicherheitsfunktion (§11) in
> einer Ansicht zurückgelassen, die ab jetzt kaum jemand öffnet.
>
> **Zehn Prüfläufe wanderten mit** (31, 34, 37, 40, 67, 114, 126, 141, 156,
> 247). Bei jedem blieb die FRAGE, nur die Stelle wurde nachgezogen —
> mehrfach dreht sich dabei die Richtung um.
>
> **Und die Deckelform war die erste Vorgabeansicht ohne einen einzigen
> Prüfpunkt.** test33 hat jetzt sechs, jeder einzeln rot gemacht, bevor er
> stehen blieb (§55.2). Neu ist auch L68: die Reiterzeile der Lernwelt hat
> im verschmolzenen Kopf 234 statt 366 px.

**28. August 2026 · der Kopf am Telefon: 236 → 124 px**

> ### Was Redur rot angestrichen hat (E232–E235)
>
> Ein Bildschirmfoto der Lernzentrale, ein roter Kasten über den ganzen
> oberen Bereich, ein Satz: *„dort sollte möglichst wenig sein"*.
>
> Gemessen waren es vier Bänke und 236 px von 844 — und der Name der Welt
> stand dreimal darin: als aktiver Kreis, als Krume, als aktiver Reiter.
>
> | | was gemacht wurde | was es bringt |
> |---|---|---|
> | **E232** | Zurück und die drei Punkte auf 44 × 44 (§37) | die Krume wird 9 % kürzer |
> | **E235 ①** | Kreisleiste 80 → 68, nur am Polster gespart | −12 px |
> | **E235 ②** | Bereichsfilter wird ein Chip in der Reiterzeile | −44 px |
> | **E235 ③** | Krumenzeile und Reiterzeile werden EINE | −56 px |
>
> **Wie ③ ohne Kopplung geht:** ein Bereich markiert seine oberste, klebende
> Zeile mit `data-kopfzeile="eigene"` und sagt damit nur etwas über SICH.
> Die Schale fragt danach — `#main:has(> #scroll > #page >
> [data-kopfzeile="eigene"])` — und nimmt am Telefon ihre eigene Zeile aus
> dem Fluss. Fehlt die Marke, ändert sich nichts (§5).
>
> **Zwei Fehler fand nur das Hinsehen (§55):** die zwei Knöpfe sassen sechs
> Punkte zu hoch auf der Karte (`align-items:stretch` streckt keinen Knopf
> mit fester Höhe), und der GEWÄHLTE Reiter stand halb ausserhalb. Das
> zweite wurde in `Rollrand.zeige()` gelöst, also für alle vier Rollleisten
> auf einmal.
>
> **Und der Preis, ausgesprochen:** die Reiterkarte ist von 322 auf 234 px
> geschrumpft — zweieinhalb statt dreieinhalb sichtbare Reiter. Sie rollt,
> zeigt ihre Kante als Schatten, und der aktive Reiter steht immer im Bild.
>
> **Versprochen waren 112 px, geworden sind es 124.** Die 112 kamen aus einer
> Schätzung, in der die Kreise auf 56 schrumpfen — das ist die Trefferfläche
> selbst und wäre unter §37 gegangen.
>
> **Geprüft:** test67 §11, elf Punkte, vier Gegenproben einzeln gefahren und
> jede rot geworden.

**27. August 2026 · 215 Prüfläufe · acht Fehler aus dem Bilderdurchgang**

> ### Was 92 Bildschirmfotos gefunden haben (E224–E231)
>
> Redur wollte alle Ansichten sehen — Rechner und Telefon, hell und dunkel —
> und wissen, was zu voll ist. Aus dem Hinsehen wurden acht Behebungen, und
> keine davon hätte eine bestehende Prüfung gefunden.
>
> | | was zu sehen war | was dahinter steckte |
> |---|---|---|
> | **E224** | „📕 Elek…" | der Sucher lag über dem Seitentitel, 55 px |
> | **E225** | test67 rot | die Prüfung mass die Überschrift statt den Inhalt |
> | **E226** | test40 rot | `offsetParent` ist keine Sichtbarkeit — dreimal |
> | **E227** | Karte „1’450" | die Kartenansicht las nie ein Zellformat |
> | **E228** | „Whit…" „Scan…" | 7 von 8 Kacheln hatten 45 px für den Text |
> | **E229** | „00:00" | Ganztagstermine verschwanden westlich von Greenwich |
> | **E230** | blasse Zeilen | 11 Texte unter AA, 7 davon trugen Bedeutung |
> | **E231** | „1 Einträge" | die Mehrzahl-Regel stand 146 Zeilen tiefer |
>
> **Der rote Faden, dreimal derselbe:** bei E228, E229 und E231 stand die
> richtige Regel bereits im Projekt — vierzehn Zeilen tiefer, in der
> Kalenderansicht, hundertsechsundvierzig Zeilen tiefer. Eine Entscheidung,
> die an vier Stellen einzeln getroffen werden muss, wird irgendwann an einer
> vergessen. Deshalb steht sie jetzt jeweils an EINER.
>
> **Und dreimal habe ich mich geirrt** und es berichtigt: `634.216667` ist die
> richtige Kürzung und kein abgeschnittener Wert; der doppelte Aufgabeneintrag
> war ein Fehler im Bild-Beispiel, nicht in der App; die beiden Namen des
> Simulationsknopfes sind Absicht und stehen so im Code begründet.
>
> **Neu:** test249 misst den Kontrast in acht Produktwelten × zwei Themen mit
> der WCAG-Formel und einer namentlich begründeten Ausnahmeliste.
>
> **Erledigt am 28. August:** „die zwei Reiterzeilen sind der grösste
> Einzelposten" — Redur hat den Kasten rot angestrichen, und E235 hat die
> Krumenzeile mit der Reiterzeile verschmolzen. 236 → 124 px. Der Block
> ganz oben erzählt es.

**27. August 2026 · die ruhige Fassung ist gebaut**

> ### Ruhig: 52 Rahmenknöpfe werden 15 (E218–E222)
>
> Redur wollte Redion ruhiger, mit weniger Bereichen, ohne dass etwas
> verschwindet. Zuerst gemessen statt geschätzt — alles Anklickbare in
> Seitenleiste, Kopfzeile und Menüband bei 1440 × 900:
>
> | | vorher | ruhig |
> |---|---|---|
> | Seitenleiste | 32 | 8 |
> | Kopfzeile | 13 | 7 |
> | Menüband (Startansicht) | 7 | 0 |
> | **zusammen** | **52** | **15** |
>
> Fünf Wege stehen links: Heute, Lernzentrum, Elektro, Bibliothek, Aufgaben.
> „Mehr" (Strg + M) holt alles zurück, an derselben Stelle, mit denselben
> Knöpfen — der Unterschied ist eine CSS-Regel, kein zweiter Katalog.
> Schalter: Einstellungen → Aussehen → Schrift und Layout.
>
> Dazu kam beim Bauen heraus:
>
> · **Elektro hatte keine eigene Zeile** — eines der 14 Module, das grösste,
>   erreichbar nur über den Workspace. Jetzt hat es eine (öffnet aber einen
>   Rechner, keine Seite — L65).
> · **Die Leiste sagte nicht, wo man ist.** Ein Klick auf „Bibliothek" liess
>   „Workspace" aufleuchten; zwei fest verdrahtete Zeilen kannten nur die
>   Welt. Bei fünf Wegen ist die Markierung der einzige Anhaltspunkt (E221).
> · **Zweimal derselbe Titel.** Lernwelt und Workspace trugen ihren Namen
>   noch einmal unter der Pfadnavigation — 60 und 169 px (E219, E222).
> · **Der Entwurf log an einer Stelle:** die Formatierleiste sollte in den
>   freien Rand rechts, im Bild waren dort 424 px. In der App sind es 150,
>   die Leiste ist 552 breit. Zurückgenommen, Messung im Code festgehalten
>   (E220).
>
> Prüfung: test248 mit 41 Punkten, jeder mit eigener Gegenprobe. Der
> Wächter „nichts ist weg" brauchte drei Anläufe — die ersten beiden waren
> grün, während ein Eintrag dauerhaft versteckt war.

> ### Vorher: 25. August 2026 · 202 Prüfläufe · LUECKEN.md abgearbeitet

> ### Die Lückenliste, zu Ende gegangen (E170–E182)
>
> Jede der 54 Lücken hat jetzt einen Ausgang: gebaut, gemessen, oder mit
> Begründung bewusst nicht gebaut. Keine steht mehr da, ohne zu sagen, was
> mit ihr ist.
>
> **Drei echte Fehler fand dabei nicht das Lesen, sondern das Messen:**
>
> ```txt
> E171  Zwei Blöcke am selben Bild — den einen löschen nahm dem anderen
>       das Bild. Datenverlust, still.
> E174  Der Markdown-Rundlauf gab jedem Block eine neue Kennung; jeder
>       Verweis darauf zeigte danach ins Leere.
> E180  Eine Datenbankansicht zeigte 50 von 2000 Zeilen und sagte es nicht.
> ```
>
> **Vier Lücken waren gar keine — sie waren nie nachgesehen worden:**
>
> ```txt
> L21   verlangte drei Dinge, die es seit E122 gibt (test199, 33 Punkte)
> L22   vermutete Langsamkeit; gemessen sind es 68 ms für die Volltextsuche
>       über 8000 Blöcke (test233)
> L26   „Asana fehlt" — es kam herein, nur als lauter Textspalten (E182)
> L50   „zwei Wahrheiten"; gemessen sagen beide dasselbe (E169)
> ```
>
> **Und vier sind entschieden statt offen**, mit dem Grund dabei: L29 (keine
> eingebettete OCR-Engine — sie wiegt bei jedem Start), L30 (kein
> Erweiterungssystem — fremder Code im selben Fenster wie die Notizen),
> L32 (kein OAuth-Geheimnis im Browser), L50 (kein gemeinsamer Aggregatkern
> für ein Ergebnis, das der Mensch nicht sieht).
>
> Eine bekannte Lücke ist besser als ein stiller Fehler — und eine Lücke,
> die nur auf dem Papier steht, ist auch eine Art Falschaussage.

> ### Stand vom 25. August — Zweig `codex-study-suite`
>
> Alle 60 Abschnitte des grossen Auftrags sind gebaut. 56 tragen einen
> Prüflauf, der rot wird, wenn sie kaputtgehen; vier stehen halb, und bei
> jedem steht dabei, warum. Kein `✗` und kein `?` mehr in
> `doku/AUFTRAG-STAND.md`.
>
> **Was an diesem Tag entstand**
>
> ```txt
> E145  §23 stand als fehlend da und war vollständig gebaut — falsche Lücke
> E146  „Geteilt öffnen" setzte den Zustand, zeichnete das Feld aber nicht neu
> E147  Dateinamen und Quellenangaben suchbar; EINE Funktion für beide Suchen
> E148  Vier Sachen, die nur das Hinsehen fand — darunter 120 von 390 Pixeln,
>       die am Telefon eine Kennung-vor-Klasse-Regel gefressen hat
> E149  Lernpfad und Arbeitssicht festgehalten; XP bewegt kein Wissen
> E150  Der OCR-Dienst liegt jetzt bei — dienste/ocr.mts, doku/OCR-DIENST.md
> E151  Am Telefon stand „Tagesrunde starten" 188 px unter der Falz
> E152  Die unverteilte Aufgabe aus einer Besprechung war für niemanden da
> E153  Wer sich einen Namen gab, verlor SEINE GANZE Aufgabenliste
> E154  Der Obsidian-Rundlauf, einmal ganz durchgelaufen
> E155  Der Weg zurück zur Quelle: ↩ PDF · Seite 14
> ```
>
> **Geschlossen:** L53 (Dienst fehlte), L55 (Suche fand keine Dateinamen),
> L56 (benanntes Konto leerte die Liste). **Neu:** L57 (die Aufgabe findet
> ihr Meeting, aber nicht die Minute).
>
> **Was offen ist**
>
> ```txt
> 1. L57 — braucht eine Änderung an der KI-Anweisung und ein Modell zum
>    Messen. Raten wäre schlechter als weglassen.
>
> 2. §13 Uni und §35 Gemeinsam bleiben halb, aber nicht aus Versäumnis:
>    Semester aus Titeln zu erkennen ist so gewollt, und ohne Server ist
>    Teilen nun einmal ein Export.
>
> 3. §47 Visuelle Qualität hört nicht auf. Der nächste Fund kommt, sobald
>    wieder jemand hinsieht statt zu lesen (§55) — genau so kamen E148 und
>    E151 zustande.
> ```
>
> **Die teuerste Lehre des Tages** steht nicht im Produkt: in sechs von neun
> neuen Prüfläufen war der erste Fehler MEINER, nicht der der App. Ein
> `textContent`, das kein Tippen ist. Ein `|| -1` auf einem Zähler, der bei 0
> anfängt. Ein `clientWidth`, das die Innenabstände mitzählt. Ein `\b2\b`,
> das die 2 aus „SM-2" nahm — und damit einen Punkt aus dem falschen Grund
> GRÜN machte. Der fällt niemandem auf; deshalb steht jede Gegenprobe
> einzeln zurückgenommen in den Einträgen.

**24. August 2026 · 174 Prüfläufe**

> ### Stand vom 24. August, abends — Zweig `codex-study-suite`
>
> **Der grösste Einzelbefund des Tages:** rund 40 000 Zeilen Codex-Arbeit
> waren im Browser nicht vorhanden. Ein Typfehler in `arbeitswelt.ts:337`
> brach `npm run typecheck` ab, dadurch lief `bauen:ts` nie durch, und fünf
> `quell/*.js` fehlten. `index.html` lud sie trotzdem — fünf 404er bei jedem
> Start, ohne Meldung, ohne rote Konsole. Lernwelt, Arbeitswelt,
> Lebensbereiche, Produktwelten und die Einrichtung der Hauptwelten waren
> geschrieben und tot (E132).
>
> Danach war zu sehen, was Codex gebaut hat, und es ist viel: Heute-Dashboard,
> Lernzentrale, Lernpfad, Fehlerzentrum, Prüfungszentrale, Schule, Uni,
> Arbeit, Workspace-Übersicht, Bibliothek, Dokumentmodus, Elektro-Rechner.
> Am Rechner wie am Telefon, ohne waagerechten Überlauf.
>
> **Was an diesem Tag entstand**
>
> ```txt
> E132  Bauschranke gelöst; test101 (der Prüfserver hielt nicht an),
>       test202 (Onboarding blockierte den Lauf), test87 (Kaskade sprang
>       von Stufe 3 auf 2 zurück)
> E133  test206 — die erste Prüfung, die die Produktwelten wirklich öffnet
> E134  Papiervorlagen: blanko, liniert, kariert, Punktraster, Millimeter
> E135  Die Lernwelt rechnete falsch — zwei Ursachen, sieben falsche Zahlen
> ```
>
> **Was offen ist**
>
> ```txt
> 1. L49-L53 sind neu: Fassaden in der Lernwelt · zwei Rechenwege für
>    dieselben Aggregate · die Hauptwelten stehen in keinem Register ·
>    zwei Willkommensdialoge an zwei Starts · „Erkennen" braucht einen
>    Dienst, den Redion nicht mitliefert.
>
> 2. Der grosse Auftrag ist NICHT abgearbeitet. Umgesetzt sind §3 (die
>    zwei Prüfläufe), §21 (Papiervorlagen), §56 (Prüfungen für die
>    Produktwege) und die Voraussetzung für alles andere: dass die Module
>    überhaupt laufen. Offen bleiben unter anderem Uni mit Semestern,
>    Projekte und Meetings in der Arbeitswelt, Whiteboard als eigener
>    Bereich und eine Prüfungssimulation mit Gedächtnis.
>
> 3. Drei Verweise auf Entscheidungen stimmen nicht: electrical.ts:6,
>    calculations.ts:10 und daten.ts:851 nennen E128, und E128 ist „Neue
>    Audioaufnahmen sind Anhänge". Nicht angefasst — welche Entscheidung
>    gemeint war, lässt sich nicht raten.
> ```


> ### ✅ STUDY SUITE · PHASE 1 INK V2 ABGESCHLOSSEN
>
> Die gemeinsame Zeichenschicht von A4-Blatt und PDF-Seite kann jetzt
> transparenten Marker, Linie, Pfeil, Rechteck, Ellipse und sichere
> Textanmerkungen. Auswahlrechteck, Mehrfachauswahl, gemeinsames Verschieben
> und Löschen sowie Aktions-Undo/Redo sind angeschlossen.
>
> `src/core/ink/geometry.ts` ist der neutrale, DOM-freie Geometriekern. Es
> gibt keine zweite Ink-Datenbank und keinen PDF-zu-Whiteboard-Import; die
> additiven Markendaten laufen durch vorhandene Sicherung und Sync.
>
> `test201` (Suite 167, 32 Punkte) hält Markertransparenz, Formen, Text,
> Druckwerte, Coalesced Events, Reduktion, Auswahl/Bewegung/Undo/Redo,
> 390×844, 1366×768, 1440×900, Druck, Backup/Restore und Sync fest.

> ### ✅ STUDY SUITE · PHASEN 2–9 IM CODE ABGESCHLOSSEN
>
> Dokumentmodus · PDF/Notiz → Lernen · Lernen V2 · Audio V2 · Alias/Vault ·
> Scanner/OCR · Ausbildung · Schulbibliothek sind auf den vorhandenen Seiten,
> Blöcken, Anhängen, dem Graphen und SM-2 aufgebaut. Es gibt keinen zweiten
> Store, Graph, PDF-Viewer oder Lernkartenbestand.
>
> Der bewusst gebündelte Abschlusslauf folgt nach Erzeugen der Browserdateien;
> Zwischenläufe wurden auf Wunsch nicht ausgeführt. Der Umsetzungsnachtrag
> steht in `doku/REDION-STUDY-SUITE-AUDIT.md`.

> ### Historischer Übergabestand vor Ink V2 — 22. August, nachmittags
>
> Die Arbeit an E123/E124 ist inhaltlich fertig und committet. Was noch
> aussteht, steht unten unter **„Offen beim Anhalten"**. Wer hier weitermacht,
> liest zuerst diese drei Absätze und braucht sonst nichts.
>
> **Was zuletzt gemacht wurde**
>
> `Store.purgeBlock` löschte die Anhänge in einer abgelösten Aufgabe, auf die
> niemand warten konnte. Wer eine Seite löschte und gleich darauf eine
> Sicherung zurückholte, bekam die Seite zurück und den Anhang nicht — das
> alte Löschen kam an, nachdem das Zurückholen den Anhang schon neu
> geschrieben hatte. Betroffen war NICHT nur das verschlüsselte Paket,
> sondern auch die gewöhnliche `.redion`-Sicherung.
>
> Behoben mit `Store.settled()`: abgelöste Arbeit wird vermerkt, `importAll`
> wartet vorn und hinten darauf. Gemessen bei 1972 Blöcken im Bestand —
> dreimal von drei Läufen der Anhang weg ohne die Behebung, dreimal von drei
> Läufen 900 Bytes zurück mit ihr. Ganze Geschichte: `ENTSCHEIDUNGEN.md` E123.
>
> Nebenbefund beim Messen: das Suchfenster fand eingelesenen PDF-Text nicht
> mehr, während `Store.search` ihn fand — zwei Suchen, zwei Antworten
> (E124). Beide Wege lesen jetzt `text` UND `suchtext`.

### Offen beim Anhalten

```txt
1. DER VOLLE PRÜFLAUF IST NICHT DURCHGELAUFEN.          ← das Wichtigste
   `npm run pruefen` wurde nach 9 von 166 Läufen angehalten (alle 9 grün).
   Einzeln geprüft und grün sind ausserdem: test85, test95, test133,
   test152, test181, test199, test200.
   Zu tun: `node pruefungen/alle.mts > /tmp/voll70.log 2>&1` und das
   Ergebnis ansehen. Dauer etwa 50-60 Minuten.

2. Der Zweig ist noch nicht geschoben.
   Alles liegt auf `zusammenfuehrung`; `claude/redion-head2-desktop-move-j47chf`
   muss daraufgesetzt und geschoben werden.

3. L43 steht offen und ist Absicht.
   Ein Anhang ohne `blockId` bleibt beim endgültigen Löschen für immer
   liegen. Heute belanglos — alle sechs echten Aufrufer von
   `Dateien.ablegen` übergeben `blockId`. Die naheliegende Behebung würde
   MEHR löschen als heute, und das gehört in eine eigene Entscheidung mit
   eigenen Prüfungen, nicht nebenbei in eine Fehlerbehebung (§46).

4. Kleinigkeit: das Bild in Hell wurde nicht erzeugt.
   `data-theme="light"` von aussen auf `documentElement` gesetzt hat die
   App wieder überschrieben. Die geänderte CSS nutzt nur bestehende
   Farbmarken (`--bg-input`, `--line`, `--text`), sollte also mitgehen —
   nachgesehen wurde es aber nicht.
```

### Was dabei entstanden ist

```txt
src/kern/ablage/indexdb.ts      abloesen() + settled(), importAll wartet
src/kern/sicherheit/krypto.ts   Karte „Vollständiges Paket" im Dialog
src/bereiche/ki/kontext.ts      Suchindex liest suchtext
src/schale/aufbau/schale.ts     der Weg ohne Index tut dasselbe
quell/schale/stil/bausteine.css Dateifeld und Knopf auf einer Zeile
pruefungen/lauf/test200.mts     NEU, 29 Punkte, Gegenprobe 10 rot
pruefungen/lauf/test199.mts     §3 vom Wächter zum echten Rundlauf
test85/95/133/152/181           Erwartungen auf den Stand nach dem
                                Zusammenführen gebracht
```


Redion kann heute: lokal starten · offline arbeiten · Seiten und Blöcke
speichern · Datenbanken · Formeln (158 Funktionen, davon 61 unter deutschem
Excel-Namen) · Tabellenblock (E29) mit bedingter Formatierung (E53) ·
lokale KI mit Grenzen für Agenten (E52) · Versionen · Papierkorb ·
`.json`- und `.redion`-Sicherung mit Anhängen, auch über 4 GB (E39) ·
grosse Dateien stückweise · `.ods` lesen und schreiben · als App
installierbar, mit Erinnerungen, die auch ankommen (E40/E41).

**Der React-Umbau (E78) ist widerrufen** — Redur hat ihn am 9. August
nach Ansicht des Rohbaus entfernt (E80). Geblieben sind die Reparaturen
der echten App: E71–E77, E79, test148/152/155.

**Die drei wichtigsten offenen Punkte**

```txt
1. ~~Die TypeScript-Migration selbst~~ · **erledigt** am 6. August —
   0 handgeschriebene JS-Dateien, siehe doku/BUENDEL-11-BIS-24.md
2. ~~Der Spreadsheet-Block — die Funktionen sind da, die Tabelle fehlt~~
   · **erledigt**, siehe Phase 7a und `ENTSCHEIDUNGEN.md` E29
3. ~~Cloudflare, Konto und Sync sind nicht produktionsreif~~
   · **Phase 9 erledigt** am 6. August: G1 Konto (E34) · G2 Anhänge in R2
     (E33) · G3 Konflikte und Offline (test118) · G4 Rechte (E35)
```

**Seit dem 7. August ist das Telefon die Hauptumgebung** (E37). Aus Redurs
Entwurf „Nocturne" sind gebaut: E42–E53 — der Reiter „Mehr" · der Kompass ·
eine eigene Farbwelt mit nachgerechneten Kontrasten · Bewegungsmarken und
Berührungsrückmeldung · das Blatt „Neu erstellen" · das KI-Fenster von
unten · Ladeskelette · versetzte Listenzeilen · Suchfilter als Marken · die
gleitende Reiterpille · eine 56-px-Leiste, deren Höhe an einer Stelle steht.

**Was jetzt obenauf liegt:**

```txt
L10  Mobile — die Bereiche sind durch: Willkommensbildschirm (E55),
     Einstellungen (E58), Sicherungskarte (E57), Menü-Blätter
     (test155), Formatleiste (E81), Ziehen (E83), Mehrfachauswahl
     (E84), Tabellenblock als Karten (E89, Vorschlag — Redur
     entscheidet am Bild). Offen bleibt allein die Prüfung auf einem
     echten Gerät
L12  Barrierefreiheit — gemessen und behoben (E51); es fehlt der
     Durchlauf mit einem echten Vorleseprogramm
L16  ✅ komplett (9. August): sonst-Zweig (E85), Schleifenschutz
     gegen Automations-Kreisel (E86), Schleife über eigene Zeilen
     (gab es längst — erst jetzt gefahrlos)
L18  XLSX/ODS-Rest: Zellformatierung, Kommentare, ODS-Mehrblatt —
     Mehrblatt-XLSX kam mit E91 (Export trug vorher nur das aktive
     Blatt: stille §13-Lücke)
L20  ✅ komplett (9. August): Ausfüllen (E87), Markdown-Tabellen
     (E88), Alt+Umschalt+Klick (test158 §7)
L35  ✅ geschlossen (15. August, E121): Stück-Lesefehler brechen
     Sicherung, Sync und Löschen ab, ohne Dateisatz oder Bytes anzutasten
L37  ✅ komplett (19. August): Seitenanker (E105) · Seitenbilder
     zurückholen (E106) · Textsuche im PDF (E107) · Drucken mit
     Strichen (E108) · geschützte Dateien (E110).
     Die „Neurasterung" war kein Merkmal, sondern ein Rechenfehler:
     1654 px über A4 sind 200 dpi, nicht 140.
     Offen bleibt allein OCR für eingescannte Seiten ohne Textebene —
     und das ist L29, nicht L37.
```

**Redurs vier Wünsche für die Schulaufgaben** (11.–19. August) sind
abgearbeitet:

```txt
leeres A4-Blatt zum Draufschreiben          E100  ✅
daneben stellen (Spalten)                   E102  ✅
Schriftgrösse, Farbe, Schriftart            E101  ✅  (Farbe gab es schon)
PDF durchblättern und darauf schreiben      E103  ✅
… und ein leeres Blatt gleich daneben       E104  ✅
```

Mit E103 kommt die **erste fremde Laufzeitbibliothek** ins Verzeichnis:
pdf.js, Apache-2.0, als Umwandler beim Einlesen — nicht im Anzeigeweg.
Was das kostet und warum es umkehrbar bleibt, steht in E103.

**Erledigt seit dem 6. August:** L11 Agenten-Grenzen (E52) · L33 Web Push
(E54) · L14 ZIP64 (E39) · L4 Fehlerwerte (E36) · L20 Markdown (E59) ·
L15 bedingte Formatierung vollständig (E60) · L35 Stück-Lesefehler (E121) ·
der grösste Teil von L10 und L12.

**Der Fund vom 8. August**, weil er die Art Fehler zeigt, auf die zu achten
ist: `# Titel` wurde eine Überschrift namens `#Titel` — das Kürzelzeichen
blieb im Text stehen. Seit es die Kürzel gibt. Sichtbar auf jedem
Bildschirm, und trotzdem grün, weil jeder Prüflauf nur den **Blocktyp**
verglich. Siehe E59.

---


---

<a id="phasen"></a>

## Phase 1 · Ordnung und Dokumentation · **erledigt**

Die fünf Steuerdateien sagen jetzt dasselbe.

Vorher widersprachen sie sich: `CLAUDE.md` §3 verlangte deutsche Dateinamen,
§52 gab die Zielstruktur englisch vor, die README ebenfalls. Wer neuen Code
schrieb, konnte beide Seiten belegen — und schrieb deshalb zuerst deutsch.

**Erledigt**

- `ENTSCHEIDUNGEN.md`: **E27 · Code-Sprache** neu · E24 von 196 auf 132
  Zeilen konsolidiert (vier Nachträge, von denen einer einen früheren
  widerrief, sind zu geltenden Regeln geworden)
- `AUFGABEN.md`: diese Datei, zehn Phasen mit ehrlichem Stand
- `LUECKEN.md`: nach Priorität statt nach Nummer
- `CLAUDE.md`: **Abschnitt 53 · Code-Sprache und TypeScript** neu · §3
  präzisiert · 39 Zeilen unredigierter Chat-Text entfernt
- `README.md`: Code-Stil um die Sprachregel ergänzt
- `doku/TYPESCRIPT-MIGRATION.md`, `doku/ARCHITEKTUR.md`,
  `pruefungen/LIESMICH.md`: auf die englischen Pfade nachgezogen

**Dabei gefunden: erfundene Feldnamen an zwei Stellen.** `CLAUDE.md` §52.8
und `README.md` zeigten `createdAt`, `updatedAt`, `properties`, `children`
und `deleted` als Felder eines Blocks. Vier davon gibt es nicht, und
`deleted` hätte die Bedeutung von `alive` genau umgekehrt. Beide Beispiele
waren nie gegen `quell/kern/ablage/indexdb.js:255` geprüft — dieselbe
Fehlerklasse wie die elf falschen Excel-Zuordnungen. Jetzt steht dort die
gemessene Form, mit `src/core/types/` als Wahrheit und dem Rest als Beispiel.

**Fertig wenn** — alles erfüllt: TypeScript-Ziel klar · Code-Sprache klar ·
`.redion` klar · Excel-Ziel klar · Cloudflare als optional klar.

---

## Phase 2 · TypeScript-Grundlage · **erledigt**

```txt
typescript@5.9.3        devDependency
tsconfig.json           strict + noUncheckedIndexedAccess + exactOptionalPropertyTypes
npm run typecheck       tsc --noEmit
npm run bauen:ts        tsc -p tsconfig.bauen.json
src/core/types/         sieben Dateien
doku/TYPESCRIPT-MIGRATION.md
GitHub Actions          Typecheck im schnellen Auftrag
```

**`noEmit` ist die Kernentscheidung.** Es entsteht kein JavaScript und damit
kein Bauschritt, den jemand vergessen kann — die App startet weiterhin per
Doppelklick. Für ausführbaren Code gibt es `tsconfig.bauen.json`, das nach
`quell/` ausgibt; das Erzeugnis wird mitversioniert.

Gegengeprüft: ein absichtlich falscher Typ macht den Lauf rot (`TS2740`). Ein
Typecheck, der grün ist, weil er keine Datei findet, sagt nichts.

---

## Phase 3 · Backup und `.redion` dokumentieren · **erledigt**

`doku/REDION-FORMAT.md` — Aufbau des Archivs · `daten.json` ·
`dateien.json` · Dateinamen- und Kennungsregeln · die zwei Einspielarten und
warum es keine Vorgabe gibt · die Grenzen · wie man ein `.redion` ohne
Redion öffnet.

`pruefungen/LIESMICH.md` beschreibt die fünf Läufe, die man nicht abschwächen
darf, und **wodurch** man sie versehentlich entschärfen würde.

**Dabei gefunden und behoben** — drei Fehler, die alle still waren:

```txt
ein ZIP mit 70 000 Einträgen nannte 4 464 und sah gesund aus
ein fremdes ZIP64-Archiv importierte als „0 Anhänge", ohne Fehler
die verschlüsselte Wiederherstellung meldete Erfolg und warf die Daten weg
```

Gehalten von `test103` (14) und `test104` (20).

**Offen: ZIP64.** Die heutige Regel ist eine ehrliche Fehlermeldung statt
eines kaputten Archivs. Siehe `LUECKEN.md`.

---

## Phase 4 · Excel-Recherche und Tabellenkern planen · **erledigt**

`doku/EXCEL-IN-REDION-RECHERCHE.md`.

**Das Ergebnis drehte die Reihenfolge um.** Angenommen waren rund sechzig zu
bauende Funktionen. Gemessen:

```txt
158  Funktionen im Register, davon 0 ohne Implementierung
 37  des Excel-Startpakets liefen bereits — keine unter deutschem Namen
```

Es fehlten also nicht Funktionen, sondern **Namen**. Heute laufen 61 von 63
unter deutschem Namen; die zwei fehlenden fehlen mit Absicht
(`ENTSCHEIDUNGEN.md` E24, Regel 3).

VBA und Makros sind ausgeschlossen (E25), grosse Abhängigkeiten nur nach
Prüfung (E26).

---

## Phase 5 · Erste TypeScript-Typen · ◐ **grösstenteils erledigt**

Sieben Dateien unter `src/core/types/`, alle aus dem laufenden Code
**gemessen** und seit Phase 1 englisch benannt (E27):

```txt
id.ts        ID · ISODateTime · BlockId … FileId · Result<T> · Done
block.ts     RedionBlock · RedionRow · RedionPage · RedionVersion
database.ts  RedionDatabase · RedionView · Schema · Column · Filter · Sort
file.ts      RedionFile · FileChunk · UploadState
backup.ts    RedionPackageData · RedionPackageManifest · RedionPackage · ImportMode
storage.ts   STORES (alle neun) · StorageLocation · StorageInfo
index.ts     eine Tür für alles davon
```

**Typnamen englisch, Feldnamen nicht.** `RedionBlock` trägt weiter
`created`, `edited`, `erstelltVon`, `alive`, `parentTable` — so stehen sie in
IndexedDB. Ein Feldname, der nicht dem gespeicherten Feld entspricht, wäre
keine Übersetzung, sondern eine falsche Behauptung.

### ~~5a — `spreadsheet.ts`, `formula.ts` und `excel.ts`~~ · erledigt

Drei Dateien, zehn Typen mehr im Sammelpunkt `index.ts`.

**Erst gemessen, dann getippt** — und das Messen war die Arbeit. `formula.ts`
beschreibt, was `laufzeit.js` wirklich zurückgibt: sechs Werttypen, zwei
Ergebnisformen, und bei `ok: false` immer `wert: ''`. Beim Messen kamen
**drei Fehler** heraus, die niemand vermutet hatte — das Semikolon als
Trennzeichen gab es nicht, `2e6` ergab 2, und `check('')` widersprach
`run('')`. Alle drei behoben.

**Die Fehlerwert-Entscheidung steckt in den Typen, nicht in einem Satz.**
`FormulaValue` enthält **keinen** `FormulaErrorCode`, `CellValue` schon. Damit
kann der Spreadsheet-Block später `#DIV/0!` zeigen, ohne dass eine einzige
bestehende Datenbankspalte ihr Ergebnis ändert. Stünden die Fehlerwerte in
`FormulaValue`, müsste jeder Aufrufer damit rechnen — und genau das hat
niemand beschlossen.

**`spreadsheet.ts` ist die einzige Datei im Ordner, die eine Absicht
beschreibt statt eines Zustands.** Ihr Kopf sagt das ausdrücklich: solange
der Block nicht gebaut ist, darf sie ohne Messung geändert werden — danach
nicht mehr.

**Und ein Befund im Vorbeigehen:** `register/formeln.js` bringt 82
beschriebene Einträge mit, `laufzeit.js` meldet danach **180 weitere ohne
Satz** an. 262 Einträge, 180 davon stumm. `was` ist deshalb im Typ
freiwillig — nicht aus Bequemlichkeit, sondern weil es die Wirklichkeit ist.

**Neu: `test108`** hält die Typen gegen die laufende Maschine. `tsc` prüft
sie nur gegen sich selbst; ein Typ, der etwas Schöneres behauptet, ist dort
grün. Genau so sind die vier erfundenen Feldnamen entstanden.

---

## Phase 6 · Erste sichere Migrationen · **erledigt**

Nur kleine, DOM-freie Helfer. **Nicht zuerst:** `editor.js` ·
`steuerung.js` · `indexdb.js` · `bauen.mts` · `server/kern.ts`.

### ~~6a — Kennungen~~ · erledigt

`src/core/helpers/ids.ts` → `quell/core/helpers/ids.js`.

Erste Datei mit vollständig englischer Schnittstelle: aus `Kennungen.lang()`
wurde `Ids.long()`. Vertretbar, weil gemessen nur **fünfzehn Aufrufe in drei
Dateien** — nicht die verbotene Massenumbenennung, sondern der Fall „im
Rahmen einer geplanten Migration".

Verhalten nachweislich unverändert; `test85` prüft alle acht Funktionen,
`test105` hält `.ts` und erzeugtes `.js` zusammen.

### ~~6b — Datum, Objekte, Bytes~~ · erledigt

`date.ts` · `objects.ts` · `bytes.ts` → `quell/core/helpers/`.

**Gezählt, bevor umbenannt wurde** — das ist der Schritt, den E27 verlangt:

| Modul | in `quell/` | in Prüfläufen | Schnittstelle umbenannt? |
|---|--:|--:|---|
| `Datum` | 1 (`pruefen.js`) | 9 | ja → `Dates` |
| `Objekte` | 0 | 9 | ja → `Objects` |
| `Bytes` | 6 (3 Dateien) | 2 | Name blieb, Methoden englisch |

**Verhalten nachweislich unverändert.** Alte und neue Fassung wurden
nebeneinander geladen und über dieselben Eingaben geschickt: 1923 · 1488 · 72
Vergleiche, kein einziger Unterschied. Bei `date` waren die Eingaben die
teuren — beide Zeitumstellungstage, 31. Januar, Schaltjahr, Jahreswechsel,
kaputte `Date`-Objekte. Bei `bytes` Puffer bis 1 000 000 Bytes, also über die
Klippe bei 128 000 hinweg, an der die alte Spread-Fassung brach.

**Eine Regel kam dabei dazu:** eine migrierte Datei lässt **keinen Alias
unter dem alten Namen** zurück. `test85` prüft jetzt ausdrücklich, dass
`Datum` und `Objekte` als globale Namen weg sind. Ein zurückgelassener Alias
wäre bequem und würde genau deshalb dafür sorgen, dass niemand die
Aufrufstellen nachzieht — bis der Alias eines Tages verschwindet und es still
bricht.

### ~~6c — Bremse und Melder~~ · erledigt

`throttle.ts` · `reporter.ts` → `quell/core/helpers/`.

| Modul | in `quell/` | in Prüfläufen | Schnittstelle |
|---|--:|--:|---|
| `Bremse` | 0 | 5 | → `Throttle` |
| `Melder` | 17 (10 Dateien) | 6 | → `Reporter` |

**Verhalten gemessen:** 17 bzw. 22 Abläufe verglichen, kein Unterschied. Bei
den Bremsen mit einer **gefälschten Uhr** für beide Fassungen — sonst hinge
das Ergebnis am Rechner und nicht am Code.

**Zwei Dinge blieben absichtlich deutsch:** die Stufennamen `spur` `info`
`warnung` `fehler` (sie stehen so in der ausgegebenen Protokolldatei) und die
Feldnamen eines Eintrags (`stufe` `wo` `text` `daten` `wann`) — sie sind die
Form eines Datensatzes, den `all()` nach aussen gibt.

**`Tempo` ist ausgesetzt**, nicht vergessen: es greift vierzehnmal ins DOM
und fällt damit nicht unter „kleine, DOM-freie Helfer". Es gehört zu dem
Schritt, der die Bereiche in `dienst` und `ansicht` trennt.

### ~~6d — Säubern~~ · erledigt

`src/core/security/sanitize.ts` → `quell/core/security/sanitize.js`.
Zehn Aufrufe in drei Dateien, siebzehn in Prüfläufen. Aus `Saeubern` wurde
`Sanitize`.

**Nicht unter `helpers/`, sondern unter `security/`** — weil es kein Helfer
ist. Was hier schiefgeht, ist fremder Code im Ursprung der Seite, mit Zugriff
auf alle Notizen und den KI-Schlüssel.

**Das machte zwei Erweiterungen nötig, und die zweite war die wichtigere.**
`tsconfig.bauen.json` schloss nur `src/core/helpers/**` ein, und `test105`
sah auch nur dort nach. Ein neuer Ordner wäre also gebaut worden, ohne dass
irgendetwas ihn prüft — oder gar nicht gebaut worden, während sein veraltetes
`.js` weiterläuft. `test105` sieht jetzt alles unter `src/core/` ausser den
Typen **und meldet jeden Ordner, der im Bauplan fehlt**.

**Verhalten gemessen** — 362 Vergleiche zwischen alter und neuer Fassung,
beide in derselben Browserseite geladen, kein Unterschied. Die Sammlung von
dreissig Angriffen daraus steht jetzt dauerhaft in `test91` Abschnitt 6, samt
Gegenprobe: gewöhnliches HTML muss vollständig ankommen. Ein Säuberer, der
alles wegwirft, wäre sonst in allem grün.

---

## Phase 6 ist damit abgeschlossen.

---

## Phase 6e · Die Sprachregel · **erledigt**

`ENTSCHEIDUNGEN.md` **E28**: die zehn Sprachen dieses Projekts, und der eine
Satz, auf den es ankommt — **es entsteht kein neues JavaScript.**

**Warum das vorher nicht ging und jetzt geht.** Neuer Code für den Browser
musste als `.js` entstehen, weil die App ohne Bauschritt startet — und für
Node schien es keinen Grund zu geben, TypeScript zu nehmen. Nachgemessen:
**Node führt TypeScript seit 22.18 direkt aus.** Es entfernt die Typen und
startet. Damit gibt es zwei Wege, und beide kommen ohne Bauschritt aus:

| Wohin | Wie |
|---|---|
| Browser | `src/…/x.ts` → `npm run bauen:ts` → `quell/…/x.js` |
| Node | `x.mts`, direkt mit `node x.mts` |

**Durchgesetzt, nicht erklärt.** `pruefungen/js-bestand.json` führt jede von
Hand geschriebene `.js`; das Verzeichnis darf nur schrumpfen. Eine neue
`.js` macht `test109.mts` sofort rot — gegengeprobt, in beide Richtungen.

`test109.mts` ist zugleich die erste TypeScript-Datei unter `pruefungen/`
und damit der Beweis, dass der zweite Weg trägt.

**Drei Dinge, die dabei nötig waren:**

- Node-Untergrenze auf **22.18** — in `package.json` und in beiden CI-Jobs.
  Ein Lauf, der auf Node 20 an einem Syntaxfehler scheitert, zeigt in die
  falsche Richtung.
- `pruefungen/**/*.mts` in `tsconfig.json`. Node *entfernt* die Typen, es
  prüft sie nicht — ohne diesen Eintrag wären sie Zierde statt Zusage.
- `@types/node` als einzige neue Abhängigkeit. Reine Typinformation: läuft
  nie, landet nie im Browser, steht unter `devDependencies`.

**Stand beim Beschluss:** 218 Dateien JavaScript, 18 TypeScript.

```txt
quell (Produktcode)   89
pruefungen/lauf       79
pruefungen (sonst)    32
server                12
Wurzel                 4
functions              1
oeffentlich            1
```

**Was das für die nächsten Phasen heisst:** die Zahl 218 ist ab jetzt die
Fortschrittsanzeige. Jede migrierte Datei ist eine Zeile weniger in
`js-bestand.json`.

**Warum** — sie sind klein, DOM-frei und einzeln testbar. Jede migrierte
Datei nimmt einen Eintrag aus der `any`-Liste in `src/global.d.ts`.

**Fertig wenn** je Datei: englischer Name · Verhalten unverändert ·
`npm run bauen:ts` erzeugt das `.js` · `index.html` und `sw.js` nachgezogen ·
alle Läufe grün.

**Achtung** — `Saeubern` gehört zuletzt und ist der einzige der vier, an dem
Sicherheitsverhalten hängt. Aufrufer **zählen**; bei zu vielen bleibt der
öffentliche Name vorerst, und die XSS-Prüfungen laufen vor und nach dem
Umzug.

**Tests** — `npm run typecheck` · `npm run bauen:ts` · `test105` · `test87` ·
`node bauen.mts`

**Priorität** — hoch.

---

## Phase 7a · Der Tabellenkern ohne Oberfläche · **erledigt**

`src/core/spreadsheet/address.ts` und `engine.ts` → `quell/core/spreadsheet/`.
Geprüft von `test110.mts` — **68 Prüfungen in zwei Sekunden, ohne Browser.**

**Die Entscheidung, die alles andere trägt: es gibt keine zweite
Formelmaschine.** Eine Zellformel wird in die Sprache übersetzt, die
`laufzeit.js` seit jeher spricht:

```txt
=SUMME(A1:A3)   →   SUMME(prop("A1"), prop("A2"), prop("A3"))
=A1*2           →   prop("A1")*2
```

`prop()` ist der Zugriff auf eine Spalte einer Datenbankzeile; hier ist es
der Zugriff auf eine Zelle. Dieselbe Maschine, ein anderer Nachschlager. Die
Maschine zu erweitern hätte 158 Funktionen durch neuen Code laufen lassen —
die Sorte Änderung, deren Schaden man Wochen später sieht. Übersetzen kostet
dreissig Zeilen und kann nichts kaputtmachen, was es schon gibt.

**Was der Kern kann:** Adressen (`A1` ↔ Zeile/Spalte, auch `AA`, `ZZ`, `AAA`),
Bereiche in beide Richtungen (`C3:A1` = `A1:C3`), Zellen setzen und lesen,
deutsches Komma als Zahl, Abhängigkeitsgraph in beide Richtungen,
Neuberechnung in der richtigen Reihenfolge, **Zirkelbezüge mit Namen** —
nicht „irgendwo ist einer", sondern welche Zellen.

**Drei Fehler beim Bauen, alle drei vom Lauf gefunden:**

- Der Übersetzer lief dreimal über die Formel und traf im dritten Durchgang
  das `A1` **im Ergebnis des zweiten**: aus `prop("A1")` wurde
  `prop("prop("A1")")`. Jetzt ein einziger Ausdruck mit drei Zweigen — was
  ein Zweig zurückgibt, wird nicht noch einmal angesehen.
- Der Platzhalter für Zeichenketten sah selbst wie eine Zelladresse aus
  (`TXT0` — drei Buchstaben, eine Ziffer) und wurde mitersetzt. Mit dem
  einen Durchgang braucht es gar keinen Platzhalter mehr.
- **Zwei rohe Steuerzeichen** hatten sich in meine Quelle geschlichen. In der
  Einzeldatei hätten sie den ganzen Skriptblock mitgerissen — genau der
  Fehler, für den `test87` Abschnitt 1 existiert.

**Und eine ehrliche Lücke, benannt statt vorgetäuscht:** `#DIV/0!` und
`#ZAHL!` gibt es noch nicht. Die Laufzeit rechnet abwehrend (`1/0 → 0`), sie
*meldet* nichts, also kann der Kern nichts weiterreichen. Dafür bräuchte
`laufzeit.js` einen `FormulaErrorMode` — der Typ steht schon da, der Schritt
ist eigen. Ein halber Fehlerwert wäre schlimmer als keiner: er sähe aus wie
Excel und wäre es an der nächsten Zelle nicht mehr.

---

## Phase 7 · Spreadsheet-MVP

**Der Stand ist besser als erwartet:** alle elf Funktionen, die für den
ersten Wurf vorgesehen waren, rechnen bereits —
`SUMME` `MITTELWERT` `MIN` `MAX` `ANZAHL` `WENN` `UND` `ODER` `HEUTE`
`JETZT` `TEXT`. Es fehlt der **Block**, nicht die Rechenkraft.

### ~~7a — Der Spreadsheet-Block~~ · **erledigt**

**Ziel** — ein Block mit einem echten Zellraster.

**Fertig wenn** — ~~Block im Register~~ · ~~kleine Tabelle anzeigen~~ ·
~~Zellen bearbeiten~~ · ~~`A1`-Bezüge~~ · ~~Bereiche `A1:C10`~~ ·
~~automatische Neuberechnung~~ · ~~Zirkelbezüge erkennen und melden~~ ·
~~Fehlerwerte anzeigen~~

**Und darüber hinaus, weil ein Tabellenblock ohne sie keiner ist:** Zeilen und
Spalten einfügen und löschen mit nachgezogenen Bezügen · Ausfüllen über den
Anfasser · Sortieren · Spaltenbreiten · Ausgabe als `.xlsx` und CSV ·
Bedienung mit der Tastatur.

**Wo es steht** — `src/core/spreadsheet/{address,engine}.ts` (rechnet, kennt
keinen Bildschirm) · `src/bereiche/spreadsheet/ansicht.ts` (zeichnet, rechnet
nicht) · `quell/schale/stil/tabelle.css` · `DESIGN-TABELLE.md`.

**Was es hält** — `test110` (Kern ohne Browser, 111 Punkte) · `test111`
(Browser, 60 Punkte: Neustart, Speichern, Tastatur, hell und dunkel gemessen,
390 px gemessen).

**Was bewusst offen blieb** — mehrere Blätter je Block · Diagramme ·
`#DIV/0!` und `#ZAHL!` · Ziehauswahl am Telefon. Die Gründe stehen in
`ENTSCHEIDUNGEN.md` E29.

**Warum es ein eigener Block ist** — Excel und Redions Datenbanken sind zwei
verschiedene Werkzeuge: dort die Zelle, hier die Zeile als Seite. Ein
Spreadsheet-Block ist ein Block wie jeder andere und passt ohne Sonderfall in
Editor, Sicherung und `.redion`.

**Vorher zu entscheiden** — Fehlerwerte. Ohne sie kann der Block keine
anzeigen; mit ihnen ändert sich das Ergebnis bestehender Formelspalten.
Siehe `ENTSCHEIDUNGEN.md` E24, Regel 3.

**Priorität** — hoch, nach Phase 5a.

### ~~7b — Spreadsheet-Ansicht für Datenbanken~~ · **erledigt**

Als eigene Ansichtsart `raster` (🧮 „Raster") neben Tabelle, Board und den
übrigen. Dieselben Daten, die Bedienung eines Tabellenprogramms:

Pfeiltasten · Umschalt+Pfeil für Bereiche · Tab und Enter · Tippen fängt
sofort an · Entf leert einen ganzen Bereich · Strg+A · Spaltenbreiten zum
Ziehen · Summe und Anzahl in der Fusszeile.

**Und das Eigentliche:** Kopieren und Einfügen als Tabulatortext, also mit
Excel in **beide** Richtungen — und **Einfügen legt fehlende Zeilen an.** Wer
dreissig Zeilen einfügt und zehn hat, verlöre sonst zwanzig, und zwar
lautlos. Genau hier verliert Notion die Leute, die wirklich Daten haben.

**Zwei Vorsichtsmassnahmen:**

- Einfügen ist eine Massenänderung. Vorher wird nachgezählt gesagt, wie viele
  Zeilen dazukommen, wie viele gefüllte Zellen überschrieben werden und wie
  viele Werte wegfallen, weil die Spalte gerechnet wird.
- Gerechnete Spalten (Formel, Rollup, „erstellt am") sind gesperrt und dabei
  **sichtbar**. Ausblenden wäre schlechter: dann fehlte genau die Spalte,
  wegen der man hinsieht.

**Wo es steht** — `src/bereiche/datenbanken/raster.ts`.
**Was es hält** — `test112` (29 Punkte, darunter der Neustart und 390 px).

---

## Phase 8 · CSV/XLSX Import und Export · ◐ **grösstenteils erledigt**

**Reihenfolge**

- ~~CSV-Vorschau vor dem Übernehmen~~ — im Tabellenblock **und** in den
  Datenbanken. Beide sagen vorher nachgezählt, was passiert; der
  Datenbankimport nennt zusätzlich, wie viele Spalten **neu angelegt**
  werden, und legt sie erst nach der Antwort an.
- ~~XLSX-Export~~ — echte `.xlsx` aus dem Tabellenblock und aus jeder
  Datenbank.
- ~~XLSX-Import~~ — in den Tabellenblock, über `Einlesen.xlsxLesen`.
- ~~Typerkennung beim Import in eine Datenbank~~ — `core/import/spaltentyp.ts`
  erkennt Zahl, Datum, Ja/Nein und Auswahl aus den Werten selbst. Die Regel
  dabei: **lieber Text als falsch.** Eine Spalte wird nur dann eine
  Zahlenspalte, wenn JEDER gefüllte Wert eine Zahl ist — ein einziges
  „k. A." in vierhundert Zeilen macht sie zur Textspalte. Eine Zahlenspalte,
  die einen Wert verschluckt, ist schlimmer als eine Textspalte, die keinen
  verschluckt.
- **Offen:** XLSX direkt in eine Datenbank (heute geht XLSX in den
  Tabellenblock, CSV in beides) · Export mit mehreren Blättern aus einer
  Mappe · ODS.

**~~Fertig wenn~~ — ein Rundlauf mit echten Bytes: exportieren, löschen,
importieren, vergleichen.** Erledigt: `test111` baut eine echte `.xlsx`
— ZIP, CRC32, die vier Beipackzettel —, nimmt sie wieder auseinander und
vergleicht Zelle für Zelle, mit Semikolon im Feld, Anführungszeichen,
deutschem Komma, Umlaut und leerer Zeile.

**Der Fund dabei:** der bisherige CSV-Zerleger trennt bei Komma UND
Semikolon UND Tabulator gleichzeitig. Aus `Miete;1450,50;Januar` wurden fünf
Felder statt drei, und der Betrag war weg — es sah nicht nach einem Fehler
aus, sondern nach zwei Spalten mehr. `core/spreadsheet/csv.ts` erkennt das
Zeichen jetzt, ausserhalb von Anführungszeichen gezählt.

**Priorität** — der Rest: niedrig.

---

## Phase 9 · Cloudflare, Konto und Sync

**G4 — Rechte und Freigaben.** ✅ **erledigt** (6. August, E35):
Veröffentlichen nimmt keine Unterseite mehr mit, die Kommentarrolle darf
wirklich kommentieren, und eine Marke mit `lesen` darf lesen (beide
Abgleichswege sind POST — das Tor las daraus „schreibt"). Widerruf in
seinen drei Formen geprüft, und eine offene Seite macht keinen Anhang
öffentlich. `test121`, 24 Punkte. Offen bleibt: Rechte je Datenbankzeile
und zeitlich begrenzte Freigaben — beides eigene Entscheidungen, siehe L8.

**~~G1 — Konto-Modus.~~** ✅ **erledigt** (6. August, E34): Anmelden ist
nicht mehr Zustimmen — der Schalter `wolkeAbgleich` trennt „nur lokal"
von „lokal + Abgleich", die Oberfläche fragt ausdrücklich, `test120`
beweist am echten Server: ohne das Ja bleibt er leer. Abmelden warnt und
lässt die Notizen da; Konto löschen räumt die volle Server-Kaskade und
verlangt die abgetippte Mail; „Alles als .redion sichern" steht daneben.
**Offen bleibt** der Cloud-Arbeitsbereich als eigenes Konzept (mehrere
Bereiche in der Oberfläche wählen und anlegen) — siehe L7.
**Regel:** lokale Daten werden **nie** ohne ausdrückliche Zustimmung
hochgeladen (E1). Das Tor steht in `abgleichen()`.

**~~G2 — R2 für Dateien.~~** ✅ **erledigt** (6. August, E33): Server-Wege
in `server/dateien.ts`, Client-Abgleich in `maschine.ts` Abschnitt 6b —
Metadaten in D1, Bytes in R2, Rechte je Seite, verschlüsselt wie die
Sätze. Geprüft von `test119`, `test118` Abschnitt 3 und `test113`
Abschnitt 8 (der umgedrehte Stolperdraht). Vier benannte Reste stehen in
`LUECKEN.md` L6, allen voran: lokales Löschen wandert noch nicht zum
Server, und `.redion` in R2 fehlt.
**Regel:** grosse Dateien gehören nicht in D1 (E2).

**~~G3 — Sync-Konflikte.~~** ✅ **erledigt** — `test113` (Zusammenführung,
ohne Browser), `test78` (zwei Geräte gleichzeitig), `test118` (offline und
Wiederverbinden, gegen den echten Prüfserver).

Geprüft: ~~derselbe Block geändert~~ · ~~Konflikt wird sichtbar~~ ·
~~keine Daten verloren~~ (sieben Fälle, jeder gegen dieselbe Frage: *steht
am Ende die eine oder die andere Fassung da — oder ist ein Konflikt
gemeldet?*) · ~~die Ausgangsschlange~~.

**Der Fund dabei, und er ist der Grund für diese Reihenfolge:** `zuSchicken`
filtert mit `edited <= marke`, und die Marke wandert nach jeder Runde auf den
Zeitstempel des letzten gesendeten Satzes. Lägen zwei Sätze in **derselben
Millisekunde** und fiele der Schnitt der Runde zwischen sie, wäre der zweite
ab sofort ausgeschlossen — für immer. Er stünde auf dem Gerät und käme nie in
der Wolke an. Kein Fehler, keine Meldung.

Von Hand passiert das nie; beim Einfügen aus Excel, beim CSV-Import und bei
Vorlagen entstehen Sätze in Reihe. Eine Runde zerschneidet jetzt keine
Millisekunde mehr.

**Erledigt am 6. August:** `test118` läuft gegen den echten Prüfserver mit
zwei Chromium-Geräten. „Änderung offline": das Wiederverbinden stösst jetzt
**selbst** einen Abgleich an — vorher zeigte der `online`-Handler nur einen
Toast, und wer offline schrieb, wartete bis zu zwei Minuten auf den Takt.
„Anhänge bleiben verbunden": die dateiId überlebt den Abgleich auf beiden
Geräten, die Bytes bleiben auf dem Ursprungsgerät Byte für Byte unversehrt —
und gehen weiterhin ausdrücklich **nicht** mit (das ist G2; `test113` und
`test118` halten es fest, damit niemand seine Bilder für abgeglichen hält).

**Dabei gefunden:** `/sync/runter` rechnete Marke und `mehr` aus dem
Durchgelassenen statt aus dem Gelesenen — wer viele fremde Seiten vor sich
hatte, bekam `marke = seit`, `mehr = false`, und die eigenen Sätze dahinter
**nie**. Behoben; `test118` Abschnitt 4 wacht darüber, und die Gegenprobe
(beide Fixes kurz zurückgenommen) machte genau die vier erwarteten Punkte
rot.

**Damit ist G3 abgeschlossen.** Es bleiben G1 (Konto-Modus) und G2 (R2 für
Dateien).

---

## Phase 10 · Mobile und iPhone · ◐ **begonnen**

Fokus: iPhone 13 Pro Max (428 px), Safari.

**Gemessen statt geschätzt** — bei 428 px, mit `bilder.mts` und einer
Messung im Browser. Was dabei herauskam:

| | Befund |
|---|---|
| ✓ | Die letzte Zeile jeder Seite ist erreichbar — `#scroll` hat 86 px Platz, die Leiste ist 57 px hoch. Das hatte ich zuerst für kaputt gehalten und **am falschen Element gemessen**. |
| ✓ | Die Knöpfe der unteren Leiste sind 83 × 48 px. |
| ✓ | Die Tabelle und das Raster rollen waagerecht, statt zu quetschen; `env(safe-area-inset-bottom)` ist in Gebrauch; die ganze App rollt **nicht** seitlich. |
| ✗→✓ | Die Zeilen im aufgeklappten Menü waren 33 px hoch. Jetzt 48 — das ist die Liste, mit der man durch die ganze App navigiert. |
| ✗→✓ | Die Symbolknöpfe der Kopfleiste waren 28 px hoch. Jetzt 44. |

**Und ein Fehler, den ich dabei selbst gemacht habe:** Der erste Versuch gab
den Kopfleisten-Knöpfen auch `min-width: 44px`. Acht Knöpfe zu 44 px sind
352 von 390 Pixeln — der **Seitentitel war weg**. Die Skill sagt beides
(„56 px hoch, mit kurzem Seitentitel" und „keine sieben Buttons im Header"),
und eine Kopfleiste ohne Titel ist schlimmer als eine mit schmaleren
Knöpfen: man weiss dann nicht mehr, wo man ist. In einer waagerechten Leiste
ist die Höhe die wichtigere Hälfte.

**Noch offen** — nichts mehr aus dieser Liste; was Mobile grundsätzlich
fehlt, steht in `LUECKEN.md` L10.

**Dateiimport und Offline-Hinweise, nachgesehen am 6. August (390 px):**
Beides gab es schon — aber der Offline-Streifen lag AUF der unteren Leiste,
sein ✕ war 17 × 20 px, das Import-Blatt bot „Ganzen Ordner einlesen" an
(können Telefon-Browser nicht) samt Zieh-Hinweis (zieht auf einem
Touchscreen niemand), und die Rundgang-Einladung verdeckte das offene
Blatt. Alles behoben; `test114` Abschnitte 6 und 7 gehen seither wirklich
offline und öffnen den Import wirklich.

**Am 6. August nachgemessen (390 px):** Kopfleiste 56 px, die
Symbolknöpfe der Seitenleiste 44 × 44, die Seitenzeilen 48 px — alle drei
früheren Punkte sind erledigt. Die Blocksteuerung ersetzt am Telefon das
lange Drücken (`pwa.ts`). Die Messung mit echten Touch-Ereignissen fand
dabei einen Fehler, den kein Direktaufruf je gezeigt hätte: der Klick, den
der Browser dem Loslassen hinterherschickt, traf den Menü-Grund und schloss
das eben geöffnete Menü sofort wieder. Behoben; seither drückt `test114`
Abschnitt 5 wirklich lange und wacht darüber.

**Der Umbau zur Telefon-Schale, 6. August (E37, E38).** Redion ist ab jetzt
zuerst eine Telefon-Seite. Was dabei gebaut wurde:

| | |
|---|---|
| ✓ | **Oben fünf Wege** statt einer Kopfleiste: R · Start · Seiten · Termine · Eingang. Die Kreise sind 52 px, die Leiste hat `env(safe-area-inset-top)`. |
| ✓ | **„Seiten" statt „Chats"** (E38) — der Platz gehört dem, was man täglich tut. Die KI bleibt unten als „KI fragen" und im R-Blatt als „KI und Verlauf". |
| ✓ | **Das R-Blatt** — der Kreis links oben zog vorher die Seitenleiste des Rechners auf 390 px zusammen. Jetzt ein Blatt über den ganzen Bildschirm, zwölf Zeilen zu 56 px. |
| ✓ | **Unten die feste Leiste**: Suche · KI fragen · Neue Seite, Knöpfe 56 px, 28 px Rand. |
| ✓ | **Der Start-Bereich** öffnet am Telefon ohne Adresszusatz — vorher stand da die zuletzt offene Seite. |
| ✓ | **Der Fehlerbalken** sagt nicht mehr „bitte melde mir diesen Text", wenn es keinen gibt (E36); derselbe Fehler ergibt einen Balken statt zehn, und alle landen im Protokoll. |
| ✓ | **Erinnerungen** schlagen die Ortszeit vor, nicht die Weltzeit; ein Kalendereintrag bringt seine Zeit mit; Mitternacht wird 08:00; eine verpasste sagt „Verpasst um HH:MM". |
| ✓ | **Die obere Leiste passte nicht.** Gemessen bei 390 px brauchte sie 421 px mit „Eingang" — die letzte Pille stand ausserhalb des Bildes. Unter 420 px rücken Rand, Abstand und Polster zusammen; die Tasten bleiben 52 px. |
| ✓ | **Der Codeblock zeigte etwas anderes, als dastand.** ⧉ № ↩ und die Sprachwahl lagen quer über der ersten Zeile. Jetzt eine eigene Kopfzeile darüber, Knöpfe 44 px. |
| ✓ | **Ein Rand für die ganze App.** `#page` stand am Telefon auf 18 px, während der Start-Bildschirm daneben mit 28 gebaut war. Jetzt beide 28 (22 unter 380 px). |

**Noch offen am Telefon:** Termine und Eingang haben ihren eigenen Aufbau
noch nicht bekommen, die übrigen Menüs sind noch keine Bottom Sheets, und
der Editor braucht seinen Feinschliff. Steht in `LUECKEN.md` L10.

**Priorität** — hoch (E37: das Telefon ist der Normalfall).

---

## Phase 11 · Nocturne, Zugang und Grenzen · ◐ **grösstenteils erledigt**

Redurs Entwurf für die Telefon-App, dazu zwei Lücken, die beim Bauen
obenauf lagen. Die Entscheidungen stehen einzeln in `ENTSCHEIDUNGEN.md`
E42–E53; hier nur, was daraus wurde.

**Aus dem Entwurf gebaut** (E42–E50, E55): der Reiter „Mehr" und der Bereich
dahinter · der Kompass als Seite darin · eine eigene Farbwelt mit
nachgerechneten Kontrasten statt Notions Palette · drei Bewegungsdauern und
drei Kurven, keine Federn · Berührungsrückmeldung · das Blatt „Neu
erstellen" hinter dem Stift · das KI-Fenster als Blatt von unten ·
Ladeskelette statt Kreisel · versetzt einblendende Listenzeilen · die
Suchfilter als Marken · die gleitende Reiterpille · eine 56-px-Leiste
oben, deren Höhe nur noch an einer Stelle steht · und der
Willkommensbildschirm, der als Erstes sagt, wohin die Daten gehören.

**Zwei Lücken dazu:**

`L12` **Barrierefreiheit** (E51). Sie stand seit Monaten auf „Grundlagen
da, nicht geprüft". Gemessen waren zwei der fünf Punkte in Ordnung und
drei nicht. Der grösste Fund: an 106 Stellen baut Redion Überlagerungen,
und keine davon war für ein Vorleseprogramm ein Dialog, keine nahm den
Fokus auf, aus zweien lief Tab hinaus, und keine gab den Fokus zurück.
Repariert an EINER Stelle. Dazu: null Überschriften auf einer Seite mit
Titel und Überschrift, ein Fenstertitel, der immer „Redion" hiess, und
Meldungen, die kein Vorleseprogramm hörte.

`L11` **Grenzen für Agenten** (E52). Der einzige Eintrag mit „es gibt
keine Grenzen". Notausschalter, Tageslimit und Bestätigung vor jeder
ändernden Handlung — und die Regel, die in der Liste fehlte und die
wichtigste ist: **ohne Aufsicht nur lesen**.

`L15` **Bedingte Formatierung** (E53) im Tabellenblock: zehn Arten,
Farbverlauf und Balken. Offen bleiben Symbolregeln und „überfällig".

**Aus dem Entwurf ist damit alles gebaut** — zuletzt die Zustandswechsel
der Sicherungskarte (E57) und die Einstellungen als zwei Seiten statt zwei
Spalten (E58). Bei 390 px war das die schlechteste Seite der App: für den
Inhalt blieben 129 Pixel.

**Tests** — `test114` (119) · `test126` (22) · `test127` (20) ·
`test128` (46) · `test129` (26) · `test130` (48) · `test131` (44).
Dazu `test114` selbst: aus 85 Punkten sind 137 geworden.

**Priorität** — hoch, solange das Telefon der Normalfall ist.

---

## Phase 12 · Web Push · **erledigt** (8. August, E54)

**Ziel war** — `LUECKEN.md` L33 schliessen: ist Redion um acht Uhr
geschlossen, soll um acht Uhr trotzdem etwas passieren. Steht.

**Der Stand.** Die Hälfte im Browser steht seit dem 7. August (E40): das
Dienst-Skript zeigt Meldungen über `registration.showNotification()` und
nimmt den Tipp darauf entgegen. Was fehlt, ist das Wecken von aussen — und
das geht nur mit Web Push: Schlüsselpaar (VAPID), Anmeldung je Gerät, ein
Dienst, der zur richtigen Zeit sendet.

**Die Entscheidung, die vor dem Bauen fällt: der Stoss ist LEER.**

Ein Web Push kann Inhalt mitbringen. Er müsste dann verschlüsselt werden
(aes128gcm) — aber das ist nicht der Grund, ihn wegzulassen. Der Grund ist:
**der Text einer Erinnerung geht Redions Server nichts an.** „Zahnarzt
14:00" ist genau die Sorte Satz, die local-first schützen soll.

Also trägt der Stoss nichts. Er sagt nur „wach auf". Das Dienst-Skript liest
daraufhin die fälligen Erinnerungen aus der lokalen IndexedDB und zeigt sie.
Der Server erfährt einen **Zeitpunkt** und sonst nichts — kein Titel, kein
Ort, keine Seite.

```txt
Gerät   →  „weck mich am 2026-08-09 um 06:00 UTC"   (nur die Zeit)
Server  →  zur Zeit: ein leerer Stoss an dieses Gerät
Gerät   →  liest lokal nach, was fällig ist, und zeigt es
```

Das ist zugleich die einfachste Bauform: kein Payload heisst keine
Verschlüsselung, nur die VAPID-Signatur (ES256, kann Web Crypto in Workers).

**Was zu bauen ist**

```txt
server/schema.sql     Tabelle `weckrufe`: geraet, endpunkt, p256dh, auth,
                      wann, konto — und ein Index auf `wann`
server/cloudflare.ts  POST /push/anmelden   Anmeldung eines Geräts
                      POST /push/wecken     Zeitpunkt eintragen/ändern
                      DELETE /push/abmelden
                      scheduled()           jede Minute: was fällig ist,
                                            stossen und den Eintrag löschen
server/sicherheit/    VAPID: Schlüssel aus den Secrets, JWT signieren
src/dienst/sw.ts      `push`-Ereignis → fällige Erinnerungen lokal lesen
                      und zeigen
src/bereiche/wissen/  Anmeldung anbieten, wenn Erinnerungen erlaubt sind
```

**Fertig, und geprüft** — ein Gerät meldet sich an · ein Zeitpunkt kommt in
die Tabelle · der geplante Lauf stösst ihn · das Dienst-Skript liest lokal
nach und zeigt, was fällig ist · ein abgelaufener Endpunkt (410) wird
gelöscht statt endlos wiederholt · und **kein Erinnerungstext verlässt das
Gerät**.

**Drei Fehler beim Bauen, alle drei vom Lauf gefunden:** die Argumente von
`feldText` standen vertauscht, womit jedes Gerät „geraet" hiess und zwei
verschiedene Telefone einander fanden · `geraet` hat die Feld-Vorgabe
„Unbekannt", eine fehlende Kennung wäre damit ein gültiges Gerät gewesen ·
und das Prüf-Token brauchte `sit_` davor, sonst kam 401 und es sah nach
einem kaputten Weg aus.

**Tests** — `test131` (Suite 95), 44 Punkte, gegen den echten Kern mit
einem `fetch`, das jeden Stoss mitschreibt statt ihn zu senden. Die
VAPID-Unterschrift wird mit dem öffentlichen Schlüssel nachgerechnet.

**Achtung, zwei Dinge**

Auf dem iPhone zeigt nur die **installierte** App Systemmeldungen (ab iOS
16.4). Das steht schon im Dialog; die Anmeldung darf dort nicht so tun, als
ginge es auch in Safari.

Und ohne Server bleibt alles, wie es ist. Web Push ist eine Zugabe des
Cloud-Modus, keine Voraussetzung (CLAUDE.md §22): wer nur lokal arbeitet,
bekommt seine Erinnerung weiterhin beim nächsten Öffnen, mit „Verpasst um
HH:MM".

**Priorität** — mittel. Der Nutzen ist gross, aber die Zahl der Menschen,
die Redion installiert und einen Server betreibt, ist heute klein.

---


---

<a id="auftrag"></a>

## Wo der grosse Auftrag steht

Der Stand aller 60 Abschnitte steht in **`doku/AUFTRAG-STAND.md`** — mit
Belegen, nicht mit Absichten. Drei Zeichen: ✅ gebaut und geprüft, ◐ gebaut
und teilweise, ✗ offen, ? gebaut und nie laufen gesehen.

Diese fünf standen hier als „die nächsten Arbeiten", und alle fünf sind
inzwischen erledigt:

```txt
§37/§38 Elektro ansehen           test211 läuft
§22 Whiteboard fertig machen      L54, E144
§23 Vorschlagsmodus               E145 — war schon gebaut
§39 OCR entscheiden               L53, E150 — Dienst liegt bei
§28 Suche verbreitern             L55, E147
```

**Was jetzt oben liegt.** Hier standen zuerst drei Punkte, und zwei davon
waren beim Nachsehen längst erledigt — ZIP64 seit E39, die Migration seit
dem 6. August mit einer leeren `js-bestand.json`. Es bleibt einer:

1. **Cloudflare wirklich aufsetzen** (L5–L8, Phase 9). Server, Konto und
   Sync sind geschrieben und geprüft, aber nie gegen echtes D1/R2 gelaufen.
   Solange das so ist, ist „optionaler Server" eine Absicht, keine Aussage.
   Das braucht Zugangsdaten und ein Konto — es ist der einzige verbliebene
   Punkt, den kein Prüflauf im Container erledigen kann.

Alles andere in LUECKEN.md ist entweder gebaut oder mit Begründung bewusst
nicht gebaut. Das heisst nicht, dass Redion fertig ist — es heisst, dass die
Liste ehrlich ist.

---


---

<a id="vision"></a>

## Die Visionskarte · 28. August 2026

> Redur: „Ich wollte so etwas machen, das mich Jahre begleitet — dass ich
> kein Word, Excel, PowerPoint mehr brauche. Es sollte meine Schule alles
> begleiten: Noten, Lernen, Lernziele. Und PDF bearbeiten, Fachzeichnen,
> Elektrotechnik-Simulator — und Notion, GoodNotes, Graphy, Obsidian,
> alles dort haben. Und natürlich mehr."

Dieser Satz ist der Massstab. Neun Leser haben ihn am 28. August gegen den
Bestand gemessen — streng: nur was in `src/`, `quell/` oder
`pruefungen/lauf/` belegbar ist, zählt als „kann"; jede Zeile unten hat im
Messprotokoll einen Dateipfad oder einen grün gelaufenen Prüflauf hinter
sich. Die Karte sagt für jede Säule zwei Dinge: **was Redur heute trägt**
und **was zuerst fehlt**.

**Word — trägt für die Schule.** Editor mit Formatierung, fünf Schriften
und Grössen je Block, Drucken/PDF (test182), A4-Blatt mit Papiervorlagen
und Dokumentmodus (test212), DOCX in beide Richtungen mit eigenem
ZIP-Schreiber (test49). Ehrlich: DOCX transportiert in beide Richtungen
nur Klartext-Struktur — `**fett**` steht in Word wörtlich da, Bilder
werden Platzhaltertext, und der Import hat als einziger Einlese-Weg
keinen Prüflauf (→ L72). Beim Drucken fehlen Seitenzahlen, Kopf- und
Fusszeile — für abzugebende Berichte der sichtbarste Unterschied.

**Excel — trägt für die Berufsschule.** Tabellenblock mit A1-Bezügen,
255 Formelfunktionen mit deutschen Namen, XLSX/ODS mehrblattfähig in
beide Richtungen mit echten Bytes geprüft (test110: 191 ok, test165/168/
171/198), Zellformate machen die Rundreise, CHF und Schweizer Zahlen,
bedingte Formatierung, Pivot, Zielwertsuche. Ehrlich: ein Diagramm oder
eine Pivot **aus einem Zellbereich** geht nicht (nur aus Datenbanken),
verbundene Zellen und Zellkommentare fehlen.

**PowerPoint — trägt den Vortrag, nicht die Abgabe.** Vollbild-Vortrag
aus jeder Seite (H1/H2/Trennlinie = neue Folie, Marp-Prinzip), mit A4-
Blättern, Tabellen und Formeln auf der Folie (test183, test35). Ehrlich:
`.pptx` kommt im ganzen Bestand nicht vor (→ L69), das Folienlayout kennt
keinen Export (Druck druckt die Seite, nicht die Folien), keine
Referentenansicht, keine Vortragsvorlage in der Galerie.

**Schule — trägt zur Hälfte.** Prüfungszentrale mit Countdown (test208),
Schulstruktur per Vorlage „Ausbildung" (test202), seit E241 Noten mit
gewichtetem Schnitt, Zeugnisnote und Zielrechner (test249 — der Leser sah
den Stand noch uncommitted; Prüflauf, E241 und Einzeldatei sind
inzwischen da). Ehrlich: hinter dem Knopf „Stundenplan" steht kein
Stundenplan (→ L70), die Zeugnisnote mittelt ohne Semesterfilter alle
Noten aller Zeiten (→ L71), Hausaufgaben mit Fach-Bezug und Lernziele je
Fach gibt es nicht — nur das tägliche Karten-Ziel.

**GoodNotes — trägt den Kernfall.** PDF einlesen, mit dem Stift
beschreiben (Druckstärke, Formen, Textanmerkung, Undo), Original bleibt
Byte für Byte, Papiervorlagen in Blattmassen, Striche lagestabil, PDF-
Text durchsuchbar, Ausschnitt als Karteikarte, beschriftet drucken — fünf
Prüfläufe grün (test174/177/181/207/242). Ehrlich: der Stift-Feinschliff
fehlt — kein Lasso (nur Rechteck-Auswahl), der Radierer löscht nur ganze
Striche, Handschrift-zu-Text braucht den localhost-Dienst, und PDF-Export
geht nur über den Druckdialog.

**Notion — trägt für einen Lernenden.** ~60 Blockarten, Slash-Menü,
13 gerenderte Datenbank-Ansichten (zwei mehr als Notion: Raster, Pivot),
35 Spaltentypen, Relationen/Rollups, 158 Formeln ohne eval (test106:
177 ok), Kommentare, Erwähnungen, Sync mit E2E-Verschlüsselung und
Konfliktzusammenführung (test113: 53 ok). Ehrlich: als Team-Werkzeug
nicht — kein Live-Tippen, @Person ist faktisch Text, Teilen braucht den
selbst aufgesetzten Server. Und im Datei-Sync wandert lokales Löschen
nicht zum Server (L6 — als Datenintegritätslücke die wichtigste Zeile
dieser Karte).

**Fachzeichnen + Elektro-Simulator — trägt nachweislich.** 106 Symbole
nach IEC/EN 60617 mit Schweizer Bestand, Schaltplan-Editor mit drei
Planarten, echte Knotenpotentialanalyse, die die Wheatstone-Brücke
besteht, 183 rechenbare Formeln, Formelbuch mit eigenen Skizzen aus
denselben Fachzeichen, erzeugte Übungen mit Schweizer Notenskala — vier
Prüfläufe, 318/318 (test238/239/241/244). Ehrlich: die Simulation ist
Gleichstrom, eingeschwungen, linear — Wechselstrom (X_L, X_C, cos φ)
lässt sich rechnen, aber nicht im Plan simulieren; Zeitrelais verzögern
nicht; die Prüfungssimulation hat keine Uhr; nur 16 von 183 Formeln
haben einen Schritt-für-Schritt-Weg in Worten.

**Obsidian — trägt die verlinkte Wissensbasis.** Wikilinks mit Alias,
Blockverweise, Rückverweise und unverlinkte Erwähnungen unter jeder
Seite, Graph mit Kräfte-Layout, #Tags mit Tagwolke, Vault-Export als ZIP
mit Frontmatter und verlustfreiem Wiedereinlesen (test219: 31/31).
Ehrlich: Obsidians „der Vault IST der Ordner" gibt es nicht — der
Ordner-Abgleich schreibt nur in eine Richtung, ohne Rücklesen; der Graph
zeigt nur den Teilgraphen um eine Seite; Rückverweise haben keinen
eigenen Prüflauf.

**Graphy/Diagramme — trägt den Schulalltag.** Diagramm-Ansicht mit
Gruppierung, Zeitstufen und Drilldown (test52: 27/27), Dashboard mit
KPI-Kacheln über fremde Datenbanken (test237: 61 ok), Pivot mit Prozent
und CSV, Whiteboard mit 12 Werkzeugen und PNG-Export (test209: 55/55).
Ehrlich: keine zweite Datenreihe (gestapelt/gruppiert), kein XY-/
Streudiagramm — für einen Elektro-Lernenden das naheliegendste: die
U-I-Kennlinie aus der Messreihe geht nicht. Und der Chart-Block kann
seine Datenbank-Quelle lesen, aber keine Oberfläche kann sie setzen.

### Was aus der Karte oben liegt

Nach §46 zuerst die Datenzeile, dann nach Gewicht und Aufwand:

1. ~~**L6 · Datei-Sync-Grabsteine**~~ — GESCHLOSSEN am 29. August (E249,
   test256 mit echtem Server und zwei Geräten). Beifund: das
   Block-Vorbild ist selbst undicht → L73.
2. **L71 · Zeugnisnote je Semester** — ab dem zweiten Semester zeigt die
   Kernzahl der Noten-Ansicht sonst einen falschen Wert. Das Datum je
   Note ist schon da, es fehlt nur der Filter.
3. **L70 · Echter Stundenplan** — Wochenraster mit Lektionen; Unterbau
   (Termine, Kalender, ICS-Wiederholungen) ist vorhanden.
4. **Kleine Pflichten (§30) — alle fünf erledigt am 28./29. August:**
   ~~Prüflauf für den DOCX-Import~~ (E245, test252 — L72 Teil 2, die
   Formatierung, bleibt offen), ~~Prüflauf für Rückverweise/unverlinkte
   Erwähnungen~~ (E246, test253), ~~Quellen-Wähler im Chart-Block~~
   (E247, test254), ~~Seitenzahlen/Kopfzeile beim Drucken~~ (E244,
   test251), ~~Prüfungs-Timer im Elektro-Arbeitsplatz~~ (E248, test255).
5. **Die grossen Sichtbaren:** .pptx-Export (L69), Lasso im Stift,
   Wechselstrom-Simulation, XY-Diagramm, Zwei-Wege-Ordner-Abgleich,
   ~~Hausaufgaben und Lernziele je Fach~~ (E256, test262 — 29. August).

Nichts davon ist eine Wette — jede Zeile stammt aus dem Messprotokoll
vom 28. August und hat dort ihren Beleg.

### Nachtrag: Redurs Zielbild-Poster, Punkt für Punkt

Am Abend des 28. August schickte Redur ein Poster: sein Zielbild als
Bildschirm-Entwurf, elf Abschnitte von „Übersicht & Vision" bis „Weitere
Funktionen". Sechs weitere Leser haben die Poster-Punkte gemessen, die
die neun Säulen oben nicht abdecken. Das Ergebnis in drei Körben:

**Steht schon, mit Prüflauf.** Reiter oben mit Neuer-Tab-Knopf und
Strg+Tab (test46), geteilte Ansicht neben- und übereinander (test206),
Inhaltsverzeichnis-Block (test44), Fassungsvergleich mit Wort-Diff
(test48), HTML-Export (test182), mehrere PDFs gleichzeitig in Reitern,
echtes SM-2 wie Anki (nachrechenbar dieselbe Formel), Lückentext-Karten
mit `{{...}}`, Lernstatistiken, Tagesjournal per Strg+Shift+J (Daily
Notes), Audio-Aufnahme mit Zeitmarken und Notiz-Verknüpfung (test202),
Datenvalidierung für Datenbank-Spalten (Pflicht, Regex, Zahlbereich,
Statusübergänge).

**Gebaut, aber versteckt — reine Sichtbarkeitsarbeit.** Benachrichtigungen
(Posteingang mit Gelesen-Status, aber keine Glocke oben), Sync-Status
(Maschine meldet alles, sichtbar nur im Wolke-Dialog), Konto/Profil
(vollständig, aber nur über die Befehlspalette erreichbar). Alle drei:
Aufwand klein, Logik liegt fertig da.

**Fehlt wirklich, nach Hebel geordnet.**
· *Klein:* Suchfeld in der Graph-Ansicht; Rendering-Gleichstand der
  Karteikarten (Lernwelt zeigt nur esc(), die klassische Ansicht kann
  Mathe); Folien-Übergänge; ~~Kopf-/Fusszeilen + Seitenzahlen im Druck~~
  (gebaut am selben Abend: E244, test251).
· *Mittel:* Zellvalidierung im Tabellenblock (Muster liegt in den
  DB-Prüfregeln fertig); Folien-PDF-Export; Multiple-Choice-Karten im
  SM-2-System (der Elektro-Generator zeigt die Bausteine); Bild und
  Audio auf der Karteikarte; Referentennotizen; Namensmanager;
  Notenverlaufs-Kurve als gelieferte Ansicht; Pomodoro/Lernzeit echt
  messen statt schätzen; Formen-Erkennung beim Zeichnen; Tab-Gruppen;
  2FA am Server.
· *Gross:* Fussnoten; Zitieren mit Literaturverzeichnis; Sparklines;
  Mindmaps; Lineal/Geodreieck; Masterfolien/Designs; englische
  Oberfläche (der Schalter existiert, steht bewusst aus).

Zwei Punkte aus dem Poster sind seit demselben Abend GEBAUT statt offen:
die Zeugnisnote je Semester (E242) und der echte Stundenplan (E243).

---


---

<a id="boegen"></a>

## Die Bögen E272–E379

* E272 Phase A (Inventar): doku/PREMIUM-SHELL-MATRIX.md angelegt — jeder
  Bandeintrag, jedes Modul, jeder Schalenknopf mit seinem künftigen Ort.
  test272 neu, 40 Punkte auf Port 9050, vier Gegenproben im Lauf und fünf
  von Hand einzeln rot gesehen. Dabei gefunden und behoben: der Knopf
  „Zeitmesser" stand seit E268 nie im Band (`kann()` prüfte das Modul statt
  einer Methode), und sein Zeichen `clock` fehlte im Symbolregister.
  Gemessen statt geschätzt: 141 Bandeinträge, nicht 108. Neue Lücken
  L85–L88.
* E272 Phase B (Marken): Gold in beiden Modi, vier Werte statt drei — der
  Entwurfston #caa85e hat auf Weiss 2,26 und taugt dort nicht einmal als
  Rahmen, deshalb `--gold-tinte` #8a6a20 (4,70 auf der Karte). Sechs Masse
  der Schale und die Schalenfläche #1b1d20 modusfrei in grund.css.
  test272 §10, 16 Punkte, vier Gegenproben rot gesehen. sw v37.
* E272 Phase C (Reiterzeile): premium.css neu, 36 px dunkle Reiterzeile in
  beiden Themen, Reiter nur als Text, Gold für den gewählten. Die grosse
  Suchbox der Kopfzeile ist entfallen (vier Wege zur Suche bleiben), samt
  ihrer Verdrahtung und ihrem CSS. einfach.css hinter einem Präfix
  abgehängt — vier der fünf alten roten Punkte aus L88 wurden dadurch grün,
  der fünfte entpuppte sich als falsches Grün (test247 misst nur 1440 px).
  sw v38.
* E272 Phase D (Band): acht Reiter statt sechs, „Werkzeuge" aufgelöst,
  „Elektro" virtuell. Die 15er-Regel mit reitereigenem „•••" — Band jetzt
  eine Zeile von 72 px (nicht 58: deutsche Namen brauchen zwei Zeilen, und
  §23 verbietet kleinere Schrift). Farben zählen nicht als Befehle.
  test272 §11 misst vier Breiten × acht Reiter; zwei Gegenproben zeigten
  zuerst blinde Prüfungen (L89). sw v39.
* E272 Phase E (Gehen): der Reiter liest aus Register.module und
  Register.navigation statt aus einer eigenen Liste — 45 Einträge. Dazu
  App.schauplatz() und das Ereignis redion:schauplatz als Grundlage der
  Kontextkante. Beide Register führen jetzt ein Feld `zeichen` mit einem
  Strichzeichen; im Band standen sonst dreizehn Emoji nebeneinander (E202).
  Eine Phase-A-Behauptung berichtigt: die fünf unsichtbaren Wege auf Platz
  `unten` sind alle Doppelungen. sw v40.
* E272 Phase G (Datei-Backstage): „Datei" ist kein Reiter, sondern eine
  Fläche mit neun Fächern — `src/schale/aufbau/backstage.ts`, jede Zeile an
  einem Dienst, den es gibt, kein eigener Erstellcode. Sie ist eine
  `.overlay`, damit `fokus.ts` Rolle, Fokusfalle und `inert` auflegt; die
  `tablist` sitzt jetzt auf `.mb-tabs` statt auf der ganzen Zeile. Drei
  Funde nur durch Hinsehen (Namensraum `bs-` doppelt → L90, „Datei" sah aus
  wie ein Reiter, ISO-Datum), Esc schliesst jetzt die oberste Überlagerung.
  L84 aufgelöst: kein Kontrastfehler, ein Messfehler — test128 liest jetzt
  Verläufe und rechnet Alpha-Schichten. sw v41.
* E272 Phase F (Kontextkante): 54 px statt 240. NEU src/register/context.ts
  (Register.kontext, das 16.) und src/schale/aufbau/context-rail.ts. Acht
  Bereiche melden sich selbst an; die Schale nennt keinen beim Namen (§5).
  Elektro und Zeichnen lesen dieselbe Registerquelle wie ihre eigene
  Ansicht. #main ist am Rechner ein Raster, die Lade liegt darin statt mit
  gerechnetem `top`. Ein Baum, nicht zwei: #tree wird in die Lade
  geschoben und zurückgestellt. Strg+\ schaltet die Kante, Strg+M die
  Lade; der Fokusmodus versteckt jetzt auch Band und Kante. Fünf fehlende
  Zeichen ergänzt. Neun Wächter mitgezogen, zwei Gegenproben rot gesehen,
  eine dritte war blind geworden. L91/L92 neu. sw v42.
* E272 Phase I+J (Zuschnitt und Aufräumen): Dokumentmodus bekommt nur Farbe
  und Mass — dunklerer Rand ums Papier, Kopf von 48 auf 40, gewählte
  Vorschauseite in Gold; document-mode.ts/marken.ts/seite.ts unangetastet.
  einfach.css gelöscht (93 Regeln, alle 93 seit Phase C wirkungslos) samt
  ihrem @import in anatomie.css. Die tote Verdrahtung hl-seiten/hl-konto
  bleibt stehen und ist als unverdrahtet markiert — sie ist die einzige
  Stelle, an der die Absicht steht, und Löschen fragt man vorher.
  Viewport-Abnahme 1440/1366/1024/768/390: kein waagrechter Überlauf,
  Kante überall 54, am Telefon aus. sw v43, Einzeldatei 7387 KB.
* E273 (Nachlauf): „Agenten" und „Besprechungen" riefen nach Phase F den
  Modus einer unsichtbaren Seitenleiste — sie öffnen jetzt Agent.panel()
  und Meeting.panel(). NEU test272 §15: jeder der 43 Wege in „Gehen" muss
  eine messbare Wirkung haben; die erste Fassung kannte nur Überlagerungen
  und meldete vier Fehlalarme. Register.module bekommt nimmZurueck, damit
  Gegenproben aufräumen können. L93 neu (Chatverlauf ohne Zuhause).
* E273 Teil B (Blockzeichen, L92): 💡 „Callout" war im Band ein gelber
  Klecks, 🖼 „Bild" im Überlauf ein leeres Kästchen — die Schrift hat das
  Zeichen gar nicht. Blockarten bekommen ein freiwilliges `zeichen` neben
  `icon`; siebenundzwanzig nennen jetzt ein Strichzeichen, die
  typografischen (¶ H₁ ☑ • 1. ▸ ❝ — ▦ ☰ ∑ ⌨) bleiben. Elf Symbole neu,
  zusammen achtzig. test86 prüft, dass jedes `zeichen` ein Symbol nennt,
  das es gibt.
* E273 Teil C (der Ort, L94–L97): sechs Bildschirme in
  ansichten/dienst.ts zeichneten sich selbst in #page, ohne zeigeSonder —
  App.schauplatz() blieb auf dem VORIGEN stehen, und die Kante zeigte
  dessen Knöpfe („Start" mit Tagesplan und Fällig). Sie gehen jetzt durch
  bildschirm(); drei Titel neu in SCHAUPLATZ_NAMEN. Erst dadurch konnten
  Kanten für posteingang (4), kalender (6), notizhefte (4), workspace (2)
  und kompass/mehr (je 3) überhaupt gezeichnet werden. Vier Bereiche
  bekommen KEINE, mit Gründen: datenbank (L95), lernen, ki, papierkorb.
  Drei Vorschläge verworfen (§8/§47). `today` war fast strichgleich mit
  `sun` und hiess an der Kalenderkante „Tagesplan", im Band „helles
  Aussehen" — jetzt ein Kalenderblatt (L97). NEU test272 §16 mit
  Gegenprobe. sw v44.
* E273 Teil D (L93): der Chatverlauf war seit Phase F am Rechner nicht mehr
  zu sehen — er stand nur in `KI.seitenleiste`, und die ist dort
  `display:none`. Er sitzt jetzt im Kopf des KI-Fensters, weil die KI kein
  ORT ist (kiPanel lässt den Schauplatz in Ruhe) und ein Kantenknopf sich
  auf nichts melden könnte. Ein Zeichner für zwei Orte: `chatBaum(ziel)`
  aus `seitenleiste` herausgelöst. Drei Emoji weniger in der Zeile (E202).
  test34 +6 Punkte. sw v45.
* E274: die untere Leiste am Telefon markierte „Heute", während man im
  Posteingang stand — sie las den Reiter der Seitenleiste, und
  `reiterWechseln('inbox')` setzt den danach auf 'start' zurück. Sie liest
  jetzt `redion:schauplatz` (nicht `App.` — test87 §3). Drei Fälle: Ort mit
  Knopf → markiert; Ort ohne Knopf → nichts; `seite`/`leer` → wie bisher der
  Reiter. Möglich erst durch E273, vorher log der Schauplatz auf sechs
  Bildschirmen. Drei Punkte in test114 zogen den falschen Hebel
  (`reiterWechseln` statt Knopfdruck) und zeigen jetzt auf den echten.
  L98 neu. sw v46.
* E275 (L98): der Posteingang und die Kante öffneten bei einem Kommentar an
  einem verschachtelten Block den ELTERNBLOCK wie eine Seite. Beide rufen
  jetzt `App.zeigeBlock(block.id)` — echte Seite, und man landet beim
  Kommentar. `data-komm` war seit jeher tot und ist weg. Wichtiger als der
  Fix: der L98-Eintrag selbst war an zwei Stellen falsch (er sagte „öffnet
  nichts", und er sagte, die Rechnung gebe es nirgends — es gibt sie
  dreimal, plus `App.zeigeBlock` seit E105). Beides stand in LUECKEN, weil
  ich geschrieben statt nachgesehen habe. test56 +4 Punkte.

* E276 (L96, L99): `meldungenAlleGelesen()` als harmloser Zwilling zum
  Leeren — es ändert ein Feld, statt wegzuwerfen; als Kantenknopf „Alle
  gelesen" im Posteingang, sichtbar nur solange etwas ungelesen ist. Und
  test105 §3: der volle Lauf typprüfte NICHT — `tsc` lief nur über
  `tsconfig.bauen.json`, und `pruefungen/` steht dort nicht drin. Ein
  Typfehler in test56.mts ging deshalb durch alle 235 Läufe auf main. Jetzt
  läuft `tsc --noEmit` über das ganze Projekt, mit Gegenprobe und einmal
  rot vorgeführt. sw v47.
* E278 (E277 Teil 1 — L87, L68): `meldeLieferant()` prüft jetzt dieselben
  Einträge wie `melde()`, dazu `nimmZurueckLieferant()`. Die Gegenprobe in
  test272 §8 wurde davon rot, weil sie genau diesen ungeprüften Weg
  benutzte — sie prüft jetzt den Prüfer und dass der Weg zu bleibt. Und
  „•••" plus Stern standen auf jedem Bildschirm, obwohl beide ohne offene
  Seite lautlos nichts tun; sie verschwinden. Dabei eine CSS-Falle:
  `.top-btn{display:flex}` schlägt `[hidden]` — `k.hidden = true` bewirkte
  nichts. test272 §17 neu, test86 +8. sw v47.
* E279 (E277 Teil 2 — L76): Eine eingespielte Sicherung ersetzt Inhalte,
  nicht die Kontoidentität des Geräts. Vorher tauschte „ersetzen" `meta`
  vollständig — wer eine fremde Sicherung einspielte, war danach als jemand
  anderes angemeldet, und der nächste Takt schickte seine Notizen in ein
  fremdes Konto. Jetzt bleiben Anmeldung, Konto, Bereich, Salz, Probe und
  die `api:`-Schlüssel; die drei Sync-Marken gehen auf null, die `basis`
  wird geleert UND für die überlebenden Grabsteine neu gesät (sonst fiele
  E254/E255 durch die Hintertür); und dann FRAGT Redion, statt eine Richtung
  zu wählen — eigener Schlüssel `wolkeNeuAbgleich`, weil ein Umdeuten von
  `wolkeAbgleich` still „nur lokal" gewählt hätte. Dazu: Zugangsdaten
  fliegen aus der offenen Sicherung und stehen im Manifest unter `fehlt`;
  Ordnerzugriff und Freigabeliste reisen gar nicht mit, weil eine Sicherung
  keine Erlaubnis mitbringen kann. Vier statt drei Zustände am Sync-Punkt
  und auf der Kontoseite. test273 neu (34, jeder Abschnitt mit Gegenprobe),
  test261 §11 umgeschrieben (21). L100 offen: beim Dazulegen bleiben die
  Marken stehen. sw v49.
* E280 (E277 Teil 3 — L86): Drei Verdrahtungen, die an nichts hingen
  (`hl-seiten`, `hl-konto` in schale.ts, `weltwechsel` in produktwelten.ts),
  plus die CSS-Leiche `#handy-unten` — rund vierzig Zeilen für eine Leiste,
  die mit E236 wegfiel. Keine Handlung geht verloren; jeder Ersatzweg
  nachgemessen. Neu `test274`: der Wächter liest ZWEI Sammelstellen, weil
  `hl-seiten` nur über `an()` und `weltwechsel` nur über `element()` läuft.
  Er muss Kommentare streichen, sonst meldet er aufgeräumte Wege als tot —
  passiert beim Schreiben zweimal, einmal davon in meiner eigenen Prüfung.
  Nebenfund: `#hl-dok` hatte keine `order`-Regel und stand nur zufällig
  richtig. Und eine Berichtigung: die Suiten melden teils mit ❌, teils mit
  ✗ — `alle.mts` liest beide, ich hatte nur eins gegrept und Redur deshalb
  eine falsche Zuordnung gemeldet. Keine Code-Lücke, ein Lesefehler.
* E281 (E277 Teil 4 — L67): `zahlWort` lag in `arbeitswelt.ts`, also in einem
  BEREICH — nach §5 durfte kein anderer ihn holen, und genau deshalb machten
  elf Dateien es weiter von Hand. Jetzt `core/helpers/plural.ts`, englisch
  benannt wie `Dates` und `Ids`. Er kann drei Dinge mehr als die naive
  Fassung: -1 ist Einzahl, `NaN` wird zum Strich statt zu „NaN Einträge",
  und eine Null-Sonderform, die ohne Angabe nicht einspringt. test275 neu
  (21, ohne Browser). Der 104-Stellen-Umbau bleibt bewusst offen (E277/§45).
* E282 (E277 Teil 5 — L77 Punkt 1, L78 Punkte 3+6): Das Regal merkt sich
  jetzt Reiter und offenes Fach (`heft:reiter`, `heft:fach`), geschrieben
  beim Wechseln und nicht beim Zeichnen — sonst setzte jeder Tastendruck in
  einem offenen Heft eine Meta-Zeile. Zwei Wächter: ein unbekannter Reiter
  und ein gelöschtes oder nicht mehr fachartiges Fach fallen auf die Wurzel,
  statt eine leere Brotkrume zu zeigen (L78 Punkt 5 macht den zweiten Fall
  real). Der Suchtext wird bewusst NICHT gemerkt. Dazu die Brücke, die L77
  seit E264 versprach: unter dem Ergebnis führt eine Zeile in die grosse
  Suche und nimmt das Wort mit (`App.suche(vorgabe)`, Anschlag am Ende) —
  bei JEDER Suche, nicht nur bei null Treffern. Und die Liste hört bei 92ch
  auf statt volle Breite zu laufen. Zwei Funde nur durchs Hinsehen: das
  Suchzeichen in der Brücke blieb leer, weil `Register.symbole.fuelle()` am
  Ende von `render()` läuft und der Tipp-Weg `render` absichtlich meidet;
  und der Satz begann mittig, weil `.rb` seinen Inhalt zentriert. test276
  neu (22). Drag&Drop und tiefe Verschachtelung bleiben offen (Redurs
  eigener Satz in E277).
* E283 (E277 Teil 6 — L85, L91): Redurs dritter Punkt war eine AUSWAHL:
  Vollbild bauen, volle Breite zusammenziehen, Zoom und Senden streichen.
  Vollbild ist gebaut (`App.vollbild`/`vollbildAn`/`vollbildGeht`, Knopf im
  Reiter Ansicht neben „Fokus" — die beiden tun Gegenteiliges: Fokus räumt
  Redions Oberfläche weg, Vollbild den Browser). Drei Fallen darin: ein
  gemerkter Zustand ginge am ersten Escape kaputt (deshalb frisch gelesen +
  `fullscreenchange`-Horcher), `requestFullscreen` gibt es auf dem iPhone
  nicht (deshalb `zeigen()`, sonst §47), und der Aufruf kann auch dort
  abgelehnt werden, wo er möglich ist (deshalb ein Satz statt einer
  Konsolenmeldung). Volle Breite lag an DREI Stellen, nicht an den zwei, die
  L85 nannte — der Schalter im selben Menü war übersehen; jetzt EIN
  `App.volleBreite(p, an?)`, die Kopfleiste über `braucht()` gebunden, damit
  ein Vergessen laut wird. Zoom und Senden sind gestrichen und werden als
  ABWESENHEIT geprüft — ein gestrichener Punkt, der später als halber Knopf
  auftaucht, ist §47. Neues Zeichen `maximize` (vier Ecken, kein Rechteck —
  ein Rechteck hiesse „Fenster" wie `panelL`/`panelR`). Dazu L91 Punkt 1
  beantwortet: die Kante bleibt fest bei 54 px, der Ziehgriff wird nicht
  gebaut und auch nicht entfernt. test277 neu, mit drei Gegenproben.
  Nachlauf im selben Bogen: der volle Lauf über E279–E282 war 239/240 grün,
  und der eine rote (test265) war kein Zufall — er hielt fest, dass
  `Notebook.oeffnen()` zur Wurzel zurückspringt, was E282 gerade umgekehrt
  hatte. Der Fund dahinter ist echt: die Darstellungswahl (Gitter/Liste)
  WIRKT im offenen Fach, stand aber nur an der Wurzel — seit das Fach das
  Neuladen überlebt, war das eine Sackgasse. Sie steht jetzt auch im Fach,
  mit `.nh-form{margin-left:auto}`, sonst rutschte sie als einziges Kind der
  Zeile nach links. Und test265 verliess sich an FÜNF Stellen still auf die
  Wurzel; alle fünf sagen es jetzt über `anDieWurzel()`.
* E284 (Redurs Punkt 5, VORGEZOGEN): Der Import hält jetzt etwas aus. Ein
  `__proto__` in einer eingespielten Sicherung funktionierte — `Object.assign`
  schreibt über `[[Set]]`, also über den geerbten Setzer, und danach gab
  `getMeta` für jeden ungesetzten Schlüssel das zurück, was in der fremden
  Datei stand: `wolkeAbgleich`, `agent:notaus`, jeder `api:`-Schlüssel. Neu
  `core/import/sicherheit.ts` (prototyplose Verzeichnisse statt einer
  Filterliste, eigener Stapel statt Rekursion, Tiefengrenze mit Meldung) und
  `core/import/validierung.ts` (liest endlich die Fassung, die der Export seit
  jeher schreibt). Beides gibt einen BEFUND zurück, keinen stillen Eingriff.
  test278 neu (37) — das erste feindliche Einspielen überhaupt; die anderen
  vierzehn Import-Prüfläufe spielen alle eine Sicherung ein, die Redion selbst
  geschrieben hat. Dabei eine Prüfung, die grün war und trotzdem falsch: sie
  hielt ein leeres `versions`-Fach für einen Hinweis auf eine abgeschnittene
  Datei — `enthaelt` spricht aber über das Format, nicht über den Inhalt.
  Vorschau, Anhangs-Transaktion und die Sicherheitskopie vor dem Ersetzen
  bleiben offen (L101). Was die Bestandsaufnahme sonst fand, steht als L102 —
  darunter zwei Dinge, die schlimmer sind als eine Lücke: der Kalender wirft
  BYDAY wortlos weg und liefert falsche Termine, und die Rechteprüfung der
  Agenten fragt die gerade offene Seite statt der, auf die geschrieben wird.
  sw v50.
* E285 (Redurs Punkt 3): `core/knowledge/rank.ts` — PageRank auf Redions
  vorhandenem Graphen. Reine Funktion, speichert nichts, jederzeit neu
  ausrechenbar; 5000 Knoten unter einer Sekunde gemessen. Zwei Dinge, die die
  abgeschriebene Fassung falsch macht: drei von vier Kantenarten sind in
  Redion GAR NICHT gerichtet (`addEdge` sortiert sie nach Kennung), und
  Sackgassen verschlucken Gewicht — die nachgebaute falsche Rechnung kommt
  auf 0,15 statt 1. Beides prüft test279 mit Gegenprobe. Dabei ein eigener
  Irrtum, der als Kommentar stehenbleibt: mein erstes §4 wollte zeigen, dass
  drei starke Zeiger sechs schwache schlagen, und mass das Gegenteil — zu
  Recht, denn „Qualität schlägt Menge" gilt erst, wenn die Wenigen wirklich
  stark sind. Und die Falle beim Bauen: `tsconfig.bauen.json` führt eine
  Aufzählung der core-Ordner, kein `**`; ein neuer Ordner muss eingetragen
  werden. test279 neu (40). sw v51.
* E286 (Redurs Punkt 1): Die Auftragsmaschine. Fach `auftraege` (Fassung 7),
  `core/jobs/modell.ts` mit den REGELN (reine Funktionen, keine Uhr — die
  Zeit kommt als Zahl herein, deshalb prüft test280 §1 die ganze
  Zustandsmaschine ohne eine Sekunde zu warten) und `kern/auftraege/` mit der
  WIRKUNG. Der Auftrag wird VOR der Arbeit geschrieben; nach einem Neustart
  setzt er beim letzten FERTIGEN Schritt an. Genau das misst §4: die Seite
  wird mitten in der Arbeit neu geladen, und der Auftrag macht bei Schritt 2
  weiter statt von vorn. Redurs Bus-Regel gilt für den zweiten Teil (kein
  Bereich kennt einen anderen), nicht für den ersten: Redions Bus kann kein
  async, keinen Abbruch, keine Reihenfolge (L102 §4) — die Maschine meldet
  darüber und steuert nicht. Die Pacht gegen zwei Tabs ist keine Feldangabe,
  sondern EINE readwrite-Transaktion; §6 misst mit zwei echten Fenstern. Der
  Versuch zählt beim NEHMEN, nicht beim Scheitern — sonst liefe ein Auftrag,
  der zuverlässig abstürzt, ewig. Ein Entwurfsfehler, den die Prüfläufe
  sofort zeigten: `auftraege` immer unter `fehlt` zu nennen machte „nichts
  fehlt" unmöglich; genannt wird es jetzt nur bei wirklich offener Arbeit.
  test280 neu (52); test85/95/96/100 auf Fassung 7 nachgezogen. Noch kein
  Bereich angeschlossen und keine Anzeige — L103. sw v52.
* E287 (Redurs Punkt 2): Die KI sagt, was sie kostet, BEVOR sie ruft.
  `core/ai/kosten.ts` RECHNET (reine Funktionen — 33 der 48 Prüfpunkte
  brauchen keinen Browser), `bereiche/ki/buch.ts` WEISS (Grenzen aus `meta`,
  Buch in `meta`, Ja oder Nein). Vier Grenzen der Reihe nach — je Aufruf, je
  Lauf, je Tag, je Monat —, jede mit 0 abschaltbar, und der Satz nennt beide
  Zahlen statt nur „nein". Geschätzt wird mit 3,6 Zeichen je Token statt 4
  (deutsche Komposita) plus 35 % Aufschlag, und geprüft wird gegen
  `hoechstens`: eine Grenze, die man im Mittel einhält, hält man in der
  Hälfte der Fälle nicht ein. Ein unbekanntes Modell wird DURCHGELASSEN und
  nicht gesperrt — die Preisliste trägt ein Datum, und eine Sperre, die bei
  jedem neuen Modellnamen zuschlägt, ist §47 von der anderen Seite. Lokale
  Modelle werden gar nicht angefasst. `stapelSchaetzen` gibt es, weil
  `embeddingsBauen` in einer Schleife ruft: 2000 Seiten sehen einzeln
  harmlos aus und kosten zusammen 2 Mio Token. Die Prüfung sitzt an EINER
  Stelle, im Wolken-Zweig von `dienst.ts`. test281 neu (48); test72 auf
  Fassung 7 nachgezogen; test280 §2 auf die E286-Entscheidung nachgezogen
  und um die Gegenprobe erweitert (55). Das Buch führt Schätzungen, keine
  gezählten Token, und es gibt keine Oberfläche dafür — L104. sw v53.
* E288 (Redurs Punkt 4): Wissenslücken. `core/knowledge/gaps.ts` FINDET
  (reine Regeln, `jetzt` kommt als Zahl herein), `bereiche/wissen/luecken.ts`
  SAMMELT und ZEIGT. Sechs Arten: Geisterverweise, mehrdeutige Verweise,
  wichtig-aber-verstaubt, offene Fragen, Inseln, dünne Themen. Die zweite
  gibt es bei BABAT-RED nicht und ist die wertvollste — Redions Auflöser
  meldet Mehrdeutigkeit seit jeher, und niemand hat je danach gefragt.
  Zugleich bekommt E285 seine erste Aufgabe: der Wissensrang war gebaut und
  von niemandem benutzt. Gegen die Falle, in die diese Sorte Funktion immer
  läuft (eine Lückenliste findet IMMER etwas — dieselbe Falle wie E284 und
  E286, diese Woche zum dritten Mal): jeder Fund trägt eine Stärke, gezählt
  wird nur, was über der Schwelle liegt, und der Schnitt je Art nennt sich
  selbst. Was das HINSEHEN fand und keine Prüfung finden konnte (§55.1):
  Markdown-Sternchen mitten im Titel, dieselbe Frage zweimal untereinander,
  und — das Wichtigste — 26 der 33 gezählten Lücken waren Zeilen, die eine
  Frage zitieren und gleich beantworten. Aus 33 wurden 10. test282 neu (57).
  Kein Escape-Griff für die anderen Overlays, kein „erledigt", und die
  Ansicht rechnet bei jedem Öffnen neu — L105. sw v54.
* E289 (Redurs Punkt 6, aus RED-KURD): Die Zahl über das eigene Können
  bekommt ihre Grundlage. `core/learning/kompetenz.ts`: die untere Schranke
  des Wilson-Intervalls statt `richtig/gesamt` (drei von drei sind 44 %,
  nicht 100 %), die Haltbarkeit `0,9 ^ (Tage/Abstand)` aus dem vorhandenen
  SM-2-Stand, und unter fünf Belegen wird GAR NICHTS behauptet — stattdessen
  steht da, wie viele Antworten noch fehlen. Übernommen aus RED-KURD ist
  genau eine Idee: die Belegzahl gehört neben den Prozentwert. Nicht
  übernommen sind die vier Fertigkeiten — für Vokabeln richtig, für Redion
  falsch. Die vorhandene `progress`-Zahl bleibt; sie misst ABDECKUNG, sagt
  das jetzt im Titel, und bekommt die Kompetenz als Satz darunter.
  test283 neu (35). Nur Karteikarten als Quelle, keine Haltbarkeits-Anzeige
  — L106. sw v55.
* E290 (L102, Redurs Punkt 10): Wiederholungsregeln, die wirklich gelesen
  werden. `verbinden/kalender.ts` las vier Teile einer Regel und warf alles
  andere STILL weg: aus `FREQ=WEEKLY;BYDAY=MO,WE,FR` wurde ein Termin je
  Woche statt drei. EXDATE und RDATE griff der Einleser nicht einmal auf —
  eine abgesagte Stunde kam bei jedem Einlesen zurück.
  `core/calendar/wiederholung.ts` liest jetzt FREQ, INTERVAL, COUNT, UNTIL,
  BYDAY (auch `2TU`, `-1FR`), BYMONTHDAY (auch von hinten), BYMONTH,
  BYSETPOS, WKST, EXDATE, RDATE — und NENNT, was es nicht versteht, aber nur
  dann. Ein Denkfehler, den der Prüflauf fand: COUNT zählt, was die Regel
  ERZEUGT; EXDATE streicht danach. test284 neu (49); §1 misst den Weg, den
  der Import wirklich geht. Keine Zeitzonen, kein VTODO, der Hinweis
  erreicht die Oberfläche noch nicht — L106. sw v56.
* E296 (L82): Ein PDF öffnet wie in GoodNotes — Doppelklick auf das Deckblatt,
  Seiten untereinander, Schreibschicht darüber. sw v60.
* E297 (L69, erste Hälfte): `core/slides/folien.ts` — die Regel, wo eine Folie
  anfängt, stand im Vortragsmodus und wäre für jede zweite Ausgabe
  abgeschrieben worden. Sie steht jetzt einmal da, und `.pptx` fällt aus
  demselben ZIP-Schreiber wie DOCX und XLSX. test293 neu (26). sw v61.
* E298: `src/core/types/database.ts` behauptete vier Felder, die es nicht
  gibt (`zielCollection`, `rollupRelation`, `rollupZiel`, `rollupArt`), und
  liess acht echte weg; `storage.ts` nannte `belegt`/`zugeteilt` statt
  `benutzt`/`verfuegbar`. Genau der Fehler, den CLAUDE.md §52.8 beschreibt —
  ein Typ ist die Stelle, an der man nachsieht statt zu raten. test294 neu
  (10) misst jetzt jedes Feld gegen den Bestand.
* E300 (Redurs Bild aus GoodNotes): Reiterzeile für offene Dokumente, am
  Telefon wie am Laptop. Ein Dokument verdrängt kein anderes mehr, der
  aktive Reiter scrollt sich selbst ins Bild. test292 neu (45). sw v64.
  Dabei L108 gefunden: `bilder.mts` hat das Telefon bis dahin ohne Tastsinn
  nachgestellt — jedes Telefonbild zeigte Griffe, die es dort nicht gibt.
* E301 (L107): Randstreifen neben der Seite („neben das PDF direkt zeichnen
  wie in OneNote"). Am Telefon wird gescrollt statt gestapelt — gestapelt
  quetschte die Zeichenschicht waagerecht zusammen, und ein Strich bei x=300
  landete bei x=207. Auf dem Bild gefunden. test295 neu (24). sw v65.
* E302 (L105 Punkt 1): Die Lücke war schon zu — `schale.ts` hat seit E272
  Phase G einen gemeinsamen Escape-Griff. Schlimmer: mein erster Wächter und
  mein erstes Modul teilten denselben blinden Fleck (`offsetParent` ist bei
  `position:fixed` immer null, und `.overlay` ist fixed) — der Prüflauf sah
  null Fenster und war grün. Modul zurückgebaut, Wächter berichtigt.
* E303 (Redurs Punkt 8): FSRS-4.5 als reiner Kern, von Hand gerechnet statt
  als Abhängigkeit (§6). Additiv: SM-2 bleibt die Vorgabe, der Übergang
  einer Karte wird im Protokoll vermerkt. Ein Fehler, den nur eine
  REIHENFOLGE-Behauptung fand: die Schwierigkeitsformel aus FSRS-5 mit den
  Gewichten von 4.5 gemischt — Note 3 und 4 landeten beide auf 1.
  test297 neu (59). sw v66.
* E304: Neun CSS-Regeln benutzten `var(--rand)` und eine `var(--hover)` —
  beide gibt es nicht. Ein ungültiges `var()` macht die GANZE Erklärung
  ungültig, also stand dort `border-top-width: 0`. Auf dem Bild gefunden.
* E305 (Redurs Punkt 11): Nur-Quellen-Modus. Die KI antwortet dann
  ausschliesslich aus den eingestellten Quellen und schweigt, wenn nichts
  passt, statt zu raten. test299 neu (19).
* E306 (Redurs Punkt 12): Beziehungsarten in der Datenbank (1:1, 1:n, n:m).
  Die Gegenrichtung wird jetzt wirklich durchgesetzt — vorher konnte eine
  1:1-Beziehung auf einer Seite mehrfach hängen. test300 neu (17).
* E307 (Redurs Punkt 9): Woher eine Zeile kommt. `herkunft: 'ki' | 'quelle'`
  am Block, als Streifen UND in Worten (§38), und sie überlebt die
  Sicherung. Kein erfundener Verlässlichkeitswert daneben. test301 neu (17).
* E308 (Redurs Punkt 7): Der Zeitbudget-Planer. Der Tagesplan rechnete
  `Anzahl × 30 Minuten` und warnte ab acht Stunden — also nie.
  `core/planning/budget.ts` verteilt jetzt ein eingegebenes Budget nach
  Fristen, mit Tagesrate statt Alles-oder-nichts, und prüft getrennt, ob die
  nächsten Tage überhaupt reichen. Diese zweite Rechnung ist die einzige,
  die redet — und sie ist die notwendige und hinreichende EDF-Bedingung,
  nicht ein geratener Schwellwert. Die Dauer einer Karteikarte wird
  gemessen (`core/learning/lerntempo.ts`), nicht geschätzt. test302 neu (64,
  darunter zweihundert Fälle gegen einen zweiten Rechenweg). sw v69.
  Auf dem Bild gefunden: zwei Punkte hintereinander, eine umbrechende
  Kennzahl, ein am Telefon abgeschnittener Titel. Neu offen: L109 (die
  Meldung unten deckt am Telefon die Knöpfe eines Fensters zu), L110
  (`durationMs` wird gelesen und nirgends geschrieben).

**Damit sind Redurs zwölf Punkte alle abgearbeitet** — 1 (E286), 2 (E287),
3 (E285), 4 (E288), 5 (E284), 6 (E289), 7 (E308), 8 (E303), 9 (E307),
10 (E290), 11 (E305), 12 (E306).
* E309 (L108 geschlossen): Neun Griffe, die es am Telefon nicht gab. Von 327
  `:hover`-Regeln machen 39 etwas sichtbar; bei neun war der Grundzustand
  ganz weg und `:hover` der einzige Weg zurück — darunter „⤢ Öffnen" in der
  Datenbanktabelle, die Werkzeugleiste eines Bildes (ein Bild war am Telefon
  unveränderlich), das Anheften einer KI-Antwort und das Zahnrad eines
  Knopf-Blocks. Alle neun haben jetzt einen `@media(hover:none)`-Zweig.
  test303 neu (16); §6 misst in der echten Seite in zwei Browser-
  Zusammenhängen — am Telefon alle neun da, am Rechner alle neun weg.
  Zwei Fehler steckten im Wächter selbst: sein Regelleser zählte
  `@keyframes` als Ende eines Medienzweigs, und seine erste Messung lief
  gegen ein selbst gebautes HTML, in dem eine nachweislich passende Regel
  ohne erkennbaren Grund nicht wirkte.
* E310 (L109 geschlossen, am selben Tag): Die Meldung unten deckte am Telefon
  die Knöpfe eines offenen Fensters zu — gemessen auf 390 × 844: Fuss
  670–789, Meldung 730–773, beide Knöpfe weg. Am Rechner nicht (Fuss
  542–604, Meldung 835–878), also steht die Regel nur im Telefon-Zweig. Der
  Toast geht dort nach OBEN statt ein Stück höher: eine vierte Zahl im
  Stapel der schwebenden Meldungen hiesse, alle Kombinationen aus vier
  Dingen zu pflegen. test304 neu (12); §5 misst, dass die Meldung oben
  wirklich zu SEHEN ist — „deckt nichts mehr zu" wäre sonst auch dann wahr,
  wenn sie gar nicht mehr erschiene.
* E311 (L110 geschlossen, am selben Tag): Die Lernzeit wird gemessen statt
  geraten. `lernwelt.ts` las `durationMs`/`dauerMs`/`durationSeconds`/
  `dauerSekunden` — alle vier schreibt niemand, die Rechnung landete also
  immer im Ersatzzweig (eine Minute je Wiederholung) und sah dabei aus, als
  benutzte sie eine Messung. Jetzt derselbe Weg wie E308, über
  `core/learning/lerntempo.ts`: dreissig Antworten im gemessenen Abstand von
  zwanzig Sekunden sind ~10 Min. statt ~30, und der Untertitel sagt
  „gemessen aus 29 Antworten" statt „geschätzt". Unter zwölf Abständen
  bleibt es bei der bisherigen Minute — dann ändert sich nur die
  Ehrlichkeit des Untertitels. test305 neu (23).
* E312 (L95 geschlossen): Die Datenbank bekommt ihre Kontextkante — sie war
  seit E272 Phase F der einzige Schauplatz ohne eigene. Fünf Griffe:
  Ansicht, Filter, Sortieren, Gruppieren, Spalten. Die drei Gründe aus L95
  sind behoben (Schauplatz, `offeneSammlung()` statt einer blossen Kennung,
  vier nicht ausgeführte Menüs), und beim Bauen kamen zwei weitere ans
  Licht: `sortMenue` hätte ohne Anker geworfen (die Kante gibt jetzt ihren
  Knopf an `tun` weiter), und `schauplatzMelden()` meldete nur bei einer
  Änderung von `App.schauplatz()` — von Seite zu Seite bleibt der „seite",
  die Kante zeichnete sich also NIE neu. Das betraf auch die PDF-Kante.
  Dazu zwei tote Selektoren entfernt (`.pdfseite`, `.blattraum` trafen nie
  etwas) und zwei neue Zeichen (`filter`, `sort`). test306 neu (21); §4
  klickt jeden Griff wirklich an, statt zu behaupten, dass er dasteht.
* E313 (L61 geschlossen): Der Deckel zeigt die Seite. Vorher stand auf dem
  Deckel eines eingelesenen PDF ein weisses Blatt mit dem Wort „PDF" — bei
  Redur die Mehrheit der Dokumente. Nicht auf dem in L61 vorgeschlagenen Weg
  (ein Vorschaubild mitschreiben), sondern auf dem kürzeren: die Seite HAT
  das Bild schon, als echte Datei (`bildDateiId`, `dateiId`).
  `Vorschau.bildDatei()` nimmt die erste in Lesereihenfolge. Keine
  Speicheränderung, keine Migration, und es kann nicht veralten — ein
  mitgeschriebenes Bild von gestern zeigt die Seite von gestern.
  test307 neu (13); §3 misst `naturalWidth` und `blob:`, also ob ein Bild
  wirklich ANKOMMT. Offen bleibt genau ein Fall: ein von Hand beschriebenes
  leeres Blatt hat keine Datei.
  Nebenbei: L64 war seit E212 erledigt, stand aber noch als offen im Titel.
* E314 (L100 geschlossen): Eine dazugelegte Sicherung erreicht den Server.
  `zuSchicken()` überspringt jeden Satz mit `edited <= marke` — richtig für
  hier Entstandenes, falsch für eine eingespielte Sicherung: wer eine von
  vor drei Monaten dazulegt, dessen Sätze sieht der nächste Abgleich NIE,
  und nirgends wird etwas rot. Nicht die Marken leeren (das hiesse
  Vollabgleich bei jedem Dazulegen), sondern eng: `wolkeNachtrag` hält die
  dazugelegten Kennungen, `zuSchicken` nimmt sie mit, Angekommenes wird
  gestrichen. Über 20 000 Sätzen steht eine Marke statt einer Liste. Drei
  Dinge kamen beim Bauen dazu: ein Fehlschlag darf nichts löschen (sonst
  derselbe Fehler eine Ebene tiefer), tote Kennungen werden gestrichen, und
  die Merkliste gehört diesem Gerät (`NUR_HIER`, wie L76). test308 neu (15)
  — mit einem winzigen Abgleich-Server im Lauf, der misst, ob die alten
  Sätze WIRKLICH ankommen.
* E315 (L72 Teil 2, bis auf die Bilder): Fett bleibt fett bis nach Word und
  zurück. Der Export schrieb den ROHEN Blocktext — in Word stand `**fett**`
  wörtlich mit Sternchen da, und wer eine Arbeit abgibt, gibt sie so ab.
  Neu `core/text/inline.ts`: ein Kern für beide Richtungen, weil zwei
  Fassungen derselben Regel auseinanderlaufen und man es erst an der
  abgegebenen Datei merkt. Der Prüflauf fand drei Dinge: die feste Breite
  fehlte in der Gegenrichtung, Word zerschneidet einen Satz in fünf gleich
  ausgezeichnete Läufe (`**a****b**`), und `w:b w:val="0"` heisst
  ausdrücklich NICHT fett. test309 neu (25). Zwei benannte Verluste
  bleiben, beide gemessen: ein Seitenverweis wird in Word zu seinem Text,
  Bilder bleiben Platzhalter.
  Und eine Prüfung, deren Name nicht mehr stimmte: test252 §3 hiess „die
  Sternchen stehen wörtlich da" und war NACH E315 immer noch grün — aus dem
  umgekehrten Grund. sw v70.
* E316 (L101 Punkt 1): Die Vorschau sagt, was sich ändert. Vor dem
  Einspielen stand „Die Datei enthält 1247 Blöcke, hier liegen 1180" — das
  sagt, wie GROSS die Sicherung ist, nicht was sie tut, und es ist die
  letzte Stelle vor einem Vorgang, der löscht. `core/import/vergleich.ts`
  liefert vier Gruppen (neu, ersetzt, gleich, verschwindet), für beide Wege
  getrennt gerechnet. Was verschwindet, wird beim NAMEN genannt — „7 Sätze
  verschwinden" beantwortet die Frage nicht, die man hat; die Frage ist
  „meine?". Und was nicht geschieht, steht nicht da: keine Null, kein Wort
  von Verschwinden beim Dazulegen. `wolkeVersion` zählt nicht mit, sonst
  wäre nach jedem Abgleich jeder Satz „geändert". test310 neu (23). sw v71.
* E317 (L101 Punkt 2): Ein fehlender Anhang wird genannt. Die Anhänge
  kommen nach der Transaktion, jeder einzeln — das bleibt so, ein grosses
  Video in einer Transaktion würde die Ablage minutenlang blockieren (§10).
  Weg musste das Schweigen daneben: zweimal `continue`, und am Ende meldete
  Redion nur, wie viele es GESCHAFFT haben. Ein Block zeigte danach auf eine
  Datei, die es nicht gibt, und niemand hatte etwas gesagt. Jetzt gibt
  `anhaengeEinspielen` `{ da, erwartet, fehlend }` zurück, nennt jeden
  fehlenden beim Namen samt Grund, und jeder Anhang steht in seinem eigenen
  `try` — ein Loch nahm vorher alle FOLGENDEN mit. Wer neunzig von hundert
  retten kann, rettet neunzig. Gegenprobe: im guten Fall kein Wort von
  Fehlen. Nebenbei gelernt, und es kostete zwei Anläufe: `App` steht
  absichtlich nicht auf `window` (src/global.d.ts), in `page.evaluate`
  erreicht man es nur beim blossen Namen. test311 neu (11). sw v72.
* E318 (L101 Punkt 4 — und damit L101 ganz): Der offene Weg wird so streng
  wie der verschlüsselte. Nachgemessen blieben von der Liste zwei Dinge, die
  wirklich übertragbar sind. Erstens: die angekündigte Bytezahl wurde nie
  gelesen. Jeder Dateisatz führt seine `groesse` mit, der offene Weg sah
  nicht hin und schrieb die tatsächliche Länge mit `zustand: 'fertig'` in
  die Ablage — ein halbes Video hiess danach vollständig. Jetzt wird die
  Differenz genannt, in einer eigenen Liste, weil „fehlt" und „kam verkürzt
  an" zwei verschiedene Nachrichten sind; übernommen wird er trotzdem (§46).
  Zweitens: `dateien.json` ging an E284 vorbei — ein blankes `JSON.parse`
  auf eine fremde Datei, deren Inhalt gleich durch `Object.assign` in die
  Ablage geht, bei geladenem Gegenmodul. Drei echte Normalfälle schweigen,
  und fünf der 18 Punkte prüfen genau dieses Schweigen. test312 neu (18).
  sw v73.
* E319 (L104): Das KI-Buch zählt, statt zu schätzen. Jeder Anbieter schickt
  am Ende die wirkliche Tokenzahl; der Strom-Leser suchte nach
  `delta.content` und warf alles andere weg — auch die Abrechnung. Verbucht
  wurde die Schätzung, und die greift bewusst zu hoch: für eine Bremse die
  harmlose Richtung, für „was habe ich diesen Monat ausgegeben" die falsche.
  `core/ai/abrechnung.ts` liest beide Dialekte (Anthropic schickt Ein und
  Aus in zwei Ereignissen, deshalb `zusammen` — und dort gewinnt der
  grössere Wert, nicht der spätere). Gebucht wird weiter zuerst die
  Schätzung, danach ERSETZT `berichtigen` sie; im `finally`, damit auch ein
  Abbruch nicht zu hoch stehen bleibt. `stream_options` geht nur an die vier
  Anbieter mit fester Adresse — „Eigener Server" ist eine fremde Adresse und
  ein 400 wäre teurer als eine ungenaue Zahl. Dazu L104 Punkt 3: die
  Preisliste sagt nach einem halben Jahr, dass sie alt ist, und schweigt
  vorher. test313 neu (25). sw v74.
* E320: Der volle Lauf war rot, und beide Funde waren echt. test290 sah, dass
  E308 das Präfix `pl-` nahm und nicht ins Verzeichnis eintrug — genau dafür
  gibt es das Verzeichnis. test51 meldete vier Abweichungen im Tagesplan, die
  alle dasselbe bedeuteten: E308 hatte die Kacheln inhaltlich UND in der
  Reihenfolge getauscht, und test51 las sie über ihre STELLE. Nachgemessen
  ist das Produkt in allen vier Punkten richtig. Die Kacheln werden jetzt
  über ihr SCHILD gelesen, dazu zwei schärfere Punkte: verplant + frei ergibt
  das Budget, und die Kachel „passt nicht mehr" gegen die gezeichnete Liste
  (nicht gegen die Überschrift daneben — die liest dieselbe Zahl, und ein
  Vergleich zweier Ausgaben desselben Ausdrucks kann nicht rot werden, L89).
  Rot-Probe gemessen: Kachel künstlich um eins erhöht → rot.
  Und was nur das Bild fand: das Budgetfeld war 479 px breit für eine
  zweistellige Zahl, weil `.finder label input{width:100%}` gegen
  `.pl-budget input{width:76px}` gewann. Sein Zwilling im Fuss sass in einem
  `span` statt einem `label` und behielt 62 px — der Unterschied im selben
  Bild machte es sichtbar. test51 41 Punkte (vorher 35). sw v74.
* E321 (L104 Punkt 1): Die KI-Grenzen sind endlich einstellbar. Das Buch gab
  es seit E287, die Griffe auch — sichtbar war nichts, und die Bremsmeldung
  endete ausgerechnet mit „Die Grenzen stehen unter Einstellungen → KI", wo
  nichts stand. Jetzt steht dort „Kosten und Grenzen" mit Monatsbetrag,
  Anbietern, vier Feldern und einem Weg zum Leeren. Die Summe nennt ihre
  Grundlage („2 von 3 Aufrufen gezählt") — möglich erst seit E319. Ohne
  Buchung kein Betrag, die Grenzen aber trotzdem einstellbar. Drei Dinge fand
  erst das Bild: „0.153 USD" mit englischem Punkt im deutschen Text (test281s
  eigene Prosa schrieb daneben längst „0,45 USD"), eine Zeile „groq — 0,00
  USD", die nichts behauptet, und am Telefon das „USD" auf eigener Zeile.
  test314 neu (20). sw v75.
* E322 (L103 Punkt 3): Was gerade läuft, sieht man auch. Die
  Auftragsmaschine meldet seit E286 jeden Schritt — zugehört hat niemand,
  und `offen()`/`abbrechen()` benutzte keine Oberfläche. §47 von der leisen
  Seite: eine Arbeit, die minutenlang läuft und über die die App schweigt.
  Jetzt ein Knopf oben rechts, der NUR erscheint, solange etwas läuft (wie
  die Glocke aus E251), dahinter eine Zeile je Auftrag mit Name, Satz,
  Balken, Stand und Abbrechen. Der Balken fehlt in zwei Fällen, und beide
  sind richtig: bei unbekannter Gesamtzahl wäre er erfunden, und bei
  „wartet" sagte er „0 % fertig", wo „hat noch nicht angefangen" die
  Wahrheit ist — das fand erst das Bild. Beim Bau kollidierte der erste
  Namensraum `auf-` mit dem der Aufgaben, wörtlich L90; das Verzeichnis aus
  E293 hat es gefangen, heisst jetzt `arb-`. test315 neu (25). sw v76.
* E323 (L103 Punkt 4): Nur ein Tab arbeitet. Die Pacht schützte gegen
  denselben Auftrag in zwei Tabs, nicht gegen zwei verschiedene —
  doppelte Last auf schwachen Geräten. Jetzt `navigator.locks` mit
  `ifAvailable`, je Takt statt als Anführerwahl: eine Wahl, die nie erteilt
  wird, hiesse „nie wieder arbeitet ein Tab". Ohne die API bleibt alles wie
  bisher. Der erste Prüflauf war rot und das Produkt hatte recht — die App
  taktet selbst alle vier Sekunden und nimmt dasselbe Schloss, der Aufruf
  von Hand verlor das Rennen. Und dann war die Messung selbst blind: mit
  ausgehängtem Schloss blieb sie grün, weil zwei unabhängige 4-Sekunden-
  Takte sich mit 160-ms-Fenstern fast nie treffen. §2b erzwingt die
  Gleichzeitigkeit und meldet ohne Schloss zwölf Überschneidungen.
  test316 neu (15). sw v77.
* E324 (L105 Punkt 2): Ein abgehakter Fund bleibt weg. Die Kennung war die
  ganze Frage — sie muss über Neuberechnungen gleich bleiben UND sich
  ändern, wenn sich der Fund ändert: wer seine Frage umformuliert, hat eine
  andere Frage. Art + Seite + Titel, normalisiert. Der Satz nennt, wieviel
  abgehakt ist, aber nur wenn es welches gibt; zurück geht immer, denn
  gemerkt wird eine Kennung und nie ein Fund. Der Haken war zuerst 71 px
  breit — dieselbe Spezifitätsfalle wie E320 und E321, beim dritten Mal als
  L111 aufgeschrieben. Und ein Kommentar, der die von E302 widerlegte
  Escape-Behauptung wiederholte, ist berichtigt. test317 neu (25). sw v78.
* E325 (L106 Punkt 2): Was zuerst auffrischen. Die Haltbarkeit wurde seit
  E289 gerechnet und genannt, aber man konnte nichts damit anfangen. Jetzt
  ein Abschnitt über dem Themenfortschritt — die Handlung über dem Bericht.
  Die Reihenfolge war die ganze Arbeit: nicht „am wenigsten haltbar",
  sondern „am meisten verloren". Und das Bild zeigte, dass auch das noch
  nicht reichte: mit roh addierten fälligen Karten stand „Deutsch, 98 %
  sitzt noch" vor „Mathematik, 81 %" — vierzehn Karten aufzufrischen, die
  noch sitzen, ist verschenkte Zeit, und die Überschrift versprach etwas
  anderes. Fällig zählt jetzt mit seinem Zerfall. Schwelle: eine ganze
  verblasste Karte, mit Fliesskomma-Toleranz, weil 10 × (1 − 0,9) eben
  0,9999999999999998 ergibt. test318 neu (18). sw v79.
* E326 (L106 Punkt 6, halb): VTODO wird gelesen, und der Streifen ist lesbar.
  Der ICS-Leser kannte nur VEVENT — wer sein Nextcloud abonnierte, bekam
  seine Termine und wusste nicht, dass Aufgaben mitgeliefert wurden. Jetzt
  eine eigene Liste mit DUE, COMPLETED, PERCENT-COMPLETE und PRIORITY;
  `COMPLETED` ist der einzige Status, der „fertig" heisst, denn `CANCELLED`
  heisst abgesagt. Geprüft wird bei VTODO auf den Titel und nicht auf den
  Anfang: eine Aufgabe ohne Frist ist gültig, ein Termin ohne Anfang nicht.
  In die Kalendertabelle kommen sie absichtlich NICHT — das wäre die
  Falschaussage, die E290 gerade abgeräumt hat; stattdessen zählt ein
  Streifen die offenen. Und dann fand das Bild zwei Dinge, die schwerer
  wogen als der Bogen: die neue `.banner.info`-Regel war TOT (es gab sie
  schon in bausteine.css, die später lädt), und die gewinnende hatte im
  dunklen Thema 3.11:1 — unter den 4.5 aus §38, während warn 6.65 und
  fehler 8.31 hatten. Jetzt 8.38. L111 zum vierten Mal. Die Prüfung mass
  zuerst „hat info einen Hintergrund" und konnte gar nicht rot werden; sie
  misst jetzt den Kontrast in beiden Themen. Dazu hing §1 an der Zeitzone
  des prüfenden Rechners — die Seite bekommt sie jetzt gesagt.
  test319 neu (26). sw v80.
* E327 (L103 Punkt 1): Der erste Bereich hängt an der Auftragsmaschine. Sie
  stand seit E286 fertig da und `Auftraege.arten()` gab eine leere Liste —
  eine Maschine, die nichts tut, ist §47 in seiner grössten Form.
  Angeschlossen ist das ZURÜCKHOLEN der PDF-Seitenbilder und nicht das
  Einlesen: das Einlesen legt Blöcke an, das Zurückholen füllt nur fehlende
  Kennungen nach, und seine Wiederaufnahme war mit `ohneBild` schon fertig.
  Der Lauf übersteht jetzt einen Neustart, zeigt Stand und Abbrechen im
  Fenster aus E322 — und zwei Tabs rechnen nicht mehr beide dasselbe. Das
  war der eigentliche Fund: der bisherige Schutz war eine Map IM TAB, und
  bei zwei offenen Fenstern blieb je Block ein zweiter Dateisatz mit
  lebendem `blockId` liegen, den `Dateien.verwaist()` nie findet. Die
  Auftragskennung leitet sich aus dem Dokument ab, also gibt es je Dokument
  höchstens einen. Vom Bild kamen zwei weitere Fehler: das Fenster zeigte
  „pdf-bilder" als Überschrift für einen Menschen (die Namensliste in der
  Schale war für fünf Arten geraten, die es gar nicht gibt — der Name gehört
  zur Art und wird jetzt beim Anmelden mitgegeben), und der Dokumentname
  verschwand nach dem ersten Schritt, weil `schritt(stand, text)` den Text
  ersetzt. Dazu zeichnet die Seite jetzt schon WÄHREND des Laufs nach,
  gedrosselt auf anderthalb Sekunden. Die Prüfung misst „weiter statt von
  vorn" an der Zahl der Dateisätze — belegt rot mit `[2,2]` statt `[1,1]`,
  während „alle vier haben ein Bild" dabei grün blieb. test320 neu (35),
  test180 §6 auf den neuen Anker gesetzt. sw v81.
* E328 (L106 Punkt 3 und 4): Geht es aufwärts? Zwei Lücken, eine Antwort —
  `fensterTage` konnte „nur die letzten 90 Tage" und niemand fragte danach,
  und es gab keinen Vergleich über Zeit. Jetzt: die letzten 90 Tage gegen
  die 90 davor, je Thema, beide Richtungen, grösste Veränderung zuerst. Der
  frühere Zeitraum entsteht durch Zurückstellen der Uhr — dieselbe Rechnung,
  kein zweiter Weg durch dieselben Daten. Dafür musste das Fenster erst nach
  OBEN schliessen: es war [jetzt−90, ∞) und liess alles durch, was danach
  kam. Mit der echten Uhr fällt das nie auf. Verglichen wird nur, was in
  BEIDEN Zeiträumen genug Belege hat, und unter fünf Prozentpunkten heisst
  es „gleich" — eine Anzeige, die immer eine Richtung zeigt, zeigt keine.
  Nicht nur Farbe: Zeichen und Zahl mit Vorzeichen stehen daneben (§38).
  Das Bild fand, dass der Satz das Thema wiederholte, das schon fett darüber
  stand — `auffrischSatz` machte es seit E325 richtig, jetzt beide gleich.
  test321 neu (28), belegt rot mit 6 statt 0. sw v82.
* E329 (L105 Punkt 4 und 5): Die Lückensuche lernt Absicht und Alter. Zwei
  schwache Fundarten, beiden fehlte eine Angabe, die es längst gab.
  „Verstaubt" kannte keine Absicht — und die Lücke behauptete, ein Feld
  dafür gebe es nicht. Gibt es: `gesperrt`, seit langem, gelesen vom Editor
  und geschaltet in den Einstellungen. Wer eine Seite gegen Bearbeiten
  sperrt, sagt „hier bin ich fertig"; sie danach zu mahnen ist eine Mahnung
  an jemanden, der schon geantwortet hat. Bei den INSELN gilt das
  ausdrücklich nicht: fertig heisst nicht auffindbar. Die dünnen Themen
  hatten die feste Stärke 25 bei einer Schwelle von 40 — sie konnten also
  nie gezählt werden, „beinahe Zierde". Jetzt entscheidet das Alter: unter
  einem Vierteljahr angefangen, darüber liegengeblieben. Der Deckel ist an
  der Insel geeicht (55) und nicht am Geist — der erste Entwurf stand bei 70
  mit der Begründung „nie stärker als ein Geist", und `staerkeGeist(1)` ist
  40. Der Prüflauf sagte es sofort. test322 neu (19), beide Zusagen belegt
  rot. sw v83.
* E330 (L105 Punkt 3): Ein Merker statt einer Maschine. Die Lücke schlug
  einen Auftrag vor — nach E327 wäre der Weg getreten gewesen. Erst
  gemessen: 173 ms bei 1763 Seiten, davon 86 % im Sammeln. Auf zehntausend
  Seiten hochgerechnet rund eine Sekunde, und eine Sekunde rechtfertigt
  keinen Auftrag mit Ablage, Takt, Fenster und Abbrechen-Knopf. Also wird
  das SAMMELN gemerkt und das Finden läuft immer — `erledigt` und die Zeit
  gehen ins Finden, ein gemerkter Befund wäre nach einem Tag falsch. Der
  eigentliche Gewinn stand nicht in der Lücke: `befund()` läuft auch nach
  jedem Haken (E324), und ein Haken ändert nur `erledigt`. 157 ms kalt
  gegen 31 ms gemerkt. Der Abdruck trägt eine SUMME aller Zeitstempel, sonst
  wäre er blind gegen zwei Änderungen in derselben Millisekunde — belegt
  rot. Gerechnet ab 2020, damit die Summe bei zehntausend Blöcken nicht die
  Genauigkeit einer Fliesskommazahl übersteigt. test323 neu (14). sw v84.
* E331 (L102 Punkt 2, zweite Hälfte): Ohne Ort zählt die Rolle. E291 hatte
  die halbe Lücke geschlossen; nachgezählt blieben vier Agentenwerkzeuge
  ohne verbindliche Prüfung, darunter zwei, die schreiben, und eines, das
  fremden Code ausführt. Der Wurzelfehler lag tiefer und stand im Kommentar
  von `darf` schon richtig: „eine Frage nach der Rolle, nicht nach einem
  Ort" — der Code antwortete trotzdem mit `true`. Solange die Startansicht
  eine Seite war, fiel das nie auf; seit E132 ist sie das Heute-Dashboard,
  und damit war der Normalfall beim Start: kein Ort, alles erlaubt, auch
  für ein Konto mit der Rolle `lesen`. Ein Kommentar, der beschreibt was
  der Code tun SOLLTE, ist gefährlicher als gar keiner. Jetzt fragt `darf`
  ohne Ort die Rolle (fünf Aufrufer, alle fünf meinen genau das), es gibt
  `darfUeberhaupt` für ortlose Handlungen, und die vier Werkzeuge prüfen
  gegen ihr Ziel. `suchen` bekam keine — `Kontext.finden` filtert seit
  jeher. test324 neu (22), zwei Mutationen belegt rot. sw v85.
* E332 (L102 Punkt 5): Ein Fach, das niemand erklärt hat. `wipe()` fragt die
  Ablage selbst, `exportAll` trug getippte Listen — ein neues Fach wäre
  gelöscht, aber nie gesichert worden. Nachgezählt: elf Fächer, sieben
  gesichert, vier mit Grund draussen; heute stimmt es, die Gefahr ist das
  zwölfte. Dynamisch sichern ginge nicht (Blobs, Filter, eigene Regeln), also
  eine Erklärung, gegen die sich die Ablage abgleicht: was in keiner Liste
  steht, landet im Manifest unter `fehlt`, mit einem Satz, der den ORT der
  Entscheidung nennt. Jedes ausgelassene Fach trägt seinen Grund daneben —
  damit der Nächste daran vorbeimuss. `enthaelt` kommt jetzt aus derselben
  Liste statt ein zweites Mal getippt zu sein. Die Prüfung legt bewusst KEIN
  echtes Fach an: das entsteht beim Bauen, und zur Laufzeit zöge es der
  laufenden App die Ablage weg (`onversionchange`). Also rechnet
  `faecherUnbekannt` über eine Liste, die man ihr geben kann — dieselbe
  Bauform, die die Datei bei der Fassungsregel schon begründet.
  test325 neu (20), belegt rot. sw v86.
* E333 (L102 Punkt 3, 6 und 7): Der Nachlauf zur Bestandsaufnahme — drei
  Funde, drei verschiedene Antworten. Der Vektorweg war toter Code und ist
  jetzt verdrahtet, aber nicht naiv: er schickt für JEDE Frage eine
  Einbettung an eine kostenpflichtige API, also ist der Schalter das
  Vorhandensein der Vektoren — wer sie gebaut hat, hat mit E287 einmal mit
  Betrag Ja gesagt. Beim Verdrahten wäre beinahe ein Leck entstanden:
  `nurSeite` achtete der Vektorweg nicht, weil ihn nie jemand rief. Toter
  Code ist nicht nur ungenutzt, sondern auch ungeprüft. Das Fehlerzentrum
  klopfte vier Feldnamen ab, die niemand schreibt — eine Karteikarte wird
  nicht getippt, sondern selbst bewertet, also heisst die Überschrift jetzt
  „Letzte Selbstbewertung". Und der fehlende KI-Chat-Limit war schon zu:
  E287 kam einen Tag nach der Bestandsaufnahme; nachgemessen statt geglaubt.
  Die Prüfung fing sich selbst zweimal: §3 suchte in der ganzen Datei und
  fand die Zeile beim Nachbarn, und der erste Mutationsversuch änderte gar
  nichts. Eine Mutation ohne Beleg, dass sie ankam, beweist so wenig wie
  eine Prüfung, die nicht rot werden kann. test326 neu (28). sw v87.
* E334 (Nachlauf zu voll7, 281/284): Ein Pflaster je Kennung deckt den
  nächsten Knopf nicht. Drei Rote, und zwei davon waren PRÜFUNGEN, die der
  Umbau blind gemacht hatte. Der echte Fehler: `#mb-auftraege` trug `hidden`
  und nahm trotzdem 44 px, weil `.mb-rechts-knopf{display:grid}` die
  `[hidden]`-Regel des Browsers schlägt. E251 hatte das für die Glocke schon
  einmal repariert — an der KENNUNG. E322 hängte den nächsten Knopf daneben,
  und der Fehler war zurück: Reitergruppe 190 → 234 px gegen 200 px Reserve,
  der gewählte Reiter lag am Telefon unter dem Klapp-Knopf. Jetzt an der
  KLASSE, gemessen 188 px. test247 wieder 106/106.
  Und die beiden Blinden: seit E327 ist `neuBerechnen` ein Auftrag, der
  SOFORT zurückkommt. test228 zählte die Bilder, bevor sie da waren; test189
  horchte auf `#toast`, wo seither nichts mehr ankommt — grün, für immer.
  Beide warten jetzt auf `JobModell.beendet`, und test189 sammelt den
  Fortschritt aus `auftrag.schritt`. Dabei fiel auf, dass meine eigene
  Behauptung falsch war: zwei gleichzeitige Klicks FINDEN einander nicht
  (beide lesen die Ablage, bevor einer angelegt hat) — es schützt die
  Kennung plus die Pacht. Der serielle Fall misst die Nachfrage jetzt
  eigens, mit angehaltener Maschine, damit er nicht an der Uhr hängt.
  NEU DAZU: test258 §9 geht über ALLES mit `hidden` und verlangt
  `display:none` — der einzige Fall der L111-Familie, für den ein billiger
  Wächter geht, weil `hidden` keine gewollte Ausnahme kennt.
  test189 38/38, test228 24/24, test247 106/106, test258 19/19. sw v88.
* E335 (L106 Punkt 8, und was darunter lag): Fünf Stunden, eine Kennung.
  Die Lücke sagte „`icsSchreiben` kann kein RRULE"; beim Nachmessen war die
  GEGENRICHTUNG kaputt. In ICS gilt `UID` für die ganze Reihe, und
  `uebernehmen` suchte die Zeile allein darüber — also fanden alle fünf
  Folgen dieselbe Zeile und schrieben nacheinander hinein. Sichtbar wurde
  es nur im einzigen Fall, für den ein Abgleich da ist: die Schule verlegt
  Mathematik von 8:00 auf 9:00, danach standen VIER Stunden auf 8:00 und
  EINE auf 9:00 — gemeldet als „5 aufgefrischt". Der Schlüssel ist jetzt
  `UID#Folgenummer` und nicht das Datum: verschiebt die Quelle die Reihe,
  ändern sich alle Daten, und aus fünf verschobenen Stunden würden fünf
  neue neben fünf alten. Dazu ein Umzugsweg über Kennung+Beginn — ohne ihn
  wäre die Reparatur der Schaden gewesen, weil jede Zeile von vorher die
  nackte Kennung trägt und alles doppelt dagestanden hätte. Offen bleibt
  L112: eine verkürzte Reihe lässt Geisterstunden stehen, weil `uebernehmen`
  grundsätzlich nichts löscht (§9, §13) — genannt statt still.
  test327 neu (30), belegt rot in beide Richtungen. test284 49/49,
  test319 26/26.
* E336 (L112, am Tag ihrer Entstehung): Was die Quelle gestrichen hat. Eine
  verkürzte Reihe liess bis eben Geisterstunden im Stundenplan stehen.
  Aufgeräumt wird jetzt — aber nur INNERHALB einer Reihe, die dieser Lauf
  wirklich geliefert hat, und in den PAPIERKORB, nicht ins Nichts: eine
  Zeile kann eigene Notizen tragen (§9, §13), und `trashBlock` kann das
  seit E208 samt Rückweg und Server (E250). Der Prüflauf hat dabei eine
  meiner eigenen Sperren erlegt: „nur Zeilen dieser Quelle" schützte gegen
  einen Fall, den es nicht gibt, und hätte ein UMBENANNTES Abo für immer
  unaufräumbar gemacht. Und eine zweite Sperre liess sich zunächst
  herausnehmen, ohne dass etwas rot wurde — sie hat jetzt den Termin, der
  sie bindet (`plan@s#raum2`, eine Raute in der Kennung). Offen bleibt ein
  gestrichener EINZELtermin: über ihn lässt sich nichts sagen, solange kein
  Abo mitschreibt, welche Kennungen es zuletzt lieferte.
  test328 neu (31), dreimal belegt rot. test327 30/30, test284 49/49,
  test319 26/26.
* E337 (gefunden neben L106 Punkt 8): Jede Stunde dauert 90 Minuten.
  `wiederholungen` nahm jeder Folge ihr Ende — auch der ersten, bei der es
  gestimmt hätte. Im Stundenplan stand jede Stunde ohne Dauer, und der
  Export gab Termine ganz ohne `DTEND` ab. Der alte Grund war ein guter:
  `DTEND` ist in einer Reihe ein absoluter Zeitpunkt und gilt nur für die
  erste Folge — ihn auf alle zu schreiben hiesse, die Stunde im Oktober
  endet im September. Die richtige Antwort steht in ICS selbst: nicht das
  Ende wiederholt sich, sondern die DAUER. Jetzt einmal bestimmt (aus
  `DTEND − DTSTART` oder aus `DURATION`) und an jede Folge gehängt.
  Die Prüfung hat sich dabei fast selbst verschluckt: „ganztägig mit
  Ortszeit rechnen" blieb in Berlin GRÜN, weil UTC-Mitternacht dort zwei
  Uhr morgens desselben Tages ist. In New York ist es zwanzig Uhr am
  Vortag. Der Abschnitt misst jetzt auf zwei Seiten.
  test329 neu (37), dreimal belegt rot. test327 30/30, test328 31/31,
  test284 49/49, test319 26/26.
* E338 (L106 Punkt 8, GESCHLOSSEN): Der Rundlauf schliesst sich. Aus einem
  wöchentlichen Stundenplan wurden beim Ausgeben vierzig Einzeltermine.
  Fünf Zeilen mit demselben `RRULE` wären schlimmer gewesen als keins — der
  Empfänger sähe fünf unendliche Reihen. Also wie ICS es vorsieht: der Kopf
  mit `RRULE`, eine gestrichene Folge als `EXDATE`, eine verschobene als
  Ersatz mit `RECURRENCE-ID`, alle übrigen gar nicht. Die Regel liegt in
  einer neuen Spalte „Wiederholung" und NUR an der ersten Folge; an einer
  alten Tabelle kommt die Spalte leer nach (§9 — eine Spalte nachtragen ist
  das einzige, was hier gefahrlos geht). `RECURRENCE-ID` musste auch
  GELESEN werden: ein Ersatz stand sonst doppelt da, einmal verlegt und
  einmal aus der Regel. Und der dreimal wörtlich gleiche Ausroll-Schritt
  heisst jetzt `ausrollenAlle`.
  Damit bleiben von L106 zwei Punkte: 1 (Karteikarten sind die einzige
  Quelle) und 5 (Zeitzonen, ausdrücklich so gewollt).
  test330 neu (35), viermal belegt rot. test329 39/39 (§6 zog mit),
  test327 30/30, test328 31/31, test284 49/49, test319 26/26.
* E339 (L106 Punkt 1, halb geschlossen): Nicht nur Karteikarten. Eine
  Prüfungssimulation ist der BESSERE Beleg — eine Karteikarte wird selbst
  bewertet, eine Simulation zählt richtig und falsch. Sie nicht mitzuzählen
  hiess, die härtere Auskunft wegzuwerfen. `core/learning/belege.ts`
  übersetzt ein Ergebnis je Thema in Belege mit Datum und Noten in
  derselben Skala. Der Kern zählt sie als Belege, aber NICHT als Karten —
  sonst stünde „20 Karten" bei zwölf, genau die stille Falschaussage, gegen
  die E289 gebaut wurde. Und der Satz nennt die Herkunft, aber nur bei mehr
  als einer Art.
  ZWEIMAL HAT DER BLICK AUF DEN FERTIGEN SATZ etwas gefunden, das kein
  Prüflauf hatte: erst zwei Klammern hintereinander, dann zwei „Davon".
  Beide sind jetzt eigene Prüfzeilen. Offen bleiben Elektro-Aufgaben und
  Lernpfad — sie heben kein Ergebnis mit Thema und Datum auf, dort ist
  zuerst das AUFHEBEN zu bauen.
  test331 neu (40), dreimal belegt rot. test283 35/35, test318 18/18,
  test281 48/48, test105 108 ok.
* E340 (L111, vierte Variante): Siebenundzwanzig Regeln, die nie zum Zug
  kamen. Nachgezählt vor dem Bauen: 45 637 CSS-Erklärungen, davon 27 tot —
  eine spätere Datei erschlägt sie bei gleichem Wähler. Darunter ein
  fünfspaltiges `.cover-gitter` mit 56px-Knöpfen, das niemand je gesehen
  hat. Alle 27 sind fort, und dass das FOLGENLOS ist, wurde gemessen statt
  behauptet: der gerechnete Stil jedes Elements in zwanzig Lagen (fünf
  Ansichten × hell/dunkel × Rechner/Telefon), 21 320 Elemente vorher gegen
  nachher — null Unterschiede. Der erste Vergleich meldete 18; es waren
  dieselben Breiten in anderer REIHENFOLGE, das Regal listet nicht in
  fester Ordnung. Jetzt als Menge verglichen.
  Dazu test332 als Wächter für das achtundzwanzigste. Er liest die CSSOM
  im Browser statt eine eigene Spezifitätsrechnung zu bauen, und er meldet
  NUR über Dateigrenzen und NUR bei verschiedenem Wert — sonst meldete er
  Dutzende gewollter Fälle. Er hat sich zweimal selbst berichtigt:
  `padding` ist vier Erklärungen, nicht eine, und §2/§3 zählten absolut
  statt den Unterschied zum Bestand.
  test332 neu (14), belegt rot. test258 19/19.
* E365 (L114 Punkt 1 erledigt): Der ZIP-Import ist ein Auftrag — die ZIP
  geht als abgeleitete Arbeitskopie in die Ablage, der Auftrag
  (`zip-import`) trägt ihre Kennung, jeder Eintrag ist ein Schritt mit
  Wiederaufsetzpunkt (Stelle, Wurzelfach, Zahlen), nach dem letzten geht
  die Arbeitskopie. Ein geschlossener Tab kostet keine Datei mehr. test357
  neu (34), belegt rot in sieben Richtungen; dabei gefunden: übersprungene
  Einträge meldeten keinen Schritt — der Fortschritt stand still.
* E364 (L78 Punkte 4 und 5, L81 Punkte 2 und 4 erledigt): Vier kleine
  Löcher — `Werkzeuge.sperren` fragt vor dem Verschlüsseln über den Bus
  (`ARTEN.seiteWirdGesperrt`), das Regal antwortet „heftArt: heft", ein
  anderswo gesperrtes Heft bleibt im Regal; ein abgeleitetes Fach wird
  beim Zeichnen als `heftArt:'fach'` gemerkt und behält seine Karte, wenn
  das letzte Heft im Papierkorb liegt; der Zeitmesser zählt wache Zeit
  (Schlaf über 30 s, verborgene Registerkarte und rückwärts gestellte Uhr
  zählen nicht) und überlebt das Neuladen (`zeit:laufend`, nachgereicht
  über `ablageGeladen`). test356 neu, belegt rot in sieben Richtungen.
* E363 (L114 Punkte 5 und 6 erledigt): Der ZIP-Leser sagt die Wahrheit —
  `ZipDetails` (Kern) rechnet CRC-32, liest CP437 und erkennt
  Verschlüsselung; beide Leser prüfen jeden Eintrag gegen seine Prüfsumme
  und werfen mit Grund, der Import stellt Beschädigtes und Verschlüsseltes
  zu den Übersprungenen; der eigene Schreiber setzt das UTF-8-Bit. Und die
  ZIP erkennt sich beim zweiten Einlesen wieder (`importKennung` aus Name,
  Grösse, Prüfsumme): nichts doppelt, „schon da (unverändert)", Geändertes
  kommt daneben. test355 neu (34), belegt rot in sieben Richtungen.
* E362 (L102 Punkt 4 erledigt): Der Ereignisbus kann async — `frage`
  zählt keine Promise (sie wird gemeldet), `frageAsync`/`meldeAsync` warten
  in Anmeldereihenfolge und melden Gescheitertes, `melde` fängt die
  Ablehnung asynchroner Zuhörer, `horche(…, {nachreichen})` reicht die
  letzte Meldung nach, `darf`/`darfAsync` als Veto. Dabei gefunden und
  behoben: das Menüband horchte auf den falschen Namen (`'ablageGeladen'`
  statt `ARTEN.ablageGeladen`) und hat nie etwas gehört. test354 neu (33,
  ohne Browser), belegt rot in sieben Richtungen. Erster Bogen, dessen
  Fassung E361 von selbst gehoben hat (v114).
* E361 (L83 Punkte 1, 2, 3 erledigt): Der Dienststand folgt dem Inhalt —
  `dienststand.mts` rechnet bei `npm run bauen:ts` einen Stempel über den
  Grundstock und hebt `VERSION` in `sw.ts` von selbst; `stand.ts` trägt
  Fassung, Stempel und Bauzeit, die App zeigt sie unter „Über diese App"
  samt Weg (Ordner, start.bat, Cloudflare); `holen.bat` fragt GitHub vor
  dem Holen, ob der Stand geprüft ist; der schnelle CI-Job prüft den
  Stempel. test353 neu (39), belegt rot in sieben Richtungen. Bild angesehen.
* E360 (L115 Punkt 6, der Text): Text wie GoodNotes — ein Tipp fragt
  mehrzeilig, der Text wird ein Kasten mit Umbruch (`breiteBox`, Zeilen aus
  `InkGeometry.textLayout`, deterministisch ohne DOM), Schriftart (die fünf
  aus E101), Stufen A−/A+, Fett und Rahmen in der Leiste (Gruppe „schrift"
  beim Text und bei der Auswahl); mit Auswahl gilt es der Auswahl, ein
  Schritt im Verlauf; der Griff zieht den Kasten breiter. Alte einzeilige
  Marken bleiben einzeilig. test352 neu (38), belegt rot in sieben
  Richtungen; test201 §4 liest den Kasten. Bilder angesehen.
* E359 (L115 Punkt 9 erledigt): Die Blattleiste am Rechner — statt fünf
  Zeilen zwei: oben die Werkzeuge, darunter nur das Zubehör des gewählten
  (die E356-Regel gilt jetzt überall), ein Zeilenbruch-Element, Wörter nach
  Breite der Leiste (`@container`, unter 1150 px nur Sinnbilder), und die
  Papierwahl als Klappe (ein Knopf, fünf Vorlagen darunter, Escape und Tipp
  daneben schliessen). 84 statt rund 220 px. test351 neu (25), belegt rot
  in sechs Richtungen; test348 §6 als Wächter der alten Entscheidung
  umgeschrieben. Bilder angesehen.
* E358 (L115 Punkt 7 erledigt): Zurück fasst nur an, was sich änderte —
  `redraw` gleicht Knoten und Marken über die gemerkte Fassung je Kennung
  ab (gleich bleibt, anders geflickt, überzählig weg, fehlend neu, Folge =
  Markenfolge); `merke` hinter jedem direkten Knotenweg. Gemessen vorher
  7/59/155 ms Zurück bei 100/1000/3000 Marken, nachher 24 ms bei 1000.
  test350 neu (14) fand die stumme Merkliste beim Verschieben; belegt rot
  in vier Richtungen. Keine Gestaltungsänderung, darum kein Bild. Nebenbei
  war test267 §6 rot, seit E355/E357 die Leiste am Rechner auf fünf Zeilen
  brachten und das Blatt unter das Fenster schoben — Prüflauf rollt jetzt
  zum Blatt; die fünf Zeilen stehen als L115 Punkt 9.
* E357 (L115 Punkt 6, das Bild): Bild aufs Blatt — Werkzeug „Bild" in der
  Leiste öffnet den Dateiwähler, die Datei geht in die Ablage (Stücke, das
  Blatt als Block), die Marke `{id, art:'bild', dateiId, pts}` zeichnet ein
  `<image>` aus der bekannten Adresse (synchron, für Druck und Folien),
  sonst einen Platzhalter „Bild fehlt"; mittig, halb so breit, im
  Seitenverhältnis, danach gewählt. Skalieren hält das Verhältnis (Umschalt
  gibt es frei), der Radierer lässt es stehen, Kopieren teilt die Datei.
  test349 neu (30), belegt rot in sieben Richtungen. Bilder angesehen.
* E356 (L115 Punkt 8 erledigt): Die Blattleiste am Telefon zeigt nur die
  Gruppen des gewählten Werkzeugs — jeder Knopf trägt `data-gruppe`, die
  Leiste `data-tool` (Tipp, Menüband, Stil- und Modus-Knopf), das CSS
  blendet ≤ 760 px die fremden Gruppen aus, stellt die eigenen per `order`
  direkt hinter das Werkzeug, und die Leiste rollt hin. 732 statt 1539 px
  beim Schreiben. Rechner unverändert. test348 neu (33), belegt rot in
  sechs Richtungen; eine siebte blieb grün und steht mit Grund in E356.
* E355 (L115 Punkt 5 erledigt): Formerkennung — ziehen, 450 ms halten, und
  der Stiftstrich wird Linie, Kreis/Ellipse oder Rechteck (`InkShapes.recognize`
  in `src/core/ink/shapes.ts`, ohne DOM und Zeit). Nur der Stift, nie der
  Marker; dieselbe Marke mit Farbe und Breite, ohne Druck und Stil. Schalter
  „Formen" in der Leiste, gemerkt in `zeichnen:formen`. test347 neu (31)
  fand die Kreis-als-Rechteck-Falle im ersten Entwurf; belegt rot in sechs
  Richtungen. Bilder angesehen.
* E354 (L115 Punkte 3 und 4 erledigt): Handballen-Schutz — nach einem
  Stift zeichnen Finger vier Sekunden nicht, sie rollen (`data-stift`,
  `touch-action`); ein Zug gehört seinem Zeiger; der Stift nimmt der
  aufliegenden Hand den Strich (verworfen, kein Schritt); ein zweiter
  Finger verwirft den Fingerzug. Im Dokument zoomen Strg+Rad und Kneifen
  über den Regler (60–180). Kein neues Markenfeld. test346 neu (31), belegt
  rot in sechs Richtungen. Kein Bild: es sieht nicht anders aus.
* E353 (E269, L115 Punkt 2 erledigt): Die Auswahl wie in GoodNotes — Lasso
  (`InkGeometry.insidePolygon`, Schlinge nur mit Fläche, sonst der Kasten),
  vier Griffe zum Skalieren um die Gegenecke (`InkGeometry.scale`, Breite
  und Schrift folgen mit dem geometrischen Mittel, Umschalt hält das
  Verhältnis), Kopieren und Einsetzen (Strg+C/V und Knöpfe, eine Ablage für
  alle Flächen, versetzt, frische Kennungen), Farbe und Strich mit Auswahl
  färben die Auswahl um, Escape hebt auf. Kein neues Markenfeld. test345
  neu (43), das L-Lasso beweist Schlinge statt Kasten, belegt rot in fünf
  Richtungen.
* E352 (Redurs Punkt 3, zweiter Bogen; L115 Punkt 1 erledigt): Der Radierer
  streicht statt zu tippen — ein Kreis am Zeiger, ein Zug ein Schritt im
  Verlauf, ein Ring beim Ziehen. Drei Arten in `zeichnen:radierer`: Ganz,
  Teil (`InkGeometry.splitByCircle` schneidet `pts` und `pressure` an den
  Schnittpunkten, das erste Stück behält die Kennung), Marker. Radierende
  und Seitenknopf eines Stifts halten den Radierer, das Werkzeug bleibt;
  die rechte Maustaste nicht. Knoten werden einzeln getauscht. test344 neu
  (49), fand beim ersten Lauf die Punktzahl-Falle, belegt rot in sechs
  Richtungen.
* E351 (Redurs Punkt 3, erster Bogen; L115 offen): Der Stift schreibt wie
  eine Hand. Drei Stifte (Füller, Kugelschreiber, Pinsel) in `zeichnen:stift`,
  der Druck wandert durchs Vereinfachen mit (`simplifyIndices` statt
  Durchschnitt), ohne Drucksensor zählt das Tempo, der Strich ist eine
  Fläche (`InkGeometry.outline`), der Marker am Lineal zieht gerade, eigene
  Farben über den Farbwähler des Browsers (höchstens vier, `zeichnen:farben`).
  Kein neues Feld, keine Migration — `pressure` gab es seit E100 und wurde
  weggemittelt. test343 neu (30), Breite mit `isPointInFill` gemessen,
  belegt rot in fünf Richtungen.
* E350 (Redurs Punkt 2, L114 offen): Eine ZIP kommt so ins Regal, wie sie
  ist. Neu `archiveImport.ts`: Ordner werden Fächer (verschachtelt,
  wiederverwendet), jede Datei ein Dokument (PDF mit Seiten und Original,
  Bild, Text, Office, sonst Anhang), stückweise über `zipLesenAusBlob`,
  Grössenwache vor dem Entpacken (Rohgrösse aus dem Verzeichnis), `..` und
  Beiwerk draussen, innere ZIP bleibt zu, Titel-Suffix statt Überschreiben,
  keine Rückfrage je PDF (Vorgabe an `alsSeiten`). Drei Einstiege: „+ Neu →
  ZIP entpacken", Ablegen im Regal (dort ging vorher NICHTS), Dateiwähler
  mit .pdf/.zip. Ein Fach ist in der Bibliothek ein Ordner, auch mit einer
  Sache. test342 neu (41), echtes Archiv, belegt rot in sieben Richtungen.
* E349 (Redurs Punkt 1, L113 geschlossen): Der Start zeigt, wo man war.
  Vier stille Löcher hinter E236: das Regal hielt einen Start, `#dokumente`
  schaltete die Startansicht ab, der Papierkorb ging wieder auf, das
  Onboarding setzte „Heute". Jetzt Marke `zuletztOrt`, Regal ohne Vorseite,
  Hash nur als Ziel wenn die Seite lebt, einmalige Rückstellung von
  „start"/„workspace", Onboarding schreibt nichts mehr; die zuletzt
  angesehene Seite eines Dokuments bleibt (`dokSeite:<id>`). test341 neu
  (37), Rechner und Telefon, belegt rot in sechs Richtungen. sw v103.
* E348 (L111, geschlossen): Die breiten Fensterregeln treffen nur noch,
  was sie meinen. Zuerst gemessen: alle 163 Befehlsfenster und 19
  Einstellungsbereiche, Rechner und Telefon, gerechneter Stil vorher gegen
  nachher — neun Fenster anders, 154 exakt gleich. `.finder input` und
  `.finder .res button` waren die Regeln für Suchfeld und Trefferzeile der
  PALETTE (in `aufbau.css`, nicht `werkzeuge.css`) und galten seit E230
  für jedes Fenster. Jetzt `.finder > input`, `:where(.finder .res) >
  button` mit (0,0,1); sechs Fenster von Inline-Stil auf gewöhnliche
  Klassen (`.btn`, `.fn-feld`, `.fn-reihe`, `.fn-aus`, `.fn-blatt`); der
  Vorbau aus E324 zurückgebaut. Gefunden dabei: ein Rand am Elektro-
  Antwortfeld, den nie jemand sah; ein 496-px-Haken im Tempo-Fenster;
  `(#2-formeln` als Schlagwort (`match(/…/g)` liefert den ganzen Treffer,
  und ein Markdown-Sprungziel ist kein Schlagwort). Vier Fallen beim
  Bauen, die schwerste: `:not([type=checkbox])` zählt wie ein Attribut —
  die Verengung war erst die STÄRKSTE Regel im Stil und machte das
  Budgetfeld aus E320 wieder 480 px breit; test51 fing es. Jetzt `:where()`.
  test340 neu (52), belegt rot in acht Richtungen. test51 41/41, test66,
  test68, test70, test71, test114, test241, test317 grün. sw v102.
* E347 (L72, der Rest vom Rest, geschlossen): Der Schaltplan kommt in der
  .docx an. Gemessen: eine Seite mit einem `schaltplan`-Block ergab in Word
  nur Titel und Beschriftung — keine Zeichnung, kein Platzhalter, keine
  Meldung. Der Block ist kein `image` und hatte im Export keinen Weg.
  Jetzt rastert Redion, was es selbst zeichnet: derselbe Zeichner wie am
  Bildschirm, PNG in doppelter Auflösung bei logischem Mass, weisser Grund.
  SVG-Dateien gehen denselben Weg; WebP bleibt Platzhalter.
  Die erste Fassung kam beim Prüflauf trotzdem als `medien: []` an — zwei
  Fallen, die nur das Zählen von Pixeln findet: ein SVG im `<img>` ist ein
  eigenes Dokument, ohne `xmlns` lädt es nicht, und `var(--text)` wird
  dort zu `none` — ein weisses Blatt ohne Fehler. `svgAlleinstehend` trägt
  beides nach; Schwarz statt Bildschirmfarbe, denn die Vorgabe ist dunkel.
  test339 neu (31), zählt Pixel, belegt rot in drei Richtungen.
* E346 (L72 Rest, geschlossen): Bilder kommen in der .docx an. Bis eben
  stand dort `[Bild]` — eine Seite mit einem Schaltplan kam als leeres
  Blatt beim Lehrer an (§13). Jetzt: Medienteile unter `word/media/`, je
  eine Beziehung, ein `Default` je Endung.
  Ein Vorlauf sammelt die Bilder vor dem Bauen (sonst hinge die Reihenfolge
  der Absätze an der Ladegeschwindigkeit), das Mass wird gemessen statt
  geraten und auf die Textspalte gestutzt, und der Platzhalter sagt jetzt,
  warum etwas fehlt.
  Das Nachmessen fand dieselbe Lehre wie bei E342s unsichtbarem Schalter:
  die Liste erlaubter Typen schützte gar nicht vor SVG (das scheitert schon
  an der Messung), sondern vor WebP — das liest der Browser und Word nimmt
  es nicht. Der Prüflauf misst jetzt den Fall, für den die Liste da ist.
  test338 neu (34), §1 Byte für Byte, belegt rot in drei Richtungen.
* E345 (L106 Punkt 6 Rest, geschlossen): Aufgaben aus dem Kalender landen
  in Aufgaben. L106 sagte, sie dürften nicht in die Kalendertabelle — der
  Einwand galt der falschen TABELLE, nicht der Sache. Redion hat ein
  Aufgabenmodell (`istAufgaben` + `aufgabenQuellen`); dorthin gehen sie.
  Zwei Dinge machen eine Tabelle zur Aufgabenquelle, und nur eines ist
  offensichtlich — ohne den Eintrag in `aufgabenQuellen` fragt „Meine
  Aufgaben" sie nie ab (§47).
  `aufgWer` wird beim Abgleich nicht geschrieben (der Mensch entscheidet),
  der Haken schon (den führt die Quelle). Und die Tabelle entsteht nur,
  wenn der Kalender wirklich Aufgaben hat.
  Dabei wurde `test319` besser, weil sie rot wurde: sie verlangte wörtlich
  `if (offeneAufgaben)` und fiel durch, als die Bedingung VERSCHÄRFT wurde.
  Sie prüft jetzt die Absicht statt den Bezeichner.
  test337 neu (24), belegt rot in drei Richtungen.
* E344 (L106 Punkt 5, geschlossen): Eine fremde Zeitzone, ganz gerechnet.
  `DTSTART;TZID=America/New_York:20260907T080000` stand in Berlin um 8 Uhr
  statt um 14 — sechs Stunden falsch, ohne ein Wort.
  L106 nannte es bewusst so, weil „eine halbe Zeitzonenrechnung schlimmer
  ist als keine". Der Satz stimmt; die GANZE Rechnung ist nur seit Jahren
  im Browser eingebaut. `core/calendar/zeitzone.ts` nutzt sie.
  Zweimal gerechnet, und das ist der Unterschied zwischen ganz und halb:
  `Intl` kann nur Augenblick → Wandzeit, gebraucht wird die Umkehrung. Wer
  den Versatz nur an der rohen Wandzeit misst, liegt in jeder
  Umstellungsnacht eine Stunde daneben — test336 §2 misst genau das.
  Outlooks Windows-Namen werden NICHT übersetzt (eine Tabelle mit hundert
  Namen wäre wieder die halbe Lösung), sondern beim Namen genannt (§35).
  Und der Normalfall schweigt: ohne TZID ändert sich nichts.
  test336 neu (33), belegt rot in vier Richtungen. sw auf notizen-v98.
* E343 (L112 Rest, geschlossen): Das Abo bekommt ein Gedächtnis. E336 hat
  die Reihen abgeräumt; für den einzelnen gestrichenen Termin stand in L112,
  dass sich „über einen Einzeltermin nichts sagen" lässt — und gleich
  darunter, was fehlte: ein Vermerk am Abo, WELCHE Kennungen es zuletzt
  geliefert hat. Genau das ist es.
  Der Gewinn ist grösser als die Frage: was von Hand angelegt wurde, stand
  nie in der Liste. Es braucht keine Heuristik, die es zu erraten versucht.
  Drei Sperren, jede nachgemessen — ohne alte Liste passiert nichts, ein
  leerer Lauf räumt nicht auf (sonst leert ein Netzwackler den Kalender),
  und nur Kennungen aus der eigenen Liste.
  Zwei Fehler lagen im PRÜFSTAND: Redions Dienst-Skript merkte sich den
  Kalender (es lässt nur Fremdes in Ruhe — ein echtes Abo liegt bei einem
  fremden Rechner, der Prüfstand serviert jetzt auf einem zweiten Tor), und
  §7 mass eine fremde Tabelle. Beide gefunden durch Messen, nicht Raten.
  test335 neu (30), belegt rot in vier Richtungen.
* E342 (L103 Punkt 5, geschlossen): Heute Nacht, am Strom, nicht über
  Mobilfunk. Die Maschine aus E286 konnte lange Arbeit überleben, aber
  nicht warten WOLLEN. `core/jobs/zeitplan.ts` rechnet (kennt weder Uhr
  noch `navigator` — die Lage kommt herein), `maschine.ts` beschafft die
  Lage, Einstellungen → Speicher stellt sie ein, und das Auftragsfenster
  sagt jetzt, WORAUF gewartet wird statt bloss „wartet".
  Die wichtigste Entscheidung fiele auf keinem Entwicklungsrechner auf:
  UNBEKANNT HEISST JA. Firefox kennt `getBattery` nicht — wer dort `null`
  als „nein" liest, baut einen Auftrag, der nie läuft.
  „Nur im WLAN" heisst nicht so: `effectiveType` misst Geschwindigkeit,
  nicht Kosten. Gemessen werden `saveData` und `cellular`.
  Drei Fehler fand erst das Bild (§55.1): unsichtbare Schalter (eine
  erfundene CSS-Klasse, 0 × 0 px), zwei „und" in einem Satz, und zwei
  Wortpaare für dieselbe Sache. §9 misst deshalb die GRÖSSE der Schalter —
  `display` blieb bei der erfundenen Klasse `inline-block`, also
  „sichtbar", und hätte den Fehler durchgelassen.
  test334 neu (55), belegt rot in fünf Richtungen.
* E341 (L75, halb geschlossen): Zwei Tabs, eine Merkliste. L75 sagte seit
  drei Tagen „KANN Einträge überschreiben" — gemessen wurde es nie, und
  beim Nachmessen war es kein „kann": zwei Seiten auf derselben Ablage
  hängen je einen Grabstein an, danach steht EINER da. Still, ohne Fehler.
  Das kostet einen Block, der lokal gelöscht ist und auf dem anderen Gerät
  weiterlebt — genau das, wogegen es die Merklisten gibt.
  `metaListeAendern` liest aus der ABLAGE, ändert und schreibt zurück, in
  EINER Transaktion; IndexedDB reiht die auch über Tabs hinweg. Gerechnet
  wird zweimal — sofort gegen den Zwischenspeicher, damit ein Lesen
  unmittelbar danach stimmt, und noch einmal in der Transaktion gegen den
  echten Stand. Der erste Wurf liess das erste weg und riss fünf bestehende
  Zusagen ein (test256, test261). Die fünf
  Schreibstellen der drei Merklisten gehen darüber. Offen bleibt der „echte
  Verbund" (jede Merknotiz ein eigener Satz) — der lohnt erst mit der
  Wolke, und die braucht Redur.
  test333 neu (16), belegt rot. §3 stellt den alten Weg nach und verlangt,
  dass er einen verliert — ohne den misst §2 nichts.

* E366 (L78 Punkt 2 zu, L114 Punkt 3 halb): Das Regal zeigt die ganze
  Schachtelung. Die Fach-Regel las EINE Ebene tief — ein Fach zählte nur
  mit einem DIREKTEN Heft darin. Bei `Schule/Physik/Mechanik/Heft` stand
  „Schule" damit gar nicht im Regal, und Mechanik, Optik, Physik,
  Mathematik lagen flach nebeneinander an der Wurzel. Verloren ging
  nichts — der Baum wusste es weiter —, und genau das machte es leise:
  nach einem ZIP-Import mit Ordnern zeigte ausgerechnet das Regal einen
  Bestand, den so niemand angelegt hat. Jetzt zählt auch ein Fach im Fach
  (rekursiv, Tiefe 12, mit Ringbremse); die Wurzel zeigt nur die obersten,
  das offene Fach seine Unterfächer, eine Brotkrume nennt den Weg und der
  Zurück-Knopf führt EINE Ebene hoch. Die Stelle, die man dabei vergisst,
  ist das Verschieben-Menü: es hing an `faecher()` und hätte ab sofort
  genau die Fächer nicht mehr als Ziel angeboten, die dieser Bogen
  sichtbar macht — es nimmt jetzt `alleFaecher()`, mit dem Weg am Ziel.
  Nebenbei ehrlich geworden: „0 Hefte" an einem Fach mit zwei Unterfächern
  heisst jetzt „2 Fächer".
  test358 neu (58), belegt rot in zehn Richtungen.

* E367 (L116 zu): Die Zahl im Bibliothekskopf ist eine Zahl, keine Decke.
  „Kürzlich verwendet" schnitt bei sechzig ab und zeigte danach die Länge
  der GESCHNITTENEN Liste — „60 Dokumente" bei 61 wie bei 900, im Regal
  „60 Seiten auf diesem Gerät". Gefunden auf einem Bild nach dem
  ZIP-Import aus E365, nicht von einem Prüflauf: eine Zahl, die immer
  dieselbe ist, ist ja eine gültige Zahl. Vor dem Bauen gemessen, ob die
  Decke überhaupt etwas schützt — der Reiter „Alle" zeichnet daneben 2013
  Deckel ohne Decke in 395 ms (linear, 0,19 ms je Deckel). Sie ist keine
  Bremse, sondern eine Bedeutung, und durfte deshalb bleiben; schweigen
  durfte sie nicht. Jetzt „60 von 313 Dokumenten", und ohne Decke steht
  die Zahl wieder allein da. Zwei Dinge gingen mit: gesucht wurde nur in
  den sechzig neuesten (ein leeres Ergebnis ist eine Behauptung, und die
  war falsch), und die Decke muss VOR der Umsortierung greifen, sonst
  wären es beim Sortieren nach Namen die alphabetisch ersten sechzig.
  test359 neu (24), belegt rot in sieben Richtungen.

* E368 (L78 Punkt 1 zu, L114 Punkt 4 zu): Ziehen und Ablegen im Regal.
  Seit E366 sieht man die Schachtelung — bewegen ging nur über „⋯ →
  Verschieben", den Weg, den GoodNotes gar nicht hat. Jetzt zieht man den
  Deckel auf das Fach, mit EINER Geste über Pointer-Ereignisse für Maus und
  Finger; HTML5-dragstart wäre am Rechner billiger und am Telefon gar
  nichts. Ziele sind ein Fach, die Brotkrume (nimmt heraus) und die freie
  Fläche; daneben abgelegt passiert nichts.

  Der lehrreiche Teil war der Finger. `touch-action:none` allein genügt
  nicht: der Browser liest es beim touchstart und hat entschieden, ob die
  Berührung ein Rollen wird, ehe die Karte 400 ms später gehoben ist —
  danach schickt er pointercancel, und am Telefon passierte schlicht
  nichts. Ein touchmove-Zuhörer mit passive:false hält die Bewegung an,
  solange etwas gehoben ist, und lässt sie vorher durch, damit die Liste
  sich weiter rollen lässt.

  Nebenbei: `Werkzeuge.verschiebe` sagte selbst schon „Verschoben" — zwei
  Sätze für eine Handlung, der uninformative zuerst. Es nimmt jetzt ein
  vorbelegtes drittes Argument, jeder bestehende Aufrufer bleibt gleich.
  test360 neu (32), belegt rot in zehn Richtungen.

* E369 (Rückfall aus E359 behoben): Die Spalte nimmt die Breite, die sie
  bekommt. Der volle Lauf auf E365 war bis auf test178 grün — und die zwei
  roten Zusagen dort waren kein zu strenger Prüfsatz: nebeneinander gelegt
  war die PDF-Seite 2 × 52 px und ihr Bild 1 px hoch, das Blatt daneben
  276 × 439. Wer eine PDF neben ein leeres Blatt legte, sah die PDF nicht.
  Zurückverfolgt auf E359 (`container-type:inline-size`), aber die eigentliche
  Ursache war älter: `.spalte` schrumpfte auf ihren Inhalt, und die einzige
  Eigenbreite darin kam von der WERKZEUGLEISTE — die Breite einer PDF-Seite
  hing an der Zahl der Knöpfe darüber. `.spalte{width:100%}` behebt es;
  danach füllen beide Spalten ihre Spur und sind gleich hoch, was E104 seit
  langem versprochen hatte. Die Eingrenzung aus E359 bleibt: ein Rückfall
  wird nicht dadurch behoben, dass man den Bogen davor aufhebt.
  test178 74/74 (vorher 72/74), test351 unverändert 25/25.

* E370 (CLAUDE.md aufräumen): 2469 → 2295 Zeilen, jeder Abschnitt mit einer
  Marke **[hart]** oder **[Richtwert]**, ein Inhaltsverzeichnis über zwölf
  Teile, und am Ende ein Zaun „Offene Fragen an Redur" für die fünf Marken,
  die Claude gesetzt hat, weil irgendetwas dastehen musste. Vier hat Redur
  am 3. September selbst entschieden (§30, §37, §46, §55.3). Berichtigt
  wurde, was nicht mehr stimmte: die elf Fächer in §9, `.mts` statt `.mjs`
  und 323 Läufe in §30/§31, die echte `tsconfig` in §52.6, das LEERE
  `js-bestand.json` in §54.4, `bilder.mts` in §55.1. §52.19 stand mitten in
  §53 und steht wieder an seinem Platz.
* E371 (L10): Die Seitenvorschau am Telefon ist ein Blatt, kein Absprung.
  `src/schale/ueberlagerung/sheet.ts` neu — Kopf zum Ziehen, drei Höhen,
  Wischen. Die Datenbank-Zeilenvorschau benutzt es statt der Desktop-Kante.
  test361 neu (44, Port 9374). Zwei Funde beim Bauen: ohne
  `setPointerCapture` misst der Zug 490 px vor und nach dem Ziehen (das
  Blatt wächst unter dem Zeiger weg), und ein Zug, der auf dem Titel
  beginnt, darf nicht schon beim Aufsetzen abgelehnt werden — er gilt erst
  nach 12 px nach unten.
* E372 (L10): Zwei Telefonmarken logen. `--mobile-topbar` sagte 46, der
  Balken misst 56; `--mobile-nav-height` sagte 56, die Leiste misst 59. Die
  falsche Zahl traf genau das Gerät, für das sie geschrieben war: am iPhone
  rechnete die Kerbenregel 46 + 47, und dem Inhalt blieben zehn Pixel zu
  wenig. test362 neu (18, Port 9383) misst die Marken gegen die echten
  Elemente statt gegen den Stil.
* E373 (L114 Punkt 7): Was ein langer Import kostet, steht vorher da.
  `src/core/jobs/estimate.ts` neu (rein, kennt keine Uhr), Messbuch in
  `archiveImport.ts`. Der Anlauf sagt „12 Dateien · 96 PDF-Seiten — rund
  9 Minuten" und SCHWEIGT unter zwanzig Sekunden; er lernt aus jedem Lauf.
  Ein Startwert ist gemessen (3,4 ms je Textdatei), zwei sind es nicht —
  das steht als L117 in den Lücken, statt als Zahl zu tun, als wäre sie
  eine. test363 neu (57, Port 9387).
* E374 (L61 Rest): Der Deckel eines handbeschriebenen Hefts zeigt, was
  daraufsteht. `src/core/ink/thumbnail.ts` neu — aus den `marken` des Blatts
  ein kleiner Umriss, ohne Datei, ohne Migration, und er kann nicht
  veralten. test364 neu (54, Port 9389). Zweimal tat die CSS-Regel nichts:
  einmal wegen Spezifität (2 Ebenen gegen 3), einmal weil eine Bearbeitung
  ein `*/` stehen liess. Beide Male fand es der Wächter, weil er die
  BERECHNETE Hintergrundfarbe misst und nicht die Klasse.
* E375 (L115 Punkt 9, Rest): Ein Formen-Werkzeug statt vier. Elf Knöpfe
  statt vierzehn auf einer Höhe; die Wahl wird gemerkt. Nach aussen heisst
  das Werkzeug weiter `line`, `arrow`, `rectangle`, `ellipse` — E375 fasst
  die KNÖPFE zusammen, nicht die Sachen. test365 neu (28, Port 9395).
  Nachtrag aus E376: `test351` wurde damals umgestellt, `test344`, `test242`
  und `test267` nicht — sie klickten weiter auf einen Knopf, den es nicht
  mehr gibt, und starben an einer Zeitschranke. Alle drei gehen jetzt den
  Weg über „Form"; gefunden, weil E376 alle Zeichenläufe zusammen gefahren
  hat.
* E376 (Redurs Auftrag „flüssiger wie GoodNotes"): Der Umriss wächst, statt
  bei jedem Zeigerereignis neu zu entstehen. Gemessen VOR dem Bauen: 484,7 ms
  Geometrie für einen Strich mit 600 Punkten, am Ende 0,774 ms je Ereignis
  und 17 kB `d` — die Zähigkeit wuchs mit dem Strich. `src/core/ink/stroke.ts`
  neu (rein): `Feder` (9,2× über den Strich, 10,1× am Ende, und ZEICHENGLEICH
  mit `InkGeometry.outline`), ein geschwindigkeitsabhängiger `glaetter`
  (Zittern 5× kleiner, 60 → 12 gespeicherte Punkte bei einem zittrigen Zug),
  ein Median-3 für den Druck und eine gedeckelte `vorhersage`, die NIE
  gespeichert wird. Dazu ein Bild je Bild statt je Ereignis. test366 neu
  (45, Port 9397).

  Zwei Dinge fanden die BESTEHENDEN Wächter, und beide wären sonst in den
  Daten gelandet: ein gleitendes Mittel auf dem Druck machte den Füller flach
  (test343), und ein geglätteter Strich endete drei Pixel vor der Stelle, an
  der die Hand abhob (test345, test346). Der Druck bekam den Median, das
  Strichende wird jetzt auf die wirkliche letzte Zeigerposition gezogen.

* E377 (nach E376 nachgemessen): Erst der Kasten, dann der Weg.
  `touchesCircle` ging bei jedem Stiftstrich sofort in die Punktschleife —
  auch bei einem Strich am anderen Seitenende. Ein schneller Radierwisch
  über 400 Striche kostete 8,27 ms je Zeigerereignis, ein GANZES Bild bei
  120 Hz; mit einem allokationsfreien Kastenfilter davor 1,00 ms. test367
  neu (19, ohne Browser), zwei Gegenproben rot. Nebenbei behoben: eine Marke
  ohne Punkte galt als am Ursprung liegend und war dort radierbar.
  Und eine Lehre: die Gegenprobe „Kasten ein Pixel zu eng" rutschte durch
  alle zehntausend Zufallsfälle und wurde nur von zwei von Hand gesetzten
  Grenzfällen gefunden.
* E378 (der grösste Rest derselben Messreihe): Der Merkzettel fürs Zurück
  klont nicht mehr, er friert ein. `snapshot()` kopierte bei jedem Aufsetzen
  des Stifts die ganze Seite — 23,4 ms je Strich auf 800 Strichen, und der
  Preis wuchs mit der Seite. Jetzt gilt: eine Marke in `marks` wird nie mehr
  von innen geändert, sondern ersetzt; dann genügt die flache Liste
  (0,56 ms beim ersten Mal, 57 µs danach), und der Vergleich in `commit()`
  bricht beim ersten Unterschied ab (11,46 ms → 1 µs). Sechs Stellen mussten
  vom Ändern aufs Ersetzen; fünf waren beim Durchsehen zu finden, **die
  sechste hat das Einfrieren gefunden** — test242 brach sofort mit
  `Cannot assign to read only property 'drehung'` ab. test368 neu (15, Port
  9399). Dabei aufgefallen: test357 war seit E373 rot, weil der ZIP-Auftrag
  seither `schaetzungMs` trägt.
* E379 (der letzte Ort derselben Messreihe): Neuzeichnen fragt nach der
  Identität, nicht nach dem Wortlaut. `redraw()` rief je Marke
  `JSON.stringify` — 5,95 ms bei 800 Strichen, bei jedem Zurück, jeder
  Haftnotiz, jedem Radierzug. Seit der Regel aus E378 (ersetzen statt
  ändern) beantwortet `gezeichnet.get(id) !== mark` dieselbe Frage in 17 µs,
  und zwar SCHÄRFER: zwei gleiche Objekte mit gleichem Inhalt galten früher
  als unverändert, jetzt wird neu gezeichnet — mehr Arbeit als nötig, nie
  zu wenig. Gegenprobe: der Abgleich hält jede Marke für unverändert →
  test350 rot, genau an dem Fall, für den `gezeichnet` gebaut wurde.

* E380 (Redurs vier GoodNotes-Fotos, „es öffnet gleich wie es"): Das Regal
  bekommt Ebenen — ein Ordner ist ein Ort, kein Etikett. Das Dokumente-Regal
  (`bibliothek.ts`, untere Leiste → „Dokumente") zeigte alles flach; ein Tipp
  auf einen Ordner tat nichts, und nach dem Entpacken einer ZIP landete man
  an der flachen Wurzel. Jetzt: ein Reiter „Ablage" mit Filter nach Ebene
  (`parentId === ordner`), Hineingehen (`geheIn`), Hochgehen (`geheHoch`),
  eine Brotkrume (`.bib-krume`), ein gemerkter offener Ordner (`meta.bibOrdner`,
  übersteht das Neuladen), und `ansichtAuffrischen(wurzelId)` stellt den
  Bildschirm nach dem Entpacken in den entstandenen Ordner. Der Fund, der
  die Arbeit klein machte: begehbare Ordner gab es schon — aber im Heft-Regal
  (`notebook.ts`), dessen `heftArtig` PDFs und Lernsets ausschliesst; und
  `importZip` gab die `wurzelId` seit E350 zurück, kein Aufrufer las sie.
  Prüfung `test369` (36 Punkte, 7 Abschnitte, echter ZIP-Rundlauf über
  `Austausch.zipSchreiben`). Zwei Gegenproben rot gesehen: den Ablage-Filter
  wieder flach → §1/§2/§6 rot; die `wurzelId` fallen lassen → §6 rot (der
  Bildschirm bleibt an „Dokumente" statt in „Kurs 2027"). Offen bleibt (L120):
  zwei Regale für dieselbe Sache, und eine untere Leiste, die noch nicht
  GoodNotes folgt.

  Arbeitsnotiz zur Gegenprobe: `git checkout` auf die GEBAUTE `bibliothek.js`
  hätte fast die unversionierte E380-Arbeit verworfen — die Datei ist Ausgabe
  aus `src/`, der Checkout holte den Stand von HEAD (ohne E380). Gerettet, weil
  die `.ts`-Quelle unberührt war und `npm run bauen:ts` sie neu erzeugt. Lehre:
  eine Gegenprobe an der gebauten Datei wird danach mit `npm run bauen:ts`
  zurückgeholt, nicht mit `git checkout` — auch nicht auf eine einzelne Datei
  (§43).

* E381 (der Nachtrag zu E380, am Telefon gefunden): Die Brotkrume der Ablage
  bleibt am Telefon brauchbar. E380 war bei 1360 px gebaut; auf Redurs
  Telefonbildern (390 px) lief der Pfad ab der dritten Ebene über und schnitt
  den Ordner ab, in dem man STEHT — die Wurzel blieb, der Standort verschwand.
  Zwei Griffe: der Zurück-Pfeil klebt links (position: sticky, eigene Fläche,
  44 px §37), die Krume scrollt nach jedem Zeichnen ans Ende
  (scrollLeft = scrollWidth). Prüfung test369 §8, das ausdrücklich 390 px
  setzt und ZUERST prüft, dass die Krume überläuft (sonst prüft es nichts,
  §55.2). Gegenprobe: das Scrollen weglassen → §8 rot (scrollLeft 0, der
  aktuelle Ordner ausserhalb), der klebende Pfeil bleibt grün, weil er aus
  dem CSS kommt. Mit einem Telefonbild belegt (§55.3): vorher „…
  BT-Arbeitssicherl", nachher „… BT-Arbeitssicherheit" ganz im Bild.

* E382 (die Nachbarstelle zu E380, §45): Auch die Listenform der Ablage ist
  ein Ordner-Browser. E380 verdrahtete die Ebenen nur in der Deckelansicht;
  in der Liste rief ein Zeilenklick immer App.oeffne — ein Fach ging als leere
  Seite auf (der Fehler, den E380 behob), und der Listenkopf hatte keine
  Brotkrume. Jetzt: data-art an jeder Zeile, der Klick prüft
  reiter==='ablage' && art==='ordner' → geheIn; und bibKopf trägt in der
  Ablage dieselbe Brotkrume und denselben Ordner-Titel wie die Deckelansicht.
  Die Regalform bleibt absichtlich eine Heft-Gruppierung nach Quelle, kein
  Ordner-Browser. Prüfung test369 §9; Gegenprobe: den Fach-Zweig abschalten →
  der Klick öffnet das Fach als Seite (.bib-tab weg), §9 rot (4 Punkte). Mit
  einem Bild belegt.

* E384 (Redurs Satz zum zweiten Mal): Ein offenes Dokument ist der ganze
  Bildschirm, kein Kasten in der Schale. „ich will das die pdf nocht im
  bereichen sich öfnnet so wie goodnotes" — E296 trägt denselben Satz im Kopf
  und war also schon gemacht. Nachgesehen statt geraten (§55.1): E296 hatte den
  SEITENKOPF geräumt, den Kasten INNERHALB der Seite. Was stehen blieb, war die
  Schale drumherum — Menüband 37 + Kopfzeile 54 + Original-Karte 45 + links die
  54 px breite Kante, am Telefon dazu die untere Reiterleiste. Das erste Blatt
  begann bei 222 von 900 (Rechner) und 232 von 844 (Telefon). Jetzt bei 76 auf
  beiden. `body[data-dokument="an"]`, im Dokumentzweig gesetzt und bei jedem
  Zeichnen zuerst gelöscht; `‹ Dokumente` als Weg zurück (über
  Register.navigation, nicht über Bibliothek — §5 Regel 1); Original-Karte und
  Randstreifen-Schalter in den Inspector. Prüfung test385, 37 Punkte, ACHT
  Mutationen rot gesehen. §6 ist die Gegenprobe: auf einer gewöhnlichen Seite
  MUSS die Schale wieder stehen.

  DREI FUNDE, DIE NUR DAS BILD HATTE. Die Kante stand weiter da (waagerecht
  verdeckt sie nichts, also meldete keine Zahl sie); am Telefon lief die
  Dokumentleiste 21 px über den Bildschirm hinaus, der Ausgang `✕` bei 367..411
  in einem 390er Fenster; und ZWEI gleich aussehende `‹` standen nebeneinander
  und taten Verschiedenes. Daraus folgte die einzige Wegnahme: `‹ ›` fallen am
  Telefon aus der Leiste (seit E299 rollt die Ansicht, `☰` springt genau), und
  der Platz geht an den NAMEN des Dokuments — den E296 dort ausgeblendet hatte,
  weil er „ohnehin im Pfad darüber steht", und dieser Pfad ist mit der
  Kopfzeile weg. 115 px statt der dreissig, an denen E296 „E." las.

  ZWEI LEHREN FÜR DAS NÄCHSTE MAL. (a) Eine CSS-Regel gegen `premium.css`
  braucht dort ihren Platz: gleiche Spezifität, und premium.css lädt später.
  Und `display:none` allein zieht keine Rasterspalte ein — das ist der
  E296-Fund, andersherum. (b) `querySelector('.document-topbar button')` als
  Anker auf den ERSTEN Knopf hat test210 aus dem Dokument geklickt und drei
  Abschnitte umgeworfen, an denen nichts kaputt war. Eine Stelle in einer Reihe
  ist kein Anker, ein Auftragsname ist einer — dieselbe Lehre wie test228 in
  E296.

* E385 (§46 „Rot zuerst"): Vier rote Läufe, die schon vorher rot waren — und
  drei davon sind Fehler aus E380/E381, also aus meiner eigenen Arbeit vom
  selben Tag. Belegt mit einem Arbeitsbaum auf `da41dd78`: dort laufen alle
  vier mit Zeichen für Zeichen derselben Meldung, E384 hat sie nicht
  verursacht.

  · test298 — `.bib-krume` benutzte `--fg-2`, `--fg` und `--flaeche-2`, drei
    Marken, die es in keiner Stildatei gibt. An einer Probeseite mit dem
    echten Stilblatt gemessen: der Krumentext stand auf `rgb(55,53,47)`
    (geerbt) statt `rgb(102,101,95)`, und die Hover-Fläche war `rgba(0,0,0,0)`
    — die Knöpfe reagierten auf Überfahren mit GAR NICHTS. Der Fehler, vor
    dem §39 warnt und `notizhefte.css` namentlich vor `--flaeche-2` warnt,
    ein viertes Mal.
  · test362 — dieselbe Krume mit `44px` zweimal und `22px` roh. Die
    Marken-Decke darf nur schrumpfen, also `var(--touch-min)` und
    `calc(var(--touch-min) / 2)`: die Schriftgrösse ist gar keine eigene
    Zahl, das Zeichen ist halb so gross wie seine Fläche.
  · test348 — wartete auf `[data-wz="line"]`, ein Werkzeug, das E375
    abgeschafft hat, und lief in einen 30-Sekunden-Timeout, der wie ein
    Aufhänger aussah. Dieselbe Familie wie L122.
  · test290 — `hat-` und `pp-` fehlten im Namensraum-Verzeichnis. Beide sind
    in Ordnung; `hat-` bekam dabei einen eigenen Absatz, weil es kein ORT ist
    wie die anderen, sondern ein ZUSTAND.

  DIE LEHRE. Alle drei eigenen Fehler hätte ein `npm run pruefen -- --schnell`
  nach E381 gehabt. Sie sind durchgerutscht, weil nach E380/E381/E382 nur die
  BETROFFENEN Läufe gefahren wurden. Marken, Masse und Namensräume prüfen
  aber nichts an einer bestimmten Stelle — sie prüfen das GANZE, und deshalb
  weiss man vorher nie, dass man sie braucht.

* E386 + E387 (UX-Prüfbericht vom 3. September): Der Sofort-Block und der
  erste P1 des Sprints. Redur hat einen Audit mit 18 Befunden geschickt,
  geprüft gegen `main` auf E353 — dieser Zweig stand auf E385. Jeder Befund
  wurde deshalb zuerst gegen den HEUTIGEN Stand nachgemessen.

  E386 · F05 der Sicherheitsbefund: `OLLAMA_ORIGINS=*` stand an vier Stellen
  und erlaubt JEDER Webseite den Zugriff auf das lokale Ollama. Jetzt der
  Befehl mit der echten Herkunft, zum Kopieren, plus Warnung — und der
  Sonderfall `file://` wird gesagt statt verschwiegen. · F04 die Werkzeuge
  hiessen wie ihr Zeichen, weil `.wort` am Telefon `display:none` war; statt
  25 aria-label die Wurzel: `aria-hidden` am Zeichen (21 Stellen) und das
  Wort weggeklemmt statt entfernt, dazu `aria-pressed`. · F06 Dateiname wird
  Titel, nur wenn keiner da ist. · F07 Zoom je Dokument gemerkt wie schon
  die Seite (E349). · F15 Zurück/Vorwärts `disabled` bei leerem Verlauf. ·
  F16 Workspace→Arbeitsbereich, Elektro→Elektrotechnik, alte Namen als
  Alias.

  E387 · F03: von drei PDF-Seiten trugen drei eine Werkzeugleiste. Gefunden
  hat es nicht das Auge, sondern eine Messung, die etwas anderes wollte —
  `test386` §2 meldete `["stift","schreiben","schreiben"]`. Jetzt markiert
  `data-aktiv` die Seite, auf der man ist, und die CSS blendet die übrigen
  Leisten aus. Gemessen: 3 gebaut, 1 sichtbar.

  ZWEI LEHREN. (a) Eine Prüfung, die `textContent` liest, misst das DOM und
  behauptet den Zugänglichkeitsbaum: die Gegenprobe zu F04 blieb erst grün,
  weil ein `display:none`-Element weiter Text hat. Mit `getComputedStyle`
  davor meldet sie 13 Knöpfe mit leerem Namen. (b) Ein Zustand, der sich beim
  Öffnen nicht ÄNDERT, wird von einer Änderungs-Behandlung nie gesetzt — die
  aktive Seite war beim ersten Versuch nur nach dem ersten Rollen markiert.

  E392 · F11: der Bericht sagte „19 Einstellungskategorien auf einer Ebene"
  und schlug sechs Obergruppen vor. Nachgesehen gibt es die Gruppen längst —
  vier davon, drei mit sichtbarer Überschrift, am Rechner wie am Telefon.
  DER ECHTE FEHLER stand daneben: `.einst-fenster` war auf `min(720px,88vh)`
  gedeckelt, die Liste braucht 810 px, und darunter verschwanden auf JEDEM
  Bildschirm dieselben drei Einträge — Speicher, Abrechnung, Über diese App.
  Dazu hing das Fenster an `.overlay` 14vh unter dem oberen Rand, sodass bei
  1280×720 seine Unterkante 43 px ausserhalb des Bildes lag.

  Jetzt mittig, `min(920px,92vh)`, Zeilen ein Pixel dichter — und für kleine
  Schirme ein Streifen, der sagt, dass es weitergeht, und wieder verschwindet,
  sobald man unten ist. Ein sichtbar gemachter Rollbalken war der erste
  Versuch und ist verworfen: in diesem Browser überlagert er, belegt ein
  Pixel und malt nichts — eine Regel, die keine Prüfung erreichen kann, ist
  eine Behauptung (§55.2).

  EINE LEHRE AUS DER MUTATION: `min-height:52px` allein macht den §37-Wächter
  nicht rot — der Zeileninhalt ist schon höher als 44 px. Erst kleinere
  Schrift UND kleineres Polster drücken die Zeile darunter. Der Wächter misst
  also die wirkliche Höhe statt der Schreibweise, was richtig ist, aber erst
  die Gegenprobe hat es gezeigt.

  E393 · Zwei Funde an derselben Leiste. (a) Von den FÜNF Hauptwegen
  markierte die Kontextkante nur ZWEI richtig — auf „Lernzentrum" leuchtete
  „Heute", auf „Bibliothek" und „Aufgaben" gar nichts. `App.schauplatz()`
  bildet den Titel der Ansicht ab, und drei der fünf teilen ihren Titel mit
  einem Nachbarn. Die Adresse unterscheidet sie; sie steht jetzt als
  `adresse` im Register neben `schauplatz`. (b) „Zeitmesser" stand zweimal
  in der Lade, unter zwei Überschriften, beide Male dasselbe Panel.

  DREI LEHREN. (1) Der erste Anlauf machte es SCHLECHTER: die Adresse kommt
  später als das Signal, auf das die Kante hört — `zeigeSonder` setzt erst
  die Adresse aus dem Titel, meldet, und erst danach setzt die Lernwelt ihre
  eigene. Statt zwei richtigen Markierungen gab es null. Ein `hashchange`
  mehr behebt es. (2) Eine Bedingung, die sich mit keiner Mutation rot
  bekommen liess, ist wieder aus dem Code entfernt worden statt als Zierat
  stehen zu bleiben (§55.2). (3) Die Behauptung des Berichts, der
  Ortskatalog mische Orte und Handlungen, hat DREI Messläufe gebraucht und
  ist am Ende widerlegt worden — siehe L126: 26 der 45 Ziele sind das
  Suchfenster. Die ersten zwei Messungen sahen richtig aus und waren falsch;
  die zweite mass den verdunkelnden Grund statt des Fensters.

  E394 · F08: das KI-Feld blieb im Dokumentmodus stehen — 380 von 1360
  Pixeln, in genau der Ansicht, deren Zweck das grosse Blatt ist. E384 hatte
  versprochen, dort falle „die ganze Schale weg"; die CSS blendet Menüband,
  Kopfzeile, untere Leiste und Kontextkante aus, das KI-Feld fehlte in der
  Liste. Jetzt klappt es beim Eintreten zu und beim Verlassen wieder auf —
  nicht mit `display:none`, denn „fasse diese Seite zusammen" ist im Dokument
  die naheliegende Frage.

  DER HAKEN SITZT IN `zeichneSeite()`, NICHT IN `DocumentMode.toggle()`: drei
  von vier Wegen in den Modus (`bibliothek.ts`, `notebook.ts` zweimal) setzen
  `dokumentModus` unmittelbar am Block und gehen an `toggle()` vorbei.

  UND EIN FEHLER VERDECKTE EINEN ZWEITEN: mit den 380 Pixeln zurück zeigt die
  Blattleiste wieder ihre NAMEN statt nur der Zeichen. Die Leiste aus E359
  weicht bei Enge auf Zeichen aus, und das KI-Feld hatte sie über diese
  Grenze gedrückt. Auf dem Bild zu sehen, in keiner Messung.

  Die zweite Hälfte des Befunds („am Telefon als Bottom Sheet") war schon
  erfüllt — nachgemessen und mit test391 §5 festgehalten, damit sie nicht ein
  zweites Mal als offen gilt.

  E395 · F13: das Abnahmetor über die vier Grössen des Berichts steht
  (test392, 23 Punkte) — und hat beim ersten Lauf gefunden, wofür es gebaut
  wurde. Bei 844 × 390, einem quer gehaltenen Telefon, ist die Kontextkante
  353 px hoch und ihr Inhalt 424; acht Knöpfe lagen ausserhalb, darunter
  Suchen, Neu und Einstellungen. Die untere Telefonleiste hilft dort nicht,
  weil sie bei 760 px Breite endet. Es gab also keinen Weg zu „Neu".

  Die Kante faltet sich jetzt gruppenweise: erst die Werkzeuge, dann die
  Orte, und `.k-unten` nie — wer den Ausweg wegfaltet, hat nichts gewonnen.

  DREI LEHREN. (1) Der Falter aus E388 konnte nicht helfen, weil er `.k-oben`
  an sich selbst misst: eine auf null gequetschte Gruppe meldet keinen
  Überlauf. Genau im Ernstfall stieg er aus. (2) Die erste Fassung machte
  vier Orte UNERREICHBAR — gefaltet in der Leiste und „steht ja schon da" in
  der Lade. Die Lade fragt jetzt die Leiste statt des Registers. (3)
  `page.click` wartet dreissig Sekunden und wirft, wenn ein Knopf unter
  einem anderen liegt; der Prüflauf stürzte bei der Mutation ab, statt sechs
  rote Zeilen zu melden. Jetzt klickt er über `evaluate`.

  E396 · F14: am Telefon standen „Rückgängig" und „Wiederholen" hinter einem
  Wisch — die zwei Griffe, die man beim Schreiben von Hand am häufigsten
  braucht, und die einzigen in der Leiste, die keine Werkzeuge sind. Sie
  kleben jetzt am rechten Rand (`position:sticky`), ohne Umbau am DOM: die
  Gruppenregeln aus E356 lesen `data-gruppe` an den direkten Kindern, ein
  Umschlag hätte sie alle gebrochen.

  DREI FEHLER AUF DEM WEG, ALLE DREI NUR AUF DEM BILD ZU SEHEN (§55.3) — in
  der Messung standen die Knöpfe jedes Mal korrekt „im Bild":

  (1) `button[disabled]{opacity:.4}` weit oben in der Datei gilt für JEDEN
  Knopf der App und machte auch den Hintergrund der klebenden durchsichtig;
  die Werkzeuge darunter schienen durch. Die Regel im Bereich nicht zu
  wiederholen genügt nicht — sie muss zurückgenommen werden. (2) 48 statt 44
  Pixel Abstand liessen einen Spalt, durch den ein abgeschnittenes
  Haftnotiz-Zeichen blitzte: zwischen klebenden Knöpfen gibt es die Lücke
  nicht. (3) Die acht Pixel Polster rechts gehören der Leiste, nicht dem
  Knopf — dahinter rollten die Werkzeuge weiter sichtbar durch.

  Die Reihenfolge der Werkzeuge bleibt offen und ist Redurs: „Radieren" steht
  an elfter Stelle, beim Schreiben von Hand wäre es das dritte.

  E397 · F10: der Typ war da, er öffnete nur nicht. „Blatt" legte eine Seite
  mit ["text", "blatt"] an und liess `dokumentModus` auf false — man landete
  im Texteditor und musste „Dokumentmodus" erst selbst finden, um auf dem
  Blatt schreiben zu können. Zwei Zeilen: die Flagge setzen, und die
  Unterzeile sagt den Zweck („Mit der Hand schreiben") statt nur die
  Papiersorten.

  DER NAME BLEIBT „BLATT", obwohl der Bericht „Handschriftliche Notiz"
  vorschlägt. So heisst die Blockart, die Werkzeugleiste und alles, was E100,
  E359 und E375 gebaut haben; ein zweiter Name stünde dann in der Suche, im
  Slash-Menü und im Papierkorb nicht (§8). Der Zweck gehört in die
  Unterzeile, nicht in einen zweiten Namen — `test394 §3` hält beides fest,
  und die Umbenennung war die vierte Mutation, die rot ging.

  E398 · F03 Rest: die Wahl „Einzelseite / Fortlaufend". Redur wurde am
  4. September zweiteilig gefragt — willst du die Wahl, und soll Einzelseite
  am Telefon die Vorgabe werden — und hat „ja" gesagt. Gebaut ist deshalb
  das Erste und ausdrücklich nicht das Zweite: die Rolle bleibt der
  Normalfall, überall. Das ist seine eigene Ansage aus E299 („die pdf seiten
  sollte wie goodnotes sich ganz oeffnen komplet wie one note"), und eine
  Vorgabe dagegen wäre eine Entscheidung gegen ihn gewesen.

  WARUM ES DIE WAHL BRAUCHT, gemessen an vier A4-Blättern: am Telefon
  (390 × 844) stehen ZWEI Blätter gleichzeitig im Bild, eines ist 72 % des
  Bildschirms hoch. Am Rechner (1360 × 900) ist ein Blatt 213 % des Bildes
  hoch — dort steht ohnehin nur eines. Der Befund „Nutzer wissen nicht
  sicher, welche Seite aktiv ist" war ein Telefon-Befund.

  Der Schalter steht im INSPECTOR, nicht in der Leiste: E384 hat den
  Randstreifen aus der Leiste geholt, weil sie am Telefon 411 px breit war in
  einem 390 px breiten Fenster. Ein zweiter Schalter dort wäre derselbe
  Fehler ein zweites Mal gewesen. Gemerkt wird je Dokument als Meta, wie
  Seite und Zoom — eine Ansicht ist kein Inhalt, und `test395 §6` misst, dass
  `edited` unberührt bleibt. Bei einem EINZIGEN Blatt fehlt der Schalter: er
  täte dort nichts, und ein Schalter, der nichts tut, lässt einen suchen, was
  sich geändert hat.

  DIE STELLE, DIE FAST SCHIEFGEGANGEN WÄRE: eine ausgeblendete Bühne hat
  `offsetTop` 0 und `offsetHeight` 0 und fällt damit in JEDES Nähe-Fenster
  von `nachziehen()`. Ohne Kurzschluss wären beim ersten Rollen alle achtzig
  Seiten gezeichnet worden — genau das, was E299 verhindern wollte, durch die
  Hintertür wieder da. `test395 §3` meldet ohne ihn vier statt eine.

  E399 · und das, was beim Messen dafür herausfiel: der Platzhalter einer
  noch ungezeichneten Seite war 283 px hoch, die Seite wird 1922. Der
  Rollbalken wuchs damit mit jeder erreichten Seite — bei sechs Seiten von
  3513 auf 6620, bei achtzig hätte er von Anfang an ein Viertel des Wegs
  angezeigt. Und E299 schrieb an dieselbe Stelle: „sonst springt der
  Rollbalken, sobald sie gezeichnet ist."

  Ursache: `center.clientWidth` ist NULL, wenn die Bühnen gebaut werden — der
  Kasten hängt da noch nicht im DOM. Die Rechnung war nie falsch, sie lief
  nur zu früh. Sie steht jetzt in `passen()` und folgt damit auch dem Zoom
  und der Fensterbreite mit. Gemessen: 11 283 px beim Öffnen und 11 283 px
  nach dem Rollen.

  PRÜFUNG: `test395` (46 Punkte, PORT 9423), fünf Mutationen rot gesehen.
  Die wichtigste ist die erste — `einzeln: true` als Vorgabe lässt §1
  fünffach fallen, und §1 hält nicht den neuen Bau fest, sondern den alten:
  dass ihn niemand angefasst hat. Drei Bilder im Gespräch (§55.3).

  E400 · F09 zur Hälfte: „Befehlsmenü mit Suche, zuletzt verwendet,
  Favoriten". Erst gemessen, wie LUECKEN.md es für jeden Befund des Berichts
  vorschreibt — fünf Leser, fünf Gegenprüfer. Ergebnis: das Menü gibt es
  längst (`Werkzeuge.palette()`, Strg ⇧ K, 163 Befehle, unscharfe Suche,
  Häufigkeitsgedächtnis). Der VIERTE Befund des Berichts, der beim Nachmessen
  schon erledigt war — nach F11, F08 und F10.

  DAFÜR ZWEI DINGE, DIE DER BERICHT NICHT KANNTE.

  Erstens: `zeichne()` zeichnete `treffer.slice(0, 60)`, der Pfeil lief bis
  `treffer.length - 1`. Zwei Zahlen für dieselbe Sache. Ohne Eingabe hält die
  Liste 163 Einträge — der Quelltext verrät das nicht, weil zwei der 105
  `c(`-Aufrufe SCHLEIFEN sind (66 Blockarten aus dem Register). Ab dem 61.
  Druck auf ↓ trug kein gezeichneter Knopf mehr `.on`, auf dem Bildschirm
  bewegte sich nichts, und Enter führte trotzdem aus. 103 Befehle waren
  erreichbar, ohne sichtbar zu sein. Jetzt gilt eine Konstante an beiden
  Stellen, und die Liste sagt „103 weitere", wenn sie abgeschnitten ist —
  und schweigt, wenn nicht.

  Warum kein Prüflauf das fand: `test51` tippt immer erst etwas ein und
  bleibt damit unter 46 Treffern. Der Fehler lag nur im ungefilterten
  Erstzustand, also in dem, den jeder sieht.

  Zweitens: vier Stellen schrieben Strg ⇧ P für die Palette an — die
  Seitenleiste, das Register, das leere Suchergebnis und die WILLKOMMENSSEITE,
  die jeder neue Nutzer liest. Nur `register/tasten.ts` nannte das richtige
  Strg ⇧ K. `test222 §5` blieb grün, weil es zwei Beschriftungen aneinander
  hält und beide falsch waren; und `werkzeuge.ts:2683` lässt Strg ⇧ P ohne
  offene Seite auf die Palette zurückfallen, also tat das falsche Kürzel auf
  dem Startbildschirm genau das, was danebenstand.

  `test396 §2` vergleicht deshalb nicht, sondern DRÜCKT: er liest das Kürzel
  vom Knopf ab, zerlegt es und drückt genau das — mit offener Seite, damit
  der Rückfall die Probe nicht rettet. Dass dieser Zusatz zählt, hat die
  Mutation bewiesen: ohne offene Seite blieb der Wächter grün und bestätigte
  genau den Fehler, gegen den er geschrieben war.

  PRÜFUNG: `test396` (27 Punkte, PORT 9425), vier Mutationen rot gesehen.
  Grün geblieben: test47, 51, 86, 128, 197, 222, 340. Einzeldatei neu gebaut.
  Ein Bild im Gespräch — und es hat eine Zahl berichtigt: die Messung schätzte
  111 Einträge, auf dem Bildschirm stehen „103 weitere" unter 60 Zeilen.

  OFFEN: die zwei Halbworte, die F09 wirklich verlangt, plus fünf weitere
  Funde derselben Messung — alle sieben in **L128**, darunter ein toter
  Favoriten-Block, ein ungedeckelter Verlauf, der in jede Sicherung wandert,
  und vier Registerausgänge ohne einen einzigen Aufrufer.

  E401 · F09 Rest: die zwei Halbworte, die wirklich fehlten. Die Palette hat
  jetzt drei Gedächtnisse statt einem — `paletteOft` (wie oft), `paletteZuletzt`
  (wann zuletzt) und `paletteFest` (was ich oben haben will). Der Unterschied
  zwischen den ersten beiden ist der ganze Befund: A, dann B, dann wieder A —
  ein Zähler sagt „A zweimal", eine Reihenfolge sagt „A, B".

  Angeheftet wird mit dem Stern in der Zeile oder mit Strg+Enter. Der Stern
  steht IM Zeilenknopf, weil ein zweiter Knopf darin ungültiges HTML wäre und
  ein Umschlag die Zeilenregel aus E348 bräche; der Griff prüft ihn deshalb
  VOR dem Knopf. Sichtbar ist er nur an der gewählten Zeile, unter der Maus
  und an wirklich angehefteten — am Telefon immer, weil es dort kein
  Überfahren gibt.

  Beide neuen Überschriften stehen NUR da, wenn sie etwas enthalten. Bei
  einem frischen Redion sieht die Palette aus wie vorher.

  ZWEI FUNDE DES PRÜFLAUFS, die niemand gesucht hätte: Seitentitel landeten
  ungefiltert im Befehlsgedächtnis („📄 Zwiebelsuppe" zwischen „Papierkorb"
  und „Exportieren"); und der gerade ausgeführte Befehl fiel beim neuen
  Deckel sofort wieder heraus, weil er mit Zähler 1 ganz unten steht. Beides
  behoben.

  PRÜFUNG: `test397` (32 Punkte, PORT 9427), fünf Mutationen rot gesehen.
  Grün geblieben: test47, 51, 86, 128, 197, 222, 340, 396. Ein Bild im
  Gespräch — es hat gezeigt, dass zwei meiner drei Beispielnamen gar nicht
  existieren und die Absicherung sie still fallen liess. Genau so soll sie
  arbeiten; `test397 §3` hält den Fall jetzt fest.

  E402 · L128 Punkt 3: der Favoritenblock auf dem Bildschirm „Seiten und
  Notizen" filterte `b.fav` — das Feld heisst `favorite`. Die Liste war immer
  leer, und weil ein leerer Abschnitt samt Überschrift ganz weggelassen wird,
  sah man nicht einmal, dass etwas fehlte: man schloss daraus, keine
  Favoriten zu haben.

  Behoben nicht durch das eine Wort, sondern durch den vorhandenen Katalog:
  `Store.favorites()` statt eines zweiten, von Hand geschriebenen Filters für
  dieselbe Frage (§8). Genau dieses Auseinanderlaufen war die Ursache.

  PRÜFUNG: `test398` (9 Punkte, PORT 9429), Mutation rot gesehen. Die
  Nachbarläufe stehen noch aus — der volle Lauf belegt gerade die Ports, und
  test398 bekam deshalb eine Nummer, die mit nichts kollidiert. Ein Bild im
  Gespräch.

## Die Denkkugel — neun Zustände statt „Der Agent denkt nach …" (E403)

**Fund.** Redur schickte den Orb-Effekt von libraries.dev. Beim Nachmessen
zeigte sich, dass Redion an der Stelle, wo er hingehört, seit vier Bögen eine
einzige Textzeile ohne Bewegung hatte — und dass sie beim ersten Schritt des
Agenten verschwand, also genau dann, wenn etwas passierte.

**Bau.** `src/core/orb/geometry.ts` (reine Rechnung, kein DOM, kein Zufall)
und `src/core/orb/modes.ts` (neun Arten als reine Funktionen von Grösse und
Zeit), dazu `src/schale/ueberlagerung/orb.ts` als Maler. Eigener Code, keine
Abhängigkeit; die Technik ist thinking-orbs (Jakub Antalik, MIT) abgesehen
und im Quelltext genannt. Jedes der zwölf Agentenwerkzeuge zeigt seinen
eigenen Zustand; der Text bleibt daneben stehen (§38).

**Prüfung.** `test399`, 22 Punkte, PORT 9431. §4 misst, ob die neun einander
gleichen — und war beim ersten Lauf rot: drei Paare unter 2,5 px. Zwei
Mutationen rot gesehen. Drei Fehler fand nur das Bild: `working` als Klecks
(jede Bahn hatte eine eigene Kamera), `breathing` und `shaping` als derselbe
Kreis, `solving` mit unsichtbarer Drehung.

## Der Anheft-Stern stand im Zeilentext (E404)

**Fund.** Der volle Lauf wurde in Stück 18 rot: `test206`, acht Punkte auf
einmal. E401s Anheft-Stern sass als Textknoten im Zeilenknopf und landete in
jedem `textContent` — `aria-hidden` verbirgt vor dem Vorleser, nicht vor dem
Text.

**Bau.** Das Zeichen wandert nach `::before`; der `<span>` bleibt als Griff
und trägt jetzt ein `title`.

**Prüfung.** `test206` wieder ganz grün (66 ok). `test397 §6` nachgetragen —
der Wächter aus E401 prüfte Gestaltung, nicht Text. Mutation rot gesehen:
vierzig Zeilen mit Stern.

## 23 Prüfläufe teilten sich einen Port (E405)

**Fund.** Stück 22 des vollen Laufs war rot (`test247`), einzeln lief derselbe
Lauf mit 106 von 106 durch. `test206` und `test247` hatten beide Port 8967,
und ich hatte `test206` nebenher im Hauptbaum geprüft. Gezählt: 48 von 260
Läufen mit doppelt vergebener Zahl, 23 Gruppen, eine davon viermal.

**Bau.** Der niedrigste Lauf behält seine Zahl, 26 andere ziehen ab 9500 um.

**Prüfung.** `test400` liest alle Läufe und meldet jede Doppelvergabe — ohne
Browser, ohne Server, ohne eigenen Port. Mutation rot gesehen.

## Sieben erfundene Farbtokens, sechs namenlose Schalter, vier Farbreihen (E406)

**Fund.** Vier Suchläufe über den Quelltext. Zwei fanden nichts (§19 Escape,
tote Knöpfe) — das steht in E406 genauso da wie die Funde. Zwei fanden viel:
30 Stellen mit sieben Tokens, die es nie gab und deren Rückfallwert immer
griff (`var(--soft,#f6f6f6)` als weisse Platte im Dunkelmodus), sechs
Kippschalter ohne Namen, ohne Zustand und 22 px hoch, und vier Farbreihen mit
vier eigenen Namenslisten in zwei Wortwahlen („Lila" gegen „Violett").

**Bau.** Tokens auf die echten Namen, Rückfallwerte ersatzlos weg.
Schalter mit `role="switch"`, `aria-checked`, `aria-label` und 44 px
Trefffläche. `src/core/helpers/colors.ts` als einzige Farbnamensliste.

**Prüfung.** `test401`, ohne Browser und ohne Port. War rot und fand fünf
Reihen mehr als ich. Mutation rot gesehen.

## 42 Trefflächen unter 44 px, und zwei Fehler beim Reparieren (E407)

**Fund.** §37 verlangt 44 px auf Hauptwegen und einen GESCHRIEBENEN Grund für
jeden Nebenweg. Gemessen: 42 Flächen darunter, vier begründet, 38 stumm —
darunter die Dialogfusszeile mit 42 px, also Bestätigen und Abbrechen, die
§37 namentlich nennt.

**Bau.** Sechs Hauptwege auf 44 px Trefffläche. Für den Rest
`masse-bestand.json`, das nur schrumpfen darf (Vorbild `js-bestand.json`).

**Zwei eigene Fehler, beide dokumentiert:** eine 44×44-Fläche um 16-px-Felder
hätte die Nachbarn überdeckt (jetzt wächst sie nur senkrecht); und ein
fehlendes Semikolon machte vier CSS-Regeln ungültig, ohne dass irgendetwas
gemeckert hätte.

**Prüfung.** `test402`, ohne Browser und ohne Port. Mutation rot gesehen.

## Der PDF-Teil wie GoodNotes — sechs Bögen (E465–E470)

**Auftrag.** Redur am 7. September, mit einem 32-seitigen GoodNotes-Dossier:
„alles, was GoodNotes machen kann, 1:1 — nur beim PDF-Teil: wie die
bearbeitet wird, importiert, die Stifte usw.", und „ohne eine Funktion zu
löschen". Das Dossier wurde gegen den Bestand gelesen (E351–E360,
E375–E385, E464); daraus wurden sechs Bögen, jeder mit Prüflauf,
Gegenprobe, Bild und Entscheidung.

**Bau.**

* **G1 · Zeichnen (E465, test438).** Dreieck und rundes Rechteck als
  Formen, der Bleistift als vierter Stift mit eigener Druckkurve, die
  freie Strichstärke als Klappe an der gewählten Stufe (der Regler in der
  Zeile hob die Leiste auf drei Reihen), Buchstabentasten
  P/2/H/E/S/V/T/A/N/M/R/I.
* **G2 · Auswahl (E466, test439).** Drehgriff — Linienzüge drehen ihre
  Punkte, Kästen merken sich `dreh` —, Ausschneiden, nach vorn und hinten,
  Sperren mit Schloss, Kritzel-Löschen und Kreis-Lasso.
* **G3 · Seiten (E467, test440).** Das Seitenmenü im Inspector: einfügen
  mit Papierwahl, duplizieren mit eigenem Seitenbild (eine geteilte Datei
  wäre mit dem Original gestorben), drehen, schieben, Lesezeichen mit
  Liste, löschen in den Papierkorb.
* **G4 · Suche und Verweise (E468, test441).** Die Textschicht der PDF mit
  Lage aus pdf.js, eine Suchleiste im Studio mit Treffern über den
  getroffenen Zeichen, die Links der PDF als eigene Schicht, eigene
  Verweise als Feld an jeder Marke.
* **G5 · Import und Export (E469, test442).** Bilder als Seiten, PDF an
  einer Stelle einfügen, Seite als PNG sichern, Zoom-Fenster.
* **G6 · Das Zoom-Fenster als Schreibfläche (E470, test443).** Das Papier
  zieht in einen vergrösserten Streifen um, in der Bühne bleibt ein
  stilles Abbild mit dem Rahmen. EINE Zeichenfläche: zwei Schichten auf
  demselben Block hielten zwei Kopien der Marken (§51).

**Was dabei nebenbei gefunden wurde.** „Lesen" liess im Studio das
Werkzeug der Zeichenschicht stehen und machte das ganze Papier `inert` —
das Abdeckband (E266) ging dort nie auf, und die neuen Verweise hätten es
auch nicht getan. Jetzt wird nur der Text still, und Lesen heisst Hand.
Zwei weitere Funde hingen daran: der Klick, mit dem „Lesen" umschaltet,
klappte die Ansichtsklappe zu, aus der er kam; und die Hand wurde als
Stift gemerkt, sodass „Annotieren" wieder die Hand brachte.

**Prüfung.** Sechs neue Läufe (test438–test443, zusammen 210 Punkte), je
zwei Gegenproben rot gesehen, sieben ältere Studio-Läufe angepasst — jeder
mit geschriebenem Grund. Bilder angesehen: `zeichnen`, `staerke`,
`auswahl`, `seiten`, `suche`, `lupe`, je am Rechner und am Telefon. Drei
Fehler fanden nur die Augen: der Regler brach in eine dritte Zeile, die
Treffer der Suche deckten die ganze Zeile statt des Wortes, und das
Abbild der Seite war flachgedrückt, weil der Klon sein `style` verlor.

* **G7 · Die kleinen Reste (E472, test445).** Die Formerkennung kennt das
  Dreieck (nur aufrecht — die Marke kann keine andere Lage), ein Bild aus
  der Zwischenablage wird mit Strg V eine Seite, der Dateiwähler nimmt
  mehrere PDFs mit einer einzigen Frage nach der Anordnung, und der
  Streifen des Zoom-Fensters rückt weiter, wenn man bis an seinen rechten
  Rand schreibt.

**Und ein Fehler, den erst die Prüfung fand (E471).** Eine adversariale
Runde über die fünf Bögen — fünf Leser mit je einer Dimension, ihre Funde
danach von Skeptikern widerlegt — brachte einen Rechte-Fehler ans Licht,
der nichts mit GoodNotes zu tun hat: `Konten.darf` wurde im Dokumentmodus
an sechs Stellen mit dem Seiten-OBJEKT statt seiner Kennung gerufen. Ein
Objekt ist truthy, `rolleAuf` findet damit nichts, läuft die
Freigabenkette nie ab und endet bei der Standardrolle „voll". **Jede
Rechtefrage im PDF-Teil sagte ja**, gleich welche Freigabe an der Seite
hing. Vier der sechs Stellen sind älter als die Bögen. Es ist wörtlich der
Fehler aus L102, den §26 seitdem beim Namen nennt — und er kam wieder,
weil es keinen Wächter gab. Jetzt gibt es einen (`test444 §1`), und zwar
über die ganze Quelle: jede Rechtefrage muss erkennbar eine Kennung
übergeben. Er fand sofort drei weitere Stellen, die richtig waren, aber
`current` und `unter` hiessen.

**Und vier weitere, die gehalten haben (E473).** Von 33 Funden wurden acht
adversarial geprüft, fünf haben gehalten:

* **Eine Farbe kann Code sein.** `alsSvg` baut seinen SVG-Text
  (`stroke="${farbe}"`), `marken.ts` setzt ihn mit `innerHTML` ein — und
  die Farbe kommt aus einer Marke, also möglicherweise aus einer fremden
  `.redion`. `#000" onload="…` schloss das Attribut. Neu ist
  `Sanitize.farbe`, und `alsSvg` escapt jeden eingesetzten Wert.
* **Die Sperre hatte sechs Türen.** Strichstärke, Schriftgrösse,
  Reihenfolge, Verweis, Text bearbeiten und das Drehen eines Fachzeichens
  gingen an ihr vorbei. Alle sechs sind zu; die Farbe darf weiter (E466).
* **pdf.js stand wieder im Anzeigeweg.** Die Verweise einer Seite wurden
  beim ANSEHEN geholt und zogen die ganze Original-PDF in den RAM — gegen
  die Zusage in `leser.ts` und gegen §36. Jetzt kommen sie beim Einlesen
  mit und stehen am Block, wie `suchtext`.
* **Die offenen PDF-Griffe blieben liegen**, wenn man das Dokument
  verliess; und am Telefon lag die Suchleiste unter der Ansichtsklappe.

Dazu ein Fund derselben Runde: eine verdoppelte BILD-Seite legte ihr Bild
als „abgeleitet" ab — nach dem Einspielen einer Sicherung wäre die Kopie
leer gewesen.

**Was die Runde über das Prüfen sagt.** Alle Funde standen im Code, seit
die Bögen gebaut wurden; die Prüfläufe waren grün, die Bilder sahen
richtig aus. Gefunden hat sie erst ein Leser, der nichts bauen wollte und
nur eine Frage hatte, und gehalten haben sie erst, nachdem ein zweiter
Leser sie zu widerlegen versuchte — drei von acht fielen dabei.

**Und der Bogen danach: das Gedrehte ist wirklich gedreht (E474,
test447).** Zwei der 25 ungeprüften Funde aus derselben Runde hatten
dieselbe Wurzel — `dreh` war seit E466 eine reine Anzeigesache. Wer eine
schiefe Marke am Eckgriff zog, zog sie in eine andere Richtung, als seine
Hand ging (ein Rechteck auf der Seite wurde beim Breiterziehen HÖHER); wer
neben ihr radierte, löschte sie trotzdem, weil der Radierer den aufrechten
Kasten UM sie mass — bei einem langen Rechteck auf 45° hundertfünfzig
Punkte daneben, an 3000 Stellen gemessen 1013 falsche Antworten. Und der
Auswahlrahmen war derselbe zu grosse Kasten.

Die Geometrie kennt jetzt `ecken`, `drehung`, `boundsLokal`,
`drehePunkte` und einen Trennachsen-Test. `bounds` bleibt, was es war —
die richtige Antwort auf „könnte es hier überhaupt sein", und überall der
billige Vorfilter; falsch war nur, es auch als Antwort auf „ist es hier"
zu nehmen. Der Rahmen steht jetzt schief wie die Marke, die Griffe sitzen
auf ihren Ecken, und der gehaltene Punkt bleibt auf die Hundertstel
stehen. Was NICHT geht und in E474 begründet steht: eine gedrehte Marke
ungleichmässig zusammen mit anderen ziehen wäre eine Scherung, und die
kann das Datenmodell nicht beschreiben — statt ein drittes Feld an jeder
gespeicherten Marke einzuführen (§53.3), nimmt `scale` dort die
Hauptdiagonale der gedrehten Streckung: exakt bei rechten Winkeln, exakt
bei gleichmässiger Streckung, nie verzerrend.

Vier Gegenproben, alle rot gesehen. Und ein Prüfpunkt, der nicht in den
Code gehört, sondern in die Prüfung: §1.1 misst an 400 Fällen, dass eine
Marke OHNE Drehung Zahl für Zahl streckt wie vorher — eine Änderung, die
alte Marken um ein Hundertstel verschiebt, sieht niemand.

**Und was der Finger trifft (E475, test448).** §37 ist hart im Kern —
44 px auf den Hauptwegen —, und L133 führte drei Stellen, die es nicht
waren. Erst gemessen (§36), dann gebaut; am Telefon 390×780, die Seite
344×487 gerendert: der Verweis einer PDF **6,9 px** hoch, der Regler der
Strichstärke **16** (die Klappe darum mass 44 — getroffen werden muss der
Regler), die Papierauswahl **36**.

Zwei davon sind eine Zeile CSS. Der Verweis nicht: ihn selbst zu
vergrössern hiesse, eine Textseite mit dreissig Verweisen unter dreissig
blaue Kästen zu legen. Also bleibt der sichtbare Verweis, was er ist, und
nur seine Trefffläche wächst — **aber nie über die Hälfte des Abstands zum
nächsten Verweis**. Eine Fläche, die den Nachbarn verschluckt, tauscht
„nicht getroffen" gegen „das Falsche getroffen", und in einem
Inhaltsverzeichnis wäre das ein Sprung in ein fremdes Dokument. So gehört
jeder Punkt dem nächstgelegenen Verweis: keine tote Zone dazwischen, keine
Überdeckung. Gemessen: der freistehende wächst von 6 auf 44×45, zwei mit
26 Punkten Zeilenabstand auf je 15.

Drei Gegenproben rot gesehen. Und ein Bild, auf dem die Trefffläche rot
gestrichelt zu sehen ist — man sieht darauf sofort, dass die zwei engen
Verweise sich genau in der Mitte treffen.

**Und ein Kasten ist keine Wischspur (E476, test449).** Die letzten zwei
benannten Funde der Runde. Der erste war Datenverlust: `kritzelTrifft`
fragte, ob eine Marke im KASTEN des Gekritzels liegt. Wer schräg über die
Seite kritzelt, spannt aber einen Kasten über die halbe Seite auf — und
alles darin war weg, auch was handbreit neben dem Zug stand. In der
Gegenprobe gemessen: von drei Marken blieben mit der alten Regel **null**
übrig, mit der neuen die zwei, die der Zug nie berührt hat. Es fiel nie
auf, weil ein Gekritzel über einem Wort waagerecht läuft und dort Kasten
und Spur fast dasselbe sind — und genau darum kritzelte auch `test439 §5`
waagerecht. Der zweite kostete nur Zeit, aber quadratisch beim Rollen:
`trefferMalen` malte bei jeder nachgezogenen Seite die Treffer ALLER
Seiten neu; jetzt nur die der einen.

Am Prüflauf steckt eine Zeile Arbeit, die man sonst übersieht: das
Gekritzel muss abgetastet werden wie von Hand, weil der Stift glättet
(E376) — ein Zickzack aus blossen Eckpunkten kommt als Bogen an, und die
Prüfung prüfte dann etwas anderes, als sie behauptet.

**Und die Verweise alter Seiten kommen nach (E477, test450).** Der letzte
benannte Rest der Runde. E473 nahm pdf.js aus dem Anzeigeweg und schrieb
die Links beim Einlesen an den Block — womit alles, was vorher eingelesen
wurde, für immer ohne Links dastand. Jetzt läuft beim Öffnen eines
Dokuments je Original einmal ein Auftrag `pdf-verweise` im Hintergrund;
sein Ende malt die Verweise, ohne dass jemand neu öffnen muss. Das ist
nicht die Rückkehr des Fundes von E473: dort hing die ganze PDF am
Ansehen JEDER Seite, hier wird sie einmal je Original geöffnet — der
Prüflauf zählt mit und findet beim Ansehen und Rollen **null** Öffnungen.

**Und ein Fehler, den der Prüflauf in seiner ersten Zeile fand.** E473
schrieb das Verweisfeld nur an Seiten MIT Verweisen. Damit sehen „keine
Verweise" und „noch nie nachgesehen" gleich aus — und der neue Nachtrag
liefe bei jedem Öffnen über jede Seite ohne Links wieder los; bei einem
Skript, in dem drei von hundert Seiten Links haben, jedes Mal über
siebenundneunzig. Seitdem wird die leere Liste geschrieben: sechzehn
Zeichen je Seite, und der Unterschied zwischen einer Antwort und einer
Lücke.

**Und ein Dreieck darf liegen, wie es gezogen wurde (E478, test451).**
Die Ernte von E474: weil die Geometrie `dreh` jetzt wirklich kann — Griff,
Radierer, Rahmen —, ist ein gedrehtes Dreieck keine hübsche Lüge mehr, die
beim ersten Anfassen auffliegt. Es bekommt seinen Winkel statt einer
Absage; aufrecht bleibt aufrecht (unter vier Grad kein Feld).

Zwei Dinge fand nicht das Schreiben, sondern das Prüfen und das Hinsehen.
Der Prüflauf: die alte Aufrecht-Probe stand vorn und griff bei 15°, 120°
und −120° zufällig — ein gedrehtes Dreieck, das gerade dasteht. Das Bild:
bei einem fast GLEICHSEITIGEN Dreieck sind alle drei Ecken gleich gute
Spitzen, und ein aufrecht gezogenes kam mit `dreh: −120` heraus. Es sah
gleich aus — genau darum konnte kein Prüflauf es finden, und genau darum
war es trotzdem falsch. Gewählt wird jetzt unter den gleich guten Spitzen
die mit der kleinsten Drehung.

Und ein Wächter flog dabei wieder heraus: eine Passprobe, die `test451`
abschalten konnte, ohne dass etwas rot wurde. Ein Wächter, der nicht rot
werden kann, ist eine Behauptung (§55.2) — und schlimmer als keiner.

**Und „Seite als Bild" nimmt die Fotos mit (E479, test452).** L133 führte
das seit E469 mit einer Vermutung als Begründung. Bevor etwas gebaut
wurde, ist sie nachgemessen — und die Messung hat den Weg bestimmt:
`blob:` ist in einem SVG, das über ein `<img>` auf die Leinwand kommt,
gesperrt; `data:` geht und trübt nichts; `foreignObject` zeichnet zwar,
TRÜBT aber die Leinwand, sodass `toBlob` danach fehlschlägt. Die dritte
Zeile schliesst den naheliegenden Weg für den getippten Text: er würde ihn
bringen und dafür die ganze Ausfuhr verlieren. Sie steht in L133, damit
niemand die Tür ein zweites Mal aufdrückt.

Dazu kam ein zweiter Grund, den die Vermutung nicht kannte: `zeichneMarke`
setzt das `<image>` erst nach, wenn die Adresse aus der Ablage da ist —
`outerHTML` gleich danach hätte auch mit erlaubtem `blob:` nichts gehabt.

**Und die Miniaturenleiste wie GoodNotes (E480, test453).** Ein
„⋯"-Menü an jeder Seite und Ziehen zum Umordnen. Das Neue ist nicht das
Menü — es zeigt dieselben acht Griffe wie der Inspector —, sondern dass
sie eine ANDERE Seite meinen als die angesehene: dafür nehmen alle
Seitengriffe jetzt entgegen, wen sie meinen. Gezogen wird mit dem Zeiger,
und die Frage war nicht wie, sondern wann: mit der Maus nach acht Pixeln,
mit dem Finger erst nach 350 ms Halten — sonst liesse sich die Leiste
nicht mehr rollen.

Zwei Dinge erledigten das Bild und die Gegenprobe. Das Bild: das Menü hing
acht Pixel links aus der Leiste, weil es 200 px breit gebaut war und die
Leiste gemessen 200 px misst. Die Gegenprobe: ein Klick-Schlucker liess
sich abschalten, ohne dass etwas rot wurde — er flog wieder heraus, wie
schon die Passprobe in E478. Zweimal in zwei Bögen dieselbe Lehre: wer
eine Vorsichtsmassnahme einbaut, muss sie rot sehen, sonst baut er ein
Gefühl ein.

Nebenbei fiel ein §37-Fund an: der Schliessknopf der Klappen war 36 px
BREIT. `test448` hatte ihn nicht gefunden, weil er nur die Höhe mass — er
misst seither beide Richtungen.

**Und die Verweise treffen die Stelle (E481, test454).** Ein PDF-Ziel
nennt oft nicht nur die Seite, sondern den Punkt darauf (`/XYZ`, `/FitH`,
`/FitR`); genommen wurde bisher nur die Seite, und ein Querverweis mitten
in ein Kapitel landete an dessen Anfang. Die Höhe steht jetzt seit dem
Einlesen am Verweis, und der Sprung rollt dorthin. `/Fit` nennt keine —
und dann steht auch keine da, dieselbe Regel wie in E477.

Dazu der zweite Rest: eine gedrehte Seite zeigte ihre Verweise gar nicht,
und im Code stand eine Zeile, die genau das tat. Der Grund dahinter war
die Bauweise — die Schicht lag NEBEN dem Papier und wurde ihm von Hand
nachgemessen, und bei einer gedrehten Seite misst man ihre Hülle. Statt
eine zweite Rechnung für den gedrehten Fall zu schreiben, ist die Schicht
INS PAPIER gezogen: `inset:0`, dort liegt sie von selbst richtig und
dreht mit. Weniger Code, ein Fall mehr, und nebenbei einen Rahmen
genauer.

**Und die Kamera macht eine Seite (E482, test455).** Zwei kleine
GoodNotes-Griffe: „Foto aufnehmen" — der Unterschied zum Dateiwähler ist
ein Attribut (`capture="environment"`), und am Rechner ohne Kamera kommt
der gewohnte Wähler, was der Hinweis am Knopf auch sagt. Und der Radierer
kennt jetzt fünf Arten: Ganz und Teil sagen, wie viel weggeht, Stift,
Marker und Band, wovon. „Nur Bleistift" bleibt bewusst aus — der
Bleistift ist in Redion kein Werkzeug, sondern ein Stil des Stifts.

**Und die Kurve mit ihrem Griff (E483, test456).** Die erste Form mit
drei Punkten — und sie kostete am Datenmodell keine Zeile: `pts` ist eine
Liste, und `move`, `scale` und `rotate` fassen ohnehin alle Punkte an,
also wandert, wächst und dreht sie sich von selbst richtig. Gezogen wird
sie wie eine Linie; der dritte Punkt kommt beim Absetzen dazu und liegt
in der Mitte, womit die Kurve als Gerade beginnt und der Griff bereitsteht
— genau die Reihenfolge, die man aus GoodNotes kennt. Der Zug am Griff
dreht den Zeiger in die Achsen der Marke zurück, sonst bögen sich gedrehte
Kurven falsch herum.

Der Verbinder bleibt offen, und zwar begründet: er ist keine dritte
Koordinate, sondern eine Beziehung zu zwei anderen Marken.

**Und Treffer und Verweise sitzen genauer (E484, test457).** Zwei
Näherungen, die in L133 als „stimmt ungefähr" standen. Der Suchtreffer
bekam seinen Kasten anteilig nach der ZAHL der Zeichen — bei „iiiiWWWW"
galt „iiii" damit als halbes Stück, obwohl es ein Fünftel ist; gemessen
sitzt der Kasten für „WWWW" bei 13,3 % statt bei 17,8 %, und 13,3 ist
richtig. Und ein Verweis an einem Strich hat jetzt eine Trefffläche —
aber nicht den KASTEN, den L133 vorschlug: ein Bogen über eine halbe
Seite hätte einen Kasten über die halbe Seite, und der finge alles ein,
was daneben steht (dieselbe Lehre wie E476). Stattdessen derselbe Weg,
nur breiter: eine durchsichtige Kopie des Pfades mit 24 Punkten Strich.

Eine Zahl behauptet der Prüflauf absichtlich nicht: wo genau die
Trefffläche endet. Zehn Punkte treffen, zwanzig nicht — die Grenze
dazwischen hängt am Rundungsverhalten des Browsers und wäre irgendwann
rot, ohne dass etwas kaputt ist.

**Und dann ein breiter Lauf (E485).** Nach elf Bögen mit je eigenem
Prüflauf ein Lauf über 68 Prüfungen in drei Stücken — alles, was
`marken.ts`, `document-mode.ts` oder die Stilblätter anfasst. Er fand
EINEN echten Fehler, und zwar einen, den kein einzelner Bogen hätte
finden können: auf einer PDF-Seite ohne Bild lag der Knopf „Aus dem
Original zurückholen" unter der Zeichenschicht und war mit einem Stift in
der Hand nicht zu drücken. Die Seite bot einen Weg an, den es nicht gab.
Der Fehler ist ÄLTER als diese Bögen — derselbe Lauf ist auf dem Stand
davor (in einem eigenen Arbeitsbaum geprüft) genauso rot; er lag nur
ausserhalb jedes Bündels.

Drei weitere rote Läufe waren keine Fehler im Produkt, sondern Prüfungen,
die eine ANZAHL auswendig kannten: der Radierermodus wurde höchstens
dreimal weitergedreht (es sind jetzt fünf), die Formen wurden abgezählt
(es sind jetzt sieben), und die Pixel-Decke musste zwei gewachsene Zahlen
nachtragen. Die Lehre steht im Lauf daneben: wer eine Zahl erfragen kann,
soll sie erfragen.

**Farbsätze (E486, test458).** Der letzte Punkt unter „Zeichnen" in L133.
Ein Farbsatz ist die benannte Abschrift der vier eigenen Tupfer — sichern,
laden, löschen, zurücksetzen. Höchstens acht; der neunte bekommt eine
Absage, statt dass still der älteste verschwindet.

Sie bekamen KEINEN eigenen Knopf, und das hat die Messung entschieden:
`test351` warf den ersten Entwurf um, weil die Zeichenleiste damit in drei
Zeilen stand statt zwei. Nachgemessen fasst die Zubehörzeile bei 596 px
genau vierzehn Knöpfe und war mit vierzehn voll — ein fünfzehnter passt
bei keiner Breite. Also führt jetzt EIN Farbknopf zu allem, was Farbe ist,
mit dem Farbwähler als erstem Eintrag. Das ist zugleich der Weg, den
GoodNotes selbst geht. Die Sätze liegen in `meta` und reisen deshalb in
jeder Sicherung mit, was der Lauf in der echten Sicherung nachsieht.

Der Bogen fand dabei ZWEI ältere Fehler, und keinen davon fand das
Nachdenken. Der erste kam aus dem Prüflauf: die eigenen Tupfer standen
nach dem Wählen einer Farbe verkehrt herum — ein `reverse()` zu viel aus
E351, mit der Folge, dass die soeben gewählte Farbe rechts stand und nach
dem nächsten Neuzeichnen links. Der zweite kam aus dem Bild: mit acht
Sätzen wurde die Wahl 1019 px hoch in einem 900 px hohen Bildschirm, und
weil `.finder` abschneidet, war der letzte Knopf — ausgerechnet „Eigene
Farben zurücksetzen" — nicht anklickbar. Die Wahl rollt jetzt.

Und die Lückenzeile selbst war falsch: sie sprach von „sieben festen
Farben", es sind fünf. Nachgezählt, nicht erinnert (E21).

**Ein roter Lauf ausserhalb des Bogens (§46).** `test265` war rot und
schon vor diesem Bogen: er las den Merker-Knopf als Textzeichen „★" —
E460 hat daraus dasselbe SVG-Band gemacht, das die Kopfleiste führt, und
seither ist der Text leer. Wieder eine Prüfung, die die alte Form
auswendig kannte. Sie misst jetzt, was §38 wirklich verlangt: dass sich
die FORM ändert (`fill` von `none` auf `currentColor`), nicht nur die
Farbe.

**Die Suche über mehrere Dokumente (E487, test459).** Der Schalter „📚" in
der Suchleiste nimmt die anderen Dokumente dazu; ihre Seiten stehen als
Klappe unter der Leiste, mit Name, Seitenzahl und Textausschnitt, und ein
Tipp öffnet das Dokument auf genau dieser Seite und sucht dort weiter. Der
Unterschied ist am Knopf genannt statt verschwiegen: im offenen Dokument
findet die Suche die Stelle, in fremden die Seite — denn die Stelle steht
in der PDF-Textschicht, und die für jedes fremde Dokument zu lesen macht
das Suchfeld unbenutzbar.

Zwei Entwürfe der Klappe hat das BILD widerlegt, nicht der Prüflauf. Der
erste liess die Liste in der Flex-Zeile stehen und drückte das Suchfeld
auf 22 px — 29 grüne Zusagen, und auf dem Bildschirm eine Suchleiste ohne
Suchfeld. Der zweite brach die Zeile um und riss am Telefon die Pfeile
auseinander. Jetzt hängt sie als Klappe darunter, und der Prüflauf misst
die Lage mit.

**Das ganze Dokument als PDF (E488, test460).** Der letzte Punkt unter
„Import und Export" — und er brauchte einen PDF-Schreiber, den es jetzt
gibt: rund hundertfünfzig Zeilen, jede Seite als JPEG in einem
`DCTDecode`-Strom, ohne eine Bibliothek und ohne die Bildbytes je zu
lesen. Nur die Grösse jedes Bildes geht in die Rechnung; ein Dokument mit
hundert Seiten kostet deshalb so viel Arbeitsspeicher wie eines mit einer.

Was er nicht kann, steht am Knopf: das PDF ist die Abbildung des
Dokuments, nicht sein Text. Keine falschen Versprechen (§33).

Der wichtigste Fund kam vom RÜCKWEG, nicht vom Lesen: der erste Entwurf
vergab die Objektnummern ab 1, das erste Bild bekam die 1, und der Katalog
überschrieb sie am Ende. Das PDF ging auf, hatte die richtige Seitenzahl,
die richtigen Masse — und auf der ersten Seite fehlte das Bild. Genau
dafür steht §13: schreiben, zurücklesen, vergleichen. Der Prüflauf macht
das PDF mit Redions eigenem Leser wieder auf und misst einen Pixel dort,
wo ein roter Strich liegen muss.

**Präsentieren mit Laserpointer (E493, test463).** GoodNotes' Presentation
Mode — und die Zeile in `LUECKEN.md`, die ihn für „ausserhalb des PDF-Teils"
erklärte, war falsch: er ist das Zeigen des Dokuments und braucht weder
Server noch Konto noch Netz. Er war mit „Wolken-Abgleich", „Freigabe-Links"
und „Marketplace" in einen Absatz geraten und hatte sich deren Begründung
geliehen.

Gebaut: Vollbild ohne Leisten, eine Seite ganz (die Höhe gibt das Mass),
blättern mit Tipp links/rechts und mit den Tasten eines Vortragspults, und
ein roter Punkt, der dem Zeiger folgt und verglimmt. Der Punkt SCHREIBT
NICHT — das ist der ganze Unterschied zwischen Zeigen und Zeichnen, und der
Prüflauf misst ihn an der Zahl der Marken, nicht am Bild.

Drei Funde kamen vom Bild: die Stiftleiste stand mitten in der Präsentation
(sie heisst `.blatt-reihe`, nicht `.blatt-werk`), der Beenden-Knopf war
weisser Text auf weissem Papier, und die Seite lief unten aus dem Fenster.
Einen fand der Prüflauf: `setPointerCapture` warf und brach damit den Rest
des Handlers ab.

**Was auf dieser Seite gesperrt ist (E492, test462).** Eine Liste im
Inspector — und sie schliesst mehr als eine Lücke in der Oberfläche.
Sperren ging über die AUSWAHL, und eine gesperrte Marke lässt sich nicht
mehr auswählen: die Sperre liess sich anlegen und nicht mehr lösen. Ein
Rundlauf ohne Ausgang.

Zwei Funde kamen vom Bild, nicht vom Prüflauf: auf dem ersten Bild hiessen
zwei Zeilen beide „Linie" (die eine war der Schutzleiter) — jetzt steht der
Stil dabei. Und weil auch dann zwei gleiche Linien gleich heissen, leuchtet
die Marke auf dem Papier auf, sobald man ihre Zeile berührt oder mit der
Tastatur erreicht.

**Der Stift, wie Redur ihn wollte (E490, test461).** Drei Sätze und ein
Bild von ihm: die gehaltene Linie soll gerade werden, es braucht eine
Schutzleiter-Farbe grün-gelb mit Strich-Punkt, und das Zurücknehmen gehört
nach links wie bei GoodNotes.

Der erste Punkt war ein echter Fehler, und zwar seit E355: „am Ende kurz
halten" setzte die Uhr bei JEDEM aufgezeichneten Punkt zurück. Eine Hand,
die einen Stift ruhig hält, zittert aber — mit der Maus ging es, mit
Finger und Stift so gut wie nie. Der Strich hat jetzt einen Ruhepunkt;
gezählt wird erst, wenn der Zeiger ihn verlässt.

Bevor an der Formerkennung etwas gelockert wurde, wurde gemessen: eine
Linie darf bis ±12 Einheiten zittern und wird trotzdem erkannt. Also blieb
sie, wie sie war (§36).

Der Schutzleiter ist zweimal derselbe Weg — unten grün, darüber gelb als
Strich-Punkt —, und das Bild hat das Muster zweimal korrigiert: die runden
Strichenden verlängern jeden Strich um eine Strichbreite, und der erste
Entwurf war deshalb fast ganz gelb.

**Ein Fund nebenbei (E489).** Beim Suchen nach Namen für die Markenarten
kam heraus, dass der Radiermodus „Band" aus E482 **nie etwas radiert
hat**: er verglich gegen `art: 'band'`, und das Abdeckband heisst als
Marke `abdeck`. Aufgefallen war es nicht, weil `test455` sich seine
Prüfmarke selbst gebaut hatte — mit der Kennung des Modus statt der der
Art. Ein Prüflauf, der seinen Bestand selbst baut, muss ihn bauen wie die
App; sonst prüft er eine Erfindung.

**Was offen bleibt,** steht ehrlich in `LUECKEN.md` L133: Audio mit
Zeitbezug, Handschrift zu Text, GIPHY, DOCX/PPTX, Wolke — und
die verbliebenen Reste (getippter Text im gesicherten Bild und ein PDF mit
echter Textschicht, Verbinder, Auswahl über mehrere Blätter, das Umordnen
über mehrere Spalten, die Vorlagenseite mit Inhalt, mehrseitige Notizhefte
als EIN Block, „Ausschnitt" und „Erkennen" im Zoom-Fenster, die
Schalensuche mit Stellen).

**Die Elemente-Bibliothek (E494, test464).** Und dieselbe Lehre wie beim
Präsentieren, zwei Bögen später: die Zeile in `LUECKEN.md`, die sie unter
„wird Redion nicht haben" führte, begründete das mit „wäre neu". Das ist
keine Begründung, sondern eine Beschreibung — neu ist jede Funktion, bevor
sie da ist. Wiederverwendbare Marken sind in Redion ausserdem nichts Neues:
es sind dieselben, die die Zwischenablage seit E353 kopiert, nur überleben
sie das Dokument.

Gebaut: das zwölfte Werkzeug ⭐, „Als Element" bei der Auswahl als einziger
Weg hinein, ein Feld von Kacheln mit dem Bild jedes Elements, und der
Stempel mittig unter dem Zeiger — der erste Tipp öffnet die Bibliothek,
jeder weitere setzt dasselbe wieder. Sie liegt in `meta` und reist damit in
jeder Sicherung mit, ohne dass am Sicherungscode etwas zu tun war.

Vier Funde, und keiner kam vom Lesen: der Typ hiess `Element` und verdeckte
damit die DOM-Klasse (achtzehn Fehler in Zeilen, die niemand angefasst
hatte); `--danger` und `--bg-2` gibt es nicht (§39, viertes Mal); der Kasten
einer Marke beginnt nicht an ihrem ersten Punkt, sondern eine halbe
Strichbreite davor; und ein Knopf mass 43,34 px, weil das Fenster beim
Messen noch einfuhr.

Und ein Fund ausserhalb: `test348 §5` war seit E486 rot, ohne dass es
jemandem aufgefallen wäre. `test343` hatte den Nachtrag bekommen, `test348`
nicht — ein Prüflauf, den niemand laufen lässt, meldet seinen Fund nicht
von selbst.

**Cornell und Notenlinien (E495, test465).** Zwei Papiere aus GoodNotes'
Vorlagenwähler, und in Redion das, was jedes Papier ist: reine Darstellung
(E100) — ein Feld am Block, Verläufe im Stilblatt. Fünf Wechsel hin und her
lassen Text und Marken unangetastet, und der Prüflauf zählt danach nach.

Cornell braucht sechs Schichten, weil CSS keinen Verlauf kennt, der nur in
einem Ausschnitt gilt: die Spaltenlinie läuft ganz durch und wird oben und
unten mit zwei Bändern in Papierfarbe wieder zugedeckt. Die Bänder nehmen
`var(--paper)` und nicht Weiss — das Papier ist `#f8f8f5`, und ein weisses
Band stünde als hellerer Streifen darauf.

Der Fund des Bildes ist der Satz, um den es hier geht: **Prozentzahlen in
einem Verlauf beziehen sich auf die Kachel, nicht auf das Element.** Die
Notenabstände standen in Prozent des Blattes — 3 mm sind dort rund 1 %, und
1 % einer 27-mm-Kachel ist ein viertel Millimeter. Alle fünf Linien fielen
aufeinander, und auf dem Papier stand eine Linie je System. Kein Prüflauf
hätte das gemeldet: beide Fassungen zeichnen Linien, nur die falsche
zeichnet die falschen.

Isometrisches Papier hat GoodNotes und Redion bekommt es nicht — mit
geschriebenem Grund im Quelltext, damit niemand es „schnell noch dazu"
macht: ein schräger Verlauf misst seinen Abstand senkrecht zur Linie, und
in Prozent einer Fläche ändert der sich mit dem Seitenverhältnis.

**Eine Seite in ein anderes Dokument (E496, test466).** GoodNotes hat
„Copy to…" und „Move to…"; Redion hatte Verdoppeln und Löschen. Wer eine
Seite aus dem Skript in seine Mitschrift holen wollte, sicherte sie als
Bild und fügte sie wieder ein — danach war sie ein Foto ohne Marken und
ohne Textschicht.

Kopieren und Verschieben sind nicht dasselbe mit einem Häkchen: Kopieren
gibt frische Kennungen und ein eigenes Seitenbild, Verschieben hängt
denselben Block um und behält seine Kennung. Ein Verweis auf eine Seite
zeigt auf ihre Kennung — wäre Verschieben ein Kopieren mit anschliessendem
Löschen, zeigte danach jeder Verweis in den Papierkorb.

Die Reihenfolge beim Verschieben ist die ganze Sicherheit: erst in die
neuen Eltern legen, dann umhängen, zuletzt aus den alten nehmen. Bricht
etwas dazwischen ab, steht die Seite in beiden Dokumenten statt in keinem.

Der Fund kam vom Prüflauf, nicht vom Lesen: die erste Fassung fragte das
Rechtetor mit `darf('edit', …)`. `edit` ist der Name einer Rolle; die Frage
heisst `bearbeiten`. Das Tor sagte auf jeder Seite nein, und die Funktion
meldete „Es gibt kein anderes Dokument" auf einem Gerät mit vier
Dokumenten — keine Warnung, nur eine falsche Auskunft, die plausibel
aussah. Deshalb klickt `test466` den Weg wirklich, statt die Funktion
aufzurufen: ein Prüflauf, der sie direkt riefe, hätte denselben Fehler
mitgemacht.

**Der breite Lauf nach den vier Bögen (E497).** Gefahren wurde, was die
geänderten Bausteine anfasst — jede Suite, die `blatt-werk`,
`blatt-marken`, `document-workspace`, `Marken.`, `DocumentMode`,
`blatt-papier` oder `Dialog.` erwähnt. Es sind 84, gefahren in Stücken.

Zwei echte Fehler, und beide stammen NICHT aus diesen Bögen: das
Abdeckband hiess in der Blattleiste „Abdeckband" und im Menüband
„Abdecken" (seit die Werkzeugliste zusammengezogen wurde), und „Zurück"
und „Vor" rollten am Telefon aus dem Bild, weil E490 sie an den Anfang der
Leiste gestellt hat, die Klebe-Regel aber weiter `right:0` sagte — ein
sticky-Element hält dort nur, wenn es nach RECHTS hinauswandern würde.

Dazu acht Suiten, die nur ihre Zahlen nachziehen mussten (sieben Papiere,
zwölf Werkzeuge, fünf Stifte, zwölf Seitengriffe).

Die Lehre steht damit zum dritten Mal in diesem Bündel: `test266` war rot
seit der Werkzeugliste, `test348` seit E486, `test393` und `test438` seit
E490. Vier Suiten, vier Wochen, keine hat sich gemeldet — ein Prüflauf, den
niemand fährt, meldet nichts. Ein Lauf über die betroffenen Bausteine
gehört ans Ende jedes Bündels.

**Die zwei letzten Reste (E498, test467).** „Ausschnitt" und „Erkennen"
gelten der ganzen Seite; im Zoom-Fenster sieht man einen Streifen davon.
E470 hat deshalb schon nein gesagt — aber erst nach dem Druck, als Meldung.
Ein Knopf, der aussieht, als ginge er, und dann eine Absage gibt, muss
zweimal gelesen werden. Jetzt steht der Zustand am Knopf, mit einem
Hinweis, der sagt warum; die Meldung bleibt für den Weg über Tastatur und
Befehlspalette.

Und Seiten wandern über Spaltengrenzen. `seiteAnStelle` sagte nein, wenn
die Seiten eines Dokuments in mehreren Spalten liegen — ehrlich, solange es
keinen Weg gab, einen Block umzuhängen. Seit E496 gibt es ihn, und es ist
derselbe, mit derselben Reihenfolge: erst dazulegen, dann umhängen, zuletzt
wegnehmen.

Beim Abarbeiten kam heraus, dass drei Zeilen in L133 gar keine Lücke
gegenüber GoodNotes sind: dessen Formenwerkzeug hat auch keine Verbinder,
sein Lasso gilt auch je Seite, und seine drei Stift-Favoriten sind
Farb-Voreinstellungen — die hat Redion seit E486 als benannte Farbsätze.
Alle drei stehen weiter da, aber als Wunsch statt als Rückstand.

**Ein mehrseitiges Blatt in Seiten zerlegen (E499, test468).** Die letzte
offene Zeile unter „Seiten" in L133. In GoodNotes ist jede Seite eine
Seite; Redions mehrseitiges Blatt ist eine eigene Form — und sie ist nicht
falsch, sie ist genau das, was ein Heft ist. Falsch war nur, dass die
Seitengriffe mit ihr nichts anfangen konnten.

Also nicht die Form abgeschafft, sondern einen Griff gebaut: aus einem
Blatt von drei A4 werden drei Blätter von je einem. Jede Marke kommt auf
die Seite, in der ihre Mitte liegt, und bleibt ganz — kein Strich wird
geschnitten. Was über eine Seitengrenze läuft, ragt danach über den Rand
hinaus und ist dort nicht mehr zu sehen (das Papier schneidet); verloren
ist es nicht, und der Dialog sagt es mit Zahl, bevor etwas geschieht.

Die Reihenfolge ist zum dritten Mal in diesem Bündel dieselbe: erst die
neuen Blätter mit ihren Marken anlegen, dann das Original kürzen.
Andersherum wären die Seiten zwei bis n weg, bevor es sie gibt.

**Die Schalensuche findet die Stelle (E500, test469).** Strg P fand Seiten;
bei einem Skript mit zweihundert PDF-Seiten landete man damit auf Seite eins
und musste dort ein zweites Mal suchen. Jetzt steht „Seite 3" in der Liste,
darunter der Ausschnitt der Stelle, und ein Tipp öffnet das Dokument dort.

Das Grössere kam beim Bauen heraus: Text auf einem Blatt steht in einer
MARKE, und Marken stehen in keinem Suchindex. Ein Heft, in dem „Knotensatz"
handschriftlich als Textmarke steht, war über Strg P überhaupt nicht zu
finden — im Studio (E487) längst. Der zweite Zweig holt diese Treffer dazu,
und zwar nur bei einer reinen Wortsuche: wer an der Abfragesprache
vorbeigeht, geht auch an ihren Filtern vorbei (E175).

Die Gegenprobe hat einen Fehler verhindert, der schon geschrieben war: der
erste Entwurf baute in `zumTreffer` einen eigenen Sprungweg ins Dokument.
Ohne ihn blieb der Punkt grün — `zeigeBlock` kann das längst und macht es
dabei richtiger. Er ist wieder weg; neu ist einzig, dass ein Treffer eine
`blockId` mitbringt.

Und das Bild fand den Ausschnitt: die Abfragesprache schnitt aus dem Text
der ganzen Seite, bei einem Dokument also aus allen Seiten hintereinander —
mitten im Wort („…trom Kapitel 2 —"). Jetzt gewinnt der Ausschnitt der
Stelle.

**Ein Farbsatz wird eine Voreinstellung (E501, test470 §1–§3).** Das
Dossier verlangt „Farben und Stärken … als Presets". Redion hatte seit
E458 die Farben unter einem Namen; die Stärke und der Stift fehlten. Wer
zum Korrigieren einen dünnen roten Kugelschreiber wollte und zum
Markieren einen dicken Füller, holte die Farben zurück und stellte den
Rest jedes Mal neu.

Kein zweiter Katalog daneben (§8), sondern zwei optionale Felder am
vorhandenen Satz. Optional ist die Rückwärtsregel: ein Satz aus der Zeit
davor lädt weiter genau seine Farben und verspricht auch nichts anderes —
der Hinweis in der Liste nennt Stift und Stärke nur, wenn der Satz sie
trägt.

Der Fund kam ungeplant und war grösser als die Aufgabe: eine
Strichstärke steht an VIER Orten — in der Fläche, in `Zeichenziel`, in den
Stufenknöpfen und im Regler. Der erste Entwurf setzte den ersten, und der
Prüflauf las danach 1,2 statt 5. Regler und Stufenknöpfe hatten je ihre
eigene Abschrift derselben vier Zeilen; jetzt gibt es `strichSetzen` als
eine Tür, und alle drei Wege gehen hindurch.

**GIF und Formelbuch als Marke (E502, test470 §4–§6).** Redurs Satz war
„das ich gifs und mein Formelbuch hier einfügen kann und so kleiner
grösser machen kann, verschieben kann" — und beides ging nicht so, wie er
es meinte.

Ein GIF kam durch `image/*` zwar herein, aber geprüft war nie, dass es als
GIF liegen bleibt. Jetzt hält der Prüflauf fest, dass die Datei mit ihrem
Typ und ihrer Länge in die Ablage geht; damit läuft die Bewegung auf dem
Blatt weiter, statt als Standbild dazustehen.

Eine PDF liess sich bis hierher nur als SEITEN einfügen (E469) — richtig
für ein Skript, falsch für eine Formelsammlung, von der man EINE Seite
neben die Aufgabe legen will. Als Bildmarke ist sie beides: verschieben,
an den Ecken ziehen, drehen und sperren kann sie dieselbe Auswahl wie
jede andere Marke. Es brauchte kein neues Werkzeug und keine neue
Markenart — nur einen zweiten Weg in `bildAblegen` hinein. Gerastert,
nicht eingebettet (wie E488): der Text darin ist danach nicht mehr
durchsuchbar, dafür braucht das Blatt beim Öffnen keine fremde
Bibliothek.

**Das eigene Formelheft über dem Dokument (E503, test471).** Redur wollte
sein Original beim Arbeiten am Dokument sehen — dort, wo die Fachzeichen
stehen —, es schieben, in der Grösse ziehen und ein- und ausschalten. Das
Formelheft gab es seit E194 samt „Mein Heft" für die eigene PDF; den Weg
dorthin gab es nur über die Befehlspalette und die Planfläche. Jetzt steht
ein Knopf neben dem Fachzeichen, und das Heft merkt sich, dass es
aufgeschlagen war — bis hierher bekam man beim nächsten Öffnen wieder das
Kapitelverzeichnis.

Drei Fehler kamen dabei heraus, und keinen davon hätte ein Bildschirmfoto
gemeldet:

Der Griff zum Ziehen war seit jeher weg. `male()` schreibt `innerHTML` neu
und nahm das Dreieck unten rechts jedes Mal mit; angehängt wurde es einmal
beim Öffnen, gleich darauf malte das Fenster. Das Heft liess sich also nie
in der Grösse ändern, obwohl der Zieh-Griff funktionierte und `M_ORT` sogar
Breite und Höhe merkte.

Das Fenster legte sich auf den Knopf, der es öffnet. Die Vorgabe von 90 px
stammt aus der Zeit vor dem Studio; dort stehen jetzt zwei Leisten.
Aufgehen ging noch, zugehen nicht. Der untere Rand der Leiste wird jetzt
gemessen statt geraten.

Und der Horcher meldete sich vor seinem ersten Ruf wieder ab, weil er am
Knopf statt am Arbeitsraum prüfte, ob er noch im Baum hängt.

Was das Heft NICHT tut: in die geladene PDF schreiben. `test471` §5 rechnet
vorher und nachher eine Prüfsumme über die Bytes und vergleicht Kennung,
Länge, Summe und Typ — ein Wächter nicht gegen einen bekannten Fehler,
sondern gegen einen künftigen.

**Was das Stift-Dossier gefunden hat (E504, test472).** Redur hat ein
22-seitiges technisches Dossier über digitale Stifte und PDF-Annotationen
mitgebracht und „schau mal das genauer an" gesagt. Geprüft wurden
einundzwanzig Punkte, jeder von einem zweiten Durchgang gegengelesen, der
ihn widerlegen sollte.

Fünf Punkte standen bereits, und zwar sauber: coalescierte Samples landen
wirklich im gespeicherten Strich (nicht nur im Bild), Vorhersagepunkte
gehen nie in die Daten, die Drehung wird als affine Matrix gerechnet statt
mit vertauschten Achsen, das PDF wird neu geschrieben statt angehängt, und
ein drucksensitiver Strich ist eine Kontur mit variabler Breite.

Zwei waren echte Fehler.

Der erste war nicht zu sehen, nur zu rechnen: der Glätter war pro MESSUNG
normiert, nicht pro ZEIT. Die Zeitkonstante eines solchen Filters schrumpft
mit der Abtastrate — auf einem 240-Hz-Stift war er viermal schwächer als
auf dem 60-Hz-Gerät, an dem seine drei Zahlen gemessen wurden. Der Prüflauf
fährt dieselbe physische Bewegung mit drei Raten ab: vorher 3,467 / 1,734 /
0,867 px Rückstand, nachher dreimal 5,760. Und beim Beheben kam die zweite
Hälfte heraus: das Tempo wurde aus dem Abstand zum GEGLÄTTETEN Punkt
gerechnet, also aus einem Ergebnis des Filters selbst; von Eingabepunkt zu
Eingabepunkt gemessen ist es die Geschwindigkeit der Hand.

Der zweite ist Alltag: `pointercancel` hing am selben Griff wie
`pointerup`. Berührt der Handballen das Glas vor dem Stift — so setzt jede
Hand auf — und erkennt der Browser ihn als Palm, schrieb Redion einen
Fremdstrich. Verworfen wird jetzt, was ein Finger war; ein abgebrochener
Stift-Zug bleibt, weil §51 über jedem Dossier steht.

Und ein Fund an einer alten Prüfung: `test343` wurde rot, obwohl die Fläche
am Druckgipfel messbar dicker geworden war. Die Zusage hing an einem
Probepunkt in festem Abstand und prüfte ein Gehrungsartefakt statt der
Breite. Der erste Reparaturversuch war eine Tautologie — die Gegenprobe mit
festem Druck blieb grün, weil verglichen wurde mit dem ersten Punkt, und
dort läuft jede Kontur aus.

**Die ungeprüfte Zusage und der halbe Satz (E505, test473).** Zwei weitere
Punkte aus dem Stift-Dossier, und beide sind keine Fehler im Code, sondern
Löcher daneben.

CropBox und `/Rotate` rechnet Redion richtig — es fragt pdf.js nach dem
Viewport, und der kennt beides. Nur trug keine einzige der rund zwanzig
Prüf-PDFs je eines von beidem. Jetzt gibt es eine mit einem Papier von
800×1000 und einem Ausschnitt von 600×800, dessen Ursprung nicht bei null
liegt, zweite Seite mit `/Rotate 90`. Gemessen wird an echten Pixeln: ein
schwarzes Quadrat, das im Papier bei (60|840) steht, muss im Ausschnitt bei
(10|20) landen. Es stimmt alles — und die Gegenprobe, die Geometrie aus der
MediaBox statt aus dem Viewport zu holen, macht sechs Zusagen rot.

Der PDF-Export sagte die halbe Wahrheit, und nur im `title`: er nannte den
verlorenen Suchtext, nicht die verlorene Bearbeitbarkeit — und am Telefon
gibt es kein Hover, dort erfuhr also niemand etwas. Jetzt steht der Satz
sichtbar unter dem Knopf, mit beiden Hälften: was das PDF verliert, und
dass Original und Marken in Redion bleiben. Die zweite Hälfte ist so
wichtig wie die erste; eine Warnung ohne Entwarnung macht Angst, wo keine
hingehört.

**Handschrift wird eine echte /Ink-Annotation (E506, test474).** Der
Schlusssatz des Stift-Dossiers verlangt, Roh-Ink und PDF-Ink als zwei
Datenmodelle zu behandeln: das eine reich und plattformspezifisch, das
andere eine standardisierte `/Ink`-Annotation plus explizites Appearance.
Redions Export war bis hierher das Gegenteil — ein JPEG je Seite, die
Handschrift Teil des Bildes. In Adobe Reader stand unter „Kommentare"
nichts.

Jetzt geht je Handschrift-Marke ein Annotation-Dictionary heraus: `/Rect`,
`/InkList` mit der Mittellinie im Default User Space, `/C`, `/CA`, `/BS`,
das Druck-Kennzeichen `/F 4` und ein `/AP`-Erscheinungsbild, das die
Kontur mit veränderlicher Breite füllt. Beides zusammen und keines allein:
ohne `/AP` verbindet jeder Leser die Punkte anders, ohne `/InkList` wäre
es ein Stempel statt Handschrift.

Annotation wird nur, was Handschrift IST — Stift und Marker. Das
Abdeckband bleibt mit Absicht im Bild: eines, das der Empfänger
wegschieben kann, deckt nichts ab, und im Bild sind die Pixel darunter
wirklich weg. Formen, Text, Zettel und Bilder brauchen `/Square`,
`/FreeText` und `/Stamp` und stehen als eigene Bögen in `LUECKEN.md`.

Die Kontur wird nur EINMAL gerechnet: `seiten()` liefert die beiden
Kanten, `outline` macht daraus einen SVG-Pfad mit Bögen, `outlinePunkte`
ein Vieleck mit acht Punkten je Kappe — PDF kennt keine Bögen. Und die
Breitenregel bleibt in `marken.ts`, wo auch der Bildschirm sie holt; eine
zweite Rechnung im Export liefe von dieser weg.

Geprüft wurde an zurückgelesenen Bytes: das PDF wird mit pdf.js wieder
geöffnet, nach seinen Annotationen gefragt und die Seite ZWEIMAL
gerendert — einmal ohne Annotationen, wo der Strich fehlen muss, und
einmal im Druckweg, wo er rot dastehen muss. Der Unterschied zwischen
beiden Bildern ist der Beweis.

Und ein Fehler, der hierher gehört: beim Zurückdrehen einer Gegenprobe
habe ich `git checkout` auf `marken.ts` gerufen und die noch nicht
eingecheckten Änderungen dieses Bogens weggeworfen. Wiederhergestellt und
grün — aber die Regel aus §43 gilt für die einzelne Datei genauso wie für
`git restore .`.

**Die Neigung des Stifts (E507, test475).** Von allem, was Pointer Events
über einen Stift sagen können, las Redion die Neigung nicht — `tiltX`,
`tiltY`, `twist`, `altitudeAngle`, `azimuthAngle` kamen im ganzen `src/`
kein einziges Mal vor. Wer den Apple Pencil flach hielt, um zu
schattieren, bekam denselben schmalen Strich wie bei senkrechtem Stift.

Jetzt wird der Winkel Punkt für Punkt mitgeschrieben und wirkt auf den
Bleistift: flach gehalten liegt mehr Graphit auf dem Papier, bis zum
Doppelten der Breite, und dieselbe Menge auf mehr Papier ist heller.
Gemessen bei gleichem Druck: 1,8 pt senkrecht gegen 3,3 pt flach. Nur der
Bleistift — ein Füller wird durch Schräghalten nicht breiter.

Wer keinen Winkel meldet, bekommt kein Feld: eine Maus, ein Finger und ein
Stift ohne Sensor lassen `neigung` weg, statt Nullen zu erfinden. Eine
alte Marke sieht deshalb aus wie immer.

Der Fund kam im ersten Lauf des Prüflaufs: das Vereinfachen beim Absetzen
indiziert `pressure` neu, und das neue Feld blieb in seiner alten Länge
stehen — fünfzehn Neigungen zu acht Punkten. Von Hand wäre das nie
aufgefallen, weil die Wirkung erst bei schneller Handbewegung sichtbar
wird.

Und der Druck sagt jetzt, woher er kommt: `druckArt` unterscheidet den
gemessenen Sensordruck vom Tempo-Ersatz für Maus und Finger. Bis hierher
lagen beide im selben Feld nebeneinander, ununterscheidbar.

**Der Blick kommt beim Hinschauen (E508, test476).** Redur hat zwei Bilder
der Ordnerkarte geschickt und gesagt, sie solle beim Überfahren mit der
Maus kommen statt beim Klicken — und ein bisschen lustig sein.

Beides, nicht statt: eine erzeigte Karte geht wieder zu, wenn der Zeiger
fortgeht, eine angetippte bleibt. §37 nennt das Telefon den Normalfall,
und dort gibt es kein Überfahren. Zwischen „hilfreich" und „springt mich
an" liegen 280 Millisekunden; beim Fortgehen sind es 220, und die dürfen
nicht null sein, weil der Weg vom Knopf in die Karte für einen Augenblick
über nichts von beidem führt.

Das Lustige: die fünf von Hand gewählten Verzugszeiten sind einer Zahl
gewichen, aus der sich alle rechnen — beim Nachrechnen war der mittlere
Schritt halb so gross wie die anderen, es sah aus wie eine Welle und war
keine. Dazu ein Überschwingen von 14 %, eine Klappe, die einmal wippt, und
ein Blatt, das sich aufrichtet, wenn man darauf zeigt. Alles weg bei
`prefers-reduced-motion`.

Der grösste Fund war am Prüflauf selbst: drei seiner Zusagen waren vor der
Arbeit schon grün. „Ein Blatt hebt sich" suchte eine CSS-Regel, die es seit
E459 gab; „ein bisschen Schwung" fand ein fremdes `@keyframes`; und „ein
kurzes Überstreichen öffnet nichts" sah erst nach dem Weggehen nach — da
ist die Karte auch ohne Wartezeit wieder zu. Alle drei messen jetzt im
richtigen Augenblick, mit der echten Maus.

**Ein Stift für Fachzeichen (E509, test477).** Redur hat ein Bild der
Farbreihe geschickt: der Schutzleiter solle dort stehen wie eine Farbe und
beim Überfahren seinen Namen sagen — und die anderen Farben auch. Dazu ein
eigener Stift, „speziell für Fachzeichen gedacht", mit den Adern eines
Schaltplans.

Es sind zehn geworden: PE grün-gelb und strichpunktiert (der Stift aus
E490, unverändert), N blau und mit NUR Strichen — Redur hat es zweimal
gesagt —, L1 braun, L2 schwarz, L3 grau, S orange für den Lampendraht, und
vier weit auseinanderliegende Töne für die Korrespondierenden 1 bis 4. Fünf
davon stehen in der Norm, fünf habe ich gewählt, und in E509 steht, warum
genau diese.

Der Stift steht am ENDE der Reihe. Füller → Kugel → Pinsel → Bleistift ist
der Weg, den eine Hand sich gemerkt hat; ein neuer Stift in der Mitte hätte
jeden zweiten Klick woandershin geführt.

Nebenbei heissen jetzt auch die fünf gewöhnlichen Farben beim Namen. An
ihnen stand fünfmal `title="Farbe"` — ein Vorleser las fünfmal dasselbe
Wort.

Drei Fehler auf dem Weg. Die Adernreihe schaltete nur beim Stiftwechsel um,
nicht beim Öffnen: wer Redion mit dem Leiterstift schloss, sah die alten
Farben und einen Stift, der etwas anderes zeichnet. **Gefunden hat es das
Bild**, nicht der Prüflauf — der klickte sich zum Stift durch und löste den
Wechsel damit selbst aus. Der zweite: mein Einschub zerschnitt eine
mehrzeilige CSS-Regel, und die Zusage konnte es nicht sehen, weil sie nach
der Klasse fragte statt nach der Sichtbarkeit. Der dritte: L2 ist dasselbe
Schwarz wie der erste Farbtupfer, und die Hervorhebung verglich Farben.

**Die Mitte einer Linie zählt auch (E510, test439).** Bei der
Regressionsrunde danach war `test439` rot — und zwar auch auf dem Stand
davor. Gebrochen hatte es E504 aus demselben Durchgang: seit dort glättet
der Filter in Zeit, und die Zeigerereignisse eines Prüflaufs kommen alle in
derselben Millisekunde. Der Filter liest das als eine Hand mit 20 px je
Millisekunde und lässt den Zug entsprechend nachlaufen — auf echter
Hardware sind es 1,7 px statt 28.

Der eigentliche Fund lag tiefer. Die Hälfte-Regel des Kritzel-Radierers
zählte die GESPEICHERTEN Punkte einer Marke: ein Strich hat hunderte, eine
gerade Linie zwei — ihre Enden. Ein Gekritzel quer über die Mitte einer
Linie nahm sie deshalb seit E466 nie weg, egal wie dicht. Jetzt wird an der
Länge gemessen. Und daneben steht die Gegenzusage, dass ein kurzes
Gekritzel am Rand die Linie NICHT wegnimmt — eine Reparatur am Löschen darf
nicht mehr löschen (§51).

**Die Tinte holt die Spitze ein (E511, test478).** Redur wollte flüssiger
zeichnen können und mehr Bewegung.

Gemessen wurde zuerst, und die naheliegende Vermutung war falsch. Ein Zug
über 1200 Punkte auf einem Blatt mit 200 Marken läuft flach bei 16,7 ms je
Bild — vom ersten Drittel bis zum letzten, kein einziger Aussetzer über
20 ms. „Schneller" wäre Arbeit an etwas gewesen, das bereits sechzig Bilder
in der Sekunde hält.

Auf dem Weg dahin noch ein zweiter Messfehler, der aufgeschrieben gehört:
dieselbe Messung ohne echte Bilder dazwischen sagte für `getScreenCTM`
15 % der Zeit, mit Bildern 45 %. Der Browser merkt sich die Matrix,
solange nichts schmutzig ist — und beim echten Zeichnen ist es das. Eine
Messung ohne das, was gemessen werden soll, misst nichts.

Was ein Mensch als „nicht flüssig" fühlt, ist etwas anderes: WO die Tinte
liegt, während er schreibt. Bei 0,4 px je Millisekunde — dem Tempo der
Handschrift — lag die gezeichnete Spitze 7,16 px neben der Stelle, an der
der Stift beim Erscheinen des Bildes wirklich ist. Und der Fehler wechselte
mit dem Tempo das Vorzeichen: langsam blieb die Tinte zurück, schnell
schoss sie voraus.

Der Grund war, dass die Vorhersage die GEGLÄTTETEN Punkte verlängerte. Die
laufen selbst hinter der Hand her — das ist der richtige Preis der
Glättung, sie nimmt das Zittern —, und der Vorlauf ging für den Nachlauf
drauf. Jetzt rechnet der nasse Schwanz an den rohen Punkten und beginnt an
der zuletzt gemessenen Stelle: vor der Vermutung steht eine Messung. Der
Fehler ist bei drei von vier Tempi auf null; beim vierten bremst die
26-px-Grenze mit Absicht.

Erlaubt ist das nur, weil der Schwanz nie gespeichert wird. Der abgelegte
Strich endet dort, wo der Stift abgehoben hat — das ist die Zusage, die
alles andere trägt, und sie steht jetzt als eigene im Prüflauf.

Nebenbei fiel auf, dass jeder Punkt beim Zeichnen zweimal umgerechnet
wurde und eine der beiden Zahlen weggeworfen wurde. Sie ist weg. Schneller
wurde es davon nicht messbar — der zweite Aufruf war fast umsonst —, und
auch das steht in E511, damit niemand später misst und sich wundert.

Dazu vier Bewegungen, und jede sagt etwas: der gewählte Stift kippt, wie
wenn man ihn aus dem Kasten nimmt; die Adernreihe kommt als Welle herein;
ein angetippter Farbtupfer klekst; der Radierkreis läuft, solange radiert
wird. Alles davon ist bei `prefers-reduced-motion` weg.

Zwei Funde des Prüflaufs: die GEWÄHLTE Ader flog nicht mit herein, weil
der Klecks an derselben Klasse hing wie die Auswahl — ausgerechnet der
Tupfer, auf den man schaut, blieb stehen. Und die Zusage „alle Schritte
der Welle sind gleich gross" war auch dann wahr, wenn alle null sind; sie
blieb in der Gegenprobe grün, bis „grösser als null" dazukam.

**Die Leiste wie GoodNotes, und eine Fläche, die nicht mehr stirbt (E512,
test479 + test480).** Redur hat vier Sachen geschickt: drei Wünsche und
einen Fehlerbericht. Der Fehler ging vor.

Nach ein paar Minuten zeichnete nichts mehr — weder Stift noch Maus, und
nur Neuladen half. Gemessen wurde zuerst gegen die naheliegende Vermutung:
alle zehn wiederkehrenden Uhren der App einzeln ausgelöst und danach
gezeichnet; jede unschuldig. Auch dreissig Runden mit Seitenwechsel und
Neuzeichnen blieben grün.

Es lag an einem einzigen verlorenen Ereignis. Die Kennung des führenden
Zeigers — seit E354 der Schutz gegen den zweiten Finger — bleibt stehen,
wenn für ihn nie ein Abheben ankommt. Danach weist die Fläche jeden anderen
Zeiger ab, für immer. Jetzt wird das Ende auch am Fenster gehört, und wer
aufsetzt, während der Führende eine halbe Sekunde geschwiegen hat,
übernimmt — der alte Zug wird dabei abgeschlossen, nicht weggeworfen.

Die halbe Sekunde ist gemessen: ein Eindringling setzt acht Millisekunden
nach der letzten Bewegung auf, ein Mensch, der neu tippt, braucht länger
als eine halbe.

Dann die drei Wünsche. Die **Stiftreihe** ersetzt den Wechselknopf: sechs
Knöpfe, ein Tipp je Stift, links vor den Farben — dort, wo Redur sie haben
wollte. Der alte Rundlauf ist nicht weg, er liegt auf der Taste P. Der
**Laserpointer** ist jetzt ein Werkzeug statt eines Vollbild-Sonderfalls,
mit Punkt und Linie, und er schreibt nichts: keine Marke, kein Schritt im
Verlauf. Und die **Leiste lässt sich verschieben** — oben, links, rechts
oder unten in der Mitte.

Gefunden hat das Bild wieder etwas, das kein Prüflauf sehen konnte: die
Seitenleiste war im ersten Wurf ein zwanzig Pixel breiter Streifen, weil
eine absolut gesetzte Flexbox auf ihren Inhalt schrumpft und der Inhalt
`min-width:0` hat.

Was es kostet, steht in L137: oben braucht die Leiste jetzt drei Zeilen
statt zwei, und am Telefon liegt die erste Farbe hinter den Stiften.

**Die Chronik „Red-ur" (E514, test481).** Redur wollte ein zweites Gehirn:
zwei Dateien mit allem, was passiert ist und warum — und dasselbe in Redion
sichtbar, hinter einem Code, mit Graphen und 3D.

Der Auftrag nennt drei Orte für dieselbe Sache, und das ist die
Gelegenheit, zwei Wahrheiten zu bauen. Also liegt die Wahrheit in einer
Datei, und ein Skript schreibt daraus UR.md, PROBLEME.md und die Daten für
die App. Ein Prüflauf sagt, wenn sie auseinandergelaufen sind.

In UR.md steht alles über Redur, wie hier gearbeitet wird und warum so —
und für jeden Tag: seine Nachrichten Wort für Wort, was gemeint war, wie er
es besser hätte schreiben können, ein besserer Prompt, die Arbeit von
Commit zu Commit mit Zeitraum und Dauer, das grösste Problem, die
interessanteste Anfrage und jede Massnahme an den Daten mit Uhrzeit und
Begründung. In PROBLEME.md steht jedes Problem mit seiner FALSCHEN
VERMUTUNG — der teuerste und lehrreichste Teil.

In Redion öffnet die Suche nach „Red-ur" ein Fenster: vier Graphen, der
Stapel der Tage in echter Perspektive (drehbar, jede Platte so dick wie die
Arbeit des Tages), und alle vier Ansichten aus derselben Quelle.

Drei Dinge stehen ehrlich dabei statt versteckt: die Uhrzeiten der
Nachrichten sind abgeleitet und mit „ca." gekennzeichnet; die Token fehlen,
weil die Zahl der Sitzung nicht zur Verfügung steht (L141); und der
Zugangscode ist ein Türschild, kein Schloss — er steht im Quelltext (L140).

Das Bild hat wieder etwas gefunden: der erste Stapel legte die Platten
genau hintereinander, und nur die vorderste war lesbar.

**Die Zeichen der Leiste (E515, test480 §5).** Redur schickte ein Foto der
GoodNotes-Leiste: „Nehme die symbole. Für die redion bitte 1:1".

Auf dem Foto stehen dreizehn Zeichen in einer Reihe — gleiche Strichstärke,
gleiche Farbe, gleiche Linie. Redion hatte an derselben Stelle eine Mischung
aus Emoji, Unicode-Formen und einem Grossbuchstaben. Der Unterschied steht
seit E273 im Register beschrieben: Emoji sind Bilder. Sie bringen ihre
eigene Farbe mit, ihre eigene Strichstärke und ihre eigene Grundlinie, und
sie sehen auf jedem System anders aus.

Redur hat also nicht um neue Bilder gebeten, sondern um dieselbe Sorte
Zeichen, die Redion überall sonst schon hat — nur die meistbenutzte Fläche
der App war beim Emoji geblieben.

Die dreiunddreissig neuen Zeichen stehen im Register, nicht in der
PDF-Fläche: ein zweiter Zeichensatz wäre nach dem zweiten Durchgang
verschieden, und niemand hätte gemerkt, welcher gilt. Die Leiste nennt nur
den Namen, das Register malt. Die Falle waren die vier Stellen, die ihr
Markup nachträglich neu schreiben — wer `innerHTML` neu setzt, wirft die
gemalten Zeichen weg und hat danach einen leeren Knopf.

Sieben Textzeichen bleiben, jedes mit Grund. Das wichtigste ist das `Aa`
der Schriftart: es steht in der gewählten Familie und zeigt, wie die
Schrift aussieht. Genau das kann eine Zeichnung nicht.

Gefunden hat die Messung etwas, das kein Auge gesehen hätte: die
gezeichneten Zeichen sind fest 18 px breit, die Emoji davor im Mittel rund
12 — dreizehnmal sechs Pixel sind fünfundsiebzig, und daran kippte die
Werkzeugzeile am Rechner in eine zweite. Zwei Zeilen sehen ordentlich aus;
gefunden hat es `test351`, weil dort seit E359 eine Zahl steht. Zurückgeholt
wurden die Pixel an drei Stellen — Polsterung, Abstand, Zeichengrösse —,
und wo kein Wort steht, bleibt das Zeichen gross.

Und dann hat das Bild etwas gefunden, das keine Zahl gemeldet hatte: auf
einem Blatt mit allen Zeichen nebeneinander waren Füller, Kugelschreiber
und Bleistift derselbe schräge Stift mit einer anderen Spitze. Im Register
stand sogar der Satz, sie seien an ihrer Spitze zu erkennen — bei 16 px ist
eine Spitze zwei Punkte gross.

Nachgemessen (jedes Zeichen in 16 × 16 gerastert, Punkt für Punkt
verglichen): Kugelschreiber und Bleistift teilten 73 % ihrer Tinte, Füller
und Bleistift 69 %. Die Paare, die man sofort auseinanderhält, lagen bei 24
bis 38 %.

Der erste Reparaturversuch machte es schlimmer — schärfere Spitzen, ein
Luftloch, Griffrillen —, und die Messung sagte es sofort: 85, 83, 81 %. Bei
dieser Grösse trägt der Schaft die ganze Tinte, jede Verzierung liegt unter
einem Punkt. Zeichen unterscheiden sich in ihrer Silhouette oder gar nicht.
Jetzt ist der Füller eine Feder, der Kugelschreiber steht aufrecht mit Clip
und Kugel, und der Bleistift bleibt der schräge Stift, den jeder kennt.
Dasselbe beim Zettel: er war ein Blatt mit Textzeilen und ist jetzt eine
Haftnotiz mit umgeschlagener Ecke.

`test480 §7` hält es: kein Paar über 60 %, und die Grenze liegt in der
gemessenen Lücke zwischen 38 und 69, nicht im Gefühl.

**L139 gefunden — der Import war nie kaputt (E516, test482).** Redur am
8. September: „wenn ich oben eine neue PDF einfügen will, kopiert es immer
die aktuelle PDF." E513 hatte drei Wege gemessen, alle drei sauber, und der
Fehler blieb als Lücke stehen.

Die drei Messungen haben die falsche Frage gestellt. Sie fragten, ob der
Import die richtige Datei ablegt — er tat es immer. Redurs Satz stellt eine
andere Frage: welchen Knopf drückt er.

Im Regal waren oben zwei Knöpfe zu sehen. Der eine hiess „PDF öffnen" und
holte die zuletzt geöffnete PDF zurück. Der andere hiess „PDF importieren"
und las eine neue ein. Der dritte, der in der Kopfleiste, heisst ebenfalls
„PDF öffnen" und importiert wirklich — er ist im Regal aber ausgeblendet.

Wer eine PDF öffnen will, drückt „PDF öffnen". Er bekommt seine aktuelle
PDF. Jedes Mal, völlig korrekt, und es sieht aus wie eine Kopie. Das war
der ganze Fehler: kein Datenverlust, keine falsche Quelle, keine doppelte
Kennung — ein Wort an der falschen Stelle und ein zweites, das dasselbe
meinte und anders hiess.

Jetzt heissen beide Importknöpfe „PDF öffnen" und tragen dasselbe
gezeichnete Zeichen; die Karte heisst „Weiterlesen" und sagt damit, dass sie
zurückführt. Der Prüflauf misst den sichtbaren Text jedes Knopfes und lässt
kein zweites „PDF öffnen" zu.

Auch der vierte Weg ist jetzt gefahren — „PDF hier einfügen" im Seitenmenü,
den kein Prüflauf öffnen konnte, weil er im Inspector sitzt und der zu ist,
solange ihn niemand aufmacht. Ein Klick mehr, und der Weg lässt sich prüfen:
zwei Seiten vorher, fünf nachher, zwei Quellen, fünf verschiedene
Seitenbilder, und die drei neuen tragen den Text der neuen Datei an der
richtigen Stelle. Sauber.

Und ein zweiter Fund in derselben Zeile: der Importeur schrieb in
`button.textContent` und nahm dem Knopf damit sein gezeichnetes Zeichen aus
E515 — für den Rest der Sitzung, weil der Kopfknopf fest in der Startseite
steht und nie neu gezeichnet wird. Dazu hiess der Knopf danach anders als
vorher. Beschriftet wird jetzt an einer Stelle, in ein Wortfeld statt in den
Knopf.

**Der Arbeitsstand kommt auf den Laptop (E517, test353).** Redur wollte
einen neuen Zweig und nach jeder Änderung wissen, wie er den aktuellen
Stand auf den Laptop holt. Beim Nachsehen zeigte sich, dass das bis dahin
gar nicht ging.

Drei Regeln, jede für sich richtig: `holen.bat` holt `main`; `main` bewegt
sich erst, wenn ein voller Lauf grün ist; gearbeitet wird auf einem Zweig.
Zusammen ergeben sie, dass der Arbeitsstand vom Laptop aus nicht erreichbar
ist. Auf Redurs Rechner stand tagelang derselbe Stand, während hier zehn
Bögen landeten — kein Fehler, aber es sah genau so aus.

`main` deshalb zu bewegen, wäre der falsche Ausweg: `main` ist die Zusage
„hierüber ist ein voller Lauf gegangen", und eine Zusage, die man aufweicht,
wenn sie unbequem wird, ist keine. Also bekommt der Zweig einen eigenen Weg,
und der sagt dazu, was er ist.

`holen.bat` nimmt jetzt einen Zweignamen; ohne Angabe bleibt es `main`. Das
ist die wichtigere Hälfte: ein Doppelklick soll weiterhin den geprüften
Stand bringen. Daneben steht `holen-zweig.bat`, das nach dem Namen fragt und
den Zweig vorschlägt, auf dem der Ordner gerade steht. Es enthält keine
eigene Rettungslogik — kein checkout, kein branch, kein stash, kein fetch.
Es fragt, und dann ruft es `holen.bat`. Zwei Skripte, die beide Arbeit
sichern, laufen nach dem dritten Durchgang auseinander, und dann sichert
eines davon falsch.

Die Falle bei so einer Umstellung ist bekannt: E271 hat gemessen, was
passiert, wenn ein einziger git-Befehl noch auf `main` zeigt — das Fenster
meldet Erfolg, und die Arbeit ist von keiner Referenz mehr erreichbar. Die
Stellen sind sechs, und der Prüflauf misst jede einzeln und sagt, welche
fehlt. Die Gegenprobe, nur den Umzug zurück auf `main`, macht drei Zusagen
rot.

Und einmal wirklich gefahren: Windows-Batch läuft im Container nicht, die
git-Befehle darin aber schon — und sie sind das Risiko, nicht die Hülle.
Dieselbe Folge in einem echten Wegwerf-Repo, mit einem Zweignamen mit
Schrägstrich: klonen, holen, umziehen, ein eigener Commit, sichern. Danach
liegt die eigene Arbeit in der Sicherung und nicht im Nichts.

**Die fertigen Befehle (E518, test353 §5c).** Redur klickt nicht, er
kopiert: „geb mir immer im powerschell im windows die fertige befel."

Die naheliegende Antwort wäre `git checkout` gewesen — kurz und direkt. Sie
wäre falsch gewesen: sie überspringt die ganze Rettung. Kein Fragen bei
GitHub, ob der Stand geprüft ist; kein Sichern eigener Commits; kein
Beiseitelegen geänderter Dateien; keine Meldung am Ende, wo alles liegt. Ein
Befehl, der schneller aussieht und Arbeit wegwerfen kann, ist kein besserer
Befehl. Der Alltagsbefehl ruft deshalb `holen.bat` mit dem Zweignamen.

Für das erste Mal geht es trotzdem von Hand, weil das alte `holen.bat` auf
dem Laptop noch keinen Zweignamen annimmt. Diese drei Zeilen wurden vorher
in einem echten Wegwerf-Repo gefahren, mit einer eigenen ungespeicherten
Datei im Ordner — danach stand der Zweig da, sein Inhalt auch, und die
eigene Datei lag in der Ablage statt im Nichts.

Die Befehle stehen jetzt in `START-MIT-CLAUDE-CODE.md` und nicht nur im
Gespräch, das morgen weg ist. Ein Wächter hält die vier Stellen, an denen
ein Abdriften wehtut: der Befehl ruft `holen.bat` mit Zweig, gerettet wird
vor dem Umzug, zurückgeholt wird mit `apply` statt `pop`, und der Pfad steht
als `$env:USERPROFILE` da.

Die letzte Zusage war beim ersten Lauf rot — und zwar an der Zeile, die
erklärt, warum man einen Benutzerpfad nicht ausschreibt. Sie schrieb ihn
aus. Behoben, und `SERVER-EINRICHTEN.md` gleich mit; dort stand derselbe
Pfad in einem `cd` zum Kopieren. Die drei in `ENTSCHEIDUNGEN.md`, `UR.md`
und im Studien-Audit bleiben stehen: das sind Protokolle, und ein Protokoll
schreibt man nicht um.

**Der Vergleich sieht gegen deinen Zweig (E519, test353).** Redur fragte,
wie er weiss, ob GitHub und Laptop gleich sind. Genau dafür gibt es
`vergleichen.bat` seit E438 — und es hätte ihm die falsche Antwort gegeben.

E517 hatte `holen.bat` einen Arbeitszweig beigebracht, `vergleichen.bat` sah
weiter fest gegen `main`, und `main` liegt inzwischen sechs Bögen zurück.
Wer auf dem Arbeitszweig steht und fragt „habe ich dasselbe wie auf GitHub",
bekam hunderte Unterschiede, die keine sind. Das Skript rechnete dabei
richtig — nur beantwortete es eine Frage, die niemand gestellt hatte.

Die Vorgabe ist jetzt eine andere als bei `holen.bat`, und das ist der Kern:
`holen.bat` ändert den Ordner und nimmt deshalb ohne Angabe den geprüften
Stand; `vergleichen.bat` sieht nur nach und nimmt deshalb ohne Angabe den
Zweig, auf dem man steht. Beide gleich zu machen wäre in beide Richtungen
falsch, und der Grund steht in beiden Dateien im Kopf.

Dazu sagt es jetzt, wenn es den Zweig auf GitHub gar nicht gibt, und listet
auf, welche es gibt — vorher hiess es nur „nicht erreichbar", was einer von
zwei möglichen Gründen war.

Und die vier Antworten, die ein Mensch liest, sind gemessen statt behauptet:
gleicher Stand, GitHub weiter, ich weiter, ungespeichertes daneben — in
einem echten Wegwerf-Repo gefahren. Ohne das wäre die Tabelle in der
Anleitung eine Behauptung über eine fremde Ausgabe, und solche Tabellen sind
nach einem git-Update falsch, ohne dass es jemand merkt.

**Der Worker heisst red-ion — und ein Zeugnis lag im Netz (E520, test270).**
Redur schickte das Cloudflare-Protokoll und bat um eine Kleinigkeit: den
Worker-Namen von `redion` auf `red-ion` ändern, „nur wo Workername ist".

Das war schnell getan. Interessanter war, warum die Warnung überhaupt
störte: sie kam bei jedem Bau, und eine Warnung, die immer kommt, liest
nach der dritten Woche niemand mehr. Genau das war passiert — vier Zeilen
tiefer im selben Protokoll stand der Fehler, an dem der Deploy wirklich
scheiterte, und der ist ein anderer.

Beim Zeilenlesen des Upload-Protokolls fiel dann etwas auf, wonach niemand
gefragt hatte: unter den 290 hochgeladenen Dateien standen
`Redur_Babat_FZ_MOE_Lehrpersonen.pdf` und `Schul Inhalt`. Fünf Megabyte
Zeugnis, unter einer Adresse, die jeder raten kann. Das Repository ist
privat, die veröffentlichte Seite nicht.

E270 hatte die Ausschlussliste gebaut und den richtigen Satz dazu
geschrieben: hier bleibt drin, was der Browser wirklich lädt. Die Regel war
richtig, die Liste unvollständig — sie kannte die Werkstatt und die
Geheimnisse, aber nichts Persönliches, weil damals nichts Persönliches
dalag. Dazu kamen die Chronik-Quelle und die 50 Uiverse-Originale, die
weder `index.html` noch `sw.js` je nennen.

Gelöscht wurde nichts. Die Dateien liegen, wo sie lagen; sie gehen nur
nicht mehr mit. Der Prüflauf misst beides — dass die PDF noch da ist und
dass sie draussen bleibt: eine Zusage, die auch nach dem Löschen grün
bliebe, hielte das Falsche fest.

Und sie misst gegen die Wirklichkeit statt gegen sich selbst: sie liest,
was tatsächlich in der Wurzel liegt, wendet die Ausschlüsse an und
vergleicht mit dem, was gehen darf. Wer eine Datei danebenlegt, macht sie
rot. Der erste Wurf des Musterabgleichs kannte `*.pdf`, aber nicht
`tsconfig*.json` mit dem Stern in der Mitte, und meldete vier längst
ausgeschlossene Dateien als Leck — ein Wächter mit falschem Alarm wird nach
dem zweiten Mal ignoriert. Beim Richtigstellen fand er einen echten
Nachzügler: `.gitattributes` stand in keiner Liste.

Was den Deploy wirklich gekippt hat, steht als L143: die D1-Kennung in
`wrangler.toml` gehört zu keiner Datenbank in Redurs Konto. Das ist L82
Punkt 1, und kein Prüflauf im Container kann es lösen.

**Ein Zweig, ein Push, dann ein neuer (E521).** Redurs Regel vom
9. September: sobald ein Zweig gepusht ist, beginnt die nächste Arbeit auf
einem frischen.

Der Grund liegt offen: sechs Bögen — E515 bis E520 — lagen auf einem Zweig
namens `claude/redion-goodnotes-weiter`. Der Name beschreibt den ersten
davon. Er beschreibt nicht die Chronik, nicht `holen.bat`, nicht
`vergleichen.bat`, nicht `.assetsignore` und nicht Cloudflare. Ein Zweig, auf
den immer weiter geschoben wird, verliert seinen Namen — er heisst nach dem
ersten Bogen und trägt den zwanzigsten.

Das trifft ausgerechnet das, was zwei Bögen zuvor gebaut wurde: seit E517
kann Redur einen Zweig auf den Laptop holen. Wer dann sagt „hol mir den
Zweig", muss wissen, was darin steht.

§43 sagte den Kern schon — „kleine Zweige, eine Änderung, ein klares Ziel" —,
nur stand nirgends, wann ein Zweig fertig ist. Jetzt steht es: mit dem Push.
Der alte bleibt dabei unangetastet, und der neue beginnt Commit für Commit
auf seinem Stand; nachgemessen mit einem leeren `git diff`.

Der Preis steht als L144 dabei: mehr Zweige. Bei BABAT-RED sind daraus 265
geworden. Der Unterschied ist, dass dort nie zusammengeführt wurde — hier
holt `main` sie ein, sobald ein voller Lauf grün ist. Nur steht genau dieser
Lauf seit E511 aus, und das ist die ehrlichere Lücke von beiden.

**Der volle Lauf, und was er fand (E522).** Redur wollte alles auf `main`.
`main` bewegt sich erst nach einem vollen grünen Lauf (§46), und der stand
seit E511 aus. Also einmal wirklich gefahren — 431 Läufe.

Drei Dinge kamen dabei heraus, und das erste geht gegen mich.

**Eine Behauptung aus E520 ist nicht belegt.** Dort steht über die
persönliche PDF: „sie gehen nur nicht mehr mit ins Netz." Gemessen habe ich
das nie. Der Prüflauf richtet sich auf den Inhalt der Ausschlussliste — ob
die Zeilen darin stehen. Die Wirkung habe ich behauptet, als hätte ich sie
geprüft.

Nachgemessen mit `wrangler deploy --dry-run`, gleiche Fassung wie auf
Cloudflare: 5348 Dateien mit den Ausschlüssen, 5348 ohne, 5348 auch dann,
wenn man `quell/` mit seinen 305 Dateien ausschliesst. Kein Unterschied.
Was das heisst, ist offen — entweder wirkt die Datei nicht, oder die Zahl
misst den Rohscan vor dem Filtern. Beides ist möglich; behauptet wird
keines. Es steht als L145, mit drei Wegen, es zu entscheiden, und keiner
davon geht ohne Redurs Konto.

**Die D1-Bindung ist stillgelegt.** Zweimal dasselbe an zwei Deploys: die
Datenbank gibt es in seinem Konto nicht, und solange sie in `wrangler.toml`
steht, scheitert jeder Deploy — dann ist gar nichts im Netz, auch nicht der
Teil, der ohne Datenbank liefe. Nachgesehen, dass der Server das aushält,
und auskommentiert, mit den zwei Befehlen daneben, die ihn zurückholen.

**Zwei Zusagen waren seit E465 rot.** „Dreizehn Gruppen" in `test86` und
`test65` — E465 hat die Gruppe „Blatt und PDF" angelegt und die Zahl nicht
mitgehoben. Diese Zeilen haben getan, wofür sie da sind, und trotzdem hat
sie niemand gehört: sie stehen in Lauf 61 von 431, und wer nur die Läufe
seines eigenen Bogens fährt, sieht sie nie. Elf Bögen liegen dazwischen.

Genau dafür besteht §46 auf einem vollen Lauf, bevor `main` sich bewegt.
Und genau deshalb war es richtig, ihn zu fahren, statt den einen kleinen
Commit durchzuwinken.

**„Hello world" — Redion war nie im Netz (E523).** Redur schickte ein Bild
von `red-ion.redurbabat7.workers.dev`: schwarzer Grund, oben links in
Schreibmaschinenschrift „Hello world". Und auf Nachfrage: überall dasselbe.

Das ist Cloudflares Standard-Worker, die Vorlage vom Anlegen des Projekts.
Sie sieht den Pfad gar nicht an — deshalb dieselbe Antwort auf jeder
Adresse. Beide Deploys waren am D1-Fehler abgebrochen, und ein gescheiterter
Deploy ersetzt die laufende Fassung nicht. Redion war nie dort.

Damit ist die Sorge aus E520 entkräftet: das Zeugnis lag NICHT im Netz. Die
Datei war in Cloudflares Speicher hochgeladen, aber ohne aktive Fassung
zeigt niemand darauf. Hochgeladen und ausgeliefert sind zweierlei.

Richtig war die Sorge trotzdem. Die Datei war hochgeladen, und beim ersten
erfolgreichen Deploy wäre sie erreichbar gewesen, falls die Ausschlussliste
nicht wirkt — was bis heute niemand gemessen hat. Dass nichts passiert ist,
lag an einem Fehler und nicht an einer Vorkehrung. Deshalb steht in L145
jetzt genau eine Adresse, die nach dem ersten erfolgreichen Deploy
aufgerufen gehört; sie entscheidet die Frage in fünf Sekunden.

Gemessen hat es Redur selbst. Von hier aus geht es nicht: der Ausgangsproxy
dieser Sitzung lehnt die Verbindung mit 403 ab.

---

## Die Marke — aus achtzehn Stellen wird eine (E525)

Redur, 9. September, mit einem Bild seines Startbildschirms: „Wieso habe
ich hier das immer nich die R logo". Und, nachdem ich dreimal nach der
Datei gefragt hatte statt zu handeln: „Alter änder die logo ich sage es dir
mache es".

**Gefunden.** Das rote R stand nicht an einer Stelle, sondern an achtzehn.
Siebzehn davon rechnete `oeffentlich/icons/erzeugen.mts` — und die
achtzehnte, `favicon.ico`, hatte **gar keinen Erzeuger**. Sie war von Hand
gebaut, lag seit dem 1. September unverändert da, und wäre beim
Markenwechsel als einzige übriggeblieben: ein rotes R im Browserreiter,
während überall sonst die neue Marke steht. Sie rechnet der Erzeuger jetzt
mit.

**Gebaut.** Eine Quelle, `oeffentlich/icons/marke.png` in 512 × 512, und
daraus vierundzwanzig Dateien. Der Erzeuger kann seither auch PNG **lesen**
(Signatur, Blöcke, zlib, die fünf Zeilenfilter — achtzig Zeilen statt einer
Abhängigkeit), schreibt einen **Alphakanal** statt weisser Ecken, wählt für
jede Zeile den **Filter, der sie am kleinsten macht**, und hebt bis 48 px
die Mitteltöne, damit die dunkle Marke im Reiter nicht zum schwarzen Fleck
wird. In der App trägt der Studio-Kopf statt des „R" dieselbe Marke.

**Der Fehler, den kein Prüflauf finden konnte.** Der Kastenfilter teilte
falsch — der Faktor `n` zu viel beim Zurückrechnen aus dem
vormultiplizierten Alpha. Bei 512 → 512 ist `n` gleich eins, also sah
`icon-512` richtig aus; bei 512 → 48 kam jedes Symbol weiss und ausgebrannt
heraus. Masse, Alphakanal und Dateiform stimmten alle. Gefunden hat es das
Bild (§55).

**Der Preis, gemessen statt geraten.** Eine Fotografie packt sich nicht wie
ein gezeichnetes R: `icon-512` wog im ersten Versuch 480 KB gegen 3 KB
vorher. Zeilenfilter, ein Boden im Schwarz und 64 statt 256 Stufen je Kanal
haben daraus 225 KB gemacht — bei vierfacher Vergrösserung im Goldverlauf
ist zwischen 8 und 6 Bit kein Streifen zu sehen. Alle Symbole zusammen
1,6 MB statt 60 KB, bewusst bezahlt.

**Geprüft.** `test483`, 20 Zusagen, vier Gegenproben rot gesehen — darunter
ein einzelnes geändertes Byte in `marke.png` ohne neuen Lauf, das 21 von 24
Dateien abweichen lässt. Dazu `test31`, `test204`, `test351` grün,
`npm run typecheck` sauber, Einzeldatei und Dienststand nachgezogen.

**Was dabei schlechter wurde, und das steht hier so.** Die Marke im Kopf
kostet 8,7 KB in der Startnutzlast, und `test388` misst jetzt 2389 KB gegen
eine Decke von 2300. Die Decke war schon vorher gerissen — 2379 vor diesem
Bogen —, aber zehn Kilobyte davon sind meine. Das ist L146.

---

## Wo die Leiste steht — und dass sie dort auch wirklich steht (19. September 2026)

Redur hat ein Papier hochgeladen (*Executive Summary, 19.09.2026*) und kein
Wort dazu geschrieben. Es wollte Redions Zeichenleiste nach dem
GoodNotes-Modell neu bauen.

**Nachgemessen statt geglaubt** (§45, E21). Von acht Wünschen waren sieben
gebaut — das Andocken (E512), der gemerkte Platz, die schwebende Leiste, die
Verlaufskapsel (E572), das Rollen am schmalen Schirm, die offenen Stifte, die
beschrifteten Strichstärken von vorgestern (E616/E618) und das Ausweichen vor
der Bildschirmtastatur (E588). Vier Behauptungen seiner Vergleichstabelle
über „Redion (aktuell)" stimmten nicht mehr, und seine Zahl „ab < 768 px"
liegt acht Pixel neben Redions Umbruch.

**Was wirklich fehlte:** die Leiste als Ganzes ziehen, eine freie Position,
und `role="toolbar"` (null Treffer in `src/`).

**Was das Messen zusätzlich fand — und das war der teurere Teil:**

```txt
gewöhnliche Seite, «unten in der Mitte»    2 × 1409 px    ein Streifen
Studio, «links» oder «rechts»              74 × 749 px    mitten auf dem Papier
```

Der erste Fehler kam von `container-type:inline-size` (E359): das ist
`contain:inline-size` mit anderem Namen, und in einem Kasten, der auf seinen
Inhalt schrumpfen soll, bleiben dann null Pixel. Der zweite davon, dass
`pdf-studio.css` die Leiste ohne `[data-lage]` im Wähler festsetzt, die
Spaltenform aus `bausteine.css` aber trotzdem greift — der Platz-Knopf
versprach dort etwas, das er nicht konnte.

**Gebaut:** E619 (im Studio bleibt der Dock, der Knopf ist dort weg),
E620 (am Griff ziehen, «frei» als fünfter Eintrag im selben Katalog, die
zwei Pixel behoben), E621 (die Rolle mit Pfeiltasten und einem Tabstopp).

**Nicht gebaut, mit Grund in E619:** `palette.tsx` und der Komponentenbaum
(§6 [hart], E80 hat React widerrufen) und die fünf festen Hex-Farben (§39 —
`#905CFF` wäre ein drittes Violett neben `--accent` hell und dunkel, die 43
bzw. 39 davon entfernt liegen).

**Geprüft.** `test534` neu, 44 Zusagen, **15 davon rot gesehen**, bevor sie
grün waren. Dazu `test533`, `test524`, `test351`, `test393`, `test481`,
`test105`, `test109`, `test87` grün, `npm run typecheck` sauber, Einzeldatei
und Dienststand (v1164) nachgezogen, sechs Bilder angesehen — und eines davon
hat einen Fehler gezeigt, den kein Lauf hatte: die freie Leiste hing rechts
aus dem Blatt.

**Offen daraus:** L187 — «unten» steht am Fuss des Blattes, nicht des
Fensters. Drei Wege, Redurs Wahl.

---

## Die Strichprobe, die eine Kachel und der Radierer (19. September 2026)

Redur hat zwei Dinge entschieden: **L187** (die Leiste bei «unten» soll
sticky am Blattfuss kleben) und **W4-Rest** als nächsten Bogen.

**L187 (E622).** `position:sticky` statt `absolute` — und dazu ein Fund, den
die Lückenbeschreibung noch nicht kannte: sticky mit `bottom` **zieht nach
oben**, es schiebt nichts nach unten. Die Leiste musste im Fluss hinter das
Papier, sonst blieb sie oben stehen. Gemessen: y = 1885 → y = 904 in einem
960 px hohen Fenster, und über dem Papier bleibt keine Lücke.

**Die Strichprobe (E623).** Sie hiess so und war keine:
`background:currentColor` ist die Textfarbe des Knopfes — gemessen
`rgb(242,242,242)` bei jeder Tinte —, und eine Deckung hatte der Balken gar
nicht. Jetzt trägt er die gewählte Tinte und die Deckung des Stifts.

**Der Fund dabei:** die Deckung stand **viermal** im Quelltext, obwohl der
Kommentar über `alsAnnotation` seit E506 behauptet, sie stehe „hier und
nirgends sonst (§8)". Jetzt eine Funktion, und `test535 §3` vergleicht die
Zahl auf der Kachel mit der eines echten, gezogenen Strichs.

**Name und Millimeter auf einer Kachel (E623).** Der erste Wurf schrieb
„Markant · 1,8 mm" in eine Zeile — gemessen wuchs die Leiste von 128 auf
143 px und riss die Decke von `test533 §5b`. Untereinander kostet es Höhe
statt Breite, und es ist ausserdem die Form auf Redurs Bild.

**Der Radierer (E624).** Drei Grössen gab es im Studio und nur dort — gebaut
im Hörer auf `ink-studio-ready`, den allein `document-mode.ts` auslöst. Jetzt
stehen sie in der Leiste, und das Studio nimmt dieselben Knöpfe. Dazu der
Haken «Automatisch an den Strich anpassen»: den Zustand gab es seit je
(`eraserSize ?? max(5, Breite × 3)`), nur führte kein Weg zurück.

**Geprüft.** `test535` neu, 24 Zusagen, **acht davon rot gesehen** (sieben
für die Probe, eine für den Haken). `test534` um §1b gewachsen (50 grün, zwei
Zusagen rot gesehen), `test533` um zwei Zusagen (56 grün). `test524`,
`test348`, `test351`, `test438`, `test247`, `test475`, `test506`, `test393`,
`test481` grün — zwei Zahlen darin nachgezogen, beide mit geschriebenem
Grund: der Radierer zeigt jetzt fünf Knöpfe statt einem, und seine Leiste ist
1068 statt 828 px lang.

**Und drei Fehler, die die Läufe gefunden haben**, nicht das Lesen: der
Klickzweig für die Grössen lag tot (er stand innerhalb von
`if (target.dataset.act)`, und die Knöpfe tragen kein `data-act`); die
Markierung zog nur das eigene Blatt mit, nicht die Nachbarblätter; und die
Lückenprüfung in `test534 §1b` war zu weich formuliert — sie blieb grün,
obwohl 46 px Lücke dastanden.

**Offen von W4:** nur noch der **Deckkraft-Schieber**, und der ist eine
Datenfrage (§9): eine Marke speichert heute kein Feld `deckkraft`.

---

## Die Dock-Welle gilt auch ohne Studio (19. September 2026)

`AUFGABEN.md` führte W5 als offen. **Nachgemessen war er zum grössten Teil
gebaut** — nur eben in `pdf-studio.css`, mit `.document-studio` vor jedem
Wähler. Auf einer gewöhnlichen Seite traf keine der drei Familien; dort war
die Leiste still. Genau deshalb sagt ein „offen" in einer Liste nichts über
den Zustand: gebaut war es, gesehen hatte es nur, wer im Schreibstudio war.

Die zwei `.blatt-werk`-Familien sind nach `bausteine.css` gewandert und
haben den Vorsatz verloren — **aus drei Familien wurden zwei, nicht vier**.
Eine Kopie danebenzulegen wäre der bequeme Weg gewesen und hätte §8
gebrochen.

Dazu das **Farb-Dock** aus Redurs Bild 8: die Tupfer tragen kein `svg`,
fielen also überall aus den Regeln heraus. Jetzt wächst der Knopf selbst,
mit derselben Welle zu den Nachbarn.

**Was NICHT gebaut ist, und warum:** das Namensfähnchen. Am Tupfer sind
beide Pseudoelemente vergeben — `::before` ist die 1-px-Kante gegen den im
Dunkelmodus verschwindenden schwarzen Tupfer (E568), `::after` die
44-px-Trefffläche (§37). Auf `::before` gelegt erbte das Fähnchen das
`inset:5px` der Kantenregel und lag mitten auf dem Tupfer; unter den Tupfer
gelegt war es zu sechzig Prozent vom Papier verdeckt — und `getComputedStyle`
meldete dabei `opacity: 1`. Steht als **L190**, mit drei Wegen.

**Geprüft.** `test536` neu, 18 Zusagen, **sechs davon rot gesehen**.
`test524` (105), `test535`, `test534`, `test533`, `test351`, `test348`,
`test438`, `test247`, `test393`, `test481` grün; `npm run typecheck` sauber.
Drei Bilder angesehen — und sie haben zweimal widerlegt, was die Rechnung
behauptete.

---

## Bereiche bleiben getrennt — der Wächter, den §5 nie hatte (19. September 2026)

**L150 ist geschlossen.** §5 Regel 1 ist **[hart]** und hatte seit ihrer
Niederschrift keinen Wächter; der Satz „Der Wächter dafür ist `test87`" stand
in `CLAUDE.md` und stimmte nicht.

**Und L150 selbst lag falsch.** Dort stand: „heute hält die Regel — es gibt
keinen Querverweis". Gemessen sind es **523, in 63 von 306 Bereichspaaren**.
Woran es lag, ist die Lehre: die alte Messung suchte nach `import`. Den gibt
es in diesem Programm nicht (0 Zeilen in `src/bereiche/`), und der Schluss
„also keine Querverweise" ist derselbe Fehler, vor dem dieselbe Lücke warnt —
eine Messung, die das Falsche misst, sagt immer das Beruhigende.

**Verschoben wurde nichts.** Der naheliegende Weg wäre §5s zweiter gewesen
(„gemeinsame Logik nach `kern/`"), aber die grossen Namen sind keine Helfer:
`Datenbank` ist `datenbanken/steuerung.ts` mit **502 KB**, `Werkzeuge` die
Befehlspalette samt Journal mit 163 KB. Sie nach `kern/` zu schieben hiesse
§4 brechen.

**Stattdessen ein Verzeichnis**, nach dem dreimal erprobten Muster
(`js-bestand.json`, `masse-bestand.json`, `schalter-bestand.json`):
`pruefungen/bereiche-bestand.json` führt die 127 Einträge, darf nur
schrumpfen, und `test537` macht jeden NEUEN Verweis rot — auch den über
`(window as any)`, der sonst die eine Zeile wäre, mit der der Wächter zu
umgehen ist.

**Geprüft.** `test537` neu, 17 Zusagen, **drei Gegenproben einzeln rot
gesehen** (ein nackter Verweis, derselbe über `window`, und ein entfernter
Verweis, der einen Eintrag zur Karteileiche macht). Dazu sieben eingebaute
Gegenproben der Ausdrücke selbst, nach dem Vorbild von `test87:162`.
`test87`, `test105`, `test109` grün, `npm run typecheck` sauber.

**Zwei Fehler, die erst die Gegenprobe zeigte:** ohne die zusätzliche
Schablonen-Leerung zählte der Lauf 88 Treffer aus deutscher Prosa in
Backticks mit („öffne die Bibliothek."), und der Fensterweg zählte dieselbe
Zeile zweimal — 526 statt 523.

**Offen und Redurs Entscheidung:** die 523 über `register/` auflösen (§5s
dritter Weg), oder §5 Regel 1 umschreiben, weil achtzehn Bereiche einander in
63 von 306 Paaren anrufen und das der Normalfall dieses Programms ist.
Eingetragen ist auch, was der Wächter **nicht** kann: den Griff ins fremde
Markup, weil die Zuordnung Präfix→Bereich nicht existiert (**L191**).

**Und ein roter Lauf, der nicht zu diesem Bogen gehört:** `test402` meldet
zwei Trefflächen unter 44 px ohne geschriebenen Grund —
`motion.css #ai .ki-quellschalter button` (32 px) und
`werkzeuge.css .gk-leiste button` (26 px, aus E607). Beide sind älter als
dieser Zweig und liegen schon auf `main`. §46 sagt „rot zuerst": das ist der
nächste Bogen.
