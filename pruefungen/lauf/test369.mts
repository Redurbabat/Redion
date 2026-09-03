/* Suite 369 — Ein Ordner ist ein Ort, kein Etikett (E380)
 * ============================================================================
 * BEFUND MIT AUGEN, nicht mit einer Messung. Redur hat vier Fotos aus
 * GoodNotes geschickt und dazu geschrieben:
 *
 *     „wenn ich die zip entpacke sollte wie goodnotes sein — nicht in
 *      Seiten oder im Bereich öffnen. schaue wie goodnotes es öffnet."
 *
 * Nachgebaut wurde sein Bestand — ein Ordner „Redur Babat" mit sechs
 * Fächern, in einem davon ein Lernset, zwei PDFs, ein Unterordner — und das
 * Regal angesehen. Es war FLACH:
 *
 *     „Redur Babat · 6 Sachen" stand NEBEN seinen eigenen sechs Sachen,
 *     und „BT-Arbeitssicherheit Lösungen" (zwei Ebenen tief) lag daneben.
 *
 * `alleSeiten()` nahm jede lebende Seite aus dem Cache, ohne Rücksicht auf
 * die Tiefe (`bibliothek.ts:58`). Ein Ordner war damit ein Etikett auf einer
 * flachen Liste — und ein Tipp darauf öffnete ihn als SEITE: man verliess
 * das Regal und landete in einer leeren Seite mit Cursor, weil
 * `Inhaltsflaeche` einem Fach ohne Kinder sogar einen Textblock anlegt.
 *
 * §1 DIE WURZEL ZEIGT DIE WURZEL — nicht den ganzen Bestand.
 * §2 EIN TIPP FÜHRT HINEIN, nicht in eine Seite.
 * §3 DIE BROTKRUME sagt, wo man ist, und führt zurück.
 * §4 DER ORDNER WIRD GEMERKT — und ein gelöschter führt an die Wurzel.
 * §5 DIE ÜBRIGEN REITER BLEIBEN FLACH: „Kürzlich" ist eine Frage über
 *    alles, nicht über eine Ebene.
 * §6 NACH DEM ENTPACKEN steht man IM Ordner.
 *
 *   node pruefungen/lauf/test369.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
declare const Store: any; declare const App: any; declare const Bibliothek: any;
declare const ArchivImport: any; declare const Austausch: any;
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9401;
const TYP: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.json': 'application/json', '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json'
};
const server = http.createServer((req: IncomingMessage, res: ServerResponse) => {
  const rein = decodeURIComponent((req.url || '/').split('?')[0] || '/');
  const datei = path.join(WURZEL, rein === '/' ? 'index.html' : rein);
  if (!datei.startsWith(WURZEL) || !fs.existsSync(datei) || fs.statSync(datei).isDirectory()) {
    res.writeHead(404); res.end('weg'); return;
  }
  res.writeHead(200, { 'Content-Type': TYP[path.extname(datei)] || 'application/octet-stream' });
  res.end(fs.readFileSync(datei));
});
await new Promise<void>(fertig => server.listen(PORT, fertig));

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll),
    `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

const browser = await chromium.launch();
const seite = await browser.newPage({ viewport: { width: 1360, height: 900 } });
const fehler: string[] = [];
seite.on('pageerror', (e: Error) => fehler.push('PAGEERROR: ' + e.message.slice(0, 160)));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForFunction(() => typeof Store !== 'undefined' && typeof App !== 'undefined',
  null, { timeout: 30000 });
await seite.waitForTimeout(1000);

/* REDURS BESTAND, nachgebaut. Die Namen sind seine — sie stehen in den
   Fotos, und ein Prüflauf, der mit „Fach A / Fach B" prüft, prüft nicht
   den Fall, der gemeldet wurde. */
const kennungen = await seite.evaluate(() => {
  Store.setMeta('rundgangGesehen', true);
  document.querySelector('.produkt-onboarding-lage')?.remove();
  document.getElementById('rg-willkommen')?.remove();
  const wurzel = Store.addPage(null, { text: 'Redur Babat', icon: '🗂', heftArt: 'fach' });
  const namen = ['BT-Arbeitssicherheit', 'TD-Anlagendokumentation', 'TG-Erweiterte Fachtechnik',
                 'TG-Mathematik', 'TG-Elektrotechnik', 'TD-Regeln der Technik'];
  const kinder = namen.map(n => Store.addPage(wurzel.id, { text: n, icon: '🗂', heftArt: 'fach' }));
  const bt = kinder[0];
  Store.addPage(bt.id, { text: 'Unbenanntes Lernset', icon: '🗂' });
  Store.addPage(bt.id, { text: 'Chemie für Elektroberufe 2019', icon: '📕' });
  const unter = Store.addPage(bt.id, { text: 'BT-Arbeitssicherheit Lösungen', icon: '🗂', heftArt: 'fach' });
  Store.addPage(bt.id, { text: 'Arbeitssicherheit und Chemie', icon: '📕' });
  const heft = Store.addPage(null, { text: 'Unbenanntes Notizbuch', icon: '📓' });
  Bibliothek.oeffne();
  return { wurzel: wurzel.id as string, bt: bt.id as string,
           unter: unter.id as string, heft: heft.id as string };
});
await seite.waitForTimeout(1200);

/** Was auf den Kacheln steht, in der gezeigten Reihenfolge. */
const kacheln = (): Promise<string[]> => seite.evaluate(() =>
  [...document.querySelectorAll('.bib-deckel .bib-deckel-name b')]
    .map(b => (b.textContent || '').trim()));
const kopf = (): Promise<{ titel: string; ort: string; krume: string[] }> => seite.evaluate(() => ({
  titel: (document.querySelector('.bib-dkopf h1')?.textContent || '').trim(),
  ort: (document.querySelector('.bib-ort')?.textContent || '').replace(/\s+/g, ' ').replace(/▾/g, '').trim(),
  krume: [...document.querySelectorAll('.bib-krume button, .bib-krume b')]
    .map(x => (x.textContent || '').trim()).filter(t => t && t !== '‹')
}));
const tippe = async (name: string): Promise<void> => {
  await seite.evaluate((n: string) => {
    const k = [...document.querySelectorAll<HTMLElement>('.bib-deckel')]
      .find(b => (b.querySelector('.bib-deckel-name b')?.textContent || '').trim() === n);
    k?.click();
  }, name);
  await seite.waitForTimeout(700);
};

console.log('\n1 · Die Wurzel zeigt die Wurzel, nicht den ganzen Bestand');

const wurzelKacheln = await kacheln();
p('Der Ordner „Redur Babat" steht da', wurzelKacheln.includes('Redur Babat'),
  JSON.stringify(wurzelKacheln));
p('Das Notizbuch der Wurzel steht da', wurzelKacheln.includes('Unbenanntes Notizbuch'));
/* DIE EIGENTLICHE ZUSAGE: was EINE EBENE TIEFER liegt, steht NICHT daneben.
   Genau das war der Befund auf dem Bild. */
p('Die sechs Fächer stehen NICHT flach daneben',
  !wurzelKacheln.includes('BT-Arbeitssicherheit') &&
  !wurzelKacheln.includes('TG-Mathematik'), JSON.stringify(wurzelKacheln));
p('Und was zwei Ebenen tief liegt, erst recht nicht',
  !wurzelKacheln.includes('BT-Arbeitssicherheit Lösungen') &&
  !wurzelKacheln.includes('Chemie für Elektroberufe 2019'));
const k0 = await kopf();
gleich('An der Wurzel heisst der Titel „Dokumente"', k0.titel, 'Dokumente');
p('… und die Brotkrume schweigt — ein Pfad mit einem Glied ist keiner',
  k0.krume.length === 0, JSON.stringify(k0.krume));
p('Der Ort nennt die Ablage', /Ablage/.test(k0.ort), k0.ort);

console.log('\n2 · Ein Tipp führt hinein, nicht in eine Seite');

await tippe('Redur Babat');
const drin = await kacheln();
const k1 = await kopf();
gleich('Jetzt stehen genau die sechs Fächer da', drin.slice().sort(),
  ['BT-Arbeitssicherheit', 'TD-Anlagendokumentation', 'TD-Regeln der Technik',
   'TG-Elektrotechnik', 'TG-Erweiterte Fachtechnik', 'TG-Mathematik']);
gleich('Der Titel ist der Ordner', k1.titel, 'Redur Babat');
p('Man ist NICHT in einer Seite gelandet — das Regal steht noch',
  await seite.evaluate(() => !!document.querySelector('.bib-deckel-seite') &&
    !document.querySelector('#page .block')), '');
p('Der Ort zählt die Ebene, nicht den Bestand', /6 Dokumente/.test(k1.ort), k1.ort);

await tippe('BT-Arbeitssicherheit');
const tiefer = await kacheln();
gleich('Eine Ebene tiefer: Lernset, zwei PDFs, ein Unterordner', tiefer.slice().sort(),
  ['Arbeitssicherheit und Chemie', 'BT-Arbeitssicherheit Lösungen',
   'Chemie für Elektroberufe 2019', 'Unbenanntes Lernset']);
/* DAS IST DER PUNKT, DEN DAS HEFTREGAL NICHT KANN: dort ist eine PDF
   ausdrücklich kein Heft (notebook.ts:109), und ein Lernset auch nicht.
   In der Ablage liegt alles, was ein Mensch dort ablegt. */
p('Auch die PDFs und das Lernset — nicht nur Hefte',
  tiefer.includes('Chemie für Elektroberufe 2019') && tiefer.includes('Unbenanntes Lernset'));

console.log('\n3 · Die Brotkrume sagt, wo man ist, und führt zurück');

const k2 = await kopf();
gleich('Sie nennt den ganzen Weg', k2.krume,
  ['Dokumente', 'Redur Babat', 'BT-Arbeitssicherheit']);
await seite.evaluate(() => document.querySelector<HTMLElement>('.bib-krume [data-hoch]')?.click());
await seite.waitForTimeout(700);
gleich('Der Pfeil führt EINE Ebene hoch', (await kopf()).titel, 'Redur Babat');
await seite.evaluate(() => document.querySelector<HTMLElement>('.bib-krume [data-hoch]')?.click());
await seite.waitForTimeout(700);
gleich('… und noch einmal an die Wurzel', (await kopf()).titel, 'Dokumente');
p('An der Wurzel ist die Krume wieder weg', (await kopf()).krume.length === 0);
/* Ein Glied der Krume ist selbst ein Weg — zwei Ebenen tief springt man
   damit in einem Schritt zurück, ohne zweimal zu tippen. */
await tippe('Redur Babat');
await tippe('BT-Arbeitssicherheit');
await seite.evaluate(() =>
  [...document.querySelectorAll<HTMLElement>('.bib-krume [data-ordner]')]
    .find(b => (b.textContent || '').trim() === 'Dokumente')?.click());
await seite.waitForTimeout(700);
gleich('Ein Glied der Krume springt direkt dorthin', (await kopf()).titel, 'Dokumente');

console.log('\n4 · Der Ordner wird gemerkt');

await tippe('Redur Babat');
gleich('Der Merker steht im Bestand',
  await seite.evaluate(() => Store.getMeta('bibOrdner', '')), kennungen.wurzel);
await seite.reload();
await seite.waitForFunction(() => typeof Store !== 'undefined' && typeof App !== 'undefined',
  null, { timeout: 30000 });
await seite.waitForTimeout(1500);
await seite.evaluate(() => Bibliothek.oeffne());
await seite.waitForTimeout(1000);
gleich('Nach dem Neuladen steht das Regal wieder im Ordner',
  (await kopf()).titel, 'Redur Babat');
/* EIN GELÖSCHTER ORDNER FÜHRT AN DIE WURZEL, NICHT INS NICHTS — dieselbe
   Regel, die test276 für das Heftregal hält. */
await seite.evaluate((id: string) => { Store.trashBlock(id); Bibliothek.oeffne(); }, kennungen.wurzel);
await seite.waitForTimeout(900);
gleich('Ein gelöschter Ordner führt an die Wurzel', (await kopf()).titel, 'Dokumente');
await seite.evaluate((id: string) => { Store.restoreBlock(id); Bibliothek.oeffne(); }, kennungen.wurzel);
await seite.waitForTimeout(900);

console.log('\n5 · Die übrigen Reiter bleiben flach');

const flachSatz = await seite.evaluate(() => {
  document.querySelector<HTMLElement>('.bib-ort')?.click();
  return new Promise<string[]>(f => setTimeout(() => {
    document.querySelector<HTMLElement>('.menu [data-x="kuerzlich"]')?.click();
    setTimeout(() => f([...document.querySelectorAll('.bib-deckel .bib-deckel-name b')]
      .map(b => (b.textContent || '').trim())), 700);
  }, 400));
});
p('„Kürzlich verwendet" zeigt weiter über alle Ebenen',
  flachSatz.includes('BT-Arbeitssicherheit') && flachSatz.includes('Redur Babat'),
  JSON.stringify(flachSatz.slice(0, 6)));
p('… und ist damit eine Frage über alles, nicht über eine Ebene',
  flachSatz.length > 6, String(flachSatz.length));

console.log('\n6 · Nach dem Entpacken steht man im Ordner');

/* Der Draht, den es nicht gab: `importZip` kennt seit E350 die Kennung des
   entstandenen Wurzelfachs, gab sie zurück — und kein Aufrufer las sie.
   Hier wird der echte Weg gefahren, nicht die Ansicht von Hand gesetzt. */
const nachImport = await seite.evaluate(async () => {
  /* Der eigene ZIP-Schreiber der App (`Austausch.zipSchreiben`) legt das Archiv
     an, der eigene Leser (`ArchivImport.importZip`) holt es zurück — echte
     Bytes durch beide Hälften, keine von Hand gesetzte Ansicht. */
  if (typeof Austausch === 'undefined' || !Austausch.zipSchreiben)
    return { ok: false, grund: 'kein ZIP-Schreiber' };
  const roh = await Austausch.zipSchreiben([
    { name: 'Kurs 2027/Skript/Kapitel 1.txt', inhalt: 'eins' },
    { name: 'Kurs 2027/Skript/Kapitel 2.txt', inhalt: 'zwei' },
    { name: 'Kurs 2027/Aufgaben/Blatt 1.txt', inhalt: 'drei' }
  ]);
  const datei = new File([roh], 'Kurs 2027.zip', { type: 'application/zip' });
  const erg = await ArchivImport.importZip(datei, null, {});
  return { ok: true, wurzelId: erg?.wurzelId || '', faecher: erg?.faecher ?? -1 };
});
if (!nachImport.ok) {
  p('Der ZIP-Weg ist fahrbar', false, String(nachImport.grund));
} else {
  p('Die ZIP ist entpackt und hat Fächer angelegt', nachImport.faecher >= 2,
    JSON.stringify(nachImport));
  p('… und der Import gibt die Kennung des Wurzelordners zurück',
    !!nachImport.wurzelId, String(nachImport.wurzelId));
  await seite.waitForTimeout(900);
  const k3 = await kopf();
  gleich('DER BILDSCHIRM STEHT IM ENTSTANDENEN ORDNER', k3.titel, 'Kurs 2027');
  const inhalt = await kacheln();
  gleich('… und zeigt genau seine zwei Unterordner', inhalt.slice().sort(),
    ['Aufgaben', 'Skript']);
  p('Die Brotkrume nennt den Weg dorthin',
    k3.krume.includes('Dokumente') && k3.krume.includes('Kurs 2027'),
    JSON.stringify(k3.krume));
}

console.log('\n7 · Bau-Hygiene');

const ohneWorte = (x: string): string => x.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const js = ohneWorte(fs.readFileSync(path.join(WURZEL, 'quell/bereiche/wissen/bibliothek.js'), 'utf-8'));
p('Die Ablage ist ein Reiter', /id:\s*'ablage'/.test(js));
p('Der Zustand kennt den offenen Ordner', /ordner:\s*null/.test(js));
p('Die Auswahl filtert nach dem Eltern', /parentId === ordner/.test(js));
p('Ein Ordner wird betreten, nicht geöffnet', /geheIn\(id\)/.test(js));
const aj = ohneWorte(fs.readFileSync(path.join(WURZEL, 'quell/bereiche/dateien/archiveImport.js'), 'utf-8'));
p('Der Import liest seine eigene wurzelId endlich',
  /ansichtAuffrischen\(ergebnis\.wurzelId/.test(aj));
p('Und der Hintergrundlauf holt sie aus dem fertigen Auftrag',
  /stand\.wurzelId/.test(aj));
p('Die Einzeldatei kennt die Ablage',
  fs.readFileSync(path.join(WURZEL, 'redion-einzeldatei.html'), 'utf-8').includes("id: 'ablage'"));
p('Keine Fehler auf der Seite', fehler.length === 0, fehler.slice(0, 3).join(' | '));

console.log(`\n${ok}/${ok + weg} bestanden · ✗=${weg}`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
