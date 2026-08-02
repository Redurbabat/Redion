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

self.addEventListener('fetch', (e) => {
  const anfrage = e.request;
  if (anfrage.method !== 'GET') return;

  const u = new URL(anfrage.url);

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
