const WURZEL = require('path').resolve(__dirname, '../..');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.goto('file://' + WURZEL + '/index.html');
  await p.waitForTimeout(1500);
  // Nachrichtenaufbau prüfen, ohne ein Modell zu laden
  const erg = await p.evaluate(() => {
    let gesehen = null;
    const original = KI.zustand;
    KI.zustand.modell = 'test';
    KI.zustand.bereit = true;
    KI.zustand.quelle = 'webllm';
    KI.zustand.engine = { chat: { completions: { create: async (o) => { gesehen = o.messages; return { [Symbol.asyncIterator]: async function*(){} }; } } } };
    KI.zustand.verlauf = [
      { role: 'system', content: 'ALTE SYSTEMNACHRICHT AUS DEM VERLAUF' },
      { role: 'user', content: 'frage eins' },
      { role: 'assistant', content: 'antwort eins' }
    ];
    return KI.senden('Wie viele Seiten habe ich?').then(() => ({
      rollen: (gesehen||[]).map(m => m.role),
      systemAnzahl: (gesehen||[]).filter(m => m.role === 'system').length,
      ersteRolle: gesehen && gesehen[0] && gesehen[0].role
    }));
  });
  console.log('Rollen:', erg.rollen.join(' → '));
  console.log('Systemnachrichten:', erg.systemAnzahl, '| erste Rolle:', erg.ersteRolle);
  console.log(erg.systemAnzahl === 1 && erg.ersteRolle === 'system' ? '✅ Aufbau korrekt' : '❌ falsch');
  await b.close();
})();
