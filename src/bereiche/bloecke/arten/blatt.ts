/* ============================================================================
 * bereiche/bloecke/arten/blatt.ts — das A4-Blatt
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/bereiche/bloecke/arten/blatt.ts`.
 * ----------------------------------------------------------------------------
 * Ein Blatt Papier in A4, auf das man BEIDES kann: schreiben und malen.
 *
 * Geschrieben wird in gewöhnlichen Redion-Blöcken — sie sind Kinder dieses
 * Blocks. Damit erbt das Blatt alles, was der Editor kann: Slash-Menü,
 * Überschriften, Aufgabenlisten, Verweise, Suche, Export. Ein eigener
 * Texteditor auf dem Blatt wäre eine zweite Maschine für dieselbe Frage
 * (E29), und die zweite ist immer die schlechtere.
 *
 * Gemalt wird auf `Marken` — DERSELBEN Zeichenschicht, die auch die
 * PDF-Seite benutzt (E103). Sie lag zuerst hier; als die PDF-Seite sie
 * brauchte, wurde sie herausgelöst statt abgeschrieben (§34). Was sie kann
 * und warum sie nicht in Bildschirmpunkten rechnet, steht in E100.
 * ==========================================================================*/

const Blatt = (() => {
  const zeichne = (block: any): HTMLElement => {
    const R = SheetSpace;
    const hoehe = Number(block.blattHoehe) || R.A4_HOEHE;
    const breite = Number(block.blattBreite) || R.A4_BREITE;

    const w = document.createElement('div');
    w.className = 'blatt-huelle';

    /* Die Zeichenschicht zuerst — die Leiste braucht ihre Schalter. */
    const schicht = Marken.schicht(block, breite, hoehe, R.A4_HOEHE);

    const werk = Marken.leiste(schicht,
      '<span class="blatt-trenn"></span>' +
      '<button data-a="seite" title="Eine Seite anhängen">' +
        '<span class="zeichen">＋</span><span class="wort">Seite</span></button>');
    werk.addEventListener('click', e => {
      const b = (e.target as HTMLElement)?.closest?.('button') as HTMLElement | null;
      if (b?.dataset.a !== 'seite') return;
      Store.updateBlock(block.id, {
        blattHoehe: hoehe + R.A4_HOEHE, blattBreite: breite,
        raumVersion: R.RAUM_VERSION
      });
      App.zeichneSeite();
    });
    w.appendChild(werk);

    const papier = document.createElement('div');
    papier.className = 'blatt-papier';
    /* Die Höhe folgt der Breite über das Seitenverhältnis — dann stimmt das
       Blatt bei jeder Fensterbreite, ohne eine einzige gerechnete Zahl. */
    papier.style.setProperty('aspect-ratio', breite + ' / ' + hoehe);
    w.appendChild(papier);

    /* Der Text: gewöhnliche Blöcke, im Satzspiegel. Ein Prozent-Innenabstand
       bezieht sich in CSS auf die BREITE — auch oben und unten. Also EIN
       Wert, sonst wären die Ränder oben schmaler als seitlich. */
    const inhalt = document.createElement('div');
    inhalt.className = 'blatt-inhalt';
    inhalt.style.padding = (R.RAND / breite * 100) + '%';
    /* `Blocks` liegt NICHT auf `window` — bei `module: none` teilen sich alle
       Dateien einen Namensraum, und der Editor hängt sich nirgends an. */
    Store.childrenOf(block.id).forEach((k: any) => {
      inhalt.appendChild(Blocks.render(k, 0));
    });
    papier.appendChild(inhalt);
    papier.appendChild(schicht.flaeche);

    /* Beim Malen soll der Finger nicht durch den Text markieren. */
    const urspruenglich = schicht.setzeWerkzeug;
    schicht.setzeWerkzeug = (wz: string) => {
      urspruenglich(wz);
      papier.classList.toggle('malt', wz !== 'schreiben');
    };

    return w;
  };

  return { zeichne };
})();

(window as any).Blatt = Blatt;
