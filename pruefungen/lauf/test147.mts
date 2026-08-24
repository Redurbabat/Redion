/* Suite 111 — Zurücknehmen, Mitnehmen, Aufschreiben (D11, D12, D14 · E77)
 * ============================================================================
 * Drei Reste aus dem Durchgang „sagt eines, tut ein anderes":
 *
 *   D11  Der Knopf „Zurücknehmen" nach einem Agentenlauf nahm nur zurück,
 *        was im Protokoll stand — und `zeileAnlegen`, `feldFuellen` trugen
 *        nichts ein. „Zurückgenommen", und 15 überschriebene Notizen
 *        blieben überschrieben.
 *
 *   D12  Der Notion-Import las .md, .csv und .json — und liess alles
 *        andere STUMM fallen. Ein Export mit zwölf Bildern kam als
 *        „8 Seiten übernommen" an, und niemand erfuhr, dass die Bilder
 *        fehlen. Ein PNG erzeugte zudem über `ordnerFuer` eine leere
 *        Doppelseite.
 *
 *   D14  `flush()` meldete Erfolg, sobald die Transaktion ZU ENDE war —
 *        auch wenn sie mit `onabort` endete. Der Kommentar darüber
 *        versprach wörtlich „ERST WENN ES WIRKLICH AUF DER PLATTE STEHT",
 *        und genau dann meldete er auch: die anderen Fenster bekamen
 *        „geändert" für Sätze, die nie ankamen.
 *
 *   node pruefungen/lauf/test147.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8839;

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
const seite = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message));
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

console.log('\n1 · Zurücknehmen nimmt zurück, was der Lauf getan hat (D11)');

/* Nachgestellt ohne KI: das Protokoll, wie `laufen()` es baut, mit einer
   angelegten Zeile und einem überschriebenen Feld — dann `zuruecknehmen`. */
const ruecknahme = await seite.evaluate(async () => {
  const s = Store.addBlock(null, 'page', { text: 'Agentenprobe' });
  const db = Store.addDatabase(s.id, 'Agentendaten', {
    title: { name: 'Titel', type: 'title' },
    notiz: { name: 'Notiz', type: 'text' }
  }, 'table');
  const c = Store.getCollection(db.collectionId);
  const alt = Store.addRow(c.id, { notiz: 'Handgeschrieben' });
  Store.updateBlock(alt.id, { text: 'Bestand' });

  /* Werkzeuge direkt rufen, wie `laufen()` es tut — mit einem Protokoll. */
  const protokoll: any = { agent: 'Probe', auftrag: '', schritte: [],
                           ids: [], felder: [], bleibt: [], zeit: Store.now() };
  const anlegen = (Agent as any).WERKZEUGE.zeileAnlegen;
  await anlegen.lauf({ datenbank: 'Agentendaten',
                       werte: { Titel: 'Vom Agenten', Notiz: 'neu' } }, protokoll);

  /* feldFuellen mit gestellter KI — sie überschreibt die Handnotiz. */
  const echteKI = (KI as any).frageKurz;
  (KI as any).frageKurz = async () => 'KI-Text';
  const fuellen = (Agent as any).WERKZEUGE.feldFuellen;
  const meldung = await fuellen.lauf({ datenbank: 'Agentendaten',
                                       spalte: 'Notiz', auftrag: 'x' }, protokoll);
  (KI as any).frageKurz = echteKI;

  const zwischen = {
    zeilen: Store.rowsOf(c.id).length,
    altNotiz: Store.getBlock(alt.id)?.props?.notiz,
    idsImProtokoll: protokoll.ids.length,
    felderImProtokoll: (protokoll.felder || []).length,
    meldung: String(meldung)
  };

  (Agent as any).zuruecknehmen(protokoll);
  return { ...zwischen,
    zeilenDanach: Store.rowsOf(c.id).length,
    altNotizDanach: Store.getBlock(alt.id)?.props?.notiz };
});
const rn = ruecknahme as any;
gleich('Der Lauf hat eine Zeile angelegt', rn.zeilen, 2);
gleich('… und die Handnotiz überschrieben', rn.altNotiz, 'KI-Text');
p('Die angelegte Zeile steht im Protokoll', rn.idsImProtokoll >= 1,
  String(rn.idsImProtokoll));
p('Die alten Feldwerte stehen im Protokoll', rn.felderImProtokoll >= 1,
  String(rn.felderImProtokoll));
gleich('Zurücknehmen entfernt die angelegte Zeile', rn.zeilenDanach, 1);
gleich('… und stellt die Handnotiz wieder her', rn.altNotizDanach, 'Handgeschrieben');

/* Der Worker kann nicht zurückgenommen werden — dann muss es dastehen. */
const werkzeugQuelle = fs.readFileSync(
  path.join(WURZEL, 'src/bereiche/ki/agenten.ts'), 'utf8');
p('Der Worker trägt sich als „bleibt" ein, statt so zu tun, als ginge es',
  /bleibt/.test(werkzeugQuelle) && /worker/.test(werkzeugQuelle));

console.log('\n2 · Der Notion-Import lässt nichts stumm fallen (D12)');

/* Ein kleines ZIP von Hand: eine Markdown-Seite, ein PNG, eine unbekannte
   Endung. Vorher: „1 Seiten übernommen", PNG weg, .xyz weg, dazu eine
   leere Ordnerseite. */
const notion = await seite.evaluate(async () => {
  const md = new TextEncoder().encode('# Titel\n\nHallo.');
  const png = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
                              1, 2, 3, 4, 5, 6, 7, 8]);
  const fremd = new TextEncoder().encode('???');
  const eintraege = [
    { name: 'Export/Seite.md', inhalt: md },
    { name: 'Export/Bilder/foto.png', inhalt: png },
    { name: 'Export/rest.xyz', inhalt: fremd }
  ];
  const blob = await (Austausch as any).zipSchreiben(
    eintraege.map(e => ({ name: e.name, inhalt: new Blob([e.inhalt]) })));
  const puffer = await blob.arrayBuffer();
  const erg = await (Austausch as any).ausNotionZip(puffer, null);
  const alleUnter = (id: string): any[] => {
    const b = Store.getBlock(id);
    if (!b) return [];
    return [b, ...(b.content || []).flatMap((k: string) => alleUnter(k))];
  };
  const baum = alleUnter(erg.seite.id);
  const bildBloecke = baum.filter(b => b.type === 'image' || b.type === 'file');
  const bildMitDatei = bildBloecke.filter(b => b.dateiId);
  let bytesStimmen = false;
  if (bildMitDatei[0]) {
    const zurueck = await (Dateien as any).alsBlob(bildMitDatei[0].dateiId);
    if (zurueck) {
      const raus = new Uint8Array(await zurueck.arrayBuffer());
      bytesStimmen = raus.length === png.length &&
                     raus.every((x: number, i: number) => x === png[i]);
    }
  }
  return { hinweis: erg.hinweis, bilder: bildBloecke.length,
           mitDatei: bildMitDatei.length, bytesStimmen };
});
const nt = notion as any;
p('Das Bild ist als Block da', nt.bilder >= 1, JSON.stringify(nt));
p('… mit echter Datei dahinter', nt.mitDatei >= 1);
p('… Byte für Byte gleich', nt.bytesStimmen === true);
p('Der Hinweis zählt die Anhänge', /Anhang|Anhänge/.test(nt.hinweis), nt.hinweis);
p('Und der Hinweis verschweigt das Übergangene nicht',
  /ausgelassen|übersprungen|nicht übernommen/.test(nt.hinweis), nt.hinweis);

console.log('\n3 · flush meldet erst, wenn es auf der Platte steht (D14)');

const flushProbe = await seite.evaluate(async () => {
  /* Gesund: flush geht durch. */
  const s = Store.addBlock(null, 'page', { text: 'Flushprobe' });
  await Store.flush();

  /* Krank: die Transaktion bricht ab. Der Abbruch kommt hier über einen
     put, der wirft — `tx.abort()` von aussen wäre ein anderer Weg, aber
     dieser läuft durch genau die Zeilen, um die es geht. */
  const echt = IDBObjectStore.prototype.put;
  (IDBObjectStore.prototype as any).put = function (...a: any[]) {
    if (this.name !== 'blocks') return (echt as any).apply(this, a);
    const anfrage: any = { onsuccess: null, onerror: null,
      error: new DOMException('Absichtlich kaputt', 'UnknownError') };
    setTimeout(() => { if (anfrage.onerror) anfrage.onerror({
      target: anfrage, preventDefault: () => {},
      stopPropagation: () => {} }); }, 0);
    return anfrage;
  };
  Store.updateBlock(s.id, { text: 'Ändert sich nicht auf der Platte' });
  let wie = '';
  try { await Store.flush(); wie = 'kam durch'; }
  catch { wie = 'lehnt ab'; }
  (IDBObjectStore.prototype as any).put = echt;

  /* Und danach geht es wieder. */
  Store.updateBlock(s.id, { text: 'Wieder gesund' });
  let danach = '';
  try { await Store.flush(); danach = 'geht'; } catch { danach = 'bleibt kaputt'; }
  return { wie, danach };
});
gleich('Ein gescheiterter flush lehnt ab', (flushProbe as any).wie, 'lehnt ab');
gleich('Ein gesunder geht weiterhin durch', (flushProbe as any).danach, 'geht');

/* Und die Meldung an die Nachbarfenster bleibt an den Erfolg gebunden. */
const idbQuelle = fs.readFileSync(path.join(WURZEL, 'src/kern/ablage/indexdb.ts'), 'utf8');
p('„geändert" geht nur nach Erfolg hinaus — die Ablehnung wird eigens stillgelegt',
  /fertig\.then\(\(\) => meldeAnAndereFenster\('geaendert', schluessel\), \(\) => \{\}\)/.test(idbQuelle));
p('Abbruch legt die Sätze zurück in den Stapel',
  /zurueckInDenStapel\(posten\);/.test(idbQuelle));

console.log('\n4 · Die Konsole');
p('Kein Skriptfehler', fehler.length === 0, fehler.slice(0, 3).join(' | '));

await browser.close();
server.close();

console.log(`\n  Suite 111 — Zurücknehmen, Mitnehmen, Aufschreiben: ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
