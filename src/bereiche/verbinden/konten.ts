/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/bereiche/verbinden/konten.ts (npm run bauen:ts). */
/* ============================================================================
 * verbindungen.js — Anbindung an fremde Dienste
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/bereiche/verbinden/konten.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/bereiche/verbinden/konten.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
 * Hier laufen alle Verbindungen nach draussen zusammen: Google (Kalender,
 * Mail, Profil), GitHub, Jira, beliebige ICS-Kalender und eigene Server.
 *
 * WIE DAS OHNE SERVER GEHT
 *   Google erlaubt Browser-Programmen den sogenannten Token-Fluss: ein
 *   Fenster geht auf, du meldest dich bei Google an, Google schickt einen
 *   Zugangsschlüssel zurück. Dafür braucht es kein Geheimnis und keinen
 *   eigenen Server — nur eine eigene Kennung (Client-ID), die du dir einmal
 *   kostenlos in der Google Cloud Console anlegst.
 *
 * WAS DU EINMAL TUN MUSST   (steht auch in den Einstellungen)
 *   1. console.cloud.google.com öffnen, Projekt anlegen
 *   2. „APIs & Dienste → Anmeldedaten → OAuth-Client-ID → Webanwendung"
 *   3. Als autorisierten JavaScript-Ursprung und als Weiterleitungs-URI
 *      die Adresse eintragen, unter der diese App läuft
 *      (zum Beispiel http://localhost:8080)
 *   4. Die Client-ID hier in den Einstellungen einfügen
 *   5. Unter „APIs & Dienste → Bibliothek" Google Calendar API und
 *      Gmail API aktivieren
 *
 * WICHTIG: Der Token-Fluss braucht eine echte Adresse. Aus einer Datei
 * (file://) heraus geht es nicht — dann muss die App über einen kleinen
 * lokalen Server laufen. Ein Doppelklick auf „start.bat" reicht dafür.
 *
 * Alle Schlüssel bleiben in diesem Browser und gehen nur an den jeweiligen
 * Dienst — an sonst niemanden.
 * ==========================================================================*/

const Verbindungen = (() => {

  /* Das angeklickte Element — oder nichts. `e.target` ist `EventTarget | null`
     und muss ein `Element` sein, bevor `closest` daran etwas findet. Vorher
     stand hier ungeprüft `e.target.closest(…)`: bei einem Klick, dessen Ziel
     kein Element ist, warf das mitten im Behandeln. */
  const elVon = (e: Event): Element | null =>
    e.target instanceof Element ? e.target : null;

  const esc = (s: unknown): string => String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  /* ------------------------------------------------------------------------
   * DIENSTE
   * ----------------------------------------------------------------------*/
  const DIENSTE = [
    { id: 'google', name: 'Google', icon: '🔵',
      was: 'Kalender, Gmail und dein Profil',
      art: 'oauth',
      hinweis: 'Braucht eine eigene Client-ID aus der Google Cloud Console. Kostenlos.' },
    { id: 'github', name: 'GitHub', icon: '🐙',
      was: 'Issues und Pull Requests als Datenbank',
      art: 'token',
      woher: 'github.com/settings/tokens',
      hinweis: 'Ein feingranularer Token mit Leserecht auf Issues reicht.' },
    { id: 'jira', name: 'Jira', icon: '🟦',
      was: 'Vorgänge als Datenbank',
      art: 'token',
      woher: 'id.atlassian.com/manage-profile/security/api-tokens',
      hinweis: 'Adresse, E-Mail und API-Token. Atlassian blockt Browser oft — dann hilft die Brücke.' },
    { id: 'ics', name: 'Kalender-Abo', icon: '📅',
      was: 'Jeder Kalender mit ICS-Adresse — auch iCloud und Outlook',
      art: 'url',
      hinweis: 'Die Adresse steht beim Anbieter unter „Kalender veröffentlichen" oder „Geheime Adresse".' }
  ];

  /* Die Rechte, die wir bei Google anfragen. Weniger geht nicht, mehr braucht
     es nicht. Wer nur den Kalender will, schaltet Gmail in den Einstellungen ab. */
  const GOOGLE_RECHTE = {
    profil:   'openid email profile',
    kalender: 'https://www.googleapis.com/auth/calendar.events ' +
              'https://www.googleapis.com/auth/calendar.readonly',
    mail:     'https://www.googleapis.com/auth/gmail.readonly ' +
              'https://www.googleapis.com/auth/gmail.modify'
  };

  /* ------------------------------------------------------------------------
   * HILFSMITTEL
   * ----------------------------------------------------------------------*/
  const wert = (k: string, f = ''): string => Store.getMeta('verb:' + k, f);
  /*  gehört zum Paar mit  und wird von aussen gebraucht — es
     steht im Rückgabeobjekt unten. */

  /** Läuft die App über eine echte Adresse? Aus einer Datei geht kein OAuth. */
  const echteAdresse = () => location.protocol === 'http:' || location.protocol === 'https:';

  /**
   * Manche Dienste erlauben keinen Zugriff direkt aus dem Browser.
   * Wer eine Brücke hat (eigener kleiner Server), trägt sie ein; sonst
   * bleibt es bei einer klaren Fehlermeldung statt eines stummen Abbruchs.
   */
  const bruecke = (url: string): string => {
    let b = wert('proxy', '');
    /* Läuft die App auf einem Server, liegt die Brücke gleich daneben:
       Cloudflare Pages führt functions/api/bruecke.js von selbst aus.
       Wer etwas anderes einträgt, hat weiterhin Vorrang. */
    if (!b && echteAdresse()) b = location.origin + '/api/bruecke?ziel={url}';
    if (!b) return url;
    return b.includes('{url}') ? b.replace('{url}', encodeURIComponent(url))
                               : b.replace(/\/$/, '') + '/' + url;
  };

  /** Ein Fetch mit Wiederholung, Token im Kopf und verständlichem Fehler. */
  const ruf = async (url: string, opt: any = {}): Promise<Response> => {
    const kopf = Object.assign({}, opt.headers || {});
    if (opt.token) kopf['Authorization'] = 'Bearer ' + opt.token;
    if (opt.basic) kopf['Authorization'] = 'Basic ' + opt.basic;

    let r;
    try {
      r = await KI.holen(opt.ueberBruecke ? bruecke(url) : url,
        Object.assign({}, opt, { headers: kopf, token: undefined, basic: undefined,
                                 ueberBruecke: undefined }),
        { versuche: opt.versuche ?? 3 });
    } catch (e) {
      throw new Error('Keine Verbindung zu ' + neueUrl(url).hostname + '. ' +
        'Entweder ist das Netz weg, oder der Dienst erlaubt keinen Zugriff direkt aus dem ' +
        'Browser. In den Einstellungen lässt sich eine Brücke eintragen.');
    }
    if (!r.ok) {
      const txt = await r.text().catch(() => '');
      throw new Error(r.status + ' — ' + (KI.FEHLERTEXT[r.status] || 'Fehler') + ' ' + txt.slice(0, 200));
    }
    return r;
  };

  const neueUrl = (u: string): { hostname: string } => { try { return new URL(u); } catch { return { hostname: u }; } };

  const jsonRuf = async (url: string, opt?: any): Promise<any> => (await ruf(url, opt)).json();

  /* ========================================================================
   * GOOGLE — ANMELDUNG IM TOKEN-FLUSS
   * ======================================================================*/
  const googleId = () => Store.getMeta('api:googleClientId', '');

  /** Der Zugangsschlüssel samt Ablaufzeit. */
  const googleToken = () => {
    const t = Store.getMeta('google:token', null);
    if (!t || !t.zugang) return null;
    if (t.bis && Date.now() > t.bis - 60000) return null;   /* eine Minute Puffer */
    return t;
  };

  const googleAbgemeldet = () => Store.setMeta('google:token', null);

  /**
   * Öffnet Googles Anmeldefenster und wartet auf den Zugangsschlüssel.
   * Kein Geheimnis, kein Server — Google schickt den Schlüssel an genau die
   * Adresse zurück, die in der Cloud Console hinterlegt ist.
   */
  const googleFragen = (rechte: string): Promise<any> => new Promise((ok, fehler) => {
    const id = googleId();
    if (!id) {
      fehler(new Error('Es fehlt die Google-Client-ID. Einstellungen → Verbindungen.'));
      return;
    }
    if (!echteAdresse()) {
      fehler(new Error('Google lässt die Anmeldung nur von einer echten Adresse zu. ' +
        'Starte die App über „start.bat" und öffne sie unter http://localhost:8080.'));
      return;
    }

    const zurueck = location.origin + location.pathname;
    const zustand = Store.uid();
    const ziel = 'https://accounts.google.com/o/oauth2/v2/auth' +
      '?client_id=' + encodeURIComponent(id) +
      '&redirect_uri=' + encodeURIComponent(zurueck) +
      '&response_type=token' +
      '&scope=' + encodeURIComponent(rechte) +
      '&include_granted_scopes=true' +
      '&prompt=consent' +
      '&state=' + encodeURIComponent(zustand);

    const w = window.open(ziel, 'google-anmeldung', 'width=520,height=680');
    if (!w) { fehler(new Error('Das Anmeldefenster wurde blockiert. Bitte Pop-ups erlauben.')); return; }

    let fertig = false;
    const horcher = (e: MessageEvent) => {
      if (e.origin !== location.origin) return;
      const d = e.data || {};
      if (d.art !== 'oauth-antwort') return;
      if (d.state && d.state !== zustand) return;
      fertig = true;
      window.removeEventListener('message', horcher);
      clearInterval(wache);
      if (d.fehler) { fehler(new Error('Google meldet: ' + d.fehler)); return; }
      const token = {
        zugang: d.access_token,
        bis: Date.now() + (Number(d.expires_in || 3600) * 1000),
        rechte: d.scope || rechte
      };
      Store.setMeta('google:token', token);
      ok(token);
    };
    window.addEventListener('message', horcher);

    const wache = setInterval(() => {
      if (w.closed && !fertig) {
        clearInterval(wache);
        window.removeEventListener('message', horcher);
        fehler(new Error('Das Anmeldefenster wurde geschlossen.'));
      }
    }, 700);
  });

  /** Liefert einen gültigen Schlüssel — fragt nur, wenn nötig. */
  const googleZugang = async (bereiche: string[] = ['profil', 'kalender']): Promise<any> => {
    const da = googleToken();
    const gebraucht = bereiche.map(b => (GOOGLE_RECHTE as Record<string, string>)[b]).filter(Boolean).join(' ');
    if (da) {
      const fehltEtwas = gebraucht.split(' ').filter(Boolean)
        .some(r => !String(da.rechte || '').includes(r));
      if (!fehltEtwas) return da.zugang;
    }
    const neu = await googleFragen(gebraucht);
    return neu.zugang;
  };

  /** Anmelden und das Profil holen — Name und E-Mail kommen von Google. */
  const googleAnmelden = async (): Promise<any> => {
    const token = await googleZugang(['profil']);
    const p = await jsonRuf('https://www.googleapis.com/oauth2/v3/userinfo', { token });
    Store.setMeta('google:profil', p);
    return p;
  };

  const googleProfil = () => Store.getMeta('google:profil', null);

  /* ========================================================================
   * GITHUB
   * ======================================================================*/
  const githubToken = () => Store.getMeta('api:github', '');

  const githubRuf = (pfad: string, opt: any = {}): Promise<any> => jsonRuf(
    pfad.startsWith('http') ? pfad : 'https://api.github.com' + pfad,
    Object.assign({ token: githubToken(),
                    headers: { 'Accept': 'application/vnd.github+json',
                               'X-GitHub-Api-Version': '2022-11-28' } }, opt));

  const githubPruefen = async (): Promise<any> => {
    const u = await githubRuf('/user');
    return { name: u.login, voll: u.name || u.login };
  };

  /* ========================================================================
   * JIRA
   * ======================================================================*/
  const jiraRuf = (pfad: string): Promise<any> => {
    const basis = Store.getMeta('api:jiraUrl', '').replace(/\/$/, '');
    const mail  = Store.getMeta('api:jiraMail', '');
    const token = Store.getMeta('api:jira', '');
    if (!basis || !mail || !token) throw new Error('Für Jira fehlen Adresse, E-Mail oder Token.');
    return jsonRuf(basis + pfad, {
      basic: btoa(mail + ':' + token),
      headers: { 'Accept': 'application/json' },
      ueberBruecke: true
    });
  };

  /* ========================================================================
   * ZUSTAND — was ist verbunden?
   * ======================================================================*/
  const zustand = (): any => {
    const g = googleToken();
    const gp = googleProfil();
    return {
      google: { verbunden: !!g, id: !!googleId(), profil: gp,
                bis: g ? new Date(g.bis).toLocaleTimeString('de-DE') : '',
                rechte: g ? g.rechte : '' },
      github: { verbunden: !!githubToken() },
      jira:   { verbunden: !!Store.getMeta('api:jira', '') },
      ics:    { anzahl: (Store.getMeta('ics:abos', []) || []).length },
      adresse: echteAdresse(),
      bruecke: wert('proxy', '')
    };
  };

  /* ========================================================================
   * DER EINRICHTUNGSDIALOG
   * ======================================================================*/
  const dialog = (): void => {
    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML = '<div class="finder" style="width:min(720px,95vw)">' +
      '<div class="fh">🔌 Verbindungen<button class="icon-btn" data-a="zu">✕</button></div>' +
      '<div id="vb" style="padding:4px 18px 16px; max-height:72vh; overflow:auto"></div>' +
      '<div class="fbtns"><button data-a="zu" class="prim">Fertig</button></div></div>';
    document.body.appendChild(o);

    const zeichne = () => {
      const z = zustand();
      const vb = o.querySelector('#vb');
      if (!vb) return;
      vb.innerHTML =
        (!z.adresse
          ? '<div class="verb-warn">Diese Seite läuft als Datei. Google lässt die Anmeldung nur ' +
            'von einer echten Adresse zu. Starte <b>start.bat</b> im App-Ordner und öffne ' +
            '<b>http://localhost:8080</b> — dann geht alles.</div>'
          : '') +

        /* Google */
        '<div class="verb-karte">' +
          '<div class="verb-kopf"><span>🔵</span><b>Google</b>' +
            `<span class="verb-status ${z.google.verbunden ? 'an' : ''}">` +
            `${z.google.verbunden ? 'verbunden bis ' + esc(z.google.bis) : 'nicht verbunden'}</span></div>` +
          '<div class="verb-text">Kalender lesen und schreiben, Gmail lesen und beschriften, ' +
            'Name und E-Mail für dein Konto.</div>' +
          '<label>Client-ID<br><input type="password" data-set="api:googleClientId" ' +
            `value="${esc(Store.getMeta('api:googleClientId', ''))}" ` +
            'placeholder="123456789-abc.apps.googleusercontent.com"></label>' +
          (z.google.profil ? `<div class="verb-profil">Angemeldet als <b>${esc(z.google.profil.name)}</b> ` +
                             `· ${esc(z.google.profil.email)}</div>` : '') +
          '<div class="verb-knoepfe">' +
            '<button data-a="g-an">Verbinden</button>' +
            '<button data-a="g-kal">Nur Kalender</button>' +
            '<button data-a="g-mail">Kalender und Gmail</button>' +
            (z.google.verbunden ? '<button data-a="g-aus">Trennen</button>' : '') +
          '</div>' +
          '<details class="verb-hilfe"><summary>Wie komme ich an die Client-ID?</summary>' +
            '<ol>' +
              '<li>console.cloud.google.com öffnen und ein Projekt anlegen</li>' +
              '<li>APIs &amp; Dienste → Bibliothek: <b>Google Calendar API</b> und <b>Gmail API</b> aktivieren</li>' +
              '<li>APIs &amp; Dienste → Anmeldedaten → OAuth-Client-ID → <b>Webanwendung</b></li>' +
              `<li>Autorisierter JavaScript-Ursprung: <code>${esc(location.origin)}</code></li>` +
              `<li>Autorisierter Weiterleitungs-URI: <code>${esc(location.origin + location.pathname)}</code></li>` +
              '<li>Die erzeugte Client-ID hier einfügen. Das Geheimnis wird nicht gebraucht.</li>' +
            '</ol>' +
            '<p>Solange das Projekt auf „Testing" steht, musst du deine eigene Adresse unter ' +
            '„Zielgruppe → Testnutzer" eintragen.</p>' +
          '</details>' +
        '</div>' +

        /* GitHub */
        '<div class="verb-karte">' +
          '<div class="verb-kopf"><span>🐙</span><b>GitHub</b>' +
            `<span class="verb-status ${z.github.verbunden ? 'an' : ''}">` +
            `${z.github.verbunden ? 'Token hinterlegt' : 'nicht verbunden'}</span></div>` +
          '<div class="verb-text">Issues und Pull Requests als gespiegelte Datenbank.</div>' +
          '<label>Token<br><input type="password" data-set="api:github" ' +
            `value="${esc(Store.getMeta('api:github', ''))}" placeholder="github_pat_…"></label>` +
          '<label>Standard-Repository<br><input data-set="api:githubRepo" ' +
            `value="${esc(Store.getMeta('api:githubRepo', ''))}" placeholder="benutzer/projekt"></label>` +
          '<div class="verb-knoepfe"><button data-a="gh-test">Prüfen</button>' +
            '<button data-a="gh-hol">Issues holen</button></div>' +
        '</div>' +

        /* Jira */
        '<div class="verb-karte">' +
          '<div class="verb-kopf"><span>🟦</span><b>Jira</b>' +
            `<span class="verb-status ${z.jira.verbunden ? 'an' : ''}">` +
            `${z.jira.verbunden ? 'Token hinterlegt' : 'nicht verbunden'}</span></div>` +
          '<div class="verb-text">Vorgänge als gespiegelte Datenbank.</div>' +
          '<label>Adresse<br><input data-set="api:jiraUrl" ' +
            `value="${esc(Store.getMeta('api:jiraUrl', ''))}" placeholder="https://firma.atlassian.net"></label>` +
          '<label>E-Mail<br><input data-set="api:jiraMail" ' +
            `value="${esc(Store.getMeta('api:jiraMail', ''))}"></label>` +
          '<label>API-Token<br><input type="password" data-set="api:jira" ' +
            `value="${esc(Store.getMeta('api:jira', ''))}"></label>` +
          '<label>Projekt-Kürzel<br><input data-set="api:jiraProjekt" ' +
            `value="${esc(Store.getMeta('api:jiraProjekt', ''))}" placeholder="ABC"></label>` +
          '<div class="verb-knoepfe"><button data-a="ji-hol">Vorgänge holen</button></div>' +
        '</div>' +

        /* Brücke */
        '<div class="verb-karte">' +
          '<div class="verb-kopf"><span>🌉</span><b>Brücke</b>' +
            `<span class="verb-status ${z.bruecke ? 'an' : ''}">` +
            `${z.bruecke ? 'eingetragen' : 'keine'}</span></div>` +
          '<div class="verb-text">Manche Dienste — iCloud, Jira, viele Kalenderadressen — ' +
            'lassen den Browser nicht direkt heran. Wer einen kleinen eigenen Server hat, ' +
            'trägt ihn hier ein. <code>{url}</code> wird durch die Zieladresse ersetzt.</div>' +
          '<label>Adresse der Brücke<br><input data-set="verb:proxy" ' +
            `value="${esc(wert('proxy', ''))}" placeholder="http://localhost:8081/hol?ziel={url}"></label>` +
          '<div class="verb-text" style="margin-top:6px">Im App-Ordner liegt <b>bruecke.js</b> — ' +
            'ein Server in 40 Zeilen, der genau das tut. Starten mit <code>node bruecke.js</code>.</div>' +
        '</div>';
    };
    zeichne();

    o.addEventListener('input', e => {
      const el = elVon(e)?.closest<HTMLElement>('[data-set]');
      if (!el) return;
      if (!el.dataset["set"] || !(el instanceof HTMLInputElement)) return;
      Store.setMeta(el.dataset["set"], el.value.trim());
    });

    o.addEventListener('click', async e => {
      if (e.target === o || elVon(e)?.closest<HTMLElement>('[data-a="zu"]')) { o.remove(); return; }
      const b = elVon(e)?.closest<HTMLElement>('button[data-a]');
      if (!b) return;
      const a = b.dataset.a;
      try {
        if (a === 'g-an')   { await googleAnmelden(); UI.toast('Mit Google verbunden'); zeichne(); }
        if (a === 'g-kal')  { await googleZugang(['profil','kalender']); UI.toast('Kalender freigegeben'); zeichne(); }
        if (a === 'g-mail') { await googleZugang(['profil','kalender','mail']); UI.toast('Kalender und Gmail freigegeben'); zeichne(); }
        if (a === 'g-aus')  { googleAbgemeldet(); UI.toast('Verbindung getrennt'); zeichne(); }
        if (a === 'gh-test'){ const u = await githubPruefen(); UI.toast('GitHub: angemeldet als ' + u.name); }
        if (a === 'gh-hol') { o.remove(); Spiegel.githubDialog(); }
        if (a === 'ji-hol') { o.remove(); Spiegel.jiraDialog(); }
      } catch (err) {
        UI.banner(err instanceof Error ? err.message : String(err), 'warn');
      }
    });
  };

  return { DIENSTE, GOOGLE_RECHTE, zustand, dialog, echteAdresse, bruecke,
           ruf, jsonRuf, googleZugang, googleAnmelden, googleToken, googleProfil,
           googleAbgemeldet, googleId, githubRuf, githubPruefen, githubToken, jiraRuf };
})();

(window as any).Verbindungen = Verbindungen;
