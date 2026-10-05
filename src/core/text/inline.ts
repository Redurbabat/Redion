/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/core/text/inline.ts (npm run bauen:ts). */
/* ============================================================================
 * core/text/inline.ts — Auszeichnung im Fliesstext, in beide Richtungen
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/core/text/inline.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/core/text/inline.js`.
 * ----------------------------------------------------------------------------
 * REIN: keine Uhr, keine Ablage, kein DOM. Herein kommt Redions Blocktext,
 * heraus kommen LÄUFE — Stücke mit ihren Eigenschaften.
 *
 * ─── WOFÜR ──────────────────────────────────────────────────────────────────
 *
 * Der Word-Export schrieb bis E315 den ROHEN Blocktext:
 *
 *     `<w:r><w:t>${esc(text)}</w:t></w:r>`   ausgeben.ts:321
 *
 * In Word stand danach `**fett**` wörtlich da, mit Sternchen. Wer eine
 * Arbeit abgibt, gibt sie so ab. Der Einleser hat dieselbe Lücke in der
 * Gegenrichtung: er sammelt `w:t` und wirft `w:rPr` weg.
 *
 * ─── WARUM EIN EIGENER KERN UND NICHT ZWEIMAL EIN AUSDRUCK ──────────────────
 *
 * Weil es zwei Richtungen sind und sie zueinander passen müssen. Steht die
 * Regel zweimal da, laufen sie auseinander, und der Rundlauf verliert
 * genau das, was die eine kann und die andere nicht — gemerkt hätte man es
 * an der abgegebenen Datei. Dieselbe Begründung wie bei `core/slides`
 * (E297).
 *
 * ─── WAS ERKANNT WIRD, UND WAS NICHT ────────────────────────────────────────
 *
 *   **fett**      __fett__       fett
 *   *kursiv*      _kursiv_       kursiv
 *   `code`                       feste Breite
 *   ~~durch~~                    durchgestrichen
 *   [Text](Ziel)                 Verweis mit Ziel
 *   [[Seite]]  [[Seite|Text]]    Verweis auf eine Redion-Seite
 *
 * NICHT erkannt wird Verschachteltes über eine Ebene hinaus — `**a *b* c**`
 * gibt einen fetten Lauf mit dem Text `a *b* c`. Das ist Absicht: eine
 * vollständige Auszeichnungssprache wäre ein Parser mit eigenem Baum, und
 * für den Weg nach Word bringt sie nichts, was ein Mensch bemerkt.
 * ==========================================================================*/

const Inline = (() => {

  type Lauf = {
    text: string;
    fett?: boolean;
    kursiv?: boolean;
    code?: boolean;
    durch?: boolean;
    /** Bei einem Verweis: wohin. Leer heisst „kein Verweis". */
    ziel?: string;
  };

  /**
   * Die Reihenfolge ist Bedeutung.
   *
   * `**` muss vor `*` stehen, sonst frisst der einfache Stern die erste
   * Hälfte des doppelten und macht aus `**fett**` ein kursives `*fett*`.
   * Dasselbe für `__` vor `_`.
   */
  const MUSTER: ReadonlyArray<readonly [RegExp, (m: RegExpExecArray) => Lauf]> = [
    [/^`([^`]+)`/,                 m => ({ text: m[1] as string, code: true })],
    [/^\*\*([\s\S]+?)\*\*/,        m => ({ text: m[1] as string, fett: true })],
    [/^__([\s\S]+?)__/,            m => ({ text: m[1] as string, fett: true })],
    [/^~~([\s\S]+?)~~/,            m => ({ text: m[1] as string, durch: true })],
    [/^\*([^*\n]+)\*/,             m => ({ text: m[1] as string, kursiv: true })],
    [/^_([^_\n]+)_/,               m => ({ text: m[1] as string, kursiv: true })],
    [/^\[\[([^\]|]+)\|([^\]]+)\]\]/, m => ({ text: m[2] as string, ziel: m[1] as string })],
    [/^\[\[([^\]|]+)\]\]/,         m => ({ text: m[1] as string, ziel: m[1] as string })],
    [/^\[([^\]]*)\]\(([^)]*)\)/,   m => ({ text: m[1] as string, ziel: m[2] as string })]
  ];

  /** Text in Läufe zerlegen. Ohne Auszeichnung ist es genau einer. */
  const lesen = (roh: unknown): Lauf[] => {
    const text = String(roh ?? '');
    if (!text) return [];
    const raus: Lauf[] = [];
    let rest = text;
    let klar = '';
    const klarWeg = (): void => { if (klar) { raus.push({ text: klar }); klar = ''; } };

    while (rest) {
      let getroffen = false;
      for (const [re, bau] of MUSTER) {
        const m = re.exec(rest);
        if (!m || !m[0]) continue;
        klarWeg();
        raus.push(bau(m));
        rest = rest.slice(m[0].length);
        getroffen = true;
        break;
      }
      if (!getroffen) { klar += rest[0]; rest = rest.slice(1); }
    }
    klarWeg();
    return raus;
  };

  /**
   * Läufe zurück in Redions Text.
   *
   * Die Gegenrichtung von `lesen`, und sie muss es wirklich sein: was der
   * Word-Einleser findet, kommt so wieder in einen Block. `lesen(schreiben(x))`
   * gibt dieselben Läufe — test309 misst es über einen ganzen Satz Beispiele.
   */
  const schreiben = (laeufe: Lauf[]): string => (laeufe || []).map(l => {
    let t = String(l?.text ?? '');
    if (!t) return '';
    /* Code zuerst und allein: in fester Breite gilt keine weitere
       Auszeichnung, und ein `**` darin wäre wörtlich gemeint. */
    if (l.code) return '`' + t + '`';
    if (l.durch)  t = '~~' + t + '~~';
    if (l.fett)   t = '**' + t + '**';
    if (l.kursiv) t = '*' + t + '*';
    if (l.ziel) {
      /* Ein Ziel, das genauso heisst wie der Text, ist ein Seitenverweis —
         die kurze Form ist die, die auch ein Mensch schreibt. */
      t = l.ziel === t ? '[[' + t + ']]' : '[' + t + '](' + l.ziel + ')';
    }
    return t;
  }).join('');

  /** Ohne jede Auszeichnung — für Stellen, die nur Text vertragen. */
  const nurText = (roh: unknown): string =>
    lesen(roh).map(l => l.text).join('');

  return { lesen, schreiben, nurText, MUSTER };
})();

(window as any).Inline = Inline;
