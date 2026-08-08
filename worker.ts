/* ============================================================================
 * worker.js — Der Einstiegspunkt bei Cloudflare
 * ----------------------------------------------------------------------------
 * Cloudflare ruft diese Datei bei jeder Anfrage auf, die zu keiner Datei
 * passt. Sie hat genau zwei Aufgaben:
 *
 *   1. /api/bruecke   selbst beantworten — das ist die Brücke zu Diensten,
 *                     die den Browser nicht direkt heranlassen (iCloud,
 *                     Jira, viele Kalenderadressen).
 *
 *   2. alles andere   an die Dateiablage weiterreichen. Findet sich nichts,
 *                     kommt die Startseite — dann funktionieren auch
 *                     Adressen wie /irgendwas, ohne dass etwas kaputtgeht.
 *
 * Die Dateien selbst (index.html, quell/…, oeffentlich/…) liefert Cloudflare
 * direkt aus, ohne diesen Code auch nur anzufassen. Er läuft nur für die
 * beiden Fälle oben.
 * ==========================================================================*/

import { onRequest as bruecke } from './functions/api/bruecke.ts';
import { bedienen, istServerWeg, geplant } from './server/cloudflare.ts';

export default {
  async fetch(request: any, env: any, ctx: any) {
    const url = new URL(request.url);

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
