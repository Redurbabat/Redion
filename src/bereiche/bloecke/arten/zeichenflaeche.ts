/* ============================================================================
 * canvas.js — Zeichenfläche, Diagramme, einfache Tabelle, Mathematik
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/bereiche/bloecke/arten/zeichenflaeche.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/bereiche/bloecke/arten/zeichenflaeche.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
 * Vier Blöcke, die man sonst nur in anderen Programmen bekommt:
 *
 *   Whiteboard   frei zeichnen, Formen, Haftnotizen  (wie AFFiNE „edgeless")
 *   Diagramm     Balken, Linie, Ring                 (wie tui.editor / Notion Chart)
 *   Tabelle      einfache Tabelle ohne Datenbank     (Notions „Simple table")
 *   Mathematik   LaTeX-Formeln ohne fremde Pakete    (wie MarkText / Zettlr)
 *
 * Alles ohne Abhängigkeiten, alles offline.
 * ==========================================================================*/

const Zusatz = (() => {

  /* Das angeklickte Element — oder nichts. `e.target` ist `EventTarget | null`
     und muss ein `Element` sein, bevor `closest` daran etwas findet. Vorher
     stand hier ungeprüft `e.target.closest(…)`: bei einem Klick, dessen Ziel
     kein Element ist, warf das mitten im Behandeln. */
  const elVon = (e: Event): Element | null =>
    e.target instanceof Element ? e.target : null;

  const esc = (s: string) => String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const NS = 'http://www.w3.org/2000/svg';
  const sv = (name: string, attrs: Record<string, unknown> = {}) => {
    const e = document.createElementNS(NS, name);
    Object.entries<any>(attrs).forEach(([k, v]) => e.setAttribute(k, String(v)));
    return e;
  };

  const PALETTE = ['#529cca', '#4dab9a', '#ffa344', '#ff7369', '#9a6dd7', '#e255a1', '#ffdc49', '#9b9a97'];

  /* ========================================================================
   * 1. WHITEBOARD
   * ======================================================================*/
  const whiteboard = (block: any) => {
    const daten = block.shapes ? JSON.parse(JSON.stringify(block.shapes)) : [];
    let werkzeug = 'stift';
    let farbe: string = PALETTE[0] ?? '#529cca';
    const hoehe = block.hoehe || 380;

    /* DIE FLÄCHE IST GRÖSSER ALS DAS FENSTER (E138, Auftrag §22).
       Bis hierher war das Whiteboard genau so gross wie sein Kasten: was
       rechts hinausging, war weg. Die Formen behalten ihre Koordinaten —
       neu ist nur ein AUSSCHNITT darüber. `sicht.x/y` ist die linke obere
       Ecke des Ausschnitts in Formkoordinaten, `sicht.z` der Massstab.

       Damit bleiben alte Boards Zeichen für Zeichen gültig: ohne
       gespeicherte Sicht ist der Ausschnitt 0/0 bei Massstab 1, und das ist
       genau das Bild von vorher. */
    const zahl = (wert: unknown, ersatz: number): number =>
      typeof wert === 'number' && Number.isFinite(wert) ? wert : ersatz;
    const gespeichert = block.sicht && typeof block.sicht === 'object' ? block.sicht : {};
    /* DER KLEINSTE MASSSTAB IST 10 %, NICHT 25 %. Gemessen an einer Fläche
       mit 900 × 380 px und einer Haftnotiz bei 2600/1800: „alles ins Bild"
       brauchte 22,7 % und bekam 25 % — die Notiz blieb unten draussen, und
       der Knopf hielt sein Versprechen nicht.
       Ein Knopf, der „alles" sagt und nicht alles zeigt, ist schlimmer als
       keiner: man glaubt ihm und sucht nicht weiter. */
    const KLEINSTER = .1, GROESSTER = 4;
    const sicht = { x: zahl(gespeichert.x, 0), y: zahl(gespeichert.y, 0),
                    z: Math.min(GROESSTER, Math.max(KLEINSTER, zahl(gespeichert.z, 1))) };
    let verbindeVon: string | null = null;

    const w = document.createElement('div');
    w.className = 'wb';
    w.innerHTML =
      '<div class="wb-tools">' +
        [['zeiger', '⭠', 'Auswählen und verschieben'],
         ['hand', '✋', 'Fläche schieben'],
         ['stift', '✎', 'Freihand zeichnen'],
         ['linie', '╱', 'Linie'],
         ['pfeil', '→', 'Pfeil'],
         ['rechteck', '▭', 'Rechteck'],
         ['ellipse', '◯', 'Ellipse'],
         ['notiz', '🗒', 'Haftnotiz'],
         ['text', 'T', 'Text'],
         ['bild', '🖼', 'Bild einfügen'],
         ['verbindung', '⇢', 'Zwei Formen verbinden'],
         ['radierer', '⌫', 'Radierer']]
          .map(([id, ico, titel]) =>
            `<button data-wz="${id}" title="${titel}"${id === 'stift' ? ' class="on"' : ''}>${ico}</button>`).join('') +
        '<span class="wb-sep"></span>' +
        PALETTE.map(c => `<button class="wb-farbe" data-c="${c}" style="background:${c}"></button>`).join('') +
        '<span class="wb-sep"></span>' +
        /* DIE VIER ZOOMKNÖPFE SIND EINE GRUPPE, kein loser Haufen. Am
           Telefon bricht die Leiste in drei Zeilen um, und ohne diese
           Klammer stand gemessen „−" am Ende der zweiten Zeile und „＋"
           am Anfang der dritten — zwei Hälften eines Reglers, getrennt
           durch einen Zeilenumbruch. */
        '<span class="wb-zoom">' +
          '<button data-a="kleiner" title="Verkleinern">−</button>' +
          '<b class="wb-massstab" aria-live="polite">100 %</b>' +
          '<button data-a="groesser" title="Vergrössern">＋</button>' +
          '<button data-a="passend" title="Alles ins Bild holen">⤢</button>' +
        '</span>' +
        '<span class="wb-sep"></span>' +
        '<button data-a="zurueck" title="Schritt zurück" disabled>↶</button>' +
        '<button data-a="vor" title="Schritt vorwärts" disabled>↷</button>' +
        '<button data-a="leeren" title="Alles löschen">🗑</button>' +
        '<button data-a="png" title="Als Bild speichern">⭳</button>' +
      '</div>';

    const flaeche = sv('svg', { class: 'wb-flaeche', width: '100%', height: hoehe });
    flaeche.style.height = hoehe + 'px';
    w.appendChild(flaeche);

    const griff = document.createElement('div');
    griff.className = 'wb-griff';
    griff.title = 'Höhe ziehen';
    w.appendChild(griff);

    /* --- Zeichnen ------------------------------------------------------- */
    /* MEHRSTUFIGES ZURÜCK (E144, L54). `↶` war `daten.pop()` — es nahm die
       zuletzt ANGEHÄNGTE Form weg, egal was zuletzt passiert war. Ein
       Verschieben liess sich damit nicht zurücknehmen, ein Radieren auch
       nicht, und zweimal drücken warf die vorletzte Form weg statt den
       vorletzten Schritt.

       Jetzt liegt vor jeder Änderung ein Abbild auf einem Stapel. Vierzig
       Schritte weit; darüber fällt das älteste heraus. Vierzig, weil ein
       Abbild einer vollen Fläche einige Kilobyte hat und der Stapel nur im
       Arbeitsspeicher lebt — er wird bewusst NICHT mitgespeichert. Wer die
       Seite neu lädt, hat seine Zeichnung, aber keine Schrittfolge; das ist
       die ehrlichere Grenze, als den Block mit Verlauf aufzublähen. */
    const SCHRITTE = 40;
    const zurueckStapel: string[] = [];
    const vorStapel: string[] = [];
    const abbild = (): string => JSON.stringify(daten);
    const merken = (): void => {
      zurueckStapel.push(abbild());
      if (zurueckStapel.length > SCHRITTE) zurueckStapel.shift();
      vorStapel.length = 0;
      standZeigen();
    };
    const einsetzen = (roh: string): void => {
      daten.length = 0;
      JSON.parse(roh).forEach((form: any) => daten.push(form));
    };
    const standZeigen = (): void => {
      const zurueck = w.querySelector<HTMLButtonElement>('[data-a="zurueck"]');
      const vor = w.querySelector<HTMLButtonElement>('[data-a="vor"]');
      if (zurueck) zurueck.disabled = !zurueckStapel.length;
      if (vor) vor.disabled = !vorStapel.length;
    };

    const sichern = () => Store.updateBlock(block.id, { shapes: daten });

    /* Der Ausschnitt in Formkoordinaten. Solange der Kasten noch nicht im
       Dokument hängt, misst der Browser 0 — dann rechnen wir mit einer
       Ersatzbreite und zeichnen beim ersten Anblick neu (ResizeObserver
       weiter unten). Ohne das stünde beim ersten Bild ein viewBox von
       Breite 0, und die Fläche bliebe leer. */
    const ausschnitt = () => {
      const r = flaeche.getBoundingClientRect();
      const breite = r.width > 4 ? r.width : 900;
      const hoch = r.height > 4 ? r.height : hoehe;
      return { x: sicht.x, y: sicht.y, w: breite / sicht.z, h: hoch / sicht.z };
    };

    /* Der Platzbedarf einer Form — für „alles ins Bild" und für die
       Verbindungen. Jede Art rechnet anders, und `text` lässt sich nur
       schätzen; das reicht, weil beides nur Anhaltspunkte braucht. */
    const rahmenVon = (s: any): { x: number; y: number; w: number; h: number } => {
      if (s.art === 'stift') {
        const xs = s.pts.map((q: any) => q[0]), ys = s.pts.map((q: any) => q[1]);
        const x = Math.min(...xs), y = Math.min(...ys);
        return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
      }
      if (s.art === 'text')
        return { x: s.x, y: s.y - 14, w: Math.max(20, String(s.text || '').length * 8), h: 20 };
      return { x: Math.min(s.x, s.x + s.w), y: Math.min(s.y, s.y + s.h),
               w: Math.abs(s.w), h: Math.abs(s.h) };
    };

    /* Wo eine Verbindung den Rand ihrer Form trifft. Ohne das steckte die
       Pfeilspitze mitten in der Haftnotiz. */
    const randPunkt = (rahmen: any, zielX: number, zielY: number): [number, number] => {
      const mx = rahmen.x + rahmen.w / 2, my = rahmen.y + rahmen.h / 2;
      const dx = zielX - mx, dy = zielY - my;
      if (!dx && !dy) return [mx, my];
      const halbW = Math.max(1, rahmen.w / 2), halbH = Math.max(1, rahmen.h / 2);
      const anteil = Math.min(halbW / Math.abs(dx || .0001), halbH / Math.abs(dy || .0001));
      return [mx + dx * anteil, my + dy * anteil];
    };

    const male = () => {
      flaeche.innerHTML = '';
      const feld = ausschnitt();
      flaeche.setAttribute('viewBox', `${feld.x} ${feld.y} ${feld.w} ${feld.h}`);
      const raster = sv('pattern', { id: 'r' + block.id.slice(0, 6), width: 24, height: 24, patternUnits: 'userSpaceOnUse' });
      raster.appendChild(sv('circle', { cx: 1, cy: 1, r: 1, fill: 'currentColor', opacity: .18 }));
      const defs = sv('defs');
      defs.appendChild(raster);
      const spitze = sv('marker', { id: 'p' + block.id.slice(0, 6), markerWidth: 9, markerHeight: 9,
                                    refX: 8, refY: 3, orient: 'auto' });
      spitze.appendChild(sv('path', { d: 'M0,0 L9,3 L0,6 z', fill: 'context-stroke' }));
      defs.appendChild(spitze);
      flaeche.appendChild(defs);
      flaeche.appendChild(sv('rect', { x: feld.x, y: feld.y, width: feld.w, height: feld.h,
                                       fill: `url(#r${block.id.slice(0, 6)})` }));

      /* Verbindungen zuerst — sie gehören unter die Formen, die sie verbinden. */
      daten.filter((s: any) => s.art === 'verbindung')
        .forEach((s: any) => { const linie = verbindungZeichnen(s); if (linie) flaeche.appendChild(linie); });
      daten.filter((s: any) => s.art !== 'verbindung')
        .forEach((s: any) => flaeche.appendChild(formZeichnen(s)));
      if (werkzeug === 'zeiger' && gewaehlt) {
        const s = daten.find((q: any) => q.id === gewaehlt);
        if (s && groessenFaehig(s)) {
          const rahmen = rahmenVon(s);
          const kante = GRIFF / sicht.z;
          flaeche.appendChild(sv('rect', {
            x: rahmen.x + rahmen.w - kante / 2, y: rahmen.y + rahmen.h - kante / 2,
            width: kante, height: kante, rx: kante / 4,
            fill: 'var(--accent)', stroke: 'var(--bg-card)',
            'stroke-width': 1 / sicht.z, class: 'wb-griffpunkt'
          }));
        }
      }
      const anzeige = w.querySelector('.wb-massstab');
      if (anzeige) anzeige.textContent = Math.round(sicht.z * 100) + ' %';
    };

    /* `undefined` heisst „noch nicht gefragt", `null` heisst „gibt es nicht
       mehr", eine Zeichenkette ist die Adresse. Drei Zustände, weil zwei zu
       wenig sind: ohne den Unterschied fragte die Fläche bei jeder
       Neuzeichnung wieder nach einer Datei, die gelöscht ist. */
    const bildAdressen = new Map<string, string | null>();
    const bildHolen = (dateiId: string): void => {
      const ablage = (globalThis as any).Dateien;
      if (!ablage?.adresse) { bildAdressen.set(dateiId, null); return; }
      bildAdressen.set(dateiId, null);
      Promise.resolve(ablage.adresse(dateiId)).then((url: string | null) => {
        bildAdressen.set(dateiId, url || null);
        if (url) male();
      }).catch(() => { bildAdressen.set(dateiId, null); });
    };

    /* Ein Bild von der Festplatte auf die Fläche. Die Datei geht denselben
       Weg wie jeder andere Anhang — in Stücken in die Ablage, verknüpft mit
       diesem Block, damit sie beim Löschen der Seite mitgeht. */
    const bildWaehlen = (x: number, y: number): void => {
      const ablage = (globalThis as any).Dateien;
      if (!ablage?.ablegen) { UI.toast('Die Dateiablage ist noch nicht geladen'); return; }
      const feld = document.createElement('input');
      feld.type = 'file';
      feld.accept = 'image/*';
      feld.addEventListener('change', async () => {
        const datei = feld.files?.[0];
        if (!datei) return;
        try {
          const satz = await ablage.ablegen(datei, { blockId: block.id });
          const masse = await new Promise<{ w: number; h: number }>(fertig => {
            const probe = new Image();
            probe.onload = () => fertig({ w: probe.naturalWidth || 320, h: probe.naturalHeight || 240 });
            probe.onerror = () => fertig({ w: 320, h: 240 });
            probe.src = URL.createObjectURL(datei);
          });
          const breite = Math.min(360, masse.w);
          merken();
          daten.push({ id: Store.uid().slice(0, 8), art: 'bild', x, y,
                       w: Math.round(breite), h: Math.round(breite * masse.h / (masse.w || 1)),
                       farbe, dateiId: String(satz.id) });
          male(); sichern();
        } catch (fehler) {
          UI.toast(fehler instanceof Error ? fehler.message : 'Das Bild liess sich nicht ablegen');
        }
      });
      feld.click();
    };

    /* SCHREIBEN AUF DER FLÄCHE, NICHT IM BROWSERFENSTER (E144, L54).
       Hier stand `prompt()`. Das ist ein Fenster des Browsers: es steht in
       der Mitte des Bildschirms, sagt nichts darüber, WO der Text hinkommt,
       nimmt am Telefon die halbe Höhe weg und kennt keine zweite Zeile.

       Jetzt steht das Feld genau dort, wo die Notiz entsteht, in derselben
       Grösse und Farbe. Enter schliesst ab (bei der Haftnotiz erst mit
       Strg), Escape wirft weg, ein Klick daneben übernimmt. */
    const textErfassen = (x: number, y: number, breite: number, hoehe: number,
                          vorgabe: string): Promise<string | null> =>
      new Promise(fertig => {
        const r = flaeche.getBoundingClientRect();
        const wRect = w.getBoundingClientRect();
        const feld = document.createElement('textarea');
        feld.className = 'wb-eingabe';
        feld.value = vorgabe;
        feld.style.left = Math.round((x - sicht.x) * sicht.z + (r.left - wRect.left)) + 'px';
        feld.style.top = Math.round((y - sicht.y) * sicht.z + (r.top - wRect.top)) + 'px';
        feld.style.width = Math.round(breite * sicht.z) + 'px';
        feld.style.height = Math.round(hoehe * sicht.z) + 'px';
        feld.style.color = farbe;
        w.appendChild(feld);
        let erledigt = false;
        const schliessen = (wert: string | null): void => {
          if (erledigt) return;
          erledigt = true;
          feld.remove();
          fertig(wert);
        };
        feld.addEventListener('keydown', e => {
          if (e.key === 'Escape') { e.preventDefault(); schliessen(null); return; }
          if (e.key === 'Enter' && (hoehe < 40 || e.ctrlKey || e.metaKey)) {
            e.preventDefault(); schliessen(feld.value);
          }
        });
        feld.addEventListener('blur', () => schliessen(feld.value));
        setTimeout(() => { feld.focus(); feld.select(); }, 0);
      });

    /* Was sich in der Grösse ändern lässt: alles mit einem echten Rechteck.
       Ein Stiftstrich hat Punkte statt Kanten, eine Verbindung hängt an zwei
       Formen, und ein Text hat nur eine Schriftgrösse — die drei bleiben
       draussen. */
    const groessenFaehig = (s: any): boolean =>
      s && s.art !== 'stift' && s.art !== 'verbindung' && s.art !== 'text';

    const verbindungZeichnen = (s: any): Element | null => {
      const a = daten.find((q: any) => q.id === s.von);
      const b = daten.find((q: any) => q.id === s.nach);
      if (!a || !b) return null;
      const ra = rahmenVon(a), rb = rahmenVon(b);
      const [x1, y1] = randPunkt(ra, rb.x + rb.w / 2, rb.y + rb.h / 2);
      const [x2, y2] = randPunkt(rb, ra.x + ra.w / 2, ra.y + ra.h / 2);
      const p = sv('path', {
        d: `M${x1} ${y1} L${x2} ${y2}`, stroke: s.farbe, 'stroke-width': 2,
        fill: 'none', 'stroke-dasharray': '6 4', 'marker-end': `url(#p${block.id.slice(0, 6)})`
      });
      p.dataset.sid = s.id;
      return p;
    };

    const formZeichnen = (s: any) => {
      if (s.art === 'stift' || s.art === 'linie' || s.art === 'pfeil') {
        const p = sv('path', {
          d: s.art === 'stift'
            ? 'M' + s.pts.map((q: any) => q[0] + ' ' + q[1]).join(' L')
            : `M${s.x} ${s.y} L${s.x + s.w} ${s.y + s.h}`,
          stroke: s.farbe, 'stroke-width': 2.5, fill: 'none',
          'stroke-linecap': 'round', 'stroke-linejoin': 'round'
        });
        if (s.art === 'pfeil') p.setAttribute('marker-end', `url(#p${block.id.slice(0, 6)})`);
        p.dataset.sid = s.id;
        /* EIN STRICH IST ZWEIEINHALB PIXEL BREIT — mit dem Finger trifft man
           ihn nicht. Darunter liegt deshalb derselbe Pfad noch einmal, 16 px
           breit und durchsichtig: er fängt den Griff, malt aber nichts. */
        const fang = sv('path', {
          d: p.getAttribute('d') || '', stroke: 'transparent', 'stroke-width': 16,
          fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round'
        });
        fang.dataset.sid = s.id;
        const gruppe = sv('g');
        gruppe.appendChild(fang);
        gruppe.appendChild(p);
        return gruppe;
      }
      if (s.art === 'rechteck' || s.art === 'notiz') {
        const g = sv('g');
        const r = sv('rect', {
          x: Math.min(s.x, s.x + s.w), y: Math.min(s.y, s.y + s.h),
          width: Math.abs(s.w), height: Math.abs(s.h), rx: s.art === 'notiz' ? 3 : 5,
          fill: s.art === 'notiz' ? s.farbe : 'none', stroke: s.farbe, 'stroke-width': 2,
          'fill-opacity': s.art === 'notiz' ? .85 : 1,
          /* EIN RECHTECK OHNE FÜLLUNG NIMMT KEINE KLICKS AN (E144). SVG
             trifft standardmässig nur, was GEMALT ist — bei `fill: none` ist
             das allein der zwei Pixel breite Strich. „Auswählen und
             verschieben" ging deshalb nur, wenn man die Kante traf; in der
             Mitte griff man durch die Form hindurch ins Raster.
             Gemessen mit `elementFromPoint` mitten im Rechteck: es kam der
             Hintergrund zurück, nicht die Form. */
          'pointer-events': 'all'
        });
        r.dataset.sid = s.id;
        g.appendChild(r);
        if (s.text) {
          const t = sv('text', {
            x: Math.min(s.x, s.x + s.w) + 10, y: Math.min(s.y, s.y + s.h) + 22,
            fill: s.art === 'notiz' ? '#1c1c1c' : s.farbe, 'font-size': 14
          });
          zeilenUmbruch(s.text, Math.abs(s.w) - 18).forEach((z, i) => {
            const ts = sv('tspan', { x: Math.min(s.x, s.x + s.w) + 10, dy: i ? 18 : 0 });
            ts.textContent = z;
            t.appendChild(ts);
          });
          g.appendChild(t);
        }
        return g;
      }
      if (s.art === 'bild') {
        /* DAS BILD LIEGT IN DER DATEIABLAGE, NICHT IN DEN FORMEN (§14).
           In `shapes` steht nur die Kennung; die Adresse ist ein Blob-Link,
           den erst `Dateien.adresse()` herausgibt — und das dauert. Solange
           sie fehlt, steht ein Platzhalter da und `male()` wird einmal
           nachgeholt, sobald die Adresse kommt.

           Ein Bild als Data-URL in `shapes` wäre der kurze Weg gewesen. Er
           bläht jeden Block, jede Sicherung und jeden Versionsstand um die
           volle Bildgrösse auf — genau das, was §14 verbietet. */
        const bekannt = bildAdressen.get(String(s.dateiId || ''));
        if (bekannt === undefined && s.dateiId) bildHolen(String(s.dateiId));
        const rahmen = {
          x: Math.min(s.x, s.x + s.w), y: Math.min(s.y, s.y + s.h),
          w: Math.abs(s.w) || 160, h: Math.abs(s.h) || 120
        };
        if (!bekannt) {
          const platz = sv('g');
          platz.appendChild(sv('rect', { x: rahmen.x, y: rahmen.y, width: rahmen.w, height: rahmen.h,
                                         rx: 5, fill: 'none', stroke: s.farbe, 'stroke-width': 2,
                                         'stroke-dasharray': '5 4' }));
          const wort = sv('text', { x: rahmen.x + rahmen.w / 2, y: rahmen.y + rahmen.h / 2,
                                    fill: s.farbe, 'font-size': 13, 'text-anchor': 'middle' });
          wort.textContent = bekannt === null ? 'Bild fehlt' : 'Bild lädt …';
          platz.appendChild(wort);
          platz.dataset.sid = s.id;
          return platz;
        }
        const bild = sv('image', { x: rahmen.x, y: rahmen.y, width: rahmen.w, height: rahmen.h,
                                   preserveAspectRatio: 'xMidYMid meet' });
        bild.setAttribute('href', bekannt);
        bild.dataset.sid = s.id;
        return bild;
      }
      if (s.art === 'ellipse') {
        const e = sv('ellipse', {
          cx: s.x + s.w / 2, cy: s.y + s.h / 2,
          rx: Math.abs(s.w / 2), ry: Math.abs(s.h / 2),
          fill: 'none', stroke: s.farbe, 'stroke-width': 2,
          'pointer-events': 'all'   /* wie beim Rechteck, siehe dort */
        });
        e.dataset.sid = s.id;
        return e;
      }
      /* text */
      const t = sv('text', { x: s.x, y: s.y, fill: s.farbe, 'font-size': 17, 'font-weight': 500 });
      t.textContent = s.text || '';
      t.dataset.sid = s.id;
      return t;
    };

    const zeilenUmbruch = (text: string, breite: number) => {
      const proZeile = Math.max(6, Math.floor(breite / 7.4));
      const worte = String(text).split(/\s+/);
      const out = []; let zeile = '';
      worte.forEach(x => {
        if ((zeile + ' ' + x).trim().length > proZeile) { out.push(zeile.trim()); zeile = x; }
        else zeile += ' ' + x;
      });
      if (zeile.trim()) out.push(zeile.trim());
      return out.slice(0, 8);
    };

    /* VON BILDSCHIRM AUF FLÄCHE. Vorher war beides dasselbe; mit Ausschnitt
       und Massstab ist es das nicht mehr, und ohne diese Umrechnung landete
       jeder Strich an der falschen Stelle, sobald man einmal geschoben hat. */
    const punkt = (e: any): [number, number] => {
      const r = flaeche.getBoundingClientRect();
      return [Math.round(sicht.x + (e.clientX - r.left) / sicht.z),
              Math.round(sicht.y + (e.clientY - r.top) / sicht.z)];
    };

    const sichtSichern = () => Store.updateBlock(block.id, {
      sicht: { x: Math.round(sicht.x), y: Math.round(sicht.y),
               z: Math.round(sicht.z * 100) / 100 }
    });

    /* Vergrössern um den festgehaltenen Punkt: was unter dem Finger liegt,
       bleibt unter dem Finger. Ohne Mittelpunkt springt das Bild bei jedem
       Schritt weg, und man sucht seine Zeichnung wieder. */
    const massstab = (neuZ: number, haltX?: number, haltY?: number) => {
      const r = flaeche.getBoundingClientRect();
      const z = Math.min(GROESSTER, Math.max(KLEINSTER, neuZ));
      const mx = haltX ?? sicht.x + (r.width || 900) / sicht.z / 2;
      const my = haltY ?? sicht.y + (r.height || hoehe) / sicht.z / 2;
      sicht.x = mx - (mx - sicht.x) * (sicht.z / z);
      sicht.y = my - (my - sicht.y) * (sicht.z / z);
      sicht.z = z;
      male();
      sichtSichern();
    };

    const insBild = () => {
      const formen = daten.filter((s: any) => s.art !== 'verbindung');
      if (!formen.length) { sicht.x = 0; sicht.y = 0; sicht.z = 1; male(); sichtSichern(); return; }
      const rahmen: Array<{ x: number; y: number; w: number; h: number }> = formen.map(rahmenVon);
      const x1 = Math.min(...rahmen.map(r => r.x)) - 30;
      const y1 = Math.min(...rahmen.map(r => r.y)) - 30;
      const x2 = Math.max(...rahmen.map(r => r.x + r.w)) + 30;
      const y2 = Math.max(...rahmen.map(r => r.y + r.h)) + 30;
      const r = flaeche.getBoundingClientRect();
      const breite = r.width > 4 ? r.width : 900, hoch = r.height > 4 ? r.height : hoehe;
      sicht.z = Math.min(GROESSTER, Math.max(KLEINSTER,
        Math.min(breite / Math.max(1, x2 - x1), hoch / Math.max(1, y2 - y1))));
      sicht.x = x1 - (breite / sicht.z - (x2 - x1)) / 2;
      sicht.y = y1 - (hoch / sicht.z - (y2 - y1)) / 2;
      male();
      sichtSichern();
    };

    /* GRÖSSE ÄNDERN (E144, L54). Wer ein Rechteck zu klein gezogen hatte,
       musste es löschen und neu ziehen — Verschieben ging, Skalieren nicht.

       Der Griff sitzt an der rechten unteren Ecke und wird NUR für die
       zuletzt angefasste Form gezeichnet. Ein Griff an jeder Form wäre auf
       einer vollen Fläche ein Punktemeer; einer ohne sichtbaren Griff wäre
       ein Geheimnis. */
    let gewaehlt: string | null = null;
    const GRIFF = 9;
    let aktiv: any = null, verschiebt: any = null, schiebt: any = null, groesst: any = null;
    const finger = new Map<number, { x: number; y: number }>();
    let kneifen: { abstand: number; z: number } | null = null;

    flaeche.addEventListener('pointerdown', (e: any) => {
      flaeche.setPointerCapture(e.pointerId);
      finger.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (finger.size === 2) {
        /* ZWEI FINGER SIND IMMER ZOOM, egal welches Werkzeug gewählt ist.
           Am Telefon ist das die einzige Geste, die man dafür kennt — und
           ein angefangener Strich wird dabei zurückgenommen, sonst bleibt
           bei jedem Kneifen ein Kritzel liegen. */
        if (aktiv) { daten.pop(); aktiv = null; male(); }
        const zwei = [...finger.values()];
        const dx = zwei[0]!.x - zwei[1]!.x, dy = zwei[0]!.y - zwei[1]!.y;
        kneifen = { abstand: Math.hypot(dx, dy) || 1, z: sicht.z };
        return;
      }
      const [x, y] = punkt(e);

      if (werkzeug === 'hand') {
        schiebt = { x: e.clientX, y: e.clientY, sx: sicht.x, sy: sicht.y };
        return;
      }
      if (werkzeug === 'verbindung') {
        const sid = e.target.dataset?.sid;
        const s = daten.find((q: any) => q.id === sid && q.art !== 'verbindung');
        if (!s) { UI.toast('Tippe zuerst auf die Form, von der die Verbindung ausgeht'); return; }
        if (!verbindeVon) { verbindeVon = s.id; UI.toast('Und jetzt auf die zweite Form'); return; }
        if (verbindeVon === s.id) { verbindeVon = null; return; }
        merken();
        daten.push({ id: Store.uid().slice(0, 8), art: 'verbindung', von: verbindeVon, nach: s.id, farbe });
        verbindeVon = null;
        male(); sichern();
        return;
      }
      if (werkzeug === 'radierer') {
        const sid = e.target.dataset?.sid;
        if (sid) {
          const i = daten.findIndex((s: any) => s.id === sid);
          if (i >= 0) {
            merken();
            /* Mit der Form gehen ihre Verbindungen. Sonst bliebe ein Pfeil
               stehen, der nichts mehr verbindet — gezeichnet wird er dann
               gar nicht, aber er läge weiter in den Daten. */
            daten.splice(i, 1);
            for (let j = daten.length - 1; j >= 0; j--)
              if (daten[j].art === 'verbindung' && (daten[j].von === sid || daten[j].nach === sid))
                daten.splice(j, 1);
            male(); sichern();
          }
        }
        return;
      }
      if (werkzeug === 'zeiger') {
        /* Erst der Griff: er liegt über der Form und muss deshalb zuerst
           gefragt werden, sonst schiebt man beim Ziehen daran. */
        const gewaehlteForm = daten.find((q: any) => q.id === gewaehlt);
        if (gewaehlteForm && groessenFaehig(gewaehlteForm)) {
          const rahmen = rahmenVon(gewaehlteForm);
          const nah = GRIFF / sicht.z + 3;
          if (Math.abs(x - (rahmen.x + rahmen.w)) <= nah &&
              Math.abs(y - (rahmen.y + rahmen.h)) <= nah) {
            merken();
            groesst = { s: gewaehlteForm, x, y };
            return;
          }
        }
        const sid = e.target.dataset?.sid;
        const s = daten.find((q: any) => q.id === sid);
        gewaehlt = s ? String(s.id) : null;
        if (s) { merken(); verschiebt = { s, x, y }; }
        /* HIER DARF NICHT NEU GEZEICHNET WERDEN. `male()` setzt
           `flaeche.innerHTML = ''` — und damit verschwindet genau das
           Element, auf dem der Zeiger gerade heruntergegangen ist. Chrome
           gibt daraufhin die Zeigerhaltung frei und schickt ein
           `pointercancel`; `fertig()` setzt `verschiebt` auf null, und das
           Ziehen war vorbei, bevor es angefangen hat.

           Gemessen: der Kasten lag nach einem Zug über 200 px immer noch bei
           x = 60. Der Griff wird deshalb erst beim Loslassen gezeichnet —
           dort steht `male()` ohnehin. */
        return;
      }
      if (werkzeug === 'bild') { bildWaehlen(x, y); return; }
      if (werkzeug === 'text' || werkzeug === 'notiz') {
        const art = werkzeug;
        void textErfassen(x, y, art === 'notiz' ? 170 : 220, art === 'notiz' ? 110 : 28, '')
          .then(text => {
            if (text === null || !text.trim()) return;
            merken();
            daten.push(art === 'notiz'
              ? { id: Store.uid().slice(0, 8), art: 'notiz', x, y, w: 170, h: 110, farbe, text }
              : { id: Store.uid().slice(0, 8), art: 'text', x, y, farbe, text });
            male(); sichern();
          });
        return;
      }
      merken();
      aktiv = werkzeug === 'stift'
        ? { id: Store.uid().slice(0, 8), art: 'stift', pts: [[x, y]], farbe }
        : { id: Store.uid().slice(0, 8), art: werkzeug, x, y, w: 0, h: 0, farbe };
      daten.push(aktiv);
    });

    flaeche.addEventListener('pointermove', (e: any) => {
      if (finger.has(e.pointerId)) finger.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (kneifen && finger.size >= 2) {
        const zwei = [...finger.values()];
        const dx = zwei[0]!.x - zwei[1]!.x, dy = zwei[0]!.y - zwei[1]!.y;
        const r = flaeche.getBoundingClientRect();
        const mitteX = sicht.x + ((zwei[0]!.x + zwei[1]!.x) / 2 - r.left) / sicht.z;
        const mitteY = sicht.y + ((zwei[0]!.y + zwei[1]!.y) / 2 - r.top) / sicht.z;
        massstab(kneifen.z * (Math.hypot(dx, dy) / kneifen.abstand), mitteX, mitteY);
        return;
      }
      if (schiebt) {
        sicht.x = schiebt.sx - (e.clientX - schiebt.x) / sicht.z;
        sicht.y = schiebt.sy - (e.clientY - schiebt.y) / sicht.z;
        male();
        return;
      }
      const [x, y] = punkt(e);
      if (groesst) {
        const s = groesst.s;
        /* Von der linken oberen Ecke aus, damit die Form nicht wegläuft:
           bei negativer Breite läge sie sonst plötzlich woanders. */
        const links = Math.min(s.x, s.x + s.w), oben = Math.min(s.y, s.y + s.h);
        s.x = links; s.y = oben;
        s.w = Math.max(8, Math.round(x - links));
        s.h = Math.max(8, Math.round(y - oben));
        male();
        return;
      }
      if (verschiebt) {
        const dx = x - verschiebt.x, dy = y - verschiebt.y;
        const s = verschiebt.s;
        if (s.art === 'stift') s.pts = s.pts.map((p: any) => [p[0] + dx, p[1] + dy]);
        else { s.x += dx; s.y += dy; }
        verschiebt.x = x; verschiebt.y = y;
        male();
        return;
      }
      if (!aktiv) return;
      if (aktiv.art === 'stift') aktiv.pts.push([x, y]);
      else { aktiv.w = x - aktiv.x; aktiv.h = y - aktiv.y; }
      male();
    });

    const fertig = (e?: any) => {
      if (e && typeof e.pointerId === 'number') finger.delete(e.pointerId);
      if (finger.size < 2) kneifen = null;
      if (schiebt) { schiebt = null; sichtSichern(); }
      if (aktiv) {
        /* Winzige Kritzler wieder entfernen */
        const klein = aktiv.art === 'stift' ? aktiv.pts.length < 2 : Math.abs(aktiv.w) < 4 && Math.abs(aktiv.h) < 4;
        if (klein) {
          daten.pop();
          /* Und mit dem Kritzler auch den Schritt: sonst läge ein Abbild auf
             dem Stapel, das genau denselben Stand beschreibt — `↶` täte dann
             einmal scheinbar nichts. */
          zurueckStapel.pop();
          standZeigen();
        }
        aktiv = null; sichern(); male();
      }
      if (verschiebt) { verschiebt = null; sichern(); male(); }
      if (groesst) { groesst = null; sichern(); male(); }
    };
    flaeche.addEventListener('pointerup', fertig);
    flaeche.addEventListener('pointercancel', fertig);
    flaeche.addEventListener('pointerleave', fertig);

    /* ZWEIMAL TIPPEN ÄNDERT DEN TEXT. Bisher gab es keinen Weg dazu: eine
       vertippte Haftnotiz musste man radieren und neu schreiben. */
    flaeche.addEventListener('dblclick', (e: any) => {
      const sid = e.target?.dataset?.sid;
      const s = daten.find((q: any) => q.id === sid);
      if (!s || (s.art !== 'notiz' && s.art !== 'text')) return;
      e.preventDefault();
      const rahmen = rahmenVon(s);
      void textErfassen(rahmen.x, rahmen.y, Math.max(120, rahmen.w),
                        s.art === 'notiz' ? Math.max(60, rahmen.h) : 28, String(s.text || ''))
        .then(text => {
          if (text === null || text === s.text) return;
          merken();
          s.text = text;
          male(); sichern();
        });
    });

    /* Am Rechner ist das Rad der gewohnte Weg. `passive: false` steht da,
       weil `preventDefault` sonst nichts tut und die ganze Seite mitrollt. */
    flaeche.addEventListener('wheel', (e: WheelEvent) => {
      e.preventDefault();
      const r = flaeche.getBoundingClientRect();
      massstab(sicht.z * (e.deltaY < 0 ? 1.12 : 1 / 1.12),
               sicht.x + (e.clientX - r.left) / sicht.z,
               sicht.y + (e.clientY - r.top) / sicht.z);
    }, { passive: false });

    /* --- Werkzeugleiste -------------------------------------------------- */
    w.querySelector('.wb-tools')?.addEventListener('click', e => {
      const wz = elVon(e)?.closest<HTMLElement>('[data-wz]');
      if (wz) {
        werkzeug = wz.dataset.wz ?? werkzeug;
        verbindeVon = null;
        if (werkzeug !== 'zeiger') gewaehlt = null;
        w.classList.toggle('wb-schiebt', werkzeug === 'hand');
        w.querySelectorAll('[data-wz]').forEach(b => b.classList.toggle('on', b === wz));
        /* Der Griff gehört zum Zeiger. Bleibt er beim Wechsel stehen, sieht
           die Fläche aus, als wäre noch etwas ausgewählt. */
        male();
        return;
      }
      const c = elVon(e)?.closest<HTMLElement>('[data-c]');
      if (c) {
        farbe = c.dataset.c ?? farbe;
        w.querySelectorAll('.wb-farbe').forEach(b => b.classList.toggle('on', b === c));
        return;
      }
      const a = elVon(e)?.closest<HTMLElement>('[data-a]');
      if (!a) return;
      if (a.dataset.a === 'zurueck' && zurueckStapel.length) {
        vorStapel.push(abbild());
        einsetzen(zurueckStapel.pop() as string);
        standZeigen(); male(); sichern();
      }
      if (a.dataset.a === 'vor' && vorStapel.length) {
        zurueckStapel.push(abbild());
        einsetzen(vorStapel.pop() as string);
        standZeigen(); male(); sichern();
      }
      if (a.dataset.a === 'leeren') {
        if (!daten.length || confirm('Die ganze Zeichenfläche leeren?')) {
          merken(); daten.length = 0; male(); sichern();
        }
      }
      if (a.dataset.a === 'kleiner') massstab(sicht.z / 1.25);
      if (a.dataset.a === 'groesser') massstab(sicht.z * 1.25);
      if (a.dataset.a === 'passend') insBild();
      if (a.dataset.a === 'png') alsBild(flaeche, hoehe);
    });

    /* --- Höhe ziehen ----------------------------------------------------- */
    griff.addEventListener('pointerdown', e => {
      e.preventDefault();
      const start = e.clientY, h0 = flaeche.getBoundingClientRect().height;
      const zug = (ev: any) => {
        const h = Math.max(180, Math.min(1200, h0 + ev.clientY - start));
        flaeche.style.height = h + 'px';
        flaeche.setAttribute('height', String(h));
      };
      const stop = () => {
        removeEventListener('pointermove', zug); removeEventListener('pointerup', stop);
        Store.updateBlock(block.id, { hoehe: Math.round(flaeche.getBoundingClientRect().height) });
      };
      addEventListener('pointermove', zug); addEventListener('pointerup', stop);
    });

    /* Erst wenn der Kasten wirklich Breite hat, stimmt der Ausschnitt.
       Vorher zeichnet `male()` mit der Ersatzbreite — sichtbar wäre das als
       falscher Massstab beim allerersten Bild. */
    if (typeof ResizeObserver === 'function') {
      let letzte = '';
      new ResizeObserver(() => {
        /* BEIDE MASSE, nicht nur die Breite: der Höhengriff verändert nur
           die Höhe, und mit einer nur auf Breite wachenden Prüfung behielt
           der Ausschnitt danach seine alte Höhe — sichtbar als gestauchtes
           oder gedehntes Bild. */
        const kasten = flaeche.getBoundingClientRect();
        const masse = Math.round(kasten.width) + '×' + Math.round(kasten.height);
        if (masse === letzte) return;
        letzte = masse;
        male();
      }).observe(w);
    }

    male();
    return w;
  };

  /** SVG als PNG herunterladen — ohne fremde Pakete. */
  const alsBild = (svgEl: any, hoehe: number) => {
    const kopie = svgEl.cloneNode(true);
    const breite = Math.round(svgEl.getBoundingClientRect().width);
    kopie.setAttribute('width', breite);
    kopie.setAttribute('height', hoehe);
    kopie.setAttribute('xmlns', NS);
    const quelle = new XMLSerializer().serializeToString(kopie);
    const bild = new Image();
    bild.onload = () => {
      const c = document.createElement('canvas');
      c.width = breite * 2; c.height = hoehe * 2;
      const g = c.getContext('2d');
      if (!g) return;
      g.fillStyle = getComputedStyle(document.body).getPropertyValue('--bg') || '#fff';
      g.fillRect(0, 0, c.width, c.height);
      g.scale(2, 2);
      g.drawImage(bild, 0, 0);
      const a = document.createElement('a');
      a.href = c.toDataURL('image/png');
      a.download = 'whiteboard.png';
      a.click();
      UI.toast('Als PNG gespeichert');
    };
    bild.onerror = () => UI.toast('Das Bild liess sich nicht erzeugen');
    bild.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(quelle)));
  };

  /* ========================================================================
   * 2. DIAGRAMM
   * ------------------------------------------------------------------------
   * Datenquelle: entweder eingetippte Zeilen „Name: Wert" oder eine
   * Datenbank auf derselben Seite.
   * ======================================================================*/
  const CHART_TYPEN = [['bar', 'Balken'], ['column', 'Säulen'], ['line', 'Linie'], ['donut', 'Ring'],
                       ['area', 'Fläche'], ['kpi', 'Kennzahl']];

  const diagramm = (block: any) => {
    const w = document.createElement('div');
    w.className = 'chart';

    const typ = block.chartTyp || 'bar';
    const werte = chartDaten(block);

    w.innerHTML =
      '<div class="chart-head">' +
        `<input class="chart-titel" value="${esc(block.text || '')}" placeholder="Titel des Diagramms">` +
        '<div class="chart-typen">' +
          CHART_TYPEN.map(([id, n]) =>
            `<button data-ct="${id}"${id === typ ? ' class="on"' : ''}>${n}</button>`).join('') +
        '</div>' +
        '<button class="chart-daten" title="Daten bearbeiten">✎ Daten</button>' +
      '</div>';

    const flaeche = document.createElement('div');
    flaeche.className = 'chart-flaeche';
    w.appendChild(flaeche);

    if (!werte.length) {
      flaeche.innerHTML = '<div class="chart-leer">Noch keine Daten. Klicke auf <b>✎ Daten</b> ' +
                          'und schreibe Zeilen wie <code>Montag: 12</code>.</div>';
    } else {
      flaeche.appendChild(chartSvg(typ, werte));
      const legende = document.createElement('div');
      legende.className = 'chart-legende';
      legende.innerHTML = werte.map((v: any, i: number) =>
        `<span><i style="background:${PALETTE[i % PALETTE.length]}"></i>${esc(v.name)} ` +
        `<b>${Formula.anzeige(v.wert)}</b></span>`).join('');
      w.appendChild(legende);
    }

    w.querySelector('.chart-titel')?.addEventListener('input', e => {
      const feld = e.target;
      if (feld instanceof HTMLInputElement) Store.updateBlock(block.id, { text: feld.value });
    });

    w.querySelector('.chart-head')?.addEventListener('click', e => {
      const t = elVon(e)?.closest<HTMLElement>('[data-ct]');
      if (t) { Store.updateBlock(block.id, { chartTyp: t.dataset.ct }); App.zeichneSeite(); return; }
      if (elVon(e)?.closest<HTMLElement>('.chart-daten')) datenEditor(block);
    });

    return w;
  };

  const chartDaten = (block: any) => {
    /* Aus einer Datenbank? */
    if (block.quelleDb) {
      const c = Store.getCollection(block.quelleDb);
      if (c) {
        const gruppe = block.gruppeNach, mess = block.messen;
        const zeilen = Store.rowsOf(c.id);
        if (gruppe) {
          const map = new Map();
          zeilen.forEach((r: any) => {
            const k = Formula.anzeige(Datenbank.wert(r, gruppe, c)) || '(leer)';
            const v = mess ? Formula.zahl(Datenbank.wert(r, mess, c)) : 1;
            map.set(k, (map.get(k) || 0) + v);
          });
          return [...map.entries()].map(([name, wert]) => ({ name, wert }));
        }
      }
    }
    /* Aus dem Text */
    return String(block.daten || '').split('\n')
      .map(z => z.trim()).filter(Boolean)
      .map(z => {
        const m = z.match(/^(.*?)[:;,\t]\s*(-?[\d.,]+)\s*$/);
        return m ? { name: (m[1] ?? '').trim(),
                     wert: parseFloat((m[2] ?? '0').replace(',', '.')) || 0 } : null;
      })
      .filter(Boolean);
  };

  const chartSvg = (typ: string, werte: any) => {
    const B = 640, H = 260, pad = 34;

    /* Kennzahl: eine grosse Zahl mit Vergleich — Notions „Number" */
    if (typ === 'kpi') {
      const summe = werte.reduce((a: any, v: any) => a + v.wert, 0);
      const letzter = werte[werte.length - 1]?.wert ?? 0;
      const vorletzter = werte[werte.length - 2]?.wert ?? 0;
      const diff = vorletzter ? Math.round((letzter - vorletzter) / Math.abs(vorletzter) * 100) : 0;
      const s2 = sv('svg', { viewBox: `0 0 ${B} ${H}`, class: 'chart-svg' });
      const t1 = sv('text', { x: B / 2, y: 118, 'text-anchor': 'middle', 'font-size': 64,
                              'font-weight': 700, fill: 'currentColor' });
      t1.textContent = Formula.anzeige(summe);
      s2.appendChild(t1);
      const t2 = sv('text', { x: B / 2, y: 152, 'text-anchor': 'middle', 'font-size': 15,
                              fill: 'currentColor', opacity: .6 });
      t2.textContent = 'Summe aus ' + werte.length + (werte.length === 1 ? ' Wert' : ' Werten');
      s2.appendChild(t2);
      if (werte.length > 1) {
        const t3 = sv('text', { x: B / 2, y: 186, 'text-anchor': 'middle', 'font-size': 16,
                                fill: diff >= 0 ? '#4dab9a' : '#ff7369' });
        t3.textContent = (diff >= 0 ? '▲ +' : '▼ ') + diff + ' % gegenüber davor';
        s2.appendChild(t3);
      }
      return s2;
    }

    const max = Math.max(...werte.map((v: any) => v.wert), 1);
    const s = sv('svg', { viewBox: `0 0 ${B} ${H}`, class: 'chart-svg', preserveAspectRatio: 'xMidYMid meet' });

    if (typ === 'donut') {
      const summe = werte.reduce((a: any, v: any) => a + v.wert, 0) || 1;
      let winkel = -Math.PI / 2;
      const cx = B / 2, cy = H / 2, ra = 100, ri = 58;
      werte.forEach((v: any, i: any) => {
        const teil = v.wert / summe * Math.PI * 2;
        const gross = teil > Math.PI ? 1 : 0;
        const x1 = cx + Math.cos(winkel) * ra, y1 = cy + Math.sin(winkel) * ra;
        const x2 = cx + Math.cos(winkel + teil) * ra, y2 = cy + Math.sin(winkel + teil) * ra;
        const x3 = cx + Math.cos(winkel + teil) * ri, y3 = cy + Math.sin(winkel + teil) * ri;
        const x4 = cx + Math.cos(winkel) * ri, y4 = cy + Math.sin(winkel) * ri;
        const st = sv('path', {
          d: `M${x1} ${y1} A${ra} ${ra} 0 ${gross} 1 ${x2} ${y2} L${x3} ${y3} A${ri} ${ri} 0 ${gross} 0 ${x4} ${y4} Z`,
          fill: PALETTE[i % PALETTE.length], class: 'ch-teil'
        });
        st.dataset.i = i;
        st.appendChild(sv('title')).textContent = v.name + ': ' + Formula.anzeige(v.wert);
        s.appendChild(st);
        winkel += teil;
      });
      const t = sv('text', { x: cx, y: cy + 6, 'text-anchor': 'middle', 'font-size': 20, fill: 'currentColor' });
      t.textContent = Formula.anzeige(werte.reduce((a: any, v: any) => a + v.wert, 0));
      s.appendChild(t);
      return s;
    }

    /* Achsen */
    for (let i = 0; i <= 4; i++) {
      const y = pad + (H - pad * 2) * i / 4;
      s.appendChild(sv('line', { x1: pad, y1: y, x2: B - 8, y2: y, stroke: 'currentColor', opacity: .13 }));
      const t = sv('text', { x: pad - 6, y: y + 4, 'text-anchor': 'end', 'font-size': 10, fill: 'currentColor', opacity: .55 });
      t.textContent = String(Math.round(max * (1 - i / 4)));
      s.appendChild(t);
    }

    const n = werte.length;
    const feld = (B - pad - 12) / n;

    if (typ === 'line' || typ === 'area') {
      const punkte = werte.map((v: any, i: any) => [
        pad + feld * (i + 0.5),
        pad + (H - pad * 2) * (1 - v.wert / max)
      ]);
      if (typ === 'area') {
        s.appendChild(sv('path', {
          d: `M${punkte[0][0]} ${H - pad} L` + punkte.map((p: any) => p.join(' ')).join(' L') +
             ` L${punkte[n - 1][0]} ${H - pad} Z`,
          fill: PALETTE[0], opacity: .22
        }));
      }
      s.appendChild(sv('path', {
        d: 'M' + punkte.map((p: any) => p.join(' ')).join(' L'),
        stroke: PALETTE[0], 'stroke-width': 2.5, fill: 'none', 'stroke-linejoin': 'round'
      }));
      punkte.forEach((p: any, i: any) => {
        const c = sv('circle', { cx: p[0], cy: p[1], r: 4, fill: PALETTE[0], class: 'ch-teil' });
        c.dataset.i = i;
        c.appendChild(sv('title')).textContent = werte[i].name + ': ' + Formula.anzeige(werte[i].wert);
        s.appendChild(c);
      });
    } else {
      werte.forEach((v: any, i: any) => {
        const h = (H - pad * 2) * (v.wert / max);
        if (typ === 'bar' || typ === 'column') {
          const rc = sv('rect', {
            x: pad + feld * i + feld * 0.16, y: H - pad - h,
            width: feld * 0.68, height: Math.max(1, h),
            fill: PALETTE[i % PALETTE.length], rx: 3, class: 'ch-teil'
          });
          rc.dataset.i = i;
          rc.appendChild(sv('title')).textContent = v.name + ': ' + Formula.anzeige(v.wert);
          s.appendChild(rc);
          /* Der Wert über dem Balken — Notion zeigt ihn nur beim Überfahren. */
          const wt = sv('text', { x: pad + feld * i + feld * 0.5, y: Math.max(12, H - pad - h - 5),
                                  'text-anchor': 'middle', 'font-size': 10.5,
                                  fill: 'currentColor', opacity: .75 });
          wt.textContent = Formula.anzeige(v.wert);
          s.appendChild(wt);
        }
      });
    }

    /* Beschriftung unten */
    werte.forEach((v: any, i: any) => {
      const t = sv('text', {
        x: pad + feld * (i + 0.5), y: H - pad + 15, 'text-anchor': 'middle',
        'font-size': 10.5, fill: 'currentColor', opacity: .7
      });
      t.textContent = String(v.name).slice(0, 12);
      s.appendChild(t);
    });
    return s;
  };

  const datenEditor = (block: any) => {
    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML =
      '<div class="finder" style="width:min(560px,94vw)">' +
        '<div class="fh">Daten des Diagramms</div>' +
        '<div style="padding:14px 18px">' +
          '<textarea id="cd" rows="10" style="width:100%; background:var(--bg-input); border:1px solid var(--line);' +
          'border-radius:8px; padding:10px 12px; outline:none; font:13.5px var(--mono); resize:vertical">' +
          esc(block.daten || 'Montag: 12\nDienstag: 18\nMittwoch: 9') + '</textarea>' +
          '<div style="margin-top:10px; font-size:12.5px; color:var(--text-dim)">' +
          'Eine Zeile je Wert: <code>Name: Zahl</code></div>' +
        '</div>' +
        '<div class="fbtns"><button data-a="ok" class="prim">Übernehmen</button>' +
        '<button data-a="zu">Abbrechen</button></div>' +
      '</div>';
    document.body.appendChild(o);
    const ta = o.querySelector<HTMLTextAreaElement>('#cd');
    ta?.focus();
    o.addEventListener('click', e => {
      if (elVon(e)?.closest<HTMLElement>('[data-a="ok"]')) {
        if (ta) Store.updateBlock(block.id, { daten: ta.value });
        o.remove(); App.zeichneSeite();
      } else if (elVon(e)?.closest<HTMLElement>('[data-a="zu"]') || e.target === o) o.remove();
    });
  };

  /* ========================================================================
   * 3. EINFACHE TABELLE  (Notions „Simple table" — ohne Datenbank)
   * ======================================================================*/
  const tabelle = (block: any) => {
    const rows = block.rows && block.rows.length ? block.rows : [['', '', ''], ['', '', ''], ['', '', '']];
    const kopf = block.kopfZeile !== false;
    const kopfSpalte = !!block.kopfSpalte;

    const w = document.createElement('div');
    w.className = 'stab-wrap';

    const t = document.createElement('table');
    t.className = 'stab' + (kopf ? ' kopf' : '') + (kopfSpalte ? ' kopfspalte' : '');

    rows.forEach((zeile: any, y: any) => {
      const tr = document.createElement('tr');
      zeile.forEach((zelle: any, x: any) => {
        const td = document.createElement(kopf && y === 0 ? 'th' : 'td');
        td.contentEditable = 'true';
        td.spellcheck = false;
        td.innerHTML = Blocks.inline(zelle || '');
        td.dataset.x = x; td.dataset.y = y;
        td.addEventListener('input', () => {
          rows[y][x] = td.textContent;
          Store.updateBlock(block.id, { rows });
        });
        td.addEventListener('keydown', e => {
          if (e.key === 'Tab') {
            e.preventDefault();
            const naechste = t.querySelectorAll<HTMLElement>('td,th');
            const i = [...naechste].indexOf(td);
            const z = naechste[i + (e.shiftKey ? -1 : 1)];
            if (z) { z.focus(); document.execCommand?.('selectAll', false); }
          }
        });
        tr.appendChild(td);
      });
      t.appendChild(tr);
    });
    w.appendChild(t);

    /* --- Griffe über den Spalten und neben den Zeilen -------------------- */
    /* Genau wie in Notion: beim Überfahren erscheinen zwei kleine Griffe.
       Ein Klick öffnet das Menü für diese Spalte oder diese Zeile. */
    const gX = document.createElement('div'); gX.className = 'stab-griff x';
    const gY = document.createElement('div'); gY.className = 'stab-griff y';
    w.append(gX, gY);
    let aktivX = 0, aktivY = 0;

    t.addEventListener('mouseover', (e) => {
      const zelle = elVon(e)?.closest<HTMLElement>('td,th');
      if (!zelle) return;
      aktivX = Number(zelle.dataset.x); aktivY = Number(zelle.dataset.y);
      const rz = zelle.getBoundingClientRect();
      const rw = w.getBoundingClientRect();
      gX.style.left = (rz.left - rw.left) + 'px';
      gX.style.width = rz.width + 'px';
      gX.style.top = '2px';
      gY.style.top = (rz.top - rw.top) + 'px';
      gY.style.height = rz.height + 'px';
      gY.style.left = '2px';
      gX.classList.add('da'); gY.classList.add('da');
    });
    w.addEventListener('mouseleave', () => { gX.classList.remove('da'); gY.classList.remove('da'); });

    const sichern = () => { Store.updateBlock(block.id, { rows }); App.zeichneSeite(); };

    gX.addEventListener('click', () => {
      const r = gX.getBoundingClientRect();
      const m = UI.menu(
        `<div class="grp">Spalte ${aktivX + 1}</div>` +
        '<button data-a="links"><span class="mi">←</span>Spalte links einfügen</button>' +
        '<button data-a="rechts"><span class="mi">→</span>Spalte rechts einfügen</button>' +
        '<button data-a="vor"><span class="mi">⇤</span>Nach links schieben</button>' +
        '<button data-a="zurueck"><span class="mi">⇥</span>Nach rechts schieben</button>' +
        `<button data-a="kopfsp"><span class="mi">▤</span>Als Kopfspalte<span class="ms">${kopfSpalte ? 'an' : 'aus'}</span></button>` +
        '<button data-a="leeren"><span class="mi">␀</span>Inhalt leeren</button>' +
        '<hr><button data-a="weg"><span class="mi">🗑</span>Spalte löschen</button>',
        r.left, r.bottom + 6);
      m.addEventListener('click', e => {
        const b = elVon(e)?.closest<HTMLElement>('button[data-a]');
        if (!b) return;
        const a = b.dataset.a; m.remove();
        if (a === 'links')  rows.forEach((z: any) => z.splice(aktivX, 0, ''));
        if (a === 'rechts') rows.forEach((z: any) => z.splice(aktivX + 1, 0, ''));
        if (a === 'weg' && rows[0].length > 1) rows.forEach((z: any) => z.splice(aktivX, 1));
        if (a === 'leeren') rows.forEach((z: any) => z[aktivX] = '');
        if (a === 'vor' && aktivX > 0)
          rows.forEach((z: any) => z.splice(aktivX - 1, 0, z.splice(aktivX, 1)[0]));
        if (a === 'zurueck' && aktivX < rows[0].length - 1)
          rows.forEach((z: any) => z.splice(aktivX + 1, 0, z.splice(aktivX, 1)[0]));
        if (a === 'kopfsp') { Store.updateBlock(block.id, { kopfSpalte: !kopfSpalte }); App.zeichneSeite(); return; }
        sichern();
      });
    });

    gY.addEventListener('click', () => {
      const r = gY.getBoundingClientRect();
      const m = UI.menu(
        `<div class="grp">Zeile ${aktivY + 1}</div>` +
        '<button data-a="oben"><span class="mi">↑</span>Zeile darüber einfügen</button>' +
        '<button data-a="unten"><span class="mi">↓</span>Zeile darunter einfügen</button>' +
        '<button data-a="hoch"><span class="mi">⇧</span>Nach oben schieben</button>' +
        '<button data-a="runter"><span class="mi">⇩</span>Nach unten schieben</button>' +
        `<button data-a="kopf"><span class="mi">▥</span>Als Kopfzeile<span class="ms">${kopf ? 'an' : 'aus'}</span></button>` +
        '<button data-a="dup"><span class="mi">⧉</span>Zeile duplizieren</button>' +
        '<button data-a="leeren"><span class="mi">␀</span>Inhalt leeren</button>' +
        '<hr><button data-a="weg"><span class="mi">🗑</span>Zeile löschen</button>',
        r.right + 6, r.top);
      m.addEventListener('click', e => {
        const b = elVon(e)?.closest<HTMLElement>('button[data-a]');
        if (!b) return;
        const a = b.dataset.a; m.remove();
        const leer = () => new Array(rows[0].length).fill('');
        if (a === 'oben')   rows.splice(aktivY, 0, leer());
        if (a === 'unten')  rows.splice(aktivY + 1, 0, leer());
        if (a === 'weg' && rows.length > 1) rows.splice(aktivY, 1);
        if (a === 'dup')    rows.splice(aktivY + 1, 0, rows[aktivY].slice());
        if (a === 'leeren') rows[aktivY] = leer();
        if (a === 'hoch' && aktivY > 0)
          rows.splice(aktivY - 1, 0, rows.splice(aktivY, 1)[0]);
        if (a === 'runter' && aktivY < rows.length - 1)
          rows.splice(aktivY + 1, 0, rows.splice(aktivY, 1)[0]);
        if (a === 'kopf') { Store.updateBlock(block.id, { kopfZeile: !kopf }); App.zeichneSeite(); return; }
        sichern();
      });
    });

    /* Rechtsklick in einer Zelle öffnet dasselbe Menü */
    t.addEventListener('contextmenu', (e) => {
      const zelle = elVon(e)?.closest<HTMLElement>('td,th');
      if (!zelle) return;
      e.preventDefault();
      aktivX = Number(zelle.dataset.x); aktivY = Number(zelle.dataset.y);
      gY.click();
    });

    const werkzeuge = document.createElement('div');
    werkzeuge.className = 'stab-tools';
    werkzeuge.innerHTML =
      '<button data-a="sp+">Spalte +</button><button data-a="sp-">Spalte −</button>' +
      '<button data-a="ze+">Zeile +</button><button data-a="ze-">Zeile −</button>' +
      `<button data-a="kopf" class="${kopf ? 'on' : ''}">Kopfzeile</button>` +
      `<button data-a="kopfsp" class="${kopfSpalte ? 'on' : ''}">Kopfspalte</button>` +
      '<button data-a="csv">Als CSV</button>';
    werkzeuge.addEventListener('click', e => {
      const b = elVon(e)?.closest<HTMLElement>('[data-a]');
      if (!b) return;
      const a = b.dataset.a;
      if (a === 'sp+') rows.forEach((z: any) => z.push(''));
      if (a === 'sp-' && rows[0].length > 1) rows.forEach((z: any) => z.pop());
      if (a === 'ze+') rows.push(new Array(rows[0].length).fill(''));
      if (a === 'ze-' && rows.length > 1) rows.pop();
      if (a === 'kopf')   { Store.updateBlock(block.id, { kopfZeile: !kopf }); App.zeichneSeite(); return; }
      if (a === 'kopfsp') { Store.updateBlock(block.id, { kopfSpalte: !kopfSpalte }); App.zeichneSeite(); return; }
      if (a === 'csv') {
        const csv = rows.map((z: any) => z.map((c: any) => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\n');
        const l = document.createElement('a');
        l.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
        l.download = 'tabelle.csv'; l.click();
        UI.toast('Tabelle als CSV gespeichert');
        return;
      }
      Store.updateBlock(block.id, { rows });
      App.zeichneSeite();
    });
    w.appendChild(werkzeuge);
    return w;
  };

  /* ========================================================================
   * 4. MATHEMATIK
   * ------------------------------------------------------------------------
   * Ein kleiner LaTeX-Übersetzer. Deckt ab, was in Notizen wirklich
   * vorkommt: Brüche, Wurzeln, Hoch/Tief, Summen, griechische Buchstaben.
   * ======================================================================*/
  const GRIECHISCH = {
    alpha:'α', beta:'β', gamma:'γ', delta:'δ', epsilon:'ε', zeta:'ζ', eta:'η', theta:'θ',
    iota:'ι', kappa:'κ', lambda:'λ', mu:'μ', nu:'ν', xi:'ξ', pi:'π', rho:'ρ', sigma:'σ',
    tau:'τ', phi:'φ', chi:'χ', psi:'ψ', omega:'ω',
    Gamma:'Γ', Delta:'Δ', Theta:'Θ', Lambda:'Λ', Xi:'Ξ', Pi:'Π', Sigma:'Σ', Phi:'Φ', Psi:'Ψ', Omega:'Ω'
  };
  const ZEICHEN = {
    times:'×', div:'÷', pm:'±', mp:'∓', cdot:'·', leq:'≤', geq:'≥', neq:'≠', approx:'≈',
    equiv:'≡', propto:'∝', infty:'∞', partial:'∂', nabla:'∇', forall:'∀', exists:'∃',
    in:'∈', notin:'∉', subset:'⊂', supset:'⊃', cup:'∪', cap:'∩', emptyset:'∅',
    rightarrow:'→', leftarrow:'←', Rightarrow:'⇒', Leftarrow:'⇐', leftrightarrow:'↔',
    sum:'∑', prod:'∏', int:'∫', iint:'∬', oint:'∮', sqrt:'√', angle:'∠', deg:'°',
    ldots:'…', cdots:'⋯', therefore:'∴', because:'∵', ne:'≠', le:'≤', ge:'≥'
  };

  const mathe = (roh: any) => {
    let s = esc(roh || '');

    /* \frac{a}{b} */
    for (let i = 0; i < 4; i++) {
      s = s.replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g,
        '<span class="mfrac"><span class="mz">$1</span><span class="mn">$2</span></span>');
    }
    /* \sqrt{a} und \sqrt[n]{a} */
    s = s.replace(/\\sqrt\[([^\]]*)\]\{([^{}]*)\}/g, '<sup class="mw">$1</sup>√<span class="munter">$2</span>');
    s = s.replace(/\\sqrt\{([^{}]*)\}/g, '√<span class="munter">$1</span>');
    /* \text{…} */
    s = s.replace(/\\(?:text|mathrm)\{([^{}]*)\}/g, '<span class="mtext">$1</span>');
    /* Hoch und tief */
    s = s.replace(/\^\{([^{}]*)\}/g, '<sup>$1</sup>').replace(/\^(\w)/g, '<sup>$1</sup>');
    s = s.replace(/_\{([^{}]*)\}/g, '<sub>$1</sub>').replace(/_(\w)/g, '<sub>$1</sub>');
    /* Befehle */
    s = s.replace(/\\([A-Za-z]+)/g, (_, name: string) =>
      (GRIECHISCH as Record<string, string>)[name] ||
      (ZEICHEN as Record<string, string>)[name] ||
      ('<span class="mop">' + name + '</span>'));
    /* Reste */
    s = s.replace(/[{}]/g, '');
    return '<span class="mathe">' + s + '</span>';
  };

  /** Der Formelblock: zeigt gerendert, beim Klick erscheint die Quelle. */
  const formelBlock = (block: any) => {
    const w = document.createElement('div');
    w.className = 'eq';

    const anzeige = document.createElement('div');
    anzeige.className = 'eq-out';
    anzeige.innerHTML = block.text ? mathe(block.text)
      : '<span style="color:var(--text-faint); font-size:14px">Formel eintippen — z. B. E = mc^2 oder \\frac{a}{b}</span>';

    const quelle = document.createElement('textarea');
    quelle.className = 'eq-src';
    quelle.value = block.text || '';
    quelle.rows = 2;
    quelle.spellcheck = false;
    quelle.style.display = 'none';
    quelle.placeholder = '\\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}';

    anzeige.addEventListener('click', () => {
      anzeige.style.display = 'none';
      quelle.style.display = '';
      quelle.focus();
    });
    const zurueck = () => {
      Store.updateBlock(block.id, { text: quelle.value });
      anzeige.innerHTML = quelle.value ? mathe(quelle.value)
        : '<span style="color:var(--text-faint); font-size:14px">Formel eintippen …</span>';
      quelle.style.display = 'none';
      anzeige.style.display = '';
    };
    quelle.addEventListener('blur', zurueck);
    quelle.addEventListener('input', () => Store.updateBlock(block.id, { text: quelle.value }));
    quelle.addEventListener('keydown', e => { if (e.key === 'Escape') zurueck(); });

    w.appendChild(anzeige);
    w.appendChild(quelle);
    return w;
  };

  /* ========================================================================
   * 5. SYNTAX-EINFÄRBUNG FÜR CODEBLÖCKE
   * ------------------------------------------------------------------------
   * Kein fremdes Paket, sondern ein kleiner Zerleger: Kommentare, Texte,
   * Zahlen, Schlüsselwörter. Deckt die Sprachen ab, die in Notizen
   * wirklich vorkommen.
   * ======================================================================*/
  const SCHLUESSEL = {
    javascript: 'const let var function return if else for while do switch case break continue new class extends super this typeof instanceof await async try catch finally throw import export default null undefined true false',
    typescript: 'const let var function return if else for while interface type enum implements public private readonly await async class extends import export null undefined true false',
    python:     'def class return if elif else for while in not and or is None True False import from as with try except finally raise lambda yield global pass break continue',
    java:       'public private protected class interface extends implements return if else for while new static final void int double String boolean true false null import package try catch',
    'c++':      'int double float char void class struct public private return if else for while new delete const static template typename namespace using include true false nullptr',
    'c#':       'public private class interface var return if else foreach for while new static void string int bool true false null using namespace try catch',
    go:         'func package import return if else for range var const type struct interface go defer chan map nil true false',
    rust:       'fn let mut struct enum impl trait pub use mod match if else for while loop return Some None Ok Err true false',
    php:        'function class return if else foreach for while new public private echo print require include namespace use true false null',
    ruby:       'def class module return if elsif else unless while do end require attr_accessor true false nil yield',
    sql:        'select from where group by order having join left right inner outer on as insert into values update set delete create table alter drop index and or not null distinct limit',
    html:       '',
    css:        '',
    json:       'true false null',
    bash:       'if then else fi for while do done case esac function return export echo cd ls sudo apt npm git',
    yaml:       'true false null',
    markdown:   ''
  };

  const einfaerben = (code: any, sprache: any) => {
    const lang = String(sprache || '').toLowerCase().replace('plain text', '');
    const roh = esc(code);
    if (!lang || lang === 'markdown') return roh;

    if (lang === 'html' || lang === 'xml') {
      return roh
        .replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="c-kom">$1</span>')
        .replace(/(&lt;\/?)([a-zA-Z][\w-]*)/g, '$1<span class="c-schl">$2</span>')
        .replace(/([a-zA-Z-]+)=(&quot;[^&]*?&quot;|"[^"]*")/g,
                 '<span class="c-attr">$1</span>=<span class="c-txt">$2</span>');
    }
    if (lang === 'css' || lang === 'scss' || lang === 'less') {
      return roh
        .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="c-kom">$1</span>')
        .replace(/^([^{}\n]+)(\{)/gm, '<span class="c-schl">$1</span>$2')
        .replace(/([a-z-]+)(\s*:\s*)([^;\n]+)(;)/g,
                 '<span class="c-attr">$1</span>$2<span class="c-txt">$3</span>$4');
    }

    const woerter = ((SCHLUESSEL as Record<string, string>)[lang] || SCHLUESSEL.javascript)
      .split(' ').filter(Boolean);
    let out = roh;

    /* Erst Texte und Kommentare wegsichern, damit dort nichts eingefärbt wird */
    /* Der Platzhalter darf keine Ziffern enthalten — sonst färbt die
       Zahlen-Regel weiter unten den Platzhalter selbst ein und zerstört ihn.
       Deshalb steckt der Index in einem Zeichen aus dem privaten Bereich. */
    const sicher: any[] = [];
    const parke = (treffer: any, klasse: any) => {
      sicher.push('<span class="' + klasse + '">' + treffer + '</span>');
      return '\u0002' + String.fromCharCode(0xE000 + sicher.length - 1) + '\u0002';
    };

    out = out
      .replace(/(&quot;[^&]*?&quot;|'[^'\n]*'|`[^`]*`|"[^"\n]*")/g, m => parke(m, 'c-txt'))
      .replace(/(\/\/[^\n]*|#[^\n]*|--[^\n]*)/g, m => parke(m, 'c-kom'))
      .replace(/(\/\*[\s\S]*?\*\/|&quot;&quot;&quot;[\s\S]*?&quot;&quot;&quot;)/g, m => parke(m, 'c-kom'));

    if (woerter.length) {
      const re = new RegExp('\\b(' + woerter.join('|') + ')\\b', 'g');
      out = out.replace(re, '<span class="c-schl">$1</span>');
    }
    out = out.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="c-zahl">$1</span>');
    out = out.replace(/([a-zA-Z_][\w]*)(\()/g, '<span class="c-fkt">$1</span>$2');

    return out.replace(/\u0002([\uE000-\uF8FF])\u0002/g,
      (_, z) => sicher[z.charCodeAt(0) - 0xE000]);
  };

  return { whiteboard, diagramm, tabelle, mathe, formelBlock, chartSvg, chartDaten,
           einfaerben, SCHLUESSEL, PALETTE };
})();

(window as any).Zusatz = Zusatz;
