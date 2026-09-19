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
| `doku/ARCHITEKTUR.md` | Wie ist es aufgebaut? |
| `doku/REDION-FORMAT.md` | Wie sieht eine `.redion`-Sicherung von innen aus? |
| `doku/TYPESCRIPT-MIGRATION.md` | In welcher Reihenfolge wird migriert? |

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

- ein React-Projekt — E78 hat es am 8. August 2026 kurz beschlossen, E80 hat
  es am 9. August nach Ansicht des Rohbaus widerrufen. Redur braucht keine
  zweite Oberfläche.
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

**Der Wächter dafür fehlt — nachgemessen am 12. September 2026.** Hier stand
„Der Wächter dafür ist `test87`". Das stimmt nicht: `test87` prüft rohe
Steuerzeichen, den Abgleich der Rollen zwischen Oberfläche und Server, die
A1/A2-Grenze (die drei Zeichner rufen `App` nicht an), die Reihenfolge der
Stilblätter, das Manifest, `esc`, das Schema und ein paar Namen. Ein Bereich,
der einen anderen anfasst, kommt darin nicht vor.

Dazu kommt: **es gibt in `src/bereiche/` keine einzige `import`-Zeile.**
Gezählt, nicht geschätzt — alles wird über 208 `<script>` in `index.html`
geladen und redet über globale Namen. Das `import`-Beispiel oben beschreibt
also einen Weg, den dieses Projekt gar nicht benutzt; brechen lässt sich die
Regel heute nur über einen globalen Namen (`Bibliothek.…` mitten im Editor).
Genau das prüft niemand.

Die Regel gilt unverändert. Was fehlt, ist ihr Beweis — eingetragen als
**L150**.

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

Redion läuft bewusst ohne Browser-Framework.

Nicht einführen ohne sehr starken Grund und ohne eigene Entscheidung in
`ENTSCHEIDUNGEN.md`: **React, Vue, Svelte, Angular, Next.js**, grosse
UI-Bibliotheken, grosse State-Management-Bibliotheken, **Bündel-Zwang für die
normale Nutzung**.

Am 8. August 2026 wurde mit **E78** kurz eine React-Zielarchitektur
beschlossen und als Rohbau begonnen. Redur hat sie am 9. August nach Ansicht
des Rohbaus **widerrufen (E80)**. Diese Regel gilt damit unverändert weiter —
und dieser Absatz steht hier, damit niemand den Versuch für eine offene Frage
hält.

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

**Prüfungen sind Pflicht.** Heute sind es 477 Läufe unter
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

### Die Befehle

```txt
npm install                          einmalig
npx playwright install chromium      einmalig
npm run typecheck                    Typen (ändert nichts, prüft alles)
npm run bauen:ts                     src/**.ts  →  quell/**.js
npm run pruefen -- --schnell         ohne die Messläufe (Dauer ungemessen)
npm run pruefen                      alle 477 Läufe
node pruefungen/alle.mts 87 100 105  einzelne Läufe, Nummern ohne "test"
node bauen.mts                       redion-einzeldatei.html
npm run stand                        prüft den Dienststand nach
```

Die Dateien heissen **`.mts`**, nicht `.mjs` — seit E28 gibt es keine von
Hand geschriebene `.js` mehr im Projekt (§54).

### Der volle Lauf läuft in Stücken

Ein voller Lauf dauert länger, als eine Sitzung sicher steht. Er wird
deshalb **in Stücken und wiederaufnehmbar** gefahren: zehn Läufe je Stück,
eine Merkdatei hält fest, welche Stücke fertig sind. Bricht die Sitzung ab,
geht nur das laufende Stück verloren, nicht die Stunde davor.

Gefahren wird er in einem eigenen Arbeitsbaum (`git worktree`), damit im
Hauptbaum weitergearbeitet werden kann, während er läuft. Das Vorspulen von
`main` passiert dagegen **immer im Hauptbaum**.

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

Von 477 Läufen sind diese fünf die, die man beim Namen kennt:

| Lauf | Was er hält |
|---|---|
| `test87` | Steuerzeichen, Rollen Oberfläche↔Server, die A1/A2-Grenze, Stilblätter, Manifest, `esc` — **nicht** §5 Regel 1, siehe dort |
| `test96` | der Fund, dass Anhänge bei der JSON-Sicherung fehlten oder leer wurden |
| `test100` | `.redion` mit echten Bytes: sichern, löschen, zurückholen, vergleichen |
| `test105` | dass jede `.ts` ihr gebautes `.js` hat und `tsconfig.bauen.json` vollständig ist |
| `test109` | dass kein neues JavaScript entsteht (§54) und `js-bestand.json` nur schrumpft |

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
| `CLOUDFLARE.md`, `SERVER-EINRICHTEN.md` | die Wolke einrichten |
| `START-MIT-CLAUDE-CODE.md` | wie hier gearbeitet wird |
| `doku/ARCHITEKTUR.md` | wie es aufgebaut ist |
| `doku/REDION-FORMAT.md` | das `.redion`-Format von innen |
| `doku/TYPESCRIPT-MIGRATION.md` | die Reihenfolge der Migration |

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
| React einbauen | §6 (E80 hat den Versuch widerrufen) |
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
.tsx nur wenn echte UI-Komponenten mit JSX nötig sind

Da Redion aktuell kein React-Projekt ist, soll .tsx nur verwendet werden, wenn später bewusst eine UI-Schicht mit JSX eingeführt wird.

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

Kein React. TypeScript ja, React nur nach eigener Entscheidung in
ENTSCHEIDUNGEN.md.

Keine Build-Pflicht. index.html doppelklicken muss weiter funktionieren, und
redion-einzeldatei.html muss sich weiter mit node bauen.mts erzeugen lassen.

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

Erzeugtes JavaScript zählt nicht mit; test105 hält es an seiner .ts.

### 54.5 Was das nicht heisst

Nicht: den Bestand in einem Zug übersetzen. Die Reihenfolge steht in
doku/TYPESCRIPT-MIGRATION.md und beginnt dort, wo ein Fehler nichts kostet.

Nicht: einen Bauschritt für die App einführen. Das bleibt verboten (§6). Die
zwei Wege oben kommen ohne aus, und genau deshalb sind es diese zwei.


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
