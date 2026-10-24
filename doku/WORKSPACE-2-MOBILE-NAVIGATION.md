# Redion Workspace 2.0 – Mobile Navigation: Zielvorschau

**Stand:** 24. Oktober 2026 · Eigenständiger Produkt-PR zu Issue #134.

## Sichtbare Änderung

Redion besitzt bereits eine aufwendig ausgearbeitete Fünf-Wege-Leiste
und die Touch-Kit-Zielleiste (`SelectionFlow.ziehbar`,
`Register.navigation.ziele`). Bisher waren fünf Ziele in einem
60 px hohen Glasstreifen verteilt; ihre Schrift musste bei
390 px Bildschirmbreite 10,5 px klein und teilweise gekürzt sein.

Beim **Hochziehen** erscheint nun zusätzlich **über** dem bestehenden
Glasstreifen eine schmale, deckende Bezeichnung des aktuell anvisierten
Ziels:

```text
      ┌─────────────────────────┐
      │        Dokumente        │
      │       Meine Ablage      │  ← vollständiger Name
      └─────────────────────────┘
      ╭─────────────────────────╮
      │  ▢    ◷    ♡    ▤    ▥  │  ← Original-Ziele
      │ Meine Zuletzt Favor… PDF │
      ╰─────────────────────────╯
      ╭─────────────────────────╮
      │ Dokumente Heute Lernen… │  ← ursprüngliches Dock
      ╰─────────────────────────╯
```

- Beim Wechsel zwischen Zielen folgt die Vorschau dem Finger und
  schreibt **den vollständigen Namen aus dem vorhandenen Register**,
  nicht noch eine zweite, möglicherweise falsche Zieltabelle.
- Auf den ursprünglichen fünf Zielen bleiben die kurzen sichtbaren
  Namen und alle Trefferkoordinaten exakt erhalten.
- Die Vorschau ist **nicht klickbar**, erzeugt weder neue Listener
  noch einen zweiten Navigationsweg und verschwindet beim Loslassen,
  Abbrechen oder Wechseln des Reiters.
- Am oberen Rand der ursprünglichen Leiste sitzt ein dezenter,
  rein visueller Hochzieh-Griff. Er verändert keine Hitbox und zeigt
  auch bei geschlossener Zielleiste an, dass eine Geste verfügbar ist.
- Die `menuitem`-Knöpfe tragen für VoiceOver jetzt immer
  `aria-label` mit dem **vollen Namen**, unabhängig von der gekürzten
  sichtbaren Form.

## Unverhandelbarer Bedienvertrag

**Normaler Tap:** wechselt exakt wie bisher direkt zum Reiter; keine
Zielleiste. **Langes Halten:** öffnet die Zielleiste nicht.
**Aufwärtsziehen:** öffnet die bisherige Zielleiste; der Finger
wechselt das Ziel, Loslassen wählt höchstens einmal.

Dasselbe `SelectionFlow`- und `Register.navigation`-System wie
vorher. Kein Routing-Rewrite, keine zweite Dockleiste im Ruhezustand,
keine Datenbankänderung.

## Optik, Barrierefreiheit und Performance

- Farben nur aus Redions Themenvariablen, egal ob hell, dunkel,
  Papier, Wald oder hohem Kontrast.
- Vorschau **deckend** (`--bg-card`), damit ein voller Name vor
  unruhigen Dokumenten lesbar bleibt.
- `pointer-events:none` und `aria-hidden=true`, während die
  Original-`menuitem`-Knöpfe volle Screenreader-Beschriftungen haben.
  VoiceOver wird so nicht bei jeder Bewegung zugespammt.
- Die Vorschau liegt mit `position:absolute` **außerhalb**
  des festen Zielleisten-Kastens. Sie beeinflusst weder dessen
  60-px-Höhe noch die mit `offsetLeft/offsetWidth` berechneten
  Spalten und Finger-Hitboxen.
- Ihre einzigen CSS-Übergänge verwenden `opacity` und
  `transform`. `prefers-reduced-motion` und Redions
  `data-bewegung="ruhig"` deaktivieren auch diese Übergänge.
- Keine neue Bibliothek, kein Intervall, keine dauernde Animation,
  kein Web-API- oder Netzwerkzugriff.

## Prüfungen

```powershell
npm ci
npm run bauen:ts
npm run typecheck
node pruefungen/lauf/test614.mts
node pruefungen/lauf/test614.mts --capture
```

In `test614.mts` werden zusätzliche Prüfpunkte an **echte
Chromium-Touch-Ereignisse** angeschlossen:

- In Ruhe ist keine Zielvorschau sichtbar.
- Beim Ziehen wird der vollständige Name **aus dem Register**
  angezeigt; die aktive Schaltfläche hat denselben
  `aria-label`-Namen.
- Die Vorschau liegt oberhalb der originalen, unveränderten
  60-px-Zielleiste und fängt keine Touch-Ereignisse ab.
- Beim Loslassen verschwindet sie; der echte Zielwechsel
  geschieht weiterhin **genau einmal**.
- Die bestehenden rund 100 Gesten-/Tastatur-/Kontrast-/Motion-
  Prüfungen aus Suite 614 bleiben bestehen.

**Screenshots:** mit `--capture` entstehen
`bilder/workspace-2/mobile-nav/390-hell-untere-leiste.png` und
`390-hell-zielvorschau.png`, jeweils aus der echten App mit den
Prüfdaten der Suite. Die Bilder sind Arbeitsmaterial, keine
Nutzerdokumente und keine Design-Mockups.

**Teststatus:** Quellcode, generiertes JavaScript, CSS und neue
Regressionstests sind erstellt. Eine vollständige Ausführung von
TypeScript, Chromium, WebKit oder Codemagic in dieser Sitzung ist
nicht nachgewiesen. GitHub Actions hat bei der vorherigen
Workspace-Änderung keine Runner gestartet (0 Steps); dies kann
auch hier eine CI-Abnahme blockieren.

## Website, iOS und Sicherheit

Die Änderung liegt nur in der gemeinsamen Weboberfläche:
`src/schale/aufbau/tab-shelf.ts`,
`quell/schale/aufbau/tab-shelf.js` und
`quell/schale/stil/bausteine.css`.

Website und iOS verwenden diese **identischen Dateien aus
demselben Commit**. Die Website braucht keinen nativen Adapter
und die iOS-App kein neues Plugin. Browser/Offline/PWA/`file://`
und IndexedDB bleiben unberührt.

**Wichtig:** Die bereits installierte Redion-IPA ändert sich nicht
durch einen PR. Vor einem iOS-Update eine externe `.redion`-
Sicherung machen, die bestehende App **nicht deinstallieren** und
dieselbe App-ID und Signieridentität beibehalten. Vor dem Release
unbedingt am echten iPhone testen, dass die Zielvorschau nicht
mit einem iOS-Systemelement kollidiert.
