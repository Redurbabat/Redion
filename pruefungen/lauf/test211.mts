/* Suite 177 — Elektrotechnik: Rechner und Lernpaket (§37, §38)
 * ============================================================================
 * Zwei Module, rund 500 Zeilen, seit ihrer Wiederbelebung ohne einen einzigen
 * Prüflauf und ohne ein einziges Bildschirmfoto:
 *
 *     src/core/electrical/calculations.ts     neun reine Rechnungen
 *     src/bereiche/wissen/electrical.ts       Dialog, Lernpaket, Einbau
 *
 * Genau diese Lage — „gebaut, aber nie laufen gesehen" — hatten auch E135
 * (sieben falsche Zahlen in der Lernwelt), E141 (17 von 21 Knöpfen ausserhalb
 * des Bildes) und E143 (die leere Wand vor vollen Regalen). Kein Vorwurf an
 * den Code; nur eine Feststellung darüber, was ungeprüft heisst.
 *
 * ─── WAS DIESE SUITE PRÜFT ──────────────────────────────────────────────────
 *   1. Die neun Rechnungen geben die richtigen Zahlen.
 *   2. Falsche Eingaben geben einen deutschen Satz, kein NaN.
 *   3. Die Annahmen stehen dabei — „kein cos φ" ist keine Fussnote.
 *   4. Der Dialog rechnet und legt das Ergebnis als NORMALEN Block ab (§52).
 *   5. Das Lernpaket wird geprüft, bevor es eingebaut wird.
 *   6. Eingebaut wird es als gewöhnliche Karteikarten, zweimal einbauen
 *      verdoppelt nichts, und Quarantäne bleibt draussen.
 *   7. Am Telefon passt der Dialog ins Bild.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 * Die Zahlen sind von Hand gerechnet und stehen als Erwartung im Text: 200 V,
 * 2300 W, 6 kWh, 1.50, 60 Ω, 5 Ω. Eine falsche Formel wird sofort sichtbar.
 * Für die Wege durch die Oberfläche stehen die Gegenproben beim Abschnitt.
 *
 *   node pruefungen/lauf/test211.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8970;

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
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll),
    `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

const browser = await chromium.launch();
const seite = await browser.newPage({ viewport: { width: 1300, height: 950 } });
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 140)));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForTimeout(2700);
await seite.evaluate(() => {
  Store.setMeta('rundgangGesehen', true);
  document.querySelector('.produkt-onboarding-lage')?.remove();
  document.querySelectorAll<HTMLElement>('.overlay').forEach(o => o.remove());
});

/* ==========================================================================
 * §1 · Die neun Rechnungen geben die richtigen Zahlen
 * ========================================================================*/
console.log('\n1 · Die neun Rechnungen geben die richtigen Zahlen');

const rechnen = await seite.evaluate(() => {
  const E = (globalThis as any).ElectricalCalculations;
  if (!E) return null;
  const nimm = (r: any) => ({ ok: !!r.ok, wert: r.value, einheit: r.unit, formel: r.formula });
  return {
    spannung: nimm(E.voltage(2, 100)),
    strom: nimm(E.current(230, 23)),
    widerstand: nimm(E.resistance(230, 10)),
    leistung: nimm(E.power(230, 10)),
    leistungAusStrom: nimm(E.powerFromCurrent(2, 50)),
    energie: nimm(E.energy(2000, 3)),
    kosten: nimm(E.cost(6, 0.25)),
    reihe: nimm(E.series('10, 20, 30')),
    parallel: nimm(E.parallel('10, 10'))
  };
});
p('Das Rechenmodul ist geladen', !!rechnen, 'ElectricalCalculations fehlt');
if (rechnen) {
  gleich('U = I · R → 2 A · 100 Ω = 200 V',
    [rechnen.spannung.wert, rechnen.spannung.einheit, rechnen.spannung.formel],
    [200, 'V', 'U = I · R']);
  gleich('I = U / R → 230 V / 23 Ω = 10 A',
    [rechnen.strom.wert, rechnen.strom.einheit], [10, 'A']);
  gleich('R = U / I → 230 V / 10 A = 23 Ω',
    [rechnen.widerstand.wert, rechnen.widerstand.einheit], [23, 'Ω']);
  gleich('P = U · I → 230 V · 10 A = 2300 W',
    [rechnen.leistung.wert, rechnen.leistung.einheit], [2300, 'W']);
  gleich('P = I² · R → 4 · 50 = 200 W',
    [rechnen.leistungAusStrom.wert, rechnen.leistungAusStrom.einheit], [200, 'W']);
  gleich('E = P · t / 1000 → 2000 W · 3 h = 6 kWh',
    [rechnen.energie.wert, rechnen.energie.einheit], [6, 'kWh']);
  gleich('Kosten = 6 kWh · 0.25 = 1.5',
    [rechnen.kosten.wert], [1.5]);
  gleich('Reihe: 10 + 20 + 30 = 60 Ω',
    [rechnen.reihe.wert, rechnen.reihe.einheit], [60, 'Ω']);
  gleich('Parallel: 10 ∥ 10 = 5 Ω',
    [rechnen.parallel.wert, rechnen.parallel.einheit], [5, 'Ω']);
}

/* ==========================================================================
 * §2 · Falsche Eingaben geben einen Satz, kein NaN
 * --------------------------------------------------------------------------
 * Eine Rechnung, die bei Unsinn `NaN` zurückgibt, schreibt das später in
 * einen Block — und dort steht es dann für immer.
 * ========================================================================*/
console.log('\n2 · Falsche Eingaben geben einen Satz, kein NaN');

const falsch = await seite.evaluate(() => {
  const E = (globalThis as any).ElectricalCalculations;
  const satz = (r: any) => (r.ok ? '(gerechnet: ' + r.value + ')' : String(r.error || ''));
  return {
    durchNull: satz(E.current(230, 0)),
    negativ: satz(E.voltage(-1, 100)),
    text: satz(E.power('viel', 10)),
    leereListe: satz(E.series('')),
    buchstaben: satz(E.parallel('a, b')),
    zuViele: satz(E.series(Array.from({ length: 201 }, () => 1).join(',')))
  };
});
p('Teilen durch null wird abgefangen',
  /grösser als null/.test(falsch.durchNull), falsch.durchNull);
p('Ein negativer Strom auch',
  /nicht negativ/.test(falsch.negativ), falsch.negativ);
p('Text statt Zahl auch',
  /endliche Zahl/.test(falsch.text), falsch.text);
p('Eine leere Liste auch',
  /positive Zahlen/.test(falsch.leereListe), falsch.leereListe);
p('Buchstaben in der Liste auch',
  /positive Zahlen/.test(falsch.buchstaben), falsch.buchstaben);
p('Und 201 Werte werden abgewiesen',
  /Höchstens 200/.test(falsch.zuViele), falsch.zuViele);
p('Keine dieser Antworten enthält NaN',
  !Object.values(falsch).some(text => /NaN/.test(text)),
  JSON.stringify(falsch));

/* ==========================================================================
 * §3 · Die Annahmen stehen dabei
 * --------------------------------------------------------------------------
 * §37 des Auftrags verlangt Quellenwahrheit. Bei einer Leistungsformel ohne
 * cos φ ist die Annahme Teil des Ergebnisses, nicht eine Fussnote.
 * ========================================================================*/
console.log('\n3 · Die Annahmen stehen dabei');

const annahmen = await seite.evaluate(() => {
  const E = (globalThis as any).ElectricalCalculations;
  return {
    leistung: (E.power(230, 10).assumptions || []).join(' '),
    kosten: (E.cost(6, 0.25).assumptions || []).join(' '),
    spannung: (E.voltage(2, 100).assumptions || []).length
  };
});
p('Die Leistung sagt, dass kein cos φ darin steckt',
  /cos φ/.test(annahmen.leistung), annahmen.leistung);
p('Die Kosten sagen, dass Grundgebühren fehlen',
  /Grundgebühr/.test(annahmen.kosten), annahmen.kosten);
gleich('Und wo nichts anzunehmen ist, steht auch nichts', annahmen.spannung, 0);

/* ==========================================================================
 * §4 · Der Dialog rechnet und legt einen normalen Block ab
 * --------------------------------------------------------------------------
 * §52 verbietet eine zweite Datenhaltung. Das Ergebnis ist deshalb ein
 * `equation`-Block auf einer gewöhnlichen Seite — kein Rechnerspeicher.
 *
 * Gegenprobe: ohne den Zweig `insert` entsteht kein Block; gemessen blieb
 * die Kinderzahl der Seite bei 0.
 * ========================================================================*/
console.log('\n4 · Der Dialog rechnet und legt einen normalen Block ab');

const durchDenDialog = await seite.evaluate(async () => {
  const s = Store.addPage(null, { text: 'Elektro-Notizen', icon: '⚡' });
  App.oeffne(s.id);
  await new Promise(r => setTimeout(r, 500));
  (globalThis as any).Electrical.open();
  await new Promise(r => setTimeout(r, 400));
  const dialog = document.querySelector('.electrical-dialog') as HTMLElement | null;
  if (!dialog) return null;
  const wahl = dialog.querySelector('select') as HTMLSelectElement;
  const modi = [...wahl.options].map(o => o.textContent || '');
  /* Leistung wählen und rechnen — dieselben Zahlen wie in §1. */
  const leistung = [...wahl.options].findIndex(o => /Leistung/.test(o.textContent || ''));
  wahl.selectedIndex = Math.max(0, leistung);
  wahl.dispatchEvent(new Event('change'));
  await new Promise(r => setTimeout(r, 200));
  dialog.querySelectorAll<HTMLInputElement>('input[data-field]').forEach((feld, i) => {
    feld.value = i === 0 ? '230' : '10';
  });
  (dialog.querySelector('[data-action="calculate"]') as HTMLElement | null)?.click();
  await new Promise(r => setTimeout(r, 200));
  const ausgabe = (dialog.querySelector('.electrical-output')?.textContent || '').replace(/\s+/g, ' ').trim();
  (dialog.querySelector('[data-action="insert"]') as HTMLElement | null)?.click();
  await new Promise(r => setTimeout(r, 600));
  const kinder = Store.childrenOf(s.id);
  return {
    modi, ausgabe,
    arten: kinder.map((b: any) => b.type),
    texte: kinder.map((b: any) => String(b.text || '')),
    rechnung: kinder.find((b: any) => b.electricalCalculation)?.electricalCalculation || null,
    dialogWeg: !document.querySelector('.electrical-dialog')
  };
});
p('Der Dialog öffnet sich', !!durchDenDialog, 'keine .electrical-dialog');
if (durchDenDialog) {
  p('Er bietet mehrere Rechnungen an', durchDenDialog.modi.length >= 6,
    durchDenDialog.modi.join(' | '));
  /* `2’300 W`, NICHT `2300 W`. Die Ausgabe geht durch `Intl.NumberFormat`
     mit `de-CH`, und die Schweiz trennt Tausender mit einem hohen Komma
     (U+2019). Meine erste Erwartung war `/2300/` und wurde rot — an einer
     Stelle, an der das Produkt genau richtig ist. */
  p('Die Ausgabe nennt Zahl und Formel',
    /2.?300 W/.test(durchDenDialog.ausgabe) && /P = U · I/.test(durchDenDialog.ausgabe),
    durchDenDialog.ausgabe);
  p('Auf der Seite steht ein Formelblock',
    durchDenDialog.arten.includes('equation'), durchDenDialog.arten.join(', '));
  const texte: string[] = durchDenDialog.texte as string[];
  p('Und darin die Rechnung im Klartext',
    texte.some(zeile => /P = U · I = 2.?300 W/.test(zeile)), texte.join(' | '));
  p('Die Annahme steht als eigener Hinweis dabei',
    durchDenDialog.arten.includes('callout') && texte.some(zeile => /cos φ/.test(zeile)),
    texte.join(' | '));
  p('Der Block trägt die Rechnung auch als Daten',
    durchDenDialog.rechnung?.formula === 'P = U · I' &&
    durchDenDialog.rechnung?.value === 2300,
    JSON.stringify(durchDenDialog.rechnung));
  p('Und der Dialog schliesst sich danach', durchDenDialog.dialogWeg);
}

/* ==========================================================================
 * §5 · Das Lernpaket wird geprüft, bevor es eingebaut wird
 * --------------------------------------------------------------------------
 * Ein Lernpaket ist eine fremde Datei. §40 der Projektregeln verlangt
 * Eingabeprüfung; hier ist sie der einzige Schutz zwischen einer JSON-Datei
 * und dem eigenen Kartenbestand.
 * ========================================================================*/
console.log('\n5 · Das Lernpaket wird geprüft, bevor es eingebaut wird');

const abgelehnt = await seite.evaluate(() => {
  const E = (globalThis as any).Electrical;
  const gut = {
    schema: 'redion.learning-package/v1',
    manifest: { id: 'probe-paket', version: '1.0.0', title: 'Probe', language: 'de',
      license: 'CC BY 4.0', licenseStatus: 'cleared', provenanceStatus: 'verified',
      source: 'Probe', region: null, created: '2026-08-24' },
    questions: [{ id: 'f1', topic: 'Ohm', question: 'U bei 2 A und 100 Ω?',
      options: ['200 V', '50 V'], correct: 0, explanation: 'U = I · R',
      difficulty: 1, region: 'all', norm: null, source: { title: 'Probe' } }],
    quarantine: []
  };
  const fehlerVon = (aenderung: (roh: any) => any): string => {
    const kopie = JSON.parse(JSON.stringify(gut));
    try { E.validatePackage(aenderung(kopie)); return '(angenommen)'; }
    catch (e) { return e instanceof Error ? e.message : String(e); }
  };
  return {
    gut: (() => { try { E.validatePackage(gut); return 'ok'; }
                  catch (e) { return e instanceof Error ? e.message : String(e); } })(),
    schema: fehlerVon(r => { r.schema = 'irgendwas'; return r; }),
    ohneLizenz: fehlerVon(r => { r.manifest.license = ''; return r; }),
    kennung: fehlerVon(r => { r.manifest.id = '!!'; return r; }),
    version: fehlerVon(r => { r.manifest.version = 'eins'; return r; }),
    eineAntwort: fehlerVon(r => { r.questions[0].options = ['nur eine']; r.questions[0].correct = 0; return r; }),
    ohneQuelle: fehlerVon(r => { delete r.questions[0].source; return r; }),
    doppelteId: fehlerVon(r => { r.questions.push({ ...r.questions[0] }); return r; })
  };
});
gleich('Ein sauberes Paket wird angenommen', abgelehnt.gut, 'ok');
p('Ein fremdes Schema wird abgelehnt', /Schema/.test(abgelehnt.schema), abgelehnt.schema);
p('Ein Paket ohne Lizenz auch', /Lizenz/.test(abgelehnt.ohneLizenz), abgelehnt.ohneLizenz);
p('Eine unmögliche Kennung auch', /Paket-ID/.test(abgelehnt.kennung), abgelehnt.kennung);
p('Eine Version, die keine ist, auch', /Paketversion/.test(abgelehnt.version), abgelehnt.version);
p('Eine Frage mit nur einer Antwort auch', /Antworten/.test(abgelehnt.eineAntwort), abgelehnt.eineAntwort);
p('Eine Frage ohne Quelle auch', /Quelle/.test(abgelehnt.ohneQuelle), abgelehnt.ohneQuelle);
p('Und zwei Fragen mit derselben Kennung auch',
  /eindeutige/.test(abgelehnt.doppelteId), abgelehnt.doppelteId);

/* ==========================================================================
 * §6 · Eingebaut wird als gewöhnliche Karteikarte
 * --------------------------------------------------------------------------
 * §52 wieder: keine zweite Datenhaltung. Eine Paketfrage wird ein
 * `flashcard`-Block wie jede andere Karte — sie lernt mit, sie sichert mit,
 * sie exportiert mit.
 * ========================================================================*/
console.log('\n6 · Eingebaut wird als gewöhnliche Karteikarte');

const eingebaut = await seite.evaluate(async () => {
  const E = (globalThis as any).Electrical;
  const paket = {
    schema: 'redion.learning-package/v1',
    manifest: { id: 'probe-einbau', version: '2.1.0', title: 'Einbauprobe', language: 'de',
      license: 'CC BY 4.0', licenseStatus: 'cleared', provenanceStatus: 'verified',
      source: 'Probe', region: null, created: '2026-08-24' },
    questions: [
      { id: 'e1', topic: 'Ohm', question: 'Wie gross ist U bei 2 A und 100 Ω?',
        options: ['200 V', '50 V'], correct: 0, explanation: 'U = I · R',
        difficulty: 1, region: 'all', norm: null, source: { title: 'Probe' } },
      { id: 'e2', topic: 'Leistung', question: 'Wie gross ist P bei 230 V und 10 A?',
        options: ['2300 W', '23 W'], correct: 0, explanation: 'P = U · I',
        difficulty: 2, region: 'all', norm: null, source: { title: 'Probe' } }
    ],
    quarantine: [
      { id: 'q1', topic: 'Norm', question: 'Etwas Normatives',
        options: ['a', 'b'], correct: 0, explanation: '', difficulty: 1,
        region: 'ch', norm: 'NIN', source: { title: 'Roh' },
        quarantine: { status: 'quarantined', reasonCodes: ['norm'] } }
    ]
  };
  const vorher = Object.values<any>(Store.cache.blocks)
    .filter((b: any) => b?.type === 'flashcard' && b.alive !== false).length;
  const erst = E.installPackage(paket);
  await new Promise(r => setTimeout(r, 500));
  const zweit = E.installPackage(paket);
  await new Promise(r => setTimeout(r, 500));
  const karten = Object.values<any>(Store.cache.blocks)
    .filter((b: any) => b?.type === 'flashcard' && b.alive !== false);
  const ausPaket = karten.filter((b: any) => b.learningPackage?.packageId === 'probe-einbau');
  return {
    vorher, erst, zweit,
    ausPaket: ausPaket.length,
    texte: ausPaket.map((b: any) => String(b.text || '')),
    schluessel: ausPaket.map((b: any) => String(b.learningPackage?.key || '')),
    quarantaeneEingebaut: karten.filter((b: any) => /Etwas Normatives/.test(String(b.text || ''))).length,
    seite: Object.values<any>(Store.cache.blocks)
      .filter((b: any) => b?.learningPackagePage).length
  };
});
gleich('Zwei Fragen werden eingebaut', eingebaut.erst.added, 2);
gleich('Die Quarantäne wird gezählt, nicht eingebaut', eingebaut.erst.quarantined, 1);
gleich('Und wirklich nicht eingebaut', eingebaut.quarantaeneEingebaut, 0);
gleich('Beim zweiten Mal kommt nichts dazu', eingebaut.zweit.added, 0);
gleich('… sie werden übersprungen', eingebaut.zweit.skipped, 2);
gleich('Es sind zwei Karten aus dem Paket', eingebaut.ausPaket, 2);
p('Sie stehen als Frage :: Antwort da',
  eingebaut.texte.every(t => t.includes(' :: ')), eingebaut.texte.join(' | '));
p('Die Antwort enthält die Erklärung',
  eingebaut.texte.some(t => /200 V — U = I · R/.test(t)), eingebaut.texte.join(' | '));
p('Jede trägt ihren Paketschlüssel mit Fassung',
  eingebaut.schluessel.every(k => k.startsWith('probe-einbau@2.1.0:')),
  eingebaut.schluessel.join(' | '));
p('Und es gibt genau eine Lernpaketseite', eingebaut.seite === 1, `${eingebaut.seite}`);

/* ==========================================================================
 * §7 · Am Telefon passt der Dialog ins Bild
 * ========================================================================*/
console.log('\n7 · Am Telefon passt der Dialog ins Bild');

const handy = await browser.newPage({
  viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3
});
handy.on('pageerror', e => fehler.push('PAGEERROR (Telefon): ' + e.message.slice(0, 140)));
await handy.goto(`http://localhost:${PORT}/index.html`);
await handy.waitForTimeout(2700);
const amHandy = await handy.evaluate(async () => {
  Store.setMeta('rundgangGesehen', true);
  document.querySelectorAll<HTMLElement>('.overlay').forEach(o => o.remove());
  (globalThis as any).Electrical.open();
  await new Promise(r => setTimeout(r, 500));
  const dialog = document.querySelector('.electrical-dialog') as HTMLElement | null;
  if (!dialog) return null;
  const kasten = dialog.getBoundingClientRect();
  const knoepfe = [...dialog.querySelectorAll<HTMLElement>('button')];
  return {
    links: Math.round(kasten.left), rechts: Math.round(kasten.right),
    breit: Math.round(kasten.width),
    knoepfeRaus: knoepfe.filter(k => k.getBoundingClientRect().right > innerWidth + 1).length,
    zuFlach: knoepfe.filter(k => k.getBoundingClientRect().height < 40).length,
    ueberlauf: document.documentElement.scrollWidth - innerWidth
  };
});
p('Der Dialog öffnet sich auch am Telefon', !!amHandy);
if (amHandy) {
  p('Er steht innerhalb des Bildes',
    amHandy.links >= -1 && amHandy.rechts <= 391, JSON.stringify(amHandy));
  gleich('Kein Knopf ragt hinaus', amHandy.knoepfeRaus, 0);
  p('Und die Seite läuft nicht seitlich über', amHandy.ueberlauf <= 1, `${amHandy.ueberlauf} px`);
}

/* ========================================================================*/
console.log(`\n${ok}/${ok + weg} bestanden`);
if (fehler.length) console.log('Browserfehler:\n  ' + fehler.join('\n  '));
p('Keine unbehandelten Browserfehler', fehler.length === 0, fehler.join(' | '));

await browser.close();
await new Promise<void>(f => { server.close(() => f()); });
process.exitCode = weg ? 1 : 0;
