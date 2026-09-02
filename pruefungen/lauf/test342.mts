/* Suite 342 — Eine ZIP kommt so ins Regal, wie sie ist (E350)
 * ============================================================================
 * Redur: „wenn ich eine ZIP-Datei beim Dokumente-Teil hochlade: zuerst
 * sollte die ZIP so, wie sie ist, alles herausholen — eine Datei in einem
 * Ordner soll dort bleiben, also gleich wie es ist."
 *
 * Bis E350 wurde eine ZIP ein Anhang, und im Regal ging gar nichts („Erst
 * eine Seite öffnen"). Jetzt: Ordner werden Fächer, verschachtelt; jede
 * Datei wird ein Dokument; gelesen wird stückweise; unsichere Pfade werden
 * gezählt statt angelegt; eine ZIP in der ZIP bleibt zu.
 *
 * Das Archiv hier ist ECHT: geschrieben mit einem eigenen ZIP-Schreiber
 * (Store und Deflate, UTF-8-Namen), die PDF darin geht durch denselben
 * pdf.js wie Redurs Skripte.
 *
 *   §1  DIE STRUKTUR BLEIBT — Elektro/Skript/Kapitel 1.pdf liegt im Fach
 *       „Skript" im Fach „Elektro", als Dokument mit Seiten und Original.
 *   §2  DIE ZÄHLUNG STIMMT, und was nicht hineingehört, bleibt draussen:
 *       `../boese.txt` wird genannt, `__MACOSX` und `.DS_Store` schweigen,
 *       die innere ZIP wird nicht entpackt.
 *   §3  ZWEIMAL DIESELBE ZIP legt keine Doppel-Fächer an; Dokumente
 *       bekommen „ (2)".
 *   §4  OHNE GEMEINSAMEN OBERORDNER heisst das Fach wie die ZIP.
 *   §5  DAS REGAL zeigt ein Fach als Ordner, auch mit einer einzigen Sache.
 *   §6  ABLEGEN IM REGAL: eine ZIP auf die Dokumente-Ansicht ziehen entpackt
 *       sie; eine PDF wird ein Dokument an der Wurzel.
 *   §7  DER KATALOG kennt „ZIP entpacken", und der Wähler nimmt nur ZIPs.
 *   §8  DIE GRÖSSENWACHE greift VOR dem Entpacken.
 *   §9  KEINE RÜCKFRAGE JE PDF, und die Merkregel des Menschen bleibt.
 *
 *   node pruefungen/lauf/test342.mts
 * ==========================================================================*/
declare const Store: any; declare const App: any; declare const ArchivImport: any;
declare const Bibliothek: any; declare const Einlesen: any; declare const Dateien: any;
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { deflateRawSync } from 'node:zlib';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9346;

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll),
    `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

/* --- Prüfmaterial: ZIP-Schreiber, PDF, PNG ---------------------------- */

const CRC_TAB = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
const crc32 = (b: Uint8Array): number => {
  let c = 0xffffffff;
  for (let i = 0; i < b.length; i++) c = CRC_TAB[(c ^ b[i]!) & 0xff]! ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
type ZipEintrag = { pfad: string; daten?: Uint8Array; deflate?: boolean };
/** Ein echtes ZIP: Ordner enden mit '/', Namen als UTF-8 mit Bit 11. */
const zipSchreiben = (eintraege: ZipEintrag[]): Buffer => {
  const teile: Buffer[] = []; const zentral: Buffer[] = []; let offset = 0;
  const dosDatum = (2026 - 1980) << 9 | 9 << 5 | 2;
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

/** Eine echte, kleine PDF — nach dem Bauer aus test285. */
const machPdf = (titel: string): Buffer => {
  const objekte: Buffer[] = [];
  const neu = (inhalt: Buffer | string): number => {
    objekte.push(Buffer.isBuffer(inhalt) ? inhalt : Buffer.from(inhalt, 'latin1'));
    return objekte.length;
  };
  const seitenNr = neu('');
  const schrift = neu('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  const strom = ['BT /F1 30 Tf 60 740 Td (' + titel + ') Tj ET',
                 '2 w 30 30 535 782 re S'].join('\n');
  const roh = Buffer.from(strom, 'latin1');
  const inhalt = neu(Buffer.concat([
    Buffer.from(`<< /Length ${roh.length} >>\nstream\n`, 'latin1'), roh,
    Buffer.from('\nendstream', 'latin1')]));
  const kind = neu('<< /Type /Page /Parent 1 0 R /MediaBox [0 0 595 842] ' +
    `/Resources << /Font << /F1 ${schrift} 0 R >> >> /Contents ${inhalt} 0 R >>`);
  objekte[seitenNr - 1] = Buffer.from(`<< /Type /Pages /Count 1 /Kids [${kind} 0 R] >>`, 'latin1');
  const wurzel = neu(`<< /Type /Catalog /Pages ${seitenNr} 0 R >>`);
  let aus = Buffer.from('%PDF-1.4\n', 'latin1');
  const stellen: number[] = [];
  objekte.forEach((o, i) => {
    stellen.push(aus.length);
    aus = Buffer.concat([aus, Buffer.from(`${i + 1} 0 obj\n`, 'latin1'), o, Buffer.from('\nendobj\n', 'latin1')]);
  });
  const xref = aus.length;
  let tab = `xref\n0 ${objekte.length + 1}\n0000000000 65535 f \n`;
  stellen.forEach(s => { tab += String(s).padStart(10, '0') + ' 00000 n \n'; });
  tab += `trailer\n<< /Size ${objekte.length + 1} /Root ${wurzel} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.concat([aus, Buffer.from(tab, 'latin1')]);
};
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
const PDF = machPdf('Kapitel 1');
const INNERE = zipSchreiben([{ pfad: 'innen/geheim.txt', daten: Buffer.from('innen', 'utf8') }]);
const BIN = Buffer.from(Array.from({ length: 3000 }, (_, i) => (i * 37) & 255));

const ELEKTRO = zipSchreiben([
  { pfad: 'Elektro/' },
  { pfad: 'Elektro/Skript/' },
  { pfad: 'Elektro/Skript/Kapitel 1.pdf', daten: PDF, deflate: true },
  { pfad: 'Elektro/Skript/Notizen.md', daten: Buffer.from('# Notizen\n\nOhm gilt.\n', 'utf8'), deflate: true },
  { pfad: 'Elektro/Bilder/schaltung.png', daten: PNG },
  { pfad: 'Elektro/Übersicht.txt', daten: Buffer.from('Ümläute bleiben.\n', 'utf8') },
  { pfad: 'Elektro/Anhang/archiv.zip', daten: INNERE },
  { pfad: 'Elektro/Anhang/daten.bin', daten: BIN, deflate: true },
  { pfad: '__MACOSX/Elektro/._Kapitel 1.pdf', daten: Buffer.from('Mac-Beiwerk') },
  { pfad: 'Elektro/.DS_Store', daten: Buffer.from('Finder') },
  { pfad: '../boese.txt', daten: Buffer.from('darf nicht ankommen', 'utf8') },
]);
const LOSE = zipSchreiben([
  { pfad: 'a.txt', daten: Buffer.from('A', 'utf8') },
  { pfad: 'b.txt', daten: Buffer.from('B', 'utf8') },
]);
const ZIP_PFAD = path.join(WURZEL, 'bilder', 'test342-elektro.zip');
fs.mkdirSync(path.dirname(ZIP_PFAD), { recursive: true });
fs.writeFileSync(ZIP_PFAD, ELEKTRO);

/* --- Prüfstand ---------------------------------------------------------- */

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
type Seite = import('playwright').Page;

const kontext = async () => {
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
  });
  return { ktx, pg };
};

/** Die ZIP im Browser als File bauen und importieren — mit Zeitwache, damit
    ein offener Dialog den Lauf nicht für immer anhält. */
const importieren = (pg: Seite, base64: string, name: string, ziel: string | null = null) =>
  pg.evaluate(async ([b64, name, ziel]: [string, string, string | null]) => {
    const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    const f = new File([bytes], name, { type: 'application/zip' });
    const lauf = ArchivImport.importZip(f, ziel, { still: true });
    const wache = new Promise(r => setTimeout(() => r({ zeitueberschreitung: true }), 20000));
    return await Promise.race([lauf, wache]);
  }, [base64, name, ziel] as [string, string, string | null]);

type Baum = { titel: string; heftArt: unknown; icon: unknown; kinder: Baum[]; bloecke: string[]; dokumentModus: unknown; original: boolean; dateiIds: number; srcs: number };
const baum = (pg: Seite, wurzelTitel: string): Promise<Baum | null> =>
  pg.evaluate((wurzelTitel: string) => {
    const lies = (b: any): any => ({
      titel: String(b.text || ''), heftArt: b.heftArt, icon: b.icon, dokumentModus: b.dokumentModus,
      kinder: Store.childrenOf(b.id).filter((k: any) => k.type === 'page').map(lies),
      bloecke: Store.childrenOf(b.id).filter((k: any) => k.type !== 'page').map((k: any) => k.type),
      original: Store.childrenOf(b.id).some((k: any) => k.type === 'file' && k.original),
      dateiIds: Store.childrenOf(b.id).filter((k: any) => k.dateiId).length,
      srcs: Store.childrenOf(b.id).filter((k: any) => typeof k.src === 'string' && k.src.length).length,
    });
    const w = Store.rootPages().find((r: any) => r.alive !== false && String(r.text) === wurzelTitel);
    return w ? lies(w) : null;
  }, wurzelTitel);
const finde = (b: Baum | null, titel: string): Baum | undefined => b?.kinder.find(k => k.titel === titel);

/* ======================================================================== */
console.log('\n1 · Die Struktur bleibt: Elektro › Skript › Kapitel 1');
const { ktx, pg } = await kontext();
const erg1 = await importieren(pg, ELEKTRO.toString('base64'), 'Elektro.zip');
p('Der Import kommt zurück (kein Dialog hält ihn an)', !(erg1 as any).zeitueberschreitung, JSON.stringify(erg1));
const e1 = await baum(pg, 'Elektro');
p('Ein Fach „Elektro" an der Wurzel — nicht zwei', !!e1 && e1.heftArt === 'fach', JSON.stringify(e1 && { heftArt: e1.heftArt }));
gleich('Darin die Fächer und die Übersicht', (e1?.kinder ?? []).map(k => k.titel).sort(),
       ['Anhang', 'Bilder', 'Skript', 'Übersicht']);
const skript = finde(e1, 'Skript');
gleich('„Skript" ist ein Fach', skript?.heftArt, 'fach');
const kapitel = finde(skript ?? null, 'Kapitel 1');
p('„Kapitel 1" liegt IM Fach Skript, als Dokument mit PDF-Seiten', !!kapitel && kapitel.bloecke.includes('pdfseite'), JSON.stringify(kapitel?.bloecke));
p('… mit dem Original als Anhang', !!kapitel?.original);
gleich('… und im Dokumentmodus, wie eine frisch eingelesene PDF', kapitel?.dokumentModus, true);
const notizen = finde(skript ?? null, 'Notizen');
p('„Notizen" aus der .md ist eine Textseite mit Inhalt', !!notizen && notizen.bloecke.length > 0, JSON.stringify(notizen?.bloecke));
const bilder = finde(e1, 'Bilder');
const schaltung = finde(bilder ?? null, 'schaltung');
p('„schaltung" ist eine Seite mit Bildblock in Stücken — keine Data-URL', !!schaltung && schaltung.bloecke.includes('image') && schaltung.dateiIds === 1 && schaltung.srcs === 0, JSON.stringify(schaltung));
const uebersicht = finde(e1, 'Übersicht');
p('„Übersicht" mit Umlaut im Namen liegt direkt in Elektro', !!uebersicht);
const uebersichtText = await pg.evaluate((t: string) => {
  const w = Store.rootPages().find((r: any) => String(r.text) === 'Elektro');
  const u = Store.childrenOf(w.id).find((k: any) => String(k.text) === t);
  return Store.childrenOf(u.id).map((k: any) => String(k.text || '')).join('|');
}, 'Übersicht');
p('… und ihr Text kam mit Umlauten an', /Ümläute bleiben/.test(uebersichtText), uebersichtText);

/* ======================================================================== */
console.log('\n2 · Die Zählung stimmt, und was nicht hineingehört, bleibt draussen');
const z = erg1 as any;
gleich('1 PDF', z.pdfs, 1);
gleich('1 Bild', z.bilder, 1);
gleich('2 Seiten (Notizen, Übersicht)', z.seiten, 2);
gleich('2 Dateien (innere ZIP, daten.bin)', z.anhaenge, 2);
gleich('4 Fächer (Elektro, Skript, Bilder, Anhang)', z.faecher, 4);
p('`../boese.txt` wird als unsicher genannt', (z.uebersprungen || []).some((s: string) => /boese/.test(s)), JSON.stringify(z.uebersprungen));
const anhang = finde(e1, 'Anhang');
p('Die innere ZIP wird NICHT entpackt: „archiv" ist eine Datei, kein Fach', !!finde(anhang ?? null, 'archiv') && finde(anhang ?? null, 'archiv')!.heftArt !== 'fach' && finde(anhang ?? null, 'archiv')!.bloecke.includes('file'), JSON.stringify(finde(anhang ?? null, 'archiv')));
p('„daten" aus der .bin ist eine Seite mit Dateianhang', !!finde(anhang ?? null, 'daten') && finde(anhang ?? null, 'daten')!.bloecke.includes('file'));
const alleTitel = await pg.evaluate(() => Object.values<any>(Store.cache.blocks).filter(b => b.type === 'page' && b.alive !== false).map(b => String(b.text || '')));
p('Kein „boese", kein „.DS_Store", kein „__MACOSX" wurde angelegt', !alleTitel.some(t => /boese|DS_Store|MACOSX|geheim|innen/.test(t)), alleTitel.filter(t => /boese|DS_Store|MACOSX|geheim|innen/.test(t)).join(','));
p('Der Hinweis nennt Zahlen', /1 PDF/.test(z.hinweis) && /4 Fächern/.test(z.hinweis), z.hinweis);

/* ======================================================================== */
console.log('\n3 · Zweimal dieselbe ZIP: Fächer bleiben eins, Dokumente bekommen „ (2)"');
const erg2 = await importieren(pg, ELEKTRO.toString('base64'), 'Elektro.zip');
const wurzeln = await pg.evaluate(() => Store.rootPages().filter((r: any) => r.alive !== false && String(r.text) === 'Elektro').length);
gleich('Immer noch EIN Fach „Elektro" an der Wurzel', wurzeln, 1);
const e2 = await baum(pg, 'Elektro');
gleich('… und ein Fach „Skript" darin', (e2?.kinder ?? []).filter(k => k.titel === 'Skript').length, 1);
gleich('Das zweite Kapitel heisst „Kapitel 1 (2)"', (finde(e2, 'Skript')?.kinder ?? []).map(k => k.titel).sort(), ['Kapitel 1', 'Kapitel 1 (2)', 'Notizen', 'Notizen (2)']);
gleich('Beim zweiten Mal entsteht kein neues Fach', (erg2 as any).faecher, 0);

/* ======================================================================== */
console.log('\n4 · Ohne gemeinsamen Oberordner heisst das Fach wie die ZIP');
await importieren(pg, LOSE.toString('base64'), 'lose.zip');
const lose = await baum(pg, 'lose');
p('Ein Fach „lose" mit a und b', !!lose && lose.kinder.map(k => k.titel).sort().join(',') === 'a,b', JSON.stringify(lose?.kinder.map(k => k.titel)));

/* ======================================================================== */
console.log('\n5 · Das Regal zeigt ein Fach als Ordner — auch mit einer einzigen Sache');
/* Ein Fach mit GENAU einer Sache: vor E350 war das in der Bibliothek weder
   Ordner (dafür brauchte es zwei Unterseiten) noch sichtbar als Fach. */
await pg.evaluate(async () => {
  const f = Store.addPage(null, { text: 'Einzelfach', icon: '🗂', heftArt: 'fach' });
  Store.addPage(f.id, { text: 'Die eine Sache', icon: '📄' });
  await Store.flush();
  Bibliothek.oeffne();
});
await pg.waitForTimeout(600);
const karten = await pg.evaluate(() =>
  [...document.querySelectorAll('.bib-gitter .bib-deckel')].map(k => ({
    name: (k.querySelector('.bib-deckel-name')?.textContent || '').replace(/⌄\s*$/, '').trim(),
    text: (k.textContent || '').replace(/\s+/g, ' ').trim()
  })));
const einzel = karten.find(k => k.name === 'Einzelfach');
p('„Einzelfach" (ein Fach mit einer Sache) steht als Ordner im Regal', !!einzel && /1 Sache\b/.test(einzel.text), JSON.stringify(einzel) + ' · Karten: ' + JSON.stringify(karten.slice(0, 6)));
const elektroKarte = karten.find(k => k.name === 'Elektro');
p('„Elektro" zählt seine Sachen', !!elektroKarte && /\d+ Sachen/.test(elektroKarte.text), JSON.stringify(elektroKarte));

/* ======================================================================== */
console.log('\n6 · Ablegen im Regal: ZIP wird entpackt, PDF wird Dokument');
const vorher = await pg.evaluate(() => Store.rootPages().filter((r: any) => r.alive !== false).length);
const abgelegt = await pg.evaluate(async ([zipB64, pdfB64]: [string, string]) => {
  Bibliothek.oeffne();
  await new Promise(r => setTimeout(r, 300));
  const mach = (b64: string, name: string, typ: string) =>
    new File([Uint8Array.from(atob(b64), c => c.charCodeAt(0))], name, { type: typ });
  const dt = new DataTransfer();
  dt.items.add(mach(zipB64, 'Regalzip.zip', 'application/zip'));
  dt.items.add(mach(pdfB64, 'Direkt.pdf', 'application/pdf'));
  const ziel = document.getElementById('scroll');
  if (!ziel) return { kein: true };
  ziel.dispatchEvent(new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true }));
  await new Promise(r => setTimeout(r, 6000));
  const wurzel = Store.rootPages().filter((r: any) => r.alive !== false);
  const regalzip = wurzel.find((r: any) => String(r.text) === 'Elektro');
  const direkt = wurzel.find((r: any) => String(r.text) === 'Direkt');
  return {
    kein: false,
    seiteOffen: App.aktuelleSeite(),
    direktIstPdf: !!direkt && Store.childrenOf(direkt.id).some((k: any) => k.type === 'pdfseite'),
    regalzipDa: !!regalzip,
    anzahl: wurzel.length,
    toast: [...document.querySelectorAll('.toast, .ui-toast')].map(t => t.textContent).join(' | ')
  };
}, [LOSE.toString('base64'), PDF.toString('base64')] as [string, string]);
p('Im Regal ist keine Seite offen — und trotzdem kommt etwas an', !(abgelegt as any).kein && !(abgelegt as any).seiteOffen, JSON.stringify(abgelegt));
p('Die abgelegte PDF ist ein Dokument an der Wurzel', (abgelegt as any).direktIstPdf, JSON.stringify(abgelegt));
p('Die abgelegte ZIP wurde entpackt (ein Fach mehr an der Wurzel)', (abgelegt as any).anzahl >= vorher + 2, `vorher ${vorher}, nachher ${(abgelegt as any).anzahl}`);

/* ======================================================================== */
console.log('\n7 · Der Katalog kennt „ZIP entpacken", und der Wähler nimmt nur ZIPs');
const wege = await pg.evaluate(() => App.erstellenWege().map((w: any) => w.id));
p('„zip" steht unter den Wegen von „+ Neu"', wege.includes('zip'), wege.join(','));
const [chooser] = await Promise.all([
  pg.waitForEvent('filechooser', { timeout: 8000 }).catch(() => null),
  pg.evaluate(() => { App.erstellenWeg('zip'); })
]);
p('Der Weg öffnet einen Dateiwähler', !!chooser);
const accept = chooser ? await chooser.element().getAttribute('accept') : '';
p('… der nur ZIP annimmt', /\.zip/.test(String(accept)), String(accept));
if (chooser) {
  await chooser.setFiles(ZIP_PFAD);
  await pg.waitForTimeout(7000);
  const dritte = await pg.evaluate(() => {
    const w = Store.rootPages().find((r: any) => r.alive !== false && String(r.text) === 'Elektro');
    const s = w && Store.childrenOf(w.id).find((k: any) => String(k.text) === 'Skript');
    return s ? Store.childrenOf(s.id).map((k: any) => String(k.text)).filter((t: string) => /^Kapitel 1/.test(t)).sort() : [];
  });
  gleich('Über den Wähler kam ein drittes Kapitel an — „Kapitel 1 (3)"', dritte, ['Kapitel 1', 'Kapitel 1 (2)', 'Kapitel 1 (3)']);
}

/* ======================================================================== */
console.log('\n8 · Die Grössenwache greift vor dem Entpacken');
const groessen = await pg.evaluate(async ([b64, pdfLaenge]: [string, number]) => {
  const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  const f = new File([bytes], 'Elektro.zip', { type: 'application/zip' });
  const zip = await Einlesen.zipLesenAusBlob(f);
  const alt = Dateien.GRENZE;
  let erg: any = null;
  try {
    Dateien.GRENZE = 10;
    erg = await ArchivImport.importZip(f, null, { still: true });
  } finally { Dateien.GRENZE = alt; }
  return { roh: zip.groesse('Elektro/Skript/Kapitel 1.pdf'), pdfLaenge, uebersprungen: erg.uebersprungen, dokumente: erg.dokumente };
}, [ELEKTRO.toString('base64'), PDF.length] as [string, number]);
gleich('Der Leser kennt die Rohgrösse eines Eintrags', groessen.roh, groessen.pdfLaenge);
p('Mit einer Grenze von 10 Byte wird jede Datei übersprungen, keine entpackt', groessen.dokumente === 0 && groessen.uebersprungen.length >= 6 && groessen.uebersprungen.every((s: string) => /grösser als|unsicher/.test(s)), JSON.stringify(groessen));

/* ======================================================================== */
console.log('\n9 · Keine Rückfrage je PDF, und die Merkregel des Menschen bleibt');
const merk = await pg.evaluate(async ([b64]: [string]) => {
  Store.setMeta('pdfAnordnung', 'nebeneinander');
  const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  const f = new File([bytes], 'NochEine.zip', { type: 'application/zip' });
  const vorher = document.querySelectorAll('.overlay').length;
  const lauf = ArchivImport.importZip(f, null, { still: true });
  const wache = new Promise(r => setTimeout(() => r({ zeitueberschreitung: true }), 20000));
  const erg: any = await Promise.race([lauf, wache]);
  return { zeit: !!erg.zeitueberschreitung, overlays: document.querySelectorAll('.overlay').length - vorher, merk: Store.getMeta('pdfAnordnung'), pdfs: erg.pdfs };
}, [ELEKTRO.toString('base64')] as [string]);
p('Der Import fragt nicht — er endet von selbst mit einer PDF', !merk.zeit && merk.pdfs === 1, JSON.stringify(merk));
gleich('Kein Fenster blieb offen', merk.overlays, 0);
gleich('Die Merkregel „nebeneinander" des Menschen bleibt unberührt', merk.merk, 'nebeneinander');

await ktx.close();
console.log('');
p('Keine Seitenfehler', fehler.length === 0, fehler.join(' | '));
await browser.close();
server.close();
console.log(`\n${ok}/${ok + weg} bestanden`);
process.exit(weg ? 1 : 0);
