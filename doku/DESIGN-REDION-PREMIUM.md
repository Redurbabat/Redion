# Redion Premium – die ruhige Studio-Schale

Stand 6. September 2026, nach dem Abschluss des Workspace-/Ruhe-Umbaus
(E457). Dieser Bericht sagt, was sichtbar ist, wo die alten Wege liegen
und was geprüft wurde — und was nicht.

## Was man sieht

**Am Rechner (≥ 761 px)** stehen vier Leisten, keine davon doppelt:

| Leiste | Inhalt |
|---|---|
| Studio-Kopf | Marke · Navigation ein/aus · Suchen & finden · Farbschema · PDF öffnen (nur ausserhalb des Regals) · Neu · Werkzeuge · Posteingang (nur mit Ungelesenem) · Konto (mit Wolkenpunkt) |
| Kante links | Bibliothek · Notizhefte · Lernzentrum · Mehr Orte — darunter Seiten · Werkzeuge — unten Einstellungen |
| Kopfzeile | Zurück · Vor · Krume · KI · (auf einer Seite: Favorit, Seitenmenü) |
| Menüband | **nur auf Abruf**: der Werkzeug-Knopf im Studio-Kopf klappt es auf, Esc schliesst es und gibt den Fokus zurück |

Die drei Orte kommen aus `Register.navigation` (`haupt: true`, `hauptRang`);
Heute, Elektrotechnik und Aufgaben tragen dort `ruhig: false` und liegen
hinter „Mehr Orte". Wer auf einem davon steht, sieht es an „Mehr Orte"
(`ist-hier`, `aria-current`). Ohne ruhigen Modus (Einstellungen →
„Ruhige Leiste" aus) stehen alle sechs da.

**Am Telefon (≤ 760 px)** bleibt der Aufbau aus E236: oben die Zeile mit
Werkzeuge ⌄ · Suche · KI · Konto (das Band, zugeklappt), unten die fünf
Wege Dokumente · Heute · Lernen · Termine · Mehr. Der Studio-Kopf gibt es
dort nicht, deshalb darf das Band dort nie verschwinden — die Regel dafür
ist auf ≥ 761 px beschränkt.

**Das Regal (Bibliothek)** hat einen Kopf für alle drei Darstellungen
(Deckel, Regal, Liste): Titel, Neu, PDF importieren, Ort-Knopf mit allen
Reitern, Ordner-&-Seiten-Baum (aufklappbar, merkt sich den Zustand),
Schnellwege (Meine Ablage · Zuletzt geöffnet · Favoriten · Alle PDFs),
Sammlungen ⌄, Suche, „Weiterarbeiten", Art-Filter (erst ab zwei Arten),
Deckel, und ganz unten „Sicherung & Speicher" als eine Zeile, die den
Sicherungsstand nennt und sich aufklappen lässt. Eine fehlende Sicherung
steht in dieser Zeile, auch zugeklappt.

**Das Dokument (PDF)** nimmt die ganze Fläche: Studio-Kopf, Kante, Band und
Kopfzeile sind weg; das Papier beginnt am Rechner bei 116 von 900 px. Am
Telefon liegen Lesen/Annotieren, Seitenwechsel und Zoom hinter dem
Ansichts-Knopf ☷ in der Dokumentleiste.

## Wo die ehemaligen Workspace-Funktionen sind

| Früher | Jetzt | Adresse |
|---|---|---|
| Workspace · Übersicht / Seiten | Bibliothek → Sammlungen → **Seiten & Wissen** (mit „Offene Seiten & geteilte Ansicht" aufklappbar) | `#seiten-wissen` |
| Workspace · Bibliothek / Dateien | Bibliothek → Sammlungen → **Dateien & PDFs** | `#dateien-pdfs` |
| Workspace · Datenbanken | Bibliothek → Sammlungen → **Datenbanken** | `#datenbanken` |
| Workspace · Whiteboards | Bibliothek → Sammlungen → **Whiteboards** | `#whiteboards` |
| Workspace · Wiki | Bibliothek → Sammlungen → **Wissen & Verweise** | `#wissen-verweise` |
| Workspace · Vorlagen | Bibliothek → Sammlungen → **Vorlagen** | `#vorlagen` |
| Workspace · Aufgaben | eigener Ort **Aufgaben** (Mehr Orte) | `#aufgaben` |
| Workspace · Kalender | eigener Ort **Kalender** (Mehr Orte) | `#kalender` |
| „Alle Seiten" | Reiter „Alle" der Bibliothek (Mehr Orte → Alle Seiten) | `#alle-seiten` |

Alte `#welt-workspace-…`-Verweise leiten weiter, auch während der Sitzung
(Browser-Zurück eingeschlossen). `Produktwelten.workspace()` bleibt als
Kompatibilitätsfunktion; `Bibliothek.aufgaben()` („Meine Aufgaben") und die
Sammlung „Aufgaben" sind zwei verschiedene Ansichten und beide da. Die
Konto-/Organisationsverwaltung „Arbeitsbereich" ist davon unberührt
(Studio-Kopf → Konto, Mehr-Blatt → Arbeitsbereich).

## Material und Bewegung

Ein Token-System (`bausteine.css`, `studio.css`): `--motion-instant`,
`--motion-fast`, `--motion-normal`, `--ease`, `--ease-enter`,
`--press-scale`; Glas nur an kleinen schwebenden Bedienelementen
(`--studio-glass`), Papier bleibt deckend; räumliche Effekte an
Dokumentdeckeln und Miniaturen; violetter Akzent. Bewegungen sind kurz,
und `prefers-reduced-motion` schaltet jede davon ab — test424, test429 und
test430 messen das.

Der Motion-Pass vom Laptop (Deckel-Staffelung, Baum-Einblendung, Kanten-
Lade von links, Sheets von unten, Zehn-Segment-Zeichen, KI-Funken) bleibt
wie in der Fassung vom 6. September beschrieben: an echte Vorgänge
gebunden, ohne SVG-Kennungen, ohne Bewegung des Dokument-Canvas.

## Verifikation

Grün nach dem Umbau (6. September, Container): test33, 40, 61, 87, 105,
109, 114, 209, 222, 248, 272, 385, 386, 387, 390, 393, 396, 424, 428, 429,
430; `npm run typecheck`, `npm run bauen:ts`, `node bauen.mts`.

Umgeschrieben, nicht abgeschwächt: test387 (drei Orte + Mehr, und die alte
Leiste ohne Ruhe), test390 (Markierung an „Mehr Orte"), test272 (Lade
statt Leiste, Regler statt 54 px), test248/385 (Werkzeuggriff statt
sichtbares Band), test33 (Ort-Menü statt Reiterzeile), test114 (Seiten &
Wissen statt Workspace), test428 (Kennung statt Klasse, `collectionId`,
Schale statt Inhalt), test424 (Flush vor dem Neuladen).

Angesehen (§55): 45 Bilder unter `bilder/premium/` — Regal in 390, 430,
820, 1366 und 1920 px, hell und dunkel; Baum, Sicherung, Mehr Orte,
Werkzeuglade; PDF 1366 und 390 mit Ansichtsmenü; Seiten & Wissen, Alle
Seiten, Heute, Lernen, Einstellungen, Mehr-Blatt; reduced motion. Die
Abnahmebilder unter `doku/studio-abnahme/` stammen aus test424, test428
und test430 mit `--screenshots`.

Der Stand der Gesamtsuite steht unten.

## Offen

Siehe LUECKEN.md L117: die untere Telefonleiste hängt an fünf festen
Knöpfen; „Dateien & PDFs" listet jeden Textblock; bei offener Werkzeuglade
stehen Suche/KI/Konto doppelt; im ruhigen Modus steht kein Kontextgriff
direkt in der Kante; nicht auf einem echten Gerät geprüft.

## Gesamtsuite

Voller Lauf am 6. September 2026, drei Läufe parallel, in Stücken (§30):

| | Läufe |
|---|---|
| gesamt | 370 |
| grün im ersten Durchgang | 354 |
| rot, weil die Prüfung die alte Leiste, den alten Regalkopf oder das sichtbare Band voraussetzte — umgeschrieben, jetzt grün | 204, 214, 245, 258, 306, 359, 369, 384, 392 |
| davon ein echter Fehler im Produkt (Glocke fehlte im Studio-Kopf, gebaut) | 258 |
| Lastfehler, allein grün | 341 |
| rot schon vor diesem Bogen, unverändert rot | 180, 210, 217, 225, 332 |

Die neun umgeschriebenen Läufe sind nicht abgeschwächt: jeder prüft
weiterhin, dass das Ziel erreichbar ist — nur über den Weg, den es jetzt
gibt (Studio-Kopf, Ortslade, Werkzeuglade). Die Begründung steht als
Kommentar in jeder Datei. Die fünf alten roten Läufe sind in LUECKEN.md
L117 Punkt 7 festgehalten, mit Ursache.

Serverläufe (`node pruefungen/alle.mts server`): 9 von 9 grün.

Ausserdem grün: `npm run typecheck`, `npm run bauen:ts` (Dienststand v438),
`node bauen.mts` (8588 KB), und die Wächter test87, 105, 109, 362, 402.
