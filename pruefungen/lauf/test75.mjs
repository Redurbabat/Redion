/* Der Server: Rechte als Schloss, Veröffentlichen, /v1/, MCP, Besitzerwechsel */
import { fileURLToPath as _alsPfad } from 'node:url';
import { dirname as _ordner, resolve as _loese } from 'node:path';
import { createRequire as _brauche } from 'node:module';
const WURZEL = _loese(_ordner(_alsPfad(import.meta.url)), '../..');
const require = _brauche(import.meta.url);
import { starte } from '../../server/pruefserver.js';
import { kennung, abdruck } from '../../server/kern.js';

let ok = 0, bad = 0;
const pruef = (n, ist, soll) => {
  const gut = JSON.stringify(ist) === JSON.stringify(soll);
  console.log((gut ? '✅ ' : '❌ ') + n + (gut ? '' : `  ist=${JSON.stringify(ist)} soll=${JSON.stringify(soll)}`));
  gut ? ok++ : bad++;
};

const s = await starte(8792);
const ruf = async (weg, opt = {}) => {
  const a = await fetch(s.adresse + weg, {
    method: opt.m || 'GET', redirect: 'manual',
    headers: { 'Content-Type': 'application/json', ...(opt.kopf || {}) },
    body: opt.k ? JSON.stringify(opt.k) : undefined
  });
  const text = await a.text();
  let b; try { b = JSON.parse(text); } catch { b = text; }
  return { status: a.status, body: b, kopf: Object.fromEntries(a.headers) };
};

/* --- Drei Menschen anlegen ---------------------------------------------- */
const machKonto = async (id, mail, name) => {
  await s.ablage.setze('konten', { id, mail, name, bild: '', herkunft: 'test',
    angelegt: new Date().toISOString(), gesperrt: 0 });
  const roh = 'sit_' + kennung();
  await s.ablage.setze('sitzungen', { token: await abdruck(roh), kontoId: id,
    geraet: name, angelegt: new Date().toISOString(),
    bis: new Date(Date.now() + 86400000).toISOString() });
  return { Authorization: 'Bearer ' + roh };
};
const RED  = await machKonto('k-red',  'red@x.ch',  'Redur');
const ANNA = await machKonto('k-anna', 'anna@x.ch', 'Anna');
const BEN  = await machKonto('k-ben',  'ben@x.ch',  'Ben');

const b = await ruf('/bereich', { m: 'POST', kopf: RED, k: { name: 'Projekt' } });
const B = b.body.id;

await ruf('/sync/hoch', { m: 'POST', kopf: RED, k: { bereich: B, saetze: [
  { id: 'oben',  tabelle: 'blocks', seite: 'oben',
    daten: JSON.stringify({ type: 'page', text: 'Oberste Seite' }),
    version: 1, geaendert: new Date().toISOString() },
  { id: 'unten', tabelle: 'blocks', seite: 'unten',
    daten: JSON.stringify({ type: 'page', text: 'Untere Seite', parentId: 'oben' }),
    version: 1, geaendert: new Date().toISOString() },
  { id: 'geheim', tabelle: 'blocks', seite: 'geheim',
    daten: JSON.stringify({ type: 'page', text: 'Nur für mich' }),
    version: 1, geaendert: new Date().toISOString() }
] } });

/* ======================================================================== *
 * 1 · RECHTE ALS ECHTES SCHLOSS
 * ======================================================================== */
console.log('\n--- Rechte ---');

const annaOhne = await ruf('/sync/runter', { m: 'POST', kopf: ANNA, k: { bereich: B } });
pruef('Ohne Freigabe kommt Anna nicht rein', annaOhne.status, 403);

/* Redur gibt Anna Leserecht auf „oben" */
const gabe = await ruf('/freigabe', { m: 'POST', kopf: RED,
  k: { bereich: B, seite: 'oben', konto: 'anna@x.ch', rolle: 'lesen' } });
pruef('Freigabe gesetzt', gabe.status, 200);

/* Anna braucht auch ein Leserecht auf den Bereich, um überhaupt zu fragen */
await ruf('/freigabe', { m: 'POST', kopf: RED,
  k: { bereich: B, seite: '*', konto: 'anna@x.ch', rolle: 'lesen' } });

const annaSieht = await ruf('/sync/runter', { m: 'POST', kopf: ANNA, k: { bereich: B } });
pruef('Jetzt darf Anna lesen', annaSieht.status, 200);
pruef('Ihre Rolle steht dabei', annaSieht.body.rolle, 'lesen');

const annaSchreibt = await ruf('/sync/hoch', { m: 'POST', kopf: ANNA,
  k: { bereich: B, saetze: [{ id: 'oben', tabelle: 'blocks', daten: '{"text":"Geändert"}',
       version: 9, geaendert: new Date().toISOString() }] } });
pruef('Sie kommt durch die Tür',      annaSchreibt.status, 200);
pruef('Aber der Satz wird abgelehnt', annaSchreibt.body.abgelehnt.length, 1);
pruef('Mit Begründung',
      annaSchreibt.body.abgelehnt[0].grund, 'kein Schreibrecht auf dieser Seite');

const nochOben = await s.ablage.hole('saetze', { bereich: B, id: 'oben' });
pruef('Und die Seite ist unverändert',
      JSON.parse(nochOben.daten).text, 'Oberste Seite');

/* Ben darf gar nichts */
const benRein = await ruf('/sync/runter', { m: 'POST', kopf: BEN, k: { bereich: B } });
pruef('Ben kommt nicht rein', benRein.status, 403);

/* Anna darf keine Rechte weitergeben */
const annaVergibt = await ruf('/freigabe', { m: 'POST', kopf: ANNA,
  k: { bereich: B, seite: 'oben', konto: 'ben@x.ch', rolle: 'voll' } });
pruef('Anna darf keine Rechte vergeben', annaVergibt.status, 403);

/* Ein Konto, das es nicht gibt */
const niemand = await ruf('/freigabe', { m: 'POST', kopf: RED,
  k: { bereich: B, seite: 'oben', konto: 'gibtesnicht@x.ch', rolle: 'lesen' } });
pruef('Unbekanntes Konto wird gemeldet', niemand.status, 404);

/* Rechte vererben sich nach unten */
await ruf('/freigabe', { m: 'POST', kopf: RED,
  k: { bereich: B, seite: 'oben', konto: 'ben@x.ch', rolle: 'edit' } });
await ruf('/freigabe', { m: 'POST', kopf: RED,
  k: { bereich: B, seite: '*', konto: 'ben@x.ch', rolle: 'lesen' } });
const benSchreibtUnten = await ruf('/sync/hoch', { m: 'POST', kopf: BEN,
  k: { bereich: B, saetze: [{ id: 'unten', tabelle: 'blocks', seite: 'unten',
       daten: JSON.stringify({ type: 'page', text: 'Von Ben', parentId: 'oben' }),
       version: 2, geaendert: new Date().toISOString() }] } });
pruef('Ben erbt das Schreibrecht auf die Unterseite', benSchreibtUnten.body.angenommen, 1);

const benSchreibtGeheim = await ruf('/sync/hoch', { m: 'POST', kopf: BEN,
  k: { bereich: B, saetze: [{ id: 'geheim', tabelle: 'blocks', seite: 'geheim',
       daten: '{"text":"Reingeschrieben"}', version: 2,
       geaendert: new Date().toISOString() }] } });
pruef('Aber nicht auf die geheime Seite', benSchreibtGeheim.body.abgelehnt.length, 1);
pruef('Mit klarer Begründung',
      benSchreibtGeheim.body.abgelehnt[0].grund, 'kein Schreibrecht auf dieser Seite');

/* Ausdrückliches „Kein Zugriff" muss das geerbte Recht überstimmen */
await ruf('/freigabe', { m: 'POST', kopf: RED,
  k: { bereich: B, seite: 'geheim', konto: 'ben@x.ch', rolle: 'kein' } });

/* Und beim Lesen bekommt er die geheime Seite gar nicht erst */
const benLiest = await ruf('/sync/runter', { m: 'POST', kopf: BEN, k: { bereich: B } });
pruef('Die geheime Seite ist für Ben unsichtbar',
      benLiest.body.saetze.some(x => x.id === 'geheim'), false);
pruef('Die anderen sieht er',
      benLiest.body.saetze.length >= 2, true);

/* Rolle wieder wegnehmen */
await ruf('/freigabe', { m: 'POST', kopf: RED,
  k: { bereich: B, seite: 'oben', konto: 'ben@x.ch', rolle: 'kein' } });
const benWiederRaus = await ruf('/sync/hoch', { m: 'POST', kopf: BEN,
  k: { bereich: B, saetze: [{ id: 'unten', tabelle: 'blocks', seite: 'unten',
       daten: '{"text":"Nochmal"}', version: 3,
       geaendert: new Date().toISOString() }] } });
pruef('Zurückgenommen heisst zurückgenommen', benWiederRaus.body.abgelehnt.length, 1);

/* Freigaben ansehen */
const liste = await ruf('/freigabe?bereich=' + B, { kopf: RED });
pruef('Die Freigabeliste kommt', liste.status, 200);
pruef('Mit Namen statt Kennungen',
      liste.body.freigaben.some(f => f.name === 'Anna'), true);

/* ======================================================================== *
 * 2 · VERÖFFENTLICHEN
 * ======================================================================== */
console.log('\n--- Veröffentlichen ---');

const veroeff = await ruf('/veroeffentlichen', { m: 'POST', kopf: RED,
  k: { bereich: B, seite: 'oben', titel: 'Mein Bericht',
       inhalt: '<p>Ein Absatz mit <b>Fettschrift</b>.</p>' } });
pruef('Veröffentlichen klappt', veroeff.status, 200);
pruef('Es kommt eine Adresse',  /\/s\/[a-f0-9]{12}$/.test(veroeff.body.adresse), true);
pruef('Und ein ehrlicher Hinweis',
      veroeff.body.hinweis.includes('Klartext'), true);

const SCHLUESSEL = veroeff.body.schluessel;
const seite = await ruf('/s/' + SCHLUESSEL);
pruef('Die Seite ist ohne Token erreichbar', seite.status, 200);
pruef('Mit dem Titel',   seite.body.includes('Mein Bericht'), true);
pruef('Und dem Inhalt',  seite.body.includes('<b>Fettschrift</b>'), true);
pruef('Sie sagt, woher sie kommt', seite.body.includes('Redion'), true);

/* Skripte fliegen raus */
const boese = await ruf('/veroeffentlichen', { m: 'POST', kopf: RED,
  k: { bereich: B, seite: 'unten', titel: 'Test',
       inhalt: '<p onclick="alert(1)">Text</p><script>alert(2)</script>' +
               '<img src=x onerror="alert(3)"><a href="javascript:alert(4)">Link</a>' +
               '<iframe src="https://fremd.example"></iframe>' } });
const boeseSeite = await ruf('/s/' + boese.body.schluessel);
pruef('Kein script-Element',  boeseSeite.body.includes('alert(2)'), false);
pruef('Kein onclick',         boeseSeite.body.includes('onclick'), false);
pruef('Kein onerror',         boeseSeite.body.includes('onerror'), false);
pruef('Kein javascript:',     boeseSeite.body.includes('javascript:'), false);
pruef('Kein fremder Rahmen',  boeseSeite.body.includes('iframe'), false);
pruef('Der Text bleibt',      boeseSeite.body.includes('Text'), true);

/* Mit Passwort */
const mitPw = await ruf('/veroeffentlichen', { m: 'POST', kopf: RED,
  k: { bereich: B, seite: 'geheim', titel: 'Geschützt',
       inhalt: '<p>Nur mit Passwort</p>', passwort: 'sesam' } });
pruef('Passwortschutz wird vermerkt', mitPw.body.passwortgeschuetzt, true);
const ohnePw = await ruf('/s/' + mitPw.body.schluessel);
pruef('Ohne Passwort: 401',   ohnePw.status, 401);
pruef('Mit einem Eingabefeld', ohnePw.body.includes('type="password"'), true);
const mitPwAuf = await ruf('/s/' + mitPw.body.schluessel + '?pw=sesam');
pruef('Mit dem richtigen Passwort geht es', mitPwAuf.status, 200);
pruef('Und der Inhalt ist da', mitPwAuf.body.includes('Nur mit Passwort'), true);
const falschesPw = await ruf('/s/' + mitPw.body.schluessel + '?pw=falsch');
pruef('Mit dem falschen nicht', falschesPw.status, 401);

/* Zweimal veröffentlichen gibt dieselbe Adresse */
const nochmalV = await ruf('/veroeffentlichen', { m: 'POST', kopf: RED,
  k: { bereich: B, seite: 'oben', titel: 'Mein Bericht, überarbeitet',
       inhalt: '<p>Neue Fassung</p>' } });
pruef('Dieselbe Adresse beim Auffrischen', nochmalV.body.schluessel, SCHLUESSEL);
const aufgefrischt = await ruf('/s/' + SCHLUESSEL);
pruef('Mit dem neuen Inhalt', aufgefrischt.body.includes('Neue Fassung'), true);

/* Anna darf nicht veröffentlichen (nur lesen) */
const annaVeroeff = await ruf('/veroeffentlichen', { m: 'POST', kopf: ANNA,
  k: { bereich: B, seite: 'oben', titel: 'X', inhalt: '<p>X</p>' } });
pruef('Anna darf nicht veröffentlichen', annaVeroeff.status, 403);

/* Zurückziehen */
const zurueck = await ruf('/veroeffentlichen', { m: 'DELETE', kopf: RED,
  k: { bereich: B, seite: 'oben' } });
pruef('Zurückziehen klappt', zurueck.status, 200);
const weg = await ruf('/s/' + SCHLUESSEL);
pruef('Danach ist die Seite weg', weg.status, 404);
pruef('Und sagt warum',          weg.body.includes('Freigabe'), true);

/* ======================================================================== *
 * 3 · MARKEN UND /v1/ VON AUSSEN
 * ======================================================================== */
console.log('\n--- Die Schnittstelle von aussen ---');

const marke = await ruf('/marken', { m: 'POST', kopf: RED,
  k: { name: 'Mein Skript', bereich: B, rechte: ['lesen'] } });
pruef('Eine Marke kommt',        marke.status, 200);
pruef('Sie beginnt mit red_',    String(marke.body.token).startsWith('red_'), true);
pruef('Und wird nur einmal gezeigt',
      marke.body.hinweis.includes('nicht noch einmal'), true);
const MARKE = { Authorization: 'Bearer ' + marke.body.token };

const ohneFassung = await ruf('/v1/pages/oben', { kopf: MARKE });
pruef('Ohne Notion-Version: 400', ohneFassung.status, 400);
pruef('Code missing_version',     ohneFassung.body.code, 'missing_version');

const V = { ...MARKE, 'Notion-Version': '2022-06-28' };
const eineSeite = await ruf('/v1/pages/oben', { kopf: V });
pruef('Eine Seite über die Marke', eineSeite.status, 200);
pruef('Mit Objektart page',        eineSeite.body.object, 'page');
pruef('Und dem Text',              eineSeite.body.text, 'Oberste Seite');

const schreibVersuch = await ruf('/v1/pages/oben', { m: 'PATCH', kopf: V,
  k: { properties: { x: 1 } } });
pruef('Eine Lesemarke darf nicht schreiben', schreibVersuch.status, 403);

const schreibMarke = await ruf('/marken', { m: 'POST', kopf: RED,
  k: { name: 'Schreiber', bereich: B, rechte: ['lesen', 'schreiben'] } });
const SV = { Authorization: 'Bearer ' + schreibMarke.body.token,
             'Notion-Version': '2022-06-28' };
const geschrieben = await ruf('/v1/pages/oben', { m: 'PATCH', kopf: SV,
  k: { properties: { Titel: 'Neu' } } });
pruef('Eine Schreibmarke darf', geschrieben.status, 200);

const verschluesselt = await ruf('/sync/hoch', { m: 'POST', kopf: RED,
  k: { bereich: B, saetze: [{ id: 'krypt', tabelle: 'blocks', seite: 'krypt',
       daten: 'AAAA-VERSCHLUESSELT', verschluesselt: true, version: 1,
       geaendert: new Date().toISOString() }] } });
const kryptLesen = await ruf('/v1/pages/krypt', { kopf: V });
pruef('Verschlüsseltes kann der Server nicht lesen', kryptLesen.status, 409);
pruef('Und sagt das ehrlich',
      kryptLesen.body.message.includes('verschlüsselt'), true);

const suche = await ruf('/v1/search', { m: 'POST', kopf: V, k: { query: 'Oberste' } });
pruef('Suchen geht',           suche.status, 200);
pruef('Und findet die Seite',  suche.body.results.length >= 1, true);
const sucheAlles = await ruf('/v1/search', { m: 'POST', kopf: V, k: { query: '' } });
pruef('Verschlüsseltes taucht in der Suche nicht auf',
      sucheAlles.body.results.some(r => r.id === 'krypt'), false);

const werIchBin = await ruf('/v1/users/me', { kopf: V });
pruef('users/me über die Marke', werIchBin.body.name, 'Redur');

/* Marken auflisten und zurückziehen */
const markenListe = await ruf('/marken', { kopf: RED });
pruef('Zwei Marken in der Liste', markenListe.body.marken.length, 2);
pruef('Ohne den Schlüssel selbst',
      JSON.stringify(markenListe.body).includes('red_'), false);
const zurueckgezogen = await ruf('/marken/' + markenListe.body.marken[0].kennung,
  { m: 'DELETE', kopf: RED });
pruef('Zurückziehen klappt', zurueckgezogen.status, 200);

/* ======================================================================== *
 * 4 · MCP IN EMPFANGSRICHTUNG
 * ======================================================================== */
console.log('\n--- MCP ---');

const mcpMarke = await ruf('/marken', { m: 'POST', kopf: RED,
  k: { name: 'Claude', bereich: B, rechte: ['lesen', 'schreiben'] } });
const M = { Authorization: 'Bearer ' + mcpMarke.body.token };

const init = await ruf('/mcp', { m: 'POST', kopf: M,
  k: { jsonrpc: '2.0', id: 1, method: 'initialize' } });
pruef('initialize antwortet',   init.status, 200);
pruef('Mit dem Protokollstand', init.body.result.protocolVersion, '2024-11-05');
pruef('Und dem Servernamen',    init.body.result.serverInfo.name, 'redion');

const werkzeuge = await ruf('/mcp', { m: 'POST', kopf: M,
  k: { jsonrpc: '2.0', id: 2, method: 'tools/list' } });
pruef('Vier Werkzeuge',  werkzeuge.body.result.tools.length, 4);
pruef('Jedes mit Beschreibung',
      werkzeuge.body.result.tools.every(w => w.description.length > 20), true);

const gesucht = await ruf('/mcp', { m: 'POST', kopf: M,
  k: { jsonrpc: '2.0', id: 3, method: 'tools/call',
       params: { name: 'seiten_suchen', arguments: { frage: 'Oberste' } } } });
pruef('Suchen über MCP', gesucht.status, 200);
pruef('Findet die Seite', gesucht.body.result.content[0].text.includes('oben'), true);

const gelesen = await ruf('/mcp', { m: 'POST', kopf: M,
  k: { jsonrpc: '2.0', id: 4, method: 'tools/call',
       params: { name: 'seite_lesen', arguments: { id: 'oben' } } } });
pruef('Lesen über MCP', gelesen.body.result.content[0].text.includes('Oberste Seite'), true);

const kryptMcp = await ruf('/mcp', { m: 'POST', kopf: M,
  k: { jsonrpc: '2.0', id: 5, method: 'tools/call',
       params: { name: 'seite_lesen', arguments: { id: 'krypt' } } } });
pruef('Verschlüsseltes bleibt auch über MCP zu', !!kryptMcp.body.error, true);

const angelegt = await ruf('/mcp', { m: 'POST', kopf: M,
  k: { jsonrpc: '2.0', id: 6, method: 'tools/call',
       params: { name: 'seite_anlegen', arguments: { titel: 'Von Claude' } } } });
pruef('Anlegen über MCP', angelegt.body.result.content[0].text.includes('Angelegt'), true);

const bereiche = await ruf('/mcp', { m: 'POST', kopf: M,
  k: { jsonrpc: '2.0', id: 7, method: 'tools/call',
       params: { name: 'bereiche_zeigen', arguments: {} } } });
pruef('Bereiche zeigen', bereiche.body.result.content[0].text.includes('Projekt'), true);

const unbekannt = await ruf('/mcp', { m: 'POST', kopf: M,
  k: { jsonrpc: '2.0', id: 8, method: 'tools/call',
       params: { name: 'gibtsnicht', arguments: {} } } });
pruef('Unbekanntes Werkzeug wird gemeldet', unbekannt.body.error.code, -32601);

const ohneMarke = await ruf('/mcp', { m: 'POST',
  k: { jsonrpc: '2.0', id: 9, method: 'tools/list' } });
pruef('MCP ohne Token: 401', ohneMarke.status, 401);

/* Eine Lesemarke darf über MCP nicht schreiben.
   Eine frische — die erste wurde oben absichtlich zurückgezogen. */
const leseMarke = await ruf('/marken', { m: 'POST', kopf: RED,
  k: { name: 'Nur lesen', bereich: B, rechte: ['lesen'] } });
const nurLesenMcp = { Authorization: 'Bearer ' + leseMarke.body.token };
const mcpSchreibVersuch = await ruf('/mcp', { m: 'POST', kopf: nurLesenMcp,
  k: { jsonrpc: '2.0', id: 10, method: 'tools/call',
       params: { name: 'seite_anlegen', arguments: { titel: 'Verboten' } } } });
pruef('Lesemarke darf über MCP nicht anlegen', !!mcpSchreibVersuch.body.error, true);

/* ======================================================================== *
 * 5 · BESITZERWECHSEL UND VERWALTUNG
 * ======================================================================== */
console.log('\n--- Besitz und Verwaltung ---');

const suchIdFalsch = await ruf('/bereich/' + B + '/suche', { m: 'POST', kopf: ANNA,
  k: { id: 'oben' } });
pruef('Verwaltungssuche nur für den Besitzer', suchIdFalsch.status, 403);

const suchId = await ruf('/bereich/' + B + '/suche', { m: 'POST', kopf: RED,
  k: { id: 'oben' } });
pruef('Suche nach Seiten-ID', suchId.body.gefunden, true);
pruef('Mit den Freigaben dazu', suchId.body.freigaben.length >= 1, true);
pruef('Und dem Gerät',          !!suchId.body.satz.vonGeraet, true);

const suchNichts = await ruf('/bereich/' + B + '/suche', { m: 'POST', kopf: RED,
  k: { id: 'gibtsnicht' } });
pruef('Unbekannte Kennung',     suchNichts.body.gefunden, false);

const uebergabeFalsch = await ruf('/bereich/' + B + '/besitz', { m: 'POST', kopf: ANNA,
  k: { an: 'ben@x.ch' } });
pruef('Nur der Besitzer übergibt', uebergabeFalsch.status, 403);

const uebergabe = await ruf('/bereich/' + B + '/besitz', { m: 'POST', kopf: RED,
  k: { an: 'anna@x.ch' } });
pruef('Übergabe klappt',        uebergabe.status, 200);
pruef('Anna ist Besitzerin',    uebergabe.body.besitzer, 'k-anna');
pruef('Und Redur bleibt drin',  uebergabe.body.hinweis.includes('Vollzugriff'), true);

const redNachher = await ruf('/sync/runter', { m: 'POST', kopf: RED, k: { bereich: B } });
pruef('Redur kann weiter lesen', redNachher.status, 200);
pruef('Und zwar alles',          redNachher.body.rolle, 'voll');

const annaJetzt = await ruf('/sync/hoch', { m: 'POST', kopf: ANNA,
  k: { bereich: B, saetze: [{ id: 'neu-von-anna', tabelle: 'blocks', seite: 'neu-von-anna',
       daten: '{"text":"Anna schreibt"}', version: 1,
       geaendert: new Date().toISOString() }] } });
pruef('Anna darf jetzt schreiben', annaJetzt.body.angenommen, 1);

/* ======================================================================== *
 * 6 · DAS PROTOKOLL AUF DEM SERVER
 * ======================================================================== */
console.log('\n--- Protokoll ---');

const prot = await ruf('/protokoll?bereich=' + B, { kopf: ANNA });
pruef('Die Besitzerin sieht das Protokoll', prot.status, 200);
pruef('Es steht etwas drin',   prot.body.protokoll.length > 5, true);
pruef('Rechteänderungen sind dabei',
      prot.body.protokoll.some(e => e.art === 'rechte'), true);
pruef('Der Besitzerwechsel auch',
      prot.body.protokoll.some(e => e.art === 'besitz'), true);
pruef('Und die Veröffentlichung',
      prot.body.protokoll.some(e => e.art === 'freigabe'), true);

const protBen = await ruf('/protokoll?bereich=' + B, { kopf: BEN });
pruef('Ben sieht es nicht', protBen.status, 403);

/* ======================================================================== *
 * 7 · TOKEN LIEGEN NICHT IM KLARTEXT
 * ======================================================================== */
console.log('\n--- Sicherheit ---');

const alleSitzungen = await s.ablage.finde('sitzungen', {});
pruef('Kein Sitzungstoken im Klartext',
      alleSitzungen.some(x => String(x.token).startsWith('sit_')), false);
pruef('Sondern als Fingerabdruck',
      alleSitzungen.every(x => /^[a-f0-9]{64}$/.test(x.token)), true);

const alleMarken = (await s.ablage.finde('marken', {})).filter(x => x.art === 'marke');
pruef('Auch keine Marke im Klartext',
      alleMarken.some(x => String(x.wert).startsWith('red_')), false);

const gefaelscht = await ruf('/konto/ich', { kopf: { Authorization: 'Bearer sit_ausgedacht' } });
pruef('Ein erfundenes Token: 401', gefaelscht.status, 401);

/* Abgelaufene Sitzung */
const altToken = 'sit_' + kennung();
await s.ablage.setze('sitzungen', { token: await abdruck(altToken), kontoId: 'k-red',
  geraet: 'Alt', angelegt: '2020-01-01T00:00:00.000Z', bis: '2020-01-02T00:00:00.000Z' });
const abgelaufen = await ruf('/konto/ich', { kopf: { Authorization: 'Bearer ' + altToken } });
pruef('Abgelaufene Sitzung: 401', abgelaufen.status, 401);
pruef('Und sie wird aufgeräumt',
      !(await s.ablage.hole('sitzungen', { token: await abdruck(altToken) })), true);

/* Ein gesperrtes Konto kommt nicht rein */
await s.ablage.setze('konten', { ...(await s.ablage.hole('konten', { id: 'k-ben' })),
  gesperrt: 1 });
const gesperrt = await ruf('/konto/ich', { kopf: BEN });
pruef('Gesperrtes Konto: 401', gesperrt.status, 401);

/* Abmelden */
const abgemeldet = await ruf('/konto/abmelden', { m: 'POST', kopf: RED });
pruef('Abmelden klappt', abgemeldet.status, 200);
const nachAbmelden = await ruf('/konto/ich', { kopf: RED });
pruef('Danach ist Schluss', nachAbmelden.status, 401);

console.log(`\n${ok}/${ok + bad} bestanden`);
await s.stopp();
process.exit(bad ? 1 : 0);
