/* ============================================================================
 * server/sicherheit/kopfzeilen.js — was der Browser bei einer Antwort darf
 * ----------------------------------------------------------------------------
 * `oeffentlich/_headers` setzt diese Zeilen für die **Dateien** der App —
 * Cloudflare Pages liest das von selbst. Was dort nicht ankommt, sind die
 * Antworten des **Arbeiters**: `/api/…`, `/v1/…` und vor allem `/s/:schluessel`.
 *
 * DAS IST DIE LÜCKE, um die es hier geht. Die veröffentlichte Seite ist die
 * einzige Seite dieser App, die ein **fremder** Browser darstellt — und sie
 * bekam bisher nicht eine einzige Sicherheitskopfzeile.
 *
 * ─── WARUM DIE APP SELBST KEINE STRENGE CSP BEKOMMT ─────────────────────────
 *
 * Das wurde gemessen, bevor es entschieden wurde:
 *
 *   562  `style="…"`-Attribute im Quelltext    → braucht style-src 'unsafe-inline'
 *     2  Inline-<script> in index.html          → braucht script-src 'unsafe-inline'
 *        `new Function` in erweiterungen.js
 *        und ki/agenten.js                      → braucht 'unsafe-eval'
 *    20+ fremde Adressen (KI-Anbieter, Google,
 *        GitHub, Wikipedia, Ollama …), und der
 *        Mensch trägt eigene nach                → connect-src wäre nie vollständig
 *
 * Eine CSP mit `'unsafe-inline' 'unsafe-eval'` ist keine CSP, sondern eine
 * Zeile, die so aussieht. Die beiden `new Function` sind ausserdem **Absicht**:
 * dort läuft, was der Mensch selbst als Erweiterung oder Agent geschrieben
 * hat. Das ist der Zweck dieser Stellen, kein Versehen.
 *
 * Die App bekommt deshalb die Zeilen, die etwas bringen und nichts brechen —
 * und eine CSP erst dann, wenn die 562 Stilattribute weg sind. Das steht in
 * `LUECKEN.md` als eigene Aufgabe und nicht hier als halbe Lösung.
 *
 * ─── UND WARUM KEIN <meta http-equiv="Content-Security-Policy"> ─────────────
 *
 * Weil es dann auch für `file://` gälte. Redion läuft per Doppelklick auf
 * `index.html` — das ist der Kern der Sache, nicht eine Vorliebe. Eine CSP im
 * Dokument würde diesen Weg mitregeln, und zwar dort, wo es keinen Server
 * gibt, der sie anpassen könnte. Als Kopfzeile trifft sie nur, was wirklich
 * über einen Server geht.
 * ==========================================================================*/

/* Die Zeilen, die überall gelten und nichts kosten. */
const IMMER = {
  /* Den Dateityp nicht raten lassen — sonst wird aus einer hochgeladenen
     .txt mit HTML darin eine Seite, die im eigenen Ursprung läuft. */
  'X-Content-Type-Options': 'nosniff',
  /* Beim Weggehen nicht verraten, welche Seite man gelesen hat. Bei einer
     veröffentlichten Notiz steht die Adresse für den Inhalt. */
  'Referrer-Policy': 'no-referrer'
};

/**
 * Die CSP für eine veröffentlichte Seite.
 *
 * `default-src 'none'` schaltet alles ab, dann wird einzeln erlaubt. Das ist
 * dieselbe Entscheidung wie die Positivliste in `kern/sicherheit/saeubern.js`:
 * eine Negativliste hat immer ein Tag, an das niemand gedacht hat.
 *
 * **`script-src` bleibt bei `'none'`** — die Seite braucht kein einziges
 * Skript. Das ist der Teil, der wirklich zählt: `sauber()` auf dem Server
 * arbeitet mit regulären Ausdrücken statt mit einem Parser, und ein Parser
 * ist schwerer zu überlisten als ein Ausdruck. Falls dort je etwas
 * durchkommt, hält diese Zeile es auf.
 *
 * **`style-src 'unsafe-inline'` muss sein.** Die Seite bringt ihr Aussehen in
 * einem `<style>`-Block mit, und der Inhalt des Menschen darf `style="…"`
 * tragen. Ein Hash deckt Attribute nicht ab. Der Verlust ist gering: mit CSS
 * allein lässt sich kein Code ausführen.
 *
 * `frame-ancestors 'none'` ersetzt `X-Frame-Options` und kann mehr — es
 * verhindert, dass jemand die Seite in seine eigene einbettet und Klicks
 * darauf abfängt.
 */
const CSP_SEITE = [
  "default-src 'none'",
  "img-src 'self' data: https:",
  "style-src 'unsafe-inline'",
  "font-src 'self' data:",
  /* Das Passwortfeld schickt an dieselbe Adresse zurück. */
  "form-action 'self'",
  "base-uri 'none'",
  "frame-ancestors 'none'"
].join('; ');

/**
 * Die Sicherheitskopfzeilen für eine Antwort.
 *
 * @param {string} art  'seite' für eine veröffentlichte Seite, sonst 'api'
 * @returns {object}
 */
export const sicherheitsKopf = (art = 'api') => {
  if (art !== 'seite') return { ...IMMER };
  return { ...IMMER,
           'Content-Security-Policy': CSP_SEITE,
           /* Für Browser, die frame-ancestors noch nicht kennen. Doppelt
              gemoppelt ist hier richtig: die eine Zeile kostet nichts, und
              wer sie weglässt, merkt es nur auf einem alten Gerät. */
           'X-Frame-Options': 'DENY' };
};

/**
 * Die Zeilen an eine fertige Antwort hängen — ohne zu überschreiben, was der
 * Kern selbst gesetzt hat.
 *
 * Das ist die Richtung, auf die es ankommt: eine Hülle, die vorhandene
 * Kopfzeilen ÜBERSCHRIEBE, könnte eine bewusst gesetzte Regel still ersetzen.
 * Sie darf nur ergänzen.
 */
export const mitSicherheitsKopf = (antwort) => {
  if (!antwort || !antwort.kopf) return antwort;
  const typ = String(antwort.kopf['Content-Type'] || '');
  const art = typ.includes('text/html') ? 'seite' : 'api';

  const neu = { ...antwort.kopf };
  for (const [name, wert] of Object.entries(sicherheitsKopf(art)))
    if (!(name in neu)) neu[name] = wert;

  return { ...antwort, kopf: neu };
};
