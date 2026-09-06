# Redion Premium – Motion-Pass vom 6. September 2026

Dieser Bericht beschreibt die ergänzten Animationen, nicht den Abschluss des gesamten Redesigns.
Referenz ist das vom Nutzer erneut gelieferte `REDION_UI_HANDOFF_MIT_CODES.zip`.
Die bereits isoliert archivierten Originale bleiben in der UI-Reserve; produktive Effekte sind Redion-Adaptionen.

## Eingebaute Bewegungen

- Bibliothek: erste sechs Dokumentdeckel erscheinen beim tatsächlichen Ortswechsel leicht gestaffelt. Keine erneute Animation bei jedem Suchzeichen. Ordnerpapier hebt sich beim Überfahren; Fokus und Druck geben eine kleine Rückmeldung.
- Baum: nur der gerade geöffnete Ast blendet kurz ein; Tastaturfokus und bestehender Öffnungszustand bleiben erhalten.
- Navigation: Kontextlade kommt dezent von links, Sheets von unten. Aufklappbare Fenstersteuerung nutzt dieselbe Bewegungssprache.
- PDF: Miniaturen, Inspector und mobile Ansichtsleiste erhalten kurze Einblendungen. Werkzeugbuttons reagieren beim Drücken. Papier und Canvas werden dabei nicht transformiert.
- Zustand: zehn Segmente ersetzen den Halbkreis im gemeinsamen neutralen Busy-Zeichen. SVG-Kinder statt globaler Demo-Klassen oder IDs.
- KI: drei Funken in einer eigenen Statuszeile während echter Chat-/Schreibanfragen. Antworttext wird weiterhin vom bestehenden Stream aktualisiert. Erfolg und Fehler entfernen die Statuszeile in `finally`. Die vorhandene Denkkugel wird nicht entfernt.

## Regeln

Vorhandene Tokens `--motion-instant`, `--motion-fast`, `--motion-normal`, `--ease`, `--ease-enter` und `--press-scale` gelten weiterhin. Die kleine Staffelung beträgt 24 ms, begrenzt auf sechs Deckel. Keine dauerhaften `will-change`-Flächen, keine neue Blur-Animation, keine neue Animation des Dokument-Canvas.

Reduced Motion unterbindet die neuen CSS-Effekte; der JavaScript-Ortsübergang wird nicht gestartet und laufende Übergänge werden beim Umschalten abgebrochen. Hintergrundwechsel beendet laufende JavaScript-Ortsanimationen. Die Funktion wartet niemals auf eine Animation.

Statusanimationen besitzen Text und bestehende Status-/Busy-Semantik. Sie behaupten keine Prozentwerte. SVG-Symbole sind dekorativ, ID-frei und erben `currentColor`.

## Verifikation

- test429: 16/16 – neutrale Segmente, KI-Funken, mehrere SVG-Instanzen, echte Controller mit Test-Promise bzw. abgefangener KI-Testantwort, Erfolg/Fehler, Tastatur, Reduced Motion und Konsole.
- test427: 55/55 – gemeinsame Statusbuttons, Sperre gegen Mehrfachauslösung, reale Sicherungsdownloads, Öffnen, Kontrast, Tastatur und Reduced Motion.
- test424: 50/50 – Studio/PDF-Ablauf, echte PDF-Testdatei, Navigation, Zoom, Persistenz und zehn Größen in Light/Dark.
- `npm run typecheck`, `npm run bauen:ts` und `node bauen.mts`: erfolgreich; lokaler Dienststand v432.
- KI-Test verwendet ausschließlich synthetischen Inhalt; kein echter KI-Dienst wurde angefragt.

## Offen

Der umfangreiche Workspace-/Ruhe-Umbau aus dem vorigen Arbeitsschritt ist nicht vollständig abgeschlossen. Dieser Motion-Pass behauptet weder die vollständige Integration aller 50 Uiverse-Ideen noch eine grüne Gesamtsuite. Weitere ältere Ladeanzeigen sind noch nicht auf das gemeinsame Zeichen umgestellt. Nicht verifizierte Originale werden nicht als exakt übernommener Code ausgegeben.
