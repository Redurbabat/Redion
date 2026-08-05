/* Die App am Server: anmelden, abgleichen, verschlüsseln — mit zwei Geräten */
/* Playwright kam früher über createRequire('/tmp/') aus einem Ordner neben dem
   Projekt. Es steht als devDependency in der package.json und liegt damit in
   node_modules — der gewöhnliche Import ist der richtige Weg. Ebenso die
   Serverpfade: neben sich statt fest auf /tmp/notizen/. */
import { chromium } from 'playwright';
import { starte } from './pruefserver.ts';
import { kennung, abdruck } from './kern.ts';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/* Die Wurzel des Repositories — eine Ebene über server/. Dort liegen
   index.html, quell/ und oeffentlich/. Früher stand hier '/tmp/notizen/public',
   ein Ordner, den es in diesem Repository gar nicht gibt. */
const WURZELORDNER = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

let ok = 0, bad = 0;
const pruef = (n, ist, soll) => {
  const gut = JSON.stringify(ist) === JSON.stringify(soll);
  console.log((gut ? '✅ ' : '❌ ') + n + (gut ? '' : `  ist=${JSON.stringify(ist)} soll=${JSON.stringify(soll)}`));
  gut ? ok++ : bad++;
};

/* --- Ein Server, der beides ausliefert: die App und die Serverwege ------- */
const TYP = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
              '.css': 'text/css; charset=utf-8', '.json': 'application/json',
              '.png': 'image/png', '.svg': 'image/svg+xml',
              '.webmanifest': 'application/manifest+json' };

const kern = await starte(8794);          /* die Serverwege */
const PORT = 8795;

const alles = http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x');
  const serverWeg = /^\/(konto|sync|freigabe|veroeffentlichen|bereich|protokoll|marken|mcp|s)(\/|$)/
    .test(u.pathname) || /^\/v1\//.test(u.pathname) || u.pathname === '/api/stand';

  if (serverWeg) {
    /* durchreichen an den Kern */
    let roh = '';
    for await (const st of req) roh += st;
    const a = await fetch('http://localhost:8794' + req.url, {
      method: req.method, headers: req.headers, body: roh || undefined, redirect: 'manual' });
    const text = await a.text();
    const kopf = {};
    a.headers.forEach((v, k) => { if (k !== 'content-encoding') kopf[k] = v; });
    res.writeHead(a.status, kopf);
    res.end(text);
    return;
  }

  let pf = path.join(WURZELORDNER, u.pathname === '/' ? 'index.html' : u.pathname);
  if (!fs.existsSync(pf) || fs.statSync(pf).isDirectory()) { res.writeHead(404); res.end(''); return; }
  res.writeHead(200, { 'Content-Type': TYP[path.extname(pf)] || 'application/octet-stream' });
  res.end(fs.readFileSync(pf));
});
await new Promise(r => alles.listen(PORT, r));
const WURZEL = 'http://localhost:' + PORT;

/* --- Ein Konto und zwei Sitzungen vorbereiten --------------------------- */
await kern.ablage.setze('konten', { id: 'k1', mail: 'red@x.ch', name: 'Redur',
  bild: '', herkunft: 'test', angelegt: new Date().toISOString(), gesperrt: 0 });
const machToken = async () => {
  const roh = 'sit_' + kennung();
  await kern.ablage.setze('sitzungen', { token: await abdruck(roh), kontoId: 'k1',
    geraet: 'Prüfung', angelegt: new Date().toISOString(),
    bis: new Date(Date.now() + 86400000).toISOString() });
  return roh;
};
const b = await fetch(WURZEL + '/bereich', { method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + await machToken() },
  body: JSON.stringify({ name: 'Geteilt' }) });
const BEREICH = (await b.json()).id;

const browser = await chromium.launch();
const fehler = [];

const geraet = async (name) => {
  const ctx = await browser.newContext({ viewport: { width: 1300, height: 900 } });
  const p = await ctx.newPage();
  p.on('pageerror', e => fehler.push(name + ': ' + e.message));
  await p.goto(WURZEL + '/index.html');
  await p.waitForTimeout(1800);
  const t = await machToken();
  await p.evaluate(async ([tok, ber, nm]) => {
    Store.setMeta('wolkeToken', tok);
    Store.setMeta('wolkeBereich', ber);
    Store.setMeta('wolkeGeraet', nm);
    await Wolke.tokenUebernehmen(tok);
    await Wolke.schluesselSetzen('mein langer geheimer satz');
  }, [t, BEREICH, name]);
  return { p, ctx };
};

const A = await geraet('Rechner');
const B2 = await geraet('Telefon');

/* ======================================================================== *
 * 1 · GRUNDLAGEN
 * ======================================================================== */
console.log('\n--- Grundlagen ---');

const grund = await A.p.evaluate(() => ({
  angemeldet: Wolke.angemeldet(),
  name: Wolke.zustand.konto.name,
  schluessel: Wolke.hatSchluessel(),
  adresse: Wolke.adresse(),
  geraet: Wolke.geraeteName()
}));
pruef('Angemeldet',          grund.angemeldet, true);
pruef('Mit dem Namen',       grund.name, 'Redur');
pruef('Schlüssel gesetzt',   grund.schluessel, true);
pruef('Server gefunden',     grund.adresse, WURZEL);
pruef('Gerätename gesetzt',  grund.geraet, 'Rechner');

/* Verschlüsseln und wieder entschlüsseln */
const krypto = await A.p.evaluate(async () => {
  const paket = await Wolke.verschluessele('Streng geheim');
  return { paket, zurueck: await Wolke.entschluessele(paket),
           sichtbar: paket.includes('geheim') };
});
pruef('Verschlüsselt und zurück', krypto.zurueck, 'Streng geheim');
pruef('Im Paket steht nichts Lesbares', krypto.sichtbar, false);

const falscherSchluessel = await B2.p.evaluate(async (paket) => {
  /* Die lokale Probe muss weg — sie ist genau dafür da, einen falschen
     Satz abzufangen. Hier soll er aber durchkommen, um zu sehen, dass
     die Entschlüsselung selbst nichts hergibt. */
  const probe = Store.getMeta('wolkeProbe', '');
  Store.setMeta('wolkeProbe', '');
  await Wolke.schluesselSetzen('ein ganz anderer satz hier');
  const raus = await Wolke.entschluessele(paket);
  Store.setMeta('wolkeProbe', probe);
  await Wolke.schluesselSetzen('mein langer geheimer satz');
  return raus;
}, krypto.paket);
pruef('Mit dem falschen Schlüssel kommt nichts heraus', falscherSchluessel, null);

/* ======================================================================== *
 * 2 · ABGLEICH ZWISCHEN ZWEI GERÄTEN
 * ======================================================================== */
console.log('\n--- Abgleich ---');

const geschrieben = await A.p.evaluate(async () => {
  const s = Store.addBlock(null, 'page', { text: 'Vom Rechner' });
  Store.addBlock(s.id, 'text', { text: 'Ein Absatz, den das Telefon sehen soll.' });
  const db = Store.addDatabase(s.id, 'Aufgaben', {
    title: { name: 'Titel', type: 'title' }, n: { name: 'Zahl', type: 'number' } });
  const c = Store.getCollection(db.collectionId);
  Store.addRow(c.id, { title: 'Erste Aufgabe', n: 42 });
  /* Hier stand `await new Promise(r => setTimeout(r, 300))`. Das war eine
     Wette gegen die eigene Schreibbremse der Ablage: die schreibt erst nach
     KONSTANTEN.SCHREIB_PAUSE_MS = 400 ms Ruhe. 300 ist weniger als 400 —
     der Lauf ging also nur dann gut, wenn zufällig etwas anderes vorher
     einen Schreibvorgang auslöste. Genau so entsteht ein Lauf, der allein
     grün ist und im Verbund rot, und man sucht den Fehler im Code.
     `Store.flush()` schreibt sofort und wartet nicht auf eine Zahl. */
  Store.flush();
  const erg = await Wolke.abgleichen();
  return { seite: s.id, coll: c.id, ...erg };
});
pruef('Der Rechner schickt etwas', geschrieben.angenommen > 4, true);

const geholt = await B2.p.evaluate(async () => {
  const vorher = Object.keys(Store.cache.blocks).length;
  const erg = await Wolke.abgleichen();
  return { vorher, nachher: Object.keys(Store.cache.blocks).length, ...erg };
});
pruef('Das Telefon holt sie ab',   geholt.uebernommen > 4, true);
pruef('Nichts war unlesbar',       geholt.unlesbar, 0);

const angekommen = await B2.p.evaluate((x) => {
  const s = Store.getBlock(x.seite);
  const c = Store.getCollection(x.coll);
  const zeilen = c ? Store.rowsOf(c.id) : [];
  return { titel: s && s.text, db: c && c.name,
           zeile: zeilen[0] && zeilen[0].text, zahl: zeilen[0] && zeilen[0].props.n };
}, geschrieben);
pruef('Die Seite ist da',      angekommen.titel, 'Vom Rechner');
pruef('Die Datenbank auch',    angekommen.db, 'Aufgaben');
pruef('Und die Zeile',         angekommen.zeile, 'Erste Aufgabe');
pruef('Mit dem richtigen Wert', angekommen.zahl, 42);

/* Der Server sieht nur Buchstabensalat */
const aufDemServer = await kern.ablage.finde('saetze', { bereich: BEREICH });
pruef('Auf dem Server liegen die Sätze', aufDemServer.length > 4, true);
pruef('Alle verschlüsselt',
      aufDemServer.every(s => s.verschluesselt === 1), true);
pruef('Und nichts Lesbares darin',
      aufDemServer.some(s => String(s.daten).includes('Vom Rechner')), false);

/* Rückweg: das Telefon ändert etwas */
const vomTelefon = await B2.p.evaluate(async (x) => {
  Store.updateBlock(x.seite, { text: 'Vom Telefon geändert' });
  await new Promise(r => setTimeout(r, 250));
  return await Wolke.abgleichen();
}, geschrieben);
pruef('Das Telefon schickt zurück', vomTelefon.angenommen >= 1, true);

const zurueckAmRechner = await A.p.evaluate(async (x) => {
  await Wolke.abgleichen();
  return Store.getBlock(x.seite).text;
}, geschrieben);
pruef('Der Rechner sieht die Änderung', zurueckAmRechner, 'Vom Telefon geändert');

/* Nichts Neues heisst nichts tun */
const leerlauf = await A.p.evaluate(async () => await Wolke.abgleichen());
pruef('Ohne Änderung wird nichts geschickt', leerlauf.angenommen, 0);
pruef('Und nichts geholt',                   leerlauf.uebernommen, 0);

/* ======================================================================== *
 * 3 · TEILEN MACHT LESBAR — UND SAGT DAS
 * ======================================================================== */
console.log('\n--- Teilen ---');

const geteilt = await A.p.evaluate(async (x) => {
  Wolke.geteiltSetzen(x.seite, true);
  Store.updateBlock(x.seite, { text: 'Jetzt geteilt' });
  await new Promise(r => setTimeout(r, 250));
  return await Wolke.abgleichen();
}, geschrieben);
pruef('Die geteilte Seite geht hinaus', geteilt.angenommen >= 1, true);

const jetztLesbar = await kern.ablage.hole('saetze', { bereich: BEREICH, id: geschrieben.seite });
pruef('Sie liegt jetzt im Klartext',  jetztLesbar.verschluesselt, 0);
pruef('Und der Server kann sie lesen',
      String(jetztLesbar.daten).includes('Jetzt geteilt'), true);

/* Die Blöcke der geteilten Seite müssen mitgehen — sonst bekäme der
   Empfänger eine leere Seite. Alles, was zu einer ANDEREN Seite gehört,
   bleibt zu. Genau das wird hier geprüft. */
const andereNochZu = await kern.ablage.finde('saetze', { bereich: BEREICH });
const fremdeSeiten = andereNochZu.filter(s => s.seite !== geschrieben.seite);
pruef('Alles ausserhalb der geteilten Seite bleibt verschlüsselt',
      fremdeSeiten.every(s => s.verschluesselt === 1), true);
pruef('Und es sind auch wirklich welche',   fremdeSeiten.length > 3, true);
pruef('Die geteilte Seite samt Inhalt ist offen',
      andereNochZu.filter(s => s.seite === geschrieben.seite)
                  .every(s => s.verschluesselt === 0), true);

/* Zurücknehmen verschlüsselt wieder */
const wiederZu = await A.p.evaluate(async (x) => {
  Wolke.geteiltSetzen(x.seite, false);
  Store.updateBlock(x.seite, { text: 'Wieder privat' });
  await new Promise(r => setTimeout(r, 250));
  await Wolke.abgleichen();
  return true;
}, geschrieben);
const nunWiederZu = await kern.ablage.hole('saetze', { bereich: BEREICH, id: geschrieben.seite });
pruef('Zurückgenommen wird wieder verschlüsselt', nunWiederZu.verschluesselt, 1);
pruef('Und der Klartext ist weg',
      String(nunWiederZu.daten).includes('Wieder privat'), false);

/* ======================================================================== *
 * 4 · VERÖFFENTLICHEN AUS DER APP
 * ======================================================================== */
console.log('\n--- Veröffentlichen ---');

const veroeff = await A.p.evaluate(async (x) => {
  Wolke.geteiltSetzen(x.seite, true);
  Store.updateBlock(x.seite, { text: 'Öffentlicher Bericht' });
  await new Promise(r => setTimeout(r, 250));
  await Wolke.abgleichen();
  return await Wolke.veroeffentlichen(x.seite);
}, geschrieben);
pruef('Veröffentlichen aus der App', !!veroeff.adresse, true);

const abgerufen = await fetch(veroeff.adresse);
const seitentext = await abgerufen.text();
pruef('Die Adresse liefert etwas',   abgerufen.status, 200);
pruef('Mit dem Titel',               seitentext.includes('Öffentlicher Bericht'), true);
pruef('Und dem Absatz',              seitentext.includes('Ein Absatz'), true);
pruef('Ohne Token abrufbar',         !abgerufen.headers.get('www-authenticate'), true);

const zurueckgezogen = await A.p.evaluate(async (x) => await Wolke.zurueckziehen(x.seite),
  geschrieben);
pruef('Zurückziehen klappt', zurueckgezogen.ok, true);
const nachher = await fetch(veroeff.adresse);
pruef('Danach ist sie weg',  nachher.status, 404);

/* ======================================================================== *
 * 5 · OHNE KONTO ÄNDERT SICH NICHTS
 * ======================================================================== */
console.log('\n--- Ohne Konto ---');

const ohneCtx = await browser.newContext({ viewport: { width: 1300, height: 900 } });
const ohne = await ohneCtx.newPage();
const netzRufe = [];
ohne.on('request', r => {
  const u = new URL(r.url());
  if (/^\/(konto|sync|freigabe|veroeffentlichen|bereich|marken|mcp)/.test(u.pathname))
    netzRufe.push(u.pathname);
});
ohne.on('pageerror', e => fehler.push('Ohne Konto: ' + e.message));
await ohne.goto(WURZEL + '/index.html');
await ohne.waitForTimeout(4500);   /* länger als die drei Sekunden bis zum ersten Abgleich */

const ohneStand = await ohne.evaluate(async () => {
  const s = Store.addBlock(null, 'page', { text: 'Ganz allein' });
  Store.addBlock(s.id, 'text', { text: 'Bleibt hier' });
  App.oeffne(s.id);
  await new Promise(r => setTimeout(r, 500));
  return { angemeldet: Wolke.angemeldet(),
           bloecke: Object.keys(Store.cache.blocks).length,
           gezeichnet: document.getElementById('page').textContent.includes('Ganz allein') };
});
pruef('Nicht angemeldet',            ohneStand.angemeldet, false);
pruef('Die App arbeitet trotzdem',   ohneStand.gezeichnet, true);
pruef('Kein einziger Serveraufruf',  netzRufe, []);

/* ======================================================================== *
 * 6 · WAS SCHIEFGEHEN KANN
 * ======================================================================== */
console.log('\n--- Randfälle ---');

const abgelaufen = await A.p.evaluate(async () => {
  const alt = Store.getMeta('wolkeToken', '');
  Store.setMeta('wolkeToken', 'sit_ausgedacht');
  let meldung = '';
  try { await Wolke.abgleichen(); } catch (e) { meldung = e.message; }
  const nochAngemeldet = Wolke.angemeldet();
  Store.setMeta('wolkeToken', alt);
  await Wolke.tokenUebernehmen(alt);
  return { meldung, nochAngemeldet };
});
pruef('Ein totes Token wird gemeldet',
      abgelaufen.meldung.includes('abgelaufen'), true);
pruef('Und die App merkt sich das',  abgelaufen.nochAngemeldet, false);

const keinServer = await A.p.evaluate(async () => {
  const alt = Store.getMeta('wolkeAdresse', '');
  Store.setMeta('wolkeAdresse', 'http://localhost:9999');
  let meldung = '';
  try { await Wolke.ruf('/konto/ich'); } catch (e) { meldung = e.message; }
  Store.setMeta('wolkeAdresse', alt);
  return meldung;
});
pruef('Ein toter Server wird gemeldet',
      keinServer.includes('nicht erreichbar'), true);
pruef('Mit einem beruhigenden Satz',
      keinServer.includes('auf diesem Gerät'), true);

/* Ein fremdes Gerät ohne Schlüssel bekommt die Sätze, kann sie aber nicht lesen */
const fremdCtx = await browser.newContext({ viewport: { width: 1300, height: 900 } });
const fremd = await fremdCtx.newPage();
fremd.on('pageerror', e => fehler.push('Fremd: ' + e.message));
await fremd.goto(WURZEL + '/index.html');
await fremd.waitForTimeout(1800);
const ohneSchluessel = await fremd.evaluate(async ([tok, ber]) => {
  Store.setMeta('wolkeToken', tok);
  Store.setMeta('wolkeBereich', ber);
  await Wolke.tokenUebernehmen(tok);
  /* kein schluesselSetzen! */
  return await Wolke.runter();
}, [await machToken(), BEREICH]);
/* Ohne Schlüssel kommt nur an, was ohnehin offen liegt — der Rest bleibt
   Buchstabensalat und wird ehrlich gezählt. */
pruef('Das Verschlüsselte bleibt draussen', ohneSchluessel.unlesbar > 3, true);
pruef('Und es ist deutlich mehr als das Offene',
      ohneSchluessel.unlesbar > ohneSchluessel.uebernommen, true);

/* Ganz konkret: ein Satz, den der Server als verschlüsselt führt, darf auf
   dem fremden Gerät gar nicht auftauchen. */
const einVerschluesselter = (await kern.ablage.finde('saetze', { bereich: BEREICH }))
  .find(x => x.verschluesselt === 1 && x.tabelle === 'blocks');
const fremdSieht = await fremd.evaluate((id) => !!Store.cache.blocks[id],
  einVerschluesselter.id);
pruef('Ein verschlüsselter Satz taucht dort nicht auf', fremdSieht, false);

console.log(`\n${ok}/${ok + bad} bestanden`);
console.log(fehler.length ? 'JS-Fehler:\n' + fehler.join('\n') : 'Keine JS-Fehler.');
await browser.close();
await new Promise(r => alles.close(r));
await kern.stopp();
process.exit(bad || fehler.length ? 1 : 0);
