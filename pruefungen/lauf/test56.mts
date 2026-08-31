/* Kommentarfäden: Antworten, Reaktionen, Erwähnungen */
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
  pruef('Zu kurze werden übergangen', (erw.gefunden ?? '').includes('x'), false);
  pruef('Bekannte Seite wird Link',  (erw.html ?? '').includes('data-seite='), true);
  pruef('Unbekannte bleibt grau',    (erw.html ?? '').includes('komm-erw tot'), true);

  /* --- Das Panel -------------------------------------------------------- */
  await p.evaluate((x) => Kommentare.panel(x.seite), bau);
  await p.waitForTimeout(350);
  const panel = await p.evaluate(() => ({
    kommentare: document.querySelectorAll('.komm').length,
    reaktionen: document.querySelectorAll('.komm-reak button').length,
    knoepfe: [...document.querySelectorAll<HTMLElement>('.komm-fuss button')].map(x => x.textContent),
    link: !!document.querySelector('.komm-erw[data-seite]'),
    tot: !!document.querySelector('.komm-erw.tot')
  }));
  pruef('Ein Kommentar sichtbar',   panel.kommentare, 1);
  pruef('Sechs Reaktionen zur Wahl', panel.reaktionen, 6);
  pruef('Antworten-Knopf da',       (panel.knoepfe ?? '').includes('Antworten'), true);
  pruef('Erwähnung als Link',       panel.link, true);
  pruef('Unbekannte Erwähnung grau', panel.tot, true);

  /* --- Reagieren -------------------------------------------------------- */
  await p.evaluate(() => document.querySelector<HTMLElement>('.komm-reak button[data-r="👍"]')?.click());
  await p.waitForTimeout(350);
  const reagiert = await p.evaluate((x) => ({
    gespeichert: Store.getBlock(x.block).kommentare[0].reaktionen,
    an: document.querySelectorAll('.komm-reak button.an').length,
    text: (document.querySelector('.komm-reak button.an') || {}).textContent
  }), bau);
  pruef('Reaktion gespeichert',   reagiert.gespeichert['👍'], ['Redur']);
  pruef('Eine ist hervorgehoben', reagiert.an, 1);
  pruef('Mit Zähler beschriftet', reagiert.text?.trim(), '👍 1');

  /* Noch einmal klicken nimmt sie weg */
  await p.evaluate(() => document.querySelector<HTMLElement>('.komm-reak button[data-r="👍"]')?.click());
  await p.waitForTimeout(350);
  const wegReagiert = await p.evaluate((x) =>
    Object.keys(Store.getBlock(x.block).kommentare[0].reaktionen).length, bau);
  pruef('Zweiter Klick nimmt sie zurück', wegReagiert, 0);

  /* --- Antworten -------------------------------------------------------- */
  /* Nicht abwarten: UI.frage öffnet ein Fenster, das erst gefüllt werden muss */
  await p.evaluate((x) => { (window as any).__antwort = Kommentare.antworten(x.block, 'k1'); }, bau);
  await p.waitForTimeout(300);
  const hatFrage = await p.evaluate(() => !!document.querySelector('#fq'));
  pruef('Eingabefenster für die Antwort', hatFrage, true);
  await p.evaluate(async () => {
    const i = document.querySelector<HTMLInputElement>('#fq');
    if (!i) throw new Error('#fq ist nicht da — der Lauf misst sonst nichts.');
    i.value = 'Ja, schaue ich mir an';
    i.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await (window as any).__antwort;
  });
  await p.waitForTimeout(300);
  const nachAntwort = await p.evaluate((x) =>
    (Store.getBlock(x.block).kommentare[0].antworten || []).map((a: any) => a.text), bau);
  pruef('Antwort im Faden gespeichert', nachAntwort, ['Ja, schaue ich mir an']);

  /* Im Panel sichtbar */
  await p.evaluate((x) => { document.querySelectorAll<HTMLElement>('.overlay').forEach(o => o.remove());
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
  await p.evaluate(() => document.querySelector<HTMLElement>('[data-a="antwort-weg"]')?.click());
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
    const liste = b2.kommentare.map((k: any) => k.id === 'k2' ? { ...k, erledigt: true } : k);
    Store.updateBlock(x.block, { kommentare: liste });
    return Kommentare.anMich().length;
  }, bau);
  pruef('Erledigtes zählt nicht mehr', erledigtRaus, 0);

  /* --- Klick auf die Erwähnung öffnet die Seite ------------------------- */
  await p.evaluate((x) => { document.querySelectorAll<HTMLElement>('.overlay').forEach(o => o.remove());
                            Kommentare.panel(x.seite); }, bau);
  await p.waitForTimeout(350);
  await p.evaluate(() => document.querySelector<HTMLElement>('.komm-erw[data-seite]')?.click());
  await p.waitForTimeout(400);
  const gesprungen = await p.evaluate((x) => ({
    seite: App.aktuelleSeite() === x.ziel,
    zu: !document.querySelector('.komm')
  }), bau);
  pruef('Erwähnung öffnet die Zielseite', gesprungen.seite, true);
  pruef('Das Fenster schliesst dabei',    gesprungen.zu, true);

  /* --- Ein Kommentar an einem VERSCHACHTELTEN Block (E275, L98) ---------
     `anMich()` liefert den Block, nicht die Seite. Beide Stellen, die daraus
     eine Zeile bauen — der Posteingang und die Kontextkante —, riefen
     `App.oeffne(block.parentId)`. Für einen Block auf oberster Ebene ist das
     die Seite und stimmt. Für einen verschachtelten ist es der ELTERNBLOCK,
     und der wurde dann wie eine Seite gezeichnet: Krume „Skript / Kapitel 4",
     Inhalt die Toggle statt der Seite.

     Es führte also nicht ins Leere — deshalb hat es niemand gemeldet —,
     sondern an einen Ort, den es als Seite gar nicht gibt.

     `App.zeigeBlock` kann es seit E105 richtig. Der Punkt misst genau den
     Unterschied: nach dem Sprung muss die offene SEITE die Seite sein. */
  const tief = await p.evaluate(async () => {
    const s2 = Store.addBlock(null, 'page', { text: 'Skript mit Verschachtelung' });
    const oben = Store.addBlock(s2.id, 'toggle', { text: 'Kapitel 4' });
    const kind = Store.addBlock(oben.id, 'text', { text: 'Die Rechnung dazu' });
    Store.updateBlock(kind.id, { kommentare: [{
      id: 'k3', text: '@Redur bitte nachrechnen', autor: 'Lehrer',
      zeit: Store.now(), erledigt: false, antworten: [], reaktionen: {} }] });

    const treffer = Kommentare.anMich().find((m: any) => m.k.id === 'k3');
    /* Der alte Weg, zum Vergleich: `parentId` ist NICHT die Seite. */
    const alterWeg = treffer.block.parentId;
    App.zeigeBlock(treffer.block.id);
    await new Promise(r => setTimeout(r, 400));
    return {
      gefunden: !!treffer,
      alterWegWaerDieSeite: alterWeg === s2.id,
      offen: App.aktuelleSeite() === s2.id,
      krume: (document.getElementById('crumb')?.textContent || '').trim()
    };
  });
  pruef('Die Erwähnung am tiefen Block wird gefunden', tief.gefunden, true);
  /* Die Gegenprobe zum Punkt darunter: wäre `parentId` schon die Seite,
     hätte der alte Weg gestimmt und der neue nichts verbessert. */
  pruef('Gegenprobe: `parentId` ist hier NICHT die Seite',
        tief.alterWegWaerDieSeite, false);
  pruef('Der Sprung öffnet die echte Seite',  tief.offen, true);
  pruef('Und die Krume zeigt sie, nicht den Elternblock',
        /Skript mit Verschachtelung$/.test(tief.krume), true);

  console.log(`\n${ok}/${ok + bad} bestanden`);
  console.log(fehler.length ? 'JS-Fehler:\n' + fehler.join('\n') : 'Keine JS-Fehler.');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
