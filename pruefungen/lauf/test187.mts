/* Suite 153 — „Quelltext ansehen" ist kein Löschknopf (E113)
 * ============================================================================
 * `ausMarkdown` leert die Seite (`Store.kinderLeeren`) und baut sie aus dem
 * Text neu auf. Gerettet wurden dabei VIER Blockarten namentlich:
 * `database`, `whiteboard`, `chart`, `table`. Alle anderen fielen durch.
 *
 * Gemessen an einer Schulaufgabe, bevor das hier geschrieben wurde:
 *
 *     vorher   9 Blöcke · 1 PDF-Seite · 1 Blatt · 3 Spalten · 2 Striche
 *     nachher  3 Blöcke · 0           · 0       · 0         · 0
 *
 * Ein Klick auf „Übernehmen", und die Klausur ist weg. Der Kopfkommentar
 * derselben Funktion sagte es sogar voraus — „Ohne das wäre ‚Quelltext
 * ansehen und schliessen' ein Datenverlust" —, und die Liste darunter wurde
 * trotzdem bei `spreadsheet` (E29), `columns`/`spalte` (E102), `blatt`
 * (E100) und `pdfseite` (E103) vergessen.
 *
 * DIE LISTE STEHT SEIT E113 ANDERSHERUM. Sie zählt auf, was Markdown
 * WIRKLICH trägt; alles Übrige bekommt von sich aus einen Platzhalter. Diese
 * Suite prüft beide Richtungen — und zwar nicht, ob die Liste stimmt,
 * sondern ob nach einem Rundlauf noch alles da ist.
 *
 *   node pruefungen/lauf/test187.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8941;

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
  p(n, ist === soll, `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

const browser = await chromium.launch();
const seite = await browser.newPage();
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message));
await seite.setViewportSize({ width: 1300, height: 850 });
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForTimeout(2400);
await seite.evaluate(() => {
  Store.setMeta('rundgangGesehen', true);
  document.getElementById('rg-willkommen')?.remove();
  /* Und die Einrichtung der Hauptwelten: sie legt sich beim ersten Start
     über alles und fängt Klicks ab (E132). */
  document.querySelector('.produkt-onboarding-lage')?.remove();
  document.getElementById('rg-einladung')?.remove();
});

/* ==========================================================================
 * §1 · Der Rundlauf mit einer echten Schulaufgabe
 * ========================================================================*/
console.log('\n1 · Der Rundlauf mit einer echten Schulaufgabe');

const rund = await seite.evaluate(async () => {
  const s = Store.addPage(null, { text: 'Schulaufgabe' });
  Store.addBlock(s.id, 'h1', { text: 'Mathe' });
  const c  = Store.addBlock(s.id, 'columns', { text: '', spalten: 2 });
  const li = Store.addBlock(c.id, 'spalte', { text: '' });
  const re = Store.addBlock(c.id, 'spalte', { text: '' });
  Store.addBlock(li.id, 'pdfseite', {
    text: '', nr: 1, vonSeiten: 2, bw: 595, bh: 842,
    quelleId: 'q1', suchtext: 'Aufgabe 1: Berechne x',
    marken: [{ id: 'm1', art: 'stift', farbe: '#d64545', breite: 2.4,
               pts: [[10, 10], [90, 90]] }] });
  const bl = Store.addBlock(re.id, 'blatt', {
    text: '', blattBreite: 595, blattHoehe: 842,
    marken: [{ id: 'm2', art: 'stift', farbe: '#2f7ed8', breite: 5,
               pts: [[20, 20], [80, 80]] }] });
  Store.addBlock(bl.id, 'text', { text: 'Meine Antwort: x = 11' });
  Store.addBlock(s.id, 'spreadsheet', { text: '', zellen: { A1: { w: '42' } } });
  Store.addBlock(s.id, 'table', { text: '', rows: [['Jahr', 'Wert'], ['2026', '19']] });
  const tg = Store.addBlock(s.id, 'toggle', { text: 'Mehr dazu' });
  Store.addBlock(tg.id, 'text', { text: 'Versteckter Satz' });
  Store.addBlock(s.id, 'bullet', { text: 'Punkt eins' });
  Store.addBlock(s.id, 'text', { text: 'Ein Schlusssatz.' });

  const bild = (id: string) => {
    const alle: any[] = [];
    const gehe = (x: string, t: number): void => {
      if (t > 8) return;
      for (const b of Store.childrenOf(x)) { alle.push(b); gehe(b.id, t + 1); }
    };
    gehe(id, 0);
    return {
      arten: alle.map(b => b.type).join(','),
      gesamt: alle.length,
      marken: alle.reduce((n, b) => n + ((b.marken || []).length), 0),
      strichFarben: alle.flatMap(b => (b.marken || []).map((m: any) => m.farbe)).sort().join(','),
      suchtext: alle.filter(b => b.suchtext === 'Aufgabe 1: Berechne x').length,
      zellen: JSON.stringify(alle.find(b => b.type === 'spreadsheet')?.zellen || null),
      tabelle: JSON.stringify(alle.find(b => b.type === 'table')?.rows || null),
      antwort: alle.filter(b => (b.text || '').includes('x = 11')).length,
      versteckt: alle.filter(b => (b.text || '').includes('Versteckter Satz')).length,
    };
  };

  const vorher = bild(s.id);
  const md = Werkzeuge.alsMarkdown(Store.getBlock(s.id));
  Werkzeuge.ausMarkdown(Store.getBlock(s.id), md);
  const nachher = bild(s.id);
  /* Und noch einmal — ein zweiter Rundlauf darf auch nichts kosten. */
  Werkzeuge.ausMarkdown(Store.getBlock(s.id), Werkzeuge.alsMarkdown(Store.getBlock(s.id)));
  const zweimal = bild(s.id);
  return { vorher, nachher, zweimal, md, seiteId: s.id };
});

gleich('Es sind vorher dreizehn Blöcke', rund.vorher.gesamt, 13);
gleich('Und sie stehen in dieser Ordnung', rund.vorher.arten,
  'h1,columns,spalte,pdfseite,spalte,blatt,text,spreadsheet,table,' +
  'toggle,text,bullet,text');
gleich('Und danach genauso viele', rund.nachher.gesamt, rund.vorher.gesamt);
gleich('In derselben Reihenfolge und Art', rund.nachher.arten, rund.vorher.arten);
gleich('Die Striche sind alle noch da', rund.nachher.marken, 2);
gleich('Und es sind dieselben', rund.nachher.strichFarben, rund.vorher.strichFarben);
gleich('Der Suchtext der PDF-Seite auch (E107)', rund.nachher.suchtext, 1);
gleich('Die Zellen des Rechenblatts', rund.nachher.zellen, rund.vorher.zellen);
gleich('Die Zeilen der Tabelle', rund.nachher.tabelle, rund.vorher.tabelle);
gleich('Die Antwort auf dem Blatt', rund.nachher.antwort, 1);
gleich('Und der Satz im zugeklappten Toggle', rund.nachher.versteckt, 1);
gleich('Zweimal hin und her ändert nichts', rund.zweimal.arten, rund.vorher.arten);
gleich('Auch nicht an den Strichen', rund.zweimal.marken, 2);

/* ==========================================================================
 * §2 · Und der Text bleibt trotzdem lesbar
 * --------------------------------------------------------------------------
 * Alles zum Platzhalter zu machen wäre auch verlustfrei — und nutzlos. Was
 * Markdown trägt, MUSS als Markdown dastehen, sonst ist der Knopf keiner.
 * ========================================================================*/
console.log('\n2 · Und der Text bleibt trotzdem lesbar');

p('Die Überschrift steht als Überschrift', /^# Mathe$/m.test(rund.md), rund.md.slice(0, 40));
p('Der Listenpunkt als Listenpunkt', /^- Punkt eins$/m.test(rund.md));
p('Der Schlusssatz als Satz', /^Ein Schlusssatz\.$/m.test(rund.md));
gleich('Die Spalten stehen als EIN Platzhalter',
  (rund.md.match(/<!--blk:/g) || []).length, 3);
p('Die Tabelle behält ihre alte Marke (test89)',
  /<!--tab:[A-Za-z0-9_-]+-->/.test(rund.md),
  (rund.md.match(/<!--[a-z]+:/g) || []).join(' '));
p('Neben dem Platzhalter steht, was dort liegt',
  /<!--blk:[A-Za-z0-9_-]+--> Zwei Spalten/.test(rund.md) &&
  /<!--blk:[A-Za-z0-9_-]+--> Kalkulationstabelle/.test(rund.md),
  (rund.md.match(/<!--blk:[^>]+-->.*/g) || []).join(' | '));
/* NICHTS SICKERT AUS EINEM PLATZHALTER HERAUS. Die PDF-Seite, das Blatt und
   der Satz darauf hängen unter der Spalte; `alsMarkdown` darf dort gar nicht
   erst hinabsteigen. Gezählt statt gesucht: in der Gegenprobe kamen die
   Kinder als eingerückte Leerzeilen mit heraus, und ein `!/PDF-Seite/`
   hätte das nicht bemerkt (§55.2). */
gleich('Der Text hat genau sieben Zeilen — nichts sickert heraus',
  rund.md.split('\n').length, 7);
p('Und die PDF-Seite ist keine davon',
  !/PDF-Seite/.test(rund.md), rund.md);

/* ==========================================================================
 * §3 · Wenn die Art allein nicht reicht
 * --------------------------------------------------------------------------
 * Drei Blockarten stehen in der Liste und tragen trotzdem manchmal mehr, als
 * Markdown abbilden kann. Dann muss der BLOCK entscheiden, nicht die Art.
 * ========================================================================*/
console.log('\n3 · Wenn die Art allein nicht reicht');

const fall = await seite.evaluate(async () => {
  const s = Store.addPage(null, { text: 'Grenzfälle' });
  /* Ein Bild aus der Ablage: `src` ist leer, die Datei hängt an `dateiId`. */
  const satz = await Dateien.ablegen(
    new File([new Uint8Array([1, 2, 3, 4])], 'foto.png', { type: 'image/png' }), {});
  Store.addBlock(s.id, 'image', { text: '', src: '', dateiId: satz.id, caption: 'Mein Foto' });
  /* Ein Bild aus dem Netz: nur `src`, das trägt Markdown. */
  Store.addBlock(s.id, 'image', { text: '', src: 'https://beispiel.de/x.png', caption: 'Fremd' });
  /* Eine GELERNTE Karteikarte — der Lernstand ist das Wertvolle daran. */
  Store.addBlock(s.id, 'flashcard', { text: 'Was ist 2+2? :: 4',
    sr: { faelligkeit: '2026-12-01', intervall: 40, leichtigkeit: 2.6, zuletzt: '2026-08-19' } });
  /* Eine ungelernte — die darf durch Markdown. */
  Store.addBlock(s.id, 'flashcard', { text: 'Was ist 3+3? :: 6' });
  /* Ein Callout mit eigenem Zeichen. */
  Store.addBlock(s.id, 'callout', { text: 'Achtung', icon: '🔥' });
  /* Und einer mit dem gewöhnlichen. */
  Store.addBlock(s.id, 'callout', { text: 'Hinweis', icon: '💡' });

  const md = Werkzeuge.alsMarkdown(Store.getBlock(s.id));
  Werkzeuge.ausMarkdown(Store.getBlock(s.id), md);
  const k = Store.childrenOf(s.id);
  return {
    md,
    dateiIds: k.filter((b: any) => b.dateiId).length,
    fremdSrc: k.filter((b: any) => b.src === 'https://beispiel.de/x.png').length,
    lernstand: k.filter((b: any) => b.sr && b.sr.intervall === 40).length,
    karten: k.filter((b: any) => b.type === 'flashcard').length,
    feuer: k.filter((b: any) => b.icon === '🔥').length,
    arten: k.map((b: any) => b.type).join(','),
  };
});

gleich('Das Bild aus der Ablage behält seine Datei', fall.dateiIds, 1);
gleich('Das Bild aus dem Netz steht als Markdown da',
  (fall.md.match(/!\[Fremd\]\(https:\/\/beispiel\.de\/x\.png\)/g) || []).length, 1);
gleich('Und kommt als Bild zurück', fall.fremdSrc, 1);
gleich('Der Lernstand der gelernten Karte ist unversehrt', fall.lernstand, 1);
gleich('Beide Karten sind noch da', fall.karten, 2);
gleich('Die ungelernte ging durch Markdown',
  (fall.md.match(/^\?\? Was ist 3\+3/m) || []).length, 1);
gleich('Das eigene Zeichen des Callouts bleibt', fall.feuer, 1);
gleich('Und alle sechs Blöcke stehen noch',
  fall.arten, 'image,image,flashcard,flashcard,callout,callout');

/* ==========================================================================
 * §4 · Eine gelöschte Zeile löscht wirklich
 * --------------------------------------------------------------------------
 * Der Platzhalter darf kein Schutzschild sein: wer die Zeile herausnimmt,
 * will den Block loswerden. Sonst wäre „Quelltext ansehen" nur noch zum
 * Ansehen da.
 * ========================================================================*/
console.log('\n4 · Eine gelöschte Zeile löscht wirklich');

const geloescht = await seite.evaluate(() => {
  const s = Store.addPage(null, { text: 'Wegnehmen' });
  Store.addBlock(s.id, 'text', { text: 'Bleibt' });
  Store.addBlock(s.id, 'spreadsheet', { text: '', zellen: { A1: { w: '7' } } });
  const md = Werkzeuge.alsMarkdown(Store.getBlock(s.id));
  const ohne = md.split('\n').filter(z => !/<!--blk:/.test(z)).join('\n');
  Werkzeuge.ausMarkdown(Store.getBlock(s.id), ohne);
  const k = Store.childrenOf(s.id);
  return { arten: k.map((b: any) => b.type).join(','), anzahl: k.length };
});
gleich('Ohne die Platzhalter-Zeile ist das Rechenblatt weg', geloescht.arten, 'text');
gleich('Und nur der Text bleibt', geloescht.anzahl, 1);

/* ==========================================================================
 * §5 · Der Mensch erfährt es vorher
 * ========================================================================*/
console.log('\n5 · Der Mensch erfährt es vorher');

const dialog = await seite.evaluate(async (id: string) => {
  const p = Store.getBlock(id);
  Werkzeuge.quelltext(p);
  await new Promise(r => setTimeout(r, 200));
  const o = document.querySelector('.overlay');
  const hinweis = o?.querySelector('.hint')?.textContent || '';
  const vorher = (await Store.versionen(id)).length;
  /* Text ändern und übernehmen — nur dann wird gesichert. */
  const ta = o?.querySelector('#mdq') as HTMLTextAreaElement | null;
  if (ta) ta.value = ta.value + '\nNoch ein Satz.';
  (o?.querySelector('[data-a="ok"]') as HTMLElement)?.click();
  /* `versionSpeichern` wird ohne `await` gerufen (werkzeuge.ts) — also
     warten, bis die Fassung wirklich im Fach steht, nicht bloss angestossen
     ist. Eine feste Wartezeit wäre flockig. */
  for (let i = 0; i < 60; i++) {
    if ((await Store.versionen(id)).length > vorher) break;
    await new Promise(r => setTimeout(r, 50));
  }
  const nachher = await Store.versionen(id);
  return { hinweis, vorher, nachher: nachher.length,
           letzte: nachher[nachher.length - 1]?.anlass || '',
           offen: !!document.querySelector('.overlay') };
}, rund.seiteId);

p('Der Hinweis nennt die Platzhalter-Zeilen',
  dialog.hinweis.includes('blk:'), dialog.hinweis.slice(0, 80));
p('Er sagt, was verloren geht',
  /Farben/.test(dialog.hinweis) && /Schriftgrössen|Schriftgrößen/.test(dialog.hinweis),
  dialog.hinweis.slice(0, 200));
p('Und dass vorher gesichert wird', /Fassung wird vorher gesichert/.test(dialog.hinweis));
gleich('Es wurde wirklich eine Fassung gesichert', dialog.nachher, dialog.vorher + 1);
gleich('Mit dem passenden Grund', dialog.letzte, 'vor Quelltext-Änderung');
p('Und der Dialog ist danach zu', !dialog.offen);

/* ==========================================================================
 * §6 · Was der Quelltext verspricht
 * ========================================================================*/
console.log('\n6 · Was der Quelltext verspricht');

const roh = fs.readFileSync(
  path.join(WURZEL, 'src/bereiche/wissen/dienst.ts'), 'utf8');
const code = roh.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

gleich('Die Liste steht GENAU EINMAL da',
  (code.match(/const MD_TRAEGT = /g) || []).length, 1);
gleich('Beide Richtungen und der ID-erhaltende Vault-Weg fragen dieselbe Funktion',
  (code.match(/mdTraegt\(b\)/g) || []).length, 3);
p('Die alte namentliche Liste gibt es nicht mehr',
  !/\['database','whiteboard','chart','table'\]\.includes/.test(code),
  (code.match(/.{0,50}includes\(b\.type\).{0,20}/) || [''])[0]);

p('Keine Fehler auf der Seite', fehler.length === 0, fehler.join(' | '));

await browser.close();
server.close();
console.log(`\n${ok} bestanden, ${weg} durchgefallen`);
process.exit(weg ? 1 : 0);
