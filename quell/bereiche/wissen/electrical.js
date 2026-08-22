"use strict";
/* ============================================================================
 * bereiche/wissen/electrical.ts — Ausbildung auf normalen Redion-Bausteinen
 * ----------------------------------------------------------------------------
 * Rechnergebnisse sind Formel-/Textbloecke; Fragen sind normale Flashcards.
 * Das Paketformat ist versioniert und validiert. Es gibt weder ein zweites
 * Ausbildungsmodell noch versteckte normative Entscheidungen (E128).
 * ==========================================================================*/
const Electrical = (() => {
    const rightsActive = () => typeof Konten !== 'undefined' && typeof Konten.darf === 'function';
    const permitted = (action, pageId) => !rightsActive() || (pageId ? Konten.darf(action, pageId) : Konten.darf(action));
    const BASIC_PACKAGE = {
        manifest: {
            id: 'redion.electrical.fundamentals', version: '1.0.0',
            title: 'Elektrotechnik – reine Grundlagenrechnungen', license: 'CC0-1.0',
            source: 'Redion-Lernredaktion; algebraische Definitionen ohne Normregeln'
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
        ]
    };
    const pageForLearning = () => {
        const blocks = Object.values(Store.cache.blocks);
        const roots = blocks.filter(block => block?.alive !== false && block.type === 'page' && block.schoolRoot);
        const existing = blocks.filter(block => block?.alive !== false && block.type === 'page' &&
            block.learningPackagePage === BASIC_PACKAGE.manifest.id);
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
            text: 'Elektrotechnik – Grundlagenkarten', icon: '⚡',
            learningPackagePage: BASIC_PACKAGE.manifest.id
        });
    };
    const validate = (raw) => {
        if (!raw || typeof raw !== 'object' || !raw.manifest || !Array.isArray(raw.questions))
            throw new Error('Manifest oder Fragenliste fehlt.');
        const id = String(raw.manifest.id || '');
        const version = String(raw.manifest.version || '');
        if (!/^[a-z0-9][a-z0-9._-]{2,79}$/i.test(id))
            throw new Error('Ungültige Paket-ID.');
        if (!/^\d+\.\d+\.\d+(?:[-+][a-z0-9.-]+)?$/i.test(version))
            throw new Error('Ungültige Paketversion.');
        if (!String(raw.manifest.license || '').trim())
            throw new Error('Lizenz fehlt.');
        if (raw.questions.length > 5000)
            throw new Error('Das Paket enthält mehr als 5000 Fragen.');
        const ids = new Set();
        const questions = raw.questions.map((entry, index) => {
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
            if (entry.norm && !entry.source.edition)
                throw new Error('Normative Frage ' + qid + ' braucht eine belegte Ausgabe.');
            return {
                id: qid, topic: String(entry.topic || 'Allgemein').slice(0, 120),
                question: String(entry.question || '').trim().slice(0, 4000), options, correct,
                explanation: String(entry.explanation || '').slice(0, 6000),
                difficulty: Math.max(1, Math.min(5, Number(entry.difficulty) || 1)),
                region: String(entry.region || 'unknown').slice(0, 40),
                norm: entry.norm ? String(entry.norm).slice(0, 160) : null,
                source: { title: String(entry.source.title).slice(0, 300),
                    ...(entry.source.edition ? { edition: String(entry.source.edition).slice(0, 120) } : {}),
                    ...(entry.source.license ? { license: String(entry.source.license).slice(0, 80) } : {}) }
            };
        });
        if (questions.some(question => !question.question))
            throw new Error('Eine Frage ist leer.');
        return { manifest: { id, version,
                title: String(raw.manifest.title || id).slice(0, 200),
                license: String(raw.manifest.license).slice(0, 100),
                source: String(raw.manifest.source || '').slice(0, 500) }, questions };
    };
    const installPackage = (raw) => {
        const pack = validate(raw);
        const page = pageForLearning();
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
                    itemId: question.id, license: pack.manifest.license }
            });
            added++;
        });
        App.zeichneBaum();
        App.oeffne(page.id);
        return { added, skipped };
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
                UI.toast(result.added + ' Karten importiert, ' + result.skipped + ' schon vorhanden.');
            }
            catch (error) {
                UI.banner('Lernpaket abgelehnt: ' + (error instanceof Error ? error.message : String(error)), 'fehler');
            }
        });
        input.click();
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
        parallel: { label: 'Widerstände parallel', fields: [['list', 'Widerstände, mit Komma', 'Ω']], run: v => ElectricalCalculations.parallel(v.list) }
    };
    const format = (value) => new Intl.NumberFormat('de-CH', { maximumSignificantDigits: 8 }).format(value);
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
        actions.append(button('calculate', 'Rechnen'), button('insert', 'Ergebnis in Seite'), button('install', 'Grundlagenkarten installieren'), button('import', 'Lernpaket importieren'), button('export', 'Beispielpaket exportieren'));
        dialog.append(header, notice, select, fields, output, actions);
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
            main.textContent = latest.ok ? format(latest.value) + ' ' + latest.unit : latest.error || 'Ungültige Eingabe';
            output.appendChild(main);
            if (latest.ok) {
                const formula = document.createElement('span');
                formula.textContent = latest.formula || '';
                output.appendChild(formula);
                (latest.assumptions || []).forEach(text => { const p = document.createElement('small'); p.textContent = text; output.appendChild(p); });
            }
            return latest;
        };
        select.addEventListener('change', drawFields);
        drawFields();
        close.addEventListener('click', () => overlay.remove());
        overlay.addEventListener('mousedown', event => { if (event.target === overlay)
            overlay.remove(); });
        actions.addEventListener('click', event => {
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
                Store.addBlock(pageId, 'equation', { text: `${result.formula} = ${format(result.value)} ${result.unit}`,
                    electricalCalculation: { fassung: 1, formula: result.formula, value: result.value, unit: result.unit,
                        assumptions: result.assumptions || [], created: Store.now() } });
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
            if (action === 'import')
                importFile();
            if (action === 'export')
                download(BASIC_PACKAGE, 'redion-elektrotechnik-grundlagen-1.0.0.json');
        });
    };
    return { open, installPackage, importFile, BASIC_PACKAGE };
})();
window.Electrical = Electrical;
