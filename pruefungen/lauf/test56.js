/* Kommentarfäden: Antworten, Reaktionen, Erwähnungen */
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
  const p = await b.newPage({ viewport: { width: 1300, height: 900 } });
  const fehler = [];
  p.on('pageerror', e => fehler.push('JS: ' + e.message));
  await p.goto('file://' + WURZEL + '/index.html');
  await p.waitForTimeout(1500);

  const bau = await p.evaluate(async () => {
    Store.setMeta('nutzer', 'Redur');
    const ziel = Store.addBlock(null, 'page', { text: 'Zielseite' });
    const s = Store.addBlock(null, 'page', { text: 'Besprechung' });
    const blk = Store.addBlock(s.id, 'text', { text: 'Der Absatz, um den es geht' });
    Store.updateBlock(blk.id, { kommentare: [{
      id: 'k1', text: 'Bitte @Zielseite ansehen, @Niemand auch', zitat: 'Der Absatz',
      autor: 'Redur', zeit: Store.now(), erledigt: false, antworten: [], reaktionen: {} }] });
    App.oeffne(s.id);
    await new Promise(r => setTimeout(r, 400));
    return { seite: s.id, block: blk.id, ziel: ziel.id };
  });

  /* --- Erwähnungen ------------------------------------------------------ */
  const erw = await p.evaluate(() => ({
    gefunden: Kommentare.erwaehnt('Hallo @Anna und @Bob_2, nicht @x'),
    html: Kommentare.mitErwaehnungen('Siehe @Zielseite und @Niemand')
  }));
  pruef('Erwähnungen erkannt',      erw.gefunden, ['Anna', 'Bob_2']);
  pruef('Zu kurze werden übergangen', erw.gefunden.includes('x'), false);
  pruef('Bekannte Seite wird Link',  erw.html.includes('data-seite='), true);
  pruef('Unbekannte bleibt grau',    erw.html.includes('komm-erw tot'), true);

  /* --- Das Panel -------------------------------------------------------- */
  await p.evaluate((x) => Kommentare.panel(x.seite), bau);
  await p.waitForTimeout(350);
  const panel = await p.evaluate(() => ({
    kommentare: document.querySelectorAll('.komm').length,
    reaktionen: document.querySelectorAll('.komm-reak button').length,
    knoepfe: [...document.querySelectorAll('.komm-fuss button')].map(x => x.textContent),
    link: !!document.querySelector('.komm-erw[data-seite]'),
    tot: !!document.querySelector('.komm-erw.tot')
  }));
  pruef('Ein Kommentar sichtbar',   panel.kommentare, 1);
  pruef('Sechs Reaktionen zur Wahl', panel.reaktionen, 6);
  pruef('Antworten-Knopf da',       panel.knoepfe.includes('Antworten'), true);
  pruef('Erwähnung als Link',       panel.link, true);
  pruef('Unbekannte Erwähnung grau', panel.tot, true);

  /* --- Reagieren -------------------------------------------------------- */
  await p.evaluate(() => document.querySelector('.komm-reak button[data-r="👍"]').click());
  await p.waitForTimeout(350);
  const reagiert = await p.evaluate((x) => ({
    gespeichert: Store.getBlock(x.block).kommentare[0].reaktionen,
    an: document.querySelectorAll('.komm-reak button.an').length,
    text: (document.querySelector('.komm-reak button.an') || {}).textContent
  }), bau);
  pruef('Reaktion gespeichert',   reagiert.gespeichert['👍'], ['Redur']);
  pruef('Eine ist hervorgehoben', reagiert.an, 1);
  pruef('Mit Zähler beschriftet', reagiert.text.trim(), '👍 1');

  /* Noch einmal klicken nimmt sie weg */
  await p.evaluate(() => document.querySelector('.komm-reak button[data-r="👍"]').click());
  await p.waitForTimeout(350);
  const wegReagiert = await p.evaluate((x) =>
    Object.keys(Store.getBlock(x.block).kommentare[0].reaktionen).length, bau);
  pruef('Zweiter Klick nimmt sie zurück', wegReagiert, 0);

  /* --- Antworten -------------------------------------------------------- */
  /* Nicht abwarten: UI.frage öffnet ein Fenster, das erst gefüllt werden muss */
  await p.evaluate((x) => { window.__antwort = Kommentare.antworten(x.block, 'k1'); }, bau);
  await p.waitForTimeout(300);
  const hatFrage = await p.evaluate(() => !!document.querySelector('#fq'));
  pruef('Eingabefenster für die Antwort', hatFrage, true);
  await p.evaluate(async () => {
    const i = document.querySelector('#fq');
    i.value = 'Ja, schaue ich mir an';
    i.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await window.__antwort;
  });
  await p.waitForTimeout(300);
  const nachAntwort = await p.evaluate((x) =>
    (Store.getBlock(x.block).kommentare[0].antworten || []).map(a => a.text), bau);
  pruef('Antwort im Faden gespeichert', nachAntwort, ['Ja, schaue ich mir an']);

  /* Im Panel sichtbar */
  await p.evaluate((x) => { document.querySelectorAll('.overlay').forEach(o => o.remove());
                            Kommentare.panel(x.seite); }, bau);
  await p.waitForTimeout(350);
  const faden = await p.evaluate(() => ({
    faeden: document.querySelectorAll('.komm-faden').length,
    antworten: document.querySelectorAll('.komm-antwort').length,
    text: (document.querySelector('.komm-antwort .komm-txt') || {}).textContent
  }));
  pruef('Faden wird gezeigt',      faden.faeden, 1);
  pruef('Eine Antwort darin',      faden.antworten, 1);
  pruef('Mit dem richtigen Text',  faden.text, 'Ja, schaue ich mir an');

  /* Antwort löschen */
  await p.evaluate(() => document.querySelector('[data-a="antwort-weg"]').click());
  await p.waitForTimeout(350);
  const gelöscht = await p.evaluate((x) =>
    (Store.getBlock(x.block).kommentare[0].antworten || []).length, bau);
  pruef('Antwort gelöscht', gelöscht, 0);

  /* --- Erwähnungen an mich --------------------------------------------- */
  const anMich = await p.evaluate((x) => {
    const b2 = Store.getBlock(x.block);
    const liste = b2.kommentare.slice();
    liste.push({ id: 'k2', text: 'Kannst du das übernehmen, @Redur?', autor: 'Chef',
                 zeit: Store.now(), erledigt: false, antworten: [], reaktionen: {} });
    Store.updateBlock(x.block, { kommentare: liste });
    return Kommentare.anMich().map(m => m.k.id);
  }, bau);
  pruef('Erwähnung an mich gefunden', anMich, ['k2']);

  const erledigtRaus = await p.evaluate((x) => {
    const b2 = Store.getBlock(x.block);
    const liste = b2.kommentare.map(k => k.id === 'k2' ? { ...k, erledigt: true } : k);
    Store.updateBlock(x.block, { kommentare: liste });
    return Kommentare.anMich().length;
  }, bau);
  pruef('Erledigtes zählt nicht mehr', erledigtRaus, 0);

  /* --- Klick auf die Erwähnung öffnet die Seite ------------------------- */
  await p.evaluate((x) => { document.querySelectorAll('.overlay').forEach(o => o.remove());
                            Kommentare.panel(x.seite); }, bau);
  await p.waitForTimeout(350);
  await p.evaluate(() => document.querySelector('.komm-erw[data-seite]').click());
  await p.waitForTimeout(400);
  const gesprungen = await p.evaluate((x) => ({
    seite: App.aktuelleSeite() === x.ziel,
    zu: !document.querySelector('.komm')
  }), bau);
  pruef('Erwähnung öffnet die Zielseite', gesprungen.seite, true);
  pruef('Das Fenster schliesst dabei',    gesprungen.zu, true);

  console.log(`\n${ok}/${ok + bad} bestanden`);
  console.log(fehler.length ? 'JS-Fehler:\n' + fehler.join('\n') : 'Keine JS-Fehler.');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
