# Touch Kit — API-Referenz

> Automatisch aus `app/src/touch/**` erzeugt (`npm run skill`). Nicht von Hand ändern.
> Import: `import { … } from './touch'` (alles ist über `touch/index.ts` exportiert).

## Bauteile (`components/`)

### `components/ActionSheet.tsx`

- **`ActionSheet`** — Choice of actions sliding up from the bottom edge, with a separate cancel button (thumb-reachable). Slides in on the smooth spring, leaves the way it came. Escape and tapping outside cancel.

**`ActionSheetAction`**

| Prop | Typ | Bedeutung |
| --- | --- | --- |
| `label` | `string` | – |
| `icon?` | `GlyphName` | – |
| `destructive?` | `boolean` | – |
| `disabled?` | `boolean` | – |
| `onSelect?` | `() => void` | – |

**`ActionSheetProps`**

| Prop | Typ | Bedeutung |
| --- | --- | --- |
| `open` | `boolean` | – |
| `onOpenChange` | `(open: boolean) => void` | – |
| `title?` | `string` | Optional heading; the sheet is always labelled (falls back to the cancel label). |
| `message?` | `string` | – |
| `actions` | `ActionSheetAction[]` | – |
| `cancelLabel?` | `string` | Label of the separate cancel button. Escape and scrim taps also cancel. |
| `container?` | `HTMLElement \| null` | – |

### `components/ActivityIndicator.tsx`

- **`ActivityIndicator`** — The eight-spoke "busy" spinner. The glyph never animates per spoke: it jumps 45° every 125 ms (steps(8)), so the fixed opacity gradient seems to travel around. It is a `role="status"` region with visually hidden text. The region mounts empty and the text follows right after, because screen readers skip a live region that arrives with its text already inside; a later label change is announced too. Under reduced motion the spokes stand still; the text is still announced.
- **`spokeReveal`** — Opacity of spoke `index` for a reveal `progress` (0…1): its resting opacity, faded in during its eighth.
- Typ `ActivityIndicatorSize = 'small' | 'large'`

**`ActivityIndicatorProps`** (erweitert `Omit<ComponentPropsWithRef<'span'>, 'children'>`)

| Prop | Typ | Bedeutung |
| --- | --- | --- |
| `size?` | `ActivityIndicatorSize` | small = 20 px (inline, in buttons and rows), large = 36 px (whole screen or card is loading). |
| `label?` | `string` | What screen readers announce. Default "Lädt". |
| `progress?` | `number` | 0…1: instead of spinning, the spokes appear one after another, clockwise from the top, each fading up to its place in the spinning gradient — e.g. while a pull-to-refresh is being pulled. Leave undefined to spin. |

### `components/Badge.tsx`

- **`Badge`** — Small status capsule: unread count, "new" dot or a short word.
- **`BadgeAnchor`** — Pins a badge to the top-end corner of its child (icon, button, avatar). The badge ignores pointer events, so it never steals the child's taps, and it gets a thin ring in the surface colour to lift it off the child.
- **`formatBadgeCount`** — Text for a numeric badge, or `null` when nothing should be shown.
- Typ `BadgeTone = 'danger' | 'accent' | 'neutral'`

**`BadgeProps`** (erweitert `Omit<ComponentPropsWithRef<'span'>, 'children'>`)

| Prop | Typ | Bedeutung |
| --- | --- | --- |
| `count?` | `number` | Number to show. 0 hides the badge unless `showZero`. Takes precedence over `children`. |
| `max?` | `number` | Highest number shown as is; above it the badge reads "max+". Default 99. |
| `showZero?` | `boolean` | Show "0" instead of hiding the badge. |
| `dot?` | `boolean` | A small dot without text ("something new"). Takes precedence over `count` and `children`. |
| `tone?` | `BadgeTone` | danger (default, like unread counts), accent or neutral. |
| `label?` | `string` | Text for assistive technology, e.g. "3 ungelesene Nachrichten". The visible number is then hidden from it. Without a label a count or dot badge is treated as decoration (`aria-hidden`); put the information in the name of the control it sits on instead. An explicit `aria-hidden` prop always wins. |
| `children?` | `ReactNode` | Short text, e.g. "Neu". |

**`BadgeAnchorProps`** (erweitert `ComponentPropsWithRef<'span'>`)

| Prop | Typ | Bedeutung |
| --- | --- | --- |
| `badge` | `ReactNode` | The badge to pin to the top-end corner, usually a `<Badge>`. |
| `overlap?` | `'rect' \| 'circle'` | Shape of the child. `circle` pulls the badge in onto the rim of a round child (avatar, round icon button) instead of the empty box corner. |

### `components/Button.tsx`

- **`Button`** — Push button with a physical press: it sinks immediately when touched and springs back (with a hint of overshoot) on release. Keyboard presses show the same feedback. Under reduced motion it dims instead of moving.
- **`IconButton`** — Round button with only a glyph. Always has an accessible name.
- Typ `ButtonVariant = 'filled' | 'tinted' | 'gray' | 'plain' | 'glass'`
- Typ `ButtonSize = 'large' | 'medium' | 'small'`
- Typ `ButtonShape = 'rounded' | 'capsule' | 'circle'`

**`ButtonProps`** (erweitert `ComponentPropsWithRef<'button'>`)

| Prop | Typ | Bedeutung |
| --- | --- | --- |
| `variant?` | `ButtonVariant` | filled = main action, tinted/gray = secondary, plain = text only, glass = over imagery. |
| `size?` | `ButtonSize` | large 50 px, medium 44 px, small 32 px (small keeps a 44 px hit area). |
| `shape?` | `ButtonShape` | – |
| `destructive?` | `boolean` | Destructive action (delete, sign out): uses the danger colour. |
| `block?` | `boolean` | Stretch to the container width. |
| `icon?` | `GlyphName` | Glyph before the label. |
| `children?` | `ReactNode` | – |

**`IconButtonProps`** (erweitert `Omit<ButtonProps, 'children' \| 'icon' \| 'shape' \| 'block' \| 'aria-label'>`)

| Prop | Typ | Bedeutung |
| --- | --- | --- |
| `icon` | `GlyphName` | – |
| `label` | `string` | Accessible name — required, because the button shows no text. |
| `selected?` | `boolean` | Makes it a toggle button (aria-pressed), e.g. favourite on/off. |
| `filled?` | `boolean` | Render the glyph filled (e.g. a filled heart when selected). |

### `components/Card.tsx`

- **`Card`** — Surface card with an optional media area, eyebrow, title and subtitle.
- **`cardTilt`** — Tilt for a pointer at `point` over a card occupying `rect`: flat in the centre, `max` degrees at the edges, the side under the pointer lifting towards the viewer. (A side that dipped away would, under perspective, slide out from under the pointer, end the hover and flicker at the edges.) Clamped to the card and rounded to hundredths; an empty rect gives a flat card.
- `CARD_TILT_MAX = 4` — Largest pointer tilt in degrees.
- Typ `CardVariant = 'plain' | 'feature'`
- Typ `CardMedia = ReactNode | { gradient: string } | { src: string; alt: string }`

**`CardProps`** (erweitert `Omit<ComponentPropsWithRef<'article'>, 'title' \| 'onClick' \| 'children'>`)

| Prop | Typ | Bedeutung |
| --- | --- | --- |
| `title` | `ReactNode` | Card title — rendered as the heading (not the HTML tooltip attribute). |
| `eyebrow?` | `ReactNode` | Small uppercase line above the title ("HEUTE", "APP DES TAGES"). |
| `subtitle?` | `ReactNode` | One line below the title. |
| `media?` | `CardMedia` | – |
| `variant?` | `CardVariant` | `plain` = media on top, text below. `feature` = large media with the title on a scrim at its bottom. |
| `headingLevel?` | `2 \| 3 \| 4 \| 5 \| 6` | Heading level of the title (default 3). |
| `href?` | `string` | Makes the whole card a link. |
| `onClick?` | `(event: MouseEvent<HTMLAnchorElement \| HTMLButtonElement>) => void` | Makes the whole card a button (or, together with `href`, a link with a click handler). |
| `tilt?` | `boolean` | Gentle tilt towards a mouse pointer (never for touch or reduced motion). Default: on for interactive cards. |
| `children?` | `ReactNode` | Body below the title (or below the media for `feature`). Controls in here stay clickable on their own. |

### `components/Chip.tsx`

- **`FilterChip`** — Filter chip: a small capsule that switches one filter on or off.
- **`RemovableChip`** — Removable ("input") chip: a token such as a recipient or a chosen city.

**`FilterChipProps`** (erweitert `Omit<ComponentPropsWithRef<'button'>, 'aria-pressed'>`)

| Prop | Typ | Bedeutung |
| --- | --- | --- |
| `selected?` | `boolean` | Controlled state. Leave undefined for an uncontrolled chip. |
| `defaultSelected?` | `boolean` | Initial state of an uncontrolled chip. |
| `onSelectedChange?` | `(selected: boolean, event: MouseEvent<HTMLButtonElement>) => void` | Called with the new state after a click (skipped when `onClick` calls preventDefault()). |
| `icon?` | `GlyphName` | Glyph before the label; it hands its slot to the check mark while selected. |
| `children?` | `ReactNode` | Visible text — also the accessible name. |

**`RemovableChipProps`** (erweitert `Omit<ComponentPropsWithRef<'span'>, 'children'>`)

| Prop | Typ | Bedeutung |
| --- | --- | --- |
| `onRemove` | `(event: SyntheticEvent<HTMLButtonElement>) => void` | Called when the remove button is activated (click, Space, Enter, Backspace or Delete). |
| `removeLabel?` | `string` | Accessible name of the remove button. Defaults to "<label> entfernen" when the label is plain text (strings / numbers), otherwise to "Entfernen" — pass a specific name then. |
| `icon?` | `GlyphName` | Glyph before the label. |
| `disabled?` | `boolean` | Disables the remove button and dims the chip. |
| `children?` | `ReactNode` | Visible text of the chip. |

### `components/Cover.tsx`

- **`Cover`** — Album-art cover in the manner of a music player's "now playing" screen.
- Typ `CoverSize = 'small' | 'medium' | 'large' | 'fill'`

**`CoverProps`** (erweitert `Omit<ComponentPropsWithRef<'div'>, 'children'>`)

| Prop | Typ | Bedeutung |
| --- | --- | --- |
| `playing` | `boolean` | Playing: full size, floating. Paused: shrunk, resting close to the surface. |
| `src?` | `string` | Artwork image. Without it the cover shows `glyph` on `gradient`. |
| `alt?` | `string` | Describes the artwork ("Albumcover: Nachtfahrt"). Leave empty when the title is already written next to the cover — the cover is then decorative. |
| `gradient?` | `string` | CSS background for the placeholder (and behind a loading image). |
| `glyph?` | `GlyphName` | Placeholder glyph (default `note`). |
| `size?` | `CoverSize \| number` | small 64 px (mini player) · medium 160 px · large 264 px · fill = container width · or a px number. |

### `components/Dialog.tsx`

- **`Dialog`** — Centered alert. Appears by settling from a slightly larger scale (spring), leaves with a quick fade. Escape runs the cancel action if there is one; without a cancel action the alert must be answered (Escape does nothing).

**`DialogAction`**

| Prop | Typ | Bedeutung |
| --- | --- | --- |
| `label` | `string` | – |
| `role?` | `'default' \| 'cancel' \| 'destructive'` | 'cancel' is bold and answers Escape; 'destructive' is red. |
| `onSelect?` | `() => void` | – |
| `disabled?` | `boolean` | – |

**`DialogProps`**

| Prop | Typ | Bedeutung |
| --- | --- | --- |
| `open` | `boolean` | – |
| `onOpenChange` | `(open: boolean) => void` | – |
| `title` | `string` | – |
| `message?` | `ReactNode` | – |
| `actions` | `DialogAction[]` | Buttons; two sit side by side, three or more stack. |
| `children?` | `ReactNode` | Extra content between message and buttons (e.g. a text field). |
| `container?` | `HTMLElement \| null` | – |

### `components/FavoriteButton.tsx`

- **`FavoriteButton`** — Favourite / like toggle: a native `<button aria-pressed>` with a heart or star. Its look (colour and fill) is drawn from `aria-pressed` in the DOM.
- Typ `FavoriteSymbol = 'heart' | 'star'`

**`FavoriteButtonProps`** (erweitert `Omit<ButtonProps, 'children' \| 'icon' \| 'shape' \| 'block' \| 'destructive' \| 'aria-label' \| 'aria-pressed' \| 'variant'>`)

| Prop | Typ | Bedeutung |
| --- | --- | --- |
| `variant?` | `Exclude<ButtonVariant, 'filled'>` | Look of the round button (default `plain`). No `filled`: the red / amber glyph would vanish on the accent fill. |
| `symbol?` | `FavoriteSymbol` | heart = "Gefällt mir" (danger colour), star = "Favorit" (warning colour). |
| `label` | `string` | Accessible name — required, because the button shows only a glyph (e.g. "Merken"). |
| `selected?` | `boolean` | Controlled state. Leave undefined for an uncontrolled button. |
| `defaultSelected?` | `boolean` | Initial state of an uncontrolled button. |
| `onSelectedChange?` | `(selected: boolean, event: MouseEvent<HTMLButtonElement>) => void` | Called with the new state after a click (skipped when `onClick` calls preventDefault()). |

### `components/FilamentSwitch.tsx`

- **`FilamentSwitch`** — An accessible mechanical switch: native checkbox drives the metal case, screws, glass and live filament.

**`FilamentSwitchProps`**

| Prop | Typ | Bedeutung |
| --- | --- | --- |
| `label` | `string` | Accessible name of the on/off control. |
| `checked?` | `boolean` | – |
| `defaultChecked?` | `boolean` | – |
| `onChange?` | `(checked: boolean) => void` | – |
| `disabled?` | `boolean` | – |
| `size?` | `'compact' \| 'regular'` | – |
| `accent?` | `'amber' \| 'cyan' \| 'violet'` | – |
| `className?` | `string` | – |
| `name?` | `string` | Optional form field name, for HTML form submissions. |

### `components/HaloSwitch.tsx`

- **`HaloSwitch`** — Compact luminous switch with an actual checkbox and a moving light source.

**`HaloSwitchProps`**

| Prop | Typ | Bedeutung |
| --- | --- | --- |
| `label` | `string` | Screen-reader label, independent of its visual ON/OFF status. |
| `checked?` | `boolean` | – |
| `defaultChecked?` | `boolean` | – |
| `onChange?` | `(checked: boolean) => void` | – |
| `disabled?` | `boolean` | – |
| `className?` | `string` | – |
| `accent?` | `string` | – |
| `name?` | `string` | – |

### `components/List.tsx`

- **`List`** — Grouped list like a settings screen: optional header text, a rounded card of rows (`inset`) or full-bleed rows (`plain`), optional footer note.
- **`ListRow`** — One row. With `href` it is an `<a>`, with `onClick` a `<button>`, filling the whole row so the entire row is the target; otherwise a plain `<div>`.
- Typ `ListVariant = 'inset' | 'plain'`
- Typ `ListTileTint = 'accent' | 'info' | 'success' | 'warning' | 'danger' | 'gray'`

**`ListProps`** (erweitert `Omit<ComponentPropsWithRef<'section'>, 'children'>`)

| Prop | Typ | Bedeutung |
| --- | --- | --- |
| `variant?` | `ListVariant` | `inset` = rounded card with side margins (settings screen), `plain` = full-bleed. |
| `header?` | `ReactNode` | Short text above the list. It also becomes the list's accessible name. |
| `footer?` | `ReactNode` | Note below the list. It also becomes the list's accessible description. |
| `appear?` | `boolean` | Rows rise into place one after another when the list mounts (35 ms apart, at most 350 ms). |
| `children?` | `ReactNode` | `ListRow`s. Arrays, fragments and conditional `{cond && …}` rows are fine: each row counts on its own. |

**`ListRowProps`** (erweitert `Omit<ComponentPropsWithRef<'li'>, 'title' \| 'onClick' \| 'children'>`)

| Prop | Typ | Bedeutung |
| --- | --- | --- |
| `title` | `ReactNode` | – |
| `subtitle?` | `ReactNode` | Second line under the title (the row grows to at least 52 px). |
| `detail?` | `ReactNode` | Secondary text on the trailing side, e.g. the current value. |
| `leading?` | `ReactNode \| ListRowTile` | A `{ glyph, tint }` icon tile, or any node (avatar, image). |
| `trailing?` | `ReactNode` | Custom node at the end, e.g. a Badge or a Toggle. Inside a row with `href` / `onClick` it must not be interactive itself (no control inside a link or button) — give a Toggle row no action instead. |
| `chevron?` | `boolean` | Disclosure chevron. Default: shown when the row has `href` or `onClick` (and no `selected`). |
| `href?` | `string` | Makes the whole row a link. |
| `target?` | `string` | – |
| `rel?` | `string` | – |
| `onClick?` | `(event: MouseEvent<HTMLAnchorElement \| HTMLButtonElement>) => void` | Makes the whole row a button (unless `href` is set, then it is the link's click handler). |
| `disabled?` | `boolean` | – |
| `destructive?` | `boolean` | Destructive action (sign out, delete): the title uses the danger colour. |
| `selected?` | `boolean` | Makes a button row (`onClick`, no `href`) a choice in a picker, single or multiple choice: `true` shows an accent check mark at the end, `false` keeps its place empty so the text never jumps; it replaces the chevron. The row's button gets `aria-pressed`, so a screen reader reads the title (subtitle, detail) and then "toggle button, pressed" / "not pressed" (wording varies by reader); the mark itself stays silent. Chosen because `aria-selected` / `aria-checked` are ignored on a button and radio roles would need a radiogroup with arrow-key focus. The pressed state does not say the choices exclude each other: name a single choice in the `List` header (e.g. "Sortieren nach"). Your `onClick` decides what a tap does. Links and static rows cannot carry the state and show no mark. |
| `index?` | `number` | Position for the staggered entrance. Set automatically inside `List`. |
| `divider?` | `boolean` | Hairline under the row. Default: every row of a `List` except the last one. |
| `swipe?` | `Omit<SwipeActionsProps, 'children' \| 'className'>` | Swipe actions (e.g. `{ trailing: [{ label: 'Löschen', tone: 'danger', onSelect }] }`): the row content slides aside to reveal them. They are also real buttons after the row for keyboard and screen readers, named after a string `title` ("Löschen: Nachtfahrt"); set `context` for another name (`''`: none). |

### `components/NowPlaying.tsx`

- **`NowPlaying`** — Mini player that grows into a full-screen player along one continuous path — the shared-element (FLIP) journey of a music app.
- **`shouldCollapsePlayer`** — Release decision for dragging the full player down: collapse when pulled further than a quarter of its height or flicked down faster than 800 px/s; a clear flick back up always cancels.

**`NowPlayingTrack`**

| Prop | Typ | Bedeutung |
| --- | --- | --- |
| `title` | `string` | – |
| `artist` | `string` | – |
| `artwork?` | `string` | Image URL, or a CSS gradient / colour used as placeholder art. |

**`NowPlayingProps`**

| Prop | Typ | Bedeutung |
| --- | --- | --- |
| `track` | `NowPlayingTrack` | – |
| `playing` | `boolean` | – |
| `onPlayingChange` | `(playing: boolean) => void` | – |
| `expanded?` | `boolean` | Controlled full-screen state. |
| `defaultExpanded?` | `boolean` | – |
| `onExpandedChange?` | `(expanded: boolean) => void` | – |
| `onNext?` | `() => void` | Without a handler the matching button is disabled. |
| `onPrevious?` | `() => void` | – |
| `progress?` | `number` | Playback position 0…1 shown in the full player (placeholder bar). |
| `container?` | `HTMLElement \| null` | Portal target for the full player in contained layouts (e.g. a phone frame). Default document.body. |
| `labels?` | `Partial<NowPlayingLabels>` | – |
| `className?` | `string` | Class of the mini player bar. |

### `components/Popover.tsx`

- **`Popover`** — Floating panel that grows out of its anchor (transform-origin at the anchor, snappy spring) and shrinks back into it. Escape and a tap outside close it; focus moves in and returns to the trigger. Unlike a sheet it does not lock scrolling or dim the page.
- **`Menu`** — A popover with menu semantics (role=menu / menuitem, arrow-key navigation).
- **`ContextMenu`** — Long-press (touch), right-click (mouse) or the context-menu key / Shift+F10 (keyboard) opens a menu. While pressed, the element "lifts" towards the finger (scale up with a deeper shadow) — the iOS context-menu preview.
- **`moveMenuFocus`** — Arrow keys, Home and End move between the enabled items of a menu.

**`PopoverProps`**

| Prop | Typ | Bedeutung |
| --- | --- | --- |
| `open` | `boolean` | – |
| `onOpenChange` | `(open: boolean) => void` | – |
| `anchorRef` | `RefObject<HTMLElement \| null>` | The element the popover points at (usually the trigger button). |
| `label` | `string` | Accessible name of the popover. |
| `prefer?` | `'top' \| 'bottom'` | – |
| `children` | `ReactNode` | – |
| `className?` | `string` | – |
| `role?` | `'dialog' \| 'menu'` | 'dialog' for free content, 'menu' when children are menu items. |
| `width?` | `number` | – |

**`MenuItem`**

| Prop | Typ | Bedeutung |
| --- | --- | --- |
| `label` | `string` | – |
| `icon?` | `GlyphName` | – |
| `destructive?` | `boolean` | – |
| `disabled?` | `boolean` | – |
| `onSelect?` | `() => void` | – |

**`MenuProps`** (erweitert `Omit<PopoverProps, 'children' \| 'role'>`)

| Prop | Typ | Bedeutung |
| --- | --- | --- |
| `items` | `MenuItem[]` | – |

**`ContextMenuProps`**

| Prop | Typ | Bedeutung |
| --- | --- | --- |
| `items` | `MenuItem[]` | – |
| `label` | `string` | Accessible name of the menu. |
| `children` | `ReactNode` | The element that can be long-pressed / right-clicked. Must be focusable for keyboard users. |
| `holdMs?` | `number` | Hold duration for touch (ms). |
| `className?` | `string` | – |

### `components/ProgressBar.tsx`

- **`ProgressBar`** — Thin capsule progress bar (6 px). The fill is a full-width bar slid in with `translateX`, clipped by the track, so its rounded end stays round at any value; each new value is reached with the snappy spring. Reaching 100 % while on screen plays one sheen (`data-just-completed`); a bar that mounts complete stays still. Indeterminate mode sweeps a stretching segment across; under reduced motion it rests as a still segment in the middle.
- **`clampProgress`** — Progress as 0..1: values outside are clamped, NaN counts as 0 (nothing done yet).
- **`progressPercent`** — Whole percent for display and `aria-valuenow`. Rounds halves up, but only says 100 when the work is really complete — 99.6 % reads "99", so nobody is told "done" while the bar still has a sliver to go.

**`ProgressBarProps`** (erweitert `Omit<ComponentPropsWithRef<'div'>, 'children'>`)

| Prop | Typ | Bedeutung |
| --- | --- | --- |
| `value?` | `number` | Progress 0..1 (clamped). Ignored while `indeterminate`. |
| `label` | `string` | Accessible name, e.g. "Hochladen". Shown above the bar with `showLabel`, otherwise aria-label. |
| `showLabel?` | `boolean` | Show the label and the percent above the bar. |
| `indeterminate?` | `boolean` | Unknown duration: a segment sweeps across instead of a fill; no value is announced. |
| `valueText?` | `(percent: number) => string` | Spoken value (aria-valuetext), e.g. `(p) => `${p} Prozent, 10 von 40 MB``. |

### `components/PullToRefresh.tsx`

- **`PullToRefresh`** — Scroll area that refreshes when pulled down from the top. The content follows the finger with a soft rubber band; the spinner's spokes appear one by one, it spins once the pull is past the threshold, the content rests on the spinner while `onRefresh` runs, then springs back. Refresh state is announced to screen readers.

**`PullToRefreshProps`**

| Prop | Typ | Bedeutung |
| --- | --- | --- |
| `onRefresh` | `() => Promise<unknown> \| void` | Runs when a pull is released past the threshold; the spinner stays until it settles. |
| `children` | `ReactNode` | – |
| `label?` | `string` | Accessible name of the scroll area. |
| `refreshingText?` | `string` | – |
| `doneText?` | `string` | – |
| `className?` | `string` | – |

### `components/Segmented.tsx`

- **`Segmented`** — iOS segmented control: a small set of mutually exclusive views.

**`SegmentedProps`** (erweitert `Omit<ComponentPropsWithRef<'div'>, 'onChange' \| 'defaultValue' \| 'children' \| 'role' \| 'aria-label'>`)

| Prop | Typ | Bedeutung |
| --- | --- | --- |
| `options` | `ReadonlyArray<SegmentedOption<V>>` | – |
| `value?` | `V` | Controlled selection. Leave undefined for an uncontrolled control. |
| `defaultValue?` | `V` | Initial selection when uncontrolled (defaults to the first enabled option). |
| `onChange?` | `(value: V) => void` | Called with the newly selected value (not when the selection is re-clicked). |
| `label` | `string` | Accessible name of the group, e.g. "Zeitraum". Required: the group has no visible title. |
| `disabled?` | `boolean` | – |
| `block?` | `boolean` | Stretch to the container width. |
| `name?` | `string` | Adds a hidden input so the selection is submitted with a form. |

### `components/Sheet.tsx`

- **`Sheet`** — Bottom sheet with detents that follows the finger.

**`SheetProps`**

| Prop | Typ | Bedeutung |
| --- | --- | --- |
| `open` | `boolean` | – |
| `onOpenChange` | `(open: boolean) => void` | – |
| `title` | `string` | Accessible name; also shown as the sheet heading unless `hideTitle`. |
| `hideTitle?` | `boolean` | – |
| `description?` | `ReactNode` | – |
| `detents?` | `Detent[]` | Rest heights, e.g. ['medium', 'large'], 0.3 (fraction), 240 or '240px'. Default ['medium', 'large']. |
| `detent?` | `number` | Controlled detent index (into the ascending list of resolved heights). |
| `defaultDetent?` | `number` | – |
| `onDetentChange?` | `(index: number) => void` | – |
| `dismissible?` | `boolean` | Swipe down, scrim tap and Escape close the sheet. Default true. |
| `pushBackground?` | `boolean` | Push the page behind back like a card at the largest detent. Default true. |
| `backgroundSelector?` | `string` | Element to push back; default the first `[data-ui-sheet-background]` in the container/document. |
| `container?` | `HTMLElement \| null` | Portal target for contained layouts (e.g. a phone frame). Default document.body. |
| `headerActions?` | `ReactNode` | Buttons in the header, e.g. a "Fertig" button. |
| `grabberLabel?` | `string` | Label of the grabber button (keyboard: Enter cycles, arrows resize). |
| `detentNames?` | `string[]` | – |
| `children?` | `ReactNode` | – |
| `className?` | `string` | – |

### `components/Skeleton.tsx`

- **`Skeleton`** — A placeholder block where content is still loading: a soft tint with a light band sweeping across. Hidden from assistive technology — wrap the placeholders in a `SkeletonGroup` that says what is loading.
- **`SkeletonText`** — Placeholder for a paragraph: `lines` bars sized to the surrounding font, the last one shorter. The shimmer starts a little later on each line, so it runs down the paragraph as a wave.
- **`SkeletonGroup`** — Container for placeholders and, once loaded, the real content. While `busy` it is `aria-busy="true"` and carries a visually hidden label that says what is loading. Keep the same group mounted and flip `busy` to false when the content arrives: `aria-busy` turns false, the label goes away, and the new content fades up into place (`data-revealed`). Content that was there from the first render does not animate. The group is not a live region; if arriving content must be announced, add one around it.
- **`skeletonLineWidths`** — Widths for `lines` placeholder lines: all full, the last one shorter like the end of a paragraph. A single line stays full (nothing to be shorter than). Counts are whole numbers from 1 to 50; anything else becomes 1.

**`SkeletonProps`** (erweitert `Omit<ComponentPropsWithRef<'span'>, 'children'>`)

| Prop | Typ | Bedeutung |
| --- | --- | --- |
| `width?` | `number \| string` | Default 100 % of the container. |
| `height?` | `number \| string` | Default 1em (one line of the surrounding text). |
| `radius?` | `number \| string` | Corner radius. Default 6 px; "50%" makes a circle (avatars). |

**`SkeletonTextProps`** (erweitert `Omit<ComponentPropsWithRef<'span'>, 'children'>`)

| Prop | Typ | Bedeutung |
| --- | --- | --- |
| `lines?` | `number` | Number of lines. Default 3. |
| `lastLineWidth?` | `string` | Width of the last line (when there is more than one). Default "60%". |

**`SkeletonGroupProps`** (erweitert `ComponentPropsWithRef<'div'>`)

| Prop | Typ | Bedeutung |
| --- | --- | --- |
| `busy?` | `boolean` | True while loading (default). Set false when the real content is in. |
| `busyLabel?` | `string` | What is loading, for screen readers. Default "Inhalt lädt". |
| `children?` | `ReactNode` | – |

### `components/Slider.tsx`

- **`Slider`** — A native `<input type="range">`, fully restyled: 6 px track, accent fill up to the thumb, 28 px white thumb that grows under the finger (:active) and springs back on release. Keyboard, screen readers and forms work natively.
- **`valueToProgress`** — Where `value` sits between `min` and `max`, as 0..1 — clamped, and 0 for an empty or inverted range (min >= max) or NaN, so it never divides by zero.

**`SliderProps`** (erweitert `Omit<ComponentPropsWithRef<'input'>, 'value' \| 'defaultValue' \| 'onChange' \| 'type' \| 'min' \| 'max' \| 'step' \| 'children'>`)

| Prop | Typ | Bedeutung |
| --- | --- | --- |
| `label` | `string` | Accessible name; shown above the track when `showLabel` is set, otherwise used as aria-label. |
| `showLabel?` | `boolean` | – |
| `value?` | `number` | Controlled value. |
| `defaultValue?` | `number` | Initial value when uncontrolled (default: midpoint, like a native range). |
| `onChange?` | `(value: number) => void` | Called with the new number on every movement (native `input` event). |
| `min?` | `number` | Default 0. |
| `max?` | `number` | Default 100. |
| `step?` | `number \| 'any'` | Default 1. |
| `minGlyph?` | `GlyphName` | Decorative glyph at the start of the track (e.g. "moon" for dim). |
| `maxGlyph?` | `GlyphName` | Decorative glyph at the end of the track (e.g. "sun" for bright). |
| `valueText?` | `(value: number) => string` | Spoken value (aria-valuetext), e.g. `(n) => `${n} Prozent``. |

### `components/Stepper.tsx`

- **`Stepper`** — Minus / value / plus in one capsule.
- **`stepValue`** — One step up or down, the way a stepper should count: - float-safe: the result is rounded to the step's (and min's) decimals, so 0.2 + 0.1 gives 0.3, not 0.30000000000000004; - on a grid anchored at `min` (or 0): an off-grid value moves to the next grid value in that direction, like `<input type="number">`; - clamped to `min` / `max` (the last step may be shorter to land on a bound).
- Typ `StepDirection = 1 | -1`

**`StepOptions`**

| Prop | Typ | Bedeutung |
| --- | --- | --- |
| `min?` | `number` | Lower bound, also the anchor of the step grid (default: unbounded, grid anchored at 0). |
| `max?` | `number` | Upper bound (default: unbounded). |
| `step?` | `number` | Step size, must be > 0 (default 1). |

**`StepperProps`** (erweitert `Omit<ComponentPropsWithRef<'div'>, 'onChange' \| 'defaultValue' \| 'children'>`)

| Prop | Typ | Bedeutung |
| --- | --- | --- |
| `label` | `string` | Accessible name of the group (e.g. "Anzahl"). |
| `value?` | `number` | Controlled value. |
| `defaultValue?` | `number` | Initial value when uncontrolled (default: `min`, or 0 when min is unbounded; clamped into range). |
| `onChange?` | `(value: number) => void` | – |
| `min?` | `number` | Default 0 (like a native iOS stepper). Pass -Infinity for no lower bound. |
| `max?` | `number` | Default 100. Pass Infinity for no upper bound. |
| `step?` | `number` | Default 1. |
| `format?` | `(value: number) => string` | Text shown for a value (default: locale number with the step's decimals). |
| `decrementLabel?` | `string` | Accessible name of the minus button. |
| `incrementLabel?` | `string` | Accessible name of the plus button. |
| `disabled?` | `boolean` | – |
| `name?` | `string` | Adds a hidden input so the value submits with a form. |

### `components/SwipeActions.tsx`

- **`SwipeActions`** — Wraps a list row so it can be swiped aside to reveal actions. - Follows the finger 1:1 until the actions are revealed, then resists (rubber band) — or runs freely when a full swipe is allowed. - The action buttons pop in one after another as they are uncovered. - Release: a flick decides by direction, otherwise past half opens. - Keyboard / screen readers: the actions are real buttons after the row (DOM order: row, leading, trailing); focusing one slides the row open so it is visible, and focus leaving the row closes it again.

**`SwipeAction`**

| Prop | Typ | Bedeutung |
| --- | --- | --- |
| `label` | `string` | – |
| `icon?` | `GlyphName` | – |
| `tone?` | `'danger' \| 'accent' \| 'warning' \| 'neutral'` | – |
| `onSelect` | `() => void` | – |

**`SwipeActionsProps`**

| Prop | Typ | Bedeutung |
| --- | --- | --- |
| `trailing?` | `SwipeAction[]` | Revealed by swiping left (listed from the row edge outwards: the first is outermost). |
| `leading?` | `SwipeAction[]` | Revealed by swiping right. |
| `fullSwipe?` | `boolean` | A long swipe runs the first action of that side directly (e.g. delete). |
| `context?` | `string` | Names the row for assistive technology: every action is then announced as "<label>: <context>" (e.g. "Löschen: Nachtfahrt") while its visible label stays short, so twenty rows do not read as twenty identical "Löschen" buttons. `ListRow` passes a string title automatically. |
| `children` | `ReactNode` | – |
| `className?` | `string` | – |

### `components/SymbolSwap.tsx`

- **`SymbolSwap`** — One glyph that turns into another, like a system symbol replacing itself: the old glyph rotates away (−90°, half size, fading) while the new one rotates in from +90° on the `bouncy` spring. Both are layered in the same box, so the surrounding layout never moves.
- **`PlayPauseButton`** — Round play / pause button. The name always says what a press will do ("Abspielen" ↔ "Pausieren"), so it needs no `aria-pressed` on top. The glyph turns over with SymbolSwap; the button itself has the kit's press spring.

**`SymbolSwapProps`** (erweitert `Omit<ComponentPropsWithRef<'span'>, 'children'>`)

| Prop | Typ | Bedeutung |
| --- | --- | --- |
| `symbol` | `GlyphName` | The glyph to show. Changing it plays the swap. |
| `filled?` | `boolean` | Filled rendering (heart, star …). Changing only this does not swap. |
| `size?` | `number` | Glyph size in px (default 24). |

**`PlayPauseButtonProps`** (erweitert `Omit<ButtonProps, 'children' \| 'icon' \| 'shape' \| 'block' \| 'aria-label' \| 'aria-pressed'>`)

| Prop | Typ | Bedeutung |
| --- | --- | --- |
| `playing?` | `boolean` | Controlled state. Leave undefined for an uncontrolled button. |
| `defaultPlaying?` | `boolean` | Initial state when uncontrolled (default: paused). |
| `onPlayingChange?` | `(playing: boolean, event: MouseEvent<HTMLButtonElement>) => void` | Called with the new state after a click (skipped when `onClick` calls preventDefault()). |
| `playLabel?` | `string` | Accessible name while paused — the action the button performs (default "Abspielen"). |
| `pauseLabel?` | `string` | Accessible name while playing (default "Pausieren"). |

### `components/Toast.tsx`

- **`ToastProvider`** — Hosts toasts. They drop in from the top on the bouncy spring, stack like notifications (older ones sink back), pause while hovered or focused, and leave after a few seconds, on an upward swipe, via their close button or with Escape (newest first, only when no modal is open).
- **`useToast`**
- **`shouldDismissToast`** — Decides on release whether an upward swipe dismisses the toast.
- `TOAST_SWIPE_DISTANCE = 32` — Upward swipe (px) or speed (px/s) that dismisses.
- `TOAST_SWIPE_VELOCITY = 300`

**`ToastOptions`**

| Prop | Typ | Bedeutung |
| --- | --- | --- |
| `title` | `string` | – |
| `message?` | `string` | – |
| `icon?` | `GlyphName` | – |
| `tone?` | `'neutral' \| 'success' \| 'danger'` | – |
| `action?` | `{ label: string; onSelect: () => void }` | – |
| `duration?` | `number` | Milliseconds before it leaves on its own; 0 keeps it until dismissed. Default 4000. |

**`ToastProviderProps`**

| Prop | Typ | Bedeutung |
| --- | --- | --- |
| `children` | `ReactNode` | – |
| `label?` | `string` | Accessible name of the live region. |
| `dismissLabel?` | `string` | – |
| `contained?` | `boolean` | Contain toasts inside an element (demo phone frame) instead of the viewport. |

### `components/Toggle.tsx`

- **`Toggle`** — On/off switch. A real `<input type="checkbox" role="switch">` sits inside the `<label>`, so Space, forms, `name`/`value` and screen readers work natively; the track and knob only *draw* the input's `:checked`, `:disabled` and `:focus-visible` state, never a React copy of it.
- Typ `ToggleNameProps = | { label: Exclude<ReactNode, null | undefined | boolean> } | { label?: undefined; 'aria-label': string } | { label?: undefined; 'aria-labelledby': string }`
- Typ `ToggleProps = ToggleBaseProps & ToggleNameProps`

**`ToggleBaseProps`** (erweitert `NativeInputProps`)

| Prop | Typ | Bedeutung |
| --- | --- | --- |
| `checked?` | `boolean` | Controlled state. Leave undefined for an uncontrolled toggle. |
| `defaultChecked?` | `boolean` | Initial state of an uncontrolled toggle. |
| `onChange?` | `(checked: boolean, event: ChangeEvent<HTMLInputElement>) => void` | Called with the new state after the user flips the switch. |
| `labelPosition?` | `'start' \| 'end'` | Where the visible text sits. `start` = settings-row style (text, then switch). |
| `block?` | `boolean` | Stretch the label to the container width (switch at the far end with `labelPosition="start"`). |

## Navigation (`navigation/`)

### `navigation/Navbar.tsx`

- **`Navbar`** — Navigation bar with the iOS large title.

**`NavbarProps`**

| Prop | Typ | Bedeutung |
| --- | --- | --- |
| `title` | `string` | Screen title: the large heading under the bar, and the small centred title once collapsed. |
| `headingLevel?` | `1 \| 2 \| 3 \| 4` | Heading level of the title. Default 1 (the screen is the page). Use 2–4 when the screen is embedded in a larger page, so the page keeps one h1. |
| `largeTitle?` | `boolean` | Show the iOS large title that shrinks into the bar on scroll. Default true. |
| `leading?` | `ReactNode` | Left slot (e.g. "Bearbeiten"); shown after the back button if both are given. |
| `trailing?` | `ReactNode` | Right slot (actions). |
| `backLabel?` | `string` | Text of the back button (also its accessible name). Default "Zurück". |
| `onBack?` | `() => void` | Renders a back button (chevron + label) when given. |
| `scrollRef` | `RefObject<HTMLElement \| null>` | The scroll container the navbar lives in (render the navbar as its first child), or `document.documentElement` when the page itself scrolls. Its scroll position drives the collapse. Give the container `scroll-padding-top` of the bar height so elements focused by keyboard are not scrolled underneath the sticky bar. |
| `snap?` | `boolean` | Finish a half-way collapse when scrolling stops. Default true. |
| `children?` | `ReactNode` | Extra row under the large title that scrolls with the page, e.g. a SearchBar. |
| `className?` | `string` | – |

### `navigation/NavigationStack.tsx`

- **`NavigationStack`** — iOS-style navigation stack: push / pop with parallax and swipe back.
- **`useStackNavigation`** — The navigation of the screen this component is rendered in.

**`StackScreen`**

| Prop | Typ | Bedeutung |
| --- | --- | --- |
| `id` | `string` | Identifies the screen (e.g. for analytics or tests); may repeat in the stack. |
| `title` | `string` | Announced to screen readers when the screen becomes the top one. |
| `render` | `(nav: StackNavigation) => ReactNode` | The screen's content. Called as a component, so it may use hooks. |

**`NavigationStackProps`**

| Prop | Typ | Bedeutung |
| --- | --- | --- |
| `initial` | `StackScreen` | The first screen. Read once on mount. |
| `label?` | `string` | Accessible name of the stack region (e.g. the app section's name). |
| `swipeBack?` | `boolean` | Swipe from the left edge to go back. Default true. |
| `className?` | `string` | – |

### `navigation/SearchBar.tsx`

- **`SearchBar`** — iOS search field.

**`SearchBarProps`**

| Prop | Typ | Bedeutung |
| --- | --- | --- |
| `label?` | `string` | Accessible name of the field. Default "Suchen". |
| `placeholder?` | `string` | – |
| `value?` | `string` | Controlled text. |
| `defaultValue?` | `string` | Initial text when uncontrolled. |
| `onChange?` | `(value: string) => void` | – |
| `onSubmit?` | `(value: string) => void` | Return / the keyboard's search key. |
| `onCancel?` | `() => void` | The cancel button (or Escape on an empty field) left the search. |
| `cancelLabel?` | `string` | – |
| `clearLabel?` | `string` | – |
| `blurOnSubmit?` | `boolean` | Hide the on-screen keyboard after submitting so results are visible. Default true. |
| `className?` | `string` | – |

### `navigation/TabBar.tsx`

- **`TabBar`** — Bottom tab bar with a moving "material": one pill behind the active tab.
- Typ `TabBarVariant = 'bar' | 'floating'`

**`TabBarItem`**

| Prop | Typ | Bedeutung |
| --- | --- | --- |
| `value` | `V` | – |
| `label` | `string` | Visible text under the icon; also the button's accessible name. |
| `icon` | `GlyphName` | – |
| `badge?` | `number \| string` | Small red pill on the icon: a count (0 hides it) or a short word such as "Neu". |
| `badgeLabel?` | `string` | Text for assistive technology instead of the badge, e.g. "3 ungelesene". Default "<n> neue" / the word. |
| `disabled?` | `boolean` | – |

**`TabBarProps`** (erweitert `Omit<ComponentPropsWithRef<'nav'>, 'onChange' \| 'defaultValue' \| 'children' \| 'aria-label'>`)

| Prop | Typ | Bedeutung |
| --- | --- | --- |
| `items` | `ReadonlyArray<TabBarItem<V>>` | – |
| `value?` | `V` | Controlled selection. Leave undefined for an uncontrolled bar. |
| `defaultValue?` | `V` | Initial selection when uncontrolled (default: the first enabled item). |
| `onChange?` | `(value: V) => void` | Called with the newly chosen value (tap, keyboard or drag) — not when the active tab is tapped again. |
| `label` | `string` | Accessible name of the navigation landmark, e.g. "Hauptbereiche". |
| `variant?` | `TabBarVariant` | bar = full-width strip on the bottom edge; floating = glass capsule hovering above the content. |
| `formatAnnouncement?` | `(item: TabBarItem<V>) => string` | Text announced after a drag picked a tab. Default "<label> ausgewählt". |

### `navigation/viewTransition.ts`

- **`transitionPage`** — Runs a page change (a React state update) as an iOS-style push / pop with the View Transitions API: the new page slides in from the right while the old one drifts 20 % left (push), or the reverse (pop).
- Typ `PageTransition = 'push' | 'pop' | 'fade'`

**`PageTransitionOptions`**

| Prop | Typ | Bedeutung |
| --- | --- | --- |
| `scope?` | `HTMLElement \| null` | Slide only this element instead of the whole page (e.g. the content area of an app shell or a phone frame). The rest of the page stays still and the sliding pages are clipped to the element's box, with the corner radius from `--ui-touch-vt-radius` (set on the element or an ancestor), else the element's own `border-radius`. Keep decorations such as frame shadows outside it — they would slide along. |

## Glas (`glass/`)

### `glass/field.ts`

- **`roundedRectDistance`** — Signed distance from (x, y) — relative to the centre — to a rounded rect (negative inside).
- **`bakeGlassField`** — RGBA pixels (width × height × 4) of the displacement + rim map.
- **`roundedRectPolygon`** — The same rounded rectangle as `roundedRectDistance`, as a CSS `polygon()` for clip-path — needed where the corner is not a circle, which `inset(… round r)` cannot draw. Each corner is the superellipse |x|^n + |y|^n = r^n, walked clockwise from the top-right corner.

**`GlassFieldOptions`**

| Prop | Typ | Bedeutung |
| --- | --- | --- |
| `width` | `number` | Size in (device) pixels of the map to bake. |
| `height` | `number` | – |
| `radius` | `number` | – |
| `bevel` | `number` | Width of the refracting rim in pixels. |
| `exponent?` | `number` | – |
| `inset?` | `number` | Neutral margin around the shape (the optics layer is larger than the glass). |

### `glass/filter.ts`

- **`filterPadding`** — SVG filter graph for liquid glass. Adapted from ALEXalesha/LiquidGlass (index.html: `filterPad`, `filterMarkup`), Copyright (c) 2026 ALEXalesha, MIT License — full text in HERKUNFT.md. Changed: single pass only, the region is the whole optics layer, rim glow masked by the map's blue ring.
- **`glassFilterMarkup`**

**`GlassFilterOptions`**

| Prop | Typ | Bedeutung |
| --- | --- | --- |
| `id` | `string` | – |
| `map` | `string` | Displacement map (data URL). |
| `width` | `number` | – |
| `height` | `number` | – |
| `refraction` | `number` | – |
| `rim` | `number` | 0…1 — strength of the saturated rim glow. |
| `blur?` | `number` | Backdrop blur applied before the filter (for the padding only). |

### `glass/Glass.tsx`

- **`GlassSurface`** — GlasFläche — a panel of liquid glass. The backdrop is blurred lightly, saturated and, where supported, refracted by the rim like a lens; a bright top edge and a soft glare catch the light. Falls back to frosted glass (Safari, Firefox), and to a solid surface with reduced transparency. Use sparingly: every piece costs rendering time on phones.
- **`GlassButton`** — GlasKnopf — the kit Button in glass, with the same press spring. Disabled, it is dimmed (opacity), and a dimmed element cannot show the lens behind it — so it stays frosted then.
- **`GlassBar`** — GlasLeiste — a floating capsule toolbar of glass. Arrow keys (Home / End) move between its controls; Tab enters and leaves it as one stop, landing on the control used last (roving tabindex, WAI-ARIA toolbar pattern).
- Typ `GlassButtonProps = Omit<ButtonProps, 'variant'> & GlassOptions & { glare?: boolean }`

**`GlassSurfaceProps`** (erweitert `ComponentPropsWithRef<'div'>, GlassOptions`)

| Prop | Typ | Bedeutung |
| --- | --- | --- |
| `glare?` | `boolean` | Specular glare follows the pointer. |
| `tone?` | `'regular' \| 'tinted'` | 'regular' is clear; 'tinted' is milkier for text-heavy panels. |

**`GlassBarProps`** (erweitert `GlassSurfaceProps`)

| Prop | Typ | Bedeutung |
| --- | --- | --- |
| `label` | `string` | Accessible name of the toolbar. |

### `glass/support.ts`

- **`supportsRefraction`** — Can this browser refract the backdrop with an SVG filter? Only Blink (Chromium) renders `backdrop-filter: url(#filter)`. Safari and Firefox accept the value when parsing but do not render it, so a parse check alone lies — the engine has to be checked as well (see HERKUNFT.md). On iPhone and iPad every browser, Chrome and Edge included, is WebKit underneath, so a positive Blink token is required and iOS is excluded.

### `glass/useGlassRefraction.ts`

- **`useReducedTransparency`** — Live `prefers-reduced-transparency: reduce`.
- **`useGlassRefraction`** — Gives a glass element real refraction where the browser can do it (Chromium). A backdrop filter only sees the backdrop inside its own box, so the lens runs on an "optics" layer that reaches `pad` px beyond the glass and is clipped back to the glass shape (clip-path) — that margin is what the rim pulls in. Exposes `data-refracting` on the glass; elsewhere, with reduced transparency or `refract: false`, the CSS frosted look stays.

**`GlassOptions`**

| Prop | Typ | Bedeutung |
| --- | --- | --- |
| `refraction?` | `number` | Displacement strength in px (0 turns refraction off). Default 44. |
| `rim?` | `number` | Saturated rim glow 0…1. Default 0.35. |
| `bevel?` | `number` | Width of the refracting edge in px. Default 16. |
| `refract?` | `boolean` | Set false to force the plain frosted look (e.g. while something animates underneath). |

## Overlay-Schicht (`overlay/`)

### `overlay/focus.ts`

- **`tabbables`** — Keyboard-focusable elements inside `root`, in DOM (tab) order.
- **`trapTab`** — Handles Tab / Shift+Tab so focus cycles inside `container`.

### `overlay/inert.ts`

- **`setInertOutside`**

### `overlay/Portal.tsx`

- **`Portal`** — Renders children into their own layer element (`.ui-touch-portal`), which is what the overlay logic keeps interactive while the rest turns inert.

**`PortalProps`**

| Prop | Typ | Bedeutung |
| --- | --- | --- |
| `children` | `ReactNode` | – |
| `container?` | `HTMLElement \| null` | Where to mount; default document.body. Pass an element for contained demos (e.g. a phone frame). |

### `overlay/position.ts`

- **`placePopover`** — Places a popover next to its anchor: below if it fits (or the preferred side if that fits), otherwise the side with more room; horizontally centred on the anchor but kept `margin` px inside the viewport. The transform origin points back at the anchor so the popover grows out of it (Framework7 popover idea, see HERKUNFT.md).

### `overlay/scrollLock.ts`

- **`lockScroll`**

### `overlay/useModal.ts`

- **`useModal`** — Everything a modal overlay needs for accessibility: focus in on open, Tab stays inside, Escape closes (top-most only), background inert, page scroll locked, focus back to the trigger on close.
- **`openModalCount`** — Number of open modal overlays (for tests and nested-sheet logic).

**`ModalOptions`**

| Prop | Typ | Bedeutung |
| --- | --- | --- |
| `open` | `boolean` | – |
| `onClose` | `() => void` | Called for Escape (and by components for scrim taps / swipes). |
| `containerRef` | `RefObject<HTMLElement \| null>` | The dialog element (role="dialog", tabIndex -1). |
| `closeOnEscape?` | `boolean` | Default true — every overlay closes with Escape unless it must block. |
| `initialFocusRef?` | `RefObject<HTMLElement \| null>` | Element to focus on open; default: first focusable, else the dialog. |
| `restoreFocus?` | `boolean` | Return focus to the element that had it before opening. Default true. |
| `inertOutside?` | `boolean` | Make the rest of the page inert (modal). Default true. |
| `lockPageScroll?` | `boolean` | Lock page scroll. Default true. |
| `layerRef?` | `RefObject<HTMLElement \| null>` | Element made "outside-proof" instead of the dialog (e.g. its portal root). |

### `overlay/usePresence.ts`

- **`usePresence`** — Keeps an overlay mounted while its exit animation plays. Call `onExitEnd` from the panel's onAnimationEnd; a timer is the safety net because animationend is not guaranteed (e.g. display changes, reduced motion with near-zero durations, background tabs).
- Typ `PresenceState = 'open' | 'closing' | 'closed'`

## Gesten-Rechnung (`gesture/`)

### `gesture/axisLock.ts`

- **`lockAxis`** — Decides whether a gesture is horizontal or vertical once it moved more than `threshold` px (≈10 px for touch, 2 px for a mouse — Vaul / apple-design). Returns null while undecided.
- **`slopFor`** — Slop per pointer type.

### `gesture/momentum.ts`

- **`project`** — Where would a flicked object come to rest if it decelerated like a scroll view? `decelerationRate` is the per-millisecond velocity factor (0.998 normal, 0.99 snappier). Returns the extra distance. Formula from the apple-design skill / WWDC "Designing Fluid Interfaces".
- **`selectSnapPoint`** — Picks the snap point for a release: the point nearest to the projected resting position — but a clear flick never lands on a point behind the finger. Returns the index into `points`.

**`SnapOptions`**

| Prop | Typ | Bedeutung |
| --- | --- | --- |
| `position` | `number` | Current position (same axis and units as points). |
| `velocity` | `number` | Release velocity, units per second, positive = towards larger values. |
| `points` | `number[]` | – |
| `decelerationRate?` | `number` | – |
| `flickVelocity?` | `number` | Speed above which the flick direction must be respected. Default 300 units/s. |

### `gesture/navigation.ts`

- **`collapseProgress`** — Large title → small title: 0 while the large title is fully visible, 1 once it has scrolled under the bar. The range is capped by what the page can actually scroll, so short pages still collapse completely (Framework7 navbar pitfall, see HERKUNFT.md).
- **`largeTitleScale`** — Pulling past the top grows the large title slightly (anchored left), up to +12 %.
- **`snapCollapse`** — When scrolling stops half-way through the collapse, finish it: returns the scroll position to go to, or null if nothing to do.
- **`materialStretch`** — Horizontal stretch of a moving material (tab-bar lens) from its speed in px/s: fast travel reads as liquid being pulled along. 1 at rest, max 1.4.

### `gesture/pull.ts`

- **`pullOffset`** — Finger distance → content offset: soft from the start, never more than 400 px.
- `PULL_THRESHOLD = 64` — Content offset at which a release starts the refresh.
- `PULL_HOLD = 52` — Offset the content rests at while refreshing (room for the spinner).

### `gesture/rubberband.ts`

- **`rubberband`** — Rubber band: past an edge the element keeps following, but ever more slowly, and never further than `dimension`. Near the edge it follows with slope `constant` (0.55 is the value used by iOS scroll views). Formula from the apple-design skill (see HERKUNFT.md).
- **`rubberbandClamp`** — Clamps `value` to [min, max] with rubber-banded overflow on both sides.

### `gesture/sheet.ts`

- **`resolveDetents`**
- **`sheetProgress`** — 0 while the sheet is at or below the second-largest detent, rising to 1 at the largest one. Drives the scrim and the background push-back, which iOS only shows for the full-height sheet.
- **`backgroundTransform`** — Page behind the sheet: scaled so 13 px show at each side, moved down, rounded (Vaul values, radius 12).
- Typ `Detent = 'small' | 'medium' | 'large' | number | `${number}px``

### `gesture/swipeActions.ts`

- **`swipeDistance`** — Maps the raw finger distance to the row offset.
- **`revealProgress`** — How far action `index` is revealed (0…1). `widths` are ordered from the outer edge inwards: the outermost action is uncovered first, so the buttons pop in one after another (Framework7 iOS swipeout idea).
- **`resolveSwipeRelease`**
- `FULL_SWIPE_RATIO = 0.6` — Fraction of the row width after which a full swipe commits.
- `SWIPE_FLICK_VELOCITY = 300` — Speed (px/s) above which the flick direction decides.

### `gesture/swipeBack.ts`

- **`swipeBackFrame`**
- **`resolveSwipeBack`** — Commit or cancel on release. Unlike a total-time rule, this looks at the release velocity: a flick towards the edge commits, a flick back cancels, otherwise more than half the width commits.
- `SWIPE_BACK_EDGE = 30` — Swipe from the left edge to go back (iOS navigation). The top page follows the finger; the page below starts at -20 % and moves at 1/5 of the speed, with a dim that fades out (Framework7 values).

### `gesture/velocity.ts`

- **`createVelocityTracker`**

## Bewegung (`motion/`)

### `motion/animateSpring.ts`

- **`animateSpring`** — Runs a spring on requestAnimationFrame. Values are computed from elapsed time with the analytic solution, so dropped frames never change the path.

**`SpringAnimationOptions`**

| Prop | Typ | Bedeutung |
| --- | --- | --- |
| `from` | `number` | – |
| `to` | `number` | – |
| `velocity?` | `number` | Initial velocity in units per second, e.g. the finger speed on release. |
| `params` | `SpringParams` | – |
| `onUpdate` | `(value: number, velocity: number) => void` | – |
| `onComplete?` | `() => void` | – |
| `restDelta?` | `number` | Distance to the target that counts as arrived (caller units). Default 0.01. |
| `restSpeed?` | `number` | Speed that counts as stopped (caller units per second). Default 0.1. |
| `reducedMotion?` | `boolean` | Skip the motion and land on the target immediately. |
| `scheduler?` | `FrameScheduler` | – |

### `motion/flip.ts`

- **`flipDelta`** — Transform (with a centre transform-origin) that makes `last` look like `first`.
- **`flipFrame`** — Transform at `progress` (0 = first, 1 = last). Scale interpolates geometrically, which reads as an even change in size. Progress beyond 1 (spring overshoot) is kept.
- **`flipTransform`**
- **`correctedRadius`** — Border radius that stays visually `radius` px while the element is scaled.
- **`boxOf`**

### `motion/presets.ts`

- **`springPreset`**
- Typ `SpringPresetName = keyof typeof springPresets` — Werte: `press`, `snappy`, `smooth`, `bouncy`, `gentle`

### `motion/reducedMotion.ts`

- **`prefersReducedMotion`** — True when the user asked the OS for less motion. Safe during SSR/tests.

### `motion/spring.ts`

- **`springFromPerceptual`** — Converts `duration` + `bounce` into physical spring parameters (mass 1).
- **`dampingRatio`** — ζ — below 1 the spring overshoots, 1 is critical, above 1 it creeps in.
- **`solveSpring`** — Returns a function t ↦ {value, velocity} for a spring released at `from` with `initialVelocity`, pulled towards `to`.
- **`settleDuration`** — Time in seconds until the spring is (and stays) at rest.
- **`springToLinearEasing`** — Samples a 0 → 1 spring into a CSS `linear()` easing string plus the duration (seconds) it has to be paired with. This lets plain CSS transitions move with real spring curves, including overshoot.

**`SettleOptions`**

| Prop | Typ | Bedeutung |
| --- | --- | --- |
| `restDelta?` | `number` | Distance to the target that counts as "arrived". Default 0.001. |
| `restSpeed?` | `number` | Speed that counts as "stopped". Default 0.01 units/s. |
| `maxDuration?` | `number` | Hard upper bound in seconds. Default 10. |

## Glyphen (`icons/`)

### `icons/Glyph.tsx`

- **`Glyph`**
- Typ `GlyphName = keyof typeof paths` — Werte: `chevron-right`, `chevron-left`, `chevron-down`, `plus`, `minus`, `check`, `close`, `heart`, `star`, `play`, `pause`, `skip-back`, `skip-forward`, `search`, `trash`, `archive`, `flag`, `share`, `more`, `bell`, `note`, `info`, `sun`, `moon`, `wifi`, `bolt`, `gear`, `calendar`, `activity`, `person`, `house`, `shuffle`, `repeat`, `clock`, `pencil`, `bookmark`, `grid`, `list`, `sparkle`

**`GlyphProps`** (erweitert `Omit<SVGProps<SVGSVGElement>, 'children'>`)

| Prop | Typ | Bedeutung |
| --- | --- | --- |
| `name` | `GlyphName` | – |
| `filled?` | `boolean` | Filled rendering (for heart / star / play etc.). |
| `size?` | `number` | – |

## Hilfen (`internal/`)

### `internal/cx.ts`

- **`cx`** — Joins class names, skipping falsy values.

### `internal/usePress.ts`

- **`usePress`** — Tracks "finger is down" for press feedback and exposes it as `data-pressed`, so CSS can run the press spring. Unlike `:active` this works the same on iOS Safari, with a mouse and with the keyboard (Space / Enter), and it clears when a scroll steals the pointer.

### `internal/useReducedMotion.ts`

- **`useReducedMotion`** — Live `prefers-reduced-motion: reduce` for JS-driven motion (springs, gestures).
