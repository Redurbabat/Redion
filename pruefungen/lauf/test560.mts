/* Suite 560 — Ein Ordner hat eine Farbe, und man kann sie wechseln
 * ============================================================================
 * Redur, 21. September 2026 (wörtlich): „ich sollte die ordner farben
 * wählen können und farben wecheln können".
 *
 * ─── WAS ES SCHON GAB, UND WAS NICHT ────────────────────────────────────────
 * Die Notizhefte haben seit E406 ein „Farbe …"-Menü — für HEFTE. Das Feld
 * ist `color` (kein neues Feld, keine Migration, §53.3), die Palette sind
 * die neun Kennungen aus `Farben`, und die Farbe steht als Rücken links am
 * Deckel (`data-farbe`, `--deckel-farbe`, notizhefte.css).
 *
 * Ein FACH (der Ordner der Notizhefte) hatte das Menü nicht. Ein ORDNER
 * der Bibliothek auch nicht. Und wo die Farbe gezeichnet wird, war die
 * Regel auf `.nh-regal` beschränkt — ein Ordner mit `color: 'blue'` stand
 * in der Bibliothek farblos da, selbst wenn jemand das Feld gesetzt hätte.
 *
 * test531 hat gezählt: es gibt genau ZWEI Stellen, die eine Ordner-Kachel
 * zeichnen (`deckelKarte` in bibliothek.ts, `fachCard` in notebook.ts).
 * Beide müssen die Farbe zeigen, und beide Menüs müssen sie anbieten —
 * sonst ist es die Nachbarstelle aus §45.
 *
 * WAS DIESER LAUF HÄLT
 *
 *   1  In der Bibliothek bietet das ⌄-Menü eines Ordners „Farbe" an, der
 *      Wähler zeigt neun benannte Farben (§38), und die Wahl schreibt
 *      `color` und zeichnet den Rücken am Deckel — MESSBAR als
 *      `border-left-color`, nicht nur als Attribut.
 *   2  Wechseln geht: Blau → Rot → Ohne Farbe. „Ohne Farbe" nimmt das
 *      Attribut wieder weg.
 *   3  Ein Fach in den Notizheften: dasselbe Menü, derselbe Rücken.
 *   4  Die Farbe steht auch in der Seitenleiste und im Ablagebaum —
 *      wer einen Ordner blau macht, will ihn ÜBERALL blau sehen.
 *   5  Nur bekannte Farben erzeugen das Attribut (Whitelist, §19).
 *   6  Am Telefon sind die Farbfelder zu treffen (§37), jedes hat einen
 *      Namen (§38), und das gewählte sagt es (aria-pressed).
 *
 * `listen(0)` statt einer festen Zahl (L205).
 *
 *   node pruefungen/lauf/test560.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import type { Page } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const TYP: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon'
};
const server = http.createServer((a, b) => {
  const rein = decodeURIComponent((a.url ?? '/').split('?')[0] ?? '/');
  const datei = path.join(WURZEL, rein === '/' ? 'index.html' : rein.slice(1));
  if (!datei.startsWith(WURZEL) || !fs.existsSync(datei) || fs.statSync(datei).isDirectory()) {
    b.writeHead(404); b.end(); return;
  }
  b.writeHead(200, { 'Content-Type': TYP[path.extname(datei)] ?? 'application/octet-stream' });
  b.end(fs.readFileSync(datei));
});
await new Promise<void>(f => { server.listen(0, '127.0.0.1', () => f()); });
const PORT = (server.address() as { port: number }).port;

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};

const browser = await chromium.launch();
const fehler: string[] = [];

/** Ein Ordner „Kabelkunde" mit zwei Seiten in der Bibliothek, und ein Fach
 *  „Elektrotechnik" mit zwei Heften in den Notizheften (wie test531). */
const frisch = async (handy = false): Promise<{ s: Page; ordner: string; fach: string }> => {
  const s = handy
    ? await (await browser.newContext({ viewport: { width: 390, height: 844 },
        hasTouch: true, isMobile: true })).newPage()
    : await browser.newPage({ viewport: { width: 1280, height: 950 } });
  s.on('pageerror', e => fehler.push(e.message.slice(0, 140)));
  s.on('dialog', d => d.dismiss().catch(() => {}));
  await s.goto(`http://localhost:${PORT}/index.html`);
  await s.waitForFunction("typeof App !== 'undefined' && typeof Store !== 'undefined' && typeof Bibliothek !== 'undefined'");
  const ids = await s.evaluate(`(async () => {
    Store.setMeta('rundgangGesehen', true);
    Store.setMeta('bibForm', 'deckel');
    Store.setMeta('bibOrdner', '');
    Store.setMeta('heft:reiter', 'dokumente');
    Store.setMeta('heft:fach', '');
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    document.querySelector('.produkt-onboarding-lage')?.remove();
    document.getElementById('rg-willkommen')?.remove();
    const ordner = Store.addPage(null, { text: 'Kabelkunde', icon: '📁' });
    Store.addPage(ordner.id, { text: 'Querschnitte' });
    Store.addPage(ordner.id, { text: 'Absicherung' });
    const fach = Store.addPage(null, { text: 'Elektrotechnik', icon: '\\u{1F5C2}', heftArt: 'fach' });
    for (const h of ['Kapitel 2', 'Formelsammlung']) {
      const heft = Store.addPage(fach.id, { text: h });
      Store.addBlock(heft.id, 'blatt', { papier: 'blanko' });
    }
    await Store.flush();
    return { ordner: ordner.id, fach: fach.id };
  })()`) as { ordner: string; fach: string };
  return { s, ...ids };
};

const zurBibliothek = async (s: Page): Promise<void> => {
  await s.evaluate("Store.setMeta('bibOrdner', ''); Bibliothek.oeffne()");
  await s.waitForSelector('.bib-gitter .bib-deckel', { timeout: 20000 });
  await s.waitForTimeout(400);
};

/** Der Deckel eines Blocks, wie er gerade dasteht. */
const DECKEL = (id: string) => `(() => {
  const d = document.querySelector('.bib-deckel[data-id="${id}"]');
  if (!d) return { da: false };
  const blatt = d.querySelector('.bib-deckel-blatt');
  const cs = blatt ? getComputedStyle(blatt) : null;
  /* EIN ORDNER HAT KEINEN RÜCKEN (E672): sein Deckel ist Körper (::before)
     und Reiter (::after), beide aus einer Farbe. Gemessen wird der Reiter. */
  const reiter = blatt ? getComputedStyle(blatt, '::after') : null;
  const token = (name) => {
    const h = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(h);
    return m ? 'rgb(' + parseInt(m[1], 16) + ', ' + parseInt(m[2], 16) + ', ' + parseInt(m[3], 16) + ')' : h;
  };
  return { da: true, farbe: d.getAttribute('data-farbe'),
           reiter: reiter ? reiter.backgroundColor : '',
           blau: token('--c-blue'), rot: token('--c-red'), akzent: token('--accent'),
           markup: d.outerHTML.slice(0, 400) };
})()`;

/** Das ⌄-Menü eines Deckels öffnen und den Eintrag „Farbe" drücken. */
const farbMenueAuf = async (s: Page, id: string): Promise<{ eintrag: boolean; felder: any[] }> => {
  await s.evaluate(`document.querySelectorAll('.menu, .ui-menu, .menue').forEach(m => m.remove())`);
  await s.evaluate(`document.querySelector('.bib-deckel[data-id="${id}"]')?.parentElement?.querySelector('.bib-deckel-mehr')?.click()`);
  await s.waitForTimeout(250);
  const eintrag = await s.evaluate(`(() => {
    const b = [...document.querySelectorAll('button[data-a]')].find(x => /Farbe/.test(x.textContent || ''));
    if (!b) return false; b.click(); return true;
  })()`) as boolean;
  await s.waitForTimeout(250);
  const felder = await s.evaluate(`[...document.querySelectorAll('.nh-farben button[data-farbe]')].map(b => ({
    id: b.getAttribute('data-farbe'), label: b.getAttribute('aria-label') || '',
    pressed: b.getAttribute('aria-pressed'), text: (b.textContent || '').trim() }))`) as any[];
  return { eintrag, felder };
};

const waehle = async (s: Page, farbe: string): Promise<void> => {
  await s.evaluate(`(() => {
    const b = [...document.querySelectorAll('button[data-farbe]')].find(x => x.getAttribute('data-farbe') === '${farbe}');
    b?.click();
  })()`);
  await s.waitForTimeout(500);
};

console.log('\n' + '─'.repeat(60));
console.log('Suite 560 — Ein Ordner hat eine Farbe, und man kann sie wechseln');
console.log('─'.repeat(60));

/* ── 1 ────────────────────────────────────────────────────────────────── */
console.log('\n1 · In der Bibliothek: Farbe wählen');
const { s, ordner, fach } = await frisch();
await zurBibliothek(s);

const vorher = await s.evaluate(DECKEL(ordner)) as any;
console.log('    vorher: data-farbe=' + JSON.stringify(vorher.farbe) + ' · Reiter ' + vorher.reiter + ' (Akzent ' + vorher.akzent + ')');
p('Der Ordner steht als Deckel da', vorher.da === true);
p('Ohne Farbe trägt er kein Attribut', vorher.da && vorher.farbe === null, String(vorher.farbe));
p('Und sein Reiter ist die Akzentfarbe', vorher.da && vorher.reiter === vorher.akzent,
  vorher.reiter + ' statt ' + vorher.akzent);

const menue = await farbMenueAuf(s, ordner);
console.log('    Eintrag „Farbe" im ⌄-Menü: ' + menue.eintrag + ' · Felder: ' + menue.felder.length);
p('Das ⌄-Menü des Ordners bietet „Farbe" an', menue.eintrag === true,
  'das Menü kennt Öffnen, Blick hinein, Favorit, Umbenennen, Papierkorb — keine Farbe');
p('Der Wähler zeigt neun Farben', menue.felder.length === 9, menue.felder.length + ' Felder');
p('Jedes Feld trägt seinen Namen (§38)',
  menue.felder.length === 9 && menue.felder.every(f => f.label.length > 1 && !/^[a-z]+$/.test(f.label)),
  JSON.stringify(menue.felder.map(f => f.label)));

await waehle(s, 'blue');
const blau = await s.evaluate(`Store.getBlock('${ordner}').color`) as string;
const nachBlau = await s.evaluate(DECKEL(ordner)) as any;
console.log('    gespeichert: color=' + JSON.stringify(blau) + ' · Deckel data-farbe=' +
            JSON.stringify(nachBlau.farbe) + ' · Reiter ' + nachBlau.reiter + ' (--c-blue ' + nachBlau.blau + ')');
p('Die Wahl schreibt `color: "blue"` an den Ordner', blau === 'blue', JSON.stringify(blau));
p('Der Deckel trägt `data-farbe="blue"`', nachBlau.farbe === 'blue', String(nachBlau.farbe));
p('Und der Reiter des Ordners IST jetzt Blau — gemessen als gerenderte Farbe',
  nachBlau.reiter === nachBlau.blau, nachBlau.reiter + ' statt ' + nachBlau.blau);

/* ── 2 ────────────────────────────────────────────────────────────────── */
console.log('\n2 · Wechseln: Blau → Rot → Ohne Farbe');
await farbMenueAuf(s, ordner);
await waehle(s, 'red');
const rot = await s.evaluate(`Store.getBlock('${ordner}').color`) as string;
const nachRot = await s.evaluate(DECKEL(ordner)) as any;
console.log('    nach Rot: color=' + JSON.stringify(rot) + ' · Reiter ' + nachRot.reiter);
p('Rot ersetzt Blau', rot === 'red' && nachRot.farbe === 'red', JSON.stringify(rot));
p('Und der Reiter wechselt mit — auf Rot', nachRot.reiter === nachRot.rot,
  nachRot.reiter + ' statt ' + nachRot.rot);

const menue2 = await farbMenueAuf(s, ordner);
const gedrueckt = menue2.felder.filter(f => f.pressed === 'true').map(f => f.id);
p('Das gewählte Feld sagt es (aria-pressed, ✓)', gedrueckt.length === 1 && gedrueckt[0] === 'red'
  && menue2.felder.find(f => f.id === 'red')?.text.includes('✓'),
  JSON.stringify(gedrueckt));
await waehle(s, '');
const ohne = await s.evaluate(`Store.getBlock('${ordner}').color`) as string;
const nachOhne = await s.evaluate(DECKEL(ordner)) as any;
p('„Ohne Farbe" leert das Feld', ohne === '', JSON.stringify(ohne));
p('… und nimmt das Attribut vom Deckel', nachOhne.farbe === null, String(nachOhne.farbe));
p('… und der Reiter ist wieder die Akzentfarbe', nachOhne.reiter === nachOhne.akzent,
  nachOhne.reiter + ' statt ' + nachOhne.akzent);

/* ── 3 ────────────────────────────────────────────────────────────────── */
console.log('\n3 · Ein Fach in den Notizheften: dasselbe Menü, derselbe Rücken');
await s.evaluate('Notebook.oeffnen()');
await s.waitForSelector('.nh-regal', { timeout: 20000 });
await s.waitForTimeout(400);
const fachVorher = await s.evaluate(`(() => {
  const k = document.querySelector('.bib-deckel[data-fach="${fach}"]');
  return k ? { da: true, farbe: k.getAttribute('data-farbe') } : { da: false };
})()`) as any;
p('Das Fach steht als Kachel da', fachVorher.da === true);
await s.evaluate(`document.querySelector('[data-mehr-fach="${fach}"]')?.click()`);
await s.waitForTimeout(250);
const fachEintrag = await s.evaluate(`(() => {
  const b = [...document.querySelectorAll('button[data-k]')].find(x => /Farbe/.test(x.textContent || ''));
  if (!b) return false; b.click(); return true;
})()`) as boolean;
await s.waitForTimeout(250);
p('Das ⋯-Menü des Fachs bietet „Farbe …" an', fachEintrag === true,
  'Hefte haben es seit E406 — das Fach daneben nicht');
await waehle(s, 'green');
const fachNachher = await s.evaluate(`(() => {
  const k = document.querySelector('.bib-deckel[data-fach="${fach}"]');
  const blatt = k?.querySelector('.bib-deckel-blatt');
  const reiter = blatt ? getComputedStyle(blatt, '::after').backgroundColor : '';
  const h = getComputedStyle(document.documentElement).getPropertyValue('--c-green').trim();
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(h);
  const gruen = m ? 'rgb(' + parseInt(m[1], 16) + ', ' + parseInt(m[2], 16) + ', ' + parseInt(m[3], 16) + ')' : h;
  return { farbe: k ? k.getAttribute('data-farbe') : null, color: Store.getBlock('${fach}').color,
           reiter, gruen };
})()`) as any;
console.log('    Fach: color=' + JSON.stringify(fachNachher.color) + ' · data-farbe=' +
            JSON.stringify(fachNachher.farbe) + ' · Reiter ' + fachNachher.reiter);
p('Die Wahl schreibt `color` an das Fach', fachNachher.color === 'green', JSON.stringify(fachNachher.color));
p('Die Fach-Kachel zeigt die Farbe am Reiter — gemessen', fachNachher.farbe === 'green'
  && fachNachher.reiter === fachNachher.gruen,
  'data-farbe=' + fachNachher.farbe + ', Reiter ' + fachNachher.reiter + ' statt ' + fachNachher.gruen);

/* ── 4 ────────────────────────────────────────────────────────────────── */
console.log('\n4 · Überall dieselbe Farbe: Seitenleiste und Ablagebaum');
await s.evaluate(`Store.updateBlock('${ordner}', { color: 'blue' })`);
await zurBibliothek(s);
await s.evaluate(`(() => { const d = document.querySelector('details.bib-ablage-baum'); if (d) d.open = true; })()`);
await s.evaluate(`Store.setMeta('bibBaumSichtbar', true); Bibliothek.oeffne()`);
await s.waitForTimeout(600);
const ueberall = await s.evaluate(`(() => {
  const zeile = [...document.querySelectorAll('#sidebar .row')]
    .find(r => (r.querySelector('.nm')?.textContent || '').includes('Kabelkunde'));
  const knoten = document.querySelector('.ru-baum-zeile[data-baum-id="${ordner}"]');
  const kcs = knoten ? getComputedStyle(knoten) : null;
  return { zeile: zeile ? zeile.getAttribute('data-farbe') : 'KEINE ZEILE',
           knoten: knoten ? knoten.getAttribute('data-farbe') : 'KEIN KNOTEN',
           knotenRand: kcs ? Math.round(parseFloat(kcs.borderLeftWidth)) : -1 };
})()`) as any;
console.log('    Seitenleiste: ' + JSON.stringify(ueberall.zeile) + ' · Ablagebaum: ' +
            JSON.stringify(ueberall.knoten) + ' (Rand ' + ueberall.knotenRand + ' px)');
p('Die Zeile in der Seitenleiste trägt die Farbe', ueberall.zeile === 'blue', String(ueberall.zeile));
p('Der Knoten im Ablagebaum trägt die Farbe', ueberall.knoten === 'blue', String(ueberall.knoten));

/* ── 5 ────────────────────────────────────────────────────────────────── */
console.log('\n5 · Nur bekannte Farben erzeugen das Attribut (§19)');
await s.evaluate(`Store.updateBlock('${ordner}', { color: '"><b>x</b>' })`);
await zurBibliothek(s);
const boese = await s.evaluate(DECKEL(ordner)) as any;
p('Ein unbekannter Wert erzeugt kein Attribut', boese.farbe === null, String(boese.farbe));
p('Und landet nicht im Markup', !String(boese.markup).includes('<b>x</b>'));
await s.evaluate(`Store.updateBlock('${ordner}', { color: '' })`);

p('Keine Ausnahme im Browser (Rechner)', fehler.length === 0, fehler.slice(0, 2).join(' · '));
await s.close();

/* ── 6 ────────────────────────────────────────────────────────────────── */
console.log('\n6 · Am Telefon: die Felder sind zu treffen (§37) und benannt (§38)');
const h = await frisch(true);
await zurBibliothek(h.s);
const hm = await farbMenueAuf(h.s, h.ordner);
const treffer = await h.s.evaluate(`(() => {
  const felder = [...document.querySelectorAll('.nh-farben button[data-farbe]')];
  return felder.map(b => {
    const r = b.getBoundingClientRect();
    const mx = r.left + r.width / 2, my = r.top + r.height / 2;
    /* Der Treffbereich ist grösser als der Kreis (::after) — gemessen wird,
       ob 20 px über und unter der Mitte NOCH dieser Knopf getroffen wird. */
    const oben = document.elementFromPoint(mx, my - 20), unten = document.elementFromPoint(mx, my + 20);
    return { id: b.getAttribute('data-farbe'), b: Math.round(r.width),
             trifft: (oben === b || b.contains(oben)) && (unten === b || b.contains(unten)) };
  });
})()`) as any[];
console.log('    Felder am Telefon: ' + treffer.length + ' · treffbar ±20 px: ' +
            treffer.filter(t => t.trifft).length);
p('Am Telefon stehen die neun Felder', hm.eintrag && treffer.length === 9, treffer.length + ' Felder');
p('Jedes Feld ist über 44 px hoch zu treffen (§37)',
  treffer.length === 9 && treffer.every(t => t.trifft),
  treffer.filter(t => !t.trifft).map(t => t.id).join(', '));
p('Keine Ausnahme im Browser (Telefon)', fehler.length === 0, fehler.slice(0, 2).join(' · '));
await h.s.context().close();

await browser.close();
server.close();
console.log(`\n${ok}/${ok + weg} bestanden`);
process.exit(weg ? 1 : 0);
