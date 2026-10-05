/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/schale/bedienung/linse.ts (npm run bauen:ts). */
/* ============================================================================
 * schale/bedienung/linse.ts — die wandernde Glaslinse, genau einmal definiert
 * ----------------------------------------------------------------------------
 * ERZEUGT DARAUS WIRD `quell/schale/bedienung/linse.js`.
 * Die Quelle ist DIESE Datei. `npm run bauen:ts` schreibt das .js; wer das
 * .js bearbeitet, verliert die Änderung beim nächsten Bauen (test105).
 * ----------------------------------------------------------------------------
 * WOFÜR. Redur hat am 20. September zwei Bildschirmaufnahmen geschickt: die
 * Apple-TV-App unter iOS 26 und GoodNotes. An der ersten hing sein Satz „ich
 * will die untere Übergang haben". Was dort passiert, ist nicht ein Kasten,
 * der springt, sondern eine LINSE, die wandert: sie vergrössert, was unter
 * ihr liegt, zieht es beim Fahren mit, wirft an ihrer Oberkante einen
 * Farbsaum und rastet am Ziel ein.
 *
 * Redion hatte die Hälfte davon schon. `#ho-pille` wandert seit E236 von
 * Reiter zu Reiter, und der Grund steht dort: „ein Hintergrund, der springt,
 * sagt ‚ein anderer Knopf' — einer, der wandert, sagt ‚derselbe Ort, weiter
 * vorn'." Diese Datei fügt hinzu, was fehlte: das GLAS.
 *
 * EINER, NICHT ZWEI (seit E646). Hier standen zwei Filter — einer für die
 * Ruhe, einer für die Fahrt —, weil ein Filterwert sich nicht animieren
 * lässt. Im Ruhezustand bricht die Fläche seit E646 gar nicht mehr: die
 * Brechung machte aus ihr einen hellen Ring, und `glass-morphing.md` sagt
 * „Blur is supporting material, not the animation itself". Gewechselt wird
 * jetzt zwischen KEINEM Filter und diesem einen, und das genügt.
 *
 * WARUM EINE EIGENE DATEI — und nicht nur CSS: eine Brechung braucht
 * `feDisplacementMap`, und das braucht einen `<filter id="…">`. Dieselbe
 * Antwort wie bei der Textur (E462): GENAU EINMAL global definieren und dann
 * referenzieren. Zwei Halter wären zwei gleiche Filter, und E440 hat am
 * KI-Funken gezeigt, was passiert, wenn mehrere Instanzen sich eine ID
 * teilen.
 *
 * DIE KARTE IST DER GANZE TRICK. `feDisplacementMap` liest ein Bild und
 * verschiebt jeden Bildpunkt um das, was dort im roten (waagerecht) und
 * grünen Kanal (senkrecht) steht. Grau — 128,128,128 — heisst „nicht
 * verschieben". Unsere Karte läuft von Rot am linken Rand nach Schwarz am
 * rechten und von Grün oben nach Schwarz unten; am Rand wird also nach
 * innen gegriffen, in der Mitte gar nicht. Das ist eine Lupe.
 *
 * DER FARBSAUM entsteht danach: derselbe gebrochene Inhalt wird dreimal
 * genommen, rot und blau um einen Hauch gegeneinander versetzt, und die
 * drei Kanäle werden wieder zusammengelegt. Echtes Glas tut genau das,
 * weil es Farben verschieden stark bricht.
 * ==========================================================================*/

const Linse = (() => {

  const NS = 'http://www.w3.org/2000/svg';
  const HALTER = 'ru-linse-halter';
  /* HIER STAND AUCH `RUHE` (E646). Seit die Fläche im Stillstand gar nicht
     mehr bricht, rief ihn niemand mehr — ein Filter, den kein Stilblatt
     nennt, ist eine Zeile, die aussieht, als täte sie etwas. Der Grund für
     zwei Filter war „ein Filterwert lässt sich nicht animieren"; jetzt
     wechselt die Pille zwischen KEINEM und diesem einen, und das genügt. */
  const FAHRT = 'ru-linse-fahrt';

  /* Die Karte als Bild. Sie wird auf die Grösse der Linse gezogen
     (`preserveAspectRatio="none"`), die Zahlen hier sind also nur ein
     Seitenverhältnis, keine Pixel. */
  const KARTE = 'data:image/svg+xml;utf8,' + encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' width='120' height='52'><defs>" +
    "<linearGradient id='x' x1='0' y1='0' x2='1' y2='0'>" +
      "<stop offset='0' stop-color='#f00'/><stop offset='1' stop-color='#000'/></linearGradient>" +
    "<linearGradient id='y' x1='0' y1='0' x2='0' y2='1'>" +
      "<stop offset='0' stop-color='#0f0'/><stop offset='1' stop-color='#000'/></linearGradient>" +
    "</defs><rect width='120' height='52' fill='#808080'/>" +
    "<rect width='120' height='52' fill='url(#x)' style='mix-blend-mode:screen'/>" +
    "<rect width='120' height='52' fill='url(#y)' style='mix-blend-mode:screen'/></svg>");

  const el = (name: string, werte: Record<string, string>): SVGElement => {
    const k = document.createElementNS(NS, name);
    for (const [n, w] of Object.entries(werte)) k.setAttribute(n, w);
    return k;
  };

  /** Ein Filter: Karte holen, weichzeichnen, damit verschieben, Farbsaum. */
  const glas = (id: string, weich: string, verschub: string, saum: string): SVGElement => {
    /* DER FILTERBEREICH IST GENAU DAS ELEMENT. Mit einem grösseren Bereich
       (etwa -30%/160%) läge die Karte verschoben über dem Glas, und heraus
       käme ein dunkler Balken quer durch die Linse statt einer Brechung.
       Am 20. September einmal gebaut und im Bild gesehen. */
    const f = el('filter', {
      id, x: '0%', y: '0%', width: '100%', height: '100%',
      'color-interpolation-filters': 'sRGB'
    });
    f.append(
      el('feImage', { href: KARTE, x: '0%', y: '0%', width: '100%', height: '100%',
                      preserveAspectRatio: 'none', result: 'k' }),
      el('feGaussianBlur', { in: 'k', stdDeviation: weich, result: 'kw' }),
      el('feDisplacementMap', { in: 'SourceGraphic', in2: 'kw', scale: verschub,
                                xChannelSelector: 'R', yChannelSelector: 'G', result: 'g' }),
      el('feOffset', { in: 'g', dx: saum, result: 'vr' }),
      el('feOffset', { in: 'g', dx: '-' + saum, result: 'vb' }),
      el('feColorMatrix', { in: 'vr', type: 'matrix', result: 'kr',
        values: '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0' }),
      el('feColorMatrix', { in: 'g', type: 'matrix', result: 'kg',
        values: '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0' }),
      el('feColorMatrix', { in: 'vb', type: 'matrix', result: 'kb',
        values: '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0' }),
      el('feBlend', { in: 'kr', in2: 'kg', mode: 'screen', result: 'krg' }),
      el('feBlend', { in: 'krg', in2: 'kb', mode: 'screen' })
    );
    return f;
  };

  /** Den Halter anlegen, falls es ihn noch nicht gibt. Mehrfach rufen ist
   *  ausdrücklich erlaubt — der zweite Ruf tut nichts. */
  const sicherstellen = (): void => {
    if (document.getElementById(HALTER)) return;
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('id', HALTER);
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    svg.setAttribute('width', '0');
    svg.setAttribute('height', '0');
    svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    const defs = document.createElementNS(NS, 'defs');
    /* ══ IM RUHEZUSTAND OPTISCH STILL (E641) ════════════════════════════
     * Hier stand 15, und das war messbar zu viel: bei 15 wird das Zeichen
     * unter der Linse sichtbar grösser. Das verbietet das Design-System
     * ausdrücklich — „Do not scale labels/icons with the material blob;
     * content should remain optically stable" —, und zwar mit gutem Grund:
     * eine untere Leiste ist kein Schaustück, sondern der Weg, den man
     * hundertmal am Tag geht.
     * 8 war beim Nachsehen am 19. September als „nichts zu sehen"
     * eingestuft worden. Genau das ist hier das Ziel: das Glas soll sich
     * am Rand zeigen, nicht den Inhalt vergrössern. Die Fahrt bleibt bei
     * 24 — dort erklärt die Verzerrung die Bewegung, und da gehört sie hin. */
    /* ══ 12, NICHT 24 (E646) ═══════════════════════════════════════════
     * Im Daumenkino der Fahrt war der Name UNTER der Linse nicht mehr zu
     * lesen: „Dokume", „Lern", „Termi" standen doppelt und verschmiert.
     * Bei 24 verschiebt die Karte jeden Bildpunkt um bis zu ±12 — das ist
     * ein Viertel der Höhe der Leiste.
     *
     * `recipes/dock-material-flow.md` sagt dazu genau einen Satz, und er
     * gilt ausdrücklich für diese Stelle:
     *
     *     „For mobile bottom navigation, avoid excessive liquid distortion;
     *      labels/icons must remain legible throughout."
     *
     * Bei 12 sind es ±6, und der Name bleibt lesbar, während die Linse
     * darüberläuft. Der Farbsaum geht von 0,55 auf 0,3 mit — er verdoppelt
     * sonst optisch, was die Verschiebung schon verzogen hat. */
    defs.append(glas(FAHRT, '9', '12', '0.3'));
    svg.append(defs);
    /* ══ DER HALTER LIEGT IN EINER HÜLLE (E649) ══════════════════════════
     * Hier stand `document.body.append(svg)`, und das hat `test272` rot
     * gemacht — vier Wochen nachdem die Zusage geschrieben wurde, die es
     * bricht.
     *
     * `fokus.ts` legt beim Öffnen eines Dialogs alles still, was daneben
     * im Körper steht, damit man nicht hinter die Fläche tabbt. Dabei
     * geht es die direkten Kinder durch und lässt aus, was kein
     * `HTMLElement` ist — und ein `<svg>` ist ein `SVGElement`. Es fiel
     * also durch. Der Wächter misst `.inert` über ALLE Kinder, und auf
     * einem `SVGElement` gibt es diese Eigenschaft gar nicht: `undefined`
     * ist falsch, und der Lauf war rot.
     *
     * ZWEI WEGE WÄREN GEGANGEN. Den Wächter lockern — er prüft strenger,
     * als die Gefahr ist, denn dieses `<svg>` ist `aria-hidden`, null
     * Pixel gross, `focusable="false"` und enthält nur `<defs>`. Oder den
     * Körper aufräumen, so dass die Zusage wieder ohne Ausnahme gilt.
     * Es ist der zweite geworden: eine Ausnahme im Wächter hätte jede
     * spätere gedeckt, und §55.2 warnt genau davor.
     *
     * DIE HÜLLE IST VON GEBURT AN STILLGELEGT, nicht erst wenn ein Dialog
     * aufgeht. Sie ist nie Inhalt — sie hält eine Ressource. `fokus.ts`
     * hat dafür schon den richtigen Zweig („fremden Zustand bewahren")
     * und fasst sie deshalb nie an. Auf die Filter wirkt das nicht:
     * `filter: url(#…)` schlägt die Kennung im ganzen Dokument nach, und
     * `inert` ändert weder Darstellung noch Auflösung.
     *
     * DER ZWEITE HALTER IST `textur.ts` (E462) und bekommt dieselben
     * vier Zeilen mit einem kurzen Verweis hierher. Bei zwei Haltern ist
     * das billiger als ein drittes Modul; beim dritten gehört es in einen
     * gemeinsamen Helfer unter `kern/helfer/`. */
    const huelle = document.createElement('div');
    huelle.setAttribute('aria-hidden', 'true');
    huelle.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    huelle.inert = true;
    huelle.append(svg);
    document.body.append(huelle);
  };

  return { HALTER, FAHRT, sicherstellen };
})();

(window as any).Linse = Linse;
