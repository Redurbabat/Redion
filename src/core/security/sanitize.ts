/* ============================================================================
 * core/security/sanitize.ts — fremdes HTML entschärfen
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/core/security/sanitize.ts`. `npm run bauen:ts` schreibt
 * daraus `quell/core/security/sanitize.js`. Wer das .js bearbeitet, verliert
 * die Änderung beim nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es
 * vorher.
 * ----------------------------------------------------------------------------
 * Redion nimmt HTML von aussen an: aus der Zwischenablage, aus dem
 * Web-Clipper, aus importierten Dateien, aus Einbettungen. Jedes davon ist
 * eine Tür, durch die fremder Code hereinkommen kann.
 *
 * Die Regel hier ist eine **Positivliste**: erlaubt ist, was aufgezählt ist.
 * Eine Negativliste wäre bequemer und ist der klassische Fehler — es gibt
 * immer ein Tag, an das niemand gedacht hat, und ein Angreifer braucht nur
 * eines.
 *
 * Was hier nie durchkommt:
 *
 *   · <script>, <style>, <iframe>, <object>, <embed>, <form>, <link>,
 *     <meta>, <base> — samt Inhalt, nicht nur das Tag
 *   · jedes on…-Attribut (onclick, onerror, onload …)
 *   · javascript:, vbscript: und data: in Adressen — ausser data:image/…
 *   · srcdoc, formaction, xlink:href
 *
 * Derselbe Gedanke steht auch im Server (`server/kern.js`). Das ist Absicht:
 * eine Prüfung, die nur an einer Stelle sitzt, fällt weg, sobald jemand die
 * andere Tür benutzt.
 *
 * ─── SPRACHE ────────────────────────────────────────────────────────────────
 *
 * Namen englisch, Erklärungen deutsch — `ENTSCHEIDUNGEN.md` E27. Aus
 * `Saeubern` wurde `Sanitize`. Gemessen zehn Aufrufe in drei Dateien
 * (`editor.js`, `mail.js`, `werkzeuge.js`) und siebzehn in Prüfläufen —
 * weniger als bei `Melder`.
 *
 *   html → html                nurText → textOnly
 *   alsText → escapeText       alsAttribut → escapeAttribute
 *   adresse → url              adresseOk → urlOk
 *   anhangAdresse → attachmentUrl
 *   rahmenAdresse → frameUrl   dateiname → fileName
 *   RAUS_MIT_INHALT → DROP_WITH_CONTENT     ATTRIBUTE → ATTRIBUTES
 *
 * **Drei Prüfungen lesen den Quelltext**, nicht das Verhalten: `test91`
 * verlangt, dass `editor.js` wirklich `attachmentUrl`/`frameUrl` ruft, dass
 * `mail.js` `textOnly` ruft und `werkzeuge.js` `url`. Sie sind mitgezogen —
 * ohne das hätten sie nach dem Umzug eine Zeichenkette gesucht, die es nicht
 * mehr gibt, und wären rot geworden, ohne dass etwas kaputt war.
 *
 * ─── WARUM UNTER `security/` UND NICHT UNTER `helpers/` ─────────────────────
 *
 * Weil es kein Helfer ist. Was hier schiefgeht, ist kein Schönheitsfehler,
 * sondern fremder Code im Ursprung der Seite — mit Zugriff auf alle Notizen
 * und den KI-Schlüssel. Der Ordner sagt das, und `tsconfig.bauen.json` und
 * `test105` wurden dafür erweitert: der Prüflauf sieht jetzt alles unter
 * `src/core/` ausser den Typen, nicht mehr nur `helpers/`.
 * ==========================================================================*/

interface SanitizeOptions {
  tags?: Set<string>;
  attributes?: Record<string, string[]>;
}

const Sanitize = (() => {

  /* Erlaubte Tags — bewusst knapp. Was hier fehlt, wird zu seinem Textinhalt. */
  const TAGS = new Set([
    'p','br','hr','div','span','section','article',
    'h1','h2','h3','h4','h5','h6',
    'b','strong','i','em','u','s','strike','del','ins','mark','sub','sup','small',
    'ul','ol','li','dl','dt','dd',
    'blockquote','pre','code','kbd','samp','var',
    'a','img','figure','figcaption',
    'table','thead','tbody','tfoot','tr','th','td','caption','colgroup','col',
    'details','summary','abbr','time','cite','q'
  ]);

  /* Tags, die samt Inhalt verschwinden. Ein <script> ohne Inhalt zu lassen
     wäre die halbe Arbeit — der Inhalt ist ja das Problem. */
  const DROP_WITH_CONTENT = new Set([
    'script','style','iframe','object','embed','form','link','meta','base',
    'noscript','template','svg','math','applet','frame','frameset'
  ]);

  const ATTRIBUTES: Record<string, string[]> = {
    '*':    ['title', 'lang', 'dir'],
    a:      ['href', 'target', 'rel'],
    img:    ['src', 'alt', 'width', 'height'],
    td:     ['colspan', 'rowspan'],
    th:     ['colspan', 'rowspan', 'scope'],
    time:   ['datetime'],
    col:    ['span'],
    ol:     ['start', 'type']
  };

  const BAD_SCHEME = /^\s*(javascript|vbscript|file|about)\s*:/i;

  /** Ist diese Adresse harmlos? */
  const urlOk = (wert: unknown): boolean => {
    const w = String(wert || '').replace(/[\x00-\x1f\s]+/g, '');
    if (!w) return false;
    if (BAD_SCHEME.test(w)) return false;
    /* data: nur für Bilder — alles andere ist ein Versteck für Code. */
    if (/^data:/i.test(w)) return /^data:image\/(png|jpe?g|gif|webp|avif|bmp);base64,/i.test(w);
    return true;
  };

  /**
   * HTML säubern.
   * `opt` dient nur dem **Verschärfen** — eine engere Tagliste, engere
   * Attribute. Weiter aufmachen kann man damit auch, und das ist Absicht:
   * wer es tut, schreibt es an seiner Aufrufstelle hin.
   */
  const html = (roh: unknown, opt: SanitizeOptions = {}): string => {
    const allowedTags = opt.tags || TAGS;
    const allowedAttr = opt.attributes || ATTRIBUTES;

    const template = document.createElement('template');
    template.innerHTML = String(roh ?? '');

    const walk = (node: Node): void => {
      [...node.childNodes].forEach(k => {
        if (k.nodeType === 8) { (k as ChildNode).remove(); return; }   /* Kommentare */
        if (k.nodeType !== 1) return;                                   /* Text bleibt */

        const el = k as Element;
        const name = el.tagName.toLowerCase();

        if (DROP_WITH_CONTENT.has(name)) { el.remove(); return; }

        if (!allowedTags.has(name)) {
          /* Unbekanntes Tag: der Inhalt bleibt, die Hülle fällt weg. Sonst
             verliert man beim Import ganze Absätze, weil ein <section> nicht
             in der Liste stand. */
          walk(el);
          const parent = el.parentNode;
          while (el.firstChild && parent) parent.insertBefore(el.firstChild, el);
          el.remove();
          return;
        }

        const allowed = new Set([...(allowedAttr['*'] || []), ...(allowedAttr[name] || [])]);
        [...el.attributes].forEach(a => {
          const an = a.name.toLowerCase();
          if (an.startsWith('on')) { el.removeAttribute(a.name); return; }
          if (an === 'srcdoc' || an === 'formaction' || an === 'xlink:href') {
            el.removeAttribute(a.name); return;
          }
          /* Stil ist erlaubt, aber ohne url() und ohne Ausdrücke. */
          if (an === 'style') {
            const s = String(a.value || '');
            if (/url\s*\(|expression\s*\(|javascript:/i.test(s)) el.removeAttribute(a.name);
            return;
          }
          if (!allowed.has(an)) { el.removeAttribute(a.name); return; }
          if ((an === 'href' || an === 'src') && !urlOk(a.value)) el.removeAttribute(a.name);
        });

        /* Ein Link nach draussen bekommt rel="noopener" — sonst kann die
           Zielseite über window.opener zurückgreifen. */
        if (name === 'a' && el.getAttribute('target') === '_blank')
          el.setAttribute('rel', 'noopener noreferrer');

        walk(el);
      });
    };

    walk(template.content);
    return template.innerHTML;
  };

  /** Alles Markup weg, nur der Text bleibt. */
  const textOnly = (roh: unknown): string => {
    const v = document.createElement('template');
    v.innerHTML = String(roh ?? '');
    DROP_WITH_CONTENT.forEach(t =>
      [...v.content.querySelectorAll(t)].forEach(e => e.remove()));
    return (v.content.textContent || '').replace(/\s+\n/g, '\n').trim();
  };

  /** Für Text, der in eine HTML-Zeichenkette eingesetzt wird. */
  const escapeText = (s: unknown): string => String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  /** Für einen Wert, der in ein Attribut kommt. */
  const escapeAttribute = (s: unknown): string => escapeText(s).replace(/`/g, '&#96;');

  /**
   * Eine Adresse prüfen, bevor sie irgendwo landet.
   * Gibt die Adresse zurück — oder '' wenn sie nichts taugt.
   */
  const url = (wert: unknown): string => urlOk(wert) ? String(wert).trim() : '';

  /* --------------------------------------------------------------------------
   * ZWEI ADRESSEN, DIE `url` NICHT ABDECKT
   * --------------------------------------------------------------------------
   * `url` lässt `data:` nur für Bilder durch. Für einen Anhang ist das zu
   * streng: die App hat keinen Server, auf den sie eine Datei legen könnte,
   * also liegt jeder Anhang als `data:application/pdf`, `data:application/zip`
   * oder `data:text/csv` im Speicher. Wer dort `url` nimmt, wirft jeden
   * Anhang weg — und „nichts wegwerfen, was nach Inhalt aussieht" ist keine
   * Nebenregel dieses Projekts.
   *
   * Für einen Rahmen ist `url` dagegen zu grosszügig. Ein `<iframe>` mit
   * `src="javascript:…"` läuft **im Ursprung der Seite**, mit vollem Zugriff
   * auf alle Notizen und den KI-Schlüssel. Nachgestellt und bestätigt: aus dem
   * Rahmen heraus war `parent` erreichbar.
   *
   * Und genau dorthin führte ein Weg, den man nicht sieht: ob ein Anhang als
   * PDF vorgeführt wird, entscheidet in `editor.js` allein die **Endung**.
   * `javascript:…//.pdf` sieht für diese Prüfung wie ein PDF aus — die zwei
   * Schrägstriche sind in JavaScript der Beginn eines Kommentars, der Rest der
   * Adresse also blosse Zierde. Ein Anhang, den niemand anklickt, führte damit
   * Code aus, sobald die Vorschau aufging.
   * ----------------------------------------------------------------------- */

  /**
   * Für ein Ziel, das ein Mensch anklickt: Link, Lesezeichen, Anhang.
   *
   * ES WIRD DAS SCHEMA GELESEN, NICHT NACH WÖRTERN GESUCHT. Der erste Versuch
   * hier prüfte, ob irgendwo vorne „javascript" steht — und sperrte damit eine
   * Datei namens `javascriptbuch.pdf`, ein `filezilla-handbuch.pdf` und ein
   * `about-uns.html`. Eine Sicherheitsprüfung, die Anhänge verschluckt, ist
   * kein Gewinn: sie tauscht einen seltenen Angriff gegen einen täglichen
   * Datenverlust. Gefährlich ist nur, was **vor dem Doppelpunkt** steht.
   */
  const attachmentUrl = (wert: unknown): string => {
    const roh = String(wert || '').trim();
    if (!roh) return '';
    /* Leerraum und Steuerzeichen weg, bevor das Schema gelesen wird:
       `java\nscript:` ist für den Browser dasselbe wie `javascript:`. */
    const ohneLeer = roh.replace(/[\s\x00-\x1f]/g, '');
    const m = ohneLeer.match(/^([a-z][a-z0-9+.-]*):/i);
    if (!m) return roh;                    /* kein Schema → relativ, harmlos */
    const scheme = String(m[1]).toLowerCase();
    if (['javascript', 'vbscript', 'file', 'about'].includes(scheme)) return '';
    /* `data:` ja — jeder Anhang liegt so im Speicher. Nur nicht als HTML und
       nicht als SVG: beides kann Code tragen. */
    if (scheme === 'data' && /^data:(text\/html|image\/svg)/i.test(ohneLeer)) return '';
    return roh;
  };

  /** Für einen Rahmen. Streng, weil er im Ursprung der Seite läuft. */
  const frameUrl = (wert: unknown): string => {
    const w = String(wert || '').replace(/[\x00-\x1f\s]/g, '');
    if (!w) return '';
    /* Positivliste, wie oben bei den Tags: erlaubt ist, was aufgezählt ist.
       Ein PDF darf hinein, weil die Vorschau genau dafür da ist. */
    if (/^https?:\/\//i.test(w)) return String(wert).trim();
    if (/^blob:/i.test(w)) return String(wert).trim();
    if (/^data:application\/pdf[;,]/i.test(w)) return String(wert).trim();
    return '';
  };

  /** Ein Dateiname ohne Wege darin — verhindert ../../ beim Export. */
  const fileName = (s: unknown): string => String(s ?? 'ohne-namen')
    .replace(/[\/\\:*?"<>|\x00-\x1f]/g, '-')
    .replace(/^\.+/, '')
    .slice(0, 120) || 'ohne-namen';

  /**
   * EINE FARBE, DIE IN EINEN STRING DARF (E473).
   *
   * Der Fund, der sie nötig machte: `Register.fachzeichen.alsSvg` BAUT
   * seinen SVG-Text (`stroke="${farbe}"`) und `marken.ts` setzt ihn mit
   * `innerHTML` ein. Die Farbe kommt aus `mark.farbe` — also aus einem
   * Block, und ein Block kommt aus einer `.redion`, die jemand anders
   * geschrieben haben kann. Ein Wert wie `#000" onload="…` schliesst das
   * Attribut und hängt ein Ereignis an; bei `innerHTML` feuert es.
   *
   * Erlaubt ist deshalb nur, was wie eine Farbe aussieht: ein Hex-Wert,
   * eine der Funktionen mit Zahlen darin, oder ein blosses Wort (die
   * benannten Farben, `currentColor`, `transparent`, `none`). Alles andere
   * gibt '' — der Aufrufer nimmt dann seinen Rückfall.
   *
   * Wer eine Farbe per `setAttribute` oder `style` setzt, braucht das
   * nicht: dort ist sie ein Wert und kein Text.
   */
  const farbe = (wert: unknown): string => {
    const w = String(wert ?? '').trim();
    if (!w || w.length > 64) return '';
    if (/^#[0-9a-f]{3,8}$/i.test(w)) return w;
    if (/^(rgb|rgba|hsl|hsla)\(\s*[-0-9.,%\s/]+\)$/i.test(w)) return w;
    if (/^[a-z]+$/i.test(w)) return w;
    return '';
  };

  return { html, textOnly, escapeText, escapeAttribute, url, urlOk,
           attachmentUrl, frameUrl, fileName, farbe,
           TAGS, DROP_WITH_CONTENT, ATTRIBUTES };
})();

(window as any).Sanitize = Sanitize;
