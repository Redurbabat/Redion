/* ==========================================================================
 * server/pruefserver.ts — Derselbe Kern, aber auf diesem Rechner
 * --------------------------------------------------------------------------
 * Zum Prüfen und zum Ausprobieren. Startet einen gewöhnlichen HTTP-Server
 * mit dem Serverkern dahinter und der Ablage im Arbeitsspeicher.
 *
 *   node server/pruefserver.ts            auf Port 8790
 *   node server/pruefserver.js 9000       auf Port 9000
 *
 * Wichtig: das ist kein Betriebsserver. Er speichert nichts über den
 * Neustart hinaus und hat keine Verschlüsselung auf der Leitung. Zum
 * Ausprobieren ist er richtig, für den Betrieb nimmt man Cloudflare.
 * ========================================================================*/

import http from 'node:http';
import { beantworte } from './kern.ts';
import { ablageSpeicher, blobsSpeicher } from './ablage.ts';
import { koerperZuGross, zuGrossAntwort } from './sicherheit/eingaben.ts';
import type { Ablage, Antwort, Blobs, Kopfzeilen, Umwelt } from './typen.ts';

/** Was ein Prüflauf beim Starten mitgeben kann: eine eigene Ablage (etwa eine
 *  vorgefüllte), eine eigene Blob-Ablage, ein eigenes `holen` statt echter
 *  Netzzugriffe, und weitere Einstellungen für den Kern. */
type StartOpt = { ablage?: Ablage; blobs?: Blobs; holen?: typeof fetch; umwelt?: Umwelt };

export const starte = async (port = 8790, opt: StartOpt = {}) => {
  const ablage: Ablage = opt.ablage || ablageSpeicher();
  /* EINMAL angelegt, nicht je Anfrage — sonst vergisst der Speicher die
     Stücke zwischen Hochladen und Holen. */
  const blobs: Blobs = opt.blobs || blobsSpeicher();
  await ablage.einrichten();

  const server = http.createServer(async (req, res) => {
    const u = new URL(req.url ?? '/', 'http://' + (req.headers.host || 'localhost'));
    const kopf: Kopfzeilen = {};
    Object.entries(req.headers).forEach(([k, v]) => { kopf[k.toLowerCase()] = String(v); });
    const suche: Record<string, string> = {};
    u.searchParams.forEach((v, k) => { suche[k] = v; });

    /* Dieselbe Tür wie bei Cloudflare, derselbe Riegel — sonst prüft der
       Prüfserver etwas anderes als der echte Server, und die Prüfläufe
       sagen nichts über den Ernstfall. */
    if (koerperZuGross(u.pathname, kopf['content-length'] ?? null)) {
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

    const umwelt: Umwelt = { ADRESSE: 'http://localhost:' + port,
                             holen: opt.holen || fetch, blobs, ...(opt.umwelt || {}) };

    let a: Antwort;
    try {
      a = await beantworte({ methode: req.method ?? 'GET', pfad: u.pathname, kopf, koerper, suche,
                             adresse: 'http://localhost:' + port }, ablage, umwelt);
    } catch (e: unknown) {
      a = { status: 500, kopf: { 'Content-Type': 'application/json' },
            koerper: JSON.stringify({ object: 'error',
              message: e instanceof Error ? e.message : String(e) }) };
    }
    res.writeHead(a.status, a.kopf);
    res.end(a.koerper);
  });

  await new Promise<void>(fertig => { server.listen(port, () => fertig()); });
  return { server, ablage, blobs, port, adresse: 'http://localhost:' + port,
           stopp: () => new Promise<void>(fertig => { server.close(() => fertig()); }) };
};

/* Direkt gestartet? Dann laufen lassen. */
if (import.meta.url === 'file://' + (process.argv[1] ?? '')) {
  const port = Number(process.argv[2]) || 8790;
  starte(port).then(s => {
    console.log('Redion-Server läuft auf ' + s.adresse);
    console.log('Lebenszeichen:  ' + s.adresse + '/api/stand');
    console.log('Zum Beenden: Strg+C');
  });
}
