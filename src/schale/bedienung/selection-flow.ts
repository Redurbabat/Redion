/* ============================================================================
 * schale/bedienung/selection-flow.ts — eine Fläche, die wandert
 * ----------------------------------------------------------------------------
 * ERZEUGT DARAUS WIRD `quell/schale/bedienung/selection-flow.js`.
 * Die Quelle ist DIESE Datei. `npm run bauen:ts` schreibt das .js; wer das
 * .js bearbeitet, verliert die Änderung beim nächsten Bauen (test105).
 * ----------------------------------------------------------------------------
 * WOFÜR. Redur hat am 20. September eine Aufnahme der unteren Leiste
 * geschickt und gefragt, ob das so gut sei. Nachgemessen, Bild für Bild bei
 * 60 Bildern je Sekunde, war die Antwort nein — und zwar messbar nein:
 *
 *     Dokumente → Heute    2,717 s: x = 127 px   →   2,733 s: x = 318 px
 *     Heute → Lernen       4,333 s: x = 369 px   →   4,350 s: x = 578 px
 *     Lernen → Termine     5,617 s: x = 602 px   →   5,633 s: x = 742 px
 *     Termine → Mehr       7,083 s: x = 842 px   →   7,100 s: x = 1013 px
 *
 * Vier Wechsel, viermal EIN Bild für 190 bis 210 Pixel. Auf dem Telefon
 * wandert dort nichts; es steht einmal hier und dann dort.
 *
 * ─── UND DAS ÜBERRASCHENDE: AM RECHNER TUT SIE ES DOCH ──────────────────────
 *
 * Dieselbe Fassung, im Browser gemessen: 16 bis 21 Zwischenorte je Wechsel.
 * Die Bewegung ist also da und kommt nur nicht an. Mit gedrosselter Rechen-
 * leistung (Emulation.setCPUThrottlingRate) wurde sichtbar, warum:
 *
 *     Drossel 1×   „Heute" 16 Orte · „Lernen" 17 Orte
 *     Drossel 4×   „Heute"  7 Orte · „Lernen"  9 Orte
 *     Drossel 8×   „Heute"  5 Orte · „Lernen"  5 Orte
 *
 * Und der Gegenversuch ohne die Glasbrechung änderte NICHTS (5 → 4 Orte).
 * Der Filter war also nicht schuld — meine erste Vermutung war falsch.
 *
 * Schuld ist der Hauptfaden. „Heute" und „Lernen" bauen beim Wechsel einen
 * ganzen Bildschirm neu auf; solange das läuft, malt niemand. Eine
 * CSS-Transition, die `width` mitanimiert, LÄUFT AUF DEM HAUPTFADEN — sie
 * kann nicht vorankommen, während er blockiert ist, und springt beim nächsten
 * Bild dorthin, wo ihre Uhr inzwischen steht.
 *
 * `implementation/high-refresh-motion.md` sagt genau das voraus:
 *
 *     „Prefer transform and opacity for frequent motion. Minimize synchronous
 *      layout reads/writes … A nominal short duration does not guarantee
 *      smooth motion."
 *
 * ─── WAS DIESE DATEI DESHALB ANDERS MACHT ───────────────────────────────────
 *
 *   1. NUR `transform`. Keine Breite, kein Layout je Bild. Damit darf die
 *      Bewegung auf den Compositor — und der malt weiter, während der
 *      Hauptfaden einen Bildschirm zusammensetzt.
 *   2. EINE FEDER STATT EINER KURVE. Die alte Kurve legte 72 % des Weges in
 *      den ersten 50 ms zurück und kroch die restlichen 250 ms. Das liest
 *      sich als Sprung mit Nachzittern, auch wenn jedes Bild ankommt.
 *   3. GESCHWINDIGKEIT BLEIBT ERHALTEN. Wer A → B → C tippt, bevor B
 *      angekommen ist, sieht keine neue Bewegung von null, sondern dieselbe
 *      Fläche, die unterwegs umgelenkt wird. `recipes/interruptible-motion.md`:
 *      „The newest valid user intent wins. Do not queue stale UI transitions."
 *
 * ─── WARUM EINE EIGENE DATEI, UND WARUM GENAU DIESE ─────────────────────────
 *
 * Weil dieselbe Rechnung schon zweimal gebraucht wird: die Pille der unteren
 * Leiste (`seitenleiste.ts`) und die fliegende Fläche der Werkzeugleiste im
 * Schreibstudio (`marken.ts`, E640). **L204 hat im selben Atemzug verlangt,
 * dass sie in EINEN Helfer gehört (§8)** — hier ist er. Die Werkzeugleiste
 * zieht in einem eigenen Bogen nach; wer sie anfasst, findet hier alles,
 * was er braucht.
 *
 * ─── DIE FEDER, AUSGESCHRIEBEN ──────────────────────────────────────────────
 *
 * SEIT E706 IST ES DIE FEDER DES TOUCH KITS (Redur, 27.09., ca. 21:45
 * „Wie im UI-Kit (Empfohlen)", ca. 21:47 die Tab-Leiste des Kits). Hier
 * stand ζ = 1 (E646). Die Kit-Feder `snappy` (hier `knapp`, 0,36 s,
 * Schwung 0,14, also ζ = 0,86) schwingt um ein halbes Prozent über —
 * beim Nachbarn 0,4 px. Aus E646 bleibt das Wichtigere: NUR `transform`,
 * die Bahn EINMAL gerechnet, das Tempo beim Umlenken mitgenommen.
 *
 *     ω₀ = 2π / Dauer    ζ = 1 − Schwung    ω_d = ω₀·√(1 − ζ²)
 *     x(t) = e^(−ζω₀t) · ( x₀·cos ω_d t + B·sin ω_d t ),   B = (v₀ + ζω₀x₀)/ω_d
 *
 * Das ist `solveSpring` aus `UI-Kit/app/src/touch/motion/spring.ts` —
 * in Redion EINMAL als `RedionSpring.solve` (E702); `FEDERN` unten liest es.
 *
 * ─── WARUM KEYFRAMES UND KEINE EIGENE SCHLEIFE ──────────────────────────────
 *
 * Eine Feder je Bild in JavaScript zu rechnen wäre wieder Hauptfaden — genau
 * der Fehler, den diese Datei behebt. Stattdessen wird die Bahn EINMAL
 * ausgerechnet und als Keyframes übergeben; `element.animate()` mit lauter
 * `transform`-Werten und `easing:'linear'` darf auf den Compositor.
 * `implementation/web-animations.md`: „Keep references to active animations
 * so new input can cancel, reverse or continue from current visual state."
 * Genau dafür wird die laufende Animation hier gemerkt.
 * ==========================================================================*/

const SelectionFlow = (() => {

  /* DIE FEDERN DES TOUCH KITS (E706) — Dauer in s, Schwung wie im Kit.
     EINE Sprache mit E702 (beim Zusammenführen, §8): die Zahlen kommen aus
     `RedionSpring.PRESETS`, gelöst wird mit `RedionSpring.solve` — derselbe
     Kern, der die Marken in `grund.css` trägt (`test581` §1/§2 rechnet ihn
     gegen das Kit nach). Hier stand eine zweite Tafel mit denselben Zahlen.
         knapp   Kit „snappy"   --feder-knapp   das wandernde Material
         druck   Kit „press"    --feder-druck   ein Zeichen kommt zurück */
  type Feder = { dauer: number; schwung: number };
  const kitFeder = (name: 'snappy' | 'press'): Feder =>
    ({ dauer: RedionSpring.PRESETS[name].duration, schwung: RedionSpring.PRESETS[name].bounce });
  const FEDERN = { knapp: kitFeder('snappy'), druck: kitFeder('press') } as const;

  /** Abgetastet wird alle 8 ms — bei 120 Hz knapp ein Wert je Bild. */
  const SCHRITT = 8;

  /** Eine Bahn: Abstand zum Ziel (px) und Tempo (px/ms) nach `t` ms. */
  type Bahn = (t: number) => { x: number; v: number };

  /** Die Feder als Bahn in Millisekunden und px/ms — gelöst von
   *  `RedionSpring.solve` (Sekunden, Einheiten je Sekunde; E702). */
  const bahnVon = (f: Feder, x0: number, v0: number): Bahn => {
    const bei = RedionSpring.solve(RedionSpring.fromPerceptual({ duration: f.dauer, bounce: f.schwung }), x0, 0, v0 * 1000);
    return t => { const z = bei(t / 1000); return { x: z.value, v: z.velocity / 1000 }; };
  };

  /** Ab wann eine Bahn ruht: nah genug UND langsam genug (beides, sonst
   *  hielte der Nulldurchgang beim Überschwingen für ein Ende). */
  const ruheNach = (bahn: Bahn, genau = 0.35, still = 0.02): number => {
    for (let t = 0; t < 1200; t += SCHRITT) {
      const s = bahn(t);
      if (Math.abs(s.x) <= genau && Math.abs(s.v) <= still) return Math.max(t, SCHRITT * 4);
    }
    return 1200;
  };

  /** Die längste Fahrt, die vorkommt (1000 px). Rufer bauen ihre Netze damit. */
  const DAUER = ruheNach(bahnVon(FEDERN.knapp, -1000, 0), 0.5);
  /** ω₀ der Feder `knapp`, je Millisekunde — nur noch als Auskunft. */
  const OMEGA = (2 * Math.PI) / (FEDERN.knapp.dauer * 1000);

  /**
   * DIE DEHNUNG IST GEDECKELT, UND ZWAR NIEDRIG (E641, Redurs Entscheidung
   * vom 20. September). `recipes/shape-stretch-compress.md`: „Keep
   * deformation subtle. Preserve recognizable control boundaries and avoid
   * cartoon-like elasticity in professional/productivity UI."
   */
  const DEHNUNG_MAX = 0.24;
  /** Aus Tempo wird Dehnung: `materialStretch` des Kits (0,2 je px/ms),
     *  gedeckelt nach E641. */
  const dehnungAus = (v: number): number => 1 + Math.min(DEHNUNG_MAX, Math.abs(v) * 0.2);

  type Lauf = {
    /** Wo die Fläche hinsoll, in Pixeln vom Anfang des Behälters. NaN: der Finger hält sie. */
    ziel: number;
    bahn: Bahn;
    dauer: number;
    /** Ob gedehnt werden darf (nur zwischen Nachbarn — oder vom Finger losgelassen). */
    dehnen: boolean;
    /** Die Hebung zu Beginn (1 = keine) und wie sie auf der Druckfeder zurückgeht. */
    hub0: number;
    hubBahn: Bahn;
    anim?: Animation;
    /** Vom Finger gesetzt: Ort, Tempo (px/ms) und Hebung, von denen die nächste Bahn ausgeht. */
    frei?: { ort: number; tempo: number; hub: number };
  };

  const STILL: Bahn = () => ({ x: 0, v: 0 });
  const ruhend = (ziel: number): Lauf =>
    ({ ziel, bahn: STILL, dauer: 0, dehnen: false, hub0: 1, hubBahn: STILL });

  const laeufe = new WeakMap<HTMLElement, Lauf>();

  /** OHNE BEWEGUNG — aus zwei Quellen (E706): das System UND „Ruhige
     *  Darstellung" (`body[data-bewegung="ruhig"]`). Eine WAAPI-Bahn hält
     *  sich an kein Stilblatt; vorher schwang die Pille dort trotzdem.
     *  Gefragt wird die EINE Frage aus E702 (`AppEinstellung.wenigBewegung`),
     *  dieselbe wie in press.ts und den acht anderen Stellen. */
  const ruhig = (): boolean =>
    typeof AppEinstellung !== 'undefined' ? AppEinstellung.wenigBewegung()
      : !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
        || document.body?.dataset['bewegung'] === 'ruhig';

  /**
   * Die Uhr der laufenden Bewegung.
   *
   * NICHT `performance.now()`: eine Animation, die auf dem Compositor läuft,
   * hat ihre eigene Zeit, und die ist die einzige, die zum gemalten Bild
   * passt. Wer hier die Wanduhr nähme, bekäme beim Umlenken einen Ort, der
   * nie auf dem Bildschirm stand.
   */
  const uhr = (l: Lauf): number => {
    if (!l.anim) return l.dauer;
    const t = l.anim.currentTime;
    /* Kein Zahlenwert heisst: die Bewegung ist vorbei oder war nie da.
       Dann zählt das ENDE der Bahn, nicht ihr Anfang — mit 0 stünde hier
       der Startabstand, und die Fläche spränge beim nächsten Wechsel an
       ihren vorletzten Ort zurück. Genau das ist beim Bauen passiert und
       im Film aufgefallen: jeder Wechsel begann bei x = 51. */
    return typeof t === 'number' ? t : l.dauer;
  };

  /** Ort, Tempo und Hebung JETZT — aus der Formel, nicht aus
     *  `getComputedStyle` (kein Stilabruf mitten in der Bewegung). */
  const stand = (flaeche: HTMLElement): { ort: number; tempo: number; hub: number } => {
    const l = laeufe.get(flaeche);
    if (l?.frei) return { ...l.frei };
    if (l && Number.isFinite(l.ziel)) {
      const t = uhr(l);
      const s = l.bahn(t);
      return { ort: l.ziel + s.x, tempo: s.v, hub: 1 + l.hubBahn(t).x };
    }
    /* Kein Lauf gemerkt: dann steht sie da, wo der Stil sagt. */
    const m = flaeche.style.transform.match(/translateX\((-?[\d.]+)px\)/);
    return { ort: m && m[1] ? Number(m[1]) : 0, tempo: 0, hub: 1 };
  };

  /**
   * Eine Fläche einem Ziel folgen lassen.
   *
   * @param flaeche  die EINE Fläche — sie wird nie ersetzt, nur bewegt.
   * @param ziel     wohin, in Pixeln vom Anfang ihres Behälters (`offsetLeft`).
   * @param nachbar  ob Quelle und Ziel nebeneinanderliegen. Nur dann wird
   *                 gedehnt; `shape-stretch-compress.md` verlangt
   *                 ausdrücklich „Disable deformation for long-distance
   *                 navigation". Hat der Finger sie losgelassen, dehnt sie
   *                 sich mit ihrem Tempo, wie im Kit.
   * @param sofort   ohne Bewegung setzen (erster Aufruf, `reduce`, ruhig).
   */
  const folge = (flaeche: HTMLElement, ziel: number,
                 nachbar: boolean, sofort: boolean): void => {
    const alt = laeufe.get(flaeche);

    /* ══ SCHON DORT ODER SCHON DORTHIN UNTERWEGS? DANN NICHTS. ════════════
       Ein Wechsel auf denselben Reiter ist keine Bewegung, und eine
       Bewegung ohne Anlass ist genau das, was `test114` §17 seit E236
       verbietet.

       HIER STAND `!alt.anim &&` DAZWISCHEN, und das war ein Fehler mit
       sichtbarer Folge: `handyLeiste()` läuft je Tipp ZWEIMAL — einmal aus
       dem Klick, einmal aus `redion:schauplatz`. Der zweite Ruf traf die
       laufende Feder, und weil `dataset.x` da schon umgeschrieben war,
       kam er mit `nachbar = false` — die Bahn wurde neu gestartet und die
       Dehnung fiel weg. `test541` §6 hat es gemessen: 1,000 statt 1,175.
       Eine Feder, die auf ihr eigenes Ziel neu gestartet wird, verliert
       jedes Mal ihren Schwung. Hält der Finger sie (`frei`), ist sie
       NIRGENDS unterwegs — dann muss die Bahn beginnen. */
    if (alt && !alt.frei && alt.ziel === ziel) return;

    if (sofort || ruhig()) {
      /* `continuous-material-selection.md`, Abschnitt Reduced motion:
         „Selection changes immediately. Remove travel/stretch and use an
         instant material relocation." */
      alt?.anim?.cancel();
      flaeche.style.transform = 'translateX(' + ziel + 'px)';
      flaeche.style.removeProperty('--dehnung');
      flaeche.classList.remove('faehrt');
      laeufe.set(flaeche, ruhend(ziel));
      return;
    }

    /* ══ DER STAND DER LAUFENDEN BEWEGUNG WIRD ÜBERNOMMEN ═══════════════════
     * `recipes/velocity-preserving-springs.md`: „spring transitions should
     * inherit current motion rather than restart from zero velocity."
     * Dasselbe gilt für eine Fläche, die der Finger eben losgelassen hat:
     * sie nimmt SEIN Tempo mit (Kit: `springTo(stop, velocity)`). */
    const jetzt = stand(flaeche);
    alt?.anim?.cancel();

    const x0 = jetzt.ort - ziel;
    const v0 = jetzt.tempo;
    const hub0 = jetzt.hub;
    const dehnen = nachbar || !!alt?.frei;

    /* Steht sie schon fast und kommt kein Tempo mit: setzen statt bewegen. */
    if (Math.abs(x0) < 0.5 && Math.abs(v0) < 0.01 && Math.abs(hub0 - 1) < 0.002) {
      flaeche.style.transform = 'translateX(' + ziel + 'px)';
      laeufe.set(flaeche, ruhend(ziel));
      return;
    }

    const bahn = bahnVon(FEDERN.knapp, x0, v0);
    const gehoben = Math.abs(hub0 - 1) >= 0.002;
    const hubBahn = gehoben ? bahnVon(FEDERN.druck, hub0 - 1, 0) : STILL;
    const dauer = Math.max(ruheNach(bahn), gehoben ? ruheNach(hubBahn, 0.0008, 0.00002) : 0);

    /* ══ DIE BAHN ═════════════════════════════════════════════════════════
     * Einmal gerechnet, dann übergeben. Jeder Keyframe trägt Ort, Dehnung
     * und — nach dem Halten — die Hebung; alles steckt in `transform`, also
     * bleibt es eine einzige Eigenschaft, und der Compositor kann sie allein.
     *
     * `--dehnung` wird NICHT mitanimiert: eine benutzerdefinierte
     * Eigenschaft ist für den Compositor unbekanntes Gelände, und schon
     * eine davon in den Keyframes zöge die ganze Bewegung zurück auf den
     * Hauptfaden. */
    const bilder: Keyframe[] = [];
    for (let t = 0; t <= dauer; t += SCHRITT) {
      const s = bahn(t);
      const dehnung = dehnen ? dehnungAus(s.v) : 1;
      bilder.push({ transform: 'translateX(' + (ziel + s.x).toFixed(2) + 'px) scaleX(' + dehnung.toFixed(4) + ')'
        + (gehoben ? ' scale(' + (1 + hubBahn(t).x).toFixed(4) + ')' : '') });
    }
    bilder.push({ transform: 'translateX(' + ziel + 'px) scaleX(1)' + (gehoben ? ' scale(1)' : '') });

    const anim = flaeche.animate(bilder, { duration: dauer, easing: 'linear', fill: 'forwards' });
    laeufe.set(flaeche, { ziel, bahn, dauer, dehnen, hub0, hubBahn, anim });

    /* WIE OFT SIE GEFLOGEN IST — als Zahl am Element, nicht als Ereignis.
       `transitionstart` gibt es bei der Web-Animations-Schnittstelle nicht,
       und `test114` §17 braucht die Auskunft „beim Start ist sie NICHT
       geflogen". Eine Zahl am Element ist dafür das ehrlichere Mass: sie
       zählt die ABSICHT und hängt an keinem Malen (derselbe Grund, aus dem
       §17 schon einmal von Bildern auf Ereignisse umgestellt wurde). */
    flaeche.dataset['fluege'] = String(Number(flaeche.dataset['fluege'] ?? 0) + 1);

    flaeche.classList.add('faehrt');
    anim.finished.then(() => {
      if (laeufe.get(flaeche)?.anim !== anim) return;   /* schon umgelenkt */
      flaeche.style.transform = 'translateX(' + ziel + 'px)';
      anim.cancel();
      /* ANGEKOMMEN HEISST: KEIN ABSTAND, KEIN TEMPO, KEINE HEBUNG MEHR. Ohne
         das bliebe der Startabstand der eben beendeten Bahn stehen, und der
         nächste Wechsel begänne dort statt hier. */
      laeufe.set(flaeche, ruhend(ziel));
      flaeche.classList.remove('faehrt');
    }).catch(() => { /* abgebrochen, weil umgelenkt — kein Fehler */ });
  };

  /** DER FINGER HÄLT DIE FLÄCHE (E706): ein Bild, vom Finger gesetzt;
     *  `folge` fährt beim Loslassen von genau hier weiter. */
  const setze = (flaeche: HTMLElement, ort: number, tempo: number,
                 dehnung: number, hub: number): void => {
    laeufe.get(flaeche)?.anim?.cancel();
    flaeche.style.transform = 'translateX(' + ort.toFixed(2) + 'px) scaleX(' + dehnung.toFixed(4) + ')'
      + ' scale(' + hub.toFixed(4) + ')';
    flaeche.classList.remove('faehrt');
    laeufe.set(flaeche, { ziel: NaN, bahn: STILL, dauer: 0, dehnen: true, hub0: hub, hubBahn: STILL,
                          frei: { ort, tempo, hub } });
  };

  /* ════════════════════════════════════════════════════════════════════════
   * EIN RECHTECK, DAS ZU EINEM ANDEREN FLIEGT (E647)
   * ------------------------------------------------------------------------
   * Der zweite Fall, für den L204 diesen Helfer verlangt hat: die
   * Werkzeugleiste im Schreibstudio (E640). Dort wandert keine Fläche in
   * einer Zeile, sondern eine fliegt von einem Knopf zum nächsten — quer,
   * gegebenenfalls schmaler oder breiter, und über Bildschirmmasse statt
   * über einen Behälter.
   *
   * WARUM DAS TROTZDEM HIERHER GEHÖRT: die Bahn ist dieselbe Feder, und die
   * Falle ist dieselbe. E640 bewegte `left`, `top`, `width` und `height` —
   * VIER Layout-Eigenschaften. Genau daran ist die untere Leiste gescheitert
   * (E646): eine Bewegung, die Layout animiert, bleibt auf dem Hauptfaden,
   * und beim Zeichnen auf einem PDF ist der beschäftigt.
   *
   * DIE UMRECHNUNG IST DIE ALTE FLIP-RECHNUNG. Das Element bekommt die
   * Masse des ZIELS und wird per `transform` dorthin zurückgeschoben und
   * -skaliert, wo es herkommt; animiert wird dann auf `none`. Mit
   * `transform-origin:0 0` ist das eine Zeile Mathematik und kein Layout:
   *
   *     scaleX = von.breite / nach.breite      translateX = von.links - nach.links
   *     scaleY = von.hoehe  / nach.hoehe       translateY = von.oben  - nach.oben
   *
   * SEIT E706 dehnt sie sich unterwegs wie das Material des Kits — in
   * Flugrichtung und nur zwischen Nachbarn (E641), um ihre Mitte, damit
   * sie nicht zur Seite rutscht.
   *
   * WAS SIE NICHT KANN, und das steht hier, damit niemand es sucht: der
   * Radius skaliert mit. Bei einem Wechsel zwischen gleich grossen Knöpfen
   * ist das nichts; bei sehr ungleichen wäre es sichtbar, und dann gehört
   * hierher ein eigener Gedanke, kein Flug.
   * ══════════════════════════════════════════════════════════════════════ */

  type Rechteck = { left: number; top: number; width: number; height: number };

  /**
   * Ein Element von `von` nach `nach` fliegen lassen.
   *
   * `von` und `nach` sind in DEMSELBEN Mass wie `left`/`top` des Elements:
   * Bildschirmmasse bei `position:fixed` (Werkzeugleiste), Masse im Behälter
   * bei `position:absolute` (Umschalter). Zurück kommt die Animation, damit
   * der Rufer sie abbrechen oder ihr Ende abwarten kann.
   *
   * @param dehnen  ob sie sich unterwegs dehnen darf; ohne Angabe: nur
   *                zwischen Nachbarn (höchstens 1,35 Breiten Weg).
   */
  const fliege = (flaeche: HTMLElement, von: Rechteck, nach: Rechteck,
                  dehnen?: boolean): Animation | null => {
    if (!nach.width || !nach.height) return null;

    flaeche.style.left = nach.left + 'px';
    flaeche.style.top = nach.top + 'px';
    flaeche.style.width = nach.width + 'px';
    flaeche.style.height = nach.height + 'px';
    flaeche.style.transformOrigin = '0 0';

    const sx = von.width / nach.width;
    const sy = von.height / nach.height;
    const dx = von.left - nach.left;
    const dy = von.top - nach.top;

    if (ruhig()) {
      flaeche.style.transform = 'none';
      return null;
    }

    const waagerecht = Math.abs(dx) >= Math.abs(dy);
    const weit = Math.max(Math.abs(dx), Math.abs(dy),
      Math.abs(von.width - nach.width), Math.abs(von.height - nach.height), 1);
    const nah = waagerecht
      ? Math.abs(dx) <= 1.35 * Math.max(von.width, nach.width)
      : Math.abs(dy) <= 1.35 * Math.max(von.height, nach.height);
    const darf = dehnen ?? nah;

    const bahn = bahnVon(FEDERN.knapp, -weit, 0);
    const dauer = ruheNach(bahn, 0.5);

    const bilder: Keyframe[] = [];
    for (let t = 0; t <= dauer; t += SCHRITT) {
      const s = bahn(t);
      /* Der Rest des Weges: 1 am Anfang, 0 am Ziel — und kurz unter null,
         wenn die Feder über das Ziel hinausschwingt. */
      const rest = -s.x / weit;
      let kx = 1 + (sx - 1) * rest;
      let ky = 1 + (sy - 1) * rest;
      let tx = dx * rest;
      let ty = dy * rest;
      if (darf) {
        const d = dehnungAus(s.v);
        if (waagerecht) { tx -= nach.width * kx * (d - 1) / 2; kx *= d; }
        else { ty -= nach.height * ky * (d - 1) / 2; ky *= d; }
      }
      bilder.push({
        transform: 'translate(' + tx.toFixed(2) + 'px,' + ty.toFixed(2) + 'px)'
          + ' scale(' + kx.toFixed(4) + ',' + ky.toFixed(4) + ')'
      });
    }
    bilder.push({ transform: 'none' });
    return flaeche.animate(bilder, { duration: dauer, easing: 'linear', fill: 'forwards' });
  };

  /* DAS ZEICHEN SINKT EIN UND FEDERT ZURÜCK (E706), wie in der Tab-Leiste
     des Kits: sofort auf 0,9, zurück auf der Druckfeder. Bewegt wird
     `scale`, nicht `transform` — es legt sich über das, was schon da ist.
     Das Loslassen wartet, bis das Einsinken zu sehen war. Einsinken wie die
     Druckfeder (press.ts, E702): `--motion-instant` auf `--ease` — dort
     sinkt der Reiter der unteren Leiste NICHT noch einmal (OWN_PRESS). */
  type Druck = { anim: Animation; seit: number; wartet?: boolean };
  const gedrueckt = new WeakMap<HTMLElement, Druck>();
  const marke = (name: string): string =>
    getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const einsinken = (): number => { const v = parseFloat(marke('--motion-instant')); return v > 0 ? v : 80; };
  const kannSkalieren = (): boolean => 'scale' in document.documentElement.style;

  const drueckeEin = (el: HTMLElement | null, tiefe = 0.9): void => {
    if (!el || ruhig() || !kannSkalieren()) return;
    const alt = gedrueckt.get(el);
    const von = alt ? (parseFloat(getComputedStyle(el).scale) || 1) : 1;
    alt?.anim.cancel();
    const anim = el.animate([{ scale: String(von) }, { scale: String(tiefe) }],
      { duration: einsinken(), easing: marke('--ease') || 'ease-out', fill: 'forwards' });
    gedrueckt.set(el, { anim, seit: performance.now() });
  };

  const lasseLos = (el: HTMLElement | null): void => {
    if (!el) return;
    const alt = gedrueckt.get(el);
    if (!alt || alt.seit < 0) return;
    const rest = einsinken() - (performance.now() - alt.seit);
    if (rest > SCHRITT) {
      if (!alt.wartet) { alt.wartet = true; setTimeout(() => lasseLos(el), rest); }
      return;
    }
    const jetzt = parseFloat(getComputedStyle(el).scale);
    const ab = Number.isFinite(jetzt) ? jetzt : 1;
    alt.anim.cancel();
    gedrueckt.delete(el);
    if (Math.abs(ab - 1) < 0.001) return;
    const bahn = bahnVon(FEDERN.druck, ab - 1, 0);
    const dauer = ruheNach(bahn, 0.0008, 0.00002);
    const bilder: Keyframe[] = [];
    for (let t = 0; t <= dauer; t += SCHRITT) bilder.push({ scale: (1 + bahn(t).x).toFixed(4) });
    bilder.push({ scale: '1' });
    const anim = el.animate(bilder, { duration: dauer, easing: 'linear' });
    /* seit -1: federt zurück; ein neuer Druck holt den Wert hier ab. */
    gedrueckt.set(el, { anim, seit: -1 });
    anim.finished.then(() => { if (gedrueckt.get(el)?.anim === anim) gedrueckt.delete(el); })
      .catch(() => { /* von einem neuen Druck abgelöst */ });
  };

  /* DIE GESTE DES KITS, OHNE REACT (E706): Achse, Tempo, Gummiband,
     Rastpunkt — aus `UI-Kit/app/src/touch/gesture/*` übertragen. */

  /** `lockAxis`: erst nach `schwelle` px entscheiden (Finger 10, Maus 2). */
  const achse = (dx: number, dy: number, schwelle: number): 'x' | 'y' | null => {
    const ax = Math.abs(dx), ay = Math.abs(dy);
    if (Math.max(ax, ay) < schwelle) return null;
    return ax >= ay ? 'x' : 'y';
  };

  /** `createVelocityTracker`: Tempo aus den letzten 100 ms, in px/ms. */
  const tempoMesser = () => {
    let proben: Array<{ wert: number; zeit: number }> = [];
    const FENSTER = 100;
    return {
      dazu(wert: number, zeit: number): void {
        proben.push({ wert, zeit });
        const grenze = zeit - FENSTER * 4;
        while (proben.length > 2 && proben[0] && proben[0].zeit < grenze) proben.shift();
      },
      tempo(jetzt: number): number {
        const letzte = proben[proben.length - 1];
        const davor = proben[proben.length - 2];
        if (!letzte || !davor) return 0;
        if (jetzt - letzte.zeit > FENSTER) return 0;          /* der Finger ruht */
        let bezug = letzte;
        for (let i = proben.length - 2; i >= 0; i--) {
          const p = proben[i];
          if (!p || letzte.zeit - p.zeit > FENSTER) break;
          bezug = p;
        }
        if (bezug === letzte) {
          if (letzte.zeit - davor.zeit > FENSTER * 2) return 0;
          bezug = davor;
        }
        const dt = letzte.zeit - bezug.zeit;
        if (dt <= 0) return 0;
        const v = (letzte.wert - bezug.wert) / dt;
        return Number.isFinite(v) ? v : 0;
      }
    };
  };

  /** `rubberbandClamp`: über die Enden hinaus immer zäher, nie weiter als `weite`. */
  const gummiband = (wert: number, min: number, max: number, weite: number): number => {
    const band = (ueber: number): number => (ueber * weite * 0.55) / (weite + 0.55 * Math.abs(ueber));
    if (wert < min) return min - band(min - wert);
    if (wert > max) return max + band(wert - max);
    return wert;
  };

  /** `selectSnapPoint`: der Punkt am Ende des Schwungs — ein klares Wischen
   *  landet nie hinter dem Finger. `tempo` in px/ms. */
  const rastpunkt = (ort: number, tempo: number, punkte: number[], bremse = 0.98): number => {
    const vs = tempo * 1000;
    const weiter = vs === 0 ? 0 : ((vs / 1000) * bremse) / (1 - bremse);
    const ziel = ort + weiter;
    let best = 0;
    punkte.forEach((p, i) => {
      if (Math.abs(p - ziel) < Math.abs((punkte[best] ?? p) - ziel)) best = i;
    });
    if (Math.abs(vs) >= 300) {
      const richtung = Math.sign(vs);
      if (((punkte[best] ?? ort) - ort) * richtung < 0) {
        let vorn = -1, abstand = 0;
        punkte.forEach((p, i) => {
          const d = (p - ort) * richtung;
          if (d > 0 && (vorn === -1 || d < abstand)) { vorn = i; abstand = d; }
        });
        if (vorn !== -1) best = vorn;
      }
    }
    return best;
  };

  /* DAS MATERIAL ZUM ZIEHEN (E706, Redur 21:47) — die Tab-Leiste des Kits
     ohne React und ohne ihr Markup:
       · auf der Fläche gedrückt, wird sie gegriffen; sonst zum Finger gezogen;
       · gehalten hebt sie sich (`data-gehalten`), dehnt sich mit dem Tempo,
         die Wahl darunter leuchtet vor (`data-anvisiert`);
       · über die Enden: Gummiband, höchstens eine halbe Wahl;
       · losgelassen: Rastpunkt mit Schwung, dann GENAU EINMAL der Klickweg
         der Wahl; der Klick des Browsers danach wird geschluckt;
       · ein Tipp bleibt ein Tipp (10 px, Maus 2); senkrecht nicht; Escape
         bricht ab.
     `flaeche`: bleibende Fläche (untere Leiste); `baue`: kurzlebige. */
  type Ziehbar = {
    reihe: HTMLElement;
    optionen: () => HTMLElement[];
    gewaehlt: () => HTMLElement | null;
    flaeche?: HTMLElement;
    baue?: (gewaehlt: HTMLElement) => HTMLElement;
    /** Nur greifen, wenn auf der gewählten Wahl gedrückt wurde (rollende Reihen). */
    nurAmGewaehlten?: boolean;
    /** Wie hoch sie sich beim Halten hebt (Kit: schwebend 1,12, Leiste 1,08). */
    hub?: number;
    /** Das Zeichen, das beim Drücken einsinkt. */
    zeichen?: (k: HTMLElement) => HTMLElement | null;
    waehle: (k: HTMLElement, flaeche: HTMLElement) => void;
    zurueck: (k: HTMLElement | null, flaeche: HTMLElement) => void;
  };

  const ziehbar = (a: Ziehbar): void => {
    if (a.reihe.dataset['ziehbar']) return;           /* nie zweimal binden */
    a.reihe.dataset['ziehbar'] = 'an';
    const HUB = a.hub ?? 1.12;
    type Zug = {
      id: number; x0: number; y0: number; maus: boolean;
      zieht: boolean; amZiehen: boolean;
      nullX: number; breite: number; mitten: number[]; liste: HTMLElement[];
      aktiv: HTMLElement; auf: boolean;
      finger: number; versatz: number;
      ort: number; tempo: number; dehnung: number; hub: number;
      messer: ReturnType<typeof tempoMesser>;
      flaeche: HTMLElement | null; zuletzt: number; bild: number; vorn: HTMLElement | null;
    };
    let zug: Zug | null = null;
    let gedrucktes: HTMLElement | null = null;
    let schlucken = -Infinity;
    let eigenerKlick = false;

    const sichtbar = (k: HTMLElement): boolean => k.getClientRects().length > 0 && k.offsetWidth > 0;

    const malen = (z: Zug): void => {
      if (!z.flaeche) return;
      if (a.flaeche) setze(z.flaeche, z.ort, z.tempo, z.dehnung, z.hub);
      else z.flaeche.style.transform = 'translateX(' + z.ort.toFixed(2) + 'px) scaleX('
        + z.dehnung.toFixed(4) + ') scale(' + z.hub.toFixed(4) + ')';
    };

    const vorleuchten = (z: Zug): void => {
      const mitte = z.ort + z.breite / 2;
      let best: HTMLElement | null = null;
      let abstand = Infinity;
      for (let i = 0; i < z.mitten.length; i++) {
        const d = Math.abs((z.mitten[i] ?? 0) - mitte);
        if (d < abstand) { abstand = d; best = z.liste[i] ?? null; }
      }
      if (best === z.vorn) return;
      z.vorn?.removeAttribute('data-anvisiert');
      best?.setAttribute('data-anvisiert', '');
      z.vorn = best;
    };

    const takt = (jetzt: number): void => {
      const z = zug;
      if (!z || !z.amZiehen) return;
      const dt = Math.min(48, Math.max(0, jetzt - z.zuletzt));
      z.zuletzt = jetzt;
      const erste = z.mitten[0] ?? 0, letzte = z.mitten[z.mitten.length - 1] ?? 0;
      const ziel = gummiband(z.finger - z.versatz, Math.min(erste, letzte),
                             Math.max(erste, letzte), z.breite * 0.5) - z.breite / 2;
      if (z.zieht) {
        /* Zum Finger gezogen, auf der Feder: jedes Bild eine neue Bahn. */
        const s = bahnVon(FEDERN.knapp, z.ort - ziel, z.tempo)(dt);
        z.ort = ziel + s.x; z.tempo = s.v;
        if (Math.abs(z.ort - ziel) < 0.5 && Math.abs(z.tempo) < 0.3) {
          z.zieht = false;
          z.versatz = z.finger - (z.ort + z.breite / 2);
        }
      } else {
        z.ort = ziel;
        z.tempo = z.messer.tempo(jetzt);
      }
      /* Dehnung folgt dem Tempo und löst sich, wenn der Finger ruht (Kit). */
      const soll = ruhig() ? 1 : dehnungAus(z.tempo);
      z.dehnung = soll > z.dehnung ? soll : 1 + (z.dehnung - 1) * Math.pow(0.5, dt / 40);
      const hubSoll = ruhig() ? 1 : HUB;
      z.hub += (hubSoll - z.hub) * (1 - Math.pow(0.5, dt / 30));
      malen(z);
      vorleuchten(z);
      z.bild = requestAnimationFrame(takt);
    };

    const aufraeumen = (z: Zug): void => {
      cancelAnimationFrame(z.bild);
      z.amZiehen = false;
      delete a.reihe.dataset['gehalten'];
      z.vorn?.removeAttribute('data-anvisiert');
      z.vorn = null;
      schlucken = performance.now();
    };

    const abbrechen = (): void => {
      const z = zug;
      zug = null;
      lasseLos(gedrucktes);
      if (!z || !z.amZiehen || !z.flaeche) return;
      aufraeumen(z);
      if (a.flaeche) setze(z.flaeche, z.ort, 0, z.dehnung, z.hub);
      a.zurueck(a.gewaehlt(), z.flaeche);
    };

    a.reihe.addEventListener('pointerdown', (e: PointerEvent) => {
      if (e.button !== 0 || zug?.amZiehen) return;
      const liste = a.optionen().filter(sichtbar);
      const ziel = e.target instanceof Element ? e.target : null;
      const k = liste.find(o => ziel && o.contains(ziel)) || null;
      zug = null;
      if (!k) return;
      gedrucktes = a.zeichen ? a.zeichen(k) : null;
      drueckeEin(gedrucktes, 0.9);
      const aktiv = a.gewaehlt();
      if (!aktiv || !sichtbar(aktiv)) return;
      if (a.nurAmGewaehlten && k !== aktiv) return;
      /* Einmal gemessen, beim Aufsetzen — nicht je Bild. */
      const ar = aktiv.getBoundingClientRect();
      let nullX = ar.left;
      if (a.flaeche) {
        const rr = a.reihe.getBoundingClientRect();
        nullX = rr.left + a.reihe.clientLeft - a.reihe.scrollLeft;
      }
      const mitten = liste.map(o => { const r = o.getBoundingClientRect(); return r.left - nullX + r.width / 2; });
      const stehtBei = a.flaeche ? stand(a.flaeche) : { ort: 0, tempo: 0, hub: 1 };
      const finger = e.clientX - nullX;
      zug = {
        id: e.pointerId, x0: e.clientX, y0: e.clientY, maus: e.pointerType === 'mouse',
        zieht: false, amZiehen: false, nullX, breite: ar.width, mitten, liste, aktiv,
        auf: Math.abs(finger - (stehtBei.ort + ar.width / 2)) <= ar.width / 2,
        finger, versatz: 0, ort: stehtBei.ort, tempo: stehtBei.tempo,
        dehnung: 1, hub: stehtBei.hub, messer: tempoMesser(),
        flaeche: a.flaeche ?? null, zuletzt: performance.now(), bild: 0, vorn: null
      };
    });

    a.reihe.addEventListener('pointermove', (e: PointerEvent) => {
      const z = zug;
      if (!z || e.pointerId !== z.id) return;
      if (e.pointerType !== 'touch' && e.buttons === 0) { abbrechen(); return; }
      if (!z.amZiehen) {
        const ax = achse(e.clientX - z.x0, e.clientY - z.y0, z.maus ? 2 : 10);
        if (ax === null) return;
        if (ax === 'y') { zug = null; lasseLos(gedrucktes); return; }
        /* ES WIRD GEZOGEN. */
        z.amZiehen = true;
        lasseLos(gedrucktes);
        try { a.reihe.setPointerCapture(e.pointerId); } catch { /* schon weg */ }
        window.getSelection()?.removeAllRanges();
        a.reihe.dataset['gehalten'] = '';
        if (!z.flaeche && a.baue) z.flaeche = a.baue(z.aktiv);
        if (!z.flaeche) { zug = null; delete a.reihe.dataset['gehalten']; return; }
        /* Gegriffen, wo sie ist (ab HIER, damit nichts springt), sonst gezogen. */
        if (z.auf) z.versatz = (e.clientX - z.nullX) - (z.ort + z.breite / 2);
        else z.zieht = true;
        z.zuletzt = performance.now();
        z.bild = requestAnimationFrame(takt);
      }
      z.finger = e.clientX - z.nullX;
      z.messer.dazu(z.finger - z.versatz, e.timeStamp);
    });

    const loslassen = (e: PointerEvent): void => {
      const z = zug;
      if (!z || e.pointerId !== z.id) return;
      zug = null;
      lasseLos(gedrucktes);
      if (!z.amZiehen || !z.flaeche) return;          /* ein Tipp: der Klick wählt */
      aufraeumen(z);
      const tempo = z.zieht ? z.tempo : z.messer.tempo(e.timeStamp);
      const wahl = z.liste[rastpunkt(z.ort + z.breite / 2, tempo, z.mitten)] ?? null;
      const jetzt = a.gewaehlt();
      if (a.flaeche) setze(z.flaeche, z.ort, tempo, z.dehnung, z.hub);
      if (wahl && wahl !== jetzt) {
        eigenerKlick = true;
        try { a.waehle(wahl, z.flaeche); } finally { eigenerKlick = false; }
      } else {
        a.zurueck(jetzt, z.flaeche);
      }
    };
    a.reihe.addEventListener('pointerup', loslassen);
    a.reihe.addEventListener('pointercancel', (e: PointerEvent) => {
      if (zug && e.pointerId === zug.id) abbrechen();
    });
    a.reihe.addEventListener('lostpointercapture', (e: PointerEvent) => {
      if (e.target === a.reihe && zug && zug.amZiehen && e.pointerId === zug.id) abbrechen();
    });
    /* Der Klick nach dem Ziehen ist kein Tipp — nur dieser, nur 0,5 s lang;
           ein Vorleser wählt ohne Aufsetzen und kommt immer an. */
    a.reihe.addEventListener('click', (e: MouseEvent) => {
      if (eigenerKlick) return;
      if (performance.now() - schlucken < 500) {
        schlucken = -Infinity;
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);
    /* Und die Schublade bleibt zu: ein Zug ab x < 26 sähe für `pwa.ts`
           aus wie der Wisch vom Rand. */
    a.reihe.addEventListener('touchend', (e: TouchEvent) => {
      if (performance.now() - schlucken < 300) e.stopPropagation();
    });
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || !zug?.amZiehen) return;
      e.preventDefault();
      e.stopPropagation();
      abbrechen();
    }, true);
  };

  /* DIE UMSCHALTER: EIN MATERIAL FÜR JEDE WAHL (E706) — Seite/Fläche/Redion,
     Heute, die Wege im Regal, Aussehen, Einstellungen, das Zubehör der
     Stiftleiste. DER ZUSTAND BLEIBT AM KNOPF (E640): die meisten Reihen
     werden je Wahl neu gezeichnet, eine bleibende Fläche veraltete. Also
     fliegt nur der Wechsel — eine kurzlebige Fläche im Aussehen der Wahl,
     unter der Schrift; das Ziel leuchtet derweil schwach vor.
     DER VERTRAG IST EIN MERKMAL (`data-material`), KEIN AUFRUF (§5): die
     Schale hört einmal am Dokument zu, merkt VOR dem Klick, fliegt im
     nächsten Bild — auch in eine neu gezeichnete Reihe an derselben Stelle. */
  const GEWAEHLT = '[aria-checked="true"],[aria-selected="true"],[aria-current="page"],' +
                   '[aria-current="true"],[aria-pressed="true"],.on,.an,.is-active';

  /** Die Wahlen einer Reihe; mit `data-material-je="gruppe"` nur die mit
     *  demselben `data-gruppe` (Stiftleiste). Ohne das Merkmal: keine. */
  const optionenIn = (reihe: Element, gruppe: string | null = null): HTMLElement[] => {
    const je = reihe instanceof HTMLElement ? reihe.dataset['materialJe'] : undefined;
    return Array.from(reihe.children).filter((k): k is HTMLElement =>
      k instanceof HTMLElement && k.matches('button,[role="tab"],[role="radio"]')
      && (!je || (gruppe !== null && k.dataset[je] === gruppe)));
  };
  const gewaehltIn = (reihe: Element, gruppe: string | null = null): HTMLElement | null =>
    optionenIn(reihe, gruppe).find(k => k.matches(GEWAEHLT)) || null;

  /** Der Kasten, der die Fläche trägt: `display:contents` hat keinen. */
  const traegerVon = (reihe: HTMLElement): HTMLElement => {
    let t = reihe;
    while (t.parentElement && getComputedStyle(t).display === 'contents') t = t.parentElement;
    return t;
  };

  const DURCHSICHTIG = /^(transparent|rgba\([^)]*,\s*0\))$/;
  type Flug = { flug: HTMLElement; ziel: HTMLElement; fertig: () => void };
  const reiheFluege = new WeakMap<HTMLElement, Flug>();

  /** Eine neu gezeichnete Reihe wiederfinden: dieselbe `data-material`
     *  an (fast) derselben Stelle. */
  const reiheSuchen = (name: string, rahmen: Rechteck): HTMLElement | null => {
    let beste: HTMLElement | null = null;
    let abstand = Infinity;
    for (const r of Array.from(document.querySelectorAll<HTMLElement>('[data-material]'))) {
      if ((r.dataset['material'] || '') !== name) continue;
      const q = r.getBoundingClientRect();
      const d = Math.abs(q.left - rahmen.left) + Math.abs(q.top - rahmen.top);
      if (d < abstand) { abstand = d; beste = r; }
    }
    return beste;
  };

  const materialFliegen = (reihe: HTMLElement, von: Rechteck, neu: HTMLElement,
                           gruppe: string | null = null, runde = 0): void => {
    if (ruhig()) return;
    const nach = neu.getBoundingClientRect();
    if (!nach.width || !nach.height || !von.width || !von.height) return;
    if (Math.abs(von.left - nach.left) < 1 && Math.abs(von.top - nach.top) < 1) return;
    /* Kein Flug quer über einen Umbruch: dieselbe Zeile ODER dieselbe Spalte. */
    const zeile = Math.abs(von.top - nach.top) < Math.max(von.height, nach.height) * 0.5;
    const spalte = Math.abs(von.left - nach.left) < Math.max(von.width, nach.width) * 0.5;
    if (!zeile && !spalte) return;

    /* Wie sieht die Wahl aus? Am Ziel gelesen. Eine Farbe als `style` ist
           Inhalt (Farbtupfer): sie fliegt nicht und bleibt stehen, nur ihr Ring fliegt. */
    const st = getComputedStyle(neu);
    const inhalt = !!(neu.style.background || neu.style.backgroundColor);
    const grund = inhalt ? 'transparent' : st.backgroundColor;
    const bild = inhalt ? 'none' : st.backgroundImage;
    const seiten = ['top', 'right', 'bottom', 'left'].map(s => ({
      s, w: parseFloat(st.getPropertyValue('border-' + s + '-width')) || 0,
      art: st.getPropertyValue('border-' + s + '-style'),
      farbe: st.getPropertyValue('border-' + s + '-color')
    }));
    const rand = seiten.some(r => r.w > 0 && r.art !== 'none' && !DURCHSICHTIG.test(r.farbe.trim()));
    if (DURCHSICHTIG.test(grund.trim()) && bild === 'none' && st.boxShadow === 'none' && !rand) return;

    const traeger = traegerVon(reihe);

    /* Unterbrechen, nicht anstellen: ab dem Ort der laufenden Fläche. */
    let start: Rechteck = von;
    const alt = reiheFluege.get(traeger);
    if (alt) {
      if (alt.flug.isConnected) start = alt.flug.getBoundingClientRect();
      alt.fertig();
    }

    const flug = document.createElement('i');
    flug.className = 'ru-flug';
    flug.setAttribute('aria-hidden', 'true');
    flug.style.backgroundColor = grund;
    flug.style.backgroundImage = bild;
    flug.style.borderRadius = st.borderRadius;
    flug.style.boxShadow = st.boxShadow;
    for (const r of seiten) {
      flug.style.setProperty('border-' + r.s, r.w + 'px ' + (r.art || 'none') + ' ' + r.farbe);
    }
    /* Eigene Ebene nur für den Flug (`isolation`): `z-index:-1` liegt dann
           über dem Grund der Reihe und unter der Schrift. */
    traeger.classList.add('ru-traeger');
    traeger.append(flug);

    /* In den Massen ihres `offsetParent`, samt Rollstand. Die Lage des
           Trägers bleibt, wie sie ist (eine Klappe darin verrutschte sonst). */
    const bezug = (flug.offsetParent as HTMLElement | null) ?? traeger;
    const b = bezug.getBoundingClientRect();
    const lokal = (r: Rechteck): Rechteck => ({
      left: r.left - b.left - bezug.clientLeft + bezug.scrollLeft,
      top: r.top - b.top - bezug.clientTop + bezug.scrollTop,
      width: r.width, height: r.height
    });

    /* Das Ziel leuchtet schwach vor, es wird nie leer (E640/test478). */
    neu.style.setProperty('--ru-grund', grund);
    neu.classList.add(inhalt ? 'ru-wartet-rand' : 'ru-wartet');
    const eintrag: Flug = { flug, ziel: neu, fertig: () => {} };
    reiheFluege.set(traeger, eintrag);
    eintrag.fertig = (): void => {
      if (reiheFluege.get(traeger) !== eintrag) return;     /* überholt */
      reiheFluege.delete(traeger);
      /* Landen ohne Überblenden: der eigene Grund kommt im selben Bild. */
      neu.classList.add('ru-landet');
      neu.classList.remove('ru-wartet', 'ru-wartet-rand');
      neu.style.removeProperty('--ru-grund');
      flug.remove();
      traeger.classList.remove('ru-traeger');
      requestAnimationFrame(() => requestAnimationFrame(() => neu.classList.remove('ru-landet')));
    };
    const bahn = fliege(flug, lokal(start), lokal(nach));
    if (!bahn) { eintrag.fertig(); return; }
    flug.dataset['fluege'] = '1';
    bahn.finished.then(eintrag.fertig).catch(() => { /* überholt */ });
    /* Netz: eine Bewegung, die nie beginnt, meldet kein Ende. */
    setTimeout(eintrag.fertig, DAUER + 250);

    /* NEU GEZEICHNET MITTEN IM FLUG (gefunden an „Heute": die Reihe wird
       nach dem Klick noch einmal gezeichnet, die Fläche verschwand nach zwei
       Bildern am Start). Dann fliegt sie in der neuen Reihe weiter — ab dem
       Ort, an dem sie zuletzt zu sehen war, höchstens dreimal. */
    const name = reihe.dataset['material'] || '';
    let zuletzt: Rechteck = start;
    let rahmen: Rechteck = reihe.getBoundingClientRect();
    const wache = (): void => {
      if (reiheFluege.get(traeger) !== eintrag) return;     /* gelandet oder überholt */
      if (flug.isConnected && neu.isConnected && reihe.isConnected) {
        zuletzt = flug.getBoundingClientRect();
        rahmen = reihe.getBoundingClientRect();
        requestAnimationFrame(wache);
        return;
      }
      eintrag.fertig();
      const andere = runde < 3 ? reiheSuchen(name, rahmen) : null;
      const ziel = andere ? gewaehltIn(andere, gruppe) : null;
      if (andere && ziel) materialFliegen(andere, zuletzt, ziel, gruppe, runde + 1);
    };
    requestAnimationFrame(wache);
  };

  type Merk = { name: string; reihe: HTMLElement; rahmen: DOMRect; gruppe: string | null;
                von: Rechteck | null; alt: HTMLElement | null };

  const nachsehen = (m: Merk, runde: number): void => {
    requestAnimationFrame(() => {
      /* Neu gezeichnet: dieselbe Reihe an derselben Stelle suchen. */
      const reihe: HTMLElement | null = m.reihe.isConnected ? m.reihe : reiheSuchen(m.name, m.rahmen);
      const neu = reihe ? gewaehltIn(reihe, m.gruppe) : null;
      if (!reihe || !neu || neu === m.alt) {
        if (runde < 6) nachsehen(m, runde + 1);
        return;
      }
      /* Die Reihe selbst kann dabei gewandert sein (ein neuer Seitenkopf
         darüber). Das ist nicht der Weg der Wahl: der Start zieht mit der
         Reihe mit, geflogen wird nur IN ihr. */
      const q = reihe.getBoundingClientRect();
      if (m.von) materialFliegen(reihe, { left: m.von.left + q.left - m.rahmen.left,
        top: m.von.top + q.top - m.rahmen.top, width: m.von.width, height: m.von.height }, neu, m.gruppe);
    });
  };

  const vormerken = (e: Event): void => {
    const ziel = e.target instanceof Element ? e.target : null;
    const reihe = ziel?.closest<HTMLElement>('[data-material]') ?? null;
    if (!reihe || !ziel || ruhig()) return;
    const je = reihe.dataset['materialJe'];
    const knopf = Array.from(reihe.children).find(k => k.contains(ziel));
    const gruppe = je && knopf instanceof HTMLElement ? (knopf.dataset[je] ?? null) : null;
    if (je && gruppe === null) return;             /* ein Werkzeug: es fliegt selbst (E640) */
    if (!optionenIn(reihe, gruppe).some(k => k.contains(ziel))) return;
    const alt = gewaehltIn(reihe, gruppe);
    const laufend = reiheFluege.get(traegerVon(reihe));
    const r = laufend?.flug.isConnected ? laufend.flug.getBoundingClientRect()
            : alt ? alt.getBoundingClientRect() : null;
    nachsehen({ name: reihe.dataset['material'] || '', reihe, rahmen: reihe.getBoundingClientRect(), gruppe,
                von: r ? { left: r.left, top: r.top, width: r.width, height: r.height } : null, alt }, 0);
  };

  /* Einmal am Dokument, nicht je Reihe — die Reihen kommen und gehen. */
  document.addEventListener('click', vormerken, true);
  document.addEventListener('keydown', (e: KeyboardEvent) => {
    if (/^(Arrow|Home$|End$)/.test(e.key)) vormerken(e);
  }, true);

  /* DIE MARKE, DIE DURCH EINE LISTE GLEITET (E711, Szene 07). Kein zweites
     Material (§8): `folge` in zwei Richtungen und mit Grösse — dieselbe Feder
     `knapp`, dieselbe Dehnung (nur zwischen Nachbarn, E641), Keyframes aus
     `transform`, einmal gerechnet; vier Bahnen (links, oben, Breite, Höhe),
     weil Trefferzeilen verschieden hoch sind. Layout einmal, nicht je Bild. */
  type Gleiten = { ziel: Rechteck; bahnen: Bahn[]; dauer: number; anim?: Animation };
  const gleitLaeufe = new WeakMap<HTMLElement, Gleiten>();

  /** Ort und Tempo der vier Grössen jetzt, aus den Bahnen. */
  const gleitStand = (g: Gleiten): { werte: number[]; tempi: number[] } => {
    const t = g.anim && typeof g.anim.currentTime === 'number' ? g.anim.currentTime : g.dauer;
    const z = [g.ziel.left, g.ziel.top, g.ziel.width, g.ziel.height];
    return { werte: g.bahnen.map((b, k) => (z[k] ?? 0) + b(t).x), tempi: g.bahnen.map(b => b(t).v) };
  };

  /** Zu `nach` gleiten (Masse des `offsetParent`); umgelenkt mit Tempo. */
  const glide = (marke: HTMLElement, nach: Rechteck, sofort = false): void => {
    const alt = gleitLaeufe.get(marke);
    /* Schon dort oder schon dorthin unterwegs: nichts (wie `folge`). */
    if (alt && !sofort && Math.abs(alt.ziel.left - nach.left) < 0.5 && Math.abs(alt.ziel.top - nach.top) < 0.5
        && Math.abs(alt.ziel.width - nach.width) < 0.5 && Math.abs(alt.ziel.height - nach.height) < 0.5) return;
    const jetzt = alt ? gleitStand(alt) : null;
    alt?.anim?.cancel();
    marke.style.left = nach.left + 'px';
    marke.style.top = nach.top + 'px';
    marke.style.width = nach.width + 'px';
    marke.style.height = nach.height + 'px';
    marke.style.transformOrigin = '0 0';
    const ruhe = (): void => {
      marke.style.transform = 'none';
      marke.classList.remove('faehrt');
      gleitLaeufe.set(marke, { ziel: nach, bahnen: [STILL, STILL, STILL, STILL], dauer: 0 });
    };
    if (!jetzt || sofort || ruhig() || !nach.width || !nach.height) { ruhe(); return; }

    const z = [nach.left, nach.top, nach.width, nach.height];
    const bahnen = z.map((zk, k) => bahnVon(FEDERN.knapp, (jetzt.werte[k] ?? zk) - zk, jetzt.tempi[k] ?? 0));
    const [bx, by, bw, bh] = bahnen as [Bahn, Bahn, Bahn, Bahn];
    const weg = Math.max(...bahnen.map(b => Math.abs(b(0).x)), ...bahnen.map(b => Math.abs(b(0).v) * 60));
    if (weg < 0.5) { ruhe(); return; }
    const dauer = Math.max(...bahnen.map(b => ruheNach(b, 0.5)));
    /* Dehnen nur zwischen Nachbarn (E641) — und in der Richtung, in der sie fährt. */
    const senkrecht = Math.abs(by(0).x) >= Math.abs(bx(0).x);
    const darf = senkrecht ? Math.abs(by(0).x) <= 1.35 * Math.max(nach.height, (jetzt.werte[3] ?? 0))
                           : Math.abs(bx(0).x) <= 1.35 * Math.max(nach.width, (jetzt.werte[2] ?? 0));
    const bild = (t: number): Keyframe => {
      const w = nach.width + bw(t).x, h = nach.height + bh(t).x;
      let kx = w / nach.width, ky = h / nach.height;
      let tx = bx(t).x, ty = by(t).x;
      if (darf) {
        const d = dehnungAus(senkrecht ? by(t).v : bx(t).v);
        if (senkrecht) { ty -= h * (d - 1) / 2; ky *= d; } else { tx -= w * (d - 1) / 2; kx *= d; }
      }
      return { transform: 'translate(' + tx.toFixed(2) + 'px,' + ty.toFixed(2) + 'px)'
        + ' scale(' + kx.toFixed(4) + ',' + ky.toFixed(4) + ')' };
    };
    const bilder: Keyframe[] = [];
    for (let t = 0; t <= dauer; t += SCHRITT) bilder.push(bild(t));
    bilder.push({ transform: 'none' });
    const anim = marke.animate(bilder, { duration: dauer, easing: 'linear', fill: 'forwards' });
    gleitLaeufe.set(marke, { ziel: nach, bahnen, dauer, anim });
    marke.classList.add('faehrt');
    marke.dataset['fluege'] = String(Number(marke.dataset['fluege'] ?? 0) + 1);
    anim.finished.then(() => {
      if (gleitLaeufe.get(marke)?.anim !== anim) return;   /* schon umgelenkt */
      ruhe();
      anim.cancel();
    }).catch(() => { /* umgelenkt */ });
  };

  /** Lage im Träger aus dem LAYOUT: eine hereinkommende Zeile steht noch tiefer. */
  const lageIn = (traeger: HTMLElement, el: HTMLElement): Rechteck => {
    let x = 0, y = 0;
    let e: HTMLElement | null = el;
    while (e && e !== traeger) {
      x += e.offsetLeft; y += e.offsetTop;
      const p = e.offsetParent as HTMLElement | null;
      if (p && p !== traeger) { x += p.clientLeft - p.scrollLeft; y += p.clientTop - p.scrollTop; }
      e = p;
    }
    if (e === traeger) return { left: x, top: y, width: el.offsetWidth, height: el.offsetHeight };
    const t = traeger.getBoundingClientRect(), r = el.getBoundingClientRect();
    return { left: r.left - t.left - traeger.clientLeft + traeger.scrollLeft,
             top: r.top - t.top - traeger.clientTop + traeger.scrollTop, width: r.width, height: r.height };
  };

  const markenVon = new WeakMap<HTMLElement, HTMLElement>();

  /** DIE EINE Marke einer Liste auf die Wahl (Suche, Palette, Menü mit Suche);
   *  sie überlebt ein `innerHTML`. `taste`: Chip („↵ Enter"); `still`: leise. */
  const highlight = (liste: HTMLElement, ziel: HTMLElement | null | undefined,
                     o: { taste?: string; still?: boolean } = {}): HTMLElement => {
    let m = markenVon.get(liste);
    if (!m) {
      m = document.createElement('i');
      m.className = 'ru-marke' + (o.still ? ' ru-marke-still' : '');
      m.setAttribute('aria-hidden', 'true');
      if (o.taste) {
        const t = document.createElement('span');
        t.className = 'ru-marke-taste';
        t.textContent = o.taste;
        m.appendChild(t);
      }
      markenVon.set(liste, m);
    }
    liste.classList.add('ru-marke-traeger');
    if (m.parentElement !== liste) liste.prepend(m);
    if (!ziel || !ziel.isConnected || !ziel.offsetWidth) { m.hidden = true; return m; }
    const warDa = !m.hidden && gleitLaeufe.has(m);
    m.hidden = false;
    glide(m, lageIn(liste, ziel), !warDa);
    return m;
  };

  const gesehen = new WeakMap<HTMLElement, Set<string>>();

  /** Nur NEUE Zeilen kommen nacheinander (`--ru-n`); was dastand, bleibt. */
  const stagger = (liste: HTMLElement, zeilen: HTMLElement[], schluessel: string[]): void => {
    const vorher = gesehen.get(liste);
    const jetzt = new Set<string>();
    const ruhe = ruhig();
    let n = 0;
    zeilen.forEach((z, k) => {
      const s = schluessel[k] ?? String(k);
      jetzt.add(s);
      if (ruhe || vorher?.has(s)) return;
      if (n < 10) { z.classList.add('ru-kommt'); z.style.setProperty('--ru-n', String(n)); }
      n++;
    });
    gesehen.set(liste, jetzt);
  };

  /** Aus dem Knopf aufgehen, auf `--feder-sanft` (E702). Die Scheibe per
   *  `transform`; nur ihr Inhalt blendet (Glas, E703). */
  const growFrom = (fenster: HTMLElement, anker: DOMRect | null | undefined): Animation | null => {
    if (!anker || !anker.width || !anker.height || ruhig()) return null;
    const { easing, duration } = RedionSpring.token('smooth');
    if (!(duration > 2)) return null;
    /* Erst die eigene Ankunft ab, dann messen (`glas-ankunft` verschöbe es). */
    fenster.classList.add('ru-waechst');
    const r = fenster.getBoundingClientRect();
    if (!r.width || !r.height) return null;
    fenster.style.transformOrigin = '0 0';
    const von = 'translate(' + (anker.left - r.left).toFixed(1) + 'px,' + (anker.top - r.top).toFixed(1) + 'px)'
      + ' scale(' + (anker.width / r.width).toFixed(4) + ',' + (anker.height / r.height).toFixed(4) + ')';
    const inhalt = Math.min(duration, 460);
    Array.from(fenster.children).forEach(k => {
      if (k instanceof HTMLElement) k.animate([{ opacity: 0 }, { opacity: 0, offset: 0.3 }, { opacity: 1 }],
        { duration: inhalt, easing: 'linear' });
    });
    return fenster.animate([{ transform: von }, { transform: 'none' }], { duration, easing });
  };

  /* DER EINE GOO-FILTER (E711, Szene 08): verwischen, dann Alpha steil
     (×18 − 7) — Flächen bekommen Hälse. EIN Filter im Dokument, an EINER
     Ebene nur, solange sie fliesst; nie animiert; ruhig: keiner. */
  const SVG = 'http://www.w3.org/2000/svg';
  const gooFilter = (): void => {
    if (document.getElementById('ru-goo')) return;
    const svg = document.createElementNS(SVG, 'svg');
    svg.setAttribute('id', 'ru-goo-svg');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('width', '0');
    svg.setAttribute('height', '0');
    svg.setAttribute('focusable', 'false');
    const filter = document.createElementNS(SVG, 'filter');
    filter.setAttribute('id', 'ru-goo');
    filter.setAttribute('color-interpolation-filters', 'sRGB');
    const blur = document.createElementNS(SVG, 'feGaussianBlur');
    blur.setAttribute('in', 'SourceGraphic');
    blur.setAttribute('stdDeviation', '8');
    blur.setAttribute('result', 'weich');
    const matrix = document.createElementNS(SVG, 'feColorMatrix');
    matrix.setAttribute('in', 'weich');
    matrix.setAttribute('mode', 'matrix');
    matrix.setAttribute('values', '1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7');
    matrix.setAttribute('result', 'goo');
    const oben = document.createElementNS(SVG, 'feComposite');
    oben.setAttribute('in', 'SourceGraphic');
    oben.setAttribute('in2', 'goo');
    oben.setAttribute('operator', 'atop');
    filter.append(blur, matrix, oben);
    svg.appendChild(filter);
    document.body.appendChild(svg);
  };
  /** Die Ebene fliesst (an) oder ruht (aus). Gibt zurück, ob sie fliesst. */
  const goo = (ebene: HTMLElement, an: boolean): boolean => {
    if (!an || ruhig()) { ebene.classList.remove('ru-goo-an'); return false; }
    gooFilter();
    ebene.classList.add('ru-goo-an');
    return true;
  };

  return {
    folge, fliege, setze, stand, ziehbar, ruhig,
    glide, highlight, stagger, growFrom, goo,
    druecke: { ein: drueckeEin, los: lasseLos },
    FEDERN, DAUER, OMEGA, DEHNUNG_MAX
  };
})();

(window as any).SelectionFlow = SelectionFlow;
