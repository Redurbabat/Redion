# Redion Lab – 3D Schalter/Steckdose & Ink

## Neu in der UI-Kit-Website

Der neue Bereich `#/redion` zeigt drei vom Nutzer bereitgestellte, als separate 3D-Studien angepasste Konzepte (Schalter/Steckdose, Premium-Installations-Einsatz und Mysterium) **neben** den zuvor entwickelten Redion-Werkzeugen: Stift, Textmarker, Radierer, Pinselstärke, mechanischer FilamentSwitch und HaloSwitch.

**Die bestehende Redion-App wird nicht verändert.** Der Bereich ist ein experimenteller Staging-/Designraum für eine spätere gezielte Übernahme.

## 3D-Modell

**Quelle:** `app/public/redion-3d-model.html`. Einzeln ausführbar im Browser unter `/redion-3d-model.html`. Die Vorlage wurde aus dem vom Nutzer im Chat bereitgestellten Three.js/r128-HTML adaptiert. Ihre zentralen Elemente sind erhalten:

- 3D-Gehäuse als abgerundetes Extrusionsmodell
- zehn reguläre orange Klemmkontakte plus vier unten angewinkelte Kontakte
- blauer Klemmblock
- Schuko-artiger Steckdoseneinsatz mit Kontakten und Aussparung
- seitliche Befestigungsschrauben und oberer Haltebügel
- OrbitControls: Linksklick drehen, Rechtsklick verschieben, Mausrad/Touch zoomen
- Auto-Rotation, Drahtgitter-Modus, Explosionsansicht, Reset und Vorderansicht

### Korrekturen gegenüber der Vorlage

- Buttons ändern ihren Status **über explizite Click-Listener** (statt des impliziten Browserglobals `event`, das in Modulen/Strict-Mode unzuverlässig ist).
- Die Explosionsbewegung basiert auf gespeicherten Ausgangskoordinaten und ist vollständig rückgängig.
- `ResizeObserver` passt die Kamera dem tatsächlichen Container an (statt dem gesamten Browserfenster).
- Bei `prefers-reduced-motion` bleibt die Auto-Rotation aus und das Modell springt ohne Tween direkt in den Zielzustand.
- Die 3D-Bühne bietet Tastatursteuerung (Pfeile drehen das Modell, `+`/`-` zoomen) sowie sichtbare Fokusrahmen.
- Bauteile lassen sich anklicken und anzeigen, welcher Komponentenbereich gemeint ist.
- Keine erfundene elektrische Simulation: rein visuelles 3D-Designmodell, **kein echter Schaltplan**.

### Abhängigkeit / Offline

Die HTML-Demo referenziert **Three.js 0.128.0** und die dazu passenden OrbitControls über **HTTPS-CDNs**, wie im Nutzerbeispiel. **Diese Demonstration benötigt daher Internet und WebGL.**

Das UI-Kit besitzt keine `three`-NPM-Abhängigkeit und das portable `app/src/touch` bleibt ohne Three. Für Redion-Windows oder andere **Offline-Apps** ist das HTML **noch nicht produktionsfertig**: Vor der Übernahme Three.js lokal versioniert bündeln (idealerweise ein eigenständig getestetes modernes Three.js-Bundle), Sicherheitsrichtlinien/CSP und Lizenzhinweise prüfen, WebGL-Fallback und echtes Grafikgerät testen.

Externe CDNs sollen **nicht unbemerkt** in den Offline-Build von Redion übernommen werden.

## Zweite Studie: Premium Installations-Einsatz

Unter `app/public/redion-3d-premium.html` steht der neuere, helle WAGO-inspirierte 3D-Konzeptentwurf aus dem Nutzerbeispiel. Die Szene verwendet Three.js **0.160.0**, `RoundedBoxGeometry`, physikalische Kunststoff-/Metallmaterialien, orange Push-in-Klemmen, einen blauen Kontaktblock, Befestigungsschrauben und einen Haltebügel.

Die Steuerung umfasst Orbit und Zoom, einen **Drehwinkelregler**, Wireframe, Teile zerlegen/zusammenbauen, Reset und anklickbare Komponenten. Gegenüber dem gelieferten Beispiel sind die Explosionsrichtungen ausdrücklich an logisch gruppierte Baugruppen gebunden: Zubehör und Klemmen lassen sich einzeln bewegen, statt unkontrolliert alle Meshes zu verschieben. Der Wireframe-Modus verwendet einen bekannten booleschen Zustand; er setzt nicht voraus, dass das erste Kind ein Mesh ist. Die Aufschrift `TOP` wird lokal als Canvas-Text erstellt, ohne zusätzliche Font-Dateien.

## Dritte Studie: Mysterium 3D

Unter `app/public/redion-3d-mysterium.html` liegt die dritte vom Nutzer gelieferte Entwurfsidee:

- organisch deformierte Icosahedron-Oberfläche in dunklem Obsidian-Look
- pulsierender orangefarbener Kern und eine rotierende Partikelwolke
- warme/kalte Lichtquellen und `UnrealBloomPass`
- Maus-/Touch-Interaktion, Orbit und Zoom
- **Pause/Start**, Bloom ein/aus, Auto-Rotation und Reset
- **prefers-reduced-motion**: kein automatischer Animationsstart; Bewegungen lassen sich explizit einschalten, automatische Rotation bleibt bei reduzierter Bewegung aus
- Animation nur, wenn der Browser-Tab und der Bereich sichtbar sind; geringere Partikelanzahl auf schmalen Bildschirmen und reduzierte Normalenberechnung

Bei `Mysterium` handelt es sich um eine **visuelle Material-/Motion-Studie**, nicht um ein elektrisches Bauteil. Die drei separaten Modell-Dateien laufen nur, während ihr jeweiliger Tab ausgewählt ist; durch den iframe-Wechsel wird die vorherige Seite entladen.

## Weitere Redion-Tools

`app/src/touch/ink/`, `app/src/touch/components/FilamentSwitch.tsx` und `HaloSwitch.tsx` sind unabhängig von der 3D-Ansicht, React-only und wiederverwendbar. Ihre API und Übernahmehinweise stehen in [REDION_INK_COMPONENTS.md](REDION_INK_COMPONENTS.md).

## Tests

```sh
cd app
npm ci
npm run build
npm run test:unit
npm run test:smoke
```

Die Browser-Smoke-Tests öffnen `#/redion` bei 390px und 1280px, prüfen alle drei umschaltbaren Modellstudien und ihre Steuerflächen, das CDN/WebGL-Fallback, die ink-/switches-Tabs und die eigenständigen Modellseiten. CI erstellt zusätzlich echte PNG-Screenshots als Actions-Artefakt. Eine native Windows-/iOS-/Stiftdruck-Hardwareprüfung steht bis zur Redion-Integration aus.
