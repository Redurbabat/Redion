/* Suite 565 — Der Trainer wohnt im Lernzentrum (E677)
 * ============================================================================
 * REDUR, 21. September 2026:
 *
 *   „jetzt will ich eien flüssige lern app im redion bauen nicht die karten
 *    sollte im berichen sein sondern direk eine appp dort … ich will so
 *    boxsen haben die ich weiss sollte selten vor komen und die ich nicht
 *    weiss mehrmals auch schriben und multiplichos"
 *
 * und, mitten im Bogen: „also es sollte direk mit redion verbunden sein die
 * app nicht getrennt".
 *
 * WAS DIESER LAUF HÄLT
 *
 *   1  Der Trainer ist eine ANSICHT der Lernwelt (`trainer`), erreichbar
 *      über die Route `#welt-lernen-trainer` und eine Kachel im Lernzentrum;
 *      beide Skripte stehen in index.html UND im GRUNDSTOCK (§28).
 *   2  Das Kapitel ist eine VORLAGE (`staatskunde-kapitel`): ein Klick legt
 *      eine Seite mit echten `flashcard`-Blöcken an, die `Learning.cards()`
 *      zählt — so viele, wie der Inhalt Aufgaben hat, und die sieben
 *      Prüfungsfragen des Lehrers stehen Wort für Wort in seiner Reihenfolge.
 *   3  Die Boxen sind eine Ableitung aus `sr`: neu → Box 1 bei falsch,
 *      Box 2 nach einmal gewusst. Geschrieben wird über `WissenDienst.planen`,
 *      nirgends sonst — KEIN zweiter Speicher (`localStorage` bleibt leer).
 *   4  Multiple Choice wie in der Prüfung: mehrere richtig, und die Auswertung
 *      sagt je Antwort richtig / falsch / gefehlt.
 *   5  Eine falsch beantwortete Lücke kommt in derselben Runde nach drei
 *      Karten NOCH EINMAL; in der Prüfungsrunde nicht.
 *   6  Die Lücke vergleicht nachsichtig (Gross/klein, ß/ss).
 *   7  Schreiben: Musterlösung, dann die Note per Taste 1–4.
 *   8  Escape beendet, verliert aber nichts: die Runde überlebt ein Neuladen.
 *   9  Nutzertext geht durch `esc` (§19).
 *  10  Am Telefon: 44 px auf den Hauptwegen, kein Querrollen (§37).
 *
 *   node pruefungen/lauf/test565.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');

/* `listen(0)` statt einer festen Zahl (L205). */
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
console.log('Suite 565 — Der Trainer wohnt im Lernzentrum (E677)');
console.log('─'.repeat(60));

/* ---------------------------------------------------------------------- */
console.log('\n1 · Zwei Einträge je Skript (§28)');
const indexHtml = fs.readFileSync(path.join(WURZEL, 'index.html'), 'utf8');
const swTs = fs.readFileSync(path.join(WURZEL, 'src/dienst/sw.ts'), 'utf8');
for (const datei of ['quell/bereiche/wissen/staatskunde-inhalt.js', 'quell/bereiche/wissen/trainer.js']) {
  p(`index.html lädt ${datei}`, indexHtml.includes(`<script src="${datei}" defer></script>`));
  p(`GRUNDSTOCK kennt ${datei}`, swTs.includes(`'./${datei}'`));
  p(`${datei} ist gebaut`, fs.existsSync(path.join(WURZEL, datei)));
}
const lernwelt = indexHtml.indexOf('quell/bereiche/wissen/lernwelt.js');
p('Beide stehen VOR lernwelt.js',
  indexHtml.indexOf('quell/bereiche/wissen/trainer.js') > 0 &&
  indexHtml.indexOf('quell/bereiche/wissen/trainer.js') < lernwelt &&
  indexHtml.indexOf('quell/bereiche/wissen/staatskunde-inhalt.js') < lernwelt);

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

/* ---------------------------------------------------------------------- */
console.log('\n2 · Der Trainer ist eine Ansicht der Lernwelt');

const reg = await seite.evaluate(() => {
  const w = { Store, Learning, Lernwelt, Register, Produktwelten, WissenDienst,
    Trainer: typeof Trainer === 'undefined' ? undefined : Trainer,
    StaatskundeInhalt: typeof StaatskundeInhalt === 'undefined' ? undefined : StaatskundeInhalt } as any;
  return {
    trainer: typeof w.Trainer, inhalt: typeof w.StaatskundeInhalt,
    ansicht: (w.Lernwelt.ansichten || []).some((a: any) => a.id === 'trainer'),
    vorlage: !!(w.Register?.vorlagen?.eines?.('staatskunde-kapitel')),
    aufgaben: w.StaatskundeInhalt?.AUFGABEN?.length || 0
  };
});
console.log('    ' + JSON.stringify(reg));
p('Trainer und StaatskundeInhalt sind geladen', reg.trainer === 'object' && reg.inhalt === 'object', JSON.stringify(reg));
p('Lernwelt.ansichten kennt „trainer"', reg.ansicht === true);
p('Register.vorlagen kennt „staatskunde-kapitel"', reg.vorlage === true);
p('Der Inhalt hat mehr als fünfzig Aufgaben', reg.aufgaben > 50, String(reg.aufgaben));

const route = await seite.evaluate(async () => {
  const w = { Store, Learning, Lernwelt, Register, Produktwelten, WissenDienst,
    Trainer: typeof Trainer === 'undefined' ? undefined : Trainer,
    StaatskundeInhalt: typeof StaatskundeInhalt === 'undefined' ? undefined : StaatskundeInhalt } as any;
  location.hash = '#welt-lernen-trainer';
  const ueberRoute = w.Produktwelten.routeOeffnen ? w.Produktwelten.routeOeffnen() : null;
  await new Promise(r => setTimeout(r, 700));
  const wurzel = document.querySelector<HTMLElement>('.lernwelt');
  return {
    ueberRoute, view: wurzel?.dataset['lwView'] || '',
    start: !!wurzel?.querySelector('.lw-trainer-start'),
    anlegen: !!wurzel?.querySelector('[data-tr-anlegen]'),
    reiter: !!wurzel?.querySelector('.lw-subnav [data-lw-nav="trainer"]')
  };
});
console.log('    ' + JSON.stringify(route));
p('Die Route #welt-lernen-trainer öffnet den Trainer', route.view === 'trainer', JSON.stringify(route));
p('Ohne Kapitel: die Übersicht bietet das Anlegen an', route.start && route.anlegen);
p('Der Trainer hat einen Reiter in der zweiten Reihe', route.reiter);

const kachel = await seite.evaluate(async () => {
  const w = { Store, Learning, Lernwelt, Register, Produktwelten, WissenDienst,
    Trainer: typeof Trainer === 'undefined' ? undefined : Trainer,
    StaatskundeInhalt: typeof StaatskundeInhalt === 'undefined' ? undefined : StaatskundeInhalt } as any;
  w.Produktwelten.lernen('lernen');
  await new Promise(r => setTimeout(r, 700));
  const k = document.querySelector<HTMLElement>('.lernwelt .lw-study-actions [data-lw-nav="trainer"]');
  if (!k) return { da: false };
  k.click();
  await new Promise(r => setTimeout(r, 500));
  return { da: true, view: document.querySelector<HTMLElement>('.lernwelt')?.dataset['lwView'] || '' };
});
p('Das Lernzentrum hat eine Kachel zum Trainer, und sie führt hin', kachel.da && kachel.view === 'trainer', JSON.stringify(kachel));

/* ---------------------------------------------------------------------- */
console.log('\n3 · Das Kapitel ist eine Vorlage — echte Lernkarten');

const angelegt = await seite.evaluate(async () => {
  const w = { Store, Learning, Lernwelt, Register, Produktwelten, WissenDienst,
    Trainer: typeof Trainer === 'undefined' ? undefined : Trainer,
    StaatskundeInhalt: typeof StaatskundeInhalt === 'undefined' ? undefined : StaatskundeInhalt } as any;
  const vorher = w.Learning.cards().length;
  document.querySelector<HTMLElement>('.lernwelt [data-tr-anlegen]')?.click();
  await new Promise(r => setTimeout(r, 700));
  const karten = w.Learning.cards().filter((k: any) => k.quiz && k.quiz.kind);
  const inhalt = w.StaatskundeInhalt.AUFGABEN;
  const seiten = Object.values(w.Store.cache.blocks).filter((b: any) => b.type === 'page' && b.alive !== false && b.vorlage === 'staatskunde-kapitel');
  /* In der Reihenfolge des Trainers — der liest die Seite, nicht `created`. */
  const pruefung = w.Trainer.karten().filter((k: any) => k.quiz.kind === 'mc' && k.quiz.pruefung === true);
  const lehrer = inhalt.filter((a: any) => a.art === 'mc' && a.pruefung === true);
  const wortgleich = pruefung.length === lehrer.length && pruefung.every((k: any, i: number) =>
    w.Learning.splitCard(k)[0] === lehrer[i].frage &&
    JSON.stringify(k.quiz.optionen.map((o: any) => o.text)) === JSON.stringify(lehrer[i].antworten) &&
    JSON.stringify(k.quiz.optionen.map((o: any, j: number) => o.richtig ? j : -1).filter((j: number) => j >= 0)) === JSON.stringify(lehrer[i].richtig));
  const luecke = karten.find((k: any) => k.quiz.kind === 'luecke');
  const arten = (a: any[]) => ['mc', 'schreiben', 'luecke'].map(x => a.filter(y => (y.quiz?.kind || y.art) === x).length);
  const wurzel = document.querySelector<HTMLElement>('.lernwelt');
  return {
    vorher, nachher: karten.length, soll: inhalt.length, seiten: seiten.length,
    arten: arten(karten), artenSoll: arten(inhalt), typen: Array.from(new Set(karten.map((k: any) => k.type))),
    pruefung: pruefung.length, wortgleich,
    lueckeText: String(luecke?.text || ''), lueckeGeteilt: luecke ? w.Learning.splitCard(luecke) : null,
    /* Seit E679 bleibt das Anlegen für ANDERE Kapitel stehen — nur Staatskunde ist weg. */
    anlegenWeg: !wurzel?.querySelector('[data-tr-anlegen="staatskunde-kapitel"]'),
    neuBox: Number(wurzel?.querySelector('.lw-trainer-box[data-box="neu"] .lw-trainer-box-zahl')?.textContent),
    quelle: karten.every((k: any) => typeof k.quiz.quelle === 'string' && k.quiz.quelle.length > 0),
    thema: karten.every((k: any) => typeof k.quiz.thema === 'string' && k.quiz.thema.length > 0)
  };
});
console.log('    Karten: ' + angelegt.vorher + ' → ' + angelegt.nachher + ' (Inhalt: ' + angelegt.soll + ') · Arten ' + JSON.stringify(angelegt.arten) + ' soll ' + JSON.stringify(angelegt.artenSoll));
console.log('    Lücke: ' + angelegt.lueckeText.slice(0, 90) + ' → ' + JSON.stringify(angelegt.lueckeGeteilt));
p('Eine Seite aus der Vorlage „staatskunde-kapitel" liegt im Bestand', angelegt.seiten === 1, String(angelegt.seiten));
p('Learning.cards() zählt so viele Karten, wie der Inhalt Aufgaben hat', angelegt.nachher === angelegt.soll && angelegt.soll > 0, angelegt.nachher + ' statt ' + angelegt.soll);
p('Es sind echte flashcard-Blöcke', JSON.stringify(angelegt.typen) === '["flashcard"]', JSON.stringify(angelegt.typen));
p('Multiple Choice, Schreiben und Lücke — je so viele wie im Inhalt', JSON.stringify(angelegt.arten) === JSON.stringify(angelegt.artenSoll));
p('Die sieben Prüfungsfragen stehen Wort für Wort, in der Reihenfolge des Lehrers', angelegt.pruefung === 7 && angelegt.wortgleich, angelegt.pruefung + ' Prüfungsfragen, wortgleich=' + angelegt.wortgleich);
p('Eine Lücke ist als {{Lücke}} gespeichert — auch die klassische Lernrunde versteht sie',
  /\{\{[^}]+\}\}/.test(angelegt.lueckeText) && Array.isArray(angelegt.lueckeGeteilt) && String(angelegt.lueckeGeteilt[1]).length > 0 && !/noch keine Antwort/.test(String(angelegt.lueckeGeteilt[1])));
p('Jede Karte nennt Thema und Seite', angelegt.quelle && angelegt.thema);
p('Danach bietet die Übersicht das Anlegen von Staatskunde nicht mehr an', angelegt.anlegenWeg);
p('Alle Karten liegen in „Neu"', angelegt.neuBox === angelegt.soll, String(angelegt.neuBox));

/* ---------------------------------------------------------------------- */
console.log('\n4 · Prüfung üben: Multiple Choice wie beim Lehrer');

const mc = await seite.evaluate(async () => {
  const w = { Store, Learning, Lernwelt, Register, Produktwelten, WissenDienst,
    Trainer: typeof Trainer === 'undefined' ? undefined : Trainer,
    StaatskundeInhalt: typeof StaatskundeInhalt === 'undefined' ? undefined : StaatskundeInhalt } as any;
  const wurzel = () => document.querySelector<HTMLElement>('.lernwelt')!;
  const pause = (ms: number) => new Promise(r => setTimeout(r, ms));
  wurzel().querySelector<HTMLElement>('[data-tr-start="pruefung"]')?.click();
  await pause(300);
  const runde = wurzel().querySelector<HTMLElement>('.lw-trainer-runde');
  const id1 = runde?.dataset['trId'] || '';
  const k1 = w.Store.getBlock(id1);
  const optionen = Array.from(runde?.querySelectorAll<HTMLElement>('.lw-trainer-option') || []).map(o => o.textContent?.trim() || '');
  const kopf = runde?.querySelector('.lw-trainer-kopf h2')?.textContent || '';
  const soll = (w.StaatskundeInhalt.AUFGABEN as any[]).filter(a => (a.art === 'mc' && a.pruefung) || a.art === 'schreiben').length;
  /* Frage 1: ALLE vier sind richtig. Nur die erste ankreuzen → drei fehlen. */
  runde?.querySelector<HTMLInputElement>('input[data-tr-option="0"]')?.click();
  wurzel().querySelector<HTMLElement>('[data-tr-pruefen]')?.click();
  await pause(150);
  const klassen = Array.from(wurzel().querySelectorAll<HTMLElement>('.lw-trainer-option')).map(o =>
    o.classList.contains('is-richtig') ? 'richtig' : o.classList.contains('is-falsch') ? 'falsch' : o.classList.contains('is-fehlt') ? 'fehlt' : '-');
  const worte = Array.from(wurzel().querySelectorAll<HTMLElement>('.lw-trainer-option-wort')).map(o => o.textContent);
  const ergebnis1 = wurzel().querySelector('.lw-trainer-ergebnis')?.textContent || '';
  const gesperrt = Array.from(wurzel().querySelectorAll<HTMLInputElement>('input[data-tr-option]')).every(i => i.disabled);
  wurzel().querySelector<HTMLElement>('[data-tr-weiter]')?.click();
  await pause(200);
  const nach1 = w.Store.getBlock(id1);
  /* Frage 2: nur a) ist richtig. */
  const runde2 = wurzel().querySelector<HTMLElement>('.lw-trainer-runde');
  const id2 = runde2?.dataset['trId'] || '';
  runde2?.querySelector<HTMLInputElement>('input[data-tr-option="0"]')?.click();
  wurzel().querySelector<HTMLElement>('[data-tr-pruefen]')?.click();
  await pause(150);
  const ergebnis2 = wurzel().querySelector('.lw-trainer-ergebnis')?.textContent || '';
  wurzel().querySelector<HTMLElement>('[data-tr-weiter]')?.click();
  await pause(200);
  const nach2 = w.Store.getBlock(id2);
  const kopf3 = wurzel().querySelector('.lw-trainer-kopf h2')?.textContent || '';
  const meta = Object.keys(w.Store.cache.meta).filter(k => /^lernen:.*:runde$/.test(k));
  const gemerkt = meta.length ? w.Store.getMeta(meta[0]) : null;
  return {
    id1, frage1: w.Learning.splitCard(k1)[0], optionen, kopf, soll, klassen, worte, ergebnis1, gesperrt,
    box1: w.Trainer.boxVon(nach1), wdh1: nach1?.sr?.wdh, verlauf1: Object.keys(nach1?.reviewVerlauf || {}).length,
    ergebnis2, box2: w.Trainer.boxVon(nach2), wdh2: nach2?.sr?.wdh, kopf3,
    meta: meta.length, laenge: gemerkt?.reihenfolge?.length, index: gemerkt?.index, name: gemerkt?.name,
    lokal: (() => { try { return localStorage.getItem('staatskunde-trainer'); } catch { return null; } })()
  };
});
console.log('    ' + JSON.stringify({ frage1: mc.frage1, kopf: mc.kopf, klassen: mc.klassen, box1: mc.box1, box2: mc.box2, kopf3: mc.kopf3, runde: [mc.name, mc.index, mc.laenge] }));
p('Die erste Karte ist Frage 1 des Lehrers', mc.frage1 === 'Was grenzt die Demokratie von der Diktatur ab?', mc.frage1);
p('Vier Antworten, mit a) bis d)', mc.optionen.length === 4 && mc.optionen.every((o: string, i: number) => o.startsWith('abcd'[i] + ')')), JSON.stringify(mc.optionen));
p('Die Prüfungsrunde zählt die sieben Fragen und die dreizehn Verstanden-Fragen', mc.kopf === 'Karte 1 von ' + mc.soll, mc.kopf + ' · soll ' + mc.soll);
p('Nur a) angekreuzt → a) richtig, b) c) d) gefehlt', JSON.stringify(mc.klassen) === '["richtig","fehlt","fehlt","fehlt"]', JSON.stringify(mc.klassen));
p('Das Urteil steht als Wort an jeder Antwort, nicht nur als Farbe (§38)', JSON.stringify(mc.worte) === '["richtig","fehlt","fehlt","fehlt"]', JSON.stringify(mc.worte));
p('Und die Auswertung sagt „Nicht ganz"', /Nicht ganz/.test(mc.ergebnis1), mc.ergebnis1);
p('Nach dem Prüfen sind die Kästchen gesperrt', mc.gesperrt);
p('Falsch → Box 1, sr.wdh 0, ein Eintrag im Verlauf', mc.box1 === 1 && mc.wdh1 === 0 && mc.verlauf1 === 1, JSON.stringify([mc.box1, mc.wdh1, mc.verlauf1]));
p('Frage 2 richtig → „Richtig." und Box 2 (sr.wdh 1)', /^Richtig/.test(mc.ergebnis2.trim()) && mc.box2 === 2 && mc.wdh2 === 1, JSON.stringify([mc.ergebnis2, mc.box2, mc.wdh2]));
p('Die dritte Karte ist dran', mc.kopf3 === 'Karte 3 von ' + mc.soll, mc.kopf3);
p('In der Prüfungsrunde kommt eine falsche Karte NICHT noch einmal', mc.laenge === mc.soll && mc.index === 2, JSON.stringify([mc.laenge, mc.index]));
p('Die Runde liegt im Meta-Fach, nicht in localStorage', mc.meta === 1 && mc.lokal === null, JSON.stringify([mc.meta, mc.lokal]));

/* ---------------------------------------------------------------------- */
console.log('\n5 · Beenden verliert nichts — und ein Neuladen auch nicht');

const weiter = await seite.evaluate(async () => {
  const wurzel = () => document.querySelector<HTMLElement>('.lernwelt')!;
  wurzel().querySelector<HTMLElement>('[data-tr-ende]')?.click();
  await new Promise(r => setTimeout(r, 200));
  const text = wurzel().querySelector('.lw-trainer-start')?.textContent || '';
  wurzel().querySelector<HTMLElement>('[data-tr-start="pruefung"]')?.click();
  await new Promise(r => setTimeout(r, 200));
  return { angefangen: /Karte 3 von/.test(text), kopf: wurzel().querySelector('.lw-trainer-kopf h2')?.textContent || '' };
});
p('„Beenden" führt zur Übersicht, die die angefangene Runde nennt', weiter.angefangen);
p('Dieselbe Runde geht bei Karte 3 weiter', /^Karte 3 von/.test(weiter.kopf), weiter.kopf);

await seite.reload();
await seite.waitForFunction('typeof App !== "undefined" && typeof Lernwelt !== "undefined" && typeof Trainer !== "undefined"', null, { timeout: 30000 });
await seite.waitForTimeout(700);
const nachLaden = await seite.evaluate(async () => {
  const w = { Store, Learning, Lernwelt, Register, Produktwelten, WissenDienst,
    Trainer: typeof Trainer === 'undefined' ? undefined : Trainer,
    StaatskundeInhalt: typeof StaatskundeInhalt === 'undefined' ? undefined : StaatskundeInhalt } as any;
  document.getElementById('rg-willkommen')?.remove();
  document.querySelector('.produkt-onboarding-lage')?.remove();
  w.Produktwelten.lernen('trainer');
  await new Promise(r => setTimeout(r, 700));
  const wurzel = () => document.querySelector<HTMLElement>('.lernwelt')!;
  const text = wurzel().querySelector('.lw-trainer-start')?.textContent || '';
  wurzel().querySelector<HTMLElement>('[data-tr-start="pruefung"]')?.click();
  await new Promise(r => setTimeout(r, 200));
  const kopf = wurzel().querySelector('.lw-trainer-kopf h2')?.textContent || '';
  await seiteSchliessen();
  return { angefangen: /Karte 3 von/.test(text), kopf };
  async function seiteSchliessen() { wurzel().querySelector<HTMLElement>('[data-tr-ende]')?.click(); await new Promise(r => setTimeout(r, 150)); }
});
p('Nach dem Neuladen ist die Runde noch da', nachLaden.angefangen && /^Karte 3 von/.test(nachLaden.kopf), JSON.stringify(nachLaden));

/* ---------------------------------------------------------------------- */
console.log('\n6 · Die Lücke: nachsichtig, und falsch kommt noch einmal');

const luecke = await seite.evaluate(async () => {
  const w = { Store, Learning, Lernwelt, Register, Produktwelten, WissenDienst,
    Trainer: typeof Trainer === 'undefined' ? undefined : Trainer,
    StaatskundeInhalt: typeof StaatskundeInhalt === 'undefined' ? undefined : StaatskundeInhalt } as any;
  const wurzel = () => document.querySelector<HTMLElement>('.lernwelt')!;
  const pause = (ms: number) => new Promise(r => setTimeout(r, ms));
  wurzel().querySelector<HTMLElement>('[data-tr-start="art"][data-art="luecke"]')?.click();
  await pause(300);
  const runde = wurzel().querySelector<HTMLElement>('.lw-trainer-runde');
  const id = runde?.dataset['trId'] || '';
  const kind = runde?.dataset['trKind'] || '';
  const feld = runde?.querySelector<HTMLInputElement>('[data-tr-luecke]');
  const imText = !!feld && !!feld.closest('.lw-trainer-frage');
  void runde;
  /* Falsch tippen. */
  if (feld) { feld.value = 'Bananenrepublik'; feld.dispatchEvent(new Event('input', { bubbles: true })); }
  wurzel().querySelector<HTMLElement>('[data-tr-pruefen]')?.click();
  await pause(150);
  const falschKlasse = !!wurzel().querySelector('[data-tr-luecke].is-falsch');
  const ergebnis = wurzel().querySelector('.lw-trainer-ergebnis')?.textContent || '';
  wurzel().querySelector<HTMLElement>('[data-tr-weiter]')?.click();
  await pause(200);
  const meta = Object.keys(w.Store.cache.meta).filter(k => /^lernen:.*:runde$/.test(k));
  const gemerkt = w.Store.getMeta(meta[0]);
  const reihe: string[] = gemerkt.reihenfolge;
  const nochmalBei = reihe.indexOf(id, 1);
  /* Die zweite Karte richtig — aber klein geschrieben und mit ss statt ß. */
  const runde2 = wurzel().querySelector<HTMLElement>('.lw-trainer-runde');
  const id2 = runde2?.dataset['trId'] || '';
  const k2 = w.Store.getBlock(id2);
  const loesung = String(k2.quiz.loesungen[0]);
  const feld2 = runde2?.querySelector<HTMLInputElement>('[data-tr-luecke]');
  if (feld2) { feld2.value = '  ' + loesung.toLowerCase().replace(/ß/g, 'ss') + ' '; }
  wurzel().querySelector<HTMLElement>('[data-tr-pruefen]')?.click();
  await pause(150);
  const ergebnis2 = wurzel().querySelector('.lw-trainer-ergebnis')?.textContent || '';
  const richtigKlasse = !!wurzel().querySelector('[data-tr-luecke].is-richtig');
  wurzel().querySelector<HTMLElement>('[data-tr-weiter]')?.click();
  await pause(200);
  const nach2 = w.Store.getBlock(id2);
  return { kind, imText, falschKlasse, ergebnis, vorkommen: reihe.filter(x => x === id).length, nochmalBei, index: gemerkt.index,
           loesung, ergebnis2, richtigKlasse, box2: w.Trainer.boxVon(nach2) };
});
console.log('    ' + JSON.stringify(luecke));
p('Die Lückenkarte zeigt ein Eingabefeld IM Satz', luecke.kind === 'luecke' && luecke.imText);
p('Falsch getippt → rot, und die Lösung steht da', luecke.falschKlasse && /Nicht richtig/.test(luecke.ergebnis) && /Lösung:/.test(luecke.ergebnis), luecke.ergebnis);
p('Die falsche Karte steht ein zweites Mal in der Runde — drei Karten später', luecke.vorkommen === 2 && luecke.nochmalBei === luecke.index + 3, JSON.stringify([luecke.vorkommen, luecke.nochmalBei, luecke.index]));
p('Klein geschrieben, ss statt ß, Leerraum drumherum → richtig', /^Richtig/.test(luecke.ergebnis2.trim()) && luecke.richtigKlasse && luecke.box2 === 2, JSON.stringify([luecke.loesung, luecke.ergebnis2, luecke.box2]));

/* ---------------------------------------------------------------------- */
console.log('\n7 · Schreiben: Musterlösung, dann die Note per Taste');

await seite.evaluate(async () => {
  const wurzel = () => document.querySelector<HTMLElement>('.lernwelt')!;
  wurzel().querySelector<HTMLElement>('[data-tr-ende]')?.click();
  await new Promise(r => setTimeout(r, 150));
  wurzel().querySelector<HTMLElement>('[data-tr-start="art"][data-art="schreiben"]')?.click();
  await new Promise(r => setTimeout(r, 300));
});
const schreibenVorher = await seite.evaluate(() => {
  const runde = document.querySelector<HTMLElement>('.lernwelt .lw-trainer-runde');
  return { kind: runde?.dataset['trKind'], id: runde?.dataset['trId'], textarea: !!runde?.querySelector('textarea[data-tr-antwort]'),
           nummer: runde?.querySelector('.lw-trainer-nummer')?.textContent || '', loesungVorher: !!runde?.querySelector('.lw-trainer-loesung') };
});
await seite.keyboard.type('Ein Staat, in dem das Volk entscheidet.');
await seite.keyboard.press('Enter');   /* IM Textfeld: Enter macht eine neue Zeile, deckt nicht auf */
const nachEnter = await seite.evaluate(() => ({
  loesung: !!document.querySelector('.lernwelt .lw-trainer-loesung'),
  zeilen: (document.querySelector<HTMLTextAreaElement>('.lernwelt textarea[data-tr-antwort]')?.value || '').split('\n').length
}));
await seite.click('.lernwelt [data-tr-aufdecken]');
await seite.waitForTimeout(150);
const aufgedeckt = await seite.evaluate(() => {
  const w = { Store, Learning, Lernwelt, Register, Produktwelten, WissenDienst,
    Trainer: typeof Trainer === 'undefined' ? undefined : Trainer,
    StaatskundeInhalt: typeof StaatskundeInhalt === 'undefined' ? undefined : StaatskundeInhalt } as any;
  const runde = document.querySelector<HTMLElement>('.lernwelt .lw-trainer-runde');
  if (!runde) return { loesung: '', enthaelt: false, noten: [] as string[], antwortBleibt: false };
  const k = w.Store.getBlock(runde.dataset['trId']);
  const loesung = runde.querySelector('.lw-trainer-loesung')?.textContent || '';
  return { loesung: loesung.slice(0, 120), enthaelt: loesung.includes(String(k.quiz.musterloesung[0])),
           noten: Array.from(runde.querySelectorAll('[data-tr-rate]')).map(b => b.getAttribute('data-tr-rate')),
           antwortBleibt: (runde.querySelector<HTMLTextAreaElement>('textarea[data-tr-antwort]')?.value || '').includes('Volk') };
});
await seite.keyboard.press('3');
await seite.waitForTimeout(200);
const bewertet = await seite.evaluate(() => {
  const runde = document.querySelector<HTMLElement>('.lernwelt .lw-trainer-runde');
  return { weiterId: runde?.dataset['trId'] };
});
const noteStand = await seite.evaluate((id: string) => {
  const w = { Store, Learning, Lernwelt, Register, Produktwelten, WissenDienst,
    Trainer: typeof Trainer === 'undefined' ? undefined : Trainer,
    StaatskundeInhalt: typeof StaatskundeInhalt === 'undefined' ? undefined : StaatskundeInhalt } as any;
  const k = w.Store.getBlock(id);
  const eintraege = Object.values<any>(k?.reviewVerlauf || {});
  return { wdh: k?.sr?.wdh, box: w.Trainer.boxVon(k), note: eintraege.length ? eintraege[eintraege.length - 1].rating : null };
}, String(schreibenVorher.id));
console.log('    ' + JSON.stringify({ ...schreibenVorher, nachEnter, aufgedeckt: aufgedeckt.enthaelt, noten: aufgedeckt.noten, noteStand }));
p('Die Schreibkarte hat ein Textfeld und die Nummer der Verstanden-Frage', schreibenVorher.kind === 'schreiben' && schreibenVorher.textarea && /^6\.\d+$/.test(schreibenVorher.nummer), JSON.stringify(schreibenVorher));
p('Enter im Textfeld ist eine neue Zeile — es deckt nichts auf', nachEnter.loesung === false && nachEnter.zeilen === 2, JSON.stringify(nachEnter));
p('„Musterlösung zeigen" zeigt die Lösung aus dem Lösungsheft', aufgedeckt.enthaelt, aufgedeckt.loesung);
p('Die eigene Antwort bleibt daneben stehen', aufgedeckt.antwortBleibt);
p('Vier Noten, 1 bis 4', JSON.stringify(aufgedeckt.noten) === '["1","2","3","4"]', JSON.stringify(aufgedeckt.noten));
p('Taste 3 bewertet: Note 3 im Verlauf, Box 2, und die nächste Karte ist dran', noteStand.wdh === 1 && noteStand.box === 2 && noteStand.note === 3 && bewertet.weiterId !== schreibenVorher.id, JSON.stringify([noteStand, bewertet.weiterId]));

/* ---------------------------------------------------------------------- */
console.log('\n8 · Escape beendet die Runde, und sie bleibt gemerkt');
await seite.keyboard.press('Escape');
await seite.waitForTimeout(200);
const escape = await seite.evaluate(() => {
  const w = { Store, Learning, Lernwelt, Register, Produktwelten, WissenDienst,
    Trainer: typeof Trainer === 'undefined' ? undefined : Trainer,
    StaatskundeInhalt: typeof StaatskundeInhalt === 'undefined' ? undefined : StaatskundeInhalt } as any;
  const meta = Object.keys(w.Store.cache.meta).filter(k => /^lernen:.*:runde$/.test(k));
  return { uebersicht: !!document.querySelector('.lernwelt .lw-trainer-start'), gemerkt: !!(meta[0] && w.Store.getMeta(meta[0])),
           lernweltNochDa: !!document.querySelector('.lernwelt') };
});
p('Escape → Übersicht, Runde gemerkt, Lernwelt noch offen', escape.uebersicht && escape.gemerkt && escape.lernweltNochDa, JSON.stringify(escape));

/* ---------------------------------------------------------------------- */
console.log('\n9 · Nutzertext geht durch esc (§19)');
const escTest = await seite.evaluate(async () => {
  const w = { Store, Learning, Lernwelt, Register, Produktwelten, WissenDienst,
    Trainer: typeof Trainer === 'undefined' ? undefined : Trainer,
    StaatskundeInhalt: typeof StaatskundeInhalt === 'undefined' ? undefined : StaatskundeInhalt } as any;
  const s = Object.values(w.Store.cache.blocks).find((b: any) => b.type === 'page' && b.vorlage === 'staatskunde-kapitel') as any;
  const k = w.Store.addBlock(s.id, 'flashcard', { text: '<img src=x onerror="window.__xss=1"> Wer? :: x',
    quiz: { kind: 'mc', thema: 'regierung', quelle: '<b>S. 0</b>', optionen: [{ text: '<i>a</i>', richtig: true }, { text: 'b', richtig: false }] } });
  w.Trainer.render(document.querySelector<HTMLElement>('.lernwelt .lw-main') || document.querySelector<HTMLElement>('.lernwelt')!, { aktor: 'probe' });
  await new Promise(r => setTimeout(r, 150));
  document.querySelector<HTMLElement>('.lernwelt [data-tr-start="thema"][data-thema="regierung"]')?.click();
  await new Promise(r => setTimeout(r, 200));
  /* Die Probe-Karte irgendwo in der Runde finden — die Runde ist gemischt. */
  const meta = w.Store.getMeta('lernen:probe:runde');
  const drin = !!meta && meta.reihenfolge.includes(k.id);
  let html = '';
  for (let i = 0; i < 40 && !html; i++) {
    const runde = document.querySelector<HTMLElement>('.lernwelt .lw-trainer-runde');
    if (runde?.dataset['trId'] === k.id) { html = runde?.innerHTML || ""; break; }
    document.querySelector<HTMLElement>('.lernwelt [data-tr-pruefen], .lernwelt [data-tr-aufdecken]')?.click();
    await new Promise(r => setTimeout(r, 60));
    document.querySelector<HTMLElement>('.lernwelt [data-tr-weiter], .lernwelt [data-tr-rate="3"]')?.click();
    await new Promise(r => setTimeout(r, 60));
  }
  w.Store.updateBlock(k.id, { alive: false });
  w.Store.setMeta('lernen:probe:runde', null);
  return { drin, gefunden: !!html, img: /<img/i.test(html), b: /<b>S\. 0<\/b>/.test(html), i: /<i>a<\/i>/.test(html), escaped: /&lt;img/.test(html), xss: w.__xss };
});
console.log('    ' + JSON.stringify(escTest));
p('Eine Karte mit HTML im Text wird als Text gezeigt — kein img, kein b, kein i', escTest.gefunden && !escTest.img && !escTest.b && !escTest.i && escTest.escaped && escTest.xss === undefined, JSON.stringify(escTest));

/* ---------------------------------------------------------------------- */
console.log('\n10 · Am Telefon (§37)');
await kontext.close();
const handy = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const tel = await handy.newPage();
tel.on('pageerror', e => fehler.push('handy: ' + String(e.message)));
await tel.goto(`http://localhost:${PORT}/index.html`);
await tel.waitForFunction('typeof App !== "undefined" && typeof Lernwelt !== "undefined" && typeof Trainer !== "undefined"', null, { timeout: 30000 });
await tel.waitForTimeout(600);
const telefon = await tel.evaluate(async () => {
  const w = { Store, Learning, Lernwelt, Register, Produktwelten, WissenDienst,
    Trainer: typeof Trainer === 'undefined' ? undefined : Trainer,
    StaatskundeInhalt: typeof StaatskundeInhalt === 'undefined' ? undefined : StaatskundeInhalt } as any;
  w.Store.setMeta('rundgangGesehen', true);
  document.getElementById('rg-willkommen')?.remove();
  document.querySelector('.produkt-onboarding-lage')?.remove();
  w.Produktwelten.lernen('trainer');
  await new Promise(r => setTimeout(r, 700));
  const wurzel = () => document.querySelector<HTMLElement>('.lernwelt')!;
  wurzel().querySelector<HTMLElement>('[data-tr-anlegen]')?.click();
  await new Promise(r => setTimeout(r, 700));
  const messen = (sel: string) => Array.from(wurzel().querySelectorAll<HTMLElement>(sel)).map(b => ({
    text: (b.textContent || '').trim().slice(0, 30), h: Math.round(b.getBoundingClientRect().height), w: Math.round(b.getBoundingClientRect().width) }));
  const uebersicht = messen('.lw-trainer-start button');
  const breite = document.documentElement.scrollWidth;
  wurzel().querySelector<HTMLElement>('[data-tr-start="pruefung"]')?.click();
  await new Promise(r => setTimeout(r, 300));
  const runde = messen('.lw-trainer-runde button, .lw-trainer-runde .lw-trainer-option');
  const breite2 = document.documentElement.scrollWidth;
  const karte = wurzel().querySelector<HTMLElement>('.lw-trainer-karte')?.getBoundingClientRect();
  return { uebersicht, runde, breite, breite2, karteRechts: karte ? Math.round(karte.right) : 0 };
});
const zuKlein = [...telefon.uebersicht, ...telefon.runde].filter(b => b.h < 44);
console.log('    Übersicht: ' + telefon.uebersicht.length + ' Knöpfe · Runde: ' + telefon.runde.length + ' · Breite ' + telefon.breite + '/' + telefon.breite2);
p('Jeder Knopf und jede Antwort misst mindestens 44 px', telefon.uebersicht.length > 3 && telefon.runde.length > 3 && zuKlein.length === 0, JSON.stringify(zuKlein.slice(0, 4)));
p('Kein Querrollen, die Karte bleibt im Bild', telefon.breite <= 390 && telefon.breite2 <= 390 && telefon.karteRechts <= 390, JSON.stringify([telefon.breite, telefon.breite2, telefon.karteRechts]));

p('Keine Ausnahme im Browser', fehler.length === 0, fehler.slice(0, 2).join(' · '));

await handy.close();
await browser.close();
server.close();
console.log(`\n${ok}/${ok + weg} bestanden`);
process.exit(weg ? 1 : 0);
