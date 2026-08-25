/* Inhaltsverzeichnis, Spiegelblöcke, Codezeilen, Bildgrösse, PDF-Vorschau */
import _pfad from 'node:path';
const WURZEL = _pfad.resolve(import.meta.dirname, '../..');
import { chromium } from 'playwright';
let ok = 0, bad = 0;
const pruef = (n: any, ist: any, soll: any) => {
  const gut = JSON.stringify(ist) === JSON.stringify(soll);
  console.log((gut ? '✅ ' : '❌ ') + n + (gut ? '' : `  ist=${JSON.stringify(ist)} soll=${JSON.stringify(soll)}`));
  gut ? ok++ : bad++;
};

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1300, height: 900 } });
  const fehler: any[] = [];
  p.on('pageerror', e => fehler.push('JS: ' + e.message));
  await p.goto('file://' + WURZEL + '/index.html');
  await p.waitForTimeout(1400);
  /* KEIN ERSTBESUCHER — das Willkommen wegräumen (E55).
     Seit §11 legt sich beim allerersten Öffnen ein Blatt über den ganzen
     Bildschirm. Für den, der Redion zum ersten Mal sieht, ist das richtig;
     hier misst niemand zum ersten Mal, und Playwright wartet dann
     sechzig Sekunden darauf, dass ein Knopf darunter anklickbar wird. */
  await p.evaluate(() => {
    Store.setMeta('rundgangGesehen', true);
    document.getElementById('rg-willkommen')?.remove();
    /* Und die Einrichtung der Hauptwelten: sie legt sich beim ersten Start
       über alles und fängt Klicks ab (E132). */
    document.querySelector('.produkt-onboarding-lage')?.remove();
    document.getElementById('rg-einladung')?.remove();
  });

  /* --- Inhaltsverzeichnis über die ganze Seite ------------------------- */
  const toc = await p.evaluate(async () => {
    const s = Store.addBlock(null, 'page', { text: 'Doku' });
    Store.addBlock(s.id, 'h1', { text: 'Einführung' });
    Store.addBlock(s.id, 'text', { text: 'Bla' });
    const tg = Store.addBlock(s.id, 'toggle', { text: 'Mehr' });
    Store.addBlock(tg.id, 'h2', { text: 'Versteckt im Toggle' });
    Store.addBlock(s.id, 'toggle-h2', { text: 'Klappbare Überschrift' });
    Store.addBlock(s.id, 'h3', { text: 'Kleinstes' });
    Store.addBlock(s.id, 'toc', {});
    App.oeffne(s.id);
    await new Promise(r => setTimeout(r, 450));
    return {
      seite: s.id,
      eintraege: [...document.querySelectorAll<HTMLElement>('.toc-liste a')].map(a => (a.textContent ?? '').trim()),
      stufen:    [...document.querySelectorAll<HTMLElement>('.toc-liste a')].map(a => a.className.replace(' jetzt','')),
      fuss:      !!document.querySelector('.toc-fuss')
    };
  });
  pruef('Verzeichnis findet auch im Toggle', (toc.eintraege ?? '').includes('Versteckt im Toggle'), true);
  pruef('Toggle-Überschrift ist dabei',      (toc.eintraege ?? '').includes('Klappbare Überschrift'), true);
  pruef('Vier Überschriften gefunden',       toc.eintraege.length, 4);
  pruef('Stufen richtig',                    toc.stufen, ['lvl1','lvl2','lvl2','lvl3']);

  /* Nummerierung einschalten */
  await p.click('.toc-fuss button');
  await p.waitForTimeout(350);
  const nummeriert = await p.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('.toc-liste a')].map(a => (a.textContent ?? '').trim()));
  pruef('Nummerierung 1 für die erste', (nummeriert[0] ?? '').startsWith('1 '), true);
  pruef('Nummerierung 1.1 für die zweite', (nummeriert[1] ?? '').startsWith('1.1 '), true);
  pruef('Nummerierung 1.1.1 für die vierte', (nummeriert[3] ?? '').startsWith('1.1.1 ') || (nummeriert[3] ?? '').startsWith('1.2.1 '), true);

  /* --- Spiegelblock ---------------------------------------------------- */
  const sync = await p.evaluate(async () => {
    const q = Store.addBlock(null, 'page', { text: 'Quelle' });
    Store.addBlock(q.id, 'text', { text: 'Gemeinsamer Satz' });
    const z1 = Store.addBlock(null, 'page', { text: 'Ziel A' });
    const z2 = Store.addBlock(null, 'page', { text: 'Ziel B' });
    const s1 = Store.addBlock(z1.id, 'synced', {});
    Store.updateBlock(s1.id, { quelle: q.id });
    const s2 = Store.addBlock(z2.id, 'synced', {});
    Store.updateBlock(s2.id, { quelle: q.id });
    App.oeffne(z1.id);
    await new Promise(r => setTimeout(r, 400));
    return {
      quelle: q.id, zielA: z1.id, spiegel: s1.id,
      kopf:   (document.querySelector('.sy-kopf') || {}).textContent,
      zahl:   (document.querySelector('.sy-zahl') || {}).textContent,
      inhalt: (document.querySelector('.synced .ct') || {}).textContent,
      knoepfe: document.querySelectorAll('.sy-kopf button').length
    };
  });
  pruef('Spiegel zeigt Quelle',        sync.kopf?.includes('Quelle'), true);
  pruef('Zwei Kopien gezählt',         sync.zahl?.trim(), '2 ×');
  pruef('Inhalt der Quelle sichtbar',  sync.inhalt, 'Gemeinsamer Satz');
  pruef('Drei Knöpfe im Kopf',         sync.knoepfe, 3);

  /* Im Spiegel schreiben ändert die Quelle */
  await p.evaluate(async () => {
    const ct = document.querySelector<HTMLElement>('.synced .ct');
    if (!ct) throw new Error('.synced .ct ist nicht da — der Lauf misst sonst nichts.');
    ct.focus();
    ct.textContent = 'Im Spiegel geändert';
    ct.dispatchEvent(new InputEvent('input', { bubbles: true }));
    await new Promise(r => setTimeout(r, 600));
  });
  const durch = await p.evaluate((q) =>
    Store.childrenOf(q)[0].text, sync.quelle);
  pruef('Änderung landet in der Quelle', durch, 'Im Spiegel geändert');

  /* Verbindung lösen */
  await p.evaluate(async (z) => { App.oeffne(z); await new Promise(r => setTimeout(r, 300)); }, sync.zielA);
  await p.click('.sy-kopf button[data-a="sy-los"]');
  await p.waitForTimeout(500);
  const geloest = await p.evaluate((z) => ({
    spiegel: document.querySelectorAll('.synced').length,
    texte:   Store.childrenOf(z).filter((b: any) => b.alive !== false).map((b: any) => b.text)
  }), sync.zielA);
  pruef('Kein Spiegel mehr auf der Seite', geloest.spiegel, 0);
  pruef('Inhalt steht eigenständig da',    (geloest.texte ?? '').includes('Im Spiegel geändert'), true);

  /* Selbstbezug wird abgefangen */
  const kreis = await p.evaluate(async () => {
    const s = Store.addBlock(null, 'page', { text: 'Kreis' });
    const sy = Store.addBlock(s.id, 'synced', {});
    Store.updateBlock(sy.id, { quelle: s.id });
    App.oeffne(s.id);
    await new Promise(r => setTimeout(r, 400));
    return (document.querySelector('.sy-warn') || {}).textContent || '';
  });
  pruef('Endlosschleife wird gemeldet', (kreis ?? '').includes('endlos'), true);

  /* --- Code: Zeilennummern, Kopieren, Umbruch -------------------------- */
  const code = await p.evaluate(async () => {
    const s = Store.addBlock(null, 'page', { text: 'Code' });
    const c = Store.addBlock(s.id, 'code', { text: 'eins\nzwei\ndrei\nvier' });
    Store.updateBlock(c.id, { lang: 'JavaScript' });
    App.oeffne(s.id);
    await new Promise(r => setTimeout(r, 450));
    return {
      id: c.id,
      nummern: [...document.querySelectorAll<HTMLElement>('.code-nr i')].map(x => x.textContent),
      werk:    document.querySelectorAll('.code-werk button').length,
      nrAn:    !!document.querySelector('.code-werk button[data-a="nr"].an')
    };
  });
  pruef('Vier Zeilennummern', code.nummern, ['1','2','3','4']);
  pruef('Drei Werkzeuge',     code.werk, 3);
  pruef('Nummern von Haus aus an', code.nrAn, true);

  await p.click('.code-werk button[data-a="nr"]');
  await p.waitForTimeout(350);
  const ausgeschaltet = await p.evaluate(() => document.querySelectorAll('.code-nr i').length);
  pruef('Nummern abschaltbar', ausgeschaltet, 0);

  /* --- Bild: Grösse und Ausrichtung ------------------------------------ */
  const bild = await p.evaluate(async () => {
    const s = Store.addBlock(null, 'page', { text: 'Bilder' });
    const i = Store.addBlock(s.id, 'image', {});
    Store.updateBlock(i.id, { src: 'data:image/svg+xml;base64,' +
      btoa('<svg xmlns="http://www.w3.org/2000/svg" width="80" height="40"><rect width="80" height="40" fill="teal"/></svg>'),
      caption: 'Ein Rechteck' });
    App.oeffne(s.id);
    await new Promise(r => setTimeout(r, 450));
    return { id: i.id,
             werk: document.querySelectorAll('.bild-werk button').length,
             breite: document.querySelector<HTMLElement>('.bild-rahmen img')?.style.width,
             griff: !!document.querySelector('.bild-griff') };
  });
  pruef('Bildwerkzeuge vorhanden', bild.werk, 8);
  pruef('Standardbreite volle Breite', bild.breite, '100%');
  pruef('Ziehgriff da', bild.griff, true);

  await p.evaluate(() => document.querySelector<HTMLElement>('.bild-werk button[data-b="50"]')?.click());
  await p.waitForTimeout(350);
  const halb = await p.evaluate(() => document.querySelector<HTMLElement>('.bild-rahmen img')?.style.width);
  pruef('Auf 50 Prozent gestellt', halb, '50%');

  await p.evaluate(() => document.querySelector<HTMLElement>('.bild-werk button[data-aus="mitte"]')?.click());
  await p.waitForTimeout(350);
  const mitte = await p.evaluate(() => document.querySelector('.bild-rahmen')?.className ?? '');
  pruef('Mittig ausgerichtet', (mitte ?? '').includes('aus-mitte'), true);

  /* Gross ansehen */
  await p.evaluate(() => document.querySelector<HTMLElement>('.bild-rahmen img')?.click());
  await p.waitForTimeout(300);
  const gross = await p.evaluate(() => ({
    da:   !!document.querySelector('.bild-voll'),
    text: (document.querySelector('.bv-text') || {}).textContent
  }));
  pruef('Vollbild geht auf',        gross.da, true);
  pruef('Beschriftung im Vollbild', gross.text, 'Ein Rechteck');
  await p.evaluate(() => document.querySelector<HTMLElement>('.bild-voll')?.click());

  /* --- PDF-Vorschau ---------------------------------------------------- */
  const pdf = await p.evaluate(async () => {
    const s = Store.addBlock(null, 'page', { text: 'Anhang' });
    const f = Store.addBlock(s.id, 'file', {});
    Store.updateBlock(f.id, { src: 'https://beispiel.test/bericht.pdf', text: 'Bericht.pdf' });
    App.oeffne(s.id);
    await new Promise(r => setTimeout(r, 420));
    return { knopf: !!document.querySelector('.datei-zeile button[data-a="pdf"]'),
             rahmen: document.querySelectorAll('.pdf-rahmen').length };
  });
  pruef('PDF bietet Vorschau an', pdf.knopf, true);
  pruef('Noch nicht offen',       pdf.rahmen, 0);

  await p.click('.datei-zeile button[data-a="pdf"]');
  await p.waitForTimeout(400);
  const auf = await p.evaluate(() => ({
    rahmen: document.querySelectorAll('.pdf-rahmen iframe').length,
    hoehe:  document.querySelector<HTMLElement>('.pdf-rahmen')?.style.height,
    fuss:   document.querySelectorAll('.pdf-fuss button').length
  }));
  pruef('Vorschau eingeblendet', auf.rahmen, 1);
  pruef('Standardhöhe 420',      auf.hoehe, '420px');
  pruef('Zwei Höhenknöpfe',      auf.fuss, 2);

  console.log(`\n${ok}/${ok + bad} bestanden`);
  console.log(fehler.length ? 'JS-Fehler:\n' + fehler.join('\n') : 'Keine JS-Fehler.');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
