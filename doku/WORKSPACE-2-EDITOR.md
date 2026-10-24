# Redion Workspace 2.0 – Seiteneditor: Sichtbare Werkzeuge

**Stand: 24. Oktober 2026 · Produkt-PR zu Issue #134, nicht automatisch mergen.**

## Was ist jetzt sichtbar anders?

Die normalen Redion-Notizseiten besassen schon alle nötigen
Seitenwerkzeuge: Cover, volle/normale Breite, Dokumentmodus (wenn
verfügbar), Schriftart, Vorlage, KI und – in Schulbereichen –
Rechner. Es gab aber eine Entdeckbarkeitslücke:

**Desktop:** `.pg-tools` war `opacity:0`, bis der Mauszeiger
über der Seite stand. Eine neue Nutzerin oder ein neuer Nutzer sah
keine Werkzeugleiste und musste die Funktionen erraten.

**Jetzt:** Die vorhandene Werkzeugzeile wird als dauerhaft sichtbare,
ruhige **Seitenwerkzeuge-Karte** gezeichnet:
- klare, kleine Überschrift `SEITENWERKZEUGE` am Desktop;
- echte, mindestens 44 px hohe Aktionschips mit Symbol und Wort;
- abgerundete Fläche und Rahmen aus den vorhandenen
  Redion-Themenmarken, Hell- und Dunkelmodus;
- sichtbarer Fokusrahmen und Hover-Zustand;
- wenn die Platzbreite nicht reicht, verteilen sich die Chips
  auf mehrere Zeilen – **keine versteckten Bedienelemente**;
- das alte delegierte Klickhandling bleibt erhalten: kein neuer
  Action-Katalog, kein neuer Router, keine neuen Daten.

**iPhone:** Der Titel über der Zeile entfällt, die Chipzeile bleibt
**eine einzige horizontal scrollbare Reihe**, damit der Text auf
390 px nicht unter drei Werkzeugzeilen verschwindet. Der
Scrollrand-Hinweis passt zur neuen Fläche; alle Aktionen bleiben
mit mindestens 44 px Höhe erreichbar.

Das ist ein tatsächliches Upgrade der normalen Notizseite, nicht
des PDF-Dokumentmodus, der bereits seinen eigenen Werkzeugbereich
und den Dokumentkompass aus PR #137 besitzt.

## Struktur und Barrierefreiheit

In `src/schale/aufbau/kopfleiste.ts` trägt die **existierende**
`.pg-tools`-Zeile nun `role="group"` und
`aria-label="Seitenwerkzeuge"`. Das vermeidet eine falsche
`role="toolbar"`-Zusicherung mit erforderlicher
Pfeiltastennavigation. Die sichtbare Überschrift ist für
Screenreader `aria-hidden`, weil der Gruppenname schon hörbar
ist. Die vorhandenen Aktionsknöpfe bleiben im selben Baum und
nutzen dieselben `data-a`-Kennungen.

Die generierte `quell/schale/aufbau/kopfleiste.js` ist
entsprechend synchronisiert; das Layout liegt in
`quell/schale/stil/studio.css`.

Bewegung: nur leichte `transform`- und Farbwechsel auf
Knöpfen, kein animierter Editor/Canvas. `prefers-reduced-motion`
und Redions `data-bewegung="ruhig"` setzen sie aus.
Erzwungene Farben und hoher Kontrast entfernen dekorative Schatten.

## Wirkliche Browserprüfung

```powershell
npm ci
npm run bauen:ts
npm run typecheck
node pruefungen/workspace-editor.mts
node pruefungen/workspace-editor.mts --webkit
```

Für echte Bildschirmbilder derselben synthetischen Redion-Seite:

```powershell
node pruefungen/workspace-editor.mts --capture
node pruefungen/workspace-editor.mts --webkit --capture
```

Der Workflow `workspace-editor.yml` soll bei PRs zusätzlich
den **vorherigen Git-Commit** in eine separate Dateiablage
checken und mit denselben Testdaten Vorher-/Nachher-Bilder
aus **Chromium und WebKit** erstellen, bei:

- iPhone 390 × 844 hell und 430 × 932 dunkel
- Desktop 1440 × 900 hell und 1366 × 768 dunkel

Er prüft die tatsächlichen berechneten Layoutwerte, Sichtbarkeit
ohne Hover, 44px-Touchflächen, Tastaturnamen, kein horizontales
Seitenüberlaufen, die **echte vorhandene Funktion** „Seitenbreite
umschalten“, weiterhin vorhandenen Notiztext und Browserfehler.

Screenshot-Artefakte `bilder/workspace-2/editor/` werden
nicht ins Repository committet; sie enthalten nur Testdaten.

**Testergebnisse:** In dieser Sitzung wurden Änderungen und Tests
erstellt und die generierte JS-Datei synchronisiert. Ein
vollständiger Playwright-, TypeScript- oder iPhone-Echtlauf ist
**noch nicht bestätigt**. Frühere GitHub-Actions-Jobs hatten
keinen gestarteten Runner (0 Schritte). Die tatsächliche Abnahme
muss nach dem CI-/Runner-Problem oder lokal auf Windows 11 erfolgen.

## Gemeinsame Web-/iOS-Version und Daten

Das Design liegt **ausschliesslich im gemeinsamen Code** der
Redion-Website. Codemagic baut dieselben Web-Ressourcen aus
demselben Commit in die iPhone-App ein.

Kein Datenmodell, keine IndexedDB-Migration, kein
`.redion`-Sicherungsformat, kein PDF-Ink-Eingriff,
keine zweite React-App, keine Abhängigkeit und kein
Cloud-Zwang. `index.html`, Service Worker, Capacitor,
App-ID und Swift-Bestand bleiben unangetastet.

**Vor einem späteren iPhone-Update** eine externe Sicherung
prüfen, App nicht deinstallieren, neue IPA mit derselben
Signieridentität über die bisherige Installation legen.

## Offene größere Arbeiten

Die breite PDF-Ink-Werkzeugleistenpolitur aus Issue #134
ist nicht Bestandteil dieses PRs. Die mobile Navigation
erhält einen separaten PR #139; beide Änderungen sind
unabhängig überprüfbar.
