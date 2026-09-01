/* Suite 317 — Ein abgehakter Fund bleibt weg (L105 Punkt 2, E324)
 * ============================================================================
 * Wer einen Fund gesehen und für unwichtig befunden hat, sah ihn beim
 * nächsten Öffnen wieder. Für Geister ist das richtig — sie verschwinden von
 * selbst, sobald die Seite da ist. Für offene Fragen und Inseln nicht: manche
 * Frage bleibt absichtlich offen, und eine Liste, die einen beharrlich auf
 * dieselbe Stelle stösst, hört man nach dem dritten Mal nicht mehr.
 *
 *   §1 DIE KENNUNG ist stabil über Neuberechnungen — und ändert sich, wenn
 *      sich der Fund ändert.
 *   §2 ABGEHAKT HEISST WEG, auch nach neuem Rechnen.
 *   §3 UND ES WIRD GESAGT: der Satz nennt, wieviel nicht dabei ist.
 *   §4 ZURÜCK GEHT IMMER — nichts wurde gelöscht.
 *   §5 GEGENPROBE: ohne Abgehaktes steht kein Wort davon da.
 *   §6 DER HAKEN IST EIN HAKEN, kein Balken (E320-Falle).
 *
 * DER PRÜFSTEIN IST §5 UND DIE ZWEITE HÄLFTE VON §1. Eine Zeile „0 abgehakt"
 * stünde bei jedem Öffnen da und wäre nach dem zweiten Mal unsichtbar. Und
 * eine Kennung, die sich NIE ändert, hakte eine umformulierte Frage
 * stillschweigend mit ab — man hätte eine neue Frage und bekäme sie nie zu
 * sehen.
 *
 *   node pruefungen/lauf/test317.mts
 * ==========================================================================*/
declare const Store: any; declare const Wissensluecken: any;
declare const KnowledgeGaps: any;
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9328;

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll),
    `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

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
await new Promise<void>(f => { server.listen(PORT, () => f()); });

const browser = await chromium.launch();
const fehler: string[] = [];
const pc = await browser.newPage({ viewport: { width: 1280, height: 900 } });
pc.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 140)));
await pc.goto(`http://localhost:${PORT}/index.html`);
await pc.waitForTimeout(2500);

/* ------------------------------------------------------------------------ */
console.log('\n1 · Die Kennung ist stabil — und ändert sich mit dem Fund');

const kennungen = await pc.evaluate(() => {
  const K = KnowledgeGaps;
  const f = { art: 'frage', titel: 'Warum brummt der Trafo?', seiteId: 's1',
              satz: '', staerke: 50 };
  return {
    zweimal: [K.kennung(f), K.kennung({ ...f })],
    /* Leerzeichen und Grossschreibung dürfen keine neue Frage erfinden. */
    getrimmt: K.kennung({ ...f, titel: '  Warum  brummt   der Trafo?  ' }),
    gross: K.kennung({ ...f, titel: 'WARUM BRUMMT DER TRAFO?' }),
    /* Eine ANDERE Frage, eine andere Seite, eine andere Art: je eigene. */
    andereFrage: K.kennung({ ...f, titel: 'Warum brummt der Trafo bei Teillast?' }),
    andereSeite: K.kennung({ ...f, seiteId: 's2' }),
    andereArt: K.kennung({ ...f, art: 'insel' })
  };
});
gleich('Zweimal gerechnet gibt zweimal dasselbe',
  kennungen.zweimal[0], kennungen.zweimal[1]);
gleich('Zusätzliche Leerzeichen ändern nichts',
  kennungen.getrimmt, kennungen.zweimal[0]);
gleich('Gross- und Kleinschreibung auch nicht',
  kennungen.gross, kennungen.zweimal[0]);
/* WER SEINE FRAGE UMFORMULIERT, HAT EINE ANDERE FRAGE — und die soll wieder
   auftauchen. Eine Kennung, die das nicht mitbekommt, hakte sie stumm mit ab. */
p('Eine umformulierte Frage ist ein anderer Fund',
  kennungen.andereFrage !== kennungen.zweimal[0]);
p('Dieselbe Frage auf einer anderen Seite ebenso',
  kennungen.andereSeite !== kennungen.zweimal[0]);
p('Und eine andere Art ebenso',
  kennungen.andereArt !== kennungen.zweimal[0]);

/* ------------------------------------------------------------------------ */
console.log('\n5 · GEGENPROBE zuerst: ohne Abgehaktes kein Wort davon');

const frisch = await pc.evaluate(async () => {
  Store.setMeta('rundgangGesehen', true);
  Store.setMeta(Wissensluecken.SCHL_ERLEDIGT, []);
  document.querySelectorAll('.overlay').forEach(o => o.remove());
  const s = Store.addPage(null, { text: 'Elektrotechnik' });
  Store.addBlock(s.id, 'text', { text: 'Warum brummt der Trafo bei Teillast?' });
  Store.addBlock(s.id, 'text', { text: 'Wie misst man Blindleistung richtig?' });
  await Store.flush();
  const b = Wissensluecken.befund();
  return { versteckt: b.versteckt, satz: b.satz, gezaehlt: b.gezaehlt,
           erledigte: Wissensluecken.erledigte().length };
});
gleich('Nichts ist abgehakt', frisch.erledigte, 0);
gleich('Und der Befund sagt es auch so', frisch.versteckt, 0);
p('Der Satz erwähnt kein Abhaken', !/abgehakt/.test(frisch.satz), frisch.satz);

/* ------------------------------------------------------------------------ */
console.log('\n2 · Abgehakt heisst weg — auch nach neuem Rechnen');

const abgehakt = await pc.evaluate(async () => {
  const vorher = Wissensluecken.befund();
  const einer = vorher.funde.find((f: any) => f.art === 'frage') || vorher.funde[0];
  Wissensluecken.abhaken(einer.id);
  const nachher = Wissensluecken.befund();
  /* Und noch einmal, als wäre die App neu geöffnet worden. */
  const nochmal = Wissensluecken.befund();
  return {
    id: einer.id, titel: einer.titel,
    vorherZahl: vorher.funde.length, nachherZahl: nachher.funde.length,
    drin: nachher.funde.some((f: any) => f.id === einer.id),
    drinNochmal: nochmal.funde.some((f: any) => f.id === einer.id),
    versteckt: nachher.versteckt, satz: nachher.satz,
    gemerkt: Wissensluecken.erledigte()
  };
});
p('Ein Fund wurde abgehakt', !!abgehakt.id, String(abgehakt.titel));
gleich('Die Liste ist um eins kürzer',
  abgehakt.vorherZahl - abgehakt.nachherZahl, 1);
p('Er steht nicht mehr drin', abgehakt.drin === false);
p('Und beim nächsten Öffnen auch nicht', abgehakt.drinNochmal === false);
gleich('Gemerkt wurde genau eine Kennung', abgehakt.gemerkt, [abgehakt.id]);

/* ------------------------------------------------------------------------ */
console.log('\n3 · Und es wird gesagt');

/* EINE LISTE, DIE SCHWEIGEND ETWAS WEGLÄSST, liest sich wie
   Vollständigkeit — dieselbe Regel wie beim Schnitt je Art (E288). */
gleich('Der Befund zählt einen versteckten', abgehakt.versteckt, 1);
p('Und der Satz nennt ihn', /1 Fund ist abgehakt und nicht dabei/.test(abgehakt.satz),
  abgehakt.satz);

/* ------------------------------------------------------------------------ */
console.log('\n4 · Zurück geht immer');

const zurueck = await pc.evaluate(() => {
  const n = Wissensluecken.wiederZeigen();
  const b = Wissensluecken.befund();
  return { n, zahl: b.funde.length, versteckt: b.versteckt,
           satz: b.satz, gemerkt: Wissensluecken.erledigte().length };
});
gleich('Einer kam zurück', zurueck.n, 1);
gleich('Die Liste hat wieder ihre alte Länge', zurueck.zahl, abgehakt.vorherZahl);
gleich('Nichts ist mehr versteckt', zurueck.versteckt, 0);
gleich('Und der Merkzettel ist leer', zurueck.gemerkt, 0);
p('Der Satz schweigt wieder', !/abgehakt/.test(zurueck.satz), zurueck.satz);

/* ------------------------------------------------------------------------ */
console.log('\n6 · Der Haken ist ein Haken, kein Balken');

/* DIE E320-FALLE, zum dritten Mal an einem Tag: `.finder .res button` setzt
   `width:100%` und schlägt jede einzelne Klasse. Ohne die spezifischere
   Regel wäre das Häkchen so breit wie „Seite anlegen" darüber. */
const masse = await pc.evaluate(async () => {
  document.querySelectorAll('.overlay').forEach(o => o.remove());
  Wissensluecken.zeigen();
  await new Promise(r => setTimeout(r, 400));
  const hak = document.querySelector('.wl-hak') as HTMLElement;
  const tun = document.querySelector('.wl-tun') as HTMLElement;
  return { hak: Math.round(hak?.getBoundingClientRect().width || 0),
           tun: Math.round(tun?.getBoundingClientRect().width || 0),
           zurueckZeile: !!document.querySelector('.wl-zurueck') };
});
p('Es gibt einen Haken je Fund', masse.hak > 0);
p('Er ist schmal — höchstens halb so breit wie der Knopf darüber',
  masse.hak > 0 && masse.hak <= masse.tun / 2, `${masse.hak} gegen ${masse.tun}`);
p('Und ohne Abgehaktes steht keine Zurück-Zeile da',
  masse.zurueckZeile === false);

p('Keine JS-Fehler', fehler.length === 0, fehler.join(' | '));

console.log(`\n${ok}/${ok + weg} bestanden`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
