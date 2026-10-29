# Redion Glass Wheel – technische und gestalterische Referenz

**Status:** Spezifikation und zwei schematische Referenzbilder, **keine fertige Implementierung**. Die vorhandene Redion-Anwendung wurde durch diese Dateien **nicht** verändert.

## Bildreferenzen

- [Desktop – Aufbau, drehbares Bereichsrad, geöffnete Dokumente, Dock](./redion-glass-wheel-desktop.svg)
- [iPhone – dieselbe Funktion, auf kleinen Bildschirmen](./redion-glass-wheel-iphone.svg)

**Visuelle Stimmung der vom Nutzer ausgewählten ursprünglichen Chat-Referenz:** opaleszentes, lichtbrechendes Glas, hochwertige schwebende Tiefe, Magenta/Violett/Türkis, fein reflektierende Ränder. Die hier eingecheckten SVG-Dateien sind **präzise Funktionsschemata**, keine Kopie der ursprünglichen Bildgenerierung. Die ursprüngliche Chat-Abbildung zeigt noch **Werkzeuge auf dem Ring** – das ist für die Umsetzung ausdrücklich **falsch**. Die folgende schriftliche Spezifikation **sticht Bildabweichungen**.

## Die drei festen Elemente

### A. Rad in der Mitte = Lebensbereiche, nicht Werkzeuge

Ein grosses, ringförmiges, tatsächlich interaktives **Glasrad wie ein Autorad mit Speichen**, keine statische Dekoration. Der Mensch darf es auf Windows mit Maus/Trackpad/Mausrad und auf iPhone mit Finger drehen. Der Ring hat Trägheit und sanftes Einrasten auf dem gewählten Segment. Tastatur bedienbar über Pfeiltasten; aktive Position angesagt und sichtbar; Bewegungsreduktion respektieren.

Segmente kommen **ausschliesslich** aus den echten Redion-`Lebensbereiche`: nicht fest codiert oder als Dummy neu erzeugt. Beispiele (nur Anschauungsdaten): Studium, Arbeit, Privat, Projekte, Wissen, Ideen. Bei 0/1/vielen Bereichen muss die Geometrie korrekt funktionieren, einschliesslich langen Namen, dynamischem Hinzufügen/Umbenennen und Rechten. Fokus/aktive Auswahl bleibt nach Reload erhalten.

### B. Direkt unter dem Rad = tatsächlich geöffnete Inhalte

Eine bewegliche, leichte, horizontale **Glas-Dokumentenablage** unter dem Rad zeigt **offene** Dokumente der gewählten Lebensbereich-Ansicht: Notiz, PDF, Datenbank, Seite, weitere echte Redion-Objekte.

Die Einträge stammen aus Redions bestehender Reiter-/Dokumentenverwaltung (`Fenster`) und seinen kanonischen IDs, nicht aus Beispieldaten und keiner zweiten geöffnet-Dokumente-Datenbank. Die Zuordnung stammt aus `Lebensbereiche` (auch indirekte/effektive Zuordnung und Mehrfachzuordnung), nicht aus geratenen Titeln. Mit Klick/Tipp öffnet oder fokussiert Redion den **bestehenden** Reiter. Schliessen/Wechseln/Reihenfolge/Rechte/zuletzt offen müssen konsistent bleiben. Für Elemente ohne Bereich kann es einen separaten klaren Weg **„Alle geöffnet“** geben; niemals verstecken oder löschen. Ist nichts offen, sichtbaren echten Leerzustand statt erfundener Dateien zeigen.

**Nutzerfluss:** Rad auf „Studium“ drehen → darunter „Mathe.pdf“, „Stundenplan“, „Lernnotizen“ als echte geöffnete Objekte → „Mathe.pdf“ auswählen → im bestehenden PDF-Studio öffnen; Rad und Inhalt bleiben bedienbar und verweisen nicht auf eine neue Schatten-Engine.

### C. Zusätzlich unten = das bestehende spezielle Redion-Dock

Vorhandene Dock-/Zielleisten- und TabShelf-Funktionen aus `src/schale/aufbau/tab-shelf.ts`, `Register.navigation` und der bestehenden Schale integrieren. **Kein zweites konkurrierendes Dock, keine doppelte Navigation.** Das neue Design darf einen eigenständigen Glas-Look und räumliche Bewegung für dieselben bestehenden Kommandos geben, **ohne** den Vertrag der durch Hochziehen geöffneten Zielleiste, aktive Tabs, Keyboard, iPhone-Safe-Areas oder vorhandene Gesten zu brechen.

## Umschaltbar, ohne die bestehende App zu stören

- **Startvorgabe bleibt die bisherige Oberfläche „Klassisch“**, auch für bestehende Installationen. Keine erzwungene Migration.
- **Einstellungen → Aussehen → Oberfläche**: `Klassisch` / `Glass Wheel` als echter nutzbarer Schalter mit Vorschau, Hinweis „Jederzeit zurück“.
- Gilt **gerätebezogen**: iPhone darf Glass Wheel zeigen, während Windows klassisch bleibt. Nicht als synchronisierter Inhaltswert missbrauchen. Bestehendes `Store.getMeta('aussehen')` für Farbe, Schrift, Abstände unangetastet lassen. Für den Schalenmodus einen **separaten lokal gespeicherten** stabilen Schlüssel/Mechanismus wählen.
- Umschalten ohne Daten-Neuerstellung, ohne Re-Import und ohne Wechsel des IndexedDB-Ursprungs; offene Dokumente, aktive Seite, Auswahl, Suche, Scrollposition nach Möglichkeit erhalten. Wenn Live-Wechsel nicht ohne Datenverlust/Focus möglich ist: kontrolliertes Wiederaufbauen der Schale mit unverändertem Zustand und klarer Fehler-Rückfallroutine.
- Jederzeit sichtbarer Weg zurück zu **„Klassisch“**, sogar wenn Glass Wheel unvollständig laden sollte. Ein Fehler der neuen Oberfläche darf den klassischen Start nicht blockieren.
- Theme-Schema (hell/dunkel, Akzent, hoher Kontrast) ist **unabhängig** vom Schalenmodus; `prefers-reduced-motion` und reduzierte Transparenz haben sinnvolle Rückfälle.
- Keine Änderung von `appId`, `userData`, iOS Bundle ID, Domain/Origin, Backup-Format oder Live-Sync-Verhalten. Kein Deinstallations-/Neuaufbauzwang. Keine neuen Netzwerkzugriffe.

## Umsetzung – Architektur und Orte

Vor Beginn **aktuelle** Quellen lesen statt vorhandene Datenmodelle erneut erfinden:
- `CLAUDE.md` (hart: Daten/Backup, Register, Mobile, Git, Tests, TS-Aufbau), `AUFGABEN.md`, Issue #134 zu Workspace 2.0, `doku/IOS-WEB-PARITAET.md` und `doku/WINDOWS-DESKTOP-OFFLINE.md`.
- Lebensbereiche: `src/bereiche/wissen/lebensbereiche.ts`, `doku/PRODUKTWELTEN-UND-LEBENSBEREICHE.md`.
- Offene Inhalte: `src/schale/aufbau/reiter.ts` (`Fenster`, `Store.getMeta('reiter')`) – gefilterte **sichtbare Projektion** bestehender IDs.
- Vorhandene Dock-/Mobile-Gesten: `src/schale/aufbau/tab-shelf.ts`, `src/register/navigation.ts`, `doku/IOS-MULTITOUCH-BEREICHSWECHSEL.md`.
- Einstellungen: `src/bereiche/einstellungen/ansicht/aussehen.ts`, `src/register/einstellungen.ts`; Farbschema nicht mit UI-Schalenmodus verwechseln.
- Glass-Bauteile: `fremd/touch/glass/Glass.tsx` und `Glass.css`, bestehende Glas-Tokens, `src/islands` falls dafür wirklich sinnvoll; keine zusätzliche Framework- oder Runtime-Abhängigkeit voraussetzen.
- `src/core/orb/*` ist eine **Denkkugel-Animation**, keine belegte Lebensbereichs-Navigation. Nur mathematische Hilfsfunktionen übernehmen, wenn sie zur Interaktion passen; keinen falschen Orb-Zustand einschleusen.
- Build `npm run bauen:ts` schreibt `quell/` aus `src/`; niemals generiertes `quell/` als alleinige Quelle bearbeiten.

**Empfohlene Reihenfolge:** (1) Shell-Schalter samt Rollback und Tests, (2) reiner Lebensbereich-Rad-Controller/Geometrie mit Tastatur/Touch/Maus, (3) echte geöffnete Dokumentenablage, (4) vorhandenes Dock als Glass-Variante, (5) visuelle Motion/Material, (6) End-to-End-Prüfungen.

## Gestaltung – nicht der übliche Dashboard-Look

- Dunkler aurorafarbener Grund, opalisierendes Glas, lokal begrenzte Prismakanten, sichtbare Lichtbrechung und parallaxenschonende Tiefenwirkung.
- Das **Rad ist der Fokus**, nicht eine linke Seitenleiste. Kompakte Suche/Konto oben, rechts optional Kontextinfos.
- Im Gegensatz zu einer Social-/Gaming-Mockup-Animation müssen echte Textinhalte/Editorflächen ruhig, deckend, scharf und kontrastreich bleiben.
- Keine permanenten 60-fps-Hintergrundeffekte oder schweren WebGL-/Canvas-Animationen, wenn das Gerät schwach ist; Darstellung muss auch mit `backdrop-filter`-Fallback funktionieren.
- Farben und Texte müssen bedienbar sein, 44×44 px Touch-Ziele, Tastatur-/Screenreader-Fokus, kein horizontaler Seitenüberlauf auf 390×844/430×932.

## Umfang: vollständiges, aber optionales Erscheinungsbild

**Nicht nur eine neue Startseite.** Nach der freiwilligen Wahl „Glass Wheel“ sollen die gesamte Schale, Start-/Bereichsansichten, Dokumentkarten, Tabs, Seitenkopf, Seitenleisten, Menüs, Dialoge, Editor-Werkzeugleisten, PDFs, Datenbankansichten, Suche und Statusanzeigen nach einem **zusammenhängenden Glass-Design-System** aussehen. Die bestehende Funktionalität und der Inhalt selbst bleiben erhalten.

- Erarbeite wiederverwendbare Material-/Farb-/Abstands-/Motion-Tokens (ein zentraler Scoping-Wurzelknoten, z. B. `data-ui-shell="glass-wheel"`), statt pro Komponente unabhängige Styles.
- Shell-Navigation, Rad und Dokumentablage sind die spektakuläre visuelle Identität; laufende **Texteditor-, Tabellen- und PDF-Flächen bleiben bewusst lesbar und funktional**, ohne schwer lesbares transparentes Papier.
- Zustände für Hover, Fokus, Auswahl, Drag, Offline, Sync, Ladezustand, Fehler, leer und deaktiviert sind in **beiden** Layoutvarianten vollständig gestaltet.
- Dock, PDF-Werkzeugleiste, Notizen, Datenbanken und Dialoge verwenden vorhandene Kommandos, Rollen und Datenquellen und werden **nur visuell**, nicht funktional verdoppelt.
- „Klassisch“ rendert die bisherige CSS-/DOM-Darstellung nach wie vor unverändert; alle Glass-Stile sind **streng auf den neuen Modus begrenzt**, keine globalen Überschreibungen.
- Ein später hinzugefügtes Redion-Tool soll durch zentrale Tokens/Konventionen automatisch konsistent erscheinen.

## Akzeptanztests und Screenshots

1. Frische sowie bestehende Installation startet **klassisch**; neue Oberfläche wird ausschließlich nach Nutzerwahl geladen.
2. Umschalten 100-mal vor/zurück verändert keine Block-, Datei-, Reiter- und Anhangsinhalte/IDs; kein doppelter Handler, keine doppelte Leiste, kein Datenverlust.
3. 0 / 1 / 3 / 8 / 20 Bereiche; umbenennen/neu anlegen und Mehrfachzuordnung müssen echte Inhalte korrekt anzeigen.
4. Reiter in zwei Bereichen; Dokument ohne Bereich; fehlender/gelöschter Block; keine versteckten oder erfundenen Dokumente. Wechsel und Schliessen verändern den bestehenden Reiterzustand korrekt.
5. Rad mit Mausdrag, Trackpad/Mausrad, Touchrotation, Tastatur; Einrasten und Grenzen; kein Touch-/Scroll-Konflikt mit iPhone-Wischen und TabShelf-Hochziehgeste.
6. Reduced Motion, hoher Kontrast, Tastaturfokus, VoiceOver/Screenreader und Kontrast; bei Renderfehler klassischer Fallback.
7. **Reale** Screenshots aus laufender App vorher/nachher: 1366×768, 1440×900, 390×844, 430×932 und optional Tablet; Dark/Light; mit echten oder klar markierten Testdaten.
8. `npm ci`, `npm run typecheck`, `npm run bauen:ts`, einschlägige Browser-/UI-Prüfläufe, `node --test windows/windows-desktop.test.cjs`, iOS-Nativ-/Paritätstests, echter Windows-Electron-/iPhone-Build soweit verfügbar; Fehlendes transparent nennen.
9. Vor Release: echte Windows- und iPhone-Abnahme, vorher eine `.redion`-Sicherung, Installation über die bestehende App; **niemals deinstallieren**.
10. Implementierung in **separatem Branch/PR**, nachvollziehbare kleine Commits, **nicht automatisch mergen/deployen**. PR mit Screenshots, Testbericht und verbleibenden Risiken.

## Wesentliche Negativvorgaben

**Nicht:** bestehendes Design ersetzen, Notizen für Designzwecke migrieren, neue Backend-/Sync-Technik bauen, vollständige Notiz-/PDF-Engine kopieren, Werkzeuge statt Lebensbereiche auf dem Rad zeigen, erfundene Dokumentvorschauen benutzen, zweite Dock-Implementierung installieren, Benutzer automatisch in Glass Wheel umschalten.

**Fertig** erst, wenn beide realen Oberflächen bedienbar sind, `Klassisch` weiterhin exakt funktioniert und derselbe Datenbestand ohne Datenverlust auf beiden Oberflächen verwendet wird.
