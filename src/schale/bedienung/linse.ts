/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/schale/bedienung/linse.ts (npm run bauen:ts). */
/* ============================================================================
 * schale/bedienung/linse.ts — die wandernde Glaslinse, genau einmal definiert
 * ----------------------------------------------------------------------------
 * ERZEUGT DARAUS WIRD `quell/schale/bedienung/linse.js`.
 * Die Quelle ist DIESE Datei. `npm run bauen:ts` schreibt das .js; wer das
 * .js bearbeitet, verliert die Änderung beim nächsten Bauen (test105).
 * ----------------------------------------------------------------------------
 * WOFÜR. Redur hat am 20. September zwei Bildschirmaufnahmen geschickt: die
 * Apple-TV-App unter iOS 26 und GoodNotes. An der ersten hing sein Satz „ich
 * will die untere Übergang haben". Was dort passiert, ist nicht ein Kasten,
 * der springt, sondern eine LINSE, die wandert: sie vergrössert, was unter
 * ihr liegt, zieht es beim Fahren mit, wirft an ihrer Oberkante einen
 * Farbsaum und rastet am Ziel ein.
 *
 * Redion hatte die Hälfte davon schon. `#ho-pille` wandert seit E236 von
 * Reiter zu Reiter, und der Grund steht dort: „ein Hintergrund, der springt,
 * sagt ‚ein anderer Knopf' — einer, der wandert, sagt ‚derselbe Ort, weiter
 * vorn'." Diese Datei fügt hinzu, was fehlte: das GLAS.
 *
 * EINER, NICHT ZWEI (seit E646). Hier standen zwei Filter — einer für die
 * Ruhe, einer für die Fahrt —, weil ein Filterwert sich nicht animieren
 * lässt. Im Ruhezustand bricht die Fläche seit E646 gar nicht mehr: die
 * Brechung machte aus ihr einen hellen Ring, und `glass-morphing.md` sagt
 * „Blur is supporting material, not the animation itself". Gewechselt wird
 * jetzt zwischen KEINEM Filter und diesem einen, und das genügt.
 *
 * WARUM EINE EIGENE DATEI — und nicht nur CSS: eine Brechung braucht
 * `feDisplacementMap`, und das braucht einen `<filter id="…">`. Dieselbe
 * Antwort wie bei der Textur (E462): GENAU EINMAL global definieren und dann
 * referenzieren. Zwei Halter wären zwei gleiche Filter, und E440 hat am
 * KI-Funken gezeigt, was passiert, wenn mehrere Instanzen sich eine ID
 * teilen.
 *
 * DIE KARTE IST DER GANZE TRICK. `feDisplacementMap` liest ein Bild und
 * verschiebt jeden Bildpunkt um das, was dort im roten (waagerecht) und
 * grünen Kanal (senkrecht) steht. Grau — 128,128,128 — heisst „nicht
 * verschieben". Unsere Karte läuft von Rot am linken Rand nach Schwarz am
 * rechten und von Grün oben nach Schwarz unten; am Rand wird also nach
 * innen gegriffen, in der Mitte gar nicht. Das ist eine Lupe.
 *
 * DER FARBSAUM entsteht danach: derselbe gebrochene Inhalt wird dreimal
 * genommen, rot und blau um einen Hauch gegeneinander versetzt, und die
 * drei Kanäle werden wieder zusammengelegt. Echtes Glas tut genau das,
 * weil es Farben verschieden stark bricht.
 * ==========================================================================*/

const Linse = (() => {

  const NS = 'http://www.w3.org/2000/svg';
  const HALTER = 'ru-linse-halter';
  /* HIER STAND AUCH `RUHE` (E646). Seit die Fläche im Stillstand gar nicht
     mehr bricht, rief ihn niemand mehr — ein Filter, den kein Stilblatt
     nennt, ist eine Zeile, die aussieht, als täte sie etwas. Der Grund für
     zwei Filter war „ein Filterwert lässt sich nicht animieren"; jetzt
     wechselt die Pille zwischen KEINEM und diesem einen, und das genügt. */
  const FAHRT = 'ru-linse-fahrt';
  /* Der Tropfen (E712): EIN Goo-Filter im selben Halter (E649), nur solange
     es fliesst (`tropfenLeihen`); in Ruhe nur FAHRT (test539 §2). Seit dem
     Zusammenführen der zweiten Welle ist er der EINE Klebefilter der App:
     auch der Löschen-Knopf (E709, delete.ts) und die Meldungen (E711,
     SelectionFlow.goo) leihen ihn, statt je einen eigenen zu bauen
     (test589 §15). */
  const TROPFEN = 'ru-linse-tropfen';

  /* Die Karte als Bild. Sie wird auf die Grösse der Linse gezogen
     (`preserveAspectRatio="none"`), die Zahlen hier sind also nur ein
     Seitenverhältnis, keine Pixel. */
  const KARTE = 'data:image/svg+xml;utf8,' + encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' width='120' height='52'><defs>" +
    "<linearGradient id='x' x1='0' y1='0' x2='1' y2='0'>" +
      "<stop offset='0' stop-color='#f00'/><stop offset='1' stop-color='#000'/></linearGradient>" +
    "<linearGradient id='y' x1='0' y1='0' x2='0' y2='1'>" +
      "<stop offset='0' stop-color='#0f0'/><stop offset='1' stop-color='#000'/></linearGradient>" +
    "</defs><rect width='120' height='52' fill='#808080'/>" +
    "<rect width='120' height='52' fill='url(#x)' style='mix-blend-mode:screen'/>" +
    "<rect width='120' height='52' fill='url(#y)' style='mix-blend-mode:screen'/></svg>");

  const el = (name: string, werte: Record<string, string>): SVGElement => {
    const k = document.createElementNS(NS, name);
    for (const [n, w] of Object.entries(werte)) k.setAttribute(n, w);
    return k;
  };

  /** Ein Filter: Karte holen, weichzeichnen, damit verschieben, Farbsaum. */
  const glas = (id: string, weich: string, verschub: string, saum: string): SVGElement => {
    /* DER FILTERBEREICH IST GENAU DAS ELEMENT. Mit einem grösseren Bereich
       (etwa -30%/160%) läge die Karte verschoben über dem Glas, und heraus
       käme ein dunkler Balken quer durch die Linse statt einer Brechung.
       Am 20. September einmal gebaut und im Bild gesehen. */
    const f = el('filter', {
      id, x: '0%', y: '0%', width: '100%', height: '100%',
      'color-interpolation-filters': 'sRGB'
    });
    f.append(
      el('feImage', { href: KARTE, x: '0%', y: '0%', width: '100%', height: '100%',
                      preserveAspectRatio: 'none', result: 'k' }),
      el('feGaussianBlur', { in: 'k', stdDeviation: weich, result: 'kw' }),
      el('feDisplacementMap', { in: 'SourceGraphic', in2: 'kw', scale: verschub,
                                xChannelSelector: 'R', yChannelSelector: 'G', result: 'g' }),
      el('feOffset', { in: 'g', dx: saum, result: 'vr' }),
      el('feOffset', { in: 'g', dx: '-' + saum, result: 'vb' }),
      el('feColorMatrix', { in: 'vr', type: 'matrix', result: 'kr',
        values: '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0' }),
      el('feColorMatrix', { in: 'g', type: 'matrix', result: 'kg',
        values: '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0' }),
      el('feColorMatrix', { in: 'vb', type: 'matrix', result: 'kb',
        values: '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0' }),
      el('feBlend', { in: 'kr', in2: 'kg', mode: 'screen', result: 'krg' }),
      el('feBlend', { in: 'krg', in2: 'kb', mode: 'screen' })
    );
    return f;
  };

  /** Weich, hart geschnitten, scharf obenauf: bei 7 px berühren sich zwei
   *  44-px-Kreise bis etwa 14 px Abstand. */
  const tropfen = (): SVGElement => {
    const f = el('filter', {
      id: TROPFEN, x: '-20%', y: '-20%', width: '140%', height: '140%',
      'color-interpolation-filters': 'sRGB'
    });
    f.append(
      el('feGaussianBlur', { in: 'SourceGraphic', stdDeviation: '7', result: 'weich' }),
      el('feColorMatrix', { in: 'weich', type: 'matrix', result: 'zaeh',
        values: '1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -10' }),
      el('feComposite', { in: 'SourceGraphic', in2: 'zaeh', operator: 'atop' })
    );
    return f;
  };

  /** Den Halter anlegen, falls es ihn noch nicht gibt. Mehrfach rufen ist
   *  ausdrücklich erlaubt — der zweite Ruf tut nichts. */
  const sicherstellen = (): void => {
    if (document.getElementById(HALTER)) return;
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('id', HALTER);
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    svg.setAttribute('width', '0');
    svg.setAttribute('height', '0');
    svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    const defs = document.createElementNS(NS, 'defs');
    /* ══ IM RUHEZUSTAND OPTISCH STILL (E641) ════════════════════════════
     * Hier stand 15, und das war messbar zu viel: bei 15 wird das Zeichen
     * unter der Linse sichtbar grösser. Das verbietet das Design-System
     * ausdrücklich — „Do not scale labels/icons with the material blob;
     * content should remain optically stable" —, und zwar mit gutem Grund:
     * eine untere Leiste ist kein Schaustück, sondern der Weg, den man
     * hundertmal am Tag geht.
     * 8 war beim Nachsehen am 19. September als „nichts zu sehen"
     * eingestuft worden. Genau das ist hier das Ziel: das Glas soll sich
     * am Rand zeigen, nicht den Inhalt vergrössern. Die Fahrt bleibt bei
     * 24 — dort erklärt die Verzerrung die Bewegung, und da gehört sie hin. */
    /* ══ 12, NICHT 24 (E646) ═══════════════════════════════════════════
     * Im Daumenkino der Fahrt war der Name UNTER der Linse nicht mehr zu
     * lesen: „Dokume", „Lern", „Termi" standen doppelt und verschmiert.
     * Bei 24 verschiebt die Karte jeden Bildpunkt um bis zu ±12 — das ist
     * ein Viertel der Höhe der Leiste.
     *
     * `recipes/dock-material-flow.md` sagt dazu genau einen Satz, und er
     * gilt ausdrücklich für diese Stelle:
     *
     *     „For mobile bottom navigation, avoid excessive liquid distortion;
     *      labels/icons must remain legible throughout."
     *
     * Bei 12 sind es ±6, und der Name bleibt lesbar, während die Linse
     * darüberläuft. Der Farbsaum geht von 0,55 auf 0,3 mit — er verdoppelt
     * sonst optisch, was die Verschiebung schon verzogen hat. */
    defs.append(glas(FAHRT, '9', '12', '0.3'));
    svg.append(defs);
    /* ══ DER HALTER LIEGT IN EINER HÜLLE (E649) ══════════════════════════
     * Hier stand `document.body.append(svg)`, und das hat `test272` rot
     * gemacht — vier Wochen nachdem die Zusage geschrieben wurde, die es
     * bricht.
     *
     * `fokus.ts` legt beim Öffnen eines Dialogs alles still, was daneben
     * im Körper steht, damit man nicht hinter die Fläche tabbt. Dabei
     * geht es die direkten Kinder durch und lässt aus, was kein
     * `HTMLElement` ist — und ein `<svg>` ist ein `SVGElement`. Es fiel
     * also durch. Der Wächter misst `.inert` über ALLE Kinder, und auf
     * einem `SVGElement` gibt es diese Eigenschaft gar nicht: `undefined`
     * ist falsch, und der Lauf war rot.
     *
     * ZWEI WEGE WÄREN GEGANGEN. Den Wächter lockern — er prüft strenger,
     * als die Gefahr ist, denn dieses `<svg>` ist `aria-hidden`, null
     * Pixel gross, `focusable="false"` und enthält nur `<defs>`. Oder den
     * Körper aufräumen, so dass die Zusage wieder ohne Ausnahme gilt.
     * Es ist der zweite geworden: eine Ausnahme im Wächter hätte jede
     * spätere gedeckt, und §55.2 warnt genau davor.
     *
     * DIE HÜLLE IST VON GEBURT AN STILLGELEGT, nicht erst wenn ein Dialog
     * aufgeht. Sie ist nie Inhalt — sie hält eine Ressource. `fokus.ts`
     * hat dafür schon den richtigen Zweig („fremden Zustand bewahren")
     * und fasst sie deshalb nie an. Auf die Filter wirkt das nicht:
     * `filter: url(#…)` schlägt die Kennung im ganzen Dokument nach, und
     * `inert` ändert weder Darstellung noch Auflösung.
     *
     * DER ZWEITE HALTER IST `textur.ts` (E462) und bekommt dieselben
     * vier Zeilen mit einem kurzen Verweis hierher. Bei zwei Haltern ist
     * das billiger als ein drittes Modul; beim dritten gehört es in einen
     * gemeinsamen Helfer unter `kern/helfer/`. */
    const huelle = document.createElement('div');
    huelle.setAttribute('aria-hidden', 'true');
    huelle.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    huelle.inert = true;
    huelle.append(svg);
    document.body.append(huelle);
  };

  /* Kommt mit der ersten Bühne, geht mit der letzten (Durchsicht E712). */
  let tropfenNutzer = 0;
  const tropfenLeihen = (): (() => void) => {
    sicherstellen();
    const defs = document.querySelector(`#${HALTER} defs`);
    if (defs && !document.getElementById(TROPFEN)) defs.append(tropfen());
    tropfenNutzer++;
    let zurueck = false;
    return () => {
      if (zurueck) return;
      zurueck = true;
      tropfenNutzer = Math.max(0, tropfenNutzer - 1);
      if (!tropfenNutzer) document.getElementById(TROPFEN)?.remove();
    };
  };

  /* DIE LINSE AM SATZ (E712, Szene 03): gleitet einmal beim Ankommen über
     „Aufmachen. / Weiterdenken." und ruht dann NEBEN dem Wort, rechts vom
     Punkt (E740) — nicht mehr über „ken". Eine Abschrift in der Linse,
     verschoben und um 1,2 vergrössert — nur `transform`, die Bahn einmal
     gerechnet (Feder „knapp"). Unterwegs Milchglas (still weichgezeichnet,
     nur Deckkraft), in Ruhe die Brechung `FAHRT`; neben dem Wort liegt
     darunter leerer Grund, die ruhende Linse ist also eine stille Scheibe. */
  const SATZ_GESAMT = 1650;
  let satzBeginn = 0;

  /* Ändert sich der Satz (Fenster, Schrift), legt sich die Linse neu an
     ihren Ort, ohne neue Fahrt (Durchsicht E712). */
  let satzBeobachter: ResizeObserver | null = null;
  let beobachtet: HTMLElement | null = null;
  const beobachten = (satz: HTMLElement): void => {
    if (beobachtet === satz || typeof ResizeObserver === 'undefined') return;
    satzBeobachter?.disconnect();
    beobachtet = satz;
    let mass = '';
    satzBeobachter = new ResizeObserver(() => {
      if (!satz.isConnected) {
        satzBeobachter?.disconnect(); satzBeobachter = null; beobachtet = null;
        return;
      }
      const r = satz.getBoundingClientRect();
      const neu = Math.round(r.width) + '×' + Math.round(r.height) + ' ' + getComputedStyle(satz).fontSize;
      if (!mass || neu === mass) { mass = neu; return; }
      mass = neu;
      ueberSatz(satz, false);
    });
    satzBeobachter.observe(satz);
  };

  const ueberSatz = (satz: HTMLElement, gleiten: boolean): void => {
    const traeger = satz.parentElement;
    if (!traeger) return;
    traeger.querySelector(':scope > .ru-held-linse')?.remove();
    const zeilen = [...satz.querySelectorAll<HTMLElement>('.ru-held-zeile')];
    const z1 = zeilen[0], z2 = zeilen[zeilen.length - 1];
    if (!z1 || !z2) return;
    sicherstellen();
    beobachten(satz);

    const still = typeof AppEinstellung !== 'undefined' && AppEinstellung.wenigBewegung();
    const jetzt = performance.now();
    /* Zeichnet die Ansicht gleich danach neu, läuft dieselbe Fahrt weiter. */
    const versatz = still ? SATZ_GESAMT
      : gleiten ? 0 : (satzBeginn && jetzt - satzBeginn < SATZ_GESAMT ? jetzt - satzBeginn : SATZ_GESAMT);
    if (gleiten && !still) satzBeginn = jetzt;

    const kasten = traeger.getBoundingClientRect();
    const lage = (z: HTMLElement) => {
      const r = z.getBoundingClientRect();
      return { x: r.left - kasten.left, y: r.top - kasten.top, b: r.width, h: r.height };
    };
    const a = lage(z1), e = lage(z2);
    const stil = getComputedStyle(satz);
    const fs = parseFloat(stil.fontSize) || 40;
    /* Die Überschrift im Träger: für die Abschrift und den Platz daneben. */
    const hr = satz.getBoundingClientRect();
    const H = { x: hr.left - kasten.left, y: hr.top - kasten.top };
    /* NEBEN DEM WORT RUHEN (E740). Auf die Frage an Redur vom 5. Oktober
       2026, ob die Linse „neben dem Wort ruhen" soll, sagte er am
       11. Oktober „Ja". Hier stand `P2 = Ende der zweiten Zeile − 0,8
       Schriftgrössen`: die Linse ruhte über „ken", und im Gesamtbild las man
       „Weiterdenl(en". Jetzt hält sie eine Fünftel-Schriftgrösse rechts vom
       Punkt, auf der Höhe der Zeile, und bleibt in der Spalte der
       Überschrift: ist daneben weniger Platz als ihre Grösse, wird sie
       kleiner; unter 40 px gibt es keine (320 px breit) — lieber keine Linse
       als eine über der Schrift. Die Fahrt bleibt, wie sie war; nur der Halt
       ist neu (test589 §16). */
    const luecke = Math.round(fs * 0.2);
    const platz = H.x + satz.clientWidth - (e.x + e.b) - luecke;
    const D = Math.round(Math.min(Math.max(48, Math.min(84, fs * 1.7)), platz));
    const S = 1.2;
    const P0 = { x: a.x + fs * 0.4, y: a.y + a.h / 2 };
    const P1 = { x: a.x + a.b - fs * 0.8, y: a.y + a.h / 2 };
    const P2 = { x: e.x + e.b + luecke + D / 2, y: e.y + e.h / 2 };

    /* Die Zeilen kommen verwischt herein (CSS, Federn aus grund.css) — auch
       dort, wo neben dem Wort kein Platz für die Linse ist. */
    const zeilenKommen = (): void => {
      if (versatz >= 900) return;
      satz.style.setProperty('--ru-held-versatz', (-versatz) + 'ms');
      satz.classList.add('ru-held-kommt');
      const fertig = (): void => { satz.classList.remove('ru-held-kommt'); satz.style.removeProperty('--ru-held-versatz'); };
      z2.addEventListener('animationend', ev => { if (ev.target === z2) fertig(); }, { once: true });
      setTimeout(fertig, 2400);
    };
    if (D < 40) { zeilenKommen(); return; }

    const linse = document.createElement('div');
    linse.className = 'ru-held-linse';
    linse.setAttribute('aria-hidden', 'true');
    linse.style.width = linse.style.height = D + 'px';
    const abschrift = (klasse: string): { huelle: HTMLElement; bild: HTMLElement } => {
      const huelle = document.createElement('div');
      huelle.className = klasse;
      const bild = document.createElement('div');
      bild.className = 'ru-held-linse-bild';
      zeilen.forEach((z, i) => {
        if (i) bild.append(document.createElement('br'));
        bild.append(document.createTextNode(z.textContent || ''));
      });
      bild.style.font = stil.font;
      bild.style.letterSpacing = stil.letterSpacing;
      bild.style.width = satz.clientWidth + 'px';
      huelle.append(bild);
      return { huelle, bild };
    };
    const glasTeil = abschrift('ru-held-linse-glas');
    const frostTeil = abschrift('ru-held-linse-frost');
    linse.append(frostTeil.huelle, glasTeil.huelle);
    traeger.append(linse);

    /* Abschrift bei (0,0) der Linse: Verschiebung = D/2 − S·(C − H). */
    const lagenText = (c: { x: number; y: number }, sx = 1, sy = 1): [string, string] => [
      `translate(${(c.x - D / 2).toFixed(2)}px,${(c.y - D / 2).toFixed(2)}px) scale(${sx.toFixed(3)},${sy.toFixed(3)})`,
      `translate(${(D / 2 - S * (c.x - H.x)).toFixed(2)}px,${(D / 2 - S * (c.y - H.y)).toFixed(2)}px) scale(${S})`
    ];

    if (still || versatz >= SATZ_GESAMT) {
      const [l, b] = lagenText(P2);
      linse.style.transform = l;
      glasTeil.bild.style.transform = frostTeil.bild.style.transform = b;
      frostTeil.huelle.style.opacity = '0';
      return;
    }

    /* Warten, zum Ende der ersten Zeile, ruhen, zum Ende der zweiten. */
    const feder = RedionSpring.sample(RedionSpring.preset('snappy'), 0, 1, 0, 16);
    const T1 = 260, T2 = 900;
    type Bild = { t: number; c: { x: number; y: number }; sx: number; sy: number };
    const bilder: Bild[] = [{ t: 0, c: P0, sx: 1, sy: 1 }, { t: T1, c: P0, sx: 1, sy: 1 }];
    const strecke = (von: { x: number; y: number }, nach: { x: number; y: number }, ab: number): number => {
      let vorher = von, tv = ab;
      feder.values.forEach((v, i) => {
        const t = ab + Math.min(i * 16, feder.duration);
        const c = { x: von.x + (nach.x - von.x) * v, y: von.y + (nach.y - von.y) * v };
        const dt = Math.max(1, t - tv);
        const tempo = Math.hypot(c.x - vorher.x, c.y - vorher.y) / dt;   /* px/ms */
        const sx = 1 + Math.min(0.4, tempo * 0.16), sy = 1 - 0.5 * (sx - 1);
        bilder.push({ t, c, sx, sy });
        vorher = c; tv = t;
      });
      return ab + feder.duration;
    };
    const ende1 = strecke(P0, P1, T1);
    bilder.push({ t: Math.max(ende1, T2 - 1), c: P1, sx: 1, sy: 1 });
    const ende2 = strecke(P1, P2, Math.max(T2, ende1 + 20));
    const T = Math.max(SATZ_GESAMT, ende2);
    bilder.push({ t: T, c: P2, sx: 1, sy: 1 });

    const lauf: Animation[] = [];
    const los = (el: HTMLElement, kf: Keyframe[]): void => {
      const an = el.animate(kf, { duration: T, easing: 'linear', fill: 'both' });
      an.currentTime = versatz;
      lauf.push(an);
    };
    los(linse, bilder.map(b => ({ offset: b.t / T, transform: lagenText(b.c, b.sx, b.sy)[0] })));
    const innen = bilder.map(b => ({ offset: b.t / T, transform: lagenText(b.c)[1] }));
    los(glasTeil.bild, innen);
    los(frostTeil.bild, innen);
    const blende = (t: number): number => t / T;
    const scharf: Keyframe[] = [
      { offset: 0, opacity: 1 }, { offset: blende(T1), opacity: 1 }, { offset: blende(T1 + 70), opacity: 0 },
      { offset: blende(ende1 - 140), opacity: 0 }, { offset: blende(ende1 - 60), opacity: 1 },
      { offset: blende(Math.max(T2, ende1 + 20)), opacity: 1 }, { offset: blende(Math.max(T2, ende1 + 20) + 70), opacity: 0 },
      { offset: blende(ende2 - 140), opacity: 0 }, { offset: blende(ende2 - 60), opacity: 1 }, { offset: 1, opacity: 1 }
    ].sort((x, y) => (x.offset as number) - (y.offset as number));
    los(glasTeil.huelle, scharf);
    los(frostTeil.huelle, scharf.map(k => ({ offset: k.offset as number, opacity: 1 - (k.opacity as number) })));
    const pop = RedionSpring.token('bouncy');
    const auf = linse.animate([{ scale: '0.4', opacity: 0 }, { scale: '1', opacity: 1 }],
      { duration: pop.duration, easing: pop.easing, fill: 'both' });
    auf.currentTime = Math.min(versatz, pop.duration);
    lauf.push(auf);

    zeilenKommen();
    Promise.all(lauf.map(x => x.finished)).then(() => {
      const [l, b] = lagenText(P2);
      linse.style.transform = l;
      glasTeil.bild.style.transform = frostTeil.bild.style.transform = b;
      frostTeil.huelle.style.opacity = '0';
      lauf.forEach(x => x.cancel());
    }).catch(() => { /* abgebrochen: die Ansicht ist schon weg */ });
  };

  return { HALTER, FAHRT, TROPFEN, sicherstellen, tropfenLeihen, ueberSatz };
})();

(window as any).Linse = Linse;
