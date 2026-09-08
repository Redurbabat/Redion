/* Suite 470 — Voreinstellungen, GIFs und das Formelbuch als Marke (E501, E502)
 * ============================================================================
 * Redur mit dem GoodNotes-Dossier, 8. September: „schau dass der Stift genau
 * gleich so ist … auch dass ich GIFs und mein Formelbuch hier einfügen kann
 * und so kleiner grösser machen kann, verschieben kann."
 *
 * Der Stift-Abschnitt des Dossiers nennt eine Sache, die Redion nicht hatte:
 * „Farben und Stärken lassen sich anpassen und als Presets bereithalten."
 * Und ein Formelbuch ist eine PDF — bisher konnte Redion sie nur als SEITEN
 * einfügen, nicht als etwas, das man schiebt und zieht.
 *
 *   §1 EINE VOREINSTELLUNG IST EIN FARBSATZ MIT ZWEI FELDERN MEHR — kein
 *      zweiter Katalog (§8). Alte Sätze ohne die Felder laden weiter (§9).
 *   §2 ÜBER DIE LEISTE: sichern nimmt Stift und Stärke mit, laden holt
 *      beides zurück, und die Leiste zeigt es sofort.
 *   §3 EIN GIF WIRD ALS GIF ABGELEGT — Byte für Byte, nicht umgerechnet;
 *      sonst stünde ein Standbild auf dem Blatt.
 *   §4 EINE PDF-SEITE WIRD EINE BILDMARKE: gewählt, gerastert, gesetzt —
 *      und danach verschiebbar, skalierbar, drehbar wie jede Marke.
 *   §5 QUELLEN, keine Seitenfehler.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 * Vier Gegenproben, alle gelaufen, alle rot gesehen:
 *   §1 → in `farbsaetze` das Lesen von `stil`/`breite` weglassen: die
 *        gesicherte Voreinstellung kommt ohne Stift zurück. Rot in vier.
 *   §2 → in der Wahl `stiftZeigen` weglassen: der Knopf trägt weiter
 *        „Bleistift", obwohl der Pinsel führt. Rot in drei.
 *   §3 → die Datei mit einem anderen Typ ablegen: der Prüflauf sieht
 *        image/webp statt image/gif und 71 statt 62 Bytes. Rot in zwei.
 *   §4 → den PDF-Zweig in `bildEinfuegen` abschalten: es kommt keine
 *        Seitenfrage, und §4 läuft in die Zeitgrenze. Rot.
 *
 * UND EINE, DIE DEN FEHLER GEFUNDEN HAT: die erste Fassung setzte die
 * Strichstärke nur an der Fläche (`controls.setzeStrich`). `Zeichenziel`,
 * die Stufenknöpfe und der Regler wussten nichts davon, und `markiere()`
 * malte danach den ALTEN Wert zurück — der Prüflauf sah 1,2 statt 5.
 * Seither gibt es `strichSetzen`, und alle drei Wege gehen hindurch (§8).
 *
 *   node pruefungen/lauf/test470.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import type { Page } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

declare const Store: any; declare const App: any; declare const Marken: any;

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9590;
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

/* Ein winziges GIF89a mit Netscape-Schleife — echte GIF-Bytes, kein PNG
   mit anderem Namen. Es geht hier nicht ums Aussehen, sondern darum, dass
   Redion die Bytes UNVERÄNDERT ablegt. */
const GIF = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH/C05FVFNDQVBFMi4wAwEAAAAh+QQFAAAAACwAAAAAAQABAAACAkQBADs=',
  'base64');

/* Eine PDF mit zwei Seiten — dieselbe Bauform wie in test437. */
const pdf = (): Buffer => {
  const objs = ['<< /Type /Pages /Count 2 /Kids [4 0 R 6 0 R] >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];
  for (let n = 1; n <= 2; n++) {
    const stream = `0.1 0.1 0.1 rg BT /F1 28 Tf 60 760 Td (Formelbuch Seite ${n}) Tj ET\n`
      + `BT /F1 14 Tf 60 700 Td (U = R mal I  —  P = U mal I) Tj ET\n`;
    objs.push(`<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}endstream`);
    objs.push(`<< /Type /Page /Parent 1 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 2 0 R >> >> /Contents ${objs.length} 0 R >>`);
  }
  objs.push('<< /Type /Catalog /Pages 1 0 R >>');
  let text = '%PDF-1.4\n'; const offsets: number[] = [];
  objs.forEach((obj, i) => { offsets.push(Buffer.byteLength(text)); text += `${i + 1} 0 obj\n${obj}\nendobj\n`; });
  const xref = Buffer.byteLength(text);
  text += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`
    + offsets.map(n => `${String(n).padStart(10, '0')} 00000 n \n`).join('');
  return Buffer.from(text + `trailer\n<< /Size ${objs.length + 1} /Root ${objs.length} 0 R >>\nstartxref\n${xref}\n%%EOF`);
};

const browser = await chromium.launch();
const fehler: string[] = [];

/** Eine Seite mit einem Blatt und der echten Zeichenleiste. */
const mitBlatt = async (): Promise<Page> => {
  const s = await browser.newPage({ viewport: { width: 1280, height: 950 } });
  s.on('pageerror', e => fehler.push(e.message.slice(0, 140)));
  s.on('dialog', d => d.dismiss().catch(() => {}));
  await s.goto(`http://localhost:${PORT}/index.html`);
  await s.waitForFunction("typeof App !== 'undefined' && typeof Marken !== 'undefined'");
  await s.evaluate(async () => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    document.querySelector('.produkt-onboarding-lage')?.remove();
    document.getElementById('rg-willkommen')?.remove();
    document.getElementById('rg-einladung')?.remove();
    Store.setMeta('zeichnen:farbsaetze', []);
    const seite = Store.addPage(null, { text: 'Formelblatt' });
    Store.addBlock(seite.id, 'blatt', { text: '', blattBreite: 595.28, blattHoehe: 841.89,
      raumVersion: 1, marken: [] });
    await Store.flush();
    App.oeffne(seite.id);
  });
  await s.waitForSelector('.blatt-werk [data-wz="stift"]', { timeout: 15000 });
  await s.waitForTimeout(400);
  return s;
};

/* ═══ §1 Die Voreinstellung ════════════════════════════════════════════════ */
console.log('\n§1 Ein Satz merkt sich auch Stift und Strichstärke');
{
  const s = await mitBlatt();
  const r = JSON.parse(await s.evaluate(`(() => {
    Store.setMeta('zeichnen:farbsaetze', []);
    Marken.farbenSetzen(['#aa0000', '#00aa00']);
    Marken.farbsatzSichern('Korrektur', Marken.eigeneFarben(), { stil: 'pinsel', breite: 5 });
    const satz = Marken.farbsaetze()[0];
    Marken.farbenZuruecksetzen();
    const geladen = Marken.farbsatzLaden('Korrektur');
    /* Ein Satz OHNE Stift und Stärke — so sehen alle von vor E501 aus. */
    Store.setMeta('zeichnen:farbsaetze', [{ name: 'Alt', farben: ['#123456'] }]);
    const alt = Marken.farbsatzLaden('Alt');
    /* Und einer mit einem Stift, den es nicht gibt. */
    Store.setMeta('zeichnen:farbsaetze', [{ name: 'Kaputt', farben: ['#123456'],
      stil: 'gibtsnicht', breite: -3 }]);
    const kaputt = Marken.farbsaetze()[0];
    return JSON.stringify({ satz, geladen, alt, kaputt,
      unbekannt: Marken.farbsatzLaden('gibtsgarnicht') });
  })()`) as string);
  gleich('Gesichert mit Stift und Stärke', [r.satz?.stil, r.satz?.breite], ['pinsel', 5]);
  gleich('… und die Farben stehen weiter darin', r.satz?.farben, ['#aa0000', '#00aa00']);
  gleich('Geladen kommt alles zurück',
    [r.geladen?.farben, r.geladen?.stil, r.geladen?.breite], [['#aa0000', '#00aa00'], 'pinsel', 5]);
  /* RÜCKWÄRTS GEDACHT (§9): ein Satz von vor E501 hat die zwei Felder nicht
     und lädt trotzdem — er ist dann eben ein Farbsatz, kein Preset. */
  gleich('Ein alter Satz lädt weiter, ohne Stift und Stärke',
    [r.alt?.farben, r.alt?.stil, r.alt?.breite], [['#123456'], undefined, undefined]);
  gleich('Ein Stift, den es nicht gibt, kommt gar nicht erst durch',
    [r.kaputt?.stil, r.kaputt?.breite], [undefined, undefined]);
  gleich('Ein unbekannter Name gibt nichts', r.unbekannt, null);
  await s.close();
}

/* ═══ §2 Über die Leiste ═══════════════════════════════════════════════════ */
console.log('\n§2 Sichern und Laden über die Leiste');
{
  const s = await mitBlatt();
  await s.click('.blatt-werk [data-wz="stift"]');
  await s.waitForTimeout(200);
  /* Pinsel wählen (Füller → Kugel → Pinsel) und die dickste Stufe. */
  await s.click('.blatt-werk [data-act="stil"]');
  await s.click('.blatt-werk [data-act="stil"]');
  await s.evaluate(`(() => {
    const dick = [...document.querySelectorAll('.blatt-werk .blatt-strich')].pop();
    dick.click();
  })()`);
  await s.waitForTimeout(250);
  const vorher = JSON.parse(await s.evaluate(`(() => {
    const k = document.querySelector('.blatt-werk [data-act="stil"]');
    const b = document.querySelector('.blatt-werk .blatt-strich.on');
    return JSON.stringify({ stil: k.dataset.stil, breite: Number(b.dataset.b) });
  })()`) as string);
  gleich('Der Pinsel und die dickste Stufe führen', vorher.stil, 'pinsel');

  /* Sichern über das „+" → „Diese Einstellung sichern". */
  await s.click('.blatt-werk .blatt-farbe-neu');
  await s.waitForSelector('.overlay [data-w="sichern"]', { timeout: 5000 });
  await s.click('.overlay [data-w="sichern"]');
  await s.waitForSelector('.overlay #fq', { timeout: 5000 });
  await s.fill('.overlay #fq', 'Korrektur');
  await s.click('.overlay [data-a="ok"]');
  await s.waitForTimeout(500);
  const gesichert = JSON.parse(await s.evaluate(`JSON.stringify(Marken.farbsaetze()[0])`) as string);
  gleich('Der Satz trägt Stift und Stärke', [gesichert?.stil, gesichert?.breite],
    [vorher.stil, vorher.breite]);

  /* Jetzt etwas anderes führen — und die Einstellung wieder laden. */
  await s.click('.blatt-werk [data-act="stil"]');
  await s.evaluate(`document.querySelector('.blatt-werk .blatt-strich').click()`);
  await s.waitForTimeout(250);
  const dazwischen = await s.evaluate(`document.querySelector('.blatt-werk [data-act="stil"]').dataset.stil`);
  p('Zwischendurch führt ein anderer Stift', dazwischen !== vorher.stil, String(dazwischen));

  await s.click('.blatt-werk .blatt-farbe-neu');
  await s.waitForSelector('.overlay [data-w="laden:Korrektur"]', { timeout: 5000 });
  const hinweis = String(await s.evaluate(
    `document.querySelector('.overlay [data-w="laden:Korrektur"]').textContent`));
  p('Der Eintrag nennt Stift und Stärke', /Pinsel/.test(hinweis) && /px/.test(hinweis), hinweis);
  await s.click('.overlay [data-w="laden:Korrektur"]');
  await s.waitForTimeout(600);
  const nachher = JSON.parse(await s.evaluate(`(() => {
    const k = document.querySelector('.blatt-werk [data-act="stil"]');
    const b = document.querySelector('.blatt-werk .blatt-strich.on');
    return JSON.stringify({ stil: k.dataset.stil, wort: k.querySelector('.wort').textContent,
      breite: b ? Number(b.dataset.b) : null,
      gemerkt: Store.getMeta('zeichnen:stift') });
  })()`) as string);
  gleich('Nach dem Laden führt wieder der Pinsel', nachher.stil, 'pinsel');
  gleich('… und der Knopf trägt seinen Namen', nachher.wort, 'Pinsel');
  gleich('… die Fläche weiss es auch', nachher.gemerkt, 'pinsel');
  gleich('… und die Strichstärke ist wieder die gesicherte', nachher.breite, vorher.breite);
  await s.close();
}

/* ═══ §3 Ein GIF bleibt ein GIF ════════════════════════════════════════════ */
console.log('\n§3 Ein GIF wird Byte für Byte abgelegt');
{
  const s = await mitBlatt();
  /* DER BILD-KNOPF ÖFFNET DEN WÄHLER SOFORT (E357) — er schaltet kein
     Werkzeug um. Also muss der Horcher VOR dem Klick stehen; der erste
     Entwurf wartete danach und lief in die Zeitgrenze. */
  const waehler = s.waitForEvent('filechooser');
  await s.click('.blatt-werk [data-wz="bild"]');
  await (await waehler).setFiles({ name: 'zwinker.gif', mimeType: 'image/gif', buffer: GIF });
  await s.waitForTimeout(900);
  const r = JSON.parse(await s.evaluate(`(async () => {
    const b = Object.values(Store.cache.blocks).find(x => x.type === 'blatt' && x.alive);
    const marke = (b.marken || [])[0];
    const satz = marke ? await Store.dateiHolen(marke.dateiId) : null;
    /* Die Bildmarke ist eine GRUPPE mit dem <image> darin — nachgesehen,
       nicht geraten: der erste Entwurf fragte den Knoten selbst und bekam
       „g" zurück. */
    const gruppe = document.querySelector('.blatt-marken [data-ink-art="bild"]');
    const bild = gruppe ? (gruppe.tagName.toLowerCase() === 'image' ? gruppe : gruppe.querySelector('image')) : null;
    return JSON.stringify({ art: marke?.art, name: satz?.name, typ: satz?.typ,
      groesse: satz?.groesse, knoten: bild ? bild.tagName.toLowerCase() : '',
      href: bild ? String(bild.getAttribute('href') || bild.getAttribute('xlink:href') || '').slice(0, 5) : '' });
  })()`) as string);
  gleich('Es steht als Bildmarke auf dem Blatt', r.art, 'bild');
  gleich('… unter seinem Namen', r.name, 'zwinker.gif');
  /* DER PUNKT: NICHT UMGERECHNET. Ein GIF, das durch die Leinwand geht,
     verliert seine Bilder und steht danach still. */
  gleich('… als image/gif, nicht als WebP', r.typ, 'image/gif');
  gleich('… und mit genau den Bytes, die hineingingen', r.groesse, GIF.length);
  gleich('Gezeichnet wird es als <image> mit einer Blob-Adresse', [r.knoten, r.href], ['image', 'blob:']);
  await s.close();
}

/* ═══ §4 Das Formelbuch als Marke ══════════════════════════════════════════ */
console.log('\n§4 Eine PDF-Seite wird eine Bildmarke');
{
  const s = await mitBlatt();
  const kasten = (await s.locator('.blatt-marken').boundingBox())!;
  const waehler = s.waitForEvent('filechooser');
  await s.click('.blatt-werk [data-wz="bild"]');
  await (await waehler).setFiles({ name: 'Formelbuch.pdf', mimeType: 'application/pdf', buffer: pdf() });
  /* Zwei Seiten — also fragt Redion, welche. */
  await s.waitForSelector('.overlay #fq', { timeout: 15000 });
  const frage = String(await s.evaluate(`document.querySelector('.overlay .fh').textContent`));
  p('Bei mehreren Seiten wird gefragt, welche',
    /Formelbuch/.test(frage) && /1 bis 2/.test(frage), frage);
  await s.fill('.overlay #fq', '2');
  await s.click('.overlay [data-a="ok"]');
  await s.waitForTimeout(2500);
  const r = JSON.parse(await s.evaluate(`(async () => {
    const b = Object.values(Store.cache.blocks).find(x => x.type === 'blatt' && x.alive);
    const marke = (b.marken || [])[0];
    const satz = marke ? await Store.dateiHolen(marke.dateiId) : null;
    return JSON.stringify({ anzahl: (b.marken || []).length, art: marke?.art,
      name: satz?.name, typ: satz?.typ, groesse: satz?.groesse,
      pts: marke?.pts, gewaehlt: document.querySelectorAll('.blatt-auswahlrahmen').length,
      werkzeug: document.querySelector('.blatt-marken').getAttribute('data-tool') });
  })()`) as string);
  gleich('Eine Bildmarke steht auf dem Blatt', [r.anzahl, r.art], [1, 'bild']);
  p('… und sie heisst nach der Seite', /Formelbuch/.test(String(r.name)) && /Seite 2/.test(String(r.name)),
    String(r.name));
  p('… als gerastertes Bild mit Inhalt', String(r.typ).startsWith('image/') && r.groesse > 200,
    JSON.stringify({ typ: r.typ, groesse: r.groesse }));
  gleich('Sie ist gleich gewählt, im Auswahl-Werkzeug', [r.gewaehlt, r.werkzeug], [1, 'select']);

  /* UND JETZT DAS, WORUM ES REDUR GING: schieben und ziehen. */
  const vorher = r.pts;
  await s.evaluate(`(() => {
    const b = Object.values(Store.cache.blocks).find(x => x.type === 'blatt' && x.alive);
    const m = b.marken[0];
    const kasten = InkGeometry.bounds(m);
    window.__kasten = { x: kasten.x, y: kasten.y, w: kasten.width, h: kasten.height };
  })()`);
  const box = JSON.parse(await s.evaluate(`JSON.stringify(window.__kasten)`) as string);
  /* Von der Mitte der Marke aus 60 Einheiten nach rechts ziehen. */
  const skala = kasten.width / 595.28;
  await s.mouse.move(kasten.x + (box.x + box.w / 2) * skala, kasten.y + (box.y + box.h / 2) * skala);
  await s.mouse.down();
  await s.mouse.move(kasten.x + (box.x + box.w / 2 + 60) * skala, kasten.y + (box.y + box.h / 2) * skala, { steps: 8 });
  await s.mouse.up();
  await s.waitForTimeout(500);
  const geschoben = JSON.parse(await s.evaluate(`(() => {
    const b = Object.values(Store.cache.blocks).find(x => x.type === 'blatt' && x.alive);
    return JSON.stringify(b.marken[0].pts);
  })()`) as string);
  p('Verschieben geht — die Marke ist nach rechts gewandert',
    geschoben[0][0] > vorher[0][0] + 20, JSON.stringify({ vorher: vorher[0], nachher: geschoben[0] }));
  p('… und gleich breit geblieben',
    Math.abs((geschoben[1][0] - geschoben[0][0]) - (vorher[1][0] - vorher[0][0])) < 1,
    JSON.stringify({ vorher, nachher: geschoben }));

  /* Und ziehen: am Eckgriff kleiner machen. */
  const kleiner = await s.evaluate(`(() => {
    const b = Object.values(Store.cache.blocks).find(x => x.type === 'blatt' && x.alive);
    const vor = b.marken[0].pts;
    const breitVor = vor[1][0] - vor[0][0];
    /* Über dieselbe Rechnung, die auch der Griff benutzt (§8). */
    const m = InkGeometry.scale(JSON.parse(JSON.stringify(b.marken[0])), vor[0][0], vor[0][1], 0.5, 0.5);
    const breitNach = m.pts[1][0] - m.pts[0][0];
    return JSON.stringify({ breitVor, breitNach });
  })()`);
  const masse = JSON.parse(kleiner as string);
  p('Skalieren rechnet die Marke wirklich kleiner',
    masse.breitNach < masse.breitVor * 0.6, JSON.stringify(masse));
  await s.close();
}

/* ═══ §5 Quellen ═══════════════════════════════════════════════════════════ */
console.log('\n§5 Quellen');
{
  const q = lies('src/bereiche/pdf/marken.ts');
  p('Eine Voreinstellung ist ein Farbsatz mit zwei Feldern mehr — kein zweiter Katalog',
    /type Farbsatz = \{ name: string; farben: string\[\]; stil\?: string; breite\?: number \}/.test(q)
    && !/zeichnen:voreinstellungen/.test(q));
  p('Der Stiftknopf wird an EINER Stelle beschriftet (`stiftZeigen`)',
    (q.match(/const stiftZeigen = /g) || []).length === 1
    && (q.match(/stiftZeigen\(/g) || []).length === 2);
  p('Die PDF geht über den vorhandenen Leser, nicht über einen eigenen',
    /PdfLeser\.oeffne\(new Uint8Array/.test(q) && /leser\.alsBild\(nr\)/.test(q));
  p('… und landet in derselben Ablage wie jedes Bild',
    /return await bildAblegen\(new File\(\[blob\]/.test(q));
  p('Der Wähler lässt GIF und PDF ausdrücklich zu',
    /accept = 'image\/\*,image\/gif,application\/pdf,\.pdf'/.test(q));
  p('Das erzeugte JS trägt beides',
    /pdfAlsBildmarke/.test(lies('quell/bereiche/pdf/marken.js'))
    && /stiftZeigen/.test(lies('quell/bereiche/pdf/marken.js')));
  gleich('Keine Seitenfehler', fehler, []);
}

await browser.close();
server.close();
console.log(`\n${ok}/${ok + weg} bestanden · ✗=${weg}`);
process.exit(weg ? 1 : 0);
