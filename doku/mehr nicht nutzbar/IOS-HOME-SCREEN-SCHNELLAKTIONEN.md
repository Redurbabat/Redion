# Redion iPhone – Schnellaktionen direkt am Appsymbol

**24. Oktober 2026 · Eigenständiger iOS-only-PR · noch nicht auf realem iPhone abgenommen.**

## Sichtbar neue iPhone-Funktion

Auf dem iPhone das **Redion-Appsymbol länger drücken**. iOS zeigt
drei native System-Schnellaktionen:

- **Dokumente** – öffnet die vorhandene Redion-Bibliothek.
- **Heute** – öffnet die vorhandene Tagesansicht.
- **Lernen** – öffnet den vorhandenen Lernbereich.

Das funktioniert auch, wenn Redion gerade nicht geöffnet ist:
Der normale App-Start bleibt erhalten, bis die native Brücke bereit ist.
Anschliessend wird **der bereits vorhandene Dock-Button** aktiviert.
Kein zweiter Navigator, kein eigenes zweites Design, keine Notizen
neu anlegen oder löschen. Auch das manuelle Hochziehen der
Zielleiste bleibt unverändert.

## Technisch

- Statische, von Apple unterstützte `UIApplicationShortcutItems`
  werden **nur im generierten iOS-`Info.plist`** registriert.
- Capacitor 8.5 benutzt **UIScene**. Die vorliegende App startet
  eine eigene `SceneDelegate.swift`; Apple sendet
  Home-Screen-Aktionen in `connectionOptions.shortcutItem`
  (Kaltstart) bzw. `windowScene(_:performActionFor:completionHandler:)`
  (Warmstart). Der Installer `ios/install-home-shortcuts.mjs`
  fügt die beiden Handler **nur in die automatisch erzeugte**
  `build/ios-capacitor/App/App/SceneDelegate.swift` ein.
- Die native `RedionHomeShortcuts`-Klasse verwendet ausschliesslich
  drei feste erlaubte IDs und versucht höchstens 65-mal innerhalb
  von rund 13 Sekunden, sie an die geladene IPA-JavaScript-Brücke
  zu geben. Gibt es keine startbereite WebView, endet die
  Zustellung ohne Eingriff in Daten oder Navigation.
- Die iOS-only-Datei `ios/home-shortcuts.mjs` wartet auf die
  Original-Dockknöpfe `#hl-dok`, `#hl-start`,
  `#hl-lernen`. Sie ruft dann deren vorhandenen
  `.click()`-Handler auf: dieselben Register und Übergänge,
  nicht ein paralleler Router.
- Doppelte iOS-Callbacks werden gedrosselt; neue Aktionen
  ersetzen ältere, die noch auf die WebView warten.
- Die IPA-Brücke wird weiter über `ios/native-sicherung.ts`
  ausschliesslich im nativen `www/redion-native-sicherung.js`
  bereitgestellt.

**Keine neue npm-Abhängigkeit:** Apple UIKit, der native
Capacitor-Bridgecontroller und vorhandenes Redion-JavaScript genügen.
Keine Änderung an `index.html`, gemeinsamem `src/`, `quell/`,
Service Worker, Web-PWA oder allen echten Nutzerdaten.

## Vorsicht bei Capacitor-Vorlagen

Dieser PR erwartet die **aktuelle Capacitor-8.5-UIScene-Vorlage**
mit `SceneDelegate.swift` und `SceneDelegateProxy.shared`.
Wenn der in Codemagic installierte Capacitor-8-Stand noch eine
andere Projektvorlage nutzt, schlägt der Installer mit einer
klaren Fehlermeldung fehl. **Kein automatisches Überschreiben,
kein Löschen oder Neu-Erzeugen des bestehenden `ios/`-Ordners.**
Ein Build mit fest angepasster/älterer Vorlage braucht dann
einen eigenen, geprüften Migrationsschritt.

## Tests

```powershell
node --test ios/home-shortcuts.test.mjs
node --test ios/native-project-layout.test.mjs
node --test ios/install-privacy-shield.test.mjs
```

Der zusätzliche native Regressionstest prüft:

1. Genau drei Aktionen, ausschliesslich bekannte Original-Dock-IDs.
2. Kaltstart: kein Klick, bevor die Weboberfläche vollständig lädt.
3. Warmstart: echtes Öffnen über bestehende Buttons.
4. Schutz vor ungültigen IDs und doppelten iOS-Callbacks.
5. Neue Aktion während Ladezeit verdrängt die alte.
6. Kein Klick auf deaktivierte Ziele oder nach Stoppen des Routers.
7. Native Swift-Szene unterstützt Kalt- und Warmstart; verweigert
   unbekannte Vorlagen sowie doppelte Installation.
8. Statische Info.plist-IDs und Apple-Systemsymbole.
9. App-ID und Website bleiben unangetastet.

Der Codemagic-Workflow installiert die 3 Info.plist-Einträge
und prüft ihre Identifikatoren **vor dem Xcode-Build**.

**Noch nicht nachgewiesen:** Vollständiger `npm run bauen:ts`,
Swift-/Xcode-Kompilierung, echte iOS-Systemmenüs und
der letzte Klick auf einem realen Gerät. Eine grüne Node-Testliste
ersetzt diese Abnahme nicht.

## iPhone-Abnahme

1. Externe `.redion`-Sicherung ausserhalb der App kontrollieren.
   **Vorhandene App nicht deinstallieren.**
2. Aktuellen PR prüfen, bei grünen Tests nach `main` übernehmen.
3. Neuen Codemagic-Build aus dem **aktuellen** `main` starten.
   Nur bei vollständig grünem Xcode-Log die unsignierte IPA
   wie gewohnt signieren und über die bestehende App installieren.
4. Redion-Appsymbol auf dem iPhone **lange drücken**:
   „Dokumente“, „Heute“ und „Lernen“ müssen angezeigt werden.
5. Redion beenden und „Dokumente“ direkt vom Home-Bildschirm
   wählen; das Bibliotheksregal sollte erscheinen.
6. App in den Hintergrund bringen, „Lernen“ wählen und prüfen,
   dass die existierende Lernerfahrung aufgerufen wird.
7. Wiederholung, schnelles Öffnen, gesperrter Bildschirm,
   VoiceOver und dunkles/helles iPhone-Thema kontrollieren.
8. Die Website bleibt unverändert – dort gibt es kein
   native iOS-Homescreen-Menü.

## Grenzen

Dies sind **Startabkürzungen**, keine Hintergrundaktionen oder
Widgets. iOS stellt die drei Menüeinträge selbst dar; Redion
ändert nicht die Website und führt keine Aktionen im Hintergrund
aus. Aktionszustellung auf sehr alten oder abweichenden
Capacitor-Vorlagen erfordert eine separate Prüfung.
