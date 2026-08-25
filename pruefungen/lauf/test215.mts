/* Suite 181 — Lernpfad und Arbeitssicht (§9 und §14)
 * ============================================================================
 * Zwei Ansichten, die seit langem stehen und die nichts festgehalten hat.
 * `doku/AUFTRAG-STAND.md` führte beide als ◐ mit derselben Begründung:
 * „Kein eigener Prüflauf".
 *
 * §9 verlangt einen Pfad mit Stufen — und drei Sätze, die wichtiger sind als
 * das Aussehen:
 *
 *     keine künstliche harte Sperre
 *     alle Themen grundsätzlich erreichbar
 *     fachlicher Fortschritt getrennt von XP
 *
 * Der dritte ist der, der leicht kaputtgeht: eine Zahl, die aus Aktivität
 * kommt, sieht aus wie Wissen und ist keines. §3 unten misst genau das —
 * XP hochsetzen und nachsehen, ob der Themenfortschritt sich rührt.
 *
 * §14 verlangt eine Arbeitssicht über Projekte, Aufgaben, Meetings, Termine,
 * Dokumente, PDFs, Wissensbasis und Entscheidungen — und ausdrücklich:
 * „Meetingdaten aus dem bestehenden Besprechungssystem wiederverwenden."
 * §6 prüft das an der Kennung: dieselbe Seite, keine Kopie.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 * Die Gegenproben stehen bei den Abschnitten und sind einzeln auf einem
 * Abzug des Baums zurückgenommen worden. §1 prüft ausserdem gegen den
 * leeren Bestand: ohne Karten muss der Pfad das SAGEN und nicht etwas
 * erfinden.
 *
 *   node pruefungen/lauf/test215.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8974;

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
await seite.evaluate(() => {
  Store.setMeta('rundgangGesehen', true);
  document.getElementById('rg-willkommen')?.remove();
  document.querySelectorAll<HTMLElement>('.overlay, .produkt-onboarding-lage').forEach(o => o.remove());
});

const zeige = async (ansicht: string): Promise<void> => {
  await seite.evaluate((a: string) => { (globalThis as any).Produktwelten.lernen(a); }, ansicht);
  await seite.waitForTimeout(750);
};

/* ==========================================================================
 * §1 · Ohne Karten sagt der Pfad es, statt etwas zu erfinden
 * --------------------------------------------------------------------------
 * Steht zuerst, weil es die Gegenrichtung für alles Folgende ist. Ein Pfad,
 * der immer Stufen zeigt, würde §2 trivial grün machen.
 * ========================================================================*/
console.log('\n1 · Ohne Karten sagt der Pfad es');

const leer = await seite.evaluate(async () => {
  /* Der Bestand kann aus dem Rundgang Karten mitbringen — die kommen weg,
     sonst prüft dieser Abschnitt einen vollen Pfad. */
  Object.values<any>(Store.cache.blocks)
    .filter(b => b?.type === 'flashcard')
    .forEach(b => { Store.trashBlock(b.id); Store.purgeBlock(b.id); });
  await Store.flush();
  return Object.values<any>(Store.cache.blocks).filter(b => b?.type === 'flashcard' && b.alive !== false).length;
});
gleich('Es gibt wirklich keine Karte mehr', leer, 0);
await zeige('lernweg');
const leerText = await seite.evaluate(() =>
  (document.querySelector('.lw-path-page')?.textContent || '').replace(/\s+/g, ' ').trim());
p('Der Pfad steht trotzdem da', !!leerText, leerText.slice(0, 60));
p('Und sagt, dass er leer ist', /noch leer/i.test(leerText), leerText.slice(0, 140));
gleich('Ohne erfundene Stufen',
  await seite.evaluate(() => document.querySelectorAll('.lw-path li').length), 0);

/* ==========================================================================
 * §2 · Der Pfad ordnet den Stoff — in der Reihenfolge aus §9
 * --------------------------------------------------------------------------
 * Angelegt wird DURCHEINANDER. Stünde der Pfad in Anlege-Reihenfolge da,
 * bewiese er nichts.
 * ========================================================================*/
console.log('\n2 · Der Pfad ordnet den Stoff');

const gebaut = await seite.evaluate(async () => {
  const s = Store.addPage(null, { text: 'Elektrotechnik', icon: '⚡' });
  /* NACHGESEHEN, NICHT GERATEN: das Thema steht unter `quiz.topic`, der
     Lernstand unter `sr.wdh`, und `progress` ist min(2,wdh) / (2 · Karten)
     — `learning.ts`, `topicProgress`. */
  const karte = (thema: string, wdh: number): string => {
    const b = Store.addBlock(s.id, 'flashcard', {
      text: thema + ' — Frage :: Antwort',
      quiz: { topic: thema, options: ['a', 'b'], correct: 0 },
      sr: { ease: 2.5, intervall: 6, wdh, faellig: '2099-01-01T00:00:00.000Z' }
    });
    return b.id;
  };
  /* Absichtlich verkehrt herum angelegt. */
  const lampe = karte('Lampenschaltungen', 0);
  const leistung = karte('Leistung und Energie', 1);
  const ohm = karte('Ohmsches Gesetz', 2);
  const grund = karte('Grundlagen', 2);
  await Store.flush();
  return { seite: s.id, lampe, leistung, ohm, grund };
});

await zeige('lernweg');
const pfad = await seite.evaluate(() =>
  [...document.querySelectorAll<HTMLElement>('.lw-path li')].map(li => ({
    thema: (li.querySelector('.lw-path-copy strong')?.textContent || '').trim(),
    stufe: (li.querySelector('.lw-path-step')?.textContent || '').trim(),
    stand: (li.querySelector('.lw-path-copy small')?.textContent || '').trim(),
    prozent: Number(li.querySelector('progress')?.getAttribute('value') || -1),
    gesperrt: !!li.querySelector('button[disabled]')
  })));

gleich('Vier Stufen stehen da', pfad.length, 4);
gleich('Und zwar in der Reihenfolge aus §9', pfad.map(x => x.thema),
  ['Grundlagen', 'Ohmsches Gesetz', 'Leistung und Energie', 'Lampenschaltungen']);
gleich('Durchnummeriert von oben', pfad.map(x => x.stufe), ['1', '2', '3', '4']);

/* ==========================================================================
 * §3 · Keine Sperre, und der Stand kommt aus SM-2 — nicht aus XP
 * ========================================================================*/
console.log('\n3 · Keine Sperre, und der Stand kommt aus SM-2');

/* UND DER PFAD SAGT, WAS IHN GEORDNET HAT (E164). Die Reihenfolge oben ist
   die Vorgabe aus §9 — hier steht, dass die Seite das auch dazuschreibt.
   Ohne diesen Punkt behauptet sie „Der Pfad ordnet den Stoff" und lässt
   offen, WAS geordnet hat und was passiert, wenn nichts passt. */
const warum = await seite.evaluate(() =>
  (document.querySelector('.lw-path-why')?.textContent || '').replace(/\s+/g, ' ').trim());
p('Der Pfad nennt seine Reihenfolge', /Elektro-Grundlagen/.test(warum), warum.slice(0, 120));
p('Und zählt sie auf', /Grundlagen, Spannung, Strom/.test(warum), warum.slice(0, 160));
p('Und sagt, dass er nichts errät', /errät keine Abhängigkeiten/.test(warum), warum.slice(-120));

/* Und die Überschrift behauptet nicht mehr, was der Kasten verneinen kann. */
const kopfText = await seite.evaluate(() =>
  (document.querySelector('.lw-path-page .lw-page-head span')?.textContent || '').trim());
p('Die Überschrift verspricht keine Ordnung, die es nicht immer gibt',
  !/ordnet den Stoff/.test(kopfText), kopfText);

gleich('Keine Stufe ist gesperrt', pfad.filter(x => x.gesperrt).map(x => x.thema), []);
gleich('Jede trägt ihren Stand in Prozent',
  pfad.map(x => x.prozent), [100, 100, 50, 0]);
gleich('Und sagt ihn auch in Worten',
  pfad.map(x => x.stand), ['stabil', 'stabil', 'im Aufbau', 'bereit']);

/* DER PUNKT, AUF DEN ES ANKOMMT. XP ist Aktivität, nicht Wissen. Wer 5000
   XP einträgt, hat nichts wiederholt — und der Pfad darf sich nicht rühren. */
const nachXp = await seite.evaluate(async () => {
  const vorher = Store.getMeta('lernSpiel', null);
  Store.setMeta('lernSpiel', { ...(vorher || {}), xp: 5000, level: 42, streak: 99 });
  await Store.flush();
  (globalThis as any).Produktwelten.lernen('lernweg');
  await new Promise(r => setTimeout(r, 800));
  return [...document.querySelectorAll<HTMLElement>('.lw-path li')]
    .map(li => Number(li.querySelector('progress')?.getAttribute('value') || -1));
});
gleich('5000 XP ändern am Themenfortschritt nichts', nachXp, [100, 100, 50, 0]);

/* Und die Gegenrichtung: eine echte Wiederholung ÄNDERT ihn. Sonst hätte
   der Punkt darüber auch mit einer eingefrorenen Zahl bestanden. */
const nachWdh = await seite.evaluate(async (ids: any) => {
  Store.updateBlock(ids.lampe, { sr: { ease: 2.5, intervall: 6, wdh: 2,
    faellig: '2099-01-01T00:00:00.000Z' } });
  await Store.flush();
  (globalThis as any).Produktwelten.lernen('lernweg');
  await new Promise(r => setTimeout(r, 800));
  return [...document.querySelectorAll<HTMLElement>('.lw-path li')]
    .map(li => Number(li.querySelector('progress')?.getAttribute('value') || -1));
}, gebaut);
gleich('Eine echte Wiederholung dagegen schon', nachWdh, [100, 100, 50, 100]);

/* ==========================================================================
 * §4 · Ein Klick auf eine Stufe führt zum Thema
 * ========================================================================*/
console.log('\n4 · Ein Klick auf eine Stufe führt zum Thema');

const gesprungen = await seite.evaluate(async () => {
  const knopf = document.querySelector<HTMLElement>('.lw-path li button[data-lw-path-topic]');
  const thema = knopf?.dataset['lwPathTopic'] || '';
  knopf?.click();
  await new Promise(r => setTimeout(r, 900));
  return { thema, text: (document.querySelector('.lernwelt')?.textContent || '')
    .replace(/\s+/g, ' ').trim().slice(0, 300) };
});
p('Die Stufe trägt ihr Thema als Kennung', !!gesprungen.thema, gesprungen.thema);
p('Und der Klick führt dorthin',
  /Grundlagen/i.test(gesprungen.text), gesprungen.text.slice(0, 120));

/* ==========================================================================
 * §5 · Die Arbeitssicht zeigt, was §14 aufzählt — aus echten Daten
 * ========================================================================*/
console.log('\n5 · Die Arbeitssicht zeigt, was §14 aufzählt');

const arbeitDaten = await seite.evaluate(async () => {
  const heute = new Date(); heute.setDate(heute.getDate() + 3);
  const projekt = Store.addPage(null, { text: 'Projekt Halle 3', icon: '🚀' });
  const meeting = Store.addPage(null, { text: 'Bauleitung KW 35', icon: '🎙', besprechung: true });
  const entscheid = Store.addPage(null, { text: 'Entscheidung: Kabelquerschnitt', icon: '📌' });
  const pdfSeite = Store.addPage(null, { text: 'Schaltplan Halle 3', icon: '📕' });
  Store.addBlock(pdfSeite.id, 'pdfseite', { nr: 1, suchtext: 'Verteiler UV3' });
  await Store.flush();
  return { projekt: projekt.id, meeting: meeting.id, entscheid: entscheid.id, pdf: pdfSeite.id };
});

await zeige('arbeit');
const arbeit = await seite.evaluate(() => {
  const abschnitte: Record<string, string> = {};
  document.querySelectorAll<HTMLElement>('.lw-domain .lw-dashboard-grid > *').forEach(s => {
    const titel = (s.querySelector('h3, h2, header')?.textContent || '').trim();
    abschnitte[titel] = (s.textContent || '').replace(/\s+/g, ' ').trim();
  });
  return {
    titel: Object.keys(abschnitte),
    inhalt: abschnitte,
    kopf: (document.querySelector('.lw-domain .lw-page-head')?.textContent || '')
      .replace(/\s+/g, ' ').trim()
  };
});

for (const rubrik of ['Projekte', 'Offene Aufgaben', 'Meetings', 'Termine',
                      'Dokumente & PDFs', 'Wissensbasis & Entscheidungen'])
  p(`§14 nennt „${rubrik}" — die Ansicht auch`,
    arbeit.titel.some(t => t.includes(rubrik)), arbeit.titel.join(' | '));

const finde = (teil: string): string =>
  arbeit.inhalt[Object.keys(arbeit.inhalt).find(k => k.includes(teil)) || ''] || '';
p('Das Projekt steht unter Projekte', /Projekt Halle 3/.test(finde('Projekte')),
  finde('Projekte').slice(0, 120));
p('Die Meeting-Notiz unter Meetings', /Bauleitung KW 35/.test(finde('Meetings')),
  finde('Meetings').slice(0, 120));
p('Das PDF unter Dokumente & PDFs', /Schaltplan Halle 3/.test(finde('Dokumente')),
  finde('Dokumente').slice(0, 140));
p('Die Entscheidung unter Wissensbasis', /Kabelquerschnitt/.test(finde('Wissensbasis')),
  finde('Wissensbasis').slice(0, 140));

/* ==========================================================================
 * §6 · Meetings kommen aus dem bestehenden Besprechungssystem
 * --------------------------------------------------------------------------
 * §14 sagt es wörtlich. Geprüft wird an der Kennung: die Ansicht muss auf
 * DIESELBE Seite zeigen, nicht auf eine Zweitschrift daneben (§52).
 * ========================================================================*/
console.log('\n6 · Meetings kommen aus dem bestehenden Besprechungssystem');

const quelle = await seite.evaluate((ids: any) => {
  /* IM MEETING-ABSCHNITT, NICHT IRGENDWO. Die erste Fassung suchte über die
     ganze Seite — und fand die Besprechungsnotiz auch unter „Dokumente &
     PDFs", weil `dokumente()` alle Seiten aufzählt. Mit dem Meeting-
     Abschnitt versuchsweise ganz entfernt blieb dieser Punkt deshalb grün:
     er prüfte etwas anderes, als sein Name sagt. */
  const abschnitt = [...document.querySelectorAll<HTMLElement>('.lw-domain .lw-dashboard-grid > *')]
    .find(s => /Meetings/.test(s.querySelector('h3, h2, header')?.textContent || ''));
  const treffer = [...(abschnitt?.querySelectorAll<HTMLElement>('[data-lw-open]') || [])]
    .find(el => /Bauleitung KW 35/.test(el.textContent || ''));
  return {
    abschnittDa: !!abschnitt,
    verweist: treffer?.dataset['lwOpen'] || '',
    soll: ids.meeting,
    kopien: Object.values<any>(Store.cache.blocks)
      .filter(b => b?.alive !== false && b?.type === 'page' && b.text === 'Bauleitung KW 35').length
  };
}, arbeitDaten);
p('Es gibt einen Meeting-Abschnitt', quelle.abschnittDa);
gleich('Der Eintrag darin zeigt auf die Besprechungsseite selbst', quelle.verweist, quelle.soll);
gleich('Und es gibt sie nur einmal', quelle.kopien, 1);

/* ==========================================================================
 * §7 · Der Klick öffnet die Seite wirklich
 * ========================================================================*/
console.log('\n7 · Der Klick öffnet die Seite wirklich');

const geoeffnet = await seite.evaluate(async (ids: any) => {
  const treffer = [...document.querySelectorAll<HTMLElement>('[data-lw-open]')]
    .find(el => el.dataset['lwOpen'] === ids.projekt);
  treffer?.click();
  await new Promise(r => setTimeout(r, 900));
  return { offen: String(App.aktuelleSeite() || ''), soll: ids.projekt };
}, arbeitDaten);
gleich('Das Projekt ist danach offen', geoeffnet.offen, geoeffnet.soll);

/* ==========================================================================
 * §9 · Was im Journal steht, steht auch in der Arbeitssicht (L50, E169)
 * --------------------------------------------------------------------------
 * Journal, Schnellnotizen und Vorlagen tragen `system: true`. Die
 * Arbeitswelt schloss solche Seiten aus der Menge „lesbare Seiten" aus —
 * und an dieser Menge hingen fünf ganz andere Listen: Aufgaben, Dateien,
 * PDFs, Flächen und Inhaltsblöcke.
 *
 * Damit verschwand alles, was auf einer Systemseite steht. Gemessen an
 * einem Haken im Journal: `Lebensbereiche.aufgaben()` kannte ihn,
 * `Arbeitswelt.snapshot().aufgaben` nicht. Derselbe Haken, zwei Listen, und
 * keine sagte etwas dazu.
 *
 * DIE GEGENRICHTUNG STEHT MIT DABEI, und sie ist der Grund, warum die
 * Behebung nicht einfach „Filter raus" heisst: das Journal selbst darf
 * NICHT in der Seitenliste auftauchen. Es hat seinen eigenen Platz in der
 * Seitenleiste, und zweimal dazustehen wäre keine Verbesserung.
 * ========================================================================*/
console.log('\n9 · Was im Journal steht, steht auch in der Arbeitssicht');

const ausSystemseite = await seite.evaluate(async () => {
  const journal = Store.rootPages().find((x: any) => x.system && x.alive !== false)
    || Store.addPage(null, { text: 'Journal', icon: '📔', system: true });
  const haken = Store.addBlock(journal.id, 'todo',
    { text: 'Aus dem Journal heraus', checked: false });
  const pdf = Store.addBlock(journal.id, 'pdfseite', { nr: 1, suchtext: 'Skizze' });
  await Store.flush();

  const schnapp = Arbeitswelt.snapshot();
  const lb = (globalThis as any).Lebensbereiche;
  const lbRoh = lb && typeof lb.aufgaben === 'function'
    ? await lb.aufgaben({ einschliesslichErledigt: true }) : [];

  return {
    journalId: String(journal.id),
    hakenId: String(haken.id),
    inArbeitswelt: (schnapp.aufgaben || []).some((x: any) => String(x.id) === String(haken.id)),
    inLebensbereiche: (lbRoh || []).some((x: any) =>
      String(x?.ref?.id || x?.id) === String(haken.id)),
    pdfDaSeite: (schnapp.pdfs || []).some((x: any) => String(x.pageId) === String(journal.id)),
    /* Und die Gegenrichtung: die Systemseite selbst bleibt aus der
       Seitenliste heraus. */
    journalInSeiten: (schnapp.seiten || []).some((x: any) => String(x.id) === String(journal.id)),
    pdfBlockId: String(pdf.id)
  };
});

p('Es gibt eine Systemseite zum Prüfen', !!ausSystemseite.journalId);
p('Lebensbereiche kennt den Haken', ausSystemseite.inLebensbereiche);
p('Und die Arbeitssicht jetzt auch', ausSystemseite.inArbeitswelt);
p('Auch ein PDF im Journal zählt mit', ausSystemseite.pdfDaSeite);
p('Die Systemseite selbst bleibt aus der Seitenliste',
  !ausSystemseite.journalInSeiten);

/* ==========================================================================
 * §8 · Und bei fremdem Stoff sagt der Pfad, dass er nichts ordnen kann
 * --------------------------------------------------------------------------
 * DIE GEGENRICHTUNG ZU §3. Die elf Stichwörter aus §9 sind Elektrotechnik.
 * Wer Biologie lernt, bekommt für jedes Thema denselben Rang, und der Pfad
 * fällt auf die alphabetische Folge zurück.
 *
 * Das ist vertretbar — irgendeine Ordnung braucht es. Nicht vertretbar wäre,
 * es zu verschweigen: die Seite sagte „Der Pfad ordnet den Stoff", und wer
 * das bei alphabetischer Folge liest, hält sie für Didaktik.
 *
 * Ohne diesen Abschnitt bestünde §3 auch mit einem Kasten, der IMMER von
 * Elektro-Grundlagen spricht.
 * ========================================================================*/
console.log('\n8 · Und bei fremdem Stoff sagt er, dass er nichts ordnen kann');

const fremd = await seite.evaluate(async () => {
  Object.values<any>(Store.cache.blocks)
    .filter(b => b?.type === 'flashcard' && b.alive !== false)
    .forEach(b => { Store.trashBlock(b.id); Store.purgeBlock(b.id); });
  const s = Store.addPage(null, { text: 'Biologie', icon: '🌿' });
  /* Absichtlich verkehrt herum: alphabetisch wäre Calvin, Lichtreaktion,
     Zellatmung. */
  for (const thema of ['Zellatmung', 'Lichtreaktion', 'Calvin-Zyklus'])
    Store.addBlock(s.id, 'flashcard', {
      text: thema + ' — Frage :: Antwort',
      quiz: { topic: thema, options: ['a', 'b'], correct: 0 },
      sr: { ease: 2.5, intervall: 6, wdh: 1, faellig: '2099-01-01T00:00:00.000Z' }
    });
  await Store.flush();
  (globalThis as any).Produktwelten.lernen('lernweg');
  await new Promise(r => setTimeout(r, 1000));
  return {
    warum: (document.querySelector('.lw-path-why')?.textContent || '').replace(/\s+/g, ' ').trim(),
    stufen: [...document.querySelectorAll<HTMLElement>('.lw-path li')]
      .map(li => (li.querySelector('.lw-path-copy strong')?.textContent || '').trim())
  };
});

gleich('Drei Stufen stehen da', fremd.stufen.length, 3);
gleich('Und zwar alphabetisch', fremd.stufen, ['Calvin-Zyklus', 'Lichtreaktion', 'Zellatmung']);
p('Der Kasten ist überhaupt da', !!fremd.warum, fremd.warum.slice(0, 80));
p('Er spricht NICHT von Elektro-Grundlagen',
  !!fremd.warum && !/Elektro-Grundlagen/.test(fremd.warum), fremd.warum.slice(0, 120));
p('Sondern sagt, dass es keine hinterlegte Reihenfolge gibt',
  /keine hinterlegte Reihenfolge/.test(fremd.warum), fremd.warum.slice(0, 140));
p('Und nennt die alphabetische Folge beim Namen',
  /alphabetisch/.test(fremd.warum), fremd.warum.slice(0, 200));
p('Und erklärt, warum nicht geraten wird',
  /errät keine Abhängigkeiten/.test(fremd.warum), fremd.warum.slice(-140));

/* ========================================================================*/
console.log(`\n${ok}/${ok + weg} bestanden`);
if (fehler.length) console.log('Browserfehler:\n  ' + fehler.join('\n  '));
p('Keine unbehandelten Browserfehler', fehler.length === 0, fehler.join(' | '));

await browser.close();
await new Promise<void>(f => { server.close(() => f()); });
process.exitCode = weg ? 1 : 0;
