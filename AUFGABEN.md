# AUFGABEN.md

Diese Datei ist die Arbeitsliste für Redion. Hier steht **nur, was noch zu
tun ist**.

```txt
Was wird als Nächstes gemacht?
Warum ist es wichtig?
Wo gehört es hin?
Wann ist es fertig?
Welche Tests müssen laufen?
```

**Wo was steht**

| Datei | Frage |
|---|---|
| `AUFGABEN.md` | Was ist noch zu tun? |
| `ERLEDIGTE-AUFGABEN.md` | Was ist fertig, und was kam dabei heraus? |
| `ENTSCHEIDUNGEN.md` | Warum wurde etwas so entschieden? |
| `LUECKEN.md` | Was fehlt noch im Produkt? |

---

## Grundregel

Jede Aufgabe braucht: **Ziel · Warum · Dateien · Fertig wenn · Tests ·
Priorität.**

Was **erledigt** ist, wandert vollständig nach `ERLEDIGTE-AUFGABEN.md` —
mit Fund, Bau und Prüfung. Hier bleibt es nicht stehen, auch nicht in zwei
Zeilen: eine Liste, in der neunzig Prozent durchgestrichen sind, wird nicht
mehr gelesen.

**Und was hier steht, ist nachgesehen.** Beim Aufräumen am 3. September
2026 waren vier von sieben „offenen" Punkten längst gebaut (siehe unten).
Ein Punkt, der als offen dasteht, ohne dass jemand nachgesehen hat, ist
schlimmer als gar keiner — er lenkt die Arbeit auf etwas, das es nicht
mehr gibt.

---

## Was jetzt offen ist

Sechs Punkte, jeder nachgesehen am 3. September 2026.

### 0 · Der Prüfbericht vom 3. September, was davon noch aussteht

**Ziel** — die verbleibenden Befunde des UX-Audits schliessen. Der
Sofort-Block ist zu (E386), F01 richtiggestellt (E388), F02 zu (E388+E391),
F03 ZU (E387+E398), F08 zu (E394), F11 zu (E392), F13 halb (E395),
F14 halb (E396).

**Was noch offen ist**, in dieser Reihenfolge:

```txt
F02 Rest   die untere Telefonleiste an `haupt: true` hängen — WELCHE fünf
           es sein sollen, ist Redurs Entscheidung (am Telefon bleibt für
           „Mehr" ein Platz, also vier Orte)
           („Gehen" ist mit E391 aus dem Band; der doppelte „Zeitmesser"
            und die falsche Ortsmarkierung sind mit E393 weg)
F13 Rest   der echte Safari-/Chrome-Lauf auf Redurs Geräten — das Tor
           über die vier Grössen steht (test392, E395)
F14 Rest   welche VIER Zeichenwerkzeuge ohne Wischen dastehen sollen —
           Redurs Entscheidung (Zurück/Vor kleben seit E396)
F12 F17 F18       Politur  (F10 ist mit E397 zu)

F09 ist ZU (E400 + E401) — und die Hälfte, die zählte, stand nicht im
Bericht. Das Befehlsmenü gibt es längst (Strg ⇧ K, 163 Befehle, unscharfe
Suche). Beim Nachmessen kam heraus, dass der Pfeil über die gezeichnete
Liste hinauslief: ab dem 61. Druck führte Enter einen Befehl aus, den
niemand gesehen hatte. Behoben, plus vier Stellen, die ein falsches
Kürzel anschrieben. E401 hat dann die zwei Halbworte gebaut, die F09 wirklich verlangte:
„Zuletzt" (eine Reihenfolge, kein Zähler) und „Angeheftet" (Stern oder
Strg+Enter). Beide Überschriften stehen nur da, wenn sie etwas enthalten.
OFFEN bleiben fünf weitere Funde derselben Messung — sie stehen in **L128**.

F03 ist ZU (E387+E398). Redur hat die Wahl am 4. September bestellt und
die VORGABE ausdrücklich nicht: Fortlaufend bleibt der Normalfall, auch am
Telefon — das ist seine eigene Ansage aus E299. `test395 §1` ist der
Wächter dagegen und wurde fünffach rot gesehen.

F11 ist ZU (E392) — und die Behauptung war falsch: die vier Gruppen gibt
es längst. Der wirkliche Fehler war ein auf 720 px gedeckeltes Fenster, das
drei Einträge auf JEDEM Bildschirm verdeckte.
```

**Wo** — steht ausführlich in `LUECKEN.md` unter L123.

**Priorität** — hoch; es ist die Liste, an der gerade gearbeitet wird.

---

**Am 6. September dazugekommen (E457)** — die Kante am Rechner zeigt im
ruhigen Modus drei Orte (Bibliothek, Notizhefte, Lernzentrum) plus „Mehr
Orte"; Heute, Elektrotechnik und Aufgaben liegen dahinter und leuchten
dort. Das ist die Antwort für den RECHNER. Der F02-Rest oben — die untere
Telefonleiste an `haupt: true` zu hängen — steht damit noch deutlicher:
oben drei aus dem Register, unten fünf aus dem Markup (L117 Punkt 1).
Redur entscheidet, welche vier es unten sein sollen.

### 1 · Cloudflare wirklich aufsetzen — **braucht Redur**

**Ziel** — Server, Konto und Sync einmal gegen echtes D1/R2 laufen lassen.

**Warum** — geschrieben und geprüft ist alles (`test113`, `test118`–`120`),
aber nie gegen einen echten Dienst. Solange das so ist, ist „optionaler
Server" eine Absicht und keine Aussage.

**Wo** — `server/`, `wrangler.toml`, die sechs Befehle in
`SERVER-EINRICHTEN.md`.

**Fertig wenn** — ein Konto angelegt, eine Seite abgeglichen, eine Datei in
R2, und `wolkeAbgleich` hat vorher ausdrücklich gefragt (E1/E34).

**Warum es liegen bleibt** — es braucht ein Cloudflare-Konto und
Zugangsdaten. Das ist der einzige Punkt der ganzen Liste, den kein Prüflauf
im Container erledigen kann. Siehe `LUECKEN.md` L82 Punkt 1.

**Priorität** — hoch, sobald Redur Zeit dafür hat.

---

### 2 · Der Cloud-Arbeitsbereich als eigenes Konzept

**Ziel** — mehrere Arbeitsbereiche in der Oberfläche wählen und anlegen.

**Warum** — heute gibt es einen Bereich je Konto. Wer Schule und Privates
trennen will, kann es nicht.

**Wo** — `LUECKEN.md` L7. Setzt Punkt 1 voraus.

**Priorität** — mittel.

---

### 3 · Der Rest am Telefon

**Ziel** — gemeinsame Gestaltungswerte statt verstreuter Pixelzahlen, und
eine Prüfung auf einem echten iPhone.

**Warum** — E37: das Telefon ist der Normalfall, nicht der Sonderfall.

**Was beim Nachsehen am 3. September schon gebaut war** — Termine und
Eingang haben ihre eigenen Bereiche (E38), alle Menüs sind Blätter seit
test155, und die Seitenvorschau ist seit E371 ein Blatt mit drei Höhen.
Der Punkt stand hier drei Wochen falsch.

**Was wirklich offen ist** — zwei Dinge:

1. Die 113 rohen `44px` einzeln durchgehen: welche meinen eine
   Trefferfläche (dann `var(--touch-min)`) und welche sind zufällig 44
   (dann bleiben sie mit einem Wort dazu). Kleinarbeit ohne Risiko;
   `pruefungen/marken-decke.json` misst den Fortschritt, weil die Zahl
   darin nur sinken darf. Die zwei FALSCHEN Marken sind seit E372 weg.
2. **Auf einem echten Gerät geprüft: nein.** Alles bisher gemessen mit
   Playwright im Telefon-Bildmass. Das findet Grössen und Überdeckungen,
   aber nicht das Verhalten von Safari — der Fehlerbalken aus E81 kam vom
   iPhone, nicht aus einem Prüflauf. Das braucht Redur.

**Am 5. September dazugekommen** — die Datenbankansichten sind am Telefon
angesehen worden, nicht nur am Rechner, und dabei kamen zwei Funde heraus,
die genau das Muster aus Punkt 1 haben: eine feste Pixelzahl, die am
Rechner klein und am Telefon gross ist.

  · Die Listenzeile: `min-width:0` am Titel (aus E425) liess ihn am
    Telefon auf 55 von 106 px schrumpfen — „Bericht Kapitel 1" und
    „Bericht Kapitel 2" standen BEIDE als „Bericht" da. Seit E426 stapelt
    die Zeile unter 760 px.
  · Der Zeitstrahl: `.zs-namen{flex:0 0 190px}` sind am Rechner 16 % der
    Breite und am Telefon 57 %. Seit E427 sind es dort 118 px, und der
    doppelte Titel neben dem Balken entfällt.

Beide zeigen, worauf Punkt 1 wirklich zielt: nicht nur die rohen `44px`,
sondern JEDE feste Zahl, deren Anteil am Bildschirm sich mit der Breite
ändert.

Der dritte Verdachtsfall, die Namensspalte der Vorschau, ist am
6. September nachgemessen worden (E433) — und war KEINER: am Telefon
rendert `.peek` gar nicht, dort steht das Blatt mit eigenen 118 px, also
30 % statt der vermuteten 44 %. `test361 §8` hält die Grenze jetzt für
beide Hüllen. Was bleibt, ist die Lehre und nicht der Fund: eine feste
Zahl im Stil sagt nichts, solange nicht feststeht, WELCHE Regel am Telefon
überhaupt gilt.

**Wo** — `LUECKEN.md` L10 und L131.

**Priorität** — Punkt 1 mittel, Punkt 2 hoch, sobald Redur ein Gerät zur
Hand hat.

---

### 4 · Die Auftragsmaschine in einen Web Worker

**Ziel** — ein Auftrag rechnet im Nebenfaden statt im Faden der Oberfläche.

**Warum, und wie viel davon wirklich** — `LUECKEN.md` L103 Punkt 2. Der
Satz dort hiess bis zum 3. September „bei einem OCR über achtzig Seiten
ruckelt die App", und das war eine Vermutung. Nachgemessen am ZIP-Import,
dem einzigen angeschlossenen schweren Auftrag: 120 Dateien in 1093 ms,
längste Bildlücke 149 ms; 300 Dateien in 2784 ms bei flachen 8 ms je
Schritt. Nur 165 ms davon (15 %) ist das reine ZIP-Lesen — der Teil, den
ein Worker überhaupt übernehmen könnte.

**Fertig wenn** — der Auftrag, für den der Worker gebaut wird, VORHER
gemessen ist und die Messung ihn rechtfertigt.

**Priorität** — niedrig. Der ehrlichere Kandidat war L114 Punkt 7 (eine
Schätzung vor dem Start), und der ist seit **E373** gebaut: der Anlauf
sagt „12 Dateien · 96 PDF-Seiten — rund 9 Minuten", schweigt aber unter
zwanzig Sekunden und lernt aus jedem Lauf. Was am Worker offen bleibt,
ist damit wieder nur das, was oben steht: eine Messung, die ihn
rechtfertigt.

---

### 7 · Der PDF-Teil wie GoodNotes — siebenundvierzig Bögen (Redur, 7. September)

Redur, mit dem GoodNotes-Dossier: „alles, was GoodNotes machen kann, 1:1 —
nur beim PDF-Teil: wie die bearbeitet wird, importiert, die Stifte usw.",
und „ohne eine Funktion zu löschen". Gegen das Dossier gelesen, was steht
(E351–E360, E375–E385, E464) und was fehlt. Fünf Bögen, jeder mit Prüflauf,
Gegenprobe, Bild und Entscheidung:

  · **G1 — Zeichnen** (E465, test438): Dreieck, rundes Rechteck, Bleistift,
    freie Strichstärke, Buchstabentasten P/2/H/E/S/V/T/A/N/M/R/I. **Steht.**
  · **G2 — Auswahl** (E466, test439): Drehen (Drehgriff), Ausschneiden
    (Strg X), nach vorn und nach hinten, Sperren, Kritzel-Löschen,
    Kreis-Lasso (Umkreisen und halten). **Steht.**
  · **G3 — Seiten** (E467, test440): einfügen (leer, mit Papier, als
    Duplikat), löschen, verschieben, drehen; Lesezeichen je Seite mit
    Liste im Inspector. **Steht.**
  · **G4 — Suche und Verweise** (E468, test441): die Textschicht mit
    Lage aus der Quelle (nicht gespeichert), ein Suchfeld im Studio mit
    Treffern an der Stelle; die Verweise der PDF (pdf.js `getAnnotations`)
    antippbar; eigene Verweise an Marken (Adresse oder [[Seite]]).
    **Steht.**
  · **G5 — Import und Export** (E469, test442): JPG/PNG als Seiten,
    PDF-Seiten an einer Stelle einfügen, eine Seite als Bild sichern, das
    Zoom-Fenster (Seite gross, Übersicht mit Band). **Steht.**
  · **G6 — Das Zoom-Fenster als Schreibfläche** (E470, test443): das Papier
    zieht in einen vergrösserten Streifen um, in der Bühne bleibt ein
    stilles Abbild mit dem Rahmen; eine Zeichenfläche, kein Spiegel.
    **Steht.**
  · **G7 — Die kleinen Reste** (E472, test445): Dreieck erkennen, Bild aus
    der Zwischenablage, mehrere PDFs auf einmal, Rand-Vorschub im
    Zoom-Fenster. **Steht.**
  · **G8 — Das Gedrehte ist wirklich gedreht** (E474, test447): die
    Geometrie kennt `dreh` — der Auswahlrahmen liegt auf der schiefen
    Marke statt weit um sie herum, der Griff läuft beim Ziehen nicht mehr
    weg, der Radierer trifft die Marke statt ihren Kasten, der Kastenzug
    fängt nicht ein, was in der leeren Ecke steht. **Steht.**
  · **G9 — Was der Finger trifft** (E475, test448): die drei §37-Stellen
    aus L133 — der PDF-Verweis (gemessen 6,9 px) bekommt eine Trefffläche,
    die bei der Hälfte des Nachbarabstands haltmacht; der Regler der
    Strichstärke misst 44 statt 16; die Papierauswahl 44 statt 36.
    **Steht.**
  · **G10 — Ein Kasten ist keine Wischspur** (E476, test449): das
    Kritzel-Löschen fragt den WEG des Gekritzels statt seinen Kasten (ein
    schräger Zug löschte drei Marken statt einer — Datenverlust), und die
    Treffer der Suche werden beim Nachziehen einer Seite nur für DIESE
    Seite neu gemalt. **Steht.**
  · **G11 — Die Verweise alter Seiten** (E477, test450): ein Nachtrag über
    die Auftragsmaschine holt die Links von Seiten, die vor E473
    eingelesen wurden — einmal je Original, im Hintergrund, nicht im
    Anzeigeweg. Dabei fand der Prüflauf, dass E473 die LEERE Verweisliste
    gar nicht schrieb: „keine" und „nie nachgesehen" sahen gleich aus.
    **Steht.**
  · **G12 — Ein Dreieck darf liegen, wie es gezogen wurde** (E478,
    test451): die Ernte von G8 — weil die Geometrie `dreh` jetzt wirklich
    kann, bekommt ein gedrehtes Dreieck seinen Winkel statt einer Absage.
    Aufrecht bleibt aufrecht; ein gleichseitiges bekommt die kleinste der
    drei möglichen Drehungen. **Steht.**
  · **G13 — „Seite als Bild" nimmt die Fotos mit** (E479, test452): erst
    gemessen, was ein SVG auf der Leinwand darf (`blob:` gesperrt, `data:`
    geht, `foreignObject` trübt), dann gebaut. Die Bildmarken kommen mit,
    auch gedrehte. Der getippte Text eines Blatts bleibt offen — mit
    geschlossenem Weg, siehe L133. **Steht.**
  · **G14 — Die Miniaturenleiste wie GoodNotes** (E480, test453): ein
    „⋯"-Menü je Seite, das SEINE Seite meint (alle Seitengriffe nehmen
    jetzt entgegen, wen sie meinen), und Ziehen zum Umordnen — mit der
    Maus nach acht Pixeln, mit dem Finger erst nach 350 ms Halten, damit
    die Leiste rollbar bleibt. **Steht.**
  · **G15 — Verweise treffen die Stelle** (E481, test454): `/XYZ`,
    `/FitH` und `/FitR` nennen eine Höhe auf der Zielseite — der Sprung
    rollt jetzt dorthin. Und die Verweisschicht zog ins Papier: damit
    zeigt auch eine gedrehte Seite ihre Verweise. **Steht.**
  · **G16 — Kamera und Radierer** (E482, test455): „Foto aufnehmen" im
    Seitenmenü und an der Miniatur (`capture="environment"`), und der
    Radierer kennt fünf Arten — Ganz und Teil sagen, wie viel weggeht,
    Stift, Marker und Band, wovon. **Steht.**
  · **G17 — Die Kurve mit ihrem Griff** (E483, test456): die erste Form
    mit drei Punkten — und ohne ein neues Feld, weil `pts` eine Liste ist
    und `move`, `scale` und `rotate` ohnehin alle Punkte anfassen. Der
    Verbinder bleibt offen: er ist eine Beziehung, kein Punkt. **Steht.**
  · **G18 — Treffer und Verweise sitzen genauer** (E484, test457): der
    Suchtreffer wird gemessen statt gezählt („iiii" ist kein halbes
    „iiiiWWWW"), und ein Verweis an einem Strich bekommt eine
    Trefffläche entlang des WEGES — nicht den Kasten, den L133
    vorschlug, denn der finge die Nachbarn mit ein. **Steht.**

Nach diesen achtzehn Bögen lief ein **breiter Lauf** über 68 Prüfungen
(E485). Er fand einen echten Fehler, der ausserhalb aller Bündel lag: der
Knopf „Aus dem Original zurückholen" auf einer Seite ohne Bild war unter
der Zeichenschicht nicht zu drücken — und zwar schon vor diesen Bögen.

  · **G19 — Farbsätze** (E486, test458): die vier eigenen Tupfer lassen
    sich unter einem Namen sichern, wieder laden, löschen und auf den
    Auslieferungsstand zurücksetzen — höchstens acht Sätze, und der
    neunte bekommt eine Absage statt dass still der älteste verschwindet.
    Sie liegen in `meta` und reisen in jeder Sicherung mit. Sie stehen
    hinter dem „+" der Farbgruppe, zusammen mit dem Farbwähler: ein
    eigener Knopf kippte die Leiste in eine dritte Zeile (`test351`), und
    ein Farbknopf, der zu allem führt, ist ohnehin GoodNotes' eigener Weg.
    Der Bogen fand zwei ältere Fehler: die Tupfer standen nach dem Wählen
    verkehrt herum, und `Dialog.wahl` schnitt bei vielen Knöpfen den
    letzten stumm ab. **Steht.**
  · **G20 — Suche über mehrere Dokumente** (E487, test459): der Schalter
    „📚" nimmt die anderen Dokumente dazu; ihre Seiten stehen als Klappe
    unter der Suchleiste, und ein Tipp öffnet das Dokument auf DER Seite
    und sucht dort weiter. Der Unterschied — Stelle im offenen Dokument,
    Seite in fremden — steht am Knopf, statt behauptet zu werden. Zwei
    Entwürfe der Klappe hat das BILD widerlegt, nicht der Prüflauf.
    **Steht.**
  · **G21 — Das ganze Dokument als PDF** (E488, test460): ein eigener
    PDF-Schreiber (`src/core/export/pdfWriter.ts`), jede Seite als JPEG,
    ohne die Bildbytes je zu lesen. Was er nicht kann — eine echte
    Textschicht — steht am Knopf und in L133. Der Rückweg über Redions
    eigenen PDF-Leser hat einen Fehler gefunden, den kein Lesen des Codes
    gefunden hätte: das Bild der ersten Seite trug die Objektnummer des
    Katalogs. **Steht.**
  · **G22 — Der Stift** (E490, test461): Redurs eigene Bitte. „Am Ende
    halten" hat nie funktioniert, weil jeder aufgezeichnete Punkt die Uhr
    zurücksetzte — eine ruhig gehaltene Hand zittert. Jetzt hat der Strich
    einen Ruhepunkt. Dazu der **Schutzleiter**: grün-gelb und
    Strich-Punkt, in EINER Marke, und er überlebt das Geradeziehen. Und
    Zurück/Vor stehen links, wie bei GoodNotes und wie auf Redurs Bild.
    **Steht.**
  · **G23 — Was auf dieser Seite gesperrt ist** (E492, test462): eine Liste
    im Inspector mit „Entsperren" je Marke. Das war ein Rundlauf ohne
    Ausgang — sperren geht über die Auswahl, und die geht bei einer
    gesperrten Marke nicht. Zwei Funde kamen vom Bild: der Stil im Namen
    und das Aufleuchten der Marke beim Berühren der Zeile. **Steht.**
  · **G24 — Präsentieren mit Laserpointer** (E493, test463): Vollbild ohne
    Leisten, eine Seite ganz, blättern mit Tipp und Taste, ein roter Punkt,
    der zeigt und nicht schreibt. Die L133-Zeile, die das für „ausserhalb
    des PDF-Teils" erklärte, war falsch — es braucht weder Server noch
    Konto. **Steht.**
  · **G25 — Die Elemente-Bibliothek** (E494, test464): eine Auswahl wird
    unter einem Namen zum Stempel und überlebt das Dokument — das zwölfte
    Werkzeug ⭐, „Als Element" bei der Auswahl, ein Feld von Kacheln mit
    dem Bild jedes Elements, gesetzt mittig unter dem Zeiger. Auch hier
    war die L133-Begründung keine: „wäre neu" ist eine Beschreibung. Die
    Bibliothek liegt in `meta` und reist in jeder Sicherung mit; sechzig
    Elemente, keines über 200 KB, und beide Grenzen werden gesagt.
    Nebenbei fiel auf, dass `test348 §5` seit E486 rot war. **Steht.**

  · **G26 — Cornell und Notenlinien** (E495, test465): die zwei Papiere, an
    denen man GoodNotes' Vorlagenwähler erkennt — 50 mm Spalte, 30 mm Kopf,
    50 mm Zusammenfassung; fünf Linien im Abstand von 3 mm, dann 15 mm
    Luft. Sie stehen im selben Katalog wie die fünf alten und damit auch im
    Wähler des Studios. Das Bild fand, dass Prozentzahlen in einem Verlauf
    die KACHEL meinen und nicht das Element: das erste Notenpapier zeigte
    eine Linie je System statt fünf, und kein Prüflauf hätte das gemeldet.
    **Steht.**

  · **G27 — Eine Seite in ein anderes Dokument** (E496, test466): GoodNotes'
    „Copy to…" und „Move to…". Kopieren gibt frische Kennungen und ein
    eigenes Seitenbild; Verschieben hängt denselben Block um und behält
    seine Kennung — sonst zeigte jeder Verweis auf die Seite ins Leere.
    Die Reihenfolge beim Verschieben ist die Sicherheit: erst dazulegen,
    dann umhängen, zuletzt wegnehmen. Der Prüflauf fand, dass die erste
    Fassung das Rechtetor mit `edit` statt `bearbeiten` fragte — die Liste
    der Ziele war auf jedem Gerät leer. **Steht.**

  · **G28 — Der breite Lauf** (E497): nach den vier Bögen alles gefahren,
    was die geänderten Bausteine anfasst — 84 Suiten, gesucht statt
    geraten. Zwei echte Fehler, beide älter als diese Bögen und beide rot,
    ohne dass es jemand sah: das Abdeckband hiess in zwei Leisten
    verschieden, und „Zurück"/„Vor" rollten am Telefon aus dem Bild, weil
    die Klebe-Regel nach E490 noch auf `right:0` stand. **Steht.**

  · **G29 — Die zwei letzten Reste** (E498, test467): „Ausschnitt" und
    „Erkennen" ruhen sichtbar am Knopf, solange das Zoom-Fenster offen ist
    (bisher gab es die Absage erst nach dem Druck), und Seiten lassen sich
    über Spaltengrenzen hinweg umordnen — mit der Umhänge-Maschinerie aus
    E496. Beim Abarbeiten kam heraus, dass drei L133-Zeilen gar keine
    Lücke gegenüber GoodNotes sind (Verbinder, Auswahl über mehrere
    Blätter, Stift-Favoriten); sie stehen jetzt als Wunsch da, nicht als
    Rückstand. **Steht.**

  · **G30 — Ein mehrseitiges Blatt in Seiten zerlegen** (E499, test468):
    die letzte offene Zeile unter „Seiten". Nicht die Form abgeschafft,
    sondern einen Griff gebaut, der sie in GoodNotes-Form bringt. Jede
    Marke kommt auf die Seite, in der ihre Mitte liegt, und bleibt ganz;
    was über eine Grenze läuft, wird gezählt und gesagt, bevor etwas
    geschieht. **Steht.**

  · **G31 — Die Schalensuche findet die Stelle** (E500, test469): Strg P
    nennt bei einem Dokument die Seite, zeigt ihren Ausschnitt und springt
    dorthin — und findet dabei zum ersten Mal, was von HAND geschrieben
    ist: Marken stehen in keinem Suchindex, und ein Heft mit dem Wort als
    Textmarke war unauffindbar. Die Gegenprobe hat einen zweiten Sprungweg
    entlarvt, den `zeigeBlock` längst konnte. **Steht.**

  · **G32 — Ein Farbsatz wird eine Voreinstellung** (E501, test470 §1–§3):
    das Dossier verlangt „Farben und Stärken … als Presets". Redion hatte
    die Farben; Stift und Strichstärke fehlten. Kein zweiter Katalog,
    sondern zwei optionale Felder am vorhandenen Satz — ein Satz von
    vorher lädt weiter genau seine Farben. Der Fund nebenbei: die
    Strichstärke steht an vier Orten, und drei Wege dorthin waren drei
    Abschriften. Jetzt eine Tür. **Steht.**

  · **G33 — GIF und Formelbuch als Marke** (E502, test470 §4–§6): ein GIF
    geht mit seinem Typ und seiner Länge in die Ablage und läuft deshalb
    auf dem Blatt weiter; eine PDF-Seite wird zur Bildmarke und lässt sich
    verschieben, ziehen, drehen und sperren wie jede andere. Kein neues
    Werkzeug — ein zweiter Weg in `bildAblegen`. **Steht.**

  · **G34 — Das eigene Formelheft über dem Dokument** (E503, test471):
    Redur wollte sein Original im Studio sehen, schieben, in der Grösse
    ziehen und ein- und ausschalten. Der Knopf steht jetzt neben dem
    Fachzeichen, das Heft merkt sich, dass es aufgeschlagen war, und die
    geladene PDF bleibt Byte für Byte dieselbe. Drei Fehler kamen dabei
    heraus, die kein Auge gemeldet hätte: der Griff zum Ziehen war seit
    jeher weg (jedes Neumalen nahm ihn mit), das Fenster legte sich auf
    den Knopf, der es öffnet, und der Horcher meldete sich vor dem ersten
    Ruf wieder ab. **Steht.**

  · **G35 — Was das Stift-Dossier gefunden hat** (E504, test472): ein
    Prüflauf über einundzwanzig Punkte von „Digitale Stifte und
    PDF-Annotationen", jeder Fund adversarisch gegengelesen. Fünf Punkte
    standen schon (coalesced Samples im gespeicherten Strich, Vorhersage
    nie in den Daten, Drehung als affine Matrix, Full Rewrite, Kontur mit
    variabler Breite). Zwei waren echte Fehler und sind repariert: der
    Glätter hing an der Abtastrate des Geräts (bei 240 Hz viermal
    schwächer als gemessen), und `pointercancel` speicherte den Strich,
    statt ihn zu verwerfen. **Steht.**

  · **G36 — Die ungeprüfte Zusage und der halbe Satz** (E505, test473):
    CropBox und `/Rotate` wurden von keiner einzigen Prüf-PDF je gefahren
    — jetzt schon, mit einem Ausschnitt, dessen Ursprung nicht bei null
    liegt, und an echten Pixeln gemessen. Es stimmt alles. Und der
    PDF-Export sagt jetzt sichtbar, was er tut, statt nur im `title`, den
    am Telefon niemand sieht. **Steht.**

  · **G37 — Handschrift wird eine echte Annotation** (E506, test474): der
    Schlusssatz des Stift-Dossiers, umgesetzt. Stift und Marker gehen als
    `/Ink`-Annotation mit `/InkList` und `/AP` heraus statt als Pixel im
    Seitenbild; in Adobe Reader sind sie damit anklickbar, verschiebbar
    und löschbar. Das Abdeckband bleibt mit Absicht im Bild — eines, das
    man wegschieben kann, deckt nichts ab. Geprüft an zurückgelesenen
    Bytes: die Seite zweimal gerendert, einmal ohne und einmal mit
    Annotationen, und der Unterschied ist der Beweis. **Steht.**

  · **G38 — Die Neigung des Stifts** (E507, test475): `tiltX`, `tiltY`,
    `twist`, `altitudeAngle` und `azimuthAngle` kamen im ganzen `src/`
    kein einziges Mal vor. Jetzt schattiert der Bleistift, wenn man ihn
    flach hält — gemessen 1,8 pt gegen 3,3 pt bei gleichem Druck. Nur der
    Bleistift; ein Füller wird durch Schräghalten nicht breiter. Und der
    Druck sagt seither, ob er gemessen oder aus dem Tempo gerechnet ist.
    Fund nebenbei: das Vereinfachen beim Absetzen indizierte `pressure`
    neu, das neue Feld aber nicht — fünfzehn Neigungen zu acht Punkten.
    **Steht.**

  · **G39 — Der Blick kommt beim Hinschauen** (E508, test476): Redurs
    Wunsch — die Ordnerkarte beim Überfahren statt beim Klicken. Beides,
    nicht statt: erzeigt geht sie wieder zu, angetippt bleibt sie (§37,
    das Telefon kennt kein Überfahren). 280 ms Wartezeit trennen die
    Absicht vom Vorbeifahren. Dazu das Lustige: eine Welle aus EINER Zahl
    statt fünf geratener, Überschwingen, eine wippende Klappe, und ein
    Blatt, das sich aufrichtet. Drei Wächter des ersten Entwurfs waren vor
    der Arbeit schon grün und mussten geschärft werden. **Steht.**

  · **G40 — Ein Stift für Fachzeichen** (E509, test477): Redurs Wunsch —
    die zehn Adern eines Schaltplans als eigene Farbreihe, jede mit ihrem
    Namen beim Überfahren. PE grün-gelb und strichpunktiert, N blau und
    NUR Striche, L1 braun, L2 schwarz, L3 grau, S orange, und vier weit
    auseinanderliegende Töne für die Korrespondierenden. Der Stift steht
    am ENDE der Stiftreihe, damit der gewohnte Rundlauf bleibt. Nebenbei
    heissen jetzt auch die fünf gewöhnlichen Farben beim Namen statt
    fünfmal „Farbe". Drei Fehler: die Reihe schaltete nur beim
    Stiftwechsel um (gefunden vom Bild, nicht vom Prüflauf), der Einschub
    zerschnitt eine CSS-Regel, und L2 ist dasselbe Schwarz wie der erste
    Farbtupfer. **Steht.**

  · **G41 — Die Mitte einer Linie zählt auch** (E510, test439 §5b): kein
    Wunsch, sondern ein roter Lauf. Die Hälfte-Regel des
    Kritzel-Radierers zählte gespeicherte Punkte — ein Strich hat
    hunderte, eine gerade Linie zwei. Ein Gekritzel über ihre Mitte nahm
    sie deshalb seit E466 nie weg. Jetzt wird an der LÄNGE gemessen
    (`InkGeometry.densify`). Aufgefallen ist es, weil E504 die Glättung
    auf Zeit umstellte und die zeitlosen Ereignisse eines Prüflaufs
    seither wie eine Hand mit 20 px je Millisekunde aussehen. **Steht.**

  · **G42 — Die Tinte holt die Spitze ein** (E511, test478): Redurs Wunsch
    „flüssiger zeichnen, mehr Animationen". Gemessen wurde zuerst, und die
    naheliegende Vermutung war falsch: 1200 Punkte auf einem vollen Blatt
    laufen flach bei 16,7 ms je Bild, kein einziger Aussetzer. Was fehlte,
    war nicht Geschwindigkeit, sondern WO die Tinte liegt: bei 0,4 px/ms —
    dem Tempo der Handschrift — lag sie 7,16 px neben der Stiftspitze, und
    der Fehler wechselte mit dem Tempo das Vorzeichen. Der nasse Schwanz
    rechnet jetzt an den ROHEN Punkten und beginnt an der gemessenen
    Stelle; gespeichert wird davon weiterhin nichts. Dazu vier Bewegungen,
    die etwas sagen, und eine Abschaltung für Menschen, die keine wollen.
    **Steht.**

  · **G43 — Die Leiste wie GoodNotes, und eine Fläche, die nicht mehr
    stirbt** (E512, test479 + test480): Redurs Fehlerbericht zuerst — nach
    ein paar Minuten zeichnete nichts mehr, weder Stift noch Maus. Es lag
    nicht an der Zeit (alle zehn Uhren der App einzeln ausgelöst: unschuldig),
    sondern an EINEM verlorenen `pointerup`: die Kennung des führenden
    Zeigers blieb stehen und wies jeden anderen ab. Jetzt wird das Ende
    auch am Fenster gehört, und ein verwaister Führender wird nach 500 ms
    übernommen — sein Zug abgeschlossen, nicht verworfen. Dazu die drei
    Wünsche: die Stiftreihe statt des Wechselknopfs, der Laserpointer als
    Werkzeug (es gab ihn nur im Vollbild) und vier Plätze für die Leiste.
    **Steht.**

  · **G44 — Das Notizbuch im Katalog** (E513, test265): Redur wollte
    hinter dem „+" dieselben fünf Wege wie in GoodNotes. Vier standen da;
    das Notizbuch fehlte, obwohl Redion es seit E264 kann — der Weg lag
    nur im Regal „Notizhefte". Jetzt steht er im einen Katalog, über
    dieselbe Anlege-Maschine (§8). Der zweite Teil derselben Nachricht —
    „eine neue PDF kopiert die aktuelle" — liess sich auf drei gemessenen
    Wegen NICHT nachstellen; die Frage nach der genauen Stelle steht als
    **L139** — und ist mit **G47** gefunden: es war kein Import-Fehler,
    sondern ein Wort an der falschen Stelle. **Steht.**

  · **G45 — Die Chronik „Red-ur"** (E514, test481): Redurs zweites Gehirn.
    Eine Quelle (`chronik/chronik.json`), drei Ansichten — UR.md,
    PROBLEME.md und ein Fenster in Redion, das die Suche nach „Red-ur"
    öffnet. Mit vier Graphen, dem Stapel der Tage in echter Perspektive,
    jeder Nachricht 1:1 samt Satzverbesserung und besserem Prompt, und
    jedem Problem mit seiner falschen Vermutung. Ehrlich dabei: die
    Uhrzeiten der Nachrichten sind abgeleitet und mit „ca." gekennzeichnet, die Token
    fehlen (L141), und der Code ist ein Türschild (L140). **Steht.**

  · **G46 — Die Zeichen der Leiste** (E515, test480 §5): Redur schickte
    ein Foto der GoodNotes-Leiste — „Nehme die symbole. Für die redion
    bitte 1:1". Die dreizehn Werkzeuge trugen Emoji: eigene Farbe, eigene
    Strichstärke, eigene Grundlinie, auf jedem System anders. Jetzt sind
    es dreiunddreissig neue Zeichen im Register (24 × 24, Strichstärke
    1,7, `currentColor`), nach demselben Raster wie die hundert seit E273
    — kein zweiter Zeichensatz in der PDF-Fläche (§8). Sieben Textzeichen
    bleiben mit Grund, allen voran das `Aa` der Schriftart: es ist eine
    Schriftprobe und zeigt, was keine Zeichnung zeigen kann. Nachgemessen
    dabei: die festen 18 px sind rund 6 breiter als ein Emoji, dreizehnmal
    fünfundsiebzig Pixel — die Werkzeugzeile kippte in eine zweite, und
    `test351` hat es gefunden. Zurückgeholt an drei Stellen, jede mit
    Grund. Und danach fand das BILD, was keine Zahl gemeldet hatte: Füller,
    Kugelschreiber und Bleistift waren derselbe schräge Stift — gemessen
    73 % gemeinsame Tinte bei 16 px. Der erste Versuch (schärfere Spitzen)
    machte es schlimmer, 85 %; bei dieser Grösse trägt der Schaft alles.
    Jetzt drei Umrisse statt dreier Spitzen, kein Paar über 46 %, und
    `test480 §7` hält die Grenze bei 60. **Steht.**

  · **G47 — L139 gefunden** (E516, test482): Redurs „eine neue PDF kopiert
    die aktuelle" war kein Import-Fehler. Im Regal waren oben zwei Knöpfe
    zu sehen: „PDF öffnen" holte die ZULETZT geöffnete PDF zurück, „PDF
    importieren" las eine neue ein — und der Knopf der Kopfleiste, der
    ebenfalls „PDF öffnen" heisst und wirklich importiert, ist dort
    ausgeblendet. Wer eine PDF öffnen will, drückt „PDF öffnen" und bekommt
    seine aktuelle. Deshalb waren die drei Messungen aus E513 sauber: sie
    fragten, ob der Import die richtige Datei ablegt, nicht welchen Knopf
    ein Mensch drückt. Jetzt heissen beide Importknöpfe gleich und die
    Karte „Weiterlesen". Der vierte Weg — „PDF hier einfügen" im Inspector,
    den kein Prüflauf öffnen konnte — ist gefahren und sauber. **Steht.**

Der Auftrag heisst deshalb jetzt **siebenundvierzig Bögen**; die Überschrift
zählt sie mit.

Was danach ehrlich offen bleibt, steht in **L133** (Audio mit Zeitbezug,
Handschrift-zu-Text, Mathe, GIPHY, Wolke, DOCX/PPTX) — und dazu die
benannten Reste: der Verbinder des Shape-Tools, die Auswahl über mehrere
Blätter, das Umordnen über mehrere Spalten, die Vorlagenseite mit Inhalt,
mehrseitige Notizhefte als EIN Block, „Ausschnitt" und „Erkennen" im
Zoom-Fenster, der getippte Text im gesicherten Bild und die Schalensuche
mit Stellen.

**Priorität** — hoch; es ist Redurs Auftrag vom 7. September.

---

### 6 · Das UI-System aus dem Handoff — 50 Komponenten, sechs Phasen

Redur hat am 6. September ein Handoff-Paket geschickt: 50 Uiverse-
Komponenten, davon 20 mit Originalcode, dazu den Implementierungsauftrag
(`REDION_UI_IMPLEMENTIERUNG_PROMPT.md`, liegt nicht im Repository). Der
Auftrag will kein Sammelsurium, sondern EIN Redion-Designsystem: die
Originale liefern Bewegung und Idee, Redion liefert Farbe, Zustand, Logik
und Zugänglichkeit.

**Was steht (E439, E440):**

  · Die UI-Reserve unter `quell/entwicklung/ui-reserve/` — alle 50 als
    Ordner, die 20 Originale unverändert, eine Galerie mit Filter, ein
    Wächter (`test426`). Nichts davon ist in der App.
  · Der Umschalter (`Segment`, `src/schale/bedienung/segment.ts`) als
    erster Baustein — Phase B, Punkt 2 des Auftrags.
  · Phase B ganz (E441): `Zustand` (die sechs Zustände, Pille) und der
    `Zustandsknopf` (sperrt, aria-busy, Live-Text, Sicht „laden" an der
    Sicherung und der HTML-Einzeldatei = Nr. 03), die Weiter-Variante
    `.btn.weiter` (Nr. 02). Nr. 19 bleibt Reserve, bis Redur entscheidet.
  · Eine Marke (E456): das „N" links im Menüband, der Kontokreis und das
    „R" im Willkommen sind weg — nur „R redion STUDIO" bleibt.
  · Die Karte in `doku/UI-KOMPONENTEN.md`: je Komponente Quelle-Status,
    Redion-Status, Ort, ob gebaut.
  · Redurs vierzehn Vorgaben vom 6. September (E458–E463, test431–436):
    Drucker-Karte (Nr. 28), Ordnerkarte (Nr. 29) mit dem Auge am
    Ordnerdeckel, Merkzeichen, vier Lader (Ring, Sterne, Wort, Presse),
    Schalter, Staffelei, Textur, Symbolreihe, die tippende Hand (Nr. 09) im
    Rundgang und der Funkel-Knopf. Seit E463 stehen sie an den Wegen, die
    man täglich geht — Studio-Kopf, PDF-Einlesen, Start, Cover-Wahl.

**Was offen ist**, in der Reihenfolge des Auftrags (Phase B bis F):

  · B — nur noch der Standardspinner (Nr. 19, KONFLIKT mit E46, braucht
    Redur) und ein kleiner Rest: der Sicherungsknopf des Start-Bildschirms
    (E57, `.hs-kreisel`) auf den Zustandsknopf umstellen, test114 §19 dazu.
  · C — Bibliothek: Baumansicht (Nr. 38, höchste Priorität), grosser
    Datei-Browser (16), Upload-Status (41). Die Ordnerkarte (29) steht (E459).
  · D — KI: Generate→Generating (26), Spark-Effekt in die Denkkugel (45),
    Circuit (43), Orb-Optionszeile (31), KI-Schalter nur bei echtem Zustand (25).
  · E — PDF/Sync/Wissen/Elektro: Server/Daten-SVG (11), Zahnrad (46),
    Pixel (50), Orbit (48), Analyseindikator (37), Gerätesteuerung (34).
    Der Drucker-Prozess (28) steht (E458).
  · F — Lernwelt: Aurora-Start (15), Workflow-Karten (24), Karussell (21),
    Teilen-Menü (35), Schnellaktionen (27). Die Gestenhand (09) steht — im
    Rundgang statt in der Lernwelt (E463).

Jede Komponente: bestehenden Bereich lesen, an echten Zustand anschliessen,
Prüflauf mit Gegenprobe, Bild. Für die 30 ohne Originalcode gilt: nur die
Idee, nie eine Nachbildung.

**Zwei Dinge braucht Redur:** die Entscheidung zum Spinner (E46 gegen den
Auftrag), und die zwei Kopfzeilen übereinander seit dem Studio (Studio-Leiste
plus alte Kopfzeile, 114 px am Rechner; am Telefon nur eine).

**Wo** — `doku/UI-KOMPONENTEN.md` (die Tabelle), `quell/entwicklung/ui-reserve/`,
ENTSCHEIDUNGEN.md E439/E440.

**Priorität** — hoch; es ist Redurs aktueller Auftrag.

---

### 5 · Was in LUECKEN.md offen steht

Die Produktlücken stehen dort und werden dort gepflegt — sie hier zu
wiederholen hiesse, zwei Listen zu führen, die auseinanderlaufen.

Zuletzt geschlossen: der Sofort-Block des UX-Prüfberichts (E386 — Ollama ohne
Stern, Werkzeuge mit Namen, PDF-Titel, Zoom-Persistenz, Zurück-Zustand,
einheitliche Begriffe); vier rote Läufe, die schon vor E384 rot waren, und drei
davon Fehler aus E380/E381 (E385 — erfundene CSS-Marken, rohe Masse statt
Marken, ein Werkzeug aus der Zeit vor E375); die PDF öffnet als ganzer Bildschirm (E384 — Redurs Satz
zum zweiten Mal; E296 hatte den Seitenkopf geräumt, nicht die Schale drumherum),
L120 Listenform (E382), L120 Telefon-Brotkrume (E381), L120 Kern (E380 — das Dokumente-Regal hat Ebenen),
L115 Rest (E375), der flüssige Stift und seine Nachbarwege (E376–E379),
L61 Rest (E374), L114 Punkt 7 (E373), L10 Marken (E372), L10 Side Peek
(E371), L78 Punkt 1 und L114 Punkt 4 (E368), L116 (E367).

L122 wurde am selben Tag aufgemacht und wieder geschlossen: zwei rote Zeilen in
`test210` §4, und beide Male war die PRÜFUNG falsch — die Schranke „≥ 14
Werkzeuge" stammte aus der Zeit vor E375 (dreizehn sind vollständig), und die
„Mitte" war als `scrollWidth / 2` gerechnet statt als
`(scrollWidth − clientWidth) / 2`, was den Browser ans Ende klemmte.

Zuletzt geschlossen (Fortsetzung): die doppelt vergebenen Prüfports (E405 —
23 Gruppen über 48 Läufe, eine Zahl viermal vergeben; `test400` hält es).

Zuletzt geschlossen (5. September): **L130 ganz** — der Ansichten-Durchgang.
Punkt 3 (kein Hinweis, dass rechts noch etwas kommt) war schon zu, als er
aufgeschrieben wurde; was fehlte, war der Wächter für den Rechner (E420).
Punkt 5 (der Zeitstrahl nutzt seine Fläche nicht) und Punkt 6 (keine Marke
am Anfang) sind mit E419 zu — und beide Male war die Ursache eine andere
als vermutet: die Fläche liess sich ohne Umbau auf Anteile strecken, und
die erste Achsenmarke fehlte nicht, sie stand bei x = −45 links ausserhalb.

Zuletzt AUFGEMACHT: **L131** — vier Fäden aus dem Telefon-Durchgang, die
bewusst offen geblieben sind. Einer ist inzwischen zu: die Namensspalte des
Side Peek war nachgemessen ein Nichtbefund (E433, 30 % statt 44 %). Drei
bleiben: die Karte ohne Offline-Hinweis (im Container nicht von „lädt noch"
zu unterscheiden), drei Klassen ohne CSS-Regel, und `.orb-inline` — die
EINZIGE wirklich tote CSS-Regel im ganzen Bestand, nicht entfernt, weil §43
eine Rückfrage verlangt. Und **L129** — die Denkkugel (E403) hängt bisher nur am
Agentenfenster. Drei Stellen wären Kandidaten, eine davon ausdrücklich NICHT
(ein Fortschrittsbalken sagt mehr als eine Kugel), und zwei der neun Zustände
haben in Redion noch gar keinen Ort. Und **L123** — die zwölf Befunde des UX-Prüfberichts, die noch
offen sind (Sprint: F13, F14 · Politur: F12, F17, F18 — F03 ist mit E398,
F10 mit E397 und F09 mit E400+E401 zu; fünf Nebenfunde in L128). Zwei brauchen Redur: F02 (welche Navigation ist die primäre?)
und F13 (echter Geräte-Abnahmelauf). Und **L120** — was nach E380 an GoodNotes noch fehlt.
Der Kern (Ebenen im Regal, Hineingehen, nach dem Entpacken im Ordner
stehen) ist zu; offen bleiben zwei Regale für dieselbe Sache
(`bibliothek.ts` und `notebook.ts`) und eine untere Leiste, die noch nicht
GoodNotes folgt. Und weiterhin **L119** — der flüssige Stift: zwei seiner
drei Punkte brauchen Redur und ein Gerät mit Stift (`getPredictedEvents()`
auf echter Hardware, und ob ein echter Stift im Druck zappelt).

---

## Was beim Aufräumen als längst erledigt herauskam

Diese vier standen bis zum 3. September als offen in der Liste. Beim
Nachsehen im Quelltext war jeder von ihnen gebaut:

| Stand hier als offen | Tatsächlich |
|---|---|
| XLSX mit mehreren Blättern exportieren | E91 — `ausgeben.ts` schreibt alle Blätter |
| ODS lesen und schreiben | E93/E95 — `einlesen.ts`, `ausgeben.ts` |
| XLSX direkt in eine Datenbank | gebaut — `einlesen.ts` Zeile 14: „`.xlsx` → eine Datenbank je Tabellenblatt" |
| ZIP64 | bewusst nicht gebaut, mit Begründung: eine ehrliche Fehlermeldung statt eines kaputten Archivs (E39, `LUECKEN.md` L14) |

Der vollständige Wortlaut steht in `ERLEDIGTE-AUFGABEN.md` bei Phase 3,
Phase 7 und Phase 8.

**Die Lehre daraus** steht oben in der Grundregel und ist dieselbe, die
`ENTSCHEIDUNGEN.md` E21 schon hatte: nachsehen, nicht erinnern.

---

## Dauerhafte Regeln

**Nach jeder Codeänderung**

```
npm run pruefen -- --schnell
node bauen.mts
```

**Bei Backup, Import oder Export**

```
node pruefungen/alle.mts 96 100
```

**Bei Architektur oder Sicherheit**

```
node pruefungen/alle.mts 87
```

**Bei TypeScript**

```
npm run typecheck
npm run bauen:ts          wenn eine Datei unter src/ liegt, die der Browser lädt
node pruefungen/alle.mts 105 109
```

**Vor jedem Push** die volle Runde: `npm run pruefen`.

---

## Fünf Regeln, die aus Fehlern entstanden sind

1. **Nachsehen statt raten.** Kataloge werden geladen und befragt,
   Schnittstellen nachgeschlagen. Der teuerste wiederkehrende Fehler war,
   eine Schnittstelle aus dem Gedächtnis zu schreiben.
2. **Ein Zweitname wird gegen feste Werte geprüft**, nicht gegen die
   Gegenseite — sonst rechnen beide Seiten dasselbe Verkehrte.
3. **Die Nachbarstelle prüfen.** Der häufigste Befund war nie „etwas
   vergessen", sondern „an einer Stelle getan und an der Nachbarstelle
   nicht".
4. **Jede Reparatur gegenprüfen:** zurückdrehen, rot sehen, wieder
   einsetzen. Sonst weiss niemand, ob der Lauf die Sache wirklich hält.
5. **Feldnamen gespeicherter Daten sind keine Namensfrage**, sondern eine
   Migrationsfrage.

---

## Die Visionskarte

Redurs Satz, der über allem steht, und der Grund, warum es Redion gibt:

> „Ich wollte so etwas machen, das mich Jahre begleitet — dass ich kein
> Word, Excel, PowerPoint mehr brauche. Es sollte meine Schule alles
> begleiten: Noten, Lernen, Lernziele. Und PDF bearbeiten, Fachzeichnen,
> Elektrotechnik-Simulator — und Notion, GoodNotes, Graphy, Obsidian,
> alles in einem."

Was davon steht und was nicht, ist am 28. August 2026 neunfach nachgemessen
worden; die Karte mit jedem einzelnen Befund steht in
`ERLEDIGTE-AUFGABEN.md` unter „Die Visionskarte".

Das Ziel bleibt offen, weil ein Ziel nie „erledigt" ist. Es steht deshalb
hier und nicht dort.
