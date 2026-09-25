# FREMDCODE.md — was Redion gehört, was fremd ist, und was es bringt

**Redur, 25. September 2026, wörtlich:**

> „also redion kann fremnden code haben wenn es redion verbessert wird, und
> so nicht das die pdf oder bilder oder geheimnisse daten an die driete
> anbiter geht , und ausserdem nehem fremde coden es ist keine proble aber
> bevor du etwas fremnes nimmst frage mich und ausserdem muss fremncode.md
> erstellen damit ich was was mir gehört und was fremd ist und was wird es
> im redion verbessser"

Daraus die Regel (E683, CLAUDE.md §57):

```txt
1. Fremder Code darf in Redion, wenn er Redion verbessert.
2. Er darf nie PDFs, Bilder oder Geheimnisse an Dritte schicken.
3. Bevor etwas Fremdes genommen wird, wird Redur gefragt — jedes Mal.
4. Jedes fremde Stück steht in dieser Datei: woher, welche Fassung,
   welche Lizenz, was es verbessert, was daran geändert wurde.
```

Diese Datei ist die Grenze zwischen „meins" und „fremd". Wer etwas
Fremdes hereinnimmt, trägt es hier ein — **vorher**, nicht hinterher. Ein
fremdes Stück, das hier nicht steht, ist ein Fehler, kein Stil.

---

## 1. Was Redion gehört

Alles, was nicht unten unter 2 steht. Konkret: `src/`, `quell/` (ausser
`quell/fremd/`), `server/`, `pruefungen/`, `doku/`, `chronik/`, alle
`.md`, alle Werkzeuge in der Wurzel (`bauen.mts`, `chronik.mts`,
`karte.mts`, …), `index.html`, `redion-einzeldatei.html`, die Stilblätter,
die Icons unter `oeffentlich/icons/`, die Fachzeichen, die Formeln.

Das schliesst ein, was **nach fremdem Vorbild** gebaut wurde: „wie in
Notion", „wie in GoodNotes", „wie AFFiNE edgeless" sind Hinweise auf eine
Lösung, keine Herkunft (CLAUDE.md §2). Kein Byte davon stammt von dort.

Gebaut wird mit `typescript`, geprüft mit `playwright` und `@types/node` —
das sind Werkzeuge, die nicht ausgeliefert werden (`package.json`:
keine Laufzeit-Abhängigkeit, drei Entwicklungs-Abhängigkeiten).

---

## 2. Was fremd ist

| Was | Fassung | Lizenz | Wo | Was es verbessert | Was daran geändert ist | Wächter |
|---|---|---|---|---|---|---|
| **pdf.js** (`pdfjs-dist`, Bau `legacy`) | 6.2.108 | Apache-2.0 (`quell/fremd/pdfjs/LIZENZ.txt`) | `quell/fremd/pdfjs/daten.js` — `pdf.min.mjs` (512'483 Bytes' sha256 `9fab0c910bf1…`) · `pdf.worker.min.mjs` (1'312'452 Bytes' sha256 `bc0d1b88ea0b…`); Lader `src/fremd/pdfjs/laden.ts` (Redion-Code) | Ohne sie kann Redion eine PDF-Seite nicht selbst zeichnen; siehe ENTSCHEIDUNGEN.md E103. | **nichts**: die Originaldateien liegen gzip-gepackt als Base64 vor und werden erst beim ersten PDF ausgepackt (E389) | `test177` packt aus und rechnet die Prüfsummen nach; `pruefungen/fremd-bestand.json` ist das Verzeichnis |
| **WebLLM** (`@mlc-ai/web-llm`) | die, die `esm.run` gerade liefert — **nicht festgenagelt** | Apache-2.0 | nicht im Verzeichnis: `src/bereiche/ki/dienst.ts` lädt sie zur Laufzeit von `https://esm.run/@mlc-ai/web-llm`, nur wenn der Mensch WebLLM wählt | lokale KI im Browser ohne Ollama (§21) | keine; Modellgewichte kommen vom Modellanbieter (`CreateMLCEngine`), beim ersten Mal mit Internet | keiner — siehe offene Frage unten |

Mehr fremden Code gibt es nicht. Nachgezählt am 25. September 2026:
`find . -iname "LICENSE*"` (ausser `node_modules`) findet nur
`quell/fremd/pdfjs/LIZENZ.txt`; `grep -rn "esm.run\|unpkg\|jsdelivr\|cdn"
src index.html` findet nur die WebLLM-Zeile.

**Offene Frage an Redur (aus dieser Zählung):** WebLLM ist das einzige
Stück fremder Code, das **zur Laufzeit aus dem Netz** kommt, ohne Fassung
und ohne Prüfsumme. Das widerspricht dem Geist von `test177`. Zwei Wege:
die Bibliothek wie pdf.js einpacken (gross — mehrere Megabyte) oder die
Fassung im Pfad festnageln (`@mlc-ai/web-llm@x.y.z`) und den Schalter in
den Einstellungen deutlich beschriften. Bis Redur entscheidet, bleibt es,
wie es ist.

---

## 3. Nur gelesen, nichts genommen

| Was | Lizenz | Wozu gelesen | Genommen |
|---|---|---|---|
| **AFFiNE** (`AFFiNE-canary`) | `blocksuite` und die meisten Pakete MIT; `packages/backend` eigene Lizenz | Plattform-Audit (E681): GFX-Aufbau; Redurs Bild der Edgeless-Leiste (AUFGABEN W6) | **nichts** — kein Code, kein Icon, keine Oberfläche; die Struktur der Werkzeugleiste ist als Massstab in W6 beschrieben |
| **SiYuan** (`siyuan-master`) | AGPL-3.0 | Plattform-Audit (E681): Plugin-System, Marktplatz, Kernel-API | **nichts** — und AGPL-Code kann auch künftig nur mit einer eigenen Lizenzentscheidung Redurs herein (er würde Redion mit lizenzieren) |
| **Amdion** | eigenes Projekt Redurs | Lesequelle (`doku/AMDION-UEBERNAHME.md`) | nach den dortigen Regeln |

Die Archive liegen ausserhalb des Verzeichnisses (§1, §42 sinngemäss).

---

## 4. Dienste, an die Daten gehen KÖNNEN — nur, wenn der Mensch es will

Das ist kein Fremdcode, gehört aber zu Redurs zweitem Satz („nicht dass
die PDF oder Bilder oder Geheimnisse an Dritte gehen"):

| Dienst | Was hingeht | Wann |
|---|---|---|
| Ollama (`localhost:11434`) | Text der Anfrage | bleibt auf dem Rechner |
| WebLLM | nichts — das Modell läuft im Browser; nur der Download der Gewichte geht hinaus | beim ersten Laden |
| Wolken-KI (Gemini, Groq, …; `src/bereiche/ki/dienst.ts`) | der Text, den der Mensch der KI gibt | nur mit eigenem Schlüssel und eigener Wahl (§21, E661) |
| Google Drive / Kalender / Gmail (`src/bereiche/verbinden/`, `datenbanken/steuerung.ts`) | was der Mensch ausdrücklich verbindet | nach Anmeldung, je Vorgang |
| Cloudflare (Abgleich, Freigabe) | die Blöcke und Anhänge des Arbeitsbereichs | nur mit Konto und eingeschaltetem Abgleich (§24, E1/E34) |

**Nie:** eine PDF, ein Bild oder ein Geheimnis (`wolkeToken`, `api:*`,
Passwörter) ohne ausdrückliches Ja an irgendjemanden — nicht durch
Redion, nicht durch fremden Code in Redion. Ein fremdes Stück, das das
täte, kommt nicht herein, egal wie viel es verbessert.

---

## 5. So wird etwas Fremdes genommen

```txt
1. Redur fragen: was, woher, welche Lizenz, was es verbessert, was es kostet.
2. Lizenz prüfen: MIT, BSD, Apache-2.0, ISC — mit Namensnennung möglich.
   GPL/AGPL — nur mit eigener Lizenzentscheidung (ENTSCHEIDUNGEN.md).
   Keine Lizenz — nein.
3. Fassung festnageln, Bytes und Prüfsumme in pruefungen/fremd-bestand.json,
   Lizenztext daneben (wie quell/fremd/pdfjs/LIZENZ.txt), ein Wächter wie
   test177.
4. Eintrag hier, in Abschnitt 2, mit allen sieben Spalten — vorher.
5. Kein Laden aus dem Netz zur Laufzeit ohne Fassung und ohne Redurs Ja.
6. Was daran geändert wird, steht in der Spalte „Was daran geändert ist" —
   ein geflickter Fremdcode ohne Notiz ist beim nächsten Update weg.
```
