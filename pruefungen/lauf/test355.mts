/* Suite 355 — Der ZIP-Leser sagt die Wahrheit: Prüfsumme, CP437, verschlüsselt — und die ZIP erkennt sich wieder (E363)
 * ============================================================================
 * L114 Punkt 5: der Leser kannte CP437 nicht, keine verschlüsselten
 * Einträge, keine CRC-Prüfung — ein beschädigter Eintrag kam als
 * vollständiges Dokument ins Regal. L114 Punkt 6: dieselbe ZIP zweimal
 * eingelesen ergab jedes Dokument doppelt („ (2)").
 *
 *   1 · DER KERN: CRC-32 stimmt, CP437 wird gelesen, UTF-8 bleibt UTF-8.
 *   2 · DER LESER nennt Prüfsumme und Flags, wirft bei Beschädigung und
 *       bei Verschlüsselung — bevor etwas ins Regal kommt.
 *   3 · EIN ALTER PACKER: Namen ohne UTF-8-Bit kommen richtig an.
 *   4 · EINE KAPUTTE ZIP: das Gute kommt, das Beschädigte und das
 *       Verschlüsselte stehen mit Grund bei den Übersprungenen.
 *   5 · ZWEIMAL DIESELBE ZIP: nichts doppelt, „schon da (unverändert)".
 *   6 · EINE GEÄNDERTE DATEI kommt daneben, die anderen bleiben eins.
 *   7 · DER EIGENE SCHREIBER setzt das UTF-8-Bit — in beiden Köpfen.
 *   8 · Keine Seitenfehler.
 *
 *   node pruefungen/lauf/test355.mts
 * ==========================================================================*/
declare const Store: any; declare const App: any; declare const ArchivImport: any; declare const Einlesen: any;
declare const ZipDetails: any; declare const Austausch: any;
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { deflateRawSync } from 'node:zlib';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9365;

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll), `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

/* --- Ein ZIP-Schreiber mit Absicht: Flags, Namensbytes und Prüfsumme frei wählbar --- */
const CRC_TAB = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = (b: Uint8Array): number => { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = CRC_TAB[(c ^ b[i]!) & 0xff]! ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
type ZipEintrag = { pfad: string; daten?: Uint8Array; deflate?: boolean; flags?: number; nameBytes?: Buffer; crc?: number };
const zipSchreiben = (eintraege: ZipEintrag[]): Buffer => {
  const teile: Buffer[] = []; const zentral: Buffer[] = []; let offset = 0;
  const dosDatum = (2026 - 1980) << 9 | 9 << 5 | 2;
  for (const e of eintraege) {
    const name = e.nameBytes ?? Buffer.from(e.pfad, 'utf8');
    const roh = Buffer.from(e.daten ?? new Uint8Array(0));
    const komp = e.deflate ? deflateRawSync(roh) : roh;
    const methode = e.deflate ? 8 : 0; const crc = e.crc ?? crc32(roh);
    const flags = e.flags ?? 0x800;
    const lokal = Buffer.alloc(30);
    lokal.writeUInt32LE(0x04034b50, 0); lokal.writeUInt16LE(20, 4); lokal.writeUInt16LE(flags, 6);
    lokal.writeUInt16LE(methode, 8); lokal.writeUInt16LE(0, 10); lokal.writeUInt16LE(dosDatum, 12);
    lokal.writeUInt32LE(crc, 14); lokal.writeUInt32LE(komp.length, 18); lokal.writeUInt32LE(roh.length, 22);
    lokal.writeUInt16LE(name.length, 26); lokal.writeUInt16LE(0, 28);
    const z = Buffer.alloc(46);
    z.writeUInt32LE(0x02014b50, 0); z.writeUInt16LE(20, 4); z.writeUInt16LE(20, 6); z.writeUInt16LE(flags, 8);
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
/* CP437-Bytes für „Alt/Übung.txt" und „Alt/Straße.md": Ü = 0x9A, ß = 0xE1. */
const cp437 = (vor: string, byte: number, nach: string): Buffer => Buffer.concat([Buffer.from(vor, 'latin1'), Buffer.from([byte]), Buffer.from(nach, 'latin1')]);
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');

const ALT = zipSchreiben([
  { pfad: 'Alt/', flags: 0 },
  { pfad: 'Alt/Übung.txt', nameBytes: cp437('Alt/', 0x9a, 'bung.txt'), flags: 0, daten: T('Übung eins') },
  { pfad: 'Alt/Straße.md', nameBytes: cp437('Alt/Stra', 0xe1, 'e.md'), flags: 0, daten: T('# Strasse'), deflate: true },
  { pfad: 'Alt/normal.txt', flags: 0, daten: T('nur ascii') },
  /* UTF-8 ohne Bit — so schreiben es viele Packer heute. */
  { pfad: 'Alt/Öl.txt', flags: 0, daten: T('utf-8 ohne bit') }
]);
const KAPUTT = zipSchreiben([
  { pfad: 'K/gut.txt', daten: T('alles gut') },
  { pfad: 'K/kaputt.txt', daten: T('diese bytes passen nicht zur summe'), crc: 0x12345678, deflate: true },
  { pfad: 'K/geheim.txt', daten: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]), flags: 0x801 }
]);
const WIEDER = (aText: string): Buffer => zipSchreiben([
  { pfad: 'W/a.txt', daten: T(aText) },
  { pfad: 'W/b.md', daten: T('# b'), deflate: true },
  { pfad: 'W/bild.png', daten: new Uint8Array(PNG) }
]);

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
});
const importieren = (b64: string, name: string) => pg.evaluate(async ([b64, name]: [string, string]) => {
  const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  const f = new File([bytes], name, { type: 'application/zip' });
  const lauf = ArchivImport.importZip(f, null, { still: true });
  const wache = new Promise(r => setTimeout(() => r({ zeitueberschreitung: true }), 20000));
  return await Promise.race([lauf, wache]);
}, [b64, name] as [string, string]);
const titelUnter = (fach: string) => pg.evaluate((fach: string) => {
  const f = Store.rootPages().find((k: any) => k.alive !== false && k.heftArt === 'fach' && k.text === fach);
  if (!f) return null;
  return Store.childrenOf(f.id).filter((k: any) => k.type === 'page' && k.alive !== false)
    .map((k: any) => ({ titel: String(k.text), kennung: k.importKennung ?? null })).sort((a: any, b: any) => a.titel.localeCompare(b.titel));
}, fach);

/* ── 1 ────────────────────────────────────────────────────────────────── */
console.log('\n1 · Der Kern: CRC-32 stimmt, CP437 wird gelesen, UTF-8 bleibt UTF-8');
const kern = await pg.evaluate(() => {
  const enc = (s: string) => new TextEncoder().encode(s);
  return {
    pruef: ZipDetails.crc32(enc('123456789')).toString(16),
    hex: ZipDetails.crc32Hex(ZipDetails.crc32(enc('123456789'))),
    fortlaufend: ZipDetails.crc32Fertig(ZipDetails.crc32Weiter(ZipDetails.crc32Weiter(ZipDetails.crc32Start(), enc('12345')), enc('6789'))).toString(16),
    cp437: ZipDetails.nameDecodieren(new Uint8Array([0x9a, 0x62, 0x75, 0x6e, 0x67]), 0),
    sz: ZipDetails.nameDecodieren(new Uint8Array([0x53, 0x74, 0x72, 0x61, 0xe1, 0x65]), 0),
    utf8OhneBit: ZipDetails.nameDecodieren(enc('Öl.txt'), 0),
    utf8MitBit: ZipDetails.nameDecodieren(enc('Übung'), 0x800),
    ascii: ZipDetails.nameDecodieren(enc('plain.txt'), 0),
    geheim: [ZipDetails.istVerschluesselt(1), ZipDetails.istVerschluesselt(0x800), ZipDetails.istVerschluesselt(0x801)]
  };
});
gleich('CRC-32 von „123456789" ist cbf43926 — der Prüfvektor des Standards', kern.pruef, 'cbf43926');
gleich('… als acht Hexzeichen', kern.hex, 'cbf43926');
gleich('… und fortlaufend in zwei Stücken dasselbe', kern.fortlaufend, 'cbf43926');
gleich('CP437: 0x9A ist Ü', kern.cp437, 'Übung');
gleich('CP437: 0xE1 ist ß', kern.sz, 'Straße');
gleich('Gültiges UTF-8 ohne Bit bleibt UTF-8', kern.utf8OhneBit, 'Öl.txt');
gleich('Mit Bit 11 sowieso', kern.utf8MitBit, 'Übung');
gleich('ASCII ist ASCII', kern.ascii, 'plain.txt');
gleich('Bit 0 heisst verschlüsselt, Bit 11 nicht', kern.geheim, [true, false, true]);

/* ── 2 ────────────────────────────────────────────────────────────────── */
console.log('\n2 · Der Leser nennt Prüfsumme und Flags, wirft bei Beschädigung und Verschlüsselung');
const leser = await pg.evaluate(async ([alt, kaputt]: [string, string]) => {
  const zu = (b64: string) => new File([Uint8Array.from(atob(b64), c => c.charCodeAt(0))], 'x.zip');
  const a = await Einlesen.zipLesenAusBlob(zu(alt));
  const k = await Einlesen.zipLesenAusBlob(zu(kaputt));
  const fang = async (fn: () => Promise<unknown>) => { try { await fn(); return 'kein Fehler'; } catch (e) { return e instanceof Error ? e.message : String(e); } };
  const gut = await k.alsBlob('K/gut.txt');
  return {
    namen: a.namen, eintrag: a.eintrag('Alt/Übung.txt'),
    gutText: gut ? await gut.text() : null,
    kaputt: await fang(() => k.alsBlob('K/kaputt.txt')),
    geheim: await fang(() => k.alsBlob('K/geheim.txt')),
    geheimEintrag: k.eintrag('K/geheim.txt'),
    imSpeicher: await (async () => {
      const bytes = Uint8Array.from(atob(kaputt), c => c.charCodeAt(0));
      const z = await Einlesen.zipLesen(bytes.buffer);
      return { gut: new TextDecoder().decode(await z.holen('K/gut.txt')), kaputt: await fang(() => z.holen('K/kaputt.txt')),
        geheim: await fang(() => z.holen('K/geheim.txt')), eintrag: z.eintrag('K/kaputt.txt') };
    })()
  };
}, [ALT.toString('base64'), KAPUTT.toString('base64')] as [string, string]);
gleich('Die Namen kommen entschlüsselt an — CP437 und UTF-8 ohne Bit', leser.namen, ['Alt/', 'Alt/Übung.txt', 'Alt/Straße.md', 'Alt/normal.txt', 'Alt/Öl.txt']);
p('eintrag() nennt Grösse, Prüfsumme, Flags', leser.eintrag && leser.eintrag.groesse === 11 && /^[0-9]+$/.test(String(leser.eintrag.crc)) && leser.eintrag.flags === 0 && leser.eintrag.verschluesselt === false, JSON.stringify(leser.eintrag));
gleich('Der gute Eintrag kommt', leser.gutText, 'alles gut');
p('Der beschädigte wirft — mit „beschädigt" und „Prüfsumme"', /beschädigt/.test(leser.kaputt) && /Prüfsumme/.test(leser.kaputt), leser.kaputt);
p('Der verschlüsselte wirft — mit „verschlüsselt", ohne Entpacken', /verschlüsselt/.test(leser.geheim), leser.geheim);
gleich('… und eintrag() sagt es vorher', leser.geheimEintrag?.verschluesselt, true);
p('Der Leser im Speicher (zipLesen) macht dasselbe', leser.imSpeicher.gut === 'alles gut' && /beschädigt/.test(leser.imSpeicher.kaputt) && /verschlüsselt/.test(leser.imSpeicher.geheim) && leser.imSpeicher.eintrag?.flags === 0x800, JSON.stringify(leser.imSpeicher));

/* ── 3 ────────────────────────────────────────────────────────────────── */
console.log('\n3 · Ein alter Packer: Namen ohne UTF-8-Bit kommen richtig an');
const e1: any = await importieren(ALT.toString('base64'), 'Altpacker.zip');
gleich('Vier Dokumente, keine Fehler, nichts übersprungen', [e1.dokumente, e1.fehler, e1.uebersprungen], [4, [], []]);
/* Sortiert wie im Browser (localeCompare) — „normal" steht dort vor „Öl". */
gleich('Die Titel: normal, Öl, Straße, Übung', (await titelUnter('Alt'))?.map((t: any) => t.titel), ['normal', 'Öl', 'Straße', 'Übung'].sort((a, b) => a.localeCompare(b)));

/* ── 4 ────────────────────────────────────────────────────────────────── */
console.log('\n4 · Eine kaputte ZIP: das Gute kommt, das andere steht mit Grund bei den Übersprungenen');
const e2: any = await importieren(KAPUTT.toString('base64'), 'Kaputt.zip');
gleich('Ein Dokument, keine Fehler', [e2.dokumente, e2.fehler], [1, []]);
p('kaputt.txt: beschädigt, mit der Prüfsumme als Grund', e2.uebersprungen.some((u: string) => /^kaputt\.txt \(beschädigt/.test(u)), JSON.stringify(e2.uebersprungen));
p('geheim.txt: verschlüsselt', e2.uebersprungen.some((u: string) => /^geheim\.txt \(verschlüsselt/.test(u)), JSON.stringify(e2.uebersprungen));
gleich('Im Fach steht nur „gut"', (await titelUnter('K'))?.map((t: any) => t.titel), ['gut']);
p('Der Hinweis nennt die zwei Übersprungenen', /2 übersprungen/.test(String(e2.hinweis)), e2.hinweis);

/* ── 5 ────────────────────────────────────────────────────────────────── */
console.log('\n5 · Zweimal dieselbe ZIP: nichts doppelt, „schon da (unverändert)"');
const w1: any = await importieren(WIEDER('a eins').toString('base64'), 'Wieder.zip');
gleich('Beim ersten Mal drei Dokumente', [w1.dokumente, w1.unveraendert], [3, 0]);
const nachEins = await titelUnter('W');
p('Jedes trägt seine Kennung aus Name, Grösse und Prüfsumme', !!nachEins && nachEins.length === 3 && nachEins.every((t: any) => /^zip:.+\|\d+\|[0-9a-f]{8}$/.test(String(t.kennung))), JSON.stringify(nachEins));
const w2: any = await importieren(WIEDER('a eins').toString('base64'), 'Wieder.zip');
gleich('Beim zweiten Mal: null neue, drei schon da', [w2.dokumente, w2.unveraendert, w2.faecher], [0, 3, 0]);
gleich('… und im Fach steht nichts doppelt', (await titelUnter('W'))?.map((t: any) => t.titel), ['a', 'b', 'bild']);
p('Der Hinweis sagt es', /3 schon da \(unverändert\)/.test(String(w2.hinweis)), w2.hinweis);

/* ── 6 ────────────────────────────────────────────────────────────────── */
console.log('\n6 · Eine geänderte Datei kommt daneben, die anderen bleiben eins');
const w3: any = await importieren(WIEDER('a ZWEI — geändert').toString('base64'), 'Wieder.zip');
gleich('Eine neu, zwei schon da', [w3.dokumente, w3.unveraendert], [1, 2]);
gleich('Die geänderte steht als „a (2)" neben der alten — nichts überschrieben', (await titelUnter('W'))?.map((t: any) => t.titel), ['a', 'a (2)', 'b', 'bild']);

/* ── 7 ────────────────────────────────────────────────────────────────── */
console.log('\n7 · Der eigene Schreiber setzt das UTF-8-Bit — in beiden Köpfen');
const bits = await pg.evaluate(async () => {
  const blob = await Austausch.zipSchreiben([{ name: 'Übung/Straße.txt', inhalt: 'x' }]);
  const b = new Uint8Array(await blob.arrayBuffer());
  const d = new DataView(b.buffer);
  let zentral = -1;
  for (let i = 0; i + 4 <= b.length; i++) if (d.getUint32(i, true) === 0x02014b50) { zentral = i; break; }
  const z = await Einlesen.zipLesenAusBlob(blob);
  return { lokal: d.getUint16(6, true), zentral: zentral >= 0 ? d.getUint16(zentral + 8, true) : -1, namen: z.namen,
    inhalt: await z.text('Übung/Straße.txt') };
});
gleich('Lokaler Kopf: Bit 11', bits.lokal & 0x800, 0x800);
gleich('Verzeichnis: Bit 11', bits.zentral & 0x800, 0x800);
gleich('… und der eigene Leser liest es zurück, Prüfsumme inklusive', [bits.namen, bits.inhalt], [['Übung/Straße.txt'], 'x']);

/* ── 8 ────────────────────────────────────────────────────────────────── */
console.log('\n8 · Keine Seitenfehler');
gleich('Keine Seitenfehler', fehler, []);

await ktx.close(); await browser.close(); server.close();
console.log(`\n${ok}/${ok + weg} bestanden`);
process.exit(weg ? 1 : 0);
