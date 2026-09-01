"use strict";
/* ============================================================================
 * core/learning/kompetenz.ts — was jemand WIRKLICH kann, und woher man das weiss
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/core/learning/kompetenz.ts`. `npm run bauen:ts` schreibt
 * daraus `quell/core/learning/kompetenz.js`.
 * ----------------------------------------------------------------------------
 * Redion protokolliert seit E145 JEDE Wiederholung: Kennung, Zeit, Note,
 * Algorithmus, Fehltritt, Zustand davor und danach (`wissen/dienst.ts:132`).
 * Fünfhundert Einträge je Karte. Gelesen hat das bisher niemand — die
 * Statistik zählt Karten, nicht Belege.
 *
 * Diese Datei macht aus dem Protokoll eine Aussage: „Ohmsches Gesetz — stark,
 * aus 47 Antworten der letzten neun Wochen." Der zweite Halbsatz ist der
 * wichtige.
 *
 * ─── WAS AUS RED-KURD KOMMT, UND WAS NICHT ──────────────────────────────────
 *
 * RED-KURD führt ein Fertigkeitsprofil und legt neben jeden Prozentwert die
 * ZAHL DER KARTEN, aus denen er stammt (`erkennen` und `erkennenAnzahl`,
 * `lernstand.d.ts:222`). Das ist die Übernahme: ein Prozentwert ohne seine
 * Grundlage ist eine Behauptung.
 *
 * NICHT übernommen sind die vier Fertigkeiten (erkennen/abrufen/schreiben/
 * hoeren). Sie sind für Vokabeln richtig und für Redion falsch: hier wird
 * nicht eine Vokabel viermal geübt, sondern eine Frage einmal. Redions
 * Einheit ist das THEMA — die Seite, das Schlagwort, das Fach.
 *
 * ─── DIE ZWEI RECHNUNGEN, UND WARUM ES ZWEI SIND ────────────────────────────
 *
 * 1 · HALTBARKEIT: was heute vermutlich noch sitzt. Aus dem SM-2-Zustand,
 *     nicht aus der Trefferquote. Eine Karte, die vor einem halben Jahr
 *     dreimal richtig war und seither nicht drankam, ist nicht „100 %".
 *
 * 2 · SICHERHEIT: wie belastbar die Aussage ist. Aus der ZAHL der Belege.
 *
 * Beide getrennt zu halten ist der ganze Punkt. Zusammengerechnet ergäbe
 * sich eine einzige Zahl, die weder das eine noch das andere sagt.
 *
 * ─── WARUM WILSON UND NICHT „RICHTIG DURCH GESAMT" ──────────────────────────
 *
 * Drei von drei richtig sind nicht 100 %. Sie sind „irgendwo zwischen 44 %
 * und 100 %, wahrscheinlich eher hoch". Genau das rechnet das
 * Wilson-Intervall aus, und es tut es von selbst richtig: bei drei Antworten
 * ist die untere Schranke 0,44, bei zweihundert ist sie 0,98.
 *
 * Der naive Bruch behauptet in beiden Fällen dasselbe. Er ist der Grund,
 * warum Lern-Apps Anfängern „100 % gemeistert" anzeigen.
 *
 * Gezeigt wird deshalb die UNTERE Schranke. Sie ist die Zahl, die man
 * verantworten kann.
 * ==========================================================================*/
const Kompetenz = (() => {
    const TAG_MS = 86400000;
    /** Ab hier wird überhaupt etwas behauptet. */
    const MINDEST_BELEGE = 5;
    /**
     * Die vier Worte. Sie stehen an der UNTEREN Schranke, nicht am Mittelwert —
     * „stark" heisst dann: auch im ungünstigen Fall noch stark.
     */
    const STUFEN = [
        { ab: 0.80, wort: 'Sitzt' },
        { ab: 0.60, wort: 'Fortgeschritten' },
        { ab: 0.35, wort: 'Auf dem Weg' },
        { ab: 0.00, wort: 'Am Anfang' }
    ];
    const stufeVon = (unten) => {
        for (const s of STUFEN)
            if (unten >= s.ab)
                return s.wort;
        return 'Am Anfang';
    };
    /* ------------------------------------------------------------------------
     * WILSON
     *
     * Die untere Schranke des Wilson-Intervalls für einen Anteil. `z` ist die
     * Breite: 1,96 sind die üblichen 95 %.
     *
     * Ohne einen einzigen Beleg gibt es keine Schranke — dann 0, und der
     * Aufrufer soll das an `gesamt === 0` erkennen und gar nichts behaupten.
     * ---------------------------------------------------------------------- */
    const wilson = (richtig, gesamt, z = 1.96) => {
        if (!gesamt || gesamt <= 0)
            return { unten: 0, mitte: 0, oben: 0 };
        const r = Math.max(0, Math.min(gesamt, richtig));
        const p = r / gesamt;
        const zz = z * z;
        const nenner = 1 + zz / gesamt;
        const mitte = (p + zz / (2 * gesamt)) / nenner;
        const rand = (z * Math.sqrt(p * (1 - p) / gesamt + zz / (4 * gesamt * gesamt))) / nenner;
        return {
            unten: Math.max(0, mitte - rand),
            mitte,
            oben: Math.min(1, mitte + rand)
        };
    };
    /* ------------------------------------------------------------------------
     * HALTBARKEIT
     *
     * SM-2 wählt den Abstand so, dass am Fälligkeitstag rund 90 % noch sitzen.
     * Daraus lässt sich zurückrechnen, was HEUTE noch sitzt:
     *
     *     R(t) = 0,9 ^ (t / Abstand)
     *
     * Am Fälligkeitstag also 0,9, doppelt so spät 0,81, und so weiter. Das ist
     * die einfachste Kurve, die zur vorhandenen Rechnung passt — sie erfindet
     * keinen zweiten Algorithmus neben SM-2 (§47 sinngemäss: keine zweite
     * Wahrheit für dieselbe Sache).
     *
     * Abstand 0 heisst „gerade falsch beantwortet". Dann ist die Haltbarkeit
     * nicht klein, sondern unbekannt-nahe-null: 0.
     * ---------------------------------------------------------------------- */
    const haltbarkeit = (sr, jetzt) => {
        if (!sr)
            return 0;
        const intervall = Number(sr.intervall) || 0;
        if (intervall <= 0)
            return 0;
        const zuletzt = Date.parse(String(sr.zuletzt || ''));
        if (!Number.isFinite(zuletzt))
            return 0;
        const tage = Math.max(0, (jetzt - zuletzt) / TAG_MS);
        return Math.pow(0.9, tage / intervall);
    };
    /** Das Protokoll einer Karte als Liste, egal wie es abgelegt ist. */
    const verlaufVon = (k) => {
        const v = k && k.reviewVerlauf;
        if (!v)
            return [];
        const liste = Array.isArray(v) ? v : Object.values(v);
        return liste.filter(e => e && typeof e === 'object')
            .sort((a, b) => String(a.at || '').localeCompare(String(b.at || '')));
    };
    /**
     * Was eine EINZELNE Karte hergibt.
     *
     * `richtig` zählt Noten ab 3 — das ist dieselbe Grenze, die `planen()`
     * benutzt, um zwischen Weitergehen und Zurücksetzen zu entscheiden. Zwei
     * verschiedene Grenzen für dasselbe Wort wären der Anfang von zwei
     * Wahrheiten.
     */
    const karteAus = (k, opt = {}) => {
        const jetzt = typeof opt.jetzt === 'number' ? opt.jetzt : Date.now();
        const fenster = typeof opt.fensterTage === 'number' ? opt.fensterTage : 0;
        const ab = fenster > 0 ? jetzt - fenster * TAG_MS : 0;
        let gesamt = 0, richtig = 0, letzteZeit = 0, ersteZeit = 0;
        for (const e of verlaufVon(k)) {
            const wann = Date.parse(String(e.at || ''));
            /* Mit Zeitfenster fällt auch heraus, was GAR KEINE Zeit trägt: ein
               Eintrag ohne Datum lässt sich nicht in „die letzten 90 Tage"
               einordnen, und ihn trotzdem mitzuzählen hiesse, das Fenster still
               zu überschreiten. Ohne Fenster zählt er selbstverständlich mit. */
            if (fenster > 0 && !Number.isFinite(wann))
                continue;
            if (fenster > 0 && wann < ab)
                continue;
            /* UND NACH OBEN AUCH (E328). Ein Fenster ist [jetzt−fenster, jetzt];
               ohne diese Zeile war es [jetzt−fenster, ∞) und liess alles durch,
               was danach kam. Bei `jetzt = Date.now()` fällt das nie auf — da
               gibt es kein Danach. Es fällt auf, sobald man `jetzt` ZURÜCKSTELLT,
               um zu fragen „wie sah es vor drei Monaten aus": dann lagen alle
               seitherigen Antworten mit im alten Fenster, und der Vergleich
               verglich einen Zeitraum mit sich selbst plus dem Rest.
               Ohne Fenster ändert sich nichts — dann gibt es keine Schranke. */
            if (fenster > 0 && Number.isFinite(wann) && wann > jetzt)
                continue;
            gesamt++;
            if ((Number(e.rating) || 0) >= 3)
                richtig++;
            if (Number.isFinite(wann)) {
                if (!ersteZeit || wann < ersteZeit)
                    ersteZeit = wann;
                if (wann > letzteZeit)
                    letzteZeit = wann;
            }
        }
        const h = haltbarkeit(k.sr, jetzt);
        const faellig = k.sr && k.sr.faellig
            ? Date.parse(String(k.sr.faellig)) <= jetzt : false;
        return {
            id: k.id, thema: k.thema || '(ohne Thema)', titel: k.titel || '',
            quelle: String(k.quelle || 'karte'),
            gesamt, richtig, haltbarkeit: h, faellig,
            ersteZeit, letzteZeit,
            intervall: Number(k.sr && k.sr.intervall) || 0
        };
    };
    /* ------------------------------------------------------------------------
     * DIE AUSSAGE JE THEMA
     * ---------------------------------------------------------------------- */
    const jeThema = (karten, opt = {}) => {
        const jetzt = typeof opt.jetzt === 'number' ? opt.jetzt : Date.now();
        const mindest = typeof opt.mindestBelege === 'number'
            ? opt.mindestBelege : MINDEST_BELEGE;
        const gruppen = new Map();
        for (const k of karten || []) {
            if (!k || !k.id)
                continue;
            const e = karteAus(k, { ...opt, jetzt });
            let g = gruppen.get(e.thema);
            if (!g) {
                g = { thema: e.thema, karten: 0, gesamt: 0, richtig: 0,
                    haltbarSumme: 0, haltbarZahl: 0, faellig: 0,
                    ersteZeit: 0, letzteZeit: 0, quellen: {} };
                gruppen.set(e.thema, g);
            }
            /* NUR ECHTE KARTEN ZÄHLEN ALS KARTEN (E339). Eine Prüfungsantwort
               ist ein Beleg, aber keine Karte. */
            if (e.quelle === 'karte')
                g.karten++;
            g.gesamt += e.gesamt;
            g.richtig += e.richtig;
            if (e.gesamt)
                g.quellen[e.quelle] = (g.quellen[e.quelle] || 0) + e.gesamt;
            /* Nur Karten mit Abstand tragen zur Haltbarkeit bei. Eine nie geübte
               Karte ist keine Null, sondern eine Unbekannte — sie mit 0 in den
               Mittelwert zu nehmen, machte aus „noch nicht geübt" ein
               „vergessen". */
            if (e.intervall > 0) {
                g.haltbarSumme += e.haltbarkeit;
                g.haltbarZahl++;
            }
            if (e.faellig)
                g.faellig++;
            if (e.ersteZeit && (!g.ersteZeit || e.ersteZeit < g.ersteZeit))
                g.ersteZeit = e.ersteZeit;
            if (e.letzteZeit > g.letzteZeit)
                g.letzteZeit = e.letzteZeit;
        }
        return [...gruppen.values()].map(g => {
            const w = wilson(g.richtig, g.gesamt);
            const haltbar = g.haltbarZahl ? g.haltbarSumme / g.haltbarZahl : 0;
            const genug = g.gesamt >= mindest;
            return {
                thema: g.thema,
                karten: g.karten,
                belege: g.gesamt,
                /* Woher die Belege kommen, in Zahlen. Der Satz nennt es nur, wenn
                   es mehr als eine Art ist — siehe `quellenTeil`. */
                quellen: { ...g.quellen },
                richtig: g.richtig,
                /* Die Zahl, die man verantworten kann. */
                sicherheit: w.unten,
                roh: g.gesamt ? g.richtig / g.gesamt : 0,
                haltbarkeit: haltbar,
                faellig: g.faellig,
                genug,
                stufe: genug ? stufeVon(w.unten) : '',
                seit: g.ersteZeit ? new Date(g.ersteZeit).toISOString() : '',
                zuletzt: g.letzteZeit ? new Date(g.letzteZeit).toISOString() : '',
                satz: satzZu({
                    thema: g.thema, belege: g.gesamt, unten: w.unten, roh: g.gesamt ? g.richtig / g.gesamt : 0,
                    haltbar, genug, mindest, karten: g.karten, faellig: g.faellig, jetzt,
                    letzteZeit: g.letzteZeit, quellen: g.quellen
                })
            };
        }).sort((a, b) => (b.genug ? 1 : 0) - (a.genug ? 1 : 0) ||
            b.sicherheit - a.sicherheit ||
            a.thema.localeCompare(b.thema, 'de'));
    };
    /**
     * WAS ZUERST AUFFRISCHEN (L106 Punkt 2, E325).
     *
     * Die Haltbarkeit wird seit E289 gerechnet und im Satz genannt — „davon
     * dürfte heute noch 62 % sitzen". Damit lässt sich nichts anfangen: es
     * gibt keine Reihenfolge, keine Liste, keinen Weg von der Zahl zur
     * Handlung. L106 sagt es selbst: „Genau das wäre der Nutzen."
     *
     * DIE REIHENFOLGE IST NICHT EINFACH „am wenigsten haltbar". Ein Thema mit
     * drei Karten, von denen nichts mehr sitzt, ist weniger dringend als eins
     * mit vierzig, von denen die Hälfte weg ist — man verliert dort mehr. Das
     * Mass ist deshalb, WIE VIEL Wissen zerfallen ist:
     *
     *     verlust = karten × (1 − haltbarkeit)
     *
     * FÄLLIGE KARTEN WIEGEN MIT IHREM ZERFALL, nicht mit ihrer Zahl. Der
     * erste Entwurf addierte `faellig` roh, und das Bild zeigte sofort, was
     * dabei herauskommt: „Deutsch, 98 % sitzt noch" stand vor „Mathematik,
     * 81 %", weil Deutsch vierzehn fällige Karten hatte. Vierzehn Karten
     * aufzufrischen, die noch sitzen, ist beinahe verschenkte Zeit — und die
     * Überschrift versprach „am meisten verblasst". Eine Liste, deren
     * Reihenfolge etwas anderes tut als ihre Überschrift sagt, ist eine
     * falsche Auskunft, auch wenn jede Zahl darin stimmt.
     *
     * Fällig heisst deshalb: dieser Teil des Zerfalls lässt sich SOFORT
     * zurückholen, ohne auf den Plan zu warten. Er zählt doppelt, aber eben
     * der Zerfall und nicht die Karte.
     *
     * DIE SCHWELLE IST EINE GANZE KARTE. Weniger ist Rauschen: ein Thema mit
     * einem halben Kartenwert Zerfall gehört nicht auf eine Liste, die zum
     * Handeln auffordert. Ohne sie wäre die Liste nie leer, und eine Liste,
     * die nie leer wird, wird nicht gelesen.
     *
     * NUR THEMEN MIT GENUG BELEGEN. Ein Thema mit zwei Antworten hat keine
     * Haltbarkeit, die diesen Namen verdient; es hier einzureihen wäre eine
     * Zahl ohne Grundlage, und genau davor warnt E289.
     */
    const auffrischen = (themen, opt = {}) => {
        const grenze = typeof opt.hoechstens === 'number' ? opt.hoechstens : 5;
        return (themen || [])
            .filter(t => t && t.genug && t.karten > 0 && t.haltbarkeit < 1)
            .map(t => {
            const zerfall = 1 - t.haltbarkeit;
            const verlust = t.karten * zerfall;
            /* Was sich heute schon zurückholen lässt. */
            const sofort = (t.faellig || 0) * zerfall;
            return {
                thema: t.thema,
                karten: t.karten,
                faellig: t.faellig || 0,
                haltbarkeit: t.haltbarkeit,
                verlust,
                dringend: verlust + sofort,
                satz: auffrischSatz(t)
            };
        })
            /* Die Winzigkeit ist kein Schlupfloch, sondern Fliesskomma: zehn
               Karten zu 90 % ergeben 10 × (1 − 0,9) = 0,9999999999999998, und das
               IST eine ganze Karte. Ohne die Toleranz fiele genau der Randfall
               heraus, den die Schwelle beschreibt. */
            .filter(e => e.dringend >= 1 - 1e-9)
            .sort((a, b) => b.dringend - a.dringend ||
            a.thema.localeCompare(b.thema, 'de'))
            .slice(0, Math.max(1, grenze));
    };
    /** Ein Satz je Vorschlag — was zu tun ist, nicht was schlecht steht. */
    const auffrischSatz = (t) => {
        const weg = Math.round(t.karten * (1 - t.haltbarkeit));
        const p = Math.round(t.haltbarkeit * 100);
        if (t.faellig > 0)
            return t.faellig + (t.faellig === 1 ? ' Karte ist' : ' Karten sind') +
                ' fällig — ' + p + ' % sitzt noch.';
        return 'Nichts fällig, aber rechnerisch ' +
            (weg === 1 ? 'eine Karte' : weg + ' Karten') +
            ' verblasst — ' + p + ' % sitzt noch.';
    };
    /**
     * Der Satz im Klartext.
     *
     * Bei zu wenig Belegen sagt er, WIE VIELE noch fehlen. „Zu wenig Daten"
     * allein ist eine Absage; „noch drei Antworten" ist eine Anleitung.
     */
    /* ==========================================================================
     * GEHT ES AUFWÄRTS? (L106 Punkt 3 UND 4, E328)
     * --------------------------------------------------------------------------
     * Zwei Lücken, eine Antwort.
     *
     *   Punkt 3: „`fensterTage` wird nirgends benutzt. Die Rechnung kann
     *            ‚nur die letzten 90 Tage', und keine Aufrufstelle fragt
     *            danach. Für ‚bin ich BESSER geworden' wäre es das richtige
     *            Werkzeug."
     *   Punkt 4: „Kein Vergleich über Zeit. Es gibt keinen Verlauf der
     *            Sicherheit, also auch keine Antwort auf ‚geht es aufwärts'."
     *
     * Punkt 3 ist §47 in seiner leisesten Form: ein Schalter, den niemand
     * umlegt. Punkt 4 sagt, wofür er da wäre. Also legt ihn jetzt jemand um.
     *
     * DIE RECHNUNG IST EIN VERGLEICH ZWEIER FENSTER, nicht eine Kurve. Eine
     * Kurve über die Sicherheit sähe klüger aus und wäre unehrlicher: bei
     * fünf Antworten je Punkt wackelt sie so stark, dass jeder Ausschlag
     * nach Fortschritt aussieht. Zwei Zeiträume, jeder mit genug Belegen,
     * beantworten die Frage, die gestellt wurde.
     *
     * DER FRÜHERE ZEITRAUM ENTSTEHT DURCH ZURÜCKSTELLEN DER UHR — dieselbe
     * Rechnung, nur mit `jetzt` um ein Fenster zurück. Kein zweiter Weg
     * durch dieselben Daten, also auch keine zweite Wahrheit. Genau dafür
     * musste das Fenster erst nach oben schliessen (siehe `karteAus`).
     *
     * WAS EIN THEMA BRAUCHT, UM ÜBERHAUPT VERGLICHEN ZU WERDEN: genug Belege
     * in BEIDEN Zeiträumen. Ein Thema, das es vor drei Monaten noch nicht
     * gab, ist nicht „besser geworden" — es ist neu. Das ohne Grundlage zu
     * behaupten wäre derselbe Fehler, den E289 an der Sicherheit abgeräumt
     * hat.
     *
     * UND EINE SCHWELLE, damit nicht jedes Rauschen als Richtung erscheint:
     * unter fünf Prozentpunkten Unterschied heisst es „gleich geblieben".
     * Wilson-Schranken bei zwanzig Antworten wandern schon durch eine
     * einzige andere Antwort um mehr als das; eine Anzeige, die IMMER eine
     * Richtung zeigt, zeigt keine.
     * ========================================================================*/
    /** Ab hier heisst es „aufwärts" oder „abwärts", darunter „gleich". */
    const RICHTUNG_SCHWELLE = 0.05;
    /** Standardfenster, wenn keines genannt wird: ein Vierteljahr. */
    const FENSTER_TAGE = 90;
    const verlauf = (karten, opt = {}) => {
        const jetzt = typeof opt.jetzt === 'number' ? opt.jetzt : Date.now();
        const tage = typeof opt.fensterTage === 'number' && opt.fensterTage > 0
            ? opt.fensterTage : FENSTER_TAGE;
        const gemeinsam = { ...opt, fensterTage: tage };
        const jetztFenster = jeThema(karten, { ...gemeinsam, jetzt });
        const davor = jeThema(karten, { ...gemeinsam, jetzt: jetzt - tage * TAG_MS });
        const vorher = new Map(davor.map(t => [t.thema, t]));
        const erg = [];
        for (const t of jetztFenster) {
            const v = vorher.get(t.thema);
            /* BEIDE Zeiträume müssen tragen. Sonst behauptet man eine Änderung
               gegen eine Zahl, die es nicht gab. */
            if (!t.genug || !v || !v.genug)
                continue;
            const unterschied = t.sicherheit - v.sicherheit;
            const richtung = unterschied >= RICHTUNG_SCHWELLE ? 'auf'
                : unterschied <= -RICHTUNG_SCHWELLE ? 'ab' : 'gleich';
            erg.push({
                thema: t.thema, tage,
                jetzt: t.sicherheit, vorher: v.sicherheit,
                unterschied, richtung,
                belegeJetzt: t.belege, belegeVorher: v.belege,
                satz: verlaufSatz(t.sicherheit, v.sicherheit, unterschied, richtung, tage)
            });
        }
        /* Die grösste Veränderung zuerst — in BEIDE Richtungen. Wer schlechter
           geworden ist, will das zuerst wissen, nicht zuletzt. */
        return erg.sort((a, b) => Math.abs(b.unterschied) - Math.abs(a.unterschied) ||
            a.thema.localeCompare(b.thema, 'de'));
    };
    const prozent = (x) => Math.round(x * 100) + ' %';
    /**
     * OHNE DAS THEMA VORNEWEG, und das stand erst anders da.
     *
     * Der erste Wurf begann mit „Mathematik: 28 % → 72 % …". Auf dem Bild
     * stand dann „Mathematik" als fette Überschrift und direkt darunter
     * noch einmal „Mathematik:". `auffrischSatz` macht es seit E325 richtig
     * und nennt das Thema NICHT — die Zeile trägt es schon. Zwei Muster für
     * dieselbe Sache in derselben Ansicht wären eine Unstimmigkeit, die
     * niemand benennen kann und jeder sieht.
     */
    const verlaufSatz = (jetztWert, vorherWert, unterschied, richtung, tage) => {
        const zeitraum = tage === 90 ? 'in den letzten drei Monaten'
            : tage === 30 ? 'im letzten Monat'
                : 'in den letzten ' + tage + ' Tagen';
        if (richtung === 'gleich') {
            return prozent(jetztWert) + ' — ' + zeitraum +
                ' etwa gleich geblieben (vorher ' + prozent(vorherWert) + ').';
        }
        /* Prozentpunkte, nicht Prozent. „von 60 auf 70" sind zehn Punkte und
           nicht siebzehn Prozent; beides ist richtig gerechnet, aber nur eines
           ist das, was jemand hören will. */
        const punkte = Math.round(Math.abs(unterschied) * 100);
        return prozent(vorherWert) + ' → ' + prozent(jetztWert) +
            ' — ' + (richtung === 'auf' ? 'aufwärts' : 'abwärts') + ', ' +
            punkte + ' Punkte ' + zeitraum + '.';
    };
    /**
     * Wie eine Belegart auf Deutsch heisst.
     *
     * DER KERN KENNT DIE ARTEN NICHT — er rechnet mit allen gleich. Diese
     * Tabelle gibt es nur für den SATZ, den ein Mensch liest, und was hier
     * fehlt, wird beim eigenen Namen genannt statt verschwiegen (§35).
     */
    const QUELLEN_NAME = {
        karte: 'Karteikarten',
        pruefung: 'Prüfungssimulationen'
    };
    /**
     * „ Die Belege: 40 aus Karteikarten und 22 aus Prüfungssimulationen."
     * — oder nichts.
     *
     * NICHTS BEI EINER EINZIGEN ART, und das ist der Punkt: solange alles
     * aus Karteikarten kommt, wäre „62 aus Karteikarten" eine Zeile, die
     * nichts sagt und die man nach dem zweiten Mal überliest. Genannt wird
     * die Herkunft erst, wenn sie eine Frage beantwortet.
     *
     * EIN EIGENER SATZ AM ENDE, und nicht in Klammern mitten hinein. Der
     * erste Wurf hängte ihn hinter die Zahl, und auf dem Bildschirm standen
     * dann ZWEI Klammern hintereinander: „75 % aus 25 Antworten (15 aus
     * Karteikarten, 10 aus Prüfungssimulationen) (roh 92 % — …)". Beides
     * gültig, beides richtig, zusammen unlesbar. Gesehen hat das kein
     * Prüflauf, sondern der Blick auf den fertigen Satz (§55.1).
     */
    const quellenTeil = (quellen) => {
        const paare = Object.entries(quellen || {})
            .filter(([, n]) => Number(n) > 0)
            .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
        if (paare.length < 2)
            return '';
        const teile = paare.map(([q, n]) => n + ' aus ' + (QUELLEN_NAME[q] || q));
        const letzter = teile.pop();
        /* „Die Belege:" UND NICHT „Davon" — der Satz davor endet auf „Davon
           dürfte heute noch X % sitzen", und zwei „Davon" hintereinander
           liest sich, als wäre das eine die Erklärung des anderen. Auch das
           stand erst auf dem Bildschirm. */
        return ' Die Belege: ' + (teile.length ? teile.join(', ') + ' und ' : '') +
            letzter + '.';
    };
    const satzZu = (x) => {
        if (!x.belege) {
            return x.karten === 1
                ? 'Eine Karte, noch nie beantwortet.'
                : x.karten + ' Karten, noch keine davon beantwortet.';
        }
        if (!x.genug) {
            const fehlt = x.mindest - x.belege;
            return x.belege + (x.belege === 1 ? ' Antwort' : ' Antworten') +
                ' — zu wenig für eine Aussage. Noch ' + fehlt +
                (fehlt === 1 ? ' Antwort' : ' Antworten') + ', dann sagt Redion etwas dazu.' +
                quellenTeil(x.quellen);
        }
        const prozent = Math.round(x.unten * 100);
        const rohProzent = Math.round(x.roh * 100);
        const haltbarProzent = Math.round(x.haltbar * 100);
        const tage = x.letzteZeit
            ? Math.round((x.jetzt - x.letzteZeit) / TAG_MS) : 0;
        /* Die rohe Quote wird MITGENANNT, wenn sie deutlich über der Schranke
           liegt — sonst wirkt die Schranke wie eine Behauptung statt wie eine
           Vorsicht. */
        const rohTeil = rohProzent - prozent >= 8
            ? ' (roh ' + rohProzent + ' % — für mehr müssten es mehr Antworten sein)'
            : '';
        const zeitTeil = tage <= 1 ? 'zuletzt heute'
            : tage < 30 ? 'zuletzt vor ' + tage + ' Tagen'
                : 'zuletzt vor ' + Math.round(tage / 30) + ' Monaten';
        return stufeVon(x.unten) + ' — ' + prozent + ' % aus ' + x.belege +
            ' Antworten' + rohTeil +
            '. Davon dürfte heute noch ' + haltbarProzent +
            ' % sitzen; ' + zeitTeil + '.' +
            (x.faellig ? ' ' + x.faellig + ' fällig.' : '') +
            quellenTeil(x.quellen);
    };
    /** Ein Gesamtbild über alle Themen — dieselben Regeln, eine Gruppe. */
    const gesamt = (karten, opt = {}) => {
        const alle = (karten || []).map(k => ({ ...k, thema: 'alles' }));
        const eins = jeThema(alle, opt);
        return eins[0] || {
            thema: 'alles', karten: 0, belege: 0, richtig: 0, sicherheit: 0, quellen: {},
            roh: 0, haltbarkeit: 0, faellig: 0, genug: false, stufe: '',
            seit: '', zuletzt: '', satz: 'Noch keine Karten.'
        };
    };
    return {
        jeThema, gesamt, karteAus, wilson, haltbarkeit, stufeVon, verlaufVon,
        auffrischen, auffrischSatz,
        verlauf, verlaufSatz,
        MINDEST_BELEGE, STUFEN, RICHTUNG_SCHWELLE, FENSTER_TAGE
    };
})();
window.Kompetenz = Kompetenz;
