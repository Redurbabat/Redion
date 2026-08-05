/* ============================================================================
 * spiegel.js — Gespiegelte Datenbanken
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/bereiche/datenbanken/spiegel/dienst.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/bereiche/datenbanken/spiegel/dienst.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
 * Notion nennt das „Synced databases": eine Datenbank, die einem fremden
 * System gehört und hier nur gezeigt wird. Zwei Systeme sind angebunden:
 *
 *   GITHUB   Issues und Pull Requests. Läuft direkt aus dem Browser —
 *            GitHub erlaubt das ausdrücklich. Ein Token mit Leserecht reicht.
 *            Zurückschreiben geht auch: Titel, Zustand, Beschriftungen.
 *
 *   JIRA     Vorgänge eines Projekts. Atlassian lässt den Browser meist
 *            nicht direkt heran; dann läuft es über die Brücke.
 *
 * Der Abgleich merkt sich für jede Zeile die fremde Nummer. Beim zweiten
 * Durchlauf wird aufgefrischt statt doppelt angelegt.
 * ==========================================================================*/

const Spiegel = (() => {

  /* Das angeklickte Element — oder nichts. `e.target` ist `EventTarget | null`
     und muss ein `Element` sein, bevor `closest` daran etwas findet. Vorher
     stand hier ungeprüft `e.target.closest(…)`: bei einem Klick, dessen Ziel
     kein Element ist, warf das mitten im Behandeln. */
  const elVon = (e: Event): Element | null =>
    e.target instanceof Element ? e.target : null;

  const esc = (s: unknown): string => String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const opt = (...paare: [string, string][]) => paare.map(([name, color]) => ({ name, color }));

  /* ========================================================================
   * GITHUB
   * ======================================================================*/
  const GH_SCHEMA = () => ({
    title:  { name: 'Titel',        type: 'title' },
    nr:     { name: 'Nummer',       type: 'number' },
    art:    { name: 'Art',          type: 'select',
              options: opt(['Issue','blue'], ['Pull Request','purple']) },
    status: { name: 'Zustand',      type: 'status',
              options: opt(['Offen','green'], ['Geschlossen','gray']) },
    wer:    { name: 'Von',          type: 'text' },
    zu:     { name: 'Zugewiesen',   type: 'text' },
    labels: { name: 'Beschriftungen', type: 'multi', options: [] },
    meile:  { name: 'Meilenstein',  type: 'select', options: [] },
    komm:   { name: 'Kommentare',   type: 'number' },
    auf:    { name: 'Angelegt',     type: 'date' },
    ab:     { name: 'Geändert',     type: 'date' },
    link:   { name: 'Bei GitHub',   type: 'url' },
    repo:   { name: 'Projekt',      type: 'text' },
    text:   { name: 'Beschreibung', type: 'text' }
  });

  /** Sorgt dafür, dass eine Auswahloption existiert. */
  const optionSichern = (coll: any, key: string, name: string): void => {
    if (!name || !coll.schema[key]) return;
    const liste = coll.schema[key].options || [];
    if (liste.some((o: any) => o.name === name)) return;
    const farben = ['blue','green','orange','purple','pink','red','yellow','brown','gray'];
    liste.push({ name, color: farben[liste.length % farben.length] });
    coll.schema[key].options = liste;
    Store.updateCollection(coll.id, { schema: coll.schema });
  };

  const zielDatenbank = (name: string, schema: any, layout = 'table'): any => {
    const da = Object.values<any>(Store.cache.collections).find(c => c.name === name && c.gespiegelt);
    if (da) return da;
    const { collectionId } = Store.addDatabase(App.aktuelleSeite(), name, schema(), layout);
    const c = Store.getCollection(collectionId);
    Store.updateCollection(c.id, { gespiegelt: true, icon: '🔄' });
    return c;
  };

  /** Issues und Pull Requests holen. */
  const githubHolen = async (repo: string, zustand = 'all', seiten = 3): Promise<any[]> => {
    const alle = [];
    for (let s = 1; s <= seiten; s++) {
      const d = await Verbindungen.githubRuf(
        `/repos/${repo}/issues?state=${zustand}&per_page=100&page=${s}&sort=updated`);
      if (!Array.isArray(d) || !d.length) break;
      alle.push(...d);
      if (d.length < 100) break;
    }
    return alle;
  };

  const githubAbgleich = async (repo: string, zustand = 'all'): Promise<any> => {
    const roh = await githubHolen(repo, zustand);
    const coll = zielDatenbank('GitHub · ' + repo, GH_SCHEMA, 'board');

    /* Board nach Zustand gruppieren, damit man sofort etwas sieht */
    const v = Store.getView(coll.viewIds[0]);
    if (v && v.layout === 'board' && !v.groupBy) Store.updateView(v.id, { groupBy: 'status' });

    const vorhanden = new Map();
    Store.rowsOf(coll.id).forEach((r: any) => {
      const k = (r.props || {}).repo + '#' + (r.props || {}).nr;
      vorhanden.set(k, r);
    });

    let neu = 0, frisch = 0;
    roh.forEach(i => {
      (i.labels || []).forEach((l: any) => optionSichern(coll, 'labels', l.name || l));
      if (i.milestone) optionSichern(coll, 'meile', i.milestone.title);

      const props = {
        nr: i.number,
        art: i.pull_request ? 'Pull Request' : 'Issue',
        status: i.state === 'open' ? 'Offen' : 'Geschlossen',
        wer: i.user?.login || '',
        zu: (i.assignees || []).map((a: any) => a.login).join(', '),
        labels: (i.labels || []).map((l: any) => l.name || l),
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
      } else {
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

  /** Eine Änderung zurück nach GitHub schreiben. */
  const githubZurueck = async (row: any, _coll?: any): Promise<any> => {
    const repo = (row.props || {}).repo || Store.getMeta('api:githubRepo', '');
    const nr = (row.props || {}).nr;
    if (!repo || !nr) throw new Error('Zu diesem Eintrag fehlt die GitHub-Nummer.');
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

  /** Ein neues Issue anlegen. */
  const githubNeu = async (repo: string, titel: string, text: string): Promise<any> => {
    const d = await Verbindungen.githubRuf(`/repos/${repo}/issues`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: titel, body: text || '' })
    });
    return d;
  };

  /* ========================================================================
   * JIRA
   * ======================================================================*/
  const JI_SCHEMA = () => ({
    title:  { name: 'Zusammenfassung', type: 'title' },
    key:    { name: 'Schlüssel',   type: 'text' },
    art:    { name: 'Typ',         type: 'select', options: [] },
    status: { name: 'Status',      type: 'status', options: [] },
    prio:   { name: 'Priorität',   type: 'select', options: [] },
    wer:    { name: 'Melder',      type: 'text' },
    zu:     { name: 'Bearbeiter',  type: 'text' },
    auf:    { name: 'Angelegt',    type: 'date' },
    ab:     { name: 'Geändert',    type: 'date' },
    link:   { name: 'Bei Jira',    type: 'url' },
    text:   { name: 'Beschreibung',type: 'text' }
  });

  const jiraAbgleich = async (projekt: string): Promise<any> => {
    const basis = Store.getMeta('api:jiraUrl', '').replace(/\/$/, '');
    const jql = encodeURIComponent('project = ' + projekt + ' ORDER BY updated DESC');
    const d = await Verbindungen.jiraRuf(
      '/rest/api/3/search?jql=' + jql + '&maxResults=100' +
      '&fields=summary,status,issuetype,priority,reporter,assignee,created,updated,description');

    const coll = zielDatenbank('Jira · ' + projekt, JI_SCHEMA, 'board');
    const v = Store.getView(coll.viewIds[0]);
    if (v && v.layout === 'board' && !v.groupBy) Store.updateView(v.id, { groupBy: 'status' });

    const vorhanden = new Map();
    Store.rowsOf(coll.id).forEach((r: any) => vorhanden.set((r.props || {}).key, r));

    let neu = 0, frisch = 0;
    (d.issues || []).forEach((i: any) => {
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
      } else {
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

  /** Jira schreibt Beschreibungen als verschachteltes JSON. Text herausholen. */
  const textAusAdf = (knoten: any): string => {
    if (!knoten) return '';
    if (typeof knoten === 'string') return knoten;
    if (knoten.text) return knoten.text;
    if (Array.isArray(knoten.content))
      return knoten.content.map(textAusAdf).join(knoten.type === 'paragraph' ? '' : '\n');
    return '';
  };

  /* ========================================================================
   * ALLE SPIEGEL AUFFRISCHEN
   * ======================================================================*/
  const spiegelListe = (): any[] => Object.values<any>(Store.cache.collections)
    .filter(c => c.gespiegelt && c.spiegelQuelle);

  const alleAuffrischen = async (): Promise<any> => {
    const liste = spiegelListe();
    if (!liste.length) { UI.toast('Keine gespiegelte Datenbank'); return; }
    let n = 0; const schief: string[] = [];
    for (const c of liste) {
      const [art, was] = String(c.spiegelQuelle).split(':');
      try {
        if (art === 'github' && was) { const e = await githubAbgleich(was); n += e.neu + e.frisch; }
        if (art === 'jira' && was)   { const e = await jiraAbgleich(was);   n += e.neu + e.frisch; }
      } catch (err) { schief.push(c.name + ': ' + (err instanceof Error ? err.message : String(err))); }
    }
    App.zeichneSeite();
    if (schief.length) UI.banner(schief.join(' · '), 'warn');
    else UI.toast(n + ' Einträge abgeglichen');
  };

  /* ========================================================================
   * OBERFLÄCHE
   * ======================================================================*/
  const githubDialog = async (): Promise<void> => {
    const repo = await UI.frage('Welches Projekt? (benutzer/projekt)',
      Store.getMeta('api:githubRepo', ''));
    if (!repo) return;
    Store.setMeta('api:githubRepo', repo.trim());
    UI.toast('Wird geholt …');
    try {
      const e = await githubAbgleich(repo.trim());
      App.zeichneSeite();
      UI.toast(e.neu + ' neu, ' + e.frisch + ' aufgefrischt');
    } catch (err) {
      UI.banner('GitHub: ' + (err instanceof Error ? err.message : String(err)), 'warn');
    }
  };

  const jiraDialog = async (): Promise<void> => {
    const pr = await UI.frage('Projekt-Kürzel', Store.getMeta('api:jiraProjekt', ''));
    if (!pr) return;
    Store.setMeta('api:jiraProjekt', pr.trim());
    UI.toast('Wird geholt …');
    try {
      const e = await jiraAbgleich(pr.trim());
      App.zeichneSeite();
      UI.toast(e.neu + ' neu, ' + e.frisch + ' aufgefrischt');
    } catch (err) {
      UI.banner('Jira: ' + (err instanceof Error ? err.message : String(err)) +
        ' — Atlassian lässt den Browser oft nicht direkt heran. In den Verbindungen ' +
        'lässt sich eine Brücke eintragen.', 'warn');
    }
  };

  const dialog = (): void => {
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
      if (!sb) return;
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
            '<div class="abo-liste">' + liste.map(c =>
              `<div class="abo-zeile"><span class="frei-kreis bg-blue">🔄</span>` +
              `<span class="frei-name"><b>${esc(c.name)}</b><span>${esc(c.spiegelQuelle)}` +
              `${c.spiegelZeit ? ' · zuletzt ' + esc(String(c.spiegelZeit).slice(0, 16).replace('T', ' ')) : ''}` +
              `</span></span><button data-auf="${c.id}">Auffrischen</button></div>`).join('') +
            '</div></div>'
          : '');
    };
    zeichne();

    o.addEventListener('click', async e => {
      if (e.target === o || elVon(e)?.closest<HTMLElement>('[data-a="zu"]')) { o.remove(); return; }
      const auf = elVon(e)?.closest<HTMLElement>('[data-auf]');
      if (auf) {
        const c = Store.getCollection(auf.dataset.auf);
        const [art, was] = String(c.spiegelQuelle).split(':');
        try {
          if (!was) return;
          const erg = art === 'github' ? await githubAbgleich(was) : await jiraAbgleich(was);
          App.zeichneSeite();
          UI.toast(erg.neu + ' neu, ' + erg.frisch + ' aufgefrischt');
          zeichne();
        } catch (err) { UI.banner((err instanceof Error ? err.message : String(err)), 'warn'); }
        return;
      }
      const b = elVon(e)?.closest<HTMLElement>('button[data-a]');
      if (!b) return;
      if (b.dataset.a === 'gh')  { o.remove(); githubDialog(); }
      if (b.dataset.a === 'ji')  { o.remove(); jiraDialog(); }
      if (b.dataset.a === 'alle'){ await alleAuffrischen(); zeichne(); }
      if (b.dataset.a === 'gh-neu') {
        const repo = Store.getMeta('api:githubRepo', '');
        if (!repo) { UI.toast('Erst ein Projekt spiegeln'); return; }
        const titel = await UI.frage('Titel des Issues', '');
        if (!titel) return;
        const text = await UI.frage('Beschreibung', '');
        try {
          const d = await githubNeu(repo, titel, text || '');
          UI.toast('Issue #' + d.number + ' angelegt');
        } catch (err) { UI.banner((err instanceof Error ? err.message : String(err)), 'warn'); }
      }
    });
  };

  return { githubAbgleich, githubZurueck, githubNeu, githubDialog,
           jiraAbgleich, jiraDialog, textAusAdf,
           spiegelListe, alleAuffrischen, dialog };
})();

(window as any).Spiegel = Spiegel;
