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


/** Kein offener Proxy: nur ausdrücklich benannte HTTPS-Gegenstellen. */
const passt = (host: string): boolean =>
  ERLAUBT.some(e => e.startsWith('.') ? host.endsWith(e) && host.length > e.length : host === e);

const MAX_EINGANG = 1024 * 1024;       // 1 MiB
const MAX_AUSGANG = 8 * 1024 * 1024;   // 8 MiB

const begrenztLesen = async (
  strom: ReadableStream<Uint8Array> | null, grenze: number
): Promise<Uint8Array | null> => {
  if (!strom) return new Uint8Array(0);
  const leser = strom.getReader();
  const stuecke: Uint8Array[] = [];
  let laenge = 0;
  try {
    while (true) {
      const { done, value } = await leser.read();
      if (done) break;
      laenge += value.byteLength;
      if (laenge > grenze) { await leser.cancel(); return null; }
      stuecke.push(value);
    }
  } finally { leser.releaseLock(); }
  const daten = new Uint8Array(laenge);
  let stelle = 0;
  for (const teil of stuecke) { daten.set(teil, stelle); stelle += teil.byteLength; }
  return daten;
};

const rueckKopf = (ursprung: string) => ({
  'Access-Control-Allow-Origin': ursprung,
  'Access-Control-Allow-Headers': 'Authorization, Content-Type, Accept, Mcp-Session-Id',
  'Access-Control-Allow-Methods': 'GET, HEAD, POST, PATCH, PUT, DELETE, OPTIONS',
  'Access-Control-Expose-Headers': 'Retry-After, Mcp-Session-Id',
  'Access-Control-Max-Age': '86400',
  'Vary': 'Origin',
  'Cache-Control': 'no-store'
});

export async function onRequest(context: { request: Request; env?: unknown; ctx?: unknown }) {
  const { request } = context;
  const eigeneAdresse = new URL(request.url).origin;
  const herkunft = request.headers.get('Origin');
  // Die Brücke ist ausschliesslich für Redions eigene Webseite bestimmt.
  // Bei fremder Origin keine Freigabe erteilen (auch nicht für OPTIONS).
  if (herkunft && herkunft !== eigeneAdresse)
    return new Response('Diese Herkunft ist nicht erlaubt.', { status: 403 });
  const kopfZurueck = () => rueckKopf(eigeneAdresse);

  if (request.method === 'OPTIONS')
    return new Response(null, { status: 204, headers: kopfZurueck() });

  let ziel: URL;
  try { ziel = new URL(new URL(request.url).searchParams.get('ziel') ?? ''); }
  catch {
    return new Response('Keine gültige Zieladresse.', { status: 400, headers: kopfZurueck() });
  }
  if (ziel.protocol !== 'https:' || ziel.username || ziel.password ||
      (ziel.port && ziel.port !== '443') || !passt(ziel.hostname)) {
    return new Response('Nur erlaubte HTTPS-Gegenstellen sind erreichbar.', {
      status: 403, headers: kopfZurueck()
    });
  }

  const art = request.headers.get('content-length');
  if (art && (!/^\\d+$/.test(art) || Number(art) > MAX_EINGANG))
    return new Response('Anfrage zu gross.', { status: 413, headers: kopfZurueck() });

  // Bereits beim Lesen begrenzen; Content-Length ist optional und nicht vertrauenswürdig.
  const eingang = ['GET', 'HEAD'].includes(request.method)
    ? new Uint8Array(0) : await begrenztLesen(request.body, MAX_EINGANG);
  if (!eingang) return new Response('Anfrage zu gross.', { status: 413, headers: kopfZurueck() });

  const kopf = new Headers();
  for (const name of ['authorization', 'content-type', 'accept', 'mcp-session-id']) {
    const wert = request.headers.get(name);
    if (wert) kopf.set(name, wert);
  }

  let antwort: Response;
  try {
    antwort = await fetch(ziel.toString(), {
      method: request.method, headers: kopf,
      body: ['GET', 'HEAD'].includes(request.method)
        ? null : (new Uint8Array(eingang).buffer as ArrayBuffer),
      redirect: 'manual'
    });
  } catch {
    return new Response('Gegenstelle nicht erreichbar.', { status: 502, headers: kopfZurueck() });
  }

  // Auch Weiterleitungen auf fremde Hosts dürfen nie automatisch verfolgt werden.
  if (antwort.status >= 300 && antwort.status < 400)
    return new Response('Weiterleitung von der Gegenstelle verweigert.', {
      status: 502, headers: kopfZurueck()
    });

  const länge = antwort.headers.get('content-length');
  if (länge && Number(länge) > MAX_AUSGANG)
    return new Response('Antwort der Gegenstelle zu gross.', {
      status: 502, headers: kopfZurueck()
    });

  const ausgang = await begrenztLesen(antwort.body, MAX_AUSGANG);
  if (!ausgang) return new Response('Antwort der Gegenstelle zu gross.', {
    status: 502, headers: kopfZurueck()
  });

  const raus = new Headers(kopfZurueck());
  for (const name of ['content-type', 'retry-after', 'mcp-session-id', 'last-modified', 'etag']) {
    const wert = antwort.headers.get(name);
    if (wert) raus.set(name, wert);
  }
  const body = request.method === 'HEAD' || antwort.status === 204
    ? null : (new Uint8Array(ausgang).buffer as ArrayBuffer);
  return new Response(body, { status: antwort.status, headers: raus });
}
