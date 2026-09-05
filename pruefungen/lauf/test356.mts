/* Suite 356 — Heft bleibt Heft beim Sperren, Fach bleibt Fach, wache Zeit, die Uhr überlebt (E364)
 * ============================================================================
 * Vier kleine Löcher, die alle dieselbe Form haben: etwas verschwindet oder
 * zählt falsch, und niemand meldet es (§46/§47).
 *
 *   1 · SPERREN: `Werkzeuge.sperren` fragt über den Bus, was die Seite
 *       mitnehmen soll; das Regal antwortet „heftArt: heft" — ein anderswo
 *       verschlüsseltes Heft bleibt im Regal (L78 Punkt 4).
 *   2 · FACH: ein abgeleitetes Fach merkt sich, dass es eines ist, und
 *       behält seine Karte, wenn das letzte Heft im Papierkorb liegt
 *       (L78 Punkt 5). Der Merker kann nicht lügen.
 *   3 · WACHE ZEIT: Schlaf, verborgene Registerkarte und eine rückwärts
 *       gestellte Uhr zählen nicht (L81 Punkt 2).
 *   4 · DIE UHR ÜBERLEBT das Neuladen (L81 Punkt 4).
 *   5 · Keine Seitenfehler.
 *
 *   node pruefungen/lauf/test356.mts
 * ==========================================================================*/
declare const Store: any; declare const App: any; declare const Notebook: any;
declare const Werkzeuge: any; declare const Zeitmesser: any; declare const Ereignisse: any;
declare const ARTEN: any;
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9366;

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll), `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

const TYP: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png',
  '.json': 'application/json', '.mjs': 'text/javascript', '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon'
};
const server = http.createServer((a: IncomingMessage, b: ServerResponse) => {
  const rein = decodeURIComponent((a.url ?? '/').split('?')[0] ?? '/');
  const pfad = path.join(WURZEL, rein === '/' ? 'index.html' : rein.slice(1));
  if (!pfad.startsWith(WURZEL) || !fs.existsSync(pfad) || fs.statSync(pfad).isDirectory()) { b.writeHead(404); b.end(); return; }
  b.writeHead(200, { 'Content-Type': TYP[path.extname(pfad)] ?? 'application/octet-stream' });
  b.end(fs.readFileSync(pfad));
});
await new Promise<void>(f => { server.listen(PORT, () => f()); });
const browser = await chromium.launch();
const fehler: string[] = [];
const ktx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const pg = await ktx.newPage();
pg.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 160)));
pg.on('dialog', d => d.dismiss().catch(() => {}));
const aufraeumen = async (): Promise<void> => {
  await pg.evaluate(() => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelector('.produkt-onboarding-lage')?.remove();
    document.getElementById('rg-willkommen')?.remove();
    document.getElementById('rg-einladung')?.remove();
    document.querySelectorAll('.overlay').forEach(o => o.remove());
  });
};
await pg.goto(`http://localhost:${PORT}/index.html`);
await pg.waitForTimeout(2800);
await aufraeumen();

/* ── 1 ────────────────────────────────────────────────────────────────── */
console.log('\n1 · Sperren: das Regal antwortet, bevor die Seite zugeht (L78 Punkt 4)');
const frageDa = await pg.evaluate(() => ({
  imRegister: typeof ARTEN !== 'undefined' && ARTEN.seiteWirdGesperrt,
  zuhoerer: Ereignisse.uebersicht().find((u: any) => u.name === ARTEN.seiteWirdGesperrt)?.zuhoerer ?? 0
}));
gleich('Der Name steht im Register', frageDa.imRegister, 'seite.wird-gesperrt');
p('… und genau ein Zuhörer hängt daran (das Regal)', frageDa.zuhoerer === 1, String(frageDa.zuhoerer));

const gesperrt = await pg.evaluate(async () => {
  /* Ein echtes Heft: eine Seite mit einem Blatt darin. */
  const heft = Store.addPage(null, { text: 'Physik-Heft', icon: '📓' });
  Store.addBlock(heft.id, 'blatt', { text: '', papier: 'liniert' });
  /* Und eine gewöhnliche Seite daneben — sie ist kein Heft. */
  const seite = Store.addPage(null, { text: 'Einkaufszettel', icon: '📄' });
  Store.addBlock(seite.id, 'text', { text: 'Milch' });
  await Store.flush();

  /* Die ANTWORT auf die Frage, bevor irgendetwas gesperrt ist. */
  const antwortHeft = Ereignisse.frage(ARTEN.seiteWirdGesperrt, { id: heft.id });
  const antwortSeite = Ereignisse.frage(ARTEN.seiteWirdGesperrt, { id: seite.id });

  /* Jetzt wirklich sperren — über den ZENTRALEN Weg (Seitenmenü/Palette),
     nicht über das Regal. Der Passwortdialog ist ein prompt(). */
  const altPrompt = window.prompt;
  (window as any).prompt = () => 'geheim123';
  try {
    await Werkzeuge.sperren(Store.getBlock(heft.id));
    await Werkzeuge.sperren(Store.getBlock(seite.id));
  } finally { (window as any).prompt = altPrompt; }
  const nachHeft = Store.getBlock(heft.id);
  const nachSeite = Store.getBlock(seite.id);
  return {
    antwortHeft, antwortSeite,
    heft: { locked: !!nachHeft.locked, heftArt: nachHeft.heftArt ?? null, kinder: Store.childrenOf(heft.id).length },
    seite: { locked: !!nachSeite.locked, heftArt: nachSeite.heftArt ?? null },
    heftId: heft.id, seiteId: seite.id
  };
});
gleich('Die Frage am Heft wird mit „heftArt: heft" beantwortet', gesperrt.antwortHeft, [{ heftArt: 'heft' }]);
gleich('… an einer gewöhnlichen Seite mit gar nichts', gesperrt.antwortSeite, []);
gleich('Nach dem Sperren: verschlüsselt, Merker gesetzt, keine lesbaren Kinder',
  gesperrt.heft, { locked: true, heftArt: 'heft', kinder: 0 });
gleich('Die gewöhnliche Seite bleibt ohne Merker', gesperrt.seite, { locked: true, heftArt: null });
const imRegal = await pg.evaluate(async () => {
  Notebook.oeffnen();
  await new Promise(f => setTimeout(f, 500));
  /* Die Karten des Regals: `.nh-karte` mit einem `.bib-deckel` darin. */
  return [...document.querySelectorAll('.nh-karte')]
    .map(k => (k.textContent || '').replace(/\s+/g, ' ').trim());
});
p('Das gesperrte Heft steht im Regal', imRegal.some(t => /Physik-Heft/.test(t)), JSON.stringify(imRegal).slice(0, 200));
p('… der Einkaufszettel nicht', !imRegal.some(t => /Einkaufszettel/.test(t)), JSON.stringify(imRegal).slice(0, 200));

/* ── 2 ────────────────────────────────────────────────────────────────── */
console.log('\n2 · Ein Fach merkt sich, dass es eines ist (L78 Punkt 5)');
const fach = await pg.evaluate(async () => {
  /* Eine GEWÖHNLICHE Seite (kein heftArt), in der ein Heft liegt. */
  const ordner = Store.addPage(null, { text: 'Schule 26', icon: '📁' });
  const heft = Store.addPage(ordner.id, { text: 'Mathe', icon: '📓' });
  Store.addBlock(heft.id, 'blatt', { text: '', papier: 'kariert' });
  /* Und eine gewöhnliche Seite mit einem Textkind — nie ein Fach. */
  const keinFach = Store.addPage(null, { text: 'Nur Text', icon: '📄' });
  Store.addBlock(keinFach.id, 'text', { text: 'x' });
  await Store.flush();
  const vorher = Store.getBlock(ordner.id).heftArt ?? null;
  Notebook.oeffnen();
  await new Promise(f => setTimeout(f, 400));
  const nachher = Store.getBlock(ordner.id).heftArt ?? null;
  const keinFachMerker = Store.getBlock(keinFach.id).heftArt ?? null;
  return { ordnerId: ordner.id, heftId: heft.id, vorher, nachher, keinFachMerker };
});
gleich('Vor dem ersten Zeichnen trägt der Ordner keinen Merker', fach.vorher, null);
gleich('Nach dem Zeichnen des Regals ist er ein Fach', fach.nachher, 'fach');
gleich('Eine Seite mit Text bekommt keinen Merker — er kann nicht lügen', fach.keinFachMerker, null);
const nachPapierkorb = await pg.evaluate(async ([heftId]: [string]) => {
  Store.trashBlock(heftId);
  await Store.flush();
  Notebook.oeffnen();
  await new Promise(f => setTimeout(f, 400));
  const texte = [...document.querySelectorAll('.nh-karte')]
    .map(k => (k.textContent || '').replace(/\s+/g, ' ').trim());
  return { sichtbar: texte.some(t => /Schule 26/.test(t)), texte: texte.slice(0, 6) };
}, [fach.heftId] as [string]);
p('Liegt das letzte Heft im Papierkorb, steht die Fach-Karte weiter da',
  nachPapierkorb.sichtbar, JSON.stringify(nachPapierkorb.texte));
const blattImFach = await pg.evaluate(async ([ordnerId]: [string]) => {
  /* Bekommt der Ordner selbst ein Blatt, ist er kein Fach mehr — der
     Merker darf das nicht überstimmen. */
  Store.addBlock(ordnerId, 'blatt', { text: '', papier: 'blanko' });
  await Store.flush();
  Notebook.oeffnen();
  await new Promise(f => setTimeout(f, 400));
  return [...document.querySelectorAll('.nh-fach')]
    .map(k => (k.textContent || '').replace(/\s+/g, ' ').trim())
    .some(t => /Schule 26/.test(t));
}, [fach.ordnerId] as [string]);
p('Bekommt der Ordner selbst ein Blatt, ist er kein Fach mehr', !blattImFach);

/* ── 3 ────────────────────────────────────────────────────────────────── */
console.log('\n3 · Wache Zeit: Schlaf und verborgene Registerkarte zählen nicht (L81 Punkt 2)');
const zeit = await pg.evaluate(async () => {
  /* Die Wanduhr ist steuerbar: der Tick liest `Date.now()`. */
  const echt = Date.now;
  let versatz = 0;
  (Date as any).now = () => echt.call(Date) + versatz;
  const warte = (ms: number) => new Promise(f => setTimeout(f, ms));
  try {
    Zeitmesser.start('stoppuhr');
    await warte(1200);
    const nachEins = Zeitmesser.stand().sekunden;
    /* Zwei Stunden Schlaf. */
    versatz += 2 * 60 * 60 * 1000;
    await warte(700);
    const nachSchlaf = Zeitmesser.stand();
    /* Die Uhr eine Stunde zurückstellen (Sommerzeit, falsch gestellte Uhr). */
    versatz -= 60 * 60 * 1000;
    await warte(700);
    const nachRueck = Zeitmesser.stand().sekunden;
    /* Verborgene Registerkarte. */
    /* LANG GENUG, DASS DAS ZÄHLEN AUFFIELE. Der erste Wurf verbarg die
       Registerkarte 1,2 s und liess eine Sekunde Toleranz — damit blieb die
       Probe auch dann grün, wenn verborgene Zeit MITZÄHLT (§55.2). Jetzt
       sind es drei Sekunden, und geduldet wird keine. */
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    await warte(3000);
    const verborgen = Zeitmesser.stand().sekunden;
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
    /* 2,5 s UND NICHT 1,2 s (E437). Im vollen Lauf war dieser Punkt einmal
       rot mit „2 nach 2": die Uhr stand nach dem Wiedersichtbarwerden
       scheinbar still.
       Nachgerechnet ist das kein Fehler der Uhr, sondern zu wenig Luft in
       der Messung. `stand().sekunden` ist `Math.round(restSek())` — eine
       gerundete Zahl. Ein sichtbarer Sprung von N auf N+1 braucht im
       unguenstigsten Fall knapp eine volle Sekunde, und dazu kommt die
       Zeit, bis die Umschaltung auf „visible" wirkt. Beides zusammen passt
       nicht sicher in 1200 ms; unter Last passt es gar nicht.
       DAS IST KEINE VERSTECKTE WARTEZEIT wie die, die E436 abgelehnt hat.
       Dort haette eine Pause einen echten Wettlauf verdeckt. Hier gibt es
       nichts zu verdecken: bleibt die Uhr nach dem Wiedersichtbarwerden
       wirklich stehen, wird der Punkt auch nach 2,5 s rot — nur eben
       richtig rot. */
    await warte(2500);
    const wiederDa = Zeitmesser.stand().sekunden;
    Zeitmesser.panel();
    const feld = document.querySelector('.zm-feld .zm-wo')?.textContent || '';
    Zeitmesser.stopp();
    return { nachEins, nachSchlaf, nachRueck, verborgen, wiederDa, feld };
  } finally { (Date as any).now = echt; }
});
p('Nach gut einer Sekunde steht die Uhr bei 1 s', zeit.nachEins >= 1 && zeit.nachEins <= 2, String(zeit.nachEins));
p('Zwei Stunden Schlaf zählen NICHT mit', zeit.nachSchlaf.sekunden <= 3, String(zeit.nachSchlaf.sekunden));
p('… sie werden aber gesehen (rund 7200 s übersprungen)',
  zeit.nachSchlaf.uebersprungenSek >= 7100 && zeit.nachSchlaf.uebersprungenSek <= 7300, String(zeit.nachSchlaf.uebersprungenSek));
p('Eine rückwärts gestellte Uhr zählt nicht rückwärts', zeit.nachRueck >= zeit.nachSchlaf.sekunden, `${zeit.nachRueck} nach ${zeit.nachSchlaf.sekunden}`);
p('Eine verborgene Registerkarte zählt nicht — drei Sekunden lang keine einzige',
  zeit.verborgen === zeit.nachRueck, `${zeit.verborgen} nach ${zeit.nachRueck}`);
/* DIE MELDUNG NENNT DIE WARTEZEIT (E437), und das ist kein Beiwerk.
   Die Gegenprobe zu diesem Punkt — die Uhr kuenstlich anhalten — liefert
   WORTGLEICH denselben Bericht wie der Fund im vollen Lauf: „2 nach 2".
   Zwei verschiedene Ursachen, ein Satz. Beim naechsten roten Lauf kostet
   das wieder eine Untersuchung, nur um zu erfahren, wie lange gewartet
   wurde. Steht die Zahl dabei, ist die Frage in einer Zeile beantwortet:
   nach 2500 ms ist ein Stillstand ein Stillstand. */
p('… und danach läuft sie weiter', zeit.wiederDa >= zeit.verborgen + 1,
  `${zeit.wiederDa} nach ${zeit.verborgen} — gemessen nach 2500 ms Wartezeit`);
p('Das Feld sagt, wie viel Schlaf nicht gezählt wurde', /Schlaf nicht gezählt/.test(zeit.feld), zeit.feld);

/* ── 4 ────────────────────────────────────────────────────────────────── */
console.log('\n4 · Die Uhr überlebt das Neuladen (L81 Punkt 4)');
const vorLaden = await pg.evaluate(async () => {
  Zeitmesser.start('timer', 25 * 60);
  await new Promise(f => setTimeout(f, 6500));
  return { stand: Zeitmesser.stand(), gemerkt: Store.getMeta('zeit:laufend') };
});
p('Der laufende Stand liegt in `zeit:laufend`',
  !!vorLaden.gemerkt && vorLaden.gemerkt.art === 'timer' && Number(vorLaden.gemerkt.vergangenSek) >= 4,
  JSON.stringify(vorLaden.gemerkt));
await pg.reload();
await pg.waitForTimeout(2800);
await aufraeumen();
const nachLaden = await pg.evaluate(async () => {
  const gleich = Zeitmesser.stand();
  await new Promise(f => setTimeout(f, 1500));
  return { gleich, spaeter: Zeitmesser.stand() };
});
p('Nach dem Neuladen läuft der Timer weiter', nachLaden.gleich.laeuft && nachLaden.gleich.art === 'timer', JSON.stringify(nachLaden.gleich));
p('… mit der Restzeit von vorher (die Ladezeit zählt nicht)',
  Math.abs(nachLaden.gleich.sekunden - vorLaden.stand.sekunden) <= 2,
  `${nachLaden.gleich.sekunden} nach ${vorLaden.stand.sekunden}`);
p('… und zählt weiter', nachLaden.spaeter.sekunden < nachLaden.gleich.sekunden, `${nachLaden.spaeter.sekunden} nach ${nachLaden.gleich.sekunden}`);
const nachStopp = await pg.evaluate(async () => {
  Zeitmesser.stopp();
  const gemerkt = Store.getMeta('zeit:laufend');
  return { gemerkt, sitzungen: (Store.getMeta('zeit:sitzungen', []) || []).length };
});
gleich('Beenden vergisst den laufenden Stand', nachStopp.gemerkt, null);
p('… und merkt die Sitzung', nachStopp.sitzungen >= 1, String(nachStopp.sitzungen));
await pg.reload();
await pg.waitForTimeout(2500);
const nachZweitem = await pg.evaluate(() => Zeitmesser.stand().laeuft);
gleich('Nach dem nächsten Neuladen läuft nichts mehr', nachZweitem, false);

/* ── 5 ────────────────────────────────────────────────────────────────── */
console.log('\n5 · Keine Seitenfehler');
gleich('Keine Seitenfehler', fehler, []);

await ktx.close(); await browser.close(); server.close();
console.log(`\n${ok}/${ok + weg} bestanden`);
process.exit(weg ? 1 : 0);
