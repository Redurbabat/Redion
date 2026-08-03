const WURZEL = require('path').resolve(__dirname, '../..');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1500, height: 950 } });
  const f=[]; p.on('pageerror',e=>f.push('PAGEERROR: '+e.message));
  p.on('console',m=>{if(m.type()==='error'&&!/11434|CONNECTION_REFUSED|tile.openstreetmap|ERR_/.test(m.text()))f.push('CONSOLE: '+m.text());});
  const pruef=[]; const ok=(n,x)=>pruef.push([n,!!x]);
  const esc=async()=>{await p.keyboard.press('Escape');await p.waitForTimeout(250);};

  await p.goto('file://' + WURZEL + '/index.html');
  await p.waitForTimeout(1500);

  // Tastatur in der Datenbank-Tabelle
  await p.locator('table.grid td[data-zelle]').first().click();
  await p.waitForTimeout(300);
  await p.keyboard.press('Escape');
  await p.locator('table.grid td[data-zelle]').first().focus();
  await p.keyboard.press('ArrowRight');
  await p.waitForTimeout(200);
  const zelle1 = await p.evaluate(() => document.activeElement?.dataset?.zelle || '');
  await p.keyboard.press('ArrowDown');
  await p.waitForTimeout(200);
  const zelle2 = await p.evaluate(() => document.activeElement?.dataset?.zelle || '');
  ok('Pfeiltasten wandern durch die Tabelle', zelle1 && zelle2 && zelle1 !== zelle2);
  await p.keyboard.press('Tab');
  await p.waitForTimeout(200);
  ok('Tab springt weiter', await p.evaluate(() => document.activeElement?.dataset?.zelle) !== zelle2);

  // Diagramm: Zeitstufen und Aggregationen
  await p.locator('.db-tab', { hasText: '+' }).first().click();
  await p.waitForTimeout(350);
  await p.click('.menu button[data-l="chart"]');
  await p.waitForTimeout(700);
  await p.click('.db-chart [data-a="achsen"]');
  await p.waitForTimeout(400);
  const stufen = await p.locator('.menu button[data-s]').count();
  const arten = await p.locator('.menu button[data-art]').count();
  ok('Fünf Zeitstufen (' + stufen + ')', stufen === 5);
  ok('Elf Zusammenfassungen (' + arten + ')', arten === 11);
  await p.click('.menu button[data-art="Durchschnitt"]');
  await p.waitForTimeout(700);
  ok('Zusammenfassung wirkt', (await p.locator('.db-chart .chart-titel').textContent()).includes('Durchschnitt'));

  // Mehrtägige Kalendereinträge
  await p.locator('.db-tab', { hasText: '+' }).first().click();
  await p.waitForTimeout(350);
  await p.click('.menu button[data-l="calendar"]');
  await p.waitForTimeout(700);
  ok('Kalender mit Zeitraum-Umschalter', await p.locator('.cal-fuss [data-a="ende"]').count() === 1);
  const mehrtaegig = await p.evaluate(() => {
    const c = Object.values(Store.cache.collections)[0];
    const v = Object.values(Store.cache.views).find(x => x.layout === 'calendar');
    c.schema.bis = { name: 'Bis', type: 'date' };
    Store.updateCollection(c.id, { schema: c.schema });
    const dk = Object.keys(c.schema).find(k => c.schema[k].type === 'date');
    const r = Store.rowsOf(c.id)[0];
    const heute = new Date();
    const in3 = new Date(); in3.setDate(in3.getDate() + 3);
    Store.setProp(r.id, dk, heute.toISOString().slice(0,10));
    Store.setProp(r.id, 'bis', in3.toISOString().slice(0,10));
    Store.updateView(v.id, { datumKey: dk, endeKey: 'bis' });
    App.zeichneSeite();
    return true;
  });
  await p.waitForTimeout(800);
  ok('Mehrtägiger Eintrag über 4 Tage', await p.locator('.cal .ev.lang').count() >= 3);

  // Dateien ablegen
  const abgelegt = await p.evaluate(async () => {
    const dt = new DataTransfer();
    const datei = new File(['Aufgabe,Notiz\nEins,alpha\nZwei,beta\n'], 'daten.csv', { type: 'text/csv' });
    dt.items.add(datei);
    const ev = new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true });
    document.getElementById('scroll').dispatchEvent(ev);
    await new Promise(r => setTimeout(r, 800));
    return Object.values(Store.cache.collections).some(c => c.name === 'daten');
  });
  ok('CSV per Ziehen wird zur Datenbank', abgelegt);

  // KI baut eine Datenbank (Modell wird vorgetäuscht)
  const gebaut = await p.evaluate(async () => {
    Store.setMeta('api:groq', 'test-key');
    KI.zustand.quelle = 'wolke'; KI.zustand.anbieter = 'groq';
    KI.zustand.bereit = true; KI.zustand.modell = 'test';
    const alt = KI.wolkeFragen;
    // frage() geht über wolkeFragen — hier ersetzen wir fetch
    window.fetch = async () => ({
      ok: true,
      body: { getReader: () => {
        const antwort = JSON.stringify({
          name: 'Bücher', icon: '📚',
          spalten: [{ name:'Titel', typ:'titel' }, { name:'Autor', typ:'text' },
                    { name:'Status', typ:'auswahl', optionen:['Wunsch','Lese','Fertig'] },
                    { name:'Seiten', typ:'zahl' }],
          zeilen: [{ Titel:'Der Report', Autor:'Nora', Status:'Lese', Seiten:320 },
                   { Titel:'Tiefe Arbeit', Autor:'Cal', Status:'Fertig', Seiten:300 }]
        });
        const stueck = 'data: ' + JSON.stringify({ choices:[{ delta:{ content: antwort } }] }) + '\n\ndata: [DONE]\n\n';
        let fertig = false;
        return { read: async () => fertig ? { done: true }
                 : (fertig = true, { done: false, value: new TextEncoder().encode(stueck) }) };
      }}
    });
    await KI.datenbankBauen('Bücherliste');
    await new Promise(r => setTimeout(r, 600));
    const c = Object.values(Store.cache.collections).find(x => x.name === 'Bücher');
    return c ? { spalten: Object.keys(c.schema).length, zeilen: Store.rowsOf(c.id).length,
                 optionen: (Object.values(c.schema).find(d => d.type === 'select')?.options || []).length } : null;
  });
  ok('KI baut Datenbank (' + JSON.stringify(gebaut) + ')',
     gebaut && gebaut.spalten === 4 && gebaut.zeilen === 2 && gebaut.optionen === 3);
  ok('Protokoll hält den Schritt fest', await p.evaluate(() => KI.protokoll.length >= 1));

  await b.close();
  console.log('\n=== ERGEBNIS ===');
  let gut=0; pruef.forEach(([n,x])=>{console.log((x?'✅':'❌')+' '+n); if(x)gut++;});
  console.log(`\n${gut}/${pruef.length} bestanden`);
  console.log(f.length ? 'FEHLER:\n'+[...new Set(f)].slice(0,6).join('\n') : 'Keine JS-Fehler.');
})();
