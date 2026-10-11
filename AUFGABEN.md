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

### 7 · Der PDF-Teil wie GoodNotes — einundfünfzig Bögen (Redur, 7. September)

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

  · **G48 — Der Arbeitsstand auf dem Laptop** (E517, test353): Redur wollte
    nach jeder Änderung wissen, wie er den aktuellen Stand holt — und es
    ging nicht. `holen.bat` holt `main`, `main` steht still bis zum grünen
    Gesamtlauf (§46), gearbeitet wird auf einem Zweig (§43). Drei richtige
    Regeln, und zusammen war der Arbeitsstand vom Laptop aus unerreichbar.
    Jetzt nimmt `holen.bat` einen Zweignamen (ohne Angabe weiterhin `main`,
    das ist Absicht), und `holen-zweig.bat` fragt danach — ohne eigene
    Rettungslogik, die steht in einer Datei (§8). Sechs git-Stellen einzeln
    geprüft, die Folge in einem echten Repo nachgefahren. **Steht.**

  · **G49 — Die fertigen Befehle** (E518, test353 §5c): Redur klickt nicht,
    er kopiert. Die PowerShell-Zeilen stehen jetzt in
    `START-MIT-CLAUDE-CODE.md` statt nur im Gespräch — und der Alltagsbefehl
    ruft `holen.bat`, nicht `git checkout`: das kürzere überspränge die
    ganze Rettung. Vier Zusagen halten die Stellen, an denen ein Abdriften
    wehtut; die letzte war beim ersten Lauf rot und hat den Satz gefangen,
    der die Regel erklärt. **Steht.**

  · **G50 — Der Vergleich gegen den Zweig** (E519, test353 §5b2/§5b3):
    Redur fragte, wie er sieht, ob GitHub und Laptop gleich sind — und
    `vergleichen.bat` hätte ihm die falsche Antwort gegeben: es sah fest
    gegen `main`, das sechs Bögen zurückliegt. Jetzt vergleicht es gegen
    den Zweig, auf dem der Ordner steht; `vergleichen.bat main` ausdrücklich
    gegen den geprüften Stand. Zwei Skripte, zwei Vorgaben, jede mit ihrem
    Grund. Die vier Antworten von `git status -sb` sind in einem echten
    Repo gemessen statt behauptet. Schliesst L142 Punkt 1. **Steht.**

  · **G51 — red-ion und das Zeugnis im Netz** (E520, test270 §1b/§1c):
    Redur bat um eine Kleinigkeit — den Worker-Namen von `redion` auf
    `red-ion`. Beim Lesen des mitgeschickten Deploy-Protokolls standen
    zwischen 290 hochgeladenen Dateien `Redur_Babat_FZ_MOE_Lehrpersonen.pdf`
    und `Schul Inhalt`: fünf Megabyte Zeugnis unter einer ratbaren Adresse.
    E270 hatte die Ausschlussliste gebaut und die richtige Regel dazu
    geschrieben; die Liste kannte nur kein Persönliches, weil damals keines
    dalag. Jetzt sind `*.pdf`, `*.redion`, `chronik/` und
    `quell/entwicklung/` draussen — gelöscht wurde nichts (§43), und der
    Prüflauf misst gegen den echten Ordnerinhalt statt gegen sich selbst.
    Der Deploy scheitert weiterhin, aber an etwas anderem: **L143**.
    **Steht.**

Der Auftrag heisst deshalb jetzt **einundfünfzig Bögen**; die Überschrift
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

### Die fünf Messlatten (Redur, 15. September 2026, E594)

> „Ich will das redion start wie goodnotes bein zeichenn ist, stark wie word
> beim text schreiben bearbeiten, start wie Powerpoint beim Präsentation
> erstellen, strat wie obsidian bein gedechnis und besser als notion mehrer
> funktionen, mehr Qualität haben."

Damit steht neben der Aufzählung von Programmen jetzt, **worin** Redion ihnen
gleichkommen soll. Gezählt an der laufenden App am 15. September 2026:

| Feld | Messlatte | Was steht | Was fehlt |
|---|---|---|---|
| Zeichnen | GoodNotes | 13 Werkzeuge · 6 Stifte · 7 Formen · 5 Radierarten · Lineal · Zoomfenster · Formenerkennung · Lasso · 100 Schritte zurück | der Rest von L133 |
| Freier Text | **OneNote** | ein Tipp aufs Blatt, und man schreibt direkt dort (E597) · auf Blättern UND auf PDF-Seiten · die Schriftleiste wirkt beim Tippen · zweimal auf leeres Papier genügt, auch mit der Auswahl (E599) | Auszeichnung IM Feld (L172) |
| Text | **Word** | 78 Blockarten · `.docx` lesen · Rundreise ohne Verlust · geänderte Absätze kommen im Original an (E595) | **O6** · neue Blöcke kommen nicht mit (L170) |
| Präsentation | PowerPoint | 8 Layouts · 173 Bandeinträge in 7 Reitern · Vortragsmodus · `.pptx` lesen · Rundreise schreiben | Übergänge, Animationen, Folienmaster |
| Gedächtnis | Obsidian | Rückverweise · unverlinkte Erwähnungen · Wissensgraph · Schlagwörter · Suche über mehrere Dokumente · alles lokal | tägliche Notizen als eigener Weg |
| Alles zusammen | Notion, und darüber | 13 Ansichten · 35 Eigenschaftstypen · 255 Formeln · Relationen · Rollups · 11 Vorlagen · 8 Verbindungen · 16 Bereiche | — |

**Stand 15. September 2026: fünf von fünf stehen im Kern, zwei mit Rest.**
„Stark wie Word" heisst für Redur nicht „viele Blockarten", sondern: eine
`.docx` öffnen, darauf schreiben, den Text ändern — ohne dass das Original
leidet. Für `.pptx` ist das seit E592/E593 gebaut, für `.docx` seit **E595**:
die Datei geht Eintrag für Eintrag unverändert wieder heraus, und ein in
Redion geänderter Absatz steht an seiner Stelle darin. Geblieben ist das
Draufschreiben (O6) und das, was in L170 steht. Die Reihenfolge, die daraus
folgt:

1. ~~**O7 — `.docx`-Text ändern.**~~ **ERLEDIGT (E595).** Mit Pythons
   `zipfile` gegengeprüft: 7 Einträge hinein, 7 heraus, genau ein Teil
   inhaltlich anders.
2. **Folienmaster und Übergänge** — der Rest von „1:1 wie PowerPoint".
3. **Tägliche Notizen** — der Rest von „wie Obsidian".
4. **O6 — auf `.docx` schreiben.** Zuletzt: braucht einen Rasterer, und das
   ist der einzige Bogen ohne gebahnten Weg.

---

## Word und PowerPoint öffnen und bearbeiten (O1 … O7)

Redur, 12. September 2026: „ich will das redion auch die anderen datein auch
öffnen kann z.B. word und powerpoint daten, und dort direkt wie die pdf
bearbeiten kann … aber wichtig die originale datei wird immer geschützt."
Und: „beides, drauf schreiben und text ändern … bei der powerpoint daten will
ich es 1:1 wie powerpoint haben."

Drei Vermessungen gegen den Code (12. September) haben ergeben, was da ist:

| | Lesen | Schreiben |
|---|---|---|
| `.docx` | Umwandlung in Blöcke, verlustbehaftet | ja, minimal aber gültig |
| `.xlsx` / `.ods` | Blatt wird Datenbank | ja |
| `.pptx` | **gar nicht** | ja, Textliste auf leerem Grund |

**Was überraschend gut dasteht:** Die Markenschicht (`bereiche/pdf/marken.ts`)
hängt an KEINER PDF-Annahme — sie liest aus einem Block genau `marken` und
`id`. Sie kann Textkästen mit Schrift und Rahmen, Bilder mit eigener Datei,
Verschieben, Skalieren, Drehen, Sperren, 100 Schritte rückgängig und eine
Elementbibliothek. Eine Folie als Block mit freier Objektliste ist genau
diese Form. Die Folienliste zum Umsortieren gibt es auch schon: die
Miniaturleiste des Dokumentmodus.

**Was fehlt:** ein Rasterer für Office (pdf.js liest nur PDF), das Ersetzen
eines einzelnen Eintrags in einer vorhandenen ZIP, und jede Grundlage dafür,
Dokumentinhalt zu ändern — Marken liegen NEBEN dem Dokument.

### Die Bögen, in der Reihenfolge

- **O1 · Das Original bleibt** — ERLEDIGT (E538). Office war die einzige
  Gruppe ohne Originalschutz.
- **O2 · Der ZIP-Teil lernt Durchreichen** — ERLEDIGT (E539). Der Leser gibt rohe, noch
  gepackte Bytes heraus; der Schreiber nimmt `methode: 8` mit getrennten
  Roh- und Packlängen entgegen. Erst damit lässt sich eine `.docx` öffnen,
  EINEN Eintrag ersetzen und der Rest unverändert zurückschreiben. Ohne
  diesen Bogen ist jede Rundreise ein Neuschreiben — gültig, aber ungepackt
  und mit Datum 1980.
- **O3 · `.pptx` lesen** — ERLEDIGT (E540), Grenzen in L151. `ppt/presentation.xml` (Reihenfolge, Foliengrösse),
  `slideN.xml` (`p:spTree` → Textkästen mit `a:xfrm`-Lage, `p:pic` → Bilder),
  die `.rels` (Bildziele), `slideLayouts`/`slideMasters` für Geerbtes,
  `theme1.xml` für Farben. Jede Folie wird ein Block mit `marken`.
  Nachgezogen seit: Gruppen rekursiv (E555), Format je Absatz (E557),
  Lage, Grad und Hintergrund geerbt über Layout und Master (E558),
  das Farbthema aufgelöst (E559), die Ausrichtung gelesen UND bedienbar
  gemacht (E560), **gemischte Läufe innerhalb eines Absatzes (E561)**.
  Was jetzt noch fehlt, steht in L151 und ist kleiner als das Erledigte:
  Blocksatz, Spiegelung, die Drehung einer GRUPPE, Diagramme, Zellränder,
  die Schriftart (`a:latin`) und alle Formen ausser den fünf, die Redion
  kennt. **Gemessen an Redurs echter Datei am 14. September**: gefüllte
  Formen und die geerbte Textfarbe fehlten — beides mit E566 geschlossen,
  beides von keinem der zehn vorherigen Prüfstücke gefunden.
  L155 (die zu niedrige Breitenschätzung, gefunden bei E561) ist mit
  **E562** geschlossen, die Drehung mit **E563**, die Tabellen mit **E565** —
  als Gitter auf der Folie, nicht als Tabellenblock (der Grund steht dort).
- **O4 · Folien bearbeiten** — ZUR HÄLFTE (E546). Zwei Sachen sind erledigt:
  - Das ZEIGEN einer Folie ändert sie nicht mehr. `Blatt.zeichne` legte für
    jedes Blatt ohne Textkinder eine leere Zeile AN — bei 27 eingelesenen
    Folien also 27 Blöcke, nur vom Hinsehen, und ihr Platzhalter lag quer
    über dem Folientitel.
  - Die eingelesene Präsentation geht als FOLIENSATZ auf, nicht als Stapel
    Blätter: eine Werkzeugleiste für das ganze Dokument statt einer je
    Folie, Seitenliste, „Präsentieren", „Drucken". Der Dokumentmodus konnte
    das längst — es fehlte die Flagge `dokumentModus` am Seitenblock. Eine
    Zeile (derselbe Fund wie E397).

  Und die Folienliste zeigt seit E547 wirklich Folien: das Seitenverhältnis
  kommt vom Block (16:9 statt fest verdrahtetem A4), in der Miniatur steht
  die Folie statt eines Bleistifts — mit demselben Zeichner, deshalb deckt
  die Abdeckung auch dort —, und jede trägt ihre Nummer und ihren Titel
  statt 27-mal „A4-Blatt".

  Und seit E548 gibt es den WEG hinein: „Präsentation" steht im
  Anlegen-Menü, legt eine 16:9-Seite im Dokumentmodus an und fragt vorher
  nach einem Layout. Acht davon — Titelfolie, Titel und Inhalt, Zwei
  Inhalte, Vergleich, Abschnittsüberschrift, Nur Titel, Bild mit
  Beschriftung, Leer. Der Befehl „Neue Folie" hängt eine an, mit denselben
  Layouts und den Massen der vorhandenen Folien.

  Und seit E549 steht der KATALOG: `Register.menueband` hat einen Reiter
  „Präsentation", den `Folienvorlagen.bandEintraege` beliefert, und jeder
  Eintrag bringt sein eigenes `zeigen()` mit — ohne Foliensatz ist der
  ganze Reiter weg. Im Dokumentmodus öffnet ein Knopf „📽️ Folie" in der
  Dokumentleiste dasselbe Verzeichnis als Menü: Folien (Neue Folie,
  Folienliste) · Vortrag (Präsentieren) · Ausgeben (Als PowerPoint, Als
  PDF, Drucken).

  **Und seit E550 steht die LEISTE** — der Layout-Bogen, den E549 als offen
  vermerkt hat. Eine Reiterzeile mit einem Band darunter, zwischen
  Kopfleiste und Zeichenleiste, also über der Folie wie in PowerPoint.
  Sie fliesst in der Spalte mit, statt sich darüberzulegen; das war der
  ganze Unterschied zum ersten Versuch. Gemessen bei 1440 × 852: Band
  110 px, Fläche von 698 auf 588 px — und die Folie bleibt 980 × 551,
  also unverändert. Das Band hat die Luft genommen, nicht die Folie.

  **Fünf Reiter, und zwei bleiben draussen — gemessen, nicht gewählt:**
  alle 151 Einträge des Bandkatalogs wurden bei offenem Foliensatz einzeln
  aufgerufen. Bei `start` taten 14 von 14 nichts, bei `einfuegen` 65 von 69
  — sie brauchen eine Schreibmarke, die es im Dokumentmodus nicht gibt.
  `zeichnen` bleibt draussen, weil seine dreissig Knöpfe als Zeichenleiste
  schon dauerhaft zwei Zeilen tiefer stehen (§8). Übrig: Präsentation ·
  Ansicht · Verlauf · Überprüfen · Hilfe. Unter 900 px Fensterbreite gibt
  es kein Band — dort führt der Knopf „📽️ Folie" ins Menü.

  **Und seit E551 STEHT die Folie** statt durchzurollen — die Einzelseite
  gab es seit E398 als Schalter, geändert wurde nur die VORGABE, und nur
  für den quer liegenden Foliensatz. Das folgt beiden Ansagen Redurs:
  „die PDF Seiten … komplet wie one note" (E299) gilt weiter für PDF und
  Heft, „1:1 wie PowerPoint" für Folien. Der Schalter bleibt der stärkere,
  in beide Richtungen geprüft.

  Dazu zwei Funde, beide gemessen: am Telefon stand die Folie oben mit
  **476 px leerer Fläche darunter** (28 % der Höhe genutzt) — sie steht
  jetzt mittig, mit `safe center`, weil einfaches `center` ihren Anfang
  unerreichbar macht (gemessen −28, −204, −464 px). Und „📽️ Folie" aus
  E549 kostete dem Titel am Telefon 44 px: **70 statt der 100, die
  `test285` verlangt**. Gemeldet hat es niemand, weil `test285` ein PDF
  öffnet und der Knopf dort versteckt ist. Er steht jetzt in der
  Ansichtsklappe; Titel 114 px.

  **Und seit E552 ist es „gleich wie PowerPoint"** — Redurs Antwort auf die
  Frage oben. „Zeichnen" ist ein REITER geworden, keine zweite Dauerleiste.
  Dabei zieht die ECHTE Leiste um (dasselbe Element, sechzehn Knöpfe) statt
  nachgebaut zu werden: die dreissig Registereinträge des Reiters `zeichnen`
  bedienen die Seitenfläche, nicht die Dokumentschicht — vierzehn geprüft,
  keiner wirkte, und `an()` gab bei allen vierzehn `true`. Im Band stünden
  also vierzehn gleichzeitig gewählte Knöpfe, die nichts tun.

  Gemessen bei 1440 × 852: die Fläche wächst von 588 auf **646 px** (662
  unter „Zeichnen"), ohne dass ein Knopf verschwunden wäre. „✎ Annotieren"
  holt den Reiter nach vorn, damit niemand den Stift sucht.

  **Und die Griffe heissen jetzt „Folie".** Das Wort kommt aus EINEM Ort
  (`wortEins`/`wortViele`), nicht aus zwanzig. Gemessen: keine der
  siebzehn sichtbaren Beschriftungen eines Foliensatzes sagt noch „Seite",
  im Notizheft sagt keine „Folie". Die DATEN heissen weiter `blatt` —
  übersetzt wird, was ein Mensch liest (§53.3, Grenze 1).

  **Offen bleibt am Folieneditor:**
  - Am Rechner rollt die stehende Folie noch um 111 px — genau die 110, die
    unten für die schwebende Stiftleiste freibleiben. Älter als diese
    Bögen; sie anzutasten hiesse, toten Rollweg gegen verdeckten Inhalt zu
    tauschen.
  - Übergänge und Animationen. Redion liest sie beim `.pptx`-Import nicht
    und schreibt sie nicht. Das ist der grösste Rest von „1:1".
  - Der Folienmaster (Platzhalter-Vererbung). Acht Layouts gibt es seit
    E548; ein Master, der sie alle trägt, fehlt.

  **Und ein Nebenfund, der nicht zum Folieneditor gehört** (L154): der
  zweiundzwanzigste Weg hinter dem „+" hat das Blatt „Neu erstellen" über
  seine Grenze gebracht. Gemessen bei 428 × 926: 10 von 22 Wegen sind ohne
  Rollen zu sehen, der Inhalt ist 1787 px hoch in einer 757 px hohen Liste.
  Damit ist es eine Liste und kein Wegweiser mehr. Wegnehmen ist keine
  Lösung (§47); `test114` hält seit E549 wenigstens fest, dass der letzte
  Eintrag unten wirklich ankommt.
- **O5 · `.pptx` schreiben mit Rundreise** — ZUR HÄLFTE (E592). Eine
  eingelesene Präsentation geht jetzt **vollständig und unverändert** wieder
  heraus: jeder Eintrag Byte für Byte, mit seiner Packmethode und seiner
  Prüfsumme. Vorher überlebte nichts ausser der Endung — gemessen fehlten
  Bild, Thema und `docProps`, und der Dateianhang selbst wurde zur ersten
  Folie. Mit Pythons `zipfile` gegengeprüft: 6432 Bytes hinein, 6432 heraus,
  kein Eintrag anders.
- **O5b · Geänderten Text zurückschreiben** — ERLEDIGT (E593). Jede
  Textmarke, die genau EINEM Absatz mit genau EINEM Lauf und ohne
  Aufzählungszeichen entspricht, merkt sich beim Einlesen ihre Stelle:
  `quelle: { sp, p }`. Das Zurückschreiben schlägt Form und Absatz nach und
  ersetzt genau das eine `<a:t>` — es sucht nicht und rät nicht. Mit Pythons
  `zipfile` gegengeprüft: genau ein Eintrag anders, alles andere Byte für
  Byte gleich, XML wohlgeformt, Vorspann erhalten.
  **Der Rest steht in L168:** Absätze mit mehreren Läufen, zusammengefasste
  Absätze und Aufzählungen bekommen keine Spur — ihr Text müsste auf mehrere
  Stellen verteilt werden, und jede Verteilung wäre geraten (§51). Die
  Ausgabe sagt, wie viele Stellen übernommen wurden.
- **O6 · `.docx` draufschreiben.** Braucht den Rasterer. Das ist der teuerste
  Bogen und der einzige, für den es noch keinen Weg gibt.
- **O7 · `.docx` Text ändern** — ERLEDIGT (E595). Liegt das Original als
  Anhang dabei (E538), wird es Eintrag für Eintrag durchgereicht und nur
  `word/document.xml` angefasst. Jeder Absatz mit genau EINER Textstelle
  bekommt beim Einlesen seine Spur `quelle: { p }` — die Nummer im KÖRPER,
  nicht die des Blocks, weil leere Absätze übersprungen werden und Tabellen
  eigene Knoten sind. Gemessen verlor der frische Schreiber vorher
  `docProps/core.xml`, ein PNG und die Farbe `CC0000` und schrieb den
  Anhangsblock als Absatz mit hinein; nachher fehlt nichts und es kommt
  nichts dazu. `test526` (neu, 19 Zusicherungen) war gegen den alten Stand
  14-mal rot.
  **Der Rest steht in L170:** in Redion NEU angelegte Blöcke stehen nicht in
  der Datei, gelöschte bleiben darin stehen — sie tragen keine Spur.

**Ehrlich dazu:** „1:1 wie PowerPoint" ist kein Bogen, sondern O3 bis O5 —
und selbst danach fehlen Übergänge, Animationen und Platzhalter-Vererbung.
Ungemessen ist ausserdem, ob PowerPoint die `.pptx`, die Redion heute
schreibt, überhaupt öffnet (`LUECKEN.md:2708`).


## React-Inseln aus dem Touch Kit (R1a … R1d) — die Grundlage steht (E699)

Redur, 27. September 2026: „du kannst react nutzen keien problem", im
Fragebogen „Mit React (E80 aufheben)". Die Regeln stehen in E699 und
CLAUDE.md §6: Inseln an Ort und Stelle, keine zweite Oberfläche.

- **R1a · Die Grundlage — GELANDET (E699, `test578`, `test579`).** React
  19.3.0 eingepackt, das Touch Kit als Kopie (UI-Kit @c192821), der Bau mit
  Vite, der Lader ohne Startlast, die Brücke zu Redions Farben, das Schema
  „Touch Kit hell/dunkel", eine Probe-Insel nur für den Prüflauf. Offen
  daraus: **L222** (was upstream in UI-Kit fehlt), **L223** (die
  Fehlerliste schwärzt im Ordnerbetrieb).
- **R1b · Die Dialoge.** `Dialog.frage`, `Dialog.wahl`,
  `Dialog.mehrzeilig` und die verbliebenen `confirm()`/`prompt()` (22 und
  9 Stellen) werden Dialoge und Aktionsblätter des Kits — HINTER der
  vorhandenen Schnittstelle (`UI.frage` …), mit demselben Versprechen
  (`null` gegen `''`). Zuerst lösen: das Zusammenspiel mit `Fokus`
  (fokus.ts setzt alles ausser dem obersten `.overlay` auf `inert`, das Kit
  auch — zwei Verwalter sperren sich gegenseitig) und mit dem gemeinsamen
  Escape (E302, schale.ts), der `defaultPrevented` nicht beachtet; und
  **L222 Punkt 6** — die Knöpfe im Dialog des Kits schreiben in
  Akzentfarbe, und die Brücke legt die auf `--accent`, nicht auf
  `--accent-text` (3,16 : 1 im dunklen „Standard"). Dabei das Kit neu
  holen: UI-Kit hat nach c192821 den strengen Typdurchgang,
  `data-ui-motion` und Hinweise für Dialogknöpfe schon. Die
  Prüfhaken der Läufe (`#fq`, `[data-w]`) bleiben oder werden im selben
  Bogen nachgezogen. Mit Bildern jedes Zustands, Rechner und Telefon.
  **Fertig wenn** kein Dialog mehr von Hand gebaut wird und `test296`,
  `test67`, `test155` grün sind.
- **R1c · Meldungen.** `UI.toast` (769 Aufrufe) auf den Toast des Kits,
  mit demselben Griff (`textContent` setzen verlängert), `#toast` bleibt
  die Ansage für Vorleseprogramme.
- **R1d · Blätter und Menüs.** `sheet.ts` (ein Aufrufer) und `#r-blatt`
  auf das Blatt des Kits; die Telefonmenüs auf das Aktionsblatt — über eine
  neue, getypte Schnittstelle neben `UI.menu(html, …)`, nicht durch HTML in
  React. Braucht vorher L222 Punkt 2 (ruhige Darstellung in den
  JS-Federn).

---

## Bewegung und Glas (B1 … B3) — B1 ist gelandet (E695)

Redur, 27. September 2026: „Weiter an die animationen übergangen glass
efeck usw alles verbessern." Die Inventur dazu steht in `messungen.md` §69.

- **B1 · Ein Glas statt vier — GELANDET (E695, `test576`).** Eine
  Unschärfe, zwei Dichten nach einer Regel, Glas nur unter `@supports` mit
  Präfix, auf Glas keine blasse Schrift. Offen daraus: **L221** (die
  leichten Leisten sind gerechnet, nicht gemessen).
- **B2 · Bewegung aus den Marken.** E259 verspricht „vier Stufen und EINE
  Kurve", und der Quelltext hält sich kaum daran: in `transition`-Werten
  stehen 55 verschiedene Dauern (Dauer-Marken: 5-mal benutzt) und 16
  Kurven, davon 227-mal das nackte `ease` des Browsers. Der Bogen: die
  Übergänge auf `--ease` und `--motion-*` ziehen, mit einem Bestand im
  Wächter, der nur schrumpfen darf (wie `bereiche-bestand.json`). Die
  gestalteten Endlos-Animationen (Drucker, Kartenring, Glühfaden) behalten
  ihre eigenen Zeiten — sie sind Choreografie, keine Übergänge. Mit Bild,
  weil sich das Gefühl jeder Bewegung ändert.
- **B3 · Übergänge ohne Layout.** 14 `transition`s bewegen `width`,
  `left`, `top` oder `margin` — jede davon rechnet bei jedem Bild das Layout
  neu, am Telefon sichtbar als Ruckeln. Einzeln ansehen: wo es geht, auf
  `transform`/`opacity`; wo nicht (ein Fortschrittsbalken darf `width`
  haben), mit Grund stehen lassen. Erst messen (§36), dann bauen.
- **B4 · Glas, wo es passt — GELANDET auf dem Zweig (E703, `test582`).**
  Die Docks sind Glas, ein Schalter macht alles deckend, „Starker
  Kontrast" hat keines, Toast und Lader stehen über den Werkzeugen, die
  Bilder zeigen echte Unschärfe; L221 geschlossen. Offen daraus: **L226**
  — Sands stille Schrift (Farbzweig), Redurs Wort zur Kapsel Zurück/Vor,
  und das Kit-Glas in `bridge.css`, sobald Stufe 1b es zeigt.

---

## Die drei Ansichten einer Seite (A1) — Bogen 1 ist gelandet (E690)

Redur, 26. September 2026, zuerst mit einem Bild von AFFiNEs Kopfzeile und
der Anweisung „aber zuerst lies, was die anderen 2 Bereiche bei AFFiNE
machen" — dann, nachdem der Befund vorlag: **„ich will die 2 von affine 1:1
haben auch alles komplett wie es aussehn also wirklich komplett so und noch
eine 3 für die aktuelle Redion damit wir es auch haben verstanden die 3 ist
von uns erfunden."**

**Gelandet ist damit** (E690, `test573`, 30 Zusagen): der Katalog
`Register.seitenansichten`, das Feld `seitenAnsicht` am Seitenblock (kein
Feld = die Redion-Ansicht, §9), der Umschalter auf dem vorhandenen
`Segment` als erstes Element der Seite, die Ansicht „Seite" (AFFiNEs `page`:
Symbol und Titel, kein Cover, keine Werkzeugzeile) und die Ansicht „Fläche"
(AFFiNEs `edgeless`: Punktraster, Schieben, Zoomen 10–600 %, „ins Bild
holen", der Seitentext als verschiebbarer Kasten mit eigener Kopfzeile).

**A1b — zur Hälfte gelandet (E693, `test575`, 40 Zusagen).** Redur am
26. September: „weiter." Gezeichnet wird jetzt auf der Fläche: acht
Werkzeuge, Farbmenü, Radierer, Rückgängig — die Tinte liegt IN derselben
bewegten Ebene wie die Kästen, also teilen sie einen `transform` (die
Bedingung aus L219, gemessen in `test575 §4b`). Dafür ist `GfxShapes`
(`src/core/gfx/shapes.ts`) entstanden und das Whiteboard darauf umgezogen —
EIN Formenzeichner statt zwei (§8).

**Offen daraus bleibt der Rest von L219:** Formen auf der Fläche auswählen,
verschieben, beschriften und verbinden — rund 600 Zeilen Bedienung, die
heute nur das Whiteboard hat, plus Mehrfachauswahl. Und eine Seite mit
Zeichnung taucht in der Flächen-Übersicht der Arbeitswelt nicht auf: die
listet `whiteboard` und `blatt`, nicht Seiten.

**A1c — gelandet (E691, `test574`, 50 Zusagen).** Redur am 26. September:
„ja mach den vollausbau, jeder block auf die fläche ziehbar." Jeder Block
trägt jetzt `flaecheOrt` und `sichtbarIn`; gezogen wird mit dem vorhandenen
Editor-Ziehen, am Telefon über das Blockmenü. Offen daraus: **L220** (drei
Nebenwirkungen des Ausblendens, mit E692 GESCHLOSSEN) und **L219**, dessen
Zeichen-Hälfte E693 erledigt hat.

**A1d — und eine kleinere Frage.** Der „Dokumentmodus" (E126) ist heute ein
Knopf in der Werkzeugzeile und damit eine VIERTE Ansicht, die nicht im
Umschalter steht. Soll er als vierter Knopf dazu — sichtbar nur, wenn die
Seite wirklich ein Blatt oder eine PDF enthält, wie heute?

---

## Die Werkzeugtafel (W1 … W6)

Redur, 14. September 2026, mit fünf Bildern eines fertigen Entwurfs:
**„Siehe Bildern, so will ich es haben."** Und einen Satz später:
**„Die untere Dock sollte bleiben."**

Was auf den Bildern steht, in Redurs eigener Beschriftung:

```txt
1  Standardansicht          die Leiste schwebt oben, unten die Dock
2  Stift gewählt            eine TAFEL unter dem Werkzeug: Strichvorschau,
                            fünf benannte Stiftkacheln, Strichstärke- und
                            Deckkraft-Schieber, darunter die Farbreihe
3  Marker gewählt           dieselbe Tafel, andere Werte (4,0 mm, 60 %)
4  Radierer gewählt         fünf benannte Kacheln (Ganz · Teil · Nur Stift ·
                            Nur Marker · Nur Inhalte), Grösse-Schieber,
                            Haken „Automatisch an Strich anpassen"
5  Formwerkzeuge            benannte Kacheln statt nackter Zeichen
6  Textwerkzeug             Schriftwahl, B I U, Ausrichtung, Farben
7  Dock-Effekt              die Zeichen wachsen beim Überfahren
8  Farb-Dock                dasselbe für die Farben, mit Namensfähnchen
9  Lasso                    Kopieren · Ausschneiden · Löschen · Farbe · Mehr
10 Ergebnis                 natürliches Schreiben
```

Und auf den vier iPad-Bildern dazu: **jedes Werkzeug trägt sein Wort unter
dem Zeichen** (Stift · Marker · Radierer · Auswählen · Formen · Text ·
Bild │ Rückgängig · Wiederholen), die Stiftkacheln zeigen **eine
Strichprobe, einen Namen und eine Millimeterzahl** (Fein 0,3 mm · Mittel
0,7 mm · Markant 1,2 mm · Marker), und die Formen stehen als benannte
Kacheln (Linie · Pfeil · Rechteck · Kreis · Stern).

### Die drei Grenzen, die dabei gelten

1. **Nichts wird gelöscht.** Alles, was heute in der Leiste steht, muss
   danach noch erreichbar sein — auch das, wofür auf Redurs Bildern kein
   Platz war (Lineal, Kritzeln, Elemente, Laser, Verweis, Sperren, Als
   Element, der Platz der Leiste, die Adernreihe des Leiterstiftes).
2. **Die untere Dock bleibt** — Redurs ausdrücklicher Satz. Im Studio ist
   das der schwebende Streifen am unteren Rand (`position:fixed`), und die
   Tafel geht ÜBER ihm auf, nicht an seiner Stelle.
3. **Ein Katalog, nicht zwei** (§8). Die Tafel zeigt DIESELBEN
   `[data-gruppe]`-Elemente, die heute in der Leiste stehen — sie werden
   umgehängt, nicht abgeschrieben. Eine zweite Liste von Stiften, Farben
   und Breiten liefe von der ersten weg, und zwar genau dann, wenn jemand
   eine Farbe hinzufügt.

### Die Bögen, in der Reihenfolge

- **W0 · Die Leiste selbst ordnen** — ERLEDIGT (E570). Kam als eigene Bitte
  dazwischen („Könntest du so machen, dass ich alles, was dort ist im Redion,
  direkt selber ordnen kann?") und gehört trotzdem hierher: die Tafel wird
  dieselben zwei Listen zeigen. Zwei Reihenfolgen in `meta`, ein Feld zum
  Ziehen und Rücken, „Zurücksetzen". Gespeichert wird eine Reihenfolge, kein
  Katalog — Unbekanntes fällt beim Lesen weg, Fehlendes kommt hinten dazu.
  **Offen geblieben ist das Ausblenden**: Redur hat „ordnen" gesagt, nicht
  „weglassen". Wenn er es will, braucht es einen Weg zurück (ein „Mehr"-Feld)
  und keine Lücke — und dann vorher seine ausdrückliche Zusage, weil dabei
  eine Funktion aus dem Bild verschwindet.
- **W0b · Im Band selbst schieben** — ERLEDIGT (E571). Redurs Nachsatz zu
  W0: „direkt im Website ordnen … die Position mit der Maus schieben."
  «Einrichten» schaltet jetzt einen Modus im Band; die Liste aus W0 steht
  darin als „Als Liste" und bleibt der Weg für die Tastatur und für das
  Zubehör, das gerade nicht zu sehen ist.
  **Offen daran:** der Modus ordnet die ZEICHENLEISTE. Ob Redur auch den
  Rest der Oberfläche schieben können will — Seitenleiste, Spalten,
  Kopfzeile —, ist nicht gesagt; das wäre ein eigener Bogen und ein sehr
  viel grösserer.
- **W1 · Die Zustands-Grammatik** — ERLEDIGT (E568). Eine laute Fläche statt
  sechs, runde Farbtupfer, sichtbare Gruppen, Rangfolge zwischen Werkzeug
  und Zubehör. Das ist die Grundlage: die Tafel erbt sie unverändert.
- **W2 · Die Tafel als Behälter** — ERLEDIGT (E614, `test533`). Gezählt
  waren es **51 Kindwähler** über 104 Selektorzeilen (nicht „rund fünfzig"
  geschätzt) und **sieben `:scope >`** im TypeScript. Zwei Dinge hat der
  Auftrag nicht vorhergesehen: die Tafel nimmt **alle** Kinder auf und nicht
  nur die Gruppen (drei Mechanismen wirken nur zwischen Geschwistern), und
  sie trägt `display:contents` — ein echter Kasten hätte `flex:1 0 100%`,
  `order` und `position:sticky` gebrochen. Einen eigenen Kasten bekommt sie
  mit W4. Gemessen: 127 → 128 px, sonst nichts.
- **W3 · Wort unter dem Zeichen** — ERLEDIGT (E614). Die Schwelle ist
  gewandert: Zubehör lässt sein Wort weiter bei 1150 px, die Werkzeuge erst
  bei 820 — gemessen brauchen dreizehn gestapelte rund 790 px statt 1142
  daneben. Bei 1360 px Fenster stehen sie jetzt mit Wort in EINER Zeile,
  vorher ohne Wort in zwei.

  **Offen daran, beim Hinsehen gefunden:** im Schreibstudio trägt die OBERE
  Reihe (`.document-drawingbar`) weiterhin nur Zeichen. Sie ist ein eigenes
  Element und hatte nie Wörter — W3 galt der Leiste, nicht der Kopie. Auf
  Redurs iPad-Bildern steht das Wort auch dort. Das ist ein eigener,
  kleiner Bogen und keine Nebenwirkung: die Kopie wird aus
  `Marken.WERKZEUGE` gebaut (E583), also käme das Wort von derselben Stelle.
- **W4 · Die Tafel bekommt Inhalt.** ZUM TEIL (E616): **die Millimeter
  stehen** — und sie sind Redions, nicht GoodNotes'. Gemessen rechnet die
  Zeichenfläche in PDF-Punkten (`viewBox` = A4), also sind die drei Stufen
  0,4 / 0,8 / 1,8 mm und nicht 0,3 / 0,7 / 1,2 wie auf Redurs Bild;
  abgeschrieben wären sie bei „Markant" um die Hälfte daneben gewesen. Der
  Marker zieht das Vierfache, und die Beschriftung hängt deshalb am
  Werkzeug. Redurs Wörter (Fein · Mittel · Markant) sind übernommen.

  **Und seit E617 tragen die Stiftkacheln ihren Namen** — Füller ·
  Kugelschreiber · Pinsel · Bleistift · Schutzleiter · Leiter, ab 1300 px
  Leistenbreite. Die alte Begründung („sechs Stifte mit Namen sind rund
  320 px") galt für ein Wort NEBEN dem Zeichen; gestapelt kostet es Höhe.
  Die Leiste ist bei jeder geprüften Breite so hoch wie vorher, und
  `display:none` ist dem Klemmen gewichen (§38).

  **Und seit E618 IST die Tafel ein Kasten** — ab 1300 px Leistenbreite,
  mit eigenem Grund und eigener Zeile, genau wie auf den Bildern 2 bis 6.
  Dafür sind die Werkzeuge aus ihr zurück in die Leiste gezogen (ein Kasten
  um die Werkzeugreihe herum wäre keine Tafel, sondern die ganze Leiste);
  die 51 Gruppenwähler blieben dabei unberührt. Unter der Schwelle bleibt
  `display:contents`, weil am Telefon `order` über Werkzeuge UND Zubehör
  hinweg gilt. Die Millimeter aus E616 stehen jetzt auf der Kachel:
  **0,4 mm · 0,8 mm · 1,8 mm**, beim Marker das Vierfache.

  **Und seit E623/E624 ist W4 bis auf einen Punkt fertig.** Die
  **Strichprobe** trug `currentColor` — die Textfarbe des Knopfes, nicht die
  Tinte — und gar keine Deckung; jetzt beides, und zwar aus derselben
  Funktion, die auch den echten Strich und das PDF färbt (sie stand vorher
  viermal). **Name und Millimeter** stehen auf EINER Kachel, untereinander:
  nebeneinander wuchs die Leiste von 128 auf 143 px und riss ihre Decke. Und
  der **Radierer** hat seine drei Grössen jetzt auch ohne Studio — dort
  standen sie seit E576 und nur dort — samt dem Haken «Automatisch an den
  Strich anpassen».

  **Offen bleibt allein der Deckkraft-Schieber.**

  **Und die Deckkraft ist zusätzlich eine Datenfrage:** sie steht heute fest
  je Stift (Marker 0,32 · Pinsel 0,92 · Bleistift 0,72 minus Neigung). Sie
  wählbar zu machen heisst, ein Feld an die Marke zu hängen — §9, also eine
  eigene Entscheidung und kein Nebensatz.
- **W5 · Der Dock-Effekt.** Vergrössern beim Überfahren, mit
  `prefers-reduced-motion` als Abschaltung (§38).

  **NACHGEMESSEN am 19. September 2026: er ist zum grössten Teil gebaut.**
  `pdf-studio.css:666–716`, unter `@media (hover:hover) and (pointer:fine)`:
  der überfahrene Knopf auf `scale(1.3)`, beide Nachbarn auf `scale(1.13)`
  (Redurs Dock-Welle — `:has(+ button:hover)` liest nach links, der
  Nachbarwähler nach rechts), die Federung `@keyframes dock-feder`, und die
  Abschaltung unter `prefers-reduced-motion` bei `:703–716`.

  **ERLEDIGT am 19. September 2026 mit E625.** Die zwei
  `.blatt-werk`-Familien sind nach `bausteine.css` gewandert und haben den
  Studio-Vorsatz verloren — damit gilt die Welle auf beiden Oberflächen; aus
  drei Wählerfamilien wurden zwei, nicht vier. Das **Farb-Dock** ist dazu
  gebaut: die Tupfer tragen kein `svg`, also wächst der Knopf selbst.

  **Offen bleibt davon allein das Namensfähnchen** (Redurs Bild 8), und der
  Grund steht als **L190**: am Tupfer sind beide Pseudoelemente vergeben —
  `::before` ist die Kante gegen den verschwindenden schwarzen Tupfer
  (E568), `::after` die 44-px-Trefffläche (§37). Der Name selbst ist da, in
  `title` und `aria-label`.

Was **nicht** dazugehört und trotzdem auffällt: dass Redurs Entwurf die
Leiste OBEN zeigt und Redion sie im Studio unten hat. Beides ist richtig —
der Platz ist seit E512 wählbar (der Knopf „Platz"), und Redur hat gerade
gesagt, dass unten bleiben soll.

---

### Wo die Leiste steht — ERLEDIGT am 19. September (E619/E620/E621)

Redur hat am 19. September ein Papier hochgeladen, das die Leiste nach dem
GoodNotes-Modell neu bauen wollte. Nachgemessen war das meiste gebaut; was
fehlte, steht jetzt auch:

- **Am Griff ziehen** statt nur tippen, gefangen am nächsten Rand (64 px).
- **«frei»** als fünfter Platz im selben Katalog, der Punkt als Prozent
  gemerkt.
- **`role="toolbar"`** mit Pfeiltasten und einem Tabstopp (§38).

Und zwei Fehler, die dabei herausfielen und behoben sind: «unten in der
Mitte» war auf der gewöhnlichen Seite **zwei Pixel breit** (L186), und im
Studio stand der Platz-Knopf da, ohne wirken zu können (L185).

**Offen daraus:** L187 — «unten» steht am Fuss des BLATTES, nicht des
Fensters. Drei Wege stehen dort, und die Wahl ist Redurs.

---

- **W6 · Die eine Werkzeugleiste — 5a und 5b sind gelandet (E689, E694).**
  Gebaut: `Register.werkzeuge` (22 Werkzeuge) und `GfxToolbar`
  (`src/core/gfx/toolbar.ts`); das Whiteboard zieht darauf um, mit
  schwebender Kapsel unter der Fläche, Strichzeichen, Untermenüs und 44 px
  am Telefon. Und seit E694 lesen auch Studio und Menüband daraus — es gibt
  EINE Liste, nicht drei (`test572`, 59 Zusagen). **Offen bleiben drei
  Bögen:**

  - **5b · Ein Katalog statt drei — GELANDET (E694, L218 GESCHLOSSEN).**
    `marken.ts` hält nur noch die Reihenfolge und ruft
    `Register.werkzeuge.auswahl([…])`; `menueband.ts` hält eine Folge mit
    Herkunft und holt Name, Zeichen und Hinweis aus dem zuständigen
    Katalog. Dabei kam heraus, dass es die Kennung `ellipse` ZWEIMAL gibt
    (Flächenwerkzeug `◯`, Studio-Form `○`) — deshalb steht die Herkunft in
    jeder Zeile, statt geraten zu werden (P117).
  - **5c · Die Gedankenkarte** auf `GfxToolbar` — sie ist eine
    Aktionsleiste ohne aktives Werkzeug, also mit `werkzeuge: []` und ihren
    fünf Aktionen; `test529 §12` misst dann echte 44-px-Boxen.
  - **5d · Die Planfläche** — `zeigen/leitung/text/radieren` werden
    Register-Einträge; `.sp-wz` und `.sp-start` bleiben als Wähler, die
    Palette bleibt, wo sie ist.
  - **5e · Kürzel, Ziehen, dichter Modus** — Tasten aus dem Katalog über
    `Register.tasten` (und davor die eine Zeile in `marken.ts:7248`, die
    `defaultPrevented` nicht prüft), Werkzeug auf die Fläche ziehen,
    Blättern mit ‹ ›, und das echte Schweben über der Fläche, sobald
    `insBild()` den Sockel abzieht.

  Der ursprüngliche Auftrag, zum Nachlesen — Redur,
  25. September 2026, mit einem Bild von AFFiNEs Edgeless-Werkzeugleiste:
  „ich will so was haben wie die affine schau mal es nach".

  **Nachgesehen** (`blocksuite/affine/widgets/edgeless-toolbar/`, MIT, nur
  gelesen — E681): zwei Gruppen in EINER schwebenden Leiste unten. Links
  die **Quick Tools** (36 px, Abstand 10: Auswahl, Rahmen, Verbinder,
  Link), rechts die **Senior Tools** (je 96 px breit, blätterbar mit
  ‹ ›: Notiz-/Text-Karten, Stift, Radierer, Formen), die man **auf die
  Fläche zieht** (`draggable/`); ein **Slide-Menü** je Werkzeug (Formen,
  Farbe); **Kürzel-Hinweise** (`^`) im Icon; ein **dichter Modus**
  (`data-dense-quick/senior`), wenn das Fenster schmal ist; 64 px
  Sicherheitsabstand zum Rand.

  **Was Redion daraus baut** — den Aufbau, nicht die Bilder und nicht den
  Code (§2, E681 Punkt 2):
  1. Die Werkzeuge des Whiteboards werden **Register-Einträge**
     (`register/`-Katalog, §5 Regel 3: Kennung, Name, Kürzel, Gruppe
     quick/senior, Zeichnung als SVG im Redion-Stil wie die Fachzeichen) —
     damit Gedankenkarte und Planfläche dieselbe Leiste bekommen können.
  2. Eine schwebende Leiste **unten im Kasten**, zwei Gruppen, die rechte
     blätterbar; Untermenü klappt nach oben; Werkzeug auf die Fläche
     ziehen legt die Form dort ab.
  3. Kürzel über `Register.tasten` (V, H, P, E, S …), der Hinweis steht im
     Icon; Strg+Z bleibt beim Kasten (E682).
  4. Am Telefon: 44 px (§37), dichter Modus statt Überlauf, Abstand zur
     unteren Redion-Leiste (E646, `test541`).

  **Redur, 25. September, dazu: „integriere alles zusammen".** Also nicht
  eine Leiste fürs Whiteboard, sondern EINE für alle Flächen — Whiteboard,
  Gedankenkarte, Planfläche, Blatt/PDF — aus demselben Register, mit
  demselben Verlauf (Bogen 4) und demselben Raum (Bogen 3). Die
  Markenleiste des Studios (E512, E625, E674) ist dabei der Bestand, der
  am meisten kann; sie wird nicht ersetzt, sondern die anderen holen zu
  ihr auf, und was sie gemeinsam haben, wandert nach `src/core/gfx/`.

  **Reihenfolge:** nach den drei Datenbögen aus E681 (Kennungen im
  Verlauf, `raumVersion`, gemeinsamer Verlauf) als Bogen 5. Mit Bildern am
  Rechner und am Telefon (§55.3), und mit einem Wächter, der die Leiste
  misst, nicht liest (L206).

## ~~Rot, und älter als der Zweig — `test402`~~ — ERLEDIGT am 19. September (E627)

Beide Treffer sind geklärt, und nur einer war ein Fehler an einer Fläche:
`.gk-leiste button` hatte seine 44 px längst über `::after` — der Beleg
stand nur HINTER der Regel, ausserhalb der acht Zeilen, die `test402` liest.
`#ai .ki-quellschalter` ist ein echter Nebenweg und hat jetzt seinen
geschriebenen Grund. `test402` ist 4/4.

## Die Kurven der Kennzahlkarten aus echten Werten (L224, nach E701)

E701 hat sie in Ruhe grau gemacht, damit sie nichts behaupten — gelöscht
und erfunden wurde nichts. Offen ist Redurs Wahl: echte Tageswerte
(`reviewVerlauf`, die sieben Tage aus „Letzte 7 Tage") oder dort, wo es
keine gibt, keine Kurve. Zuerst ein Prüflauf, der die Kurve gegen die Zahl
darüber hält (§30).

## Das Blockmenü mit gezeichneten Zeichen (nach E701)

E701 hat die Emoji in Einstellungen, ⋯-Menü der Seite, „Mehr", R-Blatt,
Seitenwerkzeugen und Termine durch Striche aus `Register.symbole` ersetzt
(Redur: „Gezeichnete Zeichen"). Das Menü am Griff eines Blocks
(`editor.ts`, „Umwandeln in", „Farbe", … „Löschen", rund zwanzig Zeilen)
trägt noch 🎨 🔠 ✍ ✨ 💬 🎴 🗑 und getippte Pfeile. Dieselbe Arbeit: jede
Zeile am selben Ort mit demselben Wort, ein Zeichen je Zeile, Löschen rot;
zuerst `test580` §3 um das Blockmenü erweitern und rot sehen.

## Flüssige Bewegung, der Rest nach E702 (L225)

Redur, 27. September, ca. 22:10: „bessere übergagnge besssere efeckten".
E702 hat die Federn in die Schale gebracht; offen, je mit Wächter (rot
zuerst) und Bildstreifen vor und nach:

  1. Abgang und leichtes Nachschwingen für Rechner-Menüs und Dialoge — mit
     den Inselstufen (E699 Punkt 10), nicht an den alten Klassen.
  2. Blöcke ziehen ohne 2-px-Sprung, das Verschobene gleitet an seinen Ort
     („bewegung-ziehen", `editor.ts:2038-2105`).
  3. Fortschrittsbalken und Knebel über `transform` statt `width`/`left`
     („bewegung-layoutfrei").
  4. Die rohen Dauern und blossen `ease` auf die Marken, ausser motion.css
     („bewegung-marken").
  5. Das Einzeichnen der Lernwelt erst nach dem Aufbau
     („bewegung-einzeichnen").
  6. `sheet.ts` über `transform` statt `height`.

## Der Stift nach E704 (S1 … S3) — Messung am Gerät zuerst (L227)

- **S1 — „Stift messen" am iPad (stift-11).** Ein Schalter unter
  Einstellungen, der zehn Sekunden lang Bilder, Meldungen und Vorhersagen
  zählt und die Zahlen zum Kopieren zeigt — lokal, ohne Netz, im Aus
  kostenlos (ein Wahrheitswert). Redur tippt ihn einmal am iPad und am
  iPhone; die Zahlen gehen in messungen.md. Erst danach entscheidet sich die
  Canvas-Ebene (L209 Punkt 5) und ein engerer Deckel (L227 Punkt 6).
- **S2 — Billig absetzen (stift-10).** `finish` auf einer vollen Seite unter
  8 ms bei 250 Punkten: Punkte einmal rechnen, Kritzel-Vorprüfung, die
  Speicherung ein Bild später mit Nachweis über `pagehide` (§51). Wächter
  zuerst: `test449`/`test510` (Kritzeln) müssen grün bleiben.
- **S3 — Der Füller auf der Tafel.** `druckFaktor`/`halbeBreiten`/`STIFTE`
  in den Kern ziehen (§5 Regel 1), dann Druck und Spitze auch auf Whiteboard
  und Seitenfläche (L227 Punkt 4).

## Farben: was nach E705 offen ist (28. September 2026)

- **`chartTyp: 'pie'` ist kein Diagrammtyp.** Ein Block mit `pie` zeichnet
  eine leere Achse statt eines Kreises (gesehen beim Bau von E705, Bild
  `06-diagramm-pie-hell.png` im Kartenordner). Entweder `pie` als Ring
  lesen oder beim Einlesen auf `donut` abbilden — mit Wächter.
- **Die Schrift auf den Astfarben der Gedankenkarte rechnen** (L228), wie
  `--auf-accent`.
- **Die Stift- und Markerfarben** (Karte „farben-4") gehören dem Zweig
  `claude/stift-effekte`, die Lesbarkeit der unteren Leiste unter der Linse
  (farben-2) dem Zweig `claude/material-ueberall`, das Glas von „Starker
  Kontrast" dem Zweig `claude/glas-wo-es-passt`.

## Das Material zum Ziehen auch am Zubehör und in den Einstellungen (L229, nach E706)

E706 hat das Material des Touch Kits an die untere Leiste, den
Werkzeugflug und sechs Umschalter gebracht. Offen, jeweils mit eigenem
Wächter (rot zuerst):

1. Schieben über Stifte, Farben und Breiten der Stiftleiste
   (`SelectionFlow.ziehbar` mit `baue`) — ohne dem Rollen der Reihe oder
   einem Strich auf dem Blatt in die Quere zu kommen.
2. Einstellungen mit zwei oder drei Möglichkeiten als `Segment` statt
   `<select>` — zusammen mit den Läufen, die die Einstellungen setzen.
3. `SelectionFlow.FEDERN` aus den Federmarken in `grund.css` lesen, sobald
   es sie gibt (Zweig `claude/fluessige-bewegung`: `--feder-knapp`,
   `--feder-druck`).

## E713 · Die „läuft"-Pille für alle, die etwas laufen lassen (L234)

E713 hat die Pille für den Zeitmesser gebaut (Szene 02 aus Redurs Video).
Offen, mit eigenem Wächter (rot zuerst):

1. Eine gemeinsame „läuft"-Pille in `schale/` (Editor und Wissen dürfen sich
   nicht rufen, §5), und der Ton der Zeitmarken (`audioRefSpielen`) als ihr
   zweiter Nutzer: Anhalten, Springen, Aufgehen zur Karte.
2. Die laufende Besprechung und die Aufträge in derselben Pille.
3. ~~Am Telefon: ein Toast rückt über die Pille~~ **ERLEDIGT** in der
   Durchsicht von E713 (`test590` §10).
4. Wischen über die Balken des Lernverlaufs.

## Der Tropfen: was nach E712 offen ist (L233, 28. September 2026)

1. Die Glaskacheln beim Rollen zäh zur Leiste verschmelzen lassen (mit
   `Linse.TROPFEN`, eigener Lauf: kein Bild fällt beim Rollen).
2. Das Zurückfliessen am Telefon auch nach dem Wegwischen des Blatts.
3. Beim Zusammenführen mit einem anderen Goo (Löschen-Knopf): EIN Filter.
4. Den Start nach der zweiten Welle nachzählen (`test388` §5); E712 liegt
   mit +14,3 KB (mit Durchsicht +15,5, mit Nachtrag +16,1, mit der dritten
   Durchsicht +16,3) über den zugeteilten rund 10; auf dem Zweig allein
   2841 KB von 2850.
5. Unter „Hoher Kontrast“ und im Schema „Starker Kontrast“ verdeckt die
   Pille der unteren Leiste am Telefon den Namen des gewählten Reiters
   (gefunden in der Durchsicht von E712, schon auf `b3cf1933` — die Leiste
   der ersten Welle). Mit Bild prüfen und beheben, ohne die Pille zu
   verlieren.
6. Ein `UI.menu` am Rechner bekommt keinen Fokus: wer das „+“ mit der
   Tastatur öffnet (Enter), bleibt am Knopf, Tab geht an der Scheibe
   vorbei (gefunden in der dritten Durchsicht von E712, schon auf
   `b3cf1933` — älter als E712). Den Fokus in die Scheibe holen und
   zurückgeben, mit Pfeiltasten, ohne die Menüs mit Suche zu stören; mit
   Wächter (rot zuerst).

## Suche und Meldungen: was aus den Szenen 07 und 08 noch fehlt (L232, nach E711)

E711 hat die Suche aus der Kapsel wachsen lassen, die gleitende Marke in
Suche, Befehlspalette und Menü mit Suche gebracht, `#toast` zum Stapel
gemacht, der Glocke den Fächer gegeben und den Posteingang als Glaskarten.
Offen, jeweils mit eigenem Wächter (rot zuerst):

1. Escape in der Suche leert erst das Feld, dann schliesst es — zusammen mit
   den Läufen, die heute auf „Escape schliesst" bauen.
2. Suche und Palette als Combobox für den Vorleser (`aria-activedescendant`).
3. Enter als Übergabe: die Scheibe hebt sich und wird zum Ergebnis.
4. Kick und Tropfen beim Zusammenfliessen — nur, wenn Redur es will.
5. Beim Zusammenführen der zweiten Welle: EIN Goo-Filter (`#ru-goo`) für
   Löschen-Knopf (E709), Tropfen (E712) und Glocke (E711).
6. Meldungen als Glas nur, wenn Redur E703 (c) dafür aufhebt (L232 Punkt 7).
7. Die Trefferzeilen der Suche am Telefon auf 44 px (heute 39 px, schon vor
   E711; §37, L232 Punkt 9) — mit einem Lauf, der die Höhe am Telefon misst.
8. `test588` wartet an einigen Stellen feste Zeiten auf Bewegung (§3 das
   Umlenken der Marke, §7 der Fächer nach dem Zeiger, §8 nach dem
   Zusammenfliessen); am 5. Oktober um ca. 19:29 UTC unter Last einmal rot
   in genau diesen drei Punkten, davor und danach grün. Auf das Ende der
   Bewegung warten (`getAnimations().finished`, wie jetzt `test114` §16)
   statt auf die Uhr — ohne die Punkte zu lockern.

## Gefunden beim Durchsehen von E711, gehört zu den Farben (E705)

Im Schema „Starker Kontrast" steht am Telefon auf dem aktiven Reiter der
unteren Leiste weder Zeichen noch Wort — Schwarz auf der schwarzen Pille.
Gesehen in den Vorher-Bildern von E711 (`b3cf1933`), also nicht von E711.
Mit eigenem Wächter (rot zuerst), im Bogen der Farben.


## E710 · Die Fragen im Fenster des Touch Kits — was danach kommt

E710 hat `Dialog.frage`, `Dialog.wahl` und `Dialog.mehrzeilig` in den
Dialog des Kits gebracht und das Tor für Inseln gebaut (eine oberste Ebene
für Fokus, Escape und `inert`). Offen, jeweils mit eigenem Wächter (rot
zuerst):

1. Die übrigen 45 `confirm()`/`prompt()`/`alert()` je Datei auf
   `Dialog.bestaetigen`, `Dialog.melden` und `Dialog.frage` umziehen, mit
   ihren Prüfläufen im selben Bogen (L231); `test587` §10 senken. Zuerst das
   Passwort des Verschlüsselns (`wissen/werkzeuge.ts`, test265 §7).
2. Die übrigen Fragen ohne `Dialog.*` (eigene `.overlay`-Kästen mit
   `.fbtns`) auf dieselbe Insel — Stelle für Stelle, am selben Auslöser.
3. Menüs und Blätter als Inseln (nächste Welle): dasselbe Tor —
   Träger `.overlay`/`.menu` mit `data-insel-traeger`, das Kit zeichnet darin.
4. Wenn Redur es sagt: das bisherige Fenster (`frageAlt`, `wahlAlt`,
   `mehrzeiligAlt`) aus `dialog.ts` nehmen (§43 — bis dahin ist es der
   Rückweg, wenn die Inseln nicht laden).
5. Am iPhone nachsehen (Nachtrag 3. und 4. Oktober): In den Bildern aus
   Chromium trägt die erste Antwort den Fokusrahmen, wenn die Frage ohne
   vorherigen Fokus kommt (das Kit setzt den Fokus dorthin). Nach einem
   echten Tipp sollte er nicht zu sehen sein — prüfen, sonst im Kit (L222).
   Und wo der Rahmen zu sehen ist, schneidet das runde Eck des Fensters ihn
   ab (unten links an „Abbrechen", 1440×900): der Rahmen sollte der Rundung
   folgen — ebenfalls im Kit (L222), nicht in `fremd/touch` von Hand.
6. Gesehen bei der Durchsicht (5. Oktober), nicht geändert: eine Meldung
   (`#toast`, Ebene 900), die erscheint, während eine Frage offen ist,
   liegt jetzt UNTER dem Schleier des Trägers (1100) — vorher lag das
   Fenster auf 700, die Meldung darüber. Fokus legt sie ohnehin still.
   Wenn eine Meldung während einer Frage zählt (Fortschritt im
   Hintergrund): die Meldung über den Träger heben, mit einem Lauf, der sie
   während einer offenen Frage misst.
7. Im Kit (L222, upstream in UI-Kit, nicht in `fremd/touch` von Hand),
   gesehen bei der Durchsicht (5. Oktober): `useModal` ist nicht sicher
   gegen einen Fehler MITTEN in seinem Effekt. Wirft dort etwas nach dem
   Eintrag in den Stapel (in der Probe: `focus()`), bleibt der Eintrag samt
   Tab-Falle und `inert` für immer stehen — die nächste Tab-Taste fängt
   sich an einem Fenster, das es nicht mehr gibt. Redion fängt den
   Zeichenfehler selbst (E710 Durchsicht Punkt 3: das bisherige Fenster
   fragt); das Kit sollte seinen Effekt in `try`/`finally` aufräumen.
8. Im Kit (L222), gesehen bei der finalen Durchsicht (5. Oktober), nicht
   geändert: Seit der Durchsicht kein doppeltes „Abbrechen" mehr — eine
   Wahl mit zwei Antworten steht darum jetzt so, wie das Kit zwei Knöpfe
   setzt: nebeneinander. Mit einem Hinweis unter jedem Knopf bricht am
   Telefon (390 px) die Beschriftung um („In 3 Seiten / zerlegen", 92 px
   hoch; am Rechner 70 px). Lesbar und ≥ 44 px, aber eng. iOS stellt zwei
   Knöpfe untereinander, sobald einer nicht auf eine Zeile passt — das
   gehört als Regel ins Kit (`Dialog`: nebeneinander nur, wenn beide auf
   eine Zeile passen), mit einem Lauf, der die Höhe am Telefon misst.

## Der Löschen-Knopf nach E709 (L230)

E709 hat alle runden Löschen-Knöpfe auf `RedionDelete` gestellt. Offen,
jeweils mit eigenem Wächter (rot zuerst):

1. Die Papierkorbzeile umbauen: eine Zeile aus einem Knopf (zurückholen und
   öffnen) und daneben drei ECHTE Knöpfe (↩ ↳ „Endgültig löschen") — dann
   erreicht die Tastatur auch das Endgültig-Löschen (`test33`, `test59`).
2. Redur fragen (mit einem Bild), ob die Wortknöpfe „Löschen" in den
   Werkzeugleisten (Auswahl im PDF, Seitenblatt des Dokuments) auch
   zerfliessen sollen — sie legen weg, was Strg Z zurückholt.
3. In dieselbe Frage (Durchsicht 3. Oktober, L230 Punkt 4): der 🗑 der
   Gedankenkarten-Leiste („Ast löschen", aus einer Tabelle gebaut) und das ✕
   der Auswahlleiste der Planfläche — beides Leistenknöpfe über einer Auswahl,
   die `test586` §2 nicht sieht. Nach Redurs Wahl liest §2 auch aus Tabellen
   gebaute Knöpfe (rot zuerst).
4. In dieselbe Frage (zweite Durchsicht 5. Oktober, L230 Punkt 5): das ✕
   der Kennzahl-Karte, das ✕ einer Freigabe in der Wolke, die eigenen Emoji
   (das Bild löscht beim ersten Klick, ohne Frage) und das ✕ der Sortierung.
   (Der frühere Punkt 4 — die rote Pille unter dem ruhenden Zeiger — ist am
   5. Oktober erledigt, siehe ERLEDIGTE-AUFGABEN.)

## Zwei Fragen an die Ecke aus E676 (L235, nach E708)

1. **`test201` §1 entscheiden** — die Probe ist ein rechter Winkel und seit
   E676 eine Ecke. Vorschlag in L235 Punkt 1 (Bogen statt Winkel, dazu „ein
   rechter Winkel bleibt eine Ecke"). Braucht Redurs Wort, weil es einen
   Wächter ändert (§31, §47). Bis dahin ist `test201` rot mit 31 von 32.
2. **Die Tinte einer haltenden, zitternden Hand** (L235 Punkt 2): ab ±2
   Zittern springt der Glätter auf rohe Punkte, am Ende eines gehaltenen
   Strichs ohne Form bleibt ein Knäuel. Mit Wächter (`test366` §3 auch bei
   ±2), rot zuerst, `test564` als Nachbar.

## Der Startweg nach E715 (3. Oktober)

E715 hat die Kommentare aus dem erzeugten JavaScript genommen (2826 →
1805 KB). Offen, je mit Messung vorher:

1. ~~**Beim Zusammenführen der zweiten Welle** bekommen die neuen Quellen
   `src/schale/bedienung/delete.ts`, `kacheln.ts` und `tropfen.ts` die
   erste Zeile `/*! ERZEUGT — NICHT VON HAND ÄNDERN. …` mit ihrem eigenen
   Pfad.~~ Erledigt am 5. Oktober auf `claude/morgen-besser-2`
   (Zusammenführen 4/8 und 7/8; `test105` grün).
2. **Die Kommentare der Stilblätter** sind 261 von 417 KB CSS beim Start.
   CSS ist Quelle; sie gingen nur mit einem Bauschritt für CSS weg (§6) —
   Frage an Redur, nicht still.
3. **L216** (Lerninhalt beim Start, ohne Kommentare noch 18 KB) bleibt
   Redurs Frage.

## Nach dem Zusammenführen der dritten Welle (11. Oktober 2026)

Gefunden auf `claude/morgen-besser-3`, nicht dort gelöst — je mit dem
Grund:

1. **Fremde rote Wächter**, auf `claude/morgen-besser-2` Zeile für Zeile
   gleich rot (am 11. Oktober nachgefahren): `test201` §1, `test270`,
   `test274` (`redion-graphit` in marken.ts), `test332`, `test348`,
   `test351`, `test365`, `test425`, `test448`, `test470`, `test493`,
   `test524`, `test533` — die Gründe stehen unten bei der zweiten Welle,
   ausser für zwei, die dort fehlten: `test351` („Und es sind wirklich
   dreizehn — ist 14, soll 13", dieselbe Ursache wie `test365`: seit E671
   vierzehn Werkzeuge, die Wortzeile bei 1360 und 1600 px rechnet mit
   dreizehn) und `test533` („Sie stehen alle auf EINER Höhe — ist 2, soll
   1" und „kein Wort ist sichtbar — ist 1, soll 0", die Tafel aus E614).
   ~~Dazu `test319` („Und `info` ist nicht die blasseste der drei — info
   12.09, warn 12.15, fehler 12.41"; auf morgen-besser-2 Ziffer für Ziffer
   gleich — alle drei Streifen liegen weit über 4,5 : 1, `info` nur um
   0,06 darunter; ob der Punkt bei so hohen Werten noch etwas sagt, ist
   eine Frage an Redur, kein Nachzug).~~ **Erledigt am 11. Oktober 2026
   durch E742** auf `claude/info-streifen-kontrast`: Redur hat „Ja"
   gesagt, der Punkt bleibt streng; `--b-blue` steht im Dunkeln eine Stufe
   dunkler (`#123043`), info 12.26 gegen warn 12.15 und fehler 12.41,
   `test319` 26/26. `test86` ist seither grün
   (e485d3c), `test98` auch (seit E710 suchte er `confirm(`, jetzt
   `Dialog.bestaetigen` vor jedem Löschen). `test436` war im
   Vereinigungslauf einmal rot (`null.click` in §2), danach zweimal 71/71
   — beobachten.
2. **Die Vorgabe der Suche in einem Dokument** (E725, Vorgabe g): ohne
   gemerkte Wahl beginnt Strg P dort mit „Dieses Dokument"; die Suche über
   alle Dokumente ist einen Schritt entfernt („Alle Dokumente",
   „Überall"). Redurs Frage, ob das so bleiben soll (P128).
3. **Zwei alte Zweige mit Arbeit, die nirgends steht**:
   `claude/redion-elektro-simulation` und `feat/dark-2017-fach-dossier`.
   Hineinnehmen oder liegen lassen — Redurs Wort.
4. **Am Telefon, im Gesamtbild gesehen** (beides schon auf
   morgen-besser-2 so): die Formen in den Whiteboards der Fläche stehen
   stark vergrössert und angeschnitten; in der gerollten Lernzentrale liegt
   der Zurück-Pfeil über dem Text „SM-2 bleibt …". Je ein Bild und ein
   Wächter, bevor gebaut wird.
5. **Die Arbeitsbäume im Scratch** (`/home/user/wt/…`, über dreissig aus
   den Durchsichten) sind nur lokal — aufräumen nur mit Redurs Ja (§43).
6. **Ein „zerstörter Kontext", der keiner ist** (gemessen am 11. Oktober,
   P131): Playwright meldet „Execution context was destroyed", obwohl die
   Seite nicht neu lädt — der Browser sagt ihm „Promise was collected", wenn
   `Store.flush()` und das lange `App.oeffne` im SELBEN abgewarteten
   `evaluate` stehen. Die Sonde an `test453`: auf morgen-besser-3 4 von 10
   Läufen, auf morgen-besser-2 0 von 10. In einem eigenen Schritt geöffnet:
   15 von 15 grün; `test453`, `test459` und `test466` (die im vollen Lauf
   mit dieser Meldung rot waren) öffnen seither so. **Derselbe Aufbau —
   `Store.flush()` und `App.oeffne` im selben `evaluate`, auf einer oder
   zwei Zeilen — steht noch in 116 weiteren Läufen**: 172 204 209 210 212 214 220 221 222 223 247 260 285 292 295 296 299 301 324 341 343 344 345 346 347 348 349 350 351 352 385 386 395 396 404 405 406 407 408 411 412 415 436 438 439 440 441 442 443 444 445 446 447 448 449 451 452 454 455 456 457 458 461 462 463 464 465 467 468 469 470 471 472 473 475 477 478 479 480 492 522 523 524 527 529 533 534 535 536 538 539 561 562 563 564 568 569 570 572 573 574 575 576 577 580 582 583 585 588 589 590 593 594 596 598 603. Sieben davon
   waren im vollen Lauf rot, aber aus anderen Gründen (348, 351, 448, 470,
   524, 533 bleiben fremd rot; 588 war danach dreimal grün); keiner brach
   mit „Execution context was destroyed" ab. Umstellen, sobald einer es
   tut — oder in einem eigenen Zweig alle auf einmal, mit einem gemeinsamen
   Helfer statt hundert Kopien.

## Nach dem Zusammenführen der zweiten Welle (5. Oktober 2026)

Gefunden auf `claude/morgen-besser-2`, nicht dort gelöst — je mit dem
Grund:

1. **Fremde rote Wächter, schon auf `claude/morgen-besser` rot** (dort
   nachgemessen, nicht nebenbei repariert): `test86` (neue Bereiche
   `seitenansichten`, `werkzeuge` nicht angekündigt — seit dem
   11. Oktober eingetragen und grün), `test201` §1 (die
   Probe aus L235 Punkt 1 — Redurs Frage), `test270` (im Arbeitsbaum ist
   `.git` eine Datei), `test274`, `test332` (`.menu .kenn`, `#handy-oben`),
   `test365` („Dreizehn Werkzeuge — ist 14, soll 13", seit E671 vierzehn;
   `test464` hat E714 nachgezogen, diesen nicht), `test425` („Die
   Markierung wirkt über den Grund"), `test448` („Die Klappe des Reglers
   ist offen" — `{"auf":false,"klappe":0,"regler":0}`), `test348` („Die
   grossen Knöpfe sind mindestens 44 px"; auf dem Grundstand 31/34, hier
   33/34), `test470` (wartet 5 s auf `.overlay [data-w="sichern"]`), `test493`
   (`-webkit-backdrop-filter: blur(8px)` in `motion.css` — aus E695, also
   aus meinem eigenen Bogen vom 27. September; Chromium kennt nur die
   Form ohne Präfix, und der Lauf verlangt, dass der Browser jede neue
   Eigenschaft versteht), `test524` („Beide Leisten tragen den Rollschatten —
   zwei Schatten, zwei Deckel"), `test582` (Sand und Wald 4,45 : 1).
   Ein eigener „Rot zuerst"-Zweig, Wächter nur mit Redurs Wort ändern.
2. **Die Linse auf „Heute" ruht über „ken"** (E712): im Gesamtbild steht
   „Weiterdenl(en" — die vergrösserte Abschrift deckt die letzte Silbe.
   Redurs Frage aus der Liste vom 5. Oktober („neben dem Wort ruhen?").

## Die Fläche nach E722/E723 (6. Oktober 2026)

1. **Gedankenkarte und Planfläche auf `GfxToolbar`** (L243 Punkt 1) — dann
   kommen sie von selbst in den einen Schacht der Fläche. Mit Wächter:
   `test598` §1 auch mit einer Gedankenkarte im Kasten.
2. **„Alles löschen" des Whiteboards mit `Dialog.bestaetigen`** (L243
   Punkt 2, E710 und E709) statt `confirm()`.
3. **Die Auswahlleiste der Tabelle am Telefon** ausserhalb der Fläche:
   sie steht fest 24 px über dem Rand. Der Nachbar am Telefon ist die
   UNTERE Leiste, nicht `#handy-oben`. In der Fläche am Telefon rendert die
   Datenbank Karten ohne `input.zeilen-aus` — die Regel
   `body:has(.pg-flaeche) #sammelleiste{bottom:…}` ist dort also
   gerechnet, nicht mit einer echten Auswahl gemessen (erzwungen: 601–659
   gegen Schacht 669–739 und untere Leiste 775–835, `messungen.md` §92).
   Ein Wächter mit einer echten Auswahl am Telefon fehlt noch.

4. **Umschalt+Rad auf dem Grund der Fläche** (gefunden in der zweiten
   Durchsicht, 10. Oktober): über einer breiten Tabelle rollt Umschalt+Rad
   seither quer, wie überall im Browser — auf dem Grund daneben schiebt es
   die Fläche weiter LÄNGS (`deltaY` mit `shiftKey`). Ob Umschalt+Rad dort
   quer schieben soll, wie in AFFiNE und Figma, ist eine Frage an Redur;
   mit Wächter in `test598` §5.

## Nach E719 und E720 — Herz und tote Knöpfe (6. Oktober 2026)

1. **Was das Herz merkt — Redurs Frage 7 der Schlussliste.** Gebaut ist die
   Vorgabe „Lieblingskennzahl" (Streifen „Gemerkt" auf Heute). Antwortet
   Redur anders (die Karten hinter der Kennzahl merken, das Fehlertraining
   anheften, das Herz weglassen), hält `test595` den roten Teil (echter
   Knopf, Zustand, Speichern) weiter; nur §3/§5 sprechen vom Streifen.
2. **Herzen, die Schmuck bleiben** (L241): Bestandsgesundheit,
   Simulationsergebnis, Fachseite — Redurs Wahl je Stelle.
3. **„Kein toter Knopf" für die ganze App** (L240): derselbe Zensus wie
   `test596` §1 für Arbeitswelt, Bibliothek, Notizhefte, Finder,
   Einstellungen und Menüs — und die Gegenseite aus `test596` §9: bleiben
   gesperrte Knöpfe dort still? Rot zuerst; die Reparatur ist meist ein
   Wort oder eine fehlende Hover-Zeile.


## Nach E726 — Der Kopf des Lernzentrums (10. Oktober 2026)

1. **Ein gespeichertes Fach an der Karte?** (L246 Punkt 1) Heute ist ein
   Fach das Thema der Karte oder eine Zeile der Fächer-Datenbank, über den
   Namen zusammengeführt. Will Redur „Mathe" und „Mathematik" als EIN Fach,
   braucht es ein Feld, einen Typ in `core/types` und Export-/Importprüfungen
   — rot zuerst mit `test100`.
2. **Filtert das Fach auch die Trainer-Kapitel?** (L246 Punkt 2, Vorgabe 4
   war nein.)
3. **„Heute" und „Lernen" in der unteren Leiste am Telefon** (L246 Punkt 3)
   — doppelte Navigation nach dem PDF; eine Entscheidung über die Schale.
4. **Das Blatt von `UI.wahl` am Telefon ohne `role="menu"`** (L246 Punkt 5)
   — gehört `claude/menue-eine-quelle`; rot zuerst in `test597` §14.
   Wenn es landet: `test601` §3d–f prüft die Rolle auch am Telefon.
5. **„Prüfungen" über „Prüfungen" im Menü „Heute ^"?** Die Gruppe trägt
   den alten Reiternamen (Vorgabe 1), ihr erster Eintrag heisst genauso.
   „Prüfungen & Noten" wäre eindeutiger, aber ein neuer Name für etwas,
   das man kannte — Redurs Wahl (Durchsicht vom 11. Oktober).
6. **Der Chip bekommt den Fokus vor „Heute"** (L246 Punkt 7). Ihn im
   Auszeichnungstext hinter die Leiste zu setzen, braucht einen anderen
   Aufbau des Kopfs (ruhige Fassung: `margin-bottom:-46px`; Telefon:
   Raster) — rot zuerst in `test601` §3 mit der Tabulatorfolge.

## Nach E718 (6. Oktober 2026) — Ordner bearbeiten

Gefunden beim Bau von E718, nicht dort entschieden — je mit dem Grund:

1. **Das Fach der Notizhefte** sagt „Fach in den Papierkorb gelegt. Seine
   Hefte bleiben im Regal." — ein Ordner der Bibliothek nimmt seit E718
   seinen Inhalt mit (und bringt ihn mit „Rückgängig" zurück). Soll das
   Fach derselben Regel folgen? Redurs Frage (L239 Punkt 2).
2. **Alte Papierkorb-Seiten ohne `trashedAt`** (vor E718 über die
   Bibliothek weggelegt) laufen nie ab. Einmal nachtragen ist eine
   Datenänderung — nur mit Redurs Wort (L239 Punkt 1).
3. **Der Rechtsklick, das echte „…" und die Tastatur im Menü** für Karten,
   Ablagebaum, Seitenleiste und Notizhefte, dazu „Symbol ändern" und
   „Verschieben" im Ordnermenü: `claude/menue-eine-quelle` ruft dafür
   `App.umbenennen`, `App.inPapierkorb` und `App.nachAenderung`.
4. **Recht zum Weglegen: „bearbeiten" oder „loeschen"?** `App.inPapierkorb`
   fragt seit der Durchsicht vom 6. Oktober `Konten.darf('bearbeiten', id)`
   — die Rolle „Bearbeiten" konnte schon vorher weglegen, und der
   Papierkorb ist umkehrbar. Soll Weglegen das Recht „loeschen" verlangen
   (dann kann nur noch Vollzugriff weglegen)? Redurs Frage (L239 Punkt 3).
5. **„Rückgängig" mit der Tastatur näher holen.** Der Knopf in der Meldung
   ist 44 px und fokussierbar, aber `#toast` ist das letzte Kind von
   `body` — mit Tab kommt man erst am Ende der Seite hin. Fokus zurück oder
   Strg+Z in der Bibliothek: `claude/menue-eine-quelle` (L239 Punkt 4).
   *Nach E721 weiter offen (L242 Punkt 4): ein Fokus, der von selbst in die
   Meldung springt, wäre für den Vorleser schlimmer; der Papierkorb bleibt
   der zweite Rückweg. Redurs Wort, ob Strg+Z in der Bibliothek das letzte
   Weglegen zurücknehmen soll.*

## Nach E724 (6. Oktober 2026) — KI am Ort

Gefunden beim Bau von E724, nicht dort entschieden — je mit dem Grund:

1. **KI-Befehle an Tabellen- und Datenbankzellen.** Der Katalog
   (`Register.ki`) kennt noch kein Ziel `zelle`; das Befehlsmenü öffnet sich
   an einer markierten Zelle nicht (L244 Punkt 1).
2. **Erwähnte Seite trotz „Seiteninhalt mitgeben: aus"?** Heute zählt eine
   Erwähnung nur, wenn `kiKontext` an ist. Redurs Frage (L244 Punkt 2).
3. **Ersetzen über Auszeichnung hinweg** ohne `ct.textContent` — zuerst ein
   Wächter, der eine Markierung über `**…**` ersetzt (L244 Punkt 3).
4. **Die acht Funkel im leeren Chat**: laut (wie heute, Vorgabe D1) oder
   still in Ruhe wie die Lernwelt nach E720 — Redurs Wahl (L244 Punkt 4).
5. **Ihre Höhe am Rechner mit Maus**: 44 px am Finger seit der Durchsicht
   vom 10. Oktober, am Rechner die Originalmasse aus E528 — Redurs Wahl
   (L244 Punkt 5).
6. **„@" für die Bau-Werkzeuge** („@Datenbank bauen Kundenliste"): ein
   Zweig in `atBefehl`, der den Rest als Antwort auf die Frage des
   Werkzeugs nimmt (L244 Punkt 6).
7. **`test422` auf den Zweigen mit `claude/kein-toter-knopf`**: rot seit
   E720 (`lernwelt.ts` schreibt Ansichtsnamen als Zeichenkette), auf
   `claude/morgen-besser-2` grün — gehört dem Zweig von E720.

## Nach E721 (6. Oktober 2026) — Ein Menü je Ding

Gefunden beim Bau von E721, nicht dort entschieden — je mit dem Grund:

1. **Die Dinge IN einem Dokument** (Tabelle, Blatt-Reiter, Leinwand-Spalte,
   Kasten auf der Fläche, PDF-Seite, Schaltplan, Gedankenkarte) haben ihre
   eigenen Listen behalten und nur das Rot bekommen. Ob und wie sie ins
   Register kommen, ist ein eigener Bogen (L242 Punkt 1).
2. **Die Zeile einer Datenbank** meldet ihre Aktionen nicht im Register,
   ihr Löschen und Umbenennen ist aber derselbe Griff. Wenn die Datenbanken
   ohnehin umgebaut werden: ihre Einträge melden, wenn das Modul lädt (L242
   Punkt 2).
3. **`Menue.wahl` ist gebaut, aber noch von niemandem benutzt.** Die Zweige
   `claude/bibliothek-eine-suche` (Ort, Art, Form) und
   `claude/lernzentrum-kopf` (Heute ⌃, Übersicht ⌃, Fächer) ziehen darauf
   um — keiner baut eine zweite Auswahlliste. *(Nachtrag 10. Oktober: das
   Lernzentrum ist umgezogen, E726.)*
4. **Nach der Durchsicht vom 10. Oktober noch offen:** die übrigen
   Gefahr-Einträge ohne `data-gefahr` (L242 Punkt 1 nennt sie einzeln:
   „Eine Vorlage löschen", „Alle Kacheln entfernen", „Inhalt leeren" …) —
   jeder ist ein sichtbarer Wechsel und braucht sein Bild; und der
   Schlucker nach langem Drücken auf einem echten Tablet (L242 Punkt 5),
   der sich mit CDP nicht nachstellen liess. `UI.wahl` gibt seinen
   Gruppen jetzt Namen (`role="group"`) — wer darauf umzieht, prüft das
   Blatt am Telefon mit Überschrift über der Karte.

## Nach E725 (10. Oktober 2026) — Bibliothek: eine Suche

Gefunden beim Bau von E725, nicht dort entschieden — je mit dem Grund:

1. **Ein Sucheingang oben in einem Dokument am Telefon** (Vorgabe f, nicht
   in dieser Welle). Heute steht die Lupe nur in der Ansichtsklappe unter
   👁. Mit dem Platz der Dokumentleiste abstimmen (Seiteneditor, Fläche;
   L245 Punkt 1).
2. **Ein Bereich für die Notizhefte** („dieses Fach") — dieselbe Frage wie
   `Bibliothek.suchBereich()`, im Bereich der Notizhefte beantwortet
   (L245 Punkt 4).
3. **„Im Regal zeigen"** aus der Suche im Bereich Bibliothek (L245 Punkt
   5) — wenn Redur es will; Vorgabe c war: Treffer mit Vorschau, kein
   Live-Filter.
4. **Pfeiltasten im Blatt am Telefon** (`Menue.wahl`) — gehört `menue.ts`
   (E721); heute geht Tab (L245 Punkt 3). Dazu: die Pille sagt
   `aria-haspopup="menu"`, wo am Telefon ein Blatt (`role=dialog`) aufgeht.
5. **Ein Bereich „Diese Seite" auf einer gewöhnlichen Seite** über die
   Leiste von Strg F (E667) — Redur schrieb „pdf oder eine dokument";
   gebaut ist die Zeile für Dokumente (L245 Punkt 7).
6. **Die Rückgängig-Pille des Studios deckt bei 1440 px die Liste „Alle
   Dokumente" der Suchleiste zum Teil zu** — schon auf dem Grundstand so
   (L245 Punkt 8).
7. **`test436` §7 stabil machen** — er wackelt auch auf dem Grundstand
   (2 von 5); ein eigener Schritt mit eigenem Eintrag, nicht in einem
   fremden Bogen (L245 Punkt 9).

## Nach E717 — der Seiteneditor ohne Stau (6. Oktober 2026)

Offen geblieben, je mit dem Grund (Zweig `claude/seiteneditor-ohne-stau`):

1. **Eine Stelle für „was man nicht sieht, wird nicht gezeichnet"** (L238
   Punkt 1). Der Dokumentmodus rechnet sein Nähe-Fenster selbst, die
   Seitenansicht hat seit E717 `Nahzeichnen` in `editor.ts`. Zusammenlegen
   in `src/kern/helfer/`, mit `test395` §3/§7 und `test593` §2 als
   Wächtern — ein eigener Bogen, weil er den Dokumentmodus umbaut.
2. **Weit entfernte Seiten wieder abbauen?** (L238 Punkt 2). Nach einem
   Rollen durch alle Seiten ist wieder alles gezeichnet, und ein Tipp
   kostet am Telefon wieder 1,3 s (`messungen.md` §88). Zuerst klären, was
   mit einer offenen Auswahl oder einem Text in Arbeit auf einer
   abgebauten Seite geschieht.
3. **Andere schwere Blöcke in der Seitenansicht** (Whiteboard,
   Gedankenkarte, Planfläche) zeichnen weiter sofort und ganz. E717 deckt
   `pdfseite` und `blatt`; die Schritte 1 und 2 (eine Meldung je
   Durchgang, ein Neubau des Bands) helfen allen 46 Aufrufen von
   `App.zeichneSeite()` in `editor.ts`. Erst messen, ob eine Seite mit
   vielen Whiteboards ähnlich stockt.
4. **Die Miniaturen im Dokumentmodus in Stücken bauen** — die These der
   Codex-Zweige vom 1. Oktober, nicht die gemessene Ursache (die Karte:
   68,8 % in `scrollIntoView`). Nur, wenn eine neue Messung es zeigt.

## Nach E716 · Der Trenner zieht (6. Oktober 2026)

1. **Die alten Griffe der Seitenleiste — Redurs Frage (L237).** Darf der
   verdeckte `#side-griff` gelöscht werden (die Breite der Seitenleiste
   bleibt am `.side-griff`, geprüft von `test52`/`test143`), und darf der
   verirrte 6-px-Streifen `.side-griff` am Rand der Telefon-Schublade
   verschwinden? Bis er ja sagt, bleiben beide unberührt (§43). Danach:
   `test52` rot zuerst um „genau ein Griff" und „bei 390 px unsichtbar"
   erweitern, dann bauen.
2. **Die offenen Fragen aus dem Plan zu #5**, ohne Antwort mit der Vorgabe
   gebaut (E716): Grenzen 148–260 bleiben; harte Grenze statt Gummiband;
   Enter am Trenner tut nichts (kompakt bleibt der eine Knopf
   `#studio-nav`). Sagt Redur anders, ist es je ein kleiner Bogen mit
   `test592` als Nachbar.
3. **`Store.flush()` wartet nicht auf `setMeta`** (gefunden in E716). Ein
   Lauf, der eine Einstellung setzt und neu lädt, kann sie verlieren;
   `test40` und `test592` lesen deshalb vor dem Neuladen über eine zweite
   Verbindung. `test424` setzt kompakt und lädt nach `flush` neu — sein
   Kommentar sagt, flush schütze davor, und das stimmt nicht. Entweder
   `flush` wartet auch auf die offenen `put`s der Einstellungen (eine
   Änderung an `indexdb.ts`, mit eigenem Prüflauf), oder die Läufe bekommen
   einen gemeinsamen Helfer. Eigener Bogen.


## Nach E727 und E728 · Das Gestirn und der ruhige Kopf (6. Oktober 2026)

1. **Die offenen Fragen aus dem Plan zu #4 und #10**, ohne Antwort mit der
   Vorgabe gebaut: die Form ist das Gestirn (nicht die Sonne|Mond-Kapsel
   oder der Kit-Schalter); der eigene Akzent bleibt beim Wechsel; kein
   seitenweites Aufblenden; das Zeichen zeigt den Zustand; „PDF öffnen"
   bleibt als Zeichen im Kopf; `band` statt ⌘; am Telefon bleibt die
   oberste Zeile; „ein Titel" auch am Rechner; der Motor dreht auch bei
   Strg P. Sagt Redur anders, ist es je ein kleiner Bogen mit `test602`
   bzw. `test603` als Nachbar.
2. **Was L247 offen lässt:** das Gestirn am Telefon (oder eine Kapsel
   links in der obersten Zeile), ◐ in der alten Seitenleiste als Zeichen
   aus dem Register, der Präfix-Zwilling des Glases auf einem echten
   iPhone; seit der Durchsicht vom 10. Oktober auch die zwei Hinweise
   unter dem Zeiger am Gestirn (Punkt 4) und „Strg P" in hellen Schemata
   unter 3 : 1 (Punkt 5, ein eigener kleiner Kontrastbogen).

