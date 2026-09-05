/* ============================================================================
 * core/orb/geometry.js — die Rechnung hinter der Denkkugel
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/core/orb/geometry.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/core/orb/geometry.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mts` meldet es vorher.
 * ----------------------------------------------------------------------------
 * Diese Datei kennt KEIN Canvas, KEIN DOM und KEINE Uhr. Sie bekommt eine
 * Grösse und einen Zeitpunkt und gibt Punkte und Linien zurück — sonst nichts.
 *
 * Der Grund dafür ist nicht Sauberkeit, sondern Prüfbarkeit: eine Animation,
 * die man nur ansehen kann, ist eine Behauptung. Eine, die für t = 1.5 immer
 * dieselben 84 Punkte liefert, lässt sich mit Zahlen prüfen — und §55.3 sagt
 * genau das: ein Bild, wenn man etwas sehen kann, eine Messung, wenn es
 * reines Rechnen ist. Hier ist beides möglich, weil es getrennt ist.
 *
 * Die Technik ist der Bauart von `thinking-orbs` (Jakub Antalik, MIT,
 * https://libraries.dev/orbs.html) abgesehen: Punkte auf einer Kugel,
 * orthografisch abgebildet, nach Tiefe sortiert gezeichnet. Der Code hier ist
 * eigener; das Paket selbst kann Redion nicht laden (§6, §54 — siehe E403).
 * ==========================================================================*/

/** Ein Punkt, fertig abgebildet: Bildkoordinaten, Radius, Tiefe. */
interface OrbDot {
  x: number;
  y: number;
  /** Radius in CSS-Pixeln. */
  r: number;
  /** 0 = ganz hinten, 1 = ganz vorn. Steuert Helligkeit UND Zeichenreihenfolge. */
  depth: number;
}

/** Eine Kante zwischen zwei abgebildeten Punkten. */
interface OrbLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  /** Strichbreite in CSS-Pixeln. */
  w: number;
  depth: number;
}

/**
 * Ein fertiger Augenblick. `dots` ist bereits nach Tiefe sortiert (hinten
 * zuerst), `lines` wird davor gezeichnet. Wer das hier bekommt, muss nichts
 * mehr ausrechnen — er zeichnet die Liste ab.
 */
interface OrbFrame {
  dots: OrbDot[];
  lines: OrbLine[];
}

/** Eine Betriebsart: aus Grösse und Zeit wird ein Augenblick. */
type OrbMode = (size: number, t: number) => OrbFrame;

/* --------------------------------------------------------------------------
 * Kleine Rechenhelfer. Alles absichtlich ohne Zufall: derselbe Zeitpunkt
 * ergibt dasselbe Bild, sonst wäre keine Prüfung möglich.
 * ------------------------------------------------------------------------*/

/* Die Helfer liegen in einem Sammelnamen, nicht einzeln: `lerp` und
   `hash` als globale Namen wären ein Hinterhalt für jede spätere Datei,
   die genauso heissen will. */
const OrbGeometry = (() => {

  const lerp = (a: number, b: number, f: number): number => a + (b - a) * f;
  
  /** Ein fester Hash in [0, 1) — der Ersatz für Math.random(). */
  const hash = (a: number, b: number): number => {
    const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
    return s - Math.floor(s);
  };
  
  /** Weiches Rauschen auf einem Gitter, für Wellen und Bänder. */
  const noise2 = (x: number, y: number): number => {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = hash(xi, yi), b = hash(xi + 1, yi);
    const c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
    return lerp(lerp(a, b, u), lerp(c, d, u), v);
  };
  
  /**
   * Gleichmässige Richtungen auf der Kugel (Fibonacci-Gitter).
   *
   * Der naheliegende Weg — Breitengrad und Längengrad gleichmässig teilen —
   * ballt die Punkte an den Polen zusammen. Man sieht es sofort: zwei helle
   * Flecken oben und unten. Das Fibonacci-Gitter hat das Problem nicht.
   */
  const fibDir = (i: number, n: number): [number, number, number] => {
    const y = 1 - (i / Math.max(n - 1, 1)) * 2;      /* von +1 nach -1 */
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const phi = i * 2.399963229728653;               /* der goldene Winkel */
    return [Math.cos(phi) * r, y, Math.sin(phi) * r];
  };
  
  /** Ein Abbilder: Kugelpunkt hinein, Bildpunkt und Tiefe heraus. */
  type OrbProjector = (x: number, y: number, z: number) => [number, number, number];
  
  /**
   * Drehung um die Hochachse, Neigung nach vorn, dann orthografisch abbilden.
   * Perspektive wäre bei 64 px verschwendet — man sähe sie nicht, und sie
   * würde die Punkte am Rand verzerren.
   */
  const makeProj = (
    yaw: number, tilt: number, cx: number, cy: number, scale: number,
  ): OrbProjector => {
    const cy1 = Math.cos(yaw), sy1 = Math.sin(yaw);
    const ct = Math.cos(tilt), st = Math.sin(tilt);
    return (x, y, z) => {
      const x1 = x * cy1 + z * sy1;
      const z1 = -x * sy1 + z * cy1;
      const y2 = y * ct - z1 * st;
      const z2 = y * st + z1 * ct;
      return [cx + x1 * scale, cy + y2 * scale, (z2 + 1) / 2];
    };
  };
  
  /**
   * Die Punktgrössen sind für 64 px abgestimmt. Bei 20 px linear zu
   * verkleinern ergäbe Punkte von unter einem halben Pixel — sichtbar wäre
   * nur noch ein grauer Fleck. Deshalb unterlinear.
   */
  const radiusScale = (size: number, pow = 0.6): number =>
    Math.pow(size / 64, pow);
  
  /**
   * Aus rohen Punkten wird ein fertiger Augenblick: unsichtbare weg, zu kleine
   * auf ein Mindestmass, und nach Tiefe sortiert.
   *
   * Die Sortierung gehört HIERHER und nicht in den Maler. Sonst müsste jeder
   * Maler sie wiederholen — und der erste, der es vergisst, zeichnet die
   * Rückseite über die Vorderseite, was aussieht wie ein Flackern.
   */
  const finalize = (dots: OrbDot[], lines: OrbLine[], rMin = 0.35): OrbFrame => {
    const sichtbar = dots.filter(d => d.r > 0.01)
      .map(d => (d.r < rMin ? { ...d, r: rMin } : d));
    sichtbar.sort((a, b) => a.depth - b.depth);
    return { dots: sichtbar, lines };
  };

  return { lerp, hash, noise2, fibDir, makeProj, radiusScale, finalize };
})();

(window as any).OrbGeometry = OrbGeometry;
