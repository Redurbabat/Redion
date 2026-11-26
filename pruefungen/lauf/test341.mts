/* Suite 341 — Der Start zeigt, wo man war: die PDF, sonst das Regal (E349)
 * ============================================================================
 * Redur: „wenn ich die App öffne, es sollte wie GoodNotes immer die zuletzt
 * geöffnete PDF öffnen, oder wenn nichts geöffnet ist, bei dem Dokument-Teil".
 *
 * E236 hat das versprochen und test67 §12 misst seither zwei Fälle. Beim
 * Nachmessen für E349 blieben vier Löcher, die kein Lauf sah:
 *
 *   · Das Regal hielt genau EINEN Start. Kam es, öffnete der Start davor
 *     die erste Wurzelseite, und `oeffne()` schrieb sie als `letzte` —
 *     der nächste Start zeigte „Willkommen".
 *   · `#dokumente` steht nach jedem Regalbesuch in der Adresse; beim
 *     Neuladen galt es als Seitenkennung und schaltete die Startansicht ab.
 *   · Eine Seite im Papierkorb ging beim Start wieder auf.
 *   · Das Onboarding setzte die Startansicht ungefragt auf „Heute" oder
 *     „Workspace" — wer es durchlief, sah nie mehr seine PDF beim Start.
 *
 * Und eines, das GoodNotes ausmacht: das Dokument öffnet auf der Seite, auf
 * der man es verlassen hat, nicht auf Seite 1.
 *
 *   §1  DIE PDF KOMMT ZURÜCK, ohne Adresse, in der Dokumentansicht, auf der
 *       zuletzt angesehenen Seite.
 *   §2  DAS REGAL BLEIBT DAS REGAL — auch beim zweiten Start; `letzte` und
 *       der Aufrufzähler der ersten Seite bleiben unberührt.
 *   §3  `#dokumente` IN DER ADRESSE ist ein Ort, kein Ziel.
 *   §4  EINE SEITE IM PAPIERKORB ist kein Ort zum Weiterarbeiten.
 *   §5  DIE ALTE STARTANSICHT „Heute" fällt einmal auf „Dokument" zurück;
 *       neu gewählt bleibt sie.
 *   §6  DAS NOTIZHEFTE-REGAL kommt zurück, wenn man dort war.
 *   §7  AM TELEFON gilt dasselbe.
 *   §8  DAS ONBOARDING schreibt keine Startansicht mehr.
 *
 *   node pruefungen/lauf/test341.mts
 * ==========================================================================*/
declare const Store: any; declare const App: any; declare const Dateien: any;
declare const Bibliothek: any; declare const Notebook: any;
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9345;

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll),
    `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

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

const kontext = async (geraet: 'rechner' | 'telefon') => {
  const handy = geraet === 'telefon';
  const ktx = await browser.newContext({
    viewport: handy ? { width: 390, height: 844 } : { width: 1280, height: 900 },
    isMobile: handy, hasTouch: handy, deviceScaleFactor: 1
  });
  const pg = await ktx.newPage();
  pg.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 160)));
  pg.on('dialog', d => d.dismiss().catch(() => {}));
  return { ktx, pg };
};

/** Die App laden — mit oder ohne Hash — und die Begrüssungen wegräumen. */
const laden = async (pg: Seite, hash = ''): Promise<void> => {
  /* ERST WEG, DANN HIN: von `index.html#a` nach `index.html#b` ist für den
     Browser nur ein Sprung im selben Dokument — die App startet dann NICHT
     neu, und der Punkt misst den alten Zustand. Über about:blank wird jede
     Fahrt ein echter Start. */
  await pg.goto('about:blank');
  await pg.goto(`http://localhost:${PORT}/index.html${hash}`);
  await pg.waitForTimeout(2800);
  await pg.evaluate(() => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelector('.produkt-onboarding-lage')?.remove();
    document.getElementById('rg-willkommen')?.remove();
    document.getElementById('rg-einladung')?.remove();
  });
  await pg.waitForTimeout(200);
};

/** Ein PDF-Dokument mit drei Seiten, wie `bilder.mts` es baut: pdfseite-
    Blöcke mit Seitenbildern und `dokumentModus`. Öffnet es und gibt die
    Kennung zurück. */
const pdfAnlegen = (pg: Seite): Promise<string> => pg.evaluate(async () => {
  const blatt = async (nr: number): Promise<Blob> => {
    const c = document.createElement('canvas'); c.width = 595; c.height = 842;
    const g = c.getContext('2d')!;
    g.fillStyle = '#fdfdfb'; g.fillRect(0, 0, 595, 842);
    g.fillStyle = '#1c1c1c'; g.font = '600 30px sans-serif';
    g.fillText('Skript Seite ' + nr, 56, 96);
    return await new Promise<Blob>(f => c.toBlob(b => f(b as Blob), 'image/png'));
  };
  const seite = Store.addPage(null, { text: 'Elektrotechnik Skript', icon: '📕' });
  for (let nr = 1; nr <= 3; nr++) {
    const block = Store.addBlock(seite.id, 'pdfseite', {
      text: '', suchtext: 'Skript', nr, vonSeiten: 3, bw: 595, bh: 842, quelleId: 'q-341'
    });
    const satz = await Dateien.ablegen(
      new File([await blatt(nr)], 'skript-' + nr + '.png', { type: 'image/png' }),
      { blockId: block.id, abgeleitet: true });
    Store.updateBlock(block.id, { bildDateiId: satz.id });
  }
  Store.updateBlock(seite.id, { dokumentModus: true });
  await Store.flush();
  App.oeffne(seite.id);
  await new Promise(f => setTimeout(f, 900));
  return seite.id as string;
});

type Zustand = {
  regal: boolean; dokument: boolean; notizhefte: boolean; position: string;
  hash: string; letzte: unknown; ort: unknown; titel: string; aufrufeErste: number;
  startAnsicht: unknown; marke: unknown;
};
const zustand = (pg: Seite): Promise<Zustand> => pg.evaluate(() => {
  /* E828: seit Workspace 2.0 ist die Seitenzahl ein Knopf
     (`button.document-position`, ein Druck springt) — kein `span` mehr. */
  const pos = [...document.querySelectorAll('.document-page :is(span, .document-position)')]
    .map(e => (e.textContent || '').trim()).find(t => /^Seite \d+\/\d+$/.test(t)) || '';
  const erste = Store.rootPages()[0] || {};
  return {
    regal: !!document.querySelector('.bib-gitter'),
    dokument: !!document.querySelector('.document-page'),
    notizhefte: !!document.querySelector('.nh-regal'),
    position: pos,
    hash: location.hash,
    letzte: Store.getMeta('letzte'),
    ort: Store.getMeta('zuletztOrt'),
    titel: document.title,
    aufrufeErste: Number(erste.aufrufe || 0),
    startAnsicht: Store.getMeta('startAnsicht'),
    marke: Store.getMeta('startAnsichtE349'),
  };
});

const flush = (pg: Seite) => pg.evaluate(async () => { await Store.flush(); });

/* ======================================================================== */
console.log('\n1 · Die PDF kommt zurück — ohne Adresse, in der Dokumentansicht, auf der zuletzt angesehenen Seite');
{
  const { ktx, pg } = await kontext('rechner');
  await laden(pg);
  const id = await pdfAnlegen(pg);
  let z = await zustand(pg);
  p('Vorbereitung: die PDF ist offen und in der Dokumentansicht', z.dokument && z.hash === '#' + id, JSON.stringify(z));
  gleich('Vorbereitung: sie beginnt auf Seite 1', z.position, 'Seite 1/3');
  /* Zwei Seiten weiter, über die echten Knöpfe der Werkzeugzeile. SEIT E464
     stehen ‹ › hinter dem Ansicht-Knopf (`data-document-view`), und die
     Klappe geht nach jedem Sprung wieder zu (sie schliesst beim Rollen).
     Also vor JEDEM Klick aufklappen, wie ein Mensch es tut. */
  const ansichtAuf = () => pg.evaluate(() => {
    const w = document.querySelector<HTMLElement>('.document-workspace');
    if (w && w.dataset.documentView !== 'open')
      document.querySelector<HTMLElement>('[data-document-action="view"]')?.click();
  });
  for (let i = 0; i < 2; i++) {
    await ansichtAuf();
    await pg.waitForSelector('.document-page [data-document-action="next"]', { state: 'visible', timeout: 5000 });
    await pg.click('.document-page [data-document-action="next"]');
    await pg.waitForTimeout(500);
  }
  z = await zustand(pg);
  gleich('Zwei Klicks auf „weiter" — Seite 3', z.position, 'Seite 3/3');
  await flush(pg);

  await laden(pg);
  z = await zustand(pg);
  p('Ohne Adresse geht die PDF wieder auf', z.hash === '#' + id, JSON.stringify(z));
  p('… in der Dokumentansicht', z.dokument);
  gleich('… auf Seite 3, wo man sie verlassen hat — nicht auf Seite 1', z.position, 'Seite 3/3');
  gleich('Der Ort ist eine Seite', z.ort, 'seite');
  gleich('`letzte` zeigt auf die PDF', z.letzte, id);
  await ktx.close();
}

/* ======================================================================== */
console.log('\n2 · Das Regal bleibt das Regal — auch beim zweiten Start');
{
  const { ktx, pg } = await kontext('rechner');
  await laden(pg);
  const id = await pdfAnlegen(pg);
  await pg.evaluate(() => { Bibliothek.oeffne(); });
  await pg.waitForTimeout(500);
  let z = await zustand(pg);
  p('Vorbereitung: das Regal ist offen', z.regal, JSON.stringify(z));
  gleich('Das Regal ist als Ort gemerkt', z.ort, 'dokumente');
  gleich('… und `letzte` zeigt weiter auf die PDF (für „Weiter wo du warst")', z.letzte, id);
  const aufrufeVorher = z.aufrufeErste;
  await flush(pg);

  await laden(pg);
  z = await zustand(pg);
  p('Erster Start nach dem Regal: das Regal', z.regal && !z.dokument, JSON.stringify(z));
  gleich('Keine Seite wurde still geöffnet: `letzte` ist noch die PDF', z.letzte, id);
  gleich('… und der Aufrufzähler der ersten Wurzelseite steht, wo er stand', z.aufrufeErste, aufrufeVorher);

  await laden(pg);
  z = await zustand(pg);
  p('ZWEITER Start nach dem Regal: immer noch das Regal, nicht „Willkommen"', z.regal && !z.dokument, JSON.stringify(z));
  gleich('… und `letzte` immer noch die PDF', z.letzte, id);
  await ktx.close();
}

/* ======================================================================== */
console.log('\n3 · `#dokumente` in der Adresse ist ein Ort, kein Ziel');
{
  const { ktx, pg } = await kontext('rechner');
  await laden(pg);
  const id = await pdfAnlegen(pg);
  await flush(pg);
  let z = await zustand(pg);
  gleich('Vorbereitung: der Ort ist die Seite', z.ort, 'seite');
  await laden(pg, '#dokumente');
  z = await zustand(pg);
  p('Neuladen mit #dokumente zeigt das Regal — nicht die gemerkte Seite', z.regal && !z.dokument, JSON.stringify(z));
  gleich('`letzte` bleibt die PDF', z.letzte, id);
  /* Und die Gegenrichtung: eine SEITE im Hash gewinnt weiter gegen alles. */
  await pg.evaluate(() => { Bibliothek.oeffne(); });
  await flush(pg);
  await laden(pg, '#' + id);
  z = await zustand(pg);
  p('Eine Seitenkennung im Hash gewinnt gegen den gemerkten Ort', z.hash === '#' + id && z.dokument, JSON.stringify(z));
  await ktx.close();
}

/* ======================================================================== */
console.log('\n4 · Eine Seite im Papierkorb ist kein Ort zum Weiterarbeiten');
{
  const { ktx, pg } = await kontext('rechner');
  await laden(pg);
  const id = await pdfAnlegen(pg);
  await pg.evaluate(async (id: string) => { Store.trashBlock(id); await Store.flush(); }, id);
  let z = await zustand(pg);
  gleich('Vorbereitung: der Ort ist die Seite, und sie liegt im Papierkorb', z.ort, 'seite');
  await laden(pg);
  z = await zustand(pg);
  p('Der Start zeigt das Regal, nicht die weggeworfene Seite', z.regal && z.hash !== '#' + id, JSON.stringify(z));
  await ktx.close();
}

/* ======================================================================== */
console.log('\n5 · Die alte Startansicht „Heute" fällt einmal zurück; neu gewählt bleibt sie');
{
  const { ktx, pg } = await kontext('rechner');
  await laden(pg);
  const id = await pdfAnlegen(pg);
  /* So sieht ein Gerät aus, das das Onboarding vor E349 durchlief. */
  await pg.evaluate(async () => {
    Store.setMeta('startAnsicht', 'start');
    Store.setMeta('startAnsichtE349', false);
    await Store.flush();
  });
  await laden(pg);
  let z = await zustand(pg);
  gleich('„start" ohne Marke wird einmal zu „dokument"', z.startAnsicht, 'dokument');
  gleich('… und die Marke steht', z.marke, true);
  p('Der Start zeigt die PDF, nicht „Heute"', z.dokument && z.hash === '#' + id, JSON.stringify(z));
  /* Wer „Heute" danach bewusst wählt, behält es. */
  await pg.evaluate(async () => { Store.setMeta('startAnsicht', 'start'); await Store.flush(); });
  await laden(pg);
  z = await zustand(pg);
  gleich('Mit Marke bleibt „start" stehen', z.startAnsicht, 'start');
  p('… und der Start zeigt die Lernwelt statt der PDF', !z.dokument && !z.regal && /lernen/.test(z.hash), JSON.stringify(z));
  await ktx.close();
}

/* ======================================================================== */
console.log('\n6 · Das Notizhefte-Regal kommt zurück, wenn man dort war');
{
  const { ktx, pg } = await kontext('rechner');
  await laden(pg);
  await pdfAnlegen(pg);
  await pg.evaluate(() => { Notebook.oeffnen(); });
  await pg.waitForTimeout(500);
  let z = await zustand(pg);
  p('Vorbereitung: das Notizhefte-Regal ist offen', z.notizhefte, JSON.stringify(z));
  gleich('… als Ort gemerkt', z.ort, 'notizhefte');
  await flush(pg);
  await laden(pg);
  z = await zustand(pg);
  p('Der Start zeigt das Notizhefte-Regal', z.notizhefte && !z.dokument, JSON.stringify(z));
  await ktx.close();
}

/* ======================================================================== */
console.log('\n7 · Am Telefon gilt dasselbe');
{
  const { ktx, pg } = await kontext('telefon');
  await laden(pg);
  const id = await pdfAnlegen(pg);
  await pg.evaluate(() => {
    const knopf = document.querySelector<HTMLButtonElement>('.document-page [data-document-action="next"]');
    knopf?.click();
  });
  await pg.waitForTimeout(500);
  await flush(pg);
  await laden(pg);
  let z = await zustand(pg);
  p('Telefon: die PDF geht wieder auf', z.dokument && z.hash === '#' + id, JSON.stringify(z));
  gleich('Telefon: auf Seite 2', z.position, 'Seite 2/3');
  await pg.evaluate(() => { Bibliothek.oeffne(); });
  await flush(pg);
  await laden(pg);
  z = await zustand(pg);
  p('Telefon: nach dem Regal kommt das Regal', z.regal && !z.dokument, JSON.stringify(z));
  await laden(pg);
  z = await zustand(pg);
  p('Telefon: auch beim zweiten Start', z.regal && !z.dokument, JSON.stringify(z));
  await ktx.close();
}

/* ======================================================================== */
/* HIER STAND: „Das Onboarding schreibt keine Startansicht mehr" — zwei
   Punkte gegen `setMeta('startAnsicht'` in `produkt_onboarding.ts`.
   Mit E434 ist das Modul fort, und ein Punkt, der eine geloeschte Datei
   liest, ist nach dem Loeschen fuer immer rot.
   DIE FRAGE BLEIBT ABER GUELTIG, nur weiter gefasst: die Startansicht ist
   Redurs Wahl, und NIEMAND soll sie ungefragt umschreiben. Der Punkt prueft
   das jetzt fuer den ganzen Bestand statt fuer eine Datei — das ist die
   staerkere Form, und sie haette den urspruenglichen Fehler auch gefunden. */
console.log('\n8 · Niemand schreibt die Startansicht ungefragt um');
{
  const wurzeln = ['src'];
  const dateien: string[] = [];
  const sammeln = (ort: string): void => {
    for (const eintrag of fs.readdirSync(ort, { withFileTypes: true })) {
      const voll = path.join(ort, eintrag.name);
      if (eintrag.isDirectory()) sammeln(voll);
      else if (eintrag.name.endsWith('.ts')) dateien.push(voll);
    }
  };
  wurzeln.forEach(w => sammeln(path.join(WURZEL, w)));
  /* Erlaubt ist genau eine Stelle: die Einstellungsseite, auf der Redur
     die Startansicht selbst waehlt. Und `schale.ts`, wo E349 den einmaligen
     Ruecksetzer stehen hat — beide ausdruecklich, beide begruendet. */
  const erlaubt = ['einstellungen', 'schale.ts'];
  const schreiber = dateien.filter(d => /setMeta\('startAnsicht'/.test(fs.readFileSync(d, 'utf8')))
    .map(d => path.relative(WURZEL, d))
    .filter(d => !erlaubt.some(e => d.includes(e)));
  p('Nur Einstellungen und Schale setzen die Startansicht',
    schreiber.length === 0, JSON.stringify(schreiber));
  p('Das entfernte Onboarding-Modul gibt es nicht mehr',
    !fs.existsSync(path.join(WURZEL, 'src/bereiche/wissen/produkt_onboarding.ts')));
}

console.log('');
p('Keine Seitenfehler', fehler.length === 0, fehler.join(' | '));
await browser.close();
server.close();
console.log(`\n${ok}/${ok + weg} bestanden`);
process.exit(weg ? 1 : 0);
