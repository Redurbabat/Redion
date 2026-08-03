const WURZEL = require('path').resolve(__dirname, '../..');
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const http = require('http');

(async () => {
  /* Kleiner Server — der Service Worker braucht http, keine Datei */
  const TYPEN = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css',
    '.png':'image/png', '.webmanifest':'application/manifest+json', '.json':'application/json',
    '.ico':'image/x-icon', '.md':'text/markdown' };
  const srv = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p === '/') p = '/index.html';
    const datei = path.join(WURZEL, p);
    if (!datei.startsWith(WURZEL) || !fs.existsSync(datei) || fs.statSync(datei).isDirectory()) {
      res.writeHead(404); res.end('weg'); return;
    }
    res.writeHead(200, { 'Content-Type': TYPEN[path.extname(datei)] || 'application/octet-stream' });
    res.end(fs.readFileSync(datei));
  });
  await new Promise(r => srv.listen(8799, r));

  const b = await chromium.launch();
  const pruef=[]; const ok=(n,x)=>pruef.push([n,!!x]);

  /* --- 1) Dateien, die es geben muss ---------------------------------- */
  const dateien = ['oeffentlich/manifest.webmanifest','sw.js',
                   'quell/bereiche/einstellungen/pwa.js','oeffentlich/_headers',
                   'oeffentlich/favicon.ico',
                   'oeffentlich/icons/icon-192.png','oeffentlich/icons/icon-512.png',
                   'oeffentlich/icons/icon-180.png','oeffentlich/icons/maskable-512.png',
                   'oeffentlich/icons/start-iphone-13-pro-max.png'];
  const fehlt = dateien.filter(d => !fs.existsSync(WURZEL + '/' + d))
    .concat(['wrangler.toml','worker.js','functions/api/bruecke.js','CLOUDFLARE.md']
      .filter(d => !fs.existsSync(WURZEL + '/' + d)));
  console.log('   Fehlende Dateien:', JSON.stringify(fehlt));
  ok('Alle PWA- und Cloudflare-Dateien da', fehlt.length === 0);

  const man = JSON.parse(fs.readFileSync(WURZEL + '/oeffentlich/manifest.webmanifest', 'utf8'));
  ok('Manifest: standalone', man.display === 'standalone');
  ok('Manifest: Start und Bereich', !!man.start_url && !!man.scope);
  ok('Manifest: 192 und 512 dabei',
     man.icons.some(i => i.sizes === '192x192') && man.icons.some(i => i.sizes === '512x512'));
  ok('Manifest: maskable dabei', man.icons.some(i => i.purpose === 'maskable'));
  ok('Manifest: Farben gesetzt', !!man.theme_color && !!man.background_color);
  ok('Manifest: Abkürzungen', (man.shortcuts || []).length >= 3);

  /* Symbolgrössen wirklich prüfen */
  const { execSync } = require('child_process');
  const groesse = execSync(`python3 -c "
from PIL import Image
import json
r={}
for g in [180,192,512]:
    im=Image.open('${WURZEL}/oeffentlich/icons/icon-%d.png'%g); r[g]=list(im.size)+[im.mode]
print(json.dumps(r))"`).toString().trim();
  console.log('   Symbolgrössen:', groesse);
  const gr = JSON.parse(groesse);
  ok('Symbole haben die richtige Grösse',
     gr['180'][0] === 180 && gr['192'][0] === 192 && gr['512'][0] === 512);

  /* --- 2) Kopfzeilen im HTML ------------------------------------------ */
  const html = fs.readFileSync(WURZEL + '/index.html', 'utf8');
  ok('Manifest verlinkt', /rel="manifest"/.test(html));
  ok('Apple-Symbol verlinkt', /apple-touch-icon/.test(html));
  ok('Apple-Vollbild angemeldet', /apple-mobile-web-app-capable"\s+content="yes"/.test(html));
  ok('Statusleiste eingestellt', /apple-mobile-web-app-status-bar-style/.test(html));
  ok('Startbild fürs 13 Pro Max', /start-iphone-13-pro-max/.test(html) &&
     /device-width:428px\) and \(device-height:926px/.test(html));
  ok('viewport-fit für die Kerbe', /viewport-fit=cover/.test(html));
  ok('Theme-Farbe gesetzt', /name="theme-color"/.test(html));

  /* --- 3) Im Browser: Service Worker und Offline ---------------------- */
  const ctx = await b.newContext({ serviceWorkers: 'allow' });
  const p = await ctx.newPage();
  const f=[]; p.on('pageerror',e=>f.push('PAGEERROR: '+e.message));
  await p.goto('http://localhost:8799/index.html');
  await p.waitForTimeout(2600);

  const sw = await p.evaluate(async () => {
    const reg = await navigator.serviceWorker.getRegistration();
    return { da: !!reg, bereich: reg ? reg.scope : '',
             aktiv: !!(reg && (reg.active || reg.installing || reg.waiting)) };
  });
  console.log('   Service Worker:', JSON.stringify(sw));
  ok('Service Worker angemeldet', sw.da && sw.aktiv);

  await p.waitForTimeout(2200);
  const ablage = await p.evaluate(async () => {
    const namen = await caches.keys();
    if (!namen.length) return { namen, anzahl: 0 };
    const c = await caches.open(namen[0]);
    const k = await c.keys();
    return { namen, anzahl: k.length,
             hatApp: k.some(x => x.url.includes('schale/schale.js') ||
                                 x.url.includes('aufbau/schale.js')),
             hatCss: k.some(x => x.url.includes('stil/bausteine.css')) };
  });
  console.log('   Ablage:', JSON.stringify(ablage));
  ok('Dateien liegen im Speicher', ablage.anzahl >= 20 && ablage.hatApp && ablage.hatCss);

  /* Offline: Server aus, Seite neu laden */
  await new Promise(r => srv.close(r));
  await p.reload();
  await p.waitForTimeout(2000);
  const offline = await p.evaluate(() => ({
    titel: document.getElementById('title')?.textContent,
    seitenleiste: !!document.getElementById('sidebar'),
    store: typeof Store !== 'undefined',
    bloecke: document.querySelectorAll('.blk').length
  }));
  console.log('   Offline:', JSON.stringify(offline));
  ok('App startet ohne Server', offline.seitenleiste && offline.store && offline.bloecke > 0);

  /* --- 4) Telefon-Oberfläche ------------------------------------------ */
  await p.setViewportSize({ width: 428, height: 926 });   /* iPhone 13 Pro Max */
  await p.waitForTimeout(700);
  const tel = await p.evaluate(() => {
    const menu = document.getElementById('btn-menu');
    const side = document.getElementById('sidebar');
    const vorher = getComputedStyle(side).transform;
    menu?.click();
    const offen = document.body.classList.contains('side-offen');
    const schatten = !!document.getElementById('side-schatten');
    PWA.schubladeZu();
    return { menuDa: !!menu, menuSichtbar: menu ? getComputedStyle(menu).display !== 'none' : false,
             versteckt: vorher !== 'none', offen, schatten,
             istTelefon: PWA.istTelefon(),
             schriftgroesse: getComputedStyle(document.querySelector('.blk .ct') || document.body).fontSize };
  });
  console.log('   Telefon:', JSON.stringify(tel));
  ok('Menü-Knopf erscheint auf dem Telefon', tel.menuDa && tel.menuSichtbar);
  ok('Seitenleiste ist eingefahren', tel.versteckt);
  ok('Knopf klappt sie auf', tel.offen && tel.schatten);
  ok('Schrift gross genug gegen iOS-Zoom', parseFloat(tel.schriftgroesse) >= 16);

  await p.setViewportSize({ width: 1400, height: 900 });
  await p.waitForTimeout(500);
  const gross = await p.evaluate(() =>
    getComputedStyle(document.getElementById('btn-menu')).display === 'none');
  ok('Am Rechner ist der Knopf weg', gross);

  /* --- 5) Cloudflare-Brücke ------------------------------------------- */
  const bruecke = fs.readFileSync(WURZEL + '/functions/api/bruecke.js', 'utf8');
  ok('Brücke hat eine Freigabeliste', /const ERLAUBT/.test(bruecke));
  ok('Brücke erlaubt iCloud-Kalender', /icloud\.com/.test(bruecke));
  ok('Brücke schickt CORS-Kopfzeilen', /Access-Control-Allow-Origin/.test(bruecke));
  ok('Brücke beantwortet OPTIONS', /OPTIONS/.test(bruecke));

  const verb = fs.readFileSync(WURZEL + '/quell/bereiche/verbinden/konten.js', 'utf8');
  ok('App findet die Brücke von selbst', /\/api\/bruecke\?ziel=\{url\}/.test(verb));

  /* --- 6) Der Service Worker fasst Fremdes nicht an -------------------- */
  ok('Fremde Adressen bleiben draussen',
     /u\.origin !== self\.location\.origin/.test(fs.readFileSync(WURZEL + '/sw.js','utf8')));
  ok('API-Aufrufe bleiben draussen',
     /pathname\.startsWith\('\/api\/'\)/.test(fs.readFileSync(WURZEL + '/sw.js','utf8')));

  console.log('\n=== ERGEBNIS ===');
  pruef.forEach(([n, x]) => console.log((x ? '✅ ' : '❌ ') + n));
  console.log('\n' + pruef.filter(x => x[1]).length + '/' + pruef.length + ' bestanden');
  if (f.length) { console.log('\nFEHLER:'); f.slice(0, 6).forEach(x => console.log('  ' + x)); }
  else console.log('Keine JS-Fehler.');
  await b.close();
})();
