/* ============================================================================
 * worker.ts — Der Einstiegspunkt bei Cloudflare
 * ----------------------------------------------------------------------------
 * Cloudflare ruft diese Datei vor JEDER Anfrage auf (run_worker_first).
 * Zuerst wird der Access-Nachweis geprüft, danach werden API und Dateien
 * geroutet. Ohne eingerichtetes Tor werden auch statische Dateien gesperrt.
 *
 *   1. /api/bruecke   selbst beantworten — das ist die Brücke zu Diensten,
 *                     die den Browser nicht direkt heranlassen (iCloud,
 *                     Jira, viele Kalenderadressen).
 *
 *   2. alles andere   an die Dateiablage weiterreichen. Findet sich nichts,
 *                     kommt die Startseite — dann funktionieren auch
 *                     Adressen wie /irgendwas, ohne dass etwas kaputtgeht.
 *
 * Die Dateien selbst (index.html, quell/…, oeffentlich/…) werden erst NACH
 * dieser Prüfung über die ASSETS-Bindung ausgeliefert.
 * ==========================================================================*/

import { torPruefen } from './server/sicherheit/tor.ts';
import { onRequest as bruecke } from './functions/api/bruecke.ts';
import { bedienen, istServerWeg, geplant } from './server/cloudflare.ts';
import { createCloudAuthorization } from './server/mcp/account.ts';

export default {
  async fetch(request: any, env: any, ctx: any) {
    // Jede Anfrage vor dem Routing prüfen, auch statische Dateien und /api/bruecke.
    // Voraussetzung: assets.run_worker_first = true in wrangler.toml.
    const verweigert = await torPruefen(request, env || {});
    if (verweigert) return verweigert;

    const url = new URL(request.url);

    /* OAuth-Zustimmung für den getrennten Cloud-MCP-Endpunkt. Das vorhandene
       Access-Tor oben bleibt davor; hier niemals TOR=offen als Identität nutzen. */
    if (url.pathname === '/mcp/authorize' || url.pathname === '/mcp/settings') {
      if (!env.DB || !env.MCP_ISSUER || !env.MCP_AUTHORIZATION_ENDPOINT)
        return new Response('Die Cloud-Verbindung ist noch nicht eingerichtet.', { status: 503, headers: { 'Cache-Control': 'no-store' } });
      try {
        const authorize = createCloudAuthorization({ database: env.DB, env, issuer: env.MCP_ISSUER, authorizationEndpoint: env.MCP_AUTHORIZATION_ENDPOINT });
        return await authorize(request) ?? new Response('Unbekannte Anmeldeadresse.', { status: 404 });
      } catch { return new Response('Die Cloud-Verbindung ist gerade nicht verfügbar.', { status: 503, headers: { 'Cache-Control': 'no-store' } }); }
    }

    /* --- Die Brücke ---------------------------------------------------- */
    if (url.pathname === '/api/bruecke' || url.pathname === '/api/bruecke/') {
      return bruecke({ request, env, ctx });
    }

    /* --- Der Redion-Server ---------------------------------------------
     * Konten, Abgleich, Rechte, Veröffentlichen, /v1/ und MCP. Alles davon
     * ist freiwillig: wer sich nie anmeldet, merkt nichts davon, und seine
     * Notizen verlassen das Gerät nie.
     * ------------------------------------------------------------------ */
    if (istServerWeg(url.pathname)) {
      const a = await bedienen(request, env, ctx);
      if (a) return a;
    }

    /* --- Ein kurzer Lebenszeichen-Punkt, praktisch zum Nachsehen -------- */
    if (url.pathname === '/api/status') {
      return Response.json({
        app: 'Redion',
        stand: 'läuft',
        bruecke: '/api/bruecke?ziel=https://…',
        hinweis: 'Alle Daten liegen im Browser des Besuchers, nicht hier.'
      }, { headers: { 'Access-Control-Allow-Origin': '*' } });
    }

    /* --- Alles andere kommt aus der Dateiablage ------------------------- */
    if (!env.ASSETS) {
      return new Response('Die Dateiablage ist nicht eingerichtet.', { status: 500 });
    }

    const antwort = await env.ASSETS.fetch(request);

    /* Unbekannte Adresse? Dann die App selbst — sie kommt mit jeder Adresse
       zurecht und zeigt die Startseite. */
    if (antwort.status === 404 && request.method === 'GET' &&
        !url.pathname.includes('.')) {
      const start = new URL('/index.html', url.origin);
      return env.ASSETS.fetch(new Request(start, request));
    }

    return antwort;
  },

  /* ========================================================================
   * DER GEPLANTE LAUF — Weckrufe (L33, E54)
   * ------------------------------------------------------------------------
   * Cloudflare ruft das nach dem Zeitplan aus `wrangler.toml` auf. Ohne
   * `[triggers]` passiert hier nie etwas, und ohne D1 auch nicht — beides
   * ist freiwillig, wie der ganze Server (CLAUDE.md §22).
   *
   * `waitUntil`: der Lauf darf zu Ende gehen, auch wenn `scheduled`
   * zurückkehrt. Ohne das bricht Cloudflare mitten im Stossen ab, und die
   * Hälfte der Wecker bliebe stumm — bei einer Erinnerung merkt man das
   * erst, wenn es zu spät ist.
   * ======================================================================*/
  async scheduled(_ereignis: any, env: any, ctx: any) {
    const arbeit = geplant(env).catch(() => ({ gestossen: 0, entfernt: 0, fehler: 0 }));
    if (ctx && typeof ctx.waitUntil === 'function') ctx.waitUntil(arbeit);
    else await arbeit;
  }
};
