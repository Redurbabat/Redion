/* Suite 334 — Der Zeitplan für lange Arbeiten (L103 Punkt 5, E342)
 * ============================================================================
 * L103 Punkt 5 stand seit dem 31. August:
 *
 *     „Ein Auftrag läuft, sobald er dran ist. Es gibt kein „heute Nacht",
 *      kein „wenn das Gerät am Strom hängt", kein „nur im WLAN". Für OCR
 *      und Embeddings wäre genau das die richtige Antwort."
 *
 *   §1 DIE REGEL RECHNET — Fenster, über Mitternacht, Strom, Verbindung.
 *   §2 UNBEKANNT HEISST JA. Firefox kennt `getBattery` nicht; ein Auftrag,
 *      der auf diese Auskunft wartet, liefe nie. Das ist die wichtigste
 *      Entscheidung des ganzen Bogens und deshalb ein eigener Abschnitt.
 *   §3 DER NORMALFALL SCHWEIGT — ohne Bedingung kein Grund, kein Satz,
 *      keine Zeile. Die Gegenprobe zu §5 und §6: eine Auskunft, die immer
 *      dasteht, wird nicht gelesen.
 *   §4 DIE MASCHINE HÄLT WIRKLICH ZURÜCK — zwei Aufträge, einer mit einer
 *      Bedingung, die jetzt nicht gilt. Der andere läuft.
 *   §5 UND SIE LÄSST WIEDER LOS, sobald die Bedingung gilt.
 *   §6 DAS FENSTER SAGT, WORAUF — „wartet" allein sieht aus wie „gleich".
 *   §7 DIE EINSTELLUNG ERREICHT EINEN NEUEN AUFTRAG (§47).
 *   §8 EINE KAPUTTE BEDINGUNG HÄLT NICHTS AUF (§46).
 *
 *   node pruefungen/lauf/test334.mts
 * ==========================================================================*/
declare const Store: any; declare const Zeitplan: any; declare const Auftraege: any;
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9337;

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
const seite = await browser.newPage({ viewport: { width: 1200, height: 900 } });
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 160)));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForFunction(
  () => (document.getElementById('tree')?.children.length || 0) > 0,
  null, { timeout: 30000 });
await seite.waitForTimeout(1800);

/* ========================================================================
 * 1 · Die Regel rechnet
 * ======================================================================*/
console.log('\n1 · Die Regel rechnet');

const r1 = await seite.evaluate(() => {
  const L = (m: number, laedt: any = true, teuer: any = false) => ({ minute: m, laedt, teuer });
  return {
    /* Gewöhnliches Fenster: 08:00 bis 17:00. */
    imTag:    Zeitplan.darf({ vonMinute: 480, bisMinute: 1020 }, L(600)).ok,
    vorTag:   Zeitplan.darf({ vonMinute: 480, bisMinute: 1020 }, L(400)).ok,
    nachTag:  Zeitplan.darf({ vonMinute: 480, bisMinute: 1020 }, L(1100)).ok,
    /* ÜBER MITTERNACHT: 22:00 bis 06:00 — der Fall, der zählt. */
    nachtSpaet:  Zeitplan.darf({ vonMinute: 1320, bisMinute: 360 }, L(1400)).ok,
    nachtFrueh:  Zeitplan.darf({ vonMinute: 1320, bisMinute: 360 }, L(120)).ok,
    nachtMittag: Zeitplan.darf({ vonMinute: 1320, bisMinute: 360 }, L(720)).ok,
    /* Die Grenzen: Anfang gehört dazu, Ende nicht. */
    grenzeAnfang: Zeitplan.imFenster(1320, 360, 1320),
    grenzeEnde:   Zeitplan.imFenster(1320, 360, 360),
    /* Gleich heisst KEIN Fenster — siehe zeitplan.ts. */
    gleich: Zeitplan.darf({ vonMinute: 600, bisMinute: 600 }, L(0)).ok,
    /* Strom und Verbindung. */
    stromAn:  Zeitplan.darf({ amStrom: true }, L(720, true)).ok,
    stromAus: Zeitplan.darf({ amStrom: true }, L(720, false)).ok,
    teuerJa:  Zeitplan.darf({ nichtTeuer: true }, L(720, true, true)).ok,
    teuerNein: Zeitplan.darf({ nichtTeuer: true }, L(720, true, false)).ok,
    uhr: [Zeitplan.uhr(0), Zeitplan.uhr(1320), Zeitplan.uhr(360), Zeitplan.uhr(1439)]
  };
});
p('Im Fenster darf er', r1.imTag);
p('Davor nicht', !r1.vorTag);
p('Danach nicht', !r1.nachTag);
p('Über Mitternacht: um 23:20 darf er', r1.nachtSpaet);
p('… und um 02:00 auch', r1.nachtFrueh);
p('… um 12:00 aber nicht', !r1.nachtMittag);
p('Der Anfang gehört zum Fenster', r1.grenzeAnfang);
p('Das Ende nicht', !r1.grenzeEnde);
p('„von 10:00 bis 10:00" ist kein Fenster, sondern keins', r1.gleich);
p('Am Strom darf er', r1.stromAn);
p('Ohne Strom nicht', !r1.stromAus);
p('Über eine teure Verbindung nicht', !r1.teuerJa);
p('Über eine kostenlose schon', r1.teuerNein);
gleich('Die Uhrzeit steht als Uhrzeit da', r1.uhr, ['00:00', '22:00', '06:00', '23:59']);

/* ========================================================================
 * 2 · Unbekannt heisst ja
 *
 * DIE WICHTIGSTE ENTSCHEIDUNG DES BOGENS. `navigator.getBattery()` gibt es
 * in Firefox und Safari nicht, `navigator.connection` in Safari und Firefox
 * auch nicht. Wer `null` als „nein" liest, baut auf genau diesen Geräten
 * einen Auftrag, der NIE läuft — und das ist, in den Worten von E323,
 * Datenverlust auf Raten.
 * ======================================================================*/
console.log('\n2 · Unbekannt heisst ja — sonst läuft auf Firefox nie ein Auftrag');

const r2 = await seite.evaluate(() => ({
  stromUnbekannt: Zeitplan.darf({ amStrom: true },
    { minute: 720, laedt: null, teuer: null }),
  netzUnbekannt: Zeitplan.darf({ nichtTeuer: true },
    { minute: 720, laedt: null, teuer: null }),
  beides: Zeitplan.darf({ amStrom: true, nichtTeuer: true },
    { minute: 720, laedt: null, teuer: null }).ok,
  /* Und die Zeit gilt trotzdem: unbekannt sind Strom und Netz, nicht die Uhr. */
  zeitGiltWeiter: Zeitplan.darf({ vonMinute: 1320, bisMinute: 360, amStrom: true },
    { minute: 720, laedt: null, teuer: null }).ok
}));
p('„nur am Strom" hält nichts auf, wenn der Browser nichts sagt', r2.stromUnbekannt.ok);
p('„nicht teuer" ebensowenig', r2.netzUnbekannt.ok);
p('Auch beide zusammen nicht', r2.beides);
p('Die Uhr gilt trotzdem — sie ist nie unbekannt', !r2.zeitGiltWeiter);

/* ========================================================================
 * 3 · Der Normalfall schweigt
 *
 * DIE GEGENPROBE ZU §6. Ohne diesen Abschnitt misst §6 nichts: er wäre
 * auch dann grün, wenn im Fenster bei JEDEM Auftrag ein Grund stünde. Und
 * genau das ist die Falle, in die E284, E286, E288, E289 und E290 gelaufen
 * sind — eine Anzeige, die immer etwas anzeigt, wird nicht gelesen.
 * ======================================================================*/
console.log('\n3 · Ohne Bedingung sagt nichts etwas');

const r3 = await seite.evaluate(() => {
  const leer = [undefined, null, {}, { amStrom: false }, { nichtTeuer: false },
                { vonMinute: 600, bisMinute: 600 }, 'unfug', 7];
  return {
    hat:    leer.map(b => Zeitplan.hatBedingung(b)),
    grund:  leer.map(b => Zeitplan.darf(b, { minute: 0, laedt: false, teuer: true }).grund),
    darf:   leer.map(b => Zeitplan.darf(b, { minute: 0, laedt: false, teuer: true }).ok),
    satz:   leer.map(b => Zeitplan.satz(b)),
    sauber: leer.map(b => Zeitplan.sauber(b))
  };
});
gleich('Keins davon ist eine Bedingung', r3.hat, [false, false, false, false, false, false, false, false]);
gleich('Keins erzeugt einen Grund', r3.grund, ['', '', '', '', '', '', '', '']);
gleich('Keins hält etwas auf — auch bei ungünstigster Lage',
       r3.darf, [true, true, true, true, true, true, true, true]);
gleich('Keins erzeugt einen Satz', r3.satz, ['', '', '', '', '', '', '', '']);
gleich('Und keins wird gespeichert', r3.sauber,
       [null, null, null, null, null, null, null, null]);

const r3b = await seite.evaluate(() => ({
  eins: Zeitplan.satz({ amStrom: true }),
  zwei: Zeitplan.satz({ vonMinute: 1320, bisMinute: 360, amStrom: true }),
  drei: Zeitplan.satz({ vonMinute: 1320, bisMinute: 360, amStrom: true, nichtTeuer: true })
}));
gleich('Ein Wunsch: ein Satzteil', r3b.eins, 'nur am Strom');
gleich('Zwei: mit „und"', r3b.zwei, 'von 22:00 bis 06:00 und nur am Strom');
gleich('Drei: mit Komma und „und"', r3b.drei,
       'von 22:00 bis 06:00, nur am Strom und nicht über eine teure Verbindung');
/* NUR EIN „und" JE SATZ. „zwischen 22:00 und 06:00 und nur am Strom" stand
   im ersten Wurf da — zwei „und" in einer Zeile, die Verschiedenes trennen.
   Kein Prüflauf hatte etwas dagegen; gefunden auf dem Bild (§55.1). Diese
   Zeile ist die Prüfung, die es danach gibt. */
p('Kein Satz trägt zwei „und"',
  [r3b.eins, r3b.zwei, r3b.drei].every(t => (String(t).match(/ und /g) || []).length <= 1),
  JSON.stringify([r3b.eins, r3b.zwei, r3b.drei]));

/* ========================================================================
 * 4 · Die Maschine hält wirklich zurück
 *
 * Bis hierher war alles Rechnen. Jetzt die Frage, auf die es ankommt: hört
 * die Maschine auf die Regel?
 * ======================================================================*/
console.log('\n4 · Die Maschine überspringt, was nicht darf');

const r4 = await seite.evaluate(async () => {
  Auftraege.stopp();
  await Auftraege.leeren();
  const gelaufen: string[] = [];
  const ab = Auftraege.anmelden('pruef334',
    async (a: any) => { gelaufen.push(a.eingabe.name); return true; }, 'Prüfung 334');

  /* Die Minute JETZT, und daraus ein Fenster, das sicher NICHT jetzt ist:
     genau eine Stunde, beginnend in zwei Stunden. Über Mitternacht gerechnet,
     damit es auch um 23:30 stimmt. */
  const d = new Date();
  const jetztMin = d.getHours() * 60 + d.getMinutes();
  const von = (jetztMin + 120) % 1440;
  const bis = (jetztMin + 180) % 1440;

  /* Der Gesperrte wird ZUERST angelegt — sonst nähme die Maschine den
     anderen ohnehin zuerst („wer länger wartet, kommt zuerst"), und der
     Abschnitt bewiese nichts. */
  await Auftraege.anlegen('pruef334', { name: 'gesperrt' },
    { bedingung: { vonMinute: von, bisMinute: bis } });
  await new Promise(f => setTimeout(f, 40));
  await Auftraege.anlegen('pruef334', { name: 'frei' }, { bedingung: null });

  Auftraege.start();
  await new Promise(f => setTimeout(f, 2500));
  Auftraege.stopp();

  const liste = await Auftraege.alle();
  const gesperrt = liste.find((a: any) => (a.eingabe || {}).name === 'gesperrt');
  const frei = liste.find((a: any) => (a.eingabe || {}).name === 'frei');
  ab();
  return {
    gelaufen,
    gesperrtZustand: gesperrt && gesperrt.zustand,
    freiZustand: frei && frei.zustand,
    grund: Auftraege.wartetAuf(gesperrt),
    grundFrei: Auftraege.wartetAuf(frei),
    von, bis
  };
});
gleich('Nur der freie Auftrag lief', r4.gelaufen, ['frei']);
gleich('Der gesperrte wartet weiter', r4.gesperrtZustand, 'wartet');
gleich('Der freie ist fertig', r4.freiZustand, 'fertig');
p('Und der gesperrte sagt, worauf er wartet',
  /^läuft erst zwischen \d\d:\d\d und \d\d:\d\d$/.test(String(r4.grund)),
  JSON.stringify(r4.grund));
gleich('Der fertige sagt gar nichts', r4.grundFrei, '');

/* ========================================================================
 * 5 · Und lässt wieder los
 * ======================================================================*/
console.log('\n5 · Sobald die Bedingung gilt, läuft er');

const r5 = await seite.evaluate(async () => {
  Auftraege.stopp();
  await Auftraege.leeren();
  const gelaufen: string[] = [];
  const ab = Auftraege.anmelden('pruef334b',
    async (a: any) => { gelaufen.push(a.eingabe.name); return true; }, 'Prüfung 334b');

  /* Ein Fenster, das JETZT gilt: von einer Stunde vor bis eine Stunde nach. */
  const d = new Date();
  const jetztMin = d.getHours() * 60 + d.getMinutes();
  const von = (jetztMin + 1440 - 60) % 1440;
  const bis = (jetztMin + 60) % 1440;

  await Auftraege.anlegen('pruef334b', { name: 'imFenster' },
    { bedingung: { vonMinute: von, bisMinute: bis } });
  Auftraege.start();
  await new Promise(f => setTimeout(f, 2500));
  Auftraege.stopp();
  const liste = await Auftraege.alle();
  const a = liste.find((x: any) => (x.eingabe || {}).name === 'imFenster');
  ab();
  return { gelaufen, zustand: a && a.zustand, hatBedingung: !!(a && a.bedingung) };
});
gleich('Im eigenen Fenster läuft er', r5.gelaufen, ['imFenster']);
gleich('… und ist fertig', r5.zustand, 'fertig');
p('… und die Bedingung steht immer noch auf ihm', r5.hatBedingung);

/* ========================================================================
 * 6 · Das Fenster sagt, worauf
 * ======================================================================*/
console.log('\n6 · Im Auftragsfenster steht der Grund, nicht nur „wartet"');

const r6 = await seite.evaluate(async () => {
  Auftraege.stopp();
  await Auftraege.leeren();
  const ab = Auftraege.anmelden('pruef334c',
    async () => new Promise(f => setTimeout(f, 50)), 'Seitenbilder');

  const d = new Date();
  const jetztMin = d.getHours() * 60 + d.getMinutes();
  await Auftraege.anlegen('pruef334c', { n: 1 },
    { bedingung: { vonMinute: (jetztMin + 120) % 1440, bisMinute: (jetztMin + 180) % 1440 } });
  await Auftraege.anlegen('pruef334c', { n: 2 }, { bedingung: null });

  /* Das Fenster aus E322 aufmachen. Der Knopf heisst `mb-auftraege` und
     ist verborgen, solange nichts läuft — genau wie die Glocke (E251).
     Gemessen wird beides: dass es ihn gibt UND dass er jetzt sichtbar ist,
     denn zwei offene Aufträge sind genau der Fall, für den es ihn gibt. */
  const knopf = document.getElementById('mb-auftraege') as HTMLElement | null;
  if (!knopf) { ab(); return { fehlt: true, sichtbar: false, zeilen: [] }; }
  await new Promise(f => setTimeout(f, 400));
  const sichtbar = !(knopf as any).hidden;
  knopf.click();
  await new Promise(f => setTimeout(f, 500));
  const zeilen = [...document.querySelectorAll('.arb-z .arb-stand')]
    .map(e => (e.textContent || '').trim());
  const zu = document.querySelector('.arb-zu') as HTMLElement | null;
  if (zu) zu.click();
  ab();
  return { fehlt: false, sichtbar, zeilen };
});
p('Den Knopf zum Auftragsfenster gibt es', !r6.fehlt);
p('Und er ist sichtbar, solange etwas offen ist', !!r6.sichtbar);
if (!r6.fehlt) {
  const mitGrund = (r6.zeilen || []).filter((t: string) => /^läuft erst /.test(t));
  const nurWartet = (r6.zeilen || []).filter((t: string) => t === 'wartet');
  p('Der gesperrte nennt seinen Grund', mitGrund.length === 1,
    JSON.stringify(r6.zeilen));
  p('Und der andere sagt nur „wartet" — oder ist schon weiter',
    nurWartet.length <= 1, JSON.stringify(r6.zeilen));
  p('Nicht bei jeder Zeile steht ein Grund', mitGrund.length < (r6.zeilen || []).length,
    JSON.stringify(r6.zeilen));
}

/* ========================================================================
 * 7 · Die Einstellung erreicht einen neuen Auftrag
 *
 * §47: ein Zeitplan, an den niemand herankommt, ist keiner. Gemessen wird
 * der Weg, den die Einstellungsseite geht — `planSetzen`, dann ein neuer
 * Auftrag ohne eigene Angabe.
 * ======================================================================*/
console.log('\n7 · Was eingestellt ist, gilt für neue Aufträge');

const r7 = await seite.evaluate(async () => {
  Auftraege.stopp();
  await Auftraege.leeren();
  const ab = Auftraege.anmelden('pruef334d', async () => true, 'Prüfung 334d');

  const ohne = await Auftraege.anlegen('pruef334d', { n: 0 });
  const vorher = ohne.bedingung;

  await Auftraege.planSetzen({ vonMinute: 1320, bisMinute: 360, amStrom: true });
  const gelesen = Auftraege.plan();
  const mit = await Auftraege.anlegen('pruef334d', { n: 1 });
  /* Ausdrücklich `null` schlägt die Einstellung — „dieser hier nicht". */
  const trotzdem = await Auftraege.anlegen('pruef334d', { n: 2 }, { bedingung: null });

  await Auftraege.planSetzen(null);
  const danach = Auftraege.plan();
  const wiederOhne = await Auftraege.anlegen('pruef334d', { n: 3 });
  ab();
  await Auftraege.leeren();
  return { vorher, gelesen, mit: mit.bedingung, trotzdem: trotzdem.bedingung,
           danach, wiederOhne: wiederOhne.bedingung };
});
gleich('Ohne Einstellung: keine Bedingung', r7.vorher, null);
gleich('Was gesetzt wurde, wird auch gelesen', r7.gelesen,
       { vonMinute: 1320, bisMinute: 360, amStrom: true });
gleich('Ein neuer Auftrag bekommt sie', r7.mit,
       { vonMinute: 1320, bisMinute: 360, amStrom: true });
gleich('Ausdrückliches `null` schlägt die Einstellung', r7.trotzdem, null);
gleich('Gelöscht ist gelöscht', r7.danach, null);
gleich('… und der nächste Auftrag ist wieder frei', r7.wiederOhne, null);

/* ========================================================================
 * 8 · Eine kaputte Bedingung hält nichts auf
 *
 * §46: aus einer alten Sicherung oder einer verunglückten Eingabe kann
 * Unfug kommen. Ein Auftrag, der wegen einer unlesbaren Bedingung
 * liegenbleibt, ist der teurere Irrtum.
 * ======================================================================*/
console.log('\n8 · Unfug in der Bedingung hält keinen Auftrag auf');

const r8 = await seite.evaluate(() => {
  const unfug = [
    { vonMinute: -5, bisMinute: 2000 },
    { vonMinute: 'zehn', bisMinute: 'zwölf' },
    { vonMinute: 600 },
    { bisMinute: 600 },
    { amStrom: 'ja' },
    { nichtTeuer: 1 },
    { vonMinute: NaN, bisMinute: 360 }
  ];
  const lage = { minute: 720, laedt: false, teuer: true };
  return {
    darf: unfug.map(b => Zeitplan.darf(b, lage).ok),
    sauber: unfug.map(b => Zeitplan.sauber(b))
  };
});
gleich('Keiner davon hält etwas auf', r8.darf, [true, true, true, true, true, true, true]);
gleich('Und keiner wird gespeichert', r8.sauber,
       [null, null, null, null, null, null, null]);

/* ========================================================================
 * 9 · Die Schalter kann man sehen und treffen
 *
 * DIESER ABSCHNITT GIBT ES WEGEN EINES BILDES. Der erste Wurf schrieb
 * `class="ez-schalter"` — eine Klasse, die es nirgends gibt. Der Knopf war
 * damit 0 mal 0 Pixel gross, farblos, unsichtbar: ein Schalter, den
 * niemand sehen und niemand treffen kann (§47). Kein Prüflauf hatte etwas
 * dagegen, weil keiner nachsah, ob der Knopf eine GRÖSSE hat.
 * ======================================================================*/
console.log('\n9 · Die Schalter sind da, sichtbar und gross genug');

const r9 = await seite.evaluate(async () => {
  const w = window as any;
  await w.Auftraege.planSetzen({ vonMinute: 1320, bisMinute: 360, amStrom: true });
  w.Einstellungen.oeffne('speicher');
  await new Promise(f => setTimeout(f, 700));
  const knoepfe = [...document.querySelectorAll('[data-plan-an]')] as HTMLElement[];
  const felder = [...document.querySelectorAll('[data-plan]')] as HTMLElement[];
  const mass = (el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    const st = getComputedStyle(el);
    return { b: Math.round(r.width), h: Math.round(r.height),
             sichtbar: st.display !== 'none' && st.visibility !== 'hidden' &&
                       Number(st.opacity) > 0 };
  };
  /* ERST MESSEN, DANN DRÜCKEN. Der erste Wurf tat es umgekehrt und mass
     danach — nach dem Druck baut sich die Seite neu auf (der Satz oben
     ändert sich mit), die gemerkten Knöpfe hängen dann an keinem Dokument
     mehr, und `getBoundingClientRect` sagt für alles 0 × 0. Gemeldet wurden
     drei Fehler, die es nicht gab. */
  const gemessen = { knoepfe: knoepfe.map(mass), felder: felder.map(mass) };

  /* Und tut er auch etwas? Einmal drücken und nachsehen. */
  const vorher = !!(w.Auftraege.plan() || {}).amStrom;
  knoepfe.find(k => k.dataset.planAn === 'amStrom')?.click();
  await new Promise(f => setTimeout(f, 400));
  const nachher = !!((w.Auftraege.plan() || {}) as any).amStrom;
  await w.Auftraege.planSetzen(null);
  document.querySelectorAll('.overlay').forEach(o => o.remove());
  return { ...gemessen, vorher, nachher };
});
gleich('Zwei Schalter stehen da', r9.knoepfe.length, 2);
gleich('Zwei Zeitfelder auch', r9.felder.length, 2);
p('Jeder Schalter ist sichtbar', r9.knoepfe.every((m: any) => m.sichtbar),
  JSON.stringify(r9.knoepfe));
/* DIE GRÖSSE IST DIE PRÜFUNG, NICHT DAS „sichtbar". Gemessen mit der
   erfundenen Klasse zurückgedreht: `sichtbar` blieb WAHR — ein Knopf ohne
   ein einziges Stück CSS steht immer noch auf `display:inline-block`. Nur
   die Grösse fiel auf 0 × 0. Eine Prüfung, die bloss `display` liest, hätte
   den Fehler durchgelassen, den das Bild gefunden hat. */
p('… und hat eine Grösse — nicht 0 × 0',
  r9.knoepfe.every((m: any) => m.b >= 20 && m.h >= 12), JSON.stringify(r9.knoepfe));
p('Die Zeitfelder auch', r9.felder.every((m: any) => m.sichtbar && m.b >= 60 && m.h >= 20),
  JSON.stringify(r9.felder));
p('Und ein Druck kippt die Einstellung wirklich',
  r9.vorher === true && r9.nachher === false, JSON.stringify([r9.vorher, r9.nachher]));

gleich('Keine JS-Fehler auf der Seite', fehler, []);

await browser.close();
await new Promise<void>(f => server.close(() => f()));

console.log(`\n${ok}/${ok + weg} bestanden`);
process.exitCode = weg ? 1 : 0;
