/* ============================================================================
 * schale/aufbau/seitenflaeche.ts — die Seite als Leinwand (AFFiNEs `edgeless`)
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/schale/aufbau/seitenflaeche.ts`. `npm run bauen:ts`
 * schreibt daraus `quell/schale/aufbau/seitenflaeche.js`; `test105` meldet es
 * vorher.
 * ----------------------------------------------------------------------------
 * NACHGELESEN, DANN GEBAUT (`doku/karte/thema-ansichten.md`). AFFiNEs Fläche
 * ist kein zweites Dokument, sondern ein Blick auf dasselbe: Punktraster,
 * darin ein `gfx-viewport`, und der Seitentext steht darin als
 * verschiebbarer Kasten mit eigener Kopfzeile (Emoji, Titel, Einklappen).
 * Gezoomt wird von 10 % bis 600 %; Ausschnitt und Zoom werden GETRENNT vom
 * Scrollstand der Seite gemerkt.
 *
 * WAS HIER 1:1 IST: das Punktraster, der Kasten mit Kopfzeile an einer
 * gemerkten Stelle, Schieben, Zoomen, „ins Bild passen", der Prozentwert
 * unten, und dass der Wechsel KEINEN Text anfasst.
 *
 * WAS HIER NOCH NICHT IST — und es steht als Lücke geschrieben, nicht als
 * Versprechen (§32, L219): auf der Fläche ZEICHNEN (Stift, Formen,
 * Verbinder) und mehrere Kästen. Die Werkzeugleiste zeigt deshalb genau die
 * zwei Werkzeuge, die wirklich etwas tun — Zeiger und Hand. Eine Leiste mit
 * zwölf Knöpfen, von denen zehn nichts bewirken, wäre die schlechtere Antwort.
 *
 * DIE DREI STELLEN, AN DENEN ES LEICHT SCHIEFGEHT
 *
 * 1. ZWEI ZAHLENWELTEN. Alles, was der Mensch sieht, ist Bildschirm;
 *    alles, was gespeichert wird, ist Fläche. Die Umrechnung steht EINMAL
 *    hier (`ausFlaeche`/`inFlaeche`) — derselbe Fehler wie E623 und E686
 *    entstand beide Male dadurch, dass sie an zwei Stellen stand.
 *
 * 2. DER AUSSCHNITT IST KEIN INHALT. Wo man gerade hinsieht, gehört nicht
 *    in den Block — sonst verschiebt ein Blick am Telefon die Fläche am
 *    Rechner. Er liegt in `meta` unter `flaeche:<seite>`, so wie AFFiNE ihn
 *    in den `localStorage` legt. Die STELLE des Kastens gehört dagegen zum
 *    Dokument und steht am Block (`flaecheNotiz`, mit `raumVersion` nach dem
 *    Muster aus E686).
 *
 * 3. DER TEXT WIRD NICHT KOPIERT. Im Kasten steht derselbe Aufruf, der die
 *    normale Seite füllt — `Inhaltsflaeche.zeichne`. Wer hier eine zweite
 *    Zeichnung baut, hat zwei Editoren, und einer von beiden ist immer der
 *    veraltete.
 * ==========================================================================*/

const Seitenflaeche = (() => {

  /** Zoomgrenzen und Schritt wie in AFFiNE (`framework/std/src/gfx/viewport.ts`). */
  const ZOOM_MIN = 0.1;
  const ZOOM_MAX = 6.0;
  /** Das Raster in Flächeneinheiten — 20, wie AFFiNEs Punktabstand. */
  const RASTER = 20;
  /** Die Fassung der Zahlen am Block. Eine spätere Umstellung erkennt daran,
   *  was sie vor sich hat, statt zu raten (E686). */
  const RAUM_VERSION = 1;
  /** Vorgabebreite des Kastens, wenn die Seite noch keine hat.
   *  SIE RICHTET SICH NACH DEM FENSTER, und das ist eine Lehre vom Telefon:
   *  mit festen 760 rechnete „ins Bild holen" auf 390 px Breite einen
   *  Massstab von 31 % aus — der Kasten war da, lesbar war er nicht. Eine
   *  VORGABE darf sich am Gerät orientieren; eine gespeicherte Breite nicht
   *  (die gehört dem Dokument und wäre sonst auf jedem Gerät eine andere). */
  const vorgabeBreite = (): number =>
    Math.min(760, Math.max(280, (window.innerWidth || 760) - 40));

  interface Sicht { x: number; y: number; z: number }

  const zahl = (roh: unknown, ersatz: number): number => {
    const n = Number(roh);
    return Number.isFinite(n) ? n : ersatz;
  };

  /* ------------------------------------------------------------------------
   * Der Ausschnitt lebt in `meta`, nicht am Block (Punkt 2 oben).
   * ----------------------------------------------------------------------*/
  const sichtSchluessel = (id: string): string => 'flaeche:' + id;

  const sichtLesen = (id: string): Sicht | null => {
    const roh = Store.getMeta(sichtSchluessel(id), null);
    if (!roh || typeof roh !== 'object') return null;
    const s = roh as Record<string, unknown>;
    if (!Number.isFinite(Number(s['z']))) return null;
    return { x: zahl(s['x'], 0), y: zahl(s['y'], 0), z: zahl(s['z'], 1) };
  };

  const sichtSchreiben = (id: string, s: Sicht): void => {
    Store.setMeta(sichtSchluessel(id), { x: s.x, y: s.y, z: s.z });
  };

  /* ------------------------------------------------------------------------
   * Die Stelle des Kastens gehört zum Dokument.
   * ----------------------------------------------------------------------*/
  const notizLesen = (p: any): { x: number; y: number; w: number } => {
    const roh = p?.flaecheNotiz;
    if (!roh || typeof roh !== 'object') return { x: 0, y: 0, w: vorgabeBreite() };
    return {
      x: zahl(roh.x, 0), y: zahl(roh.y, 0),
      /* Ein Kasten unter 240 wäre nicht mehr lesbar; die Zahl schützt vor
         einer kaputten Sicherung, nicht vor dem Menschen. */
      w: Math.max(240, zahl(roh.w, vorgabeBreite()))
    };
  };

  const notizSchreiben = (p: any, ort: { x: number; y: number; w: number }): void => {
    Store.updateBlock(p.id, {
      flaecheNotiz: { x: Math.round(ort.x), y: Math.round(ort.y), w: Math.round(ort.w), raumVersion: RAUM_VERSION }
    });
  };

  /* ========================================================================
   * Zeichnen
   * ======================================================================*/
  const zeichne = (wrap: HTMLElement, p: any): void => {
    const flaeche = document.createElement('div');
    flaeche.className = 'pg-flaeche';
    flaeche.setAttribute('role', 'application');
    flaeche.setAttribute('aria-label', 'Fläche der Seite ' + (p.text || 'Ohne Titel'));

    /* Die bewegliche Ebene. Alles darin rechnet in Flächeneinheiten; der
       `transform` macht daraus Bildschirm (Punkt 1 oben). */
    const ebene = document.createElement('div');
    ebene.className = 'pg-fl-sicht';
    flaeche.appendChild(ebene);

    /* --- Der Kasten, in dem der Seitentext steht ------------------------ */
    const ort = notizLesen(p);
    const kasten = document.createElement('div');
    kasten.className = 'pg-fl-notiz';
    kasten.style.left = ort.x + 'px';
    kasten.style.top = ort.y + 'px';
    kasten.style.width = ort.w + 'px';

    const kopf = document.createElement('div');
    kopf.className = 'pg-fl-kopf';
    /* DER KOPF DES KASTENS IST DER SEITENKOPF — UMGEZOGEN, NICHT NACHGEBAUT.
       AFFiNEs Notiz trägt auf der Fläche Emoji und Titel in einer eigenen
       Zeile (`edgeless-note-header.tsx:22-60`). Nachbauen hiesse hier: ein
       zweites Titelfeld, das dieselbe Seite schreibt — und eines von beiden
       wäre immer das veraltete (§8).

       Stattdessen wandern die zwei Knoten, die `Kopfleiste.zeichne` gerade
       angelegt hat, mit allen ihren Zuhörern hierher. Das hält auch etwas
       am Leben, das niemand vermuten würde: `menueband.ts:121` fragt
       `!!document.getElementById('title')`, um zu wissen, ob überhaupt eine
       Seite offen ist. Ohne `#title` wäre auf der Fläche das halbe Menüband
       aus. */
    const symAlt = wrap.querySelector<HTMLElement>('.pg-icon');
    const titelAlt = wrap.querySelector<HTMLElement>('#title');
    if (symAlt) kopf.appendChild(symAlt);
    if (titelAlt) kopf.appendChild(titelAlt);
    if (!symAlt) {
      const sym = document.createElement('span');
      sym.className = 'pg-icon';
      sym.setAttribute('aria-hidden', 'true');
      sym.textContent = p.icon || '📄';
      kopf.appendChild(sym);
    }
    if (!titelAlt) {
      const name = document.createElement('div');
      name.className = 'pg-fl-name';
      name.textContent = p.text || 'Ohne Titel';
      kopf.appendChild(name);
    }
    const griffHinweis = document.createElement('span');
    griffHinweis.className = 'pg-fl-griff';
    griffHinweis.setAttribute('aria-hidden', 'true');
    griffHinweis.title = 'Ziehen verschiebt den Kasten';
    griffHinweis.textContent = '⠿';
    kopf.appendChild(griffHinweis);
    kasten.appendChild(kopf);

    const koerper = document.createElement('div');
    koerper.className = 'pg-fl-koerper';
    kasten.appendChild(koerper);
    ebene.appendChild(kasten);

    /* DERSELBE AUFRUF WIE AUF DER NORMALEN SEITE (Punkt 3 oben). */
    Inhaltsflaeche.zeichne(koerper, p);

    wrap.appendChild(flaeche);

    /* ======================================================================
     * Ausschnitt, Raster, Umrechnung
     * ====================================================================*/
    let sicht: Sicht = sichtLesen(p.id) ?? { x: 0, y: 0, z: 1 };
    let werkzeug = 'zeiger';

    const stellen = (merken = true): void => {
      const z = sicht.z;
      ebene.style.transform = `translate(${sicht.x}px, ${sicht.y}px) scale(${z})`;
      /* Das Raster wandert und wächst mit — genau das macht aus einer Fläche
         eine Fläche und nicht eine Seite mit Punkten darauf. */
      flaeche.style.backgroundSize = `${RASTER * z}px ${RASTER * z}px`;
      flaeche.style.backgroundPosition = `${sicht.x}px ${sicht.y}px`;
      const anzeige = flaeche.querySelector('.pg-fl-massstab');
      if (anzeige) anzeige.textContent = Math.round(z * 100) + ' %';
      if (merken) sichtSchreiben(p.id, sicht);
    };

    /** Bildschirm → Fläche. */
    const inFlaeche = (sx: number, sy: number): { x: number; y: number } => {
      const k = flaeche.getBoundingClientRect();
      return { x: (sx - k.left - sicht.x) / sicht.z, y: (sy - k.top - sicht.y) / sicht.z };
    };

    /** Zoomen und dabei den Punkt unter dem Finger festhalten. */
    const massstab = (neu: number, haltX?: number, haltY?: number): void => {
      const z = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, neu));
      const k = flaeche.getBoundingClientRect();
      const sx = haltX === undefined ? k.width / 2 : haltX - k.left;
      const sy = haltY === undefined ? k.height / 2 : haltY - k.top;
      /* Der Punkt in Flächeneinheiten, der unter dem Finger bleiben soll. */
      const fx = (sx - sicht.x) / sicht.z;
      const fy = (sy - sicht.y) / sicht.z;
      sicht = { x: sx - fx * z, y: sy - fy * z, z };
      stellen();
    };

    /** Alles ins Bild holen — AFFiNEs „Fit to screen". */
    const passend = (): void => {
      const k = flaeche.getBoundingClientRect();
      /* `offsetWidth/Height` sind LAYOUT-Masse und vom `transform` unberührt —
         also schon Flächeneinheiten. Mit `getBoundingClientRect` wären sie
         mit z multipliziert, und die Rechnung liefe im Kreis. */
      const w = kasten.offsetWidth || vorgabeBreite();
      const h = kasten.offsetHeight || 400;
      if (!k.width || !k.height) return;
      const rand = 24;
      /* UNTEN STEHT DIE WERKZEUGLEISTE. Ohne diesen Streifen rechnet „ins
         Bild holen" den Kasten mittig und legt seine untere Hälfte hinter
         die Leiste — auf dem Telefon war genau das zu sehen. */
      const leisteHoch = 84;
      const nutzHoehe = Math.max(120, k.height - leisteHoch - rand);
      const z = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN,
        Math.min(1, (k.width - rand * 2) / w, (nutzHoehe - rand) / h)));
      sicht = {
        z,
        x: (k.width - w * z) / 2 - ort.x * z,
        y: Math.max(rand, (nutzHoehe - h * z) / 2) - ort.y * z
      };
      stellen();
    };

    /* ======================================================================
     * Die Werkzeugleiste — dieselbe wie auf jeder anderen Fläche (E689)
     * ====================================================================*/
    const massstabZeigen = document.createElement('b');
    massstabZeigen.className = 'pg-fl-massstab';
    massstabZeigen.setAttribute('aria-live', 'polite');
    massstabZeigen.textContent = '100 %';

    const leiste = GfxToolbar.erstelle({
      klasse: 'pg-fl-tools',
      beschriftung: 'Werkzeuge der Fläche',
      werkzeuge: Register.werkzeuge.auswahl(['zeiger', 'hand']),
      aktiv: 'zeiger',
      aktionen: [
        { id: 'kleiner', name: 'Kleiner', titel: 'Kleiner (Strg + Rad)', sym: 'minus' },
        { id: 'groesser', name: 'Grösser', titel: 'Grösser (Strg + Rad)', sym: 'plus' },
        { id: 'passend', name: 'Ins Bild', titel: 'Alles ins Bild holen', sym: 'maximize' }
      ],
      zusatz: { groesser: massstabZeigen },
      aufWerkzeug: (id: string) => {
        werkzeug = id;
        flaeche.dataset['wz'] = id;
      },
      aufAktion: (id: string) => {
        if (id === 'kleiner') massstab(sicht.z / 1.25);
        if (id === 'groesser') massstab(sicht.z * 1.25);
        if (id === 'passend') passend();
      }
    });
    flaeche.appendChild(leiste.element);
    flaeche.dataset['wz'] = werkzeug;
    if (typeof Register !== 'undefined' && Register.symbole)
      Register.symbole.fuelle(leiste.element);

    /* ======================================================================
     * Schieben, Ziehen, Zoomen
     * ====================================================================*/
    /** Was gerade unter dem Finger passiert. */
    let zug: null | { art: 'flaeche' | 'kasten'; sx: number; sy: number; ax: number; ay: number } = null;
    const finger = new Map<number, { x: number; y: number }>();
    let kneifen: null | { abstand: number; z: number } = null;

    const beginnt = (e: PointerEvent): void => {
      finger.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (finger.size === 2) {
        const [a, b] = [...finger.values()];
        if (a && b) kneifen = { abstand: Math.hypot(a.x - b.x, a.y - b.y), z: sicht.z };
        zug = null;
        return;
      }
      const ziel = e.target instanceof Element ? e.target : null;
      /* AM KOPF ZIEHT MAN DEN KASTEN, sonst die Fläche. Der Körper des
         Kastens gehört dem Text: wer darin zieht, markiert Worte. */
      if (ziel?.closest('.pg-fl-kopf') && werkzeug === 'zeiger') {
        zug = { art: 'kasten', sx: e.clientX, sy: e.clientY, ax: ort.x, ay: ort.y };
      } else if (ziel?.closest('.gfx-tb-sockel')) {
        return;
      } else if (werkzeug === 'hand' || e.button === 1 || !ziel?.closest('.pg-fl-notiz')) {
        zug = { art: 'flaeche', sx: e.clientX, sy: e.clientY, ax: sicht.x, ay: sicht.y };
      }
      if (zug) flaeche.setPointerCapture(e.pointerId);
    };

    const bewegt = (e: PointerEvent): void => {
      if (finger.has(e.pointerId)) finger.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (kneifen && finger.size === 2) {
        const [a, b] = [...finger.values()];
        if (!a || !b) return;
        const jetzt = Math.hypot(a.x - b.x, a.y - b.y);
        if (kneifen.abstand > 0)
          massstab(kneifen.z * (jetzt / kneifen.abstand), (a.x + b.x) / 2, (a.y + b.y) / 2);
        return;
      }
      if (!zug) return;
      const dx = e.clientX - zug.sx;
      const dy = e.clientY - zug.sy;
      if (zug.art === 'flaeche') {
        sicht = { x: zug.ax + dx, y: zug.ay + dy, z: sicht.z };
        stellen(false);
      } else {
        /* Der Kasten wandert in FLÄCHENEINHEITEN, also geteilt durch z —
           ohne das läuft er bei 50 % Zoom doppelt so weit wie der Finger. */
        ort.x = zug.ax + dx / sicht.z;
        ort.y = zug.ay + dy / sicht.z;
        kasten.style.left = ort.x + 'px';
        kasten.style.top = ort.y + 'px';
      }
    };

    const endet = (e: PointerEvent): void => {
      finger.delete(e.pointerId);
      if (finger.size < 2) kneifen = null;
      if (!zug) return;
      if (zug.art === 'flaeche') sichtSchreiben(p.id, sicht);
      else notizSchreiben(p, ort);
      zug = null;
    };

    flaeche.addEventListener('pointerdown', beginnt);
    flaeche.addEventListener('pointermove', bewegt);
    flaeche.addEventListener('pointerup', endet);
    flaeche.addEventListener('pointercancel', endet);

    /* Rad schiebt, Strg + Rad zoomt — wie in AFFiNE und im Whiteboard. */
    flaeche.addEventListener('wheel', (e: WheelEvent) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        massstab(sicht.z * (e.deltaY < 0 ? 1.12 : 1 / 1.12), e.clientX, e.clientY);
        return;
      }
      sicht = { x: sicht.x - e.deltaX, y: sicht.y - e.deltaY, z: sicht.z };
      stellen();
    }, { passive: false });

    /* Beim ERSTEN Öffnen ins Bild holen; danach steht, wo der Mensch war.
       `requestAnimationFrame`, weil die Höhe des Kastens erst nach dem
       Zeichnen bekannt ist — vorher wäre `offsetHeight` null und der
       Zoomfaktor eine Erfindung. */
    if (sichtLesen(p.id)) stellen(false);
    else requestAnimationFrame(() => passend());
    stellen(false);

    /* Die Umrechnung steht bereit, auch wenn heute nur der Kasten sie
       braucht — der nächste Bogen (zeichnen auf der Fläche) rechnet mit
       derselben Formel, nicht mit einer zweiten. */
    void inFlaeche;
  };

  return { zeichne };
})();

(window as any).Seitenflaeche = Seitenflaeche;
