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
      "angekommen": 3, "zustand": "fertig",
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

Redion schreibt ein ZIP **ohne ZIP64**. Das hat drei Grenzen, und alle drei
stehen im Format, nicht in der Laune des Packers:

| Grenze | Wert | Feld |
|---|--:|---|
| eine einzelne Datei | 4 GB | 32 Bit |
| das ganze Archiv | 4 GB | 32 Bit |
| Anzahl der Einträge | 65 535 | **16 Bit** |

Alle drei melden sich mit einer verständlichen Meldung, **bevor** etwas
geschrieben wird. Keine schreibt ein Archiv, dem man nicht ansieht, dass es
unvollständig ist.

Die dritte Grenze war lange ungeprüft und ist deshalb erwähnenswert: sie
scheiterte still. `65 536` Einträge wurden im Schlusssatz des Archivs zu `0`,
`70 000` zu `4 464` — das Archiv liess sich öffnen, sah gesund aus und zeigte
einen Bruchteil seines Inhalts. Gehalten wird das jetzt von
`pruefungen/lauf/test103.mjs`.

### Fremde ZIP64-Archive

Beim **Lesen** gilt dasselbe von der anderen Seite. Ein Werkzeug, das mehr
als 65 535 Einträge packt, schreibt ZIP64 — im alten Schlusssatz stehen dann
nur Platzhalter, die echten Zahlen liegen in einem eigenen Satz davor.

Redions Leser kennen diesen Satz nicht und sagen das auch:

> Dieses Archiv ist im ZIP64-Format — es hat mehr als 65 535 Einträge oder
> ist grösser als 4 GB. Redion kann es nicht lesen und gibt lieber diese
> Meldung, als einen Teil einzuspielen und den Rest zu verschweigen.

Ungeprüft war das der schlimmste denkbare Fall: der Leser fand null Dateien
und meldete **keinen Fehler**. Wer eine fremde Sicherung mit 70 000 Anhängen
einspielte, sah „0 Anhänge" und hatte keinen Grund zu zweifeln.

Erkannt wird ZIP64 am Wegweiser `0x07064b50` direkt vor dem Schlusssatz —
nicht an den Platzhaltern. Ein gewöhnliches Archiv mit genau 65 535 Einträgen
schreibt nämlich denselben Platzhalter, ohne ZIP64 zu sein, und darf nicht
fälschlich abgelehnt werden.

### Wird ZIP64 eingebaut?

Noch nicht entschieden — siehe `LUECKEN.md` L4. Die heutige Regel ist:
**lieber eine ehrliche Fehlermeldung als ein kaputtes Archiv.** Solange das
gilt, verliert niemand unbemerkt Daten; es gibt nur etwas, das Redion nicht
kann, und das sagt es.

---

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
