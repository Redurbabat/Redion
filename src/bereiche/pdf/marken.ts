/* ============================================================================
 * bereiche/pdf/marken.ts — eine Ink-Schicht fuer A4-Blatt und PDF-Seite
 * ----------------------------------------------------------------------------
 * Ein Dokumentraum, ein SVG-Knoten je Marke, keine Ablageschreibvorgaenge
 * waehrend pointermove. Alte `stift`-Marken mit `pts: [[x,y], ...]` bleiben
 * lesbar; neue Druckwerte liegen getrennt unter `pressure` (E125).
 * ==========================================================================*/

const Marken = (() => {
  const NS = 'http://www.w3.org/2000/svg';
  const FARBEN = ['#111111', '#d64545', '#2f7ed8', '#3aa757', '#e0a419'] as const;
  const BREITEN = [1.2, 2.4, 5] as const;
  const MARKER_FARBE = '#e0a419';
  const HISTORY_LIMIT = 100;
  /* DIE ZWISCHENABLAGE DER ZEICHENSCHICHT (E353): ein Ort fuer alle
     Flaechen, damit Kopiertes von einem Blatt auf dem naechsten landet.
     Nur im Speicher — nichts davon wird gesichert. */
  let zwischenablage: any[] = [];
  /* DER RADIERER (E352): drei Arten, wie in GoodNotes — die ganze Marke,
     nur den beruehrten Teil eines Strichs, nur Marker. Die Wahl liegt in
     `zeichnen:radierer` und ueberlebt den Neustart. */
  const RADIERER = [
    { id: 'ganz', name: 'Ganz', zeichen: '●', titel: 'Radierer: ganze Marken' },
    { id: 'teil', name: 'Teil', zeichen: '½', titel: 'Radierer: nur den berührten Teil eines Strichs' },
    { id: 'marker', name: 'Marker', zeichen: '▰', titel: 'Radierer: nur Marker' }
  ] as const;
  const RADIER_VORGABE = 'ganz';

  /* DIE FORMEN (E375). Vier Werkzeuge, die dasselbe tun — zwei Punkte
     aufziehen — und sich nur im Ergebnis unterscheiden. Sie stehen deshalb
     als EIN Werkzeug in der Leiste und als vier im Zubehör. Die Kennungen
     sind die alten (`line`, `arrow`, `rectangle`, `ellipse`): sie stehen so
     in jeder gespeicherten Marke, und daran wird nichts geändert (§53.3). */
  const FORMEN = [
    { id: 'line', name: 'Linie', zeichen: '╱', titel: 'Gerade Linie' },
    { id: 'arrow', name: 'Pfeil', zeichen: '→', titel: 'Pfeil' },
    { id: 'rectangle', name: 'Rechteck', zeichen: '□', titel: 'Rechteck' },
    { id: 'ellipse', name: 'Ellipse', zeichen: '○', titel: 'Ellipse' },
    /* ZWEI MEHR, WIE GOODNOTES (E465): das Dreieck und das Rechteck mit
       runden Ecken. Beide sind Zweipunkt-Formen wie die vier davor —
       der Zeichner unterscheidet sie nur im Ergebnis. Neue Kennungen,
       englisch wie die alten, weil sie so in der Marke stehen (§53.3). */
    { id: 'triangle', name: 'Dreieck', zeichen: '△', titel: 'Dreieck' },
    { id: 'roundrect', name: 'Rund', zeichen: '▢', titel: 'Rechteck mit runden Ecken' }
  ] as const;
  const FORM_VORGABE = 'line';
  const formArtLesen = (): string => {
    const wert = typeof Store !== 'undefined' ? String(Store.getMeta('zeichnen:form') || '') : '';
    return FORMEN.some(f => f.id === wert) ? wert : FORM_VORGABE;
  };
  const istForm = (was: string): boolean => FORMEN.some(f => f.id === was);
  const radierModusLesen = (): string => {
    const wert = typeof Store !== 'undefined' ? String(Store.getMeta('zeichnen:radierer') || '') : '';
    return RADIERER.some(r => r.id === wert) ? wert : RADIER_VORGABE;
  };
  /* DIE STIFTE (E351). `kugel` ist der Strich, den es seit E100 gibt — eine
     Breite je Strich. `fueller` und `pinsel` zeichnen eine Flaeche, deren
     Breite dem Druck folgt: der Fueller massvoll, der Pinsel kraeftig.
     Alte Marken ohne `stil` bleiben, wie sie waren (§53.3). */
  const STIFTE = [
    { id: 'fueller', name: 'Füller', zeichen: '🖋' },
    { id: 'kugel',   name: 'Kugelschreiber', zeichen: '🖊' },
    { id: 'pinsel',  name: 'Pinsel', zeichen: '🖌' },
    /* DER BLEISTIFT (E465), wie GoodNotes' Pencil: duenn, leicht
       durchscheinend, mit koerniger Kante — die Flaeche des Fuellers,
       nur schmaler und mit 72 % Deckung. Er steht am Ende der Reihe,
       damit der Wechsel Fueller → Kugel → Pinsel bleibt, wie test343 ihn
       kennt. */
    { id: 'bleistift', name: 'Bleistift', zeichen: '✏' }
  ] as const;
  const STIL_VORGABE = 'fueller';
  const HOECHSTENS_EIGENE_FARBEN = 4;
  /* DIE SCHRIFT AUF DEM BLATT (E360, L115 Punkt 6): dieselben fuenf Familien
     wie am Block (E101, Register.textstile), hier als Stapel fuer SVG —
     Attribute kennen keine CSS-Variablen, und der Druck liest sie roh.
     Die Stufen sind die Leiter, auf der A− und A+ gehen. */
  const SCHRIFTEN = [
    { id: 'standard', name: 'Standard', stapel: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" },
    { id: 'serif',    name: 'Serifen', stapel: "Georgia, 'Times New Roman', serif" },
    { id: 'mono',     name: 'Schreibmaschine', stapel: 'ui-monospace, Menlo, Consolas, monospace' },
    { id: 'hand',     name: 'Handschrift', stapel: "'Segoe Print', 'Bradley Hand', 'Comic Sans MS', cursive" },
    { id: 'schmal',   name: 'Schmal', stapel: "'Arial Narrow', 'Roboto Condensed', 'Helvetica Neue', sans-serif" }
  ] as const;
  const SCHRIFT_STUFEN: readonly number[] = [11, 13, 16, 20, 26, 34];
  type Schrift = { familie: string; groesse: number; fett: boolean; rahmen: boolean };
  const SCHRIFT_VORGABE: Schrift = { familie: 'standard', groesse: 16, fett: false, rahmen: false };
  const schriftStapel = (id: unknown): string =>
    (SCHRIFTEN.find(x => x.id === String(id)) || SCHRIFTEN[0]).stapel;
  const schriftLesen = (): Schrift => {
    const roh = typeof Store !== 'undefined' ? Store.getMeta('zeichnen:schrift') : null;
    const s = roh && typeof roh === 'object' ? roh as Record<string, unknown> : {};
    return {
      familie: SCHRIFTEN.some(x => x.id === s.familie) ? String(s.familie) : SCHRIFT_VORGABE.familie,
      groesse: SCHRIFT_STUFEN.includes(Number(s.groesse)) ? Number(s.groesse) : SCHRIFT_VORGABE.groesse,
      fett: !!s.fett, rahmen: !!s.rahmen };
  };
  const naechsteStufe = (jetzt: number, richtung: number): number => {
    if (richtung > 0) return SCHRIFT_STUFEN.find(v => v > jetzt) ?? SCHRIFT_STUFEN[SCHRIFT_STUFEN.length - 1]!;
    return [...SCHRIFT_STUFEN].reverse().find(v => v < jetzt) ?? SCHRIFT_STUFEN[0]!;
  };
  /** Der Breitenfaktor eines Punkts nach Druck und Stift. */
  const druckFaktor = (stil: string, p: number): number => {
    const d = Math.max(0.05, Math.min(1, Number.isFinite(p) ? p : 0.5));
    if (stil === 'pinsel') return 0.3 + d * 1.7;
    /* Der Bleistift schwillt kaum — ein Graphitstift wird mit Druck
       dunkler, nicht breiter; das Bisschen Breite hier ist der Winkel. */
    if (stil === 'bleistift') return 0.35 + d * 0.6;
    return 0.5 + d * 1.0;
  };
  /** Die drei Stifte, die als FLAECHE gezeichnet werden (der Kugelschreiber ist die Linie). */
  const FLAECHEN_STIFTE = new Set(['fueller', 'pinsel', 'bleistift']);

  const svg = (name: string, attributes: Record<string, unknown> = {}): SVGElement => {
    const element = document.createElementNS(NS, name);
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, String(value)));
    return element;
  };
  const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));
  const idOf = (mark: any): string => String(mark?.id || '');
  const strokeWidth = (mark: any): number => {
    const base = Math.max(0.5, Number(mark?.breite) || BREITEN[1]);
    const values = Array.isArray(mark?.pressure)
      ? mark.pressure.map(Number).filter((value: number) => Number.isFinite(value)) : [];
    const average = values.length ? values.reduce((sum: number, value: number) => sum + value, 0) / values.length : 0.5;
    const pressureFactor = Math.max(0.55, Math.min(1.55, 0.65 + average * 0.7));
    return base * pressureFactor * (mark?.art === 'marker' ? 4 : 1);
  };

  const arrowPath = (start: InkPoint, end: InkPoint): string => {
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const angle = Math.atan2(dy, dx);
    const head = Math.max(10, Math.min(24, Math.hypot(dx, dy) * 0.22));
    const left = [end[0] - head * Math.cos(angle - Math.PI / 6),
                  end[1] - head * Math.sin(angle - Math.PI / 6)];
    const right = [end[0] - head * Math.cos(angle + Math.PI / 6),
                   end[1] - head * Math.sin(angle + Math.PI / 6)];
    return `M${start[0]} ${start[1]} L${end[0]} ${end[1]} ` +
      `M${left[0]} ${left[1]} L${end[0]} ${end[1]} L${right[0]} ${right[1]}`;
  };

  /* EIN BILD AUF DEM BLATT (E357, L115 Punkt 6). Die Datei liegt in der
     Ablage — in Stuecken, nie als Data-URL in der Marke —, die Marke traegt
     nur ihre Kennung und zwei Ecken. Die Adresse (eine Objekt-URL) kennt
     `Dateien`; ist sie schon bekannt, zeichnet `zeichneMarke` das Bild
     sofort, und genau darauf verlassen sich Druck und Folien, die synchron
     lesen. Ist sie noch nicht da, steht ein Platzhalter, und die Adresse
     kommt nach — oder sie kommt nicht, und der Platzhalter sagt es. */
  const BILD_FEHLT = 'Bild fehlt';
  const bildPlatzhalter = (box: InkBounds, wort = ''): SVGElement[] => {
    const rahmen = svg('rect', { x: box.x, y: box.y, width: box.width, height: box.height,
      rx: 2, class: 'blatt-bild-fehlt' });
    if (!wort) return [rahmen];
    const groesse = Math.max(7, Math.min(14, box.height / 6, box.width / 8));
    const text = svg('text', { x: box.x + box.width / 2, y: box.y + box.height / 2,
      'text-anchor': 'middle', 'dominant-baseline': 'middle', 'font-size': groesse,
      'font-family': 'system-ui, sans-serif', class: 'blatt-bild-fehlt-wort' });
    text.textContent = wort;
    return [rahmen, text];
  };
  const bildNachladen = (dateiId: string, gruppe: SVGElement): void => {
    if (typeof Dateien === 'undefined' || typeof Dateien.adresse !== 'function') return;
    Promise.resolve(Dateien.adresse(dateiId)).then((url: string | null) => {
      /* Der Kasten wird JETZT vom Platzhalter gelesen, nicht von damals:
         beim Ziehen flickt `updateNode` seine Lage, und die Antwort soll
         dort landen, wo das Bild inzwischen steht. Ohne Platzhalter ist
         die Gruppe ersetzt worden — dann zeichnet der Ersatz selbst. */
      const rahmen = gruppe.querySelector('.blatt-bild-fehlt');
      if (!rahmen) return;
      const box: InkBounds = { x: Number(rahmen.getAttribute('x')), y: Number(rahmen.getAttribute('y')),
        width: Number(rahmen.getAttribute('width')), height: Number(rahmen.getAttribute('height')) };
      gruppe.querySelectorAll('.blatt-bild-fehlt, .blatt-bild-fehlt-wort').forEach(node => node.remove());
      if (url) {
        gruppe.appendChild(svg('image', { x: box.x, y: box.y, width: box.width, height: box.height,
          href: url, preserveAspectRatio: 'none' }));
      } else {
        bildPlatzhalter(box, BILD_FEHLT).forEach(node => gruppe.appendChild(node));
      }
    }).catch(() => { /* der Platzhalter bleibt stehen */ });
  };

  /** Bildschirm, Druck und Praesentation rufen denselben Zeichner auf. */
  const zeichneMarke = (mark: any): SVGElement | null => {
    if (!mark || typeof mark !== 'object') return null;
    const art = String(mark.art || 'stift');
    const color = String(mark.farbe || FARBEN[0]);
    const width = strokeWidth(mark);
    const points = InkGeometry.points(mark.pts);
    let element: SVGElement | null = null;

    /* --- Ein Fachzeichen auf der Seite (Punkt 42) -------------------------
     * Das Symbol wird NICHT hier gezeichnet, sondern aus `register/fachzeichen`
     * geholt — derselben Quelle, aus der die Palette im Schaltplan schöpft.
     * Eine zweite Symbolliste für das PDF wäre L34: sie liefe auseinander,
     * und niemand merkte es, bis ein Zeichen auf dem Plan anders aussieht als
     * dasselbe Zeichen auf der PDF-Seite daneben.
     * -------------------------------------------------------------------- */
    if (art === 'zeichen') {
      const point = InkGeometry.points([mark.point])[0];
      const fz = (typeof Register !== 'undefined' && Register.fachzeichen)
        ? Register.fachzeichen : null;
      if (!point || !fz) return null;
      const roh = fz.alsSvg(String(mark.zeichenId || ''), {
        farbe: color, drehung: Number(mark.drehung) || 0,
        gespiegelt: !!mark.gespiegelt });
      if (!roh) return null;
      const mass = fz.masse(String(mark.zeichenId || ''), Number(mark.drehung) || 0);
      const wunsch = Math.max(12, Number(mark.groesse) || 64);
      const faktor = wunsch / Math.max(mass.w || 1, mass.h || 1);
      const gruppe = svg('g', {
        /* Der gesetzte Punkt ist die MITTE des Zeichens und nicht seine linke
           obere Ecke: man tippt dorthin, wo das Symbol sitzen soll. */
        transform: `translate(${point[0] - (mass.w * faktor) / 2} ` +
          `${point[1] - (mass.h * faktor) / 2}) scale(${faktor.toFixed(4)})`,
        fill: 'none', stroke: color,
        'stroke-width': (2 / faktor).toFixed(3),
        'stroke-linecap': 'round', 'stroke-linejoin': 'round'
      });
      /* `alsSvg` liefert ein vollständiges <svg>; hier wird nur sein Inhalt
         gebraucht, damit das Zeichen im Blattraum sitzt und mitskaliert. */
      gruppe.innerHTML = roh.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
      /* Eine unsichtbare Fläche, damit das Zeichen auch in seinen Lücken
         greifbar ist — ein Kontakt besteht fast nur aus Linien. */
      const griff = svg('rect', { x: 0, y: 0, width: mass.w, height: mass.h,
        fill: 'transparent', stroke: 'none' });
      gruppe.insertBefore(griff, gruppe.firstChild);
      gruppe.setAttribute('data-sid', idOf(mark));
      gruppe.setAttribute('data-ink-art', art);
      return gruppe;
    }

    if (art === 'text') {
      const layout = InkGeometry.textLayout(mark);
      if (layout) {
        /* DER TEXTKASTEN (E360): `point` ist die linke obere Ecke, die
           Zeilen kommen aus `InkGeometry.textLayout` — dieselben Zeilen,
           die auch der Auswahlkasten kennt. Ein Rahmen, wenn die Marke
           einen will; sonst eine unsichtbare Flaeche, damit der Kasten
           auch zwischen den Woertern greifbar ist. */
        const gruppe = svg('g', { 'pointer-events': 'all' });
        gruppe.appendChild(mark.rahmen
          ? svg('rect', { x: layout.x, y: layout.y, width: layout.width, height: layout.height, rx: 3,
              fill: 'none', stroke: color, 'stroke-width': Math.max(0.6, layout.fontSize / 16).toFixed(2),
              class: 'blatt-textrahmen' })
          : svg('rect', { x: layout.x, y: layout.y, width: layout.width, height: layout.height,
              fill: 'transparent', stroke: 'none' }));
        const textKnoten = svg('text', {
          x: layout.x + layout.pad, y: layout.y + layout.pad + layout.fontSize * 0.85, fill: color,
          'font-size': layout.fontSize, 'font-family': schriftStapel(layout.family),
          'font-weight': layout.bold ? 700 : 400 });
        layout.lines.forEach((zeile, index) => {
          const stueck = svg('tspan', { x: layout.x + layout.pad, dy: index === 0 ? 0 : layout.zeile });
          stueck.textContent = zeile || ' ';
          textKnoten.appendChild(stueck);
        });
        gruppe.appendChild(textKnoten);
        gruppe.setAttribute('data-sid', idOf(mark));
        gruppe.setAttribute('data-ink-art', art);
        gruppe.setAttribute('data-kasten', '1');
        return gruppe;
      }
      /* Die einzeilige Textmarke von frueher (E100) bleibt, wie sie war —
         nur Schrift und Fett hoert sie jetzt auch. */
      const point = InkGeometry.points([mark.point])[0];
      if (!point) return null;
      element = svg('text', {
        x: point[0], y: point[1], fill: color,
        'font-size': Math.max(8, Number(mark.fontSize) || 18),
        'font-family': schriftStapel(mark.schrift), 'font-weight': mark.fett ? 700 : 400,
        'dominant-baseline': 'alphabetic'
      });
      element.textContent = String(mark.text || '').replace(/[\r\n]+/g, ' ');
    } else if (art === 'line' && points.length >= 2) {
      element = svg('line', { x1: points[0]![0], y1: points[0]![1],
        x2: points[1]![0], y2: points[1]![1] });
    } else if (art === 'arrow' && points.length >= 2) {
      element = svg('path', { d: arrowPath(points[0]!, points[1]!) });
    } else if (art === 'rectangle' && points.length >= 2) {
      const box = InkGeometry.rectangle(points[0]!, points[1]!);
      element = svg('rect', { x: box.x, y: box.y, width: box.width, height: box.height });
    } else if (art === 'abdeck' && points.length >= 2) {
      /* DAS ABDECKBAND (E266): eine DECKENDE Fläche über dem, was man
         gleich abfragen will — Formel zudecken, selbst antworten,
         antippen, nachsehen. Gezeichnet wird es wie ein Rechteck; die
         Füllung ist der Sinn der Sache und steht deshalb HIER, vor dem
         Strich-Block unten, der jede Form auf fill:none stellt.
         GESPEICHERT IST IMMER „ZUGEDECKT": das Aufdecken lebt nur im
         Sichtbaren (data-auf, siehe schicht) und schreibt nie in die
         Ablage — Lernen darf den Speicher nicht anfassen. Druck und
         Folien rufen denselben Zeichner und zeigen darum zu. */
      const box = InkGeometry.rectangle(points[0]!, points[1]!);
      element = svg('rect', { x: box.x, y: box.y, width: box.width,
        height: box.height, rx: 4, fill: color, 'pointer-events': 'all' });
      element.setAttribute('data-sid', idOf(mark));
      element.setAttribute('data-ink-art', art);
      return element;
    } else if (art === 'zettel' && points.length >= 2) {
      /* DIE HAFTNOTIZ (E267): ein farbiger Zettel mit Text, direkt auf
         Blatt oder PDF-Seite — für „hier nachfragen!" neben der Aufgabe.
         Der Text bricht selbst um (SVG-Text kann das nicht); die Schrift
         wählt ihre Tinte nach der Helligkeit des Zettels, sonst stünde
         Schwarz auf Schwarz. Wie beim Abdeckband gilt: eigener Zweig mit
         Rückgabe, der Strich-Block unten würde die Füllung löschen. */
      const box = InkGeometry.rectangle(points[0]!, points[1]!);
      const gruppe = svg('g', { 'pointer-events': 'all' });
      const wert = /^#([0-9a-f]{6})$/i.exec(color)?.[1] || 'e0a419';
      const hell = (parseInt(wert.slice(0, 2), 16) * 299 +
                    parseInt(wert.slice(2, 4), 16) * 587 +
                    parseInt(wert.slice(4, 6), 16) * 114) / 255000;
      const tinte = hell < 0.55 ? '#f5f5f2' : '#1c1c1c';
      gruppe.appendChild(svg('rect', { x: box.x, y: box.y, width: box.width,
        height: box.height, rx: 3, fill: color, 'fill-opacity': 0.92,
        stroke: 'rgba(0,0,0,.2)', 'stroke-width': 0.6 }));
      const groesse = Math.max(9, Number(mark.fontSize) || 13);
      const pad = Math.max(4, groesse * 0.5);
      const textKnoten = svg('text', {
        x: box.x + pad, y: box.y + pad + groesse * 0.8, fill: tinte,
        'font-size': groesse, 'font-family': 'system-ui, sans-serif' });
      const proZeile = Math.max(4, Math.floor((box.width - pad * 2) / (groesse * 0.52)));
      const zeilen: string[] = [];
      for (const roh of String(mark.text || '').split(/\r?\n/)) {
        let rest = roh;
        if (!rest) { zeilen.push(''); continue; }
        while (rest.length > proZeile) {
          let schnitt = rest.lastIndexOf(' ', proZeile);
          if (schnitt < proZeile * 0.5) schnitt = proZeile;
          zeilen.push(rest.slice(0, schnitt));
          rest = rest.slice(schnitt).replace(/^ /, '');
        }
        zeilen.push(rest);
      }
      const maxZeilen = Math.max(1, Math.floor((box.height - pad) / (groesse * 1.25)));
      zeilen.slice(0, maxZeilen).forEach((zeile, index) => {
        const stueck = svg('tspan', { x: box.x + pad,
          dy: index === 0 ? 0 : groesse * 1.25 });
        stueck.textContent = zeile || ' ';
        textKnoten.appendChild(stueck);
      });
      gruppe.appendChild(textKnoten);
      gruppe.setAttribute('data-sid', idOf(mark));
      gruppe.setAttribute('data-ink-art', art);
      return gruppe;
    } else if (art === 'bild' && points.length >= 2) {
      /* DAS BILD (E357): ein <image> zwischen den zwei Ecken, aus der
         Ablage. `preserveAspectRatio: none` — die Ecken sind die Wahrheit;
         das Seitenverhaeltnis haelt die Auswahl beim Ziehen (siehe dort),
         nicht der Zeichner. Ohne bekannte Adresse ein Platzhalter, siehe
         `bildNachladen`. Eigener Zweig mit Rueckgabe, wie Zettel und Band:
         der Strich-Block unten wuerde die Gruppe mit Strichfarbe versehen. */
      const box = InkGeometry.rectangle(points[0]!, points[1]!);
      const gruppe = svg('g', { 'pointer-events': 'all' });
      const dateiId = String(mark.dateiId || '');
      const url = dateiId && typeof Dateien !== 'undefined' && typeof Dateien.adresseBekannt === 'function'
        ? Dateien.adresseBekannt(dateiId) : null;
      if (url) {
        gruppe.appendChild(svg('image', { x: box.x, y: box.y, width: box.width, height: box.height,
          href: url, preserveAspectRatio: 'none' }));
      } else {
        bildPlatzhalter(box, dateiId ? '' : BILD_FEHLT).forEach(node => gruppe.appendChild(node));
        if (dateiId) bildNachladen(dateiId, gruppe);
      }
      gruppe.setAttribute('data-sid', idOf(mark));
      gruppe.setAttribute('data-ink-art', art);
      return gruppe;
    } else if (art === 'ellipse' && points.length >= 2) {
      const box = InkGeometry.rectangle(points[0]!, points[1]!);
      element = svg('ellipse', { cx: box.x + box.width / 2, cy: box.y + box.height / 2,
        rx: box.width / 2, ry: box.height / 2 });
    } else if (art === 'triangle' && points.length >= 2) {
      /* DAS DREIECK (E465): Spitze oben in der Mitte, Grundseite unten —
         im Kasten der zwei Punkte, wie Rechteck und Ellipse. */
      const box = InkGeometry.rectangle(points[0]!, points[1]!);
      element = svg('polygon', { points:
        `${box.x + box.width / 2},${box.y} ${box.x},${box.y + box.height} ${box.x + box.width},${box.y + box.height}` });
    } else if (art === 'roundrect' && points.length >= 2) {
      /* DAS RUNDE RECHTECK (E465): die Rundung ein Sechstel der kuerzeren
         Seite — so bleibt ein schmales Kaestchen ein Kaestchen und kein
         Kissen. */
      const box = InkGeometry.rectangle(points[0]!, points[1]!);
      const rund = Math.max(2, Math.min(box.width, box.height) / 6);
      element = svg('rect', { x: box.x, y: box.y, width: box.width, height: box.height, rx: rund, ry: rund });
    } else if (art === 'stift' && FLAECHEN_STIFTE.has(String(mark.stil)) && points.length >= 3) {
      /* DER STRICH ALS FLAECHE (E351): links und rechts der Mittellinie eine
         Kontur, deren Abstand dem Druck folgt. Ohne Druckwerte je Punkt
         (alter Bestand) bleibt es beim gleichmaessigen Strich unten. */
      const base = Math.max(0.5, Number(mark.breite) || BREITEN[1]);
      const druck: number[] = Array.isArray(mark.pressure) ? mark.pressure.map(Number) : [];
      const halb = points.map((_p, i) => base / 2 * druckFaktor(String(mark.stil), druck[i] ?? druck[druck.length - 1] ?? 0.5));
      element = svg('path', { d: InkGeometry.outline(points, halb), fill: color, stroke: color,
        'stroke-width': 0.25, 'stroke-linejoin': 'round' });
      if (mark.stil === 'pinsel') element.setAttribute('opacity', '0.92');
      /* DIE KOERNUNG DES BLEISTIFTS (E465): ein gestrichelter Haarstrich
         um die Flaeche — die Kante wird rau, wie Graphit auf Papier, und
         die Flaeche bleibt durchscheinend. Kein Filter: ein `feTurbulence`
         je Strich kostet auf einer vollen Seite ein Bild je Bild. */
      if (mark.stil === 'bleistift') {
        element.setAttribute('opacity', '0.72');
        element.setAttribute('stroke-width', '0.7');
        element.setAttribute('stroke-dasharray', '0.9 0.6');
      }
      element.setAttribute('data-sid', idOf(mark));
      element.setAttribute('data-ink-art', art);
      element.setAttribute('data-ink-stil', String(mark.stil));
      return element;
    } else if (points.length >= 2) {
      element = svg('path', { d: InkGeometry.path(points) });
    }
    if (!element) return null;

    if (art !== 'text') {
      element.setAttribute('fill', 'none');
      element.setAttribute('stroke', color);
      element.setAttribute('stroke-width', String(width));
      element.setAttribute('stroke-linecap', 'round');
      element.setAttribute('stroke-linejoin', 'round');
      if (art === 'marker') {
        element.setAttribute('opacity', '0.32');
        element.setAttribute('style', 'mix-blend-mode:multiply');
      }
      /* Geschlossene Formen lassen sich auch in ihrer Flaeche greifen. Die
         Flaeche bleibt optisch leer; `pointer-events` aendert nur den Treffer. */
      if (art === 'rectangle' || art === 'ellipse' || art === 'triangle' || art === 'roundrect')
        element.setAttribute('pointer-events', 'all');
    }
    element.setAttribute('data-sid', idOf(mark));
    element.setAttribute('data-ink-art', art);
    return element;
  };

  const updateNode = (node: SVGElement | null, mark: any): SVGElement | null => {
    const fresh = zeichneMarke(mark);
    if (!fresh) return null;
    /* Ein Knoten MIT Kindern wird ersetzt und nicht geflickt: unten werden
       nur Attribute und `textContent` übertragen, und ein <g> voller Pfade
       behielte damit seine alten Kinder. Beim Fachzeichen hiesse das: die
       Kennung ändert sich, das Bild nicht. */
    /* EIN BILD WIRD GEFLICKT, NICHT ERSETZT (E357): beim Ziehen kaeme sonst
       je Bewegung ein neues <image> mit derselben Adresse — und ein noch
       ladendes Bild bekaeme seine Antwort nie, weil die Gruppe, auf die
       sie wartet, laengst ausgetauscht waere. Gleiche Kinder, gleiche
       Reihenfolge: dann wandern nur Lage und Mass. */
    if (node && node.getAttribute('data-ink-art') === 'bild' && fresh.getAttribute('data-ink-art') === 'bild' &&
        node.childElementCount === fresh.childElementCount &&
        [...node.children].every((kind, n) => kind.tagName === fresh.children[n]?.tagName)) {
      [...fresh.children].forEach((neu, n) => {
        const alt = node.children[n];
        if (!alt) return;
        for (const name of ['x', 'y', 'width', 'height', 'font-size']) {
          const wert = neu.getAttribute(name);
          if (wert !== null) alt.setAttribute(name, wert);
        }
      });
      node.setAttribute('data-sid', fresh.getAttribute('data-sid') || '');
      return node;
    }
    if (fresh.firstElementChild || node?.firstElementChild) {
      if (node?.parentNode) node.replaceWith(fresh);
      return fresh;
    }
    if (!node || node.tagName !== fresh.tagName) {
      if (node?.parentNode) node.replaceWith(fresh);
      return fresh;
    }
    [...node.attributes].forEach(attribute => node.removeAttribute(attribute.name));
    [...fresh.attributes].forEach(attribute => node.setAttribute(attribute.name, attribute.value));
    node.textContent = fresh.textContent;
    return node;
  };

  /* Eine globale Lebenswache statt eines pagehide-Zuhoerers je Neuzeichnung
     (E115). Sie schliesst einen laufenden Strich, bevor seine SVG verschwindet. */
  type LiveLayer = { flaeche: SVGSVGElement; abschliessen: () => boolean };
  const lebende = new Set<LiveLayer>();
  let observer: MutationObserver | null = null;
  let inspectionQueued = false;
  const inspectLayers = (): void => {
    inspectionQueued = false;
    let saved = false;
    for (const layer of [...lebende]) {
      if (layer.flaeche.isConnected) continue;
      if (layer.abschliessen()) saved = true;
      lebende.delete(layer);
    }
    if (!lebende.size && observer) { observer.disconnect(); observer = null; }
    if (saved && typeof App !== 'undefined' && App.zeichneSeite) App.zeichneSeite();
  };
  const registerLayer = (layer: LiveLayer): void => {
    lebende.add(layer);
    if (typeof MutationObserver === 'undefined') return;
    if (!observer) observer = new MutationObserver(() => {
      if (inspectionQueued) return;
      inspectionQueued = true;
      queueMicrotask(inspectLayers);
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  };
  if (typeof addEventListener === 'function') {
    addEventListener('pagehide', () => { for (const layer of lebende) layer.abschliessen(); });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden')
        for (const layer of lebende) layer.abschliessen();
    });
  }

  /**
   * Die Zeichenfläche zu einem Block.
   *
   * DER RAND WÄCHST NACH RECHTS, UND KEINE MARKE ZIEHT MIT (E301, L107).
   * L107 hat angenommen, dass ein breiterer Raum jede gespeicherte Marke
   * verschiebt. Das stimmt nur, wenn die Seite auf dem Bildschirm ihre
   * Breite BEHÄLT und die Box wächst — dann wird jede Einheit kleiner.
   * Wächst die Box dagegen nur nach rechts, während die Seite ihren Anteil
   * an der Fläche behält, ändert sich keine einzige gespeicherte Zahl: eine
   * Marke bei x=300 ist weiterhin 300 Einheiten vom linken Seitenrand
   * entfernt.
   *
   * Deshalb braucht es hier KEIN zweites Feld und KEINEN zweiten Raum. Ein
   * Strich darf sogar von der Seite in den Rand durchlaufen — und genau das
   * ist der Griff, den Redur an OneNote meint.
   *
   * @param rand Zusatzbreite RECHTS, in denselben Einheiten wie `breite`.
   */
  const schicht = (block: any, breite: number, hoehe: number, umbruch = 0,
                   rand = 0) => {
    const R = SheetSpace;
    const marks: any[] = Array.isArray(block.marken) ? clone(block.marken) : [];
    let tool = 'schreiben';
    let color: string = FARBEN[0];
    let width: number = BREITEN[1];
    let radierModus: string = radierModusLesen();
    /* HANDBALLEN-SCHUTZ (E354): sobald ein Stift die Flaeche beruehrt hat,
       zeichnen Finger vier Sekunden lang nicht — sie rollen. So darf die
       Hand beim Schreiben auf dem Glas liegen wie auf Papier. Die Sperre
       steht als `data-stift` an der Flaeche, damit auch das CSS weiss, dass
       ein Finger jetzt rollen darf (touch-action). Und ein Zug gehoert dem
       Zeiger, der ihn begonnen hat: Bewegungen und Loslassen anderer Zeiger
       gehen ihn nichts an. */
    const STIFT_SPERRE_MS = 4000;
    /* FORMERKENNUNG (E355): wer einen Kreis zieht und am Ende kurz haelt,
       bekommt einen Kreis — wie in GoodNotes. Das Halten ist die Absicht;
       ohne Halten bleibt jeder Strich, was er ist. Abschaltbar, gemerkt in
       `zeichnen:formen`. */
    const HALTEN_MS = 450;
    let formen: boolean = typeof Store !== 'undefined' ? Store.getMeta('zeichnen:formen') !== false : true;
    let stiftZuletzt = 0;
    let stiftTimer: ReturnType<typeof setTimeout> | null = null;
    let aktiverZeiger: number | null = null;
    let fingerPan: { id: number; x: number; y: number; left: number; top: number; center: HTMLElement } | null = null;
    let radierStrich: { before: any[]; geaendert: boolean; letzter: number[]; kreis: SVGElement | null } | null = null;
    /* Der Stift, mit dem der naechste Strich entsteht — gemerkt ueber
       Neuladen hinweg, wie das Papier eines Hefts (E351). */
    let stil: string = (typeof Store !== 'undefined' && STIFTE.some(st => st.id === Store.getMeta('zeichnen:stift')))
      ? String(Store.getMeta('zeichnen:stift')) : STIL_VORGABE;
    /* Die Schrift fuer den naechsten Text (E360) — gemerkt in `zeichnen:schrift`. */
    let schrift: Schrift = schriftLesen();
    let running: any = null;
    let runningNode: SVGElement | null = null;
    let beforeRunning: any[] | null = null;
    /* ---- DER NASSE STRICH (E376) -----------------------------------------
     * Gemessen war der Grund fuer die Zaehigkeit eindeutig: bis hierher wurde
     * bei JEDEM Zeigerereignis der ganze Umriss neu gerechnet — 484,7 ms
     * Geometrie fuer einen Strich mit 600 Punkten, am Ende 0,774 ms je
     * Ereignis. Die `Feder` waechst stattdessen — 9,2× schneller ueber den
     * Strich, 10,1× am Ende, nachgemessen in test366 §2 — und liefert dabei
     * ZEICHENGLEICH denselben Pfad
     * wie `InkGeometry.outline` — geprueft in test366, sonst saehe der nasse
     * Strich anders aus als der trockene.
     * -------------------------------------------------------------------- */
    let feder: any = null;
    let glatt: ((p: [number, number], dt: number) => [number, number]) | null = null;
    let druckGlatt: ((p: number) => number) | null = null;
    let letzteZeit = 0;
    /* Wo der Zeiger ZULETZT WIRKLICH WAR — ungeglaettet. Beim Absetzen wird
       der letzte gespeicherte Punkt dorthin gezogen (siehe `finish`). */
    let rohLetzter: number[] | null = null;
    /* Ob der laufende Strich gerade als FLAECHE gezeichnet wird (Fueller,
       Pinsel ab drei Punkten) oder als Linie. Wechselt er die Bauart, wird
       der Knoten einmal ganz neu gebaut statt sein `d` gesetzt. */
    let nassFlaeche = false;
    let bildWunsch = 0;
    let selection = new Set<string>();
    let selectDrag: any = null;
    const historyUndo: any[][] = [];
    const historyRedo: any[][] = [];
    const stateListeners = new Set<(state: any) => void>();

    const randBreit = Math.max(0, Number(rand) || 0);
    const flaeche = svg('svg', { class: 'blatt-marken',
      viewBox: `0 0 ${breite + randBreit} ${hoehe}`,
      preserveAspectRatio: 'none', 'data-tool': tool }) as SVGSVGElement;
    /* Die Kante zwischen Seite und Rand — gestrichelt, damit sie nicht wie
       ein gezeichneter Strich aussieht. Nur wenn es einen Rand gibt. */
    if (randBreit > 0)
      flaeche.appendChild(svg('line', { x1: breite, x2: breite, y1: 0, y2: hoehe,
        stroke: 'currentColor', 'stroke-width': 0.7, 'stroke-dasharray': '4 5',
        opacity: 0.3, class: 'blatt-randkante' }));
    for (let page = 1; umbruch > 0 && page * umbruch < hoehe; page++) {
      flaeche.appendChild(svg('line', { x1: 0, x2: breite, y1: page * umbruch, y2: page * umbruch,
        stroke: 'currentColor', 'stroke-width': 0.5, 'stroke-dasharray': '6 6',
        opacity: 0.35, class: 'blatt-umbruch' }));
    }
    /* DIE GEZEICHNETE FASSUNG JE MARKE (E358, L115 Punkt 7): ein JSON-Text
       je Kennung, wie die Marke zuletzt in einen Knoten kam. `redraw`
       vergleicht dagegen und fasst nur an, was anders ist. Wo der Text
       fehlt (ein Strich oder ein Einsetzen haengt seinen Knoten direkt an),
       wird einmal geflickt und dann gemerkt. */
    /* ---- WAS DER KNOTEN ZEIGT (E358, seit E379 als OBJEKT) ---------------
     * Die Karte sagt, AUS WELCHER MARKE der Knoten gezeichnet wurde. Bis
     * E378 stand darin die Marke als Zeichenkette, und `redraw()` schrieb
     * dafuer bei jedem Durchgang die ganze Seite aus — 5,95 ms bei 800
     * Strichen, jedes Mal, wenn ein Zurueck, eine Haftnotiz, ein Text oder
     * ein Radierzug neu zeichnen liess.
     *
     * Seit E378 gilt: eine Marke in `marks` wird ERSETZT, nie von innen
     * geaendert. Damit beantwortet die Identitaet des Objekts genau
     * dieselbe Frage — und zwar in einem Takt statt in einer Zeichenkette
     * (17 µs statt 5,95 ms).
     *
     * Und sie beantwortet sie SCHAERFER: zwei verschiedene Objekte mit
     * gleichem Inhalt galten frueher als „unveraendert". Jetzt wird in dem
     * Fall neu gezeichnet — mehr Arbeit als noetig, aber nie zu wenig. In
     * die falsche Richtung zu irren ist hier die richtige Richtung.
     * -------------------------------------------------------------------- */
    const gezeichnet = new Map<string, any>();
    const fassung = (mark: any): string => JSON.stringify(mark);
    /* `merke` steht hinter JEDEM Weg, der einen Knoten direkt aendert oder
       anhaengt — Ziehen, Griff, Umfaerben, Radieren, Strichende, Einsetzen,
       Bild. Die Merkliste muss sagen, was der KNOTEN zeigt, nicht was die
       Marke ist: nach einem Zurueck ist die Marke wieder die alte, der
       Knoten aber noch der verschobene, und nur ein ehrlicher Eintrag
       laesst `redraw` das sehen (gefunden von test350 §3). */
    const merke = (mark: any): void => { gezeichnet.set(idOf(mark), mark); };
    marks.forEach(mark => {
      const node = zeichneMarke(mark);
      if (node) { flaeche.appendChild(node); merke(mark); }
    });

    /* Welche Abdeckbänder GERADE aufgedeckt sind — nur Laufzeit, nie
       Ablage: nach Neuladen oder Neuzeichnen von aussen ist wieder alles
       zu, und genau das ist die ehrliche Vorgabe beim Lernen (E266). */
    const aufgedeckt = new Set<string>();
    const abdeckAnwenden = (): void => {
      flaeche.querySelectorAll<SVGElement>('[data-ink-art="abdeck"]').forEach(node => {
        const id = node.getAttribute('data-sid') || '';
        if (aufgedeckt.has(id)) node.setAttribute('data-auf', '1');
        else node.removeAttribute('data-auf');
      });
    };

    /* Das Lineal (E267): ein Schalter, kein Werkzeug. Solange es anliegt,
       rasten Linie und Pfeil auf 15°-Schritte — waagrecht, senkrecht und
       die üblichen Winkel dazwischen, ohne zitternde Hand. Nur Laufzeit,
       Vorgabe aus. */
    let lineal = false;
    const rasten = (anfang: number[], ende: number[]): number[] => {
      const dx = ende[0]! - anfang[0]!;
      const dy = ende[1]! - anfang[1]!;
      const radius = Math.hypot(dx, dy);
      if (radius < 0.001) return ende;
      const schritt = Math.PI / 12;
      const winkel = Math.round(Math.atan2(dy, dx) / schritt) * schritt;
      return [anfang[0]! + radius * Math.cos(winkel),
              anfang[1]! + radius * Math.sin(winkel)];
    };

    /* ---- DER MERKZETTEL FUERS ZURUECK (E378) -----------------------------
     * Bis hierher klonte `snapshot()` die GANZE Seite — und zwar bei jedem
     * Aufsetzen des Stifts. Gemessen auf einer vollen Seite Handschrift:
     *
     *     400 Striche   4,28 ms klonen + 3,74 ms vergleichen =  8,0 ms
     *     800 Striche  11,96 ms klonen + 11,46 ms vergleichen = 23,4 ms
     *
     * 23 ms sind fast drei Bilder bei 120 Hz — jedes Mal, wenn der Stift das
     * Papier beruehrt, und noch einmal, wenn er abhebt. Genau das fuehlt
     * sich zaeh an, und zwar umso mehr, je voller die Seite ist.
     *
     * Der Merkzettel braucht die Marken gar nicht zu klonen. Er braucht nur
     * die LISTE, wie sie war — solange keine Marke, die schon in `marks`
     * steht, jemals von innen geaendert wird. Das ist die Regel dieses
     * Bogens, und sie steht nicht nur als Satz da:
     *
     *   `snapshot()` FRIERT ein, was es weggibt. Wer danach eine Marke von
     *   innen aendert, bekommt in `"use strict"` einen Fehler statt eines
     *   stillen Datenverlusts. Und ein stiller Datenverlust waere es: der
     *   Merkzettel zeigte dann schon die Aenderung, und „Zurueck" holte
     *   nichts zurueck.
     *
     * Statt zu aendern wird ERSETZT — `marks[i] = { ...alt, farbe: neu }`.
     * Genau so machen es `move` und `scale` seit E353 schon.
     * -------------------------------------------------------------------- */
    const snapshot = (): any[] => {
      const liste = marks.slice();
      for (const mark of liste) {
        /* Auch die Punktlisten — sonst faenge `Object.freeze` nur ein
           `mark.farbe = …` ab und nicht ein `mark.pts.push(…)`, und genau
           das waere die stillere Haelfte des Datenverlusts. */
        if (Array.isArray(mark?.pts)) Object.freeze(mark.pts);
        if (Array.isArray(mark?.pressure)) Object.freeze(mark.pressure);
        Object.freeze(mark);
      }
      return liste;
    };
    /** Der Platz einer Marke in `marks` — fuer das Ersetzen an Ort und Stelle. */
    const platzVon = (id: string): number => marks.findIndex(mark => idOf(mark) === id);
    /** Eine Marke ersetzen, statt sie zu aendern (siehe `snapshot`). */
    const ersetze = (index: number, neu: any): any => {
      if (index < 0 || index >= marks.length) return null;
      marks[index] = neu;
      return neu;
    };
    const state = () => ({ undo: historyUndo.length > 0, redo: historyRedo.length > 0,
      selected: selection.size, clipboard: zwischenablage.length > 0 });
    const notifyState = (): void => stateListeners.forEach(listener => listener(state()));
    const save = (): void => Store.updateBlock(block.id, { marken: marks, raumVersion: R.RAUM_VERSION });
    /* ZWEI LISTEN VERGLEICHEN, OHNE SIE ZU SCHREIBEN (E378). Bis hierher
       hiess das zweimal `JSON.stringify` ueber die ganze Seite — 11,5 ms bei
       800 Strichen, nur um die Frage „hat sich etwas geaendert?" zu
       beantworten. Seit `snapshot()` flach ist, sind unveraenderte Marken
       DASSELBE Objekt, und der Vergleich bricht beim ersten Unterschied ab.
       Die Zeichenkette bleibt als Rueckfall fuer den Fall, dass eine Marke
       ersetzt wurde, ohne sich zu unterscheiden. */
    const listenGleich = (a: any[], b: any[]): boolean => {
      if (a === b) return true;
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) {
        if (a[i] === b[i]) continue;
        if (fassung(a[i]) !== fassung(b[i])) return false;
      }
      return true;
    };
    const commit = (before: any[]): void => {
      if (listenGleich(before, marks)) return;
      historyUndo.push(before);
      if (historyUndo.length > HISTORY_LIMIT) historyUndo.shift();
      historyRedo.length = 0;
      save(); notifyState();
    };
    const nodeFor = (id: string): SVGElement | null =>
      id ? flaeche.querySelector<SVGElement>(`[data-sid="${CSS.escape(id)}"]`) : null;
    /* NEUZEICHNEN FASST NUR AN, WAS SICH GEAENDERT HAT (E358, L115 Punkt 7).
       Bisher nahm `redraw` jeden Knoten weg und zeichnete alle neu — bei
       tausend Marken 59 ms je Zurueck, bei dreitausend 155, gemessen.
       Jetzt: gleiche Fassung, gleicher Knoten; andere Fassung, geflickt
       (`updateNode`); Marke ohne Knoten, neu; Knoten ohne Marke, weg. Die
       Reihenfolge der Marken bleibt die Reihenfolge der Knoten — sie ist
       die Stapelung auf dem Papier; wo sie nicht stimmt, wird eingeordnet. */
    const redraw = (): void => {
      flaeche.querySelectorAll('[data-ink-ui]').forEach(node => node.remove());
      const knoten = new Map<string, SVGElement>();
      flaeche.querySelectorAll<SVGElement>('[data-sid]').forEach(node => {
        const id = node.getAttribute('data-sid') || '';
        if (knoten.has(id)) node.remove(); else knoten.set(id, node);
      });
      const bleibt = new Set<string>();
      let vorheriger: SVGElement | null = null;
      for (const mark of marks) {
        const id = idOf(mark);
        if (!id || bleibt.has(id)) continue;
        let node = knoten.get(id) || null;
        if (!node) node = zeichneMarke(mark);
        else if (gezeichnet.get(id) !== mark) node = updateNode(node, mark);
        if (!node) { gezeichnet.delete(id); continue; }
        bleibt.add(id);
        gezeichnet.set(id, mark);
        const platz: ChildNode | null = vorheriger ? vorheriger.nextSibling : flaeche.querySelector('[data-sid]');
        if (node.parentNode !== flaeche || node !== platz) flaeche.insertBefore(node, platz);
        vorheriger = node;
      }
      knoten.forEach((node, id) => { if (!bleibt.has(id)) { node.remove(); gezeichnet.delete(id); } });
      abdeckAnwenden();
      renderSelection();
    };
    const restore = (next: any[]): void => {
      /* Flach, aus demselben Grund wie `snapshot` (E378): die Marken werden
         nicht geaendert, sondern ersetzt — also darf die Liste sie teilen. */
      marks.splice(0, marks.length, ...next);
      selection = new Set([...selection].filter(id => marks.some(mark => idOf(mark) === id)));
      save(); redraw(); notifyState();
    };
    const undo = (): void => {
      const previous = historyUndo.pop();
      if (!previous) return;
      historyRedo.push(snapshot()); restore(previous);
    };
    const redo = (): void => {
      const next = historyRedo.pop();
      if (!next) return;
      historyUndo.push(snapshot()); restore(next);
    };
    /** Der gemeinsame Kasten der Auswahl, mit demselben Rand wie die Rahmen. */
    const auswahlKasten = (): { x: number; y: number; width: number; height: number } => {
      const boxes = [...selection]
        .map(id => marks.find(item => idOf(item) === id))
        .filter(Boolean)
        .map(mark => InkGeometry.bounds(mark));
      const box = InkGeometry.union(boxes);
      return { x: box.x - 3, y: box.y - 3, width: box.width + 6, height: box.height + 6 };
    };
    function renderSelection(): void {
      flaeche.querySelectorAll('[data-ink-ui="selection"],[data-ink-ui="griffe"]').forEach(node => node.remove());
      for (const id of selection) {
        const mark = marks.find(item => idOf(item) === id);
        if (!mark) continue;
        const box = InkGeometry.bounds(mark);
        flaeche.appendChild(svg('rect', { x: box.x - 3, y: box.y - 3,
          width: box.width + 6, height: box.height + 6,
          class: 'blatt-auswahlrahmen', 'data-ink-ui': 'selection' }));
      }
      /* DIE GRIFFE (E353): ein Kasten um alles Gewaehlte, an jeder Ecke ein
         Griff. Das Trefffeld ist groesser als der sichtbare Punkt — am
         Telefon waere ein Griff von fuenf Einheiten sonst nicht zu fassen. */
      if (selection.size) {
        const k = auswahlKasten();
        const g = svg('g', { 'data-ink-ui': 'griffe' });
        g.appendChild(svg('rect', { x: k.x, y: k.y, width: k.width, height: k.height,
          class: 'blatt-auswahlkasten' }));
        const ecken: Array<[string, number, number]> = [
          ['nw', k.x, k.y], ['ne', k.x + k.width, k.y],
          ['sw', k.x, k.y + k.height], ['se', k.x + k.width, k.y + k.height]];
        for (const [name, x, y] of ecken) {
          g.appendChild(svg('circle', { cx: x, cy: y, r: 22, class: 'blatt-griff-feld', 'data-griff': name }));
          g.appendChild(svg('circle', { cx: x, cy: y, r: 5, class: 'blatt-griff' }));
        }
        flaeche.appendChild(g);
      }
      notifyState();
    }
    /** Liegt die Marke im Lasso? Linienzuege mit der Haelfte ihrer Punkte,
        alles andere mit der Mitte seines Kastens. */
    const imLasso = (mark: any, schlinge: number[][]): boolean => {
      const art = String(mark?.art || '');
      const linie = art === 'stift' || art === 'marker' || art === 'line' || art === 'arrow';
      if (linie && Array.isArray(mark.pts) && mark.pts.length) {
        const drin = (mark.pts as number[][]).filter(p => InkGeometry.insidePolygon([p[0] ?? 0, p[1] ?? 0], schlinge)).length;
        return drin * 2 >= mark.pts.length;
      }
      const box = InkGeometry.bounds(mark);
      return InkGeometry.insidePolygon([box.x + box.width / 2, box.y + box.height / 2], schlinge);
    };
    const deleteSelection = (): void => {
      if (!selection.size) return;
      const before = snapshot();
      for (let index = marks.length - 1; index >= 0; index--)
        if (selection.has(idOf(marks[index]))) marks.splice(index, 1);
      selection.clear(); redraw(); commit(before);
    };
    /* KOPIEREN UND EINSETZEN (E353). Eingesetzt wird um sechzehn Einheiten
       versetzt, mit frischen Kennungen, und die Ablage wandert mit — ein
       zweites Einsetzen legt sich nicht auf das erste. Eingesetztes ist
       danach die Auswahl, im Auswahl-Werkzeug. */
    const copySelection = (): number => {
      const kopie = marks.filter(mark => selection.has(idOf(mark))).map(mark => clone(mark));
      if (kopie.length) { zwischenablage = kopie; notifyState(); }
      return kopie.length;
    };
    const paste = (): number => {
      if (!zwischenablage.length) return 0;
      if (tool !== 'select') {
        setzeWerkzeug('select');
        if (typeof Zeichenziel !== 'undefined') {
          try { Zeichenziel.uebernehme(steuerung, 'select'); } catch { /* egal */ }
        }
      }
      const before = snapshot();
      const neue = zwischenablage.map(mark => InkGeometry.move({ ...clone(mark), id: frischeId() }, 16, 16));
      marks.push(...neue);
      neue.forEach(mark => { const node = zeichneMarke(mark); if (node) { flaeche.appendChild(node); merke(mark); } });
      selection = new Set(neue.map(mark => idOf(mark)));
      zwischenablage = neue.map(mark => clone(mark));
      renderSelection();
      commit(before);
      return neue.length;
    };

    /* Der Radierer ist ein Kreis; seine Groesse haengt an der gewaehlten
       Strichstaerke — duenn, mittel, dick, wie beim Stift. */
    const radierRadius = (): number => Math.max(5, width * 3);
    const frischeId = (): string =>
      typeof Ids !== 'undefined' ? Ids.short(8) : 'm' + Math.random().toString(36).slice(2, 10);
    /* EIN RADIERSCHRITT (E352): alles, was der Kreis um `center` beruehrt.
       „ganz" nimmt die Marke, „marker" nur Marker, „teil" schneidet Stift
       und Marker am Kreis auf und laesst den Rest stehen — Formen, Text und
       Zeichen gehen auch dort ganz, wie in GoodNotes. Die Knoten werden
       einzeln getauscht, nicht die ganze Schicht neu gezeichnet. */
    /* EINE Marke radieren — nach der gewaehlten Art. Gibt zurueck, ob sich
       etwas geaendert hat. */
    const radiereEine = (index: number, center: [number, number], r: number): boolean => {
      const mark = marks[index];
      if (!mark) return false;
      if (radierModus === 'marker' && mark.art !== 'marker') return false;
      /* Ein Bild radiert man nicht weg — wie in GoodNotes: der Radierer
         gilt der Tinte, ein Bild geht ueber die Auswahl (E357). */
      if (mark.art === 'bild') return false;
      const id = idOf(mark);
      const teilbar = radierModus === 'teil' && (mark.art === 'stift' || mark.art === 'marker');
      const stuecke: Array<{ pts: number[][]; pressure: number[] }> = teilbar
        ? InkGeometry.splitByCircle(mark.pts, mark.pressure, center, r) : [];
      /* Nur am Rand gestreift, nichts abgeschnitten: dann bleibt die Marke.
         Verglichen werden die PUNKTE, nicht ihre Zahl — ein Endpunkt im
         Kreis wird durch den Eintrittspunkt ersetzt, die Zahl bleibt gleich,
         die Marke nicht (gefunden von test344 §2: die Luecke war 2,7 statt 7,2). */
      if (teilbar && stuecke.length === 1 && JSON.stringify(stuecke[0]!.pts) === JSON.stringify(mark.pts)) return false;
      nodeFor(id)?.remove();
      gezeichnet.delete(id);
      selection.delete(id);
      const ersatz = stuecke.map((stueck, n) =>
        ({ ...clone(mark), id: n === 0 ? id : frischeId(), pts: stueck.pts, pressure: stueck.pressure }));
      marks.splice(index, 1, ...ersatz);
      ersatz.forEach(neu => { const node = zeichneMarke(neu); if (node) { flaeche.appendChild(node); merke(neu); } });
      return true;
    };
    const radiereBei = (roh: number[]): boolean => {
      const center: [number, number] = [roh[0] ?? 0, roh[1] ?? 0];
      const r = radierRadius();
      let getroffen = false;
      for (let index = marks.length - 1; index >= 0; index--) {
        const mark = marks[index];
        if (radierModus === 'marker' && mark.art !== 'marker') continue;
        if (!InkGeometry.touchesCircle(mark, center, r, strokeWidth(mark) / 2)) continue;
        if (radiereEine(index, center, r)) getroffen = true;
      }
      return getroffen;
    };
    /* EIN TIPP AUF EINE MARKE MEINT DIESE MARKE (E352, gefunden von test174 §5):
       drei Striche uebereinander, ein Tipp auf den obersten — der Kreis
       haette alle drei genommen. Erst die Marke unter dem Zeiger; erst wenn
       dort nichts ist oder nichts geschieht, sucht der Kreis. */
    const radiereMarke = (id: string, roh: number[]): boolean => {
      const index = marks.findIndex(mark => idOf(mark) === id);
      if (index < 0) return false;
      return radiereEine(index, [roh[0] ?? 0, roh[1] ?? 0], radierRadius());
    };

    const pressureOf = (event: PointerEvent): number => {
      const pressure = Number(event.pressure);
      return pressure > 0 ? Math.max(0.05, Math.min(1, pressure)) : 0.5;
    };
    /* DRUCK OHNE DRUCKSENSOR (E351). Maus und Finger melden 0,5 oder gar
       nichts; ein Fueller, der darauf hoert, waere ein Kugelschreiber. Wer
       keinen Stift fuehrt, bekommt das TEMPO als Ersatz: langsam ist dick,
       schnell ist duenn — so schreibt auch die Hand. Geglaettet, damit
       kein Ruckeln der Maus als Zittern im Strich landet. Der Wert landet
       im selben Feld `pressure`: kein zweites Format, keine Migration. */
    const druckAus = (event: PointerEvent, point: number[]): number => {
      const echt = event.pointerType === 'pen' && Number(event.pressure) > 0;
      if (echt || !running) return pressureOf(event);
      const jetzt = Number(event.timeStamp) || 0;
      const z = running.zuletzt as { t: number; p: number[]; d: number } | undefined;
      let druck = 0.6;
      if (z && z.p) {
        const dt = Math.max(1, jetzt - z.t);
        const v = Math.hypot((point[0] ?? 0) - (z.p[0] ?? 0), (point[1] ?? 0) - (z.p[1] ?? 0)) / dt;
        druck = Math.max(0.28, Math.min(0.85, 0.85 - v * 0.4));
        druck = z.d * 0.6 + druck * 0.4;
      }
      running.zuletzt = { t: jetzt, p: point, d: druck };
      return Math.round(druck * 100) / 100;
    };
    const stiftGesehen = (): void => {
      stiftZuletzt = Date.now();
      flaeche.setAttribute('data-stift', 'an');
      const dokument = flaeche.closest<HTMLElement>('.document-workspace');
      if (dokument) dokument.dataset.documentPen = 'seen';
      if (stiftTimer) clearTimeout(stiftTimer);
      stiftTimer = setTimeout(() => {
        if (!flaeche.closest('.document-workspace')) flaeche.removeAttribute('data-stift');
        stiftTimer = null;
      }, STIFT_SPERRE_MS);
    };
    const fingerGesperrt = (event: PointerEvent): boolean =>
      event.pointerType === 'touch' &&
      (flaeche.closest<HTMLElement>('.document-workspace')?.dataset.documentPen === 'seen' ||
       Date.now() - stiftZuletzt < STIFT_SPERRE_MS || (running !== null && running.zeigerArt === 'pen'));
    /* Einen angefangenen Strich VERWERFEN: kein Knoten, kein Schritt im
       Verlauf — als haette es ihn nie gegeben. */
    const verwerfen = (): void => {
      if (running) { runningNode?.remove(); running = null; runningNode = null; beforeRunning = null; }
      aktiverZeiger = null;
    };
    const addSample = (event: PointerEvent): void => {
      if (!running) return;
      const roh = R.zuBlatt(flaeche, event);
      if (!roh) return;
      /* DER DRUCK KOMMT AUS DEM ROHEN PUNKT (E376): der Ersatzdruck fuer
         Maus und Finger rechnet aus der Geschwindigkeit, und geglaettete
         Punkte bewegen sich langsamer als die Hand. */
      const drucken = druckAus(event, roh);
      const jetzt = Number(event.timeStamp) || letzteZeit;
      const dt = letzteZeit ? Math.max(1, jetzt - letzteZeit) : 16;
      letzteZeit = jetzt;
      /* GEGLAETTET WIRD IMMER, GESPEICHERT NICHT (E376). Der Filter laeuft
         auch dann weiter, wenn der Punkt unter der Schwelle bleibt — sonst
         bliebe er bei langsamer Hand fuer immer hinter ihr zurueck. */
      const point = glatt ? glatt(roh as [number, number], dt) : roh;
      rohLetzter = roh;
      const druck = druckGlatt ? druckGlatt(drucken) : drucken;
      const last = running.pts[running.pts.length - 1];
      if (last && Math.abs(last[0] - point[0]) < 0.6 && Math.abs(last[1] - point[1]) < 0.6) return;
      running.pts.push(point);
      running.pressure.push(druck);
      running.bewegtUm = Date.now();
      feder?.punkt(point, halbeBreite(running, druck));
    };

    /* Die halbe Strichbreite an einer Stelle — dieselbe Rechnung, die
       `zeichneMarke` fuer den trockenen Fuellerstrich anstellt. Waere sie
       hier anders, spraenge der Strich beim Absetzen des Stifts. */
    const halbeBreite = (mark: any, druck: number): number => {
      const base = Math.max(0.5, Number(mark?.breite) || BREITEN[1]);
      return base / 2 * druckFaktor(String(mark?.stil || ''), druck);
    };

    /* ---- EIN BILD JE BILD, NICHT JE EREIGNIS (E376) ----------------------
     * Ein Stift meldet sich bis zu 240-mal je Sekunde, ein Bildschirm zeigt
     * 60- bis 120-mal. Bis hierher wurde jede Meldung sofort gezeichnet —
     * bis zu drei Viertel dieser Arbeit sah nie jemand. Jetzt sammelt der
     * Strich und zeichnet einmal je Bild.
     * -------------------------------------------------------------------- */
    const nassZeichnen = (): void => {
      if (!running || !feder || !runningNode) return;
      const alsFlaeche = running.art === 'stift' &&
        FLAECHEN_STIFTE.has(String(running.stil)) && feder.laenge() >= 3;
      if (alsFlaeche !== nassFlaeche) {
        /* Der Strich wechselt die Bauart — der Knoten wird einmal ganz neu
           gebaut, danach genuegt wieder sein `d`. */
        nassFlaeche = alsFlaeche;
        runningNode = updateNode(runningNode, nasseMarke());
        return;
      }
      const d = alsFlaeche ? feder.d() : feder.linie();
      if (d) runningNode.setAttribute('d', d);
      if (!alsFlaeche) runningNode.setAttribute('stroke-width', String(strokeWidth(running)));
    };
    /* Die Marke, wie sie GERADE aussieht — mit mindestens zwei Punkten,
       damit `zeichneMarke` auch beim Aufsetzen etwas zu zeichnen hat. */
    const nasseMarke = (): any => ({ ...running,
      pts: running.pts.length > 1 ? running.pts : [running.pts[0], running.pts[0]] });
    /* ---- DER NASSE SCHWANZ (E376) ---------------------------------------
     * Zwischen der Bewegung der Hand und dem Bild auf dem Glas liegen immer
     * ein paar Millisekunden — das ist die Luecke, die GoodNotes fuellt.
     * Der Browser hilft mit `getPredictedEvents()`, wo er kann; sonst rechnet
     * `InkStroke.vorhersage` selbst weiter.
     *
     * DIESE PUNKTE GEHEN NIE IN `running.pts`. Ein vorhergesagter Punkt ist
     * eine Vermutung ueber die naechsten 14 ms; gespeichert waere er fuer
     * immer da, und jeder Strich endete mit einem Ueberschuss, den niemand
     * gezogen hat. `Feder.nass()` zeichnet ihn, `Feder.punkte()` kennt ihn
     * nicht — test366 haelt genau das fest.
     * -------------------------------------------------------------------- */
    const nassenSchwanz = (event: PointerEvent): void => {
      if (!feder || !running) return;
      const druck = running.pressure[running.pressure.length - 1] ?? 0.5;
      const halb = halbeBreite(running, druck);
      let pts: number[][] = [];
      const vom = typeof (event as any).getPredictedEvents === 'function'
        ? (event as any).getPredictedEvents() as PointerEvent[] : [];
      if (vom.length) {
        for (const p of vom.slice(0, 3)) {
          const q = R.zuBlatt(flaeche, p);
          if (q) pts.push(q);
        }
      }
      if (!pts.length) {
        const jetzt = Number(event.timeStamp) || 0;
        pts = InkStroke.vorhersage(running.pts as any, InkStroke.VORHER_MS,
          letzteZeit && jetzt > letzteZeit ? jetzt - letzteZeit : 8) as any;
      }
      feder.nass(pts as any, pts.map(() => halb));
    };

    const bildAnfordern = (): void => {
      if (bildWunsch) return;                     /* ein Bild ist schon bestellt */
      if (typeof requestAnimationFrame !== 'function') { nassZeichnen(); return; }
      bildWunsch = requestAnimationFrame(() => { bildWunsch = 0; nassZeichnen(); });
    };
    const bildAbsagen = (): void => {
      if (bildWunsch && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(bildWunsch);
      bildWunsch = 0;
    };
    /* EIN BILD AUFS BLATT (E357, L115 Punkt 6). Der Weg: Dateiwaehler,
       Datei in die Ablage (in Stuecken, mit dem Blatt als Block — so wandert
       sie mit Sicherung, Abgleich und Papierkorb), Groesse aus dem Bild,
       mittig gesetzt, halb so breit wie die Seite, dann gewaehlt und im
       Auswahl-Werkzeug: man will es gleich schieben und ziehen. `mitte`
       kommt vom Tipp mit dem Werkzeug; der Knopf in der Leiste hat keinen
       Punkt und nimmt die Mitte der ersten Seite. */
    const bildMass = (datei: Blob): Promise<{ w: number; h: number } | null> => new Promise(fertig => {
      const url = URL.createObjectURL(datei);
      const bild = new Image();
      bild.onload = () => { fertig({ w: bild.naturalWidth, h: bild.naturalHeight }); URL.revokeObjectURL(url); };
      bild.onerror = () => { fertig(null); URL.revokeObjectURL(url); };
      bild.src = url;
    });
    const bildAblegen = async (datei: File, mitte?: number[]): Promise<boolean> => {
      if (!datei || typeof Dateien === 'undefined' || typeof Dateien.ablegen !== 'function') return false;
      const mass = await bildMass(datei);
      const satz = await Dateien.ablegen(datei, { blockId: block.id, name: datei.name });
      const dateiId = String(satz?.id || '');
      if (!dateiId) return false;
      const seite = umbruch > 0 ? Math.min(umbruch, hoehe) : hoehe;
      const verhaeltnis = mass && mass.w > 0 && mass.h > 0 ? mass.h / mass.w : 3 / 4;
      let w = breite / 2;
      let h = w * verhaeltnis;
      if (h > seite * 0.9) { h = seite * 0.9; w = h / verhaeltnis; }
      const klemme = (wert: number, von: number, bis: number): number => Math.max(von, Math.min(bis, wert));
      const cx = mitte ? klemme(mitte[0] ?? 0, w / 2, breite - w / 2) : breite / 2;
      const cy = mitte ? klemme(mitte[1] ?? 0, h / 2, hoehe - h / 2) : seite / 2;
      const r2 = (wert: number): number => Math.round(wert * 100) / 100;
      const mark = { id: frischeId(), art: 'bild', dateiId,
        pts: [[r2(cx - w / 2), r2(cy - h / 2)], [r2(cx + w / 2), r2(cy + h / 2)]] };
      /* Die Adresse VOR dem Zeichnen holen: dann steht das Bild sofort da,
         nicht erst ein Platzhalter, der gleich wieder weg ist. */
      try { await Dateien.adresse(dateiId); } catch { /* dann eben der Platzhalter */ }
      const before = snapshot();
      marks.push(mark);
      const node = zeichneMarke(mark);
      if (node) { flaeche.appendChild(node); merke(mark); }
      if (tool !== 'select') {
        setzeWerkzeug('select');
        if (typeof Zeichenziel !== 'undefined') {
          try { Zeichenziel.uebernehme(steuerung, 'select'); } catch { /* egal */ }
        }
      }
      selection = new Set([idOf(mark)]);
      renderSelection();
      commit(before);
      return true;
    };
    const bildEinfuegen = (mitte?: number[]): Promise<boolean> => new Promise(fertig => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      /* Im Dokument, wie beim PDF-Waehler (einlesen.ts) — und danach weg. */
      input.style.display = 'none';
      document.body.appendChild(input);
      let entschieden = false;
      const auf = (): void => {
        if (entschieden) return;
        entschieden = true;
        const datei = input.files?.[0];
        input.remove();
        if (!datei) { fertig(false); return; }
        bildAblegen(datei, mitte).then(fertig, () => {
          if (typeof UI !== 'undefined' && UI.toast) UI.toast('Das Bild liess sich nicht ablegen.');
          fertig(false);
        });
      };
      input.addEventListener('change', auf);
      /* `cancel` kommt in neueren Browsern beim Abbrechen; sonst bleibt das
         Feld unsichtbar stehen, bis das naechste kommt — kein Schaden. */
      input.addEventListener('cancel', auf);
      input.click();
    });

    const finish = (): boolean => {
      aktiverZeiger = null;
      if (radierStrich) {
        const strich = radierStrich;
        radierStrich = null;
        strich.kreis?.remove();
        if (!strich.geaendert) return false;
        renderSelection();
        commit(strich.before);
        return true;
      }
      if (selectDrag) {
        const drag = selectDrag;
        selectDrag = null;
        flaeche.querySelectorAll('[data-ink-ui="box"]').forEach(node => node.remove());
        if ((drag.mode === 'move' || drag.mode === 'scale') && drag.moved) { commit(drag.before); return true; }
        if (drag.mode === 'lasso') {
          const pts = drag.pts as number[][];
          if (!drag.add) selection.clear();
          /* Eine Schlinge ist es erst, wenn sie Flaeche hat: mindestens ein
             Siebtel ihres Kastens. Ein fast gerader Zug — mit dem Zittern
             der Hand nie ganz gerade — ist der Kasten von frueher (E352),
             nicht ein Splitter, in dem nichts liegt. */
          const huelle = InkGeometry.union(pts.map(q => ({ x: q[0] ?? 0, y: q[1] ?? 0, width: 0, height: 0 })));
          const flaeche = InkGeometry.polygonArea(pts);
          if (pts.length >= 3 && flaeche > 4 && flaeche >= 0.15 * huelle.width * huelle.height) {
            marks.forEach(mark => { if (imLasso(mark, pts)) selection.add(idOf(mark)); });
          } else if (pts.length >= 2) {
            const a = pts[0]!, z = pts[pts.length - 1]!;
            const box = InkGeometry.rectangle([a[0] ?? 0, a[1] ?? 0], [z[0] ?? 0, z[1] ?? 0]);
            marks.forEach(mark => { if (InkGeometry.intersects(box, InkGeometry.bounds(mark))) selection.add(idOf(mark)); });
          }
          renderSelection();
        }
        return false;
      }
      if (!running) return false;
      const mark = running;
      const node = runningNode;
      const before = beforeRunning || snapshot();
      /* Ein bestelltes Bild waere jetzt ein Bild ohne Strich (E376). */
      bildAbsagen();
      const letzterRoh = rohLetzter;
      feder = null; glatt = null; druckGlatt = null; letzteZeit = 0; nassFlaeche = false;
      rohLetzter = null;
      running = null; runningNode = null; beforeRunning = null;
      delete mark.zeigerArt;
      const gehalten = Date.now() - (Number(mark.bewegtUm) || 0) >= HALTEN_MS;
      delete mark.bewegtUm;
      /* GEHALTEN UND EINE FORM (E355): der Stift wird zur Linie, zum Kreis
         oder zum Rechteck — als dieselbe Marke, mit Farbe und Breite; Druck
         und Stil hat eine Form nicht. Der Marker bleibt Marker: wer
         hervorhebt, will keine Geometrie. */
      if (mark.art === 'stift' && formen && gehalten && typeof InkShapes !== 'undefined') {
        const form = InkShapes.recognize(mark.pts);
        if (form) {
          mark.art = form.art;
          mark.pts = form.pts;
          delete mark.pressure;
          delete mark.stil;
          delete mark.zuletzt;
        }
      }
      if (mark.art === 'stift' || mark.art === 'marker') {
        // A stationary tap is an intentional dot (i, punctuation, circuit node).
        // Two coincident points use the existing round-cap renderer and data format.
        if (mark.pts.length === 1) {
          mark.pts.push([...mark.pts[0]]);
          mark.pressure.push(mark.pressure[0] ?? 0.5);
        }
        delete mark.zuletzt;
        /* DER STRICH ENDET, WO DIE HAND ABHOB (E376) — wie in GoodNotes.
           Der Glaetter hinkt naturgemaess hinterher; beim Absetzen waeren
           das je nach Tempo zwei bis drei Pixel, und ein Haken, den man
           bewusst bis an eine Linie zieht, bliebe kurz davor stehen.
           `test345` und `test346` haben genau das gefunden: ein Strich bis
           x=300 endete bei 297. Der Anfang ist ohnehin roh (siehe
           pointerdown); hier kommt das Ende dazu. */
        if (letzterRoh) mark.pts[mark.pts.length - 1] = letzterRoh;
        const original: number[][] = mark.pts;
        const druckRoh: number[] = Array.isArray(mark.pressure) ? mark.pressure.map(Number) : [];
        const mittel = druckRoh.length
          ? druckRoh.reduce((sum, value) => sum + value, 0) / druckRoh.length : 0.5;
        /* EIN MARKER AM LINEAL ZIEHT GERADE (E351) — wie in GoodNotes: der
           erste und der letzte Punkt, dazwischen nichts. */
        if (mark.art === 'marker' && lineal) {
          mark.pts = [original[0], original[original.length - 1]];
          mark.pressure = [mittel, mittel].map(v => Math.round(v * 100) / 100);
        } else {
          /* DER DRUCK WANDERT MIT (E351). Bis hierher wurde nach dem
             Vereinfachen jeder Druckwert zum Durchschnitt — ein Fueller
             haette nie anschwellen koennen. Jetzt bleiben die Werte der
             Punkte, die bleiben. */
          let indizes = InkGeometry.simplifyIndices(original, Math.max(0.55, Number(mark.breite) * 0.28));
          /* Ein langer, beim Neuzeichnen geschlossener Strich darf nicht wie
             eine bloss konstruierte Zweipunktlinie aussehen (E115). Acht
             Stuetzpunkte halten Verlauf und Druck, auch wenn er fast gerade war. */
          if (original.length >= 8 && indizes.length < 8)
            indizes = Array.from({ length: 8 }, (_value, index) =>
              Math.round(index * (original.length - 1) / 7));
          mark.pts = indizes.map(i => original[i]);
          mark.pressure = indizes.map(i => {
            const v = druckRoh[i];
            return Math.round((Number.isFinite(v) ? (v as number) : mittel) * 100) / 100;
          });
        }
      } else if (mark.pts.length < 2 ||
                 Math.hypot(mark.pts[1][0] - mark.pts[0][0], mark.pts[1][1] - mark.pts[0][1]) < 1) {
        node?.remove(); return false;
      }
      marks.push(mark);
      runningNode = updateNode(node, mark);
      merke(mark);
      commit(before);
      runningNode = null;
      /* Die frisch aufgezogene Haftnotiz fragt sofort nach ihrem Text —
         eine leere Fläche wäre ein Versprechen ohne Inhalt. */
      if (mark.art === 'zettel' && !String(mark.text || '').trim())
        void zettelText(idOf(mark), true);
      return true;
    };

    /** Text einer Haftnotiz erfragen — mehrzeilig, mit Redions eigenem
     *  Blatt statt prompt() (dessen Schwäche im Whiteboard LUECKEN.md
     *  längst führt). Bricht jemand die FRISCHE Notiz ab oder lässt sie
     *  leer, verschwindet sie wieder: ein leerer Zettel sagt nichts. */
    const zettelText = async (targetId: string, frisch = false): Promise<void> => {
      const zettel = marks.find(mark => idOf(mark) === targetId && mark.art === 'zettel');
      if (!zettel) return;
      const antwort = await Dialog.mehrzeilig('Haftnotiz', String(zettel.text || ''));
      const before = snapshot();
      if (antwort === null || !antwort.trim()) {
        if (frisch || (antwort !== null && !antwort.trim())) {
          const index = marks.findIndex(mark => idOf(mark) === targetId);
          if (index >= 0) { marks.splice(index, 1); redraw(); commit(before); }
        }
        return;
      }
      ersetze(platzVon(targetId), { ...zettel, text: antwort });
      redraw(); commit(before);
    };

    /* DER TEXT (E360, L115 Punkt 6): ein Tipp fragt mehrzeilig — Enter ist
       eine neue Zeile, wie in GoodNotes' Textfeld —, und der Text wird ein
       KASTEN an der getippten Stelle: 40 % der Blattbreite, mindestens 120,
       nie ueber den rechten Rand. Schrift, Groesse, Fett und Rahmen kommen
       aus der Leiste. Ein Tipp auf einen vorhandenen Text bearbeitet ihn;
       leer gemacht heisst weg. Alte einzeilige Marken bleiben einzeilig. */
    const editText = async (point: number[], targetId = ''): Promise<void> => {
      const current = targetId ? marks.find(mark => idOf(mark) === targetId && mark.art === 'text') : null;
      const answer = await Dialog.mehrzeilig(current ? 'Text bearbeiten' : 'Text',
        current ? String(current.text || '') : '');
      if (answer === null || (!current && !answer.trim())) return;
      const before = snapshot();
      if (current) {
        if (!answer.trim()) marks.splice(marks.indexOf(current), 1);
        else ersetze(marks.indexOf(current), { ...current, text: answer });
      } else {
        const x = Math.round(Math.max(0, Math.min(point[0] ?? 0, breite - 120)) * 100) / 100;
        const y = Math.round(Math.max(0, Math.min(point[1] ?? 0, hoehe - 40)) * 100) / 100;
        const breiteBox = Math.max(120, Math.min(Math.round(breite * 0.4), Math.round(breite - x - 8)));
        marks.push({ id: frischeId(), art: 'text', point: [x, y], text: answer, farbe: color,
          fontSize: schrift.groesse, breiteBox, schrift: schrift.familie, fett: schrift.fett, rahmen: schrift.rahmen });
      }
      redraw(); commit(before);
    };

    /**
     * Ein Fachzeichen setzen (Punkt 42).
     *
     * Die Palette kommt aus `Planflaeche.paletteHtml` — genau die, die auch
     * im Schaltplan-Editor steht. Sie mitzubenutzen ist nicht Sparsamkeit,
     * sondern die einzige Art, zwei Auswahllisten zu vermeiden, die
     * auseinanderlaufen.
     *
     * Die zuletzt gewählte Kennung und die Grösse bleiben gemerkt: wer zehn
     * Schalter auf einen Grundriss setzt, will die Palette nicht zehnmal
     * durchsuchen.
     */
    const setzeZeichen = async (point: number[], targetId = ''): Promise<void> => {
      /* Ein vorhandenes Zeichen antippen dreht es weiter — dieselbe Bewegung
         wie im Planeditor, wo R dreht. Ohne das müsste man löschen und neu
         setzen, nur um einen Schalter aufrecht zu stellen. */
      const vorhanden = targetId
        ? marks.find(mark => idOf(mark) === targetId && mark.art === 'zeichen') : null;
      if (vorhanden) {
        const before = snapshot();
        /* Ersetzen statt aendern (E378) — der Merkzettel oben teilt sich die
           Marke mit `marks`, und ein gedrehtes Zeichen im Merkzettel waere
           ein „Zurueck", das nichts zurueckholt. Genau das hat der eingefrorene
           Merkzettel hier gefunden: test242 sah `Cannot assign to read only
           property 'drehung'`. */
        ersetze(marks.indexOf(vorhanden),
          { ...vorhanden, drehung: ((Number(vorhanden.drehung) || 0) + 90) % 360 });
        redraw(); commit(before);
        return;
      }
      const gewaehlt = await zeichenWaehlen();
      if (!gewaehlt) return;
      const before = snapshot();
      marks.push({
        id: typeof Ids !== 'undefined' ? Ids.short(8) : String(marks.length + 1),
        art: 'zeichen', zeichenId: gewaehlt, point,
        groesse: letzteGroesse, drehung: 0, gespiegelt: false, farbe: color
      });
      redraw(); commit(before);
    };

    let letztesZeichen = '';
    let letzteGroesse = 64;

    const zeichenWaehlen = (): Promise<string> => new Promise(fertig => {
      if (typeof Planflaeche === 'undefined' || typeof Register === 'undefined'
        || !Register.fachzeichen) { fertig(''); return; }
      const o = document.createElement('div');
      o.className = 'overlay';
      o.innerHTML = '<div class="finder" style="width:min(560px,94vw)">' +
        '<div class="fh">Fachzeichen setzen' +
        '<button class="icon-btn" data-a="zu" aria-label="Schliessen">✕</button></div>' +
        '<div class="mz-suche"><input type="search" placeholder="Symbol suchen …" ' +
        'aria-label="Symbol suchen"></div>' +
        '<div class="mz-groesse"><label>Grösse' +
        `<input type="range" min="24" max="180" step="4" value="${letzteGroesse}" ` +
        'aria-label="Grösse des Zeichens"></label>' +
        `<b>${letzteGroesse} px</b></div>` +
        /* Das zuletzt gesetzte Zeichen steht oben und ist einen Klick weit
           weg. Wer zehn Schalter auf einen Grundriss setzt, sucht sonst
           zehnmal dasselbe. */
        (letztesZeichen
          ? '<div class="mz-zuletzt"><span>Zuletzt</span>' +
            `<button data-sym="${letztesZeichen}">` +
            Register.fachzeichen.alsSvg(letztesZeichen, { farbe: 'currentColor' }) +
            `<i>${(Register.fachzeichen.holen(letztesZeichen) || { name: '' }).name}</i>` +
            '</button></div>'
          : '') +
        '<div class="mz-liste">' + Planflaeche.paletteHtml('installationsplan', '') + '</div>' +
        '</div>';
      document.body.appendChild(o);
      const zu = (wert: string) => { o.remove(); fertig(wert); };
      o.addEventListener('input', e => {
        const f = e.target as HTMLInputElement;
        if (f.type === 'search') {
          const liste = o.querySelector('.mz-liste');
          if (liste) liste.innerHTML = Planflaeche.paletteHtml('installationsplan', f.value);
          return;
        }
        if (f.type === 'range') {
          letzteGroesse = Number(f.value) || 64;
          const marke = o.querySelector('.mz-groesse b');
          if (marke) marke.textContent = letzteGroesse + ' px';
        }
      });
      o.addEventListener('click', e => {
        const sym = (e.target as Element).closest<HTMLElement>('[data-sym]');
        if (sym && sym.dataset.sym) { letztesZeichen = sym.dataset.sym; zu(sym.dataset.sym); return; }
        const b = (e.target as Element).closest<HTMLElement>('[data-a]');
        if (e.target === o || (b && b.dataset.a === 'zu')) zu('');
      });
      const feld = o.querySelector('input[type=search]') as HTMLInputElement | null;
      feld?.focus();
    });

    flaeche.addEventListener('pointerdown', (event: PointerEvent) => {
      const e = event;
      /* Wer hier zeichnet, meint DIESE Fläche — und zwar auch dann, wenn er
         gleich wieder abbricht. Das steht vor dem `return` unten, weil auch
         ein Griff im Modus „Schreiben" eine Berührung ist. */
      if (typeof Zeichenziel !== 'undefined') {
        try { Zeichenziel.beruehrt(steuerung); } catch { /* egal */ }
      }
      if (e.pointerType === 'pen') stiftGesehen();
      if (tool === 'schreiben') return;
      /* EIN ZWEITER FINGER macht aus dem Fingerzug eine Geste (Rollen,
         Kneifen): der angefangene Strich verschwindet, kein Schritt im
         Verlauf (E354). */
      if (e.pointerType === 'touch' && !e.isPrimary) {
        if (running && running.zeigerArt === 'touch') verwerfen();
        return;
      }
      if (!e.isPrimary) return;
      /* Der gesperrte Finger bekommt kein preventDefault — er darf rollen. */
      if (fingerGesperrt(e)) {
        const center = flaeche.closest<HTMLElement>('.document-center');
        if (center && !running && aktiverZeiger === null) {
          fingerPan = {id:e.pointerId,x:e.clientX,y:e.clientY,left:center.scrollLeft,top:center.scrollTop,center};
          event.preventDefault();
          try { flaeche.setPointerCapture(e.pointerId); } catch { /* optional */ }
        }
        return;
      }
      /* DER STIFT GEHT VOR: liegt der Handballen schon auf und zeichnet,
         nimmt der Stift ihm den Strich weg (E354). */
      if (e.pointerType === 'pen' && running && running.zeigerArt === 'touch') verwerfen();
      if (e.pointerType === 'pen') fingerPan = null;
      if (aktiverZeiger !== null && aktiverZeiger !== e.pointerId) return;
      /* DER RUECKKNOPF DES STIFTS RADIERT (E352): das Radierende (button 5,
         buttons 32) und der Seitenknopf (button 2) eines Stifts halten den
         Radierer, solange sie gedrueckt sind — das gewaehlte Werkzeug
         bleibt, wie in GoodNotes und OneNote. Eine Maus mit rechter Taste
         radiert nicht: `pointerType` muss `pen` sein. */
      const stiftRadiert = e.pointerType === 'pen' &&
        (e.button === 5 || e.button === 2 || (e.buttons & 32) !== 0);
      if (e.button !== 0 && !stiftRadiert) return;
      const point = R.zuBlatt(flaeche, e);
      if (!point) return;
      event.preventDefault();
      aktiverZeiger = e.pointerId;
      flaeche.focus({ preventScroll: true });
      const target = (event.target as Element)?.closest?.('[data-sid]') as SVGElement | null;
      const targetId = target?.getAttribute('data-sid') || '';

      if (tool === 'radierer' || stiftRadiert) {
        /* STREICHEN STATT TIPPEN (E352): der Radierer ist ein Kreis, der
           mit dem Zeiger wandert; ein Tipp ohne Bewegung ist der Sonderfall
           mit einem einzigen Schritt. Ein Zug ist EIN Schritt im Verlauf. */
        radierStrich = { before: snapshot(), geaendert: false, letzter: point, kreis: null };
        const kreis = svg('circle', { cx: point[0], cy: point[1], r: radierRadius(),
          class: 'blatt-radierkreis', 'data-ink-ui': 'radierer' });
        flaeche.appendChild(kreis);
        radierStrich.kreis = kreis;
        const getroffen = (targetId && radiereMarke(targetId, point)) || radiereBei(point);
        /* Sofort sichern, nicht erst beim Loslassen: ein Tipp ist fertig,
           wenn er da ist (der Verlauf bekommt seinen Schritt in `finish`). */
        if (getroffen) { radierStrich.geaendert = true; save(); }
        try { flaeche.setPointerCapture(event.pointerId); } catch { /* optional */ }
        return;
      }
      if (tool === 'text') { void editText(point, targetId); return; }
      /* Ein Tipp auf einen VORHANDENEN Zettel bearbeitet ihn; sonst wird
         gleich unten eine neue Fläche aufgezogen (der Zwei-Punkt-Weg). */
      if (tool === 'zettel' && targetId &&
          marks.some(mark => idOf(mark) === targetId && mark.art === 'zettel')) {
        void zettelText(targetId);
        return;
      }
      if (tool === 'zeichen') { void setzeZeichen(point, targetId); return; }
      /* Mit dem Bild-Werkzeug (ueber `Zeichenziel.setze`) oeffnet der Tipp
         den Waehler, und das Bild kommt dorthin, wo getippt wurde (E357). */
      if (tool === 'bild') { void bildEinfuegen(point); return; }
      if (tool === 'select') {
        /* EIN GRIFF AM RAHMEN SKALIERT DIE AUSWAHL (E353): die gegenueber-
           liegende Ecke bleibt stehen, die Marken wachsen zum Zeiger hin. */
        const griff = (event.target as Element)?.closest?.('[data-griff]') as SVGElement | null;
        if (griff && selection.size) {
          const kasten = auswahlKasten();
          const ecke = String(griff.getAttribute('data-griff') || 'se');
          const anker: [number, number] = [
            ecke.includes('e') ? kasten.x : kasten.x + kasten.width,
            ecke.includes('s') ? kasten.y : kasten.y + kasten.height];
          selectDrag = { mode: 'scale', start: point, anker, before: snapshot(), moved: false,
            originals: new Map([...selection].map(id => [id, clone(marks.find(mark => idOf(mark) === id))])) };
          try { flaeche.setPointerCapture(event.pointerId); } catch { /* optional */ }
          return;
        }
        if (targetId) {
          if (event.shiftKey) selection.has(targetId) ? selection.delete(targetId) : selection.add(targetId);
          else if (!selection.has(targetId)) selection = new Set([targetId]);
          renderSelection();
          if (!selection.has(targetId)) return;
          selectDrag = { mode: 'move', start: point, before: snapshot(), moved: false,
            originals: new Map([...selection].map(id => [id, clone(marks.find(mark => idOf(mark) === id))])) };
        } else {
          if (!event.shiftKey) { selection.clear(); renderSelection(); }
          /* DAS LASSO (E353): ein freier Zug um die Marken, wie in GoodNotes.
             Ein gerader Zug ohne Flaeche bleibt der Kasten von frueher. */
          selectDrag = { mode: 'lasso', pts: [point], add: event.shiftKey };
          const schlinge = svg('path', { d: `M${point[0]} ${point[1]}`,
            class: 'blatt-auswahlfeld', 'data-ink-ui': 'box' });
          flaeche.appendChild(schlinge);
        }
        try { flaeche.setPointerCapture(event.pointerId); } catch { /* optional */ }
        return;
      }

      beforeRunning = snapshot();
      const id = typeof Ids !== 'undefined' ? Ids.short(8) : String(marks.length + 1);
      if (tool === 'stift' || tool === 'marker') {
        running = { id, art: tool, farbe: tool === 'marker' && color === FARBEN[0] ? MARKER_FARBE : color,
          breite: width, pts: [point], pressure: [], zeigerArt: e.pointerType };
        if (tool === 'stift' && stil !== 'kugel') running.stil = stil;
        running.pressure.push(druckAus(event, point));
        const p0 = running.pressure[0];
        /* DER AUFSETZPUNKT GEHT UNGEGLAETTET DURCH (E376): ein Strich, der
           nicht dort beginnt, wo der Stift das Papier beruehrt hat, ist
           falsch — und kein Filter kann das spaeter zurueckholen. */
        glatt = InkStroke.glaetter(point as [number, number]);
        rohLetzter = null;
        druckGlatt = InkStroke.druckGlaetter(p0);
        letzteZeit = Number(event.timeStamp) || 0;
        feder = new InkStroke.Feder();
        feder.punkt(point, halbeBreite(running, p0));
        nassFlaeche = false;
        runningNode = zeichneMarke({ ...running, pts: [point, point], pressure: [p0, p0] });
      } else {
        /* Ein schwarzer Zettel mit schwarzer Vorgabetinte wäre keiner —
           die Haftnotiz nimmt als Vorgabe das Marker-Gelb (derselbe
           Handgriff wie beim Marker vier Zeilen höher). */
        const flaechenFarbe = tool === 'zettel' && color === FARBEN[0]
          ? MARKER_FARBE : color;
        running = { id, art: tool, farbe: flaechenFarbe, breite: width, pts: [point, point], zeigerArt: e.pointerType };
        runningNode = zeichneMarke(running);
      }
      if (runningNode) flaeche.appendChild(runningNode);
      try { flaeche.setPointerCapture(event.pointerId); } catch { /* optional */ }
    });

    flaeche.addEventListener('pointermove', (event: PointerEvent) => {
      if (fingerPan && fingerPan.id === event.pointerId) {
        event.preventDefault();
        fingerPan.center.scrollLeft = fingerPan.left + fingerPan.x - event.clientX;
        fingerPan.center.scrollTop = fingerPan.top + fingerPan.y - event.clientY;
        return;
      }
      if (!event.isPrimary) return;
      if (event.pointerType === 'pen') stiftGesehen();
      /* Nur der Zeiger, der den Zug begonnen hat, fuehrt ihn (E354). */
      if (aktiverZeiger !== null && event.pointerId !== aktiverZeiger) return;
      const point = R.zuBlatt(flaeche, event);
      if (!point) return;
      if (radierStrich) {
        /* Zwischen zwei Ereignissen kann der Zeiger weit springen; damit
           kein Strich in der Luecke ueberlebt, wird der Weg in Schritten
           von einem halben Radius abgefahren. */
        const vx = radierStrich.letzter[0] ?? 0, vy = radierStrich.letzter[1] ?? 0;
        const px = point[0] ?? 0, py = point[1] ?? 0;
        const abstand = Math.hypot(px - vx, py - vy);
        const n = Math.max(1, Math.ceil(abstand / Math.max(1, radierRadius() / 2)));
        for (let i = 1; i <= n; i++) {
          const zw = [vx + (px - vx) * i / n, vy + (py - vy) * i / n];
          if (radiereBei(zw)) radierStrich.geaendert = true;
        }
        radierStrich.letzter = point;
        radierStrich.kreis?.setAttribute('cx', String(point[0]));
        radierStrich.kreis?.setAttribute('cy', String(point[1]));
        return;
      }
      if (selectDrag) {
        selectDrag.end = point;
        if (selectDrag.mode === 'move') {
          const dx = point[0] - selectDrag.start[0];
          const dy = point[1] - selectDrag.start[1];
          selectDrag.moved = selectDrag.moved || Math.hypot(dx, dy) > 0.5;
          for (const id of selection) {
            const index = marks.findIndex(mark => idOf(mark) === id);
            const original = selectDrag.originals.get(id);
            if (index < 0 || !original) continue;
            marks[index] = InkGeometry.move(clone(original), dx, dy);
            updateNode(nodeFor(id), marks[index]);
            merke(marks[index]);
          }
          renderSelection();
        } else if (selectDrag.mode === 'scale') {
          const [ax, ay] = selectDrag.anker as [number, number];
          const dx0 = selectDrag.start[0] - ax, dy0 = selectDrag.start[1] - ay;
          let sx = Math.abs(dx0) < 1 ? 1 : (point[0] - ax) / dx0;
          let sy = Math.abs(dy0) < 1 ? 1 : (point[1] - ay) / dy0;
          /* Mit Umschalt bleibt das Seitenverhaeltnis — bei einem BILD in
             der Auswahl ist es umgekehrt (E357): ein Foto bleibt von sich
             aus im Verhaeltnis, wie in GoodNotes, und Umschalt gibt es frei.
             Ein verzerrtes Gesicht ist selten das, was man wollte. */
          const bildDabei = [...selection].some(id => marks.find(mark => idOf(mark) === id)?.art === 'bild');
          if (event.shiftKey !== bildDabei) { const s = (Math.abs(sx) + Math.abs(sy)) / 2; sx = s; sy = s; }
          sx = Math.max(0.05, Math.min(50, sx));
          sy = Math.max(0.05, Math.min(50, sy));
          selectDrag.moved = selectDrag.moved || Math.abs(sx - 1) > 0.01 || Math.abs(sy - 1) > 0.01;
          for (const id of selection) {
            const index = marks.findIndex(mark => idOf(mark) === id);
            const original = selectDrag.originals.get(id);
            if (index < 0 || !original) continue;
            marks[index] = InkGeometry.scale(clone(original), [ax, ay], sx, sy);
            updateNode(nodeFor(id), marks[index]);
            merke(marks[index]);
          }
          renderSelection();
        } else {
          const pts = selectDrag.pts as number[][];
          const last = pts[pts.length - 1]!;
          if (Math.hypot(point[0] - (last[0] ?? 0), point[1] - (last[1] ?? 0)) >= 1) pts.push(point);
          const node = flaeche.querySelector<SVGPathElement>('[data-ink-ui="box"]');
          if (node) node.setAttribute('d', pts.map((q, i) => (i ? 'L' : 'M') + q[0] + ' ' + q[1]).join(' ') + ' Z');
        }
        return;
      }
      if (!running) return;
      if (running.art === 'stift' || running.art === 'marker') {
        const coalesced = typeof event.getCoalescedEvents === 'function' ? event.getCoalescedEvents() : [];
        (coalesced.length ? coalesced : [event]).forEach(addSample);
        nassenSchwanz(event);
        bildAnfordern();
        return;
      }
      running.pts[1] = lineal && (running.art === 'line' || running.art === 'arrow')
        ? rasten(running.pts[0], point) : point;
      runningNode = updateNode(runningNode, running);
    });
    const beiEnde = (event: PointerEvent): void => {
      if (fingerPan?.id === event.pointerId) { fingerPan = null; return; }
      if (aktiverZeiger !== null && event.pointerId !== aktiverZeiger) return;
      // pointerup may carry a final position that no pointermove delivered.
      // Keep the previous pressure: pen devices report zero pressure on lift.
      if (event.type === 'pointerup' && running && (running.art === 'stift' || running.art === 'marker')) {
        const end = R.zuBlatt(flaeche, event);
        if (end) {
          const last = running.pts[running.pts.length - 1];
          if (Math.hypot(end[0] - last[0], end[1] - last[1]) > 0.01) {
            running.pts.push(end);
            running.pressure.push(running.pressure[running.pressure.length - 1] ?? 0.5);
          }
          rohLetzter = end;
        }
      }
      finish();
    };
    flaeche.addEventListener('pointerup', beiEnde);
    flaeche.addEventListener('pointercancel', beiEnde);
    flaeche.addEventListener('pointerleave', (event: PointerEvent) => {
      if (!flaeche.hasPointerCapture(event.pointerId)) beiEnde(event);
    });
    /* Der Seitenknopf eines Stifts ist fuer den Browser eine rechte Taste —
       ohne diese Zeile spraenge beim Radieren das Kontextmenue auf. */
    flaeche.addEventListener('contextmenu', event => { if (tool !== 'schreiben') event.preventDefault(); });
    /* Aufdecken per Tipp — NUR im Schreiben-Modus. Die Fläche selbst ist
       dort durchlässig (pointer-events:none), das Band bleibt greifbar,
       weil sein Knoten `pointer-events:all` trägt. In jedem Werkzeug-
       Modus gilt der Tipp dem Werkzeug (zeichnen, radieren, wählen). */
    flaeche.addEventListener('click', (event: MouseEvent) => {
      if (tool !== 'schreiben') return;
      const ziel = (event.target as Element)?.closest?.('[data-ink-art="abdeck"]') as SVGElement | null;
      if (!ziel) return;
      event.preventDefault();
      event.stopPropagation();
      const id = ziel.getAttribute('data-sid') || '';
      if (aufgedeckt.has(id)) aufgedeckt.delete(id);
      else aufgedeckt.add(id);
      abdeckAnwenden();
    });
    flaeche.addEventListener('keydown', (event: KeyboardEvent) => {
      const strg = event.ctrlKey || event.metaKey;
      const taste = event.key.toLowerCase();
      if ((event.key === 'Delete' || event.key === 'Backspace') && selection.size) {
        event.preventDefault(); deleteSelection();
      } else if (strg && taste === 'z') {
        event.preventDefault(); event.shiftKey ? redo() : undo();
      } else if (strg && taste === 'c' && selection.size) {
        event.preventDefault(); copySelection();
      } else if (strg && taste === 'v' && zwischenablage.length) {
        event.preventDefault(); paste();
      } else if (event.key === 'Escape' && selection.size) {
        /* Escape hebt die Auswahl auf — und laeuft weiter zu den Fenstern (E302). */
        selection.clear(); renderSelection();
      }
    });
    registerLayer({ flaeche, abschliessen: finish });

    flaeche.style.pointerEvents = 'none';
    flaeche.setAttribute('tabindex', '-1');
    const setzeWerkzeug = (next: string): void => {
      finish(); tool = next;
      if (tool !== 'select') { selection.clear(); renderSelection(); }
      flaeche.style.pointerEvents = tool === 'schreiben' ? 'none' : 'auto';
      flaeche.setAttribute('data-tool', tool);
      flaeche.setAttribute('tabindex', tool === 'schreiben' ? '-1' : '0');
    };
    /* FARBE UND STRICH MIT AUSWAHL GELTEN DER AUSWAHL (E353), wie in
       GoodNotes: wer drei Striche waehlt und Rot antippt, faerbt die drei
       um — und zeichnet danach rot weiter. Ein Schritt im Verlauf. */
    const setzeFarbe = (next: string): void => {
      color = next;
      if (!selection.size) return;
      const before = snapshot();
      /* ERSETZEN STATT AENDERN (E378) — sonst zeigte der Merkzettel schon
         die neue Farbe, und „Zurueck" holte nichts zurueck. */
      for (let i = 0; i < marks.length; i++) {
        const alt = marks[i];
        if (!selection.has(idOf(alt)) || alt.art === 'bild') continue;
        const neu = { ...alt, farbe: next };
        marks[i] = neu;
        updateNode(nodeFor(idOf(neu)), neu);
        merke(neu);
      }
      commit(before);
    };
    const setzeStrich = (next: number): void => {
      width = next;
      if (!selection.size) return;
      const before = snapshot();
      for (let i = 0; i < marks.length; i++) {
        const alt = marks[i];
        if (!selection.has(idOf(alt)) || alt.breite === undefined) continue;
        const neu = { ...alt, breite: next };
        marks[i] = neu;
        updateNode(nodeFor(idOf(neu)), neu);
        merke(neu);
      }
      renderSelection();
      commit(before);
    };
    const setzeStil = (next: string): void => {
      if (!STIFTE.some(st => st.id === next)) return;
      stil = next;
      if (typeof Store !== 'undefined') Store.setMeta('zeichnen:stift', next);
    };
    const stilVon = (): string => stil;
    /* SCHRIFT MIT AUSWAHL GILT DER AUSWAHL (E360), wie Farbe und Strich
       (E353): wer einen Text waehlt und A+ tippt, macht DIESEN groesser —
       jede gewaehlte Marke eine Stufe von ihrer eigenen Groesse aus — und
       schreibt danach groesser weiter. Ein Schritt im Verlauf. */
    const setzeSchrift = (aenderung: Partial<Schrift> & { schritt?: number }): void => {
      const schritt = Number(aenderung.schritt) || 0;
      schrift = {
        familie: aenderung.familie !== undefined && SCHRIFTEN.some(x => x.id === aenderung.familie)
          ? String(aenderung.familie) : schrift.familie,
        groesse: schritt ? naechsteStufe(schrift.groesse, schritt)
          : (aenderung.groesse !== undefined ? Math.max(8, Number(aenderung.groesse) || schrift.groesse) : schrift.groesse),
        fett: aenderung.fett !== undefined ? !!aenderung.fett : schrift.fett,
        rahmen: aenderung.rahmen !== undefined ? !!aenderung.rahmen : schrift.rahmen };
      if (typeof Store !== 'undefined') Store.setMeta('zeichnen:schrift', schrift);
      if (!selection.size) return;
      const before = snapshot();
      let geaendert = false;
      for (let i = 0; i < marks.length; i++) {
        const alt = marks[i];
        if (!selection.has(idOf(alt)) || alt.art !== 'text') continue;
        const neu: any = { ...alt };
        if (schritt) neu.fontSize = naechsteStufe(Math.max(8, Number(alt.fontSize) || 18), schritt);
        else if (aenderung.groesse !== undefined) neu.fontSize = schrift.groesse;
        if (aenderung.familie !== undefined) neu.schrift = schrift.familie;
        if (aenderung.fett !== undefined) neu.fett = schrift.fett;
        if (aenderung.rahmen !== undefined) neu.rahmen = schrift.rahmen;
        marks[i] = neu;
        updateNode(nodeFor(idOf(neu)), neu);
        geaendert = true;
      }
      if (geaendert) { renderSelection(); commit(before); }
    };
    const schriftVon = (): Schrift => ({ ...schrift });
    const setzeRadierModus = (next: string): void => {
      if (!RADIERER.some(r => r.id === next)) return;
      radierModus = next;
      if (typeof Store !== 'undefined') Store.setMeta('zeichnen:radierer', next);
    };
    const radierModusVon = (): string => radierModus;
    const beiAenderung = (listener: (next: any) => void): (() => void) => {
      stateListeners.add(listener); listener(state()); return () => stateListeners.delete(listener);
    };

    /* DAS RÜCKGABEOBJEKT BEKOMMT EINEN NAMEN.
       Es stand als Literal im `return` am Ende — und der Lauscher weiter
       oben braucht genau dieses Objekt, um sich beim Kern zu melden. Zwei
       verschiedene Objekte für dieselbe Fläche wären der sichere Weg zu
       einem Knopf, der auf nichts wirkt. */
    const setzeLineal = (an: boolean): void => { lineal = !!an; };
    const linealAn = (): boolean => lineal;
    const setzeFormen = (an: boolean): void => {
      formen = !!an;
      if (typeof Store !== 'undefined') Store.setMeta('zeichnen:formen', formen);
    };
    const formenAn = (): boolean => formen;

    const steuerung = { flaeche, setzeWerkzeug, setzeFarbe, setzeStrich, setzeStil, stilVon, setzeRadierModus, radierModusVon, copySelection, paste, marken: marks,
      undo, redo, deleteSelection, beiAenderung, state, setzeLineal, linealAn, setzeFormen, formenAn, bildEinfuegen,
      setzeSchrift, schriftVon };
    return steuerung;
  };

  /** Die zuletzt gewaehlten eigenen Farben — hoechstens vier, gemerkt als Meta. */
  const eigeneFarben = (): string[] => {
    if (typeof Store === 'undefined') return [];
    const roh = Store.getMeta('zeichnen:farben');
    return Array.isArray(roh)
      ? roh.map(String).filter(v => /^#[0-9a-f]{6}$/i.test(v)).slice(0, HOECHSTENS_EIGENE_FARBEN) : [];
  };
  const eigeneFarbeMerken = (wert: string): string[] => {
    const liste = [wert, ...eigeneFarben().filter(v => v.toLowerCase() !== wert.toLowerCase())]
      .filter(v => !(FARBEN as readonly string[]).includes(v.toLowerCase()))
      .slice(0, HOECHSTENS_EIGENE_FARBEN);
    if (typeof Store !== 'undefined') Store.setMeta('zeichnen:farben', liste);
    return liste;
  };

  const leiste = (controls: any, extra = ''): HTMLElement => {
    /* WELCHE FORM DER FORMEN-KNOPF FÜHRT (E375). Das ist Zustand der
       LEISTE, nicht der Fläche: die Fläche kennt nur `line` oder
       `rectangle` und weiss nichts davon, dass beide unter einem Knopf
       stehen. Gemerkt wird er in `meta`, damit er den Neustart überlebt —
       wer immer Pfeile zeichnet, will nicht jedes Mal die Linie wegklicken. */
    let formArt: string = formArtLesen();
    /* DIE FLÄCHE MELDET SICH IM KERN AN (E212).

       Bis hierher wusste nur diese Leiste, welche Fläche sie steuert. Der
       Reiter „Zeichnen" im Menüband konnte deshalb nichts — er hätte nicht
       gewusst, worauf er wirkt (L64).

       `Zeichenziel` im Kern hält jetzt den Zeiger. Diese Datei gibt ihn
       ab und behält alles andere: kein Strich, keine Farbe, keine Marke
       wandert dorthin. Wo die Zeichenlogik an zwei Stellen stünde, liefe
       die zweite irgendwann von der ersten weg. */
    if (typeof Zeichenziel !== 'undefined') {
      try {
        Zeichenziel.melde(controls, 'Zeichenfläche');
        /* WELCHE FARBE UND WELCHE STÄRKE STEHEN GERADE AN.
           Die Leiste malt sie sich gleich selbst mit `.on` an (siehe
           `index === 0` bzw. `index === 1` unten). Sagt sie es dem Kern
           nicht, zeigt das Menüband fünf Farbknöpfe und markiert keinen —
           obwohl hier einer markiert ist. Zwei Anzeigen, ein Zustand. */
        Zeichenziel.uebernehmeFarbe(controls, FARBEN[0]);
        Zeichenziel.uebernehmeStrich(controls, BREITEN[1]);
      } catch { /* ohne Kern geht es wie bisher */ }
    }

    const row = document.createElement('div');
    row.className = 'blatt-reihe';
    const tools = document.createElement('div');
    tools.className = 'blatt-werk';
    tools.dataset.tool = 'schreiben';
    /* AM TELEFON ROLLT DIE LEISTE ZUM WERKZEUG (E356): die Gruppen stehen
       gleich dahinter, also ist mit einem Tipp alles im Bild, was zu ihm
       gehoert. Am Rechner rollt nichts — dort passt alles. */
    const zumWerkzeugRollen = (wz: string): void => {
      if (!window.matchMedia || !window.matchMedia('(max-width:760px)').matches) return;
      const knopf = tools.querySelector<HTMLElement>(`[data-wz="${wz}"]`);
      if (knopf) tools.scrollLeft = Math.max(0, knopf.offsetLeft - 6);
    };
    /* JEDER KNOPF SAGT SEINEN NAMEN UND SEINEN ZUSTAND (Audit F04).
       Zwei Fehler steckten hier, und beide sah man nicht:

       1. Das Zeichen stand als sichtbarer Text IM Knopf. Am Telefon und in
          der Spalte blendet das CSS `.wort` aus — dann blieb als
          zugänglicher Name genau das Zeichen übrig, und der Knopf hiess
          „✎" oder „⌖". `title` half nicht: es zählt nur, wenn sonst gar
          kein Name da ist. Jetzt trägt das Zeichen `aria-hidden` und das
          Wort bleibt lesbar, auch wenn es unsichtbar ist (`.wort` ist
          nicht mehr `display:none`, sondern weggeklemmt).

       2. Welches Werkzeug GILT, stand nur in einer CSS-Klasse. Eine Klasse
          ist für ein Vorleseprogramm nicht da. `aria-pressed` sagt es. */
    const button = (tool: string, icon: string, word: string, title: string) =>
      `<button data-wz="${tool}"${tool === 'schreiben' ? ' class="on"' : ''} ` +
      `aria-pressed="${tool === 'schreiben' ? 'true' : 'false'}" title="${title}">` +
      `<span class="zeichen" aria-hidden="true">${icon}</span><span class="wort">${word}</span></button>`;
    tools.innerHTML =
      button('schreiben', '✎', 'Schreiben', 'Schreiben — die Zeichenschicht ist durchlässig') +
      button('select', '⌖', 'Auswahl', 'Marken auswählen, gemeinsam bewegen oder löschen') +
      button('stift', '🖍', 'Stift', 'Freihand mit geglätteter Linie') +
      button('marker', '▰', 'Marker', 'Transparenter Marker') +
      /* VIER WERKZEUGE WURDEN EINES (E375, L115 Punkt 9, Rest).
         Linie, Pfeil, Rechteck und Ellipse standen als vier Knöpfe
         nebeneinander — vierzehn Werkzeuge in einer Leiste, die am Telefon
         rollen muss. GoodNotes hat dafür EINEN Knopf; welche Form es wird,
         steht im Zubehör darunter, wo auch Farbe und Strichstärke stehen.
         Der Knopf trägt das Zeichen der zuletzt gewählten Form, damit man
         ihn wiedererkennt, ohne ihn zu öffnen. */
      (() => {
        const jetzt = FORMEN.find(f => f.id === formArt) || FORMEN[0]!;
        return `<button data-wz="formen" data-form="${jetzt.id}" ` +
          `title="${jetzt.titel} — die Form wählst du darunter">` +
          `<span class="zeichen" aria-hidden="true">${jetzt.zeichen}</span><span class="wort">Form</span></button>`;
      })() +
      button('abdeck', '▬', 'Abdecken',
        'Abdeckband über Lösungen ziehen — Antippen im Schreiben-Modus deckt auf') +
      button('zettel', '🗒', 'Haftnotiz',
        'Einen Zettel aufziehen und beschriften; Antippen mit dem Werkzeug bearbeitet ihn') +
      button('text', 'T', 'Text', 'Textanmerkung') +
      button('zeichen', '⚡', 'Fachzeichen', 'Ein elektrotechnisches Symbol auf die Seite setzen') +
      /* DAS BILD (E357): kein Werkzeug, das man haelt, sondern ein Weg —
         ein Tipp oeffnet den Waehler, danach fuehrt die Auswahl. */
      button('bild', '🖼', 'Bild',
        'Ein Foto oder Bild auf das Blatt legen — danach verschieben und ziehen wie jede Marke') +
      button('radierer', '⌫', 'Radieren',
        'Radieren — über Marken streichen; der Knopf daneben wählt Ganz, Teil oder Marker') +
      /* DER ZEILENBRUCH (E359): am Rechner stehen die Werkzeuge in einer
         Zeile und ihr Zubehoer darunter; dieses leere Element mit voller
         Breite ist der Umbruch. Am Telefon und in der Spalte blendet das
         CSS es aus — dort rollt die Leiste in einer Zeile. */
      '<span class="blatt-zeilenbruch" aria-hidden="true"></span>' +
      /* DER RADIERER (E352): ein Knopf, der durch Ganz, Teil und Marker
         wechselt und sagt, was der Radierer gerade tut. */
      (() => {
        const jetzt = RADIERER.find(r => r.id === (controls.radierModusVon ? controls.radierModusVon() : RADIER_VORGABE)) || RADIERER[0];
        return `<button data-act="radiermodus" data-gruppe="radierer" data-modus="${jetzt.id}" title="${jetzt.titel} — antippen wechselt: ${RADIERER.map(r => r.name).join(' → ')}">` +
          `<span class="zeichen" aria-hidden="true">${jetzt.zeichen}</span><span class="wort">${jetzt.name}</span></button>`;
      })() +
      /* JEDER KNOPF KENNT SEINE GRUPPE (E356): am Telefon zeigt die Leiste
         nur die Gruppen des gewaehlten Werkzeugs — Farben und Breiten beim
         Stift, den Modus beim Radierer, Kopieren und Loeschen bei der
         Auswahl. Das CSS liest `data-gruppe` gegen `data-tool` der Leiste. */
      '<span class="blatt-trenn" data-gruppe="verlauf"></span>' +
      '<button data-act="undo" data-gruppe="verlauf" title="Rückgängig" disabled><span class="zeichen" aria-hidden="true">↶</span><span class="wort">Zurück</span></button>' +
      '<button data-act="redo" data-gruppe="verlauf" title="Wiederholen" disabled><span class="zeichen" aria-hidden="true">↷</span><span class="wort">Vor</span></button>' +
      '<button data-act="delete" data-gruppe="auswahl" title="Auswahl löschen" disabled><span class="zeichen" aria-hidden="true">🗑</span><span class="wort">Löschen</span></button>' +
      /* KOPIEREN UND EINSETZEN (E353) — auch ohne Tastatur, am Telefon. */
      '<button data-act="copy" data-gruppe="auswahl" title="Auswahl kopieren (Strg+C)" disabled><span class="zeichen" aria-hidden="true">⧉</span><span class="wort">Kopieren</span></button>' +
      '<button data-act="paste" data-gruppe="auswahl" title="Kopiertes einsetzen (Strg+V)" disabled><span class="zeichen" aria-hidden="true">📋</span><span class="wort">Einsetzen</span></button>' +
      /* Das Lineal ist ein SCHALTER neben den Werkzeugen: solange es
         anliegt, rasten Linie und Pfeil auf 15°-Schritte (E267). */
      '<button data-act="lineal" data-gruppe="lineal" aria-pressed="false" ' +
      'title="Lineal: Linie und Pfeil rasten auf 15°-Schritte">' +
      '<span class="zeichen" aria-hidden="true">📐</span><span class="wort">Lineal</span></button>' +
      /* FORMEN (E355): ein Schalter wie das Lineal — an, und ein gehaltener
         Strich wird zur Linie, zum Kreis, zum Rechteck. */
      `<button data-act="formen" data-gruppe="formen" aria-pressed="${controls.formenAn ? (controls.formenAn() ? 'true' : 'false') : 'true'}"` +
      `${controls.formenAn && controls.formenAn() ? ' class="on"' : ''} ` +
      'title="Formen erkennen: einen Kreis, ein Rechteck oder eine Linie ziehen und am Ende kurz halten">' +
      '<span class="zeichen" aria-hidden="true">◯</span><span class="wort">Formen</span></button>' +
      /* DIE SCHRIFT (E360): Familie, Groesse, Fett, Rahmen — beim Text und
         bei der Auswahl; wirkt auf Gewaehltes und auf den naechsten Text. */
      (() => {
        const s = (controls.schriftVon ? controls.schriftVon() : SCHRIFT_VORGABE) as Schrift;
        const fam = SCHRIFTEN.find(x => x.id === s.familie) || SCHRIFTEN[0];
        return `<button data-act="schriftart" data-gruppe="schrift" data-schrift="${fam.id}" ` +
          `title="Schriftart: ${fam.name} — antippen wechselt: ${SCHRIFTEN.map(x => x.name).join(' → ')}">` +
          `<span class="zeichen" aria-hidden="true" style="font-family:${fam.stapel}">Aa</span><span class="wort">${fam.name}</span></button>` +
          '<button data-act="kleiner" data-gruppe="schrift" title="Schrift kleiner">' +
          '<span class="zeichen" aria-hidden="true">A−</span><span class="wort">Kleiner</span></button>' +
          `<button data-act="groesser" data-gruppe="schrift" title="Schrift grösser (jetzt ${s.groesse} px)">` +
          '<span class="zeichen" aria-hidden="true">A+</span><span class="wort">Grösser</span></button>' +
          `<button data-act="fett" data-gruppe="schrift" aria-pressed="${s.fett ? 'true' : 'false'}"${s.fett ? ' class="on"' : ''} title="Fett">` +
          '<span class="zeichen" aria-hidden="true">F</span><span class="wort">Fett</span></button>' +
          `<button data-act="rahmen" data-gruppe="schrift" aria-pressed="${s.rahmen ? 'true' : 'false'}"${s.rahmen ? ' class="on"' : ''} title="Rahmen um den Text">` +
          '<span class="zeichen" aria-hidden="true">▭</span><span class="wort">Rahmen</span></button>';
      })() +
      /* DER STIFT (E351): ein Knopf, der durch Fueller, Kugelschreiber und
         Pinsel wechselt und sagt, welcher gerade fuehrt. */
      (() => {
        const jetzt = STIFTE.find(st => st.id === (controls.stilVon ? controls.stilVon() : STIL_VORGABE)) || STIFTE[0];
        return `<button data-act="stil" data-gruppe="stil" data-stil="${jetzt.id}" title="Stift wechseln: ${STIFTE.map(st => st.name).join(' → ')}">` +
          `<span class="zeichen" aria-hidden="true">${jetzt.zeichen}</span><span class="wort">${jetzt.name}</span></button>`;
      })() +
      /* DAS ZUBEHÖR ZUM FORMEN-WERKZEUG (E375). Es steht in derselben
         Zeile wie Farbe und Breite und erscheint nach der Gruppenregel aus
         E356 nur, wenn eine Form gewählt ist. */
      '<span class="blatt-trenn" data-gruppe="form"></span>' +
      FORMEN.map(f => `<button data-act="formart" data-gruppe="form" data-form="${f.id}"` +
        (f.id === formArt ? ' class="on"' : '') + ` aria-pressed="${f.id === formArt ? 'true' : 'false'}"` +
        ` title="${f.titel}"><span class="zeichen" aria-hidden="true">${f.zeichen}</span>` +
        `<span class="wort">${f.name}</span></button>`).join('') +
      '<span class="blatt-trenn" data-gruppe="farbe"></span>' +
      FARBEN.map((value, index) => `<button class="blatt-farbe${index === 0 ? ' on' : ''}" data-gruppe="farbe" ` +
        `data-c="${value}" style="background:${value}" title="Farbe"></button>`).join('') +
      /* EIGENE FARBEN (E351): die zuletzt gewaehlten stehen als Tupfer da,
         dahinter der Weg zum Farbwaehler des Browsers. */
      eigeneFarben().map(value => `<button class="blatt-farbe blatt-farbe-eigen" data-gruppe="farbe" ` +
        `data-c="${value}" style="background:${value}" title="Eigene Farbe ${value}"></button>`).join('') +
      '<button class="blatt-farbe-neu" data-act="farbe" data-gruppe="farbe" title="Andere Farbe wählen" aria-label="Andere Farbe wählen">+</button>' +
      '<span class="blatt-trenn" data-gruppe="breite"></span>' +
      /* Doppelter Massstab wie im Menüband: mit der wahren Stärke sahen
         „dünn" (1,2 px) und „mittel" (2,4 px) gleich aus, weil der Boden
         von 2 px den ersten hochzog. Das Verhältnis 1 : 2 : 4 bleibt. */
      BREITEN.map((value, index) => `<button class="blatt-strich${index === 1 ? ' on' : ''}" data-gruppe="breite" ` +
        `data-b="${value}" title="Strichbreite ${String(value).replace('.', ',')} — die gewählte nochmal antippen: Stärke frei wählen">` +
        `<i style="height:${Math.max(2, value * 2)}px"></i></button>`).join('') +
      /* DIE FREIE STAERKE (E465), wie GoodNotes' Schieber: drei Stufen zum
         Antippen bleiben, der Regler dazwischen nimmt jeden Wert von 0,5
         bis 12. Sein Wert IST die Staerke — kein Zwischenzustand.
         ALS KLAPPE, NICHT IN DER ZEILE (E465 Nachtrag): GoodNotes zeigt den
         Regler erst, wenn man die gewaehlte Stufe ein zweites Mal antippt.
         So auch hier — in der Zeile brach er bei 596 px in eine dritte
         Reihe (test351, 132 px Leiste). Die Klasse `auf` oeffnet ihn. */
      '<label class="blatt-staerke" data-gruppe="breite" title="Strichstärke frei wählen">' +
      '<input type="range" min="0.5" max="12" step="0.1" value="' + BREITEN[1] + '" aria-label="Strichstärke">' +
      '<output aria-hidden="true">' + String(BREITEN[1]).replace('.', ',') + '</output></label>';

    /* SICHTBAR MACHEN, DASS DIE LEISTE ROLLT (E140, §55.1).
       Bei 390 px ist die Leiste 310 px breit und ihr Inhalt 1059 — von 21
       Knöpfen stehen 15 draussen, alle rechts. Gerollt werden kann sie
       längst; nur zeigt das nichts an, und eine abgeschnittene Leiste sieht
       aus wie eine vollständige. Genau dieser Befund steht in §55.1 über die
       Tabellenleiste, und er gilt hier noch einmal.

       `.blatt-fest` hat seinen Schatten für die Seite LINKS. Nach rechts gab
       es nichts — dabei ist beim Öffnen alles Verdeckte rechts.

       Kein Dauerverlauf: der würde am Ende der Leiste eine Andeutung zeigen,
       wo nichts mehr kommt. Die zwei Kennzeichen stehen nur, solange es
       wirklich etwas zu holen gibt.
       Die Rechnung selbst steht in `kern/helfer/rollrand.ts` (E159). Hier
       ist nur zu merken, dass GEROLLT wird `tools`, gezeichnet aber an
       `row` — deshalb `an: row`. */
    Rollrand.binde(tools, { art: 'mehr', an: row });

    const updateState = (next: any): void => {
      const undo = tools.querySelector<HTMLButtonElement>('[data-act="undo"]');
      const redo = tools.querySelector<HTMLButtonElement>('[data-act="redo"]');
      const remove = tools.querySelector<HTMLButtonElement>('[data-act="delete"]');
      if (undo) undo.disabled = !next.undo;
      if (redo) redo.disabled = !next.redo;
      if (remove) remove.disabled = !next.selected;
      const copy = tools.querySelector<HTMLButtonElement>('[data-act="copy"]');
      const paste = tools.querySelector<HTMLButtonElement>('[data-act="paste"]');
      if (copy) copy.disabled = !next.selected;
      if (paste) paste.disabled = !next.clipboard;
    };
    controls.beiAenderung?.(updateState);

    /* ZWEI ANSICHTEN DESSELBEN ZUSTANDS (E212, §55.1).

       Diese Leiste markiert ihr Werkzeug selbst, wenn man sie drückt. Wird
       das Werkzeug oben im Menüband gewählt, passiert hier nichts — auf dem
       Bildschirmfoto stand die Fläche längst auf `data-tool="stift"`, das
       Band zeigte „Stift" markiert, und diese Leiste zeigte „Schreiben".
       Gemessen: `[data-wz].on` = schreiben, `.mb-knopf.ist-an` = Stift.

       Wer zwei Anzeigen für einen Zustand baut, muss beide an denselben
       Zustand hängen. Sonst läuft die eine der anderen hinterher, und der
       Nutzer glaubt der falschen.

       `werkzeugVon(controls)` und nicht `jetzt()`: gemeint ist DIESE
       Fläche. Bei zwei Blättern auf einer Seite zeigte `jetzt()` beiden
       Leisten das Werkzeug des zuletzt berührten. */
    const markiere = (): void => {
      if (!tools.isConnected) { Zeichenziel.vergiss(markiere); return; }
      const wz = Zeichenziel.werkzeugVon(controls);
      if (wz) {
        /* EINE FORM LÄSST DEN FORMEN-KNOPF LEUCHTEN (E375) — sonst wäre
           beim Zeichnen eines Rechtecks kein Knopf hervorgehoben, und die
           Leiste sähe aus, als sei nichts gewählt. */
        const fuehrend = istForm(wz) ? 'formen' : wz;
        tools.querySelectorAll<HTMLElement>('[data-wz]').forEach(node => {
          node.classList.toggle('on', node.dataset.wz === fuehrend);
          /* Der Zustand gehoert in den Baum, nicht nur in die Klasse (F04). */
          node.setAttribute('aria-pressed', node.dataset.wz === fuehrend ? 'true' : 'false');
        });
        /* Die Leiste weiss, welches Werkzeug fuehrt — das CSS am Telefon
           liest es (E356). */
        if (tools.dataset.tool !== wz) { tools.dataset.tool = wz; zumWerkzeugRollen(wz); }
      }
      const farbe = Zeichenziel.farbeVon(controls);
      if (farbe) tools.querySelectorAll<HTMLElement>('.blatt-farbe').forEach(node => {
        node.classList.toggle('on', node.dataset.c === farbe);
      });
      const dicke = Zeichenziel.dickeVon(controls);
      if (dicke) tools.querySelectorAll<HTMLElement>('.blatt-strich').forEach(node => {
        node.classList.toggle('on', Number(node.dataset.b) === dicke);
      });
      if (dicke) staerkeZeigen(dicke);
    };
    /** Ist die Klappe mit dem Regler offen? */
    const staerkeOffen = (): boolean => !!tools.querySelector('.blatt-staerke.auf');
    /** Klappe auf oder zu. Offen steht sie unter der gewaehlten Stufe (`--staerke-x`);
        am Telefon, in der Spalte und im Schreibstudio steht sie in der rollenden Zeile. */
    const staerkeAuf = (auf: boolean): void => {
      const label = tools.querySelector<HTMLElement>('.blatt-staerke');
      if (!label) return;
      if (auf) {
        const stufe = tools.querySelector<HTMLElement>('.blatt-strich.on') || tools.querySelector<HTMLElement>('.blatt-strich');
        if (stufe) label.style.setProperty('--staerke-x', `${stufe.offsetLeft}px`);
        label.classList.add('auf');
        const feld = label.querySelector<HTMLInputElement>('input');
        try { feld?.focus({ preventScroll: true }); } catch { /* egal */ }
        /* In der rollenden Zeile (Telefon, Spalte, Studio) steht die Klappe
           rechts der Stufen — und die koennen am Rand stehen. Nachrollen,
           sonst geht etwas auf, das niemand sieht. */
        try { label.scrollIntoView({ block: 'nearest', inline: 'nearest' }); } catch { /* egal */ }
      } else {
        label.classList.remove('auf');
      }
    };
    /** Der Regler zeigt die Staerke, die gilt — auch nach einem Tipp auf eine Stufe. */
    const staerkeZeigen = (wert: number): void => {
      const feld = tools.querySelector<HTMLInputElement>('.blatt-staerke input');
      const zahl = tools.querySelector<HTMLElement>('.blatt-staerke output');
      if (feld && Number(feld.value) !== wert) feld.value = String(wert);
      if (zahl) zahl.textContent = String(Math.round(wert * 10) / 10).replace('.', ',');
    };
    /* Der Regler meldet jeden Wert sofort — ohne Klick, ohne Loslassen. */
    tools.addEventListener('input', event => {
      const feld = event.target as HTMLInputElement | null;
      if (!feld || !feld.matches('.blatt-staerke input')) return;
      const wert = Math.max(0.5, Math.min(12, Number(feld.value) || BREITEN[1]));
      controls.setzeStrich(wert);
      if (typeof Zeichenziel !== 'undefined') {
        try { Zeichenziel.uebernehmeStrich(controls, wert); } catch { /* egal */ }
      }
      tools.querySelectorAll<HTMLElement>('.blatt-strich').forEach(node =>
        node.classList.toggle('on', Number(node.dataset.b) === wert));
      staerkeZeigen(wert);
    });
    /* Die Klappe geht zu, wenn der Blick woandershin geht: Escape, ein
       Tipp ins Blatt (der Regler verliert den Fokus) oder ein anderes
       Werkzeug. Escape wird hier verbraucht, damit nicht zugleich das
       naechste Fenster zugeht (E302: ein Griff, eine Ebene). */
    tools.addEventListener('keydown', event => {
      if (event.key !== 'Escape' || !staerkeOffen()) return;
      staerkeAuf(false); event.stopPropagation();
    });
    tools.addEventListener('focusout', event => {
      const label = tools.querySelector<HTMLElement>('.blatt-staerke.auf');
      if (!label) return;
      const zu = event.relatedTarget as HTMLElement | null;
      if (zu && (label.contains(zu) || zu.matches?.('.blatt-strich'))) return;
      staerkeAuf(false);
    });
    if (typeof Zeichenziel !== 'undefined' && typeof Zeichenziel.horche === 'function') {
      try { Zeichenziel.horche(markiere); } catch { /* dann eben nur die Leiste */ }
    }

    /* Ein Klick auf die Leiste heisst: DIESE Fläche ist gemeint. Bei einer
       einzigen ist das gleichgültig, bei drei Blättern auf einer Seite ist
       es die ganze Frage. */
    tools.addEventListener('pointerdown', () => {
      if (typeof Zeichenziel !== 'undefined') {
        try { Zeichenziel.beruehrt(controls); } catch { /* egal */ }
      }
    }, true);

    tools.addEventListener('click', event => {
      const target = (event.target as HTMLElement)?.closest?.('button') as HTMLButtonElement | null;
      if (!target || target.disabled) return;
      /* DER BILD-KNOPF SCHALTET NICHT UM (E357): er oeffnet den
         Dateiwaehler; das gewaehlte Werkzeug bleibt, bis das Bild da ist —
         wer abbricht, hat nichts verloren. Danach fuehrt die Auswahl. */
      if (target.dataset.wz && !target.matches('.blatt-strich')) staerkeAuf(false);
      if (target.dataset.wz === 'bild') {
        if (controls.bildEinfuegen) void controls.bildEinfuegen();
        return;
      }
      /* DER FORMEN-KNOPF FÜHRT DIE ZULETZT GEWÄHLTE FORM (E375). Nach
         aussen heisst das Werkzeug weiter `line`/`arrow`/`rectangle`/
         `ellipse` — daran hängen der Zeichner, das Menüband und jede
         gespeicherte Marke. Nur die LEISTE fasst sie zu einem Knopf. */
      if (target.dataset.wz === 'formen') {
        const wahl = formArt;
        controls.setzeWerkzeug(wahl);
        if (typeof Zeichenziel !== 'undefined') {
          try { Zeichenziel.uebernehme(controls, wahl); } catch { /* egal */ }
        }
        tools.querySelectorAll('[data-wz]').forEach(node => {
          node.classList.remove('on'); node.setAttribute('aria-pressed', 'false'); });
        target.classList.add('on'); target.setAttribute('aria-pressed', 'true');
        tools.dataset.tool = wahl;
        zumWerkzeugRollen('formen');
        return;
      }
      if (target.dataset.wz) {
        controls.setzeWerkzeug(target.dataset.wz);
        /* Auch der Kern muss es wissen — sonst zeigt das Menüband weiter
           das alte Werkzeug an. Derselbe Fehler wie oben, nur andersherum. */
        if (typeof Zeichenziel !== 'undefined') {
          try { Zeichenziel.uebernehme(controls, target.dataset.wz); }
          catch { /* egal */ }
        }
        tools.querySelectorAll('[data-wz]').forEach(node => {
          node.classList.remove('on'); node.setAttribute('aria-pressed', 'false'); });
        target.classList.add('on'); target.setAttribute('aria-pressed', 'true');
        tools.dataset.tool = target.dataset.wz;
        zumWerkzeugRollen(target.dataset.wz);
        return;
      }
      if (target.dataset.act) {
        if (target.dataset.act === 'undo') controls.undo();
        if (target.dataset.act === 'redo') controls.redo();
        if (target.dataset.act === 'delete') controls.deleteSelection();
        if (target.dataset.act === 'copy' && controls.copySelection) controls.copySelection();
        if (target.dataset.act === 'paste' && controls.paste) controls.paste();
        if (target.dataset.act === 'stil' && controls.setzeStil) {
          const jetzt = STIFTE.findIndex(st => st.id === target.dataset.stil);
          const naechster = STIFTE[(jetzt + 1) % STIFTE.length]!;
          controls.setzeStil(naechster.id);
          target.dataset.stil = naechster.id;
          target.innerHTML = `<span class="zeichen" aria-hidden="true">${naechster.zeichen}</span><span class="wort">${naechster.name}</span>`;
          /* Ein Stift zeichnet — wer ihn wechselt, will ihn auch fuehren. */
          if (Zeichenziel.werkzeugVon?.(controls) !== 'stift') {
            controls.setzeWerkzeug('stift');
            try { Zeichenziel.uebernehme(controls, 'stift'); } catch { /* egal */ }
            tools.querySelectorAll('[data-wz]').forEach(node => {
              const an = (node as HTMLElement).dataset.wz === 'stift';
              node.classList.toggle('on', an);
              node.setAttribute('aria-pressed', an ? 'true' : 'false'); });
            tools.dataset.tool = 'stift';
          }
          return;
        }
        /* DIE FORM WÄHLEN (E375) — und sie sofort führen. Wer im Zubehör
           auf „Rechteck" tippt, will ein Rechteck zeichnen, nicht erst
           noch den Knopf darüber suchen. */
        if (target.dataset.act === 'formart' && target.dataset.form) {
          const wahl = String(target.dataset.form);
          if (!istForm(wahl)) return;
          formArt = wahl;
          if (typeof Store !== 'undefined') { try { Store.setMeta('zeichnen:form', wahl); } catch { /* dann eben nur diese Sitzung */ } }
          tools.querySelectorAll<HTMLElement>('[data-act="formart"]').forEach(node => {
            const an = node.dataset.form === wahl;
            node.classList.toggle('on', an);
            node.setAttribute('aria-pressed', an ? 'true' : 'false');
          });
          /* Der Knopf in der oberen Zeile trägt das Zeichen der Form. */
          const kopf = tools.querySelector<HTMLElement>('[data-wz="formen"]');
          const f = FORMEN.find(x => x.id === wahl);
          if (kopf && f) {
            kopf.dataset.form = wahl;
            kopf.title = f.titel + ' — die Form wählst du darunter';
            kopf.innerHTML = `<span class="zeichen" aria-hidden="true">${f.zeichen}</span><span class="wort">Form</span>`;
            tools.querySelectorAll('[data-wz]').forEach(node => node.classList.remove('on'));
            kopf.classList.add('on');
          }
          controls.setzeWerkzeug(wahl);
          if (typeof Zeichenziel !== 'undefined') {
            try { Zeichenziel.uebernehme(controls, wahl); } catch { /* egal */ }
          }
          tools.dataset.tool = wahl;
          return;
        }
        if (target.dataset.act === 'radiermodus' && controls.setzeRadierModus) {
          const jetzt = RADIERER.findIndex(r => r.id === target.dataset.modus);
          const naechster = RADIERER[(jetzt + 1) % RADIERER.length]!;
          controls.setzeRadierModus(naechster.id);
          target.dataset.modus = naechster.id;
          target.title = `${naechster.titel} — antippen wechselt: ${RADIERER.map(r => r.name).join(' → ')}`;
          target.innerHTML = `<span class="zeichen" aria-hidden="true">${naechster.zeichen}</span><span class="wort">${naechster.name}</span>`;
          /* Wer den Radierer einstellt, will radieren. */
          if (Zeichenziel.werkzeugVon?.(controls) !== 'radierer') {
            controls.setzeWerkzeug('radierer');
            try { Zeichenziel.uebernehme(controls, 'radierer'); } catch { /* egal */ }
            tools.querySelectorAll('[data-wz]').forEach(node => node.classList.toggle('on', (node as HTMLElement).dataset.wz === 'radierer'));
            tools.dataset.tool = 'radierer';
          }
          return;
        }
        if (target.dataset.act === 'farbe') {
          /* Der Farbwaehler des Browsers — kein eigener Regler. Der Wert
             kommt als #rrggbb, genau das Format der Katalogfarben. */
          const feld = document.createElement('input');
          feld.type = 'color';
          feld.value = (Zeichenziel.farbeVon?.(controls) as string) || FARBEN[0];
          feld.style.position = 'fixed'; feld.style.opacity = '0'; feld.style.pointerEvents = 'none';
          document.body.appendChild(feld);
          const uebernehmen = (): void => {
            const wert = String(feld.value || '').toLowerCase();
            feld.remove();
            if (!/^#[0-9a-f]{6}$/.test(wert)) return;
            const liste = eigeneFarbeMerken(wert);
            controls.setzeFarbe(wert);
            try { Zeichenziel.uebernehmeFarbe(controls, wert); } catch { /* egal */ }
            tools.querySelectorAll('.blatt-farbe-eigen').forEach(node => node.remove());
            const neuKnopf = tools.querySelector('.blatt-farbe-neu');
            liste.slice().reverse().forEach(farbe => {
              const k = document.createElement('button');
              k.className = 'blatt-farbe blatt-farbe-eigen';
              k.dataset.gruppe = 'farbe';
              k.dataset.c = farbe; k.style.background = farbe; k.title = 'Eigene Farbe ' + farbe;
              neuKnopf?.before(k);
            });
            tools.querySelectorAll('.blatt-farbe').forEach(node => node.classList.toggle('on', (node as HTMLElement).dataset.c === wert));
          };
          feld.addEventListener('change', uebernehmen, { once: true });
          feld.addEventListener('cancel', () => feld.remove(), { once: true });
          feld.click();
          return;
        }
        /* DIE SCHRIFT (E360): Familie im Kreis, Groesse eine Stufe, Fett
           und Rahmen als Schalter — alles ueber `setzeSchrift`, das auch
           die Auswahl anfasst. */
        if (target.dataset.act === 'schriftart' && controls.setzeSchrift) {
          const jetzt = SCHRIFTEN.findIndex(x => x.id === target.dataset.schrift);
          const naechste = SCHRIFTEN[(jetzt + 1) % SCHRIFTEN.length]!;
          controls.setzeSchrift({ familie: naechste.id });
          target.dataset.schrift = naechste.id;
          target.title = `Schriftart: ${naechste.name} — antippen wechselt: ${SCHRIFTEN.map(x => x.name).join(' → ')}`;
          target.innerHTML = `<span class="zeichen" aria-hidden="true" style="font-family:${naechste.stapel}">Aa</span><span class="wort">${naechste.name}</span>`;
          return;
        }
        if ((target.dataset.act === 'groesser' || target.dataset.act === 'kleiner') && controls.setzeSchrift) {
          controls.setzeSchrift({ schritt: target.dataset.act === 'groesser' ? 1 : -1 });
          const groesser = tools.querySelector<HTMLButtonElement>('[data-act="groesser"]');
          if (groesser && controls.schriftVon) groesser.title = `Schrift grösser (jetzt ${controls.schriftVon().groesse} px)`;
          return;
        }
        if ((target.dataset.act === 'fett' || target.dataset.act === 'rahmen') && controls.setzeSchrift) {
          const an = target.getAttribute('aria-pressed') !== 'true';
          controls.setzeSchrift(target.dataset.act === 'fett' ? { fett: an } : { rahmen: an });
          target.setAttribute('aria-pressed', an ? 'true' : 'false');
          target.classList.toggle('on', an);
          return;
        }
        if (target.dataset.act === 'lineal' && controls.setzeLineal) {
          const an = !controls.linealAn?.();
          controls.setzeLineal(an);
          target.setAttribute('aria-pressed', an ? 'true' : 'false');
          target.classList.toggle('on', an);
        }
        if (target.dataset.act === 'formen' && controls.setzeFormen) {
          const an = !controls.formenAn?.();
          controls.setzeFormen(an);
          target.setAttribute('aria-pressed', an ? 'true' : 'false');
          target.classList.toggle('on', an);
        }
        return;
      }
      if (target.dataset.c) {
        controls.setzeFarbe(target.dataset.c);
        /* Dieselbe Gegenrichtung wie beim Werkzeug: sonst stünde oben eine
           Farbe markiert, die niemand mehr benutzt. */
        if (typeof Zeichenziel !== 'undefined') {
          try { Zeichenziel.uebernehmeFarbe(controls, target.dataset.c); } catch { /* egal */ }
        }
        tools.querySelectorAll('.blatt-farbe').forEach(node => node.classList.remove('on'));
        target.classList.add('on');
        return;
      }
      if (target.dataset.b) {
        /* Die gewaehlte Stufe ein zweites Mal: Klappe mit dem Regler auf
           (oder wieder zu) — der Weg von GoodNotes (E465 Nachtrag). */
        if (target.classList.contains('on')) { staerkeAuf(!staerkeOffen()); return; }
        controls.setzeStrich(Number(target.dataset.b));
        if (typeof Zeichenziel !== 'undefined') {
          try { Zeichenziel.uebernehmeStrich(controls, Number(target.dataset.b)); } catch { /* egal */ }
        }
        tools.querySelectorAll('.blatt-strich').forEach(node => node.classList.remove('on'));
        target.classList.add('on');
        staerkeZeigen(Number(target.dataset.b));
      }
    });
    row.appendChild(tools);
    if (extra) {
      const fixed = document.createElement('div');
      fixed.className = 'blatt-fest'; fixed.innerHTML = extra; row.appendChild(fixed);
    }
    return row;
  };

  /* ---- TASTEN WIE GOODNOTES (E465) --------------------------------------
   * P Stift · 2 Bleistift · H Marker · E Radierer · S Form · V Auswahl ·
   * T Text · A Abdecken · N Haftnotiz · M Fachzeichen · R Lineal · I Bild.
   * Ein Buchstabe ohne Strg — deshalb nur, wenn gerade NIEMAND tippt (kein
   * Eingabefeld, nichts Editierbares im Fokus) und eine Zeichenflaeche
   * ueberhaupt da ist. Die Liste steht auch in `register/tasten.ts`, damit
   * die Uebersicht sie zeigt; test438 haelt beide zusammen.
   * ---------------------------------------------------------------------- */
  const TASTEN: Record<string, string> = {
    p: 'stift', '2': 'bleistift', h: 'marker', e: 'radierer', s: 'formen', v: 'select',
    t: 'text', a: 'abdeck', n: 'zettel', m: 'zeichen', r: 'lineal', i: 'bild'
  };
  const tippt = (): boolean => {
    const a = document.activeElement as HTMLElement | null;
    if (!a) return false;
    const tag = a.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || a.isContentEditable;
  };
  /** Die Leiste der aktiven Flaeche — ueber sie laufen die Kuerzel, damit
   *  Knopf und Zustand denselben Weg gehen wie beim Tippen mit der Hand. */
  const aktiveLeiste = (): HTMLElement | null => {
    const s = typeof Zeichenziel !== 'undefined' ? Zeichenziel.aktive() : null;
    const flaeche = s && (s as any).flaeche as Element | undefined;
    const huelle = flaeche?.closest('.blatt-huelle, .document-stage, .blatt, .pdfs, .page') || document;
    return huelle.querySelector<HTMLElement>('.blatt-werk') || document.querySelector<HTMLElement>('.blatt-werk');
  };
  const kuerzel = (event: KeyboardEvent): void => {
    if (event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;
    if (tippt()) return;
    if (typeof Zeichenziel === 'undefined' || !Zeichenziel.da()) return;
    const ziel = TASTEN[event.key.toLowerCase()];
    if (!ziel) return;
    const leiste = aktiveLeiste();
    if (!leiste) return;
    event.preventDefault();
    if (ziel === 'bleistift') {
      /* Der Bleistift ist ein Stift mit Stil: erst den Stift, dann so oft
         wechseln, bis er fuehrt. */
      const knopf = leiste.querySelector<HTMLButtonElement>('[data-act="stil"]');
      for (let n = 0; knopf && knopf.dataset.stil !== 'bleistift' && n < STIFTE.length; n++) knopf.click();
      if (Zeichenziel.jetzt() !== 'stift') leiste.querySelector<HTMLButtonElement>('[data-wz="stift"]')?.click();
      return;
    }
    if (ziel === 'lineal') { leiste.querySelector<HTMLButtonElement>('[data-act="lineal"]')?.click(); return; }
    leiste.querySelector<HTMLButtonElement>(`[data-wz="${ziel}"]`)?.click();
  };
  if (typeof document !== 'undefined') document.addEventListener('keydown', kuerzel);

  return { schicht, leiste, zeichneMarke, FARBEN, BREITEN, STIFTE, FORMEN, druckFaktor, RADIERER, TASTEN,
    zwischenablage: (): any[] => zwischenablage.map(mark => clone(mark)) };
})();

(window as any).Marken = Marken;
