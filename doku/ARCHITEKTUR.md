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
| `helfer/` | Kennungen, Datum, Objekte, Bremsen, Melder, Tempo |
| `einstellung/` | Konstanten, Schalter, was diese Fassung ist |

Der Prüfstein für `kern/`: **eine Datei hier darf nichts aus `bereiche/`
nennen.** Tut sie es, gehört entweder der Code dorthin oder das Gemeinsame
nach `kern/`.

### `register/` — die Kataloge

Elf Dateien, und jede beantwortet die Frage *„wo trage ich das ein?"*:

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
├─ ueberlagerung/   Menü, Dialog, Hinweis — und UI als der alte Name
└─ stil/            das Aussehen
```

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
- `node bauen.js` fasst alles zu einer einzigen HTML-Datei zusammen. Das ist
  eine Bequemlichkeit, keine Voraussetzung.

Der Preis: jedes Modul ist ein globaler Name, und die Reihenfolge in
`index.html` zählt. Deshalb gibt es **einen** Einstiegspunkt (`start.js`) und
nichts, was sich selbst startet.

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

Einer kommt ohne Browser aus: `test87.mjs` prüft, was zwischen zwei Dateien
steht und deshalb in keinem Verhalten auftaucht — keine rohen Steuerzeichen im
Quelltext, dieselben Rechte in Oberfläche und Server, und dass
`seitenleiste.js`, `kopfleiste.js` und `inhaltsflaeche.js` den Namen `App`
nicht mehr nennen. Er braucht 80 Millisekunden und zeigt damit, worauf A4
hinauswill: reine Logik ohne DOM lässt sich in Millisekunden prüfen statt in
Sekunden.

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
