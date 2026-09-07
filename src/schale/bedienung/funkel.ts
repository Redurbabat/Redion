/* ============================================================================
 * schale/bedienung/funkel.ts — der dunkle Knopf, dessen Buchstaben glimmen
 * ----------------------------------------------------------------------------
 * ERZEUGT DARAUS WIRD `quell/schale/bedienung/funkel.js`.
 * Die Quelle ist DIESE Datei. `npm run bauen:ts` schreibt das .js; wer das
 * .js bearbeitet, verliert die Änderung beim nächsten Bauen (test105).
 * ----------------------------------------------------------------------------
 * WOFÜR. Drei Knöpfe in Redion versprechen, dass gleich etwas GEBAUT wird:
 * „Datenbank bauen" und „Seite aufbauen" im KI-Fenster, „Lernen starten"
 * in der Lernwelt. Sie standen bisher in derselben Farbe wie „Übersetzen"
 * und „Zusammenfassen" daneben — und sahen damit nach derselben Grösse
 * von Handlung aus. Sind sie nicht: die einen schreiben eine Antwort, die
 * anderen legen Strukturen an.
 *
 * WOHER. Redurs Vorgabe `.btn` vom 6. September 2026
 * (`loader-sammlung.css` im Vorgaben-Archiv): ein fast schwarzer Knopf mit
 * einem Buchstabenlauf, der glimmt, und einem Lichtschein, der beim
 * Anfassen von unten hochkommt. Genau das ist die Aussage: hier ist eine
 * Maschine, die gleich anspringt.
 *
 * WAS DIESE DATEI TUT: sie zerlegt den Text eines Knopfes in Buchstaben,
 * jeder in einem eigenen `<span>` mit seiner Nummer, damit CSS ihn
 * versetzt anleuchten kann. SVG-Zeichen im Knopf bleiben, wie sie sind;
 * Leerzeichen bleiben Text, damit der Knopf weiter umbricht wie zuvor.
 *
 * DER TEXT BLEIBT DER TEXT. Ein Vorleser liest „Datenbank bauen" wie
 * vorher — `<span>` ohne Rolle ändern daran nichts. Und der Klick landet
 * über `closest()` weiterhin am Knopf, nicht am Buchstaben.
 * ==========================================================================*/

const Funkel = (() => {

  /** Einen Knopf mit dem Glimmen versehen. Ein zweiter Ruf tut nichts. */
  const anlegen = (knopf: HTMLElement): void => {
    if (knopf.classList.contains('ru-funkel')) return;
    knopf.classList.add('ru-funkel');
    let nr = 0;
    /* Erst sammeln, dann tauschen — wer die Kinderliste während des
       Durchlaufs ändert, überspringt jedes zweite Kind. */
    const texte = Array.from(knopf.childNodes).filter(k => k.nodeType === Node.TEXT_NODE);
    for (const t of texte) {
      const stueck = document.createDocumentFragment();
      /* Array.from, nicht split(''): ein Pfeil wie „→" ist ein Zeichen,
         ein Emoji wären sonst zwei halbe. */
      for (const zeichen of Array.from(t.textContent || '')) {
        if (/\s/.test(zeichen)) { stueck.append(zeichen); continue; }
        const s = document.createElement('span');
        s.className = 'ru-funkel-b';
        s.textContent = zeichen;
        s.style.setProperty('--ru-schritt', String(nr++));
        stueck.append(s);
      }
      t.replaceWith(stueck);
    }
  };

  /** Alle Knöpfe unter `wurzel`, die auf `selektor` passen. */
  const alle = (wurzel: ParentNode, selektor: string): number => {
    let n = 0;
    wurzel.querySelectorAll<HTMLElement>(selektor).forEach(k => { anlegen(k); n++; });
    return n;
  };

  return { anlegen, alle };
})();

(window as any).Funkel = Funkel;
