/* Suite 187 — „Volle Breite" muss breiter sein (§47, §37)
 * ============================================================================
 * Gefunden beim Ansehen des Telefonbildes vom Dokumentmodus (§55), gemessen
 * statt geschätzt:
 *
 *     390 px Telefon
 *       gewöhnliche Seite    28 px Rand   →  334 px Inhalt
 *       „Volle Breite"       60 px Rand   →  270 px Inhalt
 *
 * Der Modus, den man wählt, um MEHR Platz zu bekommen, gab weniger. Die
 * Ursache ist dieselbe wie in E148 und steht im selben Block: `#page` ist
 * eine Kennung, `#page.wide` eine Kennung plus eine Klasse — und die
 * gewinnt, auch am Telefon, auch aus der später geladenen Datei.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 * §1 war vor E156 rot; das ist die Messung oben. §3 ist die Gegenrichtung:
 * am Rechner MUSS „Volle Breite" mehr geben als die gewöhnliche Seite, sonst
 * hiesse der Modus umsonst so.
 *
 *   node pruefungen/lauf/test221.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8979;

const TYP: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.json': 'application/json',
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

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};

const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll),
    `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

const browser = await chromium.launch();
const fehler: string[] = [];

/** Beide Modi derselben Seite, in einem Durchgang gemessen. */
const messen = (seite: any): Promise<any> => seite.evaluate(async () => {
  Store.setMeta('rundgangGesehen', true);
  document.getElementById('rg-willkommen')?.remove();
  document.querySelectorAll<HTMLElement>('.overlay, .produkt-onboarding-lage').forEach(o => o.remove());
  const s = Store.addPage(null, { text: 'Elektrotechnik – Skript', icon: '📕' });
  Store.addBlock(s.id, 'text', { text: 'Ein Absatz, der die Breite zeigt.' });
  Store.updateBlock(s.id, { cover: 'linear-gradient(90deg,#c33,#39c)' });
  await Store.flush();

  const einmal = async (wide: boolean) => {
    Store.updateBlock(s.id, { wide });
    App.oeffne(s.id);
    await new Promise(r => setTimeout(r, 800));
    const el = document.getElementById('page');
    const titel = document.getElementById('title');
    const cover = document.querySelector<HTMLElement>('.cover');
    const kc = cover?.getBoundingClientRect();
    return {
      wide,
      /* GEMESSEN WIRD DER INHALT, NICHT DER KASTEN. `clientWidth` zählt die
         Innenabstände mit — genau der Fehler aus E148. */
      inhalt: titel ? Math.round(titel.getBoundingClientRect().width) : -1,
      rand: el ? getComputedStyle(el).paddingLeft : '',
      coverLinks: kc ? Math.round(kc.left) : null,
      coverRechts: kc ? Math.round(kc.right) : null,
      fenster: document.documentElement.clientWidth,
      waagerecht: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
    };
  };
  return { normal: await einmal(false), breit: await einmal(true) };
});

/* ==========================================================================
 * §1 · Am Telefon gibt „Volle Breite" mehr, nicht weniger
 * ========================================================================*/
console.log('\n1 · Am Telefon gibt „Volle Breite" mehr, nicht weniger');
const telefon = await browser.newPage({ viewport: { width: 390, height: 844 } });
telefon.on('pageerror', (e: any) => fehler.push('PAGEERROR(Telefon): ' + String(e.message).slice(0, 120)));
await telefon.goto(`http://localhost:${PORT}/index.html`);
await telefon.waitForTimeout(2700);
const t = await messen(telefon);

p('Die gewöhnliche Seite nutzt den Bildschirm',
  t.normal.inhalt >= t.normal.fenster * .82,
  `${t.normal.inhalt} von ${t.normal.fenster}, Rand ${t.normal.rand}`);
p('„Volle Breite" gibt mindestens so viel',
  t.breit.inhalt >= t.normal.inhalt,
  `breit ${t.breit.inhalt} (Rand ${t.breit.rand}) gegen normal ${t.normal.inhalt} (${t.normal.rand})`);

/* ==========================================================================
 * §2 · Und der Aufmacher steht nicht daneben
 * --------------------------------------------------------------------------
 * `.cover` zieht sich mit einem negativen Rand über die Seitenränder hinaus.
 * Steht dort die Zahl vom Rechner, ragt er am Telefon aus dem Bild.
 * ========================================================================*/
console.log('\n2 · Und der Aufmacher steht nicht daneben');
for (const [name, m] of [['gewöhnlich', t.normal], ['Volle Breite', t.breit]] as [string, any][]) {
  p(`Der Aufmacher (${name}) fängt nicht vor dem Bildrand an`,
    (m.coverLinks ?? 0) >= -1, `${m.coverLinks}`);
  p(`Und hört nicht dahinter auf (${name})`,
    (m.coverRechts ?? 0) <= m.fenster + 1, `${m.coverRechts} von ${m.fenster}`);
  p(`Nichts muss waagerecht gerollt werden (${name})`, !m.waagerecht);
}

/* ==========================================================================
 * §3 · Und die Produktwelten behalten IHREN Rand
 * --------------------------------------------------------------------------
 * Eine Produktwelt wird ebenfalls in `#page` gezeichnet und trägt dabei auch
 * `wide`. Eine Telefonregel auf `#page.wide` gewinnt gegen die aus E148
 * (`#page.produkt-welt`, gleiche Spezifität, frühere Datei) — und nähme den
 * Produktwelten genau die Pixel wieder weg, die E148 ihnen geholt hat.
 *
 * Beim Bauen von E156 aufgefallen, BEVOR es passiert ist. Dieser Abschnitt
 * hält es fest, damit es beim nächsten Mal nicht unbemerkt passiert.
 * ========================================================================*/
console.log('\n3 · Und die Produktwelten behalten ihren Rand');
const welt = await telefon.evaluate(async () => {
  (globalThis as any).Produktwelten.workspace('uebersicht');
  await new Promise(r => setTimeout(r, 900));
  const el = document.getElementById('page');
  const shell = document.querySelector<HTMLElement>('.aw-shell');
  return {
    klassen: el?.className || '',
    rand: el ? getComputedStyle(el).paddingLeft : '',
    inhalt: shell ? Math.round(shell.getBoundingClientRect().width) : -1,
    fenster: document.documentElement.clientWidth
  };
});
p('Die Produktwelt liegt wirklich in #page.wide',
  /\bwide\b/.test(welt.klassen) && /produkt-welt/.test(welt.klassen), welt.klassen);
p('Und behält ihren schmalen Rand aus E148',
  parseFloat(welt.rand) <= 14, `${welt.rand}`);
p('Ihr Inhalt nutzt weiterhin über 90 % der Breite',
  welt.inhalt >= welt.fenster * .9, `${welt.inhalt} von ${welt.fenster}`);

/* ==========================================================================
 * §4 · Am Rechner bleibt „Volle Breite" das, was der Name sagt
 * ========================================================================*/
console.log('\n4 · Am Rechner bleibt „Volle Breite" das, was der Name sagt');
const rechner = await browser.newPage({ viewport: { width: 1400, height: 900 } });
rechner.on('pageerror', (e: any) => fehler.push('PAGEERROR(Rechner): ' + String(e.message).slice(0, 120)));
await rechner.goto(`http://localhost:${PORT}/index.html`);
await rechner.waitForTimeout(2700);
const r = await messen(rechner);
p('Dort gibt „Volle Breite" wirklich mehr',
  r.breit.inhalt > r.normal.inhalt + 100,
  `breit ${r.breit.inhalt} gegen normal ${r.normal.inhalt}`);
p('Und die gewöhnliche Seite bleibt eine Spalte',
  r.normal.inhalt < r.normal.fenster * .75,
  `${r.normal.inhalt} von ${r.normal.fenster}`);
p('Auch dort rollt nichts waagerecht',
  !r.normal.waagerecht && !r.breit.waagerecht);

/* ==========================================================================
 * §5 · Im Dokumentmodus bleibt der Kopf im Bild
 * --------------------------------------------------------------------------
 * `padding-inline:0` ist für die Arbeitsfläche richtig: eine PDF-Seite soll
 * am Telefon von Kante zu Kante gehen. Zeichen, Titel und Werkzeugzeile
 * stehen aber im selben Kasten und verloren ihren Rand mit.
 *
 * Gemessen am 25. August auf 390 px: die TINTE des Titels begann bei x = 0,
 * die Werkzeugzeile reichte bis 408. Genau das zeigte das Bildschirmfoto,
 * und ich hatte es zuerst für einen Lesefehler gehalten — die erste Messung
 * nahm eine gewöhnliche Seite und fand 28 px. Der Dokumentmodus hat eine
 * eigene Regel.
 *
 * GEMESSEN WIRD DIE TINTE, NICHT DER KASTEN. Ein Innenabstand verschiebt den
 * Inhalt, nicht das Rechteck — `getBoundingClientRect` sähe weiterhin 0 und
 * bliebe grün. Derselbe Fehler wie `clientWidth` in E148, nur andersherum.
 * ========================================================================*/
console.log('\n5 · Im Dokumentmodus bleibt der Kopf im Bild');

const dok = await telefon.evaluate(async () => {
  const s = Store.addPage(null, { text: 'Elektrotechnik – Skript', icon: '📕' });
  for (const nr of [1, 2, 3, 4]) Store.addBlock(s.id, 'pdfseite', { nr, suchtext: 'Seite ' + nr });
  Store.updateBlock(s.id, { dokumentModus: true });
  await Store.flush();
  App.oeffne(s.id);
  await new Promise(r => setTimeout(r, 1300));

  const tinte = (el: Element): number => {
    const kn = [...el.childNodes].find(n => n.nodeType === 3 && (n.textContent || '').trim())
      || el.firstElementChild;
    if (!kn) return -1;
    if (kn.nodeType === 3) {
      const rg = document.createRange();
      rg.setStart(kn, 0); rg.setEnd(kn, Math.min(1, (kn.textContent || '').length));
      return Math.round(rg.getBoundingClientRect().left);
    }
    return Math.round((kn as Element).getBoundingClientRect().left);
  };
  const seite = document.getElementById('page');
  return {
    imDokumentmodus: /document-page/.test(seite?.className || ''),
    fenster: document.documentElement.clientWidth,
    teile: [...(seite?.children || [])].map(el => {
      const k = el.getBoundingClientRect();
      return { name: (el as HTMLElement).id || String((el as HTMLElement).className).split(' ')[0],
        l: Math.round(k.left), r: Math.round(k.right), tinte: tinte(el),
        scroll: (el as HTMLElement).scrollWidth, klar: (el as HTMLElement).clientWidth };
    })
  };
});

p('Die Seite ist wirklich im Dokumentmodus', dok.imDokumentmodus);
const kopf = dok.teile.filter((x: any) => x.name !== 'document-workspace');
p('Es gibt einen Kopf zu prüfen', kopf.length >= 3,
  dok.teile.map((x: any) => x.name).join(', '));
gleich('Keines seiner Teile steht über den rechten Rand hinaus',
  kopf.filter((x: any) => x.r > dok.fenster + 1).map((x: any) => `${x.name}:${x.r}`), []);
gleich('Und keines fängt am Bildschirmrand an',
  kopf.filter((x: any) => x.tinte >= 0 && x.tinte < 12).map((x: any) => `${x.name}:${x.tinte}`), []);
/* Die Gegenrichtung: die Arbeitsfläche SOLL randlos sein. */
const flaeche = dok.teile.find((x: any) => x.name === 'document-workspace');
p('Die Arbeitsfläche selbst geht von Kante zu Kante',
  flaeche && flaeche.l <= 1 && flaeche.r >= dok.fenster - 1,
  JSON.stringify(flaeche));
/* Und was nicht hineinpasst, ist zu schieben statt abgeschnitten. */
const werkzeuge = dok.teile.find((x: any) => x.name === 'pg-tools');
p('Die Werkzeugzeile ist rollbar, nicht abgeschnitten',
  !werkzeuge || werkzeuge.scroll <= werkzeuge.klar || werkzeuge.r <= dok.fenster + 1,
  JSON.stringify(werkzeuge));

/* ========================================================================*/
console.log(`\n${ok}/${ok + weg} bestanden`);
if (fehler.length) console.log('Browserfehler:\n  ' + fehler.join('\n  '));
p('Keine unbehandelten Browserfehler', fehler.length === 0, fehler.join(' | '));

await browser.close();
await new Promise<void>(f => { server.close(() => f()); });
process.exitCode = weg ? 1 : 0;
