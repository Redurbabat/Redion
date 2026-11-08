# Redion iPhone: Externe Links im nativen Safari-Fenster

**24. Oktober 2026 – iOS-only Verbesserung.** Eigenständiger Redion-PR,
noch nicht auf echtem iPhone oder mit Codemagic bestätigt.

## So fühlt sich Redion mehr wie eine echte iPhone-App an

Tippt man in einem Dokument, einer Datenbank oder einer Hilfe auf
einen ausdrücklich **externen HTTPS-Link** (`<a target="_blank">`),
öffnet die iOS-App ihn jetzt über Apples **SFSafariViewController**.
Die native Safari-Ansicht hat eine integrierte Möglichkeit, zur
Redion-App zurückzukehren. Die geöffnete Notiz bleibt erhalten,
statt möglicherweise durch eine fremde Internetseite ersetzt zu werden.

Das Browser-Plugin ist **offiziell von Capacitor**, nicht irgendeine
eingebaute Webansicht unbekannter Herkunft. Es wird nur für den
Codemagic-iOS-Build installiert (`@capacitor/browser@8`), über
`includePlugins` als echtes iOS-Plugin erkannt und zusammen mit
der bisherigen nativen Sicherungsbrücke gebündelt.

## Schutzgrenzen

Die in `ios/native-safari-links.mjs` installierte Eventbehandlung
greift **nur** bei einem unmodifizierten Primärklick auf einen
`a[href][target="_blank"]` mit gültiger externer HTTPS-URL.
Sie ignoriert grundsätzlich:

- relative oder gleich-originige Redion-Links, Anker (`#page`),
  Navigation und Unterseiten;
- `download`, `blob:`, `file:`, `mailto:`, `tel:`,
  `javascript:`, `data:`, `http:` und URLs mit
  Benutzername/Passwort;
- die Bearbeitung von Inhalt innerhalb von `contenteditable`;
- Strg-/Meta-/Alt-/Shift-Klicks, andere Maustasten,
  schon durch Redion abgefangene Klicks und Doppeltipps;
- die bisherigen OAuth-Anmeldefenster, die Redion separat
  über `window.open()` steuert.

Der native Browser wird unmittelbar im echten Klickereignis
aufgerufen. Falls die native Safari-Ansicht unerwartet
fehlschlägt, versucht Redion die bestehende iOS-**Teilen**-
Funktion für die URL. Das ist ein Ausweichweg, keine Garantie
für ein geöffnetes Browserfenster. In keinem Fall navigiert
dieser neue Code automatisch die lokale Redion-Notizansicht weg.

**Es werden keine Dokumentinhalte an Safari übertragen.**
Nur die vom Nutzer angetippte externe Webadresse wird geöffnet.
Wenn Nutzer eine URL mit geheimen Informationen erzeugen,
enthält das Linkziel selbst diese Informationen; Redion
erfindet oder sendet keine zusätzlichen Inhalte.

## Unveränderte Website und Daten

Kein veränderter `index.html`, keine neuen Skripte im PWA- oder
`file://`-Einstieg, keine Änderungen an `src/` oder `quell/`
und keine Datenmigration. Nur:

- `ios/native-safari-links.mjs`: native iOS-Klickweiterleitung;
- `ios/native-sicherung.ts`: bestehendes iOS-only Bündel;
- `capacitor.config.json`: zusätzliches natives Browser-Plugin
  in `includePlugins`, **gleiche** Bundle-ID
  `ch.redurbabat.redion` und **gleicher** Xcode-Pfad;
- `codemagic.yaml`: nur der native iOS-Build bekommt
  `@capacitor/browser@8`, zusammen mit den bisherigen
  Capacitor-Plugins; vorhandenes `esbuild@0.28.2` bleibt;
- vorhandene Plugin-Tests werden an die neue Liste angepasst.

Die SHA-256-Prüfung `ios/vergleiche-webstand.mjs` kontrolliert
weiterhin die identischen Webdateien von Website und IPA.

## Prüfung

```sh
node --test ios/native-safari-links.test.mjs
node --test ios/native-feel.test.mjs
node --test ios/codemagic-dependency-versions.test.mjs
node --test ios/vergleiche-webstand.test.mjs
```

Die neuen Tests prüfen die Einschränkung auf externe HTTPS-Links,
unveränderte interne Links und Downloads, Modifier-Tasten,
Bearbeitung, doppelte Tippereignisse, Fehler im Safari-Plugin,
die native Teilen-Ausweichmöglichkeit sowie das Entfernen des
Listeners und das unveränderte HTML.

**Wichtig:** Tests sind im PR und im Codemagic-Build eingebunden.
Ein erfolgreicher neuer Codemagic-/Xcode-/Echtgerätelauf ist
noch nicht nachgewiesen.

## Abnahme auf dem iPhone

1. Vor jedem IPA-Update zuerst eine externe `.redion`-
   Sicherung erstellen. **Die bereits installierte Redion-App
   keinesfalls deinstallieren.**
2. Nur nach erfolgreichem Build eine neue unsignierte IPA
   signieren und mit derselben App-ID über die vorhandene
   Installation aufspielen.
3. Auf eine HTTPS-Quelle in einer Testnotiz tippen. Die
   native Safari-Ansicht soll öffnen und wieder schließbar sein.
4. Nach dem Schließen muss dieselbe Redion-Notiz geöffnet
   und der Text unverändert sein.
5. Interne Navigation, normale Dokumentaktionen, Mail-/Tel-
   Links, PDF-Downloads und Anmeldung wie bisher testen.
6. Website im Browser kontrollieren: unveränderte Link-
   und Download-Funktionen.

Bei Problemen das iPhone-/Codemagic-Protokoll vorlegen.
Dieser PR führt keinen Merge, Deploy und keine iPhone-Installation aus.
