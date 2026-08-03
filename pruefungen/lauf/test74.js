/* Die Einzeldatei muss allein laufen — ohne js-Ordner, ohne app.css */
const WURZEL = require('path').resolve(__dirname, '../..');
const { chromium } = require('playwright');
const fs = require('fs');
const os = require('os');
const pfad = require('path');

/* Der Ordner lag fest auf /tmp/allein/ und musste von Hand befüllt werden —
   auf jedem anderen Rechner lief der Lauf damit gegen eine Datei, die es
   nicht gab, oder schlimmer: gegen eine alte. Jetzt legt er sich seinen
   Ordner selbst an, kopiert NUR die Einzeldatei hinein und prüft damit
   wirklich das, was er verspricht: dass sie allein läuft, ohne quell/,
   ohne oeffentlich/, ohne irgendetwas daneben. */
const ALLEIN = fs.mkdtempSync(pfad.join(os.tmpdir(), 'redion-allein-'));
fs.copyFileSync(pfad.join(WURZEL, 'redion-einzeldatei.html'),
                pfad.join(ALLEIN, 'redion-einzeldatei.html'));
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
  const t0 = Date.now();
  await p.goto('file://' + pfad.join(ALLEIN, 'redion-einzeldatei.html'));
  await p.waitForTimeout(2500);
  const ms = Date.now() - t0;

  const stand = await p.evaluate(() => ({
    module: ['App','Store','Datenbank','Blocks','KI','UI','Werkzeuge','Ansichten',
             'Formula','Status','Wissen','Pflege','Schema','Krypto','KiBau','Fenster',
             'Aussehen','Vergleich','Austausch','Tempo','Plan','Erweiterung','Eingang',
             'Rundgang','NotionFormat','Api','Transaktion','Protokoll','Dateien']
            /* Die aelteren Module stehen als const im Skriptbereich, nicht an
               window — beides ist ein gueltiger globaler Name. Deshalb wird
               der Name selbst nachgeschlagen, nicht window[name]. */
            .filter(n => { try { return new Function('return typeof ' + n)() === 'undefined'; }
                           catch { return true; } }),
    seite: !!document.getElementById('page'),
    leiste: !!document.getElementById('sidebar'),
    stil: getComputedStyle(document.body).backgroundColor,
    bloecke: Object.keys(Store.cache.blocks).length
  }));
  pruef('Kein Modul fehlt',       stand.module, []);
  pruef('Die Seite ist da',       stand.seite, true);
  pruef('Die Seitenleiste auch',  stand.leiste, true);
  pruef('Der Stil ist eingebettet', stand.stil !== 'rgba(0, 0, 0, 0)', true);
  pruef('Es gibt Startinhalte',   stand.bloecke > 3, true);
  pruef('In unter 10 Sekunden geladen', ms < 10000, true);
  console.log('   Ladezeit: ' + ms + ' ms');

  /* Ein paar echte Handgriffe */
  const arbeit = await p.evaluate(async () => {
    const s = Store.addBlock(null, 'page', { text: 'Allein' });
    const db = Store.addDatabase(s.id, 'Test', {
      title: { name: 'T', type: 'title' }, n: { name: 'N', type: 'number' },
      f: { name: 'F', type: 'formula', formula: 'prop("N") * 3' } });
    const c = Store.getCollection(db.collectionId);
    const z = Store.addRow(c.id, { title: 'Eins', n: 7 });
    App.oeffne(s.id);
    await new Promise(r => setTimeout(r, 600));
    const token = Api.tokenNeu();
    const api = Api.anfrage('GET', '/v1/pages/' + z.id, {},
      { 'notion-version': '2022-06-28', authorization: 'Bearer ' + token });
    const tx = Transaktion.ausfuehren([
      { id: s.id, table: 'block', path: ['text'], command: 'set', args: 'Umbenannt' }]);
    const datei = await Dateien.ablegen(new File([new Uint8Array(400000)], 'a.bin'));
    return { formel: Datenbank.wert(Store.getBlock(z.id), 'f', c),
             apiStatus: api.status, txOk: tx.ok, dateiTeile: datei.teile,
             protokoll: Protokoll.alle().length > 0,
             gezeichnet: document.getElementById('page').textContent.length > 10 };
  });
  pruef('Formeln rechnen',        arbeit.formel, 21);
  pruef('Die Schnittstelle antwortet', arbeit.apiStatus, 200);
  pruef('Transaktionen laufen',   arbeit.txOk, true);
  pruef('Dateien lassen sich ablegen', arbeit.dateiTeile, 1);
  pruef('Das Protokoll schreibt mit', arbeit.protokoll, true);
  pruef('Die Seite ist gezeichnet', arbeit.gezeichnet, true);

  console.log(`\n${ok}/${ok + bad} bestanden`);
  console.log(fehler.length ? 'JS-Fehler:\n' + fehler.join('\n') : 'Keine JS-Fehler.');
  await b.close();
  process.exit(bad || fehler.length ? 1 : 0);
})();
