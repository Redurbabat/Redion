"use strict";
/* ============================================================================
 * bereiche/bloecke/arten/schaltplan.ts — Schaltpläne zeichnen
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/bereiche/bloecke/arten/schaltplan.ts`. `npm run bauen:ts`
 * schreibt daraus `quell/bereiche/bloecke/arten/schaltplan.js`.
 * ----------------------------------------------------------------------------
 * EIN SCHALTPLAN IST EIN NORMALER BLOCK
 *
 * Kein zweites Dokumentmodell, keine eigene Datei, kein eigener Speicher: der
 * Plan liegt in `block.plan` und läuft damit durch Papierkorb, Sicherung,
 * Wiederherstellung, Versionen und den optionalen Abgleich wie jeder andere
 * Block. Das ist dieselbe Entscheidung wie beim Whiteboard (E138) und der
 * Grund, warum ein Schaltplan in einer `.redion`-Sicherung einfach mitkommt,
 * ohne dass jemand daran gedacht haben muss.
 *
 * DIE SYMBOLE STEHEN NICHT HIER. Sie stehen in `register/fachzeichen.js`, und
 * dieser Editor kennt nur deren Kennungen. Eine zweite Symbolliste neben dem
 * Register wäre L34 in gross: sie würde auseinanderlaufen, und niemand
 * bemerkte es, bis ein Plan ein Symbol zeigt, das der Lernmodus nicht kennt.
 *
 * WAS IM PLAN STEHT
 *
 *   art        welcher Plantyp — Stromlauf, Installation, Klemmen, …
 *   teile      die gesetzten Symbole: Kennung, Ort, Drehung, Betriebsmittel
 *   leitungen  die Verbindungen, als Liste von Rasterpunkten
 *   texte      freie Beschriftungen
 *   ebenen     Aufgabe und Lösung getrennt ein- und ausblendbar
 *
 * ALLES RASTET EIN. Symbole und Leitungspunkte liegen auf Vielfachen von
 * `Register.fachzeichen.RASTER`. Das ist keine Bequemlichkeit, sondern die
 * Bedingung dafür, dass eine Leitung einen Anschluss überhaupt TRIFFT — ohne
 * Raster müsste man auf den Pixel genau zielen, und ein Plan mit Leitungen,
 * die fast am Anschluss enden, sieht richtig aus und ist es nicht.
 * ==========================================================================*/
const Schaltplan = (() => {
    const esc = (s) => String(s ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    const R = () => (typeof Register !== 'undefined' && Register.fachzeichen)
        ? Register.fachzeichen.RASTER : 10;
    /** Auf das Raster runden — die eine Stelle, an der das passiert. */
    const rasten = (v) => Math.round(v / R()) * R();
    /** Zahl mit Vorsatz. Die Regel steht in `Stromfluss`; hier nur der Zugang. */
    const zeigeZahl = (wert, einheit) => (typeof Stromfluss !== 'undefined' && Stromfluss.zeige)
        ? Stromfluss.zeige(wert, einheit)
        : `${wert} ${einheit}`;
    /* ------------------------------------------------------------------------
     * DIE PLANARTEN (Punkte 31–40)
     * ------------------------------------------------------------------------
     * Sie unterscheiden sich nicht im Speicherformat — ein Plan ist ein Plan —,
     * sondern in dem, was sie VORSCHLAGEN: welche Symbolgruppen oben stehen,
     * ob Stromschienen vorgezeichnet werden, wie das Blatt liegt. Eine eigene
     * Datenform je Art hätte zehn Formate ergeben, die alle dasselbe können.
     * ----------------------------------------------------------------------*/
    const ARTEN = [
        { id: 'stromlauf-aufgeloest', name: 'Stromlaufplan, aufgelöst',
            erklaerung: 'Jeder Stromkreis für sich, von oben nach unten. Kontakte stehen dort, wo sie wirken — nicht beim Gerät.',
            gruppen: ['kontakte', 'schalter', 'relais', 'schutz', 'melder'], schienen: 'steuer' },
        { id: 'stromlauf-zusammenhaengend', name: 'Stromlaufplan, zusammenhängend',
            erklaerung: 'Alle Teile eines Geräts stehen beieinander. Übersichtlich bei kleinen Schaltungen.',
            gruppen: ['relais', 'kontakte', 'schalter', 'motoren'], schienen: 'steuer' },
        { id: 'hauptstromkreis', name: 'Hauptstromkreis',
            erklaerung: 'Der Leistungsteil: Zuleitung, Schutz, Schütz, Motor. Drei Aussenleiter.',
            gruppen: ['schutz', 'relais', 'motoren', 'leitungen'], schienen: 'haupt' },
        { id: 'installationsplan', name: 'Installationsplan',
            erklaerung: 'Was wo im Raum sitzt — Leuchten, Schalter, Steckdosen im Grundriss.',
            gruppen: ['schalter', 'melder', 'stecker'], schienen: 'keine', quer: true },
        { id: 'uebersichtsplan', name: 'Übersichtsplan',
            erklaerung: 'Die Anlage grob, einpolig gezeichnet. Für den ersten Blick.',
            gruppen: ['schutz', 'motoren', 'quellen'], schienen: 'keine' },
        { id: 'klemmenplan', name: 'Klemmenplan',
            erklaerung: 'Welche Ader auf welche Klemme. Die Trennstelle zwischen Schrank und Anlage.',
            gruppen: ['stecker', 'leitungen'], schienen: 'keine' },
        { id: 'verdrahtungsplan', name: 'Verdrahtungsplan',
            erklaerung: 'Wie im Schrank wirklich verdrahtet wird — Ader für Ader.',
            gruppen: ['stecker', 'relais', 'schutz'], schienen: 'keine' },
        { id: 'anschlussplan', name: 'Anschlussplan',
            erklaerung: 'Die äusseren Anschlüsse eines Geräts, ohne sein Innenleben.',
            gruppen: ['motoren', 'stecker', 'leitungen'], schienen: 'keine' },
        { id: 'blockschaltbild', name: 'Blockschaltbild',
            erklaerung: 'Baugruppen als Kästen mit Pfeilen dazwischen. Wirkung statt Verdrahtung.',
            gruppen: ['quellen', 'motoren', 'messen'], schienen: 'keine', quer: true },
        { id: 'funktionsplan', name: 'Funktionsplan',
            erklaerung: 'Was die Steuerung tun soll, als Ablauf — noch ohne Bauteile.',
            gruppen: ['kontakte', 'relais'], schienen: 'keine', quer: true },
        { id: 'aufbauplan', name: 'Schaltschrank-Aufbau',
            erklaerung: 'Wo im Schrank welches Gerät sitzt. Massstäblich auf der Hutschiene.',
            gruppen: ['schutz', 'relais', 'stecker'], schienen: 'keine', quer: true }
    ];
    const artVon = (id) => ARTEN.find(a => a.id === id) || ARTEN[0];
    /* ------------------------------------------------------------------------
     * EBENEN (Punkte 48, 49)
     * ------------------------------------------------------------------------
     * Zwei genügen und sind der ganze Zweck: was die Aufgabe stellt, und was
     * man selbst gelöst hat. Wer die Lösung ausblendet, sieht wieder die reine
     * Aufgabe — ohne dass etwas gelöscht wurde und ohne zweite Datei.
     * ----------------------------------------------------------------------*/
    const EBENEN_VORGABE = [
        { id: 'plan', name: 'Plan', farbe: 'var(--text)', sichtbar: true },
        { id: 'aufgabe', name: 'Aufgabe', farbe: '#c2410c', sichtbar: true },
        { id: 'loesung', name: 'Lösung', farbe: '#15803d', sichtbar: true }
    ];
    /* Kennungen kommen aus `core/helpers/ids.js` — dieselben wie überall sonst,
       damit ein Planteil in einer Sicherung nicht anders aussieht als ein Block. */
    const uid = () => (typeof Ids !== 'undefined' && Ids.short)
        ? 'sp' + Ids.short()
        : 'sp' + Math.floor(performance.now() * 1000).toString(36);
    /** Ein leerer Plan der gewünschten Art. */
    const neuerPlan = (art = 'stromlauf-aufgeloest') => {
        const a = artVon(art);
        return {
            art: a.id,
            breite: a.quer ? 1000 : 800,
            hoehe: a.quer ? 600 : 700,
            teile: [], leitungen: [], texte: [],
            ebenen: EBENEN_VORGABE.map(e => ({ ...e }))
        };
    };
    /**
     * Den Plan aus einem Block lesen — und dabei heilen.
     *
     * Ein Block kann aus einer alten Sicherung kommen, aus einem Import oder
     * aus einer Fassung, die es noch nicht gab. Statt bei fehlenden Feldern zu
     * werfen, werden sie ergänzt: ein Plan ohne Ebenen bekommt die Vorgabe, ein
     * Teil ohne Drehung steht auf null. Ein Editor, der an einem alten Plan
     * abstürzt, ist schlimmer als einer, der ihn ergänzt.
     */
    const lesen = (block) => {
        const roh = (block && block.plan) || {};
        const a = artVon(String(roh.art || ''));
        return {
            art: a.id,
            breite: Number(roh.breite) || (a.quer ? 1000 : 800),
            hoehe: Number(roh.hoehe) || (a.quer ? 600 : 700),
            teile: (Array.isArray(roh.teile) ? roh.teile : []).map((t) => ({
                id: String(t.id || uid()),
                zeichen: String(t.zeichen || ''),
                x: rasten(Number(t.x) || 0), y: rasten(Number(t.y) || 0),
                drehung: Number(t.drehung) || 0,
                gespiegelt: !!t.gespiegelt,
                bmk: String(t.bmk || ''),
                nummern: (t.nummern && typeof t.nummern === 'object') ? t.nummern : {},
                gruppe: String(t.gruppe || ''),
                ebene: String(t.ebene || 'plan')
            })).filter((t) => t.zeichen),
            leitungen: (Array.isArray(roh.leitungen) ? roh.leitungen : []).map((l) => ({
                id: String(l.id || uid()),
                punkte: (Array.isArray(l.punkte) ? l.punkte : [])
                    .map((p) => ({ x: rasten(Number(p.x) || 0), y: rasten(Number(p.y) || 0) })),
                ebene: String(l.ebene || 'plan'),
                vonTeil: l.vonTeil ? String(l.vonTeil) : undefined,
                vonNr: l.vonNr ? String(l.vonNr) : undefined,
                nachTeil: l.nachTeil ? String(l.nachTeil) : undefined,
                nachNr: l.nachNr ? String(l.nachNr) : undefined
            })).filter((l) => l.punkte.length >= 2),
            texte: (Array.isArray(roh.texte) ? roh.texte : []).map((x) => ({
                id: String(x.id || uid()),
                x: rasten(Number(x.x) || 0), y: rasten(Number(x.y) || 0),
                t: String(x.t || ''), ebene: String(x.ebene || 'plan')
            })).filter((x) => x.t),
            ebenen: (Array.isArray(roh.ebenen) && roh.ebenen.length
                ? roh.ebenen.map((e) => ({
                    id: String(e.id || 'plan'), name: String(e.name || 'Plan'),
                    farbe: String(e.farbe || 'var(--text)'), sichtbar: e.sichtbar !== false
                }))
                : EBENEN_VORGABE.map(e => ({ ...e })))
        };
    };
    /* ------------------------------------------------------------------------
     * DIE FORTLAUFENDE NUMMERIERUNG (Punkt 20)
     * ------------------------------------------------------------------------
     * Ein neues Schütz heisst K1, das nächste K2. Der Buchstabe kommt aus dem
     * Register (`kennbuchstabe`), die Zahl aus dem Plan: die kleinste, die noch
     * frei ist. NICHT „Anzahl plus eins" — wer K2 löscht und ein neues Schütz
     * setzt, bekäme sonst noch einmal K3, und im Plan fehlte K2 für immer.
     * ----------------------------------------------------------------------*/
    const naechstesBmk = (plan, zeichenId) => {
        const z = (typeof Register !== 'undefined' && Register.fachzeichen)
            ? Register.fachzeichen.holen(zeichenId) : null;
        const buchstabe = (z && z.kennbuchstabe) || '';
        if (!buchstabe)
            return '';
        const belegt = new Set();
        plan.teile.forEach(t => {
            const m = /^([A-Za-z]+)(\d+)$/.exec(t.bmk || '');
            if (m && m[1] === buchstabe)
                belegt.add(Number(m[2]));
        });
        let n = 1;
        while (belegt.has(n))
            n++;
        return buchstabe + n;
    };
    /* ------------------------------------------------------------------------
     * WO LIEGT EIN ANSCHLUSS AUF DER FLÄCHE
     * ------------------------------------------------------------------------
     * Die Drehung rechnet das Register (`anschlussLage`); hier kommt nur die
     * Lage des Teils dazu. Zwei Stellen, eine Rechnung.
     * ----------------------------------------------------------------------*/
    const anschlussOrt = (t, nr) => {
        if (typeof Register === 'undefined' || !Register.fachzeichen)
            return null;
        const lage = Register.fachzeichen.anschlussLage(t.zeichen, nr, t.drehung, t.gespiegelt);
        if (!lage)
            return null;
        return { x: t.x + lage.x, y: t.y + lage.y };
    };
    /** Alle Anschlüsse eines Teils mit ihrer Lage — für Einrasten und Anzeige. */
    const anschluesseVon = (t) => {
        if (typeof Register === 'undefined' || !Register.fachzeichen)
            return [];
        const z = Register.fachzeichen.holen(t.zeichen);
        if (!z)
            return [];
        return z.anschluesse.map((a) => {
            const o = anschlussOrt(t, a.nr);
            return { nr: a.nr, anzeige: t.nummern[a.nr] ?? a.nr, x: o ? o.x : t.x, y: o ? o.y : t.y };
        });
    };
    /**
     * Der nächste Anschluss zu einem Punkt, wenn er nahe genug ist (Punkt 23).
     *
     * `FANG` ist bewusst gross: eine Maus trifft einen 10-px-Punkt nicht
     * zuverlässig, und ein Finger schon gar nicht. Lieber ein Anschluss zu
     * viel gefangen als eine Leitung, die daneben endet und im Bild aussieht,
     * als wäre sie angeschlossen.
     */
    const FANG = 14;
    const fangeAnschluss = (plan, p) => {
        let beste = null;
        let weite = FANG * FANG;
        plan.teile.forEach(t => anschluesseVon(t).forEach(a => {
            const d = (a.x - p.x) * (a.x - p.x) + (a.y - p.y) * (a.y - p.y);
            if (d <= weite) {
                weite = d;
                beste = { teil: t.id, nr: a.nr, x: a.x, y: a.y };
            }
        }));
        return beste;
    };
    /* ------------------------------------------------------------------------
     * RECHTWINKLIG FÜHREN (Punkt 14)
     * ------------------------------------------------------------------------
     * Zwischen zwei Punkten gibt es zwei rechtwinklige Wege: erst waagrecht,
     * dann senkrecht — oder umgekehrt. Genommen wird der, der zuerst in die
     * LÄNGERE Richtung läuft. Das trifft, was man beim Zeichnen erwartet: ein
     * weit rechts liegender Anschluss wird waagrecht angefahren, ein weit
     * unten liegender senkrecht.
     * ----------------------------------------------------------------------*/
    const rechtwinklig = (a, b) => {
        if (a.x === b.x || a.y === b.y)
            return [a, b];
        const waagrechtZuerst = Math.abs(b.x - a.x) >= Math.abs(b.y - a.y);
        const ecke = waagrechtZuerst ? { x: b.x, y: a.y } : { x: a.x, y: b.y };
        return [a, ecke, b];
    };
    /* ------------------------------------------------------------------------
     * VERBINDUNGSPUNKTE UND KREUZUNGEN (Punkte 15, 16)
     * ------------------------------------------------------------------------
     * Der Unterschied ist der wichtigste im ganzen Plan: mit Punkt sind die
     * Leitungen verbunden, ohne kreuzen sie sich nur. Wer ihn nicht sieht,
     * liest die Schaltung falsch.
     *
     * Ein Punkt wird gezeichnet, wo ein Leitungsende oder ein Knick auf einer
     * ANDEREN Leitung liegt — dort ist die Verbindung gewollt. Wo sich zwei
     * Strecken bloss überschneiden, ohne dass eine dort endet oder knickt,
     * entsteht KEIN Punkt: das ist eine Kreuzung, und sie bekommt stattdessen
     * eine Lücke in der waagrechten Leitung.
     * ----------------------------------------------------------------------*/
    const aufStrecke = (p, a, b) => {
        if (a.x === b.x)
            return p.x === a.x && p.y > Math.min(a.y, b.y) && p.y < Math.max(a.y, b.y);
        if (a.y === b.y)
            return p.y === a.y && p.x > Math.min(a.x, b.x) && p.x < Math.max(a.x, b.x);
        return false;
    };
    const verbindungspunkte = (plan) => {
        const raus = [];
        const schon = new Set();
        const merke = (p) => {
            const k = p.x + ':' + p.y;
            if (!schon.has(k)) {
                schon.add(k);
                raus.push(p);
            }
        };
        plan.leitungen.forEach(l => {
            l.punkte.forEach((p, i) => {
                /* Nur Enden und Knicke zählen — ein Punkt mitten in der eigenen
                   geraden Strecke ist kein Anschluss, sondern ein Zwischenpunkt. */
                const istEnde = i === 0 || i === l.punkte.length - 1;
                const istKnick = !istEnde;
                if (!istEnde && !istKnick)
                    return;
                plan.leitungen.forEach(andere => {
                    if (andere.id === l.id)
                        return;
                    for (let k = 0; k + 1 < andere.punkte.length; k++) {
                        if (aufStrecke(p, andere.punkte[k], andere.punkte[k + 1])) {
                            merke(p);
                            return;
                        }
                    }
                });
            });
        });
        /* Und wo drei oder mehr Leitungen denselben Endpunkt teilen. */
        const zaehler = new Map();
        plan.leitungen.forEach(l => [l.punkte[0], l.punkte[l.punkte.length - 1]].forEach(p => {
            if (!p)
                return;
            const k = p.x + ':' + p.y;
            zaehler.set(k, (zaehler.get(k) || 0) + 1);
        }));
        zaehler.forEach((n, k) => {
            if (n < 3)
                return;
            const [x, y] = k.split(':').map(Number);
            merke({ x: x, y: y });
        });
        return raus;
    };
    /**
     * Wo kreuzen sich zwei Leitungen, OHNE verbunden zu sein (Punkt 16)?
     *
     * Genau dort, wo eine waagrechte und eine senkrechte Strecke sich schneiden
     * und an dieser Stelle kein Verbindungspunkt liegt. Gezeichnet wird die
     * Lücke in der waagrechten — so herum ist es üblich, und wichtiger: immer
     * gleich, damit ein Plan nicht mal so und mal so aussieht.
     */
    const kreuzungen = (plan) => {
        const punkte = new Set(verbindungspunkte(plan).map(p => p.x + ':' + p.y));
        const raus = [];
        const strecken = [];
        plan.leitungen.forEach(l => {
            for (let i = 0; i + 1 < l.punkte.length; i++)
                strecken.push({ a: l.punkte[i], b: l.punkte[i + 1], id: l.id });
        });
        strecken.forEach(s1 => {
            if (s1.a.y !== s1.b.y)
                return; /* nur waagrechte */
            strecken.forEach(s2 => {
                if (s2.id === s1.id || s2.a.x !== s2.b.x)
                    return; /* nur senkrechte */
                const x = s2.a.x, y = s1.a.y;
                const imX = x > Math.min(s1.a.x, s1.b.x) && x < Math.max(s1.a.x, s1.b.x);
                const imY = y > Math.min(s2.a.y, s2.b.y) && y < Math.max(s2.a.y, s2.b.y);
                if (imX && imY && !punkte.has(x + ':' + y))
                    raus.push({ x, y });
            });
        });
        return raus;
    };
    /* ------------------------------------------------------------------------
     * DAS BILD
     * ----------------------------------------------------------------------*/
    /** Die Leitung als Pfad — mit Lücken an jeder Kreuzung ohne Verbindung. */
    const leitungPfad = (l, luecken) => {
        const teile = [];
        for (let i = 0; i + 1 < l.punkte.length; i++) {
            const a = l.punkte[i], b = l.punkte[i + 1];
            if (a.y !== b.y) {
                teile.push(`M${a.x},${a.y} L${b.x},${b.y}`);
                continue;
            }
            /* Waagrechte Strecke: die Lücken der Reihe nach aussparen. */
            const drin = luecken.filter(p => p.y === a.y &&
                p.x > Math.min(a.x, b.x) && p.x < Math.max(a.x, b.x))
                .map(p => p.x).sort((x, y) => (a.x < b.x ? x - y : y - x));
            let von = a.x;
            const schritt = a.x < b.x ? 1 : -1;
            drin.forEach(x => {
                teile.push(`M${von},${a.y} L${x - 5 * schritt},${a.y}`);
                von = x + 5 * schritt;
            });
            teile.push(`M${von},${a.y} L${b.x},${b.y}`);
        }
        return teile.join(' ');
    };
    const alsSvg = (plan, opt = {}) => {
        const sichtbar = (ebene) => {
            if (opt.nurEbenen)
                return opt.nurEbenen.includes(ebene);
            const e = plan.ebenen.find(x => x.id === ebene);
            return !e || e.sichtbar;
        };
        const farbeVon = (ebene) => (plan.ebenen.find(x => x.id === ebene) || { farbe: 'var(--text)' }).farbe;
        const teile = [];
        /* Raster (Punkt 21) — als Muster, damit auch ein grosser Plan schnell
           zeichnet. Ein Punkt je Rasterzelle statt tausend einzelner Kreise. */
        if (opt.raster !== false) {
            teile.push(`<defs><pattern id="sp-raster" width="${R()}" height="${R()}" patternUnits="userSpaceOnUse">` +
                `<circle cx="0.5" cy="0.5" r="0.7" fill="currentColor" opacity=".22"/></pattern></defs>` +
                `<rect width="${plan.breite}" height="${plan.hoehe}" fill="url(#sp-raster)"/>`);
        }
        /* Der Lichtschein einer leuchtenden Lampe. Einmal erklärt, überall
           benutzt — hundert einzelne Verläufe wären hundertmal dieselbe
           Rechenarbeit für den Browser. */
        if (opt.strom)
            teile.push(`<defs><radialGradient id="sp-schein">` +
                `<stop offset="0%" stop-color="var(--sp-schein, #ffd54a)" stop-opacity=".85"/>` +
                `<stop offset="60%" stop-color="var(--sp-schein, #ffd54a)" stop-opacity=".25"/>` +
                `<stop offset="100%" stop-color="var(--sp-schein, #ffd54a)" stop-opacity="0"/>` +
                `</radialGradient></defs>`);
        const luecken = kreuzungen(plan);
        /* Wie schnell die Striche laufen sollen. Der Strom spannt viele
           Grössenordnungen — von der Meldeleuchte mit 10 mA bis zum Motor mit
           10 A —, deshalb geht die Geschwindigkeit über den Logarithmus. Linear
           stünde die Meldeleuchte still, während der Motor flimmert. */
        const tempo = (strom, max) => {
            if (!(strom > 0) || !(max > 0))
                return 0;
            const anteil = Math.log10(1 + strom * 1000) / Math.log10(1 + max * 1000);
            return 1.6 - 1.25 * Math.max(0, Math.min(1, anteil)); /* Sekunden je Runde */
        };
        /* Leitungen zuerst — Symbole liegen darüber und decken die Enden sauber ab. */
        plan.leitungen.forEach(l => {
            if (!sichtbar(l.ebene))
                return;
            const d = leitungPfad(l, luecken);
            if (!d)
                return;
            const gewaehlt = opt.auswahl && opt.auswahl.has(l.id);
            teile.push(`<path class="sp-leitung${gewaehlt ? ' sp-gewaehlt' : ''}" data-id="${esc(l.id)}" ` +
                `d="${d}" fill="none" stroke="${farbeVon(l.ebene)}" stroke-width="2" ` +
                `stroke-linecap="round"/>`);
            /* Und darüber, wenn die Simulation läuft, der fliessende Strich.
               Er ersetzt die Leitung nicht, sondern legt sich darauf: bleibt die
               Bewegung aus (Systemeinstellung „weniger Bewegung"), ist die Leitung
               immer noch als stromführend zu erkennen — an der Strichelung, nicht
               nur an der Farbe. §38 verlangt genau das. */
            if (!opt.strom)
                return;
            const netz = opt.strom.leitungNetz[l.id];
            if (typeof netz !== 'number')
                return;
            const i = opt.strom.netzStrom[netz] || 0;
            if (!(i > 1e-9))
                return;
            const s = tempo(i, opt.strom.maxStrom);
            teile.push(`<path class="sp-fluss" data-id="${esc(l.id)}" d="${d}" fill="none" ` +
                `stroke-width="3" stroke-linecap="butt" ` +
                `style="animation-duration:${s.toFixed(2)}s"><title>${zeigeZahl(i, 'A')}</title></path>`);
        });
        /* Verbindungspunkte (Punkt 15) */
        verbindungspunkte(plan).forEach(p => teile.push(`<circle class="sp-knoten" cx="${p.x}" cy="${p.y}" r="4" fill="currentColor"/>`));
        /* Symbole */
        plan.teile.forEach(t => {
            if (!sichtbar(t.ebene))
                return;
            const farbe = farbeVon(t.ebene);
            const svg = (typeof Register !== 'undefined' && Register.fachzeichen)
                ? Register.fachzeichen.alsSvg(t.zeichen, {
                    farbe, drehung: t.drehung, gespiegelt: t.gespiegelt
                })
                : '';
            if (!svg)
                return;
            const innen = svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
            const gewaehlt = opt.auswahl && opt.auswahl.has(t.id);
            const mass = Register.fachzeichen.masse(t.zeichen, 0);
            /* Was die Simulation über dieses Bauteil weiss. */
            const w = opt.strom ? opt.strom.werte[t.id] : undefined;
            const vh = (typeof Stromfluss !== 'undefined' && Stromfluss.verhalten)
                ? Stromfluss.verhalten(t.zeichen) : null;
            /* Leuchtet es? Der Schein sitzt UNTER dem Symbol, damit die Linien
               darüber lesbar bleiben. Die Stärke folgt der Leistung, nicht dem
               Strom — eine Lampe an halber Spannung ist ein Viertel so hell, und
               genau das soll man an der Reihenschaltung sehen können. */
            let schein = '';
            if (w && typeof w.helligkeit === 'number' && w.helligkeit > 0.01) {
                const h = Math.min(1, w.helligkeit);
                schein = `<circle class="sp-leuchtet" cx="${mass.w / 2}" cy="${mass.h / 2}" ` +
                    `r="${Math.max(mass.w, mass.h) * 0.75}" fill="url(#sp-schein)" ` +
                    `stroke="none" opacity="${(0.25 + 0.65 * h).toFixed(2)}"/>`;
            }
            /* Messwerte anschreiben. Beim Messgerät steht der Wert, den es misst;
               bei allem anderen Spannung und Strom, weil das die zwei Zahlen sind,
               nach denen in jeder Aufgabe gefragt wird. */
            let anzeige = '';
            if (w && opt.messwerte !== false && opt.strom) {
                const art = vh ? vh.art : '';
                const zeilen = art === 'volt' ? [zeigeZahl(Math.abs(w.U), 'V')]
                    : art === 'ampere' ? [zeigeZahl(Math.abs(w.I), 'A')]
                        : art === 'quelle' ? [zeigeZahl(Math.abs(w.U), 'V'), zeigeZahl(Math.abs(w.I), 'A')]
                            : (art === 'widerstand' || art === 'spule')
                                ? [zeigeZahl(Math.abs(w.U), 'V'), zeigeZahl(Math.abs(w.I), 'A'),
                                    zeigeZahl(w.P, 'W')]
                                : [];
                anzeige = zeilen.map((s, i) => `<text class="sp-messwert" x="${mass.w / 2}" y="${mass.h + 14 + i * 12}" ` +
                    `text-anchor="middle" font-size="10" stroke="none">${esc(s)}</text>`).join('');
            }
            teile.push(`<g class="sp-teil${gewaehlt ? ' sp-gewaehlt' : ''}` +
                `${w && w.fliesst ? ' sp-fuehrt' : ''}` +
                `${opt.hervor === t.id ? ' sp-gesucht' : ''}" data-id="${esc(t.id)}" ` +
                `transform="translate(${t.x} ${t.y})" fill="none" stroke="${farbe}" ` +
                `stroke-width="2" stroke-linecap="round" stroke-linejoin="round">` +
                /* Eine unsichtbare Fläche, damit auch die Lücken im Symbol greifbar
                   sind — ein Kontakt besteht fast nur aus Linien, und Linien trifft
                   man mit dem Finger nicht. */
                `<rect x="-4" y="-4" width="${mass.w + 8}" height="${mass.h + 8}" ` +
                `fill="transparent" stroke="none"/>` + schein + innen + anzeige +
                (opt.anschluesse ? anschluesseVon(t).map(a => `<circle class="sp-punkt" data-teil="${esc(t.id)}" data-nr="${esc(a.nr)}" ` +
                    `cx="${a.x - t.x}" cy="${a.y - t.y}" r="4" fill="${farbe}" stroke="none" opacity=".5"/>`).join('') : '') +
                (opt.nummern ? anschluesseVon(t).map(a => `<text x="${a.x - t.x + 6}" y="${a.y - t.y - 4}" font-size="9" fill="${farbe}" ` +
                    `stroke="none" opacity=".8">${esc(a.anzeige)}</text>`).join('') : '') +
                (opt.bmk !== false && t.bmk
                    ? `<text x="${mass.w + 6}" y="12" font-size="12" fill="${farbe}" stroke="none" ` +
                        `font-weight="600">${esc(t.bmk)}</text>` : '') +
                `</g>`);
        });
        /* Freie Beschriftungen (Punkt 47) */
        plan.texte.forEach(x => {
            if (!sichtbar(x.ebene))
                return;
            teile.push(`<text class="sp-text" data-id="${esc(x.id)}" x="${x.x}" y="${x.y}" ` +
                `font-size="13" fill="${farbeVon(x.ebene)}" stroke="none">${esc(x.t)}</text>`);
        });
        return `<svg class="sp-flaeche" viewBox="0 0 ${plan.breite} ${plan.hoehe}" ` +
            `width="${plan.breite}" height="${plan.hoehe}">` + teile.join('') + '</svg>';
    };
    /* ------------------------------------------------------------------------
     * DIE STROMSCHIENEN
     * ------------------------------------------------------------------------
     * Ein Stromlaufplan beginnt immer gleich: oben L, unten N. Wer das jedes
     * Mal von Hand zieht, verliert Zeit an etwas, das nie anders ist.
     * ----------------------------------------------------------------------*/
    const schienenBauen = (plan) => {
        const a = artVon(plan.art);
        if (!a.schienen || a.schienen === 'keine')
            return;
        const rand = 40;
        const mach = (y, beschriftung) => {
            plan.leitungen.push({
                id: uid(), ebene: 'plan',
                punkte: [{ x: rand, y }, { x: plan.breite - rand, y }]
            });
            plan.texte.push({ id: uid(), x: rand - 26, y: y + 4, t: beschriftung, ebene: 'plan' });
        };
        if (a.schienen === 'steuer') {
            mach(40, 'L1');
            mach(plan.hoehe - 40, 'N');
        }
        else {
            mach(40, 'L1');
            mach(60, 'L2');
            mach(80, 'L3');
            mach(plan.hoehe - 40, 'PE');
        }
    };
    return {
        ARTEN, artVon, EBENEN_VORGABE, neuerPlan, lesen, alsSvg, rasten,
        naechstesBmk, anschlussOrt, anschluesseVon, fangeAnschluss, rechtwinklig,
        verbindungspunkte, kreuzungen, leitungPfad, schienenBauen, uid, esc
    };
})();
window.Schaltplan = Schaltplan;
