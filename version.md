# Redion – Versionen und Änderungen

Dieses Dokument hält **ab jetzt jede neue Redion-Version** mit Versionsnummer, Datum, Neuerungen, Fehlerbehebungen und Veröffentlichungsstand fest. Die Windows-App zeigt die aktuelle Nummer unter **Hilfe → Version und Änderungen** an. Die Angaben stehen auch maschinenlesbar in `version.json`.

## 2026.8.4 – 31. Oktober 2026
**Status:** In Entwicklung (noch nicht als Installer veröffentlicht)

**Neu**
- Die normale Redion-Windows-App kann über **Entwicklung → Lokalen Redion-Ordner verbinden …** einmalig einen vertrauenswürdigen, auf dem PC gespeicherten GitHub-Projektordner auswählen.
- Sobald GitHub Desktop neue **fertige Webdateien** in diesem Ordner speichert, erstellt Redion automatisch eine isolierte, vollständige Momentaufnahme und aktualisiert die laufende Oberfläche. Kein manueller Neubau und kein erneutes Installieren der EXE bei reinen Webänderungen.
- Version und kurze Änderungsliste erscheinen im Windows-Menü **Hilfe → Version und Änderungen**. GitHub-Verlauf in dieser Datei `version.md` und maschinenlesbar in `version.json`.
- Der lokale Entwicklungsstand verwendet das getrennte Datenprofil `%APPDATA%\Redion-Entwicklung`. Die normale Datenablage `%APPDATA%\Redion` wird nicht durch nicht signierten Projektcode geöffnet.
- Bei fehlenden, unvollständigen oder unzulässigen Dateien wird der bisherige lauffähige Stand beibehalten. Keine automatischen GitHub-Anmeldedaten, kein ungeprüftes Update der nativen EXE.
- PDF-Dokument: Strg+Rad und Kneifen zoomen jetzt um den Punkt unter dem Zeiger bzw. zwischen den Fingern, statt um die obere linke Ecke; das Kneifen zeichnet ruhiger (einmal je Bild). Aus Redurs ZIP, in den vorhandenen Regler übernommen (E766, `test628`). **Daten:** nicht betroffen. **Neue EXE:** nicht nötig.
- Schaltplan: Jedes Bauteil kann neben dem BMK eine lesbare **Beschriftung** tragen (Doppeltipp → „Beschriftung"), sie steht unter dem BMK. Pläne merken sich ausserdem die Originalbytes einer importierten Relais-Datei (E767, `test629`). **Daten:** neue, optionale Felder im Plan; alte Pläne bleiben unverändert lesbar, `.json`/`.redion` tragen die Felder mit. Ein Gerät mit älterem Stand verwirft sie beim Speichern (L264). **Neue EXE:** nicht nötig.
- Schaltplan-Simulation: **Zeitrelais rechnen mit echter Zeit** (anzugs- und abfallverzögert, T im Doppeltipp-Dialog), und **Taster federn zurück** — ein Treppenhauslicht lässt sich jetzt ausprobieren. Der Zeittakt läuft nur während der Simulation (E768, `test630`). **Daten:** nicht betroffen. **Neue EXE:** nicht nötig.
- Schaltplan: **Relais-Werkstatt** (Knopf „⚙ Relais") mit Redurs zehn Original-Schaltungen aus dem Programm „Relais", Import eigener `.sch`/`.txt`, Rückgabe der Originaldateien, zwei verdrahtete Lehrbeispiele. Die Leitungen alter Dateien sind nicht entschlüsselt: ein Import simuliert erst nach eigener Prüfung und Freigabe. Wird erst beim Öffnen geladen (E769, `test631`). **Daten:** nutzt die Felder aus E767. **Neue EXE:** nicht nötig.
- Schaltplan, wie in Redurs ZIP („1:1"): die **Bauteilpalette ist beim Öffnen zu** (▦ Bauteile, B oder /), ein Menü **„✦ Bereiche ▾"** statt der Knöpfe Batterien, Relais und Formelheft, Kürzel **1–5, P, B, /**, Bauteile **aus Palette und Studio direkt auf den Plan ziehen**, **Kontextleiste** über der Auswahl, **Schnellkarte** beim Antippen, **Elektro Studio** (Alt+Umschalt+E) (E770, `test632`). **Daten:** nicht betroffen (nur „zuletzt benutzt" im Meta-Fach). **Neue EXE:** nicht nötig.
- Schaltplan: **Prüfzentrum** (Alt+Umschalt+P) mit Prüfpunkten, Stückliste und Netzliste, Export als TXT/CSV, „Leitungen aufräumen" (rückgängig machbar); wird erst beim Öffnen geladen (E771, `test633`). **Daten:** nicht betroffen. **Neue EXE:** nicht nötig.
- Schaltplan: das **Live-Stromlabor** mit Uhr, Tempo 0,25–4×, Pause und Zurücksetzen, sobald Strom fliesst (E772, `test634`). **Daten:** nicht betroffen. **Neue EXE:** nicht nötig.
- Werkstatt (nicht in der App): neuer Skill **„redion-animationen"** in `.claude/skills/` — Ideen aus „open-swiftui-animations", übersetzt in Redions Federn und Regeln; kein fremder Code, das Projekt hat keine Lizenz (E774). **Daten:** nicht betroffen. **Neue EXE:** nicht nötig.
- Schaltplan: **Ein und Aus ist wieder der Knopf „▶ Strom"** mit Hebel und Glühfaden. Der RED-MGT-Glasschalter aus der ZIP stand nur einen Tag; Redur am 2. November: „für ein-aus sollte wie früher sein, damals war besser" (E773, `test634`). **Daten:** nicht betroffen. **Neue EXE:** nicht nötig.

- Schaltplan auf einer neuen Stufe (9. November 2026, E775–E778): die Ansicht **passt den belegten Bereich ein** — beim Öffnen, bei Fenster- und Vollbildwechsel und auf „Einpassen"; eigener Zoom bleibt. Der **Kopf steht in einer Zeile**: „▶ Strom" vorn, die Planart als kleiner Chip (am Telefon im „…"). Das **Werkzeug-Dock trägt Namen** (Auswahl, Leitung, Text, Schiene, Radierer, Bauteile, Einpassen) und hüpft nicht mehr bei jeder Änderung. Ein **unbekanntes Bauteil** wird als Platzhalter mit „?" gezeichnet statt still zu fehlen. **Daten:** nicht betroffen. **Neue EXE:** nicht nötig.
**Behoben**
- Der Windows-Installer packte den ganzen Projektordner ein, samt allen früheren EXE-Dateien (`"redion": "file:.."` in `windows/package.json`); am 31. Oktober erreichte das Archiv 3,9 GB und überschritt die 2-GB-Grenze. Der Eintrag ist entfernt, ein Wächter in `windows/windows-desktop.test.cjs` hält es fest (E763). Daten sind nicht betroffen. Nach dem Holen in `windows/` einmal `npm install`, alte Dateien in `build/windows-dist` löschen, dann `npm run dist`.
- PDF-Schreibstudio: Beim Füller (und jedem anderen Werkzeug) zeigte die untere Leiste neun Haftnotizfarben und einen einzigen Knopf über die ganze Breite, statt Stifte, Farben, Breiten, Formen und Lineal — immer dann, wenn die Zeichenleiste auf einer gewöhnlichen Seite einmal nach **links** oder **rechts** gestellt worden war. Der gemerkte Platz wirkt im Studio jetzt gar nicht mehr, und auch die Seitenleiste auf einer gewöhnlichen Seite zeigt wieder nur das Zubehör des gewählten Werkzeugs (E764, Prüflauf `test626`). **Daten:** nicht betroffen, der gemerkte Platz bleibt. **Neue EXE:** nicht nötig — reine Webdatei (Stilblatt), kommt über den lokalen Ordner oder das nächste Paket.
- Schaltplan (aus der ZIP mitgekommen, vor der Übernahme behoben): die Schnellkarte schob die Zeichnung zusammen, ein grosser Plan war unten abgeschnitten, und das Dock lag über der Zeichnung (E770). **Daten:** nicht betroffen. **Neue EXE:** nicht nötig.

**Wichtig:** Die Funktion muss **einmal** als neue Windows-App-Version installiert werden, damit die bestehende EXE den neuen Ordner-Modus kennt. Danach können Änderungen der Weboberfläche über den lokalen Ordner ohne neue Installation übernommen werden. Änderungen am nativen Electron-Code (z. B. `windows/main.cjs`) erfordern weiterhin eine neue signierte EXE. TypeScript-`src/`-Dateien müssen vorher in `quell/` übersetzt sein (bei synchronisierten GitHub-Commits mit eingecheckten Ausgabe-Dateien ist das bereits geschehen).

**Prüfung:** Windows-Testlauf und signierte End-to-End-Auslieferung stehen noch aus. **Nicht als veröffentlichte Version ausgeben.**

## 2026.8.3 – bisheriger Ausgangsstand
**Status:** Vorherige in den Projektdateien verzeichnete Versionsnummer; keine verifizierte signierte Windows-Veröffentlichung.

- Bestehende Redion-Windows-App mit lokalem Offline-Paket und festen IndexedDB-Daten.
- Vorbereiteter, aber noch nicht produktiv freigegebener signierter Windows-Auto-Updater.
- Separater **Redion-Live**-Entwicklungsmodus zum automatischen Bauen und Aktualisieren lokaler Projektdateien (über PR #179).

## Regeln für kommende Versionen

Redion verwendet vorerst das bestehende **Kalenderversionsschema `JAHR.MINOR.PATCH`** mit drei numerischen Teilen (z. B. `2026.8.4`). Die Nummer wird pro zusammengehöriger Änderung bzw. Release erhöht und **nicht bei jedem Speichern** neu vergeben. Die Nummern dürfen nicht rückwärts laufen.

Bei jeder neuen Version:
1. Neue Überschrift in `version.md` ganz oben: **Nummer, Datum, Status**.
2. Präzise aufschreiben, **was neu**, **was behoben**, **welche Daten betroffen** sind und ob die **Windows-EXE neu installiert werden muss**.
3. Dieselbe Nummer in `package.json`, `package-lock.json`, `windows/package.json` und `version.json` eintragen; in `version.json` die Kurzänderungen aktualisieren.
4. `npm run version:pruefen` und `npm --prefix windows test` ausführen. Nach Abnahme Status auf `veröffentlicht` setzen. **Ein Git-Commit oder Pull Request alleine ist keine installierte Veröffentlichung.**

**Zwei unabhängige Versionsstände:** Unter Hilfe zeigt die Windows-App die **EXE-Version** (nur per Installer aktualisierbar) und die **Webstand-Version** (aus dem verbundenen lokalen Ordner oder dem installierten Paket). Die Nummern können im Entwicklungsmodus verschieden sein.
