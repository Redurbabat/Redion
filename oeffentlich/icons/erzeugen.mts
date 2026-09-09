/* ============================================================================
 * oeffentlich/icons/erzeugen.mts — die Symbole erzeugen
 * ----------------------------------------------------------------------------
 * EINE QUELLE, siebzehn Dateien: `marke.png` ist Redurs Marke in 512 × 512,
 * und alles andere wird daraus gerechnet. Wer die Marke wechselt, tauscht
 * diese eine Datei und lässt
 *
 *   node oeffentlich/icons/erzeugen.mts
 *
 * laufen — statt siebzehn Symbole einzeln nachzuziehen und die achtzehnte
 * (`favicon.ico`) zu vergessen. Genau das war bis E525 der Zustand: die .ico
 * hatte gar keinen Erzeuger.
 *
 * OHNE FREMDE BIBLIOTHEK. Ein PNG ist Signatur, Blöcke, zlib und eine
 * Prüfsumme; `zlib` liegt in Node. Lesen, Rechnen und Schreiben sind
 * zusammen rund zweihundert Zeilen — weniger Aufwand als eine Abhängigkeit,
 * die bei jedem Auschecken installiert sein will, und vor allem: sie läuft
 * auch dann noch, wenn `sharp` das nächste Mal seine Binärdatei nicht findet.
 *
 * WAS DARAN LEICHT SCHIEFGEHT
 *
 * 1. MASKABLE. Android schneidet aus einem maskable-Symbol einen Kreis. Die
 *    Marke füllt ihre Kachel bis an den Rand; unverkleinert wäre sie rundum
 *    angeschnitten. Deshalb sitzt sie dort auf 78 % in einem schwarzen Feld
 *    — der sichere Bereich ist ein Kreis mit 80 % Durchmesser.
 *
 * 2. DAS STARTBILD fürs iPhone ist KEIN Symbol. Es füllt den ganzen
 *    Bildschirm und muss exakt die Pixelmasse des Geräts haben, sonst
 *    ignoriert Safari es stillschweigend. 13 Pro Max: 1284 × 2778.
 *
 * 3. VERKLEINERN OHNE VORMULTIPLIZIERTES ALPHA gibt an den runden Ecken
 *    einen dunklen Saum: dort mitteln sich schwarze Punkte mit Deckung 0
 *    in die Farbe hinein, obwohl sie unsichtbar sein sollten. Deshalb wird
 *    vor dem Mitteln mit der Deckung multipliziert und danach geteilt.
 *
 * 4. IN EINEM SPRUNG VERKLEINERN verliert feine Struktur. Ein Kastenfilter
 *    über den ganzen Quellbereich mittelt jeden Quellpunkt genau einmal —
 *    das ist bei 512 → 16 kein Detailverlust, sondern der richtige
 *    Mittelwert. Bilineares Abtasten würde 31 von 32 Punkten überspringen.
 * ==========================================================================*/
import fs from 'node:fs';
import zlib from 'node:zlib';
import pfad from 'node:path';

const HIER = import.meta.dirname;

/** Der Grund hinter der Marke: schwarz wie in der Vorlage. */
const GRUND = [0x00, 0x00, 0x00, 0xff];

/* ==========================================================================
 * Ein Bild im Arbeitsspeicher
 * ========================================================================*/
type Bild = { breite: number; hoehe: number; punkte: Uint8ClampedArray };

/* ==========================================================================
 * PNG lesen
 * --------------------------------------------------------------------------
 * Nur so viel, wie diese eine Quelldatei braucht: acht Bit je Kanal, nicht
 * verschränkt, Farbart 2 (RGB) oder 6 (RGB + Alpha). Alles andere wird
 * abgelehnt statt falsch gelesen — eine stillschweigend falsch entpackte
 * Marke wäre schlimmer als ein Abbruch.
 * ========================================================================*/
const lesePng = (datei: string): Bild => {
  const b = fs.readFileSync(datei);
  const signatur = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (!b.subarray(0, 8).equals(signatur)) throw new Error(datei + ' ist kein PNG.');

  let i = 8, breite = 0, hoehe = 0, tiefe = 0, farbart = 0;
  const teile: Buffer[] = [];
  while (i < b.length) {
    const laenge = b.readUInt32BE(i);
    const art = b.subarray(i + 4, i + 8).toString('latin1');
    const daten = b.subarray(i + 8, i + 8 + laenge);
    if (art === 'IHDR') {
      breite = daten.readUInt32BE(0); hoehe = daten.readUInt32BE(4);
      tiefe = daten[8]!; farbart = daten[9]!;
      if (daten[12] !== 0) throw new Error(datei + ' ist verschränkt — nicht unterstützt.');
    } else if (art === 'IDAT') teile.push(Buffer.from(daten));
    else if (art === 'IEND') break;
    i += 12 + laenge;
  }
  if (tiefe !== 8 || (farbart !== 2 && farbart !== 6))
    throw new Error(datei + `: Tiefe ${tiefe}, Farbart ${farbart} — gebraucht wird 8 und 2 oder 6.`);

  const kanaele = farbart === 6 ? 4 : 3;
  const roh = zlib.inflateSync(Buffer.concat(teile));
  const zeile = breite * kanaele;
  const punkte = new Uint8ClampedArray(breite * hoehe * 4);
  const vorher = Buffer.alloc(zeile);
  const jetzt = Buffer.alloc(zeile);

  let q = 0;
  for (let y = 0; y < hoehe; y++) {
    const filter = roh[q++]!;
    roh.copy(jetzt, 0, q, q + zeile); q += zeile;
    for (let x = 0; x < zeile; x++) {
      const a = x >= kanaele ? jetzt[x - kanaele]! : 0;   /* links   */
      const c = vorher[x]!;                               /* oben    */
      const d = x >= kanaele ? vorher[x - kanaele]! : 0;  /* schräg  */
      let wert = jetzt[x]!;
      if (filter === 1) wert += a;
      else if (filter === 2) wert += c;
      else if (filter === 3) wert += (a + c) >> 1;
      else if (filter === 4) {
        const p = a + c - d, pa = Math.abs(p - a), pb = Math.abs(p - c), pc = Math.abs(p - d);
        wert += (pa <= pb && pa <= pc) ? a : (pb <= pc ? c : d);
      } else if (filter !== 0) throw new Error(datei + ': unbekannter Filter ' + filter);
      jetzt[x] = wert & 0xff;
    }
    for (let x = 0; x < breite; x++) {
      const s = x * kanaele, z = (y * breite + x) * 4;
      punkte[z] = jetzt[s]!; punkte[z + 1] = jetzt[s + 1]!; punkte[z + 2] = jetzt[s + 2]!;
      punkte[z + 3] = kanaele === 4 ? jetzt[s + 3]! : 255;
    }
    jetzt.copy(vorher);
  }
  return { breite, hoehe, punkte };
};

/* ==========================================================================
 * PNG schreiben
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

/**
 * Ein Bild als PNG.
 *
 * `deckend` schreibt Farbart 2 statt 6 und spart damit ein Viertel: die
 * Startbilder haben keine durchsichtige Stelle, und sieben Vollbilder in
 * Gerätegrösse sind der grösste Posten im ganzen Verzeichnis.
 */
const schreibePng = (bild: Bild, deckend = false): Buffer => {
  const k = deckend ? 3 : 4;
  const zeile = bild.breite * k;
  const roh = Buffer.alloc(bild.hoehe * (zeile + 1));

  /* JEDE ZEILE BEKOMMT DEN FILTER, DER SIE AM KLEINSTEN MACHT.
     Hier stand bis E525 fest die 0 („keiner"). Bei einem gezeichneten R aus
     drei Farben war das gleichgültig; bei Redurs Marke — Fotografie mit Korn
     — kostete es das Dreifache: icon-512 wog 480 KB. Die Regel ist die aus
     der PNG-Empfehlung: den Filter nehmen, dessen Zeile die kleinste Summe
     der Beträge hat, jeden Wert als Zahl von -128 bis 127 gelesen. */
  const roheZeile = Buffer.alloc(zeile);
  const vorherige = Buffer.alloc(zeile);
  const versuch = [0, 1, 2, 3, 4].map(() => Buffer.alloc(zeile));

  let i = 0;
  for (let y = 0; y < bild.hoehe; y++) {
    for (let x = 0; x < bild.breite; x++) {
      const z = (y * bild.breite + x) * 4, s = x * k;
      roheZeile[s] = bild.punkte[z]!; roheZeile[s + 1] = bild.punkte[z + 1]!;
      roheZeile[s + 2] = bild.punkte[z + 2]!;
      if (!deckend) roheZeile[s + 3] = bild.punkte[z + 3]!;
    }
    let bester = 0, kleinste = Infinity;
    for (let f = 0; f <= 4; f++) {
      const ziel = versuch[f]!;
      let summe = 0;
      for (let x = 0; x < zeile; x++) {
        const a = x >= k ? roheZeile[x - k]! : 0;    /* links  */
        const b = vorherige[x]!;                     /* oben   */
        const c = x >= k ? vorherige[x - k]! : 0;    /* schräg */
        const wert = roheZeile[x]!;
        let d: number;
        if (f === 0) d = wert;
        else if (f === 1) d = wert - a;
        else if (f === 2) d = wert - b;
        else if (f === 3) d = wert - ((a + b) >> 1);
        else {
          const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
          d = wert - ((pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c));
        }
        d &= 0xff;
        ziel[x] = d;
        summe += d < 128 ? d : 256 - d;
      }
      if (summe < kleinste) { kleinste = summe; bester = f; }
    }
    roh[i++] = bester;
    versuch[bester]!.copy(roh, i); i += zeile;
    roheZeile.copy(vorherige);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(bild.breite, 0);
  ihdr.writeUInt32BE(bild.hoehe, 4);
  ihdr[8] = 8;
  ihdr[9] = deckend ? 2 : 6;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    block('IHDR', ihdr),
    block('IDAT', zlib.deflateSync(roh, { level: 9 })),
    block('IEND', Buffer.alloc(0))
  ]);
};

/* ==========================================================================
 * Rechnen
 * ========================================================================*/

/** Verkleinern mit Kastenfilter, über vormultipliziertes Alpha (Punkt 3 oben). */
const verkleinern = (q: Bild, breite: number, hoehe: number): Bild => {
  const punkte = new Uint8ClampedArray(breite * hoehe * 4);
  const sx = q.breite / breite, sy = q.hoehe / hoehe;
  for (let y = 0; y < hoehe; y++) {
    const y0 = Math.floor(y * sy), y1 = Math.max(y0 + 1, Math.ceil((y + 1) * sy));
    for (let x = 0; x < breite; x++) {
      const x0 = Math.floor(x * sx), x1 = Math.max(x0 + 1, Math.ceil((x + 1) * sx));
      let r = 0, g = 0, b = 0, a = 0, n = 0;
      for (let yy = y0; yy < y1 && yy < q.hoehe; yy++)
        for (let xx = x0; xx < x1 && xx < q.breite; xx++) {
          const i = (yy * q.breite + xx) * 4, al = q.punkte[i + 3]! / 255;
          r += q.punkte[i]! * al; g += q.punkte[i + 1]! * al; b += q.punkte[i + 2]! * al;
          a += q.punkte[i + 3]!; n++;
        }
      const z = (y * breite + x) * 4;
      /* Zurück aus dem vormultiplizierten Raum: geteilt wird durch die SUMME
         der Deckung, nicht durch die Zahl der Proben. Mit `n / (a / 255)`
         stand hier der Faktor n zu viel — jedes verkleinerte Symbol war um
         das Vier- bis Tausendfache überbelichtet und kam weiss heraus.
         Kein Prüflauf hat das gemeldet; das Bild hat es gemeldet (§55). */
      const k = a > 0 ? 255 / a : 0;
      punkte[z] = r * k; punkte[z + 1] = g * k; punkte[z + 2] = b * k;
      punkte[z + 3] = a / n;
    }
  }
  return { breite, hoehe, punkte };
};

/** Ein neues Bild in einer Farbe. */
const flaeche = (breite: number, hoehe: number, farbe: number[]): Bild => {
  const punkte = new Uint8ClampedArray(breite * hoehe * 4);
  for (let i = 0; i < punkte.length; i += 4) {
    punkte[i] = farbe[0]!; punkte[i + 1] = farbe[1]!;
    punkte[i + 2] = farbe[2]!; punkte[i + 3] = farbe[3]!;
  }
  return { breite, hoehe, punkte };
};

/** `oben` auf `unten` legen, linke obere Ecke bei (px, py). */
const legen = (unten: Bild, oben: Bild, px: number, py: number): Bild => {
  for (let y = 0; y < oben.hoehe; y++) {
    const zy = py + y;
    if (zy < 0 || zy >= unten.hoehe) continue;
    for (let x = 0; x < oben.breite; x++) {
      const zx = px + x;
      if (zx < 0 || zx >= unten.breite) continue;
      const o = (y * oben.breite + x) * 4, u = (zy * unten.breite + zx) * 4;
      const a = oben.punkte[o + 3]! / 255;
      if (a <= 0) continue;
      for (let k = 0; k < 3; k++)
        unten.punkte[u + k] = oben.punkte[o + k]! * a + unten.punkte[u + k]! * (1 - a);
      unten.punkte[u + 3] = Math.max(unten.punkte[u + 3]!, oben.punkte[o + 3]!);
    }
  }
  return unten;
};

/**
 * Sparen: das Rauschen wegnehmen, das niemand sieht.
 *
 * Redurs Marke ist eine Fotografie mit Korn. Über die Hälfte ihrer Fläche
 * ist Schwarz — aber kein glattes Schwarz, sondern 3/4/6 neben 0/2/5. Für
 * das Auge ist das dasselbe Schwarz; für `deflate` ist es Zufall, und
 * Zufall lässt sich nicht packen. icon-512 wog damit 480 KB.
 *
 * Zwei Griffe, beide vorher am Bild geprüft und nicht am Bauchgefühl
 * (§55.3): alles unter 16 wird echtes Schwarz, und die übrigen Kanäle
 * rasten auf 64 Stufen statt 256 ein. Bei vierfacher Vergrösserung im
 * Goldverlauf ist zwischen 8 und 6 Bit kein Streifen zu sehen — das Korn
 * selbst wirkt als Rasterung. Der Preis ist also nichts, der Gewinn die
 * Hälfte.
 */
const BODEN = 16, STUFEN = 64;
const sparen = (bild: Bild): Bild => {
  const st = 256 / STUFEN;
  for (let z = 0; z < bild.punkte.length; z += 4) {
    const m = Math.max(bild.punkte[z]!, bild.punkte[z + 1]!, bild.punkte[z + 2]!);
    if (m <= BODEN) { bild.punkte[z] = 0; bild.punkte[z + 1] = 0; bild.punkte[z + 2] = 0; continue; }
    for (let c = 0; c < 3; c++)
      bild.punkte[z + c] = Math.min(255, Math.round(bild.punkte[z + c]! / st) * st);
  }
  return bild;
};

/* ==========================================================================
 * Die ICO — ein Verzeichnis über vier PNG
 * --------------------------------------------------------------------------
 * Eine .ico darf seit Vista PNG enthalten statt roher Bitmaps; jeder Browser,
 * der heute läuft, kann das — und die vorhandene favicon.ico war schon so
 * gebaut. Der Kopf ist ein Verzeichnis: sechs Byte, dann je sechzehn Byte
 * pro Grösse, dann die PNG hintereinander.
 * ========================================================================*/
const ico = (bilder: Buffer[], groessen: number[]): Buffer => {
  const kopf = Buffer.alloc(6);
  kopf.writeUInt16LE(0, 0);                    /* reserviert                    */
  kopf.writeUInt16LE(1, 2);                    /* 1 = Symbol, 2 wäre ein Zeiger */
  kopf.writeUInt16LE(groessen.length, 4);
  let versatz = 6 + 16 * groessen.length;
  const eintraege = groessen.map((g, i) => {
    const e = Buffer.alloc(16);
    e[0] = g >= 256 ? 0 : g;                   /* 0 heisst 256 */
    e[1] = g >= 256 ? 0 : g;
    e[2] = 0;                                  /* Farben in der Palette: keine */
    e[3] = 0;                                  /* reserviert */
    e.writeUInt16LE(0, 4);                     /* Ebenen        */
    e.writeUInt16LE(32, 6);                    /* Bit je Punkt  */
    e.writeUInt32LE(bilder[i]!.length, 8);
    e.writeUInt32LE(versatz, 12);
    versatz += bilder[i]!.length;
    return e;
  });
  return Buffer.concat([kopf, ...eintraege, ...bilder]);
};

/**
 * DEN LICHTSAUM AM RAND LÖSCHEN (Redur, 9. September: „Entferne die weiche
 * rahmen ich will es nicht sehen").
 *
 * Redurs Vorlage hat rundum einen weichen Schein — in der Datei schön, auf
 * dem Startbildschirm ein weisser Rahmen um die schwarze Kachel. Gemessen
 * bei 512: er reicht 26 Punkte nach innen und wird bis zu 228 hell.
 *
 * NICHT NEU SCHNEIDEN. Ein engerer Ausschnitt nähme den Saum mit, würde die
 * Marke aber vergrössern und verschieben — genau der Fehler, den der erste
 * Anlauf gemacht hat. Stattdessen verliert der äussere Ring nur seine FARBE
 * und behält seine Deckung: der Rand wird schwarz, die Kante bleibt weich,
 * die Marke bleibt, wo sie ist.
 *
 * Der Abstand zur Kante kommt aus einer Distanzrechnung über die Deckung
 * selbst (zwei Durchgänge, wie beim Chamfer-Verfahren) und nicht aus dem
 * Bildrand — sonst bliebe der Schein in den runden Ecken stehen, weil die
 * Kachel dort weiter innen liegt.
 */
const RING = 0.065;              /* Anteil der Kantenlänge, gemessen: 26/512 */
const kanteBeruhigen = (bild: Bild): Bild => {
  const { breite, hoehe, punkte } = bild;
  const weit = RING * Math.min(breite, hoehe);
  const FERN = breite + hoehe;
  const d = new Float32Array(breite * hoehe);
  for (let i = 0; i < d.length; i++) d[i] = punkte[i * 4 + 3]! >= 250 ? FERN : 0;

  /* Vorwärts: von oben links. Rückwärts: von unten rechts. */
  const setze = (x: number, y: number, wert: number): void => {
    const i = y * breite + x;
    if (wert < d[i]!) d[i] = wert;
  };
  for (let y = 0; y < hoehe; y++) for (let x = 0; x < breite; x++) {
    const i = y * breite + x;
    if (d[i] === 0) continue;
    if (x > 0) setze(x, y, d[i - 1]! + 1);
    if (y > 0) setze(x, y, d[i - breite]! + 1);
    if (x > 0 && y > 0) setze(x, y, d[i - breite - 1]! + 1.41421);
    if (x < breite - 1 && y > 0) setze(x, y, d[i - breite + 1]! + 1.41421);
  }
  for (let y = hoehe - 1; y >= 0; y--) for (let x = breite - 1; x >= 0; x--) {
    const i = y * breite + x;
    if (d[i] === 0) continue;
    if (x < breite - 1) setze(x, y, d[i + 1]! + 1);
    if (y < hoehe - 1) setze(x, y, d[i + breite]! + 1);
    if (x < breite - 1 && y < hoehe - 1) setze(x, y, d[i + breite + 1]! + 1.41421);
    if (x > 0 && y < hoehe - 1) setze(x, y, d[i + breite - 1]! + 1.41421);
  }

  for (let i = 0; i < d.length; i++) {
    const abstand = d[i]!;
    if (abstand >= weit) continue;
    /* Weich auslaufen statt hart abschneiden: ganz aussen voll schwarz, zur
       Marke hin allmählich die eigene Farbe. Eine harte Kante wäre nur ein
       anderer Rahmen. */
    const k = abstand / weit;
    for (let c = 0; c < 3; c++) punkte[i * 4 + c] = punkte[i * 4 + c]! * k * k;
  }
  return bild;
};

/* ========================================================================== */
const QUELLE = kanteBeruhigen(lesePng(pfad.join(HIER, 'marke.png')));
if (QUELLE.breite !== QUELLE.hoehe)
  throw new Error('marke.png ist nicht quadratisch: ' + QUELLE.breite + ' × ' + QUELLE.hoehe);

/**
 * DIE KLEINEN GRÖSSEN WERDEN AUFGEHELLT.
 *
 * Redurs Marke ist dunkel: goldene Bögen auf Schwarz. Bei 180 px ist das
 * ihre Wirkung; bei 16 px im Browserreiter ist es ein schwarzer Fleck, weil
 * das Verkleinern jeden hellen Punkt mit fünfhundert dunklen mittelt. Ein
 * Symbol, das man nicht erkennt, hat seine Aufgabe nicht erfüllt.
 *
 * Gamma 0,65 hebt die Mitteltöne und lässt das Schwarz schwarz — 0 hoch
 * irgendwas bleibt 0. Am Bild verglichen (1 · 0,8 · 0,65 · 0,5): ab 0,5
 * beginnt der Grund zu grauen, bei 0,8 ist noch zu wenig zu sehen.
 */
const AUFHELLEN_BIS = 48, GAMMA = 0.65;
const aufhellen = (bild: Bild): Bild => {
  for (let z = 0; z < bild.punkte.length; z += 4)
    for (let c = 0; c < 3; c++)
      bild.punkte[z + c] = 255 * Math.pow(Math.min(1, bild.punkte[z + c]! / 255), GAMMA);
  return bild;
};

/** Das Symbol in einer Grösse: die Marke füllt ihre Kachel, sie hat eigene Ecken. */
const symbol = (g: number): Bild => {
  const b = verkleinern(QUELLE, g, g);
  return sparen(g <= AUFHELLEN_BIS ? aufhellen(b) : b);
};

/** Maskable: die Marke auf 78 % in einem schwarzen Feld (Punkt 1 oben). */
const maskable = (g: number): Bild => {
  const innen = Math.round(g * 0.78);
  return sparen(legen(flaeche(g, g, GRUND), verkleinern(QUELLE, innen, innen),
                      Math.round((g - innen) / 2), Math.round((g - innen) / 2)));
};

/** Das Startbild: die Marke in der Mitte eines Bildschirms in Gerätegrösse. */
const startbild = (breite: number, hoehe: number): Bild => {
  const kasten = Math.round(Math.min(breite, hoehe) * 0.34);
  return sparen(legen(flaeche(breite, hoehe, GRUND), verkleinern(QUELLE, kasten, kasten),
                      Math.round((breite - kasten) / 2), Math.round((hoehe - kasten) / 2)));
};

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

let n = 0, byte = 0;
const schreibe = (name: string, daten: Buffer, ordner = HIER): void => {
  fs.writeFileSync(pfad.join(ordner, name), daten); n++; byte += daten.length;
};

GROESSEN.forEach(g => schreibe(`icon-${g}.png`, schreibePng(symbol(g))));
[192, 512].forEach(g => schreibe(`maskable-${g}.png`, schreibePng(maskable(g))));
[16, 32].forEach(g => schreibe(`favicon-${g}.png`, schreibePng(symbol(g))));
Object.entries(STARTBILDER).forEach(([datei, [b, h]]) =>
  schreibe(datei, schreibePng(startbild(b, h), true)));
/* Die .ico liegt eine Ebene höher, weil index.html und der Dienst sie dort
   suchen. Sie war bis E525 die einzige Symboldatei ohne Erzeuger — von Hand
   gebaut und deshalb beim Markenwechsel fast vergessen. */
const ICO = [16, 32, 48, 64];
schreibe('favicon.ico', ico(ICO.map(g => schreibePng(symbol(g))), ICO), pfad.join(HIER, '..'));

console.log(`${n} Dateien geschrieben, ${(byte / 1024).toFixed(0)} KB — aus marke.png`);
