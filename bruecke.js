/* ============================================================================
 * bruecke.js — Die Bruecke
 * ----------------------------------------------------------------------------
 * Manche Dienste lassen den Browser nicht direkt heran: iCloud, Jira, viele
 * Kalenderadressen. Der Grund ist eine Schutzregel des Browsers (CORS), die
 * der Dienst aufheben muesste - was er nicht tut.
 *
 * Dieser kleine Server holt die Adresse stellvertretend und gibt sie mit der
 * fehlenden Erlaubnis zurueck. Er laeuft auf deinem Rechner, spricht mit
 * niemandem sonst und speichert nichts.
 *
 *   Starten:   node bruecke.js
 *   Eintragen: Einstellungen -> Verbindungen -> Bruecke
 *              http://localhost:8081/hol?ziel={url}
 *
 * Nur Adressen, die hier in der Liste stehen, werden geholt. Wer mehr
 * braucht, traegt sie unten ein.
 * ==========================================================================*/

const http = require('http');
const https = require('https');
const { URL } = require('url');

const PORT = 8081;

/* Nur diese Gegenstellen sind erlaubt. Das verhindert, dass die Bruecke
   zum offenen Tor wird, falls sie jemals nach draussen zeigt. */
const ERLAUBT = [
  'calendar.google.com', 'www.google.com', 'www.googleapis.com',
  'p01-calendars.icloud.com', 'p02-calendars.icloud.com', 'p03-calendars.icloud.com',
  'caldav.icloud.com', 'outlook.office365.com', 'outlook.live.com',
  '.atlassian.net', '.ics', 'api.github.com'
];

const passt = (host) => ERLAUBT.some(e =>
  e.startsWith('.') ? host.endsWith(e) : host === e);

http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Expose-Headers', 'Retry-After');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  let ziel;
  try {
    const u = new URL(req.url, 'http://localhost');
    ziel = new URL(u.searchParams.get('ziel'));
  } catch {
    res.writeHead(400); res.end('Keine gueltige Zieladresse'); return;
  }
  if (!passt(ziel.hostname) && !ziel.pathname.endsWith('.ics')) {
    res.writeHead(403); res.end('Diese Gegenstelle steht nicht in der Liste'); return;
  }

  const kopf = {};
  if (req.headers.authorization) kopf.authorization = req.headers.authorization;
  if (req.headers['content-type']) kopf['content-type'] = req.headers['content-type'];

  const anfrage = (ziel.protocol === 'http:' ? http : https).request(
    ziel, { method: req.method, headers: kopf }, (antwort) => {
      res.writeHead(antwort.statusCode, {
        'Content-Type': antwort.headers['content-type'] || 'text/plain',
        'Access-Control-Allow-Origin': '*'
      });
      antwort.pipe(res);
    });
  anfrage.on('error', (e) => { res.writeHead(502); res.end('Bruecke: ' + e.message); });
  req.pipe(anfrage);
}).listen(PORT, () => {
  console.log('Bruecke laeuft auf http://localhost:' + PORT);
  console.log('In den Einstellungen eintragen: http://localhost:' + PORT + '/hol?ziel={url}');
});
