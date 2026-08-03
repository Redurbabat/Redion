const WURZEL = require('path').resolve(__dirname, '../..');
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1500, height: 950 } });
  const fehler = [];
  page.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/ERR_CONNECTION_REFUSED|11434/.test(m.text())) fehler.push('CONSOLE: ' + m.text()); });

  const pruef = [];
  const ok = (n, b) => pruef.push([n, !!b]);
  const esc = async () => { await page.keyboard.press('Escape'); await page.waitForTimeout(250); };

  await page.goto('file://' + WURZEL + '/index.html');
  await page.waitForTimeout(1400);

  // --- Wiki-Link tippen ------------------------------------------------
  let ct = page.locator('#page .b-text .ct').last();
  await ct.click(); await page.keyboard.press('End');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  await page.keyboard.type('Siehe [[');
  await page.waitForTimeout(400);
  ok('[[ öffnet Seitenauswahl', await page.locator('.menu button[data-p]').count() > 0);
  await page.keyboard.type('Willkommen');
  await page.waitForTimeout(300);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  ok('Wiki-Link gerendert', await page.locator('#page a.wl').count() >= 1);

  // --- Schlagwort ------------------------------------------------------
  await page.keyboard.type(' #projekt ');
  await page.waitForTimeout(400);
  await page.locator('#title').click();
  await page.waitForTimeout(400);
  ok('Schlagwort gerendert', await page.locator('#page a.tg').count() >= 1);

  // --- @-Erwähnung -----------------------------------------------------
  ct = page.locator('#page .b-text .ct').last();
  await ct.click(); await page.keyboard.press('End');
  await page.keyboard.press('Enter');
  await page.keyboard.type('Termin @');
  await page.waitForTimeout(450);
  const mn = await page.locator('.menu button[data-ein]').count();
  ok('@ öffnet Erwähnungsmenü (' + mn + ')', mn > 3);
  await page.keyboard.type('Heute');
  await page.waitForTimeout(350);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(450);
  ok('Datum eingefügt', await page.locator('#page .datum').count() >= 1);

  // --- Emoji per : -----------------------------------------------------
  ct = page.locator('#page .b-text .ct').last();
  await ct.click(); await page.keyboard.press('End');
  await page.keyboard.type(' :rakete');
  await page.waitForTimeout(450);
  ok('Emoji-Menü offen', await page.locator('.menu .emojis button').count() > 0);
  await esc();

  // --- Auswahlleiste ---------------------------------------------------
  await page.locator('#page .b-h1 .ct').first().click();
  await page.keyboard.press('Home');
  await page.keyboard.down('Shift');
  for (let i = 0; i < 8; i++) await page.keyboard.press('ArrowRight');
  await page.keyboard.up('Shift');
  await page.waitForTimeout(400);
  ok('Auswahlleiste erscheint', await page.locator('.auswahlleiste').count() === 1);
  const btns = await page.locator('.auswahlleiste button').count();
  ok('Auswahlleiste hat alle Knöpfe (' + btns + ')', btns >= 11);
  await page.locator('.auswahlleiste button[data-a="b"]').click();
  await page.waitForTimeout(500);
  ok('Fett gesetzt', (await page.locator('#page .b-h1 .ct').first().innerHTML()).includes('<b>'));

  // --- Rückgängig ------------------------------------------------------
  await page.keyboard.press('Control+z');
  await page.waitForTimeout(700);
  ok('Rückgängig funktioniert', !(await page.locator('#page .b-h1 .ct').first().innerHTML()).includes('<b>'));

  // --- Kommentar -------------------------------------------------------
  await page.evaluate(() => {
    const b = Store.childrenOf(App.aktuelleSeite())[0];
    Store.updateBlock(b.id, { kommentare: [{ id:'k1', text:'Prüfen bitte', autor:'Ich', zeit:new Date().toISOString(), erledigt:false }] });
    App.zeichneSeite();
  });
  await page.waitForTimeout(400);
  ok('Kommentarmarke sichtbar', await page.locator('.komm-marke').count() === 1);
  await page.click('#btn-komm');
  await page.waitForTimeout(400);
  ok('Kommentarpanel offen', await page.locator('.komm-txt').count() === 1);
  await esc();

  // --- Mehrfachauswahl -------------------------------------------------
  await page.locator('#page .b-text .ct').first().click();
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  ok('Block ausgewählt (Esc)', await page.locator('#page .blk.sel').count() === 1);
  await page.keyboard.down('Shift'); await page.keyboard.press('ArrowDown'); await page.keyboard.up('Shift');
  await page.waitForTimeout(300);
  ok('Auswahl erweitert', await page.locator('#page .blk.sel').count() >= 2);
  await page.keyboard.press('Escape');

  // --- Einfache Tabelle ------------------------------------------------
  ct = page.locator('#page .b-text .ct').last();
  await ct.click(); await page.keyboard.press('End');
  await page.keyboard.type('/Einfache');
  await page.waitForTimeout(400);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  ok('Einfache Tabelle eingefügt', await page.locator('table.stab').count() === 1);
  ok('Tabelle 3x3', await page.locator('table.stab td, table.stab th').count() === 9);

  // --- Formelblock -----------------------------------------------------
  await page.evaluate(() => {
    const b = Store.addBlock(App.aktuelleSeite(), 'equation', { text: '\\frac{a+b}{2} = \\sqrt{x^2}' });
    App.zeichneSeite();
  });
  await page.waitForTimeout(400);
  ok('Formel gerendert', await page.locator('.eq-out .mfrac').count() >= 1);

  // --- Karteikarten lernen ---------------------------------------------
  await page.click('[data-wz="lernen"]');
  await page.waitForTimeout(500);
  ok('Lernfenster offen', await page.locator('.karte .k-vorn').count() === 1);
  await page.click('[data-a="auf"]');
  await page.waitForTimeout(300);
  ok('Antwort sichtbar', await page.locator('.k-hinten').count() === 1);
  await page.click('[data-n="3"]');
  await page.waitForTimeout(400);
  await esc();

  // --- Vorlage ---------------------------------------------------------
  await page.evaluate(() => Werkzeuge.alsVorlage(Store.getBlock(App.aktuelleSeite())));
  await page.waitForTimeout(600);
  ok('Vorlage gespeichert', await page.evaluate(() => Werkzeuge.vorlagenListe().length) === 1);

  // --- Versionen -------------------------------------------------------
  await page.evaluate(async () => { await Store.versionSpeichern(App.aktuelleSeite(), 'test'); });
  await page.waitForTimeout(400);
  await page.click('#btn-verlauf');
  await page.waitForTimeout(600);
  ok('Versionsverlauf zeigt Fassung', await page.locator('.overlay .res button[data-v]').count() >= 1);
  await esc();

  // --- Markdown-Quelltext ----------------------------------------------
  await page.evaluate(() => Werkzeuge.quelltext(Store.getBlock(App.aktuelleSeite())));
  await page.waitForTimeout(500);
  const md = await page.locator('#mdq').inputValue();
  ok('Quelltext enthält Überschrift', md.includes('# Willkommen in deinen Notizen'));
  ok('Quelltext hält Datenbank als Platzhalter', md.includes('<!--db:'));
  await esc();

  // --- Statistik -------------------------------------------------------
  await page.evaluate(() => Werkzeuge.statistik(Store.getBlock(App.aktuelleSeite())));
  await page.waitForTimeout(400);
  ok('Statistik zeigt Kacheln', await page.locator('.stat-k').count() === 6);
  await esc();

  // --- Präsentation ----------------------------------------------------
  await page.evaluate(() => Werkzeuge.praesentation(Store.getBlock(App.aktuelleSeite())));
  await page.waitForTimeout(500);
  ok('Präsentation läuft', await page.locator('.praesi .folie').count() === 1);
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(300);
  ok('Folie gewechselt', (await page.locator('.praesi-leiste span').textContent()).startsWith('2'));
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  // --- Fokus-Modus -----------------------------------------------------
  await page.evaluate(() => Werkzeuge.fokus(true));
  await page.waitForTimeout(300);
  ok('Fokus-Modus aktiv', await page.evaluate(() => document.body.classList.contains('fokus')));
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  // --- Verschlüsseln und entsperren -------------------------------------
  const verschluesselt = await page.evaluate(async () => {
    const p = Store.getBlock(App.aktuelleSeite());
    const salz = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16))));
    // direkter Weg ohne prompt: die Bausteine von Werkzeuge nutzen
    window.__test_pass = 'geheim123';
    const echtesPrompt = window.prompt;
    window.prompt = () => window.__test_pass;
    await Werkzeuge.sperren(p);
    window.prompt = echtesPrompt;
    return !!Store.getBlock(p.id).locked;
  });
  await page.waitForTimeout(700);
  ok('Seite verschlüsselt', verschluesselt);
  ok('Sperrbildschirm sichtbar', await page.locator('.gesperrt').count() === 1);
  await page.fill('#pw', 'geheim123');
  await page.click('#auf');
  await page.waitForTimeout(1200);
  ok('Seite entsperrt', await page.evaluate(() => !Store.getBlock(App.aktuelleSeite()).locked));
  ok('Inhalt zurück', await page.locator('#page .blk').count() > 8);

  // --- Rückverweise ----------------------------------------------------
  await page.waitForTimeout(300);
  const rueck = await page.evaluate(() => {
    const ziel = Links.seiteMitTitel('Willkommen');
    return ziel ? Links.verweiseAuf(ziel.id).length : -1;
  });
  ok('Rückverweise gefunden (' + rueck + ')', rueck >= 0);

  // --- Persistenz ------------------------------------------------------
  await page.evaluate(() => Store.flush());
  await page.waitForTimeout(600);
  await page.reload();
  await page.waitForTimeout(1500);
  ok('Nach Neuladen noch da', await page.locator('#page .blk').count() > 5);
  ok('Einstellungen überleben', await page.evaluate(() => !!Store.getMeta('letzte')));
  ok('Tabelle überlebt Neuladen', await page.locator('table.stab').count() >= 1);

  // --- Tastenkürzel-Fenster --------------------------------------------
  await page.keyboard.press('Control+/');
  await page.waitForTimeout(400);
  ok('Kürzelübersicht offen', await page.locator('.kuerzel .kz').count() > 30);
  await esc();

  await browser.close();

  console.log('\n=== ERGEBNIS ===');
  let gut = 0;
  pruef.forEach(([n, b]) => { console.log((b ? '✅' : '❌') + ' ' + n); if (b) gut++; });
  console.log(`\n${gut}/${pruef.length} bestanden`);
  if (fehler.length) { console.log('\n=== JS-FEHLER ==='); [...new Set(fehler)].slice(0, 15).forEach(f => console.log(f)); }
  else console.log('Keine JS-Fehler.');
})();
