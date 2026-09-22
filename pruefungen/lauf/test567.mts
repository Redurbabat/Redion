/* Suite 567 — Der Trainer kennt zwei Kapitel: NIN Kap. 5, 6, 7 (E679)
 * ============================================================================
 * REDUR, 22. September 2026:
 *
 *   „erstelle mir direkt lerne ouiz im redio für kapitel 5,6,7 und bei der
 *    regel der tecnik und alles beschriftet mit nummern , seitem im nincopmak ,
 *    wie im test und noch multilichos fragen screibenu usw alles"
 *
 * WAS DIESER LAUF HÄLT
 *
 *   1  `nin-quiz.js` steht in index.html UND im GRUNDSTOCK, vor dem Trainer (§28).
 *   2  Die Vorlage `nin-kapitel-5-7` ist gemeldet und als Trainer-Kapitel
 *      markiert; der Trainer findet seine Kapitel über `Register.vorlagen`,
 *      nicht über einen Namen im Code.
 *   3  Die Übersicht bietet JEDES noch nicht angelegte Kapitel an — auch
 *      dann, wenn schon eines liegt (vorher: nur „Staatskunde", nur ohne Karten).
 *   4  Das Kapitel wird als Seite mit echten `flashcard`-Blöcken angelegt:
 *      so viele wie der Inhalt Aufgaben hat, jede mit Kapitel, Thema und
 *      Seite in der NIN Compact; die 34 Prüfungsfragen tragen Nummer und
 *      Punkte und stehen in Blattreihenfolge zuoberst.
 *   5  Die Übersicht trennt die Kapitel: je ein Abschnitt mit eigener
 *      Prüfungsrunde — Staatskunde zählt wie in E677 (7 + 13), die NIN 34.
 *      Die Themennamen kommen von der Karte, nicht aus dem Staatskunde-Modul.
 *   6  Die NIN-Prüfungsrunde beginnt mit Frage 1 der Probeprüfung 1 und
 *      zeigt Nummer, Punkte und Seite; eine Ankreuzfrage darin wird wie beim
 *      Lehrer ausgewertet.
 *   7  Kapitel- und Themennamen aus einer Karte gehen durch `esc` (§19).
 *   8  Am Telefon: 44 px auf den Knöpfen, kein Querrollen (§37).
 *
 *   node pruefungen/lauf/test567.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');

const TYP: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon'
};
const server = http.createServer((a, b) => {
  const rein = decodeURIComponent((a.url ?? '/').split('?')[0] ?? '/');
  const pfad = path.join(WURZEL, rein === '/' ? 'index.html' : rein.slice(1));
  if (!pfad.startsWith(WURZEL) || !fs.existsSync(pfad) || fs.statSync(pfad).isDirectory()) {
    b.writeHead(404); b.end(); return;
  }
  b.writeHead(200, { 'Content-Type': TYP[path.extname(pfad)] ?? 'application/octet-stream' });
  b.end(fs.readFileSync(pfad));
});
await new Promise<void>(f => { server.listen(0, '127.0.0.1', () => f()); });
const PORT = (server.address() as { port: number }).port;

let ok = 0, weg = 0;
const p = (n: string, wahr: unknown, extra = ''): void => {
  if (wahr) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};

console.log('\n' + '─'.repeat(60));
console.log('Suite 567 — Der Trainer kennt zwei Kapitel: NIN Kap. 5, 6, 7 (E679)');
console.log('─'.repeat(60));

/* ---------------------------------------------------------------------- */
console.log('\n1 · Zwei Einträge für das Skript (§28)');
const indexHtml = fs.readFileSync(path.join(WURZEL, 'index.html'), 'utf8');
const swTs = fs.readFileSync(path.join(WURZEL, 'src/dienst/sw.ts'), 'utf8');
p('nin-quiz.js steht in index.html', indexHtml.includes('quell/bereiche/wissen/nin-quiz.js'));
p('nin-quiz.js steht im GRUNDSTOCK des Dienst-Arbeiters', swTs.includes('./quell/bereiche/wissen/nin-quiz.js'));
p('Der Inhalt wird vor dem Trainer geladen',
  indexHtml.indexOf('quell/bereiche/wissen/nin-quiz.js') > 0 && indexHtml.indexOf('quell/bereiche/wissen/nin-quiz.js') < indexHtml.indexOf('quell/bereiche/wissen/trainer.js'));

/* ---------------------------------------------------------------------- */
const browser = await chromium.launch();
const fehler: string[] = [];
const kontext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const seite = await kontext.newPage();
seite.on('pageerror', e => fehler.push(String(e.message)));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForFunction(
  'typeof App !== "undefined" && typeof Lernwelt !== "undefined" && typeof Learning !== "undefined"',
  null, { timeout: 30000 });
await seite.waitForTimeout(600);
await seite.evaluate(() => {
  try { localStorage.setItem('rundgangGesehen', '1'); } catch { /* egal */ }
  Store.setMeta('rundgangGesehen', true);
  document.getElementById('rg-willkommen')?.remove();
  document.querySelector('.produkt-onboarding-lage')?.remove();
});

console.log('\n2 · Die Vorlage ist gemeldet, der Trainer findet sie selbst');
const reg = await seite.evaluate(async () => {
  const w = { Register, Produktwelten, Trainer: typeof Trainer === 'undefined' ? undefined : Trainer,
    NinQuiz: typeof NinQuiz === 'undefined' ? undefined : NinQuiz } as any;
  w.Produktwelten.lernen('trainer');
  await new Promise(r => setTimeout(r, 700));
  const v = w.Register?.vorlagen?.eines?.('nin-kapitel-5-7');
  const wurzel = document.querySelector<HTMLElement>('.lernwelt');
  return {
    inhalt: typeof w.NinQuiz, aufgaben: w.NinQuiz?.AUFGABEN?.length || 0,
    pruefung: (w.NinQuiz?.AUFGABEN || []).filter((a: any) => a.pruefung === true).length,
    vorlage: !!v, trainerMarke: v?.trainer === true,
    kapitel: w.Trainer?.kapitelVorlagen?.() || [],
    knoepfe: Array.from(wurzel?.querySelectorAll<HTMLElement>('[data-tr-anlegen]') || []).map(k => k.getAttribute('data-tr-anlegen'))
  };
});
console.log('    ' + JSON.stringify(reg));
p('NinQuiz ist geladen und hat mehr als achtzig Aufgaben', reg.inhalt === 'object' && reg.aufgaben > 80, String(reg.aufgaben));
p('34 davon sind Prüfungsfragen (zwei Probeprüfungen à 17)', reg.pruefung === 34, String(reg.pruefung));
p('Register.vorlagen kennt „nin-kapitel-5-7" als Trainer-Kapitel', reg.vorlage && reg.trainerMarke);
p('Trainer.kapitelVorlagen() nennt beide Kapitel, keines angelegt',
  reg.kapitel.length === 2 && reg.kapitel.every((k: any) => k.angelegt === false), JSON.stringify(reg.kapitel));
p('Ohne Karten: die Übersicht bietet BEIDE Kapitel zum Anlegen an',
  JSON.stringify(reg.knoepfe) === '["staatskunde-kapitel","nin-kapitel-5-7"]', JSON.stringify(reg.knoepfe));

/* ---------------------------------------------------------------------- */
console.log('\n3 · Erst Staatskunde, dann die NIN — das zweite Kapitel bleibt anlegbar');
const angelegt = await seite.evaluate(async () => {
  const w = { Store, Learning, Trainer, NinQuiz } as any;
  const wurzel = () => document.querySelector<HTMLElement>('.lernwelt')!;
  const pause = (ms: number) => new Promise(r => setTimeout(r, ms));
  wurzel().querySelector<HTMLElement>('[data-tr-anlegen="staatskunde-kapitel"]')?.click();
  await pause(700);
  const nachStaatskunde = Array.from(wurzel().querySelectorAll<HTMLElement>('[data-tr-anlegen]')).map(k => k.getAttribute('data-tr-anlegen'));
  const vorher = w.Learning.cards().filter((k: any) => k.quiz && k.quiz.kind).length;
  wurzel().querySelector<HTMLElement>('[data-tr-anlegen="nin-kapitel-5-7"]')?.click();
  await pause(900);
  const nachher = w.Learning.cards().filter((k: any) => k.quiz && k.quiz.kind);
  const nin = nachher.filter((k: any) => k.quiz.kapitel === w.NinQuiz.KAPITEL);
  const inhalt = w.NinQuiz.AUFGABEN as any[];
  const seiten = Object.values(w.Store.cache.blocks).filter((b: any) => b.type === 'page' && b.alive !== false && b.vorlage === 'nin-kapitel-5-7');
  const arten = (a: any[]) => ['mc', 'schreiben', 'luecke'].map(x => a.filter(y => (y.quiz?.kind || y.art) === x).length);
  /* In Seitenreihenfolge, wie der Trainer liest. */
  const pruefung = w.Trainer.karten().filter((k: any) => k.quiz.kapitel === w.NinQuiz.KAPITEL && k.quiz.pruefung === true);
  const soll = inhalt.filter(a => a.pruefung === true);
  /* Die Lücke steht als {{Lösung}} im Text — dort zählt der ganze Text, sonst die Frage vor „::". */
  const gleich = (k: any, a: any): boolean => k.quiz.nummer === a.nummer && (a.art === 'luecke'
    ? String(k.text) === a.frage.replace('___', '{{' + a.loesung[0] + '}}')
    : w.Learning.splitCard(k)[0] === a.frage);
  const wortgleich = pruefung.length === soll.length && pruefung.every((k: any, i: number) => gleich(k, soll[i]));
  const abweichung = pruefung.map((k: any, i: number) => gleich(k, soll[i]) ? null : soll[i].id).filter(Boolean);
  return {
    nachStaatskunde, vorher, nachher: nachher.length, nin: nin.length, soll: inhalt.length, seiten: seiten.length,
    typen: Array.from(new Set(nin.map((k: any) => k.type))), arten: arten(nin), artenSoll: arten(inhalt),
    pruefung: pruefung.length, wortgleich, abweichung, erste: pruefung[0]?.quiz?.nummer, letzte: pruefung[pruefung.length - 1]?.quiz?.nummer,
    quelle: nin.every((k: any) => /S\. \d+|NEV|Blatt/.test(String(k.quiz.quelle || ''))),
    topic: nin.every((k: any) => typeof k.quiz.topic === 'string' && /Blatt \d/.test(k.quiz.topic)),
    schreibenOhneMarke: nin.filter((k: any) => k.quiz.kind === 'schreiben' && typeof k.quiz.pruefung !== 'boolean').length,
    anlegenWeg: !wurzel().querySelector('[data-tr-anlegen]')
  };
});
console.log('    ' + JSON.stringify({ nachStaatskunde: angelegt.nachStaatskunde, karten: [angelegt.vorher, angelegt.nachher, angelegt.nin, angelegt.soll], arten: angelegt.arten, erste: angelegt.erste, letzte: angelegt.letzte }));
p('Nach dem Anlegen von Staatskunde wird die NIN weiterhin angeboten', JSON.stringify(angelegt.nachStaatskunde) === '["nin-kapitel-5-7"]', JSON.stringify(angelegt.nachStaatskunde));
p('Eine Seite aus der Vorlage „nin-kapitel-5-7" liegt im Bestand', angelegt.seiten === 1, String(angelegt.seiten));
p('Learning.cards() zählt so viele NIN-Karten, wie der Inhalt Aufgaben hat', angelegt.nin === angelegt.soll && angelegt.nachher === angelegt.vorher + angelegt.soll, angelegt.nin + ' statt ' + angelegt.soll);
p('Es sind echte flashcard-Blöcke', JSON.stringify(angelegt.typen) === '["flashcard"]', JSON.stringify(angelegt.typen));
p('Multiple Choice, Schreiben und Lücke — je so viele wie im Inhalt', JSON.stringify(angelegt.arten) === JSON.stringify(angelegt.artenSoll), JSON.stringify(angelegt.arten) + ' soll ' + JSON.stringify(angelegt.artenSoll));
p('Die 34 Prüfungsfragen stehen zuoberst, in Reihenfolge, mit ihrer Nummer', angelegt.pruefung === 34 && angelegt.wortgleich, angelegt.pruefung + ' · wortgleich=' + angelegt.wortgleich + ' · ' + JSON.stringify(angelegt.abweichung));
p('Die erste heisst „Probeprüfung 1 · 1 · 1,5 Pt.", die letzte „Probeprüfung 2 · Nr. 260923 · 17 · 1,5 Pt."',
  angelegt.erste === 'Probeprüfung 1 · 1 · 1,5 Pt.' && angelegt.letzte === 'Probeprüfung 2 · Nr. 260923 · 17 · 1,5 Pt.', angelegt.erste + ' / ' + angelegt.letzte);
p('Jede NIN-Karte nennt die Seite in der NIN Compact (oder NEV / Blatt) und ihr Blatt', angelegt.quelle && angelegt.topic);
p('Jede Schreibaufgabe sagt, ob sie Prüfungsfrage ist', angelegt.schreibenOhneMarke === 0, String(angelegt.schreibenOhneMarke));
p('Beide Kapitel liegen — die Übersicht bietet kein Anlegen mehr an', angelegt.anlegenWeg);

/* ---------------------------------------------------------------------- */
console.log('\n4 · Die Übersicht trennt die Kapitel');
const uebersicht = await seite.evaluate(() => {
  const w = { Trainer, NinQuiz } as any;
  const wurzel = document.querySelector<HTMLElement>('.lernwelt')!;
  const kap = Array.from(wurzel.querySelectorAll<HTMLElement>('.lw-trainer-kapitel')).map(s => ({
    name: s.getAttribute('data-tr-kapitel'),
    pruefung: s.querySelector<HTMLElement>('[data-tr-start="pruefung"]')?.textContent || '',
    lernen: s.querySelector<HTMLElement>('[data-tr-start="kapitel"]')?.textContent || '',
    themen: Array.from(s.querySelectorAll<HTMLElement>('[data-tr-start="thema"]')).map(k => k.textContent || '')
  }));
  return { kap, pruefungAlle: w.Trainer.aufgabenVon('pruefung').length,
    pruefungNin: w.Trainer.aufgabenVon('pruefung:' + w.NinQuiz.KAPITEL).length,
    pruefungStaat: w.Trainer.aufgabenVon('pruefung:Staatskunde — Leben in der Schweiz').length,
    kapitelNin: w.Trainer.aufgabenVon('kapitel:' + w.NinQuiz.KAPITEL).length };
});
console.log('    ' + JSON.stringify(uebersicht.kap.map((k: any) => [k.name, k.pruefung, k.themen.length])));
const kap0 = uebersicht.kap[0] ?? { name: '', pruefung: '', lernen: '', themen: [] as string[] };
const kap1 = uebersicht.kap[1] ?? { name: '', pruefung: '', lernen: '', themen: [] as string[] };
p('Zwei Kapitel-Abschnitte, Staatskunde zuerst', uebersicht.kap.length === 2 && kap0.name === 'Staatskunde — Leben in der Schweiz' && String(kap1.name).startsWith('Regeln der Technik'), JSON.stringify(uebersicht.kap.map((k: any) => k.name)));
p('Die Staatskunde-Prüfung zählt wie in E677: 7 + 13 = 20', uebersicht.pruefungStaat === 20 && /20 Fragen/.test(kap0.pruefung), uebersicht.pruefungStaat + ' · ' + kap0.pruefung);
p('Die NIN-Prüfung zählt 34 Fragen — nicht die Schreibaufgaben der Themen', uebersicht.pruefungNin === 34 && /34 Fragen/.test(kap1.pruefung), uebersicht.pruefungNin + ' · ' + kap1.pruefung);
p('„Prüfung üben" über alles = 20 + 34', uebersicht.pruefungAlle === 54, String(uebersicht.pruefungAlle));
p('„Lernen" je Kapitel nimmt nur dessen Karten', uebersicht.kapitelNin === (await seite.evaluate(() => (NinQuiz as any).AUFGABEN.length)) && /Aufgaben/.test(kap1.lernen), String(uebersicht.kapitelNin));
p('Die NIN-Themen heissen nach ihrem Blatt — der Name kommt von der Karte', kap1.themen.length === 8 && kap1.themen.every((t: string) => /Blatt \d\.\d/.test(t)), JSON.stringify(kap1.themen));

/* ---------------------------------------------------------------------- */
console.log('\n5 · Die NIN-Prüfung: Frage 1 zuerst, Nummer und Seite dabei, Ankreuzen wie beim Lehrer');
const runde = await seite.evaluate(async () => {
  const w = { Store, Learning, Trainer, NinQuiz } as any;
  const wurzel = () => document.querySelector<HTMLElement>('.lernwelt')!;
  const pause = (ms: number) => new Promise(r => setTimeout(r, ms));
  const kap = wurzel().querySelector<HTMLElement>(`.lw-trainer-kapitel[data-tr-kapitel="${w.NinQuiz.KAPITEL}"]`);
  kap?.querySelector<HTMLElement>('[data-tr-start="pruefung"]')?.click();
  await pause(300);
  const r1 = wurzel().querySelector<HTMLElement>('.lw-trainer-runde');
  const k1 = w.Store.getBlock(r1?.dataset['trId'] || '');
  const kopf = r1?.querySelector('.lw-trainer-kopf h2')?.textContent || '';
  const marken = Array.from(r1?.querySelectorAll<HTMLElement>('.lw-trainer-marken > *') || []).map(m => m.textContent || '');
  const nummerImTitel = r1?.querySelector('.lw-trainer-frage .lw-trainer-nummer')?.textContent || '';
  const meta = Object.keys(w.Store.cache.meta).filter(k => /^lernen:.*:runde$/.test(k));
  const name = meta.length ? w.Store.getMeta(meta[0])?.name : '';
  /* Bis zur ersten Ankreuzfrage durchgehen (Schreiben: aufdecken + Gut; Lücke: erste Lösung tippen). */
  let mcInfo: any = null;
  for (let i = 0; i < 8 && !mcInfo; i++) {
    const r = wurzel().querySelector<HTMLElement>('.lw-trainer-runde');
    const k = w.Store.getBlock(r?.dataset['trId'] || '');
    const kind = r?.dataset['trKind'];
    if (kind === 'mc') {
      const optionen = Array.from(r!.querySelectorAll<HTMLElement>('.lw-trainer-option')).map(o => o.textContent?.trim() || '');
      const richtig = (k.quiz.optionen as any[]).map((o, j) => o.richtig ? j : -1).filter(j => j >= 0);
      richtig.forEach(j => r!.querySelector<HTMLInputElement>(`input[data-tr-option="${j}"]`)?.click());
      wurzel().querySelector<HTMLElement>('[data-tr-pruefen]')?.click();
      await pause(150);
      mcInfo = { nummer: k.quiz.nummer, optionen: optionen.length, richtig: richtig.length,
        urteil: wurzel().querySelector('.lw-trainer-ergebnis')?.textContent || '',
        worte: Array.from(wurzel().querySelectorAll<HTMLElement>('.lw-trainer-option-wort')).map(o => o.textContent),
        markeNummer: Array.from(wurzel().querySelectorAll<HTMLElement>('.lw-trainer-marken .lw-trainer-nummer')).map(m => m.textContent) };
    } else if (kind === 'schreiben') {
      wurzel().querySelector<HTMLElement>('[data-tr-aufdecken]')?.click(); await pause(100);
      wurzel().querySelector<HTMLElement>('[data-tr-rate="3"]')?.click(); await pause(150);
    } else {
      const feld = wurzel().querySelector<HTMLInputElement>('[data-tr-luecke]');
      if (feld) feld.value = String(k.quiz.loesungen[0]);
      wurzel().querySelector<HTMLElement>('[data-tr-pruefen]')?.click(); await pause(100);
      wurzel().querySelector<HTMLElement>('[data-tr-weiter]')?.click(); await pause(150);
    }
  }
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  await pause(200);
  return { frage1: w.Learning.splitCard(k1)[0], nummer1: k1?.quiz?.nummer, kopf, marken, nummerImTitel, name, mcInfo,
    zurueck: !!wurzel().querySelector('.lw-trainer-start') };
});
console.log('    ' + JSON.stringify({ frage1: runde.frage1.slice(0, 60), kopf: runde.kopf, marken: runde.marken, name: runde.name, mc: runde.mcInfo }));
p('Die erste Karte ist Frage 1 der Probeprüfung 1', runde.frage1.startsWith('Jede Anlage muss in mehrere Stromkreise aufgeteilt werden') && runde.nummer1 === 'Probeprüfung 1 · 1 · 1,5 Pt.', runde.frage1);
p('Die Runde zählt 34 Karten und heisst nach dem Kapitel', runde.kopf === 'Karte 1 von 34' && String(runde.name).startsWith('pruefung:Regeln der Technik'), runde.kopf + ' · ' + runde.name);
p('Nummer und Punkte stehen an der Frage, die Seite in der NIN Compact daneben',
  runde.nummerImTitel === 'Probeprüfung 1 · 1 · 1,5 Pt.' && runde.marken.some((m: string) => m === 'NIN Compact S. 100'), runde.nummerImTitel + ' · ' + JSON.stringify(runde.marken));
p('Die Ankreuzfrage 5 trägt ihre Nummer als Marke und wird richtig ausgewertet',
  runde.mcInfo && runde.mcInfo.nummer === 'Probeprüfung 1 · 5 · 1,5 Pt.' && runde.mcInfo.optionen === 4 && /^Richtig\./.test(runde.mcInfo.urteil) &&
  JSON.stringify(runde.mcInfo.markeNummer) === '["Probeprüfung 1 · 5 · 1,5 Pt."]', JSON.stringify(runde.mcInfo));
p('Escape führt zur Übersicht zurück', runde.zurueck);

/* ---------------------------------------------------------------------- */
console.log('\n6 · Kapitel- und Themennamen aus einer Karte gehen durch esc (§19)');
const escapen = await seite.evaluate(async () => {
  const w = { Store, Trainer } as any;
  const pause = (ms: number) => new Promise(r => setTimeout(r, ms));
  const seite = w.Store.addPage(null, { text: 'Fremde Karte', icon: '🧪' });
  w.Store.addBlock(seite.id, 'flashcard', { text: 'Frage :: Antwort', quiz: { kind: 'mc', kapitel: '<img src=x onerror="window.__tr=1">', thema: 't', topic: '<b>Thema</b>',
    quelle: '<i>S. 1</i>', optionen: [{ text: 'a', richtig: true }, { text: 'b', richtig: false }] } });
  const platz = document.querySelector<HTMLElement>('#lw-trainer')!;
  w.Trainer.render(platz, { aktor: 'ich' });
  await pause(200);
  const kap = platz.querySelector<HTMLElement>('.lw-trainer-kapitel[data-tr-kapitel^="<img"]');
  return { da: !!kap, img: !!platz.querySelector('img'), lief: (window as any).__tr === 1,
    h3: kap?.querySelector('h3')?.textContent || '', themaKnopf: kap?.querySelector('[data-tr-start="thema"]')?.textContent || '',
    b: !!kap?.querySelector('[data-tr-start="thema"] b') };
});
console.log('    ' + JSON.stringify(escapen));
p('Das fremde Kapitel erscheint als Text, nicht als Bild — nichts lief', escapen.da && !escapen.img && !escapen.lief && escapen.h3.includes('<img'));
p('Der Themenname aus der Karte wird escaped', escapen.themaKnopf.includes('<b>Thema</b>') && !escapen.b);

/* ---------------------------------------------------------------------- */
console.log('\n7 · Am Telefon (§37)');
await seite.setViewportSize({ width: 390, height: 844 });
const handy = await seite.evaluate(async () => {
  const w = { Produktwelten } as any;
  w.Produktwelten.lernen('trainer');
  await new Promise(r => setTimeout(r, 700));
  const wurzel = document.querySelector<HTMLElement>('.lernwelt')!;
  const knoepfe = Array.from(wurzel.querySelectorAll<HTMLElement>('.lw-trainer-reihe button')).map(b => Math.round(b.getBoundingClientRect().height));
  return { knoepfe: knoepfe.length, klein: knoepfe.filter(h => h < 44), breit: document.scrollingElement!.scrollWidth, fenster: innerWidth };
});
console.log('    ' + JSON.stringify(handy));
p('Alle Knöpfe der Übersicht messen mindestens 44 px', handy.knoepfe > 10 && handy.klein.length === 0, JSON.stringify(handy.klein));
p('Kein Querrollen', handy.breit <= handy.fenster, handy.breit + ' > ' + handy.fenster);
p('Keine Seitenfehler', fehler.length === 0, fehler.join(' | '));

await browser.close();
server.close();
console.log('\n' + '─'.repeat(60));
console.log(`Suite 567: ${ok} ✓  ${weg} ✗`);
console.log('─'.repeat(60));
process.exit(weg ? 1 : 0);
