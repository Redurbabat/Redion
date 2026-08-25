# Der grosse Auftrag — Stand nach dem 25. August 2026

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
| 44 | Quellenwahrheit | ◐ | Jedes abgeleitete Objekt trägt seinen `sourceRef` (E129/E130) und findet seit E155 auch zurück: ein Knopf, der das Ziel benennt („↩ PDF · Seite 14"), test220 (21 Punkte), `bilder.mts quelle`. Seit E161 auch aus der Besprechung heraus, mit Sekunde: die KI wird danach gefragt, und eine Zeitmarke, die im Protokoll nicht vorkommt, wird verworfen (test223, 22 Punkte). Dabei fiel auf, dass das Produkt bis dahin gar keine Herkunft schrieb — test220 §3 prüfte den Zeichner an einem selbstgebauten Fixture. Offen bleibt nur noch, ob ein echtes Modell brauchbare Sekunden liefert (L57) |
| 45 | Startseite | ✅ | Heute-Dashboard, test208 |
| 46 | Schnellaktionen | ✅ | elf Wege im Neu-Blatt, test114 (E138/E139) |
| 47 | Visuelle Qualität | ◐ | Laufende Arbeit, und sie hört nicht auf: E140 (Umlaute), E141 (PDF-Leiste am Telefon), E142 (Kontrast), E148 (abgeschnittene Zähler, Streifen über der Produktwelt, Platzhalter, 120 verlorene Pixel), E151 (Handlung über der Falz). Festgehalten in test214 und test217 — was gemessen ist, kann nicht zurückrutschen |
| 48 | Dark/Light | ✅ | test128 §9 rechnet den Kontrast jedes Knopfes in beiden Lagen (E142) |
| 49 | Empty States | ✅ | E143 ist der Musterfall; test208 §8 |
| 50 | Onboarding der Hauptbereiche | ✅ | Angebot statt Pflicht (E137), test206 §8 |
| 51 | Ein Objekt, viele Ansichten | ✅ | test206 §3, E143 |
| 52 | Keine Duplikat-Architektur | ✅ | test206 §3 und §4, E138 |
| 53 | Performance | ✅ | test195 §5 (Fenster ab 240 Seiten) |
| 54 | Offline first | ✅ | test31 §3 (Service Worker, Server aus, Seite neu geladen) |
| 55 | Tests während der Arbeit | ✅ | jede Behebung mit Gegenprobe |
| 56 | Neue Tests | ✅ | test200, test205–test220 — sechzehn Suiten, jede mit einzeln zurückgenommenen Gegenproben |
| 57 | Build | ✅ | `npm run bauen:ts`, `node bauen.mts`, test105 |
| 58 | Dokumentation | ✅ | diese Datei, ENTSCHEIDUNGEN.md E132–E155, LUECKEN.md L49–L57 (L53, L55, L56 geschlossen) |
| 59 | Git | ✅ | `claude/redion-head2-desktop-move-j47chf` und `codex-study-suite`, main unberührt |
| 60 | Arbeitsweise | ✅ | ohne Pause, in einem Strang |

---

## Was als Nächstes drankäme

Keiner der 60 Abschnitte ist mehr offen; vier stehen halb, und bei jedem
steht dabei, warum. Was bleibt, ist klein und benannt:

1. **L57** — die Aufgabe aus einer Besprechung findet ihr Meeting, aber nicht
   die Minute. Die Angabe existiert nicht: die KI gibt `{ was, wer, bis }`
   zurück, ohne Zeit. Der saubere Weg wäre, sie mitzufragen — das braucht
   eine Änderung an der KI-Anweisung und ein Modell zum Messen.
2. **§13 Uni** und **§35 Gemeinsam** bleiben halb, aber nicht aus Versäumnis:
   Semester aus Titeln zu erkennen ist so gewollt (§13 verbietet ein zweites
   Datensystem), und ohne Server ist Teilen nun einmal ein Export.
3. **§47 Visuelle Qualität** hört nicht auf. E140, E141, E142, E148 und E151
   sind fünf Schritte; der sechste findet sich, sobald wieder jemand
   hinsieht statt zu lesen (§55).

## Was seit der ersten Fassung dieser Datei dazukam

| Abschnitt | Womit | Was dabei herauskam |
| --- | --- | --- |
| §37, §38 | test211 | 50 Punkte für Elektro und Rechnen |
| §22 | E144 | der Rest des Whiteboards |
| §23 | E145, test212 | war nie offen — falsch als fehlend eingetragen |
| §16 | E146, test206 §12 | „Geteilt öffnen" zeichnete das Feld nicht neu |
| §28 | E147, test213 | Dateinamen und Quellen suchbar; **L55 geschlossen** |
| §9, §14 | E149, test215 | Lernpfad und Arbeit, XP getrennt von Wissen |
| §18, §39 | E150, test216 | der OCR-Dienst liegt bei; **L53 geschlossen** |
| §31 | E151, test217 | der Startknopf stand 188 px unter der Falz |
| §41 | E152, test218 | die unverteilte Aufgabe war für niemanden da |
| — | E153, test218 §8 | wer sich einen Namen gab, verlor seine Liste; **L56** |
| §43 | E154, test219 | der Obsidian-Rundlauf, einmal ganz durchgelaufen |
| §44 | E155, test220 | der Weg zurück zur Quelle; offen bleibt **L57** |
| §47 | E148, test214 | vier Sachen, die nur das Hinsehen fand |
| §47 | E156, test221 | „Volle Breite" gab am Telefon WENIGER Breite |
| — | E157, alle.mts | ein Lauf, der wartet, sah aus wie einer, der rechnet |
| CLAUDE.md §5 | E158, test222 | sechs Bereiche standen in keinem Katalog; **L51 halb zu** |
| §47 | E159, test221/217 | ein schwarzer Schatten auf schwarzem Grund; **L58 zu** |
| CLAUDE.md §5 | E160, test222 §5 | drei Registereinträge waren falsch, weil sie niemand las |
| §44 | E161, test223 | Besprechungsaufgaben bekommen ihre Herkunft — und die Sekunde |
| §11 | E162, test224 | eine Prüfung zählte den ganzen Bestand als ihren Stoff |
| §11 | E163, test224 §5 | Simulationsergebnisse überleben jetzt den Reiterwechsel |
| §9 | E164, test215 §3/§8 | der Pfad sagt jetzt, was ihn geordnet hat — und wann nichts; **L49 zu** |
| §43 | E165, test187 §6 | „Übernehmen" nahm Farbe und Schrift mit; jetzt überleben sie |
| CLAUDE.md §5 | E166, test222 §6 | „Meine Apps" stand in zwei Listen; jetzt im Register |
| CLAUDE.md §5 | E167, test222 §7 | der Fuss dazu; **L58 steht**, drei Zeilen bleiben mit Begründung |

Elf neue Prüfläufe (test212 bis test222), dazu neue Abschnitte in test181,
test206, test218 und test86. Gezählt, nicht geschätzt:

```txt
7   fanden einen Fehler im Produkt      E146 · E147 · E148 · E151 · E152/E153
                                        E156 · E158
2   bauten etwas, das fehlte            E150 (OCR-Dienst) · E155 (Rücksprung)
1   fand einen Fehler an der Prüfseite  E157 (ein Lauf hing 25 Minuten, und
                                        niemand sah es ihm an)
2   fanden nichts — und das ist gut     test215, test219 hielten fest, was
                                        steht, damit es nicht wegrutscht
```

Und in **acht** davon steckte ein Fehler nicht im Produkt, sondern in meiner
eigenen Messung: ein `textContent`, das kein Tippen ist (E145); ein `|| -1`
auf einem Zähler, der bei 0 anfängt (E146); ein `clientWidth`, das die
Innenabstände mitzählt (E148); ein Suchbereich, der die Notiz auch woanders
fand (E149); ein `\b2\b`, das die 2 aus „SM-2" nahm (E151); eine Zuordnung,
auf der ich `.find()` aufrief (E155); ein `getBoundingClientRect()`, das den
Kasten misst und nicht die Schrift darin (E156); und ein `.toast`, das es
gar nicht gibt — gesucht wurde eine Kachelliste, vorhanden ist EIN festes
Element namens `#toast` (E158).

Das ist die teurere Sorte, und deshalb steht sie bei jedem Eintrag dabei: ein
Punkt, der aus dem falschen Grund grün ist, fällt niemandem auf.

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
