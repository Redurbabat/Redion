/* Suite 359 — Die Zahl im Bibliothekskopf ist eine Zahl, keine Decke (E367, L116)
 * ============================================================================
 * BEFUND: der Reiter „Kürzlich verwendet" schnitt seine Liste bei sechzig ab
 * (`.slice(0, 60)`), und der Kopf zeigte danach die Länge der GESCHNITTENEN
 * Liste. Bei 61 Dokumenten stand dort „60 Dokumente", bei 900 auch. Im Regal
 * war es deutlicher: „60 Seiten auf diesem Gerät" — eine Aussage über den
 * Bestand, über einer Anzeige, die ihn gar nicht kennt.
 *
 * Gefunden hat es kein Prüflauf, sondern ein Bild nach einem ZIP-Import
 * (§55). Dies ist die Prüfung, die es künftig fängt.
 *
 * §1 DIE ZAHL nennt beide Seiten, solange die Decke greift.
 * §2 GEGENPROBE: ohne Decke steht die Zahl allein — sie schweigt im
 *    Normalfall, sonst würde sie nicht gelesen.
 * §3 REGAL UND LISTE tragen denselben Satz — dort stand „auf diesem Gerät".
 * §4 GESUCHT wird über ALLE kürzlich verwendeten, nicht über die sechzig.
 * §5 UMSORTIEREN nimmt weiter die sechzig NEUESTEN, nicht die ersten sechzig.
 * §6 SPRACHE: Einzahl, Mehrzahl und der Dativ nach „von".
 * §7 BAU-HYGIENE.
 *
 *   node pruefungen/lauf/test359.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
declare const Store: any; declare const Bibliothek: any;
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9370;

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
    'ist ' + JSON.stringify(ist) + ', soll ' + JSON.stringify(soll));

const browser = await chromium.launch();
const seite = await browser.newPage({ viewport: { width: 1360, height: 950 } });
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 140)));

await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForFunction(() => typeof Store !== 'undefined' &&
  typeof (window as any).Bibliothek !== 'undefined', null, { timeout: 30000 });
await seite.waitForTimeout(1100);
await seite.evaluate(() => {
  Store.setMeta('rundgangGesehen', true);
  document.querySelector('.produkt-onboarding-lage')?.remove();
  document.getElementById('rg-willkommen')?.remove();
});

/** Wie viele Seiten es vor dem Anlegen schon gab (Beispieldaten). */
const grund = await seite.evaluate(() =>
  Object.values<any>(Store.cache.blocks)
    .filter((b: any) => b?.type === 'page' && b.alive !== false && !b.system).length);

const anlegen = async (n: number, praefix = 'Kapitel'): Promise<void> => {
  await seite.evaluate(([anz, pre]: [number, string]) => {
    for (let i = 1; i <= anz; i++) Store.addPage(null, { text: pre + ' ' + i });
  }, [n, praefix] as [number, string]);
};
/* DER REITER WIRD AUSDRÜCKLICH GESETZT (seit E380).
   Die Zusage dieses Laufs gilt „Kürzlich verwendet" — dort greift die Decke
   von sechzig, und dort ist „60 von N" die Ehrlichkeit, die L116 verlangt
   hat. Bis E380 war dieser Reiter die VORGABE, und der Lauf verliess sich
   darauf. Vorgabe ist jetzt die Ablage: sie zeigt eine Ebene und hat keine
   Decke, weil eine Ebene so viele Sachen hat, wie sie hat. Was dort steht,
   hält §5 dieses Laufs. */
const reiterSetzen = async (id: string): Promise<void> => {
  await seite.evaluate((r: string) => {
    const b = document.querySelector<HTMLElement>('.bib-reiter [data-r="' + r + '"]');
    if (b) { b.click(); return; }
    /* In der Deckelansicht gibt es die Reiterzeile nicht — dort führt der
       Weg über das Ortsmenü hinter dem Titel. */
    document.querySelector<HTMLElement>('.bib-ort')?.click();
  }, id);
  await seite.waitForTimeout(250);
  await seite.evaluate((r: string) => {
    document.querySelector<HTMLElement>('.menu [data-x="' + r + '"]')?.click();
  }, id);
  await seite.waitForTimeout(350);
};
const kopfSatz = async (): Promise<string> => {
  await seite.evaluate(() => { Store.setMeta('bibForm', 'deckel'); Bibliothek.oeffne(); });
  await seite.waitForTimeout(300);
  await reiterSetzen('kuerzlich');
  await seite.waitForTimeout(400);
  return seite.evaluate(() =>
    (document.querySelector('.bib-ort')?.textContent || '').replace(/\s+/g, ' ')
      .replace(/▾/g, '').trim());
};
const zahlenSatz = async (form: 'regal' | 'liste'): Promise<string> => {
  await seite.evaluate((f: string) => { Store.setMeta('bibForm', f); Bibliothek.oeffne(); }, form);
  await seite.waitForTimeout(300);
  await reiterSetzen('kuerzlich');
  await seite.waitForTimeout(400);
  /* SEIT DEM 6. SEPTEMBER (E457) tragen Regal und Liste denselben Kopf wie
     die Deckel: die Zahl steht am Ort-Knopf („Kürzlich verwendet · 60 von
     313 Dokumenten"), die eigene Zeile `.bib-zahlen` gibt es nicht mehr. */
  return seite.evaluate(() =>
    (document.querySelector('.bib-dkopf .bib-ort')?.textContent || '').replace(/\s+/g, ' ')
      .replace(/▾/g, '').trim());
};

/* ========================================================================== */
console.log('\n1 · Die Zahl nennt beide Seiten, solange die Decke greift');

await anlegen(300);
const satzGross = await kopfSatz();
const erwartet = 'Kürzlich verwendet · 60 von ' + (grund + 300) + ' Dokumenten';
gleich('Bei 300 neuen Seiten steht „60 von N Dokumenten"', satzGross, erwartet);
p('Und nicht die nackte Sechzig', !/·\s*60 Dokumente/.test(satzGross),
  'genau das war der Befund: eine Decke, die aussieht wie eine Zahl');

/* ========================================================================== */
console.log('\n2 · Gegenprobe: ohne Decke schweigt der Zusatz');

/* Alles wieder weg — dann greift die Decke nicht mehr, und der Satz muss
   aussehen wie vor E367. Eine Anzeige, die IMMER etwas sagt, wird nicht
   gelesen; ohne diesen Abschnitt misst §1 nur, dass irgendwas dasteht. */
await seite.evaluate(() => {
  Object.values<any>(Store.cache.blocks)
    .filter((b: any) => b?.type === 'page' && b.alive !== false && /^Kapitel \d+$/.test(String(b.text || '')))
    .forEach((b: any) => Store.trashBlock(b.id));
});
const satzKlein = await kopfSatz();
p('Ohne Decke steht kein „von" im Satz', !/ von /.test(satzKlein), satzKlein);
p('Sondern nur die Zahl selbst', /·\s*\d+ Dokumente?$/.test(satzKlein), satzKlein);

/* ========================================================================== */
console.log('\n3 · Regal und Liste tragen denselben Satz');

await anlegen(300, 'Skript');
const regalSatz = await zahlenSatz('regal');
const listeSatz = await zahlenSatz('liste');
p('Im Regal steht „60 von N Dokumenten"',
  /60 von \d+ Dokumenten/.test(regalSatz), regalSatz);
p('In der Liste ebenso', /60 von \d+ Dokumenten/.test(listeSatz), listeSatz);
p('Die nackte Sechzig steht nirgends als Zahl, die das Gerät nicht kennt',
  !/·\s*60 Dokumente\b/.test(regalSatz), regalSatz);

/* ========================================================================== */
console.log('\n4 · Gesucht wird über alle kürzlich verwendeten');

/* Die Bibliothek hat seit dem Suchmodus keine eigene Suchzeile mehr.
   „Skript 7" liegt ausserhalb der sechzig neuesten Seiten; die globale
   Suche im Bibliothek-Modus muss es trotzdem im ganzen Bestand finden. */
const suchTreffer = await seite.evaluate(async () => {
  Store.setMeta('bibForm', 'liste');
  Bibliothek.oeffne();
  await new Promise(f => setTimeout(f, 300));
  App.suche('Skript 7');
  await new Promise(f => setTimeout(f, 300));
  const feld = document.getElementById('q') as HTMLInputElement | null;
  return { feldDa: !!feld,
           modus: (document.getElementById('such-bereich') as HTMLSelectElement | null)?.value,
           treffer: [...document.querySelectorAll<HTMLElement>('#res button[data-i]')]
             .map(zeile => (zeile.textContent || '').replace(/\s+/g, ' ').trim()),
           doppelt: !!document.getElementById('bib-suche') || !!document.getElementById('bib-studio-suche') };
});
p('Die eine globale Suche steht im Bibliothek-Modus',
  suchTreffer.feldDa && suchTreffer.modus === 'bibliothek', JSON.stringify(suchTreffer));
p('„Skript 7" wird auch jenseits der sechzig zuletzt geöffneten gefunden',
  suchTreffer.treffer.some(text => text.includes('Skript 7')), JSON.stringify(suchTreffer.treffer));
p('Kein doppeltes Bibliothek-Suchfeld steht daneben', !suchTreffer.doppelt);
await seite.evaluate(() => document.querySelector('.overlay')?.remove());

/* ========================================================================== */
console.log('\n5 · Umsortieren nimmt weiter die sechzig NEUESTEN');

/* NACH NAMEN SORTIEREN, SONST MISST DIESER ABSCHNITT NICHTS.
   Der erste Wurf las nur die Voreinstellung ab — und die sortiert nach
   Zeit, womit der Umsortierblock gar nicht läuft. Die Mutation „Decke
   NACH der Umsortierung" blieb deshalb grün: es gab nichts zu vertauschen.
   Erst mit einer echten Namenssortierung wird der Unterschied sichtbar —
   die sechzig NEUESTEN (Skript 241…300), nach Namen geordnet, gegen die
   alphabetisch ersten sechzig (Skript 1, 10, 100, 101 …). */
const nachNamen = await seite.evaluate(async () => {
  Store.setMeta('bibForm', 'liste');
  Bibliothek.oeffne();
  await new Promise(f => setTimeout(f, 300));
  document.querySelector<HTMLElement>('[data-s="name"]')?.click();
  await new Promise(f => setTimeout(f, 500));
  const namen = [...document.querySelectorAll('.bib-zeile:not(.bib-kopfzeile)')]
    .map(z => (z.textContent || '').trim())
    .map(t => (/Skript \d+/.exec(t) || [''])[0])
    .filter(Boolean);
  const zahlen = namen.map(n => Number(n.replace('Skript ', '')));
  const sortiert = [...namen].sort((a, b) => a.localeCompare(b, 'de'));
  return { anzahl: namen.length,
           kleinste: zahlen.length ? Math.min(...zahlen) : 0,
           unter100: zahlen.filter(z => z < 100).length,
           alphabetisch: JSON.stringify(namen) === JSON.stringify(sortiert),
           erste: namen[0] || '' };
});
p('Es sind genau sechzig Zeilen', nachNamen.anzahl === 60, String(nachNamen.anzahl));
p('Nach Namen sortiert steht „Skript 1" NICHT dabei — es sind die sechzig ' +
  'neuesten, alphabetisch geordnet, nicht die alphabetisch ersten sechzig',
  /* Nicht schärfer als hundert: dreihundert Seiten in einem Tick tragen
     denselben Zeitstempel bis auf die Millisekunde, und welche sechzig
     davon „die neuesten" sind, ist innerhalb einer solchen Gruppe nicht
     festgelegt. Gemessen lagen sie bei 191…285. Die Grenze muss nur die
     beiden Ordnungen trennen — die alphabetisch ersten sechzig fingen bei
     „Skript 1" an und lägen alle unter 200. */
  nachNamen.kleinste > 100,
  'kleinste Nummer: ' + nachNamen.kleinste + ', erste Zeile: ' + nachNamen.erste);
p('Keine einzige der ersten hundert ist dabei', nachNamen.unter100 === 0,
  'darunter: ' + nachNamen.unter100 + ' Stück');
/* Ohne diese Zeile misst der Abschnitt nichts: läuft der Umsortierblock
   gar nicht, ist die Reihenfolge die der Zeit, und dann sagt „Skript 1
   fehlt" nur, dass die Decke irgendwo greift. */
p('Und die sechzig stehen wirklich alphabetisch — der Umsortierblock lief',
  nachNamen.alphabetisch, 'erste Zeile: ' + nachNamen.erste);

/* ========================================================================== */
console.log('\n6 · Sprache: Einzahl, Mehrzahl, Dativ');

const sprache = await seite.evaluate(() => {
  const B: any = (window as any).Bibliothek;
  return typeof B.umfangSatz === 'function'
    ? { da: true,
        eins: B.umfangSatz(1, 1, 'Dokument', 'Dokumente', 'Dokumenten'),
        viele: B.umfangSatz(7, 7, 'Dokument', 'Dokumente', 'Dokumenten'),
        gedeckelt: B.umfangSatz(60, 313, 'Dokument', 'Dokumente', 'Dokumenten'),
        seiten: B.umfangSatz(60, 313, 'Seite', 'Seiten', 'Seiten') }
    : { da: false };
});
p('Der Satzbauer ist prüfbar', sprache.da,
  'Bibliothek.umfangSatz fehlt in den Griffen');
gleich('Eins ist Einzahl', sprache.eins, '1 Dokument');
gleich('Sieben ist Mehrzahl', sprache.viele, '7 Dokumente');
gleich('Nach „von" steht der Dativ', sprache.gedeckelt, '60 von 313 Dokumenten');
gleich('Bei „Seiten" fallen beide Formen zusammen', sprache.seiten, '60 von 313 Seiten');

/* ========================================================================== */
console.log('\n7 · Bau-Hygiene');

const bibJs = fs.readFileSync(
  path.join(WURZEL, 'quell/bereiche/wissen/bibliothek.js'), 'utf8');
const bibTs = fs.readFileSync(
  path.join(WURZEL, 'src/bereiche/wissen/bibliothek.ts'), 'utf8');
p('Das erzeugte bibliothek.js trägt den ERZEUGT-Kopf und kennt den Satzbauer',
  bibJs.includes('ERZEUGT') && bibJs.includes('umfangSatz'));
p('Die Decke steht als benannte Zahl, nicht als 60 im Fluss',
  /DECKE_KUERZLICH\s*=\s*60/.test(bibTs) && !/\.slice\(0,\s*60\)/.test(bibTs));
p('Die Decke greift nach der Suche',
  bibTs.indexOf('zustand.suche') < bibTs.indexOf('DECKE_KUERZLICH)\n      liste = liste.slice') ||
  bibTs.indexOf('if (zustand.suche)') < bibTs.lastIndexOf('DECKE_KUERZLICH'));
p('Die Einzeldatei kennt den Satzbauer',
  fs.readFileSync(path.join(WURZEL, 'redion-einzeldatei.html'), 'utf8')
    .includes('umfangSatz'));
p('Keine Fehler auf der Seite', fehler.length === 0, fehler.slice(0, 3).join(' | '));

console.log(`\n${ok}/${ok + weg} bestanden · ✗=${weg}`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
