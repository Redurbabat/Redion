/* ============================================================================
 * server/sicherheit/cors.js — wer darf den Server von aussen fragen
 * ----------------------------------------------------------------------------
 * Bisher stand an 36 Stellen in `kern.js` einzeln
 * `'Access-Control-Allow-Origin': '*'`. Die Begründung im Quelltext war:
 * *„die App darf von überall her fragen, aber nur mit Token — ohne Token nützt
 * eine erlaubte Herkunft niemandem etwas."*
 *
 * DAS STIMMT ZUR HÄLFTE, und die andere Hälfte ist der Grund für diese Datei.
 * Richtig ist: bei `*` schickt der Browser keine Zugangsdaten mit, und dieser
 * Server nimmt seinen Schlüssel aus einem Kopfzeilenfeld, nicht aus einem Keks.
 * Eine fremde Seite kann also keine angemeldete Anfrage stellen.
 *
 * Nicht abgedeckt ist alles, was **ohne** Schlüssel antwortet:
 *
 *   · `/api/stand` nennt die Zahl der Konten
 *   · `/s/:schluessel` liefert eine veröffentlichte Seite
 *   · der Gerätecode-Weg gibt nach Freigabe einen Sitzungsschlüssel heraus
 *
 * Bei `*` darf jede Seite im Netz diese Antworten lesen. Der Auftrag sagt es
 * ausdrücklich: in Produktion nur erlaubte Ursprünge.
 *
 * WARUM ES HIER STEHT UND NICHT AN 36 STELLEN: eine Regel, die 36-mal
 * abgeschrieben wird, ist 36 Gelegenheiten, sie einmal falsch zu schreiben.
 * Genau daran hing die Anführungszeichen-Lücke (zwanzig halbe `esc`) und die
 * Absenderprüfung beim Anmelden (ein Empfänger richtig, einer nicht). Die 36
 * Stellen sagen weiterhin „diese Antwort ist für die App von aussen gedacht" —
 * **welcher** Ursprung das sein darf, entscheidet ab jetzt diese Datei.
 *
 * OHNE EINGETRAGENE ADRESSE bleibt es beim Stern. Das ist Absicht: wer die App
 * gerade von der Festplatte startet oder auf `localhost` entwickelt, soll nicht
 * an einer Sperre scheitern, die er noch gar nicht einrichten konnte. Sobald
 * `ADRESSE` gesetzt ist — und das ist sie in jeder echten Aufstellung —, gilt
 * die Liste.
 * ==========================================================================*/

import type { Anfrage, Antwort, Umwelt } from '../typen.ts';

/* ---------------------------------------------------------------------------
 * ERLAUBTE RÜCKSPRUNG-ADRESSEN
 * ---------------------------------------------------------------------------
 * Der Anmeldevorgang bekommt eine Adresse mit, zu der er danach zurückkehrt
 * (`?zurueck=…`). Sie kam bisher ungeprüft aus der Adresszeile — und aus ihr
 * wird `redirect_uri` für GitHub und Google gebaut.
 *
 * WAS DAS BEDEUTET: die Anbieter prüfen `redirect_uri` gegen ihre eigene
 * Liste, das ist das eine Netz. Aber ein Wert, der ungeprüft durch den
 * Vorgang läuft und am Ende bestimmt, wohin ein Sitzungsschlüssel geht, darf
 * nicht auf ein fremdes Netz vertrauen. Wer die Liste beim Anbieter einmal
 * weit einstellt — ein Platzhalter für Unterdomänen genügt —, hat sonst hier
 * ein Loch, das niemand mehr sieht.
 *
 * Erlaubt ist deshalb nur, was der Server selbst als seine Adresse kennt
 * (`ADRESSE`), dazu ausdrücklich eingetragene weitere (`ADRESSEN`, mit
 * Komma), und beim Entwickeln `localhost`.
 * ------------------------------------------------------------------------ */
export const erlaubteAdressen = (umwelt: Umwelt = {}) => {
  const roh = [umwelt.ADRESSE, ...(String(umwelt.ADRESSEN || '').split(','))]
    .map(x => String(x || '').trim().replace(/\/+$/, ''))
    .filter(Boolean);
  const raus: string[] = [];
  for (const a of roh) { try { raus.push(new URL(a).origin); } catch { /* unbrauchbar */ } }
  return [...new Set(raus)];
};

/**
 * Ist diese Rücksprung-Adresse erlaubt?
 * @returns {string} die Adresse ohne Schrägstrich am Ende — oder '' wenn nicht
 */
export const rueckAdresse = (wert: any, umwelt = {}) => {
  const roh = String(wert || '').trim();
  if (!roh) return '';
  let ursprung;
  try { ursprung = new URL(roh).origin; } catch { return ''; }
  /* Beim Entwickeln läuft die App auf einem anderen Port als der Server. */
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(ursprung)) return roh.replace(/\/+$/, '');
  return erlaubteAdressen(umwelt).includes(ursprung) ? roh.replace(/\/+$/, '') : '';
};

/** Sieht diese Herkunft nach einem Rechner des Entwicklers aus? */
export const istEntwicklung = (ursprung: any) =>
  /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i.test(String(ursprung || ''));

/**
 * Welcher Wert gehört in `Access-Control-Allow-Origin`?
 *
 * @param ursprung  was der Browser als `Origin` geschickt hat
 * @param umwelt    die Einstellungen des Servers
 * @returns {string} der erlaubte Ursprung, '*' im Entwicklungsfall — oder '',
 *                   wenn diese Herkunft nichts lesen darf
 */
export const erlaubterUrsprung = (ursprung: any, umwelt = {}) => {
  const liste = erlaubteAdressen(umwelt);

  /* Noch nichts eingetragen: der Server weiss nicht, wo seine App liegt.
     Dann sperren wäre keine Sicherheit, sondern eine kaputte Aufstellung. */
  if (!liste.length) return '*';

  const roh = String(ursprung || '').trim();
  /* Keine Herkunft im Kopf: entweder gleicher Ursprung (dann braucht es
     nichts) oder gar kein Browser (Skript, curl, App). Beides ist kein Fall
     für CORS — und `*` wäre hier eine Aussage, die niemand hört. */
  if (!roh) return '';

  if (istEntwicklung(roh)) return roh;

  let ursprungRein;
  try { ursprungRein = new URL(roh).origin; } catch { return ''; }
  return liste.includes(ursprungRein) ? ursprungRein : '';
};

/**
 * Die Kopfzeilen einer Antwort nachziehen.
 *
 * Sie ersetzt einen vorhandenen Stern durch den geprüften Ursprung — und
 * nimmt die Zeile ganz weg, wenn die Herkunft nicht erlaubt ist. Antworten
 * ohne CORS-Zeile bleiben unberührt: was der Kern nicht nach draussen geben
 * wollte, gibt diese Datei auch nicht nach draussen.
 *
 * `Vary: Origin` muss dazu, sobald der Wert von der Anfrage abhängt — sonst
 * liefert ein Zwischenspeicher die Antwort für Herkunft A an Herkunft B aus.
 * Das ist die Zeile, die man am häufigsten vergisst und die am schwersten zu
 * finden ist, weil sie nur unter Last auffällt.
 */
export const mitCors = (antwort: Antwort, anfrage: Partial<Anfrage> = {},
                        umwelt: Umwelt = {}) => {
  const kopf = antwort && antwort.kopf ? antwort.kopf : null;
  if (!kopf || !('Access-Control-Allow-Origin' in kopf)) return antwort;

  const herkunft = (anfrage.kopf || {}).origin || '';
  const erlaubt = erlaubterUrsprung(herkunft, umwelt);

  const neu = { ...kopf };
  if (erlaubt) neu['Access-Control-Allow-Origin'] = erlaubt;
  else delete neu['Access-Control-Allow-Origin'];

  if (erlaubt !== '*') neu.Vary = neu.Vary ? neu.Vary + ', Origin' : 'Origin';
  return { ...antwort, kopf: neu };
};
