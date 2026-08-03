const WURZEL = require('path').resolve(__dirname, '../..');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1500, height: 950 } });
  const f=[]; p.on('pageerror',e=>f.push('PAGEERROR: '+e.message));
  p.on('console',m=>{if(m.type()==='error'&&!/11434|CONNECTION_REFUSED|ERR_|Failed to load resource/i.test(m.text()))f.push('CONSOLE: '+m.text());});
  const pruef=[]; const ok=(n,x)=>pruef.push([n,!!x]);

  /* Kleiner Testserver, der erst nach ein paar Fehlversuchen antwortet */
  const http = require('http');
  let zaehler = { flaky: 0, fest: 0, warte: 0 };
  const srv = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Access-Control-Expose-Headers', 'Retry-After');
    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
    if (req.url.startsWith('/flaky')) {
      zaehler.flaky++;
      if (zaehler.flaky < 3) { res.writeHead(503); res.end('busy'); return; }
      res.writeHead(200, {'Content-Type':'application/json'}); res.end('{"ok":true}'); return;
    }
    if (req.url.startsWith('/fest')) {
      zaehler.fest++;
      res.writeHead(401); res.end('nope'); return;
    }
    if (req.url.startsWith('/warte')) {
      zaehler.warte++;
      if (zaehler.warte < 2) { res.writeHead(429, { 'Retry-After': '1' }); res.end('slow down'); return; }
      res.writeHead(200, {'Content-Type':'application/json'}); res.end('{"ok":true}'); return;
    }
    res.writeHead(404); res.end();
  });
  await new Promise(r => srv.listen(8791, r));

  await p.goto('http://localhost:8765/index.html');
  await p.waitForTimeout(1500);

  /* --- 1) Wiederholung bei 503 ----------------------------------------- */
  const t0 = Date.now();
  const flaky = await p.evaluate(async () => {
    const r = await KI.holen('http://localhost:8791/flaky', {}, { versuche: 4, basis: 200 });
    return { status: r.status, text: await r.text() };
  });
  const dauer = Date.now() - t0;
  console.log('   503:', JSON.stringify(flaky), '| Versuche:', zaehler.flaky, '| Dauer:', dauer, 'ms');
  ok('503 wird wiederholt bis es klappt', flaky.status === 200 && zaehler.flaky === 3);
  ok('Zwischen den Versuchen wird gewartet', dauer >= 500);

  /* --- 2) 401 wird nicht wiederholt ------------------------------------ */
  const fest = await p.evaluate(async () => {
    const r = await KI.holen('http://localhost:8791/fest', {}, { versuche: 4, basis: 100 });
    return r.status;
  });
  console.log('   401:', fest, '| Versuche:', zaehler.fest);
  ok('401 wird genau einmal versucht', fest === 401 && zaehler.fest === 1);

  /* --- 3) Retry-After wird beachtet ------------------------------------ */
  const t1 = Date.now();
  const warte = await p.evaluate(async () => {
    const r = await KI.holen('http://localhost:8791/warte', {}, { versuche: 3, basis: 100 });
    return r.status;
  });
  const dauer2 = Date.now() - t1;
  console.log('   429 mit Retry-After:', warte, '| Dauer:', dauer2, 'ms');
  ok('429 wird wiederholt', warte === 200 && zaehler.warte === 2);
  ok('Retry-After von 1 s wird eingehalten', dauer2 >= 900);

  /* --- 4) Fehlertexte --------------------------------------------------- */
  const texte = await p.evaluate(() => ({
    n401: KI.FEHLERTEXT[401], n429: KI.FEHLERTEXT[429], n500: KI.FEHLERTEXT[500],
    wieder: KI.WIEDERHOLBAR
  }));
  ok('Fehlercodes haben Klartext', /Schlüssel/.test(texte.n401) && /rate_limited/.test(texte.n429));
  ok('Wiederholbare Codes gelistet', texte.wieder.includes(429) && texte.wieder.includes(503) &&
     !texte.wieder.includes(401));

  /* --- 5) Suche nach Seiten-ID ------------------------------------------ */
  const ids = await p.evaluate(() => {
    const s = Store.addPage(null, { text: 'Gesuchte Seite' });
    const kind = Store.addBlock(s.id, 'text', { text: 'Irgendein Absatz' });
    const lang  = Store.search(s.id);
    const kurz  = Store.search(s.id.replace(/-/g, ''));
    const teil  = Store.search(s.id.slice(0, 18));
    const link  = Store.search('http://localhost:8765/index.html#' + s.id);
    const block = Store.search(kind.id);
    const nix   = Store.search('ffffffff-ffff-ffff-ffff-ffffffffffff');
    return {
      id: s.id,
      lang: lang.length && lang[0].page.text, langArt: lang[0] && lang[0].treffer,
      kurz: kurz.length && kurz[0].page.text,
      teil: teil.length && teil[0].page.text,
      link: link.length && link[0].page.text,
      block: block.length && block[0].page.text, blockText: block[0] && block[0].snippet,
      nix: nix.length
    };
  });
  console.log('   ID-Suche:', JSON.stringify(ids));
  ok('Volle Seiten-ID findet die Seite', ids.lang === 'Gesuchte Seite' && ids.langArt === 'Seiten-ID');
  ok('ID ohne Bindestriche findet sie auch', ids.kurz === 'Gesuchte Seite');
  ok('Anfang der ID reicht', ids.teil === 'Gesuchte Seite');
  ok('Ganze Adresse mit # funktioniert', ids.link === 'Gesuchte Seite');
  ok('Block-ID führt zur Seite', ids.block === 'Gesuchte Seite' && /Block vom Typ text/.test(ids.blockText));
  ok('Unbekannte ID findet nichts', ids.nix === 0);

  /* --- 6) Normale Suche geht weiterhin ---------------------------------- */
  const normal = await p.evaluate(() => Store.search('Gesuchte').length);
  ok('Textsuche bleibt unberührt', normal >= 1);

  /* --- 7) Seiten-ID im Menü kopierbar ----------------------------------- */
  const menue = await p.evaluate(() => {
    const s = Object.values(Store.cache.blocks).find(b => b.text === 'Gesuchte Seite');
    App.oeffne(s.id);
    App.seitenMenue({ getBoundingClientRect: () => ({ left: 300, bottom: 100, right: 400, top: 80 }) }, s);
    const da = !!document.querySelector('.menu [data-a="pid"]');
    document.querySelectorAll('.menu').forEach(m => m.remove());
    return da;
  });
  ok('Seitenmenü bietet die ID zum Kopieren', menue);

  srv.close();
  console.log('\n=== ERGEBNIS ===');
  pruef.forEach(([n, x]) => console.log((x ? '✅ ' : '❌ ') + n));
  console.log('\n' + pruef.filter(x => x[1]).length + '/' + pruef.length + ' bestanden');
  if (f.length) { console.log('\nFEHLER:'); f.slice(0, 8).forEach(x => console.log('  ' + x)); }
  else console.log('Keine JS-Fehler.');
  await b.close();
})();
