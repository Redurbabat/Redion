/* ============================================================================
 * POST /konto/access — eine Redion-Sitzung für den Menschen, den Access
 * gerade geprüft hat (E795, in PR #213 übertragen).
 * ----------------------------------------------------------------------------
 * Wird von worker.ts ERST NACH torPruefen gerufen; der Access-Nachweis ist
 * dann bereits kryptografisch geprüft. Das Konto wird genau so bestimmt wie
 * in cloud-router.ts (E-Mail des Nachweises, genau ein nicht gesperrtes
 * Konto) — damit gleicht die App in DASSELBE Konto ab, das ChatGPT über
 * /mcp/cloud liest. Kein Konto wird hier angelegt.
 *
 * Nur POST und nur vom eigenen Ursprung: eine fremde Seite kann den Aufruf
 * nicht auslösen, und die Antwort liest ohnehin nur derselbe Ursprung.
 * ==========================================================================*/
import { ablageD1 } from '../ablage.ts';
import { sitzungFuerKonto } from '../kern.ts';
import { alsAntwort } from '../cloudflare.ts';
import { torModus, nachweisAusAnfrage, zerlegeNachweis, type Torumwelt } from '../sicherheit/tor.ts';

const KOPF = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff' };
const nein = (status: number, code: string, message: string) =>
  new Response(JSON.stringify({ object: 'error', status, code, message }), { status, headers: KOPF });

export const accessSitzung = async (request: Request, env: Torumwelt & { DB?: unknown }): Promise<Response> => {
  if (request.method !== 'POST') return nein(405, 'methode', 'Nur POST.');
  if (request.headers.get('origin') !== new URL(request.url).origin)
    return nein(403, 'herkunft', 'Diese Anmeldung geht nur von der Redion-Website selbst.');
  if (!env.DB) return nein(503, 'keine_datenbank', 'Die Datenbank ist nicht eingerichtet.');
  if (torModus(env) !== 'access')
    return nein(403, 'kein_access', 'Ohne Cloudflare Access gibt es diese Anmeldung nicht.');
  const claim = zerlegeNachweis(nachweisAusAnfrage(request))?.nutz;
  const mail = typeof claim?.email === 'string' ? claim.email.trim() : '';
  if (!mail || mail.length > 254) return nein(401, 'unauthorized', 'Access hat keinen Menschen bestätigt.');
  const ablage = ablageD1(env.DB);
  const konten = await ablage.finde('konten', { mail }, { grenze: 2 });
  if (konten.length !== 1 || konten[0]!.gesperrt)
    return nein(403, 'kein_konto', 'Zu dieser Anmeldung gibt es kein eindeutiges, aktives Redion-Konto.');
  const antwort = alsAntwort(await sitzungFuerKonto(ablage, String(konten[0]!.id), 'Website (Cloudflare Access)'));
  antwort.headers.set('Cache-Control', 'no-store');
  return antwort;
};
