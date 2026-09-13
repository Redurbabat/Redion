/* Suite 502 — Eine Folie zu ZEIGEN darf sie nicht ändern
 * ============================================================================
 * O4 aus `AUFGABEN.md`: „Die Markenschicht wird der Folieneditor." Der erste
 * Blick auf eine eingelesene Präsentation im Editor (`bilder/o4-ist-editor.png`)
 * zeigte quer über der Titelfolie den Satz „Tippe etwas, oder drücke / für
 * Befehle". Beim Nachmessen war der Platzhalter das kleinere Übel.
 *
 *   §1 DAS ZEICHNEN SCHRIEB IN DEN SPEICHER. `Blatt.zeichne` legt für ein
 *      Blatt ohne Textkinder eine leere Zeile an — mit `Store.addBlock`, also
 *      als echten Block in `blocks`. Das ist E118 und für ein leeres Blatt
 *      Papier auch richtig: ohne die Zeile kann man darauf nur malen.
 *
 *      Eine eingelesene PowerPoint-Folie hat keine Textkinder — ihr Text
 *      liegt als MARKEN. Gemessen an einer Datei mit 27 Folien:
 *
 *          vor dem Öffnen   0 Kindblöcke
 *          nach dem Öffnen  27 Kindblöcke, alle `text` mit ""
 *
 *      27 Blöcke, die niemand angelegt hat, nur vom Hinsehen. Sie landen im
 *      Versionsverlauf, in der Sicherung, im Abgleich und in der Suche. Und
 *      sie sind es, die den Platzhalter auf die Folie legen: gemessen sass er
 *      auf (501, 462), die Titelmarke auf (502, 457).
 *
 *      Die Regel war zu weit gefasst, nicht falsch: ein Blatt MIT Marken ist
 *      nicht leer. Es trägt schon bearbeitbare Elemente — genau die, die der
 *      Textmarken-Knopf anlegt, und in PowerPoint ist ein Textkasten auch
 *      keine Absatzzeile. E118 bleibt für das leere Blatt, wie es war;
 *      `test192 §2a` misst das weiter.
 *
 *   §2 UND SIE GING ALS STAPEL BLÄTTER AUF, NICHT ALS FOLIENSATZ. Der
 *      Dokumentmodus kann Blatt-Blöcke längst — Miniaturleiste, EINE Folie
 *      gross, die Werkzeuge daneben (`documentsIn` in `document-mode.ts`
 *      nimmt `pdfseite` UND `blatt`). Er sprang nur nicht an: `active()`
 *      verlangt die Flagge `dokumentModus` am Seitenblock, und der
 *      `.pptx`-Einleser setzte sie nie. Vier Folien standen deshalb
 *      untereinander, jede mit eigener Werkzeugleiste.
 *      Derselbe Fund wie E397: „ein Weg, der das Ding anlegt, aber nicht
 *      öffnet." Der PDF-Weg setzt die Flagge seit jeher.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 * Alle drei wirklich gefahren, die Zahlen sind GEMESSEN (17 grün ist gesund;
 * §1 und §1b wurden bei 10 grün gemessen, bevor §2 dazukam):
 *   §1 → die Marken-Bedingung in `blatt.ts` wieder entfernen:
 *        10 grün  ->  8 grün, 2 rot — die 27 Blöcke sind zurück, und der
 *        Platzhalter liegt wieder auf (501, 462), also auf dem Titel.
 *   §1b → die Zeile GAR NICHT mehr anlegen (`if (false)`):
 *        10 grün  ->  8 grün, 2 rot — diesmal die anderen beiden: das leere
 *        Blatt hat kein Kind und nichts Beschreibbares mehr (E118).
 *        Der Lauf hält also beide Richtungen, nicht nur eine.
 *   §2 → `Store.updateBlock(seite.id, { dokumentModus: true })` aus dem
 *        `.pptx`-Zweig in `dateien/einlesen.ts` streichen:
 *        17 grün  ->  12 grün, 5 rot.
 *
 *   node pruefungen/lauf/test502.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
declare const Store: any;
declare const App: any;
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9612;
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
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, ist === soll, 'ist ' + JSON.stringify(ist) + ', soll ' + JSON.stringify(soll));

const browser = await chromium.launch();
const fehler: string[] = [];
const kontext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const seite = await kontext.newPage();
seite.on('pageerror', e => fehler.push(e.message));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForFunction('typeof Store !== "undefined" && typeof App !== "undefined"');
/* Der Willkommensdialog kommt wieder, solange die Seite noch baut — also
   klicken, bis er WIRKLICH weg ist. Der erste Entwurf fotografierte ihn. */
for (let versuch = 0; versuch < 8; versuch++) {
  await seite.evaluate(() => {
    document.querySelectorAll<HTMLElement>('#rg-willkommen [data-a="los"]').forEach(b => b.click());
  });
  await seite.waitForTimeout(250);
  if (!await seite.evaluate(() => !!document.querySelector('#rg-willkommen'))) break;
}
await seite.waitForTimeout(400);

/* ══ §1 ZEIGEN ÄNDERT NICHTS ═════════════════════════════════════════════ */
console.log('\n§1 27 Folien öffnen legt keine 27 Blöcke an');
{
  const gebaut = await seite.evaluate(() => {
    /* Gebaut wie der .pptx-Einleser baut: Text als MARKEN, keine Kindblöcke. */
    const s = Store.addPage(null, { text: 'Kapitel 4', icon: '📽️' });
    for (let n = 1; n <= 27; n++) {
      const b = Store.addBlock(s.id, 'blatt', {
        text: 'Folie ' + n, blattBreite: 960, blattHoehe: 540, papier: 'blanko' });
      Store.updateBlock(b.id, { marken: [
        { id: 't' + n, art: 'text', point: [60, 50], breiteBox: 840,
          text: 'Folie ' + n, fontSize: 30, fett: true }] });
    }
    /* Und DANEBEN ein leeres Blatt, wie es aus dem Slash-Menü kommt: keine
       Kinder UND keine Marken. Das muss seine Zeile weiterhin bekommen
       (E118) — sonst wäre es Papier, auf das man nur malen kann. */
    const leer = Store.addPage(null, { text: 'Leeres Blatt' });
    Store.addBlock(leer.id, 'blatt', { text: '', blattBreite: 595, blattHoehe: 842 });
    return { deck: s.id, leerSeite: leer.id,
      kinderVorher: Store.childrenOf(s.id)
        .reduce((n: number, b: any) => n + Store.childrenOf(b.id).length, 0) };
  });

  gleich('Vorher hat keine Folie ein Kind', gebaut.kinderVorher, 0);

  await seite.evaluate((sid: string) => App.oeffne(sid), gebaut.deck);
  await seite.waitForTimeout(2500);
  await seite.evaluate(() => {
    document.querySelectorAll<HTMLElement>('#rg-willkommen, .overlay').forEach(o => o.remove());
  });

  const nachher = await seite.evaluate((sid: string) => {
    const blaetter = Store.childrenOf(sid);
    return {
      kinder: blaetter.reduce((n: number, b: any) => n + Store.childrenOf(b.id).length, 0),
      markenNochDa: blaetter.every((b: any) => Array.isArray(b.marken) && b.marken.length === 1),
    };
  }, gebaut.deck);

  gleich('Nach dem Öffnen auch nicht', nachher.kinder, 0);
  p('Und die Marken stehen unverändert da', nachher.markenNochDa);

  /* ---- DER PLATZHALTER LIEGT NICHT AUF DER FOLIE --------------------------
     Gemessen wird die ÜBERSCHNEIDUNG, nicht das Vorhandensein: ein
     Platzhalter irgendwo auf der Seite wäre in Ordnung, einer auf dem Titel
     nicht. Der erste Entwurf zählte nur Elemente und wäre grün geblieben. */
  const ueberdeckt = await seite.evaluate(() => {
    const blatt = document.querySelector('.blatt-papier, .blatt, [class*="blatt"]');
    if (!blatt) return { blattDa: false, treffer: [] as string[] };
    const kasten = blatt.getBoundingClientRect();
    const schneidet = (r: DOMRect) =>
      r.width > 0 && r.height > 0 &&
      r.left < kasten.right && r.right > kasten.left &&
      r.top < kasten.bottom && r.bottom > kasten.top;
    const treffer = [...document.querySelectorAll<HTMLElement>('*')]
      .filter(e => !e.children.length &&
        (getComputedStyle(e, '::before').content || '').includes('Tippe'))
      .filter(e => schneidet(e.getBoundingClientRect()))
      .map(e => e.className + ' @ ' + Math.round(e.getBoundingClientRect().x) +
                ',' + Math.round(e.getBoundingClientRect().y));
    return { blattDa: true, treffer };
  });
  p('Ein Blatt ist im Bild', ueberdeckt.blattDa);
  gleich('Kein Platzhalter liegt auf der Folie', ueberdeckt.treffer.length, 0);
  if (ueberdeckt.treffer.length) console.log('      → ' + ueberdeckt.treffer.join(' | '));

  /* ---- UND DIE FOLIE BLEIBT BEARBEITBAR ----------------------------------
     Die Gefahr bei dieser Reparatur ist nicht, dass zu wenig entsteht,
     sondern dass die Folie zu einer toten Fläche wird. Also wird gemessen,
     dass die Zeichenschicht da ist und den Textkasten-Knopf hat. */
  const bedienbar = await seite.evaluate(() => ({
    schicht: document.querySelectorAll('.blatt-marken').length,
    textKnopf: !!document.querySelector('[data-wz="text"], [data-tool="text"], button[title*="Text"]'),
    markenKnoten: document.querySelectorAll('.blatt-marken [data-ink-art="text"]').length,
  }));
  p('Die Zeichenschicht ist da', bedienbar.schicht > 0, String(bedienbar.schicht));
  p('Die Textmarken der Folie sind gezeichnet', bedienbar.markenKnoten > 0,
    String(bedienbar.markenKnoten));

  /* ---- DAS LEERE BLATT BEHÄLT SEINE ZEILE (E118) -------------------------- */
  await seite.evaluate((sid: string) => App.oeffne(sid), gebaut.leerSeite);
  await seite.waitForTimeout(1200);
  const leer = await seite.evaluate((sid: string) => {
    const blatt = Store.childrenOf(sid)[0];
    return {
      kinder: Store.childrenOf(blatt.id).length,
      schreibbar: document.querySelectorAll('.blatt-inhalt [contenteditable="true"]').length,
    };
  }, gebaut.leerSeite);
  gleich('Ein leeres Blatt bekommt weiterhin seine Zeile (E118)', leer.kinder, 1);
  p('… und die ist beschreibbar', leer.schreibbar > 0, String(leer.schreibbar));
}

/* ══ §2 EINE EINGELESENE PRÄSENTATION IST EIN FOLIENSATZ ═════════════════ */
console.log('\n§2 Eine eingelesene .pptx geht als Foliensatz auf');
{
  const erg = await seite.evaluate(async () => {
    /* Eine ECHTE, kleine .pptx mit drei Folien — mit Redions eigenem
       ZIP-Schreiber gebaut, damit der Weg der ist, den ein Mensch geht. */
    const ns = 'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" ' +
               'xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" ' +
               'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"';
    const folie = (titel: string) =>
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sld ${ns}><p:cSld><p:spTree>` +
      '<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/>' +
      '<p:sp><p:nvSpPr><p:cNvPr id="2" name="T"/><p:cNvSpPr/><p:nvPr><p:ph type="title"/></p:nvPr></p:nvSpPr>' +
      '<p:spPr><a:xfrm><a:off x="457200" y="457200"/><a:ext cx="5486400" cy="914400"/></a:xfrm></p:spPr>' +
      `<p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr sz="2800"/><a:t>${titel}</a:t></a:r></a:p></p:txBody>` +
      '</p:sp></p:spTree></p:cSld></p:sld>';
    const teile: any[] = [
      { name: '[Content_Types].xml', inhalt: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
        '<Default Extension="xml" ContentType="application/xml"/></Types>' },
      { name: '_rels/.rels', inhalt: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/></Relationships>' },
      { name: 'ppt/presentation.xml', inhalt:
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:presentation ${ns}>` +
        '<p:sldIdLst><p:sldId id="256" r:id="rId1"/><p:sldId id="257" r:id="rId2"/>' +
        '<p:sldId id="258" r:id="rId3"/></p:sldIdLst>' +
        '<p:sldSz cx="9144000" cy="5143500"/></p:presentation>' },
      { name: 'ppt/_rels/presentation.xml.rels', inhalt:
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide1.xml"/>' +
        '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide2.xml"/>' +
        '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide3.xml"/></Relationships>' },
    ];
    ['Titel', 'Aufgabe', 'Lösung'].forEach((t, i) =>
      teile.push({ name: 'ppt/slides/slide' + (i + 1) + '.xml', inhalt: folie(t) }));

    const blob = await (globalThis as any).Austausch.zipSchreiben(teile);
    const r = await (globalThis as any).Einlesen.datei(
      new File([blob], 'Vortrag.pptx',
        { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' }));
    const p2 = Store.getBlock(r.seite.id);
    return { seiteId: r.seite.id, dokumentModus: !!p2.dokumentModus,
             blaetter: Store.childrenOf(r.seite.id).filter((b: any) => b.type === 'blatt').length };
  });

  p('Die Seite ist als Foliensatz markiert', erg.dokumentModus);
  gleich('Drei Folien sind angekommen', erg.blaetter, 3);

  await seite.evaluate((sid: string) => App.oeffne(sid), erg.seiteId);
  await seite.waitForTimeout(2000);
  await seite.evaluate(() => {
    document.querySelectorAll<HTMLElement>('#rg-willkommen, .overlay').forEach(o => o.remove());
  });

  const bild = await seite.evaluate(() => {
    /* GEMESSEN WIRD, WAS MAN SIEHT — und zwar SICHTBAR, nicht als Knoten.
       Der erste Entwurf zählte `.blatt-werk` im DOM und bekam 3; sichtbar
       ist genau eine, die anderen zwei sind verborgen. Eine Prüfung, die
       Knoten zählt statt Höhen zu messen, hätte hier das Falsche gemeldet. */
    const leistenAlle = document.querySelectorAll('.blatt-werk').length;
    const leistenSichtbar = [...document.querySelectorAll<HTMLElement>('.blatt-werk')]
      .filter(e => e.getBoundingClientRect().height > 0).length;
    const knopftexte = [...document.querySelectorAll('button, a')]
      .map(b => (b.textContent || '').trim());
    const blatt = document.querySelector('.blatt-papier')?.getBoundingClientRect();
    return {
      leistenAlle, leistenSichtbar,
      seitenliste: knopftexte.some(t => /^▤\s*Seiten$/.test(t)),
      vortragen:   knopftexte.some(t => /Präsentieren/.test(t)),
      drucken:     knopftexte.some(t => /^Drucken$/.test(t)),
      folienmass:  blatt ? +(blatt.width / blatt.height).toFixed(2) : 0,
    };
  });

  p('Nur EINE Werkzeugleiste ist sichtbar, nicht je Folie eine',
    bild.leistenSichtbar === 1, bild.leistenSichtbar + ' von ' + bild.leistenAlle);
  p('Die Folienliste ist erreichbar („▤ Seiten")', bild.seitenliste);
  p('„Präsentieren" steht bereit', bild.vortragen);
  p('Und „Drucken" auch', bild.drucken);
  p('Die Folie behält ihr 16:9', Math.abs(bild.folienmass - 16 / 9) < 0.05,
    String(bild.folienmass));

  /* WAS HIER AUSDRÜCKLICH NICHT GEPRÜFT WIRD (§35): dass EINE Folie allein
     im Bild steht. Der Dokumentmodus rollt durch — das ist seine Bauart,
     und für das Schreiben ist sie richtig. „Eine Folie, dann die nächste"
     macht der Vortragsmodus (E544). Ein Folieneditor mit stehender Folie
     wäre ein eigener Bogen und steht so in AUFGABEN.md unter O4. */
}

p('Keine Browserfehler', fehler.length === 0, fehler.join(' | '));

await kontext.close();
await browser.close();
server.close();
console.log(`\nSuite 502: ${ok} grün` + (weg ? `, ${weg} rot` : '') + '.');
process.exit(weg ? 1 : 0);
