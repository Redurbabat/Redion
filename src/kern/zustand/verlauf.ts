/* ============================================================================
 * kern/zustand/verlauf.js — Rückgängig und Wiederholen
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/kern/zustand/verlauf.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/kern/zustand/verlauf.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
 * Stammt aus der früheren Sammeldatei notion.js.
 *
 * ─── WIE ES ARBEITET ────────────────────────────────────────────────────────
 *
 * Zwei Stapel und eine ganze Seite je Schritt. Das ist grob — ein Editor, der
 * einzelne Zeichen zurücknimmt, führt Buch über Änderungen, nicht über
 * Zustände. Dafür ist es unbestechlich: was zurückkommt, ist die Seite, wie
 * sie war, und nicht die Seite, wie eine Kette von Rücknahmen sie meint.
 *
 * Deshalb der Zaun bei 700 ms und der Deckel bei 60 Schritten. Ohne den Zaun
 * hätte jeder Tastendruck seinen eigenen Stapeleintrag, und sechzig Schritte
 * zurück wären sechzig Buchstaben.
 *
 * `sperre` verhindert das Naheliegende: Zurücknehmen schreibt in den Speicher,
 * der Speicher ruft `merke`, und das Zurückgenommene stünde sofort wieder als
 * Schritt im Stapel.
 *
 * ─── RÜCKGÄNGIG ÄNDERT INHALT, NICHT IDENTITÄT (E684) ───────────────────
 *
 * Ein Schnappschuss ist ein Zustand — aber zurückgesetzt wird über die
 * KENNUNG: `Store.baumAbgleichen` setzt jeden Block, den es noch gibt, an
 * Ort und Stelle auf das Bild, legt weg, was nur hier stand (Papierkorb),
 * und holt mit alter Kennung zurück, was nur im Bild steht. Unterseiten und
 * Zeilen sind dabei Blätter: ihr Dasein und ihr Platz, nie ihr Inneres.
 * Vorher wurde die Seite abgerissen und neu gebaut; test569 hält, was das
 * kostete.
 * ==========================================================================*/

type VerlaufAufnahme = { pageId: string; daten: any };

const Verlauf = (() => {

  const zurueckStapel: VerlaufAufnahme[] = [];
  const vorStapel: VerlaufAufnahme[] = [];
  const MAX = 60;
  let letzte = 0;
  let sperre = false;

  const momentaufnahme = (): VerlaufAufnahme | null => {
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

  const anwenden = (m: VerlaufAufnahme): void => {
    sperre = true;
    const p = Store.getBlock(m.pageId);
    if (!p) { sperre = false; return; }
    /* Eine gesperrte Seite rührt der Verlauf nicht an — `momentaufnahme`
       schützt nur die OFFENE Seite, der Stapel kann eine tragen, die seither
       gesperrt wurde (E684). */
    if (p.locked) { sperre = false; return; }
    /* ABGLEICHEN, NICHT ABREISSEN (E684, L212). Bis hierher stand hier
       `kinderLeeren` + `baumEinfuegen`: jedes Kind gepurgt, jedes mit frischer
       Kennung neu — eine Unterseite verlor dabei Kennung und Fassungen. */
    Store.baumAbgleichen(m.pageId, m.daten);
    Store.updateBlock(m.pageId, { text: m.daten.text, icon: m.daten.icon });
    if (App.aktuelleSeite() !== m.pageId) App.oeffne(m.pageId);
    else { App.zeichneSeite(); App.zeichneBaum(); }
    sperre = false;
  };

  /* ------------------------------------------------------------------------
   * `pop()` gibt `VerlaufAufnahme | undefined`, und zwar zu Recht: die Länge
   * eine Zeile weiter oben zu prüfen und dann zu ziehen sind zwei Schritte,
   * zwischen denen theoretisch etwas passieren kann. Vorher stand hier
   * `anwenden(m)` ohne Nachsehen — und `anwenden` griff sofort auf
   * `m.pageId` zu. Die Prüfung kostet eine Zeile.
   * ----------------------------------------------------------------------*/
  const zurueck = (): void => {
    const m = zurueckStapel.pop();
    if (!m) { UI.toast('Nichts mehr rückgängig zu machen'); return; }
    const jetzt = momentaufnahme();
    if (jetzt) vorStapel.push(jetzt);
    anwenden(m);
    UI.toast('Rückgängig');
  };

  const vor = (): void => {
    const m = vorStapel.pop();
    if (!m) { UI.toast('Nichts zu wiederholen'); return; }
    const jetzt = momentaufnahme();
    if (jetzt) zurueckStapel.push(jetzt);
    anwenden(m);
    UI.toast('Wiederholt');
  };

  /** Hängt sich an die Speicherfunktionen, damit jede Änderung erfasst wird. */
  const start = (): void => {
    ['updateBlock', 'addBlock', 'trashBlock', 'purgeBlock', 'setProp', 'addDatabase', 'addRow']
      .forEach(name => {
        const original = (Store as Record<string, any>)[name];
        (Store as Record<string, any>)[name] = function (...args: unknown[]) {
          merke(false);
          return original.apply(Store, args);
        };
      });
  };

  return {
    start, merke, zurueck, vor,
    leeren: (): void => { zurueckStapel.length = 0; vorStapel.length = 0; }
  };
})();

(window as any).Verlauf = Verlauf;
