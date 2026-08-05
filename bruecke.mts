/* ============================================================================
 * bruecke.mts — Die Bruecke
 * ----------------------------------------------------------------------------
 * Manche Dienste lassen den Browser nicht direkt heran: iCloud, Jira, viele
 * Kalenderadressen. Der Grund ist eine Schutzregel des Browsers (CORS), die
 * der Dienst aufheben muesste - was er nicht tut.
 *
 * Dieser kleine Server holt die Adresse stellvertretend und gibt sie mit der
 * fehlenden Erlaubnis zurueck. Er laeuft auf deinem Rechner, spricht mit
 * niemandem sonst und speichert nichts.
 *
 *   Starten:   node bruecke.mts
 *   Eintragen: Einstellungen -> Verbindungen -> Bruecke
 *              http://localhost:8081/hol?ziel={url}
 *
 * Nur Adressen, die hier in der Liste stehen, werden geholt. Wer mehr
 * braucht, traegt sie unten ein.
 * ==========================================================================*/

import http from 'node:http';
import https from 'node:https';
import type { IncomingMessage, ServerResponse } from 'node:http';

const PORT = 8081;

/* Nur diese Gegenstellen sind erlaubt. Das verhindert, dass die Bruecke
   zum offenen Tor wird, falls sie jemals nach draussen zeigt. */
const ERLAUBT = [
  'calendar.google.com', 'www.google.com', 'www.googleapis.com',
  'p01-calendars.icloud.com', 'p02-calendars.icloud.com', 'p03-calendars.icloud.com',
  'caldav.icloud.com', 'outlook.office365.com', 'outlook.live.com',
  '.atlassian.net', '.ics', 'api.github.com'
];

const passt = (host: string): boolean => ERLAUBT.some(e =>
  e.startsWith('.') ? host.endsWith(e) : host === e);

http.createServer((req: IncomingMessage, res: ServerResponse) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Expose-Headers', 'Retry-After');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  let ziel: URL;
  try {
    const u = new URL(req.url ?? '/', 'http://localhost');
    /* Ohne `?ziel=` stand hier `new URL(null)`. Das wirft, und der Fang
       darunter fing es — aber mit der Zeichenkette „null" als Adresse
       gerechnet zu haben, war nie gemeint. */
    ziel = new URL(u.searchParams.get('ziel') ?? '');
  } catch {
    res.writeHead(400); res.end('Keine gueltige Zieladresse'); return;
  }
  if (!passt(ziel.hostname) && !ziel.pathname.endsWith('.ics')) {
    res.writeHead(403); res.end('Diese Gegenstelle steht nicht in der Liste'); return;
  }

  const kopf: Record<string, string> = {};
  if (req.headers.authorization) kopf['authorization'] = req.headers.authorization;
  const art = req.headers['content-type'];
  if (art) kopf['content-type'] = art;

  const anfrage = (ziel.protocol === 'http:' ? http : https).request(
    ziel, { method: req.method, headers: kopf }, (antwort: IncomingMessage) => {
      /* Ohne Statuszeile ist die Gegenstelle nicht durchgekommen. 502 sagt
         das; `writeHead(undefined)` warf hier vorher mitten im Weiterreichen. */
      res.writeHead(antwort.statusCode ?? 502, {
        'Content-Type': String(antwort.headers['content-type'] || 'text/plain'),
        'Access-Control-Allow-Origin': '*'
      });
      antwort.pipe(res);
    });
  anfrage.on('error', (e: Error) => { res.writeHead(502); res.end('Bruecke: ' + e.message); });
  req.pipe(anfrage);
}).listen(PORT, () => {
  console.log('Bruecke laeuft auf http://localhost:' + PORT);
  console.log('In den Einstellungen eintragen: http://localhost:' + PORT + '/hol?ziel={url}');
});
