/* ============================================================================
 * ablage.js — Eines in die Zwischenablage legen, und dabei die Wahrheit sagen
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/kern/helfer/ablage.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/kern/helfer/ablage.js`. Wer das .js bearbeitet, verliert die Änderung
 * beim nächsten Bauen; `pruefungen/lauf/test105.mts` meldet es vorher.
 * ----------------------------------------------------------------------------
 * DER GRUND, WARUM ES DIESE DATEI GIBT
 *
 * An dreissig Stellen stand dasselbe Muster:
 *
 *     navigator.clipboard?.writeText(irgendwas);
 *     UI.toast('Link kopiert');
 *
 * Zwei Dinge stimmen daran nicht.
 *
 * ERSTENS ist `writeText` ein Versprechen, das brechen kann — kein Recht,
 * kein Fokus im Fenster, kein Nutzerklick davor, ein älterer Browser. Ohne
 * `.catch` wird daraus eine unbehandelte Ablehnung: in der Konsole, nicht
 * vor den Augen dessen, der gerade kopiert hat.
 *
 * ZWEITENS meldet der Toast danach trotzdem Erfolg. Der Mensch geht weg,
 * fügt woanders ein — und bekommt, was vorher in der Ablage lag. Das ist
 * die schlimmste Sorte Fehler: still, plausibel, falsch. Dieselbe Sorte
 * wie die abgeschnittene Zahl aus CLAUDE.md §55.2.
 *
 * GEMESSEN am 8. August, in Chromium: `writeText` wirft sowohl unter
 * `file://` als auch unter `http://localhost`, wenn dem Fenster das Recht
 * fehlt — und `document.execCommand('copy')` geht in beiden Fällen. Der
 * alte Weg ist also kein Notnagel für alte Browser, sondern der, der
 * häufiger ankommt. Deshalb ist er hier nicht der zweite, sondern der
 * gleichberechtigte zweite Versuch.
 *
 * WAS DIESE DATEI NICHT TUT: lesen. Aus der Zwischenablage zu lesen
 * braucht eine ausdrückliche Erlaubnis und ist etwas ganz anderes als
 * hineinzuschreiben. Redion liest über das `paste`-Ereignis, und das
 * bringt seinen Inhalt selbst mit.
 * ==========================================================================*/

const Ablage = (() => {

  /**
   * Der alte Weg: ein unsichtbares Feld, markieren, kopieren lassen.
   *
   * Er läuft ohne Rechteabfrage, weil er nichts anderes ist als das, was
   * ein Mensch mit Strg C täte. Deshalb geht er auch dort, wo `writeText`
   * abgewiesen wird.
   */
  const ueberFeld = (text: string): boolean => {
    try {
      const feld = document.createElement('textarea');
      feld.value = text;
      /* Ausserhalb des Bildes, aber IM Dokument — ein Feld, das nicht
         gezeichnet wird, lässt sich nicht markieren. `position:fixed`
         statt `left:-9999px` allein, damit die Seite nicht seitlich
         wächst und der Bildlauf springt. */
      feld.setAttribute('readonly', '');
      feld.style.cssText = 'position:fixed; top:0; left:-9999px; opacity:0';
      document.body.appendChild(feld);

      /* Was vorher markiert war und wo der Cursor stand, gehört dem
         Menschen — nachher steht beides wieder da.

         BEIDES, nicht nur die Markierung. `select()` holt den Fokus in
         das Hilfsfeld; nach `remove()` landet er sonst beim `body`, und
         wer gerade mitten in einem Block schrieb, tippt danach ins Leere.
         Die Markierung allein zurückzulegen sieht richtig aus und ist es
         nicht: der Strich blinkt, und die Tastatur kommt nicht an. */
      const vorher = document.getSelection()?.rangeCount
        ? document.getSelection()!.getRangeAt(0) : null;
      const warAktiv = document.activeElement instanceof HTMLElement
        ? document.activeElement : null;

      feld.select();
      feld.setSelectionRange(0, text.length);
      const ging = document.execCommand('copy');
      feld.remove();

      if (warAktiv && warAktiv !== feld) { try { warAktiv.focus(); } catch {} }
      if (vorher) {
        const s = document.getSelection();
        s?.removeAllRanges();
        s?.addRange(vorher);
      }
      return ging;
    } catch { return false; }
  };

  /**
   * Text in die Zwischenablage legen. Gibt zurück, ob es geklappt hat —
   * und meldet es dem Menschen, wenn eine Meldung mitgegeben wurde.
   *
   * `meldung` ist der Satz für den Erfolgsfall („Link kopiert"). Im
   * Fehlerfall steht ein eigener Satz da, denn „Link kopiert" wäre dann
   * eine Unwahrheit — und genau die soll diese Datei abschaffen.
   *
   * OHNE `meldung` schweigt der Helfer ganz. Die Regel dahinter: er sagt
   * nur etwas, wenn ihm jemand etwas zu sagen mitgegeben hat. Wer selbst
   * meldet — weil er mehr weiss, etwa dass Redion den Text auch intern
   * gemerkt hat — bekommt sonst zwei Hinweise übereinander.
   */
  const kopiere = async (text: unknown, meldung?: string): Promise<boolean> => {
    const t = String(text ?? '');

    let ging = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(t);
        ging = true;
      }
    } catch {
      /* Kein Grund zur Aufregung — der zweite Versuch kommt gleich.
         Gefangen wird hier nur, damit daraus keine unbehandelte
         Ablehnung wird. */
    }
    if (!ging) ging = ueberFeld(t);

    if (meldung && typeof UI !== 'undefined' && UI.toast) {
      UI.toast(ging ? meldung
                    : 'Der Browser lässt das Kopieren nicht zu — bitte von Hand markieren.');
    }
    return ging;
  };

  /**
   * Für Aufrufer, die nicht warten wollen oder können.
   *
   * Der Unterschied zu einem blossen `void kopiere(...)`: die Ablehnung
   * ist hier gefangen. Ein `void` auf ein Versprechen ohne `.catch` ist
   * genau der Fehler, den diese Datei behebt.
   */
  const kopiereJetzt = (text: unknown, meldung?: string): void => {
    kopiere(text, meldung).catch(() => {});
  };

  return { kopiere, kopiereJetzt, ueberFeld };
})();

(window as any).Ablage = Ablage;
