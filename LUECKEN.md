# LUECKEN.md — was fehlt, Zeile für Zeile

**Stand: 3. August 2026** · Abhakbare Arbeitsliste. Jede Zeile: was fehlt,
wohin es gehört, wie gross es ist.

Diese Datei entstand durch **Nachmessen, nicht durch Abschreiben.** Die
Bestandsaufnahme in `doku/NOTION-10000X-BESSER.md` Teil 4 ist vom 2. August
und an sechs Stellen überholt — dort steht ✗, wo inzwischen etwas gebaut ist.
Was hier steht, wurde gegen den Quelltext geprüft; die Belege stehen jeweils
dabei. Die Widersprüche und ihre Auflösung stehen in `ENTSCHEIDUNGEN.md`.

Zeichen: **✅ da** · **◐ teilweise** · **✗ fehlt**

---

## Wie gezählt wurde

Nicht per `grep` über `id:` — das zählt Kommentare und Beispiele mit. Die
Register wurden **geladen und befragt**, mit der Formel-Laufzeit daneben,
so wie es `test88` und `test89` mit den Diensten machen.

Zwei Zählungen waren dabei zuerst falsch, aus demselben Grund: die
Schnittstelle geraten statt nachgesehen. `Register.tasten.alle()` liefert
**Gruppen**, nicht Kürzel — die Kürzel liefert `flach()`. Und
`Register.formeln.alle()` hängt an `Formula.namen()`; ohne geladene Laufzeit
kommt nur ein Fünftel. Erste Messung: 12 Kürzel, 20 Formeln. Richtig: 127
und 158.

---

## Teil A — Die Prüflisten aus der Notion-Doku

| Liste | Notion | Redion | Stand | Fehlbetrag |
|---|--:|--:|:--:|---|
| Blocktypen (Teil 1, 14) | 97 | **58** | ◐ | **39** — grösste Einzellücke |
| Eigenschaftstypen (Teil 7) | 29 | **35** | ✅ | Redion hat 6 mehr |
| Ansichten (Teil 1, 14) | 11 | **12** | ✅ | Redion hat Pivot zusätzlich |
| Tastenkürzel (Teil 6) | 160 | **127** | ◐ | **33** |
| Markdown-Kürzel (Teil 6) | 48 | **23** | ◐ | **25** |
| Einstellungs-Optionen (Teil 6) | 111 | **143** in 24 Bereichen | ✅ | Redion hat mehr |
| Formelfunktionen (Teil 7) | 125 | **158** | ✅ | aber **129 ohne Beschreibung** |
| Integrationen (Teil 13) | 62 | **8** | ◐ | **54** |
| Bedienelemente (Teil 5) | 175 | *nicht gezählt* | ? | Teil B4 |
| Trigger / Bedingungen / Aktionen (Teil 8) | 15 / 24 / 19 | 11 Aktionsarten | ◐ | Teil B3 |
| Aggregationen (Teil 8) | 21 | *nicht gezählt* | ? | Teil B4 |

Die vier Zeilen mit `?` sind noch nicht Zeile für Zeile durchgegangen — sie
stehen in Teil B4 als eigener Arbeitsschritt.

### A1 · Formelfunktionen ohne Beschreibung — **129 von 163**

Die Laufzeit kennt 163 Funktionen. `quell/register/formeln.js` beschreibt
**34**. Die übrigen 129 erscheinen im Formeleditor als Gruppe „Sonstiges",
ohne Argumentliste, ohne Erklärung, ohne Beispiel.

Das ist keine fehlende Funktion, sondern eine, die niemand findet. Notions
Formeleditor zeigt zu jeder Funktion Signatur, Beschreibung und Beispiel —
das ist in Teil 7 dokumentiert.

- **Wohin:** `quell/register/formeln.js`, Feld `BESCHRIEBEN`
- **Wie gross:** 129 Einträge à 4 Zeilen
- **Gegenprobe schon vorhanden:** `Register.formeln.abgleich()` meldet beide
  Richtungen; `ohneFunktion` ist bereits 0, `ohneBeschreibung` ist 129.
- [ ] offen

### A2 · Blocktypen — 39 fehlen

Redion hat 58 in sieben Gruppen: Grundlegend 14 · Erweitert 12 · Aktionen 11 ·
Datenbank 6 · Medien 6 · KI 5 · Wissen 4.

- **Wohin:** `quell/register/bloecke.js` (`EINGEBAUT`), Zeichnen im passenden
  Bereich unter `quell/bereiche/bloecke/arten/`
- [ ] Liste Zeile für Zeile gegen Teil 14 — **noch nicht gemacht**

### A3 · Tastenkürzel — 33 fehlen · Markdown-Kürzel — 25 fehlen

Redion hat 127 Kürzel in 12 Gruppen. Sieben davon hat Notion nur in der
Desktop-App, 18 sind „Mehrere Blöcke auf einmal" — beides Bereiche, in denen
Redion über Notion hinausgeht.

- **Wohin:** `quell/register/tasten.js`, Markdown-Kürzel im Feld `md` von
  `quell/register/bloecke.js`
- [ ] Liste Zeile für Zeile gegen Teil 6 — **noch nicht gemacht**

### A4 · Integrationen — 54 fehlen

- **Wohin:** `quell/register/verbindungen.js`
- **Vorbehalt:** die meisten der 62 brauchen einen Server mit
  OAuth-Geheimnis. Ohne Server geht nur, was einen persönlichen Schlüssel
  akzeptiert. Das ist keine Fleissarbeit, sondern eine Frage der Architektur —
  gehört als eigene Entscheidung nach `ENTSCHEIDUNGEN.md`, bevor gebaut wird.
- [ ] offen

---

## Teil B — Die 21 Lücken aus `NOTION-10000X-BESSER.md`

Geprüft gegen den Quelltext. **Sechs Einträge stehen in Teil 4 als ✗ oder ◐
und sind in Wahrheit gebaut** — sie sind mit „⚠ Teil 4 überholt" markiert.

| # | Lücke | Teil 4 sagt | Wirklich | Beleg |
|--:|---|:--:|:--:|---|
| 1 | Vollständiger Offline-Modus | ✅ | **✅** | `sw.js` legt alle 100 Dateien ab; IndexedDB hält den ganzen Bestand; App startet aus `file://` |
| 2 | Pivot / Kreuztabellen | ✗ | **✅ ⚠** | `steuerung.js:204` `alsPivot`; Zeilen × Spalten × Werte × Rechnung × Prozent (Zeile/Spalte/Gesamt); Ansicht `pivot` im Register |
| 3 | Formeln über fremde Datenbanken | ✅ | **✅** | `countwhere`, `sumwhere`, `findrows`, `firstwhere`, `lastwhere`, `maxwhere`, `minwhere` in `laufzeit.js:namen()` |
| 4 | Vorherige Zeile, laufende Summe, Rang | ✅ | **✅** | `rownumber`, `previous`, `next`, `runningsum`, `runningmax`, `runningmin`, `rank`, `percentoftotal`, `delta` |
| 5 | Automationen mit If/Else | ◐ | **◐** | 11 Aktionsarten in `AKTIONS_NAMEN`; **kein `wenn`**, keine Schleife über gefilterte Zeilen → **B1** |
| 6 | Zufallsfunktionen | ✅ | **✅** | `random`, `randombetween` |
| 7 | Eigene Funktionen | ◐ | **✅ ⚠** | `laufzeit.js:709` `EIGENE`, `setzeBibliothek`, `bibliothek` |
| 8 | Schleifen, Rekursion, Listen | ✅ | **✅** | `reduce`, `groupby`, `sortby` + `map/filter/find/some/every/unique/flat/sort` |
| 9 | Zeitzonen und Werktage | ✅ | **✅** | `businessdaysbetween`, `addbusinessdays`, `isweekend`, `converttimezone`, `startof*`/`endof*` |
| 10 | Vollere Tabellenkalkulation | — | **✗** | keine Bereichsformeln, keine Zielwertsuche, keine Szenarien → **B5** |
| 11 | Freiere Layouts pro Ansicht | — | **◐** | Ansicht `dashboard` da; mehrere Datenquellen in einer Ansicht fehlen → **B6** |
| 12 | Bedingte Formatierung | ◐ | **◐** | Farbe je Ansicht da; **Datenbalken und Farbskalen fehlen** (`balken` in `steuerung.js:1961` ist der Kalender, nicht die Tabelle) → **B2** |
| 13 | Automatische Relation, Dedupe, Upsert | ✗ | **◐** | Zusammenführen in `einstellungen/pflege.js`; automatisches Verknüpfen bei Übereinstimmung fehlt → **B7** |
| 14 | Datenvalidierung und Constraints | ✗ | **✅ ⚠** | `dienst.js:196–243`: `pflicht`, `eindeutig`, `muster` (Regex) — mit Prüfung beim Schreiben |
| 15 | KI-Aktionen in Datenbanken | ◐ | **◐** | KI legt Seiten, Datenbanken und Zeilen an; Formeln, Rollups und Knöpfe noch nicht → **B8** |
| 16 | Formel-Werkstatt | — | **◐** | Werkstatt in `WAS-REDION-MEHR-KANN.md` §2 beschrieben; Debugger und Haltepunkte fehlen |
| 17 | Leistung und Transparenz | — | **✅ ⚠** | `kern/helfer/tempo.js` + `datenbanken/vorrat/dienst.js` (vorberechnete Werte mit sichtbarem Stand) |
| 18 | Diagramme und Dashboards | ◐ | **◐** | Ansichten `chart` und `dashboard`; freier Baukasten fehlt → **B6** |
| 19 | Import/Export-Roundtrip | ✅ | **✅** | JSON-Sicherung mit Schema, Ansichten, Relationen, Formeln, Versionen |
| 20 | Feinere Rechte in Datenbanken | ✗ | **✅ ⚠** | Spaltenrechte in Oberfläche **und** Server; `test80`–`test84` decken sie ab |
| 21 | Gegenüberstellung | — | — | Sammelpunkt, keine eigene Aufgabe |

### Daraus die offenen Arbeiten, nach Nutzen sortiert

- [ ] **B1 · If/Else und Schleife in Aktionsketten**
  Aktionsart `wenn` mit Bedingung und Zweig, dazu `fuerJede` über gefilterte
  Zeilen.
  *Wohin:* `quell/bereiche/editor/ansicht/editor.js` — `AKTIONS_NAMEN` (Z. 1636),
  `eineAktion` (Z. 1640), `knopfEinstellen` (Z. 1753).
  *Prüflauf:* neu, nach dem Vorbild von `test88` — die Kette lässt sich ohne
  Browser rechnen.

- [ ] **B2 · Datenbalken, Farbskalen, Zeilenfarbe per Formel**
  *Wohin:* `quell/bereiche/datenbanken/dienst.js` (Regel auswerten, DOM-frei) +
  `steuerung.js` (zeichnen) + `quell/schale/stil/datenbanken.css`.

- [ ] **B3 · Trigger und Bedingungen vollständig**
  Notion: 15 Trigger, 24 Bedingungen, 19 Aktionen. Redion: 11 Aktionsarten,
  Trigger und Bedingungen noch nicht gezählt.
  *Zuerst:* Zeile für Zeile gegen Teil 8 — dann erst bauen.

- [ ] **B4 · Die vier ungezählten Listen**
  175 Bedienelemente (Teil 5), 21 Aggregationen (Teil 8), 97 Blocktypen
  (Teil 14), 160 Kürzel (Teil 6). Jede Zeile gegen Redion prüfen und hier
  eintragen. **Das ist der nächste Schritt nach B1/B2.**

- [ ] **B5 · Bereichsformeln, Zielwertsuche, Szenarien**
  Grösser als es aussieht; erst nach B1–B4.

- [ ] **B6 · Dashboard-Baukasten mit mehreren Datenquellen**

- [ ] **B7 · Automatische Relation bei Übereinstimmung, Upsert beim Import**

- [ ] **B8 · KI darf Formeln, Rollups und Knöpfe bauen** — mit Vorschau und
  Bestätigung, wie in Idee 6 verlangt.

---

## Teil C — Die 36 Ideen

Die Ideen 16, 17 und 21 verweisen auf die Lücken 14, 13 und 20 und stehen
dort. Die übrigen 33:

| # | Idee | Stand | Beleg / wohin |
|--:|---|:--:|---|
| 1 | Local-First | **✅** | IndexedDB, läuft aus `file://`, kein Server nötig |
| 2 | Echte Datenbank-Engine mit SQL | **✗** | bewusst nicht — siehe `ENTSCHEIDUNGEN.md` E4 |
| 3 | Workspace als Git | **◐** | Versionsverlauf je Seite; Zweige und Diffs fehlen |
| 4 | Formeln als richtige Sprache | **✅** | eigener Zerleger, Parser, Auswerter, ohne `eval`; eigene Funktionen |
| 5 | Automationen als Code | **◐** | Aktionsketten ja, Skripte nein — siehe **B1** |
| 6 | KI als Workspace-Architekt | **◐** | → **B8** |
| 7 | Workspace-Wartungs-KI | **◐** | `einstellungen/pflege.js` |
| 8 | CRDTs | **◐** | `kern/abgleich/zusammenfuehren.js` führt zusammen statt zu überschreiben |
| 9 | Ende-zu-Ende-Verschlüsselung | **◐** | `kern/sicherheit/krypto.js`; Seiten einzeln sperrbar, ganzer Bestand nicht → **C1** |
| 10 | Plugin-System | **◐** | MCP in beide Richtungen; eigene Blocktypen als Plugin fehlen |
| 11 | Universeller Importer | **◐** | XLSX, DOCX, EPUB, CSV, Markdown, HTML, Clipper; Confluence/Trello/Asana fehlen |
| 12 | Verlustfreier Export/Restore | **✅** | JSON-Sicherung |
| 13 | Suche, die alles findet | **◐** | Volltext über Seiten, Blöcke, Zeilen; OCR und Transkripte fehlen |
| 14 | Materialisierte Ansichten | **✅ ⚠** | `datenbanken/vorrat/dienst.js` |
| 15 | Dashboards und Reporting | **◐** | → **B6** |
| 18 | Workspace Schema Layer | **✅ ⚠** | `datenbanken/datenmodell/ansicht.js` — Datenbanken, Relationen, Abhängigkeiten |
| 19 | Templates als echte Apps | **✅ ⚠** | `vorlagen/dienst.js` — Vorlagen mit Fassung und Update |
| 20 | Tests für Formeln und Automationen | **✅ ⚠** | `datenbanken/pruefsaetze/dienst.js` |
| 22 | Self-Hosting | **✅** | eine HTML-Datei, läuft auf jedem Webspace |
| 23 | Bring Your Own Storage | **✅** | die Daten gehören dem Gerät |
| 24 | Inhalte als offene Dateien | **✅** | Markdown, HTML, CSV, JSON |
| 25 | Universelle Objekt-Kennung | **✗** | → `AUFGABEN.md` B1 (Begriffe) |
| 26 | Entscheidungs- und Wissensgraph | **◐** | Graph zeigt Seitenverknüpfungen |
| 27 | KI mit Gedächtnis und Verantwortung | **◐** | Agenten in `ki/agenten.js` |
| 28 | Föderierte Suche | **✗** | braucht fremde Dienste |
| 29 | Mobile-First Power Mode | **✅** | Bottom Sheets, Wischgesten, PWA |
| 30 | Barrierefreiheit als Kernarchitektur | **◐** | Tastatur vollständig, Fokus-Modus; Screenreader-Feinschliff fehlt |
| 31 | Preis nach Verbrauch | **✅** | kostenlos, kein Server |
| 32 | Betriebssystem für Daten | **◐** | `/v1/` ohne Server |
| 33 | Sandbox für externe Agenten | **◐** | Rechte je Agent; Notausschalter und Tageslimit fehlen |
| 34 | Abfragesprache für normale Leute | **✗** | → **C2** |
| 35 | Meeting-zu-Aktion | **◐** | `verbinden/besprechung.js` |
| 36 | Workspace-Simulator | **✅ ⚠** | `datenbanken/probelauf/dienst.js` — erst zeigen, dann tun |

### Daraus offen

- [ ] **C1 · Verschlüsselter Bestand** — Passwort beim Öffnen, AES über die
  IndexedDB-Inhalte. Steht in Teil 5 der Recherche als Punkt 8.
  *Vorsicht:* `CLAUDE.md` — der Satz darf nirgends ausser auf dem Gerät liegen.

- [ ] **C2 · Lesbare Abfragesprache** — „Zeige Aufgaben, wo Status nicht
  Fertig und Fälligkeit vor heute, gruppiert nach Zuständigem".
  *Wohin:* neuer Dienst neben `datenbanken/dienst.js`, DOM-frei und damit
  ohne Browser prüfbar.

- [ ] **C3 · Notausschalter und Tageslimit für Agenten** (Idee 33) —
  klein, klar umrissen, hoher Sicherheitsgewinn.

---

---

## Teil E — Etappe 1: die lokale App stabil machen

Priorität 3 des Auftrags. Zuerst die Frage, die die Abschlussregel stellt:
**wo kann jemand unbemerkt Daten verlieren?**

### E1 · Der Umzug einer alten Ablage · **geprüft**

Der Fall, in dem Datenverlust am ehesten passiert: jemand hat die App vor
Monaten benutzt und öffnet sie nach einer Aktualisierung. `test85` prüfte die
**Beschreibung** der Umzüge — den Katalog. Den Fall selbst hatte nie ein Lauf
durchgespielt.

`test95.mjs` legt jetzt für **jede der fünf Fassungen** eine echte Ablage an,
schreibt Seite, Text, Häkchen, Reihenfolge und Einstellung hinein, lässt die
App darauf los und sieht nach. Alles überlebt, und danach lässt sich
weiterschreiben. Dazu der Fall andersherum: eine Ablage, die **neuer** ist als
die App — sie wird nicht zurückgestuft, und die App bleibt nicht leer stehen.

Der Umzug war richtig gebaut. Bis hierher war das aber eine Annahme.

### Noch offen in Etappe 1

- [x] **E2 · Export → Neuanfang → Import** — erledigt, und es waren **drei**
  Befunde:

  1. **Der Versionsverlauf war nie dabei.** `exportAll` nahm vier der neun
     Fächer mit. Die Doku zählt `versions` ausdrücklich auf. Nachgestellt:
     zwei Fassungen vor dem Export, **null** danach. Jetzt drin.
  2. **Der Import räumte nur den Zwischenspeicher.** Die alten Seiten kamen
     beim nächsten Neuladen zurück und lagen zwischen den eingespielten — es
     sah aus wie ein geglückter Vorgang. Jetzt löscht „ersetzen" wirklich,
     auch von der Platte.
  3. **`importAll` traf die Entscheidung still.** Jetzt muss der Mensch
     wählen: **Ersetzen** oder **Dazulegen**, mit dem Hinweis dabei, was
     jeweils geschieht. Ohne Angabe geschieht nichts — auch bei einem
     Tippfehler im Aufruf.

  **Dateien bleiben aussen vor**, aber jetzt steht es in der Datei: `dateien`
  und `stuecke` halten Blobs, und `JSON.stringify` macht daraus `{}` — sie
  wären scheinbar dabei und in Wahrheit leer, was schlimmer ist als zu fehlen.
  Die Sicherung nennt im Feld `fehlt`, was nicht drin ist, und die Oberfläche
  sagt es beim Speichern. → **E6**

- [ ] **E6 · Anhänge in die Sicherung** — braucht eine Antwort auf die Frage,
  was bei einem 500-MB-Video geschieht. Base64 in derselben JSON-Datei geht
  dafür nicht.
- [ ] **E3 · Papierkorb: was ist wirklich wiederherstellbar?** Und was wird
  beim endgültigen Löschen mitgenommen — Versionen, Dateien, Kommentare?
- [ ] **E4 · `VERSIONEN_MAX: 200` wird nirgends benutzt.** Nachgesehen:
  `versionSpeichern` schneidet hart bei `slice(30)`. Die Konstante verspricht
  200, der Code hält 30. Immerhin in der richtigen Richtung — `versionen()`
  sortiert neueste zuerst, es fallen also die ältesten weg und nicht die
  neuesten. Zu entscheiden ist nur, welche Zahl gilt; danach muss die andere
  Stelle nachziehen.
- [ ] **E5 · Zwei Fenster, dieselbe Ablage.** `onblocked` meldet sich mit
  einem Satz — geprüft ist er nicht.

---

## Was diese Liste **nicht** enthält

Das Aussehen. Die 270 Screenshots sind noch nicht durchgegangen; das gehört
nach `AUSSEHEN.md` und ist ein eigener Arbeitsgang in Blöcken zu zwanzig.

---

---

## Teil D — Die Muss-Regeln Sicherheit aus dem Auftrag

Zeile für Zeile geprüft. **Drei waren bereits erfüllt** — das gehört
festgehalten, damit niemand sie noch einmal „repariert".

| Muss-Regel | Stand | Beleg |
|---|:--:|---|
| Tokens nie im Klartext speichern | **✅ war schon** | `abdruck()` (SHA-256) in `sitzungGeben`; die Spalte heisst nur `token` |
| Öffentliche Passwörter nie im Klartext | **✅ war schon** | `passwort: await abdruck(…)` beim Anlegen, Vergleich hasht die Eingabe |
| Zeitkonstanter Vergleich | **✅ war schon** | `gleich()` in `server/kern.js` |
| HTML säubern | **✅** | `Saeubern` hängt seit A5 an sechs Stellen |
| Keine ungeprüften Redirects nach OAuth | **✅ repariert** | `rueckAdresse()`; `postMessage` an genau einen Ursprung → `test92` |
| CORS in Produktion einschränken | **✅ repariert** | `server/sicherheit/cors.js`, eine Stelle statt 36 → `test92` |
| Serverseitige Rechte durchsetzen | **✅** | `test80`–`test84` |
| Keine geheimen Schlüssel im Frontend | **✅** | der KI-Schlüssel wird eingetippt und bleibt im Browser |
| Eingaben validieren | **◐** | vorhanden, aber je Route. Nachgemessen **kein Loch**: Rollen fallen zu, Längen sind begrenzt → **D1** ist Ordnung, nicht Sicherheit |
| Rate Limiting für Login und öffentliche Seiten | **✅ repariert** | `server/sicherheit/bremse.js` → `test93` |
| Sichere Security Headers | **✅ repariert** | `server/sicherheit/kopfzeilen.js` → `test93`, `test94` |
| Keine sensiblen Daten in Logs | **✅ repariert** | Server hat **keine** `console`-Zeile; der 500er gab aber `e.message` nach draussen → `test93` |

- [x] **D2 · Rate Limiting** — erledigt. **Nicht überall gleich:** gerechnet
  statt geraten, wo es überhaupt nötig ist. Der Gerätecode hat 32⁸ ≈ 1,1·10¹²
  Möglichkeiten, der Seitenschlüssel 48 Bit — beide kann man nicht
  durchprobieren. Das **Passwort einer öffentlichen Seite** wählt ein Mensch,
  und das fällt in Sekunden. Dort zieht die Bremse (10 Versuche / 10 Minuten),
  beim Codeanfordern nur gegen das Vollschreiben (30 / Stunde).
  Gezählt werden **nur Fehlversuche** — sonst sperrte sich eine viel gelesene
  Seite selbst. Und ohne erkennbare Herkunft wird **pro Seite** gezählt, nicht
  global: ein gemeinsamer Zähler wäre keine Sicherheit, sondern eine
  Selbstsperre. Gespeichert in einer eigenen Tabelle `bremse`, per
  `CREATE TABLE IF NOT EXISTS` rückwärtskompatibel.
  *Dabei gefunden:* das Schema steht **zweimal** — in `schema.sql` und als
  Zeichenkette in `ablage.js`, weil ein Cloudflare-Arbeiter keine Datei lesen
  kann. Die beiden waren identisch, aber unbewacht. `test87` vergleicht sie
  jetzt Spalte für Spalte.
- [x] **D3 · Security Headers** — erledigt, **aber nicht überall**, und das
  war das Ergebnis der Messung statt einer Annahme.

  *Die veröffentlichte Seite bekommt eine strenge CSP.* Sie ist die einzige
  Seite dieser App, die ein **fremder** Browser darstellt, und sie braucht kein
  einziges Skript: `default-src 'none'`. Das ist das zweite Netz für `sauber()`
  auf dem Server — der arbeitet mit **regulären Ausdrücken** statt mit einem
  Parser, weil ein Cloudflare-Arbeiter kein DOM hat. `test94` stellt genau den
  Fall nach: ein Skript wird nach dem Säubern von Hand hineingelegt, und der
  Browser meldet *„Refused to execute inline script"*.

  *Die App selbst bekommt keine CSP.* Gemessen: **562** `style="…"`-Attribute,
  2 Inline-`<script>`, `new Function` in `erweiterungen.js` und `ki/agenten.js`
  — dort läuft **absichtlich**, was der Mensch selbst geschrieben hat —, und
  über zwanzig fremde Adressen, die der Mensch selbst erweitern kann. Eine CSP
  mit `'unsafe-inline' 'unsafe-eval'` ist keine CSP, sondern eine Zeile, die so
  aussieht. → **D3b**

- [ ] **D3b · Die 562 Stilattribute in Klassen überführen** — erst danach ist
  eine CSP für die App selbst mehr als Zierde. Grosse, rein mechanische Arbeit;
  eigener Schritt, weil sie kein Verhalten ändert.
- [x] **D4 · Logs durchsehen** — erledigt. Gemessen: der Server hat **keine
  einzige** `console.*`-Zeile, und die acht in der App berühren nichts
  Geheimes. Das Protokoll (`notieren`) hält Namen, Titel und Rechte fest —
  das ist sein Zweck.

  **Der Befund lag woanders:** `fehler(500, …, e.message)` gab die Meldung
  einer unerwarteten Ausnahme ungeprüft an den Aufrufer. Eine D1-Meldung nennt
  Tabellen und Spalten, eine JS-Meldung Feldnamen — und was sonst in einer
  Ausnahme steckt, weiss man vorher nicht.

  Zwei Regeln standen dabei gegeneinander: *„keine sensiblen Daten nach
  draussen"* und `CLAUDE.md`s *„keine stillen Fehlschläge"*. Aufgelöst über
  eine **Kennung**: der Mensch bekommt einen Satz und eine kurze Zeichenfolge,
  der Betreiber findet darunter die Einzelheiten in `wrangler tail`. Nur für
  den 500er — 401, 404, 410 und 429 sagen weiterhin im Klartext, was los ist.
  Ein Fehler, mit dem gerechnet wurde, ist keine Ausnahme, sondern eine
  Antwort.

- [ ] **D1 · Ein Prüfpunkt für Eingaben** — **kein Sicherheitsloch.**
  Nachgemessen ist die Prüfung überall da, sie steht nur je Route statt an
  einem Ort: Längen sind mit `.slice()` begrenzt, Rollen werden zweimal
  gegen die erlaubte Liste geprüft, und `darf()` fällt bei einer unbekannten
  Rolle auf `kein` zurück — es **sperrt** im Zweifel, statt durchzulassen.
  `test93` Abschnitt 7 hält diese Richtung fest, denn genau die lässt sich
  beim Umbauen lautlos umdrehen.

  Was offen bleibt, ist Ordnung: die Prüfungen an einem Ort zu bündeln.
  Ein Umzug ohne Verhaltensänderung — eigener Schritt, wie E3.

---

## Die Reihenfolge, in der ich das abarbeite

1. **B1** If/Else in Aktionsketten — die grösste offene Lücke aus Teil 2
2. **B2** Datenbalken und Farbskalen
3. **A1** die 129 Formelbeschreibungen — reine Fleissarbeit, sofort nutzbar
4. **B4** die vier ungezählten Listen Zeile für Zeile
5. **A2/A3** Blocktypen und Kürzel nach dem Ergebnis von B4
6. **C1** verschlüsselter Bestand
7. **AUSSEHEN.md** — die 270 Screenshots in Blöcken zu zwanzig
