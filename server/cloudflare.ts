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

import { beantworte, weckrufeFaellig } from './kern.ts';
import { ablageD1, blobsR2 } from './ablage.ts';
import type { Anfrage, Antwort, Kopfzeilen, Umwelt } from './typen.ts';

import { koerperZuGross, koerperGrenze, leseBegrenzt, zuGrossAntwort } from './sicherheit/eingaben.ts';
import { stossen, schluesselLesen } from './sicherheit/push.ts';

/**
 * Cloudflare-Request → das Objekt für den Kern.
 *
 * `zuGross` statt einer Anfrage: der Körper wurde dann gar nicht erst
 * gelesen. Deshalb ist der Rückgabewert eine Wahl zwischen beidem und
 * nicht eine Anfrage mit einem Zusatzfeld — wer `zuGross` bekommt, hat
 * keine Anfrage, und der Übersetzer sagt es.
 */
export const alsAnfrage = async (request: Request): Promise<Anfrage | { zuGross: string }> => {
  const u = new URL(request.url);
  const kopf: Kopfzeilen = {};
  request.headers.forEach((v: string, k: string) => { kopf[k.toLowerCase()] = v; });
  const suche: Record<string, string> = {};
  u.searchParams.forEach((v, k) => { suche[k] = v; });

  /* DIE GRÖSSE ZUERST, VOR DEM LESEN. Danach wäre es zu spät: `request.json()`
     parst, was kommt, und ein Worker hat 128 MB. Die Prüfung steht deshalb
     hier und nicht im Kern — dort ist der Körper längst im Speicher. */
  if (koerperZuGross(u.pathname, kopf['content-length'] ?? null)) return { zuGross: u.pathname };

  const bytes = request.method === 'GET' || request.method === 'HEAD'
    ? new Uint8Array(0) : await leseBegrenzt(request.body, koerperGrenze(u.pathname));
  if (!bytes) return { zuGross: u.pathname };

  let koerper: Record<string, any> = {};
  if (bytes.length) {
    const art = kopf['content-type'] || '';
    try {
      if (art.includes('form')) {
        const nachricht = new Response(new Uint8Array(bytes).buffer,
          { headers: { 'Content-Type': art } });
        const f = await nachricht.formData();
        f.forEach((v: unknown, k: string) => { koerper[k] = v; });
      } else {
        const inhalt = new TextDecoder().decode(bytes);
        try { koerper = JSON.parse(inhalt) as Record<string, any>; }
        catch { koerper = { text: inhalt }; }
      }
    } catch { koerper = {}; }
  }
  return { methode: request.method, pfad: u.pathname, kopf, koerper, suche,
           adresse: u.origin };
};

/** Die Antwort des Kerns → Cloudflare-Response. */
/* 101/204/205/304 tragen nach der Norm keinen Körper; Node wirft sonst, und
   eine Vorabfrage (204) der Windows-App fiel so in den Fehlerzweig (E795). */
export const alsAntwort = (a: Antwort) => new Response(
  [101, 204, 205, 304].includes(a.status) ? null : a.koerper, { status: a.status, headers: a.kopf });

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
export const istServerWeg = (pfad: string) =>
  /^\/(konto|sync|datei|freigabe|feldrecht|veroeffentlichen|bereich|protokoll|marken|push|mcp|s)(\/|$)/.test(pfad) ||
  /^\/v1\//.test(pfad) || pfad === '/api/stand';

/* `ctx` nimmt der Worker entgegen und reicht es durch; hier wird es nicht
   gebraucht — der Unterstrich sagt das, statt es offen zu lassen. */
export const bedienen = async (request: Request, env: Umwelt, _ctx?: unknown) => {
  const u = new URL(request.url);
  if (!istServerWeg(u.pathname)) return null;      /* nicht meins */

  if (!env || !env.DB) {
    /* Das Lebenszeichen geht auch ohne Datenbank — sonst sieht man nie,
       ob der Worker überhaupt läuft. */
    if (u.pathname === '/api/stand') return new Response(JSON.stringify({
      app: 'Redion', stand: 'läuft', ablage: 'keine',
      /* AUCH HIER, und gerade hier (E270): das ist der Zustand, den man
         als Erstes sieht — frisch veröffentlicht, nichts eingerichtet.
         Fehlte das Feld ausgerechnet in diesem Zweig, könnte die
         Oberfläche die wichtigste Frage im wichtigsten Augenblick nicht
         beantworten. */
      dateien: env && env.R2 ? 'r2' : 'keine',
      hinweis: 'Der Worker läuft, aber D1 ist noch nicht gebunden. ' +
               'Siehe SERVER-EINRICHTEN.md.'
    }), { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8',
                                  'Access-Control-Allow-Origin': '*' } });
    return ohneDatenbank();
  }

  const anfrage = await alsAnfrage(request);
  /* Zu gross: die Antwort kommt, ohne dass irgendetwas geparst wurde. */
  if ('zuGross' in anfrage) return alsAntwort(zuGrossAntwort(anfrage.zuGross));

  const umwelt: Umwelt = {
    GITHUB_ID: env.GITHUB_ID, GITHUB_GEHEIM: env.GITHUB_GEHEIM,
    GOOGLE_ID: env.GOOGLE_ID, GOOGLE_GEHEIM: env.GOOGLE_GEHEIM,
    /* Die VAPID-Schlüssel für Weckrufe (E54). Fehlen sie, sagt
       `/push/schluessel` 503 mit dem Weg zur Einrichtung; alles andere
       läuft unverändert weiter — Web Push ist eine Zugabe, keine
       Voraussetzung (CLAUDE.md §22). */
    VAPID_OEFFENTLICH: env.VAPID_OEFFENTLICH || '',
    VAPID_PRIVAT: env.VAPID_PRIVAT || '',
    VAPID_ABSENDER: env.VAPID_ABSENDER || '',
    ADRESSE: env.ADRESSE || anfrage.adresse || '',
    /* Anhänge: R2, wenn gebunden — ohne Binding sagen die /datei-Wege
       503 mit dem Weg zur Einrichtung, alles andere läuft weiter. */
    blobs: env.R2 ? blobsR2(env.R2) : null,
    holen: fetch
  };
  return alsAntwort(await beantworte(anfrage, ablageD1(env.DB), umwelt));
};

/* ==========================================================================
 * DER GEPLANTE LAUF — jede Minute nachsehen, was fällig ist (L33, E54)
 * --------------------------------------------------------------------------
 * Eine Minute ist die kleinste Auflösung, die Cloudflare Cron erlaubt, und
 * für einen Wecker genau genug: „08:00" darf 08:00:40 heissen, aber nicht
 * 08:05.
 *
 * Was hier NICHT passiert: nachsehen, WORAN erinnert wird. Der Server hat
 * dazu keine Angabe und soll keine haben. Er stösst ein leeres „wach auf";
 * den Rest weiss nur das Gerät.
 * ========================================================================*/
export const geplant = async (env: Umwelt & { DB?: unknown }) => {
  if (!env || !env.DB) return { gestossen: 0, entfernt: 0, fehler: 0 };
  return weckrufeFaellig(
    ablageD1(env.DB),
    { VAPID_OEFFENTLICH: env.VAPID_OEFFENTLICH || '',
      VAPID_PRIVAT: env.VAPID_PRIVAT || '',
      VAPID_ABSENDER: env.VAPID_ABSENDER || '', holen: fetch },
    new Date().toISOString(), stossen, schluesselLesen);
};
