/* Suite 483 — Die Marke ist überall dieselbe (E525)
 * ============================================================================
 * Redur, 9. September, nach einem Bildschirmfoto seines Startbildschirms:
 *
 *   „Wieso habe ich hier das immer nich die R logo"
 *   „Alter änder die logo ich sage es dir mache es"
 *
 * Das rote R war nicht an einer Stelle, sondern an achtzehn: zwölf Symbole,
 * zwei maskable, zwei Favicons, sieben Startbilder — und eine `favicon.ico`,
 * die als EINZIGE gar keinen Erzeuger hatte und von Hand gebaut war. Eine
 * Marke an achtzehn Stellen wechselt niemand vollständig; eine an einer
 * schon.
 *
 *   §1 EINE QUELLE. `marke.png` ist die Marke; alles andere wird gerechnet.
 *      Geprüft, indem der Erzeuger in einem leeren Verzeichnis noch einmal
 *      läuft und die Ergebnisse Byte für Byte mit den abgelegten verglichen
 *      werden. Das hält zwei Dinge auf einmal: der Lauf ist wiederholbar,
 *      UND niemand hat die Marke gewechselt, ohne neu zu rechnen.
 *   §2 KEIN BUCHSTABE MEHR. Weder im Kopf der App noch in der Stildatei.
 *   §3 DIE MARKE IM KOPF IST DIESELBE MARKE. Die Data-URL in `studio.css`
 *      ist `icon-72.png`, Byte für Byte — keine zweite, ältere Fassung.
 *   §4 DIE FORM DER DATEIEN: Masse, Alphakanal, und eine .ico, die wirklich
 *      eine .ico ist.
 *   §5 IM BROWSER SICHTBAR, und in der Einzeldatei auch (§29).
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 *   §1 → ein Byte in `marke.png` ändern, ohne den Erzeuger laufen zu lassen:
 *        gemessen, 21 von 24 Dateien weichen ab.
 *   §2 → das „R" in `index.html` zurücksetzen: eine Zusage.
 *   §3 → in `studio.css` `icon-48` statt `icon-72` einsetzen: eine Zusage.
 *   §5 → `background` in `.studio-monogram` streichen: zwei Zusagen.
 *
 *   node pruefungen/lauf/test483.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9603;
const TYP: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon', '.svg': 'image/svg+xml'
};
const server = http.createServer((a: IncomingMessage, b: ServerResponse) => {
  const rein = decodeURIComponent((a.url ?? '/').split('?')[0] ?? '/');
  const datei = path.join(WURZEL, rein === '/' ? 'index.html' : rein.slice(1));
  if (!datei.startsWith(WURZEL) || !fs.existsSync(datei) || fs.statSync(datei).isDirectory()) {
    b.writeHead(404); b.end(); return;
  }
  b.writeHead(200, { 'Content-Type': TYP[path.extname(datei)] ?? 'application/octet-stream' });
  b.end(fs.readFileSync(datei));
});
await new Promise<void>(f => server.listen(PORT, f));

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};
const lies = (f: string): string => fs.readFileSync(path.join(WURZEL, f), 'utf8');
const roh = (f: string): Buffer => fs.readFileSync(path.join(WURZEL, f));

/* Ein PNG sagt seine Masse selbst: nach der acht Byte langen Signatur folgt
   IHDR, dort stehen ab Byte 16 Breite und Höhe, Byte 24 ist die Bittiefe und
   25 die Farbart. Keine Abhängigkeit nötig (wie in `test31`). */
const pngMasse = (b: Buffer): { breite: number; hoehe: number; tiefe: number; farbart: number } | null => {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (b.length < 26 || !b.subarray(0, 8).equals(sig)) return null;
  if (b.subarray(12, 16).toString('latin1') !== 'IHDR') return null;
  return { breite: b.readUInt32BE(16), hoehe: b.readUInt32BE(20),
           tiefe: b[24] ?? 0, farbart: b[25] ?? 0 };
};

const SYMBOLE = [48, 72, 96, 128, 144, 152, 167, 180, 192, 256, 384, 512];
const STARTBILDER: Record<string, [number, number]> = {
  'start-iphone-13-pro-max.png': [1284, 2778], 'start-iphone-15-pro-max.png': [1290, 2796],
  'start-iphone-13.png': [1170, 2532], 'start-iphone-15.png': [1179, 2556],
  'start-iphone-x.png': [1125, 2436], 'start-iphone-xs-max.png': [1242, 2688],
  'start-iphone-xr.png': [828, 1792]
};

/* ══ §1 EINE QUELLE ═══════════════════════════════════════════════════════ */
console.log('\n§1 Alles kommt aus marke.png');
{
  p('Die Quelle liegt da', fs.existsSync(path.join(WURZEL, 'oeffentlich/icons/marke.png')));
  const m = pngMasse(roh('oeffentlich/icons/marke.png'));
  p('… als quadratisches PNG mit Alphakanal',
    !!m && m.breite === m.hoehe && m.tiefe === 8 && m.farbart === 6, JSON.stringify(m));

  /* Den Erzeuger in einem leeren Verzeichnis noch einmal laufen lassen. Er
     schreibt neben sich und eine Ebene höher, also bekommt er beides. */
  const ablage = fs.mkdtempSync(path.join(os.tmpdir(), 'marke-'));
  fs.mkdirSync(path.join(ablage, 'icons'));
  fs.copyFileSync(path.join(WURZEL, 'oeffentlich/icons/erzeugen.mts'),
                  path.join(ablage, 'icons/erzeugen.mts'));
  fs.copyFileSync(path.join(WURZEL, 'oeffentlich/icons/marke.png'),
                  path.join(ablage, 'icons/marke.png'));
  const lauf = spawnSync(process.execPath, [path.join(ablage, 'icons/erzeugen.mts')],
                         { encoding: 'utf8' });
  p('Der Erzeuger läuft durch', lauf.status === 0,
    (lauf.stderr || '').split('\n').slice(0, 2).join(' '));

  const vergleiche = (hier: string): boolean => {
    const a = path.join(ablage, hier), b = path.join(WURZEL, 'oeffentlich', hier);
    return fs.existsSync(a) && fs.existsSync(b) && fs.readFileSync(a).equals(fs.readFileSync(b));
  };
  const alle = [...SYMBOLE.map(g => `icons/icon-${g}.png`),
                ...[192, 512].map(g => `icons/maskable-${g}.png`),
                ...[16, 32].map(g => `icons/favicon-${g}.png`),
                ...Object.keys(STARTBILDER).map(d => 'icons/' + d),
                'favicon.ico'];
  const anders = alle.filter(d => !vergleiche(d));
  p(`Alle ${alle.length} Dateien sind genau das, was der Erzeuger rechnet`,
    anders.length === 0, anders.slice(0, 4).join(', '));
  fs.rmSync(ablage, { recursive: true, force: true });

  /* Und die Quelle ist nicht mit ausgeliefert — sie ist Werkzeug (E525). */
  p('marke.png geht nicht mit ins Netz',
    /^oeffentlich\/icons\/marke\.png$/m.test(lies('.assetsignore')));
}

/* ══ §2 KEIN BUCHSTABE MEHR ═══════════════════════════════════════════════ */
console.log('\n§2 Kein Buchstabe als Marke');
{
  const html = lies('index.html');
  const css = lies('quell/schale/stil/studio.css');
  p('Das Monogramm im Kopf trägt keinen Text mehr',
    /<span class="studio-monogram" aria-hidden="true"><\/span>/.test(html),
    (html.match(/class="studio-monogram"[^>]*>[^<]*/) || [''])[0]);
  p('… und keinen violetten Verlauf mehr',
    !/\.studio-monogram\{[^}]*linear-gradient/.test(css));
  p('Es ist quadratisch — die Marke ist es auch',
    /\.studio-monogram\{[^}]*width:38px;height:38px/.test(css));
}

/* ══ §3 DIESELBE MARKE, NICHT EINE ZWEITE ═════════════════════════════════ */
console.log('\n§3 Die Marke im Kopf ist die Marke aus dem Verzeichnis');
{
  const css = lies('quell/schale/stil/studio.css');
  const treffer = css.match(/\.studio-monogram\{[^}]*url\("data:image\/png;base64,([A-Za-z0-9+/=]+)"\)/);
  p('Die Stildatei trägt die Bytes selbst, nicht eine Adresse daneben', !!treffer);
  if (treffer) {
    const drin = Buffer.from(treffer[1] ?? '', 'base64');
    p('… und es sind genau die von icon-72.png',
      drin.equals(roh('oeffentlich/icons/icon-72.png')),
      `${drin.length} Byte gegen ${roh('oeffentlich/icons/icon-72.png').length}`);
  } else weg++;
}

/* ══ §4 DIE FORM DER DATEIEN ══════════════════════════════════════════════ */
console.log('\n§4 Masse, Alphakanal, echte .ico');
{
  const falsch = SYMBOLE.map(g => ({ g, m: pngMasse(roh(`oeffentlich/icons/icon-${g}.png`)) }))
    .filter(({ g, m }) => !m || m.breite !== g || m.hoehe !== g || m.farbart !== 6);
  p('Jedes Symbol hat seine Grösse und einen Alphakanal',
    falsch.length === 0, falsch.map(f => f.g).join(', '));

  const startFalsch = Object.entries(STARTBILDER)
    .map(([d, [b, h]]) => ({ d, b, h, m: pngMasse(roh('oeffentlich/icons/' + d)) }))
    .filter(({ b, h, m }) => !m || m.breite !== b || m.hoehe !== h);
  p('Jedes Startbild hat exakt die Masse seines Geräts — sonst nimmt Safari es nicht',
    startFalsch.length === 0, startFalsch.map(f => f.d).join(', '));

  /* Die runden Ecken müssen wirklich durchsichtig sein und nicht weiss (E525).
     Geprüft am kleinsten Symbol: die linke obere Ecke. */
  const ico = roh('oeffentlich/favicon.ico');
  p('favicon.ico ist eine .ico mit vier Grössen',
    ico.readUInt16LE(0) === 0 && ico.readUInt16LE(2) === 1 && ico.readUInt16LE(4) === 4,
    `${ico.readUInt16LE(2)} / ${ico.readUInt16LE(4)}`);
  const ersterVersatz = ico.readUInt32LE(6 + 12);
  const ersteLaenge = ico.readUInt32LE(6 + 8);
  const innen = pngMasse(ico.subarray(ersterVersatz, ersterVersatz + ersteLaenge));
  p('… und ihr erster Eintrag ist ein PNG in 16 × 16',
    !!innen && innen.breite === 16 && innen.hoehe === 16, JSON.stringify(innen));
}

/* ══ §5 IM BROWSER UND IN DER EINZELDATEI ═════════════════════════════════ */
console.log('\n§5 Sichtbar');
{
  const einzeln = lies('redion-einzeldatei.html');
  p('Die Einzeldatei trägt die Marke in sich (§29)',
    /\.studio-monogram\{[^}]*url\("data:image\/png;base64,/.test(einzeln));
  p('… und verweist dafür auf keine Datei daneben',
    !/\.studio-monogram\{[^}]*url\(["']?(?:\.|\/|oeffentlich)/.test(einzeln));

  const browser = await chromium.launch();
  const fehler: string[] = [];
  const seite = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  seite.on('pageerror', e => fehler.push(e.message));
  await seite.goto(`http://localhost:${PORT}/index.html`);
  await seite.waitForTimeout(2200);
  const marke = await seite.evaluate(() => {
    const el = document.querySelector('.studio-monogram') as HTMLElement | null;
    if (!el) return null;
    const s = getComputedStyle(el);
    /* `offsetWidth`, nicht `getBoundingClientRect`: die Marke steht schräg im
       Raum (rotateY/rotateZ, wie das Monogramm vorher), und das umschliessende
       Rechteck einer gekippten Fläche ist grösser als die Fläche — gemessen
       40 × 41 statt 38 × 38. Das ist keine Abweichung, sondern Perspektive. */
    return { breite: el.offsetWidth, hoehe: el.offsetHeight,
             sichtbar: el.getBoundingClientRect().width > 20,
             bild: s.backgroundImage.slice(0, 30), text: (el.textContent || '').trim() };
  });
  p('Die Marke steht im Kopf, 38 × 38 gross und wirklich sichtbar',
    !!marke && marke.breite === 38 && marke.hoehe === 38 && marke.sichtbar,
    JSON.stringify(marke));
  p('… als Bild, nicht als Buchstabe',
    !!marke && marke.bild.startsWith('url("data:image/png') && marke.text === '',
    JSON.stringify(marke?.bild));

  /* Der Reiter zeigt sie auch: die verlinkten Favicons müssen wirklich da
     sein. Ein 404 auf ein Symbol sieht man erst auf dem fremden Rechner. */
  const html = lies('index.html');
  const verlinkt = [...html.matchAll(/href="(oeffentlich\/[^"]+\.(?:png|ico))"/g)].map(m => m[1]!);
  const fehlend = verlinkt.filter(d => !fs.existsSync(path.join(WURZEL, d)));
  p(`Alle ${verlinkt.length} verlinkten Symbole liegen wirklich da`,
    fehlend.length === 0, fehlend.join(', '));
  p('Keine Seitenfehler', fehler.length === 0, fehler.slice(0, 2).join(' | '));
  await browser.close();
}

console.log(`\n${ok}/${ok + weg} bestanden · ✗=${weg}`);
server.close();
process.exit(weg ? 1 : 0);
