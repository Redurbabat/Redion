/* Suite 249 — Die Notenübersicht (E241)
 * ============================================================================
 * Redur: „es sollte meine Schule alles begleiten, Noten, Lernen, Lernziele."
 * Die Schulvorlage legte das Notenheft seit E139 an — gerechnet hat damit
 * niemand. Diese Suite prüft die Rechnung, nicht die Deko:
 *
 * §1 SCHNITT UND ZEUGNIS. Gewichtetes Mittel exakt; Zeugnisnote auf halbe
 *    Noten (4.875 → 5.0). Handrechnung im Test, nicht abgeschrieben.
 * §2 DER PUNKTEWEG. Eine Zeile ohne Note, aber mit 21 von 30 Punkten, ist
 *    eine 4.5 — und ein LEERES Notenfeld darf nicht als 0 herausfallen
 *    (Number(null) ist 0; genau daran scheiterte der erste Wurf).
 * §3 DER ZIELRECHNER. n = 4·(G+1) − S, mit den drei Aussagen sicher /
 *    erreichbar / nicht mehr erreichbar — jede einzeln.
 * §4 TIPPFEHLER FALLEN HERAUS, still den Schnitt heben dürfen sie nicht.
 * §5 EIN SEMESTER IST KEIN TOPF (E242/L71): Vorgabe „Dieses Semester",
 *    eine alte 6.0 hebt den Schnitt nicht; „Letztes Semester" und „Alle"
 *    schalten um, Undatiertes zählt zum aktuellen und die Kopfzeile sagt es.
 * §6 DIE LEERFÄLLE führen wohin (§47): ohne Heft zur Vorlage, mit leerem
 *    Heft zum Heft.
 * ==========================================================================*/
import _pfad from 'node:path';
const WURZEL = _pfad.resolve(import.meta.dirname, '../..');
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const PORT = 8834;
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

console.log('\n1 · Leerfall ohne Heft: der Weg führt zur Vorlage');
await p.evaluate(() => Produktwelten.lernen('noten'));
await p.waitForTimeout(700);
const leer1 = await p.evaluate(() => ({
  titel: (document.querySelector('.lw-grades .lw-empty h3, .lw-grades h3')?.textContent || '').trim(),
  aktion: document.querySelector('.lw-grades [data-lw-action]')?.getAttribute('data-lw-action') || ''
}));
pr('Ohne Notenheft steht die Einladung zur Schulvorlage',
  /kein Notenheft/i.test(leer1.titel) && leer1.aktion === 'school-install',
  JSON.stringify(leer1));

console.log('\n2 · Mit Heft und Noten: die Rechnung stimmt mit der Hand überein');
await p.evaluate(() => {
  const seite = Store.addBlock(null, 'page');
  Store.updateBlock(seite.id, { text: 'Schule', icon: '🎓' });
  Store.addDatabase(seite.id, 'Noten', {
    title: { name: 'Leistung', type: 'title' },
    d1: { name: 'Datum', type: 'date' },
    f1: { name: 'Fach', type: 'text' },
    p1: { name: 'Punkte', type: 'number' },
    m1: { name: 'Maximum', type: 'number' },
    n1: { name: 'Note (eigene Skala)', type: 'number' },
    g1: { name: 'Gewichtung', type: 'number' },
    r1: { name: 'Rückmeldung', type: 'text' }
  });
  const c = Object.values<any>(Store.cache.collections).find(x => x.name === 'Noten')!;
  (globalThis as any).__notenC = c.id;
  const rein = (titel: string, fach: string, note: number | null, gewicht: number,
                punkte: number | null, max: number | null) => {
    const z = Store.addBlock(c.id, 'page');
    Store.updateBlock(z.id, { text: titel, parentTable: 'collection',
      props: { f1: fach, n1: note, g1: gewicht, p1: punkte, m1: max } });
  };
  /* Elektrotechnik: 5.5×2 + 4.0×1 + Punkteweg 21/30→4.5×1
     → S=19.5, G=4, Schnitt 4.875, Zeugnis 5.0. */
  rein('Ohmsches Gesetz', 'Elektrotechnik', 5.5, 2, null, null);
  rein('Leistung', 'Elektrotechnik', 4.0, 1, null, null);
  rein('VDE', 'Elektrotechnik', null, 1, 21, 30);
  /* Mathematik: 3.0×2 + 3.5×1 → S=9.5, G=3, Schnitt 3.1667 → „3.17",
     Zeugnis 3.0. Ziel: 4·4 − 9.5 = 6.5 → nicht mehr erreichbar. */
  rein('Algebra', 'Mathematik', 3.0, 2, null, null);
  rein('Geometrie', 'Mathematik', 3.5, 1, null, null);
  /* Deutsch: 6.0×1 → Ziel 4·2 − 6 = 2 unter Bereich… nein: 2.0 ist eine
     gültige Note. „Sicher" verlangt noetig ≤ 1: 4·2−6=2 > 1. Für den
     Sicher-Fall braucht es mehr Polster: zwei Sechser → 4·3−12 = 0. */
  rein('Aufsatz', 'Deutsch', 6.0, 1, null, null);
  rein('Vortrag', 'Deutsch', 6.0, 1, null, null);
  /* Physik: eine 3.5×1 → nötig = 4·2 − 3.5 = 4.5 — der Mittelfall.
     Der erste Wurf wollte ihn an Elektrotechnik prüfen und rechnete
     falsch: dort ist nötig 4·5 − 19.5 = 0.5, also „sicher". Die Prüfung
     lag daneben, nicht die Ansicht — der Fall brauchte ein eigenes Fach. */
  rein('Optik', 'Physik', 3.5, 1, null, null);
  /* Und ein Tippfehler: die „45" darf NICHT mitrechnen. */
  rein('Tippfehler', 'Mathematik', 45, 1, null, null);
  Produktwelten.lernen('noten');
});
await p.waitForTimeout(900);

const karte = await p.evaluate(() => ({
  kopf: (document.querySelector('.lw-grades h2')?.textContent || '').trim(),
  satz: (document.querySelector('.lw-grades .lw-page-head span')?.textContent || '').trim(),
  faecher: [...document.querySelectorAll<HTMLElement>('.lw-grade-fach')].map(f => ({
    fach: (f.querySelector('h3')?.textContent || '').trim(),
    schnitt: (f.querySelector('header strong')?.textContent || '').trim(),
    zeugnis: (f.querySelector('.lw-grade-zeugnis')?.textContent || '').trim(),
    ziel: (f.querySelector('.lw-grade-ziel')?.textContent || '').trim(),
    rot: f.classList.contains('ist-ungenuegend'),
    balken: f.querySelectorAll('.lw-grade-balken i').length
  }))
}));
console.log('   ' + JSON.stringify(karte.faecher));

const et = karte.faecher.find(f => f.fach === 'Elektrotechnik');
const ma = karte.faecher.find(f => f.fach === 'Mathematik');
const de = karte.faecher.find(f => f.fach === 'Deutsch');
pr('Elektrotechnik: gewichteter Schnitt 4.88 aus 5.5×2, 4.0 und dem Punkteweg',
  !!et && et.schnitt === '4.88' && /3 Noten/.test(et.zeugnis), JSON.stringify(et));
pr('… und die Zeugnisnote rundet 4.875 auf 5.0',
  !!et && /Zeugnisnote 5\.0/.test(et.zeugnis), et?.zeugnis || '');
pr('Der Punkteweg zählt: drei Balken, nicht zwei',
  !!et && et.balken === 3, String(et?.balken));
pr('Mathematik: 3.17 im Schnitt, Zeugnis 3.0, als ungenügend gekennzeichnet',
  !!ma && ma.schnitt === '3.17' && /Zeugnisnote 3\.0/.test(ma.zeugnis) && ma.rot === true,
  JSON.stringify(ma));

console.log('\n3 · Der Zielrechner sagt alle drei Sätze');
pr('„nicht mehr erreichbar" bei Mathematik (nötig wäre 6.5)',
  !!ma && /nicht mehr zu erreichen/.test(ma.ziel), ma?.ziel || '');
pr('„sicher" bei Deutsch (zwei Sechser)',
  !!de && /sicher/.test(de.ziel), de?.ziel || '');
const ph = karte.faecher.find(f => f.fach === 'Physik');
pr('„mindestens eine 4.5" bei Physik (eine 3.5, Gewicht 1)',
  !!ph && /mindestens eine 4\.5/.test(ph.ziel), ph?.ziel || '');

console.log('\n4 · Der Tippfehler rechnet nicht mit');
/* Stünde die 45 im Schnitt, wäre Mathematik 13.6 — der Punkt oben wäre
   schon rot. Hier steht die Gegenrichtung: sie fehlt auch in den Balken. */
pr('Die „45" steht nicht in den Balken', !!ma && ma.balken === 2, String(ma?.balken));

console.log('\n5 · Ein Semester ist kein Topf für alle (E242/L71)');
/* Chemie bekommt zwei datierte Noten: eine 6.0 vor einem halben Jahr —
   ein halbes Jahr zurück liegt IMMER im Nachbarsemester, weil die
   Semester an Feb/Aug ausgerichtete Sechsmonatsblöcke sind — und eine
   4.0 von heute. Unter der Vorgabe „Dieses Semester" darf die alte 6.0
   den Schnitt nicht heben: stünde hier 5.00, wäre L71 zurück. */
await p.evaluate(() => {
  const c = Store.getCollection((globalThis as any).__notenC);
  const heute = new Date();
  const halbesJahrZurueck = new Date();
  halbesJahrZurueck.setMonth(halbesJahrZurueck.getMonth() - 6);
  const rein = (titel: string, note: number, wann: Date) => {
    const z = Store.addBlock(c.id, 'page');
    Store.updateBlock(z.id, { text: titel, parentTable: 'collection',
      props: { f1: 'Chemie', n1: note, g1: 1, d1: wann.toISOString().slice(0, 10) } });
  };
  rein('Säuren (altes Semester)', 6.0, halbesJahrZurueck);
  rein('Basen (dieses Semester)', 4.0, heute);
  Produktwelten.lernen('noten');
});
await p.waitForTimeout(900);

const stand = (fach: string) => p.evaluate((f) => {
  const karteVon = [...document.querySelectorAll<HTMLElement>('.lw-grade-fach')]
    .find(k => (k.querySelector('h3')?.textContent || '').trim() === f);
  return {
    da: !!karteVon,
    schnitt: (karteVon?.querySelector('header strong')?.textContent || '').trim(),
    zeugnis: (karteVon?.querySelector('.lw-grade-zeugnis')?.textContent || '').trim(),
    faecher: document.querySelectorAll('.lw-grade-fach').length,
    chips: [...document.querySelectorAll<HTMLElement>('.lw-grade-zeitraeume button')]
      .map(k => ({ wert: k.dataset.lwZeitraum || '', aktiv: k.getAttribute('aria-pressed') === 'true' })),
    kopf: (document.querySelector('.lw-grades h2')?.textContent || '').trim(),
    satz: (document.querySelector('.lw-grades .lw-page-head span')?.textContent || '').trim()
  };
}, fach);

let s6 = await stand('Chemie');
pr('Drei Zeitraum-Knöpfe, „Dieses Semester" ist die Vorgabe',
  s6.chips.length === 3 && s6.chips.find(c2 => c2.wert === 'aktuell')?.aktiv === true,
  JSON.stringify(s6.chips));
pr('Die alte 6.0 hebt den Chemie-Schnitt NICHT: 4.00 aus einer Note',
  s6.da && s6.schnitt === '4.00' && /1 Note\b/.test(s6.zeugnis),
  JSON.stringify({ schnitt: s6.schnitt, zeugnis: s6.zeugnis }));
pr('Die Kopfzeile sagt, dass undatierte Noten zu diesem Semester zählen',
  /ohne Datum, zählen zu diesem Semester/.test(s6.satz), s6.satz);

await p.click('.lw-grade-zeitraeume button[data-lw-zeitraum="vorher"]');
await p.waitForTimeout(600);
s6 = await stand('Chemie');
pr('„Letztes Semester": nur die alte 6.0, und nur ein Fach — Undatiertes gehört nicht hierher',
  s6.da && s6.schnitt === '6.00' && s6.faecher === 1,
  JSON.stringify({ schnitt: s6.schnitt, faecher: s6.faecher }));

await p.click('.lw-grade-zeitraeume button[data-lw-zeitraum="alle"]');
await p.waitForTimeout(600);
s6 = await stand('Chemie');
pr('„Alle": beide Noten mitteln zu 5.00, und die Überschrift nennt es „über alle Semester"',
  s6.da && s6.schnitt === '5.00' && /über alle Semester/.test(s6.kopf),
  JSON.stringify({ schnitt: s6.schnitt, kopf: s6.kopf }));

console.log('\n6 · Leerfall mit leerem Heft: der Weg führt zum Heft');
await p.evaluate(() => {
  const c = Store.getCollection((globalThis as any).__notenC);
  Store.rowsOf(c.id).forEach((row: any) => Store.updateBlock(row.id, { alive: false }));
  Produktwelten.lernen('noten');
});
await p.waitForTimeout(700);
const leer2 = await p.evaluate(() => ({
  titel: (document.querySelector('.lw-grades h3')?.textContent || '').trim(),
  aktion: document.querySelector('.lw-grades [data-lw-action]')?.getAttribute('data-lw-action') || ''
}));
pr('Mit leerem Heft führt der Knopf zum Notenheft',
  /keine Noten/i.test(leer2.titel) && leer2.aktion === 'grades-open', JSON.stringify(leer2));
/* Und der Knopf tut es wirklich — die Krume wechselt auf die Schulseite. */
await p.click('.lw-grades [data-lw-action="grades-open"]');
await p.waitForTimeout(800);
pr('„Notenheft öffnen" öffnet die Seite mit dem Heft',
  await p.evaluate(() => /Schule/.test(document.getElementById('crumb')?.textContent || '')),
  await p.evaluate(() => (document.getElementById('crumb')?.textContent || '').trim()));

pr('Keine Fehler auf der Seite', fehler.length === 0, fehler.join(' | '));
await b.close(); server.close();
console.log(`\n${ok} bestanden, ${weg} durchgefallen`);
process.exit(weg ? 1 : 0);
