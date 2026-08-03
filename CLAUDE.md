# CLAUDE.md — die Regeln für die Arbeit an Redion

Diese Datei liest Claude Code bei jedem Start. Sie ist kein Handbuch,
sondern eine Arbeitsanweisung: sie sagt, **was zu tun ist, was nicht, und
woran man merkt, dass etwas fertig ist.**

---

## Was Redion ist

Eine Notiz- und Datenbank-App im Stil von Notion. Der Unterschied ist kein
Merkmal, sondern der Ausgangspunkt: **die Daten gehören dem Gerät.** Kein
Konto nötig, kein Server nötig, keine Abo-Gebühr. Die App läuft per
Doppelklick auf `index.html`, auch ohne Netz.

Ein Server ist möglich (Cloudflare Workers + D1, kostenlos) und bringt
Abgleich zwischen Geräten, echte Rechte und weitergebbare Seiten. Er ist
freiwillig und bleibt es.

Sprache: **alles auf Deutsch** — Ordner, Dateinamen, Variablen, Funktionen,
Kommentare, Commit-Texte, Oberfläche. Ausnahmen sind nur, was nicht uns
gehört: `package.json`, `index.html`, Web-APIs.

---

## Vor der ersten Änderung lesen

| Datei | Wofür |
|---|---|
| `doku/ARCHITEKTUR.md` | wo liegt was, wer darf wen rufen, wo trage ich Neues ein |
| `AUFGABEN.md` | was offen ist, in der Reihenfolge, in der es Sinn ergibt |
| `doku/WAS-REDION-MEHR-KANN.md` | was gebaut ist und warum — 30 Abschnitte |
| `doku/NOTION-10000X-BESSER.md` | die 21 Lücken und 36 Ideen, gegen die gebaut wird |

Die vollständige Recherche zu Notion liegt beim Nutzer unter
`Desktop\Notion-Doku\Redion-Recherche`. Wenn eine Frage lautet „wie macht
Notion das?", steht die Antwort dort — geprüft und mit Quellen, nicht
geraten.

---

## Der Aufbau

```
index.html            was der Browser lädt — die Skriptliste ist die Ladefolge
quell/
  start.js            der einzige Einstiegspunkt. Sonst startet sich nichts selbst.
  kern/               kennt keinen Bereich
    ablage/           IndexedDB, Formen, Umzüge, interne Befehle
    zustand/          Rückgängig und Wiederholen
    ereignisse/       Bus, Arten, Protokoll
    abgleich/         Maschine, Zusammenführen
    zugang/           Sitzung, Rechte, Rollen
    sicherheit/       Krypto, Säubern, Prüfen
    helfer/           Kennungen, Datum, Objekte, Bremse, Melder, Tempo
    einstellung/      Konstanten, Schalter, App
  register/           die elf Kataloge
  schale/             aufbau/ · ueberlagerung/ · stil/
  bereiche/           editor, datenbanken, wissen, ki, verbinden, dateien,
                      vorlagen, kommentare, erwaehnungen, seiten, planen,
                      bloecke, einstellungen, hilfe
oeffentlich/          Icons, Manifest, Favicon
server/               der freiwillige Server
doku/                 wie es innen aussieht
```

### Die drei Regeln

1. **Ein Bereich benutzt nur `kern/` und `register/`** — nie einen anderen
   Bereich. Braucht er etwas von drüben: Ereignisbus, oder das Gemeinsame
   wandert nach `kern/`.
2. **Ein neuer Bereich = zwei Einträge:** `register/module.js` und
   `register/navigation.js`. Sonst nichts.
3. **Neue Blockart, Ansicht, Eigenschaft, Befehl, Kürzel, Einstellung =
   ein Objekt in der passenden `register/`-Datei.** Die Oberfläche zeichnet
   sich daraus.

---

## Kein Bauschritt — und warum das bleibt

Die Dateien werden als gewöhnliche `<script src>` geladen, nicht als
ES-Module. Das ist eine Entscheidung:

- Die App läuft **direkt von der Festplatte**. ES-Module tun das nicht;
  `file://` verweigert sie.
- Es gibt **keine Werkzeugkette**, die veralten kann.
- `node bauen.js` fasst alles zu `redion-einzeldatei.html` zusammen — eine
  Bequemlichkeit, keine Voraussetzung.

**Nicht einführen:** Vite, Webpack, Rollup, TypeScript-Übersetzung, React,
Vue, npm-Abhängigkeiten im Browsercode. Wer eine Bibliothek braucht, prüft
zuerst, ob dreissig Zeilen eigener Code reichen — bisher haben sie das immer.

Folge: jedes Modul ist ein globaler Name, und **die Reihenfolge in
`index.html` zählt**. Eine neue Datei muss dort eingetragen werden, und
zwar an der richtigen Stelle: `kern` vor `register` vor `schale` vor
`bereiche`.

Nach jeder neuen Datei ausserdem `sw.js` nachziehen — dort steht dieselbe
Liste, damit die App offline vollständig ist.

---

## Wie geprüft wird

Die Prüfläufe liegen **im Repository**, unter `pruefungen/` und `server/`.
Sie laufen über echtes Chromium gegen die echte App — keine Attrappen, keine
Mocks. Stand: sieben Läufe, 342 Prüfungen. Sie laufen ausserdem bei jedem
Push von selbst über `.github/workflows/pruefen.yml`.

```
npm run pruefen              # alles, mit Pause zwischen den Browserläufen
npm run pruefen seiten       # nur die Läufe, deren Name das enthält
node pruefungen/seitenleiste.mjs   # ein einzelner Lauf
node bauen.js                # die Einzeldatei neu bauen
```

Es stand hier einmal „53 Prüfläufe unter `/tmp/test*.mjs`". Die liegen auf
genau einem Rechner, in einem Ordner, den das System leeren darf — wer das
Repository frisch auscheckt, hat sie nicht. Ein Prüfnetz, das nur an einem Ort
hängt, ist beim ersten Umzug keines mehr. Wer die 53 noch hat: sie gehören
nach `pruefungen/`.

**Die Regel:** nach jeder Änderung laufen mindestens die betroffenen Läufe,
vor jedem Commit ein breiter Querschnitt. Ein grüner Lauf ist die einzige
Aussage darüber, dass etwas fertig ist — nicht das Gefühl, fertig zu sein.

Zwei Eigenheiten, die Zeit sparen:

- Zwischen zwei Playwright-Läufen **drei Sekunden Pause**, sonst werden sie
  flockig (Ports, IndexedDB-Sperren).
- `App`, `Store`, `Datenbank`, `UI`, `Blocks` stehen **nicht** auf `window`.
  In `page.evaluate` also `typeof App !== 'undefined'` prüfen, nicht
  `window.App`. Im Modulcode `typeof X !== 'undefined'` statt `self.X`.

Zu jeder neuen Funktion gehört ein neuer Prüflauf. Er prüft, was ein Mensch
merken würde — nicht, dass eine Funktion existiert.

---

## Wie hier geschrieben wird

Der Code ist der Ort, an dem Entscheidungen begründet werden. Jede Datei hat
einen Kopfkommentar, der drei Dinge sagt: **was sie tut, warum es sie gibt,
und was daran leicht schiefgeht.**

Nicht so:

```js
/* Setzt den Wert */
const setze = (k, v) => { ... }
```

Sondern so:

```js
/* Ein falscher Wert wird abgelehnt statt gespeichert. Sonst steht später
   etwas im Bestand, das keine Oberfläche mehr anzeigen kann. */
```

Weitere Regeln:

- **Deutsche Namen**, auch für Variablen. `zeilenGesamt`, nicht `rowCount`.
- **Fehlermeldungen sind Sätze**, keine Zustände. „Da fehlt das @" statt
  „ungültig". Wer eine Meldung liest, soll wissen, was zu tun ist.
- **Keine stillen Fehlschläge.** Was nicht geht, sagt warum. Ein Knopf, der
  nichts tut, ist schlimmer als ein Knopf, der sich erklärt.
- **Nichts wegwerfen, was nach Inhalt aussieht.** Reparieren heisst
  auffüllen, nicht überschreiben.
- Schweizer Schreibweise: **ss statt ß**.

---

## Was nie geschieht

- **Keine Daten wegwerfen.** Kein Löschen ohne Rückfrage, kein
  Überschreiben ohne Vergleich, kein „das war bestimmt Müll".
- **Keine Schlüssel im Code.** Der KI-Schlüssel wird vom Menschen in einem
  Feld eingetragen, liegt im Browser und geht nur zum jeweiligen Anbieter.
  Ein Schlüssel im Repository wäre für alle derselbe.
- **Kein Verschlüsselungssatz irgendwo ausser auf dem Gerät.** Steht er auf
  dem Server, ist die Verschlüsselung eine Behauptung.
- **Keine fremden Projekte hereinkopieren.** Verweise auf fremde
  Repositories gehören nicht in dieses.
- **Nichts hochladen ohne den Menschen.** Commits ja, `git push` macht der
  Nutzer über seine `.bat`-Skripte.

---

## Umbauen

**Ein Umzug, der Verhalten ändert, ist kein Umzug, sondern zwei Änderungen
gleichzeitig.** Erst verschieben und grün werden, dann ändern. Wer beides in
einem Schritt tut und danach etwas kaputt findet, weiss nicht, welcher der
beiden Schritte es war.

Beim Herauslösen aus grossen Dateien:

1. Erst den Block finden und prüfen, was er von aussen braucht.
2. Herauslösen, Namen unverändert lassen, alte Aufrufstellen weiterreichen
   (wie `UI` → `Menue`/`Hinweis`/`Dialog`).
3. `index.html` und `sw.js` nachziehen.
4. Prüfläufe. Erst dann der nächste Block.

---

## Commit-Texte

Deutsch, erste Zeile eine Aussage, danach **warum** — nicht was. Das „was"
steht im Diff.

```
Vorberechnete Werte - und ein Zeitstempel, der nie gesetzt wurde

Der Unterschied zum Formelspeicher ist der Punkt der Sache:
[...]

DABEI EIN FEHLER, der viel weiter reichte: updateCollection hat nie einen
Zeitstempel gesetzt. Fuer den Abgleich hiess das, eine Schemaaenderung sei
nie geschehen [...]
```

Gefundene Fehler gehören in den Commit-Text, auch wenn sie mit dem Thema
nichts zu tun haben. Sie sind das Wertvollste an der Arbeit.

---

## Wenn etwas unklar ist

Nicht fragen — die beste, professionellste Lösung wählen und weiterarbeiten.
Die Entscheidung im Kommentar begründen. Wenn es wirklich zwei gleich gute
Wege gibt, beide im Commit-Text nennen und sagen, warum es dieser wurde.

Was **nicht** geht: eine Aufgabe halb erledigen und als fertig melden. Lieber
weniger anfangen und das grün abschliessen.
