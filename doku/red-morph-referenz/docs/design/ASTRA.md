# Astra — Interaction Atelier

Astra ist ein eigener Bereich des UI Kits für acht räumliche, materielle und praktische Interaktionsstudien. Die Gestaltung verbindet Apple-inspirierte Klarheit mit eigenen optischen, mechanischen und spielerischen Ideen. Alle Komponenten haben den Reifegrad **Experiment**.

## Zugang und Aufbau

- Route: `#/astra`, lokal beispielsweise `http://127.0.0.1:5173/#/astra`.
- Einstieg: Astra-Link in der Hauptnavigation und ein eigener Astra-Bereich auf der Startseite. Der Einstieg auf der Startseite bleibt auch auf schmalen Bildschirmen erreichbar.
- Im Atelier: Einleitung mit veränderbarer Astrolabium-Perspektive, acht Experimente, Familienfilter und Notizbuch.
- Rückweg: „Zum UI Kit“ führt zur bestehenden Galerie.

Die Seite wird separat geladen. Die vorhandenen Sammlungen und Experimente bleiben erhalten. Die Filter „Alle“, „Raum & Physik“, „Licht & Material“ und „Kleine Helfer“ steuern die Sichtbarkeit; die Komponenten bleiben montiert, sodass ihre Einstellungen beim Filterwechsel erhalten bleiben. Die drei Familien enthalten drei, drei und zwei Studien.

## Gestaltungsentscheidungen

Die ruhige dunkle Fläche gibt den Objekten Raum. Warme Akzente, zurückhaltende Typografie und präzise Kanten halten die Sammlung zusammen. Glas erklärt Schichtung, Metall vermittelt mechanische Präzision, Licht zeigt einen veränderbaren oder aktiven Zustand. Nicht jede Fläche erhält einen Glaseffekt.

Der Astrolabium-Körper im Kopfbereich ist aus CSS-Flächen aufgebaut. Sein Perspektivknopf wechselt zwischen drei Ansichten. Eine Benutzeraktion löst den Wechsel aus; im Ruhezustand rotiert das Objekt nicht dauerhaft.

Die Darstellung verwendet React, CSS und einzelne SVG-Formen. Es gibt keine zusätzlichen Bilddateien, keine Canvas- oder WebGL-Laufzeit und keine neue Animationsbibliothek für Astra. Die vorhandenen Lucide-Symbole werden weiterverwendet.

## Die acht Studien

| Studie | Familie | Bedienung und sichtbares Ergebnis |
| --- | --- | --- |
| Prism Stack | Raum & Physik | Ein Knopf trennt drei Ebenen oder legt sie zusammen. Der native Tiefenregler verändert ihren Abstand zwischen 24 und 58 Pixeln und öffnet den Stapel. |
| Signal Island | Licht & Material | Eine Kapsel öffnet einen visuellen Player. Start/Pause bewegt das Signal; der Szenenknopf wechselt zwischen drei Lichtstimmungen. Schließen stoppt die Wiedergabe. Es wird kein Audio abgespielt. |
| Magnetic Dock | Raum & Physik | Fünf feste Schaltflächen wählen kleine Szenen aus. Bei einem präzisen Mauszeiger vergrößern sich die Symbole abhängig von der Nähe. Die Trefferflächen bewegen sich dabei nicht. |
| Focus Portal | Licht & Material | Zwei native Regler verändern Öffnung und Licht einer optischen Blende. Eine zusätzliche Aktion wechselt zwischen fokussierter und weit geöffneter Ansicht. |
| Resonance Dial | Licht & Material | Ein Druck aktiviert eine visuelle Schwingung. Der Resonanzregler verändert Wert, Zeiger und Wellenform; Reset setzt den Ausgangszustand wieder her. Kein Audio und keine Gerätehaptik. |
| Orbit Switch | Raum & Physik | Ein semantischer Ein-/Ausschalter aktiviert einen Satelliten. Der aktive Zustand ist auch bei angehaltener Bewegung an Beschriftung und Schalterzustand erkennbar. |
| Command Lens | Kleine Helfer | Eine Suchkapsel durchsucht den echten Astra-Katalog lokal. Ein Treffer führt zum Experiment; Enter öffnet den ersten Treffer, Escape schließt die Suche und gibt den Fokus zurück. Leere Ergebnisse und gelöschte Suchbegriffe sind eigene Zustände. |
| History Lens | Kleine Helfer | Drei Farbwelten und ein Ebenenschalter verändern eine Komposition. Rückgängig und Wiederherstellen durchlaufen echte lokale Zustände. Eine neue Änderung nach Rückgängig verwirft den verlassenen Vorwärtsverlauf; bis zu zwölf vorherige Zustände bleiben erhalten. |

Alle Zustände sind lokal in React gespeichert. Ein Neuladen setzt die Studien zurück. Astra benötigt weder Benutzerkonto noch Backend und überträgt die Einstellungen nicht. Die Szenen im Dock sind visuelle Studien, keine Notiz-, Zeichen- oder Musikprogramme.

Die Suche normalisiert Groß-/Kleinschreibung und Akzente, verlangt alle eingegebenen Suchbegriffe und priorisiert Treffer im Titel. History Lens ignoriert Änderungen, die den vorhandenen Zustand nicht verändern. Die beiden Helfer zeigen damit übertragbare Verhaltensmuster zusätzlich zum Materialdesign.

## Bewegung und Sichtbarkeit

Die Komponenten erhalten die Eigenschaft `still: boolean`. Die Seite setzt sie, wenn mindestens einer dieser Fälle zutrifft:

- Das Betriebssystem fordert mit `prefers-reduced-motion: reduce` weniger Bewegung an.
- Der Benutzer hat „Bewegung pausieren“ gewählt.
- Das Browserdokument ist verborgen.
- Die jeweilige Experimentkarte ist nicht sichtbar oder durch einen Familienfilter ausgeblendet.

Die Systemeinstellung hat Vorrang vor dem manuellen Schalter und wird auch während einer Sitzung beobachtet. `IntersectionObserver` ermittelt die Sichtbarkeit der Karten; `visibilitychange` meldet den Zustand des Dokuments. Die eigentliche Bedienung bleibt bei `still=true` möglich: Werte und Zustände ändern sich ohne die optionalen Bewegungen.

Fortlaufende Bewegung beginnt nur nach Aktivierung der betreffenden Studie, etwa durch Signal-Start oder Orbit-Energie. CSS-Keyframes und Zustandswechsel sind auf die Komponente begrenzt. Das Dock verwendet einen lokalen Pointer-Handler und `requestAnimationFrame` für seine visuellen Werte; Touch, grobe Zeiger und reduzierte Bewegung lösen keine Magnetvergrößerung aus. Ausstehende Frames, Timer und Beobachter werden beim Entfernen aufgeräumt.

## Bedienbarkeit

Native Buttons, Range-Eingaben und `details`/`summary` bilden die Bedienoberfläche. Beschriftungen, `aria-pressed`, `aria-expanded` und der Orbit-Schalter mit `role="switch"` vermitteln die jeweiligen Zustände. Dekorative Geometrie ist für assistive Technik ausgeblendet. Die Regler behalten ihre native Tastaturbedienung einschließlich Pfeiltasten, Home und End.

Die Seite bietet einen Sprunglink zu den Experimenten, sichtbare Fokusmarkierungen und einen fokussierten Seitentitel beim Betreten. Interne Abschnittssprünge setzen den Fokus auf das Ziel. Kopiererfolg, Kopierfehler und Downloadfehler erscheinen als Statusmeldung. Ein verweigerter Clipboard-Zugriff verhindert nicht das manuelle Markieren des sichtbaren Codes.

Die Karten werden auf schmalen Ansichten untereinander angeordnet. Filter können umbrechen, und die Szenen besitzen eigene schmale Varianten. Browserprüfungen müssen insbesondere die kleinste Breite, tatsächliche Trefferflächen, Kontrast und verdeckte Bedienelemente bestätigen. Eine Desktopprüfung ersetzt keinen Test mit einem echten Touchgerät oder Screenreader.

## Code und Übernahme

Die Dateien liegen unter `app/src/components/astra/`:

- `astraCatalog.ts`: IDs, Familien, Komponentennamen und erklärende Metadaten; gemeinsame Quelle für Filter und Darstellung.
- `AstraRoom.tsx`: Atelier, Sichtbarkeit, Pause, Filter, Codeanzeige und Downloads.
- `AstraPortal.tsx`: Einstieg auf der bestehenden Startseite.
- `AstraSpatial.tsx` und `astra-spatial.css`: Prism Stack, Magnetic Dock, Orbit Switch.
- `AstraMaterial.tsx` und `astra-material.css`: Signal Island, Focus Portal, Resonance Dial.
- `AstraUtility.tsx` und `astra-utility.css`: Command Lens, History Lens sowie die eigenständig testbaren Funktionen für Suche und Änderungsverlauf.
- `astra.css`: gemeinsame Tokens, Steuerelemente, Layout und responsive Regeln.

„Aufruf kopieren“ kopiert einen kurzen React-Komponentenaufruf. „Quellcode laden“ erzeugt lokal eine Markdown-Datei mit drei vollständigen Quellblöcken: der zugehörigen **Gruppen-TSX-Datei**, ihrer **Gruppen-CSS-Datei** und dem **gemeinsamen `astra.css`**. Bei den beiden Helfern enthält der Download zusätzlich **`astraCatalog.ts`**, den die Suchfunktion benötigt. Die Downloads enthalten auch die weiteren Komponenten derselben Familie; sie sind keine automatisch bereinigten Einzelkomponentenpakete und keine ZIP-Archive.

Für eine Übernahme die Blöcke als Dateien mit den angegebenen Namen speichern. React und `lucide-react` müssen im Zielprojekt vorhanden sein. Die Komponenten-CSS wird vom TSX-Modul importiert; zusätzlich muss das gemeinsame `astra.css` eingebunden werden. Die Komponenten erwarten einen umgebenden Container mit `className="ui-astra-room"`. Der gezeigte Aufruf setzt voraus, dass der aufrufende Code `prefersReducedMotion` und `paused` definiert; im Zielprojekt sind zusätzlich Dokument- und Komponentensichtbarkeit in `still` zusammenzuführen.

Command Lens akzeptiert zusätzlich `onNavigate(id)`. Im Atelier setzt dieser Callback den Familienfilter passend zurück und navigiert zur gewählten Studie. Bei der Übernahme muss der im Beispiel verwendete Handler `openExperiment` implementiert oder weggelassen werden. Ohne Callback bleibt die Suche bedienbar und meldet die Auswahl lokal, führt aber keinen Seitensprung aus.

Wiederverwendbare Klassen und Keyframes verwenden das Präfix `ui-`. Die gemeinsamen Variablen `--ui-astra-*` definieren Farbe, Fläche, Radius und Easing; Textfarbe und Easing greifen auf vorhandene Projekttokens mit Fallback zurück. Komponentenspezifische Variablen steuern etwa Tiefe, Blendenöffnung und Resonanz. Für eine schlankere Produktintegration können die benötigten gemeinsamen Regeln und Tokens gezielt extrahiert werden. Dabei müssen Fokus-, Reduced-Motion- und Responsive-Regeln erhalten bleiben.

Die Komponenten importieren keine Anwendungsshell, benötigen keine globalen Pointer-Listener und setzen kein Backend voraus. Sie sind trotzdem als Experimente zu übernehmen: Materialkontrast, Inhalte, Schaltflächen und Bewegungen müssen im jeweiligen Zielkontext erneut geprüft werden.

## Ausgangsstand von GitHub und lokal

Der Vergleich vor den Astra-Änderungen am 28. September 2026 ergab:

| Stand | Commit | Ergebnis |
| --- | --- | --- |
| Lokaler Arbeitszweig vor Astra | `4b62fa9` | Identisch mit dem abgerufenen `origin/feature/design-playground-controls` |
| Abgerufenes GitHub-`main` | `5f2e5f6` | Nicht identisch mit dem lokalen Arbeitszweig |
| Vergleich der Historien | `HEAD...origin/main` | 327 nur lokal vorhandene und 8 nur auf `origin/main` vorhandene Commits |

Diese Zahlen beziehen sich auf den Ausgangsstand, nicht auf die später bearbeiteten Dateien. Astra wird auf `codex/astra-motion-lab` aufgebaut. Es fand keine automatische Zusammenführung mit `main` statt. Die bereits vorhandene, unversionierte Datei `app/package-lock.json` wurde beibehalten. Der Abgleich ist daher keine Behauptung, dass sämtliche lokalen Dateien mit GitHub identisch sind.

## Entwurfsgrundlagen

- [Projekt: UI Language](UI_LANGUAGE.md) und [Motion Language](MOTION.md).
- [Universal Web Design Skill](../../skills/web-design/SKILL.md), insbesondere die lokalen Hinweise zu [Apple-Plattformen](../../skills/web-design/platforms/apple.md), [Materialien](../../skills/web-design/references/materials-glass.md), [Dock-Vergrößerung](../../skills/web-design/recipes/dock-magnification.md) und [barrierearmer Bewegung](../../skills/web-design/quality/accessibility-motion-audit.md).
- [Apple Human Interface Guidelines: Materials](https://developer.apple.com/design/human-interface-guidelines/materials) als offizielle Referenz für Materialhierarchie. Astra ist ein eigenständiges Webexperiment, keine Apple-Komponente und keine Zusage identischen nativen Renderings.

## Prüfprotokoll

Am 28. September 2026 wurde `npm run test:unit -- src/components/astra/astraCatalog.test.ts` erfolgreich ausgeführt: **4 Tests bestanden**. Geprüft wurden acht eindeutige Studien, disjunkte und vollständige Familienfilter, gültige Zuordnungen zu den tatsächlich exportierten Komponenten sowie vollständige Metadaten.

Die folgenden Angaben sind bis zum Abschluss der Integration ausdrücklich **ausstehend**:

- `npm run build` und `npm run test:unit`.
- Browserprüfung auf Desktop und schmalen Ansichten: Einstieg, Route, Rückweg, Filter, Codeanzeige, Download, sämtliche Bedienelemente und Overflow.
- Tastatur- und Fokusprüfung sowie reduzierte Bewegung, manueller Pausenschalter und Sichtbarkeit.
- Prüfung auf Laufzeitfehler und visuelle Kontrolle der tatsächlichen Animationszustände.

Ergebnisse und verbleibende Grenzen werden nach den ausgeführten Prüfungen hier ergänzt. Aus Quellcode allein lassen sich visuelle Qualität, reale Touchbedienung und Screenreaderverhalten nicht abschließend bestätigen.
