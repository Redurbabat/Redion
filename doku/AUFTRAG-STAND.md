# Der grosse Auftrag — Stand nach dem 24. August 2026

Diese Datei beantwortet eine Frage: **was von den 60 Abschnitten steht, was
steht halb, und was steht nicht.**

Sie ist nach Beweisen sortiert, nicht nach Absichten. Drei Zeichen:

```txt
✅  gebaut UND geprüft   — es gibt einen Prüflauf, der rot wird, wenn es kaputtgeht
◐   gebaut, teilweise    — es läuft, aber ein Teil des Abschnitts fehlt (steht dabei)
✗   offen                — nicht gebaut
?   ungeprüft            — gebaut, aber kein Prüflauf und kein Bildschirmfoto
```

Ein `?` ist keine Beruhigung. Genau dort sassen E135 (sieben falsche Zahlen),
E138 (die Fläche endete am Kastenrand), E141 (17 von 21 Knöpfen draussen) und
E143 (die leere Wand vor vollen Regalen) — alle vier in Teilen, die als
„fertig" galten.

---

## Die Abschnitte

| § | Thema | Stand | Wo, und was noch fehlt |
|---|-------|:-----:|------------------------|
| 1 | Nicht auf eine Phase beschränken | ✅ | E132–E143 in einem Durchgang |
| 2 | Bestehende Study Suite mitnehmen | ✅ | test202, 84 Punkte |
| 3 | Offene Testprobleme schliessen | ✅ | test101 und test202 grün, voll75 |
| 4 | Zwei Produktwelten | ✅ | `produktwelten.ts`, test206 |
| 5 | Lernen & Alltag | ✅ | `lernwelt.ts`, test208 |
| 6 | Bereiche / Profile | ✅ | `lebensbereiche.ts`, test204 |
| 7 | Heute-Dashboard | ✅ | test208 §1–§4, `bilder.mts heute` |
| 8 | Lernzentrale | ✅ | test208, `bilder.mts lernzentrale` |
| 9 | Lernpfad | ◐ | steht und rechnet; `bilder.mts lernpfad`. Kein eigener Prüflauf für die Etappenlogik |
| 10 | Fehlertraining | ✅ | test208 §4 |
| 11 | Prüfungen | ✅ | test208 §6, `bilder.mts pruefungen`. Simulationsergebnisse werden bewusst NICHT in den SM-2-Stand geschrieben |
| 12 | Schule / Ausbildung | ✅ | test208 §8 (E143), `bilder.mts schule` |
| 13 | Uni | ◐ | Ansicht steht über vorhandenen Objekten. Semester und Module werden aus Titeln erkannt, nicht als eigene Struktur — so gewollt (§13: „nicht als komplett anderes Datensystem") |
| 14 | Arbeit | ◐ | Ansicht steht, `bilder.mts arbeit`. Kein eigener Prüflauf |
| 15 | Workspace | ✅ | `arbeitswelt.ts`, test206 |
| 16 | Tabs und Arbeitsfluss | ◐ | Reiter und geteilte Ansicht stehen im Workspace-Panel. Kein eigener Prüflauf für das Teilen |
| 17 | PDF-Arbeitsplatz | ✅ | test210 (sechs Abschnitte), test204 §2 (1366×768 und mobiler Drawer), `bilder.mts dokument` (E141) |
| 18 | PDF → Lernen | ◐ | Ausschnitt, Erkennen, „Aus Inhalt" stehen im Inspector. „⌁ Erkennen" braucht einen Dienst, den Redion nicht mitliefert (L53) |
| 19 | PDF → Notizen | ✅ | E104, test182 |
| 20 | Ink V2 | ✅ | `marken.ts`; test204 §1 (übersteht einen echten Reload), test210 §2 und §4 (Beschriftung, rollende Leiste) |
| 21 | Papiervorlagen | ✅ | test207, `bilder.mts papier` |
| 22 | Whiteboard | ✅ | test209, `bilder.mts whiteboard`/`whiteboards` (E138). Offen: Grösse ändern, mehrstufiges Zurück, Text ohne `prompt()` — L54 |
| 23 | Dokumente (Word-artig) | ◐ | Seitenansicht, Überschriften, Listen, Tabellen, Bilder, Druck/PDF stehen. Vorschlagsmodus fehlt |
| 24 | Tabellen (Excel-artig) | ✅ | `spreadsheet/`, test110 (Kern), test111 (Block), test116 (ODS), test123, test130 |
| 25 | Bibliothek | ✅ | `bibliothek.ts`, test33 (Bibliothek, Reiter, Spalten, Favoriten) |
| 26 | Aufgaben | ✅ | `Bibliothek.meineAufgaben`, test33 (Gruppen, Filter, Quellen) |
| 27 | Kalender / Planung | ✅ | `planen/`, test54 |
| 28 | Globale Suche | ◐ | Seiten, Blöcke, Aliasse, PDF-Suchtext und OCR-Text sind im Index (`text`, `suchtext`, `ocrText`); Aufgaben, Lernkarten, Wiki und Meetings kommen als Blocktext mit. NACHGESEHEN: Dateinamen aus dem Fach `dateien` werden nicht durchsucht, Quellenangaben nur, soweit sie im Text stehen. test195 deckt den Index, nicht die Breite |
| 29 | Command Palette | ✅ | test206 §11 (E139) |
| 30 | Mobile first (428 px) | ✅ | test114, test54, test209 §9, test210 §3 |
| 31 | Mobile Lernen | ◐ | Lernwelt läuft am Telefon; Tastatur ist dort ohne Belang. Kein eigener Telefon-Prüflauf für die Lernrunde |
| 32 | Mobile PDF | ✅ | test210 §3–§5 |
| 33 | Mobile Workspace | ✅ | test209 §9, test206 §6 |
| 34 | Responsive | ✅ | test114 misst 320–1440 px |
| 35 | Gemeinsam | ◐ | Server, Rechte, öffentliche Seiten stehen (test119 Anhänge, test120 Konto, test121 Rechte und Freigaben). Ohne Server bleibt Teilen ein Export |
| 36 | Persönlicher Lernstand bei geteilten Karten | ✅ | `lebensbereiche.ts`, test204 §4 (übersteht Reload und Zweitgeräte-Merge) |
| 37 | Elektro-Ausbildung | ? | `electrical.ts`, 398 Zeilen. Kein Prüflauf, kein Bildschirmfoto |
| 38 | Elektro-Rechner | ? | `calculations.ts`. Kein Prüflauf |
| 39 | OCR / Capture | ◐ | `recognition.ts` steht, der Dienst dahinter fehlt (L53) |
| 40 | Audio | ✅ | `besprechung.ts`, Anhänge statt Zeichenketten (E128) |
| 41 | Meetings | ◐ | `besprechung.ts` steht mit Aufnahme, Marken und Auswertung. Welcher Prüflauf sie deckt, habe ich nicht nachgesehen — bis dahin gilt ◐ |
| 42 | Wissen | ✅ | `verweise.ts`, test195 |
| 43 | Obsidian / Vault | ◐ | Resolver für Titel, Aliasse, Vault-Pfade (E129). Kein Rundlauf-Prüflauf |
| 44 | Quellenwahrheit | ◐ | Provenienz an Erkennung und Elektro. Nicht überall |
| 45 | Startseite | ✅ | Heute-Dashboard, test208 |
| 46 | Schnellaktionen | ✅ | elf Wege im Neu-Blatt, test114 (E138/E139) |
| 47 | Visuelle Qualität | ◐ | laufende Arbeit; E140–E142 sind drei Schritte davon |
| 48 | Dark/Light | ✅ | test128 §9 rechnet den Kontrast jedes Knopfes in beiden Lagen (E142) |
| 49 | Empty States | ✅ | E143 ist der Musterfall; test208 §8 |
| 50 | Onboarding der Hauptbereiche | ✅ | Angebot statt Pflicht (E137), test206 §8 |
| 51 | Ein Objekt, viele Ansichten | ✅ | test206 §3, E143 |
| 52 | Keine Duplikat-Architektur | ✅ | test206 §3 und §4, E138 |
| 53 | Performance | ✅ | test195 §5 (Fenster ab 240 Seiten) |
| 54 | Offline first | ✅ | test31 §3 (Service Worker, Server aus, Seite neu geladen) |
| 55 | Tests während der Arbeit | ✅ | jede Behebung mit Gegenprobe |
| 56 | Neue Tests | ✅ | test200, 205–210 |
| 57 | Build | ✅ | `npm run bauen:ts`, `node bauen.mts`, test105 |
| 58 | Dokumentation | ✅ | diese Datei, ENTSCHEIDUNGEN.md E132–E143, LUECKEN.md L49–L54 |
| 59 | Git | ✅ | `claude/redion-head2-desktop-move-j47chf` und `codex-study-suite`, main unberührt |
| 60 | Arbeitsweise | ✅ | ohne Pause, in einem Strang |

---

## Was als Nächstes drankäme

Nach Nutzen sortiert, nicht nach Abschnittsnummer:

1. **§37/§38 ansehen.** Zwei Module, rund 600 Zeilen, kein Prüflauf und kein
   Bild. Genau die Lage, in der E135 und E141 sassen.
2. **§22 fertig machen** (L54): Grösse ändern, mehrstufiges Zurück,
   Text ohne `prompt()`.
3. **§23 Vorschlagsmodus** — das einzige, was am Dokumentmodus noch fehlt.
4. **§39 entscheiden** (L53): Dienst mitliefern, ausbauen oder ehrlich
   beschriften. Ein Knopf, hinter dem nichts ist, ist die schlechteste der
   drei Möglichkeiten.
5. **§16 Reiter prüfen** — sie stehen, aber nichts hält sie fest.

---

## Wie diese Datei zu lesen ist

Ein ✅ heisst: es gibt einen Prüflauf, und der Prüflauf ist auf seine
Gegenprobe hin geprüft — zurückgedreht, rot gesehen, wieder eingesetzt.
Ein ✅ ohne diese Gegenprobe wäre nur eine zweite Behauptung.

Ein `?` ist ehrlicher als ein optimistisches ✅. Es steht dort, wo Code
vorhanden ist, den niemand laufen gesehen hat.

Und die Prüflaufnummern in dieser Tabelle sind NACHGESEHEN, nicht erinnert.
Beim ersten Schreiben standen hier „test91–test97" für die Tabellen und
„test80–test84" für die Rechte; beide Spannen gehören zu ganz anderen
Themen. Eine falsche Quellenangabe ist schlimmer als keine — sie schickt den
Nächsten an eine Stelle, an der nichts steht.
