/* ============================================================================
 * src/dienst/sw.ts — Der Service Worker
 * ----------------------------------------------------------------------------
 * ERZEUGT WIRD DARAUS `sw.js` IN DER WURZEL — nicht von Hand ändern.
 * `npm run bauen:ts` schreibt es dorthin (tsconfig.sw.json). Die Wurzel ist
 * Pflicht: ein Dienstarbeiter darf nur den Bereich bedienen, in dem seine
 * eigene Datei liegt.
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

/* WAS `self` HIER IST. In einem Dienstarbeiter ist es der
   `ServiceWorkerGlobalScope` — er kennt `clients`, `skipWaiting` und die
   Ereignisse mit `waitUntil` und `respondWith`. Die Typbibliothek `WebWorker`
   beschreibt nur den allgemeineren `WorkerGlobalScope` und weiss davon
   nichts; sie ist die nächstbeste, die TypeScript mitbringt.

   Diese eine Zeile sagt, was wirklich dasteht. Sie kostet nichts: beim Bauen
   bleibt `const ich = self;` übrig. Der Gewinn ist, dass die Ereignisse
   darunter ihre richtigen Formen bekommen — `e.request` beim Abrufen,
   `e.waitUntil` beim Einrichten — statt überall `any`. */
const ich = self as unknown as ServiceWorkerGlobalScope;

/** Der Name der Ablage. Muss `KONSTANTEN.ABLAGE_NAME` gleichen — siehe
 *  die Erklärung bei `faelligeErinnerungen`. `test143` rechnet es nach. */
const ABLAGE_NAME = 'notizen';

const VERSION = 'notizen-v1242';
/** Der Stempel über den Grundstock — geschrieben von `dienststand.mts`,
 *  von Hand nicht anfassen. Er steht NEBEN der Nummer, nicht in ihr:
 *  `test143` prüft an `VERSION` die Form `notizen-v<Zahl>`. */
const INHALT = 'f9291a7b63a6e39f';
/* DER ABLAGENAME FOLGT DEM INHALT, NICHT DER NUMMER (E610).
   Hier stand `const ABLAGE = VERSION;`. Solange die Nummer nur steigt, geht
   das gut — sie steigt aber nicht immer: ein `git revert` nimmt sw.ts und
   stand.ts mit zurück, und die Nummer fällt mit. E609 hat v1145 auf v1141
   gedreht. Damit sind v1142…v1145 wieder frei und werden ein zweites Mal
   vergeben, mit anderem Inhalt. Wer die erste v1142 im Browser hatte, bekam
   beim zweiten Mal DIESELBE Ablage geöffnet: `activate` löscht nur, was
   anders heisst, und `cache.add` überschreibt nur, was der neue Grundstock
   noch nennt — eine herausgefallene Datei blieb liegen und wurde weiter
   bedient. Genau das verbietet §28.
   Mit dem Stempel im Namen kann das nicht mehr vorkommen: gleicher Name
   heisst gleiche Bytes, per Konstruktion. Und nach einem Zurücknehmen ist
   der Name wieder der alte — richtig so, die Bytes sind es auch.
   `test530` hält es. */
const ABLAGE = VERSION + '-' + INHALT;

/* Was beim ersten Besuch gleich mitgenommen wird. */
const GRUNDSTOCK = [
  './',
  './index.html',
  './quell/kern/ereignisse/bus.js',
  './quell/kern/einstellung/konstanten.js',
  /* Der Stand dieses Baus (E361) — bleibt aus dem Inhaltsstempel heraus, er traegt ihn. */
  './quell/kern/einstellung/stand.js',
  './quell/core/helpers/reporter.js',
  './quell/core/helpers/ids.js',
  './quell/core/helpers/date.js',
  './quell/core/helpers/objects.js',
  './quell/core/helpers/bytes.js',
  './quell/core/helpers/throttle.js',
  './quell/core/helpers/plural.js',
  './quell/core/helpers/colors.js',
  './quell/kern/ereignisse/arten.js',
  './quell/kern/einstellung/app.js',
  './quell/kern/einstellung/schalter.js',
  './quell/kern/zugang/rollen.js',
  './quell/core/security/sanitize.js',
  './quell/core/sheet/space.js',
  './quell/core/ink/geometry.js',
  './quell/core/export/pdfWriter.js',
  './quell/core/ink/shapes.js',
  './quell/core/ink/stroke.js',
  './quell/core/ink/thumbnail.js',
  './quell/core/electrical/calculations.js',
  './quell/core/electrical/rechenweg.js',
  './quell/core/spreadsheet/address.js',
  './quell/core/spreadsheet/engine.js',
  './quell/core/spreadsheet/csv.js',
  './quell/core/ai/kosten.js',
  './quell/core/ai/abrechnung.js',
  './quell/core/orb/geometry.js',
  './quell/core/orb/modes.js',
  './quell/core/jobs/modell.js',
  './quell/core/jobs/zeitplan.js',
  './quell/core/jobs/estimate.js',
  './quell/kern/auftraege/maschine.js',
  './quell/core/knowledge/rank.js',
  './quell/core/knowledge/gaps.js',
  './quell/core/learning/kompetenz.js',
  './quell/core/learning/fsrs.js',
  './quell/core/learning/lerntempo.js',
  './quell/core/learning/belege.js',
  './quell/core/calendar/wiederholung.js',
  './quell/core/calendar/zeitzone.js',
  './quell/core/slides/folien.js',
  './quell/core/planning/budget.js',
  './quell/core/text/inline.js',
  './quell/core/import/sicherheit.js',
  './quell/core/import/vergleich.js',
  './quell/core/import/validierung.js',
  './quell/core/import/spaltentyp.js',
  './quell/core/import/zipdetails.js',
  './quell/kern/sicherheit/pruefen.js',
  './quell/kern/ablage/formen.js',
  './quell/kern/ablage/umzuege.js',
  /* Die Zeichen zuerst — Navigation und Schale zeichnen als erstes damit.
     Fehlte die Zeile, kam die Datei offline nicht aus dem Vorrat, der
     Arbeiter antwortete mit 504, und `Register.symbole` blieb undefiniert:
     eine Seitenleiste ohne Zeichen, nur ohne Netz (test143). */
  './quell/register/symbole.js',
  './quell/register/module.js',
  './quell/register/navigation.js',
  './quell/register/bloecke.js',
  './quell/register/textstile.js',
  './quell/register/eigenschaften.js',
  './quell/register/ansichten.js',
  './quell/register/befehle.js',
  './quell/register/menueband.js',
  './quell/register/tasten.js',
  './quell/register/einstellungen.js',
  './quell/register/formeln.js',
  './quell/register/vorlagen.js',
  './quell/register/verbindungen.js',
  './quell/register/context.js',
  './quell/register/fachzeichen.js',
  './quell/register/elektroformeln.js',
  './quell/schale/ueberlagerung/menue.js',
  './quell/schale/ueberlagerung/sheet.js',
  './quell/schale/ueberlagerung/hinweis.js',
  './quell/schale/ueberlagerung/orb.js',
  './quell/schale/bedienung/segment.js',
  './quell/schale/bedienung/baum.js',
  './quell/schale/bedienung/zustand.js',
  './quell/schale/bedienung/zustandsknopf.js',
  './quell/schale/bedienung/drucker.js',
  './quell/schale/bedienung/ordnerkarte.js',
  './quell/schale/bedienung/merkzeichen.js',
  './quell/schale/bedienung/lader.js',
  './quell/schale/bedienung/linse.js',
  './quell/schale/bedienung/selection-flow.js',
  './quell/schale/bedienung/textur.js',
  './quell/schale/bedienung/staffelei.js',
  './quell/schale/bedienung/geste.js',
  './quell/schale/bedienung/funkel.js',
  './quell/schale/bedienung/motion.js',
  './quell/schale/aufbau/studio.js',
  './quell/schale/ueberlagerung/dialog.js',
  './quell/schale/ueberlagerung/fokus.js',
  './quell/schale/ueberlagerung/ui.js',
  './quell/schale/ueberlagerung/auftraege.js',
  './quell/kern/ablage/nachbarn.js',
  './quell/kern/ablage/indexdb.js',
  './quell/kern/suche/query.js',
  './quell/bereiche/datenbanken/formeln/laufzeit.js',
  './quell/bereiche/wissen/verweise.js',
  './quell/bereiche/wissen/luecken.js',
  './quell/bereiche/bloecke/arten/zeichenflaeche.js',
  './quell/bereiche/bloecke/arten/gedankenkarte.js',
  './quell/fremd/pdfjs/daten.js',
  './quell/fremd/pdfjs/laden.js',
  './quell/bereiche/pdf/ink-menu.js',
  './quell/bereiche/pdf/ink-ruler.js',
  './quell/bereiche/pdf/marken.js',
  './quell/bereiche/pdf/leser.js',
  './quell/bereiche/pdf/seite.js',
  './quell/bereiche/pdf/einlesen.js',
  './quell/bereiche/bloecke/arten/blatt.js',
  './quell/bereiche/elektro/simulation.js',
  './quell/bereiche/bloecke/arten/schaltplan.js',
  './quell/bereiche/bloecke/arten/planflaeche.js',
  './quell/bereiche/chronik/daten.js',
  './quell/bereiche/chronik/laden.js',
  './quell/bereiche/chronik/chronik.js',
  './quell/bereiche/elektro/formelheft.js',
  './quell/bereiche/elektro/aufgaben.js',
  './quell/bereiche/elektro/arbeitsplatz.js',
  './quell/bereiche/elektro/lernbilder.js',
  './quell/bereiche/elektro/skizzen.js',
  /* DIE ELEKTRO-STARTSEITE (E238). Sie muss hier stehen, sonst fehlt sie
     offline — und „Elektro" wäre der einzige der fünf Wege, der ohne Netz
     ins Leere führt (§28). Gefunden hat das der Prüflauf, der index.html
     gegen diese Liste hält; von Hand hätte ich es vergessen. */
  './quell/bereiche/elektro/start.js',
  './quell/bereiche/pdf/document-mode.js',
  './quell/bereiche/spreadsheet/ansicht.js',
  './quell/bereiche/datenbanken/raster.js',
  './quell/bereiche/editor/ansicht/editor.js',
  './quell/bereiche/datenbanken/dienst.js',
  './quell/bereiche/datenbanken/steuerung.js',
  './quell/bereiche/wissen/dienst.js',
  './quell/bereiche/wissen/werkzeuge.js',
  './quell/bereiche/wissen/learning.js',
  './quell/kern/zustand/verlauf.js',
  './quell/bereiche/editor/ansicht/auswahlleiste.js',
  './quell/bereiche/erwaehnungen/ansicht/menue.js',
  './quell/bereiche/kommentare/ansicht/faden.js',
  './quell/bereiche/editor/mehrfach.js',
  './quell/bereiche/datenbanken/ansichten/dienst.js',
  './quell/bereiche/einstellungen/ansicht/seite.js',
  './quell/bereiche/dateien/einlesen.js',
  './quell/bereiche/dateien/archiveImport.js',
  './quell/kern/zugang/sitzung.js',
  './quell/bereiche/verbinden/konten.js',
  './quell/bereiche/verbinden/kalender.js',
  './quell/bereiche/datenbanken/spiegel/dienst.js',
  './quell/bereiche/verbinden/mail.js',
  './quell/bereiche/verbinden/clipper.js',
  './quell/bereiche/ki/buch.js',
  './quell/bereiche/ki/kontext.js',
  './quell/bereiche/ki/agenten.js',
  './quell/bereiche/verbinden/besprechung.js',
  './quell/bereiche/ki/werkzeuge.js',
  './quell/bereiche/einstellungen/pwa.js',
  './quell/bereiche/vorlagen/daten.js',
  './quell/bereiche/vorlagen/folien.js',
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
  './quell/kern/helfer/ablage.js',
  './quell/kern/helfer/rollrand.js',
  /* Die Seitenvorschau (E207). Sie hängt an KEINEM Bereich — Lernwelt und
     Bibliothek zeichnen beide damit. Fehlte die Zeile, käme sie offline
     nicht aus dem Vorrat, `Vorschau` bliebe undefiniert, und beide Ansichten
     hätten leere Karten: derselbe Fehler wie bei `symbole.js` in test143,
     nur an zwei Stellen gleichzeitig. */
  './quell/kern/helfer/vorschau.js',
  './quell/kern/helfer/sicherung.js',
  './quell/kern/helfer/ordnersicherung.js',
  './quell/kern/helfer/zeichenziel.js',
  './quell/bereiche/planen/dienst.js',
  './quell/bereiche/einstellungen/erweiterungen.js',
  './quell/bereiche/verbinden/eingang.js',
  './quell/bereiche/hilfe/rundgang.js',
  './quell/bereiche/dateien/format.js',
  './quell/bereiche/verbinden/schnittstelle.js',
  './quell/kern/ablage/befehle.js',
  './quell/kern/ereignisse/protokoll.js',
  './quell/bereiche/dateien/ablage.js',
  './quell/bereiche/dateien/recognition.js',
  './lernpakete/babat-red-elektrofragen-1.0.0.json',
  './quell/bereiche/wissen/electrical.js',
  './quell/kern/abgleich/zusammenfuehren.js',
  './quell/kern/zugang/rechte.js',
  './quell/kern/zugang/lesefrage.js',
  './quell/bereiche/datenbanken/probelauf/dienst.js',
  './quell/bereiche/datenbanken/whatif.js',
  './quell/bereiche/datenbanken/cleanup.js',
  './quell/bereiche/datenbanken/pruefsaetze/dienst.js',
  './quell/bereiche/vorlagen/dienst.js',
  './quell/bereiche/datenbanken/vorrat/dienst.js',
  './quell/kern/abgleich/maschine.js',
  './quell/bereiche/verbinden/ansicht/wolke.js',
  './quell/bereiche/wissen/bibliothek.js',
  './quell/bereiche/wissen/lebensbereiche.js',
  './quell/bereiche/wissen/lernwelt.js',
  './quell/bereiche/wissen/notebook.js',
  './quell/bereiche/wissen/zeitmesser.js',
  './quell/bereiche/wissen/arbeitswelt.js',
  './quell/bereiche/wissen/produktwelten.js',
  './quell/bereiche/ki/dienst.js',
  './quell/schale/aufbau/ruhig.js',
  './quell/schale/aufbau/seitenleiste.js',
  './quell/schale/aufbau/kopfleiste.js',
  './quell/schale/aufbau/menueband.js',
  './quell/schale/aufbau/backstage.js',
  './quell/schale/aufbau/context-rail.js',
  './quell/schale/aufbau/inhaltsflaeche.js',
  './quell/schale/aufbau/wischen.js',
  './quell/schale/aufbau/schale.js',
  './quell/start.js',
  './quell/schale/stil/marken.css',
  './quell/schale/stil/dunkel.css',
  './quell/schale/stil/hell.css',
  './quell/schale/stil/grund.css',
  './quell/schale/stil/aufbau.css',
  './quell/schale/stil/anatomie.css',
  /* `anatomie.css` holt dieses Blatt über `@import` — und ein Import ist
     eine EIGENE Netzanfrage. Ohne diese Zeile fehlte die ganze ruhige
     Schale, sobald jemand offline ist: die Datei stand im Ordner, sie war
     verlinkt, und trotzdem kam sie nicht an. Gefunden beim Zusammenführen
     von PR #46 (E271). */
  './quell/schale/stil/premium.css',
  './quell/schale/stil/studio.css',
  './quell/schale/stil/bibliothek-studio.css',
  './quell/schale/stil/pdf-studio.css',
  './quell/schale/stil/datenbanken.css',
  './quell/schale/stil/ki.css',
  './quell/schale/stil/werkzeuge.css',
  './quell/schale/stil/ansichten.css',
  './quell/schale/stil/einstellungen.css',
  './quell/schale/stil/tabelle.css',
  './quell/schale/stil/bausteine.css',
  './quell/schale/stil/motion.css',
  './quell/schale/stil/produktwelten.css',
  './quell/schale/stil/arbeitswelt.css',
  './quell/schale/stil/lernwelt.css',
  './quell/schale/stil/notizhefte.css',
  './oeffentlich/manifest.webmanifest',
  './oeffentlich/favicon.ico',
  './oeffentlich/icons/icon-180.png',
  './oeffentlich/icons/icon-192.png',
  './oeffentlich/icons/icon-512.png',
  './oeffentlich/icons/favicon-32.png',
  './oeffentlich/icons/maskable-192.png'
];

ich.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(ABLAGE);
    /* Einzeln, damit eine fehlende Datei nicht alles scheitern lässt — aber
       nicht lautlos. Vorher stand hier `.catch(() => {})`, und damit war eine
       halb abgelegte App von einer ganzen nicht zu unterscheiden. */
    const misslungen: string[] = [];
    await Promise.all(GRUNDSTOCK.map(u =>
      c.add(new Request(u, { cache: 'reload' })).catch(() => misslungen.push(u))));
    if (misslungen.length) {
      console.warn('[sw] ' + misslungen.length + ' von ' + GRUNDSTOCK.length +
        ' Dateien liessen sich nicht ablegen — offline fehlen sie:\n  ' +
        misslungen.join('\n  '));
    }
    ich.skipWaiting();
  })());
});

ich.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const namen = await caches.keys();
    await Promise.all(namen.filter(n => n !== ABLAGE).map(n => caches.delete(n)));
    await ich.clients.claim();
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
type Ergebnis = { status: number; body: unknown };

const alsAntwort = (erg: Ergebnis) => new Response(JSON.stringify(erg.body), {
  status: erg.status,
  headers: { 'Content-Type': 'application/json; charset=utf-8',
             'Cache-Control': 'no-store' }
});

const beimFenster = async (anfrage: Request) => {
  const kunden = await ich.clients.matchAll({ type: 'window', includeUncontrolled: true });
  if (!kunden.length) {
    return alsAntwort({ status: 503, body: { object: 'error', status: 503,
      code: 'service_unavailable',
      message: 'Redion ist in keinem Fenster offen. Die Daten liegen dort, ' +
               'nicht auf einem Server — ohne offenes Fenster gibt es nichts zu lesen.' } });
  }
  const u = new URL(anfrage.url);
  let koerper: unknown = {};
  if (anfrage.method !== 'GET' && anfrage.method !== 'DELETE') {
    try { koerper = JSON.parse(await anfrage.clone().text() || '{}'); } catch { koerper = {}; }
  }
  const kopf: Record<string, string> = {};
  anfrage.headers.forEach((v: string, k: string) => { kopf[k.toLowerCase()] = v; });

  /* Das erste Fenster antwortet stellvertretend für alle. Dass es eines
     gibt, steht oben — `kunden.length` war die Bedingung dafür, überhaupt
     hierherzukommen. Der Übersetzer sieht diesen Zusammenhang nicht über
     zehn Zeilen hinweg; deshalb steht die Frage hier noch einmal, statt
     eines Ausrufezeichens, das nur behauptet. */
  const fenster = kunden[0];
  if (!fenster) return alsAntwort({ status: 503, body: { object: 'error', status: 503,
    code: 'service_unavailable', message: 'Kein Fenster mehr offen.' } });

  const erg = await new Promise<Ergebnis>((fertig) => {
    const kanal = new MessageChannel();
    const uhr = setTimeout(() => fertig({ status: 504, body: { object: 'error', status: 504,
      code: 'gateway_timeout', message: 'Das Fenster hat nicht geantwortet.' } }), 5000);
    kanal.port1.onmessage = (ev: MessageEvent) => { clearTimeout(uhr); fertig(ev.data); };
    fenster.postMessage({ art: 'api-anfrage', methode: anfrage.method,
                          pfad: u.pathname, koerper, kopf }, [kanal.port2]);
  });
  return alsAntwort(erg);
};

/* ===========================================================================
 * EINE UMGELEITETE ANTWORT DARF NICHT AUS DEM DIENST-SKRIPT KOMMEN
 * ---------------------------------------------------------------------------
 * GEMELDET VOM IPHONE (7. August 2026), und die App startete gar nicht:
 *
 *     Safari kann die Seite nicht öffnen.
 *     Fehler: „Response served by service worker has redirections"
 *
 * WebKit verbietet das strikt: Beantwortet ein Dienst-Skript eine
 * SEITENNAVIGATION mit einer Antwort, die durch eine Umleitung entstanden
 * ist (`response.redirected`), bricht Safari ab. Kein Inhalt, keine App,
 * eine Meldung, die nicht sagt, woher sie kommt.
 *
 * WIE ES DAZU KAM. Im Manifest stand `start_url: "/index.html"`. Cloudflare
 * beantwortet diesen Weg mit einer Umleitung auf `/` — beim Aufruf im
 * Browser fällt das nicht auf, weil der Browser ihr einfach folgt. Die
 * installierte App startet aber GENAU auf `start_url`, die Anfrage läuft
 * durch dieses Dienst-Skript, und die umgeleitete Antwort ging ungeprüft
 * hinaus. Das Manifest zeigt jetzt auf `/`, wo es nichts umzuleiten gibt.
 *
 * DIESE FUNKTION BLEIBT TROTZDEM, und das ist der Punkt: sie hängt nicht
 * davon ab, dass ein Server sich wohlverhält. Jede Umleitung irgendeines
 * Anbieters — ein Wechsel auf HTTPS, ein Schrägstrich zu viel, eine
 * Anmeldeschleife — träfe sonst wieder die ganze App. Die Antwort wird
 * neu zusammengesetzt: derselbe Inhalt, dieselben Kopfzeilen, nur ohne
 * die Marke „umgeleitet".
 *
 * Nur für Navigationen. Bei Skripten und Bildern stört die Marke nicht,
 * und ein unnötiges Umkopieren des Körpers kostet Speicher.
 * =========================================================================*/
const ohneUmleitung = (anfrage: Request, antwort: Response): Response => {
  if (anfrage.mode !== 'navigate' || !antwort.redirected) return antwort;
  return new Response(antwort.body, {
    status: antwort.status,
    statusText: antwort.statusText,
    headers: antwort.headers
  });
};

ich.addEventListener('fetch', (e) => {
  const anfrage = e.request;
  const u0 = new URL(anfrage.url);

  /* /v1/ und Notions interne /api/v3/ zuerst — auch POST, PATCH und DELETE.
     /api/bruecke bleibt aussen vor: die gehört dem Server. */
  if (u0.origin === ich.location.origin &&
      (/^\/v1\//.test(u0.pathname) || /^\/api\/v3\//.test(u0.pathname))) {
    e.respondWith(beimFenster(anfrage));
    return;
  }

  if (anfrage.method !== 'GET') return;

  const u = u0;

  /* Fremdes bleibt draussen — besonders alles, was einen Schlüssel trägt. */
  if (u.origin !== ich.location.origin) return;
  if (u.pathname.startsWith('/api/')) return;

  e.respondWith((async () => {
    const c = await caches.open(ABLAGE);
    const gemerkt = await c.match(anfrage, { ignoreSearch: false });

    const netz = fetch(anfrage).then(a => {
      if (a && a.ok && a.type === 'basic') c.put(anfrage, a.clone()).catch(() => {});
      return a;
    }).catch(() => null);

    /* Sofort ausliefern, was da ist; im Hintergrund neu holen. */
    if (gemerkt) { e.waitUntil(netz); return ohneUmleitung(anfrage, gemerkt); }

    const frisch = await netz;
    if (frisch) return ohneUmleitung(anfrage, frisch);

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
ich.addEventListener('message', (e) => {
  if (e.data === 'aktualisieren') ich.skipWaiting();
});

/* ===========================================================================
 * EIN TIPP AUF DIE ERINNERUNG FÜHRT ZUR SEITE
 * ---------------------------------------------------------------------------
 * WARUM DAS HIER STEHT UND NICHT IN DER APP. Erinnerungen werden seit dem
 * 7. August über `registration.showNotification()` gezeigt und nicht mehr
 * über `new Notification()`. Der Grund ist das iPhone: dort kennt eine
 * installierte Web-App den Konstruktor `Notification` gar nicht, er wirft
 * `Illegal constructor` — und in Redion stand dieser Aufruf in einem
 * `try/catch`, das den Fehler verschluckte. Auf dem Telefon erschien also
 * der Hinweis in der App und **sonst nichts**, ohne dass irgendwo stand,
 * warum. Genau die Funktion, um die Redur gebeten hatte.
 *
 * Eine so gezeigte Meldung gehört aber dem Dienst-Skript, nicht der Seite.
 * `notification.onclick` in der App greift bei ihr nicht mehr; der Tipp
 * kommt hier an. Ohne diesen Zweig öffnet ein Tipp gar nichts.
 *
 * Der Weg zur Seite läuft über den Hash, weil Redion Seiten so öffnet
 * (`App.oeffne` schreibt die Kennung dorthin). Ein schon offenes Fenster
 * wird nach vorn geholt, statt ein zweites aufzumachen — zwei Redions
 * nebeneinander wären der Anfang jedes Mehr-Tab-Problems (§16).
 * =========================================================================*/
ich.addEventListener('notificationclick', (e) => {
  const meldung = (e as any).notification;
  meldung.close();
  const seite = (meldung.data && meldung.data.seite) || '';
  const ziel = seite ? './#' + seite : './';

  e.waitUntil((async () => {
    const fenster = await (ich as any).clients.matchAll(
      { type: 'window', includeUncontrolled: true });
    for (const f of fenster) {
      /* Dasselbe Redion, das schon offen ist — nach vorn holen und dorthin
         schicken. `navigate` kann fehlschlagen, wenn das Fenster einer
         anderen Herkunft gehört; dann bleibt wenigstens der Fokus. */
      if (f.url.indexOf(ich.registration.scope) === 0) {
        try { if (seite) await f.navigate(ziel); } catch { /* dann eben nur Fokus */ }
        return f.focus();
      }
    }
    return (ich as any).clients.openWindow(ziel);
  })());
});

/* ==========================================================================
 * DER STOSS VON AUSSEN — Web Push (L33, E54)
 * --------------------------------------------------------------------------
 * ER TRÄGT NICHTS, und das ist der ganze Entwurf. Ein Web Push kann Inhalt
 * mitbringen; Redions Server schickt keinen. Der Text einer Erinnerung geht
 * ihn nichts an — „Zahnarzt 14:00" ist genau die Sorte Satz, die
 * local-first schützen soll.
 *
 * Der Stoss sagt also nur „wach auf". Was fällig ist, steht hier auf dem
 * Gerät, in derselben IndexedDB, aus der es auch die App liest.
 *
 * WARUM DIE DATENBANK HIER NOCH EINMAL GEÖFFNET WIRD, statt sie von der
 * App zu erben: das Dienst-Skript läuft, WENN die App nicht läuft. Genau
 * dafür gibt es diesen Weg. Es gibt also nichts zu erben.
 *
 * `openWithoutUpgrade`: die Version wird NICHT gesetzt. Ein Dienst-Skript,
 * das die Datenbank hochzieht, während in einem anderen Tab die App darauf
 * arbeitet, ist ein Umbau am fahrenden Zug. Ohne Versionsangabe öffnet der
 * Browser, was da ist — und wenn es die Datenbank noch gar nicht gibt,
 * gibt es auch nichts zu melden.
 * ========================================================================*/

/** Die fälligen, noch nicht erledigten Erinnerungen — direkt aus der Ablage. */
const faelligeErinnerungen = (): Promise<any[]> => new Promise((fertig) => {
  let raus: any[] = [];
  let req: IDBOpenDBRequest;
  /* DER NAME STEHT HIER EIN ZWEITES MAL, und das ist nicht zu ändern:
     `KONSTANTEN.ABLAGE_NAME` wohnt in `quell/kern/einstellung/konstanten.js`
     und schreibt sich an `window`. Ein Dienstarbeiter hat kein `window` und
     lädt diese Datei nicht — er ist ein eigenes Bündel (`tsconfig.sw.json`).
     Also zwei Zeichenketten, notgedrungen. Wie bei der Dateigrenze zwischen
     Gerät und Server (E67) rechnet ein Prüflauf sie nach: `test143` liest
     beide Quelltexte und vergleicht. Ein falscher Name hier heisst nicht
     „Fehler", sondern „keine Erinnerungen" — und das fällt niemandem auf. */
  try { req = indexedDB.open(ABLAGE_NAME); } catch { fertig([]); return; }
  /* Eine Datenbank, die es nicht gibt, wird hier NICHT angelegt: `onupgradeneeded`
     bedeutet dann „leer, ohne Fächer" — abbrechen statt eine leere Hülle
     zu hinterlassen, in der die App später ihre Umzüge nicht mehr findet. */
  req.onupgradeneeded = () => { try { req.transaction?.abort(); } catch { } };
  req.onerror = () => fertig([]);
  req.onsuccess = () => {
    const db = req.result;
    if (!db.objectStoreNames.contains('meta')) { db.close(); fertig([]); return; }
    let g: IDBRequest;
    try { g = db.transaction('meta', 'readonly').objectStore('meta').get('erinnerungen'); }
    catch { db.close(); fertig([]); return; }
    g.onerror = () => { db.close(); fertig([]); };
    g.onsuccess = () => {
      const liste = (g.result && g.result.v) || [];
      const jetzt = Date.now();
      raus = (Array.isArray(liste) ? liste : []).filter((e: any) =>
        e && !e.erledigt && e.zeit && new Date(e.zeit).getTime() <= jetzt);
      db.close();
      fertig(raus);
    };
  };
});

ich.addEventListener('push', (e) => {
  e.waitUntil((async () => {
    const faellig = await faelligeErinnerungen();

    /* EIN STOSS OHNE MELDUNG IST KEINE OPTION. Zeigt ein Dienst-Skript auf
       einen Push hin gar nichts, blendet der Browser von sich aus „Diese
       Seite wurde im Hintergrund aktualisiert" ein — eine Meldung, die
       niemand geschrieben hat und die nichts sagt. Lieber ein ehrlicher
       Satz: es gab einen Weckruf, und hier steht, was daran war. */
    if (!faellig.length) {
      return ich.registration.showNotification('Redion', {
        body: 'Ein Weckruf kam an, aber es ist gerade nichts fällig. ' +
              'Vielleicht wurde die Erinnerung schon auf einem anderen Gerät erledigt.',
        icon: './oeffentlich/icons/icon-180.png',
        tag: 'redion-leer'
      } as NotificationOptions);
    }

    for (const er of faellig) {
      const gemeint = new Date(er.zeit);
      const spaet = Date.now() - gemeint.getTime() > 120000;
      const wann = gemeint.toLocaleTimeString('de-DE',
        { hour: '2-digit', minute: '2-digit' });
      await ich.registration.showNotification(
        spaet ? 'Verpasst um ' + wann : 'Erinnerung: ' + (er.text || 'Redion'),
        {
          body: spaet ? (er.text || '') : 'In Redion',
          icon: './oeffentlich/icons/icon-180.png',
          /* `tag` je Erinnerung: derselbe Weckruf zweimal ersetzt die
             Meldung, statt eine zweite danebenzulegen. */
          tag: 'redion-' + (er.id || 'erinnerung'),
          data: { seite: er.pageId || '' }
        } as NotificationOptions);
    }
    return undefined;
  })());
});
