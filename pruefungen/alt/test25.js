const WURZEL = require('path').resolve(__dirname, '../..');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1500, height: 950 } });
  const f=[]; p.on('pageerror',e=>f.push('PAGEERROR: '+e.message));
  p.on('console',m=>{if(m.type()==='error'&&!/11434|CONNECTION_REFUSED|ERR_/i.test(m.text()))f.push('CONSOLE: '+m.text());});
  const pruef=[]; const ok=(n,x)=>pruef.push([n,!!x]);

  await p.goto('file://' + WURZEL + '/index.html');
  await p.waitForTimeout(1500);

  const bau = await p.evaluate(() => {
    const s = Store.addPage(null, { text: 'Kalendertest' });

    const a = Store.addDatabase(s.id, 'Termine', {
      title: { name: 'Was', type: 'title' },
      d: { name: 'Wann', type: 'date' },
      e: { name: 'Bis',  type: 'date' }
    }, 'calendar');
    const ca = Store.getCollection(a.collectionId);

    const heute = new Date();
    const p2 = n => String(n).padStart(2, '0');
    const iso = (d, zeit) => d.getFullYear() + '-' + p2(d.getMonth()+1) + '-' + p2(d.getDate()) +
                             (zeit ? 'T' + zeit : '');
    const morgen = new Date(heute); morgen.setDate(heute.getDate() + 1);
    const in3    = new Date(heute); in3.setDate(heute.getDate() + 3);

    let r = Store.addRow(ca.id, { d: iso(heute, '09:30') });
    Store.updateBlock(r.id, { text: 'Zahnarzt' });
    r = Store.addRow(ca.id, { d: iso(heute, '14:00') });
    Store.updateBlock(r.id, { text: 'Team' });
    r = Store.addRow(ca.id, { d: iso(heute) });
    Store.updateBlock(r.id, { text: 'Ganztags' });
    r = Store.addRow(ca.id, { d: iso(morgen), e: iso(in3) });
    Store.updateBlock(r.id, { text: 'Reise' });

    /* zweiter Kalender */
    const c2 = Store.addDatabase(s.id, 'Geburtstage', {
      title: { name: 'Wer', type: 'title' },
      g: { name: 'Tag', type: 'date' }
    }, 'table');
    const cb = Store.getCollection(c2.collectionId);
    const gr = Store.addRow(cb.id, { g: iso(heute) });
    Store.updateBlock(gr.id, { text: 'Oma' });

    const v = Store.getView(ca.viewIds[0]);
    Store.updateView(v.id, { endeKey: 'e' });
    return { seite: s.id, viewId: v.id, collB: cb.id, heute: iso(heute) };
  });

  await p.evaluate(id => App.oeffne(id), bau.seite);
  await p.waitForTimeout(800);

  /* --- Monat (Standard) ------------------------------------------------ */
  const monat = await p.evaluate(() => ({
    gitter: !!document.querySelector('.cal'),
    zellen: document.querySelectorAll('.cal .day').length,
    stufe: document.querySelector('.kal-stufen button.on')?.textContent,
    lang: document.querySelectorAll('.cal .ev.lang').length,
    titel: document.querySelector('.kal-kopf b')?.textContent
  }));
  console.log('   Monat:', JSON.stringify(monat));
  ok('Monat ist die Standardstufe', monat.stufe === 'Monat');
  ok('Monat füllt ganze Wochen', monat.zellen % 7 === 0 && monat.zellen >= 28);
  ok('Mehrtägiger Eintrag über drei Tage', monat.lang === 3);

  /* --- Taste W --------------------------------------------------------- */
  await p.click('#page');
  await p.keyboard.press('w');
  await p.waitForTimeout(600);
  const woche = await p.evaluate(() => ({
    stufe: document.querySelector('.kal-stufen button.on')?.textContent,
    spalten: document.querySelectorAll('.cal.woche .day').length,
    kopfzeilen: document.querySelectorAll('.cal.woche .dow').length,
    titel: document.querySelector('.kal-kopf b')?.textContent
  }));
  console.log('   Woche:', JSON.stringify(woche));
  ok('Taste W schaltet auf Woche', woche.stufe === 'Woche');
  ok('Woche hat sieben Tage', woche.spalten === 7 && woche.kopfzeilen === 7);
  ok('Wochentitel nennt die KW', /^KW \d+ ·/.test(woche.titel || ''));

  /* --- Taste T --------------------------------------------------------- */
  await p.keyboard.press('t');
  await p.waitForTimeout(600);
  const tag = await p.evaluate(() => {
    const zeilen = [...document.querySelectorAll('.kt-zeile')].map(z => ({
      std: z.querySelector('.kt-std').textContent,
      ev: [...z.querySelectorAll('.ev')].map(e => e.textContent)
    })).filter(z => z.ev.length);
    return { stufe: document.querySelector('.kal-stufen button.on')?.textContent,
             zeilen, alleStunden: document.querySelectorAll('.kt-zeile').length };
  });
  console.log('   Tag:', JSON.stringify(tag));
  ok('Taste T schaltet auf Tag', tag.stufe === 'Tag');
  ok('Ganztägiges steht oben', tag.zeilen.some(z => z.std === 'ganztags' && z.ev.some(e => e.includes('Ganztags'))));
  ok('09:30 landet in der Neunuhr-Zeile', tag.zeilen.some(z => z.std === '09:00' && z.ev.some(e => e.includes('Zahnarzt'))));
  ok('14:00 landet in der Zweiuhr-Zeile', tag.zeilen.some(z => z.std === '14:00' && z.ev.some(e => e.includes('Team'))));

  /* --- Taste M zurück --------------------------------------------------- */
  await p.keyboard.press('m');
  await p.waitForTimeout(600);
  ok('Taste M schaltet zurück auf Monat',
     await p.evaluate(() => document.querySelector('.kal-stufen button.on')?.textContent === 'Monat'));

  /* --- Kürzel darf beim Tippen nicht stören ----------------------------- */
  const getippt = await p.evaluate(async () => {
    const s = Store.addPage(null, { text: 'Tipptest' });
    App.oeffne(s.id);
    await new Promise(r => setTimeout(r, 400));
    return true;
  });
  await p.waitForTimeout(400);
  await p.evaluate(id => App.oeffne(id), bau.seite);
  await p.waitForTimeout(600);

  /* --- Zweiter Kalender dazu -------------------------------------------- */
  await p.evaluate((d) => {
    const v = Store.getView(d.viewId);
    Store.updateView(v.id, { extraDbs: [{ collectionId: d.collB, an: true, farbe: 'green' }] });
    App.zeichneSeite();
  }, bau);
  await p.waitForTimeout(700);
  const zwei = await p.evaluate(() => {
    const heute = document.querySelector('.cal .day.today');
    return { texte: [...heute.querySelectorAll('.ev')].map(e => e.textContent),
             gruen: !!heute.querySelector('.ev.q-green'),
             knopf: document.querySelector('.cal-fuss [data-a="kalender"]')?.textContent };
  });
  console.log('   Zwei Kalender:', JSON.stringify(zwei));
  ok('Fremde Datenbank erscheint im Kalender', zwei.texte.some(t => t.includes('Oma')));
  ok('Eigene Einträge bleiben da', zwei.texte.some(t => t.includes('Zahnarzt')));
  ok('Zweiter Kalender hat eigene Farbe', zwei.gruen);
  ok('Fuss zählt zwei Kalender', (zwei.knopf || '').includes('2'));

  /* --- Ausschalten ------------------------------------------------------ */
  await p.evaluate((d) => {
    const v = Store.getView(d.viewId);
    Store.updateView(v.id, { extraDbs: [{ collectionId: d.collB, an: false, farbe: 'green' }] });
    App.zeichneSeite();
  }, bau);
  await p.waitForTimeout(600);
  const aus = await p.evaluate(() =>
    [...document.querySelectorAll('.cal .day.today .ev')].map(e => e.textContent));
  ok('Ausgeschalteter Kalender verschwindet', !aus.some(t => t.includes('Oma')));

  /* --- Neuladen --------------------------------------------------------- */
  await p.evaluate(() => Store.flush());
  await p.waitForTimeout(600);
  await p.reload();
  await p.waitForTimeout(1600);
  const nach = await p.evaluate((d) => {
    const v = Store.getView(d.viewId);
    return { stufe: v.kalStufe, extra: (v.extraDbs || []).length };
  }, bau);
  ok('Stufe und Kalenderliste überleben das Neuladen', nach.stufe === 'monat' && nach.extra === 1);

  console.log('\n=== ERGEBNIS ===');
  pruef.forEach(([n, x]) => console.log((x ? '✅ ' : '❌ ') + n));
  console.log('\n' + pruef.filter(x => x[1]).length + '/' + pruef.length + ' bestanden');
  if (f.length) { console.log('\nFEHLER:'); f.slice(0, 8).forEach(x => console.log('  ' + x)); }
  else console.log('Keine JS-Fehler.');
  await b.close();
})();
