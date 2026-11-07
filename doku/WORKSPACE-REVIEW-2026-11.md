# Redion Workspace – Bestandsaufnahme und Umsetzungsplan

Stand: 2026-11-07. **Dokumenten-/Repository-Pruefung, keine visuelle Live-Abnahme.**

## Befund

- Redion hat bereits eine Premium-Schale, eine Bibliothek und ein bestehendes Navigationsregister; siehe `doku/DESIGN-REDION-PREMIUM.md` und `src/schale/aufbau/`.
- Workspace 2.0 hat getrennte Dokumente fuer Bibliothek, Editor, Dokumentkompass und Mobilnavigation. Diese Arbeiten duerfen nicht als fehlend neu implementiert werden.
- `.claude/skills/redion-animationen/SKILL.md` ist vorhanden. Die kanonischen weiteren Agenten-Skills und ein gemeinsamer Einstieg fehlen bislang.
- Mehrere Workspace-Dokumente melden nicht bestaetigte Browser-/Geraetetests oder historische CI-Runner-Probleme. Ein neuer aktueller Testlauf ist erforderlich.
- `doku/OBERFLAECHE-PC-UND-HANDY.md` enthaelt selbst als ueberholt markierte Abschnitte; `START-MIT-CLAUDE-CODE.md` enthaelt historische Anweisungen. Nicht als aktuelle Produktwahrheit behandeln.

## Reihenfolge

### A. Arbeitsorganisation
- [x] Eigenen Branch fuer Agenten-/Workspace-Planung anlegen.
- [x] Kanonische fachliche Skills und Claude-Verweise hinzufuegen.
- [x] Gemeinsamen Einstieg, Agentenregeln und Skill-Auswahl erstellen.
- [ ] Veraltete Anleitungen und Architekturabschnitte gegen aktuelle Implementierung vollstaendig abgleichen, ohne Historie zu loeschen.

### B. Visuelle Bestandsaufnahme (noch nicht ausgefuehrt)
- [ ] Echte Desktop- und iPhone-Ansichten mit synthetischen Daten aufnehmen: Bibliothek, leere Bibliothek, Editor, PDF, Suche, Mehr-Orte, Offline.
- [ ] 390x844, 430x932, 1366x768, 1440x900 jeweils hell/dunkel pruefen.
- [ ] Navigation, Doppelaktionen, Klick-/Touchziele, Fokus, VoiceOver, Reduce Motion, Safe Areas und Rueckwege dokumentieren.
- [ ] Bestehende Workspace-2.0-PRs/Commits und offene Issues auf bereits implementierte Funktionen abgleichen.

### C. Produktverbesserungen (nur nach konkretem Befund)
- [x] Erste konkrete Bibliothekskorrektur: In der Ablage behalten Dokumentkarten/Regal die Sortierung **Ordner zuerst, dann Namen**, anstatt durch die standardmaessige Datumssortierung ueberschrieben zu werden. Die Tabelle behaelt ihre Spaltensortierung. Aenderung in `src/bereiche/wissen/bibliothek.ts` und `quell/bereiche/wissen/bibliothek.js`.
- [ ] Weitere Bibliotheksverbesserungen: erst nach echten Bildschirmfotos und Nutzerwegpruefung; Such- und Favoritenlogik erhalten.
- [ ] Editor: kontextabhaengige Werkzeuge und konsistente Tastaturwege; keine zweite Toolbar oder Undo-Implementierung.
- [ ] PDF: Lesemodus und Ink-Werkzeuge entflechten, bestehende Export-/Annotierungsdaten unveraendert lassen.
- [ ] Mobil: bestehende Fuenf-Wege-Leiste beibehalten; Zielleiste nur beim Hochziehen, nie beim normalen Tippen oder langen Halten.
- [ ] Jede UI-Aenderung in eigenem Branch und eigenem kleinen Review-Bogen, keine pauschale Neugestaltung.

### D. Verifikation (NICHT GETESTET)
- [ ] `npm run typecheck`, `npm run bauen:ts`, `npm run stand`, `node bauen.mts`.
- [ ] `node pruefungen/workspace-library.mts --states` und `--webkit --states`. Regressionstest fuer Ordner-/Namensreihenfolge wurde auf dem Branch ergaenzt, **nicht ausgefuehrt**.
- [ ] `node pruefungen/workspace-editor.mts`, `workspace-document.mts`, `node pruefungen/lauf/test614.mts`.
- [ ] Vollstaendige Regression und Gegenproben; iPhone-Echtgeraet, Windows und signierte IPA separat.

## Sicherheitsregeln

Keine Nutzerdaten loeschen oder umbenennen, keine IndexedDB-/Backup-Migration fuer reine Designarbeit. Keine fremden Branches aendern, kein Merge/Deployment ohne Freigabe. Historische Testergebnisse niemals als aktuelle ausgeben.

## Code-Pruefung vom 7. November 2026

Beim Lesen von `auswahl()` wurde eine reale logische Ueberschneidung sichtbar: Der `ablage`-Zweig sortierte erst Ordner vor Dokumenten und nach Name, die folgende allgemeine Sortierung verwendete aber standardmaessig `sortier: 'wann'` und `richtung: 'ab'` und ueberschrieb diese Reihenfolge. Jetzt bleibt die Ablageordnung fuer Deckel und Regal erhalten. Im Tabellenmodus bleibt die bisherige frei waehbare Spaltensortierung aktiv. Der synthetische Regressionstest veraendert absichtlich das Bearbeitungsdatum einer Karte und prueft die sichtbare Reihenfolge.

**Nicht getestet:** Browser-/WebKit-Lauf, TypeScript-Build, gesamte Testsuite, Mac-/Windows-/iPhone-Geraete und visuelle Vorher-/Nachher-Abnahme. Syntaxparser fuer die aktualisierte generierte JavaScript-Datei hat erfolgreich geparst; das ist kein Laufzeittest. Vor einem Merge die gespeicherte `.js`-Datei gegen `npm run bauen:ts` und `test105` pruefen.
