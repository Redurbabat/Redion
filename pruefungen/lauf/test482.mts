/* Suite 482 — L139: „eine neue PDF kopiert die aktuelle" (E516)
 * ============================================================================
 * Redur, 8. September:
 *
 *   „und wenn ich oben eine neu pdf einfügen woll kopiert es immer die
 *    aktuele pdf wieos lösche das problem"
 *
 * E513 hat drei Wege gemessen und alle drei sauber gefunden: der Importeur
 * selbst, der Kopfknopf und das „+". Der Fehler blieb trotzdem stehen —
 * als L139, nicht gefunden.
 *
 * ER LAG NICHT IM IMPORT. Er lag darin, dass „oben" ZWEIMAL dasselbe Wort
 * trägt: der Kopfknopf heisst „PDF öffnen" und liest eine neue Datei ein;
 * die Karte „Weiterarbeiten" im Regal heisst AUCH „PDF öffnen" und macht
 * das Gegenteil — sie holt die zuletzt geöffnete PDF zurück. Wer die Karte
 * trifft, bekommt jedes Mal seine aktuelle PDF, und zwar völlig korrekt.
 *
 *   §1 ZWEI KNÖPFE, EIN WORT: kein zweiter Bedienknopf trägt die Worte des
 *      Importeurs. Das ist die Zusage, die den Fehler hält.
 *   §2 DER KOPFKNOPF BLEIBT, WAS ER IST — auch nach einem Import. Er hiess
 *      danach „PDF importieren" und hatte sein gezeichnetes Zeichen
 *      verloren, weil `textContent` die Kindknoten wegwirft (E515).
 *   §3 DER VIERTE WEG, den E513 nicht öffnen konnte: „PDF hier einfügen"
 *      im Seitenmenü des Dokuments. Er fügt MIT ABSICHT ins offene
 *      Dokument ein — geprüft wird, dass die neuen Seiten aus der NEUEN
 *      Datei kommen und die alten unberührt bleiben.
 *   §4 QUELLEN.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 *   §1 → die Karte wieder „PDF öffnen" nennen: die erste Zusage.
 *   §2 → `textContent` statt des Label-Feldes: zwei Zusagen.
 *   §3 → `anStelle` weglassen: die Seiten landen am Ende statt an der Stelle.
 *
 *   node pruefungen/lauf/test482.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import type { Page } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9602;
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
await new Promise<void>(f => server.listen(PORT, f));

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

/* ── EIN ECHTES PDF, aus zwei Objekten je Seite. Dieselbe Bauart wie in
      `test177`; sie ist klein genug, dass pdf.js sie ohne Umweg liest, und
      echt genug, dass sie durch denselben Weg geht wie Redurs Prüfungen. */
const machPdf = (seiten: string[]): Buffer => {
  const objekte: Buffer[] = [];
  const neu = (inhalt: Buffer | string): number => {
    objekte.push(Buffer.isBuffer(inhalt) ? inhalt : Buffer.from(inhalt, 'latin1'));
    return objekte.length;
  };
  const seitenNr = neu('');
  const schrift = neu('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  const kids: number[] = [];
  for (const titel of seiten) {
    const roh = Buffer.from(`BT /F1 36 Tf 60 700 Td (${titel}) Tj ET\n2 w 30 30 535 782 re S`, 'latin1');
    const inhalt = neu(Buffer.concat([
      Buffer.from(`<< /Length ${roh.length} >>\nstream\n`, 'latin1'), roh,
      Buffer.from('\nendstream', 'latin1')]));
    kids.push(neu('<< /Type /Page /Parent 1 0 R /MediaBox [0 0 595 842] ' +
      `/Resources << /Font << /F1 ${schrift} 0 R >> >> /Contents ${inhalt} 0 R >>`));
  }
  objekte[seitenNr - 1] = Buffer.from(
    `<< /Type /Pages /Count ${kids.length} /Kids [${kids.map(k => k + ' 0 R').join(' ')}] >>`, 'latin1');
  const wurzel = neu(`<< /Type /Catalog /Pages ${seitenNr} 0 R >>`);
  let aus = Buffer.from('%PDF-1.4\n', 'latin1');
  const stellen: number[] = [];
  objekte.forEach((o, i) => {
    stellen.push(aus.length);
    aus = Buffer.concat([aus, Buffer.from(`${i + 1} 0 obj\n`, 'latin1'), o,
                         Buffer.from('\nendobj\n', 'latin1')]);
  });
  const xref = aus.length;
  let tab = `xref\n0 ${objekte.length + 1}\n0000000000 65535 f \n`;
  stellen.forEach(s => { tab += String(s).padStart(10, '0') + ' 00000 n \n'; });
  tab += `trailer\n<< /Size ${objekte.length + 1} /Root ${wurzel} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.concat([aus, Buffer.from(tab, 'latin1')]);
};
const ERSTE = machPdf(['Alt A', 'Alt B']);
const ZWEITE = machPdf(['Neu C', 'Neu D', 'Neu E']);
const ablage = path.join(WURZEL, 'pruefungen', '.tmp-482');
fs.mkdirSync(ablage, { recursive: true });
const pfadErste = path.join(ablage, 'erste.pdf');
const pfadZweite = path.join(ablage, 'zweite.pdf');
fs.writeFileSync(pfadErste, ERSTE);
fs.writeFileSync(pfadZweite, ZWEITE);

const frisch = async (): Promise<Page> => {
  const s = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  s.on('pageerror', e => fehler.push(e.message.slice(0, 140)));
  await s.goto(`http://localhost:${PORT}/index.html`);
  await s.waitForFunction("typeof App !== 'undefined' && typeof Bibliothek !== 'undefined'");
  await s.evaluate(async () => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelector('.produkt-onboarding-lage')?.remove();
    document.getElementById('rg-willkommen')?.remove();
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    await Store.flush();
  });
  await s.waitForTimeout(400);
  return s;
};

/* ══ §1 Zwei Knöpfe, ein Wort ══════════════════════════════════════════════
 *
 * DAS IST DER FUND. Der Kopfknopf liest eine neue PDF ein. Die Karte
 * „Weiterarbeiten" holt die zuletzt geöffnete zurück. Beide trugen
 * WORTGLEICH „PDF öffnen", und sie stehen beide oben.
 *
 * Gemessen wird der sichtbare Text jedes Bedienknopfes, nicht der Quelltext:
 * ein Wort, das im Quelltext an zwei Stellen steht, ist harmlos, solange
 * der Mensch es nur einmal sieht.
 * ------------------------------------------------------------------------ */
console.log('\n§1 Zwei Knöpfe, ein Wort — der Fund hinter L139');
{
  const s = await frisch();
  /* Ein PDF-Dokument anlegen und öffnen, damit die Karte „Weiterarbeiten"
     überhaupt erscheint: sie steht nur bei einer zuletzt geöffneten PDF. */
  await s.evaluate(async () => {
    const seite = Store.addPage(null, { text: 'Alte Akte' });
    Store.addBlock(seite.id, 'pdfseite', { text: '', nr: 1, bw: 595, bh: 842 });
    Store.updateBlock(seite.id, { zuletztGeoeffnet: new Date().toISOString() });
    await Store.flush();
    Bibliothek.oeffne();
    await new Promise(f => setTimeout(f, 700));
  });
  await s.waitForTimeout(500);
  const r = JSON.parse(await s.evaluate(`(() => {
    const sichtbar = (e) => e.getClientRects().length > 0;
    const knoepfe = [...document.querySelectorAll('button')].filter(sichtbar);
    const wort = (e) => (e.textContent || '').replace(/\\s+/g, ' ').trim();
    const treffer = knoepfe.filter(k => /^PDF öffnen/i.test(wort(k)))
      .map(k => ({ id: k.id || '', wort: wort(k),
                   was: k.dataset.studioWeiter ? 'holt die letzte PDF'
                      : k.hasAttribute('data-studio-import') ? 'liest eine neue ein' : '?' }));
    const karte = document.querySelector('.bib-studio-weiter button');
    const kopf = document.getElementById('studio-import');
    return JSON.stringify({
      treffer,
      karteDa: !!karte, karteWort: karte ? wort(karte) : null,
      kopfDa: !!kopf, kopfWort: kopf ? wort(kopf) : null
    });
  })()`) as string) as { treffer: Array<{ id: string; wort: string; was: string }>;
                         karteDa: boolean; karteWort: string | null;
                         kopfDa: boolean; kopfWort: string | null };

  p('Die Karte „Weiterarbeiten" steht da', r.karteDa, JSON.stringify(r));
  p('Der Kopfknopf steht da', r.kopfDa, JSON.stringify(r.kopfWort));
  /* DIE ZUSAGE: höchstens EIN sichtbarer Knopf beginnt mit „PDF öffnen". */
  p('Nur EIN sichtbarer Knopf heisst „PDF öffnen"',
    r.treffer.length <= 1, JSON.stringify(r.treffer));
  p('… und wenn es einer ist, dann der, der wirklich eine neue PDF einliest',
    r.treffer.length === 0 || r.treffer[0]!.was === 'liest eine neue ein',
    JSON.stringify(r.treffer));
  p('Die Karte sagt, dass sie ZURÜCK führt, nicht dass sie öffnet',
    !!r.karteWort && /weiterlesen|weiter lesen|fortsetzen/i.test(r.karteWort),
    JSON.stringify(r.karteWort));
  await s.close();
}

/* ══ §2 Der Kopfknopf bleibt, was er ist ═══════════════════════════════════
 *
 * `pdfImportieren` schrieb `button.textContent = 'PDF wird importiert …'`
 * und danach `= 'PDF importieren'`. Zwei Fehler in einer Zeile:
 *
 *   · `textContent` wirft die KINDKNOTEN weg — und seit E515 hängt dort
 *     das gezeichnete Zeichen. Nach dem ersten Import stand der Knopf ohne
 *     Zeichen da, für den Rest der Sitzung.
 *   · Der Knopf hiess danach anders als vorher. Ein Knopf, der seinen
 *     Namen wechselt, weil man ihn einmal gedrückt hat, ist ein anderer
 *     Knopf.
 * ------------------------------------------------------------------------ */
console.log('\n§2 Der Kopfknopf bleibt, was er ist');
{
  const s = await frisch();
  await s.evaluate(async () => { Bibliothek.oeffne(); await new Promise(f => setTimeout(f, 600)); });
  await s.waitForTimeout(400);
  /* GEMESSEN WIRD DER SICHTBARE KNOPF, nicht der im Kopf. Im Regal
     versteckt `studio.css` den Kopfknopf hinter dem eigenen des Regals
     (`body:has(#page .bib-studio-import) #studio-import`) — es ist immer
     genau EINER da, und das ist der, den ein Mensch trifft. Der erste Wurf
     dieser Suite klickte auf den versteckten und wartete dreissig Sekunden
     auf einen Dateiwähler, der nie kam. */
  const vorher = JSON.parse(await s.evaluate(`(() => {
    const alle = [...document.querySelectorAll('[data-studio-import]')];
    const k = alle.find(x => x.getClientRects().length > 0);
    return JSON.stringify({ da: !!k, wieViele: alle.length,
      wort: k ? (k.textContent || '').replace(/\\s+/g,' ').trim() : null,
      zeichen: !!(k && k.querySelector('[data-sym] svg')) });
  })()`) as string) as { da: boolean; wieViele: number; wort: string | null; zeichen: boolean };
  p('Ein sichtbarer Importknopf steht da', vorher.da, JSON.stringify(vorher));
  gleich('… und er heisst wie der im Kopf', vorher.wort, 'PDF öffnen');
  p('… und trägt sein gezeichnetes Zeichen (E515)',
    vorher.zeichen, JSON.stringify(vorher));

  /* WIRKLICH EINLESEN, nicht simulieren: der Wähler, den `pdfImportieren`
     anlegt, bekommt die Datei über `setInputFiles`. */
  const [waehler] = await Promise.all([
    s.waitForEvent('filechooser'),
    s.evaluate(`(() => {
      [...document.querySelectorAll('[data-studio-import]')]
        .find(x => x.getClientRects().length > 0).click();
    })()`)
  ]);
  await waehler.setFiles(pfadZweite);
  await s.waitForFunction("Object.values(Store.cache.blocks).filter(b => b.type === 'pdfseite' && b.alive !== false).length === 3", null, { timeout: 40000 });
  await s.waitForTimeout(1200);
  const nachher = JSON.parse(await s.evaluate(`(() => {
    const alle = [...document.querySelectorAll('[data-studio-import]')];
    const k = alle.find(x => x.getClientRects().length > 0) || alle[0];
    return JSON.stringify({ wort: k ? (k.textContent || '').replace(/\\s+/g,' ').trim() : null,
      zeichen: !!(k && k.querySelector('[data-sym] svg')),
      /* UND DER KOPFKNOPF, der beim Import mitbeschriftet wird, obwohl er
         gerade nicht zu sehen ist: er steht fest in der Startseite und wird
         nie neu gezeichnet. Genau dort blieb der Schaden liegen. */
      kopfWort: (() => { const h = document.getElementById('studio-import');
        return h ? (h.textContent || '').replace(/\\s+/g,' ').trim() : null; })(),
      kopfZeichen: !!document.querySelector('#studio-import [data-sym] svg'),
      seiten: Object.values(Store.cache.blocks).filter(b => b.type === 'pdfseite' && b.alive !== false).length });
  })()`) as string) as { wort: string | null; zeichen: boolean;
                         kopfWort: string | null; kopfZeichen: boolean; seiten: number };
  gleich('Nach dem Import heisst er noch genauso', nachher.wort, vorher.wort);
  p('… und hat sein Zeichen noch', nachher.zeichen, JSON.stringify(nachher));
  gleich('Auch der Kopfknopf heisst noch, wie er hiess', nachher.kopfWort, 'PDF öffnen');
  p('… und hat sein Zeichen noch — er wird nie neu gezeichnet',
    nachher.kopfZeichen, JSON.stringify(nachher));
  gleich('Die drei Seiten der neuen PDF sind da', nachher.seiten, 3);
  await s.close();
}

/* ══ §3 Der vierte Weg: „PDF hier einfügen" ════════════════════════════════
 *
 * DEN KONNTE E513 NICHT ÖFFNEN, und er blieb als einziger Kandidat stehen.
 * Er fügt MIT ABSICHT in das offene Dokument ein — geprüft wird deshalb
 * nicht, dass er ein neues Dokument macht, sondern dass die neuen Seiten
 * aus der NEUEN Datei kommen und die alten unberührt bleiben.
 * ------------------------------------------------------------------------ */
console.log('\n§3 Der vierte Weg — „PDF hier einfügen" im Seitenmenü');
{
  const s = await frisch();
  /* Die erste Akte über den Kopfknopf einlesen — der Weg eines Menschen. */
  const [w1] = await Promise.all([s.waitForEvent('filechooser'), s.evaluate(async () => {
    Bibliothek.oeffne(); await new Promise(f => setTimeout(f, 500));
    (document.getElementById('studio-import') as HTMLButtonElement).click();
  })]);
  await w1.setFiles(pfadErste);
  await s.waitForFunction("Object.values(Store.cache.blocks).filter(b => b.type === 'pdfseite' && b.alive !== false).length === 2", null, { timeout: 40000 });
  await s.waitForTimeout(900);

  const vorher = JSON.parse(await s.evaluate(`(() => {
    const seiten = Object.values(Store.cache.blocks).filter(b => b.type === 'pdfseite' && b.alive !== false);
    return JSON.stringify({ n: seiten.length,
      quellen: [...new Set(seiten.map(b => b.quelleId))].length,
      texte: seiten.map(b => String(b.suchtext || '').trim().slice(0, 6)) });
  })()`) as string) as { n: number; quellen: number; texte: string[] };
  gleich('Die erste Akte liegt mit zwei Seiten da', vorher.n, 2);
  p('… beide aus EINER Quelle', vorher.quellen === 1, JSON.stringify(vorher));

  /* JETZT DER VIERTE WEG — und zwar über den KNOPF, nicht über die
     Funktion dahinter. Genau das ist E513 nicht gelungen: der Knopf sitzt
     im Inspector, und der ist zu, solange ihn niemand aufmacht. Ohne diesen
     einen Klick war der Weg unerreichbar und blieb der einzige offene
     Verdächtige von L139. */
  await s.evaluate(`(() => {
    const auf = document.querySelector('[data-document-action="inspector"]');
    if (auf) auf.click();
  })()`);
  await s.waitForTimeout(700);
  const knopfDa = await s.evaluate(`(() => {
    const k = document.querySelector('[data-document-action="page-add-pdf"]');
    return !!k && k.getClientRects().length > 0 && !k.disabled;
  })()`) as boolean;
  p('Der Knopf „PDF hier einfügen" ist im Inspector wirklich zu treffen',
    knopfDa, 'nicht sichtbar oder gesperrt');

  const [w2] = await Promise.all([
    s.waitForEvent('filechooser'),
    s.click('[data-document-action="page-add-pdf"]')
  ]);
  await w2.setFiles(pfadZweite);
  await s.waitForFunction("Object.values(Store.cache.blocks).filter(b => b.type === 'pdfseite' && b.alive !== false).length === 5", null, { timeout: 40000 });
  await s.waitForTimeout(900);

  const nachher = JSON.parse(await s.evaluate(`(() => {
    const alle = Object.values(Store.cache.blocks).filter(b => b.type === 'pdfseite' && b.alive !== false);
    const eltern = alle[0].parentId;
    const reihe = (Store.getBlock(eltern).content || [])
      .map(id => Store.getBlock(id)).filter(b => b && b.type === 'pdfseite' && b.alive !== false);
    return JSON.stringify({
      n: alle.length,
      quellen: [...new Set(alle.map(b => b.quelleId))].length,
      bilder: [...new Set(alle.map(b => b.bildDateiId).filter(Boolean))].length,
      reihe: reihe.map(b => String(b.suchtext || '').replace(/\\s+/g,'').slice(0, 5))
    });
  })()`) as string) as { n: number; quellen: number; bilder: number; reihe: string[] };

  gleich('Fünf Seiten: zwei alte, drei neue', nachher.n, 5);
  gleich('ZWEI Quellen — die neue Datei ist eine eigene', nachher.quellen, 2);
  gleich('Fünf verschiedene Seitenbilder, keins doppelt', nachher.bilder, 5);
  /* DER KERN VON REDURS SATZ: steht nach dem Einfügen wirklich die NEUE
     PDF da, oder noch einmal die alte? Der Text der Seiten sagt es. */
  gleich('Die neuen Seiten tragen den Text der NEUEN Datei',
    nachher.reihe, ['AltA', 'NeuC', 'NeuD', 'NeuE', 'AltB']);
  await s.close();
}

/* ══ §4 Quellen ════════════════════════════════════════════════════════════ */
console.log('\n§4 Quellen');
{
  const bib = lies('src/bereiche/wissen/bibliothek.ts');
  /* DIE ZUSAGE IST NICHT „textContent kommt nicht vor" — die Beschriftung
     braucht ihn als Rückfall für einen Knopf ohne Wortfeld. Sie ist: der
     IMPORTEUR selbst fasst keine Beschriftung mehr an. Er reicht sie an die
     eine Stelle weiter, die weiss, wohin das Wort gehört.
     Gemessen am Rumpf der Funktion, von ihrem Namen bis zu ihrem letzten
     Befehl — nicht mit einem Muster über die ganze Datei, das beim ersten
     Wurf die Beschriftung selbst mit einfing. */
  const von = bib.indexOf('const pdfImportieren = ()');
  const bis = bib.indexOf('eingabe.click();', von);
  const rumpf = von >= 0 && bis > von ? bib.slice(von, bis) : '';
  p('Der Rumpf des Importeurs ist gefunden', rumpf.length > 400, String(rumpf.length));
  p('… und er schreibt nirgends selbst in einen Knopftext',
    !/textContent/.test(rumpf), 'textContent steht noch darin');
  p('… sondern ruft die eine Beschriftung, zweimal: laufend und fertig',
    (rumpf.match(/importBeschriften\(/g) || []).length === 2,
    JSON.stringify((rumpf.match(/importBeschriften\(/g) || []).length));
  p('Das Wort steht EINMAL da, als Konstante (§8)',
    (bib.match(/const IMPORT_WORT = 'PDF öffnen';/g) || []).length === 1
    && (bib.match(/const importBeschriften/g) || []).length === 1);
  p('Die Karte „Weiterarbeiten" trägt ein eigenes Wort',
    /data-studio-weiter="' \+ esc\(letzte\.id\) \+ '">Weiterlesen/.test(bib));
  p('Der Kopfknopf im HTML heisst weiterhin „PDF öffnen"',
    /id="studio-import"[^>]*>[\s\S]{0,120}PDF öffnen/.test(lies('index.html')));
  p('Das erzeugte JS trägt beides',
    /Weiterlesen/.test(lies('quell/bereiche/wissen/bibliothek.js')));
  p('Keine Seitenfehler', fehler.length === 0, fehler.slice(0, 3).join(' | '));
}

fs.rmSync(ablage, { recursive: true, force: true });
console.log(`\n${ok}/${ok + weg} bestanden · ✗=${weg}`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
