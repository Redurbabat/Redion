# Redion iPhone – Native Bedienung (Haptik & Statusleiste)

**Stand:** 24. Oktober 2026 · Noch nicht auf einem echten iPhone überprüft.

## Was man auf dem iPhone merken soll

Redion behält die gleiche Weboberfläche und dieselben Notizen wie die
Website. Neu reagiert **nur die native iPhone-App** dezent auf
typische iOS-Eingaben:

### 1. Die echte iOS-Statusleiste passt zum Redion-Thema
- Dunkles Redion → helle Uhrzeit, Batterie- und Empfangssymbole.
- Helles Redion → dunkle Symbole.
- Wenn Redion von Hell zu Dunkel umgestellt wird, folgt die native
  Statusleiste, ohne die Seite neu zu laden.
- Die iPhone-Statusleiste **bleibt sichtbar**. Kein Fullscreen,
  keine Änderungen an Safe-Areas oder am Home-Indikator.
- Technisch nutzt Redion **`SystemBars` aus `@capacitor/core@8`**.
  Dafür braucht die generierte `Info.plist` den Wert
  `UIViewControllerBasedStatusBarAppearance = true`.
  Der native Build setzt zusätzlich `UIStatusBarHidden = false`.
  Es ist **kein zusätzliches Statusbar-Paket** notwendig.

### 2. Leichte Haptik bei Auswahl
- Tippen auf einen der bestehenden fünf Hauptreiter gibt einen
  dezenten Taptic-Impuls (iOS-`ImpactStyle.Light`).
- Beim **Hochziehen** über die vorhandene Zielleiste meldet das
  iPhone neu anvisierte Ziele auch durch einen subtilen Impuls.
- Die dokumentierte Redion-Regel bleibt unverändert:
  **normales Tippen öffnet die zusätzliche Zielleiste NICHT**.
  Sie öffnet nur durch die bestehende Hochzieh-Geste, und
  beim Loslassen wird **höchstens ein** Ziel geöffnet.
- Einige Blatt-/PDF-Seitenbefehle bekommen denselben Impuls.
- Keine Haptik beim Tippen in Textfelder, für Tastatur-Enter,
  für deaktivierte Schalter oder während die App im Hintergrund ist.
- Der Feedback-Adapter begrenzt alle Impulse auf höchstens
  einen alle **140 ms**, um Dauerbrummen zu verhindern.
- Bei `prefers-reduced-motion: reduce` oder Redions ruhiger
  Darstellung wird Haptik vollständig unterdrückt.
- Gerät ohne Taptic Engine oder nicht bereiter nativer Dienst:
  **normale Navigation ohne Ausnahme, niemals Datenverlust**.

Technik: Das **offizielle Capacitor-Paket**
`@capacitor/haptics@8` wird nur beim **Codemagic-iOS-Build
temporär** installiert (`npm --no-save --package-lock=false`).
Es wird **nicht** in `package.json`, `package-lock.json`
oder die normale Website aufgenommen.
`npx cap sync ios` bindet die native Plugin-Implementierung in das
generierte Xcode-Projekt ein. Das gemeinsame Redion-JavaScript hat
keine Kenntnis von diesem Plugin.

## Trennung von Website und iOS

`ios/native-feel.mjs` ist ein isolierter Adapter.
`ios/native-sicherung.ts` startet ihn **nur** dann, wenn
`Capacitor.getPlatform() === 'ios'` UND
`Capacitor.isNativePlatform()`.

Dieser Adapter gehört zum ohnehin nur unter iOS geladenen
`www/redion-native-sicherung.js`.
Die bestehende Webparitätsprüfung erlaubt **genau dieses**
zusätzliche Skript. Alle Website-Dateien (`index.html`,
`quell/`, `src/`, CSS, PWA) sind weiterhin bytegleich.

Die App-ID bleibt `ch.redurbabat.redion`.
Keine Änderungen an den iOS-Dateiexporten, Swift-Privacy-Shield,
`ios/`-Quellen, `build/ios-capacitor`, IndexedDB,
Notizen oder Sicherungsformaten.

## Neue Regressionstests

```sh
node --test ios/native-feel.test.mjs
node --test ios/codemagic-dependency-versions.test.mjs
node --test ios/native-project-layout.test.mjs
```

Der Test prüft mit **künstlichen Browser- und Native-Mocks**:
1. Statusbar-Stil bei Hell/Dunkel und keine überflüssigen Updates.
2. Subtile Haptik auf Fingertipp, gedrosselte Wiederholungen,
   keine Haptik für Tastatur und deaktivierte Elemente.
3. Auswahlfeedback bei bestehender Hochzieh-Geste, aber
   nicht bei anderen UI-Elementen.
4. Stille bei Hintergrundzustand, Ruhemodus und Reduced Motion.
5. Reaktionsfähigkeit, wenn native Schnittstellen Fehler werfen.
6. Native Beschränkung und unveränderter Website-Einstieg.

Der vorhandene npm-Kompatibilitätstest wurde aktualisiert,
damit er den offiziellen Capacitor-Haptics-Eintrag zulässt;
`esbuild@0.28.2` aus PR #142 bleibt unverändert.
Alle Tests laufen **vor** `npx cap add ios` in Codemagic.

**Nicht nachgewiesen:** Kompletter npm+Capacitor-Build auf
Mac, Xcode/SPM-Kompilierung, Haptik auf einem echten iPhone,
Statusbar-Farben bei dynamischem Wechsel und IPA-Installation.
Native Effekte sind von iOS-Gerät und Systemversion abhängig.

## So prüfst du die neue iPhone-Version

1. Die Dokumente zunächst als `.redion` **extern**
   exportieren, Sicherung öffnen und kontrollieren.
2. Den PR prüfen und erst danach nach `main` übernehmen.
3. Einen frischen **manuellen** Codemagic-Build aus dem neuesten
   `main` starten. Alte Build-Commits enthalten die Änderung nicht.
4. Die unsignierte IPA wie bisher mit derselben Apple-ID,
   Bundle-ID und Signing-Identität signieren.
5. Die bestehende iPhone-App **nicht deinstallieren**,
   sondern die neue IPA als Update installieren.
6. Redion dunkel/hell wechseln: native Uhrzeit und iPhone-
   Statussymbole müssen kontrastreich passen.
7. Unten `Dokumente` und `Lernen` antippen: leichte Haptik,
   normales Tippen darf **keine** Zielleiste öffnen.
8. Ein Ziel per **Hochziehen** anvisieren und seitlich ziehen:
   dezente Impulse, vollständige Zielvorschau und höchstens
   ein tatsächlicher Navigationswechsel beim Loslassen.
9. Redions „Ruhige Darstellung“ und die iOS-Einstellung
   „Bewegung reduzieren“ prüfen; keine Haptik.
10. Mit einer Testnotiz den PDF-Export, nativen Dateien-Export,
    Offline-Modus, Datenschutz im App-Umschalter und Wiederöffnung
    prüfen; keine Inhalte dürfen verloren gehen.

Eine neue IPA ist erst nach einem vollständig erfolgreichen
Codemagic-/Xcode-Lauf bestätigt. Die vorhandene iPhone-App
wird durch den Pull Request selbst nicht verändert.
