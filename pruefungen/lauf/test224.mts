/* Suite 190 — Eine Prüfung zählt nur, was wirklich zu ihr gehört (L49)
 * ============================================================================
 * L49 hielt fest: „Die Zuordnung Prüfung → Karten ist reine Wortsuche und
 * fällt bei null Treffern auf ALLE Karten zurück."
 *
 * E136 hat daraufhin `nurPassendeKarten` NEBEN `passendeKarten` gestellt und
 * die Kachel „Prüfungsfokus" umgestellt. Drei weitere Stellen blieben:
 *
 *     Prüfungsliste       „Karten: 47" — der ganze Bestand
 *     Lernstand-Balken     rechnete denselben Bestand durch
 *     Simulation           zog stillschweigend aus allem
 *
 * Das ist keine Kleinigkeit. Wer sich auf „Elektrotechnik 2" vorbereitet und
 * dort „47 Karten, Lernstand 62 %" liest, glaubt, es gebe Stoff dazu. Es
 * gibt keinen — die Zahl gehört seiner Biologie-Sammlung.
 *
 * ─── WAS BLEIBT, UND WARUM ──────────────────────────────────────────────────
 * Der Rückfall selbst ist bei der SIMULATION richtig: eine Übungsklausur aus
 * allem ist besser als keine. Er steht jetzt an der Aufrufstelle und sagt
 * sich an — im Knopf und beim Starten. Der Unterschied ist nicht, dass etwas
 * weniger geht, sondern dass nichts mehr Falsches behauptet wird.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 * §4 ist die Gegenrichtung: eine Prüfung MIT eigenem Stoff muss ihre eigene
 * Zahl zeigen und darf sich NICHT ansagen. Wer stumpf überall 0 zurückgibt,
 * macht §4 rot. Die Gegenproben stehen in E162.
 *
 *   node pruefungen/lauf/test224.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8982;

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
const seite = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 140)));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForTimeout(2700);

/* Ein Bestand, in dem die Wortsuche NICHTS findet: die Karten handeln von
   Photosynthese, die eine Prüfung von Ohm. Und daneben eine zweite Prüfung,
   zu der es sehr wohl Karten gibt — sonst prüfte diese Suite nur die eine
   Richtung. */
const gebaut = await seite.evaluate(async () => {
  Store.setMeta('rundgangGesehen', true);
  document.getElementById('rg-willkommen')?.remove();
  document.querySelectorAll<HTMLElement>('.overlay, .produkt-onboarding-lage').forEach(o => o.remove());

  const bio = Store.addPage(null, { text: 'Photosynthese', icon: '🌿' });
  /* MIT LERNSTAND, und das ist kein Beiwerk. Ohne ihn stünde der Balken
     „Fachlicher Lernstand" in BEIDEN Fassungen auf 0 % — der Punkt unten
     wäre grün gewesen, auch ohne die Behebung. Mit `wdh: 2` zeigt die alte
     Fassung 66 % bei einer Prüfung, zu der keine dieser Karten gehört. */
  for (const frage of ['Lichtreaktion :: im Thylakoid', 'Calvin :: im Stroma'])
    Store.addBlock(bio.id, 'flashcard', { text: frage,
      sr: { ease: 2.5, intervall: 6, wdh: 2, faellig: '2030-01-01T00:00:00.000Z' } });

  const schule = Store.addPage(null, { text: 'Schule', icon: '🏫' });
  const { collectionId } = Store.addDatabase(schule.id, 'Prüfungen', {
    title:     { name: 'Prüfung',   type: 'title' },
    datum:     { name: 'Datum',     type: 'date' },
    lernstoff: { name: 'Lernstoff', type: 'text' },
    dauer:     { name: 'Dauer',     type: 'number' }
  }, 'table');
  const morgen = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const ohne = Store.addRow(collectionId, { title: 'Ohmsches Gesetz', datum: morgen,
    lernstoff: 'Widerstand und Spannung', dauer: 45 });
  Store.updateBlock(ohne.id, { text: 'Ohmsches Gesetz' });
  const mit = Store.addRow(collectionId, { title: 'Photosynthese Test', datum: morgen,
    lernstoff: 'Lichtreaktion und Calvin', dauer: 30 });
  Store.updateBlock(mit.id, { text: 'Photosynthese Test' });
  await Store.flush();

  Produktwelten.lernen('pruefungen');
  await new Promise(r => setTimeout(r, 1400));

  const karten = (typeof Learning !== 'undefined' && Learning.cards) ? Learning.cards().length : -1;
  const karteien = [...document.querySelectorAll<HTMLElement>('.lw-exam-list article')]
    .map(el => {
      const werte = [...el.querySelectorAll<HTMLElement>('dl div')].map(d => ({
        was: (d.querySelector('dt')?.textContent || '').trim(),
        wert: (d.querySelector('dd')?.textContent || '').trim()
      }));
      return {
        titel: (el.querySelector('h3')?.textContent || '').trim(),
        werte,
        stand: (el.querySelector('.lw-progress strong')?.textContent || '').trim(),
        knopf: (el.querySelector<HTMLElement>('[data-lw-simulate]')?.textContent || '').trim(),
        gesperrt: !!el.querySelector<HTMLButtonElement>('[data-lw-simulate]')?.disabled,
        id: el.querySelector<HTMLElement>('[data-lw-simulate]')?.dataset['lwSimulate'] || ''
      };
    });
  return { karten, karteien };
});

const ohneStoff = gebaut.karteien.find((x: any) => x.titel === 'Ohmsches Gesetz');
const mitStoff  = gebaut.karteien.find((x: any) => x.titel === 'Photosynthese Test');
const zahlVon = (k: any, was: string) => k?.werte.find((w: any) => w.was === was)?.wert;

/* ==========================================================================
 * §1 · Eine Prüfung ohne eigenen Stoff zählt null Karten
 * ========================================================================*/
console.log('\n1 · Eine Prüfung ohne eigenen Stoff zählt null');

p('Es gibt überhaupt Karten im Bestand', gebaut.karten >= 2, String(gebaut.karten));
p('Und beide Prüfungen stehen da', !!ohneStoff && !!mitStoff,
  gebaut.karteien.map((x: any) => x.titel).join(', '));
gleich('„Ohmsches Gesetz" zählt keine Karte', zahlVon(ohneStoff, 'Karten'), '0');
gleich('Und keine Fehler', zahlVon(ohneStoff, 'Fehler'), '0');
gleich('Der Lernstand ist 0 %', ohneStoff?.stand, '0 %');
/* Und der Balken der ANDEREN Prüfung ist es nicht — sonst wäre „0 %" oben
   nur die Aussage „hier ist nichts gelernt worden", und die stimmt auch
   ohne die Behebung. */
p('Während der Balken der anderen Prüfung steht',
  /^[1-9]/.test(String(mitStoff?.stand || '')), String(mitStoff?.stand));

/* ==========================================================================
 * §2 · Und der Knopf sagt, was er tun wird
 * --------------------------------------------------------------------------
 * Nicht sperren: eine Übungsklausur aus allem ist besser als keine. Aber
 * derselbe Knopftext wie bei einer Prüfung mit eigenem Stoff wäre eine
 * zweite Unwahrheit neben der Zahl.
 * ========================================================================*/
console.log('\n2 · Und der Knopf sagt, was er tun wird');

gleich('Er heisst „Simulation aus allen Karten"', ohneStoff?.knopf, 'Simulation aus allen Karten');
p('Und ist trotzdem bedienbar', ohneStoff?.gesperrt === false, String(ohneStoff?.gesperrt));

/* ==========================================================================
 * §3 · Beim Starten meldet sich die Simulation
 * ========================================================================*/
console.log('\n3 · Beim Starten meldet sich die Simulation');

const gestartet = await seite.evaluate(async (id: string) => {
  const balken = document.getElementById('toast');
  if (balken) { balken.textContent = ''; balken.classList.remove('show'); }
  document.querySelector<HTMLElement>(`[data-lw-simulate="${id}"]`)?.click();
  await new Promise(r => setTimeout(r, 700));
  return {
    meldung: (balken?.classList.contains('show') ? balken.textContent || '' : '').trim(),
    /* Die laufende Simulation zeichnet `.lw-simulation`. Die erste Fassung
       suchte `.lw-sim` und ein paar Wörter im Text — beides gibt es nicht
       so, und der Punkt wäre auch bei einer gar nicht startenden Simulation
       irgendwann grün geworden. Nachgesehen statt geraten. */
    laeuft: !!document.querySelector('.lw-simulation')
  };
}, ohneStoff?.id || '');

p('Sie sagt, dass keine Karte passt', /passt keine Karte/.test(gestartet.meldung),
  gestartet.meldung || '(nichts)');
p('Und nennt, woraus sie stattdessen zieht', /alle[nr]? \d+ Karten/.test(gestartet.meldung),
  gestartet.meldung);
p('Und läuft trotzdem', gestartet.laeuft);

/* ==========================================================================
 * §4 · Die Gegenrichtung: eine Prüfung MIT eigenem Stoff
 * --------------------------------------------------------------------------
 * Ohne diesen Abschnitt bestünde die Suite auch, wenn überall stumpf 0
 * zurückkäme — und das wäre kein Fortschritt, sondern der nächste Fehler.
 * ========================================================================*/
console.log('\n4 · Die Gegenrichtung: eine Prüfung mit eigenem Stoff');

gleich('„Photosynthese Test" zählt seine zwei Karten', zahlVon(mitStoff, 'Karten'), '2');
gleich('Der Knopf heisst dort schlicht „Simulation starten"',
  mitStoff?.knopf, 'Simulation starten');

const zweite = await seite.evaluate(async (id: string) => {
  Produktwelten.lernen('pruefungen');
  await new Promise(r => setTimeout(r, 900));
  const balken = document.getElementById('toast');
  if (balken) { balken.textContent = ''; balken.classList.remove('show'); }
  document.querySelector<HTMLElement>(`[data-lw-simulate="${id}"]`)?.click();
  await new Promise(r => setTimeout(r, 700));
  return (balken?.classList.contains('show') ? balken.textContent || '' : '').trim();
}, mitStoff?.id || '');

p('Und sie sagt sich NICHT an', !/passt keine Karte/.test(zweite), zweite || '(nichts)');

/* ==========================================================================
 * §5 · Ein Ergebnis überlebt den Reiterwechsel (L49, E163)
 * --------------------------------------------------------------------------
 * Bis zum 25. August lag ein Simulationsergebnis nur in
 * `zustand.simulation`. Ein Reiterwechsel setzte es auf null, und die
 * Bewertung von zwanzig Aufgaben war weg — ohne Warnung, ohne Wiederkehr.
 *
 * GEZÄHLT WIRD AUCH, WIE OFT geschrieben wurde. `fertig` wird an drei
 * Stellen erreicht (letzte Antwort, abgelaufene Zeit, Neuzeichnen einer
 * aufgebrauchten Simulation); ohne die Sperre stünde derselbe Durchgang
 * mehrfach im Verlauf und die Liste wäre nach zwei Simulationen voll.
 * ========================================================================*/
console.log('\n5 · Ein Ergebnis überlebt den Reiterwechsel');

const durchgelaufen = await seite.evaluate(async (id: string) => {
  Produktwelten.lernen('pruefungen');
  await new Promise(r => setTimeout(r, 900));
  document.querySelector<HTMLElement>(`[data-lw-simulate="${id}"]`)?.click();
  await new Promise(r => setTimeout(r, 600));

  /* Zwei Karten: einmal richtig, einmal falsch. */
  const antworten = ['right', 'wrong'];
  for (const wie of antworten) {
    document.querySelector<HTMLElement>('[data-lw-action="simulation-reveal"]')?.click();
    await new Promise(r => setTimeout(r, 250));
    document.querySelector<HTMLElement>(`[data-lw-sim-answer="${wie}"]`)?.click();
    await new Promise(r => setTimeout(r, 250));
  }
  const ergebnisSichtbar = !!document.querySelector('.lw-simulation-result');

  /* DREIMAL NEU ZEICHNEN, BEVOR es weitergeht. `simulationAbschliessen`
     wird bei jedem Zeichnen einer aufgebrauchten Simulation wieder
     aufgerufen. Ohne diese drei Zeilen prüfte „genau EIN Eintrag" gar
     nichts — die Funktion lief in dieser Prüfung nur ein einziges Mal, und
     der Punkt wäre auch ohne jede Doppelsperre grün gewesen. */
  for (let i = 0; i < 3; i++) {
    Lernwelt.aktualisieren();
    await new Promise(r => setTimeout(r, 200));
  }

  /* Weg und wieder hin — genau der Weg, auf dem es bisher verschwand. */
  Produktwelten.lernen('heute');
  await new Promise(r => setTimeout(r, 700));
  Produktwelten.lernen('pruefungen');
  await new Promise(r => setTimeout(r, 900));

  const verlauf = document.querySelector<HTMLElement>('.lw-sim-history');
  const zeilen = [...(verlauf?.querySelectorAll<HTMLElement>('li') || [])]
    .map(li => (li.textContent || '').replace(/\s+/g, ' ').trim());
  const nutzer = String(Store.getMeta('nutzer', '') || '');
  const abgelegt = Object.entries(Store.cache.meta || {})
    .filter(([k]) => /:simulationen$/.test(String(k)))
    .flatMap(([, v]: any) => Array.isArray(v?.wert) ? v.wert : Array.isArray(v) ? v : []);
  return { ergebnisSichtbar, zeilen, abgelegt, nutzer };
}, mitStoff?.id || '');

p('Die Simulation endet mit einem Ergebnis', durchgelaufen.ergebnisSichtbar);
p('Nach dem Reiterwechsel steht sie im Verlauf',
  durchgelaufen.zeilen.length >= 1, JSON.stringify(durchgelaufen.zeilen));
p('Mit Titel, Zahl und Quote',
  /Photosynthese Test/.test(durchgelaufen.zeilen[0] || '') &&
  /1 von 2 richtig/.test(durchgelaufen.zeilen[0] || '') &&
  /50 %/.test(durchgelaufen.zeilen[0] || ''), durchgelaufen.zeilen[0] || '(nichts)');
gleich('Und genau EIN Eintrag, nicht drei', durchgelaufen.abgelegt.length, 1);

/* ========================================================================*/
console.log(`\n${ok}/${ok + weg} bestanden`);
if (fehler.length) console.log('Browserfehler:\n  ' + fehler.join('\n  '));
p('Keine unbehandelten Browserfehler', fehler.length === 0, fehler.join(' | '));

await browser.close();
await new Promise<void>(f => { server.close(() => f()); });
process.exitCode = weg ? 1 : 0;
