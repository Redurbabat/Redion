/* Suite 276 — Das Regal merkt sich, wo man war (L77/L78 · E282)
 * ============================================================================
 * Redurs elfter Punkt aus E277: „Regalzustand persistieren, Listenbreite
 * verbessern, globale Inhaltssuche anbinden. Drag&Drop und tiefe
 * Fachverschachtelung später separat."
 *
 * Drei Dinge, drei Abschnitte — und jedes hat einen Rand, an dem es
 * schiefgehen kann:
 *
 *   §1 DER ZUSTAND überlebt das Neuladen (Reiter und offenes Fach).
 *      Der Rand: ein gemerktes Fach, das es nicht mehr gibt, darf das
 *      Regal nicht in eine leere Brotkrume öffnen.
 *   §2 DIE BRÜCKE zur grossen Suche steht da, sobald gesucht wird — auch
 *      wenn es Treffer gibt. Der Rand: sie darf beim TIPPEN erscheinen,
 *      nicht erst beim nächsten vollen Zeichnen.
 *   §3 DIE LISTE läuft nicht mehr über den ganzen Schirm.
 *      Der Rand: die Messung muss auf einem BREITEN Fenster stattfinden,
 *      sonst misst sie die Fensterbreite und nicht die Grenze.
 *
 * ─── KANN ER ROT WERDEN? (§55.2) ────────────────────────────────────────────
 * §1 war vor E282 rot (der Zustand war ausdrücklich flüchtig, siehe L78
 * Punkt 3), §2 ebenso (es gab die Zeile nicht), §3 auch (volle Breite, L78
 * Punkt 6). Dazu unten je eine Gegenprobe, die zeigt, dass die Messung
 * überhaupt greift.
 *
 *   node pruefungen/lauf/test276.mts
 * ==========================================================================*/
declare const Store: any; declare const App: any; declare const Notebook: any;
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9054;

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

/* BREIT messen — §3 misst eine Breitengrenze, und auf einem schmalen
   Fenster gäbe jede Grenze dasselbe Ergebnis wie keine. */
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1600, height: 950 } });
const seite = await ctx.newPage();
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 140)));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForFunction(
  () => typeof Store !== 'undefined' && typeof App !== 'undefined' &&
        typeof (globalThis as any).Notebook !== 'undefined', null, { timeout: 30000 });
await seite.waitForTimeout(1200);

console.log('\nSuite 276 — Das Regal merkt sich, wo man war (L77/L78 · E282)');

/* Einen Bestand bauen: ein Fach mit zwei Heften, dazu ein loses Heft. */
const ids = await seite.evaluate(() => {
  Store.setMeta('rundgangGesehen', true);
  document.querySelectorAll('.overlay').forEach(e => e.remove());
  const blatt = (elternId: string) => Store.addBlock(elternId, 'blatt', { text: '' });
  const heft = (elternId: string | null, name: string) => {
    const h = Store.addBlock(elternId, 'page', { text: name });
    blatt(h.id);
    return h;
  };
  const fach = Store.addBlock(null, 'page', { text: 'Elektrotechnik' });
  const a = heft(fach.id, 'Grundlagen');
  const b = heft(fach.id, 'Messtechnik');
  const lose = heft(null, 'Loses Heft');
  return { fach: fach.id, a: a.id, b: b.id, lose: lose.id };
}) as any;

/* ------------------------------------------------------------------------ */
console.log('\n1 · Der Zustand überlebt das Neuladen');

await seite.evaluate(() => { Notebook.oeffnen(); });
await seite.waitForTimeout(700);

/* Ein Fach öffnen — wie ein Mensch: auf die Fach-Karte klicken. */
const fachAuf = await seite.evaluate((id: string) => {
  const karte = document.querySelector<HTMLElement>(`[data-fach="${id}"]`);
  if (!karte) return { geklickt: false, gemerkt: '' };
  karte.click();
  return { geklickt: true, gemerkt: String(Store.getMeta('heft:fach', '')) };
}, ids.fach) as any;
p('Die Fach-Karte ist da und lässt sich öffnen', fachAuf.geklickt);
p('Das offene Fach wird gemerkt', fachAuf.gemerkt === ids.fach,
  'gemerkt: ' + fachAuf.gemerkt);

/* Jetzt der eigentliche Punkt: neu laden und wieder öffnen. */
await seite.reload();
await seite.waitForFunction(
  () => typeof Store !== 'undefined' && typeof (globalThis as any).Notebook !== 'undefined',
  null, { timeout: 30000 });
await seite.waitForTimeout(1200);
const nachNeuladen = await seite.evaluate(() => {
  Notebook.oeffnen();
  return new Promise(f => setTimeout(() => f({
    krume: document.querySelector('.nh-zurueck') ? 'da' : 'fehlt',
    titel: document.querySelector('.nh-kopf-zeile h1')?.textContent?.trim() || ''
  }), 600));
}) as any;
p('Nach dem Neuladen steht das Regal WIEDER im Fach',
  nachNeuladen.krume === 'da' && /Elektrotechnik/.test(nachNeuladen.titel),
  JSON.stringify(nachNeuladen));

/* Der Reiter genauso. */
const reiterMerker = await seite.evaluate(() => {
  const zurueck = document.querySelector<HTMLElement>('.nh-zurueck');
  if (zurueck) zurueck.click();
  return new Promise(f => setTimeout(() => {
    const fav = document.querySelector<HTMLElement>('[data-reiter="favoriten"]');
    if (fav) fav.click();
    setTimeout(() => f(String(Store.getMeta('heft:reiter', ''))), 400);
  }, 400));
}) as string;
p('Der gewählte Reiter wird gemerkt', reiterMerker === 'favoriten', reiterMerker);

/* GEGENPROBE — und sie ist der wichtigste Punkt dieses Abschnitts: ein
   gemerktes Fach, das gelöscht wurde, darf das Regal NICHT in eine leere
   Brotkrume öffnen. Genau das wäre die naheliegende Umsetzung ohne
   Wächter. */
const totesFach = await seite.evaluate((id: string) => {
  Store.setMeta('heft:reiter', 'dokumente');
  Store.setMeta('heft:fach', id);
  Store.trashBlock(id);
  Notebook.oeffnen();
  return new Promise(f => setTimeout(() => f({
    krume: document.querySelector('.nh-zurueck') ? 'da' : 'fehlt',
    merker: String(Store.getMeta('heft:fach', ''))
  }), 600));
}, ids.fach) as any;
p('Gegenprobe: ein gelöschtes Fach öffnet die Wurzel, nicht das Nichts',
  totesFach.krume === 'fehlt', JSON.stringify(totesFach));
p('… und der tote Merker wird dabei geräumt', totesFach.merker === '',
  'sonst prüft er ihn bei jedem Öffnen wieder');

/* Und ein unbekannter Reiter fällt auf Dokumente zurück. */
const wirrerReiter = await seite.evaluate(() => {
  Store.setMeta('heft:reiter', 'gibtsnicht');
  Notebook.oeffnen();
  return new Promise(f => setTimeout(() => f(
    document.querySelector('[data-reiter="dokumente"]')?.className || ''), 600));
}) as string;
p('Gegenprobe: ein unbekannter Reiter fällt auf Dokumente zurück',
  /\bon\b/.test(wirrerReiter), wirrerReiter);

/* ------------------------------------------------------------------------ */
console.log('\n2 · Die Brücke zur grossen Suche');

const bruecke = await seite.evaluate(() => {
  Store.setMeta('heft:reiter', 'dokumente');
  Store.setMeta('heft:fach', '');
  Notebook.oeffnen();
  return new Promise(f => setTimeout(() => {
    const vorher = !!document.querySelector('.nh-weitersuchen');
    /* Wie ein Mensch: Suchfeld aufklappen und tippen. */
    const knopf = document.querySelector<HTMLElement>('[data-suche]');
    if (knopf) knopf.click();
    const feld = document.querySelector<HTMLInputElement>('.nh-suche');
    if (!feld) return f({ vorher, feld: false });
    feld.value = 'Grundlagen';
    feld.dispatchEvent(new Event('input', { bubbles: true }));
    setTimeout(() => f({
      vorher, feld: true,
      /* Treffer UND Brücke — sie steht auch dann da, wenn etwas gefunden wurde. */
      treffer: document.querySelectorAll('.bib-deckel[data-id], .nh-zeile-auf[data-id]').length,
      nachher: !!document.querySelector('.nh-weitersuchen'),
      text: document.querySelector('.nh-weitersuchen')?.textContent?.trim() || '',
      /* DA ZU SEIN REICHT NICHT. Beim Hinsehen fehlte das Suchzeichen —
         `Register.symbole.fuelle()` läuft am Ende von `render()`, und
         dieser Weg ruft `render` gerade nicht. Der Platzhalter stand als
         leere Lücke da. Die Prüfung fragte „ist die Brücke da?" und sagte
         ja (§55.1). */
      zeichen: !!document.querySelector('.nh-weitersuchen svg'),
      /* Und links bündig mit der Liste — `.rb` zentriert seinen Inhalt
         (grund.css:323), der Satz begann deshalb weit rechts. Zwei linke
         Kanten, die nicht übereinanderliegen, lesen sich wie zwei Dinge. */
      links: Math.round(
        (document.querySelector('.nh-weitersuchen')?.getBoundingClientRect().left ?? 0) -
        (document.querySelector('.nh-liste, .nh-gitter')?.getBoundingClientRect().left ?? 0))
    }), 300);
  }, 600));
}) as any;
p('Ohne Suchtext steht keine Brücke da', bruecke.vorher === false);
p('Das Suchfeld liess sich aufklappen', bruecke.feld === true);
p('Beim TIPPEN erscheint die Brücke — nicht erst beim nächsten Zeichnen',
  bruecke.nachher === true, JSON.stringify(bruecke));
p('… und sie steht da, OBWOHL es Treffer gibt', (bruecke.treffer || 0) > 0,
  'sonst prüft der Punkt darüber nur den Misserfolgsfall');
p('Sie nennt das gesuchte Wort', /Grundlagen/.test(bruecke.text), bruecke.text);
p('Ihr Suchzeichen ist wirklich gezeichnet, nicht nur ein Platzhalter',
  bruecke.zeichen === true,
  'ein leeres [data-sym] nimmt Breite und zeigt nichts');
p('Sie steht links bündig mit der Liste (± 20 px)',
  Math.abs(bruecke.links) <= 20, 'Versatz: ' + bruecke.links + ' px');
p('Und sagt, was sie mehr kann als das Regal', /Text/.test(bruecke.text), bruecke.text);

/* Sie führt wirklich zur grossen Suche — mit dem Wort darin. */
const gefuehrt = await seite.evaluate(() => {
  const b = document.querySelector<HTMLElement>('.nh-weitersuchen');
  if (!b) return { auf: false, wort: '' };
  b.click();
  const feld = document.querySelector<HTMLInputElement>('.overlay .such #q, .overlay #q');
  return { auf: !!feld, wort: feld ? feld.value : '' };
}) as any;
p('Der Klick öffnet die grosse Suche', gefuehrt.auf === true);
p('… und sie kennt das Wort schon', gefuehrt.wort === 'Grundlagen', gefuehrt.wort);

/* ------------------------------------------------------------------------ */
console.log('\n3 · Die Liste läuft nicht mehr über den ganzen Schirm');

const breiten = await seite.evaluate(() => {
  document.querySelectorAll('.overlay').forEach(e => e.remove());
  Store.setMeta('heft:form', 'liste');
  Notebook.oeffnen();
  return new Promise(f => setTimeout(() => {
    const liste = document.querySelector<HTMLElement>('.nh-liste');
    const regal = document.querySelector<HTMLElement>('.nh-regal');
    f({
      liste: liste ? Math.round(liste.getBoundingClientRect().width) : 0,
      regal: regal ? Math.round(regal.getBoundingClientRect().width) : 0,
      fenster: window.innerWidth
    });
  }, 700));
}) as any;
p('Die Liste steht überhaupt da', breiten.liste > 0, JSON.stringify(breiten));
p('Das Fenster ist breit genug, dass die Grenze etwas ändert',
  breiten.regal > 900, JSON.stringify(breiten) + ' — sonst misst §3 nichts');
p('Die Liste ist SCHMALER als das Regal um sie herum',
  breiten.liste > 0 && breiten.liste < breiten.regal - 40, JSON.stringify(breiten));
p('… und trotzdem breit genug für lange Namen (über 600 px)',
  breiten.liste > 600, JSON.stringify(breiten));

p('Keine Seitenfehler', fehler.length === 0, fehler.join(' | ').slice(0, 200));

await browser.close();
server.close();
console.log(`\n${ok}/${ok + weg} bestanden`);
process.exitCode = weg ? 1 : 0;
