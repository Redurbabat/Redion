/* Suite 318 — Was zuerst auffrischen (L106 Punkt 2, E325)
 * ============================================================================
 * Die Haltbarkeit wird seit E289 gerechnet und in jedem Themensatz genannt —
 * „davon dürfte heute noch 62 % sitzen". Damit liess sich nichts anfangen:
 * keine Reihenfolge, keine Liste, kein Weg von der Zahl zur Handlung. L106
 * sagt es selbst: „Genau das wäre der Nutzen."
 *
 *   §1 DIE REIHENFOLGE ist nicht „am wenigsten haltbar", sondern „am
 *      meisten verloren" — Menge mal Zerfall.
 *   §2 FÄLLIGES WIEGT ZUSÄTZLICH: es lässt sich sofort auffrischen.
 *   §3 NUR THEMEN MIT GENUG BELEGEN — eine Haltbarkeit aus zwei Antworten
 *      wäre eine Zahl ohne Grundlage.
 *   §4 GEGENPROBE: wer nichts vergessen hat, bekommt keine Liste.
 *   §5 IN DER OBERFLÄCHE steht der Abschnitt nur, wenn es ihn braucht.
 *
 * DER PRÜFSTEIN IST §1 UND §4. Ein Thema mit drei Karten, von denen nichts
 * mehr sitzt, ist weniger dringend als eins mit vierzig, von denen die
 * Hälfte weg ist — man verliert dort mehr. Und eine Überschrift „Zuerst
 * auffrischen", die immer dasteht, ist beim Lernen eine Ermahnung ohne
 * Anlass.
 *
 *   node pruefungen/lauf/test318.mts
 * ==========================================================================*/
declare const Store: any; declare const Kompetenz: any;
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9329;

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
await pc.waitForTimeout(2200);

const messen = await pc.evaluate(() => {
  const K = Kompetenz;
  const t = (thema: string, karten: number, haltbar: number,
             faellig = 0, genug = true) =>
    ({ thema, karten, haltbarkeit: haltbar, faellig, genug });

  /* §1 · Wenig Karten ganz weg gegen viele Karten halb weg. */
  const menge = K.auffrischen([
    t('Klein', 3, 0.0),      /* Verlust 3 */
    t('Gross', 40, 0.5)      /* Verlust 20 */
  ]);

  /* §2 · Gleicher Verlust, aber eines hat Fälliges. */
  const faellig = K.auffrischen([
    t('Ohne', 10, 0.5),          /* Verlust 5, nichts fällig  → 5   */
    t('Mit', 10, 0.5, 4)         /* Verlust 5, vier fällig    → 7   */
  ]);

  /* §2b · Und die Falle, die das Bild fand: viele fällige Karten, die
     noch sitzen, dürfen NICHT vor wirklich Verblasstes rutschen. */
  const nochFrisch = K.auffrischen([
    t('Fast frisch', 14, 0.98, 14),  /* Zerfall 0,02 → 0,28 + 0,28 = 0,56 */
    t('Verblasst', 9, 0.81, 9)       /* Zerfall 0,19 → 1,71 + 1,71 = 3,42 */
  ]);

  /* §3 · Zu wenig Belege. */
  const wenig = K.auffrischen([
    t('Belegt', 10, 0.6),
    t('Unbelegt', 30, 0.1, 0, false)
  ]);

  /* §4 · Nichts vergessen. */
  const heil = K.auffrischen([
    t('Frisch', 20, 1.0),
    t('Fast frisch', 10, 0.99)   /* Verlust 0,1 — unter der Schwelle */
  ]);

  /* Und die Grenze: eine ganze Karte muss verblasst sein. */
  const knapp  = K.auffrischen([t('Knapp', 10, 0.90)]);   /* Verlust 1,0 → drin */
  const drunter = K.auffrischen([t('Drunter', 10, 0.95)]); /* Verlust 0,5 → raus */

  return {
    menge: menge.map((e: any) => e.thema),
    mengeVerlust: menge.map((e: any) => Math.round(e.verlust)),
    faellig: faellig.map((e: any) => e.thema),
    nochFrisch: nochFrisch.map((e: any) => e.thema),
    wenig: wenig.map((e: any) => e.thema),
    heil: heil.length,
    knapp: knapp.map((e: any) => e.thema),
    drunter: drunter.length,
    satzFaellig: K.auffrischSatz(t('X', 10, 0.5, 4)),
    satzOhne: K.auffrischSatz(t('X', 10, 0.5, 0)),
    /* Höchstens so viele, wie verlangt. */
    gekappt: K.auffrischen(
      Array.from({ length: 9 }, (_, i) => t('T' + i, 20, 0.3)), { hoechstens: 4 }).length
  };
});

/* ------------------------------------------------------------------------ */
console.log('\n1 · Die Reihenfolge misst den VERLUST, nicht den Prozentwert');

/* EIN THEMA MIT DREI KARTEN, VON DENEN NICHTS MEHR SITZT, ist weniger
   dringend als eins mit vierzig, von denen die Hälfte weg ist. Nach
   Prozent sortiert stünde „Klein" mit 0 % ganz oben — und man frischte
   drei Karten auf statt zwanzig. */
gleich('Viele halb vergessen schlägt wenige ganz vergessen',
  messen.menge, ['Gross', 'Klein']);
gleich('Und der Verlust ist gerechnet, nicht geschätzt',
  messen.mengeVerlust, [20, 3]);

/* ------------------------------------------------------------------------ */
console.log('\n2 · Fälliges wiegt zusätzlich');

/* Bei gleichem Verlust kommt zuerst, was sich SOFORT auffrischen lässt —
   der Rest wartet ohnehin auf seinen Termin. */
gleich('Bei gleichem Verlust kommt Fälliges zuerst',
  messen.faellig, ['Mit', 'Ohne']);
p('Der Satz nennt die fälligen Karten',
  /4 Karten sind fällig/.test(messen.satzFaellig), messen.satzFaellig);
p('Und ohne Fälliges sagt er, was verblasst ist',
  /Nichts fällig, aber rechnerisch 5 Karten verblasst/.test(messen.satzOhne),
  messen.satzOhne);

/* DIE FALLE, DIE DAS BILD FAND (E325). Der erste Entwurf addierte `faellig`
   roh — dann stand „Deutsch, 98 % sitzt noch" mit vierzehn fälligen Karten
   VOR „Mathematik, 81 %". Vierzehn Karten aufzufrischen, die noch sitzen,
   ist beinahe verschenkte Zeit, und die Überschrift versprach etwas
   anderes. Fällig zählt jetzt mit seinem ZERFALL, nicht mit seiner Zahl. */
gleich('Viele fällige Karten, die noch sitzen, rutschen nicht nach vorn',
  messen.nochFrisch, ['Verblasst']);

/* ------------------------------------------------------------------------ */
console.log('\n3 · Nur Themen mit genug Belegen');

/* EINE HALTBARKEIT AUS ZWEI ANTWORTEN ist eine Zahl ohne Grundlage —
   genau davor warnt E289, und sie hier oben einzureihen wäre der
   Rückfall. */
gleich('Ein Thema ohne genug Belege steht nicht in der Liste',
  messen.wenig, ['Belegt']);

/* ------------------------------------------------------------------------ */
console.log('\n4 · GEGENPROBE: wer nichts vergessen hat, bekommt keine Liste');

gleich('Nichts Verblasstes, nichts zu tun', messen.heil, 0);
gleich('Eine ganze verblasste Karte reicht', messen.knapp, ['Knapp']);
gleich('Eine halbe reicht nicht — das wäre Rauschen', messen.drunter, 0);
gleich('Und mehr als verlangt kommt nie', messen.gekappt, 4);

/* ------------------------------------------------------------------------ */
console.log('\n5 · In der Oberfläche steht der Abschnitt nur, wenn er gebraucht wird');

const ohne = await pc.evaluate(async () => {
  Store.setMeta('rundgangGesehen', true);
  document.querySelectorAll('.overlay').forEach(o => o.remove());
  /* Frischer Bestand: keine Karte hat je einen Verlauf, also ist auch
     nichts verblasst. `Learning.open()` ist der Weg — der erste Anlauf rief
     `Lernwelt.karteikarten()`, das es nicht gibt, und mass danach eine
     leere Seite. Der Punkt darunter („Themenfortschritt steht trotzdem
     da") hat das gefangen: ohne ihn wäre §5 grün gewesen, ohne je ein
     Fenster gesehen zu haben. */
  (window as any).Learning.open();
  await new Promise(r => setTimeout(r, 900));
  const ueber = [...document.querySelectorAll('.overlay h3')]
    .map(h => h.textContent || '');
  return { ueber, hat: ueber.some(t => /Zuerst auffrischen/.test(t)) };
});
p('Ohne verblasste Themen gibt es keine Überschrift „Zuerst auffrischen"',
  ohne.hat === false, JSON.stringify(ohne.ueber));
p('Der Themenfortschritt steht trotzdem da',
  ohne.ueber.some((t: string) => /Themenfortschritt/.test(t)),
  JSON.stringify(ohne.ueber));

/* UND DIE GEGENRICHTUNG. Ohne sie prüfte §5 nur, dass etwas NICHT da ist —
   das wäre auch dann grün, wenn der ganze Abschnitt toter Code wäre. */
const mit = await pc.evaluate(async () => {
  document.querySelectorAll('.overlay').forEach(o => o.remove());
  const seite = Store.addPage(null, { text: 'Verblasst' });
  /* Zwölf Karten mit echtem Verlauf, zuletzt vor 60 Tagen bei 10 Tagen
     Intervall — 0,9^6, also rund 53 % Haltbarkeit. */
  const lange = new Date(Date.now() - 60 * 86400000).toISOString();
  for (let i = 0; i < 12; i++) {
    const k = Store.addBlock(seite.id, 'flashcard',
      { text: 'Frage ' + i + ' :: Antwort ' + i });
    Store.updateBlock(k.id, {
      sr: { ease: 2.5, intervall: 10, wdh: 4, zuletzt: lange,
            faellig: lange },
      reviewVerlauf: Array.from({ length: 5 }, (_, n) => ({
        at: new Date(Date.now() - (70 - n * 2) * 86400000).toISOString(),
        rating: 3
      }))
    });
  }
  await Store.flush();
  (window as any).Learning.open();
  await new Promise(r => setTimeout(r, 900));
  const o = document.querySelector('.overlay') as HTMLElement;
  const ueber = [...o.querySelectorAll('h3')].map(h => h.textContent || '');
  const idx = ueber.findIndex(t => /Zuerst auffrischen/.test(t));
  const text = o.textContent || '';
  return { ueber, idx,
           vorThemen: idx >= 0 && idx < ueber.findIndex(t => /Themenfortschritt/.test(t)),
           nenntProzent: /\d+ %/.test(text),
           nenntVerblasst: /verblasst|fällig/.test(text) };
});
p('Mit verblassten Themen steht der Abschnitt da',
  mit.idx >= 0, JSON.stringify(mit.ueber));
p('Und zwar VOR dem Themenfortschritt — er ist die Handlung, nicht der Bericht',
  mit.vorThemen === true, JSON.stringify(mit.ueber));
p('Er nennt einen Prozentwert', mit.nenntProzent === true);
p('Und sagt, was zu tun ist', mit.nenntVerblasst === true);

p('Keine JS-Fehler', fehler.length === 0, fehler.join(' | '));

console.log(`\n${ok}/${ok + weg} bestanden`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
