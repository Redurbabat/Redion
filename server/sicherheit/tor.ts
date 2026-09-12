/* ============================================================================
 * server/sicherheit/tor.ts — Niemand kommt herein, den Redur nicht kennt
 * ----------------------------------------------------------------------------
 * Redur, 12. September:
 *
 *   „ich will redion so haben ohne admin zustimmung nimant kann die webseite
 *    rein kommen geht so was, und nicht mehr ohne konto oder wo was"
 *
 * Ja, das geht — aber nur an EINER Stelle, und die ist nicht der Browser.
 *
 * WARUM EIN ANMELDEFENSTER IM BROWSER KEIN SCHLOSS IST. Redion ist local
 * first: die Seite liefert HTML, CSS und JavaScript aus, und der Browser
 * führt sie aus. Ein Fenster, das nach einem Passwort fragt, ist dann Teil
 * genau dieser ausgelieferten Dateien — wer sie lädt, hat sie schon. Er
 * kann das Fenster wegklicken, das Skript nicht laden oder die Dateien
 * direkt abrufen. Dasselbe steht seit L140 über den Zugangscode der
 * Chronik: ein Türschild, kein Schloss.
 *
 * Ein echtes Tor muss also VOR der Auslieferung stehen. Es gibt genau zwei
 * Orte dafür, und beide liegen bei Cloudflare:
 *
 *   1. CLOUDFLARE ACCESS, vor dem Worker. Wer nicht auf Redurs Liste steht,
 *      erreicht diesen Code nie — er bekommt die Anmeldung von Cloudflare
 *      und sonst nichts. Das ist das eigentliche Schloss.
 *   2. DIESE DATEI, im Worker. Sie prüft nach, dass (1) wirklich davorsteht.
 *
 * WARUM ES (2) BRAUCHT, OBWOHL (1) DAS SCHLOSS IST. Weil eine Einstellung
 * im Dashboard verschwinden kann: eine gelöschte Anwendung, ein geänderter
 * Hostname, ein zweiter Arbeitsbereich. Access wäre dann weg, der Worker
 * liefe weiter, und die Seite stünde offen — ohne dass irgendetwas kaputt
 * aussieht. Genau diese stille Öffnung soll nicht passieren.
 *
 * DESHALB PRÜFT DIESE DATEI DIE UNTERSCHRIFT UND NICHT NUR DIE KOPFZEILE.
 * Access hängt an jede durchgelassene Anfrage einen signierten Nachweis
 * (`Cf-Access-Jwt-Assertion`, dazu das Plätzchen `CF_Authorization`). Nur
 * das Vorhandensein zu prüfen wäre wertlos: fehlt Access, kann jeder die
 * Kopfzeile selbst setzen. Geprüft wird deshalb die RSA-Unterschrift gegen
 * die öffentlichen Schlüssel des Teams, dazu Ablauf und Empfänger.
 *
 * UND WENN NICHTS EINGERICHTET IST, IST ZU. Ein Tor, das im Zweifel
 * aufgeht, ist kein Tor. Fehlt die Einstellung, kommt eine Seite, die sagt,
 * WAS fehlt — nicht eine offene App.
 *
 * WAS DAS TOR NICHT KANN, und das gehört hierhin und nicht ins Kleingedruckte:
 *   · `index.html` auf der eigenen Platte und `redion-einzeldatei.html`
 *     erreicht es nicht. Dort gibt es keinen Server, der fragen könnte
 *     (§22). Wer die Datei hat, hat die App — das ist der Kern von Redion
 *     und ändert sich hier nicht.
 *   · Daten, die schon im Browser eines Besuchers liegen, holt es nicht
 *     zurück.
 *   · Es ersetzt kein Konto. Es sagt „du darfst herein", nicht „du bist
 *     dieser Mensch, und das hier sind deine Seiten". Das eigene Konto-Tor
 *     mit Freigabe je Person ist ein eigener Bogen (L149).
 * ==========================================================================*/

/** Wie das Tor eingestellt ist. */
export type Tormodus = 'offen' | 'access' | 'unfertig';

export type Torumwelt = {
  TOR?: string;
  ACCESS_TEAM?: string;
  ACCESS_AUD?: string;
};

/**
 * Welcher Modus gilt?
 *
 * `offen` muss AUSDRÜCKLICH dastehen. Alles andere — leer, vertippt, halb
 * eingerichtet — ist `unfertig` oder `access`, also zu. Ein Tippfehler in
 * einer Einstellung darf keine Tür öffnen.
 */
export const torModus = (env: Torumwelt): Tormodus => {
  if (String(env.TOR ?? '').trim().toLowerCase() === 'offen') return 'offen';
  const team = String(env.ACCESS_TEAM ?? '').trim();
  const aud = String(env.ACCESS_AUD ?? '').trim();
  return team && aud ? 'access' : 'unfertig';
};

/* ==========================================================================
 * Den Nachweis lesen
 * ========================================================================*/

/** Base64url → Bytes. Ohne Polster, mit `-` und `_` statt `+` und `/`. */
export const ausBase64Url = (text: string): Uint8Array => {
  const roh = text.replace(/-/g, '+').replace(/_/g, '/');
  const voll = roh + '='.repeat((4 - (roh.length % 4)) % 4);
  const binaer = atob(voll);
  const bytes = new Uint8Array(binaer.length);
  for (let i = 0; i < binaer.length; i++) bytes[i] = binaer.charCodeAt(i);
  return bytes;
};

export type Nachweis = {
  kopf: Record<string, unknown>;
  nutz: Record<string, unknown>;
  signatur: Uint8Array;
  /** Die ersten zwei Teile, genau so wie sie unterschrieben wurden. */
  unterschrieben: Uint8Array;
};

/**
 * Einen Nachweis zerlegen — oder `null`, wenn er keiner ist.
 *
 * Wirft nicht. Ein kaputter Nachweis ist kein Sonderfall, sondern der
 * Normalfall bei jedem, der es versucht.
 */
export const zerlegeNachweis = (token: string): Nachweis | null => {
  const teile = String(token || '').split('.');
  if (teile.length !== 3) return null;
  try {
    const kopf = JSON.parse(new TextDecoder().decode(ausBase64Url(teile[0]!)));
    const nutz = JSON.parse(new TextDecoder().decode(ausBase64Url(teile[1]!)));
    if (!kopf || typeof kopf !== 'object' || !nutz || typeof nutz !== 'object') return null;
    return {
      kopf, nutz,
      signatur: ausBase64Url(teile[2]!),
      unterschrieben: new TextEncoder().encode(teile[0] + '.' + teile[1])
    };
  } catch { return null; }
};

/** Abgelaufen? Ohne `exp` gilt er als abgelaufen — nicht als ewig gültig. */
export const istAbgelaufen = (nutz: Record<string, unknown>, jetztSekunden: number): boolean => {
  const exp = Number(nutz.exp);
  if (!Number.isFinite(exp)) return true;
  return jetztSekunden >= exp;
};

/**
 * Ist der Nachweis für DIESE Anwendung ausgestellt?
 *
 * `aud` darf ein Text oder eine Liste sein. Ohne diese Prüfung liesse sich
 * ein Nachweis aus einer FREMDEN Access-Anwendung desselben Teams hier
 * einreichen — eine Tür, die aussieht wie eine Wand.
 */
export const passtEmpfaenger = (nutz: Record<string, unknown>, aud: string): boolean => {
  const soll = String(aud || '').trim();
  if (!soll) return false;
  const ist = nutz.aud;
  if (typeof ist === 'string') return ist === soll;
  if (Array.isArray(ist)) return ist.some(eintrag => String(eintrag) === soll);
  return false;
};

/** Den Nachweis aus Kopfzeile oder Plätzchen holen. */
export const nachweisAusAnfrage = (request: Request): string => {
  const kopf = request.headers.get('Cf-Access-Jwt-Assertion');
  if (kopf) return kopf;
  const kekse = request.headers.get('Cookie') || '';
  const treffer = kekse.match(/(?:^|;\s*)CF_Authorization=([^;]+)/);
  return treffer ? treffer[1]! : '';
};

/* ==========================================================================
 * Die öffentlichen Schlüssel des Teams
 * ========================================================================*/

type Schluesselsatz = { zeit: number; schluessel: Map<string, CryptoKey> };
let gemerkt: Schluesselsatz | null = null;
/** Eine Stunde. Access dreht seine Schlüssel, aber nicht im Minutentakt. */
const MERKDAUER = 3600_000;

/**
 * Die Schlüssel holen und behalten.
 *
 * `holen` ist einsetzbar, damit ein Prüflauf ohne Netz auskommt — und damit
 * er auch den Fall prüfen kann, dass Cloudflare gerade nicht antwortet.
 */
export const schluesselHolen = async (
  team: string,
  jetzt: number,
  holen: typeof fetch = fetch
): Promise<Map<string, CryptoKey>> => {
  if (gemerkt && jetzt - gemerkt.zeit < MERKDAUER) return gemerkt.schluessel;
  const adresse = `https://${team}/cdn-cgi/access/certs`;
  const antwort = await holen(adresse);
  if (!antwort.ok) throw new Error('Access-Schlüssel nicht erreichbar: ' + antwort.status);
  const daten: any = await antwort.json();
  const satz = new Map<string, CryptoKey>();
  for (const jwk of (daten?.keys ?? [])) {
    if (!jwk?.kid) continue;
    const schluessel = await crypto.subtle.importKey(
      'jwk', { ...jwk, alg: 'RS256', ext: true }, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false, ['verify']);
    satz.set(String(jwk.kid), schluessel);
  }
  if (!satz.size) throw new Error('Access hat keine Schlüssel geliefert.');
  gemerkt = { zeit: jetzt, schluessel: satz };
  return satz;
};

/** Nur für Prüfläufe: das Gedächtnis leeren. */
export const schluesselVergessen = (): void => { gemerkt = null; };

/* ==========================================================================
 * Das Tor
 * ========================================================================*/

const seite = (titel: string, text: string, status: number): Response =>
  new Response(
    '<!doctype html><html lang="de"><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    `<title>${titel} — Redion</title>` +
    '<style>body{margin:0;min-height:100dvh;display:grid;place-items:center;' +
    'background:#0a0a0c;color:#e7e5ee;font:16px/1.6 system-ui,sans-serif;padding:24px}' +
    'main{max-width:34rem}h1{font-size:20px;margin:0 0 12px}' +
    'p{margin:0 0 10px;color:#b6b2c4}code{color:#f0c274;font-size:14px}</style>' +
    `<main><h1>${titel}</h1>${text}</main></html>`,
    { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });

/**
 * Darf diese Anfrage weiter?
 *
 * Gibt `null` zurück, wenn ja — dann macht der Worker weiter wie bisher.
 * Gibt eine Antwort zurück, wenn nein; die geht dann sofort hinaus.
 */
export const torPruefen = async (
  request: Request,
  env: Torumwelt,
  jetzt: number = Date.now(),
  holen: typeof fetch = fetch
): Promise<Response | null> => {
  const modus = torModus(env);
  if (modus === 'offen') return null;

  if (modus === 'unfertig') {
    return seite('Das Tor ist noch nicht eingerichtet',
      '<p>Redion lässt niemanden herein, solange nicht feststeht, wer hereindarf. ' +
      'Das ist Absicht: ein Tor, das im Zweifel aufgeht, ist keines.</p>' +
      '<p>Es fehlen zwei Angaben am Worker — <code>ACCESS_TEAM</code> ' +
      '(zum Beispiel <code>deinname.cloudflareaccess.com</code>) und ' +
      '<code>ACCESS_AUD</code>, die Kennung der Access-Anwendung.</p>' +
      '<p>Wie beides gesetzt wird, steht in <code>CLOUDFLARE.md</code> unter ' +
      '„Das Tor vor der Seite“. Wer die Seite bewusst offen will, setzt ' +
      '<code>TOR=offen</code>.</p>', 503);
  }

  const token = nachweisAusAnfrage(request);
  const nachweis = token ? zerlegeNachweis(token) : null;
  if (!nachweis) {
    return seite('Kein Zutritt',
      '<p>Diese Seite steht nur Menschen offen, die Redur freigegeben hat.</p>' +
      '<p>Wenn du dazugehörst und das hier siehst, ist der Nachweis von ' +
      'Cloudflare Access unterwegs verlorengegangen — eine neue Anmeldung ' +
      'behebt das meistens.</p>', 403);
  }

  if (!passtEmpfaenger(nachweis.nutz, String(env.ACCESS_AUD))) {
    return seite('Kein Zutritt',
      '<p>Der Nachweis gehört zu einer anderen Anwendung.</p>', 403);
  }
  if (istAbgelaufen(nachweis.nutz, Math.floor(jetzt / 1000))) {
    return seite('Die Anmeldung ist abgelaufen',
      '<p>Bitte lade die Seite neu; Cloudflare fragt dann noch einmal.</p>', 403);
  }

  let gueltig = false;
  try {
    const satz = await schluesselHolen(String(env.ACCESS_TEAM), jetzt, holen);
    const schluessel = satz.get(String(nachweis.kopf.kid ?? ''));
    if (schluessel) {
      gueltig = await crypto.subtle.verify(
        'RSASSA-PKCS1-v1_5', schluessel,
        nachweis.signatur as unknown as BufferSource,
        nachweis.unterschrieben as unknown as BufferSource);
    }
  } catch {
    /* ERREICHT DER WORKER DIE SCHLÜSSEL NICHT, BLEIBT ZU. Die bequeme
       Fassung wäre, bei einem Netzfehler durchzulassen — und genau die
       macht aus einer Störung bei Cloudflare eine offene Seite. */
    return seite('Der Zutritt lässt sich gerade nicht prüfen',
      '<p>Die Schlüssel von Cloudflare Access sind nicht erreichbar. ' +
      'Solange das so ist, bleibt die Seite zu.</p>', 503);
  }

  if (!gueltig) {
    return seite('Kein Zutritt', '<p>Der Nachweis trägt keine gültige Unterschrift.</p>', 403);
  }
  return null;
};
