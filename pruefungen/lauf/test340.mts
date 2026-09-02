/* Suite 340 — Die breiten `.finder`-Regeln treffen nur noch, was sie meinen (E348, L111)
 * ============================================================================
 * Drei Regeln in `aufbau.css` galten für JEDES Fenster mit der Klasse
 * `finder` — und das sind seit E230 alle: `.finder input` (16 px, kein Rand),
 * `.finder .res button` (100 % breit, links, ohne Rand) und
 * `.finder label input` (100 % breit, auch für Haken). Mit Spezifität (0,1,1)
 * und (0,1,2) schlugen sie jede einzelne Klasse — und vier Bögen haben das
 * je einmal umgangen, statt es zu beheben (L108: E320, E324, E326, E334).
 *
 * Gemessen über alle 163 Befehle der Palette an Rechner und Telefon:
 * Tagesplan und Tempo bekamen ihre Schriftgrösse von der Palette statt von
 * sich selbst; das Antwortfeld des Elektro-Arbeitsplatzes verlor seinen
 * Rand; die Knöpfe in Notion-Format, Schnittstelle und Transaktionen waren
 * randlose Trefferzeilen; ein Haken im Tempo-Fenster war 100 % breit und
 * schob seine Beschriftung an den rechten Rand. Und im Schlagwortregister
 * stand `(#2-formeln` — ein Markdown-Sprungziel, das kein Schlagwort ist,
 * durch `match(/…/g)` samt Vorzeichen gelesen.
 *
 * Jetzt gelten die Regeln nur für DIREKTE Kinder (`.finder > input`,
 * `:where(.finder .res) > button`), und die Fenster tragen Klassen mit
 * eigenem Recht: `.btn`, `.fn-feld`, `.fn-aus`, `.fn-blatt`, `.fn-reihe`.
 *
 *   §1  SCHLAGWORTPILLEN SIND PILLEN — nicht 100 % breit; der Treffer darunter
 *       bleibt eine ganze Zeile.
 *   §2  EIN SPRUNGZIEL IST KEIN SCHLAGWORT — `[x](#2-formeln)` fällt weg,
 *       `(#klammer)` bleibt, und kein Schlagwort beginnt mit `(`.
 *   §3  NOTION-FORMATE: Knöpfe mit Rand und eigener Breite; die Ausgabe
 *       schrumpft nicht auf null, wenn das Fenster voll ist.
 *   §4  SCHNITTSTELLE UND TRANSAKTIONEN: dieselben Klassen, dieselben Masse.
 *   §5  ELEKTRO-ARBEITSPLATZ: das Antwortfeld hat seinen Rand wieder.
 *   §6  PROTOKOLL: Suchfeld und Auswahl mit Rand.
 *   §7  TEMPO: der Haken ist ein Haken, kein 100 % breites Feld.
 *   §8  PROTOKOLL AM TELEFON: der Hinweis bekommt die ganze Zeile, die Knöpfe
 *       bleiben Knöpfe (≤ 50 px hoch) — auf dem Bild gefunden, nicht gemessen.
 *   §9  TAGESPLAN UND TEMPO nennen ihre Schriftgrösse selbst (14 px).
 *   §10 UND DIE PALETTE BLEIBT DIE PALETTE — 16 px ohne Rand, Treffer über
 *       die ganze Breite. Der Umbau darf nicht das Original verlieren.
 *
 *   node pruefungen/lauf/test340.mts
 * ==========================================================================*/
declare const Store: any; declare const App: any; declare const Register: any;
declare const Links: any; declare const NotionFormat: any; declare const Protokoll: any;
declare const Tempo: any; declare const Plan: any; declare const Werkzeuge: any;
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9344;

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll),
    `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

const TYP: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.json': 'application/json', '.mjs': 'text/javascript',
  '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon'
};
const server = http.createServer((a: IncomingMessage, b: ServerResponse) => {
  const rein = decodeURIComponent((a.url ?? '/').split('?')[0] ?? '/');
  const pfad = path.join(WURZEL, rein === '/' ? 'index.html' : rein.slice(1));
  if (!pfad.startsWith(WURZEL) || !fs.existsSync(pfad) || fs.statSync(pfad).isDirectory()) {
    b.writeHead(404); b.end(); return;
  }
  b.writeHead(200, { 'Content-Type': TYP[path.extname(pfad)] ?? 'application/octet-stream' });
  b.end(fs.readFileSync(pfad));
});
await new Promise<void>(f => { server.listen(PORT, () => f()); });

const browser = await chromium.launch();
const fehler: string[] = [];

/** Eine Seite mit Schlagwörtern — darunter die zwei Fallen aus §2. */
const vorbereiten = async (pg: import('playwright').Page): Promise<void> => {
  pg.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 160)));
  pg.on('dialog', d => d.dismiss().catch(() => {}));
  await pg.goto(`http://localhost:${PORT}/index.html`);
  await pg.waitForTimeout(2600);
  await pg.evaluate(async () => {
    Store.setMeta('rundgangGesehen', true);
    document.getElementById('rg-willkommen')?.remove();
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    const s = Store.addBlock(null, 'page', { text: 'L111 Prüfseite #echt #wissen' });
    Store.addBlock(s.id, 'text',
      { text: 'Siehe [Formeln](#2-formeln), dann (#klammer) und zuletzt #echt.' });
    Store.addBlock(s.id, 'text', { text: 'Noch ein Absatz mit #notizen #elektro #prüfung.' });
    if (Store.flush) await Store.flush();
    if (App.zeigeBlock) App.zeigeBlock(s.id);
  });
  await pg.waitForTimeout(600);
};

/** Ein Fenster öffnen — über die Palette-Liste (Werkzeuge) oder das Register. */
const oeffne = async (pg: import('playwright').Page, name: string): Promise<void> => {
  await pg.evaluate(async (name: string) => {
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    const e1 = Werkzeuge.befehle().find((x: any) => x.name === name);
    const b = e1 ? { tun: e1.fn } : Register.befehle.alle().find((x: any) => x.titel === name);
    if (!b) throw new Error('Kein Befehl namens ' + name);
    b.tun();
    await new Promise(f => setTimeout(f, 700));
  }, name);
};

/** Das jüngste `.finder` und darin ein Element vermessen. */
type Mass = { w: number; h: number; bt: number; bs: string; fs: string; disp: string;
              jc: string; shrink: string; ch: number; sh: number };
const mass = (pg: import('playwright').Page, sel: string): Promise<Mass | null> =>
  pg.evaluate((sel: string) => {
    const f = [...document.querySelectorAll('.finder')].at(-1);
    const el = f?.querySelector(sel) as HTMLElement | null;
    if (!el) return null;
    const r = el.getBoundingClientRect(), c = getComputedStyle(el);
    return { w: r.width, h: r.height, bt: parseFloat(c.borderTopWidth), bs: c.borderTopStyle,
             fs: c.fontSize, disp: c.display, jc: c.justifyContent, shrink: c.flexShrink,
             ch: el.clientHeight, sh: el.scrollHeight };
  }, sel);
const resBreite = (pg: import('playwright').Page): Promise<number> =>
  pg.evaluate(() => {
    const f = [...document.querySelectorAll('.finder')].at(-1);
    const r = f?.querySelector('.res') as HTMLElement | null;
    return r ? r.clientWidth : 0;
  });
const zu = (pg: import('playwright').Page): Promise<void> =>
  pg.evaluate(() => { document.querySelectorAll('.overlay').forEach(o => o.remove()); });

const pc = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await vorbereiten(pc);

/* ---------------------------------------------------------------------------
 * §1 Schlagwortpillen
 * ------------------------------------------------------------------------- */
console.log('\n1 · Die Schlagwortpillen sind Pillen, der Treffer eine Zeile');
await pc.evaluate(() => { Links.tagRegister('echt'); });
await pc.waitForTimeout(400);
{
  const res = await resBreite(pc);
  const pille = await mass(pc, '.tagpill');
  const treffer = await mass(pc, '.tagtreffer');
  p('Das Register ist offen und hat eine Breite', res > 300, String(res));
  p('Eine Pille ist höchstens halb so breit wie die Liste',
    !!pille && pille.w > 20 && pille.w <= res / 2, JSON.stringify(pille));
  p('Die Pille ist inline, kein Flex-Block', !!pille && pille.disp !== 'flex', pille?.disp);
  p('Der Treffer darunter füllt die Zeile (≥ 85 %)',
    !!treffer && treffer.w >= res * 0.85, `${treffer?.w} von ${res}`);
  p('Und der Treffer hat einen Rand', !!treffer && treffer.bt >= 1 && treffer.bs === 'solid',
    JSON.stringify(treffer));
}
await zu(pc);

/* ---------------------------------------------------------------------------
 * §2 Sprungziele sind keine Schlagwörter
 * ------------------------------------------------------------------------- */
console.log('\n2 · Ein Markdown-Sprungziel ist kein Schlagwort');
{
  const tags: string[] = await pc.evaluate(() => Links.alleTags().map((t: any) => t.tag));
  p('#echt ist da', tags.includes('echt'), tags.join(','));
  p('#wissen aus dem Titel ist da', tags.includes('wissen'));
  p('(#klammer) zählt — die Klammer gehört nicht zum Wort', tags.includes('klammer'), tags.join(','));
  p('Kein Schlagwort beginnt mit „("', !tags.some(t => t.startsWith('(')), tags.join(','));
  p('[Formeln](#2-formeln) ist KEIN Schlagwort', !tags.includes('2-formeln'), tags.join(','));
  p('Umlaute bleiben: #prüfung', tags.includes('prüfung'), tags.join(','));
}

/* ---------------------------------------------------------------------------
 * §3 Notion-Formate
 * ------------------------------------------------------------------------- */
console.log('\n3 · Notion-Formate: Knöpfe mit Rand, Ausgabe ohne Schwund');
await pc.evaluate(() => { NotionFormat.dialog(); });
await pc.waitForTimeout(400);
{
  const res = await resBreite(pc);
  const rund = await mass(pc, 'button[data-a="rund"]');
  const hin = await mass(pc, 'button[data-a="hin"]');
  p('„Hin und zurück prüfen" hat einen Rand', !!rund && rund.bt >= 1 && rund.bs === 'solid',
    JSON.stringify(rund));
  p('… und eine eigene Breite, keine ganze Zeile (< 60 %)',
    !!rund && rund.w > 60 && rund.w < res * 0.6, `${rund?.w} von ${res}`);
  /* In einer Flex-Zeile wird `inline-flex` zu `flex` — das Mass ist die
     Breite oben, nicht der Anzeigemodus. Was bleibt: der Knopf ist zentriert,
     die Trefferzeile der Palette wäre links ausgerichtet. */
  p('… zentriert, nicht links wie eine Trefferzeile', rund?.jc === 'center', rund?.jc);
  p('Der Hauptknopf ebenso (< 60 %)', !!hin && hin.w < res * 0.6, `${hin?.w} von ${res}`);
  await pc.click('.finder button[data-a="hin"]');
  await pc.waitForTimeout(300);
  const aus = await mass(pc, '#nf-aus');
  p('Nach dem Übersetzen steht etwas in der Ausgabe', !!aus && aus.sh > 60, JSON.stringify(aus));
  p('Die Ausgabe schrumpft nicht (flex-shrink 0)', aus?.shrink === '0', aus?.shrink);
  p('… und ist mindestens 100 px hoch', !!aus && aus.ch >= 100, String(aus?.ch));
  const feld = await mass(pc, '#nf-formel');
  p('Das Formelfeld hat einen Rand', !!feld && feld.bt >= 1, JSON.stringify(feld));
}
await zu(pc);

/* ---------------------------------------------------------------------------
 * §4 Schnittstelle und Transaktionen
 * ------------------------------------------------------------------------- */
console.log('\n4 · Schnittstelle und Transaktionen: dieselben Klassen, dieselben Masse');
await oeffne(pc, 'Schnittstelle /v1/ und Token');
{
  const res = await resBreite(pc);
  const alle: Array<{ w: number; bt: number; cls: string }> = await pc.evaluate(() =>
    [...document.querySelectorAll('.finder .btn')].map(b => {
      const c = getComputedStyle(b);
      return { w: b.getBoundingClientRect().width, bt: parseFloat(c.borderTopWidth), cls: b.className };
    }));
  p('Die Schnittstelle hat Knöpfe', alle.length >= 5, String(alle.length));
  p('Jeder Knopf hat einen Rand', alle.every(x => x.bt >= 1), JSON.stringify(alle.filter(x => x.bt < 1)));
  p('Keiner ist eine ganze Zeile (< 60 %)', alle.every(x => x.w < res * 0.6),
    JSON.stringify(alle.filter(x => x.w >= res * 0.6)));
  const tok = await mass(pc, '#api-token');
  const pf = await mass(pc, '#api-p');
  p('Das Token-Feld hat einen Rand', !!tok && tok.bt >= 1, JSON.stringify(tok));
  p('Das Pfad-Feld hat einen Rand', !!pf && pf.bt >= 1, JSON.stringify(pf));
  const aus = await mass(pc, '#api-aus');
  p('Die Ausgabe schrumpft nicht', aus?.shrink === '0', aus?.shrink);
}
await oeffne(pc, 'Interne Befehle und Transaktionen');
{
  const res = await resBreite(pc);
  const alle: Array<{ w: number; bt: number }> = await pc.evaluate(() =>
    [...document.querySelectorAll('.finder .btn')].map(b => ({
      w: b.getBoundingClientRect().width, bt: parseFloat(getComputedStyle(b).borderTopWidth) })));
  p('Transaktionen haben Knöpfe', alle.length >= 2, String(alle.length));
  p('Jeder mit Rand, keiner eine ganze Zeile',
    alle.every(x => x.bt >= 1 && x.w < res * 0.6), JSON.stringify(alle));
  const ops = await mass(pc, '#tx-ops');
  p('Das Befehlsfeld hat einen Rand', !!ops && ops.bt >= 1, JSON.stringify(ops));
  const aus = await mass(pc, '#tx-aus');
  p('Die Ausgabe schrumpft nicht', aus?.shrink === '0', aus?.shrink);
}
await zu(pc);

/* ---------------------------------------------------------------------------
 * §5 Elektro-Arbeitsplatz
 * ------------------------------------------------------------------------- */
console.log('\n5 · Elektro-Arbeitsplatz: das Antwortfeld hat seinen Rand');
await oeffne(pc, 'Elektro: Arbeitsplatz');
await pc.click('.finder .ea-art[data-art="umrechnen"]').catch(() => {});
await pc.waitForTimeout(400);
{
  const f = await mass(pc, '.ea-antwort');
  p('Es gibt ein Antwortfeld', !!f, 'kein .ea-antwort');
  p('… mit Rand (1 px solid) — die Paletten-Regel nahm ihn weg',
    !!f && f.bt >= 1 && f.bs === 'solid', JSON.stringify(f));
}
await zu(pc);

/* ---------------------------------------------------------------------------
 * §6 Protokoll
 * ------------------------------------------------------------------------- */
console.log('\n6 · Protokoll: Suchfeld und Auswahl mit Rand');
await pc.evaluate(() => { Protokoll.dialog(); });
await pc.waitForTimeout(400);
{
  const s = await mass(pc, '#pr-suche');
  const a = await mass(pc, '#pr-art');
  const v = await mass(pc, '#pr-von');
  p('Das Suchfeld hat einen Rand', !!s && s.bt >= 1, JSON.stringify(s));
  p('Die Artenauswahl hat einen Rand', !!a && a.bt >= 1, JSON.stringify(a));
  p('Das Datumsfeld hat einen Rand', !!v && v.bt >= 1, JSON.stringify(v));
  p('Das Suchfeld ist keine ganze Zeile', !!s && s.w < 500, String(s?.w));
}
await zu(pc);

/* ---------------------------------------------------------------------------
 * §7 Tempo — der Haken
 * ------------------------------------------------------------------------- */
console.log('\n7 · Tempo: der Haken ist ein Haken');
await pc.evaluate(() => { Tempo.dialog(); });
await pc.waitForTimeout(400);
{
  const h = await mass(pc, '#tp-cache');
  p('Es gibt den Haken', !!h, 'kein #tp-cache');
  p('… und er ist höchstens 24 px breit — nicht 100 %', !!h && h.w <= 24, String(h?.w));
  const hinweis = await mass(pc, '.tp-hinweis input');
  gleich('Das Zeilenfeld im Hinweis nennt 14 px selbst', hinweis?.fs, '14px');
}
await zu(pc);

/* ---------------------------------------------------------------------------
 * §9 Tagesplan (am Rechner — am Telefon gelten 16 px für alle Felder)
 * ------------------------------------------------------------------------- */
console.log('\n9 · Tagesplan: „Aufgabe ohne Angabe" nennt seine 14 px selbst');
await pc.evaluate(() => { Plan.tagesplan(); });
await pc.waitForTimeout(500);
{
  const d = await mass(pc, '#pl-d');
  p('Das Feld ist da', !!d, 'kein #pl-d');
  gleich('… mit 14 px, nicht den 16 px der Palette', d?.fs, '14px');
  p('… und einem Rand', !!d && d.bt >= 1, JSON.stringify(d));
}
await zu(pc);

/* ---------------------------------------------------------------------------
 * §10 Die Palette selbst
 * ------------------------------------------------------------------------- */
console.log('\n10 · Die Palette bleibt die Palette');
await pc.evaluate(() => { Werkzeuge.palette(''); });
await pc.waitForTimeout(400);
{
  const res = await resBreite(pc);
  const q = await mass(pc, '#cq');
  gleich('Das Suchfeld hat 16 px', q?.fs, '16px');
  p('… und keinen Rand', !!q && q.bt === 0, JSON.stringify(q));
  p('… über die ganze Breite', !!q && q.w >= res * 0.95, `${q?.w} von ${res}`);
  const zeile = await mass(pc, '#cr > button');
  p('Ein Treffer ist da', !!zeile, 'kein #cr > button');
  p('… als Flex-Zeile über die ganze Breite', !!zeile && zeile.disp === 'flex' && zeile.w >= (res - 14) * 0.95,
    `${zeile?.w} (${zeile?.disp}) von ${res}`);
  p('… ohne Rand', !!zeile && zeile.bt === 0, String(zeile?.bt));
}
await zu(pc);

/* ---------------------------------------------------------------------------
 * §8 Protokoll am Telefon
 * ------------------------------------------------------------------------- */
console.log('\n8 · Protokoll am Telefon: der Hinweis bekommt die Zeile, die Knöpfe bleiben Knöpfe');
const ktx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const ph = await ktx.newPage();
await vorbereiten(ph);
await ph.evaluate(() => { Protokoll.dialog(); });
await ph.waitForTimeout(500);
{
  const m: { fb: number; hw: number; hh: number; kn: number[] } | null = await ph.evaluate(() => {
    const f = [...document.querySelectorAll('.finder')].at(-1);
    const fb = f?.querySelector('.fbtns') as HTMLElement | null;
    const h = f?.querySelector('#pr-hinweis') as HTMLElement | null;
    if (!fb || !h) return null;
    const c = getComputedStyle(fb);
    const innen = fb.clientWidth - parseFloat(c.paddingLeft) - parseFloat(c.paddingRight);
    return { fb: innen, hw: h.getBoundingClientRect().width, hh: h.getBoundingClientRect().height,
             kn: [...fb.querySelectorAll('button')].map(b => b.getBoundingClientRect().height) };
  });
  p('Fussleiste und Hinweis sind da', !!m, 'fehlt');
  p('Der Hinweis nimmt die ganze Zeile (≥ 90 %)', !!m && m.hw >= m.fb * 0.9, `${m?.hw} von ${m?.fb}`);
  p('Kein Knopf ist höher als 50 px', !!m && m.kn.length >= 2 && m.kn.every(x => x <= 50),
    JSON.stringify(m?.kn));
  p('Und das Suchfeld hat auch hier seinen Rand', (await mass(ph, '#pr-suche'))?.bt! >= 1);
}
await ktx.close();

p('Keine Seitenfehler', fehler.length === 0, fehler.join(' | '));
await browser.close();
await new Promise<void>(f => server.close(() => f()));
console.log(`\n${ok}/${ok + weg} bestanden`);
process.exit(weg ? 1 : 0);
