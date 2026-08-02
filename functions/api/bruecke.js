/* ============================================================================
 * functions/api/bruecke.js — Die Brücke, aber auf Cloudflare
 * ----------------------------------------------------------------------------
 * Dasselbe wie bruecke.js für zu Hause, nur läuft es hier direkt neben der
 * Webseite. Damit brauchst du keinen eigenen Rechner mehr laufen zu lassen.
 *
 * Wozu das gut ist: manche Dienste — iCloud, Jira, viele Kalenderadressen —
 * lassen einen Browser nicht direkt heran. Diese Funktion holt die Adresse
 * stellvertretend und gibt sie mit der fehlenden Erlaubnis zurück.
 *
 * AUFRUF
 *   /api/bruecke?ziel=https://…
 *
 * WAS SIE NICHT TUT
 *   Sie speichert nichts, protokolliert nichts und spricht nur mit
 *   Gegenstellen, die unten in der Liste stehen. Ohne diese Liste wäre sie
 *   ein offenes Tor, das jeder für alles benutzen könnte.
 *
 * Cloudflare Pages findet diese Datei von selbst — allein durch den Ordner
 * „functions". Es ist nichts einzurichten.
 * ==========================================================================*/

/* Nur diese Gegenstellen werden geholt. Wer mehr braucht, trägt sie hier ein. */
const ERLAUBT = [
  'calendar.google.com',
  'www.google.com',
  'www.googleapis.com',
  'gmail.googleapis.com',
  'p01-calendars.icloud.com',
  'p02-calendars.icloud.com',
  'p03-calendars.icloud.com',
  'p04-calendars.icloud.com',
  'p05-calendars.icloud.com',
  'caldav.icloud.com',
  'outlook.office365.com',
  'outlook.live.com',
  'api.github.com',
  'nominatim.openstreetmap.org',
  'de.wikipedia.org',
  'en.wikipedia.org',
  '.atlassian.net',
  '.icloud.com'
];

const passt = (host, pfad) => {
  if (pfad.toLowerCase().endsWith('.ics')) return true;   /* Kalenderdateien immer */
  return ERLAUBT.some(e => e.startsWith('.') ? host.endsWith(e) : host === e);
};

const kopfZurueck = (herkunft) => ({
  'Access-Control-Allow-Origin': herkunft || '*',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type, Accept, Mcp-Session-Id',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
  'Access-Control-Expose-Headers': 'Retry-After, Mcp-Session-Id',
  'Access-Control-Max-Age': '86400'
});

export async function onRequest(context) {
  const { request } = context;
  const herkunft = request.headers.get('Origin') || '*';

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: kopfZurueck(herkunft) });
  }

  let ziel;
  try {
    ziel = new URL(new URL(request.url).searchParams.get('ziel'));
  } catch {
    return new Response('Keine gültige Zieladresse. Aufruf: /api/bruecke?ziel=https://…',
      { status: 400, headers: kopfZurueck(herkunft) });
  }

  if (ziel.protocol !== 'https:' && ziel.protocol !== 'http:') {
    return new Response('Nur http und https', { status: 400, headers: kopfZurueck(herkunft) });
  }
  if (!passt(ziel.hostname, ziel.pathname)) {
    return new Response('Diese Gegenstelle steht nicht in der Liste der Brücke.\n' +
      'Erlaubt sind: ' + ERLAUBT.join(', ') + '\nund alles, was auf .ics endet.',
      { status: 403, headers: kopfZurueck(herkunft) });
  }

  /* Nur das Nötigste weiterreichen — keine Kekse, keine Verweise. */
  const kopf = new Headers();
  const durch = ['authorization', 'content-type', 'accept', 'mcp-session-id'];
  durch.forEach(n => {
    const v = request.headers.get(n);
    if (v) kopf.set(n, v);
  });
  kopf.set('User-Agent', 'Notizen/1.0 (+Bruecke)');

  let antwort;
  try {
    antwort = await fetch(ziel.toString(), {
      method: request.method,
      headers: kopf,
      body: ['GET', 'HEAD'].includes(request.method) ? undefined : await request.arrayBuffer(),
      redirect: 'follow'
    });
  } catch (e) {
    return new Response('Die Brücke kam nicht durch: ' + e.message,
      { status: 502, headers: kopfZurueck(herkunft) });
  }

  const raus = new Headers(kopfZurueck(herkunft));
  const behalten = ['content-type', 'retry-after', 'mcp-session-id', 'last-modified', 'etag'];
  behalten.forEach(n => {
    const v = antwort.headers.get(n);
    if (v) raus.set(n, v);
  });

  return new Response(antwort.body, { status: antwort.status, headers: raus });
}
