# Redion iPhone – Mehrfinger-Wischen und nahtlose Bereichswechsel

**Stand:** 25. Oktober 2026 · Folgearbeit nach PR #149. Implementiert in der bestehenden gemeinsamen Redion-Navigation, kein zweites iPhone-UI.

## Behobene Interaktionsfehler

Redions `Wischen` bewegt beim horizontalen Ziehen den bestehenden
`#scroll`-Bereich per `transform` und wechselt beim Loslassen wie
bisher über den **vorhandenen Tab-Knopf**. Drei Randfälle verhinderten
bislang ein zuverlässig natives Gefühl:

1. **Zweiter Finger während eines laufenden horizontalen Ziehens:**
   Vorher wurde nur die Fingerkennung gelöscht, während der Inhalt
   möglicherweise seitlich verschoben blieb. Jetzt wird über das
   bestehende `loslassen()` auch die Verschiebung zurückgesetzt.
   Ein abgebrochener Mehrfinger-Zug löst keinen Tabwechsel aus.
2. **Abbruch eines fremden Pointers:** Früher beendete jedes
   `pointercancel` die aktuelle Geste. Jetzt wird nur das Ereignis
   des tatsächlich erfassten Fingers verarbeitet. Andere Finger und
   fremde Pointer können die bestehende Bewegung nicht abbrechen.
3. **Schnell aufeinanderfolgende Bewegungen:** Ein Timer, der nach
   einem früheren Zug die `transition` zurücksetzte, konnte in einer
   neuen Bewegung die deaktivierte Transition überschreiben und den
   Inhalt der Hand hinterherziehen lassen. Eine Generation-ID schützt
   davor. Die Feder endet weiterhin im normalen Fall automatisch.

**Unverändert:** Mindestweg und Richtung der Bereichsgeste, iPhone-
Systemrand, horizontales Scrollen in Tabellen, Stift- und PDF-Flächen,
Befehlsrouter sowie die TabShelf-Zielleiste. Letztere öffnet weiterhin
**nur durch Hochziehen**, nicht beim Antippen.

## Quellen und Auslieferung

Die Änderung liegt in `src/schale/aufbau/wischen.ts`, mit synchronisiertem
`quell/schale/aufbau/wischen.js` für Web, `file://`, PWA und Capacitor.
Es gibt keine neue Bibliothek und keine Änderung an der
Capacitor-App-ID `ch.redurbabat.redion`, `ios/`-Quellen,
`build/ios-capacitor/`, Datenschutzschirm, Backups, IndexedDB,
Cloud-Sync, Offlineverhalten oder Dokumentformaten.

## Automatische Prüfungen

```sh
node --test pruefungen/wischen-multitouch.test.mjs
npm run bauen:ts
npm run typecheck
node pruefungen/lauf/test484.mts
```

Der neue isolierte Test lädt **das tatsächlich ausgelieferte**
`quell/schale/aufbau/wischen.js` in eine VM, um fünf Fälle mit
synthetischen Pointer-Ereignissen zu prüfen: Zweitfinger-Abbruch,
fremder Pointer-Abbruch, aktiver Pointer-Abbruch, normales Tippen und
schnelle neue Geste vor Auslaufen des alten Feder-Timers. Der Test
läuft im iOS-GitHub-Actions-Workflow sowie vor dem IPA-Bau in Codemagic.

**Im aktuellen Arbeitslauf ausgeführt:** Fünf äquivalente synthetische
Interaktionsprüfungen direkt auf dem über den GitHub-Connector aus
diesem Branch gelesenen generierten JavaScript, alle fünf bestanden.

**Nicht durchgeführt/bestanden bestätigt:** vollständiger
`npm run bauen:ts`, TypeScript-Typecheck, vollständiger
Playwright-`test484`, Xcode-/SPM-/Codemagic-Build, WebKit-
Gestentest auf 390×844/430×932 sowie physische iPhone-Gesten- und
Offlineprüfung. Die hinzugefügten CI-Tests müssen noch auf GitHub
bestanden werden.

## Manuelle iPhone-Abnahme

1. Vor Geräteinstallation externes `.redion`-Backup erstellen und
   überprüfen. **Vorhandene App nicht deinstallieren.**
2. Im Hauptbereich horizontal ziehen, während die Seite folgt;
   vor dem Loslassen zweiten Finger auflegen. Der Inhalt muss in
   die normale Position zurückkehren, ohne ein Ziel zu öffnen.
3. Mit genau einem Finger nach links und rechts zwischen Hauptzielen
   wischen, auch mehrfach schnell nacheinander. Die Ansicht darf
   nicht hängen oder verzögert nachziehen.
4. Normales Antippen der unteren Hauptnavigation weiter prüfen.
   Die zusätzliche Zielleiste darf **ausschließlich beim Hochziehen**
   erscheinen.
5. Horizontal scrollbare Listen, mehrseitiges PDF, Handschrift,
   ruhige Darstellung und `prefers-reduced-motion` gegenprüfen;
   dabei dürfen keine ungewollten Bereichswechsel auftreten.
6. Privacy Shield im App-Umschalter, Datei-/Backup-Export,
   Offlinezugriff und unveränderte Notizen überprüfen.

Der PR bleibt zur manuellen Prüfung offen; weder Merge noch
Veröffentlichung werden hier automatisch durchgeführt.
