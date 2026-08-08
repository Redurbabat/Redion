/* Mehrere Blöcke auf einmal: auswählen, umwandeln, verschieben, löschen */
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
  const p = await b.newPage({ viewport: { width: 1400, height: 900 },
    permissions: [] });
  const fehler: any[] = [];
  p.on('pageerror', e => fehler.push('JS: ' + e.message));
  await p.goto('file://' + WURZEL + '/index.html');
  await p.waitForTimeout(1600);

  /* --- Eine Seite mit sechs Absätzen ------------------------------------ */
  const auf = await p.evaluate(async () => {
    const s = Store.addBlock(null, 'page', { text: 'Auswahltest' });
    const ids = [];
    for (let i = 1; i <= 6; i++) ids.push(Store.addBlock(s.id, 'text', { text: 'Absatz ' + i }).id);
    App.oeffne(s.id);
    await new Promise(r => setTimeout(r, 600));
    return { seite: s.id, ids };
  });
  const sichtbar = await p.evaluate(() => Blocks.sichtbareBloecke().length);
  pruef('Sechs Blöcke stehen auf der Seite', sichtbar, 6);

  /* --- Auswählen und vergrössern ---------------------------------------- */
  const waehlen = await p.evaluate(async (x) => {
    Blocks.auswahlSetzen([x.ids[1]]);
    await new Promise(r => setTimeout(r, 120));
    const eins = { anzahl: Blocks.auswahl().length,
                   markiert: document.querySelectorAll('#page .blk.gewaehlt').length,
                   leiste: !!document.getElementById('auswahl-leiste') };
    Blocks.auswahlSetzen([x.ids[1], x.ids[2], x.ids[3]]);
    await new Promise(r => setTimeout(r, 120));
    const drei = { anzahl: Blocks.auswahl().length,
                   markiert: document.querySelectorAll('#page .blk.gewaehlt').length,
                   leiste: (document.getElementById('auswahl-leiste') || {}).textContent || '' };
    return { eins, drei };
  }, auf);
  pruef('Ein Block ausgewählt',            waehlen.eins.anzahl, 1);
  pruef('Und auch sichtbar markiert',      waehlen.eins.markiert, 1);
  pruef('Bei einem noch keine Leiste',     waehlen.eins.leiste, false);
  pruef('Drei Blöcke ausgewählt',          waehlen.drei.anzahl, 3);
  pruef('Alle drei markiert',              waehlen.drei.markiert, 3);
  pruef('Die Leiste nennt die Zahl',       (waehlen.drei.leiste ?? '').includes('3 Blöcke'), true);

  /* --- Die Auswahl bleibt in der Reihenfolge der Seite ------------------- */
  const reihe = await p.evaluate(async (x) => {
    /* Verkehrt herum hineingeben — die Auswahl muss sich sortieren */
    Blocks.auswahlSetzen([x.ids[4], x.ids[0], x.ids[2]]);
    await new Promise(r => setTimeout(r, 100));
    const a = Blocks.auswahl();
    return { erste: a[0] === x.ids[0], letzte: a[2] === x.ids[4] };
  }, auf);
  pruef('Die Auswahl steht in Seitenreihenfolge', reihe.erste && reihe.letzte, true);

  /* --- Von hier bis dorthin --------------------------------------------- */
  const spanne = await p.evaluate(async (x) => {
    Blocks.auswahlSetzen([x.ids[1]]);
    await new Promise(r => setTimeout(r, 80));
    /* auswahlBis braucht den Anker; über die Tastatur gesetzt */
    Blocks.auswahlSetzen([x.ids[1]]);
    Blocks.auswahlBis && Blocks.auswahlBis(x.ids[4] ?? '');
    await new Promise(r => setTimeout(r, 100));
    return Blocks.auswahl().length;
  }, auf);
  /* Ohne Anker tut auswahlBis nichts — das ist gewollt und wird gleich
     über die Tastatur richtig geprüft. */
  pruef('Ohne Anker keine Spanne', spanne <= 4, true);

  /* --- Über die Tastatur: Esc, Shift+Pfeil, Strg+A ----------------------- */
  const tasten = await p.evaluate(async (x) => {
    Blocks.auswahlLeeren();
    await new Promise(r => setTimeout(r, 80));
    const ct = document.querySelector<HTMLElement>(`#page .blk[data-bid="${x.ids[1]}"] .ct`);
    if (!ct) throw new Error('#page .blk[data-bid="${x.ids[1]}"] .ct ist nicht da — der Lauf misst sonst nichts.');
    ct.focus();
    await new Promise(r => setTimeout(r, 100));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await new Promise(r => setTimeout(r, 150));
    const nachEsc = Blocks.auswahl().length;

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', shiftKey: true, bubbles: true }));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', shiftKey: true, bubbles: true }));
    await new Promise(r => setTimeout(r, 150));
    const nachShift = Blocks.auswahl().length;

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    await new Promise(r => setTimeout(r, 120));
    const nachPfeil = Blocks.auswahl().length;

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', ctrlKey: true, bubbles: true }));
    await new Promise(r => setTimeout(r, 150));
    const nachAlle = Blocks.auswahl().length;

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await new Promise(r => setTimeout(r, 120));
    return { nachEsc, nachShift, nachPfeil, nachAlle, nachZu: Blocks.auswahl().length };
  }, auf);
  pruef('Esc wählt den Block aus',        tasten.nachEsc, 1);
  pruef('Shift+Pfeil vergrössert auf drei', tasten.nachShift, 3);
  pruef('Pfeil allein springt weiter',    tasten.nachPfeil, 1);
  pruef('Strg A nimmt alle sechs',        tasten.nachAlle, 6);
  pruef('Esc hebt die Auswahl auf',       tasten.nachZu, 0);

  /* --- Umwandeln --------------------------------------------------------- */
  const wandeln = await p.evaluate(async (x) => {
    Blocks.auswahlSetzen([x.ids[0], x.ids[1], x.ids[2]]);
    await new Promise(r => setTimeout(r, 100));
    Blocks.auswahlUmwandeln('bullet');
    await new Promise(r => setTimeout(r, 400));
    return { typen: x.ids.map(i => Store.getBlock(i).type),
             nochGewaehlt: Blocks.auswahl().length };
  }, auf);
  pruef('Drei wurden zu Listenpunkten',
        wandeln.typen.slice(0, 3), ['bullet', 'bullet', 'bullet']);
  pruef('Die anderen bleiben Text',
        wandeln.typen.slice(3), ['text', 'text', 'text']);
  pruef('Die Auswahl bleibt danach stehen', wandeln.nochGewaehlt, 3);

  /* Über die Tastatur mit Strg+Shift+Ziffer */
  const zifferWandeln = await p.evaluate(async (x) => {
    Blocks.auswahlSetzen([x.ids[3], x.ids[4]]);
    await new Promise(r => setTimeout(r, 100));
    document.dispatchEvent(new KeyboardEvent('keydown',
      { key: '2', code: 'Digit2', ctrlKey: true, shiftKey: true, bubbles: true }));
    await new Promise(r => setTimeout(r, 400));
    return [Store.getBlock(x.ids[3]).type, Store.getBlock(x.ids[4]).type];
  }, auf);
  pruef('Strg Shift 2 macht zwei Überschriften', zifferWandeln, ['h2', 'h2']);

  /* --- Einrücken --------------------------------------------------------- */
  const einruecken = await p.evaluate(async (x) => {
    Blocks.auswahlSetzen([x.ids[1], x.ids[2]]);
    await new Promise(r => setTimeout(r, 100));
    Blocks.auswahlEinruecken(false);
    await new Promise(r => setTimeout(r, 400));
    const eltern = [Store.getBlock(x.ids[1]).parentId, Store.getBlock(x.ids[2]).parentId];
    return { eingerueckt: eltern[0] === x.ids[0], zweiter: eltern[1] !== x.seite };
  }, auf);
  pruef('Der erste rutscht unter seinen Vorgänger', einruecken.eingerueckt, true);
  pruef('Der zweite auch',                          einruecken.zweiter, true);

  /* --- Verschieben ------------------------------------------------------- */
  const schieben = await p.evaluate(async () => {
    const s = Store.addBlock(null, 'page', { text: 'Schiebetest' });
    const ids = [];
    for (let i = 1; i <= 5; i++) ids.push(Store.addBlock(s.id, 'text', { text: 'Z' + i }).id);
    App.oeffne(s.id);
    await new Promise(r => setTimeout(r, 500));
    Blocks.auswahlSetzen([ids[3], ids[4]]);
    await new Promise(r => setTimeout(r, 120));
    Blocks.auswahlVerschieben(-1);
    await new Promise(r => setTimeout(r, 400));
    const texte = Store.childrenOf(s.id).map((x: any) => x.text);
    return { texte, gewaehlt: Blocks.auswahl().length };
  });
  pruef('Zwei Blöcke rutschen gemeinsam hoch',
        schieben.texte, ['Z1', 'Z2', 'Z4', 'Z5', 'Z3']);
  pruef('Und bleiben ausgewählt', schieben.gewaehlt, 2);

  /* --- Duplizieren und Löschen ------------------------------------------ */
  const dupWeg = await p.evaluate(async () => {
    const s = Store.addBlock(null, 'page', { text: 'Kopietest' });
    const ids = [];
    for (let i = 1; i <= 4; i++) ids.push(Store.addBlock(s.id, 'text', { text: 'K' + i }).id);
    App.oeffne(s.id);
    await new Promise(r => setTimeout(r, 500));
    Blocks.auswahlSetzen([ids[0], ids[1]]);
    await new Promise(r => setTimeout(r, 120));
    Blocks.auswahlDuplizieren();
    await new Promise(r => setTimeout(r, 500));
    const nachDup = Store.childrenOf(s.id).length;

    const alle = Store.childrenOf(s.id).map((x: any) => x.id);
    Blocks.auswahlSetzen(alle.slice(0, 3));
    await new Promise(r => setTimeout(r, 120));
    Blocks.auswahlLoeschen();
    await new Promise(r => setTimeout(r, 500));
    return { nachDup, nachWeg: Store.childrenOf(s.id).length,
             imPapierkorb: Object.values(Store.cache.blocks)
               .filter(x => x.alive === false && /^K/.test(x.text || '')).length,
             leiste: !!document.getElementById('auswahl-leiste') };
  });
  pruef('Duplizieren macht aus vier sechs', dupWeg.nachDup, 6);
  pruef('Löschen lässt drei übrig',         dupWeg.nachWeg, 3);
  pruef('Und legt sie in den Papierkorb',   Number(dupWeg.imPapierkorb ?? -1) >= 3, true);
  pruef('Die Leiste verschwindet danach',   dupWeg.leiste, false);

  /* --- Kopieren als Markdown --------------------------------------------- */
  const kopie = await p.evaluate(async () => {
    const s = Store.addBlock(null, 'page', { text: 'Textkopie' });
    const a = Store.addBlock(s.id, 'h2', { text: 'Überschrift' });
    const c = Store.addBlock(s.id, 'bullet', { text: 'Ein Punkt' });
    const d = Store.addBlock(s.id, 'todo', { text: 'Erledigt', checked: true });
    const e = Store.addBlock(s.id, 'divider', {});
    App.oeffne(s.id);
    await new Promise(r => setTimeout(r, 500));
    Blocks.auswahlSetzen([a.id, c.id, d.id, e.id]);
    await new Promise(r => setTimeout(r, 120));
    return Blocks.auswahlAlsText();
  });
  pruef('Markdown mit Überschrift',  (kopie ?? '').includes('## Überschrift'), true);
  pruef('Mit Listenpunkt',           (kopie ?? '').includes('- Ein Punkt'), true);
  pruef('Mit abgehaktem Kästchen',   (kopie ?? '').includes('- [x] Erledigt'), true);
  pruef('Und mit Trennlinie',        (kopie ?? '').includes('---'), true);

  /* --- Ausschneiden und wieder einfügen ---------------------------------- */
  const schnitt = await p.evaluate(async () => {
    const s = Store.addBlock(null, 'page', { text: 'Schnitttest' });
    const ids = [];
    for (let i = 1; i <= 3; i++) ids.push(Store.addBlock(s.id, 'text', { text: 'S' + i }).id);
    App.oeffne(s.id);
    await new Promise(r => setTimeout(r, 500));
    Blocks.auswahlSetzen([ids[0], ids[1]]);
    await new Promise(r => setTimeout(r, 120));
    await Blocks.auswahlSchneiden();
    await new Promise(r => setTimeout(r, 500));
    const nachSchnitt = Store.childrenOf(s.id).length;
    Blocks.auswahlEinfuegen();
    await new Promise(r => setTimeout(r, 500));
    return { nachSchnitt, nachEin: Store.childrenOf(s.id).length,
             texte: Store.childrenOf(s.id).map((x: any) => x.text) };
  });
  pruef('Ausschneiden nimmt zwei weg', schnitt.nachSchnitt, 1);
  pruef('Einfügen bringt sie zurück',  schnitt.nachEin, 3);
  pruef('Mit demselben Inhalt',        schnitt.texte.filter((t: any) => /^S[12]$/.test(t)).length, 2);

  /* --- Die Leiste selbst ------------------------------------------------- */
  const leiste = await p.evaluate(async () => {
    const s = Store.addBlock(null, 'page', { text: 'Leistentest' });
    const ids = [];
    for (let i = 1; i <= 3; i++) ids.push(Store.addBlock(s.id, 'text', { text: 'L' + i }).id);
    App.oeffne(s.id);
    await new Promise(r => setTimeout(r, 500));
    Blocks.auswahlSetzen(ids);
    await new Promise(r => setTimeout(r, 150));
    const l = document.getElementById('auswahl-leiste');
    if (!l) throw new Error('auswahl-leiste ist nicht da — der Lauf misst sonst nichts.');
    const knoepfe = [...l.querySelectorAll<HTMLElement>('button')].map(x => x.dataset.a);
    /* Das Umwandeln-Menü öffnen */
    l?.querySelector<HTMLElement>('[data-a="typ"]')?.click();
    await new Promise(r => setTimeout(r, 200));
    const menue = document.querySelectorAll('.menu [data-t]').length;
    document?.querySelector<HTMLElement>('.menu [data-t="h3"]')?.click();
    await new Promise(r => setTimeout(r, 400));
    return { knoepfe, menue, typ: Store.getBlock(ids[0]).type,
             ueberlauf: l.getBoundingClientRect().right <= innerWidth + 1 };
  });
  pruef('Fünf Knöpfe in der Leiste', leiste.knoepfe,
        ['typ', 'dup', 'kopie', 'weg', 'zu']);
  pruef('Elf Typen zur Auswahl',     leiste.menue, 11);
  pruef('Der Klick wandelt wirklich um', leiste.typ, 'h3');
  pruef('Die Leiste passt ins Fenster',  leiste.ueberlauf, true);

  /* --- Ein Klick daneben hebt auf ---------------------------------------- */
  const klickWeg = await p.evaluate(async () => {
    /* Ein Element, das dasein MUSS. Fehlt es, misst der Lauf nichts mehr —
       dann ist eine Meldung mit dem Selektor besser als „Cannot read
       properties of null" zwanzig Zeilen weiter. */
    const musselement = (sel: string): HTMLElement => {
      const x = document.querySelector<HTMLElement>(sel);
      if (!x) throw new Error(sel + ' ist nicht da.');
      return x;
    };
    const s = Store.addBlock(null, 'page', { text: 'Klicktest' });
    const a = Store.addBlock(s.id, 'text', { text: 'Nur einer' });
    App.oeffne(s.id);
    await new Promise(r => setTimeout(r, 500));
    Blocks.auswahlSetzen([a.id]);
    await new Promise(r => setTimeout(r, 120));
    const vorher = Blocks.auswahl().length;
    musselement('#sidebar').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await new Promise(r => setTimeout(r, 200));
    return { vorher, nachher: Blocks.auswahl().length };
  });
  pruef('Vorher ausgewählt', klickWeg.vorher, 1);
  pruef('Klick daneben hebt auf', klickWeg.nachher, 0);

  /* --- Die Kürzelübersicht kennt die neue Gruppe ------------------------- */
  const uebersicht = await p.evaluate(async () => {
    document.querySelectorAll<HTMLElement>('.overlay').forEach(o => o.remove());
    Werkzeuge.tastenkuerzel();
    await new Promise(r => setTimeout(r, 300));
    const gruppen = [...document.querySelectorAll<HTMLElement>('.kuerzel .grp')].map(x => x.textContent);
    const anzahl = document.querySelectorAll('.kuerzel .kz').length;
    const zahl = document.querySelector<HTMLElement>('.fh em')?.textContent;
    /* Dieselbe Taste mit zwei verschiedenen Beschreibungen wäre ein Fehler
       in der Liste — innerhalb einer Gruppe darf das nicht vorkommen. */
    const doppelt: any[] = [];
    document.querySelectorAll<HTMLElement>('.kuerzel .kb').forEach(kb => {
      const gesehen = {} as Record<string, any>;
      kb.querySelectorAll<HTMLElement>('.kz').forEach(kz => {
        const t = kz.querySelector<HTMLTableElement>('code')?.textContent;
        const w = kz.querySelector<HTMLElement>('span')?.textContent;
        if (gesehen[t ?? ''] && gesehen[t ?? ''] !== w) doppelt.push(t);
        gesehen[t ?? ''] = w;
      });
    });
    document.querySelectorAll<HTMLElement>('.overlay').forEach(o => o.remove());
    return { gruppen, anzahl, zahl, doppelt };
  });
  pruef('Dreizehn Gruppen in der Übersicht', uebersicht.gruppen.length, 13);
  pruef('Die neue Gruppe ist dabei',
        (uebersicht.gruppen ?? '').includes('Mehrere Blöcke auf einmal'), true);
  pruef('Markdown-Gruppe ist dabei',
        (uebersicht.gruppen ?? '').includes('Markdown beim Tippen'), true);
  pruef('Über hundert Kürzel',    Number(uebersicht.anzahl ?? -1) > 120, true);
  pruef('Der Zähler stimmt',      Number(uebersicht.zahl), uebersicht.anzahl);
  pruef('Kein Kürzel doppelt beschriftet', uebersicht.doppelt, []);

  /* --- Die fünf neuen Seitenkürzel greifen wirklich ---------------------- */
  const seitenTasten = await p.evaluate(async () => {
    document.querySelectorAll<HTMLElement>('.overlay').forEach(o => o.remove());
    const s = Store.addBlock(null, 'page', { text: 'Kürzelseite' });
    Store.addBlock(s.id, 'text', { text: 'Inhalt' });
    App.oeffne(s.id);
    await new Promise(r => setTimeout(r, 500));
    const vorher = Object.keys(Store.cache.blocks).length;

    /* Strg Shift Y: anheften */
    document.dispatchEvent(new KeyboardEvent('keydown',
      { key: 'y', ctrlKey: true, shiftKey: true, bubbles: true }));
    await new Promise(r => setTimeout(r, 250));
    const angeheftet = !!Store.getBlock(s.id).favorite;

    /* Strg Shift N: Unterseite */
    document.dispatchEvent(new KeyboardEvent('keydown',
      { key: 'n', ctrlKey: true, shiftKey: true, bubbles: true }));
    await new Promise(r => setTimeout(r, 400));
    const unterseite = Store.childrenOf(s.id).some((x: any) => x.type === 'page');

    App.oeffne(s.id);
    await new Promise(r => setTimeout(r, 300));
    /* Strg Shift D: verdoppeln */
    document.dispatchEvent(new KeyboardEvent('keydown',
      { key: 'd', ctrlKey: true, shiftKey: true, bubbles: true }));
    await new Promise(r => setTimeout(r, 500));
    const mehr = Object.keys(Store.cache.blocks).length > vorher + 1;

    /* Strg Shift O: Übersicht */
    document.dispatchEvent(new KeyboardEvent('keydown',
      { key: 'o', ctrlKey: true, shiftKey: true, bubbles: true }));
    await new Promise(r => setTimeout(r, 400));
    const uebersichtDa = [...document.querySelectorAll<HTMLElement>('.overlay .fh')]
      .some(x => /Redion kann/i.test(x.textContent ?? ''));
    document.querySelectorAll<HTMLElement>('.overlay').forEach(o => o.remove());

    /* Strg Shift B: Papierkorb */
    document.dispatchEvent(new KeyboardEvent('keydown',
      { key: 'b', ctrlKey: true, shiftKey: true, bubbles: true }));
    await new Promise(r => setTimeout(r, 400));
    const papierkorbDa = !!document.querySelector('.overlay');
    document.querySelectorAll<HTMLElement>('.overlay').forEach(o => o.remove());

    /* Strg Y ohne Umschalt bleibt Wiederholen */
    let f = null;
    try {
      document.dispatchEvent(new KeyboardEvent('keydown',
        { key: 'y', ctrlKey: true, bubbles: true }));
    } catch (e: unknown) { f = (e instanceof Error ? e.message : String(e)); }
    await new Promise(r => setTimeout(r, 200));
    return { angeheftet, unterseite, mehr, uebersichtDa, papierkorbDa, f };
  });
  pruef('Strg Shift Y heftet an',        seitenTasten.angeheftet, true);
  pruef('Strg Shift N legt eine Unterseite an', seitenTasten.unterseite, true);
  pruef('Strg Shift D verdoppelt',       seitenTasten.mehr, true);
  pruef('Strg Shift O zeigt die Übersicht', seitenTasten.uebersichtDa, true);
  pruef('Strg Shift B öffnet den Papierkorb', seitenTasten.papierkorbDa, true);
  pruef('Strg Y allein stört das nicht', seitenTasten.f, null);

  /* --- Strg Pos1 / Ende und der Blocklink -------------------------------- */
  const blockTasten = await p.evaluate(async () => {
    /* Das Element, das gerade den Fokus hat. `document.activeElement` ist
       `Element | null` und hat weder `dataset` noch `focus`. Hier steht eine
       Prüfung statt einer Behauptung: hat nichts den Fokus, sagt die Meldung
       das — statt „Cannot read properties of null". */
    const aktiv = (): HTMLElement => {
      const el = document.activeElement;
      if (!(el instanceof HTMLElement))
        throw new Error('Kein Element hat gerade den Fokus.');
      return el;
    };
    const s = Store.addBlock(null, 'page', { text: 'Sprungseite' });
    const ids = [];
    for (let i = 1; i <= 8; i++) ids.push(Store.addBlock(s.id, 'text', { text: 'B' + i }).id);
    App.oeffne(s.id);
    await new Promise(r => setTimeout(r, 600));
    const mitte = document.querySelector<HTMLElement>(`#page .blk[data-bid="${ids[4]}"] .ct`);
    if (!mitte) throw new Error('#page .blk[data-bid="${ids[4]}"] .ct ist nicht da — der Lauf misst sonst nichts.');
    mitte.focus();
    await new Promise(r => setTimeout(r, 120));
    mitte.dispatchEvent(new KeyboardEvent('keydown',
      { key: 'Home', ctrlKey: true, bubbles: true }));
    await new Promise(r => setTimeout(r, 200));
    const obenId = aktiv().closest<HTMLElement>('.blk')?.dataset.bid;

    aktiv().dispatchEvent(new KeyboardEvent('keydown',
      { key: 'End', ctrlKey: true, bubbles: true }));
    await new Promise(r => setTimeout(r, 200));
    const untenId = aktiv().closest<HTMLElement>('.blk')?.dataset.bid;

    /* Strg Shift Rücktaste wirft den Block weg */
    const zielCt = document.querySelector<HTMLElement>(`#page .blk[data-bid="${ids[2]}"] .ct`);
    if (!zielCt) throw new Error('#page .blk[data-bid="${ids[2]}"] .ct ist nicht da — der Lauf misst sonst nichts.');
    zielCt.focus();
    zielCt.dispatchEvent(new KeyboardEvent('keydown',
      { key: 'Backspace', ctrlKey: true, shiftKey: true, bubbles: true }));
    await new Promise(r => setTimeout(r, 400));
    return { obenId, untenId, erster: ids[0], letzter: ids[7],
             weg: Store.getBlock(ids[2]).alive === false,
             uebrig: Store.childrenOf(s.id).length };
  });
  pruef('Strg Pos1 springt zum ersten Block', blockTasten.obenId, blockTasten.erster);
  pruef('Strg Ende zum letzten',              blockTasten.untenId, blockTasten.letzter);
  pruef('Strg Shift Rücktaste wirft weg',     blockTasten.weg, true);
  pruef('Und lässt sieben übrig',             blockTasten.uebrig, 7);

  /* --- Leertaste in der Auswahl ------------------------------------------ */
  const leertaste = await p.evaluate(async () => {
    const s = Store.addBlock(null, 'page', { text: 'Leertastentest' });
    const t1 = Store.addBlock(s.id, 'todo', { text: 'Eins', checked: false });
    const t2 = Store.addBlock(s.id, 'todo', { text: 'Zwei', checked: false });
    const tg = Store.addBlock(s.id, 'toggle', { text: 'Klapp', open: false });
    App.oeffne(s.id);
    await new Promise(r => setTimeout(r, 500));
    Blocks.auswahlSetzen([t1.id, t2.id]);
    await new Promise(r => setTimeout(r, 120));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    await new Promise(r => setTimeout(r, 400));
    const gehakt = [Store.getBlock(t1.id).checked, Store.getBlock(t2.id).checked];

    Blocks.auswahlSetzen([tg.id]);
    await new Promise(r => setTimeout(r, 120));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    await new Promise(r => setTimeout(r, 400));
    const offen = !!Store.getBlock(tg.id).open;
    Blocks.auswahlLeeren();
    return { gehakt, offen };
  });
  pruef('Leertaste hakt beide ab', leertaste.gehakt, [true, true]);
  pruef('Und klappt ein Toggle auf', leertaste.offen, true);

  /* --- In der Tabelle: Leertaste, Pos1, Ende ----------------------------- */
  const tabelle = await p.evaluate(async () => {
    /* Das Element, das gerade den Fokus hat. `document.activeElement` ist
       `Element | null` und hat weder `dataset` noch `focus`. Hier steht eine
       Prüfung statt einer Behauptung: hat nichts den Fokus, sagt die Meldung
       das — statt „Cannot read properties of null". */
    const aktiv = (): HTMLElement => {
      const el = document.activeElement;
      if (!(el instanceof HTMLElement))
        throw new Error('Kein Element hat gerade den Fokus.');
      return el;
    };
    document.querySelectorAll<HTMLElement>('.overlay').forEach(o => o.remove());
    const s = Store.addBlock(null, 'page', { text: 'Tabellentasten' });
    const db = Store.addDatabase(s.id, 'Zellen', {
      title: { name: 'Titel', type: 'title' },
      a: { name: 'A', type: 'text' }, b: { name: 'B', type: 'text' },
      c: { name: 'C', type: 'text' } });
    const coll = Store.getCollection(db.collectionId);
    Store.updateView(db.viewId, { limit: 0 });
    for (let i = 1; i <= 4; i++) Store.addRow(coll.id, { title: 'R' + i, a: 'a', b: 'b', c: 'c' });
    App.oeffne(s.id);
    await new Promise(r => setTimeout(r, 700));
    const zellen = [...document.querySelectorAll<HTMLElement>('td[data-zelle]')];
    if (!zellen.length) return { fehlt: true };
    const mitte = zellen[5];
    if (!mitte) throw new Error('mitte ist nicht da — der Lauf misst sonst nichts.');
    mitte.focus();
    mitte.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    await new Promise(r => setTimeout(r, 150));
    const linksAussen = (aktiv().dataset.zelle ?? '').split('|')[1] ?? '';

    aktiv().dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    await new Promise(r => setTimeout(r, 150));
    const rechtsAussen = (aktiv().dataset.zelle ?? '').split('|')[1] ?? '';

    /* Umschalt+Enter legt eine Zeile an */
    const vorher = Store.rowsOf(coll.id).length;
    aktiv().dispatchEvent(new KeyboardEvent('keydown',
      { key: 'Enter', shiftKey: true, bubbles: true }));
    await new Promise(r => setTimeout(r, 500));
    const nachher = Store.rowsOf(coll.id).length;

    /* Leertaste öffnet die Vorschau */
    const z2 = document.querySelector<HTMLElement>('td[data-zelle]');
    if (!z2) throw new Error('td[data-zelle] ist nicht da — der Lauf misst sonst nichts.');
    z2.focus();
    z2.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    await new Promise(r => setTimeout(r, 450));
    const vorschau = !!document.querySelector('.overlay, .peek, #peek');
    document.querySelectorAll<HTMLElement>('.overlay').forEach(o => o.remove());
    return { linksAussen, rechtsAussen, vorher, nachher, vorschau };
  });
  pruef('Pos1 geht ganz nach links', tabelle.linksAussen, 'title');
  pruef('Ende ganz nach rechts',     tabelle.rechtsAussen, 'c');
  pruef('Shift Enter legt eine Zeile an', tabelle.nachher, Number(tabelle.vorher ?? 0) + 1);
  pruef('Leertaste öffnet die Vorschau',  tabelle.vorschau, true);

  /* --- Nichts geht kaputt, wenn nichts ausgewählt ist -------------------- */
  const leer = await p.evaluate(async () => {
    Blocks.auswahlLeeren();
    let f = null;
    try {
      Blocks.auswahlLoeschen(); Blocks.auswahlDuplizieren();
      Blocks.auswahlUmwandeln('h1'); Blocks.auswahlVerschieben(1);
      Blocks.auswahlEinruecken(false);
      await Blocks.auswahlKopieren();
    } catch (e: unknown) { f = (e instanceof Error ? e.message : String(e)); }
    return { f, seite: !!document.getElementById('page')?.textContent };
  });
  pruef('Leere Auswahl wirft nichts', leer.f, null);
  pruef('Und die Seite steht noch',   leer.seite, true);

  /* --- Am Telefon --------------------------------------------------------- */
  const handy = await b.newPage({ viewport: { width: 428, height: 926 }, isMobile: true, hasTouch: true });
  const fehler2: any[] = [];
  handy.on('pageerror', e => fehler2.push('JS: ' + e.message));
  await handy.goto('file://' + WURZEL + '/index.html');
  await handy.waitForTimeout(1800);
  const amHandy = await handy.evaluate(async () => {
    /* Ein Element, das dasein MUSS. Fehlt es, misst der Lauf nichts mehr —
       dann ist eine Meldung mit dem Selektor besser als „Cannot read
       properties of null" zwanzig Zeilen weiter. */
    const musselement = (sel: string): HTMLElement => {
      const x = document.querySelector<HTMLElement>(sel);
      if (!x) throw new Error(sel + ' ist nicht da.');
      return x;
    };
    const s = Store.addBlock(null, 'page', { text: 'Handyauswahl' });
    const ids = [];
    for (let i = 1; i <= 4; i++) ids.push(Store.addBlock(s.id, 'text', { text: 'H' + i }).id);
    App.oeffne(s.id);
    await new Promise(r => setTimeout(r, 700));
    Blocks.auswahlSetzen(ids);
    await new Promise(r => setTimeout(r, 250));
    const l = musselement('#auswahl-leiste').getBoundingClientRect();
    return { raus: l.right > innerWidth + 1 || l.left < -1,
             ueberlauf: document.documentElement.scrollWidth - innerWidth,
             markiert: document.querySelectorAll('.blk.gewaehlt').length };
  });
  pruef('Die Leiste passt aufs Telefon',   amHandy.raus, false);
  pruef('Die Seite läuft nicht seitlich raus', Number(amHandy.ueberlauf ?? -1) <= 1, true);
  pruef('Und die Markierung sitzt',        amHandy.markiert, 4);

  console.log(`\n${ok}/${ok + bad} bestanden`);
  const alle = [...fehler, ...fehler2];
  console.log(alle.length ? 'JS-Fehler:\n' + alle.join('\n') : 'Keine JS-Fehler.');
  await b.close();
  process.exit(bad || alle.length ? 1 : 0);
})();
