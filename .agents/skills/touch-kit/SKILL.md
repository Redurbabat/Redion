---
name: touch-kit
description: Baut handy-artige Oberflächen (iPhone-/iOS-Gefühl, Apple-ähnliche Bewegung) in React-Webseiten mit dem Redurbabat Touch Kit — Knöpfe mit Druck-Feder, Schalter, Segmente, Stepper, Regler, Chips, Plaketten, Listen mit Wisch-Aktionen, Sheets mit Rastpunkten, Action Sheets, Dialoge, Menüs, Toasts, Pull-to-Refresh, Navbar mit grossem Titel, Suchfeld, Tab-Leiste, Navigations-Stapel mit Wischen zurück, Mini-Player, Seitenwechsel per View Transitions und Liquid Glass. Verwenden, sobald in einem Redurbabat-Projekt (STRAN, BABAT RED, Redion …) oder irgendeiner React-Webseite UI gebaut oder überarbeitet wird, jemand „wie iPhone“, „wie Apple“, „mobile“, „Sheet“, „Tab-Leiste“, „Glas“, „Feder/Animation“ oder „Touch Kit“ sagt, oder Bewegung, Barrierefreiheit (44 px, Escape, reduzierte Bewegung) oder Design-Tokens gefragt sind.
---

> **Redion-Kontext: NUR REFERENZ.** `app/src/touch/` ist nicht installiert. Aus dem Ursprung stammende `rm -rf`-, Installations- und Kopierbefehle NICHT in Redion ausführen. Zuerst `fremd/touch/`, Redion-Regeln und Tests prüfen.


# Touch Kit — handy-artige Oberflächen für jede React-Webseite

Das Touch Kit ist ein **kopierbarer Ordner** (`app/src/touch/` im Repo
[Redurbabat/UI-Kit](https://github.com/Redurbabat/UI-Kit)): React 19 + TypeScript + reines CSS,
**keine Laufzeit-Abhängigkeit ausser React**. Er übernimmt, *wie* iOS sich bewegt und bedient
(Federn, Gesten, Rastpunkte), aber **nicht** Apples Marke, Symbole oder Schriften.

- Live-Katalog mit kopierbarem Code: `app/index.html` → Kategorie **Touch Kit** (im Repo `npm run dev`).
- Demo aller Bauteile und Bewegungen, hell/dunkel: `app/touch.html`.
- Vollständige API (automatisch erzeugt): [reference/components.md](reference/components.md).
- Alle Design-Tokens mit Werten: [reference/tokens.md](reference/tokens.md).

## 1. Kit ins Projekt holen (einmal pro Projekt)

Voraussetzungen: React 19, TypeScript, ein Bundler, der `import './x.css'` kann (Vite, Next, Parcel …).

```bash
# im Projekt-Root: Kit nach src/touch holen (nur dieser Ordner wird geladen)
git clone --depth 1 --filter=blob:none --sparse https://github.com/Redurbabat/UI-Kit.git /tmp/ui-kit
git -C /tmp/ui-kit sparse-checkout set app/src/touch
rm -rf src/touch && cp -r /tmp/ui-kit/app/src/touch src/touch
# ohne Vitest im Projekt: Tests und Test-Helfer entfernen (sie brauchen vitest + node-Typen)
find src/touch -name '*.test.ts' -o -name '*.test.tsx' | xargs rm -f; rm -rf src/touch/test
```

Aktualisieren = dieselben Befehle erneut. **Nie im Kit-Ordner von Hand ändern** — Änderungen gehören
ins UI-Kit-Repo (dort getestet), sonst gehen sie beim nächsten Update verloren.

## 2. Einbinden

```tsx
// src/main.tsx (einmal)
import './touch/touch.css'
```

```tsx
import { useState } from 'react'
import { Button, ToastProvider } from './touch'

export function AppShell() {
  const [count, setCount] = useState(0)
  return (
    // .ui-touch-root folgt Hell/Dunkel des Systems; data-ui-theme="light" | "dark" erzwingt ein Thema.
    <div className="ui-touch-root">
      <ToastProvider>
        {/* data-ui-sheet-background: diese Fläche weicht zurück, wenn ein Sheet ganz offen ist */}
        <main data-ui-sheet-background="">
          <Button onClick={() => setCount((c) => c + 1)}>Gedrückt: {count}</Button>
        </main>
      </ToastProvider>
    </div>
  )
}
```

Alles wird aus `./touch` importiert (`touch/index.ts` exportiert jedes Bauteil und jeden Helfer).

## 3. Regeln — immer einhalten

1. **Bewegung nur über `transform`, `opacity`, `scale`.** Nie `width/height/top/left/margin` animieren,
   nie `transition: all`. Federn: `var(--ui-spring-snappy)` + `var(--ui-spring-snappy-duration)` usw.
2. **`prefers-reduced-motion` immer beachten.** Jede Datei mit Animation hat einen
   `@media (prefers-reduced-motion: reduce)`-Block mit ruhiger Alternative (Überblenden statt Gleiten);
   JS-Federn bekommen `reducedMotion` (Hook `useReducedMotion()`).
3. **44 × 44 px Mindest-Trefferfläche** für Hauptknöpfe (kleinere Optik → unsichtbare `::after`-Fläche).
4. **Jeder Knopf hat Text oder `aria-label`.** `IconButton` verlangt `label`.
5. **Escape schliesst jedes Overlay.** Eigene Overlays über `useModal` bauen (Escape, Fokus, `inert`).
6. **Farben, Abstände, Radien, Schrift nur über Tokens** (`var(--ui-color-accent)` …), nie feste Hex-Werte —
   so stimmen Hell/Dunkel und Kontrast automatisch.
7. **Namen scopen:** eigene Klassen `ui-touch-*` (im Kit) bzw. ein Projekt-Präfix; Keyframes und
   CSS-Variablen ebenso. Keine generischen Namen wie `.button`, `@keyframes pulse`.
8. **Kein Nachbau von Marken:** keine Apple-Symbole (SF Symbols), keine Apple-Schriftdateien, keine
   iOS-Systemfarben. Symbole kommen aus `Glyph` (eigene Formen).
9. **Keine neue Abhängigkeit ohne kurze Begründung** (was sie kann, wie gross, Alternative). Erst prüfen,
   ob das Kit es schon kann — nie dieselbe Interaktion unter anderem Namen doppelt bauen.
10. **Fremden Code nur aus MIT/BSD/Apache-Projekten** und in `HERKUNFT.md` des Projekts vermerken
    (Repo, Datei, Lizenz, was genau).

## 4. Welches Bauteil?

| Ich brauche … | Bauteil |
| --- | --- |
| Haupt-/Neben-Aktion | `<Button>` (`variant`: filled · tinted · gray · plain · glass; `size`: large · medium · small) |
| Knopf nur mit Symbol | `<IconButton icon="…" label="…">` |
| An/Aus | `<Toggle label="…">` |
| 2–5 Ansichten umschalten | `<Segmented options={…} label="…">` |
| Anzahl ± | `<Stepper label="…">` · Wert stufenlos: `<Slider label="…">` |
| Filter an/aus · entfernbare Auswahl | `<FilterChip>` · `<RemovableChip onRemove={…}>` |
| Zähler am Symbol | `<Badge count={3}>` in `<BadgeAnchor badge={…}>` |
| Einstellungs-Liste, Zeilen | `<List header="…">` + `<ListRow title="…">` (Wisch-Aktionen: `swipe={…}`) |
| Inhalt als Kachel · Albumbild | `<Card>` · `<Cover playing={…}>` |
| Laden | `<ActivityIndicator>` · `<ProgressBar label="…">` · `<Skeleton>` / `<SkeletonText>` / `<SkeletonGroup>` |
| Symbol wechselt / Play-Pause · Herz/Stern | `<SymbolSwap>` / `<PlayPauseButton>` · `<FavoriteButton label="…">` |
| Blatt von unten mit Rastpunkten | `<Sheet detents={['medium','large']}>` |
| Auswahl von Aktionen · Bestätigen | `<ActionSheet>` · `<Dialog>` |
| Menü am Knopf · Kontextmenü | `<Menu>` / `<Popover>` · `<ContextMenu>` |
| Kurze Rückmeldung | `useToast().show({ title })` (braucht `<ToastProvider>`) |
| Ziehen zum Aktualisieren | `<PullToRefresh onRefresh={…}>` |
| Titelleiste mit grossem Titel · Suche | `<Navbar title="…" scrollRef={…}>` · `<SearchBar>` |
| Untere Navigation | `<TabBar items={…} label="…">` |
| Seiten hinein/hinaus mit Wischen zurück | `<NavigationStack initial={…}>` |
| Seitenwechsel ohne Stapel | `transitionPage(update, 'push' \| 'pop', { scope })` |
| Mini-Player → Vollbild | `<NowPlaying track={…} playing={…}>` |
| Glas über Bildern | `<GlassSurface>` · `<GlassButton>` · `<GlassBar label="…">` (sparsam!) |

Genaue Props: [reference/components.md](reference/components.md).

## 5. Rezepte

Alle Rezepte werden im UI-Kit-Repo automatisch gegen das Kit typgeprüft
(`app/src/skill/recipes/`) — sie funktionieren so, wie sie hier stehen.

### Einstellungs-Bildschirm

```tsx
import { useState } from 'react'
import { List, ListRow, Toggle } from './touch'

export function SettingsScreen() {
  const [quiet, setQuiet] = useState(false)
  return (
    <List header="Fokus" footer="„Nicht stören“ schaltet Mitteilungen stumm." appear>
      <ListRow
        title="Nicht stören"
        leading={{ glyph: 'moon', tint: 'accent' }}
        trailing={<Toggle aria-label="Nicht stören" checked={quiet} onChange={setQuiet} />}
      />
      <ListRow title="Mitteilungen" leading={{ glyph: 'bell', tint: 'danger' }} detail="3 neue" onClick={() => {}} />
      <ListRow title="Abmelden" destructive onClick={() => {}} />
    </List>
  )
}
```

### Sheet mit Rastpunkten

```tsx
import { useState } from 'react'
import { Button, Sheet } from './touch'

export function FilterSheet() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)}>Filter</Button>
      <Sheet
        open={open}
        onOpenChange={setOpen}
        title="Filter"
        detents={['medium', 'large']}
        headerActions={
          <Button variant="plain" onClick={() => setOpen(false)}>
            Fertig
          </Button>
        }
      >
        <p>Inhalt — scrollt erst, wenn das Sheet ganz offen ist.</p>
      </Sheet>
    </>
  )
}
```

### Bestätigen und Aktionen wählen

```tsx
import { useState } from 'react'
import { ActionSheet, Button, Dialog } from './touch'

export function DeleteFlow({ onDelete }: { onDelete: () => void }) {
  const [actions, setActions] = useState(false)
  const [confirm, setConfirm] = useState(false)
  return (
    <>
      <Button variant="tinted" onClick={() => setActions(true)}>
        Foto
      </Button>
      <ActionSheet
        open={actions}
        onOpenChange={setActions}
        title="Foto"
        actions={[
          { label: 'Teilen', icon: 'share' },
          { label: 'Löschen', icon: 'trash', destructive: true, onSelect: () => setConfirm(true) },
        ]}
      />
      <Dialog
        open={confirm}
        onOpenChange={setConfirm}
        title="Foto löschen?"
        message="Das kann nicht rückgängig gemacht werden."
        actions={[
          { label: 'Abbrechen', role: 'cancel' },
          { label: 'Löschen', role: 'destructive', onSelect: onDelete },
        ]}
      />
    </>
  )
}
```

### Liste mit Wischen-zum-Löschen, Ziehen zum Aktualisieren und Toast

```tsx
import { useState } from 'react'
import { List, ListRow, PullToRefresh, useToast } from './touch'

export function Inbox({ load }: { load: () => Promise<string[]> }) {
  const [mails, setMails] = useState(['Lea', 'Ben', 'Studio Nord'])
  const toast = useToast()
  const remove = (name: string) => {
    setMails((list) => list.filter((m) => m !== name))
    toast.show({
      title: 'Gelöscht',
      icon: 'trash',
      action: { label: 'Rückgängig', onSelect: () => setMails((list) => [name, ...list]) },
    })
  }
  return (
    <PullToRefresh label="Posteingang" onRefresh={async () => setMails(await load())}>
      <List header="Posteingang">
        {mails.map((name) => (
          <ListRow
            key={name}
            title={name}
            swipe={{ fullSwipe: true, trailing: [{ label: 'Löschen', icon: 'trash', tone: 'danger', onSelect: () => remove(name) }] }}
          />
        ))}
      </List>
    </PullToRefresh>
  )
}
```

### App-Rahmen: Seiten-Stapel und Tab-Leiste

```tsx
import { useState } from 'react'
import { Button, List, ListRow, NavigationStack, TabBar, type StackNavigation } from './touch'

function Page({ nav, title }: { nav: StackNavigation; title: string }) {
  return (
    <div>
      {nav.canGoBack && (
        <Button variant="plain" icon="chevron-left" onClick={nav.pop}>
          Zurück
        </Button>
      )}
      <h1>{title}</h1>
      <List>
        <ListRow title="Details" onClick={() => nav.push({ id: 'details', title: 'Details', render: (n) => <Page nav={n} title="Details" /> })} />
      </List>
    </div>
  )
}

export function AppFrame() {
  const [tab, setTab] = useState('home')
  return (
    <>
      <NavigationStack label="Start" initial={{ id: 'home', title: 'Start', render: (nav) => <Page nav={nav} title="Start" /> }} />
      <TabBar
        label="Bereiche"
        value={tab}
        onChange={setTab}
        items={[
          { value: 'home', label: 'Start', icon: 'note' },
          { value: 'search', label: 'Suche', icon: 'search' },
          { value: 'news', label: 'Neu', icon: 'bell', badge: 2 },
        ]}
      />
    </>
  )
}
```

### Seitenwechsel ohne Stapel (View Transitions)

```tsx
import { useRef, useState } from 'react'
import { Button, transitionPage } from './touch'

export function Pages() {
  const area = useRef<HTMLDivElement>(null)
  const [page, setPage] = useState<'list' | 'detail'>('list')
  const go = (next: 'list' | 'detail') =>
    transitionPage(() => setPage(next), next === 'detail' ? 'push' : 'pop', { scope: area.current })
  return (
    <div ref={area}>
      {page === 'list' ? <Button onClick={() => go('detail')}>Öffnen</Button> : <Button onClick={() => go('list')}>Zurück</Button>}
    </div>
  )
}
```

### Eigene Bewegung mit Federn

```tsx
import { useRef } from 'react'
import { animateSpring, Button, springPreset, useReducedMotion } from './touch'

/** Ein Punkt springt federnd nach rechts — Zustand pro Frame im Ref, nie im React-State. */
export function Nudge() {
  const dot = useRef<HTMLSpanElement>(null)
  const reduced = useReducedMotion()
  const bump = () =>
    animateSpring({
      from: 0,
      to: 24,
      velocity: 400, // px/s — z. B. das Tempo des Fingers beim Loslassen
      params: springPreset('bouncy'),
      reducedMotion: reduced,
      onUpdate: (x) => dot.current?.style.setProperty('transform', `translateX(${x}px)`),
    })
  return (
    <>
      <span ref={dot} aria-hidden="true">●</span>
      <Button variant="tinted" onClick={bump}>
        Anstupsen
      </Button>
    </>
  )
}
```

In CSS: `transition: transform var(--ui-spring-snappy-duration) var(--ui-spring-snappy);` —
Presets `press`, `snappy`, `smooth`, `bouncy`, `gentle` (siehe [reference/tokens.md](reference/tokens.md)).
Achtung: `var()` als Kurve **innerhalb** von `@keyframes` ignorieren Browser — die Feder gehört in die
`animation`-Angabe des Elements.

## 6. Was das Kit nicht hat — selbst bauen, aber so

1. Erst in [reference/components.md](reference/components.md) suchen; oft reicht eine Kombination.
2. Tokens nutzen, Namen scopen, Regeln aus Abschnitt 3.
3. Zeiger-Gesten wie `Sheet.tsx`: Zustand pro Frame in `useRef`, Transform direkt ins `style` schreiben,
   `lockAxis` + `slopFor` für die Richtung, `createVelocityTracker` für das Tempo, beim Loslassen
   `selectSnapPoint` und das Tempo an `animateSpring` übergeben, `setPointerCapture`,
   `touch-action` passend setzen, Klick nach echtem Ziehen schlucken.
4. Overlay: `useModal({ open, onClose, containerRef })` + `Portal` + `usePresence` für die Ausblend-Animation.
5. Allgemein Nützliches zurück ins UI-Kit-Repo bringen (mit Tests), statt es im Projekt zu verstecken.

## 7. Vor dem Abschluss prüfen

- [ ] `tsc`/Build und Tests laufen grün.
- [ ] Jede neue Bewegung: nur transform/opacity, Reduced-Motion-Variante vorhanden und ausprobiert.
- [ ] Jeder Knopf hat Namen, 44-px-Treffer, sichtbaren Tastatur-Fokus; Escape schliesst jedes Overlay.
- [ ] Hell **und** dunkel angesehen, Breiten 360 / 390 / 430 px und Desktop, kein waagrechtes Scrollen.
- [ ] Mit der Tastatur allein bedienbar (Tab, Pfeile, Enter/Leertaste, Escape).
- [ ] Übernommener Fremd-Code in `HERKUNFT.md` vermerkt.

Automatisch prüfen (Playwright, prüft Namen, 44 px und Escape auf einer laufenden Seite):

```bash
# Werkzeuge aus dem UI-Kit-Repo holen (einmalig) und gegen den eigenen Dev-Server laufen lassen
git -C /tmp/ui-kit sparse-checkout add tools
node /tmp/ui-kit/tools/audit.mjs --url=http://127.0.0.1:5173 --page=/ --widths=390,1280
```
