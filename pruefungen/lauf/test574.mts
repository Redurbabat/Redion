/* Suite 574 — Jeder Block auf die Fläche (E691, A1c)
 * ============================================================================
 * Redur, 26. September 2026: „ja mach den vollausbau, jeder block auf die
 * fläche ziehbar."
 *
 * WAS DAS HEISST. Bis E690 lag die ganze Seite als EIN Kasten auf der
 * Fläche. AFFiNEs Vollausbau geht weiter: dort trägt jeder Inhalt seinen
 * Platz (`xywh`) und ein Feld dafür, WO er erscheint (`displayMode` mit
 * `both` | `doc` | `edgeless`, `affine/model/src/consts/note.ts:38-42`).
 * Redion bekommt dasselbe, eine Stufe feiner: nicht die Notiz, sondern der
 * BLOCK ist die kleinste Einheit — genau das, was Redur gesagt hat.
 *
 * DIE ZWEI FELDER, und beide fehlen im Normalfall:
 *
 *     flaecheOrt   { x, y, w, raumVersion }   wo der Block auf der Fläche liegt
 *     zeigen       'beides' | 'seite' | 'flaeche'   wo er erscheint
 *
 * WAS DIESER LAUF HÄLT
 *
 *   §1  Die Felder und ihre Vorgaben. Kein Feld = wie bisher: der Block
 *       steht im Seitenkasten und in jeder Seitenansicht (§9).
 *   §2  Ziehen. Ein Block aus dem Seitenkasten auf die Fläche bekommt
 *       `flaecheOrt` AN DER STELLE, an der er losgelassen wurde, und wird
 *       sein eigener Kasten.
 *   §3  Verschieben. Der Kasten lässt sich am Kopf ziehen, und die Zahlen
 *       wandern in FLÄCHENEINHEITEN mit (nicht in Bildschirmpixeln).
 *   §4  Zurück. Wer den Kasten in den Seitenkasten zieht, hat den Block
 *       wieder im Text — `flaecheOrt` ist weg, nicht auf null.
 *   §5  Ausblenden. `zeigen: 'flaeche'` versteckt den Block in den
 *       Seitenansichten. Der Block bleibt am Leben, behält seinen Text und
 *       steht weiter in `content` des Elternteils. Der Kasten sagt es mit
 *       einem Wort, nicht nur mit einer Farbe (§38).
 *   §6  Die Reihenfolge. Ein herausgezogener Block, der wieder eingeblendet
 *       wird, steht an seiner alten Stelle im Text — nicht am Ende.
 *   §7  Nichts geht verloren. Nach allem: drei Blöcke, drei Texte, alle
 *       `alive`, alle im Baum der Seite.
 *   §8  Am Telefon. Die Griffe der Blöcke sind dort ausgeblendet
 *       (`ki.css:182`) — es MUSS also einen zweiten Weg geben, und der
 *       Kasten muss mit 44 px zu greifen sein (§37).
 *   §9  Der Seitenkasten bleibt, auch wenn kein Block mehr darin steht.
 *       Sonst gäbe es kein Ziel mehr für den Rückweg.
 *
 * GEGEN DEN STAND VON E690 ist alles ab §2 rot: es gibt weder das Feld noch
 * einen Weg, einen Block herauszuziehen.
 *
 *   node pruefungen/alle.mts 574
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
let ok = 0, weg = 0;
const p = (n: string, wahr: unknown, extra = ''): void => {
  if (wahr) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll), `ist ${JSON.stringify(ist)} soll ${JSON.stringify(soll)}`);
const nahe = (n: string, ist: number, soll: number, toleranz: number): void =>
  p(n, Math.abs(ist - soll) <= toleranz, `ist ${Math.round(ist)} soll ${Math.round(soll)} ± ${toleranz}`);

const TYP: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon'
};
const server = http.createServer((a, b) => {
  const rein = decodeURIComponent((a.url ?? '/').split('?')[0] ?? '/');
  const pfad = path.join(WURZEL, rein === '/' ? 'index.html' : rein.slice(1));
  if (!pfad.startsWith(WURZEL) || !fs.existsSync(pfad) || fs.statSync(pfad).isDirectory()) {
    b.writeHead(404); b.end(); return;
  }
  b.writeHead(200, { 'Content-Type': TYP[path.extname(pfad)] ?? 'application/octet-stream' });
  b.end(fs.readFileSync(pfad));
});
await new Promise<void>(f => { server.listen(0, '127.0.0.1', () => f()); });
const PORT = (server.address() as { port: number }).port;
const browser = await chromium.launch();

const TEXTE = ['Erster Absatz', 'Zweiter Absatz', 'Dritter Absatz'];

/** Eine Seite mit drei Absätzen, offen in der gewünschten Ansicht. */
const bauen = async (breite: number, hoehe: number, ansicht: string) => {
  const pg = await browser.newPage({ viewport: { width: breite, height: hoehe } });
  await pg.goto(`http://127.0.0.1:${PORT}/index.html`);
  await pg.waitForFunction(() => typeof App !== 'undefined' && !!document.querySelector('#page')?.firstElementChild);
  const ids = await pg.evaluate(async ([texte, art]: [string[], string]) => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung').forEach(el => el.remove());
    const s = Store.addPage(null, { text: 'Vollausbau', seitenAnsicht: art });
    const bs = texte.map(t => Store.addBlock(s.id, 'text', { text: t }));
    await Store.flush(); App.zeichneBaum(); App.oeffne(s.id);
    await new Promise(f => setTimeout(f, 900));
    document.querySelectorAll('#rg-willkommen, .overlay').forEach(x => x.remove());
    return { seite: s.id, bloecke: bs.map(b => b.id) };
  }, [TEXTE, ansicht] as [string[], string]);
  await pg.waitForTimeout(300);
  return { pg, ids };
};

const { pg, ids } = await bauen(1400, 950, 'flaeche');
const block = (i: number) => pg.evaluate((id: string) =>
  JSON.parse(JSON.stringify(Store.getBlock(id) ?? null)), ids.bloecke[i] as string);

/* ==========================================================================
 * §1 · Die Felder und ihre Vorgaben (§9)
 * ======================================================================== */
console.log('\n1 · Die Felder und ihre Vorgaben');
const frisch = await block(0);
p('Ein frischer Block trägt kein `flaecheOrt`', frisch?.flaecheOrt === undefined,
  JSON.stringify(frisch?.flaecheOrt));
p('… und kein `zeigen`', frisch?.zeigen === undefined, String(frisch?.zeigen));
const werte = await pg.evaluate(() => (window as any).Register?.seitenansichten?.ZEIGEN ?? null);
gleich('Der Katalog kennt die drei Orte', Array.isArray(werte) ? [...werte].sort() : werte,
  ['beides', 'flaeche', 'seite']);
const imKasten = await pg.evaluate(() =>
  document.querySelectorAll('.pg-fl-notiz[data-fl-seite] .blk').length);
gleich('Alle drei stehen ohne Feld im Seitenkasten', imKasten, 3);

/* ==========================================================================
 * §2 · Ziehen: aus dem Text auf die Fläche
 * --------------------------------------------------------------------------
 * ZWEI WEGE, und beide werden geprüft. Am Rechner der Griff `⋮⋮` mit dem
 * vorhandenen HTML5-Ziehen des Editors (`editor.ts:1990-2045`) — KEIN
 * zweiter Mechanismus daneben (§8). Und im Blockmenü ein Eintrag, denn am
 * Telefon ist der Griff ausgeblendet (`ki.css:182`), und HTML5-Ziehen kennt
 * keine Finger.
 * ======================================================================== */
console.log('\n2 · Ziehen: aus dem Text auf die Fläche');
const zielPunkt = await pg.evaluate(() => {
  const f = document.querySelector('.pg-flaeche')!.getBoundingClientRect();
  return { x: Math.round(f.left + f.width * 0.72), y: Math.round(f.top + 80) };
});
await pg.hover(`.blk[data-bid="${ids.bloecke[1]}"]`, { timeout: 3000 }).catch(() => null);
await pg.dragAndDrop(
  `.blk[data-bid="${ids.bloecke[1]}"] .handles button[data-act="menu"]`,
  '.pg-flaeche',
  { targetPosition: { x: 420, y: 80 }, force: true, timeout: 5000 }
).catch(() => { /* der Lauf misst das Ergebnis, nicht den Wurf */ });
await pg.waitForTimeout(500);
const gezogen = await block(1);
p('Nach dem Ziehen trägt der Block einen Ort auf der Fläche',
  !!gezogen?.flaecheOrt, JSON.stringify(gezogen?.flaecheOrt));
p('Der Ort trägt die Deutung der Zahlen mit (`raumVersion`, E686)',
  gezogen?.flaecheOrt?.raumVersion === 1, String(gezogen?.flaecheOrt?.raumVersion));
p('Und er hat einen eigenen Kasten auf der Fläche',
  await pg.evaluate((id: string) => !!document.querySelector(`.pg-fl-notiz[data-fl-block="${id}"]`), ids.bloecke[1] as string));
gleich('Im Seitenkasten stehen jetzt zwei',
  await pg.evaluate(() => document.querySelectorAll('.pg-fl-notiz[data-fl-seite] .blk').length), 2);
p('Und er steht WEITER in der Kinderliste der Seite (§9)',
  await pg.evaluate(([s, b]: string[]) =>
    (Store.getBlock(s as string)?.content ?? []).includes(b as string),
    [ids.seite, ids.bloecke[1]] as string[]));

/* ==========================================================================
 * §3 · Verschieben — in Flächeneinheiten, nicht in Bildschirmpixeln
 * ======================================================================== */
console.log('\n3 · Den Kasten verschieben');
const vorher = (await block(1))?.flaecheOrt ?? { x: 0, y: 0 };
/* Erst auf 50 % zoomen: bei Massstab 1 sähe ein Fehler in der Umrechnung
   genauso aus wie kein Fehler (derselbe Fund wie E686). */
await pg.evaluate(() => {
  document.querySelector<HTMLElement>('.pg-flaeche .gfx-tb-sockel [data-a="kleiner"]')?.click();
  document.querySelector<HTMLElement>('.pg-flaeche .gfx-tb-sockel [data-a="kleiner"]')?.click();
  document.querySelector<HTMLElement>('.pg-flaeche .gfx-tb-sockel [data-a="kleiner"]')?.click();
});
await pg.waitForTimeout(250);
const massstab = await pg.evaluate(() =>
  Number((document.querySelector('.pg-fl-massstab')?.textContent ?? '100').replace(/[^\d]/g, '')) / 100);
/* MIT KURZER GEDULD UND OHNE ABSTURZ. Ein Wächter, der vor dem Bau rot
   eingecheckt wird (§30), muss die GANZE Liste drucken — sonst weiss
   niemand, was er alles hält. Ohne die zwei Sekunden und das `catch`
   wartete er hier 30 s auf einen Kasten, den es noch nicht gibt, und starb
   mitten im Bericht. */
const kopf = await pg.locator(`.pg-fl-notiz[data-fl-block="${ids.bloecke[1]}"] .pg-fl-kopf`)
  .boundingBox({ timeout: 2000 }).catch(() => null);
if (kopf) {
  await pg.mouse.move(kopf.x + kopf.width / 2, kopf.y + kopf.height / 2);
  await pg.mouse.down();
  await pg.mouse.move(kopf.x + kopf.width / 2 + 120, kopf.y + kopf.height / 2 + 60, { steps: 8 });
  await pg.mouse.up();
}
await pg.waitForTimeout(350);
const nachher = (await block(1))?.flaecheOrt ?? { x: 0, y: 0 };
p('Es gibt einen Massstab unter 1 zum Messen', massstab > 0 && massstab < 1, String(massstab));
nahe('120 Bildschirmpixel sind 120/z Flächeneinheiten in x',
  Number(nachher.x) - Number(vorher.x), 120 / (massstab || 1), 12);
nahe('60 Bildschirmpixel sind 60/z Flächeneinheiten in y',
  Number(nachher.y) - Number(vorher.y), 60 / (massstab || 1), 12);

/* ==========================================================================
 * §4 · Zurück in den Text
 * --------------------------------------------------------------------------
 * `flaecheOrt` muss WEG sein, nicht auf null: ein Feld mit `null` ist etwas
 * anderes als kein Feld, und §9 sagt, kein Feld heisst „wie bisher".
 * ======================================================================== */
console.log('\n4 · Zurück in den Text');
await pg.evaluate((id: string) => {
  document.querySelector<HTMLElement>(`.pg-fl-notiz[data-fl-block="${id}"] .pg-fl-kopf button[data-a="menu"]`)?.click();
}, ids.bloecke[1] as string).catch(() => null);
await pg.waitForTimeout(250);
p('Der Kasten hat ein Menü', await pg.evaluate(() => !!document.querySelector('.menu button[data-a="fl-zurueck"]')));
await pg.evaluate(() => document.querySelector<HTMLElement>('.menu button[data-a="fl-zurueck"]')?.click());
await pg.waitForTimeout(450);
const zurueck = await block(1);
p('`flaecheOrt` ist weg, nicht null', zurueck && !('flaecheOrt' in zurueck),
  JSON.stringify(zurueck?.flaecheOrt));
gleich('Und im Seitenkasten stehen wieder drei',
  await pg.evaluate(() => document.querySelectorAll('.pg-fl-notiz[data-fl-seite] .blk').length), 3);

/* ==========================================================================
 * §5 · Auf der Seite ausblenden — verstecken, nicht löschen
 * ======================================================================== */
console.log('\n5 · Auf der Seite ausblenden');
await pg.evaluate((id: string) => {
  const b = Store.getBlock(id);
  (window as any).Seitenflaeche?.aufFlaeche?.(b, { x: 40, y: 40 });
}, ids.bloecke[2] as string).catch(() => null);
await pg.waitForTimeout(400);
await pg.evaluate((id: string) => {
  document.querySelector<HTMLElement>(`.pg-fl-notiz[data-fl-block="${id}"] .pg-fl-kopf button[data-a="menu"]`)?.click();
}, ids.bloecke[2] as string);
await pg.waitForTimeout(250);
p('Es gibt „auf der Seite ausblenden"',
  await pg.evaluate(() => !!document.querySelector('.menu button[data-a="fl-verstecken"]')));
await pg.evaluate(() => document.querySelector<HTMLElement>('.menu button[data-a="fl-verstecken"]')?.click());
await pg.waitForTimeout(450);
const versteckt = await block(2);
gleich('Der Block steht auf „nur Fläche"', versteckt?.zeigen, 'flaeche');
p('Er lebt', versteckt?.alive !== false, String(versteckt?.alive));
gleich('Und behält seinen Text', versteckt?.text, TEXTE[2]);
p('Der Kasten sagt es mit einem Wort, nicht nur mit einer Farbe (§38)',
  await pg.evaluate((id: string) => {
    const k = document.querySelector(`.pg-fl-notiz[data-fl-block="${id}"]`);
    const t = (k?.textContent ?? '').toLowerCase();
    return t.includes('seite') && (t.includes('nicht') || t.includes('aus'));
  }, ids.bloecke[2] as string));

/* --- und in den Seitenansichten ist er wirklich weg ---------------------- */
for (const art of ['redion', 'seite']) {
  await pg.evaluate((a: string) => {
    document.querySelector<HTMLElement>(`.pg-ansichten [data-seg-wahl="${a}"]`)?.click();
  }, art);
  await pg.waitForTimeout(450);
  const stand = await pg.evaluate(([id, texte]: [string, string[]]) => ({
    gezeichnet: !!document.querySelector(`#page .blk[data-bid="${id}"]`),
    text: (document.querySelector('#page')?.textContent ?? ''),
    andere: texte.slice(0, 2).every(t => (document.querySelector('#page')?.textContent ?? '').includes(t))
  }), [ids.bloecke[2], TEXTE] as [string, string[]]);
  p(`In der Ansicht „${art}" ist er nicht gezeichnet`, stand.gezeichnet === false);
  p(`… und sein Text steht dort nicht`, !stand.text.includes(TEXTE[2] as string));
  p(`… aber die anderen zwei stehen da`, stand.andere === true);
}

/* ==========================================================================
 * §6 · Die Reihenfolge im Text bleibt
 * ======================================================================== */
console.log('\n6 · Die Reihenfolge');
await pg.evaluate((id: string) => { Store.updateBlock(id, { zeigen: 'beides' }); App.zeichneSeite(); },
  ids.bloecke[2] as string);
await pg.waitForTimeout(450);
gleich('Wieder eingeblendet steht er an seiner alten Stelle',
  await pg.evaluate(() => [...document.querySelectorAll('#page .blk .ct')]
    .map(e => (e.textContent ?? '').trim()).filter(t => t.startsWith('Erster') || t.startsWith('Zweiter') || t.startsWith('Dritter')),
  ), TEXTE);

/* ==========================================================================
 * §7 · Nichts geht verloren (§9)
 * ======================================================================== */
console.log('\n7 · Nichts geht verloren');
const alle = await pg.evaluate(([s, bs]: [string, string[]]) => ({
  kinder: Store.getBlock(s)?.content ?? [],
  texte: bs.map(b => Store.getBlock(b)?.text ?? null),
  leben: bs.map(b => Store.getBlock(b)?.alive !== false)
}), [ids.seite, ids.bloecke] as [string, string[]]);
gleich('Alle drei Texte stehen unverändert im Speicher', alle.texte, TEXTE);
gleich('Alle drei leben', alle.leben, [true, true, true]);
gleich('Und alle drei hängen an der Seite', alle.kinder.length, 3);
await pg.close();

/* ==========================================================================
 * §8 · Am Telefon (§37)
 * --------------------------------------------------------------------------
 * `ki.css:182` blendet die Griffe unter 760 px aus. Ein Weg, der nur über
 * den Griff geht, gäbe es am Telefon also gar nicht — und §37 sagt, das
 * Telefon ist der Normalfall.
 * ======================================================================== */
console.log('\n8 · Am Telefon');
const { pg: handy, ids: hIds } = await bauen(390, 844, 'redion');
p('Der Griff `⋮⋮` ist am Telefon wirklich aus (die Voraussetzung dieses Abschnitts)',
  await handy.evaluate(() => {
    const h = document.querySelector('.blk > .handles');
    return !!h && getComputedStyle(h).display === 'none';
  }));
await handy.evaluate((id: string) => {
  const b = document.querySelector<HTMLElement>(`.blk[data-bid="${id}"]`);
  b?.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true }));
}, hIds.bloecke[0] as string).catch(() => null);
await handy.waitForTimeout(300);
const wegDa = await handy.evaluate(() => !!document.querySelector('.menu button[data-a="flaeche"]'));
p('Es gibt einen zweiten Weg auf die Fläche, ohne Griff', wegDa === true);
await handy.evaluate(() => document.querySelector<HTMLElement>('.menu button[data-a="flaeche"]')?.click());
await handy.waitForTimeout(450);
p('Und er hat gewirkt',
  await handy.evaluate((id: string) => !!Store.getBlock(id)?.flaecheOrt, hIds.bloecke[0] as string));
await handy.evaluate(() => {
  document.querySelector<HTMLElement>('.pg-ansichten [data-seg-wahl="flaeche"]')?.click();
});
await handy.waitForTimeout(600);
const griff = await handy.evaluate((id: string) => {
  const g = document.querySelector<HTMLElement>(`.pg-fl-notiz[data-fl-block="${id}"] .pg-fl-kopf button[data-a="menu"]`);
  if (!g) return null;
  const r = g.getBoundingClientRect();
  return { w: Math.round(r.width), h: Math.round(r.height), raus: r.right > innerWidth + 1 };
}, hIds.bloecke[0] as string);
p('Der Menüknopf des Kastens ist da', !!griff, JSON.stringify(griff));
p('Er misst 44 px (§37)', !!griff && griff.w >= 44 && griff.h >= 44,
  griff ? `${griff.w}×${griff.h}` : '—');
p('Und steht im Bild', !!griff && griff.raus === false);

/* ==========================================================================
 * §9 · Der Seitenkasten bleibt, auch leer
 * ======================================================================== */
console.log('\n9 · Der leere Seitenkasten');
await handy.evaluate((bs: string[]) => {
  for (const id of bs) {
    const b = Store.getBlock(id);
    if (b && !b.flaecheOrt) (window as any).Seitenflaeche?.aufFlaeche?.(b, { x: 30, y: 30 });
  }
  App.zeichneSeite();
}, hIds.bloecke as string[]).catch(() => null);
await handy.waitForTimeout(600);
const leer = await handy.evaluate(() => {
  const k = document.querySelector<HTMLElement>('.pg-fl-notiz[data-fl-seite]');
  return { da: !!k, bloecke: k ? k.querySelectorAll('.blk').length : -1,
           sagt: (k?.textContent ?? '').length > 0 };
});
p('Der Seitenkasten steht noch da', leer.da === true);
gleich('Und ist leer', leer.bloecke, 0);
p('Er sagt, wofür er da ist (§38)', leer.sagt === true);
await handy.close();

await browser.close();
server.close();
console.log(`\n${ok} ok, ${weg} rot`);
process.exit(weg ? 1 : 0);
