/* Papierkorb: Wiederherstellen an anderer Stelle · Seitenleiste umsortieren */
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

  /* --- Papierkorb: Wiederherstellen an anderer Stelle ------------------- */
  const bau = await p.evaluate(async () => {
    const eltern = Store.addBlock(null, 'page', { text: 'Alter Ordner' });
    const kind   = Store.addBlock(eltern.id, 'page', { text: 'Wichtige Notiz' });
    const neuer  = Store.addBlock(null, 'page', { text: 'Neuer Ordner' });
    Store.trashBlock(kind.id);
    Store.trashBlock(eltern.id);        /* der alte Ort ist selbst weg */
    await new Promise(r => setTimeout(r, 200));
    return { eltern: eltern.id, kind: kind.id, neuer: neuer.id };
  });

  await p.evaluate(() => App.papierkorb());
  await p.waitForTimeout(400);
  const pk = await p.evaluate(() => ({
    zeilen: document.querySelectorAll('.res button[data-id]').length,
    taten: [...document.querySelectorAll<HTMLElement>('.res button[data-id]:first-child .pk-tat')]
      .map(x => x.dataset.a)
  }));
  pruef('Zwei Seiten im Papierkorb', pk.zeilen, 2);
  pruef('Drei Tasten je Zeile',      pk.taten, ['restore', 'restore-wo', 'purge']);

  /* Normales Wiederherstellen erkennt den verlorenen Ort */
  await p.evaluate((x) => {
    const btn = [...document.querySelectorAll<HTMLElement>('.res button[data-id]')]
      .find(b2 => b2.dataset.id === x.kind);
    btn?.querySelector<HTMLElement>('[data-a="restore"]')?.click();
  }, bau);
  await p.waitForTimeout(450);
  const gewarnt = await p.evaluate(() => ({
    wahl: !!document.querySelector('#wo-q'),
    ziele: document.querySelectorAll('[data-ziel]').length
  }));
  pruef('Es fragt nach einem neuen Ort', gewarnt.wahl, true);
  pruef('Mit Zielen zur Auswahl',        Number(gewarnt.ziele ?? -1) > 1, true);

  /* Unter den neuen Ordner legen */
  await p.evaluate((x) => {
    document.querySelector<HTMLElement>(`[data-ziel="${x.neuer}"]`)?.click();
  }, bau);
  await p.waitForTimeout(450);
  const verschoben = await p.evaluate((x) => {
    const k = Store.getBlock(x.kind);
    const n = Store.getBlock(x.neuer);
    return { lebt: k.alive !== false, eltern: k.parentId === x.neuer,
             imInhalt: (n.content || []).includes(x.kind),
             kinder: Store.childrenOf(x.neuer).map((y: any) => y.text) };
  }, bau);
  pruef('Seite lebt wieder',           verschoben.lebt, true);
  pruef('Hängt am neuen Ordner',       verschoben.eltern, true);
  pruef('Steht in dessen Inhalt',      verschoben.imInhalt, true);
  pruef('Und ist dort sichtbar',       verschoben.kinder, ['Wichtige Notiz']);

  /* Ganz oben wiederherstellen */
  const nachOben = await p.evaluate(async (x) => {
    Store.trashBlock(x.kind);
    await new Promise(r => setTimeout(r, 150));
    App.papierkorb();
    await new Promise(r => setTimeout(r, 350));
    const btn = [...document.querySelectorAll<HTMLElement>('.res button[data-id]')]
      .find(b2 => b2.dataset.id === x.kind);
    btn?.querySelector<HTMLElement>('[data-a="restore-wo"]')?.click();
    await new Promise(r => setTimeout(r, 300));
    document?.querySelector<HTMLElement>('[data-ziel=""]')?.click();
    await new Promise(r => setTimeout(r, 300));
    const k = Store.getBlock(x.kind);
    return { eltern: k.parentId, oben: Store.rootPages().some(y => y.id === x.kind) };
  }, bau);
  pruef('Ohne Elternseite',   nachOben.eltern, null);
  pruef('Steht ganz oben',    nachOben.oben, true);

  /* --- Seitenleiste umsortieren ---------------------------------------- */
  await p.evaluate(() => { document.querySelectorAll<HTMLElement>('.overlay').forEach(o => o.remove()); });
  const vorher = await p.evaluate(async () => {
    Store.setMeta('sidebarFolge', null);
    /* SEIT E211 SIND DIESE VIER ABSCHNITTE AB WERK AUS.
       Links stehen die BEREICHE, oben im Menüband die Werkzeuge — Redurs
       Wunsch, und in ENTSCHEIDUNGEN.md unter E211 festgehalten. Weg sind
       sie nicht: „Abschnitte anpassen" holt jeden zurück, und dieser
       Prüfpunkt handelt davon, dass sie DANN richtig aussehen.
       Ohne diese Zeile prüfte er nur noch die neue Vorgabe. */
    Store.setMeta('sidebarAn', ['werkzeuge', 'agenten', 'bespr', 'kuerzlich']);
    App.zeichneBaum();
    await new Promise(r => setTimeout(r, 300));
    return [...document.querySelectorAll<HTMLElement>('#tree .side-section span')]
      .map(x => (x.firstChild?.textContent ?? '').trim());
  });
  pruef('Abschnitte in der Grundfolge',
        vorher.slice(0, 2), ['Werkzeuge', 'Agenten']);

  const nachher = await p.evaluate(async () => {
    Store.setMeta('sidebarFolge', ['apps', 'privat', 'werkzeuge', 'favoriten', 'kuerzlich']);
    App.zeichneBaum();
    await new Promise(r => setTimeout(r, 350));
    return [...document.querySelectorAll<HTMLElement>('#tree .side-section span')]
      .map(x => (x.firstChild?.textContent ?? '').trim());
  });
  pruef('Meine Apps steht jetzt oben', nachher[0], 'Meine Apps');
  pruef('Privat danach',               nachher[1], 'Privat');
  pruef('Favoriten vor Kürzlich',
        nachher.indexOf('Favoriten') < nachher.indexOf('Kürzlich verwendet'), true);

  /* Der Anpassmodus zeigt Pfeile */
  const anpass = await p.evaluate(async () => {
    App.abschnitteAnpassen();
    await new Promise(r => setTimeout(r, 350));
    const zeilen = [...document.querySelectorAll<HTMLElement>('#tree .anpass')].map(x => x.textContent);
    const hoch = document.querySelectorAll('[data-hoch]').length;
    const runter = document.querySelectorAll('[data-runter]').length;
    return { zeilen: zeilen.length, hoch, runter,
             zuruecksetzen: zeilen.some(t => (t ?? '').includes('zurücksetzen')) };
  });
  pruef('Alle Abschnitte im Anpassmodus', Number(anpass.zeilen ?? -1) >= 9, true);
  pruef('Pfeile nach oben',    Number(anpass.hoch ?? -1) >= 7, true);
  pruef('Pfeile nach unten',   Number(anpass.runter ?? -1) >= 7, true);
  pruef('Zurücksetzen möglich', anpass.zuruecksetzen, true);

  /* Ein Klick auf den Pfeil verschiebt wirklich */
  const geschoben = await p.evaluate(async () => {
    const zweite = [...document.querySelectorAll<HTMLElement>('#tree .anpass')][1];
    if (!zweite) throw new Error('zweite ist nicht da — der Lauf misst sonst nichts.');
    const name = (zweite.textContent ?? '').replace(/[👁🚫⌃⌄]/g, '').trim();
    zweite?.querySelector<HTMLElement>('[data-hoch]')?.click();
    await new Promise(r => setTimeout(r, 350));
    const jetzt = ([...document.querySelectorAll<HTMLElement>('#tree .anpass')][0]
      ?.textContent ?? '').replace(/[👁🚫⌃⌄]/g, '').trim();
    return { vorher: name, nachher: jetzt };
  });
  pruef('Der zweite ist jetzt der erste', geschoben.nachher, geschoben.vorher);

  /* Zurücksetzen */
  const zurueck = await p.evaluate(async () => {
    [...document.querySelectorAll<HTMLElement>('#tree .anpass')]
      .find(x => (x.textContent ?? '').includes('zurücksetzen'))?.click();
    await new Promise(r => setTimeout(r, 350));
    return Store.getMeta('sidebarFolge', 'weg');
  });
  pruef('Reihenfolge zurückgesetzt', zurueck, null);

  console.log(`\n${ok}/${ok + bad} bestanden`);
  console.log(fehler.length ? 'JS-Fehler:\n' + fehler.join('\n') : 'Keine JS-Fehler.');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
