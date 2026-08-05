/* ============================================================================
 * server/sicherheit/bremse.js — wie oft jemand etwas versuchen darf
 * ----------------------------------------------------------------------------
 * WAS GEBREMST WERDEN MUSS und was nicht — das war die erste Frage, und sie
 * wurde gerechnet statt geraten:
 *
 *   Gerätecode      8 Zeichen aus 32 → 32^8 ≈ 1,1·10^12, zehn Minuten gültig.
 *                   Zum Durchprobieren bräuchte es Milliarden Versuche pro
 *                   Sekunde. Der Code selbst ist stark genug.
 *   Seitenschlüssel 12 Hexzeichen → 48 Bit. Ebenfalls stark genug.
 *   PASSWORT einer  von einem Menschen gewählt. „sommer2026" fällt in
 *   öffentlichen    Sekunden, wenn man beliebig oft raten darf.
 *   Seite           **Das ist die Stelle, an der es wirklich hängt.**
 *
 * Deshalb bremst diese Datei nicht überall gleich, sondern dort am schärfsten,
 * wo das Geheimnis am schwächsten ist. Eine Bremse, die überall gleich zieht,
 * behindert die einen und schützt die anderen nicht.
 *
 * ZWEI DINGE, DIE EINE BREMSE FALSCH MACHEN KANN, und beide sind hier
 * ausdrücklich vermieden:
 *
 * 1. **Den Falschen aussperren.** Wer nur nach IP zählt und keine IP hat,
 *    zählt alle in denselben Topf — dann sperrt der erste Angreifer sämtliche
 *    Leser aus. Ohne erkennbare Herkunft wird deshalb pro Seite gezählt, nicht
 *    global. Ein globaler Zähler ohne Unterscheidung ist keine Sicherheit,
 *    sondern eine Selbstsperre.
 *
 * 2. **Den Richtigen mitzählen.** Gezählt werden nur **fehlgeschlagene**
 *    Versuche. Zählte man jeden Aufruf, sperrte sich eine viel gelesene
 *    öffentliche Seite von selbst — und der Fehler sähe aus wie ein Angriff.
 *
 * Und eine Sperre sagt immer, **wann es wieder geht**. Eine Meldung „zu viele
 * Versuche" ohne Zeitangabe ist eine Sackgasse; der Mensch weiss nicht, ob er
 * eine Minute oder einen Tag warten soll, und probiert es weiter — was die
 * Sperre verlängert, wenn man sie rollend baut. Deshalb ein **festes
 * Zeitfenster**: es ist berechenbar und läuft garantiert ab.
 * ==========================================================================*/

import type { Ablage, Anfrage } from '../typen.ts';

/** Was an einer Bremse einstellbar ist. Ohne Angabe gelten die Werte in
 *  `GRENZEN`. */
type BremsOpt = { grenze?: number; fensterMs?: number };

/** Die Herkunft der Anfrage, so gut sie erkennbar ist. */
export const herkunft = (anfrage: Partial<Anfrage> = {}) => {
  const kopf = anfrage.kopf || {};
  /* Cloudflare setzt cf-connecting-ip immer selbst und lässt sich darin nicht
     hineinreden. `x-forwarded-for` kann jeder senden — es ist deshalb nur die
     zweite Wahl und niemals der Grund, jemanden auszusperren. */
  return String(kopf['cf-connecting-ip'] ||
                String(kopf['x-forwarded-for'] || '').split(',')[0] || '').trim();
};

/**
 * Einen Fehlversuch zählen und sagen, ob noch einer erlaubt ist.
 *
 * @param schluessel  wofür gezählt wird, z. B. `pw:abc123:1.2.3.4`
 * @returns `wiederIn` in Sekunden
 */
export const zaehleFehlversuch = async (ablage: Ablage, schluessel: string,
                                        opt: BremsOpt = {}) => {
  const grenze = Number(opt.grenze) || 10;
  const fensterMs = Number(opt.fensterMs) || 10 * 60000;
  const jetztMs = Date.now();

  const alt = await ablage.hole('bremse', { schluessel });
  const seit = alt && alt.seit ? Date.parse(alt.seit) : 0;
  const imFenster = alt && seit && (jetztMs - seit) < fensterMs;

  const treffer = (imFenster ? Number(alt.treffer) || 0 : 0) + 1;
  const anfang = imFenster ? alt.seit : new Date(jetztMs).toISOString();

  await ablage.setze('bremse', { schluessel, treffer, seit: anfang });

  const endeMs = Date.parse(anfang) + fensterMs;
  return {
    erlaubt: treffer <= grenze,
    rest: Math.max(0, grenze - treffer),
    wiederIn: Math.max(1, Math.ceil((endeMs - jetztMs) / 1000))
  };
};

/**
 * Nachsehen, ohne zu zählen — für den Blick VOR dem Versuch.
 * Wer erst zählt und dann prüft, verbraucht dem Menschen einen Versuch
 * dafür, dass er gesperrt ist.
 */
export const istGesperrt = async (ablage: Ablage, schluessel: string,
                                  opt: BremsOpt = {}) => {
  const grenze = Number(opt.grenze) || 10;
  const fensterMs = Number(opt.fensterMs) || 10 * 60000;
  const jetztMs = Date.now();

  const alt = await ablage.hole('bremse', { schluessel });
  if (!alt) return { gesperrt: false, wiederIn: 0 };

  const seit = alt.seit ? Date.parse(alt.seit) : 0;
  if (!seit || (jetztMs - seit) >= fensterMs) return { gesperrt: false, wiederIn: 0 };

  const gesperrt = (Number(alt.treffer) || 0) >= grenze;
  return { gesperrt,
           wiederIn: gesperrt ? Math.max(1, Math.ceil((seit + fensterMs - jetztMs) / 1000)) : 0 };
};

/** Nach einem geglückten Versuch ist die Zählung erledigt. */
export const bremseLoesen = async (ablage: any, schluessel: string) => {
  try { await ablage.weg('bremse', { schluessel }); } catch { /* gab es nicht */ }
};

/**
 * Der Zählschlüssel für das Passwort einer öffentlichen Seite.
 *
 * OHNE ERKENNBARE HERKUNFT wird pro Seite gezählt statt global. Das ist der
 * Unterschied zwischen „diese eine Seite ist für zehn Minuten dicht" und
 * „der ganze Server ist für alle dicht" — und den zweiten Fall baut man sich
 * ein, wenn man ohne IP einen festen Text als Schlüssel nimmt.
 */
export const seitenSchluessel = (seitenKey: any, anfrage: any) => {
  const ip = herkunft(anfrage);
  return ip ? `pw:${seitenKey}:${ip}` : `pw:${seitenKey}`;
};

/* Die Zahlen. Sie stehen hier und nicht verstreut im Code, damit man sie an
   einem Ort ändern und begründen kann.

   Passwort: zehn Versuche in zehn Minuten. Wer sein eigenes Passwort sucht,
   braucht selten mehr als drei; wer rät, kommt damit auf 1440 Versuche am
   Tag statt auf Millionen.

   Gerätecode anfordern: dreissig in der Stunde. Ein Mensch fordert einen an,
   vielleicht dreimal, wenn etwas schiefgeht. Die Grenze steht gegen das
   Vollschreiben der Ablage, nicht gegen den Menschen.

   Nachfragen, ob der Code schon frei ist: das tut die App im Sekundentakt,
   solange das Fenster offen ist. Zehn Minuten Gültigkeit heissen bis zu 600
   ehrliche Anfragen. Die Grenze muss darüber liegen, sonst bremst sie genau
   den Vorgang aus, den sie schützen soll. */
export const GRENZEN = {
  passwort:   { grenze: 10, fensterMs: 10 * 60000 },
  codeNeu:    { grenze: 30, fensterMs: 60 * 60000 },
  codeFragen: { grenze: 900, fensterMs: 10 * 60000 }
};
