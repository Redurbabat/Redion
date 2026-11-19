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
import {handleCloudMcp,isCloudMcpPublicPath,isCloudMcpPrivatePath} from './server/mcp/cloud-router.ts';
import { onRequest as bruecke } from './functions/api/bruecke.ts';
import { istAbgleichWeg, abgleichTorAn, mitAppUrsprung } from './server/sicherheit/abgleich-tor.ts';
import { accessSitzung } from './server/mcp/access-sitzung.ts';
import { bedienen, istServerWeg, geplant } from './server/cloudflare.ts';

export default {
  async fetch(request: any, env: any, ctx: any) {
    const url = new URL(request.url);

    /* NUR diese expliziten Protokollpfade haben ihre EIGENE Authentifizierung:
     * Metadaten und Clientregistrierung bleiben öffentlich, /mcp/cloud
     * verlangt immer einen gültigen, widerrufbaren OAuth-Bearer-Token.
     * Das Access-Tor aller anderen Wege bleibt unverändert. Falls die
     * Cloudflare-Access-Anwendung bereits am Edge sperrt, müssen diese
     * Protokollpfade dort separat freigegeben werden; das macht der
     * Worker absichtlich nicht heimlich. */
    if (isCloudMcpPublicPath(url.pathname))
      return handleCloudMcp(request,env,false);
    /* Der Abgleich der installierten App (E795): dieselbe Ausnahme für eine
     * feste Liste exakter Wege, die der Redion-Kern selbst mit Sitzungstokens
     * schützt. Am Edge wirkt das erst, wenn die Access-Anwendung genau diese
     * Wege als Ausnahme trägt — das ist eine eigene, ausdrückliche Freigabe.
     * Ohne ABGLEICH_TOR = "an" bleibt alles beim Access-Tor (Standard). */
    if (abgleichTorAn(env) && istAbgleichWeg(url.pathname)) {
      const a = await bedienen(request, env, ctx);
      return mitAppUrsprung(request, a ?? new Response(null, { status: 404 }));
    }

    // Jede sonstige Anfrage vor dem Routing prüfen, auch statische Dateien.
    // Voraussetzung: assets.run_worker_first = true in wrangler.toml.
    const verweigert = await torPruefen(request, env || {});
    if (verweigert) return verweigert;

    /* Menschliche OAuth-Zustimmung und Widerruf nur NACH dem Access-Tor.
     * Die Cloud prüft die Konto-ID nochmals; ein Client-Header genügt nie. */
    if (isCloudMcpPrivatePath(url.pathname))
      return handleCloudMcp(request,env,true);
    /* Redion-Sitzung für den eben von Access geprüften Menschen (E795). */
    if (url.pathname === '/konto/access') return accessSitzung(request, env || {});

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
