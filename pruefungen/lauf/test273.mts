/* Suite 273 — Einspielen ersetzt Inhalte, nicht die Identität (L76 / E279)
 * ============================================================================
 * Eine eingespielte Sicherung tauschte bisher `meta` vollständig aus. Damit
 * flog auch die Anmeldung dieses Geräts mit — wer eine fremde Sicherung
 * einspielte, war danach als jemand anderes angemeldet, und der nächste
 * Abgleich schickte seine Notizen in ein fremdes Konto. Beim Messen kam ein
 * zweites dazu: die Sicherung trug das Sitzungs-Token und jeden
 * `api:`-Schlüssel im KLARTEXT mit sich herum.
 *
 * Redurs Beschluss (E277 Punkt 4, E279): die Identität bleibt, die Marken
 * und die Basis gehen auf null, und DANACH entscheidet ein Mensch zwischen
 * „nur lokal" und „vollständig neu abgleichen". Niemals von selbst eine
 * Richtung.
 *
 * §1 KLARTEXT-SICHERUNG trägt keine Zugangsdaten mehr.
 *    Gegenprobe: mit `mitGeheimnissen` trägt dieselbe Sicherung sie sehr
 *    wohl — sonst prüfte §1 nur, dass gar keine gesetzt waren.
 * §2 DAS MANIFEST nennt, was es auslässt. Gegenprobe: ohne Zugangsdaten im
 *    Bestand erfindet es nichts.
 * §3 DIE IDENTITÄT überlebt ein „Ersetzen" mit einer FREMDEN Sicherung.
 *    Gegenprobe: die Inhalte sind trotzdem wirklich die der Sicherung.
 * §4 DIE MARKEN sind auf null, die Frage steht, `wolkeAbgleich` ist NICHT
 *    auf false gesetzt. Gegenprobe: ohne Anmeldung wird nicht gefragt.
 * §5 SOLANGE DIE FRAGE STEHT bewegt sich nichts — auch nach
 *    `abgleichSetzen(true)` nicht. Beide Antworten tun je das Ihre.
 * §6 DIE BASIS wird neu gesät. Gegenprobe: OHNE das Neusäen wird der
 *    überlebende Grabstein beim nächsten Abgleich still ausgetragen.
 * §7 ZUSAMMENFÜHREN rettet die Identität genauso.
 *
 * Ports: 9051 (Prüfserver) und 9052 (App + Durchreiche).
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { starte } from '../../server/pruefserver.ts';
import { kennung, abdruck } from '../../server/kern.ts';

const REPO = path.resolve(import.meta.dirname, '../..');
const TYP: Record<string, string> = { '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json' };

const kern = await starte(9051);
const PORT = 9052;

const alles = http.createServer(async (req, res) => {
  const weg2 = req.url ?? '/';
  const u = new URL(weg2, 'http://x');
  const serverWeg = /^\/(konto|sync|datei|freigabe|veroeffentlichen|bereich|protokoll|marken|mcp|s)(\/|$)/
    .test(u.pathname ?? '') || /^\/v1\//.test(u.pathname ?? '') || u.pathname === '/api/stand';
  if (serverWeg) {
    const stuecke: Buffer[] = [];
    for await (const st of req) stuecke.push(Buffer.from(st));
    const antwort = await fetch('http://localhost:9051' + weg2, {
      method: req.method || 'GET',
      headers: { 'Content-Type': String(req.headers['content-type'] || 'application/json'),
        ...(req.headers.authorization ? { Authorization: String(req.headers.authorization) } : {}),
        ...(req.headers['redion-geraet'] ? { 'Redion-Geraet': String(req.headers['redion-geraet']) } : {}) },
      ...(stuecke.length ? { body: Buffer.concat(stuecke) as any } : {})
    });
    res.statusCode = antwort.status;
    res.setHeader('Content-Type', antwort.headers.get('Content-Type') || 'application/json');
    res.end(Buffer.from(await antwort.arrayBuffer()));
    return;
  }
  let pfad = path.join(REPO, decodeURIComponent((weg2 || '/').split('?')[0]!));
  if (fs.existsSync(pfad) && fs.statSync(pfad).isDirectory()) pfad = path.join(pfad, 'index.html');
  if (!fs.existsSync(pfad) || !pfad.startsWith(REPO)) { res.statusCode = 404; res.end('weg'); return; }
  res.setHeader('Content-Type', TYP[path.extname(pfad)] || 'application/octet-stream');
  res.end(fs.readFileSync(pfad));
});
await new Promise<void>(f => alles.listen(PORT, () => f()));
const WURZEL = 'http://localhost:' + PORT;

let ok = 0, weg = 0;
const p = (name: string, gut: unknown, ist = ''): void => {
  if (gut) ok++; else weg++;
  console.log((gut ? '  ✓ ' : '  ✗ ') + name + (gut || !ist ? '' : ' — ' + ist));
};

await kern.ablage.setze('konten', { id: 'k1', mail: 'red@x.ch', name: 'Redur',
  bild: '', herkunft: 'test', angelegt: new Date().toISOString(), gesperrt: 0 });
const machToken = async (konto = 'k1'): Promise<string> => {
  const roh = 'sit_' + kennung();
  await kern.ablage.setze('sitzungen', { token: await abdruck(roh), kontoId: konto,
    geraet: 'Prüfung', angelegt: new Date().toISOString(),
    bis: new Date(Date.now() + 86400000).toISOString() });
  return roh;
};
const chefToken = await machToken();
const b = await fetch(WURZEL + '/bereich', { method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + chefToken },
  body: JSON.stringify({ name: 'Einspielprobe' }) });
const BEREICH = (await b.json()).id;
const amServer = (id: string) => kern.ablage.hole('saetze', { bereich: BEREICH, id });

const browser = await chromium.launch();
const fehler: string[] = [];
const geraet = async (name: string, anmelden = true) => {
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 850 } });
  const seite = await ctx.newPage();
  seite.on('pageerror', (e: Error) => fehler.push(name + ': ' + e.message));
  await seite.goto(WURZEL + '/index.html');
  await seite.waitForTimeout(1800);
  if (!anmelden) return { seite, ctx, token: '' };
  const t = await machToken();
  await seite.evaluate(async ([tok, ber, nm]: [string, string, string]) => {
    Store.setMeta('wolkeToken', tok);
    Store.setMeta('wolkeBereich', ber);
    Store.setMeta('wolkeGeraet', nm);
    await Wolke.tokenUebernehmen(tok);
    await Wolke.schluesselSetzen('mein langer geheimer satz');
    Wolke.abgleichSetzen(true);
  }, [t, BEREICH, name] as [string, string, string]);
  return { seite, ctx, token: t };
};

const A = await geraet('Rechner');

/* ========================================================================= */
console.log('\n1 · Die Klartext-Sicherung trägt keine Zugangsdaten mehr');
const geheim = await A.seite.evaluate(async () => {
  Store.setMeta('api:github', 'github_pat_GEHEIMES_DING');
  Store.setMeta('api:githubRepo', 'redur/redion');
  await Store.flush();
  const offen = Store.exportAll();
  const mit   = Store.exportAll(false, true);
  /* Der Weg, den die `.redion` nimmt: `daten.json` im Archiv, mit
     Anhängen aber im Klartext. Er darf nicht anders ausgehen als die
     einfache `.json` — sonst wäre die Lücke bloss verschoben. */
  const redion = Store.exportAll(true);
  return { offen, mit, redion, token: Store.getMeta('wolkeToken', ''),
           probe: Store.getMeta('wolkeProbe', ''),
           geteilt: Store.getMeta('wolkeGeteilt', []) };
}) as any;
p('Das Sitzungs-Token steht nicht in der offenen Sicherung',
  !!geheim.token && !geheim.offen.includes(geheim.token));
p('Die Schlüsselprobe steht nicht darin',
  !!geheim.probe && !geheim.offen.includes(geheim.probe));
p('Und kein api:-Schlüssel — auch nicht der harmlos aussehende',
  !geheim.offen.includes('github_pat_GEHEIMES_DING') &&
  !geheim.offen.includes('redur/redion'));
/* GEGENPROBE. Ohne sie prüfte §1 nur, dass die Werte gar nicht gesetzt
   waren — und wäre auch dann grün, wenn `exportAll` sie IMMER weglässt
   und die verschlüsselte Sicherung damit unbrauchbar würde (§55.2). */
p('Auch das `daten.json` der .redion trägt sie nicht',
  !geheim.redion.includes(geheim.token) &&
  !geheim.redion.includes('github_pat_GEHEIMES_DING'),
  'der Klartext-Weg mit Anhängen darf nicht anders ausgehen');
p('Gegenprobe: mit `mitGeheimnissen` sind sie sehr wohl dabei',
  geheim.mit.includes(geheim.token) && geheim.mit.includes(geheim.probe) &&
  geheim.mit.includes('github_pat_GEHEIMES_DING'),
  'sonst trüge die verschlüsselte Sicherung sie auch nicht');

console.log('\n2 · Das Manifest nennt, was es auslässt');
const manifest = JSON.parse(geheim.offen);
p('`fehlt` führt das Token', (manifest.fehlt || []).includes('wolkeToken'),
  JSON.stringify(manifest.fehlt));
p('`fehlt` führt die Probe und beide api:-Schlüssel',
  (manifest.fehlt || []).includes('wolkeProbe') &&
  (manifest.fehlt || []).includes('api:github') &&
  (manifest.fehlt || []).includes('api:githubRepo'), JSON.stringify(manifest.fehlt));
p('Und `fehlt` führt die Teilliste — eine Erlaubnis reist nicht in einer Datei',
  (manifest.fehlt || []).includes('wolkeGeteilt') ||
  !(geheim.geteilt || []).length, JSON.stringify(manifest.fehlt));
p('Der Hinweis sagt es auch im Klartext, samt Weg zurück',
  /Zugangsdaten/.test(manifest.hinweis) && /verschlüsselte/.test(manifest.hinweis),
  String(manifest.hinweis).slice(0, 160));
/* GEGENPROBE: das Manifest erfindet nichts. */
const ohneZugang = await A.seite.evaluate(() => {
  const merk = { g: Store.getMeta('api:github', ''), r: Store.getMeta('api:githubRepo', '') };
  Store.setMeta('api:github', ''); Store.setMeta('api:githubRepo', '');
  const d = JSON.parse(Store.exportAll());
  Store.setMeta('api:github', merk.g); Store.setMeta('api:githubRepo', merk.r);
  return d.fehlt || [];
}) as string[];
p('Gegenprobe: ohne gesetzte api:-Schlüssel stehen sie auch nicht in `fehlt`',
  !ohneZugang.includes('api:github') && !ohneZugang.includes('api:githubRepo'),
  JSON.stringify(ohneZugang));

/* ========================================================================= */
console.log('\n3 · Die Identität überlebt ein Ersetzen mit fremder Sicherung');
const fremd = await A.seite.evaluate(async () => {
  /* Eine Sicherung, wie sie vom Rechner eines anderen Menschen käme: sie
     bringt eine fremde Anmeldung mit — das ist der Fall vor L76, und
     genau der Fall, der als geglückter Vorgang aussah. */
  const s = Store.addBlock(null, 'page', { text: 'Eigene Seite' });
  await Store.flush();
  const meins = {
    token: Store.getMeta('wolkeToken', ''),
    konto: JSON.parse(JSON.stringify(Store.getMeta('wolkeKonto', null) || {})),
    bereich: Store.getMeta('wolkeBereich', ''),
    probe: Store.getMeta('wolkeProbe', ''),
    github: Store.getMeta('api:github', '')
  };
  const sicherung = JSON.parse(Store.exportAll(false, true));
  /* Der fremde Teil: andere Anmeldung, anderes Konto, andere Teilliste. */
  sicherung.meta['wolkeToken'] = 'sit_FREMDES_TOKEN';
  sicherung.meta['wolkeKonto'] = { id: 'k9', name: 'Jemand anderes', mail: 'x@y.ch' };
  sicherung.meta['wolkeBereich'] = 'fremder-bereich';
  sicherung.meta['wolkeProbe'] = 'FREMDE-PROBE';
  sicherung.meta['wolkeGeteilt'] = [s.id];
  sicherung.meta['api:github'] = 'github_pat_FREMD';
  /* Ein Inhalt, den es hier nicht gibt — damit sich prüfen lässt, dass die
     Sicherung wirklich eingespielt wurde und nicht bloss nichts geschah. */
  const fremdeSeite = { id: 'blk_fremd_1', type: 'page', text: 'Aus der Sicherung',
    content: [], parentId: null, parentTable: 'block', color: '', props: {},
    created: Store.now(), edited: Store.now(), erstelltVon: 'probe', alive: true };
  sicherung.blocks = { [fremdeSeite.id]: fremdeSeite };
  await Store.importAll(JSON.stringify(sicherung), 'ersetzen');
  return { meins, jetzt: {
    token: Store.getMeta('wolkeToken', ''),
    konto: Store.getMeta('wolkeKonto', null),
    bereich: Store.getMeta('wolkeBereich', ''),
    probe: Store.getMeta('wolkeProbe', ''),
    github: Store.getMeta('api:github', ''),
    geteilt: Store.getMeta('wolkeGeteilt', [])
  }, inhalt: { fremdeDa: !!Store.getBlock('blk_fremd_1'), eigeneDa: !!Store.getBlock(s.id) } };
}) as any;
p('Das Sitzungs-Token ist noch meines',
  fremd.jetzt.token === fremd.meins.token && fremd.jetzt.token !== 'sit_FREMDES_TOKEN',
  fremd.jetzt.token);
p('Konto und Bereich sind noch meine',
  fremd.jetzt.konto && fremd.jetzt.konto.id === fremd.meins.konto.id &&
  fremd.jetzt.bereich === fremd.meins.bereich,
  JSON.stringify({ k: fremd.jetzt.konto, b: fremd.jetzt.bereich }));
p('Die Schlüsselprobe ist noch meine — sonst meldete mein richtiges ' +
  'Passwort „falsch"',
  fremd.jetzt.probe === fremd.meins.probe, fremd.jetzt.probe);
p('Der api:-Schlüssel ist noch meiner',
  fremd.jetzt.github === fremd.meins.github, fremd.jetzt.github);
p('Die Teilliste ist NICHT die fremde — sie entscheidet Klartext gegen AES',
  !(fremd.jetzt.geteilt || []).length, JSON.stringify(fremd.jetzt.geteilt));
/* GEGENPROBE: die Rettung darf das Einspielen nicht verhindert haben. */
p('Gegenprobe: die Inhalte sind trotzdem die der Sicherung',
  fremd.inhalt.fremdeDa && !fremd.inhalt.eigeneDa, JSON.stringify(fremd.inhalt));

/* ========================================================================= */
console.log('\n4 · Die Marken stehen auf null, und die Frage steht');
const nachher = await A.seite.evaluate(() => ({
  hoch: Store.getMeta('wolkeMarkeHoch', 'X'),
  runter: Store.getMeta('wolkeMarkeRunter', 'X'),
  dateien: Store.getMeta('wolkeMarkeDateien', 'X'),
  frage: Wolke.neuAbgleichOffen(),
  schalter: Store.getMeta('wolkeAbgleich', 'nicht gesetzt'),
  erlaubt: Wolke.abgleichErlaubt()
})) as any;
p('Alle drei Marken sind leer',
  nachher.hoch === '' && nachher.runter === '' && nachher.dateien === '',
  JSON.stringify(nachher));
p('Die Frage steht, und der Abgleich ist angehalten',
  nachher.frage === true && nachher.erlaubt === false, JSON.stringify(nachher));
/* DER KERN DES BESCHLUSSES: keine Richtung ist gewählt worden. Ein
   `wolkeAbgleich: false` wäre schon „nur lokal" — die harmlosere Richtung,
   aber eine, die sich niemand ausgesucht hat. */
p('Und `wolkeAbgleich` steht NICHT auf false — keine Richtung ist gewählt',
  nachher.schalter !== false, String(nachher.schalter));
/* GEGENPROBE: ohne Anmeldung wäre die Frage eine Aufforderung ins Leere. */
const C = await geraet('Ohne Konto', false);
const ohneKonto = await C.seite.evaluate(async () => {
  const s = Store.addBlock(null, 'page', { text: 'Allein' });
  await Store.flush();
  const sicherung = Store.exportAll();
  await Store.importAll(sicherung, 'ersetzen');
  return { frage: Store.getMeta('wolkeNeuAbgleich', ''), seite: s.id };
}) as any;
p('Gegenprobe: ohne Anmeldung wird gar nicht erst gefragt',
  !ohneKonto.frage, String(ohneKonto.frage));

/* ========================================================================= */
console.log('\n5 · Solange die Frage steht, bewegt sich nichts');
const angehalten = await A.seite.evaluate(async () => {
  /* Der alte Schalter darf die Frage nicht übergehen — er beantwortet
     eine andere. */
  Wolke.abgleichSetzen(true);
  const trotzdem = Wolke.abgleichErlaubt();
  const lief = await Wolke.abgleichen();
  return { trotzdem, lief, frageNoch: Wolke.neuAbgleichOffen() };
}) as any;
p('`abgleichSetzen(true)` übergeht die Frage nicht',
  angehalten.trotzdem === false && angehalten.lief === null,
  JSON.stringify(angehalten));
p('Und die Frage steht danach immer noch', angehalten.frageNoch === true);
const gemeckert = await A.seite.evaluate(async () => {
  try { await Wolke.neuAbgleichAntwort('irgendwas'); return ''; }
  catch (e: unknown) { return e instanceof Error ? e.message : String(e); }
}) as string;
p('Eine unbekannte Antwort wird abgelehnt statt geraten',
  /lokal/.test(gemeckert) && /wolke/.test(gemeckert), gemeckert.slice(0, 90));
const lokalGewaehlt = await A.seite.evaluate(async () => {
  await Wolke.neuAbgleichAntwort('lokal');
  return { frage: Wolke.neuAbgleichOffen(), erlaubt: Wolke.abgleichErlaubt(),
           schalter: Store.getMeta('wolkeAbgleich', null) };
}) as any;
p('„Nur lokal": die Frage ist weg, der Abgleich bleibt aus',
  !lokalGewaehlt.frage && !lokalGewaehlt.erlaubt && lokalGewaehlt.schalter === false,
  JSON.stringify(lokalGewaehlt));
const wolkeGewaehlt = await A.seite.evaluate(async () => {
  /* Die Frage noch einmal stellen — wie nach einem zweiten Einspielen. */
  Store.setMeta('wolkeNeuAbgleich', Store.now());
  const vorher = Wolke.abgleichErlaubt();
  await Wolke.neuAbgleichAntwort('wolke');
  return { vorher, frage: Wolke.neuAbgleichOffen(), erlaubt: Wolke.abgleichErlaubt() };
}) as any;
p('„Vollständig abgleichen": die Frage ist weg, der Abgleich läuft wieder',
  wolkeGewaehlt.vorher === false && !wolkeGewaehlt.frage && wolkeGewaehlt.erlaubt === true,
  JSON.stringify(wolkeGewaehlt));
p('Und die eingespielte Seite hat den Server erreicht',
  !!(await amServer('blk_fremd_1')));

/* ========================================================================= */
console.log('\n6 · Die Basis wird neu gesät — sonst verstummen die Grabsteine');
/* KEIN viertes Gerät. Drei Chromium-Kontexte mit der ganzen App, jeder
   mit eigenem Abgleichtakt, sind in diesem Behälter schon die Grenze — ein
   viertes blieb beim Anlegen hängen, gemessen mit Markern in `geraet()`.
   §6 und §7 brauchen kein unberührtes Gerät, sondern nur eines, dessen
   Bestand der Server kennt. A ist genau das. */
const D = A;
const grab = await D.seite.evaluate(async () => {
  const s = Store.addBlock(null, 'page', { text: 'Grabsteinheft' });
  const bl = Store.addBlock(s.id, 'text', { text: 'Wird gelöscht.' });
  await Store.flush();
  await Wolke.abgleichen();              /* jetzt kennt der Server ihn */
  const sicherung = JSON.parse(Store.exportAll());
  Store.trashBlock(bl.id); Store.purgeBlock(bl.id);
  /* Die Sicherung bringt ihn NICHT wieder mit — der Grabstein muss also
     das Ersetzen überleben (E255) UND danach noch versandfähig sein. */
  delete sicherung.blocks[bl.id];
  await Store.importAll(JSON.stringify(sicherung), 'ersetzen');
  const basis = await Store.basisHolen(bl.id);
  return { id: bl.id,
           grabsteinDa: Store.blockGrabsteine().some((e: any) => e && e.id === bl.id),
           basisDa: !!basis };
}) as any;
p('Der Grabstein überlebt das Ersetzen (E255, unverändert)', grab.grabsteinDa);
p('Und er hat wieder einen gemeinsamen Stand — sonst wirft ihn die Wache weg',
  grab.basisDa);
const gemeldet = await D.seite.evaluate(async ([id]: [string]) => {
  await Wolke.neuAbgleichAntwort('wolke');
  return Store.blockGrabsteine().some((e: any) => e && e.id === id);
}, [grab.id] as [string]) as boolean;
const amServerWeg = await amServer(grab.id);
p('Der Abgleich meldet die Löschung wirklich weiter',
  !gemeldet && !!amServerWeg && Number(amServerWeg.geloescht) === 1,
  JSON.stringify({ merkliste: gemeldet, g: amServerWeg?.geloescht }));
/* DIE GEGENPROBE, und sie ist die wichtigste dieses Laufs: sie führt vor,
   was ohne das Neusäen geschähe. Ohne sie behauptete §6 nur, dass eine
   Zeile Code existiert. */
const ohneBasis = await D.seite.evaluate(async () => {
  const s = Store.addBlock(null, 'page', { text: 'Zweites Heft' });
  const bl = Store.addBlock(s.id, 'text', { text: 'Auch weg.' });
  await Store.flush();
  await Wolke.abgleichen();
  Store.trashBlock(bl.id); Store.purgeBlock(bl.id);
  /* Von Hand genau das tun, was `basisLeeren()` ohne Neusäen hinterliesse. */
  await Store.basisWeg(bl.id);
  await Wolke.abgleichen();
  return { id: bl.id,
           nochDa: Store.blockGrabsteine().some((e: any) => e && e.id === bl.id) };
}) as any;
const stumm = await amServer(ohneBasis.id);
p('Gegenprobe: ohne gemeinsamen Stand wird der Grabstein still ausgetragen',
  !ohneBasis.nochDa && !(stumm && Number(stumm.geloescht) === 1),
  JSON.stringify({ merkliste: ohneBasis.nochDa, g: stumm?.geloescht }));

/* ========================================================================= */
console.log('\n7 · Zusammenführen rettet die Identität genauso');
const dazu = await D.seite.evaluate(async () => {
  const meins = Store.getMeta('wolkeToken', '');
  const sicherung = JSON.parse(Store.exportAll(false, true));
  sicherung.meta['wolkeToken'] = 'sit_AUCH_FREMD';
  sicherung.meta['api:github'] = 'github_pat_AUCH_FREMD';
  sicherung.blocks['blk_dazu_1'] = { id: 'blk_dazu_1', type: 'page',
    text: 'Dazugelegt', content: [], parentId: null, parentTable: 'block',
    color: '', props: {}, created: Store.now(), edited: Store.now(),
    erstelltVon: 'probe', alive: true };
  Store.setMeta('api:github', 'github_pat_MEINER');
  await Store.importAll(JSON.stringify(sicherung), 'zusammenfuehren');
  return { meins, token: Store.getMeta('wolkeToken', ''),
           github: Store.getMeta('api:github', ''),
           dazuDa: !!Store.getBlock('blk_dazu_1'),
           frage: Wolke.neuAbgleichOffen() };
}) as any;
p('Auch beim Dazulegen bleibt das Token meines',
  dazu.token === dazu.meins && dazu.token !== 'sit_AUCH_FREMD', dazu.token);
p('Und der api:-Schlüssel auch', dazu.github === 'github_pat_MEINER', dazu.github);
p('Gegenprobe: der dazugelegte Block ist wirklich da', dazu.dazuDa);
/* Beim Dazulegen wird nichts weggeworfen, also steht auch keine Frage —
   der gemeinsame Stand bleibt gültig. */
p('Dazulegen stellt keine Frage — es wirft ja nichts weg', !dazu.frage);

p('Keine Seitenfehler auf allen Geräten', fehler.length === 0, fehler.join(' | ').slice(0, 200));

await browser.close();
alles.close();
await kern.stopp();
console.log(`\n${ok} bestanden, ${weg} durchgefallen`);
process.exit(weg ? 1 : 0);
