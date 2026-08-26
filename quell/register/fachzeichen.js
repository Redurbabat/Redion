"use strict";
/* ============================================================================
 * register/fachzeichen.js — die elektrotechnischen Symbole an einer Stelle
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/register/fachzeichen.ts`. `npm run bauen:ts` schreibt
 * daraus `quell/register/fachzeichen.js`. Wer das .js bearbeitet, verliert die
 * Änderung beim nächsten Bauen; `pruefungen/lauf/test105.mts` meldet es vorher.
 * ----------------------------------------------------------------------------
 * WAS HIER STEHT UND WAS NICHT
 *
 * Hier stehen die Fachzeichen: Form, Name, Gruppe, Anschlüsse. Ein Register
 * beschreibt, es rechnet nicht — der Schaltplan-Editor zeichnet damit, die
 * Lernmodi fragen damit ab, die Aufgaben bauen damit. Keiner von ihnen hat
 * eine eigene Symbolliste, und genau das ist der Zweck (L34: ein Wert an
 * zwei Stellen ist einer zu viel).
 *
 * EHRLICH ZUR NORM. Diese Zeichen sind an IEC 60617 / EN 60617 angelehnt und
 * für die AUSBILDUNG gedacht. Sie sind keine geprüfte Normbibliothek, und
 * Redion trifft keine normativen Entscheidungen (E128). Was die Bibliothek
 * zusagt, ist etwas Kleineres und Nachprüfbares: INNERHALB dieser Bibliothek
 * sind die Grössen einheitlich — jedes Zeichen sitzt im selben Raster, und
 * gleiche Bauteilfamilien haben gleiche Kästen. Ein Plan sieht dadurch
 * ruhig aus, ohne dass jemand etwas verspricht, das er nicht halten kann.
 *
 * DAS RASTER. Alles rechnet in Vielfachen von `RASTER` (10). Ein Zeichen hat
 * eine Breite und Höhe in Pixeln, und jeder Anschluss liegt auf einem
 * Rasterpunkt am Rand. Nur dadurch können Leitungen später magnetisch
 * einrasten, ohne dass jemand Koordinaten von Hand nachmisst.
 *
 * DIE ANSCHLUSSNUMMERN sind die üblichen aus der Ausbildung: 1/2 am Öffner,
 * 3/4 am Schliesser, A1/A2 an der Spule, L/N am Netz. Sie sind ein VORSCHLAG
 * je Zeichen; im Plan lassen sie sich überschreiben (Punkt 18), denn ein
 * Klemmenplan kennt andere Nummern als eine Übung.
 * ==========================================================================*/
window.Register = window.Register || {};
Register.fachzeichen = (() => {
    /** Feinraster in Pixeln. Alle Zeichen und Anschlüsse liegen darauf. */
    const RASTER = 10;
    const GRUPPEN = [
        /* Kennung        Name                 Zeichen */
        ['schalter', 'Schalter', '⎔'],
        ['kontakte', 'Kontakte', '⌇'],
        ['relais', 'Relais und Schütze', '▭'],
        ['schutz', 'Schutzgeräte', '⏻'],
        ['motoren', 'Motoren', 'Ⓜ'],
        ['messen', 'Messgeräte', 'Ⓥ'],
        ['sensoren', 'Sensoren', '◈'],
        ['quellen', 'Quellen und Erde', '⏦'],
        ['passiv', 'Passive Bauteile', '▬'],
        ['halbleiter', 'Halbleiter', '▷'],
        ['melder', 'Lampen und Melder', '⊗'],
        ['stecker', 'Steckvorrichtungen', '⊃'],
        ['leitungen', 'Leitungen', '┼'],
        /* Die Schweizer Schalterschemas und Bauplansymbole. Sie sind eine eigene
           Gruppe und nicht unter „Schalter" gemischt, weil sie eine andere
           DARSTELLUNG derselben Sache sind: im Bauplan zeichnet man den Schalter
           als Kreis am Ort, im Stromlaufschema als Kontakt im Kreis. Wer beides
           durcheinanderwirft, zeichnet einen Plan, den niemand liest. */
        ['ch-schema', 'Schalterschemas CH', '⓪'],
        ['ch-bauplan', 'Bauplan CH', '⌂']
    ];
    /* Kurzschreibweisen, damit die Liste unten lesbar bleibt. */
    const senkrecht = (x, von, bis) => `M${x},${von} V${bis}`;
    const waagrecht = (y, von, bis) => `M${von},${y} H${bis}`;
    const EINGEBAUT = [
        /* ---- Schalter -------------------------------------------------------- */
        {
            id: 'schliesser', name: 'Schliesser', gruppe: 'kontakte', kennbuchstabe: 'S',
            w: 40, h: 60,
            pfad: [senkrecht(20, 0, 16), waagrecht(16, 12, 28), senkrecht(20, 44, 60),
                'M20,44 L32,14'],
            anschluesse: [{ nr: '3', x: 20, y: 0 }, { nr: '4', x: 20, y: 60 }],
            erklaerung: 'Offen in Ruhe. Schliesst, wenn betätigt wird.'
        },
        {
            id: 'oeffner', name: 'Öffner', gruppe: 'kontakte', kennbuchstabe: 'S',
            w: 40, h: 60,
            pfad: [senkrecht(20, 0, 16), senkrecht(20, 44, 60),
                'M20,44 L32,14', waagrecht(16, 26, 38)],
            anschluesse: [{ nr: '1', x: 20, y: 0 }, { nr: '2', x: 20, y: 60 }],
            erklaerung: 'Geschlossen in Ruhe. Öffnet, wenn betätigt wird.'
        },
        {
            id: 'wechsler', name: 'Wechsler', gruppe: 'kontakte', kennbuchstabe: 'S',
            w: 60, h: 60,
            pfad: [senkrecht(10, 0, 16), senkrecht(50, 0, 16),
                waagrecht(16, 4, 18), waagrecht(16, 44, 58),
                senkrecht(30, 44, 60), 'M30,44 L14,16'],
            anschluesse: [{ nr: '11', x: 30, y: 60 }, { nr: '12', x: 10, y: 0 },
                { nr: '14', x: 50, y: 0 }],
            erklaerung: 'Ein gemeinsamer Anschluss, der zwischen zwei Wegen umschaltet.'
        },
        {
            id: 'taster-schliesser', name: 'Taster (Schliesser)', gruppe: 'schalter', kennbuchstabe: 'S',
            w: 40, h: 60,
            pfad: [senkrecht(20, 0, 16), waagrecht(16, 12, 28), senkrecht(20, 44, 60),
                'M20,44 L32,14', senkrecht(32, 6, 14), waagrecht(6, 26, 38)],
            anschluesse: [{ nr: '3', x: 20, y: 0 }, { nr: '4', x: 20, y: 60 }],
            erklaerung: 'Schliesst nur, solange gedrückt wird. Fällt danach zurück.'
        },
        {
            id: 'taster-oeffner', name: 'Taster (Öffner)', gruppe: 'schalter', kennbuchstabe: 'S',
            w: 40, h: 60,
            pfad: [senkrecht(20, 0, 16), senkrecht(20, 44, 60),
                'M20,44 L32,14', waagrecht(16, 26, 38), senkrecht(32, 6, 14),
                waagrecht(6, 26, 38)],
            anschluesse: [{ nr: '1', x: 20, y: 0 }, { nr: '2', x: 20, y: 60 }],
            erklaerung: 'Öffnet nur, solange gedrückt wird — zum Beispiel ein Stopp-Taster.'
        },
        {
            id: 'ausschalter', name: 'Ausschalter', gruppe: 'schalter', kennbuchstabe: 'S',
            w: 40, h: 60,
            pfad: [senkrecht(20, 0, 16), senkrecht(20, 44, 60), 'M20,44 L32,14',
                waagrecht(16, 12, 28)],
            anschluesse: [{ nr: '1', x: 20, y: 0 }, { nr: '2', x: 20, y: 60 }],
            erklaerung: 'Schaltet eine Leuchte von einer Stelle aus ein und aus.'
        },
        {
            id: 'wechselschalter', name: 'Wechselschalter', gruppe: 'schalter', kennbuchstabe: 'S',
            w: 60, h: 60,
            pfad: [senkrecht(10, 0, 16), senkrecht(50, 0, 16),
                senkrecht(30, 44, 60), 'M30,44 L14,16',
                waagrecht(16, 4, 18), waagrecht(16, 44, 58)],
            anschluesse: [{ nr: 'L', x: 30, y: 60 }, { nr: '1', x: 10, y: 0 },
                { nr: '2', x: 50, y: 0 }],
            erklaerung: 'Eine Leuchte von zwei Stellen aus schalten — immer zu zweit verbaut.'
        },
        {
            id: 'kreuzschalter', name: 'Kreuzschalter', gruppe: 'schalter', kennbuchstabe: 'S',
            w: 60, h: 60,
            pfad: [senkrecht(10, 0, 18), senkrecht(50, 0, 18),
                senkrecht(10, 42, 60), senkrecht(50, 42, 60),
                'M10,42 L50,18', 'M50,42 L10,18'],
            anschluesse: [{ nr: '1', x: 10, y: 0 }, { nr: '2', x: 50, y: 0 },
                { nr: '3', x: 10, y: 60 }, { nr: '4', x: 50, y: 60 }],
            erklaerung: 'Kommt zwischen zwei Wechselschalter, damit von drei und mehr Stellen geschaltet wird.'
        },
        {
            id: 'serienschalter', name: 'Serienschalter', gruppe: 'schalter', kennbuchstabe: 'S',
            w: 60, h: 60,
            pfad: [senkrecht(30, 44, 60), senkrecht(10, 0, 16), senkrecht(50, 0, 16),
                'M30,44 L14,16', 'M30,44 L46,16',
                waagrecht(16, 4, 18), waagrecht(16, 44, 58)],
            anschluesse: [{ nr: 'L', x: 30, y: 60 }, { nr: '1', x: 10, y: 0 },
                { nr: '2', x: 50, y: 0 }],
            erklaerung: 'Zwei Leuchten getrennt schalten, zum Beispiel Bad und Spiegel.'
        },
        {
            id: 'hauptschalter', name: 'Hauptschalter', gruppe: 'schalter', kennbuchstabe: 'Q',
            w: 60, h: 60,
            pfad: [senkrecht(10, 0, 16), senkrecht(30, 0, 16), senkrecht(50, 0, 16),
                senkrecht(10, 44, 60), senkrecht(30, 44, 60), senkrecht(50, 44, 60),
                'M10,44 L20,14', 'M30,44 L40,14', 'M50,44 L60,14',
                'M18,20 L54,32'],
            anschluesse: [{ nr: '1', x: 10, y: 0 }, { nr: '3', x: 30, y: 0 }, { nr: '5', x: 50, y: 0 },
                { nr: '2', x: 10, y: 60 }, { nr: '4', x: 30, y: 60 }, { nr: '6', x: 50, y: 60 }],
            erklaerung: 'Trennt alle Aussenleiter gemeinsam vom Netz.'
        },
        {
            id: 'notaus', name: 'Not-Halt', gruppe: 'schalter', kennbuchstabe: 'S',
            w: 40, h: 60,
            pfad: [senkrecht(20, 0, 16), senkrecht(20, 44, 60),
                'M20,44 L32,14', waagrecht(16, 26, 38), senkrecht(32, 8, 14)],
            kreise: [{ cx: 32, cy: 6, r: 5 }],
            anschluesse: [{ nr: '1', x: 20, y: 0 }, { nr: '2', x: 20, y: 60 }],
            erklaerung: 'Öffner mit Rastung: bleibt gedrückt, bis er entriegelt wird.'
        },
        {
            id: 'endschalter', name: 'Positionsschalter', gruppe: 'schalter', kennbuchstabe: 'S',
            w: 40, h: 60,
            pfad: [senkrecht(20, 0, 16), waagrecht(16, 12, 28), senkrecht(20, 44, 60),
                'M20,44 L32,14', senkrecht(32, 4, 14), waagrecht(4, 27, 37)],
            anschluesse: [{ nr: '3', x: 20, y: 0 }, { nr: '4', x: 20, y: 60 }],
            erklaerung: 'Wird von einem Maschinenteil betätigt, das eine Endlage erreicht.'
        },
        /* ---- Relais und Schütze ---------------------------------------------- */
        {
            id: 'spule', name: 'Relaisspule', gruppe: 'relais', kennbuchstabe: 'K',
            w: 40, h: 60,
            pfad: [senkrecht(20, 0, 18), senkrecht(20, 42, 60),
                'M6,18 H34 V42 H6 Z'],
            anschluesse: [{ nr: 'A1', x: 20, y: 0 }, { nr: 'A2', x: 20, y: 60 }],
            erklaerung: 'Wird sie bestromt, ziehen alle Kontakte desselben Kennzeichens an.'
        },
        {
            id: 'spule-anzugsverzoegert', name: 'Zeitrelais, anzugsverzögert', gruppe: 'relais', kennbuchstabe: 'K',
            w: 40, h: 60,
            pfad: [senkrecht(20, 0, 18), senkrecht(20, 42, 60),
                'M6,18 H34 V42 H6 Z', 'M12,24 L12,36 L22,36'],
            anschluesse: [{ nr: 'A1', x: 20, y: 0 }, { nr: 'A2', x: 20, y: 60 }],
            erklaerung: 'Zieht erst nach der eingestellten Zeit an. Fällt sofort ab.'
        },
        {
            id: 'spule-abfallverzoegert', name: 'Zeitrelais, abfallverzögert', gruppe: 'relais', kennbuchstabe: 'K',
            w: 40, h: 60,
            pfad: [senkrecht(20, 0, 18), senkrecht(20, 42, 60),
                'M6,18 H34 V42 H6 Z', 'M28,24 L28,36 L18,36'],
            anschluesse: [{ nr: 'A1', x: 20, y: 0 }, { nr: 'A2', x: 20, y: 60 }],
            erklaerung: 'Zieht sofort an. Fällt erst nach der eingestellten Zeit ab.'
        },
        {
            id: 'schuetz-hauptkontakt', name: 'Schütz-Hauptkontakt', gruppe: 'relais', kennbuchstabe: 'K',
            w: 40, h: 60,
            pfad: [senkrecht(20, 0, 16), waagrecht(16, 12, 28), senkrecht(20, 44, 60),
                'M20,44 L32,14', 'M26,26 L34,22'],
            anschluesse: [{ nr: '1', x: 20, y: 0 }, { nr: '2', x: 20, y: 60 }],
            erklaerung: 'Trägt den Motorstrom. Der Bogen zeigt die Löschkammer.'
        },
        {
            id: 'schuetz-schliesser', name: 'Schütz-Schliesser (Hilfskontakt)', gruppe: 'relais', kennbuchstabe: 'K',
            w: 40, h: 60,
            pfad: [senkrecht(20, 0, 16), waagrecht(16, 12, 28), senkrecht(20, 44, 60),
                'M20,44 L32,14'],
            anschluesse: [{ nr: '13', x: 20, y: 0 }, { nr: '14', x: 20, y: 60 }],
            erklaerung: 'Schliesst, wenn das Schütz anzieht — der Kontakt der Selbsthaltung.'
        },
        {
            id: 'schuetz-oeffner', name: 'Schütz-Öffner (Hilfskontakt)', gruppe: 'relais', kennbuchstabe: 'K',
            w: 40, h: 60,
            pfad: [senkrecht(20, 0, 16), senkrecht(20, 44, 60),
                'M20,44 L32,14', waagrecht(16, 26, 38)],
            anschluesse: [{ nr: '21', x: 20, y: 0 }, { nr: '22', x: 20, y: 60 }],
            erklaerung: 'Öffnet, wenn das Schütz anzieht — für die gegenseitige Verriegelung.'
        },
        /* ---- Schutzgeräte ---------------------------------------------------- */
        {
            id: 'sicherung', name: 'Sicherung', gruppe: 'schutz', kennbuchstabe: 'F',
            w: 40, h: 60,
            pfad: [senkrecht(20, 0, 18), senkrecht(20, 42, 60),
                'M12,18 H28 V42 H12 Z', senkrecht(20, 18, 42)],
            anschluesse: [{ nr: '1', x: 20, y: 0 }, { nr: '2', x: 20, y: 60 }],
            erklaerung: 'Schmilzt bei zu hohem Strom und trennt den Kreis dauerhaft.'
        },
        {
            id: 'leitungsschutzschalter', name: 'Leitungsschutzschalter', gruppe: 'schutz', kennbuchstabe: 'F',
            w: 40, h: 60,
            pfad: [senkrecht(20, 0, 16), waagrecht(16, 12, 28), senkrecht(20, 44, 60),
                'M20,44 L32,14', 'M27,22 a5,5 0 1,1 7,3'],
            anschluesse: [{ nr: '1', x: 20, y: 0 }, { nr: '2', x: 20, y: 60 }],
            erklaerung: 'Schaltet bei Überlast und Kurzschluss ab. Lässt sich wieder einschalten.'
        },
        {
            id: 'fi-schutzschalter', name: 'Fehlerstrom-Schutzschalter', gruppe: 'schutz', kennbuchstabe: 'F',
            w: 60, h: 70,
            pfad: ['M4,10 H56 V60 H4 Z',
                senkrecht(10, 0, 10), senkrecht(30, 0, 10), senkrecht(50, 0, 10),
                senkrecht(10, 60, 70), senkrecht(30, 60, 70), senkrecht(50, 60, 70),
                'M12,44 a18,18 0 0,1 36,0'],
            beschriftung: [{ x: 30, y: 30, t: 'I∆n' }],
            anschluesse: [{ nr: '1', x: 10, y: 0 }, { nr: '3', x: 30, y: 0 }, { nr: 'N', x: 50, y: 0 },
                { nr: '2', x: 10, y: 70 }, { nr: '4', x: 30, y: 70 }, { nr: 'N', x: 50, y: 70 }],
            erklaerung: 'Vergleicht hin- und rückfliessenden Strom und schaltet bei Differenz ab.'
        },
        {
            id: 'motorschutzschalter', name: 'Motorschutzschalter', gruppe: 'schutz', kennbuchstabe: 'Q',
            w: 60, h: 60,
            pfad: [senkrecht(10, 0, 16), senkrecht(30, 0, 16), senkrecht(50, 0, 16),
                senkrecht(10, 44, 60), senkrecht(30, 44, 60), senkrecht(50, 44, 60),
                'M10,44 L20,14', 'M30,44 L40,14', 'M50,44 L60,14',
                'M18,20 L54,32', 'M6,50 H14 M6,46 V54'],
            anschluesse: [{ nr: '1', x: 10, y: 0 }, { nr: '3', x: 30, y: 0 }, { nr: '5', x: 50, y: 0 },
                { nr: '2', x: 10, y: 60 }, { nr: '4', x: 30, y: 60 }, { nr: '6', x: 50, y: 60 }],
            erklaerung: 'Schützt den Motor gegen Überlast und Kurzschluss, dreipolig.'
        },
        {
            id: 'thermorelais', name: 'Thermisches Überlastrelais', gruppe: 'schutz', kennbuchstabe: 'F',
            w: 60, h: 60,
            pfad: ['M6,14 H54 V46 H6 Z',
                senkrecht(10, 0, 14), senkrecht(30, 0, 14), senkrecht(50, 0, 14),
                senkrecht(10, 46, 60), senkrecht(30, 46, 60), senkrecht(50, 46, 60),
                'M14,36 h10 v-12 h12 v12 h10'],
            anschluesse: [{ nr: '1', x: 10, y: 0 }, { nr: '3', x: 30, y: 0 }, { nr: '5', x: 50, y: 0 },
                { nr: '2', x: 10, y: 60 }, { nr: '4', x: 30, y: 60 }, { nr: '6', x: 50, y: 60 }],
            erklaerung: 'Ein Bimetall biegt sich bei Überlast und löst über den Hilfskontakt 95/96 aus.'
        },
        {
            id: 'ueberspannungsableiter', name: 'Überspannungsableiter', gruppe: 'schutz', kennbuchstabe: 'F',
            w: 40, h: 60,
            pfad: [senkrecht(20, 0, 16), senkrecht(20, 44, 60),
                'M10,16 H30 V44 H10 Z', 'M14,24 L26,30 L14,36'],
            anschluesse: [{ nr: '1', x: 20, y: 0 }, { nr: 'PE', x: 20, y: 60 }],
            erklaerung: 'Leitet Überspannungen aus Blitz oder Schalthandlungen zur Erde ab.'
        },
        /* ---- Motoren --------------------------------------------------------- */
        {
            id: 'motor-drehstrom', name: 'Drehstrommotor', gruppe: 'motoren', kennbuchstabe: 'M',
            w: 60, h: 70,
            kreise: [{ cx: 30, cy: 35, r: 25 }],
            pfad: [senkrecht(10, 0, 16), senkrecht(30, 0, 10), senkrecht(50, 0, 16)],
            beschriftung: [{ x: 30, y: 32, t: 'M', gross: true }, { x: 30, y: 48, t: '3 ~' }],
            anschluesse: [{ nr: 'U1', x: 10, y: 0 }, { nr: 'V1', x: 30, y: 0 }, { nr: 'W1', x: 50, y: 0 }],
            erklaerung: 'Der übliche Antrieb im Betrieb: drei Wicklungen, Drehfeld, kein Anlaufhelfer nötig.'
        },
        {
            id: 'motor-wechselstrom', name: 'Wechselstrommotor', gruppe: 'motoren', kennbuchstabe: 'M',
            w: 60, h: 70,
            kreise: [{ cx: 30, cy: 35, r: 25 }],
            pfad: [senkrecht(20, 0, 12), senkrecht(40, 0, 12)],
            beschriftung: [{ x: 30, y: 32, t: 'M', gross: true }, { x: 30, y: 48, t: '1 ~' }],
            anschluesse: [{ nr: 'U1', x: 20, y: 0 }, { nr: 'U2', x: 40, y: 0 }],
            erklaerung: 'Einphasig, meist mit Kondensator als Hilfswicklung.'
        },
        {
            id: 'motor-gleichstrom', name: 'Gleichstrommotor', gruppe: 'motoren', kennbuchstabe: 'M',
            w: 60, h: 70,
            kreise: [{ cx: 30, cy: 35, r: 25 }],
            pfad: [senkrecht(20, 0, 12), senkrecht(40, 0, 12)],
            beschriftung: [{ x: 30, y: 32, t: 'M', gross: true }, { x: 30, y: 48, t: '=' }],
            anschluesse: [{ nr: 'A1', x: 20, y: 0 }, { nr: 'A2', x: 40, y: 0 }],
            erklaerung: 'Drehzahl über die Spannung, Drehrichtung über die Polung.'
        },
        {
            id: 'generator', name: 'Generator', gruppe: 'motoren', kennbuchstabe: 'G',
            w: 60, h: 70,
            kreise: [{ cx: 30, cy: 35, r: 25 }],
            pfad: [senkrecht(20, 0, 12), senkrecht(40, 0, 12)],
            beschriftung: [{ x: 30, y: 40, t: 'G', gross: true }],
            anschluesse: [{ nr: '1', x: 20, y: 0 }, { nr: '2', x: 40, y: 0 }],
            erklaerung: 'Wandelt mechanische Energie in elektrische — der Motor rückwärts.'
        },
        /* ---- Messgeräte ------------------------------------------------------ */
        {
            id: 'voltmeter', name: 'Voltmeter', gruppe: 'messen', kennbuchstabe: 'P',
            w: 60, h: 60,
            kreise: [{ cx: 30, cy: 30, r: 22 }],
            pfad: [waagrecht(30, 0, 8), waagrecht(30, 52, 60)],
            beschriftung: [{ x: 30, y: 36, t: 'V', gross: true }],
            anschluesse: [{ nr: '+', x: 0, y: 30 }, { nr: '−', x: 60, y: 30 }],
            erklaerung: 'Misst die Spannung. Wird PARALLEL zum Bauteil geschaltet.'
        },
        {
            id: 'amperemeter', name: 'Amperemeter', gruppe: 'messen', kennbuchstabe: 'P',
            w: 60, h: 60,
            kreise: [{ cx: 30, cy: 30, r: 22 }],
            pfad: [waagrecht(30, 0, 8), waagrecht(30, 52, 60)],
            beschriftung: [{ x: 30, y: 36, t: 'A', gross: true }],
            anschluesse: [{ nr: '+', x: 0, y: 30 }, { nr: '−', x: 60, y: 30 }],
            erklaerung: 'Misst den Strom. Wird IN REIHE in den Kreis geschaltet.'
        },
        {
            id: 'ohmmeter', name: 'Ohmmeter', gruppe: 'messen', kennbuchstabe: 'P',
            w: 60, h: 60,
            kreise: [{ cx: 30, cy: 30, r: 22 }],
            pfad: [waagrecht(30, 0, 8), waagrecht(30, 52, 60)],
            beschriftung: [{ x: 30, y: 36, t: 'Ω', gross: true }],
            anschluesse: [{ nr: '1', x: 0, y: 30 }, { nr: '2', x: 60, y: 30 }],
            erklaerung: 'Misst den Widerstand — nur am spannungsfreien Bauteil.'
        },
        {
            id: 'wattmeter', name: 'Wattmeter', gruppe: 'messen', kennbuchstabe: 'P',
            w: 60, h: 60,
            kreise: [{ cx: 30, cy: 30, r: 22 }],
            pfad: [waagrecht(30, 0, 8), waagrecht(30, 52, 60)],
            beschriftung: [{ x: 30, y: 36, t: 'W', gross: true }],
            anschluesse: [{ nr: '1', x: 0, y: 30 }, { nr: '2', x: 60, y: 30 }],
            erklaerung: 'Misst die Wirkleistung — braucht Strom- und Spannungspfad.'
        },
        {
            id: 'zaehler', name: 'Energiezähler', gruppe: 'messen', kennbuchstabe: 'P',
            w: 60, h: 60,
            pfad: ['M6,12 H54 V48 H6 Z', waagrecht(30, 0, 6), waagrecht(30, 54, 60)],
            beschriftung: [{ x: 30, y: 36, t: 'kWh', gross: true }],
            anschluesse: [{ nr: '1', x: 0, y: 30 }, { nr: '2', x: 60, y: 30 }],
            erklaerung: 'Zählt die verbrauchte Energie über die Zeit.'
        },
        {
            id: 'frequenzmesser', name: 'Frequenzmesser', gruppe: 'messen', kennbuchstabe: 'P',
            w: 60, h: 60,
            kreise: [{ cx: 30, cy: 30, r: 22 }],
            pfad: [waagrecht(30, 0, 8), waagrecht(30, 52, 60)],
            beschriftung: [{ x: 30, y: 36, t: 'Hz', gross: true }],
            anschluesse: [{ nr: '1', x: 0, y: 30 }, { nr: '2', x: 60, y: 30 }],
            erklaerung: 'Misst, wie oft die Wechselspannung je Sekunde die Richtung wechselt.'
        },
        /* ---- Sensoren -------------------------------------------------------- */
        {
            id: 'naeherungsschalter', name: 'Näherungsschalter', gruppe: 'sensoren', kennbuchstabe: 'B',
            w: 60, h: 60,
            pfad: [senkrecht(30, 0, 12), senkrecht(30, 48, 60),
                'M30,12 L52,30 L30,48 L8,30 Z'],
            anschluesse: [{ nr: '1', x: 30, y: 0 }, { nr: '4', x: 30, y: 60 }],
            erklaerung: 'Schaltet berührungslos, wenn ein Gegenstand nahe genug kommt.'
        },
        {
            id: 'temperaturfuehler', name: 'Temperaturfühler', gruppe: 'sensoren', kennbuchstabe: 'B',
            w: 60, h: 60,
            pfad: [senkrecht(30, 0, 14), senkrecht(30, 46, 60),
                'M14,14 H46 V46 H14 Z', 'M20,40 L40,20', waagrecht(20, 34, 40)],
            beschriftung: [{ x: 30, y: 42, t: 'θ' }],
            anschluesse: [{ nr: '1', x: 30, y: 0 }, { nr: '2', x: 30, y: 60 }],
            erklaerung: 'Sein Widerstand ändert sich mit der Temperatur.'
        },
        {
            id: 'drucksensor', name: 'Druckschalter', gruppe: 'sensoren', kennbuchstabe: 'B',
            w: 40, h: 60,
            pfad: [senkrecht(20, 0, 16), waagrecht(16, 12, 28), senkrecht(20, 44, 60),
                'M20,44 L32,14', senkrecht(32, 6, 14), 'M26,6 a6,6 0 0,1 12,0'],
            anschluesse: [{ nr: '1', x: 20, y: 0 }, { nr: '2', x: 20, y: 60 }],
            erklaerung: 'Schaltet, wenn der eingestellte Druck erreicht ist.'
        },
        {
            id: 'lichtschranke', name: 'Lichtschranke', gruppe: 'sensoren', kennbuchstabe: 'B',
            w: 60, h: 60,
            pfad: ['M4,20 H20 V40 H4 Z', 'M40,20 H56 V40 H40 Z',
                'M22,30 H38', 'M30,26 L38,30 L30,34',
                senkrecht(10, 40, 60), senkrecht(50, 40, 60)],
            anschluesse: [{ nr: '1', x: 10, y: 60 }, { nr: '4', x: 50, y: 60 }],
            erklaerung: 'Sender und Empfänger. Wird der Strahl unterbrochen, schaltet sie.'
        },
        {
            id: 'bewegungsmelder', name: 'Bewegungsmelder', gruppe: 'sensoren', kennbuchstabe: 'B',
            w: 60, h: 60,
            pfad: ['M14,14 H46 V44 H14 Z', senkrecht(30, 0, 14), senkrecht(30, 44, 60),
                'M20,34 a10,10 0 0,1 20,0'],
            beschriftung: [{ x: 30, y: 42, t: 'IR' }],
            anschluesse: [{ nr: 'L', x: 30, y: 0 }, { nr: 'L′', x: 30, y: 60 }],
            erklaerung: 'Erkennt Wärmebewegung und schaltet für eine eingestellte Zeit ein.'
        },
        /* ---- Quellen und Erde ------------------------------------------------ */
        {
            id: 'batterie', name: 'Batterie', gruppe: 'quellen', kennbuchstabe: 'G',
            w: 40, h: 60,
            pfad: [senkrecht(20, 0, 22), senkrecht(20, 38, 60),
                waagrecht(22, 6, 34), waagrecht(28, 13, 27),
                waagrecht(32, 6, 34), waagrecht(38, 13, 27)],
            anschluesse: [{ nr: '+', x: 20, y: 0 }, { nr: '−', x: 20, y: 60 }],
            erklaerung: 'Gleichspannungsquelle. Der lange Strich ist der Pluspol.'
        },
        {
            id: 'gleichspannung', name: 'Gleichspannungsquelle', gruppe: 'quellen', kennbuchstabe: 'G',
            w: 60, h: 60,
            kreise: [{ cx: 30, cy: 30, r: 22 }],
            pfad: [senkrecht(30, 0, 8), senkrecht(30, 52, 60),
                waagrecht(26, 18, 42), 'M20,34 h5 M28,34 h5 M36,34 h5'],
            anschluesse: [{ nr: '+', x: 30, y: 0 }, { nr: '−', x: 30, y: 60 }],
            erklaerung: 'Liefert eine gleichbleibende Spannung.'
        },
        {
            id: 'wechselspannung', name: 'Wechselspannungsquelle', gruppe: 'quellen', kennbuchstabe: 'G',
            w: 60, h: 60,
            kreise: [{ cx: 30, cy: 30, r: 22 }],
            pfad: [senkrecht(30, 0, 8), senkrecht(30, 52, 60),
                'M16,30 a7,7 0 0,1 14,0 a7,7 0 0,0 14,0'],
            anschluesse: [{ nr: 'L', x: 30, y: 0 }, { nr: 'N', x: 30, y: 60 }],
            erklaerung: 'Liefert eine Spannung, die ihre Richtung regelmässig wechselt.'
        },
        {
            id: 'erde', name: 'Erde', gruppe: 'quellen', kennbuchstabe: 'E',
            w: 40, h: 40,
            pfad: [senkrecht(20, 0, 18), waagrecht(18, 4, 36), waagrecht(26, 10, 30),
                waagrecht(34, 16, 24)],
            anschluesse: [{ nr: 'E', x: 20, y: 0 }],
            erklaerung: 'Verbindung zum Erdreich.'
        },
        {
            id: 'schutzleiter', name: 'Schutzleiter PE', gruppe: 'quellen', kennbuchstabe: 'PE',
            w: 40, h: 40,
            pfad: [senkrecht(20, 0, 16), waagrecht(16, 6, 34), 'M12,16 L20,26 L28,16'],
            anschluesse: [{ nr: 'PE', x: 20, y: 0 }],
            erklaerung: 'Führt Fehlerströme ab und hält berührbare Teile spannungsfrei.'
        },
        {
            id: 'masse', name: 'Masse', gruppe: 'quellen', kennbuchstabe: 'M',
            w: 40, h: 40,
            pfad: [senkrecht(20, 0, 20), waagrecht(20, 6, 34), senkrecht(10, 20, 28),
                senkrecht(20, 20, 30), senkrecht(30, 20, 28)],
            anschluesse: [{ nr: 'M', x: 20, y: 0 }],
            erklaerung: 'Gemeinsamer Bezugspunkt einer Schaltung, nicht zwingend geerdet.'
        },
        /* ---- Passive Bauteile ------------------------------------------------ */
        {
            id: 'widerstand', name: 'Widerstand', gruppe: 'passiv', kennbuchstabe: 'R',
            w: 40, h: 60,
            pfad: [senkrecht(20, 0, 15), senkrecht(20, 45, 60), 'M8,15 H32 V45 H8 Z'],
            anschluesse: [{ nr: '1', x: 20, y: 0 }, { nr: '2', x: 20, y: 60 }],
            erklaerung: 'Begrenzt den Strom. R = U geteilt durch I.'
        },
        {
            id: 'potentiometer', name: 'Potentiometer', gruppe: 'passiv', kennbuchstabe: 'R',
            w: 60, h: 60,
            pfad: [senkrecht(20, 0, 15), senkrecht(20, 45, 60), 'M8,15 H32 V45 H8 Z',
                waagrecht(30, 44, 60), 'M32,30 L40,26 M32,30 L40,34', 'M34,30 H44'],
            anschluesse: [{ nr: '1', x: 20, y: 0 }, { nr: '2', x: 20, y: 60 }, { nr: 'S', x: 60, y: 30 }],
            erklaerung: 'Einstellbarer Spannungsteiler mit drei Anschlüssen.'
        },
        {
            id: 'kondensator', name: 'Kondensator', gruppe: 'passiv', kennbuchstabe: 'C',
            w: 40, h: 60,
            pfad: [senkrecht(20, 0, 26), senkrecht(20, 34, 60),
                waagrecht(26, 6, 34), waagrecht(34, 6, 34)],
            anschluesse: [{ nr: '1', x: 20, y: 0 }, { nr: '2', x: 20, y: 60 }],
            erklaerung: 'Speichert Ladung. Lässt Wechselstrom durch, Gleichstrom nicht.'
        },
        {
            id: 'elko', name: 'Elektrolytkondensator', gruppe: 'passiv', kennbuchstabe: 'C',
            w: 40, h: 60,
            pfad: [senkrecht(20, 0, 26), senkrecht(20, 36, 60),
                waagrecht(26, 6, 34), 'M6,36 a14,6 0 0,0 28,0',
                'M10,18 h6 M13,15 v6'],
            anschluesse: [{ nr: '+', x: 20, y: 0 }, { nr: '−', x: 20, y: 60 }],
            erklaerung: 'Gepolter Kondensator — falsch herum eingebaut wird er zerstört.'
        },
        {
            id: 'spule-induktivitaet', name: 'Spule', gruppe: 'passiv', kennbuchstabe: 'L',
            w: 40, h: 60,
            pfad: [senkrecht(20, 0, 14), senkrecht(20, 46, 60),
                'M20,14 a8,8 0 0,1 0,16 a8,8 0 0,1 0,16'],
            anschluesse: [{ nr: '1', x: 20, y: 0 }, { nr: '2', x: 20, y: 60 }],
            erklaerung: 'Speichert Energie im Magnetfeld. Bremst Stromänderungen.'
        },
        {
            id: 'transformator', name: 'Transformator', gruppe: 'passiv', kennbuchstabe: 'T',
            w: 70, h: 70,
            pfad: [senkrecht(20, 0, 15), senkrecht(20, 55, 70),
                senkrecht(50, 0, 15), senkrecht(50, 55, 70),
                'M20,15 a8,8 0 0,0 0,13 a8,8 0 0,0 0,13 a8,8 0 0,0 0,14',
                'M50,15 a8,8 0 0,1 0,13 a8,8 0 0,1 0,13 a8,8 0 0,1 0,14',
                senkrecht(32, 12, 58), senkrecht(38, 12, 58)],
            anschluesse: [{ nr: '1U', x: 20, y: 0 }, { nr: '1V', x: 20, y: 70 },
                { nr: '2U', x: 50, y: 0 }, { nr: '2V', x: 50, y: 70 }],
            erklaerung: 'Wandelt Wechselspannung hoch oder herunter — über das Windungsverhältnis.'
        },
        /* ---- Halbleiter ------------------------------------------------------ */
        {
            id: 'diode', name: 'Diode', gruppe: 'halbleiter', kennbuchstabe: 'V',
            w: 40, h: 60,
            pfad: [senkrecht(20, 0, 20), senkrecht(20, 40, 60),
                'M8,20 H32 L20,40 Z', waagrecht(40, 8, 32)],
            anschluesse: [{ nr: 'A', x: 20, y: 0 }, { nr: 'K', x: 20, y: 60 }],
            erklaerung: 'Lässt den Strom nur in eine Richtung durch — in Pfeilrichtung.'
        },
        {
            id: 'led', name: 'Leuchtdiode', gruppe: 'halbleiter', kennbuchstabe: 'V',
            w: 50, h: 60,
            pfad: [senkrecht(20, 0, 20), senkrecht(20, 40, 60),
                'M8,20 H32 L20,40 Z', waagrecht(40, 8, 32),
                'M34,22 L44,14 M40,14 H44 V18', 'M34,30 L44,22 M40,22 H44 V26'],
            anschluesse: [{ nr: 'A', x: 20, y: 0 }, { nr: 'K', x: 20, y: 60 }],
            erklaerung: 'Diode, die beim Durchlass leuchtet. Braucht einen Vorwiderstand.'
        },
        {
            id: 'zenerdiode', name: 'Z-Diode', gruppe: 'halbleiter', kennbuchstabe: 'V',
            w: 40, h: 60,
            pfad: [senkrecht(20, 0, 20), senkrecht(20, 40, 60),
                'M8,20 H32 L20,40 Z', 'M8,44 L8,40 H32 V36'],
            anschluesse: [{ nr: 'A', x: 20, y: 0 }, { nr: 'K', x: 20, y: 60 }],
            erklaerung: 'Leitet rückwärts ab einer bestimmten Spannung — hält sie damit konstant.'
        },
        {
            id: 'ptc', name: 'PTC / Kaltleiter', gruppe: 'halbleiter', kennbuchstabe: 'R',
            w: 40, h: 60,
            pfad: [senkrecht(20, 0, 15), senkrecht(20, 45, 60), 'M8,15 H32 V45 H8 Z',
                /* Der schräge Strich mit dem ϑ und den beiden Pfeilen nach oben:
                   Temperatur hinauf, Widerstand hinauf. */
                'M4,48 L36,12', 'M28,12 H36 V20'],
            anschluesse: [{ nr: '1', x: 20, y: 0 }, { nr: '2', x: 20, y: 60 }],
            erklaerung: 'Wird er warm, wird er hochohmig. Begrenzt Einschaltströme und schützt Motoren.'
        },
        {
            id: 'ntc', name: 'NTC / Heissleiter', gruppe: 'halbleiter', kennbuchstabe: 'R',
            w: 40, h: 60,
            pfad: [senkrecht(20, 0, 15), senkrecht(20, 45, 60), 'M8,15 H32 V45 H8 Z',
                /* Derselbe Strich, aber der Haken sitzt am UNTEREN Ende und
                   zeigt nach unten: Temperatur hinauf, Widerstand hinunter.
                   Beim PTC sitzt er oben. Das ist der ganze Unterschied im
                   Zeichen — und im Bauteil auch. */
                'M4,48 L36,12', 'M4,40 V48 H12'],
            anschluesse: [{ nr: '1', x: 20, y: 0 }, { nr: '2', x: 20, y: 60 }],
            erklaerung: 'Wird er warm, wird er niederohmig. Als Temperaturfühler und zur Strombegrenzung.'
        },
        {
            id: 'vdr', name: 'VDR / Varistor', gruppe: 'halbleiter', kennbuchstabe: 'R',
            w: 40, h: 60,
            pfad: [senkrecht(20, 0, 15), senkrecht(20, 45, 60), 'M8,15 H32 V45 H8 Z',
                'M4,48 L36,12', 'M28,12 H36 V20'],
            anschluesse: [{ nr: '1', x: 20, y: 0 }, { nr: '2', x: 20, y: 60 }],
            erklaerung: 'Sein Widerstand hängt von der SPANNUNG ab. Über der Schwelle leitet er und schluckt Überspannungen.'
        },
        {
            id: 'ldr', name: 'LDR / Fotowiderstand', gruppe: 'halbleiter', kennbuchstabe: 'R',
            w: 50, h: 60,
            pfad: [senkrecht(20, 0, 15), senkrecht(20, 45, 60), 'M8,15 H32 V45 H8 Z',
                /* Zwei Pfeile, die auf das Bauteil ZEIGEN — Licht fällt ein.
                   Bei der Leuchtdiode zeigen sie hinaus. */
                'M48,18 L36,26', 'M36,26 L42,26 M36,26 L36,20',
                'M48,30 L36,38', 'M36,38 L42,38 M36,38 L36,32'],
            anschluesse: [{ nr: '1', x: 20, y: 0 }, { nr: '2', x: 20, y: 60 }],
            erklaerung: 'Im Hellen niederohmig, im Dunkeln hochohmig. In Dämmerungsschaltern.'
        },
        {
            id: 'optokoppler', name: 'Optokoppler', gruppe: 'halbleiter', kennbuchstabe: 'V',
            w: 80, h: 70,
            pfad: ['M4,4 H76 V66 H4 Z',
                /* Links die Leuchtdiode, rechts der Fototransistor, dazwischen
                   zwei Lichtpfeile — und keine elektrische Verbindung. */
                senkrecht(20, 0, 14), senkrecht(20, 56, 70),
                'M12,26 H28 L20,42 Z', 'M12,42 H28',
                'M40,30 L48,30 M40,40 L48,40',
                senkrecht(60, 0, 20), senkrecht(60, 50, 70),
                'M56,22 V48', 'M56,30 L68,20', 'M56,40 L68,50'],
            anschluesse: [{ nr: 'A', x: 20, y: 0 }, { nr: 'K', x: 20, y: 70 },
                { nr: 'C', x: 60, y: 0 }, { nr: 'E', x: 60, y: 70 }],
            erklaerung: 'Steuert über Licht statt über Draht. Beide Seiten bleiben galvanisch getrennt — der Grund, warum es ihn gibt.'
        },
        {
            id: 'triac', name: 'Triac', gruppe: 'halbleiter', kennbuchstabe: 'V',
            w: 60, h: 60,
            pfad: [senkrecht(20, 0, 18), senkrecht(20, 42, 60),
                /* Zwei gegeneinander geschaltete Thyristoren in einem Gehäuse:
                   zwei Dreiecke, die in verschiedene Richtungen zeigen. */
                'M8,18 H32 L20,34 Z', 'M8,42 H32 L20,26 Z',
                waagrecht(18, 8, 32), waagrecht(42, 8, 32),
                'M32,42 H60 V30'],
            anschluesse: [{ nr: 'A1', x: 20, y: 60 }, { nr: 'A2', x: 20, y: 0 },
                { nr: 'G', x: 60, y: 30 }],
            erklaerung: 'Ein Schalter für BEIDE Halbwellen. In Dimmern und Motorstellern.'
        },
        {
            id: 'transistor-npn', name: 'Transistor NPN', gruppe: 'halbleiter', kennbuchstabe: 'V',
            w: 60, h: 60,
            kreise: [{ cx: 30, cy: 30, r: 22 }],
            pfad: [waagrecht(30, 0, 20), senkrecht(20, 16, 44),
                'M20,22 L40,10', senkrecht(40, 0, 10),
                'M20,38 L40,50', senkrecht(40, 50, 60),
                'M34,44 L42,50 L40,42'],
            anschluesse: [{ nr: 'B', x: 0, y: 30 }, { nr: 'C', x: 40, y: 0 }, { nr: 'E', x: 40, y: 60 }],
            erklaerung: 'Ein kleiner Basisstrom steuert einen grossen Kollektorstrom.'
        },
        {
            id: 'transistor-pnp', name: 'Transistor PNP', gruppe: 'halbleiter', kennbuchstabe: 'V',
            w: 60, h: 60,
            kreise: [{ cx: 30, cy: 30, r: 22 }],
            pfad: [waagrecht(30, 0, 20), senkrecht(20, 16, 44),
                'M20,22 L40,10', senkrecht(40, 0, 10),
                'M20,38 L40,50', senkrecht(40, 50, 60),
                'M22,32 L20,40 L28,38'],
            anschluesse: [{ nr: 'B', x: 0, y: 30 }, { nr: 'C', x: 40, y: 0 }, { nr: 'E', x: 40, y: 60 }],
            erklaerung: 'Wie NPN, nur mit umgekehrter Stromrichtung.'
        },
        {
            id: 'thyristor', name: 'Thyristor', gruppe: 'halbleiter', kennbuchstabe: 'V',
            w: 60, h: 60,
            pfad: [senkrecht(20, 0, 20), senkrecht(20, 40, 60),
                'M8,20 H32 L20,40 Z', waagrecht(40, 8, 32),
                'M20,40 L44,30', waagrecht(30, 44, 60)],
            anschluesse: [{ nr: 'A', x: 20, y: 0 }, { nr: 'K', x: 20, y: 60 }, { nr: 'G', x: 60, y: 30 }],
            erklaerung: 'Diode mit Zündeingang: leitet erst nach einem Impuls am Gate.'
        },
        /* ---- Lampen und Melder ----------------------------------------------- */
        {
            id: 'lampe', name: 'Lampe', gruppe: 'melder', kennbuchstabe: 'E',
            w: 60, h: 60,
            kreise: [{ cx: 30, cy: 30, r: 20 }],
            pfad: [senkrecht(30, 0, 10), senkrecht(30, 50, 60),
                'M16,16 L44,44', 'M44,16 L16,44'],
            anschluesse: [{ nr: 'X1', x: 30, y: 0 }, { nr: 'X2', x: 30, y: 60 }],
            erklaerung: 'Beleuchtung. Im Plan das Kreuz im Kreis.'
        },
        {
            id: 'signalleuchte', name: 'Meldeleuchte', gruppe: 'melder', kennbuchstabe: 'P',
            w: 60, h: 60,
            kreise: [{ cx: 30, cy: 30, r: 20 }],
            pfad: [senkrecht(30, 0, 10), senkrecht(30, 50, 60),
                'M46,14 L54,6 M14,14 L6,6 M46,46 L54,54 M14,46 L6,54'],
            anschluesse: [{ nr: 'X1', x: 30, y: 0 }, { nr: 'X2', x: 30, y: 60 }],
            erklaerung: 'Zeigt einen Betriebszustand an — Motor läuft, Störung, bereit.'
        },
        {
            id: 'hupe', name: 'Hupe', gruppe: 'melder', kennbuchstabe: 'P',
            w: 60, h: 60,
            pfad: [senkrecht(30, 0, 14), senkrecht(30, 46, 60),
                'M12,46 a18,18 0 0,1 36,0 Z'],
            anschluesse: [{ nr: 'X1', x: 30, y: 0 }, { nr: 'X2', x: 30, y: 60 }],
            erklaerung: 'Akustische Meldung, meist für Störungen.'
        },
        {
            id: 'klingel', name: 'Klingel', gruppe: 'melder', kennbuchstabe: 'P',
            w: 60, h: 60,
            pfad: [senkrecht(30, 0, 14), senkrecht(30, 46, 60),
                'M10,46 a20,20 0 0,1 40,0 Z', waagrecht(46, 6, 54)],
            anschluesse: [{ nr: 'X1', x: 30, y: 0 }, { nr: 'X2', x: 30, y: 60 }],
            erklaerung: 'Türklingel, im Installationsplan sehr häufig.'
        },
        /* ---- Steckvorrichtungen ---------------------------------------------- */
        {
            id: 'steckdose', name: 'Steckdose', gruppe: 'stecker', kennbuchstabe: 'X',
            w: 60, h: 40,
            pfad: [senkrecht(30, 0, 12), 'M8,30 a22,22 0 0,1 44,0 Z', waagrecht(30, 8, 52)],
            anschluesse: [{ nr: 'L', x: 30, y: 0 }],
            erklaerung: 'Anschlussstelle für Geräte. Im Installationsplan der Halbkreis.'
        },
        {
            id: 'steckdose-schuko', name: 'Steckdose mit Schutzkontakt', gruppe: 'stecker', kennbuchstabe: 'X',
            w: 60, h: 40,
            pfad: [senkrecht(30, 0, 12), 'M8,30 a22,22 0 0,1 44,0 Z', waagrecht(30, 8, 52),
                senkrecht(30, 12, 20)],
            anschluesse: [{ nr: 'L', x: 30, y: 0 }],
            erklaerung: 'Wie die Steckdose, mit zusätzlichem Schutzleiterkontakt.'
        },
        {
            id: 'stecker', name: 'Stecker', gruppe: 'stecker', kennbuchstabe: 'X',
            w: 40, h: 50,
            pfad: [senkrecht(20, 0, 16), 'M20,16 L34,32 L6,32 Z'],
            anschluesse: [{ nr: '1', x: 20, y: 0 }],
            erklaerung: 'Das Gegenstück zur Steckdose.'
        },
        {
            id: 'steckverbindung', name: 'Steckverbindung', gruppe: 'stecker', kennbuchstabe: 'X',
            w: 40, h: 60,
            pfad: [senkrecht(20, 0, 22), 'M20,22 L32,34 L8,34 Z',
                'M8,38 a12,12 0 0,1 24,0 Z', senkrecht(20, 38, 60)],
            anschluesse: [{ nr: '1', x: 20, y: 0 }, { nr: '2', x: 20, y: 60 }],
            erklaerung: 'Stecker und Dose zusammen — eine trennbare Stelle im Plan.'
        },
        {
            id: 'klemme', name: 'Klemme', gruppe: 'stecker', kennbuchstabe: 'X',
            w: 40, h: 40,
            kreise: [{ cx: 20, cy: 20, r: 7 }],
            pfad: [senkrecht(20, 0, 13), senkrecht(20, 27, 40)],
            anschluesse: [{ nr: '1', x: 20, y: 0 }, { nr: '2', x: 20, y: 40 }],
            erklaerung: 'Trennstelle im Klemmenplan — hier endet die Verdrahtung im Schrank.'
        },
        {
            id: 'abzweigdose', name: 'Abzweigdose', gruppe: 'stecker', kennbuchstabe: 'X',
            w: 60, h: 60,
            kreise: [{ cx: 30, cy: 30, r: 20 }],
            pfad: [senkrecht(30, 0, 10), senkrecht(30, 50, 60),
                waagrecht(30, 0, 10), waagrecht(30, 50, 60)],
            anschluesse: [{ nr: '1', x: 30, y: 0 }, { nr: '2', x: 30, y: 60 },
                { nr: '3', x: 0, y: 30 }, { nr: '4', x: 60, y: 30 }],
            erklaerung: 'Hier werden Leitungen verbunden und abgezweigt.'
        },
        /* ---- Leitungen ------------------------------------------------------- */
        {
            id: 'verbindungspunkt', name: 'Verbindungspunkt', gruppe: 'leitungen', kennbuchstabe: '',
            w: 40, h: 40,
            kreise: [{ cx: 20, cy: 20, r: 4, voll: true }],
            pfad: [senkrecht(20, 0, 40), waagrecht(20, 0, 40)],
            anschluesse: [{ nr: '', x: 20, y: 0 }, { nr: '', x: 20, y: 40 },
                { nr: '', x: 0, y: 20 }, { nr: '', x: 40, y: 20 }],
            erklaerung: 'Der Punkt sagt: hier sind die Leitungen wirklich verbunden.'
        },
        {
            id: 'kreuzung', name: 'Kreuzung ohne Verbindung', gruppe: 'leitungen', kennbuchstabe: '',
            w: 40, h: 40,
            pfad: [senkrecht(20, 0, 40), waagrecht(20, 0, 14), waagrecht(20, 26, 40)],
            anschluesse: [{ nr: '', x: 20, y: 0 }, { nr: '', x: 20, y: 40 },
                { nr: '', x: 0, y: 20 }, { nr: '', x: 40, y: 20 }],
            erklaerung: 'Ohne Punkt kreuzen sich die Leitungen nur — sie berühren sich nicht.'
        },
        {
            id: 'leiter-l1', name: 'Aussenleiter L1', gruppe: 'leitungen', kennbuchstabe: 'L1',
            w: 60, h: 30,
            pfad: [waagrecht(20, 0, 60)],
            beschriftung: [{ x: 30, y: 12, t: 'L1' }],
            anschluesse: [{ nr: 'L1', x: 0, y: 20 }, { nr: 'L1', x: 60, y: 20 }],
            erklaerung: 'Erster Aussenleiter des Drehstromnetzes.'
        },
        {
            id: 'leiter-n', name: 'Neutralleiter N', gruppe: 'leitungen', kennbuchstabe: 'N',
            w: 60, h: 30,
            pfad: [waagrecht(20, 0, 60)],
            beschriftung: [{ x: 30, y: 12, t: 'N' }],
            anschluesse: [{ nr: 'N', x: 0, y: 20 }, { nr: 'N', x: 60, y: 20 }],
            erklaerung: 'Führt den Strom zurück. Blau gekennzeichnet.'
        },
        {
            id: 'leiter-pe', name: 'Schutzleiter PE', gruppe: 'leitungen', kennbuchstabe: 'PE',
            w: 60, h: 30,
            pfad: [waagrecht(20, 0, 60)],
            beschriftung: [{ x: 30, y: 12, t: 'PE' }],
            anschluesse: [{ nr: 'PE', x: 0, y: 20 }, { nr: 'PE', x: 60, y: 20 }],
            erklaerung: 'Grün-gelb. Berührt nie den Betriebsstrom, nur den Fehlerfall.'
        },
        /* ---- Schweizer Schalterschemas (Stromlaufschema) --------------------
         * In der Schweiz heissen die Lampenschaltungen nach ihrem SCHEMA, nicht
         * nach der Bauform: Schema 0 ist der Ausschalter, Schema 3 der
         * Wechselschalter. Die Bauform (Druck, Dreh, Kipp, Zug, Schlüssel) ist
         * davon unabhängig und steht als Betätigungsart daneben.
         *
         * Die Anschlussnummern 3 und 4 sind die üblichen am Schalter, X1 und X2
         * die an der Leuchte — so, wie sie im Lehrmittel und auf dem Gerät
         * stehen.
         * ------------------------------------------------------------------- */
        {
            id: 'ch-schema0', name: 'Ausschalter Schema 0', gruppe: 'ch-schema', kennbuchstabe: 'Q',
            w: 40, h: 60,
            pfad: [senkrecht(20, 0, 16), waagrecht(16, 12, 28), senkrecht(20, 44, 60),
                'M20,44 L32,14'],
            beschriftung: [{ x: 6, y: 34, t: '0' }],
            anschluesse: [{ nr: '3', x: 20, y: 0 }, { nr: '4', x: 20, y: 60 }],
            erklaerung: 'Eine Leuchte von EINER Stelle schalten. Keller, Bad, Kinderzimmer.'
        },
        {
            id: 'ch-schema1', name: 'Serienschalter Schema 1', gruppe: 'ch-schema', kennbuchstabe: 'Q',
            w: 60, h: 60,
            pfad: [senkrecht(30, 44, 60), senkrecht(10, 0, 16), senkrecht(50, 0, 16),
                waagrecht(16, 4, 18), waagrecht(16, 44, 58),
                'M30,44 L14,16', 'M30,44 L46,16'],
            beschriftung: [{ x: 6, y: 34, t: '1' }],
            anschluesse: [{ nr: '3', x: 30, y: 60 }, { nr: '4', x: 10, y: 0 },
                { nr: '5', x: 50, y: 0 }],
            erklaerung: 'ZWEI Leuchten getrennt schalten — Bad und Spiegel, Küche und Essen.'
        },
        {
            id: 'ch-schema2', name: 'Gruppenschalter Schema 2', gruppe: 'ch-schema', kennbuchstabe: 'Q',
            w: 60, h: 60,
            pfad: [senkrecht(30, 44, 60), senkrecht(10, 0, 16), senkrecht(50, 0, 16),
                waagrecht(16, 4, 18), waagrecht(16, 44, 58),
                'M30,44 L14,16', 'M30,44 L46,16', 'M18,50 h24'],
            beschriftung: [{ x: 6, y: 34, t: '2' }],
            anschluesse: [{ nr: '3', x: 30, y: 60 }, { nr: '4', x: 10, y: 0 },
                { nr: '5', x: 50, y: 0 }],
            erklaerung: 'Zwei Gruppen einzeln ODER zusammen — die Stellung „beide ein" gibt es.'
        },
        {
            id: 'ch-schema3', name: 'Wechselschalter Schema 3', gruppe: 'ch-schema', kennbuchstabe: 'Q',
            w: 60, h: 60,
            pfad: [senkrecht(10, 0, 16), senkrecht(50, 0, 16),
                senkrecht(30, 44, 60), 'M30,44 L14,16',
                waagrecht(16, 4, 18), waagrecht(16, 44, 58)],
            beschriftung: [{ x: 6, y: 34, t: '3' }],
            anschluesse: [{ nr: '3', x: 30, y: 60 }, { nr: '1', x: 10, y: 0 },
                { nr: '2', x: 50, y: 0 }],
            erklaerung: 'Von ZWEI Stellen schalten — Korridor, Treppe. Immer zu zweit verbaut.'
        },
        {
            id: 'ch-schema6', name: 'Kreuzschalter Schema 6', gruppe: 'ch-schema', kennbuchstabe: 'Q',
            w: 60, h: 60,
            pfad: [senkrecht(10, 0, 18), senkrecht(50, 0, 18),
                senkrecht(10, 42, 60), senkrecht(50, 42, 60),
                'M10,42 L50,18', 'M50,42 L10,18'],
            beschriftung: [{ x: 30, y: 34, t: '6' }],
            anschluesse: [{ nr: '1', x: 10, y: 0 }, { nr: '2', x: 50, y: 0 },
                { nr: '3', x: 10, y: 60 }, { nr: '4', x: 50, y: 60 }],
            erklaerung: 'Kommt ZWISCHEN zwei Wechselschalter — damit von drei und mehr Stellen.'
        },
        {
            id: 'ch-kontrolllampe', name: 'Kontrolllampe', gruppe: 'ch-schema', kennbuchstabe: 'E',
            w: 60, h: 60,
            kreise: [{ cx: 30, cy: 30, r: 20 }],
            pfad: [senkrecht(30, 0, 10), senkrecht(30, 50, 60),
                'M16,16 L44,44', 'M44,16 L16,44'],
            beschriftung: [{ x: 30, y: 8, t: 'K' }],
            anschluesse: [{ nr: 'X1', x: 30, y: 0 }, { nr: 'X2', x: 30, y: 60 }],
            erklaerung: 'Brennt, wenn der Verbraucher EIN ist. Parallel zum Verbraucher — braucht N.'
        },
        {
            id: 'ch-orientierungslampe', name: 'Orientierungslampe', gruppe: 'ch-schema', kennbuchstabe: 'E',
            w: 60, h: 60,
            kreise: [{ cx: 30, cy: 30, r: 20 }, { cx: 30, cy: 30, r: 8 }],
            pfad: [senkrecht(30, 0, 10), senkrecht(30, 50, 60)],
            beschriftung: [{ x: 30, y: 8, t: 'O' }],
            anschluesse: [{ nr: 'X1', x: 30, y: 0 }, { nr: 'X2', x: 30, y: 60 }],
            erklaerung: 'Brennt, wenn AUS ist — sie zeigt, WO der Schalter sitzt. Immer eine Glimmlampe.'
        },
        /* ---- Betätigungsarten ------------------------------------------------
         * Sie stehen am Schaltersymbol und sagen, WIE betätigt wird. Dieselbe
         * Schaltung kann als Druck-, Dreh-, Kipp-, Zug- oder Schlüsselschalter
         * gebaut sein — das Schema bleibt dasselbe.
         * ------------------------------------------------------------------- */
        {
            id: 'ch-druck', name: 'Betätigung: Drücken', gruppe: 'ch-schema', kennbuchstabe: '',
            w: 40, h: 30,
            pfad: [senkrecht(20, 8, 30), waagrecht(8, 8, 32)],
            anschluesse: [{ nr: '', x: 20, y: 30 }],
            erklaerung: 'Druckschalter — der Klassiker in der Altbauinstallation.'
        },
        {
            id: 'ch-dreh', name: 'Betätigung: Drehen', gruppe: 'ch-schema', kennbuchstabe: '',
            w: 40, h: 30,
            pfad: [senkrecht(20, 12, 30), 'M8,12 a12,12 0 0,1 24,0'],
            anschluesse: [{ nr: '', x: 20, y: 30 }],
            erklaerung: 'Drehschalter — mehrere Stellungen möglich, deshalb oft Schema 2.'
        },
        {
            id: 'ch-kipp', name: 'Betätigung: Kippen', gruppe: 'ch-schema', kennbuchstabe: '',
            w: 40, h: 30,
            pfad: [senkrecht(20, 14, 30), 'M8,8 L32,14'],
            anschluesse: [{ nr: '', x: 20, y: 30 }],
            erklaerung: 'Wippenschalter — heute die übliche Bauform.'
        },
        {
            id: 'ch-zug', name: 'Betätigung: Ziehen', gruppe: 'ch-schema', kennbuchstabe: '',
            w: 40, h: 30,
            pfad: [senkrecht(20, 6, 30), waagrecht(6, 12, 28), 'M14,12 L20,6 L26,12'],
            anschluesse: [{ nr: '', x: 20, y: 30 }],
            erklaerung: 'Zugschalter — im Bad, wo man mit nassen Händen nicht an die Wand will.'
        },
        {
            id: 'ch-schluessel', name: 'Betätigung: Schlüssel', gruppe: 'ch-schema', kennbuchstabe: '',
            w: 40, h: 30,
            kreise: [{ cx: 20, cy: 8, r: 5 }],
            pfad: [senkrecht(20, 13, 30)],
            anschluesse: [{ nr: '', x: 20, y: 30 }],
            erklaerung: 'Schlüsselschalter — wo nicht jeder schalten soll.'
        },
        /* ---- Bauplan (Installationsplan) -------------------------------------
         * Im Bauplan wird gezeichnet, WO im Raum etwas sitzt. Die Symbole sind
         * andere als im Stromlaufschema: ein Schalter ist hier ein Punkt an der
         * Wand mit Strichen, die das Schema angeben.
         * ------------------------------------------------------------------- */
        {
            id: 'bp-schalter0', name: 'Bauplan: Schalter Schema 0', gruppe: 'ch-bauplan', kennbuchstabe: 'Q',
            w: 40, h: 40,
            kreise: [{ cx: 20, cy: 30, r: 5, voll: true }],
            pfad: [senkrecht(20, 6, 25)],
            anschluesse: [{ nr: '3', x: 20, y: 40 }],
            erklaerung: 'Ein Strich am Punkt: Ausschalter. Der Punkt sitzt an der Wand.'
        },
        {
            id: 'bp-schalter1', name: 'Bauplan: Schalter Schema 1', gruppe: 'ch-bauplan', kennbuchstabe: 'Q',
            w: 40, h: 40,
            kreise: [{ cx: 20, cy: 30, r: 5, voll: true }],
            pfad: [senkrecht(20, 6, 25), 'M12,10 L28,10'],
            anschluesse: [{ nr: '3', x: 20, y: 40 }],
            erklaerung: 'Ein Querstrich: Serienschalter, zwei Gruppen getrennt.'
        },
        {
            id: 'bp-schalter3', name: 'Bauplan: Schalter Schema 3', gruppe: 'ch-bauplan', kennbuchstabe: 'Q',
            w: 40, h: 40,
            kreise: [{ cx: 20, cy: 30, r: 5, voll: true }],
            pfad: [senkrecht(20, 6, 25), 'M14,12 L20,6 L26,12'],
            anschluesse: [{ nr: '3', x: 20, y: 40 }],
            erklaerung: 'Pfeil nach oben: Wechselschalter — es gibt einen zweiten dazu.'
        },
        {
            id: 'bp-schalter6', name: 'Bauplan: Schalter Schema 6', gruppe: 'ch-bauplan', kennbuchstabe: 'Q',
            w: 40, h: 40,
            kreise: [{ cx: 20, cy: 30, r: 5, voll: true }],
            pfad: [senkrecht(20, 6, 25), 'M13,9 L27,17', 'M27,9 L13,17'],
            anschluesse: [{ nr: '1', x: 20, y: 40 }],
            erklaerung: 'Kreuz: Kreuzschalter, zwischen zwei Wechselschaltern.'
        },
        {
            id: 'bp-leuchtstelle', name: 'Bauplan: Leuchtstelle', gruppe: 'ch-bauplan', kennbuchstabe: 'E',
            w: 40, h: 40,
            kreise: [{ cx: 20, cy: 20, r: 11 }],
            pfad: ['M12,12 L28,28', 'M28,12 L12,28'],
            anschluesse: [{ nr: 'X1', x: 20, y: 0 }],
            erklaerung: 'Eine Lampenstelle an Decke oder Wand.'
        },
        {
            id: 'bp-leuchte', name: 'Bauplan: Leuchte', gruppe: 'ch-bauplan', kennbuchstabe: 'E',
            w: 60, h: 40,
            pfad: ['M10,14 H50 V26 H10 Z', waagrecht(20, 0, 10), waagrecht(20, 50, 60)],
            anschluesse: [{ nr: 'X1', x: 0, y: 20 }, { nr: 'X2', x: 60, y: 20 }],
            erklaerung: 'Eine längliche Leuchte — Leuchtstoff oder LED-Band.'
        },
        {
            id: 'bp-einbauleuchte', name: 'Bauplan: Einbauleuchte', gruppe: 'ch-bauplan', kennbuchstabe: 'E',
            w: 40, h: 40,
            kreise: [{ cx: 20, cy: 20, r: 11 }, { cx: 20, cy: 20, r: 5 }],
            pfad: [senkrecht(20, 0, 9)],
            anschluesse: [{ nr: 'X1', x: 20, y: 0 }],
            erklaerung: 'In die Decke eingelassen — Spot oder Downlight.'
        },
        {
            id: 'bp-t13', name: 'Bauplan: Steckdose T13', gruppe: 'ch-bauplan', kennbuchstabe: 'X',
            w: 40, h: 40,
            pfad: [senkrecht(20, 0, 14), 'M6,28 a14,14 0 0,1 28,0 Z', waagrecht(28, 6, 34)],
            anschluesse: [{ nr: 'L', x: 20, y: 0 }],
            erklaerung: 'Die übliche Schweizer Steckdose, 10 A, mit Schutzkontakt.'
        },
        {
            id: 'bp-t23', name: 'Bauplan: Steckdose T23', gruppe: 'ch-bauplan', kennbuchstabe: 'X',
            w: 40, h: 40,
            pfad: [senkrecht(20, 0, 14), 'M6,28 a14,14 0 0,1 28,0 Z', waagrecht(28, 6, 34),
                senkrecht(20, 18, 28)],
            anschluesse: [{ nr: 'L', x: 20, y: 0 }],
            erklaerung: '16 A statt 10 A — für Geräte mit mehr Leistung.'
        },
        {
            id: 'bp-t23-3fach', name: 'Bauplan: Steckdose T23 3-fach', gruppe: 'ch-bauplan', kennbuchstabe: 'X',
            w: 60, h: 40,
            pfad: [senkrecht(30, 0, 14), 'M6,28 a24,14 0 0,1 48,0 Z', waagrecht(28, 6, 54),
                senkrecht(18, 18, 28), senkrecht(30, 18, 28), senkrecht(42, 18, 28)],
            anschluesse: [{ nr: 'L', x: 30, y: 0 }],
            erklaerung: 'Drei Steckdosen in einem Gehäuse.'
        },
        {
            id: 'bp-abzweigdose', name: 'Bauplan: Abzweigdose', gruppe: 'ch-bauplan', kennbuchstabe: 'X',
            w: 40, h: 40,
            kreise: [{ cx: 20, cy: 20, r: 9, voll: true }],
            pfad: [senkrecht(20, 0, 11), senkrecht(20, 29, 40),
                waagrecht(20, 0, 11), waagrecht(20, 29, 40)],
            anschluesse: [{ nr: '1', x: 20, y: 0 }, { nr: '2', x: 20, y: 40 },
                { nr: '3', x: 0, y: 20 }, { nr: '4', x: 40, y: 20 }],
            erklaerung: 'Hier werden die Leitungen verbunden — ein voller Punkt im Bauplan.'
        },
        {
            id: 'bp-verteiler', name: 'Bauplan: Verteiler', gruppe: 'ch-bauplan', kennbuchstabe: 'F',
            w: 60, h: 40,
            pfad: ['M6,8 H54 V32 H6 Z', 'M6,20 H54', waagrecht(20, 0, 6)],
            anschluesse: [{ nr: 'L', x: 0, y: 20 }],
            erklaerung: 'Der Sicherungskasten der Wohnung.'
        },
        {
            id: 'bp-minuterie', name: 'Minuterie (Treppenhausautomat)', gruppe: 'ch-bauplan', kennbuchstabe: 'K',
            w: 60, h: 60,
            pfad: ['M8,18 H52 V42 H8 Z', senkrecht(30, 0, 18), senkrecht(30, 42, 60),
                'M22,30 h8 v-7'],
            kreise: [{ cx: 30, cy: 30, r: 9 }],
            anschluesse: [{ nr: '1', x: 30, y: 0 }, { nr: '2', x: 30, y: 60 }],
            erklaerung: 'Schaltet das Treppenhauslicht für eine eingestellte Zeit ein.'
        },
        {
            id: 'bp-daemmerung', name: 'Dämmerungsschalter', gruppe: 'ch-bauplan', kennbuchstabe: 'B',
            w: 60, h: 60,
            pfad: ['M12,16 H48 V44 H12 Z', senkrecht(30, 0, 16), senkrecht(30, 44, 60),
                'M22,36 L38,24', 'M34,24 H38 V28'],
            anschluesse: [{ nr: 'L', x: 30, y: 0 }, { nr: 'L′', x: 30, y: 60 }],
            erklaerung: 'Schaltet ein, wenn es dunkel wird — Aussenbeleuchtung.'
        },
        {
            id: 'bp-sonnerie', name: 'Sonnerie', gruppe: 'ch-bauplan', kennbuchstabe: 'P',
            w: 60, h: 60,
            pfad: [senkrecht(30, 0, 14), senkrecht(30, 46, 60),
                'M10,46 a20,20 0 0,1 40,0 Z', waagrecht(46, 6, 54), senkrecht(30, 26, 34)],
            anschluesse: [{ nr: 'X1', x: 30, y: 0 }, { nr: 'X2', x: 30, y: 60 }],
            erklaerung: 'Die Türklingel. In der Schweiz meist mit 12 V Schwachstrom.'
        },
        {
            id: 'bp-sonneriedruck', name: 'Sonneriedrucktaster', gruppe: 'ch-bauplan', kennbuchstabe: 'S',
            w: 40, h: 40,
            kreise: [{ cx: 20, cy: 26, r: 5, voll: true }],
            pfad: [senkrecht(20, 8, 21), waagrecht(8, 12, 28)],
            anschluesse: [{ nr: '3', x: 20, y: 40 }],
            erklaerung: 'Der Klingelknopf an der Tür.'
        }
    ];
    /* ------------------------------------------------------------------------
     * DIE LISTE, UND IMMER DIESELBE — wie in register/bloecke.js. Eigene
     * Sammlungen (Punkt 7) tragen sich hier ein, statt eine zweite Liste
     * daneben zu stellen.
     * ----------------------------------------------------------------------*/
    const LISTE = EINGEBAUT.slice();
    /** Ein eigenes Fachzeichen anmelden. Gibt `false` bei doppelter Kennung. */
    const melde = (z) => {
        if (!z || !z.id || LISTE.some(x => x.id === z.id))
            return false;
        LISTE.push(z);
        return true;
    };
    /** Ein eigenes Zeichen wieder abmelden — nur, was nicht eingebaut ist. */
    const vergiss = (id) => {
        if (EINGEBAUT.some(x => x.id === id))
            return false;
        const i = LISTE.findIndex(x => x.id === id);
        if (i < 0)
            return false;
        LISTE.splice(i, 1);
        return true;
    };
    const alle = () => LISTE;
    const holen = (id) => LISTE.find(x => x.id === id) || null;
    const inGruppe = (gruppe) => LISTE.filter(x => x.gruppe === gruppe);
    const gruppen = () => GRUPPEN.slice();
    const gruppenName = (id) => (GRUPPEN.find(g => g[0] === id) || [id, id, ''])[1];
    /**
     * Das Zeichen als SVG — die EINE Stelle, an der aus Daten ein Bild wird.
     *
     * `beschriftung` gehorcht dabei `zeigeText`: der Lernmodus (Punkt 9) blendet
     * die Beschriftung aus, damit man das Zeichen an der Form erkennen muss,
     * nicht am darin stehenden Buchstaben.
     */
    const alsSvg = (id, opt = {}) => {
        const z = holen(id);
        if (!z)
            return '';
        const farbe = opt.farbe || 'currentColor';
        const strich = opt.strich || 2;
        const text = opt.zeigeText !== false;
        const dreh = Number(opt.drehung) || 0;
        const mitte = `${z.w / 2},${z.h / 2}`;
        const wandlung = [
            dreh ? `rotate(${dreh} ${mitte})` : '',
            opt.gespiegelt ? `translate(${z.w} 0) scale(-1 1)` : ''
        ].filter(Boolean).join(' ');
        const teile = [];
        z.pfad.forEach(p => teile.push(`<path d="${p}"/>`));
        (z.kreise || []).forEach(k => teile.push(`<circle cx="${k.cx}" cy="${k.cy}" r="${k.r}"${k.voll ? ' fill="' + farbe + '"' : ''}/>`));
        if (text)
            (z.beschriftung || []).forEach(b => teile.push(`<text x="${b.x}" y="${b.y}" text-anchor="middle" fill="${farbe}" stroke="none" ` +
                `font-size="${b.gross ? 18 : 11}" font-family="inherit">${b.t}</text>`));
        if (opt.zeigeAnschluesse)
            z.anschluesse.forEach(a => teile.push(`<circle cx="${a.x}" cy="${a.y}" r="3" fill="${farbe}" stroke="none" opacity=".55"/>`));
        return `<svg viewBox="0 0 ${z.w} ${z.h}" width="${z.w}" height="${z.h}" ` +
            `fill="none" stroke="${farbe}" stroke-width="${strich}" stroke-linecap="round" ` +
            `stroke-linejoin="round" aria-hidden="true">` +
            (wandlung ? `<g transform="${wandlung}">` : '') + teile.join('') +
            (wandlung ? '</g>' : '') + '</svg>';
    };
    /**
     * Wo liegt ein Anschluss, nachdem das Zeichen gedreht und gespiegelt wurde?
     *
     * Das braucht der Editor, damit eine Leitung auch an einem gedrehten Symbol
     * an der richtigen Stelle einrastet. Ohne diese Funktion müsste jede
     * Aufrufstelle dieselbe Drehmatrix noch einmal schreiben — und eine davon
     * würde sie falsch schreiben.
     */
    const anschlussLage = (id, nr, drehung = 0, gespiegelt = false) => {
        const z = holen(id);
        if (!z)
            return null;
        const a = z.anschluesse.find(x => x.nr === nr) || z.anschluesse[0];
        if (!a)
            return null;
        let x = a.x, y = a.y;
        if (gespiegelt)
            x = z.w - x;
        const grad = ((Number(drehung) || 0) % 360 + 360) % 360;
        const cx = z.w / 2, cy = z.h / 2;
        const bogen = grad * Math.PI / 180;
        const dx = x - cx, dy = y - cy;
        return {
            x: Math.round(cx + dx * Math.cos(bogen) - dy * Math.sin(bogen)),
            y: Math.round(cy + dx * Math.sin(bogen) + dy * Math.cos(bogen))
        };
    };
    /** Die Aussenmasse nach einer Drehung — 90° tauscht Breite und Höhe. */
    const masse = (id, drehung = 0) => {
        const z = holen(id);
        if (!z)
            return { w: 0, h: 0 };
        const grad = ((Number(drehung) || 0) % 360 + 360) % 360;
        return (grad === 90 || grad === 270) ? { w: z.h, h: z.w } : { w: z.w, h: z.h };
    };
    return { RASTER, alle, holen, inGruppe, gruppen, gruppenName,
        alsSvg, anschlussLage, masse, melde, vergiss };
})();
