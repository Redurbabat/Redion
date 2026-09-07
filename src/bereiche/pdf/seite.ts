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

    /* WIE BREIT DER RAND IST, steht an der SEITE und nicht am Seitenblock:
       wer neben seinem Skript schreibt, will das für das ganze Skript und
       nicht Seite für Seite (E301). Null heisst aus, und das ist die
       Vorgabe — ein Rand, den niemand bestellt hat, nimmt nur Platz. */
    const seite = (typeof Links !== 'undefined' && Links.seiteVon)
      ? Links.seiteVon(block.id) : null;
    const randAnteil = Math.max(0, Math.min(1.5, Number(seite?.randBreite) || 0));
    const rand = Math.round(breite * randAnteil);

    const schicht = Marken.schicht(block, breite, hoehe, 0, rand);

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
      /* SCHÄRFER RECHNEN (L37, E173). Nur wenn es überhaupt geht: ohne das
         Original in der Ablage gibt es nichts, woraus man rechnen könnte,
         und ein Knopf, der nur eine Entschuldigung zeigt, ist kein Knopf.
         Auch nur dann, wenn noch Luft nach oben ist. */
      (block.quelleId && (Number(block.bildBreite) || 1654) < 3308
        ? '<button data-a="feiner" aria-label="Diese Seite feiner rechnen" ' +
            'title="Diese Seite feiner rechnen — schärfer beim Hineinzoomen">⊕</button>'
        : '') +
      /* AUSSCHNEIDEN ALS LERNKARTE (Punkt 43).
         Kein eigenes Gummiband: das RECHTECK-Werkzeug gibt es längst, und ein
         gezeichnetes Rechteck ist zugleich die Auswahl und der bleibende
         Vermerk, was man aus dieser Seite herausgeschnitten hat. Ein zweites
         Ziehwerkzeug daneben wäre eine zweite Bedienung für dieselbe Geste. */
      '<button data-a="karte" aria-label="Rechteck als Lernkarte ausschneiden" ' +
        'title="Das zuletzt gezeichnete Rechteck als Karteikarte ausschneiden">✂</button>' +
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
      if (k?.dataset.a === 'feiner') {
        /* Sperren, solange gerechnet wird — sonst startet ein zweiter Klick
           einen zweiten Lauf, und der legt für denselben Block eine zweite
           Datei ab (derselbe Fehler wie E116). */
        k.setAttribute('disabled', 'disabled');
        k.textContent = '…';
        PdfEinlesen.schaerfer(block).then((erg: any) => {
          if (erg && erg.ok) return;         /* neu gezeichnet, Knopf ist fort */
          if (!k.isConnected) return;
          k.removeAttribute('disabled');
          k.textContent = '⊕';
          if (erg && erg.grund) UI.toast(erg.grund);
        });
        return;
      }
      if (k?.dataset.a === 'karte') { void alsLernkarte(); return; }
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

    /* OHNE RAND BLEIBT DER AUFBAU, WIE ER WAR. Zwei Formen sind mehr Code
       als eine, aber die Alternative wäre, den Aufbau JEDER Seite zu ändern,
       auch der Millionen ohne Rand — und daran hängen fünfzehn Prüfläufe,
       die Masse am Papier nehmen. */
    let flur: HTMLElement | null = null;
    if (rand > 0) {
      flur = document.createElement('div');
      flur.className = 'blatt-flur';
      /* Der Anteil der Seite an der ganzen Fläche. Genau dieser Anteil hält
         die Einheit auf dem Bildschirm gleich gross wie ohne Rand — und
         darum liegt jede alte Marke danach an derselben Stelle. */
      flur.style.setProperty('--seiten-anteil',
        (100 * breite / (breite + rand)).toFixed(4) + '%');
      /* Dieselbe Zahl als Faktor, für das Telefon: dort wird der Flur breiter
         als die Spalte gemacht und waagrecht gerollt, statt die Seite
         schmaler zu machen (E301, auf dem Bild gefunden). */
      flur.style.setProperty('--flur-faktor',
        ((breite + rand) / breite).toFixed(4));
      const randfeld = document.createElement('div');
      randfeld.className = 'blatt-randfeld';
      flur.appendChild(papier);
      flur.appendChild(randfeld);
      /* Gedreht wird die ganze Flaeche samt Rand (E467); ungedreht ist
         `drehHuelle` der Flur selbst — kein neuer Knoten. */
      w.appendChild(SheetSpace.drehHuelle(block, flur));
    } else {
      w.appendChild(SheetSpace.drehHuelle(block, papier));
    }

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
        /* SEIT E327 IST DAS EIN AUFTRAG, und `neuBerechnen` kommt zurück,
           sobald er ANGELEGT ist — nicht wenn er fertig ist. Auf sein Ende
           zu warten ginge hier gar nicht: er läuft womöglich in einem
           anderen Tab, und dessen Ereignisse erreichen diesen nie.

           Also wartet dieser Knopf nicht mehr, sondern HÖRT ZU. Das Ende
           zeichnet die Seite neu (einlesen.ts), womit er meist verschwindet;
           bleibt er stehen, weil das Bild nicht kam, wird er wieder
           anfassbar. Genau die Zusage von E116, nur nicht mehr an einem
           Versprechen hängend. */
        const aus: Array<() => void> = [];
        const fertig = (d: any) => {
          if (!d || d.art !== 'pdf-bilder') return;
          aus.forEach(f => f()); aus.length = 0;
          zurueck();
        };
        if (typeof Ereignisse !== 'undefined' && Ereignisse.horche) {
          aus.push(Ereignisse.horche(ARTEN.auftragBeendet, fertig));
          aus.push(Ereignisse.horche(ARTEN.auftragFehler, fertig));
        }
        PdfEinlesen.neuBerechnen(block.quelleId).then((e: any) => {
          /* Nichts angelegt heisst: nichts wird kommen. Ein Knopf, der auf
             ein Ereignis wartet, das niemand auslöst, ist der Knopf von
             E116 mit mehr Schritten davor. */
          if (!e || !e.auftrag) fertig({ art: 'pdf-bilder' });
        }, () => fertig({ art: 'pdf-bilder' }));
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

    /* ------------------------------------------------------------------------
     * EIN AUSSCHNITT WIRD EINE LERNKARTE (Punkt 43)
     * ------------------------------------------------------------------------
     * Das zuletzt gezeichnete Rechteck bestimmt den Ausschnitt. Geschnitten
     * wird aus dem `img`, das ohnehin schon auf der Seite steht — es kommt
     * aus einem `blob:`-Verweis derselben Herkunft, die Zeichenfläche wird
     * dadurch nicht unrein, und `toBlob` darf lesen.
     *
     * Der Ausschnitt wird als gewöhnlicher Anhang abgelegt. Damit geht er
     * durch Papierkorb, `.redion`-Sicherung und Wiederherstellung wie jedes
     * andere Bild — ohne dass irgendwo ein Sonderfall dafür stehen müsste.
     *
     * URHEBERRECHT: Ein Ausschnitt aus einem gekauften Lehrmittel in die
     * eigene Karteikarte auf dem eigenen Rechner ist Privatgebrauch. Er geht
     * an keinen Server. Redion liefert das Werkzeug, nicht den Inhalt.
     * ----------------------------------------------------------------------*/
    const alsLernkarte = async (): Promise<void> => {
      const rechtecke = (schicht.marken as any[])
        .filter(m => m && m.art === 'rectangle' && Array.isArray(m.pts) && m.pts.length >= 2);
      const letztes = rechtecke[rechtecke.length - 1];
      if (!letztes) {
        UI.toast('Zeichne zuerst ein Rechteck um das, was du ausschneiden willst.');
        return;
      }
      if (!bild.naturalWidth || !bild.isConnected) {
        UI.toast('Das Seitenbild ist noch nicht da.');
        return;
      }
      const pts = InkGeometry.points(letztes.pts);
      const a = pts[0]!, b = pts[1]!;
      /* Blattkoordinaten in Bildpunkte: das Bild kann feiner gerechnet sein
         als das Blatt gross ist (E173, „schärfer rechnen"). */
      const jeX = bild.naturalWidth / breite;
      const jeY = bild.naturalHeight / hoehe;
      const x = Math.max(0, Math.min(a[0], b[0]) * jeX);
      const y = Math.max(0, Math.min(a[1], b[1]) * jeY);
      const w2 = Math.min(bild.naturalWidth - x, Math.abs(b[0] - a[0]) * jeX);
      const h2 = Math.min(bild.naturalHeight - y, Math.abs(b[1] - a[1]) * jeY);
      if (w2 < 8 || h2 < 8) {
        UI.toast('Das Rechteck ist zu klein für einen Ausschnitt.');
        return;
      }

      const frage = await UI.frage('Was steht auf der Rückseite der Karte?', '');
      if (frage === null) return;

      const tafel = document.createElement('canvas');
      tafel.width = Math.round(w2);
      tafel.height = Math.round(h2);
      const stift = tafel.getContext('2d');
      if (!stift) { UI.toast('Der Ausschnitt lässt sich nicht zeichnen.'); return; }
      stift.drawImage(bild, x, y, w2, h2, 0, 0, tafel.width, tafel.height);

      const brocken: Blob | null = await new Promise(fertig =>
        tafel.toBlob(b3 => fertig(b3), 'image/png'));
      if (!brocken) { UI.toast('Der Ausschnitt liess sich nicht speichern.'); return; }

      try {
        const name = 'ausschnitt-seite-' + (Number(block.nr) || 1) + '.png';
        const datei = await Dateien.ablegen(
          new File([brocken], name, { type: 'image/png' }), null);
        const ziel = App.aktuelleSeite();
        if (!ziel) { UI.toast('Keine Seite offen.'); return; }
        const karte = Store.addBlock(ziel, 'flashcard', {
          text: 'Was ist das? :: ' + (frage || '')
        });
        Store.updateBlock(karte.id, { bildId: datei.id });
        App.zeichneSeite();
        UI.toast('✅ Karteikarte angelegt');
      } catch (e: unknown) {
        UI.toast('Der Ausschnitt liess sich nicht ablegen: ' +
          (e instanceof Error ? e.message : String(e)));
      }
    };

    /* Die Fläche spannt über Seite UND Rand, sonst könnte kein Strich über
       die Kante laufen. Ohne Rand liegt sie wie immer auf dem Papier. */
    (flur ?? papier).appendChild(schicht.flaeche);
    return w;
  };

  return { zeichne };
})();

(window as any).PdfSeite = PdfSeite;
