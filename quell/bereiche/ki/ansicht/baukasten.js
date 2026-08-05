"use strict";
/* ============================================================================
 * kibau.js — Die KI baut, der Mensch entscheidet
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/bereiche/ki/ansicht/baukasten.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/bereiche/ki/ansicht/baukasten.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
 * Drei Dinge, die Notions KI nicht tut:
 *
 *   1. FORMEL SCHREIBEN — man sagt in einem Satz, was gerechnet werden soll.
 *      Die KI bekommt die Spaltennamen und die Liste aller Funktionen, die
 *      es hier wirklich gibt. Ihre Antwort wird nicht einfach übernommen,
 *      sondern zuerst an einer echten Zeile durchgerechnet. Erst wenn das
 *      Ergebnis stimmt, sieht man den Vergleich alt/neu und kann übernehmen.
 *
 *   2. AUTOMATION BAUEN — dasselbe für „wenn … dann …". Die Antwort muss
 *      zu den Auslösern und Aktionen passen, die es hier gibt; alles andere
 *      wird abgelehnt, statt still etwas Falsches anzulegen.
 *
 *   3. FILTER BAUEN — aus einem Satz werden Filterregeln, gegen die
 *      Bedingungen des jeweiligen Spaltentyps geprüft.
 *
 * Der gemeinsame Kern ist der Vorschlagsdialog: Vergleich, Probe, Übernehmen
 * oder Verwerfen. Nichts wird ohne diesen Schritt geschrieben.
 * ==========================================================================*/
const KiBau = (() => {
    /* Das angeklickte Element — oder nichts. `e.target` ist `EventTarget | null`
       und muss ein `Element` sein, bevor `closest` daran etwas findet. Vorher
       stand hier ungeprüft `e.target.closest(…)`: bei einem Klick, dessen Ziel
       kein Element ist, warf das mitten im Behandeln. */
    const elVon = (e) => e.target instanceof Element ? e.target : null;
    const esc = (s) => String(s ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    /* ========================================================================
     * ANTWORT AUSPACKEN
     * ------------------------------------------------------------------------
     * Modelle setzen gern ```-Zäune und einen Satz davor. Beides muss weg,
     * bevor irgendetwas geprüft werden kann.
     * ======================================================================*/
    const ohneZaun = (t) => {
        let s = String(t || '').trim();
        const z = s.match(/```(?:[a-z]*)\n?([\s\S]*?)```/i);
        if (z?.[1] !== undefined)
            s = z[1];
        return s.trim();
    };
    const jsonAus = (t) => {
        const s = ohneZaun(t);
        try {
            return JSON.parse(s);
        }
        catch { }
        /* Notfalls das erste vollständige { … } oder [ … ] herausschneiden */
        const start = s.search(/[{[]/);
        if (start < 0)
            return null;
        const auf = s[start], zu = auf === '{' ? '}' : ']';
        let tiefe = 0, inText = false, flucht = false;
        for (let i = start; i < s.length; i++) {
            const c = s[i];
            if (flucht) {
                flucht = false;
                continue;
            }
            if (c === '\\') {
                flucht = true;
                continue;
            }
            if (c === '"') {
                inText = !inText;
                continue;
            }
            if (inText)
                continue;
            if (c === auf)
                tiefe++;
            else if (c === zu) {
                tiefe--;
                if (!tiefe) {
                    try {
                        return JSON.parse(s.slice(start, i + 1));
                    }
                    catch {
                        return null;
                    }
                }
            }
        }
        return null;
    };
    /* ========================================================================
     * DER VORSCHLAGSDIALOG
     * ------------------------------------------------------------------------
     * alt / neu als Text, Zeile für Zeile verglichen. Dazu eine Probe: was
     * käme heraus? Erst „Übernehmen" schreibt.
     * ======================================================================*/
    const zeilenDiff = (alt, neu) => {
        const a = String(alt || '').split('\n');
        const b = String(neu || '').split('\n');
        /* Kleinster gemeinsamer Nenner: längste gemeinsame Teilfolge */
        const n = a.length, m = b.length;
        const t = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
        /* Lesen und Schreiben laufen über diese zwei Helfer: eine Zeile der
           Tabelle kann es laut Typ nicht geben, obwohl die Schleifen nur
           gültige Felder ansteuern. */
        const tab = (i, j) => t[i]?.[j] ?? 0;
        const setzeTab = (i, j, w) => { const z = t[i]; if (z)
            z[j] = w; };
        for (let i = n - 1; i >= 0; i--)
            for (let j = m - 1; j >= 0; j--)
                setzeTab(i, j, a[i] === b[j] ? tab(i + 1, j + 1) + 1 : Math.max(tab(i + 1, j), tab(i, j + 1)));
        const raus = [];
        let i = 0, j = 0;
        while (i < n && j < m) {
            if (a[i] === b[j]) {
                raus.push(['gleich', a[i]]);
                i++;
                j++;
            }
            else if (tab(i + 1, j) >= tab(i, j + 1)) {
                raus.push(['weg', a[i]]);
                i++;
            }
            else {
                raus.push(['neu', b[j]]);
                j++;
            }
        }
        while (i < n)
            raus.push(['weg', a[i++]]);
        while (j < m)
            raus.push(['neu', b[j++]]);
        return raus;
    };
    const diffHtml = (alt, neu) => '<div class="kb-diff">' + zeilenDiff(alt, neu).map(([art, zeile]) => `<div class="kb-z kb-${art}">` +
        `<span class="kb-zeichen">${art === 'weg' ? '−' : art === 'neu' ? '+' : ' '}</span>` +
        `<code>${esc(zeile) || '&nbsp;'}</code></div>`).join('') + '</div>';
    /**
     * @param titel      Überschrift des Fensters
     * @param alt        bisheriger Text (leer bei etwas Neuem)
     * @param neu        Vorschlag der KI
     * @param probe      HTML mit dem Ergebnis der Probe — oder eine Fehlermeldung
     * @param inOrdnung  false = nur ansehen, Übernehmen bleibt gesperrt
     * @param uebernehmen Rückruf beim Übernehmen
     * @param nochmal    Rückruf für „Neuen Versuch" (optional)
     */
    const vorschlag = ({ titel, alt, neu, probe, inOrdnung, uebernehmen, nochmal, erklaerung }) => {
        const o = document.createElement('div');
        o.className = 'overlay';
        o.innerHTML =
            '<div class="finder" style="width:min(720px,95vw)">' +
                `<div class="fh">✨ ${esc(titel)}<button class="icon-btn" data-a="zu">✕</button></div>` +
                '<div class="kb-koerper">' +
                (erklaerung ? `<div class="kb-erklaerung">${esc(erklaerung)}</div>` : '') +
                (alt ? '<div class="kb-titel">Vergleich — was sich ändert</div>' + diffHtml(alt, neu)
                    : '<div class="kb-titel">Vorschlag</div>' + diffHtml('', neu)) +
                '<div class="kb-titel">Probe</div>' +
                `<div class="kb-probe ${inOrdnung ? 'gut' : 'schlecht'}">${probe}</div>` +
                '</div>' +
                '<div class="fbtns">' +
                (nochmal ? '<button data-a="nochmal">Neuer Versuch</button>' : '') +
                '<button data-a="zu">Verwerfen</button>' +
                `<button data-a="ok" class="prim"${inOrdnung ? '' : ' disabled'}>Übernehmen</button>` +
                '</div>' +
                '</div>';
        document.body.appendChild(o);
        o.addEventListener('click', e => {
            if (e.target === o || elVon(e)?.closest('[data-a="zu"]')) {
                o.remove();
                return;
            }
            if (elVon(e)?.closest('[data-a="nochmal"]')) {
                o.remove();
                nochmal();
                return;
            }
            if (elVon(e)?.closest('[data-a="ok"]') && inOrdnung) {
                o.remove();
                uebernehmen();
            }
        });
        return o;
    };
    /* ========================================================================
     * GEMEINSAMES: gibt es überhaupt eine KI?
     * ======================================================================*/
    const kiDa = () => {
        if (typeof KI === 'undefined' || !KI.frageKurz)
            return false;
        return !!(KI.zustand && KI.zustand.bereit);
    };
    const warten = (text) => {
        const o = document.createElement('div');
        o.className = 'overlay';
        o.innerHTML = `<div class="finder" style="width:min(420px,92vw)">
      <div class="kb-warte"><span class="kb-punkt"></span>${esc(text)}</div></div>`;
        document.body.appendChild(o);
        return o;
    };
    /* ========================================================================
     * 1 · FORMEL SCHREIBEN LASSEN
     * ======================================================================*/
    const FORMEL_SYSTEM = () => 'Du schreibst Formeln für Redion. Die Sprache ähnelt Notion 2.0.\n' +
        'Antworte NUR mit der Formel — kein Text davor, kein Text danach, keine ```-Zäune.\n' +
        'Auf Spalten greifst du mit prop("Spaltenname") zu.\n' +
        'Diese Funktionen gibt es (nur diese, keine anderen):\n' +
        (typeof Formula !== 'undefined' && Formula.F
            ? Object.keys(Formula.F).sort().join(', ')
            : 'if, ifs, and, or, not, empty, length, substring, contains, replace, format') +
        '\nDazu die Sonderformen: prop, let, lets, map, filter, find, findIndex, some, every, ' +
        'reduce, sortBy, groupBy, rowNumber, runningSum, rank, previous, next, total, average.';
    /** Eine echte Zeile zum Probieren — sonst eine erfundene. */
    const probeZeile = (coll) => {
        const zeilen = Store.rowsOf(coll.id).filter((r) => !r.archiviert);
        return zeilen[0] || null;
    };
    const formelSchreiben = async (coll, key, aktuell, uebernehmen) => {
        if (!kiDa()) {
            UI.toast('Dafür muss oben rechts eine KI eingerichtet sein');
            return;
        }
        const auftrag = await UI.frage('Was soll gerechnet werden? In einem Satz.', aktuell ? '' : 'Tage bis zum Fälligkeitsdatum');
        if (!auftrag)
            return;
        await formelLauf(coll, key, aktuell, auftrag, uebernehmen);
    };
    const formelLauf = async (coll, key, aktuell, auftrag, uebernehmen) => {
        const w = warten('Die KI schreibt die Formel …');
        let antwort = '';
        try {
            const spalten = Object.keys(coll.schema)
                .map(k => `- "${coll.schema[k].name}" (${coll.schema[k].type})`).join('\n');
            antwort = await KI.frageKurz(`Datenbank „${coll.name}" mit diesen Spalten:\n${spalten}\n\n` +
                (aktuell ? `Bisherige Formel:\n${aktuell}\n\n` : '') +
                `Auftrag: ${auftrag}\n\nSchreibe die Formel.`, FORMEL_SYSTEM());
        }
        catch (e) {
            w.remove();
            UI.toast('Die KI antwortet nicht: ' + (e instanceof Error ? e.message : String(e)));
            return;
        }
        w.remove();
        const formel = ohneZaun(antwort).split('\n').filter(z => !/^\s*(Formel|Antwort)\s*:/i.test(z)).join('\n').trim();
        if (!formel) {
            UI.toast('Die KI hat nichts geliefert');
            return;
        }
        /* Probe an einer echten Zeile — das ist der eigentliche Unterschied. */
        const zeile = probeZeile(coll);
        let probeHtml, gut = false;
        if (!zeile) {
            /* Ohne Daten prüfen wir wenigstens, ob sie sich überhaupt lesen lässt. */
            const r = Formula.check(formel);
            gut = r.ok !== false;
            probeHtml = gut
                ? 'Die Formel lässt sich lesen. Zum Rechnen fehlt noch ein Eintrag in der Datenbank.'
                : '⛔ ' + esc(r.fehler || 'Die Formel ist nicht lesbar');
        }
        else {
            const erg = Formula.run(formel, (n) => {
                const k = Object.keys(coll.schema).find(x => coll.schema[x].name === n || x === n);
                return k ? Datenbank.wert(zeile, k, coll) : null;
            }, null, { zeile, db: coll });
            const wert = erg && typeof erg === 'object' && 'wert' in erg ? erg.wert : erg;
            const fehlt = erg && typeof erg === 'object' && erg.ok === false;
            const alsText = typeof wert === 'string' && wert.startsWith('⚠');
            gut = !fehlt && !alsText;
            probeHtml = gut
                ? `An der Zeile <b>${esc(zeile.text || 'Ohne Titel')}</b> kommt heraus: ` +
                    `<b class="kb-wert">${esc(Formula.anzeige(wert))}</b>`
                : '⛔ ' + esc((erg && erg.fehler) || String(wert) || 'Die Formel rechnet nicht');
        }
        vorschlag({
            titel: 'Formel von der KI',
            alt: aktuell || '',
            neu: formel,
            probe: probeHtml,
            inOrdnung: gut,
            erklaerung: 'Auftrag: ' + auftrag,
            nochmal: () => formelLauf(coll, key, aktuell, auftrag, uebernehmen),
            uebernehmen: () => uebernehmen(formel)
        });
    };
    /* ========================================================================
     * 2 · AUTOMATION BAUEN LASSEN
     * ======================================================================*/
    const automationSchreiben = async (coll) => {
        if (!kiDa()) {
            UI.toast('Dafür muss oben rechts eine KI eingerichtet sein');
            return;
        }
        const auftrag = await UI.frage('Was soll die Automation tun? Zum Beispiel: „Wenn Status auf Erledigt springt, setze Abschlussdatum auf heute."', '');
        if (!auftrag)
            return;
        await automationLauf(coll, auftrag);
    };
    const automationLauf = async (coll, auftrag) => {
        const spalten = Object.keys(coll.schema)
            .map(k => `- Schlüssel "${k}" = "${coll.schema[k].name}" (${coll.schema[k].type})`).join('\n');
        const system = 'Du baust Automationen für Redion. Antworte NUR mit JSON, ohne Text und ohne ```-Zäune.\n' +
            'Form: {"name": "...", "wenn": {"art": "...", "key": "...", "wert": "..."}, ' +
            '"bedingungen": [{"key":"...","op":"ist","wert":"..."}], ' +
            '"dann": [{"art": "...", "key": "...", "wert": "...", "text": "..."}]}\n' +
            'Erlaubte Auslöser (art): ' + Datenbank.AUSLOESER.map((a) => `${a[0]} (${a[1]})`).join('; ') + '\n' +
            'Erlaubte Aktionen (art): ' + Datenbank.AKTIONEN.map((a) => `${a[0]} (${a[1]})`).join('; ') + '\n' +
            /* Der Katalog gehört in den Auftrag: sonst erfindet die KI Bedingungen,
               die es nicht gibt, oder baut umständliche Filterregeln nach. */
            'Benannte Bedingungen — statt {"key","op","wert"} auch {"art": "…", "key": "…", "wert": "…"}: ' +
            Datenbank.BEDINGUNGEN.map((b) => `${b[0]} (${b[1]})`).join('; ') + '\n' +
            'key ist immer der Schlüssel einer Spalte, nie der Anzeigename.\n' +
            'Bei setze-prop gehört der Zielwert nach "wert". Datumswerte dürfen "heute" oder "jetzt" sein.';
        const w = warten('Die KI baut die Automation …');
        let roh = '';
        try {
            roh = await KI.frageKurz(`Datenbank „${coll.name}" mit diesen Spalten:\n${spalten}\n\nAuftrag: ${auftrag}`, system);
        }
        catch (e) {
            w.remove();
            UI.toast('Die KI antwortet nicht: ' + (e instanceof Error ? e.message : String(e)));
            return;
        }
        w.remove();
        const plan = jsonAus(roh);
        const meckern = pruefeAutomation(plan, coll);
        const lesbar = plan ? automationInWorten(plan, coll) : '(nichts Verwertbares)';
        vorschlag({
            titel: 'Automation von der KI',
            alt: '',
            neu: lesbar,
            probe: meckern.length
                ? '⛔ ' + meckern.map(esc).join('<br>')
                : 'Auslöser und Aktionen passen zu dieser Datenbank. ' +
                    'Angelegt wird sie ausgeschaltet — erst du schaltest sie an.',
            inOrdnung: !meckern.length,
            erklaerung: 'Auftrag: ' + auftrag,
            nochmal: () => automationLauf(coll, auftrag),
            uebernehmen: () => {
                coll.automationen = coll.automationen || [];
                coll.automationen.push({
                    id: Store.uid().slice(0, 6),
                    name: plan.name || 'Von der KI gebaut',
                    an: false, /* bewusst aus — erst ansehen */
                    wenn: plan.wenn,
                    bedingungen: plan.bedingungen || [],
                    dann: plan.dann
                });
                Store.updateCollection(coll.id, { automationen: coll.automationen });
                UI.toast('Automation angelegt — sie ist noch ausgeschaltet');
                App.zeichneSeite();
            }
        });
    };
    const pruefeAutomation = (plan, coll) => {
        const f = [];
        if (!plan || typeof plan !== 'object')
            return ['Die Antwort war kein verwertbares JSON'];
        if (!plan.wenn || !plan.wenn.art)
            f.push('Es fehlt der Auslöser („wenn")');
        else if (!Datenbank.AUSLOESER.some((a) => a[0] === plan.wenn.art))
            f.push(`Diesen Auslöser gibt es nicht: ${plan.wenn.art}`);
        else if (plan.wenn.key && !coll.schema[plan.wenn.key])
            f.push(`Der Auslöser zeigt auf eine Spalte, die es nicht gibt: ${plan.wenn.key}`);
        if (!Array.isArray(plan.dann) || !plan.dann.length)
            f.push('Es fehlt die Aktion („dann")');
        else
            plan.dann.forEach((d, i) => {
                if (!Datenbank.AKTIONEN.some((a) => a[0] === d.art))
                    f.push(`Aktion ${i + 1}: „${d.art}" gibt es nicht`);
                if (d.key && !coll.schema[d.key])
                    f.push(`Aktion ${i + 1} zeigt auf eine Spalte, die es nicht gibt: ${d.key}`);
                if (d.art === 'setze-prop' && !d.key)
                    f.push(`Aktion ${i + 1}: „Eigenschaft setzen" ohne Spalte`);
            });
        (plan.bedingungen || []).forEach((b, i) => {
            if (b.key && !coll.schema[b.key])
                f.push(`Bedingung ${i + 1}: Spalte ${b.key} gibt es nicht`);
            if (b.art && !Datenbank.BEDINGUNGEN.some((x) => x[0] === b.art))
                f.push(`Bedingung ${i + 1}: „${b.art}" gibt es nicht`);
        });
        return f;
    };
    const automationInWorten = (plan, coll) => {
        const n = (k) => (coll.schema[k] || {}).name || k;
        const az = (id, liste) => (liste.find((x) => x[0] === id) || [, id])[1];
        const zeilen = [];
        zeilen.push('Name: ' + (plan.name || 'Ohne Namen'));
        zeilen.push('Wenn: ' + az((plan.wenn || {}).art, Datenbank.AUSLOESER) +
            (plan.wenn && plan.wenn.key ? ' — ' + n(plan.wenn.key) : '') +
            (plan.wenn && plan.wenn.wert ? ' = ' + plan.wenn.wert : ''));
        (plan.bedingungen || []).forEach((b) => zeilen.push('  nur wenn: ' + (b.art
            ? Datenbank.bedingungText(b) + (b.key ? ' (' + n(b.key) + ')' : '')
            : n(b.key) + ' ' + (b.op || 'ist') + ' ' + (b.wert ?? ''))));
        (plan.dann || []).forEach((d, i) => zeilen.push('Dann ' + (i + 1) + ': ' + az(d.art, Datenbank.AKTIONEN) +
            (d.key ? ' — ' + n(d.key) : '') +
            (d.wert !== undefined && d.wert !== '' ? ' = ' + d.wert : '') +
            (d.text ? ' „' + d.text + '"' : '')));
        return zeilen.join('\n');
    };
    /* ========================================================================
     * 3 · FILTER BAUEN LASSEN
     * ======================================================================*/
    const filterSchreiben = async (coll, view) => {
        if (!kiDa()) {
            UI.toast('Dafür muss oben rechts eine KI eingerichtet sein');
            return;
        }
        const auftrag = await UI.frage('Was soll die Ansicht zeigen? Zum Beispiel: „offene Aufgaben, die diese Woche fällig sind"', '');
        if (!auftrag)
            return;
        await filterLauf(coll, view, auftrag);
    };
    const filterLauf = async (coll, view, auftrag) => {
        const spalten = Object.keys(coll.schema).map(k => {
            const d = coll.schema[k];
            const ops = (Datenbank.OPERATOREN[d.type] || Datenbank.OPERATOREN['text'] || []).join(' | ');
            const opt = (d.options || []).length ? ' — Werte: ' + d.options.map((o) => o.name).join(', ') : '';
            return `- "${k}" = "${d.name}" (${d.type})${opt}\n   Bedingungen: ${ops}`;
        }).join('\n');
        const w = warten('Die KI baut den Filter …');
        let roh = '';
        try {
            roh = await KI.frageKurz(`Datenbank „${coll.name}":\n${spalten}\n\nAuftrag: ${auftrag}`, 'Du baust Filter für Redion. Antworte NUR mit JSON, ohne Text, ohne ```-Zäune.\n' +
                'Form: {"operator":"and","rules":[{"key":"...","op":"...","wert":"..."}]}\n' +
                'operator ist "and" oder "or". Gruppen sind erlaubt: statt einer Regel ' +
                'ein Objekt {"operator":"or","rules":[...]}.\n' +
                'key ist der Spaltenschlüssel, op muss wörtlich eine der genannten Bedingungen sein.');
        }
        catch (e) {
            w.remove();
            UI.toast('Die KI antwortet nicht: ' + (e instanceof Error ? e.message : String(e)));
            return;
        }
        w.remove();
        const plan = jsonAus(roh);
        const meckern = pruefeFilter(plan, coll);
        let treffer = null;
        if (!meckern.length) {
            try {
                const alle = Store.rowsOf(coll.id).filter((r) => !r.archiviert);
                treffer = alle.filter((r) => Datenbank.gruppeTrifftZu(r, plan, coll)).length + ' von ' + alle.length;
            }
            catch (e) {
                meckern.push('Beim Probelauf: ' + (e instanceof Error ? e.message : String(e)));
            }
        }
        vorschlag({
            titel: 'Filter von der KI',
            alt: view.filters && (view.filters.rules || []).length ? filterInWorten(view.filters, coll) : '',
            neu: plan ? filterInWorten(plan, coll) : '(nichts Verwertbares)',
            probe: meckern.length ? '⛔ ' + meckern.map(esc).join('<br>')
                : `Der Filter trifft gerade auf <b class="kb-wert">${treffer}</b> Einträge zu.`,
            inOrdnung: !meckern.length,
            erklaerung: 'Auftrag: ' + auftrag,
            nochmal: () => filterLauf(coll, view, auftrag),
            uebernehmen: () => {
                Store.updateView(view.id, { filters: plan });
                UI.toast('Filter übernommen');
                App.zeichneSeite();
            }
        });
    };
    const pruefeFilter = (plan, coll, tiefe = 0) => {
        const f = [];
        if (!plan || typeof plan !== 'object')
            return ['Die Antwort war kein verwertbares JSON'];
        if (!Array.isArray(plan.rules))
            return ['Es fehlt die Liste „rules"'];
        if (tiefe > 4)
            return ['Zu tief verschachtelt'];
        plan.rules.forEach((r, i) => {
            if (r.rules) {
                f.push(...pruefeFilter(r, coll, tiefe + 1));
                return;
            }
            if (!coll.schema[r.key]) {
                f.push(`Regel ${i + 1}: Spalte „${r.key}" gibt es nicht`);
                return;
            }
            const ops = Datenbank.OPERATOREN[coll.schema[r.key].type] ||
                Datenbank.OPERATOREN['text'] || [];
            if (!ops.includes(r.op))
                f.push(`Regel ${i + 1}: „${r.op}" passt nicht zu ${coll.schema[r.key].name} ` +
                    `(erlaubt: ${ops.slice(0, 4).join(', ')} …)`);
        });
        return f;
    };
    const filterInWorten = (gruppe, coll, tiefe = 0) => {
        const ein = '  '.repeat(tiefe);
        const verb = gruppe.operator === 'or' ? 'ODER' : 'UND';
        return (gruppe.rules || []).map((r, i) => {
            const vor = i ? ein + verb + ' ' : ein;
            if (r.rules)
                return vor + '(\n' + filterInWorten(r, coll, tiefe + 1) + '\n' + ein + ')';
            return vor + ((coll.schema[r.key] || {}).name || r.key) + ' ' + r.op +
                (r.wert !== undefined && r.wert !== '' ? ' ' + r.wert : '');
        }).join('\n');
    };
    /* ========================================================================
     * 4 · FORMEL ERKLÄREN LASSEN
     * ======================================================================*/
    const formelErklaeren = async (coll, formel) => {
        if (!kiDa()) {
            UI.toast('Dafür muss oben rechts eine KI eingerichtet sein');
            return;
        }
        const w = warten('Die KI liest die Formel …');
        let text = '';
        try {
            text = await KI.frageKurz(`Diese Formel steht in der Datenbank „${coll.name}":\n\n${formel}\n\n` +
                'Erkläre in höchstens sechs kurzen Sätzen, was sie tut, und nenne einen Fall, ' +
                'in dem sie ein überraschendes Ergebnis liefert.', 'Du erklärst Formeln in klarem Deutsch. Keine Einleitung, keine Aufzählungszeichen.');
        }
        catch (e) {
            w.remove();
            UI.toast('Die KI antwortet nicht: ' + (e instanceof Error ? e.message : String(e)));
            return;
        }
        w.remove();
        const o = document.createElement('div');
        o.className = 'overlay';
        o.innerHTML =
            '<div class="finder" style="width:min(620px,94vw)">' +
                '<div class="fh">✨ Was diese Formel tut<button class="icon-btn" data-a="zu">✕</button></div>' +
                `<div class="kb-koerper"><pre class="kb-formel">${esc(formel)}</pre>` +
                `<div class="kb-text">${esc(text).replace(/\n/g, '<br>')}</div></div>` +
                '<div class="fbtns"><button data-a="zu" class="prim">Schliessen</button></div>' +
                '</div>';
        document.body.appendChild(o);
        o.addEventListener('click', e => {
            if (e.target === o || elVon(e)?.closest('[data-a="zu"]'))
                o.remove();
        });
    };
    return { vorschlag, diffHtml, zeilenDiff, jsonAus, ohneZaun,
        formelSchreiben, formelLauf, automationSchreiben, automationLauf,
        filterSchreiben, filterLauf, formelErklaeren,
        pruefeAutomation, pruefeFilter, automationInWorten, filterInWorten, kiDa };
})();
window.KiBau = KiBau;
