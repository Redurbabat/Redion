/* Suite 324 — Ohne Ort zählt die Rolle (L102 Punkt 2, zweite Hälfte, E331)
 * ============================================================================
 * Die Bestandsaufnahme vom 31. August fand: „Die Rechteprüfung der Agenten
 * fragt die falsche Seite. `agenten.ts:773` ruft `Konten.darf(recht)` OHNE
 * Seiten-ID; `sitzung.ts` setzt dann `seiteId || App.aktuelleSeite()`."
 *
 * E291 hat die Hälfte geschlossen — `zeileAnlegen` und `feldFuellen` prüfen
 * seither gegen die Datenbank, die sie wirklich meinen. Nachgezählt blieben
 * vier Werkzeuge ohne verbindliche Prüfung, und darunter zwei, die
 * SCHREIBEN.
 *
 * DER WURZELFEHLER LAG TIEFER, und er stand im Kommentar von `darf` schon
 * beschrieben: „‚darf ich überhaupt bearbeiten' ist eine Frage nach der
 * Rolle, nicht nach einem Ort." Der Code beantwortete sie nicht mit der
 * Rolle, sondern mit `true`. Solange die Startansicht eine Seite war, fiel
 * das nicht auf; seit E132 ist sie das Heute-Dashboard — also keine Seite,
 * also alles erlaubt, für JEDES Konto.
 *
 *   §1 OHNE ORT UND OHNE OFFENE SEITE zählt die Rolle, nicht das Ja.
 *   §2 `darfUeberhaupt` fragt NUR die Rolle — auch mit offener Seite.
 *   §3 DIE VIER WERKZEUGE prüfen jetzt gegen ihr Ziel.
 *   §4 GEGENPROBE: ein volles Konto darf weiterhin alles.
 *   §5 UND `suchen` brauchte nie eine — nachgesehen, nicht angenommen.
 *
 *   node pruefungen/lauf/test324.mts
 * ==========================================================================*/
declare const Store: any; declare const App: any; declare const Konten: any;
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9522;

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
  '.png': 'image/png', '.json': 'application/json', '.mjs': 'text/javascript',
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
pc.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 160)));
await pc.goto(`http://localhost:${PORT}/index.html`);
await pc.waitForTimeout(2600);

const gemessen = await pc.evaluate(async () => {
  const w = globalThis as any;
  Store.setMeta('rundgangGesehen', true);
  document.querySelectorAll('.overlay').forEach(o => o.remove());

  /* Ein Konto mit der Rolle `lesen` — und es ist das AKTIVE. */
  const k = Konten.anlegen({ name: 'Nur-Leser', mail: 'leser@test',
                             herkunft: 'lokal', rolleId: 'lesen' });
  const liste = Store.getMeta('konten', []) || [];
  const meins = liste.find((x: any) => x.id === k.id);
  if (meins) meins.rolle = 'lesen';
  Store.setMeta('konten', liste);
  Store.setMeta('kontoAktiv', k.id);

  const seite = Store.addPage(null, { text: 'Eine Seite' });
  /* Auf DIESER Seite darf das Konto lesen und sonst nichts — das ist der
     Ort, an dem `seiteAnlegen` und `datenbankAnlegen` schreiben würden. */
  Store.updateBlock(seite.id, { freigaben: { [k.id]: 'lesen' } });
  await Store.flush();

  /* ── §1/§2: die Rechnung selbst, ohne offene Seite ──────────────────── */
  App.oeffne('');                              /* Startansicht: keine Seite */
  await new Promise(r => setTimeout(r, 200));
  const ohneSeite = {
    aktuelle: App.aktuelleSeite() || '',
    darfBearbeiten: Konten.darf('bearbeiten'),
    darfLesen: Konten.darf('lesen'),
    ueberhauptBearbeiten: Konten.darfUeberhaupt('bearbeiten'),
    ueberhauptLesen: Konten.darfUeberhaupt('lesen'),
    rolle: Konten.aktiv().rolle
  };

  /* Mit offener Seite: `darf` fragt die Seite, `darfUeberhaupt` die Rolle. */
  App.oeffne(seite.id);
  await new Promise(r => setTimeout(r, 200));
  const mitSeite = {
    aktuelle: App.aktuelleSeite() || '',
    darfBearbeiten: Konten.darf('bearbeiten'),
    ueberhauptBearbeiten: Konten.darfUeberhaupt('bearbeiten')
  };

  /* ── §3: die vier Werkzeuge ──────────────────────────────────────────── */
  const W = w.Agent && w.Agent.WERKZEUGE ? w.Agent.WERKZEUGE : null;
  const lauf = async (name: string, arg: any): Promise<string> => {
    if (!W || !W[name]) return '(Werkzeug fehlt: ' + name + ')';
    try { return String(await W[name].lauf(arg, { ids: [], bleibt: [] })); }
    catch (e: any) { return 'FEHLER: ' + String(e && e.message || e); }
  };

  /* Eine Datenbank anlegen, solange noch VOLL — dann Rolle zurücksetzen.
     `Store.addCollection` gibt es NICHT; der Griff heisst `addDatabase` und
     nimmt die Elternseite. Der erste Anlauf hier rief den erfundenen Namen,
     bekam `null`, und §3 meldete „Keine Datenbank gefunden" statt „darfst
     du nicht lesen" — der Prüflauf hatte unrecht, nicht das Erzeugnis. */
  Store.setMeta('kontoAktiv', '');
  const dbSeite = Store.addPage(null, { text: 'Datenbankseite' });
  const c = Store.addDatabase(dbSeite.id, 'Geheime Tabelle');
  /* UND DIESE SEITE IST FÜR DAS KONTO GESPERRT.
     Der zweite Anlauf mass hier mit der blossen Rolle `lesen` — und die
     DARF lesen, also gab `datenbankLesen` die Tabelle zurück, ganz richtig.
     Wer prüfen will, dass eine Prüfung bindet, braucht einen Fall, in dem
     sie NEIN sagen muss: eine Freigabe `kein` auf der Seite, auf der die
     Datenbank wohnt. */
  Store.updateBlock(dbSeite.id, { freigaben: { [k.id]: 'kein' } });
  await Store.flush();
  Store.setMeta('kontoAktiv', k.id);

  App.oeffne(seite.id);
  await new Promise(r => setTimeout(r, 150));
  const vorher = Object.keys(Store.cache.blocks).length;
  const antworten = {
    seiteAnlegen: await lauf('seiteAnlegen', { titel: 'Verbotene Seite' }),
    datenbankAnlegen: await lauf('datenbankAnlegen', { name: 'Verbotene DB', spalten: [] }),
    datenbankLesen: await lauf('datenbankLesen', { name: 'Geheime' }),
    worker: await lauf('worker', { name: 'gibtEsNicht' })
  };
  const nachher = Object.keys(Store.cache.blocks).length;

  /* ── §4: Gegenprobe mit vollem Konto ─────────────────────────────────── */
  Store.setMeta('kontoAktiv', '');
  App.oeffne(seite.id);
  await new Promise(r => setTimeout(r, 150));
  const vorherVoll = Object.keys(Store.cache.blocks).length;
  const vollAntworten = {
    seiteAnlegen: await lauf('seiteAnlegen', { titel: 'Erlaubte Seite' }),
    datenbankLesen: await lauf('datenbankLesen', { name: 'Geheime' })
  };
  const nachherVoll = Object.keys(Store.cache.blocks).length;
  const vollDarf = {
    ohneSeite: (App.oeffne(''), Konten.darf('bearbeiten')),
    ueberhaupt: Konten.darfUeberhaupt('bearbeiten'),
    rolle: Konten.aktiv().rolle
  };

  return { ohneSeite, mitSeite, antworten, vorher, nachher,
           vollAntworten, vorherVoll, nachherVoll, vollDarf,
           hatDb: !!c, werkzeugeDa: !!W };
});

/* ------------------------------------------------------------------------ */
console.log('\n1 · Ohne Ort zählt die Rolle');

gleich('Die Startansicht ist wirklich keine Seite', gemessen.ohneSeite.aktuelle, '');
gleich('Das Konto hat die Rolle `lesen`', gemessen.ohneSeite.rolle, 'lesen');
/* DER KERN DES BOGENS. Vorher stand hier `true`. */
p('`darf("bearbeiten")` sagt NEIN', gemessen.ohneSeite.darfBearbeiten === false,
  String(gemessen.ohneSeite.darfBearbeiten));
/* UND ES IST KEIN PAUSCHALES NEIN: lesen darf es sehr wohl. Ein Wächter,
   der alles verbietet, ist so wenig wert wie einer, der alles erlaubt. */
p('`darf("lesen")` sagt weiterhin JA', gemessen.ohneSeite.darfLesen === true,
  String(gemessen.ohneSeite.darfLesen));

/* ------------------------------------------------------------------------ */
console.log('\n2 · `darfUeberhaupt` fragt nur die Rolle');

gleich('Ohne Seite: bearbeiten nein, lesen ja',
  [gemessen.ohneSeite.ueberhauptBearbeiten, gemessen.ohneSeite.ueberhauptLesen],
  [false, true]);
/* AUCH MIT OFFENER SEITE bleibt es die Rollenfrage — sonst wäre es nur ein
   zweiter Name für `darf`. */
p('Mit offener Seite bleibt `darfUeberhaupt` bei der Rolle',
  gemessen.mitSeite.ueberhauptBearbeiten === false,
  String(gemessen.mitSeite.ueberhauptBearbeiten));

/* ------------------------------------------------------------------------ */
console.log('\n3 · Die vier Werkzeuge prüfen gegen ihr Ziel');

p('Die Werkzeuge sind von aussen erreichbar', gemessen.werkzeugeDa);
p('`seiteAnlegen` wird abgewiesen',
  /darfst du nichts anlegen/.test(gemessen.antworten.seiteAnlegen),
  gemessen.antworten.seiteAnlegen);
p('`datenbankAnlegen` wird abgewiesen',
  /darfst du nichts anlegen/.test(gemessen.antworten.datenbankAnlegen),
  gemessen.antworten.datenbankAnlegen);
p('`datenbankLesen` wird abgewiesen',
  /darfst du nicht lesen/.test(gemessen.antworten.datenbankLesen),
  gemessen.antworten.datenbankLesen);
p('`worker` wird abgewiesen',
  /Rolle erlaubt kein/.test(gemessen.antworten.worker),
  gemessen.antworten.worker);

/* UND ES IST NICHT NUR EIN SATZ: es darf auch wirklich nichts entstanden
   sein. Eine Absage, die trotzdem schreibt, ist die schlimmste Sorte. */
gleich('Es ist kein einziger Block dazugekommen',
  gemessen.nachher, gemessen.vorher);

/* ------------------------------------------------------------------------ */
console.log('\n4 · GEGENPROBE: ein volles Konto darf weiterhin alles');

/* OHNE DIESEN ABSCHNITT wäre §3 auch mit einem Wächter grün, der einfach
   alles verbietet. */
gleich('Ohne Konto gilt die Rolle `voll`', gemessen.vollDarf.rolle, 'voll');
gleich('Und `darf`/`darfUeberhaupt` sagen beide ja',
  [gemessen.vollDarf.ohneSeite, gemessen.vollDarf.ueberhaupt], [true, true]);
p('`seiteAnlegen` legt wirklich an',
  /angelegt/.test(gemessen.vollAntworten.seiteAnlegen),
  gemessen.vollAntworten.seiteAnlegen);
p('Und es sind Blöcke dazugekommen',
  gemessen.nachherVoll > gemessen.vorherVoll,
  gemessen.vorherVoll + ' → ' + gemessen.nachherVoll);
/* NICHT die Abwesenheit einer Absage messen. Der erste Wurf tat genau das
   und war grün, obwohl die Antwort „Keine Datenbank gefunden" lautete —
   auch das enthält kein „darfst du nicht". Gemessen wird der NAME der
   Tabelle, also dass wirklich etwas zurückkam. */
p('`datenbankLesen` liefert die Tabelle',
  /Geheime Tabelle/.test(gemessen.vollAntworten.datenbankLesen),
  gemessen.vollAntworten.datenbankLesen.slice(0, 90));
p('Die Datenbank für diese Prüfung ist überhaupt entstanden', gemessen.hatDb);

/* ------------------------------------------------------------------------ */
console.log('\n5 · Und `suchen` brauchte nie eine');

/* NACHGESEHEN, NICHT ANGENOMMEN. Der erste Entwurf dieses Bogens wollte
   `suchen` eine Prüfung geben — `Kontext.finden` hat sie seit jeher. */
const kontext = fs.readFileSync(
  path.join(WURZEL, 'src/bereiche/ki/kontext.ts'), 'utf-8');
p('`Kontext.finden` wirft heraus, was nicht gelesen werden darf',
  /if \(!Konten\.darf\('lesen', e\.seiteId\)\) return null;/.test(kontext));

/* Und im Quelltext: jedes Werkzeug mit `bearbeiten` hat eine Prüfung. */
const agenten = fs.readFileSync(
  path.join(WURZEL, 'src/bereiche/ki/agenten.ts'), 'utf-8')
  .replace(/\/\*[\s\S]*?\*\//g, ' ');
const bloecke = agenten.split(/\n    (?=[a-zA-Z]+: \{)/);
const schreiber = bloecke.filter(b => /recht: 'bearbeiten'/.test(b));
const ohnePruefung = schreiber
  .filter(b => !/Konten\.(darf|darfAnSammlung|darfUeberhaupt)\(/.test(b))
  .map(b => (b.match(/^\s*([a-zA-Z]+): \{/) || [])[1] || '?');
gleich('Kein Schreibwerkzeug ohne Prüfung', ohnePruefung, []);
p('Und es sind wirklich mehrere Schreibwerkzeuge',
  schreiber.length >= 4, String(schreiber.length));

gleich('Keine JS-Fehler', fehler, []);

await browser.close();
await new Promise<void>(f => server.close(() => f()));

console.log(`\n${ok}/${ok + weg} bestanden`);
process.exitCode = weg ? 1 : 0;
