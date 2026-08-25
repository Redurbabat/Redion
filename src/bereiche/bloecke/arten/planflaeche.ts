/* ============================================================================
 * bereiche/bloecke/arten/planflaeche.ts — den Schaltplan bedienen
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/bereiche/bloecke/arten/planflaeche.ts`.
 * ----------------------------------------------------------------------------
 * WARUM ZWEI DATEIEN
 *
 * `schaltplan.ts` weiss, WAS ein Plan ist und wie er aussieht — Modell und
 * Bild, ohne ein einziges Ereignis. Diese Datei weiss, wie man ihn BEDIENT.
 * Die Trennung ist dieselbe wie im Editor (rendern / tastatur / auswahl) und
 * hat einen handfesten Nutzen: die Prüfläufe können einen Plan rechnen und
 * zeichnen lassen, ohne je einen Zeiger zu bewegen.
 *
 * ALLES GEHT ÜBER `aendere`. Jede Änderung am Plan läuft durch diese eine
 * Funktion, und sie tut drei Dinge in fester Reihenfolge: den Plan in den
 * Block schreiben, neu zeichnen, den Verlauf merken. Wer irgendwo daneben
 * direkt an `plan.teile` schraubt, verliert das Rückgängig — und merkt es
 * erst, wenn jemand es braucht.
 * ==========================================================================*/

const Planflaeche = (() => {

  const esc = Schaltplan.esc;

  type Werkzeug = 'zeigen' | 'leitung' | 'text' | 'radieren';

  /** Was gerade am Bildschirm passiert — nichts davon gehört in den Block. */
  type Zustand = {
    block: any;
    plan: any;
    werkzeug: Werkzeug;
    auswahl: Set<string>;
    /** Das Symbol, das als Nächstes gesetzt wird (aus der Palette gewählt). */
    gewaehltesZeichen: string;
    /** Läuft gerade ein Zug? */
    zieht: null | {
      art: 'teil' | 'leitung' | 'rahmen';
      startX: number; startY: number;
      /** Ausgangslagen aller mitgezogenen Teile. */
      ausgang: Map<string, { x: number; y: number }>;
      /** Beim Leitungziehen: der Anfangspunkt. */
      von?: { x: number; y: number; teil?: string; nr?: string };
    };
    /** Rückgängig und Wiederholen — je ein Stapel von Plan-Abzügen. */
    zurueck: string[];
    vorwaerts: string[];
    zeigeAnschluesse: boolean;
    zeigeNummern: boolean;
    zeigeRaster: boolean;

    /* --- Die Simulation (Punkte 13, 14, 30) ---------------------------------
     * Nichts davon gehört in den Block. Eine Schalterstellung ist kein Teil
     * der ZEICHNUNG, sondern des Ausprobierens: wer den Plan morgen wieder
     * öffnet, will ihn so sehen, wie er gezeichnet ist, und nicht mit dem
     * Licht an, das gestern jemand angelassen hat. Der Plan bleibt damit
     * auch in der Sicherung das, was er ist — ein Plan.
     * --------------------------------------------------------------------- */
    /** Läuft die Simulation gerade? */
    simulation: boolean;
    /** Teil-Kennung → Nummer der Schalterstellung. */
    stellungen: Record<string, number>;
    /** Welche Spulen angezogen haben — das Gedächtnis für die Selbsthaltung. */
    spulenStand: Record<string, boolean>;
    /** Das letzte Rechenergebnis, für Zeichnung und Meldungen. */
    ergebnis: any;
  };

  /* ------------------------------------------------------------------------
   * DIE PALETTE (Punkte 5, 6, 12)
   * ------------------------------------------------------------------------
   * Links stehen die Symbole, nach Gruppen. Welche Gruppe oben steht, sagt
   * die Planart: wer einen Installationsplan zeichnet, will Schalter und
   * Steckdosen zuerst und nicht Halbleiter.
   *
   * FAVORITEN (Punkt 6) liegen in `Store.meta` und nicht im Plan — sie
   * gehören dem Menschen, nicht dem Dokument. Wer zwei Pläne öffnet, hat in
   * beiden dieselben Favoriten, und ein Plan, den man weitergibt, nimmt die
   * eigenen Gewohnheiten nicht mit.
   * ----------------------------------------------------------------------*/
  const FAVORITEN = 'elektro:favoriten';

  const favoriten = (): string[] => {
    const roh = (typeof Store !== 'undefined') ? Store.getMeta(FAVORITEN, []) : [];
    return Array.isArray(roh) ? roh.map(String) : [];
  };
  const favoritUmschalten = (id: string): boolean => {
    const liste = favoriten();
    const i = liste.indexOf(id);
    if (i >= 0) liste.splice(i, 1); else liste.push(id);
    if (typeof Store !== 'undefined') Store.setMeta(FAVORITEN, liste);
    return i < 0;
  };

  const paletteHtml = (planArt: string, suche = ''): string => {
    if (typeof Register === 'undefined' || !Register.fachzeichen) return '';
    const art = Schaltplan.artVon(planArt);
    const alleGruppen = Register.fachzeichen.gruppen() as Array<[string, string, string]>;
    /* Erst die Gruppen, die zu dieser Planart passen, dann der Rest. */
    const sortiert = [
      ...art.gruppen.map(g => alleGruppen.find(x => x[0] === g)).filter(Boolean),
      ...alleGruppen.filter(x => !art.gruppen.includes(x[0]))
    ] as Array<[string, string, string]>;

    const q = suche.trim().toLowerCase();
    const passt = (z: any): boolean => !q ||
      z.name.toLowerCase().includes(q) || z.id.includes(q) ||
      z.erklaerung.toLowerCase().includes(q);

    const knopf = (z: any, favorit: boolean): string =>
      `<button class="sp-sym${favorit ? ' sp-fav' : ''}" data-sym="${esc(z.id)}" ` +
      `title="${esc(z.name)} — ${esc(z.erklaerung)}" aria-label="${esc(z.name)}">` +
      `<span class="sp-sym-bild">${Register.fachzeichen.alsSvg(z.id, { strich: 2 })}</span>` +
      `<span class="sp-sym-name">${esc(z.name)}</span></button>`;

    const fav = favoriten();
    const favZeichen = fav.map(id => Register.fachzeichen.holen(id)).filter(Boolean).filter(passt);

    return (favZeichen.length
      ? `<div class="sp-grp">★ Favoriten</div><div class="sp-syms">` +
        favZeichen.map((z: any) => knopf(z, true)).join('') + '</div>'
      : '') +
      sortiert.map(g => {
        const zeichen = (Register.fachzeichen.inGruppe(g[0]) as any[]).filter(passt);
        if (!zeichen.length) return '';
        return `<div class="sp-grp">${esc(g[2])} ${esc(g[1])}</div><div class="sp-syms">` +
          zeichen.map(z => knopf(z, fav.includes(z.id))).join('') + '</div>';
      }).join('');
  };

  /* ------------------------------------------------------------------------
   * DIE FLÄCHE
   * ----------------------------------------------------------------------*/

  /** Bildschirmpunkt in Plankoordinaten — mit Raster (Punkt 22). */
  const ortAus = (svg: SVGSVGElement, e: PointerEvent | MouseEvent, plan: any,
                  ohneRaster = false): { x: number; y: number } => {
    const r = svg.getBoundingClientRect();
    const sx = plan.breite / (r.width || 1);
    const sy = plan.hoehe / (r.height || 1);
    const x = (e.clientX - r.left) * sx;
    const y = (e.clientY - r.top) * sy;
    return ohneRaster ? { x, y } : { x: Schaltplan.rasten(x), y: Schaltplan.rasten(y) };
  };

  /**
   * Die interaktive Fläche für einen Block.
   *
   * Gibt das fertige Element zurück. Alles, was der Editor davon wissen muss,
   * ist: hier reinstecken, fertig.
   */
  const zeichne = (block: any): HTMLElement => {
    const wurzel = document.createElement('div');
    wurzel.className = 'sp-wrap';

    const z: Zustand = {
      block,
      plan: Schaltplan.lesen(block),
      werkzeug: 'zeigen',
      auswahl: new Set<string>(),
      gewaehltesZeichen: '',
      zieht: null,
      zurueck: [], vorwaerts: [],
      zeigeAnschluesse: true,
      zeigeNummern: false,
      zeigeRaster: true,
      simulation: false,
      stellungen: {},
      spulenStand: {},
      ergebnis: null
    };

    /* --- Speichern, zeichnen, merken — in dieser Reihenfolge -------------- */
    const abzug = (): string => JSON.stringify(z.plan);

    const aendere = (was: () => void, merken = true): void => {
      const vorher = merken ? abzug() : '';
      was();
      if (typeof Store !== 'undefined' && block && block.id)
        Store.updateBlock(block.id, { plan: z.plan });
      else if (block) block.plan = z.plan;
      if (merken) {
        z.zurueck.push(vorher);
        if (z.zurueck.length > 60) z.zurueck.shift();
        z.vorwaerts.length = 0;
      }
      male();
    };

    const zurueck = (): void => {
      const vorher = z.zurueck.pop();
      if (!vorher) return;
      z.vorwaerts.push(abzug());
      z.plan = JSON.parse(vorher);
      aendere(() => {}, false);
    };
    const vorwaerts = (): void => {
      const naechster = z.vorwaerts.pop();
      if (!naechster) return;
      z.zurueck.push(abzug());
      z.plan = JSON.parse(naechster);
      aendere(() => {}, false);
    };

    /* --- Aufbau ---------------------------------------------------------- */
    const kopf = document.createElement('div');
    kopf.className = 'sp-kopf';
    const palette = document.createElement('div');
    palette.className = 'sp-palette';
    const buehne = document.createElement('div');
    buehne.className = 'sp-buehne';
    const fuss = document.createElement('div');
    fuss.className = 'sp-fuss';

    const koerper = document.createElement('div');
    koerper.className = 'sp-koerper';
    koerper.appendChild(palette);
    koerper.appendChild(buehne);
    wurzel.appendChild(kopf);
    wurzel.appendChild(koerper);
    wurzel.appendChild(fuss);

    /* --- Der Kopf: Planart, Werkzeuge, Ansicht --------------------------- */
    const kopfMalen = (): void => {
      const art = Schaltplan.artVon(z.plan.art);
      kopf.innerHTML =
        `<select class="sp-art" aria-label="Planart">` +
        (Schaltplan.ARTEN as any[]).map(a =>
          `<option value="${esc(a.id)}"${a.id === z.plan.art ? ' selected' : ''}>` +
          `${esc(a.name)}</option>`).join('') + '</select>' +
        `<span class="sp-arterkl">${esc(art.erklaerung)}</span>` +
        `<span class="sp-werkzeuge">` +
        ([['zeigen', '↖', 'Auswählen und verschieben'],
          ['leitung', '⌐', 'Leitung ziehen'],
          ['text', 'T', 'Beschriftung setzen'],
          ['radieren', '⌫', 'Löschen']] as Array<[Werkzeug, string, string]>).map(([id, ic, t]) =>
          `<button class="sp-wz${z.werkzeug === id ? ' an' : ''}" data-wz="${id}" ` +
          `title="${esc(t)}" aria-label="${esc(t)}">${ic}</button>`).join('') +
        `</span>` +
        `<span class="sp-rechts">` +
        `<button class="sp-start${z.simulation ? ' an' : ''}" data-a="simulation" ` +
        `title="${z.simulation ? 'Simulation anhalten' : 'Strom fliessen lassen'}" ` +
        `aria-pressed="${z.simulation}" ` +
        `aria-label="${z.simulation ? 'Simulation anhalten' : 'Strom fliessen lassen'}">` +
        `${z.simulation ? '◼' : '▶'} Strom</button>` +
        `<button data-a="zurueck" title="Rückgängig" aria-label="Rückgängig"${z.zurueck.length ? '' : ' disabled'}>↶</button>` +
        `<button data-a="vorwaerts" title="Wiederholen" aria-label="Wiederholen"${z.vorwaerts.length ? '' : ' disabled'}>↷</button>` +
        `<button data-a="mehr" title="Mehr" aria-label="Mehr">…</button></span>`;
    };

    /* --- Der Fuss: Ebenen und Auswahl ------------------------------------ */
    /**
     * Was die Simulation zu sagen hat. Ein Fehler steht allein — wenn nichts
     * gerechnet werden konnte, sind Warnungen darunter nur Lärm. Sonst
     * kommen zuerst die Warnungen (die kann man beheben) und dann die
     * Annahmen (die muss man nur wissen).
     */
    const meldungHtml = (): string => {
      const e = z.ergebnis;
      if (!e) return '';
      if (!e.ok) return `<span class="sp-meldung fehler">⚠ ${esc(e.fehler)}</span>`;
      const teile: string[] = [];
      (e.warnungen || []).slice(0, 3).forEach((x: string) =>
        teile.push(`<span class="sp-meldung warnung">⚠ ${esc(x)}</span>`));
      if ((e.warnungen || []).length > 3)
        teile.push(`<span class="sp-meldung warnung">… und ${e.warnungen.length - 3} weitere</span>`);
      if (!teile.length && (e.annahmen || []).length)
        teile.push(`<span class="sp-meldung annahme" title="${esc((e.annahmen as string[]).join(' '))}">` +
          `ⓘ ${e.annahmen.length} Annahme${e.annahmen.length === 1 ? '' : 'n'} — antippen für den Wortlaut</span>`);
      if (!teile.length) teile.push(`<span class="sp-meldung gut">✓ Die Schaltung rechnet.</span>`);
      return teile.join('');
    };

    const fussMalen = (): void => {
      if (z.simulation) {
        const e = z.ergebnis;
        const leuchtet = e && e.ok
          ? Object.keys(e.werte).filter(k => (e.werte[k].helligkeit || 0) > 0.01).length : 0;
        fuss.innerHTML =
          `<span class="sp-simzahlen">` +
          (e && e.ok
            ? `${leuchtet} ${leuchtet === 1 ? 'leuchtet' : 'leuchten'} · ` +
              `grösster Strom ${esc(Stromfluss.zeige(e.maxStrom, 'A'))}` +
              (e.durchgaenge > 1 ? ` · ${e.durchgaenge} Durchgänge` : '')
            : 'nichts gerechnet') + `</span>` +
          meldungHtml() +
          `<span class="sp-simhinweis">Auf einen Schalter tippen zum Schalten` +
          `<button data-a="ruhelage" title="Alle Schalter in die Ruhelage">Ruhelage</button></span>`;
        return;
      }
      const gewaehlt = z.auswahl.size;
      fuss.innerHTML =
        `<span class="sp-ebenen">` + (z.plan.ebenen as any[]).map(e =>
          `<button class="sp-ebene${e.sichtbar ? ' an' : ''}" data-ebene="${esc(e.id)}" ` +
          `title="${e.sichtbar ? 'Ausblenden' : 'Einblenden'}: ${esc(e.name)}">` +
          `<i style="background:${esc(e.farbe)}"></i>${esc(e.name)}</button>`).join('') + '</span>' +
        (gewaehlt
          ? `<span class="sp-auswahl">${gewaehlt} gewählt` +
            `<button data-a="drehen" title="Drehen (R)">↻</button>` +
            `<button data-a="spiegeln" title="Spiegeln (H)">⇄</button>` +
            `<button data-a="doppeln" title="Duplizieren (Strg D)">⧉</button>` +
            `<button data-a="gruppieren" title="Gruppieren (Strg G)">⬚</button>` +
            `<button data-a="loeschen" title="Löschen (Entf)">✕</button></span>`
          : `<span class="sp-hinweis">${esc(z.gewaehltesZeichen
              ? 'Auf die Fläche tippen, um „' +
                (Register.fachzeichen.holen(z.gewaehltesZeichen) || { name: '?' }).name + '" zu setzen'
              : 'Links ein Symbol wählen, dann auf die Fläche tippen')}</span>`) +
        `<span class="sp-zahlen">${z.plan.teile.length} Teile · ${z.plan.leitungen.length} Leitungen</span>`;
    };

    const paletteMalen = (suche = ''): void => {
      palette.innerHTML =
        `<div class="sp-suche"><input type="search" placeholder="Symbol suchen …" ` +
        `value="${esc(suche)}" aria-label="Symbol suchen"></div>` +
        `<div class="sp-liste">${paletteHtml(z.plan.art, suche)}</div>`;
      palette.querySelectorAll<HTMLElement>('[data-sym]').forEach(b => {
        if (b.dataset.sym === z.gewaehltesZeichen) b.classList.add('an');
      });
    };

    /* --- Die Simulation rechnen (Punkte 13, 14, 30) ----------------------
     * Einmal je Zeichnung, und nur wenn sie läuft. Das Ergebnis wandert in
     * `z.ergebnis` und von dort in die Zeichnung UND in die Meldezeile —
     * zwei Anzeigen aus einer Rechnung. Zwei Rechnungen würden irgendwann
     * verschiedene Dinge behaupten.
     * --------------------------------------------------------------------- */
    const rechnen = (): void => {
      if (!z.simulation || typeof Stromfluss === 'undefined') { z.ergebnis = null; return; }
      z.ergebnis = Stromfluss.rechne(z.plan, z.stellungen, z.spulenStand);
      if (z.ergebnis && z.ergebnis.ok) z.spulenStand = z.ergebnis.spulen;
    };

    const buehneMalen = (): void => {
      const e = z.ergebnis;
      const opt: any = {
        raster: z.zeigeRaster,
        anschluesse: z.simulation ? false : z.zeigeAnschluesse,
        nummern: z.zeigeNummern,
        auswahl: z.simulation ? new Set<string>() : z.auswahl
      };
      /* `strom` wird nur GESETZT, wenn gerechnet wurde — nicht auf undefined.
         Ein gesetztes undefined ist bei `exactOptionalPropertyTypes` etwas
         anderes als ein fehlendes Feld, und der Unterschied ist hier auch
         inhaltlich richtig: „keine Simulation" und „Simulation ohne Ergebnis"
         sollen dasselbe Bild geben. */
      if (e && e.ok) opt.strom = {
        netzStrom: e.netzStrom, leitungNetz: e.leitungNetz,
        werte: e.werte, maxStrom: e.maxStrom
      };
      buehne.innerHTML = Schaltplan.alsSvg(z.plan, opt);
      buehne.classList.toggle('sp-laeuft', z.simulation);
      if (!z.simulation) return;
      /* Schaltbare Bauteile bekommen den Zeigefinger und eine Ansage, was ein
         Tippen tut. Ohne das ist die Simulation ein Bild: hübsch und ohne
         die eine Frage, die zählt — „was passiert, wenn ich schalte?" */
      (z.plan.teile as any[]).forEach(t => {
        const st = Stromfluss.stellungenVon(t.zeichen);
        if (st.length < 2) return;
        const vh = Stromfluss.verhalten(t.zeichen);
        if (vh && vh.folgtSpule) return;          /* die schaltet die Spule */
        const g = buehne.querySelector(`[data-id="${CSS.escape(t.id)}"]`);
        if (!g) return;
        g.classList.add('sp-schaltbar');
        const jetzt = st[Math.max(0, Math.min(st.length - 1, z.stellungen[t.id] || 0))];
        const titel = document.createElementNS('http://www.w3.org/2000/svg', 'title');
        titel.textContent = `${t.bmk || ''} ${jetzt ? jetzt.name : ''} — tippen zum Schalten`.trim();
        g.appendChild(titel);
      });
    };

    const male = (): void => { rechnen(); kopfMalen(); buehneMalen(); fussMalen(); };

    /* --- Symbol setzen (Punkt 12) ---------------------------------------- */
    const setzeSymbol = (id: string, x: number, y: number): void => {
      if (!id) return;
      aendere(() => {
        z.plan.teile.push({
          id: Schaltplan.uid(), zeichen: id,
          x: Schaltplan.rasten(x), y: Schaltplan.rasten(y),
          drehung: 0, gespiegelt: false,
          bmk: Schaltplan.naechstesBmk(z.plan, id),
          nummern: {}, gruppe: '',
          ebene: aktiveEbene()
        });
      });
    };

    /* Auf welche Ebene wird gezeichnet: die oberste sichtbare, die nicht
       „plan" ist, sonst „plan". So landet eine Lösung auf der Lösungsebene,
       ohne dass jemand vorher etwas umstellen muss. */
    const aktiveEbene = (): string => {
      const e = (z.plan.ebenen as any[]).filter(x => x.sichtbar);
      const nurAufgabe = e.length === 1 && e[0].id !== 'plan';
      return nurAufgabe ? e[0].id : 'plan';
    };

    /* --- Auswahl (Punkt 24) ---------------------------------------------- */
    const inRahmen = (a: { x: number; y: number }, b: { x: number; y: number }): string[] => {
      const x1 = Math.min(a.x, b.x), x2 = Math.max(a.x, b.x);
      const y1 = Math.min(a.y, b.y), y2 = Math.max(a.y, b.y);
      const raus: string[] = [];
      (z.plan.teile as any[]).forEach(t => {
        const m = Register.fachzeichen.masse(t.zeichen, t.drehung);
        if (t.x >= x1 && t.y >= y1 && t.x + m.w <= x2 && t.y + m.h <= y2) raus.push(t.id);
      });
      (z.plan.leitungen as any[]).forEach(l => {
        if (l.punkte.every((p: any) => p.x >= x1 && p.x <= x2 && p.y >= y1 && p.y <= y2))
          raus.push(l.id);
      });
      return raus;
    };

    const teilVon = (id: string): any =>
      (z.plan.teile as any[]).find(t => t.id === id);

    /* --- Verschieben (Punkt 25), mit mitziehenden Leitungen -------------- */
    const verschiebe = (dx: number, dy: number): void => {
      z.auswahl.forEach(id => {
        const t = teilVon(id);
        if (t) { t.x = Schaltplan.rasten(t.x + dx); t.y = Schaltplan.rasten(t.y + dy); return; }
        const l = (z.plan.leitungen as any[]).find(x => x.id === id);
        if (l) l.punkte = l.punkte.map((p: any) =>
          ({ x: Schaltplan.rasten(p.x + dx), y: Schaltplan.rasten(p.y + dy) }));
      });
      /* Und die Leitungsenden, die an einem verschobenen Teil hängen (23). */
      (z.plan.leitungen as any[]).forEach(l => {
        if (l.vonTeil && z.auswahl.has(l.vonTeil)) {
          const t = teilVon(l.vonTeil);
          const o = t && Schaltplan.anschlussOrt(t, l.vonNr);
          if (o && l.punkte[0]) l.punkte[0] = o;
        }
        if (l.nachTeil && z.auswahl.has(l.nachTeil)) {
          const t = teilVon(l.nachTeil);
          const o = t && Schaltplan.anschlussOrt(t, l.nachNr);
          if (o && l.punkte.length) l.punkte[l.punkte.length - 1] = o;
        }
      });
    };

    /* --- Drehen (26), spiegeln (27), doppeln (28), gruppieren (29) ------- */
    const drehen = (): void => aendere(() => {
      z.auswahl.forEach(id => {
        const t = teilVon(id);
        if (t) t.drehung = ((t.drehung || 0) + 90) % 360;
      });
      leitungenNachziehen();
    });
    const spiegeln = (): void => aendere(() => {
      z.auswahl.forEach(id => {
        const t = teilVon(id);
        if (t) t.gespiegelt = !t.gespiegelt;
      });
      leitungenNachziehen();
    });
    /* Nach Drehen und Spiegeln liegen die Anschlüsse woanders — die
       Leitungen, die daran hängen, müssen mit. Ohne das enden sie in der
       Luft und der Plan sieht verbunden aus, wo er es nicht ist. */
    const leitungenNachziehen = (): void => {
      (z.plan.leitungen as any[]).forEach(l => {
        if (l.vonTeil) {
          const o = Schaltplan.anschlussOrt(teilVon(l.vonTeil), l.vonNr);
          if (o && l.punkte[0]) l.punkte[0] = o;
        }
        if (l.nachTeil) {
          const o = Schaltplan.anschlussOrt(teilVon(l.nachTeil), l.nachNr);
          if (o && l.punkte.length) l.punkte[l.punkte.length - 1] = o;
        }
        if (l.punkte.length >= 2)
          l.punkte = Schaltplan.rechtwinklig(l.punkte[0], l.punkte[l.punkte.length - 1]);
      });
    };
    const doppeln = (): void => aendere(() => {
      const neu: string[] = [];
      const versatz = Register.fachzeichen.RASTER * 2;
      z.auswahl.forEach(id => {
        const t = teilVon(id);
        if (!t) return;
        const k = { ...t, id: Schaltplan.uid(), x: t.x + versatz, y: t.y + versatz,
                    nummern: { ...t.nummern },
                    bmk: Schaltplan.naechstesBmk(z.plan, t.zeichen) };
        z.plan.teile.push(k);
        neu.push(k.id);
      });
      z.auswahl = new Set(neu);
    });
    const gruppieren = (): void => aendere(() => {
      const teile = [...z.auswahl].map(teilVon).filter(Boolean);
      if (teile.length < 2) return;
      /* Schon alle in derselben Gruppe? Dann heisst der Knopf „auflösen". */
      const erste = teile[0].gruppe;
      const zusammen = erste && teile.every((t: any) => t.gruppe === erste);
      const g = zusammen ? '' : Schaltplan.uid();
      teile.forEach((t: any) => { t.gruppe = g; });
    });
    const loeschen = (): void => aendere(() => {
      z.plan.teile = (z.plan.teile as any[]).filter(t => !z.auswahl.has(t.id));
      z.plan.leitungen = (z.plan.leitungen as any[]).filter(l => !z.auswahl.has(l.id));
      z.plan.texte = (z.plan.texte as any[]).filter(x => !z.auswahl.has(x.id));
      z.auswahl.clear();
    });

    /* Wer ein Teil einer Gruppe anfasst, fasst die ganze Gruppe an (29). */
    const mitGruppe = (id: string): string[] => {
      const t = teilVon(id);
      if (!t || !t.gruppe) return [id];
      return (z.plan.teile as any[]).filter(x => x.gruppe === t.gruppe).map(x => x.id);
    };

    /* --- Schalten, solange die Simulation läuft (Punkt 14) ---------------
     * Ein Tipp geht durch die Stellungen der Reihe nach. Beim Ausschalter
     * sind das zwei, beim Gruppenschalter vier — und weil die Namen aus dem
     * Verhalten kommen, steht in der Anzeige „Gruppe 1+2" und nicht „Stufe 2".
     *
     * Der Zustand wird NICHT gespeichert. Das ist Absicht, nicht Vergesslich-
     * keit: siehe die Begründung am Zustandstyp.
     * --------------------------------------------------------------------- */
    const schalte = (teilId: string): boolean => {
      if (typeof Stromfluss === 'undefined') return false;
      const t = teilVon(teilId);
      if (!t) return false;
      const st = Stromfluss.stellungenVon(t.zeichen);
      if (st.length < 2) return false;
      const vh = Stromfluss.verhalten(t.zeichen);
      if (vh && vh.folgtSpule) {
        /* Einen Schützkontakt kann man nicht von Hand zuhalten. Wer es
           versucht, soll wissen warum — sonst sucht er den Fehler in der
           Zeichnung. */
        UI.toast(`${t.bmk || 'Dieser Kontakt'} wird von der Spule geschaltet, nicht von Hand.`);
        return true;
      }
      const jetzt = z.stellungen[teilId] || 0;
      z.stellungen[teilId] = (jetzt + 1) % st.length;
      male();
      return true;
    };

    /* --- Zeigerereignisse ------------------------------------------------ */
    buehne.addEventListener('pointerdown', e => {
      const svg = buehne.querySelector('svg') as SVGSVGElement;
      if (!svg) return;
      const ziel = e.target as Element;
      const roh = ortAus(svg, e, z.plan, true);
      const p = ortAus(svg, e, z.plan);

      /* Läuft die Simulation, ist die Fläche kein Zeichenbrett mehr, sondern
         eine Schalttafel. Nichts wird verschoben, nichts gelöscht — man kann
         den Plan beim Ausprobieren nicht versehentlich kaputt machen. */
      if (z.simulation) {
        const g = ziel.closest('[data-id]') as HTMLElement | null;
        if (g && g.dataset.id) schalte(g.dataset.id);
        return;
      }

      if (z.werkzeug === 'radieren') {
        const g = ziel.closest('[data-id]') as HTMLElement | null;
        if (g && g.dataset.id) { z.auswahl = new Set([g.dataset.id]); loeschen(); }
        return;
      }

      if (z.werkzeug === 'text') {
        void (async () => {
          const t = await UI.frage('Beschriftung', '');
          if (t) aendere(() => z.plan.texte.push({
            id: Schaltplan.uid(), x: p.x, y: p.y, t, ebene: aktiveEbene() }));
        })();
        return;
      }

      if (z.werkzeug === 'leitung') {
        const fang = Schaltplan.fangeAnschluss(z.plan, roh);
        z.zieht = { art: 'leitung', startX: p.x, startY: p.y, ausgang: new Map(),
                    von: fang ? { x: fang.x, y: fang.y, teil: fang.teil, nr: fang.nr }
                              : { x: p.x, y: p.y } };
        svg.setPointerCapture(e.pointerId);
        return;
      }

      /* Werkzeug „zeigen" */
      const g = ziel.closest('[data-id]') as HTMLElement | null;
      if (!g || !g.dataset.id) {
        /* Auf leere Fläche: Symbol setzen, oder Rahmen aufziehen. */
        if (z.gewaehltesZeichen) { setzeSymbol(z.gewaehltesZeichen, p.x, p.y); return; }
        if (!e.shiftKey) z.auswahl.clear();
        z.zieht = { art: 'rahmen', startX: p.x, startY: p.y, ausgang: new Map() };
        svg.setPointerCapture(e.pointerId);
        male();
        return;
      }

      const id = g.dataset.id;
      const gruppe = mitGruppe(id);
      if (e.shiftKey) gruppe.forEach(x => z.auswahl.has(x) ? z.auswahl.delete(x) : z.auswahl.add(x));
      else if (!z.auswahl.has(id)) z.auswahl = new Set(gruppe);

      const ausgang = new Map<string, { x: number; y: number }>();
      z.auswahl.forEach(x => {
        const t = teilVon(x);
        if (t) ausgang.set(x, { x: t.x, y: t.y });
      });
      z.zieht = { art: 'teil', startX: p.x, startY: p.y, ausgang };
      svg.setPointerCapture(e.pointerId);
      male();
    });

    buehne.addEventListener('pointermove', e => {
      if (!z.zieht) return;
      const svg = buehne.querySelector('svg') as SVGSVGElement;
      if (!svg) return;
      const p = ortAus(svg, e, z.plan);

      if (z.zieht.art === 'teil') {
        const dx = p.x - z.zieht.startX, dy = p.y - z.zieht.startY;
        z.zieht.ausgang.forEach((a, id) => {
          const t = teilVon(id);
          if (t) { t.x = Schaltplan.rasten(a.x + dx); t.y = Schaltplan.rasten(a.y + dy); }
        });
        leitungenNachziehen();
        buehneMalen();
        return;
      }
      /* Vorschau beim Leitungziehen und beim Rahmen — ohne den Plan zu
         ändern, damit ein abgebrochener Zug nichts hinterlässt. */
      buehneMalen();
      const svg2 = buehne.querySelector('svg') as SVGSVGElement;
      if (!svg2) return;
      if (z.zieht.art === 'leitung' && z.zieht.von) {
        const punkte = Schaltplan.rechtwinklig(z.zieht.von, p);
        const d = punkte.map((q: any, i: number) =>
          (i ? 'L' : 'M') + q.x + ',' + q.y).join(' ');
        svg2.insertAdjacentHTML('beforeend',
          `<path d="${d}" fill="none" stroke="currentColor" stroke-width="2" ` +
          `stroke-dasharray="4 3" opacity=".7"/>`);
        const fang = Schaltplan.fangeAnschluss(z.plan, p);
        if (fang) svg2.insertAdjacentHTML('beforeend',
          `<circle cx="${fang.x}" cy="${fang.y}" r="7" fill="none" ` +
          `stroke="currentColor" stroke-width="2" opacity=".8"/>`);
      }
      if (z.zieht.art === 'rahmen') {
        const x = Math.min(z.zieht.startX, p.x), y = Math.min(z.zieht.startY, p.y);
        svg2.insertAdjacentHTML('beforeend',
          `<rect x="${x}" y="${y}" width="${Math.abs(p.x - z.zieht.startX)}" ` +
          `height="${Math.abs(p.y - z.zieht.startY)}" fill="currentColor" ` +
          `fill-opacity=".07" stroke="currentColor" stroke-dasharray="4 3"/>`);
      }
    });

    const zugEnde = (e: PointerEvent): void => {
      if (!z.zieht) return;
      const svg = buehne.querySelector('svg') as SVGSVGElement;
      const p = svg ? ortAus(svg, e, z.plan) : { x: 0, y: 0 };
      const zug = z.zieht;
      z.zieht = null;

      if (zug.art === 'teil') {
        const bewegt = zug.ausgang.size &&
          [...zug.ausgang].some(([id, a]) => {
            const t = teilVon(id);
            return t && (t.x !== a.x || t.y !== a.y);
          });
        if (bewegt) aendere(() => { /* schon geschoben — nur sichern */ });
        else male();
        return;
      }

      if (zug.art === 'rahmen') {
        inRahmen({ x: zug.startX, y: zug.startY }, p).forEach(id => z.auswahl.add(id));
        male();
        return;
      }

      if (zug.art === 'leitung' && zug.von) {
        const fang = Schaltplan.fangeAnschluss(z.plan, p);
        const bis = fang ? { x: fang.x, y: fang.y } : p;
        if (bis.x === zug.von.x && bis.y === zug.von.y) { male(); return; }
        aendere(() => z.plan.leitungen.push({
          id: Schaltplan.uid(),
          punkte: Schaltplan.rechtwinklig({ x: zug.von!.x, y: zug.von!.y }, bis),
          ebene: aktiveEbene(),
          vonTeil: zug.von!.teil, vonNr: zug.von!.nr,
          nachTeil: fang ? fang.teil : undefined, nachNr: fang ? fang.nr : undefined
        }));
      }
    };
    buehne.addEventListener('pointerup', zugEnde);
    buehne.addEventListener('pointercancel', zugEnde);

    /* Doppeltippen auf ein Teil: Betriebsmittel und Anschlussnummern (18/19) */
    buehne.addEventListener('dblclick', e => {
      const g = (e.target as Element).closest('[data-id]') as HTMLElement | null;
      const t = g && g.dataset.id ? teilVon(g.dataset.id) : null;
      if (!t) return;
      e.preventDefault();
      teilDialog(t);
    });

    /* --- Der Dialog am Teil ---------------------------------------------- */
    const teilDialog = (t: any): void => {
      const zeichen = Register.fachzeichen.holen(t.zeichen);
      if (!zeichen) return;
      const o = document.createElement('div');
      o.className = 'overlay';
      o.innerHTML =
        '<div class="finder" style="width:min(460px,94vw)">' +
        `<div class="fh">${esc(zeichen.name)}<button class="icon-btn" data-a="zu">✕</button></div>` +
        `<div class="sp-dialog">` +
        `<p class="sp-erkl">${esc(zeichen.erklaerung)}</p>` +
        `<label>Betriebsmittel<input id="sp-bmk" value="${esc(t.bmk)}" ` +
        `placeholder="${esc(zeichen.kennbuchstabe || 'K')}1"></label>` +
        `<div class="sp-nrs"><span>Anschlussnummern</span>` +
        zeichen.anschluesse.map((a: any) =>
          `<label class="sp-nr"><i>${esc(a.nr)}</i>` +
          `<input data-nr="${esc(a.nr)}" value="${esc(t.nummern[a.nr] ?? a.nr)}"></label>`).join('') +
        `</div></div>` +
        '<div class="fbtns"><button data-a="zu">Abbrechen</button>' +
        '<button class="prim" data-a="ok">Übernehmen</button></div></div>';
      document.body.appendChild(o);
      const zu = () => o.remove();
      o.addEventListener('click', e => {
        const b = (e.target as Element).closest<HTMLElement>('[data-a]');
        if (e.target === o || (b && b.dataset.a === 'zu')) { zu(); return; }
        if (!b || b.dataset.a !== 'ok') return;
        const bmk = (o.querySelector('#sp-bmk') as HTMLInputElement).value.trim();
        const nummern: Record<string, string> = {};
        o.querySelectorAll<HTMLInputElement>('[data-nr]').forEach(f => {
          const vorgabe = f.dataset.nr || '';
          const wert = f.value.trim();
          if (wert && wert !== vorgabe) nummern[vorgabe] = wert;
        });
        zu();
        aendere(() => { t.bmk = bmk; t.nummern = nummern; });
      });
      (o.querySelector('#sp-bmk') as HTMLInputElement)?.focus();
    };

    /**
     * Den Strom ein- und ausschalten.
     *
     * Beim Einschalten wird die Auswahl geleert und das Werkzeug auf „zeigen"
     * gestellt: sonst stünde noch der Radiergummi bereit, während die Fläche
     * schon eine Schalttafel ist. Beim Ausschalten fällt alles Gerechnete weg
     * — auch die Schalterstellungen, damit der Plan wieder so aussieht, wie er
     * gezeichnet ist und nicht wie er zuletzt bedient wurde.
     */
    const simulationUmschalten = (): void => {
      z.simulation = !z.simulation;
      z.auswahl.clear();
      if (z.simulation) { z.werkzeug = 'zeigen'; z.gewaehltesZeichen = ''; }
      else { z.stellungen = {}; z.spulenStand = {}; z.ergebnis = null; }
      male();
      paletteMalen();
    };

    /* --- Kopf und Fuss bedienen ------------------------------------------ */
    kopf.addEventListener('change', e => {
      const s = (e.target as HTMLElement).closest('.sp-art') as HTMLSelectElement | null;
      if (!s) return;
      aendere(() => { z.plan.art = s.value; });
      paletteMalen();
    });
    kopf.addEventListener('click', e => {
      const b = (e.target as Element).closest<HTMLElement>('[data-wz],[data-a]');
      if (!b) return;
      if (b.dataset.wz) { z.werkzeug = b.dataset.wz as Werkzeug; z.auswahl.clear(); male(); return; }
      if (b.dataset.a === 'simulation') return simulationUmschalten();
      if (b.dataset.a === 'zurueck') return zurueck();
      if (b.dataset.a === 'vorwaerts') return vorwaerts();
      if (b.dataset.a === 'mehr') return mehrMenue(b);
    });

    fuss.addEventListener('click', e => {
      const b = (e.target as Element).closest<HTMLElement>('[data-ebene],[data-a]');
      if (!b) return;
      if (b.dataset.ebene) {
        aendere(() => {
          const ebene = (z.plan.ebenen as any[]).find(x => x.id === b.dataset.ebene);
          if (ebene) ebene.sichtbar = !ebene.sichtbar;
        });
        return;
      }
      if (b.dataset.a === 'ruhelage') {
        z.stellungen = {}; z.spulenStand = {}; male(); return;
      }
      if (b.classList.contains('annahme')) {
        const e = z.ergebnis;
        if (e && (e.annahmen || []).length)
          UI.banner('Wie gerechnet wird: ' +
            (e.annahmen as string[]).join(' · '), 'info');
        return;
      }
      ({ drehen, spiegeln, doppeln, gruppieren, loeschen } as Record<string, () => void>)
        [b.dataset.a || '']?.();
    });

    palette.addEventListener('click', e => {
      const b = (e.target as Element).closest<HTMLElement>('[data-sym]');
      if (!b || !b.dataset.sym) return;
      if (e.altKey) {
        favoritUmschalten(b.dataset.sym);
        paletteMalen((palette.querySelector('input') as HTMLInputElement)?.value || '');
        return;
      }
      z.gewaehltesZeichen = z.gewaehltesZeichen === b.dataset.sym ? '' : b.dataset.sym;
      palette.querySelectorAll('.sp-sym').forEach(x => x.classList.remove('an'));
      if (z.gewaehltesZeichen) b.classList.add('an');
      fussMalen();
    });
    palette.addEventListener('input', e => {
      const f = e.target as HTMLInputElement;
      if (f.type !== 'search') return;
      const liste = palette.querySelector('.sp-liste');
      if (liste) liste.innerHTML = paletteHtml(z.plan.art, f.value);
    });

    /* --- Tastatur --------------------------------------------------------- */
    wurzel.tabIndex = 0;
    wurzel.addEventListener('keydown', e => {
      const inFeld = (e.target as HTMLElement).tagName === 'INPUT';
      if (inFeld) return;
      const schritt = e.shiftKey ? Register.fachzeichen.RASTER * 5 : Register.fachzeichen.RASTER;
      const pfeile: Record<string, [number, number]> = {
        ArrowLeft: [-schritt, 0], ArrowRight: [schritt, 0],
        ArrowUp: [0, -schritt], ArrowDown: [0, schritt]
      };
      if (pfeile[e.key] && z.auswahl.size) {
        e.preventDefault();
        const [dx, dy] = pfeile[e.key]!;
        aendere(() => verschiebe(dx, dy));
        return;
      }
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); return loeschen(); }
      if (e.key === 'r' || e.key === 'R') { e.preventDefault(); return drehen(); }
      if (e.key === 'h' || e.key === 'H') { e.preventDefault(); return spiegeln(); }
      if (e.key === 'Escape') { z.auswahl.clear(); z.gewaehltesZeichen = ''; male(); paletteMalen(); return; }
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') { e.preventDefault(); return doppeln(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'g') { e.preventDefault(); return gruppieren(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        z.auswahl = new Set([...(z.plan.teile as any[]).map(t => t.id),
                             ...(z.plan.leitungen as any[]).map(l => l.id)]);
        male(); return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); return e.shiftKey ? vorwaerts() : zurueck(); }
    });

    /* --- Das Mehr-Menü ---------------------------------------------------- */
    const mehrMenue = (anker: HTMLElement): void => {
      const r = anker.getBoundingClientRect();
      const m = UI.menu(
        `<button data-m="raster">${z.zeigeRaster ? '✓ ' : ''}Raster zeigen</button>` +
        `<button data-m="anschluesse">${z.zeigeAnschluesse ? '✓ ' : ''}Anschlusspunkte zeigen</button>` +
        `<button data-m="nummern">${z.zeigeNummern ? '✓ ' : ''}Anschlussnummern zeigen</button>` +
        '<hr>' +
        '<button data-m="schienen">Stromschienen einzeichnen</button>' +
        '<button data-m="nummerieren">Alle neu durchnummerieren</button>' +
        '<hr>' +
        '<button data-m="vorlage">Als Vorlage speichern</button>' +
        '<button data-m="svg">Als Bild speichern (SVG)</button>' +
        '<button data-m="leeren">Plan leeren</button>',
        r.left - 180, r.bottom + 6);
      m.addEventListener('click', e => {
        const b = (e.target as Element).closest<HTMLElement>('[data-m]');
        if (!b) return;
        m.remove();
        const was = b.dataset.m;
        if (was === 'raster') { z.zeigeRaster = !z.zeigeRaster; return male(); }
        if (was === 'anschluesse') { z.zeigeAnschluesse = !z.zeigeAnschluesse; return male(); }
        if (was === 'nummern') { z.zeigeNummern = !z.zeigeNummern; return male(); }
        if (was === 'schienen') return aendere(() => Schaltplan.schienenBauen(z.plan));
        if (was === 'nummerieren') return aendere(() => {
          /* Erst leeren, dann von vorn — sonst blieben Lücken bestehen. */
          (z.plan.teile as any[]).forEach(t => { t.bmk = ''; });
          (z.plan.teile as any[]).forEach(t => { t.bmk = Schaltplan.naechstesBmk(z.plan, t.zeichen); });
        });
        if (was === 'leeren') return aendere(() => {
          z.plan.teile = []; z.plan.leitungen = []; z.plan.texte = []; z.auswahl.clear();
        });
        if (was === 'vorlage') return vorlageSpeichern();
        if (was === 'svg') return alsBildSpeichern();
      });
    };

    /* --- Vorlagen (Punkt 30) --------------------------------------------- */
    const VORLAGEN = 'elektro:planvorlagen';
    const vorlageSpeichern = (): void => {
      void (async () => {
        const name = await UI.frage('Name der Vorlage', '');
        if (!name) return;
        const teile = z.auswahl.size
          ? (z.plan.teile as any[]).filter(t => z.auswahl.has(t.id))
          : z.plan.teile;
        if (!teile.length) { UI.toast('Nichts zu speichern'); return; }
        /* Relativ zur linken oberen Ecke, damit die Vorlage überall passt. */
        const x0 = Math.min(...teile.map((t: any) => t.x));
        const y0 = Math.min(...teile.map((t: any) => t.y));
        const liste = Store.getMeta(VORLAGEN, []) || [];
        liste.push({
          id: Schaltplan.uid(), name, art: z.plan.art,
          teile: teile.map((t: any) => ({ ...t, x: t.x - x0, y: t.y - y0 })),
          leitungen: (z.plan.leitungen as any[])
            .filter(l => !z.auswahl.size || z.auswahl.has(l.id))
            .map(l => ({ ...l, punkte: l.punkte.map((p: any) => ({ x: p.x - x0, y: p.y - y0 })) }))
        });
        Store.setMeta(VORLAGEN, liste);
        UI.toast('✅ Vorlage „' + name + '" gespeichert');
      })();
    };

    const alsBildSpeichern = (): void => {
      const svg = Schaltplan.alsSvg(z.plan, { raster: false, anschluesse: false });
      const blob = new Blob(
        ['<?xml version="1.0" encoding="UTF-8"?>' +
         svg.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ')],
        { type: 'image/svg+xml' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = (Schaltplan.artVon(z.plan.art).name || 'Schaltplan') + '.svg';
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    };

    paletteMalen();
    male();
    return wurzel;
  };

  return { zeichne, paletteHtml, favoriten, favoritUmschalten, ortAus };
})();

(window as any).Planflaeche = Planflaeche;
