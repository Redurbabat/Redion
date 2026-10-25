# Redion iPhone – „Teilen → Redion“ und Startbildschirm-Widgets

**Stand: 25. Oktober 2026.** Eigenständige neue iOS-Funktionsstufe,
basierend auf `main` nach dem Merge von PR #156.

## Gewünschter Ablauf

**Teilen aus anderen Apps (erste Stufe: Text + Weblink):**

1. In Safari, Notizen oder einer anderen iPhone-App Text bzw.
   einen Weblink wählen → **Teilen** → **In Redion**.
2. Eine eigene Share Extension schreibt ausschließlich einen
   kleinen, prüfbaren JSON-Eintrag in
   `group.ch.redurbabat.redion.share/Inbox/`.
   Sie greift nicht direkt auf Redions IndexedDB zu und benötigt
   keine Internetverbindung.
3. Redion öffnen bzw. zurück in die App wechseln. Die bestehende
   `SceneDelegate`-Brücke liest die Datei und übergibt den Inhalt
   der **identischen lokalen Redion-Weboberfläche**. Redion erstellt
   eine normale Seite („Von iPhone geteilt ...“) mit einem reinen
   Textblock, auch bei einer URL. Keine Linkvorschau und kein
   automatischer Netzwerkaufruf.
4. **Vor dem Import wartet die native Brücke auf das echte
   `ablage.geladen`-Ereignis** und eine beschreibbare lokale Datenbank.
   Der `Store`-Name allein reicht nicht: Redion lädt den Bestand
   asynchron.
5. Seite und Text erhalten **zwei stabile Kennungen aus der
   Share-UUID**. Sie werden im selben `Store.flush()`-
   IndexedDB-Block-Commit gespeichert. Bei App-Neustart,
   fehlgeschlagenem Flush und mehrfacher Zustellung erkennt
   Redion die vorhandenen Kennungen wieder und erzeugt
   **keine doppelten Seiten**.
6. Die native Datei wird erst nach einer bestätigten
   `Store.flush()`-Ausführung gelöscht. Bei einem Absturz,
   gesperrten/volatilen Speicher oder fehlender Bridge verbleibt sie
   zur späteren Annahme in der App Group. Eine separate
   `setMeta()`-Empfangsmarkierung wird **nicht mehr verwendet**,
   weil sie nicht mit dem Block-Commit verbunden war.

**Widgets – Redion Orbit:** Drei SwiftUI-Größen mit einer
gemeinsamen ruhigen Designsprache:

- **Klein:** Tiefes Violett und ein heller Orbit um den Redion-Schriftzug.
  Die ganze Fläche öffnet den bestehenden Ort **Heute**.
- **Mittel:** Drei separat antippbare, leicht schwebende Kacheln
  **Dokumente, Heute, Lernen**, begleitet von sanften Lichtbahnen.
- **Groß:** Ein deutliches Redion-Studio mit ausgreifendem Ornament,
  dem Motto „Ideen finden. Wissen bewegen.“ und drei breiten Zielen.

Alle Varianten verwenden dieselben drei unveränderten iPhone-Navigations-
Deep-Links und zeigen **keine** vertraulichen Notizen. Die
Farbkomposition orientiert sich an Redions dunklem Studio mit
Violett als Primärakzent und Türkis/Apricot als Lichtfarben.

### Anpassung an die gezeigten iPhone-Konzeptbilder

Die Bildvorschauen waren **Designrenderings**, keine Fotos eines
laufenden Builds. Die tatsächliche `RedionWidgets.swift` hat nun
deutlich mehr dieser sichtbaren Elemente als zuvor:

- `RedionPlanet` zeichnet pro Widget zwei skalierte Planeten
  mit radialer Schattierung, heller Kante, Farbreflexen,
  kleiner Lichtmondsichel und weichem Farbhalo vollständig
  in SwiftUI, **ohne eingebettete Fotos**.
- `RedionOrbitBackdrop` erzeugt zwei elliptische,
  mehrfarbig leuchtende Umlaufbahnen, deterministische
  Sternpunkte und räumlich verteilte Türkis-/Violett-Nebel.
- Die **drei verschiedenen** Kacheln haben abgerundete
  Verlaufspanels und passende Leuchtkanten: Dokumente türkis,
  Heute apricot, Lernen violett.
- Kleine Widgetvariante: „Ein Gedanke.“ und eine kleine
  schimmernde Kapsel „Heute öffnen“. Mittlere Variante:
  „Drei Wege. Alles deins.“. Große Variante:
  „Ideen finden. Wissen bewegen.“ über drei breiten Zielen.
- Die Platzverhältnisse wurden für ältere iOS 15/16-Widgets
  mit zusätzlichen Systemrändern reduziert. Auf iOS 17+
  darf der Orbit-Hintergrund die volle Fläche einnehmen.
- Die reduzierte Bewegung schaltet sowohl den geplanten
  Orbitalpositionswechsel als auch explizite Animationen ab.

**Nicht pixelidentisch:** Die gerenderten Vorschaubilder
zeigen fotorealistische, detailliert texturierte Planeten.
Die native Umsetzung verwendet absichtlich sparsame SwiftUI-
Vektorformen: gleiche Stilrichtung und Bedienelemente,
aber nicht dieselben Bildpixel. Den wirklichen Abstand zum
Konzept kann nur eine Xcode-Widgetvorschau bzw. ein
Geräte-Screenshot nach erfolgreichem Build zeigen.

Die Bewegung ist **echt WidgetKit-konform**, kein künstlicher
Endlosloop: `RedionWidgetProvider` gibt alle **drei Stunden** einen
neuen Orbit-Zustand vor. Das System kann dann die neuen Farbflächen und
Ellipse sanft überblenden bzw. ihre Position kurz animieren
(0,8–0,9 Sekunden; durch iOS geplant und ggf. verzögert). Bei
**„Bewegung reduzieren“** bleibt die Orbitposition konstant, und
die expliziten Animationen sind abgeschaltet. StandBy-/Always-On-
Modus und WidgetKit-Energiebudgets haben Vorrang.

**iOS-Grenze:** Ein Widget ist keine ständig laufende SwiftUI-App.
Dauerhaftes Pulsieren, rotierende Sterne oder 60-FPS-Animationen
würden von WidgetKit nicht zuverlässig ausgeführt. Daher bewusst
kurze, ereignisgebundene Übergänge und keine Timer. Die Animation
ist erst nach einem tatsächlichen Xcode-/iPhone-Test bestätigt.

## Bewusst noch nicht unterstützt

- **Fotos, Videos, PDFs und Office-Dateien** im eingehenden
  iOS Share Sheet – hierfür folgt eine sichere, stückweise
  Datei-Übernahme in Redions vorhandene Dateiverwaltung.
- Automatischer Sprung aus dem Share Sheet in Redion;
  iOS-Erweiterungen dürfen die Eltern-App nicht beliebig starten.
  Daher **Redion nach dem Teilen selbst öffnen**.
- Private Notizinhalte, Fälligkeiten oder Datenbankdaten im Widget.
  Diese bleiben geschützt im App-Container und werden nicht in die
  Erweiterung repliziert.

## Native Architektur und Sicherheitsgrenzen

- `ios/share-extension/RedionShareViewController.swift`:
  native `NSItemProvider`-Annahme, Textlimit 60.000 Zeichen,
  URL-Limit 4.096 Zeichen; nur HTTP(S)-URLs ohne Credentials;
  atomare App-Group-Datei. Echte Fehler werden nicht als
  erfolgreiches Teilen gemeldet.
- `ios/incoming-share.mjs`: externe Daten validieren,
  ausschließlich **Textblöcke** anlegen, mit aus der Share-ID
  abgeleiteten stabilen Seiten-/Block-IDs und einem gemeinsamen
  `Store.flush()` speichern; fehlende Kindverweise sicher
  reparieren und empfangene IDs ohne Metadaten-Sidecar deduplizieren.
- `ios/incoming-share-readiness.mjs`: erst nach dem mit Replay
  verfügbaren Ereignis `ablage.geladen` den lokalen Store
  als initialisiert behandeln. Bei fehlendem Bus keine Annahme.
- `ios/install-incoming-share-widget.mjs`: nur das
  **generierte** `SceneDelegate.swift` ergänzen;
  WebKit ruft `RedionNativeShare.receive` über
  `callAsyncJavaScript` mit Datenargumenten auf (keine
  JavaScript-String-Injektion). Datei erst nach `true` löschen.
- `ios/widgets/RedionWidgets.swift`: Redion-Orbit-Design,
  drei Widgetgrößen und dreistündige Timeline-Zustände mit
  reduzierbarer Kurzanimation, ohne Datensynchronisation.
- `ios/widget-orbit.test.mjs`: Regressionen gegen Dauer-Timer,
  private Daten, unbekannte Zielrouten, ungeprüfte Widgetgrößen
  und ignoriertes Reduced Motion.
- `ios/install-share-widget-targets.rb`: zwei echte
  iOS App-Extension-Targets über `xcodeproj`, ausschließlich
  im generierten `build/ios-capacitor/App/App.xcodeproj`.
  Keine direkte Änderung der versionskontrollierten `ios/`-
  Quellen, keine zweite App-ID und keine Veränderung von
  `index.html` oder der PWA.

## Wichtige Build-Freigabe: noch Preview

Die bestehenden unsignierten Codemagic-Builds bleiben zunächst
**unverändert**. Die beiden zusätzlichen nativen Targets werden
derzeit nur mit der Codemagic-Umgebungsvariablen

```text
REDION_IOS_EXTENSIONS=1
```

eingebaut. Der Schritt installiert bei Bedarf das
`xcodeproj`-Ruby-Gem in Version 1.27.0, fügt die Targets zum
frisch generierten Xcode-Projekt hinzu und registriert das
`redion://`-URL-Schema.

**Apple Developer-Konfiguration für eine signierte IPA:**
Es werden Provisioning-Profile und Bundle IDs für
`ch.redurbabat.redion`,
`ch.redurbabat.redion.share` und
`ch.redurbabat.redion.widgets` benötigt.
Die App und die Share Extension müssen dieselbe aktivierte
App-Group-Berechtigung `group.ch.redurbabat.redion.share`
erhalten. Codemagic erzeugt weiterhin nur eine
**unsignierte** IPA; damit kann das Verhalten auf einem
echten iPhone noch nicht bestätigt werden.

Die bestehende `ch.redurbabat.redion`-App unbedingt
**als Update signieren, nicht deinstallieren oder mit anderer
Bundle-ID installieren**, da die lokalen Daten sonst in
einem anderen Container liegen oder verloren gehen können.
Eine überprüfte externe `.redion`-Sicherung vor dem ersten
Geräteversuch wird vorausgesetzt.

## Verifikation

```sh
node --test ios/incoming-share.test.mjs
node --test ios/incoming-share-store-contract.test.mjs
node --test ios/share-widget-integration.test.mjs
node --test ios/widget-orbit.test.mjs
node --test ios/home-shortcuts.test.mjs
npm run bauen:ts
npm run typecheck
```

Zum tatsächlichen Codemagic-Preview-Build
`REDION_IOS_EXTENSIONS=1` setzen und einen **manuellen**
Build starten. Anschließend mindestens prüfen:
1. `RedionShare.appex` und `RedionWidgets.appex` sind
   in `App.app/PlugIns` vorhanden.
2. App + Share Extension haben dieselben App-Group-Entitlements;
   die Widget-Extension hat den registrierten URL-Handler.
3. Aus Safari einen Link teilen, Redion öffnen,
   neue Seite finden; wiederholtes Öffnen erzeugt
   keine doppelten Seiten.
4. Text, ungültige URLs, abbrechendes Share Sheet,
   gesperrte App und fehlende App Group kontrollieren:
   kein Datenverlust/Fehler als Erfolg.
5. Widget hinzufügen und alle drei Ziele testen,
   auch beim Kaltstart. TabShelf bleibt **nur per Hochziehen**
   geöffnet; Widget öffnet niemals die Zusatznavigation.
6. Bestehende Notizen, Anhänge, Backups, Privacy Shield,
   Offline-Funktion und PDF-/Office-Export gegenprüfen.

**Noch nicht bestätigt:** echter Swift-/Xcode-/WidgetKit-
Compilerlauf, Apple-Signing, App-Group-Berechtigung auf
einem Gerät, geräteübergreifende Eingänge. Der PR soll
vor Aktivierung auf echter Hardware überprüft werden.
