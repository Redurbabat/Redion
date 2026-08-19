/* ============================================================================
 * bereiche/pdf/seite.ts — eine PDF-Seite als Block
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/bereiche/pdf/seite.ts`.
 * ----------------------------------------------------------------------------
 * Drei Schichten übereinander, in einem Kasten mit dem Seitenverhältnis der
 * echten Seite:
 *
 *   1. das Seitenbild aus der Stücke-Ablage (Adresse beim Zeichnen, E98)
 *   2. die Zeichenschicht (dieselbe wie beim A4-Blatt, E100/E103)
 *   3. die Werkzeugleiste darüber
 *
 * Zoom ist allein die Breite des Kastens — keine gespeicherte Zahl ändert
 * sich dabei. Deshalb liegt ein Strich auf jedem Bildschirm an derselben
 * Stelle der Seite, und deshalb braucht diese Datei pdf.js nicht: sie zeigt
 * ein Bild und ein SVG.
 *
 * WAS DIE SEITE ÜBER SICH WEISS, steht beim Umwandeln fest und wird danach
 * nur gelesen:
 *
 *   bw, bh      Breite und Höhe in Punkten (bei /Rotate 90 getauscht)
 *   nr          welche Seite des Dokuments
 *   bildDateiId das gerasterte Bild
 *   quelleId    das unveränderte Original
 *
 * Eine spätere Neurasterung benutzt diese Zahlen, sie liefert keine neuen —
 * sonst läge dieselbe Marke plötzlich woanders.
 * ==========================================================================*/

const PdfSeite = (() => {
  const zeichne = (block: any): HTMLElement => {
    const breite = Number(block.bw) || 595.28;
    const hoehe  = Number(block.bh) || 841.89;

    const w = document.createElement('div');
    w.className = 'blatt-huelle pdfs';

    const schicht = Marken.schicht(block, breite, hoehe, 0);

    /* Die Leiste bekommt rechts die Seitenzahl — sie beantwortet die Frage
       „wo bin ich", ohne dass man zählen muss — und daneben den ANKER: einen
       Verweis auf genau diese Seite. Bei einem Skript mit achtzig Seiten ist
       das der Unterschied zwischen „ich weiss, dass es drinsteht" und „ich
       bin da" (E105, L37). */
    const werk = Marken.leiste(schicht,
      /* NUR DAS ZEICHEN, auch am Rechner. Mit dem Wort „Verweis" daneben
         passte die Leiste bei der üblichen Spaltenbreite von 708 px nicht
         mehr in eine Zeile und klappte in zwei um (mit Augen gesehen, §55).
         `aria-label` statt bloss `title`, damit ein Vorleseprogramm ihn
         auch nennt (§38). */
      '<button data-a="anker" aria-label="Verweis auf diese Seite kopieren" ' +
        'title="Verweis auf genau diese Seite kopieren">🔗</button>' +
      '<span class="blatt-trenn"></span>' +
      /* Beide Zahlen durch `Number` — `nr` war es schon, `vonSeiten` nicht.
         Der Text hier geht ueber `Marken.leiste` in ein `innerHTML`, und ein
         Block aus einer eingespielten Sicherung sagt, was er will. Eine Zahl
         kann nichts sein ausser einer Zahl (E112). */
      '<span class="pdfs-nr">Seite ' + (Number(block.nr) || 1) +
      (Number(block.vonSeiten) ? ' von ' + Number(block.vonSeiten) : '') +
      '</span>');
    werk.addEventListener('click', e => {
      const k = (e.target as HTMLElement)?.closest?.('button') as HTMLElement | null;
      if (k?.dataset.a !== 'anker') return;
      /* `location.href` ohne Hash — dieselbe Form wie Strg + Umschalt + C,
         und die einzige, die auch als Datei über `file://` stimmt. */
      const adr = location.href.split('#')[0] + '#block=' + block.id;
      Ablage.kopiereJetzt(adr, 'Verweis auf Seite ' +
        (Number(block.nr) || 1) + ' kopiert');
    });
    w.appendChild(werk);

    const papier = document.createElement('div');
    papier.className = 'blatt-papier pdfs-papier';
    papier.style.setProperty('aspect-ratio', breite + ' / ' + hoehe);
    w.appendChild(papier);

    /* Das Bild: Adresse beim Zeichnen aus der Kennung holen, nie speichern
       (E98). Fehlt sie noch, steht ein Satz da statt eines leeren Kastens. */
    const bild = document.createElement('img');
    bild.className = 'pdfs-bild';
    bild.alt = 'Seite ' + (Number(block.nr) || 1);
    bild.decoding = 'async';
    bild.loading = 'lazy';
    /* NOCH NICHT einhängen. Ein `img` ohne `src` ist für den Browser ein
       kaputtes Bild: er malt sein Bruchsymbol und den Alt-Text hin — über
       den Satz, der dasselbe in Ordentlich sagt (E105, mit Augen gesehen). */

    const hinweis = document.createElement('div');
    hinweis.className = 'pdfs-wartet';
    hinweis.textContent = 'Seite wird vorbereitet …';
    papier.appendChild(hinweis);

    /**
     * Aus dem Hinweis einen Weg machen.
     *
     * NACH DEM EINSPIELEN EINER `.redion` IST DAS DER NORMALFALL, nicht der
     * Ausnahmefall: E103 lässt die gerasterten Seitenbilder bewusst draussen,
     * weil sie sich neu rechnen lassen. „Lässt sich" ist aber kein Weg, solange
     * niemand ihn gehen kann. Also steht er hier — ein Knopf, der das ganze
     * Dokument auf einmal zurückholt, weil das Original aufzuschlagen der teure
     * Teil ist und eine einzelne Seite daraus der billige (E106).
     */
    const wegZeigen = (text: string): void => {
      hinweis.textContent = '';
      const satz = document.createElement('div');
      satz.textContent = text;
      hinweis.appendChild(satz);
      if (!block.quelleId) return;      /* ohne Original kein Weg */
      const k = document.createElement('button');
      k.type = 'button';
      k.className = 'pdfs-neu';
      k.textContent = 'Aus dem Original zurückholen';
      k.addEventListener('click', () => {
        k.disabled = true;
        k.textContent = 'wird gerechnet …';
        /* Der Erfolg zeichnet die Seite neu, und dieser Knopf ist dann
           ohnehin fort. Kommt aber KEIN Bild — das Original fehlt im
           Bestand, das Rechnen scheitert —, muss er wieder anfassbar sein:
           ein Knopf, der für immer „wird gerechnet …" sagt, ist schlimmer
           als gar keiner (E116). */
        const zurueck = () => {
          if (!k.isConnected) return;
          k.disabled = false;
          k.textContent = 'Aus dem Original zurückholen';
        };
        PdfEinlesen.neuBerechnen(block.quelleId).then(zurueck, zurueck);
      });
      hinweis.appendChild(k);
    };

    const zeigeBild = (u: string): void => {
      bild.src = u;
      papier.insertBefore(bild, papier.firstChild);
      hinweis.remove();
    };
    if (block.bildDateiId && typeof Dateien !== 'undefined') {
      const da = Dateien.adresseBekannt ? Dateien.adresseBekannt(block.bildDateiId) : null;
      if (da) zeigeBild(da);
      else Dateien.adresse(block.bildDateiId)
        .then((u: string | null) => {
          if (u) zeigeBild(u);
          else wegZeigen('Das Seitenbild fehlt.');
        })
        .catch(() => wegZeigen('Das Seitenbild fehlt.'));
    } else {
      wegZeigen('Für diese Seite gibt es noch kein Bild.');
    }

    papier.appendChild(schicht.flaeche);
    return w;
  };

  return { zeichne };
})();

(window as any).PdfSeite = PdfSeite;
