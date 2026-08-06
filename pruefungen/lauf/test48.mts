/* Fassungen vergleichen: Wortvergleich, Blockvergleich, einzelnes Zurückholen */
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
  await p.waitForTimeout(1500);

  /* --- Wortvergleich --------------------------------------------------- */
  const worte = await p.evaluate(() => ({
    gleich: Vergleich.wortDiff('a b c', 'a b c').map(x => x[0]),
    eins:   Vergleich.wortDiff('der rote Hund', 'der blaue Hund'),
    html:   Vergleich.wortHtml('der rote Hund', 'der blaue Hund'),
    leer:   Vergleich.wortDiff('', 'neu').map(x => x[0])
  }));
  pruef('Gleicher Text: nur gleich',   [...new Set(worte.gleich)], ['gleich']);
  pruef('Ein Wort weg, eins neu',
        worte.eins.filter(x => x[0] !== 'gleich').map(x => (x[1] ?? '').trim()).sort(), ['blaue', 'rote']);
  pruef('HTML markiert weg mit del',   (worte.html ?? '').includes('<del>rote</del>'), true);
  pruef('HTML markiert neu mit ins',   (worte.html ?? '').includes('<ins>blaue</ins>'), true);
  pruef('Aus leer wird nur neu',       worte.leer, ['neu']);

  /* --- Blockvergleich zweier Bäume ------------------------------------- */
  const bau = await p.evaluate(async () => {
    const s = Store.addBlock(null, 'page', { text: 'Bericht' });
    Store.addBlock(s.id, 'text', { text: 'Erster Absatz bleibt gleich' });
    const b2 = Store.addBlock(s.id, 'text', { text: 'Zweiter Absatz wird geändert' });
    const b3 = Store.addBlock(s.id, 'text', { text: 'Dritter Absatz wird gelöscht' });
    App.oeffne(s.id);
    await new Promise(r => setTimeout(r, 350));
    await Store.versionSpeichern(s.id, 'Testfassung');
    /* Jetzt ändern */
    Store.updateBlock(b2.id, { text: 'Zweiter Absatz wurde umgeschrieben' });
    Store.trashBlock(b3.id);
    const b4 = Store.addBlock(s.id, 'text', { text: 'Vierter Absatz ist neu' });
    Store.updateBlock(s.id, { text: 'Bericht 2026' });
    await new Promise(r => setTimeout(r, 250));
    const v = (await Store.versionen(s.id))[0];
    const erg = Vergleich.rechne(v.daten, Vergleich.jetzt(s.id));
    return { seite: s.id, versionId: v.id, zahlen: erg.zahlen,
             titelAlt: erg.titelAlt, titelNeu: erg.titelNeu,
             arten: erg.zeilen.map(z => z.art),
             b2: b2.id, b3: b3.id, b4: b4.id };
  });
  pruef('Ein Block neu',       bau.zahlen.neu, 1);
  pruef('Ein Block geändert',  bau.zahlen.geaendert, 1);
  pruef('Ein Block gelöscht',  bau.zahlen.weg, 1);
  pruef('Einer unverändert',   bau.zahlen.gleich, 1);
  pruef('Titel alt erkannt',   bau.titelAlt, 'Bericht');
  pruef('Titel neu erkannt',   bau.titelNeu, 'Bericht 2026');

  /* --- Dialog ---------------------------------------------------------- */
  await p.evaluate(async (s) => { await Vergleich.dialog(Store.getBlock(s.seite)); }, bau);
  await p.waitForTimeout(400);
  const dialog = await p.evaluate(() => ({
    zeilen:  document.querySelectorAll('.vg-zeile').length,
    neu:     document.querySelectorAll('.vg-zeile.vg-neu').length,
    weg:     document.querySelectorAll('.vg-zeile.vg-weg').length,
    geaendert: document.querySelectorAll('.vg-zeile.vg-geaendert').length,
    gleich:  document.querySelectorAll('.vg-zeile.vg-gleich').length,
    zahlen:  [...document.querySelectorAll<HTMLElement>('.vg-z')].map(x => x.textContent),
    ins:     !!document.querySelector('.vg-inhalt ins'),
    del:     !!document.querySelector('.vg-inhalt del'),
    knoepfe: document.querySelectorAll('.vg-zeile button[data-zurueck]').length
  }));
  pruef('Nur Unterschiede: drei Zeilen', dialog.zeilen, 3);
  pruef('Unverändertes ausgeblendet',    dialog.gleich, 0);
  pruef('Neu, weg und geändert je einmal',
        [dialog.neu, dialog.weg, dialog.geaendert], [1, 1, 1]);
  pruef('Zusammenfassung zeigt +1 neu',  dialog.zahlen[0], '+1 neu');
  pruef('Geänderte Wörter grün markiert', dialog.ins, true);
  pruef('Entfernte Wörter rot markiert',  dialog.del, true);
  pruef('Zurückholen je Zeile möglich',   dialog.knoepfe, 3);

  /* Alles zeigen */
  await p.evaluate(() => {
    const c = document.querySelector<HTMLInputElement>('#vg-nur');
    if (!c) throw new Error('#vg-nur ist nicht da — der Lauf misst sonst nichts.');
    c.checked = false;
    c.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await p.waitForTimeout(300);
  const alle = await p.evaluate(() => document.querySelectorAll('.vg-zeile').length);
  pruef('Mit allem: vier Zeilen', alle, 4);

  /* --- Einzelnen Block zurückholen ------------------------------------- */
  /* Der geänderte Absatz */
  await p.evaluate(() => {
    const zeile = [...document.querySelectorAll<HTMLElement>('.vg-zeile.vg-geaendert')][0];
    if (!zeile) throw new Error('zeile ist nicht da — der Lauf misst sonst nichts.');
    zeile?.querySelector<HTMLElement>('button[data-zurueck]')?.click();
  });
  await p.waitForTimeout(700);
  const zurueck = await p.evaluate((s) => Store.getBlock(s.b2).text, bau);
  pruef('Geänderter Block ist zurück', zurueck, 'Zweiter Absatz wird geändert');

  /* Der gelöschte Absatz */
  await p.evaluate(() => {
    const zeile = [...document.querySelectorAll<HTMLElement>('.vg-zeile.vg-weg')][0];
    zeile?.querySelector<HTMLElement>('button[data-zurueck]')?.click();
  });
  await p.waitForTimeout(700);
  const wiederDa = await p.evaluate((s) =>
    Store.childrenOf(s.seite).map((b: any) => b.text), bau);
  pruef('Gelöschter Block ist wieder da',
        wiederDa.some((t: any) => (t ?? '').includes('Dritter Absatz')), true);

  /* Der neu hinzugekommene Absatz wird entfernt */
  await p.evaluate(() => {
    const zeile = [...document.querySelectorAll<HTMLElement>('.vg-zeile.vg-neu')][0];
    zeile?.querySelector<HTMLElement>('button[data-zurueck]')?.click();
  });
  await p.waitForTimeout(700);
  const wegJetzt = await p.evaluate((s) =>
    Store.childrenOf(s.seite).map((b: any) => b.text), bau);
  pruef('Neuer Block wieder entfernt',
        wegJetzt.some((t: any) => (t ?? '').includes('Vierter Absatz')), false);

  /* Nach dem Zurückholen sollte kein Unterschied mehr übrig sein ausser dem Titel */
  const rest = await p.evaluate(async (s) => {
    const v = (await Store.versionen(s.seite)).find(x => x.anlass === 'Testfassung');
    const erg = Vergleich.rechne(v.daten, Vergleich.jetzt(s.seite));
    return { geaendert: erg.zahlen.geaendert, weg: erg.zahlen.weg, neu: erg.zahlen.neu };
  }, bau);
  pruef('Keine geänderten Blöcke mehr', rest.geaendert, 0);
  pruef('Nichts mehr gelöscht',         rest.weg, 0);

  /* --- Ganze Fassung zurückholen --------------------------------------- */
  const ganz = await p.evaluate(async (s) => {
    document?.querySelector<HTMLElement>('.overlay [data-a="zu"]')?.click();
    Store.updateBlock(s.seite, { text: 'Ganz anders' });
    Store.childrenOf(s.seite).forEach((b: any) => Store.updateBlock(b.id, { text: 'überschrieben' }));
    await new Promise(r => setTimeout(r, 200));
    const v = (await Store.versionen(s.seite)).find(x => x.anlass === 'Testfassung');
    Store.kinderLeeren(s.seite);
    (v.daten.kinder || []).forEach((k: any) => Store.baumEinfuegen(k, s.seite));
    Store.updateBlock(s.seite, { text: v.daten.text, icon: v.daten.icon });
    await new Promise(r => setTimeout(r, 300));
    return { titel: Store.getBlock(s.seite).text,
             texte: Store.childrenOf(s.seite).map((b: any) => b.text) };
  }, bau);
  pruef('Titel wiederhergestellt', ganz.titel, 'Bericht');
  pruef('Alle drei Absätze zurück', ganz.texte.length, 3);
  pruef('Erster Absatz stimmt', ganz.texte[0], 'Erster Absatz bleibt gleich');

  console.log(`\n${ok}/${ok + bad} bestanden`);
  console.log(fehler.length ? 'JS-Fehler:\n' + fehler.join('\n') : 'Keine JS-Fehler.');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
