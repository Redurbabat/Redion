/* ============================================================================
 * Das Abgleich-Tor der installierten App (E795, in PR #213 übertragen)
 * ----------------------------------------------------------------------------
 * Die Website liegt hinter Cloudflare Access. Eine installierte Redion-App
 * (Windows: Ursprung redion-local://app) kann keine interaktive Access-
 * Anmeldung durchlaufen. Diese EXAKTEN Wege führt worker.ts deshalb am
 * Access-Tor des Workers vorbei — so wie die sieben OAuth-/MCP-Wege.
 *
 * Was das NICHT heisst: offen. Jeder Weg hier verlangt im Redion-Kern ein
 * gültiges Sitzungstoken (Bearer), ausser dem Gerätecode — zehn Minuten
 * gültig, 40 Bit, je Herkunft gebremst; freigegeben wird er nur von einer
 * angemeldeten Website-Sitzung (/konto/code-freigeben bleibt hinter Access).
 *
 * Nicht dabei: Anbieter-Anmeldung, Code-Freigabe, Konto löschen, Freigaben,
 * Marken, Veröffentlichen, v1, Protokoll, Push, /mcp. Keine Wildcards.
 * ==========================================================================*/

export const ABGLEICH_WEGE: ReadonlySet<string> = new Set([
  '/konto/code', '/konto/code-holen', '/konto/ich', '/konto/abmelden',
  '/sync/hoch', '/sync/runter',
  '/datei/melden', '/datei/stueck', '/datei/runter', '/datei/stand', '/datei/weg'
]);

export const istAbgleichWeg = (pfad: string): boolean => ABGLEICH_WEGE.has(pfad);

/** STANDARDMÄSSIG AUS. Redur hat für PR #213 festgelegt: „Keine Freigabe von
 *  Sync“. Das Tor wirkt erst, wenn am Worker ausdrücklich ABGLEICH_TOR = "an"
 *  gesetzt ist — zusammen mit den passenden Ausnahmen in der Access-
 *  Anwendung, und beides nur auf sein ausdrückliches Wort. Ohne den Schalter
 *  bleibt jeder Abgleichweg hinter Access (redion-mcp-cloud-runtime.mts). */
export const abgleichTorAn = (env: { ABGLEICH_TOR?: unknown } | null | undefined): boolean =>
  String(env?.ABGLEICH_TOR ?? '').trim().toLowerCase() === 'an';

/** Die Ursprünge der installierten Apps — als EXAKTER Text verglichen.
 *  URL.origin macht aus einem eigenen Schema 'null', und 'null' senden auch
 *  Sandbox-Rahmen und file:// — also kein Vergleich über URL und kein Stern.
 *  Cookies gibt es auf diesen Wegen nicht, nur Bearer-Tokens. */
export const APP_URSPRUENGE: ReadonlySet<string> = new Set(['redion-local://app', 'capacitor://localhost']);

const OHNE_KOERPER = [101, 204, 205, 304];

export const mitAppUrsprung = (request: Request, response: Response): Response => {
  const origin = request.headers.get('origin');
  if (!origin || !APP_URSPRUENGE.has(origin)) return response;
  const neu = new Response(OHNE_KOERPER.includes(response.status) ? null : response.body, response);
  neu.headers.set('Access-Control-Allow-Origin', origin);
  neu.headers.append('Vary', 'Origin');
  return neu;
};
