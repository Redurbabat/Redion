# Touch Kit

Handy-artige Bauteile, Federn und Gesten für React 19 — gebaut mit CSS und wenig TypeScript,
ohne Laufzeit-Abhängigkeiten ausser React. Demo: `app/touch.html` (`npm run dev`, dann
`/touch.html`).

## In ein anderes Projekt übernehmen

1. Ordner `app/src/touch/` kopieren (er importiert nichts von ausserhalb).
2. Einmal im Einstieg der App: `import './touch/touch.css'`.
3. Einen Bereich mit `className="ui-touch-root"` markieren (folgt Hell/Dunkel des Systems) oder
   `data-ui-theme="light" | "dark"` setzen, um ein Thema zu erzwingen.
4. Bauteile und Helfer aus `./touch` importieren.

## Bausteine

| Datei | Inhalt |
| --- | --- |
| `tokens.css` | Farben (hell/dunkel über `light-dark()`), Abstände, Rundungen, Tiefe, Schrift, Dauern, Kurven |
| `motion-tokens.css` | **generiert**: Federn als CSS-`linear()`-Kurven, `--ui-spring-<name>` + `--ui-spring-<name>-duration` |
| `base.css` | Themen-Bereich `.ui-touch-root`, `data-ui-theme`, Hilfsklassen |
| `motion/spring.ts` | Feder-Physik (analytisch), Dauer+Bounce → Steifigkeit/Dämpfung, Feder → `linear()` |
| `motion/animateSpring.ts` | Feder auf `requestAnimationFrame`, unterbrechbar (`retarget` behält Tempo) |
| `motion/presets.ts` | benannte Federn: `press`, `snappy`, `smooth`, `bouncy`, `gentle` |
| `icons/Glyph.tsx` | eigene, schlichte Glyphen (Chevron, Plus, Herz, Stern, Play …), immer `aria-hidden` |
| `internal/usePress.ts` | Druck-Zustand `data-pressed` für Zeiger und Tastatur — Grundlage der Druck-Feder |

### Bauteile (Schritt 2)

| Datei | Inhalt |
| --- | --- |
| `components/Button.tsx` | `Button` (gefüllt, getönt, grau, schlicht, Glas; gross/mittel/klein; Kapsel/rund), `IconButton` (Name Pflicht) |
| `components/Toggle.tsx` | Schalter mit federndem Knopf, der sich beim Drücken dehnt |
| `components/Segmented.tsx` | Segment-Umschalter, Auswahl gleitet mit Feder; Pfeiltasten |
| `components/Stepper.tsx` | − / Wert / +, Wert rollt wie ein Zählwerk, Halten wiederholt |
| `components/Slider.tsx` | Regler auf Basis von `<input type="range">`, Daumen wächst beim Halten |
| `components/Chip.tsx` | `FilterChip` (an/aus), `RemovableChip` (Entfernen per Knopf oder Rück-/Entf-Taste) |
| `components/Badge.tsx` | Zähler-Plakette (`99+`), springt bei neuen Werten auf; `BadgeAnchor` für Symbole |
| `components/List.tsx` | `List` + `ListRow` wie ein Einstellungs-Bildschirm, Zeilen erscheinen gestaffelt |
| `components/Card.tsx` | Karte mit Druck-Feder und leichter 3D-Neigung zum Zeiger |
| `components/Cover.tsx` | Album-Cover, das bei Pause kleiner wird und bei Wiedergabe zurückfedert |
| `components/ActivityIndicator.tsx`, `ProgressBar.tsx`, `Skeleton.tsx` | Laden: Speichen-Kreisel, Fortschritt (auch unbestimmt), Platzhalter mit Schimmer |
| `components/SymbolSwap.tsx` | Zeichenwechsel, die hereindrehen (z. B. `PlayPauseButton`) |
| `components/FavoriteButton.tsx` | Herz / Stern, das beim Markieren aufspringt |
| `components/DeleteButton.tsx` | Löschen in zwei Schritten: der Kreis fliesst in „Löschen“ + „Abbrechen“ (siehe unten) |

### Overlays & Gesten (Schritt 3)

| Datei | Inhalt |
| --- | --- |
| `components/Sheet.tsx` | Sheet mit Rastpunkten (`small`/`medium`/`large`, Anteil oder px), folgt dem Finger, Gummiband, Wisch-Tempo entscheidet; Seite dahinter weicht zurück; weicht der Bildschirmtastatur aus |
| `components/ActionSheet.tsx` | Aktionsblatt in Gruppen mit abgesetztem „Abbrechen“ |
| `components/Dialog.tsx` | Warn-Dialog (`alertdialog`), zwei Knöpfe nebeneinander, ab drei gestapelt |
| `components/Popover.tsx` | `Popover`, `Menu` und `ContextMenu` (langes Drücken, Rechtsklick, Shift+F10) — wachsen aus dem Anker |
| `components/Toast.tsx` | `ToastProvider` + `useToast()`: fällt federnd ein, stapelt sich (max. 3), pausiert bei Hover/Fokus, nach oben wegwischen |
| `components/SwipeActions.tsx` | Wisch-Aktionen für Zeilen (auch direkt über `ListRow swipe={…}`), Voll-Wisch löscht |
| `components/PullToRefresh.tsx` | Ziehen zum Aktualisieren mit Speichen, die nacheinander erscheinen |
| `overlay/*` | `useModal` (Escape, Fokus hinein/halten/zurück, Rest der Seite `inert`, Scroll-Sperre), `Portal`, `usePresence` (Ausblend-Animation), `placePopover` |
| `gesture/*` | reine Rechen-Helfer, alle getestet: Geschwindigkeit, Gummiband, Schwung-Projektion + Rastpunkt-Wahl, Richtungs-Sperre, Wisch-Schwellen, Sheet-Geometrie, Pull-Offset |

### Navigation & Übergänge (Schritt 4)

| Datei | Inhalt |
| --- | --- |
| `navigation/Navbar.tsx` | Leiste mit grossem Titel, der beim Scrollen hineinschrumpft und einrastet; Zurück-Knopf, Aktionen, `headingLevel` |
| `navigation/SearchBar.tsx` | Suchfeld (`role="search"`), „Abbrechen“ gleitet herein, Escape leert und verlässt |
| `navigation/TabBar.tsx` | Tab-Leiste (`bar` / `floating`) mit wanderndem, dehnbarem Material — auch mit dem Finger ziehbar |
| `navigation/NavigationStack.tsx` | Seiten-Stapel: Push/Pop mit Parallaxe und Schatten, Wischen zurück vom linken Rand, Fokus + Ansage |
| `navigation/viewTransition.ts` | `transitionPage(update, 'push' \| 'pop' \| 'fade', { scope })` — Seitenwechsel per View Transitions; Ecken des Scopes über `--ui-touch-vt-radius` (sonst sein `border-radius`); eigene benannte Elemente laufen mit `var(--ui-touch-vt-duration)` / `var(--ui-touch-vt-easing)` im Takt mit |
| `components/NowPlaying.tsx` | Mini-Player → Vollbild als ein Weg (FLIP), Cover kleiner bei Pause, nach unten ziehen schliesst |
| `motion/flip.ts`, `gesture/navigation.ts` | FLIP-Rechnung; Einklapp-Fortschritt, Titel-Dehnung, Einrasten, Material-Dehnung |

### Glas (Schritt 5)

| Datei | Inhalt |
| --- | --- |
| `glass/Glass.tsx` | `GlassSurface`, `GlassButton`, `GlassBar` (Toolbar mit Pfeiltasten) — Lichtbrechung am Rand in Chromium, sonst Milchglas, bei „Transparenz reduzieren“ fest |
| `glass/field.ts`, `glass/filter.ts` | Verschiebungskarte (Abstandsfeld + Kreisbogen-Kante) und SVG-Filter (Linse mit negativer Stärke) |
| `glass/useGlassRefraction.ts`, `glass/support.ts` | Karte backen (Pixel-Budget), Filter anmelden/entfernen; Erkennung, ob der Browser brechen kann |

### Webseite, Skill und Praxistests (Schritt 6)

| Datei | Inhalt |
| --- | --- |
| `components/List.tsx` | `ListRow selected` (Häkchen + `aria-pressed`, für Auswahl-Listen, z. B. im Sheet); Wisch-Aktionen heissen für Screenreader „Löschen: <Titel>“ |
| `components/SwipeActions.tsx` | Aktionen nach der Zeile (DOM- und Tab-Reihenfolge), `context` für den Namen; abgebrochene Gesten löschen nie; nach dem Löschen per Tastatur bleibt der Fokus in der Liste |
| `components/PullToRefresh.tsx` | `ref` auf den Scroll-Bereich und `header` (z. B. die Navbar): grosser Titel, Suche und Ziehen zum Aktualisieren auf einem Bildschirm |
| `components/PullToRefresh.tsx` | `refreshing` für Aktualisieren, das die App selbst startet (Knopf „Aktualisieren“): derselbe Kreisel in Halteposition, `aria-busy`, dieselbe Ansage wie beim Ziehen; Ziehen ruht solange. Überlappt es ein Ziehen, wird einmal angesagt und erst zurückgefedert, wenn beide fertig sind |
| `navigation/NavigationStack.tsx` | `popToRoot()`: in einem Schritt zurück zum ersten Bildschirm — die oberste Seite gleitet hinaus, die dazwischen fallen ohne eigene Bewegung weg; Fokus und Ansage wie nach `pop()` |
| `navigation/NavigationStack.tsx` | Ein Bildschirm behält seine `render`-Funktion vom Push und ist memoisiert: Werte, die sie eingefangen hat, bleiben alt — wechselnde Daten im Bildschirm über Kontext oder Hooks lesen (`render` läuft als eigene Komponente) |
| `components/Dialog.tsx`, `ActionSheet.tsx` | je Knopf `hint` (zweite Zeile, als Beschreibung gelesen) und `buttonProps` (`id`, `data-*`) |
| `components/Toast.tsx`, `useToast.ts` | Toast-Bereich trägt das Seitenthema auch ausserhalb der Wurzel; Hook und Kontext eigenes Modul (Hot Reload) |
| `icons/Glyph.tsx` | 39 eigene Glyphen (neu u. a. `gear`, `house`, `person`, `calendar`, `clock`, `shuffle`, `repeat`), Liste `glyphNames`; `TabBar` nimmt auch eigene Symbole |
| `motion/reducedMotion.ts`, `base.css` | App-eigener Schalter für weniger Bewegung: `data-ui-motion="reduce"` auf `<html>` |
| `overlay/Portal.tsx`, `overlay/pageTheme.ts` | Overlays in `<body>` tragen das Thema der Kit-Wurzel, aus der sie kommen; kein Aushängen unter StrictMode |
| `internal/useMergedRef.ts` | ein Ref-Zusammenführer mit React-19-Aufräumen (Glas, Pull-to-Refresh, Tab-Leiste) |

### Löschen in zwei Schritten (`DeleteButton`)

```tsx
<DeleteButton context="Nachtfahrt" onDelete={() => remove(id)} />               // allein: wächst zum Textende (LTR nach rechts)
<ListRow title="Nachtfahrt" trailing={<DeleteButton expand="start" context="Nachtfahrt" onDelete={…} />} />
```

- **Ablauf:** runder Knopf mit Papierkorb (44 px). Drücken → der Kreis fliesst wie eine Flüssigkeit in zwei
  Kapseln: „Löschen“ wächst aus dem Kreis (das Symbol rückt an den Kapsel-Anfang und verschwimmt, das Wort
  erscheint unscharf daneben und wird scharf), „Abbrechen“ quillt daneben heraus,
  ein Hals verbindet beide kurz und reisst. „Abbrechen“ fliesst zurück in den Kreis. Vorbild: ein Video von Redur
  (siehe `HERKUNFT.md`).
- **Aufbau (nur `transform`/`opacity`):** unten eine Ebene mit einem **statischen** SVG-Goo-Filter
  (`feGaussianBlur` σ 4 → `feColorMatrix` Alpha × 18 − 7 → Haarlinie + weicher Schatten per `feDropShadow`).
  Jede Kapsel sind drei Teile: zwei 44-px-Kreise, die nur verschoben werden, und ein Mittelstück, das nur in X
  gestreckt wird — kein Radius verzerrt. Geschlossen liegen alle Teile im Kreis (die zweite Kapsel als halb so
  grosser Kreis darin), offen stehen zwei Kapseln mit 8 px Abstand; unterwegs kommen sich die Kreise nahe, und
  der Filter zeichnet den Hals. Darüber die echten Knöpfe auf der offenen Geometrie; die Wörter wechseln von
  einer statisch unscharfen Kopie (nur deren Deckkraft animiert) zur scharfen. Öffnen: Feder `bouncy`,
  Schliessen: `snappy`; die Flüssigkeit schwillt dabei kurz an.
- **Kein Layout-Sprung:** der Knopf bleibt 44 × 44; das Paar ist ein Overlay am Kreis (liegt über Nachbarn).
  Breiten aus den gemessenen Wörtern (mind. 88 px). `expand="start"` am Zeilenende; RTL spiegelt beides.
- **Bedienung:** `aria-expanded` + `aria-controls`; Öffnen setzt den Fokus auf „Abbrechen“; Tab zwischen den
  Kapseln; Escape, Fokus weg, Tipp daneben oder ein zweites Auslösen des runden Knopfs (Screenreader) schliessen.
  „Löschen“ ruft `onDelete` genau einmal; entfernt die App die Zeile, geht der Fokus zur nächsten
  (`internal/keepFocusInList.ts`, geteilt mit `SwipeActions`). „Löschen“ liegt dort, wo der Kreis war — ein
  Doppelklick auf den Kreis löscht trotzdem nie (nach einem Zeiger-Klick ist die Bestätigung erst nach 400 ms
  scharf). `context` → „Löschen: Nachtfahrt“ für Screenreader.
- **Zustände:** Hover rosa (Kreis, „Löschen“) bzw. grau („Abbrechen“), nur wo es Hover gibt; Druck sinkt ein;
  Fokusring je Knopf; `disabled`; dunkel auf `--ui-color-surface-raised`, Rot = `--ui-color-danger`;
  erzwungene Farben: umrandete Knöpfe ohne Filter; weniger Bewegung (System oder `data-ui-motion`): kein Morph,
  das Paar blendet über dem Kreis ein.
- **Regel:** Jeder Lösch-Knopf ist ein `DeleteButton`. In Listen ergänzt er das Wischen (bleibt als zweiter Weg);
  grosse Löschungen behalten zusätzlich den Rückgängig-Toast; Löschen in einem Menü, ActionSheet oder Dialog
  bleibt dort.

## Wo man es sieht und wie andere Projekte es bekommen

- **Bibliothek** (`app/index.html` → Kategorie „Touch Kit“): jedes Bauteil live, daneben der kopierbare
  React-Code — die echte Quelle der Vorschau aus `app/src/touch-showcase/previews/` — und sein CSS;
  dazu das Rezept „App-Rahmen“ für einen ganzen Bildschirm.
- **Demo** (`app/touch.html`): alle Bauteile und Bewegungen mit Erklärung, hell/dunkel, Bewegungs-Übersicht.
- **Claude-Skill** (`.claude/skills/touch-kit/`): bringt Claude bei, in jedem Projekt mit dem Kit zu bauen.
  `tools/install-touch-kit.sh <projekt>` kopiert Kit + Skill (beides im Projekt committen), `--user`
  installiert den Skill nur für Claude Code auf diesem Rechner. Die API-Referenz im Skill wird aus diesem
  Ordner erzeugt (`npm run skill`) und enthält genau, was `index.ts` exportiert, alle Typen eingeschlossen;
  ein Test schlägt an, wenn sie veraltet oder ein exportierter Typ fehlt, und alle Rezepte im Skill
  werden gegen das Kit typgeprüft (auch unter strengen Flags).
- **Prüfen**: `npm run audit:ui` (Namen, 44 px, Escape, Thema der Overlays; `npm run test:audit` prüft das
  Werkzeug selbst) und `npm run screenshots` (alle Breiten, hell/dunkel). Das Prüfwerkzeug liegt im Skill
  (`.claude/skills/touch-kit/scripts/audit.mjs`) und kommt so mit in jedes Projekt: dort
  `node .claude/skills/touch-kit/scripts/audit.mjs --url=http://127.0.0.1:5173 --page=/`.

## Regeln (werden getestet)

- Klassen und Keyframes `ui-touch-*`, CSS-Variablen `--ui-*` — `conventions.test.ts`.
- Bewegung nur über `transform`/`opacity` (+ Farbwechsel); kein `transition: all`.
- Jede Datei mit Animation hat einen `prefers-reduced-motion`-Block.
- Farbpaare erfüllen Kontrast-Mindestwerte in Hell und Dunkel — `tokens.test.ts`.
- Strenges TypeScript: der Kit kompiliert mit `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` und
  `noImplicitReturns`; optionale Props öffentlicher Typen nehmen `undefined` an (`name?: T | undefined`), damit
  `prop={vielleicht}` auch in strengen Projekten kompiliert — `apiConventions.test.ts`.
- Federn ändern: `motion/presets.ts` anpassen, dann `npm run tokens`.
