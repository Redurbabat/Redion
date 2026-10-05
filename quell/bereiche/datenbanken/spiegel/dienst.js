"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/bereiche/datenbanken/spiegel/dienst.ts (npm run bauen:ts). */
const Spiegel = (() => {
    const elVon = (e) => e.target instanceof Element ? e.target : null;
    const esc = (s) => String(s ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const opt = (...paare) => paare.map(([name, color]) => ({ name, color }));
    const GH_SCHEMA = () => ({
        title: { name: 'Titel', type: 'title' },
        nr: { name: 'Nummer', type: 'number' },
        art: { name: 'Art', type: 'select',
            options: opt(['Issue', 'blue'], ['Pull Request', 'purple']) },
        status: { name: 'Zustand', type: 'status',
            options: opt(['Offen', 'green'], ['Geschlossen', 'gray']) },
        wer: { name: 'Von', type: 'text' },
        zu: { name: 'Zugewiesen', type: 'text' },
        labels: { name: 'Beschriftungen', type: 'multi', options: [] },
        meile: { name: 'Meilenstein', type: 'select', options: [] },
        komm: { name: 'Kommentare', type: 'number' },
        auf: { name: 'Angelegt', type: 'date' },
        ab: { name: 'Geändert', type: 'date' },
        link: { name: 'Bei GitHub', type: 'url' },
        repo: { name: 'Projekt', type: 'text' },
        text: { name: 'Beschreibung', type: 'text' }
    });
    const optionSichern = (coll, key, name) => {
        if (!name || !coll.schema[key])
            return;
        const liste = coll.schema[key].options || [];
        if (liste.some((o) => o.name === name))
            return;
        const farben = ['blue', 'green', 'orange', 'purple', 'pink', 'red', 'yellow', 'brown', 'gray'];
        liste.push({ name, color: farben[liste.length % farben.length] });
        coll.schema[key].options = liste;
        Store.updateCollection(coll.id, { schema: coll.schema });
    };
    const darf = (coll, dienst) => {
        const liste = coll && coll.verbindungen;
        if (!Array.isArray(liste))
            return true;
        return liste.includes(dienst);
    };
    const eigenerDienst = (coll) => String((coll && coll.spiegelQuelle) || '').split(':')[0] || '';
    const sperrePruefen = (coll, dienst) => {
        if (darf(coll, dienst))
            return;
        throw new Error('Für diese Datenbank ist die Verbindung zu ' + dienst
            + ' ausgeschaltet. Datenbankmenü → Verbindungen.');
    };
    const zielSchon = (name) => Object.values(Store.cache.collections).find(c => c.name === name && c.gespiegelt) || null;
    const sperrePruefenFuerZiel = (name, dienst) => {
        const da = zielSchon(name);
        if (da)
            sperrePruefen(da, dienst);
    };
    const zielDatenbank = (name, schema, layout = 'table') => {
        const da = zielSchon(name);
        if (da)
            return da;
        const { collectionId } = Store.addDatabase(App.aktuelleSeite(), name, schema(), layout);
        const c = Store.getCollection(collectionId);
        Store.updateCollection(c.id, { gespiegelt: true, icon: '🔄' });
        return c;
    };
    const githubHolen = async (repo, zustand = 'all', seiten = 3) => {
        const alle = [];
        for (let s = 1; s <= seiten; s++) {
            const d = await Verbindungen.githubRuf(`/repos/${repo}/issues?state=${zustand}&per_page=100&page=${s}&sort=updated`);
            if (!Array.isArray(d) || !d.length)
                break;
            alle.push(...d);
            if (d.length < 100)
                break;
        }
        return alle;
    };
    const githubAbgleich = async (repo, zustand = 'all') => {
        sperrePruefenFuerZiel('GitHub · ' + repo, 'github');
        const roh = await githubHolen(repo, zustand);
        const coll = zielDatenbank('GitHub · ' + repo, GH_SCHEMA, 'board');
        const v = Store.getView(coll.viewIds[0]);
        if (v && v.layout === 'board' && !v.groupBy)
            Store.updateView(v.id, { groupBy: 'status' });
        const vorhanden = new Map();
        Store.rowsOf(coll.id).forEach((r) => {
            const k = (r.props || {}).repo + '#' + (r.props || {}).nr;
            vorhanden.set(k, r);
        });
        let neu = 0, frisch = 0;
        roh.forEach(i => {
            (i.labels || []).forEach((l) => optionSichern(coll, 'labels', l.name || l));
            if (i.milestone)
                optionSichern(coll, 'meile', i.milestone.title);
            const props = {
                nr: i.number,
                art: i.pull_request ? 'Pull Request' : 'Issue',
                status: i.state === 'open' ? 'Offen' : 'Geschlossen',
                wer: i.user?.login || '',
                zu: (i.assignees || []).map((a) => a.login).join(', '),
                labels: (i.labels || []).map((l) => l.name || l),
                meile: i.milestone ? i.milestone.title : '',
                komm: i.comments || 0,
                auf: (i.created_at || '').slice(0, 10),
                ab: (i.updated_at || '').slice(0, 10),
                link: i.html_url || '',
                repo,
                text: (i.body || '').slice(0, 2000)
            };
            const schluessel = repo + '#' + i.number;
            const alt = vorhanden.get(schluessel);
            if (alt) {
                Object.entries(props).forEach(([k, v]) => Store.setProp(alt.id, k, v));
                Store.updateBlock(alt.id, { text: i.title || 'Ohne Titel' });
                frisch++;
            }
            else {
                const r = Store.addRow(coll.id, props);
                Store.updateBlock(r.id, { text: i.title || 'Ohne Titel' });
                neu++;
            }
        });
        Store.updateCollection(coll.id, {
            spiegelQuelle: 'github:' + repo, spiegelZeit: Store.now()
        });
        return { neu, frisch, coll };
    };
    const githubZurueck = async (row, coll) => {
        sperrePruefen(coll || (row && row.parentId ? Store.getCollection(row.parentId) : null), 'github');
        const repo = (row.props || {}).repo || Store.getMeta('api:githubRepo', '');
        const nr = (row.props || {}).nr;
        if (!repo || !nr)
            throw new Error('Zu diesem Eintrag fehlt die GitHub-Nummer.');
        const koerper = {
            title: row.text || 'Ohne Titel',
            state: (row.props || {}).status === 'Geschlossen' ? 'closed' : 'open',
            labels: (row.props || {}).labels || []
        };
        await Verbindungen.githubRuf(`/repos/${repo}/issues/${nr}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(koerper)
        });
        return true;
    };
    const githubNeu = async (repo, titel, text) => {
        const d = await Verbindungen.githubRuf(`/repos/${repo}/issues`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: titel, body: text || '' })
        });
        return d;
    };
    const JI_SCHEMA = () => ({
        title: { name: 'Zusammenfassung', type: 'title' },
        key: { name: 'Schlüssel', type: 'text' },
        art: { name: 'Typ', type: 'select', options: [] },
        status: { name: 'Status', type: 'status', options: [] },
        prio: { name: 'Priorität', type: 'select', options: [] },
        wer: { name: 'Melder', type: 'text' },
        zu: { name: 'Bearbeiter', type: 'text' },
        auf: { name: 'Angelegt', type: 'date' },
        ab: { name: 'Geändert', type: 'date' },
        link: { name: 'Bei Jira', type: 'url' },
        text: { name: 'Beschreibung', type: 'text' }
    });
    const jiraAbgleich = async (projekt) => {
        sperrePruefenFuerZiel('Jira · ' + projekt, 'jira');
        const basis = Store.getMeta('api:jiraUrl', '').replace(/\/$/, '');
        const jql = encodeURIComponent('project = ' + projekt + ' ORDER BY updated DESC');
        const d = await Verbindungen.jiraRuf('/rest/api/3/search?jql=' + jql + '&maxResults=100' +
            '&fields=summary,status,issuetype,priority,reporter,assignee,created,updated,description');
        const coll = zielDatenbank('Jira · ' + projekt, JI_SCHEMA, 'board');
        const v = Store.getView(coll.viewIds[0]);
        if (v && v.layout === 'board' && !v.groupBy)
            Store.updateView(v.id, { groupBy: 'status' });
        const vorhanden = new Map();
        Store.rowsOf(coll.id).forEach((r) => vorhanden.set((r.props || {}).key, r));
        let neu = 0, frisch = 0;
        (d.issues || []).forEach((i) => {
            const fe = i.fields || {};
            optionSichern(coll, 'art', fe.issuetype?.name);
            optionSichern(coll, 'status', fe.status?.name);
            optionSichern(coll, 'prio', fe.priority?.name);
            const props = {
                key: i.key,
                art: fe.issuetype?.name || '',
                status: fe.status?.name || '',
                prio: fe.priority?.name || '',
                wer: fe.reporter?.displayName || '',
                zu: fe.assignee?.displayName || '',
                auf: (fe.created || '').slice(0, 10),
                ab: (fe.updated || '').slice(0, 10),
                link: basis + '/browse/' + i.key,
                text: textAusAdf(fe.description).slice(0, 2000)
            };
            const alt = vorhanden.get(i.key);
            if (alt) {
                Object.entries(props).forEach(([k, v]) => Store.setProp(alt.id, k, v));
                Store.updateBlock(alt.id, { text: fe.summary || i.key });
                frisch++;
            }
            else {
                const r = Store.addRow(coll.id, props);
                Store.updateBlock(r.id, { text: fe.summary || i.key });
                neu++;
            }
        });
        Store.updateCollection(coll.id, {
            spiegelQuelle: 'jira:' + projekt, spiegelZeit: Store.now()
        });
        return { neu, frisch, coll };
    };
    const textAusAdf = (knoten) => {
        if (!knoten)
            return '';
        if (typeof knoten === 'string')
            return knoten;
        if (knoten.text)
            return knoten.text;
        if (Array.isArray(knoten.content))
            return knoten.content.map(textAusAdf).join(knoten.type === 'paragraph' ? '' : '\n');
        return '';
    };
    const spiegelListe = () => Object.values(Store.cache.collections)
        .filter(c => c.gespiegelt && c.spiegelQuelle);
    const alleAuffrischen = async () => {
        const liste = spiegelListe();
        if (!liste.length) {
            UI.toast('Keine gespiegelte Datenbank');
            return;
        }
        let n = 0;
        const schief = [];
        for (const c of liste) {
            const [art, was] = String(c.spiegelQuelle).split(':');
            try {
                if (art === 'github' && was) {
                    const e = await githubAbgleich(was);
                    n += e.neu + e.frisch;
                }
                if (art === 'jira' && was) {
                    const e = await jiraAbgleich(was);
                    n += e.neu + e.frisch;
                }
            }
            catch (err) {
                schief.push(c.name + ': ' + (err instanceof Error ? err.message : String(err)));
            }
        }
        App.zeichneSeite();
        if (schief.length)
            UI.banner(schief.join(' · '), 'warn');
        else
            UI.toast(n + ' Einträge abgeglichen');
    };
    const githubDialog = async () => {
        const repo = await UI.frage('Welches Projekt? (benutzer/projekt)', Store.getMeta('api:githubRepo', ''));
        if (!repo)
            return;
        Store.setMeta('api:githubRepo', repo.trim());
        UI.toast('Wird geholt …');
        try {
            const e = await githubAbgleich(repo.trim());
            App.zeichneSeite();
            UI.toast(e.neu + ' neu, ' + e.frisch + ' aufgefrischt');
        }
        catch (err) {
            UI.banner('GitHub: ' + (err instanceof Error ? err.message : String(err)), 'warn');
        }
    };
    const jiraDialog = async () => {
        const pr = await UI.frage('Projekt-Kürzel', Store.getMeta('api:jiraProjekt', ''));
        if (!pr)
            return;
        Store.setMeta('api:jiraProjekt', pr.trim());
        UI.toast('Wird geholt …');
        try {
            const e = await jiraAbgleich(pr.trim());
            App.zeichneSeite();
            UI.toast(e.neu + ' neu, ' + e.frisch + ' aufgefrischt');
        }
        catch (err) {
            UI.banner('Jira: ' + (err instanceof Error ? err.message : String(err)) +
                ' — Atlassian lässt den Browser oft nicht direkt heran. In den Verbindungen ' +
                'lässt sich eine Brücke eintragen.', 'warn');
        }
    };
    const dialog = () => {
        const o = document.createElement('div');
        o.className = 'overlay';
        o.innerHTML = '<div class="finder" style="width:min(660px,94vw)">' +
            '<div class="fh">🔄 Gespiegelte Datenbanken<button class="icon-btn" data-a="zu">✕</button></div>' +
            '<div id="sb" style="padding:4px 18px 16px; max-height:70vh; overflow:auto"></div>' +
            '<div class="fbtns"><button data-a="alle">Alle auffrischen</button>' +
            '<button data-a="zu" class="prim">Fertig</button></div></div>';
        document.body.appendChild(o);
        const zeichne = () => {
            const liste = spiegelListe();
            const sb = o.querySelector('#sb');
            if (!sb)
                return;
            sb.innerHTML =
                '<div class="verb-karte">' +
                    '<div class="verb-kopf"><span>🐙</span><b>GitHub</b></div>' +
                    '<div class="verb-text">Issues und Pull Requests eines Projekts als Board. ' +
                    'Titel, Zustand und Beschriftungen lassen sich zurückschreiben.</div>' +
                    '<div class="verb-knoepfe"><button data-a="gh">Projekt spiegeln</button>' +
                    '<button data-a="gh-neu">Neues Issue anlegen</button></div>' +
                    '</div>' +
                    '<div class="verb-karte">' +
                    '<div class="verb-kopf"><span>🟦</span><b>Jira</b></div>' +
                    '<div class="verb-text">Vorgänge eines Projekts als Board.</div>' +
                    '<div class="verb-knoepfe"><button data-a="ji">Projekt spiegeln</button></div>' +
                    '</div>' +
                    (liste.length
                        ? '<div class="verb-karte"><div class="verb-kopf"><span>📋</span><b>Schon gespiegelt</b></div>' +
                            '<div class="abo-liste">' + liste.map(c => `<div class="abo-zeile"><span class="frei-kreis bg-blue">🔄</span>` +
                            `<span class="frei-name"><b>${esc(c.name)}</b><span>${esc(c.spiegelQuelle)}` +
                            `${c.spiegelZeit ? ' · zuletzt ' + esc(String(c.spiegelZeit).slice(0, 16).replace('T', ' ')) : ''}` +
                            `</span></span><button data-auf="${c.id}">Auffrischen</button></div>`).join('') +
                            '</div></div>'
                        : '');
        };
        zeichne();
        o.addEventListener('click', async (e) => {
            if (e.target === o || elVon(e)?.closest('[data-a="zu"]')) {
                o.remove();
                return;
            }
            const auf = elVon(e)?.closest('[data-auf]');
            if (auf) {
                const c = Store.getCollection(auf.dataset.auf);
                const [art, was] = String(c.spiegelQuelle).split(':');
                try {
                    if (!was)
                        return;
                    const erg = art === 'github' ? await githubAbgleich(was) : await jiraAbgleich(was);
                    App.zeichneSeite();
                    UI.toast(erg.neu + ' neu, ' + erg.frisch + ' aufgefrischt');
                    zeichne();
                }
                catch (err) {
                    UI.banner((err instanceof Error ? err.message : String(err)), 'warn');
                }
                return;
            }
            const b = elVon(e)?.closest('button[data-a]');
            if (!b)
                return;
            if (b.dataset.a === 'gh') {
                o.remove();
                githubDialog();
            }
            if (b.dataset.a === 'ji') {
                o.remove();
                jiraDialog();
            }
            if (b.dataset.a === 'alle') {
                await alleAuffrischen();
                zeichne();
            }
            if (b.dataset.a === 'gh-neu') {
                const repo = Store.getMeta('api:githubRepo', '');
                if (!repo) {
                    UI.toast('Erst ein Projekt spiegeln');
                    return;
                }
                const titel = await UI.frage('Titel des Issues', '');
                if (!titel)
                    return;
                const text = await UI.frage('Beschreibung', '');
                try {
                    const d = await githubNeu(repo, titel, text || '');
                    UI.toast('Issue #' + d.number + ' angelegt');
                }
                catch (err) {
                    UI.banner((err instanceof Error ? err.message : String(err)), 'warn');
                }
            }
        });
    };
    return { darf, eigenerDienst, sperrePruefen, sperrePruefenFuerZiel,
        githubAbgleich, githubZurueck, githubNeu, githubDialog,
        jiraAbgleich, jiraDialog, textAusAdf,
        spiegelListe, alleAuffrischen, dialog };
})();
window.Spiegel = Spiegel;
