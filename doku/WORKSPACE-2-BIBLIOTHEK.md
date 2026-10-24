# Workspace 2.0 — Bibliothek, Zwischenstand vom 24. Oktober 2026

Auftrag: [Issue #134](https://github.com/Redurbabat/Redion/issues/134).
Basis: `main` bei `72b4dae5d`; Arbeitszweig `codex/redion-workspace-2`.
Redur verlangt während der Prüfung den sofortigen Push. Dieser Stand ist
deshalb ein überprüfbarer Zwischenstand, keine Freigabe des gesamten Upgrades.
Kein Merge nach main und kein Deployment.

## Enthalten

- Gemeinsamer Bibliothekskopf, responsive Dokumentkarten mit vorhandenen
  Vorschauen, lesbaren Titeln und tatsächlichen Metadaten.
- Direkte Favoritenaktion über die bestehende Aktionsregistrierung, mit
  Tastaturbedienung, Zustandsansage sowie Fokus-/Scroll-Erhalt.
- Suchknopf öffnet die vorhandene globale Suche; keine zweite Suchmaschine.
- Gestaltete leere Ansichten und kompaktere vorhandene Zuletzt-Karten.
- Begrenzte Übergänge mit vorhandenen Motion-Marken; reduzierte Bewegung
  und Redions ruhige Darstellung schalten die neue Ankunftsbewegung ab.
- Keine Datenmigration, neue Laufzeitabhängigkeit oder Änderung am PDF-Ink.
  Die iOS-App übernimmt dieselben gemeinsamen Webdateien über Codemagic.
- Beim Bauen gefundene Altfehler behoben: sicherer Zugriff auf den bereits
  vorhandenen Sicherungseintrag statt ungeprüftem Arrayzugriff; fehlende
  Typdeklarationen der beiden bestehenden Windows-Testhilfen ergänzt.
  Das Sicherungsformat bleibt unverändert. Generierte Dateien wurden gebaut.

## Tatsächlich geprüft

- `npm run bauen:ts`, `npm run typecheck`, `npm run stand`, `npm run bauen`: grün.
- `node pruefungen/workspace-library.mts`: acht Kombinationen grün:
  390 × 844, 430 × 932, 1366 × 768, 1440 × 900, jeweils hell/dunkel.
  Geprüft: Kartenanzahl, Überlauf, 44-px-Ziele, Favorit per Leertaste,
  Fokus, Suche und Menü öffnen, Ordner, Liste, Dokument per Enter,
  leerer Ordner, reduzierte Bewegung und Browserfehler.
- `--counterprobe`: erwarteter Fehlschlag, nachdem ausschliesslich im
  isolierten Browser der Favoriten-Handler entfernt wurde. Der Test erkennt
  den fehlenden Zustandswechsel; keine Produktdatei wurde dafür verändert.
- Echte Vorher-/Nachher-Bilder aller acht Kombinationen mit synthetischen
  Prüfdaten unter `bilder/workspace-2/`. Bilder bleiben gemäss CLAUDE.md
  ausserhalb von Git. Nachher-Bilder vor der letzten kleinen Auge-Verschiebung.
- Der bestehende Schnelllauf mit 47 Tests läuft beim sofortigen Push noch.
  Sein Ergebnis ist hier ausdrücklich nicht als vollständig grün behauptet.

## Noch offen vor Freigabe

- Schnelllauf abschliessen und dokumentieren; gezielte Regressionen für
  Bibliothek/Suche, Dateimenüs, PDF-Ink und Aufwärtsgeste durchführen.
- Abschliessende Screenshots nach der letzten Positionskorrektur; zusätzlich
  leere Zustände, Filter, Favoriten und Ansichtenwechsel visuell abnehmen.
- Aktuelles iOS-Webpaket byteweise prüfen und auf echtem iPhone testen.
  Desktop-Chromium mit mobiler Grösse ersetzt kein Safari-/WKWebView-Gerät.
- Vollständige Regression und Chronik-/Messungsnachtrag.
- Die grossen Editor-/PDF-Studio- und Navigations-Upgrades aus Issue #134
  sind noch nicht implementiert. Dieser Branch beginnt mit der Bibliothek.

## Auf dem iPhone prüfen

Vorher eine externe Sicherung erstellen, vorhandene App nicht löschen.
Für einen späteren Testbuild in Codemagic genau diesen Branch und denselben
Commit wie für die Web-Testversion auswählen; den vorhandenen manuellen
iOS-Workflow verwenden. Installation/Signierung sind gesonderte Schritte.
Bibliothek hell/dunkel, Favoriten, Suche, Ordner und PDF öffnen testen;
anschliessend offline und mit reduzierter Bewegung wiederholen. Die
zusätzliche Zielleiste darf weiterhin nur beim Hochziehen aufgehen.
