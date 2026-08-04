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

const VERSION = 'notizen-v16';
const ABLAGE = VERSION;

/* Was beim ersten Besuch gleich mitgenommen wird. */
const GRUNDSTOCK = [
  './',
  './index.html',
  './quell/kern/ereignisse/bus.js',
  './quell/kern/einstellung/konstanten.js',
  './quell/core/helpers/reporter.js',
  './quell/core/helpers/ids.js',
  './quell/core/helpers/date.js',
  './quell/core/helpers/objects.js',
  './quell/core/helpers/bytes.js',
  './quell/core/helpers/throttle.js',
  './quell/kern/ereignisse/arten.js',
  './quell/kern/einstellung/app.js',
  './quell/kern/einstellung/schalter.js',
  './quell/kern/zugang/rollen.js',
  './quell/core/security/sanitize.js',
  './quell/core/spreadsheet/address.js',
  './quell/core/spreadsheet/engine.js',
  './quell/core/spreadsheet/csv.js',
  './quell/kern/sicherheit/pruefen.js',
  './quell/kern/ablage/formen.js',
  './quell/kern/ablage/umzuege.js',
  './quell/register/module.js',
  './quell/register/navigation.js',
  './quell/register/bloecke.js',
  './quell/register/eigenschaften.js',
  './quell/register/ansichten.js',
  './quell/register/befehle.js',
  './quell/register/tasten.js',
  './quell/register/einstellungen.js',
  './quell/register/formeln.js',
  './quell/register/vorlagen.js',
  './quell/register/verbindungen.js',
  './quell/schale/ueberlagerung/menue.js',
  './quell/schale/ueberlagerung/hinweis.js',
  './quell/schale/ueberlagerung/dialog.js',
  './quell/schale/ueberlagerung/ui.js',
  './quell/kern/ablage/nachbarn.js',
  './quell/kern/ablage/indexdb.js',
  './quell/bereiche/datenbanken/formeln/laufzeit.js',
  './quell/bereiche/wissen/verweise.js',
  './quell/bereiche/bloecke/arten/zeichenflaeche.js',
  './quell/bereiche/spreadsheet/ansicht.js',
  './quell/bereiche/datenbanken/raster.js',
  './quell/bereiche/editor/ansicht/editor.js',
  './quell/bereiche/datenbanken/dienst.js',
  './quell/bereiche/datenbanken/steuerung.js',
  './quell/bereiche/wissen/dienst.js',
  './quell/bereiche/wissen/werkzeuge.js',
  './quell/kern/zustand/verlauf.js',
  './quell/bereiche/editor/ansicht/auswahlleiste.js',
  './quell/bereiche/erwaehnungen/ansicht/menue.js',
  './quell/bereiche/kommentare/ansicht/faden.js',
  './quell/bereiche/editor/mehrfach.js',
  './quell/bereiche/datenbanken/ansichten/dienst.js',
  './quell/bereiche/einstellungen/ansicht/seite.js',
  './quell/bereiche/dateien/einlesen.js',
  './quell/kern/zugang/sitzung.js',
  './quell/bereiche/verbinden/konten.js',
  './quell/bereiche/verbinden/kalender.js',
  './quell/bereiche/datenbanken/spiegel/dienst.js',
  './quell/bereiche/verbinden/mail.js',
  './quell/bereiche/verbinden/clipper.js',
  './quell/bereiche/ki/kontext.js',
  './quell/bereiche/ki/agenten.js',
  './quell/bereiche/verbinden/besprechung.js',
  './quell/bereiche/ki/werkzeuge.js',
  './quell/bereiche/einstellungen/pwa.js',
  './quell/bereiche/vorlagen/daten.js',
  './quell/bereiche/hilfe/stand.js',
  './quell/bereiche/hilfe/wissensseiten.js',
  './quell/bereiche/einstellungen/pflege.js',
  './quell/bereiche/datenbanken/datenmodell/ansicht.js',
  './quell/kern/sicherheit/krypto.js',
  './quell/bereiche/ki/ansicht/baukasten.js',
  './quell/schale/aufbau/reiter.js',
  './quell/bereiche/einstellungen/ansicht/aussehen.js',
  './quell/bereiche/seiten/ansicht/fassungen.js',
  './quell/bereiche/dateien/ausgeben.js',
  './quell/kern/helfer/tempo.js',
  './quell/bereiche/planen/dienst.js',
  './quell/bereiche/einstellungen/erweiterungen.js',
  './quell/bereiche/verbinden/eingang.js',
  './quell/bereiche/hilfe/rundgang.js',
  './quell/bereiche/dateien/format.js',
  './quell/bereiche/verbinden/schnittstelle.js',
  './quell/kern/ablage/befehle.js',
  './quell/kern/ereignisse/protokoll.js',
  './quell/bereiche/dateien/ablage.js',
  './quell/kern/abgleich/zusammenfuehren.js',
  './quell/kern/zugang/rechte.js',
  './quell/bereiche/datenbanken/probelauf/dienst.js',
  './quell/bereiche/datenbanken/pruefsaetze/dienst.js',
  './quell/bereiche/vorlagen/dienst.js',
  './quell/bereiche/datenbanken/vorrat/dienst.js',
  './quell/kern/abgleich/maschine.js',
  './quell/bereiche/verbinden/ansicht/wolke.js',
  './quell/bereiche/wissen/bibliothek.js',
  './quell/bereiche/ki/dienst.js',
  './quell/schale/aufbau/seitenleiste.js',
  './quell/schale/aufbau/kopfleiste.js',
  './quell/schale/aufbau/inhaltsflaeche.js',
  './quell/schale/aufbau/schale.js',
  './quell/start.js',
  './quell/schale/stil/marken.css',
  './quell/schale/stil/dunkel.css',
  './quell/schale/stil/hell.css',
  './quell/schale/stil/grund.css',
  './quell/schale/stil/aufbau.css',
  './quell/schale/stil/datenbanken.css',
  './quell/schale/stil/ki.css',
  './quell/schale/stil/werkzeuge.css',
  './quell/schale/stil/ansichten.css',
  './quell/schale/stil/einstellungen.css',
  './quell/schale/stil/tabelle.css',
  './quell/schale/stil/bausteine.css',
  './oeffentlich/manifest.webmanifest',
  './oeffentlich/favicon.ico',
  './oeffentlich/icons/icon-180.png',
  './oeffentlich/icons/icon-192.png',
  './oeffentlich/icons/icon-512.png',
  './oeffentlich/icons/favicon-32.png',
  './oeffentlich/icons/maskable-192.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(ABLAGE);
    /* Einzeln, damit eine fehlende Datei nicht alles scheitern lässt — aber
       nicht lautlos. Vorher stand hier `.catch(() => {})`, und damit war eine
       halb abgelegte App von einer ganzen nicht zu unterscheiden. */
    const misslungen = [];
    await Promise.all(GRUNDSTOCK.map(u =>
      c.add(new Request(u, { cache: 'reload' })).catch(() => misslungen.push(u))));
    if (misslungen.length) {
      console.warn('[sw] ' + misslungen.length + ' von ' + GRUNDSTOCK.length +
        ' Dateien liessen sich nicht ablegen — offline fehlen sie:\n  ' +
        misslungen.join('\n  '));
    }
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

    /* Weder Speicher noch Netz.
       ----------------------------------------------------------------------
       HIER LAG EIN FEHLER, DER SICH ALS ETWAS ANDERES AUSGAB. Die Startseite
       wurde für JEDE Anfrage zurückgegeben — auch für ein fehlendes Skript.
       Der Browser bekam damit auf `<script src="…/wissensseiten.js">` eine
       Antwort mit Status 200 und HTML darin, versuchte HTML als JavaScript
       auszuführen und scheiterte. Die Datei galt als geladen, war es aber
       nicht: `Wissen` blieb undefiniert, und weiter oben in `schale.js`
       stand dann „Wissen is not defined" — ein Name, der mit der Ursache
       nichts zu tun hat.

       Genau so ist es einmal gemeldet worden: Seitenleiste da, Inhalt leer,
       eine Meldung, die in die falsche Richtung zeigt. Eine Ersatzantwort,
       die nicht zur Frage passt, ist schlimmer als gar keine.

       Die Startseite ist nur für eine **Navigation** die richtige Antwort —
       also wenn jemand die App aufruft. Für Skripte, Stilblätter und Bilder
       ist die ehrliche Antwort ein Fehler. */
    if (anfrage.mode === 'navigate') {
      const start = await c.match('./index.html');
      if (start) return start;
    }
    return new Response('Offline und nichts gespeichert: ' + u.pathname,
      { status: 504, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  })());
});

/* Die App kann sich melden, wenn sie eine neue Fassung will. */
self.addEventListener('message', (e) => {
  if (e.data === 'aktualisieren') self.skipWaiting();
});
