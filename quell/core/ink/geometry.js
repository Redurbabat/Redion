"use strict";
/* ============================================================================
 * core/ink/geometry.ts — neutrale Geometrie fuer Freihand und Formen
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/core/ink/geometry.ts`. `npm run bauen:ts` schreibt
 * daraus `quell/core/ink/geometry.js`.
 * ----------------------------------------------------------------------------
 * Diese Datei kennt weder PDF noch Whiteboard noch Store. Sie rechnet nur mit
 * Punkten im jeweiligen Dokumentraum. Dadurch koennen Blatt, PDF-Seite und ein
 * spaeteres Whiteboard dieselben Regeln verwenden, ohne Daten zu importieren
 * oder eine zweite Zeichenmaschine aufzubauen (E125).
 * ==========================================================================*/
const InkGeometry = (() => {
    const finite = (value) => {
        const number = Number(value);
        return Number.isFinite(number) ? number : 0;
    };
    const points = (raw) => !Array.isArray(raw) ? [] : raw
        .filter((point) => Array.isArray(point) && point.length >= 2)
        .map((point) => [finite(point[0]), finite(point[1])]);
    const distanceToSegment = (point, start, end) => {
        const dx = end[0] - start[0];
        const dy = end[1] - start[1];
        if (!dx && !dy)
            return Math.hypot(point[0] - start[0], point[1] - start[1]);
        const amount = Math.max(0, Math.min(1, ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / (dx * dx + dy * dy)));
        return Math.hypot(point[0] - (start[0] + amount * dx), point[1] - (start[1] + amount * dy));
    };
    /** Ramer-Douglas-Peucker: weniger Punkte, gleiche sichtbare Linie. */
    const simplify = (raw, tolerance = 0.8) => {
        const input = points(raw);
        if (input.length <= 2)
            return input;
        const keep = new Uint8Array(input.length);
        keep[0] = 1;
        keep[input.length - 1] = 1;
        const stack = [[0, input.length - 1]];
        while (stack.length) {
            const [first, last] = stack.pop();
            let farthest = -1;
            let index = -1;
            for (let i = first + 1; i < last; i++) {
                const distance = distanceToSegment(input[i], input[first], input[last]);
                if (distance > farthest) {
                    farthest = distance;
                    index = i;
                }
            }
            if (index > first && farthest > Math.max(0.05, tolerance)) {
                keep[index] = 1;
                stack.push([first, index], [index, last]);
            }
        }
        return input.filter((_point, index) => !!keep[index]);
    };
    /** Wie `simplify`, aber als Liste der INDIZES, die bleiben — damit ein
        zweiter Kanal (der Druck je Punkt) mitwandern kann, statt zum
        Durchschnitt zu werden (E351). */
    const simplifyIndices = (raw, tolerance = 0.8) => {
        const input = points(raw);
        if (input.length <= 2)
            return input.map((_point, index) => index);
        const keep = new Uint8Array(input.length);
        keep[0] = 1;
        keep[input.length - 1] = 1;
        const stack = [[0, input.length - 1]];
        while (stack.length) {
            const [first, last] = stack.pop();
            let farthest = -1;
            let index = -1;
            for (let i = first + 1; i < last; i++) {
                const distance = distanceToSegment(input[i], input[first], input[last]);
                if (distance > farthest) {
                    farthest = distance;
                    index = i;
                }
            }
            if (index > first && farthest > Math.max(0.05, tolerance)) {
                keep[index] = 1;
                stack.push([first, index], [index, last]);
            }
        }
        const out = [];
        for (let i = 0; i < input.length; i++)
            if (keep[i])
                out.push(i);
        return out;
    };
    /** Eine Seite des Umrisses als geglaettete Kurve (ohne das fuehrende M). */
    const seite = (input) => {
        if (input.length < 2)
            return '';
        if (input.length === 2)
            return ` L${input[1][0]} ${input[1][1]}`;
        let output = '';
        for (let i = 1; i < input.length - 1; i++) {
            const middle = [
                Math.round((input[i][0] + input[i + 1][0]) * 50) / 100,
                Math.round((input[i][1] + input[i + 1][1]) * 50) / 100
            ];
            output += ` Q${input[i][0]} ${input[i][1]} ${middle[0]} ${middle[1]}`;
        }
        const last = input[input.length - 1];
        return output + ` L${last[0]} ${last[1]}`;
    };
    /**
     * DER UMRISS EINES STRICHS MIT VERAENDERLICHER BREITE (E351).
     * Je Punkt eine halbe Breite; links und rechts der Mittellinie entsteht
     * eine Kontur, vorn und hinten eine runde Kappe. Das Ergebnis ist eine
     * FLAECHE (fill), kein Strich (stroke) — so kann ein Fueller anschwellen
     * und auslaufen, wie es der Druck sagt. Die Punkte bleiben, was sie sind:
     * die Mittellinie, die auch der alte Zeichner kennt.
     */
    /**
     * DIE ZWEI KANTEN EINES STRICHS — die Rechnung, die `outline` und
     * `outlinePunkte` teilen (E506). Sie stand vorher im Rumpf von
     * `outline`; mit dem zweiten Nutzer waere sie zur Abschrift geworden,
     * und dann zeichnete der Bildschirm eine andere Kontur als das PDF (§8).
     */
    const seiten = (raw, halfWidths) => {
        const input = points(raw);
        const n = input.length;
        if (n < 2)
            return null;
        const links = [];
        const rechts = [];
        const halb = (i) => {
            const w = Number(halfWidths[Math.min(i, halfWidths.length - 1)]);
            return Math.max(0.15, Number.isFinite(w) ? w : 1);
        };
        const r2 = (v) => Math.round(v * 100) / 100;
        for (let i = 0; i < n; i++) {
            const prev = input[Math.max(0, i - 1)];
            const next = input[Math.min(n - 1, i + 1)];
            let tx = next[0] - prev[0];
            let ty = next[1] - prev[1];
            const len = Math.hypot(tx, ty) || 1;
            tx /= len;
            ty /= len;
            const w = halb(i);
            links.push([r2(input[i][0] - ty * w), r2(input[i][1] + tx * w)]);
            rechts.push([r2(input[i][0] + ty * w), r2(input[i][1] - tx * w)]);
        }
        return { links, rechts, anfang: halb(0), ende: halb(n - 1) };
    };
    /* ══ DIE SPITZE (E673) ═══════════════════════════════════════════════════
       Ein Füller setzt nicht mit voller Breite auf und hört nicht mit voller
       Breite auf: die Feder berührt das Papier mit der Spitze, die Tinte
       läuft an, und beim Abheben läuft sie aus. Bis E673 waren beide Kappen
       Halbkreise in VOLLER Breite — `outline` und `Feder.d()` ziehen den
       Bogen mit dem Radius der ersten und der letzten halben Breite. Jeder
       Buchstabe endete mit einem runden Klecks, und das war der Unterschied
       zu GoodNotes, den man beim ersten „e" sieht, ohne zu messen.
  
       `spitzeFaktor` ist EINE Kurve für den nassen und den trockenen Strich:
       von `min` bei Weglänge 0 auf 1 bei Weglänge `laenge`, quadratisch
       auslaufend — schnell dicker, dann sanft. Gemessen wird WEGLÄNGE, nicht
       Punktzahl: sonst hinge die Spitze an der Abtastrate des Stifts (E504).
       Der nasse Strich kennt nur seinen Anfang und nimmt die Kurve dort;
       `verjuengen` legt sie an BEIDE Enden eines fertigen Strichs — und
       kürzt sie bei kurzen Strichen, damit ein Punkt ein Punkt bleibt und
       kein Splitter wird. Die halben Breiten sind ein AUSSEHEN; was der
       Sensor an Druck gemeldet hat, bleibt in der Marke unverändert (§9). */
    const spitzeFaktor = (weg, laenge, min) => {
        if (!(laenge > 0) || !(min < 1) || !(weg < laenge))
            return 1;
        const t = Math.max(0, weg / laenge);
        return min + (1 - min) * t * (2 - t);
    };
    const verjuengen = (raw, halfWidths, min, laenge) => {
        const input = points(raw);
        const n = input.length;
        const halb = (i) => {
            const w = Number(halfWidths[Math.min(i, halfWidths.length - 1)]);
            return Number.isFinite(w) ? w : 1;
        };
        const aus = Array.from({ length: n }, (_q, i) => halb(i));
        if (n < 3 || !(min < 1) || !(laenge > 0))
            return aus;
        const weg = [0];
        for (let i = 1; i < n; i++) {
            weg.push(weg[i - 1] + Math.hypot(input[i][0] - input[i - 1][0], input[i][1] - input[i - 1][1]));
        }
        const gesamt = weg[n - 1];
        /* Ein kurzer Strich bekommt eine kurze UND eine stumpfere Spitze. Der
           Weg je Ende ist höchstens 40 % der Strichlänge, damit ein Fünftel in
           der Mitte voll bleibt — und die Spitze selbst wird umso stumpfer, je
           weniger von zwei ganzen Federn in den Strich passt: ein Strich, der
           kürzer ist als seine Feder, ist ein Klecks, keine Feder. Das Bild
           hat es gezeigt (§55.1): mit dem 5-pt-Füller war ein 2-pt-Punkt ein
           senkrechter Splitter, weil die Spitze zwar kurz, aber immer noch
           auf ein Viertel spitz war. */
        const anteil = Math.min(1, gesamt / (2 * laenge));
        const stumpf = 1 - (1 - min) * anteil;
        const l = Math.min(laenge, gesamt * 0.4);
        return aus.map((h, i) => h * spitzeFaktor(weg[i], l, stumpf) * spitzeFaktor(gesamt - weg[i], l, stumpf));
    };
    const outline = (raw, halfWidths) => {
        const kanten = seiten(raw, halfWidths);
        if (!kanten)
            return '';
        const { links, rechts, anfang, ende } = kanten;
        const r2 = (v) => Math.round(v * 100) / 100;
        const rueck = [...rechts].reverse();
        return `M${links[0][0]} ${links[0][1]}` + seite(links) +
            ` A${r2(ende)} ${r2(ende)} 0 0 1 ${rueck[0][0]} ${rueck[0][1]}` +
            seite(rueck) +
            ` A${r2(anfang)} ${r2(anfang)} 0 0 1 ${links[0][0]} ${links[0][1]} Z`;
    };
    /**
     * DERSELBE UMRISS ALS PUNKTZUG (E506).
     *
     * `outline` oben schreibt einen SVG-Pfad mit `Q`-Kurven und zwei
     * `A`-Boegen fuer die Kappen. PDF kennt weder das eine noch das andere:
     * es hat `m`, `l` und `c` und sonst nichts. Fuer den PDF-Export braucht
     * es deshalb dieselbe Kontur als reine Punktfolge — ein geschlossenes
     * Vieleck, das ein Schreiber Zeile fuer Zeile ausgeben kann.
     *
     * DIE RECHNUNG IST DIESELBE und steht bewusst nur einmal da: `seiten`
     * liefert die linke und die rechte Kante, und `outline` wie
     * `outlinePunkte` bauen daraus ihre Form. Was sich unterscheidet, ist
     * allein die Kappe — dort setzt das Vieleck `kappen` Punkte auf den
     * Halbkreis, wo der SVG-Pfad einen Bogen zieht. Bei einer halben Breite
     * von anderthalb Punkten liegen acht Punkte weniger als ein Zehntel
     * Millimeter neben dem echten Bogen; auf Papier ist das nichts.
     */
    const outlinePunkte = (raw, halfWidths, kappen = 8) => {
        const kanten = seiten(raw, halfWidths);
        if (!kanten)
            return [];
        const { links, rechts, anfang, ende } = kanten;
        const r2 = (v) => Math.round(v * 100) / 100;
        /* Ein Halbkreis von `von` nach `nach` um `mitte`, gegen den Uhrzeigersinn
           — genau die Drehrichtung, die der `A`-Bogen mit `sweep 1` nimmt. */
        const kappe = (mitte, von, nach) => {
            const a0 = Math.atan2(von[1] - mitte[1], von[0] - mitte[0]);
            const a1 = Math.atan2(nach[1] - mitte[1], nach[0] - mitte[0]);
            let d = a1 - a0;
            while (d <= 0)
                d += Math.PI * 2;
            const r = Math.hypot(von[0] - mitte[0], von[1] - mitte[1]);
            const raus = [];
            for (let i = 1; i < kappen; i++) {
                const a = a0 + d * (i / kappen);
                raus.push([r2(mitte[0] + Math.cos(a) * r), r2(mitte[1] + Math.sin(a) * r)]);
            }
            return raus;
        };
        const mitte = points(raw);
        const rueck = [...rechts].reverse();
        return [...links,
            ...kappe(mitte[mitte.length - 1], links[links.length - 1], rueck[0]),
            ...rueck,
            ...kappe(mitte[0], rueck[rueck.length - 1], links[0])]
            .filter(q => Number.isFinite(q[0]) && Number.isFinite(q[1]));
        /* `anfang` und `ende` werden hier nicht gebraucht — die Kappe rechnet
           ihren Radius aus dem Abstand zur Mittellinie und kommt damit auf
           dieselbe Zahl. Sie stehen im Rueckgabewert von `seiten`, weil
           `outline` sie fuer seine Boegen braucht. */
        void anfang;
        void ende;
    };
    /** Ein geglaetteter SVG-Pfad; zwei Punkte bleiben absichtlich eine Linie. */
    const path = (raw) => {
        const input = points(raw);
        if (!input.length)
            return '';
        if (input.length === 1)
            return `M${input[0][0]} ${input[0][1]}`;
        if (input.length === 2)
            return `M${input[0][0]} ${input[0][1]} L${input[1][0]} ${input[1][1]}`;
        let output = `M${input[0][0]} ${input[0][1]}`;
        for (let i = 1; i < input.length - 1; i++) {
            const middle = [
                Math.round((input[i][0] + input[i + 1][0]) * 50) / 100,
                Math.round((input[i][1] + input[i + 1][1]) * 50) / 100
            ];
            output += ` Q${input[i][0]} ${input[i][1]} ${middle[0]} ${middle[1]}`;
        }
        const last = input[input.length - 1];
        return output + ` L${last[0]} ${last[1]}`;
    };
    const rectangle = (start, end) => ({
        x: Math.min(start[0], end[0]), y: Math.min(start[1], end[1]),
        width: Math.abs(end[0] - start[0]), height: Math.abs(end[1] - start[1])
    });
    /* DER TEXTKASTEN (E360, L115 Punkt 6): ein Text mit `breiteBox` bricht
     * an dieser Breite um. Die Zeilen werden HIER gerechnet — deterministisch,
     * ohne DOM und ohne Schriftmessung: dieselbe Rechnung fuer Bildschirm,
     * Druck, Auswahlkasten und Treffer. Die Breite eines Zeichens ist eine
     * Schaetzung je Schriftart (in em); sie muss nicht stimmen, sie muss
     * ueberall dieselbe sein. Gebrochen wird an Leerzeichen, ein zu langes
     * Wort an der Breite. */
    /* ══════════════════════════════════════════════════════════════════════
     * DIE SCHRIFTEN STEHEN HIER, NICHT IM ZEICHNER (E562)
     * ────────────────────────────────────────────────────────────────────────
     * Bis hierher lag die Liste in `marken.ts` und die Breitentabelle hier —
     * zwei Orte für dieselbe Sache. Wer exakt messen will, braucht beide:
     * `canvas.measureText` will den Schriftstapel, und der stand da drüben.
     *
     * Ein zweiter Katalog wäre der Fehler gewesen, vor dem §8 warnt: er läuft
     * mit dem ersten auseinander, und niemand sieht, welcher gilt. Also zieht
     * die Liste hierher — an den Ort, der die Masse kennt —, und `marken.ts`
     * nimmt sie von hier.
     * ==================================================================== */
    const SCHRIFTEN = [
        { id: 'standard', name: 'Standard', stapel: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" },
        { id: 'serif', name: 'Serifen', stapel: "Georgia, 'Times New Roman', serif" },
        { id: 'mono', name: 'Schreibmaschine', stapel: 'ui-monospace, Menlo, Consolas, monospace' },
        { id: 'hand', name: 'Handschrift', stapel: "'Segoe Print', 'Bradley Hand', 'Comic Sans MS', cursive" },
        { id: 'schmal', name: 'Schmal', stapel: "'Arial Narrow', 'Roboto Condensed', 'Helvetica Neue', sans-serif" }
    ];
    const schriftStapel = (id) => (SCHRIFTEN.find(x => x.id === String(id)) || SCHRIFTEN[0]).stapel;
    const CHAR_EM = { standard: 0.55, serif: 0.52, mono: 0.6, hand: 0.58, schmal: 0.45 };
    const TEXT_ZEILE = 1.25;
    const charWidth = (ch, family, bold) => {
        const base = CHAR_EM[family] ?? 0.55;
        let f = 1;
        if (family !== 'mono') {
            if (" .,:;'|!ijltIfr".includes(ch))
                f = 0.55;
            else if ('mwMW'.includes(ch))
                f = 1.55;
            else if ((ch >= 'A' && ch <= 'Z') || 'ÄÖÜ'.includes(ch))
                f = 1.25;
        }
        /* DIESE SCHÄTZUNG IST NACHWEISLICH ZU NIEDRIG — siehe L155.
           Am 13. September 2026 mit `canvas.measureText` gegen denselben
           Schriftstapel nachgemessen, in em:
    
               „Ein Satz mit "                 echt 6,31   geschätzt 6,00   1,05
               „einem hervorgehobenen Wort" f  echt 16,88  geschätzt 14,89  1,13
               „ mittendrin, der über mehrere" echt 15,02  geschätzt 13,09  1,15
               „GROSS" fett                    echt 3,84   geschätzt 3,88   0,99
    
           Es ist also NICHT nur der Fett-Faktor, sondern das ganze Modell, und
           die Abweichung schwankt zwischen 0,99 und 1,15. Eine Zeile, die den
           Kasten füllt, läuft dadurch um rund ein Achtel darüber hinaus.
    
           HIER WIRD NICHTS GEÄNDERT, und das ist Absicht: die Zahl steuert den
           Umbruch JEDER Textmarke, auch jeder alten Notiz. Sie zu verschieben
           ist eine eigene Arbeit mit eigener Prüfung (L155), kein Nebenschritt
           in einem Bogen über PowerPoint-Läufe. */
        return base * f * (bold ? 1.06 : 1);
    };
    /* ══════════════════════════════════════════════════════════════════════
     * EXAKT MESSEN, WO ES GEHT — SCHÄTZEN, WO ES MUSS (E562, L155)
     * ────────────────────────────────────────────────────────────────────────
     * Die Tabelle oben ist nachweislich zu niedrig. Am 13. September gemessen:
     *
     *     „ mittendrin, der über mehrere"   echt 15,02 em   geschätzt 13,09
     *     ganze Zeile bei 18 pt             echt 688 pt     geschätzt 611 pt
     *                                       Kasten: 636 pt
     *
     * Eine Zeile, die den Kasten füllt, läuft dadurch um rund ein Achtel
     * darüber hinaus — sichtbar, und keine Prüfung hatte es je bemerkt.
     *
     * EINE BESSERE KONSTANTE WÄRE DIE FALSCHE ANTWORT. Die Abweichung
     * schwankt zwischen 0,99 und 1,15 je nach Text; ein einziger Faktor
     * verschöbe den Fehler nur. Der Browser weiss es genau — `measureText`
     * fragt dieselbe Schrift, die nachher zeichnet.
     *
     * IN NODE GIBT ES KEIN CANVAS, und die Prüfläufe für Geometrie sollen
     * dort weiter rechnen können. Also bleibt die Tabelle als Rückfall, und
     * `gemessenAn()` sagt, welcher Weg gerade gilt.
     *
     * GEMESSEN WIRD BEI 100 px UND GETEILT. Ein Cache-Eintrag bedient damit
     * jede Schriftgrösse statt einer.
     *
     * UND DER CACHE WIRD EINMAL GELEERT, wenn die Schriften fertig geladen
     * sind: die ersten Messungen treffen sonst die Rückfallschrift des
     * Browsers, und eine falsche Zahl, die gemerkt wird, ist schlimmer als
     * eine, die jedes Mal neu danebenliegt.
     * ==================================================================== */
    let messBrett;
    const messCache = new Map();
    const CACHE_GRENZE = 20000;
    const brett = () => {
        if (messBrett !== undefined)
            return messBrett;
        try {
            messBrett = typeof document !== 'undefined' && typeof document.createElement === 'function'
                ? document.createElement('canvas').getContext('2d')
                : null;
            if (messBrett && typeof document !== 'undefined' && document.fonts?.ready) {
                document.fonts.ready.then(() => messCache.clear()).catch(() => { });
            }
        }
        catch {
            messBrett = null;
        }
        return messBrett;
    };
    /** Die Breite in em, exakt gemessen — oder `null`, wenn hier nicht messbar. */
    const emGemessen = (text, family, bold) => {
        if (!text)
            return 0;
        const c = brett();
        if (!c)
            return null;
        const schluessel = family + '|' + (bold ? 'b' : 'n') + '|' + text;
        const da = messCache.get(schluessel);
        if (da !== undefined)
            return da;
        try {
            c.font = (bold ? '700 ' : '400 ') + '100px ' + schriftStapel(family);
            const em = c.measureText(text).width / 100;
            if (!Number.isFinite(em))
                return null;
            if (messCache.size >= CACHE_GRENZE)
                messCache.clear();
            messCache.set(schluessel, em);
            return em;
        }
        catch {
            return null;
        }
    };
    /** `'gemessen'` oder `'geschaetzt'` — damit ein Prüflauf weiss, was gilt. */
    const gemessenAn = () => brett() ? 'gemessen' : 'geschaetzt';
    const textWidth = (text, fontSize, family = 'standard', bold = false) => {
        const roh = String(text ?? '');
        const em = emGemessen(roh, family, bold);
        if (em !== null)
            return em * fontSize;
        let w = 0;
        for (const ch of roh)
            w += charWidth(ch, family, bold);
        return w * fontSize;
    };
    const textLines = (text, width, fontSize, family = 'standard', bold = false) => {
        const lines = [];
        const max = Math.max(1, finite(width));
        const passt = (probe) => textWidth(probe, fontSize, family, bold) <= max;
        for (const raw of String(text ?? '').split(/\r?\n/)) {
            let line = '';
            for (const word of raw.split(' ')) {
                const probe = line ? line + ' ' + word : word;
                if (passt(probe)) {
                    line = probe;
                    continue;
                }
                if (line) {
                    lines.push(line);
                    line = '';
                }
                /* Ein Wort, das allein nicht passt, bricht an der Breite. */
                let part = '';
                for (const ch of word) {
                    if (part && !passt(part + ch)) {
                        lines.push(part);
                        part = '';
                    }
                    part += ch;
                }
                line = part;
            }
            lines.push(line);
        }
        return lines;
    };
    /**
     * DER SATZ EINES ABSATZES MIT MEHREREN FORMATEN (E561).
     *
     * Bis hierher hatte eine Textmarke GENAU EIN Format. „klein GROSS" kam
     * darum vollständig im Format des ersten Laufs an — der Grad des zweiten
     * war weg, und zwar lautlos.
     *
     * ─── DER ALTE WEG BLEIBT UNBERÜHRT ─────────────────────────────────────
     * Diese Rechnung läuft NUR, wenn die Marke `laeufe` trägt. Jede Marke
     * ohne das Feld — also jede, die je geschrieben wurde — geht weiter durch
     * `textLines` wie zuvor. Das ist keine Vorsicht, das ist die einzige Art,
     * eine Satzänderung ohne Rückwärtsrisiko einzuführen (§9).
     *
     * ─── DIE WÖRTER SIND DIE EINHEIT, NICHT DIE LÄUFE ──────────────────────
     * Umgebrochen wird zwischen Wörtern, quer über Laufgrenzen hinweg: in
     * „klein GROSS" darf der Umbruch vor „GROSS" liegen, aber „GROSS" selbst
     * bleibt zusammen. Deshalb wird zuerst in Wörter und Zwischenräume
     * zerlegt, mit dem Format am Stück — und erst danach gepackt.
     *
     * ─── DIE ZEILENHÖHE IST DIE DES GRÖSSTEN STÜCKS ────────────────────────
     * Eine Zeile mit 12 pt und 36 pt ist 36 pt hoch, nicht 12. Sonst liefe
     * die nächste Zeile in die grosse Schrift hinein.
     */
    const laufSatz = (laeufe, max, family, grundGrad, grundFett) => {
        const teile = [];
        for (const lauf of laeufe) {
            const fontSize = Math.max(8, finite(lauf?.sz) || grundGrad);
            const bold = lauf?.fett === undefined ? grundFett : !!lauf.fett;
            const farbe = String(lauf?.farbe || '');
            for (const stueck of String(lauf?.text ?? '').split(/(\s+)/)) {
                if (!stueck)
                    continue;
                /* Ein Zeilenumbruch im Text ist ein eigener Teil — er bricht hart. */
                if (/\n/.test(stueck)) {
                    const vor = stueck.split('\n');
                    vor.forEach((rest, i) => {
                        if (i > 0)
                            teile.push({ text: '\n', leer: true, fontSize, bold, farbe });
                        if (rest)
                            teile.push({ text: rest, leer: true, fontSize, bold, farbe });
                    });
                    continue;
                }
                teile.push({ text: stueck, leer: /^\s+$/.test(stueck), fontSize, bold, farbe });
            }
        }
        const zeilen = [];
        let lauf = [];
        const abschliessen = () => {
            /* Zwischenräume am Zeilenende zählen nicht mit — sonst steht eine
               zentrierte Zeile um ein Leerzeichen zu weit links. */
            while (lauf.length && lauf[lauf.length - 1].leer)
                lauf.pop();
            const stuecke = [];
            let hoehe = 0;
            for (const t of lauf) {
                const letztes = stuecke[stuecke.length - 1];
                /* Gleiches Format nebeneinander wird EIN Stück — weniger `tspan`,
                   und das Kerning stimmt innerhalb eines Wortes wieder. */
                if (letztes && letztes.fontSize === t.fontSize && letztes.bold === t.bold
                    && letztes.farbe === t.farbe)
                    letztes.text += t.text;
                else
                    stuecke.push({ text: t.text, fontSize: t.fontSize,
                        bold: t.bold, farbe: t.farbe });
                if (t.fontSize > hoehe)
                    hoehe = t.fontSize;
            }
            if (!hoehe)
                hoehe = grundGrad;
            zeilen.push({ stuecke, hoehe: hoehe * TEXT_ZEILE, basis: hoehe * 0.85 });
            lauf = [];
        };
        let breiteJetzt = 0;
        for (const t of teile) {
            if (t.text === '\n') {
                abschliessen();
                breiteJetzt = 0;
                continue;
            }
            const breite = textWidth(t.text, t.fontSize, family, t.bold);
            /* Ein Zwischenraum am Zeilenanfang wird geschluckt, nicht umgebrochen. */
            if (t.leer && !lauf.length)
                continue;
            if (lauf.length && breiteJetzt + breite > max && !t.leer) {
                abschliessen();
                breiteJetzt = 0;
            }
            lauf.push(t);
            breiteJetzt += breite;
        }
        abschliessen();
        return zeilen;
    };
    /** Kasten, Zeilen und Masse eines Textkastens — oder null fuer eine alte, einzeilige Textmarke. */
    const textLayout = (mark) => {
        const width = finite(mark?.breiteBox);
        if (!(width > 0))
            return null;
        const point = points([mark.point])[0] || [0, 0];
        const fontSize = Math.max(8, finite(mark.fontSize) || 18);
        const pad = Math.round(fontSize * 0.35);
        const family = String(mark.schrift || 'standard');
        const bold = !!mark.fett;
        const max = width - pad * 2;
        /* MEHRERE FORMATE IN EINEM ABSATZ (E561) — nur wenn die Marke sie hat.
           Ohne `laeufe` läuft alles darunter wie seit E360. */
        const laeufe = Array.isArray(mark.laeufe) ? mark.laeufe : null;
        const zeilen = laeufe && laeufe.length ? laufSatz(laeufe, max, family, fontSize, bold) : null;
        const lines = zeilen
            ? zeilen.map(z => z.stuecke.map(st => st.text).join(''))
            : textLines(String(mark.text || ''), max, fontSize, family, bold);
        /* DIE AUSRICHTUNG GEHOERT ZUM KASTEN, NICHT ZUM ZEICHNER (E560).
           Sie steht hier, weil sie die Zeilen und die Breite braucht — und weil
           der Auswahlkasten dieselbe Rechnung sehen muss wie das SVG. Die drei
           Namen sind die des Hauses (`bild-rahmen aus-links`), nicht neue. */
        const roh = String(mark.ausricht || 'links');
        const ausricht = (roh === 'mitte' || roh === 'rechts') ? roh : 'links';
        /* Die Höhe ist die Summe der Zeilenhöhen, sobald die Zeilen verschieden
           hoch sein können — sonst läuft der Kasten unter einer 36-pt-Zeile zu
           kurz aus, und die Marke darunter liegt darin. */
        const hoehe = zeilen
            ? pad * 2 + zeilen.reduce((summe, z) => summe + z.hoehe, 0)
            : pad * 2 + lines.length * fontSize * TEXT_ZEILE;
        return { x: point[0], y: point[1], width, height: hoehe,
            pad, zeile: fontSize * TEXT_ZEILE, fontSize, family, bold, lines, ausricht,
            ...(zeilen ? { zeilen } : {}) };
    };
    /** Die Linienzuege — sie drehen ihre Punkte; alles andere hat einen Kasten. */
    const LINIEN = new Set(['stift', 'marker', 'line', 'arrow']);
    /**
     * Punkte um einen Anker drehen — `grad` im Uhrzeigersinn, wie SVGs
     * `rotate` (E466). Die eine Drehformel des Hauses: `ecken`, `bounds`,
     * `rotate`, `touchesCircle` und `scale` rechnen alle mit ihr, statt sie
     * je einmal hinzuschreiben (E474).
     */
    const drehePunkte = (pts, anker, grad) => {
        const rad = (grad * Math.PI) / 180;
        const cos = Math.cos(rad), sin = Math.sin(rad);
        return pts.map(([x, y]) => [
            anker[0] + (x - anker[0]) * cos - (y - anker[1]) * sin,
            anker[1] + (x - anker[0]) * sin + (y - anker[1]) * cos
        ]);
    };
    const umschliessend = (pts) => {
        const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
        const x0 = Math.min(...xs), y0 = Math.min(...ys);
        return { x: x0, y: y0, width: Math.max(...xs) - x0, height: Math.max(...ys) - y0 };
    };
    /** Der Winkel, um den eine Marke schief steht — Linienzuege stehen nie
     *  schief, sie drehen ihre Punkte (E466). */
    const drehung = (mark) => LINIEN.has(String(mark?.art || '')) ? 0 : finite(mark?.dreh);
    /**
     * DIE VIER ECKEN EINER MARKE (E474) — im Blattraum, im Umlauf
     * nw, ne, se, sw, also als Weg um ihre Flaeche herum. Bei `dreh` sind
     * es die WIRKLICH gedrehten Ecken: dieselben vier Punkte, die man auf
     * dem Blatt sieht.
     *
     * Das ist der Unterschied zu `bounds`: `bounds` gibt den aufrechten
     * Kasten UM diese Ecken. Der ist bei 45° fast doppelt so gross wie die
     * Marke selbst — richtig, um zu fragen „koennte es hier ueberhaupt
     * sein", falsch, um zu fragen „ist es hier".
     */
    const ecken = (mark) => {
        const b = boundsRoh(mark);
        const roh = [[b.x, b.y], [b.x + b.width, b.y],
            [b.x + b.width, b.y + b.height], [b.x, b.y + b.height]];
        const grad = drehung(mark);
        return grad ? drehePunkte(roh, [b.x + b.width / 2, b.y + b.height / 2], grad) : roh;
    };
    const bounds = (mark) => {
        const roh = boundsRoh(mark);
        const grad = drehung(mark);
        if (!grad)
            return roh;
        return umschliessend(drehePunkte([[roh.x, roh.y], [roh.x + roh.width, roh.y],
            [roh.x, roh.y + roh.height], [roh.x + roh.width, roh.y + roh.height]], [roh.x + roh.width / 2, roh.y + roh.height / 2], grad));
    };
    const boundsRoh = (mark) => {
        if (mark?.art === 'text') {
            const layout = textLayout(mark);
            if (layout)
                return { x: layout.x, y: layout.y, width: layout.width, height: layout.height };
            const point = points([mark.point])[0] || [0, 0];
            const fontSize = Math.max(8, finite(mark.fontSize) || 18);
            const width = Math.max(fontSize, String(mark.text || '').length * fontSize * 0.58);
            return { x: point[0], y: point[1] - fontSize, width, height: fontSize * 1.25 };
        }
        const input = points(mark?.pts);
        if (!input.length)
            return { x: 0, y: 0, width: 0, height: 0 };
        const xs = input.map(point => point[0]);
        const ys = input.map(point => point[1]);
        const padding = Math.max(2, (finite(mark?.breite) || 2.4) / 2);
        const x = Math.min(...xs) - padding;
        const y = Math.min(...ys) - padding;
        return {
            x, y,
            width: Math.max(padding * 2, Math.max(...xs) - Math.min(...xs) + padding * 2),
            height: Math.max(padding * 2, Math.max(...ys) - Math.min(...ys) + padding * 2)
        };
    };
    const move = (mark, dx, dy) => {
        if (!mark || typeof mark !== 'object')
            return mark;
        if (Array.isArray(mark.pts))
            mark.pts = points(mark.pts)
                .map(point => [point[0] + finite(dx), point[1] + finite(dy)]);
        if (Array.isArray(mark.point)) {
            const point = points([mark.point])[0] || [0, 0];
            mark.point = [point[0] + finite(dx), point[1] + finite(dy)];
        }
        return mark;
    };
    /**
     * Um `pivot` drehen — `degrees` im Uhrzeigersinn, wie SVGs `rotate` (E466).
     *
     * Linienzuege drehen ihre PUNKTE: verlustfrei, kein neues Feld. Alles
     * mit Kasten (Formen, Band, Zettel, Bild, Text, Zeichen) dreht seine
     * Mitte um den Anker und merkt sich den Winkel in `dreh` — zwei
     * Eckpunkte koennen keinen schiefen Kasten beschreiben, und die Ecken
     * zu drehen hiesse, die Marke zu verzerren. Alte Marken ohne `dreh`
     * bleiben, was sie sind (§53.3). Aendert die Marke selbst, wie `move`.
     */
    const rotate = (mark, pivot, degrees) => {
        if (!mark || typeof mark !== 'object')
            return mark;
        const grad = finite(degrees);
        if (!grad)
            return mark;
        const r2 = (v) => Math.round(v * 100) / 100;
        const um = (p) => {
            const q = drehePunkte([p], pivot, grad)[0];
            return [r2(q[0]), r2(q[1])];
        };
        if (LINIEN.has(String(mark.art)) && Array.isArray(mark.pts)) {
            mark.pts = points(mark.pts).map(um);
            return mark;
        }
        const b = bounds(mark);
        const mitte = [b.x + b.width / 2, b.y + b.height / 2];
        const neu = um(mitte);
        move(mark, neu[0] - mitte[0], neu[1] - mitte[1]);
        let d = (finite(mark.dreh) + grad) % 360;
        if (d > 180)
            d -= 360;
        if (d <= -180)
            d += 360;
        if (Math.abs(d) < 0.01)
            delete mark.dreh;
        else
            mark.dreh = r2(d);
        return mark;
    };
    /**
     * ÜBERLAPPEN ZWEI KONVEXE VIELECKE? Trennachsen-Test (E474): gibt es
     * eine Gerade, auf der die Schatten der beiden auseinanderfallen, dann
     * beruehren sie sich nicht. Als Achsen genuegen die Normalen der Kanten
     * — bei zwei Vierecken also acht Proben.
     *
     * Gebraucht fuer den Kastenzug ueber eine GEDREHTE Marke: `intersects`
     * vergleicht zwei aufrechte Kaesten und sagt bei 45° ja, wo die Marke
     * gar nicht steht. `intersects` bleibt der billige Vorfilter, das hier
     * die Antwort.
     */
    const overlapConvex = (a, b) => {
        for (const poly of [a, b]) {
            for (let i = 0; i < poly.length; i++) {
                const von = poly[i], bis = poly[(i + 1) % poly.length];
                const nx = -(bis[1] - von[1]), ny = bis[0] - von[0];
                if (!nx && !ny)
                    continue;
                let aMin = Infinity, aMax = -Infinity, bMin = Infinity, bMax = -Infinity;
                for (const q of a) {
                    const v = q[0] * nx + q[1] * ny;
                    if (v < aMin)
                        aMin = v;
                    if (v > aMax)
                        aMax = v;
                }
                for (const q of b) {
                    const v = q[0] * nx + q[1] * ny;
                    if (v < bMin)
                        bMin = v;
                    if (v > bMax)
                        bMax = v;
                }
                if (aMax < bMin || bMax < aMin)
                    return false;
            }
        }
        return true;
    };
    /** Die vier Ecken eines aufrechten Kastens, im Umlauf. */
    const kastenEcken = (b) => [[b.x, b.y], [b.x + b.width, b.y], [b.x + b.width, b.y + b.height], [b.x, b.y + b.height]];
    const intersects = (left, right) => left.x <= right.x + right.width && left.x + left.width >= right.x &&
        left.y <= right.y + right.height && left.y + left.height >= right.y;
    /** Der kleinste Abstand eines Punktes zu einem Linienzug (ein Punkt: zu ihm). */
    const distanceToPolyline = (raw, point) => {
        const input = points(raw);
        if (!input.length)
            return Infinity;
        if (input.length === 1)
            return Math.hypot(point[0] - input[0][0], point[1] - input[0][1]);
        let best = Infinity;
        for (let i = 1; i < input.length; i++)
            best = Math.min(best, distanceToSegment(point, input[i - 1], input[i]));
        return best;
    };
    /**
     * EINE LINIE DICHTER ABTASTEN (E510).
     *
     * DER FUND. Zwei Marken mit demselben Weg werden verschieden gemessen,
     * je nachdem, wie viele Punkte zufällig darin stehen. Ein Stift-Strich
     * über 200 px hat dreihundert Punkte; eine gerade `line` über dieselben
     * 200 px hat ZWEI — ihre Enden. Jede Regel der Form „mindestens die
     * Hälfte ihrer Punkte liegt nah am Zug" fragt beim Strich nach seiner
     * LÄNGE und bei der Linie nur nach ihren ENDEN. Das ist nicht dieselbe
     * Frage, und beim Kritzel-Löschen war es der Unterschied zwischen
     * „gelöscht" und „passiert nichts": ein Gekritzel quer über die Mitte
     * einer Linie berührte keines ihrer beiden Enden.
     *
     * Hier kommen Zwischenpunkte im Abstand `schritt` dazu — nicht als neue
     * Daten, sondern als Messpunkte für genau solche Fragen. Die Ecken
     * bleiben alle erhalten; es wird nur zwischen ihnen aufgefüllt.
     *
     * DIE OBERGRENZE IST KEIN SCHMUCK. Ein Zug über eine ganze Seite mit
     * Schritt 1 wären Zehntausende Punkte, und `distanceToPolyline` läuft
     * für jeden davon über den ganzen Gegenzug. `GRENZE` hält die Rechnung
     * bei ein paar Tausend; wer mehr Punkte bräuchte, misst ohnehin etwas,
     * das mit ein paar Tausend genauso beantwortet ist.
     */
    const DICHTER_GRENZE = 4000;
    const densify = (raw, schritt = 6) => {
        const input = points(raw);
        if (input.length < 2)
            return input;
        const weite = Math.max(0.5, finite(schritt) || 6);
        const out = [input[0]];
        for (let i = 1; i < input.length; i++) {
            const a = input[i - 1], b = input[i];
            const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
            const teile = Math.min(Math.ceil(d / weite), Math.max(1, DICHTER_GRENZE - out.length));
            for (let k = 1; k < teile; k++)
                out.push([a[0] + (b[0] - a[0]) * k / teile, a[1] + (b[1] - a[1]) * k / teile]);
            out.push(b);
            if (out.length >= DICHTER_GRENZE)
                break;
        }
        return out;
    };
    /**
     * TRIFFT DER RADIERER DIESE MARKE? (E352)
     * Linienzuege (Stift, Marker, Linie, Pfeil) werden am Weg gemessen, die
     * halbe Strichbreite als Zugabe; alles andere (Rechteck, Ellipse, Band,
     * Zettel, Text, Zeichen) am Kasten, den `bounds` kennt.
     */
    /**
     * ERST DER KASTEN, DANN DER WEG (E377).
     *
     * Bis hierher ging ein Strich SOFORT in `distanceToPolyline` — jeder Punkt,
     * jede Wurzel, und dazu eine frisch gebaute Punktliste. Auch ein Strich am
     * anderen Ende der Seite. Gemessen bei 400 Strichen und einem schnellen
     * Radierzug (120 px zwischen zwei Ereignissen, 30 Teilschritte): 8,27 ms
     * je Zeigerereignis — ein ganzes Bild bei 120 Hz.
     *
     * Ein Kreis kann eine Linie nur beruehren, wenn er ihren KASTEN beruehrt.
     * Der Kasten wird hier in EINEM Durchlauf gerechnet, ohne eine Liste zu
     * bauen — anders als `bounds()`, das sieben Durchlaeufe und drei Listen
     * braucht und darum als Vorfilter nichts einbraechte.
     *
     * Der Kasten ist eine sichere Schranke, keine Naeherung: er wird um
     * `radius + halfWidth` geweitet, also kann kein Treffer durch ihn
     * verlorengehen. test367 prueft das gegen den alten Weg an zehntausend
     * zufaelligen Faellen.
     */
    const touchesCircle = (mark, center, radius, halfWidth = 0) => {
        const reichweite = radius + Math.max(0, finite(halfWidth));
        const art = String(mark?.art || '');
        const linie = art === 'stift' || art === 'marker' || art === 'line' || art === 'arrow';
        if (linie && Array.isArray(mark?.pts) && mark.pts.length) {
            const roh = mark.pts;
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            for (let i = 0; i < roh.length; i++) {
                const q = roh[i];
                if (!Array.isArray(q) || q.length < 2)
                    continue;
                const x = finite(q[0]), y = finite(q[1]);
                if (x < minX)
                    minX = x;
                if (x > maxX)
                    maxX = x;
                if (y < minY)
                    minY = y;
                if (y > maxY)
                    maxY = y;
            }
            if (minX === Infinity)
                return false;
            const bx = Math.max(minX - center[0], 0, center[0] - maxX);
            const by = Math.max(minY - center[1], 0, center[1] - maxY);
            if (bx * bx + by * by > reichweite * reichweite)
                return false;
            return distanceToPolyline(mark.pts, center) <= reichweite;
        }
        const box = boundsRoh(mark);
        /* EINE MARKE OHNE PUNKTE HAT KEINEN ORT (E377, von test367 §2 gefunden).
           `bounds()` gibt ihr ersatzweise einen Kasten der Groesse null bei
           (0,0) — das ist eine Notloesung, kein Ort. Ohne diese Zeile
           „beruehrt" ein Radierer am linken oberen Rand der Seite JEDE leere
           Marke. Der Nullkasten laesst sich sicher erkennen: eine echte Marke
           bekommt in `bounds()` immer mindestens den Rand von zwei Pixeln
           (bei Text die Zeilenhoehe), also nie Breite UND Hoehe null. */
        if (!box.x && !box.y && !box.width && !box.height)
            return false;
        /* DER RADIERER AUF EINER GEDREHTEN MARKE (E474). Bis hierher wurde der
           AUFRECHTE Kasten um die gedrehte Marke gemessen. Der ist bei 45°
           fast doppelt so gross wie sie: der Radierer nahm sie neben ihrer
           Kante mit, wo nichts steht, und verfehlte sie an der langen Ecke.
           Ein Kreis bleibt beim Drehen ein Kreis — also wird nicht die Marke
           aufgerichtet, sondern der MITTELPUNKT in ihren Rahmen gedreht.
           Danach ist es Zeile fuer Zeile dieselbe genaue Rechnung wie zuvor. */
        const grad = drehung(mark);
        const mitte = grad
            ? drehePunkte([center], [box.x + box.width / 2, box.y + box.height / 2], -grad)[0]
            : center;
        const dx = Math.max(box.x - mitte[0], 0, mitte[0] - (box.x + box.width));
        const dy = Math.max(box.y - mitte[1], 0, mitte[1] - (box.y + box.height));
        return dx * dx + dy * dy <= radius * radius;
    };
    /** Die Parameter t (aufsteigend), an denen die Strecke a→b den Kreis
        schneidet — oder null, wenn ihre Gerade den Kreis verfehlt. */
    const circleCuts = (a, b, center, radius) => {
        const dx = b[0] - a[0], dy = b[1] - a[1];
        const fx = a[0] - center[0], fy = a[1] - center[1];
        const qa = dx * dx + dy * dy;
        if (!qa)
            return null;
        const qb = 2 * (fx * dx + fy * dy);
        const qc = fx * fx + fy * fy - radius * radius;
        const disc = qb * qb - 4 * qa * qc;
        if (disc < 0)
            return null;
        const wurzel = Math.sqrt(disc);
        return [(-qb - wurzel) / (2 * qa), (-qb + wurzel) / (2 * qa)];
    };
    /**
     * TEIL-RADIEREN (E352): ein Linienzug minus ein Kreis. Uebrig bleiben
     * null, ein oder mehrere Stuecke — jedes mit seinen Druckwerten, an den
     * Schnittpunkten linear dazwischen gerechnet. Ein Stueck braucht zwei
     * Punkte; ein einzelner Rest faellt weg. Punkte, die der Kreis nicht
     * beruehrt, bleiben exakt, was sie waren.
     */
    const splitByCircle = (raw, pressures, center, radius) => {
        const input = points(raw);
        const druck = Array.isArray(pressures) ? pressures.map(finite) : [];
        const druckBei = (i) => druck.length ? druck[Math.min(i, druck.length - 1)] : 0.5;
        const r2 = (v) => Math.round(v * 100) / 100;
        const inside = (p) => Math.hypot(p[0] - center[0], p[1] - center[1]) <= radius;
        const zwischen = (a, b, t) => [r2(a[0] + (b[0] - a[0]) * t), r2(a[1] + (b[1] - a[1]) * t)];
        const stuecke = [];
        let aktuell = { pts: [], pressure: [] };
        const ablegen = () => {
            if (aktuell.pts.length >= 2)
                stuecke.push(aktuell);
            aktuell = { pts: [], pressure: [] };
        };
        if (!input.length)
            return stuecke;
        if (!inside(input[0])) {
            aktuell.pts.push(input[0]);
            aktuell.pressure.push(r2(druckBei(0)));
        }
        for (let i = 1; i < input.length; i++) {
            const a = input[i - 1], b = input[i];
            const aDrin = inside(a), bDrin = inside(b);
            const da = druckBei(i - 1), db = druckBei(i);
            const cuts = circleCuts(a, b, center, radius);
            const klemm = (t) => Math.max(0, Math.min(1, t));
            if (aDrin && bDrin)
                continue;
            if (!aDrin && bDrin) {
                /* hinein: das Stueck endet am Eintrittspunkt */
                const t = klemm(cuts ? cuts[0] : 0);
                aktuell.pts.push(zwischen(a, b, t));
                aktuell.pressure.push(r2(da + (db - da) * t));
                ablegen();
                continue;
            }
            if (aDrin && !bDrin) {
                /* heraus: ein neues Stueck beginnt am Austrittspunkt */
                const t = klemm(cuts ? cuts[1] : 1);
                aktuell = { pts: [zwischen(a, b, t)], pressure: [r2(da + (db - da) * t)] };
                aktuell.pts.push(b);
                aktuell.pressure.push(r2(db));
                continue;
            }
            /* beide draussen: kreuzt die Strecke den Kreis mittendrin? */
            if (cuts && cuts[0] > 0 && cuts[0] < 1 && cuts[1] > 0 && cuts[1] < 1) {
                aktuell.pts.push(zwischen(a, b, cuts[0]));
                aktuell.pressure.push(r2(da + (db - da) * cuts[0]));
                ablegen();
                aktuell = { pts: [zwischen(a, b, cuts[1])], pressure: [r2(da + (db - da) * cuts[1])] };
            }
            aktuell.pts.push(b);
            aktuell.pressure.push(r2(db));
        }
        ablegen();
        return stuecke;
    };
    /** Liegt der Punkt in dem geschlossenen Linienzug? Strahl nach rechts,
        Kanten gezaehlt (E353, das Lasso). */
    const insidePolygon = (point, polygon) => {
        const poly = points(polygon);
        const n = poly.length;
        if (n < 3)
            return false;
        let inside = false;
        for (let i = 0, j = n - 1; i < n; j = i++) {
            const [xi, yi] = poly[i];
            const [xj, yj] = poly[j];
            const kreuzt = (yi > point[1]) !== (yj > point[1]) &&
                point[0] < (xj - xi) * (point[1] - yi) / ((yj - yi) || 1e-9) + xi;
            if (kreuzt)
                inside = !inside;
        }
        return inside;
    };
    /** Die Flaeche eines geschlossenen Linienzugs (Schnuerband-Formel, ohne Vorzeichen). */
    const polygonArea = (polygon) => {
        const poly = points(polygon);
        if (poly.length < 3)
            return 0;
        let summe = 0;
        for (let i = 0, j = poly.length - 1; i < poly.length; j = i++)
            summe += poly[j][0] * poly[i][1] - poly[i][0] * poly[j][1];
        return Math.abs(summe) / 2;
    };
    /** Der gemeinsame Kasten mehrerer Kaesten; ohne Kaesten ein leerer. */
    const union = (boxes) => {
        if (!boxes.length)
            return { x: 0, y: 0, width: 0, height: 0 };
        const x0 = Math.min(...boxes.map(b => b.x));
        const y0 = Math.min(...boxes.map(b => b.y));
        const x1 = Math.max(...boxes.map(b => b.x + b.width));
        const y1 = Math.max(...boxes.map(b => b.y + b.height));
        return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
    };
    /**
     * SKALIEREN UM EINEN ANKER (E353): Punkte und Textpunkt wandern vom
     * Anker weg oder zu ihm hin; Strichbreite und Schriftgroesse folgen mit
     * dem geometrischen Mittel beider Faktoren, damit ein dreimal so grosser
     * Schriftzug nicht mit haarduennem Strich dasteht. Aendert die Marke
     * selbst und gibt sie zurueck, wie `move`.
     */
    /**
     * GROESSE AENDERN — und zwar so, dass eine GEDREHTE Marke dabei nicht
     * verzerrt (E474).
     *
     * `sx` und `sy` gelten in den Achsen von `achse` (Grad, 0 = die Achsen
     * des Blattes). Eine Marke mit `dreh` steht darin schief: ihre zwei
     * Eckpunkte beschreiben einen aufrechten Kasten, den `dreh` erst dreht.
     * Wer die Faktoren dann einfach auf die Punkte legt — so war es bis
     * hierher —, streckt den KASTEN in seinen eigenen Achsen und dreht das
     * Ergebnis: die Marke waechst in eine andere Richtung, als der Mensch
     * zieht, und ihre Ecke laeuft unter dem Griff weg.
     *
     * Ganz richtig waere eine Scherung, und die kann dieses Datenmodell
     * nicht: zwei Punkte und ein Winkel beschreiben keinen schiefen Kasten
     * (E466). Ein drittes Feld dafuer waere eine Datenaenderung an jeder
     * vorhandenen Marke (§53.3). Also wird das getan, was ohne neues Feld
     * genau bleibt, wo es genau sein kann:
     *
     *   · Die MITTE geht dorthin, wo die Streckung sie hinlegt. Immer
     *     genau, auch schief — das ist die Lage in der Gruppe.
     *   · Die GROESSE waechst in den Achsen der MARKE, mit den Faktoren,
     *     die dort ankommen:
     *
     *         d   = dreh − achse
     *         sxL = sx·cos²d + sy·sin²d
     *         syL = sx·sin²d + sy·cos²d
     *
     *     Das ist die Hauptdiagonale der gedrehten Streckung; die Scherung
     *     daneben faellt weg. GENAU ist das, wenn d ein Vielfaches von 90°
     *     ist — dann tauschen die beiden Faktoren, wie es sein muss — oder
     *     wenn sx = sy ist, denn eine gleichmaessige Streckung ist in jeder
     *     Lage dieselbe. Am schiefsten steht es bei 45°: dort werden beide
     *     Faktoren gleich, und die Marke waechst in der Mitte zwischen den
     *     zwei Richtungen, statt sich zu scheren.
     *
     * Steht die Auswahl auf EINER gedrehten Marke, gibt `marken.ts` ihren
     * eigenen Winkel als `achse` mit. Dann ist d = 0, und die Rechnung ist
     * nicht genaehert, sondern exakt: der Griff, den man haelt, bleibt auf
     * den Punkt stehen, an dem er war.
     */
    const scale = (mark, anchor, sx, sy, achse = 0) => {
        if (!mark || typeof mark !== 'object')
            return mark;
        const r2 = (v) => Math.round(v * 100) / 100;
        const fx = Number.isFinite(sx) ? sx : 1;
        const fy = Number.isFinite(sy) ? sy : 1;
        const ax = Number.isFinite(achse) ? Number(achse) : 0;
        const grad = drehung(mark);
        let lx = fx, ly = fy;
        let f = (p) => [r2(anchor[0] + (p[0] - anchor[0]) * fx), r2(anchor[1] + (p[1] - anchor[1]) * fy)];
        if (grad || ax) {
            const d = ((grad - ax) * Math.PI) / 180;
            const c2 = Math.cos(d) * Math.cos(d), s2 = Math.sin(d) * Math.sin(d);
            lx = fx * c2 + fy * s2;
            ly = fx * s2 + fy * c2;
            const roh = boundsRoh(mark);
            const mitte = [roh.x + roh.width / 2, roh.y + roh.height / 2];
            /* Die Mitte in die Achsen der Streckung drehen, dort strecken, zurueck. */
            const inAchse = ax ? drehePunkte([mitte], anchor, -ax)[0] : mitte;
            const gestreckt = [anchor[0] + (inAchse[0] - anchor[0]) * fx,
                anchor[1] + (inAchse[1] - anchor[1]) * fy];
            const neu = ax ? drehePunkte([gestreckt], anchor, ax)[0] : gestreckt;
            const vx = neu[0] - mitte[0], vy = neu[1] - mitte[1];
            f = (p) => [
                r2(mitte[0] + (p[0] - mitte[0]) * lx + vx),
                r2(mitte[1] + (p[1] - mitte[1]) * ly + vy)
            ];
        }
        if (Array.isArray(mark.pts))
            mark.pts = points(mark.pts).map(f);
        if (Array.isArray(mark.point))
            mark.point = f(points([mark.point])[0] || [0, 0]);
        const mittel = Math.sqrt(Math.abs(lx * ly)) || 1;
        if (mark.breite !== undefined && Number.isFinite(Number(mark.breite)))
            mark.breite = Math.max(0.3, r2(Number(mark.breite) * mittel));
        if (mark.fontSize !== undefined && Number.isFinite(Number(mark.fontSize)))
            mark.fontSize = Math.max(6, r2(Number(mark.fontSize) * mittel));
        if (mark.groesse !== undefined && Number.isFinite(Number(mark.groesse)))
            mark.groesse = Math.max(12, r2(Number(mark.groesse) * mittel));
        /* Der Textkasten (E360) waechst in der Breite mit — die Schrift mit dem
           Mittel. `lx` und nicht `fx`: die Breite ist die Breite der MARKE. */
        if (mark.breiteBox !== undefined && Number.isFinite(Number(mark.breiteBox)))
            mark.breiteBox = Math.max(24, r2(Number(mark.breiteBox) * Math.abs(lx)));
        return mark;
    };
    return { points, simplify, simplifyIndices, densify, outline, outlinePunkte, spitzeFaktor, verjuengen,
        path, rectangle, bounds, move, intersects,
        distanceToPolyline, touchesCircle, splitByCircle, insidePolygon, polygonArea, union, scale, rotate,
        textWidth, textLines, textLayout, LINIEN, SCHRIFTEN, schriftStapel, gemessenAn,
        /* Seit E474: der aufrechte Kasten der Marke OHNE ihre Drehung, ihre
           vier wirklichen Ecken, ihr Winkel und die eine Drehformel. */
        boundsLokal: boundsRoh, ecken, drehung, drehePunkte, overlapConvex, kastenEcken };
})();
window.InkGeometry = InkGeometry;
