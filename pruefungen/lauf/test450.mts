/* Suite 450 — Die Verweise alter Seiten kommen nach (E477, L133)
 * ============================================================================
 * E473 hat pdf.js aus dem ANZEIGEWEG genommen: die Verweise einer Seite
 * stehen seither am Block, geschrieben beim Einlesen. Alles, was VORHER
 * eingelesen wurde, hat das Feld nicht — und weil „keine Verweise" und
 * „noch nicht nachgesehen" beide wie nichts aussehen, zeigten diese Seiten
 * für immer keine Verweise mehr. E473 hat das ehrlich in L133 stehen
 * lassen; hier wird es abgeräumt.
 *
 * Nachgetragen wird über dieselbe Maschine wie die Seitenbilder: EIN Lauf
 * je Original, im Hintergrund. Das ist ausdrücklich NICHT die Rückkehr des
 * Fundes von E473 — dort hing die ganze PDF am Ansehen JEDER Seite.
 *
 *   §1 DIE LISTE: `ohneVerweise` findet nur, was das Feld nicht hat — eine
 *      LEERE Liste zählt als beantwortet, sonst liefe der Nachtrag ewig.
 *   §2 DER NACHTRAG läuft und schreibt jeder Seite ihr Feld: der ersten
 *      ihre zwei Verweise, der zweiten die leere Liste.
 *   §3 UND DANACH NIE WIEDER: ein zweites Öffnen legt keinen Auftrag an.
 *   §4 OHNE ORIGINAL gar kein Auftrag — eine `.json`-Sicherung kennt keine
 *      Anhänge, und eine Fehlermeldung für etwas, das niemand ändern kann,
 *      ist Lärm (§11, L133).
 *   §5 E473 HÄLT: das blosse Ansehen einer Seite öffnet weiter keine PDF.
 *   §6 QUELLEN, keine Seitenfehler.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 *   §2 → `nachtragAnstossen` als Leerlauf: die Felder bleiben fort.
 *        Gelaufen, rot.
 *   §1, §3 → im Läufer die leere Liste NICHT schreiben (`continue` statt
 *        `updateBlock`): die zweite Seite bleibt offen und der Nachtrag
 *        beginnt beim nächsten Öffnen von vorn. Gelaufen, rot.
 *
 *   node pruefungen/lauf/test450.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

declare const Store: any; declare const App: any; declare const DocumentMode: any;
declare const PdfEinlesen: any; declare const Auftraege: any; declare const PdfLeser: any;

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9570;
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
  if (b) { ok++; console.log('  \u2713 ' + n); }
  else { weg++; console.log('  \u2717 ' + n + (extra ? ' \u2014 ' + extra : '')); }
};
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll), `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);
const lies = (f: string): string => fs.readFileSync(path.join(WURZEL, f), 'utf8');

/* EINE ECHTE PDF MIT TEXT UND ZWEI LINK-ANMERKUNGEN, von Hand gebaut wie in
   test437: Seite 1 mit „Ohm, Ohm, Ohm", einem Verweis nach draussen und
   einem auf Seite 2. Keine Bibliothek — pdf.js liest sie wie jede andere. */
const pdfBytes = (): Buffer => {
  const objs: string[] = [];
  objs.push('<< /Type /Pages /Count 2 /Kids [4 0 R 6 0 R] >>');                      // 1
  objs.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');                // 2
  const s1 = 'BT /F1 24 Tf 50 770 Td (Reihenschaltung: R = R1 + R2) Tj ET\n' +
             'BT /F1 14 Tf 50 700 Td (Ohm, Ohm, Ohm) Tj ET\n' +
             'BT /F1 12 Tf 50 650 Td (Weiter zu Seite 2) Tj ET\n';
  objs.push(`<< /Length ${Buffer.byteLength(s1)} >>\nstream\n${s1}endstream`);        // 3
  objs.push('<< /Type /Page /Parent 1 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 2 0 R >> >> /Contents 3 0 R /Annots [7 0 R 8 0 R] >>'); // 4
  const s2 = 'BT /F1 24 Tf 50 770 Td (Kapitel 2: Parallelschaltung) Tj ET\n';
  objs.push(`<< /Length ${Buffer.byteLength(s2)} >>\nstream\n${s2}endstream`);        // 5
  objs.push('<< /Type /Page /Parent 1 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 2 0 R >> >> /Contents 5 0 R >>'); // 6
  objs.push('<< /Type /Annot /Subtype /Link /Rect [50 640 200 665] /Border [0 0 0] /A << /S /URI /URI (https://example.org/ohm) >> >>'); // 7
  objs.push('<< /Type /Annot /Subtype /Link /Rect [50 690 200 715] /Border [0 0 0] /Dest [6 0 R /XYZ 0 842 0] >>'); // 8
  objs.push('<< /Type /Catalog /Pages 1 0 R >>');                                     // 9
  let text = '%PDF-1.4\n'; const offsets: number[] = [];
  objs.forEach((obj, i) => { offsets.push(Buffer.byteLength(text)); text += `${i + 1} 0 obj\n${obj}\nendobj\n`; });
  const xref = Buffer.byteLength(text);
  text += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offsets.map(n => `${String(n).padStart(10, '0')} 00000 n \n`).join('');
  return Buffer.from(text + `trailer\n<< /Size ${objs.length + 1} /Root ${objs.length} 0 R >>\nstartxref\n${xref}\n%%EOF`);
};
const PDF64 = pdfBytes().toString('base64');

const browser = await chromium.launch();
const fehler: string[] = [];
const s = await browser.newPage({ viewport: { width: 1360, height: 900 } });
s.on('pageerror', e => fehler.push(e.message.slice(0, 140)));
await s.goto(`http://localhost:${PORT}/index.html`);
await s.waitForFunction("typeof App !== 'undefined' && typeof DocumentMode !== 'undefined' && typeof PdfEinlesen !== 'undefined' && typeof Auftraege !== 'undefined'");
await s.evaluate(() => {
  Store.setMeta('rundgangGesehen', true);
  document.querySelectorAll('.overlay').forEach(o => o.remove());
  document.querySelector('.produkt-onboarding-lage')?.remove();
  document.getElementById('rg-willkommen')?.remove();
  document.getElementById('rg-einladung')?.remove();
});

/* Eine PDF einlesen — mit E473 stehen die Verweise danach am Block. Dann
   wird das Feld ENTFERNT: genau der Zustand einer Seite, die vor E473
   eingelesen wurde. Ein echterer Ausgangspunkt ist nicht zu bekommen,
   ohne eine alte Fassung der App zu starten. */
const seiteId = await s.evaluate(async (b64: string) => {
  const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  const seite = Store.addPage(null, { text: 'Altes Skript', icon: '📕' });
  await PdfEinlesen.alsSeiten(new File([bytes], 'alt.pdf', { type: 'application/pdf' }),
    seite.id, { anordnung: 'untereinander', ueberGrenze: 'alle' });
  Store.updateBlock(seite.id, { dokumentModus: true });
  await Store.flush();
  return seite.id as string;
}, PDF64);

const felder = (): Promise<any[]> => s.evaluate((id: string) =>
  DocumentMode.documentsIn(Store.getBlock(id))
    .map((b: any) => ({ nr: b.nr, hat: Array.isArray(b.verweise), n: (b.verweise || []).length })), seiteId);

console.log('\n§1 Die Liste: was das Feld nicht hat');
{
  gleich('Frisch eingelesen haben beide Seiten ihr Feld (E473)',
    await felder(), [{ nr: 1, hat: true, n: 2 }, { nr: 2, hat: true, n: 0 }]);
  const quelleId = String(await s.evaluate((id: string) =>
    DocumentMode.documentsIn(Store.getBlock(id))[0].quelleId, seiteId));
  gleich('`ohneVerweise` findet nichts — auch die LEERE Liste ist eine Antwort',
    await s.evaluate((q: string) => PdfEinlesen.ohneVerweise(q).length, quelleId), 0);
  /* Jetzt das Feld wegnehmen: der Zustand vor E473. */
  await s.evaluate(async (id: string) => {
    for (const b of DocumentMode.documentsIn(Store.getBlock(id))) {
      const kopie = { ...Store.getBlock(b.id) };
      delete kopie.verweise;
      Store.rohSetzen('blocks', kopie);
    }
    await Store.flush();
  }, seiteId);
  gleich('Ohne das Feld sind beide Seiten offen', await felder(),
    [{ nr: 1, hat: false, n: 0 }, { nr: 2, hat: false, n: 0 }]);
  gleich('… und `ohneVerweise` führt sie beide',
    await s.evaluate((q: string) => PdfEinlesen.ohneVerweise(q).map((b: any) => b.nr), quelleId), [1, 2]);
}

console.log('\n§2 Der Nachtrag läuft beim Öffnen');
{
  await s.evaluate(async (id: string) => { App.oeffne(id); await new Promise(r => setTimeout(r, 1500)); }, seiteId);
  /* Der Auftrag läuft im Hintergrund — ihm Zeit lassen. */
  for (let i = 0; i < 40; i++) {
    const f = await felder();
    if (f.every((x: any) => x.hat)) break;
    await s.waitForTimeout(300);
  }
  gleich('Beide Seiten haben ihr Feld zurück — die erste mit zwei Verweisen, die zweite leer',
    await felder(), [{ nr: 1, hat: true, n: 2 }, { nr: 2, hat: true, n: 0 }]);
  const v = await s.evaluate((id: string) => {
    const b = DocumentMode.documentsIn(Store.getBlock(id))[0];
    return b.verweise.map((x: any) => x.url || ('Seite ' + x.seite));
  }, seiteId);
  gleich('… und es sind dieselben zwei wie beim Einlesen',
    v.slice().sort(), ['Seite 2', 'https://example.org/ohm']);
  await s.waitForTimeout(600);
  const gemalt = Number(await s.evaluate(`document.querySelectorAll('.document-verweis').length`));
  p('Die Verweisschicht ist nach dem Nachtrag gemalt — ohne neues Öffnen', gemalt >= 2, String(gemalt));
}

console.log('\n§3 Und danach nie wieder');
{
  const quelleId = String(await s.evaluate((id: string) =>
    DocumentMode.documentsIn(Store.getBlock(id))[0].quelleId, seiteId));
  const r = await s.evaluate((q: string) => PdfEinlesen.verweiseNachtragen(q), quelleId);
  gleich('Ein zweiter Anstoss legt keinen Auftrag an', [r.auftrag, r.grund], [null, 'nichts offen']);
}

console.log('\n§4 Ohne Original gar kein Auftrag');
{
  const r = await s.evaluate(async () => {
    const seite = Store.addPage(null, { text: 'Aus einer JSON-Sicherung', icon: '📕' });
    Store.updateBlock(seite.id, { dokumentModus: true });
    Store.addBlock(seite.id, 'pdfseite', { text: '', nr: 1, vonSeiten: 1, bw: 595, bh: 842,
      quelleId: 'gibtesnicht', raumVersion: 1 });
    await Store.flush();
    return PdfEinlesen.verweiseNachtragen('gibtesnicht');
  });
  gleich('Fehlt das Original, wird nichts angelegt und niemand angeschrien',
    [r.auftrag, r.grund], [null, 'ohne Original']);
}

console.log('\n§5 E473 hält: Ansehen öffnet keine PDF');
{
  /* Gezählt wird, wie oft `PdfLeser.oeffne` gerufen wird, während man
     durch ein Dokument rollt, dessen Seiten ihr Feld haben. */
  const zahl = await s.evaluate(async (id: string) => {
    const echt = PdfLeser.oeffne;
    let n = 0;
    PdfLeser.oeffne = (...a: unknown[]) => { n++; return echt.apply(PdfLeser, a); };
    App.oeffne(id);
    await new Promise(r => setTimeout(r, 1600));
    const c = document.querySelector<HTMLElement>('.document-center');
    if (c) c.scrollTop = c.scrollHeight;
    await new Promise(r => setTimeout(r, 1400));
    PdfLeser.oeffne = echt;
    return n;
  }, seiteId);
  gleich('Kein einziges Öffnen der Original-PDF beim Ansehen und Rollen', zahl, 0);
}

console.log('\n§6 Quellen');
p('`ohneVerweise`, `verweiseLaeufer` und `verweiseNachtragen` stehen in `einlesen.ts`',
  /const ohneVerweise = /.test(lies('src/bereiche/pdf/einlesen.ts'))
  && /const verweiseLaeufer = /.test(lies('src/bereiche/pdf/einlesen.ts'))
  && /const verweiseNachtragen = /.test(lies('src/bereiche/pdf/einlesen.ts')));
p('Die Art ist bei der Maschine angemeldet',
  /Auftraege\.anmelden\(AUFTRAG_VERWEISE, verweiseLaeufer, 'Verweise nachtragen'\)/.test(lies('src/bereiche/pdf/einlesen.ts')));
p('`document-mode.ts` stösst ihn an und lässt den Horcher wieder los',
  /nachtragAnstossen\(documents,/.test(lies('src/bereiche/pdf/document-mode.ts'))
  && /freigeben: \(\): void => \{ griffeSchliessen\(\); verweisHorchenAus\(\); \}/.test(lies('src/bereiche/pdf/document-mode.ts')));
p('Das erzeugte JS trägt beides',
  /verweiseNachtragen/.test(lies('quell/bereiche/pdf/einlesen.js'))
  && /nachtragAnstossen/.test(lies('quell/bereiche/pdf/document-mode.js')));
gleich('Keine Seitenfehler', fehler, []);

console.log(`\n${ok}/${ok + weg} bestanden · ✗=${weg}`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
