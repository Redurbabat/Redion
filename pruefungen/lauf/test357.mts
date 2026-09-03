/* Suite 357 — Der ZIP-Import ist ein Auftrag: er überlebt den geschlossenen Tab (E365, L114 Punkt 1)
 * ============================================================================
 * L114 Punkt 1: der Import lief im Tab. Wer ihn bei Datei 40 von 87 schloss,
 * hatte 39 Dokumente und KEIN WISSEN darüber, was fehlt — und es sah aus,
 * als sei alles da. Jetzt ist er ein Auftrag: die ZIP wandert als
 * abgeleitete Arbeitskopie in die Ablage, der Auftrag trägt ihre Kennung,
 * und nach einer Unterbrechung geht es bei der Stelle weiter, die im
 * Auftrag steht.
 *
 *   1 · DIE ART ist angemeldet, mit dem Namen, den ein Mensch liest.
 *   2 · alsAuftrag legt die Arbeitskopie ab und den Auftrag an.
 *   3 · DIE MASCHINE arbeitet ihn ab; danach ist die Arbeitskopie weg.
 *   4 · UNTERBRECHUNG: der Auftrag merkt sich die Stelle, die Arbeitskopie
 *       bleibt liegen, und der zweite Anlauf macht dort weiter — nichts
 *       doppelt, dasselbe Wurzelfach.
 *   5 · OHNE MASCHINE und bei einer zu grossen ZIP läuft es wie früher,
 *       und der Mensch erfährt es.
 *   6 · Keine Seitenfehler.
 *
 *   node pruefungen/lauf/test357.mts
 * ==========================================================================*/
declare const Store: any; declare const App: any; declare const ArchivImport: any;
declare const Auftraege: any; declare const Dateien: any;
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { deflateRawSync } from 'node:zlib';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9367;

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll), `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

/* --- Eine ZIP mit sechs Textdateien in zwei Fächern --------------------- */
const CRC_TAB = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = (b: Uint8Array): number => { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = CRC_TAB[(c ^ b[i]!) & 0xff]! ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
type ZipEintrag = { pfad: string; daten?: Uint8Array; deflate?: boolean };
const zipSchreiben = (eintraege: ZipEintrag[]): Buffer => {
  const teile: Buffer[] = []; const zentral: Buffer[] = []; let offset = 0;
  const dosDatum = (2026 - 1980) << 9 | 9 << 5 | 3;
  for (const e of eintraege) {
    const name = Buffer.from(e.pfad, 'utf8');
    const roh = Buffer.from(e.daten ?? new Uint8Array(0));
    const komp = e.deflate ? deflateRawSync(roh) : roh;
    const methode = e.deflate ? 8 : 0; const crc = crc32(roh);
    const lokal = Buffer.alloc(30);
    lokal.writeUInt32LE(0x04034b50, 0); lokal.writeUInt16LE(20, 4); lokal.writeUInt16LE(0x800, 6);
    lokal.writeUInt16LE(methode, 8); lokal.writeUInt16LE(0, 10); lokal.writeUInt16LE(dosDatum, 12);
    lokal.writeUInt32LE(crc, 14); lokal.writeUInt32LE(komp.length, 18); lokal.writeUInt32LE(roh.length, 22);
    lokal.writeUInt16LE(name.length, 26); lokal.writeUInt16LE(0, 28);
    const z = Buffer.alloc(46);
    z.writeUInt32LE(0x02014b50, 0); z.writeUInt16LE(20, 4); z.writeUInt16LE(20, 6); z.writeUInt16LE(0x800, 8);
    z.writeUInt16LE(methode, 10); z.writeUInt16LE(0, 12); z.writeUInt16LE(dosDatum, 14);
    z.writeUInt32LE(crc, 16); z.writeUInt32LE(komp.length, 20); z.writeUInt32LE(roh.length, 24);
    z.writeUInt16LE(name.length, 28); z.writeUInt16LE(0, 30); z.writeUInt16LE(0, 32); z.writeUInt16LE(0, 34);
    z.writeUInt16LE(0, 36); z.writeUInt32LE(e.pfad.endsWith('/') ? 0x10 : 0, 38); z.writeUInt32LE(offset, 42);
    teile.push(lokal, name, komp); zentral.push(z, name);
    offset += lokal.length + name.length + komp.length;
  }
  const zentralGroesse = zentral.reduce((n, b) => n + b.length, 0);
  const ende = Buffer.alloc(22);
  ende.writeUInt32LE(0x06054b50, 0); ende.writeUInt16LE(0, 4); ende.writeUInt16LE(0, 6);
  ende.writeUInt16LE(eintraege.length, 8); ende.writeUInt16LE(eintraege.length, 10);
  ende.writeUInt32LE(zentralGroesse, 12); ende.writeUInt32LE(offset, 16); ende.writeUInt16LE(0, 20);
  return Buffer.concat([...teile, ...zentral, ende]);
};
const T = (s: string): Uint8Array => new TextEncoder().encode(s);
const KURS = zipSchreiben([
  { pfad: 'Kurs/', },
  { pfad: 'Kurs/Woche1/eins.md', daten: T('# Eins') },
  { pfad: 'Kurs/Woche1/zwei.md', daten: T('# Zwei'), deflate: true },
  { pfad: 'Kurs/Woche1/drei.txt', daten: T('drei') },
  { pfad: 'Kurs/Woche2/vier.md', daten: T('# Vier') },
  { pfad: 'Kurs/Woche2/fuenf.txt', daten: T('fünf') },
  { pfad: 'Kurs/sechs.txt', daten: T('sechs') },
  { pfad: '__MACOSX/._eins.md', daten: T('beiwerk') }
]);
const KURS64 = KURS.toString('base64');
/* Für den Unterbrechungs-Abschnitt eine ZIP mit EIGENEM Oberordner: läge
   derselbe Inhalt noch einmal in „Kurs", erkennte E363 jede Datei wieder
   und der Lauf hätte nichts zu tun. */
const ZWEITER = zipSchreiben([
  { pfad: 'Zweiter/Woche1/eins.md', daten: T('# Eins zwei') },
  { pfad: 'Zweiter/Woche1/zwei.md', daten: T('# Zwei zwei'), deflate: true },
  { pfad: 'Zweiter/Woche1/drei.txt', daten: T('drei zwei') },
  { pfad: 'Zweiter/Woche2/vier.md', daten: T('# Vier zwei') },
  { pfad: 'Zweiter/Woche2/fuenf.txt', daten: T('fünf zwei') },
  { pfad: 'Zweiter/sechs.txt', daten: T('sechs zwei') }
]);
const ZWEITER64 = ZWEITER.toString('base64');
/* Und noch eine für den Rückfall-Abschnitt — dieselbe Überlegung. */
const DRITTER = zipSchreiben([
  { pfad: 'Dritter/a.md', daten: T('# A drei') },
  { pfad: 'Dritter/b.txt', daten: T('b drei') },
  { pfad: 'Dritter/c/d.md', daten: T('# D drei') }
]);
const DRITTER64 = DRITTER.toString('base64');

const TYP: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png',
  '.json': 'application/json', '.mjs': 'text/javascript', '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon'
};
const server = http.createServer((a: IncomingMessage, b: ServerResponse) => {
  const rein = decodeURIComponent((a.url ?? '/').split('?')[0] ?? '/');
  const pfad = path.join(WURZEL, rein === '/' ? 'index.html' : rein.slice(1));
  if (!pfad.startsWith(WURZEL) || !fs.existsSync(pfad) || fs.statSync(pfad).isDirectory()) { b.writeHead(404); b.end(); return; }
  b.writeHead(200, { 'Content-Type': TYP[path.extname(pfad)] ?? 'application/octet-stream' });
  b.end(fs.readFileSync(pfad));
});
await new Promise<void>(f => { server.listen(PORT, () => f()); });
const browser = await chromium.launch();
const fehler: string[] = [];
const ktx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const pg = await ktx.newPage();
pg.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 160)));
pg.on('dialog', d => d.dismiss().catch(() => {}));
await pg.goto(`http://localhost:${PORT}/index.html`);
await pg.waitForTimeout(2800);
await pg.evaluate(() => {
  Store.setMeta('rundgangGesehen', true);
  document.querySelector('.produkt-onboarding-lage')?.remove();
  document.getElementById('rg-willkommen')?.remove();
  document.getElementById('rg-einladung')?.remove();
  document.querySelectorAll('.overlay').forEach(o => o.remove());
});

const baum = (fach: string) => pg.evaluate((fach: string) => {
  const w = Store.rootPages().find((r: any) => r.alive !== false && String(r.text) === fach);
  if (!w) return null;
  const lies = (b: any): any => ({
    titel: String(b.text || ''),
    kinder: Store.childrenOf(b.id).filter((k: any) => k.type === 'page' && k.alive !== false).map(lies)
  });
  return { id: w.id, ...lies(w) };
}, fach);
/* ALLE Titel des Baums; die Wurzel fällt erst aussen weg. Der erste Wurf
   schnitt in JEDER Rekursionsstufe das erste Element ab und lieferte darum
   immer eine leere Liste — eine Probe, die nichts messen kann (§55.2). */
const alleTitel = (b: any): string[] => !b ? [] : [String(b.titel), ...b.kinder.flatMap(alleTitel)];
const titelFlach = (b: any): string[] => alleTitel(b).slice(1).sort();

/* ── 1 ────────────────────────────────────────────────────────────────── */
console.log('\n1 · Die Art ist angemeldet, mit dem Namen, den ein Mensch liest');
const art = await pg.evaluate(async ([b64]: [string]) => {
  const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  const f = new File([bytes], 'Kurs.zip', { type: 'application/zip' });
  return {
    name: ArchivImport.AUFTRAG_ART,
    arten: Auftraege.arten(),
    menschlich: Auftraege.artName(ArchivImport.AUFTRAG_ART),
    umfang: await ArchivImport.umfang(f, 'Kurs.zip'),
    plan: (await (async () => {
      const zip = await (window as any).Einlesen.zipLesenAusBlob(f);
      const pl = ArchivImport.planen(zip, 'Kurs.zip');
      return { n: pl.gueltig.length, wurzel: pl.wurzelName, allesInEinem: pl.allesInEinem };
    })())
  };
}, [KURS64] as [string]);
gleich('Die Art heisst „zip-import"', art.name, 'zip-import');
p('Die Maschine kennt sie', art.arten.includes('zip-import'), art.arten.join(','));
gleich('… mit menschlichem Namen', art.menschlich, 'ZIP entpacken');
gleich('Der Plan: sechs Dateien, Wurzelfach „Kurs", alles in einem Ordner',
  art.plan, { n: 6, wurzel: 'Kurs', allesInEinem: true });
gleich('`umfang` sagt dasselbe, ohne ein Byte zu entpacken', art.umfang, 6);

/* ── 2 ────────────────────────────────────────────────────────────────── */
console.log('\n2 · alsAuftrag legt die Arbeitskopie ab und den Auftrag an');
const angelegt = await pg.evaluate(async ([b64]: [string]) => {
  const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  const f = new File([bytes], 'Kurs.zip', { type: 'application/zip' });
  /* Die Maschine ANHALTEN, damit der Auftrag zum Ansehen stehen bleibt. */
  Auftraege.stopp();
  const erg = await ArchivImport.alsAuftrag(f, null, { still: true });
  const a = await Auftraege.einer(erg.auftrag.id);
  const dateien = await Store.dateiAlle();
  const kopie = dateien.find((d: any) => d.id === a.eingabe.dateiId);
  return {
    zurueck: { hatAuftrag: !!erg.auftrag, grund: erg.grund ?? null },
    auftrag: { art: a.art, zustand: a.zustand, schritte: a.schritte, schritt: a.schritt,
               text: a.text, eingabe: { ...a.eingabe, dateiId: a.eingabe.dateiId ? 'da' : null } },
    kopie: kopie ? { name: kopie.name, abgeleitet: !!kopie.abgeleitet, blockId: kopie.blockId ?? null,
                     zustand: kopie.zustand } : null,
    seiten: Store.rootPages().filter((r: any) => r.alive !== false).length
  };
}, [KURS64] as [string]);
gleich('Zurück kommt der Auftrag, kein Ergebnis', angelegt.zurueck, { hatAuftrag: true, grund: null });
gleich('Der Auftrag: sechs Schritte, noch keiner getan, wartet',
  [angelegt.auftrag.art, angelegt.auftrag.schritte, angelegt.auftrag.schritt, angelegt.auftrag.zustand],
  ['zip-import', 6, 0, 'wartet']);
p('… und sagt, worum es geht', /Kurs\.zip/.test(String(angelegt.auftrag.text)), String(angelegt.auftrag.text));
gleich('Die Eingabe trägt die Kennung der ZIP, das Ziel und die Anordnung',
  angelegt.auftrag.eingabe, { dateiId: 'da', zipName: 'Kurs.zip', zielId: null, anordnung: 'untereinander' });
gleich('Die Arbeitskopie liegt in der Ablage: abgeleitet, ohne Block, fertig',
  angelegt.kopie, { name: 'Kurs.zip', abgeleitet: true, blockId: null, zustand: 'fertig' });
p('Noch ist nichts angelegt — der Auftrag hat nur noch nicht gearbeitet', angelegt.seiten <= 2, String(angelegt.seiten));

/* ── 3 ────────────────────────────────────────────────────────────────── */
console.log('\n3 · Die Maschine arbeitet ihn ab; danach ist die Arbeitskopie weg');
const gelaufen = await pg.evaluate(async () => {
  await Auftraege.start();
  const bis = Date.now() + 25000;
  let a: any = null;
  while (Date.now() < bis) {
    const alle = await Auftraege.alle();
    a = alle.find((x: any) => x.art === 'zip-import');
    if (a && (a.zustand === 'fertig' || a.zustand === 'fehler')) break;
    await new Promise(f => setTimeout(f, 300));
  }
  const dateien = await Store.dateiAlle();
  return { zustand: a?.zustand, schritt: a?.schritt, schritte: a?.schritte,
           stand: a?.stand, kopieDa: dateien.some((d: any) => d.id === a?.eingabe?.dateiId) };
});
gleich('Der Auftrag ist fertig, alle sechs Schritte getan',
  [gelaufen.zustand, gelaufen.schritt, gelaufen.schritte], ['fertig', 6, 6]);
p('Das Ergebnis nennt sechs Dokumente', gelaufen.stand?.dokumente === 6, JSON.stringify(gelaufen.stand).slice(0, 200));
p('… und einen Hinweis für den Menschen', /Kurs\.zip/.test(String(gelaufen.stand?.hinweis)), String(gelaufen.stand?.hinweis));
gleich('Die Arbeitskopie ist gelöscht — sie hat ihren Zweck erfüllt', gelaufen.kopieDa, false);
const kurs = await baum('Kurs');
gleich('Im Regal: zwei Fächer und sechs Dokumente',
  titelFlach(kurs), ['Woche1', 'Woche2', 'drei', 'eins', 'fuenf', 'sechs', 'vier', 'zwei'].sort());

/* ── 4 ────────────────────────────────────────────────────────────────── */
console.log('\n4 · Unterbrechung: der Auftrag merkt sich die Stelle und macht dort weiter');
const teil1 = await pg.evaluate(async ([b64]: [string]) => {
  Auftraege.stopp();
  const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  const f = new File([bytes], 'Zweiter.zip', { type: 'application/zip' });
  const satz = await Dateien.ablegen(f, { name: 'Zweiter.zip', abgeleitet: true });
  /* Ein Auftrag, wie die Maschine ihn baut — und eine Hilfe, die nach dem
     zweiten Schritt abbricht: genau das, was ein geschlossener Tab tut. */
  let auftrag: any = { id: 'probe-1', art: 'zip-import', schritt: 0, schritte: 6, stand: null,
    eingabe: { dateiId: satz.id, zipName: 'Zweiter.zip', zielId: null, anordnung: 'untereinander' } };
  const texte: string[] = [];
  let n = 0;
  const hilfe = {
    schritt: async (stand: unknown, text?: string) => {
      n++; auftrag = { ...auftrag, schritt: n, stand };
      texte.push(String(text || ''));
    },
    abgebrochen: () => n >= 2,
    lebt: async () => {}
  };
  const erg = await ArchivImport.zipLaeufer(auftrag, hilfe);
  const dateien = await Store.dateiAlle();
  return { erg, stand: auftrag.stand, schritt: auftrag.schritt, texte,
           kopieDa: dateien.some((d: any) => d.id === satz.id), dateiId: satz.id, auftrag };
}, [ZWEITER64] as [string]);
gleich('Nach zwei Dateien ist Schluss — der Läufer meldet den Abbruch',
  [teil1.schritt, teil1.erg.abgebrochen], [2, true]);
p('Der Stand trägt die Stelle und das Wurzelfach',
  teil1.stand?.index === 2 && !!teil1.stand?.wurzelId, JSON.stringify(teil1.stand).slice(0, 160));
gleich('… und die Zahlen des bisherigen Laufs', teil1.stand?.zahlen?.dokumente, 2);
p('Der Schritt-Text nennt Datei und Gesamtzahl', /1 von 6/.test(teil1.texte[0] || ''), teil1.texte.join(' | '));
gleich('Die Arbeitskopie bleibt liegen — sonst gäbe es kein Weitermachen', teil1.kopieDa, true);
const zwischen = await baum('Zweiter');
p('Zwei Dokumente stehen im Regal, der Rest fehlt', titelFlach(zwischen).filter(t => !/Woche/.test(t)).length === 2,
  JSON.stringify(titelFlach(zwischen)));

/* JEDER EINTRAG IST EIN SCHRITT, auch ein schon bekannter (E365). Dieselbe
   ZIP ein zweites Mal: sechs Schritte, null neue Dokumente — der
   Fortschritt darf nicht stehenbleiben, nur weil nichts anzulegen ist. */
const nochmal = await pg.evaluate(async ([b64]: [string]) => {
  const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  const satz = await Dateien.ablegen(new File([bytes], 'Kurs.zip'), { name: 'Kurs.zip', abgeleitet: true });
  const auftrag = { id: 'probe-2', art: 'zip-import', schritt: 0, schritte: 6, stand: null,
    eingabe: { dateiId: satz.id, zipName: 'Kurs.zip', zielId: null, anordnung: 'untereinander' } };
  let n = 0;
  const erg = await ArchivImport.zipLaeufer(auftrag,
    { schritt: async () => { n++; }, abgebrochen: () => false, lebt: async () => {} });
  return { n, dokumente: erg.dokumente, unveraendert: erg.unveraendert };
}, [KURS64] as [string]);
gleich('Sechs Schritte, null neue Dokumente, sechs schon da',
  [nochmal.n, nochmal.dokumente, nochmal.unveraendert], [6, 0, 6]);

/* DAS FACH WIRD UMBENANNT, während der Auftrag steht. Ein Mensch darf das
   — und danach findet ein Namensvergleich es nicht mehr. Nur die KENNUNG
   im Auftrag führt zurück; ohne sie entstünde ein zweites Fach und der
   Bestand stünde an zwei Orten. */
await pg.evaluate(([id]: [string]) => { Store.updateBlock(id, { text: 'Zweiter — Semester 1' }); },
  [String(zwischen?.id)] as [string]);

const teil2 = await pg.evaluate(async ([auftragRoh]: [any]) => {
  const auftrag = { ...auftragRoh, id: 'probe-1' };
  const texte: string[] = [];
  let n = auftrag.schritt;
  let letzterStand = auftrag.stand;
  const hilfe = {
    schritt: async (stand: unknown, text?: string) => { n++; letzterStand = stand; texte.push(String(text || '')); },
    abgebrochen: () => false,
    lebt: async () => {}
  };
  const erg = await ArchivImport.zipLaeufer(auftrag, hilfe);
  const dateien = await Store.dateiAlle();
  return { erg, n, texte, letzterStand, kopieDa: dateien.some((d: any) => d.id === auftrag.eingabe.dateiId) };
}, [teil1.auftrag] as [any]);
gleich('Der zweite Anlauf macht bei Datei 3 weiter und wird fertig', [teil2.n, teil2.erg.abgebrochen], [6, false]);
p('Der erste Schritt-Text des zweiten Anlaufs ist Nummer 3', /3 von 6/.test(teil2.texte[0] || ''), teil2.texte.join(' | '));
gleich('Zusammengezählt sind es sechs Dokumente', teil2.erg.dokumente, 6);
gleich('Jetzt ist auch die Arbeitskopie weg', teil2.kopieDa, false);
const zweiter = await baum('Zweiter — Semester 1');
gleich('Im umbenannten Fach steht jedes Dokument genau EINMAL — kein „ (2)"',
  titelFlach(zweiter), ['Woche1', 'Woche2', 'drei', 'eins', 'fuenf', 'sechs', 'vier', 'zwei'].sort());
gleich('… und es ist dasselbe Wurzelfach wie im ersten Anlauf', zweiter?.id, zwischen?.id);
gleich('Kein zweites Fach „Zweiter" daneben',
  await pg.evaluate(() => Store.rootPages().filter((r: any) => r.alive !== false && /^Zweiter/.test(String(r.text))).length), 1);

/* ── 5 ────────────────────────────────────────────────────────────────── */
console.log('\n5 · Ohne Maschine und bei einer zu grossen ZIP läuft es wie früher');
const ohne = await pg.evaluate(async ([b64, b64b]: [string, string]) => {
  const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  const bytesB = Uint8Array.from(atob(b64b), c => c.charCodeAt(0));
  const f = new File([bytes], 'Klein.zip', { type: 'application/zip' });
  const altGrenze = Dateien.GRENZE;
  const meldungen: string[] = [];
  const altToast = (window as any).UI.toast;
  (window as any).UI.toast = (t: string) => { meldungen.push(String(t)); return { remove() {}, textContent: '' }; };
  let zuGross: any, ohneMaschine: any;
  try {
    Dateien.GRENZE = 10;
    zuGross = await ArchivImport.alsAuftrag(f, null, {});
    Dateien.GRENZE = altGrenze;
    /* Die Maschine „wegnehmen": `Auftraege` ist eine Bindung im globalen
       Geltungsbereich, kein Fensterfeld — abschalten lässt sich nur der
       Griff, den `alsAuftrag` prüft. Genau den prüft es auch. */
    const altAnlegen = (Auftraege as any).anlegen;
    (Auftraege as any).anlegen = undefined;
    try { ohneMaschine = await ArchivImport.alsAuftrag(new File([bytesB], 'Ohne.zip'), null, {}); }
    finally { (Auftraege as any).anlegen = altAnlegen; }
  } finally { Dateien.GRENZE = altGrenze; (window as any).UI.toast = altToast; }
  return {
    zuGross: { auftrag: !!zuGross.auftrag, grund: zuGross.grund, dokumente: zuGross.ergebnis?.dokumente,
               unveraendert: zuGross.ergebnis?.unveraendert },
    ohneMaschine: { auftrag: !!ohneMaschine.auftrag, grund: ohneMaschine.grund, dokumente: ohneMaschine.ergebnis?.dokumente },
    meldungen
  };
}, [KURS64, DRITTER64] as [string, string]);
/* „Klein.zip" trägt denselben Inhalt wie „Kurs.zip" — der Lauf geschieht,
   findet aber alles wieder (E363): null neue, sechs schon da. Genau das
   soll er sagen. */
gleich('Zu gross: kein Auftrag, aber der Lauf geschieht trotzdem',
  ohne.zuGross, { auftrag: false, grund: 'zu gross', dokumente: 0, unveraendert: 6 });
p('… und der Mensch erfährt, dass er das Fenster offen lassen muss',
  ohne.meldungen.some(m => /offen lassen/.test(m) && /grösser/.test(m)), JSON.stringify(ohne.meldungen));
gleich('Ohne Maschine: dasselbe, mit anderem Grund',
  ohne.ohneMaschine, { auftrag: false, grund: 'ohne Maschine', dokumente: 3 });
p('… auch hier ein Satz dazu', ohne.meldungen.some(m => /offen lassen/.test(m) && !/grösser/.test(m)), JSON.stringify(ohne.meldungen));

/* ── 6 ────────────────────────────────────────────────────────────────── */
console.log('\n6 · Keine Seitenfehler');
gleich('Keine Seitenfehler', fehler, []);

await ktx.close(); await browser.close(); server.close();
console.log(`\n${ok}/${ok + weg} bestanden`);
process.exit(weg ? 1 : 0);
