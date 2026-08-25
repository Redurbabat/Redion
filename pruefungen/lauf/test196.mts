/* Suite 162 — Agentenläufe unter Kontrolle (P3)
 *
 * Echte Produktwege: Agent.laufen, Panel, Dialog, gespeicherter Worker und
 * seiteAnlegen. Nur die Modellantwort wird bestimmt vorgegeben.
 *
 *   node pruefungen/lauf/test196.mts
 */
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8952;
const TYP: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon'
};
const server = http.createServer((a: IncomingMessage, b: ServerResponse) => {
  const rein = decodeURIComponent((a.url ?? '/').split('?')[0] ?? '/');
  const pfad = path.join(WURZEL, rein === '/' ? 'index.html' : rein.slice(1));
  if (!pfad.startsWith(WURZEL) || !fs.existsSync(pfad) || fs.statSync(pfad).isDirectory()) {
    b.writeHead(404); b.end(); return;
  }
  b.writeHead(200, { 'Content-Type': TYP[path.extname(pfad)] ?? 'application/octet-stream' });
  b.end(fs.readFileSync(pfad));
});
await new Promise<void>(f => server.listen(PORT, () => f()));

let ok = 0, offen = 0;
const p = (name: string, bedingung: unknown, extra = '') => {
  if (bedingung) { ok++; console.log('  ✓ ' + name); }
  else { offen++; console.log('  ✗ ' + name + (extra ? ' — ' + extra : '')); }
};
const gleich = (name: string, ist: unknown, soll: unknown) =>
  p(name, ist === soll, `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

const browser = await chromium.launch();
const seite = await browser.newPage({ viewport: { width: 1280, height: 900 } });
seite.setDefaultTimeout(7000);
const seitenfehler: string[] = [];
seite.on('pageerror', e => seitenfehler.push(e.message));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForTimeout(2400);
await seite.evaluate(() => {
  Store.setMeta('rundgangGesehen', true);
  document.getElementById('rg-willkommen')?.remove();
  /* Und die Einrichtung der Hauptwelten: sie legt sich beim ersten Start
     über alles und fängt Klicks ab (E132). */
  document.querySelector('.produkt-onboarding-lage')?.remove();
  document.getElementById('rg-einladung')?.remove();
  document.querySelectorAll('.overlay, .menu, .menu-grund').forEach(x => x.remove());
  Agent.notausSetzen(false);
  Store.setMeta('agent:tagesgrenze', 5000);
  Store.setMeta('agent:tagesstand', null);
  Store.setMeta('agent:fragen', 'nie');
  Store.setMeta('agent:zuletzt', 'p3');
  Store.setMeta('agent:eigene', [{
    id: 'p3', name: 'Grenzwächter', icon: '🛡', anweisung: 'Prüfung.',
    werkzeuge: ['seiteAnlegen', 'worker', 'fertig'], wissen: [],
    guthaben: 6, darfAllein: true, ausloeser: {}
  }]);
});
const grenzen = await seite.evaluate(() => ({
  aktionObjekte: Agent.AKTION_OBJEKTE_MAX,
  aktionBytes: Agent.AKTION_BYTES_MAX,
  laufObjekte: Agent.LAUF_OBJEKTE_MAX,
  grossObjekte: Agent.GROSS_OBJEKTE_AB,
  workerZeit: Agent.WORKER_ZEITLIMIT_MS
}));

console.log('\n1 · Registry, Lauf-ID, Status, Signal und gezielter Abbruch');
await seite.evaluate(() => {
  const g = globalThis as any;
  g.__p3EchteKI = KI.frageKurz;
  g.__p3Antwort = {};
  g.__p3Signal = {};
  KI.frageKurz = (prompt: string, _system?: string, opt?: { signal?: AbortSignal }) =>
    new Promise<string>(resolve => {
      const k = prompt.includes('LAUF-B') ? 'b' : 'a';
      g.__p3Antwort[k] = resolve; g.__p3Signal[k] = opt?.signal;
    });
  g.__p3A = Agent.laufen('p3', 'LAUF-A', undefined, { laufId: 'p3-a' });
  g.__p3B = Agent.laufen('p3', 'LAUF-B', undefined, { laufId: 'p3-b' });
});
await seite.waitForFunction(() => Agent.aktive().length === 2);
const aktiv = await seite.evaluate(() => Agent.aktive());
gleich('Zwei parallele Läufe stehen in derselben Registry', aktiv.length, 2);
p('Registry zeigt ID, Status, Start, Wirkung und Workerzahl', aktiv.every((x: any) =>
  x.id && x.status === 'laeuft' && x.begonnen && x.wirkung && x.worker === 0));
await seite.evaluate(() => {
  Agent.laufAbbrechen('p3-a', 'Nur A stoppen');
  (globalThis as any).__p3Antwort.b(JSON.stringify({
    gedanke: 'B fertig', werkzeug: 'fertig', argument: { antwort: 'B fertig' }
  }));
});
const ziel = await seite.evaluate(async () => {
  const g = globalThis as any;
  const [a, b] = await Promise.all([g.__p3A, g.__p3B]);
  const erg = { a: a.status, b: b.status, aId: a.id, bId: b.id,
    aSignal: g.__p3Signal.a.aborted, bSignal: g.__p3Signal.b.aborted,
    aktiv: Agent.aktive().length };
  KI.frageKurz = g.__p3EchteKI;
  return erg;
});
gleich('Nur der gewählte Lauf ist abgebrochen', (ziel as any).a, 'abgebrochen');
gleich('Nebenlauf wird regulär fertig', (ziel as any).b, 'fertig');
p('Nur das gewählte AbortSignal ist abgebrochen',
  (ziel as any).aSignal && !(ziel as any).bSignal, JSON.stringify(ziel));
p('Lauf-IDs bleiben im Protokoll erhalten',
  (ziel as any).aId === 'p3-a' && (ziel as any).bId === 'p3-b');
gleich('Registry wird nach Ende bereinigt', (ziel as any).aktiv, 0);

console.log('\n2 · Gezielter Abbruch ist im Panel erreichbar');
await seite.evaluate(() => {
  const g = globalThis as any;
  g.__p3EchteKI = KI.frageKurz;
  g.__p3PanelSignal = null;
  KI.frageKurz = (_p: string, _s?: string, opt?: { signal?: AbortSignal }) =>
    new Promise<string>(() => { g.__p3PanelSignal = opt?.signal; });
  Agent.panel();
  const feld = document.querySelector<HTMLTextAreaElement>('.overlay #aa');
  if (feld) feld.value = 'Panel-Abbruch';
  document.querySelector<HTMLElement>('.overlay [data-a="los"]')?.click();
});
await seite.waitForFunction(() => Agent.aktive().length === 1);
const panelVor = await seite.evaluate(() => ({
  sichtbar: !document.querySelector<HTMLButtonElement>('.overlay [data-a="abbrechen"]')?.hidden,
  id: Agent.aktive()[0]?.id
}));
p('Panel zeigt während des Laufs den Abbruchknopf', (panelVor as any).sichtbar);
p('Panel-Lauf hat vor der KI-Antwort eine ID', !!(panelVor as any).id);
await seite.click('.overlay [data-a="abbrechen"]');
await seite.waitForFunction(() => Agent.aktive().length === 0);
await seite.waitForFunction(() => /abgebrochen/.test(
  document.querySelector('.overlay .agent-fertig')?.textContent || ''));
const panelNach = await seite.evaluate(() => {
  const g = globalThis as any;
  const erg = { signal: g.__p3PanelSignal?.aborted, status: Agent.laeufe()[0]?.status };
  KI.frageKurz = g.__p3EchteKI;
  document.querySelectorAll('.overlay').forEach(x => x.remove());
  return erg;
});
p('Panelknopf reicht den Abbruch bis zur KI', (panelNach as any).signal);
gleich('Panel protokolliert abgebrochen', (panelNach as any).status, 'abgebrochen');

console.log('\n3 · Worker: Ein-/Ausgabe, Fehler, Zeit und Laufabbruch');
const worker = await seite.evaluate(async () => {
  const fangen = async (v: Promise<unknown>) => {
    try { await v; return { code: '', text: 'kam durch' }; }
    catch (e: any) { return { code: e?.code || e?.redionCode || '', text: String(e?.message || e) }; }
  };
  const ein = await fangen(Agent.workerLaufen({ code: 'return 1;' },
    { text: 'x'.repeat(Agent.WORKER_EINGABE_MAX_BYTES) }));
  const aus = await fangen(Agent.workerLaufen({
    code: 'return "x".repeat(' + Agent.WORKER_AUSGABE_MAX_BYTES + ');' }, {}));
  const fehler = await fangen(Agent.workerLaufen({ code: 'throw new Error("kaputt");' }, {}));
  const start = performance.now();
  const zeit = await fangen(Agent.workerLaufen({ code: 'while (true) {}' }, {}));
  return { ein, aus, fehler, zeit, dauer: performance.now() - start };
});
gleich('Zu große Eingabe wird vor Workerstart abgelehnt', (worker as any).ein.code,
  'WORKER_EINGABE_ZU_GROSS');
gleich('Zu große Ausgabe wird im Worker abgelehnt', (worker as any).aus.code,
  'WORKER_AUSGABE_ZU_GROSS');
gleich('Workerfehler ist unterscheidbar', (worker as any).fehler.code, 'WORKER_FEHLER');
gleich('Endlosschleife trifft die Zeitwache', (worker as any).zeit.code, 'WORKER_ZEITLIMIT');
p('Zeitwache endet ungefähr am veröffentlichten Limit',
  (worker as any).dauer >= (grenzen as any).workerZeit - 700 &&
  (worker as any).dauer < (grenzen as any).workerZeit + 2200,
  Math.round((worker as any).dauer) + ' ms');

await seite.evaluate(() => {
  const g = globalThis as any;
  Store.setMeta('agent:worker', [{ name: 'Endlos', beschreibung: 'Probe', code: 'while (true) {}' }]);
  g.__p3EchteKI = KI.frageKurz;
  KI.frageKurz = async () => JSON.stringify({ gedanke: 'Worker', werkzeug: 'worker',
    argument: { name: 'Endlos', eingabe: { echt: true } } });
  g.__p3WorkerStart = performance.now();
  g.__p3WorkerLauf = Agent.laufen('p3', 'Worker abbrechen', undefined, { laufId: 'p3-worker' });
});
await seite.waitForFunction(() => Agent.aktive().some((x: any) => x.id === 'p3-worker' && x.worker === 1));
await seite.evaluate(() => Agent.laufAbbrechen('p3-worker', 'Worker stoppen'));
const workerStop = await seite.evaluate(async () => {
  const g = globalThis as any;
  const prot = await g.__p3WorkerLauf;
  const erg = { status: prot.status, aufrufe: prot.workerAufrufe,
    dauer: performance.now() - g.__p3WorkerStart, aktiv: Agent.aktive().length };
  KI.frageKurz = g.__p3EchteKI;
  return erg;
});
gleich('Produktlauf zählt Workeraufruf', (workerStop as any).aufrufe, 1);
gleich('Laufabbruch beendet Worker', (workerStop as any).status, 'abgebrochen');
p('Abbruch wartet nicht auf die Zeitwache', (workerStop as any).dauer < 1600,
  Math.round((workerStop as any).dauer) + ' ms');
gleich('Kein Worker bleibt registriert', (workerStop as any).aktiv, 0);

console.log('\n4 · Harte Aktionsgrenzen greifen vor jedem Schreiben');
const hart = await seite.evaluate(async () => {
  const echt = KI.frageKurz;
  const lauf = async (plan: any, auftrag: string) => {
    let nr = 0;
    KI.frageKurz = async () => JSON.stringify(nr++ === 0 ? plan :
      { gedanke: 'fertig', werkzeug: 'fertig', argument: { antwort: 'fertig' } });
    /* Unbeaufsichtigt verhindert bei einer absichtlich ausgeschalteten
       harten Grenze, dass der Gegenprobelauf an einem Dialog hängt. */
    return Agent.laufen('p3', auftrag, undefined, { unbeaufsichtigt: true });
  };
  const obj = await lauf({ gedanke: 'zu viele', werkzeug: 'seiteAnlegen', argument: {
    titel: 'P3-HART-OBJEKTE', bloecke: Array.from({ length: Agent.AKTION_OBJEKTE_MAX },
      (_, i) => ({ typ: 'text', text: 'B' + i })) } }, 'Objektgrenze');
  const byt = await lauf({ gedanke: 'zu groß', werkzeug: 'seiteAnlegen', argument: {
    titel: 'P3-HART-BYTES', bloecke: [{ typ: 'text',
      text: 'x'.repeat(Agent.AKTION_BYTES_MAX + 128) }] } }, 'Bytegrenze');
  KI.frageKurz = echt;
  const da = (titel: string) => Object.values<any>(Store.cache.blocks)
    .some(b => b.alive && b.type === 'page' && b.text === titel);
  return { obj, byt, objDa: da('P3-HART-OBJEKTE'), bytDa: da('P3-HART-BYTES') };
});
p('Objektgrenze verhindert die ganze Seite', !(hart as any).objDa);
p('Objektgrenze ist die tatsächliche Ablehnungsursache',
  /Sicherheitsgrenze/.test((hart as any).obj.schritte[0].ergebnis),
  (hart as any).obj.schritte[0].ergebnis);
gleich('Wirkung zählt Seite plus alle Blöcke',
  (hart as any).obj.schritte[0].wirkung.objekte, (grenzen as any).aktionObjekte + 1);
gleich('Abgelehnte Handlung reserviert kein Laufbudget', (hart as any).obj.wirkung.objekte, 0);
p('Bytegrenze verhindert die ganze Seite', !(hart as any).bytDa);
p('Bytegrenze ist die tatsächliche Ablehnungsursache',
  /Sicherheitsgrenze/.test((hart as any).byt.schritte[0].ergebnis),
  (hart as any).byt.schritte[0].ergebnis);
p('Bytewirkung wird vorab gemessen',
  (hart as any).byt.schritte[0].wirkung.bytes > (grenzen as any).aktionBytes);

console.log('\n5 · Großaktion fragt trotz „gar nicht fragen“ ehrlich');
const grossBloecke = Array.from({ length: (grenzen as any).grossObjekte - 1 }, (_, i) =>
  ({ typ: 'text', text: 'G' + i }));
const grossStart = async (titel: string) => {
  await seite.evaluate(({ titel, bloecke }) => {
    const g = globalThis as any;
    g.__p3EchteKI = KI.frageKurz; g.__p3GrossNr = 0;
    KI.frageKurz = async () => JSON.stringify(g.__p3GrossNr++ === 0
      ? { gedanke: 'Großaktion ' + titel, werkzeug: 'seiteAnlegen', argument: { titel, bloecke } }
      : { gedanke: 'fertig', werkzeug: 'fertig', argument: { antwort: 'fertig' } });
    g.__p3GrossLauf = Agent.laufen('p3', 'Großaktion');
  }, { titel, bloecke: grossBloecke });
  await seite.waitForSelector('.overlay [data-w="ja"]');
};
await grossStart('P3-GROSS-NEIN');
const vorschau = await seite.evaluate(() => ({
  titel: document.querySelector('.overlay .fh')?.textContent || '',
  text: document.querySelector('.overlay .finder > div:nth-child(2)')?.textContent || '',
  knoepfe: [...document.querySelectorAll<HTMLElement>('.overlay [data-w]')].map(x => x.dataset.w)
}));
p('Titel kennzeichnet große Agentenänderung', /Große Agentenänderung/.test((vorschau as any).titel));
p('Vorschau nennt Werkzeug, Ziel, Objekte und Größe',
  /seiteAnlegen/.test((vorschau as any).text) && /P3-GROSS-NEIN/.test((vorschau as any).text) &&
  /Betroffene Objekte/.test((vorschau as any).text) && /Größe der Handlung/.test((vorschau as any).text));
p('Keine Pauschalfreigabe des ganzen Laufs', !(vorschau as any).knoepfe.includes('lauf'));
await seite.click('.overlay [data-w="nein"]');
const grossNein = await seite.evaluate(async () => {
  const g = globalThis as any; const prot = await g.__p3GrossLauf;
  KI.frageKurz = g.__p3EchteKI;
  return { prot, da: Object.values<any>(Store.cache.blocks)
    .some(b => b.alive && b.type === 'page' && b.text === 'P3-GROSS-NEIN') };
});
p('Absage verhindert die Großaktion vollständig', !(grossNein as any).da);

await grossStart('P3-GROSS-JA');
await seite.click('.overlay [data-w="ja"]');
const grossJa = await seite.evaluate(async () => {
  const g = globalThis as any; const prot = await g.__p3GrossLauf;
  KI.frageKurz = g.__p3EchteKI;
  const s = Object.values<any>(Store.cache.blocks)
    .find(b => b.alive && b.type === 'page' && b.text === 'P3-GROSS-JA');
  const erg = { da: !!s, inhalt: s?.content?.length || 0, wirkung: prot.wirkung.objekte };
  Agent.zuruecknehmen(prot); return erg;
});
p('Einmal ausdrücklich erlaubte Großaktion läuft', (grossJa as any).da);
gleich('… vollständig statt verkleinert', (grossJa as any).inhalt, grossBloecke.length);
gleich('… und mit Wirkung protokolliert', (grossJa as any).wirkung, (grenzen as any).grossObjekte);

console.log('\n6 · Laufgrenze summiert mehrere erlaubte Handlungen');
const stueck = Math.floor((grenzen as any).laufObjekte * 0.4);
const laufBloecke = Array.from({ length: stueck - 1 }, (_, i) => ({ typ: 'text', text: 'L' + i }));
await seite.evaluate(({ bloecke }) => {
  const g = globalThis as any; g.__p3EchteKI = KI.frageKurz;
  const plaene: any[] = [1, 2, 3].map(n => ({ gedanke: 'Teil ' + n,
    werkzeug: 'seiteAnlegen', argument: { titel: 'P3-LAUF-' + n, bloecke } }));
  plaene.push({ gedanke: 'fertig', werkzeug: 'fertig', argument: { antwort: 'fertig' } });
  g.__p3LaufNr = 0;
  KI.frageKurz = async () => JSON.stringify(plaene[Math.min(g.__p3LaufNr++, plaene.length - 1)]);
  g.__p3SummenLauf = Agent.laufen('p3', 'Laufgrenze');
}, { bloecke: laufBloecke });
await seite.waitForSelector('.overlay [data-w="ja"]');
await seite.click('.overlay [data-w="ja"]');
await seite.waitForFunction(() =>
  (document.querySelector('.overlay .finder > div:nth-child(2)')?.textContent || '').includes('Teil 2'));
await seite.click('.overlay [data-w="ja"]');
const summe = await seite.evaluate(async () => {
  const g = globalThis as any; const prot = await g.__p3SummenLauf;
  KI.frageKurz = g.__p3EchteKI;
  const da = [1, 2, 3].map(n => Object.values<any>(Store.cache.blocks)
    .some(b => b.alive && b.type === 'page' && b.text === 'P3-LAUF-' + n));
  const dritter = prot.schritte.find((x: any) => x.gedanke === 'Teil 3')?.ergebnis || '';
  Agent.zuruecknehmen(prot);
  return { da, dritter, status: prot.status, wirkung: prot.wirkung.objekte };
});
p('Erste zwei ausdrücklich erlaubte Handlungen laufen', (summe as any).da[0] && (summe as any).da[1]);
p('Dritte wird vor jeder Teilwirkung gestoppt', !(summe as any).da[2]);
gleich('Nur zwei Handlungen reservieren Laufbudget', (summe as any).wirkung, stueck * 2);
p('Protokoll nennt kumulierte Laufgrenze',
  (summe as any).status === 'fehler' && /insgesamt mehr/.test((summe as any).dritter),
  (summe as any).dritter);

console.log('\n7 · Bestehende Daten und Konsole');
const alt = await seite.evaluate(() => {
  Store.setMeta('agent:laeufe', [{ agent: 'Alt', auftrag: 'Vor P3', schritte: [],
    ids: [], felder: [], bleibt: [], zeit: '2026-01-01T00:00:00' }]);
  Agent.verlaufDialog();
  const text = document.querySelector('.overlay .lauf')?.textContent || '';
  document.querySelectorAll('.overlay').forEach(x => x.remove()); return text;
});
p('Altes Protokoll ohne ID/Status bleibt als fertig lesbar', /fertig/.test(alt), alt);
p('Keine Seitenfehler', seitenfehler.length === 0, seitenfehler.slice(0, 3).join(' | '));

await browser.close();
server.close();
console.log(`\n  Suite 162 — Agentenläufe unter Kontrolle: ${ok} ok, ${offen} offen`);
process.exit(offen ? 1 : 0);
