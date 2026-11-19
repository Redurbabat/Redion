# Das `.redion`-Format

Was in einer Redion-Sicherung steht, wie sie aufgebaut ist und wie man sie
öffnet — auch in zehn Jahren, auch ohne Redion.

Das ist der Zweck dieses Dokuments. Ein Sicherungsformat ohne Beschreibung
ist genau so lange lesbar, wie die App existiert, die es geschrieben hat.

---

## Zwei Formate, und das ist Absicht

| Bestand | Datei | Warum |
|---|---|---|
| nur Text | `.json` | Lesbar, klein, in jedem Editor zu öffnen. |
| mit Anhängen | `.redion` | Ein ZIP. Blobs passen nicht in JSON. |

Redion wählt selbst: gibt es keine Anhänge, entsteht eine `.json`. Ein Archiv
um eine einzige JSON-Datei wäre eine Hürde ohne Gegenwert.

Erkannt wird beim Einlesen **am Inhalt, nicht an der Endung** — die ersten
zwei Bytes `PK` machen es zum ZIP. Eine umbenannte Datei ist deswegen nicht
kaputt, und eine `.json`, die in Wahrheit ein Archiv ist, wird trotzdem
gelesen.

---

## Aufbau eines `.redion`

Ein gewöhnliches ZIP, unkomprimiert (Methode 0), mit drei Teilen:

```txt
daten.json        die vollständige Sicherung
dateien.json      welcher Archivname zu welcher Datei-Kennung gehört
dateien/…         die Anhänge, unter ihren echten Namen
```

**Warum die Anhänge ihre echten Namen behalten.** Wer das Archiv in zehn
Jahren mit irgendeinem Packprogramm öffnet, findet darin seine Bilder und
Videos — jedes mit dem Namen, unter dem er es kennt. Das ist der eigentliche
Sinn einer Sicherung: sie muss die App überleben, die sie geschrieben hat.

---

## `daten.json`

```jsonc
{
  "version": 1,
  "exportiert": "2026-08-04T09:12:33.000Z",

  // Was wirklich drin ist — damit ein Einleser nachsehen kann, statt zu raten
  "enthaelt": ["blocks", "collections", "views", "meta", "versions",
               "dateien", "stuecke"],

  // Was fehlt. Leer heisst vollständig.
  "fehlt": [],

  // Ein Satz im Klartext für den Menschen, der die Datei ansieht
  "hinweis": "",

  "blocks":      [ /* … */ ],
  "collections": [ /* … */ ],
  "views":       [ /* … */ ],
  "meta":        [ { "k": "theme", "v": "dark" } ],
  "versions":    [ /* … */ ]
}
```

### `enthaelt`, `fehlt` und `hinweis` sind kein Beiwerk

Eine Sicherung, die nicht sagt, was sie auslässt, ist die gefährlichste
Sorte — man merkt es erst, wenn man sie braucht.

Eine `.json`-Sicherung eines Bestands **mit** Anhängen trägt deshalb:

```jsonc
"fehlt": ["dateien", "stuecke"],
"hinweis": "Diese Sicherung enthält 42 Datei(en) NICHT — nur ihre Blöcke.
            Anhänge liegen als Blob in der Ablage und passen nicht in eine
            JSON-Datei. Sie bleiben auf diesem Gerät."
```

Der Hinweis wird beim Einspielen angezeigt. Er ist keine Fussnote, sondern
die einzige Stelle, an der ein Nutzer erfährt, dass seine Bilder nicht in der
Datei sind, die er für seine Sicherung hält.

### Was NIE in einer offenen Sicherung steht (L76 / E279)

Eine `.json` und das `daten.json` im `.redion` liegen offen da: im
Downloads-Ordner, im Mail-Anhang, auf dem Stick. Zugangsdaten gehören da
nicht hinein.

```txt
wolkeToken     das Sitzungs-Token der Wolke — ein Schlüssel zum Konto
wolkeProbe     die Schlüsselprobe. Selbst Chiffre, aber ein Orakel: mit ihr
               lässt sich ein Passwort in Ruhe durchprobieren
api:*          jeder Schlüssel zu einem Fremddienst — GitHub, Jira, Webhook,
               und jede Anbindung, die es morgen gibt
```

Es ist bewusst ein PRÄFIX und keine Aufzählung: eine Aufzählung wäre bei
jeder neuen Verbindung eine Gelegenheit, durch Vergessen zu lecken.

Die **verschlüsselte** Sicherung nimmt sie mit. Ohne Passwort ist sie nichts
wert, und mit Passwort ist sie genau das, was man auf einem neuen Gerät
braucht. `exportAll(mitAnhaengen, mitGeheimnissen)` steuert das, und die
Vorgabe ist die sichere Seite: wer den Schalter vergisst, bekommt eine
Sicherung OHNE Zugangsdaten.

### Und was gar nicht mitreisen kann — auch verschlüsselt nicht

```txt
sicherungOrdner   ein Verzeichniszugriff gilt nur auf dem Gerät, auf dem er
                  erteilt wurde. Der NAME reist mit, der Zugriff nicht (E270)
wolkeGeteilt      welche Seiten geteilt sind. Das ist eine Erlaubnis auf dem
                  Server, keine Angabe in einer Datei (E279)
```

Beide stehen aus demselben Grund hier: **eine Sicherung kann keine Erlaubnis
mitbringen.** Beim Einspielen sticht deshalb immer, was auf diesem Gerät
erlaubt wurde — auch wenn das nichts ist. Verloren geht dabei nichts
Bleibendes: den Ordner wählt man einmal neu, die Freigaben stehen weiter auf
dem Server und `Wolke.freigaben()` holt sie.

Beides steht in `fehlt` und im `hinweis`, sobald es etwas auszulassen gibt.

### Was ein Einspielen mit „Ersetzen" NICHT ersetzt

Eine Sicherung ersetzt **Inhalte**, nicht die Kontoidentität dieses Geräts
(L76). Es bleiben: Anmeldung, Konto, Bereich, Salz, Schlüsselprobe, die
Anbindungen und die Freigabeliste. Danach stehen die Sync-Marken auf null,
die `basis` ist geleert — und Redion hält den Abgleich an und **fragt**,
statt eine Richtung zu wählen. Die ganze Begründung steht in
`ENTSCHEIDUNGEN.md` unter E279.

### Die Sätze

Blöcke, Zeilen, Sammlungen und Ansichten sind in
`src/core/types/` typisiert und dort im Einzelnen beschrieben. Kurz:

```txt
blocks       id · type · text · content[] · parentId · parentTable ·
             color · created · edited · erstelltVon · alive
collections  id · name · icon · schema · viewIds[] · created
views        id · collectionId · name · layout · filters · sorts ·
             groupBy · hidden[] · calc · created
meta         k · v
versions     id · pageId · zeit · anlass · titel · icon · daten[]
```

`parentTable` sagt, wo `parentId` nachzuschlagen ist: `'block'` für einen
gewöhnlichen Block, `'collection'` für eine Datenbankzeile. `alive: false`
heisst Papierkorb — gelöscht, aber wiederherstellbar.

---

## `dateien.json`

```jsonc
{
  "version": 1,
  "saetze": [
    { "id": "d7f3…", "name": "foto.jpg", "groesse": 2481003,
      "typ": "image/jpeg", "blockId": "b91…", "teile": 3,
      "angekommen": 3, "zustand": "fertig", "abgeleitet": false,
      "angelegt": "2026-07-01T…", "fertigAm": "2026-07-01T…" }
  ],
  "zuordnung": {
    "dateien/foto.jpg":   "d7f3…",
    "dateien/foto-2.jpg": "a11c…"
  }
}
```

**Warum es die Zuordnung gibt.** Zwei Bilder dürfen „foto.jpg" heissen. Im
Archiv darf ein Name nur einmal vorkommen — sonst überschreibt das Auspacken
das eine mit dem anderen, still, wie immer bei dieser Sorte Fehler. Das
zweite wird deshalb zu `foto-2.jpg`. Ohne diese Karte wüsste beim Einspielen
niemand mehr, welcher Block welches Bild meint.

Namensregel: `\ / : * ? " < > |` werden zu `-`; bei Kollision wird
`-2`, `-3`, … vor die Endung gesetzt.

---

## Was NICHT mitkommt: abgeleitete Dateien

Seit E103 (19. August 2026) trägt ein Datei-Satz das Feld `abgeleitet`.
Steht es auf `true`, heisst das: **diese Datei entsteht aus einer anderen
in Sekunden neu.** Der einzige Fall bisher sind die gerasterten
Seitenbilder eines PDFs.

Solche Dateien kommen **nicht** in die Sicherung — weder ihre Bytes noch
ihr Satz in `dateien.json`.

**Warum.** Ein Skript mit 500 Seiten sind rund hundert Megabyte
Seitenbilder. In jeder Sicherung, jedes Mal. Eine Sicherung, die man auf
dem Telefon nicht mehr herunterladen kann, ist keine Sicherung — und der
Inhalt wäre nichts, was verloren gehen könnte: das **Original-PDF** liegt
als gewöhnlicher Anhang mit im Archiv, Byte für Byte, und daraus entstehen
die Seiten wieder.

**Was mitkommt, ist das, worauf es ankommt:**

| | in der Sicherung |
|---|---|
| das Original-PDF | **ja** — unverändert, mit Prüfsumme nachgerechnet |
| die Marken auf den Seiten | **ja** — sie stehen am Block, nicht in einer Datei |
| Seitenzahl, Masse, Verweise | **ja** — ebenfalls am Block |
| die gerasterten Seitenbilder | nein — `abgeleitet: true` |

**Weggelassen wird beim Holen, nicht beim Packen.** `dateien.json`
entsteht aus derselben Liste wie das Archiv. Stünde ein Satz darin, dessen
Bytes fehlen, wäre das ein Anhang, den der Block sucht und nicht findet —
und man merkte es erst beim Einspielen. Lieber gar nicht erwähnt als
falsch versprochen.

**Und das Manifest sagt es.** `daten.json` nennt im Feld `hinweis` die Zahl
der Dateien, die wirklich im Archiv liegen, dazu wie viele Seitenbilder
bewusst fehlen und wie man sie zurückholt; `abgeleitetAusgelassen` trägt
dieselbe Zahl noch einmal als Zahl, für Maschinen. Bis E111 stand dort
„Vollständig: die 4 Datei(en) …" bei zwei Dateien im Archiv — der Zähler
kannte den Filter nicht.

**Beim Einspielen** stehen die Seiten deshalb zunächst leer da, mit einem
Knopf „Aus dem Original zurückholen" darauf. Ein Klick rechnet das ganze
Dokument neu; Nummer, Masse und Marken bleiben dabei unangetastet (E106).
Der Block trägt seine alte `bildDateiId` noch — sie zeigt ins Leere, bis der
Knopf gedrückt wurde.

**Für Fremdlesende:** wer ein `.redion` ohne Redion auspackt, findet das
PDF unter `dateien/` und die Anmerkungen im Block-Datensatz von
`daten.json` (Feld `marken`, Koordinaten in PDF-Punkten). Die Seitenbilder
fehlen dort — mit Absicht.

**Prüfsummen und Namen** (E363): der Schreiber trägt zu jedem Eintrag die
CRC-32 seiner Bytes ein und setzt das UTF-8-Bit (Bit 11) in beiden Köpfen;
der Leser rechnet die Prüfsumme nach dem Entpacken nach — scheibchenweise,
ohne den Eintrag in den Speicher zu holen — und lehnt einen beschädigten
Eintrag mit Grund ab, statt ihn als vollständige Datei durchzureichen.
Fremde Archive ohne UTF-8-Bit werden als CP437 gelesen, wenn ihre Namen
kein gültiges UTF-8 sind; verschlüsselte Einträge (Bit 0) kann Redion nicht
lesen und sagt es.

**Ein Bild auf dem Blatt** (E357) ist eine Marke der Art `bild` mit einer
`dateiId`; die Datei liegt wie jeder Anhang unter `dateien/`, ihr `blockId`
ist das Blatt oder die Seite, auf der sie liegt. Weil Kennungen beim
Einspielen erhalten bleiben (siehe unten), findet die Marke ihr Bild
wieder. In einer `.json`-Sicherung ohne Anhänge bleibt die Marke stehen,
und Redion zeigt an ihrer Stelle „Bild fehlt" — kein leerer Fleck, nichts
Gelöschtes.

Dieselbe Regel gilt für den Abgleich mit dem Server: Abgeleitetes wandert
nicht hinauf.

**Whiteboard-Formen** (E138, E686): ein `whiteboard`-Block trägt `shapes`
(eine Liste von Formen: `art` ∈ stift, linie, pfeil, rechteck, ellipse,
notiz, text, bild, verbindung; Stift mit `pts: [[x, y], …]`, Kästen mit
`x, y, w, h` — `w`/`h` dürfen negativ sein —, Bilder mit `dateiId`,
Verbindungen mit `von`/`nach` als Form-Kennungen), `sicht` (`x, y, z` —
Ausschnitt in Flächenpunkten und Massstab), `hoehe` (CSS-Pixel des
Kastens) und seit E686 `raumVersion`. Die Zahlen sind **Flächenpunkte**:
CSS-Pixel bei Massstab 1, Ursprung links oben der ungeschobenen Fläche —
keine PDF-Punkte wie beim Blatt. `raumVersion: 1` ist diese Deutung; ein
Block ohne das Feld ist Fassung 1. Wer die Deutung je ändert, hebt die
Zahl an und wandelt beim Lesen — nie stillschweigend.

**Die Ansicht einer Seite** (E690): ein Seitenblock darf `seitenAnsicht`
tragen — `'seite'`, `'flaeche'` oder `'redion'`. **Ein Block ohne das Feld
ist nicht kaputt, sondern von gestern**, und er bekommt die Redion-Ansicht:
Cover, Symbol, Titel, Werkzeugzeile, also genau das, was jede Seite vor E690
gezeigt hat. Eine ältere Fassung von Redion liest eine Sicherung mit dem
Feld ohne Schaden — sie kennt es nicht und zeigt die Seite wie immer.

Dazu kommt `flaecheNotiz` mit `{ x, y, w, raumVersion }`: wo der Kasten mit
dem Seitentext auf der Fläche liegt und wie breit er ist. Die Zahlen sind
**Flächenpunkte** wie beim Whiteboard — CSS-Pixel bei Massstab 1, Ursprung
links oben —, und `raumVersion: 1` ist diese Deutung; fehlt das Feld, gilt
Fassung 1. Fehlt `flaecheNotiz` ganz, rechnet Redion eine Vorgabe aus der
Fenstergrösse; gespeichert wird sie erst, wenn jemand den Kasten wirklich
verschiebt.

**Was NICHT in der Sicherung steht:** der Ausschnitt der Fläche (wohin man
gerade sieht und wie weit gezoomt ist). Er liegt in `meta` unter
`flaeche:<Seitenkennung>`, weil er zum Gerät gehört und nicht zum Dokument —
ein Blick am Telefon darf die Fläche am Rechner nicht verschieben. AFFiNE
legt ihn aus demselben Grund in den `localStorage`.

**Jeder Block darf auf der Fläche liegen** (E691). Zwei Felder, beide an
einem gewöhnlichen Block, beide optional:

```txt
flaecheOrt   { x, y, w, raumVersion }        wo er auf der Fläche liegt
sichtbarIn   'beides' | 'seite' | 'flaeche'  wo er erscheint
```

Die Zahlen sind **Flächenpunkte** wie beim Whiteboard (CSS-Pixel bei
Massstab 1, Ursprung links oben), `raumVersion: 1` ist diese Deutung. Und
wieder gilt: **kein Feld heisst „wie bisher"** — ohne `flaecheOrt` steht
der Block im Seitenkasten, ohne `sichtbarIn` steht er überall.

Drei Dinge, die eine ältere Fassung oder ein fremdes Werkzeug wissen sollte:

- **Ein Block mit `sichtbarIn: 'flaeche'` ist NICHT gelöscht.** Er steht in
  `content` seines Elternteils, ist `alive`, hat seinen Text und reist
  vollständig mit. Nur gezeichnet wird er in der Textansicht nicht. Wer
  `sichtbarIn` nicht kennt, zeigt ihn — das ist der richtige Rückfall.
- **Ein unlesbarer `flaecheOrt` zählt als kein Ort.** Redion lässt den
  Block dann im Text stehen, statt ihn still in den Ursprung zu setzen
  (§9). Eine Sicherung mit kaputten Zahlen verliert also keinen Inhalt.
- **Die Reihenfolge in `content` ändert sich beim Aus- und Einblenden
  nicht.** Das ist die bewusste Abweichung von AFFiNE, das den Block dabei
  verschiebt — wer eine Sicherung vergleicht, sieht bei einem reinen
  Sichtbarkeitswechsel genau ein geändertes Feld.

**Und auf der Fläche einer Seite darf gezeichnet werden** (E693). Ein
Seitenblock trägt dann `shapes` und `raumVersion` — **dieselben Felder mit
derselben Bedeutung wie ein `whiteboard`-Block** (oben). Das ist kein
zweites Format und keine Ähnlichkeit, sondern dieselbe Liste, gelesen und
gezeichnet von derselben Stelle (`GfxShapes` in `src/core/gfx/shapes.ts`).
Auf der Seitenfläche entstehen heute fünf der Arten — `stift`, `linie`,
`pfeil`, `rechteck`, `ellipse` —; die übrigen (`notiz`, `text`, `bild`,
`verbindung`) liest sie, weil das Whiteboard sie schreibt.

Zwei Dinge dazu:

- **Ein Seitenblock ohne `shapes` hat keine Zeichnung**, nicht eine leere.
  Das Feld wird gelöscht, wenn die letzte Form verschwindet, statt als `[]`
  stehen zu bleiben — eine Sicherung soll nicht behaupten, hier sei etwas
  gewesen.
- **`raumVersion` gilt für beides**: für `flaecheNotiz`/`flaecheOrt` und für
  die Formen. Die Zahlen liegen im selben Flächenraum, also gibt es auch nur
  eine Deutung je Block.

---

## Einspielen

Redion fragt **immer**, was geschehen soll. Es gibt keine Vorgabe.

| Wahl | Was passiert |
|---|---|
| **Ersetzen** | Der Bestand sieht danach aus wie die Sicherung. Was nicht darin steht, wird gelöscht. |
| **Dazulegen** | Nichts wird gelöscht. Bei gleicher Kennung gewinnt die Sicherung. |
| **Abbrechen** | Nichts geschieht. |

`importAll` lehnt jeden anderen Wert ab, auch einen leeren. Das ist die Regel
*nichts löschen ohne Rückfrage* an der Stelle, an der sie am meisten zählt:
eine Vorgabe würde irgendwann durchrutschen, und beim Einspielen einer
Sicherung ist „irgendwann" einmal zu viel.

**Reihenfolge:** erst die Blöcke, dann die Anhänge. Andersherum stünden die
Dateien schon in der Ablage und würden beim „Ersetzen" gleich wieder mit
gelöscht.

**Beim Ersetzen** werden Anhänge entfernt, die nicht in der Sicherung stehen —
samt ihren Stücken. Beim Dazulegen wird nichts entfernt.

---

## Grenzen

Redion schreibt ein gewöhnliches ZIP und wechselt auf **ZIP64**, sobald eine
der drei Grenzen des alten Formats nicht mehr reicht:

| Grenze | Wert | Feld |
|---|--:|---|
| eine einzelne Datei | 4 GB | 32 Bit |
| das ganze Archiv | 4 GB | 32 Bit |
| Anzahl der Einträge | 65 535 | **16 Bit** |

**Nur wenn nötig.** Ein Archiv unterhalb aller drei Grenzen wird geschrieben
wie eh und je — Fassung 20, kein Zusatzfeld, kein zusätzlicher Schlusssatz.
Das ist keine Sparsamkeit, sondern Rücksicht: ein Archiv, das ohne Not ZIP64
wird, sperrt ältere Werkzeuge und ältere Redion-Fassungen aus. Pythons
`zipfile` hält es genauso.

### Was ZIP64 anders macht

An den Stellen, die überlaufen, steht der Platzhalter `0xFFFFFFFF` (oder
`0xFFFF` bei der Anzahl), und die echte Zahl liegt in 64 Bit daneben:

```txt
lokaler Kopf         Zusatzfeld 0x0001 mit roher und gepackter Grösse
Verzeichniseintrag   Zusatzfeld 0x0001, aber NUR mit den Zahlen, deren
                     32-Bit-Feld den Platzhalter trägt — in fester
                     Reihenfolge: roh, gepackt, Versatz
am Ende              ZIP64-Schlusssatz (0x06064b50, 56 Byte)
                     + Wegweiser darauf (0x07064b50, 20 Byte)
                     + der alte Schlusssatz mit Platzhaltern
```

Die Reihenfolge am Ende ist nicht frei: jeder Leser sucht zuerst den alten
Schlusssatz am Dateiende und findet den Wegweiser genau 20 Byte davor.

Und die Bedingtheit im Verzeichnis ist die Stelle, an der man sich vertut.
Wer vorsorglich alle drei Zahlen mitschreibt, obwohl daneben schon die echte
steht, verschiebt alle folgenden — und der Leser bekommt Werte, die *fast*
stimmen. `unzip` bemerkt das nicht einmal; `test103` schon.

### Fremde ZIP64-Archive

Werden gelesen. Auch die Sorte, die nur den lokalen Kopf auf ZIP64 setzt und
Verzeichnis und Schlusssatz gewöhnlich lässt — Pythons `zipfile` schreibt
genau das bei einer einzelnen grossen Datei.

Erkannt wird ZIP64 am Wegweiser `0x07064b50` direkt vor dem Schlusssatz —
nicht an den Platzhaltern. Ein gewöhnliches Archiv mit genau 65 535 Einträgen
schreibt nämlich denselben Platzhalter, ohne ZIP64 zu sein, und darf nicht
fälschlich als ZIP64 gelesen werden.

### Was weiterhin abgelehnt wird

Ein Archiv, das sich ZIP64 nennt, dessen ZIP64-Schlusssatz aber fehlt oder
beschädigt ist. Das ist wichtig genug für einen eigenen Absatz, weil es die
gefährlichste Sorte Fehler ist: im alten Schlusssatz stehen dann nur
Platzhalter, `blob.slice(0xFFFFFFFF, …)` gibt einen leeren Ausschnitt, und
heraus kämen **null Dateien und kein Fehler**. Wer eine Sicherung mit 70 000
Anhängen einspielte, sähe „0 Anhänge" und hätte keinen Grund zu zweifeln.

Dieselbe Falle kam beim Umbau auf ZIP64 beinahe zurück: der erste Entwurf
nahm bei unlesbarem ZIP64-Satz „ersatzweise" die Zahlen aus dem alten
Schlusssatz — also die Platzhalter. Gefunden hat das der Prüflauf, der noch
aus der Zeit der Ablehnung stammte.

Dazu die allgemeine Fassung derselben Regel: ein Archiv, das `N` Einträge
ankündigt und keinen einzigen liefert, wird abgelehnt statt als leer
durchgereicht.

### Wie das geprüft wird

Vier Gigabyte schreibt kein Prüflauf. `Austausch.grenzen` senkt deshalb die
Schwelle, sodass dieselbe Verzweigung schon bei vierzig Byte greift; heraus
kommt ein vollwertiges ZIP64, nur klein. Dass es wirklich eines ist,
bestätigen **`unzip` und `zipinfo`** — fremde Werkzeuge, die Redion nicht
kennen und keinen Grund haben, denselben Fehler zu machen. „Redion liest,
was Redion schrieb" wäre kein Beweis: zwei Fehler, die sich gegenseitig
aufheben, bestünden das mühelos.

Die Anzahl-Grenze braucht keine Absenkung — 70 000 winzige Einträge sind
sieben Megabyte, und `test103` schreibt sie wirklich.

## Ein `.redion` ohne Redion öffnen

1. In `.zip` umbenennen (oder direkt mit einem Packprogramm öffnen).
2. `dateien/` enthält alle Anhänge unter ihren echten Namen — fertig, dafür
   braucht es nichts weiter.
3. `daten.json` ist gewöhnliches JSON. Text steht in `blocks[].text`, die
   Verschachtelung in `blocks[].content` als Liste von Kennungen.

Schritt 2 ist der wichtige. Wer nur an seine Bilder will, ist nach dem
Auspacken fertig.

---

## Die verschlüsselte Sicherung

Es gibt einen zweiten Weg, in `quell/kern/sicherheit/krypto.js`: die
**verschlüsselte Sicherung** (`…​.verschluesselt.json`, AES-GCM 256, Schlüssel
über PBKDF2-SHA256 mit 310 000 Runden und zufälligem Salz). Erreichbar über
den Sicherheitsdialog.

Sie schreibt **denselben Inhalt** wie eine `.json` — `bestandSammeln()` ruft
`Store.exportAll()` auf, es gibt nur eine Quelle. Zusätzlich stehen `art` und
`fassung` darin, damit Dateien aus älteren Fassungen weiter gelesen werden.

```jsonc
{
  "art": "redion-verschluesselt",
  "fassung": 1,
  "runden": 310000,
  "salz": "…base64…",
  "iv": "…base64…",
  "inhalt": "…base64…"     // die verschlüsselte daten.json
}
```

**Ohne das Passwort gibt es keine Wiederherstellung.** Es wird nirgends
gespeichert und nirgends hingeschickt. Das ist der Zweck und nicht ein
Versehen — aber es heisst, dass ein vergessenes Passwort dasselbe bedeutet
wie eine gelöschte Datei.

**Was sie nicht kann:** Anhänge. Sie ist eine JSON-Datei, und Blobs passen
dort nicht hinein. Neu ist, dass sie es selbst sagt — über `fehlt` und
`hinweis`, dieselben Felder wie oben. Ein verschlüsseltes `.redion` ist noch
nicht entschieden.

### Was hier vier Mal schiefging

Der Vollständigkeit halber, weil es zeigt, wonach man bei Sicherungen sucht:

1. Sie schrieb ein **eigenes, ärmeres Format** — ohne Verlauf, ohne Anhänge
   und ohne `fehlt`/`hinweis`, die genau dafür da sind.
2. Der Wiederherstellen-Dialog sagte „ersetzt", der Code führte über
   `Object.assign` **zusammen**.
3. Das Eingespielte ging **nur in den Zwischenspeicher**. Der Aufruf, der es
   hätte schreiben sollen, zeigte auf eine Funktion, die es nicht gibt —
   abgesichert und deshalb stumm. 900 ms später lud die Seite neu und las den
   alten Bestand. Gemeldet wurde ein Erfolg.
4. Verschlüsseln **scheiterte ab etwa 128 KB**, weil
   `btoa(String.fromCharCode(...bytes))` den Aufrufstapel sprengt — also
   genau dann, wenn der Bestand gross genug ist, dass sich das Sichern lohnt.

Alle vier behoben, gehalten von `pruefungen/lauf/test104.mjs`. Base64 gibt es
seither nur einmal, in `src/core/helpers/bytes.ts`; `test87` verbietet eine
zweite Fassung.

---

## Was noch fehlt

- Ein **Formatkennzeichen** in `daten.json`, das die Datei als Redion-Sicherung
  ausweist. Heute wird sie am Vorhandensein von `daten.json` im Archiv
  erkannt — das genügt in der Praxis, ist aber schwächer als ein eigenes Feld.
- Eine **Prüfsumme** über `daten.json`. Das ZIP prüft jeden Eintrag einzeln
  per CRC32; über den Inhalt der Sicherung als Ganzes gibt es nichts.
- Ein **verschlüsseltes `.redion`**. Heute deckt die verschlüsselte Sicherung
  nur den Textbestand ab — siehe oben.
- **ZIP64**, falls jemand mehr als 65 535 Anhänge oder mehr als 4 GB sichern
  will. Bis dahin gilt: eine ehrliche Meldung statt eines kaputten Archivs.

---

## Schaltplan-Blöcke: `block.plan` (E762)

Ein Schaltplan ist ein gewöhnlicher Block (`type: 'schaltplan'`) und reist in
`daten.json` mit; sein Inhalt steht in `block.plan`:
`{ art, breite, hoehe, teile[], leitungen[], texte[], ebenen[] }`. Eine
Leitung ist `{ id, punkte: [{x, y}, …], ebene, vonTeil?, vonNr?, nachTeil?,
nachNr? }`.

**Seit E762 kann eine Leitung zusätzlich `schiene` tragen** — `'L1'`,
`'L2'`, `'L3'`, `'N'` oder `'PE'` —, wenn sie mit dem Werkzeug „Schiene"
selbst gezeichnet wurde. Das Feld ist optional und fehlt bei jeder anderen
Leitung und in jedem Plan von vor E762; `Schaltplan.lesen` behält es nur
mit einem dieser fünf Werte und setzt es nie leer. Die Netzliste liest es
nicht (eine Schiene ist eine Leitung wie jede andere), nur das Bild zeichnet
sie kräftiger. Eine ältere Fassung von Redion, die das Feld nicht kennt,
lässt es beim nächsten Speichern des Plans fallen — die Leitung und ihre
Beschriftung (ein gewöhnlicher Text) bleiben.

Zoom, Lage, Vollbild und die Wahl des Radierers stehen NICHT im Plan: die
Ansicht gehört dem Bildschirm, der Radierer dem Menschen (`Store.meta`,
`elektro:radierer`).

**Seit E790: optionale Freihand im Schaltplan.** `plan.ink` enthält
Striche `{ id, art: 'stift', pts: [[x,y], …], farbe, breite, ebene,
pressure?, neigung? }`. Punkte und Breite liegen in Planeinheiten,
unabhängig von Zoom und Windows-Skalierung. Die beiden optionalen
Sensorkanäle haben dieselbe Länge wie die Punktfolge.
Neigung verwendet den gemeinsamen PDF-Kanal: Winkel gegen die Senkrechte
geteilt durch 90, `-1` für eine nicht gemeldete Probe. Vorschau und
Vorhersagen werden nicht gespeichert. Freihand verändert keine Netzliste.
SVG, Druck und Sicherung nehmen sichtbare Freihand mit; Sicherungen
enthalten zusätzlich die ausgeblendeten Ebenen vollständig.

Ein alter Plan erhält beim Öffnen kein leeres Freihandfeld. Ältere
Redion-Versionen vor E790 können das neue Feld beim Bearbeiten verwerfen.
Pläne mit Freihand deshalb mit dieser oder einer neueren Fassung
bearbeiten und vor einem Rückwechsel eine `.redion`-Sicherung behalten.

