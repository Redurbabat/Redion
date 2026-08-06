/* Word- und Excel-Ausgabe, Trello, Evernote, Obsidian, Notion-ZIP einlesen */
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

  /* --- ZIP-Packer ------------------------------------------------------ */
  const zip = await p.evaluate(async () => {
    const blob = await Austausch.zipSchreiben([
      { name: 'a.txt', inhalt: 'Hallo Welt' },
      { name: 'ordner/b.txt', inhalt: 'Zweite Datei' }
    ]);
    const puffer = await blob.arrayBuffer();
    const gelesen = await Einlesen.zipLesen(puffer);
    return { groesse: blob.size, namen: gelesen.namen,
             a: await gelesen.text('a.txt'), b: await gelesen.text('ordner/b.txt') };
  });
  pruef('ZIP enthält beide Dateien', zip.namen.sort(), ['a.txt', 'ordner/b.txt']);
  pruef('Erste Datei lesbar',        zip.a, 'Hallo Welt');
  pruef('Zweite Datei lesbar',       zip.b, 'Zweite Datei');

  /* CRC muss stimmen — sonst weigert sich Word */
  const crc = await p.evaluate(() =>
    Austausch.crc32(new TextEncoder().encode('123456789')));
  pruef('CRC32 von 123456789 ist der bekannte Wert', crc, 0xCBF43926);

  /* --- Word ------------------------------------------------------------ */
  const word = await p.evaluate(async () => {
    const s = Store.addBlock(null, 'page', { text: 'Quartalsbericht' });
    Store.addBlock(s.id, 'h1', { text: 'Zusammenfassung' });
    Store.addBlock(s.id, 'text', { text: 'Der Umsatz ist gestiegen.' });
    Store.addBlock(s.id, 'bullet', { text: 'Erster Punkt' });
    Store.addBlock(s.id, 'todo', { text: 'Noch offen', checked: false });
    const db = Store.addDatabase(s.id, 'Zahlen', {
      title: { name: 'Monat', type: 'title' },
      wert:  { name: 'Umsatz', type: 'number' }
    });
    const c = Store.getCollection(db.collectionId);
    Store.addRow(c.id, { title: 'Januar', wert: 1000 });
    Store.addRow(c.id, { title: 'Februar', wert: 1500 });

    const blob = await Austausch.alsWord(Store.getBlock(s.id));
    const gelesen = await Einlesen.zipLesen(await blob.arrayBuffer());
    const doc = await gelesen.text('word/document.xml');
    return { seite: s.id, coll: c.id,
             namen: gelesen.namen.sort(), groesse: blob.size,
             titel: (doc ?? '').includes('Quartalsbericht'),
             ueberschrift: (doc ?? '').includes('Heading1'),
             text: (doc ?? '').includes('Der Umsatz ist gestiegen.'),
             aufzaehlung: (doc ?? '').includes('<w:numPr>'),
             tabelle: (doc ?? '').includes('<w:tbl>'),
             zelle: (doc ?? '').includes('Februar'),
             gueltig: doc.startsWith('<?xml') };
  });
  pruef('Word-Datei hat alle Teile', word.namen,
        ['[Content_Types].xml', '_rels/.rels', 'word/_rels/document.xml.rels',
         'word/document.xml', 'word/numbering.xml', 'word/styles.xml']);
  pruef('Titel steht drin',          word.titel, true);
  pruef('Überschrift als Stil',      word.ueberschrift, true);
  pruef('Absatztext steht drin',     word.text, true);
  pruef('Aufzählung als Nummerierung', word.aufzaehlung, true);
  pruef('Datenbank wurde Tabelle',   word.tabelle, true);
  pruef('Tabellenzelle vorhanden',   word.zelle, true);
  pruef('Gültiger XML-Anfang',       word.gueltig, true);

  /* --- Excel ----------------------------------------------------------- */
  const excel = await p.evaluate(async () => {
    const c = Store.getCollection(Object.keys(Store.cache.collections)
      .find(id => Store.cache.collections[id].name === 'Zahlen'));
    const blob = await Austausch.datenbankAlsExcel(c);
    const gelesen = await Einlesen.zipLesen(await blob.arrayBuffer());
    const blatt = await gelesen.text('xl/worksheets/sheet1.xml');
    const mappe = await gelesen.text('xl/workbook.xml');
    /* Und wieder einlesen — der beste Beweis, dass es echt ist */
    const zurueck = await Einlesen.xlsxLesen(await blob.arrayBuffer());
    return { namen: gelesen.namen.length,
             kopf: (blatt ?? '').includes('Umsatz'),
             zahl: (blatt ?? '').includes('<v>1500</v>'),
             textZelle: (blatt ?? '').includes('inlineStr'),
             blattname: (mappe ?? '').includes('name='),
             zurueckBlaetter: zurueck.length,
             zurueckZeilen: zurueck[0] ? zurueck[0].zeilen.length : 0,
             ersteZeile: zurueck[0] ? zurueck[0].zeilen[0] : null };
  });
  pruef('Excel-Mappe hat mehrere Teile', Number(excel.namen ?? -1) >= 6, true);
  pruef('Kopfzeile im Blatt',            excel.kopf, true);
  pruef('Zahl bleibt Zahl',              excel.zahl, true);
  pruef('Text als inlineStr',            excel.textZelle, true);
  pruef('Wieder einlesbar',              Number(excel.zurueckBlaetter ?? -1) >= 1, true);
  pruef('Drei Zeilen zurückgelesen',     excel.zurueckZeilen, 3);
  pruef('Kopfzeile stimmt',              excel.ersteZeile, ['Monat', 'Umsatz']);

  /* Alle Datenbanken auf einmal */
  const alles = await p.evaluate(async () => {
    const blob = await Austausch.allesAlsExcel();
    if (!blob) throw new Error('blob ist nicht da — der Lauf misst sonst nichts.');
    const zurueck = await Einlesen.xlsxLesen(await blob.arrayBuffer());
    return zurueck.length;
  });
  pruef('Alle Datenbanken als Blätter', alles >= 1, true);

  /* --- Trello ---------------------------------------------------------- */
  const trello = await p.evaluate(() => {
    const json = JSON.stringify({
      name: 'Projekt X',
      lists: [{ id: 'l1', name: 'Offen' }, { id: 'l2', name: 'Fertig' }],
      labels: [{ id: 'e1', name: 'Dringend', color: 'red' },
               { id: 'e2', name: 'Später', color: 'blue' }],
      cards: [
        { id: 'c1', name: 'Erste Karte', idList: 'l1', closed: false,
          desc: '# Beschreibung\n\nEin Absatz.', due: '2026-09-01T10:00:00.000Z',
          dueComplete: false, labels: [{ name: 'Dringend', color: 'red' }],
          shortUrl: 'https://trello.com/c/abc' },
        { id: 'c2', name: 'Zweite Karte', idList: 'l2', closed: false,
          desc: '', dueComplete: true, labels: [] },
        { id: 'c3', name: 'Archiviert', idList: 'l1', closed: true, labels: [] }
      ],
      checklists: [{ id: 'k1', idCard: 'c1', name: 'Schritte',
                     checkItems: [{ name: 'Schritt eins', state: 'complete', pos: 1 },
                                  { name: 'Schritt zwei', state: 'incomplete', pos: 2 }] }]
    });
    const erg = Austausch.ausTrello(json, null);
    const coll = Object.values(Store.cache.collections).find(c => c.name === 'Projekt X');
    const zeilen = Store.rowsOf(coll.id);
    const erste = zeilen.find(z => z.text === 'Erste Karte');
    return {
      hinweis: erg.hinweis,
      zeilen: zeilen.length,
      listen: (coll.schema.liste.options || []).map((o: any) => o.name),
      etiketten: (coll.schema.labels.options || []).map((o: any) => o.name),
      ersteListe: erste.props.liste,
      ersteEtikett: erste.props.labels,
      faellig: erste.props.faellig,
      unterbloecke: Store.childrenOf(erste.id).map((b: any) => b.text),
      aufgaben: Store.childrenOf(erste.id).filter((b: any) => b.type === 'todo').map((b: any) => b.text),
      erledigt: Store.childrenOf(erste.id).filter((b: any) => b.type === 'todo' && b.checked).length,
      layout: Store.getView(Object.values(Store.cache.views)
        .find(v => v.collectionId === coll.id)?.id).layout
    };
  });
  pruef('Archivierte Karte übersprungen', trello.zeilen, 2);
  pruef('Listen wurden Status',   trello.listen, ['Offen', 'Fertig']);
  pruef('Etiketten übernommen',   trello.etiketten, ['Dringend', 'Später']);
  pruef('Karte in der richtigen Liste', trello.ersteListe, 'Offen');
  pruef('Etikett an der Karte',   trello.ersteEtikett, ['Dringend']);
  pruef('Fälligkeitsdatum',       trello.faellig, '2026-09-01');
  pruef('Board-Ansicht angelegt', trello.layout, 'board');
  pruef('Checkliste als Aufgaben', trello.aufgaben, ['Schritt eins', 'Schritt zwei']);
  pruef('Erledigter Punkt ist abgehakt', trello.erledigt, 1);
  pruef('Beschreibung übernommen',
        trello.unterbloecke.some((t: any) => t === 'Ein Absatz.'), true);

  /* --- Evernote -------------------------------------------------------- */
  const enex = await p.evaluate(() => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<en-export>
  <note><title>Einkaufsliste</title>
    <content><![CDATA[<en-note><div>Milch</div><div>Brot</div></en-note>]]></content>
    <tag>haushalt</tag></note>
  <note><title>Ideen</title>
    <content><![CDATA[<en-note><h1>Grosse Idee</h1><div>Dazu ein Satz.</div></en-note>]]></content>
  </note>
</en-export>`;
    const erg = Austausch.ausEvernote(xml, null);
    const seiten = Store.childrenOf(erg.seite.id);
    return { hinweis: erg.hinweis, titel: seiten.map((s: any) => s.text),
             inhalt: Store.childrenOf(seiten[0].id).map((b: any) => b.text),
             tags: seiten[0].tags,
             ueberschrift: Store.childrenOf(seiten[1].id)[0] };
  });
  pruef('Zwei Notizen übernommen', enex.titel, ['Einkaufsliste', 'Ideen']);
  pruef('Inhalt der ersten Notiz', enex.inhalt, ['Milch', 'Brot']);
  pruef('Schlagwort übernommen',   enex.tags, ['haushalt']);
  pruef('Überschrift erkannt',     enex.ueberschrift.type, 'h1');

  /* --- Obsidian-Ordner ------------------------------------------------- */
  const obsidian = await p.evaluate(async () => {
    const mach = (pfad: any, text: string) => {
      const f = new File([text], pfad.split('/').pop(), { type: 'text/markdown' });
      Object.defineProperty(f, 'webkitRelativePath', { value: 'Tresor/' + pfad });
      return f;
    };
    const erg = await Austausch.ausMarkdownOrdner([
      mach('Start.md', '# Start\n\nSiehe [[Zweite Notiz]] und [[Fehlt]].'),
      mach('Unterordner/Zweite Notiz.md', 'Hier ist die zweite.'),
      mach('bild.png', 'egal')
    ], null);
    const kinder = Store.childrenOf(erg.seite.id);
    const start = kinder.find((k: any) => k.text === 'Start');
    const ordner = kinder.find((k: any) => k.text === 'Unterordner');
    return { hinweis: erg.hinweis,
             oben: kinder.map((k: any) => k.text).sort(),
             imOrdner: ordner ? Store.childrenOf(ordner.id).map((k: any) => k.text) : [],
             linkText: Store.childrenOf(start.id).map((b: any) => b.text).join(' ') };
  });
  pruef('Ordner wurde Unterseite', obsidian.oben, ['Start', 'Unterordner']);
  pruef('Notiz im Ordner',         obsidian.imOrdner, ['Zweite Notiz']);
  pruef('Wikilink aufgelöst',      /\]\(#[0-9a-f-]{8}/.test(obsidian.linkText ?? ''), true);
  pruef('Unbekannter Wikilink bleibt stehen', (obsidian.linkText ?? '').includes('[[Fehlt]]'), true);
  pruef('Nur Markdown gezählt',    (obsidian.hinweis ?? '').includes('2 Notizen'), true);

  /* --- Notion-Export-ZIP ----------------------------------------------- */
  const notionZip = await p.evaluate(async () => {
    const blob = await Austausch.zipSchreiben([
      { name: 'Export/Meine Seite 1234567890abcdef1234567890abcdef.md',
        inhalt: '# Meine Seite\n\nEin Absatz aus Notion.' },
      { name: 'Export/Unterbereich abcdef1234567890abcdef1234567890/Tabelle 0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f.csv',
        inhalt: 'Name,Zahl\nEins,1\nZwei,2' }
    ]);
    const erg = await Austausch.ausNotionZip(await blob.arrayBuffer(), null);
    const wurzel = Store.childrenOf(erg.seite.id);
    const exportOrdner = wurzel.find((x: any) => x.text === 'Export');
    const drin = exportOrdner ? Store.childrenOf(exportOrdner.id) : [];
    const seite = drin.find((x: any) => x.text === 'Meine Seite');
    return { hinweis: erg.hinweis,
             namen: drin.map((x: any) => x.text).sort(),
             absatz: seite ? Store.childrenOf(seite.id).map((b: any) => b.text) : [],
             dbs: Object.values(Store.cache.collections).filter(c => c.name === 'Tabelle').length };
  });
  pruef('Lange IDs aus den Namen entfernt', notionZip.namen, ['Meine Seite', 'Unterbereich']);
  pruef('Absatz übernommen', notionZip.absatz, ['Ein Absatz aus Notion.']);
  pruef('CSV wurde Datenbank', notionZip.dbs, 1);
  pruef('Hinweis nennt beides', notionZip.hinweis, '1 Seiten und 1 Tabellen übernommen');

  /* --- Dialog ---------------------------------------------------------- */
  await p.evaluate(() => Austausch.dialog());
  await p.waitForTimeout(300);
  const dialog = await p.evaluate(() => ({
    quellen: document.querySelectorAll('.ax-liste button').length,
    namen: [...document.querySelectorAll<HTMLElement>('.ax-text b')].map(x => x.textContent)
  }));
  pruef('Sechs Quellen zur Wahl', dialog.quellen, 6);
  pruef('Trello ist dabei',       (dialog.namen ?? '').includes('Trello'), true);
  pruef('Notion-Export ist dabei', (dialog.namen ?? '').includes('Notion-Export'), true);

  console.log(`\n${ok}/${ok + bad} bestanden`);
  console.log(fehler.length ? 'JS-Fehler:\n' + fehler.join('\n') : 'Keine JS-Fehler.');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
