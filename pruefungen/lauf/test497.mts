/* Suite 497 — Das Original bleibt, und der Vortrag ist mit dem Finger bedienbar
 * ============================================================================
 * Redur, 12. September: „ich will das redion auch die anderen daten auch
 * öffnen kann z.B. word und powerpoint … aber wichtig die originale datei
 * wird immer geschützt."
 *
 * ZWEI FUNDE AUS DER VERMESSUNG, beide älter als seine Frage:
 *
 *   §1 OFFICE WAR DIE EINZIGE GRUPPE OHNE ORIGINALSCHUTZ. `Einlesen.datei`
 *      las die Bytes in einen Puffer, schrieb Blöcke und liess die Datei
 *      fallen — kein `Dateien.ablegen`, keine Kennung, kein Anhang. Der
 *      PDF-Weg legt ab (`bereiche/pdf/einlesen.ts:107`), der Anhang-Weg legt
 *      ab (`archiveImport.ts:204`), dieser nicht. Und die Umwandlung ist
 *      verlustbehaftet: Bilder, Kopfzeilen, Fussnoten, Spalten, Schriftgrade
 *      bleiben zurück. Wer die Datei danach von der Platte löschte, hatte
 *      sie verloren — ohne dass irgendwo stand, dass etwas fehlt.
 *
 *   §2 DER VORTRAG WAR AM TELEFON NICHT BEDIENBAR. `.praesi-leiste button`
 *      hatte `padding:4px 10px` bei 13 px Schrift, also rund 25 px. Genau
 *      mit diesen Knöpfen wird am Telefon geblättert und beendet: Wischen
 *      gibt es im Vortrag nicht, ein Tipp auf die Folienhälften auch nicht.
 *      §37 [hart]: 44 px auf den Hauptwegen, ohne Ausnahme.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 *   §1 → `originalSichern`/`originalAnhaengen` in `dateien/einlesen.ts`
 *        wieder herausnehmen: kein `file`-Block mit `original`, kein Satz im
 *        Fach `dateien`. Beide Zusagen rot.
 *   §2 → `min-height:var(--touch-min)` in `werkzeuge.css` streichen: die
 *        gemessene Höhe fällt auf ~25 px zurück, die Zusage rot.
 *
 *   node pruefungen/lauf/test497.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
/* Die App lädt als klassische Skripte: `Store`, `Einlesen` und `Austausch`
   sind Top-Level-Konstanten im Seitenbereich, NICHT Felder von `window`.
   Genau darum lief der erste Versuch auf „undefined" — `(window as any).Store`
   war leer, obwohl `typeof Store !== "undefined"` längst wahr war. */
declare const Store: any;
declare const Einlesen: any;
declare const Austausch: any;
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9607;
const TYP: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon', '.svg': 'image/svg+xml'
};
const server = http.createServer((a: IncomingMessage, b: ServerResponse) => {
  const rein = decodeURIComponent((a.url ?? '/').split('?')[0] ?? '/');
  const datei = path.join(WURZEL, rein === '/' ? 'index.html' : rein.slice(1));
  if (!datei.startsWith(WURZEL) || !fs.existsSync(datei) || fs.statSync(datei).isDirectory()) {
    b.writeHead(404); b.end(); return;
  }
  b.writeHead(200, { 'Content-Type': TYP[path.extname(datei)] ?? 'application/octet-stream' });
  b.end(fs.readFileSync(datei));
});
await new Promise<void>(f => server.listen(PORT, f));

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};

const browser = await chromium.launch();
const fehler: string[] = [];

const seiteAuf = async (breite: number) => {
  const kontext = await browser.newContext({ viewport: { width: breite, height: 820 } });
  const seite = await kontext.newPage();
  seite.on('pageerror', e => fehler.push(e.message));
  await seite.goto(`http://localhost:${PORT}/index.html`);
  await seite.waitForFunction('typeof Store !== "undefined" && typeof Einlesen !== "undefined"');
  await seite.evaluate(() => {
    document.querySelectorAll<HTMLElement>('#rg-willkommen [data-a="los"]').forEach(b => b.click());
  });
  await seite.waitForTimeout(400);
  return { kontext, seite };
};

/* ══ §1 DAS ORIGINAL BLEIBT ══════════════════════════════════════════════ */
console.log('\n§1 Eine eingelesene Word-Datei bleibt als Original erhalten');
{
  const { kontext, seite } = await seiteAuf(1180);

  /* Eine ECHTE .docx, mit Redions eigenem Schreiber erzeugt — kein
     erfundener Puffer. So prüft der Lauf den Weg, den ein Mensch geht. */
  const ergebnis = await seite.evaluate(async () => {
    /* Minimales, gültiges Word-Dokument: ein Absatz. Von Hand gebaut, damit
       der Lauf nicht vom Export abhängt, den er nicht prüft. */
    const doc = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
      '<w:body><w:p><w:r><w:t>Hallo aus Word</w:t></w:r></w:p></w:body></w:document>';
    const types = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>';
    const rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>';
    const blob = await Austausch.zipSchreiben([
      { name: '[Content_Types].xml', inhalt: types },
      { name: '_rels/.rels', inhalt: rels },
      { name: 'word/document.xml', inhalt: doc }
    ]);
    const f = new File([blob], 'Bericht.docx',
      { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });

    const vorher = (await Store.dateiAlle()).length;
    const r = await Einlesen.datei(f);
    const nachher = (await Store.dateiAlle()).length;

    const kinder = Store.childrenOf(r.seite.id) || [];
    const anhang = kinder.find((b: any) => b.type === 'file' && b.original);
    const satz = anhang ? (await Store.dateiAlle())
      .find((d: any) => d.id === anhang.dateiId) : null;

    return {
      hinweis: String(r.hinweis || ''),
      neueDateien: nachher - vorher,
      anhangDa: !!anhang,
      anhangName: anhang ? anhang.text : '',
      anhangIstErster: kinder.length > 0 && kinder[0] === anhang,
      satzGroesse: satz ? satz.groesse : 0,
      satzZeigtAufAnhang: !!(satz && anhang && satz.blockId === anhang.id),
      /* Abgeleitetes bleibt aus der Sicherung draussen — das Original NICHT. */
      satzAbgeleitet: satz ? !!satz.abgeleitet : true,
      blobGroesse: blob.size,
      textDa: kinder.some((b: any) => (b.text || '').includes('Hallo aus Word'))
    };
  });

  p('Die Word-Datei wird als Original abgelegt', ergebnis.neueDateien === 1,
    'neue Dateisätze: ' + ergebnis.neueDateien);
  p('Sie hängt sichtbar an der Seite', ergebnis.anhangDa);
  p('… unter ihrem echten Namen', ergebnis.anhangName === 'Bericht.docx', ergebnis.anhangName);
  p('… an erster Stelle, vor dem Umgewandelten', ergebnis.anhangIstErster);
  p('… mit den echten Bytes, nicht leer',
    ergebnis.satzGroesse > 0 && ergebnis.satzGroesse === ergebnis.blobGroesse,
    'Satz ' + ergebnis.satzGroesse + ' / Datei ' + ergebnis.blobGroesse);
  p('Der Dateisatz zeigt auf den Anhang (E99)', ergebnis.satzZeigtAufAnhang);
  p('Das Original ist NICHT abgeleitet und reist in der Sicherung mit',
    ergebnis.satzAbgeleitet === false);
  p('Der Text ist trotzdem umgewandelt worden', ergebnis.textDa);
  p('Der Hinweis sagt, dass das Original dabeiliegt',
    /Original/.test(ergebnis.hinweis), ergebnis.hinweis);

  await kontext.close();
}

/* ══ §2 DER VORTRAG IST MIT DEM FINGER BEDIENBAR ═════════════════════════ */
console.log('\n§2 Die Knöpfe im Vortrag messen 44 px (§37)');
{
  const { kontext, seite } = await seiteAuf(390);

  const masse = await seite.evaluate(() => {
    /* Die Leiste mit den ECHTEN Klassen aufbauen — derselbe Aufbau wie im
       Vortragsmodus (werkzeuge.ts), aber ohne ihn zu starten: er verlangt
       Vollbild, und das gibt ein Prüfbrowser nicht her. */
    const leiste = document.createElement('div');
    leiste.className = 'praesi-leiste';
    leiste.innerHTML = '<button id="pv">‹</button><span>1 / 3</span>' +
                       '<button id="pn">›</button><button id="pe">Beenden</button>';
    document.body.append(leiste);
    const lies = (id: string) => {
      const el = document.getElementById(id);
      if (!el) return { h: 0, b: 0 };
      const r = el.getBoundingClientRect();
      return { h: Math.round(r.height), b: Math.round(r.width) };
    };
    const werte = { vor: lies('pv'), nach: lies('pn'), ende: lies('pe') };
    leiste.remove();
    return werte;
  });

  for (const [name, m] of Object.entries(masse)) {
    p(`Knopf „${name}" ist mindestens 44 px hoch`, m.h >= 44, m.h + ' px');
    p(`Knopf „${name}" ist mindestens 44 px breit`, m.b >= 44, m.b + ' px');
  }

  await kontext.close();
}

p('Keine Browserfehler', fehler.length === 0, fehler.join(' | '));

await browser.close();
server.close();
console.log(`\nSuite 497: ${ok} grün` + (weg ? `, ${weg} rot` : '') + '.');
process.exit(weg ? 1 : 0);
