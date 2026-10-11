# Wie Redion innen aussieht

**Stand: 3. August 2026**

Diese Datei beantwortet drei Fragen: **wo liegt was**, **wer darf wen rufen**,
und **wo trage ich etwas Neues ein**. Wer sie gelesen hat, kann eine
Blockart, eine Ansicht oder einen ganzen Bereich hinzufügen, ohne zu raten.

---

## Der Ausgangspunkt: warum überhaupt umbauen

Vorher lagen 52 Dateien flach in einem Ordner, von `store.js` bis
`wolke-fenster.js`. Der Name war die einzige Ordnung. Das funktioniert bis
etwa zwanzig Dateien und wird danach zu einer Suchaufgabe: *„wo wird
entschieden, welche Fassung beim Abgleich gewinnt?"* war eine Frage, auf die
man nur mit Volltextsuche antworten konnte.

Dazu kamen drei Dateien mit über 100 KB, in denen alles lag, was zufällig
zusammen entstanden war — `tools.js` enthielt die Befehlspalette, die
Karteikarten, das Journal, die Schlagwörter und den Graph. Keiner dieser
fünf hat mit den anderen zu tun.

---

## Die Schichten

```
quell/
├─ start.js       der einzige Einstiegspunkt
├─ kern/          kennt keinen Bereich
├─ register/      die Kataloge — beschreiben, tun nichts
├─ schale/        was immer sichtbar ist
└─ bereiche/      die Produktbereiche
```

Die Reihenfolge ist auch die Abhängigkeitsrichtung: **oben darf unten nicht
kennen.** `kern/` weiss nichts von Bereichen, `register/` nichts von der
Schale, und ein Bereich nichts von einem anderen.

### `kern/` — das Fundament

| Ordner | Was darin liegt |
|---|---|
| `ablage/` | IndexedDB, die Formen der Sätze, die Umzüge, die internen Befehle |
| `zustand/` | Rückgängig und Wiederholen |
| `ereignisse/` | der Bus, die Namensliste, das Protokoll |
| `abgleich/` | die Abgleichsmaschine und das Zusammenführen |
| `zugang/` | Sitzung, Rechte je Spalte, Rollen |
| `sicherheit/` | Verschlüsselung, HTML säubern, Werte prüfen |
| `helfer/` | Datum, Objekte, Bremsen, Melder, Tempo, Bytes |
| `einstellung/` | Konstanten, Schalter, was diese Fassung ist |

Der Prüfstein für `kern/`: **eine Datei hier darf nichts aus `bereiche/`
nennen.** Tut sie es, gehört entweder der Code dorthin oder das Gemeinsame
nach `kern/`.

### `core/` — dasselbe Fundament, schon migriert

Ein zweiter Ordner neben `kern/`, und das ist kein Versehen. Was aus
TypeScript nach `quell/` ausgegeben wird, landet unter englischem Pfad
(`ENTSCHEIDUNGEN.md` E27, `CLAUDE.md` 53). Zur Zeit steht dort eine Datei:

| Ordner | Was darin liegt |
|---|---|
| `core/helpers/` | `ids.js` — Kennungen erzeugen und lesen. Quelle: `src/core/helpers/ids.ts` |

`kern/` und `core/` gehorchen derselben Regel — kein Zugriff auf `bereiche/`.
Sie wachsen aufeinander zu: `core/` füllt sich, `kern/` leert sich, und wenn
`kern/` leer ist, ist die Migration fertig (`doku/TYPESCRIPT-MIGRATION.md`).

### `register/` — die Kataloge

Zwölf davon stehen hier (weitere in `src/register/`), und jede beantwortet die Frage *„wo trage ich das ein?"*:

| Datei | Wofür |
|---|---|
| `module.js` | welche Bereiche es gibt |
| `navigation.js` | was in der Seitenleiste steht, in welcher Folge |
| `bloecke.js` | die 58 Blockarten |
| `eigenschaften.js` | die 35 Spaltentypen |
| `ansichten.js` | die 12 Ansichtsarten einer Datenbank |
| `befehle.js` | die Befehlspalette |
| `tasten.js` | die 130 Tastenkürzel |
| `einstellungen.js` | jede Einstellung mit Vorgabe und Bedeutung |
| `formeln.js` | was jede Formelfunktion bedeutet |
| `vorlagen.js` | die Galerie, mit Fassungsnummer |
| `verbindungen.js` | jede Tür nach draussen — und was durch sie geht |
| `aktionen.js` | was man mit einem Ding (einer Seite) tun kann — Rechtsklick, „…", Entf und langes Drücken fragen hier (E721) |
| `ki.js` | die KI-Befehle: worauf sie wirken, was sie verlangen, wohin das Ergebnis geht (E724) — EIN Katalog für den Chat, das Befehlsmenü, „@", „/", „✨ KI" und die Palette |

(Es sind inzwischen mehr als elf; die Tabelle nennt die, nach denen man
fragt. `aktionen.js` steht hier, weil es die Frage *„wo trage ich eine
Aktion an einem Ordner, einer Seite, einem Heft ein?"* beantwortet — vorher
gab es darauf fünf Antworten, eine je Menü.)

Ein Register **beschreibt, es tut nicht.** Wie ein Block gezeichnet wird,
steht im Bereich; dass es ihn gibt, steht im Register.

**Ein Detail, das leicht schiefgeht:** `alle()` gibt immer *dieselbe* Liste
zurück, nicht jedes Mal eine Kopie. Die Bereiche holen sie sich einmal beim
Laden. Gäbe es eine Kopie, wäre eine später angemeldete Blockart überall
unsichtbar — sie stünde im Register und käme in keinem Menü an.

### `schale/` — was immer da ist

```
schale/
├─ aufbau/          schale.js         Routing, Seitenmenü, Suche, Start,
│                                     und das Zusammensetzen
│                   seitenleiste.js   die linke Leiste
│                   kopfleiste.js     Cover, Symbol, Titel, Werkzeugzeile,
│                                     Pfadleiste
│                   inhaltsflaeche.js Blöcke, Rückverweise, Streifen
│                   reiter.js         Reiter, geteilte Ansicht
├─ bedienung/       spring.js         die Federn des Touch Kits, ohne React
│                                     (RedionSpring, E702)
│                   press.js          die Druckfeder: jeder Knopf sinkt ein
│                                     und federt zurück (RedionPress, E702)
│                   delete.js         der Löschen-Knopf, der in „Löschen" und
│                                     „Abbrechen" zerfliesst (RedionDelete, E709;
│                                     Stil: stil/loeschen.css)
│                   selection-flow.js die wandernde Fläche (E646), motion.js
│                                     die Bewegungsschicht (E528–E537) …
│                   tropfen.js        ein Knopf fliesst in sein Menü und
│                                     zurück, EIN Goo-Filter (E712)
│                   kacheln.js        die Glaskacheln in „Mehr" und den
│                                     Einstellungen (Schnellkacheln, E712)
├─ ueberlagerung/   Menü, Dialog, Hinweis — und UI als der alte Name
└─ stil/            marken.css        die drei Schriften
                    dunkel.css        die Farben — der Normalfall
                    hell.css          nur, was im Hellmodus anders ist
                    grund.css         Grundelemente und Farbklassen
                    aufbau.css        das Gerüst
                    datenbanken.css   der Rahmen einer Datenbank
                    ki.css            das KI-Panel
                    werkzeuge.css     Menüs, Dialoge, Graph, Karteikarten
                    ansichten.css     Zeitstrahl, Diagramm, Formular
                    einstellungen.css Einstellungen und Verbindungen
                    bausteine.css     der Rest
```

Die sechs hinteren sind **zusammenhängende Ausschnitte** aus dem früheren
`bausteine.css`, keine thematisch zusammengesuchten. Das ist gemessen und
nicht vorsichtig: 33 Selektoren stehen in mehr als einem Themenblock
(`#sidebar`, `.db`, `#ai`, `#page`, `.karte`). Wer sie thematisch zusammenzieht,
sortiert um — und dreht bei genau diesen um, wer gegen wen gewinnt.

Die Reihenfolge der sechs Stilblätter in `index.html` zählt. Dunkel steht in
`:root` und gilt immer; `hell.css` überschreibt nur, wenn am `html` das
Merkmal `data-theme="light"` steht. Wer in `dunkel.css` eine Variable ergänzt,
muss sie auch in `hell.css` ergänzen — sonst zeigt der Hellmodus dort den
dunklen Wert, und das merkt nur, wer hell arbeitet.

Die drei Zeichner kennen `App` nicht. Sie bekommen, was sie von drüben
brauchen, über `binde({ … })` in `App.start()` — und ein Prüflauf sieht
nach, dass im Quelltext keiner von ihnen `App.` sagt. `schale.js` entscheidet
nur noch, **was** gezeichnet wird; das **wie** liegt nebenan.

Ein Rückgabewert, den man kennen muss: `Kopfleiste.zeichne` sagt `false`,
wenn danach Schluss ist — bei einer verschlüsselten Seite. Wer ihn übergeht,
zeigt verschlüsselten Inhalt an.

`UI.toast`, `UI.menu` und `UI.frage` stehen an ein paar hundert Stellen.
Diese Aufrufe umzuschreiben wäre viel Arbeit für keinen Gewinn und ein hohes
Risiko: jede übersehene Stelle wäre ein Fehler, den erst ein Mensch findet.
Deshalb ist `UI` heute eine Weiterreichung an `Menue`, `Hinweis` und
`Dialog`. Wer etwas Neues baut, ruft die direkt.

### `bereiche/` — die Produktbereiche

Editor, Blöcke, Datenbanken, Vorlagen, Kommentare, Erwähnungen, Seiten,
Planen, Wissen, KI, Verbinden, Dateien, Einstellungen, Hilfe.

Ein Bereich ist ein Stück App mit eigener Aufgabe. Innen soll er zerfallen
in:

```
bereiche/<name>/
├─ dienst.js      reine Logik — kein DOM, kein Speicherzugriff
├─ steuerung.js   verbindet Oberfläche und Dienst
├─ ansicht/       zeichnet
└─ daten.js       Kataloge und Beispielinhalte (falls nötig)
```

**`datenbanken` ist der erste Bereich, bei dem das wirklich stimmt.** Und die
Probe darauf ist nicht die Ordnerstruktur, sondern ein Prüflauf: `dienst.js`
lädt in Node, ohne `document` und ohne `window`. Was das nicht schafft, ist
nur der Form nach getrennt.

Ob ein Schnitt überhaupt möglich ist, entscheidet die **Richtung der
Abhängigkeit**, und die zählt man ab, bevor man schneidet: bei `datenbanken`
brauchte der Logikteil nichts aus der Oberfläche, die Oberfläche aber 16 Namen
aus der Logik. Nur deshalb ging es ohne Verhaltensänderung. Läuft es an einer
einzigen Stelle in beide Richtungen, ist der Bereich noch nicht so weit.

**Und manchmal sagt die Messung: es geht gar nicht.** Bei `wissen` wurde vor
dem Schnitt gezählt, und alle vierzehn Abschnitte von `werkzeuge.js` fassen das
Dokument an, zwischen 7 und 47 Mal. Dort gibt es keine Logikhälfte; ein Schnitt
hätte mitten durch eine Zeichenfunktion gehen müssen. Der ehrliche Ertrag war
dann eine kleine `wissen/dienst.js` mit den neun Stellen, die wirklich nur
rechnen — die unscharfe Suche der Befehlspalette, das Wiederholungsverfahren
der Karteikarten, Markdown hin und zurück, die Zahlen der Statistik.

Das ist kein schlechteres Ergebnis, sondern ein anderes: es sind genau die
Stellen, bei denen man sich fragt, ob sie richtig rechnen. Wer statt zu messen
die Struktur erzwingt, bekommt zwei Dateien, die zusammen dasselbe tun, und
einen Prüflauf weniger, als er glaubt zu haben.

Das ist der Teil, der noch läuft: einige Bereiche sind schon so aufgeteilt,
andere liegen noch als eine Datei da. Der Umbau geht Bereich für Bereich —
und jeder Schritt endet mit grünen Prüfläufen, sonst ist es kein Umbau,
sondern eine Wette.

---

## Wer darf wen rufen

```
bereiche/  →  register/  →  kern/
    ↓                          ↑
  schale/  ────────────────────┘
```

**Erlaubt:** ein Bereich ruft `kern/` und liest `register/`.
**Nicht erlaubt:** ein Bereich ruft einen anderen Bereich.

Braucht er trotzdem etwas von drüben, gibt es zwei Wege:

1. **Der Ereignisbus.** Statt `Graph.aktualisiere(seiteId)` sagt der Bereich
   `Ereignisse.melde(ARTEN.seiteGeaendert, { id })`. Wer zuhört, reagiert.
   Wer nicht zuhört, ist nicht kaputt.
2. **Nach `kern/` verschieben.** Brauchen es zwei Bereiche, gehört es keinem
   von beiden.

Warum das zählt: vorher rief der Kalender die Datenbank, die Datenbank die
Schale, die Schale die KI. Jede dieser Linien ist einzeln vernünftig, und
zusammen ergeben sie ein Knäuel, in dem man eine Datei nicht mehr anfassen
kann, ohne drei andere zu lesen. Ein Bus macht daraus einen Stern.

---

## Der Ereignisbus

`kern/ereignisse/bus.js`, vier Funktionen:

```js
Ereignisse.horche(ARTEN.seiteGeaendert, ({ id }) => { … })   // zuhören
Ereignisse.einmal(ARTEN.appSteht, () => { … })               // einmal
Ereignisse.melde(ARTEN.seiteAngelegt, { id })                // Aussage
Ereignisse.frage(ARTEN.frageNavigation)                      // Frage
```

Der Unterschied zwischen `melde` und `frage` ist wichtig: eine **Aussage**
darf niemanden interessieren, eine **Frage** will Antworten. `frage` sammelt
alles ein, was nicht `null` ist.

Die Namen stehen in `kern/ereignisse/arten.js` — als Konstanten, nicht als
Zeichenketten. Ein Bus ohne Namensliste ist eine Sammlung von Tippfehlern:
wer auf `'seite.geandert'` horcht, während der andere `'seite.geaendert'`
meldet, bekommt nie einen Fehler — nur nie ein Ereignis. Das ist die
unangenehmste Sorte Fehler, weil sie aussieht wie „das Modul tut nichts".

Ein Zuhörer, der einen Fehler wirft, reisst die anderen nicht mit.

---

## Kein Bauschritt

Die Dateien werden als gewöhnliche `<script src>` geladen, nicht als Module.
Das ist eine Entscheidung, keine Nachlässigkeit:

- Die App läuft **direkt von der Festplatte**. ES-Module tun das nicht —
  `file://` verweigert sie aus Sicherheitsgründen.
- Es gibt **keine Werkzeugkette**, die veralten kann. Wer das Repository in
  fünf Jahren öffnet, kann es öffnen.
- `node bauen.mts` fasst alles zu einer einzigen HTML-Datei zusammen. Das ist
  eine Bequemlichkeit, keine Voraussetzung.

Der Preis: jedes Modul ist ein globaler Name, und die Reihenfolge in
`index.html` zählt. Deshalb gibt es **einen** Einstiegspunkt (`start.js`) und
nichts, was sich selbst startet.

### Die React-Inseln (E699)

Seit dem 27. September 2026 gibt es React — als **Inseln**, nicht als zweite
App. Eine Insel ist ein Bauteil aus Redurs Touch Kit, das an einer Stelle der
Schale ein Element ersetzt; die Schale bleibt, wie sie oben beschrieben ist.

```
src/islands/          TSX, englisch benannt, nur Ansicht
├─ main.tsx           RedionIslands { version, mount, update, unmount }
├─ probe.tsx          die Probe für test579 (Stufe 1a — sonst noch keine)
├─ bridge.tsx         spiegelt data-theme → data-ui-theme (erst ab mount)
├─ bridge.css         Kit-Marken → Redions Marken (--ui-color-accent → --accent …)
└─ react-runtime.tsx  was von React ins Bündel kommt
fremd/touch/          das Touch Kit, Kopie aus UI-Kit @c192821 (nicht ausgeliefert)
bauen-inseln.mts      Vite 8 → zwei klassische Skripte:
                      quell/fremd/react/react.js   RedionReact (fremd, Prüfsumme)
                      quell/islands/islands.js     RedionIslands  + islands.css
src/schale/inseln/laden.ts   Inseln.bereit() — holt beides beim ersten Gebrauch
```

**Wer wen ruft.** Nur die Schale ruft eine Insel: `(await
Inseln.bereit()).mount(element, 'name', props)`. Eine Insel ruft niemanden —
sie bekommt Props und gibt Rückrufe zurück, sie liest weder `Store` noch
IndexedDB noch einen Bereich (§5, §9). Fehler gibt sie als Ereignis an den
Lader, und der an `Reporter` (§7).

**Wann geladen wird.** Nicht beim Start (`test388` §5): beim ersten Gebrauch,
und im Leerlauf nach dem Laden nur dort, wo es nichts über die Leitung
kostet — von der Platte, aus der Einzeldatei (dort stehen die Bytes in drei
`<script type="text/plain">`, die der Browser nicht auswertet), oder aus dem
Speicher des Dienst-Arbeiters.

**Was die Brücke tut.** Das Kit fragt `data-ui-theme` und seine eigenen
Marken; Redion setzt `data-theme` und seine Marken. `bridge.css` legt jede
Kit-Farbe, -Schrift, jeden Radius und jede Ebene auf Redions Marke, als
glatte Werte (kein `light-dark()`, das iOS unter 17.5 nicht kennt).
`color-scheme` bleibt am Wurzelelement, wie es war; es gilt nur an den
Inseln. So erreicht jedes Schema aus „Aussehen" jede Insel — und der Look
des Kits ist dort selbst ein Schema („Touch Kit hell/dunkel").

**Was nicht geht, und geprüft wird** (`test578` §6): eine zweite
HTML-Seite, `type="module"`, ein Router, eine Insel, die Daten anfasst,
eine Insel, die beim Laden etwas tut.

---

## Wo trage ich etwas Neues ein

| Ich will … | Datei |
|---|---|
| eine Blockart | `register/bloecke.js` |
| einen Spaltentyp | `register/eigenschaften.js` |
| eine Datenbankansicht | `register/ansichten.js` |
| einen Befehl | `register/befehle.js` |
| ein Tastenkürzel | `register/tasten.js` |
| eine Einstellung | `register/einstellungen.js` |
| eine Vorlage | `register/vorlagen.js` + der Bereich Vorlagen |
| eine Verbindung nach draussen | `register/verbindungen.js` |
| einen ganzen Bereich | `register/module.js` **und** `register/navigation.js` |
| eine Aktion an einem Ding (Umbenennen, Farbe, Papierkorb …) | `register/aktionen.js` — `Register.aktionen.melde({ id, name, zeichen, gruppe, gefahr?, taste?, gilt?, tun })`; das Menü zeichnet `Menue.aktionen`, Rechtsklick und Tasten bindet `Menue.aktionenBinden` (E721) |

Beispiel — eine Blockart „Warnung":

```js
// register/bloecke.js
{ id: 'warnung', name: 'Warnung', icon: '⚠', gruppe: 'Grundlegend',
  cmd: ['warnung', 'achtung'], md: '!!', ph: 'Worum geht es?' }
```

Danach steht sie im Slash-Menü, im Umwandeln-Menü, in der Suche und hat ihr
Markdown-Kürzel. Gezeichnet wird sie im Editor — das ist die eine Stelle, an
der noch etwas dazukommen muss.

---

## Die Ablage

Fünf Fassungen, jede mit Grund — nachzulesen in `kern/ablage/umzuege.js`:

| Fassung | Fächer | Warum |
|--:|---|---|
| 1 | blocks, collections, views, meta | die vier Grundformen |
| 2 | versions | Fassungsverlauf, bewusst neben dem Cache |
| 3 | dateien, stuecke | Dateien in Stücken statt als Data-URL |
| 4 | basis | der letzte gemeinsame Stand, für den Abgleich |
| 5 | vorrat | vorberechnete Formelwerte |

Beim Laden läuft zweierlei: **Selbstheilung** (`kern/ablage/formen.js`)
ergänzt fehlende Felder, ohne je etwas zu ersetzen — und die **Umzüge**
tragen nach, was eine frühere Fassung nicht geschrieben hat. Beides einmal,
still, und im Melder nachlesbar.

---

## Prüfen

`npm run pruefen` — die Läufe liegen in `pruefungen/lauf/`, die Übersicht in
`pruefungen/LIESMICH.md`. Sie gehen über echtes Chromium gegen die echte App,
nicht gegen Attrappen, und laufen bei jedem Push von selbst
(`.github/workflows/pruefen.yml`).

Sie liegen **im Repository**, und das ist der Punkt: vorher standen sie unter
`/tmp` auf einem einzigen Rechner. Wer das Projekt auscheckte, hatte die Regel
„erst grün, dann fertig", aber nicht das Mittel, sie einzuhalten.

Zwei kommen ohne Browser aus, und sie sind zusammen in einer Zehntelsekunde
fertig:

- `test87.mjs` prüft, was zwischen zwei Dateien steht und deshalb in keinem
  Verhalten auftaucht — keine rohen Steuerzeichen im Quelltext, dieselben
  Rechte in Oberfläche und Server, dass die Zeichner den Namen `App` nicht
  mehr nennen, dass alle Stilblätter eingehängt sind, und dass das Manifest
  auf Adressen zeigt, die es wirklich gibt.
- `test88.mjs` lädt `bereiche/datenbanken/dienst.js` in Node — ohne
  `document`, ohne `window` — und rechnet Filtern, Sortieren, Gruppieren und
  die Spaltenberechnungen durch. 38 Prüfungen in 47 Millisekunden, wo ein
  Browserlauf zwölf Sekunden braucht.
- `test89.mjs` tut dasselbe für `bereiche/wissen/dienst.js`: 98 Prüfungen in
  60 Millisekunden. Die meisten davon liessen sich in einem Browser gar nicht
  stellen — ob eine dreimal gewusste Karteikarte in fünfzehn Tagen wiederkommt,
  kann man nicht abwarten.
- `test90.mjs` prüft eine Grenze statt einer Rechnung: dass ein
  Anführungszeichen im Text des Nutzers kein HTML-Attribut wird. Zwanzig der
  fünfzig `esc`-Funktionen liessen es durch; an 41 Stellen landet ihr Ergebnis
  in einem Attribut. Ein Knopf namens `" onfocus="…" autofocus="` bekam so
  einen echten Ereignis-Handler, ohne dass ein `<script>` im Spiel war.
- `test91.mjs` prüft die zweite Grenze: dass eine Adresse aus einem Block kein
  Code wird. Ein `<iframe src="javascript:…">` läuft im Ursprung dieser Seite —
  aus dem Rahmen heraus war `parent` erreichbar.

**Wo eine Grenze sitzt, ist eine Entscheidung.** Bei den Adressen sitzt sie
**beim Zeichnen**, nicht am Eingang, und das war eine Korrektur an
`AUFGABEN.md`: `bookmark`- und `file`-Blöcke entstehen beim Import, über den
Clipper, über `/v1/`, beim Abgleich mit dem Server und beim Einlesen einer
Redion-Datei. Eine Prüfung pro Eingang hätte man fünf Mal schreiben und beim
sechsten vergessen müssen. Beim Zeichnen gibt es genau sechs Stellen, an denen
eine Adresse ins Dokument kommt — und die decken jeden Eingang zugleich ab,
auch die, die es noch nicht gibt.

Die Regel ist dabei nicht überall dieselbe, deshalb hat `Saeubern` zwei
Funktionen statt einer: `anhangAdresse` für etwas, das ein Mensch anklickt, und
`rahmenAdresse` für einen `<iframe>`. Die erste lässt **jedes** `data:` durch —
ein Anhang liegt als `data:application/zip` im Speicher, weil es keinen Server
gibt, auf den man ihn legen könnte. Wer dort die strengere Regel nimmt, wirft
jeden Anhang weg.

Das ist der Sinn von A4: was rechnet, soll sich prüfen lassen, ohne dass etwas
gezeichnet wird.

Die Regel beim Umbauen: **ein Umzug, der Verhalten ändert, ist kein Umzug.**
Erst verschieben und grün werden, dann ändern. Wer beides in einem Schritt
tut und danach etwas kaputt findet, weiss nicht, welcher der beiden Schritte
es war.

---

## Was noch aussteht

Ehrlich, damit die Liste nützlich bleibt:

- Die **Seitenleiste** liegt seit A1 in `schale/aufbau/seitenleiste.js` und
  ruft `App` nirgends mehr; was sie von dort braucht, bekommt sie über
  `Seitenleiste.binde({ … })` in `App.start()` gereicht. `App.zeichneBaum`
  bleibt als Name bestehen und reicht dorthin weiter — er steht an 51 Stellen
  im Projekt. Offen bleibt: die eingebauten Abschnitte zeichnet sie weiterhin
  selbst, und von `register/navigation.js` liest sie nur den Platz `'unten'`
  und dort nur die von aussen angemeldeten Einträge. `'oben'` und `'baum'`
  wertet niemand aus.
- Die **Bereiche** sind noch nicht überall in `dienst` und `ansicht`
  getrennt. `datenbanken/steuerung.js` ist mit über 400 KB der grösste
  Brocken.
- Der **Ereignisbus** steht, aber die Bereiche rufen sich noch direkt. Der
  Schalter `ereignisbus` in `kern/einstellung/schalter.js` steht deshalb auf
  aus — solange beides läuft, wäre doppelte Arbeit die Folge.
- Das **Stilblatt** ist noch eine Datei; die Aufteilung in Marken, Hell,
  Dunkel, Aufbau und Bausteine steht aus.
