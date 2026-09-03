"use strict";
/* ============================================================================
 * core/ink/stroke.js — der nasse Strich: waechst, glaettet, sagt voraus
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/core/ink/stroke.ts`. `npm run bauen:ts` schreibt
 * daraus diese Datei.
 * ==========================================================================*/
const InkStroke = (() => {
    /* --------------------------------------------------------------------- *
     * Rundung und Zahlen — WOERTLICH wie in `InkGeometry`.
     * Eine eigene Rundung waere der sichere Weg zu einem Umriss, der um ein
     * Hundertstel abweicht und beim Absetzen sichtbar springt.
     * --------------------------------------------------------------------- */
    const r2 = (v) => Math.round(v * 100) / 100;
    const endlich = (v) => {
        const n = Number(v);
        return Number.isFinite(n) ? n : 0;
    };
    /* Der Mittelpunkt zweier Punkte, gerundet wie in `seite()`. */
    const mitte = (a, b) => [
        Math.round((a[0] + b[0]) * 50) / 100,
        Math.round((a[1] + b[1]) * 50) / 100
    ];
    const qStueck = (a, b) => {
        const m = mitte(a, b);
        return ` Q${a[0]} ${a[1]} ${m[0]} ${m[1]}`;
    };
    /* ===================================================================== *
     * 1 · DIE FEDER — ein Umriss, der waechst
     * ===================================================================== *
     *
     * `InkGeometry.outline` rechnet den Versatz eines Punktes i aus seinen
     * NACHBARN i-1 und i+1. Damit steht der Versatz von Punkt i erst fest,
     * wenn Punkt i+1 da ist — und das Bogenstueck zwischen i und i+1 erst,
     * wenn i+2 da ist. Die Feder haelt genau diese zwei Punkte Rueckstand
     * offen und friert alles davor ein.
     *
     * Was je Punkt anfaellt: zwei Wurzeln, zwei Zeichenketten, zwei Anhaenge.
     * Was NICHT mehr anfaellt: der ganze Strich.
     * --------------------------------------------------------------------- */
    class Feder {
        /* Die Mittellinie — dieselben Punkte, die auch gespeichert werden. */
        pts = [];
        halb = [];
        /* Die beiden Konturen. `links`/`rechts` werden nur fuer die letzten
           zwei Punkte noch angefasst; alles davor steht fest. */
        links = [];
        rechts = [];
        /* Die eingefrorenen Bogenstuecke. `linksFest[i]` ist das Stueck, das
           `seite(links)` fuer den Index i erzeugt; `rechtsFest[j]` das Stueck,
           das `seite(rueck)` fuer den Ruecklauf bei `rechts[j]` erzeugt. */
        linksFest = [];
        rechtsFest = [];
        /* Bis wohin ist eingefroren (ausschliesslich). */
        fest = 0;
        /* Der nasse Schwanz: gezeichnet, nie gespeichert. */
        nassPts = [];
        nassHalb = [];
        /** Wie viele echte Punkte im Strich stehen. */
        laenge() { return this.pts.length; }
        /** Die Mittellinie, wie sie gespeichert wird — ohne den nassen Schwanz. */
        punkte() { return this.pts.map(p => [p[0], p[1]]); }
        /** Die halben Breiten, in derselben Reihenfolge. */
        breiten() { return this.halb.slice(); }
        /**
         * Ein echter Punkt. `halb` ist die halbe Strichbreite an dieser Stelle —
         * dieselbe Zahl, die `zeichneMarke` fuer den trockenen Strich rechnet.
         */
        punkt(p, halb) {
            this.pts.push([endlich(p[0]), endlich(p[1])]);
            this.halb.push(Math.max(0.15, Number.isFinite(halb) ? halb : 1));
            this.nassPts.length = 0;
            this.nassHalb.length = 0;
            this.nachziehen();
        }
        /**
         * Der nasse Schwanz — die Vorhersage. Ersetzt bei jedem Aufruf den
         * vorigen und geht NIE in `punkte()` ein.
         */
        nass(pts, halb) {
            this.nassPts = pts.map(p => [endlich(p[0]), endlich(p[1])]);
            this.nassHalb = this.nassPts.map((_p, i) => Math.max(0.15, Number.isFinite(halb[i]) ? Number(halb[i]) : (this.halb[this.halb.length - 1] ?? 1)));
        }
        /**
         * Der SVG-Pfad des Umrisses. Zeichengleich mit
         * `InkGeometry.outline(punkte(), breiten())`, solange kein nasser
         * Schwanz gesetzt ist.
         */
        d() {
            const pts = this.nassPts.length ? this.pts.concat(this.nassPts) : this.pts;
            const halb = this.nassHalb.length ? this.halb.concat(this.nassHalb) : this.halb;
            const n = pts.length;
            if (n < 2)
                return '';
            /* Die Kontur der Punkte, die noch nicht feststehen (hoechstens ein
               paar), wird hier frisch gerechnet — der Rest steht schon. */
            const links = this.links.slice(0, Math.max(0, n - 2));
            const rechts = this.rechts.slice(0, Math.max(0, n - 2));
            for (let i = links.length; i < n; i++) {
                const paar = versatz(pts, halb, i, n);
                links.push(paar[0]);
                rechts.push(paar[1]);
            }
            /* Die eingefrorenen Stuecke gelten nur, solange kein nasser Schwanz
               die letzten Punkte verschiebt — und er verschiebt hoechstens die
               letzten zwei, weshalb `fest` nie weiter reicht als n-2. */
            const grenze = Math.min(this.fest, Math.max(0, n - 2));
            let linksTeil = this.linksFest.slice(0, grenze).join('');
            for (let i = Math.max(1, grenze); i <= n - 2; i++)
                linksTeil += qStueck(links[i], links[i + 1]);
            if (n === 2)
                linksTeil = ` L${links[1][0]} ${links[1][1]}`;
            else
                linksTeil += ` L${links[n - 1][0]} ${links[n - 1][1]}`;
            /* Der Ruecklauf laeuft von hinten nach vorn: das Stueck bei `rechts[j]`
               zeigt auf `rechts[j-1]`, und die Reihenfolge ist absteigend. */
            let rechtsTeil = '';
            if (n === 2) {
                rechtsTeil = ` L${rechts[0][0]} ${rechts[0][1]}`;
            }
            else {
                const spaet = [];
                for (let j = n - 2; j >= Math.max(1, grenze); j--)
                    spaet.push(qStueck(rechts[j], rechts[j - 1]));
                rechtsTeil = spaet.join('') + this.rechtsFest.slice(1, Math.max(1, grenze)).reverse().join('') +
                    ` L${rechts[0][0]} ${rechts[0][1]}`;
            }
            const anfang = halbAn(halb, 0);
            const ende = halbAn(halb, n - 1);
            return `M${links[0][0]} ${links[0][1]}` + linksTeil +
                ` A${r2(ende)} ${r2(ende)} 0 0 1 ${rechts[n - 1][0]} ${rechts[n - 1][1]}` +
                rechtsTeil +
                ` A${r2(anfang)} ${r2(anfang)} 0 0 1 ${links[0][0]} ${links[0][1]} Z`;
        }
        /**
         * Der geglaettete Mittellinien-Pfad — fuer Kugelschreiber und Marker,
         * die als Strich (`stroke`) und nicht als Flaeche gezeichnet werden.
         * Zeichengleich mit `InkGeometry.path(punkte())`.
         */
        linie() {
            const pts = this.nassPts.length ? this.pts.concat(this.nassPts) : this.pts;
            const n = pts.length;
            if (!n)
                return '';
            if (n === 1)
                return `M${pts[0][0]} ${pts[0][1]}`;
            if (n === 2)
                return `M${pts[0][0]} ${pts[0][1]} L${pts[1][0]} ${pts[1][1]}`;
            const grenze = Math.min(this.linieFest.length, Math.max(0, n - 2));
            let aus = `M${pts[0][0]} ${pts[0][1]}` + this.linieFest.slice(0, grenze).join('');
            for (let i = Math.max(1, grenze); i < n - 1; i++)
                aus += qStueck(pts[i], pts[i + 1]);
            return aus + ` L${pts[n - 1][0]} ${pts[n - 1][1]}`;
        }
        linieFest = [];
        /* Alles einfrieren, was durch den neuen Punkt endgueltig geworden ist. */
        nachziehen() {
            const n = this.pts.length;
            /* Die Kontur von Punkt i braucht i-1 und i+1; sie steht fest, sobald
               i+1 existiert — also fuer alle i <= n-2. */
            for (let i = this.links.length; i <= n - 2; i++) {
                const paar = versatz(this.pts, this.halb, i, n);
                this.links[i] = paar[0];
                this.rechts[i] = paar[1];
            }
            /* Ein Bogenstueck bei i braucht die Kontur von i und i+1. */
            for (let i = Math.max(1, this.fest); i <= n - 3; i++) {
                this.linksFest[i] = qStueck(this.links[i], this.links[i + 1]);
                this.rechtsFest[i] = qStueck(this.rechts[i], this.rechts[i - 1]);
            }
            this.fest = Math.max(this.fest, Math.max(0, n - 2));
            for (let i = Math.max(1, this.linieFest.length); i <= n - 3; i++) {
                this.linieFest[i] = qStueck(this.pts[i], this.pts[i + 1]);
            }
            if (this.linieFest.length < Math.max(0, n - 2))
                this.linieFest.length = Math.max(0, n - 2);
        }
    }
    const halbAn = (halb, i) => {
        const w = Number(halb[Math.min(i, halb.length - 1)]);
        return Math.max(0.15, Number.isFinite(w) ? w : 1);
    };
    /** Die zwei Konturpunkte zu einem Mittellinienpunkt — Rechnung wie `outline`. */
    const versatz = (pts, halb, i, n) => {
        const prev = pts[Math.max(0, i - 1)];
        const next = pts[Math.min(n - 1, i + 1)];
        let tx = next[0] - prev[0];
        let ty = next[1] - prev[1];
        const len = Math.hypot(tx, ty) || 1;
        tx /= len;
        ty /= len;
        const w = halbAn(halb, i);
        return [
            [r2(pts[i][0] - ty * w), r2(pts[i][1] + tx * w)],
            [r2(pts[i][0] + ty * w), r2(pts[i][1] - tx * w)]
        ];
    };
    /* ===================================================================== *
     * 2 · DER GLAETTER — stark, wo die Hand zittert; schwach, wo sie eilt
     * ===================================================================== *
     *
     * Ein fester Filter kann nur eines von beidem: entweder er nimmt das
     * Zittern weg und der Strich haengt hinter dem Stift, oder er bleibt am
     * Stift und jedes Zittern steht im Papier. Deshalb haengt die Staerke an
     * der Geschwindigkeit.
     *
     * Die drei Zahlen sind gemessen, nicht geraten — `test366` faehrt ein
     * Zittersignal (0,4 px bei 60 Hz) und einen schnellen Zug hindurch und
     * haelt beides fest: das Zittern muss deutlich kleiner werden, der
     * Rueckstand beim schnellen Zug klein bleiben.
     * --------------------------------------------------------------------- */
    const ALPHA_LANGSAM = 0.28; /* bei stehender Hand: viel mitteln */
    const ALPHA_SCHNELL = 0.92; /* im Zug: fast unveraendert durchlassen */
    const TEMPO_VOLL = 1.1; /* px je ms, ab hier gilt ALPHA_SCHNELL */
    /**
     * Ein Glaetter mit Gedaechtnis. Der erste Punkt geht unveraendert durch —
     * ein Strich, der nicht dort beginnt, wo der Stift aufsetzte, ist falsch.
     */
    const glaetter = (start) => {
        let x = endlich(start[0]);
        let y = endlich(start[1]);
        return (p, dt) => {
            const px = endlich(p[0]), py = endlich(p[1]);
            const ms = Math.max(1, Number.isFinite(dt) ? dt : 16);
            const tempo = Math.hypot(px - x, py - y) / ms;
            const teil = Math.min(1, tempo / TEMPO_VOLL);
            const alpha = ALPHA_LANGSAM + (ALPHA_SCHNELL - ALPHA_LANGSAM) * teil;
            x += (px - x) * alpha;
            y += (py - y) * alpha;
            return [x, y];
        };
    };
    /**
     * DER DRUCK BRAUCHT EIN ANDERES WERKZEUG ALS DER ORT — und das war der
     * teuerste Irrtum dieses Bogens.
     *
     * Zuerst stand hier derselbe Filter wie fuer den Ort: ein fester Anteil
     * (0,35) je Punkt. `test343` wurde davon rot, und zu Recht: ein Bogen von
     * 13 Punkten, der von 0,15 auf 0,95 steigt und zurueckfaellt, kam
     * abgeflacht heraus. Der Fueller schwoll nicht mehr an — genau das, was
     * E351 gebaut hatte, war weg.
     *
     * Was hier gebraucht wird, ist kein Mittel, sondern ein MITTLERER WERT:
     * der Median von drei aufeinanderfolgenden Messungen. Er wirft einen
     * einzelnen Ausreisser weg (das ist, was ein zappelnder Sensor liefert)
     * und laesst eine steigende Reihe UNVERAENDERT durch (das ist, was eine
     * druckende Hand liefert). Beides ist geprueft, nicht behauptet.
     *
     * Der Preis ist ein Punkt Verzoegerung. Der ist die Sache wert.
     */
    const druckGlaetter = (start) => {
        const drei = [Number.isFinite(start) ? start : 0.5];
        return (p) => {
            drei.push(Number.isFinite(p) ? p : drei[drei.length - 1]);
            if (drei.length > 3)
                drei.shift();
            if (drei.length < 3)
                return Math.round(drei[drei.length - 1] * 1000) / 1000;
            const sortiert = drei.slice().sort((a, b) => a - b);
            return Math.round(sortiert[1] * 1000) / 1000;
        };
    };
    /* ===================================================================== *
     * 3 · DIE VORHERSAGE — der nasse Schwanz bis zur Spitze
     * ===================================================================== *
     *
     * Zwischen der Bewegung der Hand und dem Bild auf dem Glas liegen immer
     * ein paar Millisekunden. GoodNotes fuellt sie, indem es ein Stueck
     * weiterzeichnet, als ginge es so weiter. Das ist eine Vermutung, und
     * Vermutungen gehoeren gedeckelt:
     *
     *   · hoechstens `VORHER_MS` weit,
     *   · hoechstens `VORHER_PX` lang,
     *   · und bei einer Richtungsaenderung gar nicht — beim Kehren wuerde
     *     der Schwanz nach aussen schiessen und ein Haekchen malen, das
     *     niemand gezogen hat.
     * --------------------------------------------------------------------- */
    const VORHER_MS = 14; /* etwa ein Bild bei 72 Hz */
    const VORHER_PX = 26;
    const KEHRE = 0.55; /* cos der groessten erlaubten Richtungsaenderung */
    /**
     * Ein bis zwei Punkte, die den Strich zur Stiftspitze verlaengern.
     * Leer, wenn zu wenig bekannt ist oder die Richtung gerade kippt.
     *
     * `abstand` ist die gemessene Zeit zwischen den letzten zwei Punkten. Sie
     * MUSS herein: ohne sie waere die Vorhersage in Punkten gerechnet statt in
     * Millisekunden, und derselbe Vorlauf waere bei 60 Hz doppelt so lang wie
     * bei 120 Hz — gemessen 17,5 px statt 8,8 px bei gleichem Zug.
     */
    const vorhersage = (pts, ms = VORHER_MS, abstand = 8) => {
        const n = Array.isArray(pts) ? pts.length : 0;
        if (n < 3)
            return [];
        const a = pts[n - 3], b = pts[n - 2], c = pts[n - 1];
        const v1x = b[0] - a[0], v1y = b[1] - a[1];
        const v2x = c[0] - b[0], v2y = c[1] - b[1];
        const l1 = Math.hypot(v1x, v1y), l2 = Math.hypot(v2x, v2y);
        if (l2 < 0.3)
            return [];
        /* Kippt die Richtung, wird nicht geraten. */
        if (l1 > 0.3 && (v1x * v2x + v1y * v2y) / (l1 * l2) < KEHRE)
            return [];
        const dt = Math.max(1, Number.isFinite(abstand) ? abstand : 8);
        const weit = Math.min(VORHER_PX, l2 * Math.max(0, Math.min(3, ms / dt)));
        if (weit < 0.4)
            return [];
        const ux = v2x / l2, uy = v2y / l2;
        /* Zwei Punkte, der zweite gedaempft — so laeuft der Schwanz aus,
           statt in einer Spitze zu enden. */
        return [
            [r2(c[0] + ux * weit * 0.6), r2(c[1] + uy * weit * 0.6)],
            [r2(c[0] + ux * weit), r2(c[1] + uy * weit)]
        ];
    };
    return { Feder, glaetter, druckGlaetter, vorhersage,
        ALPHA_LANGSAM, ALPHA_SCHNELL, TEMPO_VOLL,
        VORHER_MS, VORHER_PX, KEHRE };
})();
globalThis.InkStroke = InkStroke;
