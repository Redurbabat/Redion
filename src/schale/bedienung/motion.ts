/* Redurs 15 Vorlagen: lokale Dekoration, keine gespeicherten Werte. */
type MotionEffectId = 'folder' | 'sliders' | 'light' | 'gradient' | 'letters' |
  'liquid' | 'toggle' | 'carousel' | 'glass' | 'metric' | 'status' | 'ticket' |
  'orb' | 'filament' | 'transport';

const RedionMotion = (() => {
  const metricSelector = '.stat-karte.lw-metrik > strong, .rmo-health-metric > strong';
  const effects: ReadonlyArray<{ id: MotionEffectId; place: string; selector: string }> = [
    { id: 'folder', place: 'Bibliotheksordner', selector: '.bib-deckel[data-art="ordner"]' },
    { id: 'sliders', place: 'Einstellungen, KI-Quellen, Datenbankfilter', selector: '#btn-settings, [data-k="einstellungen"], #ai-quellen, button[data-a="filter"]' },
    { id: 'light', place: 'Elektro, Lernen, Bestandsübersicht', selector: '.els-kachel, .stat-karte.lw-metrik, .pf-karte' },
    { id: 'gradient', place: 'PDF öffnen, Neue Seite, KI senden', selector: '[data-studio-import], #btn-neu-handy, #ai-senden, [data-rmo-new]' },
    { id: 'letters', place: 'KI-Werkzeuge, Befehle und vier Lernaktionen', selector: '.ru-funkel, .ai-action-group button, .lw-study-actions article:not(.lw-trainer-kachel)>button' },
    { id: 'liquid', place: 'KI-, Agenten-, Import- und Exportaufträge', selector: '.ki-aktivitaet, .ru-zustand, .ru-zk, .ru-lader, .ru-drucker, [data-studio-import], .ag-motion-status' },
    { id: 'toggle', place: 'Einstellungen und Automationen', selector: '.schalter, .mschalter' },
    { id: 'carousel', place: 'Zuletzt geöffnete Dokumente, leeres Regal', selector: '.rmo-recent, .bib-leer' },
    { id: 'glass', place: 'Primäre Dialogaktionen', selector: '.fbtns button.prim' },
    { id: 'metric', place: 'Lernfortschritt und Bestandsgesundheit: Zahl, Ring und Herz', selector: metricSelector + ', .stat-karte.lw-metrik, .rmo-health-metric' },
    { id: 'status', place: 'Synchronisierung, Sicherung, KI, Automationen', selector: '.ru-zustand, .ru-lader, .ki-aktivitaet, .ag-motion-status, .rmo-product-status' },
    { id: 'ticket', place: 'PDF-Druck und Export', selector: '.ru-drucker' },
    { id: 'orb', place: 'KI-Schaltfläche und Kopfzeile', selector: '#btn-ai, #ai .ai-head' },
    { id: 'filament', place: 'Strom im Elektro-Schaltplan', selector: '.sp-start' },
    { id: 'transport', place: 'Zeitmesser Start/Pause/Beenden', selector: '.rmo-transport' }
  ];
  const selector = effects.map(effect => effect.selector).join(',');
  const watched = new WeakSet<Element>();
  let observer: MutationObserver | null = null;
  let visibility: IntersectionObserver | null = null;
  const set = (element: Element, name: string, value: string): void => {
    if (element.getAttribute(name) !== value) element.setAttribute(name, value);
  };
  const ornament = (name: string): HTMLSpanElement => {
    const element = document.createElement('span');
    element.className = name;
    element.setAttribute('aria-hidden', 'true');
    return element;
  };
  const ensure = (element: Element, name: string, build?: (node: HTMLSpanElement) => void): void => {
    if (element.querySelector(':scope > .' + name)) return;
    const node = ornament(name);
    build?.(node);
    element.prepend(node);
  };
  const prepareMetric = (element: Element): void => {
    const value = element.textContent || '';
    if (element.querySelector('.rmo-number-source')?.textContent === value) return;
    if (!/\d/.test(value) || !/^[\d.,’'%+\-−:/\s]+$/.test(value) || value.length > 18) {
      if (element.classList.contains('rmo-number')) element.classList.remove('rmo-number');
      return;
    }
    const source = document.createElement('span');
    source.className = 'rmo-number-source'; source.textContent = value;
    const reels = ornament('rmo-reels');
    for (const [index, character] of Array.from(value).entries()) {
      const digit = document.createElement('span');
      digit.className = /\d/.test(character) ? 'rmo-digit' : 'rmo-separator';
      digit.dataset['rmoCharacter'] = character;
      digit.style.setProperty('--rmo-digit', /\d/.test(character) ? character : '0');
      digit.style.setProperty('--rmo-delay', Math.min(index * 30, 180) + 'ms');
      reels.append(digit);
    }
    element.classList.add('rmo-number'); element.replaceChildren(source, reels);
  };
  const state = (element: Element): string => {
    const source = element.getAttribute('data-zustand');
    if (source) return source;
    if (element.matches('.ki-aktivitaet, [aria-busy="true"]')) return 'laeuft';
    if (element.matches('.schalter, .mschalter, .sp-start')) return element.classList.contains('an') ? 'an' : 'aus';
    return element.hasAttribute('disabled') ? 'inaktiv' : 'bereit';
  };
  const decorateElement = (element: Element): void => {
    const ids = effects.filter(effect => element.matches(effect.selector)).map(effect => effect.id);
    set(element, 'data-rmo', ids.join(' '));
    set(element, 'data-rmo-state', state(element));
    if (!watched.has(element)) {
      watched.add(element);
      set(element, 'data-rmo-visible', 'false');
      visibility?.observe(element);
    }
    if (ids.includes('metric') && element.matches(metricSelector)) prepareMetric(element);
    if (ids.includes('folder')) {
      const surface = element.querySelector('.bib-deckel-blatt');
      if (surface) ensure(surface, 'rmo-folder-stack', stack => {
        for (let index = 0; index < 5; index++) {
          const sheet = ornament('rmo-folder-sheet');
          sheet.style.setProperty('--rmo-index', String(index)); stack.append(sheet);
        }
      });
    }
    if (ids.includes('sliders')) ensure(element, 'rmo-sliders', sliders => {
      for (let index = 0; index < 3; index++) sliders.append(document.createElement('i'));
    });
    if (ids.includes('liquid')) ensure(element, 'rmo-liquid');
    if (ids.includes('orb')) ensure(element, 'rmo-orb');
    if (ids.includes('ticket')) {
      if (!element.classList.contains('rmo-ticket')) element.classList.add('rmo-ticket');
      ensure(element, 'rmo-ticket-heading', heading => { heading.textContent = 'PDF-Ausgabe'; });
      /* Nur die Bildbühne wenden. Der echte Status bleibt außerhalb und
         wird während der Drehung unverändert vorgelesen. */
      const stage = element.querySelector('.ru-drucker-buehne');
      if (stage && !element.querySelector('.rmo-ticket-turn')) {
        const turn = ornament('rmo-ticket-turn');
        const back = ornament('rmo-ticket-back');
        const mark = ornament('rmo-ticket-mark');
        const result = ornament('rmo-ticket-result');
        back.append(mark, result);
        stage.replaceWith(turn);
        turn.append(stage, back);
      }
      const result = element.querySelector('.rmo-ticket-result');
      const label = element.querySelector('.ru-drucker-text')?.textContent || '';
      if (result && result.textContent !== label) result.textContent = label;
    }
    /* ==================================================================
     * DER GLÜHFADEN UND DER KARTENRING — beide standen bisher nur in der
     * Tabelle (E529).
     *
     * `filament` und `carousel` waren als Wirkung angemeldet, aber NIEMAND
     * hat je ihr Markup gebaut: der Glühfaden war ein 13 × 6 px grosses
     * `::before`, und die Ring-CSS in `motion.css` hatte gar kein Element,
     * auf das sie zeigen konnte — toter Stil. Nachgesehen mit einer Suche
     * nach `ensure(` in dieser Datei: sechs Aufrufe, keiner für die beiden.
     * ================================================================== */
    if (ids.includes('filament')) ensure(element, 'rmo-filament', glas => {
      /* Zwei Drähte und eine Wendel dazwischen. Drei Elemente statt eines
         Bildes, damit der Faden die Schriftfarbe erben kann und in Hell
         wie Dunkel sitzt. */
      glas.append(ornament('rmo-filament-bein'), ornament('rmo-filament-wendel'),
                  ornament('rmo-filament-bein'));
    });
    if (ids.includes('carousel')) ensure(element, 'rmo-carousel', ring => {
      /* Fünf Karten auf einem Kreis. Die Zahl steht hier und nicht im Stil:
         der Winkel je Karte rechnet sich aus ihr, und eine sechste Karte
         wäre sonst eine stille Überlappung. */
      const anzahl = 5;
      ring.style.setProperty('--rmo-anzahl', String(anzahl));
      for (let index = 0; index < anzahl; index++) {
        const karte = ornament('rmo-ring-karte');
        karte.style.setProperty('--rmo-index', String(index));
        ring.append(karte);
      }
    });
    /* Der gezeichnete Ring aus der Statistik-Vorlage (2030–2710). Er rahmt
       die ECHTE Zahl und misst nichts — siehe den Grund in motion.css. */
    if (ids.includes('metric') && !element.matches(metricSelector)) {
      ensure(element, 'rmo-ring');
      ensure(element, 'rmo-heart');
    }
    /* ==================================================================
       Der Glaskörper aus Vorlagenblock 8. Er hat nicht gefehlt, er war
       ÜBERSTIMMT: `[data-rmo~="glass"]` (ein Attribut) verliert gegen
       `.fbtns button.prim:not(.ru-funkel)` (drei Klassen) — geschrieben,
       nie gesehen. Der Körper bekommt deshalb ein eigenes Element statt
       weiterer Pseudo-Ebenen am Knopf: `::after` gehört dort schon dem
       kreisenden Rand des Verlaufseffekts, und ein Knopf kann beide
       Effekte tragen.
       ================================================================== */
    if (ids.includes('glass')) ensure(element, 'rmo-glass', glas => {
      /* Kuppel (Licht von oben), Platte (der harte Glanz darüber),
         Saum (das Licht, das unten wieder austritt). */
      glas.append(ornament('rmo-glass-kuppel'), ornament('rmo-glass-platte'),
                  ornament('rmo-glass-saum'));
    });
    /* ---- Block 06 (E535) ---- */
    /* Block 6 — der Verlaufsschalter aus Redurs Vorlage, aber NUR am kleinen
       Menü-Umschalter `.mschalter` (schale.ts:232). Der grosse `.schalter` in
       den Einstellungen trägt dieselbe Wirkungs-ID und behält sein bisheriges
       Bild (motion.css:610–611) — er bekommt hier bewusst kein Markup. */
    if (ids.includes('toggle') && element.matches('.mschalter')) {
      ensure(element, 'rmo-verlauf', schicht => {
    /* Zwei gemischte Verlaufsebenen und der weichgezeichnete Lichtbalken.
       Sie liegen UNTER dem Griff, und `ensure` stellt voran — genau die
       richtige Reihenfolge. */
    schicht.append(ornament('rmo-verlauf-a'), ornament('rmo-verlauf-b'),
                   ornament('rmo-verlauf-licht'));
      });
      /* Beschriftung und Leuchtkugel gehören dagegen HINTER den bestehenden
     Griff `.mschalter > i`: was vorn im Baum steht, malt der Browser
     zuerst, und die Kugel ist ein ÜBERZUG des Griffs — vorangestellt wäre
     sie unsichtbar. Deshalb angehängt statt `ensure`; doppelt wird dabei
     nichts, weil beide Namen vorher geprüft werden. */
      for (const name of ['rmo-verlauf-text', 'rmo-verlauf-kugel']) {
    if (!element.querySelector(':scope > .' + name)) element.append(ornament(name));
      }
    }
    /* ---- Block 07 (E535) ---- */
    if (ids.includes('carousel')) {
      /* Block 7 — die Trommel unter der Bühne. `.rmo-carousel` wird zur
     beschneidenden Bühne (overflow:hidden), und ein Element, das
     beschneidet, wird vom Browser flach gemacht — der Ring braucht deshalb
     ein eigenes drehendes Kind. Die fünf Karten aus dem ensure-Aufruf oben
     ziehen EINMAL hinein; ein zweiter Durchlauf findet die Trommel und
     lässt alles stehen. */
      const stage = element.querySelector(':scope > .rmo-carousel');
      if (stage && !stage.querySelector(':scope > .rmo-ring-trommel')) {
    const drum = ornament('rmo-ring-trommel');
    for (const card of Array.from(stage.querySelectorAll(':scope > .rmo-ring-karte'))) drum.append(card);
    stage.append(drum);
      }
    }
    /* ---- Block 09 (E535) ---- */
    /* ==================================================================
     * BLOCK 9 — DER REST DER KENNZAHLKARTE (Vorlage 2030–2710, E535)
     * Ziffernrolle, Ring und Herz stehen seit E534. Hier kommen die drei
     * Schichten dazu, die nie ein Element hatten: der Lichtkranz, der
     * Diagrammstreifen und der Glanzfleck. Alle drei hängen an der KARTE,
     * nicht an der Zahl — die trägt schon Rolle und Ring.
     * Die Kippung setzt nur zwei Zahlen am Element; Winkel und Fleckmitte
     * rechnet der Stil daraus, und zwar nur unter (hover: hover).
     * ================================================================== */
    if (ids.includes('metric') && !element.matches(metricSelector) && element instanceof HTMLElement) {
      const card = element;
      /* Zwei Ebenen statt der fünf Kegelverläufe der Vorlage: der scharfe
         Rand im ::before, der weiche Schein im Kind (ein `filter` würde
         sonst beide verwaschen). */
      ensure(card, 'rmo-kranz', halo => { halo.append(ornament('rmo-kranz-schein')); });
      ensure(card, 'rmo-glanz');
      ensure(card, 'rmo-pfad', field => {
        const svgNs = 'http://www.w3.org/2000/svg';
        const chart = document.createElementNS(svgNs, 'svg');
        /* Der Streifen ist so breit wie die Karte und 30 px hoch; ohne
           Seitenverhältnis dehnt er sich mit. Damit die Striche dabei nicht
           mitgedehnt werden, hängt an jedem `vector-effect`. */
        chart.setAttribute('viewBox', '0 0 100 30');
        chart.setAttribute('preserveAspectRatio', 'none');
        chart.setAttribute('aria-hidden', 'true');
        chart.setAttribute('focusable', 'false');
        [8, 13, 6, 17, 11].forEach((height, index) => {
          const bar = document.createElementNS(svgNs, 'line');
          const x = String(10 + index * 20);
          bar.setAttribute('x1', x); bar.setAttribute('y1', '28');
          bar.setAttribute('x2', x); bar.setAttribute('y2', String(28 - height));
          bar.setAttribute('vector-effect', 'non-scaling-stroke');
          /* Staffelung wie in der Vorlage: 0,05 s je Linie. */
          bar.style.setProperty('--rmo-i', String(index));
          chart.append(bar);
        });
        /* Zwei Kurven, die zweite fünf Einheiten tiefer — der Schattenpfad
           der Vorlage (.path2). Der Versatz steht in den Daten und nicht in
           einem `transform`, weil reduzierte Bewegung `transform:none`
           setzt und beide Kurven dann übereinanderlägen. */
        ['M2 24 C 14 22, 20 9, 32 11 S 54 22, 66 15 S 86 4, 98 8',
         'M2 29 C 14 27, 20 14, 32 16 S 54 27, 66 20 S 86 9, 98 13'
        ].forEach((d, index) => {
          const curve = document.createElementNS(svgNs, 'path');
          curve.setAttribute('d', d);
          curve.setAttribute('vector-effect', 'non-scaling-stroke');
          curve.style.setProperty('--rmo-i', String(index));
          chart.append(curve);
        });
        field.append(chart);
      });
      /* Die Vorlage teilt die Karte in fünfzehn unsichtbare Hoverfelder.
         Fünfzehn Flächen über einer Karte, die schon Inhalt trägt, würden
         Klicks schlucken — der Zeiger meldet seine Stelle deshalb selbst.
         Einmal binden: `decorate` läuft bei jeder Änderung erneut. */
      if (!card.hasAttribute('data-rmo-kippung') && matchMedia('(hover: hover)').matches) {
        set(card, 'data-rmo-kippung', 'true');
        card.addEventListener('pointermove', event => {
          const box = card.getBoundingClientRect();
          if (!box.width || !box.height) return;
          /* Zahl ohne Einheit. Erst der Stil macht daraus Prozent (Fleck)
             und Grad (Kippung); ein fertiges „37%" liesse sich nicht in
             einen Winkel rechnen. */
          card.style.setProperty('--rmo-x', String(Math.round((event.clientX - box.left) / box.width * 100)));
          card.style.setProperty('--rmo-y', String(Math.round((event.clientY - box.top) / box.height * 100)));
        });
        card.addEventListener('pointerleave', () => {
          card.style.removeProperty('--rmo-x');
          card.style.removeProperty('--rmo-y');
        });
      }
    }
    /* ---- Block 10 (E535) ---- */
    /* ==================================================================
     * BLOCK 10 — DER REST DES TICKETS (Vorlage 2711–3469, E535)
     *
     * Die Wendekarte steht schon oben (E534), der Barcode in E531. Hier
     * kommen die Teile dazu, die eigenes Markup brauchen: Farbrad und
     * Körnung über der ganzen Karte, Würfel und QR in der Bühne, und die
     * Kopfzeile buchstabenweise.
     *
     * WO WAS HINGEHÖRT, und warum das nicht beliebig ist:
     *
     *   Karte  ← Farbrad, Körnung.  Sie liegen ÜBER allem und dürfen sich
     *            nicht mitdrehen: in der Wendekarte läge sonst auf der
     *            Rückseite ein spiegelverkehrtes Hologramm.
     *   Bühne  ← Würfel, QR.  Sie gehören zur Vorderseite und sollen beim
     *            Wenden mit ihr verschwinden — das erledigt das
     *            `backface-visibility: hidden` der Bühne von selbst.
     * ================================================================== */
    if (ids.includes('ticket')) {
      ensure(element, 'rmo-ticket-korn');
      ensure(element, 'rmo-ticket-holo');
      const buehne = element.querySelector('.ru-drucker-buehne');
      if (buehne) {
        ensure(buehne, 'rmo-ticket-wuerfel', wuerfel => {
          /* Sechs Flächen, kein Bild: die Lage jeder einzelnen steht im
             Stil, damit der Würfel seine Farbe erben kann. */
          for (let index = 0; index < 6; index++) wuerfel.append(ornament('rmo-ticket-flaeche'));
        });
        ensure(buehne, 'rmo-ticket-qr', code => {
          /* Drei Suchmarken wie bei einem echten Code — und trotzdem kein
             lesbarer: er zeigt auf nichts, weil ein Druckauftrag keine
             Adresse hat. Reine Zier, deshalb aria-hidden (ornament). */
          for (let index = 0; index < 3; index++) code.append(ornament('rmo-ticket-ecke'));
        });
      }
      /* Die Kopfzeile in Zeichen teilen — derselbe Weg wie bei 'letters'
         weiter unten, aber mit eigener Klasse: die Buchstabenregeln dort
         hängen an `[data-rmo~="letters"]`, und das Ticket trägt das nicht.
         Die Überschrift ist bereits aria-hidden, das Teilen ändert daran
         nichts: für Vorlesegeräte bleibt sie unsichtbar, der echte Status
         steht daneben in `.ru-drucker-status`.
         Beim zweiten Dekorieren findet die Schleife keinen Textknoten mehr
         (er ist dann ein Span) und tut nichts — test494 prüft genau das. */
      const kopf = element.querySelector(':scope > .rmo-ticket-heading');
      if (kopf) for (const node of Array.from(kopf.childNodes)) {
        if (node.nodeType !== Node.TEXT_NODE || !node.textContent?.trim()) continue;
        const wort = ornament('rmo-ticket-wort');
        Array.from(node.textContent).forEach((character, index) => {
          const letter = document.createElement('span');
          letter.className = 'rmo-ticket-letter'; letter.textContent = character;
          letter.style.setProperty('--rmo-i', String(index));
          wort.append(letter);
        });
        node.replaceWith(wort);
      }
    }
    /* ---- Block 11 (E535) ---- */
    /* ==================================================================
     * BLOCK 11 — DIE GLASKUGEL (Vorlage 3470–4157, E535)
     * Die Kugel hatte kein einziges Kind. Hier kommen hinein: drei
     * Wellenringe, die Farbpunkte, der Linienkranz, zwei Bögen als SVG, die
     * zweite Kugel und der Funke. Glaskarte und Fusszeile nur in der
     * Kopfzeile — am 44-px-Knopf #btn-ai wäre kein Platz dafür.
     * Die Kippung setzt zwei Variablen am Träger; gelesen werden sie nur
     * unter (hover: hover) — am Telefon bleibt die Kugel gerade.
     * ================================================================== */
    if (ids.includes('orb')) {
      const orb = element.querySelector(':scope > .rmo-orb');
      if (orb && !orb.querySelector(':scope > .rmo-orb-zwei')) {
        const svgNs = 'http://www.w3.org/2000/svg';
        const arcs = document.createElementNS(svgNs, 'svg');
        arcs.setAttribute('class', 'rmo-orb-pfade');
        arcs.setAttribute('viewBox', '0 0 24 24');
        arcs.setAttribute('aria-hidden', 'true');
        /* Zwei Halbkreise, r = 8: der obere und der untere Bogen. */
        for (const d of ['M4 14a8 8 0 0 1 16 0', 'M20 10a8 8 0 0 1-16 0']) {
          const path = document.createElementNS(svgNs, 'path');
          path.setAttribute('d', d);
          arcs.append(path);
        }
        const waves = [0, 1, 2].map(index => {
          const wave = ornament('rmo-orb-welle');
          wave.style.setProperty('--rmo-i', String(index));
          return wave;
        });
        orb.append(...waves, ornament('rmo-orb-punkte'), ornament('rmo-orb-kranz'), arcs,
                   ornament('rmo-orb-zwei'), ornament('rmo-orb-funke'));
        if (element.matches('#ai .ai-head')) orb.append(ornament('rmo-orb-fuss'));
      }
      /* Die Karte steht als Geschwister VOR der Kugel (ensure fügt vorne
         ein); der Stil schiebt sie per negativem Rand unter die Kugel. */
      if (element.matches('#ai .ai-head')) ensure(element, 'rmo-orb-karte');
      if (element instanceof HTMLElement && !element.hasAttribute('data-rmo-orb-kippung') &&
          matchMedia('(hover: hover)').matches) {
        const carrier = element;
        set(carrier, 'data-rmo-orb-kippung', 'true');
        carrier.addEventListener('pointermove', event => {
          const rect = carrier.getBoundingClientRect();
          if (!rect.width || !rect.height) return;
          const x = Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width - .5) * 2));
          const y = Math.max(-1, Math.min(1, ((event.clientY - rect.top) / rect.height - .5) * 2));
          carrier.style.setProperty('--rmo-ox', x.toFixed(2));
          carrier.style.setProperty('--rmo-oy', y.toFixed(2));
        });
        carrier.addEventListener('pointerleave', () => {
          carrier.style.removeProperty('--rmo-ox');
          carrier.style.removeProperty('--rmo-oy');
        });
      }
    }
    /* ---- Block 12 (E535) ---- */
    /* ==================================================================
     * DER HEBELSCHALTER AM GLÜHFADEN (Vorlage 4158–4795, E535)
     *
     * Die Lampe stand seit E529 da, der SCHALTER nicht: ein Glaskolben
     * hat nichts, was man werfen könnte. Die Vorlage zeigt einen
     * zweiteiligen Körper — Metallgehäuse links, Glasröhre rechts —, und
     * genau diese Reihenfolge entsteht hier von selbst: `ensure` setzt
     * jedes Teil VORNE ein, das Glas ist oben schon eingesetzt, also
     * landet das Gehäuse links davon.
     *
     * Der Aufruf für `rmo-filament` bleibt unangetastet. Die drei
     * Schichten im Glas werden nachgereicht, nicht in ihn hineingebaut:
     * wer ihn ersetzt, ersetzt auch den Grund, der dort steht.
     * ================================================================== */
    if (ids.includes('filament')) {
      /* Fassung, geworfener Arm, eingeprägtes 0/I, Schraubenkopf. */
      ensure(element, 'rmo-hebel', gehaeuse => {
        gehaeuse.append(ornament('rmo-hebel-arm'), ornament('rmo-hebel-zeichen'),
                        ornament('rmo-hebel-schraube'));
      });
      /* Der Lichtkegel blendet (color-dodge) über der Knopffläche. Er steht
         nicht im Fluss und verschiebt deshalb weder Text noch Trefferfläche. */
      ensure(element, 'rmo-hebel-kegel');
      /* Reflexwischer, Randlicht und Körnung gehören INS Glas — sonst
         wischt der Streifen über die Beschriftung statt über den Kolben. */
      const glas = element.querySelector(':scope > .rmo-filament');
      if (glas && !glas.querySelector(':scope > .rmo-filament-wischer')) {
        glas.append(ornament('rmo-filament-wischer'), ornament('rmo-filament-rand'),
                    ornament('rmo-filament-koernung'));
      }
    }
    /* ---- Block 13 (E535) ---- */
    /* ==================================================================
     * BLOCK 13 — DER MECHANISCHE DREIERBLOCK (Vorlage 4796–5397, E535)
     *
     * Die drei Zeitmessertasten hatten kein einziges Kind: keine Lampe,
     * kein Zeichen, keine Lichtschicht — die Vorlage lebt aber genau
     * davon. Jede Taste bekommt darum EINE Kappe mit allen Schichten
     * darin; das hält die Zahl der Knoten klein und die Reihenfolge
     * stabil. Die Wanne (Rauschen und Randglanz) liegt über allem.
     *
     * Nichts davon ist bedienbar: alle Teile sind aria-hidden (ornament)
     * und in `motion.css` ohne Zeigerfang. Die drei nativen Knöpfe und
     * ihre 44-px-Flächen bleiben unverändert (§37, test494 zählt sie).
     * ================================================================== */
    if (ids.includes('transport')) {
      const svgNs = 'http://www.w3.org/2000/svg';
      /* Rauschen und Rahmenreflex gehören der Wanne, nicht der Taste. */
      ensure(element, 'rmo-tr-wanne', wanne => {
        wanne.append(ornament('rmo-tr-rauschen'), ornament('rmo-tr-glanz'));
      });
      /* „Weiter" ist ein Start, kein Halt — die Taste zeigt dann das
         Dreieck. Der Zustand steht am Träger (zeitmesser.ts:202). */
      const angehalten = element.getAttribute('data-zustand') === 'pausiert';
      element.querySelectorAll<HTMLButtonElement>(':scope > button').forEach(taste => {
        /* `data-rmo-taste` ist der Haken für den Stil; `data-zm` ist der
           Befehl und hier nur die Rückfallebene. */
        const rolle = taste.getAttribute('data-rmo-taste') || taste.getAttribute('data-zm') || '';
        const figur = rolle === 'stopp' ? ['M9 9h6v6H9z']
          : rolle === 'pause' && !angehalten ? ['M10 8v8', 'M14 8v8']
            : ['M9.5 7.5 17 12l-7.5 4.5z'];
        ensure(taste, 'rmo-tr-kappe', kappe => {
          const zeichen = document.createElementNS(svgNs, 'svg');
          zeichen.setAttribute('class', 'rmo-tr-sym');
          zeichen.setAttribute('viewBox', '0 0 24 24');
          zeichen.setAttribute('aria-hidden', 'true');
          for (const d of figur) {
            const linie = document.createElementNS(svgNs, 'path');
            linie.setAttribute('d', d);
            zeichen.append(linie);
          }
          kappe.append(ornament('rmo-tr-reflex'), ornament('rmo-tr-wisch'),
                       ornament('rmo-tr-fleck'), zeichen, ornament('rmo-led'));
        });
      });
      /* Der Lichtfleck sitzt dort, wo der Finger aufsetzt. Ohne Zeiger
         (Tastatur) bleibt er mittig — der Stil hat dafür Vorgabewerte.
         Die Marke verhindert einen zweiten Horcher, wenn dieselbe Reihe
         noch einmal dekoriert wird; ein Zustandswechsel baut die Reihe
         ohnehin neu auf und bringt einen frischen Knoten mit. */
      if (!element.hasAttribute('data-rmo-tr-druck')) {
        set(element, 'data-rmo-tr-druck', '1');
        element.addEventListener('pointerdown', ereignis => {
          if (!(ereignis instanceof PointerEvent) || !(ereignis.target instanceof Element)) return;
          const taste = ereignis.target.closest('button');
          if (!taste) return;
          const feld = taste.getBoundingClientRect();
          if (!feld.width || !feld.height) return;
          taste.style.setProperty('--rmo-px', Math.round((ereignis.clientX - feld.left) / feld.width * 100) + '%');
          taste.style.setProperty('--rmo-py', Math.round((ereignis.clientY - feld.top) / feld.height * 100) + '%');
        });
      }
    }
    /* ---- Block 01 (E535) ---- */
    /* Block 1 — das Dateizeichen auf den Blättern des Regaldeckels. Der Stapel
       selbst entsteht weiter oben in derselben `folder`-Abfrage; hier kommt nur
       das Zeichen dazu, und zwar für JEDES bereits vorhandene Blatt — `ensure`
       baut den Stapel nur einmal, die Blätter sind danach schon da.
       Die Ordnerkarte `.ru-fach` braucht von hier gar nichts: sie baut ihre
       Lupe, ihr Blattzeichen und ihren Hinweispfeil selbst
       (`src/schale/bedienung/ordnerkarte.ts`, `createElementNS`, kein
       `innerHTML`). */
    if (ids.includes('folder')) {
      for (const sheet of Array.from(element.querySelectorAll('.rmo-folder-sheet'))) {
    if (!sheet.querySelector(':scope > .rmo-folder-icon')) sheet.append(ornament('rmo-folder-icon'));
      }
    }
    /* ---- Block 03 (E535) ---- */
    /* Block 3 — die Lampe aus Redurs Lichtkarte, und zwar NUR auf der
       Elektro-Fachkachel. `.stat-karte.lw-metrik` und `.pf-karte` tragen
       dieselbe Wirkungs-ID, sind aber eine Kennzahl und eine Listenzeile: ein
       Lichtkegel über einer Zahl behauptet eine Bedeutung, die es nicht gibt.
       Deshalb hier die zweite Frage nach `.els-kachel` — die ID allein reicht
       als Bedingung nicht. */
    if (ids.includes('light') && element.matches('.els-kachel')) {
      ensure(element, 'rmo-lampe', lampe => {
    /* Reihenfolge = Malreihenfolge: erst der Schlitz, dann das Licht
       darüber, dann die Abdunklung obenauf. Alle Teile kommen aus
       `ornament()` und tragen damit `aria-hidden` — ein Vorleseprogramm
       hört von der Lampe nichts, und das ist richtig so: sie sagt nichts,
       was der Knopf nicht schon sagt. */
    const kegel = ornament('rmo-lampe-kegel');
    kegel.append(ornament('rmo-lampe-min'), ornament('rmo-lampe-mid'),
                 ornament('rmo-lampe-hi'));
    const dunkel = ornament('rmo-lampe-dunkel');
    dunkel.append(ornament('rmo-lampe-sl'), ornament('rmo-lampe-ll'),
                  ornament('rmo-lampe-slt'), ornament('rmo-lampe-srt'));
    lampe.append(ornament('rmo-lampe-schlitz'), kegel, dunkel);
      });
    }
    /* ---- Block 05 (E535) ---- */
    /* Block 5 — die sieben Klumpen. Kommt NACH der vorhandenen Zeile
       `if (ids.includes('liquid')) ensure(element, 'rmo-liquid');`; die bleibt
       unverändert, sie setzt die 22-px-Blase. Hier kommt nur ihr Inhalt dazu. */
    if (ids.includes('liquid')) {
      const lader = element.querySelector(':scope > .rmo-liquid');
      /* `!lader.firstElementChild` ist die ganze Einmaligkeit: ein zweiter
     Dekorationslauf findet die Masse und lässt alles stehen (test494,
     „Wiederholte Dekoration bleibt einmalig"). */
      if (lader && !lader.firstElementChild) {
    /* Die Masse ist ein EIGENES Element und nicht die Blase selbst, und das
       ist keine Geschmacksfrage: auf ihr sitzt `filter: contrast(...)`, und
       ein Filter wirkt auf alles im Element — auch auf Glasrand und
       Glanzpunkt. Die beiden bleiben deshalb draussen, als ::before und
       ::after der Blase. In der Masse liegen nur leere Spans, nie Text;
       Kontrast auf Schrift zerstört sie. */
    const masse = ornament('rmo-liquid-masse');
    /* Sieben, wie die sieben <polygon> der Vorlage. Die Zahl steht hier und
       nicht im Stil, weil sie in die Phase eingeht: `--rmo-i` verteilt die
       Klumpen über den Umlauf (Siebtel des Takts), und ein achter Klumpen
       wäre sonst ein stiller Gleichläufer. Drehpunkt, Umriss und
       Laufrichtung je Klumpen stehen im Stil bei :nth-child. */
    for (let index = 0; index < 7; index++) {
      const klumpen = ornament('rmo-liquid-klumpen');
      klumpen.style.setProperty('--rmo-i', String(index));
      masse.append(klumpen);
    }
    lader.append(masse);
      }
    }
    if (ids.includes('letters')) {
      /* Text teilen, aber Symbole, Beschriftung und Listener behalten. */
      for (const node of Array.from(element.childNodes)) {
        if (node.nodeType !== Node.TEXT_NODE || !node.textContent?.trim()) continue;
        const fragment = document.createElement('span');
        fragment.className = 'rmo-word';
        Array.from(node.textContent).forEach((character, index) => {
          const letter = document.createElement('span');
          letter.className = 'rmo-letter'; letter.textContent = character;
          letter.style.setProperty('--rmo-delay', Math.min(index * 25, 250) + 'ms');
          fragment.append(letter);
        });
        node.replaceWith(fragment);
      }
    }
  };
  const decorate = (root: ParentNode = document): void => {
    if (root instanceof Element && root.matches(selector)) decorateElement(root);
    root.querySelectorAll(selector).forEach(decorateElement);
  };
  /** Rückmeldung ohne Timer oder Änderung des Arbeitszustands. */
  const play = (element: Element, effect: MotionEffectId): void => {
    if (document.hidden || AppEinstellung.wenigBewegung()) return;   /* dieselbe Frage wie überall (E702) */
    if (effects.some(entry => entry.id === effect)) set(element, 'data-rmo-play', effect);
  };
  const start = (): void => {
    if (observer) return;
    visibility = new IntersectionObserver(entries => entries.forEach(entry =>
      set(entry.target, 'data-rmo-visible', String(entry.isIntersecting))));
    const pause = (): void => set(document.documentElement, 'data-rmo-paused', String(document.hidden));
    document.addEventListener('visibilitychange', pause); pause();
    document.addEventListener('animationend', event => {
      if (event.target instanceof Element) event.target.closest('[data-rmo-play]')?.removeAttribute('data-rmo-play');
    });
    decorate();
    observer = new MutationObserver(records => {
      const roots = new Set<Element>();
      for (const record of records) {
        const target = record.target instanceof Element ? record.target : record.target.parentElement;
        const metric = target?.closest(metricSelector);
        if (metric) prepareMetric(metric);
        if (target?.matches(selector)) roots.add(target);
        const ticket = target?.closest('.ru-drucker');
        if (ticket) roots.add(ticket);
        for (const node of record.addedNodes) if (node instanceof Element) roots.add(node);
        for (const node of record.removedNodes) if (node instanceof Element && !node.isConnected) {
          for (const removed of [node, ...node.querySelectorAll('[data-rmo]')]) {
            visibility?.unobserve(removed); watched.delete(removed);
          }
        }
      }
      roots.forEach(root => { if (root.isConnected) decorate(root); });
    });
    observer.observe(document.body, { childList: true, characterData: true, subtree: true,
      attributes: true, attributeFilter: ['class', 'data-zustand', 'disabled', 'aria-busy'] });
  };
  return { start, decorate, play, catalog: () => effects.map(effect => ({ ...effect })) };
})();
