/* ==========================================================================
 * server/cloudflare.js — Der Kern, angeschlossen an Cloudflare
 * --------------------------------------------------------------------------
 * Hier steht nur die Übersetzung: aus Cloudflares Request wird das schlichte
 * Objekt, das der Kern versteht, und aus seiner Antwort wieder eine Response.
 * Sonst nichts. Wer den Kern prüfen will, braucht Cloudflare nicht.
 *
 * Fehlt die Datenbank (D1 ist noch nicht angelegt), antwortet der Server
 * ehrlich mit einer Anleitung statt mit einem Absturz.
 * ========================================================================*/

import { beantworte } from './kern.js';
import { ablageD1 } from './ablage.js';

import { koerperZuGross, zuGrossAntwort } from './sicherheit/eingaben.js';

/** Cloudflare-Request → das Objekt für den Kern. */
export const alsAnfrage = async (request) => {
  const u = new URL(request.url);
  const kopf = {};
  request.headers.forEach((v, k) => { kopf[k.toLowerCase()] = v; });
  const suche = {};
  u.searchParams.forEach((v, k) => { suche[k] = v; });

  /* DIE GRÖSSE ZUERST, VOR DEM LESEN. Danach wäre es zu spät: `request.json()`
     parst, was kommt, und ein Worker hat 128 MB. Die Prüfung steht deshalb
     hier und nicht im Kern — dort ist der Körper längst im Speicher. */
  if (koerperZuGross(u.pathname, kopf['content-length'])) return { zuGross: u.pathname };

  let koerper = {};
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    const art = kopf['content-type'] || '';
    try {
      if (art.includes('application/json')) koerper = await request.json();
      else if (art.includes('form')) {
        const f = await request.formData();
        f.forEach((v, k) => { koerper[k] = v; });
      } else {
        const text = await request.text();
        if (text) { try { koerper = JSON.parse(text); } catch { koerper = { text }; } }
      }
    } catch { koerper = {}; }
  }
  return { methode: request.method, pfad: u.pathname, kopf, koerper, suche,
           adresse: u.origin };
};

/** Die Antwort des Kerns → Cloudflare-Response. */
export const alsAntwort = (a) => new Response(a.koerper, { status: a.status, headers: a.kopf });

/** Sagt, was zu tun ist, statt einfach umzufallen. */
const ohneDatenbank = () => new Response(JSON.stringify({
  object: 'error', status: 503, code: 'keine_datenbank',
  message: 'Die Datenbank ist noch nicht angelegt. Das dauert zwei Minuten:',
  schritte: [
    'npx wrangler d1 create redion',
    'Die Ausgabe zeigt eine database_id — die in wrangler.toml eintragen.',
    'npx wrangler d1 execute redion --remote --file=server/schema.sql',
    'npx wrangler deploy'
  ],
  hinweis: 'Ohne Server läuft Redion trotzdem — alles bleibt dann auf dem Gerät.'
}, null, 2), { status: 503,
  headers: { 'Content-Type': 'application/json; charset=utf-8',
             'Access-Control-Allow-Origin': '*' } });

/** Gehört dieser Pfad dem Server? */
export const istServerWeg = (pfad) =>
  /^\/(konto|sync|freigabe|feldrecht|veroeffentlichen|bereich|protokoll|marken|mcp|s)(\/|$)/.test(pfad) ||
  /^\/v1\//.test(pfad) || pfad === '/api/stand';

export const bedienen = async (request, env, ctx) => {
  const u = new URL(request.url);
  if (!istServerWeg(u.pathname)) return null;      /* nicht meins */

  if (!env || !env.DB) {
    /* Das Lebenszeichen geht auch ohne Datenbank — sonst sieht man nie,
       ob der Worker überhaupt läuft. */
    if (u.pathname === '/api/stand') return new Response(JSON.stringify({
      app: 'Redion', stand: 'läuft', ablage: 'keine',
      hinweis: 'Der Worker läuft, aber D1 ist noch nicht gebunden. ' +
               'Siehe SERVER-EINRICHTEN.md.'
    }), { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8',
                                  'Access-Control-Allow-Origin': '*' } });
    return ohneDatenbank();
  }

  const anfrage = await alsAnfrage(request);
  /* Zu gross: die Antwort kommt, ohne dass irgendetwas geparst wurde. */
  if (anfrage.zuGross) return alsAntwort(zuGrossAntwort(anfrage.zuGross));

  const umwelt = {
    GITHUB_ID: env.GITHUB_ID, GITHUB_GEHEIM: env.GITHUB_GEHEIM,
    GOOGLE_ID: env.GOOGLE_ID, GOOGLE_GEHEIM: env.GOOGLE_GEHEIM,
    ADRESSE: env.ADRESSE || anfrage.adresse,
    holen: fetch
  };
  return alsAntwort(await beantworte(anfrage, ablageD1(env.DB), umwelt));
};
