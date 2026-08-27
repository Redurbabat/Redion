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

> **WIDERRUFEN durch E80 am 9. August 2026.** Der Eintrag bleibt als
> Geschichte stehen. Was er über Prüfläufe sagt, gilt nicht mehr: die
> Wächter der neuen Schicht — `test149`, `test150`, `test151`, `test153`
> und `test154` — sind mit dem Rohbau entfernt worden, **es gibt diese
> Prüfläufe nicht mehr**. Wer unten liest, liest sie im Präsens, weil sie
> beim Schreiben da waren (E168).

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


## E101 · Schriftgrösse und Schriftart je Block

**Datum:** 19. August 2026 · **Status:** Beschlossen

Redur wollte „wie in Word": Grösse, Farbe und Schriftart ändern.

**Ein Drittel davon gab es schon.** Schriftfarbe UND Hintergrundfarbe
stehen seit Langem im Blockmenü unter „🎨 Farbe" — zehn Textfarben,
neun Hintergründe, gespeichert als `block.color`, gezeichnet als
`.t-red` / `.bg-red`. Gefehlt haben nur Grösse und Schriftart. Wieder
die E90-Klasse: der Wunsch klang vollständig neu und war es nicht.
Nachsehen war auch hier billiger, als drei Dinge zu bauen.

### Je Block, nicht mitten im Satz

Der Editor liest den Text mit `ct.textContent` zurück (`bindeEditor`).
Eine Auszeichnung INNERHALB einer Zeile wäre beim nächsten Tastendruck
weg — aus `**fett** normal` würde `fett normal`. Das steht so im
Quelltext, es ist nicht vermutet. Inline-Formate brauchen zuerst eine
Rückübersetzung DOM → Text; die ist eine eigene Entscheidung mit
eigenem Prüflauf. Bis dahin gilt der Stil für den ganzen Absatz.

### Kennungen, keine Werte

Gespeichert wird `'gross'`, nicht `1.35rem`; `'serif'`, nicht
`Georgia, serif`. Zwei Gründe:

```txt
Sicherheit    Ein freier Wert aus den Daten landete sonst in einem
              style-Feld. `groesse: "gross;background:url(…)"` ist
              kein erfundener Fall (§19). Kennungen werden zu CSS-
              KLASSEN, und was nicht im Katalog steht, wird verworfen.
Änderbarkeit  Wird eine Schrift später eine andere, ändert sich eine
              Zeile CSS — nicht jeder gespeicherte Block.
```

`src/register/textstile.ts` ist der EINE Katalog für alle Stellen der
Oberfläche (§8, Regel 3).

### Zwei Fehler, die erst der Prüflauf zeigte

**1 · Die Klasse hing, die Schrift blieb.** `tg-gross` stand am Block,
`getComputedStyle` meldete unverändert 16 px. Grund: `.b-text .ct`
sind zwei Klassen, `.tg-gross` ist eine — zwei schlagen eine. Ohne den
Punkt „Die Schrift ist wirklich grösser geworden" wäre eine
Grössenfunktion ausgeliefert worden, die nichts tut, und sie hätte im
Bild sogar richtig ausgesehen: das Menü zeigt die Stufen ja korrekt.

**2 · `em` hätte Überschriften SCHRUMPFEN lassen.** `em` rechnet gegen
den Elternteil, nicht gegen die eigene Grösse. Eine `h1` mit 30 px
wäre mit „Gross" (1,3 em von 16 px) auf 20,8 px gefallen. Deshalb
feste Stufen in `rem`: „Gross" heisst gross, an jedem Blocktyp.

**Geprüft** (test175, 17 Punkte): der Weg über das ECHTE Blockmenü,
die gemessene Schriftgrösse vorher/nachher, das Überleben des
Neuladens, das Zusammenspiel mit der vorhandenen Farbe — und ein
erfundener Wert (`"gross;background:url(x)"`), der weder Klasse noch
style-Feld erzeugt. Drei Arme, jeder einzeln: der Katalog liefert
keine Klassen (fünf Punkte fallen), die Gültigkeitsprüfung ist aus
(zwei), die Spezifität fällt zurück (genau der Fehler von oben kehrt
zurück).

**Eine benannte Grenze:** „Handschrift" und „Schmal" hängen an
Schriften, die das Gerät mitbringen muss (Segoe Script, Arial Narrow).
Wo es sie nicht gibt — im Prüfstand etwa —, fällt die Anzeige auf die
Standardschrift zurück. Eine Schriftdatei mitzuliefern hiesse, sie in
jede weitergegebene Einzeldatei zu packen; das ist es nicht wert.


## E102 · Spalten halten ihren Inhalt

**Datum:** 19. August 2026 · **Status:** Beschlossen

Beim Bauen der Schulaufgaben-Seite gemessen: die Kinder eines
Spaltenblocks WAREN die Spalten — je Spalte genau ein Block. Wer
rechts eine zweite Aufgabe anfing und Enter drückte, legte ein
Geschwister an, und daraus wurde eine dritte Spalte:

```txt
zwei Spalten + Enter  →  drei Spalten
drei Spalten + Enter  →  vier Spalten
```

Die Seite zerfiel also beim ganz normalen Schreiben. Und der Wunsch,
ein Blatt NEBEN etwas zu stellen, war damit gar nicht erfüllbar —
neben dem Blatt hätte genau eine Zeile Platz gehabt.

Jetzt liegt eine `spalte` dazwischen: `columns` → `spalte[]` → Inhalt.
Der Elternteil des Inhalts ist die Spalte, ein Geschwister bleibt also
IN ihr. Eine leere Spalte legt sich beim Zeichnen eine Zeile an —
sonst wäre sie eine unsichtbare Fläche, in die man nicht hineinkommt.

**Der Bestand bleibt heil.** Ist ein Kind KEINE `spalte`, wird es
weiter direkt als Zelle gezeichnet. Alte Seiten sehen aus wie vorher
und verhalten sich wie vorher; umgeschrieben wird nichts (§9).

`.spalte` bekommt `min-width: 0`. Das ist Pflicht, nicht Zierde: eine
Gitterzelle mit `min-width: auto` wächst mit ihrem breitesten Kind und
sprengt das Raster — dieselbe Falle wie bei den Tabellenkarten (E89)
und beim A4-Blatt (E100), dritte Auflage.

**Geprüft** (test176, 16 Punkte): Enter im Inhalt lässt die Spaltenzahl
bei zwei und legt die Zeile IN die Spalte; drei Spalten ebenso; ein
Bestandsblock ohne Hüllen zeichnet unverändert samt Inhalt; alles
überlebt das Neuladen. Zwei Arme, jeder einzeln: ohne Zwischenschicht
beim Anlegen fallen drei Punkte, ohne den Zeichner-Zweig einer.

**Drei Fehler lagen dabei in der Prüfung, nicht im Code** — und alle
drei sind lehrreich genug, um sie aufzuschreiben. Erstens behauptete
ein Punkt eine feste Zeilenzahl, obwohl die Spalte selbst eine leere
Zeile mitbringt; gemessen wird jetzt der ZUWACHS. Zweitens kürzte die
Probe den Zellentext auf zwölf Zeichen — die Griffe (`+`, `⋮⋮`) stehen
mit im `textContent`, und übrig blieb „links, al". Drittens zitierte
ein Quelltext-Zeuge einen Aufruf, den es so nie gab. Eine Prüfung, die
rot wird, hat nicht automatisch recht.


## E103 · Ein PDF wird zu Seiten, auf die man schreiben kann

**19. August 2026.** Redur hatte vier Wünsche für seine Schulaufgaben
genannt. Drei sind erledigt: das leere A4-Blatt (E100), das Nebeneinander
in Spalten (E102), Schriftgrösse und Schriftart (E101). Der vierte war der
grösste: *„ich wollte so haben das die orgunal pdf so jeder seite ich
unterscrolen kann … und ich sollte auch direk auf pdf schreiben bearbeiten
kann."*

Ein PDF anzeigen kann Redion nicht selbst. Das ist keine Nachlässigkeit —
ein PDF-Zeichner ist ein eigenes Programm: Schriftarten einbetten,
Farbräume umrechnen, Pfade füllen, Verschlüsselung entpacken. Also kommt
mit **pdf.js** die erste fremde Bibliothek in ein Verzeichnis, das bis
heute null Laufzeitabhängigkeiten hatte.

### Die eigentliche Entscheidung ist nicht *ob*, sondern *wo*

pdf.js kommt als **Umwandler** herein, nicht als Betrachter.

    einmal je Dokument          statt       bei jeder angesehenen Seite
    PDF  →  Seitenbilder                    PDF  →  Anzeige  →  Marken

Läge die Bibliothek dauerhaft im Anzeigeweg, hinge jede Seite, jede Marke
und jede Zoomstufe an ihr. So läuft sie **einmal**, und danach ist eine
Seite ein Bild mit einer SVG-Schicht darüber — etwas, das Redion ohne eine
einzige fremde Zeile anzeigen, beschreiben, zoomen, sichern und ausgeben
kann.

Der Preis ist Platz: rund 200 KB je Seite. Der Gewinn ist, dass die
Abhängigkeit **umkehrbar** bleibt. Fiele pdf.js später heraus — Lizenz,
Sicherheitslücke, Grösse —, funktionierten alle vorhandenen Mappen
weiter; nur der Import neuer PDFs bräche. Bei der ersten fremden
Bibliothek eines Projekts, das seine Unabhängigkeit als Merkmal führt, ist
das der Punkt, an dem alles hängt.

### Das Original bleibt das Original

Es wird als Anhang abgelegt, Byte für Byte, und nie zurückgeschrieben.
Anmerkungen liegen daneben in Redion, nicht im PDF. Wer sein Zeugnis in
Redion legt, bekommt es unverändert wieder — auch wenn die Rasterung, die
Bibliothek oder Redion selbst verschwindet. `test177` rechnet die
SHA-256-Summe nach Ablegen und Zurückholen nach.

### `abgeleitet`: was sich neu rechnen lässt, gehört nicht in die Sicherung

Die Seitenbilder tragen `abgeleitet: true`. Sie bleiben aus der `.redion`
und aus dem Abgleich heraus. Bei 200 KB je Seite und einem Skript mit 500
Seiten wären das **hundert Megabyte in jeder Sicherung**, für etwas, das
in Sekunden neu entsteht. Eine Sicherung, die man auf dem Telefon nicht
mehr herunterladen kann, ist keine Sicherung (§11).

Gefiltert wird **beim Holen**, nicht in der Packschleife: `dateien.json`
entsteht aus derselben Liste, und ein Satz darin, dessen Bytes fehlen,
wäre ein Anhang, den der Block sucht und nicht findet. Lieber gar nicht
erwähnt als falsch versprochen.

Der Gegenprobe-Arm in `test177` §5 ist der wichtige: ein **gewöhnlicher**
Anhang auf derselben Seite liegt weiterhin in der Sicherung. Ohne ihn
liesse sich nicht unterscheiden, ob das Auslassen zielt oder ob die
Sicherung einfach keine Anhänge mehr schreibt.

### Fremder Code wird getrennt und nachgerechnet

Die Bibliothek liegt in `quell/fremd/pdfjs/`, in zwei Dateien:

    daten.js    zwei Base64-Zeichenketten, gzip-gepackt. FREMDE BYTES —
                keine Zeile davon ist hier geschrieben.
    laden.js    erzeugt aus `src/fremd/pdfjs/laden.ts`. REDION-CODE,
                TypeScript, mit Kommentaren, unter allen üblichen Regeln.

Die Trennung ist keine Kosmetik. §54.4 sagt „es entsteht kein neues
JavaScript"; die Ausnahme in `pruefungen/fremd-bestand.json` deckt damit
**Bytes, nicht Logik**. Der erste Entwurf hatte beides in einer
handgeschriebenen `.js` — das wäre eine Ausnahme gewesen, die sich selbst
ausweitet.

`fremd-bestand.json` führt Pfad, Paket, Fassung, Bau, Herkunft, Lizenz,
Lizenzdatei, Begründung und je Teildatei Bytezahl und SHA-256. `test177`
§0 packt beim Prüfen wieder aus und rechnet nach. Eine eingepackte
Bibliothek, die niemand nachrechnet, ist eine halbe Million Bytes, denen
man auf Zuruf glaubt.

**Drei Entscheidungen im Kleinen**, jede gemessen statt vermutet:

- **Die `legacy`-Fassung.** Die moderne stürzte im Prüfstand ab
  (`getOrInsertComputed is not a function`) — sie verlangt einen sehr
  neuen Browser. Die legacy-Fassung läuft auch auf älteren Telefonen.
- **Eingepackt, nicht daneben.** `bauen.mts` bettet ein, was `index.html`
  über ein script-Feld lädt (§29). Roh wären es 1,7 MB; gzip und Base64
  machen 524 KB daraus, `DecompressionStream` packt beim ersten Gebrauch
  aus. Die Einzeldatei wächst von 3,8 auf 4,4 MB.
- **`isEvalSupported: false`, fest verdrahtet.** pdf.js wertet sonst
  Typ-4-Funktionen über `new Function` aus. §19 verbietet das, und eine
  Voreinstellung ist keine Zusage.

### Eine Zeichenschicht, nicht zwei

Als die PDF-Seite dieselbe Schicht brauchte wie das A4-Blatt, wurde sie
aus `blatt.ts` **herausgelöst** statt abgeschrieben: `bereiche/pdf/
marken.ts`. Zwei Kopien laufen auseinander, und die vergessene ist die,
auf der der Nutzer gerade malt (§34). Damit gilt E100 unverändert auch
über PDF-Seiten: gerechnet wird in Seitenpunkten über `getScreenCTM`, und
ein Strich liegt bei 1400 px Fenster an derselben Stelle der Seite wie bei
390 px.

### Die Leiste hat jetzt zwei Kästen

Links die Werkzeuge, die am Telefon seitlich rollen — 665 px Inhalt in
einem 334 px schmalen Kasten, gemessen. Rechts daneben ein **fester**
Teil, der nicht mitrollt: dort steht „Seite 1 von 3".

Das kam aus dem Hinsehen (§55). Die Seitenzahl stand als letztes IN der
rollenden Leiste, also hinter einem Wisch — und sie beantwortet „wo bin
ich", die einzige Frage, die man bei einem Skript mit achtzig Seiten nicht
durch Hinsehen beantwortet. Der erste Versuch hielt sie mit
`position: sticky` an der rechten Kante des Rollbereichs. Sie blieb auch
stehen, aber die Farbknöpfe schienen durch den Text hindurch. Zwei Kästen
haben diese Frage gar nicht: was nicht im Rollbereich liegt, kann nichts
überdecken.

### Und ein Fehler, der nur mit Augen zu finden war

Das PDF für die Bildschirmfotos zeigte die Überschrift „Mathematik
Klausur 2" und darunter — nichts. Kein Fehler, keine Meldung, halbe Seite.
Der Grund lag in der Prüfdatei, nicht in Redion: in einem PDF steht Text
in runden Klammern, und das `)` in „1)" hatte die Zeichenkette vorzeitig
beendet und den ganzen Inhaltsstrom danach mitgenommen.

Die Lehre ist nicht das Escapen. Sie ist, dass `test177` vorher gemessen
hatte, ob **irgendetwas** auf der Seite steht — die Bytezahl des Bildes.
Eine Überschrift allein besteht diese Messung mühelos. Jetzt werden die
dunklen Punkte in dem Streifen gezählt, in dem die Aufgaben stehen, und
ein Gegenprobe-Arm rendert dasselbe PDF **ohne** Escape und zeigt, dass
der Streifen dort leer ist. Erst damit kann die Messung überhaupt rot
werden (§55.2).

**Geprüft** (test177, 64 Punkte in acht Abschnitten): Prüfsummen des
Fremdcodes · pdf.js liest ein dreiseitiges PDF · der ganze Weg vom
Ablegen zu drei Seitenblöcken, über das echte Fallenlassen und nicht am
Umwandler vorbei (E93) · das Original Byte für Byte zurück · ein Strich
bei 1400 und bei 390 px · die Sicherung lässt Abgeleitetes weg und
Gewöhnliches nicht · Quelltext-Zeugen · und alles noch einmal per
Doppelklick über `file://` in der Einzeldatei (§29), wo Blob-Adressen,
dynamische Importe und Arbeiter sonst gern verweigert werden.

**Was noch fehlt**, steht in LUECKEN.md: Seitenanker, Textsuche im PDF,
Neurasterung in höherer Auflösung, verschlüsselte Dateien.


## E104 · Beim Einlesen steht das Notizblatt gleich daneben

**19. August 2026.** Redurs Satz zum PDF hatte zwei Hälften. E103 baute die
erste — durchblättern und darauf schreiben. Die zweite stand wörtlich da und
war noch offen:

> „wenn ich die pdf hochlade sollte ich neben es … so leeren a4 balat haben
> die ich direk dort schreiben kann"

Jetzt fragt das Einlesen, und bei „nebeneinander" bekommt jede Seite ein
leeres Blatt neben sich:

    columns
      ├─ spalte → pdfseite      links die Seite
      └─ spalte → blatt         rechts das Blatt, leer

**Dieselbe Bauform wie von Hand.** Der Spaltenblock entsteht als
`columns → spalte → Inhalt`, genau wie ihn das Slash-Menü baut (E102). Eine
eigene Bauform für „vom PDF angelegt" wäre eine zweite Wahrheit über
dasselbe Ding — und die zweite ist die, die man beim Umbauen vergisst.

**Das Blatt bekommt die Masse der SEITE, nicht A4.** Ein querformatiges PDF
neben einem hochkanten Blatt sähe aus wie ein Fehler, und keine Zeile links
läge auf der Höhe der Zeile rechts. `blattBreite` und `blattHoehe` gibt es
seit E100; hier zahlen sie sich aus. Das Prüf-PDF in `test178` hat deshalb
eine hochkante und eine quere Seite — ohne die quere wären „Masse der Seite"
und „A4" dasselbe, und der Punkt prüfte nichts.

**Gefragt wird jedes Mal.** Die zuletzt gewählte Anordnung steht nur vorn,
mit dem Fokus darauf — Ablegen und Enter genügt. Sie wird nicht heimlich
angewandt. Ein gemerkter Zustand, den man nirgends sieht und nirgends
ändert, ist die Sorte Falle, die man erst beim dritten PDF bemerkt.

### Der Fund: `min-width` stand seit E102 eine Schicht zu tief

Nebeneinander gestellt, sprengte das Gitter sofort das Fenster. Gemessen bei
1500 px Fensterbreite:

    Gitter                    708 px
    Spur 1                    587 px
    Spur 2                    544 px
    zusammen mit Abstand    1 155 px      →  die rechte Spalte stand draussen

Bei `grid-template-columns: 1fr 1fr` sollte das nicht möglich sein. Es ist
möglich, wenn die Gitterzelle ihre automatische Mindestbreite behält — und
`min-width: 0` stand am falschen Element. Der Editor packt jeden Block in
eine Hülle `.blk`; Kind des Gitters ist also `.blk.b-spalte`, und `.spalte`
liegt DARIN. E102 setzte die Regel auf die innere Schicht.

Aufgefallen ist es nie, weil handgemachte Spalten Text enthalten und dessen
Mindestbreite ein Wort ist. Eine Werkzeugleiste ist 479 px breit.

Das ist die **vierte Auflage** derselben Falle — nach den Tabellenkarten
(E89), dem A4-Blatt (E100) und den Spalten selbst (E102) — und die erste,
bei der die Abhilfe danebenlag statt zu fehlen. `test178` §5 misst jetzt die
Spurbreiten, den Überlauf und dass die Zellen wirklich `min-width: 0`
tragen; der Arm ohne die Regel bringt sechs Punkte zu Fall.

### Und ein zweiter Fund: eng ist nicht dasselbe wie Telefon

In der Spalte brauchten beide Werkzeugleisten drei Zeilen übereinander —
bei 1500 px Fensterbreite. Die Regel für die schmale Leiste hing seit E100
an `@media (max-width:760px)`, also am FENSTER; schmal war hier aber der
KASTEN. Dieselben Regeln stehen jetzt ein zweites Mal an `.spalte`.

Zwei Umsetzungen derselben Sache sind ein Preis; die Alternative wäre eine
Container-Abfrage gewesen, und die fällt auf genau den älteren Geräten aus,
für die E103 die `legacy`-Fassung von pdf.js gewählt hat.

### Halb gebaute Seiten gibt es nicht mehr

Eine PDF-Seite entstand bisher leer und bekam Nummer, Masse und Herkunft
nachgereicht, nachdem ihr Bild abgelegt war. Dazwischen lag ein Block ohne
alles — ein paar Millisekunden je Seite, aber lang genug, dass zwei
Prüfläufe genau dort hineinlasen und `nr: null` fanden. Beide sahen aus wie
Fehler im Baum.

Jetzt trägt der Block alles schon bei der Anlage. Nur `bildDateiId` bleibt
ein Nachtrag, weil die Ablage die Block-Kennung braucht, die es vorher nicht
gibt — und diese eine Lücke kennt der Zeichner und schreibt „Seite wird
vorbereitet …" hin.

Die Lehre ist nicht „länger warten". Ein Zustand, den es nicht gibt, muss
auch nicht behandelt werden.

**Geprüft** (test178, 47 Punkte): der Baum bei beiden Anordnungen · die
Masse bei hochkanter und querer Seite · dass „Nur die Seiten" weiterhin
genau das baut, was E103 baute · die Reihenfolge der Knöpfe und der Fokus ·
Abbrechen hängt nur an · Spurbreiten und Überlauf · am Telefon eine Spalte
mit dem Blatt UNTER der Seite · und auf beiden Blättern lässt sich getrennt
malen. `test177` zieht nach: es beantwortet den neuen Dialog ausdrücklich
über die Kennung, nicht über „der erste Knopf" — welcher vorn steht, hängt
seit heute an der letzten Wahl.


## E105 · Ein Verweis führt wirklich hin

**19. August 2026.** L37 nannte den Seitenanker als nächstes Stück: von einer
Notiz auf „Seite 14" eines Dokuments springen. Beim Nachsehen, worauf das
aufbauen kann, stand da schon etwas — und es war kaputt.

`editor.js` hat seit Langem ein Tastenkürzel:

    Strg + Umschalt + C   →   …#block=<kennung>
                              „Link auf diesen Block kopiert"

**Gelesen hat diese Adresse nie jemand.** Beim Start nahm die Schale den Hash
als Seitenkennung; `Store.getBlock('block=abc')` gibt nichts, also griff der
Rückfall auf „zuletzt geöffnet". Der Link tat also etwas — er öffnete eine
Seite, nur nicht die richtige, und ohne ein Wort darüber.

Das ist die gefährlichste Bauart eines Fehlers: **er sieht aus wie ein
Erfolg.** Wer den Link anklickt, sieht Redion aufgehen und eine Seite
erscheinen. Dass es die falsche ist, merkt man nur, wenn man weiss, welche
die richtige gewesen wäre.

### Was jetzt geschieht

    #block=<kennung>   →  Seite des Blocks suchen (Links.seiteVon)
                       →  sie öffnen, falls nicht schon offen
                       →  zum Block rollen
                       →  ihn kurz hervorheben

Beim Start **und** bei jeder späteren Adressänderung. `oeffne` schreibt die
Seitenkennung selbst in die Adresse; solche Änderungen laufen durch den
`hashchange`-Zuhörer durch, weil sie nicht mit `block=` beginnen.

**Gerollt wird über Bildfolgen, nicht über die Uhr.** `oeffne` setzt am Ende
`scrollTop = 0`; wer davor rollt, rollt dagegen an. Also zwei
`requestAnimationFrame`. Und ein PDF-Seitenbild kommt aus der Stücke-Ablage
und ist beim ersten Rollen oft noch nicht da — es ist genau das, was die
Seite hoch macht. Deshalb noch einmal rollen, wenn es steht: am `load` des
Bildes, nicht nach einer geratenen Wartezeit.

### Der Anker an der PDF-Seite (L37)

Neben „Seite 14 von 80" steht jetzt ein 🔗. Er kopiert den Verweis auf genau
diese Seite. Er sitzt im **festen** Kasten der Leiste (E104), nicht im
rollenden — sonst läge er am Telefon hinter einem Wisch, und das gilt für
einen Verweis noch mehr als für die Seitenzahl.

### Wie die Prüfung ihren eigenen Fehler zeigte

`test179` §1 lädt Redion über `…#block=<kennung>` und verlangt, dass die
**zweite** Seite aufgeht, obwohl die **erste** die zuletzt geöffnete ist.
Genau diese Anordnung ist der Beweis: ein Punkt, der nur „irgendeine Seite
ist offen" prüft, wäre auch vor E105 grün gewesen.

Der erste Entwurf prüfte trotzdem nichts. Er rief

    seite.goto('…/index.html#block=' + kennung)

und nannte den Abschnitt „beim Start". Ein `goto` auf dieselbe Adresse mit
anderem Hash ist aber **keine Navigation** — der Browser bleibt im selben
Dokument und feuert nur `hashchange`. Aufgefallen ist es erst am Arm: die
Start-Behandlung herauszunehmen änderte gar nichts, während der Arm ohne
`hashchange` sechs Punkte fällte. Zwei Arme auf denselben Weg. Über
`about:blank` gibt es jetzt ein echtes zweites Hochlaufen, und dann fällt
Arm A wie er soll.

**Und eine zweite Lehre über Prüfungen:** ein Punkt las die Meldung aus
`#toast`. Der Kasten ist EINER für die ganze App, und beim Lauf stand dort
„🎴 1 Karteikarte ist fällig" — die Erinnerung war dazwischengekommen.
Geprüft wird jetzt, was der Verweis GESAGT hat, nicht was zuletzt im Kasten
stand.

### Und ein Fund beim Hinsehen

Eine PDF-Seite ohne Bild zeigte das Bruchsymbol des Browsers samt Alt-Text —
direkt über dem Satz, der dasselbe in Ordentlich sagt. Ein `img` ohne `src`
ist für den Browser ein kaputtes Bild. Es wird jetzt erst eingehängt, wenn
es eine Adresse hat.

Das ist kein Randfall: **nach dem Einspielen einer `.redion` haben alle
Seiten kein Bild**, weil E103 die abgeleiteten Dateien bewusst weglässt.
Womit die nächste Aufgabe feststeht — der Satz „sie entstehen in Sekunden
neu" stimmt bisher nur der Möglichkeit nach; nichts stellt sie wirklich
wieder her. Das steht als L38 fest und kommt als nächstes.

**Geprüft** (test179, 26 Punkte): Start über einen Verweis auf eine andere
als die zuletzt geöffnete Seite · dasselbe im Betrieb ohne Neuladen · ein
Verweis auf einen gelöschten Block sagt es und lässt die Seite stehen · der
Anker an der PDF-Seite, sein Platz im festen Kasten, sein Text, sein Inhalt
und der Weg zurück über den eben kopierten Verweis · Quelltext-Zeugen. Drei
Arme, jeder einzeln: ohne die Start-Behandlung fallen sechs Punkte, ohne
`hashchange` fünf, ohne den Anker bricht §3 ab.


## E106 · Die Seitenbilder kommen aus dem Original zurück

**19. August 2026.** E103 lässt die gerasterten Seitenbilder bewusst aus der
Sicherung heraus — 200 KB je Seite, bei einem Skript mit 500 Seiten hundert
Megabyte in jeder `.redion` — mit der Begründung, sie liessen sich „in
Sekunden neu rechnen".

**Der Satz stimmte nur der Möglichkeit nach.** Nichts stellte sie wieder her.
Wer eine Sicherung einspielte, bekam sein Skript zurück — die Marken darauf,
die Notizblätter daneben, das Original als Anhang — und lauter leere Seiten
mit dem Satz „Für diese Seite gibt es noch kein Bild." Ein Hinweis ohne
Ausweg, und damit stand in E103 und in der README ein Versprechen, das der
Code nicht hielt.

Gefunden habe ich es beim Hinsehen (§55), nicht durch einen Prüflauf: auf
einem Bildschirmfoto stand über dem Hinweis noch das Bruchsymbol des
Browsers. Beim Nachdenken darüber, wann eine Seite ohne Bild überhaupt
vorkommt, fiel die Antwort auf: **nach jedem Einspielen, für jede Seite.**

### Ein Knopf, ein Dokument

Aus dem Hinweis ist ein Weg geworden: „Aus dem Original zurückholen". Er holt
**das ganze Dokument** zurück, nicht die eine Seite — das Original
aufzuschlagen ist der teure Teil, eine Seite daraus zu zeichnen der billige.
Wer eine Seite anklickt, meint das Skript.

**Die Masse werden nicht neu gelesen.** `nr`, `bw` und `bh` stehen am Block
und bleiben. Käme aus einer neuen Messung eine andere Zahl, läge jeder Strich
woanders — die Marken sind in genau diesem Raum gespeichert (E100). Deshalb
ruft das Zurückholen `geometrie()` gar nicht erst auf, und `test180` bezeugt
das im Quelltext.

Ohne `quelleId` gibt es keinen Knopf: eine `.json`-Sicherung kennt keine
Anhänge, also fehlt auch das Original. Ein Knopf, der nichts tun kann, ist
schlimmer als keiner. Ist die Kennung da und das Original trotzdem weg, sagt
Redion, was zu tun ist — die Datei noch einmal hereinziehen.

### Drei Fehler, die dabei sichtbar wurden

**„Kein Bild" heisst nicht „keine Kennung".** Nach dem Einspielen trägt jeder
Block seine alte `bildDateiId`; die Datei dahinter ist nicht mitgekommen. Die
erste Fassung von `ohneBild` sah nur, ob eine Kennung dasteht — und hielt
damit genau die Seiten für fertig, um die es geht. Jetzt wird der Datei-Satz
nachgeschlagen.

**Die blob-Adresse überlebte ihre Datei.** `Dateien.weg` räumt den
Adress-Zwischenspeicher mit auf; `anhaengeEinspielen` in der Schale griff
beim Ersetzen daran vorbei direkt auf den Speicher zu. Ein Block, der noch
auf die weggeworfene Kennung zeigt, bekam daraufhin **weiter das alte Bild**
zu sehen — bis zum nächsten Neuladen. Vorher war das kaum erreichbar; seit
E103 überleben genau solche Blöcke das Einspielen, also ist es der Normalfall
geworden. Eine Zeile: `Dateien.adresseWeg(alt.id)`.

**Und E104s Rückfall war zu teuer.** Eine Datei, die nur `.pdf` HEISST, wurde
erst vollständig abgelegt, dann ganz eingelesen, dann von pdf.js abgelehnt
und erst dann sichtbar angehängt. Bei 20 MB vergingen so Sekunden, in denen
auf der Seite nichts stand — `test173` mass `angelegt: 0`. Jedes PDF beginnt
mit `%PDF-`; fünf Bytes zu lesen kostet nichts. Wer daran scheitert, geht
sofort den gewöhnlichen Weg, und der legt den Block **zuerst** an.

### Was die Prüfung über sich selbst lernte

`test180` fährt den ganzen Ring ab — einlesen, malen, sichern, alles löschen,
einspielen, zurückholen — weil nur er die Frage beantwortet. Ein Lauf, der
bloss `neuBerechnen` aufriefe, prüfte die Rechnung; hier zählt, ob nach einer
echten Sicherung überhaupt genug übrig ist, um sie anstellen zu können.

Dreimal hat der Lauf dabei denselben Fehler gemacht und ihn dreimal anders
angezogen: **er hielt eine Kennung für ein Bild.** Beim Löschen liess er den
Adress-Zwischenspeicher stehen und sah ein Bild, das es nicht mehr gab. Beim
Zählen nahm er `b.bildDateiId` und fand zwei, wo keines war. Und beim Warten
gab er eine `async`-Bedingung an `waitForFunction` — ein Versprechen ist immer
wahr, also war die Bedingung sofort erfüllt und gemessen wurde der Zustand
VOR dem Zurückholen.

Gewartet wird jetzt darauf, dass sich die Kennung **ändert**: der letzte
Handgriff je Seite, synchron ablesbar, und weder von einer toten Kennung noch
von einem Versprechen zu verwechseln.

**Geprüft** (test180, 35 Punkte): der ganze Ring · in der Sicherung liegt
genau ein Anhang · nach dem Einspielen sind Nummern, Masse und Marken Zeichen
für Zeichen dieselben und kein Bild lebt · der Hinweis trägt einen Knopf ·
ein Klick holt beide Seiten zurück, als WebP, wieder als `abgeleitet`
gestempelt, ohne die Masse anzurühren · das Original bleibt Byte für Byte ·
ein zweiter Lauf rechnet nichts noch einmal · ohne Original kein Knopf ·
Quelltext-Zeugen.


## E107 · Der Text im PDF ist auffindbar

**19. August 2026.** Ein gerastertes Seitenbild ist für die Suche **stumm**.
Wer sein Mathe-Skript hereinzog, konnte darin blättern und darauf schreiben —
aber „Pythagoras" zu suchen fand nichts, auch wenn das Wort auf Seite 63
stand. Bei achtzig Seiten ist das der Unterschied zwischen einem Dokument und
einem Stapel Papier.

pdf.js liest die Textebene ohnehin mit, und beim Einlesen ist die Bibliothek
gerade da. Der Text wandert deshalb **einmal** an den Block; danach findet die
Suche ihn ohne eine fremde Zeile. Dieselbe Aufteilung wie beim Bild (E103) —
die Bibliothek ist Umwandler, nicht Betrieb.

### Drei Entscheidungen im Kleinen

**`suchtext`, nicht `text`.** `text` ist, was ein Mensch geschrieben hat, und
die Oberfläche zeigt es an vielen Stellen — eine halbe Seite Skript in der
Krümelspur wäre keine Verbesserung. Der Suchtext steht daneben.

**Er kommt MIT in die Sicherung**, anders als die Bilder. Er ist klein (rund
2 KB je Seite), und ohne ihn wäre ein eingespieltes Skript wieder stumm, bis
jemand alle Seiten neu rechnet. Genau das prüft `test181` §4: Bilder weg,
Text da, Suche findet.

**Gekürzt wird bei 8000 Zeichen je Seite.** Eine dicht bedruckte A4-Seite hat
rund 3000. Ohne Grenze wüchse der Bestand einer 500-Seiten-Datei um mehrere
Megabyte — und die stehen, anders als die Bilder, in jeder Sicherung.

Eine Seite ohne Textebene — ein eingescanntes Blatt — liefert nichts. Das ist
kein Fehler, nur stumm; OCR steht weiterhin in L29.

### Und der Treffer springt zum Block

Möglich seit E105. `findInside` gibt jetzt `{ text, blockId }` zurück statt
nur einer Zeichenkette, und die Suche geht damit zur **Fundstelle** statt zur
Seite. Eine Fundstelle auf Seite 63 nützt wenig, wenn man danach 63 Seiten
weit rollen muss.

Auch das Zurückholen (E106) trägt fehlenden Text nach — für alles, was vor
heute eingelesen wurde. Das Dokument ist dabei ohnehin offen.

### Der Fund beim Hinsehen

Im Suchfenster stand rechts in der Vorschau: **„Diese Seite ist noch leer."**
Für eine Seite mit vier PDF-Seiten darauf. Die Vorschau liest `b.text`, und
eine PDF-Seite hat keinen.

Kein Prüflauf hatte etwas dagegen, weil keiner hinsah — und der Satz ist die
unangenehmste Sorte Falschaussage: er klingt nach einer Information. Jetzt
zählt die Vorschau die Seiten auf, mit der ersten Zeile jeder Seite. Aus
einer Lüge ist ein Inhaltsverzeichnis geworden.

### Und eine Zahl, die falsch dastand

Beim Nachdenken darüber, ob die „Neurasterung in höherer Auflösung" aus L37
das nächste Stück sein sollte, habe ich nachgerechnet statt geglaubt:

    1654 px über eine A4-Breite
    = 1654 × 72 / 595,28
    = 200 dpi

In `leser.ts`, in E103, in AUFGABEN.md und in LUECKEN.md stand „rund 140
dpi". Das war schlicht falsch gerechnet, und die falsche Zahl hatte eine
Lücke begründet: bei 140 dpi wäre starkes Hineinzoomen wirklich unscharf,
bei 200 ist es Scan-Qualität. Die „Neurasterung" ist deshalb von der Liste —
nicht weil sie gebaut wurde, sondern weil es sie als Lücke nie gab.

Eine Zahl, die man von einer Stelle zur nächsten weiterträgt, wird dabei
nicht wahrer. Sie wird nur schwerer zu widerrufen (§34).

### Und einmal ein ganzes Skript gemessen

Statt zu schätzen, wie sich das alles bei echter Grösse verhält: ein dicht
bedrucktes Dokument mit 60 Seiten, 24 Textzeilen je Seite, eingelesen.

    Dauer            21,1 s          352 ms je Seite
    Seitenbilder     15,5 MB         265 KB je Seite
    Original          202 KB
    Suchtext          139 KB        2367 Zeichen je Seite
    JS-Speicher        23 MB

Drei Dinge stehen damit fest. Die Grenze von 8000 Zeichen je Seite ist
grosszügig — eine dichte Seite braucht 2400. Der Speicher bleibt flach: eine
Leinwand zur Zeit, wie gebaut. Und die Zeit ist erträglich, aber spürbar,
also gehört sie in die Frage vor dem Einlesen.

**Der Dialog log dabei**, wenn auch nur ein wenig: er kündigte „ungefähr
12 MB" an (60 × 0,2) und es wurden 15,5. Eine Schätzung, die den Preis
kleiner macht, als er ist, ist genau die Sorte Versprechen, die §33
verbietet. Jetzt steht dort „bis zu 18 MB und etwa 21 Sekunden" — 0,3 MB je
Seite liegt über dem dichtesten gemessenen Fall, und „bis zu" sagt, dass es
eine Obergrenze ist. Dazu der Satz, der die Angst nimmt: in die Sicherung
kommen diese Bilder nicht.

**Geprüft** (test181, 30 Punkte): jede Seite bringt ihren Text mit und die
Zeilen kleben nicht aneinander · die Suche findet das Wort auf Seite 3 und
nicht auf Seite 1 · sie findet nichts, was nirgends steht · der Treffer nennt
den Block und springt hin, von einer anderen Seite aus · nach Sicherung und
Einspielen ohne Bilder findet sie es weiterhin · die Vorschau zählt die
Seiten auf. Drei Arme, jeder einzeln: ohne `suchtext` in der Suche fallen
fünf Punkte, ohne den Text am Block acht, ohne den Vorschau-Zweig drei.


## E108 · Eine beschriebene Seite lässt sich weitergeben

**19. August 2026.** Redurs Satz war „die aufgaben lösen". Danach kommt:
abgeben. Und genau da hörte Redion auf.

Wer eine Schulaufgabe mit Strg + P druckte, bekam die Notizzeilen und
**nichts** von dem Blatt, auf dem sie stehen. Kein Seitenbild, keinen
einzigen Strich. Nicht hässlich — leer.

Der Grund ist banal und deshalb lehrreich: `seiteAlsHtml` ist eine Kette von
Blockarten, und wer nicht darin steht, kommt nicht vor. `pdfseite` und
`blatt` standen nicht darin, und beide haben keinen `text` — sie fielen
durch jede Bedingung hindurch bis zum `else if (t)` und blieben dort liegen.
Kein Fehler, keine Meldung, kein leerer Kasten: einfach nichts.

### Ein Baum, ein Haken

`seiteAlsHtml` bekommt einen optionalen `sonderfall`. Gibt er etwas zurück,
gilt das statt der Kette **und** statt des Absteigens; der Sonderfall
entscheidet selbst, ob er hinabsteigt.

Damit setzt der Druckweg PDF-Seiten und Blätter mit Bild und Strichen, ohne
dass es eine zweite Baumwanderung gäbe. Eine zweite hätte beim nächsten
neuen Blocktyp genau eine Stelle nachgezogen bekommen — die, an die man
gerade denkt.

**Die Striche kommen aus `Marken.zeichneMarke`**, derselben Stelle, die sie
auch auf dem Bildschirm zeichnet (§34). Sie gehen als SVG hinaus und bleiben
deshalb scharf, egal wie fein der Drucker ist.

**Zwei Wege, und das ist Absicht.** `seiteAlsHtml` bleibt synchron und ohne
Bilder: es bedient auch den Archiv-Export und das Veröffentlichen, und dort
wäre eine blob-Adresse nach der Sitzung tot (E98) — von einem Schulskript in
einer öffentlichen Seite ganz abgesehen. Es sagt jetzt aber wenigstens, DASS
eine Seite da ist, statt zu schweigen. Zum Drucken werden die Bilder vorher
als Daten-Adressen eingesammelt; dann steht im Rahmen ein vollständiges
Dokument.

**Spalten werden beim Drucken untereinander gesetzt.** Nebeneinander auf A4
hochkant wären zwei Spalten von je 90 mm — lesbar ist das nicht, und die
Reihenfolge Seite, Blatt, Seite, Blatt bleibt ohnehin eindeutig.

### Und ein Fund im Druckbild

Die Antworten auf dem Notizblatt waren nummeriert und wurden als **Punkte**
gedruckt. Jeder Listeneintrag ging als nacktes `<li>` hinaus, ohne `<ul>`
oder `<ol>` darum — seit es den Export gibt. Zwei Folgen: eine nummerierte
Liste verliert ihre Nummern, und das Ergebnis ist ungültiges HTML.

Das betraf nicht nur den Druck, sondern auch den HTML-Export und das
Veröffentlichen. Aufgefallen ist es im Druckbild, weil dort zum ersten Mal
jemand eine nummerierte Antwort abgeben wollte.

### Zwei falsche Zeugen auf dem Weg

Der Punkt „es gibt nur eine Baumwanderung" war zweimal falsch formuliert,
bevor er stimmte. Erst zählte er `const raus = ` und verlangte genau eins —
davon gibt es drei, der Name ist eine gewöhnliche Vokabel. Dann zählte er
`b.type === 'callout'` und verlangte genau eins — davon gibt es zwei, und
die zweite ist berechtigt: die Präsentation (`folieBlock`) setzt Folien und
nicht Fliesstext.

Beide Male war die Absicht richtig und die Messung zu grob. Jetzt wird
innerhalb von `seiteAlsHtml` gezählt und ausserdem geprüft, dass der
Druckweg keine eigene Kette hat.

**Nebenbefund, nicht behoben:** die Präsentation hat ihre eigene Kette und
zeigt PDF-Seiten deshalb ebenfalls nicht. Steht als L38 in LUECKEN.md.

**Geprüft** (test182, 24 Punkte): das Druckdokument enthält das Seitenbild
als Daten-Adresse und keine blob-Adresse · beide Striche als SVG, in
Seitenpunkten, mit dem Zeichenraum der Seite · nichts wird beim Umbruch
zerschnitten · der gewöhnliche Export erfindet kein Bild, schweigt aber auch
nicht mehr · Quelltext-Zeugen. Ein Arm: ohne den Sonderfall fallen sieben
Punkte.


## E109 · Die Präsentation kennt die neuen Blöcke — L38 geschlossen

**19. August 2026.** Bei E108 fiel nebenbei auf, dass `Werkzeuge.praesentation`
Folien über eine **eigene** Kette von Blockarten baut. Ich habe es als L38
notiert und weitergemacht. Eine Stunde später war klar, dass das der falsche
Ort dafür war: eine gefundene Lücke, die man aufschreibt und liegen lässt,
ist ein Fund weniger und ein Eintrag mehr.

Was auf einer Folie nicht vorkam: **Tabelle, Datenbank, PDF-Seite, A4-Blatt.**
Und schlimmer als jede fehlende Blockart: `sammle` stieg in Spalten gar nicht
erst hinab. Eine Schulaufgabe liegt seit E104 **immer** in Spalten — als
Vortrag war sie damit vollständig leer. Nicht kaputt, nicht gemeldet: leer.

### Zwei Ketten sind in Ordnung, zwei Stände nicht

Dass es zwei Ketten gibt, ist keine Nachlässigkeit. Folien sind ein anderes
Medium als Fliesstext: andere Grössen, andere Umbrüche, ein Bild je Folie
statt eines Flusses. Sie zusammenzulegen hiesse, beiden das anzutun, was der
anderen passt.

Falsch war nur, dass die eine mitwuchs und die andere den Stand von damals
hielt. **Der wiederkehrende Befund dieses Projekts, wieder einmal: nicht
„etwas vergessen", sondern „an einer Stelle getan und an der Nachbarstelle
nicht."**

### Spalten bleiben Spalten

Der erste Entwurf löste die Spalten auf und setzte alles untereinander. Das
Bild zeigte, warum das falsch ist: eine Folie ist **breit und flach**, ein
Blatt hoch und schmal. Zwei hochkante Blätter übereinander passen nicht
darauf — das zweite stand halb ausserhalb, und die Überschrift war ganz aus
dem Bild geschoben.

Nebeneinander ist ausserdem das, was das Dokument ohnehin sagt. Also bleiben
Spalten Spalten, und `folieBlock` setzt sie als Reihe.

### Der 52-vh-Deckel

Zwei gleich grosse A4-Seiten standen unterschiedlich hoch nebeneinander:
**442 gegen 541 px.** Der Grund stand in der Präsentations-CSS seit jeher:

    .praesi img{max-width:100%; max-height:52vh; border-radius:8px}

Für ein eingefügtes Foto ist das richtig. Für eine Dokumentseite deckelt es
ausgerechnet die Höhe, die das Seitenverhältnis bestimmen soll — und rundet
die Ecken eines Aufgabenblatts.

Das Seitenverhältnis steht deshalb jetzt am **Kasten**, wie beim Blatt
daneben, und das Bild darin ist vom Deckel ausgenommen.

**Das genügte der Prüfung fast zum Verhängnis.** Der Arm, der den Deckel
zurückbrachte, blieb grün: das Seitenverhältnis am Kasten hält die äussere
Höhe schon allein richtig. Nur das Bild DARIN wäre wieder zu kurz — die Seite
stünde oben im Kasten, unten bliebe weisses Papier. Gemessen wurde aber der
Kasten. Erst der Punkt, der das **Bild** gegen seinen Kasten misst, macht den
Arm rot.

Eine Prüfung, die den Behälter misst statt des Inhalts, sagt „passt" über
etwas, das man ansieht und schief findet.

**Geprüft** (test183, 26 Punkte): drei Folien entstehen · die Aufgabenfolie
ist nicht leer, trägt zwei Blätter nebeneinander in zwei Spalten, eines mit
Seitenbild, beide Striche mit ihren gespeicherten Punkten · beide gleich
hoch, im A4-Verhältnis, und das Bild füllt seinen Kasten ohne runde Ecken ·
die Tabellenfolie zeigt ihre Werte · Escape beendet · Quelltext-Zeugen. Drei
Arme, jeder einzeln: ohne den Spaltendurchstieg fallen sieben Punkte, ohne
die neuen Blockarten acht, ohne die Bildregel zwei.


## E110 · Ein geschütztes PDF fragt nach seinem Passwort

**19. August 2026.** Der letzte offene Punkt aus L37. Bisher sagte Redion bei
einer passwortgeschützten Datei „Redion kann sie nicht öffnen" und hängte sie
an. Ehrlich — aber eine Sackgasse: die Datei hat ein Passwort, der Mensch
davor kennt es, und niemand hat ihn gefragt.

pdf.js kann fragen. `getDocument()` gibt einen Auftrag zurück, und dessen
`onPassword` wird gerufen, wenn die Datei eines verlangt — mit einem Grund
dazu: `2` heisst „das war falsch". Ohne diese Unterscheidung käme beim
zweiten Mal derselbe Satz, und man wüsste nicht, ob man sich vertippt hat
oder ob gar nichts angekommen ist.

### Das Passwort wird nirgends abgelegt

Es geht von der Tastatur an pdf.js und ist danach weg. Nicht in den Block,
nicht in die Ablage, nicht in die Sicherung, nicht in den Browser-Speicher.

Das ist keine Sparsamkeit, sondern der Punkt: **ein Passwort, das die App
aufbewahrt, hebt den Schutz auf, den es geben soll** — und zwar für jeden,
der später an die Sicherung kommt. §19 sagt „Passwort nie speichern", und
das gilt auch für fremde Passwörter.

`test184` §4 misst das nach: nach dem Einlesen wird das Passwort in allen
Fächern, im Export, in den Datei-Sätzen, im `localStorage` und über die Suche
gesucht — und darf nirgends auftauchen. Ein Gegenprobe-Punkt sucht daneben
nach „Klausur" und findet es, damit klar ist, dass die Suche nicht einfach
ins Leere greift.

Das Eingabefeld ist ein `type="password"` mit `autocomplete="off"`: nicht
sichtbar, nicht vom Browser gemerkt. `Dialog.frage` hat dafür ein drittes
Argument bekommen.

### Und wer abbricht, verliert nichts

Der Abbruch führt in denselben Rückfall wie E104: die Datei hängt sichtbar an
der Seite, vollständig, genau einmal. Die Meldung sagt seither nicht mehr
„Redion kann sie nicht öffnen", sondern „bleibt ohne Passwort zu" — der
Unterschied zwischen einer Grenze der App und einer Entscheidung des
Menschen.

### Das Prüf-PDF ist echt verschlüsselt

Ein Prüflauf, der die Passwortfrage an einer Datei ohne Passwort prüft, wäre
grün und bedeutungslos. `pruefungen/hilfe/krypto-pdf.mts` baut deshalb ein
PDF mit dem Standard-Sicherheitshandler — V1/R2, RC4 mit 40 Bit —, inklusive
`/O`, `/U`, dem daraus abgeleiteten Schlüssel und einem eigenen Objektschlüssel
je Inhaltsstrom.

Warum die älteste Form und nicht AES: geprüft wird die **Frage** nach dem
Passwort, nicht die Güte der Verschlüsselung. Etwas Modernes zu bauen hiesse,
den halben Standard nachzuschreiben, ohne dass die Prüfung dadurch mehr
wüsste. Und RC4 steht ausdrücklich nur im Prüfstand: Redion verschlüsselt
kein PDF, es liest nur.

`test184` §0 stellt vor allem anderen fest, dass die Datei ohne Passwort
wirklich zu ist und ein falsches sie nicht öffnet.

**Geprüft** (test184, 31 Punkte): die Datei ist wirklich verschlossen · ein
falsches Passwort wird abgelehnt und noch einmal gefragt, das zweite Mal mit
Hinweis · mit dem richtigen gehen Seiten, Text, Masse und Bild · der ganze
Weg vom Fallenlassen bis zu zwei fertigen Seiten, mit einem Fehlversuch
dazwischen · Abbrechen hängt die Datei vollständig an · das Passwort steht
danach nirgends · Quelltext-Zeugen. Zwei Arme: ohne `onPassword` fallen die
Fragepunkte, ohne das Passwortfeld drei.


## E111 · Das Manifest der Sicherung log — gefunden im Archiv selbst

**19. August 2026.** Nachdem alles grün war, habe ich eine `.redion` nicht
mehr *vorbereitet*, sondern **geschrieben**: den Knopf gedrückt, die
heruntergeladene Datei abgefangen und sie in Node als ZIP aufgemacht, Eintrag
für Eintrag.

Darin stand:

    daten.json     hinweis: „Vollständig: die 4 Datei(en) liegen im
                             Ordner „dateien" desselben Archivs."
                   fehlt:   []

    tatsächlich im Archiv:   dateien/klausur.pdf
                             dateien/notizen.txt

**Zwei von vier.** Die beiden fehlenden waren die gerasterten Seitenbilder,
die E103 mit Absicht weglässt — und das Manifest wusste davon nichts:
`exportVorbereiten` zählte `all('dateien')`, den ganzen Bestand, ohne den
Filter, den `sicherungSpeichern` daneben anwendet.

CLAUDE.md §52.10 sagt dazu genau einen Satz, und er ist der Grund, warum
dieser Eintrag existiert:

> Eine Sicherung, die nicht sagt, was sie auslässt, ist die gefährlichste
> Sorte — man merkt es erst, wenn man sie braucht.

Die Sicherung war inhaltlich in Ordnung: Original, Marken, Suchtext, alles
darin, und die Bilder rechenbar. Falsch war nur der Zettel darauf.

**Und wie schwer wiegt das?** Drei Gegenleser haben unabhängig widersprochen,
das sei kein Datenverlust, und sie haben recht. `enthaelt` und `fehlt` sind
laut §52.10 **Fächernamen**, keine Dateilisten — und die Fächer `dateien` und
`stuecke` sind wirklich im Archiv. `fehlt: []` ist in der Sprache des Feldes
also richtig. Auch löst der Satz nichts aus: `anhaengeEinspielen` entscheidet
nach `dateien.json`, nicht nach `hinweis`. Und test180 fährt den ganzen Ring
(sichern, alles löschen, einspielen, zurückholen) als **gewolltes** Verhalten
ab.

Bleibt: eine Zahl, die an zwei Stellen verschieden ausfällt — der Toast vor
dem Sichern sagte 61, der danach 1. Das ist kein Verlust, sondern eine
Meldung, die beruhigt, wo sie es nicht soll. Sie gehört gerichtet, und sie
ist es; als Priorität-1-Fall verkaufen sollte man sie nicht.

### Was jetzt darin steht

    hinweis: „Vollständig: die 2 Datei(en) liegen im Ordner „dateien"
              desselben Archivs. 2 gerasterte Seitenbilder sind bewusst
              NICHT dabei: sie entstehen aus den Originalen neu — in
              Redion über den Knopf „Aus dem Original zurückholen" auf
              der leeren Seite."

    abgeleitetAusgelassen: 2

Der Satz sagt, was fehlt **und wie man es zurückbekommt**. Die Zahl daneben
ist für Maschinen: wer ein `.redion` ohne Redion aufmacht, soll nachrechnen
können, statt einen deutschen Satz zu lesen.

### Warum kein Prüflauf das sehen konnte

`test177` §5 prüft, welche Datei-Sätze die Sicherung mitnehmen **würde** — es
liest dieselbe gefilterte Liste, die `sicherungSpeichern` liest. Das ist
richtig, und es hat einen blinden Fleck: es prüft eine **Absicht**, kein
Archiv. Das Manifest entsteht aber woanders, in `exportAll`, aus einer
anderen Zahl.

`test185` drückt deshalb den Knopf, fängt den Download ab und liest das ZIP —
und zwar **nicht** mit Redions eigenem `Austausch.zipLesen`. Ein Archiv mit
dem Werkzeug zu prüfen, das es geschrieben hat, prüft die beiden gegen sich
selbst; ein Fehler, den beide teilen, bleibt unsichtbar. Fünfzig Zeilen lesen
das zentrale Verzeichnis nach der ZIP-Festlegung.

Zwei Punkte daraus sind über diesen Fall hinaus nützlich: **zu jedem Satz in
`dateien.json` müssen Bytes im Archiv liegen**, und **zu jeder Datei im
Archiv ein Satz**. Beides zusammen schliesst die ganze Klasse aus, zu der
dieser Fehler gehört.

### Die Lehre

Bei E103 habe ich geschrieben, eine Sicherung müsse sagen, was sie auslässt —
und dann eine gebaut, die es nicht tat. Der Satz stand in der Doku, die
Prüfung stand daneben, und beide sahen an derselben Stelle vorbei.

**Ein Prüflauf, der die Absicht liest, prüft nicht das Ergebnis.** Wo es ein
Artefakt gibt — eine Datei, ein Archiv, ein Druckdokument —, muss die Prüfung
das Artefakt aufmachen.

**Geprüft** (test185, 29 Punkte): das Archiv ist ein ZIP mit genau vier
Einträgen · Original und Anhang byteweise gleich · kein Seitenbild darin ·
der Hinweis nennt die Zahl, die wirklich im Archiv liegt, sagt was fehlt und
wie man es zurückholt · `dateien.json` und das Archiv decken sich in beide
Richtungen · und alles, was zum Zurückholen nötig ist (Original, Nummer,
Masse, Suchtext), steht in `daten.json`. Ein Arm: zählt das Manifest wieder
den ganzen Bestand, fallen drei Punkte.


## E112 · Ein Dateiname ist kein HTML — drei Löcher aus derselben Familie

**19. August 2026.** E110 gab einem Dialog zum ersten Mal FREMDEN Text: den
Namen der Datei, die jemand hereingezogen hat.

```
Dialog.frage('Passwort für „' + datei.name + '"', '', 'passwort')
```

`Dialog.wahl`, fünfzig Zeilen tiefer in derselben Datei, escapte seinen
Titel. `Dialog.frage` tat es nicht — sie setzte ihn roh ins `innerHTML`.

Nachgestellt, nicht vermutet. Eine Datei mit dem Namen

    <img src=x onerror="window.__geknackt=1">.pdf

hereinziehen, warten, bis nach dem Passwort gefragt wird:

    { geknackt: true, bilderImDialog: 1 }

Das Bild lädt nie, also feuert `onerror` von selbst. Kein Klick, kein Zutun.
§19 verbietet genau das, und die Lücke sass nicht im Aufrufer, sondern im
Dialog.

**Nachtrag, und er macht die Sache schlimmer statt besser.** Beim Gegenlesen
dieses Eintrags hiess es hier zuerst, die Lücke sei „jahrelang folgenlos"
gewesen, weil jeder Aufrufer eine feste Zeichenkette übergeben habe. Das ist
falsch, und ich habe es nachgesehen statt es zu glauben. `UI.frage` reicht
nur durch (`ui.ts:36`), und vor E110 hingen daran schon:

```txt
faden.ts:37     'Kommentar zu „' + zitat.slice(0, 40) + '"'
                — markierter Text aus dem Editor
faden.ts:70     'Antwort auf „' + f.komm.text.slice(0, 40) + '"'
                — der Text eines fremden Kommentars
steuerung.ts:1124  'Welcher Wert für „' + coll.schema[kk].name + '"?'
                — ein Spaltenname
steuerung.ts:5580  `${def.name} ${ops[0]} …`
```

Wer `<img src=x onerror=…>` als Spaltennamen tippt, braucht dafür keine
Datei über den Umweg USB-Stick. E110 war nicht der erste fremde Text, nur
der auffälligste — und der, bei dem es endlich jemandem aufgefallen ist.

Das ändert an der Reparatur nichts (sie sitzt in `frage` und deckt alle
Aufrufer ab), aber es ändert, was hier stehen darf. Eine Lücke kleiner zu
schreiben, als sie war, ist dieselbe Art Fehler wie ein Manifest, das
„vollständig" behauptet.

### Eine Escape-Funktion, ganz oben, für alle

Die Reparatur ist nicht „auch in `frage` escapen". Zwei Kopien derselben
Funktion in einer Datei sind der Grund, warum eine von beiden irgendwann
fehlt. Also: eine, im Modulkopf, mit allen fünf Ersetzungen aus §19 — und
`wahl` benutzt sie mit.

Das `'` gehört dazu, obwohl es im Elementinhalt harmlos ist. Derselbe Text
landet nebenan in einem Attribut, und eine Escape-Funktion, die je nach
Fundort etwas anderes tut, ist keine.

### Und dann habe ich nachgesehen, wo noch

Ein bestätigtes Loch ist selten allein — es ist ein Muster, und das Muster
hier heisst: **etwas, das früher immer aus eigener Hand kam, kommt jetzt aus
fremder.** Zwei weitere Stellen aus derselben Woche:

**Drucken setzte die Bild-Adresse roh ins `src`.** Die Folie daneben tut seit
E109 `esc(adr)`, der Druck tat es nicht — eine Zeile Unterschied, keine
Absicht. Die Daten-Adresse eines Seitenbildes trägt ihren MIME-Teil wörtlich
aus dem Datei-Satz:

    data:image/png;base64,…              so soll es sein
    data:image/png" onerror="…" x=";…    so steht es da, wenn der Satz das sagt

Und der Satz sagt, was in `dateien.json` stand — bei einer eingespielten
`.redion` also, was der Absender hineingeschrieben hat. Der Blob-Bauer lässt
das durch: er verwirft nur Zeichen ausserhalb U+0020–U+007E, und das
Anführungszeichen gehört nicht dazu. Gemessen im Druckrahmen: das Bild trug
`src`, `alt`, **`onerror`** und `x`, und der Handler lief.

**Die Seitenzahl in der Werkzeugleiste war keine Zahl.** `Marken.leiste`
setzt ihren Zusatz per `innerHTML`; der Zusatz der PDF-Seite baute `block.nr`
sorgfältig über `Number()` ab und hängte `block.vonSeiten` roh daneben. Beim
eigenen Einlesen ist das `doc.numPages` und harmlos; aus einer eingespielten
Sicherung ist es, was dort steht. Hier hilft kein Escape, sondern die
richtige Frage: eine Zahl kann nichts sein ausser einer Zahl.

### Was daran allgemein ist

Alle drei sind derselbe Fehler in drei Kleidern, und keiner davon war eine
Unachtsamkeit beim Schreiben — jeder entstand, als sich die **Herkunft** des
Wertes änderte, ohne dass die Stelle, die ihn ausgibt, davon erfuhr:

| Wert | war früher | ist jetzt |
|---|---|---|
| Dialogtitel | feste Zeichenkette im Code | Name einer fremden Datei |
| Bild-Adresse | selbst gerastert, MIME selbst gesetzt | MIME aus `dateien.json` |
| `vonSeiten` | `doc.numPages` aus pdf.js | Feld eines eingespielten Blocks |

Deshalb prüft `test186` nicht die drei Wege, sondern die drei **Löcher**: den
Dialog mit vier Angriffszeichenketten in jedem Feld, den Druckrahmen mit
einem echt vergifteten Datei-Satz, die Leiste mit einem vergifteten Block.
Wer nur den Aufrufer prüft, hat beim nächsten Aufrufer dasselbe Loch.

Ein Nebenbefund über Prüfungen: der erste Angriff im Druckrahmen war
wirkungslos, weil `;base64,AQIDBA==` hinten an den Handler geriet und ihn zum
Syntaxfehler machte — grün, aber aus dem falschen Grund. Erst der Angriff,
der diesen Schwanz mit einem letzten Attribut auffängt, führte wirklich Code
aus. **Wer die Probe leichter macht als die Wirklichkeit, prüft nichts.**

Ebenso ein Quelltext-Zeuge, der `class="fh">${esc(titel)}` bloss *suchte*:
er fand die Stelle in `wahl` auch dann noch, wenn die in `frage` daneben roh
dastand. Er zählt jetzt — beide müssen es sein, keiner darf roh sein.

**Geprüft** (test186, 27 Punkte): der echte Weg mit einer bösartig benannten
Datei · beide Dialoge mit vier Angriffszeichenketten in Titel, Vorgabe, Text
und Knopfbeschriftung · der Hinweisbalken daneben · der Druckrahmen mit
einem Datei-Satz, dessen MIME-Typ aus dem Attribut ausbricht · die Leiste mit
einem Block, dessen `vonSeiten` HTML ist · dazu Quelltext-Zeugen, dass es
genau EINE Escape-Funktion gibt und keine Einsetzung an ihr vorbeigeht. Drei
Arme, jeder einzeln nachgewiesen — und in jedem lief der Angriff wirklich:
ohne den Escape im Dialog fallen sieben Punkte (`__geknackt=1`), ohne den im
Druck vier (`__druck=1`), ohne `Number(vonSeiten)` vier (`__leiste=1`).


## E113 · „Quelltext ansehen" war ein Löschknopf

**19. August 2026.** `ausMarkdown` leert die Seite und baut sie aus dem Text
neu auf. Gerettet wurden dabei vier Blockarten, namentlich:

```js
if (['database','whiteboard','chart','table'].includes(b.type))
  alteDbs[b.id] = Store.baum(b.id);
Store.kinderLeeren(p.id);
```

Alles andere fiel durch. Gemessen an einer Schulaufgabe — Spalten, PDF-Seite
mit Strichen, A4-Blatt mit Strichen und Antworttext, Rechenblatt:

```txt
vorher   13 Blöcke · 1 PDF-Seite · 1 Blatt · 3 Spalten · 2 Striche
nachher   7 Blöcke · 0           · 0       · 0         · 0
```

Ein Klick auf „Übernehmen", und die Klausur ist weg. Der Kopfkommentar
derselben Funktion hat den Fall sogar vorhergesagt:

> Ohne das wäre „Quelltext ansehen und schliessen" ein Datenverlust.

Der Satz stand da. Die Liste darunter wurde trotzdem viermal vergessen: bei
`spreadsheet` (E29), bei `columns`/`spalte` (E102), bei `blatt` (E100), bei
`pdfseite` (E103).

### Die Liste steht jetzt andersherum

Nicht „diese vier sind sicher", sondern **„diese vierzehn kann Markdown
wirklich tragen — alles andere bekommt einen Platzhalter"**:

```ts
const MD_TRAEGT = new Set([
  'text', 'h1', 'h2', 'h3', 'todo', 'bullet', 'number',
  'quote', 'callout', 'divider', 'code', 'equation', 'image', 'flashcard'
]);
```

Der Unterschied ist nicht kosmetisch. Eine neue Blockart ist damit **von
sich aus** sicher; sie muss sich das Durchreichen verdienen, statt es
geschenkt zu bekommen und jemanden daran denken zu lassen. Genau daran hat
es viermal gefehlt.

Eine Allowlist, die bei jeder Erweiterung nachgepflegt werden muss, ist
keine Sicherheit, sondern eine Verabredung — und Verabredungen halten in
einem Projekt mit hundertfünfzig Blockarten nicht.

### Manchmal entscheidet nicht die Art, sondern der Block

Drei Blockarten stehen in der Liste und tragen trotzdem je nach Inhalt mehr,
als Markdown abbilden kann:

```txt
image mit dateiId    Die Datei hängt an `dateiId`; `src` ist leer oder eine
                     tote blob:-Adresse (E98). `![](…)` machte daraus ein
                     Bild ohne Datei — sichtbar erst nach dem Neustart.
flashcard mit sr     Der Lernstand ist das Wertvolle an einer Karte. Die
                     Frage abzutippen kostet eine Minute, sechs Monate
                     Wiederholung nicht.
callout mit Zeichen  `> 💡` ist die einzige Form, die zurückgelesen wird —
                     ein 🔥 käme als 💡 wieder.
```

Deshalb fragt der Code `mdTraegt(b)` und nicht `MD_TRAEGT.has(b.type)`.

### Und der Mensch erfährt es vorher

Der Dialog sagt jetzt, was der Knopf tut, statt es hinterher im
Versionsverlauf zu verstecken: dass die `<!--blk:…-->`-Zeilen PDF-Seiten,
Blätter, Tabellen und Spalten sind und unverändert bleiben, solange die
Zeile stehen bleibt — und dass Farben, Schriftgrössen (E101) und die
Verschachtelung von Listen wirklich verloren gehen. Diese drei kann Markdown
nicht tragen, und sie zu Platzhaltern zu machen hiesse, den Knopf
abzuschaffen: von einer Seite mit lauter farbigen Absätzen bliebe kein
lesbarer Text übrig.

Dass vorher eine Fassung gesichert wird, tat Redion schon immer. Nur wusste
es niemand.

**Geprüft** (test187, 41 Punkte): der volle Rundlauf mit dreizehn Blöcken —
Anzahl, Reihenfolge, Art, Striche, Strichfarben, Suchtext, Zellen,
Tabellenzeilen, der Text auf dem Blatt und der Satz im zugeklappten Toggle ·
zweimal hin und her ändert nichts · was Markdown trägt, steht auch als
Markdown da (sonst wäre der Knopf keiner) · nichts sickert aus einem
Platzhalter heraus, gezählt an der Zeilenzahl · die drei bedingten Fälle ·
eine gelöschte Platzhalter-Zeile löscht wirklich · der Hinweis im Dialog und
die tatsächlich gesicherte Fassung. Ein Arm: mit der alten namentlichen
Liste fallen elf Punkte, und aus dreizehn Blöcken werden sieben.


## E114 · `rows` heisst an zwei Blockarten etwas anderes

**19. August 2026, beim Schreiben von test187 gefunden.** Nach dem
Markdown-Rundlauf stand die einfache Tabelle wieder da — leer.

`Store.baum` hatte ihre Zellen korrekt eingesammelt. `Store.baumEinfuegen`
warf sie weg:

```js
delete patch.id; delete patch.kinder; delete patch.collection;
delete patch.views; delete patch.rows; delete patch.content;
                            ^^^^^^^^^
```

Das `delete` hat einen guten Grund — nur einen anderen. An einer
**Datenbank** sind `rows` die Zeilen-Blöcke, die `baum` daneben eingesammelt
hat; die werden zwanzig Zeilen tiefer einzeln neu angelegt, und der alte
Abdruck darf nicht am Block hängen bleiben, sonst stünden dieselben Zeilen
zweimal im Bestand.

Am **`table`-Block** heisst dasselbe Feld etwas ganz anderes: es sind seine
Zellen, und sonst hat er nichts.

```ts
if (k.collection) delete patch.rows;
```

### Wie weit das reichte

`baumEinfuegen` steht an siebzehn Stellen. Jede davon hat eine einfache
Tabelle geleert:

```txt
Blockbefehl „Duplizieren"          editor.ts:2000
Einfügen aus der Zwischenablage    editor.ts:2972
Rückgängig (Strg + Z)              verlauf.ts:63
Eine Fassung wiederherstellen      fassungen.ts:178, 328
Vorlage einfügen                   werkzeuge.ts:452
Seite entsperren                   werkzeuge.ts:696
Zwischen Seiten ziehen             schale.ts:613
```

**Rückgängig** ist der schlimmste davon. Wer eine Tabelle füllte, danach
irgendetwas anderes tat und einmal Strg + Z drückte, bekam die Tabelle leer
zurück — und Strg + Z ist der Griff, zu dem man greift, WEIL man etwas
retten will.

Gemeldet hat es nichts. Der Block stand ja noch da.

### Warum es keine Prüfung sah

Die Tabellen-Prüfungen bauen ihre Tabelle, füllen sie und lesen sie zurück —
alles am selben Block. Der Fehler sitzt aber im **Kopieren** des Blocks, und
kopiert wird ein Block nur in Wegen, die niemand mit „Tabelle" verbunden
hat: Rückgängig, Vorlage, Fassung.

Der wiederkehrende Befund, wieder einmal: nicht die Funktion war ungeprüft,
sondern die Verdrahtung (E93).

**Geprüft** (test188, 21 Punkte): Verdoppeln · Rückgängig · Fassung
wiederherstellen · Vorlage einfügen, jeweils über den echten Weg und nicht
über `baumEinfuegen` direkt · und §5 in die Gegenrichtung: eine verdoppelte
**Datenbank** hat zwei echte Zeilen, zwei getrennte Sammlungen und keinen
toten Zeilen-Abdruck am Block. Zwei Arme: mit dem unbedingten `delete`
fallen sechs Punkte über vier verschiedene Wege, und wird gar nicht mehr
gelöscht, fällt der Datenbank-Punkt.


## E115 · Wer merkt, wann eine Zeichenschicht aufhört zu leben

**19. August 2026.** Zwei Fehler in `Marken.schicht`, und beide hatten
dieselbe Ursache: niemand merkte, wann eine Schicht abgehängt wurde.

### Der eine: Zuhörer, die sich stapeln

```ts
flaeche.addEventListener('pointerup', abschliessen);
flaeche.addEventListener('pointercancel', abschliessen);
flaeche.addEventListener('pointerleave', abschliessen);
addEventListener('pagehide', abschliessen);      // ← am FENSTER
```

Die ersten drei hängen an `flaeche` und gehen mit ihr. Der vierte hängt am
Fenster und bleibt — und `schicht()` wird je Block und bei jedem
Neuzeichnen neu gebaut.

Gemessen: eine Seite mit zwei Blättern und zwei PDF-Seiten, danach
zwanzigmal `App.zeichneSeite()`.

```txt
pagehide-Anmeldungen   vorher 5   nachher 85
svg.blatt-marken       vorher 4   nachher  4
```

Achtzig Zuhörer auf abgehängten Flächen, jeder mit einer tiefen Kopie von
`block.marken` daran. `abschliessen` ist bei jedem von ihnen zwar sofort
fertig (`if (!laufend) return`), aber gehalten wird der Speicher trotzdem.

### Der andere, und der ist schwerer: ein Strich geht verloren

Zwischen `pointerdown` und `pointerup` steht der laufende Strich **nur** in
der Schliessungsvariablen `laufend` und als Knoten im SVG — nicht in
`marken`, nicht im Speicher. Wird der Block in diesem Moment neu gezeichnet,
ist die alte Fläche abgehängt, der Zeiger-Fang gelöst, und `pointerup`
erreicht niemanden mehr. `abschliessen` läuft nie. Der Strich ist weg.

Und Neuzeichnen kommt **von selbst**:

```txt
PdfEinlesen   zeichnet nach jeder fertig gerechneten Seite neu — während
              man auf dem Notizblatt daneben schreibt. Genau der Aufbau,
              den E104 gebaut hat.
Abgleich      bei jeder fremden Änderung.
Editor        an über dreissig Stellen.
```

Nachgestellt: `pointerdown`, acht `pointermove`, KEIN `pointerup`, dann
`App.zeichneSeite()`. Ergebnis vorher: `marken.length === 0`. Der Strich war
gezogen, sichtbar, und nach dem Neuzeichnen nicht mehr vorhanden.

### Ein Verzeichnis, und beides ist weg

```ts
const lebende = new Set<Lebend>();
```

Jede Schicht meldet sich an. Ein `MutationObserver` meldet, wenn sich am
Dokument etwas ändert; dann wird durchgesehen, welche Fläche nicht mehr
hängt. Deren Strich wird abgeschlossen und **gespeichert**, und der Eintrag
fällt weg. Ist das Verzeichnis leer, hört der Beobachter wieder auf.

Der `pagehide`-Zuhörer steht jetzt einmal ganz oben und gilt für alle. Dazu
`visibilitychange`, weil am Telefon oft nur der kommt.

**Ein Nachtrag beim Prüfen.** Der Strich war nach dem ersten Anlauf zwar
gesichert, aber unsichtbar: die neue Schicht wurde aus dem Stand **vor** dem
Sichern gebaut. `marken.length === 1`, kein `[data-sid]` im Bild. Also
zeichnet der Durchgang einmal neu — aber nur, wenn wirklich etwas gesichert
wurde. Das dreht sich nicht im Kreis: die abgehängten Schichten sind dann
schon aus dem Verzeichnis gestrichen.

**Geprüft** (test189 §1–§2): vier Flächen bleiben vier, und nach zwanzig
Neuzeichnungen ist kein einziger Zuhörer dazugekommen · ein Strich ohne
`pointerup` überlebt das Neuzeichnen, mit allen Punkten, und ist danach auch
wieder zu sehen. Ein Arm: mit dem alten Zuhörer je Schicht steigt die Zahl
auf 85 und der Strich ist vollständig verloren.


## E116 · Der Weg daneben: zweimal geklickt, abgebrochen, lange gewartet

**19. August 2026.** E106 hat „Aus dem Original zurückholen" gebaut, und der
Weg, auf dem alles klappt, war geprüft. Vier Dinge daneben nicht.

### Zwei Klicks, eine Dateileiche

Jede bildlose Seite bekommt einen eigenen Knopf, und jeder Knopf sperrte
bisher nur **sich selbst**. Ein zweiter Klick auf einer anderen Seite
startete einen vollständigen zweiten Lauf über dieselbe Liste. Beide legen
für denselben Block eine Datei ab; danach steht nur die zuletzt geschriebene
in `bildDateiId`.

Die andere bleibt liegen — als fertiger Datei-Satz mit **lebendem**
`blockId`. Und `Dateien.verwaist()` sucht nach Sätzen ohne Block, findet
diesen also grundsätzlich nie. Eine Leiche, die kein Aufräumer je findet.

Gemessen mit zwei gleichzeitigen Aufrufen an einem zweiseitigen PDF:

```txt
ohne Sperre   4 abgeleitete Dateien, davon 2 von keinem Block benutzt
mit Sperre    2 abgeleitete Dateien, davon 0
```

Der Schlüssel der Sperre ist die Kennung des Originals, nicht ein globales
Flag: zwei verschiedene Dokumente dürfen sehr wohl nebeneinander rechnen.

### „Seite 80 von 1"

```ts
melder.textContent = 'Seite ' + n + ' von ' + offen.length + ' …';
```

Links die Seitennummer **im Dokument**, rechts die Anzahl der **noch zu
rechnenden** Seiten. Zwei Zählungen in einem „N von M". Bei einem Skript mit
achtzig Seiten, von dem eine fehlt, stand da „Seite 80 von 1".

### Der Fortschritts-Melder verstummte

```ts
set textContent(v) { if (t.classList.contains('show')) t.textContent = v; }
```

`UI.toast` ist EIN Element mit EINEM Zeitgeber. Ein Fortschritt bittet um
120 000 ms — aber jede fremde Meldung dazwischen setzt den Zeitgeber neu und
nimmt ihre eigenen 2600 ms mit. Danach fehlt `show`, und der Fortschritt ist
für den Rest des Laufs stumm. Genau im langen Lauf, für den er da ist.

Jetzt setzt jede Fortschreibung Text, Sichtbarkeit **und** Uhr neu. Eine
fremde Meldung dazwischen ist kurz zu sehen und wird von der nächsten
Fortschreibung abgelöst, statt sie zu töten.

Das half nebenbei drei weiteren Meldern, die es genauso brauchten: dem
Ablegen grosser Dateien (E99), dem Anhängen aus dem Seitenmenü und dem
ersten Einlesen eines PDFs.

**Und die Gegenprobe war zuerst grün.** Der erste Anlauf setzte die fremde
Meldung und schrieb 50 ms später weiter — da stand `show` noch, und die alte
Fassung tat brav ihren Dienst. Der Fehler beginnt erst, wenn die **fremde**
Uhr abgelaufen ist. Wer die Probe leichter macht als die Wirklichkeit, prüft
nichts (§55.2).

### Scheitert es, bleibt nichts stehen

Der Erfolgsweg zeichnete die Seite neu, der Fehlerweg nicht. Bricht es bei
Seite 40 von 80 ab, sind vierzig Bilder fertig und stehen am Block — sie
erschienen nur nicht. Und der Knopf, über den man es erneut versuchen würde,
stand für immer auf „wird gerechnet …", weil `k.disabled` niemand
zurücksetzte.

Beides erledigt jetzt ein `App.zeichneSeite()` im `catch` und ein
`.then(zurueck, zurueck)` am Knopf.

**Geprüft** (test189 §3–§7, zusammen 32 Punkte mit E115): der Melder
schreibt nach einer fremden Meldung und deren Ablauf weiter · zwei
gleichzeitige Aufrufe erzeugen zwei Seitenbilder und keine Leiche · der
Fortschritt zählt nie höher, als es zu rechnen gibt · der Knopf kommt nach
einem Fehlschlag zurück. Vier Arme, jeder einzeln nachgewiesen.


## E117 · Ein Ausdruck mit einer Grenze, die sich meldet

**19. August 2026.** `bilderSammeln` machte vor dem Drucken aus **jedem**
Seitenbild eine Daten-Adresse und behielt sie alle zugleich — ohne
Obergrenze, ohne Stückelung.

Die Zeichenketten liegen dabei doppelt im Speicher: einmal in der Karte,
einmal im zusammengebauten HTML des Druckrahmens. Base64 legt ein Drittel
obendrauf.

```txt
 80 Seiten à 200 KB    16 MB Bytes  →  21 MB Base64  →  43 MB doppelt
500 Seiten à 200 KB   100 MB Bytes  → 133 MB Base64  → 266 MB doppelt
```

§36 sagt dazu: „Große Dateien nicht vollständig in RAM laden." Ein
gescanntes Skript ist genau der Fall, für den E103 gebaut wurde.

### Warum eine Grenze allein die falsche Hälfte wäre

Ein Ausdruck, in dem stillschweigend die Hälfte der Seiten leer ist, sieht
aus wie ein vollständiger — und man merkt es, wenn man ihn braucht. Das ist
derselbe Fehler wie E111, nur auf Papier.

Also drei Dinge zusammen:

```txt
DRUCK_BILDER_MAX = 40 MB   die Grenze, benannt und an einer Stelle
im Ausdruck                „Seite 2 — dieses Dokument ist für einen
                            Ausdruck am Stück zu gross. Die Striche stehen
                            unten trotzdem; für das Seitenbild drucke das
                            Dokument in Abschnitten."
als Meldung                „1 Seitenbild ist für einen Ausdruck zu gross
                            und bleibt leer — drucke das Dokument in
                            Abschnitten."
```

Der Satz im Ausdruck ist ausdrücklich ein **anderer** als der für ein Bild,
das im Bestand fehlt (E106). Wer eine leere Seite findet, muss wissen,
welche der beiden Lagen vorliegt — die eine löst man mit „Aus dem Original
zurückholen", die andere nicht.

### Was trotzdem mitkommt

Die **Handschrift**. Sie steht als `marken` am Block, geht als SVG in den
Ausdruck und kostet nichts. Sie wegzulassen wäre die eigentliche
Enttäuschung: das Seitenbild hat man notfalls im Original, die eigene
Antwort nicht.

Die Präsentation (E109) bekommt keine Grenze und braucht keine: sie nimmt
`blob:`-Adressen, und deren Bytes hält der Browser ohnehin schon.

**Geprüft** (test190, 18 Punkte): drei Seiten, eine davon zu gross — alle
drei stehen im Ausdruck, zwei tragen ein Bild, die dritte nennt Seitenzahl
und Grund im Klartext und ausdrücklich NICHT den falschen · beide Striche
sind da, auch der auf der Seite ohne Bild · die Meldung nennt die Zahl · und
ein gewöhnlicher Ausdruck aus drei kleinen Seiten bleibt unangetastet, ohne
Warnung. Zwei Arme: ohne Grenze fallen fünf Punkte (die Seite bleibt leer
und behauptet den falschen Grund), mit einer viel zu kleinen Grenze fallen
sechs andere.


## E118 · Drei Wege, die ins Leere führten

**19. August 2026.** Drei Bausteine der letzten Woche funktionierten — auf
dem Weg, auf dem sie gebaut wurden. Der Weg, den ein Mensch geht, war ein
anderer.

Alle drei sind dieselbe Form, und es ist die Form, die dieses Projekt
verfolgt: **eine Stelle wurde erweitert, die Nachbarstelle nicht.**

### `/blatt` gab Papier ohne Zeile

E100 hat `blatt` in `Register.bloecke` eingetragen — damit ist es über das
Slash-Menü erreichbar. `umwandeln` legt ihm aber keine Kinder an, und
`Blatt.zeichne` zeichnete nur vorhandene:

```ts
Store.childrenOf(block.id).forEach((k: any) => {
  inhalt.appendChild(Blocks.render(k, 0));
});
```

Kein `else`. Gemessen, über den echten Weg (`/blatt` tippen, im Menü
klicken):

```txt
kinder                        0
contenteditable im Block      0
.blatt-inhalt                 ""
```

Zum Vergleich derselbe Weg mit `/spalten`: zwei beschreibbare Felder. Man
konnte auf das Blatt **malen und sonst nichts** — bei einer Blockart, deren
Sinn „schreiben UND malen auf demselben Papier" ist.

Alle Wege, die funktionierten, legten das Kind von Hand an: `alsSeiten` tut
es (E104), `test174` tut es. Nur der Weg, den ein Mensch geht, tat es nicht.

Die Spalte daneben löst genau dasselbe seit E102 — und die Reparatur ist
wörtlich ihr Handgriff. Sie sitzt in `Blatt.zeichne` und nicht in
`umwandeln`, weil `umwandeln` nur den Slash-Weg abdeckt: ein kinderloses
Blatt aus einer alten Sicherung bekäme dort nichts.

### Die Suchvorschau nannte volle Seiten leer

`zeigeVorschau` las nur die **direkten** Kinder der Seite. Seit E104 ist
„nebeneinander" die Vorgabe beim PDF-Einlesen, und dann ist das einzige
direkte Kind ein `columns`-Block ohne `text`:

```txt
Store.childrenOf(seite) = [ { type: 'columns', text: '' } ]
                          → '' → „Diese Seite ist noch leer."
```

Über eine ganze Schulaufgabe. Und es ist genau der Satz, den E107 mit
`suchtext` abschaffen wollte — an genau der Anordnung, die Standard ist.

Jetzt steigt die Vorschau hinab, aber nur in das, was selbst nichts zu sagen
hat: `columns`, `columns3`, `spalte`, `blatt`, `toggle`. In einen Textblock
mit Kindern nicht — der hat seinen eigenen Satz, und eine Vorschau ist eine
Vorschau. Die Grenze von vierzehn Zeilen gilt **nach** dem Sammeln, sonst
schnitte sie die Hüllen ab statt der Inhalte; bei einem 80-Seiten-Skript
liegen achtzig `columns`-Blöcke unter der Seite, und der frühe Abbruch ist
der Grund, warum das nichts kostet.

Die Gegenprobe gehört dazu: **eine wirklich leere Seite sagt weiterhin, dass
sie leer ist.** Sonst hätte man den Satz nur abgeschafft statt richtig
gemacht.

### Die Folie kannte nur die neue Spaltenform

```ts
Store.childrenOf(b.id).map(sp =>
  '<div class="folie-spalte">' +
  Store.childrenOf(sp.id).map(k => folieBlock(k, 0)).join('') +
  '</div>')
```

Das nimmt an, jedes Kind eines Spaltenblocks sei eine `spalte`-Hülle. E102
hat diese Hülle eingeführt und den Bestand von davor **ausdrücklich heil
gelassen** — dort ist das Kind selbst die Spalte, und der Editor zeichnet
ihn deshalb weiter (`case 'columns'`: `childrenOf(block.id)` direkt).

Auf der Folie fiel er ersatzlos weg. Gemessen: der Folientext lautete
`VortragNEULINKSNEURECHTS` — der alte Block war spurlos verschwunden, nicht
gemeldet, nur leer. Der Druckweg macht es richtig; die Folie nicht.

Das Bittere daran: zwei Zeilen über der Fundstelle steht der Kommentar, den
E109 für L38 geschrieben hat — „nicht ‚vergessen', sondern ‚an einer Stelle
getan und an der Nachbarstelle nicht'". Derselbe Fehler, eine Ebene tiefer,
im selben Codeblock.

### Woher die drei kamen

Aus einem Gegenlese-Durchgang über E98–E110: 21 Funde aus vier Blickwinkeln,
13 davon haben je drei Skeptiker überlebt. Zehn waren zu dem Zeitpunkt schon
behoben (E111–E117). Diese drei waren neu, und keiner von ihnen wäre einem
Prüflauf aufgefallen, der den Erfolgsfall abfährt — sie sitzen alle am
**Eingang** der jeweiligen Funktion, nicht in ihr.

**Geprüft** (test191, 23 Punkte): `/blatt` wirklich getippt und im Menü
geklickt, dann hineingeschrieben und im Speicher nachgesehen · die Vorschau
bei der Vorgabe-Anordnung, samt Gegenprobe an einer wirklich leeren Seite ·
beide Spaltenformen auf einer Folie, mit dem Nachweis, dass der Editor die
alte noch zeichnet. Drei Arme: ohne den Blatt-Handgriff fallen sechs Punkte
(und es gibt nichts mehr zum Hineinklicken), ohne den Vorschau-Abstieg vier,
ohne die Folien-Fallunterscheidung drei — dort werden die vier Spaltenkästen
übrigens weiterhin gebaut, nur leer, weshalb erst das Zählen der GEFÜLLTEN
die Prüfung überhaupt rot werden lässt (§55.2).


## E119 · Die Frage an jede Blockart — und was sie NICHT beantwortet

**19. August 2026.** E118 hat einen Fehler behoben: `/blatt` legte Papier an,
in das man nicht schreiben konnte. `L41` hat dazu die unangenehme Frage
gestellt — war `blatt` wirklich der einzige?

Es gibt keine Stelle, die sagt, was eine Blockart zum Leben braucht.
`Register.bloecke` sagt, wie sie heisst und wie man sie findet, nicht, ob
sie ohne Kinder bedienbar ist. `spalte` weiss es selbst, `blatt` wusste es
nicht, und gemerkt hätte es niemand.

`test192` ist diese Stelle. Sie legt **jede** über das Slash-Menü
erreichbare Blockart an — heute 66 — und fragt für jede dasselbe.

### Das Ergebnis: keine weitere

Alle 66 in Ordnung. Zwei Kandidaten sahen zuerst nach Fehlern aus und waren
keine:

```txt
divider   0 beschreibbar, 0 Felder, 0 Knöpfe, kein Text — und trotzdem
          richtig: er zeichnet ein echtes `<hr>`, 1 px hoch. Die Prüfung
          sah nur nicht danach.

page      „kein Kasten im Bild" — weil `/page` eine UNTERSEITE anlegt und
          hineinspringt. Gemessen wurde also von der falschen Warte aus.
          Auf der Elternseite steht danach „📄 Ohne Titel", anklickbar, und
          der Klick öffnet die Unterseite wirklich.
```

Beide Male hätte die naheliegende Schlussfolgerung („zwei weitere Fehler")
danebengelegen. Nachgesehen statt geschlossen — dasselbe wie bei E111.

### Und der wichtigere Teil: die erste Fassung der Prüfung taugte nichts

Die Frage lautete zuerst: **„ist der Block ein leeres Rechteck?"** Gemessen
wurde, ob im Kasten irgendetwas steht — ein Feld, ein Knopf, ein Bild, Text.

Dann die Gegenprobe: `blatt` auf den Stand vor E118 zurückgedreht.

```txt
✓ Keine einzige Blockart ist ein leeres Rechteck
```

**Grün.** Das kaputte Blatt war nicht leer — es hatte zwölf Knöpfe und eine
Zeichenfläche. Es hatte nur nichts, in das man schreiben konnte, und genau
darum ging es. Eine Prüfung, die den Fehler nicht findet, gegen den sie
geschrieben wurde, ist keine (§55.2).

Die zweite Frage ist die, die trägt:

> **Hält diese Blockart andere Blöcke? Dann muss sie leer eine Stelle zum
> Hineinschreiben bieten.**

Und „hält Kinder" wird nicht geraten, sondern ausprobiert: ein Textblock
hineingelegt, neu gezeichnet, nachgesehen, ob er im Kasten erscheint. Damit
beantwortet sich die Frage für jede künftige Blockart von selbst, ohne dass
jemand eine Liste pflegt.

Gegen dieselbe Gegenprobe:

```txt
✗ Und jede von ihnen bietet leer eine Stelle zum Schreiben — ist 1, soll 0
      → blatt (edit 0 · knopf 12 · bild 1 · Behälter · „✎Schreiben🖍Malen…")
```

Beim Namen genannt, ohne dass die Prüfung `blatt` kennt.

### Was sie weiterhin nicht beantwortet

Sie prüft, ob man **hineinkommt**. Ob das, was dann passiert, richtig ist,
prüft sie nicht — dafür sind die Suiten je Blockart da. Und sie kennt nur
den Weg über `umwandeln`; eine Blockart, die auf einem anderen Weg entsteht
(`pdfseite`, `spalte`), steht in keinem Register und wird hier nicht
erfasst. Beide Grenzen stehen in L41.

**Geprüft** (test192, 15 Punkte): 66 Blockarten, jede angelegt und
vermessen · keine ist ein leeres Rechteck · jede, die Kinder aufnimmt,
bietet leer eine Schreibstelle · drei Stichproben im Klartext (Blatt,
Trennlinie, Bild) · und `/page` als die eine begründete Ausnahme, samt
Nachweis, dass der Verweis auf der Elternseite wirklich öffnet. Ein Arm:
mit dem Blatt-Stand vor E118 fallen zwei Punkte, und einer davon nennt
`blatt` von selbst.


## E120 · Einrückung ist Struktur

**19. August 2026.** `alsMarkdown` schreibt sie seit jeher —
`'  '.repeat(tiefe)`. `ausMarkdown` warf sie weg: jede Zeile wurde mit
`trim()` beschnitten und mit `Store.addBlock(p.id, …)` direkt unter die Seite
gehängt.

Gemessen an einer dreistufigen Liste:

```txt
- Oben eins                bullet          bullet  Oben eins
  - Darunter A               bullet        bullet  Darunter A
    - Noch tiefer              bullet   →  bullet  Noch tiefer
  - Darunter B               bullet        bullet  Darunter B
- Oben zwei                bullet          bullet  Oben zwei
- [ ] Aufgabe              todo            todo    Aufgabe
  Unteraufgabe               text          text    Unteraufgabe
```

Der Text war da, die Ordnung nicht. Sieben Blöcke nebeneinander auf Ebene
null.

L40 hat das bei E113 ausdrücklich offen gelassen: „dieselbe Funktion bedient
auch den `.md`-Import, und ein zweites Thema in einer Änderung geht gegen
§45." Hier ist es als eigene Änderung.

### Ein Stapel, mehr braucht es nicht

```ts
const stapel: string[] = [p.id];
```

`stapel[0]` ist die Seite. Wer auf Tiefe t schreibt, hängt unter
`stapel[t]` und wird selbst zu `stapel[t+1]`. Zwei Schritte je Ebene, weil
das ist, was `alsMarkdown` schreibt — und ein Tabulator zählt als zwei, weil
Menschen ihn tippen.

Zwei Entscheidungen darin sind Absicht:

**Wer zu tief springt, landet eine Ebene tiefer, nicht im Nichts.** Markdown
erlaubt den Sprung von Ebene 0 auf Ebene 6; `Math.min(…, stapel.length - 1)`
fängt ihn ab. Ein verlorener Block wäre schlimmer als eine Ebene daneben.

**Was über mehrere Zeilen läuft, hängt dort, wo es ANFING.** Ein Codeblock
und eine Tabelle wurden bisher beim Abschluss angelegt — also mit der
Einrückung der Zeile *danach*. Beide merken sich jetzt ihre erste Zeile.

### Der `.md`-Import wird davon besser, nicht schlechter

Das war die Sorge, die die Änderung aufgeschoben hat. Sie hat sich nicht
bestätigt — im Gegenteil: in einer `.md`-Datei aus fremder Hand ist die
Einrückung die **einzige** Strukturangabe, die es gibt. Gemessen an einer
gewöhnlichen Datei:

```txt
- Obst                   →   bullet Obst
  - Äpfel                       bullet Äpfel        (zwei Leerzeichen)
- Gemüse                     bullet Gemüse
    - Karotten                  bullet Karotten     (vier)
	- Zwiebeln                  bullet Zwiebeln     (Tabulator)
1. Erster Schritt            number Erster Schritt
   1. Unterschritt              number Unterschritt (drei)
```

Alle vier Schreibweisen kommen richtig an. `test49` (Obsidian-Import) und
`test66` bleiben unverändert grün.

### Und ein Fehler, den erst die Reparatur sichtbar machte

Ein eingerückter Codeblock behielt seine Einrückung IM CODE:

```txt
- Aufgabe
  ```js
  if (x) {
    tuWas();
  }
  ```
```

`codeText.push(roh)` nahm die Zeile roh, also mit den zwei Leerzeichen des
Zauns. Vor E120 war das selten — ein Codeblock in einem Listenpunkt landete
ohnehin auf Ebene null. Jetzt ist es der Normalfall.

`trim()` wäre die falsche Antwort: die zwei Leerzeichen vor `tuWas()`
gehören dem **Code** und müssen bleiben. Abgezogen wird genau der Einzug des
Zauns, keiner mehr.

Gefunden hat das die eigene Prüfung beim ersten Lauf, nicht ein Mensch und
nicht ein Gegenleser — der einzige Punkt in dieser Suite, der beim Schreiben
rot war.

**Geprüft** (test193, 25 Punkte): der Rundlauf mit einer dreistufigen Liste,
zweimal hintereinander · eine gewöhnliche `.md`-Datei mit zwei, drei, vier
Leerzeichen und einem Tabulator · ein Sprung um sechs Ebenen, der nichts
verliert · Codeblock, Tabelle und Platzhalter an ihrem Platz, mit Inhalt,
Sprache und Zeilen · Quelltext-Zeugen, darunter „keine Zeile hängt sich mehr
blind an die Seite" (gezählt: 13 solcher Stellen vorher, 0 danach). Ein Arm:
mit dem alten Zurückleser fallen sechzehn Punkte.
## E121 · Ein Stück-Lesefehler ist keine leere Datei

> **Zur Nummer:** Dieser Eintrag hiess auf dem Laptop E98 und ist am
> 15. August entstanden. In der Cloud lief zur selben Zeit ein zweiter
> Strang, der die 98 ebenfalls vergab („Abgelegte Dateien überleben den
> Browser-Neustart", 19. August). Beim Zusammenführen der beiden Stände
> hat dieser hier die nächste freie Nummer bekommen, weil der andere
> bereits veröffentlicht und von sechzehn Commits und mehreren Prüfläufen
> in Bezug genommen war. Am Inhalt ändert das nichts.


**Datum:** 15. August 2026 · **Status:** Beschlossen · **Lücke:** L35 geschlossen

E71 zog die Grenze schon für ganze Fächer: „nicht lesbar" darf nie als
„leer" weiterlaufen. Bei `stueckeVon` blieb aber genau diese Verwechslung
stehen. Sowohl der Fehler der IndexedDB-Anfrage als auch ein synchroner
Fehler antworteten mit `[]`. Dadurch konnte `alsBlob` „nicht gefunden"
melden, die Sicherung einen falschen Erfolg herunterladen, der Abgleich
ohne Inhalt weiterlaufen und `weg` den Dateisatz entfernen, obwohl die
Stücke gar nicht gelesen und deshalb nicht gelöscht worden waren.

`stueckeVon` lehnt beide Fehlerwege jetzt ab. `[]` bleibt nur die ehrliche
Antwort, wenn die Stück-Ablage nicht existiert oder eine erfolgreiche
Abfrage wirklich null Stücke findet. Der Fehler trägt einen kurzen Satz
für den Menschen sowie Code und technische Ursache. Der Reporter erhält
nur Dateikennung und Ursache — weder Dateiname noch Inhalt.

Die vorhandenen Sicherungs- und Abgleichsgrenzen behandeln die Ablehnung
bereits als Misserfolg. Das Dateifenster fängt Herunterladen, Löschen und
Aufräumen nun ebenfalls ab: Eine Erfolgsmeldung kommt erst nach dem echten
Erfolg; bei einem Lesefehler bleibt der Dateisatz stehen und der Mensch
erfährt, dass der Vorgang abgebrochen wurde.

**Geprüft** (`test144` §6, insgesamt 42 Punkte): echte Datei und echte
Produktwege durch einen absichtlich fehlernden `datei`-Index — direktes
Lesen, `alsBlob`, Bestätigen, `.redion`-Sicherung, Datei-Abgleich und der
sichtbare Löschknopf. Ein echter Dateisatz mit null Stücken bleibt die
Gegenklasse. Nach dem Fehler sind Metadaten, Stückzahl und Bytes
unverändert; der Reporter enthält die technische Ursache, aber keinen
privaten Dateinamen.

Die Gegenprobe setzte ausschliesslich die beiden Fehlerzweige wieder auf
`ok2([])`: 17 der 42 Punkte wurden rot, darunter falscher Download,
fehlender Sync-Fehler und gelöschter Dateisatz. Nach Wiederherstellung
waren 42/42 wieder grün. Es gibt keine Schemaänderung und keine
Datenmigration.

## E122 · Das verschlüsselte Paket angeschlossen — und wieder abgeklemmt

**22. August 2026.** Beim Zusammenführen der beiden Arbeitsstände kam aus
`krypto.ts` eine fertige Fassung 2 des verschlüsselten `.redion` mit: 460
Zeilen, zufälliger Datenschlüssel, Schlüsselhülle über PBKDF2, AES-GCM je
Eintrag mit AAD, Anhänge in Stücken, Passwortwechsel ohne Neuverschlüsseln.
Sorgfältig geschrieben.

Und von aussen nicht erreichbar: die Einstiegspunkte standen nicht im
`return`-Objekt, es gab keinen Prüflauf, und zwei Typstellen waren falsch.

Redur hat entschieden, es fertig zu machen statt einzulagern. Das war die
richtige Entscheidung — nicht weil es geklappt hat, sondern weil es das
Gegenteil gezeigt hat.

### Was jetzt nachweislich funktioniert

```txt
Das Paket entsteht         Fassung 2, 310 000 Runden, drei Eintragsarten
Es ist wirklich dicht      weder Seitentitel noch Dateiname stehen im
                           Klartext im Archiv — nachgesehen im Byte-Strom
Falsches Passwort          abgelehnt, und ohne zu sagen, WAS falsch war
Verändertes Manifest       fliegt auf (der Kern ist mitverschlüsselt)
Fehlender Eintrag          fliegt auf
Kein Passwort              wird gar nicht erst gebaut
Nach allen Fehlversuchen   steht der Bestand unverändert da
Passwortwechsel            geht, ohne die Nutzdaten anzufassen — und ein
                           schon herausgegebenes Paket bleibt mit dem alten
                           Passwort lesbar, weil man eine Datei, die jemand
                           hat, nicht widerrufen kann
```

### Und was nicht

**Das Zurückholen verliert den Anhang.** Gemessen, mehrfach und schwankend:
gleich nach dem Einspielen findet `dateiAlle()` den Datei-Satz, während
`dateiHolen()` ihn nicht findet; mit 600 ms Atempause ist gar keine Datei
mehr da; die Stückzahl ist mal 0, mal 1.

Das Schwanken ist die Unterschrift eines Wettlaufs. `Store.importAll` ist es
nicht — seine Transaktion umfasst `blocks`, `collections`, `views`, `meta`,
`versions` und `suchindex`, aber weder `dateien` noch `stuecke`. Ein
`Store.flush()` zwischen Bestand und Anhängen hat nicht geholfen.

### Die Entscheidung

**Der Code bleibt, der Knopf nicht.** Die Karte im Sicherheitsdialog war
schon geschrieben und ist wieder herausgenommen. Ein Wiederherstellen, das
den Anhang STILL verliert, ist schlimmer als eines, das gar nicht erst
angeboten wird — §46, Priorität 1.

`test199` §3 hält das fest, und zwar als Prüfung, nicht als Notiz: solange
der Fehler steht, darf im Dialog kein Knopf dafür sein. Wer die Funktion
später anschliesst, ohne den Wettlauf zu beheben, wird rot.

Die Einstiegspunkte bleiben im `return`-Objekt. Ohne sie liesse sich die
Funktion nicht prüfen, und ungeprüfter Code ist genau der Zustand, aus dem
sie gerade kommt.

### Die Lehre

Fertig aussehender Code ist kein fertiger Code. Diese 460 Zeilen lasen sich
besser als vieles, was heute läuft — die Kommentare erklären sogar, warum
`paketOeffnen` nichts schreibt, damit ein falsches Passwort keinen halben
Import hinterlässt. Genau dieser Sorgfalt hätte man geglaubt.

Was sie nie hatte, war ein einziger Aufruf. Und der erste Aufruf hat den
Fehler in drei Minuten gefunden.

**Geprüft** (test199, 36 Punkte): die Einstiegspunkte sind erreichbar · das
Paket ist dicht, im Byte-Strom nachgesehen · alle fünf Fehlerwege lehnen ab,
ohne etwas anzufassen · der Passwortwechsel · und §3 als Wächter, dass die
Funktion unerreichbar bleibt, solange L42 offen ist.


## E123 · Der Wettlauf beim Zurückholen — abgelöste Arbeit muss abwartbar sein

**22. August 2026.** L42 sagte: das verschlüsselte Paket verliert beim
Zurückholen den Anhang, und der Verdacht lag auf der Aufräumschleife in
`geoeffnetesPaketEinspielen`. Beides war zu kurz gedacht. Der Fehler saß
tiefer, betraf auch die gewöhnliche `.redion`-Sicherung, die jeder benutzen
kann — und ein `Store.flush()`, das dagegen helfen sollte, half messbar
nichts.

### Was wirklich los war

`Store.purgeBlock` kehrt sofort zurück und löscht die Anhänge danach in einer
abgelösten Aufgabe:

```js
purgeBlock = (id) => {
  …
  (async () => {                       // ← niemand hält das fest
    await Promise.all(geloescht);
    for (const x of gesammelt) await purgeAnhaenge(x);
  })().catch(…);
};
```

Das ist richtig so — bei einer Seite mit fünfhundert Blöcken darf der
Bildschirm nicht stehen bleiben. Nur war auf diese Aufgabe nicht zu warten:

```txt
Seite gelöscht           purgeBlock kehrt zurück, das Löschen läuft noch
Sicherung zurückgeholt   die Blöcke stehen wieder, der Anhang wird frisch
                         geschrieben
… Augenblick später      das alte Löschen kommt an und nimmt den NEUEN
                         Anhang mit
```

Und zwar zielsicher, nicht zufällig. `purgeAnhaenge` liest den Block aus dem
Zwischenspeicher:

```js
const b = cache.blocks[id];
[hinweis.datei, b && b.dateiId, b && b.datei].forEach(x => { if (x) kennungen.add(x); });
```

Nach dem Einspielen ist `cache.blocks` der EINGESPIELTE Bestand. Das Löschen
findet also genau die Kennung, die gerade zurückgeholt wurde, und trifft sie.

### Gemessen

Der Anhang wurde abgelegt, wie der Editor es tut — Block zuerst, dann
`Dateien.ablegen(datei, { blockId })`; so machen es alle sechs echten
Aufrufer. Bestand: 1972 Blöcke, also der Stand, mit dem Redion startet.

```txt
                     ohne die Behebung        mit der Behebung
.redion              dateien=0 stuecke=0      dateien=1 stuecke=1
                     alsBlob=0   → 3 von 3    alsBlob=900 → 3 von 3
Paket (Fassung 2)    dasselbe                 dasselbe
```

### Die Behebung

`indexdb.ts` merkt sich jede abgelöste Arbeit, und `settled()` wartet darauf:

```ts
const unterwegs = new Set<Promise<unknown>>();
const abloesen = <T,>(p: Promise<T>): Promise<T> => { … };
const settled = async (): Promise<void> => {
  for (let runde = 0; runde < 20 && unterwegs.size; runde++)
    await Promise.all([...unterwegs].map(p => p.catch(() => {})));
};
```

In Runden, weil eine abgelöste Arbeit die nächste anstossen kann; nach zwanzig
Runden ist Schluss, denn ein Fehler, der sich selbst nachlegt, darf die App
nicht anhalten. `importAll` wartet **vorn und hinten**: vorn, damit ein
Löschen von vorhin sein eigenes Zeug wegräumt und nicht das neue; hinten, weil
`notify('import')` selbst noch eines anstossen kann. Damit ist JEDER Weg
gedeckt, der über `importAll` läuft — `.json`, `.redion`, das verschlüsselte
Paket und jeder künftige.

### Warum es niemand gesehen hat

Zwei Bedingungen müssen zusammenkommen, und beide fehlen in einem
aufgeräumten Prüflauf:

1. Das endgültige Löschen muss unmittelbar vor dem Zurückholen stehen.
2. Der Bestand muss GROSS sein. Bei drei Blöcken ist die Löschkette durch,
   bevor das Zurückholen anfängt — dann ist alles grün, obwohl der Fehler
   dasteht.

Die erste Fassung von test200 leerte den Bestand vorher und blieb in der
Gegenprobe grün: nur die Quellenzeugen schlugen an, die Rundläufe nicht.
Genau davor warnt §55.2 — eine Prüfung, die nicht rot werden KANN, ist keine.
Deshalb leert `frisch` in test200 den Bestand nicht.

Und deshalb hat test100 es jahrelang übersehen, obwohl es genau diesen Weg
prüft: es fängt jedes Mal aufgeräumt an.

### Damit ist L42 geschlossen

Das verschlüsselte Paket steht jetzt im Sicherheitsdialog — zwei Knöpfe,
eigenes Passwortfeld, `.redion` als Dateiwähler. Zurückholen fragt vorher und
sichert den jetzigen Stand als Netz unter dem Seil. `paketOeffnen`
entschlüsselt und prüft ALLES, bevor die Frage überhaupt erscheint: ein
falsches Passwort scheitert, während der Bestand noch unangetastet ist.

**Geprüft** (test200, 29 Punkte; Gegenprobe mit zurückgenommener Behebung:
10 rot): dass `settled()` wirklich wartet · der `.redion`-Rundlauf mit
Byte-Vergleich · derselbe mit dem verschlüsselten Paket · die Knöpfe im
Dialog · und fünf Quellenzeugen. test199 §3 ist von „darf niemand anklicken"
auf einen echten Rundlauf umgestellt.


## E124 · Drei Suchen, zwei Antworten

**22. August 2026.** Beim Zusammenführen der beiden Arbeitsstände kam das
Suchfenster mit der Abfragesprache und dem inkrementellen Suchindex vom
Laptop, der durchsuchbare PDF-Text (E107) aus der Cloud-Arbeit. Beide für
sich in Ordnung — zusammen ergaben sie das hier:

```txt
Store.search('Pythagoras')     findet die Seite
das Suchfenster                „Nichts gefunden"
```

Eine PDF-Seite hat keinen `text` — sie ist ein Bild; ihr Wortlaut steht seit
E107 in `suchtext`. `Store.search` liest beide Felder. Der Suchindex in
`kontext.ts` und der Weg ohne Index in `schale.ts` lasen nur `text`.

Zwei Suchen mit zwei Antworten sind schlimmer als eine schlechte: wer sein
eingelesenes Skript nicht findet, glaubt, es sei nicht da.

Beide Wege lesen jetzt `text` UND `suchtext`, und `suchtext` steht auch in der
Signatur des Index — sonst merkt er nicht, dass eine PDF-Seite ihren Text
nachgetragen bekommen hat (das passiert beim Öffnen alter Dokumente).

**Geprüft** (test181): §5 sieht am Bild nach, dass das Suchfenster die Seiten
aufzählt — dieser Abschnitt war rot und ist der eigentliche Wächter. Dazu drei
Quellenzeugen, einer je Suchweg.


## E125 · Ink V2 erweitert den Dokumentraum, nicht die Zahl der Zeichenmaschinen

**22. August 2026.** A4-Blatt und PDF-Seite besassen bereits dieselbe
Markenschicht und stabile Blattkoordinaten. Die allgemeine Zeichenfläche
kannte zwar Formen, speicherte aber rohe Bildschirmpixel und hatte nur ein
`pop()`-Rückgängig. Sie zu importieren hätte zwei unvereinbare Wahrheiten
über dieselbe Geometrie geschaffen.

### Die Entscheidung

`src/core/ink/geometry.ts` ist ein kleiner DOM-freier Kern für Punkte,
Begrenzungen, Treffer, Verschieben, geglättete SVG-Pfade und
Ramer-Douglas-Peucker-Reduktion. Die bestehende `Marken`-Schicht verwendet
ihn für Stift, transparenten Marker, Linie, Pfeil, Rechteck, Ellipse und
Text. Ein PDF wird nicht ins Whiteboard umgewandelt; spätere Flächen dürfen
den neutralen Kern verwenden, nicht die Dokumentdaten übernehmen.

Neue Druckwerte stehen getrennt als `pressure` neben den unveränderten
zweidimensionalen `pts`. Alte Sicherungen bleiben damit ohne Migration
lesbar. Während `pointermove` wird nur der bestehende SVG-Knoten verändert;
Store und Verlauf werden erst beim Abschluss einer Aktion geschrieben.
Auswahl, Mehrfachverschieben, Löschen und Textänderung sichern jeweils einen
Vorher-Stand. Undo/Redo ist damit aktionsbasiert und auf 100 Schritte
begrenzt.

### Warum keine Sonderablage

Marken bleiben additive Felder des Blocks. Der vorhandene Store, `.redion`,
verschlüsselte Pakete und der Drei-Wege-Abgleich transportieren sie bereits.
Eine Ink-IndexedDB oder ein eigenes Sicherungsformat hätte nur einen zweiten
Fehlerweg geschaffen.

**Geprüft** (`test201`, Suite 167, 32 Punkte): Rückwärtskompatibilität,
Markertransparenz, alle Formen, sicherer Text, Druckwerte, Coalesced Events,
Punktreduktion, Auswahl/Mehrfachauswahl, Bewegung, Löschen, Undo/Redo,
390×844, 1366×768, 1440×900, Druck, Sicherungsrundlauf und Sync. Die
bestehenden Suiten 174, 177, 178, 180, 182 und 189 bleiben grün.

## E126 · Dokumentmodus ist eine Ansicht, kein zweites Dokument

**22. August 2026.** Der Arbeitsraum verwendet dieselben `pdfseite`- und
`blatt`-Blöcke, auch innerhalb bestehender Spalten. Nur die gewählte Seite
wird vollständig gerendert; Miniaturen lesen vorhandene Seitenbilder. Desktop
zeigt drei Spalten, kleine Laptops einen Inspector-Drawer und Telefone
Bottom-Sheets mit 44-px-Zielen. Deep Links wählen den Block vor dem Rendern.

## E127 · Lernquellen und Wiederholungen bleiben Blockdaten

**22. August 2026.** Notizen, Karten, Aufgaben, kleine Ausschnitte und Links
tragen einen additiven `sourceRef` zur echten PDF-/Blatt-/Textquelle. Der
exakte Sprung verwendet die Blockkennung. Cloze und Tagesrunde arbeiten auf
normalen Flashcards. SM-2 bleibt unverändert; Review-Ereignisse erhalten
eindeutige IDs für den Drei-Wege-Abgleich. FSRS wird nicht still eingeführt.

## E128 · Neue Audioaufnahmen sind Anhänge, keine Zeichenketten

**22. August 2026.** MediaRecorder-Blobs laufen durch den vorhandenen
Chunk-Speicher und werden per stabiler `dateiId` referenziert. Alte DataURLs
bleiben lesbar. Eine Zeitmarke ist ein normaler Textblock mit `audioRef`.
Optionale Transkription sendet erst nach Knopfdruck und sichtbarer Zustimmung.

## E129 · Ein Resolver für Titel, Aliasse und Vault-Pfade

**22. August 2026.** Suche, Wikilinks, Backlinks, Picker, Graph und Vault
verwenden dieselbe Auflösung. Nur ein eindeutiger Treffer wird geöffnet;
Kollisionen liefern Kandidaten. Obsidian-Roundtrips tragen `redion-id`, Pfad
und Aliasse und mergen niemals allein nach Seitentitel.

## E130 · Erkennung ist ein Derivat mit Provenienz

**22. August 2026.** Kamera und Dateien werden zuerst unverändert im normalen
Anhangspeicher abgelegt. OCR ist ein optionaler localhost-Adapter mit
Zustimmung, Größen-/Pixelgrenzen und Zeitlimit. Erkanntes überschreibt weder
PDF-Text noch Bild noch Ink, sondern speichert Text, Sprache, Engine, Version,
Vertrauen und Region zusätzlich. Handschrift-zu-Text/Formel ist ein bestätigter
Vorschlag; Ink bleibt erhalten.

## E131 · Ausbildung ist Vorlage plus bestehende Bibliothek

**22. August 2026.** Fächer, Prüfungen, Noten, Berichtsheft, Lernmaterial und
Capture-Eingang sind normale Seiten/Datenbanken. Die Vorlage ist idempotent
und additiv, ohne Person, Schule oder Notenskala fest einzubauen. Der
Elektrorechner enthält nur normfreie Mathematik. Fragen sind ein validiertes,
versioniertes Lernpaket. Das Schuldashboard speichert nichts Eigenes, sondern
führt vorhandene PDFs, Karten, Aufgaben und Termine begrenzt zusammen.


## E132 · Vierzigtausend Zeilen, die der Browser nie gesehen hat

> **Zur Nummerierung:** die Commits zu E132–E135 tragen in ihren Meldungen
> noch die Nummern E125–E128. Beim Schreiben war nicht gesehen worden, dass
> der Codex-Stand E125–E131 bereits vergeben hatte. Die Einträge stehen hier
> als E132–E135, die Verweise im Quelltext zeigen darauf, und die
> Commit-Meldungen bleiben, wie sie sind — eine Meldung nachträglich zu
> ändern hiesse, die Geschichte umzuschreiben.

**24. August 2026.** Der Zweig `codex/red` brachte zwei grosse Commits mit:
Study Suite, Ink, Lernen, PDF, Elektro — und darauf den „grossen
Produktumbau" mit Lernwelt, Arbeitswelt, Lebensbereichen, Produktwelten und
einer Einrichtung der Hauptwelten. Zusammen rund 40 000 Zeilen.

Davon lief nichts.

```txt
src/bereiche/wissen/arbeitswelt.ts:337   let roh: unknown = null
                                          … darüber: for (const wert of roh)
```

TypeScript lässt das nicht durch, `npm run typecheck` brach ab — und weil
`bauen:ts` erst danach läuft, wurde KEINE der fünf neuen Dateien je nach
`quell/` geschrieben:

```txt
quell/bereiche/wissen/lebensbereiche.js       fehlte
quell/bereiche/wissen/lernwelt.js             fehlte
quell/bereiche/wissen/arbeitswelt.js          fehlte
quell/bereiche/wissen/produkt_onboarding.js   fehlte
quell/bereiche/wissen/produktwelten.js        fehlte
```

`index.html` lud sie trotzdem. Ein `<script src>` auf eine Datei, die es
nicht gibt, ist im Browser kein Fehler: die Seite lädt weiter, das Modul ist
einfach nicht da. Fünf 404er bei jedem Start, keine Meldung, keine rote
Konsole.

Gemessen vorher und nachher:

```txt
                       vorher            nachher
404er beim Start       5                 keine
Lebensbereiche         undefined         object
Lernwelt               undefined         object
Startseite heisst      „Start"           „Heute"
Einzeldatei            4688 KB           5586 KB
```

Ein Zeichen Typ. Das ist die ganze Ursache.

### Was daraus für Prüfungen folgt

Kein Prüflauf konnte es merken, weil keiner die Welten je geöffnet hat. Ein
Modul, das nur in `index.html` steht und sonst nirgends, ist für die
Prüfsuite unsichtbar. Deshalb gibt es seit E126 test206 — und der erste
Prüfpunkt darin ist die Frage, ob die Module überhaupt geladen sind.

### Drei Prüfläufe im selben Zug

**test101** — der Prüfserver hielt nicht an. `stopp()` war:

```ts
stopp: () => new Promise(f => { server.close(() => f()); })
```

`server.close()` hört nur auf, NEUE Verbindungen anzunehmen; auf jede
bestehende wartet es, und eine Verbindung, die offen ist und nichts tut, geht
von sich aus nicht weg. Gemessen mit einer einzigen rohen Verbindung:

```txt
alt   stopp() nach 3000 ms aufgelöst?   false   ← hängt
neu   stopp() nach 3000 ms aufgelöst?   true
```

Unter Linux fiel es nie auf, weil `fetch` seine Verbindungen selbst
schliesst. Es genügt ein Client, der es nicht tut — und unter Windows endete
test101 genau daran mit einer libuv-Assertion, NACHDEM alle fachlichen Punkte
grün waren. Kein Sleep: die Verbindungen werden beendet, zweimal anhalten ist
einmal, und test101 setzt `process.exitCode`, statt den Prozess abzureissen.
Zehn Prüfläufe hängen an diesem Server.

Unterwegs war `process._getActiveHandles()` eine falsche Spur: es führt das
Server-Objekt bis zur Speicherbereinigung weiter auf. Nach `stopp()` standen
dort „Server, Socket, Socket, Socket", und der Server war längst zu. Das
ehrliche Signal ist, ob der Port sofort wieder frei ist.

**test202** — die 50/67-Statistik aus dem Auftrag war schon repariert.
Blockiert hat die Einrichtung der Hauptwelten: seit dem Bauen legt sie sich
beim ersten Start über alles und fängt Klicks ab. Der Lauf entlässt sie jetzt
wie den Rundgang.

**test87** — Codex' drei neue Stilblätter standen hinter `bausteine.css`. Die
Kaskade sprang damit von Stufe 3 auf 2 zurück, und die Basis überschrieb die
neuen Bereiche. Jetzt davor.


## E133 · Eine Prüfung, die die Produktwelten wirklich öffnet

**24. August 2026.** Der Auftrag verlangt unter §56 Prüfungen für die grossen
Produktwege. test206 ist das, und E125 ist der Anlass: 40 000 Zeilen konnten
tot sein, ohne dass ein einziger von 171 Läufen etwas merkte.

Geprüft wird, was ein Mensch tut: beide Hauptwelten öffnen, Bibliothek,
Aufgaben, am Rechner, am Tablet und an zwei Telefongrössen.

Dazu die wichtigste Produktregel des Auftrags (§51): ein Objekt, viele
Ansichten, keine Kopien. Gemessen wird sie nicht an Worten, sondern an
Zählwerten — eine Datei anlegen, durch fünf Ansichten laufen, nachsehen, ob
Blöcke, Sammlungen, Dateien oder Stücke mehr geworden sind. Sind sie nicht,
und die Datei trägt danach noch ihre Kennung, ihren Namen und ihre Bytes.

**Gegenprobe:** eine der fünf gebauten Dateien gelöscht → vier Punkte rot.

Ein Prüfpunkt war zuerst rot, obwohl das Datum gut sichtbar auf dem
Bildschirm stand: gemessen wurde an `#inhalt`, gezeichnet wird aber in
`.lernwelt`. Eine Prüfung, die am falschen Element misst, ist schlimmer als
keine — sie behauptet einen Fehler, den es nicht gibt, und lenkt vom echten
ab.


## E134 · Papiervorlagen — fünf Muster, kein zweites Dokumentformat

**24. August 2026.** Blanko, liniert, kariert, Punktraster,
Millimeterpapier. Der Auftrag (§21) gibt die Bauweise in einem Satz vor:
„Nur Darstellung/Metadaten, kein paralleles Dokumentformat."

Also ein Feld am Block und ein Hintergrundbild im Stilblatt. Kein zweiter
Blocktyp, kein zweiter Speicher, keine Kopie des Blattes je Vorlage. Wer die
Vorlage wechselt, ändert nichts an seinem Text und nichts an seinen Strichen
— deshalb kann man beliebig hin- und herwechseln, ohne etwas zu verlieren,
und deshalb muss beim Wechsel auch nicht neu gezeichnet werden.

### Die Abstände stehen in Blattmassen, nicht in Bildschirmpunkten

Dieselbe Regel wie in E100, und hier genauso wichtig: das Blatt folgt der
Fensterbreite über `aspect-ratio`. Ein Kästchen in Pixeln wäre am Telefon ein
anderes als am Rechner — dann ist es kein Karopapier mehr, sondern ein
Muster. Und für beide Achsen dieselbe Prozentzahl zu nehmen ergibt Rechtecke
im Verhältnis 1 : √2, weil A4 nun einmal so aussieht.

Gemessen an einem 548 px breiten Blatt:

```txt
kariert   2,380 % von 548 = 13,05 px quer
          1,684 % von 775 = 13,05 px hoch     → quadratisch
mm        0,476 % von 548 =  2,61 px          → genau 1 mm
Zehner    4,762 % von 548 = 26,10 px          → genau 10 mm
```

Bei einem zweiseitigen Blatt halbieren sich die Prozentzahlen, und der
Abstand auf dem Papier bleibt derselbe.

**Gegenprobe:** beide Achsen mit derselben Prozentzahl gerechnet →
10,91 gegen 15,43 px, auf zwei Seiten 5,45 gegen 15,43. Vier Punkte rot.

Die fünf Knöpfe zeigen jeder SEIN Muster statt eines Sinnbilds dafür. Bei den
Ausrichtungsknöpfen hat ein Sinnbild schon einmal wie eine Klammer ausgesehen
(§55.1); ein Muster kann man nicht falsch verstehen.

Das Papier ist in beiden Themen weiss — es ist Papier, kein Fenster. Die
Lineatur braucht deshalb keine zweite Farbe für den Dunkelmodus.


## E135 · Die Lernwelt rechnete falsch — zwei Ursachen, sieben falsche Zahlen

**24. August 2026.** Über 173 Prüfläufe hinweg fasste kein einziger die
Lernwelt an. Sie ist die grösste der neuen Ansichten — Tagesrunde,
Fehlertraining, Lernpfad, Prüfungszentrale, Fortschritt — und stand
ungeprüft da.

Was darin lag, ist die stille Sorte: sie zeigt 0 und „leer", und 0 ist für
einen frischen Bestand eine völlig glaubwürdige Zahl.

### Ursache 1 — ein leerer Lernstand ist kein Lernstand

`leererLernzustand` in `lebensbereiche.ts` liefert `sr: {}`. Ein leeres
Objekt ist wahr. `karteMitStand` schrieb `stand?.sr || null` und liess es
damit stehen — und danach galt in `warteschlange`:

```ts
neu    = alle.filter(card => !card.sr)       // nie eine Karte
fällig = alle.filter(card => card.sr && …)   // immer alle
```

Gemessen mit fünf fabrikneuen Karten: **0 neu, 5 fällig**. Die Kachel „neue
Karten" konnte gar nichts anderes anzeigen als null, und der Lernplan legte
Karten, die noch niemand gesehen hat, unter „gelernt und jetzt wieder dran".

Geändert wurde in `lernwelt.ts`, nicht in `leererLernzustand`: dessen Form
ist ein Vertrag, an dem andere Leser hängen (`sm2(zustand.sr)` erwartet ein
Objekt). Was fehlte, war die Unterscheidung, und die gehört an die Stelle,
die sie braucht.

### Ursache 2 — ein `Date` ist schon ein Datum

```ts
const roh = wert && typeof wert === 'object'
  ? (wert as any).start ?? (wert as any).date ?? (wert as any).from
  : wert;
```

Ein `Date` IST ein Objekt und hat keines dieser drei Felder. `roh` wurde
undefined, die Funktion gab `null` zurück, und weil `tag()`, `datumText()`
und `tageBis()` alle darüber gehen, nahm das halbe Dashboard es mit.

Gemessen, eine Karte mit „Gut" bewertet:

```txt
                       ohne den Zweig    mit ihm
Lernziel heute         0 / 20            1 / 20
Streak                 0 Tage            1 Tag
Prüfungs-Countdown     „null Tage"       „5 Tage"
Verlaufsbalken         leer              gefüllt
```

„null Tage" stand wörtlich auf dem Bildschirm: `naechstePruefung.tage + '
Tage'` mit `tage === null`.

### Warum das keine Prüfung gefunden hat

Weil keine da war. Beide Fehler zeigen plausible Zahlen; nur wer eine Karte
bewertet und DANACH nachsieht, merkt, dass sich nichts bewegt hat. Genau das
tut test208 jetzt — und zwar über die Oberfläche, mit Klicks auf
„Tagesrunde starten", „Antwort zeigen" und „Gut".

**Gegenprobe**, je Ursache einzeln zurückgenommen: ohne den Date-Zweig 5 rot
(darunter „null Tage" wörtlich im Prüfbericht), ohne `hatLernstand` 3 rot.

Ein Prüfpunkt war zuerst rot, obwohl „5 Tage" gut sichtbar dastand: gesucht
wurde `\b5\s*Tage\b`, und der Wortlaut ist „29. Aug. 20265 Tage" — zwischen
zwei Ziffern gibt es keine Wortgrenze.


## E136 · Drei Dinge, die dastanden und nicht funktionierten

**24. August 2026.** Nach E135 blieben in der Lernwelt drei Stellen, die
aussahen wie fertig. Alle drei sind kleine Ursachen mit sichtbarer Wirkung.

### 1. Die Tastatur kam nie an

Der Code für die Tastenkürzel war vollständig: Leertaste deckt auf, 1 bis 4
bewerten. Er wurde nur nie ausgeführt.

```ts
ziel.addEventListener('keydown', taste);     // ziel = die Wurzel der Lernwelt
```

Ereignisse steigen AUFWÄRTS, nicht abwärts. Gemessen liegt der Fokus nach
dem Öffnen auf `BODY`, und body ist der Vorfahr der Wurzel, nicht ihr
Nachfahr — der Tastendruck lief in die andere Richtung.

```txt
nach Start        Fokus BODY, Karte 1 von 4
Leertaste         nichts — nicht aufgedeckt
Maus aufgedeckt   ja
Taste 3           nichts — immer noch Karte 1 von 4
```

Der Horcher hängt jetzt am Dokument und fragt zuerst, ob die Lernwelt
überhaupt noch im Dokument steht. `abmelden()` nimmt ihn wieder ab.

Ein zweiter Vorbehalt musste bleiben, aber genauer werden: Leertaste und
Enter BETÄTIGEN einen Knopf, der den Fokus hat — ohne Vorbehalt deckte ein
Druck auf „Antwort zeigen" die Karte zweimal auf. Die Ziffern 1 bis 4
betätigen nichts und dürfen deshalb immer.

### 2. Die vierte Startkachel tat nicht, was auf ihr stand

„Prüfungsfokus — Karten passend zur nächsten Prüfung mischen." Der Knopf
darunter hiess „Prüfungen öffnen" und wechselte den Reiter.

Jetzt übt sie wirklich, mit einer eigenen Auswahl: `nurPassendeKarten`.
`passendeKarten` gibt bei null Treffern den ganzen Bestand zurück — für eine
Simulation vertretbar (lieber eine Übungsklausur aus allem als gar keine),
für ein Versprechen „passend zu" nicht. Gibt es keine passenden Karten, sagt
die Kachel das, statt einen Knopf anzubieten, hinter dem alles käme.

Gemessen mit drei Karten und einer Klausur „Ohmsches Gesetz und Leistung":
Knopf „Üben · 2", Runde „Prüfungsfokus: Ohmsches Gesetz und Leistung, Karte
1 von 2". Die dritte Karte hiess „Kochrezept :: Salz" und blieb draussen.

### 3. Vier Reiter standen ausserhalb des Bildes

Mit Augen gesehen (§55): auf dem Heute-Bild hing „Schule / Ausbildung" halb
draussen, und Uni, Arbeit und Fortschritt waren gar nicht zu ahnen. Die
Leiste kann gescrollt werden — nur zeigt das nichts an: kein Schatten, kein
Pfeil, keine angeschnittene Beschriftung. Neun Reiter brauchen 1016 px, die
Leiste hatte 706.

Am Rechner brechen sie jetzt in zwei Reihen um. Am Telefon bleibt es beim
Scrollen: dort ist die waagerechte Leiste die vertraute Form, und zwei
Reihen kosteten zu viel Höhe.

### Und warum das alles so lange dastand

`bilder.mts` kannte die Lernwelt nicht. Die Ansicht kam in keinem
Bildschirmfoto-Durchgang vor — also hat sie nie jemand angesehen, und §55
sagt genau dafür: „Öffne die Seite wirklich, statt nur den Code zu lesen."

Vier Ansichten sind jetzt eingetragen: `heute`, `lernzentrale`, `workspace`
und `papier`. `node bilder.mts heute` zeigt in zehn Sekunden alle Zahlen,
die in E135 falsch waren.

Beim Bauen des Papier-Bildes fiel nebenbei auf, dass `App.oeffne` die
Sonderansicht der Produktwelten nicht wegräumt — das Bild zeigte das
Heute-Dashboard statt des Blattes. Die Ansicht baut sich jetzt ihren eigenen
Kasten, so wie die Tabellen-Ansichten es längst tun.

**Geprüft:** test208 §5 und §6 (Tastatur und Prüfungsfokus), test206 §7
(kein Reiter ausserhalb) und §8 („Ausbildung einrichten" legt wirklich etwas
an — additiv, die vorhandenen Seiten bleiben). Gegenprobe je Behebung
zurückgenommen: 5 rot für die Lernwelt, 1 rot für die Reiterleiste — und die
nennt die vier Reiter beim Namen, die draussen standen.


## E137 · Drei Wege, die nach dem Start nicht mehr stimmten

**24. August 2026.** Die zwei Hauptwelten (E132) haben die Startansicht
verändert: Redion öffnet nicht mehr eine Seite, sondern das Heute-Bild. Drei
Stellen im Bestand hatten die alte Annahme fest eingebaut und wurden dadurch
falsch — jede einzelne erst im Betrieb sichtbar, keine davon durch eine
Prüfung gemeldet.

### 1. Der Willkommensbildschirm gehört dem Rundgang

Die Einrichtung der Hauptwelten hatte sich beim ersten Start vor den
Rundgang geschoben:

```ts
void ProduktOnboarding.vielleichtStarten().then(gezeigt => {
  if (!gezeigt) Rundgang.vielleichtStarten();
});
```

E55 hat diesen Bildschirm für den Rundgang beschlossen, und zwar mit einem
Satz, der für die Einrichtung genauso gilt: *ein Fenster, das den Bildschirm
nimmt, bevor man etwas getan hat, ist zudringlich.* Zwei Nebenwirkungen kamen
dazu, beide gemessen:

```txt
Start 1   Einrichtung der Hauptwelten (Modal, fängt jeden Klick ab)
Start 2   Rundgang — denn die Einrichtung setzt `rundgangGesehen` nicht
```

Zwei Begrüssungen an zwei aufeinanderfolgenden Tagen (L52). Und weil das
Modal jeden Klick abfängt, blieben im vollen Durchgang mehrere Prüfläufe
daran hängen — test32 mit einer Zeitüberschreitung, ohne dass irgendwo ein
Fehler stand.

Die Einrichtung ist jetzt ein **Angebot statt einer Pflicht**: sie steht in
der Befehlspalette und als Karte auf dem Heute-Bild, solange sie noch nicht
durchlaufen ist. `vielleichtStarten` bleibt im Modul — wer sie wieder von
selbst öffnen lassen will, ruft eine Zeile auf.

### 2. Der Graph sagte „Öffne zuerst eine Seite" — und meinte den Normalfall

```ts
const centerId = App.aktuelleSeite();
if (!centerId) { UI.toast('Öffne zuerst eine Seite für ihren Teilgraphen'); return; }
```

Solange die App auf einer Seite startete, war das die Ausnahme. Seit dem
Heute-Bild ist es der Regelfall: Strg+Umschalt+G direkt nach dem Start
bekam eine Absage statt eines Graphen.

Die zuletzt bearbeitete Seite ist die ehrlichste Wahl — sie ist das, woran
man zuletzt war. Gibt es überhaupt keine Seite, bleibt die Absage; dann ist
sie wahr. Gemessen nach dem Start, ohne eine Seite zu öffnen:

```txt
vorher    graphInfo leer, kein Kasten
nachher   1 von 71 Knoten · 0 Verbindungen · 0 Entscheidungen · 0 Quellen
```

### 3. Sechs Pillen passen nicht in die Rechnung für fünf

Die Produktwelten stellen „Lernen" vor die vier Bereiche — sechs statt fünf
Tasten in der oberen Leiste am Telefon. Die Stufen von E88 waren für fünf
gerechnet:

```txt
428 px   Heute 3 px zu viel, Seiten 6 px zu viel
390 px   vier von fünf ragen heraus, bis zu 44 px
```

Gespart wird am Weissraum, nicht an der Daumenfläche: die Tasten bleiben
56 px hoch, mindestens 48 px (ab 400 px: 44 px) breit — §37 verlangt 44.
Kleiner werden nur das Polster in der Pille und der Abstand zwischen Sinnbild
und Wort.

Dabei fiel eine eigene Sorte Fehler auf, die nichts mit Zahlen zu tun hat:
meine neuen Medienabfragen standen **vor** der Grundregel für
`#handy-oben button`. Gleiche Spezifität, spätere Regel gewinnt — die
Grundregel hat meine Werte einfach wieder überschrieben, und die Leiste blieb
zu breit, obwohl die Zahlen im Stil richtig dastanden. Die Abfragen stehen
jetzt hinter der Grundregel.

**Geprüft:** test195 (Graph nach dem Start, ohne offene Seite), test54 §
Bedienleiste und test37/40/67/114 (sechs Pillen, kurze Namen), test31
(Offline-Probe). Zwölf Läufe, die im vollen Durchgang rot standen, sind
wieder grün — zehn davon nur, weil sie die neue Startansicht noch nicht
kannten, zwei wegen echter Produktfehler (dieser Abschnitt, Nummer 1 und 2).


## E138 · Das Whiteboard ist eine Fläche, kein Fenster

**24. August 2026.** §22 des Auftrags verlangt das Whiteboard als eigenen
Top-Level-Arbeitsbereich, mit „freie Fläche", „Zoom/Pan", „Verbindungen" und
„Bilder". Vorhanden war ein Whiteboard-Block mit Stift, Formen, Haftnotizen
und Radierer — gut gebaut, aber genau so gross wie sein Kasten.

Was rechts hinausging, war nicht „weiter draussen". Es war weg.

### Ein Ausschnitt statt einer Leinwand

Die Formen behalten ihre Koordinaten. Neu ist ein AUSSCHNITT darüber:

```ts
sicht = { x, y, z }       // linke obere Ecke in Formkoordinaten, Massstab
viewBox = `${x} ${y} ${breite / z} ${hoehe / z}`
```

Alte Boards bleiben damit Zeichen für Zeichen gültig: ohne gespeicherte
Sicht ist der Ausschnitt 0/0 bei Massstab 1, und das ist genau das Bild von
vorher.

Der Fehler, den ein Ausschnitt einbaut, sitzt woanders — im Zeiger. Solange
Ausschnitt und Bildschirm dasselbe sind, stimmt `clientX - rect.left`. Ab
dem ersten Schieben stimmt es nicht mehr, und zwar um genau den Schiebeweg.
Das sieht man erst beim zweiten Strich, und dann sieht es aus wie ein
Zeichenfehler, nicht wie ein Rechenfehler:

```ts
punkt = [sicht.x + (clientX - rect.left) / sicht.z,
         sicht.y + (clientY - rect.top)  / sicht.z]
```

test209 §3 misst genau das: gezeichnet bei Bildschirm-x, gespeichert bei
Flächen-x. Mit der Umrechnung zurückgenommen lag das Rechteck bei 112 statt
332 — um 220 daneben, den Schiebeweg aus §2.

### Bilder gehören in die Ablage

Der kurze Weg wäre eine Data-URL in `shapes` gewesen. Dann steckte das ganze
Bild in jedem Block, in jeder Sicherung und in jedem Versionsstand — genau
das, was §14 verbietet. Das Bild geht deshalb denselben Weg wie jeder andere
Anhang: in Stücken in die Dateiablage, verknüpft mit diesem Block. In der
Form steht nur die Kennung.

Das kostet einen dritten Zustand: `undefined` heisst „noch nicht gefragt",
`null` heisst „gibt es nicht mehr", eine Zeichenkette ist die Adresse. Mit
nur zwei Zuständen fragte die Fläche bei jeder Neuzeichnung wieder nach
einer Datei, die gelöscht ist.

### Verbindungen merken sich Formen, nicht Punkte

Eine Verbindung speichert `von` und `nach` — zwei Formkennungen. Gezeichnet
wird sie erst beim Malen, von Rand zu Rand. Deshalb geht sie mit, wenn man
eine Form verschiebt, und verschwindet mit ihr, wenn man sie radiert.

Mit Koordinaten statt Kennungen wäre der Pfeil liegengeblieben; test209 §6
misst beide Richtungen.

### Der eigene Bereich

Die Flächen lagen längst im Schnappschuss der Arbeitswelt — sichtbar waren
sie als eine Zeile in der Übersicht, zusammen mit den Tabellen. §22 verlangt
einen eigenen Bereich, §52 verbietet dafür eine zweite Datenhaltung. Beides
zusammen heisst: ein Reiter mehr auf denselben Daten.

Karten statt Listenzeilen, weil ein Whiteboard kein Titel ist, sondern ein
Bild. Zehn Zeilen „Whiteboard" wären zehnmal dasselbe Wort; die Miniatur ist
das einzige, woran man seines wiedererkennt. Sie liest den Block, den es
ohnehin gibt, und zeichnet höchstens 60 Formen nach.

**Geprüft:** test209, neun Abschnitte — Ausschnitt und Massstab, Schieben mit
Neustart, Zeichnen nach dem Schieben, Zoom und „alles ins Bild", Bild in der
Ablage, Verbindungen in beide Richtungen, der Reiter samt Adresse, „Neues
Whiteboard", und das Telefon.

### Und zwei Funde, die erst das Hinsehen gebracht hat

**Die Startansicht überschrieb, was schon offen war.** In `schale.ts` stand

```ts
setTimeout(() => Produktwelten.lernen('heute'), 60);
```

Der Grund für die Verzögerung ist gut: die Startansicht braucht
`Produktwelten.start()`, und das läuft weiter unten in derselben Funktion.
Nur ist eine Zeitspanne die falsche Art, auf eine Reihenfolge zu warten.

Gemessen mit einem Whiteboard, das direkt nach dem Laden geöffnet wurde:

```txt
sofort       Zeichenfläche da
nach 600 ms  Zeichenfläche weg, Heute-Bild da
```

Und weil es ein Wettlauf ist, kam er nicht immer: zwei Durchgänge von
`bilder.mts` hintereinander, derselbe Code — das dunkle Bild zeigte die
Fläche, das helle das Heute-Bild.

Die Startansicht wird jetzt gemerkt und ganz am Ende von `start()`
ausgeführt. Danach kommt jedes `oeffne()` von aussen garantiert später.

Das war auch der wahre Grund für das falsche Papier-Bild in E136. Dort
steht, `App.oeffne` räume die Sonderansicht nicht weg — das stimmt nicht:
sie räumt sie weg, und die verspätete Startansicht holt sie zurück. Und es
war der Grund für test90, der im vollen Durchgang rot stand: dieselbe Stelle
öffnet dort eine Seite und misst gleich darauf ihren Randstreifen.

**Der Lebensbereich-Wähler hatte gar keinen Stil.** Oben rechts im
Workspace-Kopf stand ein weisser Kasten auf dunklem Grund, und das Wort
„Lebensbereich" klebte an ihm. Für `.aw-bereichsfilter` gab es in
`arbeitswelt.css` keine einzige Regel; ein Auswahlfeld ohne Stil nimmt die
Farben des Browsers, und die kennen den Dunkelmodus nicht (§48).

Am Telefon kam dazu, dass er zur Hälfte ausserhalb des Bildschirms lag: der
Kopf ist eine Flexzeile mit drei Kindern, und bei 390 px passen Titel,
Filter und ☰ nicht nebeneinander. Jetzt bricht der Kopf um, und unter 470 px
verschwindet das WORT „Lebensbereich" — 170 px, die es dort nicht gibt. Das
Feld trägt weiterhin `aria-label`, ein Screenreader liest also mehr, als
vorher auf dem Bildschirm stand.

Beim zweiten dieser Fixes bin ich in dieselbe Falle getappt wie in E137: die
neue Medienabfrage stand VOR der Grundregel, gleiche Spezifität, spätere
Regel gewinnt — das Bild sah aus wie vorher, obwohl die Zahlen im Stil
richtig dastanden.

### Was §22 noch nicht hat

Die Miniatur im Bereich zeichnet Formen, keine Verbindungen. Das ist eine
bewusste Vereinfachung — sie ist ein Wiedererkennungszeichen, keine
Vorschau. Steht in L54.



## E139 · Die Palette konnte hingehen, aber nichts anlegen

**24. August 2026.** §29 des Auftrags nennt acht Sätze, die man in die
Befehlspalette tippen können soll. Vier davon fanden nichts:

```txt
Neue Aufgabe        kein Treffer
Neue Karte          kein Treffer
PDF importieren     kein Treffer
Schule öffnen       „Sicherung laden", „Gesundheitsbericht und Erste Hilfe"
```

Die Palette war eine Navigationsliste: sie kannte jeden Ort in Redion und
keinen einzigen Vorgang ausser „Neue Seite". Wer etwas ANLEGEN wollte,
musste den Weg über eine Ansicht kennen — am Rechner unbequem, am Telefon
gar nicht möglich, weil es dort kein Strg gibt.

Neu ist eine Gruppe **Anlegen** mit sechs Einträgen: Seite, Aufgabe,
Lernkarte, Whiteboard, PDF/Datei, Aufnahme. Kein einziger davon ist neuer
Code — die Wege gab es alle, sie standen nur nicht in der Liste, in der man
sie sucht. Dazu vier Navigationsbefehle für die Domänen: Schule und
Ausbildung, Uni, Arbeit, Lernfortschritt.

### Warum die Prüfung die Gruppe mitliest

Die erste Fassung suchte nur nach dem Wort. Bei der Gegenprobe blieb
ausgerechnet „Neues Whiteboard" grün, obwohl der Befehl entfernt war — denn
die Palette findet auch SEITEN, und ein Abschnitt weiter oben legt eine
Seite namens „Neues Whiteboard" an.

```txt
mit Befehl     Anlegen › Neues Whiteboard
ohne Befehl    Seiten › 🎨 Neues Whiteboard
```

Zwei Zeilen, die gleich aussehen und Verschiedenes bedeuten. Die Prüfung
liest deshalb die Gruppenüberschrift mit. Mit ihr werden in der Gegenprobe
alle acht Punkte rot, vorher waren es fünf.

**Geprüft:** test206 §11, neun Punkte — die acht Sätze aus §29 und einer,
der wirklich klickt: „Neue Lernkarte" bringt den Bestand von 1 auf 2.


## E140 · Vier Knöpfe ohne Umlaut — und die Prüfung, die das künftig sieht

**24. August 2026.** Beim ersten Bildschirmfoto des PDF-Arbeitsplatzes (§17)
standen in der Zeichenleiste zwei Knöpfe:

```txt
↶ Zurueck        🗑 Loeschen
```

Dazu drei Erklärungen: „Rueckgaengig", „Auswahl loeschen", „Marken
auswaehlen, gemeinsam bewegen oder loeschen", „Schreiben — die Zeichenschicht
ist durchlaessig", „Freihand mit geglaetteter Linie".

Alle funktionierten. Kein Prüflauf hatte etwas dagegen, und keiner hätte
etwas dagegen haben können — Umlaute sind kein Verhalten. Gefunden hat sie
ein Blick auf ein Bild (§55).

CLAUDE.md §53 trennt: Deutsch für Menschen, Englisch für Code. Deutsch heisst
mit Umlaut; `ue` ist kein Kompromiss, sondern ein Fehler.

### Die Prüfung sucht nicht nach `ue`

Im Quelltext ist `ue` fast überall richtig: `loeschen` als Datenschlüssel,
`auswaehlen` als Funktionsname, `kartenGroesse` als Feld. Ein Verbot auf
Quelltextebene wäre in fünf Minuten mit Ausnahmen zugepflastert.

test87 §10 liest deshalb nur, was der Browser wirklich ANZEIGT: `title=`,
`placeholder=`, `aria-label=` und den Text in `<span class="wort">`. Dazu
eine kurze Wortliste, bei der `ae/oe/ue` sicher ein Umlaut sein muss —
bewusst kurz, lieber ein Fall übersehen als ein richtiger Text angemeckert.

„Schliessen", „grosse" und „muss" bleiben unangetastet: das ist Schweizer
Rechtschreibung, und die kennt kein ß. Verboten ist nur die Ersatzform für
einen Umlaut.

Die Prüfung trägt ihre Gegenprobe im Lauf: sie füttert die Wortliste mit
„Rueckgaengig" und „Loeschen" und verlangt, dass beide anschlagen. Eine
Regel, die auf nichts anschlägt, ist keine Regel. Gegen den Stand von vorher
laufend nennt sie alle vier Beschriftungen beim Namen.


## E141 · Der PDF-Arbeitsplatz am Telefon: 211 von 1059 Pixeln

**24. August 2026.** §17 des Auftrags zeichnet den Arbeitsplatz als Bild —
Miniaturen, Dokument, Inspector — und schreibt für das Telefon dazu: „volle
Breite, keine gequetschten drei Spalten". Gebaut war das (E126). Angesehen
hatte es niemand, und geprüft war es auch nicht.

Am Rechner stimmt es. Am Telefon standen die Werkzeuge so:

```txt
Fenster        390 px
Zeichenleiste  211 px      Inhalt 1059 px
draussen       17 von 21 Knöpfen
```

### Der doppelte Seitenzähler

Von den 179 px, die der Leiste fehlten, gingen rund 100 an einen zweiten
Seitenzähler. „Seite 1 von 4" stand unten in der Werkzeugleiste — vier
Zentimeter über dem „Seite 1/4" der Kopfzeile, mit den Blätterpfeilen
daneben.

Er verschwindet nur im DOKUMENTMODUS. Eine PDF-Seite auf einer gewöhnlichen
Seite hat keine Kopfzeile über sich; dort ist die Zahl die einzige Angabe,
und test210 §6 hält genau das fest.

Danach: 310 px statt 211.

### Eine Leiste, die rollt, muss zeigen, dass sie rollt

21 Werkzeuge brauchen 1059 px. Auf ein Telefon passen sie nicht, und das ist
in Ordnung — die Leiste rollt seit E103. Nicht in Ordnung ist, dass eine
abgeschnittene Leiste aussieht wie eine vollständige. Genau dieser Befund
steht in §55.1 über den Tabellenblock, und er galt hier ein zweites Mal.

**Der erste Versuch war falsch**, und das gehört dazu: ein Verlauf an
`.blatt-reihe::after`, also am rechten Rand der ganzen Reihe. Dort steht aber
`.blatt-fest` mit dem 🔗-Knopf — der Verlauf lag über einem Knopf, nicht über
der Kante. Auf dem Bild war er nicht zu sehen, und das war richtig so.

Für rechts gibt es die Anzeige längst: `.blatt-fest` wirft seinen Schatten
nach LINKS, genau auf diese Kante. Sie war nur immer da, auch am Ende der
Leiste. Jetzt schaltet sie mit — gemessen `rechts → beides → links`.

### Und was das Bild sonst noch gezeigt hat

„Zurueck" und „Loeschen". Dazu fünf Erklärungen derselben Machart. Steht in
E140, mitsamt der Prüfung, die das künftig sieht.

**Geprüft:** test210, sechs Abschnitte, 25 Punkte — die drei Bereiche am
Rechner, die deutschen Beschriftungen, das Telefon ohne gequetschte Spalten,
die rollende Leiste mit ihren drei Zuständen, der Zähler einmal statt zweimal
und der Zähler, der auf einer gewöhnlichen Seite bleibt. Vier Gegenproben
einzeln zurückgenommen; eine davon hat meine Erwartung widerlegt: am Telefon
STAPELN sich die drei Bereiche, sie quetschen sich nicht. Die Breite der
Mitte allein hätte den Fehler nie gesehen.


## E142 · Weisse Schrift auf weissem Grund — und der Farbwert, der fehlte

**24. August 2026.** In der Prüfungszentrale stand „Simulation starten". Der
Knopf war da, war anklickbar, war nicht gesperrt — und er war nicht zu sehen.

```txt
Hellmodus   Schrift rgb(255,255,255)   Grund rgb(251,251,250)   1,02 zu 1
```

### Die Ursache war die Kaskade, nicht die Farbwahl

```css
.lernwelt .lw-exam-list footer button{ … background:var(--bg-side) … }   /* 0,2,2 */
.lernwelt button.is-primary{ … background:var(--accent); color:#fff }    /* 0,2,1 */
```

Die Fussleistenregel ist spezifischer und steht davor. Sie setzt den
Hintergrund neu — und weil sie KEINE Schriftfarbe setzt, kam die weisse aus
`is-primary` trotzdem durch. Weiss auf hell.

Im Dunkelmodus fiel nichts auf, weil `--bg-side` dort dunkel ist. §48 des
Auftrags verlangt beides, und genau dafür ist er da.

Der Weg ist nicht `!important`, sondern dieselbe Spezifität: die Fussleiste
steht jetzt in der Aufzählung von `is-primary` mit drin.

### Und dabei kam ein zweiter, grösserer Fehler heraus

Die neue Kontrastmessung fand danach denselben Knopf noch einmal — diesmal
im DUNKELMODUS, mit 2,80 zu 1. Kein Kaskadenfehler, sondern die Farbe selbst:

```txt
hell    --accent #c2410c   Weiss darauf   5,9 zu 1     gut
dunkel  --accent #f97316   Weiss darauf   2,8 zu 1     zu wenig
```

Derselbe Akzent, zwei Helligkeiten, eine Schriftfarbe. Weiss auf einem
hellen Orange ist blass, egal wo es steht — und `background:var(--accent)`
kommt an 70 Stellen im Stil vor.

Neu ist deshalb ein eigener Farbwert:

```css
hell    --auf-accent: #ffffff
dunkel  --auf-accent: #1a1a1a      /* 6,6 zu 1 auf demselben Orange */
```

46 Regeln, die Akzentfläche und weisse Schrift zusammen setzen, benutzen ihn
jetzt. Am Hellmodus ändert sich damit nichts — dort ist der Wert weiss.

### Die Prüfung misst das Ergebnis, nicht die Regel

test128 §9 rechnet für jeden sichtbaren, beschrifteten, nicht gesperrten
Knopf die relative Leuchtdichte nach WCAG aus und verlangt 3,0 zu 1 — die
Grenze für Bedienelemente, nicht die 4,5 für Fliesstext. Es geht hier um
„gar nicht zu sehen", nicht um Feinheiten.

Zwei Dinge daran waren beim ersten Versuch falsch, und beide sind lehrreich:

**Das Messgerät log.** Chrome gibt `color(srgb 0.94 0.87 0.83)` zurück,
sobald eine Farbe aus `color-mix()` kommt — Zahlen von 0 bis 1, nicht von 0
bis 255. Mein Zahlenleser nahm sie als 0–255 und meldete den aktiven Reiter
„Prüfungen" mit 1,70 zu 1, obwohl er dunkelgrau auf hellem Pfirsich steht.
Ein Messgerät mit Fehlalarmen wird abgeschaltet, und dann sieht es auch den
echten Fall nicht mehr.

**Die Prüfung stand am falschen Ort.** Sie öffnete die Prüfungszentrale
eines LEEREN Bestandes — dort gibt es keine Prüfungskarte und damit keinen
Knopf „Simulation starten". Die Gegenprobe blieb grün, obwohl der Fehler
wieder eingebaut war. Jetzt legt der Abschnitt zuerst eine Prüfung an und
prüft in einer eigenen Zeile, dass der Knopf überhaupt dasteht.

Erst danach war die Gegenprobe echt: 1,04 zu 1, beim Namen genannt.


## E143 · Die leere Wand stand auch vor vollen Regalen

**24. August 2026.** Die Schulansicht sagte „Ausbildung noch nicht
eingerichtet" — vor vier Fächern, einer Notendatenbank, sechs Aufgaben und
einem Dutzend Karteikarten. Alles war da. Die Ansicht schaute an einer
einzigen Stelle nach und gab auf:

```ts
const root = schoolRoot();          // Seite mit der Marke `schoolRoot`
if (!root) return leer(…)           // und sonst nichts
```

Die Marke setzt nur die Einrichtung. Wer seine Fächer von Hand angelegt hat —
also jeder, der Redion schon benutzt hat, bevor es diese Vorlage gab —, bekam
eine Wand.

Das widerspricht §51 des Auftrags: **eine Ansicht ist ein Blick auf
vorhandene Objekte, keine Belohnung fürs Drücken eines Knopfes.**

Jetzt zeigt sie den Bestand, sobald es einen gibt, mit einem Satz darüber:
„Das hier kommt aus deinem vorhandenen Bestand. Eine Ausbildungsseite gibt es
noch nicht. Die Vorlage legt sie zusätzlich an — sie ersetzt nichts und
löscht nichts." Die Einrichtung bleibt als Knopf im Kopf stehen. Die Wand
bleibt für den Fall, dass wirklich nichts da ist.

### Ein zweiter Widerspruch auf demselben Bildschirm

Darunter stand „Noch keine Fächer angelegt" — direkt über einer Liste, in der
Betriebskunde, Deutsch und Elektrotechnik untereinander standen. Der
Fächerkasten liest die Sammlung `subjects` aus der Vorlage; die Themenliste
liest die Karteikarten. Ohne Vorlage sagt der eine, es gebe nichts, und der
andere zeigt es.

Zwei Sätze, die einander widersprechen, sind schlimmer als ein fehlender.
Ohne Ausbildungsseite entfällt der leere Kasten; der Themenkasten übernimmt.

### Und der Fehler, den ich dabei selbst gemacht habe

Meine erste Bedingung war:

```ts
schulSammlungen().length > 0 || …
```

`schulSammlungen()` OHNE Argument liefert aber ALLE Sammlungen. Die beiden
Filterzeilen darin greifen nur, wenn `kind` gesetzt ist. Damit zählte „Meine
Aufgaben" aus dem Beispielinhalt als schulischer Bestand — und die Einladung
war überhaupt nicht mehr zu sehen, auch in einem frischen Redion nicht.

Zweimal habe ich stattdessen geraten, woran es liegt: erst an übrig
gebliebenen Karteikarten, dann am Namen der Klausurdatenbank. Beide Male war
die Prüfung danach immer noch rot. Erst das Messen der vier Werte EINZELN hat
es gezeigt — genau die Regel aus AUFGABEN.md, Punkt 1: nachsehen statt raten.

**Geprüft:** test208 §8, zehn Punkte — die Einladung im leeren Bestand (in
einem eigenen, weggeworfenen Browserfenster, weil dieses hier nach sieben
Abschnitten voll ist), der Bestand ohne Ausbildungsseite, die drei Fächer
beim Namen, das stehengebliebene Angebot, der ehrliche Satz und der
verschwundene Widerspruch. Gegenprobe: mit der alten Wand werden fünf Punkte
rot.


## E144 · Drei Sachen, die L54 als fehlend festgehalten hat

**24. August 2026.** E138 hat die Whiteboard-Fläche unendlich gemacht und
ihr Verbindungen, Bilder und einen eigenen Bereich gegeben. Was dabei offen
blieb, stand ehrlich in L54. Hier ist es.

### 1. `↶` nahm den falschen Schritt zurück

```ts
if (a.dataset.a === 'zurueck') { daten.pop(); male(); sichern(); }
```

`pop()` nimmt die zuletzt ANGEHÄNGTE Form weg — nicht den zuletzt getanen
Schritt. Der Unterschied ist der ganze Fehler:

```txt
Form verschoben    → ↶ nahm eine andere Form weg
Form radiert       → ↶ konnte sie nicht wiederholen
zweimal gedrückt   → die vorletzte Form war weg, nicht der vorletzte Schritt
```

Jetzt liegt vor jeder Änderung ein Abbild auf einem Stapel, vierzig Schritte
weit, und daneben ein zweiter für `↷`. Beide Knöpfe sind gesperrt, solange
es nichts zu holen gibt — ein Knopf, der nichts tut und trotzdem anklickbar
aussieht, ist eine Lüge.

Der Stapel wird **nicht mitgespeichert**. Wer neu lädt, hat seine Zeichnung,
aber keine Schrittfolge. Das ist die ehrlichere Grenze, als jeden Block mit
vierzig Abbildern seiner selbst aufzublähen — und §9 der Projektregeln sagt
genau das über stilles Wachstum im Speicher.

Ein Detail, das erst beim Nachdenken auffiel: ein zu kleiner Kritzler wird
nach dem Zeichnen wieder verworfen. Ohne Gegenmassnahme läge dann ein Abbild
auf dem Stapel, das denselben Stand beschreibt — `↶` täte einmal scheinbar
nichts. Der Kritzler nimmt seinen Schritt jetzt mit.

### 2. Der Text kam aus einem Fenster des Browsers

`prompt()` steht in der Mitte des Bildschirms. Es sagt nicht, WO der Text
hinkommt, es kennt keine zweite Zeile, und am Telefon nimmt es die halbe
Höhe weg.

Jetzt steht das Feld dort, wo die Notiz entsteht, in ihrer Grösse und in der
gewählten Farbe. Enter schliesst ab — bei der Haftnotiz erst mit Strg, weil
sie mehrzeilig ist —, Escape wirft weg, ein Klick daneben übernimmt.

Und weil es jetzt ein Feld gibt, gibt es auch einen Weg, den es vorher gar
nicht gab: **zweimal tippen ändert einen bestehenden Text.** Bisher musste
man eine vertippte Haftnotiz radieren und neu schreiben.

### 3. Eine zu klein gezogene Form blieb zu klein

Verschieben ging, Skalieren nicht. Der Griff sitzt an der rechten unteren
Ecke und wird nur für die zuletzt angefasste Form gezeichnet — ein Griff an
jeder Form wäre auf einer vollen Fläche ein Punktemeer, einer ohne
sichtbaren Griff wäre ein Geheimnis.

Gezogen wird von der linken oberen Ecke aus. Ohne diese Festlegung läuft
eine Form mit negativer Breite beim ersten Ziehen weg, weil `x` und `w`
zusammen zwei verschiedene Ecken beschreiben können.

Stift, Verbindung und Text bleiben draussen: ein Stiftstrich hat Punkte
statt Kanten, eine Verbindung hängt an zwei Formen, und ein Text hat nur
eine Schriftgrösse.

### 4. Und ein Fehler, der nur beim Prüfen auffiel

Beim Schreiben der Prüfung blieb der Kasten bei jedem Zug an derselben
Stelle. Zweimal geraten (Seite falsch, Fläche ausserhalb des Bildes), beide
Male daneben. Dann gemessen, was unter dem Zeiger liegt:

```txt
elementFromPoint(mitten im Rechteck)  →  das Raster, nicht die Form
```

**Ein Rechteck ohne Füllung nimmt in SVG keine Klicks an.** Getroffen wird
nur, was gemalt ist — bei `fill: none` also allein der zwei Pixel breite
Strich. „Auswählen und verschieben" ging seit jeher nur, wenn man die Kante
erwischte; in der Mitte griff man durch die Form hindurch.

Rechteck und Ellipse bekommen deshalb `pointer-events: all`. Und weil ein
Strich mit 2,5 px am Telefon ohnehin nicht zu treffen ist, liegt unter jeder
Linie derselbe Pfad noch einmal: 16 px breit, durchsichtig, er fängt nur den
Griff.

### 5. Und einer, den ich selbst eingebaut hatte

Der erste Entwurf zeichnete beim Anfassen sofort neu, damit der Griff
erscheint. `male()` setzt aber `flaeche.innerHTML = ''` — und damit
verschwand genau das Element, auf dem der Zeiger heruntergegangen war.
Chrome gibt daraufhin die Zeigerhaltung frei und schickt `pointercancel`;
das Ziehen war vorbei, bevor es angefangen hatte. Der Griff wird jetzt erst
beim Loslassen gezeichnet.

**Geprüft:** test209 §10, siebzehn Punkte — beide Richtungen des Stapels,
Verschieben UND Radieren zurückgenommen, das Schreibfeld statt `prompt()`
(gezählt, nicht vermutet), der Griff und das Vergrössern mit festgehaltener
oberer Ecke. Vier Gegenproben einzeln zurückgenommen; die vierte — das
Rechteck wieder ohne `pointer-events` — macht schon den ersten Punkt rot.


---

## E145 · Eine Lücke, die es nicht gab

**25. August 2026.** In `doku/AUFTRAG-STAND.md` stand für §23:

> ◐ Seitenansicht, Überschriften, Absätze, Listen, Tabellen, Bilder,
> Druck/PDF stehen. **Vorschlagsmodus fehlt.**

Er fehlt nicht. Er steht vollständig da, in zwei Dateien:

```txt
schale.ts   ein-/ausschalten, Band mit dem Namen dessen, der schreibt,
            Fenster zum Annehmen und Verwerfen, Eintrag im Seitenmenü
editor.ts   beim Verlassen eines Blocks den alten Text festhalten,
            mehrfaches Tippen bleibt EIN Vorschlag
```

Ich hatte gegrept, nicht gelesen. Der Suchbegriff war „Vorschlag" in
`src/bereiche/editor/` — und die Bedienung liegt in `src/schale/`.

### Warum eine falsche Lücke schlimmer ist als eine übersehene

Eine übersehene Lücke kostet, bis sie jemand findet. Eine falsche Lücke
schickt den Nächsten los, etwas zu bauen, das es schon gibt — und dann steht
es zweimal da, mit zwei Datenformen und zwei Fehlern. §52 des Auftrags
verbietet genau das, und die Doku wäre der Anlass gewesen.

Der Eintrag ist berichtigt, und weil eine Behauptung ohne Beleg genau das
Problem war, steht der Beleg jetzt daneben: **test212**, sechs Abschnitte,
32 Punkte.

### Was die Prüfung mitnimmt

Nicht nur die Vorschläge, sondern die ganze Liste aus §23 — Überschriften,
Absätze, Listen, Tabellen, Inhaltsverzeichnis, Kommentare, Druck.

Zwei Richtungen sind ihr wichtiger als alles andere:

**Ohne Modus wird nichts festgehalten.** Wäre jede Tippkorrektur ein
Vorschlag, wäre das Schreiben kaputt. Dieser Punkt steht VOR dem, der den
Modus einschaltet.

**Verwerfen setzt zurück, Annehmen lässt stehen.** Das ist der ganze Sinn,
und beides geht über das Seitenmenü — nicht über eine innere Funktion.
`vorschlaegeZeigen` steht bewusst nicht auf der öffentlichen Fläche von
`App`; geprüft wird der Weg, den ein Mensch nimmt.

### Vier Fehler, und alle vier waren meine

Die falsche Lücke war der erste. Die Prüfung, die sie berichtigen sollte,
brachte drei weitere mit — und jeder hätte für sich ausgereicht, dem Produkt
einen Mangel anzuhängen, den es nicht hat.

**Der Text wurde nie getippt.** Der erste Entwurf setzte `feld.textContent`
und rief `blur()`. Das sieht aus wie Tippen und ist keines: der Editor
sichert auf `input`, und ein zugewiesener `textContent` löst kein `input`
aus. Der Block behielt seinen alten Text — womit „ohne Modus wird nichts
festgehalten" trivial wahr war und „Annehmen lässt den neuen Text stehen"
falsch rot wurde. Jetzt klickt die Prüfung hinein und tippt mit der Tastatur.

**Die Blockart hiess `tabelle`.** `Store.addBlock` nimmt jede Zeichenkette;
der Editor fiel in seinen `default`-Zweig und zeichnete einen leeren Absatz.
Der Punkt „alle Bausteine da" blieb trotzdem grün, weil er nur Namen zählte.
Die Art heisst `table` (`register/bloecke.ts`).

**Überschriften sind keine `<h1>`.** Jeder Block ist ein `<div>`; zur
Überschrift wird er durch `role="heading"` und `aria-level` auf dem Textfeld
— genau das, was ein Vorleseprogramm liest. Eine Suche nach `h1, h2, h3`
zählt null, auf jeder Seite, immer.

**Gedruckt wird im Rahmen, nicht im Fenster.** `drucken` hängt ein
`<iframe>` ein und ruft `f.contentWindow.print()`. Wer `window.print`
ersetzt, zählt null Aufrufe und hält den Druck für kaputt. Ein Beobachter
fängt den Rahmen jetzt im Moment des Einhängens ab.

Dazu kam die Klasse des Inhaltsverzeichnisses: sie heisst `toc-liste`, nicht
`toc`.

Fünf Namen, fünfmal geraten statt nachgesehen — genau das, wovor E21 warnt,
nur diesmal nicht bei Feldnamen, sondern bei Klassen, Rollen und Blockarten.

### Kann die Suite rot werden?

Nachgemessen, nicht behauptet. Auf einem Abzug des Baums wurde je eine Zeile
im Produkt entschärft:

```txt
`alt` beim Festhalten durch `neu` ersetzt   → §3 rot, und §4 gleich mit
Verwerfen schreibt nicht mehr zurück        → §4 rot
`f.contentWindow.print()` weggelassen       → §6 rot (0 Aufrufe)
`role="heading"` weggelassen                → §1 rot (3 → 1)
```

Die fünfte kam von selbst: mit der Blockart `tabelle` war §1 rot, bis die
Art stimmte.

**Geprüft:** test212, 32/32.


---

## E146 · Der Knopf „Geteilt öffnen" tat etwas, und man sah es nicht

**25. August 2026.** §16 des Auftrags will Reiter und eine geteilte Ansicht.
Beides steht seit langem: `reiter.ts` führt die Liste, der Workspace zeigt
sie rechts in einem Feld „Reiter & geteilte Ansicht" — mit `⊞` zum geteilt
Öffnen und `✕` zum Schliessen.

Nichts hielt das fest. Die Prüfung dafür (test206 §12) fand beim ersten Lauf
sofort etwas, und zwar genau die Sorte Fehler, die nur beim Ausführen
auffällt.

### Was gemessen wurde

```txt
⊞ geklickt
Fenster.geteilt()   { id: "…", richtung: "quer", anteil: 50 }   gesetzt
.arbeitswelt        da
.aw-reiter-panel    da
.aw-teilung         NICHT da
```

Der Zustand stimmte, das Bild nicht. Wer `⊞` drückte, sah nichts passieren —
weder den Satz „Geteilt: Zweite Seite · quer" noch den Knopf, mit dem man es
wieder zumacht.

### Warum ausgerechnet dieser Weg

Die vier Wege in diesem Feld sehen gleich aus, sind es aber nicht:

```txt
Reiter öffnen    → App.oeffne   verlässt den Workspace
Reiter wechseln  → App.oeffne   verlässt den Workspace
Reiter schliessen→ App.oeffne   verlässt den Workspace
Geteilt öffnen   → hängt sich in #main und lässt den Workspace stehen
```

Drei brauchen kein Neuzeichnen, weil gleich eine andere Ansicht kommt. Der
vierte braucht es — und war der einzige ohne. Ein `zeichnen()` mehr.

### Und ein Fehler in meiner eigenen Messung

Die Prüfung las den aktiven Reiter mit `Number(F.aktiv?.() || -1)`. Der erste
Reiter hat den Zähler **0**, und 0 ist falsch im Sinne von `||`. Die Messung
meldete −1 und behauptete, das Wechseln gehe nicht. Es geht. `?? -1` statt
`|| -1`.

Dieselbe Sorte wie in E145: nicht das Produkt war kaputt, sondern die Zeile,
die es prüfen sollte. Bei Zählern, Grössen und Anzahlen ist `||` fast immer
der falsche Operator.

**Geprüft:** test206 §12, elf Punkte — zwei Reiter, Wechseln, geteilt Öffnen,
Teilung schliessen, Reiter schliessen. Das `zeichnen()` wieder weggenommen
macht zwei davon rot; `Fenster.neuerReiter` aus der Rückgabe entfernt lässt
den Abschnitt gar nicht erst anlaufen.


---

## E147 · Die Suche findet Dateinamen und Quellenangaben — und beide Suchen dieselben

**25. August 2026.** L55 hielt zwei Dinge fest, die §28 des Auftrags verlangt
und die die Suche nicht fand: den **Dateinamen** und die **Quellenangabe**.

### Erst nachgemessen, und L55 dabei halb widerlegt

L55 hiess „Die Suche findet keine Dateinamen". Das war zu weit gegriffen.
Gemessen:

```txt
Anhang, Blocktext = "Rechnung-2026-08.pdf"   gefunden
Anhang, Blocktext = ""                       nicht gefunden
```

Jeder Weg im Produkt, der eine Datei anlegt, setzt den Namen auch als
Blocktext — `recognition.ts`, `pdf/einlesen.ts`. Im Alltag fiel deshalb
nichts auf. Verloren geht der Name erst, wenn jemand den Text überschreibt
(„Der Vertrag von damals"), und dann ist er endgültig weg: die Datei liegt im
Fach `dateien`, der Blocktext zeigt woandershin.

Dieselbe Sorte Berichtigung wie E145, nur in die andere Richtung: dort stand
etwas als fehlend da, das es gab; hier stand etwas als ganz fehlend da, das
zu neun Zehnteln ging.

### Was gebaut wurde

**Ein Verzeichnis Kennung → Name.** `Store.search` ist synchron — die
Befehlspalette tippt mit, und ein `await` je Tastendruck wäre spürbar. Das
Fach `dateien` liegt aber in IndexedDB. Also hält `indexdb.ts` eine kleine
`Map` mit Kennung und Name, gefüllt beim Hochfahren und bei jedem Schreiben,
geleert beim Löschen. Die Bytes liegen weiter im Fach `stuecke` und werden
nie angefasst (§36).

**Eine Funktion entscheidet, was durchsuchbar ist.** `Store.durchsuchbar(b)`
gibt zurück, was an einem Block Text ist:

```txt
b.text · b.suchtext · b.ocrText          wie bisher
Dateiname zu b.dateiId                   neu
b.quiz.source.title / .edition           neu
b.learningPackage.license                neu
```

### Und der Teil, der ohne den vorigen nichts genützt hätte

`Store.search` ist nicht die einzige Suche. Davor liegt ein Beschleuniger:
`Kontext.kandidaten(wort)` grenzt auf jene Seiten ein, deren Wörter im Index
stehen. Der Index wurde aus einer EIGENEN Feldliste gebaut — denselben drei
Feldern wie früher.

Der Fehler daran ist unscheinbar und trifft hart:

```txt
Wort im Index gar nicht    → kandidaten = null → alles prüfen → gefunden
Wort im Index anderswo     → kandidaten = [jene Seiten] → Anhang fällt heraus
```

Solange „Mietvertrag" nirgends stand, fand die Suche den Anhang trotzdem.
Sobald irgendeine Notiz das Wort enthält, verschwindet der Anhang aus den
Ergebnissen — und zwar genau dann, wenn man ihn am ehesten sucht.

Der Index baut jetzt auf derselben `durchsuchbar`-Funktion. Genau dieser
Fehler ist bei den PDF-Texten schon einmal passiert (E124); der Kommentar
dort sagt „Zwei Suchen mit zwei Antworten sind schlimmer als eine
schlechte", und diesmal steht statt einer zweiten Liste ein Aufruf.

### Kann die Suite rot werden?

**test213**, fünf Abschnitte, 20 Punkte. Drei Gegenproben einzeln auf einem
Abzug des Baums zurückgenommen:

```txt
Dateiname aus `durchsuchbar` weg     → §2 rot (3 Punkte)
Quellenangabe weg                    → §3 rot (3 Punkte)
Kontext-Index mit eigener Feldliste  → §2 UND §4 rot (5 Punkte)
```

§1 prüft die Gegenrichtung — ein erfundener Name und eine erfundene Quelle
ergeben nichts —, und §5, dass ein gelöschter Anhang aus dem Verzeichnis
verschwindet. Ein Verzeichnis, das nur wächst, schickt den Menschen sonst auf
einen Block, an dem nichts mehr hängt.

Mitgeprüft, weil `dateiHolen` und `dateiAlle` angefasst wurden: test96,
test100, test107, test108, test124, test182, test183 — alle grün.

### Nachtrag: eine Prüfung, die ich nicht auf dem Zettel hatte

Der vollständige Durchlauf danach meldete **test181 §6** rot — drei Punkte,
die den Quelltext lesen und die alte, doppelte Feldliste erwarteten
(`['text', 'suchtext', 'ocrText']` in `findInside`, `if (k.suchtext)
text.push(…)` in `kontext.ts`). Genau die beiden Stellen, die E147
zusammengeführt hat.

Am Verhalten fehlte nichts: die §1–§5 desselben Laufs, die die Suche wirklich
benutzen, blieben grün. Rot war die Beschreibung.

Die drei Punkte prüfen jetzt das Stärkere — dass es **eine** Stelle gibt, die
sagt, was durchsuchbar ist, dass beide Suchen aus ihr lesen, und dass daneben
keine zweite Liste mehr steht. test181 zählt damit 47 statt 43 Punkte.

Die Lehre ist nicht neu, aber sie kostet jedes Mal: wer eine Stelle
zusammenlegt, muss auch suchen, wer über ihre alte Form etwas behauptet.
`grep 'suchtext' pruefungen/` hätte gereicht.


---

## E148 · Vier Sachen, die nur das Hinsehen fand — und die Ursache darunter

**25. August 2026.** §55 sagt: nach jeder Änderung ein Bild. Nach den
Prüfläufen zu E145–E147 stand die Bibliothek zum ersten Mal als Bild da, und
sie zeigte vier Sachen, die kein einziger der 180 Läufe sehen konnte.

### 1. Drei von sechs Zählern sagten nicht, was ihre Zahl bedeutet

```txt
15    Seiten          67 px nötig, 46 da  →  „Inhalts…"
1961  Inhaltsblöcke   86 px nötig, 46 da  →  „PDF-…"
0     PDF-Dokumente   65 px nötig, 46 da  →  „White…"
```

Die Zahlen stimmten alle. Eine Zahl ohne lesbare Beschriftung ist trotzdem
keine Auskunft — dieselbe Familie wie die abgeschnittene Zahl beim
Tabellenblock (§55.1), nur eine Ebene daneben.

Das Raster stand auf `repeat(3, minmax(0,1fr))`. Drei feste Spalten in einer
Mittelspalte von 366 px ergeben Karten von 114 px, und davon gehen Zeichen
(34), Abstand (10) und Innenrand (24) ab. Jetzt steht dort
`repeat(auto-fit, minmax(152px,1fr))` — so viele Spalten, wie lesbar
hineinpassen, und nicht eine mehr.

### 2. Vier graue Striche, die zu einer unsichtbaren Seite gehörten

Am rechten Rand stand der Gliederungsstreifen (`#rand-toc`) — der von
Notion bekannte Satz kurzer Striche, einer je Überschrift. Er gehörte zur
zuletzt geöffneten Seite und hängt an `#main`; eine Produktwelt legt sich
darüber, ohne ihn anzufassen. Ein Klick sprang zu einem Block, der gar nicht
gezeichnet war, also nirgendwohin.

`weltSetzen` nimmt ihn jetzt weg. Neu gebaut wird er ohnehin bei jedem
Seitenaufruf.

### 3. Fünf von sieben Such-Platzhaltern brachen ab

```txt
1280 px Fenster → Feld 195 px

  „Titel, Pfad oder Alias …"              167   passt
  „Whiteboard oder Seite …"               180   bricht ab
  „Datenbank oder Ansicht …"              191   bricht ab
  „Vorlage oder Beschreibung …"           214   bricht ab
  „Aufgabe, Status oder Quelle …"         222   bricht ab
  „Termin, Datenbank oder Datumsfeld …"   277   bricht ab
```

Ein Platzhalter ist der einzige Hinweis darauf, wonach man in diesem Feld
suchen kann. Bricht er ab, ist er weg.

Die Suchzeile bricht jetzt um — aber nach der **eigenen** Breite, nicht nach
der des Fensters. Das ist der Punkt: bei 1280 px Fenster ist die Mittelspalte
366 px breit, bei 1680 px sind es 726. Ein `@media`-Ausdruck kann diesen
Unterschied gar nicht sehen, und genau deshalb stand die richtige Regel
(`grid-column:1/-1`) längst da — nur hinter `@media(max-width:760px)`, wo sie
bei 1280 px nie greift. `.aw-bereich` ist jetzt ein `container-type:
inline-size`, und die Regel hängt an `@container (max-width: 480px)`.

Container-Abfragen sind gewöhnliches CSS. Kein Paket, kein Bauschritt, §6
bleibt unberührt.

### 4. Und darunter: 120 von 390 Pixeln, die es nie gab

Die Ursache von 1 und 3 zusammen. Am Telefon blieben von 390 px genau 240
für den Inhalt übrig:

```txt
#page.wide          padding: 0 60px        aufbau.css      (1 Kennung, 1 Klasse)
.produkt-welt       padding: 10px 12px     produktwelten.css   (1 Klasse)
```

Beide gelten für dasselbe Element — eine Produktwelt wird in `#page`
gezeichnet, und `#page` trägt dabei auch `wide`. Die Regel mit der Kennung
gewinnt, ganz gleich, welche Datei später geladen wird. Die Telefonregel
stand seit jeher da und hat nie etwas bewirkt.

Die Produktwelt-Regeln sind jetzt ebenfalls mit `#page` geschrieben. Der
Inhalt am Telefon wuchs von 240 auf 336 px — vierzig Prozent mehr, in jeder
Ansicht, ohne dass eine einzige Ansicht angefasst wurde.

### Und ein fünfter Fehler, wieder in meiner eigenen Messung

Der Prüfpunkt, der Punkt 4 hätte finden sollen, mass `welt.clientWidth` —
und `clientWidth` ZÄHLT DIE INNENABSTÄNDE MIT. Mit den 60 px, die er finden
sollte, meldete er weiter 390 von 390 und blieb grün. Gemessen wird jetzt
`.aw-shell`, das erste Element ohne eigenen Abstand.

Dritter Fall in drei Tagen, in dem nicht das Produkt kaputt war, sondern die
Zeile, die es prüfen sollte (E145 `textContent`, E146 `|| -1`, hier
`clientWidth`). Der gemeinsame Nenner: eine Messung, die nur den grünen Fall
gesehen hat, ist keine Messung.

### Kann die Suite rot werden?

**test214**, vier Abschnitte über acht Ansichten und zwei Bildschirme, 16
Punkte. Vier Gegenproben einzeln auf einem Abzug des Baums zurückgenommen:

```txt
`#page.produkt-welt` wieder zu `.produkt-welt`  → §1 rot (270 von 390) UND §3
Zählerraster zurück auf drei feste Spalten      → §2 rot
`@container` auf 0px gesetzt                    → §3 rot
`rand-toc`-Wegnahme entfernt                    → §4 rot, alle acht Ansichten
```

§1 misst zusätzlich die Gegenrichtung (nichts steht über den Rand hinaus),
und §2/§3/§4 haben je einen Punkt davor, der prüft, dass überhaupt etwas zu
messen da war — ein leerer Bestand macht „nichts ist abgeschnitten" sonst
trivial wahr.


---

## E149 · Lernpfad und Arbeitssicht, endlich festgehalten

**25. August 2026.** In `doku/AUFTRAG-STAND.md` standen §9 und §14 mit
derselben Begründung als ◐ da: „Kein eigener Prüflauf". Beide Ansichten gibt
es seit langem, und beide waren ungeprüft — was heisst: jede Änderung an
`lernwelt.ts` konnte sie still kaputtmachen.

**test215**, sieben Abschnitte, 28 Punkte. Gebaut wurde nichts Neues; die
Suite hält fest, was da ist. Zwei Punkte sind mir dabei wichtiger als der
Rest.

### Der Punkt, der leicht kaputtgeht: XP ist kein Wissen

§9 verlangt ausdrücklich „fachlicher Fortschritt getrennt von XP". Das ist
kein Gestaltungswunsch. Eine Zahl, die aus Aktivität kommt, SIEHT aus wie
Wissen — und wer ihr glaubt, geht unvorbereitet in eine Prüfung.

Geprüft wird deshalb in beide Richtungen:

```txt
5000 XP, Level 42, 99 Tage Streak eingetragen
  → Themenfortschritt [100, 100, 50, 0]   unverändert

eine echte Wiederholung (sr.wdh 0 → 2)
  → Themenfortschritt [100, 100, 50, 100] geändert
```

Nur der erste Punkt allein hätte auch mit einer eingefrorenen Zahl bestanden.
Erst zusammen sagen die beiden etwas.

### Und der Punkt, an dem meine erste Fassung sich selbst betrog

§14 sagt wörtlich: „Meetingdaten aus dem bestehenden Besprechungssystem
wiederverwenden." Der Prüfpunkt dafür suchte die Notiz über `[data-lw-open]`
— und fand sie auch unter „Dokumente & PDFs", weil `dokumente()` schlicht
alle Seiten aufzählt. Mit dem Meeting-Abschnitt versuchsweise ganz entfernt
blieb der Punkt grün.

Er sucht jetzt IM Meeting-Abschnitt. Vierter Fall in drei Tagen, in dem die
Messung und nicht das Produkt der Fehler war — und der lehrreichste, weil er
nur beim Zurücknehmen aufgefallen ist. Eine Gegenprobe ist nicht Kür.

### Weiter geprüft

```txt
§1  ohne Karten sagt der Pfad es, statt Stufen zu erfinden
§2  vier absichtlich durcheinander angelegte Themen stehen in der
    Reihenfolge aus §9: Grundlagen → Ohm → Leistung → Lampenschaltungen
§3  keine Stufe ist gesperrt, jede trägt ihren Stand in Zahl und Wort
§4  ein Klick auf eine Stufe führt zum Thema
§5  alle sechs Rubriken aus §14, mit echten Daten belegt
§6  Meetings zeigen auf die Besprechungsseite selbst, und es gibt sie einmal
§7  ein Klick öffnet die Seite wirklich
```

### Kann die Suite rot werden?

Fünf Gegenproben, jede einzeln auf einem Abzug des Baums zurückgenommen:

```txt
Sortierung des Pfades umgedreht        → §2 rot (und §3 gleich mit)
`disabled` an die Stufenknöpfe          → §3 rot
XP in `topicProgress` einfliessen lassen→ §3 rot, beide Richtungen
Meeting-Eintrag auf eine Zweitschrift   → §6 rot
Meeting-Abschnitt ganz entfernt         → §5 UND §6 rot
```


---

## E150 · Der Dienst hinter „⌁ Erkennen" liegt jetzt bei

**25. August 2026.** L53 hielt fest: der Knopf „⌁ Erkennen" erwartet einen
Dienst unter `http://127.0.0.1:8765/ocr`, und Redion lieferte keinen mit und
beschrieb auch keinen. Der Eintrag nannte drei Möglichkeiten — mitliefern,
ausbauen oder ehrlich beschriften — und den Satz: „Ein Knopf, hinter dem
nichts ist, ist die schlechteste der drei."

Es ist die erste geworden.

### Warum nicht die dritte, die billigere

Der Code hinter dem Knopf ist vollständig und sorgfältig: Ausschnitt statt
ganzem Bild, Einwilligung bei jedem Mal, Grössen- und Zeitgrenzen, und eine
Adressprüfung, die eine Cloud-Adresse gar nicht erst speichern lässt. Das
alles wegzuwerfen, weil ein sechzig Zeilen langes Gegenstück fehlt, wäre die
teuerste der drei Möglichkeiten gewesen.

### Was dazugekommen ist

```txt
dienste/ocr.mts        der Dienst selbst
doku/OCR-DIENST.md     Anleitung: einrichten, Grenzen, Fehlersuche, Vertrag
recognition.ts         erklärt jetzt, BEVOR es nach einer Adresse fragt
```

Der Dienst nimmt `POST /ocr` mit einem Bild entgegen, ruft `tesseract` auf
und gibt `{ text, language, engine, version, confidence }` zurück — genau
das, was `recognition.ts` liest.

Vier Entscheidungen darin sind erklärungsbedürftig:

**Node, kein Paket.** `node dienste/ocr.mts` und sonst nichts — kein
`npm install`, kein Bauschritt. Ein Dienst, der erst eingerichtet werden
muss, wäre wieder das Problem, das er lösen soll (§6). Der multipart-Körper
wird deshalb von Hand zerlegt; das sind dreissig Zeilen.

**`spawn` ohne Shell.** Der Dateiname kommt aus dem Browser. Über eine Shell
wäre er eine Zeichenkette, die etwas bedeuten kann; als Element einer
Argumentliste ist er ein Dateiname und sonst nichts.

**Die Sprachangabe wird geprüft, nicht durchgereicht.** Sie kommt ebenfalls
aus dem Browser und landet in der Befehlszeile. Was nicht auf `^[a-z]{3}
(\+[a-z]{3})*$` passt, wird verworfen und durch die Vorgabe ersetzt.

**`listen(PORT, '127.0.0.1')`, nicht `listen(PORT)`.** Ohne die Adresse hört
Node auf allen Netzwerkkarten — ein Erkenner, an den jeder im selben WLAN
Bilder schicken kann.

Und eine Nicht-Entscheidung: `confidence` ist `null`. `tesseract stdout`
liefert keine Sicherheit mit, und eine hier hingeschriebene Zahl wäre eine
Behauptung über eine Messung, die nie stattgefunden hat.

### Der eigentliche Kern von L53 war nicht der fehlende Dienst

Er war die fehlende Auskunft. Wer zum ersten Mal auf „⌁ Erkennen" klickte,
bekam ein Eingabefeld mit der Frage nach einer Adresse — und keinen Hinweis
darauf, dass dahinter überhaupt ein Programm laufen muss, geschweige denn
welches. Selbst mit beiliegendem Dienst wäre das eine Sackgasse geblieben.

Jetzt steht davor ein Satz: was der Dienst tut, dass nichts ins Netz geht,
womit man ihn startet, und wo die Anleitung liegt.

### Und die Doku, die dem Stand widersprach

`doku/WAS-REDION-MEHR-KANN.md` sagte weiterhin „Kein OCR, keine
Transkripte". Der Satz ist berichtigt — und zwar nicht in „Redion kann OCR",
sondern in das, was stimmt: Bilder werden durchsuchbar, wenn der beiliegende
Dienst läuft; Tonspuren werden nach wie vor nicht abgetippt.

### Kann die Suite rot werden?

**test216**, neun Abschnitte, 32 Punkte — und mit einem Kunstgriff, auf den
es ankommt: die Prüfung legt ein eigenes `tesseract` in einen Ordner und
setzt `PATH` darauf.

Geprüft wird damit MEIN Dienst, nicht Tesseract. Die Suite läuft auf jedem
Rechner, und — wichtiger — der gute Weg wird WIRKLICH durchlaufen statt
übersprungen. Eine Prüfung, die sich selbst überspringt, wenn ein Programm
fehlt, ist genau die Prüfung, die nie rot wird.

Vier Gegenproben, alle auf einem Abzug des Baums zurückgenommen:

```txt
Sprachprüfung entfernt            → §3 rot, „deu; rm -rf /" kommt durch
`listen(PORT)` ohne Adresse       → §5 rot, von aussen erreichbar
ENOENT-Hinweis durch „Fehler."    → §6 rot, beide Punkte
`confidence: 0.95` erfunden       → §2 rot
```

§6 nimmt zusätzlich das Ersatzprogramm wieder weg — die Lage von L53, eine
Stufe weiter innen: der Dienst läuft, der Erkenner fehlt. Dann muss er
sagen, was fehlt und wo es steht.


---

## E151 · Am Telefon stand der Startknopf 188 Pixel unter der Falz

**25. August 2026.** §31 des Auftrags beschreibt die Telefonansicht nicht in
Worten, sondern als Bild:

```txt
Elektrotechnik
🔥 14 Tage

18 Karten fällig
5 neue
2 Fehler

[ Lernen starten ]

Darunter: Nächste Prüfung · Aufgaben · Fortschritt
```

Alles davon gibt es. Nur in der falschen Reihenfolge. Gemessen auf 390 × 844:

```txt
Begrüssung, Datum, Lernziel      322 px, bevor etwas zur Lernrunde kam
die vier Zahlen                  ab 713, zur Hälfte unter der Falz
„Tagesrunde starten"             y = 1032  →  188 px UNTER der Falz
```

Wer die App am Telefon aufmacht, um zehn Minuten zu lernen, musste erst
scrollen, um den Knopf zu finden. Am Rechner fiel das nie auf, weil dort
nichts unter einer Falz liegt — der ganze Bildschirm ist die erste Seite.

### Gedreht wird mit `order`, nicht mit einem zweiten Baum

```css
@media(max-width:760px){
  .lernwelt .lw-today>*{order:5}
  .lernwelt .lw-today>.lw-metrics{order:1}
  .lernwelt .lw-today>.lw-primary-grid{order:2}
  .lernwelt .lw-today>.lw-setup{order:3}
  .lernwelt .lw-today>.lw-hero{order:4}
}
```

Fünf Zeilen, und der Knopf steht bei y = 641 statt 1032. Wichtiger als die
Kürze ist, was NICHT passiert ist: es gibt keine zweite Baumstruktur für das
Telefon. Für ein Vorleseprogramm und für die Tastatur bleibt die Reihenfolge
dieselbe, und es gibt keinen zweiten Bauplan, der auseinanderlaufen könnte
(§52 des Auftrags: keine doppelte Architektur).

Am Rechner bleibt alles, wie es war. Eine Umstellung, die überall gälte, wäre
keine Antwort auf §31, sondern eine zweite Frage.

### Und die Reiterleiste, die nicht sagte, dass es weitergeht

Neben dem Startknopf fiel am selben Bild auf: von neun Reitern passen drei,
die Leiste rollt seitwärts — und nichts zeigte das an. Gemessen: 883 px
Inhalt in 364 px Breite, „Meine Fehler" endete mitten im Wort am Bildrand.

Ein abgeschnittenes Wort sieht aus wie ein Fehler, nicht wie eine Einladung
zum Wischen. Dieselbe Lösung wie bei der Markierungsleiste im PDF (E141): ein
Datenmerkmal `data-mehr`, aus dem die CSS einen Schatten an der jeweiligen
Kante macht. Kein Knopf und kein Pfeil — beides wäre etwas, woneben man
tippen kann.

### Und wieder ein Fehler in der Messung, nicht im Produkt

Der Punkt „Drei fällige Karten werden gezählt" las den Text der Kachel als
ein Stück: `3fälligSM-2-Wissensstand`. Zwei Sachen gingen dabei schief, und
die zweite ist die gefährlichere:

```txt
/\b3\b.{0,20}fällig/   falsch ROT — zwischen „3" und „fällig" ist keine
                       Wortgrenze, obwohl die Zahl stimmt
/\b2\b.{0,20}neu/      falsch GRÜN — die „2" stammte aus
                       „SM-2-Wissensstand", zwanzig Zeichen vor „3neu"
```

Ein Punkt, der aus dem falschen Grund grün ist, ist schlimmer als einer, der
aus dem falschen Grund rot ist: der rote fällt auf.

Gemessen wird jetzt `<strong>` und `<span>` getrennt — die Auszeichnung
trennt beides ohnehin — und verglichen wird mit dem, was im Speicher steht,
nicht mit einer Zahl aus der Prüfdatei.

### Kann die Suite rot werden?

**test217**, fünf Abschnitte, 24 Punkte. §1 und §2 waren vor dieser Änderung
rot — das ist keine Behauptung, das ist die Messung oben. Dazu zwei
Gegenproben, einzeln auf einem Abzug des Baums zurückgenommen:

```txt
die fünf `order`-Zeilen entfernt   → §1 und §2 rot (drei Punkte)
`reiterRollstand()` entfernt       → §3 und §4 rot (drei Punkte)
```

§4 misst die Gegenrichtung: am Rechner darf die Reihenfolge NICHT gedreht
sein und die Leiste keinen Hinweis tragen. §5 prüft, dass Telefon und
Rechner denselben Baum haben.


---

## E152 · Die unverteilte Aufgabe war für niemanden da (§41)

**25. August 2026.** §41 zählt sieben Dinge auf, die aus einer Besprechung
werden sollen, und stellt einen Satz daneben, der mehr wiegt als die Liste:

> Aufgabe aus Meeting bleibt normale Redion-Aufgabe.

Das ist §52 in einem Satz — keine zweite Aufgabenwelt neben der ersten.

`besprechung.ts` konnte alles davon schon: Audio, Transkript,
Zusammenfassung, Entscheidungen, Aufgaben, Zeitmarken, Themen, und die
Aufgaben zusätzlich als Zeilen in einer echten Datenbank. `AUFTRAG-STAND`
führte §41 trotzdem als ◐, mit der ehrlichsten Begründung, die dort steht:
„Welcher Prüflauf sie deckt, habe ich nicht nachgesehen."

Nachgesehen: test32 prüft den Seitenleisten-Abschnitt, test35 einen
Menüeintrag für die KI-Anweisung. Die Auswertung, die Seite, die Zeitmarken
und die Aufgaben-Datenbank waren ungeprüft.

### Und beim Prüfen fiel etwas heraus

Die Besprechung legt ihre Aufgaben in einer Datenbank mit der Spalte „Wer"
ab. Wer beim Sprechen keinen Namen nennt, hinterlässt sie leer.
`Bibliothek.meineAufgaben` entschied aber allein danach, OB es eine
Personenspalte gibt:

```js
const meins = personKey
  ? String(pr[personKey] || '').toLowerCase().includes(meinName.toLowerCase())
  : (row.erstelltVon || 'Ich') === meinName;
```

Eine leere Zelle hiess damit „gehört niemandem" — `''.includes('ich')` ist
falsch. Ausgerechnet die **unverteilte** Aufgabe, also die, an die sich sonst
niemand erinnert, stand in keiner einzigen Liste.

Die Regel für die leere Zelle ist jetzt dieselbe wie die für die fehlende
Spalte, und das ist kein Zufall: beide Male steht nirgends ein anderer Name.

Der erste Anlauf behielt den Vergleich mit dem Anleger für den zweiten Fall
bei. **Der war ebenfalls kaputt**, was erst das Messen zeigte — siehe E153,
wo die Regel ihre endgültige Form bekommt:

```js
const wer = personKey ? String(pr[personKey] || '').trim() : '';
const meins = !wer || wer.toLowerCase().includes(meinName.toLowerCase());
```

Eine Aufgabe, die auf einen anderen Namen läuft, bleibt weiterhin aus meiner
Liste — das war richtig und bleibt so.

### Was die Suite prüft, und was nicht

**test218**, sieben Abschnitte, 43 Punkte.

`auswerten()` fragt die KI; ohne Modell gibt es nichts zu messen, und mit
einem erfundenen Modell prüfte man die Erfindung. Geprüft wird deshalb alles
NACH der Auswertung: `seiteAnlegen` bekommt genau die Form, die der Auftrag
an die KI verlangt — nachgelesen in `besprechung.ts`, nicht erfunden. Die
Aufnahme braucht ein Mikrofon; §5 prüft stattdessen die Zeitrechnung ohne
Ton.

Ein Punkt gefällt mir besonders, weil er ohne Ansehen nicht auffiele: 62
Sekunden müssen als `01:02` dastehen — nicht als `00:62` und nicht als
`1:2`.

### Kann die Suite rot werden?

Drei Gegenproben, einzeln auf einem Abzug des Baums zurückgenommen:

```txt
leere Personenzelle wieder als „gehört niemandem"  → §2 rot
`audioRef` von den Zeitmarken genommen             → §3 rot (drei Punkte)
keine Zeile in der Aufgabendatenbank               → §2 und §7 rot (vier)
```

§7 ist die eingebaute Gegenrichtung: ein leeres Ergebnis darf KEINE
Abschnitte erfinden — ohne diesen Abschnitt wäre „die Seite hat den
Abschnitt" auch dann grün, wenn die Seite ihn immer hätte.

### Nebenbei gefunden: L56

`Store.addRow` setzt `erstelltVon` nie. Ohne Konto fällt das nicht auf, weil
beide Seiten des Vergleichs `'Ich'` sind. Mit einem benannten Konto dagegen
gehört keine Zeile aus einer Datenbank ohne Personenspalte mehr irgendwem.
Aus dem Quelltext gelesen, nicht am laufenden Programm nachgewiesen — und
deshalb als Lücke eingetragen statt nebenbei geändert.


---

## E153 · Wer sich einen Namen gab, verlor seine Aufgabenliste

**25. August 2026.** L56 hatte ich am selben Tag eingetragen — aus dem
Quelltext gelesen, nicht am Programm nachgewiesen, und mit dem Satz: „Erst
messen, wie ein benanntes Konto sich heute wirklich verhält."

Gemessen. Derselbe Bestand, geändert wurde nur der eigene Name in den
Einstellungen:

```txt
Name leer (also „Ich")    5 Aufgaben
Name „Redur"              0 Aufgaben
```

Nicht die zwei neuen Zeilen fehlten — **alle fünf**, auch die aus der
Willkommensseite. Wer sich in Redion einen Namen gibt, sah seine
Aufgabenliste leer, und nichts sagte ihm warum.

### Warum

`Bibliothek.meineAufgaben` entschied für eine Datenbank ohne Personenspalte
so:

```js
(row.erstelltVon || 'Ich') === meinName
```

`Store.addRow` schrieb `erstelltVon` aber nie — nur `addBlock` tut das. Für
jede Datenbankzeile war der Wert `undefined`, der Vergleich lief gegen den
Ersatzwert `'Ich'`, und `'Ich' === 'Redur'` ist falsch.

### Und warum der naheliegende Fix falsch gewesen wäre

Mein erster Anlauf war, `addRow` das Feld schreiben zu lassen. Das half
nicht: die Zeilen tragen dann den Namen, der beim Anlegen galt — und wer sich
später umbenennt, verliert rückwirkend, was er selbst angelegt hat. Gemessen
und verworfen.

Der Vergleich mit dem Anleger ist für diese Frage schlicht das falsche
Werkzeug. Die Regel steht jetzt in einem Satz:

> Eine gefüllte Personenzelle sagt, wem die Zeile gehört. Steht nirgends ein
> Name, gehört sie dem, der zusieht.

Auf einem Bestand, der auf diesem Gerät liegt, ist das die einzige Lesart —
und in einem geteilten Arbeitsbereich gibt es die Personenspalte genau dafür.

### Dieselbe Stelle noch einmal, zwanzig Dateien weiter

`lebensbereiche.ts` beantwortet dieselbe Frage für die Bereichsansicht — mit
demselben Vergleich und demselben Fehler. Zwei Listen, die „meine Aufgaben"
verschieden beantworten, sind schlimmer als eine, die es schlecht tut; genau
das hat E147 bei der Suche gekostet. Beide Stellen tragen jetzt dieselbe
Regel, und test218 §9 prüft, dass die zweite nicht heimlich zurückfällt.

### `addRow` schreibt `erstelltVon` trotzdem

Nicht als Behebung — sie ist es nicht —, sondern weil das Feld gebraucht
wird und fehlte:

```txt
dienst.ts:394        der Eigenschaftstyp `createdBy` las `row.erstelltVon`
                     und bekam nie etwas: jede „Erstellt von"-Spalte zeigte
                     den GERADE angemeldeten Namen statt des Anlegers
schnittstelle.ts     dasselbe beim Notion-artigen Export
steuerung.ts:3777    dasselbe in der Zeilenhistorie
```

Jeder andere Block trägt das Feld seit jeher (`indexdb.ts`, Zeile 378). Dass
Datenbankzeilen die Ausnahme waren, ist genau die Art Inkonsistenz, auf die
der nächste wieder hereinfällt.

### Kann die Suite rot werden?

**test218 §8 und §9**, sechs Punkte, an eine Suite angehängt, die schon
43 hatte — die Frage „wem gehört eine Aufgabe" gehört an eine Stelle.

Gegenprobe: die alte Besitzregel zurückgesetzt, auf einem Abzug des Baums.
Rot werden drei Punkte, und der aussagekräftigste ist der aus §8: mit dem
Namen „Redur" bleibt von drei erwarteten Zeilen genau eine übrig — „Eigene
Zeile" aus der Datenbank ohne Personenspalte verschwindet, und das ist der
Fall aus L56 in einer Zeile Ausgabe.


---

## E154 · Der Obsidian-Rundlauf, endlich einmal ganz durchgelaufen (§43)

**25. August 2026.** §43 verlangt nichts Neues, sondern dass etwas
Bestehendes nicht kaputtgeht:

> Bestehenden stabilen Import/Export erhalten. Keine Regression: redion-id ·
> Pfad · Aliase · Wikilinks · Reimport · keine unnötigen Duplikate

Das ist die Sorte Anforderung, die ohne Prüflauf wertlos ist — „keine
Regression" kann nur etwas heissen, wenn jemand nachsieht. Der Resolver aus
E129 stand; niemand lief den Weg einmal ganz durch.

**test219** tut das jetzt: einen echten kleinen Vault exportieren, das Archiv
wieder auspacken, einlesen — und dann NOCH EINMAL einlesen.

### Was ich dabei falsch erwartet habe

Mein §4 hiess zuerst „Ohne redion-id trägt der Pfad" und erwartete, dass eine
Datei ohne Kennung über ihren `redion-path` wiedererkannt wird. Das Produkt
tut bewusst das Gegenteil, und der Kommentar dort sagt auch warum:

> Nur beide stabilen Anker gemeinsam erlauben ein destruktives Update. Eine
> passende ID ODER ein passender Pfad allein kann aus einer fremden Datei
> kopiert sein.

Ein Pfad ist eben kein Geheimnis. Wer eine `Elektro/Normen und Regeln.md` in
seinen Ordner legt, hat damit noch kein Recht auf meine Seite. Fehlt die
Kennung, entsteht eine getrennte Fassung, und der Bericht zählt sie als
Konflikt. §46 in einer Regel: lieber eine Seite zu viel als eine zerstörte.

Der Abschnitt prüft jetzt genau das — und ist dadurch wertvoller geworden,
nicht schwächer.

### Und was ich beim Zählen falsch gemacht habe

§6 zählte alle Seiten mit dem Titel „Normen und Regeln" und fand vier statt
zwei. Kein Produktfehler: §4 hinterlässt absichtlich zwei getrennte
Fassungen, und die zählten mit. Gemessen wird jetzt der Unterschied zwischen
vorher und nachher — welche Seiten DIESER Import angelegt hat —, nicht der
Bestand.

Dasselbe beim „+1": der Import legt ausser der Notiz auch eine Vault-Wurzel
(`Aus Obsidian · Fremder-Vault`) und die Ordnerseite an. Eine Zahl wie „+1"
wäre eine Behauptung über die Ordnerstruktur gewesen, nicht über das
Wiedererkennen. Geprüft wird deshalb der Satz aus dem Bericht:
`1 Notizen (1 neu, 0 wiedererkannt)`.

### Kann die Suite rot werden?

Drei Gegenproben auf einem Abzug des Baums, und die mittlere ist die, auf
die es ankommt:

```txt
Titel als dritter Anker in `pathCandidates`   → nichts. Ein Titel hat nicht
                                                 die Form eines Pfades; die
                                                 Gegenprobe griff gar nicht.
Nach Titel verschmelzen, wenn sonst nichts    → SIEBEN Punkte rot, darunter
  passt (genau die Regression aus E129)         „Ihr eigener Text steht noch
                                                 da — Ganz andere Notizen."
                                                 Die fremde Datei hatte die
                                                 lokale Seite aufgefressen.
`redion-id` aus dem Export weggelassen        → 13 Seiten → 26 → 39.
                                                 Die Verdopplungskaskade aus
                                                 „keine unnötigen Duplikate".
```

Die erste Gegenprobe ist die lehrreichste: sie hat NICHT gegriffen, und
deshalb steht sie hier. Eine Gegenprobe, die nichts bewirkt, beweist nichts —
sie muss durch eine ersetzt werden, die den Schaden wirklich anrichtet.


---

## E155 · Der Weg zurück zur Quelle (§44)

**25. August 2026.** §44 steht in einem Satz und zwei Beispielen:

> Jedes abgeleitete Wissensobjekt sollte, wenn vorhanden, zurückspringen
> können.
>
>     Karte → PDF → Seite 14 → Ausschnitt
>     Aufgabe → Meeting → 00:07

### Die Angabe war da. Der Weg nicht.

Nachgesehen, statt gebaut: seit E129/E130 trägt jedes abgeleitete Objekt
einen `sourceRef` — Art, Seite, Block, Beschriftung, Seitenzahl und sogar den
Ausschnitt in normierten Koordinaten. Auch `App.zeigeBlock` gab es längst:
Seite öffnen, hinrollen, kurz hervorheben, und beim Dokumentmodus vorher die
richtige Seite wählen.

Gelesen hat den `sourceRef` genau eine Stelle — `document-mode.ts` — und
zwar in die ANDERE Richtung: „welche Karten gehören zu dieser PDF-Seite".

Der Rückweg fehlte. Die Karte wusste, woher sie kam; man kam nur nicht hin.

### Vierzig Zeilen, an der Stelle, wo schon eine solche Marke steht

Direkt neben der Tonmarke aus E152 (`audioRef`) und der Kommentarmarke: ein
Knopf, der sagt, wohin er führt.

```txt
↩ PDF · Seite 14        aus einem eingelesenen Skript
↩ A4-Blatt              aus einem beschriebenen Blatt
↩ Bauleitung KW 35      aus einer Besprechung oder Notiz
```

Zwei Entscheidungen darin:

**Er nennt das Ziel, nicht sich selbst.** „Quelle" wäre ein Wort, das man
anklicken muss, um es zu verstehen. „PDF · Seite 14" ist eine Auskunft.

**Ein Ziel, das es nicht mehr gibt, bekommt keinen Knopf.** Nicht einen
grauen, nicht einen mit Fehlermeldung — gar keinen. Das ist die Lehre aus
E118: ein Weg, der ins Leere führt, ist schlimmer als ein fehlender, weil man
ihn erst nach dem Klick als solchen erkennt.

### Was §44 damit noch nicht ganz erfüllt

Das erste Beispiel ist vollständig: Karte → PDF → Seite 14, und der
Ausschnitt steht in den Daten. Beim zweiten reicht es bis „Meeting", nicht
bis „00:07" — nicht aus Nachlässigkeit, sondern weil die Angabe nicht
existiert: die KI gibt Aufgaben als `{ was, wer, bis }` zurück, ohne Zeit.
Sie über einen Textabgleich zu erraten wäre schlechter als sie wegzulassen —
eine Zeitmarke an der falschen Stelle lässt einen glauben, die Aufnahme sei
kaputt. Als **L57** eingetragen, mit dem sauberen Weg dazu.

### Kann die Suite rot werden?

**test220**, fünf Abschnitte, 21 Punkte. Zwei Gegenproben, einzeln auf einem
Abzug des Baums zurückgenommen:

```txt
`sourceRef` nicht mehr gelesen          → ZEHN Punkte rot: kein Knopf, kein
                                           Sprung, keine der beiden Richtungen
Knopf auch bei totem Ziel               → §4 rot
```

§4 ist die Gegenrichtung und die wichtigere Hälfte — und sie hat selbst noch
eine: die verwaiste Karte MUSS es geben, und ihre Quellenangabe muss noch in
den Daten stehen. Sonst prüfte der Punkt bloss, dass die Karte fehlt.

§5 prüft, dass die Angabe eine Sicherung übersteht. Ein Rücksprung, der beim
Sichern verlorengeht, ist keiner.

**Angesehen** (§55): `node bilder.mts quelle` zeigt alle drei Fälle auf einer
Seite — aus einem Skript, aus einer Besprechung, und einen getippten Absatz
ohne Knopf.


---

## E157 · Ein Prüflauf, der wartet, sieht aus wie einer, der rechnet

**25. August 2026.** Der vollständige Durchgang stand 25 Minuten still. Keine
Meldung, kein Fehler, kein Abbruch — nur ein Lauf, der nicht weiterging.
Gefunden erst durch einen Blick auf die Änderungszeit der Protokolldatei:

```txt
zuletzt geschrieben   03:05:40
jetzt                 03:29:31
```

### Die Ursache war meine eigene Änderung von vorhin

E150 hat `Recognition.configure()` einen Satz vorangestellt: bevor nach einer
Adresse gefragt wird, erklärt ein Fenster, was zu tun ist — „starte
`node dienste/ocr.mts`, die Anleitung steht in `doku/OCR-DIENST.md`". Das war
der eigentliche Kern von L53, und es ist richtig so.

`test202` ersetzt für seinen Abschnitt aber nur `Dialog.frage`, nicht
`Dialog.wahl`. Die Erklärung öffnete deshalb ein ECHTES Fenster und wartete
auf einen Klick, der in einem Prüflauf nie kommt. `page.evaluate` wartete
mit.

Dieselbe Lehre wie beim Nachtrag zu E147, und diesmal teurer: **wer eine
Funktion ändert, muss suchen, wer sie prüft.** `grep -l "Recognition.configure"
pruefungen/` hätte gereicht — zwei Sekunden gegen fünfundzwanzig Minuten.

### Und die Lehre, die nicht bei mir liegt

`pruefungen/alle.mts` hatte keine Uhr. Ein Lauf, der hängt, und einer, der
rechnet, sahen für den Durchgang gleich aus — und für den Menschen davor
auch. Das ist eine Eigenschaft der Werkzeugkette, nicht ein Ausrutscher.

Der Durchgang misst jetzt die **Stille**, nicht die Gesamtdauer:

```txt
keine Ausgabe für 5 Minuten  →  beenden, benennen, weitermachen

  ⏳ test202.mts hat 5 Minuten nichts gemeldet — wird beendet.
  ✗ 1 von 186 Läufen gescheitert:
      test202 (hängt — nach 5 Minuten Stille beendet)
```

Gemessen wird bewusst die Stille: manche Läufe rechnen lange und melden dabei
fleissig. Der längste ehrliche Abstand zwischen zwei Zeilen liegt bei den
grossen Sicherungsläufen unter zwei Minuten.

### Kann die Uhr rot werden — und bleibt sie sonst still?

Beides auf einem Abzug des Baums geprüft, mit der Grenze auf sechs Sekunden:

```txt
ein Lauf, der schweigt und die Ereignisschleife am Leben hält
  → beendet, benannt, Durchgang läuft weiter          ✓

ein Lauf, der 15 s rechnet und alle 3 s eine Zeile meldet
  → überlebt vollständig                              ✓
```

Die erste Gegenprobe war beim ersten Versuch **wertlos**: ein `await new
Promise(() => {})` allein lässt Node von selbst aussteigen („unsettled
top-level await"), der Lauf endete also ohne die Uhr. Erst mit einem
`setInterval` daneben hängt er wirklich. Eine Gegenprobe, die den Schaden
nicht anrichtet, beweist nichts — dritter Fall an diesem Tag.

Die zweite Richtung ist die wichtigere: eine Uhr, die gesunde langsame Läufe
abschiesst, wäre schlimmer als keine.


---

## E156 · Am Telefon fehlten die Ränder — an drei Stellen

**25. August 2026.** Angefangen hat es mit einem Bildschirmfoto des
Dokumentmodus (§55) und einem Verdacht, den ich zuerst für einen Lesefehler
hielt: der Seitentitel schien am Bildrand zu kleben.

### Erstens: „Volle Breite" gab weniger Breite

```txt
390 px Telefon
  gewöhnliche Seite    28 px Rand   →  334 px Inhalt
  „Volle Breite"       60 px Rand   →  270 px Inhalt
```

Der Modus, den man wählt, um MEHR Platz zu bekommen, gab ein Fünftel
weniger — und man wählt ihn am Telefon eher als am Rechner.

Die Ursache steht im selben Block wie die von E148:

```txt
aufbau.css      #page.wide{ padding:0 60px 40vh }     1 Kennung + 1 Klasse
bausteine.css   #page{ padding-left: … }  (Telefon)   1 Kennung
```

Die Telefonregel verliert, obwohl ihre Datei später geladen wird. Im
Kommentar direkt darüber steht bereits die Erinnerung an eine FRÜHERE
Auseinandersetzung mit der Spezifität dieser Zeile. Dreimal dieselbe Falle an
derselben Kennung ist kein Zufall mehr: `#page` mit Zustandsklassen darauf
ist ein Ort, an dem jede spätere Regel nachweisen muss, dass sie gilt.

**`:not(.produkt-welt)` ist dabei kein Schmuck.** Eine Produktwelt wird
ebenfalls in `#page` gezeichnet und trägt auch `wide`. Ohne den Ausschluss
hätte die neue Zeile gegen `#page.produkt-welt{padding:10px 12px}` aus E148
gewonnen — gleiche Spezifität, spätere Datei — und den Produktwelten genau
die Pixel zurückgenommen, die E148 ihnen geholt hat. Beim Vorbereiten
aufgefallen, bevor es passiert ist; test221 §3 hält es fest.

### Zweitens: der Aufmacher ragte aus dem Bild

`.cover` zieht sich mit einem negativen Rand über die Seitenränder hinaus,
damit das Bild bis an die Kante geht. Am Telefon standen dort weiter die
Zahlen vom Rechner — 96 bzw. 60 px gegen einen Rand von 28. Gemessen: der
Aufmacher begann bei −32 und endete bei 422 auf einem 390 px breiten Schirm.

### Drittens: im Dokumentmodus fehlte der Rand ganz

Und hier war das Bildschirmfoto im Recht, meine erste Messung dagegen nicht:
sie nahm eine gewöhnliche Seite und fand brave 28 px. Der Dokumentmodus hat
eine eigene Regel, `.document-page{padding-inline:0!important}`.

Für die Arbeitsfläche ist das richtig — eine PDF-Seite soll am Telefon von
Kante zu Kante gehen. Zeichen, Titel und Werkzeugzeile stehen aber im selben
Kasten und verloren ihren Rand mit:

```txt
Tinte des Titels     x = 0     am Bildschirmrand
Werkzeugzeile        0 .. 408  achtzehn Pixel über den rechten Rand hinaus
```

Die 408 kommen von `margin-right:-18px` — einem Kniff, mit dem die
schiebbare Zeile in den Seitenrand hineinlaufen darf, statt an ihm
abzuschneiden. Ohne Seitenrand läuft sie aus dem Bild. Im Dokumentmodus ist
der Kniff jetzt aus.

### Und die Messung, die es nicht gesehen hätte

Mein erster Prüfpunkt las `getBoundingClientRect().left` und wäre grün
geblieben: ein Innenabstand verschiebt den INHALT, nicht das Rechteck. Gemessen
wird jetzt die Tinte — ein Bereich um das erste Zeichen. Dasselbe wie
`clientWidth` in E148, nur andersherum, und der vierte Fall an diesem Tag, in
dem die Messung und nicht das Produkt der Fehler war.

### Kann die Suite rot werden?

**test221**, fünf Abschnitte, 20 Punkte. Fünf Gegenproben, einzeln auf einem
Abzug des Baums zurückgenommen:

```txt
alte Telefonregel (`#page` ohne `.wide`)      → §1 rot: 270 gegen 334
`:not(.produkt-welt)` weggelassen             → §3 rot: E148 zurückgedreht
Aufmacher wieder mit den Rechner-Zahlen       → §2 rot: −32 bis 422
Kopf im Dokumentmodus ohne Rand               → §5 rot: drei Teile bei x=0
negativer Rand der Werkzeugzeile bleibt       → §5 rot: 408 auf 390 px
```

§4 ist die Gegenrichtung und verhindert die faule Lösung: am RECHNER muss
„Volle Breite" deutlich mehr geben als die gewöhnliche Seite. Wer die Ränder
überall gleichmacht, macht §4 rot. Und §5 prüft mit, dass die Arbeitsfläche
selbst randlos BLEIBT — der Rand gehört dem Kopf, nicht dem Dokument.


## E158 · Sechs Bereiche standen in keinem Katalog (L51, §5 Regel 2)

CLAUDE.md §5 Regel 2 ist ein Satz lang: „Neuer Bereich = zwei
Register-Einträge." L51 hielt am 24. August fest, dass sechs Module diese
Regel nicht einhalten — Lernwelt, Arbeitswelt, Lebensbereiche, Electrical,
Recognition und DocumentMode hingen ausschliesslich an `globalThis`.

Im Betrieb war das kein Fehler. Es lief; jeder Knopf, der sie aufrief, rief
sie auf. Der Preis stand woanders, und er ist unsichtbar, solange niemand
danach fragt: **ein Modul ohne Eintrag ist für jede Übersicht unsichtbar.**
Auch für die nächste Prüfung, die „alle Bereiche" durchgehen will. Auch für
die Hilfe. Auch für den Menschen, der wissen will, was diese App eigentlich
alles kann.

Also stehen die sechs jetzt in `src/register/module.ts`, und
`pruefungen/lauf/test222.mts` ist genau die Prüfung, die es vorher nicht
geben konnte.

### Was die Prüfung prüft — und warum nicht das Naheliegende

Das Naheliegende wäre: sind die Einträge da? Das ist eine Liste, die sich
selbst zählt, und sie beweist nichts. Geprüft wird deshalb, dass jeder
Eintrag etwas TUT:

    Register.module.oeffne(id)   muss true ergeben
    ohne zu werfen
    und danach muss sich am Bildschirm etwas geändert haben

Die dritte Zeile ist die, auf die es ankommt. Sie hat beim ersten Lauf
sofort einen Fehler gefunden, und zwar meinen eigenen.

### Der Fund: ein Eintrag, der seinen Nachbarn nachspricht

`lebensbereiche` rief `Produktwelten.workspace('uebersicht')` auf —
dieselbe Zeile wie `arbeitswelt` direkt darüber. Da `arbeitswelt` in der
Schleife unmittelbar davor lief, war die Arbeitswelt bereits offen, und der
Bildschirm blieb, wie er war. Die Prüfung meldete `["lebensbereiche"]`.

Das ist E118 mit einem anderen Namen: ein Katalogeintrag, der etwas
verspricht und nichts aufmacht. Nur ist er hier schlimmer als ein toter
Knopf, denn er behauptet zusätzlich, ein eigener Bereich zu sein.

Der Grund war ein Denkfehler beim Eintragen. **Lebensbereiche sind kein
Bildschirm.** Sie sind ein kleines Metafeld am schon vorhandenen Objekt
(`bereiche/wissen/lebensbereiche.ts`, ausdrücklich „keine eigenen
Speicher"). Der eine Ort, an dem man sie wirklich anfasst, ist die Zuordnung
zur offenen Seite — dieselbe, die im Seitenmenü unter „Lebensbereiche
zuordnen" hängt. Genau die macht der Eintrag jetzt auf. Ohne offene Seite
sagt er, dass er eine braucht, statt zu schweigen.

### Der zweite Fund: eine Meldung, die niemand messen konnte

`dokumentmodus` sollte melden, warum er gerade nicht kann. Die Prüfung sah
nie eine Meldung — und der Fehler lag bei der Prüfung, nicht am Produkt.
Sie suchte `.toast` und `.toasts > *`. Beides gibt es nicht.

`Hinweis.toast` schreibt in EIN festes Element, `#toast` in `index.html`,
und blendet es über die Klasse `show` ein. Es wächst keine Kachelliste. Eine
Prüfung, die nach einer Kachelliste sucht, findet nie etwas — und wäre bei
einem stummen Modul genauso grün geblieben wie bei einem redenden. §55.2 in
einem Satz: eine Prüfung, die immer „passt schon" sagt, ist keine Prüfung.

Gemessen wird jetzt am `#toast`-Element, und zwar zweiteilig: erst leeren,
dann auslösen, dann Text UND `show` lesen. Beides ist nötig. Ein alter Text,
der stehenbleibt, wäre sonst ein falsches Grün; ein Text, der geschrieben
aber nie gezeigt wird, ebenfalls.

### Die Gegenproben (§55.2)

Vier, einzeln an einem Abzug des Baums gesetzt und gemessen:

| Gegenprobe | rot |
|---|---|
| A · die sechs Einträge wieder aus dem Register nehmen | 9 |
| B · `lebensbereiche` zurück auf `workspace('uebersicht')` | 1 |
| C · `dokumentmodus` steigt wortlos aus | 3 |
| D · `Hinweis.toast` schreibt den Text, zeigt ihn aber nie | 2 |

B ist der Fehler oben, rückwärts nachgestellt: genau ein Punkt, genau der
richtige. D beweist, dass die `show`-Messung trägt und nicht Zierrat ist.

### Und ein Kollateralschaden, der eine eigene Lehre ist

test86 hatte die Zeile `p('Acht Bereiche', r.module === 8, …)`. Sie ging
rot, weil sechs Module eingetragen wurden — also weil etwas RICHTIG gemacht
wurde. Eine festgeschriebene Zahl prüft nichts als sich selbst; sie schlägt
bei jeder legitimen Erweiterung an, und ein Alarm, der bei richtigen
Änderungen losgeht, wird beim zweiten Mal weggeklickt.

Geprüft wird dort jetzt der Vertrag statt der Zahl: `anzahl()` muss zur
Länge von `alle()` passen, und die acht Ursprünglichen müssen drin sein.
Gegenprobe: `anzahl: () => 8` fest verdrahten — rot, „8 gezählt, 14 in der
Liste". Welche sechs dazugekommen sind, prüft test222 namentlich, und dort
gehört es auch hin.

### Was NICHT erledigt ist

Die Seitenleiste. „Lernzentrum" und „Workspace" stehen als feste Zeilen in
`index.html` (Zeilen 144 und 147), nicht in `Register.navigation`. Das ist
der zweite Teil von L51 und ein eigener Umbau der Seitenleiste — hier
absichtlich nicht mitgemacht, damit dieser Schritt eine Sache bleibt. L51
bleibt deshalb offen und sagt jetzt genauer, was noch fehlt.


## E159 · Ein schwarzer Schatten auf schwarzem Grund (L58)

**25. August 2026.** L58 hielt fest, dass die Werkzeugzeile über dem
Seitentitel am Telefon rollt, ohne es zu zeigen — 617 px Inhalt in einem
390 px breiten Kasten. Erreichbar war alles; sichtbar war nichts. Und L58
schloss mit einem Satz, der sich als halb richtig herausstellte:

> Dass die Lösung dreimal fast gleich aussieht, ist selbst ein Hinweis: es
> gehört ein gemeinsamer Helfer daraus gemacht.

### Erst der Helfer

Es gab ihn schon: `kern/helfer/rollrand.ts`, gebaut für die Tabellen. Nur
kannten ihn die zwei älteren Stellen nicht, und beide rechneten dieselben
drei Zeilen noch einmal:

```txt
lernwelt.ts     scrollLeft > 2 …          data-mehr am Element selbst
pdf/marken.ts   scrollLeft > 2 …          data-mehr am ELTERNTEIL
rollrand.ts     scrollLeft > SPIEL …      data-rand, weiche Kante
```

Zusammengelegt wird jetzt die RECHNUNG, nicht die Darstellung. `binde` nimmt
eine Wahl entgegen:

```ts
Rollrand.binde(leiste, { art: 'mehr' })            Knopfleisten
Rollrand.binde(tools,  { art: 'mehr', an: row })   PDF: rollt tools, malt row
Rollrand.binde(feld)                               Tabellen, weiche Kante
```

`an` ist kein Zierrat. Im PDF rollt `.blatt-tools`, gezeichnet wird an
`.blatt-reihe` — nimmt man die Angabe weg, gehen drei Punkte in test210 rot.
Gegengeprüft, nicht angenommen.

### Und dann das Hinsehen

Für die neue Stelle schrieb ich den Schatten ab, der bei `.lw-nav` steht:

```css
box-shadow:-14px 0 14px -8px rgba(0,0,0,.34)
```

Die neue Prüfung war grün. Sie mass die berechnete Deckkraft des
Pseudo-Elements, fand 1, und meldete „der Schatten ist wirklich da".

Auf dem Bildschirmfoto war nichts. Schwarz mit 34 % über einer Fläche von
`#141414` ist kein Schatten, sondern eine Rechnung ohne Wirkung.

Also nachgesehen, wie es an der Stelle aussieht, von der ich abgeschrieben
hatte — und dort war es genauso. Die Reiterleiste der Lernwelt, dunkles
Thema, 390 px:

```txt
☀ Heute   📕 Lernen   🧭 Lernpfad   🧩 Meine Fehle│
```

Eine scharfe Kante mitten im Wort. Genau der Zustand, den E151 beheben
wollte, und die Prüfung dazu war seit dem 25. August grün — weil sie das
Datenmerkmal las und nicht das Bild.

### Was stattdessen dasteht

Ein Verlauf in die Farbe der Fläche, auf der er liegt:

```css
background:linear-gradient(to left, var(--bg-side), transparent)
```

Er endet dort, wo er liegt, und trägt deshalb im hellen wie im dunklen
Thema. Dieselbe Antwort steht seit E140 an der linken Kante von
`.blatt-reihe` — mit `--bg-card` — und war dort von Anfang an richtig; sie
war nur nie auf die zwei anderen Stellen übertragen worden.

Die zwei Streifen sind `position:sticky` mit negativem Aussenabstand: sticky,
damit sie nicht mit dem Inhalt wegrollen, und der negative Abstand, damit sie
die Knöpfe nicht 26 px weit vor sich herschieben.

### Was jetzt geprüft wird — und was nicht

| Punkt | Prüfung |
|---|---|
| `data-mehr` folgt dem Rollstand | test221 §6, test217 §3, test210 |
| Die Kante wird eingeblendet (Deckkraft) | test221 §6 |
| Es ist ein VERLAUF, kein Schatten in fester Farbe | test221 §6, test217 §3 |
| Und der Streifen hat Breite | test217 §3 |

Die dritte Zeile ist die Lehre aus diesem Eintrag. Sie beweist nicht, dass
man die Kante SIEHT — das kann keine dieser Zahlen. Sie hält fest, welche
ART von Kante gebaut wurde, und geht rot, wenn jemand zum Schatten
zurückkehrt. Ob man etwas sieht, bleibt eine Frage ans Bild (§55), und genau
deshalb steht dieser Vorbehalt auch im Prüflauf selbst.

### Die Gegenproben (§55.2)

| Gegenprobe | rot |
|---|---|
| A · `Rollrand.binde` an der Werkzeugzeile entfernen | 7 in test221 |
| B · das Merkmal steht, die CSS blendet nichts ein | 3 in test221 |
| C · `an: row` im PDF weglassen | 3 in test210 |
| D · `.lw-nav` zurück auf den schwarzen Schatten | 2 in test217 |

D ist die eine, die es vorher nicht geben konnte: der Fehler, mit dem dieser
Eintrag anfing, ist jetzt einer, der auffällt.


## E160 · Ein Katalog, den niemand liest, wird still falsch (L51 Teil 2)

**25. August 2026.** E158 trug sechs Bereiche in `Register.module` ein. Der
zweite Teil von L51 hiess: „Lernzentrum" und „Workspace" stehen als feste
Zeilen in `index.html`, nicht in `Register.navigation`. Das klang nach zwei
Zeilen Nachtrag. Nachgezählt war es etwas anderes.

### Was dastand, und was stimmte

Der Kopf von `register/navigation.ts` sagte:

> Hier steht die Ordnung. Die Seitenleiste liest sie und zeichnet, was sie
> findet — mehr nicht.

Gemessen im Browser, nicht geschätzt:

```txt
45   Zeilen zeichnet die Seitenleiste
12   Einträge kannte das Register
 1   Aufruf las davon:  anPlatz('unten').filter(x => x.tun && x.vonAussen)
```

Das Register war nicht die Ordnung. Es war ein Anhängepunkt für fremde
Bereiche, mit einer Liste daneben, die aussah wie eine Wahrheit.

### Und deshalb war es kaputt

Ein Katalog, den niemand ausführt, verrottet ohne Geräusch. Drei Einträge:

| Eintrag | rief auf | ist aber |
|---|---|---|
| `suche` | `Werkzeuge.palette()` | die Befehlspalette, eine Zeile tiefer |
| `posteingang` | `Werkzeuge.meldungen()` | die Meldungsliste, nicht der Posteingang |
| `ki` | `App.kiPanel()` | eine Zeile, die die Seitenleiste nirgends zeigt |

Keiner dieser Fehler konnte auffallen. Der Knopf „Suchen" in der
Seitenleiste rief seit jeher `suche` aus `schale.ts`; der Registereintrag
daneben behauptete etwas anderes und wurde nie ausgeführt. Genau das ist der
Preis, den L51 gemeint hat — nur teurer als dort vermutet.

### Was jetzt gilt

Das AUSSEHEN bleibt in `index.html`: neun Knöpfe, Reihenfolge, Beschriftung,
Tastenkürzel. Die HANDLUNG steht im Register, einmal. `schale.ts` hängt sie
über `knopfId` an:

```ts
Register.navigation.anPlatz('oben').forEach(e => {
  if (e.knopfId && e.tun) an(e.knopfId, …e.tun…);
});
```

Wo vorher acht Zeilen `an('btn-…', …)` standen, steht jetzt eine Schleife —
und daneben kein zweites, abweichendes Verzeichnis mehr.

`test222 §5` hält beide aneinander: gleiche Anzahl, gleiche Folge Knopf für
Knopf, gleiche Beschriftung, gleiche Kürzel. Wer eine Zeile im Markup
umbenennt und das Register vergisst, macht sie rot — und umgekehrt.

### Warum die Seitenleiste NICHT aus dem Register zeichnet

Das wäre der reinere Weg, und er ist heute der falsche. Register und
Seitenleiste sind so weit auseinander, dass „ab jetzt zeichnet das Register"
sechs Zeilen verschieben würde: `bibliothek` steht dort unter `unten` und
wird oben gezeichnet, `vorlagen` steht unter `unten` und erscheint bei den
Werkzeugen, `ki` stünde plötzlich in der Leiste.

Das ist eine Umstellung der Seitenleiste, um die niemand gebeten hat. Erst
muss der Katalog stimmen; dann kann er zeichnen. Der Reihenfolge halber:
diese Entscheidung macht Schritt eins, und die Prüfung sorgt dafür, dass er
stimmen BLEIBT.


### Und noch ein Fund, diesmal von mir selbst gemacht

Als die Handlung ins Register wanderte, blieb `an('btn-new', …)` in
`schale.ts` stehen. Die neue Schleife hängte dieselbe Zeile ein zweites Mal
an — ein Klick auf „Neue Seite" legte **zwei** Seiten an. Gemessen: 13
Seiten vorher, 15 nachher.

Alle acht Punkte von §5 blieben dabei grün. Die Listen stimmten ja, und
„macht die Zeile etwas auf?" ist bei zwei Seiten genauso wahr wie bei einer.
Ein doppelt angehängter Knopf ist nur zu sehen, wenn man ZÄHLT — also zählt
§5 jetzt, und Gegenprobe D stellt die doppelte Zeile wieder her: rot,
„ist 2, soll 1".

Das ist die vierte Messung in diesem Durchgang, die aus dem falschen Grund
grün war. Ein Punkt, der aus dem falschen Grund grün ist, fällt niemandem
auf — das steht seit E145 in dieser Datei, und es stimmt jedes Mal wieder.

### Die Gegenproben (§55.2)

| Gegenprobe | rot |
|---|---|
| A · das alte Register zurück (vier Einträge, `ki`, falsche Aufrufe) | 7 |
| B · eine Zeile nur im Markup umbenennen | 1 |
| C · die Schleife in `schale.ts` entfernen | 3 |
| D · `an('btn-new', …)` wieder danebenstellen | 1 |

A ist der Zustand von gestern, rückwärts nachgestellt. Er meldet unter
anderem „Suchen öffnet die Suche — {suchfeld:false}": der Fehler, mit dem
dieser Eintrag anfängt, ist jetzt einer, der auffällt.

### Was offen bleibt

36 der 45 gezeichneten Zeilen stehen weiter in keinem Register — die
Werkzeuge, die Apps-Liste, die untere Gruppe. Sie haben grösstenteils nicht
einmal eine Kennung im Markup. Das steht in L51 und ist der nächste Schritt,
nicht dieser.


## E161 · Der Weg zurück in die Besprechung — und drei Sachen, die dabei auffielen (L57, §44)

**25. August 2026.** §44 des Auftrags nennt zwei Beispiele für den Weg
zurück zur Quelle. Das erste steht seit E155:

```txt
Karte    → PDF     → Seite 14 → Ausschnitt     ✅ E155
Aufgabe  → Meeting → 00:07                     hier
```

L57 hielt fest, was fehlt: die Sekunde. Und L57 schrieb dazu, der Rest sei
erledigt — „die Aufgabe findet ihre Besprechung, geprüft in test220 §3".

Das stimmte nicht.

### Fund 1: das Produkt schrieb gar keine Herkunft

test220 §3 baut sich seinen `sourceRef` von Hand und prüft damit den
Zeichner: erscheint der Knopf, nennt er die Besprechung, springt er hin. Das
ist richtig und beweist die halbe Sache.

`besprechung.ts` legte Aufgabenblock und Datenbankzeile aber ohne jede
Herkunft an. Der Knopf, den test220 prüft, wäre an einer echten
Besprechungsaufgabe **nie erschienen**. Eine Prüfung mit selbstgebautem
Fixture kann das nicht sehen — sie prüft den Zeichner, nicht den Erzeuger.

Also schreibt `seiteAnlegen` jetzt beides: den `sourceRef` am Todo-Block auf
der Besprechungsseite und denselben an der Zeile in „Aufgaben aus
Besprechungen". Und test223 geht den PRODUKTWEG, nicht den Fixture-Weg.

### Fund 2: das Ziel war da und unsichtbar

Das volle Transkript steht in einer Aufklappzeile, die zu ist. Ihre Kinder
werden gezeichnet und stehen auf `display:none`.

`rolleZu` sucht `[data-bid=…]`, **findet** das Element, rollt hin, hebt es
hervor und meldet Erfolg. Zu sehen ist nichts.

Das betrifft jeden Tieflink in eine zugeklappte Zeile, nicht nur diesen.
`zeigeBlock` klappt die Vorfahren jetzt auf, bevor es rollt.

Die Prüfung dazu misst deshalb die HÖHE der Zielzeile und nicht ihr
Vorhandensein — und die Gegenprobe zeigt genau, warum: ohne das Aufklappen
bleibt „Die Zielzeile steht im Bild" **grün** und nur „Und sie ist wirklich
zu sehen" wird rot.

### Fund 3, der eigentliche Auftrag: die Sekunde

Die KI wird jetzt danach gefragt:

```txt
"aufgaben":[{"was":…,"wer":…,"bis":…,"sek":0}]

Bei „sek" trägst du die Zeitmarke der Zeile ein, in der die Aufgabe
besprochen wird — die Zahl aus [mm:ss] am Zeilenanfang, umgerechnet in
Sekunden. Bist du dir nicht sicher, lässt du „sek" weg.
```

Und geglaubt wird die Antwort nur, wenn das Protokoll wirklich eine Zeile
mit dieser Zeit enthält. L57 hat den Grund schon aufgeschrieben: eine
Zeitmarke, die an der falschen Stelle landet, ist schlechter als gar keine —
man hört hin, hört etwas anderes und hält die Aufnahme für kaputt.

Die Prüfung dafür braucht kein Modell. `Meeting.seiteAnlegen` bekommt ein
Ergebnis mit drei Aufgaben: `sek: 7` (die Zeile gibt es), `sek: 999` (die
gibt es nicht) und gar keine Angabe. Die erste bekommt Zeit und Ziel, die
anderen beiden zeigen auf die Besprechungsseite und tragen keine Zeit.

### Was der Knopf sagt

```txt
↩ Bauleitung KW 35 · 25.8.2026 · 00:07     mit Zeitmarke
↩ Bauleitung KW 35 · 25.8.2026            ohne
```

Das Datum kommt aus dem Seitentitel, und der Editor nimmt bewusst den
aktuellen Titel und nicht das eingefrorene Etikett — wer die Seite
umbenennt, soll den neuen Namen sehen.

`zeit` steht als fertiger Text im `sourceRef`, neben der Zahl `sek`. Der
Editor darf `bereiche/verbinden` nicht kennen (CLAUDE.md §5 Regel 1), und
eine zweite Formatierfunktion wäre genau die Abschrift, die E159 eben erst
zusammengelegt hat.

### Die Gegenproben (§55.2)

| Gegenprobe | rot |
|---|---|
| A · kein `sourceRef` am Aufgabenblock | 7 |
| B · die genannte Sekunde ungeprüft glauben | 2 |
| C · `klappeAuf` in `zeigeBlock` weglassen | 2 |
| D · kein `sourceRef` an der Datenbankzeile | 3 |

C ist die lehrreichste: „steht im Bild" bleibt grün, „ist wirklich zu sehen"
wird rot. Genau dieser Unterschied war Fund 2.

### Was offen bleibt

Ob ein echtes Modell brauchbare Sekunden liefert, steht hier nicht. Geprüft
ist die Hälfte, die Code ist: die Frage wird gestellt, und eine falsche
Antwort wird verworfen. Die andere Hälfte braucht ein Modell zum Messen und
bleibt in L57 stehen — kleiner als vorher, aber offen.


## E162 · „Karten: 3, Lernstand 67 %" — für eine Prüfung ohne eine einzige Karte (L49)

**25. August 2026.** L49 stand seit dem 24. mit dem Satz da:

> Die Zuordnung Prüfung → Karten ist reine Wortsuche (`passendeKarten`) und
> fällt bei null Treffern auf ALLE Karten zurück.

E136 hatte darauf reagiert und `nurPassendeKarten` neben `passendeKarten`
gestellt — ohne Rückfall, für die Kachel „Prüfungsfokus". Der Kommentar
dazu ist bemerkenswert genau:

> Für die Kachel „Prüfungsfokus" wäre es eine Unwahrheit — sie verspricht
> „passend zur nächsten Prüfung", und wer dann alles bekommt, merkt es nicht.

Derselbe Satz galt an drei weiteren Stellen, und dort stand er nicht.

### Was zu sehen war

Zwei Karteikarten über Photosynthese im Bestand, eine Prüfung „Ohmsches
Gesetz". Die Prüfungszentrale zeigte:

```txt
Ohmsches Gesetz
Fachlicher Lernstand              67 %
KARTEN 3   FEHLER 0   AUFGABEN 0   ZEITLIMIT 45 Min.
[Simulation starten]
```

Drei Karten, von denen keine mit der Prüfung zu tun hat. Ein Lernstand von
67 %, der den Stand der Biologie-Karten misst. Und ein Knopf, der eine
Übungsklausur aus eben diesen Karten startet, ohne es zu sagen.

Wer sich darauf vorbereitet, sieht „67 % — läuft doch" und lernt nichts.

### Was jetzt dasteht

```txt
Ohmsches Gesetz
Fachlicher Lernstand               0 %
KARTEN 0   FEHLER 0   AUFGABEN 0   ZEITLIMIT 45 Min.
[Simulation aus allen Karten]
```

`passendeKarten` gibt es nicht mehr; es blieb nur die ehrliche Fassung.
Drei Aufrufer waren umzustellen: die Zahl in der Liste, der Balken und die
Simulation.

**Der Rückfall selbst bleibt** — bei der Simulation, denn eine Übungsklausur
aus allem ist besser als keine. Er steht jetzt an der Aufrufstelle statt
versteckt in der Funktion, und er sagt sich zweimal an: im Knopftext und
beim Starten.

```txt
Zu „Ohmsches Gesetz" passt keine Karte.
Die Simulation nimmt deshalb aus allen 3 Karten.
```

Der Unterschied ist nicht, dass etwas weniger geht. Es geht genau so viel
wie vorher — nur wird nichts Falsches mehr behauptet.

### Die Gegenproben (§55.2)

| Gegenprobe | rot |
|---|---|
| A · den Rückfall wieder in die Funktion legen | 5 |
| B · `nurPassendeKarten` gibt immer nichts zurück | 3 |
| C · stumm zurückfallen, ohne Meldung | 2 |

B ist die, die es braucht. Ohne §4 — die Prüfung MIT eigenem Stoff — hätte
man diese Suite auch mit „überall 0" bestanden, und das wäre kein
Fortschritt, sondern der nächste Fehler.

### Und ein Punkt, der aus dem falschen Grund grün war

Die erste Fassung von §1 prüfte „Der Lernstand ist 0 %" mit Karteikarten
ohne jeden Lernstand. Er war damit in BEIDEN Fassungen 0 % — der Punkt wäre
auch ohne die Behebung grün gewesen, und das Bildschirmfoto vorher/nachher
sah an dieser Stelle gleich aus.

Die Karten der Prüfung tragen jetzt `wdh: 2`. Damit zeigt die alte Fassung
67 % und die neue 0 %, und der Punkt misst etwas. Das ist derselbe Fehler
wie in §55.2 beschrieben, nur an meiner eigenen Prüfung — und er fiel beim
Ansehen des Bildes auf, nicht beim Lesen des Codes.

### Was von L49 bleibt

Zwei Punkte, beide unberührt:

* Die Prüfungszentrale hat kein Gedächtnis — Simulationsergebnisse liegen
  in `zustand.simulation` und sind nach dem Reiterwechsel weg.
* Der Lernpfad ist eine geordnete Liste, und seine Reihenfolge hängt an elf
  fest verdrahteten deutschen Elektro-Stichwörtern.

Und eine Zeile in L49 stimmt nicht mehr: „`bilder.mts` kennt die Lernwelt
nicht". Es gibt `lernzentrale`, `lernpfad`, `fehler` und `pruefungen` als
Ansichten. Berichtigt.


## E163 · Zwanzig bewertete Aufgaben, weg mit einem Klick (L49)

**25. August 2026.** L49 hielt fest: „Die Prüfungszentrale hat kein
Gedächtnis: Simulationsergebnisse liegen nur in `zustand.simulation` und
sind nach dem Reiterwechsel weg."

Nachgesehen, und es ist genau so. `wechseln()` setzt `zustand.simulation`
auf null. Wer eine Simulation zu Ende macht, das Ergebnis ansieht und dann
auf „Heute" tippt, hat die Bewertung von bis zu dreissig Aufgaben verloren —
ohne Warnung und ohne Weg zurück.

Das ist nicht der schlimmste Datenverlust, den es gibt: gespeichert war es
nie. Aber es ist Arbeit, die der Mensch geleistet hat, und die Frage „werde
ich besser?" lässt sich ohne sie gar nicht stellen.

### Wo es hingehört

`Store.setMeta(metaSchluessel('simulationen'), …)` — dieselbe Ablage, in der
schon `tagesziel` und `ansicht` derselben Welt stehen. Das ist der richtige
Ort und nicht bloss der bequeme: `meta` gehört zum Sicherungsformat
(§52.10), das Ergebnis überlebt also Export und Import.

**Die Karten stehen NICHT darin.** Sie sind Blöcke im Bestand und dürfen
umbenannt, verschoben oder gelöscht werden; eine Zweitschrift wäre die
zweite Wahrheit, die §17 verbietet. Festgehalten wird das Ergebnis — Zahlen
und Themennamen —, und das ist auch das, was man später ansehen will.

**Begrenzt auf zwanzig.** Ein Verlauf, der still unbegrenzt wächst, ist
genau das, was §15 verbietet.

### Und man sieht es

```txt
LETZTE SIMULATIONEN
Photosynthese Test                                          50 %
25. Aug. 2026 · 1 von 2 richtig · 1 Min.
```

Fünf Zeilen, der Rest in einer Aufklappzeile. Ohne diesen Abschnitt wäre die
Ablage ein Datensatz, den niemand sieht — und ein Wert, den man nicht
ansehen kann, ist so gut wie keiner (E118).

### Ein zweites Schloss an derselben Tür

Die erste Fassung hatte neben der Kennung noch eine Sperrvariable
`gesichert`, damit ein zweites Zeichnen nicht doppelt schreibt.

Die Gegenprobe entfernte sie — und die Prüfung blieb grün. Dann entfernte
sie beides — immer noch grün. Der Grund: `simulationAbschliessen` lief in
der Prüfung überhaupt nur EINMAL, und der Punkt „genau ein Eintrag, nicht
drei" prüfte damit gar nichts.

Zwei Berichtigungen daraus:

* Die Prüfung zeichnet jetzt dreimal neu, bevor sie zählt. Damit läuft die
  Funktion wirklich mehrfach, und der Punkt kann rot werden: mit einer
  unstabilen Kennung meldet er „ist 7, soll 1".
* Die Sperrvariable ist weg. Was Doppelte verhindert, ist die KENNUNG —
  `sim-<gestartet>` ist für einen Durchgang immer dieselbe, und der Eintrag
  ersetzt seinen Vorgänger. Ein zweites Schloss an derselben Tür, das sich
  nicht prüfen lässt, führt den nächsten Leser in die Irre.

### Die Gegenproben (§55.2)

| Gegenprobe | rot |
|---|---|
| A · nichts festhalten | 3 |
| B · die Kennung nicht stabil halten | 1 („ist 7, soll 1") |

### Was von L49 bleibt

Ein Punkt: der Lernpfad ist eine geordnete Liste, und seine Reihenfolge
hängt an elf fest verdrahteten deutschen Elektro-Stichwörtern. Das ist kein
Fehler, sondern eine Grenze — und die nächste eigene Aufgabe.


## E164 · Ein Pfad, der ordnet — und einer, der nur so aussieht (L49)

**25. August 2026.** Der letzte offene Punkt aus L49:

> Der Lernpfad ist eine geordnete Liste, kein Lernpfad im Sinne des
> Auftrags — und seine Reihenfolge ist auf elf deutsche Elektro-Stichwörter
> fest verdrahtet.

Nachgesehen, und die Sache liegt anders, als der Satz vermuten lässt.

### Die elf Wörter sind keine Nachlässigkeit

```txt
grundlagen · spannung · strom · widerstand · ohm · reihe
parallel · leistung · energie · lampe · prüfung
```

Das ist die Folge aus **§9 des Auftrags**, und `test215 §2` hält sie fest:
vier durcheinander angelegte Themen müssen als Grundlagen → Ohmsches Gesetz
→ Leistung und Energie → Lampenschaltungen dastehen. Sie zu ersetzen hiesse,
eine Vorgabe zu brechen — und zwar eine, die für ihren Zweck richtig ist.

Also bleiben sie. Was nicht bleiben konnte, ist etwas anderes.

### Was wirklich falsch war

Der Kopf der Seite sagte, unabhängig davon, was im Bestand liegt:

> Der Pfad ordnet den Stoff. Er sperrt nichts künstlich.

Bei Biologie trifft keines der elf Wörter. `rang()` gibt allen Themen
denselben Wert, die Sortierung fällt auf den Alphabet-Vergleich zurück, und
die Seite behauptet trotzdem, sie habe geordnet.

Das ist die gefährlichere Sorte Fassade. Eine alphabetische Liste sieht wie
Didaktik aus, wenn sie sich Lernpfad nennt und durchnummeriert ist — Stufe 1
Calvin-Zyklus, Stufe 2 Lichtreaktion, Stufe 3 Zellatmung. Wer dem folgt,
folgt dem Anfangsbuchstaben.

### Was jetzt dasteht

Der Kopf sagt nur noch, was in beiden Fällen stimmt:

> Der Pfad zeigt den Stoff als Stufen. Er sperrt nichts künstlich.

Und darunter steht, WAS geordnet hat — dieselbe Idee wie der Kasten „Warum
diese Reihenfolge?" in der Lernzentrale, den es dort längst gibt:

```txt
mit Vorgabe   Diese Reihenfolge kommt aus den Elektro-Grundlagen.
              Grundlagen, Spannung, Strom, … Was darin nicht vorkommt,
              steht danach in alphabetischer Folge — Redion errät keine
              Abhängigkeiten zwischen Themen.

ohne Vorgabe  Für diesen Stoff gibt es keine hinterlegte Reihenfolge.
              Die Stufen stehen alphabetisch. Redion errät keine
              Abhängigkeiten zwischen Themen; eine geratene Reihenfolge
              sähe aus wie Didaktik und wäre keine.
```

### Warum keine allgemeine Reihenfolge

Weil es die Daten nicht gibt. Eine Reihenfolge zwischen Themen ist eine
Abhängigkeitsangabe, und Redion hat keine — weder aus den Karten noch aus
den Seiten. Sie zu erraten (nach Fehlerzahl, nach Fälligkeit, nach
Anlagedatum) ergäbe eine Liste, die sich fachlich begründet gibt und es
nicht ist. Das wäre schlechter als die offensichtlich alphabetische.

Wenn es einmal Abhängigkeiten gibt, ordnet der Pfad danach. Bis dahin sagt
er, was er hat.

### Die Gegenproben (§55.2)

| Gegenprobe | rot |
|---|---|
| A · immer von Elektro-Grundlagen sprechen | 2 in §8 |
| B · dem Kasten sein Kennzeichen nehmen | 6 (§3 und §8) |

Und §8 ist selbst die Gegenrichtung zu §3: ohne ihn bestünde die Prüfung
auch mit einem Kasten, der IMMER dasselbe sagt.

### Damit ist L49 abgearbeitet

```txt
Rückfall auf alle Karten                E162
Kein Gedächtnis der Prüfungszentrale    E163
Elf verdrahtete Stichwörter             E164 — sie bleiben, die Behauptung
                                        daneben nicht
```


## E165 · Ein Knopf, der aussieht, als täte er nichts — und die Farbe mitnimmt (L40)

**25. August 2026.** L40 nennt es seit dem 19. August als offenen Punkt:

> Farbe, Schriftgrösse und Schriftart je Block (E101). Markdown kennt sie
> nicht. Sie zu Platzhaltern zu machen hiesse, den Knopf abzuschaffen.

Nachgesehen, wie das aussieht. Eine Seite mit Serif-Überschrift, roter
Warnzeile, gelb hinterlegtem Punkt und einer grösseren Schlusszeile. Dann
„Quelltext ansehen → Übernehmen", **ohne eine einzige Änderung**:

```txt
vorher    Serif · rot · gelb hinterlegt · gross
nachher   grau  · grau · grau            · grau
```

Der Knopf sieht aus, als täte er nichts. Er nimmt etwas mit.

### Warum das nicht am Format liegt

`block.color` und `block.stil` (Grösse und Schriftart) haben keine
Schreibweise in `# `, `- ` oder `> `. Daran ändert sich nichts. Aber sie
müssen den Weg auch gar nicht mitgehen — sie liegen ja noch da, bis
`Store.kinderLeeren` sie wegräumt.

Also: vor dem Leeren merken, nach dem Bauen wieder aufsetzen.

### Wonach zugeordnet wird, und warum nicht nach Position

Nach **(Art, Text)**, und jeder gemerkte Eintrag wird höchstens einmal
vergeben.

Nach Position wäre einfacher und ist die falsche Antwort. Wer eine Zeile
einfügt, verschiebt alle darunter; positionsweise zugeordnet bekäme dann
jede Zeile die Farbe ihrer Vorgängerin. Das ist schlimmer als gar keine
Farbe, weil es aussieht wie eine Entscheidung. Die Gegenprobe zeigt es
wörtlich: „Und die neue Zeile bekommt KEINE fremde Farbe — ist `red`".

Nach Text zugeordnet folgt die Formatierung ihrem Satz, auch wenn er
umzieht. Und wer den Text ändert, verliert sie für diese Zeile — das ist
ehrlich, denn es ist eine neue Zeile.

Das „höchstens einmal" ist ebenfalls geprüft: zwei gleichlautende Sätze in
verschiedenen Farben behalten jeder seine. Ohne die Sperre meldet die
Prüfung `green,green` statt `green,orange`.

### Was das NICHT ist

Nicht der Umbau, den L40 beschreibt. Die Blöcke werden weiterhin geleert
und neu gebaut, also **ändern sich die Kennungen**. Stabile Kennungen und
ein brauchbarer Rückgängig-Schritt bleiben offen — sie brauchen die echte
zeilenweise Abgleichung, und die ist ein Umbau von `ausMarkdown`.

Was hier steht, ist der Datenverlust. Der ist weg.

### Die Gegenproben (§55.2)

| Gegenprobe | rot |
|---|---|
| A · nichts wiederherstellen | 6 |
| B · nach Position statt nach Text zuordnen | 6 |
| C · gemerkte Einträge nicht verbrauchen | 1 |

### Und noch eine festgeschriebene Zahl

test187 prüfte `mdTraegt(b)` auf **genau drei** Vorkommen im Quelltext. Sie
ging rot, weil E165 zwei weitere hinzufügte — also weil etwas richtig
gemacht wurde. Derselbe falsche Alarm wie „Acht Bereiche" in test86 (E158),
und dieselbe Behebung: geprüft wird jetzt der Vertrag — die Liste steht
einmal da, mehrere Stellen fragen dieselbe Funktion, und niemand schreibt
eine zweite Blockart-Liste ab.

Zwei feste Zahlen in zwei Tagen, beide aus demselben Grund rot. Eine Zahl
in einer Prüfung ist fast immer die falsche Frage.

### Und ein Messfehler von mir

`gleich` in test187 vergleicht mit `===`, nicht über JSON — zwei gleich
aussehende Felder sind darin nie gleich. Die erste Fassung gab Felder hinein
und meldete „ist [...], soll [...]" mit identischem Text auf beiden Seiten.
Jetzt als Zeichenkette.


## E166 · Zwanzig Apps, zwei Listen (L58, CLAUDE.md §5 Regel 2)

**25. August 2026.** E160 hat die oberste Gruppe der Seitenleiste ans
Register gehängt und dabei festgehalten, was noch fehlt: 36 der 45
gezeichneten Zeilen standen in keinem Katalog. Die grösste zusammenhängende
Gruppe davon sind die zwanzig unter „Meine Apps".

### Was dastand

In `seitenleiste.ts` eine Datentabelle:

```txt
['kalender',  '📅', 'Kalender',        'Termine aus allen Quellen'],
['pwa',       '📱', 'App installieren','Auf dem Telefon oder Rechner ablegen'],
…zwanzig Zeilen…
```

Und vierzig Zeilen darunter eine Kette:

```txt
if (a === 'kalender') Kalender.dialog();
if (a === 'pwa')      PWA.installieren();
…zwanzig Zweige…
```

Zwei Listen für dieselben zwanzig Dinge. Wer eine App hinzufügte, musste an
beide denken; wer eine umbenannte, an eine. Genau die Lage, die E160 eine
Gruppe weiter oben aufgelöst hat — und dort hatte sie schon drei falsche
Einträge erzeugt, weil eine der beiden Listen nie ausgeführt wurde.

### Was jetzt dasteht

Ein Eintrag je App in `Register.navigation`, mit Zeichen, Namen,
Hinweistext und Handlung. Die Seitenleiste zeichnet daraus:

```ts
const appliste = Register.navigation.anPlatz('apps');
apps.innerHTML = appliste.map(x => `<button data-app="${esc(x.id)}" …`).join('');
```

Und der Klick sucht seinen Eintrag, statt zwanzig `if` durchzugehen. Ein
Fehler in einer Handlung geht in den Reporter, wie beim Anhängepunkt weiter
unten — ohne ihn nähme ein Fehler die ganze Leiste mit.

Der Unterschied zu §5 der Prüfung: dort bleibt das Markup in `index.html`
und das Register liefert nur die Handlung. Hier zeichnet die Seitenleiste
wirklich aus dem Register. Beides ist richtig — dort steht das Markup fest,
hier entsteht es ohnehin zur Laufzeit.

### Gemessen, dass sich nichts bewegt hat

```txt
gezeichnete Zeilen vorher   45
gezeichnete Zeilen nachher  45      Zeile für Zeile identisch
Registereinträge vorher     17
Registereinträge nachher    37
```

Der Vergleich ist wörtlich: derselbe Durchgang durch `#sidebar .side-item`
vor und nach der Änderung, `diff` ohne Ausgabe.

### Was die Prüfung kann und was nicht

test222 §6 vergleicht Register und Bildschirm. Anders als §5 sind das aber
nicht zwei Quellen, sondern eine Quelle und ihre eigene Ausgabe — wer im
Register einen Namen ändert, ändert beides, und die Gegenprobe dazu bleibt
richtigerweise grün.

Geprüft wird deshalb der ZEICHNER: dass er nichts weglässt, nichts umordnet
und den Hinweistext nicht verwechselt. Und dass keine der zwanzig Zeilen
tot ist. Beides steht so im Prüflauf, damit niemand mehr hineinliest.

### Die Gegenproben (§55.2)

| Gegenprobe | rot |
|---|---|
| A · einen Namen im Register verstellen | 0 — und das ist richtig |
| B · der Zeichner nimmt nur die ersten zwölf | 4 |
| C · der Klick macht nichts mehr auf | 1, mit allen zwanzig Kennungen |

A steht mit in der Tabelle, weil eine Gegenprobe, die NICHT beisst, genauso
eine Aussage ist: sie sagt, was dieser Abschnitt nicht prüft.

### Was von L58 bleibt

Von 45 Zeilen stehen jetzt 29 im Register. Die übrigen 16 sind
grösstenteils keine Katalogeinträge, sondern Inhalt:

```txt
7   Journal, Schnellnotizen, Vorlagen, Graph, Schlagwörter,
    Karteikarten, Umsetzungsstand   — Systemseiten, also Nutzerdaten
3   angeheftete Seiten              — Nutzerdaten
1   Willkommen                      — eine Seite
2   „Neuer Agent", „Neue Besprechungsnotiz"   — Handlungen, gehören ins Register
3   Importieren, Papierkorb, Tastenkürzel     — haben Kennungen, hängen in schale.ts
```

Ein Register für Seiten wäre falsch: Seiten sind Daten und stehen im Baum.
Offen bleiben damit fünf Zeilen, nicht 36 — und das ist eine Grössenordnung,
die in einen Nachmittag passt statt in einen Plan.


## E167 · Der Fuss der Seitenleiste, und was dort NICHT hingehört (L58)

**25. August 2026.** Nach E166 blieben von L58 fünf Zeilen. Drei davon
stehen im Fuss der Seitenleiste — Importieren, Papierkorb, Tastenkürzel —,
fest in `index.html` und verdrahtet in `schale.ts`. Genau die Form, die
E160 für die oberste Gruppe aufgelöst hat.

Zwei davon sind jetzt Registereinträge mit `knopfId`, und dieselbe Schleife
in `schale.ts` hängt sie an: `anPlatz('oben')` und `anPlatz('fuss')`.

### Warum ein eigener Platz

`fuss` statt `oben`, weil test222 §5 die oberste Gruppe Zeile für Zeile mit
`.side-nav .side-item` vergleicht. Zwei Einträge mehr unter `oben` hätten
diesen Vergleich rot gemacht, ohne dass sich am Bildschirm etwas ändert —
und eine Prüfung, die aus dem falschen Grund rot wird, ist so wenig wert
wie eine, die aus dem falschen Grund grün ist.

### Warum `btn-import` bleibt, wo er ist

Sein Menü braucht das Klickereignis, um sich an der richtigen Stelle zu
öffnen (`e.currentTarget.getBoundingClientRect()`), und der Menüaufbau ist
fünfundzwanzig Zeilen lang. Beides gehört in die Schale, nicht in einen
Katalog der Seitenleiste. Ein Registereintrag, der eine Menüdefinition
trägt, wäre kein Katalog mehr.

### Und die zwei Knöpfe in ihren Abschnitten

„Neuer Agent" und „Neue Besprechungsnotiz" stehen je als einzelne Zeile am
Ende ihres Abschnitts, direkt neben den Daten, aus denen der Abschnitt
entsteht. Es gibt dort keine zweite Liste, die abdriften könnte. Ein
Registereintrag brächte Umweg ohne Gewinn.

Ein Katalog verdient seinen Platz, wenn es viele gleichartige Dinge gibt
oder wenn sonst zwei Listen entstünden. Beides trifft hier nicht zu.

### Der Punkt, auf den es ankommt

`btn-trash` hing an einer `an(...)`-Zeile. Bliebe sie neben der
Registerschleife stehen, wäre der Knopf **zweimal** verdrahtet — der Fehler
aus E160, bei dem ein Klick auf „Neue Seite" zwei Seiten anlegte und alle
acht neuen Prüfpunkte grün blieben.

Also zählt §7 die Fenster: nach einem Klick auf den Papierkorb muss genau
**ein** Überlager offen sein.

| Gegenprobe | rot |
|---|---|
| A · `an('btn-trash', …)` wieder danebenstellen | 1 — „ist 2, soll 1" |
| B · den Fuss nicht mit verdrahten | 1 — „ist 0, soll 1" |

Dieselbe Zahl in beide Richtungen, und beide Male aus dem richtigen Grund.

### Und ein Fehler aus E166, den erst der volle Lauf fand

E166 hat die Apps `app-kalender`, `app-bib`, `app-kann` … genannt, weil die
Kennungen im Register eindeutig sein müssen und `bibliothek`, `aufgaben`
und `papierkorb` dort schon vergeben waren. Damit änderte sich ohne Not
auch der Wert im Markup:

```txt
vorher    <button data-app="bib">
nachher   <button data-app="app-bib">
```

Die zehn Suiten, die ich nach der Änderung einzeln laufen liess, waren
grün. Der volle Durchgang war es nicht: `test33` und `test61` fassen die
Knöpfe über `[data-app="bib"]`, `[data-app="aufgaben"]` und
`[data-app="kann"]` an — drei Zeilen, dreissig Sekunden Zeitüberschreitung.

**Repariert wurde die Produktseite, nicht die Prüfung.** Ein `data-app`-Wert
ist eine Adresse nach aussen: eigenes CSS und eigene Erweiterungen dürfen
darauf zeigen, und dann bricht ein Umbenennen etwas, das mit dem Umbau
nichts zu tun hat. Die Einträge tragen jetzt eine `marke` — den alten,
kurzen Wert —, und die Registerkennung darf daneben heissen, wie sie mag.

Die Lehre ist nicht neu und trotzdem jedes Mal dieselbe: eine Auswahl von
zehn Suiten ist eine Vermutung darüber, wer betroffen ist. Der volle Lauf
ist die Messung.

### Damit steht L58

```txt
9   oberste Gruppe          E160
20  Meine Apps              E166
2   Fuss                    E167
11  Systemseiten, angeheftete Seiten, „Willkommen"   — Inhalt, kein Katalog
3   btn-import, Neuer Agent, Neue Besprechungsnotiz  — mit Begründung dort
```


## E168 · Sieben Quellenangaben, die ins Leere zeigten

**25. August 2026.** `doku/AUFTRAG-STAND.md` schliesst mit einem Satz über
sich selbst:

> Und die Prüflaufnummern in dieser Tabelle sind NACHGESEHEN, nicht
> erinnert. […] Eine falsche Quellenangabe ist schlimmer als keine — sie
> schickt den Nächsten an eine Stelle, an der nichts steht.

Der Satz stimmte für die Tabelle. Für die übrige Dokumentation nicht.

### Nachgezählt

`test225` liest AUFTRAG-STAND, ENTSCHEIDUNGEN und LUECKEN, sammelt jede
Nennung der Form `testNNN` samt Abschnittsangabe und fragt zweierlei: gibt
es die Datei, und gibt es den Abschnitt?

```txt
109  Nennungen von Prüfläufen
 35  davon mit Abschnittsangabe
  6  zeigten ins Leere
```

Fünf davon sind derselbe Fall. E78 beschloss am 8. August die
React-Zielarchitektur und beschrieb ihre fünf Wächter — `test149`,
`test150`, `test151`, `test153`, `test154`. E80 widerrief sie am Tag
darauf, und die Dateien gingen mit dem Rohbau. Der Eintrag beschreibt sie
weiter im Präsens: „`test149` wacht über die drei Regeln."

Er bleibt stehen — Geschichte löscht man nicht —, sagt jetzt aber oben
dazu, dass es diese Prüfläufe nicht mehr gibt.

Die sechste stand in der Tabelle:

```txt
| 54 | Offline first | ✅ | test31 §3 (Service Worker, Server aus …) |
```

test31 hat gar keine nummerierten Abschnitte; es ist eine ältere Suite mit
einer flachen Liste. Geprüft ist die Sache sehr wohl — Service Worker,
Ablage, Server aus, Seite neu geladen —, nur die Adresse war erfunden.

### Und eine siebte, die es gar nicht gab

Der erste Wurf von `test225` meldete zusätzlich einen siebten:

```txt
ENTSCHEIDUNGEN.md: test137 §55
```

Den Verweis gibt es nicht. In ENTSCHEIDUNGEN steht der Name am Zeilenende,
und der nächste Absatz beginnt mit `§55.2`. Mein Muster spannte über den
Zeilenumbruch.

Das ist die Sorte Fehler, vor der §55.2 warnt, nur andersherum: eine
Prüfung, die aus dem falschen Grund ROT wird, ist so wenig wert wie eine,
die aus dem falschen Grund grün ist. Beide kosten dasselbe — man glaubt
ihnen nicht mehr.

### Die Ausnahmeliste, und warum sie eine ist

Die fünf Namen aus E78 stehen in `test225` als `GESCHICHTE`. Eine
Ausnahmeliste ist ehrlich, wenn sie kurz ist, benannt und begründet — und
wenn sie selbst geprüft wird. Zwei Punkte tun das:

* Die fünf müssen wirklich fehlen. Stünde einer wieder da, wäre die
  Ausnahme eine Lüge.
* E78 muss die Vergangenheitsform tragen. Ohne den Satz dort wäre die
  Ausnahme eine stille Abmachung zwischen Prüfung und Prüfer.

### Ein Selbstbezug, der auffiel

Die Berichtigung in der Tabelle wollte erst schreiben: „Hier stand …" —
mit dem alten Verweis im Fliesstext. Damit stand er wieder da, und test225
fand ihn erneut. Dann passierte dasselbe in diesem Eintrag hier.

Zweimal derselbe Fehler in zehn Minuten ist kein Zufall, sondern eine
fehlende Regel. Sie steht jetzt in der Prüfung: **eingezäunter Text ist ein
Zitat, keine Angabe.** Wer über eine falsche Quellenangabe schreibt, muss
sie nennen dürfen — sonst kann die Berichtigung nicht sagen, was falsch
war. In gewöhnlichem Text bleibt eine Angabe eine Angabe, im ```-Block ist
sie ein Beleg.

### Die Gegenproben (§55.2)

Diese Suite war beim ersten Lauf rot, und zwar sechsmal. Das IST die
erste Gegenprobe: sie hat gefunden, wofür sie geschrieben wurde, bevor
irgendwer sie grün gesehen hat. Vier weitere an einem Abzug des Baums:

| Gegenprobe | rot |
|---|---|
| A · eine erfundene Datei nennen | 1 |
| B · eine echte Datei, ein erfundener Abschnitt | 1 |
| C · die Ausnahmeliste lügen lassen | 1 |
| D · dieselbe Angabe in einem ```-Block | 0 — und das ist die Regel |

B hat dabei noch etwas gezeigt. Der erste Wurf las

```txt
test202 §77, 84 Punkte
```

als Spanne von 77 bis 84 und meldete acht fehlende Abschnitte statt einem.
Ein Komma trennt in dieser Doku nie zwei Abschnitte, sondern den Verweis
vom nächsten Halbsatz — nach jedem Trenner muss wieder ein `§` stehen,
ausser bei einer Spanne mit Gedankenstrich.

Dazu kommt §3, der die Suche selbst misst: test215 hat einen Abschnitt 3
und 8, aber keinen 99, und test31 hat gar keine. Ohne §3 bestünde die Suite
auch mit einem `hatAbschnitt`, das immer `true` sagt.

### Was sie nicht kann

Ob ein Abschnitt inhaltlich prüft, was danebensteht. Das kann keine
Maschine — und es war auch nicht der Fehler: die Adressen waren falsch,
nicht die Behauptungen.


## E169 · Was im Journal steht, war für den Workspace nicht da (L50)

**25. August 2026.** L50 hält seit dem 24. fest, dass Arbeitswelt und
Lebensbereiche zwei Rechenwege für dieselbe Frage haben. Der Eintrag sagt
dazu: „Es sind zwei Rechenwege für dieselbe Frage, und der zweite ist immer
der schlechtere."

Bevor man so etwas zusammenlegt, lohnt eine Frage: **sagen die beiden Wege
heute überhaupt dasselbe?** Wenn ja, ist das Zusammenlegen Hygiene. Wenn
nein, ist es eine Fehlerbehebung.

### Gemessen

Ein Arbeitsbereich mit Aufgaben aus beiden Quellen — Haken auf einer Seite
und Zeilen in einer Aufgaben-Datenbank. Beide Wege lieferten neun Aufgaben,
dieselben Kennungen, dieselben Erledigt-Marken. Kein Unterschied.

Dann derselbe Versuch mit einem Haken im **Journal**:

```txt
Lebensbereiche.aufgaben()          steht drin
Arbeitswelt.snapshot().aufgaben    fehlt
```

Derselbe Haken, zwei Listen, und keine sagt etwas dazu.

### Woher das kam

Zwei Fragen standen in einer Zeile:

```txt
block.type === 'page' && block.parentTable !== 'collection'
  && !block.system && erlaubt('lesen', block.id)
```

`erlaubt('lesen', …)` ist die Rechtefrage. `!block.system` ist etwas ganz
anderes: Journal, Schnellnotizen und Vorlagen sollen nicht in der
SEITENLISTE stehen, weil sie ihren eigenen Platz in der Seitenleiste haben.

Beides zusammen ergab `lesbareIds` — und daran hingen **fünf** ganz andere
Listen:

```txt
aufgaben        ein Haken im Journal fehlte
dateien         eine Datei in den Schnellnotizen fehlte
pdfs            ein PDF, das man ins Journal zieht, fehlte
flaechen        ein Whiteboard in einer Vorlage fehlte
inhaltsBloecke  jeder Block darin fehlte
```

Das Journal ist die Stelle, an der man etwas schnell hinwirft. Es war die
einzige, aus der es nicht wieder auftauchte.

### Die Behebung, und warum sie nicht „Filter raus" heisst

`alleLesbarenSeiten` beantwortet jetzt nur noch die Rechtefrage. Die
Systemseiten fallen erst bei `roheSeiten` heraus — genau dort, wo Seiten
ALS Seiten aufgezählt werden.

Die zwei Gegenproben stehen in beide Richtungen, und das ist der Punkt:

| Gegenprobe | rot |
|---|---|
| A · den alten Filter zurück | 2 — Haken und PDF im Journal fehlen wieder |
| B · den Filter ganz weglassen | 1 — das Journal steht in der Seitenliste |

Die Behebung liegt genau zwischen den beiden, und test215 §9 hält beide
Seiten fest.

### Was das für L50 heisst

Die Lücke bleibt offen, aber sie ist jetzt anders begründet. Die zwei Wege
liefern — nach dieser Behebung — dasselbe; gemessen, nicht behauptet. Das
Zusammenlegen ist damit **Hygiene, keine Fehlerbehebung**, und es steht
tiefer in der Reihenfolge als vorher gedacht.

Was der Vergleich zusätzlich gezeigt hat: die Arbeitswelt trägt zwei Dinge,
die der andere Weg nicht hat — die Rechteangabe `bearbeitbar` und die
Herkunft (`quelle`: Datenbankzeile oder Block). Ein gemeinsamer Kern müsste
beides können. Den einen durch den anderen zu ersetzen wäre die gefährliche
Richtung (§46).

---

## E170 · Der Weg zu einer Blockart ist nicht sie selbst — der Rest von L41

**25. August 2026.**

`test192` legt seit E119 jede Blockart an und fragt: kann ein Mensch damit
etwas anfangen? Es tut das über den Weg, den ein Mensch geht — Schrägstrich,
Name, Enter. L41 hielt fest, dass genau darin die Lücke steckt: **nicht jede
Blockart hat diesen Weg.**

```txt
`spalte`    legt `columns` an, als Kind. Kein Slash-Befehl führt hin.
`pdfseite`  entsteht beim Einlesen eines PDF. Auch keiner.
```

Beide zeichnet der Editor. Beide erfasste `test192` nicht. Beide waren in
Ordnung — aber nicht durch ihn, und das ist der Unterschied, um den es geht.

### Nicht aufgezählt, sondern gerechnet

Zwei Namen in eine Liste zu schreiben hätte die Lücke geschlossen und die
nächste geöffnet: eine dritte Blockart ohne Slash-Weg wäre wieder
ungeprüft, und wieder hätte es niemand gemerkt. Also rechnet §3 die Frage
aus, statt sie zu beantworten:

```txt
alle `case`-Zweige aus `switch (block.type)` im Zeichner
  minus alles, was §2 über das Slash-Menü WIRKLICH erzeugt hat
  = muss genau das sein, wofür in der Schleife ein Weg von Hand steht
```

Der Abzug kommt aus dem Lauf selbst, nicht aus einer nachgebauten Regel.
`umwandeln` bildet `db-table` auf `database` ab, `embed-youtube` auf
`embed`, `toggle-h1` auf `h1` — diese Zuordnung noch einmal als Ausdruck
hinzuschreiben wäre eine zweite Wahrheit, und die zweite altert. §2 hat
jeden Typ ohnehin erzeugt; sie merkt sich nur, was dabei herauskam.

Dazu ein Wächter darüber: der Zeichner muss an **genau einer** Stelle nach
Blockart entscheiden. Käme ein zweiter `switch` dazu, läse der Ausdruck nur
noch die Hälfte und meldete Blockarten als weglos, die es nicht sind.
Gegengeprobt: ein zweiter `switch` eingebaut → „ist 2, soll 1".

### Und drei Fehler beim Schreiben, von denen der erste der wichtigste ist

**Die Spalte wurde auf dem falschen Weg gemessen.** Der erste Anlauf ging
über `columns` und prüfte, ob die entstehende Spalte eine Zeile zum
Hineinschreiben hat. Sie hat eine — aber nicht wegen des Auffangs beim
Zeichnen, sondern weil `umwandeln` sie gleich mit anlegt (E102). Die
Gegenprobe zeigte es: den Auffang entfernt, **alles blieb grün.**

Der Auffang ist für den anderen Fall da, und der ist der gefährlichere: eine
Spalte, die leer DASTEHT. Aus einer eingespielten Sicherung, aus einer alten
Seite, aus einer umgewandelten Folie — genau das war E118. Also steht sie
jetzt als eigener Weg daneben, mit `columns` von Hand gebaut und ohne
Inhalt. Damit wird die Gegenprobe rot, an drei Stellen:

```txt
  ✗ Keine einzige Blockart ist ein leeres Rechteck — ist 1, soll 0
  ✗ Und jede von ihnen bietet leer eine Stelle zum Schreiben — ist 1, soll 0
  ✗ Und eine leer gebliebene Spalte bekommt beim Zeichnen eine
        — edit 0 · feld 0 · knopf 0 · bild 0 · Behälter · „"
```

Die letzte Zeile ist der Satz, um den es geht: ein Kasten, der Blöcke
aufnimmt, in den man aber nicht hineinkommt.

**Die Behauptung über den Text der PDF-Seite las die falsche Zeichenkette.**
`bericht` ist auf 26 Zeichen gekürzt — es ist die Zeile für den Prüfbericht,
nicht der Text. Die Behauptung wäre für immer rot gewesen. Jetzt gibt es
`volltext` daneben, und die Zeile bleibt, wofür sie da ist: dass im Bericht
steht, WAS gemessen wurde.

**`page` sah weglos aus.** Sie hat einen Slash-Weg, aber §2 überspringt sie
— sie springt in die neue Unterseite und wird deshalb in §2b geprüft. Der
Weg dorthin wird jetzt dort vermerkt, wo er begangen wird.

### Was die PDF-Seite dabei zeigen muss

Der Prüfling ist die Seite **ohne Bild**, und das ist kein Sonderfall: nach
dem Einspielen einer `.redion` ist es der Normalfall — E103 lässt die
gerasterten Seitenbilder bewusst draussen, weil sie sich neu rechnen lassen.
Also muss sie zwei Dinge sagen, und beide sind jetzt festgehalten:

```txt
„Seite 1 von 3"                     wo bin ich
„… gibt es noch kein Bild."         und warum ist es weiss
```

Gegengeprobt, beide einzeln entfernt, beide werden rot.

### Was das an der Prüfung ändert

```txt
vorher   65 Blockarten über das Slash-Menü
nachher  68 Wege — dieselben 65, dazu `spalte`, `spalte-leer`, `pdfseite`
         und ein Ausdruck, der rot wird, wenn eine vierte dazukommt
```

`test192`: 25 Punkte statt 15. L41 ist damit bis auf seinen zweiten
Randpunkt abgearbeitet — dass die Prüfung fragt, ob man HINEINKOMMT, und
nicht, ob drinnen das Richtige passiert. Dafür sind die Suiten je Blockart
da, und die gibt es nicht für alle 66.

---

## E171 · Eine Datei, die noch jemand zeigt, darf nicht mitgelöscht werden (L43)

**25. August 2026.**

L43 stand seit dem 22. August in den Lücken und sah harmlos aus: ein Anhang,
dessen Dateisatz kein `blockId` trägt, bleibt beim endgültigen Löschen des
Blocks liegen. Alle sechs echten Aufrufer übergeben `blockId`, also entstand
der Fall nur über einen Aufruf, den es noch nicht gibt.

Beim Nachmessen kam etwas anderes heraus, und es stand in keiner Lücke:

```txt
Bild einfügen · Strg+D · das ORIGINAL endgültig löschen
  → das Duplikat lebt, seine dateiId zeigt auf nichts, das Bild ist weg
```

`Store.baum` nimmt den ganzen Satz mit, `baumEinfuegen` legt ihn so wieder
hin — beide Blöcke tragen **dieselbe** `dateiId`. Der Dateisatz zeigt über
seinen Index auf das Original; wird das gelöscht, geht die Datei mit.
Datenverlust im Normalbetrieb, ohne dass jemand etwas falsch macht (§46,
Priorität 1).

### Die Frage, die niemand gestellt hat

Beide Fehler haben dieselbe Ursache: das Löschen fragt nicht, ob die Datei
noch jemand braucht. Also fragt es das jetzt.

```ts
const dateiAnspruch = (nurLebende = false): Map<string, string> => …
```

Dateikennung → der Block, der sie zeigt. Drei Felder werden gelesen, weil es
historisch drei gibt: `dateiId` bei Bild-, Datei- und Videoblöcken, `datei`
als ältere Form desselben, `bildDateiId` bei der gerasterten PDF-Seite
(E103).

`nurLebende` trennt zwei Fragen, die verschieden zu beantworten sind:

```txt
false   Darf ich endgültig löschen? Dann zählt auch ein Block im Papierkorb.
        Der Papierkorb ist umkehrbar, das Löschen nicht.
true    Ist sie herrenlos? Dann zählt nur, wer sie heute zeigt. Sonst räumte
        die Pflegeseite nie wieder etwas weg.
```

Wird eine Datei behalten, weil ein anderer Block sie zeigt, bekommt ihr Satz
dessen `blockId`. Ohne diese Übergabe hielte `Dateien.verwaist()` sie für
herrenlos — ihr `blockId` zeigte ja auf den eben gelöschten Block — und die
Pflegeseite böte an, sie wegzuräumen. Derselbe Schaden, eine Tür weiter.

### Und erst dadurch wird L43 sicher behebbar

L43 hat seine eigene Behebung mit dem Satz aufgeschoben, sie würde *mehr*
löschen als heute, und mehr zu löschen sei die gefährliche Richtung. Das war
richtig. Gegengeprobt: nur das Merken eingebaut, die Anspruchsfrage
weggelassen — dann nimmt das Löschen eines Duplikats dem Original sein Bild.

Mit der Anspruchsfrage davor ist es sicher, und `purgeTief` merkt sich die
Dateien des Blocks jetzt beim Absteigen, solange er noch im Zwischenspeicher
ist. Einmal je Vorgang, nicht je Block: bei einer Seite mit fünfhundert
Blöcken wäre ein Durchgang durch alle Blöcke pro Block dieselbe Falle, die
weiter oben schon den `Promise.all` gekostet hat.

### Was gemessen wurde, vorher und nachher

```txt
                                          vorher    nachher
A  Anhang ohne blockId, Block gelöscht     bleibt    weg
B  Anhang mit blockId, Block gelöscht      weg       weg
C  dupliziert, ORIGINAL gelöscht           WEG       bleibt
D  dupliziert, DUPLIKAT gelöscht           bleibt    bleibt
E  PDF-Seite (bildDateiId), gelöscht       bleibt    weg
F  ganze Seite mit beiden gelöscht         weg       weg
G  Original im Papierkorb, Duplikat lebt   verwaist  nicht verwaist
H  dasselbe ohne Duplikat                  verwaist  verwaist
```

C ist der teure Fall. F und H sind die Gegenprobe zum Behalten: „im Zweifel
behalten" darf nicht „nie mehr löschen" heissen.

### Zwei Sätze in L43 waren falsch

```txt
„`Dateien.verwaist()` und die Pflege-Seite finden solche Dateien"
    Nein. `verwaist()` sagte `if (!d.blockId) return false`.
    Gemessen: 0 verwaiste, während die Datei aus Fall A in der Ablage lag.

„Der Fall entsteht nur über einen Aufruf, den es noch nicht gibt"
    Für den Weg über `blockId` stimmt es. Der Weg über `dateiId` am Block
    brauchte keinen neuen Aufruf — Duplizieren genügte.
```

### Gegenproben

```txt
alles zurückgedreht                          9 rot
nur die Anspruchsfrage aus                   3 rot  (C, C-Übergabe, D)
nur das Merken beim Absteigen aus            3 rot  (A, A-Stücke, E)
verwaist() ohne die Anspruchsfrage           1 rot  (G)
dateiAnspruch ohne `nurLebende`              1 rot  (H)
```

Prüflauf: `test226`, 24 Punkte.

**Was offen bleibt:** eine Datei, die nie an einem Block hing, findet
`verwaist()` weiterhin nicht. Sie automatisch zu löschen wäre wieder die
gefährliche Richtung — zwischen „abgelegt" und „verknüpft" liegen
Millisekunden, in denen sie echt und herrenlos ist.

---

## E172 · Ein Spaltenschlüssel aus lauter Ziffern (L36)

**25. August 2026.**

Bis E96 entstanden Spaltenschlüssel als Hex-Schnipsel, und knapp jeder zehnte
bestand nur aus Ziffern. JavaScript behandelt so einen Schlüssel als
Feldindex: `Object.keys` gibt ihn VOR allen anderen zurück, aufsteigend
sortiert. Die Spalte steht dann immer ganz links.

Das ist nicht bloss unschön. `spalteEinordnen` — was beim Ziehen einer
Tabellenüberschrift passiert — baut das Schema in der neuen Reihenfolge auf.
Beim nächsten Lesen zieht `Object.keys` den Zifferschlüssel wieder nach vorn.
**Die Spalte lässt sich nicht bewegen**, und nichts sagt warum.

E96 hat dafür gesorgt, dass so ein Schlüssel nicht mehr entsteht. L36 hielt
den Bestand offen, mit dem richtigen Grund: eine Umbenennung ist eine
Datenmigration, und die gibt es nur mit eigenem Plan und eigenen Prüfungen
(§9).

### Wo ein Spaltenschlüssel überall steht

Nachgesehen, nicht geraten — zwölf Stellen:

```txt
schema[key]                die Spalte selbst
zeile.props[key]           jeder Wert in jeder Zeile
                           … auch in den Zeilen im Papierkorb
ansicht.groupBy            die Gruppierung
ansicht.sorts[].key        die Sortierung
ansicht.filters.rules[]    der Filter, auch in verschachtelten Gruppen
ansicht.hidden[]           versteckte Spalten
ansicht.calc{}             Zusammenfassung — der Schlüssel ist der Objektname
ansicht.breiten{}          Spaltenbreite, ebenso
automationen.wenn.key      worauf die Automation hört
automationen.dann[]        worauf sie schreibt
schema[x].relation         die Verknüpfung, auf der ein Rollup sitzt
schema[x].zielKey          die Spalte DRÜBEN, die er einsammelt
```

Und eine Stelle, an der ausdrücklich nichts geändert wird: **Formeln.**
`prop("Punkte")` spricht die Spalte über ihren Anzeigenamen an, nicht über
den Schlüssel (`dienst.ts`, `formelRechnen`). Ein Schlüsselwechsel geht daran
vorbei.

### Warum nicht einfach alles ersetzen

Weil „4711" nicht immer eine Spalte ist. In einer Farbregel ist es ein WERT
(„Fach ist gleich 4711"), in einer Zelle ist es Inhalt, in einer Auswahlliste
ein Optionsname. Also:

```txt
OBJEKTSCHLÜSSEL   überall ersetzt — ein Feldname aus lauter Ziffern kommt
                  im Code nicht vor
WERTE             nur an benannten Stellen: key, groupBy, zielKey, relation,
                  setzeKey, filterKey, bildKey, dateKey, …
```

Gegengeprobt, indem `wert` in die Liste der Schlüsselfelder aufgenommen
wurde: die Farbregel bricht, `test227 §4` wird rot.

### Die Stelle, an der der Umzug nichts erfinden darf

Wo die Spalte ursprünglich STAND, weiss niemand mehr. Die Reihenfolge war nie
gespeichert; sie ergibt sich aus `Object.keys`, und das hat den
Zifferschlüssel schon beim Anlegen nach vorn gezogen. Ein Umzug, der eine
Stelle errät und die Spalte verschiebt, sieht für den Menschen aus wie ein
Fehler.

Also lässt er sie, wo sie zu sehen war — und macht sie beweglich. Das ist der
ganze Gewinn, und `test227 §2` misst genau ihn:

```txt
vorher    ans Ende geschoben  →  ["4711","title","abc"]   wieder vorn
nachher   ans Ende geschoben  →  ["title","abc","s4711"]  geblieben
```

### Und der Weg, auf dem der Fall heute überhaupt noch auftritt

Wer Redion neu öffnet, hat keine Zifferschlüssel — die gibt es seit E96 nicht
mehr. Wer eine Sicherung von damals einspielt, hat sie.

Und genau dort lief der Umzug nicht: die Umzüge laufen beim Start, die
Sicherung kommt danach, und die Merkliste sagt „schon gelaufen" — für den
vorigen Bestand stimmte das ja. Der Umzug wäre für alles zuständig gewesen
ausser für den einen Weg, auf dem sein Fall wirklich hereinkommt.

`importAll` stösst die Umzüge jetzt noch einmal an, mit
`zuruecksetzen()` davor. Das ist zulässig, weil jeder Inhaltsumzug ohnehin
zweimal laufen können muss, ohne zu schaden — die Regel steht seit jeher im
Kopf von `umzuege.ts`.

### Der neue Name ist berechenbar, nicht zufällig

`4711` wird `s4711`, und bei Kollision `s4711-2`. Das ist Absicht: zwei
Geräte, die dieselbe Sammlung abgleichen, führen den Umzug jedes für sich
aus und müssen beim GLEICHEN Namen ankommen. Ein zufälliger neuer Schlüssel
hätte aus einem Abgleich zwei Spalten gemacht.

Und geschrieben wird mit `rohSetzen`, nicht mit `updateCollection`: das
setzt `edited` auf jetzt und schickte damit den ganzen Bestand in den
nächsten Abgleich.

### Was gemessen wird

`test227` misst nicht Feldnamen, sondern VERHALTEN — vorher und nachher
derselbe Zustand:

```txt
dieselben Spalten · dieselben Werte · dieselben gefilterten Zeilen (durch
Datenbank.zeilen, die echte Strecke) · Gruppierung, Sortierung, Filter,
versteckte Spalten, Zusammenfassung, Breite · die Automation · der Rollup
drüben · die Zeile im Papierkorb
```

Dazu ein Durchgang, der den ganzen Bestand nach Resten absucht — nicht nach
einer Liste von Feldnamen, sonst prüfte die Prüfung dieselbe Aufzählung, die
auch der Umzug benutzt. Zurückgedreht meldet er die zwölf Stellen von oben
namentlich.

### Gegenproben

```txt
der Umzug tut gar nichts                     7 rot
'key', 'groupBy', 'zielKey' fehlen           5 rot
Schritt 4 (fremde Rollups) fehlt             2 rot
der Papierkorb bleibt aussen vor             2 rot
auch 'wert' würde ersetzt                    1 rot
nach dem Import laufen die Umzüge nicht      2 rot
```

`test227`, 29 Punkte.

---

## E173 · Eine PDF-Seite feiner rechnen (L37)

**25. August 2026.**

Seiten entstehen bei 1654 px Breite — bei A4 genau 200 dpi, Scan-Qualität.
Wer stark hineinzoomt, sieht trotzdem Unschärfe, und L37 hielt das als
offene Arbeit fest.

Beim Nachsehen war fast alles schon da und wurde nur nie gerufen:

```txt
PdfLeser.alsBild(nr, breitePx)     nimmt seit E103 eine Breite entgegen
Dateien.alsBlob(quelleId)          das Original liegt in der Ablage
Marken in SEITENPUNKTEN            E100 — sie hängen nicht am Bild
```

Der dritte Punkt ist der, an dem es hängt. Die Markenschicht ist ein SVG mit
`viewBox: 0 0 bw bh`, und `bw`/`bh` sind PDF-Punkte. Unter den Strichen darf
sich das Bild deshalb ändern, ohne dass sie wandern — ein Strich, der beim
feineren Rechnen verrutscht, wäre schlimmer als Unschärfe. `test228 §4` misst
genau das.

### Was dazukam

Neben der Seitenzahl steht ein ⊕, das die Breite verdoppelt: 1654 → 3308 px,
also 400 dpi bei A4. Das ist die Grenze; darüber wird eine Seite als WebP
schnell mehrere Megabyte, und das trägt ein Telefon nicht (§36, §37). Ist sie
erreicht, verschwindet der Knopf — er hätte nichts mehr zu tun.

Drei Dinge, die dabei nicht offensichtlich sind:

```txt
· ERST die neue Kennung an den Block, DANN die alte Datei weg. Andersherum
  stünde dazwischen eine Seite ohne Bild, und bricht es dort ab, ist das
  Bild fort und das neue nicht da. In dieser Reihenfolge ist der schlimmste
  Fall eine Datei zu viel.

· Die alte Bilddatei MUSS weg. Sie zeigt auf einen lebenden Block, also
  findet `Dateien.verwaist()` sie grundsätzlich nie (E116) — sie wäre eine
  Leiche, die niemand mehr wegräumen kann. Gemessen wird deshalb nicht
  „nichts Herrenloses", sondern „diese Seite hat genau ein Bild".

· Die gewählte Breite steht am Block (`bildBreite`) und kommt mit in die
  Sicherung. Ohne sie käme die Seite beim Zurückholen aus dem Original
  wieder grob zurück, und die Arbeit wäre still verloren — `.redion` lässt
  die Seitenbilder ja bewusst draussen (E103).
```

Der Knopf sperrt sich, solange gerechnet wird. Zwei Klicks würden zwei Läufe
starten, und beide legten für denselben Block eine Datei ab — derselbe
Fehler, den E116 für das Zurückholen behoben hat.

### Und eine Zahl, die zweimal in derselben Lücke stand

L37 sagte weiter oben „200 dpi, nicht die 140, die hier und in E103 standen"
— und ein paar Absätze tiefer wieder „rund 140 dpi". E107 hatte die falsche
Rechnung berichtigt, aber nur an einer der beiden Stellen. Jetzt an keiner.

### Gegenproben

```txt
der Knopf fehlt                              1 rot (und ein Klick ins Leere)
die alte Bilddatei bleibt liegen             3 rot
neuBerechnen vergisst die gemerkte Breite    1 rot
```

Mit Augen gesehen (§55): vorher steht das ⊕ neben dem 🔗, nachher ist es
fort und die Meldung sagt „Seite 1 ist jetzt bei 400 dpi".

`test228`, 24 Punkte.

---

## E174 · Die Kennungen überleben den Quelltext-Rundlauf (L40)

**25. August 2026.**

L40 hielt als Rest fest, die Blöcke würden beim Übernehmen weiterhin geleert
und neu gebaut, also änderten sich die Kennungen — und beschrieb das als
„Frage der Form, nicht des Formats". Nachgemessen ist es keine Formfrage:

```txt
vier Absätze · EINEN im Quelltext geändert · übernommen
  → keine einzige der vier Kennungen überlebt
  → ein Blockverweis (#block=…, E105) zeigt ins Leere
  → ein Kommentar hängt an einem Block, den es nicht mehr gibt
```

Eine Kennung ist die ADRESSE eines Absatzes. Wer eine Zeile berichtigt,
verliert die Verweise auf alle anderen mit.

### Der Umbau war nicht nötig

L40 nannte als Weg die „echte zeilenweise Abgleichung" und stufte sie als
Umbau ein. Beim Nachsehen legt `ausMarkdown` Blöcke an **genau einer**
Stelle an — `lege`, das den Stapel für die Einrückung führt (E120). Alles,
was es brauchte, steht dort:

```ts
const alt = holeGemerktes(typ, felder ? felder['text'] : '');
if (alt) { mit['id'] = alt.id; … }
Store.addBlock(elternFuer(roh), typ, mit);
```

`Store.addBlock` nimmt seit jeher einen `patch` und legt ihn ÜBER die
Vorgaben — eine mitgegebene Kennung gilt also. Und `kinderLeeren` hat den
alten Block eben endgültig gelöscht, seine Kennung ist frei.

### Ein Gedächtnis statt zweier

E165 merkte sich die Blöcke MIT Farbe, um sie danach in einem zweiten
Durchgang wieder aufzusetzen. Gemerkt wird jetzt jeder tragende Block, samt
Kennung, Farbe und Schrift — und alles davon gibt `lege` beim Anlegen mit.

```txt
vorher   merke → bauen → setzeWiederAuf     zwei Durchgänge, zwei Zuordnungen
nachher  merke → bauen (mit Kennung+Farbe)  ein Durchgang, eine Zuordnung
```

Zwei Zuordnungen nach derselben Regel sind eine Regel zu viel: sie können
auseinanderlaufen, und dann bekäme ein Block die Kennung des einen und die
Farbe des anderen.

### Die Regel ist die von E165, und aus demselben Grund

Zugeordnet wird nach **(Art, Text)**, nicht nach Position. Wer eine Zeile
einfügt, verschiebt alle darunter; nach Position zugeordnet bekäme dann jede
Zeile die Kennung ihrer Vorgängerin — ein Verweis zeigte danach auf den
falschen Absatz, und das ist schlimmer als ein toter Verweis.

Wer den Text ändert, bekommt eine neue Kennung. Das ist ehrlich: es ist ein
neuer Satz.

Und jeder gemerkte Eintrag wird **höchstens einmal** vergeben. Zwei Blöcke
mit derselben Kennung wären ein kaputter Bestand, kein Merkmal —
gegengeprobt: `splice` durch einen blossen Zugriff ersetzt, und die Prüfung
zeigt dieselbe Kennung zweimal.

### Gegenproben

```txt
die Kennung wird nicht wiederverwendet        5 rot
ein Eintrag darf mehrfach vergeben werden     3 rot
```

`test187` §7, acht neue Punkte (55 → 63).

---

## E175 · Eine Kennung ist keine Abfrage (L23)

**25. August 2026.**

L23 stand als ein Satz in den Lücken: „Suche über Titel, Inhalt, Zeilen und
Kennungen mit einfacher Syntax."

Beim Nachsehen ist die Sprache **gebaut** — `src/kern/suche/query.ts`, seit
dem 22. August, mit neun Suchbefehlen, Anführungszeichen für die genaue
Wendung, Erkennung widersprüchlicher Angaben und Fehlermeldungen in Worten:

```txt
titel:"Projekt"   tag:arbeit   typ:seite   geändert:heute   status:offen
in:Projekte       nach:2026-01   vor:2026-06   inhalt:Zebras
```

**Und kein einziger Prüflauf nannte sie.** Das ist die gefährlichere Hälfte
und schon einmal dagewesen: bei E122 lagen 460 Zeilen für ein verschlüsseltes
`.redion` herum, deren Einstiegspunkte nicht im `return` standen. Fertiger
Code, den nie jemand ausgeführt hat, sieht von aussen genauso aus wie
fertiger Code.

`test229` fährt die Sprache jetzt über das ECHTE Suchfenster ab — nicht über
`QueryLanguage.parse`: das prüfte den Parser und liesse die Verdrahtung offen
(E93). Beim Schreiben der Prüfung fielen zwei eigene Fehler an:

```txt
· Die erste Fassung las `.f-item` als Treffer. Ein Treffer ist ein
  `button[data-i]`. Vierzehn rote Punkte, kein einziger am geprüften Code —
  und einer davon („typ:seite lässt die Zeile weg") war GRÜN, weil beide
  Listen leer waren.
· `Store.addRow(coll, { text: … })` gibt der Zeile keinen Titel. `addRow`
  liest `props.title`; der Titel einer Zeile ist ihre Titelspalte.
```

### Und der Teil, der wirklich fehlte

**Kennungen.** `Store.search` findet eine Seite über ihre Kennung und
schneidet sie sogar aus einer ganzen Adresse heraus — das ist der Weg, auf
dem ein Blockverweis aus der Zwischenablage wieder zu seiner Seite führt
(E105). Das Suchfenster ging seit der Abfragesprache daran vorbei: es fragt
`QueryLanguage.run` über eine Dokumentform, die Titel, Inhalt, Schlagwörter
und Status kennt — und keine Kennungen. Wer eine einfügte, bekam „Nichts
gefunden".

Der Zweig steht in der Schale und nicht in `query.ts`: die Sprache kennt
weder DOM noch Ablage, und das soll sie nicht lernen.

**Was ihn sicher macht, ist nicht der Ausdruck davor**, sondern die zweite
Bedingung: `Store.search` muss WIRKLICH über die Kennung gefunden haben. Der
Zweig geht an der Abfragesprache vorbei und damit an ihren Filtern; griffe er
schon, wenn ein Text zufällig wie eine Kennung aussieht, zeigte „nur Titel"
plötzlich Inhaltstreffer. Genau so gegengeprobt.

`test229`, 20 Punkte.

---

## E176 · Was wäre, wenn (L28)

**25. August 2026.**

L28 stand als drei Halbsätze da: „Zielwert eingeben und rückwärts rechnen ·
Best/Normal/Worst Case · einfache Optimierung." Alle drei laufen über
dieselbe kleine Maschine: eine **Stellschraube** (eine schreibbare
Zahlenspalte) und ein **Ziel** (eine gerechnete Spalte) in derselben Zeile.

```txt
Zielwertsuche   „Der Gewinn soll 10 000 sein. Wie hoch muss der Preis?"
Optimierung     „Bei welchem Preis ist der Erlös am grössten?"
Szenarien       „Zeig mir dasselbe für schlecht, normal und gut."
```

### Die Regel, an der alles hängt

**Beim Suchen wird nichts geschrieben.**

Der naheliegende Weg wäre, den Probewert in die Zelle zu schreiben, die
Formel lesen zu lassen und weiterzuprobieren. Damit stünden bei dreissig
Schritten neunundzwanzig falsche Werte in den Daten, jeder in einer Fassung
und im Abgleich — und bricht es in der Mitte ab, bleibt der letzte stehen.
Bei einer Suche, die auch scheitern darf, ist das die gefährliche Richtung
(§46).

Gerechnet wird auf einer **Kopie** der Zeile. Dasselbe Muster benutzt
`dienst.ts` seit Langem für die Regelprüfung („die Zeile MIT dem neuen
Wert"). `test230 §5` misst es nicht am Wert — der wäre auch dann richtig,
wenn zwischendurch dreissig andere darin standen —, sondern am Zeitstempel
der Zeile und an der Zahl der Fassungen.

### Der Fehler, den ohne Messung niemand gefunden hätte

Die Probezeile trägt dieselbe Kennung wie das Original. `Tempo` und `Vorrat`
merken sich Formelwerte **unter der Zeilenkennung** — also kam bei jedem
Probewert derselbe gespeicherte Wert zurück. Die Suche sah eine Gerade, wo
eine Kurve ist:

```txt
Zielwertsuche   fand gar nichts („Kein Wert führt zu diesem Ziel")
Optimierung     lief an den Rand: Preis 50 statt 25
```

Beide Speicher stehen ohnehin still, solange `formelTiefe` über null ist —
das ist der Weg, den eine Formel nimmt, die eine andere aufruft.
`Datenbank.wertFrisch` geht denselben Weg, absichtlich.

### Warum halbieren und nicht Newton

Excel nimmt Newton und scheitert daran regelmässig: eine Formel mit `WENN`
hat Sprungstellen, und die Ableitung zeigt dort in die falsche Richtung.
Halbieren braucht keine Ableitung, nur zwei Stellen mit verschiedenem
Vorzeichen — und die sucht der erste Teil, indem er das Fenster vom heutigen
Wert aus verdoppelt.

Und es halbiert **bis das Fenster zu ist**, nicht bis der Rest klein genug
ist. Der erste Anlauf hörte bei der Toleranz auf; die ist relativ zum Ziel,
bei 2000 also 2·10⁻⁴, und heraus kam „Preis = 15.999999", wo 16 richtig ist.
Rechnerisch einwandfrei und für einen Menschen falsch.

### Der Weg dorthin

Datenbankmenü → „Was wäre, wenn …" — und nur dort, wo es eine gerechnete
Spalte gibt; ein Eintrag, der nur eine Absage zeigt, ist kein Eintrag.

Das Ergebnis wird **angezeigt, nicht eingetragen**. Eine Zielwertsuche ist
eine Frage, keine Anweisung; wer sie stellt, will erst die Antwort sehen.
Excel schreibt sofort und bietet danach „Rückgängig" an — das ist einen Klick
billiger und einen Gedanken teurer.

Mit Augen gesehen (§55): der heutige Wert stand zuerst eine Zeile ÜBER der
Spaltenauswahl und sagte etwas über eine Spalte, die man noch nicht gewählt
hatte. Er steht jetzt darunter. Und die Antwort stand in Hinweisgrau — sie
ist das, wofür der Dialog da ist, und steht jetzt in Textfarbe.

### Gegenproben

```txt
probiere() geht über den Zwischenspeicher     7 rot
die Suche schreibt in die Zelle               7 rot
```

`test230`, 36 Punkte.

---

## E177 · Öffentlich, ohne dass Privates mitgeht (L31)

**25. August 2026.**

L31 nannte fünf Dinge und darüber die eigentliche Bedingung: keine privaten
Daten für Crawler.

```txt
Export als statische Seite   gab es schon — `Werkzeuge.htmlExport`
robots.txt · ai.txt          neu
sitemap.xml                  neu
Demo-Modus                   neu
keine privaten Daten         war schon wahr, stand aber nirgends
```

### Die Bedingung wird gemessen, nicht behauptet

Redion ist local-first: die Notizen liegen in der IndexedDB des Browsers. Ein
Crawler bekommt die leere App — es gibt buchstäblich nichts Privates zu
holen. Das ist leicht gesagt und genau die Sorte Satz, die durch eine
Änderung still falsch wird: ein `<script>`, das eine Beispielnotiz einbettet,
und niemand merkt es.

`test231 §2` liest deshalb das AUSGELIEFERTE HTML und sucht darin nach
gezeichneten Blöcken und nach Starterinhalt.

Und ein Punkt, der ausdrücklich dasteht, weil er sonst missverstanden wird:
`robots.txt` sperrt `/quell/` und `/pruefungen/` aus — und die Dateien sind
trotzdem abrufbar. Eine `robots.txt` ist eine Bitte, kein Schloss. Die
Prüfung hält das fest, damit niemand sie später für eine Sperre hält.

### Der Vorführmodus trennt über den Namen

`index.html?demo` öffnet eine EIGENE Ablage: `notizen-demo`.

```txt
Zwei Namen  = zwei Datenbanken, und die Trennung setzt der Browser durch.
Ein Schalter = an dreissig Stellen abgefragt und an der einunddreissigsten
               vergessen — und dann steht die Vorführung in den echten Daten.
```

`test231 §3` legt in der echten Ablage eine Seite an, öffnet danach die
Vorführung und sieht nach, ob sie dort auftaucht. Und in der Gegenrichtung,
ob die echte Seite danach noch da ist.

**Und dabei fiel ein Messfehler auf, der die wichtigste Behauptung wertlos
machte:** `browser.newPage()` legt in Playwright jedes Mal einen EIGENEN
Kontext an, und ein eigener Kontext hat eine eigene IndexedDB. Die erste
Fassung mass damit Playwrights Trennung statt Redions — die Gegenprobe
(beide Ablagen gleich benannt) liess „Die eigene Seite ist dort NICHT zu
sehen" grün stehen. Jetzt: ein Kontext, zwei Seiten.

### Zwei Fehler, die nur das Hinsehen fand (§55)

```txt
· `position:sticky` machte den Balken zu einem Flex-Element von `body` —
  und `body` ist eine Flex-ZEILE (Seitenleiste | Inhalt). Der Balken bekam
  eine eigene Spalte über die volle Höhe: der halbe Bildschirm orange, der
  Text ein schmaler Streifen am Rand. „Ein Balken steht da" war grün.
· Weiss auf dem Orange (`#f97316`) ergibt 2,6:1 — unter den 4,5:1, die §38
  für gewöhnlichen Text verlangt. Auf dem Bild sah es genau danach aus.
  Jetzt dunkles Braun: 7,7:1.
```

Beides steht jetzt als Punkt in `test231`: die Lage (`position: fixed`, und
`body` beginnt genau unter dem Balken) und das Kontrastverhältnis, gerechnet
statt geschätzt. Die Höhe des Abstands wird gemessen und nicht gesetzt — am
Telefon bricht der Satz um, und eine feste Zahl läge dann über der App.

### Gegenproben

```txt
die Vorführung nutzt dieselbe Ablage    2 rot
der Vorführbalken fehlt                 3 rot
```

`test231`, 29 Punkte.

---

## E178 · Spalten aufräumen, mit Vorschau (L27)

**25. August 2026.**

L27 nennt sechs Handgriffe eines Import-Assistenten. Vier gab es schon, als
die Lücke geschrieben wurde — nachgesehen, nicht angenommen:

```txt
Typen erkennen                `Spaltentyp.erkenne`, beim CSV-Einlesen
Vorschau vor dem Übernehmen   derselbe Weg: erst nachsehen, dann fragen
Duplikate entfernen           `Pflege.dublettenDialog`
Dateien kombinieren           ein zweites CSV in dieselbe Datenbank
```

Zwei fehlten, und beide braucht man nach jedem Import als Erstes: **Spalten
bereinigen** und **Werte ersetzen**. Beides steht jetzt unter „Spalten
aufräumen …" im Datenbankmenü.

### Die Regel ist die von `probelauf.ts`

Erst zeigen, was passieren würde, dann erst tun. `plan()` ändert nichts und
zählt echt nach; `wende` schreibt. Ein Aufräumen, das dreihundert Zeilen
anfasst und erst danach zeigt, was es getan hat, ist kein Werkzeug, sondern
ein Risiko (§46).

Die Vorschau zeigt höchstens zehn Zeilen und sagt, dass es mehr sind — eine
mit dreihundert liest niemand, und eine, die schweigend abschneidet,
verspricht dreihundert und zeigt zehn.

### Und der Plan wird gegen den Bestand gehalten

Zwischen Vorschau und Zusage kann ein zweites Fenster oder ein Abgleich
dazwischenkommen. `wende` schreibt deshalb DEN PLAN und rechnet nicht neu —
und lässt jede Zeile aus, deren Wert inzwischen ein anderer ist. Sonst
stünde in der Zelle etwas, das dem Menschen nie gezeigt wurde.

Gegengeprobt: die Prüfung weggenommen, und der von Hand geänderte Wert wird
mit dem alten überschrieben.

### Das Ersetzen ist wörtlich

Wer „(GmbH)" ersetzen will, tippt „(GmbH)" und nicht „\(GmbH\)". Ein
Suchfeld, das heimlich ein regulärer Ausdruck ist, macht aus einem Punkt ein
Jokerzeichen — gegengeprobt: „." durch „" ersetzt, und statt einer Zelle
sind alle sechs leer.

### Und die unsichtbaren Zeichen stehen als Escape da

` `, ` `, ` ` und die drei Nullbreiten plus BOM. Sie im
Quelltext als Zeichen zu schreiben wäre eine Regex, der niemand ansieht, ob
sie noch enthält, was sie enthalten soll — und die kein Kopieren übersteht.

`test232`, 32 Punkte.

---

## E179 · Zwei Regressionen, die der volle Lauf gefunden hat

**25. August 2026.** `voll92` war rot: `test96` und `test210`. Beide gehören
zu Entscheidungen aus demselben Tag, und beide Prüfungen hatten recht.

### `test96` · Ein Zeitstempel, den es beim Anlegen nie gab

E172 lässt die Inhaltsumzüge nach einer eingespielten Sicherung noch einmal
laufen. Der Umzug `zeitstempel-an-sammlungen` trägt `edited` nach, wo es
fehlt — für ALTE Sätze gedacht. `test96` exportiert den Bestand, löscht
alles, spielt ein und vergleicht Feld für Feld; danach standen zwei `edited`
da, die vorher nicht da waren.

Der Umzug hatte recht: **`addDatabase` und `addView` setzten `edited`
schlicht nie.** Eine frisch angelegte Sammlung hatte keinen, bis irgendetwas
sie änderte.

Ihn abzuschalten wäre die falsche Richtung gewesen — dann käme eine
Sicherung von 2025 wieder ohne Zeitstempel herein, und der Abgleich hielte
jede Schemaänderung darin für nie geschehen. Also steht `edited` jetzt beim
Anlegen da, und der Umzug ist für neue Daten ein Leerlauf.

### `test210` · Ein Knopf, der einer Werkzeugleiste die Breite nimmt

E173 hat der PDF-Seite ein ⊕ neben die Seitenzahl gestellt. `.blatt-reihe`
ist eine Zeile: links die rollende Zeichenleiste, rechts der feste Teil.
Jeder Knopf rechts nimmt links Platz weg.

```txt
390 px Fensterbreite · die Zeichenleiste vorher 290 px, nachher 262
```

`test210 §4` verlangt, dass sie mehr als ein Drittel bekommt, und hatte
recht: eine Zeichenleiste, die ein Viertel ihrer Breite an eine Seitenzahl
verliert, ist am Telefon keine. Unter 760 px bricht die Reihe jetzt um —
oben die volle Breite zum Zeichnen, darunter Seitenzahl, 🔗 und ⊕.

Mit Augen nachgesehen (§55): die Zeichenleiste läuft jetzt über die ganze
Breite, die Angaben stehen rechtsbündig auf einer eigenen Zeile.

### Was daran allgemein ist

Beide Fehler waren unsichtbar, solange man nur die neuen Prüfungen laufen
liess. Der volle Lauf ist der einzige Ort, an dem eine Änderung auf die
Prüfungen trifft, an die niemand gedacht hat — und beide Male hat eine
ältere Prüfung eine jüngere Entscheidung berichtigt.

---

## E180 · Was die Ansicht verschweigt (L22)

**25. August 2026.**

L22 bestand aus einer Vermutung: Redion könnte bei sehr grossen
Arbeitsbereichen langsam sein. Nachgemessen an 8000 Blöcken — 200 Seiten mit
je 20 Absätzen und eine Datenbank mit 2000 Zeilen — stimmt sie nicht:

```txt
8000 Blöcke anlegen und einmal schreiben        1,5 s
Neu laden, bis der Bestand steht                0,5 s
`Store.search` über alles                       68 ms
`Store.baum` über den ganzen Baum               20 ms
`exportAll` über 4,9 MB                         29 ms
2000 Zeilen filtern und sortieren                2 ms
```

### Der Fund ist ein anderer

Eine Datenbankansicht zeigt 50 Zeilen von 2000 — `begrenzen`, seit jeher,
mit einer Ladegrenze im Layout-Menü. **Und sie sagte es nicht.** Die Tabelle
endete nach der fünfzigsten Zeile mit „+ Neu", und nichts wies darauf hin,
dass eintausendneunhundertfünfzig fehlen.

Das ist kein Leistungsproblem, sondern die gefährlichere Sorte
Unvollständigkeit: man merkt sie erst, wenn man etwas sucht, das dasteht und
nicht gefunden wird. Der Weg heraus existierte — drei Ebenen tief unter
„Layout" —, aber wer nicht weiss, dass abgeschnitten wird, sucht ihn nicht.

Jetzt steht unter der Ansicht: **„50 von 2000 Zeilen · Mehr laden · Alle
zeigen"**. Die Wahl bleibt an der Ansicht stehen; wer einmal alle sehen
wollte, will es beim nächsten Öffnen wieder.

**Unter der ANSICHT, nicht im Tabellenfuss.** `begrenzen` gilt für jede
Ansichtsart; in den Tabellenfuss geschrieben hätten Board, Galerie und Feed
weiter stumm abgeschnitten.

### Was diese Prüfung misst und was nicht

Keine Millisekunden als Schranke. Die hängen an der Maschine, und eine
Prüfung, die auf einem langsamen Rechner rot wird, wird abgeschaltet statt
gelesen. Gemessen werden **Zahlen und Formen**: wie viele Sätze angefasst
werden, wie viele Knoten im Bild stehen, was die Ansicht über sich selbst
sagt. Dazu ein paar sehr weite Zeitschranken — dreissig Sekunden für etwas,
das 1,5 braucht —, die keine gesunde Maschine reisst und ein quadratischer
Algorithmus sofort.

### Und ein Messfehler beim Schreiben

Nach `seite.reload()` wartete die Suite darauf, dass der BESTAND steht. Der
steht früher als die Oberfläche; `App.oeffne` lief danach ins Leere, und die
Seite hatte keinen einzigen Block. Das sah aus wie ein Fehler in der
Ansicht und war einer in der Prüfung. Jetzt wird auch auf `#scroll`
gewartet.

Und §3a hat einen Wächter bekommen: fehlt der Hinweis, wird die Suite ROT
statt abzustürzen — ein Absturz mitten im vollen Lauf ist schwerer zu lesen
als ein roter Punkt.

### Gegenprobe

```txt
kein Hinweis auf die Grenze     7 rot
```

`test233`, 22 Punkte.

---

## E181 · Dieselbe Frage, zwei Antworten (L50, L21, L30)

**25. August 2026.**

L50 stand seit E169 als „Hygiene, keine Fehlerbehebung" da: `Arbeitswelt`
und `Lebensbereiche` sind zwei Wege zu denselben Blöcken, und gemessen
liefern sie dasselbe. Beim Nachsehen, WAS die zwei Wege eigentlich teilen,
stand eine Sache zweimal da, die nicht dasselbe lieferte.

### Der Fund

Beide hatten eine Funktion namens `erlaubt`. Beide beantworteten die
Rechtefrage. Sie beantworteten sie verschieden:

```txt
arbeitswelt     pageId ? Konten.darf(a, pageId) : Konten.darf(a)
lebensbereiche  !!pageId && Konten.darf(a, pageId)
```

Bei einer LEEREN Seitenkennung — ein Block, der zu keiner Seite gehört —
sagte die eine „dann frag den Arbeitsbereich" und die andere „nein".
Derselbe Block war in der einen Ansicht sichtbar und in der anderen nicht.

Der Grund liegt in `Konten.darf` selbst:

```ts
const id = seiteId || App.aktuelleSeite();
if (!id) return true;
```

Ein leerer Text fällt auf die gerade offene Seite zurück. Das ist für die
Werkstattfrage richtig („darf ich hier überhaupt etwas ändern") und für die
Seitenfrage falsch („darf ich DIESE Seite"). Die eine Fassung hat den
Unterschied gesehen, die andere nicht.

Das ist L34 in Reinform, nur eine Ebene höher: ein Wert steht an zwei
Stellen, nichts erzwingt Gleichheit, und die Abweichung sieht man erst,
wenn jemand sie sucht.

### Die Antwort steht jetzt einmal da

`kern/zugang/lesefrage.ts`, mit der Regel ausgeschrieben:

```txt
Rechte aus            → alles erlaubt (ohne Konten keine Rechte)
Seitenkennung da      → die Seitenfrage
Seitenkennung leer    → NEIN
Kennung weggelassen   → die Werkstattfrage
```

Der Unterschied zwischen „leer" und „weggelassen" ist Absicht und nicht
Zufall: nur dadurch fallen beide alten Fassungen zusammen, ohne dass sich
für einen einzigen Aufrufer etwas ändert.

**Nicht `rechte.ts`.** Den Namen gibt es schon — dort wohnen die Feldrechte.
Der erste Versuch hat die Datei überschrieben; `npm run typecheck` hat es
gemeldet, weil `Feldrechte` plötzlich unbekannt war. Der Vorfall steht im
Kopf der neuen Datei, damit der nächste Versuch nicht dieselbe Stelle trifft.

### Der grosse Kern bleibt ungebaut

L50 wollte ursprünglich beide Bereiche auf einen gemeinsamen Aggregatkern
stellen. Das passiert nicht, und das ist eine Entscheidung, kein Rückstand:
die zwei Wege liefern dasselbe (E169, gemessen), und der eine trägt die
Rechteprüfung, die der andere nicht braucht. Sie zusammenzulegen hiesse,
diese Prüfung neu zu verdrahten — für ein Ergebnis, das der Mensch nicht
sieht. Der Teil mit dem Risiko war die gemeinsame Frage, und die ist
gemeinsam.

### Zwei Lücken nebenbei, beide durch Hinsehen

**L21 war seit E122 zu.** Der Eintrag verlangte drei Dinge —
verschlüsseltes `.redion`, verschlüsselte Anhänge, Schlüsselwechsel — und
alle drei gibt es seit Paketfassung 2; `test199` fährt sie mit 33 Punkten
ab. Der Absatz wurde nach dem Schreiben nie wieder nachgesehen. Eine Lücke,
die nur auf dem Papier steht, ist auch eine Art Falschaussage.

**L30 war eine Wunschliste ohne Urteil.** „Erweiterungen und Marktplatz",
sechs Stichworte, kein Satz dazu, ob das zu Redion passt. Es passt nicht
ohne Weiteres: eine Erweiterung ist fremder Code im selben Fenster wie die
Notizen und sieht IndexedDB, `Store` und jedes offene Dokument. §19 verbietet
`eval()` und ungeprüftes `innerHTML`, §47 fremden Code aus Formeln — ein
Erweiterungssystem wäre die grösste Ausnahme von beidem. Sicher gebaut
bräuchte es eigenen Ursprung, `iframe`, Nachrichten statt Zugriff, ein
Rechtemodell je Erweiterung, Signaturen und einen Rückruf. Das ist ein
eigenes Projekt. Es steht jetzt als „bewusst nicht gebaut" da, mit den drei
Wegen, die ohne Fremdcode auskommen: Register, Automationen, `.redion`.

Prüflauf: `test234`, 14 Punkte, mit zwei Gegenproben — das `!!pageId &&`
entfernt macht einen Punkt rot, `Lebensbereiche` wieder mit eigener Regel
zwei.

---

## E182 · Der Knopf, der den Export kennt (L26)

**25. August 2026.**

L26 stand als „Asana und Apple Notes fehlen" da. Beim Nachsehen stimmte das
nur halb, und die Hälfte, die stimmte, war die interessantere.

**Asana kam schon herein** — über den allgemeinen CSV-Weg. Nur eben so:

```txt
Section/Column  →  Text     statt  Status (und Gruppierung)
Due Date        →  Text     statt  Datum
Tags            →  Text     statt  Mehrfachauswahl
Completed At    →  Text     statt  Haken
Notes           →  EINE ZELLE mit der ganzen Beschreibung darin
```

Die letzte Zeile ist der eigentliche Verlust. Eine Aufgabenbeschreibung in
einer Tabellenzelle kann man nicht lesen, nicht gliedern, nicht durchsuchen
wie eine Seite. Sie steht da, aber sie ist unbenutzbar — und das sieht nicht
nach einem Fehler aus, sondern nach einer langen Spalte.

Die vorletzte ist die zweitschlimmste: in einer Aufgabenliste ist „erledigt
oder nicht" die Information, nach der man zuerst sucht. Asana schreibt sie
nicht als Ja/Nein, sondern als Datum in `Completed At` — leer heisst offen.
Wer das nicht weiss, bekommt eine Textspalte voller Zeitstempel.

**Apple Notes kam gar nicht herein.** Es liefert einen ORDNER mit einer
HTML-Datei je Notiz; die Ordner der App werden zu Unterordnern.

### Was jetzt dasteht

`ausAsana` liest die Spaltennamen und bildet sie typgerecht ab, `Notes` wird
Seiteninhalt statt Zellinhalt, `Completed At` wird der Haken, und die Ansicht
ist ein nach Abschnitt gruppiertes Board.

**Was nicht erkannt wird, geht trotzdem mit.** Asana hängt eigene Felder als
weitere Spalten an, und die heissen bei jedem anders. Sie werden Textspalten
mit ihrem Namen aus der Datei — lieber eine Spalte zu viel als ein verlorenes
Feld. Ihre Schlüssel sind `a0`, `a1`, … und nicht `0`, `1`, weil rein
numerische Schlüssel seit E96/E172 kaputte Verweise machen.

`ausAppleNotes` legt je HTML-Datei eine Seite an und behält die Ordner. Der
Titel kommt aus `<title>`, sonst aus der ersten Überschrift, sonst aus dem
Dateinamen — in dieser Reihenfolge, weil die ersten beiden Umlaute und
Satzzeichen behalten haben, die der Dateiname verloren hat.

### Eine Grenze, die es geben muss

`ausAsana` verlangt eine Spalte `Name` oder `Task Name` und lehnt sonst ab.
Ohne diese Grenze wäre jede beliebige CSV ein Asana-Export, und die
Zuordnung würde raten statt lesen — aus „Betrag" würde ein Abschnitt. Der
allgemeine CSV-Weg steht weiterhin daneben im Fenster, jetzt unter seinem
eigenen Namen („Jira, Monday, sonstige CSV") statt als Anhängsel von Asana.

### Ein HTML-Leser, nicht zwei

Apple Notes braucht dasselbe wie Evernote: HTML zu Blöcken. Die Funktion
stand IN `ausEvernote`; sie zu kopieren hiesse, sie zweimal zu haben — L34
in Reinform. Sie heisst jetzt `htmlZuMarkdown` und gehört beiden.

Dadurch bekam Evernote nebenbei etwas dazu: **Kästchen werden Aufgaben.**
Apple Notes schreibt Checklisten auf drei Arten (`☑`, `[x]`, ein
Datenattribut), und alle drei werden zu `- [x]` / `- [ ]`, aus denen
`ausMarkdown` echte Aufgabenblöcke macht. Vorher wäre daraus ein
Aufzählungspunkt geworden, in dessen Text ein Kästchen steht, das man nicht
anklicken kann.

### Was die Prüfung misst

`test235`, 63 Punkte, mit fünf Gegenproben, die einzeln nachgewiesen sind:

```txt
alle Typen wieder auf Text            5 Punkte rot
`Notes` nicht mehr als Seiteninhalt   3 Punkte rot
Kästchen nicht mehr als Aufgabe       5 Punkte rot
Unterordner flach                     1 Punkt  rot
die stummen Spalten doch als Spalten  5 Punkte rot
```

Zwei Punkte mussten dabei berichtigt werden, und beide waren grün aus dem
falschen Grund. „Eine Datei ohne Zeilen wird abgelehnt" prüfte nur, dass
etwas geworfen wurde — das war auch dann grün, als `ausAsana` noch gar nicht
existierte und der Aufruf an `undefined` scheiterte; jetzt wird die MELDUNG
gelesen. Und „ein abgehakter Punkt wird eine erledigte Aufgabe" prüfte nur
die Blockart, nicht den Haken — grün auch dann, wenn beide Punkte unerledigt
ankommen, also genau im Verlustfall.

`test49` zählte „Sechs Quellen zur Wahl". Eine Zahl allein ist auch dann
grün, wenn zwei falsche Einträge dastehen; die Prüfung nennt jetzt die
Namen.

---

## E183 · Die Liste rollte, ohne es zu zeigen

**25. August 2026.**

Zwei Quellen mehr im Einlesefenster (E182), und ein Bild später stand da:

```txt
📊 Jira, Monday, sonstige CSV
   Irgendeine Tabelle — wird zur Datenbank
📄 Einzelne Dateien
   ⟵ hier hörte es auf
```

Die achte Quelle war 28 px unter der Kante. Erreichbar war sie immer — die
Liste rollt. Aber sie sah aus wie ein Eintrag ohne Beschreibung, und nichts
sagte, dass da noch etwas ist. Am Telefon fehlten 127 px statt 28.

**Das ist E180 noch einmal, nur senkrecht.** Dort zeigte eine Tabelle 50 von
2000 Zeilen und sagte es nicht; hier zeigt eine Liste sechs von acht
Einträgen und sagt es nicht. Beide Male ist der Inhalt vollständig da, beide
Male sieht der Ausschnitt aus wie das Ganze.

Und keine Prüfung konnte es finden, weil keine danach sah. Gefunden hat es
`node bilder.mts` — CLAUDE.md §55, wörtlich: *öffne die Seite wirklich,
statt nur den Code zu lesen.*

### Zwei Antworten, eine für jeden Fall

**Am Rechner war die Höhe ohne Grund knapper als der Platz.** `max-height:
56vh` liess 482 px zu, das Fenster hatte 753 von 860 zur Verfügung, gebraucht
werden 518. Jetzt 62vh, und alle acht stehen da.

**Am Telefon reicht es nie** — 608 px Inhalt in 523 px Fenster, und das
bleibt so, egal welche Zahl dort steht. Dafür läuft die Kante aus, statt
scharf abzuschneiden. Eine weiche Kante liest sich als „hier geht es weiter";
eine scharfe liest sich als Ende.

### Warum `Rollrand` und nicht eine zweite Rechnung

Für die weiche Kante gibt es die Datei schon: `kern/helfer/rollrand.ts`, aus
demselben Grund gebaut (E141, E151, E159). Sie mass nur die **Waagerechte** —
Tabellen und Knopfleisten rollen zur Seite.

Es wäre die kürzere Arbeit gewesen, für die Senkrechte vier Zeilen daneben zu
schreiben. Genau das ist L34: ein Wert an zwei Stellen, nichts erzwingt
Gleichheit, und die Abweichung sieht man erst spät. Also misst dieselbe
Funktion jetzt beide Achsen:

```ts
const stand = hoch ? feld.scrollTop    : feld.scrollLeft;
const sicht = hoch ? feld.clientHeight : feld.clientWidth;
const ganz  = hoch ? feld.scrollHeight : feld.scrollWidth;
```

`quer` bleibt die Vorgabe, damit sich für keinen der sechs bisherigen
Aufrufer etwas ändert — test210 und test221 laufen unverändert grün. Die
Wörter sind je Achse andere (`links rechts` gegen `oben unten`), weil sie in
der CSS stehen und dort etwas bedeuten.

Eine Maske, kein aufgelegtes Element: ein Pseudo-Element im Rollfeld rollt
mit dem Inhalt und wäre nach dem ersten Wisch weg.

### Was die Prüfung misst

`test235` §9, neun Punkte. Der wichtigste steht dort nicht wegen des
Ergebnisses, sondern wegen der Messbarkeit:

```ts
p('Am Telefon rollt die Liste — sonst misst der Rest nichts', amHandy.rollt);
```

Passt eines Tages alles auch aufs Telefon, wird dieser Punkt rot — und das
ist richtig, denn dann messen die zwei Punkte darunter nichts mehr. Eine
Prüfung, die nicht rot werden kann, ist keine (§55.2).

Zwei Gegenproben, einzeln nachgewiesen: die senkrechte Achse auf die
waagerechte zurückgedreht macht 2 Punkte rot, die Höhe zurück auf 56vh macht
4 rot.

---

## E184 · Eine Erinnerung, die man schon kennt

**25. August 2026.** Aus Redurs Mund, während er an etwas anderem arbeitete:

> „kannst du die ‚1 Karte ist fällig'-Meldung weg machen, das kommt immer."

Sie kam wirklich immer: bei jedem Öffnen und bei jedem Neuladen, 1,8
Sekunden nach dem Start, quer über den unteren Bildschirmrand — auch über
einen gerade geöffneten Dialog.

Den Schalter dafür gab es seit jeher („Karteikarten · Beim Start melden"),
und er stand auf an. Aber das war die einzige Wahl: alles oder nichts. Wer
an Redion arbeitet und vierzigmal neu lädt, sah sie vierzigmal.

**Falsch war nicht, dass es sie gibt, sondern wie oft.** Eine Erinnerung,
die man schon kennt, ist keine Erinnerung mehr, sondern Lärm — und Lärm
bringt einen dazu, auch das Nützliche abzuschalten. Sie merkt sich jetzt den
Tag.

Der Merker wird **nur gesetzt, wenn wirklich etwas gezeigt wurde.** Sonst
verschluckte ein Start um 8 Uhr ohne fällige Karten die Meldung um 14 Uhr,
wenn dann welche fällig sind. Das ist der Punkt, den man beim Bauen leicht
falsch macht, und `test236` §5 hält ihn fest.

Prüflauf: `test236`, 16 Punkte. Die Gegenprobe — das alte „bei jedem Start"
wieder eingebaut — macht genau die zwei Punkte rot, über die sich beschwert
wurde.

Beim Schreiben der Prüfung fiel noch etwas auf: der erste Wurf suchte
`.toast`-Knoten. Die gibt es nicht — es gibt EIN Element `#toast`, dem
`.show` angehängt wird. Alle „kein Streifen"-Punkte waren damit grün, ohne
irgendetwas zu messen. Sie lesen jetzt `#toast` samt `.show`.

---

## E185 · Das Dashboard sieht über den eigenen Rand (L17)

**25. August 2026.**

L17 nannte vier fehlende Dinge, und beim Nachsehen hingen alle vier an
derselben Stelle: daran, was in einer Kachel stehen darf.

```txt
mehrere Datenquellen   `quelle`   eine FREMDE Datenbank statt der eigenen
KPI-Karten             `ziel`     eine Zahl gegen ein Ziel, mit Richtung
Layout                 —          jede Kachel einzeln weg und verschieben
Diagrammquellen        `wertKey`  die Verteilung SUMMIERT eine Spalte
```

### Die fremde Quelle

Bis hierher zeigte ein Dashboard genau eine Datenbank: seine eigene. Jetzt
kann eine Kachel sagen, woher sie ihre Zahlen nimmt — „Summe · Betrag aus
Rechnungen" auf einem Dashboard über Aufträge.

**Die fremden Zeilen kommen ungefiltert.** Ein Filter gehört zu einer
Ansicht, und die fremde Datenbank hat ihre eigenen — welche davon gälte? Eine
Kachel „Summe · Betrag aus Rechnungen" muss den Betrag ALLER Rechnungen
nennen, sonst nennt sie eine Zahl, deren Bedeutung von einer Einstellung
anderswo abhängt. Das ist die Sorte Zahl, der man nicht trauen kann. Unter
der Karte steht der Name der Quelle, damit man weiss, woher sie kommt, und
im Fuss steht, wie viele Kacheln von woanders sind.

Eine Quelle, die es nicht mehr gibt, ergibt 0 statt eines Absturzes — eine
gelöschte Datenbank ist ein normaler Fall.

### Die Kennzahl mit Ziel

Eine Zahl allein ist keine Kennzahl. „48 000" sagt nichts; „48 000 von
60 000" sagt alles. Dazu die **Richtung**: bei Umsatz ist mehr besser, bei
Fehlern und Kosten weniger. Ohne sie müsste die Farbe raten, und eine
ratende Farbe ist schlimmer als keine — deshalb wird beim Anlegen gefragt.

```txt
200 von 400, Ziel erreichen     ▴ 50 %,  orange   noch nicht
200 von 150, Ziel erreichen     ✓ 133 %, grün     geschafft
200 von 400, Obergrenze         ✓,       grün     gehalten
200 von 150, Obergrenze         ▾ 133 %, orange   gerissen
ohne Ziel                       „Ohne Ziel"       kein Balken, keine Farbe
```

**Der Balken wird bei 100 % gekappt, die Zahl nicht.** Ohne den Deckel liefe
er aus der Karte, und 340 % sähen aus wie 100 %. Die Zahl daneben sagt
weiterhin die Wahrheit.

**Und die Farbe trägt die Aussage nicht allein** (§38): ✓ ▴ ▾ stehen daneben,
und die Farbe liegt am Rand und am Balken, nicht auf der Zahl.

### Die Diagrammquelle

Die Verteilung zählte immer nur ZEILEN: „12 Aufträge in Zürich". Was man
wissen will, ist meistens „180 000 Umsatz in Zürich" — dieselbe Gruppierung,
ein anderer Wert. `wertKey` nennt die Zahlenspalte; ohne ihn wird gezählt
wie bisher.

Bei einer Mehrfachauswahl zählt eine Zeile in JEDER ihrer Gruppen, und die
Summe der Balken ist dann grösser als das Ganze. Das ist richtig so und
steht als Kommentar im Code, damit es nicht später als Fehler „behoben" wird.

### Das Layout

Es gab „Alle Kacheln entfernen" und sonst nichts. Wer eine falsche
hinzugefügt hatte, musste alle wegwerfen. Jetzt hat jede Kachel drei
Griffe: nach vorn, nach hinten, weg. Die Reihenfolge steht in der Ansicht,
nicht nur im Bild.

Was Griffe trägt, bekommt die Klasse `dash-kachel`. „Zuletzt geändert" und
„Als Nächstes" tragen dieselbe Klasse `dash-block`, sind aber feste Teile
des Dashboards — ohne diese Marke kann weder die CSS noch ein Prüflauf die
beiden auseinanderhalten.

### Was das Hinsehen fand, und keine Prüfung hatte

Die Griffe lagen absolut oben rechts **über dem Inhalt**. Im Bild stand:

```txt
408000
   ⟵ und darüber, auf der letzten Null, der ✕-Knopf
```

Also lesbar als `40800`. Beide sind gültige Zahlen, nur eine ist die
richtige — derselbe Fund wie in CLAUDE.md §55.2, wo `634.2166666667` als
`34.2166666667` dastand.

Der Platz wird jetzt **reserviert** statt beim Darüberfahren geschaffen. Ihn
erst beim Zeigen zu nehmen hiesse, dass jede Kachel unter dem Mauszeiger
springt; 18 px Streifen sind billiger als eine Zahl, die etwas anderes
behauptet, als sie ist.

Und: „Summe · Summe · Offene Rechnungen" stotterte, weil die Spalte wie die
Rechenart heisst. Heissen sie gleich, steht es einmal da.

### Drei Prüfungen, die zuerst nichts gemessen haben

**§7 konnte nicht rot werden.** Die Messung nahm die vorhandenen Zeilen —
Summe 200. Drei Zeichen stossen an nichts an, und die Gegenprobe blieb grün.
Jetzt steht eine zehnstellige Zahl im Prüfstand.

**Die Überschrift stösst erst am Telefon an.** Am Rechner ist der Block
530 px breit; eine Überschrift von 254 px erreicht die Griffe gar nicht. Bei
390 px Breite tut sie es — dort wird `padding-right` gebraucht, und dort
wird es gemessen.

**Und `browser.newPage()` öffnet einen neuen Kontext** mit eigener
IndexedDB. Die erste Fassung der Telefonmessung stand deshalb vor einem
leeren Arbeitsbereich. Dieselbe Falle wie in test231; jetzt wird die
Fenstergrösse derselben Seite geändert.

Prüflauf: `test237`, 55 Punkte, sieben Gegenproben — Quelle ignoriert (2
rot), Richtung ignoriert (3), `wertKey` ignoriert (3), Verschieben ohne
Wirkung (4), Balken ohne Deckel (1), Griffe zurück auf den Inhalt (3),
Stottern zurück (1).

---

## E186 · Ein Menü, das mit dem Arbeitsbereich wächst

**25. August 2026.** Nachtrag zu E185, gefunden beim Nachrechnen statt beim
Ansehen.

Das Menü „Kachel hinzufügen" bietet je Datenbank an:

```txt
1                        Anzahl der Einträge
3 je Zahlenspalte        Summe · Durchschnitt · Kennzahl mit Ziel
1 je Gruppenspalte       Verteilung nach …
1 je Paar aus beiden     <Zahl> nach <Gruppe>
```

Eine Datenbank mit drei Zahlen- und zwei Gruppenspalten macht 18 Einträge.
Seit E185 stehen dort **alle** Datenbanken des Arbeitsbereichs, nicht nur die
eigene. Bei fünfzig Datenbanken sind das neunhundert Knöpfe.

Durch neunhundert Knöpfe rollt niemand. Das ist kein Fehler, der beim Prüfen
auffällt — mit zwei Datenbanken im Prüfstand sind es sechsunddreissig, und
die passen —, sondern einer, der erst bei einem echten Arbeitsbereich
auftaucht. Genau die Sorte, die man beim Bauen mitdenken muss, weil man sie
später nicht sieht.

`UI.menuMitSuche` gibt es dafür seit langem und steht in derselben Datei
schon dreimal. Ein zweiter Weg dafür wäre L34 in klein.

### Ein Suchfeld allein war nicht genug

Eingebaut, ausprobiert, gemessen: „Rechnung" fand **null von dreiundzwanzig**
Einträgen. Der Filter liest den KNOPFTEXT, und der Datenbankname stand nur
in der Gruppenüberschrift.

Ein Suchfeld, das nicht findet, ist schlimmer als keines: es ist eine Zusage,
die es nicht hält, und wer sie einmal glaubt, sucht beim nächsten Mal
woanders. Der Name steht jetzt an jedem fremden Eintrag — 4 von 23 —, und
das macht die Zeile nebenbei für sich lesbar: wer weit gerollt hat, sieht
die Überschrift nicht mehr und weiss sonst nicht, woher die Zeile unter dem
Zeiger stammt.

Prüflauf: `test237` §8, sieben Punkte. Gegenproben: `UI.menu` statt
`UI.menuMitSuche` macht vier rot, der Name zurück in die Überschrift zwei.

**Und die README sagt jetzt, was es gibt.** Sie zählte acht Ansichten auf;
es sind dreizehn, und Raster, Feed, Karte, Dashboard und Pivot fehlten ganz.
Dazu kamen zwei Abschnitte, die es vorher nicht gab: was ein Dashboard kann,
und aus welchen Werkzeugen Redion Daten übernimmt. §33 verlangt, dass die
README wichtige Nutzerfunktionen nennt — eine README, die weniger verspricht
als die App kann, ist auch eine falsche README, nur in die andere Richtung.


## E187 · Der Strom fliesst wirklich — eine Simulation, die rechnet

*25. August 2026*

Redur hat es in einem Satz gesagt: „es sollte bei der Zeichnungen die strom
direkt flissen könenn wie echte simulationen". Die Frage war, was „echt"
heisst.

**Die billige Antwort wäre eine Wegsuche gewesen.** Schauen, ob es von L nach
N einen durchgängigen Pfad gibt, und auf diesem Pfad gestrichelte Linien
laufen lassen. Das ist in einer Stunde gebaut, sieht in einer Vorführung gut
aus — und beantwortet keine einzige Frage, die im Unterricht gestellt wird.
Was fällt an der Lampe ab, wenn zwei in Reihe hängen? Warum wird der
Vorwiderstand warm? Was zeigt das Amperemeter, wenn es an der falschen Stelle
sitzt? Eine Animation weiss das nicht. Sie weiss nur, dass es leuchtet.

Deshalb steht in `src/bereiche/elektro/simulation.ts` eine
**Knotenpotentialanalyse**. Sie stellt aus der Zeichnung ein lineares
Gleichungssystem auf, löst es mit Gauss und Spaltenpivot und liefert für
jedes Bauteil Spannung, Strom und Leistung. Zwei gleiche Lampen in Reihe an
230 V ergeben 115 V und ein Viertel der Helligkeit — nicht, weil das
irgendwo einprogrammiert wäre, sondern weil es herauskommt.

### Die Netzliste steht nirgends — sie ergibt sich

Was mit was verbunden ist, wird nicht gespeichert. Es wird aus der Zeichnung
GELESEN: eine Leitung, die an einer Klemme endet, verbindet sie; zwei
Leitungen, die sich an einem Punkt berühren, sind ein Netz; eine Klemme
mitten auf einer Leitung zapft sie an. Eine Verbandsuche fasst das zusammen.

Genau deshalb muss man den Plan malen und nicht tippen — und genau deshalb
ist ein Zeichenfehler auch ein Schaltungsfehler. Das ist keine Härte,
sondern der Beruf.

### Der Kontakt, der einen Widerstand hat

Zuerst stand hier der Lehrbuchweg: eine ideale Leitung als Spannungsquelle
mit 0 V, damit 1/0 die Matrix nicht sprengt. Exakt, elegant — und an der
**Selbsthaltung** gescheitert, dem meistgezeichneten Steuerstromkreis
überhaupt. Sobald der Haltekontakt zumacht, liegen zwei ideale Kurzschlüsse
parallel, und dann ist nicht bestimmt, wie sich der Strom auf sie verteilt:
zwei Zeilen der Matrix sind identisch, das System hat keine eindeutige
Lösung. Das war kein Rechenfehler, sondern eine ehrliche Auskunft über ein
zu ideales Modell.

Ein geschlossener Kontakt bekommt jetzt **1 mΩ**. Keine Notlösung, sondern
die Wirklichkeit: ein Relaiskontakt liegt bei etwa 5 mΩ, ein Schalter bei 10,
ein Meter Draht mit 1,5 mm² bei 12. Der Strom teilt sich damit auf zwei
parallele Kontakte so auf, wie er es in der Schaltung auch tut, und der
Spannungsabfall bleibt bei 0,2 A unter einem Zehntel Millivolt.

Das Amperemeter bleibt die 0-V-Quelle — der Strom durch eine Spannungsquelle
ist eine Unbekannte des Systems, und ihr Wert IST damit der Messwert.

### Ein Nanoampere von nirgendwo

Jedes Netz bekommt zusätzlich 1 TΩ nach Masse. Ohne das ist jede Schaltung
mit einem freischwebenden Netz unlösbar, und freischwebende Netze sind der
Normalfall: bei einer Wechselschaltung führt IMMER eine der beiden
Korrespondierenden ins Leere. Denselben Weg geht SPICE, und aus demselben
Grund.

Der Preis stand danach im Fuss der Fläche: „grösster Strom 4.71e-10 A",
während die Lampe aus war. Eine Behauptung, die niemand widerlegen kann.
Alles unter einem Nanoampere ist jetzt eine glatte Null — auch für ein gutes
Messgerät ist dort Schluss.

### Die Schaltung hat ein Gedächtnis

Ein Schütz, das anzieht, schliesst seine Hilfskontakte, und die verändern die
Schaltung, die gerade gerechnet wurde. Also wird gerechnet, nachgeführt und
wieder gerechnet, bis sich nichts mehr ändert. Ein Blinkrelais ist der Fall,
in dem sich nie etwas beruhigt — er wird als „kommt nicht zur Ruhe" gemeldet
statt endlos gerechnet.

Und zwischen zwei Bedienschritten wird der Spulenzustand MITGENOMMEN. Ohne
das fiele das Schütz beim Loslassen des Startknopfs sofort wieder ab, und die
Selbsthaltung — der erste Steuerstromkreis, den jeder lernt — ginge nicht.

### Was die Zeichnung zeigt

Über jeder stromführenden Leitung liegt ein zweiter, laufender Strich; die
Geschwindigkeit folgt dem Logarithmus des Stroms, weil zwischen einer
Meldeleuchte mit 10 mA und einem Motor mit 10 A drei Grössenordnungen
liegen und linear die eine stillstünde, während die andere flimmert. Wer
„weniger Bewegung" eingestellt hat, sieht die Strichelung trotzdem — §38
verlangt, dass die Aussage nicht nur in der Farbe steckt.

Leuchten bekommen einen Schein, dessen Stärke der LEISTUNG folgt, nicht dem
Strom: eine Lampe an halber Spannung ist ein Viertel so hell, und genau das
soll man an der Reihenschaltung sehen.

Solange der Strom läuft, ist die Fläche eine Schalttafel und kein
Zeichenbrett: ein Tipp schaltet, nichts wird verschoben, nichts gelöscht.
Die Schalterstellungen landen **nicht** im Block. Ein Plan ist eine
Zeichnung, kein Zustand — wer ihn morgen öffnet, will ihn so sehen, wie er
gezeichnet ist, und nicht mit dem Licht an, das gestern jemand angelassen
hat.

### Und was das Hinsehen gefunden hat

Vier Dinge, von denen drei keine Prüfung hatte (§55):

* Der Knopf „▶ Strom" erbte die 34 px der Icon-Knöpfe und zeigte „Stron".
  Gemessen: `scrollWidth` 40 gegen `clientWidth` 34. Derselbe Fehler wie die
  abgeschnittene Zahl in §55.1, nur in Buchstaben.
* Der Fuss meldete „0 leuchteten" statt „0 leuchten".
* Der Leckstrom stand als Messwert da (oben).
* Und der wichtigste: im ersten Bild führten **alle fünf** Leitungen der
  Wechselschaltung Strom, obwohl nur vier dürfen. Die Rechnung stimmte —
  drei Leitungen lagen auf derselben Höhe und ÜBERLAPPTEN sich, waren also
  eine einzige. Die Lampe brannte aus dem falschen Grund.

Der letzte Punkt hat eine Meldung nach sich gezogen, die es vorher nicht
gab: liegen zwei Anschlüsse DESSELBEN Bauteils im selben Netz, ist es
überbrückt, und die Fläche sagt es. Diese Meldung hat sich sofort bezahlt
gemacht — sie hat beim Schreiben von `test239` §11 zweimal eine Prüfung
davor bewahrt, grün über eine kaputte Schaltung zu berichten.

### Grenzen, die benannt werden

Gleichstrom, eingeschwungen, linear. Ein Kondensator ist eine Unterbrechung,
eine Spule eine Verbindung, eine Zeitverzögerung gibt es nicht. Wo eine
Annahme getroffen wird, steht sie in `annahmen` und ist im Fuss antippbar —
statt einer Zahl, die niemand nachprüfen kann.

Prüflauf: `test239`, 68 Punkte. Darunter die Wahrheitstafel der
Wechselschaltung (alle vier Zeilen), alle acht Stellungen der
Kreuzschaltung, die Selbsthaltung über sechs Bedienschritte und die
Wheatstone-Brücke — abgeglichen und verstimmt. Die Brücke steht dort nicht
zur Zierde: sie lässt sich nicht in Reihe und Parallel zerlegen, und eine
Simulation, die nur das kann, muss dort unauffällig falsch liegen.


## E188 · Ein Formelheft, das offen bleibt, während man zeichnet

*25. August 2026*

Redur hat es genau beschrieben: „wenn ich zeichne und dort bei einfügen
Formelheft klicke, sollte das Formelheft dort kommen, und ich es bewegen
können, und auf alle Seiten gehen können und die Seiten auch in Favoriten
speichern können."

Das entscheidende Wort ist **während**. Ein Nachschlagewerk, das die Arbeit
ersetzt, statt daneben zu stehen, ist keines: man schlägt nach, schliesst es,
merkt sich die Formel — und merkt sie sich falsch. Deshalb ist das Heft ein
schwebendes Fenster und kein Dialog. Kein abdunkelnder Hintergrund, kein
Überlagerungsschleier; der Plan darunter bleibt sichtbar und nimmt weiter
Klicks entgegen. `test240` §3 prüft genau das, mit `elementFromPoint`.

### Zwei Hefte in einem

**Redions eigene Sammlung** — rund fünfzig Formeln in vierzehn Kapiteln, von
Grundformeln bis Kompensation. Jede erklärt sich in einem Satz, nennt ihre
Grössen mit Zeichen und Einheit, und rechnet: Gesuchte wählen, Werte
eintippen, Ergebnis ablesen — samt Rechenweg, weil im Unterricht der Weg
bewertet wird und nicht die Zahl.

**Das eigene PDF** — einmal geladen, danach durchblättert, Seiten merkbar. Es
liegt als gewöhnlicher Redion-Anhang in der IndexedDB und geht damit durch
`.redion`-Sicherung und Wiederherstellung wie jede andere Datei.

Warum kein Heft mitgeliefert wird: eine gescannte Formelsammlung ist fremdes
Lehrmaterial mit eigenem Urheberrecht. Redion liefert die FÄHIGKEIT, ein Heft
zu benutzen, und eine eigene, selbst geschriebene Sammlung dazu. Die Formeln
selbst gehören niemandem; die Auswahl und der Satz eines fremden Hefts schon.

### Kein eval()

§20 verbietet es, und die Formeln lösen deshalb über echte Funktionen —
`loese: { I: v => v.U / v.R }` statt einer Zeichenkette, die jemand auswertet.
`test240` §6 durchsucht die drei erzeugten Dateien und hat eine Gegenprobe
dabei, damit die Regel nicht stumm wird.

### Vier Fehler, gefunden durch Hinsehen und Messen

* **Das Heft öffnete das falsche Kapitel.** Beim Zeichnen eines gewöhnlichen
  Stromkreises schlug es die *Beleuchtungsstärke* auf — weil eine Lampe im
  Plan stand und `lampe` auf „Lichttechnik" zeigte. Eine Lampe im
  Stromlaufplan ist ein Verbraucher; Lichttechnik gehört zum Bauplan. Nach
  dem Symbol richtig geraten, nach der Frage falsch.
* **Die Kapitelnamen brachen scharf am Fensterrand ab** — „Leistung und E".
  Dasselbe Bild wie E159, wo „Meine Fehler" mitten im Wort endete. Der Rand
  läuft jetzt aus, über `Rollrand` und nicht über eine vierte abgeschriebene
  Rechnung.
* **Das aktive Kapitel stand ausserhalb des Bildes.** Es war hervorgehoben,
  aber man sah es nicht — und wer nicht weiss, wo er ist, blättert nicht
  weiter, sondern sucht.
* **Das Heft vergass seinen Platz, wenn man es an den linken oder oberen
  Rand geschoben hatte.** `ort.x || vorgabe`: die Null ist im Sinne von
  JavaScript falsch und im Sinne des Menschen richtig. Derselbe Fehler wie
  eine Zahl, die zu einer anderen Zahl wird — er sieht aus wie Absicht.

### Und zwei Fehler in den Prüfungen selbst

Sie sind hier festgehalten, weil beide dieselbe Versuchung hatten.

`test240` §9 mass die Knopfgrössen am Telefon und fand den Stern bei 43×27
und die Kapitelknöpfe bei 27 hoch. §37 nennt 44 px. Die bequeme Lösung wäre
gewesen, die Prüfung auf 30 zu setzen — sie wäre grün geworden, und der
Knopf wäre weiter zu klein. Stattdessen steht 44 in der Prüfung und die
Knöpfe sind gewachsen.

`test240` §1 verlangte für jede Grösse eine Einheit und machte damit fünf
RICHTIGE Einträge rot: Wirkungsgrad, cos φ, Dielektrizitätszahl,
Windungszahl und Polpaarzahl sind Verhältnisse und haben keine. Die Prüfung
verlangt jetzt das Feld (vergessen fällt auf) und führt daneben die Liste
der vierzehn einheitenlosen Grössen. Wer eine hinzufügt und die Einheit
vergisst, muss diese Zeile anfassen — und merkt es dabei.

### Der zweite Weg hinein

Der Knopf in der Planfläche ist der wichtigere, aber eine Formel braucht man
auch beim Schreiben einer Aufgabe und beim Nachrechnen. Deshalb steht das
Heft zusätzlich in der Befehlspalette unter der Gruppe „Elektro". Beide
Eingänge zeigen dasselbe Fenster — es gibt nur eines.

Prüflauf: `test240`, 65 Punkte.


## E189 · Aufgaben, die sich selbst erzeugen

*25. August 2026*

Der Elektro-Modus brauchte Übungen. Der naheliegende Weg wäre eine Sammlung
gewesen: dreihundert Fragen, von Hand geschrieben, mit den Antworten daneben.
Sie hat drei Nachteile, und der dritte ist der schlimme.

Sie ist nach zwei Wochen durch — wer sie zweimal gemacht hat, kennt die
Reihenfolge und nicht den Stoff. Sie veraltet — kommt ein Symbol ins Register,
fehlt es in den Aufgaben, und niemand merkt es, denn es fehlt ja nur eine
Frage, die es nie gab. **Und sie kann falsch sein.** Eine von Hand
geschriebene Antwort ist eine zweite Wahrheit neben der im Register. Zwei
Wahrheiten laufen auseinander, und dann lernt jemand etwas Falsches und
bekommt dafür einen Haken.

Deshalb ERZEUGT `bereiche/elektro/aufgaben.ts` die Aufgaben aus dem, was
ohnehin da ist: den hundert Symbolen, den fünfzig Formeln und einem Dutzend
Schaltungen. Elf Arten in vier Gruppen — Fachzeichen, Rechnen, Schaltungen,
Messen. Eine Frage nach dem Namen eines Symbols kann damit nicht falsch sein:
die Antwort kommt aus derselben Zeile, aus der auch die Palette den Namen
nimmt. Und bei einer Rechenaufgabe wird die Musterlösung nicht
danebengeschrieben, sondern GERECHNET — mit demselben Code, der auch im
Formelheft rechnet.

### Der Zufall ist gesät

`Math.random()` wäre bequem und würde jede Prüfung wertlos machen: eine
Aufgabe, die bei jedem Lauf anders ist, lässt sich nicht nachrechnen. Der
Zufall kommt aus einem Startwert (mulberry32). Derselbe Startwert gibt
dieselbe Aufgabe — im Prüflauf, im Unterricht für alle gleich, und beim
Nachbesprechen wieder Wort für Wort dieselbe. Der Startwert steht deshalb
nach jeder Prüfung sichtbar da.

### Fünf Fehler, die beim Messen herausfielen

Alle fünf sahen im Bild völlig normal aus.

**Zwei gleiche Antwortmöglichkeiten.** Zwei Bauteile können dieselbe
Anschlussliste haben — „1, 2" gibt es ein Dutzend Mal. Standen sie
nebeneinander, war die Frage keine mehr: wer die zweite anklickte, bekam ein
rotes Kreuz für dieselbe Antwort.

**Eine Aufgabe mit 320 000 Volt.** 82 kΩ ist ein plausibler Widerstand,
3,9 A ein plausibler Strom — ihre KOMBINATION ist es nicht. Wer so etwas
rechnet, gewöhnt sich ab, das Ergebnis anzusehen, und genau das Ansehen ist
im Beruf die einzige Sicherung gegen einen Zahlendreher. Jetzt muss auch das
Ergebnis in seinem Bereich liegen, geprüft erst nach dem Formelzeichen und
sonst nach der EINHEIT: `I` stand in der Tabelle, `I₁` und `I_N` nicht, und
über die kam ein Strom von 254 A herein. Negative Ergebnisse fallen ganz weg.

**„120 µA sind wie viel kA?"** Neun Zehnerpotenzen sind keine Aufgabe aus dem
Beruf. Umgerechnet wird jetzt höchstens zwei Stufen weit — und der Fehler,
der etwas kostet, passiert ohnehin bei einem Schritt.

**Drei von vier Möglichkeiten waren Beischriften.** Gefragt war, welches
Bauteil im Plan fehlt; zur Auswahl standen „Betätigung: Drücken", „Betätigung:
Drehen" und „Betätigung: Schlüssel" — Symbole ohne einen einzigen Anschluss.
Sie stammten aus derselben Gruppe wie der gesuchte Schalter. Wer weiss, dass
ein Bauteil Klemmen braucht, hatte die Antwort ohne Nachdenken. Ablenker
brauchen jetzt mindestens zwei Anschlüsse.

**Und einer im Code selbst.** Die Auswahl der Betriebsmittel rief `w.misch`
in der Bedingung und noch einmal im Zweig — und weil jeder Aufruf den Würfel
weiterdreht, prüfte die Bedingung eine andere Mischung als die
zurückgegebene. Die richtige Antwort hätte fehlen können.

### Der Arbeitsplatz (Punkt 100)

Drei Spalten: links Aufgaben, in der Mitte der Plan, rechts Notizen und der
Weg zum Formelheft. Der Grund für drei Spalten ist nicht Platz, sondern ZEIT.
Eine Aufgabe lösen heisst lesen, zeichnen, nachschlagen, rechnen,
aufschreiben — und dazwischen springt man ein Dutzend Mal hin und her. Wer
dafür die Ansicht wechseln muss, liest die Aufgabe am Ende dreimal.

Die Mitte ist ein gewöhnlicher Redion-Block. Ein zweiter Schaltplaneditor
„für den Arbeitsplatz" wäre L34 in gross gewesen.

### Und was das Hinsehen fand

**Der Weiter-Knopf stand unter dem Bildschirmrand.** `.overlay` setzt
`padding-top:14vh` — richtig für einen Suchdialog. Bei 900 px Höhe fing das
Fenster damit bei 126 an, war 800 hoch und endete bei 926. Eine Übung, deren
Weiter-Knopf man nicht sieht, ist zu Ende.

**Die Antwortmöglichkeiten standen zur Hälfte draussen.** Im Arbeitsplatz ist
die Aufgabenspalte 280 px breit, während das Fenster 1180 hat. Zwei Spalten
ergaben dort 140 px je Möglichkeit. Eine Medienabfrage nach Bildschirmbreite
hätte das nie gesehen — der Bildschirm war ja breit. `auto-fit` bricht nach
der Breite der SPALTE um.

**Der Plan war unlesbar.** Er wurde immer 620 × 360 gross gezeichnet, egal
wie viel darauf stand — und in der schmalen Spalte waren die
Betriebsmittelkennzeichen drei Pixel hoch. Die Frage lautete ausgerechnet
„welches Betriebsmittel ist das?". Die Blattgrösse folgt jetzt dem Inhalt.

**Und die Prosa stand in Schreibmaschinenschrift.** Die Zusatzzeile ist für
„Gegeben/Gesucht" gedacht; bei Schaltungsaufgaben trägt sie einen
gewöhnlichen Satz, und der sah aus wie Quelltext.

Prüflauf: `test241`, 91 Punkte. Darunter für jede der elf Arten vierzig
Würfelungen und die Frage, ob die Aufgabe ihre EIGENE Lösung als richtig
durchgehen lässt — mit Gegenproben, damit ein `pruefe`, das immer Ja sagt,
nicht alles grün macht.


## E190 · Zwei Bilder, die mehr erklären als ein Absatz

*25. August 2026*

Aus der Liste der hundert Elektro-Funktionen blieben in der Rechner-Hälfte
drei Punkte offen, die keine Rechnung sind, sondern eine Ansicht.

### Das Formeldreieck (Punkt 65)

Die älteste Merkhilfe der Elektrotechnik und immer noch die beste: oben die
Grösse, die aus den beiden unteren hervorgeht, und wer eine davon zuhält,
sieht die Formel für sie. U zuhalten ergibt R · I, R zuhalten ergibt U / I.
Dreissig Sekunden zum Lernen, und man vergisst es nicht mehr.

Es wird nicht von Hand gezeichnet, sondern aus der SCHREIBWEISE der Formel
gelesen. `U = R · I` und `I = U / R` beschreiben dasselbe Dreieck — das Modul
erkennt beide Formen und legt sie über die sortierte Menge der drei Grössen
zusammen. Aus dem Register kommen so sieben Dreiecke, und wenn morgen eine
Produktformel dazukommt, gibt es morgen ihr Dreieck.

Alles, was nicht die Form `A = B · C` oder `A = B / C` hat, bekommt **kein**
Dreieck. Das ist der wichtigere Teil: für `X_C = 1 / (2 · π · f · C)` eines zu
erfinden wäre eine Merkhilfe, die falsch merkt. `test240` §10 prüft beide
Richtungen — dass die richtigen erkannt werden UND dass fünf ungeeignete
Schreibweisen abgelehnt werden.

### Die Sinuskurve (Punkt 90)

Sie beantwortet die Frage, an der im Wechselstrom die meisten hängenbleiben:
warum sind 230 V nicht 230 V. Der Scheitelwert ist 325, der Effektivwert 230,
der Momentanwert irgendwas dazwischen — drei Zahlen für dieselbe Spannung,
und in einer Zeichnung sind sie in einem Blick auseinander.

Der Effektivwert steht als LINIE da und nicht als Zahl am Rand: dass er unter
dem Scheitel liegt, ist die ganze Aussage, und eine Zahl daneben zeigt das
nicht.

Bewegt wird mit einem `input[type=range]` und nicht mit einem gezogenen Punkt
im SVG. Das ist keine Bequemlichkeit: ein Schieber lässt sich mit der Tastatur
bedienen, hat einen Namen für den Screenreader und braucht am Telefon keine
Zielgenauigkeit (§37, §38).

Ein schöner Prüfstein steckt in der Sache selbst: bei 45° ist sin = 1/√2, und
û/√2 ist genau der Effektivwert. Der Momentanwert liegt dort also exakt auf
der Effektivwertlinie — kein Zufall, sondern die Definition, und damit eine
Prüfung, die eine falsche Formel sofort auffliegen lässt.

### Der gesuchte Wert im Plan (Punkt 80)

In einer Aufgabe steht „gesucht: der Strom durch R2", und dann muss man R2 im
Plan auch finden. Ohne Hervorhebung fängt die Aufgabe mit einer Suchübung an,
die niemand gestellt hat. `alsSvg` nimmt jetzt `hervor` und legt einen
gestrichelten Ring um das genannte Bauteil — einen Ring und keinen Farbwechsel,
denn ein zweiter Farbton heisst in dieser Zeichnung schon „führt Strom".

### Und ein Fehler in einer Prüfung

`test241` §6 war bei etwa jedem zweiten Lauf rot, an einer Stelle, die nichts
mit dem Fehler zu tun hatte: die Übungsfläche würfelt die Aufgabenart, und
bei „Rechnen" oder „Einheiten umrechnen" gibt es gar keine
Antwortmöglichkeiten zum Anklicken. Die Art wird jetzt vorgegeben — und der
Zahlenweg bekam gleich drei eigene Prüfpunkte, denn vorher prüfte §6 nur die
eine Hälfte.

Eine Prüfung, die würfelt, was sie misst, misst nichts.

Prüflauf: `test240` §10–§12, dreiunddreissig neue Punkte (97 gesamt);
`test241` 95 Punkte.


## E191 · Fachzeichen auf dem PDF, und ein Ausschnitt als Lernkarte

*25. August 2026*

Redur hat sein Lehrmittel als PDF. Zwei Dinge fehlten dafür, und beide sind
absichtlich klein ausgefallen — sie benutzen, was schon da ist.

### Punkt 42 — ein Symbol auf die Seite setzen

Eine neue Markenart `zeichen` in `bereiche/pdf/marken.ts`, gezeichnet über
`Register.fachzeichen.alsSvg`. **Dieselbe Quelle wie die Palette im
Schaltplan-Editor**, und auch dieselbe Auswahl: das Werkzeug öffnet
`Planflaeche.paletteHtml`. Eine zweite Symbolliste fürs PDF wäre L34 gewesen
— sie liefe auseinander, und niemand merkte es, bis dasselbe Zeichen auf
zwei Seiten verschieden aussieht. `test242` §2 vergleicht die Zahl in der
Auswahl mit der im Register.

Das Zeichen liegt als gewöhnliche Marke im Block und geht damit durch
Rückgängig, Papierkorb, Druck und `.redion`-Sicherung wie ein Strich — ohne
dass irgendwo ein Sonderfall dafür steht. Ein Tipp darauf dreht es um 90°,
dieselbe Bewegung wie R im Planeditor.

**Ein Haken, der beim Bauen sichtbar wurde.** `updateNode` überträgt nur
Attribute und `textContent`. Ein `<g>` voller Pfade überlebt das nicht: bei
gleichem Elementnamen blieben die alten Kinder stehen, und ein getauschtes
Zeichen zeigte weiter das alte Bild. Knoten mit Kindern werden jetzt ersetzt
statt geflickt. `test242` §3 tauscht deshalb ausdrücklich eine Kennung und
sieht nach, ob sich das Bild mitändert.

### Punkt 43 — ausschneiden und lernen

Kein eigenes Gummiband: **das Rechteck-Werkzeug gibt es längst**, und ein
gezeichnetes Rechteck ist zugleich die Auswahl und der bleibende Vermerk,
was man aus dieser Seite herausgeschnitten hat. Ein zweites Ziehwerkzeug
wäre eine zweite Bedienung für dieselbe Geste.

Geschnitten wird aus dem `img`, das ohnehin auf der Seite steht. Es kommt aus
einem `blob:`-Verweis derselben Herkunft, die Zeichenfläche wird dadurch
nicht unrein, und `toBlob` darf lesen. Der Ausschnitt wird als gewöhnlicher
Anhang abgelegt.

Die Karteikarte trägt dafür ein neues Feld `bildId`. `inline()` kann keine
Bilder — nachgesehen, nicht vermutet —, also steht das Bild ausdrücklich im
Renderer und nicht im Text. Weisser Grund, weil ein Buchausschnitt auf Weiss
gedruckt ist und im Dunkelmodus sonst als graues Rechteck erschiene.

**Urheberrecht.** Ein Ausschnitt aus einem gekauften Lehrmittel in die eigene
Karteikarte auf dem eigenen Rechner ist Privatgebrauch. Er geht an keinen
Server und kommt nicht ins Verzeichnis. Redion liefert das Werkzeug, nicht
den Inhalt — dieselbe Linie wie beim Formelheft (E188).

### Und zwei Fehler in der Prüfung selbst

Beide sahen aus wie kaputte Funktionen und waren keine.

`test242` §2 tippte auf sechzig Prozent der Seitenhöhe. Die Seite ist
1003 px hoch und beginnt bei y = 380 — der Klick landete unter dem
Fensterrand und traf nichts. Im Bericht stand „Ein Tipp öffnet die
Symbolauswahl ✗", und das Werkzeug war völlig in Ordnung.

Und §4 legte die Blockkennungen auf `window`. §4 und §7 laden absichtlich
neu, und ein Neuladen löscht alles, was am Fenster hängt. Die Kennungen
bleiben jetzt im Prüfskript.

Prüflauf: `test242`, 42 Punkte.

## E192 · Drei Aufgaben, die den Schaltplan lesen

*(26. August 2026, Punkte 52, 53, 59)*

Bisher wurden Aufgaben aus den Registern erzeugt: nimm ein Symbol, frag nach
seinem Namen. Die drei neuen fragen etwas, das in keinem Register steht.

    plan-leitung   Eine Leitung fehlt. Welche?
    plan-fehler    Die Schaltung tut nicht, was sie soll. Woran liegt es?
    plan-leuchtet  Leuchtet die Leuchte bei diesen Stellungen?

Die Antwort kommt aus `Stromfluss.rechne`. Sie steht nirgends geschrieben und
kann deshalb auch nicht veralten: ändert sich die Simulation, ändert sich die
Lösung mit. Das ist der ganze Grund, warum diese drei so gebaut sind.

### Was der Massstab sein muss: das Verhalten, nicht die Helligkeit

Der erste Bau fragte „leuchtet es überhaupt?", und daran war fast alles
falsch, was falsch sein konnte.

Bei einer **Wechselschaltung** fehlte ein Draht, und die Lampe leuchtete
trotzdem — man musste nur den anderen Schalter umlegen. Nach dem alten
Massstab war der Plan heil. Er war es nicht: von zwei bedienbaren Stellen
blieb eine übrig, und genau das ist der Fehler, den die Aufgabe zeigt.

Beim **Zeitrelais** brachte ein ABLENKER die Leuchte zum Brennen — dauernd
statt verzögert. Zwei richtige Antworten, eine davon mit rotem Kreuz.

Beides misst jetzt dasselbe: ein Muster über ALLE Schalterstellungen,
`H` volle Helligkeit, `h` schwach, `s` es fliesst etwas, `.` nichts. Zwei
Pläne mit gleichem Muster sind dieselbe Schaltung. Der fehlende Draht muss
das Muster ändern; kein Ablenker darf es wiederherstellen.

### Eine Leitung hat keine Richtung

`G1:L — E1:X1` und `E1:X1 — G1:L` sind derselbe Draht. Beide standen zur
Wahl, in 56 von 600 Würfelungen. Die Prüfung auf doppelte Möglichkeiten sah
nichts, weil die beiden Texte wirklich verschieden SIND. Der Schlüssel der
Ablenkermenge ist jetzt das sortierte Paar.

Und im selben Zug ein zweites Mal derselbe alte Fehler: `w.misch` stand in
der Bedingung UND im Zweig. Jeder Aufruf dreht den Würfel weiter, geprüft
wurde also eine andere Reihenfolge als die zurückgegebene. Hier trug es
nichts aus — die Menge hatte immer genau vier Einträge —, aber es war eine
Änderung davon entfernt, eine Aufgabe ohne ihre eigene Lösung zu erzeugen.

### Eine Möglichkeit, die nie stimmt, ist geschenkt

Zwei standen da, und beide waren nie die Lösung.

`plan-fehler` bot „Die Quelle liefert zu wenig Spannung" an — in 120
Würfelungen kein einziges Mal richtig. `plan-leuchtet` bot „Ja, aber
schwächer als normal" an — dasselbe. Wer das bemerkt, hat von vier
Möglichkeiten nur noch drei, und lernt nebenbei, dass es diesen Fall nicht
gibt. Beide sind jetzt echte Fälle: die Quelle wird abgesenkt, und die
Simulation muss die schwächere Helligkeit bestätigen, sonst gilt der Fall
nicht.

Wie der zweite auffiel, ist der Teil, der es wert ist, aufgeschrieben zu
werden. Nicht durch Zählen. Ich verstellte die Schwelle für „volle
Helligkeit" von 0,8 auf 0,4, um zu sehen, ob der Prüflauf das merkt — und er
blieb grün. Eine Schwelle, die nichts trennt, trennt nichts, weil zwischen
ihren Seiten kein einziger Fall liegt. §55.2 sagt, eine Prüfung muss rot
werden KÖNNEN; hier zeigte dieselbe Probe, dass die Aufgabe eine Antwort
anbot, die es nicht gab.

Der Abstand ist jetzt Absicht: abgesenkt wird auf 40 bis 65 Prozent, das
ergibt 16 bis 42 Prozent Licht, und zur Schwelle bei 80 bleibt Luft. Bei
79 gegen 81 Prozent wäre „voll oder schwächer?" ein Münzwurf.

### Keine Zahl, die nichts bedeutet

Beim Kurzschluss stand in der Erklärung: *„Nachgerechnet fliessen 460000 A."*

Die Simulation rechnet mit einer idealen Quelle ohne Innenwiderstand. Die
Zahl ist keine Messung, sondern das Ergebnis einer Division durch fast Null.
Ein Lernender merkt sie sich trotzdem. Jetzt steht da, was wirklich gilt:
den Strom begrenzt nur noch die Leitung, und er steigt weit über jeden
Nennstrom. Der Prüflauf lässt keine Zahl über tausend in einer Erklärung zu.

### Und der Fund, den nur die Bilder machen konnten

Die Brücke über ein Bauteil wurde mit Punkten weit ausserhalb des Blattes
eingetragen — `{-900,-900}` —, weil `Stromfluss` über die Klemmenangabe
verbindet und die Geometrie dafür nicht braucht. Gerechnet stimmte alles.
**Im Bild war nichts zu sehen.**

Eine Aufgabe „diese Leuchte ist überbrückt — leuchtet sie?" über einen Plan,
in dem die Brücke fehlt, ist nicht schwer, sondern unlösbar. Und die zu
niedrige Spannung stand überhaupt nirgends: die Zeichnung sah heil aus, und
„die Quelle liefert zu wenig Spannung" war nur durch Ausschluss zu erraten.

Kein Prüflauf konnte das melden. Er las dieselbe Netzliste wie die
Simulation, und die war richtig. Gesehen hat es ein Bildschirmfoto (§55).

Die Brücke läuft jetzt sichtbar unter dem Bauteil herum, auf einer Bahn
unterhalb aller Bahnen, die `planBauen` vergeben hat — eine reine Kreuzung
verbindet in `Stromfluss.netze` nichts, nur ein Knick auf fremder Strecke.
Und das Blatt wächst mit, sonst würde genau die neue Leitung abgeschnitten.
Die Spannung steht als Beschriftung im Plan, über `plan.texte` (Punkt 47) —
kein neues Feld im Renderer für etwas, das es schon gibt.

Geprüft wird das am gezeichneten SVG, nicht am Datenmodell. Ein Prüflauf,
der das Modell befragt, hätte beide Fehler bestätigt.

### Prüflauf

`test243`, 37 Punkte. Er rechnet die Antworten mit EIGENEM Werkzeug nach —
eigene Netzliste, eigene vollständige Stellungssuche —, nicht mit
`besteStellung` aus dem Aufgabenmodul. Ein Lauf, der die Lösung aus derselben
Funktion holt wie die Aufgabe, prüft nur, dass zweimal dasselbe herauskommt.

Zwei Fehler im Lauf selbst sind dabei aufgefallen und stehen als Kommentar
drin: Ein Schütz heisst mit Spule und Kontakt BEIDE `K1` — wer das erste
Bauteil mit diesem Namen nimmt, greift die Spule und sucht dort vergeblich
die Klemme 14; aufgelöst wird über die Klemme. Und `/\bV\b/` in einer
Vorlagenzeichenkette ist kein Wortende, sondern ein Rückschritt-Zeichen.

## E193 · In den Plan tippen, und der einzige Massstab dafür

*(26. August 2026, Punkte 59 und 60)*

Zwei Aufgabenarten kommen dazu, und damit sind alle hundert Elektro-Punkte
abgearbeitet.

    plan-stromweg    Tippe die Leitungen an, die am Stromweg beteiligt sind.
    kreis-zuordnen   Gehört K1 in den Steuer- oder in den Hauptstromkreis?

`plan-stromweg` ist die erste Aufgabe, bei der man IN die Zeichnung tippt
statt eine von vier Möglichkeiten anzukreuzen. Und die erste, bei der Raten
nichts bringt: bei vier Möglichkeiten trifft man mit einem Viertel
Wahrscheinlichkeit, bei sieben Leitungen mit einem Hundertachtundzwanzigstel.

### Der Strom durch eine einzelne Leitung ist gar nicht bestimmt

Der erste Bau las ab, was der Schaltplan-Block auch zum Malen benutzt:
`netzStrom` über `leitungNetz` (E187). Nachgemessen kam bei ELF von zwölf
Schaltungen „alles oder nichts" heraus — übrig blieb eine einzige Schaltung,
und die stand dann in jeder Aufgabe.

Der Grund steht in `simulation.ts`: `netzStrom[netz]` ist der GRÖSSTE Strom
irgendeines Bauteils, das dieses Netz berührt. Ein toter Abzweig, der mit
einem Ende an einem stromführenden Knoten hängt, liest denselben Wert.

Und tiefer: der Strom durch eine einzelne ideale Leitung ist physikalisch
nicht bestimmt. Zwei ideale Leitungen zwischen denselben zwei Knoten teilen
sich den Strom in einem Verhältnis, das aus den Knotenspannungen nicht folgt.
Das ist keine Lücke der Rechnung, sondern eine Eigenschaft der Aufgabe.

Bestimmt ist dagegen: **liegt die Leitung auf dem Weg?** Schneide sie durch
und sieh nach, ob sich etwas ändert. Genau das meint ein Elektriker mit
Stromweg, und genau das rechnet die Aufgabe — ein Durchgang je Leitung.

Dabei fiel ein zweiter Fehler auf, und er ist der lehrreichere. Der Vergleich
lief über alle Bauteilströme auf vier Stellen — und verglich damit
RECHENRAUSCHEN. Die Matrix bekommt zwischen jedem Knoten und Masse einen
winzigen Leitwert, sonst wäre sie bei einem offenen Kontakt nicht lösbar;
heraus kommen Ströme wie 4,184e-10 A. Beim Treppenhausautomaten galten so
vier Leitungen als „beteiligt", obwohl die Leuchte in jeder Stellung dunkel
blieb. Jetzt gilt dieselbe Schwelle wie in `simulation.ts`: unter einem
Nanoampere ist nichts.

### Ein Tippziel für den Finger — und was daran nicht geht

§37 verlangt 44 px. Der erste Versuch verbreiterte die Leitung selbst mit
einem durchsichtigen Fangstrich. Das kann nicht funktionieren: zwei
Leitungsbahnen liegen 16 Einheiten auseinander, am Bildschirm gemessene 7 px.
Ein 44-px-Strich hätte sechs Nachbarn mitgefangen — man tippt auf eine
Leitung und markiert eine andere, und das sieht nicht nach einem Fehler aus.

Getippt wird deshalb auf einen RING je Leitung. Die Ringe stehen weit
auseinander, sie sind sichtbar (man weiss also, wohin), und sie werden nach
der gemessenen Verkleinerung nachgestellt — CSS kennt den viewBox-Faktor
nicht, und der Zeichner kennt beim Erzeugen die spätere Grösse nicht.

Drei Dinge daran hat erst ein Bildschirmfoto gezeigt (§55):

  · Die Ringe waren zuerst gefüllte Scheiben und deckten die Zeichnung zu —
    die man doch gerade lesen soll. Jetzt scheint sie durch.
  · Zwei Ringe standen halb ausserhalb des Blattes. Das Blatt war beim Bauen
    auf seinen Inhalt geschrumpft und wusste nichts von ihnen.
  · Bei 560 px Spaltenbreite ist ein 44-px-Ring 96 Planeinheiten breit,
    grösser als ein Bauteil. Die Spalte ist für diese Aufgabenart jetzt
    1100 px breit, und am Telefon wird der Plan nicht kleiner, sondern
    SCHIEBBAR — wie in jedem PDF-Betrachter.

### Zwei Fehler, die es schon vorher gab

**Jeder Klick in die Aufgabe würfelte sie neu.** Die Aufgabe trägt
`data-art` als ANGABE (`<article class="ea-aufgabe" data-art="plan-fehler">`),
die Knöpfe der Artenleiste tragen es als BEFEHL. Der eine Zuhörer suchte
`closest('[data-art]')` und sah beide gleich: ein Klick irgendwo in die
Aufgabe würfelte sie neu UND stellte den geübten Bereich still auf ihre Art
um. Vorher gab es in einer Aufgabe nichts zum Anklicken, deshalb ist es
niemandem aufgefallen.

**Der Prüfen-Knopf sah aus wie Text.** Die Knopfgestaltung stand nur unter
`.ea-fuss button`. Der Prüfen-Knopf einer Zahlenaufgabe steht in
`.ea-eingabe`, und dort griff keine Regel — kein Rand, kein Grund, und
`class="prim"` blieb wirkungslos. Seit E189 so, und keine Prüfung konnte es
melden: der Knopf WAR ja da.

### Eine Schaltung mehr, und eine Prüfung, die weniger fordert

`SCHALTUNGEN` bekommt „Zwei Leuchten, je ein eigener Schalter". Fast alle
bisherigen sind eine einzige Reihe, und in einer Reihe liegt entweder jede
Leitung auf dem Weg oder keine — mit zwei Zweigen gibt es endlich den Fall,
an dem sich zeigt, ob jemand einen Plan liest.

Und `test241` verlangte von jeder Wahlaufgabe genau vier Möglichkeiten.
„Steuerstromkreis oder Hauptstromkreis?" hat zwei, und eine dritte
dazuzuerfinden wäre gelogen. Verlangt ist jetzt: mindestens zwei, höchstens
sechs — und dass eine Art bei ihrer Zahl BLEIBT. Wer heute vier und morgen
drei anbietet, hat einen Fehler; das ist der Satz, der vorher fehlte.

### Und die Stellung steht jetzt am Schalter (L59)

Geplant war, jedem der achtundzwanzig Schaltersymbole einen zweiten Pfad für
die geschlossene Lage zu geben. Beim Nachdenken darüber fiel auf, dass genau
das falsch gewesen wäre: **ein Kontakt wird im Schaltplan in seiner RUHELAGE
gezeichnet.** Ein Schliesser ist offen, auch während er geschlossen ist. Wer
ihn geschlossen zeichnet, zeichnet keinen Schaltplan mehr.

Die Lücke war also nicht „das Symbol ist falsch", sondern „die Stellung steht
nur im Fragetext". Sie steht jetzt zusätzlich neben dem Bauteil — über
`plan.texte`, dieselbe Beschriftung, die es für Punkt 47 ohnehin gibt.

Und prompt ein neuer Fehler: „geschlossen" landete bei manchen Startwerten
AUF einem Tippgriff und schluckte den Klick. Man tippt, und es passiert
nichts — schlimmer als ein zu kleines Ziel, weil man nicht sieht, warum.

### Prüflauf

`test243` wächst auf 71 Punkte. §6 schneidet jede Leitung selbst durch und
vergleicht mit einem ANDEREN Massstab als die Aufgabe: nicht Zahlenreihen,
sondern welche Bauteile arbeiten und wie hell die Leuchten sind. Dass beide
Massstäbe übereinstimmen, ist mehr wert als zweimal dasselbe.

Der verdeckte Griff hat dabei noch etwas gezeigt. Die erste Prüfung sah nur
die Aufgabe, die gerade dastand — und blieb grün, obwohl der Fehler wieder
eingebaut war: wo eine Beschriftung landet, hängt am Startwert. Sie geht
jetzt zwölf Aufgaben durch. §55.2 in einem Satz: wer eine neue Prüfung
schreibt, baut den Fehler absichtlich wieder ein und sieht nach, ob sie rot
wird.

---

## E194 · Redions eigenes Formelbuch, mit den Seitenzahlen des gedruckten

**Stand: 26. August 2026** · `register/elektroformeln.ts`,
`bereiche/elektro/formelheft.ts`, `bereiche/elektro/skizzen.ts`, `test244`

### Die Frage

Redur lernt mit einem gedruckten Formelbuch und wollte es in Redion haben —
zuerst als „Hast du von dem PDF alles gemacht?", dann deutlicher: alle
Seiten, dieselbe Struktur, er will die Seiten wechseln können und im
Programm dasselbe finden wie im Heft auf dem Tisch.

Der naheliegende Weg wäre gewesen, das PDF anzuzeigen. Ein Anfang dazu war
schon gebaut — Zoom, Blättern, Vollbild für die eingescannten Seiten — und
wurde auf halber Strecke verworfen, von Redur selbst: **nicht das PDF
zeigen, sondern die Formeln neu schreiben.** Eigene Gestaltung, eigene
Skizzen, aber dieselben Seitenzahlen.

### Die Entscheidung

Redion führt das Formelbuch als eigene Struktur im Register:

**Abschnitte statt Seiten als kleinste Einheit.** Ein `Abschnitt` ist eine
Überschrift im Heft — „Reihenschaltung", „Messbereicherweiterung von
V-Metern" — und trägt Seitenzahl, Buchkapitel, Grössenliste und seine
Formelzeilen in Buchreihenfolge. Die Seitenzahl steht NUR am Abschnitt.
Formeln hängen am Abschnitt; wo eine Seite im Buch wandert, ändert sich
eine Zeile.

**Zwei Sorten Zeilen.** Eine Zeile mit `id` zeigt auf einen RECHENBAREN
Eintrag — antippen öffnet den Rechner mit Rechenweg. Eine Zeile ohne `id`
steht als Text da: `1 kWh = 3600 kWs` ist wahr, aber keine Gleichung, nach
deren Grössen man auflöst. So ist jede Heftseite VOLLSTÄNDIG, ohne dass
für jede Umstellung ein eigener Rechenweg erfunden werden muss — die
Umstellungen einer Gleichung zeigen ohnehin auf denselben Rechner, und der
lässt jede Grösse als gesuchte wählen.

**Wertetabellen als Tabellen.** Konstanten, Werkstoffwerte, Zehnerpotenzen
(Seiten 32–34) sind keine Formeln und werden nicht als solche verkleidet.

**Die Seite sieht aus wie eine Heftseite.** Überschrift, links die Skizze,
in der Mitte die Grössenliste, rechts die Formeln. Diese Anordnung ist die
jedes Formelbuchs dieses Fachs und trägt das Mitlesen: die dritte Formel
von oben ist hier die dritte Zeile.

### Was DAVON bewusst nicht übernommen wird

Das gedruckte Buch ist ein gekauftes Werk. Seine Formeln, Grössennamen,
Einheiten und Materialwerte sind freie Fakten — `U = R · I` gehört
niemandem, seit Ohm es 1826 aufgeschrieben hat. Sein SATZ, seine
ZEICHNUNGEN und seine SÄTZE sind es nicht. Deshalb:

· Die Skizzen sind selbst gezeichnet — die Schaltbilder aus Redions
  eigenen Fachzeichen über `Schaltplan.alsSvg`, die Diagramme als eigenes
  SVG. Kein Bild ist aus dem PDF kopiert.
· Die Erklärsätze sind selbst geschrieben, in Redions Ton.
· Die Gestaltung ist Redions eigene: Farben, Schrift, hell und dunkel.
· Das PDF selbst kommt nicht ins Verzeichnis (wie E188/E191).

Übernommen werden die Fakten und die GLIEDERUNG — Kapitelfolge und
Seitenzahlen —, denn genau sie machen das Nebeneinander von Heft und
Programm benutzbar, und die Kapitelfolge ist die übliche dieses Fachs.

### Warum eigene Seiten besser sind als ein Scan

· **Rechenbar.** Jede Formel lässt sich antippen und mit Werten füllen.
  Ein Scan ist ein Bild.
· **Durchsuchbar.** „resonanz" findet die Formel und nennt ihre Seite;
  ein Tipp blättert hin und klappt den Rechner auf.
· **Scharf und thematisch.** Vektoren statt Fotos, hell und dunkel ohne
  zweiten Bildersatz, am Telefon anders angeordnet statt kleiner.

### Vier Fehler, die nur das Hinsehen fand (§55)

· Fünf Skizzen liefen aus ihrem Blatt — ein Bauteil an der Kante wird halb
  abgeschnitten, und „da" waren sie alle.
· Die Motorzuleitungen liefen von einem Anschluss zu DEMSELBEN Anschluss
  zurück und sahen wie Diagonalen durch den Motor aus.
· Flexbox frass die Leerzeichen: `Q_L = I_L · t_L` stand am Telefon als
  `Q_L= I_L· t_L` da. Der TEXT war die ganze Zeit richtig — nur das Bild
  nicht. §55.2, zum dritten Mal.
· Die Blätterknöpfe standen unter dem Bildschirmrand: ein Flex-Kind ohne
  `min-height:0` schrumpft nicht unter seinen Inhalt.

### Prüflauf

`test244`, 63 Punkte. Er misst die Skizzen wirklich (getBBox gegen die
viewBox), stellt den Flexbox-Fehler absichtlich her und sieht nach, dass
die Messung rot wird, und prüft die Seitenzahlen gegen das
Inhaltsverzeichnis des Hefts. Seine erste Fassung mass die viewBox mit
einem doppelt geschützten Regex und las überall 0×0 — eine Prüfung, die
nie rot werden kann, ist keine (§55.2), und diesmal traf es die Prüfung
selbst.


## E195 · Das ganze Heft, und warum der Abschnitt seine Zeilen selbst trägt

**26. August 2026**

E194 baute Redions eigenes Formelbuch: eigene Gestaltung, eigene Skizzen,
die Seitenzahlen des gedruckten Hefts. Es standen 24 Seiten darin, und die
Gliederung war meine.

Redur hat das abgelehnt, und zu Recht: „du musst die Formeln neu schreiben
mit neuem Design, aber die Seitennummer sollte gleich sein" — und dann,
deutlicher: „1:1 wie im PDF, alle Seiten, wie die Struktur und alles
gleich."

Jetzt ist es das Heft. Seite 2 bis 34, 172 Abschnitte unter ihren eigenen
Überschriften, 923 Zeilen in der gedruckten Reihenfolge.

### Wie die Seiten hereingekommen sind

Dreiunddreissig Seiten von Hand abzuschreiben wäre drei Tage Arbeit und
hätte drei Tage Tippfehler gegeben. Stattdessen hat je ein Leser eine
Seite gelesen und als Daten zurückgegeben, und je ein zweiter hat dieselbe
Seite noch einmal angesehen und die Abschrift dagegengehalten. Sechsund-
sechzig Durchgänge, zwei Beanstandungen — beide berechtigt, beide klein.

Der Wert liegt im ZWEITEN Blick. Wer abschreibt, liest, was er erwartet;
wer prüft, liest, was dasteht.

### Der eigentliche Bau: die Zeile gehört dem Abschnitt

In E194 sagte die Formel, in welchem Abschnitt sie steht — ein Feld
`abschnitt` am Formeleintrag. Das ging nicht auf, und der Grund ist im
Heft nachzulesen:

    Seite 2   „Grundformeln Quickie"   P = U · I
    Seite 8   „Gleichstromleistung"    P = U · I

Dieselbe Formel, zwei Seiten. Ein einzelnes Feld kann das nicht sagen. Es
hätte eine der beiden Stellen verschwiegen, und zwar stillschweigend.

Also umgedreht: der ABSCHNITT führt seine Zeilen, jede mit dem Text, wie
er im Heft steht, und mit einem Verweis auf den rechenbaren Eintrag, wenn
es einen gibt. Das Feld an der Formel ist ersatzlos weg. `seitenVon()`
nennt jetzt alle Seiten, auf denen eine Formel vorkommt.

Damit ist auch das gelöst, was vorher nicht ging: das Heft schreibt jede
Umstellung als eigene Zeile aus — `R = U / I` neben `U = R · I` —, und
Redion braucht dafür keine zweite Formel, sondern nur eine zweite Zeile,
die auf dieselbe zeigt. 422 der 923 Zeilen sind so rechenbar.

### Was beim Zusammenführen wirklich schwierig war

Nicht das Abschreiben. Das WIEDERERKENNEN. Der Zuordner musste sehen, dass
diese Paare dasselbe meinen:

    R_Ltg = ρ · 2 · l / A     und   R_Ltg = (ρ · 2 · l) / A
    R = R₁ + R₂ + … + Rₙ      und   R = R₁ + R₂ + R₃
    B = μ₀ · μ_r · H          und   B = µ₀ · µᵣ · H
    n_s = f · 60 / p          und   nₛ = (f · 60 s/min) / p
    η = P₂ / (P₂ + P_Cu + P_Fe)  und  η = P₂/P₁ = P₂/(P₂+P_Cu+P_Fe)

Fünf verschiedene Ursachen, und jede einzeln:

**Klammern.** Eine Klammer um ein reines Produkt darf weg. Steht ein `/`
davor, darf sie NICHT weg — `a/(b·c)` und `a/b·c` sind verschiedene
Zahlen. Genau solche stillen Verwechslungen sind das Einzige, was hier
wirklich schaden kann.

**Auslassungspunkte.** Ein Lauf gleichartiger Summanden wird
zusammengefasst. Der erste Versuch scheiterte an zwei Stellen zugleich:
die linke Seite lief als erster Summand mit (`R=R₁` gegen `R₂`), und NFKC
zerlegt „…" in drei Punkte, sodass die Prüfung auf das eine Zeichen ins
Leere ging.

**µ ist nicht μ.** Das Mikro-Zeichen (U+00B5) und das griechische My
(U+03BC) sehen gleich aus und sind verschiedene Zeichen. Das Heft setzt
das eine, das Register das andere. Ohne NFKC stünde die Flussdichte
zweimal im Buch — einmal rechenbar, einmal nicht, und niemand hätte
gesehen, warum.

**Einheiten in der Formel.** `60 s/min` erklärt, WOHER die 60 kommt. Für
die Zuordnung ist es Beiwerk; die angezeigte Zeile bleibt trotzdem die des
Hefts.

**Kettengleichungen.** `η = P₂/P₁ = P₂/(P₂+P_Cu+P_Fe)` sind zwei Aussagen.
Von vorn gelesen findet man immer nur die erste — den allgemeinen
Wirkungsgrad, den es schon dreimal gibt. Von hinten findet man die
besondere.

Am Ende haben alle 182 rechenbaren Formeln ihre Stelle im Heft.

### Drei Stellen, an denen das Heft genauer war als das Register

· Der Plattenabstand heisst `l`, nicht `d`. Ein anderer Buchstabe für
  dieselbe Grösse ist eine Stolperstelle, die man erst bemerkt, wenn man
  sich schon vertan hat.
· Die Beleuchtungsstärke rechnet mit dem NUTZlichtstrom Φ_N. Wer mit dem
  blossen Lampenlichtstrom rechnet, plant den Raum zu hell und merkt es
  auf der Baustelle.
· `R₉` war eine tiefgestellte NEUN, die dem ϑ nur ähnlich sieht.

### Die Bilder

Sechzehn Abschnitte im Heft haben keine Formel — sie erklären mit Bildern.
Die Messgerätekategorien, die Hysteresekurve, das Feldbild der Spule, die
Kraft auf den stromdurchflossenen Leiter, und die zwölf Bauelemente auf
Seite 23. Sie gehören zur Struktur und dürfen nicht wegfallen; eine
Überschrift ohne alles wäre in Redion ein Fehler, den man für Absicht
hält.

Also gezeichnet. Für Seite 23 kam das Bauteilzeichen aus dem
Fachzeichen-Register und die Kennlinie daneben als eigenes SVG. Sechs
Zeichen fehlten dort noch — PTC, NTC, VDR, LDR, Optokoppler, Triac —, und
die gehören ins Register und nicht in eine Skizze: damit stehen sie auch
im Schaltplan-Editor zur Verfügung (§8 Regel 3).

Die Kennlinie ist der eigentliche Inhalt dieser Seite. Das Zeichen sagt,
wie das Bauteil heisst; die Kennlinie sagt, was es tut — und bei PTC und
NTC ist das der einzige Unterschied. Die Z-Diode zeigt den Durchbruch bei
U_Z, also genau das, wofür es sie gibt.

### Zwei Fehler, die nur das Hinsehen fand (§55)

· Das Bauteilzeichen wurde auf Spaltenbreite aufgeblasen. Die Regel
  `.bs-skizze svg` erwischte auch das Symbol INNERHALB einer
  zusammengesetzten Skizze, und ein 40 × 60 grosser PTC füllte die halbe
  Seite. Ein direktes Kind zu meinen und alle Nachfahren zu treffen ist
  ein Fehler, den keine Messung sieht.
· Jedes Bauteil stand allein in einer Zeile, zwei Drittel der Seite
  blieben weiss. Reine Bildabschnitte stehen jetzt zu zweit nebeneinander
  — am Telefon wieder untereinander, weil zwei Bauteile auf 390 px zwei zu
  schmale Bauteile sind.

### Prüflauf

`test244`, 64 Punkte, dazu die Nachbarn: test238 (77), test239 (68),
test240 (100), test241 (105), test242 (42), test243 (71). 527 Punkte.

Eine Prüfung ist dabei bewusst weicher geworden: „kein Abschnitt ohne
Formel" hätte die sechzehn Bildabschnitte rot gemacht, obwohl sie richtig
sind. Sie heisst jetzt „kein Abschnitt ohne ALLES" — ohne Formel, ohne
Tabelle und ohne Skizze. Eine Prüfung, die Richtiges rot macht, wird
irgendwann abgeschaltet, und dann fängt sie auch das Falsche nicht mehr.

## E196 · Drei Dinge, die nur das Hinsehen fand

**26. August 2026**

Redur wollte Seite 13 und die Telefonansicht sehen. Das Bild zeigte drei
Fehler, und keiner davon war rot.

**Erstens: zwei Kurven, die sich nicht unterschieden.**

Die Abbildung „Ummagnetisierungskennlinien" zeigt hartmagnetisch NEBEN
weichmagnetisch. Der Unterschied zwischen beiden IST die Aussage — die
eingeschlossene Fläche ist die Verlustarbeit je Ummagnetisierung, und
deshalb nimmt man im Trafokern die schmale. Gezeichnet war zweimal
dieselbe Linse mit leicht verschobenen Kontrollpunkten.

Jetzt bestimmt die Koerzitivfeldstärke die Form: 24 für den Dauermagneten,
5 für den Kern. Beide sehen aus wie eine Hystereseschleife, und man sieht
auf einen Blick, welche welche ist.

Eine Prüfung hätte das nie gefunden. Sie hätte gezählt: zwei Pfade da,
beide im Rahmen, beide nicht leer — grün. Zwei Bilder, die dasselbe zeigen,
obwohl sie Verschiedenes zeigen sollen, sind kein messbarer Zustand.

**Zweitens: eine Beschriftung ohne Gegenstand.**

Im Bild „Magnetfelder bei Spulen" stand ein `I` unter der Spule, aber es
gab dort keine Leitung. Und benannt war nur der Nordpol, obwohl der ganze
Sinn des Bildes ist, dass die Linien am einen Ende hinaus- und am anderen
wieder hineingehen. Beides ist jetzt da: Zuleitungen mit Stromrichtung,
S und N an ihren Enden. Nebenbei fiel auf, dass der gerade Teil der
Feldlinie zweimal übereinander gezeichnet wurde, weil beide Linien ihn im
selben `d` mitführten.

**Drittens: die Fussknöpfe am Telefon waren leere Kästchen.**

Und das ist der interessante Fall. Die Messung sagte gleichzeitig: 44 × 44,
sichtbar, mit Text, innerhalb des Fensters. Alles stimmte. Über ihnen lag
`#toast`.

Der Toast versteckt sich mit `transform: translateY(80px)`. Am Rechner
steht er bei `bottom:22px` — 80 px nach unten genügen, er ist aus dem Bild.
Am Telefon steht er bei `bottom:104px`, weil dort die Aktionsleiste liegt.
104 − 80 = 24, also blieb ein dunkler Streifen dauerhaft im Bild stehen,
mit dem Text der letzten Meldung darin, quer über den Fussknöpfen.

Eine Schiebestrecke muss die Höhe des Kastens erraten, und die hängt am
Text. `opacity` muss nichts raten. Ausdrücklich NICHT `visibility:hidden`:
`#toast` ist ein `aria-live`-Bereich, und ein unsichtbarer Bereich wird
nicht vorgelesen — ein durchsichtiger schon.

**Und die Prüfung dazu, die rot werden kann.**

Der naheliegende Weg wäre `elementFromPoint` in der Mitte jedes Knopfes.
Der hätte hier für immer grün gezeigt: `#toast` hat `pointer-events:none`,
und die Treffersuche überspringt ihn. Genau der Fall aus CLAUDE.md §55.2 —
eine Prüfung, die nicht rot werden kann, ist keine.

Gemessen wird deshalb, was GEMALT wird: jedes Element ausserhalb des
Heftfensters, das eigene Schichtung hat, eine höhere z-Zahl trägt als das
Fenster, sichtbar ist und den Fuss überlappt. Vor der Berichtigung meldete
sie `DIV#toast z900 798–820`, danach nichts. test244 hat damit 65 Prüfungen.

## E197 · Der Durchgang durch alle 33 Seiten

**26. August 2026**

E196 fand drei Fehler auf einer einzigen Seite, und keiner davon war rot.
Das ist keine Eigenschaft von Seite 13 — es ist eine Eigenschaft der Art,
wie man ein Buch prüft. Also einmal durch alle 33 Seiten, jede angesehen
und jede vermessen.

**Der sichtbare Unterstrich — 42 Stellen.**

`tief` verwandelt `X_L` in X mit tiefgestelltem L. Die Zeichenliste dafür
war `[A-Za-zÄÖÜäöüß0-9]`: die deutsche Tastatur, nicht die Physik. Im Heft
stehen `R_ϑ` (Widerstand bei der Temperatur ϑ), `S_Δ` (Scheinleistung im
Dreieck) und `AF_%` (relativer Anzeigefehler). Bei allen dreien blieb der
Unterstrich als Unterstrich stehen.

Das ist kein Schönheitsfehler. `R_ϑ` liest sich als „R Unterstrich Theta",
und eine solche Grösse gibt es nicht.

Die Liste heisst jetzt `[\p{L}\p{N}%]` — jeder Buchstabe jeder Schrift, jede
Ziffer, und Prozent ausdrücklich, weil es keins von beidem ist. Weil `esc`
vorher läuft, kann durch die Erweiterung kein Zeichen hereinkommen, das
vorher draussen war.

Dieselbe Zeile stand an DREI Orten — Schaltplan, Skizzen, Buch. Genau so
entsteht ein solcher Fehler und genau so überlebt er. test244 vergleicht
die drei jetzt miteinander.

Und drei Stellen liefen gar nicht durch `tief`: die Überschrift des
Abschnitts, sein Hinweis und die Beschreibung einer Grösse. „Reihen-
schaltung von R, X_L und X_C" stand mit zwei Unterstrichen in der
auffälligsten Zeile der Seite; „Spannung an R_V" in der Erklärung einer
Grösse, die sich damit selbst falsch schreibt.

**Der Wächter, der die Annahme des Geprüften teilte.**

Es gab längst eine Prüfung „Kein Unterstrich bleibt stehen". Sie suchte
`/_[A-Za-z0-9]/` — DIESELBE zu kurze Liste. Sie konnte also genau das nicht
finden, was schiefging, und sie sah nur auf Seite 11 nach, während `AF_%`
auf 6 und 7 steht und `R_ϑ` auf 4.

Jetzt gilt: in einer Formel hat ein Unterstrich NIE etwas zu suchen, also
keiner, auf keiner der 35 Seiten, in Formel, Zeile, Legende, Überschrift,
Hinweis, Tabelle und Skizzenbeschriftung. Ein Wächter, der die Annahme des
Geprüften teilt, prüft nichts (CLAUDE.md §55.2).

**Die Messung, die eine Lage mass, die es nicht gibt.**

Die Prüfung „Keine Skizze läuft aus ihrem Blatt" rendert jede Skizze in
einen Hilfskasten und vergleicht `getBBox` mit dem `viewBox`. Der Kasten war
ein blankes `<div style="width:600px">`.

Die Plan-Beschriftungen haben zwar `font-size="13"`, aber keine
Schriftfamilie — die erben sie vom Umgebenden. Im blanken Kasten kam eine
andere Schrift heraus als unter `.bs-skizze`, und mit ihr andere
Buchstabenmasse: `s-teiler` mass dort 1 Punkt Überstand und auf der Seite 3,
`b-reihe` 2 gegen 6. Bei zwei Punkten Nachsicht hiess das: grün, während im
Bild ein `U` oben abgeschnitten stand.

Der Kasten trägt jetzt dieselbe Klasse wie im Buch. Danach war die Prüfung
sofort rot — und `s-teiler`, `b-reihe`, `b-innen` und `sp-mehrlagig` liessen
sich berichtigen.

**Vier Bilder, die etwas Falsches zeigten.**

  · `s20-gleichstromleitung` war neu zu zeichnen. `ΔU` stand unter dem Bild
    und zeigte auf nichts; die Länge `l` lag als gestrichelte Linie im
    Inneren und war kürzer als die Leitung, die sie messen soll; und `I` und
    `l` standen beide frei in derselben kursiven Schrift, in der sie
    derselbe Strich sind. Jetzt sagt die Form, was gemeint ist: ein Pfeil in
    Flussrichtung ist ein Strom, ein Doppelpfeil zwischen zwei Grenzen ist
    ein Mass. Die Grössen kommen aus dem Register des Abschnitts — U₁ am
    Netz, U₂ am Verbraucher, ΔU dazwischen —, und weil `R_Ltg` mit `2 · l`
    rechnet, zeigt der Rückleiter seinen Strom mit.
  · `mo-dreh` trug ein drittes `M` frei neben dem Motor. Das Zeichen hat
    sein `M` und sein `3 ~` im Kreis, das Betriebsmittelkennzeichen `M1`
    schreibt der Planzeichner daneben.
  · `sp-einlagig` und `sp-mehrlagig`: `d` schwebte ohne Bezug über dem Bild,
    `d₁` hatte kein Mass, und `d₁` und `d_m` lagen als zwei Beschriftungen
    übereinander auf der Strichlinie und sahen durchgestrichen aus. Jetzt
    hat `d` eine Linie zu seinem Draht, `d₁` einen eigenen Doppelpfeil über
    den Kern, und beide Beschriftungen stehen frei.

**Was der Durchgang NICHT fand.**

Die Seiten 35 und 36 sind leer, und das ist richtig so: das gedruckte Heft
hat 36 Seiten, geschrieben sind 33 davon. Redion sagt das auf der Seite —
„Diese Seite gibt es im gedruckten Heft, in Redion noch nicht" — und zählt
auf, welche es gibt. Eine bekannte Lücke ist besser als ein stiller Fehler
(§35).

Sechzehn Abschnitte haben weder Formel noch Tabelle noch Legende. Alle
sechzehn sind Bildabschnitte, und alle sechzehn haben ihr Bild.

## E200 · Zeichen statt Emoji — die Oberfläche gehört Redion

**26. August 2026**

Der Gestaltungs-Auftrag sagt in §71: „Professionelle Hauptoberfläche nicht
mit Emojis bauen. Emoji nur wenn Nutzerdaten selbst Emoji-Icons enthalten."

Gezählt standen 1794 Emoji in 82 Dateien. Die auffälligsten neunzehn davon
trug die Seitenleiste: 🔍 ⌘ ☀️ 🎓 🧱 📚 ☑ 📥 ✚ ⭱ 🗑 ✨ ✎ 📅 ⚡ 🧩 🕸 🏷 🎴.

**Warum das mehr ist als Geschmack.**

  · Emoji sind BILDER, keine Zeichen. Sie tragen ihre eigene Farbe, ihre
    eigene Strichstärke, ihre eigene Anmutung. Neben einer Schrift in
    `--text-dim` sieht ein farbiges 🎓 aus wie ein Aufkleber.
  · Sie sehen auf jedem System anders aus. Dasselbe ☑ ist auf Windows
    schmal und grau, auf einem Apfelgerät blau und rund. Eine Oberfläche,
    die auf zwei Rechnern verschieden aussieht, ist keine.
  · Sie lassen sich nicht ausrichten. Ein 🔍 sitzt tiefer als ein ⌘, und
    kein Abstand der Welt bringt beide auf eine Linie.

**Was jetzt gilt.**

`register/symbole.ts` — 45 Zeichen als Striche in `currentColor`, 24 × 24,
Strichstärke 1,7, runde Enden. Sie nehmen die Farbe ihrer Zeile an, sie
haben überall dieselbe Stärke, sie sitzen auf demselben Raster.

`index.html` schreibt nur die Stelle — `<span data-sym="search">` —, und
`Register.symbole.fuelle(wurzel)` setzt das Zeichen ein. Ein unbekannter
Name lässt die Stelle LEER: ein Fragezeichen oder ein Kästchen sähe aus wie
ein Zeichen und wäre keins. Der Prüflauf sucht nach leeren Stellen; das
Auge übersieht sie.

**Die Grenze, und warum sie namentlich gezogen ist.**

Geprüft wird nur die SCHALE — Seitenleiste, Kopfleiste, Reiter —, und zwar
Ort für Ort. Ein pauschales „nirgends ein Emoji" wäre schneller geschrieben
und falsch: es würde jede Seite rot machen, die jemand mit 🧳 benannt hat.
Das Zeichen einer Seite gehört dem Menschen, der sie angelegt hat.

**Drei Stellen, die dabei auffielen.**

  · `kopfleiste.ts` schrieb `stern.textContent = '★'`, `kb.textContent =
    '💬 ' + n` und `schloss.textContent = '🔒'`. `textContent` ersetzt den
    GANZEN Inhalt eines Elements — also auch das SVG, das kurz zuvor
    eingesetzt worden war. Beim Start sahen die Knöpfe richtig aus, und
    sobald eine Seite geöffnet wurde, stand wieder ein gelbes Schloss
    mitten in einer Reihe grauer Striche.
  · `zeichneBaum` leert die Seitenleiste und baut sie neu. Der Ruf beim
    Start füllt nur, was zu diesem Zeitpunkt dasteht — die Werkzeuge-Gruppe
    kommt danach. Sie füllt sich jetzt selbst.
  · Der Kommentarzähler stand als Text IM Knopf („💬 3"). Jetzt steht er
    neben dem Zeichen, mit Tabellenziffern: sonst wackelt die Kopfleiste,
    wenn aus 1 eine 8 wird.

**Was bewusst Emoji bleibt.**

Vorlagen, Seitenzeichen, Blockmenüs, die Meldung „🎴 3 Karteikarten sind
fällig". Das erste sind Nutzerdaten. Das letzte ist eine Meldung an einen
Menschen, kein Bedienelement — und es steht in LUECKEN, nicht hier, weil
ich es für einen Grenzfall halte und nicht für entschieden.

**Der Wächter.** test245 §4, mit zwei Gegenbeweisen: ein Emoji zurück in
die Seitenleiste macht ihn rot, ein unbekannter Zeichenname ebenso. Und
davor steht eine Gegenprobe auf die Messung selbst — fände der Ausdruck
keine Knöpfe, wäre er ewig grün.

## E201 · Ein Knopf-System, und die Suche in die Mitte

**26. August 2026**

§14 und §79 des Auftrags verlangen EIN Bedienelement-System. Redion hatte
schon Klassen — `.top-btn`, `.side-item`, `.sr`, `.ws-btn`, `.icon-btn` —,
jede mit eigener Höhe, eigenem Radius, eigener Übergangszeit.

Ein zweites System danebenzustellen hätte die Zahl der Systeme erhöht und
nichts gelöst. Also andersherum: die BESTEHENDEN Klassen bekommen
gemeinsames Verhalten, und wer eine neue Fläche baut, schreibt `.rb` dazu
und erbt dasselbe.

**Der Druckpunkt** ist 0,976 — nicht 0,95 und nicht 0,99. Bei 0,99 sieht man
nichts, bei 0,95 springt der Knopf. Der Wert lässt einen 34 Punkte hohen
Knopf um genau einen Punkt schrumpfen: sichtbar, aber nicht als Bewegung,
sondern als Widerstand. Und er hängt an `:active`, nicht an `:hover` — am
Telefon gibt es kein Überfahren, und dort ist das die einzige Rückmeldung,
dass der Finger angekommen ist.

**Die Suche steht jetzt in der Kopfleiste.** Sie war eine Zeile in der
Seitenleiste. Das Wichtigste einer Wissens-App gehört dorthin, wo das Auge
zuerst hinsieht — und es muss dort auch AUSSEHEN wie ein Feld.

Es ist bewusst ein Knopf und kein `<input>`: getippt wird in der
Suchüberlagerung, die Strg+P ohnehin öffnet. Ein Feld, das beim ersten
Zeichen durch ein anderes Feld ersetzt wird, verliert den Anschlag.

**Und dabei die lehrreichste Stelle dieses Passes.**

Der Sucher klebte zuerst am Seitentitel. Ich schrieb die Berichtigung, den
Kommentar dazu („zwei gleiche Federn") und einen Prüfpunkt „steht ungefähr
in der Mitte, 90 Punkte Nachsicht". Alles grün.

Dann der Gegenbeweis: die Berichtigung wieder herausgenommen — und der
Prüfpunkt blieb GRÜN. Er liess genau den Fehler durch, den er verhindern
sollte.

Nachgemessen mit einem kurzen und einem 47 Zeichen langen Titel:

    ohne Feder an der Krume   1366 px: Sucher bei 559 und bei 751
                                        → 192 Punkte Unterschied
                              1920 px: bis zu 339 Punkte aus der Mitte
    mit Feder                 beides:  44 Punkte aus der Mitte, immer
                                        dieselben 44

Der Fehler ist also nicht „steht nicht mittig", sondern „WANDERT mit dem
Titel". Gemessen wird jetzt die Bewegung, und der Unterschied ist nicht
knapp, sondern 192 gegen 0.

Zwei Dinge waren dabei zusätzlich falsch, und beide standen in meinem
eigenen Kommentar: die Änderung am `.spacer` hat nichts bewirkt (er ist
leer, seine Basis ist ohnehin null), und die 44 Punkte sind kein Rest,
sondern richtig — rechts stehen acht Knöpfe, links zwei; genau mittig zum
Fenster stünde der Sucher näher an den achten als an den zweien.

**Die Seitenleiste ist 240 statt 260** (§5: 220–250). Auf 1366 × 768 sind
zwanzig Punkte keine Kosmetik (§68). Das brach zwei Dinge, die vorher
gerade so passten und die eine Messung sofort zeigte: „Heute" stand als
„He…" in der aktiven Pille, und „Neuer Chat" brach in drei Zeilen um und
machte den Knopf 60 statt 39 Punkte hoch. Beides berichtigt — die vier
stummen Reiter geben 24 Punkte ab, der aktive nimmt sie.

**Die Kopfleiste ist 54 statt 45** (§8: 52–58). Nicht weil höher besser
wäre, sondern weil ein 36 Punkte hohes Suchfeld bei 45 Punkten oben und
unten je viereinhalb übrig lässt und eingeklemmt aussieht.

**Was aus Amdion kam.** Redur wies auf `Redurbabat/Amdion` als „Kopie von
Redion" hin. Gezählt: Amdion 49 Dateien, 1 508 Zeilen TypeScript, 328
Zeilen CSS, 3 Prüfungen — Redion 633 Dateien, 96 883 Zeilen, 9 149 Zeilen
CSS, 210 Prüfungen. Gemeinsame Dateinamen sind `README.md`, `index.html`,
`package.json`. Es ist keine Kopie, sondern ein eigener, viel kleinerer
Neubau; seine eigene Doku nennt als nächste Schritte, PDF/Ink, Datenbanken,
Formelmaschine und SM-2 AUS REDION zu übernehmen.

Brauchbar waren daraus Muster, kein Code: die dreispaltige Schale als
Gitter mit Marken für die Spaltenbreiten, die Kopfleiste als Dreiteilung
mit der Suche in der Mitte, das Suchfeld mit Kürzelmarke, der Druckpunkt
`scale(.976)`, und die aktive Zeile als linker Akzentbalken statt gefüllter
Fläche. Seine Farben nicht: `#7C5CFF` fällt gemessen durch (E199). Und
seine Handy-Lösung nicht: gestauchte Desktopansicht per Umbruchpunkt ist
genau das, was §55 verbietet, und Redion hat dort längst einen eigenen
Modus.


## E202 · Die Lernwelt bekommt Redions Zeichen — und zwei rote Läufe waren schon rot

**26. August 2026.** E200 hat Seitenleiste und Kopfleiste von Emoji befreit.
Die Lernwelt blieb aussen vor, und dort standen noch **fünfzig** davon: 🎓 im
Kopf, 🎴 auf der Tagesrunde, 📝 auf der Prüfung, ✅📅📚📷 in der Schnellwahl,
dazu 🏛️💼🎉🏁🏅🧭🧩✨☀️ in den übrigen Ansichten.

Emoji sind fremde Zeichen. Sie sehen auf jedem System anders aus, tragen ihre
eigene Farbe und lassen sich nicht auf `currentColor` stellen — beim Wechsel
von hell nach dunkel bleiben sie stehen, wie sie sind, und wirken wie ein
Fleck auf einer Fläche, die sich gerade gedreht hat.

**Die Grenze bleibt dieselbe wie in E200.** Redions eigene Oberfläche gehört
Redion; was ein Mensch selbst gesetzt hat, gehört ihm. Wer seiner Seite ein 🚀
gibt, bekommt ein 🚀. Deshalb entscheidet nicht der Ort, sondern der Name:
`zeichenSpan()` zeichnet ein Strichzeichen, wenn `Register.symbole.hat(name)`
zutrifft, und schreibt sonst hin, was dasteht. Die Rückfallzeichen für Seiten
ohne eigenes Symbol wurden dabei von `'📄'` auf `'page'` umgestellt — sie sind
Redions Vorschlag, nicht die Wahl des Nutzers.

**Zehn Zeichen kamen ins Register** (§5 Regel 3): `page`, `book`, `camera`,
`flag`, `medal`, `party`, `sun`, `rocket`, `box`, `boxChecked`. Die letzten
zwei ersetzen ☐/☑ vor jeder Aufgabe.

### Zwei Läufe waren rot, bevor irgendetwas angefasst wurde

**`test143` — die Zeichendatei fehlte im Vorrat des Dienst-Arbeiters.**
`quell/register/symbole.js` steht seit E200 in `index.html`, aber nicht in
`GRUNDSTOCK` von `src/dienst/sw.ts`. Ohne Netz kam sie damit nicht aus dem
Vorrat, der Arbeiter antwortete mit 504, und `Register.symbole` blieb
undefiniert — eine Seitenleiste ohne Zeichen, aber nur offline. Eingetragen,
Fassung auf `notizen-v24`.

**`test52`/`test143` — 260 gegen 240.** §68 hat die Seitenleiste auf 240
gesetzt, `test52` erwartete weiter 260, und der Doppelklick auf den Ziehgriff
sprang auf 260 zurück — also auf einen Wert, den `test245` (220–250) selbst
verbietet. Der Rücksetzer geht jetzt auf 240.

In `test143` steht statt der festen Zahl die eigentliche Behauptung:
*Zurücksetzen muss dorthin führen, wo der erste Start auch steht*, plus das
Band 220–250. Die Zahl selbst hütet `test245` — sie zweimal festzunageln hiess
nur, dass eine Änderung zwei Läufe rot macht, ohne dass etwas kaputt ist.
Gegengeprobt mit 300 px: beide Punkte werden rot.

### Und eine Gegenprobe, die nichts geprüft hat

Der neue Wächter in `test245` („Kein Emoji in Redions eigener Lernwelt") blieb
grün, als ich zum Beleg ein 📷 einsetzen wollte. Das sah nach einem Lauf aus,
der nicht rot werden kann. Er war es nicht — mein `sed` hatte schlicht nicht
gegriffen, es stand nie ein Emoji da. Mit einem echt eingesetzten Zeichen wird
er rot (`✗ … — 📷`).

Die Lehre ist dieselbe wie in §55.2, nur eine Ebene höher: **eine Gegenprobe
muss selbst nachweisen, dass sie etwas verändert hat.** Sonst prüft man das
Prüfen nicht, sondern glaubt es.


## E203 · Und die Schale selbst — sechzehn Emoji, die kein Bild je zeigte

**26. August 2026, gleicher Tag.** E202 hat die Lernwelt aufgeräumt. Beim
Nachsehen am Telefon standen aber immer noch zwei Emoji: 🎓 in der obersten
Pillenreihe und ✨ in der „KI fragen"-Pille. Beide kommen nicht aus
TypeScript, sondern direkt aus `index.html`.

Dort waren es insgesamt **sechzehn** — und zwölf davon hat nie ein Bild
gezeigt, weil sie im zugeklappten KI-Feld standen: ✒️ Schreiben, 🤖 Agent,
🎙 Besprechung, 📖 Nachschlagen, 🗂 Datenbank bauen, 📄 Seite aufbauen,
🧾 Protokoll, ⚙, 🧩, 🎤 — dazu 🔗 und ☑ in der Tastenleiste über der
Telefontastatur.

**Zwei Zeichen kamen dazu:** `robot` und `database`.

### Die schärfere Prüfung ist die Datei, nicht der Bildschirm

`test245` mass bisher am laufenden Browser. Das findet nur, was gerade
sichtbar ist — und genau deshalb sind die zwölf im KI-Feld so lange stehen
geblieben. `index.html` enthält per Bauart ausschliesslich Redions eigene
Oberfläche; dort kann kein Nutzerzeichen liegen. Also prüft der Lauf jetzt
zusätzlich **den Quelltext**:

    p('Kein Emoji in index.html — der Schale', imQuelltext.length === 0, …)

Gegengeprobt mit einem eingesetzten 🤖: der Punkt wird rot.

Die SVG-Pfade holt das Ersetzungsskript aus `quell/register/symbole.js` —
`index.html` und Register können damit nicht auseinanderlaufen, weil beide
denselben Ursprung haben.

**Eine CSS-Zeile war nötig.** Ein SVG ist ein Ersatzelement und steht auf der
Grundlinie, also zwei Punkte tiefer als der Text daneben. `ki.css` richtet die
Zeichen in den KI-Knöpfen deshalb mit `vertical-align:-3px` aus; die
Kopfzeile wird zu `inline-flex`, weil dort Zeichen und Wort gleich hoch
stehen sollen.


================================================================================
E204 — Die Heute-Ansicht bekommt eine Schattenleiter, und drei Regeln logen
================================================================================

`lernwelt.css` war 1004 Zeilen alt und hatte E198 nie mitbekommen. Gezählt
sah das so aus:

    var(--space-*)     0 Verwendungen
    var(--radius-*)    0 Verwendungen
    eigene Leiter      --lw-radius-xl:24px, -lg:18px, -md:14px, -sm:10px,
                       --lw-gap:18px — keine einzige Zahl trifft eine Sprosse
    feste px-Werte     328 Stück, davon 195 zwischen zwei Sprossen
    Schatten           16 handgeschriebene rgba(0,0,0,…) von .025 bis .12

`--lw-gap:18px` stand drei Zeilen über einem `gap:18px`, das dieselbe Zahl
noch einmal von Hand schrieb. Eine zweite Leiter neben der ersten ist keine
Leiter, sondern genau der Zustand, den E198 beheben wollte.

**Die vier Sprossen.** Farben, Masse und Zeiten hatte Redion; Schatten nicht.
Vier reichen, und sie bedeuten etwas: 1 liegt auf, 2 ist angehoben, 3
schwebt, 4 überlagert. Sie stehen in `hell.css` und `dunkel.css` und nicht
in `grund.css`, denn ein Schatten ist Farbe — `rgba(15,15,15,.06)` ist auf
Weiss eine zarte Kante und auf #1a1a1a nichts. E159 hat genau das einmal
gekostet.

`--shadow` und `--schatten-schwebend` bleiben als Namen und zeigen
wertgleich auf Sprosse 3 und 4, damit die 21 Stellen mit `var(--shadow)`
sich nicht ändern. Sie stehen jetzt in `grund.css`: als reine Namen sind sie
modusfrei, und `test245` besteht zu Recht darauf, dass eine Marke mit
gleichem Wert in beiden Modi nicht zweimal gepflegt wird. Der Punkt ging rot,
als die Aliasse noch in den Modusdateien standen — die Prüfung hat den Umbau
selbst zu Ende geführt.

**Drei Regeln logen, und nur das Auge sah es.**

*Der Einrichten-Knopf stand falsch.* Das Markup ist `class="lw-note lw-setup"`.
Beide Regeln wiegen gleich viel — eine Klasse —, und `.lw-setup` stand VOR
`.lw-note`. Bei Gleichstand gewinnt die spätere. Also galt `display:grid`
statt `display:flex`, und der Knopf lag über die volle Breite unter dem Text
statt rechts daneben. Auf dem Bild vom 26. August war er der auffälligste
Gegenstand der ganzen Seite, obwohl er das Angebot ist und nicht die Aufgabe.
Der Weg ist nicht `!important`, sondern die Reihenfolge.

*Drei Zeichengrössen waren erfunden.* Seit E202 sind die Zeichen SVG. Eine
`font-size:28px` erreicht ein `<svg width="18">` nicht — `.lw-card-icon` sagte
28, `.lw-object-icon` 15, `.lw-leer-icon` 24, und gezeichnet wurden überall
18. Die `font-size` bleibt trotzdem stehen: wer seiner Seite ein 🚀 gibt,
bekommt ein 🚀, und das IST Text. Die eine Zeile gilt für den Fall, die
andere für den Regelfall.

*Die fünfte Kennzahl stand allein.* Fünf Karten in vier Spalten liessen
„Level" in einer zweiten Reihe stehen, daneben drei Viertel weisse Fläche —
bei JEDER Breite, denn fünf teilt sich durch nichts. XP und Level sind
ohnehin dieselbe Zahl zweimal: das eine ist die Rechnung, das andere ihr
Ergebnis. Vier geht auf. Im selben Zug standen drei Entschuldigungen auf
einer Karte („Getrennt vom Wissensstand", „kein Wissensstand", „Motivation,
nicht Fachfortschritt"); es bleibt die oberste, sie gilt für die ganze Karte.

**Fünf getönte Flächen auf einem Bild.** Einrichtungskarte, Begrüssung,
Fokuskarte, Prüfungskarte, Lernroutine — jede mit eigenem Winkel und eigener
Tönung. Fünf Flächen, die alle „schau hier" sagen, sagen zusammen gar nichts,
und die eine Fläche mit wirklicher Arbeit geht darin unter. Ein Banner darf
tönen; es ist eins. Die Karten darunter liegen auf derselben Ebene, bekommen
dieselbe Fläche, und ihre Farbe steht dort, wo das Auge ohnehin zuerst
hinsieht: im Zeichen. §38 bleibt gewahrt, weil über jedem Zeichen sein Name
steht.

Tote Regeln, die dabei auffielen: `.lw-focus-card` setzte eine `background`,
die zwei Zeilen später überschrieben wurde. `.lw-engagement .lw-metrik` setzte
die Farbe, die es schon hatte (`--lw-surface` IST `--bg-side`). Und der
760er-Umbruch wiederholte ein Raster, das der 900er schon gesetzt hatte.


================================================================================
E205 — „Weiter wo du warst": neun gleiche Zeilen werden drei Seiten
================================================================================

Unten in der Übersicht stand „Zuletzt geöffnet", und darunter neun Zeilen.
Jede sagte dasselbe: der Untertitel wiederholte die Überschrift der Sektion,
und „gerade eben" stand an jeder, weil dieselbe Sitzung sie alle geöffnet
hatte. Neun Zeilen, kein Unterschied — und genau das Eine fehlte, woran man
eine Seite wiedererkennt: was draufsteht.

**Die Miniatur.** Jede Karte zeigt jetzt den Anfang ihrer Seite, so wie er
dort steht: Überschriften fett, Haken als Kästchen, Listenpunkte mit Punkt,
Code in fester Schrift. `Store.childrenOf` ist gleichläufig und liest den
Spiegel im Arbeitsspeicher — kein Warten, kein zweiter Speicherweg, kein
Ladezustand. Drei Ebenen tief wie `Kontext.textVonSeite` wäre genauer und für
fünf Zeilen zu teuer.

Ein echtes Vorschaubild wäre besser und gibt es nicht: Redion legt zu keiner
Seite eines an. Das steht in LUECKEN.md.

**Zwei Fehler auf dem Weg, beide vom Bild gefunden.**

Der erste Anriss zeigte Redions Markdown so, wie es getippt wurde: „Alles
hier liegt **lokal** in dein…", mit Sternen. Eine Vorschau ist eine Vorschau
und keine Quelltextzeile. `klartext()` nimmt dieselben Muster wie `inline()`
im Editor, behält aber den Inhalt statt ihn einzuwickeln. Die Reihenfolge ist
nicht beliebig: das Bild vor dem Link, sonst bleibt ein „!" stehen, und `**`
vor `*`, sonst frisst der eine Stern den anderen.

Der zweite: die erste Zeile einer Seite wiederholt oft ihre Überschrift, also
schnitt ich sie ab. Aus „Willkommen in Redion. Alles hier liegt lokal …"
wurde damit „in Redion Alles hier liegt lokal …" — der Anriss begann mitten
im Satz mit einem kleinen „in". Der Titel war dort nicht die Überschrift,
sondern der Anfang des Satzes. Erkennbar am nächsten Zeichen: geht es gross
oder mit einer Ziffer weiter, war es eine Überschrift; geht es klein weiter,
war es ein Satz.

**Ein Knopf, der sich drücken liess und nichts tat.** `externeEintraege` hatte
einen Zusatzwert `seiteBevorzugen`, den nur die PDF-Liste setzte. Für „Zuletzt
geöffnet" und „Laufende Projekte" stand er auf nein — und dort steht `id` bei
einem DATEI-Eintrag auf einer Dateikennung. `App.oeffne` bekam sie, fand
keinen Block und tat nichts. Wenn eine Seite bekannt ist, ist sie das Ziel;
wenn nicht, ändert sich nichts. Damit braucht es den Zusatzwert nicht mehr.

**Die Begrüssung war ein Plakat.** Gemessen auf 1440 × 900: der Kasten war
178 px hoch, und das Grösste darauf war „Mittwoch, 26. August" in 48 px — das
Einzige auf der ganzen Seite, das man nicht nachschlagen muss und nicht
anklicken kann. Die erste Karte mit wirklicher Arbeit begann bei y = 690, ihr
Knopf lag ausserhalb des Bildes. Der abgenommene Entwurf zeigt dort zwei
kleine Zeilen und sonst nichts.

**Und 166 px gingen für Zierrat drauf, bevor Inhalt anfing.** Gemessen auf
1400 × 1000, nachdem die Karten eingebaut waren: `test217` ging rot, der
Startknopf lag bei y = 993 von 1000. Die Messung zeigte, wo die Höhe
hingeht — Markenblock 60 px, Reiterleiste 106 px, weil sie auf zwei Reihen
umbrach. Auf ihr steht nichts als zehn Wörter.

Gekürzt wurde deshalb die Hülle und nicht der Inhalt:

    Reiterleiste   44 px sind eine FINGERregel (§37), keine Mausregel.
                   `@media(hover:hover) and (pointer:fine)` setzt 34 px;
                   `@media(pointer:coarse)` behält 44 — unabhängig von der
                   Fensterbreite, ein 1200-px-Tablet bekommt also weiterhin
                   die grosse Fläche.
    Markenblock    Zeichen 40 → 32, Überschrift 19 → 16 px.
    Bereichsmarke  „◎ Alle Bereiche" stand in der Begrüssung ein zweites Mal
                   — dieselbe Auskunft, die 300 px höher im Auswahlfeld steht
                   und dort auch geändert werden kann.

Knopf danach bei y = 920, 80 px Luft, `test217` wieder 27/27.

**Vier Kacheln statt sechs.** Sechs Sektionen mit sehr verschieden langen
Listen ergaben in zwei Spalten ein weisses Loch von fast 400 px: „Termine"
mit einer Zeile stand neben „Zuletzt geöffnet" mit acht. „Aufgaben heute" und
„Überfällig" sind ausserdem dieselbe Frage — was ist offen. Die Antwort steht
in der Zeile („heute", „Do", „26. Aug."), nicht in zwei Überschriften;
überfällig kommt zuerst, weil es zuerst dran ist. Die Übersicht bleibt bei
ZWEI Spalten: vier Kacheln in drei Spalten liessen wieder eine allein.


================================================================================
E206 — Links weniger Bereiche, und die zwei Welten haben nur noch einen Weg
================================================================================

Redur am 26. August, wörtlich:

    „Links habe ich so viel Bereiche, reduziere es — aber wichtig nichts
    löschen. Dann mache die Workspace und Lernbereich zu nur einer. […] Es
    sollte nicht so viele Bereiche haben, z. B. wie Uni / Schule Ausbildung
    usw. […] Wenn du etwas löschen willst oder musst, immer mich fragen."

Gezählt, bevor irgendetwas angefasst wurde: **70 Knöpfe** in der Seitenleiste,
**neun Reiter** in der Lernwelt.


ERST NACHSEHEN, DANN AUFRÄUMEN
--------------------------------------------------------------------------------

Zwölf Knöpfe sahen nach Doppelungen aus. Fünf davon waren keine, und das kam
erst beim Nachlesen des Codes heraus — nicht beim Zählen der Namen:

    side-reiter „Chat"      `KI.seitenleiste(baum)` — ersetzt den BAUM durch
                            Agenten und Verlauf. Kein zweiter Weg dorthin.
    side-reiter „Bespr."    `Meeting.seitenleiste(baum)` — dasselbe für
                            Besprechungen.
    side-reiter „Start"     schaltet den Baum ZURÜCK. Ohne ihn käme man aus
                            dem Chat-Modus nicht mehr heraus; ein Doppelklick
                            öffnet ausserdem „Abschnitte anpassen".
    Apps „Meine Aufgaben"   `Bibliothek.aufgaben()` gegen `workspace('aufgaben')`
                            an der Zeile „Aufgaben" — zwei Ansichten, zwei Fragen.
    Apps „Notion-Wissen"    `Wissen.oeffnen()`, das Modul mit den acht Teilen.
                            Die gleichnamige Zeile im Baum ist eine Seite.

Die Reiterleiste ist also kein Navigationsstreifen, sondern ein Umschalter für
das, was unter ihr steht. Hätte ich nach Namen aufgeräumt statt nach Verhalten,
wäre der Weg aus dem Chat-Modus verschwunden.

Sieben waren echte Doppelungen, und bei denen steht es wörtlich im Code:

    reiterWechseln('suche')  { suche(); reiter = 'start'; … }
    reiterWechseln('inbox')  { Ansichten.posteingang(); reiter = 'start'; … }

Das ist Zeichen für Zeichen dasselbe, was `btn-search` und `btn-inbox` acht
Zeilen tiefer tun. Der Welt-Umschalter oben rief `Produktwelten.lernen('heute')`
und `Produktwelten.workspace()` — dasselbe wie die Zeilen „Heute" und
„Workspace" darunter. Und drei Apps standen zusätzlich in der obersten Gruppe
oder im Fuss: Bibliothek, Papierkorb, Hilfe.


DIE ZWEI WELTEN BLEIBEN, IHR UMSCHALTER GEHT
--------------------------------------------------------------------------------

„Workspace und Lernbereich zu nur einer" heisst nicht, eine Welt zu löschen —
das wäre ein Datenumbau und niemand hat danach gefragt. Es heisst: EIN Weg
statt drei. Derselbe Bestand, dieselben Ansichten, derselbe `WELT_META`;
weg ist die auffälligste Zeile der Leiste, die nichts anderes tat als die
zwei Zeilen darunter.

Wo man ist, sagt jetzt die Markierung an der Zeile selbst — die Regel dafür
(`body[data-produktwelt="lernen"] #btn-learning`) gab es schon, sie stand nur
neben einem zweiten Anzeiger. `Produktwelten.markieren()` läuft weiter über
`[data-welt]`; findet es keins, geht `forEach` über eine leere Liste.


ZWANZIG ZEILEN WERDEN VIER SCHUBLADEN
--------------------------------------------------------------------------------

Zwanzig gleichrangige Zeilen ganz unten in der Leiste sind keine Liste,
sondern eine Wand: man liest sie nicht, man sucht darin — und um überhaupt
hinzusehen, muss man an allem anderen vorbeirollen.

    Planen          Kalender, Tagesplan, Wochenrückblick, Zurückgestellt,
                    Meine Aufgaben
    Daten           Datenmodell, Kennzahlen, Was hereinkommt, Marktplatz
    Einrichten      Aussehen, Tempo, Passwort, Erweiterungen, App installieren
    Hilfe & Pflege  Notion-Wissen, Was Redion kann, Erste Hilfe

Gelöscht ist nichts; jede App steht weiterhin da, nur eine Ebene tiefer. Der
Zähler rechts sagt vorher, wie viele drin sind — ohne ihn öffnet man eine
Schublade, um zu sehen, ob sich das Öffnen lohnt. Ein Eintrag ohne `gruppe`
fällt nicht heraus, sondern landet unter „Sonstiges": eine Erweiterung, die
sich über `melde` anhängt, kennt diese Namen nicht und darf trotzdem
erscheinen.

**Und dabei ein Fehler, den erst die Prüfung fand.** Der erste Entwurf gab
jeder Gruppe die Ränge 10, 20, 30 — aber `anPlatz('apps')` sortiert nach
`rang`, ohne die Gruppe zu kennen. Heraus kam eine Liste, in der erst alle
Ersten jeder Gruppe standen, dann alle Zweiten: eine Reihenfolge, die auf dem
Bildschirm nirgends vorkommt. `test222` §6 vergleicht Register und Bild und
ging zu Recht rot. Der Rang läuft jetzt durch, 10 bis 170, und die Gruppen
sind nur die Schnitte darin.

Gemessen: **70 Knöpfe → 67 im Baum, davon 50 sichtbar.** Aufgeklappt sind
wieder alle 67 da.


NEUN REITER WERDEN VIER
--------------------------------------------------------------------------------

    Heute · Lernen ⌄ · Prüfungen · Wo du lernst ⌄

Neun Reiter brauchen 1016 px; am Rechner umbrachen sie auf ZWEI Reihen und
kosteten 106 px über der Falz — mehr als jede Karte darunter, und darauf
stehen zehn Wörter.

Drei der vier sind Gruppen und tragen ein kleines „⌄". Wer darin ist, bekommt
eine ZWEITE, kurze Reihe mit genau den Ansichten dieser Gruppe. Bewusst kein
Aufklappmenü: ein Menü versteckt, wo man ist, und man muss es öffnen, um zu
sehen, ob es sich lohnt. Die Reihe steht da, solange sie gebraucht wird —
dasselbe Verhalten, das Word und VS Code für ihre Registerkarten benutzen.

`ANSICHTEN` bleibt unverändert die Wahrheit über die neun. `Lernwelt.ansichten`
gibt weiterhin alle neun heraus, Routen wie `#welt-lernen-uni` funktionieren
weiter, und wer eine zehnte Ansicht anlegt und in `REITER` nicht einträgt,
bekommt sie als eigenen Reiter statt gar nicht.

Nachgemessen statt behauptet — alle neun Ansichten, einzeln geöffnet:

    heute        1 Reihe  gefüllt  Heute*
    lernen       1 Reihe  gefüllt  Lernen*      ↳ Übersicht* Lernpfad Fehler Fortschritt
    lernweg      1 Reihe  gefüllt  Lernen*      ↳ Übersicht Lernpfad* Fehler Fortschritt
    fehler       1 Reihe  gefüllt  Lernen*      ↳ … Meine Fehler* …
    pruefungen   1 Reihe  gefüllt  Prüfungen*
    schule       1 Reihe  gefüllt  Wo du lernst* ↳ Schule / Ausbildung* Uni Arbeit
    uni          1 Reihe  gefüllt  Wo du lernst* ↳ … Uni* …
    arbeit       1 Reihe  gefüllt  Wo du lernst* ↳ … Arbeit*
    fortschritt  1 Reihe  gefüllt  Lernen*      ↳ … Fortschritt*

Keine Seitenfehler, keine leere Ansicht, nie zwei Reihen.

Mit Augen gefunden: „Lernen › Lernen" — die Gruppe hiess wie ihr erster
Eintrag, und untereinander gelesen sah das aus wie ein Fehler. In der Gruppe
ist der Name ohnehin schon gesagt; der Unterreiter heisst jetzt „Übersicht".
`ANSICHTEN` blieb dabei unangetastet: umbenannt ist die Beschriftung, nicht
die Ansicht.


ZWEI PRÜFLÄUFE MUSSTEN GEÄNDERT WERDEN, UND ZWAR EHRLICH
--------------------------------------------------------------------------------

`test34` behauptete „Fünf Reiter wie bei Notion". Die Zahl stand an ZWEI
Stellen, und die erste zu ändern hätte gereicht, um die zweite zu übersehen —
sie ging auch prompt einzeln rot. Der Punkt heisst jetzt „Drei Reiter, und
jeder schaltet den Baum um", weil das die Behauptung ist.

`test222` prüfte „die Marken sind die kurzen, unveränderten" anhand der ersten
vier Einträge. Drei dieser vier prüften in Wahrheit nur die REIHENFOLGE, nicht
die Behauptung; als die Gruppen die Reihenfolge änderten, ging der Punkt rot,
obwohl keine Marke sich geändert hatte. Geprüft wird jetzt, was dasteht:
keine Marke trägt das `app-`-Präfix aus E166, und die kurzen sind noch da.

Gegenprobe (§55.2): eine Doppelung künstlich wieder eingebaut — vier Punkte
gingen rot, und einer davon zeigte zusätzlich, dass ein Rang, der nicht zur
Gruppe passt, ebenfalls auffällt.

Prüfläufe: test34 76/76, test222 48/48, test217 27/27, test128 50/50,
test245 52/52, test215 44/44.


================================================================================
E207 — Die Bibliothek bekommt ein Regal, und die Vorschau zieht in den Kern
================================================================================

Redur am 26. August: „Die Bibliothek Bilder waren perfekt, so will ich es
haben." Gemeint ist der abgenommene Entwurf: ein Regal, in dem jedes Heft
eine Karte ist und auf jeder Karte der ANFANG der Seite steht, an der zuletzt
gearbeitet wurde.

Die echte Bibliothek war eine Tabelle. Dreizehn Zeilen, in jeder ein Titel und
dreimal dieselbe Auskunft — „Ich", „Notion-Wissen", „gerade eben". Man liest
darin nicht, man sucht; und man muss den Titel schon kennen, um ihn zu finden.


EIN HEFT IST KEINE NEUE DATENART
--------------------------------------------------------------------------------

Der Entwurf nennt sie Hefte, der Bestand nennt sie Quellen — es ist dasselbe.
`quelleVon()` rechnet für jede Seite ohnehin schon aus, wo sie herkommt: die
Datenbank, die Elternseite, der Lebensbereich, oder „Privat". Damit braucht
das Regal keine Migration, keinen zweiten Speicher und keinen Umzug (§9).

Die Tabelle bleibt vollständig und ist einen Klick entfernt. Sie kann etwas,
das das Regal nicht kann — nach Spalten sortieren, Eigenschaften ein- und
ausblenden, viele Zeilen auf einmal überblicken. Zwei Formen für zwei Fragen:
„welche Seite war das?" und „welche Seiten gibt es?".


DIE VORSCHAU GEHÖRT IN DEN KERN
--------------------------------------------------------------------------------

E205 hat der Lernwelt beigebracht, eine Seite als kleines Abbild zu zeigen.
Die Bibliothek stellt dieselbe Frage. CLAUDE.md §5, Regel 1 ist eindeutig: ein
Bereich importiert nicht aus einem anderen, und was beide brauchen, gehört
nach `kern/`.

    src/kern/helfer/vorschau.ts
        klartext(roh)              Auszeichnungen weg, Text bleibt
        anriss(seiteId, titel)     der Anfang als EINE Zeile
        miniatur(seiteId, zeilen)  der Anfang als kleines Abbild
        umfang(seiteId)            hat die Seite überhaupt etwas?

Der bequeme Weg wäre gewesen, die dreissig Zeilen in `bibliothek.ts` noch
einmal hinzuschreiben. Dann gäbe es zwei Anrisse, die sich das erste Mal
unterscheiden, sobald jemand eine Auszeichnung ergänzt — gemerkt hätte man es
an der Stelle, die man gerade nicht ansieht. Der Stil der Zeilen (`.mini-*`)
ist aus `lernwelt.css` nach `bausteine.css` mitgezogen: dieselbe Seite soll an
beiden Orten gleich aussehen.

`vorschau.js` steht in `index.html` UND im Vorrat des Arbeiters, VERSION auf
v25. Fehlte die Zeile, wäre `Vorschau` offline undefiniert — und dann hätten
BEIDE Ansichten leere Karten, nicht nur eine.


VIER FEHLER, UND DREI DAVON FAND DAS BILD
--------------------------------------------------------------------------------

**Erstens: `Store` steht nicht an `window`.** Im Kernmodul stand
`const store = (globalThis as any).Store`, und damit war `store` immer
`undefined`: `Store` ist ein `const` auf oberster Ebene im gemeinsamen
Skript-Bereich (`module: "none"`), kein Feld am Fenster. `typeof
undefined?.childrenOf !== 'function'` ist wahr, also kam ein leeres Feld
zurück — kein Wurf, keine Meldung, nur überall „Dieses Heft ist noch leer".

Gemessen: 16 Kinder mit Text, 0 Zeichen Miniatur. Genau die Sorte, vor der
§55.2 warnt — eine Vorschau, die nichts zeigt, sieht aus wie ein leerer
Bestand und nicht wie ein Fehler.

**Zweitens: die Form wurde zu früh gelesen.** `zustand.form = formLesen()`
läuft, während die Datei geladen wird — lange bevor IndexedDB ausgelesen ist.
`getMeta` gab den Standard, und die gemerkte Wahl war beim nächsten Start weg.
Ich hatte im Bildskript ausdrücklich „liste" gesetzt und bekam ein Regal.

**Drittens: „leer" war eine falsche Aussage über einen vollen Bestand.**
„Meine Aufgaben" stand als leerer Kasten neben zwei vollen, obwohl das Heft
drei Seiten hat. Die drei sind Zeilen einer Datenbank; ihr Inhalt steckt in
den SPALTEN, nicht in Kindblöcken. Was ein solches Heft zu zeigen hat, sind
seine Seiten — bei einer Aufgabenliste ist die Liste der Aufgaben genau das,
was man sehen will.

**Viertens, und das fand die Prüfung: im Regal fehlten die Reiter.**
`test202` sucht `[data-r="mehr"]`, um über „Ausbildung" ins Schul-Dashboard zu
kommen — im Regal gab es den Knopf nicht. Damit war ein ganzer Bereich von
dort aus unerreichbar. Der Grund ist einfach zu benennen: die Reiter FILTERN
den Bestand, sie stellen ihn nicht dar. Was gefiltert wird, hat mit der Form
nichts zu tun. Sie stehen jetzt im gemeinsamen Kopf.


UND EIN LÖSCHEN AUS E206 MUSSTE ZURÜCKGENOMMEN WERDEN
--------------------------------------------------------------------------------

E206 hat „Bibliothek" aus „Meine Apps" entfernt, weil in der obersten Gruppe
eine Zeile „Bibliothek" steht. Beim Nachlesen der Aufrufe stimmte das auch —
nur habe ich eine Ebene zu früh aufgehört:

    app-bib      → `Bibliothek.oeffne()`
                   die Seitenübersicht mit Reitern und Spalten
    btn-library  → `Produktwelten.bibliothek()` → `workspace('bibliothek')`
                   die Bibliothek der ARBEITSWELT

Zwei Namen, zwei Ansichten. `test33` fand es: der ersetzte Weg landete im
Workspace — Krume „🧱 Workspace", null Reiter, null Zeilen. Der Eintrag ist
unter „Alle Seiten" zurück; der neue Name musste sein, weil zwei gleich
benannte Knöpfe zu zwei Ansichten schlimmer sind als ein ungewohnter Name.

Die Lehre ist nicht „Panne", sondern eine Regel: ich habe nach dem NAMEN der
aufgerufenen Funktion verglichen und nicht danach, wohin sie führt. Bei
`suche`/`inbox` reichte das, weil dort wörtlich derselbe Aufruf steht; hier
heissen beide Wege „Bibliothek" und meinen Verschiedenes. Redurs Bedingung
war „nichts löschen", und das hier war ein Löschen.


DREI PRÜFLÄUFE NACHGEZOGEN, UND ZWEI NEUE PUNKTE
--------------------------------------------------------------------------------

`test33` prüft jetzt beide Formen: das Regal (fasst es zu Heften zusammen,
zeigt es echten Inhalt, führt jede Karte auf eine Seite, überlebt die Wahl
einen Neuaufbau) und danach wie bisher die Liste. Es öffnet die App-Schubladen
über den Speicher statt über Klicks — der Baum wird bei jedem Ansichtswechsel
neu gezeichnet, und ein vorher gegriffener Knopf ist danach ein anderer.

`test222` bekam den Punkt, den `test33` gebraucht hätte: ein Klick öffnet die
Schublade, und sie sagt es auch dem Vorleseprogramm (`aria-expanded`). Ohne
ihn wären die Apps im Baum, ein Vorleseprogramm fände sie, und niemand käme
hin.

Zwei alte Punkte prüften nicht, was sie behaupteten. „Papierkorb dabei" hiess
in Wahrheit „er steht in dieser Liste" und wäre auch grün geblieben, wenn der
Knopf ins Leere geführt hätte; er heisst jetzt „Zum Papierkorb führt ein Weg".
„Bibliothek dabei" prüfte den sichtbaren Text statt der Marke `bib`, die eine
Adresse nach aussen ist (E167).

UND DIE ERSTE GEGENPROBE BLIEB GRÜN
--------------------------------------------------------------------------------

Den `window`-Fehler wieder eingebaut, gebaut, `test33` gelaufen — 84/84, und
`mitInhalt` stand weiter auf 3. Nachgemessen war `Vorschau.miniatur()` dabei
nachweislich leer: 0 Zeichen bei einer Seite mit 16 Kindern, und
`window.Store` war wirklich `undefined`. Die Änderung war also da und wirkte;
der Punkt hat sie bloss nicht gesehen.

Der Grund ist MEIN EIGENER RÜCKFALL. Hat ein Heft keine Miniatur, zeigt die
Karte stattdessen die Titel ihrer Seiten (`inhaltsListe`) — richtig für
Datenbankzeilen, und genau damit ist das Blatt immer gefüllt, egal ob die
Vorschau lebt. Ein Punkt, der „das Blatt trägt Text" misst, kann nicht mehr
rot werden.

E202 sagt es genau so: eine Gegenprobe muss selbst beweisen, dass sie etwas
geändert hat. Hier kam eine zweite Lehre dazu — ein Rückfall, der eine
Anzeige rettet, macht die Prüfung darüber blind. Wer einen einbaut, muss die
Schicht darunter eigens prüfen.

`test33` prüft deshalb jetzt die Behauptung des Kernmoduls direkt: hat eine
Seite Kinder mit Text, muss `miniatur()` etwas liefern und `anriss()` auch.
Damit geht die Gegenprobe rot — gemessen, mit dem Beweis daneben, dass der
Fehler in der gebauten Datei stand:

    mit Fehler:   kinder=16   zeichen=0    anriss=0   →  2 Punkte rot, 85/87
    ohne Fehler:  kinder=16   zeichen=412  anriss=90  →  87/87

Zweite Gegenprobe: die Schublade lahmgelegt — beide neuen Punkte in test222
gehen rot (`{"vorher":0,"nachher":0,"offen":"false"}`).

test33 87/87, test222 50/50, test202 84 ok, test54 63/63.


================================================================================
E208 — Sicherung, Papierkorb und Platz: der Rest des Bibliothek-Entwurfs
================================================================================

Der letzte Teil des abgenommenen Entwurfs, und kein Beiwerk. Nach §46 ist
Priorität 1, keine Daten zu verlieren; wer beim Öffnen der Bibliothek sieht,
wann er zuletzt gesichert hat, verliert seltener etwas. Deshalb steht es hier
und nicht in einem Einstellungsdialog, den niemand aufmacht.


DER SICHERUNGSSTAND GEHÖRT IN DEN KERN
--------------------------------------------------------------------------------

`sicherungsstand()` stand in `bereiche/datenbanken/ansichten/dienst.ts`. Die
Bibliothek stellt dieselbe Frage — und ein Bereich darf nicht aus einem
anderen importieren (§5, Regel 1).

Abschreiben wäre hier schlimmer gewesen als bei der Vorschau (E207). Bei einem
Anriss fällt es auf, wenn zwei Fassungen auseinanderlaufen; bei einer FRIST
nicht. Eine Ansicht, die „gesichert" sagt, während die andere warnt, ist genau
die Sorte Fehler, die §46 meint.

    src/kern/helfer/sicherung.ts
        stand()       wie alt ist die letzte Sicherung, und ist das noch gut?
        merken(art)   den Zeitpunkt festhalten — nach einer ECHTEN Sicherung
        papierkorb()  wieviel liegt weg, und wann läuft die nächste Frist ab?
        platz()       wieviel belegt Redion auf dem Gerät?
        groesse(b)    Bytes als Text, den ein Mensch liest

`dienst.ts` liest jetzt `Sicherung.stand()`, `schale.ts` schreibt über
`Sicherung.merken()`. Die drei Zahlen `TAG`, `SICHERUNG_ERINNERN` und
`SICHERUNG_WARNEN` sind aus `dienst.ts` verschwunden: sie stehenzulassen
hiesse, zwei Zahlenpaare zu pflegen, von denen nur eines wirkt.

`sicherung.js` steht in `index.html` UND im Vorrat des Arbeiters, VERSION
auf v26.


ALLE ZAHLEN SIND ECHT, UND WO KEINE IST, STEHT KEINE
--------------------------------------------------------------------------------

Der Entwurf zeigte „41,2 MB von 2 GB" und „12 Seiten · 30 Tage Frist". Das
sind Entwurfszahlen; die App zeigt gemessene:

    Sicherung    `sicherung:zuletzt` — schreibt `schale.ts` erst NACH dem
                 Klick auf den Herunterladen-Verweis. Wer es vorher schriebe,
                 beruhigte jemanden über eine Datei, die es nicht gibt.
    Papierkorb   `Store.trashed()` und `papierkorbTage` (30). Angezeigt wird
                 nicht die Frist, sondern wieviel Zeit für das bleibt, was am
                 längsten liegt — das ist die Zahl, die zählt.
    Platz        `navigator.storage.estimate()`. Gibt der Browser sie nicht
                 heraus, steht dort ein Satz und kein Balken. Eine erfundene
                 Zahl über den freien Platz wäre schlimmer als keine: danach
                 richtet jemand aus, ob er noch ein Video einfügt.

Die Aufteilung in Anhänge und Rest kommt aus dem Bestand, nicht vom Browser,
und heisst deshalb auf dem Bild „geschätzt" — der Browser rechnet seinen
eigenen Verwaltungsaufwand mit, die beiden Zahlen müssen nicht aufgehen.

§38 ist gewahrt: die Stufe steht im SATZ und nicht nur in der Farbe —
„Gesichert heute", „Zuletzt gesichert vor 40 Tagen — das ist lange her",
„Noch keine vollständige Sicherung auf diesem Gerät".


ZWEI FEHLER BEIM BAUEN
--------------------------------------------------------------------------------

Der erste Entwurf las die Anhangsgrössen aus `Store.cache.dateien` — das gibt
es nicht. Der Spiegel im Arbeitsspeicher führt Blöcke, Sammlungen, Ansichten
und Marken, sonst nichts. Die Summe wäre still 0 geblieben, und der Balken
hätte behauptet, Anhänge kosteten keinen Platz. `Store.dateiAlle()` fragt die
Ablage.

Der zweite war beinahe eine Verschlimmbesserung: „7.9 MB von 1 GB · 0.7 %"
sah nach englischer Zahlenschreibweise aus. Nachgemessen schreibt **de-CH den
Dezimaltrenner als Punkt** und den Tausendertrenner als Apostroph — „7.9 MB"
und „14'091 Wörter" sind für die Schweiz richtig. Gemessen statt korrigiert.


DER PRÜFLAUF, UND WAS ER WIRKLICH PRÜFT
--------------------------------------------------------------------------------

`test33` fährt jetzt die drei Zustände durch: kein Zeitstempel → warnen,
Sicherung von heute → gut, vor 40 Tagen → warnen. Es prüft dabei den SATZ und
nicht die Klasse, weil §38 den Satz verlangt.

Und es prüft die eine Frage, für die der Kern-Umzug gemacht wurde: rechnen
Bibliothek und Kern dasselbe? Zwei Fassungen wären zwei Wahrheiten über die
Frage, ob die Daten sicher sind.

Dazu: ohne `estimate()` darf der Platz nichts behaupten — geprüft mit
abgeschaltetem `estimate`.

Gegenprobe (§55.2), mit dem Beweis daneben, dass der Fehler in der gebauten
Datei stand: der fehlende Zeitstempel auf `gut` gesetzt — zwei Punkte rot,
94/96. Zurückgenommen 96/96.


================================================================================
E209 — Der Lösungsweg: jede Rechnung zeigt ihre Schritte
================================================================================

Redur, mehrfach und wörtlich: der Lösungsweg muss immer gezeigt werden.

`ElectricalCalculations` gab bis heute `{ value, unit, formula }` zurück — also
„U = I · R" und „1,64 V". Was fehlte, ist der Schritt dazwischen:
„= 3,19 · 0,541". Wer nur Formel und Ergebnis sieht, kann nicht nachprüfen, ob
er dasselbe gerechnet hätte, und lernt nichts. In einer Prüfung wird ohnehin
der Weg bewertet und nicht die Zahl.


DIE EINGESETZTE ZEILE WIRD NICHT VON HAND GESCHRIEBEN
--------------------------------------------------------------------------------

`Rechenweg.schritt()` bekommt die Formel, die Werte und die Rechnung. Die
eingesetzte Zeile entsteht aus DENSELBEN Werten, mit denen gerechnet wird —
es gibt nur eine Quelle für beide. Von Hand geschrieben liefen sie das erste
Mal auseinander, sobald jemand eine Zahl ändert, und zwar still. Genau diese
Sorte Fehler ist an einem Tag dreimal vorgekommen (leere Miniatur, zu früh
gelesene Form, Anhangsgrösse aus dem falschen Speicher).


ZWEI WÄCHTER, UND BEIDE HABEN SICH SCHON BEWÄHRT
--------------------------------------------------------------------------------

**Erstens: ein Name in der Formel ohne Wert wird gemeldet.** Sonst bliebe der
Buchstabe in der eingesetzten Zeile stehen und sähe aus wie Absicht.

**Zweitens: die gezeigte Zeile muss das gezeigte Ergebnis TRAGEN.** Das ist
der wichtigere. Zahlen werden beim Anzeigen gerundet, und eine zu kurz
gerundete Zahl macht aus der Rechnung eine andere:

    ϱ = 0,0178   stand als „0,018" da
    0,018 · 2 · 38 / 2,5 = 0,547     danebengeschrieben stand 0,541

Wer die Zeile mit dem Taschenrechner nachrechnet, muss auf das kommen, was
danebensteht; sonst sucht er den Fehler bei sich — und das ist bei einem
Lernwerkzeug der schlimmste denkbare Fehler.

Die Ursache war `toLocaleString` OHNE `maximumFractionDigits`: es rundet auf
drei Nachkommastellen, unabhängig davon, was `toFixed` vorher gemacht hat.

Der Wächter rechnet dieselbe Funktion ein zweites Mal — mit den Zahlen, wie
sie DASTEHEN. Weicht das Ergebnis um mehr als ein halbes Prozent ab, wirft er.
Der Fehler kommt damit gar nicht erst bis zur Anzeige.


KEIN eval() (§20)
--------------------------------------------------------------------------------

Hier wird nichts zerlegt und nichts ausgeführt: die Rechnung ist eine
gewöhnliche Funktion, die Formel ist Text daneben, und der zweite Wächter ruft
dieselbe Funktion noch einmal. Es gibt nichts zu unterschieben. `test246`
prüft das am Quelltext, mit weggeschnittenen Kommentaren — dort steht das Wort
nämlich ausdrücklich, und zwar als Zusage.


DIE ERSTE AUFGABE: DER SPANNUNGSFALL
--------------------------------------------------------------------------------

Vier Schritte und eine Gegenprobe, wie im abgenommenen Entwurf:

    1  Strom aus der Leistung     I = P / (U · cosφ)      = 3,1854 A
    2  Widerstand der Leitung     R = ϱ · 2 · l / A       = 0,54112 Ω
    3  Spannungsfall              ΔU = I · R · cosφ       = 1,6375 V
    4  In Prozent                 ΔU% = ΔU / U · 100      = 0,7120 %
       Gegenprobe                 PV = I² · R             = 5,4905 W

Der Faktor 2 in Schritt 2 ist der Hin- UND Rückweg. Er wird am häufigsten
vergessen, und dann kommt die Hälfte heraus — deshalb steht er als Hinweis am
Schritt und nicht nur in der Formel.

Und die Annahmen stehen dabei, auch die unbequeme: das ist die Näherungsformel
aus dem Formelheft, ohne den induktiven Anteil der Leitung. Für Installations-
leitungen ist der Unterschied klein; ihn zu verschweigen wäre trotzdem falsch.


test246 LÄUFT OHNE BROWSER
--------------------------------------------------------------------------------

Hier wird gerechnet, nicht gezeichnet — und eine Rechnung braucht kein
Fenster. Der Lauf dauert Sekundenbruchteile statt einer halben Minute, und
genau deshalb geht er alle Grenzfälle durch statt drei.

Die Sollwerte sind VON HAND nachgerechnet und nicht aus dem Modul kopiert.
Eine Prüfung, die ihr Soll aus dem Prüfling holt, bestätigt jeden Fehler.

Und §2 rechnet die eingesetzten Zeilen wirklich nach — die Zeichenkette wird
zerlegt und mit den gefundenen Zahlen gerechnet. Ein Punkt, der nur prüft,
DASS eine Zeile dasteht, wäre auch dann grün, wenn Unsinn darinsteht.

Gegenprobe (§55.2), mit dem Beweis daneben, dass der Fehler in der gebauten
Datei stand: `maximumFractionDigits` entfernt — der Kern wirft beim Bauen des
Wegs, mit genau der Meldung „nachgerechnet ergibt die gezeigte Zeile 0.547 Ω,
danebensteht 0.541 Ω". Zurückgenommen 37/37.

Was noch fehlt: die ANZEIGE. Der Weg wird gerechnet und lässt sich als Text
übernehmen, aber es gibt noch keine Ansicht, die ihn zeigt. Das steht als
nächster Schritt an und ist der Grund, warum diese Entscheidung hier schon
steht: der Kern ist geprüft, bevor eine Oberfläche darauf baut.


NACHTRAG — WAS DAS ZEIGEN AM DIALOG GEÄNDERT HAT
--------------------------------------------------------------------------------

Drei Dinge fielen erst auf, als der Weg wirklich auf dem Schirm stand.

ERSTENS: die Zahl stand zweimal da, in zwei Schreibweisen. Oben „0.71194616 %",
in der letzten Zeile „0.7119 %". Der Kopf benutzte `format` mit acht geltenden
Ziffern, der Weg seine eigene Rundung. Bei den neun Rechnungen ohne Weg ist
`format` die einzige Zahl auf dem Schirm und stört niemanden — steht ein Weg
darunter, muss der Leser raten, welche der beiden die Antwort ist. Wo ein Weg
da ist, gilt jetzt dessen Schreibweise (`kopfZahl`).

ZWEITENS: der Dialog wuchs auf 1177 px und schob seine eigenen Knöpfe aus dem
Bild. In einem 980 px hohen Fenster stand „Ergebnis in Seite" danach 185 px
unter dem Rand, am Telefon 310 px. Gerollt werden konnte, aber niemand rollt
nach einem Knopf, den er eine Sekunde vorher noch gesehen hat. Jetzt: Kopf
fest, Bauch rollt, Knopfreihe fest — `grid-template-rows:auto minmax(0,1fr)
auto`. `minmax(0,1fr)` und nicht `1fr`: eine Rasterzeile schrumpft sonst nicht
unter ihren Inhalt, und dann rollt gar nichts.

DRITTENS: im festen Fuss standen sieben Knöpfe in drei Zeilen und frassen
130 px, während der Weg darüber zwei von fünf Schritten zeigte. Fünf davon
handeln gar nicht vom Rechnen, sondern vom Ein- und Auspacken von Lernpaketen.
Sie sind NICHT verschwunden — sie stehen jetzt unter dem Ergebnis, mit einer
Überschrift. Unten bleibt, was zur Rechnung gehört.

Der dritte Punkt hatte eine Falle: der Klick-Lauscher hing an der Knopfreihe.
Verschobene Knöpfe wären still tot gewesen. Er hängt jetzt am Dialog. Der
Gegenbeweis dazu ging beim ersten Versuch nicht rot — das `sed`-Muster hiess
`async event`, gebaut wird `async (event)`, also traf es nichts und der Lauf
war unverändert grün. Mit passendem Muster: alter Lauscher 1 Karte, neuer
8 Karten. Ein Gegenbeweis, der nicht beweist, dass er etwas geändert hat, ist
kein Gegenbeweis (E202).

Alle drei fand das Hinsehen, keiner davon eine Prüfung (§55.1).


================================================================================
E210 — Das Menüband: Start, Einfügen, Zeichnen, Werkzeuge, Elektro, Ansicht
================================================================================

Redur, wörtlich: „könntest du wie Word machen so ganze oben Start-Einfügen usw
weiter und z.B. nehmen die Werkzeuge von links dort und schaue was dort kommen
kann, du musst es wie GoodNotes bauen."

Also ein Menüband über der Seite, und die sieben Werkzeug-Zeilen aus der
Seitenleiste wandern hinauf.

Zu „wie GoodNotes": gebaut ist das MUSTER — gruppierte Knöpfe, grosse
Tippflächen, ein Blatt, in dem man rollt. Nicht gebaut sind GoodNotes' Icons,
Farben und Produktnamen. Ein fremdes Programm nachzuahmen heisst, von ihm zu
lernen, nicht es abzuzeichnen.


ES IST EIN REGISTER, KEINE ZEICHENDATEI
--------------------------------------------------------------------------------

§8 Regel 3: neue Dinge sind Register-Objekte. Ein Menüband, das seine Knöpfe
selbst kennt, ist der Anfang genau der Datei, vor der §5 warnt — eine, in der
jeder Bereich ein bisschen mitschreibt.

    register/menueband.ts     der Katalog: Reiter, Gruppen, Einträge
    schale/aufbau/menueband.ts  das Aussehen; kennt keinen Knopf beim Namen

Die wichtigste Regel der Registerdatei: KEIN EINTRAG DARF ETWAS NEUES TUN.
Jeder ruft eine Funktion, die es schon gibt und die schon geprüft ist. Ein
Menüband ist eine zweite ANSICHT auf das, was Redion kann — keine zweite
Fassung davon.

Deshalb ist „Einfügen" nicht aufgezählt, sondern kommt aus `Register.bloecke`:
dieselbe Liste, aus der sich das Slash-Menü bedient, 67 Blockarten. Eine neue
Blockart erscheint dort von selbst. Ein zweiter Katalog wäre nach der dritten
neuen Blockart falsch.

Und deshalb steht auch „PDF einlesen" NICHT im Band. `PdfEinlesen.alsSeiten`
braucht eine `File`; einen Dateiwähler in einen Katalog zu bauen wäre genau das
neue Verhalten, das die Regel verbietet. Der Weg dahin bleibt das Ziehen einer
PDF auf die Seite — als Lücke notiert.


WAS DER TYPPRÜFER GEFUNDEN HAT, BEVOR ES KNÖPFE WAREN
--------------------------------------------------------------------------------

Sechs Einträge riefen `Werkzeuge.versionen()`, `sperren()`, `praesentation()`,
`drucken()`, `quelltext()`, `htmlExport()` ohne Argument. Alle sechs nehmen die
offene Seite als Block. Ohne `strict` wären das sechs Knöpfe gewesen, die still
nichts tun.

Dazu: das Editor-Modul heisst `Blocks` und nicht `Editor`, und
`Marken.schicht` ist die Markierungsschicht über einer PDF-Seite und nicht die
Zeichenschicht — die heisst `Register.symbole.fuelle`.


WAS DAS AUGE GEFUNDEN HAT, WAS KEINE PRÜFUNG GEMELDET HÄTTE (§55.1)
--------------------------------------------------------------------------------

ERSTENS: drei Knöpfe ohne Zeichen. Der Zeichner unterschied Symbolnamen von
Textzeichen mit `/^[a-zA-Z]+$/` — „nur Buchstaben, also ein Symbolname". Damit
wurden „B", „I" und „S" für Fett, Kursiv und Durchgestrichen zu Symbolnamen,
die es nicht gibt. Jetzt wird gefragt statt geraten: `Register.symbole.hat()`.
test247 §2 meldet es seither.

ZWEITENS: „Durchgestriche". Ein einzelnes langes Wort kann nicht umbrechen,
lief über und wurde hart geschnitten — ohne Punkte, ohne Hinweis. Dasselbe wie
die abgeschnittene Zahl in §55.1.

DRITTENS: die Reihe war ungleich hoch, weil nur die Hälfte der Knöpfe ein
Tastenkürzel trug. Das Kürzel steht jetzt im Tooltip, wie in Word.

VIERTENS: „Einfügen" zeigte 14 von 67 Knöpfen hinter einem waagerechten
Roller, und nichts sagte, dass rechts noch 53 folgen. Waagerechtes Rollen
findet niemand von selbst.

FÜNFTENS: ein Klick auf den SCHON GEWÄHLTEN Reiter klappte das Band zu. Das
war als Abkürzung gedacht und ist eine Überraschung: wer auf „Start" klickt,
während „Start" offen ist, sieht plötzlich gar nichts mehr.


DIE SILBENTRENNUNG, GEMESSEN STATT GEGLAUBT
--------------------------------------------------------------------------------

`CSS.supports('hyphens','auto')` sagt `true`. Gemessen bleibt
„Aufzählungsliste" in 56 px trotzdem einzeilig und 84 px breit — die
Trennmuster fehlen. Eine Fähigkeit, die der Browser meldet und nicht hat.

Vier Schreibweisen wurden nebeneinander gestellt und angesehen:

    break-word allein       „Aufzählu/ngsliste"   bricht, zeigt alles
    clamp2 ohne break       „Aufzählun"           hart geschnitten
    eine Zeile mit Ellipse  „Übersc…"             verliert die Ziffer
    clamp2 MIT break-word   „Aufzählu/ngsliste"   bricht, zeigt alles,
                            „Kalkulati/onstab…"   kürzt nur das Längste

Die letzte gewinnt. Ein weicher Trennstrich an bekannten Wortfugen wurde
probiert und verworfen: „Inhalts-/verzeichnis" und „Lese-/zeichen" wurden
besser, „Aufgabe/nliste" schlechter. Zwei besser, eines schlechter — zu wenig
für eine Sonderregel, die beim nächsten Namen wieder anders ausfällt.


DIE WERKZEUGE SIND UMGEZOGEN, NICHT GELÖSCHT
--------------------------------------------------------------------------------

Redur, im selben Auftrag: „wichtig nichts löschen, und wenn du etwas löschen
willst oder musst, immer mich fragen."

Die sieben Zeilen — Journal, Schnellnotizen, Vorlagen, Graph, Schlagwörter,
Karteikarten, Umsetzungsstand — stehen jetzt im Reiter „Werkzeuge". In der
Seitenleiste sind sie ausgeblendet, NICHT entfernt: schaltet man den Abschnitt
wieder ein, zeichnet die Seitenleiste ihn aus DEMSELBEN Register. Zwei
Ansichten, eine Wahrheit; sie können nicht auseinanderlaufen.

Dafür brauchte `abschnittAn` eine zweite Liste. Bisher war alles an, was nicht
in `sidebarAus` stand. Für einen Abschnitt, dessen Vorgabe AUS ist, wäre
„einblenden" ein Knopf gewesen, der etwas aus `sidebarAus` entfernt, das gar
nicht drinsteht — er hätte ausgesehen, als täte er etwas. `sidebarAn` merkt
jetzt das ausdrückliche Einschalten. Wichtig ist der Unterschied zwischen „nie
etwas gesagt" und „ausdrücklich abgeschaltet": wer den Abschnitt früher
abgeschaltet hatte, findet ihn nicht plötzlich wieder da.


DAS BAND BRICHT UM UND ROLLT SENKRECHT
--------------------------------------------------------------------------------

Gemessen, warum „Start" trotz schmaler Knöpfe umbrach: die drei Gruppen sind
zusammen 1155 px breit, das Band 1200 px innen — und trotzdem fiel „Finden" in
die zweite Zeile. Die Rechnung übersah die Abstände. Der Trenner hatte einen
eigenen Rand UND das Band einen `gap`; zweimal derselbe Abstand ergab 1209 px.

Die Knöpfe haben jetzt eine feste Breite von 68 px statt einer vom längsten
Namen abhängigen zwischen 58 und 106. Die Reihe steht ruhig, und die Breite
ist vorher ausrechenbar.

Am Telefon startet das Band ZUGEKLAPPT. Aufgeklappt begann die Seite erst bei
y=274 von 844 — ein Drittel des Bildschirms für Knöpfe, bevor ein Wort des
eigenen Textes zu sehen ist, ist keine Notiz-App mehr.


WAS DER PRÜFLAUF SELBST GELERNT HAT
--------------------------------------------------------------------------------

test247 stürzte beim Gegenbeweis zu §7 ab, statt einen Punkt rot zu machen:
`page.click` wartet 30 Sekunden auf ein Element, das der eingebaute Fehler nie
erzeugt hat, und wirft dann. Die Punkte danach wurden nie geprüft. Klicks
melden jetzt `false` und der Lauf geht weiter.

Und der Gegenbeweis zu §7 brauchte drei Anläufe:

  · den Reiter nicht mehr setzen → der Lauf stürzt ab, §7 wird nie erreicht
  · den `ablageGeladen`-Horcher entfernen → §7 bleibt GRÜN, der Horcher greift
    im Normalfall gar nicht (`start()` läuft ohnehin nach dem Laden)
  · den Merk-Schlüssel pro Seitenladung neu würfeln → §7 wird rot

Nur der dritte ist ein Gegenbeweis. Die ersten beiden sahen wie einer aus.


NACHTRAG ZU E210 — WAS DAS TELEFON NOCH GEÄNDERT HAT
--------------------------------------------------------------------------------

Am Rechner stand das Band; am Telefon fielen vier Dinge auf, die keine
Prüfung gemeldet hätte.

ERSTENS: Kacheln und Zeilen in derselben Reihe. Die grossen Einträge sind
quer (Zeichen links, Name rechts), die kleinen hoch (Name unter dem Zeichen)
— nebeneinander sah das aus wie zwei verschiedene Menüs übereinander. Dazu
„Schlagwör/ter" und „Umsetzun/gsstand" mitten im Wort gebrochen und rechts
eine halbe Bildschirmbreite leer: 321 px für sieben Einträge.

Am Telefon sind es jetzt zweispaltige ZEILEN, gruppiert in Kästen mit runden
Ecken — die Form aus Redurs Bild. Gleiche Form für jeden Knopf, 185 px für
den Namen (kein Bruch mehr), und aus vier Reihen werden zwei. Am Rechner
bleibt es bei Kacheln: dort ist die Breite da, und Kacheln sind das, was man
aus Textprogrammen kennt.

ZWEITENS: die Namen fluchteten nicht. Hier stand zuerst eine FALSCHE
Begründung im CSS — „der Span um das Zeichen hat keine feste Breite". Der
Gegenbeweis blieb grün: die 15 px kamen von der Kachelform, in der die Namen
zentriert unter verschieden breiten Zeichen standen. Die Zeilenform hat es
gelöst, nicht die Regel. Die Regel bleibt trotzdem, aber als das, was sie
ist: eine Zusicherung für später.

Und der Prüfpunkt dazu war blind. Er mass nur den offenen Reiter; ein
absichtlich zu breites Zeichen am Knopf „Karteikarten" liess ihn grün, weil
dieser Knopf im Reiter „Einfügen" nicht vorkommt. Über alle sechs Reiter
gemessen fand er sofort 1 px Streuung im Reiter „Start" — die
Auszeichnungsknöpfe tragen ein Textzeichen (`.mb-glyph`), und die Regel griff
nur bei `[data-sym]`.

DRITTENS: der gewählte Reiter stand ausserhalb. Vier von sechs passen auf
390 px; wählt man „Elektro", zeigte das Band dessen Knöpfe, während in der
Zeile „Zeichnen" wie der aktive aussah. `scrollIntoView` löst es — aber erst
NACH `symbole.fuelle`: davor sind die Zeichen noch nicht da, die Knöpfe
schmaler, und gemessen blieb der Reiter bei x=379 von 390 stehen.

VIERTENS: danach lag er unter dem klebenden Klapp-Knopf. `scroll-padding-
inline-end` hilft, aber die Zahl ist eine Rechnung: der Knopf klebt an der
PADDING-Kante (`right:0` in einem Kasten mit `padding-inline`) und ragt um
genau dieses Padding hinein. Mit nur der Knopfbreite blieben 6 px Überlappung
— gemessen, nicht geschätzt.


NACHTRAG ZU E210 — WORAN MAN EINE SEITE ERKENNT
--------------------------------------------------------------------------------

Der Test hiess zuerst: „`#page` trägt die Klasse `produkt-welt`, also ist es
eine Sonderansicht". Auf einem Bildschirmfoto der Bibliothek stand das Band
trotzdem offen — mit einem Reiter „Einfügen", der nichts einzufügen hatte.

Nachgemessen über vier Ansichten:

    Start (Heute)   produkt-welt lernwelt        kein #title
    echte Seite     (keine Klasse)               #title, Symbol, Werkzeuge
    Bibliothek      wide                         kein #title
    Arbeitswelt     wide produkt-welt arbeits…   kein #title

Die Bibliothek trägt `wide` und nicht `produkt-welt`. Der Test war also nicht
falsch für „Heute" — er war unvollständig, und das fiel nur auf, weil jemand
hingesehen hat.

`#title` ist das einzige, das genau bei der echten Seite steht, und es ist
auch der richtige BEGRIFF: eine Seite hat einen Titel, in den man schreibt,
eine Übersicht nicht. Nicht die Blöcke zählen — eine frisch angelegte Seite
hat null davon und ist trotzdem eine Seite.

Die Prüfung fragt jetzt jede Ansicht einzeln, und die Bibliothek ist
ausdrücklich dabei: sie ist die, die den ersten Test überlistet hat.


================================================================================
E211 — Links die Bereiche, oben die Werkzeuge
================================================================================

Redur, mit einem Bildschirmfoto der Seitenleiste: „hier links habe ich sehr
viele Bereiche, und du kannst Agenten, Besprechungen, Kürzlich verwendet auch
oben bei den Menüs sein — und dort sollten nicht die Bereiche sein, alle
Bereiche sollten links sein, und dort oben kommt nur, was man nicht so viel
braucht: Agenten, Werkzeuge, Formelheft usw."

Daraus wird eine Regel, die für beide Seiten gilt und die es vorher nicht gab:

    LINKS   die BEREICHE — wohin man geht
    OBEN    die WERKZEUGE — womit man arbeitet

E210 hatte den ersten Schritt gemacht (die sieben Werkzeuge). Hier folgen
drei weitere Abschnitte: Agenten, Besprechungen, Kürzlich verwendet.


BEI ZWEIEN WAR ES SOGAR EINE DOPPELUNG
--------------------------------------------------------------------------------

Die Seitenleiste hat OBEN drei Reiter: `start`, `chat`, `bespr`. „chat" zeigt
die Agentenliste, „bespr" die Besprechungen — beide vollständig. Der
Abschnitt im Seitenbaum darunter zeigte dieselben Dinge ein zweites Mal, nur
gekürzt auf sechs beziehungsweise drei Einträge.

Die Knöpfe im Band schalten deshalb auf den Reiter, der ohnehin da ist
(`App.reiterWechseln('chat')`). Sie bauen keine dritte Ansicht — es gab schon
zwei zu viel.

„Kürzlich verwendet" führt in die Bibliothek: dort ist es der erste Filter,
und man sieht Vorschauen statt einer Namensliste.


WAS DIE SEITENLEISTE JETZT ZEIGT
--------------------------------------------------------------------------------

Vorher acht Abschnitte, jetzt vier — und von denen sind zwei meist leer:

    Werkzeuge            → Menüband (E210)
    Agenten              → Menüband, Reiter `chat`
    Besprechungen        → Menüband, Reiter `bespr`
    Kürzlich verwendet   → Menüband, Bibliothek
    Favoriten            bleibt
    Bereiche             bleibt
    Privat               bleibt
    Meine Apps           bleibt

Nichts ist gelöscht. Jeder der vier lässt sich über „Abschnitte anpassen"
wieder einschalten, und die Seitenleiste zeichnet ihn dann aus DEMSELBEN
Register wie das Band.


WAS DER PRÜFLAUF DABEI GELERNT HAT
--------------------------------------------------------------------------------

Ein Punkt verglich die zurückgeholten Werkzeug-Zeilen gegen die feste Zahl
sieben. Mit den drei neuen Einträgen wurde er rot — obwohl genau das Richtige
passierte: die Seitenleiste zeichnet ALLES, was im Band unter „Werkzeuge"
steht, weil beide aus derselben Quelle lesen.

Er fragt jetzt das Register statt einer Zahl. Eine feste Zahl in einer
Prüfung, die eine Liste bewacht, schlägt bei jedem neuen Eintrag an und sagt
dabei nichts über den Fehler, den sie finden sollte.


================================================================================
E212 — Zeichnen im Menüband: eine Frage, drei Fehler
================================================================================

L64 stand offen: der Reiter „Zeichnen" hatte Blatt, Whiteboard und Schaltplan
— also, WOMIT man anfängt, nicht, WOMIT man zeichnet. Stift, Marker, Linie,
Pfeil, Radierer standen nur an der Leiste unter der jeweiligen Fläche.

Der Grund dafür war kein Versäumnis, sondern eine echte Frage:

    Ein Knopf oben muss wissen, AUF WELCHE Fläche er wirkt.

Auf einer Seite können drei Blätter liegen. Ohne Antwort darauf ist der Knopf
entweder tot oder er trifft die falsche Fläche, und beides ist schlimmer als
kein Knopf.


DIE ANTWORT: DIE ZULETZT BERÜHRTE
--------------------------------------------------------------------------------

    src/kern/helfer/zeichenziel.ts

    melde(steuerung, name)   eine Fläche gibt es jetzt
    beruehrt(steuerung)      jemand hat sie angefasst — sie ist gemeint
    aktive() / da()          welche ist gemeint, gibt es überhaupt eine
    setze(werkzeug)          von aussen an die Fläche
    uebernehme(st., wz)      die Leiste hat selbst geschaltet — nur merken
    jetzt() / werkzeugVon()  was ist an, an der gemeinten / an dieser
    horche(fn) / vergiss(fn) Bescheid bei Änderung

Warum im Kern: `bereiche/pdf/` und `bereiche/bloecke/arten/blatt` brauchen
beide dasselbe, und ein Bereich darf nicht aus einem anderen importieren
(CLAUDE.md §5, Regel 1).

Warum „Ziel" und nicht „Fläche": es benennt die FRAGE, nicht die Sache — und
`bereiche/bloecke/arten/zeichenflaeche.ts` gibt es schon.

Was NICHT dorthin gewandert ist: kein Strich, keine Farbe, keine Marke. Das
bleibt in `bereiche/pdf/marken.ts`, wo es geprüft ist. Die Datei hält einen
Zeiger und ein Wort. Wäre die Zeichenlogik an zwei Stellen, liefe die zweite
irgendwann von der ersten weg.

`setze` und `uebernehme` sind zwei Richtungen, nicht eine mit Schalter. Wer
bei `uebernehme` nochmal `setzeWerkzeug` riefe, löschte die Auswahl — das tut
sie bei jedem Wechsel — bei einem Wechsel, den es gar nicht gab.


DREI FEHLER, ALLE DREI AUF DEM BILDSCHIRMFOTO (§55.1)
--------------------------------------------------------------------------------

Die Knöpfe wirkten beim ersten Versuch. Was danach kam, fand kein Prüflauf,
sondern das Hinsehen:

1. ZWEI ANSICHTEN, EINE HINTERHER. Die Leiste am Blatt zeigte „Schreiben"
   markiert, während oben „Stift" gedrückt war und die Fläche längst
   `data-tool="stift"` trug. Gemessen: `[data-wz].on` = schreiben,
   `.mb-knopf.ist-an` = Stift. Die Leiste markiert sich beim eigenen Klick
   selbst und erfuhr von fremden Klicks nichts.

   Gelöst mit `Zeichenziel.horche` in `marken.ts`, und ausdrücklich über
   `werkzeugVon(controls)` statt `jetzt()`: gemeint ist DIESE Fläche. Bei
   zwei Blättern auf einer Seite zeigte `jetzt()` beiden Leisten das
   Werkzeug der zuletzt berührten.

2. DAS BAND MARKIERTE NICHTS. `BandEintrag` hat jetzt ein `an?: () => boolean`,
   der Zeichner setzt daraus `.ist-an` UND `aria-pressed` — nicht nur Farbe,
   §38.

3. NEUNZEHN KNÖPFE IN ZWEI ZEILEN. Sobald eine Fläche da ist, werden Blatt,
   Whiteboard und Schaltplan zu kleinen Kacheln (`gross: flaecheGross()`).


UND EIN VIERTER, DEN ERST DER PRÜFLAUF FAND
--------------------------------------------------------------------------------

Niemand meldet eine Fläche ab. Gemessen wuchs die Liste bei jedem
Seitenwechsel um eins, und `zuletzt` blieb auf der ERSTEN stehen — nach fünf
Wechseln hätte der Stift auf ein Blatt gewirkt, das seit vier Wechseln nicht
mehr auf dem Bildschirm steht. Sichtbar wäre nichts gewesen: der Knopf hätte
einfach nichts getan.

Statt einen Abmelde-Aufruf an jede Stelle zu setzen, die eine Seite neu
zeichnet — und die nächste zu vergessen — fragt es das Element selbst:
`isConnected`. Das ist die einzige Quelle, die nicht vergessen werden kann.

DAS MESSGERÄT HAT DABEI EINMAL SEIN EIGENES ERGEBNIS ERZEUGT. Der erste
Entwurf räumte nur weg, was schon einmal in der Seite hing (`gesehen`), und
`gesehen` wurde nur beim Nachfragen gesetzt. Meine Handmessung fragte nach
jedem Seitenwechsel — und setzte damit selbst, was sie zu prüfen glaubte.
Sie zeigte 1. test247 §11 ohne diese Zwischenfrage zeigte 3.

Es gelten deshalb drei Merkmale, von denen jedes für sich genügt: sie hing
schon einmal drin, ODER eine andere Fläche hängt gerade drin (dann ist der
Aufbau fertig), ODER sie ist nicht die zuletzt gemeldete.


WAS SICH BEIM HINSEHEN NOCH ZEIGTE
--------------------------------------------------------------------------------

BUCHSTABEN, DIE MITTEN IM WORT BRECHEN. „Whiteboar/d", „Fachzeich/en". Über
alle sechs Reiter gemessen: 22 von 113 Namen. `hyphens:auto` steht in der
CSS und tut nichts — `lang="de"` ist gesetzt, die Trennmuster fehlen.

Vier Breiten-Regeln nebeneinander gemessen:

    fest 68 px       22/113 Brüche   Gruppensumme 4796 px
    auto 68–88        9/113          5209 px
    auto 68–96        4/113          5317 px
    auto 68–104       1/113          5407 px
    auto 68–112       0/113          5463 px
    auto 68–124       0/113          5491 px
    fest 80 px       12/113          5600 px

`auto 68–112` ist die erste Zeile ohne einen einzigen Bruch — und immer noch
schmaler als ein festes 80-px-Raster, das zwölf Brüche behielte. Weiter zu
gehen bringt nichts: 124 px kostet Breite und findet keinen Namen mehr, der
davon lebt. Ein festes Raster macht jeden Knopf so breit wie den breitesten
Bedarf; ein Mindestmass lässt nur die wenigen wachsen, die es brauchen — von
113 Namen sind das sechs.

Die Unruhe, die 2026-08 zum festen Raster führte, kam vom SCHMALEN Ende — ein
58 px schmales „Text" neben einem 106 px breiten Nachbarn. `min-width:68px`
nimmt genau diese Hälfte weg.

Dabei ist mir ein Fehler unterlaufen, der es wert ist, festgehalten zu
werden: gemessen wurde mit `:not(.ist-gross)`, eingebaut ohne. Die grosse
Kachel, deren Name NEBEN dem Zeichen steht, bekam damit die 96-px-Grenze ab
— aus vier Brüchen wurden neun. Wer eine Regel misst und eine andere einbaut,
misst nichts.

DIE RANDLEISTE LAG ÜBER DEM BAND. `#rand-toc` stand auf `top:50%` von `main`,
und `main` enthält seit E210 auch das Menüband. Bei 39 Überschriften lief die
Leiste von y=-3 bis y=1175 in einem 980 px hohen Fenster: oben im Band, unten
unter dem Bildrand. Bei 53 Überschriften begann sie bei y=-213.

Das Menüband schreibt jetzt seine eigene Unterkante als `--inhalt-oben` an
`main` — es ist der Einzige, der sie kennt (eine oder zwei Zeilen, offen oder
zu, Telefon oder Rechner). Die Randleiste zentriert darauf und bekommt dazu
ein `max-height` mit `overflow-y:auto`: sichtbar gerollt statt still
abgeschnitten.


PRÜFUNG
--------------------------------------------------------------------------------

UND EINE PRÜFUNG FÜR DAS, WAS NUR DAS AUGE SAH
--------------------------------------------------------------------------------

Die 22 Brüche fand kein Punkt in test247, obwohl elf davon handelten: die
Knöpfe waren da, hatten Zeichen, Namen und `aria-label` — nur lesen liess
sich die Beschriftung nicht. §12 prüft es jetzt über alle sechs Reiter,
Zeichen für Zeichen: zu welcher Zeile gehört es, und endet eine Zeile auf
einem Buchstaben, während die nächste mit einem beginnt?

Nicht `scrollWidth > clientWidth` — das misst im Flex-Kasten immer gleich,
weil der Text GESTAUCHT wird statt überzustehen. Genau die Falle aus
CLAUDE.md §55.2 über die Tabellenzelle.

Gegenprobe: `max-width` zurück auf 68 px, und der Punkt meldet 22 von 113
mit Namen.


test247 §11, neun Punkte, jeder einzeln als rot-fähig belegt:

    1 ohne Fläche keine Werkzeuge   `zeigen: () => true`
    2 mit Blatt erscheinen sie      `flaecheDa` immer falsch
    3 Stift stellt die Fläche um    `setzeWerkzeug` entfernt
    4 das Band zeigt es an          `.ist-an` entfernt
    5 die Leiste zeigt dasselbe     `horche(markiere)` entfernt
    6 Leiste → Band                 `uebernehme` entfernt
    7 keine toten Flächen           `aufraeumen` ausgeschaltet
    8 Randleiste im Fenster         `max-height` entfernt
    9 Randleiste unter dem Band     `--inhalt-oben` entfernt

Punkt 3 misst am `data-tool` der Fläche selbst, nicht an einer Variablen. Die
Gegenprobe zeigt, warum: mit ausgebautem `setzeWerkzeug` sagten Band, Kern
UND Leiste übereinstimmend „stift", während die Fläche auf „schreiben" stand.
Drei Ansichten, alle einig, alle falsch.

Zwei Punkte waren beim ersten Schreiben wertlos und wurden ersetzt:

  · Die Randleisten-Prüfung legte sich vierzehn `h1` mit `Store.addBlock`
    an. Gemessen ging `childrenOf` dabei von 1 auf 1 — `addBlock` hängt den
    Block nicht in die `content`-Liste. Es entstand keine Leiste, und der
    Punkt meldete „keine gefunden" statt eines Masses.
  · Danach nahm sie mit `find` die erstbeste Seite mit drei Überschriften.
    Ob das eine mit vier oder eine mit 39 war, entschied die Reihenfolge im
    Zwischenspeicher — der Punkt war einmal grün und einmal rot, ohne dass
    sich am Programm etwas geändert hätte. Jetzt nimmt sie die Seite mit den
    MEISTEN, also den schwersten Fall.

Grün: test247 68/68, test34 77/77, test33 96/96, test192 25, test173 11,
test217 27/27, test222 50/50, test215 44/44, test128 50, test202 84,
test105 55, test109 20.


================================================================================
E213 — Farbe und Strichstärke gehören ins Menüband
================================================================================

Der Reiter „Zeichnen" hatte nach E212 elf Werkzeuge, aber keine Farbe. In
Word und in jedem Zeichenprogramm steht der Farbtopf neben dem Stift, weil
beides zusammen eine Entscheidung ist: WOMIT und IN WELCHER FARBE. Beides nur
in der Leiste unter der Fläche zu haben, während oben ein Reiter „Zeichnen"
steht, war eine halbe Antwort.

    Fläche · Werkzeug · Zurücknehmen · Aufnehmen · FARBE · STRICH


WOHER DIE WERTE KOMMEN
--------------------------------------------------------------------------------

Aus `Marken.FARBEN` und `Marken.BREITEN` — denselben Listen, aus denen die
Leiste unter der Fläche ihre Knöpfe baut. Eine zweite Liste im Register wäre
ein zweiter Katalog (CLAUDE.md §8), und sie liefe irgendwann von der ersten
weg: jemand fügt eine Farbe hinzu, und die Hälfte der App kennt sie nicht.

Deutsch heissen sie über eine kleine Zuordnung (`FARBWORT`), und ein
unbekannter Wert behält seinen Code. Damit bricht das Band nicht, wenn die
Palette wächst — es zeigt dann eben „#a3c4f0" statt „Hellblau", und das ist
besser als ein fehlender Knopf.


DER KERN MERKT SICH JETZT DREI DINGE STATT EINEM
--------------------------------------------------------------------------------

`zeichenziel.ts` hielt `werkzeug`. Farbe und Stärke gingen nur durch. Das
hätte gereicht, um zu WIRKEN, aber nicht, um zu ZEIGEN: das Band hätte fünf
Farbknöpfe gehabt und keinen markiert, während die Leiste sehr wohl einen
markiert — derselbe Fehler, der bei E212 auf dem Bildschirmfoto stand.

Also `farbe` und `dicke` neben `werkzeug`, mit denselben zwei Richtungen:
`setzeFarbe` (von aussen an die Fläche) und `uebernehmeFarbe` (die Leiste hat
selbst geschaltet, nur merken). Die WERTE stehen weiterhin nicht im Kern.


EINE PROBE STATT EINES ZEICHENS
--------------------------------------------------------------------------------

Ein Symbolname kann keine Farbe tragen und keine Dicke. `BandEintrag` hat
deshalb ein `probe?: { farbe?, dicke? }`, und der Zeichner malt daraus einen
Tupfer oder einen Balken. Der NAME steht trotzdem darunter — „Rot", „Blau",
„Dünn": wer Farben nicht unterscheidet, muss die Wahl trotzdem treffen können
(§38).


DIE DREI STÄRKEN SAHEN GLEICH AUS
--------------------------------------------------------------------------------

Die Leiste zeichnet ihre Proben in der wahren Stärke, mit `Math.max(2, wert)`
als Boden. Aus 1,2 / 2,4 / 5 px wurden damit gemessene 2,0 / 2,5 / 6,5 — der
Boden zog den dünnsten hoch, und zwischen „Dünn" und „Mittel" blieb ein
halber Pixel. Auf dem dreifach vergrösserten Bild waren sie kaum
auseinanderzuhalten; bei 100 % gar nicht.

Den Boden zu entfernen reichte nicht: 1,2 gegen 2,4 px sind gemessen 6,4
gegen 8,0 Bildpunkte Tinte, ein Viertel Unterschied.

Jetzt gilt der doppelte Massstab, im Band und in der Leiste. Gemessen:
2,39 / 4,80 / 10,00 px — genau 1 : 2 : 4. Das VERHÄLTNIS stimmt auf den
Punkt, die absolute Grösse ist nicht mehr wörtlich. Eine Probe ist eine
Probe und kein Lineal; wer den echten Strich sehen will, zieht ihn.


WAS DIE GEGENPROBEN GELEHRT HABEN
--------------------------------------------------------------------------------

DREI PUNKTE WAREN WERTLOS, UND ZWAR AUF DREI VERSCHIEDENE ARTEN.

1. „Farbe und Stärke aus dem Band kommen an der Leiste an" blieb GRÜN, als
   `steuerung.setzeFarbe` ausgebaut wurde. Er verglich zwei ANZEIGEN, und
   die waren sich einig — während die Fläche schwarz gezeichnet hätte.

   Beim Werkzeug gibt es `data-tool` am SVG. Für Farbe und Stärke gibt es
   nichts dergleichen: `setzeFarbe` setzt eine Variable, die von aussen
   niemand sehen kann. Die einzige ehrliche Frage ist deshalb die, auf die
   es ankommt — MALT der Stift blau? Der Prüflauf zieht jetzt einen Strich
   mit der Maus und liest sein `stroke`. Mit ausgebautem `setzeFarbe` kommt
   `#e0a419` heraus statt `#2f7ed8`.

2. Derselbe Punkt verlangte zuerst `stroke-width === 5`. In der Handmessung
   stand da 5, im Prüflauf 20: die Fläche rechnet die Stärke auf ihre
   Zoomstufe um, und die hängt von der Fensterbreite ab. Eine feste Zahl
   prüft damit das Fenster. Jetzt wird das VERHÄLTNIS geprüft — dick zu
   dünn ist 5 : 1,2, egal wie gross das Blatt gezeichnet wird.

3. Die Gegenprobe „die Leiste meldet ihre Vorgaben nicht" liess ALLE Punkte
   grün. Sie prüfen erst, nachdem geklickt wurde, und danach stimmt es
   wieder. Der ANFANGSZUSTAND — Leiste markiert Schwarz, Band markiert
   nichts — hatte niemanden. Dafür gibt es jetzt einen eigenen Punkt.

UND ZWEI ALTE PUNKTE WURDEN ZU RECHT ROT. Sie verlangten „genau ein Knopf im
Band ist markiert". Das stimmte, solange das Werkzeug das Einzige war, was
markiert werden konnte. Gemeint war immer „genau EIN WERKZEUG"; jetzt steht
es auch so da.


PRÜFUNG
--------------------------------------------------------------------------------

test247 §11 wuchs von neun auf vierzehn Punkte. Die fünf neuen, jeder
einzeln als rot-fähig belegt:

    Farben kommen aus `Marken.FARBEN`   feste Dreierliste eingesetzt
    Tupfer UND Name (§38)               `name: ''`
    Proben wachsen anderthalbfach       alter Massstab `max(2, dicke)`
    Der Strich ist wirklich blau        `steuerung.setzeFarbe` entfernt
    Dick : dünn ist rund 4 : 1          `steuerung.setzeStrich` entfernt
    Band markiert die gewählte Farbe    `an:` gibt immer false
    Einigkeit vor dem ersten Klick      `uebernehmeFarbe` bei Anmeldung weg

Grün: test247 76/76, test87 129, test34 77/77, test33 96/96, test128 50,
test192 25, test173 11, test217 27/27, test222 50/50, test215 44/44,
test105 55, test109 20.


================================================================================
E214 — „PDF einlesen" im Band: der Wähler gehört in den Bereich (L62)
================================================================================

L62 stand offen, und der Grund dafür war richtig: `PdfEinlesen.alsSeiten`
braucht eine `File`, und einen Dateiwähler in `register/menueband.ts` zu
bauen wäre neues Verhalten in einem KATALOG. Ein Katalog führt auf, was es
gibt; er tut nichts (E210).

Die Antwort ist dieselbe wie bei den Zeichenwerkzeugen (E212): der Bereich,
dem die Sache gehört, bekommt den Einstieg, und das Band führt ihn auf.

    PdfEinlesen.waehlen(elternId?)   Wähler öffnen, dann `alsSeiten` rufen

Für einen Berufsschüler mit Vorlesungs-PDFs ist das Band genau die Stelle,
an der er zuerst sucht. Der alte Weg — eine PDF auf die Seite ziehen —
bleibt daneben bestehen.

Ohne offene Seite passiert nichts ausser einem Satz: `alsSeiten` legt die
Seitenblöcke unter einem Elternblock an, und ohne den wüsste niemand wohin.
Ein Knopf, der still nichts tut, ist schlimmer als einer, der sagt warum.


EIN ZEICHEN, DAS SEINEN EIGENEN NAMEN ZEIGT
--------------------------------------------------------------------------------

Der erste Entwurf schrieb `zeichen: 'file'`. Das Symbol gibt es nicht — der
Zeichner fällt dann auf das Textzeichen zurück und malt das WORT „file" in
einen 19-px-Kasten.

test247 §2 liess das durch. Sie fragt „hat der Knopf ein Zeichen, und hat es
Fläche?", und beides stimmte. Ein Wort ist ein Zeichen mit Fläche.

Gemessen sind von 93 Textzeichen im Band alle ein oder zwei Zeichen lang
(`H₁`, `•`, `1.`, `T`, Emoji), das längste ist `</>` mit drei — und keines
besteht aus Kleinbuchstaben. Genau das ist die Form eines Symbolnamens, der
nicht gefunden wurde, und danach fragt §2 jetzt zusätzlich. Gegenprobe:
`zeichen: 'file'` zurückgesetzt, alter Punkt bleibt grün, neuer wird rot.

Der Knopf trägt jetzt `upload`.


ZWEI GEGENPROBEN, DIE MEINE EIGENE MESSUNG WIDERLEGT HABEN
--------------------------------------------------------------------------------

§13 fragt, ob der Knopf wirklich einen Wähler öffnet — §4 prüft nur, ob die
Funktion dahinter EXISTIERT, und sie kann existieren und trotzdem nichts
öffnen.

Der erste Entwurf las `accept` über
`document.querySelector('input[type=file][accept*=pdf]')`. Das ist im Kreis
gemessen: gesucht wurde nach genau der Eigenschaft, die geprüft werden
sollte. In der Gegenprobe „der `input` hängt nicht im Dokument" wurde der
Punkt rot, obwohl `accept` völlig in Ordnung war — er meldete einen Fehler,
den es nicht gab, an einer Stelle, an der er nichts zu suchen hatte.

Jetzt wird `chooser.element()` gefragt: der Wähler, den der Browser wirklich
geöffnet hat, unabhängig davon, wo er hängt. Danach reagiert jeder Punkt nur
noch auf seine eigene Ursache:

    input nicht im Dokument   beide Punkte bleiben grün (Chromium öffnet ihn
                              trotzdem — der `appendChild` ist Vorsorge für
                              andere Browser, und dass er DORT nötig ist,
                              steht hier nicht als Messung, weil es keine ist)
    accept auf `*/*`          nur der accept-Punkt wird rot
    `input.click()` entfernt  beide werden rot, und das ist richtig: ohne
                              Wähler gibt es auch kein `accept`

Grün: test247 79/79, test87 129, test34 77/77, test33 96/96, test128 50,
test192 25, test173 11, test217 27/27, test222 50/50, test215 44/44,
test105 55, test109 20.


================================================================================
E215 — „Im Text": zwei Slash-Aktionen ohne Schreibzeiger (L63)
================================================================================

`Register.bloecke` führt elf Einträge mit `aktion` — Slash-BEFEHLE statt
Blockarten. Sie brauchen `Blocks.slashAktion(ct, block, was)`, also das Feld,
in dem gerade getippt wird, und den Block darunter. Ein Knopf im Menüband hat
weder das eine noch das andere.

Drei davon fügen aber etwas EIN, statt an einem bestimmten Block zu drehen.
Für sie hängt `Blocks.aktionAmEnde(was)` einen leeren Textblock ans Ende der
Seite und macht dort weiter — ab da ist es derselbe Weg wie beim Tippen.

Die anderen acht bleiben, wo sie sind. „Umwandeln in", „Farbe", „Duplizieren",
„Verschieben", „Löschen", „Kommentar" handeln von EINEM bestimmten Block; ohne
Schreibzeiger gibt es keinen, und einer, der sich den letzten greift, würde
irgendwann den falschen erwischen. Ein Knopf, der manchmal das Richtige trifft,
ist schlimmer als keiner.


AUS DREI WURDEN ZWEI, UND DAS WAR EINE MESSUNG
--------------------------------------------------------------------------------

Der erste Entwurf nahm `mention`, `date` und `emoji`. Nachgemessen:

    mention  schreibt „@"  →  Menü geht auf     ✓
    date     schreibt „@"  →  DASSELBE Menü     ✓ aber doppelt
    emoji    schreibt „:"  →  nichts            ✗

`date` ist kein Fehler im Programm: dieses Menü führt Seiten, Personen UND
Datumsangaben („heute", „morgen", „Datum wählen …"). Aber zwei Kacheln
nebeneinander, die dasselbe Menü aufmachen, und die eine heisst „Datum",
während die Überschrift darin „Seiten" lautet — das führt in die Irre. Es
bleibt bei einem Einstieg, und sein Hinweis nennt alle drei: „Seite, Person
oder Datum einfügen".


DER DOPPELPUNKT, DER NICHTS TUT
--------------------------------------------------------------------------------

`emoji` schrieb „:" und verliess sich darauf, dass das Emoji-Menü daran
hängt. Tut es — aber erst ab

    /(?:^|\s):([a-zäöü]{2,})$/

also MIT mindestens zwei Buchstaben dahinter. Das ist beim Tippen genau
richtig: sonst klappte im Satz bei jedem Doppelpunkt etwas auf. Beim
Knopfdruck steht am Ende aber nur der Doppelpunkt, und es passierte nichts.

DASSELBE GILT FÜR DEN SLASH-BEFEHL. `/emoji` geht denselben Weg und
hinterlässt denselben einsamen Doppelpunkt — der Fehler ist älter als das
Menüband und wurde erst hier sichtbar, weil ihn zum ersten Mal jemand
gemessen hat.

Die volle Auswahl mit Suchfeld gibt es längst: `Erwaehnungen.emojiWaehler`.
Sie liegt in einem ANDEREN Bereich, und ein Bereich darf keinen anderen
aufrufen (CLAUDE.md §5, Regel 1). Der dafür vorgesehene Weg ist der
Ereignisbus, und genau der wird benutzt:

    Editor         Ereignisse.melde('emojiWaehlen', { blockId })
    Erwähnungen    Ereignisse.horche('emojiWaehlen', …) → emojiWaehler(…)

Hört niemand zu, bleibt es beim Doppelpunkt — dann ist es so gut wie vorher
und nicht schlechter.

ERST ZEICHNEN, DANN RUFEN. Der erste Versuch meldete sofort, und es ging kein
einziges Menü auf, obwohl der Zuhörer lief: der Block war gerade erst im
Speicher entstanden und stand auf der Seite noch nicht. Wer daran ein Menü
aufhängen will, findet nichts. Jetzt zeichnet der Rufer die Seite neu, und
der Zuhörer wartet zusätzlich 30 ms — dieselbe Spanne, mit der der Editor
überall auf ein frisches Feld wartet.


DREI ALTE PRÜFPUNKTE HABEN ZU RECHT ANGESCHLAGEN
--------------------------------------------------------------------------------

Und alle drei aus demselben Grund: sie hatten eine Annahme eingebaut, die
sich rechtmässig geändert hat.

  · „Einfügen zeigt genau die Blockarten aus dem Blockregister" — 67 gegen
    69. Die zwei neuen sind keine Blockarten. Gefragt wird jetzt nur nach
    denen mit `blk-`.
  · „Aufgeklappt stehen alle 67 Blockarten da" — eine feste Zahl in einem
    Punkt, der eine Liste bewacht. Er fragt jetzt das Register.
  · „Genau ein Knopf im Band ist markiert" (E213) — gemeint war „genau ein
    WERKZEUG".

Eine Prüfung, die bei jedem neuen Eintrag anschlägt, sagt nichts über den
Fehler, den sie finden sollte.

Und ein neuer Punkt war von Anfang an blind: er verglich die Überschrift
gegen „IM TEXT". Auf dem Bildschirm steht das so, aber die Grossbuchstaben
macht `text-transform:uppercase` — im `textContent` steht „Im Text". Der
Punkt war IMMER falsch und wäre nie aufgefallen, wäre das Feld nicht in
einer Gegenprobe mit ausgegeben worden.


PRÜFUNG
--------------------------------------------------------------------------------

test247 §14, sechs Punkte, jeder einzeln als rot-fähig belegt:

    Gruppe führt genau `Blocks.AM_ENDE`   Register mit eigener Liste
    Sie trägt ihre Überschrift            `mb-gruppe-titel` entfernt
    „Erwähnung" hängt an und öffnet       Auslösezeichen `mention` geleert
    „Emoji" öffnet die volle Auswahl      Bus-Aufruf entfernt / Zuhörer weg
    Kein einsamer Doppelpunkt             dieselben zwei
    Angeklicktes Emoji steht im Block     dieselben zwei

Dazu die beiden berichtigten: eine Blockart bekommt im Band einen anderen
Namen (67 gegen 67, und der Punkt merkt es trotzdem), und der Zeichner lässt
den ersten Eintrag jeder Gruppe weg (61 gezeichnet, 69 im Register).

Grün: test247 85/85, test87 129, test34 77/77, test33 96/96, test128 50,
test192 25, test173 11, test217 27/27, test222 50/50, test215 44/44,
test105 55, test109 20, test119 19.


================================================================================
E216 — Eine Seite ohne Text ist nicht leer (L61, Teil 1)
================================================================================

Die Miniatur einer Seite (E205) baut sich aus dem TEXT ihrer Blöcke. Wer eine
Seite aus einem Schaltplan, drei PDF-Seiten und einem A4-Blatt hat, bekam
deshalb eine vollkommen weisse Karte.

Gemessen, an einer eigens gebauten Seite mit sechs solchen Blöcken:

    Kinder            6
    davon mit Text    0
    umfang()          6      → die Karte fiel NICHT heraus
    miniatur()        0 Zeichen

Das ist der schlimmere von zwei möglichen Fehlern. Fiele die Seite ganz
heraus, würde man es merken; so stand sie da und behauptete, leer zu sein.
Und es trifft ausgerechnet die Seiten, die man am Bild am schnellsten
wiedererkennt.

Jetzt bekommt jeder Block, der seinen Inhalt nicht im `text` trägt, einen
Streifen mit Zeichen und Namen: „📄 A4-Blatt", „⚡ Schaltplan", „🖼 Bild",
„⊞ Einfache Tabelle".


DER NAME KOMMT AUS `Register.bloecke` — UND WAS DORT NICHT STEHT
--------------------------------------------------------------------------------

Kein zweiter Katalog (§8). `pdfseite` und `zeichenflaeche` stehen nicht im
Blockregister, weil sie nicht einfügbar sind — sie entstehen beim Einlesen
einer PDF beziehungsweise als Teil eines Blattes. Sie haben deshalb NIRGENDS
einen deutschen Namen.

Einen hier zu erfinden hiesse, ihn an einer zweiten Stelle zu pflegen. Sie ins
Blockregister aufzunehmen hiesse, sie im Slash-Menü und im Reiter „Einfügen"
anzubieten — der Editor liest `Register.bloecke.alle()` als `TYPEN` und sucht
darin. Eine leere PDF-Seite einzufügen ergibt keinen Sinn.

Also bekommen sie einen leeren Streifen. Er sagt „hier steht etwas" statt gar
nichts, und er verspricht nichts, was er nicht weiss. Der Rest steht in
LUECKEN.md.


WAS DAS NICHT IST
--------------------------------------------------------------------------------

Kein Vorschaubild. Ein echtes Abbild des Schaltplans wäre eine
Speicheränderung mit eigenem Plan und eigenem Prüflauf (§9, §30) — L61 bleibt
dafür offen und ist jetzt genauer beschrieben: was fehlt, ist das BILD, nicht
mehr die Sichtbarkeit.


PRÜFUNG
--------------------------------------------------------------------------------

test33, drei Punkte. Sie fragen den KERN und nicht die Karte: hat die Karte
einen Rückfall — bei den Heften ist es `inhaltsListe`, und genau daran ist
eine frühere Gegenprobe schon einmal gescheitert —, wäre ein Punkt an der
Karte blind.

    Seite ohne Text ist wirklich ohne Text   (sonst prüft der Rest nichts)
    Ihre Miniatur bleibt nicht leer          Gegenprobe: Streifen abgeschaltet
                                             → wieder 0 Zeichen, 0 Streifen
    Die Namen stammen aus dem Register       Gegenprobe: `eines()` gibt null
                                             → 6 Streifen, 0 Namen

Die erste Gegenprobe stellt den alten Zustand Zeichen für Zeichen wieder her.

Grün: test33 99/99.


================================================================================
E217 — Zwei rote Punkte, die niemand gesehen hat
================================================================================

Nach E216 ein vollständiger `npm run pruefen` über alle 213 Suiten. Acht
waren rot. Fünf davon waren Folgen von E211 und eine eine echte Folge des
Menübands — die stehen in den Commits davor.

ZWEI WAREN ALT.

    test40   „Seitenleiste ist 260 px breit"   → seit E201 sind es 240
    test206  „Sie hat neun Reiter"             → seit E164 sind es vier

Beide sind nachgemessen auch auf dem Stand VOR dem Menüband rot. Sie standen
also seit Wochen so da, und niemand hat es bemerkt.

Der Grund ist keine Nachlässigkeit, sondern eine Gewohnheit, die für sich
genommen richtig ist: nach einer Änderung startet man die Suiten, die davon
handeln. Wer an der Seitenleiste arbeitet, nimmt test34 und test222 — nicht
test40, das von der Handy-Ansicht handelt und die Breite nur nebenbei misst.
Genau dort sammelt sich, was niemand ansieht.

DIE LEHRE: ein einzelner Suitenlauf beantwortet „habe ich das kaputt
gemacht". Er beantwortet NICHT „ist alles grün". Dafür gibt es nur den
vollen Durchlauf, und der gehört ans Ende einer Arbeit, nicht in ihre Mitte.

Zweiter Befund aus demselben Lauf, an anderer Stelle festgehalten: eine
Prüfung, die eine Maus über den Bildschirm zieht, muss vorher hinsehen, ob
der Zug überhaupt im Bild liegt. test201 meldete „Rechteck nicht
gespeichert" und meinte „ich habe nach ausserhalb des Fensters gezogen".

Stand danach: alle 213 Läufe bestanden.


================================================================================
E218 — Ruhig: dieselbe App, weniger gleichzeitig sichtbar
================================================================================

Redur: „nicht gleich wie es machen sondern ruhiger, besser und nicht so viel
Bereiche, aber nichts löschen, alles muss enthalten bleiben."

Das sind zwei Forderungen, die einander zu widersprechen scheinen. Sie tun es
nur, wenn man „weniger Bereiche" als „weniger Funktionen" liest. Gemeint ist
etwas anderes: weniger auf einmal im Bild.


ZUERST GEZÄHLT, DANN GEZEICHNET

Ohne Zahl ist „zu viel" ein Gefühl. Also gemessen, an der laufenden App bei
1440 × 900, gezählt wurde alles Anklickbare in Seitenleiste, Kopfzeile und
Menüband — der Rahmen also, nicht der Inhalt:

    Startbild        Seitenleiste 32 + Kopfzeile 13 + Menüband  7  =  52
    offene Seite     Seitenleiste 34 + Kopfzeile 12 + Menüband 21  =  67

Zweiundfünfzig Knöpfe, bevor ein Wort geschrieben ist. Dahinter steht ein
Bestand, der selbst in Ordnung ist: 37 Einträge im Navigations-Register,
108 im Menüband über sechs Reiter, 78 Blockarten, 14 Module.

Das Problem ist nicht die Zahl der Dinge. Es ist, dass drei Leisten
übereinander versuchen, sie alle gleichzeitig anzubieten.


DIE ANTWORT: DREI TÜREN

    Leiste links    fünf Wege, benannt: Heute, Bibliothek, Aufgaben,
                    Elektro, Lernen — plus „Mehr" und der eigene Name
    Kopfzeile       eine Zeile: zurück, wo bin ich, Suchfeld, zwei Zeichen
    Menüband        nicht mehr da

Macht 13 statt 52 oder 67. Die übrigen wohnen hinter drei Türen, und jede
ist für sich vollständig:

    „Mehr"      die 30 Bereiche, die nicht in der Leiste stehen, nach
                Gruppen statt in einer Liste von 37
    ⌘K          alles Benannte: Bereiche, Blockarten, Befehle, Module,
                eigene Seiten, Dateien, Karteikarten
    „…"         das ganze Menüband, unverändert, sechs Reiter, 108 Befehle

Beim Schreiben braucht man das Band gar nicht: die sechs Knöpfe, die auf die
Auswahl passen, kommen zur Auswahl.


WAS DAS HINSEHEN GEFUNDEN HAT (§55)

Fünf Dinge, die keine Rechnung ergeben hätte:

  · Die erste Fassung hatte eine 64-px-Leiste NUR mit Zeichen. Im Bild war
    „Elektro" von „Lernen" nicht zu unterscheiden — Information allein über
    die Form eines Symbols, genau was §38 verbietet. Jetzt 208 px mit Wörtern.
    Fünf benannte Zeilen sind nicht mehr Dinge als fünf stumme, nur lesbare.

  · Die Kontextleiste lag AUF dem Text. Erst unter der Auswahl (falsch
    gerechnet), dann darüber — und verdeckte dort die Zeile davor. Das machen
    Notion und Linear auch so. Redions Textspalte lässt aber rechts 424 px
    ungenutzt: dort steht sie jetzt, auf Höhe der Auswahl, und verdeckt nie
    etwas. Das ist die Stelle, an der „besser als Redion selbst" konkret wird.

  · Die Kopfzeile sagte „Mittwoch, 27. August", der Kalender darunter begann
    am Montag, dem 27. Der 27. August 2026 ist ein Donnerstag. Zwei Angaben
    auf demselben Bild, die einander widersprachen.

  · Ein Zirkel-Zeichen für „Rechnen" sah aus wie ein griechisches Lambda.

  · Das Zahlenband stand unter dem Bildrand. Nicht knapp — die Beschriftungen
    waren abgeschnitten, die Zahlen darüber sichtbar. Ein Beleg, dessen
    Belegzeile fehlt, ist schlimmer als keiner.


UND EINE PRÜFUNG, DIE VON GEBURT AN BLIND WAR

Gegen den letzten Punkt eine Messung geschrieben: was ist die unterste Kante
im Blatt? Sie meldete für alle drei Blätter exakt 900 — die Rahmenhöhe.

Der Grund: `textContent` erbt den Text der Kinder, also „trägt" auch der
äusserste Wrapper Text, und der IST der Rahmen. Die Prüfung mass sich selbst.
Sie konnte nie rot werden.

Jetzt zählen nur Blätter (`children.length === 0`) und `svg`. Gegenprobe:
das Blatt um 100 px nach unten geschoben → 916 px, rot, mit dem Satz, der
übersteht. Zurückgesetzt → grün.

    Eine Prüfung, die immer „passt schon" sagt, ist keine Prüfung.  (§55.2)


WAS BEIM NACHZÄHLEN NEBENBEI HERAUSKAM

Zwei Dinge, die vorher niemand gezählt hatte:

  · Das Navigations-Register hat 37 Einträge, aber nur 34 Namen.
    „Bibliothek", „Papierkorb" und „Was Redion kann" stehen je zweimal darin.
    Im Entwurf zusammengelegt — das ist kein Löschen: der Weg bleibt, er
    steht nur einmal da statt zweimal.

  · „Elektro" ist keiner der 37. Es ist eines der 14 Module und hat heute
    gar keine eigene Zeile in der Seitenleiste — man kommt über den Workspace
    hin. Im Entwurf bekommt es eine, und zwar oben.

Beides steht auf dem dritten Blatt, nicht in einer Fussnote. Ein Entwurf, der
seine eigenen Zahlen schönt, ist als Grundlage wertlos.


STAND

Drei Blätter in der Entwurfsleinwand, eigene Seite „Ruhig":

    Ruhig.dc.html        Heute — der ruhige Start
    RuhigSeite.dc.html   eine Seite schreiben, mit der Leiste an der Auswahl
    RuhigAlles.dc.html   der Beleg: wo alles wohnt, und was es gekostet hat

Gebaut aus einer Quelle (`_ruhig.py` im Arbeitsordner), damit Leiste, Kopf
und Masse einmal beschrieben sind statt dreimal.

NOCH NICHT GEBAUT. Das ist ein Entwurf, keine Änderung an der App. Wenn er
gebaut wird, gilt weiter §46: erst die Daten, dann das Aussehen.


================================================================================
E219 — Die ruhige Fassung ist gebaut: 52 Rahmenknöpfe werden 15
================================================================================

E218 war ein Entwurf. Redur nach dem ersten Einbau: „Warte, es ist so gleich
wie Redion, es sollte nicht wie es ist."

Er hatte recht. Der erste Anlauf machte nur die Seitenleiste ruhig — oben
standen weiter 13 Knöpfe und das Menüband mit sechs Reitern, und deshalb sah
es aus wie vorher. Ruhig wird eine Oberfläche nicht dadurch, dass eine von
drei Leisten schrumpft.


WAS JETZT WIRKLICH GESCHIEHT

Gemessen an der laufenden App bei 1440 × 900, gezählt wird alles, was ein
Mensch anklicken kann:

                        vorher              ruhig
    Seitenleiste          32                   8
    Kopfzeile             13                   7
    Menüband               7                   0   (über einer Startansicht)
                        ─────               ─────
                          52                  15

Auf einer offenen Seite waren es 67; das Menüband kommt dort zurück,
zugeklappt wie bisher — dort kann es ja auch etwas.


DREI EINGRIFFE, UND KEINER LÖSCHT ETWAS

1. DIE SEITENLEISTE zeigt fünf Wege: Heute, Lernzentrum, Elektro, Bibliothek,
   Aufgaben — dazu „Mehr" und der Schreibknopf. Ein Klick auf „Mehr" (oder
   Strg+M) blendet ALLES wieder ein, an derselben Stelle, in derselben
   Reihenfolge, mit denselben Knöpfen. Kein neues Fenster, keine zweite
   Liste. Der Unterschied zwischen „an" und „offen" ist genau eine
   CSS-Regel.

   Das ist keine Sparsamkeit, sondern §8: ein „Mehr", das eine eigene Liste
   zeichnete, wäre ein zweiter Katalog neben dem Register — und der erste,
   der still auseinanderläuft, sobald jemand einen Eintrag ergänzt.

2. DIE KOPFZEILE gibt fünf Zeichen ab: Teilen, Kommentare, Versionsverlauf,
   Automationen, Link kopieren. Sie stehen im ⋯-Menü — und zwar nicht in
   einem neuen Block, sondern in dem, der dort schon für das Telefon stand.
   Aus `UI.amTelefon()` wurde `UI.amTelefon() || Ruhig.an()`. Eine Zeile,
   dieselbe Begründung, dieselbe Stelle.

3. DAS MENÜBAND bleibt über einer Startansicht ganz weg. Der Grund stand
   schon im Code, bei `zugeklappt`: „Ein Menüband über einer Startansicht
   kann ohnehin fast nichts — Einfügen und Zeichnen brauchen eine Seite, in
   die geschrieben wird." Zugeklappt blieben davon trotzdem sechs Reiter und
   ein Pfeil stehen, also sieben Dinge, die alle dasselbe sagen: nicht jetzt.

Dazu zwei kleinere Sachen, die beim Messen auffielen:

  · ELEKTRO BEKOMMT EINE ZEILE. Es ist eines der 14 Module und hatte keine —
    man kam nur über den Workspace oder das Lernzentrum hin. Beim Zählen für
    E218 fiel auf: die Seitenleiste führte 37 Wege, und der meistbenutzte war
    keiner davon.

  · DIE TITELZEILE DER LERNWELT ist weg. „REDION / Lernen & Alltag" stand
    direkt unter der Pfadnavigation, die „Lernen & Alltag" schon sagt.
    Zweimal dasselbe übereinander. Der Bereichsfilter wandert in die
    Reiterzeile — er gehört ohnehin dorthin, beide entscheiden, WAS man
    sieht. Der Gruß begann bei y=322, jetzt bei y=248.


DER SCHALTER

`Store.getMeta('ruhig', true)`. Von Haus aus an; wer die alte Leiste will,
schaltet zurück, und der Wunsch überlebt den Neustart.


VIER FEHLER, DIE DIE EIGENE PRÜFUNG GEFUNDEN HAT

test248 hat nicht bestätigt, was schon lief — es hat vier Dinge gefunden,
die nicht liefen.

  · DER SCHALTER SCHALTETE NICHT ZURÜCK. `Ruhig.binde()` stand in `start()`,
    `await Store.load()` 135 Zeilen weiter unten in `starteWirklich`. Also
    las `getMeta` aus einem leeren Zwischenspeicher, und die Vorgabe gewann
    immer. Der Wert war korrekt gespeichert — man sah es nur nie.
    Dieselbe Falle wie beim Bibliotheks-Regal (E207). Jetzt steht nach
    `Store.load()` ein zweites `anwenden`.

  · `visibility:hidden` MACHT EINEN KNOPF NICHT FOKUSSIERBAR. Die `+` und `⋯`
    am Baum sollten erst beim Zeigen kommen und bei Tastaturfokus trotzdem
    sichtbar werden. Mit `visibility:hidden` kommt die Tastatur nie hin, und
    die Regel, die sie sichtbar machen soll, kann nie greifen. Jetzt
    `opacity:0` mit `pointer-events:none`: im Tabulator-Weg, aber unklickbar,
    bis sie da sind.

  · DER SELEKTOR TRAF DIE FALSCHE KLASSE. Gemessen wurde `.wz-zeile`,
    im Baum heisst es `.act`. Acht Knöpfe blieben stehen, und die Zahl las
    sich wie ein Erfolg: 14 statt 32.

  · DIE ERSTE VERSTECK-REGEL TRAF „PRIVAT" MIT. Sie hiess
    `#tree .side-section` — jede Abschnittsüberschrift, also auch die über
    Redurs eigenen Seiten. Die Grenze läuft nicht zwischen Überschrift und
    Zeile, sondern zwischen GERÜST und INHALT. `seitenleiste.ts` markiert
    das Gerüst jetzt mit `data-ruhig="chrome"`; alles ohne diese Marke
    bleibt stehen.


UND DER WÄCHTER SELBST BRAUCHTE DREI ANLÄUFE

§3 soll das eine beweisen, worauf es ankommt: es ist nichts weg.

    Anlauf 1   zählte die Knöpfe IM BAUM und verglich die Zahl.
               Gegenprobe: `btn-inbox` ein `display:none` verpasst — GRÜN.
               Ob etwas im Dokument steht, sagt nichts darüber, ob man
               hinkommt.

    Anlauf 2   verglich die sichtbaren NAMEN zwischen „aus" und „Mehr offen".
               Gegenprobe: dieselbe Zeile — wieder GRÜN. Dasselbe
               `display:none` versteckt den Posteingang in BEIDEN Fassungen,
               und wer zwei gleich blinde Bilder vergleicht, sieht nichts.

    Anlauf 3   fragt das REGISTER: jeder Eintrag mit Knopf, der sich nicht
               selbst per `zeigen()` abmeldet, muss bei offenem „Mehr"
               wirklich zu sehen sein.
               Gegenprobe: ROT, mit dem Satz „unsichtbar: Posteingang
               (btn-inbox)". Zweite Gegenprobe, `knopfId` verdreht: ROT,
               „unsichtbar: Elektro (btn-elektroXX)".

    Eine Prüfung, die zwei Zustände miteinander vergleicht, prüft nur, dass
    sie gleich sind. Was sie behaupten soll, ist etwas anderes: dass der
    Katalog mit dem Bildschirm übereinstimmt.


UND EIN FEHLER, DEN ICH SELBST GEMACHT HABE

Beim Zurücksetzen einer Gegenprobe `git checkout index.html` — und damit
alle vier Änderungen an der Datei mit weggeworfen, nicht nur die eine Zeile
der Gegenprobe. Gemerkt hat es `grep -c data-ruhig`: 0 statt 12.

Für eine Gegenprobe wird eine KOPIE angelegt und zurückkopiert, nicht die
Datei auf den letzten Stand des Verzeichnisses gesetzt. Der Unterschied
fällt nur auf, wenn man vorher etwas anderes an derselben Datei getan hat —
also genau dann, wenn er weh tut.


STAND

test248 mit 35 Punkten, davon vier mit eigener Gegenprobe. test33 und
test222 mussten mitwachsen:

    test33   klickt jetzt zuerst „Mehr" — den Weg, den Redur auch geht,
             statt die ruhige Fassung abzuschalten.
    test222  unterscheidet Ziel von Schalter. „Mehr" geht nirgends hin und
             gehört deshalb nicht ins Navigationsregister; jeder ANDERE neue
             Knopf ohne Registereintrag macht die Prüfung weiterhin rot.


================================================================================
E220 — Die Auswahlleiste bleibt, wo sie ist. Das Massband hat entschieden.
================================================================================

Beim Zeichnen des Entwurfs zu E218 war der auffälligste Fehler im Bild: die
Leiste, die beim Auswählen erscheint, liegt auf der Zeile darüber. Man wählt
einen Satz und verliert dafür den davor. Notion und Linear machen es genauso.

Der Entwurf schlug den freien Rand rechts vor — dort verdeckt sie nichts, und
sie stünde auf der Höhe der Auswahl, also dort, wo das Auge ohnehin ist. Im
gezeichneten Blatt waren rechts 424 px Platz.

NACHGEMESSEN AN DER LAUFENDEN APP, 1440 px breit:

    #scroll     240 … 1440     die Fläche neben der Seitenleiste
    #page       390 … 1290     die Textspalte, 900 px breit
    frei rechts    150 px
    die Leiste     552 px      vierzehn Knöpfe, drei davon mit Wort

Es passt nicht, und zwar nicht knapp. Die Zahl 424 stammte aus dem Bild, nicht
aus der App: der Entwurf hatte eine schmalere Spalte gezeichnet, als Redion
sie hat.

Der Umbau war fertig — dreissig Zeilen, mit sauberem Rückfall auf den alten
Weg, wenn der Platz nicht reicht. Genau das ist der Grund, ihn wieder
herauszunehmen: er wäre auf JEDEM Fenster in diesen Rückfall gelaufen und
damit nie sichtbar geworden. Dreissig Zeilen, die nichts tun, sind schlechter
als eine Zeile, die etwas tut.

WAS BLEIBT, IST DER BEFUND. Die Leiste verdeckt die Zeile darüber, und das
ist ein echter Mangel. Nur ist die Antwort darauf nicht eine andere Position,
sondern eine schmalere Leiste: acht Knöpfe statt vierzehn, 330 statt 552 px,
der Rest hinter „…". Das steht als Vorschlag im Entwurf und ist noch nicht
gebaut.

Der Kommentar in `auswahlleiste.ts` trägt die Messung, damit der nächste
Versuch nicht wieder bei 424 px anfängt.

UND DIE LEHRE, die grösser ist als dieser Fall: ein Entwurf ist eine
Behauptung über Masse. Wer aus einem Bild eine Zahl abliest und sie für die
App hält, baut auf eine Zeichnung. Das Blatt „Ruhig — eine Seite" zeigt die
Leiste jetzt an ihrem echten Ort und nennt die gemessenen 150 px darunter.


================================================================================
E221 — Wer wenig zeigt, muss das Wenige richtig zeigen
================================================================================

Nach E219 alle fünf Wege durchgeklickt und hingesehen. Dabei fiel auf: ein
Klick auf „Bibliothek" liess „Workspace" aufleuchten. Ein Klick auf
„Aufgaben" ebenso. Und in der ruhigen Fassung, wo „Workspace" hinter „Mehr"
steht, markierte danach überhaupt nichts mehr etwas.


DER GRUND, UND WARUM ER VORHER NICHT WEH TAT

Die ganze Ortsangabe der Seitenleiste bestand aus zwei Zeilen:

    body[data-produktwelt="lernen"]    #btn-learning,
    body[data-produktwelt="workspace"] #btn-workspace { … }

Zwei Knöpfe, fest verdrahtet. Sie sagen, in welcher WELT man ist, nicht, wo
man hingegangen ist. Mit 32 sichtbaren Zeilen war das eine grobe Auskunft
neben vielen anderen Anhaltspunkten. Mit fünf ist die Markierung der einzige
Anhaltspunkt — und dann ist eine grobe Auskunft eine falsche.

Das ist die allgemeine Form: **Weglassen macht das Verbliebene wichtiger.**
Was bei dreissig Dingen ungenau sein durfte, muss bei fünf stimmen.


DIE LÖSUNG

`schale.ts` setzt beim Klick `aria-current="page"` auf den Eintrag, der
wirklich benutzt wurde — an der einen Stelle, an der ohnehin jeder
Registereintrag durchkommt. Keine zweite Liste, keine Sonderfälle.

Der Fuss ist ausgenommen: „Importieren" und „Papierkorb" sind Handlungen,
keine Orte, und ein Ort, an dem man nicht bleibt, soll auch nicht markiert
bleiben.

Die Weltregel bleibt als Rückfall für das erste Bild nach dem Start und
schaltet sich mit `:not(:has(…))` ab, sobald es eine echte Markierung gibt.
Ohne das stünden zwei Markierungen gleichzeitig da — und zwei sind schlimmer
als eine falsche, weil man dann nicht einmal mehr weiss, welcher zu glauben
ist.

`aria-current` ist dabei nicht nur ein Aufhänger für das Stilblatt:
Vorleseprogramme nennen damit den aktuellen Ort. Die Farbe ist die zweite
Auskunft daneben, dazu mehr Schriftgewicht — keine Information allein über
Farbe (§38).


DER UMWEG, DER MEHR GEKOSTET HAT ALS DIE SACHE

Im vollen Durchlauf brach test181 ab: „Execution context was destroyed".
Auf einem Stand vor E219 lief es grün, im Arbeitsverzeichnis rot. Also
eingegrenzt, Datei für Datei — und die Eingrenzung zeigte auf `aufbau.css`,
deren einzige Änderung eine Farbregel ist.

Eine Farbregel kann keine Navigation auslösen. Statt das ernst zu nehmen,
hätte ich fast weitergesucht. Dreimal auf demselben Stand gelaufen: grün,
grün, rot. Der volle Durchlauf lief die ganze Zeit im Hintergrund und teilte
sich die Kerne — es war nie eine Datei, es war die Last.

    Eine Eingrenzung, deren einzelne Durchgänge zufällig ausgehen können,
    grenzt nichts ein.

Wer bisektiert, prüft zuerst, ob der Lauf überhaupt wiederholbar ist. Drei
Wiederholungen hätten das in zwei Minuten geklärt. Steht als L66.


================================================================================
E223 — Was das Weglassen kaputt gemacht hat
================================================================================

Der volle Durchlauf nach E219–E222: 6 von 214 rot. Einer davon ist der
Lastflatterer aus L66. Die anderen fünf gehören zur ruhigen Fassung, und die
Aufteilung ist die interessante Auskunft:

    drei echte Fehler          — Dinge, die wirklich nicht mehr gingen
    zwei alte Verträge         — Prüfungen, die das Vorher festhielten

Wer nur die zweite Sorte findet, hat nicht genau genug hingesehen. Wer nur
die erste vermutet, ändert Prüfungen, die recht haben.


DIE DREI ECHTEN

1. DER FOKUS LANDETE AUF `<body>`.

   Strg+P öffnet die Suche auch mit zugeklappter Leiste. Der Auslöser ist
   dann `display:none` — und ein unsichtbares Element nimmt keinen Fokus
   an. `focus()` tut in dem Fall schlicht nichts, ohne Fehler, ohne
   Rückmeldung. Von `<body>` fängt das nächste Tab wieder ganz oben an,
   also genau der Fehler, gegen den `fokus.ts` überhaupt geschrieben wurde.

   `fokus.ts` sieht jetzt nach, OB es geklappt hat, und fällt sonst auf
   `#page` zurück. Nicht irgendein Ersatz: dort hat man gearbeitet, bevor
   der Dialog kam, und von dort läuft Tab weiter statt neu anzufangen.

   Und noch etwas an dieser Stelle: die Prüfung fragte zuerst nach
   `tabIndex >= 0`. `#page` trägt `tabindex="-1"` — programmatisch
   fokussierbar, aber nicht im Tab-Weg, genau richtig für einen
   Inhaltsbereich. Die Eigenschaft war die falsche Frage; die richtige ist
   die WIRKUNG: geht das nächste Tab weiter, oder fängt es oben an? So
   steht es jetzt da.

2. DIE SUCHE STAND NICHT MEHR MITTIG.

   Rechts fielen fünf Zeichen weg, also verschob die Waage aus Krume und
   Knöpfen den Sucher um 91 px. Der Kommentar im Stilblatt sagte schon
   immer, was gemeint ist: „mittig zum FENSTER, nicht mittig zwischen zwei
   Nachbarn, die je nach Seitentitel verschieden breit sind." Die Waage war
   nur die Annäherung daran, und sie hielt, solange rechts gleich viel
   stand.

   Jetzt steht es wörtlich da. Erster Versuch: `position:absolute` — und
   plötzlich 120 px daneben statt 91. Die Kopfzeile beginnt erst hinter der
   Seitenleiste; mittig zu IHR ist nicht mittig zum Fenster. `fixed` misst
   am Fenster und hält auch, wenn jemand die Seitenleiste breiter zieht.

3. Der Umweg über `absolute` steht als Kommentar dort, damit der nächste
   nicht denselben Weg geht.


DIE ZWEI ALTEN VERTRÄGE

test128 und test222 klicken jetzt zuerst „Mehr" — den Weg, den auch ein
Mensch geht. Ein verstecktes Element nimmt weder Fokus noch Klick an; das
ist keine Nachgiebigkeit der Prüfung, sondern dieselbe Lage wie beim
Benutzen.

test247 ist der lehrreichere Fall. „Zugeklappt" heisst über einer
Startansicht seit E219 „gar nicht da" — und ein fehlendes Band trägt keine
Klasse `ist-zu`. Die Prüfung fragte nur die Klasse ab, hielt „weg" für
„offen" und meldete damit das GEGENTEIL der Wahrheit. Jetzt zählt zuerst die
Höhe. Dazu ein neuer Punkt: ausgeschaltet steht die Reiterzeile weiter da —
sonst wäre nirgends geprüft, dass der Schalter wirklich zurückschaltet, und
die ruhige Fassung wäre keine Fassung, sondern ein Umbau ohne Weg zurück.

test40 fragte „zeigt die Kopfzeile alle Knöpfe?". Das ist nach E219 die
falsche Frage. Die richtige: sind es die fünf, die bleiben sollen, und kommen
die anderen zurück, wenn man abschaltet?


DIE LEHRE

Weglassen ist nie nur weniger. Jede versteckte Sache war irgendwo das Ziel
von etwas — eines Fokus, einer Messung, eines Klicks in einer Prüfung. Der
volle Durchlauf ist die einzige Stelle, an der das vollständig auffällt, und
er gehört deshalb ans Ende einer solchen Arbeit, nicht in ihre Mitte (die
Lehre aus E217, hier noch einmal bestätigt).


================================================================================
E224 — Die Mitte ist die Mitte des Arbeitsbereichs, nicht die des Fensters
================================================================================

E223 stellte den Sucher `position:fixed; left:50%` in die FENSTERmitte. Ein
Bildschirmfoto der Dokumentseite hat gezeigt, was das kostet: der Seitentitel
lief unter das Suchfeld. Zu lesen war „📕 Elek…".

GEMESSEN, 1280 px, ruhige Fassung, Seite „Lernen & Alltag":

    Krume        x 328 … 435
    Sucher       x 380 … 900
                   ^^^^^^^^^   55 Punkte Überdeckung

Und es ist kein Zufall, den man verschieben könnte:

    Seitenleiste            240
    zwei Pfeilknöpfe         88   → die Krume beginnt bei 328
    Sucher 520 breit, mittig zum Fenster → linke Kante bei 380
    ------------------------------------------------------------
    für den Titel bleiben    36 Punkte

Sechsunddreissig Punkte sind kein Titel, sondern ein Auslassungszeichen. Bei
einer 240 px breiten Seitenleiste ist Fensterzentrierung nicht eng, sondern
unmöglich.

Also zurück in den Fluss, mit der Waage, die vor E223 schon da war: Krume und
Dehnstück wachsen beide aus der Basis null, der Sucher steht dazwischen. Er
steht damit mittig zur KOPFLEISTE — und die beginnt hinter der Seitenleiste.

    aus der Fenstermitte          91 Punkte
    aus der Mitte des Arbeitsbereichs   29 Punkte
    bei 1280, 1440 und 1920       dieselben 29

Und das ist die Mitte, die ein Mensch sieht. Die Seitenleiste hat einen
eigenen Hintergrund und ist optisch eine Spalte für sich, kein Teil der
Seite. Überdecken kann nichts mehr etwas, weil alle drei Stücke Nachbarn in
derselben Zeile sind: ein langer Titel macht den Sucher schmaler, nicht
unlesbar.

DIE PRÜFUNG STELLTE DIE FALSCHE FRAGE. test245 mass den Abstand zur
FENSTERmitte — dieselbe Annahme, die den Fehler verursacht hat. Umgestellt
auf die Mitte des Arbeitsbereichs, und um die Frage ergänzt, die niemand
gestellt hatte: läuft die Krume unter den Sucher?

    Gegenbeweis mit der E223-Fassung wieder eingeschaltet:
      ausDerMitte          29 → 120   (Grenze 45)
      krumeUnterSucher      0 → 214   (Grenze 0)

Beide Zeilen können rot werden.

DIE LEHRE, und sie ist grösser als diese eine Regel: E223 wurde durch eine
Prüfung ausgelöst, die „nicht mittig" meldete. Die Prüfung hatte recht — und
die Antwort darauf hat etwas Schlimmeres kaputtgemacht, weil niemand
nachgesehen hat, wie es danach aussieht. Eine Zahl grün zu bekommen ist nicht
dasselbe wie hinsehen (§55).


================================================================================
E225 — Eine Messung, die „ausgeblendet" und „verdeckt" nicht unterscheidet
================================================================================

test67 fragte am Telefon: „Sein Inhalt beginnt unter der Leiste". Gemessen
wurde `#page h1` gegen die Unterkante von `#handy-oben`.

Seit die Arbeitswelt ihre doppelte Titelzeile abgelegt hat — die Krume oben
nennt den Namen bereits —, steht `.aw-titelgruppe` auf `display:none`. Ein
ausgeblendetes Element gibt `0,0,0,0` zurück. Und `0 >= 80` ist falsch. Die
Zeile wurde rot, obwohl nichts verdeckt war.

Das Umgekehrte ist der eigentliche Grund, es zu ändern: läge der Titel bei 0,
weil er WIRKLICH unter der Leiste steckt, sähe die Zahl genau gleich aus. Die
Messung konnte die beiden Fälle nie unterscheiden — sie war schon vorher
nicht in der Lage, die Frage zu beantworten, die sie stellt. Dass sie all die
Zeit grün war, lag daran, dass der Titel sichtbar war, nicht daran, dass sie
funktionierte.

Gemessen wird jetzt das oberste Stück Inhalt in `#page`, das überhaupt Fläche
hat (mindestens 40 × 12).

    Gegenbeweis, `#scroll{padding-top:0}`:
      Inhalt oben   146 → 66     Leiste endet bei 80

Die Zeile kann rot werden. test67: 48 von 48.

Das ist derselbe Fehlertyp wie in §55.2: eine Prüfung, die eine Eigenschaft
misst statt der Wirkung. „Wo steht die Überschrift" ist nicht dieselbe Frage
wie „deckt der Inhalt die Navigation zu" — es sah nur lange genug so aus.


================================================================================
E226 — `offsetParent` ist keine Sichtbarkeit
================================================================================

test40 zählte die Knöpfe der Kopfzeile so:

    [...tb.querySelectorAll('button')].filter(x => x.offsetParent)

und erwartete fünf: `btn-back`, `btn-fwd`, `btn-ai`, `btn-fav`,
`btn-page-menu`. Der Sucher fehlte in dieser Liste — und niemandem fiel auf,
warum.

Der Grund: ein Element mit `position:fixed` hat `offsetParent === null`. Seit
E223 stand der Sucher fest am Fenster. Er war die ganze Zeit da, gut sichtbar,
mitten in der Zeile — die Prüfung SAH ihn nur nicht. Die Zeile war nicht
grün, weil sie stimmte, sondern weil sie blind war.

Als E224 den Sucher zurück in den Fluss holte, wurde sie rot. Sie hat damit
ihren eigenen blinden Fleck gemeldet, und das ist das Beste, was ihr passieren
konnte.

Gefragt wird jetzt nach der Wirkung: hat der Knopf Fläche, und ist er nicht
auf `visibility:hidden` gestellt?

    r.width > 0 && r.height > 0 && getComputedStyle(x).visibility !== 'hidden'

Gegenbeweis, beide Richtungen:

    jetzt                back, fwd, suche-mitte, ai, fav, page-menu   (6)
    #btn-fav ausgeblendet    → 5, die Zeile wird rot
    #btn-teilen eingeblendet → 7, die Zeile wird rot

DIE STELLE WAR DREIMAL DA, und das ist der eigentliche Punkt. Beim Suchen
fanden sich in test40 drei Messungen mit demselben Muster — Telefon, Rechner,
und die Gegenprobe „ausgeschaltet stehen wieder alle da". Nur eine davon war
rot geworden; die beiden anderen wären beim nächsten `position:fixed`
drangewesen. Alle drei sind ersetzt.

Anderswo geprüft und in Ordnung: test222 kennt das Problem und umgeht es
ausdrücklich (der Kommentar dort steht seit E219), test114 fragt nach
Elementen, die keinen festen Vorfahren haben. 138 ok, 0 offen.

DIE VERWANDTSCHAFT ZU E225 ist kein Zufall. Beide Male wurde eine
EIGENSCHAFT gemessen statt der WIRKUNG:

    E225   „wo steht die Überschrift"   statt  „deckt Inhalt die Leiste zu"
    E226   „hat es einen offsetParent"  statt  „sieht man es"

Beide Male sah die Eigenschaft jahrelang aus wie die Wirkung, weil nichts sie
auseinandergezogen hat. §55.2 sagt: wer eine Prüfung schreibt, prüft zuerst,
ob sie rot werden KANN. Hier kommt eine zweite Frage dazu: kann sie aus dem
RICHTIGEN Grund rot werden?


================================================================================
E227 — Die Kartenansicht hat nie ein Zellformat angewendet
================================================================================

Beim Durchsehen der 92 Bildschirmfotos fiel am Telefon auf: der Tabellenblock
zeigte in den Karten

    Miete   Jan 1’450    Feb 1’450    Mär 1’450

und im Raster daneben

    1’450.00 CHF

Dieselbe Zelle, zwei Zahlen. Der Grund war eine Zeichenkette:

    zeigeWert(K.wert(blatt, adr), zelle && zelle.format)          falsch
    zeigeWert(K.wert(blatt, adr), zelle && zelle.stil && zelle.stil.format)

Geschrieben wird das Format nach `zelle.stil.format` — so steht es im
Zellmenü, und so lesen es alle anderen sechs Stellen. Nur die Kartenansicht
las `zelle.format`, eine Eigenschaft, die es nicht gibt. `undefined` ist ein
gültiges zweites Argument für `zeigeWert`, also gab es keinen Fehler, keine
Warnung und nichts zu sehen — ausser der fehlenden Währung.

    gemessen, vorher     Karte „1’450"          Raster „1’450.00 CHF"
    gemessen, nachher    Karte „1’450.00 CHF"   Raster „1’450.00 CHF"

Und das trifft nicht nur die Währung: Prozent, feste Nachkommastellen, alles,
was das Zellmenü setzt, war am Telefon unsichtbar. Am Telefon ist die Karte
das Erste, was man sieht — der Betrag verlor seine Währung genau dort, wo
niemand die andere Fassung danebenlegen kann, um es zu merken.

DIE PRÜFUNG FRAGT NICHT „STEHT CHF DA". Das wäre wieder eine Eigenschaft
(E225, E226). Gefragt ist die Wirkung: schreiben Karte und Raster DIESELBE
Zahl gleich? Damit fällt jede Richtung auf — ein Format, das die Karte
verliert, und eines, das nur die Karte erfindet.

    Gegenbeweis, alte Zeile wieder eingesetzt:
      ✗ Dieselbe Zelle steht in Karte und Raster gleich da
        — Karte „3.5" / Raster „3.50 CHF"
      ✗ … und das Format ist wirklich angekommen — 3.5

test163: 18 ok, 0 offen.

WAS DABEI SONST NOCH GEPRÜFT WURDE. Der Verdacht war zuerst ein anderer: die
Bilder zeigten `634.216667` im Raster, und das sah nach der abgeschnittenen
Zahl aus §55.1. Nachgesehen: es ist die RICHTIGE Fassung. `passendMachen`
kürzt bewusst über die Stufen 6-4-2-1-0, hängt den vollen Wert an den
Tooltip und schreibt `###`, wenn nicht einmal die Vorkommastellen passen.
Der Block macht dort genau das, was er soll — der Fehler lag daneben.


================================================================================
E228 — Sieben von acht Kacheln standen abgeschnitten da
================================================================================

Im Workspace, Abschnitt „Schnell starten", waren zu lesen:

    Neue Seite      Neue Date…      Whit…       Date… einle…
    Scan…           Vorla…          Glob… Suche  Sich…

Sieben der acht Kacheln. Nur „Neue Seite" stand ganz da.

DIE RECHNUNG. Die Kacheln hatten `repeat(4, minmax(0,1fr))` — vier feste
Spalten. Die Mittelspalte des Workspace ist bei 1280 px aber nur 459 px
breit, weil rechts das Reiterfeld steht:

    459 px ÷ 4 Spalten (mit 9 px Spalt)   = 108 px je Kachel
    − Zeichen 30 − Spalt 9 − Rand 24      =  45 px für den Text

Fünfundvierzig Punkte. Gemessen mit der echten Schrift (620 13px system-ui)
brauchen die längsten WÖRTER:

    Whiteboard   72 px        Datenbank   67 px
    Sicherung    64 px        Scannen     55 px

DAS WORT ZÄHLT, NICHT DIE BESCHRIFTUNG. „Dateien einlesen" darf umbrechen —
die Kachel hat `min-height`, keine feste Höhe, und wächst mit. Abgeschnitten
wird nur, was in keine Zeile passt, und das ist immer ein einzelnes Wort.

    72 (Whiteboard) + 63 (Zeichen, Spalt, Rand) = 135 px

    grid-template-columns: repeat(auto-fit, minmax(135px, 1fr))

`auto-fit` und keine feste Spaltenzahl, aus demselben Grund, der vierzehn
Zeilen tiefer in derselben Datei schon steht: die Mittelspalte kennt ihre
eigene Breite, ein Media Query auf die FENSTERbreite kann sie gar nicht
sehen. Bei 1280 werden daraus drei Spalten, bei mehr Platz wieder vier.

DAS ÄRGERLICHE DARAN: die Lehre stand seit dem 25. August vierzehn Zeilen
weiter unten, für die Zählerkarten der Bibliothek — mit derselben Rechnung
und derselben Zahl („braucht 67 px und bekam 46"). Die Handlungskacheln
daneben hat damals niemand nachgemessen. Eine Regel, die nur dort angewendet
wird, wo sie gefunden wurde, ist eine halbe Regel.

test214 stellte die Frage bereits für `.aw-zaehler-label`; sie steht jetzt
auch für `.aw-aktion-text`.

    Gegenbeweis, `repeat(4, 1fr)` wieder eingesetzt:
      ✗ Keine Kachel-Beschriftung ist abgeschnitten
        — ["Neue Datenbank", "Whiteboard", "Dateien einlesen", "Scannen",
           "Vorlage", "Globale Suche", "Sicherung"]

Genau die sieben. Und nur am Rechner: am Telefon standen ohnehin zwei
Spalten, dort war nie etwas abgeschnitten. test214: 20/20.


================================================================================
E229 — Ein Tag ist kein Zeitpunkt
================================================================================

Im Bild der Arbeitssicht stand unter „Termine":

    00:00   App ausprobieren
            Kalender · 27. Aug. 2026

Niemand hatte je eine Uhrzeit eingegeben. Das Datumsfeld hält einen
KALENDERTAG, zehn Zeichen: `2026-08-27`.

`new Date('2026-08-27')` ist nach ECMAScript-Regel UTC-Mitternacht. Gerechnet
und angezeigt wurde danach aber ORTSZEIT. Gemessen an derselben Aufgabe:

    UTC                 00:00  00:00  00:00
    Europe/Zurich       02:00  02:00  02:00
    Pacific/Auckland    12:00  12:00          ← nur noch ZWEI

Die erfundene Uhrzeit war dabei noch der harmlose Teil. Der ernste steht in
der dritten Zeile: WESTLICH VON GREENWICH VERSCHWAND DER TERMIN.

    Honolulu ist UTC−10. Lokale Mitternacht des 27. liegt bei 10:00 UTC.
    Die als UTC gelesene Angabe (00:00 UTC) liegt DAVOR.
    Also `d < heute` — aus dem Fenster, weg von der Seite.

    gemessen, alte Lesart   Wed Aug 26 2026 14:00:00 GMT-1000   → fällt raus
    gemessen, neue Lesart   Thu Aug 27 2026 00:00:00 GMT-1000   → bleibt

Ein Termin von heute, der auf der halben Erdkugel nicht angezeigt wird, ist
kein Schönheitsfehler.

DIE REGEL GAB ES SCHON. Die Kalenderansicht fragt seit langem
`String(v).length > 10`: zehn Zeichen sind ein Tag, mehr ist ein Zeitpunkt.
Sie stand nur nicht in `kommendeTermine`. Ein Wert, zwei Antworten — und die
zweite war falsch. Genau das Muster, das L34 beschreibt.

Zwei Änderungen:

  · `kommendeTermine` liest einen reinen Kalendertag als Mitternacht HIER
    (`new Date(jjjj, mm-1, tt)`) und reicht `ganztags` mit.
  · Die Terminliste zeigt bei `ganztags` den WOCHENTAG statt einer Uhr —
    dieselbe Spalte, dieselbe Breite, und er ist wahr. `<time datetime>`
    trägt dann auch nur den Tag, nicht den erfundenen Zeitpunkt.

GEPRÜFT WIRD IN EINER ZEITZONE, IN DER ES WEHTUT. Eine Prüfung, die nur in
UTC läuft, kann diesen Fehler nicht sehen — und genau deshalb hat ihn
jahrelang keine gesehen. test215 §8 läuft in Honolulu UND in Zürich.

    Gegenbeweis, alte Lesart wieder eingesetzt:
      ✗ Honolulu: der heutige Ganztagstermin steht auf der Seite — FEHLT
      ✗ Honolulu: er ist als Ganztagstermin erkannt — false
      ✗ Honolulu: und keine Zeitangabe ist erfunden — ["14:00","14:00"]
      ✗ Zürich:   er ist als Ganztagstermin erkannt — false
      ✗ Zürich:   und keine Zeitangabe ist erfunden — ["02:00", …]

Fünf von sechs Zeilen. test215: 50/50.


================================================================================
E230 — Was Bedeutung trägt, gehört nicht in die Beiwerk-Farbe
================================================================================

§38 verlangt „Kontrast im Hell- und Dunkelmodus prüfen". Geprüft wurde er
bisher an einzelnen Stellen. Beim Durchsehen der hellen Bilder fiel auf, dass
die Zeilen unter den Zahlkacheln kaum zu lesen sind — also einmal alles
gemessen, mit der WCAG-Formel statt nach Augenmass.

    hell    --text-faint #82817e auf #ffffff   3.76 : 1
                                 auf #f1f1ef   3.44 : 1
    dunkel  --text-faint #737373 auf #141414   3.67 : 1

Elf Stellen lagen unter AA — und alle elf waren dasselbe Token.

DIE ABSICHT DAHINTER IST RICHTIG UND STEHT IM CODE. In `dunkel.css`:

    --text-faint:    #737373;   /* 3.9:1 — nur Beiwerk und Symbole */

Der Fehler ist also nicht das Token, sondern was hineingeraten ist. Sieben
der elf Stellen waren kein Beiwerk:

    „Suchen in Redion …"             das Feld der wichtigsten Handlung
    „Alles bleibt auf diesem Gerät."  das Versprechen der ganzen App
    „Privat"                         die Überschrift über den eigenen Seiten
    „heute zu wiederholen"           und drei Geschwister: die Zeilen, die
    „höchstens 20 pro Runde"         sagen, was die Zahl darüber BEDEUTET
    „gezielt wiederholen"
    „keine geplant"

und in der Planung dazu:

    „27. Aug." usw.                  wann der Termin ist
    „Bevorstehend"                   die Überschrift des Abschnitts
    „Rede mit, statt mitzuschreiben" der einzige Satz im leeren Zustand
    der Trefferpfad in der Suche     ohne ihn sind zwei gleichnamige Seiten
                                     nicht zu unterscheiden

Die vier Kachelzeilen sind genau der Fall, den die Bibliothek schon einmal
hatte: „drei von sechs Karten sagten nicht mehr, was ihre Zahl bedeutet."
Dort war die Spalte zu schmal, hier ist die Farbe zu blass. Dasselbe
Ergebnis, andere Ursache.

Das Token bleibt unverändert. Neun Regeln bekamen `--text-dim`
(hell 5.9:1, dunkel 6.1:1). Was wirklich Beiwerk ist, bleibt blass: der
Tastenhinweis `Strg P` im Suchfeld und der Aufklapp-Pfeil `▸` im Baum.

EINE STELLE TRUG ZWEIERLEI, und darum steigt sie mit: `.side-item .k` hält
in der Planung das DATUM des Termins und sonst den Tastenhinweis „Strg M".
Ein Datum ist kein Beiwerk. Dass der Tastenhinweis dabei lesbarer wird, ist
kein Verlust.

DIE NEUE SUITE FRAGT ES FÜR ALLE ACHT PRODUKTWELTEN IN BEIDEN THEMEN
(test249, 17 Punkte). Ihre Ausnahmeliste ist namentlich und trägt bei jedem
Eintrag den Grund — eine Liste aus blossen Klassennamen wächst still.

    Gegenbeweis 1, alte Farben wieder eingesetzt:
      alle 16 Welt/Thema-Fälle rot, mit Namen:
      „Suchen in Redion …", „Privat", „Alles bleibt auf diesem Gerät.", …

    Gegenbeweis 2, Ausnahmeliste geleert:
      rot mit genau den zwei Beiwerk-Stellen — die Liste wirkt also
      wirklich und ist nicht bloss Beiwerk ihrerseits.

test249: 17/17. Die bestehenden Kontrast-Suiten bleiben grün: test34 77/77,
test127 22 ok, test128 54 ok, test231 29, test245 53.


================================================================================
E231 — Eins ist eine andere Zahl als zwei
================================================================================

Im hellen Bild der Bibliothek stand unter zwei Seiten gleichzeitig:

    Baustelle Halle 3        1 Einträge
    Elektrotechnik Skript    1 Einträge

Ärgerlich daran ist nicht der Fehler, sondern wo die Lösung lag: 146 Zeilen
tiefer, in DERSELBEN Datei, dreimal richtig gemacht.

    `${pdf.seiten} ${pdf.seiten === 1 ? 'Seite' : 'Seiten'}`
    `${board.formen} ${board.formen === 1 ? 'Form' : 'Formen'}`

Dreimal bedacht, einmal vergessen — dasselbe Muster wie bei den Kacheln
(E228, die Regel stand vierzehn Zeilen tiefer) und beim Kalendertag (E229,
die Regel stand in der Kalenderansicht). Wenn dieselbe Entscheidung an vier
Stellen einzeln getroffen werden muss, wird sie irgendwann an einer
vergessen. Also steht sie jetzt an einer:

    const zahlWort = (n, einzahl, mehrzahl) => `${n} ${n === 1 ? einzahl : mehrzahl}`;

Fünf Aufrufe: Einträge, Zeilen, Ansichten, Rückverweise, Aliasse, Seiten,
Formen.

WARUM ES NIEMANDEM AUFFIEL. Der übliche Bestand hat Seiten mit null oder
vielen Kindern. Genau eins ist selten — und genau deshalb legt die Prüfung
den Fall selbst an, statt zu hoffen, dass er im Bestand vorkommt.

Und sie fragt nicht nach dieser einen Zeile, sondern nach dem MUSTER: steht
irgendwo „1" vor einem Wort mit Mehrzahl-Endung? Damit fällt auch der
nächste Vergesser auf.

    Gegenbeweis, alte Zeile eingesetzt:
      ✗ … und heisst „1 Eintrag", nicht „1 Einträge" — Genau eins | 1 Einträge
      ✗ Nirgends steht „1" vor einem Mehrzahlwort — ["1 Einträge"]

test214: 23/23.

NEBENBEI GEZÄHLT: ein Suchlauf über `src/` findet 110 Stellen, an denen eine
Zahl vor einem Wort steht, ohne Einzahl-Verzweigung. Die meisten sind
Meldungen nach einer Massenaktion („17 Zeilen eingefügt"), wo die Eins kaum
vorkommt und niemanden stört. Die fünf hier stehen in LISTEN, die bei jedem
Öffnen zu sehen sind. Der Rest steht in LUECKEN.md, statt still zu bleiben.


================================================================================
E232 — Eine Abwägung ohne Zahlen ist eine Vermutung
================================================================================

Ein Durchgang über alle acht Produktwelten am Telefon (390 × 844) fand
neunzehn Tippziele unter 44 px — die Grenze aus §37:

    30 × 44   „Zurück"          in JEDER Ansicht
    30 × 44   „Seitenoptionen"  in JEDER Ansicht
    40 hoch   die zweite Reiterzeile (Schule / Ausbildung · Uni · Arbeit)
    37 breit  „Uni" — drei Buchstaben, und der Nachbar klebt daneben

DIE ERSTEN BEIDEN WAREN EINE BEWUSSTE ENTSCHEIDUNG. Sie stand mit
Begründung in `bausteine.css`:

    „Eine Kopfleiste ohne Titel ist schlimmer als eine mit etwas schmaleren
     Knöpfen: man weiss dann nicht mehr, wo man ist. 44 px Höhe trifft der
     Daumen ohnehin — die Breite ist in einer waagerechten Leiste die
     weniger wichtige Hälfte."

Der Gedanke ist richtig. Er wurde nur nie ausgerechnet. Nachgemessen, 390 px:

    Leiste 390 — btn-back 30 — Krume 312 — btn-page-menu 30
                                    ^^^ und 18 px stehen frei

Beide Knöpfe auf 44 kosten die Krume 28 Punkte. Sie behält 284, und ein
Seitentitel braucht selten mehr als 200. Der Titel verschwindet also nicht —
er wird um neun Prozent kürzer. Nachgesehen im Bild: „← Lernen & Alltag ⋯"
steht unverändert vollständig da.

DAS IST DIE EIGENTLICHE LEHRE. Die Abwägung war nicht falsch gedacht,
sondern ungerechnet. Mit den Zahlen daneben war sie in zwei Minuten
entschieden — und zwar anders. Wer eine Regel des Projekts bewusst bricht,
schreibt die Zahl dazu, gegen die er sie abgewogen hat; sonst steht dort ein
Gefühl, das niemand nachprüfen kann.

DIE ZWEITE REIHE HATTE GAR KEINE BEGRÜNDUNG: `min-height:40px` unter
`pointer:coarse`, während der Kommentar darüber nur das Nicht-Umbrechen
erklärt. Jetzt 44, und dazu `min-width:44px` — „Uni" war 37 breit, und in
einer Reiterreihe landet ein Fehltipp beim Nachbarn, nicht im Leeren.

Geprüft wird es jetzt für jede Welt einzeln (test114, Abschnitt 22).

    Gegenbeweis, alte Masse wieder eingesetzt:
      8 von 8 Welten rot, mit genau diesen vier Zielen benannt
      146 ok → 138 ok, 8 offen

test114: 146 ok, 0 offen.

NEBENBEI GEPRÜFT UND SAUBER: derselbe Durchgang fragte auch, ob jeder Knopf
einen Namen für das Vorleseprogramm hat (§38). Über alle acht Welten:
null ohne Namen. Ein geprüfter Nullbefund ist auch ein Ergebnis.
