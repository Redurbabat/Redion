/* ============================================================================
 * register/symbole.js — die Zeichen der Oberfläche
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/register/symbole.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/register/symbole.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
 * WARUM DAS HIER STEHT UND NICHT ALS EMOJI IM MARKUP.
 *
 * Die Seitenleiste trug 🔍 ⌘ ☀️ 🎓 🧱 📚 ☑ 📥 ✚ ⭱ 🗑 ✨ ✎ — und das ist der
 * eine Unterschied, den jeder sofort sieht, ohne ihn benennen zu können:
 *
 *   · Emoji sind BILDER, keine Zeichen. Sie tragen ihre eigene Farbe, ihre
 *     eigene Strichstärke und ihre eigene Anmutung. Neben einer Schrift in
 *     `--text-dim` sieht ein farbiges 🎓 aus wie ein Aufkleber.
 *   · Sie sehen auf jedem System anders aus. Dasselbe ☑ ist auf Windows
 *     schmal und grau, auf einem Apfelgerät blau und rund. Eine Oberfläche,
 *     die auf zwei Rechnern verschieden aussieht, ist keine.
 *   · Sie lassen sich nicht ausrichten. Ein 🔍 sitzt tiefer als ein ⌘, und
 *     kein Abstand der Welt bringt beide auf eine Linie.
 *
 * Diese Zeichen sind Striche in `currentColor`. Sie nehmen die Farbe ihrer
 * Zeile an, sie haben überall dieselbe Stärke, und sie sitzen auf demselben
 * Raster.
 *
 * WAS EMOJI BLEIBT (§71 des Auftrags): alles, was der MENSCH gesetzt hat.
 * Das Zeichen einer Seite, das Symbol einer Vorlage, der Haken in einer
 * Aufgabenliste, die jemand selbst angelegt hat. Das ist sein Inhalt und
 * nicht Redions Oberfläche.
 *
 * DAS RASTER. Jedes Zeichen lebt in 24 × 24 und wird auf 18 gezeichnet.
 * Strichstärke 1,7 — dünn genug für Ruhe, dick genug, dass es auf einem
 * Bildschirm ohne Verdopplung nicht verschwindet. Runde Enden und Ecken,
 * weil die Schrift daneben auch rund ist.
 * ==========================================================================*/

(window as any).Register = (window as any).Register || {};

Register.symbole = (() => {

  /** Der Innenteil eines Zeichens — alles ausser dem `<svg>` selbst. */
  type Zeichnung = string;

  /* ------------------------------------------------------------------------
   * DIE ZEICHEN
   * ------------------------------------------------------------------------
   * Englische Namen, weil es Code ist (§53.1). Was der Mensch liest, steht
   * daneben als `aria-label` an der Stelle, die das Zeichen benutzt — ein
   * Zeichen allein sagt nichts, und ein Vorleseprogramm liest keine Striche.
   * ----------------------------------------------------------------------*/
  const ZEICHEN: Record<string, Zeichnung> = {

    /* --- Navigation ------------------------------------------------------ */
    search:    '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>',
    command:   '<path d="M9 6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3z"/>',
    today:     '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2' +
               'M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M18.8 5.2l-1.4 1.4M6.6 17.4l-1.4 1.4"/>',
    learn:     '<path d="M12 4 2.5 8.5 12 13l9.5-4.5z"/><path d="M6.5 10.8v4.4c0 .5 2.5 2.3 5.5 2.3' +
               's5.5-1.8 5.5-2.3v-4.4"/><path d="M21.5 8.5v5"/>',
    workspace: '<rect x="3" y="3" width="7.5" height="7.5" rx="1.6"/>' +
               '<rect x="13.5" y="3" width="7.5" height="7.5" rx="1.6"/>' +
               '<rect x="3" y="13.5" width="7.5" height="7.5" rx="1.6"/>' +
               '<rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.6"/>',
    library:   '<path d="M4 4.5h5.2A2.8 2.8 0 0 1 12 7.3v12a2.4 2.4 0 0 0-2.4-2.4H4z"/>' +
               '<path d="M20 4.5h-5.2A2.8 2.8 0 0 0 12 7.3v12a2.4 2.4 0 0 1 2.4-2.4H20z"/>',
    tasks:     '<rect x="3.5" y="3.5" width="17" height="17" rx="3.2"/><path d="m8 12.2 2.6 2.6L16.4 9"/>',
    inbox:     '<path d="M3.5 13.5h4l1.6 2.6h5.8l1.6-2.6h4"/>' +
               '<path d="M6 4.5h12l3 9v4.2a2.8 2.8 0 0 1-2.8 2.8H5.8A2.8 2.8 0 0 1 3 17.7V13.5z"/>',
    plus:      '<path d="M12 5v14M5 12h14"/>',
    home:      '<path d="m3.5 10.4 8.5-6.6 8.5 6.6"/>' +
               '<path d="M5.8 9.2v9.2a2 2 0 0 0 2 2h8.4a2 2 0 0 0 2-2V9.2"/>' +
               '<path d="M10 20.4v-5.6h4v5.6"/>',
    chat:      '<path d="M20.5 12.2c0 4-3.8 7.2-8.5 7.2a9.8 9.8 0 0 1-2.7-.37L4.2 20.5l1.3-3.6' +
               'A6.8 6.8 0 0 1 3.5 12.2C3.5 8.2 7.3 5 12 5s8.5 3.2 8.5 7.2z"/>',
    mic:       '<rect x="9" y="2.8" width="6" height="11.4" rx="3"/>' +
               '<path d="M5.5 11.5a6.5 6.5 0 0 0 13 0"/><path d="M12 18v3.2M8.8 21.2h6.4"/>',
    upload:    '<path d="M12 15.5V3.8"/><path d="m7.8 8 4.2-4.2L16.2 8"/>' +
               '<path d="M4 15v3.6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V15"/>',
    trash:     '<path d="M3.8 6.2h16.4"/><path d="M9.5 6.2V4.4a1.4 1.4 0 0 1 1.4-1.4h2.2a1.4 1.4 0 0 1 1.4 1.4v1.8"/>' +
               '<path d="M6.2 6.2 7 19.6a2 2 0 0 0 2 1.9h6a2 2 0 0 0 2-1.9l.8-13.4"/>' +
               '<path d="M10.4 10.2v7M13.6 10.2v7"/>',
    help:      '<circle cx="12" cy="12" r="9"/>' +
               '<path d="M9.4 9.3a2.7 2.7 0 0 1 5.2.9c0 1.8-2.6 2.2-2.6 4"/>' +
               '<path d="M12 17.4h.01"/>',
    sparkle:   '<path d="M12 3.2 13.7 9l5.8 1.7-5.8 1.7L12 18.2l-1.7-5.8L4.5 10.7 10.3 9z"/>' +
               '<path d="M18.6 3v3.2M17 4.6h3.2"/>',
    pencil:    '<path d="M16.5 3.9a2.1 2.1 0 0 1 3 3L8.9 17.5l-4 1 1-4z"/><path d="M14.6 5.8l3 3"/>',

    /* --- Werkzeuge der Seitenleiste --------------------------------------- */
    calendar:  '<rect x="3.2" y="5" width="17.6" height="16" rx="2.6"/>' +
               '<path d="M3.2 10h17.6M8.2 3v4M15.8 3v4"/>',
    bolt:      '<path d="M13.2 2.5 4.5 13.4h6.2l-.9 8.1 8.7-10.9h-6.2z"/>',
    puzzle:    '<path d="M9.4 3.2h2.1a1.9 1.9 0 0 1 1.9 1.9 1.4 1.4 0 0 0 2.8 0 1.9 1.9 0 0 1 1.9-1.9' +
               'h1.5v4.2a1.4 1.4 0 0 0 0 2.8v4.2h-4.2a1.4 1.4 0 0 1-2.8 0H8.4v-4.2a1.4 1.4 0 0 0 0-2.8z"/>',
    graph:     '<circle cx="12" cy="5.4" r="2.4"/><circle cx="5.2" cy="17" r="2.4"/>' +
               '<circle cx="18.8" cy="17" r="2.4"/><path d="m10.6 7.5-4 7.4M13.4 7.5l4 7.4M7.6 17h8.8"/>',
    tag:       '<path d="M11.4 3.2H20a.8.8 0 0 1 .8.8v8.6a1.6 1.6 0 0 1-.47 1.13l-6.8 6.8' +
               'a1.6 1.6 0 0 1-2.26 0l-7.53-7.53a1.6 1.6 0 0 1 0-2.26l6.8-6.8A1.6 1.6 0 0 1 11.4 3.2z"/>' +
               '<path d="M16.6 7.4h.01"/>',
    cards:     '<rect x="7.5" y="3.5" width="13" height="13" rx="2.2"/>' +
               '<path d="M16.5 20.5H6a2.5 2.5 0 0 1-2.5-2.5V7.5"/>',
    checkCircle: '<circle cx="12" cy="12" r="9"/><path d="m8.2 12.4 2.6 2.6 5-5.4"/>',

    /* --- Bereiche des Lernens -------------------------------------------- */
    compass:   '<circle cx="12" cy="12" r="9"/><path d="m15.2 8.8-1.9 4.5-4.5 1.9 1.9-4.5z"/>',
    clipboard: '<rect x="4.6" y="4.4" width="14.8" height="16.4" rx="2.4"/>' +
               '<path d="M9 4.4V3.6a1.6 1.6 0 0 1 1.6-1.6h2.8A1.6 1.6 0 0 1 15 3.6v.8"/>' +
               '<path d="m8.8 12.6 2 2 4.4-4.4"/>',
    building:  '<path d="M3 20.6h18"/><path d="m12 3.4 8 4.4H4z"/>' +
               '<path d="M6.4 11v6.4M10.1 11v6.4M13.9 11v6.4M17.6 11v6.4"/>',
    briefcase: '<rect x="2.8" y="7.2" width="18.4" height="13" rx="2.4"/>' +
               '<path d="M8.6 7.2V5.4a2 2 0 0 1 2-2h2.8a2 2 0 0 1 2 2v1.8"/>' +
               '<path d="M2.8 12.6h18.4"/>',
    chart:     '<path d="M3.6 20.4h16.8"/><path d="M6.6 20.4v-6M11 20.4V7.6M15.4 20.4v-4M19.8 20.4V11"/>',

    /* --- Kopfleiste ------------------------------------------------------ */
    share:     '<path d="M4 12v6.6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V12"/>' +
               '<path d="M12 15.2V3.6"/><path d="m8 7.4 4-3.8 4 3.8"/>',
    history:   '<path d="M3.6 12a8.4 8.4 0 1 0 2.5-6"/><path d="M3.4 3.6v4.2h4.2"/>' +
               '<path d="M12 7.6V12l3 1.8"/>',
    link:      '<path d="M10.3 13.7a4.2 4.2 0 0 0 6.1.35l2.6-2.6a4.2 4.2 0 0 0-5.94-5.94l-1.5 1.5"/>' +
               '<path d="M13.7 10.3a4.2 4.2 0 0 0-6.1-.35L5 12.55a4.2 4.2 0 0 0 5.94 5.94l1.5-1.5"/>',
    lockOpen:  '<rect x="4.2" y="10.4" width="15.6" height="10.4" rx="2.4"/>' +
               '<path d="M8.2 10.4V7a3.8 3.8 0 0 1 7.4-1.2"/>',
    lock:      '<rect x="4.2" y="10.4" width="15.6" height="10.4" rx="2.4"/>' +
               '<path d="M8.2 10.4V7a3.8 3.8 0 0 1 7.6 0v3.4"/>',
    star:      '<path d="m12 3.4 2.7 5.6 6.1.85-4.4 4.3 1.05 6.1L12 17.4l-5.45 2.85 1.05-6.1' +
               '-4.4-4.3 6.1-.85z"/>',
    dots:      '<circle cx="5.4" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/>' +
               '<circle cx="18.6" cy="12" r="1.5"/>',
    arrowL:    '<path d="M20 12H4.4"/><path d="m10 5.6-6 6.4 6 6.4"/>',
    arrowR:    '<path d="M4 12h15.6"/><path d="m14 5.6 6 6.4-6 6.4"/>',

    bell:      '<path d="M18 9a6 6 0 1 0-12 0c0 5.2-2 6.7-2 6.7h16S18 14.2 18 9z"/>' +
               '<path d="M13.7 19.2a2 2 0 0 1-3.4 0"/>',
    settings:  '<circle cx="12" cy="12" r="3.1"/>' +
               '<path d="M19.5 14.6a1.5 1.5 0 0 0 .3 1.7l.06.05a1.8 1.8 0 1 1-2.6 2.6l-.05-.06' +
               'a1.5 1.5 0 0 0-1.7-.3 1.5 1.5 0 0 0-.9 1.37v.14a1.8 1.8 0 1 1-3.6 0v-.07' +
               'a1.5 1.5 0 0 0-1-1.37 1.5 1.5 0 0 0-1.7.3l-.05.06a1.8 1.8 0 1 1-2.6-2.6l.06-.05' +
               'a1.5 1.5 0 0 0 .3-1.7 1.5 1.5 0 0 0-1.37-.9H4.5a1.8 1.8 0 1 1 0-3.6h.07' +
               'a1.5 1.5 0 0 0 1.37-1 1.5 1.5 0 0 0-.3-1.7l-.06-.05a1.8 1.8 0 1 1 2.6-2.6l.05.06' +
               'a1.5 1.5 0 0 0 1.7.3h.07a1.5 1.5 0 0 0 .9-1.37V4.5a1.8 1.8 0 1 1 3.6 0v.07' +
               'a1.5 1.5 0 0 0 .9 1.37 1.5 1.5 0 0 0 1.7-.3l.05-.06a1.8 1.8 0 1 1 2.6 2.6l-.06.05' +
               'a1.5 1.5 0 0 0-.3 1.7v.07a1.5 1.5 0 0 0 1.37.9h.14a1.8 1.8 0 1 1 0 3.6h-.07' +
               'a1.5 1.5 0 0 0-1.37.9z"/>',
    user:      '<circle cx="12" cy="8.2" r="3.9"/><path d="M4.6 20.4a7.6 7.6 0 0 1 14.8 0"/>',
    menu:      '<path d="M3.8 6.5h16.4M3.8 12h16.4M3.8 17.5h16.4"/>',
    close:     '<path d="M6 6l12 12M18 6L6 18"/>',
    chevronL:  '<path d="m14.5 5.5-6.5 6.5 6.5 6.5"/>',
    chevronR:  '<path d="m9.5 5.5 6.5 6.5-6.5 6.5"/>',
    chevronD:  '<path d="m5.5 9.5 6.5 6.5 6.5-6.5"/>',
    panelL:    '<rect x="3" y="4.5" width="18" height="15" rx="2.6"/><path d="M9.5 4.5v15"/>',
    panelR:    '<rect x="3" y="4.5" width="18" height="15" rx="2.6"/><path d="M14.5 4.5v15"/>'
  };

  /* ------------------------------------------------------------------------
   * AUSGABE
   * ----------------------------------------------------------------------*/

  const hat = (id: string): boolean =>
    Object.prototype.hasOwnProperty.call(ZEICHEN, id);

  /**
   * Ein Zeichen als fertiges `<svg>`.
   *
   * `aria-hidden` ist Absicht und keine Nachlässigkeit: das Zeichen steht
   * IMMER neben einem Namen oder an einem Knopf mit `aria-label`. Ein
   * Vorleseprogramm, das zusätzlich „Grafik" sagt, macht die Zeile länger
   * und nicht klarer (§38).
   */
  const alsSvg = (id: string, groesse = 18): string => {
    const d = ZEICHEN[id];
    if (!d) return '';
    return `<svg class="sym" viewBox="0 0 24 24" width="${groesse}" height="${groesse}" ` +
      `fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" ` +
      `stroke-linejoin="round" aria-hidden="true" focusable="false">${d}</svg>`;
  };

  /**
   * Jedes `[data-sym]` unter `wurzel` mit seinem Zeichen füllen.
   *
   * EIN UNBEKANNTER NAME LÄSST DIE STELLE LEER, und das ist Absicht: ein
   * Fragezeichen oder ein Kästchen sähe aus wie ein Zeichen und wäre keins.
   * Der Prüflauf sucht nach leeren Stellen; das Auge übersieht sie.
   */
  const fuelle = (wurzel: ParentNode = document): number => {
    let gesetzt = 0;
    wurzel.querySelectorAll<HTMLElement>('[data-sym]').forEach(el => {
      const id = el.dataset.sym || '';
      const gr = Number(el.dataset.symGroesse || '') || 18;
      const svg = alsSvg(id, gr);
      if (!svg) { console.warn('[Symbole] unbekannt:', id); return; }
      el.innerHTML = svg;
      gesetzt++;
    });
    return gesetzt;
  };

  const alle = (): string[] => Object.keys(ZEICHEN).sort();

  return { hat, alsSvg, fuelle, alle };
})();
