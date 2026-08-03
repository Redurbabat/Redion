# Die Prüfläufe

**58 Läufe, 2329 einzelne Prüfungen.** Sie laufen über echtes Chromium
gegen die echte App — keine Attrappen, keine Mocks, keine nachgebauten
Speicher.

```
node pruefungen/alle.js              alles                    (~12 min)
node pruefungen/alle.js --schnell    ohne die Messläufe       (~11 min)
node pruefungen/alle.js 33 85 86     nur diese drei
node pruefungen/alle.js server       nur die Serverläufe
node pruefungen/alle.js --alt        auch die alten aus alt/

node pruefungen/lauf/test85.mjs      ein einzelner Lauf
```

Vorher einmal:

```
npm install
npx playwright install chromium
```

Über `npm` gehen die Schalter mit zwei Strichen davor:
`npm run pruefen -- --schnell`, `npm run pruefen -- 33 85 86`.

Die Läufe starten ausserdem bei jedem Push von selbst
(`.github/workflows/pruefen.yml`), in zwei Aufträgen: `test87` allein für die
schnelle Antwort, und daneben die ganze Reihe.

---

## Warum sie mehr wert sind als sie aussehen

Diese Läufe sind nicht beim Bauen entstanden, sondern **beim Kaputtmachen**.
Fast jeder von ihnen hat mindestens einen echten Fehler gefunden, den kein
Mensch beim Durchklicken bemerkt hätte. Ein paar davon:

- Der Abgleich schrieb geholte Sätze nur in den Arbeitsspeicher, nie auf die
  Platte. Nach dem Neuladen waren sie weg — und weil die Abgleichsmarke schon
  weitergerückt war, kamen sie **nie wieder**.
- `updateCollection` setzte nie einen Zeitstempel. Für den Abgleich hiess das,
  eine Schemaänderung sei nie geschehen: eine neue Spalte kam auf dem zweiten
  Gerät nie an. Die Zeilen wanderten, ihre Spalten nicht.
- Ein neuer Block änderte die Reihenfolge der Elternseite, ohne sie als
  geändert zu markieren. Der Block lag danach im Speicher und war auf keiner
  Seite zu sehen.
- „Kein Zugriff" löschte die Rechtezeile, statt sie zu speichern — aus einem
  Riegel wurde ein Loch, und das geerbte Recht kam sofort wieder durch.
- Das Salz für die Verschlüsselung gehörte dem Gerät statt dem Konto. Derselbe
  Satz ergab auf zwei Geräten zwei Schlüssel; das Telefon holte 400 Sätze und
  konnte keinen lesen.

Deshalb: **wer eine Funktion ändert, lässt die Läufe laufen.** Und wer eine
neue baut, schreibt einen dazu.

---

## Zwei Eigenheiten, die sonst eine Stunde kosten

**1. Drei Sekunden Pause zwischen zwei Läufen.** Ohne sie werden sie flockig:
Playwright braucht einen Moment, um Ports freizugeben, und IndexedDB hält die
Datenbank kurz gesperrt. Ein Lauf, der einzeln grün ist und in der Reihe rot,
ist fast immer das — nicht ein Fehler im Code. `alle.js` macht die Pause von
selbst.

**2. `App`, `Store`, `Datenbank`, `UI` und `Blocks` stehen nicht auf
`window`.** Sie sind gewöhnliche `const` auf oberster Ebene. In
`page.evaluate` also:

```js
await seite.waitForFunction(() => typeof App !== 'undefined');   // richtig
await seite.waitForFunction(() => window.App);                   // wartet ewig
```

Im Modulcode dasselbe: `typeof Melder !== 'undefined'` statt `self.Melder`.
Module, die sich selbst auf `window` legen (`Register`, `Formen`, `Ereignisse`,
`Kennungen` …), sind beides Mal erreichbar.

---

## Wo was geprüft wird

| Lauf | Worum es geht |
|---|---|
| 31 | PWA, Manifest, Service Worker, Cloudflare-Brücke |
| 32–40 | Editor, Blöcke, Slash-Menü, Tastenkürzel, Datenbank-Werkzeugleiste |
| 41–50 | Formeln, Filter, Sortieren, Rollups, Verknüpfungen, Diagramme |
| 51–60 | Ansichten, Kalender, Zeitstrahl, Board, Pivot, Formulare |
| 61–70 | KI, Agenten, MCP, Kalender, Mail, Import, Export, Oberfläche am Telefon |
| 71–74 | Barrierefreiheit, Ablage, Leistung, die Einzeldatei |
| servercheck, 75–79 | der Server: Konten, Rechte, Abgleich, Spaltenrechte |
| 80–84 | Spaltenrechte in der Oberfläche, Probelauf, Prüfsätze, Vorlagenfassung, Vorrat |
| 85 | der Kern: Helfer, Sicherheit, Formen, Umzüge, Ereignisse |
| 86 | die elf Register |
| 87 | der Quelltext selbst — ohne Browser, in Millisekunden |

`test42.js` gibt einen Bericht statt einer Bilanz aus — er misst, statt zu
urteilen. `alle.js` behandelt ihn wie die anderen; ein Fehler darin fällt
trotzdem auf.

`test87.mjs` ist der einzige, der **keinen Browser** startet. Er prüft, was
zwischen zwei Dateien steht und deshalb in keinem Verhalten auftaucht: dass
kein Steuerzeichen roh im Quelltext steht (in der Einzeldatei macht der
HTML-Parser U+FFFD daraus und reisst den ganzen Skriptblock mit — so fehlte
dort einmal die komplette HTML-Säuberung), dass die Rechtetabellen in
Oberfläche und Server übereinstimmen, und dass die drei Zeichner aus A1/A2
`App` nicht mehr kennen. Er ist nach 80 Millisekunden fertig und steht
deshalb in der CI als eigener, vorgezogener Auftrag.

---

## Was beim Hereinlegen ins Repository zu reparieren war

Die Läufe lagen vorher unter `/tmp` und gingen davon aus, dass drumherum
alles an seinem Platz ist. Zwei Stellen hielten dieser Annahme nicht stand:

- **`test74.js`** zeigte fest auf `/tmp/allein/redion-einzeldatei.html` — einen
  Ordner, den jemand von Hand befüllt haben musste. Auf jedem anderen Rechner
  lief der Lauf damit gegen eine Datei, die es nicht gab, oder schlimmer:
  gegen eine alte, die noch von letzter Woche dort lag und grün meldete. Jetzt
  legt er sich seinen Ordner selbst an und kopiert nur die Einzeldatei hinein
  — womit er endlich wirklich prüft, was er verspricht: dass sie allein läuft.
- **`server/package.json`** mit `type: module` muss es geben, sonst liest Node
  die Serverdateien als CommonJS und meldet „Named export not found".

## `alt/`

31 Läufe aus der Zeit vor dem Umbau. Sie zeigen auf Pfade, die es nicht mehr
gibt, und einige prüfen Verhalten, das sich bewusst geändert hat. Sie liegen
hier, weil in ihnen Wissen steckt, das man beim Nachbauen brauchen kann —
**nicht**, weil sie grün sein müssen.

`node pruefungen/alle.js --alt` nimmt sie mit. Erwarte Rot.

---

## Einen neuen Lauf schreiben

Als Vorlage `test85.mjs` nehmen. Der Rahmen ist immer derselbe:

```js
const { chromium } = require('playwright');
const browser = await chromium.launch();
const seite = await browser.newPage();
const fehler = [];
seite.on('pageerror', e => fehler.push(e.message));
await seite.goto('file://' + WURZEL + '/index.html');
await seite.waitForFunction(() => typeof App !== 'undefined', null, { timeout: 20000 });
```

Die Regel für eine gute Prüfung: **sie prüft, was ein Mensch merken würde.**
Nicht, dass eine Funktion existiert — sondern dass die Zahl stimmt, der Wert
das Neuladen überlebt, der Knopf etwas tut.

Und der Name der Prüfung ist ein Satz, kein Stichwort:

```js
p('31. Januar plus ein Monat ist der 28. Februar', ...)   // ja
p('plusMonate', ...)                                       // nein
```
