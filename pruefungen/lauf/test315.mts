/* Suite 315 — Was gerade läuft, sieht man auch (L103 Punkt 3, E322)
 * ============================================================================
 * Die Auftragsmaschine (E286) meldet seit ihrem ersten Tag `auftrag.schritt`
 * mit Schritt, Schrittzahl und einem Satz für den Menschen. Zugehört hat
 * niemand. `Auftraege.offen()` und `Auftraege.abbrechen(id)` gab es auch —
 * benutzt hat sie keine Oberfläche.
 *
 * §47 von der leisen Seite: nicht ein Knopf, der nichts tut, sondern eine
 * Arbeit, die läuft, minutenlang dauern kann und über die die App schweigt.
 *
 *   §1 GEGENPROBE: ohne Auftrag ist der Knopf weg.
 *   §2 MIT AUFTRÄGEN erscheint er und nennt sie im Fenster.
 *   §3 DER BALKEN LÜGT NICHT — drei Zustände, drei verschiedene Anzeigen.
 *   §4 ABBRECHEN bricht wirklich ab.
 *   §5 EIN SCHRITT ERREICHT DIE ANZEIGE, ohne dass jemand neu lädt.
 *   §6 DER NAMENSRAUM `arb-` steht im Verzeichnis (E293, L90).
 *
 * DER PRÜFSTEIN IST §1 UND §3. Ein Knopf, der immer da ist, sagt nichts —
 * und ein Balken bei einem Auftrag, der noch gar nicht angefangen hat, sagt
 * „0 % fertig", wo „wartet" die Wahrheit ist. Beides stand im ersten Bild.
 *
 *   node pruefungen/lauf/test315.mts
 * ==========================================================================*/
declare const Store: any; declare const Auftraege: any;
declare const AuftragsAnzeige: any; declare const Ereignisse: any;
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9326;

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

const browser = await chromium.launch();
const fehler: string[] = [];
const pc = await browser.newPage({ viewport: { width: 1280, height: 900 } });
pc.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 140)));
await pc.goto(`http://localhost:${PORT}/index.html`);
await pc.waitForTimeout(2500);

/* ------------------------------------------------------------------------ */
console.log('\n1 · GEGENPROBE zuerst: ohne Auftrag ist der Knopf weg');

/* EIN KNOPF, DER IMMER DA IST, SAGT NICHTS. Und er kostet einen Platz in
   einer Zeile, die am Telefon ohnehin rollt. */
const still = await pc.evaluate(async () => {
  Store.setMeta('rundgangGesehen', true);
  document.querySelectorAll('.overlay').forEach(o => o.remove());
  await Auftraege.leeren();
  await AuftragsAnzeige.knopfFrisch();
  const b = document.getElementById('mb-auftraege');
  return { da: !!b, versteckt: !!(b as HTMLElement)?.hidden,
           offen: (await Auftraege.offen()).length };
});
p('Der Knopf ist gebaut', still.da);
gleich('Es läuft nichts', still.offen, 0);
p('Und er ist versteckt', still.versteckt === true);

/* ------------------------------------------------------------------------ */
console.log('\n2 · Mit Aufträgen erscheint er');

const drei = await pc.evaluate(async () => {
  /* Drei Aufträge in drei verschiedenen Lagen — genau die drei Fälle,
     die die Anzeige auseinanderhalten muss. */
  const a1 = await Auftraege.anlegen('ocr', {}, { schritte: 80, text: 'Seite 34' });
  const a2 = await Auftraege.anlegen('embeddings', {}, { schritte: 0, text: 'baut' });
  const a3 = await Auftraege.anlegen('sicherung', {}, { schritte: 4, text: 'prüft' });
  await Store.auftragPut({ ...(await Auftraege.einer(a1.id)), zustand: 'laeuft', schritt: 34 });
  await Store.auftragPut({ ...(await Auftraege.einer(a2.id)), zustand: 'laeuft', schritt: 7 });
  /* a3 bleibt `wartet`. */
  await AuftragsAnzeige.knopfFrisch();
  const b = document.getElementById('mb-auftraege') as HTMLElement;
  const zahl = b.querySelector('b') as HTMLElement;

  AuftragsAnzeige.oeffnen();
  await new Promise(r => setTimeout(r, 300));
  const f = document.querySelector('.arb-fenster') as HTMLElement;
  const zeilen = [...f.querySelectorAll('.arb-z')].map(z => ({
    titel: z.querySelector('b')?.textContent || '',
    stand: z.querySelector('.arb-stand')?.textContent || '',
    balken: !!z.querySelector('.arb-balken'),
    breite: (z.querySelector('.arb-balken i') as HTMLElement)?.style.width || '',
    stopp: !!z.querySelector('.arb-stopp')
  }));
  return { versteckt: b.hidden, zahl: zahl.textContent, zahlSichtbar: !zahl.hidden,
           label: b.getAttribute('aria-label'), zeilen, ids: [a1.id, a2.id, a3.id] };
});

p('Jetzt ist der Knopf sichtbar', drei.versteckt === false);
gleich('Und trägt die Drei', drei.zahl, '3');
p('Die Wörter stehen im Label, nicht nur die Zahl (§38)',
  /3 Aufträge laufen/.test(drei.label || ''), String(drei.label));
gleich('Drei Zeilen im Fenster', drei.zeilen.length, 3);
p('Jede mit einem Abbrechen-Knopf', drei.zeilen.every(z => z.stopp));
p('Und mit menschlichen Namen statt der technischen Art',
  drei.zeilen.some(z => z.titel === 'Text aus Bildern lesen'),
  JSON.stringify(drei.zeilen.map(z => z.titel)));

/* ------------------------------------------------------------------------ */
console.log('\n3 · Der Balken lügt nicht');

const ocr    = drei.zeilen.find(z => z.titel === 'Text aus Bildern lesen');
const emb    = drei.zeilen.find(z => z.titel === 'Gedächtnis bauen');
const sicher = drei.zeilen.find(z => z.titel === 'Sicherung schreiben');

p('Bekannte Gesamtzahl und in Arbeit → Balken', ocr?.balken === true);
gleich('… und er steht auf 43 %', ocr?.breite, '43%');
gleich('… und die Zahl daneben stimmt', ocr?.stand, '34 von 80');

/* `schritte: 0` heisst „unbekannt viele" — das ist im Modell so vorgesehen.
   Ein Balken daraus wäre erfunden. */
p('Unbekannte Gesamtzahl → KEIN Balken', emb?.balken === false);
gleich('… sondern die ehrliche Zahl', emb?.stand, '7 Schritte fertig');

/* GEFUNDEN AUF DEM BILD, nicht von einer Prüfung: hier standen ein leerer
   Balken und das Wort „wartet" untereinander und widersprachen sich. */
p('Noch nicht angefangen → KEIN Balken', sicher?.balken === false);
gleich('… sondern „wartet"', sicher?.stand, 'wartet');

/* ------------------------------------------------------------------------ */
console.log('\n5 · Ein Schritt erreicht die Anzeige');

/* OHNE NEULADEN. Die Anzeige horcht auf den Bus; täte sie es nicht, stünde
   im Fenster bis zum Schliessen der alte Stand. */
const nachSchritt = await pc.evaluate(async (id: string) => {
  const a = await Auftraege.einer(id);
  await Store.auftragPut({ ...a, schritt: 60, text: 'Seite 60' });
  Ereignisse.melde('auftrag.schritt', { id, art: 'ocr', schritt: 60, schritte: 80 });
  await new Promise(r => setTimeout(r, 350));
  const z = [...document.querySelectorAll('.arb-z')]
    .find(x => x.querySelector('b')?.textContent === 'Text aus Bildern lesen');
  return { stand: z?.querySelector('.arb-stand')?.textContent || '',
           breite: (z?.querySelector('.arb-balken i') as HTMLElement)?.style.width || '' };
}, drei.ids[0] as string);
gleich('Das Fenster zeigt den neuen Stand', nachSchritt.stand, '60 von 80');
gleich('Und der Balken ist mitgewandert', nachSchritt.breite, '75%');

/* ------------------------------------------------------------------------ */
console.log('\n4 · Abbrechen bricht wirklich ab');

const abgebrochen = await pc.evaluate(async (id: string) => {
  const b = document.querySelector(`.arb-stopp[data-stopp="${id}"]`) as HTMLElement;
  b.click();
  await new Promise(r => setTimeout(r, 500));
  const a = await Auftraege.einer(id);
  return { zustand: a?.zustand, offen: (await Auftraege.offen()).length,
           zeilen: document.querySelectorAll('.arb-z').length };
}, drei.ids[2] as string);
gleich('Der Auftrag ist abgebrochen', abgebrochen.zustand, 'abgebrochen');
gleich('Und aus der Liste verschwunden', abgebrochen.zeilen, 2);
gleich('Es laufen noch zwei', abgebrochen.offen, 2);

/* ------------------------------------------------------------------------ */
console.log('\n6 · Der Namensraum steht im Verzeichnis');

/* L90: ein neuer Namensraum, der nicht aufgeschrieben ist, kollidiert
   irgendwann. Beim Bau dieses Bogens ist genau das passiert — `auf-` gehört
   längst den Aufgaben, und der Zusammenstoss fiel nur auf, weil das
   Verzeichnis existiert. */
const liste = fs.readFileSync(path.join(WURZEL, 'doku/CSS-NAMENSRAEUME.md'), 'utf-8');
p('`arb` ist eingetragen', /^arb\s+\d+\s+bausteine\.css$/m.test(liste));
const stil = fs.readFileSync(path.join(WURZEL, 'quell/schale/stil/bausteine.css'), 'utf-8');
p('Und die Klassen des Bogens heissen wirklich so',
  /\.arb-kasten/.test(stil) && /\.arb-balken/.test(stil));
p('`auf-leer` gehört weiter den Aufgaben — nicht überschrieben',
  (stil.match(/\.auf-leer\b/g) || []).length >= 1);

p('Keine JS-Fehler', fehler.length === 0, fehler.join(' | '));

console.log(`\n${ok}/${ok + weg} bestanden`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
