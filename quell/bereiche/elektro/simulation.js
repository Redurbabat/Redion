"use strict";
/* ============================================================================
 * bereiche/elektro/simulation.ts — der Strom fliesst wirklich
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/bereiche/elektro/simulation.ts`. `npm run bauen:ts`
 * schreibt daraus `quell/bereiche/elektro/simulation.js`.
 * ----------------------------------------------------------------------------
 * WARUM RECHNEN UND NICHT NUR ANIMIEREN
 *
 * Die bequeme Lösung wäre gewesen: schauen, ob es einen Weg von L nach N gibt,
 * und auf diesem Weg gestrichelte Linien laufen lassen. Das sieht in einer
 * Vorführung gut aus und ist im Unterricht wertlos — es beantwortet keine
 * einzige Frage, die eine Lernende stellt. Was fällt an der Lampe ab, wenn ich
 * zwei in Reihe schalte? Warum wird der Vorwiderstand warm? Was misst das
 * Amperemeter, wenn ich es an die falsche Stelle hänge?
 *
 * Deshalb steht hier eine echte Knotenpotentialanalyse (MNA). Sie löst ein
 * lineares Gleichungssystem über alle Netze und liefert für JEDES Bauteil
 * Spannung, Strom und Leistung — für Reihe, Parallel, gemischt und auch für
 * die Brücke, an der die Reihe-Parallel-Faustregel scheitert.
 *
 * DER GESCHLOSSENE KONTAKT HAT EINEN WIDERSTAND
 *
 * Zuerst stand hier der Lehrbuchweg: eine ideale Leitung als Spannungsquelle
 * mit 0 V, damit 1/0 die Matrix nicht sprengt. Exakt, elegant — und an der
 * Selbsthaltung gescheitert, dem meistgezeichneten Steuerstromkreis überhaupt.
 * Sobald der Haltekontakt zumacht, liegen zwei ideale Kurzschlüsse parallel,
 * und dann ist nicht mehr bestimmt, wie sich der Strom auf sie verteilt: zwei
 * Zeilen der Matrix sind identisch, das System ist singulär. Das ist kein
 * Rechenfehler, sondern eine ehrliche Auskunft über ein zu ideales Modell.
 *
 * Deshalb bekommt ein geschlossener Kontakt jetzt 1 mΩ. Das ist keine
 * Notlösung, sondern die Wirklichkeit: ein Relaiskontakt liegt bei etwa 5 mΩ,
 * ein Schalter bei 10, ein Meter Draht mit 1,5 mm² bei 12. Damit teilt sich
 * der Strom auf zwei parallele Kontakte so auf, wie er es in der Schaltung
 * auch tut — nämlich hälftig —, und der Spannungsabfall bleibt bei 0,2 A
 * unter einem Zehntel Millivolt, also unter jeder angezeigten Stelle.
 *
 * Das Amperemeter bleibt die 0-V-Quelle. Der Strom durch eine Spannungsquelle
 * ist eine Unbekannte des Gleichungssystems, und ihr Wert IST damit der
 * Messwert — nichts muss nachträglich geschätzt werden.
 *
 * DIE SCHLEIFE FÜR STEUERUNGEN
 *
 * Ein Schütz, das anzieht, schliesst seine Hilfskontakte, und die verändern
 * die Schaltung, die gerade gerechnet wurde. Also wird gerechnet, geschaut
 * welche Spulen Strom führen, die Kontakte nachgeführt und wieder gerechnet —
 * bis sich nichts mehr ändert. Selbsthaltung entsteht dabei von selbst, und
 * ein Blinkrelais auch: das ist der Fall, in dem sich nie etwas beruhigt, und
 * er wird als „schwingt" gemeldet statt endlos gerechnet.
 *
 * WAS DIESE SIMULATION NICHT IST
 *
 * Gleichstrom, eingeschwungen, linear. Keine Zeit, keine Kondensatorladung,
 * keine Induktivität, kein Wechselstromzeiger. Ein Kondensator ist hier eine
 * Unterbrechung, eine Spule eine Verbindung — was für die Frage „leuchtet die
 * Lampe" richtig ist und für „wie schnell lädt sie" falsch. Wo eine Annahme
 * getroffen wird, sagt die Simulation es (`annahmen`), statt eine Zahl
 * hinzustellen, die niemand nachprüfen kann.
 * ==========================================================================*/
const Stromfluss = (() => {
    /* ------------------------------------------------------------------------
     * 1. WAS EIN SYMBOL ELEKTRISCH IST
     * ------------------------------------------------------------------------
     * Das Register `fachzeichen` weiss, wie ein Bauteil AUSSIEHT. Hier steht,
     * was es TUT. Zwei getrennte Fragen, zwei getrennte Listen — ein Symbol
     * ohne Verhalten ist zeichenbar und wird beim Rechnen als Unterbrechung
     * behandelt, statt die ganze Rechnung scheitern zu lassen.
     * ----------------------------------------------------------------------*/
    /* Die beiden Stellungslisten, die fast überall gebraucht werden. */
    const AUF_ZU = (a, b) => [
        { name: 'offen', zu: [] },
        { name: 'geschlossen', zu: [[a, b]] }
    ];
    const ZU_AUF = (a, b) => [
        { name: 'geschlossen', zu: [[a, b]] },
        { name: 'offen', zu: [] }
    ];
    const VERHALTEN = {
        /* ---- Quellen ---- */
        batterie: { art: 'quelle', von: '+', nach: '−', wert: 12, einheit: 'V' },
        gleichspannung: { art: 'quelle', von: '+', nach: '−', wert: 24, einheit: 'V' },
        wechselspannung: { art: 'quelle', von: 'L', nach: 'N', wert: 230, einheit: 'V',
            wechselstrom: true, leiter: { L: 'L1', N: 'N' },
            annahme: 'Wechselspannung wird als Zeiger gerechnet: Betrag ist der Effektivwert, Winkel die Phasenlage. Für ohmsche Lasten ist das Ergebnis exakt.' },
        /* ---- Drehstrom: das Netz, an dem die Schweiz hängt ----
           3 × 400/230 V heisst: 230 V zwischen Aussenleiter und Neutralleiter,
           400 V zwischen zwei Aussenleitern. Die 400 V werden hier NICHT
           hingeschrieben — sie entstehen beim Rechnen aus drei Quellen, die um
           120° gegeneinander versetzt sind. Wer sie als „230 mal Wurzel 3"
           einträgt, bekommt zufällig dieselbe Zahl und hat den Grund verloren:
           dass die Spannung zwischen L2 und L3 um 90° gegen die von L1 versetzt
           ist, steht in keiner Wurzel drei.
    
           Der Sternpunkt ist geerdet, und von ihm geht der Schutzleiter aus
           (TN-S). Deshalb hängen N und PE hier zusammen — und genau deshalb
           fällt beim Vertauschen der beiden elektrisch NICHTS auf. Das ist keine
           Ungenauigkeit der Simulation, sondern der Grund, warum der Fehler
           gefährlich ist. Bogen 3 meldet ihn, die Rechnung kann es nicht. */
        drehstromquelle: { art: 'mehrteilig', wert: 230, einheit: 'V',
            wechselstrom: true, leiter: { L1: 'L1', L2: 'L2', L3: 'L3', N: 'N', PE: 'PE' },
            glieder: [
                { art: 'quelle', von: 'L1', nach: 'N', wert: 230, phase: 0 },
                { art: 'quelle', von: 'L2', nach: 'N', wert: 230, phase: -120 },
                { art: 'quelle', von: 'L3', nach: 'N', wert: 230, phase: -240 },
                { art: 'leiter', von: 'N', nach: 'PE' }
            ],
            annahme: 'Drehstrom wird als Zeiger gerechnet: drei Quellen zu 230 V, um 120° versetzt. Zwischen zwei Aussenleitern ergeben sich daraus 400 V — gerechnet, nicht eingetragen.' },
        generator: { art: 'quelle', von: '1', nach: '2', wert: 230, einheit: 'V',
            wechselstrom: true },
        erde: { art: 'bezug', von: 'E', leiter: { E: 'PE' } },
        masse: { art: 'bezug', von: 'M' },
        schutzleiter: { art: 'bezug', von: 'PE', leiter: { PE: 'PE' } },
        /* ---- Schalter: alles, was von Hand bewegt wird ---- */
        ausschalter: { art: 'schalter', stellungen: AUF_ZU('1', '2') },
        'taster-schliesser': { art: 'schalter', stellungen: AUF_ZU('3', '4') },
        'taster-oeffner': { art: 'schalter', stellungen: ZU_AUF('1', '2') },
        notaus: { art: 'schalter', stellungen: ZU_AUF('1', '2') },
        endschalter: { art: 'schalter', stellungen: AUF_ZU('3', '4') },
        hauptschalter: { art: 'schalter', stellungen: [
                { name: 'aus', zu: [] },
                { name: 'ein', zu: [['1', '2'], ['3', '4'], ['5', '6']] }
            ] },
        wechselschalter: { art: 'schalter', stellungen: [
                { name: 'L–1', zu: [['L', '1']] },
                { name: 'L–2', zu: [['L', '2']] }
            ] },
        serienschalter: { art: 'schalter', stellungen: [
                { name: 'aus', zu: [] },
                { name: 'L–1', zu: [['L', '1']] },
                { name: 'L–2', zu: [['L', '2']] },
                { name: 'beide', zu: [['L', '1'], ['L', '2']] }
            ] },
        kreuzschalter: { art: 'schalter', stellungen: [
                { name: 'gerade', zu: [['1', '2'], ['3', '4']] },
                { name: 'gekreuzt', zu: [['1', '4'], ['3', '2']] }
            ] },
        /* ---- Die Schweizer Schemas: dieselbe Mechanik, eigene Namen ----
           Schema 1 und 2 sehen im Ergebnis ähnlich aus und sind es nicht: der
           Serienschalter schaltet zwei Gruppen UNABHÄNGIG, der Gruppenschalter
           durchläuft eine feste Reihenfolge und kennt die Stellung „beide". */
        'ch-schema0': { art: 'schalter', stellungen: AUF_ZU('3', '4') },
        'ch-schema1': { art: 'schalter', stellungen: [
                { name: 'aus', zu: [] },
                { name: 'nur 4', zu: [['3', '4']] },
                { name: 'nur 5', zu: [['3', '5']] },
                { name: 'beide', zu: [['3', '4'], ['3', '5']] }
            ] },
        'ch-schema2': { art: 'schalter', stellungen: [
                { name: 'aus', zu: [] },
                { name: 'Gruppe 1', zu: [['3', '4']] },
                { name: 'Gruppe 1+2', zu: [['3', '4'], ['3', '5']] },
                { name: 'Gruppe 2', zu: [['3', '5']] }
            ] },
        'ch-schema3': { art: 'schalter', stellungen: [
                { name: '3–1', zu: [['3', '1']] },
                { name: '3–2', zu: [['3', '2']] }
            ] },
        'ch-schema6': { art: 'schalter', stellungen: [
                { name: 'gerade', zu: [['1', '2'], ['3', '4']] },
                { name: 'gekreuzt', zu: [['1', '4'], ['3', '2']] }
            ] },
        /* ---- Kontakte: die schaltet nicht die Hand, sondern eine Spule ---- */
        /* Der Wechsler ist ein Kontakt mit drei Klemmen: 11 ist gemeinsam, 12
           liegt in Ruhe an, 14 nach dem Anziehen. Er wird als Schliesser
           geführt, weil die Schleife nur „an" und „aus" kennt — die Ruhelage
           ist damit Stellung 0 und die angezogene Stellung 1, genau wie bei
           jedem anderen Kontakt. */
        wechsler: { art: 'schalter', folgtSpule: 'schliesser', stellungen: [
                { name: 'Ruhe (11–12)', zu: [['11', '12']] },
                { name: 'angezogen (11–14)', zu: [['11', '14']] }
            ] },
        schliesser: { art: 'schalter', stellungen: AUF_ZU('3', '4'), folgtSpule: 'schliesser' },
        oeffner: { art: 'schalter', stellungen: ZU_AUF('1', '2'), folgtSpule: 'oeffner' },
        'schuetz-schliesser': { art: 'schalter', stellungen: AUF_ZU('13', '14'), folgtSpule: 'schliesser' },
        'schuetz-oeffner': { art: 'schalter', stellungen: ZU_AUF('21', '22'), folgtSpule: 'oeffner' },
        'schuetz-hauptkontakt': { art: 'schalter', stellungen: AUF_ZU('1', '2'), folgtSpule: 'schliesser' },
        /* ---- Spulen: Verbraucher UND Auslöser zugleich ---- */
        spule: { art: 'spule', von: 'A1', nach: 'A2', wert: 1500, einheit: 'Ω' },
        'spule-anzugsverzoegert': { art: 'spule', von: 'A1', nach: 'A2', wert: 1500, einheit: 'Ω',
            annahme: 'Die Verzögerung wird nicht gerechnet — die Simulation kennt keine Zeit. Der Kontakt folgt sofort.' },
        'spule-abfallverzoegert': { art: 'spule', von: 'A1', nach: 'A2', wert: 1500, einheit: 'Ω',
            annahme: 'Die Verzögerung wird nicht gerechnet — die Simulation kennt keine Zeit. Der Kontakt folgt sofort.' },
        /* ---- Verbraucher ---- */
        lampe: { art: 'widerstand', von: 'X1', nach: 'X2', wert: 529, einheit: 'Ω',
            annahme: 'Eine 100-W-Lampe an 230 V. Der Kaltwiderstand einer Glühlampe ist deutlich kleiner; hier wird der Betriebswert gerechnet.' },
        signalleuchte: { art: 'widerstand', von: 'X1', nach: 'X2', wert: 23000, einheit: 'Ω' },
        hupe: { art: 'widerstand', von: 'X1', nach: 'X2', wert: 1000, einheit: 'Ω' },
        klingel: { art: 'widerstand', von: 'X1', nach: 'X2', wert: 1000, einheit: 'Ω' },
        'ch-kontrolllampe': { art: 'widerstand', von: 'X1', nach: 'X2', wert: 23000, einheit: 'Ω' },
        'ch-orientierungslampe': { art: 'widerstand', von: 'X1', nach: 'X2', wert: 46000, einheit: 'Ω' },
        'bp-leuchte': { art: 'widerstand', von: 'X1', nach: 'X2', wert: 529, einheit: 'Ω' },
        'bp-sonnerie': { art: 'widerstand', von: 'X1', nach: 'X2', wert: 1000, einheit: 'Ω' },
        widerstand: { art: 'widerstand', von: '1', nach: '2', wert: 100, einheit: 'Ω' },
        potentiometer: { art: 'widerstand', von: '1', nach: '2', wert: 1000, einheit: 'Ω',
            annahme: 'Der Schleifer wird nicht mitgerechnet — nur der Widerstand zwischen 1 und 2.' },
        'motor-wechselstrom': { art: 'widerstand', von: 'U1', nach: 'U2', wert: 66, einheit: 'Ω',
            annahme: 'Der Motor wird als reiner Wirkwiderstand gerechnet. Anlaufstrom und Blindanteil fehlen.' },
        'motor-gleichstrom': { art: 'widerstand', von: 'A1', nach: 'A2', wert: 20, einheit: 'Ω',
            annahme: 'Ohne Gegenspannung gerechnet — der Wert gilt für den Stillstand, nicht für den Lauf.' },
        /* ---- Der Drehstrommotor und sein Klemmenbrett ----
           Die drei Wicklungsstränge liegen zwischen U1–U2, V1–V2 und W1–W2. Wie
           sie verschaltet sind, machen die BRÜCKEN auf dem Klemmenbrett aus —
           und genau das ist die Aufgabe, die im Unterricht gezeichnet wird.
           Deshalb sind die Brücken hier Schalterstellungen und keine feste
           Verdrahtung: wer „Stern" wählt, sieht 230 V am Strang, wer „Dreieck"
           wählt, sieht 400 V — beides ausgerechnet, nicht angeschrieben.
    
           Ohne Brücken ist der Motor nicht falsch angeschlossen, sondern gar
           nicht angeschlossen. Das ist die Ruhelage, weil ein leeres
           Klemmenbrett genau das ist, was auf dem Tisch liegt. */
        'motor-drehstrom': { art: 'mehrteilig', wert: 60, einheit: 'Ω',
            schutzklasse: 1,
            glieder: [
                { art: 'widerstand', von: 'U1', nach: 'sternpunkt', wert: 60 },
                { art: 'widerstand', von: 'V1', nach: 'sternpunkt', wert: 60 },
                { art: 'widerstand', von: 'W1', nach: 'sternpunkt', wert: 60 }
            ],
            annahme: 'Der Motor ist mit drei Anschlüssen gezeichnet und wird deshalb als fertig in Stern geschaltet gerechnet — so, wie ein Motor mit dem Schild 3 × 400/230 V am 400-V-Netz betrieben wird. Wer die Brücken selbst setzen will, nimmt das Klemmenbrett. Die Wicklungen gelten als rein ohmsch: Blindanteil, Anlaufstrom und Schlupf fehlen.' },
        'motor-klemmenbrett': { art: 'mehrteilig', wert: 60, einheit: 'Ω',
            schutzklasse: 1, schutzklemme: 'PE',
            glieder: [
                { art: 'widerstand', von: 'U1', nach: 'U2', wert: 60 },
                { art: 'widerstand', von: 'V1', nach: 'V2', wert: 60 },
                { art: 'widerstand', von: 'W1', nach: 'W2', wert: 60 }
            ],
            stellungen: [
                { name: 'ohne Brücken', zu: [] },
                { name: 'Stern', zu: [['U2', 'V2'], ['V2', 'W2']] },
                { name: 'Dreieck', zu: [['U1', 'W2'], ['V1', 'U2'], ['W1', 'V2']] }
            ],
            annahme: 'Die drei Wicklungen gelten als rein ohmsch. Das Verhältnis von Stern zu Dreieck stimmt trotzdem, weil es allein an der Spannung hängt und nicht an der Art der Last.' },
        'spule-induktivitaet': { art: 'leiter', von: '1', nach: '2',
            annahme: 'Bei Gleichstrom ist eine Spule eine Verbindung. Ihre Wirkung zeigt sich erst im Wechselstrom.' },
        /* ---- Schutzgeräte ----
           Sie sind alle Schalter: im Betrieb geschlossen, im Fehlerfall offen.
           Was sie AUSLÖST, kann diese Simulation nicht rechnen — dafür bräuchte
           es Zeit (die Auslösekennlinie eines Leitungsschutzschalters ist eine
           Kurve über Sekunden) oder Wärme (das Bimetall eines Thermorelais).
           Sie stehen trotzdem hier und nicht als Unterbrechung: ein Plan mit
           einem Motorschutzschalter darin muss rechnen, sonst ist der halbe
           Motorenteil des Lehrmittels nicht zeichenbar. */
        sicherung: { art: 'schalter', stellungen: ZU_AUF('1', '2') },
        leitungsschutzschalter: { art: 'schalter', stellungen: ZU_AUF('1', '2') },
        motorschutzschalter: { art: 'schalter', stellungen: [
                { name: 'ein', zu: [['1', '2'], ['3', '4'], ['5', '6']] },
                { name: 'ausgelöst', zu: [] }
            ], annahme: 'Der Motorschutzschalter trennt alle drei Aussenleiter zugleich. Wann er auslöst, wird nicht gerechnet — dafür bräuchte es Zeit und Wärme.' },
        thermorelais: { art: 'schalter', stellungen: [
                { name: 'ein', zu: [['1', '2'], ['3', '4'], ['5', '6']] },
                { name: 'ausgelöst', zu: [] }
            ], annahme: 'Das Bimetall wird nicht gerechnet. Die Stellung „ausgelöst" lässt sich von Hand wählen, um den Fall zu zeigen.' },
        /* Der Fehlerstrom-Schutzschalter. Er ist als SCHALTER gebaut wie die
           anderen — sein Besonderes steht nicht hier, sondern in der
           Fehlerprüfung: dort wird die Summe der Ströme durch seine Pole
           gebildet, und die ist der Fehlerstrom (E545). Das kann die Rechnung
           wirklich, und deshalb ist er der einzige Schutz, der hier nicht nur
           gezeichnet, sondern gemessen wird. */
        'fi-schutzschalter': { art: 'schalter', stellungen: [
                { name: 'ein', zu: [['1', '2'], ['3', '4'], ['N', 'N2']] },
                { name: 'ausgelöst', zu: [] }
            ], schutzklemme: 'N',
            annahme: 'Die Auslösung wird nicht selbst geschaltet — der Fehlerstrom wird aber gerechnet und gemeldet.' },
        ueberspannungsableiter: { art: 'offen', von: '1', nach: 'PE',
            annahme: 'Im Betrieb sperrt er. Er leitet erst bei einer Überspannung, und die kommt in dieser Rechnung nicht vor.' },
        klemme: { art: 'leiter', von: '1', nach: '2' },
        steckverbindung: { art: 'leiter', von: '1', nach: '2' },
        'leiter-l1': { art: 'leiter', von: 'L1', nach: 'L1', leiter: { L1: 'L1' } },
        'leiter-l2': { art: 'leiter', von: 'L2', nach: 'L2', leiter: { L2: 'L2' } },
        'leiter-l3': { art: 'leiter', von: 'L3', nach: 'L3', leiter: { L3: 'L3' } },
        'leiter-n': { art: 'leiter', von: 'N', nach: 'N', leiter: { N: 'N' } },
        'leiter-pe': { art: 'leiter', von: 'PE', nach: 'PE', leiter: { PE: 'PE' } },
        'bp-minuterie': { art: 'schalter', stellungen: AUF_ZU('1', '2') },
        /* ---- Steckvorrichtungen ----
           Eine Steckdose ohne Gerät ist eine Unterbrechung, und mit Gerät ist
           sie das Gerät. Welches, weiss der Plan nicht — deshalb `offen` mit
           einer genannten Annahme, statt einen Verbraucher zu erfinden. */
        steckdose: { art: 'offen', von: 'L', nach: 'N',
            annahme: 'Was in der Steckdose steckt, wird nicht mitgerechnet. Ohne Gerät ist sie eine Unterbrechung.' },
        'steckdose-schuko': { art: 'offen', von: 'L', nach: 'N',
            leiter: {}, schutzklemme: 'PE',
            annahme: 'Was in der Steckdose steckt, wird nicht mitgerechnet. Der Schutzkontakt wird geprüft, nicht gerechnet.' },
        stecker: { art: 'offen', von: 'L', nach: 'N',
            annahme: 'Der Stecker allein führt nichts. Was daran hängt, steht nicht im Plan.' },
        /* ---- Widerstände, die auf etwas reagieren ----
           Alle vier ändern ihren Wert mit einer Grösse, die dieser Rechnung
           fehlt: Temperatur, Licht, Spannung. Gerechnet wird deshalb ihr
           Grundwert, und die Annahme sagt es. Als Unterbrechung wären sie
           falscher — ein NTC in einer Reihenschaltung leitet ja. */
        ptc: { art: 'widerstand', von: '1', nach: '2', wert: 100, einheit: 'Ω',
            annahme: 'Der Kaltleiter wird mit seinem kalten Wert gerechnet. Die Temperatur kommt in dieser Rechnung nicht vor.' },
        ntc: { art: 'widerstand', von: '1', nach: '2', wert: 10000, einheit: 'Ω',
            annahme: 'Der Heissleiter wird mit seinem kalten Wert gerechnet. Die Temperatur kommt in dieser Rechnung nicht vor.' },
        vdr: { art: 'widerstand', von: '1', nach: '2', wert: 1e6, einheit: 'Ω',
            annahme: 'Der Varistor wird hochohmig gerechnet. Er leitet erst bei Überspannung, und die kommt hier nicht vor.' },
        ldr: { art: 'widerstand', von: '1', nach: '2', wert: 10000, einheit: 'Ω',
            annahme: 'Der Fotowiderstand wird mit einem mittleren Wert gerechnet. Die Helligkeit kommt in dieser Rechnung nicht vor.' },
        frequenzmesser: { art: 'volt', von: '1', nach: '2',
            annahme: 'Er wird wie ein Voltmeter hochohmig gerechnet. Die Frequenz selbst ist in dieser Rechnung fest — 50 Hz.' },
        /* ---- Was ihn sperrt ---- */
        kondensator: { art: 'offen', von: '1', nach: '2',
            annahme: 'Bei Gleichstrom sperrt ein geladener Kondensator. Der Ladevorgang wird nicht gerechnet.' },
        elko: { art: 'offen', von: '+', nach: '−',
            annahme: 'Bei Gleichstrom sperrt ein geladener Kondensator. Der Ladevorgang wird nicht gerechnet.' },
        /* ---- Halbleiter ---- */
        diode: { art: 'diode', von: 'A', nach: 'K', wert: 0.7, einheit: 'V',
            annahme: 'Ideale Diode mit 0,7 V Durchlassspannung. Sperrstrom und Kennlinie fehlen.' },
        led: { art: 'diode', von: 'A', nach: 'K', wert: 2, einheit: 'V',
            annahme: 'Ideale Diode mit 2 V Durchlassspannung.' },
        zenerdiode: { art: 'diode', von: 'A', nach: 'K', wert: 0.7, einheit: 'V',
            annahme: 'Nur die Durchlassrichtung wird gerechnet — die Z-Wirkung in Sperrrichtung fehlt.' },
        /* ---- Messgeräte ---- */
        voltmeter: { art: 'volt', von: '+', nach: '−',
            annahme: 'Innenwiderstand 10 MΩ, wie ein gutes Digitalmessgerät.' },
        amperemeter: { art: 'ampere', von: '+', nach: '−',
            annahme: 'Innenwiderstand 0 Ω. Ein echtes Messgerät hat einen kleinen Shunt.' },
        wattmeter: { art: 'ampere', von: '1', nach: '2' },
        zaehler: { art: 'ampere', von: '1', nach: '2' },
        ohmmeter: { art: 'volt', von: '1', nach: '2',
            annahme: 'Ein Ohmmeter misst nur im spannungsfreien Kreis. Hier wird es als hochohmig gerechnet.' },
        /* ---- Sensoren: von Hand schaltbar, weil die Simulation keine Welt hat ---- */
        naeherungsschalter: { art: 'schalter', stellungen: AUF_ZU('1', '4') },
        temperaturfuehler: { art: 'schalter', stellungen: AUF_ZU('1', '2') },
        drucksensor: { art: 'schalter', stellungen: AUF_ZU('1', '2') },
        lichtschranke: { art: 'schalter', stellungen: ZU_AUF('1', '4') },
        bewegungsmelder: { art: 'schalter', stellungen: AUF_ZU('L', 'L′') },
        'bp-daemmerung': { art: 'schalter', stellungen: AUF_ZU('L', 'L′') }
    };
    /** Was ein Symbol elektrisch ist — `null`, wenn es nur gezeichnet wird. */
    const verhalten = (zeichenId) => VERHALTEN[zeichenId] || null;
    /** Wie viele Stellungen ein Bauteil hat (1 = nicht schaltbar). */
    const stellungenVon = (zeichenId) => {
        const v = VERHALTEN[zeichenId];
        return (v && v.stellungen) ? v.stellungen : [];
    };
    /* ------------------------------------------------------------------------
     * 2. WELCHE ANSCHLÜSSE HÄNGEN ZUSAMMEN (die Netzliste)
     * ------------------------------------------------------------------------
     * Zwei Klemmen sind dasselbe Netz, wenn eine Leitung sie verbindet, oder
     * wenn zwei Leitungen sich an einem Verbindungspunkt berühren. Das steht
     * nirgends gespeichert — es ergibt sich aus der Zeichnung, und genau das
     * ist der Grund, warum man den Plan malen und nicht tippen muss.
     * ----------------------------------------------------------------------*/
    /** Verbandsuche über Zeichenketten. Klein, aber sie trägt die ganze Netzliste. */
    const verband = () => {
        const vater = new Map();
        const finde = (a) => {
            if (!vater.has(a)) {
                vater.set(a, a);
                return a;
            }
            let w = a;
            while (vater.get(w) !== w)
                w = vater.get(w);
            /* Pfad kürzen, sonst wird eine lange Kette von Klemmen quadratisch. */
            let z = a;
            while (vater.get(z) !== w) {
                const n = vater.get(z);
                vater.set(z, w);
                z = n;
            }
            return w;
        };
        const eins = (a, b) => {
            const wa = finde(a), wb = finde(b);
            if (wa !== wb)
                vater.set(wa, wb);
        };
        return { finde, eins, alle: () => Array.from(vater.keys()) };
    };
    const NAH = 6;
    const nahBei = (ax, ay, bx, by) => Math.abs(ax - bx) <= NAH && Math.abs(ay - by) <= NAH;
    /** Liegt `p` auf der Strecke a–b? Nur waagrecht und senkrecht, mehr gibt es nicht. */
    const aufStrecke = (px, py, ax, ay, bx, by) => {
        if (Math.abs(ay - by) <= 1 && Math.abs(py - ay) <= NAH)
            return px >= Math.min(ax, bx) - NAH && px <= Math.max(ax, bx) + NAH;
        if (Math.abs(ax - bx) <= 1 && Math.abs(px - ax) <= NAH)
            return py >= Math.min(ay, by) - NAH && py <= Math.max(ay, by) + NAH;
        return false;
    };
    /**
     * Alle Klemmen des Plans mit ihrem Ort. Kommt aus `Schaltplan`, damit
     * Drehung und Spiegelung genau so gerechnet werden wie beim Zeichnen —
     * eine zweite Rechnung daneben liefe irgendwann auseinander.
     */
    const klemmen = (plan) => {
        const raus = [];
        (plan.teile || []).forEach((t) => {
            const liste = (typeof Schaltplan !== 'undefined')
                ? Schaltplan.anschluesseVon(t) : [];
            liste.forEach((a) => raus.push({
                teil: t.id, nr: a.nr, x: a.x, y: a.y, schluessel: `k:${t.id}:${a.nr}`
            }));
            /* Innere Knoten.
               --------------------------------------------------------------
               Ein Drehstrommotor hat drei Anschlüsse und DREI Wicklungen. Wo die
               sich treffen — im Sternpunkt — ist kein Anschluss: der liegt im
               Motor und kommt nirgends heraus. Trotzdem ist er ein Netz, und ohne
               ihn lässt sich der Motor überhaupt nicht rechnen.
               Solche Knoten bekommen hier ihre eigene Netznummer und keinen Ort.
               Der Ort ist bewusst NaN und nicht 0: bei 0 läge der Sternpunkt in
               der linken oberen Ecke und würde sich mit jeder Leitung verbinden,
               die zufällig dort vorbeikommt. Jeder Vergleich mit NaN ist falsch,
               und genau das ist hier richtig. */
            const v = verhalten(t.zeichen);
            if (!v || !v.glieder)
                return;
            const aussen = new Set(liste.map((a) => String(a.nr)));
            const innen = new Set();
            v.glieder.forEach(g => {
                [g.von, g.nach].forEach(nr => {
                    if (!aussen.has(nr) && !innen.has(nr))
                        innen.add(nr);
                });
            });
            innen.forEach(nr => raus.push({
                teil: t.id, nr, x: NaN, y: NaN, schluessel: `k:${t.id}:${nr}`, intern: true
            }));
        });
        return raus;
    };
    /**
     * Die Netzliste: jede Klemme bekommt eine Netznummer. Klemmen ohne
     * Verbindung bekommen ihre eigene — eine offene Klemme ist ein Netz mit
     * einem Mitglied, nicht ein Fehler.
     */
    const netze = (plan) => {
        const v = verband();
        const ks = klemmen(plan);
        ks.forEach(k => v.finde(k.schluessel));
        const ls = (plan.leitungen || []);
        ls.forEach(l => v.finde(`l:${l.id}`));
        /* Leitung an Klemme — erst über die gespeicherte Bindung, dann über den
           Ort. Die Bindung ist verlässlicher; der Ort fängt die Fälle, in denen
           jemand eine Leitung von Hand an eine Klemme geschoben hat. */
        ls.forEach(l => {
            const pk = `l:${l.id}`;
            if (l.vonTeil && l.vonNr)
                v.eins(pk, `k:${l.vonTeil}:${l.vonNr}`);
            if (l.nachTeil && l.nachNr)
                v.eins(pk, `k:${l.nachTeil}:${l.nachNr}`);
            const punkte = (l.punkte || []);
            punkte.forEach(p => ks.forEach(k => {
                if (nahBei(p.x, p.y, k.x, k.y))
                    v.eins(pk, k.schluessel);
            }));
            /* Auch eine Klemme MITTEN auf einer Leitung zählt — so wird eine
               Sammelschiene angezapft, ohne sie zu zerschneiden. */
            for (let i = 0; i + 1 < punkte.length; i++) {
                const a = punkte[i], b = punkte[i + 1];
                ks.forEach(k => { if (aufStrecke(k.x, k.y, a.x, a.y, b.x, b.y))
                    v.eins(pk, k.schluessel); });
            }
        });
        /* Leitung an Leitung: berühren sich zwei Leitungen an einem Punkt, der
           ein Ende oder ein Knick ist, sind sie verbunden. Eine reine Kreuzung
           zweier durchlaufender Leitungen ist es NICHT — sonst wäre jeder
           gekreuzte Plan ein einziger Kurzschluss. */
        for (let i = 0; i < ls.length; i++) {
            for (let j = i + 1; j < ls.length; j++) {
                const a = ls[i], b = ls[j];
                const pa = (a.punkte || []);
                const pb = (b.punkte || []);
                let treffer = false;
                pa.forEach(p => {
                    if (treffer)
                        return;
                    for (let s = 0; s + 1 < pb.length; s++) {
                        if (aufStrecke(p.x, p.y, pb[s].x, pb[s].y, pb[s + 1].x, pb[s + 1].y)) {
                            treffer = true;
                            return;
                        }
                    }
                });
                pb.forEach(p => {
                    if (treffer)
                        return;
                    for (let s = 0; s + 1 < pa.length; s++) {
                        if (aufStrecke(p.x, p.y, pa[s].x, pa[s].y, pa[s + 1].x, pa[s + 1].y)) {
                            treffer = true;
                            return;
                        }
                    }
                });
                if (treffer)
                    v.eins(`l:${a.id}`, `l:${b.id}`);
            }
        }
        /* Ein Verbindungspunkt-Symbol und eine Abzweigdose verbinden ihre eigenen
           Klemmen untereinander — sie sind gezeichnete Knoten. */
        (plan.teile || []).forEach((t) => {
            if (t.zeichen !== 'verbindungspunkt' && t.zeichen !== 'abzweigdose'
                && t.zeichen !== 'bp-abzweigdose')
                return;
            const eigene = ks.filter(k => k.teil === t.id);
            for (let i = 1; i < eigene.length; i++)
                v.eins(eigene[0].schluessel, eigene[i].schluessel);
        });
        const nummer = new Map();
        const netzVon = new Map();
        ks.forEach(k => {
            const w = v.finde(k.schluessel);
            if (!nummer.has(w))
                nummer.set(w, nummer.size);
            netzVon.set(k.schluessel, nummer.get(w));
        });
        /* Die Leitungen bekommen ihre Netznummer NACH den Klemmen. Eine Leitung,
           die an keinem Bauteil hängt, kriegt eine eigene — sie ist dann ein
           Netz für sich, und das ist keine Störung, sondern das, was sie ist. */
        const leitungNetz = {};
        ls.forEach(l => {
            const w = v.finde(`l:${l.id}`);
            if (!nummer.has(w))
                nummer.set(w, nummer.size);
            leitungNetz[l.id] = nummer.get(w);
        });
        return { netzVon, anzahl: nummer.size, klemmen: ks, leitungNetz };
    };
    /* ------------------------------------------------------------------------
     * 3. DAS GLEICHUNGSSYSTEM LÖSEN
     * ------------------------------------------------------------------------
     * Gauss mit Spaltenpivot. Kein Zauber, aber es muss den singulären Fall
     * ERKENNEN statt NaN zurückzugeben: eine Schaltung mit einem freischwebenden
     * Teil hat keine eindeutige Lösung, und das ist eine Aussage über die
     * Zeichnung, die die Lernende hören will.
     * ----------------------------------------------------------------------*/
    const loese = (A, z) => {
        const n = z.length;
        if (!n)
            return [];
        /* Eigene Kopie — die Aufrufer geben ihre Matrix nicht zum Zerstören her. */
        const M = A.map((r, i) => r.slice().concat([z[i]]));
        for (let s = 0; s < n; s++) {
            let best = s, betrag = Math.abs(M[s][s]);
            for (let r = s + 1; r < n; r++) {
                const b = Math.abs(M[r][s]);
                if (b > betrag) {
                    betrag = b;
                    best = r;
                }
            }
            if (betrag < 1e-12)
                return null;
            if (best !== s) {
                const h = M[s];
                M[s] = M[best];
                M[best] = h;
            }
            const p = M[s][s];
            for (let r = 0; r < n; r++) {
                if (r === s)
                    continue;
                const f = M[r][s] / p;
                if (!f)
                    continue;
                for (let c = s; c <= n; c++)
                    M[r][c] = M[r][c] - f * M[s][c];
            }
        }
        const x = [];
        for (let i = 0; i < n; i++) {
            const w = M[i][n] / M[i][i];
            x.push(Number.isFinite(w) ? w : 0);
        }
        return x;
    };
    /**
     * Dasselbe Gleichungssystem, nur mit komplexen Zahlen — für Drehstrom.
     *
     * WARUM ÜBERHAUPT KOMPLEX: Drei Quellen um 120° versetzt lassen sich mit
     * reellen Zahlen nicht ehrlich rechnen. Man könnte 400 V zwischen zwei
     * Aussenleitern einfach hinschreiben; dann stimmt die eine Zahl und alles
     * andere nicht mehr — der Neutralleiterstrom bei ungleicher Last wäre die
     * Summe der Strangströme statt ihrer ZEIGERSUMME, und bei drei gleichen
     * Lasten käme der dreifache Strom heraus, wo in Wirklichkeit null fliesst.
     * Genau das ist der Satz, den eine Lernende verstehen muss.
     *
     * WIE ES GEHT, OHNE EINEN ZWEITEN LÖSER: Ein komplexes System
     * (Gr + jGi)·(xr + jxi) = (zr + jzi) ist dasselbe wie ein doppelt so
     * grosses reelles:
     *
     *     [ Gr  −Gi ] [ xr ]   [ zr ]
     *     [ Gi   Gr ] [ xi ] = [ zi ]
     *
     * Damit rechnet weiterhin `loese` — derselbe Gauss mit Spaltenpivot, der
     * sich schon bewährt hat. Ein zweiter Löser daneben würde irgendwann
     * anders rechnen als der erste, und niemand wüsste welcher stimmt.
     */
    const loeseKomplex = (Are, Aim, zre, zim) => {
        const n = zre.length;
        if (!n)
            return { re: [], im: [] };
        const G = [];
        for (let i = 0; i < 2 * n; i++)
            G.push(new Array(2 * n).fill(0));
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                G[i][j] = Are[i][j];
                G[i][j + n] = -Aim[i][j];
                G[i + n][j] = Aim[i][j];
                G[i + n][j + n] = Are[i][j];
            }
        }
        const x = loese(G, zre.concat(zim));
        if (!x)
            return null;
        return { re: x.slice(0, n), im: x.slice(n) };
    };
    /** Grad in Bogenmass — die Phasenlagen stehen in Grad, weil sie so gelehrt werden. */
    const bogen = (grad) => grad * Math.PI / 180;
    const leer = (fehler, warnungen = []) => ({
        ok: false, fehler, spannung: [], spannungWinkel: [], wechsel: false, komplex: false,
        werte: {}, teilwerte: {}, stromNetze: [], netzStrom: [],
        spulen: {}, annahmen: [], warnungen, durchgaenge: 0, leitungNetz: {}, maxStrom: 0,
        verbindungen: [], anschlussfehler: []
    });
    /**
     * Übergangswiderstand eines geschlossenen Kontakts in Ohm.
     * Siehe Kopf der Datei — 1 mΩ ist der gemessene Bereich echter Kontakte und
     * zugleich der Wert, der die Selbsthaltung überhaupt erst rechenbar macht.
     */
    const KONTAKT = 1e-3;
    /**
     * Unterhalb dieser Schwelle ist ein Strom keine Messung mehr, sondern
     * Rechenrauschen — der Leckstrom über GMIN, der jedes Netz bestimmbar
     * macht. Er lag beim ersten Bild als „grösster Strom 4.71e-10 A" im Fuss
     * und behauptete damit, es fliesse etwas, während die Lampe aus war.
     * Ein Nanoampere ist auch für ein gutes Messgerät die untere Grenze.
     */
    const SCHWELLE = 1e-9;
    /** Der Widerstand eines Bauteils — eigener Wert schlägt Vorgabe. */
    const widerstandVon = (t, v) => {
        const eigen = t && t.werte && typeof t.werte.R === 'number' ? t.werte.R : NaN;
        if (Number.isFinite(eigen) && eigen > 0)
            return eigen;
        return (typeof v.wert === 'number' && v.wert > 0) ? v.wert : 1000;
    };
    const spannungVon = (t, v) => {
        const eigen = t && t.werte && typeof t.werte.U === 'number' ? t.werte.U : NaN;
        if (Number.isFinite(eigen))
            return eigen;
        return typeof v.wert === 'number' ? v.wert : 230;
    };
    /** Ein Durchgang: Matrix bauen, lösen, Messwerte ableiten. */
    const einDurchgang = (plan, stellung, netzInfo) => {
        const { netzVon, anzahl } = netzInfo;
        if (!anzahl)
            return leer('Der Plan hat noch keine Bauteile.');
        const netzFuer = (teilId, nr) => {
            const n = netzVon.get(`k:${teilId}:${nr}`);
            return typeof n === 'number' ? n : -1;
        };
        /* Bezugsnetz (Masse) suchen: erst ein Erd-/Masse-Symbol, sonst der
           Minuspol der ersten Quelle. Ohne Bezug ist jede Lösung um eine
           beliebige Konstante verschoben — die Matrix wäre singulär. */
        let masse = -1;
        const teile = (plan.teile || []);
        teile.forEach(t => {
            if (masse >= 0)
                return;
            const v = verhalten(t.zeichen);
            if (v && v.art === 'bezug' && v.von) {
                const n = netzFuer(t.id, v.von);
                if (n >= 0)
                    masse = n;
            }
        });
        if (masse < 0) {
            teile.forEach(t => {
                if (masse >= 0)
                    return;
                const v = verhalten(t.zeichen);
                if (v && v.art === 'quelle' && v.nach) {
                    const n = netzFuer(t.id, v.nach);
                    if (n >= 0)
                        masse = n;
                }
                /* Bei der Drehstromquelle ist es der Sternpunkt — er ist geerdet,
                   und darauf beziehen sich alle drei Strangspannungen. */
                if (v && v.art === 'mehrteilig') {
                    (v.glieder || []).forEach(g => {
                        if (masse >= 0 || g.art !== 'quelle')
                            return;
                        const n = netzFuer(t.id, g.nach);
                        if (n >= 0)
                            masse = n;
                    });
                }
            });
        }
        if (masse < 0)
            return leer('Der Plan hat keine Spannungsquelle. Ohne Quelle fliesst kein Strom.');
        /* Netznummer → Zeile. Das Massenetz bekommt keine, sein Potential ist 0. */
        const zeile = [];
        let n = 0;
        for (let i = 0; i < anzahl; i++)
            zeile.push(i === masse ? -1 : n++);
        const eintraege = [];
        const annahmen = new Set();
        const warnungen = [];
        const kurzschluss = [];
        teile.forEach(t => {
            const v = verhalten(t.zeichen);
            if (!v)
                return;
            if (v.annahme)
                annahmen.add(v.annahme);
            const paar = (von, nach, art, wert, phase = 0) => {
                const a = netzFuer(t.id, von), b = netzFuer(t.id, nach);
                if (a < 0 || b < 0)
                    return;
                if (a === b) {
                    /* Beide Anschlüsse am selben Netz. Bei einer Quelle ist das ein
                       Kurzschluss über sie — der einzige Fall, in dem weiterrechnen
                       schlimmer wäre als abbrechen, weil das Ergebnis ein erfundener
                       Strom von einigen Kiloampere wäre. Bei allem anderen ist es nur
                       eine Schleife, die nichts tut. */
                    if (art === 'U' && wert !== 0)
                        kurzschluss.push(`${t.bmk || t.zeichen}: beide Anschlüsse hängen am selben Netz — die Quelle ist kurzgeschlossen.`);
                    return;
                }
                eintraege.push({ t, v, a, b, art, wert, phase, von, nach });
            };
            switch (v.art) {
                case 'quelle':
                    paar(v.von, v.nach, 'U', spannungVon(t, v), v.phase ?? 0);
                    break;
                /* Ein Symbol, mehrere Elemente: Drehstromquelle, Motorwicklungen.
                   Die Brücken des Klemmenbretts kommen aus der Stellungsliste und
                   laufen durch dieselbe Mechanik wie jeder andere Schalter. */
                case 'mehrteilig': {
                    (v.glieder || []).forEach(g => {
                        if (g.art === 'quelle')
                            paar(g.von, g.nach, 'U', g.wert ?? 230, g.phase ?? 0);
                        else if (g.art === 'widerstand')
                            paar(g.von, g.nach, 'R', g.wert ?? 1000);
                        else
                            paar(g.von, g.nach, 'R', KONTAKT);
                    });
                    const liste = v.stellungen || [];
                    if (liste.length) {
                        const idx = Math.max(0, Math.min(liste.length - 1, stellung[t.id] ?? 0));
                        const st = liste[idx];
                        if (st)
                            st.zu.forEach(([von, nach]) => paar(von, nach, 'R', KONTAKT));
                    }
                    break;
                }
                case 'widerstand':
                case 'spule':
                    paar(v.von, v.nach, 'R', widerstandVon(t, v));
                    break;
                case 'leiter':
                    if (v.von !== v.nach)
                        paar(v.von, v.nach, 'R', KONTAKT);
                    break;
                case 'ampere':
                    paar(v.von, v.nach, 'U', 0);
                    break;
                case 'volt':
                    paar(v.von, v.nach, 'R', 1e7);
                    break;
                case 'diode': {
                    /* Ohne Zeitverlauf lässt sich eine Diode nur schätzen: sie wird als
                       Widerstand in Durchlassrichtung gerechnet und in Sperrrichtung
                       als Unterbrechung. Welche Richtung gilt, entscheidet der
                       vorherige Durchgang — beim ersten wird Durchlass angenommen. */
                    const sperrt = stellung[`d:${t.id}`] === 1;
                    paar(v.von, v.nach, 'R', sperrt ? 1e9 : 1);
                    break;
                }
                case 'schalter': {
                    const liste = v.stellungen || [];
                    const idx = Math.max(0, Math.min(liste.length - 1, stellung[t.id] ?? 0));
                    const s = liste[idx];
                    if (s)
                        s.zu.forEach(([von, nach]) => paar(von, nach, 'R', KONTAKT));
                    break;
                }
                default: break;
            }
        });
        if (kurzschluss.length)
            return leer(kurzschluss[0], kurzschluss);
        /* Spannungsquellen durchnummerieren — jede bekommt eine Unbekannte. */
        let m = 0;
        eintraege.forEach(e => { if (e.art === 'U')
            e.quelleNr = m++; });
        const gr = n + m;
        if (!gr)
            return leer('Es gibt nichts zu rechnen — alle Bauteile hängen am Bezugsnetz.', warnungen);
        const A = [];
        for (let i = 0; i < gr; i++)
            A.push(new Array(gr).fill(0));
        const z = new Array(gr).fill(0);
        /* Der Imaginärteil der Matrix. Er ist heute überall null, weil alle
           Bauteile rein ohmsch gerechnet werden — eine Spule ist eine
           Verbindung, ein Kondensator eine Unterbrechung (siehe Kopf der Datei).
           Die Phasenlage kommt allein aus den QUELLEN, und das ist für ohmsche
           Lasten die vollständige Wahrheit, nicht eine Näherung.
           Er steht trotzdem hier: sobald ein Blindwiderstand dazukommt, wird er
           gefüllt, und der Löser rechnet ohne weitere Änderung richtig weiter.
           (Als Lücke eingetragen — heute fehlt jeder Blindanteil.) */
        const Aim = [];
        for (let i = 0; i < gr; i++)
            Aim.push(new Array(gr).fill(0));
        const zim = new Array(gr).fill(0);
        /* Ein winziger Leitwert von jedem Netz nach Masse — 1 TΩ, also nichts.
           Ohne ihn ist jede Schaltung mit einem freischwebenden Netz unlösbar,
           und freischwebende Netze sind nicht die Ausnahme, sondern der Normalfall:
           bei einer Wechselschaltung führt IMMER eine der beiden Korrespondierenden
           ins Leere. Ein echter Rechner müsste dort „Potential unbestimmt" sagen;
           für den Unterricht ist „liegt auf 0 V" die brauchbarere Antwort, und sie
           ist nicht falsch, sondern nur eine Festlegung. Am Ergebnis einer
           angeschlossenen Schaltung ändert der Wert nichts — er ist zwölf
           Grössenordnungen kleiner als der kleinste Verbraucher.
           (Denselben Weg geht SPICE, und aus demselben Grund.) */
        for (let r = 0; r < n; r++)
            A[r][r] = A[r][r] + 1e-12;
        eintraege.forEach(e => {
            const ra = zeile[e.a], rb = zeile[e.b];
            if (e.art === 'R') {
                const g = 1 / e.wert;
                if (ra >= 0)
                    A[ra][ra] = A[ra][ra] + g;
                if (rb >= 0)
                    A[rb][rb] = A[rb][rb] + g;
                if (ra >= 0 && rb >= 0) {
                    A[ra][rb] = A[ra][rb] - g;
                    A[rb][ra] = A[rb][ra] - g;
                }
            }
            else {
                const q = n + e.quelleNr;
                if (ra >= 0) {
                    A[ra][q] = A[ra][q] + 1;
                    A[q][ra] = A[q][ra] + 1;
                }
                if (rb >= 0) {
                    A[rb][q] = A[rb][q] - 1;
                    A[q][rb] = A[q][rb] - 1;
                }
                /* Die Quelle als Zeiger. Bei Phase 0 ist der Kosinus genau 1 und der
                   Sinus genau 0 — eine einphasige Schaltung rechnet damit Zahl für
                   Zahl so wie vor dem Drehstrom. */
                z[q] = e.wert * Math.cos(bogen(e.phase));
                zim[q] = e.wert * Math.sin(bogen(e.phase));
            }
        });
        /* ZWEI FRAGEN, DIE NICHT DIESELBE SIND.
           -------------------------------------------------------------------
           `komplex` entscheidet den RECHENWEG: nur wenn eine Quelle wirklich
           um einen Winkel versetzt ist, braucht es die doppelt grosse Matrix.
           Eine einphasige Schaltung bleibt reell und liefert Zahl für Zahl
           dieselben Werte wie vor dem Drehstrom.
    
           `wechsel` entscheidet die BEDEUTUNG: ob hier Wechselstrom fliesst.
           Eine 230-V-Quelle ist Wechselstrom, auch wenn sie allein steht und
           rein reell gerechnet wird — ihr Strom kehrt trotzdem hundertmal je
           Sekunde um, und ein fester Richtungspfeil wäre eine Lüge (E540).
           Die beiden gleichzusetzen war genau dieser Fehler. */
        const komplex = eintraege.some(e => e.art === 'U' && (e.phase % 360) !== 0);
        const wechsel = teile.some(t => {
            const v = verhalten(t.zeichen);
            return !!(v && v.wechselstrom);
        });
        let xRe;
        let xIm;
        if (komplex) {
            const k = loeseKomplex(A, Aim, z, zim);
            xRe = k ? k.re : null;
            xIm = k ? k.im : [];
        }
        else {
            xRe = loese(A, z);
            xIm = new Array(gr).fill(0);
        }
        const x = xRe;
        if (!x)
            return leer('Die Schaltung hat keine eindeutige Lösung. Das passiert, wenn zwei ideale ' +
                'Quellen parallel liegen oder zwei Amperemeter denselben Zweig messen — ' +
                'dann ist nicht bestimmt, wie sich der Strom auf sie verteilt.', warnungen);
        const U = (netz) => {
            const r = zeile[netz];
            return (typeof r === 'number' && r >= 0) ? x[r] : 0;
        };
        const Uj = (netz) => {
            const r = zeile[netz];
            return (typeof r === 'number' && r >= 0) ? (xIm[r] ?? 0) : 0;
        };
        /* Winkel in Grad, auf −180…180 gebracht. Eine Phasenlage von 240° ist
           dieselbe wie −120°, und die zweite ist die, die im Heft steht. */
        const winkel = (re, im) => {
            if (Math.abs(re) < 1e-12 && Math.abs(im) < 1e-12)
                return 0;
            return Math.atan2(im, re) * 180 / Math.PI;
        };
        const spannung = [];
        const spannungWinkel = [];
        for (let i = 0; i < anzahl; i++) {
            const re = U(i), im = Uj(i);
            /* Bei Gleichstrom ist der Realteil die Spannung, mit Vorzeichen. Bei
               Wechselstrom ist es der Effektivwert — das, was ein Messgerät
               anzeigt —, und das Vorzeichen wandert in den Winkel. Im rein
               reellen Wechselstromfall sind das 0° oder 180°, und damit steht die
               Richtung auch dort noch im Winkel. */
            spannung.push(wechsel ? Math.hypot(re, im) : re);
            spannungWinkel.push(wechsel ? winkel(re, im) : 0);
        }
        const werte = {};
        /* Die einzelnen Glieder eines mehrteiligen Bauteils.
           -----------------------------------------------------------------
           `werte` hält je Bauteil EINEN Messwert, nämlich den mit dem grössten
           Strom. Bei einem Drehstrommotor ist das nutzlos: dort liegen drei
           Wicklungen und zwei bis drei Brücken unter demselben Symbol, und die
           Brücke mit ihrem Milliohm würde als „Spannung am Motor: 0,004 V"
           durchgehen. Die Strangspannung — die Zahl, um die es im Unterricht
           geht — wäre nirgends ablesbar.
           Deshalb steht hier jedes Glied einzeln, nach seinen Klemmen benannt:
           `U1–U2` ist der erste Strang. */
        const teilwerte = {};
        const netzStrom = new Array(anzahl).fill(0);
        eintraege.forEach(e => {
            const ure = U(e.a) - U(e.b);
            const uim = Uj(e.a) - Uj(e.b);
            const ire = e.art === 'R' ? ure / e.wert : x[n + e.quelleNr];
            const iim = e.art === 'R' ? uim / e.wert : (xIm[n + e.quelleNr] ?? 0);
            const uBetrag = Math.hypot(ure, uim);
            const iBetrag = Math.hypot(ire, iim);
            /* Wirkleistung als Zeigerprodukt: P = Re(U · I*). Bei Gleichstrom ist
               das genau U·I wie bisher; bei Wechselstrom ist es die Leistung, die
               wirklich in Wärme geht, und nicht das Produkt zweier Effektivwerte
               (das wäre die Scheinleistung und bei Blindanteil zu gross). */
            const p = Math.abs(ure * ire + uim * iim);
            const alt = werte[e.t.id];
            const strom = iBetrag;
            const iWinkel = wechsel ? winkel(ire, iim) : 0;
            /* Die Richtung.
               -----------------------------------------------------------------
               Bei Gleichstrom ist sie einfach: das Vorzeichen des Stroms, und es
               kommt ohne Zusatzarbeit aus der Knotenpotentialanalyse.
      
               Bei Wechselstrom wäre genau dieselbe Auskunft eine LÜGE. Der Strom
               kehrt bei 50 Hz hundertmal je Sekunde seine Richtung um — 50 volle
               Perioden, und in jeder geht er zweimal durch null. Ein Pfeil, der
               einfach dasteht, behauptet etwas, das ein Lernender glaubt, weil es
               bei der Batterie stimmt. Deshalb heisst die Richtung hier
               `wechselnd`, und was der Pfeil zeigt, ist die ZÄHLRICHTUNG — eine
               Festlegung, keine Beobachtung.
      
               Für den einen Augenblick, auf den sich alle Winkel beziehen (den
               Scheitel von L1), lässt sich trotzdem sagen, wohin es geht. Das ist
               `richtungJetzt`, und dort ist `quer` ein echter Wert: steht der
               Strom um 90° zur Bezugsphase, fliesst in DIESEM Augenblick nichts —
               gleich danach schon. Bei Drehstrom kommt das an jedem Strang einmal
               je Periode vor, ist also kein Randfall, den man wegrunden darf. */
            let richtung;
            let richtungJetzt;
            let richtungstext;
            const hin = `von ${e.von} nach ${e.nach}`;
            const her = `von ${e.nach} nach ${e.von}`;
            if (strom <= SCHWELLE) {
                richtung = 'keine';
                richtungstext = 'Es fliesst kein Strom.';
            }
            else if (!wechsel) {
                richtung = ire > 0 ? 'vor' : 'rueck';
                richtungstext = `Der Strom fliesst ${ire > 0 ? hin : her}.`;
            }
            else {
                richtung = 'wechselnd';
                const c = Math.cos(bogen(iWinkel));
                richtungJetzt = Math.abs(c) < 0.02 ? 'quer' : (c > 0 ? 'vor' : 'rueck');
                const augenblick = richtungJetzt === 'quer'
                    ? 'steht er gerade still — er ist um 90° versetzt und kehrt eben um'
                    : `fliesst er ${richtungJetzt === 'vor' ? hin : her}`;
                richtungstext =
                    'Wechselstrom bei 50 Hz: der Strom durchläuft 50 volle Perioden je '
                        + 'Sekunde und kehrt dabei hundertmal seine Richtung um. Der Pfeil '
                        + `zeigt die Zählrichtung (${hin}). Im Augenblick des Scheitels von L1 `
                        + `${augenblick}.`;
            }
            const mach = () => ({
                teil: e.t.id, zeichen: e.t.zeichen, bmk: e.t.bmk || '',
                U: wechsel ? uBetrag : ure, I: wechsel ? iBetrag : ire,
                P: p, fliesst: strom > SCHWELLE,
                Ubetrag: uBetrag, Ibetrag: iBetrag,
                Uwinkel: wechsel ? winkel(ure, uim) : 0,
                Iwinkel: iWinkel, Ire: ire, Iim: iim,
                wechsel, vonKlemme: e.von, nachKlemme: e.nach,
                richtung, richtungstext,
                ...(richtungJetzt ? { richtungJetzt } : {})
            });
            /* Ein Bauteil kann mehrere Pfade haben (Hauptschalter, Serienschalter).
               Gezeigt wird der grösste Strom — das ist der, der die Sicherung
               auslöst und nach dem gefragt wird. */
            if (!alt || strom > Math.abs(alt.I)) {
                werte[e.t.id] = mach();
            }
            else if (alt) {
                alt.fliesst = alt.fliesst || strom > SCHWELLE;
            }
            /* Die Teilwerte gab es zuerst nur für mehrteilige Bauteile (das
               Klemmenbrett). Sie werden jetzt für JEDES Bauteil geführt, weil ein
               Schalter genauso mehrere Pole hat — und beim FI ist der Strom durch
               jeden einzelnen Pol die ganze Frage. */
            const fach = teilwerte[e.t.id] || (teilwerte[e.t.id] = {});
            fach[`${e.von}–${e.nach}`] = mach();
            netzStrom[e.a] = Math.max(netzStrom[e.a], strom);
            netzStrom[e.b] = Math.max(netzStrom[e.b], strom);
        });
        /* Helligkeit für Leuchten: das Verhältnis zur Nennleistung, gedeckelt.
           Eine Lampe an halber Spannung leuchtet ein Viertel so hell — das ist
           der quadratische Zusammenhang, und er ist genau das, was man an einer
           Reihenschaltung zeigen will. */
        teile.forEach(t => {
            const w = werte[t.id];
            if (!w)
                return;
            const v = verhalten(t.zeichen);
            if (!v || v.art !== 'widerstand')
                return;
            const rNenn = widerstandVon(t, v);
            const uNenn = (t.werte && typeof t.werte.Un === 'number') ? t.werte.Un : 230;
            const pNenn = (uNenn * uNenn) / rNenn;
            w.helligkeit = pNenn > 0 ? Math.max(0, Math.min(1, w.P / pNenn)) : 0;
        });
        const stromNetze = [];
        netzStrom.forEach((s, i) => { if (s > SCHWELLE)
            stromNetze.push(i); });
        /* Welche Spulen haben angezogen? Die Schwelle ist bewusst grob: eine
           Spule zieht an, wenn mindestens die halbe Nennspannung anliegt. Genauer
           wäre erfunden — der Anzugswert steht auf keinem Symbol. */
        const spulen = {};
        teile.forEach(t => {
            const v = verhalten(t.zeichen);
            if (!v || v.art !== 'spule')
                return;
            const w = werte[t.id];
            const an = !!w && Math.abs(w.U) > 0.5 * 230 * 0.5;
            if (t.bmk)
                spulen[t.bmk] = an;
            spulen[`#${t.id}`] = an;
        });
        let maxStrom = 0;
        for (let i = 0; i < netzStrom.length; i++) {
            if (netzStrom[i] <= SCHWELLE)
                netzStrom[i] = 0;
            else if (netzStrom[i] > maxStrom)
                maxStrom = netzStrom[i];
        }
        return {
            ok: true, fehler: '', spannung, spannungWinkel, wechsel, komplex,
            werte, teilwerte, stromNetze, netzStrom, spulen,
            annahmen: Array.from(annahmen), warnungen, durchgaenge: 1,
            leitungNetz: netzInfo.leitungNetz, maxStrom,
            verbindungen: eintraege
                .filter(e => !(e.art === 'U' && e.wert !== 0))
                .map(e => [e.a, e.b]),
            anschlussfehler: []
        };
    };
    /**
     * Die ganze Rechnung, samt Nachführen der Kontakte.
     *
     * `stellung` ist, was der Mensch eingestellt hat: Teil-Kennung → Nummer der
     * Stellung. Kontakte, die einer Spule folgen, stehen NICHT darin — die
     * setzt die Schleife selbst, und sie überschreibt eine Handstellung dabei
     * bewusst: ein Schützkontakt, den man von Hand zuhält, ist kein Lehrmittel,
     * sondern ein Unfall.
     */
    const rechne = (plan, stellung = {}, vorher) => {
        if (!plan || !Array.isArray(plan.teile))
            return leer('Kein Plan.');
        const netzInfo = netze(plan);
        const teile = plan.teile;
        /* Welcher Kontakt folgt welcher Spule? Über das BMK: K1 an der Spule und
           K1 am Kontakt gehören zusammen. Das ist genau die Regel, die auf dem
           Papier gilt, und deshalb muss sie niemand extra lernen. */
        const folger = teile.filter(t => {
            const v = verhalten(t.zeichen);
            return !!(v && v.folgtSpule);
        });
        /* Die Kontakte starten dort, wo sie beim letzten Mal standen. Ohne das
           gäbe es keine Selbsthaltung: der Startknopf zieht das Schütz an, und
           sobald man loslässt, rechnet die Simulation wieder von der Ruhelage
           aus — der Haltekontakt wäre offen und das Schütz fiele ab. Genau der
           Kreis, den jeder Lernende als Erstes zeichnet, würde nicht gehen.
           `vorher` ist deshalb nicht Bequemlichkeit, sondern das Gedächtnis der
           Schaltung. Wer sie ohne rechnet, bekommt die Ruhelage — das ist der
           Fall „Spannung war weg und ist wiedergekommen", und auch der ist
           richtig, nur eben eine andere Frage. */
        let stand = Object.assign({}, stellung);
        if (vorher)
            folger.forEach(t => {
                if (t.bmk && vorher[t.bmk])
                    stand[t.id] = 1;
            });
        /**
         * Die Fehlerprüfung anhängen — und zwar AUCH, wenn die Rechnung
         * gescheitert ist.
         *
         * Das ist der wichtigste Fall überhaupt. Ein Kurzschluss lässt die
         * Matrix gar nicht erst lösen; die Rechnung bricht mit „die Quelle ist
         * kurzgeschlossen" ab. Wer die Fehlerprüfung erst danach laufen liesse,
         * bekäme genau dort keine Erklärung, wo sie gebraucht wird — nämlich
         * beim Fehler, der wirklich passiert ist.
         */
        const mitFehlern = (e) => {
            e.anschlussfehler = anschlussfehler(plan, netzInfo, e);
            /* Auch in die Warnungen, damit alles, was heute schon Warnungen
               anzeigt, den Fund ohne Änderung mitbekommt. */
            e.anschlussfehler.forEach(f => e.warnungen.push(`${f.was} ${f.warum}`));
            return e;
        };
        let erg = einDurchgang(plan, stand, netzInfo);
        if (!erg.ok)
            return mitFehlern(erg);
        const gesehen = new Set();
        let runde = 1;
        const MAX = 24;
        while (runde < MAX) {
            const naechster = Object.assign({}, stellung);
            folger.forEach(t => {
                const v = verhalten(t.zeichen);
                const an = t.bmk ? !!erg.spulen[t.bmk] : false;
                /* Schliesser: 0 = offen, 1 = geschlossen. Öffner andersherum —
                   die Stellungsliste ist deshalb schon in der richtigen Reihenfolge
                   angelegt, und hier steht nur noch „an" oder „aus". */
                naechster[t.id] = an ? 1 : 0;
                if (v.folgtSpule === 'oeffner')
                    naechster[t.id] = an ? 1 : 0;
            });
            /* Dioden nachführen: sperrt, wenn der Strom rückwärts liefe. */
            teile.forEach(t => {
                const v = verhalten(t.zeichen);
                if (!v || v.art !== 'diode')
                    return;
                const w = erg.werte[t.id];
                naechster[`d:${t.id}`] = (w && w.I < -SCHWELLE) ? 1 : 0;
            });
            const schluessel = JSON.stringify(naechster);
            if (schluessel === JSON.stringify(stand))
                break;
            if (gesehen.has(schluessel)) {
                erg.warnungen.push('Die Steuerung kommt nicht zur Ruhe — ein Kontakt schaltet die Spule ab, die ihn hält. In echt ist das ein Blinker.');
                break;
            }
            gesehen.add(schluessel);
            stand = naechster;
            const neu = einDurchgang(plan, stand, netzInfo);
            if (!neu.ok)
                return mitFehlern(neu);
            neu.warnungen = erg.warnungen.concat(neu.warnungen);
            erg = neu;
            runde++;
        }
        erg.durchgaenge = runde;
        /* Überbrückte Bauteile melden.
           -----------------------------------------------------------------
           Liegen zwei Anschlüsse DESSELBEN Bauteils im selben Netz, ist es
           kurzgeschlossen: der Schalter schaltet nichts, die Lampe leuchtet
           nie, der Widerstand begrenzt nichts.
    
           Das passiert fast immer aus einem Grund, und der ist rein zeichne-
           risch: zwei Leitungen laufen auf derselben Höhe und ÜBERLAPPEN sich.
           Im Bild sieht das aus wie zwei getrennte Leitungen nebeneinander, in
           Wahrheit ist es eine. Diese Prüfung wurde geschrieben, weil genau
           das beim ersten Bildschirmfoto der Wechselschaltung passiert ist —
           drei Leitungen auf y=130, und die Lampe leuchtete aus dem falschen
           Grund. Ohne Hinsehen wäre es niemandem aufgefallen, und ohne diese
           Meldung fällt es der Lernenden auch nicht auf. */
        const gemeldet = new Set();
        teile.forEach(t => {
            const v = verhalten(t.zeichen);
            if (!v)
                return;
            if (t.zeichen === 'verbindungspunkt' || t.zeichen === 'abzweigdose'
                || t.zeichen === 'bp-abzweigdose')
                return; /* die SOLLEN das */
            const eigene = netzInfo.klemmen.filter(k => k.teil === t.id && !k.intern);
            for (let i = 0; i < eigene.length; i++) {
                for (let j = i + 1; j < eigene.length; j++) {
                    const a = eigene[i], b = eigene[j];
                    if (a.nr === b.nr)
                        continue; /* Durchgangsklemmen wie L1–L1 */
                    if (netzInfo.netzVon.get(a.schluessel) !== netzInfo.netzVon.get(b.schluessel))
                        continue;
                    const schluessel = `${t.id}:${a.nr}:${b.nr}`;
                    if (gemeldet.has(schluessel))
                        continue;
                    gemeldet.add(schluessel);
                    erg.warnungen.push(`${t.bmk || t.zeichen}: die Anschlüsse ${a.nr} und ${b.nr} hängen am ` +
                        `selben Netz — das Bauteil ist überbrückt. Meist laufen zwei ` +
                        `Leitungen auf derselben Höhe übereinander.`);
                }
            }
        });
        /* Offene Klemmen melden — nicht als Fehler, aber als Hinweis. Der
           häufigste Anfängerfehler ist eine Leitung, die zwei Pixel neben dem
           Anschluss endet, und der Plan sieht dabei völlig richtig aus. */
        const belegt = new Set();
        (plan.leitungen || []).forEach(() => { });
        netzInfo.klemmen.forEach(k => {
            if (k.intern)
                return; /* ein Sternpunkt gehört an keine Leitung */
            const netz = netzInfo.netzVon.get(k.schluessel);
            if (typeof netz !== 'number')
                return;
            const wieViele = netzInfo.klemmen.filter(o => netzInfo.netzVon.get(o.schluessel) === netz).length;
            if (wieViele <= 1 && !belegt.has(netz)) {
                belegt.add(netz);
                const t = teile.find(x => x.id === k.teil);
                erg.warnungen.push(`${(t && t.bmk) || (t && t.zeichen) || 'Ein Bauteil'}: Anschluss ${k.nr} hängt an keiner Leitung.`);
            }
        });
        return mitFehlern(erg);
    };
    /** Wie ein Leiter im Satz heisst. */
    const leiterName = (l) => l === 'PE' ? 'Schutzleiter' : l === 'N' ? 'Neutralleiter' : `Aussenleiter ${l}`;
    const istAussen = (l) => l === 'L1' || l === 'L2' || l === 'L3';
    /**
     * Welche Leiterrolle hängt an welchem Netz?
     *
     * Die Rolle wird NICHT weitergereicht. Hinter einem Schalter ist der Leiter
     * ein geschalteter Aussenleiter und kein L1 mehr — in der Schweiz heisst er
     * dann korrespondierend oder geschaltet, und ihn weiter L1 zu nennen wäre
     * der Anfang einer Kette falscher Meldungen. Eine Rolle hat nur, wo sie
     * ANGESCHRIEBEN ist: an der Quelle, am Leitersymbol, am Erdungszeichen.
     */
    const leiterrollen = (plan, netzInfo) => {
        const raus = new Map();
        const setze = (teilId, nr, rolle) => {
            const netz = netzInfo.netzVon.get(`k:${teilId}:${nr}`);
            if (typeof netz !== 'number')
                return;
            const fach = raus.get(netz) || new Set();
            fach.add(rolle);
            raus.set(netz, fach);
        };
        (plan.teile || []).forEach(t => {
            const v = verhalten(t.zeichen);
            if (!v)
                return;
            if (v.leiter)
                Object.keys(v.leiter).forEach(nr => setze(t.id, nr, v.leiter[nr]));
        });
        return raus;
    };
    /**
     * Die Prüfung selbst.
     *
     * `stand` ist die Schalterstellung NACH dem Nachführen der Kontakte — ein
     * offener Schliesser unterbricht den Neutralleiter genauso wie ein offener
     * Schalter, und ob er offen ist, weiss man erst nach der Rechnung.
     */
    const anschlussfehler = (plan, netzInfo, erg) => {
        const raus = [];
        const teile = (plan.teile || []);
        const rollen = leiterrollen(plan, netzInfo);
        const nameVon = (t) => t.bmk || t.zeichen;
        /** Wer hängt an diesem Netz? Für die Meldung, damit sie einen Ort hat. */
        const teileAn = (netz) => netzInfo.klemmen
            .filter(k => !k.intern && netzInfo.netzVon.get(k.schluessel) === netz)
            .map(k => k.teil);
        /* ---- 1. Zwei Leiterrollen auf einem Netz --------------------------- */
        rollen.forEach((satz, netz) => {
            if (satz.size < 2)
                return;
            const liste = Array.from(satz).sort();
            const betroffen = teileAn(netz);
            const hatPE = liste.includes('PE');
            const hatN = liste.includes('N');
            const aussen = liste.filter(istAussen);
            const namen = liste.map(leiterName).join(' und ');
            if (aussen.length && hatPE) {
                raus.push({
                    art: 'l-pe', schwere: 'gefahr', teile: betroffen,
                    was: `${namen} liegen am selben Punkt — ein Aussenleiter ist auf den Schutzleiter verdrahtet.`,
                    warum: 'Der Schutzleiter führt dann volle Spannung, und mit ihm jedes '
                        + 'Gehäuse, das daran hängt: Waschmaschine, Herd, Bohrmaschine. '
                        + 'Wer eines davon anfasst, steht unter 230 V. Ein '
                        + 'Fehlerstromschutzschalter löst sofort aus, wenn einer da ist — '
                        + 'ist keiner da, merkt man es erst beim Anfassen.',
                    norm: 'Der Schutzleiter führt nie Betriebsspannung.'
                });
            }
            else if (aussen.length && hatN) {
                raus.push({
                    art: 'l-n', schwere: 'gefahr', teile: betroffen,
                    was: `${namen} liegen am selben Punkt — Aussenleiter und Neutralleiter sind kurzgeschlossen.`,
                    warum: 'Ohne Verbraucher dazwischen begrenzt nur der Leitungswiderstand '
                        + 'den Strom; es fliessen einige hundert bis einige tausend Ampere. '
                        + 'Der Leitungsschutzschalter schaltet in Millisekunden ab. '
                        + 'Es knallt, der Kontakt kann verschweissen, und die Leitung wird '
                        + 'auf ihrer ganzen Länge heiss.'
                });
            }
            else if (aussen.length >= 2) {
                raus.push({
                    art: 'l-l', schwere: 'gefahr', teile: betroffen,
                    was: `${namen} liegen am selben Punkt — zwei Aussenleiter sind zusammengeschaltet.`,
                    warum: 'Zwischen zwei Aussenleitern liegen 400 V, nicht 230 V. Der '
                        + 'Kurzschlussstrom ist entsprechend grösser als bei L gegen N, '
                        + 'und der Lichtbogen beim Abschalten ebenfalls. Sitzen die beiden '
                        + 'auf derselben Klemme eines Verbrauchers, bekommt er statt '
                        + 'Spannung gar keine — die Differenz ist dann null.'
                });
            }
            else if (hatN && hatPE) {
                raus.push({
                    art: 'n-pe', schwere: 'gefahr', teile: betroffen,
                    was: 'Neutralleiter und Schutzleiter liegen am selben Punkt — sie sind vertauscht oder gebrückt.',
                    warum: 'Und jetzt kommt das Gefährliche: es FUNKTIONIERT. Die Lampe '
                        + 'brennt, der Motor läuft, kein Messgerät schlägt aus — am '
                        + 'Sternpunkt sind die beiden ja verbunden. Nur führt der '
                        + 'Schutzleiter jetzt den Betriebsstrom und ist nicht mehr '
                        + 'spannungsfrei. Bricht er irgendwo, stehen alle daran '
                        + 'angeschlossenen Gehäuse unter Spannung. Ein '
                        + 'Fehlerstromschutzschalter sieht die Unsymmetrie und löst aus — '
                        + 'oder er löst dauernd aus, und jemand baut ihn aus.',
                    norm: 'Im TN-S-System werden N und PE ab der Trennstelle nicht wieder verbunden.'
                });
            }
        });
        /* ---- 2. Schutzklasse I ohne Schutzleiter --------------------------- */
        teile.forEach(t => {
            const v = verhalten(t.zeichen);
            if (!v || v.schutzklasse !== 1)
                return;
            const peKlemme = v.schutzklemme;
            if (!peKlemme)
                return;
            const netz = netzInfo.netzVon.get(`k:${t.id}:${peKlemme}`);
            const dran = typeof netz === 'number'
                && (rollen.get(netz)?.has('PE') ?? false);
            if (dran)
                return;
            raus.push({
                art: 'pe-fehlt', schwere: 'gefahr', teile: [t.id],
                was: `${nameVon(t)} ist ein Gerät der Schutzklasse I, aber Klemme ${peKlemme} hängt an keinem Schutzleiter.`,
                warum: 'Schutzklasse I heisst: die Isolation allein genügt nicht, das '
                    + 'Gehäuse ist aus Metall und MUSS geerdet sein. Ohne Schutzleiter '
                    + 'läuft das Gerät völlig normal — bis eine Wicklung durchschlägt. '
                    + 'Dann steht das Gehäuse unter Spannung, es fliesst kein '
                    + 'Fehlerstrom, und keine Schutzeinrichtung schaltet ab. Der '
                    + 'Fehler wird sichtbar, wenn ihn jemand anfasst.',
                norm: 'NIN: Schutzklasse I braucht den Schutzleiter, nicht wahlweise.'
            });
        });
        /* ---- 3. Schalt- oder Schutzgerät im Neutralleiter ------------------ */
        teile.forEach(t => {
            const v = verhalten(t.zeichen);
            if (!v || v.art !== 'schalter')
                return;
            const eigene = netzInfo.klemmen.filter(k => k.teil === t.id && !k.intern);
            let amN = false, amL = false;
            eigene.forEach(k => {
                const netz = netzInfo.netzVon.get(k.schluessel);
                if (typeof netz !== 'number')
                    return;
                const satz = rollen.get(netz);
                if (!satz)
                    return;
                if (satz.has('N'))
                    amN = true;
                if (Array.from(satz).some(istAussen))
                    amL = true;
            });
            /* Ein Hauptschalter, der L UND N gemeinsam trennt, ist erlaubt — genau
               das ist die Ausnahme in der Norm. Verboten ist der Schalter, der NUR
               im Neutralleiter sitzt. */
            if (!amN || amL)
                return;
            raus.push({
                art: 'schalter-in-n', schwere: 'fehler', teile: [t.id],
                was: `${nameVon(t)} sitzt im Neutralleiter statt im Aussenleiter.`,
                warum: 'Ausgeschaltet ist die Lampe dann zwar dunkel, aber der '
                    + 'Aussenleiter liegt weiterhin bis zur Fassung an. Wer die '
                    + 'Birne wechselt und dabei den Sockel berührt, bekommt einen '
                    + 'Schlag — obwohl der Schalter aus ist und alles danach aussieht, '
                    + 'als wäre es spannungsfrei.',
                norm: 'NIN 4.6.1.2.3.2 — Schalter gehören in den Aussenleiter. Der '
                    + 'Neutralleiter darf nur geschaltet werden, wenn der zugehörige '
                    + 'Aussenleiter gleichzeitig mitgeschaltet wird.'
            });
        });
        /* ---- 4. Der Fehlerstrom-Schutzschalter misst wirklich --------------
           Der FI vergleicht, was hinfliesst, mit dem, was zurückkommt. Fehlt
           etwas, geht es einen anderen Weg — über den Schutzleiter oder über
           einen Menschen. Genau diese Summe kann die Rechnung bilden, und
           deshalb ist der FI das einzige Schutzgerät hier, das nicht nur
           gezeichnet, sondern GEMESSEN wird.
    
           Summiert werden ZEIGER und nicht Beträge. Das ist derselbe Punkt wie
           beim Neutralleiter (E539): drei Aussenleiterströme haben zusammen den
           Betrag null, obwohl jeder einzelne gross ist. Wer Beträge addiert,
           bekommt einen Fehlerstrom von mehreren Ampere in einer völlig
           gesunden Drehstromanlage. */
        const FI_SCHWELLE = 0.03; /* 30 mA — der Nennfehlerstrom für Personenschutz */
        teile.forEach(t => {
            const v = verhalten(t.zeichen);
            if (!v || t.zeichen !== 'fi-schutzschalter')
                return;
            const fach = erg.teilwerte[t.id];
            if (!fach)
                return;
            const pole = Object.keys(fach);
            let re = 0, im = 0;
            pole.forEach(k => { const w = fach[k]; re += w.Ire; im += w.Iim; });
            const fehlstrom = Math.hypot(re, im);
            if (fehlstrom <= FI_SCHWELLE)
                return;
            /* ER LÖST AUS. Aber WARUM — das ist die Frage, die es zu beantworten
               gilt, und sie hat zwei ganz verschiedene Antworten.
      
               Führt der Neutralleiter-Pol keinen Strom, während die Aussenleiter
               welchen führen, dann ist der Rückweg gar nicht durch den Schalter
               gelegt. Der „Fehlerstrom" ist dann der volle Betriebsstrom, es gibt
               gar keinen Fehler, und der Schalter fliegt beim Einschalten raus.
               Das ist ein Verdrahtungsfehler und der häufigste beim FI überhaupt
               — ihn als „Fehlerstrom" zu melden wäre richtig und nutzlos. */
            const nPol = fach['N–N2'];
            const aussenFuehrt = pole.some(k => k !== 'N–N2'
                && Math.hypot(fach[k].Ire, fach[k].Iim) > SCHWELLE);
            if (aussenFuehrt && nPol
                && Math.hypot(nPol.Ire, nPol.Iim) <= SCHWELLE) {
                raus.push({
                    art: 'fi-halbe-messung', schwere: 'fehler', teile: [t.id],
                    was: `${nameVon(t)}: der Neutralleiter läuft nicht durch den Schutzschalter.`,
                    warum: 'Ein Fehlerstromschutzschalter vergleicht Hin- und Rückstrom. '
                        + 'Sieht er nur den Aussenleiter, ist die Differenz immer der '
                        + 'ganze Betriebsstrom — er löst beim Einschalten aus, und zwar '
                        + 'ohne dass irgendetwas defekt wäre. Wer dann den Fehler beim '
                        + 'Gerät sucht, sucht am falschen Ort. Beide Leiter müssen durch '
                        + 'ihn hindurch.'
                });
                return;
            }
            raus.push({
                art: 'fi-loest-aus', schwere: 'gefahr', teile: [t.id],
                was: `${nameVon(t)} löst aus: es fehlen ${zeige(fehlstrom, 'A')} — `
                    + `so viel fliesst am Neutralleiter vorbei.`,
                warum: 'Was hinfliesst, kommt nicht zurück. Der Strom nimmt einen '
                    + 'anderen Weg: über den Schutzleiter, über ein feuchtes Gehäuse '
                    + 'oder über einen Menschen. Ab etwa 30 mA wird es für den '
                    + 'Menschen gefährlich, und genau darauf ist der Schalter '
                    + 'eingestellt. Dass er auslöst, ist hier die gute Nachricht — '
                    + 'die schlechte ist, dass es einen Fehlerstrom gibt.'
            });
        });
        /* ---- 5. Der Neutralleiter ist unterbrochen ------------------------- */
        /* Erreichbarkeit OHNE die Quellen: über eine Quelle käme man von jedem
           Punkt zum Neutralleiter, und die Prüfung wäre immer grün. */
        const hatN = Array.from(rollen.values()).some(x => x.has('N'));
        if (hatN && erg.verbindungen.length) {
            const v = verband();
            erg.verbindungen.forEach(([a, b]) => v.eins(`n:${a}`, `n:${b}`));
            const nWurzeln = new Set();
            rollen.forEach((satz, netz) => { if (satz.has('N'))
                nWurzeln.add(v.finde(`n:${netz}`)); });
            teile.forEach(t => {
                const vh = verhalten(t.zeichen);
                if (!vh)
                    return;
                if (vh.art !== 'widerstand' && vh.art !== 'spule')
                    return;
                const eigene = netzInfo.klemmen.filter(k => k.teil === t.id && !k.intern);
                const netze_ = eigene
                    .map(k => netzInfo.netzVon.get(k.schluessel))
                    .filter((x) => typeof x === 'number');
                if (!netze_.length)
                    return;
                /* Nur EINPHASIGE Verbraucher. Ein Drehstrommotor hängt an drei
                   Aussenleitern und braucht gar keinen Neutralleiter; ein Heizkörper
                   zwischen L1 und L2 auch nicht. Die ohne diese Bedingung zu melden
                   wäre die häufigste Falschmeldung überhaupt — und eine
                   Falschmeldung im Unterricht ist schlimmer als keine. */
                const anAussen = netze_.filter(nz => Array.from(rollen.get(nz) || []).some(istAussen));
                if (anAussen.length !== 1)
                    return;
                const zurueck = netze_.filter(nz => !anAussen.includes(nz));
                if (!zurueck.length)
                    return;
                const kommtAn = zurueck.some(nz => nWurzeln.has(v.finde(`n:${nz}`)));
                if (kommtAn)
                    return;
                raus.push({
                    art: 'n-offen', schwere: 'gefahr', teile: [t.id],
                    was: `${nameVon(t)} hängt am Aussenleiter, aber der Rückweg zum Neutralleiter ist offen.`,
                    warum: 'Es fliesst kein Strom, das Gerät bleibt also dunkel oder still — '
                        + 'und sieht damit aus wie ausgeschaltet. Es ist aber nicht '
                        + 'spannungsfrei: die volle Spannung steht bis zur Unterbrechung '
                        + 'an, und der ganze Leiter dahinter liegt über das Gerät am '
                        + 'Aussenleiter. Im Drehstromnetz ist ein unterbrochener '
                        + 'Neutralleiter noch schlimmer: die einphasigen Verbraucher '
                        + 'liegen dann in Reihe zwischen zwei Aussenleitern, und wer wenig '
                        + 'Leistung hat, bekommt weit mehr als seine 230 V.'
                });
            });
        }
        return raus;
    };
    /* ------------------------------------------------------------------------
     * 6. ZAHLEN, DIE MAN LESEN KANN
     * ----------------------------------------------------------------------*/
    /** Eine Grösse mit Vorsatz — 0,0031 A wird zu „3.1 mA". */
    const zeige = (wert, einheit, stellen = 2) => {
        if (!Number.isFinite(wert))
            return '—';
        const b = Math.abs(wert);
        /* Unter der Schwelle ist es eine Null. „4.71e-10 A" ist keine Auskunft,
           sondern eine Behauptung, die der Lernende nicht widerlegen kann. */
        if (b <= SCHWELLE)
            return `0 ${einheit}`;
        const stufen = [
            [1e9, 'G'], [1e6, 'M'], [1e3, 'k'], [1, ''],
            [1e-3, 'm'], [1e-6, 'µ'], [1e-9, 'n']
        ];
        for (const [f, v] of stufen) {
            if (b >= f) {
                const z = wert / f;
                let text = z.toFixed(Math.abs(z) >= 100 ? 0 : stellen);
                /* Nullen NUR hinter dem Komma wegkürzen. Die naheliegende Fassung
                   `.replace(/\.?0+$/, '')` macht aus „230" eine „23" — aus einer Zahl
                   eine ANDERE Zahl, und beide sehen richtig aus. Genau dieser Fehler
                   steht in CLAUDE.md §55.1 als der, den keine Prüfung von selbst
                   findet. Er wurde hier von der eigenen Sonde gefunden, weil sie den
                   erwarteten Text und nicht nur „irgendeine Zahl" verlangt hat. */
                if (text.indexOf('.') >= 0)
                    text = text.replace(/0+$/, '').replace(/\.$/, '');
                return `${text} ${v}${einheit}`;
            }
        }
        return `${wert.toExponential(2)} ${einheit}`;
    };
    return {
        VERHALTEN, verhalten, stellungenVon, netze, rechne, zeige, loese,
        loeseKomplex, leiterrollen,
        /* für Prüfungen sichtbar gemacht */ klemmen, aufStrecke
    };
})();
window.Stromfluss = Stromfluss;
