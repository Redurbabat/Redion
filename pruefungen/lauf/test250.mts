/* Suite 250 — Der Stundenplan (E243/L70)
 * ============================================================================
 * Hinter dem Knopf „Stundenplan" auf dem Schul-Dashboard stand kein
 * Stundenplan — er öffnete die Ausbildungsseite (L70). Jetzt gibt es die
 * Wochenansicht, und diese Suite prüft sie an der echten App:
 *
 * §1 LEERFALL OHNE PLAN: die Einladung führt zur Schulvorlage (§47).
 * §2 DIE VORLAGE LEGT IHN AN — auch nachträglich auf einem Bestand, der die
 *    Ausbildung schon hat, und beim zweiten Lauf entsteht KEIN zweiter.
 * §3 LEERFALL MIT LEEREM PLAN: der Weg führt zum Plan selbst.
 * §4 DIE WOCHE ORDNET: Lektionen stehen am richtigen Tag in Zeitreihenfolge,
 *    leere Tage sagen „frei", Samstag erscheint erst, wenn er belegt ist.
 * §5 DIE KOPFZEILE KENNT DAS JETZT: eine Lektion, die die aktuelle Uhrzeit
 *    umschliesst, steht als „Jetzt: …" oben und trägt das Wort „jetzt" (§38);
 *    an einem Sonntag sagt die Kopfzeile stattdessen ehrlich, dass nichts
 *    im Plan steht — der Plan kennt nur Montag bis Samstag.
 * §6 DER KNOPF HÄLT SEIN VERSPRECHEN: vom Schul-Dashboard aus öffnet er die
 *    Stundenplan-ANSICHT, nicht mehr die Ausbildungsseite.
 * ==========================================================================*/
import _pfad from 'node:path';
const WURZEL = _pfad.resolve(import.meta.dirname, '../..');
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const PORT = 9010;
const TYP: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2'
};
const server = createServer((q, a) => {
  let pfad = join(WURZEL, decodeURIComponent((q.url || '/').split('?')[0]!));
  if (existsSync(pfad) && statSync(pfad).isDirectory()) pfad = join(pfad, 'index.html');
  if (!existsSync(pfad) || !pfad.startsWith(WURZEL)) { a.statusCode = 404; a.end('weg'); return; }
  a.setHeader('Content-Type', TYP[extname(pfad)] || 'application/octet-stream');
  a.end(readFileSync(pfad));
});
await new Promise<void>(f => server.listen(PORT, () => f()));

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1400, height: 950 } });
const fehler: string[] = [];
p.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message));

let ok = 0, weg = 0;
const pr = (name: string, gut: unknown, ist = ''): void => {
  if (gut) ok++; else weg++;
  console.log((gut ? '  ✓ ' : '  ✗ ') + name + (gut || !ist ? '' : ' — ' + ist));
};

await p.goto(`http://localhost:${PORT}/index.html`);
await p.waitForFunction(() => typeof App !== 'undefined' && typeof Store !== 'undefined' &&
  (document.getElementById('tree')?.children.length || 0) > 0, null, { timeout: 30000 });
await p.evaluate(() => {
  Store.setMeta('rundgangGesehen', true);
  document.getElementById('rg-willkommen')?.remove();
  document.querySelector('.produkt-onboarding-lage')?.remove();
});

console.log('\n1 · Leerfall ohne Plan: die Einladung führt zur Schulvorlage');
await p.evaluate(() => Produktwelten.lernen('stundenplan'));
await p.waitForTimeout(700);
const leer1 = await p.evaluate(() => ({
  titel: (document.querySelector('.lw-plan h3, .lw-plan .lw-empty h3')?.textContent || '').trim(),
  aktion: document.querySelector('.lw-plan [data-lw-action]')?.getAttribute('data-lw-action') || ''
}));
pr('Ohne Stundenplan steht die Einladung zur Schulvorlage',
  /kein Stundenplan/i.test(leer1.titel) && leer1.aktion === 'school-install',
  JSON.stringify(leer1));

console.log('\n2 · Die Vorlage legt den Plan an — nachträglich und ohne Doppel');
/* Erst die Ausbildung OHNE Plan simulieren: Vorlage bauen, dann prüfen,
   dass ein ZWEITER Lauf keinen zweiten Plan anlegt. */
const vorlage = await p.evaluate(() => {
  Galerie.bauen('ausbildung');
  const erste = Object.values<any>(Store.cache.collections)
    .filter(c => c.schoolKind === 'timetable');
  Galerie.bauen('ausbildung');
  const zweite = Object.values<any>(Store.cache.collections)
    .filter(c => c.schoolKind === 'timetable');
  const plan = zweite[0];
  const spalten = Object.values<any>(plan?.schema || {}).map((s: any) => s.name);
  (globalThis as any).__planC = plan?.id;
  return { erste: erste.length, zweite: zweite.length, name: plan?.name, spalten };
});
pr('Die Schulvorlage legt genau EINE Stundenplan-Datenbank an, auch beim zweiten Lauf',
  vorlage.erste === 1 && vorlage.zweite === 1 && vorlage.name === 'Stundenplan',
  JSON.stringify(vorlage));
pr('… mit Tag, Von, Bis, Fach und Raum als Spalten',
  ['Tag', 'Von', 'Bis', 'Fach', 'Raum'].every(s => vorlage.spalten.includes(s)),
  JSON.stringify(vorlage.spalten));

console.log('\n3 · Leerfall mit leerem Plan: der Weg führt zum Plan');
await p.evaluate(() => Produktwelten.lernen('stundenplan'));
await p.waitForTimeout(700);
const leer2 = await p.evaluate(() => ({
  titel: (document.querySelector('.lw-plan h3, .lw-plan .lw-empty h3')?.textContent || '').trim(),
  aktion: document.querySelector('.lw-plan [data-lw-action]')?.getAttribute('data-lw-action') || ''
}));
pr('Mit leerem Plan führt der Knopf zum Stundenplan',
  /keine Lektionen/i.test(leer2.titel) && leer2.aktion === 'timetable-open',
  JSON.stringify(leer2));

console.log('\n4 · Die Woche ordnet: richtiger Tag, richtige Reihenfolge');
await p.evaluate(() => {
  const c = Store.getCollection((globalThis as any).__planC);
  const rein = (titel: string, tag: string, von: string, bis: string, raum = '') => {
    const z = Store.addBlock(c.id, 'page');
    Store.updateBlock(z.id, { text: titel, parentTable: 'collection',
      props: { day: tag, from: von, to: bis, room: raum } });
  };
  /* Absichtlich in falscher Reihenfolge eingetragen — sortieren muss die
     Ansicht. Und einmal „8.35" mit Punkt, wie man es eben tippt. */
  rein('Elektrotechnik', 'Montag', '8.35', '09:20', 'B204');
  rein('Mathematik', 'Montag', '07:45', '08:30', 'A101');
  rein('Fachzeichnen', 'Dienstag', '13:15', '14:00');
  Produktwelten.lernen('stundenplan');
});
await p.waitForTimeout(800);
const woche = await p.evaluate(() => {
  const tage = [...document.querySelectorAll<HTMLElement>('.lw-plan-tag')];
  return {
    spalten: tage.length,
    montag: [...(tage[0]?.querySelectorAll('.lw-plan-lektion strong') || [])]
      .map(s => (s.textContent || '').trim()),
    montagZeiten: [...(tage[0]?.querySelectorAll('.lw-plan-lektion time') || [])]
      .map(s => (s.textContent || '').trim()),
    dienstag: [...(tage[1]?.querySelectorAll('.lw-plan-lektion strong') || [])]
      .map(s => (s.textContent || '').trim()),
    mittwochFrei: (tage[2]?.querySelector('.lw-plan-frei')?.textContent || '').trim(),
    raum: (tage[0]?.querySelector('.lw-plan-lektion span')?.textContent || '').trim()
  };
});
pr('Fünf Tagesspalten — der unbelegte Samstag drängt sich nicht auf',
  woche.spalten === 5, String(woche.spalten));
pr('Montag ordnet nach Uhrzeit: Mathematik (07:45) vor Elektrotechnik (8.35)',
  woche.montag.length === 2 && woche.montag[0] === 'Mathematik' && woche.montag[1] === 'Elektrotechnik',
  JSON.stringify(woche.montag));
pr('Dienstag trägt das Fachzeichnen, der Mittwoch sagt „frei"',
  woche.dienstag.length === 1 && woche.dienstag[0] === 'Fachzeichnen' && woche.mittwochFrei === 'frei',
  JSON.stringify({ dienstag: woche.dienstag, mittwoch: woche.mittwochFrei }));
pr('Der Raum der ersten Montagslektion steht dabei: A101', woche.raum === 'A101', woche.raum);

const samstag = await p.evaluate(() => {
  const c = Store.getCollection((globalThis as any).__planC);
  const z = Store.addBlock(c.id, 'page');
  Store.updateBlock(z.id, { text: 'Freifach', parentTable: 'collection',
    props: { day: 'Samstag', from: '09:00', to: '10:00' } });
  Produktwelten.lernen('stundenplan');
  return true;
});
await p.waitForTimeout(700);
pr('Mit einer Samstagslektion erscheint die sechste Spalte',
  samstag && await p.evaluate(() => document.querySelectorAll('.lw-plan-tag').length) === 6,
  String(await p.evaluate(() => document.querySelectorAll('.lw-plan-tag').length)));

console.log('\n5 · Die Kopfzeile kennt das Jetzt');
const jetzt = await p.evaluate(() => {
  const heute = new Date().getDay(); // 0 = Sonntag
  if (heute === 0) return { sonntag: true, kopf: '', wort: false };
  const TAGE = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  const c = Store.getCollection((globalThis as any).__planC);
  const z = Store.addBlock(c.id, 'page');
  Store.updateBlock(z.id, { text: 'Jetztfach', parentTable: 'collection',
    props: { day: TAGE[heute - 1], from: '00:00', to: '23:59', room: 'Z9' } });
  Produktwelten.lernen('stundenplan');
  return { sonntag: false };
});
await p.waitForTimeout(800);
if ((jetzt as any).sonntag) {
  pr('Sonntag: die Kopfzeile sagt ehrlich, dass nichts im Plan steht',
    await p.evaluate(() => /Heute steht nichts im Plan/.test(
      document.querySelector('.lw-plan h2')?.textContent || '')),
    await p.evaluate(() => (document.querySelector('.lw-plan h2')?.textContent || '').trim()));
} else {
  const kopf = await p.evaluate(() => ({
    h2: (document.querySelector('.lw-plan h2')?.textContent || '').trim(),
    wort: !!document.querySelector('.lw-plan-lektion.ist-jetzt .lw-plan-jetzt'),
    heuteWort: !!document.querySelector('.lw-plan-tag.ist-heute h3 em')
  }));
  pr('„Jetzt: Jetztfach bis 23:59 in Z9" steht in der Kopfzeile',
    /^Jetzt: Jetztfach bis 23:59 in Z9$/.test(kopf.h2), kopf.h2);
  pr('Die laufende Lektion trägt das WORT „jetzt", nicht nur eine Farbe (§38)',
    kopf.wort, '');
  pr('Der heutige Tag trägt das Wort „heute"', kopf.heuteWort, '');
}

console.log('\n6 · Der Knopf auf dem Schul-Dashboard hält sein Versprechen');
await p.evaluate(() => Produktwelten.lernen('schule'));
await p.waitForTimeout(700);
const knopf = await p.evaluate(() =>
  !!document.querySelector('.lernwelt button[data-lw-nav="stundenplan"]'));
pr('Der Stundenplan-Knopf zeigt auf die Ansicht, nicht auf eine Seite', knopf, '');
if (knopf) {
  await p.click('.lernwelt button[data-lw-nav="stundenplan"]');
  await p.waitForTimeout(700);
  pr('Ein Klick landet in der Stundenplan-Ansicht',
    await p.evaluate(() => document.querySelector('.produkt-welt.lernwelt')
      ?.getAttribute('data-lw-view') === 'stundenplan'),
    await p.evaluate(() => document.querySelector('.produkt-welt.lernwelt')
      ?.getAttribute('data-lw-view') || ''));
} else {
  pr('Ein Klick landet in der Stundenplan-Ansicht', false, 'Knopf fehlt');
}

pr('Keine Fehler auf der Seite', fehler.length === 0, fehler.join(' | '));
await b.close(); server.close();
console.log(`\n${ok} bestanden, ${weg} durchgefallen`);
process.exit(weg ? 1 : 0);
