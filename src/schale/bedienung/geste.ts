/* ============================================================================
 * schale/bedienung/geste.ts — die Hand, die zeigt, wo man hintippt
 * ----------------------------------------------------------------------------
 * ERZEUGT DARAUS WIRD `quell/schale/bedienung/geste.js`.
 * Die Quelle ist DIESE Datei. `npm run bauen:ts` schreibt das .js; wer das
 * .js bearbeitet, verliert die Änderung beim nächsten Bauen (test105).
 * ----------------------------------------------------------------------------
 * WOFÜR. Der Rundgang (`bereiche/hilfe/rundgang.ts`) legt um jedes Ziel
 * ein Loch in den Schleier und stellt einen Kasten daneben. Das Loch sagt
 * WO, der Kasten sagt WAS — und keiner von beiden sagt, dass man da
 * HINTIPPEN kann. Die Hand sagt es: vier Finger, die auf das Ziel klopfen.
 *
 * WOHER. Redurs Vorgabe `.🤚` vom 6. September 2026
 * (`loader-sammlung.css` im Vorgaben-Archiv): Handfläche, Daumen, vier
 * Finger, die gestaffelt tippen. Hier auf drei Viertel verkleinert, damit
 * sie neben einem 38-px-Knopf nicht wie ein Baseballhandschuh wirkt.
 *
 * WAS SIE NICHT IST. Kein Bedienelement: `pointer-events:none`,
 * `aria-hidden`, kein Text. Wer den Rundgang mit dem Vorleser macht, hört
 * den Kasten — die Hand ist nur für die Augen, und deshalb sagt sie
 * nichts, was nicht auch im Kasten steht (§38).
 *
 * SIE STEHT UNTER DEM KASTEN. z-index 901 wie das Loch, der Kasten hat
 * 902: wo beide sich treffen, gewinnt das, was man lesen muss.
 * ==========================================================================*/

const Geste = (() => {

  let hand: HTMLElement | null = null;

  const bauen = (): HTMLElement => {
    const h = document.createElement('div');
    h.className = 'ru-geste';
    h.setAttribute('aria-hidden', 'true');
    const el = (klasse: string): void => {
      const i = document.createElement('i');
      i.className = klasse;
      h.append(i);
    };
    el('ru-geste-flaeche');
    el('ru-geste-daumen');
    for (let n = 1; n <= 4; n++) el('ru-geste-finger ru-geste-finger-' + n);
    return h;
  };

  /**
   * Die Hand an ein Ziel stellen. Die Fingerspitzen landen in der unteren
   * rechten Hälfte des Ziels; die Handfläche steht rechts darunter, wo
   * sie — meistens — nichts verdeckt. Mehrfach rufen stellt nur nach.
   */
  const zeigen = (ziel: Element): void => {
    const r = ziel.getBoundingClientRect();
    if (!r.width) { weg(); return; }
    if (!hand) { hand = bauen(); document.body.append(hand); }
    /* Die Spitze des Zeigefingers liegt etwa 24 px links und 18 px unter
       der oberen linken Ecke der Handfläche — abgelesen an der Vorgabe,
       auf drei Viertel gerechnet. Sie soll auf 62 % / 60 % des Ziels
       liegen: rechts der Mitte, unter der Mitte, wie ein echter Finger,
       der von rechts unten kommt. */
    const spitzeX = r.left + r.width * 0.62;
    const spitzeY = r.top + r.height * 0.6;
    /* Daumen und Schatten ragen unter den Kasten hinaus; am Telefon stand
       die Hand am unteren Rand mit halbem Daumen im Bild. Also 65 statt
       45 Luft nach unten. */
    const links = Math.max(0, Math.min(innerWidth - 66, spitzeX + 24));
    const oben = Math.max(0, Math.min(innerHeight - 65, spitzeY - 18));
    hand.style.left = links + 'px';
    hand.style.top = oben + 'px';
  };

  const weg = (): void => { hand?.remove(); hand = null; };

  return { zeigen, weg, sichtbar: () => !!hand?.isConnected };
})();

(window as any).Geste = Geste;
