# CLAUDE.md — Regeln für Redion

Redion ist eine Notiz-, Datenbank- und Wissens-App im Stil von Notion.
Sie ist local-first, läuft direkt im Browser, kann ohne Konto benutzt werden
und lässt sich optional mit einem Server auf Cloudflare erweitern.

**Die fünf Ziele, aus denen alles Übrige folgt:**

1. **Daten gehören dem Nutzer.** Nicht dem Server, nicht dem Konto, nicht uns.
2. **Die App läuft lokal, offline und ohne Server.** Das ist der Normalfall,
   nicht der Notfall.
3. **Ein Server darf mehr möglich machen** — Abgleich, Rechte, Teilen,
   Sicherung in der Wolke — aber nie zur Bedingung werden.
4. **Grosse Dateien dürfen nicht zu Datenverlust oder Speicherabsturz führen.**
5. **Redion bleibt einfach startbar:** `index.html` doppelklicken oder
   `redion-einzeldatei.html` öffnen. Kein Bauschritt, keine Installation.

Und der Satz, der über allem steht (§51):

> Redion darf lieber langsamer neue Funktionen bekommen, als jemals
> Nutzerdaten zu verlieren.

---

## Wie diese Datei zu lesen ist

**Jeder Abschnitt trägt eine Marke.** Sie sagt, was ein Verstoss bedeutet:

| Marke | Bedeutung |
|---|---|
| **[hart]** | Nicht brechen. Ein Verstoss ist ein Fehler, kein Stil. Wenn es doch sein muss, entscheidet Redur, und die Entscheidung kommt in `ENTSCHEIDUNGEN.md`. |
| **[Richtwert]** | Der Normalfall. Abweichen ist erlaubt — aber mit einem geschriebenen Grund an Ort und Stelle, nicht stillschweigend. |

Die Marken sind ein Vorschlag, wo Redur nicht selbst entschieden hat. Vier
hat er am 3. September 2026 selbst entschieden: §30, §37, §46 und §55.3.
Was noch offen ist, steht am Ende unter „Offene Fragen an Redur".

**Die Abschnittsnummern sind fest.** `ENTSCHEIDUNGEN.md`, `LUECKEN.md`,
Prüfläufe und Kommentare im Quelltext verweisen auf „§46" oder „§55.2".
Umnummerieren würde all das ins Leere zeigen lassen — also wird
umgeschrieben, aber nicht umnummeriert.

**Wo was steht:**

| Datei | Frage |
|---|---|
| `CLAUDE.md` | Nach welchen Regeln wird gearbeitet? |
| `AUFGABEN.md` | Was ist noch zu tun? |
| `ERLEDIGTE-AUFGABEN.md` | Was ist fertig, und was kam dabei heraus? |
| `ENTSCHEIDUNGEN.md` | Warum wurde etwas so entschieden? (E1 … E369) |
| `LUECKEN.md` | Was fehlt noch im Produkt? (L1 … L116) |
| `messungen.md` | Was kam beim Nachmessen heraus? (Zahlen, vorher/nachher) |
| `UR.md` | Wer ist Redur, wie wird hier gearbeitet, was geschah an welchem Tag? (§56) |
| `PROBLEME.md` | Welche Fehler gab es, und wie wurden sie gefunden? (P1 … P60) |
| `doku/ARCHITEKTUR.md` | Wie ist es aufgebaut? |
| `doku/REDION-FORMAT.md` | Wie sieht eine `.redion`-Sicherung von innen aus? |
| `doku/TYPESCRIPT-MIGRATION.md` | In welcher Reihenfolge wird migriert? |
| `doku/REDION-PLATTFORM-AUDIT.md` | Was ist da, was ist doppelt, was ist der kleinste nächste Schritt? (E681) |
| `doku/karte/` | Wo liegt was, und was hängt woran? Erzeugt aus `karte.json` mit `node karte.mts` |
| `FREMDCODE.md` | Was gehört Redur, was ist fremd, und was bringt es? (§57, E683) |

---

## Inhalt

Der Text steht in der Reihenfolge der Nummern; die Teile fassen zusammen, was
zusammengehört.

**Teil I — Was Redion ist**
[1](#1-wichtigste-grundregel--hart) Wichtigste Grundregel ·
[2](#2-projektidentität--hart) Projektidentität ·
[3](#3-sprache-und-stil--hart) Sprache und Stil

**Teil II — Wie es gebaut ist**
[4](#4-architektur-grundstruktur--hart) Grundstruktur ·
[5](#5-die-drei-architekturregeln--hart) Die drei Architekturregeln ·
[6](#6-kein-framework-zwang--hart) Kein Framework-Zwang ·
[7](#7-startregel--hart) Startregel ·
[8](#8-register-regeln--hart) Register-Regeln

**Teil III — Daten, und warum sie das Wichtigste sind**
[9](#9-speicherregeln--hart) Speicherregeln ·
[10](#10-indexeddb-regeln--hart) IndexedDB ·
[11](#11-backup-regeln--hart) Backup ·
[12](#12-redion-format-dokumentieren--richtwert) Format dokumentieren ·
[13](#13-export--und-import-regeln--hart) Export und Import ·
[14](#14-datei--und-anhangsregeln--hart) Dateien und Anhänge ·
[15](#15-versionsregeln--hart) Versionen ·
[16](#16-multi-tab-regeln--hart) Mehrere Tabs ·
[17](#17-datenmodell-regeln--hart) Datenmodell

**Teil IV — Was im Browser läuft**
[18](#18-editor-regeln--richtwert) Editor ·
[19](#19-sicherheitsregeln-browser--hart) Sicherheit im Browser ·
[20](#20-formel-regeln--hart) Formeln ·
[21](#21-ki-regeln--hart) KI

**Teil V — Server und Wolke, beide optional**
[22](#22-server-regeln--hart) Server ·
[23](#23-cloudflare-regeln--richtwert) Cloudflare ·
[24](#24-konto-regeln--hart) Konto ·
[25](#25-sync-regeln--hart) Abgleich ·
[26](#26-rechte-regeln--hart) Rechte ·
[27](#27-öffentliches-teilen--hart) Öffentliches Teilen

**Teil VI — Ausliefern und Prüfen**
[28](#28-pwa--und-offline-regeln--hart) PWA und Offline ·
[29](#29-einzeldatei-regeln--hart) Einzeldatei ·
[30](#30-tests--prüfungen--hart) Prüfungen ·
[31](#31-die-prüfläufe-die-man-kennen-muss--richtwert) Wichtige Prüfläufe

**Teil VII — Was aufgeschrieben wird**
[32](#32-doku-regeln--hart) Doku ·
[33](#33-readme-regeln--richtwert) README ·
[34](#34-entscheidungen-dokumentieren--hart) Entscheidungen ·
[35](#35-lücken-dokumentieren--hart) Lücken

**Teil VIII — Oberfläche für Menschen**
[36](#36-performance-regeln--richtwert) Leistung ·
[37](#37-mobile-regeln--hart-im-kern) Telefon ·
[38](#38-barrierefreiheit--hart-im-kern) Barrierefreiheit ·
[39](#39-css-regeln--richtwert) CSS

**Teil IX — Sicherheit ausserhalb des Browsers**
[40](#40-server-sicherheitsregeln--hart) Am Server ·
[41](#41-bridge-regeln--hart) Bridge und Proxy ·
[42](#42-secrets-regeln--hart) Secrets

**Teil X — Wie gearbeitet wird**
[43](#43-git-regeln--hart) Git ·
[44](#44-pr-regeln--richtwert) Pull Requests ·
[45](#45-reihenfolge-bei-arbeit--richtwert) Reihenfolge ·
[46](#46-prioritäten--hart) Prioritäten ·
[47](#47-nicht-tun--hart) Nicht tun ·
[48](#48-wichtige-aktuelle-baustellen--richtwert) Baustellen ·
[49](#49-empfohlene-nächste-arbeiten--richtwert) Nächste Arbeiten ·
[50](#50-definition-von-fertig--hart) Definition von fertig ·
[51](#51-wichtigster-satz--hart) Wichtigster Satz

**Teil XI — TypeScript**
[52](#52-typescript-ziel-und-code-stil) Ziel und Code-Stil ·
[53](#53-code-sprache-und-typescript) Code-Sprache ·
[54](#54-die-sprachen-dieses-projekts) Die Sprachen dieses Projekts

**Teil XII — Hinsehen**
[55](#55-bilder-machen-nicht-nur-code-lesen) Bilder machen, nicht nur Code lesen

**Teil XIII — Das Gedächtnis**
[56](#56-die-chronik--hart) Die Chronik

**Teil XIV — Fremdes**
[57](#57-fremder-code--hart) Fremder Code

---
---
---

# Teil I — Was Redion ist

## 1. Wichtigste Grundregel  **[hart]**

**Arbeite nur an Redion.**

Nicht an anderen Projekten:

- nicht an BABAT-RED
- nicht an STRAN
- nicht an RED-KURD
- nicht an musik- / RhythmVerse
- nicht an fremden Repositories

Amdion ist eine **Lesequelle** und wird nicht verändert
(`doku/AMDION-UEBERNAHME.md`).

Wenn unklar ist, ob eine Änderung zu Redion gehört: **zuerst stoppen und
fragen**, nicht anfangen und hinterher erklären.

---

## 2. Projektidentität  **[hart]**

**Redion ist:**

- Notizen-App · Datenbank-App · Wissens-App
- **eine eigene App, keine Kopie.** Sie war einmal als Notion-Alternative
  gedacht und ist über diese Beschreibung hinausgewachsen: das
  Schreibstudio für PDFs, der Stift mit Druck, die Fachzeichen und der
  Schutzleiter, die Lernwelt, die Prüfungsplanung, das `.redion`-Paket —
  davon hat Notion nichts. Wo Redion von Notion gelernt hat, steht es im
  Quelltext an der Stelle („wie in Notion"), und das bleibt so; es ist ein
  Hinweis auf eine Lösung, keine Herkunftsangabe.
- **mit Server UND ohne.** Beides ist ein vollwertiger Weg, nicht Normalfall
  und Notfall: ohne Server ist Redion vollständig; mit Server kommt dazu,
  was mehr als ein Gerät braucht (§22).
- **der Nutzer entscheidet, wo seine Daten liegen** — nur auf dem Gerät, im
  eigenen Ordner, in der eigenen Wolke, oder als `.redion` in der Hand. Die
  Wahl trifft er, nicht die App und nicht wir (§24).
- exportierbar, sicherbar, erweiterbar

**Redion ist nicht:**

- eine React-App. React ist seit **E699** (27. September 2026, Redur: „du
  kannst react nutzen keien problem") erlaubt — aber nur als **Inseln**:
  Bauteile aus Redurs Touch Kit, die an einer Stelle der bestehenden Schale
  ein Element ersetzen. Was E80 am 9. August gesagt hat, gilt weiter und
  wird geprüft: **Redur braucht keine zweite Oberfläche** — ein Einstieg,
  keine neue Seite, kein Router, an Ort und Stelle, nur Ansicht (§6,
  `test578`).
- ein schweres Framework-Projekt
- eine Server-only-App oder eine reine Wolken-App
- ein Projekt mit Pflichtkonto oder Abo-Zwang
- ein Experimentierplatz für unnötige Abhängigkeiten

---

## 3. Sprache und Stil  **[hart]**

Der ganze Abschnitt in einem Satz:

> **Deutsch für Menschen. Englisch für Code.**

Ausführlich steht die Regel in **§53** und in `ENTSCHEIDUNGEN.md` unter E27 —
dort auch die zwei harten Grenzen (Feldnamen sind Daten, keine Namen; keine
Massenumbenennung). Hier nur das Nötigste:

- **Deutsch** ist alles, was ein Mensch liest: Nutzertexte, Fehlermeldungen,
  Kommentare, Dokumentation, Prüfnamen im Bericht.
- **Englisch** ist neuer TypeScript-Code: Ordner, Dateien, Variablen,
  Funktionen, Klassen, Interfaces, Typen, Testnamen im Code.
- Der Bestand unter `quell/` ist deutsch benannt und **bleibt es**. Umbenannt
  wird nur, was ohnehin migriert wird.

Weiter gilt für Namen aller Art:

- klare, einfache Benennungen
- keine englischen Marketingbegriffe
- keine Abkürzungen ohne Grund

Die deutschen Ordnernamen des Bestands: `quell/`, `kern/`, `register/`,
`bereiche/`, `ablage/`, `abgleich/`, `zugang/`, `sicherheit/`, `pruefungen/`,
`doku/`.

---
---

# Teil II — Wie es gebaut ist

## 4. Architektur-Grundstruktur  **[hart]**

```txt
index.html                 lädt die App
quell/
  start.js                 der einzige Einstiegspunkt (§7)
  kern/                    gemeinsame Logik, kennt keinen Bereich
  register/                die zentralen Kataloge (§8)
  schale/                  Aufbau, Seitenleiste, Dialoge, Layout, Stil
  bereiche/                fachliche Bereiche (§5)
src/                       neue TypeScript-Quelle (§52, §54)
oeffentlich/               was ausgeliefert wird
server/                    der optionale Server (§22, §23)
doku/                      Architektur und Entscheidungen
pruefungen/                echte Prüfungen gegen die echte App (§30)
bauen.mts                  erzeugt redion-einzeldatei.html
redion-einzeldatei.html    die App in einer Datei (§29)
```

Bedeutung der vier Teile unter `quell/`:

- **`kern/`** — gemeinsame Logik. Kennt keinen einzelnen Bereich und darf
  keinen kennen.
- **`register/`** — die zentralen Kataloge für Module, Navigation, Blöcke,
  Eigenschaften, Ansichten, Formeln, Befehle, Tastenkürzel, Vorlagen und
  Verbindungen.
- **`schale/`** — App-Aufbau, Seitenleiste, Dialoge, Layout, globale
  Oberfläche, Stil.
- **`bereiche/`** — die fachlichen Bereiche: Editor, Datenbanken, Wissen, KI,
  Dateien, Vorlagen, Kommentare, Erwähnungen, Seiten, Planen, Einstellungen,
  Hilfe.

**Wo neuer Code hingehört**, kurz (ausführlich §53.4 und §54.2):

| Was | Wohin | Was daraus wird |
|---|---|---|
| Code, den der Browser lädt | `src/…/name.ts` | `npm run bauen:ts` → `quell/…/name.js`, mitversioniert |
| eine React-Insel (E699) | `src/islands/name.tsx`, Bauteile aus `fremd/touch/` | `npm run bauen:inseln` (Teil von `bauen:ts`) → `quell/islands/islands.js` + `.css`, mitversioniert |
| Code, den Node ausführt (Prüfläufe, Werkzeuge, Server) | `pruefungen/lauf/testNNN.mts`, `*.mts`, `server/**/*.ts` | nichts — Node führt die Datei unmittelbar aus |

---

## 5. Die drei Architekturregeln  **[hart]**

### Regel 1 — Bereiche importieren sich nicht gegenseitig

Ein Bereich darf verwenden: `kern/`, `register/`, eigene Dateien.
**Sonst nichts.**

Nicht erlaubt:

```js
import ... from "../datenbanken/..."
import ... from "../editor/..."
import ... from "../wissen/..."
```

Wenn ein Bereich etwas von einem anderen braucht, gibt es drei Wege — in
dieser Reihenfolge zu prüfen:

1. **Über den Ereignisbus** lösen.
2. **Gemeinsame Logik nach `kern/`** verschieben.
3. **Über `register/`** bekannt machen.

**Der Wächter dafür ist `test537` — seit dem 19. September 2026.** Hier stand
einmal „Der Wächter dafür ist `test87`", und das stimmte nicht: `test87`
prüft rohe Steuerzeichen, den Abgleich der Rollen zwischen Oberfläche und
Server, die A1/A2-Grenze (die drei Zeichner rufen `App` nicht an), die
Reihenfolge der Stilblätter, das Manifest, `esc`, das Schema und ein paar
Namen. Ein Bereich, der einen anderen anfasst, kam darin nicht vor.

Dazu kommt: **es gibt in `src/bereiche/` keine einzige `import`-Zeile.**
Gezählt, nicht geschätzt — alles wird über 208 `<script>` in `index.html`
geladen und redet über globale Namen. Das `import`-Beispiel oben beschreibt
also einen Weg, den dieses Projekt gar nicht benutzt; brechen lässt sich die
Regel heute nur über einen globalen Namen (`Bibliothek.…` mitten im Editor).
Genau das prüft niemand.

**Und die Regel wird heute 523-mal gebrochen.** Gemessen am 19. September
2026 (E626): 523 Querverweise in **63 von 306** möglichen Bereichspaaren, in
127 Einträgen über 61 fremde Namen; sechs davon über `(window as any)`. L150
hatte das Gegenteil behauptet („es gibt keinen Querverweis") — die alte
Messung suchte nach `import`, und den gibt es hier nicht.

`test537` prüft deshalb zwei Wege — den Namen (`Datenbank.oeffne(…)`) und den
Umweg über `window` — und führt den Stand in
`pruefungen/bereiche-bestand.json`. Das Verzeichnis darf nur **schrumpfen**:
es ist keine Erlaubnis, sondern eine Schuld. Jeder NEUE Querverweis macht den
Lauf rot.

Verschoben wurde nichts, und der Grund steht in E626: die grossen Namen sind
die Kerne ihrer Bereiche (`Datenbank` ist eine halbe Megabyte
Datenbanksteuerung), keine gemeinsamen Helfer — sie nach `kern/` zu schieben
hiesse §4 brechen.

**Offen ist damit die Richtung, und sie gehört Redur:** die 523 über
`register/` auflösen (§5s dritter Weg), oder diese Regel umschreiben, weil
achtzehn Bereiche einander in 63 von 306 Paaren anrufen und das der
Normalfall dieses Programms ist. Die Regel ist **[hart]** — also entscheidet
er.

Der dritte Kopplungsweg — der Griff ins fremde Markup — wird **nicht**
geprüft: die Zuordnung Präfix→Bereich gibt es nicht (**L191**).

### Regel 2 — Neuer Bereich = zwei Register-Einträge

Ein neuer Bereich braucht grundsätzlich nur:

```txt
quell/register/module.js
quell/register/navigation.js
```

Wenn mehr nötig scheint, ist zuerst zu prüfen, ob der Bereich zu gross oder
falsch geschnitten ist.

### Regel 3 — Neue Dinge sind Register-Objekte

Eine neue Blockart, Ansicht, Eigenschaft, Formel, ein Befehl oder ein
Tastenkürzel wird als **Objekt im passenden Register** eingetragen — nicht
als Sonderfall irgendwo im Code verstreut.

```txt
register/bloecke.js      register/befehle.js       register/vorlagen.js
register/eigenschaften.js register/tasten.js       register/verbindungen.js
register/ansichten.js    register/formeln.js
```

---

## 6. Kein Framework-Zwang  **[hart]**

Redion läuft ohne Framework-ZWANG: die Schale ist klassisches TypeScript,
und wer Redion öffnet, braucht weder Node noch npm noch einen Bauschritt.

Nicht einführen ohne sehr starken Grund und ohne eigene Entscheidung in
`ENTSCHEIDUNGEN.md`: **Vue, Svelte, Angular, Next.js**, grosse
UI-Bibliotheken, grosse State-Management-Bibliotheken, Router, **Bündel-Zwang
für die normale Nutzung**.

**React hat diese Entscheidung: E699** (27. September 2026). Redur: „du kannst
react nutzen keien problem", im Fragebogen „Mit React (E80 aufheben)".
Erlaubt ist React als **Inseln** — Bauteile aus Redurs Touch Kit, die an einer
Stelle der Schale ein Element ersetzen. Die Geschichte davor: E78 beschloss am
8. August eine React-Zielarchitektur mit eigener Schale, E80 hat sie am
9. August nach Ansicht des Rohbaus widerrufen, weil **Redur keine zweite
Oberfläche braucht**. Dieser Satz gilt weiter — als fünf Regeln, die
`test578` und `test579` prüfen:

```txt
R1  ein Einstieg        quell/start.js bleibt der einzige (§7); die Inseln
                        tun beim Laden nichts
R2  keine neue Seite    keine HTML-Datei ausser index.html lädt React; kein
                        type="module"
R3  kein Router         die Schale navigiert, keine Insel fasst Adresse oder
                        Verlauf an
R4  an Ort und Stelle   eine Insel ersetzt ein vorhandenes Element — dieselbe
                        Stelle, derselbe Auslöser, dieselben Daten
R5  nur Ansicht         Props hinein, Rückrufe hinaus; nie Store, IndexedDB,
                        localStorage, innerHTML
```

React kommt nicht beim Start, sondern mit `Inseln.bereit()` beim ersten
Gebrauch (78 KB über die Leitung, `test388` §5), und `dependencies` bleibt
leer: React liegt eingepackt in `quell/fremd/react/` wie pdf.js (§57).

Die App muss weiterhin auf **beiden** Wegen funktionieren:

```txt
index.html doppelklicken
redion-einzeldatei.html öffnen
```

Node und npm dürfen für Prüfungen, Bauen und Server genutzt werden — aber nie
als Pflicht für die normale Nutzung.

---

## 7. Startregel  **[hart]**

`quell/start.js` bleibt der **einzige** Einstiegspunkt.

Beim Start gilt:

- DOM abwarten
- App sauber initialisieren
- Fehler abfangen — **keine stillen Abstürze**
- keine doppelten Starts
- **keine Bereichslogik in `start.js`**

Wenn die Startlogik wächst, wandert sie in passende Dateien unter `kern/`
oder `schale/`.

---

## 8. Register-Regeln  **[hart]**

**Register sind die zentrale Wahrheit.** Bei einer neuen Funktion zuerst die
Frage stellen, wohin sie gehört:

| Was ist es? | Register |
|---|---|
| ein Block | `register/bloecke.js` |
| eine Datenbankansicht | `register/ansichten.js` |
| ein Eigenschaftstyp | `register/eigenschaften.js` |
| ein Befehl | `register/befehle.js` |
| ein Tastenkürzel | `register/tasten.js` |
| eine Formel | `register/formeln.js` |
| eine Vorlage | `register/vorlagen.js` |
| eine Verbindung | `register/verbindungen.js` |
| Navigation | `register/navigation.js` |
| ein Bereich | `register/module.js` |

**Keine doppelten Kataloge einführen.** Ein zweiter Katalog für dasselbe
läuft mit dem ersten auseinander, und niemand merkt, welcher gilt.

---
---

# Teil III — Daten, und warum sie das Wichtigste sind

## 9. Speicherregeln  **[hart]**

Der lokale Speicher ist der Kern der App. **Elf Fächer** liegen heute in
IndexedDB — nachgesehen in `src/kern/ablage/`, nicht erinnert:

| Fach | Was darin liegt |
|---|---|
| `blocks` | jeder Block, jede Seite, jede Datenbankzeile |
| `collections` | die Datenbanken mit ihrem Schema |
| `views` | die Ansichten auf die Datenbanken |
| `meta` | Einstellungen und Kleinkram, Schlüssel `k` |
| `versions` | der Versionsverlauf (§15) |
| `dateien` | die Anhänge, ihre Angaben (§14) |
| `stuecke` | die Stücke der Anhänge, damit nichts ganz in den RAM muss |
| `basis` | der Bestand des Abgleichs |
| `vorrat` | was noch zum Server hoch soll |
| `suchindex` | der Index für die Suche |
| `auftraege` | die Aufträge der Auftragsmaschine (E286) |

**Die Regeln:**

- Keine Datenverluste riskieren.
- Keine Migration ohne Prüflauf.
- Keine Speicheränderung, ohne rückwärts zu denken: Was passiert mit Daten,
  die vor der Änderung geschrieben wurden?
- **Grosse Dateien nicht als riesige JSON-Zeichenketten behandeln.**
- Blobs nicht blind mit `JSON.stringify()` sichern.
- Kennungen nicht unnötig ändern.
- Die Verweise zwischen Blöcken, Dateien und Datenbanken müssen stabil
  bleiben.
- **Ein Import darf vorhandene Daten nur löschen, wenn das Format diese Daten
  wirklich abdeckt** (§11, §13).
- Kaputte Daten müssen möglichst abgefangen werden, statt still zu wirken.

---

## 10. IndexedDB-Regeln  **[hart]**

IndexedDB bleibt der Hauptspeicher im Browser. LocalStorage ersetzt ihn
nicht (§47).

- Transaktionen klein halten.
- Fehler sinnvoll melden, nicht verschlucken.
- Schemaänderungen dokumentieren.
- Migrationen **idempotent** bauen — zweimal laufen darf nicht zweimal wirken.
- Keine langen Blockaden im UI-Faden.
- Grosse Blobs stückweise verarbeiten (`stuecke`).
- Datei-Stücke nicht unnötig vollständig in den Arbeitsspeicher laden.
- Bei mehreren Tabs an Überschreibungen denken (§16).

---

## 11. Backup-Regeln  **[hart]**

Sicherung ist eine **Sicherheitsfunktion**. Sie darf niemals Daten gefährden.

Redion kennt zwei Sicherungsarten, und der Unterschied zwischen ihnen ist
keine Geschmacksfrage:

### `.json` — reine Daten ohne Anhänge

Lesbar, einfach, gut für Text, Seiten, Datenbanken, Einstellungen.
Enthält **keine** echten Anhänge.

> **Deshalb:** Wenn eine `.json`-Sicherung Anhänge nicht enthält, darf ihr
> Import vorhandene Anhänge **nicht löschen.** Das ist der Fund aus `test96`,
> und er ist der Grund, warum es das `.redion`-Format überhaupt gibt.

### `.redion` — die vollständige Sicherung mit Anhängen

```txt
.redion = ZIP-artiges Paket
  daten.json
  dateien.json
  dateien/
```

- Grosse Dateien **stückweise** verarbeiten. Kein vollständiges Video, kein
  vollständiges Bild in den Arbeitsspeicher.
- Echte Dateinamen erhalten; gleiche Namen eindeutig machen.
- **Datei-Kennungen beim Import erhalten**, wenn Blöcke darauf verweisen.
- Prüfsummen stückweise berechnen.
- Über 4 GB eine klare Fehlermeldung statt eines kaputten Archivs (E39).
- `.redion` **darf** beim Ersetzen alte fremde Anhänge entfernen — weil das
  Format Anhänge abdeckt. `.json` darf das nicht.

### Zugangsdaten gehören nur in die verschlüsselte Sicherung

Seit **L76 / E279**: `wolkeToken`, `wolkeProbe` und jeder `api:*`-Schlüssel
fliegen aus der offenen `.json` und aus der `.redion` heraus und werden im
Manifest unter `fehlt` genannt.

Der Ordnerzugriff und die Freigabeliste (`wolkeGeteilt`) reisen **gar nicht**
mit — eine Sicherung kann keine Erlaubnis mitbringen.

Und ein Einspielen mit „Ersetzen" ersetzt **Inhalte, nicht die
Kontoidentität** des Geräts: danach hält Redion den Abgleich an und fragt,
statt eine Richtung zu wählen.

---

## 12. .redion-Format dokumentieren  **[Richtwert]**

Wer am `.redion`-Format arbeitet, hält `doku/REDION-FORMAT.md` aktuell.
Die Datei **gibt es** (sie war einmal die Nächste Arbeit 2 aus §49) und
enthält:

```txt
Was ist .redion?          Dateinamen-Regeln
Warum nicht nur JSON?     Kennungs-Regeln
Aufbau des Archivs        Import-Regeln
daten.json                Lösch-Regeln
dateien.json              Speichergrenzen
dateien/                  4-GB-Grenze, ZIP64-Entscheidung, Kompatibilität
```

---

## 13. Export- und Import-Regeln  **[hart]**

**Export darf nicht:**

- Daten verschweigen
- Anhänge scheinbar sichern, aber leer speichern
- bei grossen Dateien abstürzen
- still beschädigte Archive erzeugen
- nur auf starken Rechnern funktionieren

**Import darf nicht:**

- Datei-Kennungen brechen
- Blöcke von ihren Anhängen trennen
- vorhandene Anhänge löschen, wenn die Sicherung keine Anhänge kennt
- unklare Versionen blind überschreiben
- bei Fehlern halbe Zustände hinterlassen

**Und immer so prüfen:**

```txt
exportieren  →  alles löschen  →  importieren  →  Byte für Byte vergleichen
```

Das ist `test100`. Wer es nur „sieht gut aus" prüft, prüft nichts.

---

## 14. Datei- und Anhangsregeln  **[hart]**

Anhänge sind echte Nutzerdaten: Bilder, Videos, Audios, PDFs, alles andere.

- Dateiname erhalten, wenn möglich.
- MIME-Typ erhalten, wenn möglich.
- Grösse speichern.
- Kennung stabil halten.
- **Blöcke müssen ihre Dateien nach dem Import wiederfinden.**
- Grosse Dateien stückweise speichern und lesen (`stuecke`).
- Data-URL nur für kleine Dateien und bestehende Logik — **nicht** als
  Zukunftslösung für grosse Anhänge.

**Zur 12-MB-Grenze:** Sie war einmal die Notbremse und ist es nicht mehr.
E99 hat das Ziehen-und-Ablegen auf Stücke umgestellt; `werkzeuge.ts` hält an
der Stelle ausdrücklich fest, dass die Zahl kein Endzustand ist. Wo
`.redion` und der Stückspeicher grosse Dateien sauber können, ist eine feste
Obergrenze eine Bequemlichkeit, keine Regel.

---

## 15. Versionsregeln  **[hart]**

Versionen sind der Schutz gegen Fehler — die eigenen wie die des Nutzers.

- Der Versionsverlauf darf nicht still unbegrenzt wachsen.
- Mindestens die geplanten Fassungen müssen erhalten bleiben.
- Automatische Fassungen dürfen Nutzerdaten nicht zerstören.
- **Zwei Tabs dürfen einander nicht unbemerkt überschreiben** (§16).
- Versionen müssen mit Import und Export zusammenpassen.
- Alte Versionen dürfen nur nach einer klaren, geschriebenen Regel gelöscht
  werden.

Wer an Versionen arbeitet, prüft den Fall „zwei Tabs".

---

## 16. Multi-Tab-Regeln  **[hart]**

Redion kann in mehreren Tabs offen sein. Das ist kein Sonderfall — es ist
der Alltag jedes Menschen mit einem Browser.

- Änderungen aus Tab A dürfen Tab B nicht still überschreiben.
- Der Speicherstand muss erkannt werden.
- Konflikte müssen mindestens **erkannt** oder entschärft werden.
- Versionen helfen, ersetzen aber keine saubere Konfliktlogik.
- Prüfläufe für zwei Tabs sind wichtig und existieren.

---

## 17. Datenmodell-Regeln  **[hart]**

Blöcke, Seiten, Datenbanken und Zeilen müssen stabil bleiben.

- **Eine Zeile ist eine Seite.** (Derselbe Satz Felder, nur
  `parentTable: 'collection'`.)
- Datenbank-Ansichten zeigen auf ein Schema.
- Blöcke behalten stabile Kennungen.
- Beziehungen behalten stabile Kennungen.
- **Rollups und Formeln führen keinen fremden Code aus** (§20).
- Datenbankeigenschaften typgerecht speichern.
- Import und Export müssen **alle** Typen berücksichtigen, nicht die
  bekannten.

Die Typen dazu stehen in `src/core/types/` — und dort, nicht hier, ist die
Wahrheit (§52.8).

---
---

# Teil IV — Was im Browser läuft

## 18. Editor-Regeln  **[Richtwert]**

Der Editor ist zentral und darf nicht weiter aufgebläht werden. Wo möglich,
grosse Editor-Dateien aufteilen in:

```txt
rendern · tastatur · auswahl · inline-format · slash-menue
block-aktionen · einbettungen · kommentare · drag-drop
```

**Hart in diesem Abschnitt sind vier Punkte:**

- Bestehende Tastenkürzel nicht brechen.
- Blöcke müssen sich **ohne Datenverlust** umwandeln lassen.
- **Unbekannte Blocktypen nicht löschen** — sie sind Daten eines Nutzers, der
  eine neuere Fassung hatte.
- HTML und Einbettungen sicher behandeln (§19).

Richtwert bleibt der Rest: Slash-Menü stabil halten, Markdown-Kürzel prüfen,
Inline-Formatierung prüfen.

---

## 19. Sicherheitsregeln Browser  **[hart]**

**Niemals unsichere HTML-Ausgabe einbauen.**

- Nutzertext immer escapen.
- Kein rohes `innerHTML` mit ungeprüften Nutzerdaten.
- Links prüfen.
- Einbettungen nur aus bekannten sicheren Quellen oder mit klaren
  Sandbox-Regeln.
- Kein fremder Code aus Formeln. **Kein `eval()`.**
- Keine geheimen Werte in LocalStorage, ausser bewusst verschlüsselte
  Inhalte.
- Verschlüsselte Seiten mit AES-GCM sauber behandeln.
- **Passwort nie speichern.** Schlüssel nur im Speicher halten, wenn möglich.

Die Escape-Funktion muss wirklich escapen:

```js
const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;')
```

Und **nicht** so — das ist der Fehler, den es schon zweimal gab, weil er beim
Lesen richtig aussieht:

```js
.replace(/</g, '<')      // ersetzt nichts
.replace(/>/g, '>')      // ersetzt nichts
```

---

## 20. Formel-Regeln  **[hart]**

**Formeln sind keine JavaScript-Ausführung.**

- Kein `eval()`. Kein `Function()`.
- Eigener Tokenizer, Parser und Auswerter bleiben.
- Fehler müssen verständlich angezeigt werden.
- Die Live-Vorschau darf nicht abstürzen.
- Formeln dürfen keine Seiteneffekte haben.
- Listenfunktionen und Textfunktionen sauber trennen.
- `+` bleibt Textverkettung und bleibt dokumentiert; `concat()` bleibt für
  Listen.

Eine neue Formelfunktion wird **im Register eingetragen, dokumentiert,
geprüft** — und ihre Grenzfälle werden geprüft, nicht nur der Normalfall.

---

## 21. KI-Regeln  **[hart]**

Redion nutzt lokale KI: **Ollama** und **WebLLM**.

- **Kein Text verlässt ungefragt den Rechner.**
- Keine Wolken-KI ohne ausdrückliche Entscheidung des Nutzers.
- Keine API-Schlüssel im Repository (§42).
- Den WebLLM-Modell-Download klar erklären; er ist gross.
- Die Ollama-Verbindung robust prüfen.
- KI-Funktionen müssen sich **ohne KI sauber deaktivieren** lassen.
- KI darf Daten nicht verändern, ohne dass der Nutzer es auslöst.
- KI-Ausgaben in Datenbanken und Seiten müssen wie normale Änderungen
  behandelbar sein — rückgängig, versioniert, löschbar.
- KI-Felder in Datenbanken dürfen nicht blockieren.

---
---

# Teil V — Server und Wolke, beide optional

## 22. Server-Regeln  **[hart]**

Der Server ist **optional**. Das ist keine Absichtserklärung, sondern eine
Prüfbedingung.

**Der Server darf ermöglichen:** Konto, Sitzung, Abgleich, Rechte,
öffentliche Seiten, Freigaben, Feldrechte, Protokoll, Marken, MCP/API,
Cloudflare Workers und D1.

**Der Server darf nicht Voraussetzung sein für:** lokale Notizen, lokale
Datenbanken, lokale KI, lokale Sicherung, lokale Nutzung.

> Wenn der Server kaputt ist, muss die lokale App weiterlaufen.

---

## 23. Cloudflare-Regeln  **[Richtwert]**

Cloudflare ist der optionale Wolkenmodus. Mögliche Teile: Pages, Workers,
D1, R2, KV optional, Durable Objects später.

- **D1** für strukturierte Abgleich- und Kontodaten.
- **R2** für grosse Dateien und Anhänge.
- **Keine grossen Blobs in D1.** (Das ist der harte Punkt des Abschnitts.)
- R2-Objekte mit stabilen Kennungen.
- Uploads mit Grössenprüfung, Downloads mit Berechtigungsprüfung.
- Öffentliche Seiten strikt von privaten Daten trennen.
- Der Wolkenmodus darf local-first nicht zerstören. Der Nutzer muss lokal
  bleiben können.

Die `database_id` in `wrangler.toml` ist **kein Geheimnis** und gehört ins
Repository; echte Geheimnisse kommen über `wrangler secret put` (§42).

---

## 24. Konto-Regeln  **[hart]**

Ein Konto ist optional.

- Die App muss ohne Konto funktionieren.
- Ein Konto wird nur aktiv, wenn der Nutzer es will.
- **Lokale Daten dürfen nicht automatisch hochgeladen werden** (E1/E34).
- Der Nutzer muss wählen können: nur lokal · lokal + Abgleich ·
  Wolken-Arbeitsbereich · offline exportieren · `.redion` herunterladen.
- Abmelden darf lokale Daten nicht ohne Warnung löschen.
- Kontodaten und Arbeitsbereichsdaten trennen.
- Sitzungen hashen. Tokens nicht im Klartext speichern, wenn vermeidbar.

---

## 25. Sync-Regeln  **[hart]**

Abgleich ist schwierig und darf nicht leichtfertig geändert werden.

- Jede Änderung braucht **Version, Zeit und Gerät**.
- Konflikte müssen erkannt werden.
- Gelöschte Daten brauchen **Grabsteine** — Tombstones (E249, E254).
- Anhänge getrennt abgleichen.
- Der lokale Stand bleibt führend, solange der Nutzer nicht anders
  entscheidet.
- Offline-Änderungen müssen später zusammengeführt werden.
- **Abgleich darf nicht still Daten verlieren.**

Prüfläufe für zwei Geräte, zwei Tabs und Konflikte gehören dazu.

---

## 26. Rechte-Regeln  **[hart]**

Rechte müssen **wirklich sperren**, nicht nur Knöpfe ausgrauen.

Die Rollen: `voll` · `edit` · `komm` · `lesen` · `kein`.

- Rechte in der Oberfläche und Rechte am Server müssen übereinstimmen.
- **Der Server entscheidet final.**
- „Kein Zugriff" darf nicht versehentlich die Rechtezeile löschen.
- Feldrechte dürfen durch Export und Import nicht kaputtgehen.
- Öffentliche Seiten liefern nie private Daten mit.
- Prüfläufe für Rechtefälle sind Pflicht.

Und der Fund aus L102, der teuer war: Ein Recht wird **gegen die Seite
geprüft, die angefasst wird** — nicht gegen die gerade offene. Ein Tor, das
ohne Seitenkennung befragt wird, sagt „ja".

---

## 27. Öffentliches Teilen  **[hart]**

Ohne Server ist Teilen ein Export. Mit Server kann Teilen eine echte
Freigabe sein.

- Öffentliche Seiten nur **ausdrücklich** veröffentlichen.
- Private Blöcke nicht mitliefern.
- Anhänge öffentlicher Seiten brauchen eine eigene öffentliche Freigabe.
- **Widerruf muss funktionieren** — und geprüft sein.
- Teilen darf nicht versehentlich den ganzen Arbeitsbereich veröffentlichen.
- Suchmaschinen sehen nur Demo oder wirklich veröffentlichte Inhalte.

---
---

# Teil VI — Ausliefern und Prüfen

## 28. PWA- und Offline-Regeln  **[hart]**

Redion muss offline funktionieren.

- Die App-Schale ist cachebar.
- Die Daten bleiben lokal.
- Der Service Worker darf keine alten kritischen Dateien endlos halten.
- Update-Hinweis anzeigen, wenn nötig.
- Offline-Export muss möglich bleiben.
- `redion-einzeldatei.html` bleibt die wichtige Rückfallform.
- **Keine Online-Pflicht für Kernfunktionen.**

Der Stand des Dienstes wird nicht von Hand gepflegt: `dienststand.mts`
rechnet eine Prüfsumme über den `GRUNDSTOCK` und hebt `VERSION` in
`src/dienst/sw.ts` selbst an (E361, L83). Eine neue Skriptdatei braucht
deshalb **zwei** Einträge: das `<script>` in `index.html` **und** die Zeile
im `GRUNDSTOCK`.

Was erst beim Gebrauch nachgeladen wird, steht NICHT in `index.html`, aber
trotzdem im `GRUNDSTOCK` — sonst fehlt es offline: pdf.js (E389), die Chronik
(E613) und seit E699 React und die Inseln
(`quell/fremd/react/react.js`, `quell/islands/islands.js`, `.css`, dazu ihr
Lader `quell/schale/inseln/laden.js`). Der GRUNDSTOCK ist die Ablage, nicht
die Startliste. Und weil der Dienststand die Bytes des Grundstocks rechnet,
baut `npm run bauen:ts` die Inseln ZUERST.

---

## 29. Einzeldatei-Regeln  **[hart]**

`redion-einzeldatei.html` ist wichtig — sie ist Redion ohne alles.

- `node bauen.mts` muss sie **reproduzierbar** erzeugen.
- Keine externen Laufzeitabhängigkeiten darin.
- Die Grösse im Auge behalten.
- Nach Änderungen an `kern/`, `schale/` oder `bereiche/` prüfen, ob sie neu
  gebaut werden muss — meistens ja.
- Die CI darf erkennen, wenn das Bau-Erzeugnis nicht aktuell ist.
- **Die Einzeldatei darf keine Geheimnisse enthalten** (§42).

---

## 30. Tests / Prüfungen  **[hart]**

**Prüfungen sind Pflicht.** Heute sind es 534 Läufe unter
`pruefungen/lauf/testNNN.mts`.

*Die Zahl stand hier bis zum 12. September 2026 auf 323 — hundertfünfzehn
Läufe lang hat niemand sie nachgezogen. Sie wird nicht geschätzt, sie wird
gezählt: `ls pruefungen/lauf/test*.mts | wc -l`. Die „~11 min" für den
schnellen Lauf stammen aus derselben Zeit und sind deshalb entfernt statt
hochgerechnet — eine erfundene Minute wäre schlimmer als eine fehlende.*

*Am 15. September 2026 stand sie auf 438 und wurde wieder nachgezählt: 466.
Achtundzwanzig Läufe Abstand, nach hundertfünfzehn beim letzten Mal. Der
Abstand wird kürzer, die Lehre bleibt dieselbe — die Zahl steht mit ihrem
Befehl auch in `messungen.md`, wo sie neben dem Datum ihrer Messung lebt.*

*Noch am selben Tag: 468, dann 469. Die Läufe `test525`
(`.pptx`-Rundreise), `test526` (`.docx`-Rundreise) und `test527` (direkt auf
dem Blatt schreiben) kamen dazu. Ein bis zwei Läufe Abstand — so soll es
sein: die Zahl wird im selben Bogen nachgezogen, in dem der Lauf entsteht,
nicht hundertfünfzehn später.*

*Am 16. September: 471. Gezählt, nicht fortgeschrieben — und dabei kam
heraus, dass die 469 schon vorher um eins danebenlag: `test528` war
entstanden, ohne dass jemand die Zahl anfasste. Zwei kamen jetzt dazu
(`test528` und `test529`, die Gedankenkarte), einer war unterwegs
verlorengegangen. Genau dafür steht der Befehl daneben:
`ls pruefungen/lauf/test*.mts | wc -l` weiss es, das Gedächtnis nicht.*

*Noch am 16. September: 472. `test530` kam dazu — der Ablagename des
Dienst-Arbeiters trägt jetzt den Inhaltsstempel (E610). Einer Abstand, im
selben Bogen nachgezogen; so ist es gemeint.*

*Und 473: `test531` — das Auge an jedem Ordner, nicht nur im Regal
(E611).*

*Und 474: `test532` — die Decke über der Folie im Schreibstudio (E612).
Er ist der Wächter, den L121 Punkt 5 seit dem 3. September gefordert hat:
eine Zahl je Zustand, damit die Leiste nicht wieder zuwächst.*

*Und 475: `test533` — die Tafel als Behälter und das Wort unter dem Zeichen
(E614). Gezählt am 16. September, im selben Bogen: `ls pruefungen/lauf/test*.mts
| wc -l` sagt 475.*

*Und 476: `test534` — wo die Leiste steht, und dass sie dort auch wirklich
steht (E619/E620/E621). Gezählt am 19. September, im selben Bogen: der Befehl
sagt 476.*

*Und 477: `test535` — die Strichprobe zeigt den Strich, und der Radierer hat
eine Grösse (E623/E624). Gezählt am 19. September, im selben Bogen: 477.*

*Und 478: `test536` — die Dock-Welle gilt auch ohne Studio (E625). Gezählt
am 19. September: 478.*

*Und 479: `test537` — Bereiche bleiben getrennt (E626, L150). Er hält eine
**harte** Regel, die neun Monate lang keinen Wächter hatte. Gezählt am
19. September: 479.*

*Und 480: `test538` — die Griffe, die freien Verbindungen, die Formen und
die Vorlagen der Gedankenkarte (E628). Gezählt am 19. September, im selben
Bogen: `ls pruefungen/lauf/test*.mts | wc -l` sagt 480.*

*Und 481: `test539` — die Linse liegt über den Knöpfen und steht trotzdem
niemandem im Weg (E639). Gezählt am 20. September, im selben Bogen: der Befehl
sagt 481.*

*Und 482: `test540` — die zuletzt gelesene Seite überlebt eine Fenstergrösse
(E644). Er hält ein gestelltes Rennen: ohne die Sperre schreibt ein `resize`
vor der Wiederherstellung die Seite 1 in den Merker, und die Stelle, an der
man gestern aufgehört hat, ist weg. Gezählt am 20. September, im selben
Bogen: der Befehl sagt 482.*

*Und 483: `test541` — die untere Leiste hat EINE Fläche, und sie wandert
(E646). Sechs Zusagen des Design-Systems, jede als Zahl: eine Fläche statt
fünf, keine Breite in der Übergangsliste, Zwischenorte statt eines Sprungs,
A→B→C lenkt um statt anzustehen, kein Hit-Target bewegt sich, und ohne
Bewegung wird gesetzt. Gezählt am 20. September, im selben Bogen: der Befehl
sagt 483.*


*Und 484: `test542` — die Auswahlleiste trifft die markierte Stelle (E650).
Er hält etwas, wofür es neun Monate lang keinen Wächter gab: `umschliesse`
und `linkSetzen` ersetzten mit `String.replace(txt, …)`, und das trifft das
ERSTE Vorkommen, nicht das markierte. Gegen den alten Stand war er rot und
hat den Fehler wörtlich ausgedruckt — `**Test** und Test` statt `Test und
**Test**`. Gezählt am 20. September, im selben Bogen: `ls
pruefungen/lauf/test*.mts | wc -l` sagt 484.*


*Und 485: `test543` — der Verbindungsschalter einer Datenbank gilt wirklich
(E651). Er hält eine Zusage, die im Menü stand und nirgends eingelöst wurde:
„Verknüpfte Dienste dürfen Zeilen dieser Datenbank lesen und schreiben."
`coll.verbindungen` wurde nur geschrieben, nie gelesen — und das Menü zeigte
„GitHub · aus", WÄHREND der Spiegel lief. Gegen den alten Stand war er rot
mit der Zeile, auf die es ankommt: „Und es geht KEIN Ruf hinaus — 1 Rufe".
Gezählt am 20. September, im selben Bogen: der Befehl sagt 485.*


*Und 486: `test544` — das KI-Fenster tut, was seine Knöpfe versprechen
(E652). Zwei Funde in einem Lauf: der Chat hatte keinen Stopp-Knopf, obwohl
die ganze Abbruchkette gebaut war, und „Meine Quellen" öffnete nichts.
Bemerkenswert ist, wie er rot wurde: der erste Anlauf war bei den Quellen
GRÜN, weil er sichtbare `[data-qs]` im ganzen Dokument zählte — und die
Schalterleiste steht ohnehin im Fuss. Erst als er nur zählte, was der
Menüpunkt NEU öffnet, stand da „0 Schalter sichtbar". Gezählt am
20. September, im selben Bogen: der Befehl sagt 486.*

*Und 487: `test545` — das KI-Blatt lässt sich am Telefon schliessen (E653).
Er hält §37 an einer Stelle, an der niemand hingesehen hatte: `#btn-ai`
steht am Telefon auf `display:none`, `.ai-head` trug kein Kreuz, und das
Blatt liegt 88vh hoch über der unteren Leiste. Gegen den alten Stand stand
die Zeile da, um die es geht — „2 geprüft, 0 schliessen — das Blatt ist eine
Falle". Und zweimal war er aus dem FALSCHEN Grund rot: einmal mass er den
Knopf nach dem Klick (geschlossen ist `#ai` `display:none`, also 0 × 0),
einmal zog er gegen das Willkommensblatt, das über allem lag. Gezählt am
20. September, im selben Bogen: `ls pruefungen/lauf/test*.mts | wc -l` sagt
487.*

*Und 488: `test546` — die KI darf löschen, aber nie ohne ein ausdrückliches
Ja (E654). Er hält Redurs Satz vom 20. September in dreizehn Messungen, und
seine Gegenprobe ist die überzeugendste des Monats: mit abgehängtem Tor
druckt er die Zeile, die es zu verhindern gilt — „Seite ‚Weg damit' liegt im
Papierkorb", bei NULL Dialogen, nachdem der Mensch Nein gesagt hatte.
Gezählt am 20. September, im selben Bogen: der Befehl sagt 488.*

*Und 489: `test547` — Lernkarten, PDF und Tabellen (E655). Seine wichtigste
Messung ist nicht, ob Blöcke entstehen, sondern ob `Learning.cards()` sie
ZÄHLT: die Gegenprobe schreibt `text` statt `flashcard`, das Werkzeug meldet
weiterhin „3 Lernkarten … stehen ab sofort im Lernzentrum bereit", und die
Lernwelt zählt null. Eine Erfolgsmeldung ist kein Erfolg. Gezählt am
20. September, im selben Bogen: der Befehl sagt 489.*

*Und 490: `test548` — die KI bearbeitet Text, und das Alte bleibt holbar
(E656). Zwei Gegenproben, beide gefahren: ohne die Sicherungsfassung steht
da „0 → 0" und „KEINE FASSUNG", ohne die Eindeutigkeitsprüfung kommt der
Fehler aus E650 wörtlich zurück — „Die Leitung liegt. Das Kabel bleibt."
Gezählt am 20. September, im selben Bogen: der Befehl sagt 490.*

*Und 491: `test549` — die Lückenliste sagt die Wahrheit über sich selbst
(E658). Er ist der erste Lauf, der eine DOKU-Datei hält: 33 offene Lücken
standen unter „Anhang B · Was erledigt ist", fünf Überschriften sagten
„abgearbeitet" statt GESCHLOSSEN, und die Datei zählte sich selbst falsch.
Er liest nur eine Datei — kein Browser, kein Port —, darf also neben einem
vollen Lauf gefahren werden. Gezählt am 20. September: der Befehl sagt 491.*

*Und 492: `test550` — die Doku zählt, was da ist (E659). Er hält §30s
eigenen Satz („sie wird nicht geschätzt, sie wird gezählt") und §34s
„beides: Verzeichnis und Text". Er wurde gegen den Stand rot, den ER SELBST
erzeugt hatte: 492 Dateien, 491 in der Doku — die Drift, die §30 seit einem
Jahr beklagt, im Abstand von Minuten. Gezählt am 20. September: 492.*

*Und 493: `test551` — die Tabellenwerkzeuge sind am Telefon zu treffen
(E660). Er misst die GERENDERTE Box im Browser, und genau darin liegt sein
Wert: `test402` hält dieselbe Regel über eine Textsuche nach `height:` in
den Stilblättern und konnte die 26 px deshalb nie sehen — sie kamen aus
Innenabstand und Schriftgrösse. Eine Messung, die nicht messen KANN, was
sie behauptet, sagt immer „passt schon" (L206). Gezählt am 20. September:
493.*

*Und 494: `test552` — ein abgekündigtes Modell sagt, dass es das Modell ist
(E661). Er hält Redurs Groq-404 vom 20. September mit dem echten
Fehlerkörper fest. Bemerkenswert war die Gegenprobe: die erste war FALSCH,
nicht der Code — `false && A || B` lässt `B` übrig, der Zweig lief weiter,
und der grüne Lauf sah kurz nach einem zu schwachen Wächter aus. Eine
Gegenprobe ist ein Stück Code wie jedes andere. Gezählt am 20. September:
494.*

*Und 495: `test553` — der Sweep nennt den Schuldigen, nicht sein ganzes
Stück (E662). Er prüft die Zerlegung von `volllauf.mts` mit der ECHTEN
Bilanz vom 20. September: zehn rote Läufe gemeldet, einer war es. Die Lehre
daraus gehört in diesen Abschnitt, weil sie ihn selbst betrifft — ein
Werkzeug, das Prüfläufe auswertet, ist ungeprüft, bis es einen Wächter hat.
Gezählt am 20. September: 495.*

*Und 496: `test554` — was abgehakt wird, zählt in der Wochenrückschau
(E663). Sie rechnete mit einem Feld, das niemand schrieb: wer eine Woche
lang Aufgaben abhakte, sah am Sonntag lauter Nullen. Gezählt am
20. September: 496.*

*Und 497: `test555` — „Erinnerung" führt zu einer Erinnerung (E666). Er
hält einen Eintrag, der eine Zeichenkette schrieb, während die ganze
Erinnerungsmaschine danebenstand. Zwei seiner Zusagen waren im ersten
Anlauf grün, WEIL nichts lief — `undefined` enthält kein „@remind", und
`undefined === undefined` ist wahr. Gezählt am 20. September: 497.*

*Und 498: `test556` — Strg+F findet vier Stellen und zeigte eine (E667).
Die Leiste markierte alles, rollte zur ERSTEN und schrieb „4 Treffer"; ihr
`keydown` kannte genau eine Taste, und die hiess `Escape`. Gegen den alten
Stand war er rot mit 5 von 17 — „aktiv bleibt 0 — Enter tut nichts". Seine
letzten fünf Zusagen hat aber nicht er gefunden, sondern das BILD: am
Telefon lief das Suchfeld links aus dem Bild, `-90 … 368` bei 390 px
Fensterbreite, und sichtbar war davon ein „r" (§55.1). Gezählt am
20. September, im selben Bogen: `ls pruefungen/lauf/test*.mts | wc -l` sagt
498.*

*Und 499: `test557` — Fett ist ein Schalter, und Strg+B nimmt denselben
Weg (E668). Er hat zwei Dinge gefunden, und das zweite wiegt schwerer als
das erste: `umschliesse` gab es ZWEIMAL, und die Fassung in `editor.ts`
speicherte `ct.textContent` zurück — den GEZEICHNETEN Text. Strg+B in einem
Block `Ein **fetter** Satz` machte daraus `Ein fetter **Satz**`; die
vorhandene Auszeichnung war weg, ohne Meldung. Derselbe Handgriff über den
Knopf ergab `Ein **fetter** **Satz**`. Genau davor warnt §8, und genau
deshalb hat E650s Reparatur nur die Hälfte erreicht — `test542` prüfte den
Knopf, nicht die Taste. Gegen den alten Stand war er rot mit 8 von 13.
Gezählt am 21. September, im selben Bogen: `ls pruefungen/lauf/test*.mts |
wc -l` sagt 499.*

*Und 500: `test558` — die angemeldeten Geräte gibt es wirklich (E669). Die
Einstellungen versprachen „Die Liste … steht im Wolke-Fenster"; dort stand
eine Zeile mit DIESEM Gerät. Gegen den alten Stand war er rot mit 0 von 18
— und sechs seiner Zusagen waren im ersten Anlauf GRÜN, weil die Liste leer
war: eine leere Liste enthält kein fremdes Konto und keinen Token, und zwei
Kennungen aus null Einträgen sind auch verschieden (§55.2). Seine beste
Gegenprobe gilt dem Escapen: ohne `esc()` zerreisst ein `<script>` im
Gerätenamen die Zeile — statt zwei Knöpfen steht einer da. Gezählt am
21. September, im selben Bogen: `ls pruefungen/lauf/test*.mts | wc -l` sagt
500.*

*Und 501: `test559` — den Text einer PDF ändern, ohne die PDF anzufassen
(E670). Er hält Redurs Frage vom 21. September und die Grenze, die zur
Antwort gehört: die Änderung ist eine Marke, und das Original bleibt Byte
für Byte — gemessen mit einer SHA-256-Summe über die abgelegte Quelle.
Gegen den alten Stand war er rot mit 4 von 18, und die vier grünen waren
keine Zufallstreffer: sie halten, was schon gut war. Dieser Bogen ist
ausserdem der, in dem ZWEI BESTEHENDE Wächter etwas gefunden haben, bevor
ein Mensch hinsah: `test480 §7b` druckte `inkText/inkText = 100 %`, weil
das neue Werkzeug das T von „Text schreiben" mittrug, und derselbe Lauf
zählte dreizehn Werkzeuge, wo vierzehn standen. Gezählt am 21. September:
`ls pruefungen/lauf/test*.mts | wc -l` sagt 501.*

*Und 502: `test560` — ein Ordner hat eine Farbe, und man kann sie wechseln
(E672). Gegen den alten Stand war er rot mit 9 von 26. Sein wichtigster
Beitrag kam NACH dem Bauen: die Rücken-Regel der Hefte kam am gezeichneten
Ordner mit 0 px heraus, und die Farbe fiel auf `currentColor` zurück —
`rgb(167, 167, 167)`. Ein Attribut war gesetzt, gezeichnet war nichts. Seither
misst er den Reiter des Ordners Kanal für Kanal gegen `--c-blue`. Gezählt am
21. September: `ls pruefungen/lauf/test*.mts | wc -l` sagt 502.*

*Und 503: `test561` — der Füller läuft spitz aus (E673). Gegen den alten
Stand war er rot mit 13 von 22 und hat die Zahl gedruckt, um die es geht:
„Anfang 2.4 gegen Mitte 2.4 · Bögen [1.2,1.2]" — beide Kappen in voller
Breite, jeder Buchstabe ein Klecks. Er misst die PDF-Kontur GEGEN den
Bildschirm-Bogen, weil die halben Breiten vorher an zwei Stellen standen
(derselbe Fund wie E623), und er misst den NASSEN Strich, bevor die Hand
abhebt: Anfang spitz, Ende noch voll. Und zwei seiner 24 Zusagen kamen erst
NACH dem Bild: der Punkt des 5-pt-Füllers stand als senkrechter Splitter da
— der Lauf war grün, weil er nur den 2,4-pt-Füller gemessen hatte (§55.1).
Gezählt am 21. September, im selben Bogen: `ls pruefungen/lauf/test*.mts |
wc -l` sagt 503.*

*Und 504: `test562` — jedes Werkzeug merkt sich Farbe und Stärke (E674).
Gegen den alten Stand war er rot mit 11 von 19 und hat die Handbewegung
gedruckt, um die es geht: „Zurück beim Stift zeigt die Leiste wieder Rot und
Breit — ist Grün/Fein". Seine Nachbarstelle fand das LESEN, nicht das
Messen: das Studio setzte erst die Dokumentfarbe und dann das Werkzeug, und
mit dem neuen Gedächtnis hätte der Wechsel die Farbe im selben Atemzug
wieder überschrieben (§45). Und einen zweiten Fund machte ein ALTER Wächter:
`test345 §4` wurde rot, weil E353 „mit der Auswahl Rot wählen, danach rot
weiterzeichnen" verspricht und der erste Stand das Rot der Auswahl
gutschrieb. Sechzehn Nachbarn zu fahren war kein Ritual. Gezählt am
21. September, im selben Bogen: `ls pruefungen/lauf/test*.mts | wc -l` sagt
504.*

*Und 505: `test563` — ein Stift, der kurz 0 meldet, bleibt ein Stift
(E675). Er hat eine Vermutung des Lesers gemessen, die als „nicht gemessen"
im Befund stand: ein Strich mit leichter Hand (0,2) und drei Aussetzern
trug einen Druck von 0,47 und einen Buckel von ×1,38 — der Tempo-Ersatz für
Maus und Finger war mitten im Stiftstrich eingesprungen. Gegen den alten
Stand rot mit 10 von 13; kein Bild, weil es reines Messen ist (§55.3).
Gezählt am 21. September, im selben Bogen: `ls pruefungen/lauf/test*.mts |
wc -l` sagt 505.*

*Und 506: `test564` — der Glätter hält die Ecke (E676). §1–§3 laufen ohne
Browser, wie `test366`, und waren gegen den alten Stand rot mit 6 von 8:
„2,62 px" neben der Spitze eines langsam gezogenen „M". Sein erster Fund
kam gegen den ERSTEN Reparaturstand: 1,41 px bei 60 Hz, 0,3 bei 240 Hz —
die Ecke hing wieder an der Abtastrate. Sein zweiter kam aus dem BILD: bei
8 von 8 grün zeigte das „M" ein rundes Tal, weil `finish` die Ecken beim
Absetzen durch acht gleichmässige Punkte ersetzte (23,7 px daneben) und der
Umriss durch jede Ecke eine Q-Kurve zog (5,1 px). §4 verfolgt die Ecke
seither bis aufs Papier. Gezählt am 21. September, im selben Bogen: `ls
pruefungen/lauf/test*.mts | wc -l` sagt 506.*

*Und 507: `test565` — der Trainer wohnt im Lernzentrum (E677). Er hält
Redurs Satz „die app nicht getrennt": der Trainer ist eine Ansicht der
Lernwelt über gewöhnlichen Lernkarten, seine Boxen sind eine Ableitung aus
`sr`, und `localStorage` bleibt leer. Gegen den alten Stand rot mit 1 von
21, dann Abbruch, weil es den Inhalt nicht gab. Sein Fund kam gegen den
ERSTEN gebauten Stand: „7 Prüfungsfragen, wortgleich=false" — 57 Karten in
derselben Millisekunde angelegt, und `created` allein brachte Frage 5 vor
Frage 4 (P106). Gegenprobe rot an genau zwei Stellen: „[1,-1,1]" (die
falsche Karte kommt nicht wieder) und „img: true" (kein `esc`). Gezählt am
22. September, im selben Bogen: `ls pruefungen/lauf/test*.mts | wc -l`
sagt 507.*

*Und 508: `test566` — der Streifen zur neuen Fassung steht unten (E678).
Redurs Satz vom 22. September, „die neu laden buton unten bringen", in
elf Messungen: am Rechner endet der Streifen am unteren Rand, am Telefon
genau an der Oberkante der Leiste (775 = 775), der Knopf misst 44 px, und
ein Warnstreifen bleibt oben. Gegen den alten Stand rot mit 5 von 11 —
„top 0 · bottom 45" und „85 × 23" für den Knopf. Gezählt am 22. September,
im selben Bogen: der Befehl sagt 508.*

*Und 509: `test567` — der Trainer kennt zwei Kapitel (E679). Redurs Satz
vom 22. September, „erstelle mir direkt lerne quiz im redion für kapitel
5,6,7 … alles beschriftet mit nummern, seiten im nin compact, wie im test",
in 34 Zusagen: die NIN-Kapitel 5, 6, 7 als Vorlage `nin-kapitel-5-7` mit
106 Aufgaben, davon 34 Prüfungsfragen mit Nummer, Punkten und Seite; der
Trainer findet seine Kapitel über `Register.vorlagen` (`trainer: true`)
statt über einen Namen im Code, und die Übersicht trennt sie. Gegen den
Stand ohne Skripteinträge rot mit 8 Zusagen und Abbruch; gegen den ersten
gebauten Stand 33 von 34 — die rote Zeile war der Vergleich im Wächter
selbst (eine Lücke steht als `{{Lösung}}` im Text, nicht als Frage vor
„::"), nicht das Produkt. Gezählt am 22. September, im selben Bogen: `ls
pruefungen/lauf/test*.mts | wc -l` sagt 509.*

*Und 510: `test568` — Strg+Z gehört der Fläche, die es genommen hat
(E682, L212). Er ist der erste Wächter aus dem Plattform-Audit und war aus
einer Sonde entstanden, die vor ihm gemessen hatte: im Schaltplan blieb ein
eben gesetztes Teil stehen, „Rückgängig" stand trotzdem da, und der Block
hatte eine neue Kennung — Block UND Seitenverlauf hatten zurückgenommen.
Gegen den alten Stand rot mit 13 von 25; die Gegenprobe (die eine Zeile in
der Schale wieder raus) macht ihn wieder rot. Sein §4 hat mich selbst
belehrt: die Gedankenkarte merkt Anlegen und Text als ZWEI Schritte, und der
erste Anlauf des Wächters erwartete einen. Gezählt am 25. September, im
selben Bogen: `ls pruefungen/lauf/test*.mts | wc -l` sagt 510.*

*Und 511: `test569` — der Seitenverlauf behält, was ihm nicht gehört
(E684, L212 Punkt 2). Er stand eingecheckt, bevor die Reparatur stand, und
zwar mit Absicht: §30 sagt „zuerst ein Prüflauf, dann die Reparatur", und
er war gegen `446266f` rot mit 10 von 20 — die Unterseite wechselte die
Kennung, ihre Fassung war weg, drei Purges auf zwei Schritten zurück. Mit
E684 hält er 36 Zusagen in zwölf Abschnitten, mit E685 48 in vierzehn (die
zwei Fassungs-Dialoge); fünf Gegenproben haben ihn wieder rot gemacht. Sein §5 zählt die Purges über `Store.on`, weil die
Merkliste des Abgleichs ohne Wolke leer bleibt und ein leerer Zähler nichts
beweist (§55.2) — und setzt die Marke, damit sie überhaupt schreiben würde.
Gezählt am 25. September, im selben Bogen: `ls pruefungen/lauf/test*.mts |
wc -l` sagt 511.*

*Und 512: `test570` — das Whiteboard trägt seine Raumfassung und rechnet
über die Matrix (E686). Sein wichtigster Beitrag ist ein Abschnitt, der
NICHT rot wurde: `scale(0.8)` am Elternteil war mit der alten Handformel
grün, weil der `viewBox` aus demselben Kasten kommt und sich der Faktor
kürzt — der Audit hatte das Gegenteil behauptet. Erst `rotate(180deg)`
trennte Formel und Matrix („ist 394,168 soll 312,192"). Eine Prüfung, die
wider Erwarten grün bleibt, ist ein Fund über die Behauptung (§55.2).
Gezählt am 25. September, im selben Bogen: `ls pruefungen/lauf/test*.mts |
wc -l` sagt 512.*

*Und 513: `test571` — die drei Flächen teilen EINEN Verlauf (E687).
`GfxHistory` im Kern ersetzt drei Paare von Stapeln, die in Whiteboard,
Gedankenkarte und Planfläche dieselben acht Zeilen dreimal hielten; der
Lauf braucht für den Kern keinen Browser (wie `test366`) und liest für
die Übernahme das GEBAUTE JavaScript, nicht die Quelle. Gegen den alten
Stand rot mit 8 Zusagen (die Datei gab es nicht, kein Nehmer). Sein erster
Fund galt dem Kern selbst: `Number(0) || 40` machte aus „Tiefe 0" eine
Tiefe 40. Gegenprobe rot an zwei Stellen — „merken leert das Wiederholen
— {zurueck:3, vor:1}". Gezählt am 25. September, im selben Bogen: `ls
pruefungen/lauf/test*.mts | wc -l` sagt 513.*

*Und 514: `test572` — EINE Werkzeugleiste für alle Flächen (E689). Redurs
Satz vom 25. September, „integriere alles zusammen": ein Katalog
(`Register.werkzeuge`, 22 Werkzeuge), ein Bauteil im Kern
(`core/gfx/toolbar.ts`), und das Whiteboard zieht als erste Fläche darauf um.
Gegen den alten Stand rot mit 20 von 39 und den Zahlen, um die es geht: am
Rechner drei Zeilen und 67 px, am Telefon vier Zeilen und 95 px, Köpfe
28×26 statt der 44 px aus §37. Sein wichtigster Abschnitt kam aber nicht aus
dem Kopf, sondern aus dem BILD: das Farbmenü lag gemessen genau richtig
(148×80 px über dem Knopf, im Kasten) und war auf dem Bildschirm nicht da —
`overflow-x:auto` macht aus `overflow-y:visible` beidseitig `auto`, und der
Sockel schnitt es ab. Seither fragt §9 mit `elementFromPoint`, was an der
Stelle WIRKLICH liegt (§55.1). Gezählt am 26. September, im selben Bogen:
`ls pruefungen/lauf/test*.mts | wc -l` sagt 514.*

*Und 515: `test573` — drei Ansichten einer Seite, umschaltbar oben (E690).
Redurs Satz vom 26. September, „ich will die 2 von affine 1:1 haben auch
alles komplett wie es aussehn … und noch eine 3 für die aktuelle Redion", in
30 Zusagen. Er ist der erste Wächter dieses Jahres, der DREI Namen des
Produkts geändert hat, ohne eine Zusage anzufassen — und jeder Grund steht
in seinem Kopf: `Ansichten` war der Dienst der Datenbankansichten, `ansicht`
die Form eines `views`-Eintrags, und drei sich ausschliessende Knöpfe sind
eine Radiogruppe (`aria-checked`), keine drei Schalter. Rot war er zweimal
aus dem richtigen Grund und einmal aus dem falschen: er suchte den Titel
unter AFFiNEs Namen `.pg-title`, den es in Redion nicht gibt — eine Prüfung,
die nach einem Wähler sucht, der nirgends steht, misst nichts (L206). Seine
beste Zeile stand nicht im Lauf, sondern auf dem BILD: am Telefon war die
Fläche 332 px hoch in einem 560 px hohen Feld und die Werkzeugleiste lag
mitten auf dem Kasten (§55.1). Gezählt am 26. September, im selben Bogen:
`ls pruefungen/lauf/test*.mts | wc -l` sagt 515.*

*Und 516: `test574` — jeder Block auf die Fläche (E691). Redurs Satz vom
26. September, „ja mach den vollausbau, jeder block auf die fläche ziehbar",
in 50 Zusagen über elf Abschnitte. Er ist der erste Lauf dieses Projekts,
der eine GESTE fährt statt eines Klicks: am Telefon sind die Griffe `⋮⋮`
ausgeblendet (`ki.css:182`), also schickt er `touchstart`, wartet 750 ms und
lässt los — die Hebe-Geste aus E83. Zweimal war er dabei aus dem FALSCHEN
Grund rot: einmal schickte er `contextmenu`, das unter 760 px ausdrücklich
unterdrückt wird, und einmal tippte er 400 ms nach dem Loslassen, während
der Fänger aus E83 die Klick-Nachzügler noch 800 ms schluckt. Beide Male
sah es aus wie ein Fehler im Produkt. Seine zwei besten Zusagen hat nicht
er gefunden, sondern das BILD und ein LESER: „ins Bild holen" rechnete nur
mit dem Seitenkasten, und Gliederungsstreifen wie Inhaltsverzeichnis
führten Überschriften auf, die auf der Seite gar nicht stehen. Gezählt am
26. September, im selben Bogen: `ls pruefungen/lauf/test*.mts | wc -l` sagt
516.*

*Und 517: `test575` — auf der Fläche zeichnen, mit EINEM Formenzeichner
(E693). Seine erste Hälfte ist ein Wächter über eine Architektur, nicht über
eine Funktion: `core/gfx/shapes.ts` darf keine Fläche kennen (kein `wb-`,
`gk-`, `sp-`, `pg-fl`, kein `Store`, `Register`, `App`, `Dateien`) — geprüft
über `nurCode`, sonst meldete er den eigenen Kopfkommentar, wie `test572` es
im ersten Anlauf tat. Seine zwei besten Zusagen hat aber wieder nicht er
gefunden: das BILD zeigte zum zweiten Mal in zwei Bögen dieselbe Lücke —
„ins Bild holen" rechnete erst ohne die herausgezogenen Blöcke (E691), dann
ohne die Formen. Und sein §4b misst, was L219 zur Bedingung gemacht hatte:
Tinte und Kasten schrumpfen beim Zoomen um denselben Faktor, weil sie EINEN
`transform` teilen. Die Gegenprobe (die Tinte eine Ebene höher) druckt
„Tinte ×1.000 · Kasten ×0.800". Und sein §11 ist nachträglich dazugekommen,
weil das SCHREIBEN der Doku ihn verlangte: `doku/REDION-FORMAT.md` sollte
versprechen, dass ein Seitenblock ohne Zeichnung kein `shapes` trägt — und
das war noch nicht wahr, eine leere Liste blieb stehen. Eine Doku, die man
ehrlich schreibt, ist auch ein Wächter. Gezählt am 26. September, im selben
Bogen: `ls pruefungen/lauf/test*.mts | wc -l` sagt 517.*

*Und 518: `test576` — ein Glas statt vier (E695). Redurs Satz vom
27. September, „weiter an die animationen übergangen glass efeck usw alles
verbessern", in 30 Zusagen. Er liest die Stilblätter mit einem kleinen
Blockleser statt mit `grep`, weil nur so „derselbe Block" und „unter
`@supports`" prüfbar sind — und er misst die Lesbarkeit an GERENDERTEN
Pixeln über grossen schwarzen, weissen, roten und blauen Flächen, weil eine
Rechnung über `rgba` die Unschärfe nicht kennt (L206). Genau das hat seine
beste Zeile geliefert: meine erste Dichte (74 %, als Schätzung) gab der
stillen Schrift im Menü 1,43 : 1 — die Dichte kommt seither aus der
Messung. Zweimal war er aus dem FALSCHEN Grund rot: `color-mix()` liefert
`color(srgb … / 0.88)` statt `rgba()`, und ein von Hand gesetztes
`data-theme` setzte `Aussehen` sofort zurück — hell und dunkel lieferten
Ziffer für Ziffer dieselben Werte. Gezählt am 27. September, im selben
Bogen: `ls pruefungen/lauf/test*.mts | wc -l` sagt 518.*

*Und 519: `test577` — Farben direkt wählen und im Freitext weiterschreiben
(E697). Er kam am 23. September als `test568` über `main`, aus einem
Codex-Zweig — während auf dem Arbeitszweig `test568` schon „Strg+Z gehört
der Fläche" hiess und E681 der Plattform-Audit war. Zwei Stände, die
einander nie gesehen hatten, vergaben dieselben Nummern; gemerkt hat es
erst das Zusammenführen, als GitHub den Pull Request sperrte. Beide Läufe
bleiben, dieser bekam die nächste freie Nummer. Die Lehre steht nicht in
ihm, sondern daneben: eine Nummer ist erst vergeben, wenn sie auf `main`
steht — wer auf zwei Zweigen zugleich zählt, zählt doppelt. Gezählt am
27. September, beim Zusammenführen: `ls pruefungen/lauf/test*.mts | wc -l`
sagt 519.*

*Und 520: `test578` — die React-Inseln, gebaut, eingepackt und
nachgerechnet (E699). Er liest nur Dateien, baut aber selbst: `bauen-inseln.mts`
zweimal nach /tmp, Byte für Byte gegen das, was im Verzeichnis liegt, und
zweimal gegeneinander. Sein Kern ist ein Satz aus E80, der seit dem
9. August nur ein Satz war — „Redur braucht keine zweite Oberfläche" —
und hier fünf Zeilen geworden ist. Und seine eigenartigste Zusage prüft
etwas, das NICHT geschieht: die Bündel werden in einer Nachbildung von
`document` und `window` ausgewertet, die jeden Griff mitschreibt, und das
Inselbündel darf keinen einzigen tun. Gezählt am 27. September, im selben
Bogen: `ls pruefungen/lauf/test*.mts | wc -l` sagt 520.*

*Und 521: `test579` — dieselben Inseln im Browser, auf allen drei Wegen,
auf denen Redion startet: per Doppelklick, als Einzeldatei allein im
Ordner, und über das Netz mit dem Dienst-Arbeiter und dann ohne Netz. Zwei
seiner Zusagen hat er im ersten Lauf gegen MICH gefunden: die Fehlergrenze
meldete über `reportError`, und in der Fehlerliste stand „Script error." —
unter `file://` schwärzt der Browser die Meldung (L223); und seine eigene
Messung „was holte der Start?" war unter `file://` blind, was nur seine
Gegenprobe zeigte. Gezählt am 27. September, im selben Bogen: der Befehl
sagt 521.*

*Und 522: `test580` — eine ruhigere Oberfläche, und nichts ist weg (E701).
Jede seiner sieben Zusagen hat zwei Hälften: was leiser wurde, und dass der
Griff dahinter noch am selben Ort mit demselben Auslöser steht. Er misst
Farbe, Bewegung und Deckkraft im Browser und vergleicht die Griffe mit
einer Liste, die am Stand davor abgelesen ist — 19 Bereiche der
Einstellungen, 47 Zeilen im ⋯-Menü, 13 Wege in „Mehr", 12 im R-Blatt, fünf
Seitenwerkzeuge, drei Terminkarten, je mit Kennung, Wort und Folge. Wer
dort einen Eintrag streicht, hat einen Griff gelöscht. Gegen den Stand
davor war er rot, 42 von 85. Gezählt am 28. September, im selben Bogen:
der Befehl sagt 522.*

*Und 523: `test581` — die Federn des Touch Kits in Redions eigener Schale
(E702). Er rechnet den übertragenen Federkern gegen die Dateien des Kits
nach (1953 Punkte, Bit für Bit), und er misst, was ein Finger am Telefon
WIRKLICH sieht: ein Knopf sinkt auch beim kurzen Tipp ein, der Griff eines
Schalters dehnt sich, ein Blatt kommt vom Rand und folgt dem Finger, ein
Reiterwechsel kommt aus der richtigen Richtung, und unter „Ruhig" läuft
nichts mehr. Zwei seiner ersten Proben waren falsch und nicht die App: ein
abgeschalteter Knopf als Probe für das Einsinken, und die Kurve einer
CSS-Animation an der falschen Stelle gelesen. Gezählt am 28. September, im
selben Bogen: der Befehl sagte 522 — auf seinem Zweig; beim Zusammenführen
nachgezählt: 523.*

*Und 524: `test582` — Glas, wo es passt (E703). Er ist der erste Lauf, der
Glas so sieht, wie es auf dem Telefon aussieht: das kopflose Chromium
lässt jede Unschärfe weg, und jedes Bild vorher zeigte die Seite scharf
hinter dem Glas. Er startet es mit SwiftShader und misst zuerst, ob eine
harte Kante hinter einem Menü wirklich zur Rampe wird. Danach liest er
Glas an Pixeln — Docks, Menüs, die untere Leiste, das leichte Glas — über
Weiss, Schwarz, Rot und Blau, in allen zehn Schemata, und legt Toast und
Lader neben die Werkzeuge, um zu sehen, ob sich ihre Rechtecke schneiden.
Gezählt am 28. September, im selben Bogen: `ls pruefungen/lauf/test*.mts |
wc -l` sagte 522 — auf seinem Zweig; beim Zusammenführen nachgezählt: 524.*

*Und 525: `test583` — bessere Stifteffekte beim Zeichnen (E704). Er misst
den Strich, nicht den Quelltext: ob jeder Punkt der Mittellinie eines „M"
in der Tinte liegt, ob ein Keilmarker senkrecht dünn und an den Enden gerade
ist, ob ein schneller Füllerstrich mit demselben Druck dünner ist als ein
langsamer, ob acht Tinten auch für ein farbschwaches Auge auseinanderzuhalten
sind (nachgebildet nach Machado 2009) — und ob ein ALTER Marker Zeichen für
Zeichen so zeichnet wie vorher. Gegen den Stand davor war er zuerst rot. Auf
einem Zweig der Bitte vom 27. September gezählt; wer zusammenführt, zählt neu:
`ls pruefungen/lauf/test*.mts | wc -l` sagte auf diesem Zweig 522; beim
Zusammenführen nachgezählt: 525.*

*Und 526: `test584` — bessere Farben (E705). Er misst nicht Zeilen im
Stilblatt, sondern was der Browser rechnet: jede Farbe läuft durch eine
1×1-Leinwand, damit auch `color-mix(…)` als Zahl ankommt, und seine
Kontrastformel ist bewusst NICHT die aus `colors.ts` — ein Wächter, der mit
dem Code rechnet, den er prüft, sagt zu jedem Rechenfehler „passt". 210
Paare aus zehn Schemata und einundzwanzig Akzenten, die neun Notion-Farben
auf jeder Fläche, Weiss auf Rot, Kästchen im Grundton, die gezeichneten
Reihen eines Diagramms, Whiteboard und Gedankenkarte im Hellen — und ohne
Browser die Stilblätter: keine bunte Farbe von Hand, ausser auf Papier und in
Bildern, jede mit Grund auf der Liste. Gezählt am 28. September, im selben
Bogen: `ls pruefungen/lauf/test*.mts | wc -l` sagte 522 — auf seinem Zweig,
neben `test580` bis `test583` auf den anderen; beim Zusammenführen
nachgezählt: 526.*

*Und 527: `test585` — das Material des Touch Kits überall, wo man wählt
(E706). Er zieht die Pille der unteren Leiste mit einem echten Finger
(CDP-Berührung) über drei Reiter, hält sie an, lässt sie los und zählt die
Klicks, die bis zum Dokument durchkommen: GENAU EINER, auf dem Reiter
darunter. Dazu misst er an den Bildpunkten, ob der aktive Name unter der
Linse in Ruhe 4,5 : 1 schafft, folgt der kurzlebigen Fläche der Umschalter
Bild für Bild bis auf zwei Pixel an ihr Ziel, und prüft dasselbe noch
einmal mit abgeschalteter Bewegung — auf beiden Wegen, der Einstellung des
Systems und „Ruhige Darstellung". Gezählt am 28. September, im selben Bogen:
`ls pruefungen/lauf/test*.mts | wc -l` sagte 522 — auf seinem Zweig; beim
Zusammenführen nach `test580` bis `test584` nachgezählt: 527.*

*Und 528: `test586` — der Löschen-Knopf, der zerfliesst, überall wo
gelöscht wird (E709). Er liest jede `🗑`-Stelle im Quelltext und findet
keinen runden Löschen-Knopf ohne `data-loeschknopf`; dann drückt er im
echten Papierkorb, in den Bereichen der Einstellungen und mit abgeschalteter
Bewegung: der erste Druck löscht nichts und fragt den Browser nicht, der
Fokus steht auf „Abbrechen", EIN Filter im Dokument, an nur während des
Fliessens, Escape schliesst nur das Paar, ein Doppelklick löscht nicht, die
rote Pille löscht genau eines; zurück fliesst es in die Grösse des Knopfs,
ohne Sprung und ohne Blinken, und ein schneller zweiter Druck lässt das neue
Paar offen (Nachtrag 3. Oktober); jede Stelle nennt, was sie löscht, unter
dem ruhenden Zeiger kommt die rote Pille ganz und bleibt lesbar (≥ 4,5 : 1),
und schliesst das Paar von selbst, steht der Fokus wieder am Knopf; in der
Seitenleiste der Bedingten Farbe liegen die Pillen obenauf, und die
Chatliste zeigt ihren Knopf am Rechner erst beim Überfahren (Durchsicht
5. Oktober). Gezählt am 28. September, im selben Bogen:
`ls pruefungen/lauf/test*.mts | wc -l` sagte 528 — auf seinem Zweig (die
zweite Welle zählt der Zusammenführer nach).*

*Und 529: `test587` — die Fragen der Schale im Fenster des Touch Kits
(E710, Stufe 1b von E699). Er stellt `Dialog.frage`, `Dialog.wahl` und
`Dialog.mehrzeilig` wirklich und liest die Antworten zurück (Text, `null`,
`''`, Kennung), öffnet einen Kit-Dialog über einem alten Fenster und misst,
dass beide Systeme dieselbe oberste Ebene sehen (vorher: beide `inert`,
nichts bedienbar), dass Escape genau eines schliesst und Tab im Dialog
bleibt. Am Telefon misst er die Lage (Mitte, Aktionsblatt unten), in allen
zehn Schemata den Kontrast der Knöpfe (Akzent als Schrift, L222 Punkt 6),
dazu „Starker Kontrast ohne Glas", die Scheibe ohne Nebel (E703), die
gefährliche Ja/Nein-Frage mit „Abbrechen" im Fokus, den Rückweg ohne
Inseln, den Zeitmesser auf Escape und die Rundung im Tastaturfokus. Seit
dem Nachtrag vom 4. Oktober (§11) auch die Einzeldatei allein, ohne Netz:
die erste Frage kommt sofort im Kit, der Fokus kehrt nach Escape oder
Antwort zum Knopf zurück, der gefragt hat, und ohne React antwortet das
bisherige Fenster. Seit der Durchsicht vom 5. Oktober (§12) auch, dass die
Knöpfe in der Folge des Aufrufers stehen (sein „Behalten" zuerst und im
Fokus — vorher löschte ein Enter das Blatt), dass ein „Abbrechen" unter der
Kennung `nein` nicht verdoppelt wird, dass eine stolpernde Insel dem
bisherigen Fenster weicht statt die Seite stillzulegen, dass „ruhig" im
selben Bild schliesst und dass der Rückweg für Ja/Nein ein sichtbares
„Abbrechen" hat. Gezählt am 28. September, im
selben Bogen: `ls pruefungen/lauf/test*.mts | wc -l` sagte 528 — auf
seinem Zweig; die zweite Welle zählt beim Zusammenführen neu. Beim Zusammenführen nachgezählt (5. Oktober,
`claude/morgen-besser-2`): 529.*

*Und 530: `test588` — die Suche wächst aus der Kapsel, die Meldungen
stapeln sich (E711, Szenen 07 und 08 aus Redurs Video „Liquid Glass"). Er
folgt der Marke der Suche Bild für Bild und verlangt, dass ↓ dieselben
Knöpfe `[data-i]` stehen lässt (kein Neubau), dass sie über mehrere
Zwischenorte gleitet und genau ankommt — in der Suche, der Befehlspalette
und im Menü mit Suche; dazu das Aufgehen aus der Kapsel (nur `transform`),
die Staffel NUR neuer Treffer, drei Meldungen als Stapel mit `#toast` als
der einen Live-Region, die Glocke, deren Klick WEITER den Posteingang
öffnet und deren Fächer „Alle gelesen" liest statt leert, EINEN Goo-Filter
nur während des Zusammenfliessens, und alles noch einmal ruhig und am
Telefon (langes Drücken). Gezählt am 28. September, im selben Bogen:
`ls pruefungen/lauf/test*.mts | wc -l` sagte 528 — auf seinem Zweig, neben
den anderen Zweigen der zweiten Welle; beim Zusammenführen nachzählen.
Die Durchsicht vom 4. Oktober hat ihm §11 gegeben (keine neue Datei, die
Zahl bleibt): der Fächer geht wieder zu, ein Escape tut eines, die Schrift
auf der Marke hält 4,5 : 1 in allen zehn Schemata, und ein Strich auf der
Tafel unter einer Meldung kommt ganz an. Die vierte Durchsicht vom
5. Oktober §12: im Menü mit Suche bleibt die jetzige Wahl (`.on`) markiert,
der Fächer flackert nicht, solange der Zeiger auf der Glocke ruht, und er
deckt ihre Blase nicht halb zu. Die fünfte am selben Tag §13: der Fächer
deckt die Reihe direkt unter der Glocke nicht zu — „KI" und „Favorit"
bleiben auf dem kürzesten Weg klickbar. Die sechste am Abend §14: wer am
Telefon unter einer Meldung lange drückt und zieht, zieht, was darunter
liegt (die Kladde kam in `test360` nicht mehr an). Beim Zusammenführen nachgezählt (5. Oktober,
`claude/morgen-besser-2`): 530.*

*Und 531: `test589` — Tropfen, Linse und Kacheln aus dem Liquid-Glass-Video
(E712). Er öffnet das „+" und das „⋯" am Rechner und misst, dass das Menü AM
Knopf steht (bis hierher stand das „+"-Menü oben links in der Ecke), dass
oben drei runde Knöpfe von 44 px stehen und darunter jeder Eintrag von
vorher, und dass der EINE Tropfenfilter nur während des Fliessens auf einer
Fläche liegt — in Ruhe auf keiner. Die Linse über „Heute" muss beim
Ankommen gleiten und danach stillstehen; die sieben Glaskacheln in „Mehr"
und in den Einstellungen tun dasselbe wie ihre alten Orte, die bleiben.
Gezählt am 28. September, im selben Bogen: `ls pruefungen/lauf/test*.mts |
wc -l` sagte 528 — auf seinem Zweig, neben den Läufen der zweiten Welle auf
den anderen; beim Zusammenführen nachzuzählen. Beim Zusammenführen nachgezählt (5. Oktober,
`claude/morgen-besser-2`): 531.*

*Und 532: `test590` — die Zeitpille und die Balkenkarte (E713). Er schliesst
den Zeitmesser bei laufender Uhr und verlangt eine Pille über der unteren
Leiste; er tippt sie an und misst im ersten Bild, dass die Karte AUS ihr
wächst (kleiner, bei der Pille) und danach ruht, dass nur `transform` und
`opacity` bewegt werden, dass Escape sie zurück in die Pille bringt und der
Fokus folgt, dass Pause ↔ Weiter im selben Knopf tauscht und das Feld am
Telefon deckend ist — und dasselbe ohne Fahrt, wenn weniger Bewegung
gewünscht ist (System und „Ruhige Darstellung"). Im Lernverlauf zählt er
Knöpfe und Namen, vergleicht die Balkenhöhen mit den echten Zahlen, wählt
einen Tag mit Tipp und Tasten und liest den Hinweis. Seit der Durchsicht
(4./5. Oktober) auch: die Pille liegt auf keinem Werkzeug und kein Toast auf
ihr, der Monatsverlauf zeigt alle dreissig Zahlen, ein zweites Zeichnen
zählt nicht zurück, ihr Name wechselt nicht im Sekundentakt, und Escape
wirkt auch mitten in der Fahrt. Seit der dritten Durchsicht (5. Oktober):
am Telefon liegt kein Toast auf der offenen Karte, und „Beenden" mitten in
der Fahrt lässt keine Pille zurück. Seit der vierten Durchsicht: ohne
Netz liegt der Offline-Streifen nicht auf der offenen Karte. Gezählt am
28. September, im selben Bogen: `ls pruefungen/lauf/test*.mts | wc -l`
sagte 528 — auf seinem Zweig; beim Zusammenführen neu zu zählen. Beim Zusammenführen nachgezählt (5. Oktober,
`claude/morgen-besser-2`): 532.*

*Und 533: `test595` — das Herz ist ein Knopf (E719). Redur, PDF vom
29. September, am Foto der Lernzentrale: „die herz beim hier funktionier
nicht also wenn ich das klicke passiert nichts". Er findet die Karte
„fällige Fehler" und verlangt an ihrem Herz einen `<button>` statt eines
`aria-hidden`-Spans, 44 × 44, mit Namen und `aria-pressed`, und fragt
`elementFromPoint`, was an der Mitte WIRKLICH liegt — gegen den alten
Stand die Karte. Dann schaltet er mit Maus, Enter, Leertaste und
Fingertipp, liest die gemerkte Liste, den Streifen „Gemerkt" auf Heute,
lädt neu, nimmt es wieder heraus, lässt das Schreiben scheitern (Knopf
zurück, Hinweis da) und prüft, dass ohne Bewegung nichts springt. Drei
seiner Zusagen kamen erst, als eine Gegenprobe GRÜN blieb: die Form schon
in Ruhe, kein zweites gemaltes Herz, und in `test580` §5 der Fokus weg vor
dem Messen. Gezählt am 6. Oktober, im selben Bogen: `ls
pruefungen/lauf/test*.mts | wc -l` sagt 533 — auf seinem Zweig; beim
Zusammenführen neu zu zählen.*

*Und 534: `test596` — kein toter Knopf (E720). Redur: „beim fählermeldung
habe ich keien buttons efeck also wie bein tagesrunde … und bei alle wo eine
buttons gibt füge das im enscheideung und claude.md". Sein Kern ist ein
ZENSUS: jeder sichtbare, freigegebene Knopf in sechs Ansichten der Lernwelt,
hell und dunkel, Zeiger darauf, die gemalten Eigenschaften davor und danach
— gegen den alten Stand 63 tote Knöpfe je Thema, 44 davon die Tagessäulen
aus E713, die der Plan noch nicht kannte. Dazu: der Tastenfokus der fünf
Startknöpfe, „Trainieren" unter dem Zeiger Wert für Wert wie „Starten", in
Ruhe nur eine laute Fläche, `data-gedrueckt` ALLEIN zeigt sich, und ein
erzwungenes `:hover` malt am Telefon keinen Schein. Sein erster Entwurf von
§7 war gegen den alten Stand grün — die Nachbildung malt `:active`, wo das
iPhone es nicht tut. Gezählt am 6. Oktober, im selben Bogen: der Befehl
sagt 534 — auf seinem Zweig; beim Zusammenführen neu zu zählen.*

### Die Befehle

```txt
npm install                          einmalig (auch Vite und React, E699)
npx playwright install chromium      einmalig
npm run typecheck                    Typen (ändert nichts, prüft alles —
                                     auch die Inseln: tsconfig.islands.json)
npm run bauen:ts                     IN DIESER FOLGE: 1. die Inseln
                                     (bauen-inseln.mts → quell/fremd/react/,
                                     quell/islands/), 2. src/**.ts →
                                     quell/**.js, 3. dienststand.mts rechnet
                                     den Grundstock, 4. stand.ts und sw.js
npm run bauen:inseln                 nur die Inseln (Teil von bauen:ts)
npm run stand                        danach: prüft den Dienststand nach
node bauen.mts                       danach: redion-einzeldatei.html
npm run pruefen -- --schnell         ohne die Messläufe (Dauer ungemessen)
npm run pruefen                      alle 534 Läufe
node pruefungen/alle.mts 87 100 105  einzelne Läufe, Nummern ohne "test"
```

Die Folge ist keine Formsache: der Dienststand rechnet die Bytes des
Grundstocks, und darin stehen die Inselbündel. Wer die Inseln nach dem
Dienststand baut, liefert einen Dienst aus, der die alten Bytes für neu
hält (E361, E699). Und die Einzeldatei setzt die Bündel ein — also zuletzt.

Die Dateien heissen **`.mts`**, nicht `.mjs` — seit E28 gibt es keine von
Hand geschriebene `.js` mehr im Projekt (§54).

### Der volle Lauf läuft in Stücken

Ein voller Lauf dauert länger, als eine Sitzung sicher steht. Er wird
deshalb **in Stücken und wiederaufnehmbar** gefahren: zehn Läufe je Stück,
eine Merkdatei hält fest, welche Stücke fertig sind. Bricht die Sitzung ab,
geht nur das laufende Stück verloren, nicht die Stunde davor.

**Und dafür gibt es seit dem 20. September ein Werkzeug** (E657). Vorher war
dieser Absatz ein Handgriff: zehn Nummern abtippen, warten, die nächsten
zehn abtippen — und im Kopf behalten, wo man war. Genau das ist beim
vorletzten vollen Lauf schiefgegangen.

```txt
node pruefungen/volllauf.mts            weitermachen, wo es aufhörte
node pruefungen/volllauf.mts --neu      von vorne, Merkdatei verwerfen
node pruefungen/volllauf.mts --stand    nur sagen, wie weit es ist
node pruefungen/volllauf.mts --rot      nur die roten Läufe wiederholen
node pruefungen/volllauf.mts --stueck 5 Stückgrösse ändern (Vorgabe 10)
```

Die Merkdatei heisst `pruefungen/.volllauf-stand.json` und steht in
`.gitignore`: sie sagt, wie weit DIESER Rechner gekommen ist. Geschrieben
wird sie **nach jedem Stück**, nicht am Ende — sonst wäre bei einem Abbruch
genau das verloren, wogegen sie gebaut wurde. Und sie verträgt eine Liste,
die sich unterwegs ändert: ein Prüflauf, der mitten im Sweep entsteht,
gehört dazu und ist noch nicht fertig.

**Der Arbeitsbaum braucht den Commit.** Ein `git worktree` enthält, was
eingecheckt ist — ein Werkzeug, das noch im Hauptbaum liegt, gibt es dort
nicht. Der erste Versuch am 20. September scheiterte genau daran, nach
vier Sekunden: `Cannot find module …/pruefungen/volllauf.mts`.

Gefahren wird er in einem eigenen Arbeitsbaum (`git worktree`), damit im
Hauptbaum weitergearbeitet werden kann, während er läuft. Das Vorspulen von
`main` passiert dagegen **immer im Hauptbaum**.

**Aber im Hauptbaum wird dabei kein Prüflauf gestartet.** Weitergearbeitet
heisst: schreiben, lesen, bauen — nicht prüfen. Jede Suite hält einen festen
Port; zwei Läufe mit derselben Zahl machen einander rot, und `test400` nennt
den Fall vom 4. September beim Namen: ein ganzes Stück rot, und nichts daran
war ein Fehler im Produkt. Am 19. September ist es wieder passiert, diesmal
mir: vier Stücke waren im vollen Lauf rot und einzeln grün.

**Und der Arbeitsbaum ist nicht der Hauptbaum.** Zwei Unterschiede, beide
gemessen, beide können einen dateilesenden Lauf täuschen:

```txt
.git           im Arbeitsbaum eine DATEI (52 Bytes, „gitdir: …"), kein Ordner
node_modules   muss von Hand verlinkt werden — ein Symlink, kein Ordner
```

`test270` filtert Ordnermuster mit `istOrdner && name === …` und meldete
deshalb im Arbeitsbaum, `.git` und `node_modules` gingen mit ins Netz.
`.assetsignore` schliesst beide korrekt aus. **Ein roter Lauf aus dem
Arbeitsbaum wird im Hauptbaum nachgemessen, bevor jemand ihn repariert.**

### Wann welche Prüfung Pflicht ist

| Geändert wurde … | dann muss laufen |
|---|---|
| Speicher | ein Prüflauf dafür |
| Import oder Export | `test100` und ein eigener |
| Rechte | ein Rechtefall-Prüflauf |
| Formeln | ein Formel-Prüflauf mit Grenzfällen |
| Backup | `test96`, `test100` |
| grosse Dateien | ein echter grosser-Blob-Fall |
| etwas mit mehreren Tabs | ein Zwei-Tab-Fall |

**Keine Mocks, wenn die echte App geprüft werden kann.**

Und: Wenn ein Fehler gefunden wird, wird **zuerst** ein Prüflauf geschrieben
oder ein bestehender erweitert — dann die Reparatur. Sonst weiss niemand, ob
der Lauf die Sache wirklich hält (§55.2).

---

## 31. Die Prüfläufe, die man kennen muss  **[Richtwert]**

Von 534 Läufen sind diese sechs die, die man beim Namen kennt:

| Lauf | Was er hält |
|---|---|
| `test87` | Steuerzeichen, Rollen Oberfläche↔Server, die A1/A2-Grenze, Stilblätter, Manifest, `esc` — **nicht** §5 Regel 1, siehe dort |
| `test96` | der Fund, dass Anhänge bei der JSON-Sicherung fehlten oder leer wurden |
| `test100` | `.redion` mit echten Bytes: sichern, löschen, zurückholen, vergleichen |
| `test105` | dass jede `.ts` ihr gebautes `.js` hat und `tsconfig.bauen.json` vollständig ist |
| `test109` | dass kein neues JavaScript entsteht (§54) und `js-bestand.json` nur schrumpft |
| `test537` | dass kein Bereich einen anderen NEU anfasst (§5 Regel 1) — `bereiche-bestand.json` nur schrumpft |

**Diese Läufe nicht entfernen.** Bei Änderungen an Backup, ZIP oder Dateien
zuerst `test96` und `test100` ansehen.

Der Rest ist nicht weniger wert — er ist nur zahlreicher als merkbar. Wer
sucht, wo etwas geprüft wird, sucht im Quelltext, nicht in dieser Liste.

---
---

# Teil VII — Was aufgeschrieben wird

## 32. Doku-Regeln  **[hart]**

**Dokumentation ist Teil des Produkts.**

| Datei | Wofür |
|---|---|
| `README.md` | für den Nutzer (§33) |
| `AUFGABEN.md` | **nur** was offen ist |
| `ERLEDIGTE-AUFGABEN.md` | was fertig ist, mit Fund, Bau und Prüfung |
| `LUECKEN.md` | was im Produkt fehlt (§35) |
| `ENTSCHEIDUNGEN.md` | warum etwas so ist (§34) |
| `messungen.md` | was gemessen wurde: Zahl, Fenster, Datum, Methode (§36, §55.2) |
| `UR.md`, `PROBLEME.md` | das Gedächtnis — erzeugt aus `chronik/chronik.json` (§56) |
| `CLOUDFLARE.md`, `SERVER-EINRICHTEN.md` | die Wolke einrichten |
| `START-MIT-CLAUDE-CODE.md` | wie hier gearbeitet wird |
| `doku/ARCHITEKTUR.md` | wie es aufgebaut ist |
| `doku/REDION-FORMAT.md` | das `.redion`-Format von innen |
| `doku/TYPESCRIPT-MIGRATION.md` | die Reihenfolge der Migration |
| `doku/REDION-PLATTFORM-AUDIT.md` | der Bestand vor dem Plattform-Umbau: Systeme, Duplikate, Messungen (E681) |
| `doku/karte/` | die Karte des Quelltexts — **erzeugt** aus `doku/karte/karte.json` mit `node karte.mts`; wer sie ändert, ändert das JSON |
| `FREMDCODE.md` | jedes fremde Stück Code: Herkunft, Fassung, Lizenz, Nutzen, Änderungen, Wächter (§57) |

Regeln:

- Entscheidungen kommen in `ENTSCHEIDUNGEN.md`, Lücken in `LUECKEN.md`,
  Aufgaben in `AUFGABEN.md`.
- Wolke und Server nicht nur im Kopf planen.
- Das `.redion`-Format dokumentieren.
- Das README nicht mit internen Details überladen, aber wichtige
  Nutzerfunktionen nennen.
- **Keine falschen Versprechen.**

---

## 33. README-Regeln  **[Richtwert]**

Das README soll erklären: was Redion ist · wie man es startet · was lokal
ist · was optional Server und Wolke sind · wie man sichert · was `.redion`
ist · wo die Grenzen sind · wie man prüft · wo der Code liegt.

Es soll **nicht**: Unfertiges als fertig verkaufen · eine Wolkenpflicht
suggerieren · die lokale Nutzung kleinreden · Sicherheitsrisiken
verschweigen.

---

## 34. Entscheidungen dokumentieren  **[hart]**

Jede technische Entscheidung kommt in `ENTSCHEIDUNGEN.md` — auch die, die
sich beim Nachsehen als „war längst so" herausstellt.

Der Eintrag beantwortet: **Was wurde entschieden? Warum? Was war die
Alternative? Was kostet es?**

Beispiele, die dort stehen:

- Warum `.redion` statt Base64-JSON? (E38)
- Warum kein ZIP64? (E39)
- Warum löscht `.json` vorhandene Anhänge nicht? (E40)
- Warum bleiben Kennungen beim Import erhalten?
- Warum bleibt der Server optional?
- Warum werden D1 und R2 getrennt?

`ENTSCHEIDUNGEN.md` hat vorne ein **Inhaltsverzeichnis** aller Einträge.
Ein neuer Eintrag kommt in beides: in das Verzeichnis und in den Text.

---

## 35. Lücken dokumentieren  **[hart]**

Wenn etwas fehlt, wird es nicht versteckt, sondern in `LUECKEN.md`
eingetragen: fehlende Prüfungen · bekannte Grenzen · offene
Sicherheitsfragen · fehlende Oberfläche · Leistungsrisiken · Cloudflare-Reste
· Rechte-Lücken · Import-/Export-Lücken.

> **Eine bekannte Lücke ist besser als ein stiller Fehler.**

Und eine geschlossene Lücke wird als **GESCHLOSSEN** eingetragen, mit Beleg
— nicht gelöscht. Wer sie später sucht, soll finden, warum sie weg ist.

---
---

# Teil VIII — Oberfläche für Menschen

## 36. Performance-Regeln  **[Richtwert]**

Redion soll auch auf schwächeren Geräten laufen.

- Grosse Dateien nicht vollständig in den RAM laden.
- Lange Arbeit in Stücke teilen.
- Die Oberfläche nicht blockieren.
- Grosse Listen virtualisieren oder begrenzen, wenn nötig.
- Suchindizes nicht unnötig neu bauen.
- **WebLLM nicht automatisch laden.**
- Datenbankansichten nicht unnötig komplett neu rendern.
- Speicherverbrauch bei Export und Import messen.
- Mobile Geräte beachten: was auf dem Rechner flüssig ist, ist es dort
  nicht (§37).

**Und die Regel über den Regeln:** erst messen, dann bauen. L103 Punkt 2
stand ein Jahr als „bei OCR über achtzig Seiten ruckelt die App" in der
Liste — nachgemessen waren es flache 8 ms je Schritt, und nur 15 % davon
überhaupt das, was ein Worker hätte übernehmen können. Eine Vermutung im
Leistungskapitel kostet Wochen.

---

## 37. Mobile-Regeln  **[hart im Kern]**

E37: **Das Telefon ist der Normalfall, nicht der Sonderfall.**

**Hart:**

- **44 px Mindestgrösse auf den Hauptwegen.** Was der Nutzer täglich trifft
  — Werkzeuge, Hauptmenü, untere Leiste, Bestätigen und Abbrechen — misst
  44 px, ohne Ausnahme.
- Kein Desktop-only für Kernfunktionen.
- Dialoge müssen auf kleine Bildschirme passen.
- Die Werkzeugleiste darf nicht verdecken, was sie bedient.
- Grosse Sicherungen dürfen das Telefon nicht abstürzen lassen.

**Richtwert:**

- **Nebenwege dürfen 32 px sein** — Brotkrume, Fusszeile, Zusatzzeichen in
  einer Zeile, die man selten trifft. Aber: mit einem geschriebenen Grund an
  Ort und Stelle, nicht stillschweigend. Wer 32 px setzt, schreibt daneben,
  warum dieser Weg ein Nebenweg ist.
- Side Peek darf mobil nicht unbedienbar werden.
- Die Bildschirmtastatur beachten.

Der Grund für die Trennung: Eine 44-px-Regel ohne Ausnahme führt dazu, dass
eine Brotkrumenzeile mit fünf Stufen höher wird als der Inhalt darunter.
Eine 44-px-Regel *mit* stiller Ausnahme führt dazu, dass irgendwann der
Speichern-Knopf 28 px hat. Deshalb: Ausnahme ja, still nein.

---

## 38. Barrierefreiheit  **[hart im Kern]**

**Hart:**

- Jeder Knopf hat Text oder `aria-label`.
- Der Fokus ist sichtbar.
- Die Tastaturbedienung bleibt erhalten.
- **Keine Information nur über Farbe.**
- Escape schliesst das passende Overlay (E302 hat den gemeinsamen Griff
  gebaut, L105 Punkt 1).
- **Jeder Knopf antwortet sichtbar auf Zeigen, Druck und Tastenfokus —
  keiner wirkt tot (E720).** Zeigen, wo es einen Zeiger gibt; Druck mit
  Maus und Finger, auch beim kurzen Tipp (`data-gedrueckt` aus press.ts);
  Tastenfokus immer. Dieselbe Art Handlung nimmt dasselbe Bauteil: wer
  etwas ANFÄNGT, ist ein Funkel — still in Ruhe, der Schein als Zustand.
  Redur, 29. September: „bei alle wo eine buttons gibt füge das im
  enscheideung und claude.md". Der Wächter ist `test596` (zuerst die
  Lernwelt; der Rest der App steht als L240).

**Richtwert:**

- Kontrast im Hell- und Dunkelmodus prüfen.
- Dialoge fokussierbar machen.
- Screenreader nicht durch leere Zeichen verwirren.

---

## 39. CSS-Regeln  **[Richtwert]**

Stil bleibt in Stil-Dateien unter `quell/schale/stil/`. **Keine grossen
Inline-Style-Blöcke.**

- Hell und Dunkel sauber getrennt halten.
- **Gemeinsame Tokens nutzen — und nur die, die es gibt.** `--akzent`,
  `--flaeche-2` und `--bg-2` wurden je zweimal erfunden und waren je zweimal
  unsichtbar. Die echten Namen stehen in `bausteine.css`; wer einen neuen
  braucht, legt ihn dort an, statt ihn zu erraten.
- Kein neues Designsystem ohne Grund.
- Notion-artige Klarheit vor Effekten.
- Animationen sparsam; `prefers-reduced-motion` respektieren.
- Namensräume trennen (`doku/CSS-NAMENSRAEUME.md`) — zwei Bereiche mit
  demselben Klassenpräfix gewinnen abwechselnd, und niemand sieht es im Code.
- **Zustandsregeln wiegen mindestens so viel wie die Grundregel — kein
  `:where()` um den Knopf-Teil von `:hover`, `:active` oder
  `:focus-visible` (E720).** `:where()` hat das Gewicht null; siebzehn
  Knöpfe der Lernwelt blieben so unter dem Zeiger, wie sie waren, weil
  ihre Grundregel (0,2,1) die Hover-Regel (0,2,0) schlug (der Plan hatte
  zwanzig geschätzt, gemessen waren es siebzehn — messungen §90). `:is()`
  nimmt das Gewicht seines schwersten Arguments. Und ein gesperrter Knopf
  antwortet gar nicht: `:where(:not(:disabled))` vor dem Zustand schliesst
  ihn aus, ohne die Rangfolge zu verschieben — dort, wo es KEIN Gewicht
  tragen soll, ist `:where()` genau richtig (test596 §9).

---
---

# Teil IX — Sicherheit ausserhalb des Browsers

## 40. Server-Sicherheitsregeln  **[hart]**

Für `server/` und Cloudflare:

- Eingaben validieren.
- JSON-Grössen begrenzen.
- Rate-Limits einplanen.
- CORS strikt halten.
- **Keine offenen Admin-Endpunkte.**
- Tokens hashen.
- Keine Geheimnisse committen (§42).
- Fehler nicht mit internen Details an den Nutzer senden.
- D1-Abfragen sicher bauen (Parameter, keine Zeichenkettenklebe).
- **Rechte serverseitig prüfen** (§26) — die Oberfläche ist kein Schloss.
- Öffentliche Seiten getrennt behandeln.
- Uploads validieren, soweit möglich.
- Dateinamen säubern; **Pfad-Traversal verhindern.**

---

## 41. Bridge-Regeln  **[hart]**

Für Bridge- und Proxy-Funktionen gilt eine einzige Leitfrage: *Kann jemand
damit auf etwas zugreifen, das ihm nicht gehört?*

- **Keine offene Proxy-Schleuder bauen.**
- Nur erlaubte Hosts (Allowlist), Pfade prüfen, Header begrenzen.
- Auth-Header nicht unnötig weiterreichen.
- **Keine privaten lokalen Ziele erlauben** (`localhost`, `127.*`, `10.*`,
  `192.168.*`, `169.254.*`).
- Keine beliebigen URLs.
- CORS nicht wild öffnen.
- Prüfläufe für die Allowlist.

---

## 42. Secrets-Regeln  **[hart]**

**Niemals ins Repository:** API-Schlüssel · Tokens · Passwörter · private
URLs · persönliche Zugangsdaten · Cloudflare-Geheimnisse · OAuth Client
Secrets.

Beispiele gehören in `.env.beispiel`. Echte Geheimnisse gehören in eine
lokale `.env`, in Cloudflare Secrets (`wrangler secret put`) oder in eine
sichere Passwortverwaltung.

**Was kein Geheimnis ist:** die `database_id` in `wrangler.toml`. Sie ist
eine Adresse, kein Schlüssel, und sie gehört ins Repository — sonst kann
niemand die Wolke aufsetzen.

**Was das Repository nie sehen darf**, weil es öffentlich ist: `*.redion`,
`.env.*`, `.dev.vars*`. Sie stehen in `.gitignore`, und dort bleiben sie.

---
---

# Teil X — Wie gearbeitet wird

## 43. Git-Regeln  **[hart]**

- **Nicht wild auf `main` arbeiten.** Gearbeitet wird auf einem Zweig.
- Kleine Zweige, kleine Änderungen. **Eine Änderung = ein klares Ziel.**
- Prüfläufe nennen. Risiken nennen.
- Keine generierten Grossdateien ändern, wenn nicht nötig.
- Wenn `redion-einzeldatei.html` neu gebaut wurde: sicherstellen, dass sie
  zur Quelle passt (§29).
- **Keine fremden Projekte anfassen** (§1).
- Kein `git push --force`. Kein `git reset --hard`, kein `git clean`, kein
  `git restore .` — sie löschen Arbeit, die niemand mehr wiederbekommt.
- **Nichts löschen ohne Rückfrage.** Auch keine Datei, die überflüssig
  aussieht.

**Ein Zweig, ein Push, dann ein neuer Zweig** (Redur, 9. September 2026,
E521). Sobald ein Zweig gepusht ist, gilt er als abgeschlossen; die nächste
Arbeit beginnt auf einem frischen. Der Grund ist derselbe wie bei „kleine
Zweige" eine Zeile höher, nur konsequent zu Ende gedacht: ein Zweig, auf den
immer weiter geschoben wird, verliert seinen Namen — er heisst nach dem
ersten Bogen und trägt den zwanzigsten. Wer dann sagt „hol mir den Zweig X",
weiss nicht mehr, was darin steht.

Was das NICHT heisst: den alten Zweig löschen oder umschreiben. Er bleibt
stehen, wo er steht (§43 oben). Der neue beginnt genau auf seinem Stand.

`main` wird erst vorgespult, wenn ein **voller Lauf grün** ist (§46).

---

## 44. PR-Regeln  **[Richtwert]**

Ein Pull Request wird nur geöffnet, wenn Redur ausdrücklich darum bittet.
Wenn einer geöffnet wird, beantwortet er:

```txt
Was wurde geändert?          Welche Risiken?
Warum?                       Welche Daten können betroffen sein?
Welche Dateien?              Ist Import/Export betroffen?
Welche Prüfläufe?            Ist Server/Wolke betroffen?
                             Ist redion-einzeldatei.html betroffen?
```

Bei Daten- oder Speicheränderungen zusätzlich:

```txt
Wie wird Datenverlust verhindert?
Wie werden alte Daten migriert?
Wie wird Rückwärtskompatibilität behandelt?
```

---

## 45. Reihenfolge bei Arbeit  **[Richtwert]**

```txt
1. Bestehenden Code lesen.
2. Bestehende Doku lesen.
3. Die zuständigen Prüfläufe finden.
4. Einen kleinen Plan machen.
5. Eine kleine Änderung machen.
6. Prüfläufe ausführen.
7. Doku aktualisieren.
8. Das Ergebnis kurz beschreiben.
```

**Nicht:** zuerst gross umbauen · Prüfläufe ignorieren · Doku hinterher
vergessen · mehrere Themen vermischen.

Und der Schritt, der am häufigsten fehlt, ist Schritt 1. Der teuerste
wiederkehrende Fehler dieses Projekts war, eine Schnittstelle **aus dem
Gedächtnis** zu schreiben statt sie nachzuschlagen (E21). Der zweitteuerste
war, eine Sache an einer Stelle zu reparieren und die Nachbarstelle nicht
anzusehen.

---

## 46. Prioritäten  **[hart]**

```txt
1. Daten sicher halten
2. App startet zuverlässig
3. Import / Export / Backup vollständig
4. Editor und Datenbanken stabil
5. Server und Wolke optional und sicher
6. neue Funktionen
```

**Neue Funktionen sind weniger wichtig als Datenintegrität.**

### Und was gilt, wenn etwas rot ist

**Rot zuerst.** Ein roter Prüflauf wird vor dem nächsten Bogen angesehen —
nicht danach, nicht „wenn Zeit ist".

Aber: **ein fertiger, grüner Bogen darf landen**, auch während anderswo
etwas rot ist. Er auf dem Zweig festzuhalten macht das Rote nicht grüner,
und je länger er wartet, desto schwerer wird sein Zusammenführen.

**`main` bewegt sich nicht**, solange etwas rot ist. Der Zweig darf wachsen,
`main` bleibt stehen, bis ein voller Lauf grün ist. So ist immer klar, was
der letzte geprüfte Stand war — und `holen.bat` gibt genau den heraus (L83).

---

## 47. Nicht tun  **[hart]**

Die Kurzliste. Jeder Punkt hat oben seinen Abschnitt:

| Nicht tun | Warum, siehe |
|---|---|
| React als zweite Oberfläche einbauen (eigene Seite, Router, eigene Schale, eigener Datenweg) — erlaubt sind nur Inseln an Ort und Stelle | §6 (E699; E80s Einwand als Regel, `test578`) |
| React beim Start laden oder unter `dependencies` führen | §6, §36 (E699, `test388` §5, `test109`) |
| die App von einem Bauschritt abhängig machen | §6, §52.4 |
| IndexedDB durch LocalStorage ersetzen | §10 |
| grosse Dateien in JSON/Base64 sichern | §9, §11 |
| `eval()` für Formeln verwenden | §20 |
| Bereiche direkt koppeln | §5 Regel 1 |
| den Server zur Pflicht machen | §22 |
| Wolken-Abgleich automatisch aktivieren | §24 (E1/E34) |
| private Daten ungefragt hochladen | §21, §24 |
| Anhänge bei JSON-Import löschen | §11 (`test96`) |
| Datei-Kennungen beim Import brechen | §14 |
| Sicherheitswarnungen entfernen | §19 |
| Prüfläufe löschen, weil sie stören | §30, §31 |
| im README versprechen, was nicht läuft | §33 |
| Geheimnisse committen | §42 |
| etwas löschen ohne Rückfrage | §43 |

---

## 48. Wichtige aktuelle Baustellen  **[Richtwert]**

Dieser Abschnitt ist bewusst **kurz**, weil er sonst mit der Wirklichkeit
auseinanderläuft. Die gepflegte Liste steht in `AUFGABEN.md` (offen) und
`LUECKEN.md` (Produktlücken).

Stand 3. September 2026 ist das Grosse offen:

1. **Cloudflare wirklich aufsetzen.** Geschrieben und geprüft ist alles;
   gegen einen echten Dienst lief es nie. Braucht Redurs Konto — der einzige
   Punkt, den kein Prüflauf im Container erledigen kann (L82 Punkt 1).
2. **Der Rest am Telefon** (L10): Termine und Eingang mit eigenem Aufbau,
   die übrigen Menüs als Bottom Sheets, Feinschliff im Editor.
3. **Der Wolken-Arbeitsbereich als eigenes Konzept** (L7). Setzt Punkt 1
   voraus.

---

## 49. Empfohlene nächste Arbeiten  **[Richtwert]**

Die vier Arbeiten, die hier ein Jahr lang standen, **sind erledigt**:

| Stand hier | Heute |
|---|---|
| README um `.redion` ergänzen | steht drin |
| `doku/REDION-FORMAT.md` erstellen | gibt es |
| Cloudflare/R2-Plan mit `.redion` zusammendenken | steht in `CLOUDFLARE.md` (D1 für Daten, R2 für Anhänge, `.redion` als Offline-Download) |
| CLAUDE.md aktuell halten | dieser Durchgang |

Der Absatz bleibt trotzdem stehen, und zwar als **Regel statt als Liste**:

> Diese Datei muss mit den Entscheidungen wachsen. Eine Empfehlung, die
> erledigt ist, wird als erledigt eingetragen — nicht stehen gelassen. Vier
> Jahre alte „nächste Arbeiten" lenken die Arbeit auf etwas, das es nicht
> mehr gibt.

---

## 50. Definition von fertig  **[hart]**

Eine Änderung ist erst fertig, wenn:

- die App startet;
- die zuständigen Prüfläufe laufen;
- keine bekannten Datenverluste entstehen;
- bei Import/Export: **beides geprüft**;
- bei Backup: **`.json` und `.redion` geprüft**;
- bei grossen Dateien: ein echter grosser Blob geprüft;
- bei Server: Rechte und Sicherheit geprüft;
- bei Doku-Betroffenheit: die Doku aktualisiert;
- bei Gestaltung: **ein Bild angesehen** (§55);
- keine unnötigen Abhängigkeiten dazugekommen sind;
- die Architekturregeln eingehalten sind (§5).

Und wenn ein neuer Wächter gebaut wurde: **er ist rot gewesen.**
Zurückdrehen, rot sehen, wieder einsetzen. Ein Wächter, der nie rot war,
ist eine Behauptung (§55.2).

---

## 51. Wichtigster Satz  **[hart]**

> **Redion darf lieber langsamer neue Funktionen bekommen, als jemals
> Nutzerdaten zu verlieren.**

---
---

# Teil XI — TypeScript

## 52. TypeScript-Ziel und Code-Stil  **[Richtwert]**

Redion soll langfristig vollständig auf TypeScript umgestellt werden — professionell, wartbar und ähnlich sauber wie BABAT-RED.

Das Ziel ist:

```txt
TypeScript
klare Typen
modulare Struktur
Build-System
Tests
Cloudflare-kompatibel
weiterhin local-first
weiterhin offlinefähig
weiterhin exportierbar
```

Wichtig: Die Migration darf Redion nicht kaputt machen. TypeScript ist Ziel, aber Datenintegrität ist wichtiger als Geschwindigkeit.



### 52.1 Grundsatz

Claude soll neuen Code bevorzugt in TypeScript schreiben.

Neue Dateien sollen, wenn möglich, diese Endungen nutzen:

.ts
.tsx nur für die React-Inseln, und nur unter src/islands/

Diese UI-Schicht mit JSX ist seit E699 bewusst eingeführt: die Inseln aus
Redurs Touch Kit. Ihr TSX baut `bauen-inseln.mts` (Vite) zu klassischen
Skripten nach `quell/islands/`; geprüft wird es mit `tsconfig.islands.json`
(die Schalter des Kits — die Abweichung von 52.6 steht in E699 und L222;
Redions eigener Inselcode hält die strengen Schalter, `test578` §8).
Ausserhalb von `src/islands/` gibt es kein `.tsx`.

Für normalen Redion-Code gilt:

.ts



### 52.2 Migration nicht auf einmal

Nicht erlaubt:

gesamtes Projekt in einem PR auf TypeScript umstellen
alle Dateien gleichzeitig umbenennen
Build-System ohne Fallback erzwingen
bestehende App unstartbar machen
redion-einzeldatei.html kaputt machen
IndexedDB-Datenmodell ungetestet ändern

Erlaubt und gewünscht:

schrittweise Migration
erst Typen einführen
dann Kernmodule migrieren
dann Tests migrieren
dann UI-Schicht migrieren
dann Build-Ausgabe stabilisieren



### 52.3 Zielstruktur mit TypeScript

Langfristige Zielstruktur:

src/
  main.ts
  app/
    start.ts
    router.ts
    shell.ts
  core/
    storage/
      indexedDb.ts
      migrations.ts
      exportImport.ts
      redionPackage.ts
      zip.ts
      files.ts
    blocks/
      blockTypes.ts
      blockTree.ts
      blockOps.ts
    databases/
      schema.ts
      views.ts
      filters.ts
      sorts.ts
      formulas/
        tokenizer.ts
        parser.ts
        runtime.ts
        functions.ts
    events/
      bus.ts
      events.ts
    sync/
      syncEngine.ts
      conflicts.ts
      changes.ts
    security/
      crypto.ts
      sanitize.ts
      permissions.ts
    settings/
      settings.ts
      defaults.ts
    utils/
      id.ts
      dates.ts
      objects.ts
      debounce.ts
      errors.ts
  registry/
    blocks.ts
    modules.ts
    navigation.ts
    properties.ts
    views.ts
    formulas.ts
    commands.ts
    shortcuts.ts
    templates.ts
    connections.ts
  areas/
    editor/
    databases/
    knowledge/
    ai/
    files/
    templates/
    comments/
    mentions/
    pages/
    planning/
    settings/
    help/
  styles/
  tests/

Während der Migration darf die alte Struktur weiter existieren:

quell/

Aber neue TypeScript-Struktur soll geordnet aufgebaut werden.



### 52.4 Kompatibilitätsregel

Solange Redion noch migriert wird, muss mindestens eine stabile Startart funktionieren:

index.html

oder:

redion-einzeldatei.html

Wenn ein Build-System eingeführt wird, muss dokumentiert sein:

npm install
npm run build
npm run pruefen

Die gebaute App muss weiterhin ohne Entwicklungsserver nutzbar sein.



### 52.5 Build-System

TypeScript darf mit einem Build-System eingeführt werden.

Bevorzugt:

Vite
TypeScript
Vitest oder bestehende Node/Playwright-Tests
Playwright

Aber keine unnötige Framework-Pflicht.

Erlaubt:

typescript
vite
vitest
playwright

Nur mit Begründung:

React
React DOM
große UI-Libraries
State-Management-Libraries
Routing-Libraries
CSS-Frameworks

Wenn React eingeführt werden soll, muss zuerst eine eigene Entscheidung dokumentiert werden:

ENTSCHEIDUNGEN.md

Denn Redion ist nicht automatisch BABAT-RED. TypeScript ja, aber React nur nach Plan.

**Der Plan steht seit dem 27. September 2026: E699.** Vite 8.3.1, React und
React DOM 19.3.0 sind genau festgenagelt unter `devDependencies` — als
Werkstoff für `bauen-inseln.mts`, nicht als Laufzeitpaket (`dependencies`
bleibt leer, `test109`). Kein `@vitejs/plugin-react`: Vite übersetzt TSX
selbst, gemessen Byte für Byte gleich. Kein Router, keine
State-Management-Bibliothek, kein CSS-Framework. Die Befehle stehen in §30
(„Die Befehle"); für die NUTZUNG braucht es keinen davon (52.4).



### 52.6 TypeScript-Konfiguration

Das hier ist kein Ziel mehr, sondern der Stand. `tsconfig.json` prüft und
baut nichts (`noEmit`); gebaut wird nur über `tsconfig.bauen.json`.

```jsonc
"target": "ES2022",
"module": "ESNext",
"moduleResolution": "Bundler",
"noEmit": true,

"strict": true,
"noUncheckedIndexedAccess": true,     // der teuerste Fehler dieser App
"exactOptionalPropertyTypes": true,
"useUnknownInCatchVariables": true,
"noImplicitOverride": true,
"noFallthroughCasesInSwitch": true,
"noImplicitReturns": true,
"noUnusedLocals": true,               // siehe unten
"noUnusedParameters": true
```

`noUncheckedIndexedAccess` ist die Einstellung, die den Fehler findet, der
hier am meisten gekostet hat: auf ein Feld zugreifen, das es vielleicht
nicht gibt, und mit `undefined` weiterrechnen.

**`noUnusedLocals` hat eine Nebenwirkung, die man einmal erlebt haben muss.**
Wer einen Wächter gegenprüft, indem er eine Zeile herausnimmt (§55.2), nimmt
damit manchmal die letzte Verwendung einer Konstanten weg — und dann baut
der Zweig gar nicht mehr. Eine Gegenprobe, die nicht baut, ist keine
Gegenprobe: es muss die Konstante mit weg oder die Zeile anders verstümmelt
werden.

Wenn eine Datei nicht sofort streng typisierbar ist: erst isolieren, dann
typisieren — und **nicht überall `any` verteilen** (§52.7).



### 52.7 any-Regel

any ist nur als Übergang erlaubt.

Bevorzugt:

unknown
Record<string, unknown>
konkrete Interfaces
Union Types

Nicht dauerhaft:

any

Wenn any nötig ist, Kommentar schreiben:

// TODO(ts-migration): alter Datenbestand, Typ wird in Phase X ersetzt.



### 52.8 Zentrale Typen

Zentrale Typen stehen in:

src/core/types/

Dort ist die Wahrheit, nicht hier. Diese Beispiele zeigen die Form; wenn beide
je auseinandergehen, gilt der Ordner.

Typnamen sind englisch. Feldnamen sind es nicht — sie heissen so, wie sie in
IndexedDB gespeichert sind. Ein Feldname im Typ, der nicht dem gespeicherten
Feld entspricht, ist keine Übersetzung, sondern eine falsche Behauptung, und
ihn zu ändern wäre eine Datenmigration.

export type ID = string
export type ISODateTime = string

export type BlockId = ID
export type PageId = ID
export type CollectionId = ID
export type ViewId = ID
export type FileId = ID

Ein Block, abgelesen aus quell/kern/ablage/indexdb.js (addBlock, Zeile 255):

export interface RedionBlock {
  id: BlockId
  type: string
  text: string
  content: BlockId[]        // Kennungen der Kinder, keine Objekte
  parentId: BlockId | CollectionId | null
  parentTable: 'block' | 'collection'
  color: string
  created: ISODateTime
  edited: ISODateTime
  erstelltVon: string       // deutsch, weil das Feld so gespeichert ist
  alive: boolean            // false = im Papierkorb, nicht endgültig weg
  icon?: string
  collectionId?: CollectionId
  aktiveView?: string
  dateiId?: string
}

export interface RedionPage extends RedionBlock {
  type: 'page'
  id: PageId
}

Eine Datenbankzeile ist derselbe Satz mit parentTable: 'collection'; die
Spaltenwerte stehen unter props.

Eine Datei, abgelesen aus quell/bereiche/dateien/ablage.js:

export interface RedionFile {
  id: FileId
  name: string
  groesse: number
  typ: string
  blockId: BlockId | null
  teile: number
  angekommen: number
  zustand: 'wartet' | 'laeuft' | 'fertig'
  angelegt: ISODateTime
  fertigAm: ISODateTime | null
}

Nicht raten, welche Felder es gibt. Nachsehen (ENTSCHEIDUNGEN.md E21). Diese
Beispiele zeigten hier einmal createdAt, updatedAt, properties, children und
deleted. Vier davon gibt es nicht, und deleted hätte die Bedeutung von alive
genau umgekehrt.



### 52.9 Datenbank-Typen

Eine Datenbank hält die Spalten. Die Zeilen liegen nicht darin, sondern als
Blöcke im Fach blocks, und zeigen über parentId hierher zurück.

export interface Column {
  name: string
  type: string              // Bezeichner aus Register.eigenschaften
  options?: Array<{ name: string; color?: string }>
  formula?: string          // NICHT `formel` — so ist es gespeichert (E412)
  ziel?: CollectionId       // NICHT `zielCollection` — dito (E298)
}

export type Schema = Record<string, Column>

export interface RedionDatabase {
  id: CollectionId
  name: string
  icon: string
  schema: Schema
  viewIds: ViewId[]
  created: ISODateTime
}

Der Spaltentyp ist bewusst string und keine Aufzählung: Register.eigenschaften
lässt sich zur Laufzeit erweitern. Ein Typ, der das verbietet, wäre falsch
statt streng.

Die zwölf Ansichtsarten stehen dagegen fest und sind eine Aufzählung:
table, board, timeline, calendar, list, gallery, chart, feed, map, dashboard,
pivot, form.



### 52.10 .redion-Typen

Das Sicherungsformat muss typisiert sein. Backup-Code nie untypisiert lassen.

export interface RedionPackageManifest {
  version: number
  exportiert: ISODateTime
  enthaelt: StoreName[]     // welche Fächer wirklich drin sind
  fehlt: StoreName[]        // welche fehlen; leer heisst vollständig
  hinweis: string           // ein Satz im Klartext für den Menschen
}

export interface RedionPackageData extends RedionPackageManifest {
  blocks: RedionBlock[]
  collections: RedionDatabase[]
  views: RedionView[]
  meta: MetaEntry[]
  versions: RedionVersion[]
}

enthaelt, fehlt und hinweis sind kein Beiwerk. Eine Sicherung, die nicht sagt,
was sie auslässt, ist die gefährlichste Sorte — man merkt es erst, wenn man
sie braucht.

Diese Feldnamen sind deutsch, weil sie wörtlich so in jeder bereits
geschriebenen Sicherungsdatei stehen. Sie umzubenennen würde vorhandene
Sicherungen unlesbar machen.



### 52.11 Async-Regel in TypeScript

Asynchrone Funktionen müssen klar typisiert werden:

export async function schreibePaket(...): Promise<Blob> {
  ...
}

Nicht:

export async function schreibePaket(...) {
  ...
}

bei öffentlichen Kernfunktionen.



### 52.12 Fehler-Typen

Fehler sollen eigene Klassen oder klare Result-Typen nutzen.

Beispiel:

export type Ergebnis<T> =
  | { ok: true; wert: T }
  | { ok: false; fehler: string; code?: string }

Für Nutzeraktionen ist oft besser:

return { ok: false, fehler: 'Die Datei ist größer als 4 GB.' }

statt nur:

throw new Error(...)



### 52.13 DOM-Code in TypeScript

DOM-Code soll typisiert werden.

Gut:

const knopf = document.createElement('button')
knopf.type = 'button'
knopf.textContent = 'Speichern'
knopf.addEventListener('click', () => speichern())

Wenn Element gesucht wird:

const root = document.getElementById('app')
if (!root) throw new Error('App-Container fehlt.')

Nicht:

document.getElementById('app')!.innerHTML = ...

wenn es vermeidbar ist.



### 52.14 Sichere HTML-Ausgabe

Auch mit TypeScript gilt:

export function esc(wert: unknown): string {
  return String(wert ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

Nutzertext niemals ungeprüft in innerHTML.



### 52.15 Tests mit TypeScript

Neue Tests bevorzugt in TypeScript, wenn Testsystem bereit ist:

tests/*.test.ts

oder bestehend:

pruefungen/lauf/*.mjs

Während Migration dürfen beide existieren.

Wichtig:

bestehende Prüfungen nicht löschen

neue TypeScript-Tests ergänzen

Playwright-Prüfungen behalten

Backup/Import/Export weiterhin mit echten Bytes testen



### 52.16 Migrationsphasen

Claude soll TypeScript in Phasen einführen.

Phase TS-0: Analyse

Bestehende Struktur lesen.
Große Dateien identifizieren.
Import-/Export-/Backup-Code finden.
Testlage prüfen.
Migrationsplan schreiben.

Phase TS-1: Tooling

Einführen:

typescript
vite oder eigener Build
tsconfig.json
npm scripts

Ohne App kaputt zu machen.

Phase TS-2: Typen

Einführen:

src/core/types/
Block-Typen
Datei-Typen
Datenbank-Typen
Backup-Typen
Result-Typen

Noch wenig Logik migrieren.

Phase TS-3: Kleine Kernhelfer

Migrieren:

id
datum
objekte
debounce
errors
escape/sanitize

Phase TS-4: .redion und Dateien

Migrieren:

redionPackage.ts
zip.ts
files.ts
exportImport.ts

Mit Tests.

Phase TS-5: IndexedDB-Schicht

Migrieren:

indexedDb.ts
migrations.ts
storage adapters

Sehr vorsichtig.

Phase TS-6: Register

Migrieren:

blocks.ts
properties.ts
views.ts
formulas.ts
commands.ts
navigation.ts
modules.ts

Phase TS-7: Datenbanken und Formeln

Migrieren:

formula tokenizer
parser
runtime
database view logic
filters
sorts
rollups

Phase TS-8: Editor

Editor nur nach Plan migrieren.

Vorher aufteilen:

render
keyboard
selection
slash menu
inline formatting
embeds

Phase TS-9: Server

Cloudflare/Server-Code typisieren:

server/
worker/
D1 types
R2 types
auth/session types
sync types
permissions types

Phase TS-10: Alte JS-Dateien entfernen

Erst wenn:

alle Tests grün
Build stabil
Einzeldatei funktioniert
Import/Export funktioniert



### 52.17 Ziel wie BABAT-RED, aber Redion-Regeln bleiben

BABAT-RED ist Vorbild für:

TypeScript
klare Module
strikte Typen
Build
Tests
Registry-Struktur
professionelle Architektur

Aber Redion behält eigene Identität:

eine eigene App (§2), kein Nachbau
local-first
Datenbanken
Blöcke
Offline
.redion-Paket
optionaler Server

Nicht blind BABAT-RED kopieren.



### 52.18 Neue Code-Regel

Ab jetzt gilt:

Neuer Kerncode: TypeScript.
Neue Typen: TypeScript.
Neue Tests: bevorzugt TypeScript.
Alten JavaScript-Code nur anfassen, wenn nötig oder im Rahmen einer geplanten Migration.



### 52.19 Wichtigster TypeScript-Satz

> Redion soll vollständig TypeScript werden, aber niemals auf Kosten von
> Datenverlust, kaputtem Backup oder zerstörter Offline-Nutzung.

*(Dieser Absatz stand bis zum 3. September 2026 hinter §53 — §53 war mitten
in §52 eingefügt worden. Der Text ist unverändert, nur wieder an seinem
Platz.)*

---

## 53. Code-Sprache und TypeScript  **[hart]**

Die Sprachregel in einem Satz:

Deutsch für Menschen. Englisch für Code.

Ausführlich steht sie in ENTSCHEIDUNGEN.md unter E27. Hier das, was beim
Arbeiten gebraucht wird.


### 53.1 Was englisch wird

Alles, was nur der Code liest — und nur in neuem TypeScript:

Ordnernamen           src/core/helpers/
Dateinamen            ids.ts, backup.ts, spreadsheet.ts
Variablen             const activeView = …
Funktionen            createPage() statt seiteErstellen()
Klassen               class FormulaParser
Interfaces und Typen  RedionBlock, ViewLayout, Result<T>
Enums und Unions      'wartet' | 'laeuft' | 'fertig' bleibt als Wert deutsch,
                      der Typname UploadState ist englisch
Testnamen im Code     describe('createPage', …)


### 53.2 Was deutsch bleibt

Alles, was ein Mensch liest:

Nutzertexte           Knöpfe, Überschriften, Menüs, Platzhalter
Fehlermeldungen       „Die Datei ist größer als 4 GB."
Kommentare            im Code, auch im englisch benannten
Dokumentation         README.md, CLAUDE.md, AUFGABEN.md, LUECKEN.md,
                      ENTSCHEIDUNGEN.md, doku/
Prüfnamen im Text     die Beschreibung, die im Prüfbericht erscheint

Eine englisch benannte Datei mit deutschen Kommentaren ist kein Widerspruch,
sondern genau die Regel.


### 53.3 Die zwei harten Grenzen

Grenze 1: Feldnamen sind keine Namen, sondern Daten.

Ein Feld heisst so, wie es in IndexedDB gespeichert ist — created, edited,
erstelltVon, alive, groesse, teile, enthaelt, fehlt. Diese Namen zu
übersetzen ist keine Umbenennung, sondern eine Datenmigration, und sie macht
jede vorhandene Sicherung unlesbar. Also nicht.

Typname englisch, Feldname wie gespeichert.

Grenze 2: Keine Massenumbenennung.

Der Bestand unter quell/ ist deutsch benannt und bleibt es. Eine Datei wird
umbenannt, wenn sie ohnehin migriert wird — nicht, weil sie deutsch heisst.

Ein Modul mit fünfzehn Aufrufern darf im Zug seiner Migration umbenannt
werden (so geschehen bei Kennungen → Ids). Ein Modul mit hundert Aufrufern
nicht ohne eigenen Plan.


### 53.4 Wo neuer Code hingehört

src/                  TypeScript-Quelle, englisch benannt
  core/types/         nur Typen, keine Logik. Erzeugt nichts (noEmit).
  core/helpers/       kleine Helfer, werden nach quell/ ausgegeben
quell/                der laufende Bestand, deutsch benannt

Wichtig bei tsconfig.bauen.json: include darf nicht src/core/** umfassen,
ohne src/core/types/** auszuschliessen. Sonst werden leere .js-Dateien nach
quell/ geschrieben.


### 53.5 Was das nicht heisst

Keine React-App. React nur als Inseln an Ort und Stelle (E699) — englisch
benannt wie jeder neue Code (src/islands/main.tsx, mount, update), mit
deutschen Kommentaren und deutschen Texten für Menschen.

Keine Build-Pflicht. index.html doppelklicken muss weiter funktionieren, und
redion-einzeldatei.html muss sich weiter mit node bauen.mts erzeugen lassen.
Die Inseln ändern daran nichts: ihr Bau läuft beim Entwickeln, und das
Ergebnis liegt mitversioniert unter quell/ (§54.2).

Kein grosser Umbau auf einmal. Die Phasen stehen in AUFGABEN.md.

Keine Datenmigration nebenbei. Siehe 53.3, Grenze 1.


### 53.6 Der wichtigste Satz dieses Abschnitts

Ein englischer Name ist eine Verbesserung. Ein falscher Feldname ist ein
Datenverlust. Im Zweifel nachsehen, nicht übersetzen.



## 54. Die Sprachen dieses Projekts  **[hart]**

Beschlossen in ENTSCHEIDUNGEN.md E28. Der ganze Abschnitt in einem Satz:

    Es entsteht kein neues JavaScript.

### 54.1 Was benutzt wird

TypeScript   neuer Hauptcode, Typen, Kernlogik, neue Module
             (dazu TSX — nur unter src/islands/, die React-Inseln, E699)
JavaScript   nur der bestehende Redion-Code — migrieren, nicht vermehren
HTML         Startdatei, App-Grundseite, Einzeldatei
CSS          Aussehen, Aufbau, Hell/Dunkel, Telefon
SQL          Cloudflare D1: Konten, Abgleich, Rechte, Dateiangaben
Markdown     README, CLAUDE.md, Doku, Aufgaben, Entscheidungen
Shell/Bash   Startskripte, lokale Befehle
YAML         GitHub Actions
JSON         Konfiguration, Sicherungen, .redion, Manifest
TOML         Wrangler

Eine weitere Sprache kommt nur dazu, wenn sie vorher in E28 steht. Ein
Python-Hilfsskript ist genau der Anfang, an dem eine Werkzeugkette entsteht.

### 54.2 Wo eine neue Datei hingehört

Code, den der BROWSER lädt:

    src/…/name.ts        wird bearbeitet
    npm run bauen:ts     erzeugt quell/…/name.js
    index.html + sw.js   laden das erzeugte .js

Das erzeugte .js wird mitversioniert. Es ist Ausgabe, kein Quelltext — und
es ist der Grund, warum die App weiterhin per Doppelklick startet.

Seit E715 reist es OHNE Kommentare (`removeComments` in
`tsconfig.bauen.json`): die Erklärungen stehen in `src/`, dort werden sie
gelesen; im `.js` waren sie 1039 von 2826 KB des Starts. Übrig bleibt
eine Zeile, mit der jede Quelle beginnt und die tsc stehen lässt:

    /*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/…/name.ts (npm run bauen:ts). */

Wer eine neue Quelle anlegt, schreibt sie als erste Zeile, mit dem eigenen
Pfad; `test105` §3 meldet jede erzeugte Datei, der sie fehlt oder deren
Zeile eine andere Quelle nennt, und `test388` §5 reisst, wenn die
Kommentare zurückkommen.

Eine React-INSEL (E699) — die dritte Sorte erzeugtes JavaScript:

    src/islands/name.tsx     wird bearbeitet (Bauteile aus fremd/touch/)
    npm run bauen:inseln     Vite baut zwei klassische Skripte:
                             quell/fremd/react/react.js  (React, fremd)
                             quell/islands/islands.js + .css
    Inseln.bereit()          lädt sie beim ersten Gebrauch

Auch das ist Ausgabe und wird mitversioniert; `test578` baut sie neu und
vergleicht Byte für Byte, so wie `test105` es für tsc tut, und
`pruefungen/buendel-bestand.json` sagt `test109`, dass sie erzeugt sind.

Code, den NODE ausführt — Prüfläufe, bauen, Server:

    pruefungen/lauf/testNNN.mts    und direkt starten:
    node pruefungen/lauf/testNNN.mts
    node pruefungen/alle.mts NNN     oder so, mit der Nummer allein

Kein Übersetzer, kein Paket, kein Schritt zum Vergessen. Node entfernt die
Typen seit 22.18 von selbst.

### 54.3 Der Preis: löschbare Typen

Node ENTFERNT die Typen, es übersetzt nicht. Was zur Laufzeit etwas erzeugt,
geht deshalb nicht:

    enum          -> stattdessen ein Objekt mit as const
    namespace     -> stattdessen eine Datei
    constructor(private x)  -> stattdessen ein gewöhnliches Feld

Eine einzige solche Zeile nimmt Node die Fähigkeit, die Datei auszuführen,
und der Fehler kommt dann aus einer ganz anderen Ecke. test109 hält das fest.

Und: Node PRÜFT dabei nicht. Das Prüfen bleibt npm run typecheck.

### 54.4 Wie die Regel durchgesetzt wird

pruefungen/js-bestand.json führt jede von Hand geschriebene .js/.mjs, die es
heute gibt. Das Verzeichnis darf nur schrumpfen.

    eine Datei migriert    -> aus dem Verzeichnis streichen
    eine neue .js angelegt -> test109 wird rot

**Seit dem 3. September 2026 ist das Verzeichnis leer.** Keine von Hand
geschriebene .js oder .mjs mehr im ganzen Projekt — die Regel aus E28 ist
nicht mehr nur Absicht, sondern Zustand. Ein leeres Verzeichnis heisst
deshalb nicht „gibt es nicht mehr", sondern „ab hier gibt es nichts mehr
umsonst": die erste neue .js macht test109 rot.

Erzeugtes JavaScript zählt nicht mit; test105 hält es an seiner .ts, und
test578 die Bündel der Inseln an ihrer .tsx (E699). Ein Bündel zählt für
test109 aber nur, wenn Quelle, Bau und Wächter wirklich daliegen — ein
Eintrag allein entlastet nichts.

### 54.5 Was das nicht heisst

Nicht: den Bestand in einem Zug übersetzen. Die Reihenfolge steht in
doku/TYPESCRIPT-MIGRATION.md und beginnt dort, wo ein Fehler nichts kostet.

Nicht: einen Bauschritt für die NUTZUNG der App einführen. Das bleibt
verboten (§6). Die zwei Wege oben kommen ohne aus, und genau deshalb sind es
diese zwei. Die Inseln (E699) haben einen Bauschritt — für den, der sie
ändert, so wie `bauen:ts` für den, der TypeScript ändert. Wer Redion öffnet,
bekommt das Ergebnis fertig.


# Teil XII — Hinsehen

## 55. Bilder machen, nicht nur Code lesen  **[hart im Kern]**

Beide Gestaltungs-Skills (`redion-ui-design-system`, `redion-mobile-ux`) sagen
denselben Satz, und er ist der wichtigste in beiden:

    Öffne die Seite wirklich, statt nur den Code zu lesen.

    node bilder.mts                  alle Ansichten, Rechner und Telefon
    node bilder.mts tabelle          nur die Tabelle
    node bilder.mts tabelle handy    nur die Tabelle am Telefon

Die Bilder landen in `bilder/` und werden nicht mitversioniert.

### 55.1 Warum das keine Kür ist

Beim Tabellenblock fand das Hinsehen vier Fehler, die KEINE Prüfung hatte —
und zwei davon konnte keine Prüfung haben, weil sie nur mit Augen sichtbar
sind:

  · Eine abgeschnittene Zahl zeigte eine ANDERE Zahl. `634.2166666667` stand
    als `34.2166666667` da. Beide Zahlen sind gültig; kein Prüflauf konnte
    ahnen, dass die zweite falsch ist.
  · Die Ausrichtungsknöpfe `⟨ ≡ ⟩` sahen auf dem Bildschirm aus wie Klammern.
  · Ein zweiter Fokusrahmen zog eine blaue Linie durchs Bild, die nichts
    bedeutete.
  · Am Telefon stand die halbe Werkzeugleiste ausserhalb des Bildes — darunter
    der Weg zu „Als Excel speichern".

### 55.2 Und die Lehre daraus für Prüfungen

Die erste Prüfung gegen die abgeschnittene Zahl mass `scrollWidth` gegen
`clientWidth`. Gemessen ergab das für eine 21-stellige Zahl in einer 109 px
breiten Zelle: 109 gegen 109.

Der Grund ist Flexbox — der Text ist ein anonymes Flex-Element und wird
GESTAUCHT statt überzustehen. Es gibt gar keinen überstehenden Inhalt zu
messen; abgeschnitten wird trotzdem.

Eine Prüfung, die immer „passt schon" sagt, ist keine Prüfung. Wer eine neue
schreibt, prüft zuerst, ob sie überhaupt rot werden KANN.

### 55.3 Ein Bild, wenn es etwas zu sehen gibt

Redur will die Bilder direkt im Gespräch sehen. Die Regel, die er dazu am
3. September 2026 entschieden hat, ist genauer als „nach jeder Änderung":

> **Ein Bild, wenn man etwas sehen kann. Eine Messung, wenn es reines
> Rechnen ist.**

Also ein Bild bei allem, was Augen hat: eine neue Ansicht, ein geänderter
Aufbau, eine Leiste, ein Dialog, eine Karte, ein Zustand, den es vorher
nicht gab. Und zwar **im Gespräch**, nicht nur auf der Platte — ein Bild,
das niemand ansieht, hat nichts gefunden.

Keine Bilder dagegen bei Dingen ohne Bild: ein Formelkern, ein ZIP-Leser,
eine Rechteprüfung, eine Migration. Dort ist die Messung der Beweis, und
ein Bildschirmfoto der unveränderten Seite wäre nur Beschäftigung.

Der Grund für die Trennung ist derselbe wie überall hier: Eine Regel, die
IMMER etwas verlangt, wird nicht mehr gelesen. Zwanzig Bilder von
unveränderten Seiten machen das eine Bild unsichtbar, auf dem die
Werkzeugleiste aus dem Bild ragt.

Und Redur hat es am 25. September 2026 noch einmal gesagt, damit es nicht
zur Auslegungssache wird: „Könntest du mir von jeder Änderung, die du im
Redion machst, wenn es etwas im Website ändert, mir alles fotografieren und
schicken." Also: **jede** Änderung, die auf dem Bildschirm etwas ändert,
bekommt ihre Bilder — alle Zustände, Rechner und Telefon —, und sie werden
**geschickt**, nicht nur abgelegt. Was nichts am Bildschirm ändert (ein
Kern, ein Verlauf, eine Umrechnung), bekommt seine Messung. Die Grenze
zwischen beidem entscheidet nicht die Bequemlichkeit, sondern die Frage:
sieht man es?

### 55.4 Die Bilder gehen nie auf GitHub

`bilder/` steht in `.gitignore`. Bildschirmfotos sind Arbeitsmaterial, keine
Quelle: sie gehören auf den Rechner, an dem gearbeitet wird — nicht ins
Verzeichnis, nicht in die Einzeldatei, nicht ins Dienst-Skript.

Zwei Gründe, und der zweite ist der wichtigere:

  · Ein Verzeichnis, das mit jedem Durchgang um ein paar hundert Kilobyte
    wächst, ist nach einem Monat grösser als die App.
  · Ein Bild von gestern beantwortet keine Frage von heute. Was zählt, ist
    der Blick auf das, was JETZT gebaut wurde — und dafür gibt es
    `bilder.mts`, zehn Sekunden pro Durchgang.

`bilder.mts` selbst gehört sehr wohl ins Verzeichnis. Es ist das Werkzeug,
nicht das Ergebnis.

---
---

# Teil XIII — Das Gedächtnis

## 56. Die Chronik  **[hart]**

`UR.md` und `PROBLEME.md` sind **erzeugt**. Die Quelle ist
`chronik/chronik.json`; `node chronik.mts` schreibt daraus beide Dateien
**und** die Ansicht in Redion (`src/bereiche/chronik/daten.ts`, danach
`npm run bauen:ts`). Wer in die erzeugten Dateien schreibt, verliert es.

**Nachgetragen wird am Ende eines Arbeitstages, nicht irgendwann.** Am
19. September 2026 fehlten sechs Tage und 73 Commits, und gemerkt hat es
Redur, nicht ich. Ein Gedächtnis mit Lücken ist schlechter als keines: es
sieht vollständig aus.

Was in einen Tag gehört:

```txt
nachrichten   Redurs Sätze WÖRTLICH, mit Uhrzeit — dazu: was gemeint war,
              wie er es kürzer hätte sagen können, was ein besserer Prompt wäre
arbeit        was gebaut wurde, von Commit bis Commit, Zeitraum, Dauer, Prüfläufe
zahlen        Commits, Entscheidungen, neue Prüfläufe
groesstesProblem · interessantesteAnfrage · massnahmen (Zeit · was · warum · Risiko)
```

Und ein Problem gehört nach `probleme`, mit **falscher Vermutung**, **wie
gefunden**, **Ursache**, **Beweis** und **Lehre** — gerade die falsche
Vermutung, denn sie ist der Teil, den man beim nächsten Mal wiedererkennt.

**Die Uhr ist ehrlich oder sie fehlt.** Commit-Zeiten kommen aus git und
sind genau. Abgeleitete Zeiten tragen ein „ca.". Ein Wortlaut, den niemand
mehr hat, wird **nicht erfunden** — dann steht dort, woher das Zitat
stammt, oder gar nichts (§35).

**Teil I ist keine Nettigkeit, sondern Arbeitsgrundlage.** Wer Redurs
Sätze falsch liest, baut das Falsche; deshalb steht dort gemessen, wie er
schreibt, woran er Qualität misst und wie er entscheidet. Er hat am
19. September ausdrücklich darum gebeten, dass dieser Teil genau ist.

---
---

# Teil XIV — Fremdes

## 57. Fremder Code  **[hart]**

Redur, 25. September 2026 (E683): **Fremder Code darf in Redion, wenn er
Redion verbessert.** Mit drei Bedingungen, die keine Abwägung kennen:

- **Nichts geht hinaus.** Kein fremdes Stück schickt PDFs, Bilder oder
  Geheimnisse an Dritte — auch nicht „nur zum Prüfen", auch nicht
  „anonymisiert". Was das täte, kommt nicht herein, egal wie viel es
  verbessert (§21, §42).
- **Vorher fragen.** Bevor etwas Fremdes genommen wird, wird Redur
  gefragt — jedes Stück, jedes Mal. Kein pauschales Ja.
- **Vorher eintragen.** Jedes fremde Stück steht in `FREMDCODE.md`:
  Herkunft, Fassung, Lizenz, was es verbessert, was daran geändert ist,
  welcher Wächter es hält. Ein fremdes Stück ohne Eintrag ist ein Fehler.

Was bleibt: §6 (kein Framework ohne eigene Entscheidung — für React ist es
E699), §54 (kein
handgeschriebenes JavaScript — Fremdes kommt eingepackt und geprüft wie
pdf.js, oder als TypeScript mit Herkunftsvermerk), §19/§20 (kein `eval`,
kein Fremdcode aus Formeln). Lizenzen: MIT, BSD, Apache-2.0, ISC mit
Namensnennung; GPL/AGPL nur mit eigener Lizenzentscheidung in
`ENTSCHEIDUNGEN.md`; ohne Lizenz nie. Fremdes aus dem Netz zur Laufzeit
nur mit festgenagelter Fassung — WebLLM ist die eine Ausnahme, die vor
dieser Regel entstand und in `FREMDCODE.md` als offene Frage steht.

Ein **Plugin-System für Dritte** ist damit nicht entschieden (L30): dort
wählt ein Nutzer den Code, nicht Redur — die Sandbox-Bedingungen aus L30
gelten dafür weiter.

---
---

# Offene Fragen an Redur

Nicht jede Marke oben ist entschieden. Diese hier hat Claude gesetzt, weil
irgendetwas dastehen musste — sie gehören Redur, und bis er etwas sagt,
gilt der Vorschlag.

| Abschnitt | Vorschlag | Die Frage dahinter |
|---|---|---|
| §18 Editor | Richtwert, vier harte Punkte | Ist „unbekannte Blocktypen nicht löschen" hart genug gefasst, oder gehört auch „Slash-Menü stabil" dazu? |
| §23 Cloudflare | Richtwert | Nur „keine grossen Blobs in D1" steht als hart. Reicht das? |
| §31 Prüfläufe | Richtwert | Fünf Läufe beim Namen — sollen es mehr sein, oder ist eine kurze Liste die ehrlichere? |
| §39 CSS | Richtwert | Die Token-Regel könnte hart sein: erfundene Tokens sind dreimal unbemerkt durchgegangen. |
| §44 PR | Richtwert | Zurzeit wird kein PR geöffnet, ausser Redur bittet darum. Soll das so bleiben? |

**Vier Marken hat Redur selbst gesetzt** (3. September 2026), und die stehen
fest:

- **§30** — der volle Lauf läuft in Stücken und ist wiederaufnehmbar.
- **§37** — 44 px auf den Hauptwegen, 32 px auf Nebenwegen mit geschriebenem
  Grund.
- **§46** — rot zuerst; fertige grüne Bögen dürfen landen; `main` bewegt
  sich nicht.
- **§55.3** — ein Bild, wenn man etwas sehen kann; sonst eine Messung.

---

*Zuletzt durchgesehen am 3. September 2026. Was dabei nicht mehr stimmte,
steht in `ENTSCHEIDUNGEN.md` unter E370.*
