/* Reiter, geteilte Ansicht, Linkvorschau */
const WURZEL = require('path').resolve(__dirname, '../..');
const { chromium } = require('playwright');
let ok = 0, bad = 0;
const pruef = (n, ist, soll) => {
  const gut = JSON.stringify(ist) === JSON.stringify(soll);
  console.log((gut ? '✅ ' : '❌ ') + n + (gut ? '' : `  ist=${JSON.stringify(ist)} soll=${JSON.stringify(soll)}`));
  gut ? ok++ : bad++;
};

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
  const fehler = [];
  p.on('pageerror', e => fehler.push('JS: ' + e.message));
  await p.goto('file://' + WURZEL + '/index.html');
  await p.waitForTimeout(1500);

  const seiten = await p.evaluate(async () => {
    const a = Store.addBlock(null, 'page', { text: 'Alpha', icon: '🅰' });
    Store.addBlock(a.id, 'text', { text: 'Text auf Alpha' });
    const b2 = Store.addBlock(null, 'page', { text: 'Beta' });
    Store.addBlock(b2.id, 'text', { text: 'Erste Zeile von Beta' });
    Store.addBlock(b2.id, 'text', { text: 'Zweite Zeile von Beta' });
    const c = Store.addBlock(null, 'page', { text: 'Gamma' });
    Store.addBlock(a.id, 'pageref', {});
    const ref = Store.childrenOf(a.id).find(x => x.type === 'pageref');
    Store.updateBlock(ref.id, { ziel: b2.id });
    App.oeffne(a.id);
    await new Promise(r => setTimeout(r, 400));
    return { a: a.id, b: b2.id, c: c.id, ref: ref.id };
  });

  /* --- Reiter ---------------------------------------------------------- */
  const einer = await p.evaluate(() => ({
    leiste: !!document.getElementById('reiterleiste'),
    sichtbar: getComputedStyle(document.getElementById('reiterleiste')).display,
    anzahl: Fenster.reiter().length
  }));
  pruef('Leiste existiert',              einer.leiste, true);
  pruef('Bei einem Reiter unsichtbar',   einer.sichtbar, 'none');
  pruef('Ein Reiter gemerkt',            einer.anzahl, 1);

  const zwei = await p.evaluate(async (s) => {
    Fenster.neuerReiter(s.b);
    await new Promise(r => setTimeout(r, 350));
    return {
      tabs:   [...document.querySelectorAll('.rt-tab span')].map(x => x.textContent),
      aktiv:  document.querySelector('.rt-tab.an span').textContent,
      seite:  App.aktuelleSeite() === s.b,
      plus:   !!document.querySelector('.rt-plus'),
      display: getComputedStyle(document.getElementById('reiterleiste')).display
    };
  }, seiten);
  pruef('Zwei Reiter da',        zwei.tabs, ['🅰 Alpha', 'Beta']);
  pruef('Der neue ist aktiv',    zwei.aktiv, 'Beta');
  pruef('Beta ist geöffnet',     zwei.seite, true);
  pruef('Plusknopf da',          zwei.plus, true);
  pruef('Leiste jetzt sichtbar', zwei.display !== 'none', true);

  /* Strg + Tab wechselt */
  await p.keyboard.press('Control+Tab');
  await p.waitForTimeout(350);
  const nachTab = await p.evaluate(() => document.querySelector('.rt-tab.an span').textContent);
  pruef('Strg+Tab wechselt zum ersten', nachTab, '🅰 Alpha');

  /* Neuer Reiter über Strg + T */
  await p.evaluate(async (s) => { App.oeffne(s.c); await new Promise(r => setTimeout(r, 250)); }, seiten);
  await p.keyboard.press('Control+t');
  await p.waitForTimeout(350);
  const drei = await p.evaluate(() => ({
    anzahl: Fenster.reiter().length,
    tabs: [...document.querySelectorAll('.rt-tab span')].map(x => x.textContent)
  }));
  pruef('Drei Reiter nach Strg+T', drei.anzahl, 3);

  /* Öffnen ändert nur den aktiven Reiter */
  const gewechselt = await p.evaluate(async (s) => {
    App.oeffne(s.a);
    await new Promise(r => setTimeout(r, 300));
    return { tabs: [...document.querySelectorAll('.rt-tab span')].map(x => x.textContent),
             aktiv: document.querySelector('.rt-tab.an span').textContent };
  }, seiten);
  pruef('Aktiver Reiter zeigt die neue Seite', gewechselt.aktiv, '🅰 Alpha');
  pruef('Die anderen bleiben stehen', gewechselt.tabs.length, 3);

  /* Reiter schliessen */
  await p.evaluate(() => document.querySelector('.rt-tab.an button').click());
  await p.waitForTimeout(350);
  const nachZu = await p.evaluate(() => Fenster.reiter().length);
  pruef('Nach dem Schliessen zwei', nachZu, 2);

  /* Der letzte Reiter lässt sich nicht schliessen */
  const letzter = await p.evaluate(async () => {
    Fenster.schliessen(0);
    await new Promise(r => setTimeout(r, 250));
    Fenster.schliessen(0);
    await new Promise(r => setTimeout(r, 250));
    return Fenster.reiter().length;
  });
  pruef('Der letzte Reiter bleibt', letzter, 1);

  /* Reiter überleben den Neustart */
  await p.evaluate(async (s) => {
    Fenster.neuerReiter(s.b);
    await new Promise(r => setTimeout(r, 300));
    await Store.flush();
  }, seiten);
  await p.reload();
  await p.waitForTimeout(1600);
  const nachNeustart = await p.evaluate(() => ({
    anzahl: Fenster.reiter().length,
    tabs: [...document.querySelectorAll('.rt-tab span')].map(x => x.textContent)
  }));
  pruef('Reiter nach dem Neustart wieder da', nachNeustart.anzahl, 2);

  /* --- Geteilte Ansicht ------------------------------------------------ */
  const teil = await p.evaluate(async (s) => {
    App.oeffne(s.a);
    await new Promise(r => setTimeout(r, 300));
    Fenster.teilen(s.b, 'quer');
    await new Promise(r => setTimeout(r, 400));
    await Store.flush();
    return {
      da:     !!document.getElementById('teil'),
      klasse: document.getElementById('main').className,
      titel:  (document.querySelector('.teil-inhalt .seiten-titel') || {}).textContent,
      bloecke: document.querySelectorAll('.teil-inhalt .blk').length,
      knoepfe: document.querySelectorAll('.teil-kopf button').length,
      griff:  !!document.querySelector('.teil-griff')
    };
  }, seiten);
  pruef('Zweite Seite eingeblendet', teil.da, true);
  pruef('Hauptbereich ist geteilt',  teil.klasse.includes('geteilt'), true);
  pruef('Titel der zweiten Seite',   teil.titel, 'Beta');
  pruef('Blöcke der zweiten Seite',  teil.bloecke >= 2, true);
  pruef('Vier Knöpfe im Kopf',       teil.knoepfe, 4);
  pruef('Trenngriff da',             teil.griff, true);

  /* Richtung umschalten */
  await p.evaluate(() => document.querySelector('.teil-kopf [data-a="richtung"]').click());
  await p.waitForTimeout(350);
  const hoch = await p.evaluate(() => document.getElementById('main').className);
  pruef('Übereinander umgeschaltet', hoch.includes('hoch'), true);

  /* Tauschen */
  await p.evaluate(() => document.querySelector('.teil-kopf [data-a="tausch"]').click());
  await p.waitForTimeout(450);
  const getauscht = await p.evaluate((s) => ({
    links: App.aktuelleSeite() === s.b,
    rechts: (document.querySelector('.teil-inhalt .seiten-titel') || {}).textContent
  }), seiten);
  pruef('Links steht jetzt Beta',  getauscht.links, true);
  pruef('Rechts steht jetzt Alpha', getauscht.rechts, '🅰 Alpha');

  /* Im rechten Bereich schreiben ändert die Daten */
  const geschrieben = await p.evaluate(async (s) => {
    const ct = document.querySelector('.teil-inhalt .blk .ct');
    ct.focus();
    ct.textContent = 'Rechts getippt';
    ct.dispatchEvent(new InputEvent('input', { bubbles: true }));
    await new Promise(r => setTimeout(r, 600));
    return Store.childrenOf(s.a)[0].text;
  }, seiten);
  pruef('Rechts geschriebener Text ist gespeichert', geschrieben, 'Rechts getippt');

  /* Teilung überlebt den Neustart und lässt sich schliessen */
  await p.reload();
  await p.waitForTimeout(1600);
  const nachNeu2 = await p.evaluate(() => !!document.getElementById('teil'));
  pruef('Teilung nach dem Neustart wieder da', nachNeu2, true);

  await p.evaluate(() => document.querySelector('.teil-kopf [data-a="zu"]').click());
  await p.waitForTimeout(300);
  const zu = await p.evaluate(() => ({
    weg: !document.getElementById('teil'),
    klasse: document.getElementById('main').className
  }));
  pruef('Teilung geschlossen',        zu.weg, true);
  pruef('Klasse wieder entfernt',     zu.klasse.includes('geteilt'), false);

  /* --- Linkvorschau ---------------------------------------------------- */
  const vorschau = await p.evaluate(async (s) => {
    App.oeffne(s.a);
    await new Promise(r => setTimeout(r, 400));
    const el = document.querySelector('.pageref');
    Fenster.vorschauZeigen(el, s.b);
    await new Promise(r => setTimeout(r, 200));
    const k = document.querySelector('.linkvorschau');
    return { da: !!k,
             titel: (k.querySelector('.lv-titel') || {}).textContent,
             zeilen: k.querySelectorAll('.lv-text p').length,
             fuss: (k.querySelector('.lv-fuss') || {}).textContent };
  }, seiten);
  pruef('Vorschaukarte erscheint', vorschau.da, true);
  pruef('Titel in der Vorschau',   vorschau.titel, 'Beta');
  pruef('Erste Zeilen in der Vorschau', vorschau.zeilen >= 2, true);
  pruef('Fuss nennt die Blockzahl', vorschau.fuss.includes('Blöcke'), true);

  await p.evaluate(() => Fenster.vorschauZu());
  const weg = await p.evaluate(() => !document.querySelector('.linkvorschau'));
  pruef('Vorschau verschwindet wieder', weg, true);

  /* Shift + Klick teilt die Ansicht */
  await p.evaluate(async () => {
    const el = document.querySelector('.pageref');
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, shiftKey: true }));
    await new Promise(r => setTimeout(r, 400));
  });
  const shift = await p.evaluate((s) => ({
    geteilt: !!document.getElementById('teil'),
    rechts: (document.querySelector('.teil-inhalt .seiten-titel') || {}).textContent
  }), seiten);
  pruef('Shift+Klick teilt', shift.geteilt, true);
  pruef('Rechts steht das Ziel', shift.rechts, 'Beta');

  console.log(`\n${ok}/${ok + bad} bestanden`);
  console.log(fehler.length ? 'JS-Fehler:\n' + fehler.join('\n') : 'Keine JS-Fehler.');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
