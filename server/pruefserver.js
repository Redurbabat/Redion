/* ==========================================================================
 * server/pruefserver.js — Derselbe Kern, aber auf diesem Rechner
 * --------------------------------------------------------------------------
 * Zum Prüfen und zum Ausprobieren. Startet einen gewöhnlichen HTTP-Server
 * mit dem Serverkern dahinter und der Ablage im Arbeitsspeicher.
 *
 *   node server/pruefserver.js            auf Port 8790
 *   node server/pruefserver.js 9000       auf Port 9000
 *
 * Wichtig: das ist kein Betriebsserver. Er speichert nichts über den
 * Neustart hinaus und hat keine Verschlüsselung auf der Leitung. Zum
 * Ausprobieren ist er richtig, für den Betrieb nimmt man Cloudflare.
 * ========================================================================*/

import http from 'node:http';
import { beantworte } from './kern.js';
import { ablageSpeicher } from './ablage.js';
import { koerperZuGross, zuGrossAntwort } from './sicherheit/eingaben.js';

export const starte = async (port = 8790, opt = {}) => {
  const ablage = opt.ablage || ablageSpeicher();
  await ablage.einrichten();

  const server = http.createServer(async (req, res) => {
    const u = new URL(req.url, 'http://' + (req.headers.host || 'localhost'));
    const kopf = {};
    Object.entries(req.headers).forEach(([k, v]) => { kopf[k.toLowerCase()] = String(v); });
    const suche = {};
    u.searchParams.forEach((v, k) => { suche[k] = v; });

    /* Dieselbe Tür wie bei Cloudflare, derselbe Riegel — sonst prüft der
       Prüfserver etwas anderes als der echte Server, und die Prüfläufe
       sagen nichts über den Ernstfall. */
    if (koerperZuGross(u.pathname, kopf['content-length'])) {
      const z = zuGrossAntwort(u.pathname);
      req.resume();                       /* den Rest wegwerfen, nicht lesen */
      res.writeHead(z.status, z.kopf);
      res.end(z.koerper);
      return;
    }

    let roh = '';
    for await (const stueck of req) roh += stueck;
    let koerper = {};
    if (roh) { try { koerper = JSON.parse(roh); } catch { koerper = { text: roh }; } }

    const umwelt = { ADRESSE: 'http://localhost:' + port,
                     holen: opt.holen || fetch, ...(opt.umwelt || {}) };

    let a;
    try {
      a = await beantworte({ methode: req.method, pfad: u.pathname, kopf, koerper, suche,
                             adresse: 'http://localhost:' + port }, ablage, umwelt);
    } catch (e) {
      a = { status: 500, kopf: { 'Content-Type': 'application/json' },
            koerper: JSON.stringify({ object: 'error', message: e.message }) };
    }
    res.writeHead(a.status, a.kopf);
    res.end(a.koerper);
  });

  await new Promise(r => server.listen(port, r));
  return { server, ablage, port, adresse: 'http://localhost:' + port,
           stopp: () => new Promise(r => server.close(r)) };
};

/* Direkt gestartet? Dann laufen lassen. */
if (import.meta.url === 'file://' + process.argv[1]) {
  const port = Number(process.argv[2]) || 8790;
  starte(port).then(s => {
    console.log('Redion-Server läuft auf ' + s.adresse);
    console.log('Lebenszeichen:  ' + s.adresse + '/api/stand');
    console.log('Zum Beenden: Strg+C');
  });
}
