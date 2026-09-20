"use strict";
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
 * Kritisch gedämpft (ζ = 1), also OHNE Überschwingen — `recipes/spring-
 * profiles.md` nennt das Profil „snappy-control": „Fast settling, almost no
 * overshoot", und `continuous-material-selection.md` verlangt ausdrücklich
 * „avoid large overshoot in productivity UI". Eine untere Leiste ist der Weg,
 * den man hundertmal am Tag geht; sie darf nicht wippen.
 *
 *     x(t) = (x₀ + (v₀ + ω·x₀)·t) · e^(−ω·t)          Abstand zum Ziel
 *     v(t) = e^(−ω·t) · [ (v₀ + ω·x₀)·(1 − ω·t) − ω·x₀ ]
 *
 * `x₀` ist der Startabstand, `v₀` die mitgebrachte Geschwindigkeit. Bei
 * `v₀ = 0` beginnt die Bewegung mit Tempo null, wird schneller, erreicht ihr
 * Höchstmass bei t = 1/ω und läuft aus — genau der Verlauf, den Redur
 * beschrieben hat: „beim Beschleunigen leicht in Bewegungsrichtung stretchen
 * und beim Ankommen wieder kompakter werden."
 *
 * Das Abklingen auf ein halbes Prozent liegt bei ω·t ≈ 7,6. Für die
 * 180–300 ms, die `continuous-material-selection.md` als Zielbereich nennt.
 * Für den mobilen Dock nehmen wir bewusst die sichtbarere obere Hälfte dieses
 * Bereichs: ω = 0,026 ergibt rund 292 ms bis zum halben Prozent. Die vorherigen
 * 230 ms waren in der echten Bildschirmaufnahme trotz korrekter Bewegung zu
 * leicht als harter Zustandswechsel zu lesen.
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
    /** Wie schnell die Feder ausläuft, je Millisekunde. Siehe Kopf. */
    const OMEGA = 0.026;
    /** Abgetastet wird alle 8 ms — bei 120 Hz knapp ein Wert je Bild. */
    const SCHRITT = 8;
    /** Nach 7,6/ω ist sie auf ein halbes Prozent herunter. */
    const DAUER = Math.round(7.6 / OMEGA);
    /**
     * DIE DEHNUNG IST GEDECKELT, UND ZWAR NIEDRIG (E641, Redurs Entscheidung
     * vom 20. September). `recipes/shape-stretch-compress.md`: „Keep
     * deformation subtle. Preserve recognizable control boundaries and avoid
     * cartoon-like elasticity in professional/productivity UI."
     */
    const DEHNUNG_MAX = 0.24;
    /** Aus Geschwindigkeit (px/ms) wird Dehnung. 0,2 · 0,88 px/ms ≈ 0,18. */
    const DEHNUNG_JE_TEMPO = 0.24;
    const laeufe = new WeakMap();
    const ruhig = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    /** Abstand zum Ziel nach `t` Millisekunden. */
    const weg = (l, t) => (l.x0 + (l.v0 + OMEGA * l.x0) * t) * Math.exp(-OMEGA * t);
    /** Geschwindigkeit nach `t` Millisekunden, in px/ms. */
    const tempo = (l, t) => Math.exp(-OMEGA * t) * ((l.v0 + OMEGA * l.x0) * (1 - OMEGA * t) - OMEGA * l.x0);
    /**
     * Die Uhr der laufenden Bewegung.
     *
     * NICHT `performance.now()`: eine Animation, die auf dem Compositor läuft,
     * hat ihre eigene Zeit, und die ist die einzige, die zum gemalten Bild
     * passt. Wer hier die Wanduhr nähme, bekäme beim Umlenken einen Ort, der
     * nie auf dem Bildschirm stand.
     */
    const uhr = (l) => {
        if (!l.anim)
            return 0;
        const t = l.anim.currentTime;
        /* Kein Zahlenwert heisst: die Bewegung ist vorbei oder war nie da.
           Dann zählt das ENDE der Bahn, nicht ihr Anfang — mit 0 stünde hier
           der Startabstand, und die Fläche spränge beim nächsten Wechsel an
           ihren vorletzten Ort zurück. Genau das ist beim Bauen passiert und
           im Film aufgefallen: jeder Wechsel begann bei x = 51. */
        return typeof t === 'number' ? t : DAUER;
    };
    /**
     * Eine Fläche einem Ziel folgen lassen.
     *
     * @param flaeche  die EINE Fläche — sie wird nie ersetzt, nur bewegt.
     * @param ziel     wohin, in Pixeln vom Anfang ihres Behälters (`offsetLeft`).
     * @param nachbar  ob Quelle und Ziel nebeneinanderliegen. Nur dann wird
     *                 gedehnt; `shape-stretch-compress.md` verlangt
     *                 ausdrücklich „Disable deformation for long-distance
     *                 navigation".
     * @param sofort   ohne Bewegung setzen (erster Aufruf, `reduce`).
     */
    const folge = (flaeche, ziel, nachbar, sofort) => {
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
           jedes Mal ihren Schwung. */
        if (alt && alt.ziel === ziel)
            return;
        if (sofort || ruhig()) {
            /* `continuous-material-selection.md`, Abschnitt Reduced motion:
               „Selection changes immediately. Remove travel/stretch and use an
               instant material relocation." */
            alt?.anim?.cancel();
            flaeche.style.transform = 'translateX(' + ziel + 'px)';
            flaeche.style.removeProperty('--dehnung');
            flaeche.classList.remove('faehrt');
            laeufe.set(flaeche, { ziel, x0: 0, v0: 0, start: 0, dehnen: false });
            return;
        }
        /* ══ DER STAND DER LAUFENDEN BEWEGUNG WIRD ÜBERNOMMEN ═══════════════════
         * `recipes/velocity-preserving-springs.md`: „spring transitions should
         * inherit current motion rather than restart from zero velocity."
         *
         * Beides — Ort und Tempo — kommt aus der Federformel selbst, nicht aus
         * `getComputedStyle`. Das ist genauer UND billiger: ein Stilabruf mitten
         * in einer Bewegung erzwingt eine Neuberechnung des Layouts, und genau
         * die soll hier nirgends mehr vorkommen. */
        let jetztOrt = ziel;
        let jetztTempo = 0;
        if (alt) {
            const t = uhr(alt);
            jetztOrt = alt.ziel + weg(alt, t);
            jetztTempo = tempo(alt, t);
        }
        else {
            /* Kein Lauf gemerkt: dann steht sie da, wo der Stil sagt. */
            const m = flaeche.style.transform.match(/translateX\((-?[\d.]+)px\)/);
            jetztOrt = m && m[1] ? Number(m[1]) : ziel;
        }
        alt?.anim?.cancel();
        const l = {
            ziel, x0: jetztOrt - ziel, v0: jetztTempo, start: 0, dehnen: nachbar
        };
        /* Steht sie schon fast und kommt kein Tempo mit: setzen statt bewegen. */
        if (Math.abs(l.x0) < 0.5 && Math.abs(l.v0) < 0.01) {
            flaeche.style.transform = 'translateX(' + ziel + 'px)';
            laeufe.set(flaeche, l);
            return;
        }
        /* ══ DIE BAHN ═════════════════════════════════════════════════════════
         * Einmal gerechnet, dann übergeben. Jeder Keyframe trägt Ort UND
         * Dehnung; beides steckt in `transform`, also bleibt es eine einzige
         * Eigenschaft — der Compositor kann sie allein.
         *
         * `--dehnung` wird NICHT mitanimiert: eine benutzerdefinierte
         * Eigenschaft ist für den Compositor unbekanntes Gelände, und schon
         * eine davon in den Keyframes zöge die ganze Bewegung zurück auf den
         * Hauptfaden. */
        const bilder = [];
        for (let t = 0; t <= DAUER; t += SCHRITT) {
            const ort = ziel + weg(l, t);
            let dehnung = 1;
            if (nachbar) {
                dehnung = 1 + Math.min(DEHNUNG_MAX, Math.abs(tempo(l, t)) * DEHNUNG_JE_TEMPO);
            }
            bilder.push({ transform: 'translateX(' + ort.toFixed(2) + 'px) scaleX(' + dehnung.toFixed(4) + ')' });
        }
        bilder.push({ transform: 'translateX(' + ziel + 'px) scaleX(1)' });
        const anim = flaeche.animate(bilder, { duration: DAUER, easing: 'linear', fill: 'forwards' });
        l.anim = anim;
        laeufe.set(flaeche, l);
        /* WIE OFT SIE GEFLOGEN IST — als Zahl am Element, nicht als Ereignis.
           `transitionstart` gibt es bei der Web-Animations-Schnittstelle nicht,
           und `test114` §17 braucht die Auskunft „beim Start ist sie NICHT
           geflogen". Eine Zahl am Element ist dafür das ehrlichere Mass: sie
           zählt die ABSICHT und hängt an keinem Malen (derselbe Grund, aus dem
           §17 schon einmal von Bildern auf Ereignisse umgestellt wurde). */
        flaeche.dataset['fluege'] = String(Number(flaeche.dataset['fluege'] ?? 0) + 1);
        flaeche.classList.add('faehrt');
        anim.finished.then(() => {
            if (laeufe.get(flaeche)?.anim !== anim)
                return; /* schon umgelenkt */
            flaeche.style.transform = 'translateX(' + ziel + 'px)';
            anim.cancel();
            /* ANGEKOMMEN HEISST: KEIN ABSTAND UND KEIN TEMPO MEHR. Ohne diese
               zwei Zeilen bliebe `x0` auf dem Startabstand der eben beendeten
               Bahn stehen, und der nächste Wechsel begänne dort statt hier. */
            laeufe.set(flaeche, { ziel, x0: 0, v0: 0, start: 0, dehnen: false });
            flaeche.classList.remove('faehrt');
        }).catch(() => { });
    };
    /**
     * Der Fortschritt der Feder, 0 bis 1.
     *
     * DIESELBE FORMEL, NICHT EINE ZWEITE (§8): `weg` wird mit Startabstand −1
     * und Tempo 0 gerufen, und `1 + weg` ist damit genau der Anteil des Weges,
     * der zurückgelegt ist. Eine ausgeschriebene Kopie könnte von der
     * Federformel abweichen, ohne dass es jemand merkt.
     *
     *     t =  20 ms → 0,142      t = 120 ms → 0,905
     *     t =  40 ms → 0,380      t = 230 ms → 0,996
     */
    const fortschritt = (t) => 1 + weg({ ziel: 0, x0: -1, v0: 0, start: 0, dehnen: false }, t);
    /**
     * Ein Element von `von` nach `nach` fliegen lassen.
     *
     * Das Element muss `position:fixed` sein; `nach` und `von` sind
     * Bildschirmmasse (`getBoundingClientRect`). Zurück kommt die Animation,
     * damit der Rufer sie abbrechen oder ihr Ende abwarten kann.
     */
    const fliege = (flaeche, von, nach) => {
        if (!nach.width || !nach.height)
            return null;
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
        const bilder = [];
        for (let t = 0; t <= DAUER; t += SCHRITT) {
            const f = fortschritt(t);
            bilder.push({
                transform: 'translate(' + (dx * (1 - f)).toFixed(2) + 'px,' + (dy * (1 - f)).toFixed(2) + 'px)'
                    + ' scale(' + (1 + (sx - 1) * (1 - f)).toFixed(4) + ',' + (1 + (sy - 1) * (1 - f)).toFixed(4) + ')'
            });
        }
        bilder.push({ transform: 'none' });
        return flaeche.animate(bilder, { duration: DAUER, easing: 'linear', fill: 'forwards' });
    };
    return { folge, fliege, DAUER, OMEGA, DEHNUNG_MAX };
})();
window.SelectionFlow = SelectionFlow;
