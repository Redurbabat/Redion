/* Suite 50 — Der Kern: Helfer, Sicherheit, Formen, Umzüge, Ereignisse */
import { fileURLToPath as _alsPfad } from 'node:url';
import { dirname as _ordner, resolve as _loese } from 'node:path';
import { createRequire as _brauche } from 'node:module';
const WURZEL = _loese(_ordner(_alsPfad(import.meta.url)), '../..');
const require = _brauche(import.meta.url);
const { chromium } = require('playwright');

let ok = 0, weg = 0;
const p = (n, b, extra = '') => { if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); } };

const browser = await chromium.launch();
const seite = await browser.newPage();
const fehler = [];
seite.on('pageerror', e => fehler.push(e.message));
await seite.goto('file://' + WURZEL + '/index.html');
await seite.waitForFunction(() => typeof App !== 'undefined' && typeof Formen !== 'undefined',
  null, { timeout: 20000 });
await seite.waitForTimeout(1200);

console.log('\n— Der Bus —');
let r = await seite.evaluate(() => {
  const gehoert = [];
  const ab = Ereignisse.horche('probe', d => gehoert.push(d));
  Ereignisse.melde('probe', 1);
  Ereignisse.melde('probe', 2);
  ab();
  Ereignisse.melde('probe', 3);
  let einmalig = 0;
  Ereignisse.einmal('nur-einmal', () => einmalig++);
  Ereignisse.melde('nur-einmal'); Ereignisse.melde('nur-einmal');
  const antworten = (() => {
    Ereignisse.horche('frag', () => 'a');
    Ereignisse.horche('frag', () => null);
    Ereignisse.horche('frag', () => 'b');
    return Ereignisse.frage('frag');
  })();
  let weiter = 0;
  Ereignisse.horche('kaputt', () => { throw new Error('absicht'); });
  Ereignisse.horche('kaputt', () => weiter++);
  Ereignisse.melde('kaputt');
  return { gehoert, einmalig, antworten, weiter };
});
p('Abmelden wirkt',              JSON.stringify(r.gehoert) === '[1,2]', JSON.stringify(r));
p('einmal() hört genau einmal',  r.einmalig === 1, String(r.einmalig));
p('frage sammelt, leere fallen weg',
  JSON.stringify(r.antworten) === '["a","b"]', JSON.stringify(r.antworten));
p('Ein kaputter Zuhörer reisst die anderen nicht mit', r.weiter === 1, String(r.weiter));

r = await seite.evaluate(() => ({ arten: Object.keys(ARTEN).length,
  kennt: artKennt('seite.angelegt'), kenntNicht: artKennt('gibts.nicht'),
  fest: (() => { try { ARTEN.seiteAngelegt = 'x'; } catch {} return ARTEN.seiteAngelegt; })() }));
p('Die Ereignisliste ist da',    r.arten > 30, String(r.arten));
p('Und lässt sich prüfen',       r.kennt === true && r.kenntNicht === false, JSON.stringify(r));
p('Sie ist eingefroren',         r.fest === 'seite.angelegt', r.fest);

console.log('\n— Kennungen —');
r = await seite.evaluate(() => {
  const a = Ids.long(), b = Ids.long();
  return { verschieden: a !== b, gueltig: Ids.isValid(a),
    ohne: Ids.withoutDashes(a).length,
    hinUndZurueck: Ids.withDashes(Ids.withoutDashes(a)) === a,
    gleich: Ids.equal(a, Ids.withoutDashes(a).toUpperCase()),
    kurz: Ids.short(5).length,
    lesbar: /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789-]+$/.test(Ids.readable()),
    ausAdresse: Ids.fromUrl('https://x.ch/seite-' + Ids.withoutDashes(a)) === a };
});
p('Zwei Kennungen sind verschieden', r.verschieden && r.gueltig, JSON.stringify(r));
p('Mit und ohne Striche ist dasselbe', r.ohne === 32 && r.hinUndZurueck && r.gleich, JSON.stringify(r));
p('Kurz und lesbar tun, was sie sollen', r.kurz === 5 && r.lesbar, JSON.stringify(r));
p('Aus einer Adresse herausgeschnitten', r.ausAdresse === true, JSON.stringify(r));

console.log('\n— Datum —');
r = await seite.evaluate(() => ({
  reinesDatumLokal: Dates.parse('2026-08-03').getDate() === 3 &&
                    Dates.parse('2026-08-03').getHours() === 0,
  monatsende: Dates.toDay(Dates.addMonths('2026-01-31', 1)),
  tage: Dates.daysBetween('2026-08-01', '2026-08-31'),
  werktage: Dates.businessDaysBetween('2026-08-03', '2026-08-10'),
  wochenende: Dates.isWeekend('2026-08-08') && !Dates.isWeekend('2026-08-03'),
  kw: Dates.isoWeek('2026-01-01'),
  vor: Dates.relativeText(new Date(Date.now() - 3 * 86400000)),
  wochenanfang: Dates.toDay(Dates.startOfWeek('2026-08-08')),
  /* Der alte Name darf nicht mehr da sein. Bliebe er, fiele niemandem auf,
     dass eine Stelle die alte Fassung benutzt — bis die alte Fassung eines
     Tages verschwindet und es dann still bricht. */
  alterNameWeg: typeof Datum === 'undefined'
}));
p('Ein reines Datum ist der lokale Tag', r.reinesDatumLokal === true, JSON.stringify(r));
p('31. Januar plus ein Monat ist der 28. Februar', r.monatsende === '2026-02-28', r.monatsende);
p('Tage zwischen zwei Daten',     r.tage === 30, String(r.tage));
p('Werktage lassen das Wochenende aus', r.werktage === 5, String(r.werktage));
p('Wochenende wird erkannt',      r.wochenende === true);
p('Kalenderwoche nach ISO',       r.kw === 1, String(r.kw));
p('„vor 3 Tagen" auf Deutsch',    /3 Tagen/.test(r.vor), r.vor);
p('Die Woche beginnt am Montag',  r.wochenanfang === '2026-08-03', r.wochenanfang);
p('Der alte Name Datum ist weg',  r.alterNameWeg === true);

console.log('\n— Objekte —');
r = await seite.evaluate(() => {
  const o = { a: 1, b: { c: [1, 2, { d: 3 }] }, e: new Date('2026-01-01') };
  const k = Objects.clone(o);
  k.b.c[2].d = 99;
  return {
    tief: o.b.c[2].d === 3 && k.b.c[2].d === 99,
    datumKopiert: k.e instanceof Date && k.e.getTime() === o.e.getTime(),
    gleichEgalReihenfolge: Objects.equal({ a: 1, b: 2 }, { b: 2, a: 1 }),
    ungleich: !Objects.equal({ a: 1 }, { a: 2 }),
    hole: Objects.get(o, 'b.c.2.d'),
    holeErsatz: Objects.get(o, 'x.y.z', 'nichts'),
    setze: (() => { const x = {}; Objects.set(x, 'a.b.c', 5); return x.a.b.c; })(),
    misch: Objects.merge({ a: 1, t: { x: 1, y: 2 } }, { t: { y: 9 } }).t,
    unterschiede: Objects.differences({ a: 1, b: 2 }, { a: 1, b: 3 }),
    gruppiert: Object.keys(Objects.groupBy([{ t: 'a' }, { t: 'b' }, { t: 'a' }], 't')),
    alterNameWeg: typeof Objekte === 'undefined'
  };
});
p('Der alte Name Objekte ist weg', r.alterNameWeg === true);
p('Kopie ist wirklich tief',      r.tief === true, JSON.stringify(r));
p('Ein Datum überlebt die Kopie', r.datumKopiert === true);
p('Gleich ohne Rücksicht auf die Reihenfolge', r.gleichEgalReihenfolge && r.ungleich);
p('Tief lesen und schreiben',     r.hole === 3 && r.holeErsatz === 'nichts' && r.setze === 5,
  JSON.stringify(r));
p('Mischen geht tief',            r.misch.x === 1 && r.misch.y === 9, JSON.stringify(r.misch));
p('Unterschiede kommen als Pfad', JSON.stringify(r.unterschiede) === '["b"]', JSON.stringify(r.unterschiede));
p('Gruppieren',                   JSON.stringify(r.gruppiert) === '["a","b"]');

console.log('\n— Bremse —');
r = await seite.evaluate(async () => {
  let n = 0;
  const b = Throttle.debounce(() => n++, 50);
  b(); b(); b();
  const sofort = n;
  await new Promise(r2 => setTimeout(r2, 120));
  const nach = n;

  let m = 0;
  const t = Throttle.throttle(() => m++, 60);
  t(); t(); t();
  const taktSofort = m;
  await new Promise(r2 => setTimeout(r2, 120));

  let e = 0;
  const einmal = Throttle.once(() => ++e);
  einmal(); einmal();

  let g = 0;
  const gem = Throttle.memoize((x) => { g++; return x * 2; });
  gem(3); gem(3); gem(4);

  const b2 = Throttle.debounce(() => n += 10, 5000);
  b2(); b2.flush();

  return { sofort, nach, taktSofort, m, e, g, nachSofort: n,
           alterNameWeg: typeof Bremse === 'undefined' };
});
p('Nachlauf wartet und läuft einmal', r.sofort === 0 && r.nach === 1, JSON.stringify(r));
p('Takt lässt den ersten sofort durch', r.taktSofort === 1 && r.m === 2, JSON.stringify(r));
p('einmal() rechnet einmal',      r.e === 1, String(r.e));
p('gemerkt() rechnet je Eingabe einmal', r.g === 2, String(r.g));
p('Der alte Name Bremse ist weg',  r.alterNameWeg === true);
p('sofort() holt die letzte Eingabe nach', r.nachSofort === 11, String(r.nachSofort));

console.log('\n— Säubern —');
r = await seite.evaluate(() => ({
  skript: Saeubern.html('<p>gut</p><script>alert(1)</script>'),
  onclick: Saeubern.html('<a href="/x" onclick="böse()">Text</a>'),
  jsAdresse: Saeubern.html('<a href="javascript:alert(1)">Text</a>'),
  dataBild: Saeubern.html('<img src="data:image/png;base64,AAA">'),
  dataText: Saeubern.html('<img src="data:text/html,<script>">'),
  iframe: Saeubern.html('<div>a<iframe src="x"></iframe>b</div>'),
  unbekannt: Saeubern.html('<section><p>bleibt</p></section>'),
  blank: Saeubern.html('<a href="https://x.ch" target="_blank">x</a>'),
  nurText: Saeubern.nurText('<h1>Titel</h1><script>weg</script><p>Text</p>'),
  esc: Saeubern.alsText('<b>&"'),
  datei: Saeubern.dateiname('../../etc/passwd'),
  adrGut: Saeubern.adresse('https://x.ch'),
  adrBoese: Saeubern.adresse('javascript:x')
}));
p('Skript fliegt samt Inhalt raus', !/alert/.test(r.skript) && /gut/.test(r.skript), r.skript);
p('onclick verschwindet',          !/onclick/.test(r.onclick) && /href/.test(r.onclick), r.onclick);
p('javascript: in href fällt weg', !/javascript/.test(r.jsAdresse), r.jsAdresse);
p('data:image bleibt',             /data:image/.test(r.dataBild), r.dataBild);
p('data:text/html fliegt raus',    !/data:text/.test(r.dataText), r.dataText);
p('iframe weg, Text bleibt',       !/iframe/.test(r.iframe) && /a/.test(r.iframe) && /b/.test(r.iframe), r.iframe);
p('Unbekanntes Tag: Inhalt bleibt', /bleibt/.test(r.unbekannt), r.unbekannt);
p('target=_blank bekommt noopener', /noopener/.test(r.blank), r.blank);
p('nurText lässt nichts Gefährliches übrig',
  !/weg/.test(r.nurText) && /Titel/.test(r.nurText), r.nurText);
p('alsText maskiert',              r.esc === '&lt;b&gt;&amp;&quot;', r.esc);
p('Dateiname ohne Wege',           !r.datei.includes('/') && !r.datei.startsWith('.'), r.datei);
p('Adressen werden gefiltert',     r.adrGut === 'https://x.ch' && r.adrBoese === '', JSON.stringify(r));

console.log('\n— Prüfen —');
r = await seite.evaluate(() => ({
  mailGut: Pruefen.mail('a@b.ch').ok,
  mailOhne: Pruefen.mail('ab.ch'),
  mailOhnePunkt: Pruefen.mail('a@b').satz,
  zahl: Pruefen.zahl('12,5').ok,
  zahlGrenze: Pruefen.zahl(5, { min: 10 }).satz,
  datum: Pruefen.datum('2026-08-03').ok,
  keinDatum: Pruefen.datum('gestern Abend').ok,
  satzKurz: Pruefen.satzFuerSchluessel('kurz').satz,
  satzGut: Pruefen.satzFuerSchluessel('mein langer geheimer satz').ok,
  zeile: Pruefen.zeile({ e: { name: 'Mail', type: 'email' }, n: { name: 'Zahl', type: 'number' } },
                       { e: 'kaputt', n: 'auch kaputt' })
}));
p('Eine gute Mail geht durch',     r.mailGut === true);
p('Eine schlechte nennt den Grund', r.mailOhne.ok === false && /@/.test(r.mailOhne.satz), JSON.stringify(r.mailOhne));
p('Und der Grund ist ein Satz',    /Punkt/.test(r.mailOhnePunkt), r.mailOhnePunkt);
p('Zahlen mit Komma gehen',        r.zahl === true);
p('Grenzen werden benannt',        /Mindestens 10/.test(r.zahlGrenze), r.zahlGrenze);
p('Datum ja, Geschwätz nein',      r.datum === true && r.keinDatum === false);
p('Ein kurzer Schlüsselsatz wird abgelehnt', /Satz/.test(r.satzKurz), r.satzKurz);
p('Ein langer geht durch',         r.satzGut === true);
p('Eine ganze Zeile meldet beide Felder', r.zeile.length === 2, JSON.stringify(r.zeile));

console.log('\n— Rollen —');
r = await seite.evaluate(() => ({
  voll: Rollen.darf('voll', 'rechte'),
  edit: Rollen.darf('edit', 'bearbeiten') && !Rollen.darf('edit', 'rechte'),
  lesen: Rollen.darf('lesen', 'lesen') && !Rollen.darf('lesen', 'bearbeiten'),
  unbekannt: Rollen.darf('gibtsnicht', 'lesen'),
  schwaecher: Rollen.schwaechere('voll', 'lesen'),
  warum: Rollen.warumNicht('lesen', 'bearbeiten'),
  ohneKonto: Rollen.zeigen('bearbeiten', '')
}));
p('Vollzugriff darf Rechte vergeben', r.voll === true);
p('Bearbeiten darf ändern, aber keine Rechte', r.edit === true);
p('Lesen darf nur lesen',          r.lesen === true);
p('Eine unbekannte Rolle darf nichts', r.unbekannt === false);
p('Die schwächere gewinnt beim Erben', r.schwaecher === 'lesen', r.schwaecher);
p('Es steht da, was fehlt',        /Bearbeiten/.test(r.warum), r.warum);
p('Ohne Konto ist alles sichtbar', r.ohneKonto === true);

console.log('\n— Formen und Selbstheilung —');
r = await seite.evaluate(() => {
  const kaputt = { id: 'x1', type: 'text' };            /* fast alles fehlt */
  const m = Formen.maengel('block', kaputt);
  const h = Formen.heile('block', JSON.parse(JSON.stringify(kaputt)));
  const falsch = Formen.heile('block',
    { id: 'x2', type: 'text', text: 5, content: 'einer', alive: 1,
      parentTable: 'block', created: '2026-01-01T00:00:00.000Z',
      edited: '2026-01-01T00:00:00.000Z' });
  return { fehltAnzahl: m.length, geheilt: h.geheilt.length,
           heilDanach: Formen.heil('block', h.satz),
           textJetzt: typeof falsch.satz.text,
           contentJetzt: Array.isArray(falsch.satz.content),
           aliveJetzt: typeof falsch.satz.alive,
           bericht: Formen.zustand(false) };
});
p('Mängel werden gefunden',        r.fehltAnzahl >= 5, String(r.fehltAnzahl));
p('Und geheilt',                   r.geheilt >= 5 && r.heilDanach === true, JSON.stringify(r));
p('Falsche Arten werden gerettet',
  r.textJetzt === 'string' && r.contentJetzt && r.aliveJetzt === 'boolean', JSON.stringify(r));
p('Der ganze Bestand ist heil',    r.bericht.kaputt.length === 0,
  JSON.stringify((r.bericht.kaputt || []).slice(0, 2)));

console.log('\n— Umzüge —');
r = await seite.evaluate(() => ({
  fassungen: Umzuege.FASSUNGEN.length,
  jetzige: Umzuege.JETZIGE,
  faecher: Umzuege.faecher().length,
  zwischen: Umzuege.zwischen(3, 5).map(f => f.nr),
  hinweis: Umzuege.hinweisZuAlt(9),
  gelaufen: Umzuege.gelaufen().length,
  nochmal: Umzuege.laufen()
}));
p('Alle fünf Fassungen beschrieben', r.fassungen === 5 && r.jetzige === 5, JSON.stringify(r));
p('Neun Fächer insgesamt',         r.faecher === 9, String(r.faecher));
p('Der Weg von 3 nach 5',          JSON.stringify(r.zwischen) === '[4,5]', JSON.stringify(r.zwischen));
p('Eine zu alte App bekommt einen Satz', /neueren Fassung/.test(r.hinweis), r.hinweis);
p('Die Umzüge sind gelaufen',      r.gelaufen >= 2, String(r.gelaufen));
p('Zweimal laufen ändert nichts',  r.nochmal.gelaufen.length === 0, JSON.stringify(r.nochmal));

console.log('\n— Einstellung und Schalter —');
r = await seite.evaluate(() => {
  const vorher = Schalter.an('abgleich');
  Schalter.setze('abgleich', false);
  const nachher = Schalter.an('abgleich');
  Schalter.zuruecksetzen('abgleich');
  return { vorher, nachher, zurueck: Schalter.an('abgleich'),
    unbekannt: Schalter.an('gibtsnicht'),
    alle: Schalter.alle().length,
    konstante: KONSTANTEN.SCHREIB_PAUSE_MS,
    eingefroren: (() => { try { KONSTANTEN.SCHREIB_PAUSE_MS = 1; } catch {} return KONSTANTEN.SCHREIB_PAUSE_MS; })(),
    fassung: AppEinstellung.FASSUNG,
    herkunft: AppEinstellung.herkunft(),
    steckbrief: AppEinstellung.steckbrief().split('\n').length,
    kann: AppEinstellung.kann().speicher };
});
p('Ein Schalter lässt sich umlegen', r.vorher === true && r.nachher === false && r.zurueck === true,
  JSON.stringify(r));
p('Ein unbekannter Name schaltet nichts ein', r.unbekannt === false);
p('Alle Schalter sind beschrieben', r.alle >= 7, String(r.alle));
p('Konstanten sind eingefroren',   r.eingefroren === 400, String(r.eingefroren));
p('Der Steckbrief sagt, wo es läuft',
  r.herkunft === 'festplatte' && r.steckbrief >= 4 && r.kann === true, JSON.stringify(r));

console.log('\n— Melder —');
r = await seite.evaluate(() => {
  Reporter.clear();
  Reporter.info('Probe', 'etwas geschah');
  Reporter.warn('Probe', 'etwas hakte');
  const wert = Reporter.guarded('Probe', () => { throw new Error('absicht'); }, 'ersatz')();
  return { anzahl: Reporter.all().length, zahlen: Reporter.counts(),
           wert, text: Reporter.toText().split('\n').length,
           /* Die Stufennamen bleiben deutsch — sie sind Werte, keine
              Bezeichner, und stehen so in der ausgegebenen Datei. */
           stufenDeutsch: JSON.stringify(Reporter.LEVELS),
           alterNameWeg: typeof Melder === 'undefined' };
});
p('Der Melder sammelt',            r.anzahl === 3, JSON.stringify(r.zahlen));
p('behuetet gibt den Ersatz zurück', r.wert === 'ersatz', String(r.wert));
p('Und alles lässt sich ausgeben', r.text === 3, String(r.text));
p('Die Stufen heissen weiter deutsch',
  r.stufenDeutsch === '["spur","info","warnung","fehler"]', r.stufenDeutsch);
p('Der alte Name Melder ist weg',  r.alterNameWeg === true);

await browser.close();
if (fehler.length) { console.log('\nJS-Fehler:'); fehler.forEach(f => console.log('  ' + f)); }
console.log(`\n  Suite 50 — Kern: ${ok} ok, ${weg + fehler.length} offen`);
process.exit(weg || fehler.length ? 1 : 0);
