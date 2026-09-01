/* Suite 313 — Das KI-Buch zählt, statt zu schätzen (L104, E319)
 * ============================================================================
 * Jeder Anbieter schickt am Ende, wie viele Token es wirklich waren. Der
 * Strom-Leser suchte in jedem Ereignis nach `delta.content` und warf alles
 * andere weg — auch die Abrechnung.
 *
 * Verbucht wurde deshalb die SCHÄTZUNG, und die greift mit 3,6 Zeichen je
 * Token bewusst zu hoch. Für eine Bremse ist das die harmlose Richtung; für
 * die Frage „was habe ich diesen Monat wirklich ausgegeben" ist es die
 * falsche.
 *
 *   §1 ZWEI DIALEKTE werden gelesen — OpenAI-artig und Anthropic.
 *   §2 ZUSAMMENLEGEN: Anthropic schickt Ein und Aus in zwei Ereignissen.
 *   §3 BERICHTIGEN ersetzt die Schätzung, es addiert nicht.
 *   §4 GEGENPROBE: gewöhnliche Ereignisse liefern NICHTS, und `eigen`
 *      bekommt kein `stream_options`.
 *   §5 DIE PREISLISTE ALTERT — und schweigt, solange sie frisch ist.
 *   §6 IM QUELLTEXT: die Abrechnung wird im `finally` berichtigt.
 *
 * DER PRÜFSTEIN IST §4. Ein Leser, der bei jedem Textstück eine Abrechnung
 * zu sehen glaubt, macht aus einer Antwort mit 300 Ereignissen 300
 * Berichtigungen — und die letzte gewinnt.
 *
 *   node pruefungen/lauf/test313.mts
 * ==========================================================================*/
declare const Store: any; declare const KiBuch: any;
declare const KiKosten: any; declare const KiAbrechnung: any;
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9324;

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
const pc = await browser.newPage({ viewport: { width: 1280, height: 860 } });
pc.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 140)));
await pc.goto(`http://localhost:${PORT}/index.html`);
await pc.waitForTimeout(2500);

const messen = await pc.evaluate(async () => {
  Store.setMeta('rundgangGesehen', true);
  document.querySelectorAll('.overlay').forEach(o => o.remove());

  /* --- §1/§2 die zwei Dialekte, echte Ereignisse wie sie über die Leitung
     kommen ---------------------------------------------------------------- */
  const offenSchluss = { choices: [], usage:
    { prompt_tokens: 1234, completion_tokens: 567, total_tokens: 1801 } };
  const offenText = { choices: [{ delta: { content: 'Hallo' }, index: 0 }] };

  const anthStart = { type: 'message_start', message:
    { usage: { input_tokens: 4000, output_tokens: 1 } } };
  const anthText  = { type: 'content_block_delta', delta: { text: 'Hallo' } };
  const anthEnde  = { type: 'message_delta', usage: { output_tokens: 890 } };

  const A = KiAbrechnung;

  /* Anthropic zusammengelegt, so wie der Leser es tut. */
  let zus: any = null;
  for (const e of [anthStart, anthText, anthEnde]) {
    zus = A.zusammen(zus, A.ausEreignis(e, true));
  }

  /* §4 die Gegenprobe: gewöhnliche Textstücke liefern nichts. */
  const stille = [
    A.ausEreignis(offenText, false),
    A.ausEreignis(anthText, true),
    A.ausEreignis({ choices: [{ delta: { content: 'x' } }], usage: null }, false),
    A.ausEreignis({}, false),
    A.ausEreignis(null, false),
    A.ausEreignis('nein', false)
  ];

  /* --- §3 berichtigen ---------------------------------------------------- */
  Store.setMeta(KiBuch.SCHL_BUCH, []);
  const modell = 'gpt-4o-mini';
  const gebucht = KiBuch.buchen(modell, 'openai', 10000, 5000, false);
  const standNachSchaetzung = KiBuch.stand();
  const berichtigt = KiBuch.berichtigen(gebucht.id, 1000, 500);
  const standNachBerichtigung = KiBuch.stand();
  const buchNachher = KiBuch.buchungen();

  /* Und was NICHT berichtigt werden darf. */
  const ohneId    = KiBuch.berichtigen(undefined, 1, 1);
  const falscheId = KiBuch.berichtigen('gibtsnicht', 1, 1);
  const keineZahl = KiBuch.berichtigen(gebucht.id, 'viel', 1);
  const negativ   = KiBuch.berichtigen(gebucht.id, -5, 1);
  const buchDanach = KiBuch.buchungen();

  /* --- §5 die alternde Preisliste ---------------------------------------- */
  const standMs = Date.parse(KiKosten.STAND + 'T00:00:00Z');
  const tag = 86400000;

  return {
    offen: A.ausEreignis(offenSchluss, false),
    anth: zus,
    stille,
    willAbrechnung: ['groq', 'openrouter', 'gemini', 'openai', 'anthropic', 'eigen']
      .map(id => A.willAbrechnung(id)),
    vollstaendig: [A.vollstaendig({ ein: 1, aus: 2 }), A.vollstaendig({ ein: 1 }),
                   A.vollstaendig({ aus: 2 }), A.vollstaendig(null)],
    abweichung: [A.abweichung(1200, 1000), A.abweichung(900, 1000), A.abweichung(5, 0)],
    satzHoch: A.satz(1220, 1000), satzGleich: A.satz(1050, 1000),

    gebuchtHatId: typeof gebucht.id === 'string' && gebucht.id.length > 6,
    gebuchtGezaehlt: gebucht.gezaehlt,
    berichtigtGezaehlt: berichtigt && berichtigt.gezaehlt,
    berichtigtToken: berichtigt && [berichtigt.tokenEin, berichtigt.tokenAus],
    buchLaenge: buchNachher.length,
    betragVorher: gebucht.betrag, betragNachher: berichtigt && berichtigt.betrag,
    laufVorher: standNachSchaetzung.lauf, laufNachher: standNachBerichtigung.lauf,
    abgelehnt: [ohneId, falscheId, keineZahl, negativ],
    buchUnveraendert: JSON.stringify(buchDanach) === JSON.stringify(buchNachher),

    listeFrisch: KiKosten.listeAlt(standMs + 10 * tag),
    listeAlt: KiKosten.listeAlt(standMs + 300 * tag),
    satzFrisch: KiKosten.standSatz(standMs + 10 * tag),
    satzAlt: KiKosten.standSatz(standMs + 300 * tag)
  };
});

/* ------------------------------------------------------------------------ */
console.log('\n1 · Beide Dialekte werden gelesen');

gleich('OpenAI-artig: prompt_tokens und completion_tokens',
  messen.offen, { ein: 1234, aus: 567 });

/* ------------------------------------------------------------------------ */
console.log('\n2 · Anthropic schickt es in zwei Ereignissen');

/* `message_start` trägt die Eingabe, `message_delta` die Ausgabe. Wer nur
   das letzte Ereignis liest, bekommt die Eingabe nie. */
gleich('Zusammengelegt ergibt sich beides', messen.anth, { ein: 4000, aus: 890 });

/* ------------------------------------------------------------------------ */
console.log('\n3 · Berichtigen ERSETZT, es addiert nicht');

p('Jede Buchung bekommt eine Kennung', messen.gebuchtHatId);
p('Die Schätzung ist als Schätzung gebucht', messen.gebuchtGezaehlt === false);
p('Nach dem Berichtigen ist sie gezählt', messen.berichtigtGezaehlt === true);
gleich('Und trägt die gezählten Token', messen.berichtigtToken, [1000, 500]);
gleich('Es bleibt EINE Buchung, keine zweite', messen.buchLaenge, 1);
p('Der Betrag ist gefallen — ein Zehntel der Token',
  messen.betragNachher < messen.betragVorher,
  `${messen.betragVorher} → ${messen.betragNachher}`);
p('Und der Laufstand ist mitgefallen, nicht gestiegen',
  messen.laufNachher < messen.laufVorher,
  `${messen.laufVorher} → ${messen.laufNachher}`);

console.log('\n   Was NICHT berichtigt wird');
gleich('Ohne Kennung, mit falscher Kennung, ohne Zahl, mit negativer Zahl',
  messen.abgelehnt, [null, null, null, null]);
p('Und das Buch blieb dabei unverändert', messen.buchUnveraendert);

/* ------------------------------------------------------------------------ */
console.log('\n4 · GEGENPROBE: gewöhnliche Ereignisse liefern nichts');

/* EIN LESER, DER ÜBERALL EINE ABRECHNUNG SIEHT, macht aus einer Antwort mit
   300 Ereignissen 300 Berichtigungen — und die letzte gewinnt. */
gleich('Sechs Ereignisse ohne Abrechnung geben sechsmal null',
  messen.stille, [null, null, null, null, null, null]);
gleich('Vier Anbieter werden gefragt, Anthropic und „eigen" nicht',
  messen.willAbrechnung, [true, true, true, true, false, false]);
gleich('Halb gelesen ist nicht vollständig',
  messen.vollstaendig, [true, false, false, false]);
gleich('Die Abweichung rechnet in Prozent, und ohne Grundlage null',
  messen.abweichung, [20, -10, 0]);
p('Der Satz sagt es bei 22 % …', /22 % zu hoch/.test(messen.satzHoch), messen.satzHoch);
gleich('… und schweigt bei 5 %', messen.satzGleich, '');

/* ------------------------------------------------------------------------ */
console.log('\n5 · Die Preisliste altert — und schweigt, solange sie frisch ist');

p('Zehn Tage nach dem Stand ist sie frisch', messen.listeFrisch === false);
p('Dreihundert Tage später nicht mehr', messen.listeAlt === true);
gleich('Und der Satz kommt erst dann', messen.satzFrisch, '');
p('Er nennt das Datum', /2026-08-31/.test(messen.satzAlt), messen.satzAlt);

/* ------------------------------------------------------------------------ */
console.log('\n6 · Im Quelltext: berichtigt wird auch beim Abbruch');

const dienst = fs.readFileSync(path.join(WURZEL, 'src/bereiche/ki/dienst.ts'), 'utf-8');
const quellJs = fs.readFileSync(path.join(WURZEL, 'quell/bereiche/ki/dienst.js'), 'utf-8');

/* WER MITTEN IN EINER LANGEN ANTWORT ABBRICHT, hat die Eingabetoken trotzdem
   bezahlt — Anthropic schickt sie schon im ersten Ereignis. Eine Berichtigung
   nur im Erfolgsfall liesse gerade den Abbruch zu hoch gebucht stehen. */
p('`berichtigen` steht in einem `finally`',
  /\}\s*finally\s*\{[^}]*KiBuch\.berichtigen/s.test(dienst),
  'nicht im finally gefunden');
p('`stream_options` hängt an `willAbrechnung`, nicht an einem festen true',
  /willAbrechnung\([^)]*\)\s*\?\s*\{\s*stream_options/.test(dienst));
p('Und das alles steht auch im ERZEUGTEN JavaScript — der Browser lädt das',
  /KiBuch\.berichtigen/.test(quellJs) && /include_usage/.test(quellJs));

p('Keine JS-Fehler', fehler.length === 0, fehler.join(' | '));

console.log(`\n${ok}/${ok + weg} bestanden`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
