/* ============================================================================
 * kern/sicherheit/saeubern.js — fremdes HTML entschärfen
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
 * ==========================================================================*/

const Saeubern = (() => {

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
  const RAUS_MIT_INHALT = new Set([
    'script','style','iframe','object','embed','form','link','meta','base',
    'noscript','template','svg','math','applet','frame','frameset'
  ]);

  const ATTRIBUTE = {
    '*':    ['title', 'lang', 'dir'],
    a:      ['href', 'target', 'rel'],
    img:    ['src', 'alt', 'width', 'height'],
    td:     ['colspan', 'rowspan'],
    th:     ['colspan', 'rowspan', 'scope'],
    time:   ['datetime'],
    col:    ['span'],
    ol:     ['start', 'type']
  };

  const BOESE_ADRESSE = /^\s*(javascript|vbscript|file|about)\s*:/i;

  /** Ist diese Adresse harmlos? */
  const adresseOk = (wert) => {
    const w = String(wert || '').replace(/[\x00-\x1f\s]+/g, '');
    if (!w) return false;
    if (BOESE_ADRESSE.test(w)) return false;
    /* data: nur für Bilder — alles andere ist ein Versteck für Code. */
    if (/^data:/i.test(w)) return /^data:image\/(png|jpe?g|gif|webp|avif|bmp);base64,/i.test(w);
    return true;
  };

  /**
   * HTML säubern.
   * @param {string} html
   * @param {Object} [opt]  { tags:Set, attribute:Object } zum Verschärfen
   * @returns {string}
   */
  const html = (roh, opt = {}) => {
    const erlaubteTags = opt.tags || TAGS;
    const erlaubteAttr = opt.attribute || ATTRIBUTE;

    const vorlage = document.createElement('template');
    vorlage.innerHTML = String(roh ?? '');

    const gehe = (knoten) => {
      [...knoten.childNodes].forEach(k => {
        if (k.nodeType === 8) { k.remove(); return; }          /* Kommentare */
        if (k.nodeType !== 1) return;                           /* Text bleibt */

        const name = k.tagName.toLowerCase();

        if (RAUS_MIT_INHALT.has(name)) { k.remove(); return; }

        if (!erlaubteTags.has(name)) {
          /* Unbekanntes Tag: der Inhalt bleibt, die Hülle fällt weg. Sonst
             verliert man beim Import ganze Absätze, weil ein <section> nicht
             in der Liste stand. */
          gehe(k);
          const eltern = k.parentNode;
          while (k.firstChild) eltern.insertBefore(k.firstChild, k);
          k.remove();
          return;
        }

        const erlaubt = new Set([...(erlaubteAttr['*'] || []), ...(erlaubteAttr[name] || [])]);
        [...k.attributes].forEach(a => {
          const an = a.name.toLowerCase();
          if (an.startsWith('on')) { k.removeAttribute(a.name); return; }
          if (an === 'srcdoc' || an === 'formaction' || an === 'xlink:href') {
            k.removeAttribute(a.name); return;
          }
          /* Stil ist erlaubt, aber ohne url() und ohne Ausdrücke. */
          if (an === 'style') {
            const s = String(a.value || '');
            if (/url\s*\(|expression\s*\(|javascript:/i.test(s)) k.removeAttribute(a.name);
            return;
          }
          if (!erlaubt.has(an)) { k.removeAttribute(a.name); return; }
          if ((an === 'href' || an === 'src') && !adresseOk(a.value)) k.removeAttribute(a.name);
        });

        /* Ein Link nach draussen bekommt rel="noopener" — sonst kann die
           Zielseite über window.opener zurückgreifen. */
        if (name === 'a' && k.getAttribute('target') === '_blank')
          k.setAttribute('rel', 'noopener noreferrer');

        gehe(k);
      });
    };

    gehe(vorlage.content);
    return vorlage.innerHTML;
  };

  /** Alles Markup weg, nur der Text bleibt. */
  const nurText = (roh) => {
    const v = document.createElement('template');
    v.innerHTML = String(roh ?? '');
    RAUS_MIT_INHALT.forEach(t =>
      [...v.content.querySelectorAll(t)].forEach(e => e.remove()));
    return (v.content.textContent || '').replace(/\s+\n/g, '\n').trim();
  };

  /** Für Text, der in eine HTML-Zeichenkette eingesetzt wird. */
  const alsText = (s) => String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  /** Für einen Wert, der in ein Attribut kommt. */
  const alsAttribut = (s) => alsText(s).replace(/`/g, '&#96;');

  /**
   * Eine Adresse prüfen, bevor sie irgendwo landet.
   * @returns {string} die Adresse — oder '' wenn sie nichts taugt
   */
  const adresse = (wert) => adresseOk(wert) ? String(wert).trim() : '';

  /* --------------------------------------------------------------------------
   * ZWEI ADRESSEN, DIE `adresse` NICHT ABDECKT
   * --------------------------------------------------------------------------
   * `adresse` lässt `data:` nur für Bilder durch. Für einen Anhang ist das zu
   * streng: die App hat keinen Server, auf den sie eine Datei legen könnte,
   * also liegt jeder Anhang als `data:application/pdf`, `data:application/zip`
   * oder `data:text/csv` im Speicher. Wer dort `adresse` nimmt, wirft jeden
   * Anhang weg — und „nichts wegwerfen, was nach Inhalt aussieht" ist keine
   * Nebenregel dieses Projekts.
   *
   * Für einen Rahmen ist `adresse` dagegen zu grosszügig. Ein `<iframe>` mit
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
  const anhangAdresse = (wert) => {
    const roh = String(wert || '').trim();
    if (!roh) return '';
    /* Leerraum und Steuerzeichen weg, bevor das Schema gelesen wird:
       `java\nscript:` ist für den Browser dasselbe wie `javascript:`. */
    const ohneLeer = roh.replace(/[\s\x00-\x1f]/g, '');
    const m = ohneLeer.match(/^([a-z][a-z0-9+.-]*):/i);
    if (!m) return roh;                    /* kein Schema → relativ, harmlos */
    const schema = m[1].toLowerCase();
    if (['javascript', 'vbscript', 'file', 'about'].includes(schema)) return '';
    /* `data:` ja — jeder Anhang liegt so im Speicher. Nur nicht als HTML und
       nicht als SVG: beides kann Code tragen. */
    if (schema === 'data' && /^data:(text\/html|image\/svg)/i.test(ohneLeer)) return '';
    return roh;
  };

  /** Für einen Rahmen. Streng, weil er im Ursprung der Seite läuft. */
  const rahmenAdresse = (wert) => {
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
  const dateiname = (s) => String(s ?? 'ohne-namen')
    .replace(/[\/\\:*?"<>|\x00-\x1f]/g, '-')
    .replace(/^\.+/, '')
    .slice(0, 120) || 'ohne-namen';

  return { html, nurText, alsText, alsAttribut, adresse, adresseOk,
           anhangAdresse, rahmenAdresse, dateiname,
           TAGS, RAUS_MIT_INHALT, ATTRIBUTE };
})();

window.Saeubern = Saeubern;
