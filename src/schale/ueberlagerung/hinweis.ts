/* ============================================================================
 * schale/ueberlagerung/hinweis.js — Toast und Banner
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/schale/ueberlagerung/hinweis.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/schale/ueberlagerung/hinweis.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
 * Zwei Arten, etwas zu sagen, und sie werden gern verwechselt:
 *
 *   **Toast** — verschwindet von selbst. Für Bestätigungen: „Gespeichert",
 *   „3 Zeilen gelöscht". Wer ihn verpasst, hat nichts verpasst.
 *
 *   **Banner** — bleibt, bis jemand ihn wegklickt. Für Dinge, die man wissen
 *   muss: „Der Speicher ist hier gesperrt", „Der Schlüssel passt nicht".
 *
 * Ein Toast für etwas Wichtiges ist der häufigste Fehler in Oberflächen: die
 * Meldung erscheint, während man woanders hinsieht, und ist weg, bevor man
 * sie liest.
 * ==========================================================================*/

const Hinweis = (() => {

  let toastTimer: ReturnType<typeof setTimeout> | undefined;

  /* ------------------------------------------------------------------------
   * EIN FUND DES UMZUGS. Hier stand `document.getElementById('toast')` und
   * danach sofort `t.textContent = text` — ohne nachzusehen, ob es das
   * Element gibt.
   *
   * Meistens gibt es das. Aber `UI.toast` wird aus dreihundert Stellen
   * gerufen, auch aus welchen, die vor dem Aufbau der Schale laufen oder
   * wenn sie gar nicht da ist. Dort wirft die Zeile — und der Aufrufer
   * bricht mitten in seiner Arbeit ab, obwohl er nur etwas SAGEN wollte.
   *
   * Eine Meldung darf niemals das kaputtmachen, worüber sie berichtet.
   * Fehlt das Element, geht die Meldung in die Konsole und der Griff, den
   * `toast` zurückgibt, tut nichts — statt beim ersten Anfassen zu werfen.
   * ----------------------------------------------------------------------*/
  const toast = (text: unknown, dauer?: number) => {
    const t = document.getElementById('toast');
    if (!t) {
      console.info('[Hinweis]', String(text));
      return { textContent: String(text ?? ''), remove() { /* nichts zu tun */ } };
    }
    t.textContent = String(text ?? '');
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), dauer || 2600);
    return {
      set textContent(v: string) { if (t.classList.contains('show')) t.textContent = v; },
      get textContent() { return t.textContent || ''; },
      remove() { clearTimeout(toastTimer); t.classList.remove('show'); }
    };
  };

  /** Die Emoji-Auswahl mit Suchfeld liegt in notion.js. */
  const banner = (text: unknown, art = 'warn'): HTMLDivElement => {
    document.getElementById('banner')?.remove();
    const d = document.createElement('div');
    d.id = 'banner';
    d.className = 'banner ' + art;
    d.innerHTML = `<span>${String(text)}</span><button title="Ausblenden">✕</button>`;
    d.querySelector('button')?.addEventListener('click', () => d.remove());
    document.body.appendChild(d);
    return d;
  };


  return { toast, banner };
})();

(window as any).Hinweis = Hinweis;
