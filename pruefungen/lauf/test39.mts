/* Slash-Befehle und Tastenkürzel — gegen Notions offizielle Hilfeseite. */
import _pfad from 'node:path';
const WURZEL = _pfad.resolve(import.meta.dirname, '../..');
import { chromium } from 'playwright';

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
  const f: any[] = [];
  p.on('pageerror', e => f.push('PAGEERROR: ' + e.message));
  p.on('console', m => { if (m.type() === 'error' && !/11434|CONNECTION_REFUSED|ERR_/i.test(m.text())) f.push('CONSOLE: ' + m.text()); });

  await p.goto('file://' + WURZEL + '/index.html');
  await p.waitForTimeout(1800);

  const pruef: any[] = []; const ok = (n: any, x: any, z?: any) => pruef.push([n, !!x, z]);

  /* --- Notions Slash-Wörter finden alle etwas --------------------------- */
  const NOTION = ['text','plain','page','bullet','num','todo','toggle','div','quote',
                  'h1','#','h2','##','h3','###','mention','date','reminder','equation','emoji',
                  'image','pdf','book','video','audio','code','file','embed',
                  'duplicate','moveto','delete','toc','button','template','bread','math','latex',
                  'turn','color','default','comment'];
  const treffer = await p.evaluate((woerter) => {
    const T = Blocks.TYPEN;
    const suche = (q: any) => T.filter((t: any) => t.name.toLowerCase().includes(q) || t.cmd.some((c: any) => c.startsWith(q)));
    const erg = {} as Record<string, any>;
    woerter.forEach(w => { const r = suche(w); erg[w ?? ''] = r.length ? r[0].name : null; });
    return erg;
  }, NOTION);
  const ohne = Object.entries(treffer).filter(([, v]) => !v).map(([k]) => k);
  ok('Alle ' + NOTION.length + ' Slash-Wörter aus Notions Hilfe finden etwas',
     ohne.length === 0, ohne.join(', '));

  /* --- Die Aktionsgruppe ist da ---------------------------------------- */
  const aktionen = await p.evaluate(() =>
    Blocks.TYPEN.filter((t: any) => t.aktion).map((t: any) => t.aktion));
  ok('Elf Aktionen im Slash-Menü', aktionen.length === 11, aktionen.length + ': ' + aktionen.join(','));
  ok('turn, color, dup, moveto, del sind dabei',
     ['turn','color','dup','moveto','del'].every(x => (aktionen ?? '').includes(x)));
  ok('mention, date, remind, emoji, komm sind dabei',
     ['mention','date','remind','emoji','komm'].every(x => (aktionen ?? '').includes(x)));

  /* --- Kürzel stehen im Menü wie bei Notion ---------------------------- */
  const kurz = await p.evaluate(() => {
    const m = {} as Record<string, any>;
    Blocks.TYPEN.forEach((t: any) => { if (t.kurz) m[t.id] = t.kurz; });
    return m;
  }) as any;
  ok('Ctrl+Shift+0 bis 9 wie in Notions Windows-Belegung',
     kurz.text === 'Ctrl+Shift+0' && kurz.h1 === 'Ctrl+Shift+1' && kurz.h2 === 'Ctrl+Shift+2' &&
     kurz.h3 === 'Ctrl+Shift+3' && kurz.todo === 'Ctrl+Shift+4' && kurz.bullet === 'Ctrl+Shift+5' &&
     kurz.number === 'Ctrl+Shift+6' && kurz.toggle === 'Ctrl+Shift+7' && kurz.code === 'Ctrl+Shift+8' &&
     kurz.page === 'Ctrl+Shift+9', JSON.stringify(kurz).slice(0, 120));
  ok('Ctrl+Shift+E für die Formel', kurz.equation === 'Ctrl+Shift+E', kurz.equation);

  /* --- Strg+Umschalt+Ziffer wandelt wirklich um ------------------------ */
  await p.evaluate(() => {
    const s = Store.addPage(null, { text: 'Tastenprobe', icon: '⌨' });
    Store.addBlock(s.id, 'text', { text: 'Probezeile' });
    App.oeffne(s.id);
  });
  await p.waitForTimeout(600);

  const umwandeln = async (taste: string) => {
    await p.waitForSelector('.blk [contenteditable]', { timeout: 5000 });
    await p.evaluate(() => {
      const el = document.querySelector<HTMLElement>('.blk [contenteditable]');
      if (!el) throw new Error('kein Block sichtbar');
      el.focus();
      const r = document.createRange(); r.selectNodeContents(el); r.collapse(false);
      const s = getSelection();
      if (!s) throw new Error('Es gibt keine Auswahl — der Lauf misst sonst nichts.');
      s.removeAllRanges(); s.addRange(r);
    });
    await p.keyboard.press(taste);
    await p.waitForTimeout(350);
    return p.evaluate(() => {
      const s = Store.rootPages().find(x => x.text === 'Tastenprobe');
      const erste = Store.getBlock(s.content[0] ?? '');
      return erste ? erste.type : null;
    });
  };

  ok('Strg+Umschalt+1 macht eine Überschrift 1', await umwandeln('Control+Shift+Digit1') === 'h1');
  ok('Strg+Umschalt+4 macht eine Aufgabe',      await umwandeln('Control+Shift+Digit4') === 'todo');
  ok('Strg+Umschalt+5 macht einen Listenpunkt', await umwandeln('Control+Shift+Digit5') === 'bullet');
  ok('Strg+Umschalt+8 macht einen Codeblock',   await umwandeln('Control+Shift+Digit8') === 'code');
  ok('Strg+Umschalt+0 macht wieder Text',       await umwandeln('Control+Shift+Digit0') === 'text');
  ok('Strg+Umschalt+E macht eine Formel',       await umwandeln('Control+Shift+E') === 'equation');
  /* Der Formelblock hat kein Textfeld mehr — erst zurückstellen. */
  await p.evaluate(() => {
    const s = Store.rootPages().find(x => x.text === 'Tastenprobe');
    Store.updateBlock(s.content[0], { type: 'text' });
    App.zeichneSeite();
  });
  await p.waitForTimeout(400);
  ok('Die alte Mac-Belegung Strg+Alt+2 geht weiter', await umwandeln('Control+Alt+Digit2') === 'h2');

  /* --- Strg+Alt+T klappt alle Toggles ---------------------------------- */
  const toggles = await p.evaluate(() => {
    const s = Store.rootPages().find(x => x.text === 'Tastenprobe');
    ['eins','zwei','drei'].forEach(t => Store.addBlock(s.id, 'toggle', { text: t, open: false }));
    App.zeichneSeite();
    const zahl = () => Store.getBlock(s.id).content
      .map((id: string) => Store.getBlock(id)).filter((x: any) => x && x.type === 'toggle');
    Blocks.alleToggles();
    const auf = zahl().filter((x: any) => x.open).length;
    Blocks.alleToggles();
    const zu = zahl().filter((x: any) => x.open).length;
    return { auf, zu };
  });
  ok('Strg+Alt+T öffnet alle Toggles', toggles.auf === 3, JSON.stringify(toggles));
  ok('… und schliesst sie wieder', toggles.zu === 0);

  /* --- Strg+Umschalt+U geht eine Ebene hoch ---------------------------- */
  const hoch = await p.evaluate(async () => {
    const s = Store.rootPages().find(x => x.text === 'Tastenprobe');
    const unter = Store.addPage(s.id, { text: 'Unterseite' });
    App.oeffne(unter.id);
    await new Promise(r => setTimeout(r, 200));
    const vorher = App.aktuelleSeite();
    document.dispatchEvent(new KeyboardEvent('keydown',
      { key: 'U', code: 'KeyU', ctrlKey: true, shiftKey: true, bubbles: true }));
    await new Promise(r => setTimeout(r, 300));
    return { vorher, nachher: App.aktuelleSeite(), eltern: s.id };
  });
  ok('Strg+Umschalt+U springt zur übergeordneten Seite',
     hoch.nachher === hoch.eltern, hoch.nachher + ' statt ' + hoch.eltern);

  /* --- Schriftgrösse per Strg + / − / 0 -------------------------------- */
  const schrift = await p.evaluate(async () => {
    const send = (k: any) => document.dispatchEvent(new KeyboardEvent('keydown',
      { key: k, ctrlKey: true, bubbles: true }));
    Store.setMeta('schriftgroesse', 'normal'); Einstellungen.anwenden();
    send('+'); await new Promise(r => setTimeout(r, 120));
    const gross = document.body?.dataset.schrift;
    send('-'); send('-'); await new Promise(r => setTimeout(r, 120));
    const klein = document.body?.dataset.schrift;
    send('0'); await new Promise(r => setTimeout(r, 120));
    return { gross, klein, zurueck: document.body?.dataset.schrift };
  });
  ok('Strg + vergrössert die Schrift', schrift.gross === 'gross', schrift.gross);
  ok('Strg − verkleinert sie', schrift.klein === 'klein', schrift.klein);
  ok('Strg 0 stellt sie zurück', schrift.zurueck === 'normal', schrift.zurueck);

  /* --- Slash-Aktion /duplicate ----------------------------------------- */
  const dupl = await p.evaluate(async () => {
    const s = Store.addPage(null, { text: 'Aktionsprobe', icon: '⚡' });
    const blk = Store.addBlock(s.id, 'text', { text: 'Zeile A' });
    App.oeffne(s.id);
    await new Promise(r => setTimeout(r, 300));
    const ct = document.querySelector(`.blk[data-bid="${blk.id}"] [contenteditable]`);
    Blocks.slashAktion(ct, Store.getBlock(blk.id), 'dup');
    await new Promise(r => setTimeout(r, 300));
    return Store.getBlock(s.id).content.map((id: string) => (Store.getBlock(id) || {}).text);
  });
  ok('/duplicate dupliziert den Block', dupl.filter((x: any) => x === 'Zeile A').length === 2, dupl.join(' | '));

  /* --- Slash-Aktion /default entfernt die Farbe ------------------------ */
  const farbe = await p.evaluate(async () => {
    const s = Store.rootPages().find(x => x.text === 'Aktionsprobe');
    const blk = Store.addBlock(s.id, 'text', { text: 'Bunt', color: 'red' });
    App.zeichneSeite();
    await new Promise(r => setTimeout(r, 250));
    const ct = document.querySelector(`.blk[data-bid="${blk.id}"] [contenteditable]`);
    Blocks.slashAktion(ct, Store.getBlock(blk.id), 'default');
    await new Promise(r => setTimeout(r, 250));
    return Store.getBlock(blk.id).color;
  });
  ok('/default nimmt die Farbe weg', !farbe, JSON.stringify(farbe));

  /* --- Slash-Aktion /delete -------------------------------------------- */
  const weg = await p.evaluate(async () => {
    const s = Store.rootPages().find(x => x.text === 'Aktionsprobe');
    const blk = Store.addBlock(s.id, 'text', { text: 'Weg damit' });
    App.zeichneSeite();
    await new Promise(r => setTimeout(r, 250));
    const ct = document.querySelector(`.blk[data-bid="${blk.id}"] [contenteditable]`);
    Blocks.slashAktion(ct, Store.getBlock(blk.id), 'del');
    await new Promise(r => setTimeout(r, 250));
    return Store.getBlock(s.id).content.map((id: string) => (Store.getBlock(id) || {}).text).includes('Weg damit');
  });
  ok('/delete löscht den Block', weg === false);

  console.log('\n=== SLASH-BEFEHLE UND TASTENKÜRZEL ===');
  pruef.forEach(([n, x, z]) => console.log((x ? '✅ ' : '❌ ') + n + (x || z === undefined ? '' : '   → ' + z)));
  console.log('\n' + pruef.filter(x => x[1]).length + '/' + pruef.length + ' bestanden');
  if (f.length) { console.log('\nFEHLER:'); f.slice(0, 8).forEach(x => console.log('  ' + x)); }
  else console.log('Keine JS-Fehler.');
  await b.close();
})();
