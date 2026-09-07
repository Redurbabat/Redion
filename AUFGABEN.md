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

### 7 · Der PDF-Teil wie GoodNotes — acht Bögen (Redur, 7. September)

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

Was danach ehrlich offen bleibt, steht in **L133** (Audio mit Zeitbezug,
Handschrift-zu-Text, Mathe, Elemente-Bibliothek, Präsentation, Wolke).

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
