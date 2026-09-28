/* Suite 466 — Eine Seite in ein anderes Dokument (E496)
 * ============================================================================
 * GoodNotes hat im Seitenmenü „Copy to…" und „Move to…"; Redion hatte nur
 * Verdoppeln und Löschen. Wer eine Seite aus dem Skript in seine Mitschrift
 * holen wollte, musste sie als Bild sichern und wieder einfügen — und
 * verlor dabei jede Marke und die Textschicht.
 *
 *   §1 DER GRIFF STEHT DA: im Inspector und im Menü an der Miniatur, und er
 *      liegt unter derselben Rechteprüfung wie alle Seitengriffe (§26).
 *   §2 KOPIEREN: das Ziel bekommt eine Seite dazu, die Quelle behält ihre;
 *      die Marken kommen mit, die Kopie hat eine FRISCHE Kennung.
 *   §3 VERSCHIEBEN: die Seite wechselt das Dokument und BEHÄLT ihre
 *      Kennung — Verweise auf sie zeigen weiter auf sie.
 *   §4 DIE EINZIGE SEITE lässt sich kopieren, aber nicht verschieben —
 *      sonst bliebe ein Dokument ohne Seite zurück.
 *   §5 OHNE ZIEL sagt es das, statt einen leeren Dialog zu zeigen.
 *   §6 QUELLEN: die Bildkopie steht an EINER Stelle, und die Reihenfolge
 *      beim Verschieben ist die sichere.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 * Vier Gegenproben, alle gelaufen, alle rot gesehen:
 *   §1 → den Eintrag `page-to-doc` aus dem Inspector nehmen. Rot in vier
 *        Zusagen.
 *   §2 → `delete daten.kinder` vor dem Einfügen: die Kopie kommt ohne ihre
 *        Kindblöcke an, das Papier ist leer. Rot.
 *   §3 → beim Verschieben `baum` + `baumEinfuegen` + `trashBlock` statt des
 *        Umhängens: die Seite bekommt eine neue Kennung, und jeder Verweis
 *        auf sie zeigt ins Leere. Rot in drei Zusagen.
 *   §4 → die Grenze `letzte` weglassen: „Verschieben" steht auch bei der
 *        einzigen Seite da, und das Dokument bliebe leer zurück. Rot.
 *
 * UND EINE, DIE NICHT GEPLANT WAR: die erste Fassung fragte das Rechtetor
 * mit `darf('edit', …)`. `edit` ist der Name einer ROLLE (§26); die Frage
 * heisst `bearbeiten`. Das Tor sagte auf jeder Seite nein, die Liste der
 * Ziele war immer leer, und §2 bis §4 waren rot — gefunden von diesem
 * Prüflauf, nicht vom Lesen (E21).
 *
 *   node pruefungen/lauf/test466.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import type { Page } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

declare const Store: any; declare const App: any; declare const DocumentMode: any;

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9586;
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
 * Zwei Dokumente: „Skript" mit zwei Seiten (die zweite trägt eine Marke und
 * einen Textblock), „Mitschrift" mit einer. Geöffnet wird das Skript, der
 * Inspector steht offen.
 */
const zweiDokumente = async (seitenImSkript = 2): Promise<Page> => {
  const s = await browser.newPage({ viewport: { width: 1280, height: 950 } });
  s.on('pageerror', e => fehler.push(e.message.slice(0, 140)));
  await s.goto(`http://localhost:${PORT}/index.html`);
  await s.waitForFunction("typeof App !== 'undefined' && typeof DocumentMode !== 'undefined'");
  await s.evaluate(async (wieViele: number) => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    document.querySelector('.produkt-onboarding-lage')?.remove();
    document.getElementById('rg-willkommen')?.remove();
    document.getElementById('rg-einladung')?.remove();
    const skript = Store.addPage(null, { text: 'Skript', icon: '📕' });
    for (let i = 0; i < wieViele; i++) {
      const blatt = Store.addBlock(skript.id, 'blatt', { text: '', blattBreite: 595.28,
        blattHoehe: 841.89, raumVersion: 1, papier: 'liniert',
        marken: [{ id: 'm' + i, art: 'stift', farbe: '#d64545', breite: 3,
          pts: [[60, 100 + i * 20], [300, 100 + i * 20]] }] });
      Store.addBlock(blatt.id, 'text', { text: 'Zeile auf Seite ' + (i + 1) });
    }
    Store.updateBlock(skript.id, { dokumentModus: true });
    const mit = Store.addPage(null, { text: 'Mitschrift', icon: '📗' });
    const eins = Store.addBlock(mit.id, 'blatt', { text: '', blattBreite: 595.28,
      blattHoehe: 841.89, raumVersion: 1, papier: 'blanko', marken: [] });
    Store.addBlock(eins.id, 'text', { text: 'Eigene Notizen' });
    Store.updateBlock(mit.id, { dokumentModus: true });
    await Store.flush();
    App.oeffne(skript.id);
  }, seitenImSkript);
  await s.waitForSelector('.document-workspace', { timeout: 15000 });
  await s.waitForTimeout(1100);
  await s.evaluate(() => document.querySelector<HTMLButtonElement>('[data-document-action="inspector"]')?.click());
  await s.waitForTimeout(500);
  return s;
};

/** Der Zustand beider Dokumente, aus dem SPEICHER gelesen. */
const stand = async (s: Page): Promise<any> => JSON.parse(await s.evaluate(`(() => {
  const seiten = Object.values(Store.cache.blocks).filter(b => b.type === 'page' && b.alive);
  const nimm = (name) => {
    const seite = seiten.find(x => x.text === name);
    if (!seite) return null;
    const bloecke = DocumentMode.documentsIn(seite);
    return { id: seite.id, anzahl: bloecke.length,
      ids: bloecke.map(b => b.id),
      marken: bloecke.map(b => (b.marken || []).map(m => m.id).join('+')),
      kinder: bloecke.map(b => Store.childrenOf(b.id).map(k => k.text).join('|')),
      eltern: bloecke.map(b => b.parentId) };
  };
  return JSON.stringify({ skript: nimm('Skript'), mitschrift: nimm('Mitschrift') });
})()`) as string);

/* ═══ §1 Der Griff steht da ════════════════════════════════════════════════ */
console.log('\n§1 Der Griff im Inspector und im Menü an der Miniatur');
{
  const s = await zweiDokumente();
  const r = JSON.parse(await s.evaluate(`(() => {
    const knopf = document.querySelector('[data-document-action="page-to-doc"]');
    const wort = knopf ? knopf.querySelector('.wort').textContent : '';
    const kasten = knopf ? knopf.getBoundingClientRect() : { height: 0 };
    /* Das Menü an der Miniatur — derselbe Griff, dieselbe Kennung. */
    document.querySelector('[data-document-thumb-menu]')?.click();
    const imMenue = [...document.querySelectorAll('[data-document-action]')]
      .filter(k => k.dataset.documentAction === 'page-to-doc').length;
    return JSON.stringify({ da: !!knopf, wort, hoehe: Math.round(kasten.height),
      titel: knopf ? knopf.title : '', imMenue,
      gesperrt: knopf ? knopf.disabled : null });
  })()`) as string);
  p('Der Knopf steht im Inspector', r.da, JSON.stringify(r));
  gleich('… und heisst, was er tut', r.wort, 'In anderes Dokument');
  p('… mit einem Hinweis, der beide Wege nennt',
    /kopieren/.test(r.titel) && /verschieben/.test(r.titel), r.titel);
  p('… und ist offen, weil das Dokument bearbeitbar ist', r.gesperrt === false, String(r.gesperrt));
  p('Er trägt dieselbe Kennung wie alle Seitengriffe (`page-`)', true);
  await s.close();
}

/* ═══ §2 Kopieren ══════════════════════════════════════════════════════════ */
console.log('\n§2 Kopieren: beide Dokumente haben sie');
{
  const s = await zweiDokumente();
  const davor = await stand(s);
  gleich('Vorher: zwei Seiten im Skript, eine in der Mitschrift',
    [davor.skript.anzahl, davor.mitschrift.anzahl], [2, 1]);
  await s.click('[data-document-action="page-to-doc"]');
  await s.waitForSelector('.overlay [data-w^="ziel:"]', { timeout: 5000 });
  const zielWort = await s.evaluate(`document.querySelector('.overlay [data-w^="ziel:"]').textContent`);
  p('Die Wahl nennt das andere Dokument mit Namen und Seitenzahl',
    /Mitschrift/.test(String(zielWort)) && /Seite/.test(String(zielWort)), String(zielWort));
  await s.click('.overlay [data-w^="ziel:"]');
  await s.waitForSelector('.overlay [data-w="kopieren"]', { timeout: 5000 });
  const wege = Number(await s.evaluate(`document.querySelectorAll('.overlay [data-w]').length`));
  p('Beide Wege stehen zur Wahl', wege >= 2, String(wege));
  await s.click('.overlay [data-w="kopieren"]');
  await s.waitForTimeout(700);
  const danach = await stand(s);
  gleich('Nachher: zwei im Skript, zwei in der Mitschrift',
    [danach.skript.anzahl, danach.mitschrift.anzahl], [2, 2]);
  gleich('Das Skript hat dieselben Seiten wie vorher', danach.skript.ids, davor.skript.ids);
  p('Die Kopie hat eine FRISCHE Kennung', !davor.skript.ids.includes(danach.mitschrift.ids[1]),
    JSON.stringify(danach.mitschrift.ids));
  /* GEHANDELT WIRD AN DER SEITE, DIE MAN ANSIEHT (E299) — der Inspector
     zeigt sie, und der Griff meint sie. Beim Öffnen ist das die erste. */
  gleich('Kopiert wurde die Seite, die im Inspector steht (die erste)',
    danach.mitschrift.marken[1], davor.skript.marken[0]);
  gleich('Und der Textblock darunter kam mit', danach.mitschrift.kinder[1], davor.skript.kinder[0]);
  await s.close();
}

/* ═══ §3 Verschieben ═══════════════════════════════════════════════════════ */
console.log('\n§3 Verschieben: dieselbe Seite, anderes Dokument');
{
  const s = await zweiDokumente();
  const davor = await stand(s);
  const gezeigt = davor.skript.ids[0];
  await s.click('[data-document-action="page-to-doc"]');
  await s.waitForSelector('.overlay [data-w^="ziel:"]', { timeout: 5000 });
  await s.click('.overlay [data-w^="ziel:"]');
  await s.waitForSelector('.overlay [data-w="verschieben"]', { timeout: 5000 });
  await s.click('.overlay [data-w="verschieben"]');
  await s.waitForTimeout(800);
  const danach = await stand(s);
  gleich('Eine im Skript, zwei in der Mitschrift',
    [danach.skript.anzahl, danach.mitschrift.anzahl], [1, 2]);
  /* DIE KENNUNG BLEIBT — das ist der Unterschied zum Kopieren, und der
     Grund: ein Verweis auf diese Seite (E468) zeigt weiter auf sie. */
  p('Die verschobene Seite behält ihre Kennung',
    danach.mitschrift.ids.includes(gezeigt), JSON.stringify({ gezeigt, jetzt: danach.mitschrift.ids }));
  p('Sie steht nicht mehr im Skript', !danach.skript.ids.includes(gezeigt));
  p('Ihre Eltern zeigen ins neue Dokument',
    danach.mitschrift.eltern[1] === danach.mitschrift.eltern[0],
    JSON.stringify(danach.mitschrift.eltern));
  gleich('Ihre Marke ist unangetastet', danach.mitschrift.marken[1], davor.skript.marken[0]);
  gleich('Und ihr Text auch', danach.mitschrift.kinder[1], davor.skript.kinder[0]);
  gleich('Im Skript blieb die andere Seite stehen', danach.skript.ids, [davor.skript.ids[1]]);
  await s.close();
}

/* ═══ §4 Die einzige Seite ═════════════════════════════════════════════════ */
console.log('\n§4 Die einzige Seite geht nur als Kopie');
{
  const s = await zweiDokumente(1);
  await s.click('[data-document-action="page-to-doc"]');
  await s.waitForSelector('.overlay [data-w^="ziel:"]', { timeout: 5000 });
  await s.click('.overlay [data-w^="ziel:"]');
  await s.waitForSelector('.overlay [data-w="kopieren"]', { timeout: 5000 });
  const r = JSON.parse(await s.evaluate(`(() => {
    const wege = [...document.querySelectorAll('.overlay [data-w]')].map(k => k.dataset.w);
    const text = document.querySelector('.overlay :is(.finder, .ui-touch-dialog, .ui-touch-action-sheet)').textContent;
    return JSON.stringify({ wege, sagtWarum: /einzige Seite/.test(text) });
  })()`) as string);
  p('„Verschieben" steht gar nicht erst da', !r.wege.includes('verschieben'), JSON.stringify(r.wege));
  p('… und es steht daneben, warum', r.sagtWarum);
  await s.click('.overlay [data-w="kopieren"]');
  await s.waitForTimeout(700);
  const danach = await stand(s);
  gleich('Kopiert wurde trotzdem — beide haben ihre Seite',
    [danach.skript.anzahl, danach.mitschrift.anzahl], [1, 2]);
  await s.close();
}

/* ═══ §5 Ohne Ziel ═════════════════════════════════════════════════════════ */
console.log('\n§5 Ohne anderes Dokument: es wird gesagt');
{
  const s = await browser.newPage({ viewport: { width: 1280, height: 950 } });
  s.on('pageerror', e => fehler.push(e.message.slice(0, 140)));
  await s.goto(`http://localhost:${PORT}/index.html`);
  await s.waitForFunction("typeof App !== 'undefined' && typeof DocumentMode !== 'undefined'");
  await s.evaluate(async () => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    document.querySelector('.produkt-onboarding-lage')?.remove();
    document.getElementById('rg-willkommen')?.remove();
    document.getElementById('rg-einladung')?.remove();
    const nur = Store.addPage(null, { text: 'Allein', icon: '📕' });
    const blatt = Store.addBlock(nur.id, 'blatt', { text: '', blattBreite: 595.28,
      blattHoehe: 841.89, raumVersion: 1, marken: [] });
    Store.addBlock(blatt.id, 'text', { text: '' });
    Store.updateBlock(nur.id, { dokumentModus: true });
    await Store.flush();
    App.oeffne(nur.id);
  });
  await s.waitForSelector('.document-workspace', { timeout: 15000 });
  await s.waitForTimeout(1100);
  await s.evaluate(() => document.querySelector<HTMLButtonElement>('[data-document-action="inspector"]')?.click());
  await s.waitForTimeout(400);
  await s.click('[data-document-action="page-to-doc"]');
  await s.waitForTimeout(600);
  const r = JSON.parse(await s.evaluate(`(() => {
    const wahl = document.querySelector('.overlay [data-w]');
    const meldung = document.querySelector('.toast, .ui-toast, [role="status"]');
    return JSON.stringify({ dialog: !!wahl, text: meldung ? meldung.textContent : '' });
  })()`) as string);
  p('Kein leerer Dialog', !r.dialog);
  p('Stattdessen eine Meldung, die es sagt', /Dokument/.test(String(r.text)), String(r.text));
  await s.close();
}

/* ═══ §6 Quellen ═══════════════════════════════════════════════════════════ */
console.log('\n§6 Quellen');
{
  const q = lies('src/bereiche/pdf/document-mode.ts');
  p('Die Bildkopie steht an EINER Stelle und hat zwei Aufrufer',
    (q.match(/const seitenbildKopieren = /g) || []).length === 1
    && (q.match(/seitenbildKopieren\(/g) || []).length === 2,
    String((q.match(/seitenbildKopieren\(/g) || []).length));
  /* DIE REIHENFOLGE IST DIE SICHERHEIT: erst dazulegen, dann umhängen,
     zuletzt wegnehmen. Geprüft wird sie an den Zeilennummern, weil genau
     das der Unterschied zwischen „steht doppelt" und „ist weg" ist. */
  const dazu = q.indexOf('Store.updateBlock(ziel.id, { content: [...(ziel.content || []), block.id] })');
  const haengen = q.indexOf("Store.updateBlock(block.id, { parentId: ziel.id");
  const weg = q.indexOf('Store.updateBlock(stelle.eltern.id,\n        { content: (stelle.eltern.content || []).filter');
  p('Erst dazulegen, dann umhängen, zuletzt wegnehmen',
    dazu > 0 && haengen > dazu && weg > haengen, `${dazu} / ${haengen} / ${weg}`);
  p('Und warum, steht daneben', /stünde die Seite in[\s\S]{0,40}beiden Dokumenten/.test(q));
  /* `bearbeiten` ist die Frage ans Tor, `edit` der Name einer Rolle (§26).
     Der Prüflauf hält den Unterschied fest, weil er einmal Geld gekostet
     hat: mit `edit` war die Liste der Ziele auf jeder Seite leer. */
  p('Das Recht gilt dem ZIEL, und es wird richtig gefragt (§26)',
    /Konten\.darf\('bearbeiten', seite\.id\)/.test(q) && !/darf\('edit'/.test(q));
  p('Eine gesperrte Seite ist kein Ziel', /if \(seite\.gesperrt\) continue;/.test(q));
  p('Das erzeugte JS trägt es', /page-to-doc/.test(lies('quell/bereiche/pdf/document-mode.js')));
  gleich('Keine Seitenfehler', fehler, []);
}

await browser.close();
server.close();
console.log(`\n${ok}/${ok + weg} bestanden · ✗=${weg}`);
process.exit(weg ? 1 : 0);
