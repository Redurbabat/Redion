/* Suite 261 — Block-Grabsteine: Sofort-Löschen erreicht den Server
 * ============================================================================
 * (E254, L73 Teil 2.) Das verbreitete Muster `trashBlock(id); purgeBlock(id)`
 * entfernte den Satz aus dem Zwischenspeicher, bevor je ein Abgleich lief —
 * `zuSchicken` erzeugte nichts mehr, drüben lebte der Block weiter. Jetzt
 * merkt sich `purgeTief` je Satz ein versandfertiges Stück in
 * `wolkeBloeckeWeg`, und die Maschine schickt es VOR dem Holen als
 * geloescht.
 *
 * §1 GEMEINSAMER BESTAND auf zwei echten Geräten.
 * §2 DAS SOFORT-MUSTER füllt die Merkliste — samt Datenbank (Zeilen,
 *    Ansichten, Sammlung), deren Löschen zuSchicken nie ausdrücken konnte.
 * §3 DIE MERKLISTE ÜBERLEBT das Neuladen — die Löschabsicht stirbt nicht
 *    mit dem Tab.
 * §4 DER ABGLEICH meldet: Server-Satz trägt geloescht=1, Merkliste leer,
 *    basis weg.
 * §5 GERÄT B verliert den Block (Papierkorb — dokumentiertes
 *    Minimal-Verhalten); ein frisches Gerät C legt den Grabstein-Satz
 *    gar nicht erst an.
 * §6 KEIN ECHO: der eigene Grabstein kommt beim nächsten Holen nicht als
 *    Papierkorbleiche zurück.
 * §7 KONFLIKT: bearbeitet B, während A purgt, gewinnt der spätere Stand —
 *    „veraltet" trägt aus, der Block kehrt auf A zurück.
 * §8 WIEDER-ANLAGE derselben Kennung nimmt den Grabstein zurück.
 * §9 DER FRIST-PURGE des Papierkorbs schreibt dieselben Grabsteine.
 * §10 DIE BASIS-WACHE: offline Angelegtes-und-Gelöschtes bleibt stumm.
 *
 * Ports: 9027 (Prüfserver) und 9028 (App + Durchreiche).
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

const kern = await starte(9027);
const PORT = 9028;

const alles = http.createServer(async (req, res) => {
  const weg2 = req.url ?? '/';
  const u = new URL(weg2, 'http://x');
  const serverWeg = /^\/(konto|sync|datei|freigabe|veroeffentlichen|bereich|protokoll|marken|mcp|s)(\/|$)/
    .test(u.pathname ?? '') || /^\/v1\//.test(u.pathname ?? '') || u.pathname === '/api/stand';
  if (serverWeg) {
    const stuecke: Buffer[] = [];
    for await (const st of req) stuecke.push(Buffer.from(st));
    const antwort = await fetch('http://localhost:9027' + weg2, {
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
  body: JSON.stringify({ name: 'Grabsteinprobe' }) });
const BEREICH = (await b.json()).id;

/** Was der Server über einen Satz weiss — oder null. */
const amServer = (id: string) => kern.ablage.hole('saetze', { bereich: BEREICH, id });

const browser = await chromium.launch();
const fehler: string[] = [];
const geraet = async (name: string) => {
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 850 } });
  const seite = await ctx.newPage();
  seite.on('pageerror', (e: Error) => fehler.push(name + ': ' + e.message));
  await seite.goto(WURZEL + '/index.html');
  await seite.waitForTimeout(1800);
  const t = await machToken();
  await seite.evaluate(async ([tok, ber, nm]: [string, string, string]) => {
    Store.setMeta('wolkeToken', tok);
    Store.setMeta('wolkeBereich', ber);
    Store.setMeta('wolkeGeraet', nm);
    await Wolke.tokenUebernehmen(tok);
    await Wolke.schluesselSetzen('mein langer geheimer satz');
    Wolke.abgleichSetzen(true);
  }, [t, BEREICH, name] as [string, string, string]);
  return { seite, ctx };
};

const A = await geraet('Rechner');
const B2 = await geraet('Telefon');

console.log('\n1 · Gemeinsamer Bestand auf zwei Geräten');
const ids = await A.seite.evaluate(async () => {
  const s = Store.addBlock(null, 'page', { text: 'Projektheft' });
  const bl = Store.addBlock(s.id, 'text', { text: 'Der Kandidat.' });
  const zwei = Store.addBlock(s.id, 'text', { text: 'Der Streitfall.' });
  /* addDatabase gibt { block, collectionId, viewId } zurück — der Block
     liegt unter .block (nachgesehen, nicht geraten; E21). */
  const db = Store.addDatabase(s.id, 'Probedatenbank');
  const c = Store.getCollection(db.collectionId);
  const zeile = Store.addRow(c.id, { text: 'Zeile eins' });
  await Store.flush();
  await Wolke.abgleichen();
  await Wolke.abgleichen();
  return { seite: s.id, block: bl.id, streit: zwei.id, dbBlock: db.block.id,
           collection: c.id, view: (c.viewIds || [])[0] || '', zeile: zeile.id };
}) as any;
p('Gerät B holt den Bestand — Block, Zeile und Sammlung sind da',
  await B2.seite.evaluate(async (w: any) => {
    await Wolke.abgleichen();
    return !!Store.getBlock(w.block) && !!Store.getBlock(w.zeile) &&
           !!Store.getCollection(w.collection);
  }, ids));

console.log('\n2 · Das Sofort-Muster füllt die Merkliste');
const liste = await A.seite.evaluate(async (w: any) => {
  Store.trashBlock(w.block); Store.purgeBlock(w.block);
  Store.trashBlock(w.dbBlock); Store.purgeBlock(w.dbBlock);
  const l = Store.blockGrabsteine();
  const je = (id: string) => l.find((e: any) => e && e.id === id) || null;
  return {
    anzahl: l.length,
    block: je(w.block), zeile: je(w.zeile),
    collection: je(w.collection), view: je(w.view)
  };
}, ids) as any;
p('Der Block steht versandfertig darin — mit Seite und totem Satz',
  !!liste.block && liste.block.tabelle === 'blocks' &&
  liste.block.seite === ids.seite && liste.block.satz &&
  liste.block.satz.alive === false && !!liste.block.satz.edited,
  JSON.stringify(liste.block || {}).slice(0, 160));
p('Die Datenbank nimmt Zeile, Ansicht und Sammlung mit',
  !!liste.zeile && !!liste.collection && liste.collection.tabelle === 'collections' &&
  !!liste.view && liste.view.tabelle === 'views',
  'Einträge: ' + liste.anzahl);

console.log('\n3 · Die Merkliste überlebt das Neuladen');
await A.seite.evaluate(async () => { await Store.flush(); });
await A.seite.reload();
await A.seite.waitForTimeout(1800);
p('Nach dem Neuladen liegt die Löschabsicht noch da',
  await A.seite.evaluate((id: string) =>
    Store.blockGrabsteine().some((e: any) => e && e.id === id), ids.block));

console.log('\n4 · Der Abgleich meldet die Löschung');
/* Nach dem Neuladen erst wieder anmelden — wie test256 es tut.
 *
 * DER TAKT WIRD VORHER ABGESCHALTET (E436). Im vollen Lauf war der Punkt
 * „Auch die Sammlung ist drüben als gelöscht vermerkt" einmal rot, mit
 * `{"da":true,"g":0}` — die Sammlung am Server, aber ohne Grabstein. Hier
 * allein gefahren war er zweimal gruen.
 *
 * Der Grund steht in `maschine.ts:810`: `abgleichen()` kehrt SOFORT um und
 * gibt `null`, wenn schon einer laeuft (`zustand.laeuft`). Und `takt()`
 * stellt bei jeder Anmeldung einen Timer auf 120 Sekunden. Ein Lauf, der
 * unter Last laenger braucht, faengt sich also einen Abgleich ein, den er
 * nicht bestellt hat — und der ausdrueckliche Aufruf hier tut dann NICHTS,
 * waehrend im Hintergrund noch geschickt wird. Gemessen wird danach ein
 * Zwischenstand.
 *
 * `wolkeTakt = 0` heisst „nur von Hand" (E270). Damit gibt es keinen
 * zweiten Abgleich, und der Punkt misst, was er behauptet.
 *
 * DAS IST KEINE VERSTECKTE WARTEZEIT, sondern das Ausschliessen der
 * Ursache. Eine Prüfung, die unter Last einen Datenverlust meldet, den es
 * nicht gibt, wird nach dem dritten Mal ignoriert — und dann sieht niemand
 * mehr hin, wenn sie recht hat. */
const tokenNeu = await machToken();
const abgleichLief = await A.seite.evaluate(async ([tok]: [string]) => {
  Store.setMeta('wolkeTakt', '0');
  await Wolke.tokenUebernehmen(tok);
  await Wolke.schluesselSetzen('mein langer geheimer satz');
  Wolke.abgleichSetzen(true);
  /* Den Takt NACH der Anmeldung noch einmal stellen — `tokenUebernehmen`
     ruft `takt()`, und der liest die Marke, die eine Zeile vorher gesetzt
     wurde. Doppelt genaeht, weil die Reihenfolge sonst von innen abhaengt. */
  if (typeof Wolke.taktSetzen === 'function') Wolke.taktSetzen(0);
  const r = await Wolke.abgleichen();
  return r !== null;
}, [tokenNeu] as [string]);
/* Der Rueckgabewert ZUERST. War er `null`, hat gar kein Abgleich
   stattgefunden — dann sind die beiden Punkte darunter keine Auskunft ueber
   Grabsteine, sondern ueber einen Aufruf, der nichts tat. */
p('Der ausdrückliche Abgleich lief wirklich (kein null)', abgleichLief === true,
  String(abgleichLief));
const server1 = await amServer(ids.block);
const server2 = await amServer(ids.collection);
p('Der Server-Satz des Blocks trägt geloescht=1',
  !!server1 && Number(server1.geloescht) === 1, JSON.stringify({ da: !!server1, g: server1?.geloescht }));
p('Auch die Sammlung ist drüben als gelöscht vermerkt',
  !!server2 && Number(server2.geloescht) === 1, JSON.stringify({ da: !!server2, g: server2?.geloescht }));
const nachher = await A.seite.evaluate(async (id: string) => ({
  merkliste: Store.blockGrabsteine().length,
  basis: await Store.basisHolen(id)
}), ids.block) as any;
p('Merkliste leer, basis-Gedächtnis weg',
  nachher.merkliste === 0 && nachher.basis === null, JSON.stringify(nachher));

console.log('\n5 · Gerät B verliert den Block, Gerät C legt ihn nie an');
let beiB: any = null;
for (let i = 0; i < 16; i++) {
  await B2.seite.waitForTimeout(400);
  beiB = await B2.seite.evaluate(async (id: string) => {
    await Wolke.abgleichen();
    const bl = Store.getBlock(id);
    return { alive: bl ? bl.alive : '(weg)' };
  }, ids.block);
  if (beiB.alive === false || beiB.alive === '(weg)') break;
}
p('Auf B ist der Block aus dem Weg (Papierkorb oder ganz weg)',
  beiB.alive === false || beiB.alive === '(weg)', JSON.stringify(beiB));
const C = await geraet('Frisch');
p('Das frische Gerät C legt den Grabstein-Satz gar nicht erst an',
  await C.seite.evaluate(async (id: string) => {
    await Wolke.abgleichen();
    return !Store.getBlock(id);
  }, ids.block));

console.log('\n6 · Kein Echo auf A');
p('Der eigene Grabstein kommt nicht als Papierkorbleiche zurück',
  await A.seite.evaluate(async (id: string) => {
    await Wolke.abgleichen();
    return !Store.getBlock(id);
  }, ids.block));

console.log('\n7 · Konflikt: der spätere Stand gewinnt');
/* Reihenfolge mit Absicht: A purgt ZUERST (Grabstein trägt t1), DANN
   bearbeitet B (t2 > t1) und schickt hoch. As Grabstein prallt am Server
   als „veraltet" ab (gleiche Version, älteres geaendert), wird
   ausgetragen — und dasselbe Holen bringt Bs Stand auf A zurück. Die
   Gegenrichtung (Purge nach dem fremden Edit) gewinnt der Purge; das
   ist §5 in Reinform und dieselbe dokumentierte Regel. */
await A.seite.evaluate((id: string) => {
  Store.trashBlock(id); Store.purgeBlock(id);
}, ids.streit);
await B2.seite.evaluate(async (id: string) => {
  await new Promise(r => setTimeout(r, 10));
  Store.updateBlock(id, { text: 'Der Streitfall — überarbeitet.' });
  await Store.flush();
  await Wolke.abgleichen();
}, ids.streit);
const streit = await A.seite.evaluate(async (id: string) => {
  await Wolke.abgleichen();
  const zurueck = Store.getBlock(id);
  return { merkliste: Store.blockGrabsteine().some((e: any) => e && e.id === id),
           daText: zurueck ? zurueck.text : '(weg)' };
}, ids.streit) as any;
p('„Veraltet" trägt aus und Bs Stand kehrt auf A zurück',
  !streit.merkliste && streit.daText === 'Der Streitfall — überarbeitet.',
  JSON.stringify(streit));

console.log('\n8 · Wieder-Anlage derselben Kennung nimmt den Grabstein zurück');
p('Nach rohSetzen ist die Kennung aus der Merkliste',
  await A.seite.evaluate(async () => {
    const s = Store.addBlock(null, 'page', { text: 'Undo-Probe' });
    const bl = Store.addBlock(s.id, 'text', { text: 'Ich komme wieder.' });
    await Store.flush();
    await Wolke.abgleichen();
    const kopie = JSON.parse(JSON.stringify(Store.getBlock(bl.id)));
    Store.trashBlock(bl.id); Store.purgeBlock(bl.id);
    const drin = Store.blockGrabsteine().some((e: any) => e && e.id === bl.id);
    Store.rohSetzen('blocks', kopie);
    const nachher2 = Store.blockGrabsteine().some((e: any) => e && e.id === bl.id);
    return drin && !nachher2;
  }));

console.log('\n9 · Der Frist-Purge schreibt dieselben Grabsteine');
p('papierkorbAufraeumen füllt die Merkliste wie das Sofort-Muster',
  await A.seite.evaluate(async () => {
    const s = Store.addBlock(null, 'page', { text: 'Fristfall' });
    const bl = Store.addBlock(s.id, 'text', { text: 'Lange im Korb.' });
    await Store.flush();
    await Wolke.abgleichen();
    Store.trashBlock(bl.id);
    Store.updateBlock(bl.id, { trashedAt: '2020-01-01T00:00:00.000Z', edited: '2020-01-01T00:00:00.000Z' });
    /* Blöcke purgt der Papierkorb erst, wenn sie auch SICHTBAR alt sind
       (papierkorbSichtbarSeit) — für die Probe liegt beides im Jahr 2020. */
    Store.setMeta('papierkorbSichtbarSeit', '2020-01-01T00:00:00.000Z');
    await Store.papierkorbAufraeumen();
    return Store.blockGrabsteine().some((e: any) => e && e.id === bl.id);
  }));
await A.seite.evaluate(async () => { await Wolke.abgleichen(); });

console.log('\n10 · Die basis-Wache: offline Angelegtes bleibt stumm');
const stumm = await A.seite.evaluate(async () => {
  const s = Store.addBlock(null, 'page', { text: 'Nie oben' });
  const bl = Store.addBlock(s.id, 'text', { text: 'Kurzlebig.' });
  await Store.flush();
  /* KEIN Abgleich dazwischen — der Server hat den Block nie gesehen. */
  Store.trashBlock(bl.id); Store.purgeBlock(bl.id);
  const vorher = Store.blockGrabsteine().some((e: any) => e && e.id === bl.id);
  await Wolke.abgleichen();
  const nachher2 = Store.blockGrabsteine().some((e: any) => e && e.id === bl.id);
  return { id: bl.id, vorher, nachher: nachher2 };
}) as any;
p('Der Grabstein entsteht, wird aber still ausgetragen statt gemeldet',
  stumm.vorher && !stumm.nachher, JSON.stringify(stumm));
p('Und der Server hat nie von ihm gehört', !(await amServer(stumm.id)));

console.log('\n11 · Import „ersetzen" rettet die Löschabsicht hinüber (E255/L74)');
const importErg = await A.seite.evaluate(async () => {
  /* Zwei Kandidaten mit gemeinsamem Server-Stand; die Sicherung wird
     VOR dem Löschen gezogen und bringt nur EINEN von beiden wieder mit.
     Dessen Grabstein muss fallen (Wieder-Anlage), der andere überleben. */
  const s = Store.addBlock(null, 'page', { text: 'Importheft' });
  const bleibt = Store.addBlock(s.id, 'text', { text: 'Ich bin in der Sicherung.' });
  const faellt = Store.addBlock(s.id, 'text', { text: 'Mich kennt die Sicherung nicht mehr.' });
  await Store.flush();
  await Wolke.abgleichen();
  const sicherung = await Store.exportAll();
  const ohne = JSON.parse(sicherung);
  delete ohne.blocks[faellt.id];
  Store.trashBlock(bleibt.id); Store.purgeBlock(bleibt.id);
  Store.trashBlock(faellt.id); Store.purgeBlock(faellt.id);
  const vorher = Store.blockGrabsteine().map((e: any) => e && e.id);
  await Store.importAll(JSON.stringify(ohne), 'ersetzen');
  const nachher2 = Store.blockGrabsteine().map((e: any) => e && e.id);
  return { bleibtId: bleibt.id, faelltId: faellt.id,
           vorherBeide: vorher.includes(bleibt.id) && vorher.includes(faellt.id),
           bleibtWeg: !nachher2.includes(bleibt.id),
           faelltDa: nachher2.includes(faellt.id) };
}) as any;
p('Vor dem Import stehen beide Grabsteine', importErg.vorherBeide, JSON.stringify(importErg));
p('Der Grabstein des wiederhergestellten Blocks fällt — der andere überlebt das Ersetzen',
  importErg.bleibtWeg && importErg.faelltDa, JSON.stringify(importErg));
/* HIER STAND EINE UMGEHUNG, und sie hielt das ALTE Verhalten fest.
   Vor L76 (E279) tauschte „ersetzen" das Konto-Meta mit der Sicherung aus,
   also musste diese Probe die Verbindung von Hand neu setzen — mit einem
   frisch gebauten Token. Seit E279 überlebt die Anmeldung das Einspielen.
   Aus dem Behelf wird damit eine echte Prüfung: erst nachsehen, dass Token
   und Schlüssel noch da sind, dann die Frage aus L76 beantworten. */
const nachImport = await A.seite.evaluate(async ([vorher]: [string]) => {
  const identitaet = Store.getMeta('wolkeToken', '') === vorher && Wolke.hatSchluessel();
  /* Seit L76 hält das Ersetzen den Abgleich an und fragt. Ohne Antwort
     bewegt sich nichts — `abgleichSetzen(true)` allein reicht nicht. */
  const stand = Wolke.neuAbgleichOffen();
  await Wolke.neuAbgleichAntwort('wolke');
  return { identitaet, stand, offen: Store.blockGrabsteine().length };
}, [await A.seite.evaluate(() => Store.getMeta('wolkeToken', '')) as string] as [string]) as any;
p('Anmeldung und Schlüssel überleben das Einspielen (L76/E279)',
  nachImport.identitaet, JSON.stringify(nachImport));
p('Und das Einspielen hat die Frage gestellt, statt eine Richtung zu wählen',
  nachImport.stand === true, JSON.stringify(nachImport));
const geloeschtAmServer = await amServer(importErg.faelltId);
p('Der überlebende Grabstein erreicht den Server nach dem Import',
  nachImport.offen === 0 && !!geloeschtAmServer && Number(geloeschtAmServer.geloescht) === 1,
  JSON.stringify({ merkliste: nachImport.offen, g: geloeschtAmServer?.geloescht }));

p('Keine Seitenfehler auf allen Geräten', fehler.length === 0, fehler.join(' | ').slice(0, 200));

await browser.close();
alles.close();
await kern.stopp();
console.log(`\n${ok} bestanden, ${weg} durchgefallen`);
process.exit(weg ? 1 : 0);
