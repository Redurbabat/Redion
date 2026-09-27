import './Glyph.css'
import type { SVGProps } from 'react'

/**
 * The kit's own small glyph set: simple geometric strokes on a 24×24 grid,
 * drawn for this kit (no system symbols or icon fonts are copied).
 * Glyphs are decorative (`aria-hidden`); the control around them carries
 * the accessible name.
 */
const paths = {
  'chevron-right': <path d="M9.5 5.5 16 12l-6.5 6.5" />,
  'chevron-left': <path d="M14.5 5.5 8 12l6.5 6.5" />,
  'chevron-down': <path d="M5.5 9.5 12 16l6.5-6.5" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  close: <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />,
  heart: (
    <path d="M12 19.5s-7-4.3-8.6-8.8C2.3 7.6 4.3 4.8 7.3 4.8c2 0 3.6 1.1 4.7 2.9 1.1-1.8 2.7-2.9 4.7-2.9 3 0 5 2.8 3.9 5.9C19 15.2 12 19.5 12 19.5Z" />
  ),
  star: <path d="m12 3.8 2.5 5.2 5.7.8-4.1 4 1 5.6-5.1-2.7-5.1 2.7 1-5.6-4.1-4 5.7-.8Z" />,
  play: <path d="M8 5.2v13.6L18.6 12Z" data-fill="" />,
  pause: <path d="M7.5 5h3v14h-3zM13.5 5h3v14h-3z" data-fill="" />,
  'skip-back': <path d="M6.5 6v12M18 6.5 9.5 12l8.5 5.5Z" />,
  'skip-forward': <path d="M17.5 6v12M6 6.5l8.5 5.5L6 17.5Z" />,
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="5.8" />
      <path d="m15 15 4.8 4.8" />
    </>
  ),
  trash: <path d="M4.5 7h15M9.5 7V4.8h5V7M6.8 7l.9 12.2h8.6L17.2 7M10 10.5v5.5M14 10.5v5.5" />,
  archive: <path d="M4 5h16v4H4ZM5.5 9v10h13V9M10 13h4" />,
  flag: <path d="M6 20.5V4.5M6 4.5h11l-2.2 4 2.2 4H6" />,
  share: <path d="M12 3.5v11M8 7.2l4-3.7 4 3.7M6 11v8.5h12V11" />,
  more: (
    <>
      <circle cx="6" cy="12" r="1.4" data-fill="" />
      <circle cx="12" cy="12" r="1.4" data-fill="" />
      <circle cx="18" cy="12" r="1.4" data-fill="" />
    </>
  ),
  bell: <path d="M6.5 16.5v-5a5.5 5.5 0 0 1 11 0v5l1.5 2h-14ZM10 20.2a2.2 2.2 0 0 0 4 0" />,
  note: (
    <>
      <path d="M9 17.5V6.5l10-2v11" />
      <circle cx="6.8" cy="17.5" r="2.3" />
      <circle cx="16.8" cy="15.5" r="2.3" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5.5M12 7.6v.2" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="3.6" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" />
    </>
  ),
  moon: <path d="M19.5 14.5A7.5 7.5 0 0 1 9.5 4.5a7.5 7.5 0 1 0 10 10Z" />,
  wifi: <path d="M3.5 9.5a12 12 0 0 1 17 0M6.5 12.7a7.6 7.6 0 0 1 11 0M9.5 15.8a3.4 3.4 0 0 1 5 0M12 19h.01" />,
  bolt: <path d="M13 3 5.5 13.5H12L11 21l7.5-10.5H12Z" />,
  // Common app glyphs: tab bars, settings, media, editing.
  // Eight teeth around a hub; tips and roots are straight (as arcs they would sag < 0.2).
  // The hub is a second subpath filled even-odd, so the filled gear keeps it as a hole.
  gear: (
    <path
      d="M10.7 5.5l.3-2h2l.3 2 2.4 1 1.6-1.3 1.5 1.5-1.3 1.6 1 2.4 2 .3v2l-2 .3-1 2.4 1.3 1.6-1.5 1.5-1.6-1.3-2.4 1-.3 2h-2l-.3-2-2.4-1-1.6 1.3-1.5-1.5 1.3-1.6-1-2.4-2-.3v-2l2-.3 1-2.4-1.3-1.6 1.5-1.5 1.6 1.3ZM14.3 12a2.3 2.3 0 1 1-4.6 0 2.3 2.3 0 1 1 4.6 0Z"
      fillRule="evenodd"
    />
  ),
  person: (
    <>
      <circle cx="12" cy="7.6" r="3.5" />
      <path d="M5 20c.8-3.6 3.6-5.8 7-5.8s6.2 2.2 7 5.8" />
    </>
  ),
  house: <path d="M4.5 10 12 4l7.5 6v8.5a1 1 0 0 1-1 1H15V14H9v5.5H5.5a1 1 0 0 1-1-1Z" />,
  calendar: <path d="M6 5.5h12a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7.5a2 2 0 0 1 2-2ZM4 10h16M8.5 3.5v4M15.5 3.5v4" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2.2" />
    </>
  ),
  activity: <path d="M3 12h4l2.5-5.5 4 11 2.5-5.5H21" />,
  shuffle: (
    <path d="M3.5 7h2.8c2 0 3.3 1 4.4 2.9l2.6 4.2c1.1 1.9 2.4 2.9 4.4 2.9h2.8M3.5 17h2.8c1.5 0 2.6-.6 3.6-1.8M14.1 8.8c1-1.2 2.1-1.8 3.6-1.8h2.8M18 4.3 20.5 7 18 9.7M18 14.3l2.5 2.7-2.5 2.7" />
  ),
  repeat: <path d="M4 11.5V10a3.5 3.5 0 0 1 3.5-3.5H20M17 3.5l3 3-3 3M20 12.5V14a3.5 3.5 0 0 1-3.5 3.5H4M7 20.5l-3-3 3-3" />,
  pencil: <path d="m4.5 19.5 1-4L15.8 5.2a2.05 2.05 0 0 1 2.9 2.9L8.5 18.5ZM13.3 7.7l3 3" />,
  bookmark: <path d="M7 4h10a1 1 0 0 1 1 1v15l-6-4.3L6 20V5a1 1 0 0 1 1-1Z" />,
  grid: (
    <>
      <rect x="4.5" y="4.5" width="5.5" height="5.5" rx="1.5" />
      <rect x="14" y="4.5" width="5.5" height="5.5" rx="1.5" />
      <rect x="4.5" y="14" width="5.5" height="5.5" rx="1.5" />
      <rect x="14" y="14" width="5.5" height="5.5" rx="1.5" />
    </>
  ),
  list: <path d="M9 6.5h10.5M9 12h10.5M9 17.5h10.5M4.5 6.5h.01M4.5 12h.01M4.5 17.5h.01" />,
  sparkle: (
    <path d="M12 3.5c.7 4.6 3.9 7.8 8.5 8.5-4.6.7-7.8 3.9-8.5 8.5-.7-4.6-3.9-7.8-8.5-8.5 4.6-.7 7.8-3.9 8.5-8.5Z" />
  ),
} as const

export type GlyphName = keyof typeof paths

/**
 * Glyphs without a filled form: filled lines and arrows get wedges at their bends, and a filled face buries
 * the clock's hands or the info mark. `filled` leaves them outlined.
 */
const outlineOnly: ReadonlySet<GlyphName> = new Set<GlyphName>([
  'chevron-right',
  'chevron-left',
  'chevron-down',
  'check',
  'info',
  'wifi',
  'clock',
  'calendar',
  'activity',
  'shuffle',
  'repeat',
  'list',
])

export interface GlyphProps extends Omit<SVGProps<SVGSVGElement>, 'children'> {
  name: GlyphName
  /** Filled rendering (heart, star, bookmark …); glyphs with no filled form (arrows, lines, clock) stay outlined. */
  filled?: boolean
  size?: number
}

/** One glyph of the kit's set, decorative (`aria-hidden`); `glyphNames` lists every name. */
export function Glyph({ name, filled = false, size = 24, className, ...rest }: GlyphProps) {
  return (
    <svg
      className={className ? `ui-touch-glyph ${className}` : 'ui-touch-glyph'}
      data-filled={(filled && !outlineOnly.has(name)) || undefined}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {paths[name]}
    </svg>
  )
}

/** Every glyph name, in drawing order: for docs, pickers and tests. */
export const glyphNames = Object.keys(paths) as GlyphName[]
