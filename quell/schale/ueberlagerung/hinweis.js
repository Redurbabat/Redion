/* ============================================================================
 * schale/ueberlagerung/hinweis.js — Toast und Banner
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

  let toastTimer = null;

  const toast = (text, dauer) => {
    const t = document.getElementById('toast');
    t.textContent = text;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), dauer || 2600);
    return {
      set textContent(v) { if (t.classList.contains('show')) t.textContent = v; },
      get textContent() { return t.textContent; },
      remove() { clearTimeout(toastTimer); t.classList.remove('show'); }
    };
  };

  /** Die Emoji-Auswahl mit Suchfeld liegt in notion.js. */
  const banner = (text, art = 'warn') => {
    document.getElementById('banner')?.remove();
    const d = document.createElement('div');
    d.id = 'banner';
    d.className = 'banner ' + art;
    d.innerHTML = `<span>${String(text)}</span><button title="Ausblenden">✕</button>`;
    d.querySelector('button').addEventListener('click', () => d.remove());
    document.body.appendChild(d);
    return d;
  };


  return { toast, banner };
})();

window.Hinweis = Hinweis;
