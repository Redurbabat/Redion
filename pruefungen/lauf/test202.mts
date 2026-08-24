/* Suite 168 — Study Suite: Phasen 2–9 als zusammenhängender Rundlauf
 * ============================================================================
 * Dieser Wächter prüft die neuen Arbeitswege dort, wo sie wirklich leben:
 * im Browser, im normalen Store und in den bestehenden Datei-/ZIP-APIs.
 * Nur Gerätepfade (echte Kamera, echtes Mikrofon) und die Verdrahtung der
 * erzeugten Skripte werden ergänzend an ihren Quellen festgehalten.
 *
 *   node pruefungen/lauf/test202.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8957;
const TYP: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp',
  '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2'
};

const server = http.createServer((anfrage: IncomingMessage, antwort: ServerResponse) => {
  const rein = decodeURIComponent((anfrage.url || '/').split('?')[0] || '/');
  const datei = path.join(WURZEL, rein === '/' ? 'index.html' : rein.slice(1));
  if (!datei.startsWith(WURZEL) || !fs.existsSync(datei) || fs.statSync(datei).isDirectory()) {
    antwort.writeHead(404); antwort.end(); return;
  }
  antwort.writeHead(200, { 'Content-Type': TYP[path.extname(datei)] || 'application/octet-stream' });
  antwort.end(fs.readFileSync(datei));
});
await new Promise<void>(resolve => server.listen(PORT, resolve));

let ok = 0, offen = 0;
const pruefe = (name: string, wert: unknown, extra = ''): void => {
  if (wert) { ok++; console.log('  ✓ ' + name); }
  else { offen++; console.log('  ✗ ' + name + (extra ? ' — ' + extra : '')); }
};
const gleich = (name: string, ist: unknown, soll: unknown): void =>
  pruefe(name, JSON.stringify(ist) === JSON.stringify(soll),
    `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

const browser = await chromium.launch();
const seite = await browser.newPage();
const seitenfehler: string[] = [];
seite.on('pageerror', error => seitenfehler.push(error.message));
await seite.setViewportSize({ width: 1366, height: 900 });
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForFunction(() => typeof (window as any).DocumentMode === 'object' &&
  typeof (window as any).Learning === 'object' && typeof (window as any).Recognition === 'object');
await seite.waitForTimeout(1800);
await seite.evaluate(() => {
  Store.setMeta('rundgangGesehen', true);
  document.getElementById('rg-willkommen')?.remove();
  document.getElementById('rg-einladung')?.remove();
});

/* ========================================================================== *
 * 1 · Dokumentmodus: dieselben Blöcke, eine volle Seite, echte Navigation
 * ======================================================================== */
console.log('\n1 · Dokumentmodus mit bestehenden PDF-/Blatt-Blöcken');

const dokument = await seite.evaluate(() => {
  const page = Store.addPage(null, { text: 'T202 Dokument', icon: '📘' });
  const sheet = Store.addBlock(page.id, 'blatt', {
    text: '', blattBreite: 595.28, blattHoehe: 841.89, raumVersion: 1,
    suchtext: 'T202 nativer Bestand',
    marken: [{ id: 't202-ink', art: 'stift', farbe: '#223344', breite: 2.4,
      pts: [[70, 100], [180, 130], [260, 115]] }]
  });
  const columns = Store.addBlock(page.id, 'columns', { text: '' });
  const column = Store.addBlock(columns.id, 'spalte', { text: '' });
  const pdf = Store.addBlock(column.id, 'pdfseite', {
    text: '', nr: 2, vonSeiten: 2, bw: 595.28, bh: 841.89,
    quelleId: 't202-original', suchtext: 'T202 PDF Originaltext', marken: []
  });
  Store.updateBlock(page.id, { dokumentModus: true });
  App.oeffne(page.id);
  return { pageId: page.id, sheetId: sheet.id, pdfId: pdf.id };
});
await seite.waitForSelector('.document-workspace');

const dokumentStart = await seite.evaluate((ids: { pageId: string; sheetId: string; pdfId: string }) => {
  const page = Store.getBlock(ids.pageId);
  const docs = DocumentMode.documentsIn(page);
  return {
    available: DocumentMode.available(page), active: DocumentMode.active(page),
    ids: docs.map((block: any) => block.id),
    thumbs: document.querySelectorAll('.document-thumbnail').length,
    full: document.querySelectorAll('.document-stage > .blatt-huelle').length,
    position: document.querySelector('.document-position')?.textContent,
    inspector: [...document.querySelectorAll<HTMLElement>('[data-document-action]')]
      .map(button => button.dataset.documentAction)
  };
}, dokument);
gleich('Verschachtelte Dokumentblöcke werden in derselben Reihenfolge gefunden',
  dokumentStart.ids, [dokument.sheetId, dokument.pdfId]);
gleich('Der Modus ist für die Seite verfügbar und aktiv',
  [dokumentStart.available, dokumentStart.active], [true, true]);
gleich('Zwei Miniaturen, aber nur eine volle Dokumentseite werden gezeichnet',
  [dokumentStart.thumbs, dokumentStart.full], [2, 1]);
gleich('Die Positionsanzeige beginnt auf dem Blatt', dokumentStart.position, 'Seite 1/2');
pruefe('Inspector bietet Quelle, Ausschnitt und Erkennung an',
  ['source-actions', 'select-region', 'recognize'].every(action => dokumentStart.inspector.includes(action)),
  JSON.stringify(dokumentStart.inspector));

await seite.locator('[data-document-action="next"]').click();
await seite.waitForTimeout(180);
gleich('Der echte Weiter-Knopf zeigt die zweite PDF-Seite',
  await seite.locator('.document-position').textContent(), 'Seite 2/2');
gleich('Im Zentrum steht danach genau die PDF-Seite',
  await seite.locator('.document-stage .pdfs').count(), 1);

await seite.locator('[data-document-zoom]').evaluate(element => {
  const input = element as HTMLInputElement;
  input.value = '130'; input.dispatchEvent(new Event('input', { bubbles: true }));
});
gleich('Zoom ändert nur die Ansichtsbreite',
  await seite.locator('.document-stage').evaluate(element => (element as HTMLElement).style.width), '130%');
gleich('Der Zoom verändert keine Dokumentkoordinate',
  await seite.evaluate((id: string) => Store.getBlock(id).bw, dokument.pdfId), 595.28);

const dokumentGroessen: any[] = [];
for (const [width, height] of [[390, 844], [760, 900], [1440, 900]] as Array<[number, number]>) {
  await seite.setViewportSize({ width, height });
  await seite.waitForTimeout(90);
  dokumentGroessen.push(await seite.evaluate(() => {
    const workspace = document.querySelector<HTMLElement>('.document-workspace');
    const center = document.querySelector<HTMLElement>('.document-center');
    return {
      workspace: Math.round(workspace?.getBoundingClientRect().width || 0),
      center: Math.round(center?.getBoundingClientRect().width || 0),
      viewport: window.innerWidth,
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
    };
  }));
}
pruefe('Dokumentmodus bleibt bei Mobil, Tablet und Desktop im Seitenrahmen',
  dokumentGroessen.every(m => m.workspace > 0 && m.center > 0 && m.workspace <= m.viewport + 1 && !m.overflow),
  JSON.stringify(dokumentGroessen));
await seite.setViewportSize({ width: 1366, height: 900 });

/* ========================================================================== *
 * 2 · Quelle → Lerninhalt → exakter Rücksprung und Lückenkarte
 * ======================================================================== */
console.log('\n2 · Lerninhalte behalten ihre genaue Quelle');

await seite.evaluate((ids: { pageId: string; pdfId: string }) => {
  Learning.sourceMenu(Store.getBlock(ids.pageId), Store.getBlock(ids.pdfId),
    { x: 40, y: 80, width: 160, height: 90 });
}, dokument);
gleich('Das Quellmenü zeigt fünf normale Zielarten',
  await seite.locator('.lern [data-learning-action]:not([data-learning-action="close"])').count(), 5);
await seite.locator('.lern [data-learning-action="card"]').click();
await seite.locator('.lern textarea').nth(0).fill('T202 Was zeigt Seite zwei?');
await seite.locator('.lern textarea').nth(1).fill('Den genauen Ausschnitt');
await seite.locator('.lern [data-learning-action="save"]').click();
await seite.waitForTimeout(180);

const quellenKarte = await seite.evaluate(() => {
  const card = Object.values<any>(Store.cache.blocks)
    .find(block => block.alive !== false && block.type === 'flashcard' &&
      block.text === 'T202 Was zeigt Seite zwei? :: Den genauen Ausschnitt');
  return card ? { id: card.id, type: card.type, sourceRef: card.sourceRef,
    sameLegacy: JSON.stringify(card.sourceRef) === JSON.stringify(card.lernquelle) } : null;
});
pruefe('Das Quellmenü legt eine normale Flashcard an', quellenKarte?.type === 'flashcard');
gleich('sourceRef v1 nennt PDF, Seite, Block und Ausschnitt exakt', quellenKarte?.sourceRef && {
  version: quellenKarte.sourceRef.version, kind: quellenKarte.sourceRef.kind,
  pageId: quellenKarte.sourceRef.pageId, blockId: quellenKarte.sourceRef.blockId,
  pageNumber: quellenKarte.sourceRef.pageNumber, region: quellenKarte.sourceRef.region
}, {
  version: 1, kind: 'pdfseite', pageId: dokument.pageId, blockId: dokument.pdfId,
  pageNumber: 2, region: { x: 40, y: 80, width: 160, height: 90 }
});
pruefe('Der kompatible Lernquellenname trägt denselben kleinen Vertrag', quellenKarte?.sameLegacy);

const sprung = quellenKarte ? await seite.evaluate((id: string) =>
  Learning.jumpToSource(Store.getBlock(id)), quellenKarte.id) : false;
await seite.waitForTimeout(220);
pruefe('Der Quellsprung meldet Erfolg', sprung);
gleich('Der Quellsprung wählt vor dem Rendern genau die PDF-Seite',
  await seite.locator('.document-position').textContent(), 'Seite 2/2');

const luecke = await seite.evaluate((pageId: string) => {
  const source = Store.addBlock(pageId, 'text', {
    text: 'alpha Wiederholung beta Wiederholung gamma'
  });
  const made = Learning.clozeFromSelection(source, 'Wiederholung', 24);
  const split = Learning.splitCard({ text: 'U = {{I · R::Formel}}' });
  return made ? { id: made.id, text: made.text, sourceRef: made.sourceRef, split } : null;
}, dokument.pageId);
gleich('Bei wiederholtem Text wird nur die tatsächlich markierte Stelle zur Lücke',
  luecke?.text, 'alpha Wiederholung beta {{Wiederholung}} gamma');
gleich('Die Lückenkarte verweist auf den ursprünglichen Textblock',
  [luecke?.sourceRef?.kind, luecke?.sourceRef?.pageId], ['block', dokument.pageId]);
gleich('Lückentext trennt Vorderseite, Hinweis und Antwort',
  luecke?.split, ['U = [Formel]', 'I · R']);

/* ========================================================================== *
 * 3 · Tageswarteschlange, Fehlertraining, Statistik und SM-2-Verlauf
 * ======================================================================== */
console.log('\n3 · Lernwarteschlange und additiver Wiederholungsverlauf');

const lernen = await seite.evaluate((pageId: string) => {
  const past = new Date(Date.now() - 3600000).toISOString();
  const future = new Date(Date.now() + 3 * 86400000).toISOString();
  const at = new Date(Date.now() - 7200000).toISOString();
  const errorCard = Store.addBlock(pageId, 'flashcard', {
    text: 'T202 Fehler :: Noch einmal', sr: { ease: 2.5, intervall: 0, wdh: 0, faellig: past },
    quiz: { topic: 'T202 Grundlagen' },
    reviewVerlauf: { e1: { id: 'e1', at, rating: 1, algorithm: 'sm2' } }
  });
  const dueCard = Store.addBlock(pageId, 'flashcard', {
    text: 'T202 Fällig :: Antwort', sr: { ease: 2.5, intervall: 1, wdh: 1, faellig: past },
    quiz: { topic: 'T202 Grundlagen' },
    reviewVerlauf: { d1: { id: 'd1', at, rating: 4, algorithm: 'sm2' } }
  });
  const futureCard = Store.addBlock(pageId, 'flashcard', {
    text: 'T202 Zukunft :: Später', sr: { ease: 2.5, intervall: 6, wdh: 2, faellig: future },
    quiz: { topic: 'T202 Grundlagen' }
  });
  Store.addBlock(pageId, 'flashcard', {
    text: 'T202 Schwer :: Gegenprobe', sr: { ease: 2.5, intervall: 1, wdh: 0, faellig: future },
    quiz: { topic: 'T202 Gegenprobe' },
    reviewVerlauf: { h1: { id: 'h1', at, rating: 2, algorithm: 'sm2' } }
  });
  Store.addBlock(pageId, 'flashcard', { text: 'T202 Neu eins :: A' });
  Store.addBlock(pageId, 'flashcard', { text: 'T202 Neu zwei :: B' });

  const queue = Learning.dailyQueue(1);
  const statsBefore = Learning.statistics();
  const sr = WissenDienst.planen(dueCard, 4);
  const updated = Store.getBlock(dueCard.id);
  const log = Learning.reviewLog(updated);
  return {
    errorId: errorCard.id, dueId: dueCard.id, futureId: futureCard.id,
    errors: queue.errors.map((card: any) => card.id),
    due: queue.due.map((card: any) => card.id),
    fresh: queue.newCards.length, all: queue.all.length,
    future: queue.future.map((card: any) => card.id), nextAt: queue.nextAt,
    statsBefore, topic: statsBefore.topics.find((topic: any) => topic.label === 'T202 Grundlagen'), sr,
    reviewIsObject: !!updated.reviewVerlauf && !Array.isArray(updated.reviewVerlauf),
    last: log[log.length - 1], algorithm: updated.lernAlgorithmus
  };
}, dokument.pageId);
pruefe('Fehlerkarte steht vor den gewöhnlich fälligen Karten',
  lernen.errors.includes(lernen.errorId) && lernen.due.includes(lernen.dueId));
gleich('Das Limit begrenzt nur neue Karten', lernen.fresh, 1);
pruefe('Zukünftige Karten bleiben ausserhalb der Tagesrunde',
  lernen.future.includes(lernen.futureId) && !lernen.errors.includes(lernen.futureId) &&
  !lernen.due.includes(lernen.futureId));
pruefe('Statistik zählt Karten, Fehler und Wiederholungen aus demselben Store',
  Number(lernen.statsBefore.total) >= 6 && Number(lernen.statsBefore.mistakes) >= 2 &&
  Number(lernen.statsBefore.reviews) >= 3, JSON.stringify(lernen.statsBefore));
gleich('Nochmal-Rate zählt nur Bewertung 1, nicht die SM-2-Fehlerbewertung 2',
  [lernen.statsBefore.againReviews, lernen.statsBefore.againRate], [1, 33]);
gleich('Themenfortschritt entsteht transparent aus 0, 1 und 2 SM-2-Wiederholungen',
  lernen.topic && { total: lernen.topic.total, learned: lernen.topic.learned,
    stable: lernen.topic.stable, progress: lernen.topic.progress },
  { total: 3, learned: 3, stable: 1, progress: 50 });
pruefe('SM-2 setzt einen zukünftigen Termin und bleibt als Algorithmus benannt',
  Date.parse(lernen.sr.faellig) > Date.now() && lernen.algorithm === 'sm2');
pruefe('Der Verlauf ist ein merge-freundliches Objekt mit vollständigem Ereignis',
  lernen.reviewIsObject && lernen.last?.version === 1 && lernen.last?.rating === 4 &&
  lernen.last?.before && lernen.last?.after && lernen.last?.algorithm === 'sm2',
  JSON.stringify(lernen.last));

const lernBestandVorAnsicht = await seite.evaluate(() => ({
  blocks: Object.values<any>(Store.cache.blocks).filter(block => block.alive !== false).length,
  collections: Object.keys(Store.cache.collections).length
}));
await seite.evaluate(() => Learning.open());
await seite.waitForSelector('.lern');
const lernDashboard = await seite.locator('.lern').innerText();
const lernThemenwert = await seite.locator(
  '.lern progress[aria-label="Fortschritt für T202 Grundlagen"]'
).evaluate((element: HTMLProgressElement) => Number(element.value));
pruefe('Lernübersicht zeigt Nochmal-Rate und Themenfortschritt ausdrücklich',
  lernDashboard.includes('Nochmal-Rate') && lernDashboard.includes('Themenfortschritt') &&
  lernDashboard.includes('T202 Grundlagen') && lernThemenwert > 0,
  JSON.stringify({ lernThemenwert, lernDashboard }));
await seite.locator('.lern [data-learning-action="close"]').click();
gleich('Die Lernübersicht legt beim Aggregieren keinen zweiten Datenbestand an',
  await seite.evaluate(() => [
    Object.values<any>(Store.cache.blocks).filter(block => block.alive !== false).length,
    Object.keys(Store.cache.collections).length
  ]), [lernBestandVorAnsicht.blocks, lernBestandVorAnsicht.collections]);

/* ========================================================================== *
 * 4 · Aufnahmeblob, Stückablage, Zeitmarken und Sidecar-Zustimmung
 * ======================================================================== */
console.log('\n4 · Audio bleibt als Datei im bestehenden Anhangsspeicher');

const audio = await seite.evaluate(async (parentId: string) => {
  App.oeffne(parentId);
  Store.setMeta('meet:audio', true);
  Store.setMeta('meet:transkriptWeg', false);
  const bytes = [3, 1, 4, 1, 5, 9, 2, 6];
  const stored = await Meeting.audioAblegen(
    new Blob([new Uint8Array(bytes)], { type: 'audio/ogg' }), 61,
    [{ sek: 7, text: 'T202 Merkstelle' }]
  );
  const record = await Store.dateiHolen(stored.dateiId);
  const back = await Dateien.alsBlob(stored.dateiId);
  const raw = back ? [...new Uint8Array(await back.arrayBuffer())] : [];
  const meetingPage = Meeting.seiteAnlegen({ titel: 'T202 Gespräch', beteiligte: [],
    zusammenfassung: [], entscheidungen: [], aufgaben: [], themen: [] },
    '[00:07] T202 Transkriptstelle', 61, stored);
  const children = Store.childrenOf(meetingPage.id);
  const audioBlock = children.find((block: any) => block.type === 'audio');
  const refs = children.flatMap((block: any) => block.type === 'toggle'
    ? Store.childrenOf(block.id) : [block]).filter((block: any) => block.audioRef);
  App.oeffne(meetingPage.id);
  return {
    bytes, raw, stored, record: record && { id: record.id, name: record.name,
      typ: record.typ, blockId: record.blockId, teile: record.teile },
    meetingPageId: meetingPage.id, audioBlock,
    refs: refs.map((block: any) => block.audioRef)
  };
}, dokument.pageId);
gleich('Ein MediaRecorder-Blob kommt bytegleich aus der Stückablage zurück', audio.raw, audio.bytes);
pruefe('MIME-Typ und Dateiendung folgen der wirklichen Aufnahme',
  audio.record?.typ === 'audio/ogg' && /\.ogg$/.test(audio.record?.name || ''),
  JSON.stringify(audio.record));
gleich('Dateisatz und späterer Audioblock teilen die reservierte Blockkennung',
  [audio.record?.blockId, audio.audioBlock?.id], [audio.stored.blockId, audio.stored.blockId]);
pruefe('Zeitmarken tragen stabile Datei-, Block- und Sekundenangaben',
  audio.refs.length === 2 && audio.refs.every((ref: any) =>
    ref.blockId === audio.audioBlock?.id && ref.dateiId === audio.stored.dateiId && ref.sek === 7),
  JSON.stringify(audio.refs));
await seite.waitForTimeout(250);
gleich('Zeitmarken erscheinen als normale Navigationsknöpfe im Editor',
  await seite.locator('.audio-ref-marke').count(), 2);
pruefe('Die sichtbaren Marken nennen 00:07',
  (await seite.locator('.audio-ref-marke').allTextContents()).every(text => text.includes('00:07')));

const sidecar = await seite.evaluate(async () => {
  Store.setMeta('meet:sidecar', 'https://example.invalid/transcribe');
  const oldConfirm = window.confirm;
  const oldFetch = window.fetch;
  let fetched = false, message = '';
  window.confirm = () => false;
  (window as any).fetch = async () => {
    fetched = true;
    return new Response('{"text":"unerwartet"}', { status: 200 });
  };
  try { await Meeting.sidecarTranskribieren(new Blob(['ton'], { type: 'audio/webm' })); }
  catch (error) { message = error instanceof Error ? error.message : String(error); }
  finally { window.confirm = oldConfirm; (window as any).fetch = oldFetch; }
  return { fetched, message };
});
pruefe('Ein eingetragener Sidecar sendet ohne ausdrückliche Zustimmung nichts',
  !sidecar.fetched && /nicht bestätigt/i.test(sidecar.message), JSON.stringify(sidecar));

/* ========================================================================== *
 * 5 · Eine Linkwahrheit und stabiler Obsidian-Rundweg
 * ======================================================================== */
console.log('\n5 · Alias-/Pfadauflösung und Obsidian bleiben kollisionssicher');

const links = await seite.evaluate(() => {
  const a = Store.addPage(null, { text: 'T202 Bereich A' });
  const b = Store.addPage(null, { text: 'T202 Bereich B' });
  const one = Store.addPage(a.id, { text: 'T202 Motor', obsidianPath: 'T202-A/Motor' });
  const two = Store.addPage(b.id, { text: 'T202 Motor', obsidianPath: 'T202-B/Motor' });
  Links.aliasesSetzen(one.id, ['  T202 Schaltung  ', 'T202 Schaltung', 'T202 Motor']);
  Links.aliasesSetzen(two.id, ['T202 Schaltung']);
  const title = Links.loeseSeitenverweis('T202 Motor');
  const alias = Links.loeseSeitenverweis('T202 Schaltung');
  const byPath = Links.loeseSeitenverweis('T202-A/Motor.md#Kern');
  const byId = Links.loeseSeitenverweis('redion:' + two.id);
  return {
    oneId: one.id, twoId: two.id,
    aliases: Store.getBlock(one.id).aliases,
    title: { status: title.status, page: title.page?.id || null, candidates: title.candidates.length },
    alias: { status: alias.status, page: alias.page?.id || null, candidates: alias.candidates.length },
    byPath: { status: byPath.status, page: byPath.page?.id || null, source: byPath.source },
    byId: { status: byId.status, page: byId.page?.id || null, source: byId.source },
    reference: Links.referenzFuerSeite(Store.getBlock(one.id))
  };
});
gleich('Aliase werden gesäubert, dedupliziert und nicht mit dem Titel gedoppelt',
  links.aliases, ['T202 Schaltung']);
gleich('Gleiche Titel wählen niemals willkürlich die erste Seite',
  links.title, { status: 'mehrdeutig', page: null, candidates: 2 });
gleich('Auch eine Alias-Kollision bleibt sichtbar statt willkürlich',
  links.alias, { status: 'mehrdeutig', page: null, candidates: 2 });
gleich('Ein Vault-Pfad löst die Kollision eindeutig auf',
  links.byPath, { status: 'eindeutig', page: links.oneId, source: 'pfad' });
gleich('redion:id löst dieselbe Kollision ebenfalls eindeutig auf',
  links.byId, { status: 'eindeutig', page: links.twoId, source: 'id' });
gleich('Die kürzeste eindeutige Referenz fällt auf den Pfad zurück', links.reference, 'T202-A/Motor');

const vaultImport = await seite.evaluate(async () => {
  const stableId = Store.uid();
  const markdown = [
    '---',
    'redion-id: "' + stableId + '"',
    'redion-path: "T202 Import"',
    'redion-title: "T202 Import"',
    'aliases:',
    '  - "T202 Stable"',
    '---',
    '# T202 Import',
    '',
    'Siehe [[T202 Motor]].'
  ].join('\n');
  const make = (): File => {
    const file = new File([markdown], 'T202 Import.md', { type: 'text/markdown' });
    Object.defineProperty(file, 'webkitRelativePath', { value: 'T202Vault/T202 Import.md' });
    return file;
  };
  const first = await Austausch.ausMarkdownOrdner([make()], null);
  const firstPage = Store.getBlock(stableId);
  const firstChildren = firstPage ? Store.childrenOf(firstPage.id).map((block: any) => block.text) : [];
  /* Ein geaenderter Vault kann Platzhalter verlieren. Selbst dann duerfen
     opake Originale weder neue IDs bekommen noch ihre Dateizuordnung
     verlieren. */
  const child = Store.addBlock(firstPage.id, 'page', { text: 'T202 stabiles Kind' });
  const audioId = Store.uid();
  const file = await Dateien.ablegen(
    new Blob([new Uint8Array([8, 6, 7, 5, 3, 0, 9])], { type: 'audio/ogg' }),
    { blockId: audioId, name: 't202-vault.ogg' });
  Store.addBlock(firstPage.id, 'audio', {
    id: audioId, text: 'T202 stabile Aufnahme', dateiId: file.id, mime: 'audio/ogg'
  });
  const second = await Austausch.ausMarkdownOrdner([make()], null);
  const page = Store.getBlock(stableId);
  const audioAfter = Store.getBlock(audioId);
  const childAfter = Store.getBlock(child.id);
  const bytesAfterBlob = await Dateien.alsBlob(file.id);
  const bytesAfter = bytesAfterBlob
    ? [...new Uint8Array(await bytesAfterBlob.arrayBuffer())] : [];
  const count = Object.values<any>(Store.cache.blocks)
    .filter(block => block.alive !== false && block.id === stableId).length;
  const alias = Links.loeseSeitenverweis('T202 Stable');
  const forged = markdown
    .replace('redion-path: "T202 Import"', 'redion-path: "T202 Fremder Pfad"')
    .replace('redion-title: "T202 Import"', 'redion-title: "T202 Übergriff"')
    .replace('# T202 Import', '# T202 Übergriff');
  const forgedFile = new File([forged], 'T202 Übergriff.md', { type: 'text/markdown' });
  Object.defineProperty(forgedFile, 'webkitRelativePath', {
    value: 'T202Vault/T202 Übergriff.md'
  });
  const forgedResult = await Austausch.ausMarkdownOrdner([forgedFile], null);
  const forgedCopies = Object.values<any>(Store.cache.blocks).filter(block =>
    block.alive !== false && block.type === 'page' && block.text === 'T202 Übergriff');
  return {
    stableId, firstHint: first.hinweis, secondHint: second.hinweis,
    firstChildren,
    secondChildren: page ? Store.childrenOf(page.id)
      .filter((block: any) => block.type === 'text').map((block: any) => block.text) : [],
    count, aliases: page?.aliases, path: page?.obsidianPath,
    alias: { status: alias.status, page: alias.page?.id || null },
    opaque: { childId: childAfter?.id || '', audioId: audioAfter?.id || '',
      fileId: audioAfter?.dateiId || '', bytesAfter },
    expectedOpaque: { childId: child.id, audioId, fileId: file.id,
      bytesAfter: [8, 6, 7, 5, 3, 0, 9] },
    forgedHint: forgedResult.hinweis, originalTitle: Store.getBlock(stableId)?.text,
    forgedCopies: forgedCopies.length
  };
});
pruefe('Erstimport legt die Frontmatter-ID wirklich als Seiten-ID an',
  vaultImport.count === 1 && /1 neu/.test(vaultImport.firstHint), vaultImport.firstHint);
pruefe('Zweitimport erkennt dieselbe Seite wieder und dupliziert sie nicht',
  /1 wiedererkannt/.test(vaultImport.secondHint) && vaultImport.count === 1,
  vaultImport.secondHint);
gleich('Unterseite, Audioblock, Dateizuordnung und Bytes behalten beim Reimport ihre IDs',
  vaultImport.opaque, vaultImport.expectedOpaque);
pruefe('Eine passende ID mit falschem Pfad überschreibt die bestehende Seite nicht',
  vaultImport.originalTitle === 'T202 Import' && vaultImport.forgedCopies === 1 &&
  /Konflikt/i.test(vaultImport.forgedHint), vaultImport.forgedHint);
gleich('Wikilinks bleiben beim Import als Wikilinks erhalten',
  vaultImport.secondChildren, ['Siehe [[T202 Motor]].']);
gleich('Alias und stabiler Vault-Pfad überleben den Wiederimport',
  [vaultImport.aliases, vaultImport.path, vaultImport.alias],
  [['T202 Stable'], 'T202 Import', { status: 'eindeutig', page: vaultImport.stableId }]);

const vaultExport = await seite.evaluate(async (stableId: string) => {
  const oldClick = HTMLAnchorElement.prototype.click;
  (HTMLAnchorElement.prototype as any).click = function (): void { /* Download im Prüflauf auffangen. */ };
  const blob = await (async (): Promise<Blob> => {
    try { return await Austausch.alsObsidianVault('T202 Export'); }
    finally { (HTMLAnchorElement.prototype as any).click = oldClick; }
  })();
  const zip = await Einlesen.zipLesenAusBlob(blob);
  let name = '', text = '';
  for (const candidate of zip.namen as string[]) {
    if (!candidate.endsWith('.md') || !candidate.includes('T202 Import')) continue;
    const content = await zip.text(candidate) || '';
    if (content.includes(stableId)) { name = candidate; text = content; break; }
  }
  return { size: blob.size, name, text };
}, vaultImport.stableId);
pruefe('Der Vault-Export ist ein echtes, lesbares ZIP mit der stabilen Seite',
  vaultExport.size > 100 && !!vaultExport.name, JSON.stringify({ size: vaultExport.size, name: vaultExport.name }));
pruefe('Export-Frontmatter enthält ID, Pfad und Alias',
  vaultExport.text.includes('redion-id: "' + vaultImport.stableId + '"') &&
  /redion-path:\s*"T202 Import"/.test(vaultExport.text) &&
  /aliases:\s*\n\s*-\s*"T202 Stable"/.test(vaultExport.text),
  vaultExport.text.slice(0, 260));
pruefe('Der mehrdeutige Wikilink bleibt auch im Export sichtbar',
  vaultExport.text.includes('[[T202 Motor]]'));

/* ========================================================================== *
 * 6 · Ausbildungsvorlage und normfreier Elektrotechnik-Kern
 * ======================================================================== */
console.log('\n6 · Additive Ausbildung und nachvollziehbare Elektrotechnik');

const ausbildung = await seite.evaluate(() => {
  const first = Galerie.bauen('ausbildung');
  if (!first) return null;
  Store.updateBlock(first.id, { text: 'T202 Ausbildung' });
  const own = Store.addBlock(first.id, 'text', { text: 'T202 eigener Inhalt' });
  const before = Store.childrenOf(first.id).length;
  const second = Galerie.bauen('ausbildung');
  const after = Store.childrenOf(first.id).length;
  const root = Store.getBlock(first.id);
  const collections = Object.values<any>(Store.cache.collections)
    .filter(collection => collection.schoolRootId === first.id);
  const exams = collections.find(collection => collection.schoolKind === 'exams');
  const day = (offset: number): string => {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() + offset);
    return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0')].join('-');
  };
  let examId = '';
  if (exams) {
    const row = Store.addRow(exams.id, {
      title: 'T202 Zwischenprüfung', date: day(10), status: 'Geplant'
    });
    Store.updateBlock(row.id, { text: 'T202 Zwischenprüfung' });
    examId = row.id;
    Store.addRow(exams.id, {
      title: 'T202 bereits abgeschlossen', date: day(1), status: 'Abgeschlossen'
    });
    Store.addRow(exams.id, {
      title: 'T202 DST Prüfung', date: '2027-03-29', status: 'Geplant'
    });
  }
  const examCountdown = Learning.nextExam();
  const dstCountdown = Learning.nextExam(new Date(2027, 2, 27, 12));
  const roles = Object.values<any>(Store.cache.blocks)
    .filter(block => block.alive !== false && block.parentId === first.id && block.schoolRole)
    .map(block => block.schoolRole);
  return {
    rootId: first.id, secondId: second?.id, rootCount: Object.values<any>(Store.cache.blocks)
      .filter(block => block.alive !== false && block.type === 'page' && block.schoolRoot).length,
    title: root.text, gradeScale: root.gradeScale,
    before, after, ownAlive: Store.getBlock(own.id)?.alive !== false,
    kinds: collections.map(collection => collection.schoolKind).sort(),
    names: collections.map(collection => collection.name).sort(), roles, examId,
    examCountdown, dstCountdown
  };
});
pruefe('Die Ausbildungsvorlage wurde angelegt', !!ausbildung);
if (ausbildung) {
  gleich('Zweiter Aufruf benutzt dieselbe Ausbildungswurzel',
    [ausbildung.secondId, ausbildung.rootCount], [ausbildung.rootId, 1]);
  gleich('Eigener Inhalt und eigener Seitentitel bleiben beim additiven Update erhalten',
    [ausbildung.title, ausbildung.ownAlive, ausbildung.after],
    ['T202 Ausbildung', true, ausbildung.before]);
  gleich('Fächer, Prüfungen, Noten, Berichtsheft und Lernmaterial sind normale Sammlungen',
    ausbildung.kinds, ['exams', 'grades', 'materials', 'reports', 'subjects']);
  pruefe('Die Notenskala bleibt ausdrücklich unkonfiguriert',
    ausbildung.gradeScale?.configured === false, JSON.stringify(ausbildung.gradeScale));
  pruefe('Lernstoff, Eingang und Datenbankblöcke sind normale Kinder der Seite',
    ['school-learning', 'school-inbox', 'school-db-subjects', 'school-db-exams']
      .every(role => ausbildung.roles.includes(role)), JSON.stringify(ausbildung.roles));
  gleich('Tagesqueue nimmt die nächste offene Prüfung aus der normalen Prüfungsdatenbank',
    ausbildung.examCountdown && {
      title: ausbildung.examCountdown.title, days: ausbildung.examCountdown.days
    }, { title: 'T202 Zwischenprüfung', days: 10 });
  gleich('Prüfungsabstand zählt Kalendertage auch über den Sommerzeitwechsel',
    ausbildung.dstCountdown && {
      title: ausbildung.dstCountdown.title, days: ausbildung.dstCountdown.days
    }, { title: 'T202 DST Prüfung', days: 2 });
}

if (ausbildung) {
  await seite.evaluate(() => Learning.open());
  await seite.waitForSelector('.lern');
  const examText = await seite.locator('.lern').innerText();
  pruefe('Lernübersicht zeigt Prüfung in N Tagen samt Titel',
    examText.includes('Prüfung in 10 Tagen') && examText.includes('T202 Zwischenprüfung'), examText);
  await seite.locator('.lern [data-learning-action="close"]').click();
}

const rechnen = await seite.evaluate(() => ({
  voltage: ElectricalCalculations.voltage(2, 6),
  current: ElectricalCalculations.current(12, 6),
  energy: ElectricalCalculations.energy(500, 4),
  parallel: ElectricalCalculations.parallel([100, 100]),
  invalid: ElectricalCalculations.current(12, 0),
  tooMany: ElectricalCalculations.series(Array.from({ length: 201 }, () => 1))
}));
gleich('Ohmsches Gesetz rechnet Wert, Einheit und Formel',
  [rechnen.voltage.ok, rechnen.voltage.value, rechnen.voltage.unit, rechnen.voltage.formula],
  [true, 12, 'V', 'U = I · R']);
gleich('Strom, Energie und Parallelschaltung liefern normfreie Grundwerte',
  [rechnen.current.value, rechnen.energy.value, rechnen.parallel.value], [2, 2, 50]);
pruefe('Nullteiler und übergrosse Listen werden als Fehler zurückgegeben',
  !rechnen.invalid.ok && !rechnen.tooMany.ok && /grösser als null/.test(rechnen.invalid.error || '') &&
  /Höchstens 200/.test(rechnen.tooMany.error || ''));

if (ausbildung) {
  await seite.evaluate((rootId: string) => {
    App.oeffne(rootId);
    Electrical.open(Store.getBlock(rootId));
  }, ausbildung.rootId);
  await seite.locator('.electrical-fields [data-field="i"]').fill('2');
  await seite.locator('.electrical-fields [data-field="r"]').fill('6');
  await seite.locator('.electrical-actions [data-action="calculate"]').click();
  pruefe('Der sichtbare Rechner zeigt Ergebnis und Formel',
    /12\s*V/.test(await seite.locator('.electrical-output').innerText()) &&
    (await seite.locator('.electrical-output').innerText()).includes('U = I · R'));
  await seite.locator('.electrical-actions [data-action="insert"]').click();
  const inserted = await seite.evaluate((rootId: string) => Store.childrenOf(rootId)
    .find((block: any) => block.type === 'equation' && block.electricalCalculation?.fassung === 1),
  ausbildung.rootId);
  pruefe('Einfügen erzeugt einen normalen Formelblock mit Rechenprovenienz',
    inserted?.text === 'U = I · R = 12 V' && inserted?.electricalCalculation?.unit === 'V',
    JSON.stringify(inserted));
}

const lernpaket = await seite.evaluate(() => {
  let invalid = '';
  try {
    Electrical.installPackage({
      manifest: { id: 't202.invalid', version: '1.0.0', title: 'Ungültig', license: 'CC0', source: 'Test' },
      questions: [{ id: 'norm-1', topic: 'Norm', question: 'Behauptung?', options: ['A', 'B'],
        correct: 0, explanation: '', difficulty: 1, region: 'CH', norm: 'Beispielnorm',
        source: { title: 'Quelle ohne Ausgabe' } }]
    });
  } catch (error) { invalid = error instanceof Error ? error.message : String(error); }
  const first = Electrical.installPackage(Electrical.BASIC_PACKAGE);
  const second = Electrical.installPackage(Electrical.BASIC_PACKAGE);
  const cards = Object.values<any>(Store.cache.blocks)
    .filter(block => block.alive !== false && block.learningPackage?.packageId ===
      Electrical.BASIC_PACKAGE.manifest.id);
  return {
    invalid, first, second, expected: Electrical.BASIC_PACKAGE.questions.length,
    count: cards.length,
    valid: cards.every(card => card.type === 'flashcard' && card.learningPackage.license === 'CC0-1.0' &&
      card.quiz?.source?.title && card.quiz?.region === 'all' && card.quiz?.norm === null)
  };
});
pruefe('Normative Lernfrage ohne belegte Ausgabe wird abgelehnt',
  /belegte Ausgabe/.test(lernpaket.invalid), lernpaket.invalid);
gleich('Das versionierte Grundlagenpaket installiert und dedupliziert nach stabilem Schlüssel',
  [lernpaket.first.added, lernpaket.first.skipped, lernpaket.second.added,
    lernpaket.second.skipped, lernpaket.count],
  [lernpaket.expected, 0, 0, lernpaket.expected, lernpaket.expected]);
pruefe('Jede Paketfrage bleibt eine normale Karte mit Lizenz, Region, Normfeld und Quelle',
  lernpaket.valid);

/* ========================================================================== *
 * 7 · Mobiler Eingang und bewusst lokales OCR mit Provenienz
 * ======================================================================== */
console.log('\n7 · Originaltreue Erfassung und lokales OCR');

if (ausbildung) {
  const inbox = await seite.evaluate((rootId: string) => {
    const first = Recognition.capturePage();
    const second = Recognition.capturePage();
    return { first: first.id, second: second.id, parentId: first.parentId,
      captureInbox: first.captureInbox, systemRole: first.systemRole,
      count: Object.values<any>(Store.cache.blocks).filter(block => block.alive !== false &&
        block.type === 'page' && (block.captureInbox || block.systemRole === 'capture-inbox')).length,
      expectedParent: rootId };
  }, ausbildung.rootId);
  gleich('Der mobile Eingang ist idempotent und hängt im Ausbildungsbereich', inbox,
    { first: inbox.first, second: inbox.first, parentId: ausbildung.rootId,
      captureInbox: true, systemRole: 'capture-inbox', count: 1,
      expectedParent: ausbildung.rootId });
}

const cloudRejected = await seite.evaluate(async () => {
  Store.setMeta('ocr:localEndpoint', '');
  const oldQuestion = Dialog.frage;
  (Dialog as any).frage = async () => 'https://example.com/ocr';
  let result: string | null = null;
  try { result = await Recognition.configure(); }
  finally { (Dialog as any).frage = oldQuestion; }
  return { result, stored: Store.getMeta('ocr:localEndpoint', '') };
});
gleich('Die OCR-Konfiguration lehnt einen Cloud-Endpunkt ab', cloudRejected,
  { result: null, stored: '' });

const recognition = await seite.evaluate(async (ids: { pageId: string; sheetId: string }) => {
  Store.setMeta('ocr:localEndpoint', 'http://127.0.0.1:8765/ocr');
  Store.setMeta('ocr:language', 'deu');
  const original = Store.getBlock(ids.sheetId);
  const inkBefore = JSON.stringify(original.marken);
  const textBefore = original.suchtext;
  const oldChoice = Dialog.wahl;
  const oldFetch = window.fetch;
  const sent: Record<string, any> = {};
  (Dialog as any).wahl = async (options: any) =>
    options?.titel === 'Lokale Erkennung starten' ? 'send' : 'text';
  (window as any).fetch = async (input: any, init: any) => {
    sent.url = String(input);
    const form = init?.body as FormData;
    sent.method = init?.method;
    sent.kind = String(form?.get('kind') || '');
    sent.language = String(form?.get('language') || '');
    sent.fileType = (form?.get('file') as File | null)?.type || '';
    return new Response(JSON.stringify({
      text: 'T202 Handschrift U gleich R mal I', language: 'deu',
      engine: 't202-engine', version: '1', confidence: 0.92
    }), { status: 200, headers: { 'content-type': 'application/json' } });
  };
  try {
    await Recognition.fromSource(Store.getBlock(ids.pageId), original,
      { x: 0, y: 0, width: 595.28, height: 841.89 });
  } finally {
    (Dialog as any).wahl = oldChoice;
    (window as any).fetch = oldFetch;
  }
  const source = Store.getBlock(ids.sheetId);
  const region = Object.values<any>(source.ocrRegions || {})[0];
  const suggestion = Store.childrenOf(ids.pageId)
    .find((block: any) => block.recognitionSuggestion && block.sourceRef?.blockId === ids.sheetId);
  const oldCandidates = typeof Kontext !== 'undefined' ? Kontext.kandidaten : null;
  if (typeof Kontext !== 'undefined') (Kontext as any).kandidaten = () => null;
  const hits = Store.search('t202 handschrift');
  if (typeof Kontext !== 'undefined') (Kontext as any).kandidaten = oldCandidates;
  return {
    sent, inkSame: inkBefore === JSON.stringify(source.marken),
    textBefore, textAfter: source.suchtext, ocrText: source.ocrText,
    region, suggestion: suggestion && { type: suggestion.type, text: suggestion.text,
      sourceRef: suggestion.sourceRef, recognitionSuggestion: suggestion.recognitionSuggestion },
    searchHit: hits.some((hit: any) => hit.blockId === ids.sheetId && hit.page?.id === ids.pageId)
  };
}, dokument);
gleich('OCR sendet nur nach Zustimmung an den konfigurierten localhost-Endpunkt',
  recognition.sent, { url: 'http://127.0.0.1:8765/ocr', method: 'POST',
    kind: 'handwriting', language: 'deu', fileType: 'image/svg+xml' });
pruefe('Ink und vorhandener Suchtext bleiben bytegleich unangetastet',
  recognition.inkSame && recognition.textAfter === recognition.textBefore,
  JSON.stringify({ before: recognition.textBefore, after: recognition.textAfter }));
pruefe('Erkanntes liegt separat mit Engine, Version, Sprache, Vertrauen und Koordinatenraum',
  recognition.ocrText === 'T202 Handschrift U gleich R mal I' &&
  recognition.region?.coordinateSpace === 'sheet' && recognition.region?.engine === 't202-engine' &&
  recognition.region?.version === '1' && recognition.region?.language === 'deu' &&
  recognition.region?.confidence === 0.92 &&
  recognition.region?.endpoint === 'http://127.0.0.1:8765', JSON.stringify(recognition.region));
pruefe('Übernahme nach zweiter Bestätigung erzeugt einen normalen, quellverknüpften Textblock',
  recognition.suggestion?.type === 'text' && recognition.suggestion?.recognitionSuggestion === true &&
  recognition.suggestion?.sourceRef?.version === 1 &&
  recognition.suggestion?.sourceRef?.blockId === dokument.sheetId &&
  recognition.suggestion?.sourceRef?.region?.raumVersion === 1,
  JSON.stringify(recognition.suggestion));
pruefe('Die normale Redion-Suche findet OCR-Text am echten Quellblock', recognition.searchHit);

/* ========================================================================== *
 * 8 · Schul-Dashboard: nur eine Sicht auf normale vorhandene Daten
 * ======================================================================== */
console.log('\n8 · Ausbildungs-Dashboard aggregiert, ohne Daten zu duplizieren');

const bestandVorDashboard = await seite.evaluate(() => ({
  blocks: Object.values<any>(Store.cache.blocks).filter(block => block.alive !== false).length,
  collections: Object.keys(Store.cache.collections).length
}));
await seite.evaluate(() => Bibliothek.oeffne());
await seite.waitForSelector('.bib');
await seite.locator('[data-r="mehr"]').click();
const schoolChoice = seite.locator('[data-x="schule"]').last();
if (await schoolChoice.count()) {
  await schoolChoice.click();
  await seite.waitForSelector('.school-home');
}

const dashboard = await seite.evaluate(() => ({
  exists: !!document.querySelector('.school-home'),
  title: document.querySelector('.school-hero h1')?.textContent || '',
  headings: [...document.querySelectorAll<HTMLElement>('.school-home h2')].map(node => node.textContent || ''),
  quick: document.querySelectorAll('.school-quick [data-school-action]').length,
  folders: document.querySelectorAll('[data-school-open]').length,
  documents: document.querySelectorAll('[data-school-doc]').length,
  cards: document.querySelectorAll('[data-school-block]').length,
  exams: [...document.querySelectorAll<HTMLElement>('.school-card button')]
    .some(button => (button.textContent || '').includes('T202 Zwischenprüfung')),
  blocks: Object.values<any>(Store.cache.blocks).filter(block => block.alive !== false).length,
  collections: Object.keys(Store.cache.collections).length
}));
pruefe('Der Ausbildungsreiter öffnet das echte Schul-Dashboard',
  dashboard.exists && dashboard.title === 'T202 Ausbildung');
pruefe('Dashboard zeigt Ordner, PDFs, Tageslernen, Aufgaben und Prüfungen',
  ['Ordner & Bereiche', 'Zuletzt verwendete PDFs', 'Heute lernen', 'Offene Aufgaben', 'Nächste Prüfungen']
    .every(title => dashboard.headings.includes(title)) &&
  dashboard.quick === 3 && dashboard.folders >= 1 && dashboard.documents >= 1 &&
  dashboard.cards >= 1 && dashboard.exams, JSON.stringify(dashboard));
gleich('Das Öffnen des Dashboards legt keinen zweiten Datenbestand an',
  [dashboard.blocks, dashboard.collections],
  [bestandVorDashboard.blocks, bestandVorDashboard.collections]);

const dashboardGroessen: any[] = [];
for (const [width, height] of [[390, 844], [1440, 900]] as Array<[number, number]>) {
  await seite.setViewportSize({ width, height });
  await seite.waitForTimeout(90);
  dashboardGroessen.push(await seite.evaluate(() => {
    const home = document.querySelector<HTMLElement>('.school-home');
    return { width: Math.round(home?.getBoundingClientRect().width || 0), viewport: window.innerWidth,
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1 };
  }));
}
pruefe('Auch das Schul-Dashboard bleibt auf Mobil und Desktop im Seitenrahmen',
  dashboardGroessen.every(size => size.width > 0 && size.width <= size.viewport + 1 && !size.overflow),
  JSON.stringify(dashboardGroessen));

/* ========================================================================== *
 * 9 · Ergänzende Bau-/Sicherheitsinvarianten für Gerätepfade
 * ======================================================================== */
console.log('\n9 · Verdrahtung und Grenzen der Gerätepfade');

const html = fs.readFileSync(path.join(WURZEL, 'index.html'), 'utf8');
const serviceWorker = fs.readFileSync(path.join(WURZEL, 'src/dienst/sw.ts'), 'utf8');
const meetingSource = fs.readFileSync(path.join(WURZEL, 'src/bereiche/verbinden/besprechung.ts'), 'utf8');
const recognitionSource = fs.readFileSync(path.join(WURZEL, 'src/bereiche/dateien/recognition.ts'), 'utf8');
const neueModule = [
  'src/bereiche/pdf/document-mode.ts', 'src/bereiche/wissen/learning.ts',
  'src/bereiche/dateien/recognition.ts', 'src/bereiche/wissen/electrical.ts',
  'src/bereiche/wissen/bibliothek.ts'
].map(name => fs.readFileSync(path.join(WURZEL, name), 'utf8')).join('\n');
const skripte = [
  'quell/core/electrical/calculations.js', 'quell/bereiche/pdf/document-mode.js',
  'quell/bereiche/wissen/learning.js', 'quell/bereiche/dateien/recognition.js',
  'quell/bereiche/wissen/electrical.js', 'quell/bereiche/wissen/bibliothek.js'
];
pruefe('Alle neuen Laufzeitmodule sind in HTML und Offline-Cache verdrahtet',
  skripte.every(name => html.includes(name) && serviceWorker.includes('./' + name)),
  skripte.filter(name => !html.includes(name) || !serviceWorker.includes('./' + name)).join(', '));
pruefe('Neue Aufnahme geht als Blob in die bestehende Stückablage statt in eine Data-URL',
  /Dateien\.ablegen\(blob,/.test(meetingSource) && !/readAsDataURL/.test(meetingSource));
pruefe('OCR schreibt nur ocrRegions/ocrText und ersetzt keinen PDF-Suchtext',
  /Store\.updateBlock\(source\.id, \{ ocrRegions: regions, ocrText \}\)/.test(recognitionSource) &&
  !/Store\.updateBlock\(source\.id, \{[^}]*suchtext/s.test(recognitionSource));
pruefe('Dokument, Lernen, OCR, Rechner und Dashboard eröffnen keinen zweiten Speicher',
  !/indexedDB\.open|localStorage\.setItem|sessionStorage\.setItem/.test(neueModule));
gleich('Keine unbehandelten Seitenfehler im gesamten Rundlauf', seitenfehler, []);

await browser.close();
server.close();
console.log(`\nSuite 168 — Study Suite: ${ok} ok, ${offen} offen`);
process.exit(offen ? 1 : 0);
