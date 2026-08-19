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
 * Gemalt wird auf einer SVG-Schicht DARÜBER. Sie nimmt Zeiger nur an,
 * wenn ein Zeichenwerkzeug gewählt ist — sonst schreibt man durch sie
 * hindurch, als wäre sie nicht da.
 *
 * WAS HIER ANDERS IST ALS AM WHITEBOARD, und warum:
 *
 *   Koordinaten   Blattpunkte über `SheetSpace.zuBlatt`, nicht rohe
 *                 Bildschirmpunkte. Ein Strich liegt auf jedem Bildschirm
 *                 an derselben Stelle des Papiers.
 *   Zeichnen      ein DOM-Knoten je Marke. Das Whiteboard baut bei JEDEM
 *                 `pointermove` die ganze Fläche neu (`innerHTML = ''`) —
 *                 bei zweihundert Strichen ruckelt das sichtbar.
 *   Abbrechen     `pointercancel` und `pagehide` schliessen den Strich wie
 *                 ein Loslassen. Sonst bleibt er halb offen liegen, wenn
 *                 das Telefon dazwischenfunkt.
 *   Ein Finger    nur `isPrimary` zeichnet. Sonst malt die zweite Hand beim
 *                 Zoomen eine Linie quer übers Blatt.
 * ==========================================================================*/

const Blatt = (() => {
  const NS = 'http://www.w3.org/2000/svg';
  const sv = (name: string, attr: Record<string, unknown> = {}): SVGElement => {
    const el = document.createElementNS(NS, name);
    Object.entries(attr).forEach(([k, v]) => el.setAttribute(k, String(v)));
    return el;
  };

  const FARBEN = ['#111111', '#d64545', '#2f7ed8', '#3aa757', '#e0a419'];
  const BREITEN = [1.2, 2.4, 5];

  /** Alle Marken eines Blocks, als eigene Kopie zum Arbeiten. */
  const markenVon = (block: any): any[] =>
    Array.isArray(block.marken) ? JSON.parse(JSON.stringify(block.marken)) : [];

  const zeichneMarke = (m: any): SVGElement | null => {
    if (!m || !Array.isArray(m.pts) || m.pts.length < 2) return null;
    const d = 'M' + m.pts.map((q: number[]) => q[0] + ' ' + q[1]).join(' L');
    const pfad = sv('path', {
      d, fill: 'none', stroke: m.farbe || FARBEN[0],
      'stroke-width': m.breite || BREITEN[1],
      'stroke-linecap': 'round', 'stroke-linejoin': 'round'
    });
    /* An JEDEM Knoten, nicht nur am ersten — der Radierer trifft sonst
       Teile, die zu niemandem gehören. */
    pfad.setAttribute('data-sid', String(m.id));
    return pfad;
  };

  const zeichne = (block: any): HTMLElement => {
    const R = SheetSpace;
    const marken = markenVon(block);
    let werkzeug: 'schreiben' | 'stift' | 'radierer' = 'schreiben';
    let farbe = FARBEN[0];
    let strich = BREITEN[1];

    const hoehe = Number(block.blattHoehe) || R.A4_HOEHE;
    const breite = Number(block.blattBreite) || R.A4_BREITE;

    const w = document.createElement('div');
    w.className = 'blatt-huelle';

    /* --- Werkzeugleiste ------------------------------------------------- */
    const werk = document.createElement('div');
    werk.className = 'blatt-werk';
    /* Zeichen und Wort getrennt: am Telefon bleibt nur das Zeichen stehen.
       Mit Wörtern brauchte die Leiste bei 390 px DREI Zeilen und frass das
       halbe Bild, bevor das Papier anfing — mit Augen gesehen, nicht
       gemessen (§55). */
    const knopf = (wz: string, zeichen: string, wort: string, titel: string) =>
      `<button data-wz="${wz}"${wz === 'schreiben' ? ' class="on"' : ''} title="${titel}">` +
      `<span class="zeichen">${zeichen}</span><span class="wort">${wort}</span></button>`;
    werk.innerHTML =
      knopf('schreiben', '✎', 'Schreiben', 'Schreiben — der Zeiger geht an der Zeichenschicht vorbei') +
      knopf('stift', '🖍', 'Malen', 'Mit dem Stift malen') +
      knopf('radierer', '⌫', 'Radieren', 'Striche entfernen') +
      '<span class="blatt-trenn"></span>' +
      FARBEN.map((c, i) =>
        `<button class="blatt-farbe${i === 0 ? ' on' : ''}" data-c="${c}" style="background:${c}" title="Farbe"></button>`).join('') +
      '<span class="blatt-trenn"></span>' +
      BREITEN.map((b, i) =>
        `<button class="blatt-strich${i === 1 ? ' on' : ''}" data-b="${b}" title="Strichbreite">` +
        `<i style="height:${Math.max(2, b)}px"></i></button>`).join('') +
      '<span class="blatt-trenn"></span>' +
      '<button data-a="seite" title="Eine Seite anhängen">' +
        '<span class="zeichen">＋</span><span class="wort">Seite</span></button>';
    w.appendChild(werk);

    /* --- Das Papier ------------------------------------------------------ */
    const papier = document.createElement('div');
    papier.className = 'blatt-papier';
    /* Die Höhe folgt der Breite über das Seitenverhältnis — dann stimmt das
       Blatt bei jeder Fensterbreite, ohne eine einzige gerechnete Zahl. */
    papier.style.setProperty('aspect-ratio', breite + ' / ' + hoehe);
    w.appendChild(papier);

    /* Der Text: gewöhnliche Blöcke, im Satzspiegel. */
    const inhalt = document.createElement('div');
    inhalt.className = 'blatt-inhalt';
    /* Ein Prozent-Innenabstand bezieht sich in CSS auf die BREITE — auch
       oben und unten. Also EIN Wert, sonst wären die Ränder oben schmaler
       als seitlich, obwohl beide „20 mm" heissen sollten. */
    inhalt.style.padding = (R.RAND / breite * 100) + '%';
    /* `Blocks` liegt NICHT auf `window` — bei `module: none` teilen sich alle
       Dateien einen Namensraum, und der Editor hängt sich nirgends an. Der
       erste Wurf griff über `window.Blocks` und bekam `undefined`: der Text
       fehlte auf dem Papier, ohne dass etwas geworfen wurde. */
    Store.childrenOf(block.id).forEach((k: any) => {
      inhalt.appendChild(Blocks.render(k, 0));
    });
    papier.appendChild(inhalt);

    /* Die Zeichenschicht darüber. */
    const flaeche = sv('svg', {
      class: 'blatt-marken', viewBox: `0 0 ${breite} ${hoehe}`,
      preserveAspectRatio: 'none'
    }) as SVGSVGElement;
    papier.appendChild(flaeche);

    /* Seitenumbrüche als gestrichelte Linien — Orientierung, kein Setzer. */
    for (let s = 1; s < R.seiten(hoehe); s++) {
      flaeche.appendChild(sv('line', {
        x1: 0, x2: breite, y1: s * R.A4_HOEHE, y2: s * R.A4_HOEHE,
        stroke: 'currentColor', 'stroke-width': 0.5,
        'stroke-dasharray': '6 6', opacity: 0.35, class: 'blatt-umbruch'
      }));
    }
    marken.forEach(m => { const k = zeichneMarke(m); if (k) flaeche.appendChild(k); });

    const sichern = () => Store.updateBlock(block.id, {
      marken, raumVersion: R.RAUM_VERSION, blattBreite: breite, blattHoehe: hoehe
    });

    /* --- Malen ----------------------------------------------------------- */
    let laufend: any = null;
    let laufKnoten: SVGElement | null = null;

    const abschliessen = (): void => {
      if (!laufend) return;
      /* Ein Punkt ist kein Strich. Zwei gleiche auch nicht. */
      if (laufend.pts.length >= 2) { marken.push(laufend); sichern(); }
      else if (laufKnoten && laufKnoten.parentNode) laufKnoten.remove();
      laufend = null; laufKnoten = null;
    };

    flaeche.addEventListener('pointerdown', (e: PointerEvent) => {
      if (werkzeug === 'schreiben' || !e.isPrimary) return;
      const punkt = R.zuBlatt(flaeche, e);
      if (!punkt) return;
      e.preventDefault();

      if (werkzeug === 'radierer') {
        const ziel = (e.target as Element)?.closest?.('[data-sid]') as HTMLElement | null;
        const sid = ziel?.dataset?.sid;
        if (!sid) return;
        const i = marken.findIndex((m: any) => m.id === sid);
        if (i < 0) return;
        marken.splice(i, 1);
        ziel.remove();
        sichern();
        return;
      }

      laufend = {
        id: (typeof Ids !== 'undefined' ? Ids.short(8) : String(marken.length + 1)),
        art: 'stift', farbe, breite: strich, pts: [punkt]
      };
      laufKnoten = zeichneMarke({ ...laufend, pts: [punkt, punkt] });
      if (laufKnoten) flaeche.appendChild(laufKnoten);
      try { flaeche.setPointerCapture(e.pointerId); } catch { /* egal */ }
    });

    flaeche.addEventListener('pointermove', (e: PointerEvent) => {
      if (!laufend || !e.isPrimary) return;
      const punkt = R.zuBlatt(flaeche, e);
      if (!punkt) return;
      const letzt = laufend.pts[laufend.pts.length - 1];
      /* Punkte, die dichter liegen als ein halber Millimeter, bringen nichts
         ausser Datenmenge. */
      if (letzt && Math.abs(letzt[0] - punkt[0]) < 1 && Math.abs(letzt[1] - punkt[1]) < 1) return;
      laufend.pts.push(punkt);
      /* NUR den einen Pfad neu setzen — nicht die ganze Fläche neu bauen. */
      if (laufKnoten)
        laufKnoten.setAttribute('d', 'M' + laufend.pts.map((q: number[]) => q[0] + ' ' + q[1]).join(' L'));
    });

    /* Loslassen, Abbrechen und Wegblättern schliessen den Strich gleich ab.
       Ohne `pointercancel` bleibt er offen, wenn das Telefon dazwischenfunkt. */
    flaeche.addEventListener('pointerup', abschliessen);
    flaeche.addEventListener('pointercancel', abschliessen);
    flaeche.addEventListener('pointerleave', abschliessen);
    addEventListener('pagehide', abschliessen);

    /* --- Werkzeuge schalten ---------------------------------------------- */
    werk.addEventListener('click', e => {
      const b = (e.target as HTMLElement)?.closest?.('button') as HTMLElement | null;
      if (!b) return;
      if (b.dataset.wz) {
        werkzeug = b.dataset.wz as any;
        werk.querySelectorAll('[data-wz]').forEach(x => x.classList.remove('on'));
        b.classList.add('on');
        /* Die Schicht nimmt Zeiger nur, wenn wirklich gemalt wird. */
        flaeche.style.pointerEvents = werkzeug === 'schreiben' ? 'none' : 'auto';
        papier.classList.toggle('malt', werkzeug !== 'schreiben');
        return;
      }
      if (b.dataset.c) {
        farbe = b.dataset.c;
        werk.querySelectorAll('.blatt-farbe').forEach(x => x.classList.remove('on'));
        b.classList.add('on');
        return;
      }
      if (b.dataset.b) {
        strich = Number(b.dataset.b);
        werk.querySelectorAll('.blatt-strich').forEach(x => x.classList.remove('on'));
        b.classList.add('on');
        return;
      }
      if (b.dataset.a === 'seite') {
        Store.updateBlock(block.id, {
          blattHoehe: hoehe + R.A4_HOEHE, blattBreite: breite,
          marken, raumVersion: R.RAUM_VERSION
        });
        App.zeichneSeite();
      }
    });

    /* Zu Beginn wird geschrieben, nicht gemalt — die Schicht ist durchlässig. */
    flaeche.style.pointerEvents = 'none';

    return w;
  };

  return { zeichne, FARBEN, BREITEN };
})();

(window as any).Blatt = Blatt;
