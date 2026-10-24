# Redion iOS – Codemagic ERESOLVE mit Vite 8 und esbuild

**Betroffen:** iOS-Workflow `redion-ios-unsigned`, Schritt
**„iOS-Projekt mit Capacitor 8 erzeugen“**.

## Ursache

Das Redion-`package.json` und die gesperrte
`package-lock.json` verwenden `vite@8.3.1`. Laut deren
`peerDependencies` akzeptiert Vite 8.3.1 für die optionale
Build-Abhängigkeit `esbuild` **`^0.27.0 || ^0.28.0`**.

Der iOS-Schritt installierte zusätzlich zu Capacitor 8 immer
`esbuild@0.25` mit `npm install --no-save`. npm darf die
inkompatiblen Peer-Abhängigkeiten nicht stillschweigend auflösen
und beendet daher die Installation mit `ERESOLVE` noch **vor**
`npx esbuild`, `cap add ios` und dem eigentlichen Xcode-Build.

Dies ist **kein** Fehler beim iPhone, bei der Signierung, in
IndexedDB oder bei deinen Redion-Dateien.

## Minimaler Fix

`codemagic.yaml` installiert im nur für Codemagic
ausgeführten Schritt nun:

```sh
npm install --no-save --package-lock=false --no-audit --no-fund \
  @capacitor/core@8 @capacitor/cli@8 @capacitor/ios@8 \
  @capacitor/filesystem@8 @capacitor/share@8 esbuild@0.28.2
```

`0.28.2` gehört zum von Vite 8.3.1 ausdrücklich erlaubten
Bereich `^0.28.0`. Es werden **keine** Sicherheitsgrenzen
mit `--force` oder `--legacy-peer-deps` ausgeschaltet.

Ein neuer Regressionstest
`ios/codemagic-dependency-versions.test.mjs` liest die
reale `package-lock.json` und prüft vor dem Web-Bau
automatisch, ob die künftig in Codemagic ausgewählte
`esbuild`-Version zur `peerDependencies.esbuild`-
Anforderung der gesperrten Vite-Version passt.

## Selbst prüfen

Auf Windows 11 im Redion-Repository:

```powershell
npm ci
node --test ios/codemagic-dependency-versions.test.mjs
```

Für eine Prüfung des späteren Installationsschritts
müsste `npm install --no-save --package-lock=false ...`
in einer **wegwerfbaren Kopie des Repositories** ausgeführt
werden. Das Flag `--no-save` verhindert zwar eine
Manifeständerung, aber npm verändert weiterhin `node_modules`.
Der produktive iOS-Build gehört weiterhin zu Codemagic.

## Neuen Codemagic-Lauf starten

1. Diesen PR prüfen und erst danach in **`main`** übernehmen.
2. In Codemagic `Redion iPhone IPA (unsigniert)` öffnen.
3. **Neuen manuellen Build mit dem aktuellen `main`-Commit**
   starten. Das wiederholte Ausführen des **alten Commits**
   verwendet noch `esbuild@0.25` und scheitert erneut.
4. Kontrollieren: Schritt **„iOS-Projekt mit Capacitor 8 erzeugen“**
   beendet die npm-Installation ohne `ERESOLVE`; danach die
   folgenden Capacitor- und Xcode-Schritte prüfen.
5. Erst nach einem vollständigen erfolgreichen Build steht das
   Artefakt `build/ipa/Redion-unsigned.ipa` bereit.
   Die IPA ist weiterhin **unsigniert**.

## Web-/iOS-Parität und Daten

Die Änderung betrifft nur die **temporäre Build-Werkzeugkette
unter Codemagic** und einen Node.js-Regressionstest.

Nicht verändert wurden `index.html`, `www`-Quelle,
`src/`, `quell/`, CSS, die iOS-native Sicherungsbrücke,
die App-ID `ch.redurbabat.redion`, Swift-Dateien,
der Datenschutzschirm, die Web-PWA, der Offlinebetrieb
oder gespeicherte Notizen. Es gibt **keine Datenmigration**.

Die bestehende iPhone-App nicht löschen. Vor einem
Update eine externe `.redion`-Sicherung erstellen.

**Abnahmestand:** Der Versionskonflikt ist anhand des
vollständigen npm-Fehlertexts, der realen Lockdatei und des
Codemagic-Installationsbefehls nachvollzogen und in der
Konfiguration korrigiert. Ein kompletter neuer Codemagic-
oder Xcode-Build ist **noch nicht ausgeführt**;
andere Buildprobleme können daher erst danach sichtbar werden.
