/* ============================================================================
 * schale/aufbau/inhaltsflaeche.js — der Inhalt selbst
 * ----------------------------------------------------------------------------
 * Was unter dem Kopf steht: das Wiki-Verzeichnis, die Blöcke, die
 * Rückverweise — und der Streifen am rechten Rand, der die Überschriften
 * abbildet.
 *
 * WAS DARAN LEICHT SCHIEFGEHT
 *
 * 1. Eine leere Seite bekommt hier von selbst einen Textblock. Das sieht nach
 *    einer Nebensache aus und ist keine: ohne ihn gäbe es auf einer frischen
 *    Seite nichts, worin man tippen könnte, und der Titel wäre eine
 *    Sackgasse.
 *
 * 2. Der Streifen erscheint erst ab **drei** Überschriften. Darunter wäre er
 *    nur Zierde. Er hängt sich an `#main` und nicht an die Seite, weil er
 *    beim Scrollen stehen bleiben muss — deshalb muss er auch von Hand
 *    entfernt werden, bevor er neu entsteht.
 *
 * 3. Der Zähler für nummerierte Listen läuft über die ganze Seite und wird
 *    von jedem anderen Blocktyp zurückgesetzt. Wer die Schleife anfasst,
 *    fasst die Nummerierung an.
 * ==========================================================================*/

const Inhaltsflaeche = (() => {

  const esc = (s) => String(s ?? '').replace(/[<>&]/g, c => ({ '<':'&lt;','>':'&gt;','&':'&amp;' }[c]));

  let gebunden = {};

  const braucht = (name) => (...args) => {
    const fn = gebunden[name];
    if (typeof fn !== 'function') {
      throw new Error('Die Inhaltsfläche wurde ohne „' + name + '" gebunden. ' +
        'Die Inhaltsfläche.binde({ … }) gehört an den Anfang von App.start(), vor das erste Zeichnen.');
    }
    return fn(...args);
  };

  const binde = (teile) => { gebunden = Object.assign({}, gebunden, teile || {}); };

  const aktuelleSeite = braucht('aktuelleSeite');

  /* ------------------------------------------------------------------------
   * INHALTS-STREIFEN AM RECHTEN RAND
   * ------------------------------------------------------------------------
   * Notion zeigt neben jeder längeren Seite ein paar kurze Striche — einen
   * je Überschrift. Wer darüberfährt, sieht die Namen; ein Klick springt hin.
   * Ab drei Überschriften lohnt es sich, darunter wäre es nur Zierde.
   * ----------------------------------------------------------------------*/
  const streifenZeichnen = () => {
    const seiteId = aktuelleSeite();
    document.getElementById('rand-toc')?.remove();
    const seite = seiteId ? Store.getBlock(seiteId) : null;
    if (!seite) return;

    const kopfzeilen = Store.childrenOf(seite.id)
      .filter(b => ['h1', 'h2', 'h3'].includes(b.type) && (b.text || '').trim());
    if (kopfzeilen.length < 3) return;

    const d = document.createElement('div');
    d.id = 'rand-toc';
    d.innerHTML = kopfzeilen.map(b =>
      `<button data-bid="${b.id}" class="rt-${b.type}" title="${esc(b.text)}">` +
      `<i></i><span>${esc(b.text)}</span></button>`).join('');
    document.getElementById('main').appendChild(d);

    d.addEventListener('click', e => {
      const b = e.target.closest('[data-bid]');
      if (!b) return;
      const el = document.querySelector(`[data-bid="${b.dataset.bid}"]`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    /* Der Strich, bei dem man gerade steht, wird hervorgehoben. */
    const scroll = document.getElementById('scroll');
    const mitlaufen = () => {
      if (!document.body.contains(d)) { scroll.removeEventListener('scroll', mitlaufen); return; }
      let jetzt = null;
      kopfzeilen.forEach(b => {
        const el = document.querySelector(`.blk[data-bid="${b.id}"]`);
        if (el && el.getBoundingClientRect().top < 140) jetzt = b.id;
      });
      d.querySelectorAll('button').forEach(x =>
        x.classList.toggle('jetzt', x.dataset.bid === jetzt));
    };
    scroll.addEventListener('scroll', mitlaufen, { passive: true });
    mitlaufen();
  };

  /* Der Text, der dasteht, wenn gar keine Seite offen ist. */
  const leer = (wrap) => {
    wrap.innerHTML =
        '<div style="padding:22vh 0; text-align:center; color:var(--text-faint)">' +
        '<div style="font-size:44px; margin-bottom:14px">📓</div>' +
        '<div style="font-size:17px; margin-bottom:6px">Noch keine Seite geöffnet</div>' +
        '<div style="font-size:14px">Links auf <b>+</b> klicken oder <b>Strg + N</b> drücken</div></div>';
  };

  /* Wiki-Verzeichnis, Blöcke, Rückverweise — in dieser Folge. */
  const zeichne = (wrap, p) => {
    /* Wiki-Verzeichnis */
    if (p.wiki) Werkzeuge.wikiIndex(p, wrap);

    /* Blöcke */
    const kinder = Store.childrenOf(p.id);
    if (!kinder.length && !p.gesperrt) {
      const b = Store.addBlock(p.id, 'text');
      kinder.push(b);
    }
    let nr = 0;
    kinder.forEach(b => {
      if (b.type === 'number') { nr++; b.nr = nr; } else nr = 0;
      wrap.appendChild(Blocks.render(b));
    });

    /* Rückverweise unter der Seite */
    if (!p.ohneRueck) Links.fusszeile(p, wrap);
  };

  return { binde, zeichne, leer, streifen: streifenZeichnen };
})();

window.Inhaltsflaeche = Inhaltsflaeche;
