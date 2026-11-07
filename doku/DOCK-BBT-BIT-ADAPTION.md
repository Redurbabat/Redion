# Redion-Dock – Uebernahme der BBT-Bit-Bedienprinzipien

Stand: 7. November 2026. Branch: `chatgpt/redion-workspace-skills-audit-20261107`.

## Was aus BBT-Bit uebernommen wird

Referenz: `Redurbabat/BBT-Bit`, `AppleApp/Sources/UI/LiquidMotion/InfinityDock.swift` und `DockDirectionTracker.swift`.

- Eine dauerhafte primaere Navigation, eine kontextabhaengige zweite Werkzeug-/Zielebene.
- Glaskapsel mit klarer Hervorhebung, ruhiger Federbewegung und vollstaendigen VoiceOver-Namen.
- Bewegung ist optional; Reduce Motion hat Vorrang.
- Der Inhalt der zweiten Ebene folgt dem aktuellen Bereich und darf keine Musikfunktionen vortaeuschen.

## Redion-spezifische Ziele

| Haupt-Dock | Untere Zielleiste | Quelle |
|---|---|---|
| Dokumente | Ablage, zuletzt verwendete, Favoriten, PDFs und weitere tatsaechlich verfuegbare Dokumentorte | `Register.navigation.ziele('dokumente')` aus der Bibliothek |
| Heute | Tagesuebersicht und vom Lernbereich angebotene Ziele | `Register.navigation.ziele('heute')` |
| Lernen | Lernzentrum und dessen reale Ziele | `Register.navigation.ziele('lernen')` |
| Termine | Kalender-/Terminfunktionen, soweit die Datenbankmodule sie anbieten | `Register.navigation.ziele('termine')` |
| Mehr | Vorhandene weitere Bereiche | `Register.navigation.ziele('mehr')`, falls Anbieter vorhanden |

Die Zielnamen werden **nicht** noch einmal im Dock hinterlegt. Der jeweilige Bereich meldet seine Ziele; fehlende Ziele werden nicht als funktionierende Buttons simuliert.

## Vorhandenes Verhalten, das erhalten bleibt

Redion besitzt bereits eine Fuenf-Wege-Leiste `#handy-oben` und die kontextbezogene `TabShelf`-Zielleiste `#ho-ziele`. Ein normaler Tap navigiert sofort; Hochziehen mit demselben Finger oeffnet die zweite Ebene. Die Korrektur vom 13. Oktober verlangt, dass ein Tap **nicht** die zweite Ebene oeffnet. Die BBT-Bit-Taste „Lift tools“ wird deshalb nicht kopiert, weil sie dieser bereits vereinbarten Redion-Geste widerspraeche. Die bestehende Tastaturalternative (Pfeil hoch) bleibt.

## Diese Aenderung

- `quell/schale/stil/bausteine.css`: zusaetzliche visuelle Reaktion beim Druecken und Fokussieren, klarer Tastaturfokus und fettere aktive Beschriftung.
- Keine Aenderung an den fuenf Reitern, deren Klickwegen, der Gestenmaschine, der Touch-Geometrie oder dem gespeicherten Zustand.
- Reduzierte Bewegung schaltet die neuen Transformationen und Uebergaenge ab.

## Teststand

Statische GitHub-Quelltextpruefung: erfolgt. **NICHT GETESTET**: Chromium, WebKit, echte iPhone-Gesten, VoiceOver, Mac-/Windows-App und visueller Vergleich mit BBT-Bit. Vor Freigabe `node pruefungen/lauf/test614.mts` und `--capture` sowie iPhone-Safe-Area/Reduce-Motion/VoiceOver pruefen. Der bestehende Workflow und die Dateien `src/schale/aufbau/tab-shelf.ts` und `src/schale/aufbau/seitenleiste.ts` wurden nicht umgeschrieben.
