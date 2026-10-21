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
import type { Socket } from 'node:net';
import { beantworte } from './kern.ts';
import { ablageSpeicher, blobsSpeicher } from './ablage.ts';
import { koerperZuGross, koerperGrenze, zuGrossAntwort } from './sicherheit/eingaben.ts';
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
    let groesse = 0;
    let zuGross = false;
    // Ohne Content-Length gilt dieselbe Byte-Grenze wie im Cloudflare-Worker.
    for await (const stueck of req) {
      groesse += stueck.length;
      if (groesse > koerperGrenze(u.pathname)) { zuGross = true; continue; }
      roh += stueck.toString('utf8');
    }
    if (zuGross) {
      const z = zuGrossAntwort(u.pathname);
      res.writeHead(z.status, z.kopf);
      res.end(z.koerper);
      return;
    }
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

  /* --- ANHALTEN, DAS WIRKLICH ANHAELT ------------------------------------
     Hier stand `stopp: () => new Promise(f => server.close(() => f()))`, und
     das sah aus, als warte es. Gemessen tat es das nicht:

         vor stopp:     Server, Socket, Socket
         stopp() nach   0 ms — "fertig"
         nach stopp:    Server, Socket, Socket, Socket

     Nach null Millisekunden Erfolg gemeldet, mit dem Server-Handle und drei
     Sockets noch am Leben. Danach kommt in den Prüfläufen `process.exit()`,
     und der reisst lebende Handles ab. Unter Linux fällt das nicht auf;
     unter Windows endete test101 genau deshalb mit einer libuv-Assertion,
     NACHDEM alle fachlichen Punkte grün waren.

     Zwei Dinge fehlten:

       1. `server.close()` hört nur auf, NEUE Verbindungen anzunehmen. Auf
          eine bestehende Keep-Alive-Verbindung wartet es — und die geht von
          sich aus nicht. `fetch` in Node hält genau solche offen.
       2. Zweimal anhalten rief `close()` auf einem geschlossenen Server. Der
          meldet `ERR_SERVER_NOT_RUNNING` an einen Rückruf, den niemand liest.

     Kein Sleep, keine Wartezeit: die Verbindungen werden beendet, und das
     Versprechen löst erst auf, wenn der Server sein `close` wirklich
     gemeldet hat. Zehn Prüfläufe hängen an diesem Server, nicht nur test101.
     ---------------------------------------------------------------------- */
  const verbindungen = new Set<Socket>();
  server.on('connection', (draht: Socket) => {
    verbindungen.add(draht);
    draht.on('close', () => { verbindungen.delete(draht); });
  });

  let anhalten: Promise<void> | null = null;
  const stopp = (): Promise<void> => {
    if (anhalten) return anhalten;          /* zweimal anhalten ist einmal */
    anhalten = new Promise<void>(fertig => {
      server.close(() => fertig());
      /* Erst zuhören aufhören, DANN die offenen Verbindungen beenden —
         sonst kommt der Rückruf oben nie. */
      const alle = (server as unknown as { closeAllConnections?: () => void }).closeAllConnections;
      if (typeof alle === 'function') alle.call(server);
      else for (const draht of verbindungen) draht.destroy();
      verbindungen.clear();
    });
    return anhalten;
  };

  await new Promise<void>(fertig => { server.listen(port, () => fertig()); });
  return { server, ablage, blobs, port, adresse: 'http://localhost:' + port, stopp };
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
