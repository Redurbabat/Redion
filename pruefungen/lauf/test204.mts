/* Suite 170 — Masterauftrag: echte Lebenszyklen der Study Suite
 * ============================================================================
 * Eigenstaendiger Nachweis fuer Reload, Papierkorb, Sicherung, Offline-Datei-
 * bytes, mobile Dokument-Drawer, Zweitgeraete-Merge und Capture/OCR.
 *
 *   node pruefungen/lauf/test204.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8959;
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

const PNG = fs.readFileSync(path.join(WURZEL, 'oeffentlich/icons/icon-96.png'));
const browser = await chromium.launch();
const kontext = await browser.newContext({ viewport: { width: 1366, height: 768 } });
const seite = await kontext.newPage();
const seitenfehler: string[] = [];
seite.on('pageerror', error => seitenfehler.push(error.message));

try {
  await seite.goto(`http://localhost:${PORT}/index.html`);
  await seite.waitForFunction(() => typeof Store === 'object' &&
    typeof DocumentMode === 'object' && typeof Learning === 'object' &&
    typeof Recognition === 'object' && typeof Meeting === 'object');
  await seite.waitForTimeout(1800);
  await seite.evaluate(() => {
    Store.setMeta('rundgangGesehen', true);
    document.getElementById('rg-willkommen')?.remove();
    /* Und die Einrichtung der Hauptwelten: sie legt sich beim ersten Start
       über alles und fängt Klicks ab (E132). */
    document.querySelector('.produkt-onboarding-lage')?.remove();
    document.getElementById('rg-einladung')?.remove();
  });

  console.log('\n1 · Ink V2 ueberlebt einen echten Browser-Reload');
  const grundlage = await seite.evaluate(async (png: number[]) => {
    const inkPage = Store.addPage(null, { text: 'T204 Ink Lebenszyklus', icon: '✎' });
    const inkSheet = Store.addBlock(inkPage.id, 'blatt', {
      text: '', blattBreite: 595.28, blattHoehe: 841.89, raumVersion: 1,
      marken: [
        { id: 't204-stift', art: 'stift', farbe: '#25364a', breite: 2.4,
          pts: [[40, 80], [170, 104], [290, 92]], pressure: [0.2, 0.7, 0.4] },
        { id: 't204-marker', art: 'marker', farbe: '#f0b429', breite: 9,
          pts: [[70, 180], [310, 195]], pressure: [0.5, 0.8] },
        { id: 't204-rect', art: 'rectangle', farbe: '#315c9a', breite: 2,
          pts: [[90, 250], [330, 390]] },
        { id: 't204-text', art: 'text', farbe: '#1d2733', point: [110, 455],
          text: 'U = R · I', fontSize: 20 }
      ]
    });
    const docPage = Store.addPage(null, {
      text: 'T204 Dokument Lebenszyklus', icon: '📘', dokumentModus: true
    });
    const docSheet = Store.addBlock(docPage.id, 'blatt', {
      text: '', blattBreite: 595.28, blattHoehe: 841.89, raumVersion: 1,
      marken: [{ id: 't204-doc-ink', art: 'arrow', farbe: '#a33b20', breite: 3,
        pts: [[100, 120], [360, 230]] }]
    });
    const pdf = Store.addBlock(docPage.id, 'pdfseite', {
      text: '', nr: 2, vonSeiten: 2, bw: 595.28, bh: 841.89,
      raumVersion: 1, quelleId: 't204-pdf-original', suchtext: 'T204 PDF Quelle', marken: []
    });
    const bild = await Dateien.ablegen(
      new File([new Uint8Array(png)], 't204-pdf-seite.png', { type: 'image/png' }),
      { blockId: pdf.id, name: 't204-pdf-seite.png' });
    Store.updateBlock(pdf.id, { bildDateiId: bild.id });
    await Store.flush();
    App.oeffne(inkPage.id);
    return {
      inkPageId: inkPage.id, inkSheetId: inkSheet.id,
      docPageId: docPage.id, docSheetId: docSheet.id, pdfId: pdf.id,
      pdfImageId: bild.id,
      inkBefore: JSON.stringify(Store.getBlock(inkSheet.id).marken)
    };
  }, [...PNG]);

  await seite.reload();
  await seite.waitForFunction(() => typeof Store === 'object' && typeof DocumentMode === 'object');
  await seite.waitForTimeout(1200);
  await seite.evaluate((id: string) => App.oeffne(id), grundlage.inkPageId);
  await seite.waitForSelector('.blatt-papier');
  const inkNachReload = await seite.evaluate((ids: { page: string; sheet: string }) => ({
    pageAlive: Store.getBlock(ids.page)?.alive !== false,
    marken: JSON.stringify(Store.getBlock(ids.sheet)?.marken || []),
    arts: [...document.querySelectorAll<HTMLElement>('[data-ink-art]')]
      .map(node => node.dataset.inkArt).filter(Boolean)
  }), { page: grundlage.inkPageId, sheet: grundlage.inkSheetId });
  pruefe('Seite und Blatt kommen aus IndexedDB wieder', inkNachReload.pageAlive);
  gleich('Alle Ink-V2-Daten kommen bytegleich wieder', inkNachReload.marken, grundlage.inkBefore);
  pruefe('Stift, Marker, Rechteck und Text werden nach Reload wirklich gezeichnet',
    ['stift', 'marker', 'rectangle', 'text'].every(art => inkNachReload.arts.includes(art)),
    JSON.stringify(inkNachReload.arts));

  console.log('\n2 · Dokumentmodus bei 1366×768 und als mobiler Drawer');
  await seite.setViewportSize({ width: 1366, height: 768 });
  await seite.evaluate((id: string) => App.oeffne(id), grundlage.docPageId);
  await seite.waitForSelector('.document-workspace');
  const desktop = await seite.evaluate(() => {
    const workspace = document.querySelector<HTMLElement>('.document-workspace');
    const center = document.querySelector<HTMLElement>('.document-center');
    return {
      viewport: [window.innerWidth, window.innerHeight],
      workspace: workspace ? [Math.round(workspace.getBoundingClientRect().width),
        Math.round(workspace.getBoundingClientRect().height)] : [0, 0],
      center: center ? [Math.round(center.getBoundingClientRect().width),
        Math.round(center.getBoundingClientRect().height)] : [0, 0],
      fullPages: document.querySelectorAll('.document-stage > .blatt-huelle').length,
      overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
    };
  });
  gleich('Der Browser misst exakt 1366×768', desktop.viewport, [1366, 768]);
  pruefe('Arbeitsflaeche und Zentrum haben bei 1366×768 echte Ausdehnung',
    desktop.workspace[0]! > 800 && desktop.workspace[1]! > 400 &&
    desktop.center[0]! > 300 && desktop.center[1]! > 300, JSON.stringify(desktop));
  gleich('Auch hier wird nur eine volle Dokumentseite gerendert', desktop.fullPages, 1);
  pruefe('1366×768 erzeugt keinen horizontalen Seitenueberstand', !desktop.overflowX,
    JSON.stringify(desktop));

  await seite.setViewportSize({ width: 390, height: 844 });
  await seite.waitForTimeout(120);
  if (await seite.locator('.document-inspector.is-open [data-document-action="inspector-close"]').count())
    await seite.locator('.document-inspector.is-open [data-document-action="inspector-close"]').click();
  await seite.locator('.document-topbar [data-document-action="thumbnails"]').click();
  await seite.waitForSelector('.document-thumbnails.is-open');
  /* ERST ANKOMMEN LASSEN, DANN MESSEN. Seit dem Motion-Pass (6. September)
     kommt die Lade mit `studio-drawer` von links herein — 10 px, eine
     Fünftelsekunde. Gemessen unmittelbar nach dem Aufgehen stand sie bei
     -10, und das ist kein Aufbaufehler, sondern der Eintritt. Gewartet
     wird auf die Animation selbst, nicht auf eine geratene Zeit. */
  await seite.evaluate(async () => {
    const panel = document.querySelector<HTMLElement>('.document-thumbnails.is-open');
    await Promise.all((panel?.getAnimations?.() || []).map(a => a.finished.catch(() => undefined)));
  });
  const drawerOffen = await seite.evaluate(() => {
    const panel = document.querySelector<HTMLElement>('.document-thumbnails.is-open');
    const rect = panel?.getBoundingClientRect();
    return { open: !!panel, width: Math.round(rect?.width || 0), left: Math.round(rect?.left || 0),
      right: Math.round(rect?.right || 0), viewport: window.innerWidth };
  });
  pruefe('Die Seitenuebersicht oeffnet am Telefon als sichtbarer Drawer',
    drawerOffen.open && drawerOffen.width > 160 && drawerOffen.left >= -1 &&
    drawerOffen.right <= drawerOffen.viewport + 1, JSON.stringify(drawerOffen));
  await seite.locator('.document-thumbnails.is-open [data-document-action="thumbnails-close"]').click();
  gleich('Der mobile Drawer laesst sich wieder schliessen',
    await seite.locator('.document-thumbnails.is-open').count(), 0);
  await seite.locator('.document-topbar [data-document-action="inspector"]').click();
  await seite.waitForSelector('.document-inspector.is-open');
  const inspectorOffen = await seite.evaluate(() => {
    const panel = document.querySelector<HTMLElement>('.document-inspector.is-open');
    const rect = panel?.getBoundingClientRect();
    return { open: !!panel, width: Math.round(rect?.width || 0), left: Math.round(rect?.left || 0),
      right: Math.round(rect?.right || 0), actions: panel?.querySelectorAll('[data-document-action]').length || 0,
      viewport: window.innerWidth,
      overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1 };
  });
  pruefe('Auch der Inspector ist mobil ein bedienbarer Drawer',
    inspectorOffen.open && inspectorOffen.width > 180 && inspectorOffen.left >= -1 &&
    inspectorOffen.right <= inspectorOffen.viewport + 1 && inspectorOffen.actions >= 4 &&
    !inspectorOffen.overflowX, JSON.stringify(inspectorOffen));
  await seite.locator('.document-inspector.is-open [data-document-action="inspector-close"]').click();
  gleich('Der mobile Inspector laesst sich wieder schliessen',
    await seite.locator('.document-inspector.is-open').count(), 0);
  await seite.setViewportSize({ width: 1366, height: 768 });

  console.log('\n3 · Quellobjekte: anlegen, loeschen, zurueckholen und sichern');
  const region = { x: 0, y: 0, width: 595.28, height: 841.89 };
  const quellAktion = async (aktion: 'note' | 'task', text: string): Promise<void> => {
    await seite.evaluate(({ pageId, pdfId, area }) =>
      Learning.sourceMenu(Store.getBlock(pageId), Store.getBlock(pdfId), area),
    { pageId: grundlage.docPageId, pdfId: grundlage.pdfId, area: region });
    await seite.locator(`.lern [data-learning-action="${aktion}"]`).click();
    await seite.locator('.lern textarea').fill(text);
    await seite.locator('.lern [data-learning-action="save"]').click();
    await seite.waitForTimeout(100);
  };
  await quellAktion('note', 'T204 Notiz zum Schaltbild');
  await quellAktion('task', 'T204 Aufgabe pruefen');
  await seite.evaluate(({ pageId, pdfId, area }) =>
    Learning.sourceMenu(Store.getBlock(pageId), Store.getBlock(pdfId), area),
  { pageId: grundlage.docPageId, pdfId: grundlage.pdfId, area: region });
  await seite.locator('.lern [data-learning-action="link"]').click();
  await seite.waitForTimeout(100);
  await seite.evaluate(({ pageId, pdfId, area }) =>
    Learning.sourceMenu(Store.getBlock(pageId), Store.getBlock(pdfId), area),
  { pageId: grundlage.docPageId, pdfId: grundlage.pdfId, area: region });
  await seite.locator('.lern [data-learning-action="image"]').click();
  await seite.waitForFunction((pdfId: string) => Object.values<any>(Store.cache.blocks)
    .some(block => block.alive !== false && block.type === 'image' && block.dateiId &&
      block.sourceRef?.blockId === pdfId), grundlage.pdfId);

  const quellObjekte = await seite.evaluate((pdfId: string) => {
    const linked = Object.values<any>(Store.cache.blocks).filter(block =>
      block.alive !== false && block.sourceRef?.blockId === pdfId);
    const note = linked.find(block => block.type === 'text' && block.text === 'T204 Notiz zum Schaltbild');
    const task = linked.find(block => block.type === 'todo' && block.text === 'T204 Aufgabe pruefen');
    const link = linked.find(block => block.type === 'text' && block.text === '((' + pdfId + '))');
    const crop = linked.find(block => block.type === 'image' && block.dateiId);
    return {
      noteId: note?.id || '', taskId: task?.id || '', linkId: link?.id || '',
      cropId: crop?.id || '', cropFileId: crop?.dateiId || '',
      sourceRefs: [note, task, link, crop].map(block => block?.sourceRef || null),
      types: [note?.type, task?.type, link?.type, crop?.type]
    };
  }, grundlage.pdfId);
  gleich('Notiz, Aufgabe, Link und Bild sind normale Redion-Bloecke',
    quellObjekte.types, ['text', 'todo', 'text', 'image']);
  pruefe('Alle vier tragen denselben exakten PDF-Ausschnitt als sourceRef',
    quellObjekte.sourceRefs.every(ref => ref?.version === 1 &&
      ref.blockId === grundlage.pdfId && ref.pageId === grundlage.docPageId &&
      JSON.stringify(ref.region) === JSON.stringify(region)), JSON.stringify(quellObjekte.sourceRefs));
  pruefe('Der PDF-Crop hat eine eigene gespeicherte Datei',
    !!quellObjekte.cropId && !!quellObjekte.cropFileId);
  const papierkorb = await seite.evaluate((ids: string[]) => {
    ids.forEach(id => Store.trashBlock(id));
    const deleted = ids.map(id => Store.getBlock(id)?.alive === false);
    ids.forEach(id => Store.restoreBlock(id));
    const restored = ids.map(id => Store.getBlock(id)?.alive !== false);
    return { deleted, restored };
  }, [quellObjekte.noteId, quellObjekte.taskId, quellObjekte.linkId, quellObjekte.cropId]);
  pruefe('Alle vier Quellobjekte landen wirklich im Papierkorb', papierkorb.deleted.every(Boolean),
    JSON.stringify(papierkorb));
  pruefe('Alle vier kommen mit denselben IDs zurueck', papierkorb.restored.every(Boolean),
    JSON.stringify(papierkorb));
  const jsonRundlauf = await seite.evaluate(async (ids: string[]) => {
    const before = ids.map(id => JSON.stringify(Store.getBlock(id)));
    await Store.exportVorbereiten();
    const json = Store.exportAll();
    const parsed = JSON.parse(json);
    await Store.importAll(json, 'ersetzen');
    const after = ids.map(id => JSON.stringify(Store.getBlock(id)));
    return { same: JSON.stringify(before) === JSON.stringify(after), fehlt: parsed.fehlt };
  }, [quellObjekte.noteId, quellObjekte.taskId, quellObjekte.linkId, quellObjekte.cropId]);
  pruefe('Der JSON-Rundlauf behaelt alle vier Bloecke bytegleich', jsonRundlauf.same);
  pruefe('JSON sagt ehrlich, dass Datei-Bytes nicht darin liegen',
    jsonRundlauf.fehlt.includes('dateien') && jsonRundlauf.fehlt.includes('stuecke'),
    JSON.stringify(jsonRundlauf));

  console.log('\n4 · Lernstand ueberlebt Reload und Zweitgeraete-Merge');
  const lernen = await seite.evaluate(async (pageId: string) => {
    const pdf = Store.childrenOf(pageId).find((block: any) => block.type === 'pdfseite');
    const card = Store.addBlock(pageId, 'flashcard', {
      text: 'T204 Ohmsches Gesetz? :: U = R · I',
      sr: { ease: 2.5, intervall: 0, wdh: 0,
        faellig: new Date(Date.now() - 60000).toISOString() },
      sourceRef: { version: 1, kind: 'pdfseite', pageId, blockId: pdf?.id,
        pageNumber: 2, label: 'T204 Dokument Lebenszyklus', createdAt: Store.now() }
    });
    WissenDienst.planen(card, 4);
    await Store.flush();
    const current = Store.getBlock(card.id);
    return { id: card.id, sr: JSON.stringify(current.sr),
      log: JSON.stringify(Learning.reviewLog(current)) };
  }, grundlage.docPageId);
  await seite.reload();
  await seite.waitForFunction(() => typeof Learning === 'object' && typeof Zusammen === 'object');
  await seite.waitForTimeout(1100);
  const lernReload = await seite.evaluate((id: string) => {
    const card = Store.getBlock(id);
    return { exists: !!card && card.alive !== false, sr: JSON.stringify(card?.sr),
      log: JSON.stringify(Learning.reviewLog(card)),
      inCards: Learning.cards().some((x: any) => x.id === id) };
  }, lernen.id);
  pruefe('Die Lernkarte kommt nach echtem Reload aus dem Store', lernReload.exists && lernReload.inCards);
  gleich('SM-2-Termin und Wiederholungsverlauf bleiben bytegleich',
    [lernReload.sr, lernReload.log], [lernen.sr, lernen.log]);
  const geraeteMerge = await seite.evaluate((id: string) => {
    const basis = JSON.parse(JSON.stringify(Store.getBlock(id)));
    const existing = Object.values<any>(basis.reviewVerlauf || {})[0];
    const local = JSON.parse(JSON.stringify(basis));
    const remote = JSON.parse(JSON.stringify(basis));
    local.reviewVerlauf['t204-local'] = {
      id: 't204-local', version: 1, at: '2026-08-23T08:00:00.000Z',
      rating: 3, algorithm: 'sm2', lapse: false
    };
    remote.reviewVerlauf['t204-remote'] = {
      id: 't204-remote', version: 1, at: '2026-08-23T09:00:00.000Z',
      rating: 2, algorithm: 'sm2', lapse: true
    };
    local.quiz = { topic: 'T204 Elektrotechnik' };
    remote.sourceNote = 'Zweitgeraet';
    const merged = Zusammen.dreiWege(basis, local, remote);
    Store.updateBlock(id, merged.satz);
    const saved = Store.getBlock(id);
    return {
      conflicts: merged.konflikte.length,
      ids: Object.keys(saved.reviewVerlauf || {}).sort(),
      logIds: Learning.reviewLog(saved).map((entry: any) => entry.id).sort(),
      topic: saved.quiz?.topic, sourceNote: saved.sourceNote,
      firstId: existing?.id || ''
    };
  }, lernen.id);
  pruefe('Beide Geraete-Wiederholungen und der alte Eintrag bleiben erhalten',
    geraeteMerge.ids.includes(geraeteMerge.firstId) && geraeteMerge.ids.includes('t204-local') &&
    geraeteMerge.ids.includes('t204-remote') &&
    JSON.stringify(geraeteMerge.ids) === JSON.stringify(geraeteMerge.logIds),
    JSON.stringify(geraeteMerge));
  gleich('Verschiedene Geraetefelder gehen ohne Konflikt zusammen',
    [geraeteMerge.conflicts, geraeteMerge.topic, geraeteMerge.sourceNote],
    [0, 'T204 Elektrotechnik', 'Zweitgeraet']);

  console.log('\n5 · Mehrere MB Audio bleiben lokal, suchbar und abspielbar');
  const audio = await seite.evaluate(async (parentId: string) => {
    App.oeffne(parentId);
    Store.setMeta('meet:audio', true); Store.setMeta('meet:transkriptWeg', false);
    const dataSize = 3 * 1024 * 1024 + 44100;
    const bytes = new Uint8Array(44 + dataSize);
    const view = new DataView(bytes.buffer);
    const text = (offset: number, value: string): void => {
      for (let i = 0; i < value.length; i++) bytes[offset + i] = value.charCodeAt(i);
    };
    text(0, 'RIFF'); view.setUint32(4, 36 + dataSize, true); text(8, 'WAVE');
    text(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true);
    view.setUint16(22, 1, true); view.setUint32(24, 44100, true);
    view.setUint32(28, 88200, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true);
    text(36, 'data'); view.setUint32(40, dataSize, true);
    const stored = await Meeting.audioAblegen(new Blob([bytes], { type: 'audio/wav' }), 36,
      [{ sek: 7, text: 'T204 echte Seek-Marke' }]);
    const meetingPage = Meeting.seiteAnlegen({ titel: 'T204 Audio Lebenszyklus', beteiligte: [],
      zusammenfassung: [], entscheidungen: [], aufgaben: [], themen: [] },
    '[00:07] T204 Transkript-Marke', 36, stored);
    const audioBlock = Store.childrenOf(meetingPage.id).find((block: any) => block.type === 'audio');
    const blob = await Dateien.alsBlob(stored.dateiId);
    const raw = blob ? new Uint8Array(await blob.arrayBuffer()) : new Uint8Array();
    let checksum = 7;
    for (const value of raw) checksum = (checksum * 31 + value) % 1000000007;
    await Store.flush();
    return { pageId: meetingPage.id, blockId: audioBlock?.id || '', fileId: stored.dateiId,
      bytes: raw.length, checksum };
  }, grundlage.docPageId);
  pruefe('Der Mitschnitt ist wirklich groesser als drei MB und in mehreren Stuecken',
    audio.bytes > 3 * 1024 * 1024, String(audio.bytes));
  await seite.reload();
  await seite.waitForFunction(() => typeof Meeting === 'object' && typeof Dateien === 'object');
  await seite.waitForTimeout(1100);
  await seite.evaluate((id: string) => App.oeffne(id), audio.pageId);
  await seite.waitForFunction((id: string) => {
    const player = document.querySelector<HTMLAudioElement>(`audio[data-audio-block="${id}"]`);
    return !!player?.src && player.src.startsWith('blob:');
  }, audio.blockId);
  const audioReload = await seite.evaluate(async (id: string) => {
    const blob = await Dateien.alsBlob(id);
    const raw = blob ? new Uint8Array(await blob.arrayBuffer()) : new Uint8Array();
    let checksum = 7;
    for (const value of raw) checksum = (checksum * 31 + value) % 1000000007;
    const record = await Store.dateiHolen(id);
    return { bytes: raw.length, checksum, parts: record?.teile || 0 };
  }, audio.fileId);
  gleich('Reload baut aus allen Audio-Stuecken wieder dieselben Bytes',
    [audioReload.bytes, audioReload.checksum], [audio.bytes, audio.checksum]);
  pruefe('Die Audio-Datei liegt tatsaechlich in mehreren IndexedDB-Stuecken',
    audioReload.parts >= 4, JSON.stringify(audioReload));
  await kontext.setOffline(true);
  await seite.evaluate(({ pageId, fileId }) => {
    Dateien.adresseWeg(fileId); App.oeffne(pageId); App.zeichneSeite();
  }, { pageId: audio.pageId, fileId: audio.fileId });
  await seite.waitForFunction((id: string) => {
    const player = document.querySelector<HTMLAudioElement>(`audio[data-audio-block="${id}"]`);
    return !!player?.src && player.src.startsWith('blob:');
  }, audio.blockId);
  await seite.locator('.audio-ref-marke').first().click();
  await seite.waitForFunction((id: string) => {
    const player = document.querySelector<HTMLAudioElement>(`audio[data-audio-block="${id}"]`);
    return !!player && player.currentTime >= 6.5;
  }, audio.blockId, { timeout: 10000 });
  const offlineSeek = await seite.evaluate(async ({ blockId, fileId }) => {
    const player = document.querySelector<HTMLAudioElement>(`audio[data-audio-block="${blockId}"]`);
    player?.pause();
    const blob = await Dateien.alsBlob(fileId);
    return { time: player?.currentTime || 0, src: player?.src || '', bytes: blob?.size || 0,
      online: navigator.onLine };
  }, { blockId: audio.blockId, fileId: audio.fileId });
  pruefe('Der echte Zeitmarken-Klick springt offline auf Sekunde sieben',
    !offlineSeek.online && offlineSeek.time >= 6.5 && offlineSeek.time < 9 &&
    offlineSeek.src.startsWith('blob:'), JSON.stringify(offlineSeek));
  gleich('Auch offline sind noch alle Datei-Bytes da', offlineSeek.bytes, audio.bytes);
  await kontext.setOffline(false);
  const audioPapierkorb = await seite.evaluate(async ({ blockId, fileId }) => {
    Store.trashBlock(blockId);
    const deleted = Store.getBlock(blockId)?.alive === false;
    const whileDeleted = await Dateien.alsBlob(fileId);
    Store.restoreBlock(blockId);
    const restored = Store.getBlock(blockId)?.alive !== false;
    const after = await Dateien.alsBlob(fileId);
    return { deleted, restored, bytesDeleted: whileDeleted?.size || 0, bytesAfter: after?.size || 0 };
  }, { blockId: audio.blockId, fileId: audio.fileId });
  gleich('Papierkorb und Restore lassen die Audio-Bytes vollstaendig stehen', audioPapierkorb,
    { deleted: true, restored: true, bytesDeleted: audio.bytes, bytesAfter: audio.bytes });

  console.log('\n6 · Capture-Dateiinput und OCR-Formelvorschlag');
  const chooserPromise = seite.waitForEvent('filechooser');
  await seite.evaluate(() => Recognition.scan());
  const chooser = await chooserPromise;
  const captureVertrag = await chooser.element().evaluate((input: HTMLInputElement) => ({
    type: input.type, accept: input.accept, capture: input.getAttribute('capture'), multiple: input.multiple
  }));
  gleich('Der Hardwarevertrag ist ein echter Mehrfach-Dateiinput mit Rueckkamera', captureVertrag,
    { type: 'file', accept: 'image/*,application/pdf', capture: 'environment', multiple: true });
  await chooser.setFiles({ name: 't204-kamera.png', mimeType: 'image/png', buffer: PNG });
  await seite.waitForFunction(() => Object.values<any>(Store.cache.blocks).some(block =>
    block.alive !== false && block.type === 'image' && block.capture?.originalName === 't204-kamera.png' &&
    !!block.dateiId));
  const scan = await seite.evaluate(async () => {
    const block = Object.values<any>(Store.cache.blocks).find(candidate =>
      candidate.alive !== false && candidate.type === 'image' &&
      candidate.capture?.originalName === 't204-kamera.png' && candidate.dateiId);
    const page = block ? Links.seiteVon(block.id) : null;
    const blob = block ? await Dateien.alsBlob(block.dateiId) : null;
    return { id: block?.id || '', pageId: page?.id || '', fileId: block?.dateiId || '',
      bytes: blob?.size || 0, type: blob?.type || '', capture: block?.capture || null };
  });
  pruefe('Die gewaehlte Kameradatei liegt unveraendert im normalen Dateispeicher',
    !!scan.id && !!scan.pageId && scan.bytes === PNG.length && scan.type === 'image/png' &&
    scan.capture?.fassung === 1, JSON.stringify(scan));
  const ocrFormel = await seite.evaluate(async ({ blockId, pageId }) => {
    Store.setMeta('ocr:localEndpoint', 'http://127.0.0.1:8765/ocr');
    Store.setMeta('ocr:language', 'deu');
    const source = Store.getBlock(blockId), page = Store.getBlock(pageId);
    const oldChoice = Dialog.wahl, oldFetch = window.fetch;
    const sent: Record<string, string> = {};
    (Dialog as any).wahl = async (options: any) =>
      options?.titel === 'Lokale Erkennung starten' ? 'send' : 'equation';
    (window as any).fetch = async (input: any, init: any) => {
      const form = init?.body as FormData;
      sent.url = String(input); sent.method = String(init?.method || '');
      sent.kind = String(form?.get('kind') || '');
      sent.fileType = (form?.get('file') as File | null)?.type || '';
      return new Response(JSON.stringify({ text: 'U = R \\cdot I', language: 'deu',
        engine: 't204-local', version: '1.0', confidence: 0.97 }),
      { status: 200, headers: { 'content-type': 'application/json' } });
    };
    try { await Recognition.fromImageBlock(page, source); }
    finally { (Dialog as any).wahl = oldChoice; (window as any).fetch = oldFetch; }
    const equation = Store.childrenOf(pageId).find((block: any) => block.type === 'equation' &&
      block.recognitionSuggestion === true && block.sourceRef?.blockId === blockId);
    return { sent, equation: equation && { id: equation.id, type: equation.type,
      text: equation.text, suggestion: equation.recognitionSuggestion, sourceRef: equation.sourceRef },
      ocrText: Store.getBlock(blockId)?.ocrText || '' };
  }, { blockId: scan.id, pageId: scan.pageId });
  gleich('OCR bekommt nur das vorbereitete Bild am konfigurierten localhost', ocrFormel.sent,
    { url: 'http://127.0.0.1:8765/ocr', method: 'POST', kind: 'document', fileType: 'image/webp' });
  pruefe('Die zweite echte Auswahl erzeugt einen normalen Equation-Vorschlag',
    ocrFormel.equation?.type === 'equation' && ocrFormel.equation?.text === 'U = R \\cdot I' &&
    ocrFormel.equation?.suggestion === true && ocrFormel.equation?.sourceRef?.version === 1 &&
    ocrFormel.equation?.sourceRef?.blockId === scan.id && ocrFormel.ocrText === 'U = R \\cdot I',
    JSON.stringify(ocrFormel));

  console.log('\n7 · Vollstaendiges Backup/Restore mit denselben IDs und Datei-Bytes');
  const sicherung = await seite.evaluate(async (ziel: {
    inkPageId: string; inkSheetId: string; pdfId: string;
    noteId: string; taskId: string; linkId: string; cropId: string; cropFileId: string;
    cardId: string; audioBlockId: string; audioFileId: string;
    scanFileId: string; equationId: string;
  }) => {
    await Store.exportVorbereiten();
    const records = (await Store.dateiAlle()).filter((record: any) => !record.abgeleitet);
    const entries: any[] = [{ name: 'daten.json', inhalt: Store.exportAll(true) }];
    const mapping: Record<string, string> = {};
    for (const record of records) {
      const blob = await Dateien.alsBlob(record.id);
      if (!blob) throw new Error('Datei fehlt vor der Sicherung: ' + record.id);
      const archiveName = 'dateien/' + record.id + '.bin';
      mapping[record.id] = archiveName;
      entries.push({ name: archiveName, inhalt: blob });
    }
    entries.push({ name: 'dateien.json', inhalt: JSON.stringify({ version: 1, records, mapping }) });
    const archive = await Austausch.zipSchreiben(entries);
    const checksum = async (id: string): Promise<{ bytes: number; sum: number }> => {
      const blob = await Dateien.alsBlob(id);
      const bytes = blob ? new Uint8Array(await blob.arrayBuffer()) : new Uint8Array();
      let sum = 7;
      for (const value of bytes) sum = (sum * 31 + value) % 1000000007;
      return { bytes: bytes.length, sum };
    };
    const expected = {
      ink: JSON.stringify(Store.getBlock(ziel.inkSheetId)?.marken || []),
      sourceObjects: [ziel.noteId, ziel.taskId, ziel.linkId, ziel.cropId]
        .map(id => JSON.stringify(Store.getBlock(id))),
      learning: JSON.stringify(Store.getBlock(ziel.cardId)),
      equation: JSON.stringify(Store.getBlock(ziel.equationId)),
      files: {
        pdf: await checksum(Store.getBlock(ziel.pdfId)?.bildDateiId),
        crop: await checksum(ziel.cropFileId), audio: await checksum(ziel.audioFileId),
        scan: await checksum(ziel.scanFileId)
      }, archiveBytes: archive.size, archivedFiles: records.length
    };
    Store.trashBlock(ziel.inkPageId); Store.trashBlock(ziel.cardId);
    Store.trashBlock(ziel.audioBlockId); Store.updateBlock(ziel.noteId, { text: 'BESCHAEDIGT' });
    for (const id of [ziel.cropFileId, ziel.audioFileId, ziel.scanFileId,
      Store.getBlock(ziel.pdfId)?.bildDateiId].filter(Boolean)) await Dateien.weg(id);
    await Store.flush();
    const zip = await Einlesen.zipLesenAusBlob(archive);
    if (!zip) throw new Error('Das selbst geschriebene Redion-Archiv ist nicht lesbar.');
    await Store.importAll((await zip.text('daten.json')) || '', 'ersetzen');
    const manifest = JSON.parse((await zip.text('dateien.json')) || '{}');
    for (const record of manifest.records || []) {
      const blob = await zip.alsBlob(manifest.mapping?.[record.id]);
      if (!blob) throw new Error('Archivdatei fehlt: ' + record.id);
      Dateien.adresseWeg(record.id);
      for (const old of await Store.stueckeVon(record.id)) await Store.stueckWeg(old.id);
      const parts = Math.max(1, Math.ceil(blob.size / Dateien.STUECK));
      for (let nr = 0; nr < parts; nr++) {
        const start = nr * Dateien.STUECK;
        await Store.stueckPut({ id: record.id + ':' + nr, dateiId: record.id, nr,
          blob: blob.slice(start, Math.min(start + Dateien.STUECK, blob.size)) });
      }
      await Store.dateiPut({ ...record, teile: parts, angekommen: parts,
        zustand: 'fertig', groesse: blob.size });
    }
    await Store.flush();
    return expected;
  }, {
    inkPageId: grundlage.inkPageId, inkSheetId: grundlage.inkSheetId, pdfId: grundlage.pdfId,
    noteId: quellObjekte.noteId, taskId: quellObjekte.taskId, linkId: quellObjekte.linkId,
    cropId: quellObjekte.cropId, cropFileId: quellObjekte.cropFileId,
    cardId: lernen.id, audioBlockId: audio.blockId, audioFileId: audio.fileId,
    scanFileId: scan.fileId, equationId: ocrFormel.equation?.id || ''
  });
  pruefe('Das `.redion`-nahe ZIP enthaelt mehrere MB und alle echten Dateien',
    sicherung.archiveBytes > 3 * 1024 * 1024 && sicherung.archivedFiles >= 4,
    JSON.stringify({ bytes: sicherung.archiveBytes, files: sicherung.archivedFiles }));
  await seite.reload();
  await seite.waitForFunction(() => typeof Store === 'object' && typeof Learning === 'object');
  await seite.waitForTimeout(1200);
  const nachSicherung = await seite.evaluate(async (ziel: {
    inkPageId: string; inkSheetId: string; noteId: string; taskId: string; linkId: string;
    cropId: string; cropFileId: string; cardId: string; audioBlockId: string;
    audioFileId: string; scanFileId: string; equationId: string;
  }) => {
    const checksum = async (id: string): Promise<{ bytes: number; sum: number }> => {
      const blob = await Dateien.alsBlob(id);
      const bytes = blob ? new Uint8Array(await blob.arrayBuffer()) : new Uint8Array();
      let sum = 7;
      for (const value of bytes) sum = (sum * 31 + value) % 1000000007;
      return { bytes: bytes.length, sum };
    };
    const crop = Store.getBlock(ziel.cropId);
    const pdf = crop?.sourceRef ? Store.getBlock(crop.sourceRef.blockId) : null;
    return {
      alive: [ziel.inkPageId, ziel.cardId, ziel.audioBlockId, ziel.noteId,
        ziel.taskId, ziel.linkId, ziel.cropId, ziel.equationId]
        .map(id => Store.getBlock(id)?.alive !== false),
      ink: JSON.stringify(Store.getBlock(ziel.inkSheetId)?.marken || []),
      sourceObjects: [ziel.noteId, ziel.taskId, ziel.linkId, ziel.cropId]
        .map(id => JSON.stringify(Store.getBlock(id))),
      learning: JSON.stringify(Store.getBlock(ziel.cardId)),
      equation: JSON.stringify(Store.getBlock(ziel.equationId)),
      learningLog: Learning.reviewLog(Store.getBlock(ziel.cardId)).map((entry: any) => entry.id).sort(),
      files: { pdf: await checksum(pdf?.bildDateiId), crop: await checksum(ziel.cropFileId),
        audio: await checksum(ziel.audioFileId), scan: await checksum(ziel.scanFileId) }
    };
  }, {
    inkPageId: grundlage.inkPageId, inkSheetId: grundlage.inkSheetId,
    noteId: quellObjekte.noteId, taskId: quellObjekte.taskId, linkId: quellObjekte.linkId,
    cropId: quellObjekte.cropId, cropFileId: quellObjekte.cropFileId,
    cardId: lernen.id, audioBlockId: audio.blockId, audioFileId: audio.fileId,
    scanFileId: scan.fileId, equationId: ocrFormel.equation?.id || ''
  });
  pruefe('Nach Backup, Loeschen, Restore und Reload sind alle Zielbloecke wieder lebendig',
    nachSicherung.alive.every(Boolean), JSON.stringify(nachSicherung.alive));
  gleich('Ink V2 ist nach dem vollstaendigen Backup bytegleich', nachSicherung.ink, sicherung.ink);
  gleich('Notiz, Aufgabe, Link und PDF-Crop sind nach `.redion` bytegleich',
    nachSicherung.sourceObjects, sicherung.sourceObjects);
  gleich('Lerntermin und additiver Zweitgeraete-Verlauf sind nach Backup bytegleich',
    nachSicherung.learning, sicherung.learning);
  pruefe('Alle drei Lern-Reviews sind nach Restore weiterhin auswertbar',
    nachSicherung.learningLog.includes('t204-local') &&
    nachSicherung.learningLog.includes('t204-remote') && nachSicherung.learningLog.length >= 3,
    JSON.stringify(nachSicherung.learningLog));
  gleich('Der OCR-Equation-Vorschlag bleibt ebenfalls bytegleich',
    nachSicherung.equation, sicherung.equation);
  gleich('PDF, Crop, Mehr-MB-Audio und Kameraoriginal kommen bytegleich zurueck',
    nachSicherung.files, sicherung.files);
  gleich('Keine unbehandelten Browserfehler im Lebenszyklus', seitenfehler, []);
} catch (error) {
  offen++;
  console.log('  ✗ Unerwarteter Abbruch — ' +
    (error instanceof Error ? error.stack || error.message : String(error)));
} finally {
  try { await kontext.setOffline(false); } catch { /* Kontext kann schon zu sein. */ }
  await browser.close();
  await new Promise<void>(resolve => server.close(() => resolve()));
}

console.log(`\nSuite 170 — Lebenszyklen: ${ok} ok, ${offen} offen`);
process.exitCode = offen ? 1 : 0;
