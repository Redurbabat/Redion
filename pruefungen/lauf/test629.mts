/* Suite 629 — Beschriftung, alte Rasterspalte und die Originalbytes eines
 *             Relais-Plans: gelesen, gezeichnet, bearbeitet, gesichert (E767)
 * ============================================================================
 * Aus Redurs ZIP vom 1. November: ein Bauteil bekommt neben dem BMK eine
 * lesbare BESCHRIFTUNG („Hauptschütz"), eine importierte Relais-Datei merkt
 * sich die SPALTE ihres alten Rasters, und der Plan trägt die ORIGINALBYTES
 * der .sch (`relaisLegacy`, nie eine behauptete Netzliste). Alles optional —
 * alte Pläne bleiben, wie sie sind.
 *
 *   1 · LESEN lässt die Felder nur gültig durch (Länge, Bereich, Grösse der
 *       Rohbytes), alte Pläne bekommen keines davon dazu.
 *   2 · ZEICHNEN: die Beschriftung steht unter dem BMK, escaped, gekürzt mit
 *       dem vollen Text im <title>.
 *   3 · DER TEILDIALOG (Doppeltipp) hat ein Feld „Beschriftung"; leer heisst
 *       das Feld ist weg, nicht ein leerer Text.
 *   4 · EINE .json- UND EINE .redion-RUNDE (§13): sichern, alles löschen,
 *       zurückholen — Zeichen für Zeichen derselbe Plan.
 *   5 · Keine Seitenfehler.
 *
 *   node pruefungen/alle.mts 629
 * ==========================================================================*/
import { chromium } from 'playwright';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

declare const Store: any; declare const App: any; declare const Schaltplan: any;
declare const Dateien: any; declare const Einlesen: any;

const WURZEL = path.resolve(import.meta.dirname, '../..');
const INDEX = pathToFileURL(path.join(WURZEL, 'index.html')).href;

let ok = 0, weg = 0;
const p = (n: string, wahr: unknown, extra = ''): void => {
  if (wahr) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll),
    'ist ' + JSON.stringify(ist) + ', soll ' + JSON.stringify(soll));

const browser = await chromium.launch();
const fehler: string[] = [];
const ktx = await browser.newContext({ viewport: { width: 1300, height: 860 } });
const seite = await ktx.newPage();
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 160)));
seite.on('dialog', d => d.dismiss().catch(() => {}));
await seite.goto(INDEX);
await seite.waitForFunction(() => typeof App !== 'undefined' && typeof Store !== 'undefined'
  && typeof Schaltplan !== 'undefined' && !!document.querySelector('#page')?.firstElementChild,
  null, { timeout: 30000 });
await seite.evaluate(() => {
  Store.setMeta('rundgangGesehen', true);
  Store.setMeta('neuerungenGesehen', 99);
  Store.setMeta('kartenGemeldet', new Date().toISOString().slice(0, 10));
  document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung')
    .forEach(el => el.remove());
  const T = (id: string, zeichen: string, x: number, y: number, mehr: any = {}): any =>
    ({ id, zeichen, x, y, drehung: 0, gespiegelt: false, bmk: id, nummern: {}, gruppe: '', ebene: 'plan', ...mehr });
  (window as any).plan629 = (mehr: any = {}, teilMehr: any = {}): any => ({
    art: 'stromlauf-aufgeloest', breite: 600, hoehe: 400, texte: [],
    ebenen: [{ id: 'plan', name: 'Plan', farbe: 'var(--text)', sichtbar: true }],
    teile: [T('K1', 'spule', 100, 100, teilMehr), T('E1', 'lampe', 300, 100)],
    leitungen: [], ...mehr });
});

/* ══ §1 Lesen ══════════════════════════════════════════════════════════════ */
console.log('\n§1 Lesen lässt nur Gültiges durch');
const lesen = await seite.evaluate(() => {
  const P = (window as any).plan629;
  const roh = 'A'.repeat(5760);
  const lies = (mehr: any, teil: any) => Schaltplan.lesen({ plan: P(mehr, teil) });
  const gut = lies({ relaisLegacy: { name: 'Treppenhaus.sch', roh, txtRoh: 'T', texte: ['a', 'b'],
    verifiziert: false, bearbeitet: false, nichtVerifiziert: ['Verdrahtung'] } },
    { beschriftung: '  Hauptschütz  ', legacySpalte: 7 });
  const alt = lies({}, {});
  return {
    beschr: gut.teile[0].beschriftung ?? null,
    spalte: gut.teile[0].legacySpalte ?? null,
    legacy: gut.relaisLegacy ? { name: gut.relaisLegacy.name, n: gut.relaisLegacy.roh.length,
      texte: gut.relaisLegacy.texte, verifiziert: gut.relaisLegacy.verifiziert,
      nv: gut.relaisLegacy.nichtVerifiziert, format: gut.relaisLegacy.format } : null,
    altSchluessel: Object.keys(alt.teile[0]).filter(k => k === 'beschriftung' || k === 'legacySpalte'),
    altLegacy: 'relaisLegacy' in alt,
    lang: (lies({}, { beschriftung: 'x'.repeat(300) }).teile[0].beschriftung ?? '').length,
    leer: 'beschriftung' in lies({}, { beschriftung: '   ' }).teile[0],
    keinText: 'beschriftung' in lies({}, { beschriftung: 42 }).teile[0],
    spalte30: 'legacySpalte' in lies({}, { legacySpalte: 30 }).teile[0],
    spalteMinus: 'legacySpalte' in lies({}, { legacySpalte: -1 }).teile[0],
    spalteBruch: 'legacySpalte' in lies({}, { legacySpalte: 2.5 }).teile[0],
    kurzRoh: 'relaisLegacy' in lies({ relaisLegacy: { roh: 'A'.repeat(100), texte: [] } }, {}),
    ohneTexte: 'relaisLegacy' in lies({ relaisLegacy: { roh } }, {}),
    vieleTexte: lies({ relaisLegacy: { roh, texte: Array(50).fill('t'), verifiziert: 'ja' } }, {}).relaisLegacy
  };
});
gleich('Die Beschriftung kommt getrimmt an', lesen.beschr, 'Hauptschütz');
gleich('Die alte Spalte kommt an', lesen.spalte, 7);
gleich('Die Originalbytes kommen an, mit ihren Unsicherheiten',
  lesen.legacy, { name: 'Treppenhaus.sch', n: 5760, texte: ['a', 'b'], verifiziert: false,
    nv: ['Verdrahtung'], format: 'Relais-Schaltplan 9×30' });
gleich('Ein alter Plan bekommt keines der Felder dazu', [lesen.altSchluessel, lesen.altLegacy], [[], false]);
gleich('Eine Beschriftung hat höchstens 120 Zeichen', lesen.lang, 120);
gleich('Nur Leerzeichen oder eine Zahl sind keine Beschriftung', [lesen.leer, lesen.keinText], [false, false]);
gleich('Spalte 30, −1 und 2,5 gibt es im 30er-Raster nicht',
  [lesen.spalte30, lesen.spalteMinus, lesen.spalteBruch], [false, false, false]);
gleich('Rohbytes mit falscher Länge oder ohne Texte werden verworfen', [lesen.kurzRoh, lesen.ohneTexte], [false, false]);
gleich('Höchstens 30 Spaltentitel, und „verifiziert" nur bei true',
  [lesen.vieleTexte?.texte?.length, lesen.vieleTexte?.verifiziert], [30, false]);

/* ══ §2 Zeichnen ═══════════════════════════════════════════════════════════ */
console.log('\n§2 Die Beschriftung steht unter dem BMK');
const blk = await seite.evaluate(async () => {
  const s = Store.addPage(null, { text: 'Beschriftung', icon: '⚡' });
  const b = Store.addBlock(s.id, 'schaltplan', { text: 'Probe', plan: (window as any).plan629({},
    { beschriftung: 'Ein <b>sehr</b> langer Name für das Hauptschütz links' }) });
  await Store.flush();
  App.zeichneBaum(); App.oeffne(s.id);
  await new Promise(f => setTimeout(f, 900));
  document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung')
    .forEach(el => el.remove());
  return { seite: s.id, block: b.id };
});
await seite.waitForSelector('.sp-wrap .sp-teil[data-id="K1"]');
const bild = await seite.evaluate(() => {
  const g = document.querySelector('.sp-wrap svg .sp-teil[data-id="K1"]')!;
  const t = g.querySelector('.sp-teil-beschriftung');
  const bmk = [...g.querySelectorAll('text')].find(x => x.textContent === 'K1');
  return { da: !!t, text: t?.firstChild?.textContent ?? null, titel: t?.querySelector('title')?.textContent ?? null,
    keinB: !g.querySelector('b'), unter: !!t && !!bmk && Number(t.getAttribute('y')) > Number(bmk.getAttribute('y')),
    e1: !!document.querySelector('.sp-wrap svg .sp-teil[data-id="E1"] .sp-teil-beschriftung') };
});
p('Unter dem BMK steht die Beschriftung', bild.da && bild.unter, JSON.stringify(bild));
gleich('… gekürzt auf 38 Zeichen', bild.text, 'Ein <b>sehr</b> langer Name für das Hauptschütz links'.slice(0, 37) + '…');
gleich('… der volle Text im Titel', bild.titel, 'Ein <b>sehr</b> langer Name für das Hauptschütz links');
p('… und kein Markup daraus (escaped)', bild.keinB);
p('Ein Teil ohne Beschriftung zeichnet keine', !bild.e1);

/* ══ §3 Der Teildialog ═════════════════════════════════════════════════════ */
console.log('\n§3 Der Teildialog hat ein Feld „Beschriftung"');
const k1 = seite.locator('.sp-wrap svg .sp-teil[data-id="K1"]').first();
await k1.scrollIntoViewIfNeeded();
await k1.dblclick({ position: { x: 12, y: 18 } });
await seite.waitForTimeout(300);
const feld = seite.locator('.overlay #sp-beschriftung');
p('Der Dialog zeigt das Feld mit dem jetzigen Text', await feld.count() === 1 &&
  (await feld.inputValue()).startsWith('Ein <b>sehr</b>'));
if (await feld.count()) {
  await feld.fill('  Motor rechts ');
  await seite.click('.overlay button[data-a="ok"]');
  await seite.waitForTimeout(300);
}
gleich('Übernehmen speichert die getrimmte Beschriftung', await seite.evaluate((id: string) =>
  Store.getBlock(id).plan.teile.find((t: any) => t.id === 'K1')?.beschriftung ?? null, blk.block), 'Motor rechts');
await k1.dblclick({ position: { x: 12, y: 18 } });
await seite.waitForTimeout(300);
if (await feld.count()) {
  await feld.fill('   ');
  await seite.click('.overlay button[data-a="ok"]');
  await seite.waitForTimeout(300);
}
gleich('Leer übernommen: das Feld ist weg, kein leerer Text', await seite.evaluate((id: string) =>
  'beschriftung' in (Store.getBlock(id).plan.teile.find((t: any) => t.id === 'K1') ?? { beschriftung: 1 }), blk.block), false);

/* ══ §4 Sicherungsrunden ═══════════════════════════════════════════════════ */
console.log('\n§4 Eine .json- und eine .redion-Runde (§13)');
const runde = await seite.evaluate(async ({ block, seite: sid }) => {
  const roh = 'QUJD'.repeat(1440);
  const planSetzen = () => Store.updateBlock(block, { plan: (window as any).plan629({ relaisLegacy: {
    name: 'Alarmanlage.sch', format: 'Relais-Schaltplan 9×30', roh, txtRoh: '[Text]\r\nAlarm', texte: ['Alarm', 'Hupe'],
    verifiziert: false, bearbeitet: true, nichtVerifiziert: ['Kurzleitungen sind nur Lagehinweise'],
    texteBearbeitet: false } }, { beschriftung: 'Hauptschütz', legacySpalte: 12 }) });
  const sichern = async (): Promise<Blob> => {
    const gefangen: { blob: Blob | null } = { blob: null };
    const echtURL = URL.createObjectURL.bind(URL);
    const echtClick = HTMLAnchorElement.prototype.click;
    (URL as any).createObjectURL = (b: Blob) => { gefangen.blob = b; return 'blob:gefangen'; };
    HTMLAnchorElement.prototype.click = function (this: HTMLAnchorElement) {
      if (this.download) return;
      return echtClick.call(this);
    };
    try { await App.sicherungSpeichern(); }
    finally { (URL as any).createObjectURL = echtURL; HTMLAnchorElement.prototype.click = echtClick; }
    if (!gefangen.blob) throw new Error('Es wurde keine Sicherung geschrieben.');
    return gefangen.blob;
  };
  planSetzen();
  await Store.flush();
  const vorher = JSON.stringify(Store.getBlock(block).plan);
  const jsonBlob = await sichern();
  const jsonArt = Store.getMeta('sicherung:art');
  await Store.wipe();
  const leer = Object.keys(Store.cache.blocks).length;
  await Store.importAll(await jsonBlob.text(), 'ersetzen');
  const nachJson = JSON.stringify(Store.getBlock(block)?.plan ?? null);
  const gelesenJson = JSON.stringify(Schaltplan.lesen(Store.getBlock(block) ?? {}).relaisLegacy ?? null);

  const bytes = new Uint8Array(1024);
  for (let i = 0; i < bytes.length; i++) bytes[i] = (i * 11) % 256;
  const bildB = Store.addBlock(sid, 'image', { text: 'probe.bin' });
  await Dateien.ablegen(new File([bytes], 'probe.bin', { type: 'application/octet-stream' }),
    { blockId: bildB.id, name: 'probe.bin' });
  planSetzen();
  await Store.flush();
  const zipBlob = await sichern();
  const zipArt = Store.getMeta('sicherung:art');
  await Store.wipe();
  const zip = await Einlesen.zipLesenAusBlob(zipBlob);
  await Store.importAll(await zip.text('daten.json'), 'ersetzen');
  const nachZip = JSON.stringify(Store.getBlock(block)?.plan ?? null);
  return { vorher, jsonArt, leer, nachJson, gelesenJson, zipArt, nachZip };
}, blk);
gleich('Ohne Anhang schreibt Redion eine .json', runde.jsonArt, 'json');
gleich('… und danach war nichts mehr da', runde.leer, 0);
p('Der Plan ist aus der .json zurück, Zeichen für Zeichen', runde.nachJson === runde.vorher,
  runde.nachJson.slice(0, 160));
p('… und lesen() lässt die Originalbytes wieder durch', runde.gelesenJson.includes('"roh":"QUJD'));
gleich('Mit Anhang schreibt Redion ein .redion', runde.zipArt, 'redion');
p('Der Plan ist aus dem .redion zurück, Zeichen für Zeichen', runde.nachZip === runde.vorher,
  runde.nachZip.slice(0, 160));

/* ══ §5 ═══════════════════════════════════════════════════════════════════ */
console.log('\n§5 Keine Seitenfehler');
gleich('Keine Seitenfehler', fehler, []);
await browser.close();
console.log('\n' + ok + '/' + (ok + weg) + ' bestanden');
process.exit(weg ? 1 : 0);
