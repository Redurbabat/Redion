/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/core/gfx/shapes.ts (npm run bauen:ts). */
/* ============================================================================
 * core/gfx/shapes.ts — EIN Zeichner für die Formen aller Flächen
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/core/gfx/shapes.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/core/gfx/shapes.js`; `pruefungen/lauf/test105.mts` meldet es vorher.
 * ----------------------------------------------------------------------------
 * WARUM ER IM KERN STEHT (E693). Das Whiteboard zeichnet Formen seit E138,
 * und mit E690 bekam die Seite eine eigene Fläche. Der zweite Zeichner wäre
 * eine Kopie von hundertzwanzig Zeilen gewesen — und zwei Kopien derselben
 * Zeichnung laufen auseinander. Man sieht es nicht beim Lesen, sondern
 * irgendwann daran, dass ein Pfeil auf der einen Fläche eine Spitze hat und
 * auf der anderen nicht (§8). Dasselbe Muster wie `GfxHistory` (E687) und
 * `GfxToolbar` (E689): was zwei Flächen gemeinsam haben, wohnt hier.
 *
 * ER KENNT KEINE FLÄCHE. Kein `Store`, kein `Register`, kein `App`, keine
 * Dateiablage, keine Klassennamen einer Fläche. Was er über die Welt wissen
 * muss, bekommt er als Angabe mit — die Kennung der Pfeilmarke und, für
 * Bilder, eine Funktion, die eine Adresse liefert. `test575 §1` hält das.
 *
 * DAS FORMAT IST DAS BESTEHENDE. Die Felder stehen so in jedem Whiteboard
 * und in `doku/REDION-FORMAT.md`; sie zu ändern wäre eine Datenmigration
 * (§53.3). Deshalb auch `farbe`, `pts` und `art` statt englischer Namen.
 * ==========================================================================*/

/** Eine Form, wie sie in `shapes` eines Blocks steht. Absichtlich lose:
 *  die Arten unterscheiden sich in ihren Feldern, und ein Typ, der so tut,
 *  als wären sie gleich, wäre eine falsche Behauptung. */
interface GfxForm {
  id: string;
  art: string;
  farbe?: string;
  [feld: string]: unknown;
}

interface ZeichenAngaben {
  /** Kennung des `<marker>` für Pfeilspitzen — ohne `url(#…)`. */
  pfeilMarke?: string;
  /** Adresse eines Bildes. `undefined` heisst „wird noch geholt",
   *  `null` heisst „gibt es nicht mehr". */
  bildAdresse?: (dateiId: string) => string | null | undefined;
  /** Wird gerufen, wenn ein Bild noch keine Adresse hat. */
  bildHolen?: (dateiId: string) => void;
  /** Strichbreite in Flächeneinheiten. Vorgabe 2,5 wie im Whiteboard. */
  strich?: number;
}

const GfxShapes = (() => {

  /* DIE ACHT FARBEN EINER FLAECHE (E693, aus dem Whiteboard hierher).
     Eine Liste von PAAREN [Farbe, Name] - der Name steht darin, weil
     Paragraph 38 sagt, dass keine Auskunft nur ueber Farbe laufen darf: der
     Knopf im Farbmenue braucht ein Wort fuer den Vorleser. Die Werte sind
     die des Whiteboards seit E414; sie zu aendern hiesse, bestehende
     Zeichnungen umzufaerben. */
  const PALETTE: ReadonlyArray<[string, string]> = [
    ['#529cca', 'Blau'], ['#4dab9a', 'Gruen'], ['#ffa344', 'Orange'],
    ['#ff7369', 'Rot'],  ['#9a6dd7', 'Violett'], ['#e255a1', 'Rosa'],
    ['#ffdc49', 'Gelb'], ['#9b9a97', 'Grau'],
  ];

  const NS = 'http://www.w3.org/2000/svg';

  const sv = (name: string, attrs: Record<string, unknown> = {}): any => {
    const el = document.createElementNS(NS, name);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
    return el;
  };

  /* TINTE FÜR DEN HELLEN GRUND (E705): `stroke`/`fill` bleibt die
     gespeicherte Farbe (E414, E693); daneben `--tinte-hell`, derselbe Ton
     mit 4,6 : 1 auf hellem Grund, den nur das helle Thema nimmt
     (grund.css). Zettel behalten ihre Füllung. */
  const tinte = (el: any, rolle: 'strich' | 'schrift', farbe: string): void => {
    if (typeof Farben === 'undefined' || !Farben.parse(farbe)) return;
    const hell = Farben.inkOnLight(farbe);
    if (!hell || hell === Farben.toHex(Farben.parse(farbe) ?? [0, 0, 0])) return;
    el.setAttribute('data-tinte', rolle);
    el.style.setProperty('--tinte-hell', hell);
  };

  const zahl = (roh: unknown, ersatz = 0): number => {
    const n = Number(roh);
    return Number.isFinite(n) ? n : ersatz;
  };

  /* ------------------------------------------------------------------------
   * Der Platzbedarf einer Form — für „alles ins Bild" und für Verbindungen.
   * Jede Art rechnet anders, und `text` lässt sich nur schätzen; das reicht,
   * weil beides nur Anhaltspunkte braucht.
   * ----------------------------------------------------------------------*/
  const rahmenVon = (s: any): { x: number; y: number; w: number; h: number } => {
    if (s?.art === 'stift') {
      const pts: any[] = Array.isArray(s.pts) ? s.pts : [];
      if (!pts.length) return { x: 0, y: 0, w: 0, h: 0 };
      const xs = pts.map((q: any) => zahl(q?.[0])), ys = pts.map((q: any) => zahl(q?.[1]));
      const x = Math.min(...xs), y = Math.min(...ys);
      return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
    }
    if (s?.art === 'text')
      return { x: zahl(s.x), y: zahl(s.y) - 14,
               w: Math.max(20, String(s.text || '').length * 8), h: 20 };
    const x = zahl(s?.x), y = zahl(s?.y), w = zahl(s?.w), h = zahl(s?.h);
    return { x: Math.min(x, x + w), y: Math.min(y, y + h), w: Math.abs(w), h: Math.abs(h) };
  };

  /** Der Text einer Haftnotiz auf Zeilen verteilt. */
  const zeilenUmbruch = (text: string, breite: number): string[] => {
    const proZeile = Math.max(6, Math.floor(breite / 7.4));
    const worte = String(text).split(/\s+/);
    const out: string[] = []; let zeile = '';
    worte.forEach(x => {
      if ((zeile + ' ' + x).trim().length > proZeile) { out.push(zeile.trim()); zeile = x; }
      else zeile += ' ' + x;
    });
    if (zeile.trim()) out.push(zeile.trim());
    return out.slice(0, 8);
  };

  /**
   * Die Pfeilspitze anlegen — einmal je Fläche, in deren `<defs>`.
   *
   * Sie muss eine EIGENE Kennung je Fläche haben: zwei Flächen im selben
   * Dokument teilen sich sonst einen Marker, und wer die erste entfernt,
   * nimmt der zweiten die Spitze mit.
   */
  const pfeilMarke = (defs: any, kennung: string, farbe = 'context-stroke'): any => {
    /* DIE ZAHLEN SIND DIE DES WHITEBOARDS, nicht schönere. Ein Umzug in den
       Kern darf das Aussehen nicht ändern — sonst ist es kein Umzug,
       sondern eine stille Gestaltungsänderung, die niemand bestellt hat.
       `context-stroke` färbt die Spitze wie den Strich, an dem sie hängt. */
    const m = sv('marker', {
      id: kennung, markerWidth: 9, markerHeight: 9,
      refX: 8, refY: 3, orient: 'auto'
    });
    m.appendChild(sv('path', { d: 'M0,0 L9,3 L0,6 z', fill: farbe }));
    defs.appendChild(m);
    return m;
  };

  /**
   * Eine Form als SVG.
   *
   * Gibt IMMER ein Element zurück, auch bei einer unbekannten Art — dann
   * eine leere Gruppe. Eine unbekannte Art ist der Block eines Menschen mit
   * einer neueren Fassung (§18: unbekannte Blocktypen nicht löschen); sie
   * darf nichts zeichnen, aber auch nichts werfen.
   */
  const zeichne = (s: any, o: ZeichenAngaben = {}): any => {
    if (!s || typeof s !== 'object') return sv('g');
    const strich = o.strich ?? 2.5;
    const farbe = String(s.farbe || 'currentColor');

    if (s.art === 'stift' || s.art === 'linie' || s.art === 'pfeil') {
      const pts: any[] = Array.isArray(s.pts) ? s.pts : [];
      /* DIESELBE LINIE WIE AUF DEM BLATT (E704): durch die Mittelpunkte
         gebogen (`InkGeometry.path`, §8) — auch jeder alte Tafelstrich. */
      const kern = (globalThis as any).InkGeometry;
      const d = s.art === 'stift'
        ? (!pts.length ? ''
          : kern && typeof kern.path === 'function' && pts.length >= 3
            ? String(kern.path(pts.map((q: any) => [zahl(q?.[0]), zahl(q?.[1])])))
            : 'M' + pts.map((q: any) => zahl(q?.[0]) + ' ' + zahl(q?.[1])).join(' L'))
        : `M${zahl(s.x)} ${zahl(s.y)} L${zahl(s.x) + zahl(s.w)} ${zahl(s.y) + zahl(s.h)}`;
      const p = sv('path', {
        d, stroke: farbe, 'stroke-width': strich, fill: 'none',
        'stroke-linecap': 'round', 'stroke-linejoin': 'round'
      });
      if (s.art === 'pfeil' && o.pfeilMarke) p.setAttribute('marker-end', `url(#${o.pfeilMarke})`);
      p.dataset.sid = s.id;
      tinte(p, 'strich', farbe);
      /* EIN STRICH IST ZWEIEINHALB PIXEL BREIT — mit dem Finger trifft man
         ihn nicht. Darunter liegt deshalb derselbe Pfad noch einmal, 16 px
         breit und durchsichtig: er fängt den Griff, malt aber nichts. */
      const fang = sv('path', {
        d, stroke: 'transparent', 'stroke-width': 16,
        fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round'
      });
      fang.dataset.sid = s.id;
      const gruppe = sv('g');
      gruppe.appendChild(fang);
      gruppe.appendChild(p);
      return gruppe;
    }

    if (s.art === 'rechteck' || s.art === 'notiz') {
      const g = sv('g');
      const x = Math.min(zahl(s.x), zahl(s.x) + zahl(s.w));
      const y = Math.min(zahl(s.y), zahl(s.y) + zahl(s.h));
      const r = sv('rect', {
        x, y, width: Math.abs(zahl(s.w)), height: Math.abs(zahl(s.h)),
        rx: s.art === 'notiz' ? 3 : 5,
        fill: s.art === 'notiz' ? farbe : 'none', stroke: farbe, 'stroke-width': 2,
        'fill-opacity': s.art === 'notiz' ? .85 : 1,
        /* EIN RECHTECK OHNE FÜLLUNG NIMMT KEINE KLICKS AN (E144). SVG trifft
           standardmässig nur, was GEMALT ist — bei `fill: none` ist das
           allein der zwei Pixel breite Strich. „Auswählen und verschieben"
           ging deshalb nur, wenn man die Kante traf; in der Mitte griff man
           durch die Form hindurch ins Raster. Gemessen mit
           `elementFromPoint` mitten im Rechteck: es kam der Hintergrund
           zurück, nicht die Form. */
        'pointer-events': 'all'
      });
      r.dataset.sid = s.id;
      if (s.art === 'rechteck') tinte(r, 'strich', farbe);
      g.appendChild(r);
      if (s.text) {
        const t = sv('text', {
          x: x + 10, y: y + 22,
          fill: s.art === 'notiz' ? '#1c1c1c' : farbe, 'font-size': 14
        });
        if (s.art !== 'notiz') tinte(t, 'schrift', farbe);
        zeilenUmbruch(String(s.text), Math.abs(zahl(s.w)) - 18).forEach((z, i) => {
          const ts = sv('tspan', { x: x + 10, dy: i ? 18 : 0 });
          ts.textContent = z;
          t.appendChild(ts);
        });
        g.appendChild(t);
      }
      return g;
    }

    if (s.art === 'bild') {
      /* DAS BILD LIEGT IN DER DATEIABLAGE, NICHT IN DEN FORMEN (§14). In
         `shapes` steht nur die Kennung; die Adresse holt die Fläche und
         reicht sie herein. Ein Bild als Data-URL in `shapes` wäre der kurze
         Weg gewesen — er bläht jeden Block, jede Sicherung und jeden
         Versionsstand um die volle Bildgrösse auf. */
      const dateiId = String(s.dateiId || '');
      const bekannt = o.bildAdresse ? o.bildAdresse(dateiId) : null;
      if (bekannt === undefined && dateiId) o.bildHolen?.(dateiId);
      const rahmen = {
        x: Math.min(zahl(s.x), zahl(s.x) + zahl(s.w)),
        y: Math.min(zahl(s.y), zahl(s.y) + zahl(s.h)),
        w: Math.abs(zahl(s.w)) || 160, h: Math.abs(zahl(s.h)) || 120
      };
      if (!bekannt) {
        const platz = sv('g');
        platz.appendChild(sv('rect', { x: rahmen.x, y: rahmen.y, width: rahmen.w, height: rahmen.h,
                                       rx: 5, fill: 'none', stroke: farbe, 'stroke-width': 2,
                                       'stroke-dasharray': '5 4' }));
        const wort = sv('text', { x: rahmen.x + rahmen.w / 2, y: rahmen.y + rahmen.h / 2,
                                  fill: farbe, 'font-size': 13, 'text-anchor': 'middle' });
        wort.textContent = bekannt === null ? 'Bild fehlt' : 'Bild lädt …';
        platz.appendChild(wort);
        platz.dataset.sid = s.id;
        return platz;
      }
      const bild = sv('image', { x: rahmen.x, y: rahmen.y, width: rahmen.w, height: rahmen.h,
                                 preserveAspectRatio: 'xMidYMid meet' });
      bild.setAttribute('href', bekannt);
      bild.dataset.sid = s.id;
      return bild;
    }

    if (s.art === 'ellipse') {
      const e = sv('ellipse', {
        cx: zahl(s.x) + zahl(s.w) / 2, cy: zahl(s.y) + zahl(s.h) / 2,
        rx: Math.abs(zahl(s.w) / 2), ry: Math.abs(zahl(s.h) / 2),
        fill: 'none', stroke: farbe, 'stroke-width': 2,
        'pointer-events': 'all'   /* wie beim Rechteck, siehe dort */
      });
      e.dataset.sid = s.id;
      tinte(e, 'strich', farbe);
      return e;
    }

    if (s.art === 'text') {
      const t = sv('text', { x: zahl(s.x), y: zahl(s.y), fill: farbe,
                             'font-size': 17, 'font-weight': 500 });
      t.textContent = String(s.text || '');
      t.dataset.sid = s.id;
      tinte(t, 'schrift', farbe);
      return t;
    }

    /* Unbekannte Art: nichts zeichnen, nichts werfen (§18). */
    const leer = sv('g');
    leer.dataset.sid = s.id;
    return leer;
  };

  return { zeichne, rahmenVon, zeilenUmbruch, pfeilMarke, sv, PALETTE };
})();

(window as any).GfxShapes = GfxShapes;
