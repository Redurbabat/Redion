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
 * Die Dateien selbst (index.html, app.css, js/…, icons/…) liefert Cloudflare
 * direkt aus, ohne diesen Code auch nur anzufassen. Er läuft nur für die
 * beiden Fälle oben.
 * ==========================================================================*/

import { onRequest as bruecke } from './functions/api/bruecke.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    /* --- Die Brücke ---------------------------------------------------- */
    if (url.pathname === '/api/bruecke' || url.pathname === '/api/bruecke/') {
      return bruecke({ request, env, ctx });
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

    /* --- Die Schnittstelle /v1/ ----------------------------------------
     * Sie wird im Browser beantwortet, nicht hier: die Daten liegen dort.
     * Wer sie von aussen aufruft, soll das aber erfahren, statt die
     * Startseite als JSON-Antwort zu bekommen und zu rätseln, warum das
     * kein gültiges JSON ist.
     *
     * Ein GET aus dem Browser selbst kommt hier gar nicht an — der
     * Servicearbeiter fängt es vorher ab und fragt das offene Fenster.
     * ------------------------------------------------------------------ */
    if (url.pathname.startsWith('/v1/')) {
      return Response.json({
        object: 'error', status: 503, code: 'service_unavailable',
        message: 'Redion beantwortet /v1/ im Browser des Besuchers, nicht auf dem Server. ' +
                 'Ein fetch("/v1/…") aus einer offenen Redion-Seite funktioniert; ' +
                 'ein Aufruf von aussen nicht — dort liegen keine Daten.',
        hinweis: 'Das ist Absicht: die Notizen bleiben auf dem Gerät.'
      }, { status: 503, headers: { 'Access-Control-Allow-Origin': '*' } });
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
  }
};
