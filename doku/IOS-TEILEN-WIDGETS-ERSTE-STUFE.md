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
4. Die native Datei wird erst nach einer bestätigten
   `Store.flush()`-Ausführung gelöscht. Bei einem Absturz,
   gesperrten/volatilen Speicher oder fehlender Bridge verbleibt sie
   zur späteren erneuten Annahme in der App Group. Eine über die
   gespeicherte UUID gemerkte Empfangsbestätigung verhindert
   Duplikate nach erneutem Ausliefern.

**Widgets:** Ein schlichtes Widget „Redion öffnen“ im mittleren
Format bietet **Dokumente, Heute und Lernen**. Keine Titel, keine
Vorschaubilder und keine sensiblen Nutzerdaten in einem
Sperrbildschirm-/Home-Screen-Widget. Jede Auswahl ruft ausschließlich
`redion://widget/{dokumente|heute|lernen}` auf; die Swift-Brücke
verwendet Redions bestehenden Home-Shortcut-Router und damit die
vorhandenen Tab-Buttons statt eine neue Navigation. Auch
Kaltstart-Links werden abgefangen.

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
  ausschließlich **Textblöcke** anlegen, auf dauerhafte
  Speicherung warten, empfangene IDs deduplizieren.
- `ios/install-incoming-share-widget.mjs`: nur das
  **generierte** `SceneDelegate.swift` ergänzen;
  WebKit ruft `RedionNativeShare.receive` über
  `callAsyncJavaScript` mit Datenargumenten auf (keine
  JavaScript-String-Injektion). Datei erst nach `true` löschen.
- `ios/widgets/RedionWidgets.swift`: WidgetKit, statische
  drei Links, keine Datensynchronisation.
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
node --test ios/share-widget-integration.test.mjs
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
