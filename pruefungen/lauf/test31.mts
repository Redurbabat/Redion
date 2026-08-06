import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
const WURZEL = path.resolve(import.meta.dirname, '../..');
import http from 'node:http';

(async () => {
  /* Kleiner Server — der Service Worker braucht http, keine Datei */
  /* Feste Tabelle, dynamisch gelesen — deshalb Record und nicht die
     Literalform: `TYPEN[endung]` fragt mit einer Zeichenkette, die erst
     zur Laufzeit feststeht. */
  const TYPEN: Record<string, string> = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css',
    '.png':'image/png', '.webmanifest':'application/manifest+json', '.json':'application/json',
    '.ico':'image/x-icon', '.md':'text/markdown' };
  const srv = http.createServer((req, res) => {
    let p = decodeURIComponent((req.url ?? '/').split('?')[0] ?? '/');
    if (p === '/') p = '/index.html';
    const datei = path.join(WURZEL, p);
    if (!datei.startsWith(WURZEL) || !fs.existsSync(datei) || fs.statSync(datei).isDirectory()) {
      res.writeHead(404); res.end('weg'); return;
    }
    res.writeHead(200, { 'Content-Type': TYPEN[path.extname(datei)] || 'application/octet-stream' });
    res.end(fs.readFileSync(datei));
  });
  await new Promise<void>(r => srv.listen(8799, () => r()));

  const b = await chromium.launch();
  const pruef: [string, boolean][]=[]; const ok=(n: string,x: unknown)=>pruef.push([n,!!x]);

  /* --- 1) Dateien, die es geben muss ---------------------------------- */
  const dateien = ['oeffentlich/manifest.webmanifest','sw.js',
                   'quell/bereiche/einstellungen/pwa.js','oeffentlich/_headers',
                   'oeffentlich/favicon.ico',
                   'oeffentlich/icons/icon-192.png','oeffentlich/icons/icon-512.png',
                   'oeffentlich/icons/icon-180.png','oeffentlich/icons/maskable-512.png',
                   'oeffentlich/icons/start-iphone-13-pro-max.png'];
  const fehlt = dateien.filter(d => !fs.existsSync(WURZEL + '/' + d))
    .concat(['wrangler.toml','worker.ts','functions/api/bruecke.ts','CLOUDFLARE.md']
      .filter(d => !fs.existsSync(WURZEL + '/' + d)));
  console.log('   Fehlende Dateien:', JSON.stringify(fehlt));
  ok('Alle PWA- und Cloudflare-Dateien da', fehlt.length === 0);

  /* Das Manifest kommt aus JSON.parse und ist damit formlos. Die Form, die
     dieser Lauf davon anfasst, steht hier benannt — beim Umzug war an den
     drei Stellen unten `number` eingetragen worden, und ein Symbol ist keine
     Zahl. */
  type Symbolangabe = { sizes?: string; purpose?: string };
  const man = JSON.parse(fs.readFileSync(WURZEL + '/oeffentlich/manifest.webmanifest', 'utf8'));
  ok('Manifest: standalone', man.display === 'standalone');
  ok('Manifest: Start und Bereich', !!man.start_url && !!man.scope);
  ok('Manifest: 192 und 512 dabei',
     man.icons.some((i: Symbolangabe) => i.sizes === '192x192') && man.icons.some((i: Symbolangabe) => i.sizes === '512x512'));
  ok('Manifest: maskable dabei', man.icons.some((i: Symbolangabe) => i.purpose === 'maskable'));
  ok('Manifest: Farben gesetzt', !!man.theme_color && !!man.background_color);
  ok('Manifest: Abkürzungen', (man.shortcuts || []).length >= 3);

  /* Symbolgrössen wirklich prüfen.
     Hier stand ein Aufruf von `python3 -c "from PIL import Image …"`. Das lief
     genau auf dem Rechner, auf dem Pillow zufällig installiert war — überall
     sonst brach der ganze Lauf ab, bevor eine einzige der 40 Prüfungen
     durchkam. Ein fehlgeschlagenes execSync wirft; es gab kein try darum.

     Ein PNG sagt seine Masse selbst, und zwar an einer festen Stelle: nach
     der 8 Byte langen Signatur folgt der IHDR-Block, dort stehen ab Byte 16
     Breite und Höhe als 32-Bit-Zahlen, Byte 24 ist die Bittiefe und 25 die
     Farbart. Das sind zwölf Zeilen und keine Abhängigkeit. */
  const pngMasse = (datei: string) => {
    const b = fs.readFileSync(datei);
    const signatur = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    if (b.length < 26 || !b.subarray(0, 8).equals(signatur)) return null;
    if (b.subarray(12, 16).toString('latin1') !== 'IHDR') return null;
    return { breite: b.readUInt32BE(16), hoehe: b.readUInt32BE(20),
             tiefe: b[24], farbart: b[25] };
  };

  const gr: Record<number, ReturnType<typeof pngMasse>> = {};
  [180, 192, 512].forEach(g => {
    gr[g] = pngMasse(WURZEL + '/oeffentlich/icons/icon-' + g + '.png');
  });
  console.log('   Symbolgrössen:', JSON.stringify(gr));
  ok('Symbole sind lesbare PNG', [180, 192, 512].every(g => gr[g]));
  ok('Symbole haben die richtige Grösse',
     [180, 192, 512].every(g => { const m = gr[g]; return !!m && m.breite === g && m.hoehe === g; }));

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
  const f: any[]=[]; p.on('pageerror',e=>f.push('PAGEERROR: '+e.message));
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
    /* Ohne Namen gibt es nichts zu öffnen. Der Rückgabewert bleibt derselbe
       wie vorher — anzahl 0 lässt die Prüfung unten rot werden. */
    const erster = namen[0];
    if (!namen.length || !erster) return { namen, anzahl: 0 };
    const c = await caches.open(erster);
    const k = await c.keys();
    return { namen, anzahl: k.length,
             hatApp: k.some(x => (x.url ?? '').includes('schale/schale.js') ||
                                 (x.url ?? '').includes('aufbau/schale.js')),
             hatCss: k.some(x => (x.url ?? '').includes('stil/bausteine.css')) };
  });
  console.log('   Ablage:', JSON.stringify(ablage));
  ok('Dateien liegen im Speicher', Number(ablage.anzahl ?? -1) >= 20 && ablage.hatApp && ablage.hatCss);

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
    /* DAS ☰ IST DER KREIS LINKS OBEN GEWORDEN. Nach der Vorlage aus
       Notions App öffnet der Arbeitsbereich-Knopf die Schublade — dasselbe
       Ziel, an der Stelle, an der man es sucht. Geprüft wird weiterhin,
       DASS es einen sichtbaren Knopf gibt, der sie aufklappt; nur sein
       Name hat sich geändert. */
    const menu = document.getElementById('hl-konto') || document.getElementById('btn-menu');
    const side = document.getElementById('sidebar');
    /* Fehlt die Seitenleiste, ist 'none' die Antwort, die unten rot wird —
       eine leere Zeichenkette wäre ungleich 'none' und damit still grün. */
    const vorher = side ? getComputedStyle(side).transform : 'none';
    menu?.click();
    const offen = document.body?.classList.contains('side-offen');
    const schatten = !!document.getElementById('side-schatten');
    PWA.schubladeZu();
    return { menuDa: !!menu, menuSichtbar: menu ? getComputedStyle(menu).display !== 'none' : false,
             versteckt: vorher !== 'none', offen, schatten,
             istTelefon: PWA.istTelefon(),
             schriftgroesse: getComputedStyle(document.querySelector('.blk .ct') || document.body).fontSize };
  });
  console.log('   Telefon:', JSON.stringify(tel));
  ok('Der Arbeitsbereich-Knopf erscheint auf dem Telefon', tel.menuDa && tel.menuSichtbar);
  ok('Seitenleiste ist eingefahren', tel.versteckt);
  ok('Knopf klappt sie auf', tel.offen && tel.schatten);
  ok('Schrift gross genug gegen iOS-Zoom', parseFloat(tel.schriftgroesse) >= 16);

  await p.setViewportSize({ width: 1400, height: 900 });
  await p.waitForTimeout(500);
  const gross = await p.evaluate(() => {
    const knopf = document.getElementById('btn-menu');
    /* Kein Knopf heisst hier nicht „weg wie gewünscht": vorher warf die Zeile,
       jetzt wird die Prüfung rot statt still grün. */
    return !!knopf && getComputedStyle(knopf).display === 'none';
  });
  ok('Am Rechner ist der Knopf weg', gross);

  /* --- 5) Cloudflare-Brücke ------------------------------------------- */
  const bruecke = fs.readFileSync(WURZEL + '/functions/api/bruecke.ts', 'utf8');
  ok('Brücke hat eine Freigabeliste', /const ERLAUBT/.test(bruecke));
  ok('Brücke erlaubt iCloud-Kalender', /icloud\.com/.test(bruecke));
  ok('Brücke schickt CORS-Kopfzeilen', /Access-Control-Allow-Origin/.test(bruecke));
  ok('Brücke beantwortet OPTIONS', /OPTIONS/.test(bruecke));

  const verb = fs.readFileSync(WURZEL + '/quell/bereiche/verbinden/konten.js', 'utf8');
  ok('App findet die Brücke von selbst', /\/api\/bruecke\?ziel=\{url\}/.test(verb));

  /* --- 6) Der Service Worker fasst Fremdes nicht an --------------------
   * GEPRÜFT WIRD DIE ERZEUGTE DATEI, nicht die Quelle: `sw.js` ist das, was
   * im Browser läuft. Seit Bündel 20 entsteht sie aus `src/dienst/sw.ts`,
   * und dort heisst der eigene Geltungsbereich `ich` statt `self` — die
   * Typbibliothek `WebWorker` kennt `self` nur als den allgemeineren
   * WorkerGlobalScope. Beide Schreibweisen stehen deshalb hier; die Regel
   * selbst ist unverändert und wird genauso genau verlangt wie vorher.
   * ------------------------------------------------------------------- */
  ok('Fremde Adressen bleiben draussen',
     /u\.origin !== (?:self|ich)\.location\.origin/.test(fs.readFileSync(WURZEL + '/sw.js','utf8')));
  ok('API-Aufrufe bleiben draussen',
     /pathname\.startsWith\('\/api\/'\)/.test(fs.readFileSync(WURZEL + '/sw.js','utf8')));

  /* --- 7) Eine Ersatzantwort muss zur Frage passen ---------------------
   * DER FEHLER, DER DAZU FÜHRTE. Fand der Arbeiter eine Datei weder im
   * Speicher noch im Netz, gab er die **Startseite** zurück — für jede
   * Anfrage. Ein `<script src="…/wissensseiten.js">` bekam damit Status 200
   * und HTML im Körper, der Browser führte HTML als JavaScript aus, und
   * `Wissen` blieb undefiniert. Gemeldet wurde dann „Wissen is not defined"
   * — ein Name, der mit der Ursache nichts zu tun hat, in einer Datei, die
   * völlig in Ordnung war.
   *
   * Geprüft wird beides: das Skript bekommt keine Startseite, die Navigation
   * bekommt sie weiterhin. Ohne die zweite Hälfte wäre die Offline-Fähigkeit
   * repariert kaputt.
   * ------------------------------------------------------------------- */
  const swQuelle = fs.readFileSync(WURZEL + '/sw.js', 'utf8');
  ok('Die Startseite kommt nur bei einer Navigation',
     /anfrage\.mode === 'navigate'/.test(swQuelle));
  ok('Sonst eine ehrliche Fehlerantwort',
     /status: 504/.test(swQuelle));
  ok('Fehlgeschlagenes Ablegen wird nicht verschluckt',
     /misslungen/.test(swQuelle) && !/\.catch\(\(\) => \{\}\)\)\);/.test(swQuelle));

  console.log('\n=== ERGEBNIS ===');
  pruef.forEach(([n, x]) => console.log((x ? '✅ ' : '❌ ') + n));
  console.log('\n' + pruef.filter(x => x[1]).length + '/' + pruef.length + ' bestanden');
  if (f.length) { console.log('\nFEHLER:'); f.slice(0, 6).forEach(x => console.log('  ' + x)); }
  else console.log('Keine JS-Fehler.');
  await b.close();
})();
