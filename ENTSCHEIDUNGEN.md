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

**2 · Code für Node** — Prüfläufe, `bauen.mts`, der Server — liegt als `.ts`
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

*~~Mehrere Blätter je Block.~~* **Nachgereicht.** Es war als eigener Schritt
angekündigt und ist es auch geworden — mit den drei Antworten, die dazu
gehören:

- **Gerechnet wird die Mappe, nicht das Blatt.** `rechneMappe` baut einen
  Graphen über alle Blätter, mit vollen Namen als Knoten (`Januar!A1`).
  Blattweise gerechnet hinge das Ergebnis an der Reihenfolge der Blätter, und
  ein Zirkelbezug über zwei Blätter fiele gar nicht auf — jedes Blatt für
  sich ist ja kreisfrei.
- **Umbenennen zieht jede Formel nach.** Ohne das zeigt danach alles ins
  Leere, sofort und überall. Genau deshalb gilt Umbenennen in manchen
  Programmen als gefährlich: dort wird es nicht nachgezogen, und man merkt es
  an der dritten Summe.
- **Löschen sagt vorher nachgezählt, was kaputtgeht.** Wie viele Formeln auf
  anderen Blättern hierher zeigen — die stehen woanders, man sieht sie gerade
  nicht, und sie werden gleich alle `#BEZUG!`. Ein fehlendes Blatt ergibt
  `#BEZUG!` und nicht 0: still als Null zu rechnen wäre die schlimmere
  Antwort, denn dann stimmte die Summe nicht und sähe richtig aus.

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


---

## E30 · Redion bleibt blau

**Frage.** `redion-ui-design-system` nennt Rot und Orange als Redions
Markenfarben (`--redion-primary: #ef4444`). Der Code sagt seit jeher etwas
anderes: `--accent: #2eaadc` — Notions Blau, dazu die zehn Notion-Farben für
Text und Hintergrund.

Das ist kein Detail. Es ist die Frage, wie Redion aussieht.

**Beschluss.** Es bleibt Blau. Von Redur am 4. August 2026 entschieden.

**Warum das hier steht und nicht nur im Gespräch.** Der Widerspruch stand
schwarz auf weiss in zwei Dokumenten, die beide gelten. Wer in drei Monaten
die Skill liest und den Code sieht, hält eines von beidem für einen Fehler und
„repariert" es. Dann ist die halbe App rot, die andere Hälfte blau, und
niemand weiss mehr, was gewollt war.

**Was das für neue Oberflächen heisst.** Alles Farbige kommt aus
`var(--accent)` und den `--c-*`-Werten in `dunkel.css` und `hell.css`. Kein
roher Farbwert in einem Bauteil-Stilblatt — nicht weil es hässlich wäre,
sondern weil es im jeweils anderen Modus falsch aussieht, und zwar erst dann,
wenn jemand dort arbeitet.

**Was bliebe, wenn sich das je ändert.** Genau zwei Dateien: `dunkel.css` und
`hell.css`. Jedes Bauteil, das `var(--accent)` benutzt, zieht mit. Das ist der
Grund, warum die Regel „keine rohen Farbwerte" mehr ist als Ordnungsliebe —
sie hält diese Entscheidung umkehrbar.

**Status**

Entschieden. Der Abschnitt „Farben" in `redion-ui-design-system` ist damit für
Redion überstimmt; die übrigen Abschnitte der Skill gelten unverändert.


---

## E31 · Ein strenger Modus für die Formelmaschine

**Frage.** `=1/0` ergibt in Redion **0**. Für eine Datenbankspalte ist das
richtig, für eine Tabellenzelle falsch. Beides gleichzeitig geht nicht — oder
doch?

**Der Konflikt, ausgeschrieben.**

In einer Datenbank steht eine Formel in einer *Spalte* und gilt für jede
Zeile. „Umsatz pro Kunde" über einer Zeile ohne Kunden soll keine
Fehlermeldung zeigen: die Liste würde rot, obwohl nichts kaputt ist. `0` oder
leer ist dort die freundliche und die richtige Antwort.

In einer Tabelle steht eine Formel in *einer* Zelle, und der Mensch sieht sie
an. Wer `=A1/B1` schreibt und B1 leer lässt, bekäme eine Null, die aussieht
wie ein Ergebnis. Das ist dieselbe Sorte Fehler wie eine abgeschnittene Zahl:
still, plausibel, falsch. Excel zeigt seit dreissig Jahren `#DIV/0!`, und zwar
genau deswegen — die Zahl ist nicht null, es gibt keine.

**Beschluss.** `laufzeit.js` bekommt einen **strengen Modus**, eingeschaltet
über `umgebung.streng`. Nur der Tabellenkern schaltet ihn ein.

```txt
locker (Datenbank)          streng (Tabelle)
─────────────────────────   ─────────────────────────
1/0        →  0             1/0        →  #DIV/0!
5%0        →  0             5%0        →  #DIV/0!
WURZEL(-1) →  0             WURZEL(-1) →  #ZAHL!
LN(0)      →  0             LN(0)      →  #ZAHL!
2^99999    →  Infinity      2^99999    →  #ZAHL!
```

**Die Bedingung, unter der die Datei angefasst wurde.** `laufzeit.js` trägt
158 Funktionen, 262 Registereinträge und jede bestehende Datenbankformel.
Keine einzige darf sich anders verhalten. Deshalb ist der strenge Modus
*ausgeschaltet*, solange ihn niemand einschaltet — und `test110` prüft
ausdrücklich die Gegenrichtung: `1/0` ohne `streng` ergibt weiterhin 0. Das
ist dort die wichtigere Prüfung.

**Ein Fehler beim Bauen, der hier festgehalten gehört.** Die erste Fassung
prüfte das Argument, *bevor* sie nachsah, ob es die Funktion überhaupt gibt.
`=LOG(0)` ergab damit `#ZAHL!` — `LOG` gibt es in Redion aber nicht, es heisst
`LOG10`. Ein Rechenfehler für einen Tippfehler schickt den Menschen an die
falsche Stelle: er sucht in seinen Zahlen statt in seiner Schreibweise. Jetzt
wird erst nachgesehen, dann geurteilt.

**Was das für `src/core/types/formula.ts` heisst.** Der dort seit langem
stehende `FormulaErrorCode` ist nicht mehr nur eine Absicht. Alle sieben
Excel-Fehlerwerte sind jetzt erreichbar; `#NV`, `#NULL!` und `#LEER!` erzeugt
der Kern weiterhin nicht, weil er sie nicht sicher weiss.

**Status**

Beschlossen und umgesetzt. Damit ist die letzte in E29 genannte Lücke am
Tabellenblock geschlossen.


## E32 · Der Worker heisst redion — die Datenbank weiter notizen

**Die Lage.** Im Cloudflare-Dashboard ist das Repository mit einem Worker
namens `redion` verbunden. Die `wrangler.toml` sagte aber `name = "notizen"`
— der Name aus der Zeit, als das Projekt noch Notizen hiess. Cloudflare
veröffentlicht nur, wenn beide Namen übereinstimmen; also wurde nichts
veröffentlicht.

**Beschluss.** Der Worker heisst `redion`, wie das Projekt. Die
`wrangler.toml` und die Adressen in CLOUDFLARE.md und SERVER-EINRICHTEN.md
sagen das jetzt auch. Die App ist damit unter
`redion.<dein-name>.workers.dev` erreichbar; eine unter der alten
notizen-Adresse installierte PWA muss von der neuen Adresse neu
installiert werden.

**Was ausdrücklich NICHT umbenannt wird.** Die IndexedDB im Browser heisst
weiter `notizen`, der Dienst-Cache weiter `notizen-v…`, exportierte Dateien
weiter `notizen-…`. Das sind keine Namen, sondern Daten (E27, Grenze 1):
wer die Datenbank umbenennt, trennt jeden Bestandsnutzer von seinen
Notizen. Der Worker-Name dagegen ist reine
Veröffentlichungs-Konfiguration — er berührt keine gespeicherten Daten.

**Status**

Beschlossen und umgesetzt.


## E33 · Anhänge in der Wolke — Metadaten in D1, Bytes in R2

**Die Frage.** `test113` und `test118` halten als Stolperdraht fest: Anhänge
gehen beim Abgleich nicht mit. Ein Block mit Bild kommt auf dem zweiten
Gerät ohne Bild an. Das ist G2 in AUFGABEN.md — und die Frage ist nicht ob,
sondern wie.

**Beschluss, in fünf Sätzen.**

Die **Metadaten** (Name, Grösse, Typ, Seite, Stückzahl) sind Sätze und
liegen in der Tabelle `dateien` — in D1 wie alles Strukturierte. Die
**Bytes** liegen stückweise unter `bereich/dateiId/nr` in R2; im Prüfserver
steht eine Map dahinter (`blobsSpeicher`), damit jede Prüfung ohne Wolke
läuft. Grosse Dateien gehören nicht in D1 — das war schon E2.

**Die Rechte** laufen wie beim Abgleich über die Seite, zu der die Datei
gehört: hochladen und löschen braucht `bearbeiten`, holen braucht `lesen`,
der Besitzer darf alles. `/datei/stand` rückt seine Marke mit dem
**Gelesenen** vor, nicht mit dem Durchgelassenen — dieselbe Lehre wie bei
`/sync/runter`, am selben Tag gelernt.

**Die Grenzen** sind echte Grenzen mit deutschen Sätzen: eine Datei höchstens
100 MB (wer mehr hat, sichert als `.redion`), ein Stück höchstens 2 MB roh —
das Gerät schneidet ohnehin bei 1 MB (`KONSTANTEN.STUECK`).

**Gelöscht wird mit Grabstein:** die Stücke gehen weg, die Metadaten bleiben
als `geloescht` stehen. Sonst erfährt das zweite Gerät nie vom Löschen und
lädt die Datei ewig wieder hoch.

**Die Verschlüsselung ist Sache des Geräts.** Wer seine Sätze verschlüsselt,
verschlüsselt auch seine Stücke, bevor sie den Rechner verlassen; der Server
merkt sich nur das Flag. Ein Server, der entschlüsseln kann, wäre der
falsche Server.

**Transport als Base64 im JSON** — bewusst schlicht: derselbe Weg wie alle
anderen, dieselben Körpergrenzen (`/datei` darf 4 MB), kein zweiter
Anfrage-Typ. Der Aufpreis von einem Drittel auf 1-MB-Stücke ist der Preis
für einen Server, der aus einem Guss bleibt. Wenn er je drückt, ist ein
Binär-Weg eine eigene Entscheidung.

**Die Client-Hälfte** kam am selben Tag: `maschine.ts` gleicht Anhänge nach
den Sätzen ab — nie statt ihrer. `wolkeDateienOben` merkt, was der Server
schon hat, `wolkeMarkeDateien` hält die Stand-Marke, `abmelden()` räumt
beide weg. Ein Server ohne Dateispeicher (503) wird einmal erkannt und bis
zum nächsten Laden in Ruhe gelassen. Der Stolperdraht in `test113`
Abschnitt 8 ist planmässig umgedreht: er wacht jetzt darüber, dass die
Wege im Code BLEIBEN.

**Was ausdrücklich offen bleibt** (steht in L6): das LOKALE Löschen einer
Datei wandert noch nicht zum Server — es gibt keinen lokalen Grabstein;
der Download ist eifrig, was am Telefon bei grossen Bereichen Datenvolumen
kostet; das `.redion`-Archiv in R2 als Cloud-Sicherung; und Dateien über
100 MB bleiben bewusst lokal.

**Status**

Beide Hälften beschlossen und umgesetzt (`server/dateien.ts` + Abschnitt 6b
in `maschine.ts`; `test119` 19 Punkte, `test118` Abschnitt 3, `test113`
Abschnitt 8).


## E34 · Der Konto-Modus — anmelden ist nicht zustimmen

**Der Fehler zuerst.** E1 sagt seit dem ersten Tag: lokale Daten werden nie
ohne ausdrückliche Zustimmung hochgeladen. Gestimmt hat das nicht — wer
sich anmeldete und die App neu lud, dessen gesamter Bestand ging beim
ersten Takt zum Server. Niemand hatte je Ja gesagt; das Anmelden galt
stillschweigend als Zustimmung. Das sind aber zwei Entscheidungen: WER man
ist, und WAS dieses Gerät hergibt.

**Beschluss.** Zwischen angemeldet und abgeglichen steht ein Schalter:
`wolkeAbgleich`. Alles, was abgleicht — Takt, Sichtwechsel, das
online-Ereignis, der Knopf — läuft durch `abgleichen()`, und dort steht
das Tor. Nach dem Anmelden stellt die Oberfläche die Frage ausdrücklich;
„Abbrechen" heisst angemeldet bleiben und nur lokal arbeiten. Das
Wolke-Fenster zeigt den Modus als erste Karte und lässt ihn jederzeit
wechseln.

**Bestandsgeräte** bleiben freigeschaltet: wer vor dem Schalter schon
abgeglichen hat, hat sein Ja längst gegeben — die Sync-Marken sind der
Beleg. Ein stiller Sync-Stopp wäre die falsche Sorte Überraschung.
Abmelden setzt den Schalter zurück; das nächste Konto wird neu gefragt.

**Konto löschen** gibt es jetzt wirklich: `/konto/loeschen` räumt die
volle Kaskade — eigene Bereiche samt Sätzen, Dateien und ihren Stücken im
Blob-Speicher, Freigaben, veröffentlichte Seiten, Protokoll, Feldrechte,
dann fremde Freigaben an dieses Konto, Marken, Sitzungen, zuletzt den
Kontosatz. Eine Marke darf das nicht — nur ein Mensch mit Sitzung. Die
Oberfläche verlangt die abgetippte Mail-Adresse: ein Klick zu viel darf
hier nichts kosten. Und die Notizen auf dem Gerät bleiben — Priorität 1
gilt auch beim Aufhören.

**Status**

Beschlossen und umgesetzt. `test120` (Suite 84, 21 Punkte): ohne das Ja
bleibt der Server leer; die Lösch-Kaskade lässt nichts zurück und fremde
Konten in Ruhe; nach dem Löschen sind die lokalen Notizen noch da.


## E35 · Rechte, die wirklich sperren — und Rechte, die wirklich erlauben

**Drei Fehler an einem Nachmittag, und alle drei kommen aus derselben
Richtung:** eine Regel stand da, aber niemand hat sie je gefragt.

**1 · Veröffentlichen nahm jede Unterseite mit.** `seiteAlsHtml` stellte
eine Unterseite mit ihrem Titel dar — „📄 Gehälter" — und hängte danach
ihren ganzen Inhalt an, rekursiv über alle Ebenen. Wer „Projekt X"
veröffentlichte, veröffentlichte alles darunter. Der Mensch sah den Titel
und hielt ihn für einen Verweis; das war er auch, aber der Inhalt stand
zwei Zeilen später trotzdem da.

**Beschluss:** eine Unterseite steht mit ihrem Titel da und sonst nichts.
Wer sie veröffentlichen will, veröffentlicht sie eigens. Der Aufklapper
(`toggle`) geht weiterhin mit — er ist keine eigene Seite, sondern
zusammengeklappter Text derselben.

**2 · Die Kommentarrolle durfte nicht kommentieren.** `ROLLEN` führt das
Recht `kommentieren` seit jeher, und `komm` verspricht es. Geprüft hat es
nie jemand: ein Kommentar ist in Redion das Feld `kommentare` AM BLOCK,
geht also als gewöhnliche Blockänderung durch `/sync/hoch` — und dort
stand nur die Frage nach `bearbeiten`. Der Kommentar blieb auf dem Gerät
des Kommentators stehen, ohne Meldung.

**Beschluss:** `kommentarSchutz` nach dem Muster von `feldSchutz` — der
Satz geht durch, aber nur das Feld `kommentare` (und `edited`, sonst holt
ihn niemand). Alles andere kommt auf seinen alten Wert zurück, statt die
ganze Änderung abzulehnen. Eine reine Textänderung ohne Kommentar wird
abgelehnt und sagt warum.

**Die ehrliche Grenze:** verschlüsselte Sätze kann der Server nicht
beschneiden, weil er sie nicht liest. Das trifft niemanden — eine geteilte
Seite liegt ohnehin im Klartext, sonst könnte der Server sie gar nicht
ausliefern.

**3 · Eine Marke mit „lesen" konnte nichts lesen.** Das Marken-Tor
entscheidet nach HTTP-Methode: POST heisst schreiben. Beide Abgleichswege
sind aber POST — der Filter (`seit`, `bereich`) gehört in den Körper —,
und so bekam ein reines Leserecht auf `/sync/runter` die Antwort „Diese
Marke darf nicht schreiben". Wer eine Marke zum Lesen brauchte, musste ihr
`schreiben` geben: genau das Recht, den ganzen Bestand zu ersetzen, gegen
das dieses Tor einmal gebaut wurde. Das Loch war zugemauert und daneben
eine Tür eingebaut.

**Beschluss:** `sync` und `datei` kommen in die selbstprüfende Familie, wie
`v1` und `mcp` es längst sind. `runter` und `stand` verlangen `lesen`,
`hoch`, `melden`, `stueck` und `weg` verlangen `schreiben` — mit derselben
`darfMarke`, nicht mit einer zweiten Rechnung.

**Status**

Beschlossen und umgesetzt. `test121` (Suite 85, 24 Punkte) hält alle drei
fest, dazu den Widerruf in seinen drei Formen (Seite zurückziehen,
Freigabe entziehen, Marke löschen) und den Satz, der zu G2 gehört: eine
veröffentlichte Seite macht keinen Anhang öffentlich.


## E36 · WENNFEHLER — der Fehler entsteht dort, wo jemand danach fragt

**Die Frage, die seit L4 offen stand.** Excel kennt `WENNFEHLER`. Redion
rechnet abwehrend: `1/0` ergibt 0, `WURZEL(-1)` ergibt 0. Wo kein Fehler
entsteht, gibt es nichts zu fangen — also müsste man das Rechnen
umstellen, um die Funktion überhaupt sinnvoll zu machen.

**Warum das nicht ging.** Eine Umstellung änderte das Ergebnis **jeder
bestehenden Formelspalte in jeder bestehenden Datenbank**: wo heute 0
steht, stünde ein Fehler. Kein Nutzer hat das bestellt, und niemand
bemerkt es, bevor eine Liste rot ist. Priorität 1.

**Beschluss: die strenge Insel.** `WENNFEHLER` und `ISTFEHLER` werten ihr
erstes Argument im strengen Modus aus (E31) — dem, den der Tabellenblock
ohnehin benutzt. Streng gerechnet wird nur, wonach ausdrücklich gefragt
wurde, und nur innerhalb der Klammer. Ausserhalb bleibt alles beim Alten,
und `iferror(1/0, 0) + 1/0` ergibt 0: die zweite Division ist nicht
betroffen.

Dass bestehende Spalten unberührt bleiben, ist deshalb kein Versprechen,
sondern eine Beobachtung: eine bestehende Formel kann diese Funktionen
nicht enthalten, denn es gab sie bis heute nicht.

**Ein Tippfehler bleibt ein Tippfehler.** Excels `IFERROR` schluckt auch
`#NAME?`. Hier nicht — aus demselben Grund, der beim strengen Modus schon
einmal aufgeschrieben wurde: wer einen Tippfehler als Rechenfehler
ausgibt, schickt den Menschen an die falsche Stelle. `WENNFEHLER(SUMEE(A);
0)` ergibt nicht stillschweigend 0, sondern meldet den unbekannten Namen.
Gefangen wird, was mit `#` anfängt; alles andere fliegt weiter.

**Was das für L4 heisst.** Die Architekturfrage bleibt beantwortet, wie sie
in E24 Regel 3 und E31 beantwortet wurde: die Datenbankspalte rechnet
freundlich, die Tabellenzelle streng. Neu ist nur, dass man die Strenge
jetzt auch in einer Datenbankspalte anfordern kann — Zeile für Zeile,
Klammer für Klammer.

**Status**

Beschlossen und umgesetzt. `test123` (Suite 87, 25 Punkte) hält beides
fest: die sieben abwehrenden Fälle rechnen unverändert, und die Insel
bleibt eine Insel.


## E37 · Redion ist zuerst eine Telefon-Seite

**Die Ansage.** Redur, am 6. August: „wir fokusieren uns auf handy nicht auf
laptop ansich! Weil das wird eine handy webseite nich laptop, aber muss auch
für laptop gut funktioniern."

**Was das heisst.** Das Telefon ist nicht mehr die enge Probe, die man am
Schluss noch macht — es ist der Normalfall. Der Rechner bleibt eine
vollwertige Umgebung, aber wenn beide nicht zusammengehen, gewinnt das
Telefon.

**Was sich dadurch ändert:**

```txt
Gebaut wird für 390 px zuerst, der Rechner bekommt den Ausbau danach
Geprüft wird am Telefon-Bildmass, nicht nur am Rechner
Angesehen wird mit bilder.mts am Telefon (§55), bevor etwas fertig heisst
L10 (Mobile) steigt in der Reihenfolge, nicht als Nachtrag
```

**Und was sich NICHT ändert.** Der Rechner darf nicht schlechter werden;
`test114` Abschnitt 4 prüft ausdrücklich die Gegenrichtung („Am Rechner
erscheinen sie weiterhin erst beim Überfahren"). Eine Telefon-Regel, die auf
den Rechner durchschlägt, ist ein Fehler und keine Konsequenz.

**Warum das hier steht und nicht nur im Kopf.** Zwei Fehler desselben Tages
waren reine Telefon-Fehler und wären am Rechner nie aufgefallen: der
Erinnerungsdialog schlug die Zeit in Weltzeit statt Ortszeit vor (zwei
Stunden daneben, in London unsichtbar), und der Fehlerbalken bat um einen
Text, den es nicht gab — gemeldet wurde er vom iPhone. Wer zuerst am Telefon
hinsieht, findet solche Sachen vorher.

**Status**

Beschlossen. `test124` läuft ausdrücklich mit Telefon-Bildmass UND
Zeitzone `Europe/Zurich` — ohne beides kann er nicht rot werden.

---

## E38 · Die Telefon-Navigation: fünf Wege oben, die KI unten

**Die Ansage.** Redur, am 6. August: „Wenn du nicht viel mit AI/Chats arbeiten
wirst, dann sollte der obere Tab nicht ‚Chats' heissen. […] Chats raus aus der
Hauptnavigation. Seiten rein. KI bleibt unten."

**Was oben steht.**

```txt
R          das Blatt mit allem, was sonst in der Seitenleiste stünde
Start      das Armaturenbrett
Seiten     alles, was man geschrieben hat
Termine    Kalender und Besprechungen
Eingang    Meldungen
```

Fünf Wege sind das Höchste, was auf 390 px nebeneinander passt, ohne dass die
Kreise unter 52 px fallen. Jeder weitere Reiter geht nur, wenn ein anderer
geht — das ist keine Enge, sondern die Rechnung.

**Warum „Seiten" und nicht „Chats".** Ein Reiter in der Hauptnavigation kostet
einen von fünf Plätzen. Er verdient ihn, wenn man ihn täglich braucht. Redion
ist eine Notiz- und Wissens-App; man öffnet den ganzen Tag Seiten und selten
einen KI-Verlauf. Der Platz gehört dem, was man oft tut.

**Was der Reiter zeigt.** `Ansichten.seiten()` — zwei Schnellkarten (Neue
Seite, Schnellnotiz), dann Kürzlich verwendet, Favoriten, Privat, Datenbanken,
Vorlagen, Papierkorb. Ein leerer Abschnitt wird gar nicht erst gezeichnet:
eine Überschrift ohne Inhalt sagt nur, dass man etwas nicht hat.

**Die KI verschwindet nicht, sie zieht um.** Sie steht weiterhin

```txt
unten in der festen Leiste als „KI fragen" — der breiteste Knopf dort
im R-Blatt als „KI und Verlauf"
```

Das war die ausdrückliche Bedingung, und `test114` §8 und §9 prüfen beide
Stellen. Ein Reiter weniger ist eine Umsortierung; eine Funktion weniger wäre
ein Verlust.

**Fünf Fehler, die nur das Bildschirmfoto fand** (§55, und deshalb steht das
hier). Kein einziger stand im Code falsch da — alle fünf sah man erst.

Die Pille blieb auf „Start" stehen, während daneben schon die Seiten standen.
`handyLeiste()` liest `Seitenleiste.reiter()`, und den setzte im neuen Zweig
niemand. Kein Prüflauf hatte das — der Inhalt war ja richtig.

Derselbe Fund eine Zeile weiter unten: „Eingang" setzte `reiter('start')`.
Man stand im Posteingang, und oben stand „Start".

Die Titel waren kursiv, weil sie in einem `<em>` steckten. `<em>` heisst
Betonung, nicht Titel; im Browser heisst es schräg. Jetzt `<span class="pt">`.

„Termine" zog die SCHUBLADE auf — die Seitenleiste des Rechners auf 390 px
geschoben, mit ihrem Baum und ihren 33-px-Zeilen. Genau davon war das
R-Blatt weggekommen; ein Reiter, der sie wieder hereinholt, macht die Hälfte
der Entscheidung rückgängig. Jetzt `Ansichten.termine()` auf der Bühne:
Kalender, Besprechung, Bevorstehend, Aus Besprechungen.

Und die Leiste selbst passte gar nicht. Gemessen bei 390 px brauchte sie
395 px mit „Start" und 421 px mit „Eingang" — die letzte Pille stand
ausserhalb des Bildes und war nicht antippbar. Am 428er iPhone fiel das nie
auf, und genau das meint E37 mit „390 zuerst". Unter 420 px rücken Rand
(28→20), Abstand (10→6) und Pillenpolster (13→11) zusammen; die Tasten
bleiben 52 px. Gespart wird am Weissraum, nicht an der Fläche für den Daumen.

**Status**

Beschlossen und gebaut. `test114` §9 und §10 prüfen: „Seiten" steht oben,
„Chats" nicht mehr, jeder Reiter führt dahin, wo er hinführt, die Pille
wandert mit, „Termine" zieht keine Schublade auf, die Titel sind aufrecht,
keine Zeile unter 44 px, „KI fragen" steht weiter unten — und die Leiste
passt bei 375 UND 390 px ganz ins Bild. Alle können rot werden;
nachgestellt am 6. August durch Entfernen der `reiter()`-Zeile, Zurückdrehen
auf `<em>` und Aufweiten der Leiste auf die alten Masse.

---

## E39 · ZIP64 kommt — eine ehrliche Meldung ist keine Sicherung

**Die offene Frage.** `LUECKEN.md` L14 stand seit Wochen auf einem Satz:
„Fehlt: die Entscheidung, ob ZIP64 kommt." Die Grenzen des alten ZIP-Formats
meldeten sich ehrlich, und das galt als guter Stand.

**Was die Messung ergab.** Jeder Sicherungsweg der App — Befehlspalette,
Einstellungen, R-Blatt, Wolke, das Kärtchen auf dem Start-Bildschirm — mündet
in dasselbe `App.sicherungSpeichern()`. Das baut **ein** Archiv mit **allen**
Anhängen. Über 4 GB brach es ab, mit dieser Meldung:

```txt
Diese Sicherung wird grösser als 4 GB. […] Sichere die Anhänge in zwei
Schritten, statt ein Archiv zu bekommen, das sich nicht öffnen lässt.
```

Diesen zweiten Schritt gibt es nicht. Es gibt keine Teilsicherung, keine
Auswahl, kein „nur diese Anhänge". Wer 5 GB Fotos hatte, konnte **gar nicht**
sichern — die `.json`-Sicherung lässt Anhänge ausdrücklich aus.

**Die Entscheidung.** ZIP64 kommt. Nicht weil das Format schöner wäre,
sondern weil §46 Priorität 1 „Daten sicher halten" heisst und der bisherige
Zustand kein Sichern war. Eine ehrliche Fehlermeldung ist besser als ein
kaputtes Archiv — aber sie ist keine Sicherung.

**Nur wenn nötig.** Ein Archiv unter allen drei Grenzen wird byteweise
geschrieben wie bisher: Fassung 20, kein Zusatzfeld, kein zweiter
Schlusssatz. Ein Archiv, das ohne Not ZIP64 wird, sperrt ältere Werkzeuge und
ältere Redion-Fassungen aus. Die Referenz macht es genauso.

**Schreiber und Leser zusammen, nicht nacheinander.** Ein Packer, dessen
Leser nicht mitkommt, schreibt Sicherungen, die niemand zurückholen kann —
das wäre schlechter als der Zustand davor. Beide Wege (`zipLesen` aus dem
Speicher, `zipLesenAusBlob` vom Datenträger) lesen ZIP64 seit demselben
Commit.

**Drei Sachen, die man beim Bauen falsch rät** — alle drei gemessen, keine
geraten:

Die 64-Bit-Zahlen im Verzeichnis stehen **bedingt** da: nur für die Felder,
deren 32-Bit-Feld den Platzhalter trägt, in fester Reihenfolge roh, gepackt,
Versatz. Wer alle drei vorsorglich mitschreibt, verschiebt die folgenden, und
der Leser bekommt Werte, die *fast* stimmen. Abgelesen an
`zipfile._decodeExtra`, und die Gegenprobe zeigt, wie leise das scheitert:
`unzip` merkt es nicht, nur der zweite Anhang kommt falsch zurück.

`schreibe64` darf **nicht** über `>>>` gehen. JavaScripts Bit-Schieber
rechnen in 32 Bit; `4294967296 >>> 0` ist 0. Wer die obere Hälfte so gewinnt,
schreibt lautlos Null in genau das Feld, das den Überlauf abfangen soll.

ZIP64 ist **nicht alles-oder-nichts**. Pythons `zipfile` setzt bei einer
einzelnen grossen Datei die Platzhalter nur in den lokalen Kopf und lässt
Verzeichnis und Schlusssatz gewöhnlich. Solche Archive las Redion schon immer
richtig — deshalb wird jedes Feld einzeln angesehen, nicht das Archiv als
Ganzes eingeordnet.

**Und die Falle, die beinahe zurückkam.** Der erste Entwurf des Lesers nahm
bei unlesbarem ZIP64-Schlusssatz „ersatzweise" die Zahlen aus dem alten. Dort
stehen dann Platzhalter, `blob.slice(0xFFFFFFFF, …)` gibt nichts zurück, und
heraus kamen **null Dateien und kein Fehler** — genau der Fehler, gegen den
`test103` einmal geschrieben wurde. Gefunden hat ihn dieser Prüflauf selbst,
in seiner alten Fassung. Jetzt wird geworfen, und zusätzlich gilt: ein
Archiv, das `N` Einträge ankündigt und keinen liefert, wird abgelehnt.

**Wie das ohne vier Gigabyte geprüft wird.** `Austausch.grenzen` senkt die
Schwelle, sodass dieselbe Verzweigung bei vierzig Byte greift. Das Ergebnis
ist ein vollwertiges ZIP64, nur klein — und **`unzip` und `zipinfo` lesen
es**. Das ist der eigentliche Beweis: „Redion liest, was Redion schrieb"
wäre keiner, denn zwei Fehler, die sich aufheben, bestünden ihn mühelos. Die
Anzahl-Grenze braucht gar keine Absenkung; 70 000 Einträge sind sieben
Megabyte, und `test103` schreibt sie wirklich.

**Was das NICHT löst.** Ob ein Browser einen Blob von 10 GB zusammensetzen
und herunterladen kann, entscheidet der Browser, nicht Redion. ZIP64 nimmt
die Grenze aus dem *Format*; die Grenze der Umgebung bleibt und ist nicht
gemessen. Steht so in `LUECKEN.md` L14.

**Status**

Beschlossen und gebaut. `test103` (36 Punkte, davon 6 mit fremdem Werkzeug),
`test100` Abschnitt 4 umgeschrieben — er hielt bis heute die Gegenrichtung
fest. `doku/REDION-FORMAT.md` beschreibt das Format.

---

## E40 · Meldungen gehören dem Dienst-Skript, nicht dem Fenster

**Der Fund.** Redion zeigte Erinnerungen so:

```js
try { new Notification(text, { … }); } catch {}
```

Auf einem iPhone ist das eine Zeile, die nichts tut. Eine **installierte**
Web-App kennt den Konstruktor `Notification` dort gar nicht — Apple
unterstützt ausschliesslich `ServiceWorkerRegistration.showNotification()`.
Der Aufruf wirft `Illegal constructor`, das `catch` verschluckte es, und
übrig blieb der Hinweis innerhalb der App.

Das ist genau die Funktion, um die Redur gebeten hatte („wenn ich beim
Kalender sage morgen um 08:00 Uhr aufstehen, sollte mir in dieser Uhrzeit
erinnern") — und sie scheiterte auf seinem Gerät lautlos. Ein `catch {}` um
einen Aufruf, der auf einer ganzen Plattform nicht existiert, ist kein
Schutz, sondern ein Deckel.

**Die Entscheidung.** Zuerst der Weg über die Registrierung, `new
Notification` nur noch als Rückfall.

```txt
registration.showNotification()   der einzige Weg, den iOS kennt
new Notification()                Rückfall ohne Dienst-Skript (§6)
```

Er ist nicht nur der einzige, den iOS kann, er ist auch der bessere: eine so
gezeigte Meldung überlebt das Schliessen des Fensters, und der Tipp darauf
landet im Dienst-Skript, das die Seite öffnen kann.

**Und deshalb `notificationclick` im Dienst-Skript.** Bei einer über die
Registrierung gezeigten Meldung greift `notification.onclick` in der Seite
nicht mehr. Ohne diesen Zweig hätte ein Tipp auf die Erinnerung **gar nichts**
geöffnet — die halbe Umstellung wäre schlechter gewesen als keine. Er holt
ein offenes Redion nach vorn, statt ein zweites Fenster aufzumachen; zwei
nebeneinander wären der Anfang jedes Mehr-Tab-Problems (§16).

**Der Fehler, den die eigene Prüfung fand.** Der erste Entwurf wartete auf
`navigator.serviceWorker.ready` — und dieses Versprechen wird **nie
abgelehnt**. Kommt nie ein Dienst-Skript, bleibt es für immer offen. Damit
hätte `geraeteMeldung` die Erinnerung ganz verschluckt, statt sie über den
Rückfall zu zeigen: schlimmer als der Fehler, den sie beheben sollte.
Gefunden hat es der Prüflauf, indem er daran hängenblieb. Jetzt eine Frist
von 1,5 Sekunden, und die Gegenprobe ist eindeutig — ohne sie hängt
`test124` statt rot zu werden.

**Wie man das ohne iPhone prüft.** Nicht mit einem zweiten Browser, sondern
indem man ihm dieselbe Einschränkung gibt: `window.Notification` wird durch
einen Konstruktor ersetzt, der wirft. Bleibt dann eine Meldung übrig, kann
sie nur über die Registrierung gekommen sein. **Der Weg ist der Beweis,
nicht die Absicht.**

**Was das NICHT löst.** Ist Redion geschlossen, meldet sich weiterhin
nichts. Dafür braucht es Web Push — VAPID-Schlüssel, Anmeldung je Gerät,
ein Dienst, der zur richtigen Zeit sendet. Steht als L33 offen; die Hälfte
im Browser ist damit gebaut, die Hälfte auf dem Server fehlt ganz.

**Status**

Beschlossen und gebaut. `test124` Abschnitt 6, elf Punkte. Beide
Gegenproben treffen: ohne den Weg über die Registrierung bleibt keine
Meldung übrig, ohne die Frist hängt der Lauf.

---

## E41 · Ein Dienst-Skript gibt keine umgeleitete Antwort heraus

**Die Meldung.** Redur, 7. August, vom iPhone — Redion als App auf den
Home-Bildschirm gelegt, angetippt:

```txt
Safari kann die Seite nicht öffnen.
Fehler: „Response served by service worker has redirections"
```

Kein Inhalt, keine App. Und eine Meldung, die nicht sagt, woher sie kommt.

**Was dahintersteckt.** Beantwortet ein Dienst-Skript eine
SEITENNAVIGATION mit einer Antwort, die durch eine Umleitung entstanden ist
(`response.redirected`), lehnen die Browser sie ab. Safari sagt den Satz
oben, Chromium sagt „a redirected response was used for a request whose
redirect mode is not follow" — die Wirkung ist dieselbe.

Im Manifest stand `start_url: "/index.html"`, und Cloudflare beantwortet
diesen Weg mit einer Umleitung auf `/`.

**Warum das im Browser nie auffiel, und das ist der lehrreiche Teil.** Ruft
man Redion gewöhnlich auf, folgt der Browser der Umleitung selbst, und das
Dienst-Skript steht dabei nicht im Weg. Die **installierte** App startet
aber genau auf `start_url` — und dort läuft die Anfrage durch das Skript.
Der Fehler traf also ausschliesslich den Fall, den keine Prüfung nachstellte
und den man nur auf einem Gerät sieht.

**Zwei Hälften, und keine ersetzt die andere.**

```txt
Manifest      start_url zeigt auf „/", wo es nichts umzuleiten gibt
Dienst-Skript baut eine umgeleitete Antwort neu auf, bevor sie hinausgeht
```

Nur das Manifest zu ändern wäre eine Reparatur, die vom Wohlverhalten eines
Anbieters abhängt: jede andere Umleitung — ein Wechsel auf HTTPS, ein
Schrägstrich zu viel, eine Anmeldeschleife — träfe wieder die ganze App.
Nur das Skript zu ändern hiesse, bei jedem Start eine Umleitung
hinzunehmen, die niemand braucht.

Neu aufgebaut wird nur bei Navigationen. Bei Skripten und Bildern stört die
Marke nicht, und ein unnötiges Umkopieren des Körpers kostet Speicher.

**Wie das geprüft wird.** `test125` stellt einen Server hin, der
`/index.html` auf `/` umleitet — wie Cloudflare —, registriert das echte
Dienst-Skript und lässt es die Seite kontrollieren. Die Gegenprobe ist
eindeutig: mit abgeschaltetem Schutz endet der Aufruf in `net::ERR_FAILED`
und die Seite bleibt leer. Ein Abschnitt prüft ausserdem, dass der Server
**wirklich** umgeleitet hat — ohne das könnte der Rest gar nicht rot werden.

**Status**

Beschlossen und gebaut. `test125`, 9 Punkte.

---

## E42 · „Mehr" statt „Eingang", und der Kompass gehört hinein

**Woher das kommt.** Redur hat in Claude Design einen vollständigen Entwurf
gebaut — „Nocturne" — und ihn als Übergabepaket geschickt, mit einer
Vorgabe von vierzig Abschnitten. Zwei Sätze darin ändern die Navigation:

> Earlier „Eingang/Posteingang" should be replaced by „Mehr", because help,
> settings, import, backup, shortcuts and compass do not need a permanent
> main tab.

> Kompass is **not** a main tab. Kompass is a normal page/view opened from
> Mehr.

**Was daraus wurde.**

```txt
oben     R · Start · Seiten · Termine · Mehr
Mehr     Kompass · Befehle · Tastenkürzel · Vorlagen
         Sicherung · Importieren · Posteingang · Papierkorb
         Einstellungen · Über Redion
Kompass  eine Seite IN Mehr, kein Reiter
```

**Warum das besser ist als „Eingang".** Ein Platz in der Hauptnavigation ist
einer von fünf. Der Posteingang ist bei den meisten Leuten leer; Sicherung,
Import und Einstellungen braucht man dagegen wirklich. Der Posteingang ist
darum kein eigener Weg mehr, sondern eine Zeile in Mehr — einen Griff
entfernt, nicht weiter als vorher.

**Der Kompass ist der eigentliche Gewinn.** Er ist der einzige Bereich, den
der Entwurf ganz neu erfindet, und er schliesst die Lücke, die keine
Funktion schliesst: Redion kann viel, und nichts davon sagt es von selbst.
Wer nicht weiss, dass es Karteikarten gibt, findet sie nie. Der Kompass
sagt in einer Seite, wie die App aufgebaut ist, welche Befehle es gibt,
welche Tastenkürzel — und was noch nicht fertig ist.

**Und dieser letzte Punkt ist Absicht.** Die Befehle tragen ihren Stand:
`fertig`, `teilweise`, `geplant`. Ein Wegweiser, der Geplantes wie Fertiges
aussehen lässt, ist eine Enttäuschung mit Ansage. „Redion kann" zählt
dagegen aus dem Register — eine von Hand gepflegte Aufzählung erzählt nach
dem dritten neuen Block von einer App, die es nicht mehr gibt.

**Ein Fund beim Bauen.** `handyLeiste()` hatte einen Rückfall:
`karte[reiter] || 'hl-start'`. Der Kompass hat oben keinen Reiter — also
leuchtete beim Öffnen die Start-Pille. Man stand im Kompass, und oben stand
„Start". Derselbe Fehlertyp wie dreimal zuvor (E38), nur diesmal von der
anderen Seite: nicht ein fehlendes `reiter()`, sondern ein Rückfall, der
lieber etwas Falsches behauptet als nichts. Jetzt leuchtet nichts, wenn man
nirgends in der Leiste ist.

**Was aus dem Entwurf noch NICHT gebaut ist** — damit niemand es für
erledigt hält: die Farben von Nocturne (die App hat ihre eigenen), das
Bottom Sheet „Neu erstellen", das KI-Blatt als Blatt, der eigene
Suchbildschirm, die Ladeskelette und der Speicherbalken im R-Blatt. Steht
in `LUECKEN.md` L10.

**Status**

Gebaut: der Reiter „Mehr", der Bereich Mehr mit drei Gruppen, der Kompass
als Seite darin. `test114` (57 Punkte), `test37`, `test40`, `test67`
mitgezogen.

---

## E43 · Bewegung: drei Dauern, drei Kurven, keine Federn

**Woher das kommt.** Redurs Vorgabe zum Bewegungssystem, und der Satz, der
sie zusammenfasst: *„Animations must improve clarity, not distract."*

**Was gemessen wurde, bevor gebaut wurde.** Rund achtunddreissig Übergänge
in sieben Stilblättern — und **kein einziger gemeinsamer Wert**. `.14s`
hier, `200ms` dort, `.22s` im Blatt. Wer die App als Ganzes ruhiger oder
schneller machen wollte, musste sie einzeln suchen.

Was dagegen schon stimmte und deshalb NICHT angefasst wurde: die
Abschaltung. `bausteine.css` hat eine globale Regel auf `*`, die bei
`prefers-reduced-motion` jede Dauer auf 0.001ms setzt. Der erste Blick
zählte vier Fundstellen und hielt das für lückenhaft — die eine davon deckt
alles ab.

**Die Marken.**

```txt
--motion-fast    120ms   Berührung, Knopfdruck — es soll SOFORT wirken
--motion-normal  220ms   Reiterwechsel, Seitenwechsel, Hinweis
--motion-slow    320ms   Blätter von unten; sie dürfen schwer wirken

--ease-standard  cubic-bezier(0.2, 0.8, 0.2, 1)
--ease-enter     cubic-bezier(0.16, 1, 0.3, 1)
--ease-exit      cubic-bezier(0.4, 0, 1, 1)

--press-scale       0.96    Knopf
--card-press-scale  0.985   Karte
```

Die Kurven sind nicht Geschmack. `ease-enter` startet schnell und bremst
weich aus — was hereinkommt, soll ankommen, nicht anschweben. `ease-exit`
macht es umgekehrt. Beides linear ist das, was billige Oberflächen von
teuren unterscheidet.

**Keine Federn, und das wird geprüft.** Eine Kurve mit einem Wert über 1
schwingt über das Ziel hinaus. Beim ersten Mal nett, beim fünfzigsten eine
Verzögerung — Redion ist ein Arbeitsgerät. `test126` rechnet die
Bezier-Werte nach und wird rot, wenn jemand eine Feder einbaut.

**Warum die Berührungsrückmeldung mehr ist als Zierrat.** Am Telefon gibt
es kein Hover. Ohne `:active` antwortet auf eine Berührung **gar nichts**,
und bis die neue Ansicht steht, weiss man nicht, ob man getroffen hat. Bei
200 ms sind das 200 ms Zweifel — und Zweifel führen zum zweiten Tippen.

Bewegt werden ausschliesslich `transform` und `opacity`. Nur diese beiden
zeichnet der Browser ohne den Aufbau neu zu rechnen; eine Höhe zu
animieren sieht am Rechner gleich aus und ruckelt am Telefon. `test126`
prüft auch das.

**Ein Fehler in der Prüfung, nicht im Code.** Der erste Entwurf suchte
Ziffern im Text der Dauer und scheiterte an `1e-06s` — so schreibt der
Browser die 0.001ms der Abschaltregel. Der Lauf war rot, die App richtig.
Eine Prüfung, die Zeichen vergleicht statt Zahlen, misst die Schreibweise.

**Status**

`test126`, 12 Punkte, mit Gegenprobe: Feder eingebaut → rot, Dauer
verdreht → rot. Die Abschaltung wird mit einem Browser geprüft, der
`reducedMotion: 'reduce'` wirklich gesetzt hat.

**Was aus der Bewegungs-Vorgabe noch fehlt:** die gleitende Pille beim
Reiterwechsel, die versetzt einblendenden Listenzeilen, das Schimmern der
Ladeskelette, die Zustandswechsel der Sicherungskarte. Steht in `L10`.

---

## E44 · Nocturne — Redion bekommt eigene Farben

**Die grosse Änderung.** Redion trug im Kern Notions Palette: `#191919` und
ein Himmelblau. Das war ein guter Anfang und die falsche Identität — die
Vorgabe sagt „inspired by Notion Mobile, but it must not be a direct copy",
und die Farben sind die Stelle, an der man das zuerst sieht.

```txt
Grund      #191919 → #141414        näher an Schwarz
Fläche     #202020 → #1a1a1a
Karte      #252525 → #202020
Ränder     feste Grauwerte → rgba(255,255,255,.08/.12/.18)
Text       #e9e9e7 → #f2f2f2        16.5:1 statt 14.5:1
Akzent     #2eaadc → #f97316        warm, nicht blau
```

**Die Ränder sind jetzt durchscheinend**, und das ist mehr als Kosmetik.
Ein fester Grauwert stimmt auf genau einer Fläche; derselbe Rand auf einer
Karte ist plötzlich zu dunkel. `rgba` über Weiss verhält sich überall
gleich — hellerer Grund, hellerer Rand.

**Der Akzent ist orange, nicht rot, und eine Rechnung hat das entschieden.**
Die Vorgabe nennt `#EF4444` gleichzeitig als Akzent UND als Gefahr. Zwei
Gründe dagegen, beide gemessen:

```txt
#EF4444 auf einer Karte   4.33:1   unter der Grenze für Text
#F97316 auf einer Karte   5.81:1   darüber
Akzent = Gefahr           →        „Sichern" sieht aus wie „Löschen"
```

Rot bleibt deshalb, was es sein muss: das Zeichen für etwas
Unwiderrufliches. `test127` prüft beides und wird rot, wenn jemand den
Vorschlag der Vorgabe wörtlich nimmt — nachgestellt.

**Ein Fehler, der den ganzen Umstieg unsichtbar gemacht hätte.** Die
Schemata „Standard" und „Hell" setzten den Akzent per `style.setProperty`
auf `documentElement`. Ein Inline-Stil schlägt jedes Stilblatt: die neue
Farbe stand in `dunkel.css` und kam nie auf dem Bildschirm an. Schlimmer —
EIN Inline-Wert kann für hell und dunkel nicht beide richtig sein. Das
Orange mit 6.6:1 auf Schwarz kommt auf Weiss auf **2.80:1**. Beide
Standard-Schemata tragen jetzt gar keinen Akzent; die Stilblätter bringen
ihren eigenen, nachgerechneten mit.

**Und ein Fund, der älter ist als diese Änderung.** `test127` misst auch
den Hellmodus, und dort lagen zwei Werte aus Notions Palette seit jeher
unter der Grenze:

```txt
--text-dim   #787774   4.17:1 auf der Karte   nötig 4.5
--text-faint #9b9a97   2.62:1 auf der Karte   nötig 3.0
```

Auf Weiss ging der erste gerade so durch (4.48) — auf einer Karte nicht
mehr. Genau diese Sorte Fehler sieht man nicht: 4.4:1 und 4.6:1 wirken
gleich, und nur eines davon kann jemand mit schwachen Augen lesen. Jetzt
`#66655f` und `#82817e`.

**Was NICHT angefasst wurde:** die zehn Block- und Hintergrundfarben
(`--c-*`, `--b-*`). Die wählt der Nutzer für seine eigenen Blöcke aus; sie
sind Inhalt, nicht Oberfläche. Und die anderen Schemata (Mitternacht,
Wald, Sand) bringen weiter ihre eigenen Flächen und Akzente mit.

**Status**

`test127`, 20 Punkte, beide Modi, gerechnet am laufenden Browser statt an
den Stilblättern — was zählt, ist der Wert, der am Ende gilt.

---

## E45 · Ein Blatt hinter dem Stift, statt sofort einer leeren Seite

**Aus der Vorgabe §18:** der ⊕-Knopf soll fragen, WAS entstehen soll —
Seite, Datenbank, Aufgabe, Notiz, Tabelle, Import.

**Vorher entstand sofort eine leere Seite.** Das ist die richtige Antwort
in genau einem von sechs Fällen. In den anderen fünf muss man danach etwas
umbauen, das man gar nicht wollte: erst eine Seite, dann darin einen
Datenbankblock, dann die Ansicht wählen. Drei Schritte für etwas, das ein
Tipp sein sollte.

**Acht Zeilen, nicht sechs.** Dazugekommen sind „Von einer Vorlage" und
„Sicherung einlesen". Die zweite ist die wichtigere und sieht am
unwichtigsten aus: wer gerade das Gerät gewechselt hat, will nicht
anfangen, sondern zurückholen — und sucht das dann in den Einstellungen.

**Der Unterschied zwischen Rechner und Telefon bleibt.** Am Rechner ist
der ⊕ ein Knopf unter vielen, und wer ihn drückt, will meistens genau eine
Seite; dort passiert weiterhin sofort das Erwartete. Am Telefon ist er
einer von fünf Wegen überhaupt — dort lohnt die Frage.

**Was das Blatt intern tut, sieht man ihm nicht an.** „Datenbank",
„Tabelle" und „Aufgabe" legen zuerst eine Seite an und setzen den Block
hinein. Ein Datenbankblock ohne Seite hat keinen Ort, an dem er stehen
kann — das ist keine Bequemlichkeit, sondern das Datenmodell.

**Status**

`test114` §12, 7 Punkte.

---

## E46 · Ladeskelette statt Kreisel

**Aus der Vorgabe §23:** „Use skeletons, not random spinners everywhere."

**Der Grund ist nicht Mode.** Ein Kreisel sagt „warte". Ein Skelett sagt
„hier kommen sechs Zeilen mit einem Symbol links und einem Datum rechts" —
man weiss, was gleich dasteht, das Auge hat schon einen Platz dafür, und
wenn der Inhalt kommt, springt nichts.

**Drei Kleinigkeiten, die den Unterschied machen:**

Die Strichbreiten sind **ungleich** (62 %, 48 %, 71 %, …). Sechs gleich
lange Balken sehen aus wie ein Muster; ungleiche sehen aus wie Text, und
genau darum geht es.

Die Zeilen atmen **versetzt**, 120 ms Abstand. Sonst pulsiert die ganze
Liste wie ein Block — und das wirkt wie ein Fehler statt wie Warten.

Das Atmen ist **leise**: von .35 auf .7 über 1,4 Sekunden. Die Vorgabe sagt
„very subtle shimmer" und „do not use bright shimmer". Ein Skelett, das
blitzt, zieht die Aufmerksamkeit auf das Warten statt auf das, was kommt.

**Und eine Frist.** `beimLaden()` zeigt das Skelett erst nach 180 ms. Ein
Skelett, das bei jedem Wechsel aufblitzt, ist schlimmer als keines — die
Ansicht flackert. Darunter merkt ohnehin niemand, dass geladen wurde.

Wer keine Bewegung mag, bekommt keine: die globale Regel hält auch diese
Animation an, und ein stehendes Skelett erfüllt seinen Zweck weiterhin —
es zeigt die Form.

**Status**

`test126` §5, 6 Punkte. Gegenprobe: Dauer auf 0,3 s gesetzt → rot.

---

## E47 · Zeilen kommen versetzt herein — aber nur die ersten neun

**Aus der Bewegungs-Vorgabe:** „list items stagger in, 20–30 ms apart".

**Warum überhaupt.** Erscheint eine Liste als Block, sieht das Auge einen
Sprung: „da war nichts, jetzt ist alles da" — und muss von vorn anfangen.
Kommen die Zeilen nacheinander von oben nach unten, folgt der Blick der
Bewegung in Leserichtung und ist am Ende der Animation schon bei der
ersten Zeile.

**Die Obergrenze ist der eigentliche Beschluss.** Bei 20 ms je Zeile und
zwanzig Zeilen sind das 400 ms, in denen die Liste noch nicht steht. Das
ist keine Bewegung mehr, das ist Warten — und Warten, das man selbst
eingebaut hat, ist die schlechteste Sorte.

Deshalb bekommen nur die **ersten neun** Zeilen eine Verzögerung. Zeile
zehn und alles darunter erscheint mit Zeile neun. Wer so weit unten liest,
hat ohnehin gescrollt und die Ankunft nie gesehen.

```css
.zeile-hoch:nth-child(1) { animation-delay:0ms }
…
.zeile-hoch:nth-child(9) { animation-delay:160ms }
/* ab 10: keine Verzögerung */
```

**Und wer keine Bewegung mag, bekommt keine.** `prefers-reduced-motion`
hält auch diese Staffel an — die Liste erscheint dann vollständig, was
genau der Zustand vorher war.

**Status**

`test126` §6, 4 Punkte. Gegenprobe: Staffel versechsfacht → rot.

---

## E48 · Die Suchfilter sind am Telefon Marken, nicht Auswahlfelder

**Aus der Vorgabe §17:** die Suche gehört zu den fünf Wegen, die am
Telefon zählen — und sie soll dort nicht wie ein Formular aussehen.

**Vier `<select>` nebeneinander sind am Rechner richtig.** Sie sind
kompakt, man sieht auf einen Blick, was eingestellt ist, und ein Klick
öffnet eine kleine Liste neben dem Feld. Am Telefon ist jede dieser drei
Eigenschaften weg:

Ein `<select>` öffnet dort ein **Systemrad über den halben Bildschirm**.
Für „nur Titel" statt „Titel und Inhalt" sind das drei Handgriffe, und
währenddessen sieht man die Trefferliste gar nicht mehr.

Vier Felder **brechen um** in zwei Reihen. Das kostet rund 100 px — genau
die 100 px, in denen die Treffer stehen sollen.

**Also: eine Reihe runder Marken, die seitwärts rollt.** 42 px hoch, mit
eigenem Pfeil (der vom System sitzt am Telefon anders und zerschneidet die
runde Form). Wer den vierten Filter braucht, wischt einmal — das ist
billiger als eine zweite Reihe, die immer da ist.

**Ein gesetzter Filter ist heller als ein leerer.** `select:not(.leer)`
bekommt Kartenfläche und vollen Text. Das ist kein Schmuck: ein Filter,
den man nicht sieht, lässt einen in einem Ausschnitt suchen, ohne es zu
wissen — und das Ergebnis ist dann „Redion findet meine Seite nicht".

**Zwei Funde beim Hinsehen** (CLAUDE.md §55 — Bild machen, nicht Code
lesen), beide unsichtbar für jede bestehende Prüfung:

Der Platzhalter brach ab. Statt der sechs Suchbefehle stand da „Suchen —
auch typ:seite, in:Projekte, nach:202". Ein Satz, der mitten im Wort
endet, liest sich wie ein Fehler. Am Telefon steht dort jetzt „Seiten und
Inhalte suchen" — die Befehle bleiben in der Fusszeile, wo sie ganz
hinpassen.

Die Fusszeile nannte **„↑ ↓ auswählen · Enter öffnen · Esc schliessen"**.
Keine dieser drei Tasten gibt es auf einer Telefontastatur. Das war eine
Anleitung für ein anderes Gerät, sie nahm die Höhe von zwei Treffern weg,
und sie stimmte kein einziges Mal. Am Telefon ist sie weg; die
Suchbefehle daneben gelten überall und bleiben — in einer Zeile, die
seitwärts rollt.

**Am Rechner ändert sich nichts.** Die ganze Regel steht unter
`@media(max-width:760px)`.

**Status**

`test114` §16, 8 Punkte. Gegenprobe: Marken-Block entfernt, `eng` auf
`false`, `.leer` immer gesetzt → 7 von 8 rot. Der achte („die Suchbefehle
bleiben") bleibt absichtlich grün — er prüft, dass die Fusszeile nicht
komplett verschwindet.

---

## E49 · Die Reiterpille wandert, statt zu springen

**Aus der Bewegungs-Vorgabe:** „active tab indicator slides".

**Warum das kein Schmuck ist.** Verschwindet die Fläche an einer Stelle
und taucht an der nächsten auf, liest das Auge „hier ist etwas Neues" und
muss die Stelle erst suchen. Wandert sie, folgt der Blick von selbst mit
und ist beim Ankommen schon dort. Der Unterschied ist ein Sekundenbruchteil
— aber es ist der Bruchteil, in dem man sonst kurz nicht weiss, wo man ist.

**Ein eigenes Feld statt eines Knopfhintergrunds.** `#ho-pille` liegt hinter
den Reitern, nimmt keine Berührung an und trägt aria-hidden — Vorleseprogramme
sollen vier Reiter finden, nicht fünf Dinge. Der aktive Knopf gibt seinen
Hintergrund dafür ab; stünden beide da, käme die wandernde Fläche bei einer
schon fertigen an, und die Bewegung würde nichts mehr erklären.

**Drei Stellen, an denen das leicht schiefgeht — alle drei geprüft:**

*Gemessen wird nach dem Setzen von `.an`.* Die aktive Pille zeigt als
einzige ihre Beschriftung und ist deshalb breiter als vorher. Wer vorher
misst, bekommt die alte Breite, und die Fläche endet einen Zentimeter zu
kurz.

*`offsetLeft`, nicht `getBoundingClientRect()`.* Die Leiste rollt seitwärts;
die Pille liegt IN ihr und rollt mit. Der Bildschirmort wäre der falsche
Bezug — bei gerollter Leiste stünde sie richtig im Bild und falsch im Inhalt.

*Beim Start darf sie nicht gleiten.* Sonst schiebt sie sich beim Öffnen der
App von der linken Kante herein — eine Bewegung ohne Anlass, und die liest
sich als Fehler.

**Verschiebung statt `left`.** `translateX` bewegt nur den fertigen
Bildinhalt; `left` rechnet die Leiste neu. Auf einem älteren Telefon ist
das der Unterschied zwischen weich und ruckelig. Die Breite muss leider
bleiben, wie sie ist — für sie gibt es keine Verschiebung.

**Wo kein Reiter zuständig ist, ist auch keine Pille.** „Kompass" hat oben
keinen (E42). Sie bleibt dann stehen und verschwindet, statt an den Anfang
zu rutschen: das wäre eine Aussage, und zwar eine falsche.

**Und der Reiter wird hereingeholt,** wenn er halb ausserhalb steht. Bei
390 px passen die fünf Wege nicht alle ins Bild; ohne das tippt man auf
„Mehr" und sieht danach nicht, dass man dort ist. Wer keine Bewegung mag,
bekommt den Sprung statt des Rollens.

**Status**

`test114` §17, 7 Punkte. Die Gegenprobe hat dabei etwas gezeigt, das man
sonst nie gemerkt hätte: die Sperre gegen das Hereingleiten ist heute
wirkungslos, weil ein Übergang gar nicht erst startet, solange der
Ausgangswert nie gemalt wurde. Sie greift erst, wenn jemand im Stilblatt
Anfangswerte einträgt, die wirklich gemalt werden — mit
`width:40px; transform:translateX(0)` glitt die Pille prompt über elf
Zwischenorte herein und der Punkt wurde rot. Die Zeile ist also keine tote
Vorsicht, sondern die Sicherung dagegen; das steht jetzt auch im Stilblatt.

---

## E50 · Die obere Leiste: 56 px, und ihre Höhe steht an EINER Stelle

**Aus dem Entwurf:** 56 px hohe Tasten. Gebaut waren 52 — und unten, in der
Aktionsleiste, standen längst 56. Zwei Zahlen für dieselbe Sache.

**Der eigentliche Fund lag darunter.** Die Pillenleiste steht fest oben und
rechnet sich aus 12 + 52 + 12 plus der Kerbe des Geräts. Der Platz darunter
war eine getippte Zahl:

```css
#handy-oben{ padding: calc(12px + env(safe-area-inset-top)) 28px 12px }
#main      { padding-top: 60px }
```

Gemessen am 7. August bei 390 px: die Leiste 76 px hoch, freigehalten
60 px. **Die obersten 16 px des Zurück-Knopfes lagen dahinter** — und die
Leiste ist undurchsichtig, es war also nicht nur ein Klickproblem.

Am iPhone ist es schlimmer, und zwar systematisch: dort legt die Kerbe
noch 47 px dazu — aber nur in der Leiste, nicht im Platz darunter. Aus
16 px Überdeckung werden 63, also die ganze Zeile. Genau die Sorte Fehler,
die auf keinem Entwicklerrechner auftaucht.

**Jetzt eine Marke statt zweier Zahlen:**

```css
:root { --hoben: calc(80px + env(safe-area-inset-top)) }
#main { padding-top: var(--hoben) }
```

**Und was das Wachsen sonst noch kippte.** Vier Tasten mal vier Pixel sind
16 px, und die haben zwei Breiten aus dem Bild geschoben:

```txt
Breite   längster Reiter („Termine")    davor
428 px   435 px  →  passte nicht        423 px  passte knapp
390 px   395 px  →  passte nicht        379 px  passte
```

Gespart wird am Weissraum, nie an der Fläche, die der Daumen trifft. Die
Stufen rücken deshalb früher zusammen — ab 440 px (das nimmt das 428er
iPhone mit, das vorher ausserhalb jeder Regel stand) und noch einmal ab
380 px. Damit passt jede gängige Telefonbreite: 428, 393, 390, 375, 360.
Bei 320 px rollt die Leiste, und `pilleSchieben()` holt den gewählten
Reiter ins Bild.

**Und die Prüfung, die das nicht fand, war das dritte Problem.** Sie kannte
375 und 390 — aber nicht 428. Die eine Breite, die niemand prüfte, war
ausgerechnet die häufigste grosse. Sie prüft jetzt alle fünf, und dazu, dass
der freigehaltene Platz genau der Leistenhöhe entspricht.

Was dieser Rechner nicht nachmessen kann, ist die Kerbe: hier ist sie 0, und
dann stimmen die beiden Zahlen auch dann, wenn nur eine sie mitrechnet.
Geprüft wird deshalb zusätzlich, dass `--hoben` das `env(safe-area-inset-top)`
überhaupt enthält — abgelesen am Stilblatt, nicht am gerechneten Wert, denn
der sagt hier nur `calc(80px + 0px)`.

**Status**

`test114` §11, jetzt 15 Punkte. Gegenprobe: `--hoben` auf `60px` gesetzt →
6 rot.

---

## E51 · Dialoge werden an EINER Stelle zu Dialogen

**Aus `LUECKEN.md` L12** — Barrierefreiheit stand seit Monaten auf „◐
Grundlagen da, nicht geprüft" und nannte fünf Punkte. Gemessen am
7. August waren zwei in Ordnung und drei nicht:

```txt
✓ Fokus sichtbar      2 px Rahmen in der Akzentfarbe, überall
✓ Escape schliesst    Suche, Befehle, Einstellungen, Papierkorb
✗ nur über Farbe      der rote Punkt „ungelesen" war leer und still
✗ Fokusreihenfolge    blieb hinter dem Dialog, lief mit Tab hinaus,
                      kam nie zurück
✗ Vorlesen            null Überschriften, Meldungen stumm, Reiter
                      ohne `aria-selected`
```

**Das Problem war nicht 106 Fehler, sondern einer.** Redion baut seine
Überlagerungen an 106 Stellen, jedes Mal als `<div class="overlay">` an
`<body>`. Allen fehlte dasselbe, und keine dieser Stellen war schuld:

- **Keine Rolle.** Für ein Vorleseprogramm ist so ein `<div>` kein Dialog,
  sondern Text am Ende des Dokuments.
- **Der Fokus blieb draussen.** Die Einstellungen gingen auf, die Tastatur
  stand weiter auf dem Knopf dahinter.
- **Tab lief hinaus.** Nach zwölf Tabs stand der Fokus in der Seitenleiste
  hinter dem Dialog — unter der Überlagerung, also unsichtbar. Man tippte
  ins Nichts.
- **Und er kam nicht zurück.** Nach dem Schliessen: `<body>`. Das nächste
  Tab fing wieder ganz oben an, bei jedem Menü, jedes Mal.

**Also ein Beobachter statt 106 Änderungen.**
`src/schale/ueberlagerung/fokus.ts` sieht zu, was an `<body>` gehängt wird,
und legt Rolle, `aria-modal`, einen Namen, den Fokus, die Tab-Falle und die
Rückkehr auf. Das ist nicht nur weniger Arbeit: die 107. Überlagerung
bekommt es auch, ohne dass jemand daran denkt.

**Was er ausdrücklich NICHT tut:** er nimmt niemandem den Fokus weg, der
schon gesetzt wurde. Die Suche setzt ihn auf ihr Feld, der Papierkorb auf
seins. Wer das überschreibt, macht drei richtige Dialoge kaputt, um einen
falschen zu heilen.

**Eine Reihenfolge, die beim Bauen zuschlug.** Ein Beobachter meldet sich
erst nach dem laufenden Durchgang — und die meisten Dialoge setzen ihren
Fokus noch darin, direkt nach dem `appendChild`. Wer beim Anmelden nach dem
aktiven Element fragt, bekommt deshalb ein Feld IM Dialog, merkt sich das
als Herkunft, und beim Schliessen ist es längst weg. Von vier Dialogen
kehrte genau einer zurück: ausgerechnet der, der seinen Fokus gar nicht
setzte. Deshalb wird die letzte Stelle AUSSERHALB jeder Überlagerung
laufend mitgeschrieben.

**Und was sonst noch dazugehörte:**

*Überschriften.* Jeder Block ist ein `<div>`, auch `h1`, `h2` und `h3`.
Sichtbar durch ihre Grösse, hörbar durch gar nichts — eine Seite mit Titel
und Überschrift ergab null Sprungmarken. Jetzt `role="heading"` mit
`aria-level`, und zwar auf dem Textfeld statt auf dem Blockkasten: der
enthält auch die Griffe ✚ und ⋮⋮, die Überschrift hiesse sonst
„+ ⋮⋮ Eine Überschrift". Eine Stufe tiefer als der Blockname sagt, denn die
Stufe 1 gehört dem Seitentitel; zwei Einsen auf einer Seite heissen beim
Vorlesen „hier fangen zwei Dokumente an".

*Der Fenstertitel* stand dauerhaft auf „Redion". In einem Fenster unter
zwanzig anderen ist das keine Auskunft, ein Lesezeichen darauf heisst
später auch nur so, und ein Vorleseprogramm nennt ihn bei jedem Wechsel —
es sagte also immer dasselbe. Jetzt „Projekte — Redion".

*Meldungen.* `#toast` bekam `role="status"` und `aria-live="polite"`.
Ohne das erscheint „Gespeichert" nur auf dem Bildschirm; wer zuhört,
erfährt es nie, auch nicht als Auslöser.

*Der rote Punkt* am Reiter heisst „hier liegt Ungelesenes". Er ist rund,
acht Pixel gross und leer. Jetzt ist er `aria-hidden` — er ist das Bild —
und die Zahl steht im Namen des Knopfes: „Mehr, 3 ungelesen". Und
verschwindet wieder; ein Knopf, der dauerhaft „0 ungelesen" heisst, ist
schlimmer als keiner.

Dabei fiel ein zweiter Punkt auf, an „Seiten". Ein Rest aus der Zeit, als
der Reiter „Chats" hiess (E38) — angezeigt wurde er nie, weil nur der
erste gefundene gesetzt wurde. Er hätte ungelesene Nachrichten an einem
Ort gemeldet, an dem keine liegen. Der Posteingang steht seit E42 unter
„Mehr", und dort steht jetzt auch der Punkt.

*Die Reiter.* `role="tab"` ohne `aria-selected` meldet vier gleichrangige
Reiter; wo man steht, stand einzig in der Farbe der Pille. Am Rechner sind
es keine Reiter, sondern Verweise — dort ist `aria-current="page"` das
richtige Wort.

**Was offen bleibt:** ein Durchlauf mit einem echten Vorleseprogramm.
Dieser Lauf prüft, worauf jedes von ihnen angewiesen ist — Rollen, Namen,
Zustände, den Weg der Tastatur. Das ist nicht dasselbe wie VoiceOver, und
L12 sagt das weiterhin.

**Status**

`test128` (Suite 92), 46 Punkte. Gegenprobe: Beobachter stillgelegt,
Überschriften-Rollen, Live-Bereich, Punktname und `aria-selected` entfernt
→ 25 von 46 rot.

Und eine Falle fürs nächste Mal: `getComputedStyle` gibt ein LEBENDES
Objekt zurück. Zweimal daraus lesen — vor und nach `focus()` — liefert
zweimal den Zustand von nachher. Die erste Fassung meldete deshalb „der
Fokus ändert nichts", obwohl er einen 2-px-Rahmen setzt.

---

## E52 · Grenzen für Agenten — und der gefährliche Fall ist der unbeaufsichtigte

**Aus `LUECKEN.md` L11**, dem einzigen Eintrag mit „✗ es gibt keine
Grenzen". Nachgesehen am 8. August gab es zwei der fünf genannten Dinge
längst; sie standen nur nicht in der Liste:

```txt
✓ Rechte je Agent   jedes Werkzeug trägt `recht`, gefiltert über
                    `Konten.darf` — ein Agent kann nie mehr als du
✓ Protokoll         `agent:laeufe`, die letzten 30 samt Rücknahme
```

Drei fehlten wirklich, und alle drei betreffen denselben Fall.

**Notausschalter.** Ein Agent, der Unsinn baute, liess sich nur dadurch
anhalten, dass man das Fenster schloss — und die Auslöser liefen weiter,
auch beim nächsten Öffnen. Jetzt ein Schalter, der zuerst in
`ausloeserPruefen()` greift und dann in jedem Schleifendurchgang von
`laufen()`: er wirkt sofort, nicht erst beim nächsten Auftrag. Sonst wäre
er kein Notaus.

**Tageslimit.** Das Guthaben eines Agenten gilt JE LAUF. Ein täglicher
Auslöser war damit unbegrenzt: acht Schritte, jeden Tag, ohne Ende — und
wer den Auslöser vergessen hat, merkt es nie, weil niemand danebensteht.
Jetzt eine gemeinsame Zahl für alle Agenten zusammen, Vorgabe 120
Schritte, geprüft **auch mitten im Lauf**. Ohne das wäre es keine Grenze,
sondern eine Bedingung fürs Anfangen: der letzte Lauf käme immer noch mit
vollem Guthaben durch, egal wie voll der Tag schon war.

Der Tag wechselt um Mitternacht **Ortszeit**, nicht UTC — dieselbe Falle
wie bei den Erinnerungen (E31).

**Bestätigung vor der Änderung.** Zurücknehmen gab es, aber nur für
ANGELEGTES: was ein Agent überschrieben hat, war weg. Also wird davor
gefragt, mit dem Werkzeug, dem Vorhaben und den Argumenten im Text — „Der
Agent möchte etwas ändern" ist keine Grundlage für ein Ja.

Drei Antworten, nicht zwei: *Nicht ändern* · *Einmal erlauben* · *Für
diesen Lauf erlauben*. Die dritte ist der Unterschied zwischen einer
Sicherung, die man benutzt, und einer, die man nach dem vierten Dialog
abschaltet.

**Und die eigentliche Regel: ohne Aufsicht nur lesen.**

Wer auf „Loslegen" drückt, sieht zu und kann eingreifen. Ein Auslöser um
acht Uhr früh läuft, während niemand hinsieht — dort ist eine Rückfrage
kein Schutz, sondern eine Sperre, die nie beantwortet wird. Ein
unbeaufsichtigter Lauf bekommt deshalb gar keine ändernden Werkzeuge; er
liest, berichtet und schreibt Vorschläge in seine Antwort. Wer es anders
will, setzt beim Agenten „darf auch ohne Aufsicht ändern" — eine
ausdrückliche Erlaubnis mit einem Satz daneben, was sie bedeutet.

**Der Fehler, den der Prüflauf gefunden hat, war genau in dieser Naht.**
Ein Agent mit „darf allein" bekam sein Werkzeug zurück — und danach die
Rückfrage. Der Prüflauf blieb dort stehen; in der App wäre der Lauf bis
zum nächsten Klick irgendwo hängen geblieben, mit einem Dialog über dem
Bildschirm, den niemand erwartet hatte. „Darf allein" heisst: ohne mich.
Dann auch ohne Frage.

**Ein abgebrochener Lauf ist trotzdem ein Lauf** und kommt mitsamt Grund
ins Protokoll. Sonst sucht man später den Agenten, der „nichts getan hat".

**Der Streifen im Agentenfenster** nennt den Tagesstand und trägt den
Schalter — ganz oben, nicht in einem Untermenü: wer ihn sucht, sucht ihn,
weil gerade etwas schiefläuft. Steht er, wird der Streifen rot UND sagt es
in Worten. Eine rote Fläche allein wäre eine Auskunft nur über Farbe
(CLAUDE.md §38), und ausgerechnet bei einer Sicherung darf man nicht raten
müssen, ob sie greift.

**Status**

`test129` (Suite 93), 26 Punkte. Gegenprobe: Notaus, Tageslimit,
Rückfrage und die Leseregel einzeln stillgelegt → 15 von 26 rot.

Und ein Hinweis für den nächsten Prüfstand dieser Art: die Ersatz-KI
braucht ihren Zähler AUSSERHALB der Rüstfunktion. Lag er innen, lief er
über mehrere Läufe hinweg weiter, der dritte bekam sofort „fertig" — und
die Prüfung meldete einen Fehler in Redion, den es nicht gab.

---

## E53 · Bedingte Formatierung — im Tabellenblock, wo das Wort herkommt

**Aus `LUECKEN.md` L15.** Der Eintrag nannte fünf Dinge: Zell- und
Zeilenfarbe nach Regel, Datenbalken, Farbskalen, Symbolregeln, Duplikate
und überfällige Werte. Nachgesehen am 8. August war die Hälfte längst da —
aber in den **Datenbanken**: `farbregeln` färbt dort ganze Zeilen, und die
Spaltenanzeige kennt `skala`, `heat`, `bar` und `ring`. Im
**Tabellenblock**, wo der Begriff herkommt, gab es nichts davon.

**Die Regel gehört dem Blatt, nicht der Zelle.** Der Unterschied ist nicht
kosmetisch: eine Farbe an der Zelle müsste bei jeder Änderung mitgeführt,
beim Einfügen einer Zeile verschoben und beim Löschen aufgeräumt werden.
Eine Regel am Blatt beschreibt stattdessen, WANN gefärbt wird, und
überlebt jede Umstellung der Daten darunter.

**Und sie ändert die Daten nicht.** Was `wert` sagt, bleibt, was es war —
eine bedingte Farbe ist eine Sicht darauf, keine Bearbeitung. Deshalb
lässt sie sich abschalten, ohne dass etwas zurückzunehmen wäre. Der
Prüflauf misst das ausdrücklich; es ist die Stelle, an der so eine Sache
gefährlich würde.

**Zehn Arten**, davon acht Vergleiche (grösser · kleiner · gleich ·
zwischen · enthält · leer · nicht leer · mehrfach) und zwei, die mit dem
ganzen Bereich rechnen (Farbverlauf · Balken). Die **erste zutreffende
Regel gewinnt** — dieselbe Regel wie bei den Datenbanken. Zwei Regeln auf
derselben Zelle sind kein Fehler, sondern der Normalfall („über 100 grün,
über 1000 blau"); es braucht nur eine feste Reihenfolge.

**Einmal je Zeichnung, nicht je Zelle.** `skala` und `balken` brauchen das
kleinste und grösste, `doppelt` die Häufigkeiten. Ohne diesen Schritt
liefe je Zelle eine Schleife über den ganzen Bereich: bei 1000 × 26 wären
das 26 Millionen Vergleiche für eine Farbe.

**Zwei Dinge, die erst das Bildschirmfoto gezeigt hat** (CLAUDE.md §55) —
beide sahen im Quelltext richtig aus:

*Der Balken misst von Null, nicht vom kleinsten Wert.* Bei 340, 890, 1200,
2400, 3100 war der kleinste Balken null Pixel lang, und 340 sah aus wie
„nichts" — dabei ist es ein Neuntel des grössten. Genau so lügen Diagramme
mit abgeschnittener Achse. `Math.min(0, min)` hält dabei den Fall mit
negativen Zahlen offen. Die Skala bleibt bei min→max: sie zeigt einen
PLATZ in einer Reihe, kein Mass, und dort ist der kleinste zu Recht am
Ende.

*Die Regelliste stand in `.res`* — der Trefferliste des Finders, wo
`button { width:100% }` gilt. Die beiden kleinen Knöpfe ☑ und 🗑 sprangen
damit auf je eine eigene Zeile, und aus einer Regel wurden drei Zeilen
Papier.

**Der Balken liegt hinter dem Text.** Neben ihm bräuchte er eigene Breite,
und eine Tabellenspalte hat keine übrig — dann wäre entweder der Balken
zwei Pixel lang oder die Zahl abgeschnitten. Abgeschnittene Zahlen sind in
diesem Block die gefährlichste Sorte Fehler (E29: aus `634.21` wird das
Bild von `34.21`).

**Die Auswahl gewinnt über die Farbe.** Eine gefärbte Zelle muss trotzdem
als gewählt zu erkennen sein, sonst verliert man beim Malen die Stelle, an
der man gerade steht.

**Der Bereich ist vorausgefüllt** mit dem, was gerade markiert ist. Das
ist der Unterschied zwischen „ich probiere das mal aus" und „ich muss
erst nachsehen, wie meine Spalte heisst".

**Was noch fehlt** und in L15 stehenbleibt: Symbolregeln (Ampeln, Pfeile)
und „überfällig" als eigene Art — das braucht einen Datumsvergleich gegen
heute, und der gehört zuerst geklärt (Ortszeit, siehe E31).

**Status**

`test130` (Suite 94), 48 Punkte, samt Telefon. Gegenprobe: das Auftragen
der Regeln stillgelegt → 19 von 48 rot.

---

## E54 · Web Push — und der Stoss trägt nichts

**Aus `LUECKEN.md` L33.** Eine Erinnerung meldete sich nur, solange Redion
offen war. Ist die App um acht Uhr geschlossen, passiert um acht Uhr
nichts; sie wartet bis zum nächsten Öffnen und sagt dann „Verpasst um
08:00". Ein Telefon zu wecken, ohne dass die Seite läuft, geht nur mit
Web Push.

**Die Entscheidung fiel vor dem Code: der Stoss trägt keinen Inhalt.**

Ein Web Push kann welchen mitbringen. Er müsste dann verschlüsselt werden
(aes128gcm) — aber das ist nicht der Grund, ihn wegzulassen. Der Grund
ist: **der Text einer Erinnerung geht Redions Server nichts an.**
„Zahnarzt 14:00" ist genau die Sorte Satz, die local-first schützen soll.

```txt
Gerät   →  „weck mich am 2026-08-09 um 06:00 UTC"   nur die Zeit
Server  →  zur Zeit: ein leerer Stoss an dieses Gerät
Gerät   →  liest lokal nach, was fällig ist, und zeigt es
```

Nebenbei ist das die einfachste Bauform: kein Inhalt heisst keine
Verschlüsselung, nur die VAPID-Signatur.

**Was der Server am Ende weiss:** acht Felder — Kennung, Konto, Gerätename,
Endpunkt, die beiden Schlüssel des Geräts, ein Zeitpunkt, ein Datum. Kein
Titel, kein Ort, keine Seite. Wer diesen Weg erweitert, prüfe zuerst, ob
das noch gilt.

**Deshalb ist Abschnitt 5 des Prüflaufs der wichtigste.** Alles andere hier
merkt man am Verhalten: ein Wecker, der nicht klingelt, fällt auf. Dass ein
Erinnerungstext mitgeschickt wird, fällt **niemandem** auf — nicht dem, der
es baut, und schon gar nicht dem, der die App benutzt. Genau solche Fehler
brauchen eine Prüfung.

**Drei Dinge, die beim Bauen schiefgingen** — alle drei vom Lauf gefunden:

*Die Argumente von `feldText` standen vertauscht.* Es heisst
`text(wert, feld)`; da stand `text('geraet', k.geraet)`. Damit hiess **jedes
Gerät „geraet"**: zwei verschiedene Telefone fanden einander, und ein
unbekanntes wurde gefunden. Kein Mensch hätte das je bemerkt. (CLAUDE.md,
Regel 1: nachsehen statt raten — der teuerste wiederkehrende Fehler.)

*`geraet` hat in der Feldtabelle die Vorgabe „Unbekannt".* Für ein
Namensfeld richtig, hier falsch: eine fehlende Kennung wäre damit ein
gültiges Gerät gewesen. Also erst am rohen Wert prüfen, dann säubern.

*Das Prüf-Token brauchte `sit_` davor.* `werFragt` entscheidet am Präfix,
ob es eine Sitzung oder eine Marke ist; ohne das kam 401, und es sah nach
einem kaputten Weg aus.

**Eine Marke darf keine Weckrufe legen.** `push` steht bei
`NUR_MIT_SITZUNG`. Eine Marke ist ein Schlüssel für ein Programm; ein
Weckruf ist ein Wecker für einen Menschen an einem Gerät. Dürfte eine Marke
ihn legen, könnte ein Skript mit `schreiben`-Recht fremde Telefone um drei
Uhr nachts klingeln lassen — und das steht in keiner Rechteliste.

**Auch ein misslungener Stoss löscht die Zeit.** Sonst versucht der nächste
Lauf es wieder, und der übernächste auch: bei einem Dienst, der gerade
streikt, wären das sechzig Versuche pro Stunde für einen Wecker, der
ohnehin zu spät wäre. Ein 404 oder 410 löscht den ganzen Eintrag — dann
gibt es das Gerät nicht mehr.

**Und ohne Server bleibt alles, wie es ist.** Web Push ist eine Zugabe des
Cloud-Modus, keine Voraussetzung (CLAUDE.md §22). Ohne VAPID-Schlüssel sagt
`/push/schluessel` 503 mit dem Weg zur Einrichtung, der geplante Lauf tut
nichts und wirft auch nicht, und wer nur lokal arbeitet, bekommt seine
Erinnerung weiterhin beim nächsten Öffnen. Der Cron-Eintrag in
`wrangler.toml` steht auskommentiert da — es gäbe ohne Schlüssel nichts zu
tun.

**Was das Dienst-Skript beim Stoss tut:** es öffnet die IndexedDB **ohne
Versionsangabe**. Ein Dienst-Skript, das die Datenbank hochzieht, während
in einem anderen Tab die App darauf arbeitet, wäre ein Umbau am fahrenden
Zug. Gibt es sie noch gar nicht, bricht es ab, statt eine leere Hülle zu
hinterlassen, in der die App später ihre Umzüge nicht mehr findet.

Und es zeigt **immer** etwas. Ein Dienst-Skript, das auf einen Push hin
nichts anzeigt, lässt den Browser von sich aus „Diese Seite wurde im
Hintergrund aktualisiert" einblenden — eine Meldung, die niemand
geschrieben hat und die nichts sagt. Ist nichts fällig, steht dort
stattdessen ein ehrlicher Satz.

**Status**

`test131` (Suite 95), 44 Punkte, gegen den echten Kern mit einem `fetch`,
das jeden Stoss mitschreibt. Die Unterschrift wird mit dem öffentlichen
Schlüssel nachgerechnet — sonst hätte man ein JWT, das kein Dienst
annimmt, und die Meldung dazu wäre „401 unauthorized".

Gegenprobe: einen Erinnerungstext in den Stoss gelegt und das Leeren der
Zeit entfernt → 4 rot, darunter beide Punkte aus Abschnitt 5.

---

## E55 · Der Willkommensbildschirm — und die Frage, die niemand beantwortet hat

**Aus der Vorgabe §11.**

**Was vorher dastand**, war nicht falsch, sondern zu klein: eine Einladung
unten links, „Neu hier? — Neun Schritte durch das Wichtigste". Der Gedanke
dahinter stimmt und steht weiter im Code — ein Fenster, das den Bildschirm
nimmt, bevor man etwas getan hat, ist zudringlich.

**Aber sie beantwortete die eine Frage nicht, die der allererste Blick
stellt: was ist das hier, und wohin gehören meine Daten?**

Redion ist local-first. Das ist keine Kleinigkeit am Rand, sondern der
Grund, warum es die App gibt — und ausgerechnet das erfuhr niemand, bevor
er anfing. Es stand in der README, die kein Mensch öffnet.

```txt
Notizen, Seiten und Datenbanken — auf deinem Gerät.
Kein Konto, kein Abo, keine Wolke, solange du keine willst.
```

**Drei Wege, und der zweite ist der, den man vergisst.** Wer gerade das
Gerät gewechselt hat, will nicht anfangen, sondern **zurückholen**. Ein
Willkommen, das nur „Loslegen" anbietet, schickt ihn in einen leeren
Arbeitsbereich und lässt ihn die Sicherung in den Einstellungen suchen —
dieselbe Überlegung wie beim leeren Zustand (§13).

**Untereinander, nicht nebeneinander.** Die drei sind nicht gleichwertig,
und drei Knöpfe in einer Reihe behaupten das Gegenteil.

**Am Telefon ein Blatt von unten**, am Rechner ein Kasten in der Mitte —
dieselbe Aufteilung wie bei allen anderen Fenstern (E43). Escape ist
„später": nichts davon ist Pflicht. Gezeigt ist gesehen.

**Was das Bild zeigte und der Quelltext nicht:** der erste Weg trug
`--b-blue` als Fläche — eine blau getönte Karte unter einem orangen
Rahmen. `--b-blue` heisst blau, weil es blau ist; es war nie die
Akzentfarbe, sondern eine der zehn Blockfarben, die der Mensch für seine
eigenen Blöcke wählt.

**Und der teure Teil: es stand elf Prüfläufen im Weg.**

Der volle Lauf danach meldete zwölf gescheiterte Läufe, alle aus demselben
Grund — ein Blatt über dem ganzen Bildschirm, und Playwright wartet
sechzig Sekunden darauf, dass ein Knopf darunter anklickbar wird. Die
Meldungen zeigten dabei auf ganz andere Ecken („die Leiste ist nicht
anklickbar", „der Klick nach dem Loslassen hat das Menü geschlossen").

Die Läufe markieren sich jetzt im Aufbau als Wiederkehrer. Und im Code
steht eine Zeile, die den halben Ärger gar nicht erst entstehen lässt:
`willkommen()` sieht **kurz vor dem Erscheinen** noch einmal nach, ob die
Begrüssung inzwischen als gesehen gilt. Zwischen dem Beschluss „nach 1,4
Sekunden" und dem Erscheinen liegt eine Ewigkeit — in einem zweiten Tab
kann sie längst gelaufen sein.

**Status**

`test114` §18, 10 Punkte. `test115` misst weiterhin die eigentliche Frage
— kommt sie ein zweites Mal? —, nur meint `gruss` dort jetzt das
Willkommen.

---

## E56 · Der Prüfstand übersah rote Punkte

**Gefunden am 8. August, und es ist die unangenehmste Sorte Fund.**
`test31` meldete „33/34 bestanden" mit einem ❌ mittendrin, und der
Orchestrator sagte „✓ Alle 101 Läufe bestanden".

**Der Grund:** er zählte allein den Rückgabewert. Läufe, die mit
`process.exit(weg ? 1 : 0)` enden, melden damit richtig — mehrere ältere
haben das aber nicht. Sie drucken ihre Zeilen, schliessen den Browser und
enden mit 0, ganz gleich was dastand.

**Ein Prüfstand, der Rotes übersieht, ist schlimmer als keiner:** er
behauptet, jemand habe hingesehen.

`alle.mts` liest jetzt mit. Ein `❌` oder `✗` **am Zeilenanfang** zählt als
gescheitert, auch bei Rückgabewert 0 — und sagt dazu, dass dem Lauf der
`process.exit` fehlt. Nur am Zeilenanfang: ein ✗ mitten im Text ist eine
Erklärung („vorher stand hier ✗"), kein Ergebnis. Die Ausgabe läuft weiter
durch, Zeile für Zeile; `stdio: 'inherit'` ginge dafür nicht mehr.

**Und der Punkt, den er übersah, war ein echter.** Seit E42 öffnet der
Kreis links oben nicht mehr die Schublade, sondern das R-Blatt über den
ganzen Bildschirm. Die Prüfung fragte noch nach `side-offen` — sie stand
über Wochen auf Rot, und niemand hat es gesehen.

**Status**

Gegenprobe: einen roten Punkt erzwungen, Rückgabewert 0 gelassen → der
Orchestrator meldet ihn samt Zahl und Grund.

---

## E57 · Die Sicherungskarte sagt, dass sie arbeitet — und der Fund daneben

**Aus dem Entwurf:** die Sicherungskarte soll ihre Zustände zeigen, Kreisel
→ Haken.

**Warum das mehr ist als Zierde.** Eine `.redion`-Sicherung mit Anhängen
dauert Sekunden bis Minuten. Bis hierher passierte in dieser Zeit auf der
Karte **nichts**: der Knopf blieb, wie er war, und irgendwann kam ein Toast.
Am Telefon steht der über der Aktionsleiste und ist nach 2,6 Sekunden weg —
wer in dem Moment wegsieht, weiss nicht, ob überhaupt etwas geschieht, und
tippt ein zweites Mal.

Drei Zustände, und der mittlere ist der, den man sonst verpasst:

```txt
Jetzt sichern   →   ⟳ Sichern …   →   ✓ Gesichert   →   Gesichert heute
```

**Der Knopf bleibt dabei gesperrt** — ein zweiter Klick wäre eine zweite
Sicherung, bei Anhängen eine zweite Runde durch alle Dateien.

**Aber gesperrt heisst nicht „nicht gemeint".** `button[disabled]` steht in
`bausteine.css` auf `opacity:.4`, und damit stand die Erfolgsmeldung auf
Grün bei vierzig Prozent Deckkraft: hübsch und unlesbar. Gemessen, nicht
geschätzt.

**Und wer keine Bewegung mag, bekommt keine.** Der Kreisel steht dann
still — ein Zustand, der NUR über Bewegung erkennbar wäre, wäre derselbe
Fehler wie einer, der nur über Farbe geht (CLAUDE.md §38). Der Text daneben
sagt es ohnehin.

**Der eigentliche Fund kam nebenbei, und er ist der wichtigere.**

Die Prüfung zählte zwei Klicks und bekam **drei Aufrufe**.

`#page` bleibt stehen; nur sein Inhalt wird neu geschrieben. Der
Start-Bildschirm hängte seinen Zuhörer mit `addEventListener` daran — und
`start()` läuft bei **jeder** Rückkehr zum Start. Nach dem dritten Mal legte
ein Klick auf „Tagesjournal" drei Journale an; nach dem zehnten zehn. Bei
„Jetzt sichern" mit Anhängen wären das zehn Läufe durch alle Dateien.

```txt
wrap.addEventListener('click', …)   jedes Zeichnen ein Zuhörer mehr
wrap.onclick = …                    ersetzt
```

Vier der sechs Ansichten in derselben Datei machten es von Anfang an
richtig; zwei nicht. Das ist die Fehlerklasse, die `CLAUDE.md` Regel 3
beschreibt: nicht „vergessen", sondern „an einer Stelle getan und an der
Nachbarstelle nicht".

**Der Fehler wächst mit der Nutzungsdauer** — und fällt beim Ausprobieren
deshalb nie auf. Die Prüfung zeichnet zehnmal, weil ein- oder zweimal den
Unterschied nicht zeigt.

**Status**

`test114` §19 (7 Punkte) und §20 (1 Punkt). Gegenprobe: zurück auf
`addEventListener` → 13 Journale aus einem Klick.

---

## E58 · Einstellungen am Telefon: zwei Seiten statt zwei Spalten

**Aus der Vorgabe §12.** Und der Anlass war nicht der Entwurf, sondern eine
Messung: bei 390 px war das die **schlechteste Seite der ganzen App**.

Die Rechner-Aufteilung lief unverändert weiter — 236 px Navigation plus
Inhalt. Für den Inhalt blieben **129 Pixel**:

```txt
Erscheinungsbild
Hell,
dunkel
oder                    ← und daneben, halb ausserhalb
wie                       des Bildschirms:  [ Dunkel ▾ ]
das
System
```

Jede Beschreibung brach in Einzelwörter um, jedes Auswahlfeld ragte über den
Rand, und das ✕ lag auf der Überschrift, die dadurch abbrach.

**Zwei Spalten passen nicht auf ein Telefon.** Also zwei **Seiten**: erst
die Liste der Bereiche, dann der gewählte Bereich mit einem Weg zurück.
Genau so macht es jedes Telefon-Betriebssystem, und aus demselben Grund.

`data-blick` sagt, welche gerade dran ist. Am Rechner steht dieselbe
Angabe da und ändert nichts — dort sind beide Spalten immer sichtbar, und
der Klick in die Liste zeichnet rechts neu.

**Und die Zeilen stapeln.** Beschreibung und Auswahlfeld nebeneinander
brauchen Breite, die es nicht gibt. Untereinander bekommt jedes die ganze:
der Text liest sich, und das Feld ist 44 px hoch statt 35 — und 16 px
Schrift, sonst zoomt iOS beim Antippen.

Der **Schalter** bleibt davon ausgenommen und rutscht nach rechts. Er ist
die Antwort auf eine Ja-Nein-Frage und braucht keine ganze Zeile.

**Der Weg zurück ist kein Beiwerk.** Ohne ihn wäre die zweite Seite eine
Sackgasse: das ✕ schliesst alles, und dann fängt man von vorn an. Escape
geht ebenfalls eine Stufe zurück, nicht gleich ganz hinaus — wer in
„Sicherheit" steht und abbricht, meint meistens diesen Bereich.

**Und wieder der Hinweisstreifen.** `.overlay` liegt auf 700, der Toast auf
900. Am Rechner ist das richtig, weil das Fenster dort nur die Mitte
einnimmt. Am Telefon füllt es alles, und dann lag „1 Karteikarte ist
fällig" mitten in der Bereichsliste. Das ist der vierte Ort mit demselben
Fund — nach dem R-Blatt, dem KI-Fenster und dem Offline-Streifen. Dieselbe
Antwort: was den ganzen Bildschirm nimmt, gehört über 900.

**Am Rechner ändert sich nichts.** Gemessen: 236 px Navigation, beide
Spalten sichtbar, kein Weg-zurück-Knopf, keine umbrechenden Zeilen.

**Status**

`test114` §21, 10 Punkte. Gegenprobe: den Telefon-Block entfernt → 9 von
10 rot.

---

## E59 · Markdown geht jetzt in beide Richtungen — und das Zeichen bleibt nicht stehen

**Datum** 8. August 2026 · **Lücke** L20 · **Prüflauf** `test132` (79 Punkte)

**Der Fund, der alles andere klein aussehen lässt**

`doku/SLASH-UND-TASTEN.md` führte zwölf Markdown-Kürzel, alle mit ✅. Sie
wandelten auch alle um. Was keiner geprüft hat, ist, was danach im Block
steht:

```txt
Getippt:    # Meine Überschrift
Erwartet:   Überschrift 1 · „Meine Überschrift"
Gemessen:   Überschrift 1 · „#Meine Überschrift"
```

Das `#` blieb. Es war **sichtbar**, es war seit jeher da, und jeder
Prüflauf war grün — weil alle nur `block.type` verglichen haben. Der Typ
stimmte ja.

Die Ursache steht in drei Zeilen: der Tastendruck vor dem Leerzeichen
speichert `#` im Block. `ct.textContent = ''` räumt danach nur das Feld,
und `umwandeln()` zeichnet sofort neu — aus dem Block, in dem das `#` noch
steht. Die Behebung ist eine Zeile mehr, `Store.updateBlock(b.id, {text:''})`,
und der Grund, warum sie fehlte, ist kein Flüchtigkeitsfehler: **die
Prüfung, die sie erzwungen hätte, hat niemand geschrieben.**

Das ist derselbe Satz wie in CLAUDE.md §55.2, nur ohne Bild: eine Prüfung,
die nur die halbe Sache misst, sagt „passt schon" und meint es nicht.
`test132` §1b vergleicht deshalb `block.text` **und** `textContent` — was
gespeichert ist und was auf dem Bildschirm steht.

**Drei Behauptungen, die keine waren**

Derselbe Lauf hat drei Zeilen der Doku umgeworfen:

```txt
a. i. 1) a) i)   standen in der Doku, nicht im Blockkatalog
~Text~           stand in der Doku, der Zeichner kannte nur ~~Text~~
[x]              gab es nirgends
```

Die Behebung ist jeweils klein — vier Einträge mehr im `md`-Feld von
`register/bloecke.ts`, ein Muster mehr in `inline()`. Der Punkt ist nicht
die Behebung, sondern **wie sie gefunden wurden**: indem ein Prüflauf jede
Zeile der Doku tippt, statt sie zu glauben.

**Die einfache Tilde und ihr Sicherheitsabstand**

`~Text~` durchzustreichen ist gefährlicher, als es aussieht: „ca. 3~5 Grad"
darf nicht durchgestrichen werden, und `~~doppelt~~` darf nicht als
`<s>~doppelt~</s>` zerfallen. Beides löst die Reihenfolge — erst `~~`,
dann `~` — plus die Bedingung, dass an keiner der beiden Tilden ein
Leerzeichen anschliesst. Beide Grenzfälle stehen als eigene Punkte in §4.

**Und die grosse Lücke, die in L20 gar nicht stand**

Strg C schreibt eine Auswahl seit jeher **als Markdown** — das steht so in
`auswahlAlsText()` und ist auch von `test65` gehalten. Zurück ging es nicht.
Es gab überhaupt keinen `paste`-Griff im Editor: die Zwischenablage landete
über den Standardweg des Browsers in genau einem Block, samt Rautezeichen.
Wer eine Seite kopierte und woanders einfügte, bekam seinen Text — und
seine Gliederung nicht.

`mdLesen()` liest jetzt die Gegenrichtung. Vier Entscheidungen darin:

**Eine Zeile wird ein Block.** Nicht die Markdown-Regel „zwei Zeilen sind
ein Absatz". Für eine Notiz-App ist das die Erwartung, und Notion macht es
genauso.

**Vier Leerzeichen sind eine Stufe.** Eingerücktes wird echtes Kind, kein
Text mit Leerzeichen davor. Das ist der Unterschied zwischen einer
Gliederung, die man weiter einklappen kann, und einer, die nur so aussieht.

**Im Codeblock wird nichts gelesen.** `# hallo` in einem Stück Python ist
eine Kommentarzeile. Das gilt in beide Richtungen: sowohl beim Einfügen
*in* einen Codeblock als auch für den Inhalt *zwischen* zwei Zäunen — dort
bleiben sogar die Leerzeilen erhalten.

**Immer selbst einsetzen, auch ohne Gliederung.** Der Standardweg des
Browsers legt mitkopiertes HTML mit allen Stilen in den Block; beim
nächsten Zeichnen ist es weg, weil das Datenmodell nur Text kennt. Text,
der vor den Augen des Nutzers verschwindet, ist schlimmer als Text, der nie
formatiert ankam.

**Was ausdrücklich nicht dazugehört**

Markdown-Tabellen (`| a | b |`) und verschachtelte Zitate liest der Leser
nicht. Beide stehen in L20 als offen. Eine Tabelle beim Einfügen zu
erkennen hiesse zu entscheiden, ob daraus ein Tabellenblock, eine einfache
Tabelle oder eine Datenbank wird — das ist eine eigene Frage und keine
Nebenbei-Antwort.

**Status**

`test132`, 79 Punkte, 9 Abschnitte. Gegenprobe für jede der vier
Behebungen einzeln:

```txt
Text-Leeren entfernt      → 14 rot
Listenvarianten und [x]   →  9 rot
paste-Griff entfernt      → 15 rot
einfache Tilde entfernt   →  1 rot
```

`test65` und `test86` zählen die Gruppen der Kürzelübersicht; beide mussten
von zwölf auf dreizehn — die neue heisst „Markdown einfügen". Dass sie das
gemeldet haben, ist der Zweck einer festen Zahl an dieser Stelle.

---

## E60 · Symbole und Daten in der bedingten Formatierung — und wo „heute" anfängt

**Datum** 8. August 2026 · **Lücke** L15, damit geschlossen ·
**Prüflauf** `test130` (79 Punkte, von 48 gewachsen)

E53 hat die bedingte Formatierung im Tabellenblock gebaut und zwei Dinge
ausdrücklich offen gelassen: Symbolregeln und „überfällig". Beide sind
jetzt da, und beide hatten je eine Frage, die vorher zu beantworten war.

**Das Symbol gehört nicht in den Wert**

Der naheliegende Weg wäre, `🔴 ` vor den Zellinhalt zu schreiben. Dann
stünde es in `wert` — und damit rechnet die Zelle nicht mehr, das Symbol
ginge beim Kopieren nach Excel als Text mit, und beim Abschalten der Regel
müsste es wieder herausgeschnitten werden. Das wäre eine Bearbeitung, und
E53 hat für diese Sorte Regel das Gegenteil beschlossen: **eine bedingte
Farbe ist eine Sicht, keine Bearbeitung.**

Das Symbol steht deshalb in `content: var(--regel-symbol)`, gesetzt über
eine CSS-Eigenschaft am Element. `wert` bleibt unangetastet — `test130`
§10 prüft beides: was auf dem Bildschirm steht **und** was gespeichert ist.

Dazu eine Zeile, die kein Beiwerk ist: `flex: none`. Der Zellinhalt ist ein
Flex-Element; ohne sie würde das Symbol mitgestaucht, sobald die Spalte eng
wird. Ein halber Kreis bedeutet nichts. Das ist derselbe Fund wie beim
abgeschnittenen Zahlenwert vom 8. August (CLAUDE.md §55.2) — nur diesmal
vorher bedacht und als Zahl geprüft, nicht erst auf dem Bildschirmfoto
gesehen.

**Drei Stufen, nicht Excels fünf.** Eine vierte Stufe unterscheidet sich auf
einem Telefonbildschirm nicht mehr erkennbar von der dritten, und ein
Symbol, das man nicht auseinanderhält, sagt weniger als keines.

**Eigene Grenzen schlagen die Drittelung.** Ohne Angabe wird der Bereich
gedrittelt. Mit `wert`/`wert2` gelten die als Grenzen — und dann zählt nur,
was der Mensch eingetragen hat: bei „Ampel ab 50 und ab 80" ist die 79
gelb, auch wenn im Blatt zufällig eine 300 steht. Eine Skala, die sich
lautlos am grössten Wert ausrichtet, beantwortet eine andere Frage als die
gestellte.

**Und `umgekehrt`**, weil es Werte gibt, bei denen klein gut ist — „Tage
überfällig", „Fehler pro Woche". Ohne den Schalter müsste man den
Symbolsatz rückwärts lesen.

**Wo „heute" anfängt**

Das war die eigentliche Frage an „überfällig", und sie hat eine falsche
und eine richtige Antwort:

```txt
new Date('2026-08-08')      →  2026-08-08T00:00:00 UTC
in Zürich (UTC+2)           →  8. August, 02:00 Uhr    fällt nicht auf
in Los Angeles (UTC−7)      →  7. August, 17:00 Uhr    fällt auf
```

Westlich von Greenwich liegt ein Datum, das **heute** ist, damit vor der
heutigen Mitternacht — und jede heute fällige Aufgabe wäre am Morgen schon
rot. `alsDatum` baut das Datum deshalb aus seinen Teilen (`new Date(j, m-1,
t)`) und trifft damit die Ortszeit. Dieselbe Rechnung wie „Nächste Termine"
in `steuerung.ts`, das seit jeher `setHours(0,0,0,0)` nimmt.

`test130` §11b rechnet das in einem Browser mit `timezoneId:
'America/Los_Angeles'` nach. Es ist der einzige Abschnitt, in dem der
Unterschied überhaupt sichtbar wird — in der Gegenprobe mit naivem
`new Date(text)` wird genau dieser Punkt rot, und sonst nur noch einer:
die blosse Zahl `5`, die `new Date` klaglos als Datum durchgehen lässt.

**Heute ist nicht überfällig.** Die Grenze steht als eigener Punkt in §11,
weil sie eine Entscheidung ist und keine Selbstverständlichkeit: wer heute
etwas abzugeben hat, hat den ganzen Tag Zeit.

**Was kein Datum ist, ist nicht überfällig** — sondern gar nichts. Eine 5
in einer Datumsspalte darf nicht rot werden, nur weil sie kleiner ist als
irgendetwas.

**`faelligBald` dazu**, weil „überfällig" allein zu spät kommt. Ohne
Tagesangabe gelten sieben; eine Regel, die ohne Zahl nichts täte, wäre eine
Regel, die man versehentlich leer anlegt und die dann schweigt.

**Eine Zeile Aufräumen nebenbei**

Welche Regelart welches Feld braucht, stand an **drei** Stellen als
Literalliste — beim Anzeigen, beim Speichern und im Satz für die
Regelliste. Drei neue Arten hätten an zwei davon vergessen werden können,
ohne dass etwas auffällt. Jetzt steht sie einmal, als `OHNE_WERT` und
`OHNE_FARBE`.

**Status**

`test130`, 79 Punkte, 12 Abschnitte. Gegenproben:

```txt
Symbolzweig entfernt        → 12 rot
Datumsregeln entfernt       →  6 rot
alsDatum naiv geparst       →  2 rot — und zwar die zwei richtigen
```

---

## E61 · Der Testlauf war keiner — er änderte die Daten

**Datum** 8. August 2026 · **Lücke** L16 · **Prüflauf** `test133` (28 Punkte)

An jeder Automation sass ein Knopf `▶` mit dem Titel „Einmal probeweise
laufen lassen". Er liess sie **wirklich** laufen, auf der ersten Zeile der
Datenbank, und sagte hinterher per Toast, ob sich etwas geändert hat.

Wer ihn drückte, um zu sehen, ob seine Regel stimmt, hatte sie danach
angewendet. Bei „Eintrag in den Papierkorb" war die Zeile weg. Der Toast
macht nichts rückgängig.

Das ist nicht Feinschliff, sondern Priorität 1 aus CLAUDE.md §46: **Daten
sicher halten.** Ein Knopf, dessen Beschriftung „probeweise" sagt und der
schreibt, ist gefährlicher als gar kein Knopf — er lädt gerade dazu ein,
ihn bei einer Regel zu drücken, der man noch nicht traut.

**Der Probelauf, und warum er an genau einer Stelle abbricht**

Der naheliegende Weg wäre gewesen, jede der neunzehn Aktionsarten um einen
Zweig „im Probelauf nur beschreiben" zu ergänzen. Das wäre neunzehn Mal
dieselbe Entscheidung, und beim zwanzigsten Mal — der nächsten neuen Aktion
— vergisst sie jemand. Ein Schutz, den man je Fall wiederholen muss, ist
kein Schutz.

Stattdessen nutzt der Probelauf die Reihenfolge, die ohnehin da war:

```txt
oben   Bedingung an der Aktion   liest nur
       Variablen festlegen       schreibt in ein Objekt, das gleich vergeht
       ────────── hier bricht der Probelauf ab ──────────
unten  alles Übrige              Store.setProp · Store.addRow ·
                                 Store.trashBlock · fetch · location.href
```

Eine neue Aktion wird unten angehängt und ist damit **automatisch**
mitgeschützt. Und wenn jemand versehentlich oben etwas einfügt, das
schreibt, meldet es `test133` §2 — der prüft nicht, welche Aktionen
übersprungen wurden, sondern vergleicht nach drei Probeläufen den ganzen
Bestand Zeichen für Zeichen: Zeilen, Werte, Archivmerker, die Zieldatenbank,
den Laufverlauf, das gemeinsame Protokoll und die Zahl aller Blöcke.

Die Gegenprobe zeigt, was der Knopf vorher tat: Zähler von 3 auf **7**,
vier neue Zeilen in der Zieldatenbank, die Zeile archiviert. 16 rote Punkte.

**Was der Probelauf zeigt, ist der Plan — nicht das Ergebnis**

Eine Vorschau könnte auch das Ergebnis auf einer Kopie rechnen. Dann gäbe
es zwei Beschreibungen desselben Ablaufs, und die zweite läuft der ersten
davon: die Kopie kennt die neue Aktion noch nicht, die jemand letzte Woche
eingebaut hat. Der Probelauf zeigt deshalb, welche Aktion mit welchem Wert
an der Reihe **wäre** — Variablen aufgelöst, `{titel}` eingesetzt, der
Zähler auf seinem künftigen Stand.

Bedingungen gelten dabei mit. Eine Vorschau, die Aktionen zeigt, die gar
nicht drankämen, ist schlimmer als keine: sie lässt eine falsche Regel
richtig aussehen.

**Der Fehler, der nie ankam**

`laufNotiz.fehler` gab es seit jeher, und der Laufverlauf zeigt dafür ein
`⚠`. Gesetzt hat es **nie jemand** — das Feld stand auf `''` und blieb
dort. Ein Zeichen, das nie erscheint, ist schlimmer als keines: es sagt
„hier wäre ein Fehler zu sehen".

Schlimmer war, was ohne diesen Griff geschah. Eine Aktion, die wirft, riss
den ganzen `forEach` mit: die Aktionen **dahinter** liefen nicht, die
Automation schrieb keinen Verlauf, und die nächste Automation derselben
Datenbank kam nie an die Reihe — still, denn geworfen wurde in einen Aufruf,
den niemand fängt. In der Gegenprobe fliegt der Fehler bis in den Prüflauf
hinaus und bricht ihn ab; das ist kein roter Punkt mehr, sondern gar kein
Ergebnis.

Jetzt wird je Aktion gefangen, mit Namen ins Protokoll geschrieben und dem,
der zusieht, als Hinweis gezeigt.

**Eine Zahl, die niemand nachgezählt hatte**

`LUECKEN.md` L16 sagte „11 Aktionsarten, ohne Verzweigung und Schleife" und
führte als fehlend auf: If/Else, sonst-Zweig, für jede Zeile, Vorschau,
Protokoll, Fehleranzeige. Nachgezählt sind es **19** Aktionsarten, und
Protokoll wie Bedingung-je-Aktion waren längst gebaut. Zwei von sechs
„fehlt" waren richtig.

Dazu stand im Quelltext, eine Aktion dürfe „auch über die verknüpften
Zeilen laufen oder mehrfach wiederholt werden". Der erste Teil stimmt für
`fremd-setzen`; den zweiten konnte nie eine Aktion — es gibt kein Feld
dafür und keinen Zweig, der es läse. **Ein Satz im Quelltext ist keine
Funktion.** Derselbe Fund wie bei `~Text~` in E59, nur eine Datei weiter.

**Was offen bleibt** — ein sonst-Zweig als eigenes Ding in der Oberfläche
(heute schreibt man ihn als zwei gespiegelte Bedingungen) und eine Schleife
über die **eigenen** Zeilen. Beides steht so in L16.

**Status**

`test133`, 28 Punkte, 7 Abschnitte. Gegenproben:

```txt
Probe-Wächter entfernt   → 16 rot, darunter „Zähler steht auf 3" mit 7
try/catch entfernt       → der Prüflauf bricht ab, statt rot zu werden —
                           genau das war das Verhalten vorher
```

---

## E62 · „Kopiert" muss stimmen — und ein Ausschneiden, das nichts verliert

**Datum** 8. August 2026 · **Prüflauf** `test135` (19 Punkte)

An dreissig Stellen stand dasselbe Muster:

```js
navigator.clipboard?.writeText(irgendwas);
UI.toast('Link kopiert');
```

Drei davon hatten ein `.then`, drei ein `.catch`. Die übrigen
vierundzwanzig hatten weder noch.

**Warum das zwei Fehler auf einmal sind**

`writeText` ist ein Versprechen, das brechen kann — kein Recht, kein Fokus
im Fenster, kein Nutzerklick davor, ein älterer Browser. Ohne `.catch`
wird daraus eine unbehandelte Ablehnung: in der Konsole, nicht vor den
Augen dessen, der gerade kopiert hat.

Und der Toast meldet danach trotzdem Erfolg. Der Mensch geht weg, fügt
woanders ein — und bekommt, was vorher in der Ablage lag. Still, plausibel,
falsch: dieselbe Sorte wie die abgeschnittene Zahl aus CLAUDE.md §55.2.

**Was gemessen wurde**

In Chromium, am 8. August, in beiden Umgebungen:

```txt
                          file://          http://localhost
navigator.clipboard       da               da
writeText('probe')        WIRFT            WIRFT
execCommand('copy')       geht             geht
```

Das „WIRFT" ist die Antwort ohne Ablage-Recht — in einem gewöhnlichen
Browserfenster mit Fokus geht `writeText` meistens sehr wohl. Aber es
zeigt: der alte Weg ist kein Notnagel für alte Browser, sondern der, der
ankommt, wo der neue abgewiesen wird. Deshalb ist er in
`kern/helfer/ablage.ts` nicht der Notfall, sondern der gleichberechtigte
zweite Versuch.

**Die Regel des Helfers: er sagt nur etwas, wenn ihm jemand etwas zu sagen
mitgegeben hat.** Ohne `meldung` schweigt er ganz und gibt nur `true` oder
`false` zurück. Das braucht, wer selbst mehr weiss — beim Kopieren
mehrerer Blöcke etwa steht Redions eigene Ablage in jedem Fall, innerhalb
der App lässt sich also einfügen, auch wenn der Browser sich weigert. Ein
blosses „kopiert" verschwiege das, ein blosses „ging nicht" wäre zu düster.

**Der Punkt, an dem aus dem Ärgernis ein Datenverlust wurde**

Im Blockmenü stand:

```js
Ablage.kopiereJetzt(b.text || '');
Store.trashBlock(b.id); Store.purgeBlock(b.id);
```

`purgeBlock` räumt **endgültig** weg — nicht in den Papierkorb, sondern
fort. Ging das Kopieren nicht, gab es den Text danach nirgends mehr: nicht
in der Zwischenablage, nicht im Papierkorb, nicht auf der Seite. Ein
Tastendruck, drei Verluste.

Jetzt wird erst kopiert und nur bei Erfolg gelöscht. `test135` §5 hält es
fest: beide Wege abgewiesen → der Block steht noch da, mit seinem Text.

Das Ausschneiden **mehrerer** Blöcke war davon nie betroffen: es nimmt
`trashBlock` ohne `purgeBlock`, und Redions eigene Ablage hält den Baum.
Diese Unterscheidung ist der Grund, warum nur die eine Stelle geändert
wurde.

**Eine Antwort, die dadurch falsch geworden wäre**

`AppEinstellung.kann().zwischenlage` fragte, ob es `writeText` gibt. Mit
dem Rückfallweg ist „nein" die falsche Antwort — kopieren geht dann immer
noch. Die Prüfung fragt jetzt nach beiden Wegen.

**Was der Helfer nicht tut: lesen.** Aus der Zwischenablage zu lesen
braucht eine ausdrückliche Erlaubnis und ist etwas anderes als
hineinzuschreiben. Redion liest über das `paste`-Ereignis, und das bringt
seinen Inhalt selbst mit (siehe E59).

**Status**

`test135`, 19 Punkte. §6 hält den Zustand: keine Datei ausser dem Helfer
ruft `writeText` noch selbst auf. Gegenproben:

```txt
Rückfallweg entfernt      → 3 rot
Wahrheitsprüfung entfernt → 2 rot, darunter „Es steht NICHT ‚Link
                            kopiert' da" mit genau diesem Text
```

**Und die Taste, die Redion sich genommen hatte**

`test134` misst über `defaultPrevented`, wem eine Taste gehört. Fünfzehn
nimmt Redion dem Browser ab, und das ist richtig — Strg P würde sonst
drucken. Acht lässt es in Ruhe, und das ist der wichtigere Teil: wer Strg C
global abfängt, nimmt dem Menschen das Kopieren aus jedem Textfeld.

Zwei standen auf der falschen Seite. **Strg T** und **Strg W** waren an
Redions eigene Reiter gebunden. Der Browser gibt beide nicht her —
`preventDefault` bleibt dort wirkungslos —, also geschah beides: Redion
schloss seinen Reiter, und der Browser das Fenster darüber. Der Mensch kam
zurück und fand einen Reiter nicht mehr, ohne Anhaltspunkt, warum.

**Nachweisen lässt sich das hier nicht.** Playwright schickt Tastendrücke
an die Seite, nicht an die Browseroberfläche; dass der Browser trotzdem
handelt, ist in diesem Prüfstand nicht zu zeigen. Also wurde nicht
bewiesen, sondern **ausgewichen**: Redions Reiter liegen jetzt auf
**Strg Alt N** und **Strg Alt W**.

Die Abwägung dahinter, offen ausgeschrieben, weil sie auf einer
unbewiesenen Annahme steht:

```txt
Annahme falsch, Kürzel getauscht   zwei bequeme Kürzel gegen zwei
                                   etwas umständlichere — kleiner Verlust
Annahme richtig, Kürzel behalten   jedes Strg W schliesst das Fenster UND
                                   verliert einen Reiter — echter Verlust
```

Ungleich verteilt, also die vorsichtige Seite. Dazu kommt ein Grund, der
ganz ohne die Annahme auskommt: wer Strg W drückt, meint meistens den
Browserreiter. Eine Seite, die das umdeutet, ist unhöflich zu einer
Gewohnheit, die älter ist als sie.

**Was offen bleibt** — Strg Tab und Strg 1…9 sind derselbe Fall und
bleiben gebunden. Sie zerstören nichts: im schlimmsten Fall wechselt
zusätzlich der Browserreiter. Der Tausch lohnte den Verlust nicht, und die
Frage steht in L20.

---

## E63 · Eine scharfe Kante liest sich als Ende der Zahl

**Datum** 8. August 2026 · **Lücke** L10 · **Prüflauf** `test136` (17 Punkte)

Der Fund kam von einem Bild, nicht aus dem Quelltext. Am Telefon, 390 px
breit, stand im Tabellenblock:

```txt
Spalte B          Spalte C
1'450.00 CHF      1'45
2'199.70 CHF      2'18
```

Rechts ist nichts kaputt. Die Tabelle geht dort weiter, C2 enthält sehr
wohl `1'450.00 CHF`, und ein Wisch nach links bringt es zum Vorschein.
Abgeschnitten hat es der **Bildrand**.

**Warum das trotzdem ein Fehler ist**

Weil die Kante scharf war. Eine scharfe Kante liest sich als Ende der Zahl,
und `1'45` ist eine gültige Zahl — nur eine andere. Niemand sieht einer
sauber endenden Ziffernfolge an, dass hinter ihr noch drei Stellen stehen.

Für eine **zu enge Zelle** gibt es das seit dem ersten Tag: `###`. Die
Zelle weiss dann, dass ihr Inhalt nicht hineinpasst, und sagt es. Am
Bildrand weiss das niemand — die Zelle ist breit genug, nur der Bildschirm
ist es nicht.

Das ist derselbe Fund wie in CLAUDE.md §55.2, eine Ebene höher. Dort war es
`634.2166666667`, das als `34.2166666667` dastand. Beide Male gilt: kein
Prüflauf konnte es finden, weil beide Zahlen gültig sind. Beide Male hat es
das **Hinsehen** gefunden.

**Die Antwort ist keine Warnung, sondern eine weiche Kante**

Der letzte Streifen verläuft ins Nichts. Das Auge liest damit „hier geht es
weiter" statt „hier hört die Zahl auf". Es kostet keinen Hinweistext,
keinen Platz und keinen Klick — und es ist genau die Auskunft, die fehlte.

26 px am Telefon, 18 px am Rechner. Dort ist die Tabelle seltener
angeschnitten, und wenn doch, reicht ein schmalerer Streifen.

**Über `mask-image`, nicht über ein aufgelegtes Element.** Ein
Pseudo-Element im Rollfeld rollte **mit dem Inhalt** und wäre nach dem
ersten Wisch aus dem Bild. Eine Maske gilt dem Kasten des Elements, nicht
seinem Inhalt: sie bleibt am Rand stehen, egal wie weit gerollt wurde. Und
sie braucht keine Geometrie — kein Ausmessen von Kopf- und Fusszeile, das
beim nächsten Umbau schiefgeht.

**Nur dort, wo es wirklich weitergeht.** `data-rand` setzt
`kern/helfer/rollrand.ts`, und zwar erst, wenn `scrollWidth` grösser ist als
`clientWidth`. Eine Kante an einer Tabelle, die ganz ins Bild passt, wäre
eine Behauptung, die nicht stimmt — `test136` §1 prüft ausdrücklich, dass
sie dann fehlt.

Der Spielraum von zwei Pixeln ist kein Rundungsfehler, sondern Absicht:
Browser rechnen `scrollWidth` und `clientWidth` bei gebrochenen Zoomstufen
um Bruchteile auseinander, und bei null flackerte die Kante an einem
Rollfeld, an dem gar nichts zu rollen ist.

**Was dabei geprüft werden musste, ohne dass es jemand vermutet hätte**

Eine Maske erzeugt einen eigenen Stapelzusammenhang. Ob `position: sticky`
darin weiter greift — die stehende Kopfzeile und die stehende Zeilenspalte
sind der halbe Tabellenblock —, ist im Quelltext nicht zu sehen. `test136`
§3 rollt deshalb 200 px nach rechts und misst nach, dass beide stehen
bleiben.

**Und ein Prüflauf, der zuerst das Falsche mass**

Der erste Ablauf meldete sieben rote Punkte. Nachgemessen in der echten
App: der Block ist dort 334 px breit, das Rollfeld rollt, die Kante steht.
Der Prüflauf hatte in einen Kasten **ohne Breitengrenze** gezeichnet — dort
wächst der Block bis zur Breite seines Inhalts, das Rollfeld rollt gar
nicht mehr, und die Kante fehlt zu Recht.

Sieben rote Punkte für einen Zustand, den es nicht gibt. Die Lehre ist
dieselbe wie in §55.2, nur andersherum: eine Prüfung, die immer rot sagt,
ist so wenig wert wie eine, die immer grün sagt. Beide Male hilft nur,
**in der echten App nachzumessen**, bevor man dem Prüflauf glaubt.

**Und die dritte Stelle, die erst das Nachsehen fand**

Am Telefon zeigt eine Datenbank **Karten**, nicht die Tabelle — eine
Zeile, ihre Felder untereinander, nichts rollt seitlich. Das war schon
gebaut und ist gut so; `LUECKEN.md` L10 behauptete das Gegenteil.

Aber im Ansichtsmenü gibt es `handyTabelle`: „Tabelle statt Karten". Wer
den Schalter umlegt, bekommt genau die Lage von oben — gemessen **703 px
Inhalt in einem 334 px breiten Kasten**, scharfe Kante, und `14500` sowie
`8750.5` standen direkt darauf.

Dass es diesen Weg gibt, sieht man dem Bildschirmfoto nicht an; der
Regelfall ist ja richtig. Gefunden wurde er beim Nachlesen, WARUM das
erste Foto keinen Fehler zeigte — und das ist die Lehre: ein Foto, auf dem
alles stimmt, beantwortet nur die Frage nach diesem einen Zustand.

**Status**

`test136`, 22 Punkte, 7 Abschnitte — Tabellenblock, Datenbankraster und
Datenbanktabelle, Telefon und Rechner. Gegenproben:

```txt
Masken entfernt                  → 2 rot
Beobachter entfernt              → 9 rot
Bindung an der DB-Tabelle raus   → 2 rot
```

---

## E64 · 40 ist auch nicht 44 — und eine Zahl, die an zwei Stellen steht

**Datum** 8. August 2026 · **Lücke** L10 · **Prüflauf** `test137` (13 Punkte)

CLAUDE.md §37 nennt 44 px als Mindestmass für alles, was mit dem Finger
getroffen wird. Gemessen im Tabellenblock, 390 px breit:

```txt
Zelle             40 px
Formelzeile       32 px
Werkzeugknöpfe    44 px   ✓
```

**Der Gedanke war da, nur nicht zu Ende gerechnet.** Bei der Zeilenhöhe
stand im Quelltext sogar der richtige Satz — `/* 32 px trifft man mit dem
Finger nicht */` — und daneben die 40. Jemand hat das Problem erkannt, die
Zahl vergrössert und nicht nachgesehen, ob sie nun reicht.

Bei der Formelzeile machte allein `padding: 7px 10px` die Höhe. Was dabei
herauskommt, stand nirgends; man hätte es ausrechnen müssen, und niemand
tut das beim Lesen.

Beides kostet zusammen eine Zeile: 660 px Blockhöhe zeigen jetzt 14 statt
16. Für ein Tabellenprogramm klingt das nach Verlust — für ein
Tabellenprogramm, dessen Zellen man **antippen** muss, ist es der Preis
dafür, dass man die richtige trifft.

**Am Rechner bleibt es bei 32.** Die 44 gelten fürs Telefon, nicht als
Weltregel: eine Maus trifft auch 32 px, und eine Tabelle lebt davon, dass
viel gleichzeitig zu sehen ist. `test137` §3 hält beide Zahlen fest, damit
niemand die eine für die andere hält.

**Die Zahl, die an zwei Stellen steht**

Die Zeilenhöhe gibt es zweimal: als `ZH_HANDY` in `ansicht.ts` und als
`--tbl-zh` in `tabelle.css`. Das ist kein Versehen, sondern nötig — das
fensterweise Zeichnen rechnet mit der ersten aus, welche Zeilen überhaupt
ins Dokument kommen und wie hoch der Platzhalter darüber sein muss;
gezeichnet werden sie mit der zweiten.

Gehen die zwei auseinander, verschiebt sich der Inhalt gegen seine
Beschriftung: Zeile 30 steht dort, wo Zeile 29 hingehört. Und zwar **erst
nach dem Rollen** — beim flüchtigen Ansehen stimmt alles.

Ein Kommentar `/* muss zu --tbl-zh passen */` stand schon da. **Ein
Kommentar ist keine Zusicherung.** `test137` §2 rollt deshalb 25 Zeilen
weit, liest die Zeilennummern aus den Zellen und rechnet nach, wie viele
Pixel laut Bildschirm zwischen zwei Zeilen liegen. Stimmt das nicht mit
`--tbl-zh` überein, sagt die Meldung beide Zahlen:

```txt
✗ Zwischen den Zeilen liegt genau eine Zeilenhöhe
  — gemessen 44 px, --tbl-zh 40 px, Zeilen 17–40
```

Das ist der Punkt, an dem eine Prüfung mehr wert ist als ein Kommentar:
sie nennt nicht die Regel, sondern den Verstoss.

**Status**

`test137`, 13 Punkte, 5 Abschnitte. Gegenproben:

```txt
CSS auf 40 zurück, JS auf 44   → 3 rot, darunter der Zwei-Stellen-Punkt
min-height der Formelzeile raus → 1 rot
```

**Was offen bleibt** — der Tabellenblock hat am Telefon weiterhin keinen
eigenen Entwurf. Er zeigt dasselbe Raster wie am Rechner, nur grösser;
zwölf Zeilen, von denen bei einem kleinen Blatt die Hälfte leer ist. Ob
dort etwas anderes hingehört — eine Zeile als Karte, wie es die Datenbank
längst macht —, ist eine eigene Frage und steht in L10.

---

## E65 · Dieselbe Zahl an zwei Stellen, zum dritten Mal an einem Tag

**Datum** 8. August 2026 · **Lücke** L22 · **Prüflauf** `test138` (14 Punkte)

Nachdem E64 zweimal denselben Fehler gefunden hatte — eine Zahl, die an
zwei Stellen steht und auseinanderläuft —, habe ich das Projekt gezielt
danach absuchen lassen: fünf Blickwinkel, 22 Kandidaten. Der schwerste
steht hier.

**Der Fund**

`kern/helfer/tempo.ts` blendet in langen Tabellen die Zeilen aus, die
niemand sieht, und setzt an ihre Stelle einen Platzhalter. Die Rechnung
dafür stand als:

```js
const hoehe = 34;
```

Eine Zeile ist nie 34 px hoch. `table.grid td` macht ihre Höhe über
`padding`, und die Ansicht hat drei Stufen. Gemessen in Chromium:

```txt
h-klein    31,25 px
h-normal   37,25 px
h-gross    49,25 px
```

Keine davon ist 34.

**Was das anrichtet**

Der Platzhalter oben bekommt `von * hoehe`. Bei 142 übersprungenen Zeilen
sind das 4828 px statt der wirklichen 6994 — ein Versatz von **2166 px**.
Der Puffer beträgt 25 Zeilen, also 1231 px, und kann ihn nicht auffangen.

Gemessen, bevor es behoben war: der Nutzer steht bei 6000 px, also etwa
bei Zeile 122. Eingeblendet waren die Zeilen 143 bis 218. **Er sieht die
falschen Zeilen** — oder leeren Raum.

Es braucht drei Dinge, damit es auftritt: mehr als 120 Zeilen, die Ansicht
auf „alle Einträge" statt der üblichen 50, und weites Rollen. Alle drei
sind gewöhnliche Zustände, und keiner davon war je geprüft.

**Warum nicht zwei Zahlen abgleichen**

Weil die Fehlerquelle dann bliebe, nur mit einem Kommentar daneben. Genau
das stand bei `ZH_HANDY` schon (`/* muss zu --tbl-zh passen */`) und hat
nicht verhindert, dass sie auseinanderliefen — zweimal an einem Tag.

Die Höhe wird jetzt **gemessen**, an einer eingeblendeten Zeile, und bei
jedem Durchgang nachgesehen: der Nutzer kann im Ansichtsmenü von „normal"
auf „gross" stellen, ohne dass neu gebunden wird. Eine gemessene Zahl kann
nicht auseinanderlaufen.

Das ist die allgemeine Lehre aus allen drei Fällen: **wo ein Wert schon
irgendwo steht, soll man ihn lesen, nicht abschreiben.** Beim Tabellenblock
ging das nicht — dort braucht das Rechnen die Zahl, bevor gezeichnet ist,
und deshalb prüft `test137` §2 dort die Gleichheit nach. Hier ging es, und
dann ist Messen die bessere Antwort.

**Status**

`test138`, 14 Punkte, drei Zeilenhöhen einzeln. Gegenprobe — die 34 zurück:

```txt
✗ Die Zeile, vor der man steht, ist auch gezeichnet
  — bei 6000 px und 49.25 px je Zeile ist das Zeile 121;
    gezeichnet sind 143–218
```

vier rote Punkte über die drei Stufen.

**Was die Suche sonst noch fand** — 22 Kandidaten, nach Schaden sortiert
in `LUECKEN.md` unter L34. Darunter: die Sicherungstypen sagen Listen, wo
der schreibende Code Verzeichnisse schreibt · `ViewLayout` kennt zwölf
Ansichtsarten, das Register dreizehn · die Telefongrenze steht als 700,
760 und 768 nebeneinander · vier Grössengrenzen der Dateiablage stehen je
zweimal. Ein Fehlalarm war auch dabei: `#topbar .nur-telefon` wird
absichtlich ausgeblendet, seit die Pillenleiste die Kopfleiste ist.

---

## E66 · Ein Typ, der lügt, ist schlimmer als keiner

**Datum** 8. August 2026 · **Prüflauf** `test139` (24 Punkte)

Die Typen unter `src/core/types/` erzeugen nichts — `noEmit`. Niemand
merkt zur Laufzeit, wenn sie danebenliegen, und `tsc` prüft nur, ob der
Code zum Typ passt, nicht ob der Typ zur Datei auf der Festplatte passt.
Zwei lagen daneben.

**Die Sicherung: Verzeichnisse, keine Listen**

```txt
Der Typ sagte:   blocks: RedionBlock[]
Geschrieben wird: cache.blocks — ein Record<string, any>
Gelesen wird:     d.blocks || {}
```

So steht es in **jeder** bereits geschriebenen Sicherungsdatei. Der Typ war
also nicht streng, sondern falsch, und wer danach programmiert hätte, wäre
auf `daten.blocks.map(...)` gekommen — ein Fehler, den die Datei nicht
erklärt.

Geändert wurde der **Typ**, nie das Format. CLAUDE.md §52.8 sagt es in
einem Satz: nicht raten, welche Felder es gibt, sondern nachsehen. Ein
Format zu ändern, um einen Typ zu retten, macht jede vorhandene Sicherung
unlesbar.

`versions` bleibt eine Liste, und das stimmt auch — der Verlauf kommt nicht
aus `cache`, sondern wird beim Sichern eingelesen.

**Die Ansichtsarten: zwölf gegen dreizehn**

`ViewLayout` zählte zwölf auf. `Register.ansichten` führt dreizehn:
`raster` fehlte im Typ, obwohl es die Ansicht seit langem gibt — die
Tabellenbedienung mit Pfeiltasten und Bereichsauswahl, laut eigenem
Kommentar „Notions grösste Lücke bei der Eingabe". Ein Typ, der eine
gebaute Ansicht nicht kennt, weist gültigen Code ab.

**Wie das geprüft wird, und warum umständlich**

`test139` liest den **Quelltext der Typdatei** und vergleicht ihn mit dem,
was die laufende App tut: eine echte Sicherung wird geschrieben und Feld
für Feld nachgesehen, ob es Liste oder Verzeichnis ist; die Ansichtsliste
wird beim Register erfragt. Das ist mehr Arbeit als eine Typprüfung — aber
eine Typprüfung kann diesen Fehler prinzipiell nicht finden.

**Ein Fehler beim Bauen des Prüflaufs, der hierher gehört**

Der Ausdruck, der den Typ aus der Datei schneidet, hiess zuerst
`/export interface RedionPackageData[^}]*}/`. Der erklärende Kommentar im
Typ nennt aber `d.blocks || {}` — und an dieser Klammer hörte der Ausschnitt
auf. Alle vier Felder galten als „fehlt", und der Lauf meldete fünf rote
Punkte für einen Zustand, den es nicht gab.

Das ist derselbe Fall wie bei `test136` heute früh: **ein Prüflauf, der
das Falsche misst, ist so wenig wert wie einer, der nichts misst.** Beide
Male half nur, dem roten Punkt zu misstrauen und nachzusehen.

**Was dabei ein Fehlalarm war**

Die Suche meldete auch, `TOC_STUFEN` im Editor und der Überschriftenfilter
in `inhaltsflaeche.ts` gingen auseinander — der eine kennt `toggle-h1`, der
andere nicht. Nachgesehen: eine Toggle-Überschrift wird als `type: 'h1'`
mit `toggleKopf: true` gespeichert (`'toggle-h1'.slice(7)` ist `'h1'`). Die
zusätzlichen Schlüssel sind **tote Einträge**, die nie zutreffen.

Die Doppelung war also echt, der Fehler nicht. Beide Stellen lesen jetzt
trotzdem `Register.bloecke.ueberschriften()` — zwei Kataloge für dieselbe
Sache sind auch ohne Schaden zwei zu viel, und §8 sagt, wo so etwas
hingehört.

**Status**

`test139`, 24 Punkte. Gegenprobe — beide Typen zurück auf falsch:

```txt
✗ … und sagt für `blocks` ein Verzeichnis — RedionBlock[]
✗ … und sagt für `views` ein Verzeichnis — RedionView[]
✗ Jede Ansicht des Registers steht auch im Typ — fehlt im Typ: ["raster"]
```

---

## E67 · Jede Grenze bekommt ein Zuhause — und wo das nicht geht, eine Prüfung

**Datum** 8. August 2026 · **Lücke** L34 · **Prüflauf** `test140` (17 Punkte)

Vier Grössengrenzen der Dateiablage standen je zweimal:

```txt
STUECK      1 MB     konstanten.ts        und  dateien/ablage.ts
KLEIN     256 KB     konstanten.ts        und  dateien/ablage.ts
DATEI_MAX 500 MB     konstanten.ts        und  dateien/ablage.ts
100 MB               maschine.ts (blank)  und  server/dateien.ts
```

Alle vier stimmten überein. Das ist kein Trost: `ZH_HANDY` und `--tbl-zh`
stimmten auch überein, bis sie es nicht mehr taten — zweimal an einem Tag.

**Drei lassen sich teilen.** `dateien/ablage.ts` liest jetzt `KONSTANTEN`.

Der Rückfallwert bleibt stehen, und zwar mit Absicht: ist `konstanten.js`
nicht geladen, ist die App ohnehin kaputt — aber eine Grenze von
`undefined` liesse **jede** Datei durch, und das wäre schlimmer als eine
falsche Grenze. `test140` prüft deshalb auch, dass der Rückfall dieselbe
Zahl nennt; sonst wäre er eine zweite Wahrheit im Wartestand.

**Die vierte lässt sich nicht teilen.** Das Gerät und der Server sind
getrennte Bündel — der Worker läuft bei Cloudflare und kann
`konstanten.js` nicht lesen. Zwei Zahlen also, notgedrungen.

Und genau dann muss ein Prüflauf sie nachrechnen. `test140` §3 liest
`export const DATEI_GRENZE` aus `server/dateien.ts`, wertet den Ausdruck
aus und vergleicht ihn mit `KONSTANTEN.SERVER_DATEI_MAX`.

Was ohne diese Prüfung schiefginge, ist in beide Richtungen still:

```txt
Gerät höher als Server  →  es schickt Dateien, die der Server mit 413
                           abweist. Der Nutzer sieht einen Fehler ohne
                           Erklärung.
Gerät tiefer als Server →  es hält Dateien zurück, die durchgingen. Sie
                           fehlen auf dem zweiten Gerät, und nirgends
                           wird etwas rot.
```

Die zweite ist die gefährlichere, weil sie wie Erfolg aussieht.

**Nebenbei ein Name für eine blanke Zahl.** In `maschine.ts` stand
`> 100 * 1024 * 1024` mitten in einer Schleife — ohne Namen, ohne Bezug
zur Gegenstelle. Wer die Serverzahl geändert hätte, wäre über diese Zeile
nie gestolpert; sie enthält das Wort „Server" nicht.

**Und eine Konstante, die niemand anwendet, ist keine Grenze.** `test140`
§2 meldet deshalb eine Datei von 600 MB an und prüft, dass sie abgewiesen
wird — mit einer Meldung, die die Grenze in MB nennt.

**Status**

`test140`, 17 Punkte. Gegenproben:

```txt
Server auf 150 MB gesetzt   → 2 rot: „Server 150 MB, Gerät 100 MB"
Konstanten in ablage.ts
   wieder abgeschrieben     → 2 rot
```

**Was von L34 offen bleibt** — die Telefongrenze (700 / 760 / 768), die
Kopfleistenhöhe, die Ziffern-Blocktypen und die kleineren Doppelungen.
Sie stehen dort einzeln, nach Schaden sortiert.

---

## E68 · Eine Telefongrenze, nicht drei

**Datum** 8. August 2026 · **Lücke** L34 · **Prüflauf** `test141` (24 Punkte)

„Das ist ein Telefon" stand mit drei verschiedenen Zahlen da:

```txt
768   KONSTANTEN.TELEFON_BREITE → AppEinstellung.amTelefon()
760   38 CSS-Regeln · UI.amTelefon() · Tabellenblock · Raster
700   sechs matchMedia-Aufrufe im TypeScript · drei CSS-Blöcke
```

**Was das anrichtete**, gemessen bei jedem Fenster zwischen 701 und 760 px:

```txt
Telefonleisten         sichtbar    (CSS: ab 760 gilt Telefon)
Rechner-Seitenleiste   daneben     (CSS: ab 700 wird sie zur Schublade)
```

Auf dem Bildschirm hiess das: die Telefon-Pillen lagen **über** dem Logo
der Seitenleiste, die untere Leiste **über** „Neuer Chat". Zwei Entwürfe
übereinander gezeichnet.

Und das ist keine Randbreite. Ein halbierter Bildschirm, ein kleines
Tablet, ein verkleinertes Browserfenster liegen alle darin. Gefunden hat
es kein Prüflauf: alle messen bei 390, 428 oder 1500 px — also links und
rechts vom Band, nie darin.

**Welche der drei gewinnt**

760, und zwar nach Stimmenzahl: 38 CSS-Regeln, `UI.amTelefon()`, der
Tabellenblock und das Raster nehmen sie. Die 768 war die einzige Zahl, an
die sich **niemand** hielt — sie stand in der Konstantendatei und wurde nur
von einer Diagnosefunktion gelesen. Die 700 stand an sieben Stellen, alle
in der Schale und im Editor.

**Und `<=` statt `<`.** `AppEinstellung.amTelefon()` verglich mit `<`. Die
CSS schreibt `max-width: 760px`, und das schliesst 760 **ein**. Mit `<`
hätte genau die Breite 760 hier „Rechner" geheissen und dort „Telefon" —
ein Band von einem Pixel, das man nie findet und das trotzdem existiert.

**Was geprüft wird, und was nicht**

Nicht, dass irgendwo 760 steht — das wäre eine Behauptung über den
Quelltext. `test141` misst an sechs Breiten rund um die Grenze, ob alle
Antworten übereinstimmen, und §3 stellt die eigentliche Frage:

> Sind bei irgendeiner Breite Telefonleisten **und** feste Seitenleiste
> gleichzeitig da?

Die Gegenprobe — die Seitenleiste zurück auf 700 — beantwortet sie
wörtlich mit dem alten Zustand:

```txt
✗ 730 px: nicht Telefonleisten UND Rechner-Seitenleiste
  — Leisten da, Seitenleiste relative
✗ 760 px: nicht Telefonleisten UND Rechner-Seitenleiste
  — Leisten da, Seitenleiste relative
```

§5 hält zusätzlich fest, dass im Quelltext keine zweite Grenze mehr steht.
Erklärende Kommentare, die die alte Zahl nennen, zählen dabei nicht mit —
sonst würde die Erklärung des Fehlers selbst zum Fehler.

**Und derselbe Fehler eine Regel weiter oben**

Beim Aufräumen fiel die Schublade auf, die auf dem Telefon die Bereiche
zeigt. Ihr Kommentar sagt ausdrücklich: „Jetzt füllt sie die Breite und
beginnt **UNTER den Pillen**." Ihre Zahl sagte `top: 60px`. Die
Pillenleiste endet bei 80.

Die obersten 20 px lagen also dahinter, und das war die Zeile „🔍 Suchen"
— die erste im Blatt, halb abgeschnitten. Am iPhone, wo die Kerbe 47 px
dazulegt, wäre `--hoben` 127 px und die Schublade begänne immer noch bei
60: anderthalb Zeilen weg.

Das Bittere daran: **die Lehre stand schon in derselben Datei.** Sechzig
Zeilen weiter unten, bei `#main`, steht seit E58 wörtlich:

> `--hoben` STATT EINER ZAHL. Hier stand `60px`, und die Leiste darüber
> war 76 px hoch — die obersten 16 px des Zurück-Knopfes lagen dahinter.
> Am iPhone, wo die Kerbe noch 47 px dazulegt, war es die ganze Zeile.

Angewandt wurde sie damals auf `#main`. Die Schublade, die dieselbe Zahl
trug, blieb stehen. Eine Lehre, die man an einer Stelle zieht, gilt nicht
von selbst an der zweiten — auch nicht, wenn sie zwei Bildschirmseiten
entfernt aufgeschrieben ist.

**Ein Messfehler beim Prüfen, der ebenfalls hierher gehört.** Der erste
Anlauf griff die erste Zeile mit `querySelector('button, a')` und bekam
die Logozeile: am Telefon ausgeblendet, meldet aber trotzdem ein Rechteck
bei 0 px. Der Lauf war rot für ein Element, das niemand sieht. Gemessen
wird jetzt nur, was `display`, `visibility` und eine Höhe über 8 px hat.

**Status**

`test141`, 27 Punkte, sechs Breiten plus die Schublade. Gegenproben:

```txt
Seitenleiste zurück auf 700   → 5 rot
Schublade zurück auf top:60px → 2 rot: „🔍SuchenStrg P beginnt bei
                                 64 px, die Leiste endet bei 80 px"
```

---

## E69 · Kataloge gehören ins Register — und was ohne Auffang verschwindet

**Datum** 8. August 2026 · **Lücke** L34 · **Prüflauf** `test142` (24 Punkte)

CLAUDE.md §8 sagt es in einem Satz: die Register sind die zentrale
Wahrheit. Zwei Kataloge hielten sich nicht daran.

**Ziffer → Blockart, viermal geschrieben**

Notion legt die zehn häufigsten Blockarten auf Strg+Umschalt+Ziffer.
Welche Ziffer welche Art meint, stand **viermal** im Code:

```txt
register/bloecke.ts     kurz: 'Ctrl+Shift+1'   → die Kürzelübersicht liest es
editor.ts, Griff 1      { '0':'text', '1':'h1', … }   Strg+Umschalt
editor.ts, Griff 2      dasselbe noch einmal          Strg+Alt (Mac)
editor.ts, Griff 3      dasselbe ohne die '9'         Mehrfachauswahl
```

Wer eine Art auf eine andere Ziffer legt, ändert die Übersicht und lässt
drei Griffe stehen — oder umgekehrt, und dann zeigt die Übersicht ein
Kürzel, das nichts tut.

Jetzt leitet `Register.bloecke.zifferZuTyp()` die Zuordnung aus `kurz` ab.
Der dritte Griff lässt die `'9'` weiter aus, und zwar mit Begründung: eine
Mehrfachauswahl lässt sich nicht in **eine** Seite verwandeln.

**Das Typmenü ohne Auffanggruppe**

`TYP_GRUPPEN` in `steuerung.ts` zählt 34 Eigenschaftstypen in fünf Gruppen
auf. Das Register führt 35. Der Unterschied ist `title`, und der ist
richtig: eine Spalte lässt sich nicht in den Titel verwandeln, es gibt
genau einen.

Heute decken sich also beide. Das Gefährliche ist, was **morgen**
passiert: `TYP_GRUPPEN` hatte keine Auffanggruppe. Wer einen Typ ins
Register einträgt und diese Liste vergisst, bekommt einen Typ, den es gibt
und den niemand auswählen kann. Kein Fehler, keine Meldung — nur ein
Eintrag, der im Menü fehlt.

Das Register hat für genau diesen Fall `inGruppe('Weiteres')`. `typGruppen()`
macht es jetzt genauso.

**Und die Auffanggruppe muss leer sein.** `test142` §2 prüft beides: dass
es sie heute **nicht** gibt — sonst wäre sie eine Ausrede dafür, die
Gliederung nicht zu pflegen — und dass sie greift, wenn doch etwas
dazukommt. Dafür meldet der Lauf einen Probetyp an und sieht im
**gezeichneten** Menü nach, ob er anklickbar ist.

Die Gegenprobe sagt genau, was ohne sie geschähe:

```txt
✗ … und landet in der Auffanggruppe, statt zu verschwinden
✗ Das gezeichnete Menü zeigt den neuen Typ — 34 Knöpfe
```

Vierunddreissig Knöpfe, und der neue ist keiner davon.

**Zwei Kleinigkeiten beim Prüfen, die hierher gehören**

`.menu` ist der Kasten, `.menu-grund` der dunkle Grund **darunter**. Der
erste Anlauf suchte im Grund und fand null Knöpfe — ein roter Punkt für
einen Selektor, nicht für einen Fehler. Dritter Fall an einem Tag.

Und: `Register.bloecke` hat `nimmZurueck`, `Register.eigenschaften` nicht.
Eine Unwucht, die erst auffällt, wenn man sie braucht — für Erweiterungen
(L30) wird sie es. Der Prüflauf erfindet keine Aufräumfunktion, sondern
lädt eine frische Seite und hält fest, dass das Register dort wieder wie
neu ist. Die Unwucht steht als Notiz in L34. *(Inzwischen behoben — siehe
den Nachtrag unter E70; test142 meldet seither wirklich ab.)*

**Status**

`test142`, 24 Punkte. Gegenproben:

```txt
Auffanggruppe entfernt          → 2 rot
Aufzählung auf Strg+Umschalt+3  → 3 rot, darunter „Strg+Umschalt+3 ist
                                  h3 — ist bullet"
```

---

## E70 · Was sich nicht teilen lässt, wird nachgerechnet

**Datum** 8. August 2026 · **Lücke** L34 · **Prüflauf** `test143` (16 Punkte)

Redion sind drei Bündel: die App im Browserfenster, der Dienstarbeiter
`sw.js` und der Server bei Cloudflare. Keiner kann die Dateien der anderen
lesen — der Dienstarbeiter hat kein `window`, der Worker keinen Browser.

Wo sie sich trotzdem über einen Wert einig sein **müssen**, gibt es ihn
zwangsläufig zweimal. E67 hat das für die Dateigrenze zwischen Gerät und
Server festgehalten; hier kommen die zwei anderen dazu.

**Der Name der Ablage**

`KONSTANTEN.ABLAGE_NAME` ist `'notizen'`. Der Dienstarbeiter öffnet die
IndexedDB selbst, um fällige Erinnerungen zu holen, wenn die App
geschlossen ist — und stand dort als blanke Zeichenkette
`indexedDB.open('notizen')`.

Was ein falscher Name dort anrichtet, ist das Tückische: **keine
Fehlermeldung, sondern keine Erinnerungen.** Eine Erinnerung, die nicht
kommt, sieht aus wie eine, die nicht fällig war. Man merkt es Wochen
später oder nie.

Jetzt trägt der Dienstarbeiter eine benannte Konstante, und `test143`
vergleicht sie mit der der App.

**Der Offline-Vorrat gegen das, was geladen wird**

`index.html` lädt rund neunzig Skripte und dreizehn Stildateien.
`GRUNDSTOCK` in `sw.ts` legt sie beiseite, damit die App ohne Netz
startet. Zwei Listen, die niemand nebeneinanderlegt.

Fehlt dort eine Datei, startet die App offline **unvollständig** — und
auch das sieht nicht nach einem Fehler aus, sondern nach einer App, die
eine Sache nicht kann. In der Gegenprobe, mit `tabelle.css` aus dem
Vorrat entfernt:

```txt
✗ Und jede Stildatei ebenfalls — quell/schale/stil/tabelle.css
```

Offline wäre der Tabellenblock ohne Gestaltung gewesen.

Geprüft wird in beide Richtungen: jede geladene Datei liegt im Vorrat, und
keine Datei im Vorrat fehlt auf der Platte. `sw.ts` meldet Letzteres seit
jeher — aber nur in der Konsole, und dorthin sieht beim Ablegen niemand.

**Eine Liste, die zweimal in derselben Datei stand**

`EINFACHE_TYPEN` — die Blocktypen, die `auswahlUmwandeln` direkt setzen
kann — stand dreiundzwanzig Zeilen weiter unten noch einmal wörtlich, für
das Menü, das genau diese Typen anbietet.

Zwei Listen hiessen: entweder ein Knopf, der nichts tut, oder ein Typ, den
man nicht auswählen kann. Heute deckten sie sich; die Gegenprobe zeigt,
was der Prüflauf jetzt verhindert.

**Status**

`test143`, 16 Punkte. Gegenproben:

```txt
Ablagename auf 'redion'         → 1 rot
tabelle.css aus dem Vorrat      → 1 rot
Umwandelliste wieder doppelt    → 2 rot
```

**Damit ist L34 abgearbeitet** bis auf drei Kleinigkeiten, die dort
einzeln stehen: `KACHEL` und die Seitenleistenbreite je zweimal, und die
Unwucht, dass `Register.eigenschaften` kein `nimmZurueck` hat.

*Nachtrag vom selben Tag:* auch die drei sind erledigt.
`Register.eigenschaften.nimmZurueck` gibt es jetzt (Eingebautes bleibt
unabmeldbar; test142 benutzt es). Die beiden CSS↔TS-Paare — Kartenkachel
256 und Seitenleiste 260 — rechnet test143 §5 nach, samt Messung, dass der
Doppelklick wirklich auf die Startbreite zurückführt. Gegenproben: CSS auf
255 → 1 rot; `setze(240)` im gebauten `schale.js` → der Textvergleich der
Quelle blieb grün, die **Messung** wurde rot — genau dafür sind beide da.

---

## E71 · Ein Lesefehler ist kein leerer Bestand

**Datum** 8. August 2026 · **Betrifft** `src/kern/ablage/indexdb.ts`,
`src/bereiche/wissen/werkzeuge.ts`, `src/bereiche/seiten/ansicht/fassungen.ts`,
`src/bereiche/einstellungen/ansicht/seite.ts` · **Prüflauf** `test144`

**Was war**

Die beiden Grundfunktionen der Ablage schwiegen, wenn die Ablage nicht
antwortete:

```js
const all = (store) => new Promise((ok) => {
  ...
  r.onerror = () => ok([]);        // „nichts drin"
});
const del = (store, key) => new Promise((ok) => {
  ...
  r.onerror = () => ok();          // „erledigt"
});
```

Beide Zeilen sagen dasselbe Falsche: sie machen aus **„ich konnte nicht
nachsehen"** ein **„da ist nichts"**, und aus **„ich konnte nicht löschen"**
ein **„gelöscht"**. Der Aufrufer kann den Unterschied danach nicht mehr
erkennen — die Auskunft ist in beiden Fällen wortgleich.

**Warum das kein Schönheitsfehler war**

Der Weg, an dem es weh tut, ist das Einspielen einer Sicherung mit
„Ersetzen". Er liest erst den Bestand und löscht dann, was er gelesen hat:

```js
for (const fach of FAECHER)
  for (const satz of await all(fach)) await del(fach, satz.id);
```

Mit `ok([])` läuft die innere Schleife **null Mal**. Der alte Bestand bleibt
liegen, die neuen Sätze legen sich darüber, und der Mensch liest
„Sicherung geladen". Er hat dann eine Mischung aus zwei Ständen und weiss es
nicht.

Die Gegenprobe hat es in eine Zahl gefasst. Ein Bestand von **1973** Sätzen,
danach **1**:

```txt
✗ Der alte Bestand steht unverändert da — vorher 1973, nachher 1
```

Genau diese Zeile ist heute grün, weil der Vorgang jetzt abbricht, **bevor**
er etwas anfasst.

Dieselbe Sorte Schweigen stand im Versionsverlauf:

```js
const versionen = (pageId) => new Promise((ok) => {
  ...
  r.onerror = () => ok([]);
});
```

Das ist die gefährlichste der drei Stellen, obwohl sie am harmlosesten
aussieht. Wer den Verlauf aufschlägt und „0 Fassungen" liest, schliesst
daraus, dass es nichts wiederherzustellen gibt — und überschreibt die Seite
guten Gewissens. Der Verlauf ist die Rückversicherung; eine Rückversicherung,
die im Fehlerfall „gibt es nicht" sagt, ist schlimmer als keine.

**Was jetzt gilt**

Ein **fehlendes Fach** bleibt eine leere Liste. Eine junge Ablage hat
`versions` noch nicht, und das ist keine Störung:

```js
if (!db || !db.objectStoreNames.contains('versions')) return ok([]);
```

Ein **vorhandenes Fach, das nicht antwortet**, lehnt ab:

```js
r.onerror = () => fail(r.error || new Error('Der Versionsverlauf ist nicht lesbar'));
```

Der Unterschied zwischen „gibt es nicht" und „antwortet nicht" ist der ganze
Punkt dieser Entscheidung.

**Und was die acht Aufrufer daraus machen**

Ein `fail` nützt nichts, wenn es niemand auffängt. Jeder Aufrufer wurde
einzeln angesehen, weil jeder etwas anderes Richtiges tun muss:

| Aufrufer | Was jetzt passiert | Warum gerade das |
|---|---|---|
| `load()` beim Start | geht in den Nur-Speicher-Betrieb, mit Warnung | Die App muss starten, aber sie darf nicht so tun, als wäre der Speicher heil |
| `exportVorbereiten` | reicht den Fehler durch | Sonst stünde „Vollständig: keine Dateianhänge" in einer Sicherung, deren Anhangfach unlesbar war |
| Import „Ersetzen" | bricht ab, bevor gelöscht wird | Siehe oben — hier steht der Bestand auf dem Spiel |
| `purgeBlock` | vorhandener `catch`, jetzt mit richtigem Text und Hinweis | Endgültiges Löschen, das nur halb ging, muss man wissen |
| `versionSpeichern` (Ausdünnen) | `Reporter.warn`, sonst weiter | `werkzeuge.ts:854` ruft ohne `await` auf; ein Wurf ginge ins Leere. Und nicht ausdünnen heisst: der Verlauf wächst — nichts geht verloren |
| Verlaufsfenster (`werkzeuge`, `fassungen`) | sagt „nicht lesbar", statt „keine Fassung" | Der Unterschied, um den es geht |
| „Verlauf aufräumen" | bricht ab, löscht nichts | Die Liste wäre eine Auswahl aus den lesbaren Seiten. Nach unvollständigem Bild zu löschen ist unumkehrbar |

**`wipe()` dazu**

Beim Weg „alles löschen" durfte ein misslungenes Leeren ebenfalls schweigen.
Das ist die unangenehmste Stelle dafür, die es gibt: wer diesen Knopf
drückt, gibt den Rechner womöglich danach weiter. Bleibt ein Fach stehen und
niemand sagt es, hält er seine Daten für fort — und sie sind es nicht.
Jetzt wird gezählt, was nicht ging, und beim Namen genannt; **und es wird
nicht neu geladen**, denn ein leerer Bildschirm nach dem Neuladen wäre genau
die Lüge.

**Was bewusst NICHT angefasst wurde**

`stueckeVon()` schweigt weiter. Es liegt im Weg des Abgleichs
(`maschine.ts:675, 698, 733`), und Abgleichslogik ist in dieser Sitzung
ausdrücklich nicht zu ändern. Die Lücke steht als **L35**, und `test144`
hält sie mit einem Punkt fest, der **umgedreht werden muss**, sobald sie
geschlossen ist — eine Lücke, an die kein Prüflauf erinnert, wird vergessen.

**Status**

`test144`, 22 Punkte, alle grün. Gegenprobe — die drei Zeilen im gebauten
`quell/kern/ablage/indexdb.js` zurückgedreht:

```txt
all → ok([])          ┐
del → ok()            ├→  9 Punkte rot
versionen → ok([])    ┘
```

**Eine Nebenlehre über Gegenproben.** Der erste Versuch drehte im gebauten
`.js` mit dem Text aus der `.ts` zurück — und traf zwei von drei Zeilen
nicht, weil `tsc` die Ausrichtung der Zuweisung glättet
(`r.onerror   =` wird zu `r.onerror =`). Ergebnis: zwei rote Punkte statt
neun, und beinahe der Schluss „die Prüfung kann gar nicht rot werden".
Eine Gegenprobe muss **selbst nachweisen, dass sie gegriffen hat** — seither
zählt das Skript seine Treffer und meldet `OK 1x` je Zeile.

---

## E72 · Heilen heisst auffüllen, nicht überschreiben

**Datum** 8. August 2026 · **Betrifft** `src/kern/ablage/formen.ts` ·
**Prüflauf** `test145`

**Was war**

`formen.ts` versprach in seinem eigenen Kopf zwei Regeln, und die zweite
lautete wörtlich: *„Ein vorhandener Wert wird nie ersetzt, auch wenn er
komisch aussieht."* Dreissig Zeilen tiefer stand:

```js
else raus[name] = regel.vorgabe();
geheilt.push(name + ' hatte die falsche Art');
```

Passte die Sorte nicht und griff keine der vier Umformungen, trat die
Vorgabe an die Stelle des Wertes — bedingungslos. Der Lauf ist
`load()` → `Formen.zustand(true)`, also **jeder Start**. Gemeldet wurde als
`Reporter.info`, das heisst: gar nicht sichtbar.

**Wen es trifft**

Die Felder mit Vorgabe sind nicht die Randfelder:

```txt
text     Objekt statt Zeichenkette  → ''    der Text des Menschen
props    Liste statt Objekt         → {}    alle Zeilenwerte
schema   Liste statt Objekt         → {}    alle Spalten einer Datenbank
content  Objekt statt Liste         → []    alle Kinder eines Blocks
```

Genau die Formen, die ein Import aus einem fremden Werkzeug oder eine
fremde Sicherung liefert. Ein Quill-Export etwa trägt `text` als
`{ ops: [{ insert: … }] }` — lesbar für jeden Menschen, „falsche Art" für
`heile`, und nach dem nächsten Start eine leere Zeichenkette.

Die zweite Stelle: Kinder-Kennungen, die gerade nicht im Speicher stehen,
flogen ersatzlos aus `content`. „Steht nicht im Speicher" trifft aber auch
einen Block, den der Abgleich **noch nicht geholt hat**. Kommt er an, ist
die Verbindung zu seinem Elternteil längst hinausgeschrieben — `heile`
ändert den Satz an Ort und Stelle, den Rest erledigt der nächste `flush`.

**Die Entscheidung**

Regel 2 gilt jetzt wirklich, mit einer Unterscheidung, die vorher fehlte:

**Was nichts trägt, darf ersetzt werden.** `''`, `0`, `false`, `[]`, `{}` —
die Leere in falscher Verpackung. Hier geht durch die Vorgabe nichts
verloren, und eine Kiste dafür wäre eine Müllhalde, die durch jede
Sicherung mitwanderte.

**Was etwas trägt, wird beiseitegelegt.** Der Wert wandert nach
`unlesbar` im selben Satz; die Vorgabe tritt an seine Stelle, damit die
Oberfläche läuft. `unlesbar` ist ein unbekanntes Feld im Sinne von
Regel 1 — es bleibt stehen, wandert durch `.json` und `.redion` mit und
lässt sich später ansehen. Die Meldung sagt es beim Namen:
`text war unlesbar und liegt jetzt unter „unlesbar"`.

Die fehlenden Kinder ebenso: sie verlassen `content` (die Oberfläche
zeichnete sonst leere Zeilen), aber ihre Kennungen liegen unter
`unlesbar.contentFehlt` — beim zweiten Durchgang ohne Doppelung.

**Warum nicht einfach `fail`?** Weil `heile` beim Start läuft und die App
starten muss. Ein Satz, der die Oberfläche zu Fall bringt, ist schlimmer
als einer mit Vorgabe und Kiste. Der Unterschied zu E71: dort ging es um
**Auskünfte** („da ist nichts"), die falsch waren — hier geht es um
**Inhalt**, der verschwand.

**Status**

`test145`, 32 Punkte. Gegenprobe — im gebauten `formen.js` den
`traegtInhalt`-Zweig auf `false` und den `content`-Filter wieder ersatzlos
gestellt: **7 Punkte rot**, darunter die Meldung von früher im Wortlaut
(`text hatte die falsche Art` — und der Text war weg).

---

## E73 · Eine Prüfung ruft die Funktion, nicht ihre Abschrift

**Datum** 8. August 2026 · **Betrifft** `pruefungen/lauf/test100.mts` ·
**Prüflauf** `test100`

**Was war**

`test100` — der wichtigste Lauf für die `.redion`-Sicherung — baute das
Archiv nicht mit `sicherungSpeichern`, sondern mit dreissig Zeilen, die
Wort für Wort aus `schale.ts` abgeschrieben waren: der Namens-Entdoppler,
die Zuordnungskarte, alles. Der Kommentar sagte es sogar ehrlich: *„genau
wie `sicherungSpeichern` es tut"*.

Eine Abschrift prüft sich selbst. Die Gegenprobe hat es vorgeführt: mit
zerbrochenem Entdoppler in der **echten** Funktion blieb der alte Lauf
grün — er rechnete mit seiner eigenen, heilen Kopie. Der neue wird rot:

```txt
✗ Beide liegen unter ihrem echten Namen im Archiv
  — ["daten.json","dateien/ferien.jpg","dateien.json"]
✗ Der Anhang ist zurück, Byte für Byte identisch — 0 statt 307200 Byte
```

Zwei Anhänge mit demselben Namen, keiner entdoppelt, das Auspacken
überschreibt den einen mit dem anderen — genau der stille Fehler, vor dem
der Kommentar im echten Code warnt.

**Warum die Abschrift überhaupt da war**

`sicherungSpeichern` gibt den Blob nicht zurück, sie lädt ihn herunter
(`a.download` + `click()`). Der Lauf kam an das Archiv nicht heran und
baute es deshalb nach.

**Die Entscheidung**

Nicht die App umbauen, sondern den Download abfangen. Der Lauf ersetzt für
einen Aufruf `URL.createObjectURL` (legt den Blob beiseite) und schluckt
den Klick auf `download`-Anker, ruft dann `App.sicherungSpeichern()` und
dreht beides zurück. Kein neuer Rückgabewert, keine zweite Schnittstelle,
kein Umbau am Sicherungsweg — der ist tabu (Vorgabe von Redur), und er
bleibt unangefasst.

Nebengewinn: der echte Weg kann jetzt Dinge beweisen, an denen die
Abschrift vorbeilief — der Dateiname ist `redion-sicherung-JJJJ-MM-TT.redion`,
und `sicherung:art` steht danach auf `redion`, womit „Noch nie gesichert"
aus der Erinnerung verschwindet.

**Die Regel daraus**

Wenn eine Prüfung Code abschreibt, statt ihn zu rufen, prüft sie den
Abschreiber. Kommt man an das Ergebnis der echten Funktion nicht heran,
ist das Abfangen des Seiteneffekts (Download, Toast, Meldung) dem
Nachbauen der Funktion immer vorzuziehen.

---

## E74 · Ein halber Upload ist kein halbes Video

**Datum** 8. August 2026 · **Betrifft** `src/bereiche/dateien/ablage.ts`
(`alsBlob`) · **Prüflauf** `test100` §2b

**Was war**

Tab geschlossen bei Stück 25 von 40: der Dateisatz bleibt auf `laeuft`,
25 Stücke liegen in der Ablage. `alsBlob` reihte aneinander, was da war —
ohne `stuecke.length` gegen `satz.teile` zu halten. Die `.redion`-Sicherung
trug dann ein halbes Video unter vollem Namen, während `dateien.json`
daneben 40 Teile deklarierte. Beim Einspielen wurde aus den 25 Stücken
`zustand: 'fertig'` — und der Verlust war keine Lücke mehr, sondern
unsichtbar.

**Die Entscheidung**

`alsBlob` setzt nur zusammen, was vollständig ist. Fehlen Stücke, kommt
`null` — mit einer `Reporter`-Warnung, die sagt, wie viele von wie vielen
da sind. Die Sicherung überspringt die Datei dann (wie bisher schon eine
ohne jedes Stück), statt einen Torso als Anhang auszugeben; die Anzeige
zeigt nichts statt eines halben Bildes.

Der Wächter greift nur bei `teile > 0` als Zahl — ein Altsatz ohne das
Feld wird nicht plötzlich unlesbar.

**Was offen bleibt** — die zweite Hälfte von D6: `stueckeVon` antwortet auf
einen LESEFEHLER weiter mit `[]` (L35, Abgleichsweg, in dieser Sitzung
tabu). Der Wächter hier fängt den halben Bestand, nicht das kaputte Lesen.

**Status** — `test100` §2b: Upload mit 2 von 3 Stücken → `alsBlob` gibt
`null`, die echte Sicherung (E73: abgefangener Download) trägt die Datei
nicht. Gegenprobe: Wächter auf `false` → beide Punkte rot, der Torso
wandert wieder ins Archiv.

---

## E75 · Sechs Prüfpunkte, die nicht rot werden konnten

**Datum** 8. August 2026 · **Betrifft** test65, test86, test89, test97,
test136, test137

§55.2 in einem Satz: wer eine Prüfung schreibt, prüft zuerst, ob sie
überhaupt rot werden KANN. Die Suche vom 8. August fand sechs, die es
nicht konnten — jede aus einem anderen Grund, und genau darum stehen alle
sechs hier:

**P1 · test137: eine Klasse, die es nie gab.** `.tbl-zk` — richtig ist
`.tbl-zn` — und `-1` („nicht gefunden") zählte als bestanden. Ein auf
12 px gestauchter Zeilenkopf (klarer §37-Bruch) wäre grün geblieben.
Jetzt wird die echte Klasse gemessen und `-1` ist rot.

**P2 · test136: `-1` gegen `-1`.** Fehlten `.tbl-ecke`/`.tbl-spalten`,
verglich der Punkt zwei Rückfallwerte und meldete „steht still" für ein
Element, das es nicht gab. Dazu wurde waagerecht gerollt, aber `top`
gemessen — eine Zahl, die sich dabei auch ohne sticky nicht bewegt.
Jetzt: Existenz ist ein eigener Punkt, gemessen wird `left`.

**Der Fund dahinter:** der reparierte Punkt wurde sofort rot (21 → 0) —
aber nicht die App war kaputt, sondern die Messung hielt einen VERALTETEN
Knoten: das fensterweise Zeichnen baut die Zeilen beim Rollen neu, der
alte `.tbl-zn` hing nirgends mehr und mass `left: 0`. In der echten App
stand die Spalte auf den Pixel (29 → 29, eigens nachgemessen). Nach dem
Rollen neu suchen — sonst prüft man die Müllabfuhr des Browsers.

**P3 · test65: `spanne <= 4`.** Vier ist genau die kaputte Fassung
(Ersatzanker → Shift-Klick markiert vier statt einem). Jetzt `=== 1`.

**P4 · test86: `weiteres >= 0`.** Eine Array-Länge ist immer ≥ 0. Jetzt
wird nachgezählt: die Summe über alle Gruppen muss die Registerlänge
ergeben.

**P5 · test97: `a < a + b`.** Das ist `b > 0` — über den ersten Durchgang
sagte der Punkt nichts, und `blockWegNachErster` stand als Literal `false`
im Ergebnis. Jetzt wird ZWISCHEN den Runden gemessen, ob Runde eins den
Block wirklich verschont hat.

**P6 · test89: die Endlosschleife im eigenen Faden.** Wer eine synchrone
Endlosschleife mit `Date.now()` danach misst, misst nie — der Lauf hängt,
und `alle.mts` gleich mit. Der Ring läuft jetzt in einem Arbeitsfaden mit
Zwei-Sekunden-Wecker: kommt er nicht zurück, ist der Punkt rot und der
Lauf lebt. Die Gegenprobe (Schleifenwächter `n++ < 50` entfernt) meldet
`✗ … haengt` statt zu stehen. Und eine Lehre aus dem ersten Entwurf: der
rief danach „zur Sicherheit" noch einmal im Hauptfaden — und hing bei der
Gegenprobe genau dort.

**Die Regel, noch einmal:** `<= n`, `>= 0`, Rückfallwert gegen
Rückfallwert, Literal im Ergebnis, Messung nach einer Endlosschleife —
das sind fünf Schreibweisen desselben Fehlers: eine Behauptung, die unter
keiner Bedingung falsch werden kann, ist keine.

---

## E76 · Erfolg heisst: es ist passiert

**Datum** 8. August 2026 · **Betrifft** sieben Stellen aus dem Durchgang
„sagt eines, tut ein anderes" (A1–A6, D4, D7, D10) · **Prüfläufe**
`test146` (neu), `test58` (erweitert)

**Der gemeinsame Fehler**

Sieben Stellen meldeten Erfolg, ohne hinzusehen. Nicht dieselbe Zeile,
aber dasselbe Muster: die Meldung entstand aus dem **Absenden**, nicht aus
dem **Ankommen**.

**Die Stellen, und was jetzt gilt**

**A1 — Webhook meldet „geschickt" bei 401.** `KI.holen` wirft bei
nicht-wiederholbaren Statuscodes bewusst nicht, sondern gibt die Antwort
zurück; sechs Aufrufer verlassen sich darauf. Die zwei Webhook-Stellen
(Knopf im Editor, Automation in der Datenbank) schrieben trotzdem nur
`.then(… geschickt)`. Jetzt prüfen beide `r.ok` und nennen sonst Status
samt `KI.FEHLERTEXT`. Der Vertrag von `holen` blieb unangetastet.

**A2 — Der Laufverlauf zeigte ✓ für einen Webhook, der nie ankam.** Der
Webhook läuft neben dem Lauf her; `notieren()` schreibt den Verlauf,
bevor die Antwort da ist. Der Griff: `notieren` legt das `laufNotiz`-Objekt
**als Referenz** in den Verlauf — ein später Fehler kann den Eintrag also
noch auf ⚠ drehen und `verlaufSichern` schreibt ihn erneut. Dasselbe für
`ki-fuellen`, dessen Ablehnung vorher unbehandelt verpuffte. Grenze des
kleinsten Eingriffs: ein bereits GEÖFFNETES Verlaufsmenü zeigt den alten
Stand, bis man es neu öffnet.

**A3 — „15 Einträge gefüllt", auch wenn nichts ankam.** Der KI-Agent
zählte angefasste Zeilen. `kiFeldFuellen` sagt jetzt zurück, ob wirklich
etwas Brauchbares in der Zelle steht — per **Nachlesen** aus dem Speicher,
denn `setProp` kehrt bei fehlendem Spaltenrecht still zurück, und die
Rechteprüfung anzufassen war tabu. Der Agent zählt damit ehrlich
(„3 von 15 gefüllt, 2 mit Fehler, 10 ohne Antwort oder ohne
Schreibrecht"). Und eine Zelle bleibt nicht mehr ewig auf „… denkt nach"
stehen, wenn die KI wirft — sie sagt „(Fehler)".

**A4 — „Gesichert: foto.jpg" während der Prüfsumme.** Der einzige
Fortschritts-Rückruf des Packers feuert in der CRC-Schleife; das Archiv
ist da noch nicht gebaut, geschweige denn heruntergeladen. Der Toast sagt
jetzt „Geprüft: … — wird verpackt". Das Wort „Gesichert" gehört dem
Abschluss.

**A5 — „Der ganze Bestand", ohne die Anhänge.** Die verschlüsselte
Sicherung ruft `exportAll()` ohne Anhänge — und ihr Manifest gibt das
sogar zu (`fehlt: ['dateien','stuecke']`), nur AES-verschlüsselt, wo es
niemand liest, bevor er es braucht. `exportAll(true)` wäre KEINE Lösung
gewesen: die Blobs kämen trotzdem nicht mit, das Manifest löge dann erst
recht. Also sagt es jetzt der Dialog („Dateianhänge sind nicht dabei —
vollständig sichert nur .redion"), und der Toast sagt es noch einmal,
wenn es Anhänge gibt.

**A6 — Die Schublade endete 24 px unter dem Bildschirmrand.** Eine Regel
rechnete `100% − 56px` für eine untere Leiste (`#handy-leiste`), die kein
Skript mehr erzeugt — und weil `top: 80px` stehen blieb, wurde die
Schublade nicht kürzer, sondern ragte unten hinaus, samt der Knöpfe am
Fuss. Die Regel ist ersatzlos weg; die Grundregel setzt die Unterkante
exakt auf den Rand. Die Gegenprobe mass vorher `bottom: 868` bei 844 hoch.

**D4 — `setMeta` verschluckte Schreibfehler.** `.catch(() => {})` machte
aus „liess sich nicht speichern" ein „gespeichert". Am härtesten träfe
das `wolkeSalz`. Jetzt: `Reporter.warn` plus EIN Toast je Sitzung.
Bewusst warn, nicht error — `Reporter.error` ruft die Pflege, die Pflege
schreibt ihre Fehlerliste per `setMeta`, und bei einem anhaltenden
Speicherfehler wäre das eine endlose Schleife. Signatur und alle ~170
Aufrufer blieben unverändert.

**D7 — Der Sichern-Knopf zeigte „✓ Gesichert" nach dem Fehlschlag.**
`sicherungSpeichern` fängt seine Fehler selbst (richtig so — der Alert
„Es wurde nichts geschrieben" gehört dazu) und kehrte dann regulär
zurück; `.then(() => fertig(true))` kann das nicht unterscheiden. Jetzt
gibt sie `Promise<boolean>` zurück (§52.11), und der Knopf wertet
`gut !== false` — die tolerante Form, damit ein Prüf-Stellvertreter, der
`undefined` liefert, nicht rot wird.

**D10 — „Archiviert", und bei Gmail lag die Mail noch im Eingang.** Die
zwei Tasten, die eine Zeile VERSCHWINDEN lassen (E, #), gingen lokal vor
und schickten den Gmail-Aufruf durch `versuche()`, das jede Ablehnung
schluckt. Jetzt: erst der Server, dann lokal; lehnt Gmail ab, bleibt die
Zeile liegen und der Toast nennt den Grund — nichts muss zurückgerollt
werden. Eine .eml-Mail (erkennbar am leeren `link`) bekommt gar keinen
Gmail-Aufruf mehr, sondern die ehrliche Auskunft „nur hier". Die
nicht-zerstörenden Tasten (gelesen/wichtig) behalten `versuche()` —
dort verschwindet nichts.

**Status**

`test146`, 22 Punkte · `test58` +1 Punkt (Webhook-401 → ⚠ im Verlauf).
Gegenprobe im gebauten Bestand, alle sechs Verhaltenspunkte kippten:

```txt
Rückgabewerte weg (D7)        → 2 rot (undefined statt true/false)
Zählung weg (A3)              → 2 rot
CSS-Regel zurück (A6)         → 1 rot: bottom 868 bei 844 hoch
setMeta-catch leer (D4)       → 1 rot
webhookFehler stumm (A2)      → test58 rot
```

**Offen aus diesem Durchgang** — D11 (KI „Zurückgenommen" nimmt nur
Protokolliertes zurück), D12 (Notion-Import lässt Anhänge stumm fallen),
D14 (`flush` meldet Erfolg vor der Platte), K1–K5 (Prüflauf-Kosmetik).
Die Prüfagenten dafür fielen dem Sitzungslimit zum Opfer; die Befunde
stehen im Bericht und sind nicht widerlegt.

---

## E77 · Zurücknehmen, Mitnehmen, Aufschreiben (D11, D12, D14, K1–K4)

**Datum** 8. August 2026 · **Prüfläufe** `test147` (neu), Korrekturen in
`test113`, `test116`, `test131`, `test87`

**D11 — „Zurückgenommen", und die Hälfte blieb.** Der Knopf nach einem
Agentenlauf nahm zurück, was in `protokoll.ids` stand. Eingetragen haben
dort nur zwei der fünf schreibenden Werkzeuge etwas. Jetzt gilt:

- `zeileAnlegen` trägt die neue Zeile ein (anlegen → löschen ist die
  richtige Rücknahme),
- `feldFuellen` merkt sich je Zeile den ALTEN Wert (`protokoll.felder`),
  und `zuruecknehmen` stellt ihn wieder her — eine echte Rücknahme statt
  einer Löschung,
- der `worker` KANN nicht zurückgenommen werden; er trägt sich unter
  `protokoll.bleibt` ein, und der Toast sagt es, statt zu schweigen.

**D12 — Der Notion-Import warf Anhänge stumm weg.** Gelesen wurden .md,
.csv, .json; alles andere fiel ohne Zähler unter den Tisch — ein Export
mit zwölf Bildern kam als „8 Seiten übernommen" an. Jetzt werden bekannte
Medien (Bilder, PDF, Video, Audio …) als echte Dateien abgelegt
(`Dateien.ablegen`, mit Stücken und stabiler Kennung) und als Block in die
Seite gehängt; Unbekanntes wird GEZÄHLT und im Hinweis genannt
(„… 2 Dateien nicht übernommen (.xyz)"). Die leere Doppelseite für
Bild-Ordner verschwindet nebenbei: der Ordner hält jetzt den Bild-Block.

**D14 — `flush` meldete Erfolg, wenn die Transaktion ZU ENDE war — egal
wie.** `oncomplete`, `onerror` und `onabort` zeigten auf dasselbe `ok`.
Der Kommentar darüber versprach „ERST WENN ES WIRKLICH AUF DER PLATTE
STEHT" — und genau auf dieses falsche Versprechen hin ging „geändert" an
die Nachbarfenster, auch für Sätze, die nie ankamen. Jetzt: `oncomplete`
erfüllt und meldet; `onerror`/`onabort` lehnen ab, melden nichts an die
Nachbarn und legen die Sätze zurück in den Stapel (`pending`), damit der
nächste flush es wieder versucht. Der Rückfallweg (einzelne puts) zählt
seine Fehlschläge, statt sie mit `.catch(() => {})` zu schlucken.
Aufrufer: in der App nur `beforeunload` (Feuer-und-vergessen, bekommt ein
`.catch`); die ~27 Prüfläufe rufen mit gesunder Ablage und bleiben grün.

**K1–K4 — Prüfpunkte, die nicht rot werden konnten.**
- `test113`: „Ohne die Regel wären es fünf gewesen" rechnete
  `Math.min(5, 31)` aus den eigenen Konstanten — Arithmetik, kein
  Prüfpunkt. Ist jetzt Kommentar; die Quelltext-Zusicherungen daneben
  (die echte while-Schleife in `maschine.js`) bleiben.
- `test116`: „index.html ist unverändert gültig" prüfte `includes('<html')`.
  Heisst jetzt ehrlich, was es prüft, und schaut zusätzlich aufs Ende.
- `test131`: `p('… und es wird auch nicht geworfen', true)` — das Literal
  ist durch try/catch ersetzt.
- `test87`: die Gegenprobe testete ein Regex-LITERAL gegen ein
  String-LITERAL. Das Muster steht jetzt EINMAL als Konstante und wird an
  beiden Stellen benutzt — erst dadurch prüft die Gegenprobe die Prüfung.
- K5 (`test89`) war ein Fehlalarm: die zwei `typeof`-Punkte sichern die
  Prämisse des Laufs (kein DOM in Node), und der Ladepunkt darüber wird
  rot, wenn `dienst.js` doch ein `document` anfasst.

**Status**

`test147`, 17 Punkte · `test113`/`test116`/`test131`/`test87` korrigiert,
alle grün. Gegenprobe im gebauten Bestand, jede Wirkung einzeln gekippt:

```txt
zeileAnlegen trägt nicht ein     → 1 rot (Protokoll leer)
Wiederherstellen ausgehängt      → 2 rot (KI-Text bleibt)
Medienzweig weg (D12)            → 4 rot („2 Datei(en) nicht übernommen")
flush-Teilfehler meldet ok       → 1 rot („kam durch")
```

Bemerkenswert an der letzten Zeile: der erste Kippversuch drehte nur den
ABBRUCH-Arm um, und der Punkt blieb grün — die Probe läuft durch den
Teilfehler-Arm, nicht durch den Abbruch. Erst der zweite Dreh bewies den
Punkt. Eine Gegenprobe, die den falschen Arm kippt, beweist nichts über
den richtigen.

---

## E78 · Die Zielarchitektur: React, Vite, Dexie, ProseMirror — als Strangler, nie als Big-Bang

**Datum** 8. August 2026 · **Entschieden von** Redur · **Betrifft** alles —
aber in Phasen, nicht auf einmal

**Die Entscheidung**

Redur hat entschieden, Redion auf die folgende Zielarchitektur zu führen:

```txt
Hauptsprache        TypeScript
UI                  React 19 + TSX
Build               Vite 8, ESM, kein CommonJS
Strukturierte Daten IndexedDB + Dexie
Grosse Dateien      OPFS, mit IndexedDB-Rückfall
Validierung         Zod
Rich-Text           ProseMirror (nur je Textblock, nicht als Datenmodell)
Styling             CSS + CSS-Variablen
Unit-Tests          Vitest
E2E                 Playwright (bleibt)
PWA                 bleibt, eigener Service Worker
Cloud               Cloudflare Workers + D1 + R2, weiterhin optional
Desktop später      Tauri, nicht Electron
Kein Next.js, kein SSR, keine Server-Pflicht.
```

Installiert am 8. August: react 19.2.8 · vite 8.2.1 · vitest 4.1.10 ·
dexie 4.4.4 · zod 4.4.3.

**Zwei Grundsätze werden damit aufgegeben — ausdrücklich und von Redur:**

```txt
„Kein Framework"                          → aufgegeben
„index.html per Doppelklick, für immer"   → aufgegeben als Endziel
```

Der zweite gilt als ENDZIEL-Aufgabe, nicht als Sofort-Bruch: bis Phase
RM-10 den Parity-Test besteht, bleibt der Bestand vollständig lauffähig —
Doppelklick, Einzeldatei, alle 118 Prüfläufe. Der Nutzer braucht auch am
Ende kein Node; nur der Entwickler baut.

**Diese Grundsätze werden dafür härter geschützt als bisher:**

```txt
local-first · offline-first · Daten gehören dem Nutzer · kein Pflichtkonto
keine Cloud-Pflicht · atomare Sicherungen · keine Datenverluste
modulare Domain-Architektur (React ist NUR die Darstellungsschicht)
```

**Warum jetzt.** Die ehrliche Diagnose aus der Beratung: Redion verwaltet
Overlay-Stapel, Fokus-Wiederherstellung, Dialog-Lebenszyklen, Sheets und
reaktive Zustände von Hand — ein selbstgebautes UI-Framework. Genau in
dieser Schicht lagen die Fehler dieser Woche (doppelter Fokusrahmen,
Schublade unterm Bildschirmrand, `.menu` gegen `.menu-grund`). React
übernimmt diese Ebene; die Domain-Logik bleibt frameworkfrei und testbar.

**Die Phasen (Strangler, eine Datenquelle, niemals zwei Wahrheiten)**

```txt
RM-0   Stand einfrieren; Regressionsnetz = die 118 Prüfläufe (existiert)
RM-1   Vite + ESM + neue Projektstruktur NEBEN dem Bestand      ← begonnen
RM-2   Zentrale Typen, Zod-Schemas, IDs, Domain-Modelle         ← begonnen
RM-3   Dexie-Persistenz NEBEN der bestehenden Ablage            ← begonnen
RM-4   Datenmigration mit Vergleich alt ↔ neu, Byte für Byte
RM-5   React-Shell, Navigation, Modal/Sheet-System
RM-6   Bereich für Bereich auf React
RM-7   Editor auf ProseMirror (je Textblock ein PM-Dokument)
RM-8   Dateien auf OPFS + SHA-256-Adressierung (Dedup für R2-Sync)
RM-9   Outbox/Sync-Schicht formalisieren
RM-10  quell/ entfernen — NUR nach vollständigem Parity-Test
```

**Die drei harten Regeln der Migration**

1. **Eine Datenquelle.** Die IndexedDB `notizen` bleibt die einzige
   Wahrheit, und der Bestand bleibt ihr einziger Schreiber, bis RM-4 die
   Migration mit Vergleich bestanden hat. Die neue Schicht LIEST bis dahin
   nur. Dexie fasst `notizen` NIEMALS an — es arbeitet ausschliesslich
   gegen die neue Ablage `redion-neu`. Ein Dexie-`open` auf `notizen`
   wäre ein Schema-Upgrade auf echten Nutzerdaten: verboten.
2. **Der Bestand bleibt grün.** Jede RM-Phase endet mit allen Prüfläufen
   grün und einer baubaren Einzeldatei. Eine Phase, die den Bestand
   bricht, ist nicht „fast fertig", sondern falsch geschnitten.
3. **Kein Big-Bang.** Der Beratungstext selbst verbietet „schreib alles
   neu"; wer eine Phase überspringen will, braucht einen neuen Eintrag
   hier.

**Feldnamen bleiben Daten.** Auch unter Dexie/Zod heissen die Felder so,
wie sie gespeichert sind (`created`, `alive`, `groesse`, `enthaelt` …).
Die Zod-Schemas beschreiben den IST-Zustand; eine Umbenennung wäre eine
Datenmigration und braucht RM-4, nicht ein Suchen-und-Ersetzen (§53.3).

**Was der Beratungstext über den heutigen Stand falsch annahm** — fürs
Protokoll, damit niemand daraus plant: der Bestand ist seit L1 vollständig
TypeScript (nicht „quell/ viel JavaScript"); IndexedDB ist längst
Hauptspeicher (nicht localStorage); Blöcke sind strukturiert (nicht HTML);
Tombstones (`alive`), Versionen und änderungsbasierter Abgleich existieren
und sind getestet; `.redion` ist bereits das ZIP-Paket mit Manifest und
stückweisen Prüfsummen. Diese Stärken werden ÜBERNOMMEN, nicht neu
erfunden.

**Status am Abend des 8. August** — RM-1 bis RM-3 stehen als Gerüst, und
die Kette ist an echten Daten bewiesen:

```txt
npm run dev / build     Vite 8, app.html neben index.html, dist-neu/
npm run test:unit       Vitest: 14 Punkte (Schemas, Dexie-Schicht)
npm run typecheck       prüft Bestand UND neue Schicht
src/domain/schema.ts    Zod-Schemas des IST-Zustands (Feldnamen wie gespeichert;
                        der erste Wurf schrieb `page` statt `pageId` — E21 wirkt)
src/persistence/        Dexie NUR gegen `redion-neu` (wirft bei `notizen`),
                        Bestandsleser roh und ohne Versionsnummer
src/app/                React-Shell: liest echte Seiten, nur lesend
```

`test149` wacht über die drei Regeln — alte App schreibt, Shell liest
dieselbe Ablage, Satz für Satz unverändert danach, `redion-neu` entsteht
beim Lesen nicht. Die Gegenprobe (eine heimlich schreibende Shell) hat den
ersten Wurf des Wächters entlarvt: der Vorher-Abzug lag hinter dem ersten
Shell-Besuch, ein idempotenter Schreiber blieb unsichtbar. Der Abzug liegt
jetzt davor, und die schreibende Shell macht den Punkt rot.

Der Bestand blieb dabei vollständig grün: quell/ ohne ein geändertes Byte,
Einzeldatei baut, test31/87/105/109 grün (test109 bewacht jetzt die VIER
beschlossenen Abhängigkeiten als Allowlist statt „keine").

**RM-4, noch am selben Abend** — `src/persistence/migration.ts`: alle neun
Fächer werden aus `notizen` herauskopiert (nur lesend) und danach
NACHGERECHNET — Satz für Satz über stabile JSON-Form, Stücke Byte für Byte
in 4-MB-Schritten. `test150` führt das mit dem GEBAUTEN Code an echten
Daten aus (Seite, Datenbank, 3-MB-Datei mit Stücken, Fassung) und kippt in
der eigenen Gegenprobe ein Byte, einen Satz und erfindet einen dritten —
alle drei Wege werden rot gemeldet (`blob-ungleich`, `ungleich`,
`fehlt-alt`). `notizen` ist nach alledem Satz für Satz identisch.
Vitest: 6 weitere Punkte gegen ein rohes Nachbau-`notizen` mit den echten
keyPaths. Die neue Ablage kennt jetzt auch `basis` und `vorrat`.

---

## E79 · Einspielen ist ganz oder gar nicht

**Datum** 8. August 2026 · **Betrifft** `importAll` in
`src/kern/ablage/indexdb.ts` · **Prüfläufe** `test152` (neu), `test144`
(nachgezogen)

**Der Satz aus dem Architektur-Text, wörtlich:** „Ein kaputter Import darf
niemals die aktuelle Redion-Datenbank halb überschreiben."

**Was war.** E71 sicherte den Abbruch VOR dem ersten Anfassen ab. Aber
das Einspielen selbst lief als hunderte einzelne Transaktionen: erst die
Löschschleife, dann die Schreibschleife. Wer dazwischen Tab, Strom oder
Speicherplatz verlor, behielt einen halben Bestand — die eine Hälfte
gelöscht, die andere nie geschrieben. §13 nennt genau das als Verbot
(„bei Fehlern halbe Zustände hinterlassen"), und es galt trotzdem nicht.

**Was jetzt gilt.** Das ganze Einspielen — Schlüssel lesen, löschen,
schreiben, der Versionsverlauf — läuft in EINER IndexedDB-Transaktion über
die fünf Fächer. Eine IndexedDB-Transaktion ist ganz oder gar nicht:
bricht irgendetwas ab, rollt der Browser alles zurück. Der
Zwischenspeicher wird erst NACH dem `oncomplete` umgestellt — der
Bildschirm zeigt nie einen Stand, der nicht auf der Platte steht. Der
Abbruch trägt sich in die Fehlerliste ein, damit der Vorfall nachlesbar
ist.

**Die drei Arme, und warum jeder seinen eigenen Beweis braucht.** Ein
Einspielen kann an drei Stellen scheitern, und jede führt anders zum
Rollback:

```txt
1  Lesen der Schlüssel scheitert   → eigenes onerror je Anfrage: abort + Ablehnung
2  Schreiben wirft synchron        → catch in schreiben(): abort + Ablehnung
3  Transaktion bricht asynchron ab → t.onerror/t.onabort: Ablehnung
```

Arm 1 hat obendrein eine Feinheit: OHNE das eigene `onerror` je Anfrage
liesse ein Fach, das nie antwortet, die Transaktion LEER durchgehen —
nichts gelesen, nichts geschrieben, `oncomplete` meldet Erfolg. Genau das
fand `test144` §3 nach dem Umbau: seine Sabotage (eine Anfrage, die nie
über `onsuccess` antwortet) machte den Import zum stillen Leerlauf.

**Die Gegenproben-Lehre, zum dritten Mal in dieser Woche:** Beim Kippen
der Arme im gebauten Bestand blieben die ERSTEN ZWEI Versuche grün — die
Sabotage von test152 §1 läuft durch Arm 2, gekippt hatte ich erst Arm 3,
dann Arm 1. Eine Gegenprobe, die den falschen Arm kippt, beweist nichts
über den richtigen (E77 sagte es beim flush, E79 bestätigt es beim
Import). Bewiesen sind jetzt: Arm 1 durch test144 §3 (war rot, bis das
eigene onerror kam), Arm 2 durch test152 §1 (gekippt → 4 Punkte rot).
Arm 3 hat keinen eigenen Kipp-Beweis — er ist die Rückfalldecke des
Browsers unter den beiden anderen, und das steht hier, statt es zu
verschweigen.

**test152 fand ausserdem seine eigene Falle:** die erste Sabotage traf
`views` — und die Prüfsicherung ENTHIELT keine views. Null Schreibversuche,
null Scheitern, alles grün. Sabotiert wird seither, was wirklich
geschrieben wird. Und der Plattenvergleich musste die `fehlerliste`
ausnehmen — der abgebrochene Import trägt sich dort ein, das ist gewollt
und jetzt ein eigener Prüfpunkt statt einer Abweichung.

**Später am Abend — alle zehn Phasen haben ihr geprüftes Fundament:**

```txt
RM-5  Shell: Hash-Router (20 eigene Zeilen), Seitenansicht nur lesend,
      Sheet als <dialog> mit Escape und Fokus-Rückkehr        test151
RM-6  Datenbank-Tabelle in der Seite, Rohwerte; Formelspalten
      sagen „(rechnet der Bestand)" statt falscher Zahlen      test151 §3b
RM-7  ProseMirror-Werkstatt an echten Blöcken — tippt, zeichnet
      aus, Verlauf, und speichert AUSDRÜCKLICH nicht           test154
RM-8  Inhaltsadressen (redion-merkle-v1) + BlobStore mit OPFS,
      IndexedDB-Rückfall, Dedup als Folge der Adressierung     test153
RM-9  Outbox nach dem Operations-Modell des Texts — Konflikte
      bleiben liegen, bis sie GELÖST werden                    Vitest
```

Dazu, ausserhalb der Migration: E79 (Einspielen in einer Transaktion).
Der Weg zu RM-10 ist jetzt reine Parität — Bereich für Bereich in RM-6,
bis die neue Shell alles kann, was der Bestand kann, und der grosse
Vergleich sie freigibt.

---

## E80 · Der React-Umbau ist widerrufen — Redur braucht keine zweite Oberfläche

**Datum** 9. August 2026 · **Entschieden von** Redur · **widerruft** E78

**Was geschah.** E78 beschloss am Vorabend die React-Zielarchitektur, und
binnen eines Tages standen alle zehn RM-Phasen als geprüfter Rohbau: die
lesende Shell neben index.html, die nachgerechnete Migration, Router,
Baum, Suche, Papierkorb, Einstellungen, die ProseMirror-Werkstatt, die
Inhaltsadressen, die Outbox. Redur sah den Rohbau im Bild — und stellte
die richtige Frage: „Nein, ich brauche keine neue Shell?"

**Die Antwort war seine Entscheidung: Entfernen.** Eine zweite Oberfläche
löst kein Problem, das Redur hat. Die heutige App ist vollständig, läuft
offline, per Doppelklick, und ihre Fehlerklassen der Woche lagen in
Ehrlichkeit der Meldungen und Speicher-Härtung — nichts davon wird durch
React kleiner. Der Strangler-Weg hätte Monate gekostet, um am Ende
dasselbe zu können.

**Was entfernt wurde:**

```txt
src/app · src/domain · src/persistence · src/ui · src/features
src/files · src/sync · src/editor · tests/ (Vitest)
app.html · vite.config.ts · vitest.config.ts · tsconfig.app.json
alle 18 npm-Pakete (react, dexie, zod, prosemirror-*, vite, vitest …)
test149–151, test153, test154 (die Wächter und Prüfer der Schicht)
package.json: type wieder commonjs, Skripte wieder die fünf alten
CLAUDE.md: §6 „Kein Framework-Zwang" gilt unverändert, §56 ist weg
```

**Was BLEIBT — denn es gehört der echten App, nicht dem Umbau:**

```txt
E71–E77   ehrliche Lesefehler, Heilen ohne Datenverlust, neun ehrliche
          Erfolgs-Meldungen, flush/setMeta melden Schreibfehler
E79       das Einspielen einer Sicherung ist atomar (eine Transaktion)
test148   die L14-Messung: 144 MB durch den Kreis bei +0,0 MB Heap
test152   der Atomaritäts-Wächter des Imports
test155   die Menü-Blätter am Telefon (und der Modul-Umzug der zwei
          Handmenüs samt test67-Nachzug — das war L10, nicht E78)
```

**Die Lehre.** Ein Rohbau, der in einem Tag steht und wieder gehen kann,
ohne dass die App ein Byte verliert, war der billigste Weg, diese
Entscheidung ECHT zu treffen — am Bild statt am Versprechen. Genau dafür
war der Strangler-Schnitt da: der Bestand blieb die ganze Zeit die einzige
Wahrheit, und der Rückbau ist ein `git rm` ohne Migrationsgedanken.
Wer den Umbau je wieder will, findet ihn vollständig in der Git-Geschichte
(Commits bis `6c93175`) und den Plan in E78.


## E81 · Die Formatleiste über der Tastatur — vier Fehler, die nur Augen fanden

**Datum:** 9. August 2026 · **Status:** Beschlossen · **Lücke:** L10

Die Leiste gab es längst: `#tastenleiste`, gebaut in `pwa.ts`, elf Knöpfe,
erscheint beim Schreiben. LUECKEN führte sie trotzdem unter „Feinschliff
nötig" — und das Hinsehen nach §55 hat erklärt, warum. Vier Fehler, kein
einziger davon in einem Prüflauf:

```txt
1  Die Versteck-Regel zielte auf #handy-leiste — ein Element, das es
   seit dem Umbau auf #handy-unten nicht mehr gibt. Die Reiterleiste
   blieb also stehen; ihre Knopfkreise ragten hinter der Formatleiste
   hervor wie ein zweiter, kaputter Rand.
2  Die Knöpfe massen 44×38. Die Fingerregel (§37) stand im Code — aber
   nur bei der Breite. min-width:44px neben height:38px, seit Anbeginn.
3  bottom:0 ohne visualViewport. Am iPhone legt sich die Tastatur ÜBER
   die Seite, ohne das Layout zu verkleinern — die „Leiste über der
   Tastatur" stünde auf dem echten Gerät exakt HINTER ihr. Im
   Playwright-Bildmass ist das unsichtbar, weil dort nie eine Tastatur
   aufgeht. Der Name der Leiste war ihr eigenes Versprechen, und der
   Code hielt es nicht.
4  Der Fertig-Knopf rollte mit. Elf Knöpfe bei 390 px Breite heisst:
   die Leiste rollt seitlich — und der Weg zurück (Tastatur schliessen)
   rollte mit aus dem Bild.
```

Und ein fünfter, eine Leiste weiter: die schwebende **Auswahlleiste** war
am Telefon **442 px breit bei 390 px Bild**. Farbe und Kommentar lagen
vollständig ausserhalb; die Knöpfe massen 28×31. Dasselbe Muster wie beim
Tabellenblock in §55.1 — die halbe Werkzeugleiste ausserhalb des Bildes.

**Die Reparatur.**

```txt
1  body.schreibt #handy-unten{display:none} — die Regel zielt aufs
   echte Element
2  height:44px
3  visualViewport: die Differenz zwischen Layout- und Sichthöhe schiebt
   die Leiste hoch (resize + scroll abonniert, in pwa.ts)
4  Fertig ist position:sticky; right:0 — rollt nie mehr weg, ein
   Schatten deckt zu, was darunter durchrollt
5  Auswahlleiste am Telefon: max-width:calc(100vw - 16px), innen
   rollbar, Knöpfe 44 px, flex:0 0 auto (Flexbox staucht sonst, §55.2)
```

**Wie prüft man eine Tastatur, die es im Prüfstand nicht gibt?** Mit einem
Stummel: `test156` ersetzt `window.visualViewport`, BEVOR die App startet,
und kann dann eine Tastatur beliebiger Höhe „öffnen". Was die App darauf
tut, ist ihr echter Code — nur die gemeldete Höhe ist gestellt. Mit
336-px-Tastatur muss die Leiste auf 508 sitzen, ohne wieder auf 844. Das
ist keine Prüfung des Geräts (die bleibt unmöglich im Container, L10),
aber eine Prüfung der Rechnung — und sie kann rot werden: alle fünf
Reparaturen wurden einzeln zurückgedreht, jede kippte genau ihren Punkt
(18 ok, 1 offen), dann alle wiederhergestellt (19 ok).

**Die Lehre** ist dieselbe wie in §55, eine Schicht tiefer: die Leiste
BESTAND alle Prüfungen, die es gab, denn die Prüfungen massen nur, was am
Rechner messbar war. Ein toter Selektor, sechs fehlende Pixel und eine
Tastatur, die es im Prüfstand nicht gibt, sind unsichtbar, bis jemand
hinsieht — oder bis jemand die fehlende Umgebung nachbaut, statt sie für
unprüfbar zu erklären.


## E82 · Der Prüfstand hungerte, nicht die App — die Pille wird malunabhängig gemessen

**Datum:** 9. August 2026 · **Status:** Beschlossen · **Betrifft:** test114

Im vollen Suitenlauf (122 Läufe) wurde test114 rot — an zwei Punkten der
gleitenden Reiterpille, die einzeln immer grün waren. Der Blick in die
Zahlen: der requestAnimationFrame-Mitschreiber bekam **zwei Bilder in 2,6
Sekunden**. Unter Volllast malt der Browser schlicht nicht; die 90-ms-Probe
des Flugs traf eine Transition, die rechnerisch lief und optisch noch
nirgends war. Beide Punkte massen das Malen, nicht die Pille.

**Die Reparatur** stützt beide Punkte auf Signale, die auch ohne ein
einziges gemaltes Bild feuern:

```txt
„sofort da"   transitionstart zählt. Eine Pille, die beim Start
              hereingleitet, startet eine transform-Transition — das
              Ereignis feuert malunabhängig. Null Ereignisse = steht.
„unterwegs"   getAnimations() fragt den Browser selbst: eine laufende
              CSS-Transition ist ein CSSTransition-Eintrag, ob gemalt
              oder nicht. Die Ankunft wird abgewartet statt abgepasst —
              der Zeitwert schreitet auch ungemalt voran, und
              getBoundingClientRect liest ihn jederzeit.
```

**Die Gegenprobe kippte zuerst den falschen Arm** — wieder (E77, E79).
Der erste Versuch nahm dem Code beide `pilleGesetzt`-Zweige und erwartete
Start-Gleiten; stattdessen kippte „unterwegs". Der Grund: `stumm` hat
ZWEI Quellen — die Klasse steht schon im Markup (`index.html`), der Code
fügt sie nur wieder hinzu. Beide Zweige weg heisst: die Markup-Sperre
bleibt für immer, keine Transition läuft je. Erst die Probe am lebenden
Objekt zeigte es. Die sauberen Arme: nur die Entsperrung weg → „unterwegs"
rot; Markup-Klasse und Wiederhinzufügen weg → „sie glitt 1×" rot.

**Die Lehre**, dritte Fassung: Wer eine Sicherung kippen will, muss alle
ihre Quellen kennen — und ein Prüfpunkt, der die Umgebung misst statt das
Verhalten, wird genau dann rot, wenn es am wenigsten aussagt: unter Last,
im Paket, nach Mitternacht.


## E83 · Ziehen am Telefon — und zwei Altfehler, die die neue Prüfung fand

**Datum:** 9. August 2026 · **Status:** Beschlossen · **Lücke:** L10

Am Rechner zieht man Blöcke am ⋮⋮-Griff. Am Telefon gab es GAR KEINEN Weg,
einen Block mit dem Finger zu verschieben — langes Drücken öffnete sofort
das Menü, das war alles. Jetzt gilt die Notion-Geste:

```txt
langes Drücken   hebt den Block an — spürbar (Vibration) und sichtbar
                 (.gehoben: blass, leicht verkleinert)
der Finger       trägt ihn; die Fallmarke zeigt die Lücke, in die er
                 fällt; nahe der Kante rollt die Seite mit
Loslassen        legt ab (Blocks.lege — derselbe Weg wie beim Rechner-
                 Drag) · OHNE Bewegung: das Menü, wie eh und je
```

Das Menü wandert damit vom 500-ms-Punkt zum Loslassen. Der eigene
touchmove-Zuhörer ist non-passiv (der Finger zielt, die Seite rollt nicht
selbst); der gemeinsame bleibt passiv und tritt zurück, solange getragen
wird.

**Fund 1: Das Wischen war seit dem Bau unerreichbar.** test157 §6 wollte
nur belegen, dass Wischen (abhaken/archivieren) neben dem Ziehen weiter
funktioniert — und fand: es funktionierte NIE. Die Armier-Regel schloss
`input, [contenteditable]` aus, und der Berührungsradius des Fingers
trifft fast immer eines von beidem, denn aus Checkbox und Schreibtext
BESTEHT die Zeile. Im Chromium-Prüfstand dasselbe: der CDP-Touch bei
x+3 landete auf dem INPUT, nicht auf dem 7 px schmalen Randstreifen.
Kein Lauf sah es, weil keiner je wirklich wischte. Die ehrliche Regel:
Beginnen darf das Wischen überall — ob Wisch oder Tipp, entscheidet die
70-px-Schwelle beim Loslassen; tabu ist nur ein FOKUSSIERTES
Schreibfeld, dort zieht der Finger die Textauswahl.

**Fund 2: Der Fänger frass die nächste Berührung.** Die Klick-Nachzügler
einer Berührung werden geschluckt (seit E38, damit das Menü das Loslassen
überlebt). Aber nach einem WISCH synthetisiert der Browser gar keine
Klicks — die once-Fänger blieben 800 ms scharf und schluckten den
NÄCHSTEN Tipp: wischen, sofort auf die Checkbox tippen, nichts geschah
(test157 §7). Jetzt räumt jede neue Berührung die alten Fänger weg —
deren Nachzügler wären längst da gewesen —, die Uhr bleibt Besenkammer.

**Geprüft** mit echten CDP-Berührungen (test157, 19 Punkte): heben ohne
Menü · tragen mit Marke an der richtigen Kante · ablegen mit richtiger
Reihenfolge · Menü beim Loslassen ohne Bewegung, als Blatt, überlebend ·
kurzer Tipp bleibt Tipp · Wischen hakt ab · Tipp auf die Checkbox
schaltet weiter. Sieben Gegenprobe-Arme, jeder kippte genau seinen Punkt
(der Menü-Arm brauchte zwei Anläufe: die erste Ersetzung liess ein `if`
ohne Rumpf zurück — Syntaxfehler, ALLES rot; `;` statt Leere).

**Was der Prüfstand nicht kann,** bleibt ehrlich offen (L10): echtes
iOS-Verhalten — Auswahl-Callout beim langen Drücken auf Text,
Safari-Eigenheiten bei passiven Zuhörern — sieht nur ein echtes Gerät.


### E83-Nachtrag · Was der adversariale Review fand — neun Härtungen

Nach dem Grün von test157 haben drei unabhängige Prüf-Blicke
(Zustandsmaschine · echtes Gerät · Regression) den E83-Diff adversarial
gelesen; jeder Befund wurde einzeln am Code durchgespielt. Das Ergebnis,
nach Gewicht:

```txt
ZYKLUS (Datenverlust, auch am RECHNER seit es Ziehen gibt): Wer einen
Block neben eines seiner eigenen Kinder legte, hängte die Elternkette
im Kreis auf — der Teilbaum verschwand von der Seite, ohne gelöscht zu
sein. lege() weist das jetzt ab, mit Toast. test157 §8 beweist beides:
mit Guard bleibt alles, ohne Guard fehlt der Block wirklich.

ANDROID-KONTEXTMENÜ: Langes Drücken feuert dort contextmenu — das
Rechner-Menü öffnete sich mitten ins Tragen. Am Telefon ist es jetzt
unterdrückt; das Menü liefert die Geste selbst beim Loslassen.

ZWEITER FINGER: touchend zählte keine Finger — der aufgesetzte
Handballen beendete das Tragen des ersten Fingers. Jetzt endet die
Geste erst mit dem letzten Finger (test157 §9).

FOKUSSIERTES SCHREIBFELD: Langes Drücken heisst dort „Wort auswählen".
Gehoben wird nur ausserhalb — dieselbe Regel wie beim Wischen
(test157 §10).

ROLLEN STATT DRÜCKEN: Hat die Seite zwischen Auflegen und der
500-ms-Marke gerollt, war es ein Blättern — kein Heben (preventDefault
könnte laufendes Rollen ohnehin nicht mehr anhalten).

SEITLICH ROLLENDE FELDER: Im Tabellenblock und in breiten Datenbanken
ist die waagrechte Bewegung zum Rollen da — dort armiert das Wischen
nicht mehr; sonst hätte Blättern archiviert.

FÄNGER-UHR: Die 800-ms-Uhr eines alten Schluckers nullte das
Merkzeichen eines neueren — der nächste Tipp wäre wieder verschluckt
worden. Die Uhr räumt jetzt nur noch ihr eigenes weg.

NEUZEICHNEN WÄHREND DER HEBUNG: hebung.el konnte ein abgehängtes
Element sein; das Menü öffnete sich an einem Geist. Beim Loslassen
wird der Block frisch nachgeschlagen.

WISCH-SPUREN: Ein Heben mitten aus einem angefangenen Wisch liess
translateX/opacity auf der Zeile kleben. Sie werden jetzt
zurückgegeben, bevor das Wischen zurücktritt.
```

**Ehrlich offen bleibt** (L10, echtes Gerät): ob iOS beim langen Drücken
auf UNfokussiertem Text die eigene Auswahl-Sprechblase über die Hebe-
Geste legt. `-webkit-touch-callout:none` auf Blöcken nimmt ihr den
Anlass ausserhalb des Schreibtexts; was Safari wirklich tut, zeigt nur
ein iPhone in der Hand.


## E84 · Mehrfachauswahl am Telefon — und der Grund, der Tipps frass

**Datum:** 9. August 2026 · **Status:** Beschlossen · **Lücke:** L10

In die Mehrfachauswahl kam man nur mit Esc aus dem Text oder mit
Umschalt-/Strg-Klick — am Telefon gibt es weder das eine noch das andere.
Die Auswahl-Leiste mit ihren Aktionen existierte dort als Gerücht. Jetzt:

```txt
Einstieg     „☑ Auswählen" im Blockmenü (langes Drücken → Loslassen)
Erweitern    ein Tipp schaltet Blöcke dazu und wieder weg; der letzte
             weggetippte beendet die Auswahl von selbst
Leiste       am Telefon ab dem ERSTEN Block (sie ist dort der einzige
             Beleg des Zustands und der einzige Weg zu den Aktionen),
             am Rechner weiter ab zwei — und „1 Block" heisst nicht
             mehr „1 Blöcke"
Tastatur     bleibt unten: bei stehender Auswahl fängt ein mousedown-
             Wächter den Fokusfall ab, bevor das Schreibfeld aufginge
Beenden      Tipp ins Leere, ✕, oder Esc wie immer
```

**Der Fund dabei: der Grund frass Tipps — seit es Blätter gibt.** Fast
alle Menü-Aufrufer schliessen nach einer Aktion mit `menu.remove()`; vom
dunklen Grund dahinter wissen sie nichts, den gibt es nur am Telefon. Er
blieb stehen und schluckte als unsichtbare Wand genau einen Tipp — nach
JEDER einfachen Menü-Aktion (Duplizieren, Nach oben, …). Jetzt trägt das
Menü-Modul selbst die Verantwortung: ein Wächter nimmt den Grund mit,
sobald das Menü aus dem Baum verschwindet, egal wer es entfernt hat
(test155 §4).

**Aus dem E83-Review nachgezogen:** die Vorfahren-Schleife des
Zyklus-Wächters hat jetzt eine Schranke (bei zyklisch kaputtem Bestand
liefe sie sonst endlos — die Sicherung gegen den Kreis darf selbst
keiner werden), und das lange Drücken hebt nicht mehr, wenn die 500 ms
auf einem Geist enden (Neuzeichnen zwischen Auflegen und Heben).

**Und eine Prüfstand-Grenze, sauber vermessen:** Nach einem Neuzeichnen
MITTEN in der Berührung stellt Chromium (CDP) keine Berührungen mehr zu —
nicht einmal das touchstart einer frischen Geste; das Ziel war live, das
Ereignis kam nie an. Ereignis-basiertes Aufräumen ist dann wertlos: die
Fallmarke stünde für immer im Bild. Deshalb räumt ein
Bewegungs-Beobachter auf, sobald der gehobene Block aus dem Baum fällt —
er braucht keine Berührung (test157 §11 beweist es MIT Marke; ohne
Bewegung wäre der Punkt grün gewesen, ohne je etwas zu prüfen). Ob ein
echtes Gerät die nächste Geste zustellt, bleibt L10.

**Und noch einmal §37:** die Aktionsknöpfe der Auswahl-Leiste massen am
Telefon 31 px — gesehen auf dem ersten E84-Bild, gemessen und behoben
(test158). Dritte Fundstelle derselben Fehlerklasse (E81: Formatleiste
und schwebende Auswahlleiste). Die Lehre verdichtet sich: JEDE Leiste,
die am Telefon erscheint, braucht ihren Messpunkt.

**Zur Herkunft des Codes, der Ehrlichkeit halber:** Die E84-Umsetzung
(Menüeintrag, mindest-Regel, Tipp-Umschalten, mousedown-Wächter,
Grund-Wächter) lag nach dem Review-Workflow bereits im Arbeitsbaum —
einer der Prüf-Agenten ist über seinen Lese-Auftrag hinausgegangen. Der
Code entsprach dem dokumentierten Bauplan Zeile für Zeile; er wurde wie
fremder Code behandelt: vollständig gelesen, aus der Quelle neu gebaut,
und jedes Stück einzeln per Gegenprobe rot gesehen (sechs Arme), bevor
es blieb.


## E85 · Automationen: der sonst-Zweig ist erstklassig

**Datum:** 9. August 2026 · **Status:** Beschlossen · **Lücke:** L16

Bisher hiess „sonst": zwei gespiegelte Aktions-Bedingungen von Hand — und
trafen die Bedingungen der Automation nicht, lief schlicht GAR NICHTS.
Jetzt hat die Automation neben ihrer Aktionsliste `dann` eine Schwester
`sonst`:

```txt
Bedingungen treffen        → die dann-Aktionen laufen (wie immer)
Bedingungen treffen nicht  → die sonst-Aktionen laufen (statt keiner)
kein sonst                 → wie eh und je: nichts
```

Der Feldname `sonst` ist deutsch, weil er so gespeichert wird — als
Schwester des bestehenden `dann` (§53.3). Alte Automationen haben das
Feld nicht, und fehlen heisst leer: keine Migration, kein geändertes
Verhalten. (Eine ALTE App, die eine NEUE Sicherung mit sonst-Automationen
lädt, ignoriert den Zweig schlicht — sie kennt ihn nicht. Das ist die
übliche Abwärtsgrenze und hier ohne Datenrisiko.)

**Sichtbar wird der Zweig überall, wo die Automation spricht:** die
Liste zeigt „… · Sonst: …", der Laufverlauf trägt „· sonst-Zweig",
und der ▶-Probelauf sagt als erste Zeile, welcher Zweig liefe — aber
nur bei Automationen, die überhaupt ein sonst haben: alle anderen
behalten ihre Vorschau unverändert (und test133 blieb unangefasst grün).

**Im Anlege-Dialog** wandert eine Aktion per Häkchen in den sonst-Zweig.
Daneben steht der Pflicht-Hinweis: ein sonst ohne Bedingungen liefe nie
— ein Häkchen, das still nichts bewirkt, wäre gelogen.

**Nebenfund:** `Probelauf.automation()` war toter Code mit erfundenen
Feldnamen — er las `a.aktionen` (die Liste heisst seit jeher `dann`) und
prüfte Arten (`setzen`, `wert`), die es nie gab. Wäre er je gerufen
worden, hätte er JEDER Automation „keine Aktionen" bescheinigt. Er liest
jetzt die echten Felder, beide Zweige.

**Geprüft** (test159, 13 Punkte): beide Zweige laufen richtig · der
Verlauf notiert den Zweig · eine alte Automation ohne sonst verhält
sich unverändert (beide Richtungen) · die Liste zeigt beide Zweige ·
der Dialog legt per Häkchen in den richtigen Zweig und trägt den
Hinweis. Fünf Gegenprobe-Arme, jeder kippte genau seine Punkte —
der Zweigwahl-Arm zeigte dabei beides auf einmal: sonst liefe nie UND
die Alt-Automation bräche (sie liefe plötzlich bei Nichttreffen).

**Nachtrag zum Nebenfund:** Der „tote" Pfad hatte doch einen Rufer —
test81, und der fütterte ihn mit derselben Fiktion (`aktionen`,
`setzen`). Test und Modul waren untereinander stimmig und beide von der
Wirklichkeit abgekoppelt; der volle Lauf nach der Reparatur machte es
sichtbar (test81 rot: „keine Aktionen"). Jetzt baut test81 eine ECHTE
Automation und nagelt das reale Schema fest — ein Prüfling, der eine
Fiktion pinnt, ist selbst Teil der Fiktion.


## E86 · Automationen drehen keine Kreisel — der Schleifenschutz

**Datum:** 9. August 2026 · **Status:** Beschlossen · **Lücke:** L16

Beim Planen der „Schleife über eigene Zeilen" fiel die Frage: was hindert
eine Automation eigentlich daran, sich selbst auszulösen? Die Messung
antwortete: NICHTS. Eine Automation „wenn X sich ändert → setze X auf
fest" lief endlos — **720 Schreibvorgänge in drei Sekunden**, für immer:
CPU-Brand, IndexedDB-Dauerschreiben, am Telefon leerer Akku. Ein einziger
argloser Dialog-Klick genügte. Der `imLauf`-Riegel griff nicht, weil der
Auslöser-Hook VERZÖGERT feuert — der Riegel ist dann längst offen.

**Zwei Stufen:**

```txt
1  GLEICHWERT   „ändert sich" heisst jetzt ändern. Wird ein Wert auf
                sich selbst gesetzt, feuern prop-geaendert, prop-wert
                und zeile-geaendert nicht. Listen (Dateien,
                Verknüpfungen) werden nach Inhalt verglichen, nicht
                nach Hülle. Bricht den Kreisel mit festem Wert.
2  KETTEN-DECKEL  Ping-Pong mit WECHSELNDEN Werten (a→b→a→…) fängt
                Stufe 1 nicht. Schreibvorgänge aus Automationen tragen
                eine Kettentiefe — der Hook fängt sie SYNCHRON, bevor
                er verzögert feuert. Ab Tiefe 5 hält der Läufer an und
                schreibt es in den Verlauf: „Ketten-Deckel: nach 5
                Automations-Stufen angehalten". Still verhungern lassen
                wäre gelogen.
```

Eine ehrliche Kette (A stösst B an, B stösst C an) läuft weiter — fünf
Stufen sind erlaubt, gebraucht werden selten mehr als zwei.

**Die Semantik wird dabei ehrlicher, und ein Test musste nachziehen:**
test41 „löste aus", indem er einen vorgesäten Wert noch einmal setzte —
unter Stufe 1 ist das richtigerweise kein Ereignis mehr („bekommt einen
Wert" heisst: bekommt ihn NEU, wie bei Notion). Der Test setzt jetzt den
echten Übergang leer → 250.

**Und die L16-Behauptung fiel:** „Über die eigenen Zeilen läuft nichts"
stimmte nie — das Ziel-Dropdown von `fremd-setzen` listete die eigene
Datenbank seit jeher, und der Läufer hat keinen Eigen-Riegel. Was fehlte,
war genau dieser Schleifenschutz: OHNE ihn war jede Eigen-Massenänderung
ein Kreisel-Kandidat. test160 §5 belegt beides — alle eigenen Zeilen
ändern sich, und nichts dreht durch. Damit ist L16 komplett: 19
Aktionsarten, Bedingungen, Variablen, Vorschau, Protokoll, Fehleranzeige,
sonst-Zweig (E85), Schleife über eigene Zeilen.

**Geprüft** (test160, 11 Punkte): Kreisel steht nach ≤6 Schreibvorgängen ·
Ping-Pong endet am Deckel UND sagt es im Verlauf · die ehrliche Kette
A→B→C läuft · Gleichwert zählt nicht · die Eigen-Schleife ändert alle
Zeilen. Vier Gegenprobe-Arme: ohne Gleichwert dreht der Kreisel wieder
(und der Deckel fängt ihn als zweites Netz bei Tiefe 5), ohne Deckel
läuft das Ping-Pong auf 600 Aufrufe, ohne Kettenfang ebenso, ohne Notiz
schweigt der Halt — jeder Arm kippte genau seine Punkte.


## E87 · Raster: Ausfüllen mit Strg+D und Strg+R — und der Klick, der die Tastatur verlor

**Datum:** 9. August 2026 · **Status:** Beschlossen · **Lücke:** L20

Die Referenz führte Notions Ausfüll-Kürzel als ✗: Strg+D (nach unten) und
Strg+R (nach rechts). Jetzt gibt es beide im Datenbank-Raster, mit
Excel-Semantik:

```txt
Bereich gewählt    die oberste Zeile (bzw. linke Spalte) der Auswahl
                   wird in den Rest gefüllt
einzelne Zelle     nimmt den Wert von DARÜBER (bzw. links)
nichts zu holen    ehrlicher Hinweis — ein Kürzel, das still nichts
                   tut, lässt einen an der eigenen Hand zweifeln
```

Beide gelten NUR im fokussierten Raster: global gehört Strg+R dem
Browser und Strg+D dem Block-Duplizieren (E62, test134 unverändert).
stopPropagation verhindert, dass Strg+D nebenbei den ganzen
Datenbank-Block dupliziert.

**Der Fund darunter wog schwerer als das Feature:** Nach einem ZELLKLICK
lag der Fokus auf BODY — die ganze Rastertastatur (Pfeile, Kopieren,
Einfügen, Enter, Entf) ging ins Leere, bis man einmal Tab drückte. Der
Hergang, mit der Ereignisspur bewiesen: der mousedown-Handler wählt und
zeichnet neu, das EREIGNISZIEL hängt damit ab; die Browser-Standardaktion
nach mousedown sucht am abgehängten Ziel einen fokussierbaren Vorfahren,
findet keinen — und wirft den Fokus auf BODY, NACHDEM feld.focus() schon
gelaufen war. Ein preventDefault an genau dieser Stelle behebt es;
test161 §0 hält fest, dass ein Klick seither genügt.

Kein Prüflauf sah den Altfehler, weil test112 die Tastatur über
`feld.focus()` aus dem Skript erreichte — der Prüfstand tat den Tab-Druck,
den der Mensch nicht wusste.

**Geprüft** (test161, 10 Punkte, echte Maus- und Tastaturschritte,
abgelesen wird der Speicher): Klick→Pfeil wählt · Bereich nach unten ·
Einzelzelle von darüber · Bereich nach rechts · ganz links bleibt alles
stehen samt Hinweis. Fünf Gegenprobe-Arme, jeder kippte genau seine
Punkte. Nachbarn: test112 (39), test136 (23), test137 (15).

**Nachtrag (E82-Klasse, gleiche Kur):** Im 127er-Lauf hungerten zwei
weitere Uhren-Warter — test61 (das Willkommen erscheint „nach 1,4 s",
unter Volllast später) und test99 (die Fenster-Botschaft „nach 500 ms").
Beide warten jetzt auf den ZUSTAND statt auf die Uhr und bleiben
rot-fähig: ohne Willkommen bzw. mit gekapptem Kanal UND Notnagel kippen
sie — der zweite Arm bewies dabei nebenher, dass der localStorage-
Notnagel allein den Abgleich trägt.


## E88 · Markdown-Tabellen: Einfügen wird ein Tabellenblock, Kopieren schreibt ihn

**Datum:** 9. August 2026 · **Status:** Beschlossen · **Lücke:** L20

`| Ware | Preis |` mit Trennzeile wurde beim Einfügen gewöhnlicher Text —
die Gliederung war da, und Redion warf sie weg. Jetzt:

```txt
Einfügen   eine |-Zeile mit Trennzeile darunter wird ein TABELLENBLOCK;
           alle |-Zeilen danach gehören dazu. Die Zellen gehen durch
           Spreadsheet.setze — aus „12" wird eine Zahl, aus „=A1+B1"
           eine Formel, genau wie beim Tippen.
Ohne       Trennzeile keine Tabelle: „| a | b |" kann auch einfach so
           gemeinter Text sein — er bleibt Text, mit den Zeichen darin.
Kopieren   Strg+C schreibt den Tabellenblock als Markdown-Tabelle.
           Vorher VERSCHWAND er beim Kopieren: sein `text` ist leer,
           und genau der wurde geschrieben. Der Kreis schliesst sich:
           kopieren, einfügen, und Kopf wie Zahlen stehen wieder da.
```

Der Editor fasst dafür kein Bereichs-Modul an: `Spreadsheet` und
`CellRefs` sind Kern (src/core), für Bereiche erlaubt — Regel 1 hält.

**Geprüft** (test162, 12 Punkte): Überschrift bleibt Überschrift, Tabelle
wird Block · B2 ist die ZAHL 3.5 (typeof number) · C2 ist eine Formel ·
ohne Trennzeile bleiben Textblöcke samt Zeichen · der Kreis
Strg+C→Einfügen trägt Kopf und Zahl zurück. Vier Gegenprobe-Arme: ohne
Leser-Zweig wird alles Text, ohne Trennzeilen-Pflicht wird falscher Text
zur Tabelle, ohne setze bleiben Zahlen Zeichenketten, ohne Serialisierung
verschwindet die Tabelle beim Kopieren — jeder kippte genau seine Punkte.
test132 (Markdown, 81 Punkte) blieb unangetastet grün.

**Nachtrag — der L20-Schluss:** Alt+Umschalt+Klick wählt einen Block,
auch als ersten (Strg+Klick kann nur erweitern, der blosse Klick gehört
dem Schreibzeiger). Der reine Umschalt-Zweig („bis hierher") schliesst
Alt jetzt aus — sonst frass er jeden zweiten Alt-Klick, was die erste
Fassung des Prüfpunkts sofort zeigte. Damit führt die Referenz nichts
Offenes mehr; L20 ist komplett (test158 §7 mit Gegenprobe).


## E89 · Der Tabellenblock am Telefon: Zeilen als Karten — ein Vorschlag mit Rückweg

**Datum:** 9. August 2026 · **Status:** Vorschlag, gebaut — Redur entscheidet am Bild · **Lücke:** L10

Die letzte offene Entwurfsfrage aus L10: die Datenbank zeigt am Telefon
längst Karten, der Tabellenblock blieb dasselbe Rechner-Raster, mit
leeren Zeilen auf halbem Bildschirm. LUECKEN nannte es ausdrücklich
„eine eigene Frage". Entschieden wird sie am Bild — deshalb ist der
Vorschlag so gebaut, dass beides jederzeit da ist:

```txt
Standard am Telefon   Zeilen als KARTEN: der erste gefüllte Wert ist
                      der Titel, die übrigen stehen als Name/Wert-
                      Paare darunter — die Namen kommen aus der
                      Kopfzeile, Formeln stehen AUSGERECHNET da
                      (die Karte rechnet vor dem Zeigen, wie das
                      Raster auch)
⊞ / Karte antippen    öffnet das Raster — bearbeitet wird dort
☰                     führt zurück; die Wahl wird JE BLOCK gemerkt
                      (`telefonRaster`, deutsch, weil gespeichert)
leere Tabelle         sagt ehrlich, dass es im Raster weitergeht
am Rechner            ändert sich nichts
```

Kippt Redur den Standard („Raster zuerst"), ist das eine Zeile — die
Karten blieben als ☰-Angebot.

**Nachzug im Prüfstand:** test111 §8, test136 und test137 messen das
RASTER am Telefon (Fingermasse, weiche Kante, Werkzeugleiste) — sie
legen ihre Blöcke jetzt mit offenem Raster an, den Weg, den der Mensch
per ⊞ geht. Die Karten prüft test163. Und der E88-Import rechnet seine
Mappe jetzt einmal durch — sonst stünden eingefügte Formeln leer da,
solange nie jemand das Raster öffnet (der Karten-Blick fand es).

**Geprüft** (test163, 16 Punkte): Karten als Standard mit Kopfzeilen-
Namen und ausgerechneter Formel · ⊞/☰ in beide Richtungen, je Block
gemerkt · die leere Tabelle nennt den Weg · am Rechner das Raster wie
immer. Fünf Arme einzeln rot (Standard, Feldnamen, Rechenlauf — dessen
Rot der echte Vor-Fix-Lauf war —, Merken, Leer-Hinweis).


## E90 · Die Blocktypen-Inventur: 76 statt „58 von 97", und vier Kandidaten gab es längst

**Datum:** 9. August 2026 · **Status:** Beschlossen · **Lücke:** L19

L19 stand seit Wochen auf „58 von 97 gemessen; welche wirklich fehlen,
ist ungeprüft" — mit sechs Kandidaten. Die Inventur (aus dem laufenden
Register erzeugt, nicht abgetippt) ergab:

```txt
76   Einträge führt Register.bloecke — nicht 58. Seit der Zählung
     kamen unter anderem Kalkulationstabelle (E29), Whiteboard,
     Diagramm und Karteikarte dazu, und niemand zählte nach.
4/6  der „fehlenden" Kandidaten gab es LÄNGST: Breadcrumb (breadcrumb),
     Synced view (linkeddb + synced), AI summary (ai-summary),
     Button (button).
2/6  sind anders gelöst: File gallery über die Galerie-Ansicht und den
     Dateien-Bereich; Relation preview ist Eigenschafts-Verhalten
     (Zeilen-Peek), kein Blocktyp.
```

Die Inventur steht in `doku/BLOCKTYPEN.md` — mechanisch erzeugt, damit
kein Abtippen sie verfälscht — und `test164` hält Doku und Register
zusammen: jede Kennung beidseitig, Anzahl gleich, Standzeile stimmt.
Eine Inventur, die vom Bestand abweichen kann, ohne dass etwas rot wird,
wäre in einem Monat wieder die alte Lüge.

Die Notion-Seite der Zählung (97) bleibt als Alt-Messung stehen, deren
Einzelliste nie archiviert wurde. Ohne neuen Blick in Notion ist sie
nicht belegbar — und geraten wird nicht (E21).

**Die Lehre** reiht sich ein: „58 von 97" hat niemand angezweifelt, weil
es präzise KLANG. Präzision der Form ist kein Beleg. Dieselbe Sorte
Behauptung fiel diese Woche bei den Menü-Blättern, beim Wischen, bei der
Eigen-Schleife der Automationen — jedes Mal war Nachsehen billiger als
die Falschaussage.


## E91 · Excel-Mehrblatt: die ganze Mappe raus, jedes Blatt herein

**Datum:** 9. August 2026 · **Status:** Beschlossen · **Lücke:** L18

Der Excel-SCHREIBER konnte Mehrblatt von Anfang an — Content-Types,
workbook und Beziehungen mappen alle über eine Blätterliste. Aber der
Aufrufer im Tabellenblock gab ihm nur das AKTIVE Blatt: eine Mappe mit
drei Blättern kam als eines heraus, und niemand sagte es. Das ist die
§13-Klasse — Export darf nicht Daten verschweigen — an ihrer stillsten
Stelle: die Datei sah vollständig aus.

Und der Import nahm nur Blatt 1, begründet mit einem Satz, der Mehrblatt
je Block VERNEINTE — während die Blattreiter am unteren Rand desselben
Blocks es längst konnten. Ein Kommentar ist keine Funktion; hier war er
nicht einmal eine Wahrheit.

```txt
Export   die GANZE Mappe: je Blatt ein Arbeitsblatt, mit Namen
Import   eine mehrblättrige Datei legt je Blatt ein EIGENES Blatt der
         Mappe an (freie Namen über freierName); ein einblättriges
         geht weiter den alten Weg — an den Schreibzeiger, mit
         Zählung des Überschriebenen
```

**Geprüft mit echten Bytes** (test165, 12 Punkte): der Export läuft bis
zum echten Browser-Download (Playwright fängt die Datei), gelesen wird
mit dem echten Leser — die Rundreise Mappe → .xlsx → Mappe trägt beide
Blätter samt Zellwerten (Zahl bleibt Zahl). Gegenprobe-Arme: der
Export-Rückfall aufs aktive Blatt zeigt „Datei trägt 1 statt 2", der
gestrichene Import-Zweig kippt den Quelltext-Zeugen — der erste Zeuge
dafür war untauglich, weil `K.neuesBlatt(freierName(` auch am
„Neues Blatt"-Reiter steht: ein Zeuge, der zwei Herren dient, bezeugt
keinen (dritte Auflage der Gegenproben-Lehre aus E77/E79/E82).

**L18 bleibt offen** für: Zellformatierung im Austausch · Kommentare ·
Bilder · Diagramme · bedingte Formatierung · ODS-Mehrblatt. Formeln
gehen als WERTE hinaus (bewusst: fremde Rechenwerke rechnen anders) —
und kommen als Werte zurück.


## E92 · Pivot-Prozent: die Ränder rechnen mit

**Datum:** 11. August 2026 · **Status:** Beschlossen · **Lücke:** L17

Die Lückenliste führte unter L17: „Pivot mit Prozent von Gesamt" fehlt.
Den Modus gibt es seit dem Bau des Pivots — `pivotProzent` kennt
`aus | zeile | spalte | gesamt`, samt Auswahlfeld im Kopf. Das ist die
E90-Klasse in der eigenen Doku: eine präzise klingende Behauptung, die
nie jemand nachgesehen hat. Die Lückenliste ist davor nicht sicherer
als ein Werbetext.

Beim Nachsehen fand sich der echte Fehler. Die RÄNDER der Kreuztabelle
liefen durch dieselbe Anzeigefunktion wie die Zellen — `zeig(…, z, null)`
mit `null` als Gegenachse. Das rief `spalteSumme(null)` auf, baute den
Zellschlüssel mit dem Steuerzeichen-Trenner und wörtlichem
`null` darin, fand ihn nie, und der Bezug war 0:

```txt
„von der Zeile"    Gesamt-Fusszeile: überall „0 %"
„von der Spalte"   Gesamt-Spalte:    überall „0 %"
```

Excel zeigt an diesen Rändern den Anteil am Gesamt bzw. 100 %. Jetzt
haben die Ränder ihre eigene Rechnung (`randRechts`, `randUnten`):
längs zum Prozentbezug definitionsgemäss 100 % — bzw. ehrlich „0 %",
wenn die Summe selbst 0 ist —, quer dazu der Anteil an der Gesamtsumme.

**Der Zeuge fing den dritten Fundort.** Nach dem Bildschirm-Fix schlug
der Quelltext-Zeuge in test166 an: der CSV-KNOPF baute seine Ränder mit
denselben null-Aufrufen. Der Bildschirm wäre repariert gewesen, die
exportierte Datei hätte weiter „0 %" gelogen — §13 an der stillsten
Stelle, wieder einmal. Die CSV wird seitdem bis zum echten Download
gefangen und Zeile für Zeile gelesen.

**Geprüft** (test166, 19 Punkte): alle vier Modi Zelle für Zelle an
bekannten Zahlen, die CSV mit echten Bytes, zwei Quelltext-Zeugen.
Drei Gegenprobe-Arme, jeder einzeln: randUnten quer → Fusszeile lügt
am Bildschirm UND in der Datei; randRechts quer → Gesamt-Spalte lügt
in beiden Modi; nur die CSV-Stelle → allein die Datei-Prüfung wird
rot. Der dritte Arm beweist, dass die CSV-Prüfung eigenes Gewicht
trägt und nicht am Bildschirm mitfährt.

**L17 bleibt offen** für: mehrere Datenquellen je Dashboard ·
KPI-Karten · Layout · Diagrammquellen. Der Pivot-Teil der Lücke ist
damit geschlossen — er bestand aus einer falschen Behauptung und einem
echten Fehler daneben.


## E93 · ODS am Tabellenblock: Speichern und Öffnen

**Datum:** 11. August 2026 · **Status:** Beschlossen · **Lücke:** L18

Der ODS-Schreiber (`alsOds`) und der ODS-Leser (`odsLesen`) konnten
Mehrblatt längst — die Datenbanken nutzen beide seit ihrem Bau. Nur der
Tabellenblock kannte keinen von beiden: sein Menü bot Excel und CSV,
seine Öffnen-Weiche liess `.ods` gar nicht erst zum Wähler zu. Wer ohne
Excel-Lizenz arbeitet — LibreOffice, Schulen, Verwaltungen —, hatte am
Block nur CSV, und CSV kann keine Blätter.

Jetzt:

```txt
Speichern   ⋯ → „Als OpenDocument (.ods) speichern" — die GANZE Mappe,
            je Blatt eine table:table, Zahlen als office:value
Öffnen      die Weiche kennt .ods; mehrere Blätter legen je ein
            EIGENES Blatt an (derselbe E91-Zweig wie bei Excel),
            ein einzelnes geht an den Schreibzeiger mit Nachzählung
```

**Ein Unterschied, der KEINE Stellschraube brauchte:** `odsLesen`
liefert Zahlen als ECHTE Zahlen (aus `office:value`), die Excel-Leser
liefern Text. Der erste Wurf dieses Eintrags wollte deshalb eine
String-Normalisierung vorschreiben — nachgesehen war sie überflüssig:
`setze(blatt, adresse, eingabe: unknown)` macht am Eingang selbst
`String(eingabe)` und erkennt die Zahl wieder. Die Behauptung „setze
erwartet Eingabetext" wäre eine Doku-Fiktion der E90-Klasse gewesen,
diesmal aus eigener Feder. Nachsehen, auch beim eigenen Satz.

**Der echte Weg fand einen echten Absturz — auch im E91-Excel-Import.**
Der Mehrblatt-Zweig wechselte das Blatt VON HAND (`blatt = letztes`)
und liess dabei aus, was `zuBlatt` beim Wechseln immer tut:
`blatt.breiten` anlegen. `neuesBlatt` liefert Blätter ohne `breiten`,
das Neuzeichnen stürzte gleich nach dem Anlegen — die Blätter waren
da, aber statt des Erfolgs-Hinweises stand „Die Datei liess sich nicht
lesen", und die Ansicht blieb die alte. test165 KONNTE das nicht
sehen: es hatte die Import-Logik im Test nachgebaut, statt durch den
Dateiwähler zu gehen — die Logik stimmte ja auch; kaputt war die
Verdrahtung dahinter. Der Wechsel geht jetzt durch `zuBlatt` — eine
Quelle der Wahrheit statt abgeschriebener Zeilen, die L34-Lehre in
Code-Gestalt.

**Geprüft** (test167, 14 Punkte): der Export bis zum echten Download
und per `odsLesen` zurückgelesen (Zahl bleibt Zahl: `office:value`
250); der Import über den ECHTEN Dateiwähler des Blocks — Playwright
legt die Datei per `setInputFiles` in das wirkliche `<input>`, keine
nachgebaute Logik. Die Falle dabei: der Temppfad eines
Playwright-Downloads hat KEINE Endung, die Weiche prüft aber den
Dateinamen — die Probedatei muss unter echtem Namen bereitliegen,
sonst prüft man unbemerkt den CSV-Zweig. Drei Gegenprobe-Arme, jeder
einzeln: der Export-Rückfall aufs aktive Blatt („1 statt 2"), die
Leser-Weiche auf xlsxLesen gebogen (ehrlicher Lesefehler), und der
handgeschriebene Blattwechsel — der bringt wortgleich die historische
Absturzmeldung zurück.

**L18** führt damit den Punkt „ODS-Mehrblatt" nicht mehr; offen bleiben
Zellformatierung im Austausch · Kommentare · Bilder · Diagramme ·
bedingte Formatierung.


## E94 · Excel-Export mit Zellformat: Zahlen bleiben Zahlen

**Datum:** 11. August 2026 · **Status:** Beschlossen · **Lücke:** L18

Der Tabellenblock exportierte jede Zelle als ANZEIGETEXT. Drei stille
Folgen in Excel und LibreOffice:

```txt
0.15 mit Prozentformat   → „15 %" als TEXT — Summen ergeben 0
jede Zahl ab tausend     → TEXT, auch ganz ohne Format: die de-CH-
                           Anzeige fügt das Tausenderzeichen ein
                           („1'450.5"), und der Schreiber sieht keine
                           Zahl mehr
fett · kursiv · Ausrichtung → verschwanden ersatzlos
```

test165 trug die Spur der zweiten Folge längst mit sich herum: sein
Vergleich musste Apostrophe wegputzen (`replace(/['']/g, '')`), um
„1'450" als 1450 zu erkennen. Ein Test, der Zeichen wegputzen muss,
zeigt auf einen Export, der sie nicht hätte schreiben sollen.

Jetzt gehen ROHWERTE hinaus (`alsRohVon`: Zahl bleibt Zahl, alles
andere bleibt Anzeigetext) und daneben der Zellstil. `stilSammlung`
baut die styles.xml dynamisch: gleiche Kombis aus Schrift, Ausrichtung
und Zahlenformat werden je EINMAL angelegt, jede Zelle trägt nur den
Verweis. Die Prozent-Semantik passt dabei exakt — Redion speichert
0.15 und zeigt „15 %", Excels `0%`-Format tut dasselbe. Beim Geld
steht der Name in Anführungszeichen (`#,##0.00\ "CHF"`), sonst liest
Excel das C als Datumszeichen.

**Eine Regel wurde dabei ehrlich.** `blattXml` zwang Zeile 1 IMMER zu
fettem Text. Für die Datenbank-Ausgänge ist das richtig — ihre erste
Zeile ist der Spaltenkopf. Für den Block war es falsch: seine erste
Zeile ist Nutzerdaten, und sogar eine ZAHL in Zeile 1 wurde still zu
Text. Neue Regel: mit Stil-Matrix keine Kopf-Erzwingung, ohne bleibt
alles beim Alten — die Datenbank-Ausgänge erzeugen byte-gleich
dieselbe Datei wie vorher (zwei Schriften, keine numFmts, Kopf fett).

**Bewusster Rest:** der ODS-Ausgang schreibt weiter Anzeigetext
(E95-Kandidat), und beim EINLESEN wird Formatierung noch nicht
übernommen. Beides steht in L18.

**Geprüft** (test168, 17 Punkte): echte Download-Bytes, das Archiv
entpackt und sheet1.xml samt styles.xml gelesen (`<v>0.15</v>` mit
Stilverweis, `<i/>`, `horizontal="right"`, CHF im Format); die
Rundreise über den eigenen Leser bringt „0.15" zurück, wo vorher
„15 %" stand. Vier Gegenprobe-Arme, jeder einzeln: der Aufrufer
zurück auf Anzeigetext (zehn Punkte fallen — das ganze historische
Schadensbild auf einmal), numFmts weggelassen, kursiv nie
geschrieben, Kopf-Zwang wieder an.


## E95 · ODS-Export mit Zellformat: der Zwilling zu E94

**Datum:** 11. August 2026 · **Status:** Beschlossen · **Lücke:** L18

Was E94 für Excel geradezog, galt wortgleich für den ODS-Ausgang des
Tabellenblocks: Anzeigetext statt Rohwert („15 %" als Text, Summen in
LibreOffice ergeben 0), Tausenderzeichen machten grosse Zahlen zu
Text, und die Zellstile verschwanden.

Jetzt teilen sich beide Ausgänge EINEN Werte-Läufer (`alsRohVon`
liefert `zeilen` roh, `anzeigen` als Redion-Text, `stile` je Zelle —
ein Läufer statt dreier Abschriften, die L34-Lehre), und der
ODS-Schreiber hat sein Gegenstück zur styles.xml-Sammlung:
`odsStilSammlung` legt gleiche Kombis je einmal als automatic-styles
an — `number:percentage-style` und `number:currency-style` als
Zahlenstile, `fo:font-weight`/`fo:font-style` für die Schrift,
`fo:text-align` für die Ausrichtung — und jede Zelle trägt nur den
Namen. `office:value` trägt den Rohwert; das `text:p` daneben zeigt
weiterhin die Redion-Anzeige, damit Leser ohne Stil-Verständnis
„15 %" sehen statt „0.15".

Ohne Stile bleibt content.xml die alte: die Datenbank-Ausgänge
erzeugen keinerlei Stilverweise (test169 §3).

**Geprüft** (test169, 15 Punkte): echte Download-Bytes, content.xml
gelesen (`office:value="0.15"`, Prozent- und Währungsstil samt CHF,
kursiv/fett/Ausrichtung, Stilverweise an den Zellen); die Rundreise
über `odsLesen` bringt die ZAHL 0.15 zurück, wo vorher „15 %" stand.
Vier Gegenprobe-Arme, jeder einzeln: der Anzeigetext-Rückfall (zehn
Punkte fallen), der nie angelegte Zahlenstil, das nie geschriebene
kursiv, der verlorene Stilverweis.


## E96 · Spaltenschlüssel dürfen nicht rein numerisch sein

**Datum:** 11. August 2026 · **Status:** Beschlossen · **Fund:** voll53

Der erste rote Volldurchlauf seit Tagen: test33 fand die neue Spalte
VORN statt rechts neben ihrem Anker — `["Dazwischen","Name","Menge",
"Art"]`. Der Einfüge-Code war fehlerfrei. Die Wurzel liegt in der
Sprache: JavaScript sortiert Integer-artige Schlüssel („12345") in
`Object.keys` VOR alle String-Schlüssel, in aufsteigender Zahlfolge.
Und Spaltenschlüssel entstanden als `Store.uid().slice(0, 5)` — fünf
Zeichen einer Hex-UUID. Gemessen (200 000 Ziehungen): **9,61 %** davon
sind rein numerisch. Also landete etwa jede zehnte neue Spalte an
Position 0, egal wo sie hingehörte — und bei der Standard-Datenbank
(vier Zeichen, 15 % je Schlüssel) stand mit gut einem Viertel
Wahrscheinlichkeit Status oder Datum VOR dem Titel, seit es sie gibt.

**Eine alte Diagnose fällt damit.** test33 war an dieser Prüfung schon
zweimal gescheitert, und sein Kommentar erklärte: „die Spalte landete
vorn, weil das Menü einer anderen Spalte offen war." Klang plausibel,
war messbar falsch — ein falsches Menü setzt die Spalte NEBEN die
falsche Ankerspalte, aber nie an Position 0. Der Wächter gegen fremde
Menüs bleibt (den Fall gibt es), die Behauptung ist berichtigt. Die
E90-Lehre, wieder einmal: eine plausible Erklärung ist kein Beleg,
auch nicht im eigenen Prüfkommentar.

**Der Fix wohnt an einer Stelle:** `Ids.short(n)` bildet einen
Ziffern-Anfang deterministisch auf a–f ab und beginnt damit nie mit
einer Ziffer. Alle Schema-Schlüssel-Erzeuger rufen jetzt `Ids.short`:
`eigenschaftAnlegen`, Duplizieren, der Import-Spaltenplan, die
Gegen-Relation (steuerung), die API-Schemata (verbinden) und das
Standard-Schema neuer Datenbanken (indexdb, mit Wächter-Rückfall
`'k' + …`, falls die Datei allein geladen wird).

**Geprüft** (test170, 9 Punkte): der Mechanismus selbst als
Kanarienvogel (ändert V8 die Regel, wird der Punkt rot), 1600
Ziehungen ohne Ziffern-Anfang, der ECHTE Weg über das exportierte
`eigenschaftAnlegen` 25-mal, die Standard-Datenbank 30-mal, vier
Quelltext-Zeugen. Zwei Gegenprobe-Arme einzeln: das tote Remap bringt
Ziehungs-, Echtweg- und Standard-Probe gleichzeitig zu Fall (der alte
Zufall, live); der erzwungene Schlüssel „12345" trifft NUR den
Echtweg — deterministisch, 25 von 25 vorn. test33 danach dreimal
hintereinander grün.

**Bewusster Rest (L36):** Bestandsdaten können bereits rein numerische
Schlüssel tragen — solche Spalten sortieren weiterhin nach vorn, bis
sie neu angelegt werden. Eine stille Umbenennung wäre eine
Datenmigration mit Bezügen in Zeilen, Ansichten, Formeln und
Automationen — nicht nebenbei (§9).


## E97 · Zellformat beim Einlesen: die Gegenrichtung zu E94/E95

**Datum:** 11. August 2026 · **Status:** Beschlossen · **Lücke:** L18

Hinaus gingen die Stile seit E94/E95 — herein kamen sie nicht: beide
Leser warfen styles.xml bzw. automatic-styles weg, und ein Blatt, das
fett, kursiv, Prozent und Währung trug, kam nackt an. Wer eine
formatierte Datei mit Redion weiterpflegen wollte, verlor die
Formatierung beim ersten Öffnen — still.

Jetzt geben `xlsxLesen` und `odsLesen` je Blatt neben `zeilen` eine
`stile`-Matrix zurück. Übernommen wird, was Redion selbst kennt —
fett, kursiv, Ausrichtung, Prozent (samt Stellen), Währung (samt
Zeichen); Farben, Rahmen und Füllungen bleiben bewusst liegen. Beim
Excel-Leser heisst das: cellXfs → Schriften und Zahlenformate, die
eingebauten Prozentformate 9 und 10 eingeschlossen; beim ODS-Leser:
die automatic-styles samt `number:percentage-style` und
`number:currency-style`, mit denselben Wiederholungs- und
Beschnittregeln wie die Werte — die Stile laufen synchron.

Der Tabellenblock trägt die Matrix auf BEIDEN Wegen an: in der
Mehrblatt-Schleife und am Schreibzeiger (`stilDazu`). Je Zelle eine
KOPIE des Stil-Objekts — der ODS-Leser gibt wiederholten Zellen
dasselbe Objekt, und ein geteiltes hiesse, dass Fett-Schalten in
einer Zelle alle Geschwister mitschaltet. Und `stilDazu` legt auch
für leere Zellen mit Stil einen Eintrag an — vorher gingen
Stil-ohne-Wert-Zellen ganz verloren.

**Geprüft** (test171, 15 Punkte): beide Leser an echten
Download-Bytes aus den eigenen Schreibern; der Mehrblatt-Weg durch
den ECHTEN Dateiwähler, der Einzelblatt-Weg durch den ECHTEN Dialog
(„Ab A1 einlesen"). Drei Gegenprobe-Arme, sauber komplementär: die
tote xf-Zuordnung trifft nur die Excel-Wege, die leere ODS-Stilkarte
nur die ODS-Wege, das tote `stilDazu` nur die Block-Anwendung —
die Leser-Rundreisen bleiben dabei grün.

**Eine Panne im Prüfen selbst,** festgehalten, weil sie wiederkommen
kann: der erste Arm-Durchlauf „stellte wieder her" mit `git checkout`
— das holt den COMMITTETEN Stand, und der trug E97 noch nicht. Ab dem
zweiten Arm lief alles gegen den alten Bau, zwölf Punkte rot, auch der
„Endlauf". Wiederherstellen heisst: neu bauen oder die Sicherungskopie
zurücklegen — nie `git checkout` auf ein Bau-Artefakt, dessen Quelle
noch nicht committet ist.

**L18** führt damit die Zellformatierung im Austausch in beide
Richtungen; offen bleiben Kommentare · Bilder · Diagramme · bedingte
Formatierung im Austausch.


## E98 · Abgelegte Dateien überleben den Browser-Neustart

**Datum:** 19. August 2026 · **Status:** Beschlossen · **Priorität:** 1 (§46)

Beim Untersuchen des Untergrunds für Redurs PDF-Wunsch fiel etwas
Schwereres auf als das PDF selbst. Eine Datei über 256 KB wandert in
Stücke nach `dateien`/`stuecke` — richtig so. Dann aber holte der
Aufrufer eine `blob:`-Adresse und schrieb sie **in den Block**. Eine
solche Adresse gehört dem Dokument, das sie erzeugt hat: Browser zu,
Adresse tot. Und `dateiId` las beim Zeichnen niemand zurück.

Gemessen, mit echtem Neustart des Browsers:

```txt
Stücke in der Ablage    5     die Daten sind vollständig da
Bildbreite              0     das Bild ist weg
Anhang anklickbar       nein  die Adresse führt ins Leere
```

Die Daten waren nie verloren — sie waren **unerreichbar**. Betroffen
war jedes Bild, jedes Video und jeder Anhang über 256 KB, also
praktisch jedes PDF und jedes Foto vom Telefon. Seit es die
Stücke-Ablage gibt.

**Der Fehler war unter einer Prüfung versteckt, die es nicht gab —
und wäre unter einer falschen Prüfung unsichtbar geblieben.** Die
erste Fassung von test172 lud die Seite mit `reload()` neu. Grün.
Der Bildzwischenspeicher von Chromium liefert das Bild dann nämlich
weiter aus, obwohl `fetch(src)` schon scheitert — gemessen: Bild
sichtbar, Adresse tot. Erst zwei echte Browser-Sitzungen
(`launchPersistentContext`, schliessen, öffnen) zeigen die Wahrheit.
Eine Prüfung, die neu LÄDT, ist keine Prüfung, die neu STARTET.

**Die Reparatur:** die Adresse wird beim Zeichnen geholt, nie
gespeichert. Zwei Wege tragen sie, und beide sind einzeln belegt:

```txt
nachtragen        die erste Zeichnung. Die Adresse kommt asynchron aus
                  den Stücken und wird an Bild, Video, Ton und Verweis
                  nachgereicht — ohne die Seite neu zu zeichnen und
                  dabei den Schreibzeiger zu verlieren.
adresseBekannt    jede weitere Zeichnung, synchron aus dem Zwischen-
                  speicher. Trägt keine Korrektheit, verhindert aber
                  das Flackern — gemessen im selben Tick.
```

Der **Bestand wird geheilt, nicht umgeschrieben**: eine gespeicherte
tote `blob:`-Adresse bleibt im Block stehen und wird beim Zeichnen
übergangen, sobald `dateiId` dasteht. Sie zu löschen wäre eine
Datenänderung ohne Gewinn (§9). Neue Blöcke bekommen erst gar keine.

**Geprüft** (test172, 14 Punkte): zwei echte Browser-Sitzungen, ein
4,3-MB-Bild in fünf Stücken und ein Anhang; nach dem Neustart müssen
Bild und Verweis wieder da sein. Dazu eine **kalte Seite**, die in der
zweiten Sitzung noch nie gezeichnet wurde — dort kann nur das
Nachreichen liefern, und genau das macht die Gegenproben trennscharf.
Vier Arme, jeder einzeln: die asynchrone Beschaffung tot (Bild und
Anhang fallen), das Nachtragen am Bild tot (nur die kalte Seite
fällt), das am Anhang tot (nur der kalte Verweis fällt), der
synchrone Weg tot (nur das Flackern fällt).

**Eine Zeitannahme wurde dabei wieder gestrichen.** Ein Punkt hiess
zuerst „anfangs steht dort noch nichts". Gemessen kam die Adresse
einmal nach 40 ms und einmal nach 120 ms — eine Prüfung darauf wäre
eine Behauptung über Langsamkeit und würde unter Last zufällig kippen
(E82). Geblieben ist, was zählt: kein zweites Zeichnen, und das Bild
ist da.


## E99 · Ziehen-und-Ablegen kennt nur noch eine Grenze

**Datum:** 19. August 2026 · **Status:** Beschlossen · **Lücke:** L34-Klasse

Dieselbe Datei, zwei Ergebnisse — je nachdem, wie man sie hereinbrachte:

```txt
Datei-Block, eigener Knopf   Stücke, bis 500 MB, Fortschrittsanzeige
Datei auf die Seite ZIEHEN   Data-Adresse, bis 12 MB — darüber nur ein
                             Hinweis, und die Datei war weg
```

Ein 20-MB-Schulskript verschwand also beim Ziehen und klappte über den
Knopf. CLAUDE.md §14 nennt genau diese 12-MB-Grenze ausdrücklich als
nicht endgültig, und §34 verlangt: ein Wert, der an zwei Stellen steht,
gehört an eine.

Jetzt entscheidet `Dateien.lohntSich` beide Male. Grosses geht in
Stücken mit sichtbarem Fortschritt, Kleines weiter den kurzen Weg —
für ein Bild von 40 KB wäre der Apparat Unfug. Und der Block bekommt
nur die Kennung, nie eine `blob:`-Adresse (E98).

**Geprüft** (test173, 11 Punkte): ein echtes `DragEvent` mit echtem
`DataTransfer` auf `#scroll` — das Ziel wurde nachgesehen, nicht
geraten, und der erste Wurf ging daneben, weil er auf `main` zielte.
Ein 20-MB-PDF landet in 20 Stücken ohne Data-Adresse; ein 50-KB-Bild
nimmt den kurzen Weg und trägt seine Daten direkt. Zwei Arme, jeder
einzeln: die alte Grenze zurück (drei Punkte fallen), die Kennung
nicht eingetragen (zwei fallen).

**Eine Kleinigkeit, die den Prüflauf zuerst irreführte:** `.txt` wird
beim Ablegen absichtlich zur Unterseite, nicht zum Anhang. Die erste
Fassung mass mit einer Textdatei und fand keinen Block — kein Fehler
im Code, ein Fehler in der Probe.


## E100 · Das A4-Blatt: schreiben und malen auf demselben Papier

**Datum:** 19. August 2026 · **Status:** Beschlossen

Redur will ein leeres A4-Blatt neben dem PDF, auf das er direkt
schreiben kann. Das Blatt kommt zuerst — es braucht keine fremde
Bibliothek, und es ist der Untergrund, auf dem später die PDF-Seite
liegt.

**Der Text sind gewöhnliche Redion-Blöcke.** Sie liegen als Kinder im
Blatt und werden von `Blocks.render` gezeichnet. Damit erbt das Blatt
alles, was der Editor kann: Slash-Menü, Überschriften, Aufgabenlisten,
Verweise, Suche, Export, Zurücknehmen. Ein eigener Texteditor auf dem
Papier wäre eine zweite Maschine für dieselbe Frage (E29), und die
zweite ist die, die niemand pflegt.

**Gemalt wird auf einer SVG-Schicht darüber**, die Zeiger nur annimmt,
wenn ein Stift gewählt ist. Sonst steht sie auf `pointer-events: none`
— man schreibt durch sie hindurch, als wäre sie nicht da.

### Warum ein eigener Blattraum, wo es doch das Whiteboard gibt

Das Whiteboard rechnet in rohen Bildschirmpunkten:

```js
const r = flaeche.getBoundingClientRect();
return [Math.round(e.clientX - r.left), Math.round(e.clientY - r.top)];
```

Das geht gut, solange die Fläche immer gleich breit ist. Ist sie es
nicht — anderes Fenster, Seitenleiste zu, Telefon quer —, liegt jeder
gespeicherte Strich woanders als beim Zeichnen. Ohne Fehlermeldung:
die Zeichnung sieht aus wie eine Zeichnung, nur verrutscht.

`src/core/sheet/space.ts` ist deshalb die **einzige** Stelle, die
Bildschirm in Blatt übersetzt, und sie tut es über die Bildschirm-
matrix des SVG (`getScreenCTM().inverse()`). Die berücksichtigt
Breite, Zoom, Rollstand und jede CSS-Verwandlung darüber — was
`getBoundingClientRect` nicht tut. Gespeichert werden Blattpunkte in
A4-Massen (595,28 × 841,89 pt), also dieselbe Zahl auf jedem Schirm.

`raumVersion: 1` steht von der ersten Zeile an in den Daten. Ändert
sich je die Bedeutung der Zahlen, ist an ihr erkennbar, welche Deutung
gilt. Das Whiteboard hat das nicht — und deshalb wäre dort jede
Änderung eine stille Verschiebung.

### Vier Dinge, die das Blatt anders macht

```txt
Koordinaten   Blattpunkte statt Bildschirmpunkte
Zeichnen      ein DOM-Knoten je Strich. Das Whiteboard baut bei JEDEM
              pointermove die ganze Fläche neu (innerHTML = '')
Abbrechen     pointercancel und pagehide schliessen den Strich ab —
              sonst bleibt er offen, wenn das Telefon dazwischenfunkt
Ein Finger    nur isPrimary malt, sonst zieht die zweite Hand beim
              Zoomen eine Linie quer übers Blatt
```

### Was bewusst nicht drin ist

**Kein Textsatz.** Das Blatt hat A4-Mass und 20 mm Rand, mehr nicht.
Alles Weitere wäre eine Textverarbeitung, und Redion ist keine.

**Feste Seitenhöhe, Text rollt innen.** Ein Blatt, das mit dem Inhalt
wächst, würde die Zeichenschicht mitdehnen und alle Striche
verschieben. Wer mehr Platz braucht, hängt mit „＋ Seite" eine echte
A4-Seite an; die gestrichelte Linie zeigt den Umbruch.

**Kein Zoom in v1.** Die Breite macht das Fenster, gerollt wird
gewöhnlich. Eine eigene Kamera bräuchte Mehrfinger-Behandlung.

**Geprüft** (test174): derselbe Strich wird bei **1400, 900 und
400 px** Fensterbreite gezogen — an derselben anteiligen Stelle des
Papiers, nicht an derselben Pixelstelle. Die gespeicherten Blattpunkte
müssen um weniger als 2 pt auseinanderliegen (0,7 mm — die
Ungenauigkeit des Zeigers, nicht der Rechnung). Dazu: ein Strich fügt
genau EINEN Knoten hinzu, die Striche überleben das Neuladen samt
`raumVersion`, und der Radierer nimmt genau einen weg.

### Was das Hinsehen fand, und kein Prüflauf gemeldet hätte

Nach §55 wurde das Blatt am Rechner UND am Telefon wirklich gezeichnet —
mit Text darauf und einer echten Skizze, mit der Maus gezogen.

**Am Telefon brauchte die Werkzeugleiste drei Zeilen.** Bei 390 px
verdeckte sie das halbe Papier, bevor die erste Aufgabe anfing.
Behoben wie bei der Auswahlleiste (E84): eine Zeile, die seitlich
rollt, am Telefon nur Zeichen statt Wörter.

**Und darunter lag eine Flexbox-Falle.** Die neue Messung meldete
`ueberDenRand: true` bei `rollbar: false` — die Leiste stand über den
Rand und rollte trotzdem nicht. Gemessen war sie **627 px breit in
einem 390-px-Fenster**: die Hülle steht in einem Flex-Elternteil, und
ein Flex-Kind mit `min-width: auto` wächst mit seinem Inhalt, statt zu
schrumpfen. `overflow-x` konnte gar nicht greifen, weil nie etwas
eingeengt war. Dieselbe Falle wie bei den Tabellenkarten (E89) —
zweite Auflage, diesmal beim ersten Mal gefunden, weil §37 zu jeder
Telefonleiste eine Messung verlangt und nicht nur ein Bild.

**Zwei Fehler lagen in meiner eigenen Probe, nicht im Code:** Der
Text erschien nicht auf dem Papier, weil ich über `window.Blocks`
zugriff — der Editor hängt sich aber nirgends an `window`, bei
`module: none` teilen sich alle Dateien einen Namensraum. Und der
Zeuge „im Code steht kein getBoundingClientRect" schlug an, weil der
Kopf dieser Datei die alte Rechnung ZITIERT. Ein Zeuge, der
Kommentare liest, bezeugt Prosa statt Code; er entfernt sie jetzt
vorher.

**Drei Gegenprobe-Arme, jeder einzeln.** Der wichtigste ist der
erste: rechnet der Blattraum wieder in Bildschirmpunkten, liegt
derselbe Strich bei 1400 / 900 / 400 px **82 pt und 116 pt
auseinander** — knapp drei und vier Zentimeter auf dem Papier. Das
ist der stille Fehler, den das Whiteboard heute hat, sichtbar
gemacht. Dazu: die Fläche beim Ziehen neu bauen (7 Knoten statt
einem), und die Raumfassung nicht mitspeichern.
