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

**Wie `.ts` zu `.js` wird.** Sobald ausführbarer Code umzieht, muss daraus
JavaScript werden. Entschieden: **das erzeugte JavaScript wird
mitversioniert.**

```txt
src/core/helpers/ids.ts      Quelle
        ↓  npm run bauen:ts
quell/core/helpers/ids.js    wird geladen, wird mitcommittet
```

`tsconfig.bauen.json` bildet `rootDir: src` auf `outDir: quell` ab.
**Ein Bauschritt für den Entwickler, keiner für den Nutzer** — die App startet
weiterhin per Doppelklick.

Sein `include` zeigt bewusst auf `src/core/helpers/**` und **nicht** auf
`src/core/**`: die Typdateien dürfen nicht ausgegeben werden. Sie benutzen
`import`/`export`, was `module: none` verbietet — der Fehler käme also beim
Bauen und nicht erst im Browser, aber besser ist, er kommt gar nicht.

`module: none` verbietet `import`/`export`; sonst entstünde ein ES-Modul, und
das liefe von `file://` nicht. Migrierte Dateien bekommen ihre Typen deshalb
aus `src/global.d.ts`.

*Nicht gewählt:* Vite oder ein Bündler als Pflicht. Beides wäre bequemer zu
schreiben und würde die eine Regel brechen, die nicht verhandelbar ist.

*Der Preis:* zwei Dateien mit demselben Inhalt können auseinanderdriften.
Dagegen `pruefungen/lauf/test105.mjs` (vergleicht Zeichen für Zeichen mit
einer frischen Ausgabe) und ein „ERZEUGT — NICHT VON HAND ÄNDERN" ganz oben
in jeder erzeugten Datei.

**Sprache.** Neuer TypeScript-Code ist englisch — siehe **E27**. Die
Zielstruktur in `CLAUDE.md` §52.3 war das immer schon; erst E27 macht daraus
eine Regel statt eines Beispiels.

Als Nächstes der Rest der kleinen Helfer: Datum, Objekte, Bremse, Melder,
Säubern, Bytes.

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

**Der Stand, gemessen**

Die Annahme war, rund sechzig Excel-Funktionen seien zu bauen. Nachgemessen
(Register geladen, Laufzeit geladen, Namen abgeglichen —
`doku/EXCEL-IN-REDION-RECHERCHE.md`) sieht es anders aus:

```txt
158  Funktionen im Register, davon 0 ohne Implementierung
 61  von 63 des Excel-Startpakets laufen unter deutschem Namen
  2  fehlen mit Absicht (WENNFEHLER, ISTFEHLER — siehe unten)
```

Es fehlten nie 63 Funktionen. Es fehlten Namen — und die kosten fast nichts,
weil der Zerteiler Umlaute schon kennt und Namen vor dem Nachschlagen
kleingeschrieben werden.

Offen bleibt der **Spreadsheet-Block selbst**: Zellen, A1-Bezüge, Bereiche,
Neuberechnung, Zirkelbezüge. Die Funktionen dafür stehen bereit.

**Drei Regeln, die beim Bauen entstanden sind**

**1 · Ein Zweitname wird am Anfang aufgelöst, nicht am Ende eingehängt.**
`evaluate` behandelt dreizehn Namen besonders, **bevor** es in die
Funktionstabelle schaut — darunter `if` und `ifs`, die ihre Zweige faul
auswerten. Ein Alias, der nur in der Tabelle steht, läuft daran vorbei:

```txt
if(true, 1, teuer())      rechnet teuer() nicht
WENN(true, 1, teuer())    rechnete es
```

Beide gaben `1` zurück. Deshalb wird der deutsche Name jetzt ganz zu Beginn
der Auswertung auf den englischen zurückgeführt; danach gilt jede
Sonderbehandlung für beide Schreibweisen von selbst.

**2 · Ein Zweitname wird gegen feste Werte geprüft, nicht gegen die
Gegenseite.** Elf der ersten siebenunddreissig Zuordnungen waren nach
Namensähnlichkeit gemacht und rechneten etwas anderes als Excel:

```txt
                          zeigte auf     tat            Excel
WECHSELN("a.b.c";".";"-") replaceall     "-----"        "a-b-c"
TEIL("Redion";2;3)        slice          "d"            "edi"
VERGLEICH(…)              match          ["Genf"]       die Stelle
TAG("2026-08-04")         day            2 (Wochentag)  4
REST(-7;3)                mod            -1             2
RUNDEN(-2,5)              round          -2             -3
```

`WECHSELN` zeigt es am schärfsten: `replaceall` nimmt einen regulären
Ausdruck, also trifft der Punkt jedes Zeichen. Der Prüflauf fand es nicht,
weil er den deutschen Namen mit dem verglich, worauf er zeigt — bei einer
falschen Zuordnung rechnen beide Seiten dasselbe Verkehrte. Geprüft wird
seither gegen **nachgeschlagene Werte**: `TEIL("Redion";2;3)` ist `"edi"`,
und das steht so im Lauf.

**3 · Kein WENNFEHLER, solange es keine Fehlerwerte gibt.** Redions Laufzeit
ist **abwehrend** gebaut und erzeugt gar keine Fehlerwerte:

```txt
1 / 0          →  0
WURZEL(-1)     →  0
WERT("abc")    →  0
```

Excels `WENNFEHLER` fängt `#DIV/0!`, `#WERT!`, `#NV` — hier gäbe es nichts zu
fangen. Es sähe aus wie Excels und wäre etwas anderes.

Echte Fehlerwerte wären keine neue Funktion, sondern eine Änderung am
Rechnen selbst, und sie änderten das Ergebnis **bestehender Formelspalten in
bestehenden Datenbanken**: wo heute `0` steht, stünde ein Fehler. Das ist
Priorität 1 (§46) und braucht eine eigene Entscheidung mit
Migrationsgedanken. `test106` Abschnitt 4d hält den Zustand fest, damit er
eine Entscheidung bleibt und nicht zu einer Lücke wird, die jemand aus
Versehen füllt.

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

---

## E27 · Code-Sprache — Deutsch für Menschen, Englisch für Code

**Problem**

Es gab keine Regel, und deshalb widersprachen sich die Vorgaben:

```txt
CLAUDE.md §3   „deutsche Dateinamen/Ordnernamen"
CLAUDE.md §52  Zielstruktur englisch — RedionBlock, core/storage/indexedDb.ts
README.md      Typenliste englisch — RedionBlock, RedionFile
src/           src/core/ (englisch) neben src/kern/ (deutsch)
```

Wer neuen TypeScript-Code schrieb, konnte jede der beiden Seiten belegen. Die
ersten sieben Typdateien wurden deshalb deutsch benannt — mit Verweis auf §3,
obwohl §52 und die README das Gegenteil vorgaben.

**Entscheidung**

```txt
Englisch    Ordnernamen · Dateinamen · Variablen · Funktionen · Klassen
            Interfaces · Typen · Enums · Testnamen

Deutsch     alle Texte, die ein Mensch liest
```

Deutsch bleibt also: App-Texte · Knöpfe · Fehlermeldungen für Nutzer ·
README · CLAUDE.md · AUFGABEN.md · ENTSCHEIDUNGEN.md · LUECKEN.md ·
Kommentare im Code.

Beispiele:

```txt
Gut                          Nicht neu verwenden
createPage()                 seiteErstellen()
saveBackup()                 sicherungSpeichern()
restoreWorkspace()           arbeitsbereichWiederherstellen()
validateFormula()            formelPruefen()
calculateRollup()
importRedionPackage()
```

**Warum**

Ein Projekt mit zwei Namenswelten zwingt bei jeder Datei zu einer
Entscheidung, die niemand treffen sollte. Englisch ist die Sprache, in der
TypeScript, seine Bibliotheken und jedes Beispiel geschrieben sind — deutsche
Bezeichner daneben lesen sich wie eine Übersetzung, die auf halbem Weg
aufgehört hat.

Umgekehrt ist Deutsch die Sprache der Nutzer und der Erklärungen. Ein
Kommentar auf Englisch wäre hier kein Gewinn, sondern eine zweite Hürde.

**Die zwei Grenzen**

**1 · Bestehender deutscher Code wird nicht massenhaft umbenannt.** Unter
`quell/` liegen 96 Dateien. Sie umzubenennen wäre ein Umbau ohne fachlichen
Gewinn und mit jedem Risiko. Eine Umbenennung ist nur erlaubt, wenn eine
Datei ohnehin im Rahmen der geplanten Migration umzieht — und dann gemessen:
`ids.ts` hatte fünfzehn Aufrufe in drei Dateien, das war vertretbar. Bei
hundert Aufrufern wäre die Antwort anders gewesen.

**2 · Feldnamen gespeicherter Daten bleiben, wie sie sind.** Das ist die
wichtigere Grenze. `RedionBlock` heisst englisch, aber seine Felder heissen
weiter `created`, `edited`, `erstelltVon`, `alive`, `parentTable` — denn so
stehen sie in IndexedDB auf den Geräten von Nutzern.

Ein Feldname im Typ, der nicht dem gespeicherten Feld entspricht, ist keine
Übersetzung, sondern eine **falsche Behauptung**. Sie umzubenennen wäre eine
Datenmigration, keine Namensfrage.

`CLAUDE.md` §52.8 zeigte genau diesen Fehler: dort standen `createdAt`,
`updatedAt`, `properties` und `deleted` — Felder, die es nie gab. Das
Beispiel war nie gegen die Ablage geprüft (E21) und ist inzwischen
korrigiert.

**Folgen**

- Neue `.ts`-Dateien tragen englische Namen.
- `src/kern/` gibt es nicht mehr; alles Neue liegt unter `src/core/`.
- Die sieben Typdateien heissen `id.ts`, `block.ts`, `database.ts`,
  `file.ts`, `backup.ts`, `storage.ts`, `index.ts`.
- `Ergebnis<T>` heisst `Result<T>`, `Kennungen` heisst `Ids`.
- `CLAUDE.md` **Abschnitt 53** fasst diese Regel für die tägliche Arbeit
  zusammen; §52.8–52.10 und die README zeigen jetzt die gemessenen Felder.

**Nicht tun**

- Bezeichner unter `quell/` massenhaft übersetzen
- Feldnamen gespeicherter Daten übersetzen
- Nutzertexte oder Kommentare auf Englisch umstellen
- die Projektdokumentation auf Englisch umstellen

**Status**

Entschieden und umgesetzt für `src/`. `quell/` bleibt deutsch, bis eine
Datei ohnehin migriert wird.

---

## E28 · Die Sprachen, die dieses Projekt benutzt

**Problem**

„Wir schreiben TypeScript" war eine Absicht, keine Regel. Nichts hinderte
jemanden daran, die nächste Datei wieder als `.js` anzulegen — und weil das
in einer App ohne Bauschritt sogar bequemer ist, wäre genau das passiert.
Eine Migration, in die hinten neuer Code nachläuft, kommt nie an.

**Entscheidung**

Diese Sprachen, und keine anderen:

```txt
TypeScript   neuer Hauptcode, Typen, Kernlogik, neue Module
JavaScript   nur der bestehende Redion-Code — er wird migriert, nicht vermehrt
HTML         Startdatei, App-Grundseite, Einzeldatei
CSS          Aussehen, Aufbau, Hell/Dunkel, Telefon
SQL          Cloudflare D1: Konten, Abgleich, Rechte, Angaben zu Dateien
Markdown     README, CLAUDE.md, Doku, Aufgaben, Entscheidungen
Shell/Bash   Startskripte, lokale Befehle
YAML         GitHub Actions
JSON         Konfiguration, Sicherungen, .redion, Manifest
TOML         Wrangler
```

**Die eine Zeile, auf die es ankommt: es entsteht kein neues JavaScript.**

**Wie das geht, ohne einen Bauschritt einzuführen**

Es gibt zwei Wege, und beide waren schon da — sie mussten nur benannt werden.

**1 · Code für den Browser** liegt als `.ts` unter `src/` und wird von
`npm run bauen:ts` nach `quell/` ausgegeben. Das erzeugte `.js` ist kein
geschriebenes JavaScript, sondern Ausgabe; es wird mitversioniert, damit die
App weiterhin per Doppelklick auf `index.html` startet. Das ist der Weg seit
`ids.ts`.

**2 · Code für Node** — Prüfläufe, `bauen.js`, der Server — liegt als `.ts`
und läuft **direkt**. Node führt TypeScript seit 22.18 ohne Schalter aus: es
entfernt die Typen und startet. Kein Übersetzer, kein Paket, kein Schritt,
den jemand vergessen kann.

Nachgemessen mit Node 22.22: `node datei.ts` läuft, auch ohne
`--experimental-strip-types`.

Der Preis dafür steht in der Node-Doku und ist klein: die Typen müssen
**löschbar** sein. Kein `enum`, kein `namespace`, keine Parameter-Felder im
Konstruktor. Alles drei ist ohnehin verzichtbar — `enum` durch ein
`as const`-Objekt, `namespace` durch eine Datei.

Und: Node **prüft** dabei nicht, es entfernt nur. Das Prüfen bleibt
`npm run typecheck`, und das ist richtig so — ein Prüflauf soll Verhalten
prüfen und nicht nebenbei übersetzen.

**Die Untergrenze**

Node **22.18**. Vorher gibt es das nicht, und ein Prüflauf, der auf einem
älteren Node stumm scheitert, wäre die schlechteste aller Fassungen.
`package.json` und die GitHub-Actions sagen das jetzt.

**Wie es durchgesetzt wird**

Eine Regel, die niemand prüft, ist eine Absichtserklärung.
`pruefungen/lauf/test109.ts` führt ein **Verzeichnis des bestehenden
JavaScripts** — jede von Hand geschriebene `.js`/`.mjs`, die es heute gibt.

```txt
Das Verzeichnis darf nur schrumpfen.
Eine Datei, die nicht darin steht, ist neu — und damit ein Fehler.
```

Wer eine Datei migriert, streicht sie aus dem Verzeichnis; die Zeile im Diff
ist der Fortschritt. Wer eine neue `.js` anlegt, wird rot, und zwar sofort.

Ausgenommen ist nur, was von `npm run bauen:ts` erzeugt wird — das ist
Ausgabe, kein Quelltext, und `test105` hält es ohnehin an seiner `.ts`.

**Stand beim Beschluss** — gemessen, nicht geschätzt:

```txt
 89  quell/            Produktcode  (dazu 7 erzeugte, die nicht zählen)
  9  server/
 79  pruefungen/lauf/  Prüfläufe
  4  Wurzel            bauen.js, bruecke.js, worker.js, sw.js
  1  functions/
───
182 Dateien, die noch JavaScript sind
 18 Dateien, die schon TypeScript sind
```

**Nicht tun**

- Eine neue `.js` anlegen, wo eine `.ts` möglich ist — also überall.
- Den bestehenden Code in einem Zug übersetzen. Die Reihenfolge steht in
  `doku/TYPESCRIPT-MIGRATION.md` und beginnt bewusst dort, wo ein Fehler
  nichts kostet.
- `enum` oder `namespace` benutzen. Sie sind nicht löschbar und nehmen Node
  die Fähigkeit, die Datei direkt auszuführen.
- Eine weitere Sprache dazunehmen, ohne dass sie hier steht. Python für ein
  Hilfsskript ist genau der Anfang, an dem eine Werkzeugkette entsteht.

**Status**

Beschlossen. Durchgesetzt für alles Neue ab sofort; das Verzeichnis in
`test109.ts` hält den Bestand fest und ist zugleich die Fortschrittsanzeige
der Migration.


---

## E29 · Der Tabellenblock — was er ist und was er bewusst nicht ist

**Frage.** Redion hat Datenbanken mit Formeln. Wozu dann ein zweiter Ort, an
dem gerechnet wird — und wie weit soll er gehen?

**Beschluss.**

Eine Datenbank und eine Tabelle beantworten verschiedene Fragen. In einer
Datenbank hat jede Zeile dieselbe Form: Spalte „Preis", Spalte „Datum", und
eine Formel gilt für die ganze Spalte. In einer Tabelle steht in `C7` etwas
anderes als in `C8`, und genau das ist ihr Zweck — ein Haushaltsplan, ein
Angebot, eine schnelle Rechnung nebenher. Wer das in einer Datenbank versucht,
legt für drei Zahlen ein Schema an.

Der Block liegt deshalb daneben und nicht darin.

**Es gibt keine zweite Formelmaschine.** Eine Zellformel wird in die Sprache
übersetzt, die `formeln/laufzeit.js` seit jeher spricht:

```txt
=SUMME(A1:A3)   →   SUMME(prop("A1"), prop("A2"), prop("A3"))
```

158 Funktionen, 262 Registereinträge, ein Zerleger, an dem heute alles hängt.
Eine zweite Maschine hiesse: jede Verbesserung zweimal, jeder Fehler an einer
Stelle behoben und an der anderen nicht. Übersetzen kostet dreissig Zeilen.

**Der Kern kennt keinen Bildschirm.** `src/core/spreadsheet/` rechnet, kennt
Adressen, Abhängigkeiten und Zirkelbezüge — und hat kein `document`. Das ist
der Grund, warum `test110` in Sekunden läuft statt in Minuten, und warum ein
Rechenfehler auffällt, bevor irgendeine Oberfläche existiert.

**Was der Block kann**

Rechnen mit allen 158 Funktionen · Zirkelbezüge erkennen und benennen ·
Zeilen und Spalten einfügen und löschen, mit nachgezogenen Bezügen ·
Ausfüllen (Zahlenreihe, Formel, Wiederholung) · Sortieren · Spaltenbreiten ·
Fett, Kursiv, Ausrichtung, Währung, Prozent · Kopieren und Einfügen als
Tabulatortext, also mit Excel in beide Richtungen · Ausgabe als echte `.xlsx`
und als CSV · Tastaturbedienung wie in einem Tabellenprogramm.

**Was er bewusst nicht kann**

*Mehrere Blätter je Block.* Die Datenstruktur trägt sie (`mappe.blaetter`),
die Oberfläche zeigt eines. Zwei Blätter brauchen Reiter, blattübergreifende
Bezüge (`Blatt2!A1`) und eine Antwort darauf, was beim Löschen eines Blattes
mit den Bezügen darauf geschieht. Das ist ein eigener Schritt, kein Detail.

*Diagramme.* Ein Diagramm ist ein eigener Block, kein Teil der Tabelle.

*`#DIV/0!` und `#ZAHL!`.* Die Laufzeit rechnet abwehrend: `1/0` ergibt 0. Sie
meldet nichts, also kann der Kern nichts weiterreichen. Dafür bräuchte
`laufzeit.js` einen `FormulaErrorMode` — der Typ steht schon da. Ein halber
Fehlerwert wäre schlimmer als keiner: er sähe aus wie Excel und wäre es an
der nächsten Zelle nicht mehr.

*Ziehauswahl am Telefon.* Der Anfasser hängt an `mousemove`; am Finger würde
das Ziehen zum Rollen. Er ist dort deshalb ausgeblendet, und Ausfüllen liegt
im Format-Blatt. `redion-mobile-ux` stellt die komplexe Ziehauswahl
ausdrücklich zurück — ein Anfasser, der beim Anfassen nichts tut, wäre
schlimmer als keiner.

**Die eine Regel, die über allem steht**

**Eine Zahl, die nicht in ihre Spalte passt, darf keine andere Zahl sein.**

Rechtsbündiger Text wird vorne abgeschnitten. Aus `634.2166666667` wurde auf
dem Bildschirm `34.2166666667` — vollständig aussehend, plausibel, falsch.
Der Block schreibt die Zahl deshalb erst kürzer (`634.216667`, voller Wert im
Titel) und zeigt `###`, wenn nicht einmal die Grössenordnung hineingeht.

Das ist kein Schönheitsfehler-Fix. Es ist derselbe Grundsatz wie überall in
diesem Projekt: **lieber sichtbar nichts als unsichtbar etwas Falsches.**

**Status**

Beschlossen und umgesetzt. `test110` prüft den Kern ohne Browser (111 Punkte),
`test111` den Block im Browser (60 Punkte, darunter hell/dunkel und 390 px).
