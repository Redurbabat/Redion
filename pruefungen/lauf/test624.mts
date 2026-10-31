/* Suite 624 — der Alltag: Ortswechsel, Schreibbegleiter, Vortrag, Notizen
 * ============================================================================
 * Redur, 31. Oktober 2026: Animationen und Übergänge überall, besser schreiben,
 * besser präsentieren. Diese Suite prüft die erste Welle an der echten App.
 *
 *   §1 Eine geöffnete Seite kommt an, auf der Feder der Schale; bei „Ruhig"
 *      bewegt sich nichts.
 *   §2 Der Fokus-Modus zeigt die Wortzahl und räumt sie wieder weg.
 *   §3 Die Schreibzeile bleibt im Fokus-Modus auf Augenhöhe.
 *   §4 Der Übergang lässt sich wählen und läuft im Vortrag.
 *   §5 Sprechernotizen: geschrieben, gespeichert, im Vortrag erst auf Wunsch.
 *   §6 Sprechernotizen aus einer .pptx, nur der Platzhalter `body`.
 *   §7 Der Stift hat auf der Tafel Druck; Maus und alte Striche bleiben gleich.
 *   §8 Eine eigene Folie kommt mit Inhalt, Notiz und Übergang in die .pptx.
 *   §9 Eine fremde .pptx nimmt geänderte Notiz und gewählten Übergang auf.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ──────────────────────────────────
 *   §1 → den Aufruf `seiteKommtAn()` entfernen.
 *   §3 → `mitfuehren` nicht mehr anhängen.
 *   §5 → `notizenSichtbar` mit true beginnen lassen.
 *   §6 → die Prüfung `type !== 'body'` entfernen.
 *   §7 → die Abfrage `mitDruck` immer falsch machen.
 *   §8 → `eintrag.formen` nicht setzen: die Folie trägt wieder nur „[A4-Blatt]".
 *   §9 → `notizZurueck` nicht aufrufen.
 * Alle sieben sind am 31. Oktober 2026 von Hand gedreht und rot gesehen worden,
 * siehe `messungen.md`.
 *
 *   node pruefungen/lauf/test624.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

declare const Store: any;
declare const App: any;
declare const Einlesen: any;
declare const Austausch: any;
declare const Werkzeuge: any;
declare const Folienvorlagen: any;

const root = path.resolve(import.meta.dirname, '../..');
const TYPEN: Record<string, string> = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png' };
const server = http.createServer((req, res) => {
  const datei = path.resolve(root, '.' + decodeURIComponent((req.url || '/').split('?')[0]!.replace(/\/$/, '/index.html')));
  if (!datei.startsWith(root + path.sep) || !fs.existsSync(datei) || !fs.statSync(datei).isFile()) { res.writeHead(404); res.end(); return; }
  res.setHeader('Content-Type', TYPEN[path.extname(datei)] || 'application/octet-stream');
  res.end(fs.readFileSync(datei));
});
await new Promise<void>(ok => server.listen(0, '127.0.0.1', ok));
const url = `http://127.0.0.1:${(server.address() as any).port}/index.html`;

let fehler = 0, gut = 0;
const pruefe = (name: string, ok: boolean, info: unknown = ''): void => {
  if (ok) { gut++; console.log('  ok  ' + name); }
  else { fehler++; console.log('  ROT ' + name + ' ' + JSON.stringify(info)); }
};

const browser = await chromium.launch();
try {
  const seite = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const pageFehler: string[] = [];
  seite.on('pageerror', e => pageFehler.push(e.message));
  await seite.goto(url);
  await seite.waitForFunction('typeof App !== "undefined" && typeof Store !== "undefined" && Store.cache');
  await seite.waitForTimeout(800);
  await seite.evaluate(() => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay, #rg-willkommen').forEach(n => n.remove());
  });

  /* §1 */
  const einzug = (): Promise<boolean> => seite.evaluate(() => {
    const a = Store.addPage(null, { text: 'Ort ' + Math.random() });
    App.oeffne(a.id);
    return document.getElementById('page')!.getAnimations().some(l => l.id === 'seite-kommt-an');
  });
  pruefe('§1 eine geöffnete Seite kommt an', await einzug());
  await seite.waitForTimeout(1500); /* die Feder der ersten Bewegung ausklingen lassen */
  await seite.evaluate(() => { document.body.dataset['bewegung'] = 'ruhig'; });
  pruefe('§1 bei „Ruhig" bewegt sich nichts', !(await einzug()));
  await seite.evaluate(() => { delete document.body.dataset['bewegung']; });

  /* §2 und §3: eine lange Seite, geschrieben wird am Ende */
  const seitenId = await seite.evaluate(() => {
    const p = Store.addPage(null, { text: 'Lang' });
    for (let i = 0; i < 80; i++) Store.addBlock(p.id, 'text', { text: 'Zeile ' + i + ' mit vier Wörtern' });
    App.oeffne(p.id);
    return p.id;
  });
  await seite.waitForTimeout(400);
  await seite.evaluate(() => Werkzeuge.fokus(true));
  const pille = await seite.locator('.fokus-zaehler').textContent();
  pruefe('§2 die Pille nennt Wörter', /\d+ Wörter · \d+ min/.test(pille || ''), pille);
  const sichtbar = (s: string): Promise<number> => seite.locator(s).evaluateAll(l => l.filter(e => (e as HTMLElement).offsetParent !== null).length);
  pruefe('§2 Fokus heisst: nur das Blatt', await sichtbar('#kante, .pg-ansichten, .pg-tools') === 0, await sichtbar('#kante, .pg-ansichten, .pg-tools'));
  /* Eine Zeile WEIT UNTEN im Bild, mitten im Text: ohne Begleiter bliebe sie
     dort stehen. Die letzte Zeile der Seite taugt nicht, sie zu erreichen
     rollt schon der Browser, und der Lauf wäre aus dem falschen Grund grün. */
  const tief = await seite.evaluate(() => {
    const alle = [...document.querySelectorAll<HTMLElement>('#page [contenteditable]')];
    const ziel = alle.find(k => { const r = k.getBoundingClientRect(); return r.top > innerHeight * 0.75 && r.bottom < innerHeight - 10; });
    if (!ziel) return null;
    const r = ziel.getBoundingClientRect();
    return { x: r.left + 20, y: r.top + r.height / 2, anteil: r.top / innerHeight };
  });
  pruefe('§3 die Probe beginnt unten im Bild', !!tief && tief.anteil > 0.7, tief);
  await seite.mouse.click(tief!.x, tief!.y);
  await seite.waitForTimeout(100);
  await seite.keyboard.type('x');
  await seite.waitForTimeout(700);
  const lage = await seite.evaluate(() => {
    const s = getSelection()!;
    const r = s.getRangeAt(0).getClientRects()[0] || (s.anchorNode as any).parentElement.getBoundingClientRect();
    return r.top / innerHeight;
  });
  pruefe('§3 die Schreibzeile steht auf Augenhöhe', lage > 0.3 && lage < 0.55, lage);
  await seite.locator('.fokus-fertig').click();
  pruefe('§2 „Fertig" beendet, die Pille ist weg', await seite.locator('.fokus-zaehler').count() === 0 &&
    !(await seite.evaluate(() => document.body.classList.contains('fokus'))));
  /* Am Telefon: die Pille liegt obenauf, „Fertig" misst 44 px, die Leiste ist fort. */
  await seite.setViewportSize({ width: 390, height: 844 });
  await seite.waitForTimeout(200);
  await seite.evaluate(() => Werkzeuge.fokus(true));
  await seite.waitForTimeout(200);
  const telefon = await seite.evaluate(() => {
    const k = document.querySelector('.fokus-fertig') as HTMLElement;
    const r = k.getBoundingClientRect();
    const oben = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    const leiste = document.getElementById('handy-oben');
    return { h: r.height, b: r.width, trifft: oben === k, leiste: !!leiste && leiste.offsetParent !== null };
  });
  pruefe('§2 am Telefon erreichbar und ohne Leiste', telefon.h >= 44 && telefon.b >= 44 && telefon.trifft && !telefon.leiste, telefon);
  await seite.evaluate(() => Werkzeuge.fokus(false));
  await seite.setViewportSize({ width: 1280, height: 800 });
  await seite.waitForTimeout(200);
  void seitenId;

  /* §4 und §5: ein Foliensatz */
  const satz = await seite.evaluate(() => {
    const p = Store.addPage(null, { text: 'Vortrag', dokumentModus: true });
    for (const titel of ['Eins', 'Zwei']) {
      Store.addBlock(p.id, 'blatt', { blattBreite: 960, blattHoehe: 540, marken: [{ id: titel, art: 'text', x: 10, y: 10, w: 300, h: 60, text: titel }] });
    }
    App.oeffne(p.id);
    return p.id;
  });
  await seite.waitForTimeout(500);
  const eintraege = await seite.evaluate(() => Folienvorlagen.bandEintraege().map((e: any) => e.id));
  pruefe('§4 Übergang und Notizen stehen im Band', eintraege.includes('pv-uebergang') && eintraege.includes('pv-notizen'), eintraege);

  await seite.evaluate(() => Folienvorlagen.bandEintraege().find((e: any) => e.id === 'pv-uebergang').tun());
  await seite.getByRole('button', { name: /Schieben/ }).click();
  await seite.waitForTimeout(200);
  const gesetzt = await seite.evaluate((id: string) =>
    Store.childrenOf(id).filter((b: any) => b.type === 'blatt').map((b: any) => b.uebergang?.art), satz);
  pruefe('§4 der Übergang steht an allen Folien', gesetzt.length === 2 && gesetzt.every((a: string) => a === 'schieben'), gesetzt);

  await seite.evaluate(() => Folienvorlagen.bandEintraege().find((e: any) => e.id === 'pv-notizen').tun());
  await seite.locator('textarea').last().fill('Mit der Frage beginnen');
  await seite.keyboard.press('Control+Enter');
  await seite.waitForTimeout(200);
  const notiz = await seite.evaluate((id: string) =>
    Store.childrenOf(id).filter((b: any) => b.type === 'blatt').map((b: any) => b.notizen || ''), satz);
  pruefe('§5 die Notiz steht an der offenen Folie', notiz.filter(Boolean).length === 1 && notiz.includes('Mit der Frage beginnen'), notiz);
  /* Damit der Vortrag sie auf der ersten Folie zeigt, unabhängig vom Merker. */
  await seite.evaluate((id: string) => {
    const f = Store.childrenOf(id).filter((b: any) => b.type === 'blatt');
    Store.updateBlock(f[0].id, { notizen: 'Mit der Frage beginnen' });
  }, satz);

  await seite.evaluate((id: string) => { void Werkzeuge.praesentation(Store.getBlock(id)); }, satz);
  await seite.waitForSelector('.praesi .folie');
  pruefe('§5 die Notizen sind am Anfang verborgen', await seite.locator('.praesi-notizen').count() === 0);
  pruefe('§5 die Uhr läuft', /^\d\d:\d\d$/.test((await seite.locator('.praesi-uhr').textContent()) || ''));
  await seite.keyboard.press('n');
  const notiztext = await seite.locator('.praesi-notiztext').textContent();
  pruefe('§5 N zeigt die Notiz', notiztext === 'Mit der Frage beginnen', notiztext);
  pruefe('§5 die nächste Folie wird genannt', /Als Nächstes/.test((await seite.locator('.praesi-naechste').textContent()) || ''));
  const zaehler = async () => seite.locator('.praesi-leiste span').first().textContent();
  const vorKlick = await zaehler();
  await seite.locator('.praesi-notizen').click();
  pruefe('§5 ein Klick in die Notizen blättert nicht', await zaehler() === vorKlick);
  await seite.keyboard.press('ArrowRight');
  const ueb = await seite.locator('.praesi .folie').getAttribute('data-uebergang');
  pruefe('§4 der Übergang läuft im Vortrag', ueb === 'schieben', ueb);
  pruefe('§5 die Notizen bleiben beim Blättern offen', await seite.locator('.praesi-notizen').count() === 1);
  await seite.setViewportSize({ width: 390, height: 844 });
  await seite.waitForTimeout(150);
  const leiste = await seite.evaluate(() => {
    const l = document.querySelector('.praesi-leiste') as HTMLElement;
    const r = l.getBoundingClientRect();
    const hoch = [...l.querySelectorAll('button')].map(k => k.getBoundingClientRect().height);
    return { links: r.left, rechts: r.right, breit: innerWidth, kleinster: Math.min(...hoch), zeilen: l.querySelector('span')!.getClientRects().length };
  });
  pruefe('§5 am Telefon passt die Leiste, eine Zeile, 44 px', leiste.links >= 0 && leiste.rechts <= leiste.breit && leiste.kleinster >= 44 && leiste.zeilen === 1, leiste);
  await seite.setViewportSize({ width: 1280, height: 800 });
  await seite.keyboard.press('Escape');
  pruefe('§5 Escape beendet den Vortrag', await seite.locator('.praesi').count() === 0);

  /* §6 */
  const gelesen = await seite.evaluate(async () => {
    const R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
    const K = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
    const P = 'xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"';
    const form = (art: string, text: string) => `<p:sp><p:nvSpPr><p:cNvPr id="2" name="n"/><p:cNvSpPr/><p:nvPr><p:ph type="${art}"/></p:nvPr></p:nvSpPr><p:txBody><a:p><a:r><a:t>${text}</a:t></a:r></a:p></p:txBody></p:sp>`;
    const blob = await Austausch.zipSchreiben([
      { name: '[Content_Types].xml', inhalt: '<Types/>' },
      { name: '_rels/.rels', inhalt: '<Relationships/>' },
      { name: 'ppt/presentation.xml', inhalt: `${K}<p:presentation ${P} xmlns:r="${R}"><p:sldIdLst><p:sldId id="256" r:id="rId1"/></p:sldIdLst><p:sldSz cx="12192000" cy="6858000"/></p:presentation>` },
      { name: 'ppt/_rels/presentation.xml.rels', inhalt: `${K}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${R}/slide" Target="slides/slide1.xml"/></Relationships>` },
      { name: 'ppt/slides/slide1.xml', inhalt: `${K}<p:sld ${P}><p:cSld><p:spTree>${form('title', 'Titel')}</p:spTree></p:cSld></p:sld>` },
      { name: 'ppt/slides/_rels/slide1.xml.rels', inhalt: `${K}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId9" Type="${R}/notesSlide" Target="../notesSlides/notesSlide1.xml"/></Relationships>` },
      { name: 'ppt/notesSlides/notesSlide1.xml', inhalt: `${K}<p:notes ${P}><p:cSld><p:spTree>${form('sldNum', '7')}${form('body', 'Erst die Frage stellen')}</p:spTree></p:cSld></p:notes>` }
    ]);
    const r = await Einlesen.datei(new File([blob], 'N.pptx', { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' }));
    return Store.childrenOf(r.seite.id).filter((b: any) => b.type === 'blatt').map((b: any) => b.notizen);
  });
  pruefe('§6 die Notiz kommt aus der .pptx, ohne Seitenzahl', gelesen[0] === 'Erst die Frage stellen', gelesen);

  /* §7: echte Zeiger-Ereignisse mit pointerType "pen", Druck von wenig auf viel */
  const alt = [{ id: 'altstrich', art: 'stift', pts: [[10, 10], [60, 40], [120, 30]], farbe: '#336699' }];
  const tafelId = await seite.evaluate((shapes: unknown) => {
    const p = Store.addPage(null, { text: 'Tafel' });
    const b = Store.addBlock(p.id, 'whiteboard', { text: 'Skizze', shapes, hoehe: 400 });
    App.oeffne(p.id);
    return b.id;
  }, alt);
  await seite.waitForSelector('.wb-flaeche');
  await seite.waitForTimeout(300);
  const strich = await seite.evaluate(() => {
    const f = document.querySelector('.wb-flaeche') as SVGSVGElement;
    const r = f.getBoundingClientRect();
    const ev = (art: string, i: number, druck: number) => f.dispatchEvent(new PointerEvent(art, {
      bubbles: true, pointerId: 7, pointerType: 'pen', pressure: druck, button: 0, buttons: art === 'pointerup' ? 0 : 1,
      clientX: r.left + 150 + i * 6, clientY: r.top + 150 + Math.sin(i / 4) * 30 }));
    f.setPointerCapture = (() => {}) as any;
    ev('pointerdown', 0, 0.1);
    for (let i = 1; i <= 40; i++) ev('pointermove', i, Math.min(1, 0.1 + i * 0.022));
    ev('pointerup', 41, 0);
  });
  void strich;
  await seite.waitForTimeout(400);
  const tafel = await seite.evaluate((id: string) => {
    const b = Store.getBlock(id);
    const neu = b.shapes.find((s: any) => s.id !== 'altstrich');
    const zeichen = (s: any) => { const a = [...document.querySelectorAll('.wb-flaeche path[data-sid="' + s.id + '"]')] as SVGPathElement[]; return a[a.length - 1]!; };
    const sicht = zeichen(neu), altZ = zeichen(b.shapes[0]);
    return { gleich: neu.pressure?.length === neu.pts.length, n: neu.pts.length, min: Math.min(...neu.pressure), max: Math.max(...neu.pressure),
      fill: sicht.getAttribute('fill'), stroke: sicht.getAttribute('stroke'), altFill: altZ.getAttribute('fill'), altHat: 'pressure' in b.shapes[0], altPts: b.shapes[0].pts };
  }, tafelId);
  pruefe('§7 Punkte und Druck sind gleich lang, der Druck steigt', tafel.gleich && tafel.n >= 3 && tafel.max - tafel.min > 0.3, tafel);
  pruefe('§7 der Stiftstrich ist eine Fläche', tafel.fill !== 'none' && tafel.stroke === 'none', tafel);
  pruefe('§7 der alte Strich bleibt Byte für Byte', tafel.altFill === 'none' && !tafel.altHat && JSON.stringify(tafel.altPts) === JSON.stringify(alt[0]!.pts), tafel);
  await seite.locator('.wb-flaeche').scrollIntoViewIfNeeded();
  const k = (await seite.locator('.wb-flaeche').boundingBox())!;
  const yM = Math.max(k.y + 40, 120);
  await seite.mouse.move(k.x + 60, yM); await seite.mouse.down();
  await seite.mouse.move(k.x + 300, yM + 40, { steps: 12 }); await seite.mouse.up();
  await seite.waitForTimeout(300);
  const maus = await seite.evaluate((id: string) => {
    const s = Store.getBlock(id).shapes.slice(-1)[0];
    return { hat: 'pressure' in s, n: s.pts.length, anzahl: Store.getBlock(id).shapes.length };
  }, tafelId);
  pruefe('§7 die Maus trägt keinen Druck', maus.anzahl === 3 && !maus.hat && maus.n >= 2, maus);

  /* §8 */
  const eigen = await seite.evaluate(async () => {
    const p = Folienvorlagen.neuePraesentation('titel', 'Eigen');
    Folienvorlagen.neueFolie(p.id, 'titelInhalt');
    const [a, b] = Store.childrenOf(p.id).filter((k: any) => k.type === 'blatt');
    Store.updateBlock(a.id, { notizen: 'Erste Notiz <mit> & Zeichen\nZweite Zeile', uebergang: { art: 'schieben', dauer: 600, richtung: 'l' } });
    Store.updateBlock(b.id, { uebergang: { art: 'keine', dauer: 600 } });
    const r = await Austausch.alsPowerPoint(Store.getBlock(p.id));
    const f = new File([r.blob], 'E.pptx', { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
    const z = await Einlesen.datei(f);
    const blaetter = Store.childrenOf(z.seite.id).filter((k: any) => k.type === 'blatt');
    const texte = blaetter.map((k: any) => (k.marken || []).filter((m: any) => m.art === 'text').map((m: any) => m.text).join(' | '));
    const titel = (blaetter[0].marken || []).find((m: any) => m.text === 'Titel der Präsentation');
    return { folien: r.folien, texte, titelLage: titel?.point, notiz: blaetter[0].notizen, ueb: blaetter[0].uebergang?.original, ueb2: blaetter[1].uebergang ?? null, notiz2: blaetter[1].notizen ?? null, ausgelassen: r.ausgelassen };
  });
  pruefe('§8 kein Platzhalter, der Text ist da', eigen.folien === 2 && !eigen.texte.join().includes('[A4-Blatt]') &&
    eigen.texte[0].includes('Titel der Präsentation') && eigen.texte[1].includes('Erster Punkt'), eigen);
  pruefe('§8 die Lage stimmt auf 16 Punkt', !!eigen.titelLage && Math.abs(eigen.titelLage[0] - 96) <= 16 && Math.abs(eigen.titelLage[1] - 184) <= 16, eigen.titelLage);
  pruefe('§8 die Notiz kommt zurück, mit Sonderzeichen', eigen.notiz === 'Erste Notiz <mit> & Zeichen\nZweite Zeile' && eigen.notiz2 === null, eigen);
  pruefe('§8 der Übergang kommt zurück, „Keiner" schreibt nichts', eigen.ueb === 'push' && eigen.ueb2 === null, eigen);
  pruefe('§8 alles liess sich schreiben', eigen.ausgelassen === 0, eigen.ausgelassen);
  const teile = await seite.evaluate(async () => {
    const p = Folienvorlagen.neuePraesentation('titel', 'Xml');
    const [a] = Store.childrenOf(p.id).filter((k: any) => k.type === 'blatt');
    Store.updateBlock(a.id, { notizen: 'n' });
    const bl = Austausch.pptxTeile([{ titel: '', zeilen: [], notizen: 'n & m', uebergang: { art: 'wischen', richtung: 'l', dauer: 400 }, formen: '' }]);
    const kaputt = bl.filter((t: any) => typeof t.inhalt === 'string' && new DOMParser().parseFromString(t.inhalt, 'application/xml').getElementsByTagName('parsererror').length).map((t: any) => t.name);
    const namen = bl.map((t: any) => t.name);
    const typen = bl.find((t: any) => t.name === '[Content_Types].xml').inhalt;
    const folie = bl.find((t: any) => t.name === 'ppt/slides/slide1.xml').inhalt;
    return { kaputt, master: namen.includes('ppt/notesMasters/notesMaster1.xml'), typen: typen.includes('notesSlide1.xml') && typen.includes('notesMaster1.xml'),
      reihenfolge: folie.indexOf('</p:clrMapOvr>') < folie.indexOf('<p:transition'), ohne: Austausch.pptxTeile([{ titel: 'a', zeilen: [] }]).some((t: any) => /notes/.test(t.name)) };
  });
  pruefe('§8 jedes Teil ist gültiges XML, Notizen-Master und Typen stehen da', teile.kaputt.length === 0 && teile.master && teile.typen && teile.reihenfolge, teile);
  pruefe('§8 ohne Notiz bleibt das Paket ohne Notizteile', teile.ohne === false, teile);

  /* §9 */
  const fremd = await seite.evaluate(async () => {
    const R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
    const K = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
    const P = 'xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"';
    const REL = 'http://schemas.openxmlformats.org/package/2006/relationships';
    const form = (art: string, text: string) => `<p:sp><p:nvSpPr><p:cNvPr id="2" name="n"/><p:cNvSpPr/><p:nvPr><p:ph type="${art}"/></p:nvPr></p:nvSpPr><p:txBody><a:p><a:r><a:t>${text}</a:t></a:r></a:p></p:txBody></p:sp>`;
    const folie = (t: string) => `${K}<p:sld ${P}><p:cSld><p:spTree>${form('title', t)}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr><p:transition><p:fade/></p:transition></p:sld>`;
    const blob = await Austausch.zipSchreiben([
      { name: '[Content_Types].xml', inhalt: '<Types/>' },
      { name: '_rels/.rels', inhalt: '<Relationships/>' },
      { name: 'ppt/presentation.xml', inhalt: `${K}<p:presentation ${P} xmlns:r="${R}"><p:sldIdLst><p:sldId id="256" r:id="rId1"/><p:sldId id="257" r:id="rId2"/></p:sldIdLst><p:sldSz cx="12192000" cy="6858000"/></p:presentation>` },
      { name: 'ppt/_rels/presentation.xml.rels', inhalt: `${K}<Relationships xmlns="${REL}"><Relationship Id="rId1" Type="${R}/slide" Target="slides/slide1.xml"/><Relationship Id="rId2" Type="${R}/slide" Target="slides/slide2.xml"/></Relationships>` },
      { name: 'ppt/slides/slide1.xml', inhalt: folie('Eins') },
      { name: 'ppt/slides/slide2.xml', inhalt: folie('Zwei') },
      { name: 'ppt/slides/_rels/slide1.xml.rels', inhalt: `${K}<Relationships xmlns="${REL}"><Relationship Id="rId9" Type="${R}/notesSlide" Target="../notesSlides/notesSlide1.xml"/></Relationships>` },
      { name: 'ppt/notesSlides/notesSlide1.xml', inhalt: `${K}<p:notes ${P}><p:cSld><p:spTree>${form('sldNum', '7')}${form('body', 'Alt')}</p:spTree></p:cSld></p:notes>` }
    ]);
    const typ = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    const z = await Einlesen.datei(new File([blob], 'F.pptx', { type: typ }));
    const seiteF = Store.getBlock(z.seite.id);
    const [a, b] = Store.childrenOf(seiteF.id).filter((k: any) => k.type === 'blatt');
    const vorher = a.uebergang?.original;
    Store.updateBlock(a.id, { notizen: 'Neu' });
    Store.updateBlock(b.id, { notizen: 'Ohne Platz', uebergang: { art: 'schieben', dauer: 600, richtung: 'l' } });
    const r = await Austausch.alsPowerPoint(Store.getBlock(seiteF.id));
    const z2 = await Einlesen.datei(new File([r.blob], 'F2.pptx', { type: typ }));
    const [c, d] = Store.childrenOf(z2.seite.id).filter((k: any) => k.type === 'blatt');
    return { vorher, durch: r.durchgereicht, hinweis: r.hinweis, notiz1: c.notizen, ueb1: c.uebergang?.original, ueb2: d.uebergang?.original, notiz2: d.notizen ?? null };
  });
  pruefe('§9 die geänderte Notiz steht in der Datei, ohne Seitenzahl', fremd.durch === true && fremd.notiz1 === 'Neu', fremd);
  pruefe('§9 der eingelesene Übergang bleibt, der gewählte wird geschrieben', fremd.vorher === 'fade' && fremd.ueb1 === 'fade' && fremd.ueb2 === 'push', fremd);
  pruefe('§9 eine Notiz ohne Notizenseite wird gemeldet, nicht verschwiegen', fremd.notiz2 === null && /stehen nur in Redion/.test(fremd.hinweis), fremd);

  pruefe('keine Fehler auf der Seite', pageFehler.length === 0, pageFehler);
} finally {
  await browser.close();
  server.close();
}
console.log(`\n${gut} gut, ${fehler} rot`);
process.exit(fehler ? 1 : 0);
