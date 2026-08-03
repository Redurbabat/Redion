/* ==========================================================================
 * server/kern.js — Der Server, ohne zu wissen wo er läuft
 * --------------------------------------------------------------------------
 * Hier steht alles, was Redion serverseitig kann. Der Code weiss nicht, ob
 * er auf Cloudflare läuft oder in einem Prüflauf: er bekommt eine Anfrage
 * und eine Ablage und gibt eine Antwort zurück.
 *
 * WAS DER SERVER TUT
 *   · Konten und Anmeldung (GitHub, Google, Gerätecode)
 *   · Abgleich zwischen Geräten
 *   · Rechte durchsetzen — nicht anzeigen, durchsetzen
 *   · Seiten ins Netz stellen
 *   · Die Schnittstelle /v1/ von aussen
 *   · MCP-Anfragen entgegennehmen
 *
 * WAS ER NICHT TUT
 *   Er liest keine privaten Seiten. Die kommen verschlüsselt an und gehen
 *   verschlüsselt wieder heraus; der Schlüssel bleibt auf dem Gerät. Nur was
 *   ausdrücklich geteilt oder veröffentlicht wird, kommt im Klartext — denn
 *   sonst könnte er weder Rechte prüfen noch eine Seite ausliefern.
 *
 *   Und ohne Konto tut er gar nichts. Redion läuft weiter ganz allein auf
 *   dem Gerät; der Server ist ein Angebot, keine Voraussetzung.
 * ========================================================================*/

/* ==========================================================================
 * 1 · KLEINE HELFER
 * ========================================================================*/

export const jetzt = () => new Date().toISOString();

export const kennung = () => {
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  return [...b].map(x => x.toString(16).padStart(2, '0')).join('');
};

/** Ein kurzer, gut vorlesbarer Code — für die Anmeldung am Telefon. */
export const codeKurz = () => {
  /* Ohne I, O, 0 und 1: die verwechselt man am Telefon zu leicht. */
  const zeichen = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const b = new Uint8Array(8);
  crypto.getRandomValues(b);
  return [...b].map(x => zeichen[x % zeichen.length]).join('')
    .replace(/^(.{4})/, '$1-');
};

export const antwort = (status, koerper, kopf = {}) => ({
  status,
  kopf: { 'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store', ...kopf },
  koerper: typeof koerper === 'string' ? koerper : JSON.stringify(koerper)
});

export const fehler = (status, code, text) =>
  antwort(status, { object: 'error', status, code, message: text });

/* Zeitkonstanter Vergleich — sonst verrät die Dauer, wie viel vom Token stimmt. */
export const gleich = (a, b) => {
  const x = String(a ?? ''), y = String(b ?? '');
  if (x.length !== y.length) return false;
  let d = 0;
  for (let i = 0; i < x.length; i++) d |= x.charCodeAt(i) ^ y.charCodeAt(i);
  return d === 0;
};

/* Ein Token wird nie im Klartext abgelegt — nur sein Fingerabdruck. Wer die
   Datenbank in die Hand bekommt, kann sich damit trotzdem nicht anmelden. */
export const abdruck = async (text) => {
  const daten = new TextEncoder().encode(String(text));
  const h = await crypto.subtle.digest('SHA-256', daten);
  return [...new Uint8Array(h)].map(x => x.toString(16).padStart(2, '0')).join('');
};

/* ==========================================================================
 * 2 · ROLLEN — dieselben fünf wie in der App
 * ========================================================================*/
export const ROLLEN = {
  voll:  { rang: 5, darf: ['lesen', 'kommentieren', 'bearbeiten', 'teilen', 'loeschen', 'rechte'] },
  edit:  { rang: 4, darf: ['lesen', 'kommentieren', 'bearbeiten'] },
  komm:  { rang: 3, darf: ['lesen', 'kommentieren'] },
  lesen: { rang: 2, darf: ['lesen'] },
  kein:  { rang: 1, darf: [] }
};

export const darf = (rolle, was) => (ROLLEN[rolle] || ROLLEN.kein).darf.includes(was);

/* ==========================================================================
 * 3 · WER FRAGT DA? — Sitzung oder Marke
 * ========================================================================*/

/**
 * Prüft die Kopfzeile Authorization. Zwei Arten:
 *   Bearer sit_…    eine Sitzung  (Mensch am Gerät)
 *   Bearer red_…    eine Marke    (Programm, Schnittstelle)
 * Gibt { konto, sitzung|marke, rechte } oder null.
 */
export const werFragt = async (ablage, kopf) => {
  const roh = String(kopf.authorization || '').replace(/^Bearer\s+/i, '').trim();
  if (!roh) return null;
  const fp = await abdruck(roh);

  if (roh.startsWith('sit_')) {
    const s = await ablage.hole('sitzungen', { token: fp });
    if (!s) return null;
    if (s.bis && s.bis < jetzt()) { await ablage.weg('sitzungen', { token: fp }); return null; }
    const k = await ablage.hole('konten', { id: s.kontoId });
    if (!k || k.gesperrt) return null;
    return { konto: k, sitzung: s, rechte: ['alles'] };
  }

  if (roh.startsWith('red_')) {
    const m = await ablage.hole('marken', { wert: fp });
    if (!m) return null;
    if (m.bis && m.bis < jetzt()) return null;
    const k = await ablage.hole('konten', { id: m.kontoId });
    if (!k || k.gesperrt) return null;
    /* Wann die Marke zuletzt benutzt wurde — dann sieht man tote Marken. */
    await ablage.setze('marken', { ...m, benutzt: jetzt() });
    return { konto: k, marke: m, rechte: String(m.rechte || 'lesen').split(',') };
  }

  return null;
};

/**
 * Welche Rolle hat dieses Konto auf dieser Seite?
 * Sucht von der Seite aufwärts — wie in der App, nur dass es hier zählt.
 */
export const rolleAuf = async (ablage, bereichId, seiteId, kontoId) => {
  const bereich = await ablage.hole('bereiche', { id: bereichId });
  if (!bereich) return 'kein';
  if (bereich.besitzer === kontoId) return 'voll';

  /* Erst die Seite selbst, dann ihre Eltern, dann der ganze Bereich */
  let id = seiteId, tiefe = 0;
  while (id && tiefe++ < 40) {
    const f = await ablage.hole('freigaben', { bereich: bereichId, seite: id, kontoId });
    if (f) return f.rolle;
    const jeder = await ablage.hole('freigaben', { bereich: bereichId, seite: id, kontoId: '*' });
    if (jeder) return jeder.rolle;
    const satz = await ablage.hole('saetze', { bereich: bereichId, id });
    if (!satz) break;
    let eltern = null;
    try { eltern = JSON.parse(satz.daten || '{}').parentId; } catch {}
    id = eltern;
  }
  /* Zuletzt: eine Freigabe für den ganzen Bereich */
  const ganz = await ablage.hole('freigaben', { bereich: bereichId, seite: '*', kontoId });
  if (ganz) return ganz.rolle;
  const ganzJeder = await ablage.hole('freigaben', { bereich: bereichId, seite: '*', kontoId: '*' });
  return ganzJeder ? ganzJeder.rolle : 'kein';
};

/* ==========================================================================
 * 4 · PROTOKOLL — auf dem Server, wo es niemand mehr löschen kann
 * --------------------------------------------------------------------------
 * Das ist der Unterschied zum Protokoll in der App: dieses hier liegt nicht
 * beim Besitzer. Wer seine eigenen Spuren verwischen will, kommt nicht daran.
 * ========================================================================*/
export const notieren = async (ablage, { bereich, kontoId, art, text, objekt }) => {
  const e = { id: kennung(), bereich: bereich || '', kontoId: kontoId || '',
              art: art || 'sonstiges', text: String(text || '').slice(0, 500),
              objekt: objekt || '', wann: jetzt() };
  try { await ablage.setze('protokoll', e); } catch {}
  return e;
};

/* ==========================================================================
 * 5 · DER BEANTWORTER
 * ========================================================================*/

const teile = (pfad) => String(pfad).replace(/^\/+|\/+$/g, '').split('/');

/**
 * @param {object} a       { methode, pfad, kopf, koerper, suche }
 * @param {object} ablage  eine Ablage aus ablage.js
 * @param {object} umwelt  { GITHUB_ID, GITHUB_GEHEIM, GOOGLE_ID, …, holen }
 */
export const beantworte = async (a, ablage, umwelt = {}) => {
  const m = String(a.methode || 'GET').toUpperCase();
  const t = teile(a.pfad || '/');
  const kopf = a.kopf || {};
  const k = a.koerper || {};
  const suche = a.suche || {};

  /* CORS: die App darf von überall her fragen, aber nur mit Token —
     ohne Token nützt eine erlaubte Herkunft niemandem etwas. */
  if (m === 'OPTIONS') return antwort(204, '', {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, Notion-Version, Redion-Geraet',
    'Access-Control-Max-Age': '86400'
  });

  try {
    /* --- Lebenszeichen ------------------------------------------------- */
    if (t[0] === 'api' && t[1] === 'stand') {
      return antwort(200, {
        app: 'Redion', stand: 'läuft', ablage: ablage.art,
        konten: await ablage.zaehle('konten'),
        hinweis: 'Private Seiten liegen hier verschlüsselt. Der Schlüssel bleibt auf dem Gerät.'
      }, { 'Access-Control-Allow-Origin': '*' });
    }

    /* --- Öffentliche Seiten: das Einzige ohne Token --------------------- */
    if (t[0] === 's' && t[1]) return await oeffentlichZeigen(ablage, t[1], suche);

    /* --- Anmeldung ------------------------------------------------------ */
    if (t[0] === 'konto') return await kontoWeg(a, ablage, umwelt, t, m, k, kopf, suche);

    /* Ab hier braucht alles ein Token. */
    const wer = await werFragt(ablage, kopf);
    if (!wer) return fehler(401, 'unauthorized',
      'Ohne gültiges Token geht hier nichts. Melde dich in Redion an oder lege eine Marke an.');

    if (t[0] === 'sync')     return await syncWeg(a, ablage, wer, t, m, k, kopf);
    if (t[0] === 'freigabe') return await freigabeWeg(a, ablage, wer, t, m, k);
    if (t[0] === 'feldrecht') return await feldrechtWeg(a, ablage, wer, t, m, k);
    if (t[0] === 'veroeffentlichen') return await veroeffentlichenWeg(a, ablage, wer, t, m, k, umwelt);
    if (t[0] === 'bereich')  return await bereichWeg(a, ablage, wer, t, m, k);
    if (t[0] === 'protokoll')return await protokollWeg(a, ablage, wer, t, m, suche);
    if (t[0] === 'marken')   return await markenWeg(a, ablage, wer, t, m, k);
    if (t[0] === 'v1')       return await v1Weg(a, ablage, wer, t, m, k, kopf, suche);
    if (t[0] === 'mcp')      return await mcpWeg(a, ablage, wer, m, k);

    return fehler(404, 'object_not_found', 'Diesen Weg gibt es nicht: /' + t.join('/'));
  } catch (e) {
    return fehler(500, 'internal_server_error', e.message || String(e));
  }
};

/* ==========================================================================
 * 6 · KONTO UND ANMELDUNG
 * --------------------------------------------------------------------------
 * Drei Wege hinein:
 *   1. GitHub    — für alle, die ohnehin dort sind
 *   2. Google    — dasselbe
 *   3. Gerätecode — der Rechner zeigt einen Code, das Telefon tippt ihn ein
 *
 * Alle drei sind kostenlos. Ein Passwort gibt es bewusst nicht: dann gibt es
 * auch keines zu verlieren.
 * ========================================================================*/
const kontoWeg = async (a, ablage, umwelt, t, m, k, kopf, suche) => {
  const was = t[1];

  /* --- Wer bin ich? --------------------------------------------------- */
  if (was === 'ich') {
    const wer = await werFragt(ablage, kopf);
    if (!wer) return fehler(401, 'unauthorized', 'Nicht angemeldet.');
    const bereiche = await ablage.finde('bereiche', { besitzer: wer.konto.id });
    const geteilte = await ablage.finde('freigaben', { kontoId: wer.konto.id });
    return antwort(200, {
      konto: { id: wer.konto.id, name: wer.konto.name, mail: wer.konto.mail,
               bild: wer.konto.bild, herkunft: wer.konto.herkunft },
      bereiche: bereiche.map(b => ({ id: b.id, name: b.name, rolle: 'voll' })),
      geteilt: geteilte.length,
      art: wer.sitzung ? 'sitzung' : 'marke'
    }, { 'Access-Control-Allow-Origin': '*' });
  }

  /* --- Abmelden -------------------------------------------------------- */
  if (was === 'abmelden' && m === 'POST') {
    const roh = String(kopf.authorization || '').replace(/^Bearer\s+/i, '').trim();
    if (roh) await ablage.weg('sitzungen', { token: await abdruck(roh) });
    return antwort(200, { ok: true }, { 'Access-Control-Allow-Origin': '*' });
  }

  /* --- Gerätecode: der Rechner fragt nach einem Code ------------------- */
  if (was === 'code' && m === 'POST') {
    const code = codeKurz();
    const satz = { wert: await abdruck(code), art: 'geraetecode', kontoId: '',
                   bereich: '', name: String(k.geraet || 'Unbekanntes Gerät').slice(0, 60),
                   rechte: '', angelegt: jetzt(),
                   bis: new Date(Date.now() + 10 * 60000).toISOString(), benutzt: '' };
    await ablage.setze('marken', satz);
    return antwort(200, { code, gueltigBis: satz.bis,
      hinweis: 'Diesen Code auf dem angemeldeten Gerät eingeben. Zehn Minuten gültig.' },
      { 'Access-Control-Allow-Origin': '*' });
  }

  /* --- Gerätecode: das angemeldete Gerät gibt ihn frei ----------------- */
  if (was === 'code-freigeben' && m === 'POST') {
    const wer = await werFragt(ablage, kopf);
    if (!wer) return fehler(401, 'unauthorized', 'Zum Freigeben musst du angemeldet sein.');
    const fp = await abdruck(String(k.code || '').trim().toUpperCase());
    const marke = await ablage.hole('marken', { wert: fp });
    if (!marke || marke.art !== 'geraetecode')
      return fehler(404, 'object_not_found', 'Diesen Code gibt es nicht.');
    if (marke.bis < jetzt()) return fehler(410, 'expired', 'Der Code ist abgelaufen.');
    await ablage.setze('marken', { ...marke, kontoId: wer.konto.id, benutzt: jetzt() });
    await notieren(ablage, { kontoId: wer.konto.id, art: 'konto',
      text: 'Gerät freigegeben: ' + marke.name });
    return antwort(200, { ok: true }, { 'Access-Control-Allow-Origin': '*' });
  }

  /* --- Gerätecode: der Rechner fragt, ob es schon so weit ist ---------- */
  if (was === 'code-holen' && m === 'POST') {
    const fp = await abdruck(String(k.code || '').trim().toUpperCase());
    const marke = await ablage.hole('marken', { wert: fp });
    if (!marke) return fehler(404, 'object_not_found', 'Diesen Code gibt es nicht.');
    if (marke.bis < jetzt()) return fehler(410, 'expired', 'Der Code ist abgelaufen.');
    if (!marke.kontoId) return antwort(202, { wartet: true },
      { 'Access-Control-Allow-Origin': '*' });
    await ablage.weg('marken', { wert: fp });   /* ein Code, ein Gerät */
    return await sitzungGeben(ablage, marke.kontoId, marke.name);
  }

  /* --- OAuth: den Menschen zum Anbieter schicken ----------------------- */
  if (was === 'oauth' && t[2] && !t[3]) {
    const anbieter = t[2];
    const zurueck = String(suche.zurueck || umwelt.ADRESSE || '');
    const staat = kennung();
    await ablage.setze('marken', { wert: await abdruck(staat), art: 'oauth-staat',
      kontoId: '', bereich: '', name: anbieter, rechte: zurueck, angelegt: jetzt(),
      bis: new Date(Date.now() + 10 * 60000).toISOString(), benutzt: '' });

    const ziel = zurueck.replace(/\/+$/, '') + '/konto/oauth/' + anbieter + '/zurueck';
    if (anbieter === 'github') {
      if (!umwelt.GITHUB_ID) return fehler(503, 'nicht_eingerichtet',
        'GitHub-Anmeldung ist noch nicht eingerichtet. Siehe SERVER-EINRICHTEN.md.');
      return antwort(302, '', { 'Access-Control-Allow-Origin': '*',
        Location: 'https://github.com/login/oauth/authorize?client_id=' +
          encodeURIComponent(umwelt.GITHUB_ID) + '&scope=read:user%20user:email' +
          '&state=' + staat + '&redirect_uri=' + encodeURIComponent(ziel) });
    }
    if (anbieter === 'google') {
      if (!umwelt.GOOGLE_ID) return fehler(503, 'nicht_eingerichtet',
        'Google-Anmeldung ist noch nicht eingerichtet. Siehe SERVER-EINRICHTEN.md.');
      return antwort(302, '', { 'Access-Control-Allow-Origin': '*',
        Location: 'https://accounts.google.com/o/oauth2/v2/auth?client_id=' +
          encodeURIComponent(umwelt.GOOGLE_ID) + '&response_type=code' +
          '&scope=openid%20email%20profile&state=' + staat +
          '&redirect_uri=' + encodeURIComponent(ziel) });
    }
    return fehler(404, 'object_not_found', 'Diesen Anbieter gibt es nicht: ' + anbieter);
  }

  /* --- OAuth: der Anbieter schickt zurück ------------------------------ */
  if (was === 'oauth' && t[3] === 'zurueck') {
    const anbieter = t[2];
    const staat = String(suche.state || '');
    const code = String(suche.code || '');
    if (!code) return fehler(400, 'validation_error',
      'Der Anbieter hat keinen Code mitgeschickt: ' + (suche.error || 'ohne Angabe'));

    const gemerkt = await ablage.hole('marken', { wert: await abdruck(staat) });
    if (!gemerkt || gemerkt.art !== 'oauth-staat' || gemerkt.name !== anbieter)
      return fehler(400, 'validation_error',
        'Die Rückmeldung passt zu keiner Anfrage. Bitte noch einmal anmelden.');
    if (gemerkt.bis < jetzt())
      return fehler(410, 'expired', 'Die Anmeldung hat zu lange gedauert.');
    await ablage.weg('marken', { wert: await abdruck(staat) });

    const zurueck = gemerkt.rechte || umwelt.ADRESSE || '';
    const ziel = zurueck.replace(/\/+$/, '') + '/konto/oauth/' + anbieter + '/zurueck';
    const profil = await oauthProfil(anbieter, code, ziel, umwelt);
    if (!profil.ok) return fehler(502, 'anbieter_fehler', profil.fehler);

    /* Konto suchen oder anlegen — die Mail ist der Schlüssel. */
    const vorhanden = (await ablage.finde('konten', { mail: profil.mail }))[0];
    const konto = vorhanden || { id: kennung(), mail: profil.mail, name: profil.name,
      bild: profil.bild, herkunft: anbieter, angelegt: jetzt(), gesperrt: 0 };
    if (!vorhanden) {
      await ablage.setze('konten', konto);
      await notieren(ablage, { kontoId: konto.id, art: 'konto',
        text: 'Konto angelegt über ' + anbieter });
    } else if (profil.name && profil.name !== konto.name) {
      konto.name = profil.name; konto.bild = profil.bild;
      await ablage.setze('konten', konto);
    }
    return await sitzungGeben(ablage, konto.id, 'über ' + anbieter, zurueck);
  }

  return fehler(404, 'object_not_found', 'Unbekannter Kontoweg: ' + (was || ''));
};

/** Holt beim Anbieter das Profil ab. */
const oauthProfil = async (anbieter, code, ziel, umwelt) => {
  const holen = umwelt.holen || fetch;
  try {
    if (anbieter === 'github') {
      const t = await (await holen('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ client_id: umwelt.GITHUB_ID,
          client_secret: umwelt.GITHUB_GEHEIM, code, redirect_uri: ziel })
      })).json();
      if (!t.access_token) return { ok: false, fehler: t.error_description || 'Kein Token' };
      const kopf = { Authorization: 'Bearer ' + t.access_token,
                     'User-Agent': 'Redion', Accept: 'application/vnd.github+json' };
      const u = await (await holen('https://api.github.com/user', { headers: kopf })).json();
      let mail = u.email;
      if (!mail) {
        const liste = await (await holen('https://api.github.com/user/emails', { headers: kopf })).json();
        const haupt = Array.isArray(liste) && liste.find(x => x.primary && x.verified);
        mail = haupt ? haupt.email : (u.login + '@users.noreply.github.com');
      }
      return { ok: true, mail, name: u.name || u.login, bild: u.avatar_url || '' };
    }

    if (anbieter === 'google') {
      const p = new URLSearchParams({ code, client_id: umwelt.GOOGLE_ID,
        client_secret: umwelt.GOOGLE_GEHEIM, redirect_uri: ziel,
        grant_type: 'authorization_code' });
      const t = await (await holen('https://oauth2.googleapis.com/token', {
        method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: p.toString() })).json();
      if (!t.access_token) return { ok: false, fehler: t.error_description || 'Kein Token' };
      const u = await (await holen('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: 'Bearer ' + t.access_token } })).json();
      if (!u.email_verified && !u.email)
        return { ok: false, fehler: 'Google hat keine geprüfte Adresse geliefert' };
      return { ok: true, mail: u.email, name: u.name || u.email, bild: u.picture || '' };
    }
    return { ok: false, fehler: 'Unbekannter Anbieter' };
  } catch (e) {
    return { ok: false, fehler: e.message || String(e) };
  }
};

/** Eine Sitzung anlegen und zurückgeben — als JSON oder als Weiterleitung. */
const sitzungGeben = async (ablage, kontoId, geraet, weiterZu) => {
  const roh = 'sit_' + kennung() + kennung();
  const dreissigTage = new Date(Date.now() + 30 * 86400000).toISOString();
  await ablage.setze('sitzungen', { token: await abdruck(roh), kontoId,
    geraet: String(geraet || '').slice(0, 60), angelegt: jetzt(), bis: dreissigTage });

  /* Beim ersten Anmelden bekommt jeder einen eigenen Bereich. */
  const eigene = await ablage.finde('bereiche', { besitzer: kontoId });
  if (!eigene.length) {
    await ablage.setze('bereiche', { id: kennung(), name: 'Mein Bereich',
      besitzer: kontoId, angelegt: jetzt() });
  }
  const konto = await ablage.hole('konten', { id: kontoId });
  const bereiche = await ablage.finde('bereiche', { besitzer: kontoId });

  if (weiterZu) {
    /* Der Schlüssel darf nicht in der Adresse stehen — sonst landet er im
       Verlauf und in jedem Protokoll dazwischen. Deshalb eine kleine Seite,
       die ihn an das wartende Fenster weitergibt. */
    const seite = '<!doctype html><meta charset="utf-8"><title>Angemeldet</title>' +
      '<style>body{font:15px system-ui;padding:44px;text-align:center;' +
      'background:#191a1e;color:#e8e8ea}</style>' +
      '<p>Angemeldet. Dieses Fenster kann zu.</p><script>' +
      'try{opener&&opener.postMessage(' +
      JSON.stringify({ art: 'redion-anmeldung', token: roh }) +
      ',"*")}catch(e){}setTimeout(function(){window.close()},300);</script>';
    return { status: 200,
             kopf: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
             koerper: seite };
  }
  return antwort(200, { token: roh, bis: dreissigTage,
    konto: { id: konto.id, name: konto.name, mail: konto.mail, bild: konto.bild },
    bereiche: bereiche.map(b => ({ id: b.id, name: b.name })) },
    { 'Access-Control-Allow-Origin': '*' });
};

/**
 * Hat dieses Konto in diesem Bereich überhaupt irgendein Recht?
 *
 * Wichtig, weil jemand auf einer einzelnen Unterseite Vollzugriff haben kann,
 * ohne den Bereich als Ganzes zu sehen. Wer nur die Bereichsrolle prüft,
 * sperrt genau diese Leute aus — und das war hier zuerst der Fall.
 */
export const irgendeinRecht = async (ablage, bereichId, kontoId) => {
  const b = await ablage.hole('bereiche', { id: bereichId });
  if (b && b.besitzer === kontoId) return true;
  const meine = await ablage.finde('freigaben', { bereich: bereichId, kontoId });
  if (meine.some(f => f.rolle && f.rolle !== 'kein')) return true;
  const fuerAlle = await ablage.finde('freigaben', { bereich: bereichId, kontoId: '*' });
  return fuerAlle.some(f => f.rolle && f.rolle !== 'kein');
};

/* ==========================================================================
 * 7 · ABGLEICH
 * --------------------------------------------------------------------------
 * Zwei Wege: hoch und runter. Beide arbeiten mit einer Marke — dem Zeitpunkt
 * der letzten Änderung, die das Gerät schon kennt. Wer länger weg war, holt
 * eben mehr; wer gerade erst da war, holt nichts.
 *
 * Konflikte: gewinnt die höhere Version, bei gleicher Version die spätere
 * Änderung. Das ist einfach, nachvollziehbar und verliert im schlimmsten
 * Fall eine Änderung — nicht die ganze Seite. Wer es genauer braucht, sieht
 * beide Fassungen im Versionsverlauf.
 * ========================================================================*/
const syncWeg = async (a, ablage, wer, t, m, k, kopf) => {
  const bereichId = String(k.bereich || a.suche?.bereich || '');
  const bereich = bereichId ? await ablage.hole('bereiche', { id: bereichId }) : null;
  if (!bereich) return fehler(404, 'object_not_found',
    'Diesen Bereich gibt es nicht. Erst /bereich anlegen.');

  const meine = await rolleAuf(ablage, bereichId, '*', wer.konto.id);
  const geraet = String(kopf['redion-geraet'] || 'Unbekannt').slice(0, 60);

  /* --- Herunterladen --------------------------------------------------
   * Geprüft wird nicht die Bereichsrolle, sondern ob es überhaupt ein Recht
   * gibt — und dann jede Seite einzeln. Sonst käme jemand, der nur auf einer
   * Unterseite eingeladen ist, gar nicht erst durch die Tür.
   * ------------------------------------------------------------------- */
  if (t[1] === 'runter' && m === 'POST') {
    if (!(await irgendeinRecht(ablage, bereichId, wer.konto.id)))
      return fehler(403, 'restricted_resource',
        'In diesem Bereich hast du kein einziges Recht.');

    const seit = String(k.seit || '');
    const alle = await ablage.finde('saetze', { bereich: bereichId },
      { geaendertNach: seit || undefined, sortiere: 'geaendert', grenze: Number(k.grenze) || 500 });

    /* Wer nicht alles darf, bekommt auch nicht alles. Geprüft wird je Seite. */
    const besitzer = wer.konto.id === bereich.besitzer;
    const raus = [];
    for (const s of alle) {
      let nimm = s;
      if (meine !== 'voll') {
        const r = await rolleAuf(ablage, bereichId, s.seite || s.id, wer.konto.id);
        if (!darf(r, 'lesen')) continue;
      }
      /* Und dann noch die einzelnen Spalten — die Seite darf er sehen,
         das Gehalt darin womöglich nicht. */
      if (!besitzer) nimm = await feldFilter(ablage, bereichId, wer.konto.id, s);
      raus.push(nimm);
    }

    const neueste = raus.length ? raus[raus.length - 1].geaendert : seit;
    return antwort(200, {
      saetze: raus.map(s => ({ id: s.id, tabelle: s.tabelle, daten: s.daten,
        verschluesselt: !!s.verschluesselt, version: s.version,
        geaendert: s.geaendert, geloescht: !!s.geloescht })),
      marke: neueste, mehr: raus.length >= (Number(k.grenze) || 500), rolle: meine
    }, { 'Access-Control-Allow-Origin': '*' });
  }

  /* --- Hochladen ------------------------------------------------------- */
  if (t[1] === 'hoch' && m === 'POST') {
    if (!(await irgendeinRecht(ablage, bereichId, wer.konto.id)))
      return fehler(403, 'restricted_resource',
        'In diesem Bereich hast du kein einziges Recht.');

    const liste = Array.isArray(k.saetze) ? k.saetze : [];
    if (liste.length > 500) return fehler(413, 'zu_viel',
      'Höchstens 500 Sätze auf einmal — sonst wird die Antwort zu gross.');

    const angenommen = [], abgelehnt = [], angepasst = [];
    for (const s of liste) {
      if (!s || !s.id) { abgelehnt.push({ id: s && s.id, grund: 'ohne Kennung' }); continue; }

      /* Recht je Seite, nicht nur je Bereich */
      if (meine !== 'voll') {
        const r = await rolleAuf(ablage, bereichId, s.seite || s.id, wer.konto.id);
        if (!darf(r, 'bearbeiten')) {
          abgelehnt.push({ id: s.id, grund: 'kein Schreibrecht auf dieser Seite' });
          continue;
        }
      }

      const alt = await ablage.hole('saetze', { bereich: bereichId, id: s.id });
      const neueVersion = Number(s.version) || 1;
      if (alt) {
        const alteVersion = Number(alt.version) || 1;
        if (neueVersion < alteVersion ||
            (neueVersion === alteVersion && String(s.geaendert || '') < String(alt.geaendert || ''))) {
          abgelehnt.push({ id: s.id, grund: 'veraltet', hier: alt.version,
                           geaendert: alt.geaendert });
          continue;
        }
      }
      /* Spalten, die er nicht ändern darf, kommen auf ihren alten Wert
         zurück — der Rest der Zeile geht trotzdem durch. Alles abzulehnen
         hiesse, eine erlaubte Änderung wegen einer unerlaubten zu verlieren. */
      let daten = String(s.daten ?? '');
      if (wer.konto.id !== bereich.besitzer) {
        const sch = await feldSchutz(ablage, bereichId, wer.konto.id, s, alt);
        if (sch.zurueck.length) {
          daten = sch.daten;
          angepasst.push({ id: s.id, felder: sch.zurueck,
            grund: 'Spalten ohne Schreibrecht: ' + sch.zurueck.join(', ') });
        }
      }

      await ablage.setze('saetze', {
        id: s.id, bereich: bereichId, tabelle: String(s.tabelle || 'blocks'),
        daten, verschluesselt: s.verschluesselt ? 1 : 0,
        seite: String(s.seite || s.id), version: neueVersion,
        geaendert: s.geaendert || jetzt(), geloescht: s.geloescht ? 1 : 0,
        vonGeraet: geraet
      });
      angenommen.push(s.id);
    }

    if (angenommen.length)
      await notieren(ablage, { bereich: bereichId, kontoId: wer.konto.id, art: 'sync',
        text: angenommen.length + ' Sätze abgeglichen', objekt: geraet });

    return antwort(200, { angenommen: angenommen.length, abgelehnt, angepasst,
      marke: jetzt() }, { 'Access-Control-Allow-Origin': '*' });
  }

  return fehler(404, 'object_not_found', 'Unbekannter Abgleichweg.');
};

/* ==========================================================================
 * 8 · BEREICHE UND BESITZ
 * ========================================================================*/
const bereichWeg = async (a, ablage, wer, t, m, k) => {
  /* Anlegen */
  if (m === 'POST' && !t[1]) {
    const b = { id: kennung(), name: String(k.name || 'Neuer Bereich').slice(0, 80),
                besitzer: wer.konto.id, angelegt: jetzt() };
    await ablage.setze('bereiche', b);
    await notieren(ablage, { bereich: b.id, kontoId: wer.konto.id, art: 'bereich',
      text: 'Bereich „' + b.name + '" angelegt' });
    return antwort(200, b, { 'Access-Control-Allow-Origin': '*' });
  }

  /* Auflisten */
  if (m === 'GET' && !t[1]) {
    const eigene = await ablage.finde('bereiche', { besitzer: wer.konto.id });
    const fremde = [];
    for (const f of await ablage.finde('freigaben', { kontoId: wer.konto.id })) {
      const b = await ablage.hole('bereiche', { id: f.bereich });
      if (b && b.besitzer !== wer.konto.id && !fremde.some(x => x.id === b.id))
        fremde.push({ id: b.id, name: b.name, rolle: f.rolle, besitzer: b.besitzer });
    }
    return antwort(200, { eigene: eigene.map(b => ({ ...b, rolle: 'voll' })), fremde },
      { 'Access-Control-Allow-Origin': '*' });
  }

  const bereich = t[1] ? await ablage.hole('bereiche', { id: t[1] }) : null;
  if (!bereich) return fehler(404, 'object_not_found', 'Diesen Bereich gibt es nicht.');

  /* --- Besitzerwechsel ------------------------------------------------
   * Nur der Besitzer selbst darf übergeben, und nur an ein Konto, das es
   * schon gibt. Der alte Besitzer behält Vollzugriff — sonst schliesst man
   * sich mit einem Klick aus der eigenen Arbeit aus.
   * ------------------------------------------------------------------ */
  if (t[2] === 'besitz' && m === 'POST') {
    if (bereich.besitzer !== wer.konto.id)
      return fehler(403, 'restricted_resource', 'Nur der Besitzer kann übergeben.');
    const ziel = String(k.an || '');
    const neuer = (await ablage.finde('konten', { mail: ziel }))[0] ||
                  await ablage.hole('konten', { id: ziel });
    if (!neuer) return fehler(404, 'object_not_found',
      'Dieses Konto gibt es nicht. Der neue Besitzer muss sich einmal angemeldet haben.');
    if (neuer.id === bereich.besitzer)
      return fehler(400, 'validation_error', 'Der ist schon Besitzer.');

    await ablage.setze('bereiche', { ...bereich, besitzer: neuer.id });
    await ablage.setze('freigaben', { bereich: bereich.id, seite: '*',
      kontoId: wer.konto.id, rolle: 'voll', von: neuer.id, wann: jetzt() });
    await notieren(ablage, { bereich: bereich.id, kontoId: wer.konto.id, art: 'besitz',
      text: 'Besitz übergeben an ' + (neuer.mail || neuer.id), objekt: neuer.id });
    return antwort(200, { ok: true, besitzer: neuer.id,
      hinweis: 'Du behältst Vollzugriff — abgeben heisst nicht aussperren.' },
      { 'Access-Control-Allow-Origin': '*' });
  }

  /* --- Verwaltungssuche: eine Seite über ihre Kennung finden ---------- */
  if (t[2] === 'suche' && m === 'POST') {
    if (bereich.besitzer !== wer.konto.id)
      return fehler(403, 'restricted_resource', 'Nur der Besitzer darf verwalten.');
    const id = String(k.id || '').trim();
    const satz = id ? await ablage.hole('saetze', { bereich: bereich.id, id }) : null;
    if (!satz) return antwort(200, { gefunden: false },
      { 'Access-Control-Allow-Origin': '*' });
    const freigaben = await ablage.finde('freigaben',
      { bereich: bereich.id, seite: satz.seite || satz.id });
    return antwort(200, { gefunden: true,
      satz: { id: satz.id, tabelle: satz.tabelle, version: satz.version,
              geaendert: satz.geaendert, geloescht: !!satz.geloescht,
              verschluesselt: !!satz.verschluesselt, vonGeraet: satz.vonGeraet },
      freigaben }, { 'Access-Control-Allow-Origin': '*' });
  }

  /* --- Umbenennen ------------------------------------------------------ */
  if (m === 'PATCH') {
    if (bereich.besitzer !== wer.konto.id)
      return fehler(403, 'restricted_resource', 'Nur der Besitzer darf umbenennen.');
    const neu = { ...bereich, name: String(k.name || bereich.name).slice(0, 80) };
    await ablage.setze('bereiche', neu);
    return antwort(200, neu, { 'Access-Control-Allow-Origin': '*' });
  }

  return fehler(404, 'object_not_found', 'Unbekannter Bereichsweg.');
};

/* ==========================================================================
 * 9 · FREIGABEN — hier wird aus der Absprache ein Schloss
 * ========================================================================*/
/* ==========================================================================
 * 9b · RECHTE BIS AUF DIE EINZELNE SPALTE
 * --------------------------------------------------------------------------
 * Idee 21 der 10000×-Liste. Eine Freigabe sagt „diese Seite ja". Oft ist das
 * zu grob: die Personalliste soll das Team sehen, das Gehalt nicht.
 *
 * Zwei Dinge sind dabei wichtig und stehen deshalb hier und nicht in einer
 * Fussnote:
 *
 *   1. Geprüft wird auf dem Server, nicht in der Oberfläche. Eine Spalte,
 *      die nur im Browser ausgeblendet ist, ist keine Sperre — die Daten
 *      lägen trotzdem im Speicher des Geräts.
 *
 *   2. Das geht nur bei Klartext. Was verschlüsselt hochgeht, kann der
 *      Server nicht filtern; er sieht nur einen Haufen Zufall. Dort ist es
 *      aber auch kein Problem, denn den Schlüssel hat ohnehin nur einer.
 *      Feldrechte greifen also genau da, wo geteilt wird — und dort greifen
 *      sie wirklich.
 *
 * Der Besitzer eines Bereichs ist immer aussen vor. Wer sich selbst aus
 * seinen eigenen Daten aussperren kann, hat kein Rechtesystem, sondern eine
 * Falle.
 * ========================================================================*/

/** Welche Spaltenrechte gelten für diesen Menschen in dieser Sammlung? */
export const feldRechte = async (ablage, bereichId, sammlung, kontoId) => {
  if (!sammlung) return {};
  const alle = await ablage.finde('feldrechte', { bereich: bereichId, sammlung });
  const karte = {};
  /* Erst die allgemeine Regel, dann die persönliche — die sticht. */
  alle.forEach(f => { if (f.kontoId === '*') karte[f.feld] = f.rolle; });
  alle.forEach(f => { if (f.kontoId === kontoId) karte[f.feld] = f.rolle; });
  return karte;
};

/** Aus einem Satz die Spalten entfernen, die dieser Mensch nicht sehen darf. */
export const feldFilter = async (ablage, bereichId, kontoId, s) => {
  if (s.verschluesselt || s.tabelle !== 'blocks') return s;
  let satz;
  try { satz = JSON.parse(s.daten); } catch { return s; }
  if (!satz || satz.parentTable !== 'collection' || !satz.props) return s;

  const karte = await feldRechte(ablage, bereichId, satz.parentId, kontoId);
  const weg = Object.keys(karte).filter(f => karte[f] === 'kein' && f in satz.props);
  if (!weg.length) return s;

  weg.forEach(f => { delete satz.props[f]; });
  /* Der Empfänger erfährt, DASS etwas fehlt — sonst hält er eine
     unvollständige Zeile für eine vollständige und schreibt sie zurück. */
  satz.feldrechteWeg = weg;
  return { ...s, daten: JSON.stringify(satz) };
};

/**
 * Schreibversuche auf gesperrte Spalten zurückdrehen.
 * @returns {{daten:string, zurueck:string[]}}
 */
export const feldSchutz = async (ablage, bereichId, kontoId, s, alt) => {
  if (s.verschluesselt || s.tabelle !== 'blocks') return { daten: s.daten, zurueck: [] };
  let satz;
  try { satz = JSON.parse(s.daten); } catch { return { daten: s.daten, zurueck: [] }; }
  if (!satz || satz.parentTable !== 'collection' || !satz.props)
    return { daten: s.daten, zurueck: [] };

  const karte = await feldRechte(ablage, bereichId, satz.parentId, kontoId);
  const gesperrt = Object.keys(karte).filter(f => karte[f] !== 'voll');
  if (!gesperrt.length) return { daten: s.daten, zurueck: [] };

  let alterSatz = null;
  if (alt && !alt.verschluesselt) { try { alterSatz = JSON.parse(alt.daten); } catch {} }
  const alteProps = (alterSatz && alterSatz.props) || {};

  const zurueck = [];
  gesperrt.forEach(f => {
    const neuW = JSON.stringify(satz.props[f] ?? null);
    const altW = JSON.stringify(alteProps[f] ?? null);
    if (neuW === altW) return;
    if (f in alteProps) satz.props[f] = alteProps[f];
    else delete satz.props[f];
    zurueck.push(f);
  });
  if (!zurueck.length) return { daten: s.daten, zurueck: [] };
  return { daten: JSON.stringify(satz), zurueck };
};

const feldrechtWeg = async (a, ablage, wer, t, m, k) => {
  const bereichId = String(k.bereich || (a.suche && a.suche.bereich) || '');
  const bereich = await ablage.hole('bereiche', { id: bereichId });
  if (!bereich) return fehler(404, 'object_not_found', 'Diesen Bereich gibt es nicht.');
  const meine = await rolleAuf(ablage, bereichId, '*', wer.konto.id);

  if (m === 'POST') {
    if (!darf(meine, 'rechte')) return fehler(403, 'restricted_resource',
      'Spaltenrechte vergeben darf nur, wer Vollzugriff auf den Bereich hat.');
    const sammlung = String(k.sammlung || '');
    const feld     = String(k.feld || '');
    if (!sammlung || !feld) return fehler(400, 'validation_error',
      'Es fehlt die Sammlung oder die Spalte.');
    const rolle = String(k.rolle || 'lesen');
    if (!['voll', 'lesen', 'kein'].includes(rolle)) return fehler(400, 'validation_error',
      'Für Spalten gibt es nur: voll, lesen, kein.');

    let zielId = String(k.konto || '*');
    if (zielId !== '*') {
      const ziel = (await ablage.finde('konten', { mail: zielId }))[0] ||
                   await ablage.hole('konten', { id: zielId });
      if (!ziel) return fehler(404, 'object_not_found', 'Dieses Konto gibt es nicht.');
      zielId = ziel.id;
      if (zielId === bereich.besitzer) return fehler(400, 'validation_error',
        'Dem Besitzer kann man keine Spalte wegnehmen.');
    }

    if (k.entfernen)
      await ablage.weg('feldrechte', { bereich: bereichId, sammlung, feld, kontoId: zielId });
    else
      await ablage.setze('feldrechte', { bereich: bereichId, sammlung, feld,
        kontoId: zielId, rolle, von: wer.konto.id, wann: jetzt() });

    await notieren(ablage, { bereich: bereichId, kontoId: wer.konto.id, art: 'rechte',
      text: 'Spalte ' + feld + ' in ' + sammlung + ' für ' +
            (zielId === '*' ? 'alle' : zielId) + ': ' + (k.entfernen ? 'aufgehoben' : rolle),
      objekt: sammlung });
    return antwort(200, { ok: true, rolle }, { 'Access-Control-Allow-Origin': '*' });
  }

  if (m === 'GET') {
    if (!darf(meine, 'lesen')) return fehler(403, 'restricted_resource', 'Kein Leserecht.');
    const sammlung = String((a.suche && a.suche.sammlung) || k.sammlung || '');
    const liste = sammlung
      ? await ablage.finde('feldrechte', { bereich: bereichId, sammlung })
      : await ablage.finde('feldrechte', { bereich: bereichId });
    /* Und gleich mitliefern, was für den Fragenden selbst gilt. */
    const meins = sammlung
      ? await feldRechte(ablage, bereichId, sammlung, wer.konto.id) : {};
    return antwort(200, { feldrechte: liste, meins, besitzer: bereich.besitzer },
      { 'Access-Control-Allow-Origin': '*' });
  }

  return fehler(405, 'invalid_request', 'Hier geht nur GET und POST.');
};

const freigabeWeg = async (a, ablage, wer, t, m, k) => {
  /* Bei GET steht der Bereich in der Adresse, bei POST im Körper. */
  const bereichId = String(k.bereich || (a.suche && a.suche.bereich) || '');
  const bereich = await ablage.hole('bereiche', { id: bereichId });
  if (!bereich) return fehler(404, 'object_not_found', 'Diesen Bereich gibt es nicht.');

  const seite = String(k.seite || '*');
  const meine = await rolleAuf(ablage, bereichId, seite, wer.konto.id);

  /* --- Setzen ---------------------------------------------------------- */
  if (m === 'POST') {
    if (!darf(meine, 'rechte')) return fehler(403, 'restricted_resource',
      'Rechte vergeben darf nur, wer selbst Vollzugriff hat.');
    const rolle = String(k.rolle || 'lesen');
    if (!ROLLEN[rolle]) return fehler(400, 'validation_error',
      'Diese Rolle gibt es nicht: ' + rolle);

    let zielId = String(k.konto || '');
    if (zielId !== '*') {
      const ziel = (await ablage.finde('konten', { mail: zielId }))[0] ||
                   await ablage.hole('konten', { id: zielId });
      if (!ziel) return fehler(404, 'object_not_found',
        'Dieses Konto gibt es nicht. Wer eingeladen wird, muss sich einmal anmelden.');
      zielId = ziel.id;
      if (zielId === bereich.besitzer) return fehler(400, 'validation_error',
        'Dem Besitzer kann man keine Rechte geben oder nehmen.');
    }

    const alt = await ablage.hole('freigaben', { bereich: bereichId, seite, kontoId: zielId });

    /* „Kein Zugriff" ist keine fehlende Freigabe, sondern eine eigene Aussage:
       diese Seite nicht, auch wenn du den Bereich darüber sehen darfst. Wer
       sie löscht statt sie hinzuschreiben, macht aus einem Riegel ein Loch —
       das geerbte Recht käme sofort wieder durch.
       Ganz entfernen geht mit { entfernen: true }. */
    if (k.entfernen)
      await ablage.weg('freigaben', { bereich: bereichId, seite, kontoId: zielId });
    else
      await ablage.setze('freigaben', { bereich: bereichId, seite, kontoId: zielId,
        rolle, von: wer.konto.id, wann: jetzt() });

    await notieren(ablage, { bereich: bereichId, kontoId: wer.konto.id, art: 'rechte',
      text: 'Rechte auf ' + (seite === '*' ? 'den ganzen Bereich' : seite) + ' für ' +
            (zielId === '*' ? 'alle' : zielId) + ': ' +
            (alt ? alt.rolle : 'nichts') + ' → ' + rolle, objekt: seite });
    return antwort(200, { ok: true, rolle }, { 'Access-Control-Allow-Origin': '*' });
  }

  /* --- Ansehen --------------------------------------------------------- */
  if (m === 'GET') {
    if (!darf(meine, 'lesen')) return fehler(403, 'restricted_resource', 'Kein Leserecht.');
    const liste = await ablage.finde('freigaben', { bereich: bereichId });
    const mitNamen = [];
    for (const f of liste) {
      const kk = f.kontoId === '*' ? { name: 'Alle', mail: '' }
        : await ablage.hole('konten', { id: f.kontoId });
      mitNamen.push({ ...f, name: (kk && kk.name) || f.kontoId, mail: (kk && kk.mail) || '' });
    }
    return antwort(200, { besitzer: bereich.besitzer, freigaben: mitNamen },
      { 'Access-Control-Allow-Origin': '*' });
  }

  return fehler(405, 'invalid_request', 'Hier geht nur GET und POST.');
};

/* ==========================================================================
 * 10 · VERÖFFENTLICHEN
 * --------------------------------------------------------------------------
 * Eine Seite bekommt eine eigene Adresse. Der Inhalt kommt im Klartext —
 * anders geht es nicht, wenn ihn ein fremder Browser darstellen soll. Das
 * steht auch so im Fenster, bevor jemand darauf klickt.
 * ========================================================================*/
const oeffentlichZeigen = async (ablage, schluessel, suche) => {
  const s = await ablage.hole('oeffentlich', { schluessel });
  if (!s) return { status: 404,
    kopf: { 'Content-Type': 'text/html; charset=utf-8' },
    koerper: htmlSeite('Nicht gefunden',
      '<p>Diese Seite gibt es nicht mehr. Vielleicht wurde die Freigabe zurückgezogen.</p>') };

  if (s.bis && s.bis < jetzt()) return { status: 410,
    kopf: { 'Content-Type': 'text/html; charset=utf-8' },
    koerper: htmlSeite('Abgelaufen',
      '<p>Die Freigabe für diese Seite ist abgelaufen.</p>') };

  if (s.passwort) {
    const gegeben = await abdruck(String(suche.pw || ''));
    if (!gleich(gegeben, s.passwort)) return { status: 401,
      kopf: { 'Content-Type': 'text/html; charset=utf-8' },
      koerper: htmlSeite('Passwort nötig',
        '<form><p>Diese Seite ist mit einem Passwort geschützt.</p>' +
        '<input name="pw" type="password" placeholder="Passwort" autofocus>' +
        '<button>Ansehen</button></form>') };
  }

  await ablage.setze('oeffentlich', { ...s, aufrufe: (Number(s.aufrufe) || 0) + 1 });
  return { status: 200,
    kopf: { 'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'public, max-age=60' },
    koerper: htmlSeite(s.titel || 'Redion', s.inhalt || '') };
};

/**
 * Veröffentlichen und zurückziehen.
 * Der Inhalt kommt als fertiges HTML aus der App — sie weiss am besten, wie
 * ihre Blöcke aussehen. Der Server nimmt nur, was harmlos ist: Skripte,
 * Ereignisse und fremde Rahmen fliegen raus, sonst wäre die eigene Adresse
 * ein Einfallstor für alles, was jemand hineinschreibt.
 */
const veroeffentlichenWeg = async (a, ablage, wer, t, m, k, umwelt) => {
  const bereichId = String(k.bereich || '');
  const bereich = await ablage.hole('bereiche', { id: bereichId });
  if (!bereich) return fehler(404, 'object_not_found', 'Diesen Bereich gibt es nicht.');

  const seite = String(k.seite || '');
  const meine = await rolleAuf(ablage, bereichId, seite, wer.konto.id);
  if (!darf(meine, 'teilen')) return fehler(403, 'restricted_resource',
    'Veröffentlichen darf nur, wer teilen darf.');

  /* --- Zurückziehen ---------------------------------------------------- */
  if (m === 'DELETE') {
    const alte = await ablage.finde('oeffentlich', { bereich: bereichId, seite });
    for (const o of alte) await ablage.weg('oeffentlich', { schluessel: o.schluessel });
    await notieren(ablage, { bereich: bereichId, kontoId: wer.konto.id, art: 'freigabe',
      text: 'Veröffentlichung zurückgezogen', objekt: seite });
    return antwort(200, { ok: true, entfernt: alte.length },
      { 'Access-Control-Allow-Origin': '*' });
  }

  if (m !== 'POST') return fehler(405, 'invalid_request', 'Hier geht POST und DELETE.');

  /* Eine bestehende Veröffentlichung wird aufgefrischt, nicht verdoppelt —
     sonst sammeln sich tote Adressen an, die trotzdem noch ausliefern. */
  const alte = (await ablage.finde('oeffentlich', { bereich: bereichId, seite }))[0];
  const schluessel = (alte && alte.schluessel) || kennung().slice(0, 12);

  const satz = {
    schluessel, bereich: bereichId, seite,
    titel: String(k.titel || 'Ohne Titel').slice(0, 200),
    inhalt: sauber(String(k.inhalt || '')),
    wann: jetzt(),
    bis: k.tage ? new Date(Date.now() + Number(k.tage) * 86400000).toISOString() : '',
    aufrufe: (alte && alte.aufrufe) || 0,
    passwort: k.passwort ? await abdruck(String(k.passwort)) : ''
  };
  await ablage.setze('oeffentlich', satz);
  await notieren(ablage, { bereich: bereichId, kontoId: wer.konto.id, art: 'freigabe',
    text: (alte ? 'Veröffentlichung aufgefrischt: ' : 'Veröffentlicht: ') + satz.titel,
    objekt: seite });

  const wurzel = String(umwelt.ADRESSE || '').replace(/\/+$/, '');
  return antwort(200, { schluessel, adresse: (wurzel || '') + '/s/' + schluessel,
    passwortgeschuetzt: !!satz.passwort, bis: satz.bis, aufrufe: satz.aufrufe,
    hinweis: 'Diese eine Seite liegt jetzt im Klartext auf dem Server — anders ' +
             'kann ein fremder Browser sie nicht darstellen. Alles andere bleibt ' +
             'verschlüsselt.' }, { 'Access-Control-Allow-Origin': '*' });
};

/**
 * Nimmt HTML alles weg, was etwas tun kann. Was bleibt, ist Text mit
 * Auszeichnung. Bewusst eine Positivliste: bei einer Negativliste vergisst
 * man immer eines, und das eine reicht.
 */
export const sauber = (html) => {
  let s = String(html || '');
  /* Ganze Bereiche, die nie durchdürfen */
  s = s.replace(/<(script|style|iframe|object|embed|form|link|meta|base)\b[\s\S]*?<\/\1>/gi, '');
  s = s.replace(/<(script|style|iframe|object|embed|form|link|meta|base)\b[^>]*\/?>/gi, '');
  /* Ereignisse: onclick, onerror, onload … */
  s = s.replace(/\son[a-z-]+\s*=\s*"[^"]*"/gi, '');
  s = s.replace(/\son[a-z-]+\s*=\s*'[^']*'/gi, '');
  s = s.replace(/\son[a-z-]+\s*=\s*[^\s>]+/gi, '');
  /* javascript: und data: in Adressen — data:image bleibt, das ist harmlos */
  s = s.replace(/(href|src|action|formaction)\s*=\s*(["'])\s*javascript:[^"']*\2/gi, '$1="#"');
  s = s.replace(/(href|src)\s*=\s*(["'])\s*data:(?!image\/(png|jpe?g|gif|webp|svg\+xml);)[^"']*\2/gi, '$1="#"');
  /* srcdoc lädt eine ganze Seite nach */
  s = s.replace(/\ssrcdoc\s*=\s*(["'])[\s\S]*?\1/gi, '');
  return s;
};

const htmlSeite = (titel, inhalt) =>
  '<!doctype html><html lang="de"><meta charset="utf-8">' +
  '<meta name="viewport" content="width=device-width,initial-scale=1">' +
  '<title>' + String(titel).replace(/[<>&]/g, '') + '</title><style>' +
  ':root{color-scheme:dark light}' +
  'body{font:16px/1.7 -apple-system,system-ui,sans-serif;max-width:720px;' +
  'margin:0 auto;padding:44px 22px 90px;background:#191a1e;color:#e8e8ea}' +
  '@media(prefers-color-scheme:light){body{background:#fff;color:#25262b}}' +
  'h1{font-size:31px;line-height:1.25;margin:0 0 22px}' +
  'h2{font-size:23px;margin:34px 0 10px}h3{font-size:19px;margin:26px 0 8px}' +
  'p{margin:0 0 14px}ul,ol{margin:0 0 14px;padding-left:24px}' +
  'code{font:13.5px ui-monospace,monospace;background:#ffffff14;padding:2px 5px;border-radius:4px}' +
  'pre{background:#ffffff0d;padding:13px;border-radius:8px;overflow:auto}' +
  'hr{border:0;border-top:1px solid #ffffff1f;margin:26px 0}' +
  'input,button{font:15px system-ui;padding:9px 13px;border-radius:8px;' +
  'border:1px solid #ffffff24;background:#ffffff10;color:inherit;margin-right:7px}' +
  'table{border-collapse:collapse;width:100%;margin:0 0 16px}' +
  'th,td{border:1px solid #ffffff1f;padding:7px 10px;text-align:left;font-size:14px}' +
  '.fuss{margin-top:60px;font-size:12.5px;color:#8b8b93;border-top:1px solid #ffffff1f;padding-top:16px}' +
  '</style><h1>' + String(titel).replace(/[<>&]/g, '') + '</h1>' + inhalt +
  '<div class="fuss">Veröffentlicht mit Redion. Die Daten liegen auf dem Gerät ' +
  'des Verfassers — hier steht nur diese eine Seite.</div></html>';

/* ==========================================================================
 * 11 · MARKEN — Token für Programme
 * ========================================================================*/
const markenWeg = async (a, ablage, wer, t, m, k) => {
  if (m === 'POST' && !t[1]) {
    const roh = 'red_' + kennung() + kennung();
    const rechte = Array.isArray(k.rechte) ? k.rechte.join(',') : String(k.rechte || 'lesen');
    const satz = { wert: await abdruck(roh), art: 'marke', kontoId: wer.konto.id,
      bereich: String(k.bereich || ''), name: String(k.name || 'Ohne Namen').slice(0, 60),
      rechte, angelegt: jetzt(),
      bis: k.tage ? new Date(Date.now() + Number(k.tage) * 86400000).toISOString() : '',
      benutzt: '' };
    await ablage.setze('marken', satz);
    await notieren(ablage, { bereich: satz.bereich, kontoId: wer.konto.id, art: 'marke',
      text: 'Marke „' + satz.name + '" angelegt (' + rechte + ')' });
    return antwort(200, { token: roh, name: satz.name, rechte, bis: satz.bis,
      hinweis: 'Diese Zeichenkette wird nicht noch einmal angezeigt. Jetzt kopieren.' },
      { 'Access-Control-Allow-Origin': '*' });
  }

  if (m === 'GET' && !t[1]) {
    const liste = (await ablage.finde('marken', { kontoId: wer.konto.id }))
      .filter(x => x.art === 'marke')
      .map(x => ({ name: x.name, rechte: x.rechte, bereich: x.bereich,
                   angelegt: x.angelegt, bis: x.bis, benutzt: x.benutzt,
                   kennung: x.wert.slice(0, 8) }));
    return antwort(200, { marken: liste }, { 'Access-Control-Allow-Origin': '*' });
  }

  if (m === 'DELETE' && t[1]) {
    const alle = await ablage.finde('marken', { kontoId: wer.konto.id });
    const treffer = alle.find(x => x.wert.startsWith(t[1]));
    if (!treffer) return fehler(404, 'object_not_found', 'Diese Marke gibt es nicht.');
    await ablage.weg('marken', { wert: treffer.wert });
    await notieren(ablage, { kontoId: wer.konto.id, art: 'marke',
      text: 'Marke „' + treffer.name + '" zurückgezogen' });
    return antwort(200, { ok: true }, { 'Access-Control-Allow-Origin': '*' });
  }

  return fehler(404, 'object_not_found', 'Unbekannter Markenweg.');
};

/* ==========================================================================
 * 12 · PROTOKOLL LESEN
 * ========================================================================*/
const protokollWeg = async (a, ablage, wer, t, m, suche) => {
  if (m !== 'GET') return fehler(405, 'invalid_request', 'Hier geht nur GET.');
  const bereichId = String(suche.bereich || '');
  if (bereichId) {
    const b = await ablage.hole('bereiche', { id: bereichId });
    if (!b) return fehler(404, 'object_not_found', 'Diesen Bereich gibt es nicht.');
    if (b.besitzer !== wer.konto.id) {
      const r = await rolleAuf(ablage, bereichId, '*', wer.konto.id);
      if (!darf(r, 'rechte')) return fehler(403, 'restricted_resource',
        'Das Protokoll sieht, wer Rechte vergeben darf.');
    }
  }
  const liste = await ablage.finde('protokoll',
    bereichId ? { bereich: bereichId } : { kontoId: wer.konto.id },
    { sortiere: 'wann', absteigend: true, grenze: Number(suche.grenze) || 200 });
  return antwort(200, { protokoll: liste }, { 'Access-Control-Allow-Origin': '*' });
};

/* ==========================================================================
 * 13 · /v1/ VON AUSSEN
 * --------------------------------------------------------------------------
 * Dieselben Adressen wie in der App, aber gegen die Sätze auf dem Server.
 * Und mit einem Unterschied, der zählt: hier wird jedes Recht geprüft.
 * ========================================================================*/
const v1Weg = async (a, ablage, wer, t, m, k, kopf, suche) => {
  if (!kopf['notion-version'] && !kopf['redion-version'])
    return fehler(400, 'missing_version',
      'Notion-Version header failed validation: Notion-Version header should be defined, ' +
      'instead was `undefined`.');

  const bereichId = String(kopf['redion-bereich'] || suche.bereich || k.bereich ||
    (wer.marke && wer.marke.bereich) || '');
  if (!bereichId) return fehler(400, 'validation_error',
    'Es fehlt der Bereich. Entweder in der Kopfzeile Redion-Bereich oder in der Marke.');
  const bereich = await ablage.hole('bereiche', { id: bereichId });
  if (!bereich) return fehler(404, 'object_not_found', 'Diesen Bereich gibt es nicht.');

  const markenRechte = wer.marke ? String(wer.marke.rechte || '').split(',') : ['alles'];
  const markeDarf = (was) => markenRechte.includes('alles') || markenRechte.includes(was);

  const bereichAls = t[1], id = t[2], unter = t[3];

  /* --- Eine Seite lesen ------------------------------------------------ */
  if (bereichAls === 'pages' && id && m === 'GET') {
    if (!markeDarf('lesen')) return fehler(403, 'restricted_resource',
      'Diese Marke darf nicht lesen.');
    const satz = await ablage.hole('saetze', { bereich: bereichId, id });
    if (!satz || satz.geloescht) return fehler(404, 'object_not_found',
      'Could not find page with ID: ' + id + '.');
    const r = await rolleAuf(ablage, bereichId, satz.seite || id, wer.konto.id);
    if (!darf(r, 'lesen')) return fehler(403, 'restricted_resource',
      'Auf diese Seite hast du kein Leserecht.');
    if (satz.verschluesselt) return fehler(409, 'verschluesselt',
      'Diese Seite liegt verschlüsselt hier. Der Server kann sie nicht lesen — ' +
      'nur die App auf einem angemeldeten Gerät kommt daran.');
    return antwort(200, { object: 'page', id: satz.id, ...JSON.parse(satz.daten || '{}'),
      last_edited_time: satz.geaendert }, { 'Access-Control-Allow-Origin': '*' });
  }

  /* --- Eine Seite ändern ----------------------------------------------- */
  if (bereichAls === 'pages' && id && m === 'PATCH') {
    if (!markeDarf('schreiben')) return fehler(403, 'restricted_resource',
      'Diese Marke darf nicht schreiben.');
    const satz = await ablage.hole('saetze', { bereich: bereichId, id });
    if (!satz) return fehler(404, 'object_not_found', 'Diese Seite gibt es nicht.');
    const r = await rolleAuf(ablage, bereichId, satz.seite || id, wer.konto.id);
    if (!darf(r, 'bearbeiten')) return fehler(403, 'restricted_resource',
      'Auf diese Seite hast du kein Schreibrecht.');
    if (satz.verschluesselt) return fehler(409, 'verschluesselt',
      'Verschlüsselte Seiten lassen sich hier nicht ändern.');
    const daten = { ...JSON.parse(satz.daten || '{}'), ...(k.properties ? { properties: k.properties } : {}) };
    if (k.archived !== undefined) daten.archived = !!k.archived;
    await ablage.setze('saetze', { ...satz, daten: JSON.stringify(daten),
      version: (Number(satz.version) || 1) + 1, geaendert: jetzt() });
    await notieren(ablage, { bereich: bereichId, kontoId: wer.konto.id, art: 'api',
      text: 'PATCH /v1/pages/' + id, objekt: id });
    return antwort(200, { object: 'page', id, ...daten }, { 'Access-Control-Allow-Origin': '*' });
  }

  /* --- Suchen ----------------------------------------------------------- */
  if (bereichAls === 'search' && m === 'POST') {
    if (!markeDarf('lesen')) return fehler(403, 'restricted_resource', 'Diese Marke darf nicht lesen.');
    const frage = String(k.query || '').toLowerCase();
    const alle = await ablage.finde('saetze', { bereich: bereichId },
      { sortiere: 'geaendert', absteigend: true, grenze: 500 });
    const raus = [];
    for (const s of alle) {
      if (s.geloescht || s.verschluesselt) continue;
      if (frage && !String(s.daten || '').toLowerCase().includes(frage)) continue;
      const r = await rolleAuf(ablage, bereichId, s.seite || s.id, wer.konto.id);
      if (!darf(r, 'lesen')) continue;
      raus.push({ object: 'page', id: s.id, last_edited_time: s.geaendert,
                  ...JSON.parse(s.daten || '{}') });
      if (raus.length >= (Number(k.page_size) || 100)) break;
    }
    return antwort(200, { object: 'list', results: raus, next_cursor: null,
      has_more: false }, { 'Access-Control-Allow-Origin': '*' });
  }

  /* --- Wer bin ich ------------------------------------------------------ */
  if (bereichAls === 'users' && (id === 'me' || !id)) {
    const ich = { object: 'user', id: wer.konto.id, name: wer.konto.name,
                  avatar_url: wer.konto.bild || null, type: 'person',
                  person: { email: wer.konto.mail } };
    return antwort(200, id === 'me' ? ich
      : { object: 'list', results: [ich], next_cursor: null, has_more: false },
      { 'Access-Control-Allow-Origin': '*' });
  }

  return fehler(404, 'object_not_found', 'Diesen Weg gibt es auf dem Server nicht: /' + t.join('/'));
};

/* ==========================================================================
 * 14 · MCP IN EMPFANGSRICHTUNG
 * --------------------------------------------------------------------------
 * Der letzte fehlende Punkt bei den Verbindungen. Fremde Werkzeuge — Claude,
 * ein Editor, ein eigenes Skript — können den Server jetzt fragen. Gesprochen
 * wird JSON-RPC 2.0, wie es das Protokoll vorschreibt.
 * ========================================================================*/
const MCP_WERKZEUGE = [
  { name: 'seiten_suchen',
    description: 'Sucht Seiten im Arbeitsbereich und gibt Titel und Kennung zurück.',
    inputSchema: { type: 'object', properties: {
      frage: { type: 'string', description: 'Wonach gesucht wird' },
      grenze: { type: 'number', description: 'Höchstens so viele Treffer' } },
      required: ['frage'] } },
  { name: 'seite_lesen',
    description: 'Liest eine Seite über ihre Kennung.',
    inputSchema: { type: 'object', properties: {
      id: { type: 'string', description: 'Die Kennung der Seite' } }, required: ['id'] } },
  { name: 'seite_anlegen',
    description: 'Legt eine neue Seite an.',
    inputSchema: { type: 'object', properties: {
      titel: { type: 'string' }, inhalt: { type: 'string' },
      eltern: { type: 'string', description: 'Kennung der Elternseite, sonst oberste Ebene' } },
      required: ['titel'] } },
  { name: 'bereiche_zeigen',
    description: 'Zeigt, welche Arbeitsbereiche zugänglich sind.',
    inputSchema: { type: 'object', properties: {} } }
];

const mcpWeg = async (a, ablage, wer, m, k) => {
  if (m !== 'POST') return fehler(405, 'invalid_request', 'MCP spricht nur POST.');

  const rpc = (id, ergebnis) => antwort(200, { jsonrpc: '2.0', id, result: ergebnis },
    { 'Access-Control-Allow-Origin': '*' });
  const rpcFehler = (id, code, text) => antwort(200,
    { jsonrpc: '2.0', id, error: { code, message: text } },
    { 'Access-Control-Allow-Origin': '*' });

  const id = k.id ?? null;
  const art = String(k.method || '');

  if (art === 'initialize') return rpc(id, {
    protocolVersion: '2024-11-05',
    capabilities: { tools: {} },
    serverInfo: { name: 'redion', version: '1.0.0' } });

  if (art === 'tools/list') return rpc(id, { tools: MCP_WERKZEUGE });

  if (art === 'tools/call') {
    const name = String((k.params || {}).name || '');
    const arg = (k.params || {}).arguments || {};
    const markenRechte = wer.marke ? String(wer.marke.rechte || '').split(',') : ['alles'];
    const markeDarf = (was) => markenRechte.includes('alles') || markenRechte.includes(was);
    const text = (s) => rpc(id, { content: [{ type: 'text', text: s }] });

    if (name === 'bereiche_zeigen') {
      const eigene = await ablage.finde('bereiche', { besitzer: wer.konto.id });
      const fremde = [];
      for (const f of await ablage.finde('freigaben', { kontoId: wer.konto.id })) {
        const b = await ablage.hole('bereiche', { id: f.bereich });
        if (b && !eigene.some(x => x.id === b.id)) fremde.push({ ...b, rolle: f.rolle });
      }
      return text(JSON.stringify({
        eigene: eigene.map(b => ({ id: b.id, name: b.name, rolle: 'voll' })),
        geteilt: fremde.map(b => ({ id: b.id, name: b.name, rolle: b.rolle })) }, null, 2));
    }

    const bereichId = String(arg.bereich || (wer.marke && wer.marke.bereich) || '');
    if (!bereichId) {
      const eigene = await ablage.finde('bereiche', { besitzer: wer.konto.id });
      if (eigene.length !== 1) return rpcFehler(id, -32602,
        'Es fehlt der Bereich. Erst bereiche_zeigen aufrufen und die Kennung mitgeben.');
      arg.bereich = eigene[0].id;
    }
    const bId = String(arg.bereich || bereichId);

    if (name === 'seiten_suchen') {
      if (!markeDarf('lesen')) return rpcFehler(id, -32000, 'Diese Marke darf nicht lesen.');
      const frage = String(arg.frage || '').toLowerCase();
      const alle = await ablage.finde('saetze', { bereich: bId },
        { sortiere: 'geaendert', absteigend: true, grenze: 400 });
      const raus = [];
      for (const s of alle) {
        if (s.geloescht || s.verschluesselt) continue;
        if (frage && !String(s.daten || '').toLowerCase().includes(frage)) continue;
        const r = await rolleAuf(ablage, bId, s.seite || s.id, wer.konto.id);
        if (!darf(r, 'lesen')) continue;
        let titel = '';
        try { titel = JSON.parse(s.daten || '{}').text || ''; } catch {}
        raus.push({ id: s.id, titel, geaendert: s.geaendert });
        if (raus.length >= (Number(arg.grenze) || 20)) break;
      }
      return text(raus.length
        ? JSON.stringify(raus, null, 2)
        : 'Nichts gefunden. Hinweis: verschlüsselte Seiten sind für den Server unsichtbar.');
    }

    if (name === 'seite_lesen') {
      if (!markeDarf('lesen')) return rpcFehler(id, -32000, 'Diese Marke darf nicht lesen.');
      const s = await ablage.hole('saetze', { bereich: bId, id: String(arg.id || '') });
      if (!s || s.geloescht) return rpcFehler(id, -32001, 'Diese Seite gibt es nicht.');
      const r = await rolleAuf(ablage, bId, s.seite || s.id, wer.konto.id);
      if (!darf(r, 'lesen')) return rpcFehler(id, -32000, 'Kein Leserecht auf dieser Seite.');
      if (s.verschluesselt) return rpcFehler(id, -32002,
        'Diese Seite liegt verschlüsselt hier — der Server kann sie nicht lesen.');
      return text(s.daten || '{}');
    }

    if (name === 'seite_anlegen') {
      if (!markeDarf('schreiben')) return rpcFehler(id, -32000, 'Diese Marke darf nicht schreiben.');
      const r = await rolleAuf(ablage, bId, String(arg.eltern || '*'), wer.konto.id);
      if (!darf(r, 'bearbeiten')) return rpcFehler(id, -32000, 'Kein Schreibrecht.');
      const neu = { id: kennung(), bereich: bId, tabelle: 'blocks',
        daten: JSON.stringify({ type: 'page', text: String(arg.titel || 'Ohne Titel'),
          inhalt: String(arg.inhalt || ''), parentId: arg.eltern || null }),
        verschluesselt: 0, seite: '', version: 1, geaendert: jetzt(),
        geloescht: 0, vonGeraet: 'MCP' };
      neu.seite = neu.id;
      await ablage.setze('saetze', neu);
      await notieren(ablage, { bereich: bId, kontoId: wer.konto.id, art: 'mcp',
        text: 'Seite „' + arg.titel + '" über MCP angelegt', objekt: neu.id });
      return text('Angelegt. Kennung: ' + neu.id);
    }

    return rpcFehler(id, -32601, 'Dieses Werkzeug gibt es nicht: ' + name);
  }

  if (art === 'ping') return rpc(id, {});
  return rpcFehler(id, -32601, 'Unbekannte Methode: ' + art);
};

/* Damit der Worker und die Prüfungen dieselben Namen benutzen. */
export const _intern = { kontoWeg, syncWeg, freigabeWeg, feldrechtWeg, bereichWeg, v1Weg, mcpWeg,
                         oeffentlichZeigen, htmlSeite, MCP_WERKZEUGE, oauthProfil,
                         sitzungGeben };
