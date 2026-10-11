"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/bereiche/wissen/electrical.ts (npm run bauen:ts). */
const Electrical = (() => {
    const PACKAGE_SCHEMA = 'redion.learning-package/v1';
    const BABAT_PACKAGE_ELEMENT = 'redion-learning-package-babat';
    const BABAT_PACKAGE_FILE = 'babat-red-elektrofragen-1.0.0.json';
    const rightsActive = () => typeof Konten !== 'undefined' && typeof Konten.darf === 'function';
    const permitted = (action, pageId) => !rightsActive() || (pageId ? Konten.darf(action, pageId) : Konten.darf(action));
    const BASIC_PACKAGE = {
        schema: PACKAGE_SCHEMA,
        manifest: {
            id: 'redion.electrical.fundamentals', version: '1.0.0',
            title: 'Elektrotechnik – reine Grundlagenrechnungen', license: 'CC0-1.0',
            licenseStatus: 'cleared', provenanceStatus: 'verified', language: 'de-CH',
            source: 'Redion-Lernredaktion; algebraische Definitionen ohne Normregeln',
            region: 'all', created: '2026-08-22'
        },
        questions: [
            { id: 'ohm-current-1', topic: 'Ohmsches Gesetz', question: 'An 12 V liegen 6 Ω. Wie gross ist der Strom?',
                options: ['0,5 A', '2 A', '6 A', '72 A'], correct: 1, explanation: 'I = U / R = 12 V / 6 Ω = 2 A.',
                difficulty: 1, region: 'all', norm: null, source: { title: 'Ohmsches Gesetz, algebraische Definition', license: 'CC0-1.0' } },
            { id: 'ohm-voltage-1', topic: 'Ohmsches Gesetz', question: 'Durch 20 Ω fliessen 0,5 A. Welche Spannung liegt an?',
                options: ['10 V', '20 V', '40 V', '0,025 V'], correct: 0, explanation: 'U = I · R = 0,5 A · 20 Ω = 10 V.',
                difficulty: 1, region: 'all', norm: null, source: { title: 'Ohmsches Gesetz, algebraische Definition', license: 'CC0-1.0' } },
            { id: 'power-ui-1', topic: 'Leistung', question: 'Welche Wirkleistung ergibt 24 V · 3 A bei rein ohmscher Last?',
                options: ['8 W', '27 W', '72 W', '144 W'], correct: 2, explanation: 'P = U · I = 72 W.',
                difficulty: 1, region: 'all', norm: null, source: { title: 'Elektrische Leistung P = U · I für Gleichstrom/rein ohmsche Last', license: 'CC0-1.0' } },
            { id: 'energy-1', topic: 'Energie', question: 'Ein Gerät mit 500 W läuft 4 h. Welche Energie verbraucht es?',
                options: ['0,125 kWh', '2 kWh', '20 kWh', '2000 kWh'], correct: 1, explanation: 'E = 500 W · 4 h / 1000 = 2 kWh.',
                difficulty: 1, region: 'all', norm: null, source: { title: 'Energie-Definition E = P · t', license: 'CC0-1.0' } },
            { id: 'series-1', topic: 'Widerstände', question: 'Wie gross ist 10 Ω + 15 Ω + 5 Ω in Reihenschaltung?',
                options: ['3 Ω', '10 Ω', '20 Ω', '30 Ω'], correct: 3, explanation: 'In Reihe werden die Widerstände addiert: 30 Ω.',
                difficulty: 1, region: 'all', norm: null, source: { title: 'Reihenschaltung idealer Widerstände', license: 'CC0-1.0' } },
            { id: 'parallel-1', topic: 'Widerstände', question: 'Zwei gleiche Widerstände zu je 100 Ω liegen parallel. Wie gross ist Rges?',
                options: ['50 Ω', '100 Ω', '200 Ω', '10000 Ω'], correct: 0, explanation: 'Bei zwei gleichen parallelen Widerständen halbiert sich der Wert: 50 Ω.',
                difficulty: 2, region: 'all', norm: null, source: { title: 'Parallelschaltung idealer Widerstände', license: 'CC0-1.0' } },
            { id: 'cost-1', topic: 'Energie', question: '3 kWh kosten 0,30 Geldeinheiten/kWh. Wie hoch sind die reinen Energiekosten?',
                options: ['0,10', '0,90', '3,30', '9,00'], correct: 1, explanation: '3 · 0,30 = 0,90; Grundgebühren sind nicht enthalten.',
                difficulty: 1, region: 'all', norm: null, source: { title: 'Arithmetisches Kostenbeispiel ohne Tarifbehauptung', license: 'CC0-1.0' } },
            { id: 'unit-1', topic: 'Einheiten', question: 'Welche Einheit gehört zum elektrischen Widerstand?',
                options: ['Ampere', 'Volt', 'Ohm', 'Wattstunde'], correct: 2, explanation: 'Der elektrische Widerstand wird in Ohm (Ω) angegeben.',
                difficulty: 1, region: 'all', norm: null, source: { title: 'SI-Einheiten der Elektrotechnik', edition: 'SI Brochure, 9th edition', license: 'CC0-1.0' } }
        ],
        quarantine: []
    };
    const THREE_PHASE_PACKAGE = {
        schema: PACKAGE_SCHEMA,
        manifest: {
            id: 'redion.electrical.threephase', version: '1.0.0',
            title: 'Drehstrom und die fünf Leiter', license: 'CC0-1.0',
            licenseStatus: 'cleared', provenanceStatus: 'verified', language: 'de-CH',
            source: 'Redion-Lernredaktion. Eigene Formulierungen; die Zahlen sind mit ' +
                'der Simulation dieser App nachgerechnet (test607). Normstellen sind als ' +
                'Fundstelle genannt, nicht im Wortlaut wiedergegeben.',
            region: 'CH', created: '2026-09-12'
        },
        questions: [
            { id: 'netz-strang', topic: 'Das Netz 3 × 400/230 V',
                question: 'Welche Spannung liegt zwischen einem Aussenleiter und dem Neutralleiter?',
                options: ['115 V', '230 V', '400 V', '690 V'], correct: 1,
                explanation: '230 V. Das ist die Strangspannung — die Spannung, an der jede gewöhnliche Steckdose hängt.',
                difficulty: 1, region: 'CH', norm: null,
                source: { title: 'Nachgerechnet mit Stromfluss: Betrag der Strangspannung', license: 'CC0-1.0' } },
            { id: 'netz-aussen', topic: 'Das Netz 3 × 400/230 V',
                question: 'Welche Spannung liegt zwischen zwei Aussenleitern?',
                options: ['230 V', '325 V', '400 V', '460 V'], correct: 2,
                explanation: '400 V. Nicht 460 V — die beiden Spannungen sind um 120° versetzt und addieren sich deshalb nicht einfach.',
                difficulty: 1, region: 'CH', norm: null,
                source: { title: 'Nachgerechnet mit Stromfluss: Betrag der Aussenleiterspannung', license: 'CC0-1.0' } },
            { id: 'netz-winkel', topic: 'Das Netz 3 × 400/230 V',
                question: 'Um welchen Winkel sind die drei Strangspannungen gegeneinander versetzt?',
                options: ['60°', '90°', '120°', '180°'], correct: 2,
                explanation: '120°. Drei gleiche Zeiger im Kreis: 360° geteilt durch drei.',
                difficulty: 1, region: 'CH', norm: null,
                source: { title: 'Definition des symmetrischen Dreiphasensystems', license: 'CC0-1.0' } },
            { id: 'netz-wurzel', topic: 'Das Netz 3 × 400/230 V',
                question: 'Warum ist die Aussenleiterspannung nicht doppelt so gross wie die Strangspannung?',
                options: ['Weil der Neutralleiter einen Teil abführt',
                    'Weil die beiden Spannungen um 120° versetzt sind und zeigerhaft addiert werden',
                    'Weil der Transformator sie begrenzt',
                    'Weil die Leitung einen Spannungsabfall verursacht'], correct: 1,
                explanation: 'Zwei Zeiger mit 120° Versatz ergeben addiert den Faktor Wurzel 3 ≈ 1,73 — also 400 V statt 460 V.',
                difficulty: 2, region: 'CH', norm: null,
                source: { title: 'Zeigeraddition zweier um 120° versetzter Spannungen', license: 'CC0-1.0' } },
            { id: 'stern-strang', topic: 'Stern und Dreieck',
                question: 'Ein Motor ist am 400-V-Netz in Stern geschaltet. Welche Spannung liegt an einem Wicklungsstrang?',
                options: ['133 V', '230 V', '400 V', '690 V'], correct: 1,
                explanation: '230 V. Im Stern liegt jeder Strang zwischen einem Aussenleiter und dem Sternpunkt.',
                difficulty: 2, region: 'CH', norm: null,
                source: { title: 'Nachgerechnet mit Stromfluss: Klemmenbrett in Stern', license: 'CC0-1.0' } },
            { id: 'dreieck-strang', topic: 'Stern und Dreieck',
                question: 'Derselbe Motor am selben Netz, aber in Dreieck gebrückt. Welche Spannung liegt jetzt am Strang?',
                options: ['230 V', '400 V', '692 V', '133 V'], correct: 1,
                explanation: '400 V. Im Dreieck liegt jeder Strang zwischen zwei Aussenleitern.',
                difficulty: 2, region: 'CH', norm: null,
                source: { title: 'Nachgerechnet mit Stromfluss: Klemmenbrett in Dreieck', license: 'CC0-1.0' } },
            { id: 'stern-dreieck-leistung', topic: 'Stern und Dreieck',
                question: 'Wie verhält sich die Leistung desselben Motors in Dreieck zu der in Stern?',
                options: ['gleich gross', 'Wurzel 3 mal so gross', 'dreimal so gross', 'ein Drittel'], correct: 2,
                explanation: 'Dreimal. Die Strangspannung ist Wurzel 3 mal grösser, und die Leistung geht mit dem Quadrat der Spannung — daraus wird der Faktor 3. Genau darauf beruht der Stern-Dreieck-Anlauf.',
                difficulty: 3, region: 'CH', norm: null,
                source: { title: 'Nachgerechnet mit Stromfluss: Strangleistung in beiden Schaltungen', license: 'CC0-1.0' } },
            { id: 'klemmenbrett-stern', topic: 'Stern und Dreieck',
                question: 'Wie werden die Brücken auf dem Klemmenbrett für Sternschaltung gesetzt?',
                options: ['U1 mit V1 mit W1 verbinden',
                    'U2 mit V2 mit W2 verbinden',
                    'U1 mit U2, V1 mit V2, W1 mit W2',
                    'Gar keine Brücken setzen'], correct: 1,
                explanation: 'Die drei Wicklungsenden U2, V2 und W2 werden zusammengeschaltet — sie bilden den Sternpunkt. Die Anfänge U1, V1, W1 gehen an die Aussenleiter.',
                difficulty: 2, region: 'CH', norm: null,
                source: { title: 'Aufbau des Motorenklemmenbretts', license: 'CC0-1.0' } },
            { id: 'n-symmetrisch', topic: 'Der Neutralleiter',
                question: 'Drei gleiche einphasige Verbraucher hängen an L1, L2 und L3. Wie viel Strom fliesst im Neutralleiter?',
                options: ['die Summe der drei Strangströme', 'ein Strangstrom', 'Wurzel 3 mal ein Strangstrom', 'gar keiner'], correct: 3,
                explanation: 'Gar keiner. Die drei Ströme sind um 120° versetzt und heben sich als Zeiger vollständig auf — obwohl in jedem Aussenleiter Strom fliesst.',
                difficulty: 3, region: 'CH', norm: null,
                source: { title: 'Nachgerechnet mit Stromfluss: Amperemeter im Neutralleiter', license: 'CC0-1.0' } },
            { id: 'n-zwei-phasen', topic: 'Der Neutralleiter',
                question: 'Zwei gleiche Verbraucher hängen an L1 und L2, keiner an L3. Wie gross ist der Strom im Neutralleiter?',
                options: ['doppelt so gross wie ein Strangstrom', 'genauso gross wie ein Strangstrom',
                    'halb so gross', 'null'], correct: 1,
                explanation: 'Genauso gross wie EIN Strangstrom, nicht doppelt. Zwei um 120° versetzte Zeiger ergeben addiert wieder genau einen.',
                difficulty: 3, region: 'CH', norm: null,
                source: { title: 'Nachgerechnet mit Stromfluss: Amperemeter im Neutralleiter', license: 'CC0-1.0' } },
            { id: 'n-unterbrochen', topic: 'Der Neutralleiter',
                question: 'Der Neutralleiter einer Verteilung bricht. Was passiert mit den einphasigen Verbrauchern?',
                options: ['Sie laufen unverändert weiter', 'Sie gehen alle aus und sind spannungsfrei',
                    'Sie liegen in Reihe zwischen zwei Aussenleitern; die kleine Last bekommt Überspannung',
                    'Der Leitungsschutzschalter löst sofort aus'], correct: 2,
                explanation: 'Sie liegen dann paarweise in Reihe an 400 V. Die Spannung teilt sich nach dem Widerstand auf — der Verbraucher mit der kleineren Leistung bekommt deutlich mehr als seine 230 V und geht kaputt.',
                difficulty: 3, region: 'CH', norm: null,
                source: { title: 'Spannungsteilung zweier Lasten zwischen zwei Aussenleitern', license: 'CC0-1.0' } },
            { id: 'leiter-fuenf', topic: 'Die fünf Leiter',
                question: 'Welche Leiter führt eine vollständige Drehstrominstallation?',
                options: ['L1, L2, L3', 'L1, L2, L3, N', 'L1, L2, L3, PE', 'L1, L2, L3, N, PE'], correct: 3,
                explanation: 'Drei Aussenleiter, der Neutralleiter und der Schutzleiter.',
                difficulty: 1, region: 'CH', norm: null,
                source: { title: 'Leiter des TN-S-Systems', license: 'CC0-1.0' } },
            { id: 'leiter-pe-strom', topic: 'Die fünf Leiter',
                question: 'Führt der Schutzleiter im ungestörten Betrieb Strom?',
                options: ['Ja, einen Teil des Rückstroms', 'Nein, nur im Fehlerfall',
                    'Nur bei Drehstrom', 'Nur wenn kein Neutralleiter vorhanden ist'], correct: 1,
                explanation: 'Nein. Der Betriebsstrom fliesst über den Neutralleiter zurück. Führt der Schutzleiter Strom, ist etwas falsch angeschlossen oder defekt.',
                difficulty: 1, region: 'CH', norm: null,
                source: { title: 'Aufgabe des Schutzleiters im TN-S-System', license: 'CC0-1.0' } },
            { id: 'leiter-n-pe-verbunden', topic: 'Die fünf Leiter',
                question: 'An welcher Stelle sind Neutralleiter und Schutzleiter miteinander verbunden?',
                options: ['An jeder Steckdose', 'Nirgends', 'Am geerdeten Sternpunkt der Speisung',
                    'In der Abzweigdose'], correct: 2,
                explanation: 'Am geerdeten Sternpunkt, von dem beide ausgehen. Ab dort bleiben sie getrennt — das ist der Sinn des TN-S-Systems.',
                difficulty: 2, region: 'CH', norm: null,
                source: { title: 'Trennstelle von N und PE im TN-S-System', license: 'CC0-1.0' } },
            { id: 'fehler-schalter-lage', topic: 'Falsch angeschlossen',
                question: 'In welchem Leiter muss ein Schalter sitzen?',
                options: ['Im Neutralleiter', 'Im Aussenleiter', 'Im Schutzleiter', 'Das ist gleichgültig'], correct: 1,
                explanation: 'Im Aussenleiter. Der Neutralleiter darf nur mitgeschaltet werden, wenn der zugehörige Aussenleiter gleichzeitig mit getrennt wird (NIN 4.6.1.2.3.2).',
                difficulty: 2, region: 'CH', norm: null,
                source: { title: 'Anforderung an die Lage von Schaltgeräten', license: 'CC0-1.0' } },
            { id: 'fehler-schalter-folge', topic: 'Falsch angeschlossen',
                question: 'Ein Schalter sitzt im Neutralleiter statt im Aussenleiter. Was ist daran gefährlich?',
                options: ['Die Lampe wird zu hell', 'Der Schalter brennt durch',
                    'Ausgeschaltet ist die Lampe dunkel, die Fassung liegt aber weiter am Aussenleiter',
                    'Der Leitungsschutzschalter löst aus'], correct: 2,
                explanation: 'Die Lampe ist dunkel und sieht spannungsfrei aus. Wer die Birne wechselt und den Sockel berührt, bekommt trotzdem einen Schlag.',
                difficulty: 2, region: 'CH', norm: null,
                source: { title: 'Folge eines Schaltgeräts im Neutralleiter', license: 'CC0-1.0' } },
            { id: 'fehler-n-pe', topic: 'Falsch angeschlossen',
                question: 'Neutralleiter und Schutzleiter sind an einem Gerät vertauscht. Was merkt man beim Einschalten?',
                options: ['Nichts — es funktioniert ganz normal', 'Das Gerät läuft nicht an',
                    'Der Leitungsschutzschalter löst sofort aus', 'Das Gerät wird zu heiss'], correct: 0,
                explanation: 'Nichts. Genau das macht den Fehler gefährlich: der Schutzleiter führt jetzt Betriebsstrom und ist nicht mehr spannungsfrei. Bricht er irgendwo, stehen alle daran hängenden Gehäuse unter Spannung.',
                difficulty: 3, region: 'CH', norm: null,
                source: { title: 'Folge einer Vertauschung von N und PE im TN-S-System', license: 'CC0-1.0' } },
            { id: 'fehler-pe-fehlt', topic: 'Falsch angeschlossen',
                question: 'Ein Gerät der Schutzklasse I wird ohne Schutzleiter angeschlossen. Was passiert?',
                options: ['Es läuft gar nicht erst an', 'Es läuft normal, bis ein Isolationsfehler auftritt',
                    'Der Leitungsschutzschalter löst sofort aus', 'Es wird langsamer'], correct: 1,
                explanation: 'Es läuft normal — bis eine Wicklung durchschlägt. Dann steht das Gehäuse unter Spannung, es fliesst kein Fehlerstrom, und nichts schaltet ab. Der Fehler zeigt sich, wenn ihn jemand anfasst.',
                difficulty: 3, region: 'CH', norm: null,
                source: { title: 'Schutzmassnahme bei Geräten der Schutzklasse I', license: 'CC0-1.0' } },
            { id: 'fehler-l-pe', topic: 'Falsch angeschlossen',
                question: 'Ein Aussenleiter ist versehentlich auf den Schutzleiter verdrahtet. Was ist die Folge?',
                options: ['Der Schutzleiter wird nur warm', 'Nichts, solange kein Gerät angeschlossen ist',
                    'Jedes daran hängende Gehäuse steht unter Spannung',
                    'Die Spannung halbiert sich'], correct: 2,
                explanation: 'Der Schutzleiter führt volle Spannung, und mit ihm jedes Gehäuse, das daran hängt. Ein Fehlerstromschutzschalter löst sofort aus — ist keiner da, merkt man es beim Anfassen.',
                difficulty: 2, region: 'CH', norm: null,
                source: { title: 'Folge eines Aussenleiters am Schutzleiter', license: 'CC0-1.0' } },
            { id: 'fehler-l-l', topic: 'Falsch angeschlossen',
                question: 'Zwei Aussenleiter landen auf derselben Klemme eines Verbrauchers. Welche Spannung steht zwischen ihnen?',
                options: ['0 V', '230 V', '400 V', '460 V'], correct: 2,
                explanation: '400 V — der Kurzschlussstrom ist entsprechend grösser als bei L gegen N. Am Verbraucher selbst liegt dagegen nichts an: zwischen zwei Punkten desselben Netzes ist die Differenz null.',
                difficulty: 2, region: 'CH', norm: null,
                source: { title: 'Nachgerechnet mit Stromfluss: Aussenleiterspannung', license: 'CC0-1.0' } },
            { id: 'richtung-wechsel', topic: 'Die Stromrichtung',
                question: 'Wie oft kehrt der Strom bei 50 Hz je Sekunde seine Richtung um?',
                options: ['25-mal', '50-mal', '100-mal', 'Er kehrt nie um'], correct: 2,
                explanation: 'Hundertmal. 50 Hz sind 50 volle Perioden je Sekunde, und in jeder Periode geht der Strom zweimal durch null — einmal beim Wechsel ins Negative, einmal zurück.',
                difficulty: 2, region: 'CH', norm: null,
                source: { title: 'Zwei Nulldurchgänge je Periode bei 50 Hz', license: 'CC0-1.0' } },
            { id: 'richtung-pfeil', topic: 'Die Stromrichtung',
                question: 'Was bedeutet ein Richtungspfeil an einem Bauteil in einem Wechselstromkreis?',
                options: ['Die tatsächliche, gleichbleibende Flussrichtung',
                    'Die Zählrichtung — eine Festlegung, gegen die gerechnet wird',
                    'Die Richtung des Schutzleiterstroms',
                    'Die Drehrichtung des Motors'], correct: 1,
                explanation: 'Die Zählrichtung. Bei Wechselstrom gibt es keine feste Flussrichtung; der Pfeil sagt nur, welche Richtung als positiv gezählt wird.',
                difficulty: 3, region: 'CH', norm: null,
                source: { title: 'Bedeutung der Zählrichtung bei Wechselgrössen', license: 'CC0-1.0' } }
        ],
        quarantine: []
    };
    const pageForLearning = (paketId = BASIC_PACKAGE.manifest.id, titel = 'Elektrotechnik – Grundlagenkarten', symbol = '⚡') => {
        const blocks = Object.values(Store.cache.blocks);
        const roots = blocks.filter(block => block?.alive !== false && block.type === 'page' && block.schoolRoot);
        const existing = blocks.filter(block => block?.alive !== false && block.type === 'page' &&
            block.learningPackagePage === paketId);
        const page = existing.find(block => permitted('bearbeiten', block.id));
        if (page)
            return page;
        if (existing.length)
            throw new Error('Die vorhandene Lernpaket-Seite ist nur lesbar.');
        const root = roots.find(block => permitted('bearbeiten', block.id));
        if (roots.length && !root)
            throw new Error('Der Ausbildungsbereich ist nur lesbar.');
        if (!root && !permitted('bearbeiten'))
            throw new Error('Du darfst keine Lernpaket-Seite anlegen.');
        return Store.addPage(root?.id || null, {
            text: titel, icon: symbol, learningPackagePage: paketId
        });
    };
    const validate = (raw) => {
        if (!raw || typeof raw !== 'object' || !raw.manifest || !Array.isArray(raw.questions))
            throw new Error('Manifest oder Fragenliste fehlt.');
        if (raw.schema !== undefined && raw.schema !== PACKAGE_SCHEMA)
            throw new Error('Unbekanntes Lernpaket-Schema.');
        const id = String(raw.manifest.id || '');
        const version = String(raw.manifest.version || '');
        if (!/^[a-z0-9][a-z0-9._-]{2,79}$/i.test(id))
            throw new Error('Ungültige Paket-ID.');
        if (!/^\d+\.\d+\.\d+(?:[-+][a-z0-9.-]+)?$/i.test(version))
            throw new Error('Ungültige Paketversion.');
        if (!String(raw.manifest.license || '').trim())
            throw new Error('Lizenz fehlt.');
        const licenseStatuses = new Set(['cleared', 'self-declared', 'not-cleared']);
        const provenanceStatuses = new Set(['verified', 'self-declared', 'not-cleared']);
        const licenseStatus = String(raw.manifest.licenseStatus || 'self-declared');
        const provenanceStatus = String(raw.manifest.provenanceStatus || 'self-declared');
        if (!licenseStatuses.has(licenseStatus) || !provenanceStatuses.has(provenanceStatus))
            throw new Error('Lizenz- oder Provenienzstatus ist ungültig.');
        const rawQuarantine = raw.quarantine === undefined ? [] : raw.quarantine;
        if (!Array.isArray(rawQuarantine))
            throw new Error('Quarantäneliste ist ungültig.');
        if (raw.questions.length + rawQuarantine.length > 5000)
            throw new Error('Das Paket enthält mehr als 5000 aktive und quarantänisierte Fragen.');
        const ids = new Set();
        const readQuestion = (entry, index, quarantined) => {
            const qid = String(entry?.id || '');
            if (!/^[a-z0-9][a-z0-9._-]{1,99}$/i.test(qid) || ids.has(qid))
                throw new Error('Frage ' + (index + 1) + ' hat keine eindeutige gültige ID.');
            ids.add(qid);
            const options = Array.isArray(entry.options) ? entry.options.map((v) => String(v).slice(0, 1000)) : [];
            const correct = Number(entry.correct);
            if (options.length < 2 || options.length > 8 || !Number.isInteger(correct) || correct < 0 || correct >= options.length)
                throw new Error('Antworten von Frage ' + qid + ' sind ungültig.');
            if (!entry.source?.title)
                throw new Error('Quelle von Frage ' + qid + ' fehlt.');
            if (!quarantined && entry.quarantine)
                throw new Error('Quarantänisierte Frage ' + qid + ' darf nicht aktiv sein.');
            if (!quarantined && entry.norm && !entry.source.edition)
                throw new Error('Normative Frage ' + qid + ' braucht eine belegte Ausgabe.');
            const reviewStatus = entry.review?.status ? String(entry.review.status) : '';
            if (reviewStatus && reviewStatus !== 'curated-norm-free' && reviewStatus !== 'source-verified')
                throw new Error('Prüfstatus von Frage ' + qid + ' ist ungültig.');
            const region = String(entry.region || 'unknown').slice(0, 40);
            const norm = entry.norm ? String(entry.norm).slice(0, 160) : null;
            if (!quarantined && (licenseStatus === 'not-cleared' || provenanceStatus === 'not-cleared') &&
                (reviewStatus !== 'curated-norm-free' || norm !== null || !['all', 'unknown'].includes(region)))
                throw new Error('Ungeklärte Frage ' + qid +
                    ' muss normfrei kuratiert oder quarantänisiert sein.');
            return {
                id: qid, topic: String(entry.topic || 'Allgemein').slice(0, 120),
                question: String(entry.question || '').trim().slice(0, 4000), options, correct,
                explanation: String(entry.explanation || '').slice(0, 6000),
                difficulty: Math.max(1, Math.min(5, Number(entry.difficulty) || 1)),
                region, norm,
                source: { title: String(entry.source.title).slice(0, 300),
                    ...(entry.source.edition ? { edition: String(entry.source.edition).slice(0, 120) } : {}),
                    ...(entry.source.license ? { license: String(entry.source.license).slice(0, 80) } : {}) },
                ...(reviewStatus ? { review: { status: reviewStatus,
                        ...(entry.review?.note ? { note: String(entry.review.note).slice(0, 1000) } : {}) } } : {})
            };
        };
        const questions = raw.questions
            .map((entry, index) => readQuestion(entry, index, false));
        if (questions.some(question => !question.question))
            throw new Error('Eine Frage ist leer.');
        const quarantine = rawQuarantine.map((entry, index) => {
            if (entry?.quarantine?.status !== 'quarantined' ||
                !Array.isArray(entry.quarantine.reasonCodes) || entry.quarantine.reasonCodes.length === 0)
                throw new Error('Quarantäne-Eintrag ' + (index + 1) + ' hat keinen Sperrgrund.');
            const base = readQuestion(entry, raw.questions.length + index, true);
            const reasonCodes = entry.quarantine.reasonCodes.map((reason) => String(reason).slice(0, 100));
            if (reasonCodes.some((reason) => !/^[a-z0-9][a-z0-9.-]{2,99}$/i.test(reason)))
                throw new Error('Quarantäne-Eintrag ' + base.id + ' hat einen ungültigen Sperrgrund.');
            const rawOccurrences = Array.isArray(entry.quarantine.occurrences) ?
                entry.quarantine.occurrences.slice(0, 100) : [];
            const occurrences = rawOccurrences.map((occurrence) => ({
                file: String(occurrence?.file || '').slice(0, 200),
                line: Math.max(1, Math.floor(Number(occurrence?.line) || 1))
            })).filter((occurrence) => occurrence.file);
            return { ...base, quarantine: { status: 'quarantined', reasonCodes,
                    ...(entry.quarantine.note ? { note: String(entry.quarantine.note).slice(0, 2000) } : {}),
                    ...(occurrences.length ? { occurrences } : {}) } };
        });
        const normPolicy = raw.manifest.normPolicy && typeof raw.manifest.normPolicy === 'object' ? {
            active: String(raw.manifest.normPolicy.active || '').slice(0, 1000),
            quarantine: String(raw.manifest.normPolicy.quarantine || '').slice(0, 1000),
            region: String(raw.manifest.normPolicy.region || '').slice(0, 1000)
        } : null;
        const inventory = raw.manifest.sourceInventory && typeof raw.manifest.sourceInventory === 'object' ? {
            sourceFiles: Array.isArray(raw.manifest.sourceInventory.sourceFiles) ?
                raw.manifest.sourceInventory.sourceFiles.slice(0, 100).map((file) => String(file).slice(0, 200)) : [],
            rawQuestionRecords: Math.max(0, Math.floor(Number(raw.manifest.sourceInventory.rawQuestionRecords) || 0)),
            uniqueQuarantinedQuestions: Math.max(0, Math.floor(Number(raw.manifest.sourceInventory.uniqueQuarantinedQuestions) || 0)),
            activeCuratedQuestions: Math.max(0, Math.floor(Number(raw.manifest.sourceInventory.activeCuratedQuestions) || 0)),
            extractionMethod: String(raw.manifest.sourceInventory.extractionMethod || '').slice(0, 500)
        } : null;
        return { schema: PACKAGE_SCHEMA, manifest: { id, version,
                title: String(raw.manifest.title || id).slice(0, 200),
                language: String(raw.manifest.language || 'und').slice(0, 30),
                license: String(raw.manifest.license).slice(0, 100),
                licenseStatus, provenanceStatus,
                source: String(raw.manifest.source || '').slice(0, 1000),
                region: raw.manifest.region === null || raw.manifest.region === undefined ? null :
                    String(raw.manifest.region).slice(0, 40),
                created: String(raw.manifest.created || '').slice(0, 40),
                ...(normPolicy ? { normPolicy } : {}),
                ...(inventory ? { sourceInventory: inventory } : {})
            }, questions, quarantine };
    };
    const installPackage = (raw, ziel) => {
        const pack = validate(raw);
        const page = ziel
            ? pageForLearning(ziel.paketId, ziel.titel, ziel.symbol)
            : pageForLearning();
        if (!permitted('bearbeiten', page.id))
            throw new Error('Die Lernpaket-Seite ist nur lesbar.');
        const blocks = Store.childrenOf(page.id);
        let added = 0, skipped = 0;
        pack.questions.forEach(question => {
            const key = pack.manifest.id + '@' + pack.manifest.version + ':' + question.id;
            if (blocks.some((block) => block?.alive !== false && block.learningPackage?.key === key)) {
                skipped++;
                return;
            }
            if (!permitted('bearbeiten', page.id))
                throw new Error('Die Bearbeitungsberechtigung wurde während des Imports entzogen.');
            const answer = question.options[question.correct] +
                (question.explanation ? ' — ' + question.explanation : '');
            Store.addBlock(page.id, 'flashcard', {
                text: question.question + ' :: ' + answer,
                quiz: { options: question.options, correct: question.correct,
                    explanation: question.explanation, topic: question.topic,
                    difficulty: question.difficulty, region: question.region, norm: question.norm,
                    source: question.source },
                learningPackage: { key, packageId: pack.manifest.id, version: pack.manifest.version,
                    itemId: question.id, license: pack.manifest.license,
                    licenseStatus: pack.manifest.licenseStatus,
                    provenanceStatus: pack.manifest.provenanceStatus }
            });
            added++;
        });
        App.zeichneBaum();
        App.oeffne(page.id);
        return { added, skipped, quarantined: pack.quarantine.length };
    };
    const download = (value, name) => {
        const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }));
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = name;
        anchor.click();
        setTimeout(() => URL.revokeObjectURL(url), 4000);
    };
    const importFile = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,application/json';
        input.addEventListener('change', async () => {
            const file = input.files?.[0];
            if (!file)
                return;
            if (file.size > 2 * 1024 * 1024) {
                UI.toast('Lernpaket ist grösser als 2 MB.');
                return;
            }
            try {
                const result = installPackage(JSON.parse(await file.text()));
                UI.toast(result.added + ' Karten importiert, ' + result.skipped + ' schon vorhanden' +
                    (result.quarantined ? ', ' + result.quarantined + ' sicher in Quarantäne.' : '.'));
            }
            catch (error) {
                UI.banner('Lernpaket abgelehnt: ' + (error instanceof Error ? error.message : String(error)), 'fehler');
            }
        });
        input.click();
    };
    const bundledPackage = async () => {
        const element = document.getElementById(BABAT_PACKAGE_ELEMENT);
        const embedded = element?.textContent?.trim() || '';
        if (embedded)
            return validate(JSON.parse(embedded));
        const source = element?.dataset.src;
        if (!source)
            throw new Error('Das mitgelieferte BABAT-RED-Paket ist nicht verknüpft.');
        try {
            const response = await fetch(source);
            if (!response.ok)
                throw new Error('HTTP ' + response.status);
            return validate(JSON.parse(await response.text()));
        }
        catch (error) {
            throw new Error('Paket konnte offline nicht geladen werden. Wähle die Datei „' +
                BABAT_PACKAGE_FILE + '“ über „Lernpaket importieren“. (' +
                (error instanceof Error ? error.message : String(error)) + ')');
        }
    };
    const MODES = {
        voltage: { label: 'Spannung U = I · R', fields: [['i', 'Strom', 'A'], ['r', 'Widerstand', 'Ω']], run: v => ElectricalCalculations.voltage(v.i, v.r) },
        current: { label: 'Strom I = U / R', fields: [['u', 'Spannung', 'V'], ['r', 'Widerstand', 'Ω']], run: v => ElectricalCalculations.current(v.u, v.r) },
        resistance: { label: 'Widerstand R = U / I', fields: [['u', 'Spannung', 'V'], ['i', 'Strom', 'A']], run: v => ElectricalCalculations.resistance(v.u, v.i) },
        power: { label: 'Leistung P = U · I', fields: [['u', 'Spannung', 'V'], ['i', 'Strom', 'A']], run: v => ElectricalCalculations.power(v.u, v.i) },
        powerI: { label: 'Leistung P = I² · R', fields: [['i', 'Strom', 'A'], ['r', 'Widerstand', 'Ω']], run: v => ElectricalCalculations.powerFromCurrent(v.i, v.r) },
        energy: { label: 'Energie E = P · t', fields: [['p', 'Leistung', 'W'], ['h', 'Zeit', 'h']], run: v => ElectricalCalculations.energy(v.p, v.h) },
        cost: { label: 'Energiekosten', fields: [['e', 'Energie', 'kWh'], ['price', 'Preis je kWh', 'Geldeinheit']], run: v => ElectricalCalculations.cost(v.e, v.price) },
        series: { label: 'Widerstände in Reihe', fields: [['list', 'Widerstände, mit Komma', 'Ω']], run: v => ElectricalCalculations.series(v.list) },
        parallel: { label: 'Widerstände parallel', fields: [['list', 'Widerstände, mit Komma', 'Ω']], run: v => ElectricalCalculations.parallel(v.list) },
        drop: {
            label: 'Spannungsfall einer Leitung',
            fields: [['p', 'Leistung', 'W'], ['u', 'Spannung', 'V'], ['cos', 'cos φ', ''],
                ['l', 'Leitungslänge', 'm'], ['a', 'Querschnitt', 'mm²']],
            run: v => {
                const zahl = (t, name) => {
                    const n = Number(String(t).replace(',', '.'));
                    return Number.isFinite(n) && n > 0 ? n : (fehlt.push(name), null);
                };
                const fehlt = [];
                const p2 = zahl(v.p ?? '', 'Leistung'), u = zahl(v.u ?? '', 'Spannung');
                const l = zahl(v.l ?? '', 'Leitungslänge'), a = zahl(v.a ?? '', 'Querschnitt');
                const cosRoh = String(v.cos ?? '').trim();
                const cos = cosRoh === '' ? 1 : Number(cosRoh.replace(',', '.'));
                if (fehlt.length)
                    return { ok: false, error: 'Es fehlt: ' + fehlt.join(', ') + '.' };
                if (!Number.isFinite(cos) || cos <= 0 || cos > 1)
                    return { ok: false, error: 'cos φ liegt zwischen 0 und 1 — leer lassen heisst 1.' };
                try {
                    const weg = Rechenweg.spannungsfall({
                        leistungW: p2, spannungV: u, cosPhi: cos,
                        laengeM: l, querschnittMm2: a
                    });
                    const urteil = Rechenweg.urteil(weg, 3);
                    return { ok: true, value: weg.ergebnis.wert, unit: '%',
                        formula: 'ΔU% = ΔU / U · 100', assumptions: weg.annahmen,
                        warnings: urteil.haelt ? [] : [urteil.satz], weg };
                }
                catch (fehler) {
                    return { ok: false, error: fehler instanceof Error ? fehler.message : String(fehler) };
                }
            }
        }
    };
    const format = (value) => new Intl.NumberFormat('de-CH', { maximumSignificantDigits: 8 }).format(value);
    const kopfZahl = (r) => r.weg ? Rechenweg.zahl(r.value) : format(r.value);
    const open = (targetPage) => {
        const overlay = document.createElement('div');
        overlay.className = 'overlay';
        const dialog = document.createElement('div');
        dialog.className = 'finder electrical-dialog';
        const header = document.createElement('div');
        header.className = 'fh';
        header.textContent = '⚡ Elektrotechnik – Rechner & Lernpaket';
        const close = document.createElement('button');
        close.className = 'icon-btn';
        close.textContent = '✕';
        header.appendChild(close);
        const notice = document.createElement('div');
        notice.className = 'callout';
        notice.textContent = 'Nur normfreie Mathematik. Ergebnisse ersetzen keine Planung, Messung oder Sicherheits-/Normprüfung.';
        const select = document.createElement('select');
        select.className = 'electrical-mode';
        Object.entries(MODES).forEach(([id, mode]) => {
            const option = document.createElement('option');
            option.value = id;
            option.textContent = mode.label;
            select.appendChild(option);
        });
        const fields = document.createElement('div');
        fields.className = 'electrical-fields';
        const output = document.createElement('div');
        output.className = 'electrical-output';
        const actions = document.createElement('div');
        actions.className = 'electrical-actions';
        const button = (action, label) => {
            const b = document.createElement('button');
            b.type = 'button';
            b.dataset.action = action;
            b.textContent = label;
            return b;
        };
        const haupt = button('calculate', 'Rechnen');
        haupt.className = 'is-primary';
        actions.append(haupt, button('insert', 'Ergebnis in Seite'));
        const pakete = document.createElement('div');
        pakete.className = 'electrical-pakete';
        const pKopf = document.createElement('h4');
        pKopf.textContent = 'Lernpakete';
        const pReihe = document.createElement('div');
        pReihe.className = 'electrical-actions';
        pReihe.append(button('install', 'Grundlagenkarten installieren'), button('install-drehstrom', 'Drehstromkarten installieren'), button('import', 'Lernpaket importieren'), button('export', 'Beispielpaket exportieren'), button('babat-install', 'BABAT-Paket installieren'), button('babat-export', 'BABAT-Paket exportieren'));
        pakete.append(pKopf, pReihe);
        const bauch = document.createElement('div');
        bauch.className = 'electrical-bauch';
        bauch.append(notice, select, fields, output, pakete);
        dialog.append(header, bauch, actions);
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
        let latest = null;
        const drawFields = () => {
            fields.replaceChildren();
            output.textContent = '';
            latest = null;
            MODES[select.value].fields.forEach(([id, label, unit]) => {
                const row = document.createElement('label');
                row.className = 'electrical-field';
                const title = document.createElement('span');
                title.textContent = label;
                const input = document.createElement('input');
                input.dataset.field = id;
                input.type = id === 'list' ? 'text' : 'number';
                input.inputMode = 'decimal';
                input.placeholder = unit;
                const suffix = document.createElement('em');
                suffix.textContent = unit;
                row.append(title, input, suffix);
                fields.appendChild(row);
            });
        };
        const calculate = () => {
            const values = {};
            fields.querySelectorAll('input[data-field]').forEach(input => values[input.dataset.field || ''] = input.value);
            latest = MODES[select.value].run(values);
            output.replaceChildren();
            const main = document.createElement('strong');
            main.textContent = latest.ok ? kopfZahl(latest) + ' ' + latest.unit : latest.error || 'Ungültige Eingabe';
            output.appendChild(main);
            if (latest.ok) {
                const formula = document.createElement('span');
                formula.textContent = latest.formula || '';
                output.appendChild(formula);
                const weg = latest.weg;
                if (weg && Array.isArray(weg.schritte)) {
                    const liste = document.createElement('ol');
                    liste.className = 'el-weg';
                    const zeile = (s2, nr) => {
                        const li = document.createElement('li');
                        const kopf = document.createElement('b');
                        kopf.textContent = s2.titel + (s2.hinweis ? ' — ' + s2.hinweis : '');
                        const f = document.createElement('code');
                        f.textContent = s2.formel;
                        const e = document.createElement('span');
                        e.textContent = '= ' + s2.eingesetzt + '  =  ' +
                            Rechenweg.zahl(s2.wert) + ' ' + s2.einheit;
                        li.append(kopf, f, e);
                        if (nr)
                            li.dataset['nr'] = nr;
                        return li;
                    };
                    weg.schritte.forEach((s2, i) => liste.appendChild(zeile(s2, String(i + 1))));
                    if (weg.gegenprobe) {
                        const li = zeile(weg.gegenprobe, '');
                        li.className = 'el-probe';
                        liste.appendChild(li);
                    }
                    output.appendChild(liste);
                }
                (latest.warnings || []).forEach(text => {
                    const w = document.createElement('strong');
                    w.className = 'el-warnung';
                    w.textContent = text;
                    output.appendChild(w);
                });
                (latest.assumptions || []).forEach(text => { const p = document.createElement('small'); p.textContent = text; output.appendChild(p); });
            }
            return latest;
        };
        select.addEventListener('change', drawFields);
        drawFields();
        close.addEventListener('click', () => overlay.remove());
        overlay.addEventListener('mousedown', event => { if (event.target === overlay)
            overlay.remove(); });
        dialog.addEventListener('click', async (event) => {
            const action = (event.target instanceof Element ? event.target.closest('[data-action]') : null)?.dataset.action;
            if (action === 'calculate')
                calculate();
            if (action === 'insert') {
                const result = latest?.ok ? latest : calculate();
                if (!result.ok)
                    return;
                const pageId = targetPage?.id || App.aktuelleSeite();
                if (!pageId) {
                    UI.toast('Öffne zuerst eine Seite.');
                    return;
                }
                if (!permitted('bearbeiten', pageId)) {
                    UI.toast('Du darfst auf dieser Seite kein Ergebnis einfügen.');
                    return;
                }
                Store.addBlock(pageId, 'equation', { text: `${result.formula} = ${kopfZahl(result)} ${result.unit}`,
                    electricalCalculation: { fassung: 1, formula: result.formula, value: result.value, unit: result.unit,
                        assumptions: result.assumptions || [], created: Store.now() } });
                const wegD = result.weg;
                if (wegD && Array.isArray(wegD.schritte)) {
                    wegD.schritte.forEach((s2, i) => {
                        Store.addBlock(pageId, 'text', { text: '**' + (i + 1) + '. ' + s2.titel +
                                (s2.hinweis ? '** — ' + s2.hinweis : '**') });
                        Store.addBlock(pageId, 'equation', { text: s2.formel + '  =  ' + s2.eingesetzt +
                                '  =  ' + Rechenweg.zahl(s2.wert) + ' ' + s2.einheit });
                    });
                    if (wegD.gegenprobe) {
                        const g = wegD.gegenprobe;
                        Store.addBlock(pageId, 'text', { text: '**' + g.titel + '**' });
                        Store.addBlock(pageId, 'equation', { text: g.formel + '  =  ' + g.eingesetzt +
                                '  =  ' + Rechenweg.zahl(g.wert) + ' ' + g.einheit });
                    }
                }
                if ((result.assumptions || []).length)
                    Store.addBlock(pageId, 'callout', {
                        icon: '⚠', text: 'Annahme: ' + (result.assumptions || []).join(' ')
                    });
                overlay.remove();
                App.zeichneSeite();
            }
            if (action === 'install') {
                try {
                    const r = installPackage(BASIC_PACKAGE);
                    UI.toast(r.added + ' Karten installiert, ' + r.skipped + ' schon vorhanden.');
                    overlay.remove();
                }
                catch (error) {
                    UI.banner(error instanceof Error ? error.message : String(error), 'fehler');
                }
            }
            if (action === 'install-drehstrom') {
                try {
                    const r = installPackage(THREE_PHASE_PACKAGE, {
                        paketId: THREE_PHASE_PACKAGE.manifest.id,
                        titel: 'Drehstrom und die fünf Leiter', symbol: '⚡'
                    });
                    UI.toast(r.added + ' Drehstromkarten installiert, ' + r.skipped + ' schon vorhanden.');
                    overlay.remove();
                }
                catch (error) {
                    UI.banner(error instanceof Error ? error.message : String(error), 'fehler');
                }
            }
            if (action === 'import')
                importFile();
            if (action === 'export')
                download(BASIC_PACKAGE, 'redion-elektrotechnik-grundlagen-1.0.0.json');
            if (action === 'babat-install') {
                try {
                    const result = installPackage(await bundledPackage());
                    UI.toast(result.added + ' kuratierte Karten installiert, ' + result.skipped +
                        ' schon vorhanden; ' + result.quarantined + ' Rohfragen bleiben in Quarantäne.');
                    overlay.remove();
                }
                catch (error) {
                    UI.banner('BABAT-RED-Paket abgelehnt: ' +
                        (error instanceof Error ? error.message : String(error)), 'fehler');
                }
            }
            if (action === 'babat-export') {
                try {
                    download(await bundledPackage(), BABAT_PACKAGE_FILE);
                    UI.toast('Geprüftes Paketartefakt exportiert. Quarantäne bleibt enthalten.');
                }
                catch (error) {
                    UI.banner(error instanceof Error ? error.message : String(error), 'fehler');
                }
            }
        });
    };
    return { open, installPackage, validatePackage: validate, importFile,
        loadBundledPackage: bundledPackage, BASIC_PACKAGE, THREE_PHASE_PACKAGE,
        BABAT_PACKAGE_FILE };
})();
window.Electrical = Electrical;
