/* Suite 174 — Die Lernwelt rechnet richtig (E135)
 * ============================================================================
 * Über 173 Prüfläufe hinweg fasste kein einziger die Lernwelt an. Sie ist die
 * grösste der neuen Ansichten — Tagesrunde, Fehlertraining, Lernpfad,
 * Prüfungszentrale, Fortschritt — und sie stand ungeprüft da.
 *
 * Was dabei herauskam, waren zwei Ursachen mit sieben sichtbaren Folgen.
 * Beide sind die stille Sorte: sie zeigen 0 und „leer", und 0 ist für einen
 * frischen Bestand eine völlig glaubwürdige Zahl.
 *
 * ─── URSACHE 1: EIN LEERER LERNSTAND IST KEIN LERNSTAND ─────────────────────
 * `leererLernzustand` liefert `sr: {}`, und ein leeres Objekt ist wahr.
 * `karteMitStand` liess es stehen, und danach galt:
 *
 *     neu    = alle.filter(card => !card.sr)       → nie eine Karte
 *     fällig = alle.filter(card => card.sr && …)   → immer alle
 *
 * Gemessen mit fünf fabrikneuen Karten: „0 neu, 5 fällig".
 *
 * ─── URSACHE 2: EIN `Date` IST SCHON EIN DATUM ──────────────────────────────
 * `datum()` behandelte jedes Objekt als Hülle und las `.start ?? .date ??
 * .from`. Ein `Date` ist ein Objekt und hat keines davon → `null`.
 *
 *     Lernziel heute      0 / 20 nach dem Lernen
 *     Streak              0 Tage am selben Tag
 *     Prüfungs-Countdown  auf dem Schirm stand wörtlich „null Tage"
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 * Beide Ursachen wurden einzeln zurückgenommen und nachgemessen:
 *
 *     ohne den Date-Zweig    Lernziel 0/20, Streak 0 Tage
 *     mit ihm                Lernziel 1/20, Streak 1 Tag
 *     ohne `hatLernstand`    0 neu, 5 fällig
 *     mit ihm                5 neu, 0 fällig
 *
 *   node pruefungen/lauf/test208.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8966;

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
  document.getElementById('rg-willkommen')?.remove();
  document.getElementById('rg-einladung')?.remove();
});

/** Der Wortlaut der Lernwelt, Leerraum zusammengezogen. */
const wortlaut = (): Promise<string> => seite.evaluate(() =>
  ((document.querySelector('.lernwelt') as HTMLElement | null)?.textContent || '')
    .replace(/\s+/g, ' ').trim());

const zuHeute = async (): Promise<string> => {
  await seite.evaluate(() => (globalThis as any).Produktwelten.lernen('heute'));
  await seite.waitForTimeout(1000);
  return wortlaut();
};

/* ==========================================================================
 * §1 · Fabrikneue Karten sind neu, nicht fällig
 * ========================================================================*/
console.log('\n1 · Fabrikneue Karten sind neu, nicht fällig');

const karten = await seite.evaluate(async () => {
  const s = Store.addPage(null, { text: 'Elektrotechnik' });
  for (const q of ['Ohm :: U = R · I', 'Leistung :: P = U · I',
                   'Arbeit :: W = P · t', 'Reihe :: R = R1 + R2'])
    Store.addBlock(s.id, 'flashcard', { text: q });
  await Store.flush();
  const roh = Object.values<any>(Store.cache.blocks)
    .filter(b => b.type === 'flashcard' && b.alive);
  return { angelegt: roh.length, mitStand: roh.filter(b => b.sr).length };
});
gleich('Vier Karten sind dazugekommen', karten.angelegt >= 4, true);
gleich('Und keine davon trägt einen Lernstand', karten.mitStand, 0);

const heute1 = await zuHeute();
const neuZahl = Number(/(\d+)\s*neu/.exec(heute1)?.[1] ?? -1);
const faelligZahl = Number(/(\d+)\s*fällig/.exec(heute1)?.[1] ?? -1);
p('Die Kachel „neu" zählt sie', neuZahl >= 4, `sie zeigt ${neuZahl}`);
gleich('Und „fällig" zählt keine davon', faelligZahl, 0);

/* ==========================================================================
 * §2 · Eine Bewertung bewegt das Tagesziel und den Streak
 * --------------------------------------------------------------------------
 * Der Weg eines Menschen: Tagesrunde starten, Antwort zeigen, „Gut" drücken.
 * ========================================================================*/
console.log('\n2 · Eine Bewertung bewegt das Tagesziel und den Streak');

const zielVorher = /(\d+)\s*\/\s*(\d+)/.exec(heute1)?.[0] ?? '?';
gleich('Vor dem Lernen steht das Tagesziel auf null', zielVorher.startsWith('0 /'), true);

const gelernt = await seite.evaluate(async () => {
  const klick = (wahl: string): boolean => {
    const el = document.querySelector(wahl) as HTMLElement | null;
    if (!el) return false;
    el.click();
    return true;
  };
  const start = klick('[data-lw-train="today"]') || klick('[data-lw-train="new"]');
  await new Promise(r => setTimeout(r, 900));
  const aufdecken = klick('[data-lw-action="training-reveal"]');
  await new Promise(r => setTimeout(r, 400));
  const bewerten = klick('[data-lw-rate="3"]');
  await new Promise(r => setTimeout(r, 900));
  return { start, aufdecken, bewerten };
});
p('Die Runde lässt sich starten', gelernt.start);
p('Die Antwort lässt sich aufdecken', gelernt.aufdecken);
p('Und „Gut" lässt sich drücken', gelernt.bewerten);

const heute2 = await zuHeute();
const zielNachher = /(\d+)\s*\/\s*(\d+)/.exec(heute2)?.[0] ?? '?';
p('Danach steht eine Wiederholung im Tagesziel',
  /^[1-9]\d*\s*\//.test(zielNachher), `es steht ${zielNachher}`);
p('Und der Streak zählt den heutigen Tag',
  /[1-9]\d*\s*Tage?/.test(/(\d+)\s*Tage?\s*Streak/.exec(heute2)?.[0] ?? ''),
  /(\d+)\s*Tage?\s*Streak/.exec(heute2)?.[0] ?? '(kein Streak im Text)');

/* ==========================================================================
 * §3 · Der Prüfungs-Countdown rechnet — und sagt nicht „null Tage"
 * ========================================================================*/
console.log('\n3 · Der Prüfungs-Countdown rechnet');

await seite.evaluate(async () => {
  const s = Store.addPage(null, { text: 'Klausurplan' });
  const db = Store.addDatabase(s.id, 'Klausuren', {
    title: { name: 'Name', type: 'title' },
    wann: { name: 'Datum', type: 'date' },
  });
  /* `addDatabase` gibt `{ block, collectionId, viewId }` zurück — nicht den
     Block selbst. Der erste Entwurf griff auf `.id` zu, bekam undefined,
     und §3 mass danach eine Prüfungsliste, die es gar nicht gab. */
  Store.updateCollection(db.collectionId, { schoolKind: 'exams' });
  const inFuenf = new Date();
  inFuenf.setDate(inFuenf.getDate() + 5);
  const zeile = Store.addRow(db.collectionId, { title: 'Elektrotechnik Klausur' });
  Store.setProp(zeile.id, 'wann', inFuenf.toISOString().slice(0, 10));
  await Store.flush();
});
const heute3 = await zuHeute();
await seite.evaluate(() => (globalThis as any).Produktwelten.lernen('pruefungen'));
await seite.waitForTimeout(1000);
const pruefungsText = await wortlaut();

p('Auf dem Bildschirm steht nirgends „null Tage"',
  !/null\s*Tage/.test(heute3 + ' ' + pruefungsText),
  (/.{0,40}null\s*Tage.{0,40}/.exec(heute3 + ' ' + pruefungsText) ?? [''])[0]);

/* KEIN `\b` VOR DER ZAHL. Der Wortlaut ist „… 29. Aug. 20265 Tage" — das
   Jahr und die Tageszahl stossen ohne Trennung aneinander, und eine
   Wortgrenze gibt es zwischen zwei Ziffern nicht. Der erste Entwurf suchte
   `\b5\s*Tage\b` und fand nichts, obwohl „5 Tage" gut sichtbar auf dem
   Schirm stand. */
p('Die Prüfungszentrale nennt die Klausur',
  /Elektrotechnik Klausur/.test(pruefungsText), pruefungsText.slice(0, 120));
p('… und rechnet fünf Tage bis dahin',
  /5\s*Tage/.test(pruefungsText),
  (/.{0,60}Tage.{0,20}/.exec(pruefungsText) ?? ['(keine Tagesangabe gefunden)'])[0]);
p('Und das Heute-Bild nennt sie ebenfalls',
  /Elektrotechnik Klausur/.test(heute3),
  (/.{0,60}nächste Prüfung.{0,60}/.exec(heute3) ?? ['(nicht gefunden)'])[0]);

/* ==========================================================================
 * §4 · Eine vergangene Prüfung steht nicht unter „Kommende"
 * --------------------------------------------------------------------------
 * Dieselbe Ursache, dritte Folge. Weil `tage` immer null war, nahm
 * `kommende` ausnahmslos alles auf und `vergangene` blieb leer — der
 * Ausklapper „Vergangene Prüfungen" konnte gar nicht erscheinen, und eine
 * Klausur von vorletzter Woche stand unter den kommenden.
 * ========================================================================*/
console.log('\n4 · Eine vergangene Prüfung steht nicht unter „Kommende"');

const zeiten = await seite.evaluate(async () => {
  const alt2 = new Date(); alt2.setDate(alt2.getDate() - 10);
  const coll = Object.values<any>(Store.cache.collections)
    .find(c => c?.schoolKind === 'exams');
  const zeile = Store.addRow(coll.id, { title: 'Klausur von vorletzter Woche' });
  const datumKey = Object.keys(coll.schema).find(k => coll.schema[k]?.type === 'date');
  Store.setProp(zeile.id, datumKey, alt2.toISOString().slice(0, 10));
  await Store.flush();
  (globalThis as any).Produktwelten.lernen('pruefungen');
  await new Promise(r => setTimeout(r, 1100));
  const text = ((document.querySelector('.lernwelt') as HTMLElement)?.textContent || '')
    .replace(/\s+/g, ' ');
  const komm = text.indexOf('Kommende');
  const verg = text.indexOf('Vergangene');
  return {
    hatGruppe: verg >= 0,
    alteUnterKommenden: komm >= 0 && verg > komm
      ? text.slice(komm, verg).includes('von vorletzter Woche')
      : text.includes('von vorletzter Woche'),
    ohneTermin: (text.match(/ohne Termin/g) || []).length,
  };
});
gleich('Es gibt eine Gruppe „Vergangene Prüfungen"', zeiten.hatGruppe, true);
gleich('Die alte Klausur steht nicht unter den kommenden', zeiten.alteUnterKommenden, false);
gleich('Und keine Prüfung steht ohne Termin da', zeiten.ohneTermin, 0);

/* ==========================================================================
 * §5 · Was der Quelltext dazu sagt
 * ========================================================================*/
console.log('\n5 · Was der Quelltext dazu sagt');

const quelle = fs.readFileSync(path.join(WURZEL, 'src/bereiche/wissen/lernwelt.ts'), 'utf8');
p('`datum` behandelt ein `Date` als Datum, nicht als Hülle',
  /if \(wert instanceof Date\)/.test(quelle));
p('Ein leerer Lernstand zählt nicht als Lernstand',
  /const hatLernstand = /.test(quelle) &&
  /sr: hatLernstand\(stand\?\.sr\) \? stand\.sr : null/.test(quelle));
p('Und `leererLernzustand` liefert weiterhin `sr: {}` — dort wurde nichts geändert',
  /sr: \{\},/.test(fs.readFileSync(
    path.join(WURZEL, 'src/bereiche/wissen/lebensbereiche.ts'), 'utf8')));

gleich('Kein Skriptfehler', fehler.join(' | '), '');

console.log(`\n  Suite 174 — Die Lernwelt rechnet richtig: ${ok} ok, ${weg} offen`);
await browser.close();
server.close();
process.exitCode = weg ? 1 : 0;
