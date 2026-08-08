/* ============================================================================
 * server/sicherheit/push.ts — Web Push, und warum der Stoss leer ist
 * ----------------------------------------------------------------------------
 * DIE ENTSCHEIDUNG STEHT VOR DEM CODE (E54): **der Stoss trägt nichts.**
 *
 * Ein Web Push kann Inhalt mitbringen. Er müsste dann verschlüsselt werden
 * (aes128gcm) — aber das ist nicht der Grund, ihn wegzulassen. Der Grund
 * ist: der Text einer Erinnerung geht Redions Server nichts an. „Zahnarzt
 * 14:00" ist genau die Sorte Satz, die local-first schützen soll.
 *
 * Also sagt der Stoss nur „wach auf". Das Dienst-Skript liest daraufhin die
 * fälligen Erinnerungen aus der lokalen IndexedDB und zeigt sie. Der Server
 * erfährt einen Zeitpunkt und die Adresse eines Geräts — sonst nichts.
 *
 * Nebenbei ist das die einfachste Bauform: kein Inhalt heisst keine
 * Verschlüsselung, nur die VAPID-Signatur.
 *
 * WAS VAPID IST, in drei Sätzen. Der Push-Dienst (Apple, Google, Mozilla)
 * will wissen, wer da stösst — sonst könnte jeder, der einen Endpunkt
 * kennt, fremde Geräte wecken. Also unterschreibt der Absender ein kurzes
 * JWT mit seinem privaten Schlüssel und legt den öffentlichen daneben. Der
 * Dienst prüft die Unterschrift; dasselbe Schlüsselpaar hat sich das Gerät
 * bei der Anmeldung gemerkt.
 *
 * DIE FALLE BEI DER SIGNATUR. `crypto.subtle.sign` gibt bei ECDSA die rohen
 * 64 Byte r‖s zurück — genau das, was JWS für ES256 will. Wer eine
 * Bibliothek gewöhnt ist, die DER liefert, baut hier eine Umwandlung ein,
 * die alles kaputtmacht. Nicht umwandeln.
 * ==========================================================================*/

/** Base64url ohne Polster — die einzige Schreibweise, die JWS kennt. */
export const b64u = (bytes: ArrayBuffer | Uint8Array): string => {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = '';
  for (const x of b) s += String.fromCharCode(x);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

export const vonB64u = (text: string): Uint8Array => {
  const s = String(text || '').replace(/-/g, '+').replace(/_/g, '/');
  const roh = atob(s + '='.repeat((4 - (s.length % 4)) % 4));
  const b = new Uint8Array(roh.length);
  for (let i = 0; i < roh.length; i++) b[i] = roh.charCodeAt(i);
  return b;
};

const textAlsB64u = (o: unknown): string =>
  b64u(new TextEncoder().encode(JSON.stringify(o)));

/**
 * Den privaten VAPID-Schlüssel einlesen.
 *
 * Erwartet wird der rohe 32-Byte-Skalar in base64url — die Form, die
 * `web-push generate-vapid-keys` ausgibt. Daraus wird ein JWK gebaut; die
 * beiden öffentlichen Hälften stehen im öffentlichen Schlüssel (65 Byte,
 * 0x04 ‖ x ‖ y).
 */
export const schluesselLesen = async (
  privat: string, oeffentlich: string
): Promise<CryptoKey> => {
  const d = vonB64u(privat);
  const p = vonB64u(oeffentlich);
  if (d.length !== 32) throw new Error('Der private VAPID-Schlüssel ist nicht 32 Byte lang.');
  if (p.length !== 65 || p[0] !== 4)
    throw new Error('Der öffentliche VAPID-Schlüssel ist kein unkomprimierter P-256-Punkt.');
  return crypto.subtle.importKey('jwk', {
    kty: 'EC', crv: 'P-256',
    d: b64u(d), x: b64u(p.slice(1, 33)), y: b64u(p.slice(33, 65)),
    ext: true
  } as JsonWebKey, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
};

/**
 * Das JWT für einen Endpunkt.
 *
 * `aud` ist die HERKUNFT des Endpunkts, nicht der ganze Pfad — mit dem
 * ganzen Pfad weist jeder Dienst den Stoss ab, und die Meldung dazu ist
 * unbrauchbar („401 unauthorized").
 *
 * Zwölf Stunden Gültigkeit; die Dienste erlauben bis 24 und lehnen alles
 * ab, was länger gilt.
 */
export const marke = async (
  endpunkt: string, schluessel: CryptoKey, absender: string, jetzt: number
): Promise<string> => {
  const aud = new URL(endpunkt).origin;
  const kopf = textAlsB64u({ typ: 'JWT', alg: 'ES256' });
  const rumpf = textAlsB64u({
    aud, exp: Math.floor(jetzt / 1000) + 12 * 60 * 60,
    sub: absender || 'mailto:redion@example.invalid'
  });
  const daten = new TextEncoder().encode(kopf + '.' + rumpf);
  /* ROH, NICHT DER. `crypto.subtle.sign` gibt bei ECDSA bereits r‖s. */
  const sig = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' }, schluessel, daten);
  return kopf + '.' + rumpf + '.' + b64u(sig);
};

export type StossErgebnis = { ok: boolean; status: number; weg: boolean };

/**
 * Einen leeren Stoss senden.
 *
 * `weg: true` heisst: dieses Gerät gibt es nicht mehr (404/410). Der
 * Eintrag gehört dann gelöscht und nicht endlos wiederholt — sonst wächst
 * die Tabelle mit Leichen, und jeder geplante Lauf wird langsamer.
 */
export const stossen = async (
  endpunkt: string, schluessel: CryptoKey, oeffentlich: string,
  absender: string, jetzt: number, holen: typeof fetch = fetch
): Promise<StossErgebnis> => {
  const t = await marke(endpunkt, schluessel, absender, jetzt);
  const antwort = await holen(endpunkt, {
    method: 'POST',
    headers: {
      /* Kein Körper heisst: kein `Content-Encoding`, keine
         `Crypto-Key`-Zeile für den Inhalt — nur die Berechtigung. */
      Authorization: 'vapid t=' + t + ', k=' + oeffentlich,
      TTL: '3600',
      'Content-Length': '0'
    }
  });
  return {
    ok: antwort.status >= 200 && antwort.status < 300,
    status: antwort.status,
    weg: antwort.status === 404 || antwort.status === 410
  };
};
