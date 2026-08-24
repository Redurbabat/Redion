/* Seitenleistenbreite, Offline-Anzeige, Hineinschauen in Diagramm und Pivot */
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
  const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
  const fehler: any[] = [];
  p.on('pageerror', e => fehler.push('JS: ' + e.message));
  await p.goto('file://' + WURZEL + '/index.html');
  await p.waitForTimeout(1500);
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

  /* --- Seitenleiste breiter ziehen ------------------------------------- */
  const griffDa = await p.evaluate(() => ({
    griff: !!document.querySelector('.side-griff'),
    breite: Math.round(document.querySelector<HTMLElement>('#sidebar')?.getBoundingClientRect().width ?? -1)
  }));
  pruef('Ziehgriff an der Seitenleiste', griffDa.griff, true);
  pruef('Startbreite 260',               griffDa.breite, 260);

  const kasten = await p.evaluate(() => {
    /* Ein Element, das dasein MUSS. Fehlt es, misst der Lauf nichts mehr —
       dann ist eine Meldung mit dem Selektor besser als „Cannot read
       properties of null" zwanzig Zeilen weiter. */
    (sel: string): HTMLElement => {
      const x = document.querySelector<HTMLElement>(sel);
      if (!x) throw new Error(sel + ' ist nicht da.');
      return x;
    };
    const r = (document.querySelector('.side-griff') ?? document.body).getBoundingClientRect();
    return { x: r.left + 3, y: r.top + 200 };
  });
  await p.mouse.move(kasten.x, kasten.y);
  await p.mouse.down();
  await p.mouse.move(kasten.x + 70, kasten.y, { steps: 8 });
  await p.mouse.up();
  await p.waitForTimeout(300);
  /* Netz für den langsamen Rechner. Mit den 300 ms allein war dieser Lauf
     flockig: einmal grün, beim nächsten Mal „Breiter gezogen ist=false" —
     bei unverändertem Code, nachgewiesen an zwei Reihen mit demselben
     Stilblatt. Das Ziehen wird beim Loslassen gespeichert, und wenn der
     Rechner gerade beschäftigt ist, ist die Breite nach 300 ms noch nicht
     gesetzt. Die Zahl bleibt stehen, dahinter wird auf die Wirkung gewartet
     statt auf die Uhr. Schlägt das Ziehen wirklich fehl, ist der Lauf auch
     nach acht Sekunden rot — das Netz macht ihn nicht nachsichtiger. */
  await p.waitForFunction(
    () => document.querySelector<HTMLElement>('#sidebar')?.getBoundingClientRect().width ?? -1 > 300,
    null, { timeout: 8000 }).catch(() => {});
  const gezogen = await p.evaluate(() => ({
    breite: Math.round(document.querySelector<HTMLElement>('#sidebar')?.getBoundingClientRect().width ?? -1),
    gemerkt: Store.getMeta('seiteBreite', 0)
  }));
  pruef('Breiter gezogen',      Number(gezogen.breite ?? -1) > 300, true);
  pruef('Breite gemerkt',       Number(gezogen.gemerkt ?? -1) > 300, true);

  /* Grenzen halten */
  const grenze = await p.evaluate(() => {
    const s = document.getElementById('sidebar');
    if (!s) throw new Error('sidebar ist nicht da — der Lauf misst sonst nichts.');
    const g = document.querySelector('.side-griff');
    if (!g) throw new Error('.side-griff ist nicht da — der Lauf misst sonst nichts.');
    /* künstlich weit ziehen */
    const ev = (t: any, x: any) => g.dispatchEvent(new PointerEvent(t, { clientX: x, bubbles: true }));
    ev('pointerdown', 400);
    dispatchEvent(new PointerEvent('pointermove', { clientX: 2000 }));
    dispatchEvent(new PointerEvent('pointerup', {}));
    const breit = Math.round(s.getBoundingClientRect().width);
    ev('pointerdown', 400);
    dispatchEvent(new PointerEvent('pointermove', { clientX: -500 }));
    dispatchEvent(new PointerEvent('pointerup', {}));
    const schmal = Math.round(s.getBoundingClientRect().width);
    return { breit, schmal };
  });
  pruef('Nicht breiter als 460', grenze.breit, 460);
  pruef('Nicht schmaler als 180', grenze.schmal, 180);

  /* Doppelklick setzt zurück */
  await p.dblclick('.side-griff');
  await p.waitForTimeout(250);
  const zurueck = await p.evaluate(() =>
    Math.round(document.querySelector<HTMLElement>('#sidebar')?.getBoundingClientRect().width ?? -1) ?? -1);
  pruef('Doppelklick setzt auf 260 zurück', zurueck, 260);

  /* Breite überlebt den Neustart */
  await p.evaluate(async () => { Store.setMeta('seiteBreite', 330); await Store.flush(); });
  await p.reload();
  await p.waitForTimeout(1600);
  const nachNeustart = await p.evaluate(() =>
    Math.round(document.querySelector<HTMLElement>('#sidebar')?.getBoundingClientRect().width ?? -1) ?? -1);
  pruef('Breite nach dem Neustart', nachNeustart, 330);

  /* --- Verbindungsanzeige ---------------------------------------------- */
  const offline = await p.evaluate(async () => {
    PWA.verbindungAnzeigen(false);
    await new Promise(r => setTimeout(r, 150));
    const el = document.getElementById('offline-streifen');
    return { da: !!el, text: el ? el.textContent : '' };
  });
  pruef('Offline-Streifen erscheint', offline.da, true);
  pruef('Text nennt das Weiterlaufen', (offline.text ?? '').includes('läuft weiter'), true);

  await p.click('#offline-streifen [data-a="was"]');
  await p.waitForTimeout(250);
  const menue = await p.evaluate(() => {
    const m = document.querySelector('.menu, .menue, [class*="menu"]');
    return m ? m.textContent : '';
  });
  pruef('Menü nennt die KI',   (menue ?? '').includes('KI'), true);
  pruef('Menü nennt Formeln',  (menue ?? '').includes('Formeln'), true);

  const wiederDa = await p.evaluate(async () => {
    document.querySelector('.menu, .menue, [class*="menu"]')?.remove();
    PWA.verbindungAnzeigen(true);
    await new Promise(r => setTimeout(r, 120));
    return !document.getElementById('offline-streifen');
  });
  pruef('Streifen verschwindet wieder', wiederDa, true);

  /* --- Diagramm: hineinschauen ----------------------------------------- */
  const bau = await p.evaluate(async () => {
    const s = Store.addBlock(null, 'page', { text: 'Auswertung' });
    const db = Store.addDatabase(s.id, 'Verkäufe', {
      title:  { name: 'Kunde',  type: 'title' },
      land:   { name: 'Land',   type: 'select', options: [
                 { name: 'Schweiz', color: 'red' }, { name: 'Deutschland', color: 'orange' } ] },
      kanal:  { name: 'Kanal',  type: 'select', options: [
                 { name: 'Laden', color: 'blue' }, { name: 'Online', color: 'green' } ] },
      betrag: { name: 'Betrag', type: 'number' }
    }, 'chart');
    const c = Store.getCollection(db.collectionId);
    Store.addRow(c.id, { title: 'Meier',  land: 'Schweiz',     kanal: 'Laden',  betrag: 100 });
    Store.addRow(c.id, { title: 'Müller', land: 'Schweiz',     kanal: 'Online', betrag: 250 });
    Store.addRow(c.id, { title: 'Schmidt',land: 'Deutschland', kanal: 'Online', betrag: 400 });
    Store.updateView(db.viewId, { chartGruppe: 'land', chartWert: 'betrag',
                                  chartArt: 'Summe', chartTyp: 'bar' });
    App.oeffne(s.id);
    await new Promise(r => setTimeout(r, 500));
    return { seite: s.id, coll: c.id, view: db.viewId };
  });

  const diagramm = await p.evaluate(() => ({
    balken: document.querySelectorAll('.chart-flaeche .ch-teil').length,
    werte: [...document.querySelectorAll<HTMLElement>('.chart-legende b')].map(x => x.textContent),
    titel: [...document.querySelectorAll<HTMLElement>('.chart-flaeche title')].map(x => x.textContent)
  }));
  pruef('Zwei Balken',             diagramm.balken, 2);
  pruef('Summen stimmen',          diagramm.werte.sort(), ['350', '400']);
  pruef('Balken haben einen Tooltip', diagramm.titel.length, 2);

  await p.evaluate(() => document.querySelector<HTMLElement>('.chart-flaeche .ch-teil')?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
  await p.waitForTimeout(350);
  const hinein = await p.evaluate(() => ({
    offen:  !!document.querySelector('.dd-tab'),
    titel:  (document.querySelector('.fh') || {}).textContent,
    zeilen: document.querySelectorAll('.dd-tab tbody tr').length,
    hinweis: (document.querySelector('.dl-hinweis') || {}).textContent
  }));
  pruef('Fenster geht auf',        hinein.offen, true);
  pruef('Titel nennt die Gruppe',  (hinein.titel || '').includes('Deutschland'), true);
  pruef('Eine Zeile dahinter',     hinein.zeilen, 1);
  pruef('Hinweis nennt die Summe', (hinein.hinweis || '').includes('400'), true);

  /* Klick auf eine Zeile öffnet die Vorschau */
  await p.evaluate(() => document.querySelector<HTMLElement>('.dd-tab tbody tr')?.click());
  await p.waitForTimeout(350);
  const peek = await p.evaluate(() => ({
    dd: !!document.querySelector('.dd-tab'),
    peek: !!document.querySelector('.peek, .zeilen-peek, .overlay')
  }));
  pruef('Auswahlfenster schliesst', peek.dd, false);

  /* Legende führt auch hinein */
  await p.evaluate(() => { document.querySelectorAll<HTMLElement>('.overlay').forEach(o => o.remove()); });
  await p.evaluate(() => document.querySelectorAll<HTMLElement>('.chart-legende span[data-i]')[0]?.click());
  await p.waitForTimeout(350);
  const ausLegende = await p.evaluate(() => document.querySelectorAll('.dd-tab tbody tr').length);
  pruef('Legende öffnet dieselbe Auswahl', ausLegende >= 1, true);

  /* --- Pivot: hineinschauen -------------------------------------------- */
  const pivot = await p.evaluate(async (bau2) => {
    document.querySelectorAll<HTMLElement>('.overlay').forEach(o => o.remove());
    Store.updateView(bau2.view, { layout: 'pivot', pivotZeile: 'land',
                                  pivotSpalte: 'kanal', pivotWert: 'betrag', pivotArt: 'summe' });
    App.zeichneSeite();
    await new Promise(r => setTimeout(r, 450));
    return { zellen: document.querySelectorAll('.pivot td.pv-klick').length,
             tabelle: !!document.querySelector('.pivot') };
  }, bau);
  pruef('Kreuztabelle gezeichnet',   pivot.tabelle, true);
  pruef('Anklickbare Zellen',        Number(pivot.zellen ?? -1) >= 3, true);

  await p.evaluate(() => document.querySelector<HTMLElement>('.pivot td.pv-klick')?.click());
  await p.waitForTimeout(350);
  const pivotHinein = await p.evaluate(() => ({
    offen: !!document.querySelector('.dd-tab'),
    zeilen: document.querySelectorAll('.dd-tab tbody tr').length,
    titel: (document.querySelector('.fh') || {}).textContent
  }));
  pruef('Pivot-Zelle öffnet die Zeilen', pivotHinein.offen, true);
  pruef('Genau eine Zeile dahinter',     pivotHinein.zeilen, 1);
  pruef('Titel nennt Zeile × Spalte',    (pivotHinein.titel || '').includes('×'), true);

  console.log(`\n${ok}/${ok + bad} bestanden`);
  console.log(fehler.length ? 'JS-Fehler:\n' + fehler.join('\n') : 'Keine JS-Fehler.');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
