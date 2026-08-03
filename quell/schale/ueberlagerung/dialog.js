/* ============================================================================
 * schale/ueberlagerung/dialog.js — die Frage mit einem Eingabefeld
 * ----------------------------------------------------------------------------
 * Ersetzt `prompt()`. Nicht aus Schönheit: das eingebaute `prompt` hält den
 * ganzen Browser an, sieht in jedem System anders aus, lässt sich nicht mit
 * Esc abbrechen, ohne dass Text verlorengeht — und in mancher Umgebung ist es
 * abgeschaltet, dann steht die App ohne Erklärung.
 *
 * Gibt ein Versprechen zurück: der Text, oder null beim Abbrechen. Null und
 * leerer Text sind ausdrücklich verschieden — „nichts eingegeben" ist eine
 * andere Antwort als „abgebrochen".
 * ==========================================================================*/

const Dialog = (() => {

  const frage = (titel, vorgabe = '') => new Promise(ok => {
    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML =
      '<div class="finder" style="width:min(460px,94vw)">' +
        `<div class="fh">${titel}</div>` +
        `<div style="padding:16px 18px"><input id="fq" value="${String(vorgabe).replace(/"/g, '&quot;')}" ` +
        'style="width:100%; padding:10px 12px; background:var(--bg-input); border:1px solid var(--line); ' +
        'border-radius:8px; outline:none; font-size:15px"></div>' +
        '<div class="fbtns"><button data-a="ok" class="prim">Übernehmen</button>' +
        '<button data-a="zu">Abbrechen</button></div></div>';
    document.body.appendChild(o);
    const inp = o.querySelector('#fq');
    const fertig = (wert) => { o.remove(); ok(wert); };
    o.addEventListener('click', e => {
      if (e.target.closest('[data-a="ok"]')) fertig(inp.value);
      else if (e.target.closest('[data-a="zu"]') || e.target === o) fertig(null);
    });
    inp.addEventListener('keydown', e => {
      if (e.key === 'Enter') fertig(inp.value);
      if (e.key === 'Escape') fertig(null);
    });
    inp.focus(); inp.select();
  });

  /** Ein Streifen oben, wenn etwas grundsätzlich klemmt. */

  return { frage };
})();

window.Dialog = Dialog;
