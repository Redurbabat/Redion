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
| 9 | Lernpfad | ✅ | test215 §1–§4: Reihenfolge aus §9, keine gesperrte Stufe, Stand aus SM-2 — 5000 XP ändern ihn nicht, eine echte Wiederholung schon. `bilder.mts lernpfad` |
| 10 | Fehlertraining | ✅ | test208 §4 |
| 11 | Prüfungen | ✅ | test208 §6, `bilder.mts pruefungen`. Simulationsergebnisse werden bewusst NICHT in den SM-2-Stand geschrieben |
| 12 | Schule / Ausbildung | ✅ | test208 §8 (E143), `bilder.mts schule` |
| 13 | Uni | ◐ | Ansicht steht über vorhandenen Objekten. Semester und Module werden aus Titeln erkannt, nicht als eigene Struktur — so gewollt (§13: „nicht als komplett anderes Datensystem") |
| 14 | Arbeit | ✅ | test215 §5–§7: alle sechs Rubriken mit echten Daten, Meetings zeigen auf die Besprechungsseite selbst (keine Zweitschrift), Klick öffnet. `bilder.mts arbeit` |
| 15 | Workspace | ✅ | `arbeitswelt.ts`, test206 |
| 16 | Tabs und Arbeitsfluss | ✅ | test206 §12 (elf Punkte): zwei Reiter, Wechseln, geteilt Öffnen, Teilung schliessen, Reiter schliessen. Der Prüflauf fand dabei, dass „Geteilt öffnen“ das Feld nicht neu zeichnete — E146 |
| 17 | PDF-Arbeitsplatz | ✅ | test210 (sechs Abschnitte), test204 §2 (1366×768 und mobiler Drawer), `bilder.mts dokument` (E141) |
| 18 | PDF → Lernen | ✅ | Ausschnitt, Erkennen und „Aus Inhalt“ stehen im Inspector. Der Dienst hinter „⌁ Erkennen“ liegt seit E150 bei (`dienste/ocr.mts`, `doku/OCR-DIENST.md`, test216) |
| 19 | PDF → Notizen | ✅ | E104, test182 |
| 20 | Ink V2 | ✅ | `marken.ts`; test204 §1 (übersteht einen echten Reload), test210 §2 und §4 (Beschriftung, rollende Leiste) |
| 21 | Papiervorlagen | ✅ | test207, `bilder.mts papier` |
| 22 | Whiteboard | ✅ | test209 (zehn Abschnitte, 55 Punkte), `bilder.mts whiteboard`/`whiteboards` (E138, E144). Offen nur noch: Verbindungen in der Miniatur — L54 |
| 23 | Dokumente (Word-artig) | ✅ | test212 (sechs Abschnitte, 32 Punkte). Der Vorschlagsmodus stand hier als fehlend — falsch, er ist vollständig da: `schale.ts` (Band, Fenster, Annehmen/Verwerfen), `editor.ts` (Festhalten beim Verlassen eines Blocks). Berichtigt mit E145 |
| 24 | Tabellen (Excel-artig) | ✅ | `spreadsheet/`, test110 (Kern), test111 (Block), test116 (ODS), test123, test130 |
| 25 | Bibliothek | ✅ | `bibliothek.ts`, test33 (Bibliothek, Reiter, Spalten, Favoriten) |
| 26 | Aufgaben | ✅ | `Bibliothek.meineAufgaben`, test33 (Gruppen, Filter, Quellen) |
| 27 | Kalender / Planung | ✅ | `planen/`, test54 |
| 28 | Globale Suche | ✅ | Seiten, Blöcke, Aliasse, PDF-Suchtext und OCR-Text; Aufgaben, Lernkarten, Wiki und Meetings kommen als Blocktext mit. Dateinamen aus dem Fach `dateien` und Quellenangaben (`quiz.source`, `learningPackage.license`) seit E147. Eine Funktion — `Store.durchsuchbar` — entscheidet für beide Suchen, was durchsuchbar ist. test195 (Index), test213 (Breite, 20 Punkte) |
| 29 | Command Palette | ✅ | test206 §11 (E139) |
| 30 | Mobile first (428 px) | ✅ | test114, test54, test209 §9, test210 §3 |
| 31 | Mobile Lernen | ✅ | test217 (fünf Abschnitte, 24 Punkte): die vier Zahlen und „Tagesrunde starten" stehen am Telefon über der Falz — vorher lag der Knopf 188 px darunter (E151). Reiterleiste mit Rollhinweis. Am Rechner unverändert |
| 32 | Mobile PDF | ✅ | test210 §3–§5 |
| 33 | Mobile Workspace | ✅ | test209 §9, test206 §6 |
| 34 | Responsive | ✅ | test114 misst 320–1440 px |
| 35 | Gemeinsam | ◐ | Server, Rechte, öffentliche Seiten stehen (test119 Anhänge, test120 Konto, test121 Rechte und Freigaben). Ohne Server bleibt Teilen ein Export |
| 36 | Persönlicher Lernstand bei geteilten Karten | ✅ | `lebensbereiche.ts`, test204 §4 (übersteht Reload und Zweitgeräte-Merge) |
| 37 | Elektro-Ausbildung | ✅ | test211 §5 und §6 (Paketprüfung, Einbau als gewöhnliche Karteikarten, Quarantäne bleibt draussen) |
| 38 | Elektro-Rechner | ✅ | test211 §1–§4 (neun Rechnungen von Hand nachgerechnet, Fehlersätze statt NaN, Annahmen, Ergebnis als normaler Block), `bilder.mts elektro` |
| 39 | OCR / Capture | ✅ | `recognition.ts` steht, und der Dienst dahinter liegt seit E150 bei: `dienste/ocr.mts` (nur 127.0.0.1, `spawn` ohne Shell, geprüfte Sprachangabe), `doku/OCR-DIENST.md`, test216 (32 Punkte) |
| 40 | Audio | ✅ | `besprechung.ts`, Anhänge statt Zeichenketten (E128) |
| 41 | Meetings | ✅ | `besprechung.ts` mit Aufnahme, Marken und Auswertung. NACHGESEHEN: test32 deckte nur den Seitenleisten-Abschnitt, test35 einen Menüeintrag. Der fehlende Lauf ist test218 (sieben Abschnitte, 43 Punkte) — er fand, dass die unverteilte Aufgabe in keiner Liste stand (E152) |
| 42 | Wissen | ✅ | `verweise.ts`, test195 |
| 43 | Obsidian / Vault | ✅ | Resolver für Titel, Aliasse, Vault-Pfade (E129). Der Rundlauf läuft jetzt einmal ganz durch: test219 (sechs Abschnitte, 31 Punkte) — Export, Einlesen, nochmal Einlesen, ohne Kennung, mit kaputter Kennung, und ein fremder Vault mit gleichem Titel (E154) |
| 44 | Quellenwahrheit | ◐ | Jedes abgeleitete Objekt trägt seinen `sourceRef` (E129/E130) und findet seit E155 auch zurück: ein Knopf, der das Ziel benennt („↩ PDF · Seite 14"), test220 (21 Punkte), `bilder.mts quelle`. Offen bleibt die Sekunde bei Aufgaben aus Besprechungen — die Angabe existiert nicht (L57) |
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

1. **L57** — die Aufgabe aus einer Besprechung findet ihr Meeting, aber nicht
   die Minute. Braucht eine Änderung an der KI-Anweisung und ein Modell zum
   Messen.
3. **§47 Visuelle Qualität** — laufende Arbeit, E140–E142 und E148 sind
   vier Schritte davon.

Erledigt seit der ersten Fassung dieser Datei: §37 und §38 (test211, 50
Punkte), der Rest von §22 (E144) und §23 — das war nie offen, sondern
falsch eingetragen (E145, test212), §16 (test206 §12, E146), §28 (test213, E147 — L55 geschlossen) sowie §9 und §14 (test215, E149). Und §18/§39: der OCR-Dienst liegt jetzt bei (E150, test216 — L53 geschlossen). Und §31 (test217, E151) sowie §41 (test218, E152). Dabei fiel L56 auf und ist geschlossen: wer sich
einen Namen gab, sah seine Aufgabenliste leer (E153). Und §43 (test219, E154). §44 ist mit E155/test220 fast fertig — offen nur L57.

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
