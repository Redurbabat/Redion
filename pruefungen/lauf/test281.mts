/* Suite 281 — Was ein KI-Aufruf kostet, BEVOR er läuft (E287)
 * ============================================================================
 * Die Lücke war ausgesprochen und nicht vergessen. `agenten.ts:26` sagt:
 *
 *     „Das ist die ehrliche Version eines Kostenlimits — hier zählt es
 *      Schritte statt Geld, weil die lokale KI nichts kostet."
 *
 * Die Annahme stimmte, als sie geschrieben wurde. Heute stehen sechs
 * Anbieter in der Liste, zwei davon ausdrücklich `frei: false`.
 *
 *   §1 DIE SCHÄTZUNG rechnet, und sie behauptet nicht, genau zu sein.
 *   §2 EIN UNBEKANNTES MODELL bekommt KEINE geratene Zahl.
 *   §3 DIE GRENZEN greifen der Reihe nach, und jede nennt sich beim Namen.
 *   §4 DAS BUCH führt Tag, Monat und Lauf getrennt.
 *   §5 DAS KONTINGENT — die Grenze, die kein Geld ist.
 *   §6 LOKALE MODELLE werden nicht gebremst.
 *   §7 DER STAPEL: `embeddingsBauen` schätzt die SUMME, nicht den Einzelfall.
 *
 * ─── KANN ER ROT WERDEN? (§55.2) ────────────────────────────────────────────
 * Alle sieben waren vor E287 rot, weil es nichts davon gab. Die Gegenproben
 * darin sind die eigentliche Arbeit: §2 zeigt, dass ein unbekanntes Modell
 * durchgelassen und trotzdem gemeldet wird (sperren wäre §47 von der
 * anderen Seite); §3 zeigt für jede der vier Grenzen einzeln, dass sie
 * zuschlägt UND dass sie sich abschalten lässt; §6 zeigt, dass dieselbe
 * Anfrage lokal durchgeht und in der Wolke nicht.
 *
 *   node pruefungen/lauf/test281.mts
 * ==========================================================================*/
declare const Store: any; declare const App: any;
declare const KiKosten: any; declare const KiBuch: any;
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9059;

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

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};
const nah = (a: number, b: number, eps = 1e-9): boolean => Math.abs(a - b) < eps;

const browser = await chromium.launch();
const seite = await browser.newPage();
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 140)));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForFunction(
  () => typeof Store !== 'undefined' &&
        typeof (globalThis as any).KiKosten !== 'undefined' &&
        typeof (globalThis as any).KiBuch !== 'undefined', null, { timeout: 30000 });
await seite.waitForTimeout(1200);

/* ------------------------------------------------------------------------ */
console.log('\n1 · Die Schätzung rechnet — und gibt sich nicht als Rechnung aus');

const schaetzung = await seite.evaluate(() => {
  const K = KiKosten;
  /* gpt-4o: 2,50 ein / 10,00 aus je Million.
     100 000 ein + 20 000 aus = 0,25 + 0,20 = 0,45 */
  const s = K.schaetzen('gpt-4o', 100000, 20000);
  /* Ein freies Modell kostet null — und sagt trotzdem etwas über sein
     Kontingent. */
  const frei = K.schaetzen('gemini-2.0-flash', 100000, 20000);
  return {
    betrag: s.betrag, hoechstens: s.hoechstens, bekannt: s.bekannt,
    /* Die obere Grenze muss ÜBER dem wahrscheinlichen Wert liegen —
       sonst ist die Unsicherheit nur behauptet. */
    hoeher: s.hoechstens > s.betrag,
    faktor: s.hoechstens / s.betrag,
    satz: s.satz,
    /* Der Satz muss sagen, dass es eine Schätzung ist. */
    nenntSchaetzung: /geschätzt|Schätzung/.test(s.satz),
    freiBetrag: frei.betrag, freiFlag: frei.frei, freiSatz: frei.satz,
    /* Tokenschätzung: 360 Zeichen bei 3,6 je Token sind 100. */
    token100: K.tokenSchaetzen('x'.repeat(360)),
    tokenLeer: K.tokenSchaetzen(''),
    tokenNichts: K.tokenSchaetzen(null),
    /* Nachrichten: je Nachricht vier Token Gerüst obendrauf. */
    ausNachrichten: K.tokenAusNachrichten([
      { role: 'system', content: 'x'.repeat(36) },
      { role: 'user', content: 'x'.repeat(36) }
    ]),
    /* Und die Preisliste trägt ihr Datum. */
    stand: K.STAND,
    /* Geld lesbar: kleine Beträge nicht als 0.00 verschweigen. */
    geldKlein: K.geld(0.004), geldMittel: K.geld(0.42), geldGross: K.geld(12.5),
    geldNull: K.geld(0)
  };
}) as any;

p('gpt-4o, 100k ein + 20k aus = 0,45 USD (von Hand gerechnet)',
  nah(schaetzung.betrag, 0.45, 1e-9), String(schaetzung.betrag));
p('Die obere Grenze liegt darüber — die Unsicherheit ist echt',
  schaetzung.hoeher === true && nah(schaetzung.faktor, 1.35, 1e-9),
  'Faktor ' + schaetzung.faktor);
p('… und der Satz sagt, dass es eine Schätzung ist',
  schaetzung.nenntSchaetzung === true, schaetzung.satz);
p('Ein freies Modell kostet null und sagt es',
  schaetzung.freiBetrag === 0 && schaetzung.freiFlag === true &&
  /kostet nichts/.test(schaetzung.freiSatz), schaetzung.freiSatz);
p('360 Zeichen sind rund 100 Token', schaetzung.token100 === 100,
  String(schaetzung.token100));
p('Leer und nichts geben null', schaetzung.tokenLeer === 0 && schaetzung.tokenNichts === 0);
p('Zwei Nachrichten: 2×10 Token plus 2×4 Gerüst = 28',
  schaetzung.ausNachrichten === 28, String(schaetzung.ausNachrichten));
p('Die Preisliste trägt ihr Datum', /^\d{4}-\d{2}-\d{2}$/.test(schaetzung.stand),
  schaetzung.stand);
p('Kleine Beträge werden nicht als 0.00 verschwiegen',
  schaetzung.geldKlein === '< 0,01 USD', schaetzung.geldKlein);
p('… und null ist wirklich null', schaetzung.geldNull === '0,00 USD',
  schaetzung.geldNull + ' / ' + schaetzung.geldMittel + ' / ' + schaetzung.geldGross);

/* ------------------------------------------------------------------------ */
console.log('\n2 · Ein unbekanntes Modell bekommt KEINE geratene Zahl');

const unbekannt = await seite.evaluate(() => {
  const K = KiKosten;
  const s = K.schaetzen('irgendein-modell-das-es-2028-geben-wird', 500000, 100000);
  const urteil = K.pruefen(s, { jeAufruf: 0.01, jeLauf: 0, jeTag: 0, jeMonat: 0 },
                           { heute: 0, monat: 0, lauf: 0 });
  return {
    bekannt: s.bekannt, betrag: s.betrag, hoechstens: s.hoechstens,
    satz: s.satz,
    nenntDenNamen: s.satz.includes('irgendein-modell'),
    nenntDasDatum: s.satz.includes(K.STAND),
    /* DURCHGELASSEN, nicht gesperrt: ein neuer Modellname darf nicht
       blockiert sein, bis jemand die Preisliste pflegt. */
    erlaubt: urteil.erlaubt,
    grenze: urteil.grenze
  };
}) as any;
p('Für ein unbekanntes Modell gibt es keine Zahl', unbekannt.bekannt === false &&
  unbekannt.betrag === 0, JSON.stringify(unbekannt));
p('… und der Satz sagt WELCHES Modell und von wann die Liste ist',
  unbekannt.nenntDenNamen === true && unbekannt.nenntDasDatum === true, unbekannt.satz);
p('GEGENPROBE: es wird DURCHGELASSEN, nicht gesperrt — sonst blockierte ' +
  'jeder neue Modellname, bis jemand die Liste pflegt',
  unbekannt.erlaubt === true && unbekannt.grenze === '', JSON.stringify(unbekannt));

/* ------------------------------------------------------------------------ */
console.log('\n3 · Die vier Grenzen — der Reihe nach, jede mit Namen');

const grenzen = await seite.evaluate(() => {
  const K = KiKosten;
  /* Ein Aufruf, der 0,45 kostet (höchstens 0,6075). */
  const s = K.schaetzen('gpt-4o', 100000, 20000);
  const alle = { jeAufruf: 100, jeLauf: 100, jeTag: 100, jeMonat: 100 };
  const leer = { heute: 0, monat: 0, lauf: 0 };
  const mach = (g: any, st: any) => K.pruefen(s, g, st);
  return {
    hoechstens: s.hoechstens,
    frei: mach(alle, leer).erlaubt,
    /* Jede Grenze einzeln, alle anderen weit offen. */
    aufruf: mach({ ...alle, jeAufruf: 0.5 }, leer),
    lauf:   mach({ ...alle, jeLauf: 1 }, { ...leer, lauf: 0.7 }),
    tag:    mach({ ...alle, jeTag: 1 }, { ...leer, heute: 0.7 }),
    monat:  mach({ ...alle, jeMonat: 1 }, { ...leer, monat: 0.7 }),
    /* Reihenfolge: greifen zwei, gewinnt die erste. */
    reihenfolge: mach({ jeAufruf: 0.1, jeLauf: 0.1, jeTag: 0.1, jeMonat: 0.1 }, leer).grenze,
    /* 0 heisst: keine Grenze. Alle aus → alles erlaubt. */
    ausgeschaltet: mach({ jeAufruf: 0, jeLauf: 0, jeTag: 0, jeMonat: 0 },
                        { heute: 9999, monat: 9999, lauf: 9999 }).erlaubt,
    /* Knapp darunter geht durch — die Grenze ist keine Rundung. */
    knappDrunter: mach({ ...alle, jeAufruf: 0.61 }, leer).erlaubt,
    knappDrueber: mach({ ...alle, jeAufruf: 0.60 }, leer).erlaubt
  };
}) as any;
p('Ohne enge Grenzen läuft der Aufruf', grenzen.frei === true);
p('`jeAufruf` schlägt zu und nennt sich', grenzen.aufruf.erlaubt === false &&
  grenzen.aufruf.grenze === 'jeAufruf', JSON.stringify(grenzen.aufruf.grenze));
p('… und der Satz nennt BEIDE Zahlen, nicht nur „nein"',
  /* Komma seit E321: der Satz liest ein Mensch, und Redion spricht mit
     Menschen deutsch (§3). Geprüft wird beides — dass die Zahl dasteht UND
     dass sie deutsch geschrieben ist. */
  /gegen/.test(grenzen.aufruf.satz) && /0,6/.test(grenzen.aufruf.satz) &&
  !/0\.6/.test(grenzen.aufruf.satz),
  grenzen.aufruf.satz);
p('`jeLauf` schlägt zu — der Lauf zählt mit', grenzen.lauf.erlaubt === false &&
  grenzen.lauf.grenze === 'jeLauf');
p('`jeTag` schlägt zu — der Tag zählt mit', grenzen.tag.erlaubt === false &&
  grenzen.tag.grenze === 'jeTag');
p('`jeMonat` schlägt zu — der Monat zählt mit', grenzen.monat.erlaubt === false &&
  grenzen.monat.grenze === 'jeMonat');
p('Greifen mehrere, gewinnt die erste — der Aufruf selbst',
  grenzen.reihenfolge === 'jeAufruf', grenzen.reihenfolge);
p('Geprüft wird mit HÖCHSTENS, nicht mit dem wahrscheinlichen Wert',
  grenzen.knappDrunter === true && grenzen.knappDrueber === false,
  'hoechstens=' + grenzen.hoechstens);
p('GEGENPROBE: alle Grenzen auf 0 heisst wirklich keine Grenze',
  grenzen.ausgeschaltet === true);

/* ------------------------------------------------------------------------ */
console.log('\n4 · Das Buch: Tag, Monat und Lauf getrennt');

const buch = await seite.evaluate(() => {
  const K = KiKosten;
  const heute = '2026-08-31';
  const gestern = '2026-08-30';
  const letzterMonat = '2026-07-15';
  const liste = [
    { tag: heute,         modell: 'gpt-4o', anbieter: 'openai',    betrag: 0.40 },
    { tag: heute,         modell: 'gpt-4o', anbieter: 'openai',    betrag: 0.10 },
    { tag: gestern,       modell: 'gpt-4o', anbieter: 'anthropic', betrag: 1.00 },
    { tag: letzterMonat,  modell: 'gpt-4o', anbieter: 'openai',    betrag: 5.00 }
  ];
  const st = K.standAus(liste, heute, '2026-08', 0.25);
  const jeAnb = K.jeAnbieter(liste, '2026-08');
  const gekuerzt = K.kuerzen(liste, gestern);
  return {
    heute: st.heute, monat: st.monat, lauf: st.lauf,
    openai: jeAnb['openai'], anthropic: jeAnb['anthropic'],
    gekuerzt: gekuerzt.length,
    /* Kaputte Einträge dürfen die Summe nicht vergiften. */
    robust: K.standAus([null, { tag: heute, betrag: NaN }, { betrag: 1 },
                        { tag: heute, betrag: 0.5 }] as any, heute, '2026-08').heute
  };
}) as any;
p('Der Tagesstand zählt nur heute', nah(buch.heute, 0.50), String(buch.heute));
p('Der Monatsstand zählt den ganzen Monat', nah(buch.monat, 1.50), String(buch.monat));
p('Der Laufstand kommt von aussen — er lebt nur im Speicher',
  nah(buch.lauf, 0.25), String(buch.lauf));
p('Je Anbieter wird getrennt gezählt',
  nah(buch.openai, 0.50) && nah(buch.anthropic, 1.00), JSON.stringify(buch));
p('Alte Buchungen lassen sich kürzen', buch.gekuerzt === 3, String(buch.gekuerzt));
p('Kaputte Einträge vergiften die Summe nicht', nah(buch.robust, 0.5),
  String(buch.robust));

const buchEcht = await seite.evaluate(() => {
  KiBuch.leeren();
  const g = KiBuch.grenzenSetzen({ jeAufruf: 1, jeLauf: 2, jeTag: 3, jeMonat: 4 });
  KiBuch.laufBeginnen();
  const vorher = KiBuch.stand();
  KiBuch.buchen('gpt-4o', 'openai', 100000, 20000, false);
  const nachher = KiBuch.stand();
  const lauf = KiBuch.laufAusgabe();
  const jeAnb = KiBuch.monatJeAnbieter();
  /* Eine kaputte Grenze aus `meta` darf keine neue erfinden. */
  Store.setMeta(KiBuch.SCHL_GRENZEN, { jeAufruf: 'viel', erfunden: 99 });
  const nachKaputt = KiBuch.grenzen();
  KiBuch.grenzenSetzen(g);
  return {
    gesetzt: g, vorher: vorher.heute, nachher: nachher.heute, lauf,
    openai: jeAnb['openai'],
    nachKaputtAufruf: nachKaputt.jeAufruf,
    keineErfundene: (nachKaputt as any).erfunden === undefined
  };
}) as any;
p('Die Grenzen lassen sich setzen und lesen', buchEcht.gesetzt.jeTag === 3,
  JSON.stringify(buchEcht.gesetzt));
p('Eine Buchung erhöht den Tagesstand', buchEcht.vorher === 0 &&
  nah(buchEcht.nachher, 0.45), JSON.stringify(buchEcht));
p('… und den Laufstand mit', nah(buchEcht.lauf, 0.45));
p('… und steht unter ihrem Anbieter', nah(buchEcht.openai, 0.45));
p('Ein kaputter Wert in `meta` fällt auf die Vorgabe zurück',
  nah(buchEcht.nachKaputtAufruf, 0.5), String(buchEcht.nachKaputtAufruf));
p('… und ein erfundener Schlüssel wird keine neue Grenze',
  buchEcht.keineErfundene === true);

/* ------------------------------------------------------------------------ */
console.log('\n5 · Das Kontingent — die Grenze, die kein Geld ist');

const kontingent = await seite.evaluate(() => {
  const K = KiKosten;
  const T = 1000000;
  const fenster = 60000;
  let k = { verbraucht: 0, grenze: 10, bis: 0 };
  k = K.kontingentBuchen(k, 4, T, fenster);
  const nach4 = { ...k };
  k = K.kontingentBuchen(k, 5, T + 1000, fenster);
  const nach9 = { ...k };
  const passtNoch = K.kontingentFrei(k, 1, T + 2000);
  const passtNicht = K.kontingentFrei(k, 2, T + 2000);
  const wartet = K.kontingentWartet(k, T + 2000);
  /* Fenster abgelaufen: es beginnt von vorn. */
  const neu = K.kontingentBuchen(k, 3, T + 70000, fenster);
  const danachFrei = K.kontingentFrei(neu, 5, T + 70000);
  /* Ohne Grenze ist alles frei. */
  const ohne = K.kontingentFrei({ verbraucht: 999, grenze: 0, bis: T + 999999 }, 50, T);
  return {
    nach4: nach4.verbraucht, nach9: nach9.verbraucht,
    bisGesetzt: nach4.bis === T + fenster,
    passtNoch, passtNicht, wartet,
    neuVerbraucht: neu.verbraucht, danachFrei, ohne
  };
}) as any;
p('Verbrauch wird aufaddiert', kontingent.nach4 === 4 && kontingent.nach9 === 9,
  JSON.stringify(kontingent));
p('… und das Fenster bekommt sein Ende', kontingent.bisGesetzt === true);
p('Was hineinpasst, passt — was nicht, nicht',
  kontingent.passtNoch === true && kontingent.passtNicht === false);
p('Und es sagt, wie lange man warten muss', kontingent.wartet === 58,
  String(kontingent.wartet) + ' s');
p('Nach Ablauf beginnt das Fenster von vorn',
  kontingent.neuVerbraucht === 3 && kontingent.danachFrei === true,
  JSON.stringify(kontingent));
p('Ohne Grenze ist alles frei', kontingent.ohne === true);

/* ------------------------------------------------------------------------ */
console.log('\n6 · Lokale Modelle werden NICHT gebremst');

const lokal = await seite.evaluate(() => {
  /* Eine sehr grosse Anfrage, mit sehr enger Grenze. */
  const riesig = [{ role: 'user', content: 'x'.repeat(2000000) }];
  KiBuch.grenzenSetzen({ jeAufruf: 0.001, jeLauf: 0.001, jeTag: 0.001, jeMonat: 0.001 });
  const inDerWolke = KiBuch.pruefen('gpt-4o', riesig, { lokal: false });
  const aufDemGeraet = KiBuch.pruefen('llama3', riesig, { lokal: true });
  KiBuch.grenzenSetzen(KiKosten.VORGABE_GRENZEN);
  return {
    wolkeErlaubt: inDerWolke.erlaubt, wolkeGrenze: inDerWolke.grenze,
    lokalErlaubt: aufDemGeraet.erlaubt,
    lokalBetrag: aufDemGeraet.schaetzung.betrag
  };
}) as any;
p('Dieselbe riesige Anfrage wird in der WOLKE gebremst',
  lokal.wolkeErlaubt === false && lokal.wolkeGrenze === 'jeAufruf',
  JSON.stringify(lokal));
p('… und auf dem GERÄT durchgelassen', lokal.lokalErlaubt === true);
p('… und kostet dort auch nichts', lokal.lokalBetrag === 0);

/* ------------------------------------------------------------------------ */
console.log('\n7 · Der Stapel: die SUMME, nicht der Einzelfall');

const stapel = await seite.evaluate(() => {
  /* 2000 Seiten à 3600 Zeichen = 2000 × 1000 Token = 2 Mio Token.
     text-embedding-3-small: 0,02 je Million → 0,04 USD. */
  const texte: string[] = [];
  for (let i = 0; i < 2000; i++) texte.push('x'.repeat(3600));
  const s = KiBuch.stapelSchaetzen('text-embedding-3-small', texte);
  /* Und der EINZELNE Aufruf sähe harmlos aus — genau darum geht es. */
  const einer = KiKosten.schaetzen('text-embedding-3-small',
    KiKosten.tokenSchaetzen(texte[0]), 0);
  return {
    stapelBetrag: s.betrag, stapelToken: s.tokenEin,
    einerBetrag: einer.betrag,
    verhaeltnis: einer.betrag > 0 ? s.betrag / einer.betrag : -1,
    /* Und die Grenze greift auf den Stapel. */
    gebremst: !KiKosten.pruefen(s, { jeAufruf: 0.01, jeLauf: 0, jeTag: 0, jeMonat: 0 },
                                { heute: 0, monat: 0, lauf: 0 }).erlaubt
  };
}) as any;
p('2000 Seiten sind 2 Mio Token', stapel.stapelToken === 2000000,
  String(stapel.stapelToken));
p('… und kosten zusammen 0,04 USD', nah(stapel.stapelBetrag, 0.04, 1e-9),
  String(stapel.stapelBetrag));
p('Der EINZELNE Aufruf sähe harmlos aus — das ist der ganze Punkt',
  stapel.einerBetrag < 0.0001 && stapel.verhaeltnis > 1900,
  'einzeln ' + stapel.einerBetrag + ', zusammen das ' +
  Math.round(stapel.verhaeltnis) + '-fache');
p('Und eine enge Grenze bremst den STAPEL', stapel.gebremst === true);

p('Keine Seitenfehler', fehler.length === 0, fehler.join(' | ').slice(0, 200));

await browser.close();
server.close();
console.log(`\n${ok}/${ok + weg} bestanden`);
process.exitCode = weg ? 1 : 0;
