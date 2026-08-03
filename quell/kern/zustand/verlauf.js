/* ============================================================================
 * apps/schreiben/verlauf/dienst.js — aus notion.js herausgelöst
 * ----------------------------------------------------------------------------
 * Stammt aus der früheren Sammeldatei notion.js. Der Inhalt ist unverändert;
 * nur der Ort ist jetzt der, an dem man ihn sucht.
 * ==========================================================================*/

const Verlauf = (() => {

  const zurueckStapel = [];
  const vorStapel = [];
  const MAX = 60;
  let letzte = 0;
  let sperre = false;

  const momentaufnahme = () => {
    const id = App.aktuelleSeite();
    if (!id) return null;
    const p = Store.getBlock(id);
    if (!p || p.locked) return null;
    return { pageId: id, daten: Store.baum(id) };
  };

  /** Vor einer Änderung aufrufen. Häuft nicht bei jedem Tastendruck an. */
  const merke = (erzwingen = false) => {
    if (sperre) return;
    const jetzt = Date.now();
    if (!erzwingen && jetzt - letzte < 700) return;
    const m = momentaufnahme();
    if (!m) return;
    letzte = jetzt;
    zurueckStapel.push(m);
    if (zurueckStapel.length > MAX) zurueckStapel.shift();
    vorStapel.length = 0;
  };

  const anwenden = (m) => {
    sperre = true;
    const p = Store.getBlock(m.pageId);
    if (!p) { sperre = false; return; }
    Store.kinderLeeren(m.pageId);
    (m.daten.kinder || []).forEach(k => Store.baumEinfuegen(k, m.pageId));
    Store.updateBlock(m.pageId, { text: m.daten.text, icon: m.daten.icon });
    if (App.aktuelleSeite() !== m.pageId) App.oeffne(m.pageId);
    else { App.zeichneSeite(); App.zeichneBaum(); }
    sperre = false;
  };

  const zurueck = () => {
    if (!zurueckStapel.length) { UI.toast('Nichts mehr rückgängig zu machen'); return; }
    const jetzt = momentaufnahme();
    const m = zurueckStapel.pop();
    if (jetzt) vorStapel.push(jetzt);
    anwenden(m);
    UI.toast('Rückgängig');
  };

  const vor = () => {
    if (!vorStapel.length) { UI.toast('Nichts zu wiederholen'); return; }
    const jetzt = momentaufnahme();
    const m = vorStapel.pop();
    if (jetzt) zurueckStapel.push(jetzt);
    anwenden(m);
    UI.toast('Wiederholt');
  };

  /** Hängt sich an die Speicherfunktionen, damit jede Änderung erfasst wird. */
  const start = () => {
    ['updateBlock', 'addBlock', 'trashBlock', 'purgeBlock', 'setProp', 'addDatabase', 'addRow']
      .forEach(name => {
        const original = Store[name];
        Store[name] = function (...args) {
          merke(false);
          return original.apply(Store, args);
        };
      });
  };

  return { start, merke, zurueck, vor, leeren: () => { zurueckStapel.length = 0; vorStapel.length = 0; } };
})();
window.Verlauf = Verlauf;


/* ==========================================================================
 * 2. DIE SCHWEBENDE AUSWAHLLEISTE
 * ========================================================================*/
