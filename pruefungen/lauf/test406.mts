/* Suite 406 — Werte auf Karten sagen, wovon sie handeln (E411)
 * ============================================================================
 * Auf einer Board-Karte stand: „08.09.2026 10.09.2026 85 ▬ 0 % ★★★☆☆ Lina
 * 📍Bern ☐" — alle Werte in einer Zeile, ohne Namen und ohne Trenner.
 * Welches Datum ist der Anfang? Ist 85 ein Preis oder eine Stückzahl? Was
 * bedeutet das leere Kästchen?
 *
 * Alle Namen anzuschreiben wäre die falsche Antwort gewesen: ein farbiges
 * Status-Etikett erklärt sich selbst, und „Status: Offen" verdoppelt nur die
 * Zeile. Dieselbe Regel wie überall — was IMMER dasteht, wird nicht gelesen.
 *
 *   §1 Nackte Zahlen, Daten und Zeitspannen bekommen ihren Namen.
 *   §2 Etiketten, Sterne und Ortsmarken bekommen KEINEN — sonst wäre die
 *      Regel wertlos.
 *   §3 Zwei Spalten desselben Typs bekommen beide einen Namen, auch wenn
 *      eine allein selbsterklärend wäre.
 *   §4 Das Kontrollkästchen bekommt einen — ein LEERES Kästchen sagt nichts.
 *   §5 Jeder Wert trägt seinen Namen ausserdem als `title`.
 *   §6 Board und Galerie verhalten sich gleich.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 *   §1 → in `steuerung.ts` alle Typen in `SELBSTERKLAEREND` aufnehmen.
 *   §2 → `SELBSTERKLAEREND` leeren. Dann steht überall ein Name, auch am
 *        Status-Etikett, und §2 fällt.
 *   §3 → in `kartenWerte` das `mehrfach ||` streichen.
 * Alle drei gelaufen, Ergebnisse im Bericht zu E411.
 *
 *   node pruefungen/lauf/test406.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9529;

const TYP: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon', '.svg': 'image/svg+xml'
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

const bilderQuelle = fs.readFileSync(path.join(WURZEL, 'bilder.mts'), 'utf8');
const teil = bilderQuelle.slice(bilderQuelle.indexOf('const dbAufbau'),
                                bilderQuelle.indexOf('for (const l of DB_ANSICHTEN)'));
const vorlage = teil.slice(teil.indexOf('`') + 1, teil.lastIndexOf('`'));

const browser = await chromium.launch();
const fehler: string[] = [];

const oeffne = async (layout: string) => {
  const s = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  s.on('pageerror', e => fehler.push(e.message.slice(0, 120)));
  await s.goto(`http://localhost:${PORT}/index.html`);
  await s.waitForFunction("typeof App !== 'undefined' && typeof Store !== 'undefined'",
                          null, { timeout: 30000 });
  await s.waitForTimeout(400);
  await s.evaluate(new Function(vorlage.replace('${layout}', layout)) as any);
  await s.waitForTimeout(900);
  return s;
};

/* Je Wertfeld: welcher Name steht als `title` dran, und ist er auch
   SICHTBAR angeschrieben? */
const WERTE = `(() => [...document.querySelectorAll('.card .meta .mv')].map(m => {
  const n = m.querySelector('.mv-n');
  return { titel: m.getAttribute('title') || '',
           name: n ? n.textContent.trim() : null,
           text: m.textContent.trim().slice(0, 40) };
}))()`;

const s1 = await oeffne('board');
const werte = await s1.evaluate(WERTE) as any[];
p('Es gibt Werte zu prüfen', werte.length >= 20, String(werte.length));

const mitName = (n: string) => werte.filter(w => w.titel === n && w.name === n).length;
const ohneName = (n: string) => werte.filter(w => w.titel === n && w.name === null).length;
const kommt = (n: string) => werte.filter(w => w.titel === n).length;

/* ==========================================================================
 * §1 · WAS SEINEN NAMEN BRAUCHT, BEKOMMT IHN
 * ========================================================================*/
console.log('\n§1 Nackte Werte bekommen ihren Namen');
for (const n of ['Anfang', 'Ende', 'Kosten']) {
  p(`„${n}" ist angeschrieben`, kommt(n) > 0 && ohneName(n) === 0,
    `${kommt(n)} mal da, davon ${ohneName(n)} ohne Namen`);
}

/* ==========================================================================
 * §2 · WAS SICH SELBST ERKLÄRT, BEKOMMT KEINEN
 * --------------------------------------------------------------------------
 * Ohne diesen Abschnitt wäre §1 durch „schreib überall den Namen hin"
 * erfüllbar — und genau das war die falsche Antwort.
 * ========================================================================*/
console.log('\n§2 Was sich selbst erklärt, bleibt ohne');
for (const n of ['Bereich', 'Schlagworte', 'Bewertung', 'Ort']) {
  p(`„${n}" ist NICHT angeschrieben`, kommt(n) > 0 && mitName(n) === 0,
    `${kommt(n)} mal da, davon ${mitName(n)} mit Namen`);
}

/* ==========================================================================
 * §3 · ZWEI SPALTEN DESSELBEN TYPS
 * --------------------------------------------------------------------------
 * „Anfang" und „Ende" sind beide `date` — aber `date` ist ohnehin nicht
 * selbsterklärend, und deshalb hat die Mehrfachregel hier gar keine
 * Wirkung. Das kam bei der Gegenprobe heraus: `mehrfach ||` zu streichen
 * liess die Suite grün. Ein Abschnitt, der nur zufällig grün ist, prüft
 * nichts (§55.2).
 *
 * Der ECHTE Fall braucht zwei SELBSTERKLÄRENDE Spalten desselben Typs —
 * zwei Auswahlspalten etwa. Einzeln ist ein farbiges Etikett lesbar;
 * „Elektro" und „Werkstatt" nebeneinander sagen nicht, was Bereich und was
 * Ort ist. Dafür ein eigener, kleiner Satz.
 * ========================================================================*/
console.log('\n§3 Zwei Spalten desselben Typs');
p('Anfang und Ende sind BEIDE angeschrieben',
  mitName('Anfang') > 0 && mitName('Ende') > 0,
  `Anfang ${mitName('Anfang')}, Ende ${mitName('Ende')}`);

const ZWEI_AUSWAHLEN = `return (async () => {
  Store.setMeta('rundgangGesehen', true);
  document.querySelector('.produkt-onboarding-lage')?.remove();
  document.getElementById('rg-willkommen')?.remove();
  document.getElementById('rg-einladung')?.remove();
  const seite = Store.addPage(null, { text: 'Zwei Auswahlen', icon: '🔤' });
  const { block, collectionId } = Store.addDatabase(seite.id, 'Zwei Auswahlen', {
    titel: { name: 'Titel', type: 'title' },
    a:     { name: 'Bereich',  type: 'select',
             options: [{ name: 'Elektro' }, { name: 'Bericht' }] },
    b:     { name: 'Werkstatt', type: 'select',
             options: [{ name: 'Halle 1' }, { name: 'Halle 2' }] },
    c:     { name: 'Stufe', type: 'status',
             options: [{ name: 'Offen' }, { name: 'Fertig' }] }
  }, 'table');
  for (const [t, a, b2, c] of [['Eins','Elektro','Halle 1','Offen'],
                               ['Zwei','Bericht','Halle 2','Fertig']]) {
    const r = Store.addRow(collectionId, { title: t });
    Store.setProp(r.id, 'a', a); Store.setProp(r.id, 'b', b2); Store.setProp(r.id, 'c', c);
  }
  const view = Store.addView(collectionId, 'gallery');
  Store.updateBlock(block.id, { aktiveView: view.id });
  await Store.flush();
  App.oeffne(seite.id);
  await new Promise(r => setTimeout(r, 900));
})();`;

const s3 = await browser.newPage({ viewport: { width: 1280, height: 900 } });
s3.on('pageerror', e => fehler.push(e.message.slice(0, 120)));
await s3.goto(`http://localhost:${PORT}/index.html`);
await s3.waitForFunction("typeof App !== 'undefined' && typeof Store !== 'undefined'",
                         null, { timeout: 30000 });
await s3.waitForTimeout(400);
await s3.evaluate(new Function(ZWEI_AUSWAHLEN) as any);
await s3.waitForTimeout(900);
const zw = await s3.evaluate(WERTE) as any[];
const zMit = (n: string) => zw.filter(w => w.titel === n && w.name === n).length;

p('Der Satz mit zwei Auswahlspalten steht', zw.length >= 4, String(zw.length));
p('Beide Auswahlspalten sind angeschrieben, obwohl Auswahl sonst nicht',
  zMit('Bereich') === 2 && zMit('Werkstatt') === 2,
  `Bereich ${zMit('Bereich')}, Werkstatt ${zMit('Werkstatt')}`);
/* Und die dritte, die als EINZIGE ihres Typs dasteht, bleibt ohne — sonst
   wäre der Abschnitt auch durch „schreib alles an" erfüllbar. */
p('Die einzelne Status-Spalte bleibt ohne Namen', zMit('Stufe') === 0,
  String(zMit('Stufe')));
await s3.close();

/* ==========================================================================
 * §4 · DAS LEERE KÄSTCHEN
 * ========================================================================*/
console.log('\n§4 Das Kontrollkästchen');
p('„Erledigt" ist angeschrieben', kommt('Erledigt') > 0 && ohneName('Erledigt') === 0,
  `${kommt('Erledigt')} mal da, davon ${ohneName('Erledigt')} ohne Namen`);

/* ==========================================================================
 * §5 · DER TITLE STEHT IMMER
 * ========================================================================*/
console.log('\n§5 Jeder Wert trägt seinen Namen als title');
const ohneTitel = werte.filter(w => !w.titel);
p('Kein Wert ohne title', ohneTitel.length === 0,
  ohneTitel.slice(0, 3).map(w => w.text).join(' | '));
p('Und der title ist nie leerer Text',
  werte.every(w => w.titel.trim().length > 0));

/* ==========================================================================
 * §6 · GALERIE VERHÄLT SICH GLEICH
 * ========================================================================*/
console.log('\n§6 Galerie genauso');
await s1.close();
const s6 = await oeffne('gallery');
const gw = await s6.evaluate(WERTE) as any[];
const gMit = (n: string) => gw.filter(w => w.titel === n && w.name === n).length;
const gOhne = (n: string) => gw.filter(w => w.titel === n && w.name === null).length;
p('Auch hier gibt es Werte', gw.length >= 20, String(gw.length));
p('„Kosten" ist auch in der Galerie angeschrieben', gMit('Kosten') > 0 && gOhne('Kosten') === 0,
  `${gMit('Kosten')} mit, ${gOhne('Kosten')} ohne`);
p('„Bereich" bleibt auch in der Galerie ohne Namen', gMit('Bereich') === 0,
  String(gMit('Bereich')));
/* Die Galerie zeigt AUCH den Status — das Board nicht, weil danach
   gruppiert wird. Beides ist richtig, und der Unterschied gehört geprüft. */
p('Die Galerie zeigt den Status, das Board nicht',
  gw.some(w => w.titel === 'Status') && !werte.some(w => w.titel === 'Status'));
await s6.close();

/* ======================================================================== */
p('Keine Fehler auf der Konsole', fehler.length === 0, fehler.slice(0, 3).join(' · '));

await browser.close();
server.close();
console.log(`\n${ok} von ${ok + weg} Prüfungen grün`);
process.exit(weg ? 1 : 0);
