/* Ein echtes fetch('/v1/…') über den Servicearbeiter — ohne Server dahinter */
const WURZEL = require('path').resolve(__dirname, '../..');
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');
let ok = 0, bad = 0;
const pruef = (n, ist, soll) => {
  const gut = JSON.stringify(ist) === JSON.stringify(soll);
  console.log((gut ? '✅ ' : '❌ ') + n + (gut ? '' : `  ist=${JSON.stringify(ist)} soll=${JSON.stringify(soll)}`));
  gut ? ok++ : bad++;
};

const TYP = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
              '.css': 'text/css; charset=utf-8', '.json': 'application/json',
              '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };

const server = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  let pf = path.join(WURZEL, u.pathname === '/' ? 'index.html' : u.pathname);
  if (!fs.existsSync(pf) || fs.statSync(pf).isDirectory()) {
    /* /v1/… gibt es hier absichtlich nicht — der Arbeiter muss antworten */
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end('{"vom":"server","hinweis":"diese Adresse kennt der Server nicht"}');
    return;
  }
  res.writeHead(200, { 'Content-Type': TYP[path.extname(pf)] || 'application/octet-stream',
                       'Service-Worker-Allowed': '/' });
  res.end(fs.readFileSync(pf));
});

(async () => {
  await new Promise(r => server.listen(8791, r));
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1300, height: 900 } });
  const fehler = [];
  p.on('pageerror', e => fehler.push('JS: ' + e.message));
  await p.goto('http://localhost:8791/index.html');
  await p.waitForTimeout(2500);

  /* Der Arbeiter muss die Steuerung übernommen haben */
  const bereit = await p.evaluate(async () => {
    const reg = await navigator.serviceWorker.ready;
    /* Beim allerersten Laden steuert er noch nicht — dann neu laden */
    return { registriert: !!reg, steuert: !!navigator.serviceWorker.controller };
  });
  pruef('Der Servicearbeiter ist da', bereit.registriert, true);
  if (!bereit.steuert) { await p.reload(); await p.waitForTimeout(2500); }
  pruef('Und steuert die Seite', await p.evaluate(() =>
    !!navigator.serviceWorker.controller), true);

  const auf = await p.evaluate(async () => {
    const s = Store.addBlock(null, 'page', { text: 'Über das Netz' });
    Store.addBlock(s.id, 'text', { text: 'Ein Absatz' });
    App.oeffne(s.id);
    await new Promise(r => setTimeout(r, 400));
    return { seite: s.id, token: Api.tokenNeu() };
  });

  /* --- Ein ganz gewöhnliches fetch --------------------------------------- */
  const echt = await p.evaluate(async (x) => {
    const a = await fetch('/v1/users/me', {
      headers: { 'Notion-Version': '2022-06-28', Authorization: 'Bearer ' + x.token } });
    return { status: a.status, typ: a.headers.get('content-type'), body: await a.json() };
  }, auf);
  pruef('fetch(/v1/users/me) kommt durch', echt.status, 200);
  pruef('Als JSON',        (echt.typ || '').includes('application/json'), true);
  pruef('Mit dem Nutzer',  echt.body.object, 'user');

  const seite = await p.evaluate(async (x) => {
    const a = await fetch('/v1/pages/' + x.seite, {
      headers: { 'Notion-Version': '2022-06-28', Authorization: 'Bearer ' + x.token } });
    return { status: a.status, titel: (await a.json()).properties.title.title[0].plain_text };
  }, auf);
  pruef('Eine echte Seite über HTTP', seite.status, 200);
  pruef('Mit ihrem Titel',            seite.titel, 'Über das Netz');

  /* POST geht auch — der Arbeiter lässt nicht nur GET durch */
  const gepostet = await p.evaluate(async (x) => {
    const a = await fetch('/v1/pages', {
      method: 'POST',
      headers: { 'Notion-Version': '2022-06-28', Authorization: 'Bearer ' + x.token,
                 'Content-Type': 'application/json' },
      body: JSON.stringify({ parent: { page_id: x.seite },
        properties: { title: { title: [{ text: { content: 'Per POST' } }] } } })
    });
    const j = await a.json();
    return { status: a.status, titel: j.properties.title.title[0].plain_text,
             wirklichDa: Store.childrenOf(x.seite).some(c => c.text === 'Per POST') };
  }, auf);
  pruef('POST über das Netz',     gepostet.status, 200);
  pruef('Legt wirklich an',       gepostet.wirklichDa, true);
  pruef('Mit dem gewünschten Titel', gepostet.titel, 'Per POST');

  /* Fehler kommen ebenfalls durch — nicht als 404 vom Server */
  const ohneFassung = await p.evaluate(async (x) => {
    const a = await fetch('/v1/users/me', { headers: { Authorization: 'Bearer ' + x.token } });
    return { status: a.status, body: await a.json() };
  }, auf);
  pruef('Fehlende Fassung: 400 vom Arbeiter', ohneFassung.status, 400);
  pruef('Mit dem richtigen Code',             ohneFassung.body.code, 'missing_version');
  pruef('Und nicht vom Server',               ohneFassung.body.vom, undefined);

  const falschesToken = await p.evaluate(async () => {
    const a = await fetch('/v1/users/me', {
      headers: { 'Notion-Version': '2022-06-28', Authorization: 'Bearer nein' } });
    return a.status;
  });
  pruef('Falsches Token: 401', falschesToken, 401);

  /* Notions interne Adressen kommen über denselben Weg */
  const intern = await p.evaluate(async (x) => {
    const a = await fetch('/api/v3/loadPageChunk', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + x.token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ pageId: x.seite }) });
    const j = await a.json();
    const c = await fetch('/api/v3/submitTransaction', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + x.token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ operations: [
        { id: x.seite, table: 'block', path: ['text'], command: 'set', args: 'Per Transaktion' } ] }) });
    return { status: a.status, hatMap: !!j.recordMap,
             txStatus: c.status, text: Store.getBlock(x.seite).text };
  }, auf);
  pruef('/api/v3/loadPageChunk über HTTP', intern.status, 200);
  pruef('Mit einer recordMap',             intern.hatMap, true);
  pruef('submitTransaction über HTTP',     intern.txStatus, 200);
  pruef('Und die Änderung greift',         intern.text, 'Per Transaktion');

  /* Die Brücke bleibt beim Server — der Arbeiter fängt sie nicht ab */
  const bruecke = await p.evaluate(async () => {
    const a = await fetch('/api/bruecke?ziel=x');
    const t = await a.text();
    return { status: a.status, vomServer: t.includes('"vom":"server"') };
  });
  pruef('/api/bruecke geht weiterhin zum Server', bruecke.vomServer, true);

  /* Andere Adressen laufen weiterhin normal durch */
  const gewoehnlich = await p.evaluate(async () => {
    const a = await fetch('/quell/schale/stil/bausteine.css');
    return { status: a.status, laenge: (await a.text()).length > 500 };
  });
  pruef('Gewöhnliche Dateien gehen weiter durch', gewoehnlich.status, 200);
  pruef('Und kommen vollständig an',              gewoehnlich.laenge, true);

  console.log(`\n${ok}/${ok + bad} bestanden`);
  console.log(fehler.length ? 'JS-Fehler:\n' + fehler.join('\n') : 'Keine JS-Fehler.');
  await b.close();
  server.close();
  process.exit(bad || fehler.length ? 1 : 0);
})();
