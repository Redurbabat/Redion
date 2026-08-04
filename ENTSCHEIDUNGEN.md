# ENTSCHEIDUNGEN.md

Diese Datei hält die wichtigsten Entscheidungen für Redion fest.

Sie erklärt nicht nur **was** gebaut wird, sondern vor allem **warum** es so
gebaut wird.

Redion ist eine local-first Notiz-, Datenbank- und Wissens-App im Stil von
Notion. Die wichtigsten Ziele sind:

- Daten gehören dem Nutzer
- lokale Nutzung ohne Konto
- Offline-Nutzung
- vollständige Sicherung
- optionale Cloudflare-Erweiterung
- später vollständige TypeScript-Migration
- keine Datenverluste
- keine unnötigen Abhängigkeiten

---

## Grundregel

Wenn eine Entscheidung Auswirkungen auf Daten, Speicher, Import, Export, Sync,
Sicherheit, Cloud, TypeScript oder Architektur hat, muss sie hier eingetragen
werden.

Jede Entscheidung braucht:

```txt
Problem
Entscheidung
Warum
Folgen
Nicht tun
Status
```

**Wo was steht**

| Datei | Frage |
|---|---|
| `ENTSCHEIDUNGEN.md` | Warum wurde etwas so entschieden? |
| `AUFGABEN.md` | Was wird als Nächstes gebaut? |
| `LUECKEN.md` | Was fehlt noch im Produkt? |

---

## E1 · Redion bleibt local-first

**Problem**

Viele Notion-ähnliche Apps funktionieren nur mit Konto, Server oder Cloud.
Redion soll aber auch funktionieren, wenn kein Server existiert.

**Entscheidung**

Redion bleibt local-first. Die App muss nutzbar bleiben über:

```txt
index.html
redion-einzeldatei.html
lokalen Browser-Speicher
IndexedDB
```

Ein Konto und ein Server sind Erweiterungen, keine Pflicht.

**Warum**

Nutzer sollen ihre Daten behalten können, auch wenn:

- kein Internet da ist
- ein Server ausfällt
- ein Cloud-Konto gelöscht wird
- Cloudflare nicht erreichbar ist
- Redion nur lokal archiviert wird

**Folgen**

Erlaubt: lokaler Start · lokale IndexedDB · `.json`-Sicherung ·
`.redion`-Sicherung · optionale Cloud

**Nicht tun**

Pflichtkonto · Pflichtserver · Cloud-Zwang · stille Uploads privater Daten

**Status**

Entschieden. Dauerhafte Grundregel.

---

## E2 · Redion bekommt optionale Cloudflare-Erweiterung

**Problem**

Nur lokal ist sicher, aber viele Nutzer wollen mehrere Geräte, Login, Sync und
Freigaben.

**Entscheidung**

Redion darf optional Cloudflare nutzen:

```txt
Cloudflare Pages    App ausliefern
Cloudflare Workers  API, Auth, Sync, Rechte
Cloudflare D1       Konten, Sitzungen, Metadaten, Sync-Datensätze
Cloudflare R2       Dateien, Anhänge, Backups, .redion-Pakete
```

**Warum**

Cloudflare ist günstig, skalierbar und passt gut zu einer Web-App.

**Folgen**

Cloud-Modus darf ermöglichen: Konto · Login · Sync · Rechte · öffentliche
Seiten · Backup in R2 · Download als Offline-Datei

**Nicht tun**

- lokale Nutzung ersetzen
- private Daten ungefragt hochladen
- große Dateien in D1 speichern
- Rechte nur in der Oberfläche prüfen

**Status**

Entschieden. Umsetzung schrittweise.

---

## E3 · Große Dateien gehören nicht in JSON

**Problem**

Anhänge wie Bilder, PDFs oder Videos können sehr groß sein. JSON ist dafür
ungeeignet:

- `JSON.stringify()` sichert Blobs nicht korrekt
- Base64 macht Dateien größer
- große Dateien können Browser oder Handy zum Absturz bringen
- Backup darf nicht mitten im Vorgang kaputtgehen

**Entscheidung**

Es gibt zwei Sicherungsformate:

```txt
.json    für reine Daten ohne große Anhänge
.redion  für vollständige Sicherung mit Anhängen
```

**Warum**

Textdaten sollen einfach lesbar bleiben. Anhänge brauchen aber ein echtes
Paketformat.

**Folgen**

`.json` enthält: Seiten · Blöcke · Datenbanken · Ansichten · Einstellungen ·
Versionen · Hinweise auf fehlende Anhänge

`.redion` enthält:

```txt
daten.json
dateien.json
dateien/
```

**Nicht tun**

- große Anhänge als Base64 in JSON speichern
- Blobs still als `{}` exportieren
- beim Export so tun, als wären Anhänge gesichert, wenn sie fehlen

**Status**

Entschieden und begonnen.

---

## E4 · `.redion` ist ein ZIP-artiges Sicherungspaket

**Problem**

Redion braucht ein Format, das auch große Anhänge vollständig speichern kann.

**Entscheidung**

`.redion` ist ein ZIP-artiges Paket:

```txt
arbeitsbereich.redion
├─ daten.json
├─ dateien.json
└─ dateien/
   ├─ bild.jpg
   ├─ dokument.pdf
   └─ video.mp4
```

**Warum**

Ein ZIP-artiges Format ist langfristig verständlich. Nutzer können es später
auch ohne Redion öffnen.

**Folgen**

- echte Dateinamen erhalten
- gleiche Dateinamen durchnummerieren
- Datei-IDs beim Import erhalten
- Anhänge stückweise lesen und schreiben
- Prüfsummen stückweise berechnen
- nicht alles vollständig in den RAM laden

**4-GB-Grenze**

Wenn eine Datei oder ein Archiv größer ist als das aktuelle Format
unterstützt, muss Redion abbrechen mit klarer Meldung.

**Nicht tun**

- kaputtes Archiv erzeugen
- Fehler verschweigen
- teilweise Sicherung als erfolgreich anzeigen

**Status**

Entschieden und teilweise umgesetzt.

---

## E5 · Import darf Anhänge nicht falsch löschen

**Problem**

Beim Import gibt es zwei Fälle:

```txt
.json    kennt Anhänge nicht vollständig
.redion  kennt Anhänge vollständig
```

Wenn beide gleich behandelt werden, kann Redion Daten löschen, die gar nicht
Teil der Sicherung waren.

**Entscheidung**

Beim Ersetzen gilt:

```txt
.json:
  darf vorhandene Anhänge nicht löschen

.redion:
  darf fremde/veraltete Anhänge entfernen, weil das Format Anhänge
  vollständig abdeckt
```

**Warum**

Eine JSON-Sicherung, die selbst sagt, dass Anhänge fehlen, darf nicht
entscheiden, dass vorhandene Anhänge weg sollen.

**Folgen**

Import muss unterscheiden: Daten ersetzen · Daten dazulegen · Anhänge
erhalten · Anhänge ersetzen · nicht referenzierte Anhänge bereinigen

**Status**

Entschieden.

---

## E6 · Redion wird vollständig TypeScript

**Problem**

Redion ist aktuell größtenteils JavaScript. Für ein großes Notion-ähnliches
Projekt wird das langfristig schwer wartbar.

**Entscheidung**

Redion soll vollständig auf TypeScript migriert werden. Aber:

```txt
schrittweise
sicher
testbar
ohne Datenverlust
ohne kaputtes Backup
ohne kaputte Offline-Nutzung
```

**Warum**

TypeScript hilft bei: Datenmodellen · Blocktypen · Datenbank-Schema ·
Backup-Format · Datei-Metadaten · Sync · Rechte · Cloudflare · Tests ·
langfristiger Wartung

**Folgen**

Neue Kernlogik soll bevorzugt TypeScript sein. Neue Typen gehören nach
`src/core/types/`. Geplante Struktur:

```txt
src/
├─ main.ts
├─ core/
├─ registry/
├─ areas/
├─ app/
├─ styles/
└─ tests/
```

Während der Migration darf `quell/` weiter existieren.

**Nicht tun**

- alles auf einmal umbenennen
- Editor sofort komplett migrieren
- Backup-Code ohne Tests migrieren
- `redion-einzeldatei.html` brechen
- Offline-Nutzung brechen
- Datenmodell ohne Migration ändern

**Status**

Entschieden und begonnen. Die Grundlage steht seit Phase 2: Typecheck ohne
Bauschritt (`noEmit`), zentrale Typen unter `src/core/types/`, Typecheck in
GitHub Actions. Der ausführliche Weg — die Phasen TS-0 bis TS-10, die Regeln
beim Umziehen einer Datei und die Frage, wann ein Bauschritt nötig wird —
steht in **`doku/TYPESCRIPT-MIGRATION.md`**.

**Nachtrag vom 4. August 2026 — wie `.ts` zu `.js` wird.** Mit TS-3 zieht
erstmals ausführbarer Code um, und damit stellte sich die Frage, die `noEmit`
bis dahin offenlassen konnte. Entschieden: **das erzeugte JavaScript wird
mitversioniert.**

```txt
src/kern/helfer/kennungen.ts      Quelle
        ↓  npm run bauen:ts
quell/kern/helfer/kennungen.js    wird geladen, wird mitcommittet
```

`tsconfig.bauen.json` bildet `rootDir: src` auf `outDir: quell` ab — die
Datei landet dort, wo `index.html` und `sw.js` sie ohnehin laden. Keine der
beiden musste geändert werden. **Ein Bauschritt für den Entwickler, keiner
für den Nutzer.**

`module: none` verbietet `import`/`export`; sonst entstünde ein ES-Modul, und
das liefe von `file://` nicht. Migrierte Dateien bekommen ihre Typen deshalb
aus `src/global.d.ts`.

*Nicht gewählt:* Vite oder ein Bündler als Pflicht. Beides wäre bequemer zu
schreiben und würde die eine Regel brechen, die nicht verhandelbar ist.

*Der Preis:* zwei Dateien mit demselben Inhalt können auseinanderdriften.
Dagegen `pruefungen/lauf/test105.mjs` (vergleicht Zeichen für Zeichen mit
einer frischen Ausgabe) und ein „ERZEUGT — NICHT VON HAND ÄNDERN" ganz oben
in jeder erzeugten Datei.

Als Nächstes der Rest von TS-3: `datum`, `objekte`, `bremse`, `melder`,
`saeubern`, `bytes`.

---

## E7 · Kein React-Zwang

**Problem**

Der Nutzer will TypeScript wie BABAT-RED. BABAT-RED nutzt React/TypeScript.
Redion muss aber nicht automatisch React übernehmen.

**Entscheidung**

TypeScript ja. React nur, wenn später bewusst entschieden.

**Warum**

Redion hat eine bestehende App-Struktur mit `quell/`, `kern/`, `register/`,
`schale/`, `bereiche/`. Ein sofortiger React-Umbau wäre riskant.

**Folgen**

Erste TypeScript-Phase: `tsconfig.json` · Typecheck · zentrale Typen · kleine
DOM-freie Kernmodule · Backup- und Speicher-Typen

Keine automatische React-Einführung.

**Status**

Entschieden für die erste Migration.

---

## E8 · Architektur bleibt modular

**Problem**

Wenn Bereiche direkt voneinander importieren, wird Redion unwartbar.

**Entscheidung**

Die bestehende Modulregel bleibt:

```txt
Ein Bereich darf nur verwenden:
- kern/
- register/
- eigene Dateien
```

Nicht erlaubt:

```txt
bereiche/editor  → bereiche/datenbanken
bereiche/wissen  → bereiche/editor
bereiche/ki      → bereiche/datenbanken
```

**Warum**

Nur so bleiben Bereiche austauschbar und prüfbar.

**Folgen**

Gemeinsame Logik gehört nach `quell/kern/`. Fachliche Anmeldung gehört nach
`quell/register/`. Kommunikation läuft über Ereignisse oder definierte
Dienste.

**Status**

Entschieden. Dauerhafte Architekturregel.

---

## E9 · Register bleiben die zentrale Wahrheit

**Problem**

Neue Funktionen dürfen nicht überall verstreut eingebaut werden.

**Entscheidung**

Neue Dinge werden als Register-Objekte eingetragen.

```txt
Blockart      → register/bloecke.js
Ansicht       → register/ansichten.js
Eigenschaft   → register/eigenschaften.js
Formel        → register/formeln.js
Befehl        → register/befehle.js
Tastenkürzel  → register/tasten.js
Vorlage       → register/vorlagen.js
Verbindung    → register/verbindungen.js
Navigation    → register/navigation.js
Bereich       → register/module.js
```

**Warum**

Die Oberfläche soll sich aus Registern zeichnen können.

**Status**

Entschieden. Für die Einstellungen noch nicht durchgezogen — siehe **E22**.

---

## E10 · Keine SQL-Engine im Browser als Pflicht

**Problem**

Eine echte SQL-Engine im Browser würde WebAssembly oder große Abhängigkeiten
benötigen.

**Entscheidung**

Keine SQL-Engine als Pflichtbestandteil. Stattdessen: lesbare Abfragesprache ·
Filtermaschine · Formelsprache · Datenbank-Dienste

**Warum**

Redion soll leicht bleiben und lokal per Datei startbar bleiben.

**Status**

Entschieden.

---

## E11 · Formeln bleiben sicher

**Problem**

Formeln könnten gefährlich werden, wenn sie JavaScript ausführen.

**Entscheidung**

Formeln bleiben eigene Sprache.

**Nicht tun**

```txt
eval()
Function()
ungeprüfter JavaScript-Code
```

**Warum**

Eine Formel darf keine fremde Code-Ausführung sein.

**Folgen**

Neue Formelfunktionen müssen registriert, dokumentiert und getestet werden und
ohne Seiteneffekte bleiben.

**Status**

Entschieden.

---

## E12 · Sicherheit vor Komfort

**Problem**

Eine Notiz-App kann private Daten enthalten.

**Entscheidung**

Sicherheit geht vor Komfort. Dazu gehören:

- Nutzertext escapen
- keine unsicheren Links
- keine gefährlichen Embeds
- kein fremder Code aus Formeln
- sichere Datei- und Importpfade
- klare Fehlermeldungen statt stille Fehler

**Status**

Dauerhafte Grundregel.

---

## E13 · Versionen werden ausgedünnt, nicht nur abgeschnitten

**Problem**

Wenn jede automatische Version gleich behandelt wird, gehen alte wichtige
Fassungen schnell verloren.

**Entscheidung**

Versionen werden ausgedünnt:

```txt
jüngste Versionen fein
ältere Versionen täglich
sehr alte Versionen monatlich
manuell gespeicherte Versionen behalten
```

**Warum**

Ein Verlauf soll Tiefe haben, nicht nur viele Fassungen der letzten Stunden.
Eine Fassung entsteht alle vier Minuten; ein Nachmittag Arbeit erzeugt
dreissig davon, und ein hartes Abschneiden bei dreissig lässt den Verlauf nur
noch zwei Stunden zurückreichen.

**Status**

Entschieden und umgesetzt.

---

## E14 · Zwei Tabs werden aufgefrischt, aber nicht vollständig zusammengeführt

**Problem**

Zwei Browser-Tabs können denselben Speicher verwenden und einander
überschreiben.

**Entscheidung**

Änderungen anderer Tabs werden erkannt und nachgelesen.

**Nicht gebaut**

Vollständiger Echtzeit-Merge während gleichzeitigem Tippen.

**Warum**

Echter paralleler Editor bräuchte CRDTs oder Serverlogik. Der Fall, um den es
geht, ist der andere: zwei Fenster, zwei verschiedene Seiten, und eines wirft
die Arbeit des anderen weg, weil es sie nie gesehen hat.

**Folgen**

Gemeldet wird erst, wenn es auf der Platte steht. Nachgelesen wird von der
Platte, nicht aus der Nachricht. Aufgefrischt wird immer, gezeichnet nur, wenn
niemand tippt.

**Status**

Entschieden und umgesetzt.

---

## E15 · Öffentliche Seiten dürfen private Daten nicht mitliefern

**Problem**

Später sollen Seiten geteilt oder veröffentlicht werden können.

**Entscheidung**

Öffentliche Ausgabe muss strikt getrennt sein von privaten Daten.

**Folgen**

Öffentliche Seiten dürfen nicht enthalten: private Blöcke · private Anhänge ·
versteckte Eigenschaften · Rechte-Daten · Sync-Metadaten · Konto-Daten

**Status**

Entschieden für spätere Cloud/Server-Arbeit.

---

## E16 · Dokumentation ist Teil des Produkts

**Problem**

Bei einem großen Projekt reicht Code allein nicht.

**Entscheidung**

Wichtige Änderungen müssen dokumentiert werden.

Vorhanden:

```txt
README.md
CLAUDE.md
AUFGABEN.md
LUECKEN.md
ENTSCHEIDUNGEN.md
CLOUDFLARE.md
SERVER-EINRICHTEN.md
doku/ARCHITEKTUR.md
doku/TYPESCRIPT-MIGRATION.md
```

Geplant — siehe `AUFGABEN.md` und `LUECKEN.md` L27:

```txt
doku/REDION-FORMAT.md
doku/SICHERHEIT.md
doku/SYNC.md
doku/CLOUDFLARE-R2.md
doku/MOBILE.md
```

**Status**

Dauerhafte Regel.

---

## E17 · Datenintegrität vor neuen Features

**Entscheidung**

Redion darf lieber langsamer neue Funktionen bekommen, als Nutzerdaten zu
verlieren.

**Folgen**

Vor Änderungen an Speicher · Import · Export · `.redion` · Sync · Rechte ·
Verschlüsselung · Dateiverarbeitung müssen Tests geplant oder angepasst
werden.

**Status**

Oberste Projektregel.

---

# Entscheidungen aus dem Bau

Die folgenden Einträge sind beim Bauen entstanden, nicht beim Planen. Jeder
davon ist eine Regel, die beim nächsten Umbau als Erstes in Frage gestellt
wird — deshalb steht hier nicht nur, was gilt, sondern auch, warum die
naheliegende Alternative verworfen wurde.

---

## E18 · Keine CSP im Dokument — wegen `file://`

**Problem**

Eine Content-Security-Policy ist eine wirksame Absicherung. Die bequeme Art,
sie zu setzen, ist ein `<meta http-equiv="Content-Security-Policy">` im
Dokument.

**Entscheidung**

Kein `<meta>`-CSP. Die strenge CSP bekommt nur die **veröffentlichte Seite**,
und zwar als Kopfzeile vom Server.

**Warum**

Ein `<meta>`-CSP gilt auch für `file://`. Redion läuft per Doppelklick auf
`index.html` — das ist der Kern der Sache, keine Vorliebe. Dort gibt es keinen
Server, der die Regel anpassen könnte; eine zu strenge Regel im Dokument wäre
nicht mehr zu korrigieren.

Die veröffentlichte Seite verträgt dagegen `default-src 'none'`: sie braucht
kein einziges Skript. Genau dort ist die CSP am meisten wert, weil es die
einzige Seite ist, die ein fremder Browser darstellt.

**Folgen**

Die App bekommt die billigen Kopfzeilen (`X-Content-Type-Options`,
`Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`). Eine CSP für die
App selbst wird erst sinnvoll, wenn die Stilattribute in Klassen überführt
sind.

**Nicht tun**

Ein `<meta>`-CSP „zur Sicherheit" ergänzen.

**Status**

Entschieden.

---

## E19 · Die Schonfrist beim Sichtbarmachen des Papierkorbs

**Problem**

Weggelegte Blöcke waren lange unsichtbar: der Papierkorb zeigte nur Seiten.
Sie sichtbar zu machen heisst auch, dass die Frist zum endgültigen Löschen sie
jetzt findet. Ein Bestand mit zwei Jahren stiller Blöcke wäre acht Sekunden
nach dem ersten Start um sie ärmer gewesen — gelöscht, bevor sie je jemand zu
sehen bekam.

**Entscheidung**

Die App merkt sich den Tag, an dem der Papierkorb anfing, alles zu zeigen.
Für Blöcke zählt die Frist ab diesem Tag, nicht ab dem Tag des Weglegens. Für
Seiten bleibt es beim Weglegen — die waren immer sichtbar.

**Warum**

Der naheliegende Weg wäre gewesen, allen Blöcken ein neues Datum zu geben. Das
schreibt eine Unwahrheit in die Daten: im Papierkorb stünde „gelöscht vor
einem Moment" für etwas Zweijähriges, und wer das später liest, hält es für
die Wahrheit.

**Folgen**

Die Aufräumung beim Start meldet, was sie getan hat. Eine Einstellung, der
jemand einmal zugestimmt hat, rechtfertigt nicht, dass er nicht erfährt, wann
sie zugreift.

**Nicht tun**

Zeitstempel in den Daten korrigieren, um eine Frist zu steuern.

**Status**

Entschieden und umgesetzt.

---

## E20 · Keine Marke ändert Rechte oder stellt Schlüssel aus

**Problem**

Eine **Marke** ist ein Zugangsschlüssel für ein Programm, mit Rechten
(`lesen`, `schreiben`, `alles`). Geprüft wurden sie an zwei von neun Wegen.
Eine Marke mit `lesen` konnte über `/bereich` schreiben, über `/sync` den
ganzen Bestand ersetzen — und über `/marken` sich selbst eine neue mit `alles`
ausstellen.

**Entscheidung**

Ein Tor an einer Stelle, nach dem Token und vor der ersten Route. Drei Regeln:

1. Ein Mensch am Gerät (Sitzung) ist unberührt.
2. Eine Marke schreibt nur mit `schreiben` oder `alles`; lesen darf, wer
   irgendetwas davon hat.
3. **Rechte und Schlüssel ändert keine Marke** — auch keine mit `alles`.
   `/marken`, `/freigabe` und `/feldrecht` sind für Marken ganz zu.

**Warum**

Gegen Regel 3 spricht: `alles` heisst `alles`, und wer sich eine solche Marke
ausstellt, weiss doch, was er tut. Das stimmt — solange die Marke bei ihm
bleibt. Der Fall, für den man baut, ist der andere: sie steht in einer
Konfigurationsdatei, in einem Protokoll, in einem Screenshot. Von dort aus ist
der Unterschied zwischen „darf alles in meinen Daten" und „darf sich selbst
dauerhaft einrichten und andere einladen" der Unterschied zwischen einem
Schaden und einer Übernahme.

**Folgen**

Eine bestehende Marke kann dadurch aufhören zu funktionieren. Das ist die
Absicht, und die Meldung sagt, was zu tun ist. Eine Sicherheitszusage, die man
aus Rücksicht auf bestehende Aufrufe nicht durchsetzt, ist keine.

Wer schreiben darf, darf auch lesen — sonst könnte ein Programm nicht
nachsehen, was es geschrieben hat.

Zwei Wege entscheiden selbst, ob gelesen oder geschrieben wird: `/v1` und
`/mcp`. Dort sagt die HTTP-Methode nichts — `POST /v1/search` ist ein Suchen.
Regel 3 gilt trotzdem auch für sie.

**Nicht tun**

Die Prüfung je Route wiederholen. Zwei Fassungen derselben Prüfung laufen
auseinander, und die falsche merkt niemand.

**Status**

Entschieden und umgesetzt.

---

## E21 · Kataloge werden geladen und befragt, Schnittstellen nachgesehen

**Problem**

Beim Zählen der Register kam zuerst heraus: 12 Tastenkürzel, 20 Formeln.
Richtig waren 127 und 158. Gezählt worden war per `grep` über `id:` — das
zählt Kommentare und Beispiele mit und verfehlt alles, was erst zur Laufzeit
entsteht.

**Entscheidung**

Register werden **geladen und befragt**, nicht durchsucht. Und eine
Schnittstelle wird nachgesehen, bevor sie benutzt wird.

**Warum**

Der zweite Teil ist der teurere. Fünf geratene Namen, die es so nicht gab:
`Store.versionenVon` (heisst `versionen`), `Dialog.wahl` (gab es nicht),
`Register.bloecke.find` (ist ein Katalog mit `eines(id)`), `zip.datei` (heisst
`holen`) und der Modulname `Fenster` (gehört den Reitern).

Der letzte war der lehrreichste: bei einer App ohne Bauschritt ist jedes Modul
ein globaler Name, und ein zweites `const X` bringt die Datei um, die als
zweite geladen wird. Der Fehler zeigte sich an einer ganz anderen Stelle.

**Folgen**

`test87` prüft seither, dass kein globaler Name zweimal vergeben ist und dass
jede in `index.html` geladene Datei auch im `sw.js` steht.

**Nicht tun**

Eine Zählung oder eine Signatur aus dem Gedächtnis übernehmen.

**Status**

Dauerhafte Arbeitsregel.

---

## E22 · Die Einstellungen im Register sind ein eigener Umbauschritt

**Problem**

`register/einstellungen.js` ist als zentrale Wahrheit gedacht (E9). Gemessen
stehen dort aber nicht alle Einstellungen; ein grosser Teil der 143 Optionen
wird direkt in der Oberfläche gezeichnet.

**Entscheidung**

Das wird nachgezogen — aber als **eigener Schritt**, nicht nebenbei bei einer
anderen Änderung.

**Warum**

Ein Umzug, der Verhalten ändert, ist kein Umzug, sondern zwei Änderungen
gleichzeitig. Bei Einstellungen hängen Voreinstellungen und gespeicherte Werte
daran; ein stiller Fehler dort verändert das Verhalten der App, ohne dass es
jemand mit der Änderung in Verbindung bringt.

**Status**

Entschieden. Steht als Aufgabe.

---

## E23 · Die 62 Integrationen brauchen einen Server

**Problem**

Notion nennt 62 Integrationen. Redion hat 8. Die Lücke sieht nach Fleissarbeit
aus.

**Entscheidung**

Sie ist keine. Die meisten der 62 brauchen ein OAuth-Geheimnis und damit einen
Server. Ohne Server geht nur, was einen persönlichen Schlüssel akzeptiert, den
der Nutzer selbst einträgt.

**Warum**

Ein OAuth-Geheimnis im Frontend ist kein Geheimnis. Und die Grundregel lautet:
keine geheimen Schlüssel im Frontend — der KI-Schlüssel wird eingetippt und
bleibt im Browser.

**Folgen**

Welche Integrationen ohne Server möglich sind, wird einzeln entschieden. Der
Rest hängt an E2 (Cloudflare) und wird dort eingeordnet.

**Nicht tun**

Integrationen zählen, ohne zu prüfen, ob sie ohne Server überhaupt gehen.

**Status**

Entschieden.

---

# Entscheidungen aus der Funktionsplanung

Die folgenden Einträge kommen aus der vollständigen Funktionsplanung
(MUSS / SOLL / KANN / BESSER NICHT). Sie beantworten die Frage, die sich
sonst bei jeder einzelnen Tabellenfunktion neu stellt.

---

## E24 · Excel-Probleme lösen, Excel nicht klonen

**Problem**

Redion soll Tabellenkalkulation können: Budget, Rechnungen, Materiallisten,
Projektkosten, Lernfortschritt, Inventar. Der naheliegende Weg wäre, Excel
nachzubauen.

**Entscheidung**

Redion löst **Excel-Probleme**, klont **nicht Excel**.

Gebaut wird:

```txt
Spreadsheet-Block
Spreadsheet-Ansicht für Datenbanken
Zellen, Zeilen, Spalten
Zellbezüge A1/B2 und Bereiche A1:C10
Formeln in Zellen mit automatischer Neuberechnung
Abhängigkeiten zwischen Zellen, Zirkelbezüge erkennen
deutsche Funktionsnamen mit englischen Aliasen
CSV rein und raus, XLSX später
```

Nicht gebaut: der vollständige Funktionsumfang von Excel, seine
Oberflächenlogik, seine Dateiformat-Eigenheiten.

**Warum**

Excel 1:1 ist zu gross, zu komplex, schwer testbar und verwässert, was
Redion ist. Achtzig Prozent des Alltags decken rund sechzig Funktionen ab —
Grundrechnen, Logik, Datum, Text, Information, dazu die Suchfunktionen
(`SVERWEIS`, `XVERWEIS`, `INDEX`/`VERGLEICH`, `SUMMEWENNS`).

**Nachtrag vom 4. August 2026 — nachgemessen, und das Ergebnis dreht die
Reihenfolge um.**

Diese Entscheidung ging davon aus, dass rund sechzig Excel-Funktionen zu
bauen sind. Gemessen (Register geladen, Laufzeit geladen, Namen abgeglichen —
`doku/EXCEL-IN-REDION-RECHERCHE.md`):

```txt
158  Funktionen im Register, davon 0 ohne Implementierung
 37  von 63 Funktionen des Startpakets sind bereits da und laufen
  0  davon sind unter ihrem deutschen Namen erreichbar
```

Wer aus Excel kommt und `=SUMME(A1:A10)` tippt, bekommt einen Fehler. `sum`
hätte funktioniert.

Es fehlen also nicht 63 Funktionen, sondern **26 Funktionen und 37 Namen** —
und die Namen sind fast umsonst zu haben: der Zerteiler kennt Umlaute schon
(`/[A-Za-zÄÖÜäöüß_]/`), und Namen werden vor dem Nachschlagen
kleingeschrieben. Ein Alias ist eine Zeile.

**Also zuerst die Namen, dann die Funktionen.** Die schwächste Gruppe ist
Suche/Verweis mit 3 von 13 — und genau sie trägt in Excel die eigentliche
Arbeit. Sie kommt als Zweites.

Eine Frage ist **vor** dem Bauen zu entscheiden: Excel hat echte Fehlerwerte
(`#WERT!`, `#DIV/0!`), Redion meldet Text. `WENNFEHLER` und `ISTFEHLER`
brauchen einen Fehlerwert im Datenmodell — eine Änderung an der Laufzeit,
keine neue Funktion. Wird sie später entschieden, wird `WENNFEHLER` zweimal
gebaut.

**Folgen**

Der Tabellenkern ist ein **Bereich** wie jeder andere und hält sich an E8:
er benutzt `kern/` und `register/`, nicht die Datenbanken direkt. Neue
Funktionen werden im Register eingetragen (E9) und laufen über dieselbe
sichere Formelsprache wie die Datenbankformeln (E11) — **kein `eval()`**,
kein zweiter Auswerter.

**Nicht tun**

- eine zweite Formelsprache neben der bestehenden aufbauen
- Excel-Dateiformat-Kanten nachbilden, die niemand braucht
- Funktionen zählen statt Fälle lösen

**Status**

Entschieden. Reihenfolge siehe `AUFGABEN.md` Phase 4 bis 9.

---

## E25 · Keine Makros, kein VBA

**Problem**

Wer Excel ersetzen will, stösst auf Makros. Sie sind der Grund, warum viele
Tabellen überhaupt automatisiert sind.

**Entscheidung**

Redion baut **keine** Makrosprache und führt **keinen** fremden Code aus.
Stattdessen: die sicheren Redion-Automationen — `wenn`, `sonst`, `fuerJede`,
Eigenschaft setzen, Erinnerung, Unterseite, KI-Feld, Knopf — mit Vorschau,
Protokoll und Fehleranzeige.

**Warum**

Makros sind seit dreissig Jahren einer der verlässlichsten Wege, sich einen
Schädling einzufangen. Fremder Code in einer Datei, die man per Mail
bekommt, lässt sich nicht sinnvoll einsperren. Für eine App, die local-first
ist und dem Nutzer gehört, wäre das der teuerste mögliche Kompromiss.

**Folgen**

Was eine Automation kann, steht im Register und ist damit auf- und
abzählbar. Was sie nicht kann, kann sie auch nicht heimlich.

**Nicht tun**

`eval()`, `Function()`, importierte Skripte, „nur für Fortgeschrittene"
freigeschaltete Codefelder.

**Status**

Entschieden. Dauerhafte Sicherheitsregel, verwandt mit E11 und E12.

---

## E26 · Grosse Abhängigkeiten nur nach Prüfung

**Problem**

Für Tabellen, XLSX, Diagramme und OCR gibt es fertige Bibliotheken. Jede
davon ist verlockend und jede ist gross.

**Entscheidung**

Eine neue Abhängigkeit kommt nur herein, wenn **alle fünf** Punkte stimmen:

```txt
echter Nutzen, keine kleine Alternative
offline nutzbar
Lizenz passt
Tests vorhanden
Grösse vertretbar für die Einzeldatei und fürs Telefon
```

**Warum**

`redion-einzeldatei.html` ist kein Nebenprodukt, sondern die Form, in der
Redion ohne alles läuft. Jede Abhängigkeit landet dort. Und was auf dem
Schreibtisch schnell ist, kann auf einem iPhone unbenutzbar sein.

**Folgen**

Für Node, Prüfläufe und den Bauschritt gelten diese Punkte nicht — dort ist
`playwright` längst richtig. Es geht um Code, der **im Browser des Nutzers**
landet.

**Nicht tun**

Eine Bibliothek einbauen, weil sie den ersten Prototyp schneller macht.

**Status**

Entschieden. Ergänzt `CLAUDE.md` §6 und §52.5.
