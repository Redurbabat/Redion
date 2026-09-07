/* Suite 459 — Die Suche über mehrere Dokumente (E487)
 * ============================================================================
 * L133: „**Suche über mehrere Dokumente** — die Suche gilt dem offenen
 * Dokument; die Schalensuche (Strg P) findet Seiten, nicht Stellen."
 *
 * Der Schalter „🗂" in der Suchleiste nimmt die anderen Dokumente dazu. Was
 * er verspricht, ist ehrlich verschieden: im OFFENEN Dokument findet die
 * Suche die STELLE auf der Seite (Kästen im Papier, E468/E484), in fremden
 * findet sie die SEITE — und wer hinspringt, sucht dort mit derselben
 * Frage weiter und bekommt auch dort die Stelle.
 *
 *   §1 DER SCHALTER: da, 44 px, mit `aria-pressed`, und sein Zustand
 *      überlebt das Neuzeichnen.
 *   §2 DIE LISTE: fremde Seiten mit Name, Seitenzahl und Textausschnitt —
 *      und die eigene Seite steht NICHT darin (sie hat ihre Kästen).
 *   §3 DER SPRUNG: ein Tipp öffnet das andere Dokument auf DER Seite, mit
 *      der Suchleiste offen und dem Wort darin.
 *   §4 NUTZERTEXT WIRD ESCAPT (§19) — ein PDF-Text mit `<img onerror>`
 *      bleibt Text.
 *   §5 QUELLEN, keine Seitenfehler.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 *   §1 → den Knopf `find-alle` aus der Leiste nehmen. Gelaufen, rot.
 *   §2 → in `fremdeTreffer` den Vergleich `seite.id === ausser` entschärfen
 *        (`ausser + '-nie'`): die eigene Seite steht doppelt da. Gelaufen,
 *        rot — drei Funde statt zwei.
 *        NICHT einfach die Zeile streichen: dann ist `ausser` unbenutzt und
 *        `noUnusedParameters` bricht den Bau ab. Eine Gegenprobe, die nicht
 *        baut, ist keine (CLAUDE.md §52.6).
 *   §3 → `sprungWunsch` nicht setzen: das andere Dokument geht auf, aber
 *        ohne Suche. Gelaufen, rot.
 *
 *   node pruefungen/lauf/test459.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import type { Page } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

declare const Store: any; declare const App: any; declare const DocumentMode: any;

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9579;
const TYP: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon', '.svg': 'image/svg+xml'
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
  p(n, JSON.stringify(ist) === JSON.stringify(soll), `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);
const lies = (f: string): string => fs.readFileSync(path.join(WURZEL, f), 'utf8');

const browser = await chromium.launch();
const fehler: string[] = [];

/**
 * Drei Dokumente: das offene „Skript" mit zwei Seiten, „Mitschrift" mit
 * zwei und „Fremdsprache" mit einer. Das gesuchte Wort steht in allen —
 * einmal im offenen (damit die Kästen etwas zu tun haben) und je einmal
 * in den fremden.
 */
const aufbauen = async (breit = 1280, hoch = 900): Promise<Page> => {
  const s = await browser.newPage({ viewport: { width: breit, height: hoch } });
  s.on('pageerror', e => fehler.push(e.message.slice(0, 140)));
  await s.goto(`http://localhost:${PORT}/index.html`);
  await s.waitForFunction("typeof App !== 'undefined' && typeof DocumentMode !== 'undefined'");
  await s.evaluate(async () => {
    Store.setMeta('rundgangGesehen', true);
    Store.setMeta('dokFindAlle', false);
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    document.querySelector('.produkt-onboarding-lage')?.remove();
    document.getElementById('rg-willkommen')?.remove();
    document.getElementById('rg-einladung')?.remove();
    const mach = (name: string, icon: string, texte: string[]) => {
      const seite = Store.addPage(null, { text: name, icon });
      texte.forEach((t, i) => Store.addBlock(seite.id, 'pdfseite',
        { text: '', nr: i + 1, vonSeiten: texte.length, bw: 595, bh: 842,
          quelleId: 'q-' + name, raumVersion: 1, suchtext: t }));
      Store.updateBlock(seite.id, { dokumentModus: true });
      return seite;
    };
    const offen = mach('Skript', '📕', ['Kapitel eins: Ohmsches Gesetz', 'Nichts von Belang']);
    mach('Mitschrift', '📗', ['Etwas anderes', 'Hier steht das Ohmsche Gesetz noch einmal']);
    mach('Fremdsprache', '📘', ['Ohmsches Gesetz auf Seite eins']);
    (window as any).__offen = offen.id;
    await Store.flush();
    App.oeffne(offen.id);
  });
  await s.waitForSelector('.document-workspace', { timeout: 15000 });

  return s;
};

console.log('\n§1 Der Schalter');
{
  const s = await aufbauen();
  await s.waitForTimeout(1200);
  await s.evaluate(() => document.querySelector<HTMLButtonElement>('.document-find-button')?.click());
  await s.waitForTimeout(300);
  const k = JSON.parse(await s.evaluate(`(() => {
    const b = document.querySelector('[data-document-action="find-alle"]');
    if (!b) return JSON.stringify({ da: false });
    const r = b.getBoundingClientRect();
    return JSON.stringify({ da: true, gedrueckt: b.getAttribute('aria-pressed'),
      titel: b.getAttribute('title'), hoch: Math.round(r.height), breit: Math.round(r.width) });
  })()`) as string);
  p('Der Schalter steht in der Suchleiste', k.da, JSON.stringify(k));
  p('… mit 44 px (§37)', k.hoch >= 44 && k.breit >= 44, JSON.stringify(k));
  gleich('… und ist zuerst aus', k.gedrueckt, 'false');
  p('… sein Name nennt, was er tut', /anderen Dokumenten/.test(String(k.titel)), String(k.titel));
  await s.evaluate(() => document.querySelector<HTMLButtonElement>('[data-document-action="find-alle"]')?.click());
  await s.waitForTimeout(300);
  gleich('Ein Tipp schaltet ihn an',
    await s.evaluate(`document.querySelector('[data-document-action="find-alle"]').getAttribute('aria-pressed')`), 'true');
  gleich('… und er merkt es sich', await s.evaluate(`Store.getMeta('dokFindAlle')`), true);
  await s.close();
}

console.log('\n§2 Die Liste der fremden Seiten');
{
  const s = await aufbauen();
  await s.waitForTimeout(1200);
  await s.evaluate(() => {
    document.querySelector<HTMLButtonElement>('.document-find-button')?.click();
  });
  await s.waitForTimeout(300);
  await s.evaluate(() => document.querySelector<HTMLButtonElement>('[data-document-action="find-alle"]')?.click());
  await s.waitForTimeout(200);
  await s.evaluate(() => {
    const f = document.querySelector<HTMLInputElement>('[data-document-find]')!;
    f.value = 'Ohmsche';
    f.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await s.waitForTimeout(900);
  const liste = JSON.parse(await s.evaluate(`(() => {
    const l = document.querySelector('.document-find-liste');
    return JSON.stringify({
      offen: !!l && !l.hidden,
      kopf: (l?.querySelector('.document-find-kopf') || {}).textContent || '',
      funde: [...(l?.querySelectorAll('.document-find-fund') || [])].map(b => ({
        zeile: b.querySelector('.document-find-fund-zeile').textContent,
        text: b.querySelector('.document-find-fund-text').textContent })),
      /* Und die Kästen im eigenen Papier stehen weiter da (E468). */
      eigene: document.querySelectorAll('.document-treffer').length });
  })()`) as string);
  p('Die Liste geht auf', liste.offen, JSON.stringify(liste));
  /* DAS SUCHFELD MUSS DABEI STEHEN BLEIBEN — der Fund des BILDES, nicht
     eines Prüflaufs: die Leiste war `display:flex` ohne `flex-wrap`, und
     die 100 % breite Liste drückte das Feld auf null Breite. Man sah eine
     Suchleiste ohne Suchfeld, und alles andere stimmte. */
  const lage = JSON.parse(await s.evaluate(`(() => {
    const f = document.querySelector('[data-document-find]').getBoundingClientRect();
    const l = document.querySelector('.document-find-liste').getBoundingClientRect();
    return JSON.stringify({ feldBreit: Math.round(f.width), feldUnten: Math.round(f.bottom),
      listeOben: Math.round(l.top), listeBreit: Math.round(l.width) });
  })()`) as string);
  p('Das Suchfeld behält seine Breite', lage.feldBreit > 200, JSON.stringify(lage));
  p('… und die Liste steht DARUNTER, nicht daneben',
    lage.listeOben >= lage.feldUnten - 1, JSON.stringify(lage));
  gleich('Zwei fremde Seiten', liste.funde.length, 2);
  p('… mit Name, Zeichen und Seitenzahl',
    liste.funde.some((f: any) => /📘 Fremdsprache · Seite 1/.test(f.zeile))
    && liste.funde.some((f: any) => /📗 Mitschrift · Seite 2/.test(f.zeile)),
    JSON.stringify(liste.funde.map((f: any) => f.zeile)));
  p('… und einem Ausschnitt, der das Wort enthält',
    liste.funde.every((f: any) => /Ohmsche/.test(String(f.text))),
    JSON.stringify(liste.funde.map((f: any) => f.text)));
  p('Das OFFENE Dokument steht nicht in der Liste — es hat seine Kästen',
    !liste.funde.some((f: any) => /Skript/.test(f.zeile)) && liste.eigene > 0,
    JSON.stringify({ zeilen: liste.funde.map((f: any) => f.zeile), eigene: liste.eigene }));

  /* AUS heisst AUS: der Schalter zurück, und die Liste ist weg. */
  await s.evaluate(() => document.querySelector<HTMLButtonElement>('[data-document-action="find-alle"]')?.click());
  await s.waitForTimeout(300);
  gleich('Schalter aus: die Liste ist weg',
    await s.evaluate(`document.querySelector('.document-find-liste').hidden`), true);
  gleich('… die Kästen im eigenen Papier bleiben',
    await s.evaluate(`document.querySelectorAll('.document-treffer').length > 0`), true);
  await s.close();
}

console.log('\n§3 Der Sprung ins andere Dokument');
{
  const s = await aufbauen();
  await s.waitForTimeout(1200);
  await s.evaluate(() => document.querySelector<HTMLButtonElement>('.document-find-button')?.click());
  await s.waitForTimeout(300);
  await s.evaluate(() => document.querySelector<HTMLButtonElement>('[data-document-action="find-alle"]')?.click());
  await s.waitForTimeout(200);
  await s.evaluate(() => {
    const f = document.querySelector<HTMLInputElement>('[data-document-find]')!;
    f.value = 'Ohmsche';
    f.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await s.waitForTimeout(900);
  await s.evaluate(() => {
    const knopf = [...document.querySelectorAll<HTMLElement>('.document-find-fund')]
      .find(b => /Mitschrift/.test(b.textContent || ''));
    knopf?.click();
  });
  await s.waitForTimeout(1600);
  const nach = JSON.parse(await s.evaluate(`(() => {
    const stelle = document.querySelector('.document-position');
    return JSON.stringify({
      titel: (document.querySelector('.document-title') || {}).textContent || '',
      stelle: (stelle || {}).textContent || '',
      suchbarOffen: !document.querySelector('.document-findbar').hidden,
      wort: (document.querySelector('[data-document-find]') || {}).value || '',
      zahl: (document.querySelector('.document-find-zahl') || {}).textContent || '',
      kaesten: document.querySelectorAll('.document-treffer').length });
  })()`) as string);
  p('Das andere Dokument ist offen', /Mitschrift/.test(nach.titel), JSON.stringify(nach));
  p('… auf SEINER Seite (Seite 2 von 2)', /2\s*\/\s*2/.test(nach.stelle), JSON.stringify(nach));
  p('… die Suchleiste steht offen', nach.suchbarOffen, JSON.stringify(nach));
  gleich('… mit demselben Wort', nach.wort, 'Ohmsche');
  p('… und die STELLE ist gefunden — Kästen im Papier',
    nach.kaesten > 0 && /1\s*\/\s*1|Treffer/.test(nach.zahl), JSON.stringify(nach));
  await s.close();
}

console.log('\n§4 Nutzertext bleibt Text (§19)');
{
  const s = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  s.on('pageerror', e => fehler.push(e.message.slice(0, 140)));
  await s.goto(`http://localhost:${PORT}/index.html`);
  await s.waitForFunction("typeof App !== 'undefined' && typeof DocumentMode !== 'undefined'");
  await s.evaluate(async () => {
    Store.setMeta('rundgangGesehen', true);
    Store.setMeta('dokFindAlle', true);
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    document.querySelector('.produkt-onboarding-lage')?.remove();
    document.getElementById('rg-willkommen')?.remove();
    document.getElementById('rg-einladung')?.remove();
    const offen = Store.addPage(null, { text: 'Skript', icon: '📕' });
    Store.addBlock(offen.id, 'pdfseite', { text: '', nr: 1, vonSeiten: 1, bw: 595, bh: 842,
      quelleId: 'q1', raumVersion: 1, suchtext: 'Nichts' });
    Store.updateBlock(offen.id, { dokumentModus: true });
    /* Der Seitenname UND der Text der Seite tragen Auszeichnung. */
    const boese = Store.addPage(null, { text: '<img src=x onerror="window.__geknackt=1">', icon: '📘' });
    Store.addBlock(boese.id, 'pdfseite', { text: '', nr: 1, vonSeiten: 1, bw: 595, bh: 842,
      quelleId: 'q2', raumVersion: 1,
      suchtext: 'Gefahr <img src=y onerror="window.__geknackt=2"> im Text' });
    Store.updateBlock(boese.id, { dokumentModus: true });
    await Store.flush();
    App.oeffne(offen.id);
  });
  await s.waitForSelector('.document-workspace', { timeout: 15000 });
  await s.waitForTimeout(1200);
  await s.evaluate(() => document.querySelector<HTMLButtonElement>('.document-find-button')?.click());
  await s.waitForTimeout(300);
  await s.evaluate(() => {
    const f = document.querySelector<HTMLInputElement>('[data-document-find]')!;
    f.value = 'Gefahr';
    f.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await s.waitForTimeout(900);
  const sicher = JSON.parse(await s.evaluate(`(() => {
    const l = document.querySelector('.document-find-liste');
    return JSON.stringify({
      geknackt: (window.__geknackt ?? null),
      bilder: l ? l.querySelectorAll('img').length : -1,
      funde: l ? l.querySelectorAll('.document-find-fund').length : 0,
      text: l ? (l.textContent || '').includes('<img') : false });
  })()`) as string);
  gleich('Kein Code ist gelaufen', sicher.geknackt, null);
  gleich('Kein Bild ist entstanden', sicher.bilder, 0);
  gleich('Der Fund steht da', sicher.funde, 1);
  p('… und die spitzen Klammern stehen als TEXT darin', sicher.text, JSON.stringify(sicher));
  await s.close();
}

console.log('\n§5 Quellen');
{
  const q = lies('src/bereiche/pdf/document-mode.ts');
  p('Die Fremdsuche steht als eigene Rechnung da', /const fremdeTreffer = /.test(q));
  p('… und lässt die offene Seite aus', /seite\.id === ausser/.test(q));
  p('Der Sprung merkt sich nur die Sitzung, nicht `meta`',
    /let sprungWunsch: /.test(q) && !/setMeta\('dokSprung/.test(q));
  p('Die Liste baut mit `textContent`, nicht mit `innerHTML` (§19)',
    /auszug\.textContent = t\.auszug/.test(q));
  p('Das erzeugte JS trägt es', /fremdeTreffer/.test(lies('quell/bereiche/pdf/document-mode.js')));
  p('Das Stilblatt kennt die Liste', /\.document-find-liste\{/.test(lies('quell/schale/stil/bausteine.css')));
  gleich('Keine Seitenfehler', fehler, []);
}

console.log(`\n${ok}/${ok + weg} bestanden · ✗=${weg}`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
