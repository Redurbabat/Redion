---
name: redion-animationen
description: Animationen, Übergänge und Bewegung in Redion bauen oder verbessern — Federn, Phasen, Schlüsselbilder, Glas-Morphing, Zahlen, Schreibmaschine, Herzen, Wischen. Ideen aus „open-swiftui-animations" (Amos Gyamfi), übersetzt in Redions CSS/TypeScript. Verwenden, wenn Redur bessere Animationen, Übergänge, Effekte oder „wie beim Apple" will, oder wenn eine Bewegung in quell/schale/stil oder src/schale/bedienung geändert wird.
---

# Redion-Animationen

Redur, 2. November 2026: Er wollte die Skills aus
`github.com/amosgyamfi/open-swiftui-animations`. Dort gibt es keine Skills,
sondern SwiftUI-Beispiele **ohne Lizenz** — nach CLAUDE.md §57 kommt davon
**kein Code** in Redion. Dieser Skill nimmt nur die **Ideen** und sagt, wie
sie in Redion gebaut werden: im Browser, mit Redions eigenen Federn und
Marken. Er ist Redions eigener Text.

## 1. Zuerst lesen, was es schon gibt

Bevor eine Bewegung neu entsteht, nachsehen — Redion hat ein Bewegungssystem,
und eine zweite Kurve neben der ersten ist ein zweiter Katalog (§8):

| Was | Wo |
|---|---|
| Dauern und Kurven | `quell/schale/stil/grund.css`: `--motion-instant` 80 ms, `--motion-fast` 140, `--motion-normal` 200, `--motion-slow` 320; `--ease`, `--ease-enter`, `--ease-exit` |
| Federn (Touch Kit, E702) | `grund.css`: `--feder-druck`, `-knapp`, `-sanft`, `-lebhaft`, `-weich` mit je `…-dauer` (als `linear(…)`); in TS `RedionSpring` (`src/schale/bedienung/spring.ts`) mit `press`, `snappy`, `smooth`, `bouncy`, `gentle` |
| Druck auf Knöpfe | `press.ts` setzt `data-gedrueckt` — kein eigenes `:active{transform:scale()}` (test581 §8) |
| Schmuck an Orten | `src/schale/bedienung/motion.ts` (RedionMotion): Ordner, Regler, Licht, Buchstaben, Flüssig, Schalter, Karussell, Glas, Zahlen, Status, Ticket, Kugel, Glühfaden, Transport — je ein Wähler in `effects` |
| Weitere Bauteile | `src/schale/bedienung/`: `funkel`, `tropfen`, `linse`, `segment`, `lader`, `zustandsknopf`, `geste`, `kacheln`, `selection-flow`, `delete` (der zerfliessende Löschknopf, E709) |
| Glas | nur über die Marke `--glas-blur` unter `@supports` (test576); Liquid Glass nur im Glass Wheel, nicht in der Klassik (E757, test623) |

## 2. Die Regeln, die jede Bewegung hält

- **Nur `transform` und `opacity` bewegen.** Keine Breite, Höhe, `top`/`left`
  in einer Übergangsliste (test541, test590).
- **Weniger Bewegung gilt auf ZWEI Wegen:** `@media (prefers-reduced-motion:
  reduce)` UND `body[data-bewegung="ruhig"]` („Ruhige Darstellung"). Beides
  setzt die Bewegung, statt sie zu fahren. Endlos-Animationen stehen dann
  still.
- **Kein Hit-Target bewegt sich unter dem Finger** (test541): was wandert,
  ist eine Fläche dahinter, nicht der Knopf.
- **Die Federn aus `grund.css` nehmen, keine neuen `cubic-bezier` erfinden.**
  Eine eigene Kurve braucht einen Grund an Ort und Stelle (§39).
- **Zustandsregeln wiegen mindestens so viel wie die Grundregel** — kein
  `:where()` um `:hover`, `:active`, `:focus-visible` (§39, E720); ein
  gesperrter Knopf antwortet nicht (test596 §9).
- **Klassik bleibt Klassik** (E757): neue Glas- oder Lichteffekte gehören
  unter `body[data-schale="premium"]:where([data-ui-shell="glass-wheel"])`,
  ausser Redur sagt ausdrücklich etwas anderes.
- **Erst ein Wächter, der rot werden kann, dann der Bau** (§30, §55.2): Bild
  für Bild messen (`requestAnimationFrame`, Zwischenorte, Ankunft), nicht
  nur den Endzustand.
- **Bilder schicken** (§55.3): Rechner 1300 × 860 und Telefon 390 × 844,
  hell und dunkel; bei Bewegung zwei, drei Zwischenbilder.

## 3. Ideenkatalog: SwiftUI → Redion

Die Namen links sind die Beispiele aus dem SwiftUI-Projekt. Rechts steht, wie
dasselbe in Redion entsteht — und wo es passen würde.

| Idee (SwiftUI) | In Redion | Passender Ort |
|---|---|---|
| **Spring / StackedSpring / SlideWithSpring** | `--feder-…` als `transition-timing-function`, Dauer `--feder-…-dauer`; mit Wurf `RedionSpring.velocityTracker()` und `RedionSpring.solve` | Blätter, Docks, Karten, die aus einem Knopf wachsen (E713) |
| **PhaseAnimator** (Zustand A → B → C, je eine Kurve) | `@keyframes` mit Prozentstufen, ODER in TS eine Liste von Phasen, jede mit eigener Feder, über `element.animate()` nacheinander | Ladefolgen, „Gespeichert"-Bestätigung, Lernkarte umdrehen |
| **KeyframeAnimator / JumpAndFall** | `element.animate([...], {duration, easing:'linear(…)'})` mit getrennten Spuren für `translate`, `scale`, `rotate` (einzelne Eigenschaften, nicht ein `transform`) | Plakette, Stern, Lernerfolg (`--feder-lebhaft`) |
| **GlassEffectContainer-Morphing** (zwei Glasknöpfe verschmelzen) | der EINE Tropfenfilter (`tropfen.ts`, E712) nur während des Fliessens; in Ruhe kein Filter | Stift/Radierer im PDF-Studio, Werkzeuggruppen — nur Glass Wheel |
| **Symbol Effects** (bounce, pulse, variable color) | kurze Klasse am SVG-Zeichen aus `Register`, `--feder-druck`; `pulse` nur endlich (2–3×) | Glocke bei neuer Meldung, Herz „Gemerkt" (E719) |
| **CrossFadeNumericTransition / IncreaseDecrease** | RedionMotion „metric" (`prepareMetric`: Ziffernrollen `rmo-digit`) | Zähler im Lernzentrum, Seitenzahl, Zoom-Prozent |
| **TypingErasing / Thinking** (Schreibmaschine, Cursor) | Text per `textContent` Zeichen für Zeichen, Cursor als `::after` mit `steps()`; bei weniger Bewegung sofort ganzer Text; `aria-live` nur einmal mit dem fertigen Satz | KI-Antwort „denkt nach", Platzhalter |
| **Moving Border mit dashPhase / Marching Ants** | SVG `stroke-dasharray` + `stroke-dashoffset` animiert | Lasso-Auswahl im PDF, Auswahl im Schaltplan, Ziehen-Ziel |
| **Animated Signature** (trim: zeichnen und löschen) | `stroke-dasharray = Länge`, `stroke-dashoffset` von Länge auf 0 | Unterschrift-Vorschau, Strichprobe (E623), Glühfaden |
| **PulsingHearts / EmotionalReactions / XLike** | einmaliges Aufspringen `--feder-lebhaft` + 3–6 kleine Teilchen über `transform`; danach entfernt | Herz in der Lernzentrale (E719), Reaktion auf Kommentar |
| **SlideToUnlock / SlideToCancel / WhatsAppPushToTalk** | Ziehen mit Pointer-Events, Gummiband `RedionSpring.rubberbandClamp`, Loslassen → Feder zurück oder Auslösen | gefährliche Aktionen am Telefon statt Ja/Nein, Aufnahme |
| **3D Rotation / FlipXYZ / FlipCharacters** | `rotateX/Y` mit `perspective` am Elternteil, `backface-visibility:hidden` | Lernkarte Vorder-/Rückseite, Ziffernwechsel |
| **HueRotation / Gradient-Slide** | `filter: hue-rotate()` NUR auf Zierflächen, nie auf Text oder Signalfarbe (test584) | KI-Kugel, Ladebalken |
| **Mask / clipShape** | `clip-path` (`inset()`/`circle()`) animiert, Inhalt bleibt im DOM | Aufdecken einer Lösung, Bild-Vergleich |
| **Ease-in / Ease-out / Linear** (How Things Move) | `--ease-enter` für Hereinkommen, `--ease-exit` für Gehen, `linear` nur für Dauerläufe (Fortschritt, Uhr) | überall — die häufigste Fehlerquelle ist eine falsche Richtung |
| **Emitter / Fireworks / Weihnachten** | Leinwand (`<canvas>`) nur auf ausdrücklichen Wunsch, einmalig, mit Ende; bei weniger Bewegung gar nicht | Prüfung bestanden — sparsam (§39: „Animationen sparsam") |

## 4. Ablauf

1. Redur fragen, **wo** die Bewegung hin soll, wenn er es nicht sagt — eine
   Liste von zwei, drei Orten aus der Tabelle oben anbieten.
2. Code und Doku des Orts lesen (§45 Schritt 1), den zuständigen Wächter
   finden (`grep` nach dem Wähler unter `pruefungen/lauf/`).
3. Wächter schreiben oder erweitern, rot sehen.
4. Bauen: Marken aus `grund.css`, Klasse oder RedionMotion-Effekt (ein Eintrag
   in `effects`, nicht ein Sonderfall irgendwo).
5. `npm run bauen:ts`, `npm run stand`, `node bauen.mts`.
6. Nachbarn fahren: mindestens `test541`, `test576`, `test581`, `test584`,
   `test623` und den Lauf des Orts.
7. Bilder machen und schicken; Entscheidung in `ENTSCHEIDUNGEN.md`, Zeile in
   `version.md`/`version.json` (Redur: „nichts ohne dokumentieren").
