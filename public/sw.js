/* ============================================================================
 * sw.js — Der Service Worker
 * ----------------------------------------------------------------------------
 * Damit die App auch ohne Netz startet. Er legt beim ersten Besuch alle
 * Dateien beiseite und bedient sie danach von dort.
 *
 * DIE REGEL
 *   Eigene Dateien   → erst aus dem Speicher, im Hintergrund auffrischen
 *                      (dadurch startet die App sofort, bleibt aber aktuell)
 *   Fremde Adressen  → gar nicht anfassen. Weder Google noch Wikipedia noch
 *                      die Brücke gehen durch den Speicher; sonst würden
 *                      Zugangsschlüssel und Antworten dort landen.
 *
 * Beim Aktualisieren wird die alte Ablage weggeräumt — die Versionsnummer
 * unten ist der Schalter dafür.
 * ==========================================================================*/

const VERSION = 'notizen-v4';
const ABLAGE = VERSION;

/* Was beim ersten Besuch gleich mitgenommen wird. */
const GRUNDSTOCK = [
  './',
  './index.html',
  './app.css',
  './manifest.webmanifest',
  './favicon.ico',
  './js/store.js',
  './js/formula.js',
  './js/links.js',
  './js/canvas.js',
  './js/blocks.js',
  './js/database.js',
  './js/tools.js',
  './js/notion.js',
  './js/einstellungen.js',
  './js/import.js',
  './js/konten.js',
  './js/verbindungen.js',
  './js/kalender.js',
  './js/spiegel.js',
  './js/mail.js',
  './js/clipper.js',
  './js/ki-kontext.js',
  './js/agent.js',
  './js/meeting.js',
  './js/mcp.js',
  './js/pwa.js',
  './js/vorlagen.js',
  './js/status.js',
  './js/ai.js',
  './js/app.js',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/favicon-32.png',
  './icons/maskable-192.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(ABLAGE);
    /* Einzeln, damit eine fehlende Datei nicht alles scheitern lässt */
    await Promise.all(GRUNDSTOCK.map(u =>
      c.add(new Request(u, { cache: 'reload' })).catch(() => {})));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const namen = await caches.keys();
    await Promise.all(namen.filter(n => n !== ABLAGE).map(n => caches.delete(n)));
    await self.clients.claim();
  })());
});

/* ---------------------------------------------------------------------------
 * DIE SCHNITTSTELLE /v1/
 * ---------------------------------------------------------------------------
 * Die Daten liegen im Fenster, nicht hier. Also beantwortet der Arbeiter die
 * Anfrage nicht selbst, sondern fragt das Fenster und reicht dessen Antwort
 * durch. Ohne offenes Fenster gibt es nichts zu antworten — dann kommt ein
 * ehrlicher Fehler statt einer leeren Seite.
 * ------------------------------------------------------------------------ */
const alsAntwort = (erg) => new Response(JSON.stringify(erg.body), {
  status: erg.status,
  headers: { 'Content-Type': 'application/json; charset=utf-8',
             'Cache-Control': 'no-store' }
});

const beimFenster = async (anfrage) => {
  const kunden = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  if (!kunden.length) {
    return alsAntwort({ status: 503, body: { object: 'error', status: 503,
      code: 'service_unavailable',
      message: 'Redion ist in keinem Fenster offen. Die Daten liegen dort, ' +
               'nicht auf einem Server — ohne offenes Fenster gibt es nichts zu lesen.' } });
  }
  const u = new URL(anfrage.url);
  let koerper = {};
  if (anfrage.method !== 'GET' && anfrage.method !== 'DELETE') {
    try { koerper = JSON.parse(await anfrage.clone().text() || '{}'); } catch { koerper = {}; }
  }
  const kopf = {};
  anfrage.headers.forEach((v, k) => { kopf[k.toLowerCase()] = v; });

  const erg = await new Promise((fertig) => {
    const kanal = new MessageChannel();
    const uhr = setTimeout(() => fertig({ status: 504, body: { object: 'error', status: 504,
      code: 'gateway_timeout', message: 'Das Fenster hat nicht geantwortet.' } }), 5000);
    kanal.port1.onmessage = (ev) => { clearTimeout(uhr); fertig(ev.data); };
    kunden[0].postMessage({ art: 'api-anfrage', methode: anfrage.method,
                            pfad: u.pathname, koerper, kopf }, [kanal.port2]);
  });
  return alsAntwort(erg);
};

self.addEventListener('fetch', (e) => {
  const anfrage = e.request;
  const u0 = new URL(anfrage.url);

  /* /v1/ und Notions interne /api/v3/ zuerst — auch POST, PATCH und DELETE.
     /api/bruecke bleibt aussen vor: die gehört dem Server. */
  if (u0.origin === self.location.origin &&
      (/^\/v1\//.test(u0.pathname) || /^\/api\/v3\//.test(u0.pathname))) {
    e.respondWith(beimFenster(anfrage));
    return;
  }

  if (anfrage.method !== 'GET') return;

  const u = u0;

  /* Fremdes bleibt draussen — besonders alles, was einen Schlüssel trägt. */
  if (u.origin !== self.location.origin) return;
  if (u.pathname.startsWith('/api/')) return;

  e.respondWith((async () => {
    const c = await caches.open(ABLAGE);
    const gemerkt = await c.match(anfrage, { ignoreSearch: false });

    const netz = fetch(anfrage).then(a => {
      if (a && a.ok && a.type === 'basic') c.put(anfrage, a.clone()).catch(() => {});
      return a;
    }).catch(() => null);

    /* Sofort ausliefern, was da ist; im Hintergrund neu holen. */
    if (gemerkt) { e.waitUntil(netz); return gemerkt; }

    const frisch = await netz;
    if (frisch) return frisch;

    /* Weder Speicher noch Netz: wenigstens die Startseite zeigen. */
    const start = await c.match('./index.html');
    return start || new Response('Offline und nichts gespeichert.',
      { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  })());
});

/* Die App kann sich melden, wenn sie eine neue Fassung will. */
self.addEventListener('message', (e) => {
  if (e.data === 'aktualisieren') self.skipWaiting();
});
