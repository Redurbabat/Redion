const WURZEL = require('path').resolve(__dirname, '../..');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1500, height: 950 } });
  const f=[]; p.on('pageerror',e=>f.push('PAGEERROR: '+e.message));
  p.on('console',m=>{if(m.type()==='error'&&!/11434|CONNECTION_REFUSED/.test(m.text()))f.push('CONSOLE: '+m.text());});
  const pruef=[]; const ok=(n,x)=>pruef.push([n,!!x]);

  await p.goto('file://' + WURZEL + '/index.html');
  await p.waitForTimeout(1500);

  await p.click('[data-wz="vorlagen"]');
  await p.waitForTimeout(500);
  ok('Galerie offen', await p.locator('.gal-karte').count() === 8);

  // Habit-Tracker
  await p.click('.gal-karte[data-v="habit"]');
  await p.waitForTimeout(1800);
  ok('Habit-Seite angelegt', (await p.locator('#title').textContent()) === 'Habit-Tracker');
  ok('Sechs Ansichten', await p.locator('.db-tab').count() >= 7);
  const score = await p.evaluate(() => {
    const c = Object.values(Store.cache.collections).find(x => x.name === 'Tagesdaten');
    const r = Store.rowsOf(c.id)[0];
    return { score: Datenbank.wert(r, 'score', c),
             voll: Datenbank.wert(r, 'voll', c),
             ampel: Datenbank.wert(r, 'ampel', c),
             balken: Datenbank.wert(r, 'balken', c),
             woche: Datenbank.wert(r, 'woche', c) };
  });
  console.log('   Habit-Score-Probe:', JSON.stringify(score));
  ok('Habit Score rechnet (' + score.score + ')', typeof score.score === 'number' && score.score > 60);
  ok('Tag vollständig? = true', score.voll === true);
  ok('Ampel zeigt Zeichen', ['🟢','🟡','🟠','⚪'].includes(score.ampel));
  ok('Fortschrittsbalken', String(score.balken).includes('█'));
  ok('Wochenformel', /^\d{4}-KW\d{2}$/.test(String(score.woche)));

  // Fitness-OS
  await p.click('[data-wz="vorlagen"]');
  await p.waitForTimeout(400);
  await p.click('.gal-karte[data-v="fitness"]');
  await p.waitForTimeout(2500);
  ok('Fitness-Seite angelegt', (await p.locator('#title').textContent()) === 'Fitness-OS');
  const dbs = await p.evaluate(() => Object.values(Store.cache.collections).map(c => c.name));
  ok('Zehn Datenbanken (' + dbs.filter(n => ['Übungen-Katalog','Lebensmittel','Tagesbilanz','Trainingseinheiten','Satz-Protokoll','Mahlzeiten','Habit-Log','Körpermasse','Trainingspläne','Wochenreview'].includes(n)).length + ')',
     dbs.filter(n => ['Übungen-Katalog','Lebensmittel','Tagesbilanz','Trainingseinheiten','Satz-Protokoll','Mahlzeiten','Habit-Log','Körpermasse','Trainingspläne','Wochenreview'].includes(n)).length === 10);

  const fit = await p.evaluate(() => {
    const satz = Object.values(Store.cache.collections).find(c => c.name === 'Satz-Protokoll');
    const s = Store.rowsOf(satz.id)[0];
    const tagC = Object.values(Store.cache.collections).find(c => c.name === 'Tagesbilanz');
    const t = Store.rowsOf(tagC.id)[0];
    const mahl = Object.values(Store.cache.collections).find(c => c.name === 'Mahlzeiten');
    const ein = Object.values(Store.cache.collections).find(c => c.name === 'Trainingseinheiten');
    const e = Store.rowsOf(ein.id)[0];
    return {
      volumen: Datenbank.wert(s, 'volumen', satz),
      rm: Datenbank.wert(s, 'rm', satz),
      intensitaet: Datenbank.wert(s, 'intensitaet', satz),
      quote: Datenbank.wert(t, 'quote', tagC),
      score: Datenbank.wert(t, 'score', tagC),
      dauer: Datenbank.wert(e, 'dauer', ein),
      hatRollup: Object.values(mahl.schema).some(d => d.type === 'rollup')
    };
  });
  console.log('   Fitness-Proben:', JSON.stringify(fit));
  ok('Volumen = 600', fit.volumen === 600);
  ok('1RM nach Epley = 80', fit.rm === 80);
  ok('Intensität aus RPE', String(fit.intensitaet).includes('hart'));
  ok('Habit-Quote = 80', fit.quote === 80);
  ok('Tages-Score = 90', fit.score === 90);
  ok('Dauer 75 min', fit.dauer === 75);
  ok('Mahlzeiten hat Rollup', fit.hatRollup === true);

  // Persistenz
  await p.evaluate(() => Store.flush());
  await p.waitForTimeout(600);
  await p.reload();
  await p.waitForTimeout(1600);
  ok('Nach Neuladen erhalten', await p.evaluate(() => Object.keys(Store.cache.collections).length >= 11));

  await b.close();
  console.log('\n=== ERGEBNIS ===');
  let gut=0; pruef.forEach(([n,x])=>{console.log((x?'✅':'❌')+' '+n); if(x)gut++;});
  console.log(`\n${gut}/${pruef.length} bestanden`);
  console.log(f.length ? 'FEHLER:\n'+[...new Set(f)].slice(0,6).join('\n') : 'Keine JS-Fehler.');
})();
