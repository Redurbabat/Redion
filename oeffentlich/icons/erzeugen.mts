/* ============================================================================
 * oeffentlich/icons/erzeugen.mts — die Symbole erzeugen
 * ----------------------------------------------------------------------------
 * Ein rotes R auf dunklem Grund, in allen Grössen, die Android, Windows und
 * das iPhone verlangen. Alles aus einer Quelle: wer die Farbe ändern will,
 * ändert sie hier einmal und lässt `node oeffentlich/icons/erzeugen.mts`
 * laufen — statt vierzehn Dateien einzeln nachzuziehen.
 *
 * OHNE FREMDE BIBLIOTHEK. Ein PNG ist ein Kopfblock, ein Datenblock und eine
 * Prüfsumme; das Datenblock-Format ist zlib, und dessen einfachste Form
 * („gespeichert", ohne Kompression) sind ein paar Zeilen. Zusammen mit CRC32
 * und Adler-32 sind das rund achtzig Zeilen — deutlich weniger Aufwand als
 * eine Abhängigkeit, die bei jedem Auschecken installiert sein will.
 *
 * WAS DARAN LEICHT SCHIEFGEHT
 *
 * 1. MASKABLE. Android schneidet aus einem maskable-Symbol einen Kreis. Wer
 *    das R gleich gross zeichnet wie im normalen Symbol, bekommt ein
 *    abgeschnittenes R. Deshalb steht es dort auf 60 % — der sichere Bereich
 *    ist ein Kreis mit 80 % Durchmesser.
 *
 * 2. DAS STARTBILD fürs iPhone ist KEIN Symbol. Es füllt den ganzen
 *    Bildschirm und muss exakt die Pixelmasse des Geräts haben, sonst
 *    ignoriert Safari es stillschweigend. 13 Pro Max: 1284 × 2778.
 *
 *   node oeffentlich/icons/erzeugen.mts
 * ==========================================================================*/
import fs from 'node:fs';
import zlib from 'node:zlib';
import pfad from 'node:path';

const HIER = import.meta.dirname;

/* --- Die Farben. Hier ändern, nicht in den Dateien. --------------------- */
const GRUND = [0x19, 0x1a, 0x1e];   /* dasselbe Dunkel wie theme_color      */
const ROT   = [0xe0, 0x3e, 0x3e];   /* --c-red aus dunkel.css               */

/* ==========================================================================
 * Ein PNG schreiben — ohne Paket
 * ========================================================================*/
const crcTabelle = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

const crc32 = (buf: Buffer): number => {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++)
    c = crcTabelle[(c ^ (buf[i] ?? 0)) & 0xff]! ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

const block = (art: string, daten: Buffer): Buffer => {
  const laenge = Buffer.alloc(4);
  laenge.writeUInt32BE(daten.length);
  const koerper = Buffer.concat([Buffer.from(art, 'latin1'), daten]);
  const summe = Buffer.alloc(4);
  summe.writeUInt32BE(crc32(koerper));
  return Buffer.concat([laenge, koerper, summe]);
};

/** Ein Farbwert: rot, grün, blau, jeweils 0 bis 255. */
type Farbe = readonly number[];

/** pixel(x, y) gibt [r, g, b] zurück. */
const schreibePng = (breite: number, hoehe: number,
                     pixel: (x: number, y: number) => Farbe): Buffer => {
  const roh = Buffer.alloc(hoehe * (breite * 3 + 1));
  let i = 0;
  for (let y = 0; y < hoehe; y++) {
    roh[i++] = 0;                      /* Filter „keiner" für diese Zeile */
    for (let x = 0; x < breite; x++) {
      const farbe = pixel(x, y);
      roh[i++] = farbe[0] ?? 0; roh[i++] = farbe[1] ?? 0; roh[i++] = farbe[2] ?? 0;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(breite, 0);
  ihdr.writeUInt32BE(hoehe, 4);
  ihdr[8] = 8;    /* acht Bit je Kanal */
  ihdr[9] = 2;    /* Farbart 2 = RGB   */
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    block('IHDR', ihdr),
    block('IDAT', zlib.deflateSync(roh, { level: 9 })),
    block('IEND', Buffer.alloc(0))
  ]);
};

/* ==========================================================================
 * Das R zeichnen
 * --------------------------------------------------------------------------
 * Kein Text, keine Schrift: eine Schrift, die auf diesem Rechner liegt, liegt
 * nicht auf dem nächsten, und dann sieht das Symbol woanders anders aus. Das R
 * ist deshalb aus Rechtecken, einem Ring und einem Schrägstrich gebaut — in
 * Anteilen der Kastengrösse, damit es in jeder Auflösung gleich aussieht.
 * ========================================================================*/

/* Das R ist nicht symmetrisch: links der Stamm bei 0.20, rechts endet das Bein
   bei etwa 0.751. Seine Mitte liegt damit bei 0.476 und nicht bei 0.5 — im
   fertigen Symbol sieht man das als zu viel Luft auf der rechten Seite. Diese
   Zahl schiebt es zurück in die Mitte. */
const AUSGLEICH = 0.024;

/** Ist der Punkt (px, py) innerhalb des R? Alles in Anteilen von 0 bis 1. */
const imR = (px: number, py: number, dick: number): boolean => {
  px -= AUSGLEICH;
  /* Der senkrechte Stamm links */
  if (px >= 0.20 && px <= 0.20 + dick && py >= 0.14 && py <= 0.86) return true;

  /* Der Bogen oben: ein Ring, aber nur die rechte Hälfte */
  const mx = 0.20 + dick, my = 0.335, rAussen = 0.235, rInnen = 0.235 - dick;
  const dx = px - mx, dy = (py - my) * 1.12;
  const r = Math.sqrt(dx * dx + dy * dy);
  if (px >= mx && r <= rAussen && r >= rInnen) return true;

  /* Der waagerechte Abschluss unter dem Bogen */
  if (px >= 0.20 && px <= 0.545 && py >= 0.50 && py <= 0.50 + dick) return true;

  /* Das Bein: von der Mitte schräg nach rechts unten */
  if (py >= 0.50 && py <= 0.86) {
    const t = (py - 0.50) / 0.36;
    const mitte = 0.40 + t * 0.28;
    if (Math.abs(px - mitte) <= dick * 0.62) return true;
  }
  return false;
};

/**
 * Ein Symbol. `anteil` sagt, wie gross das R im Kasten sein darf — bei
 * maskable weniger, weil Android einen Kreis herausschneidet.
 */
const symbol = (groesse: number, anteil = 0.82, rund = true): Buffer => {
  const dick = 0.115;
  const rand = (1 - anteil) / 2;
  const ecke = groesse * 0.22;          /* abgerundete Ecken wie bei iOS */
  return schreibePng(groesse, groesse, (x: number, y: number) => {
    /* Ecken abrunden — nur beim normalen Symbol, nicht bei maskable:
       dort füllt der Hintergrund die ganze Fläche, weil Android selbst
       zuschneidet. */
    if (rund) {
      const cx = Math.min(x, groesse - 1 - x), cy = Math.min(y, groesse - 1 - y);
      if (cx < ecke && cy < ecke) {
        const dx = ecke - cx, dy = ecke - cy;
        if (dx * dx + dy * dy > ecke * ecke) return [255, 255, 255];
      }
    }
    const px = (x / groesse - rand) / anteil;
    const py = (y / groesse - rand) / anteil;
    return (px >= 0 && px <= 1 && py >= 0 && py <= 1 && imR(px, py, dick)) ? ROT : GRUND;
  });
};

/* Das Startbild: das R in der Mitte eines Bildschirms in Gerätegrösse. */
const startbild = (breite: number, hoehe: number): Buffer => {
  const kasten = Math.round(Math.min(breite, hoehe) * 0.34);
  const links = Math.round((breite - kasten) / 2);
  const oben  = Math.round((hoehe - kasten) / 2);
  const dick = 0.115;
  return schreibePng(breite, hoehe, (x: number, y: number) => {
    const px = (x - links) / kasten, py = (y - oben) / kasten;
    return (px >= 0 && px <= 1 && py >= 0 && py <= 1 && imR(px, py, dick)) ? ROT : GRUND;
  });
};

/* ========================================================================== */
const GROESSEN = [48, 72, 96, 128, 144, 152, 167, 180, 192, 256, 384, 512];
const STARTBILDER: Record<string, [number, number]> = {
  /* Name → [Breite, Höhe] in echten Pixeln, nicht in Punkten. */
  'start-iphone-13-pro-max.png': [1284, 2778],
  'start-iphone-15-pro-max.png': [1290, 2796],
  'start-iphone-13.png':         [1170, 2532],
  'start-iphone-15.png':         [1179, 2556],
  'start-iphone-x.png':          [1125, 2436],
  'start-iphone-xs-max.png':     [1242, 2688],
  'start-iphone-xr.png':         [828, 1792]
};

let n = 0;
GROESSEN.forEach(g => {
  fs.writeFileSync(pfad.join(HIER, `icon-${g}.png`), symbol(g)); n++;
});
[192, 512].forEach(g => {
  /* Maskable: kleiner und ohne runde Ecken — Android schneidet selbst. */
  fs.writeFileSync(pfad.join(HIER, `maskable-${g}.png`), symbol(g, 0.60, false)); n++;
});
[16, 32].forEach(g => {
  fs.writeFileSync(pfad.join(HIER, `favicon-${g}.png`), symbol(g, 0.90)); n++;
});
Object.entries(STARTBILDER).forEach(([datei, [b, h]]) => {
  fs.writeFileSync(pfad.join(HIER, datei), startbild(b, h)); n++;
});

console.log(n + ' Bilder geschrieben — rotes R auf ' +
  '#' + GRUND.map(v => v.toString(16).padStart(2, '0')).join(''));
