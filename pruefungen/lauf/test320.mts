/* Suite 320 — Der erste Bereich hängt an der Auftragsmaschine (L103 Punkt 1, E327)
 * ============================================================================
 * E286 baute die Auftragsmaschine, E322 gab ihr ein Fenster, E323 die
 * Absprache zwischen Tabs. Was fehlte, war ein Bereich, der sie BENUTZT:
 * `Auftraege.arten()` gab eine leere Liste zurück. Eine Maschine ohne
 * Auftrag ist §47 in seiner grössten Form.
 *
 * Angeschlossen ist das Zurückholen der Seitenbilder — nicht das Einlesen
 * selbst. Der Grund steht in L103: es hat seine Wiederaufnahme schon, und
 * zwar als Neu-Herleitung. `ohneBild` fragt bei jedem Lauf den Bestand, was
 * noch fehlt. Ein Auftrag daraus zu machen kostet keine neue Zustandsführung.
 *
 *   §1 DIE ART IST ANGEMELDET — und die Liste war vorher leer.
 *   §2 EIN ANSTOSS = EIN AUFTRAG, mit abgeleiteter Kennung. Zweimal auch.
 *   §3 ER RECHNET WIRKLICH: die Bilder sind danach da.
 *   §4 WIEDERAUFNAHME: nach dem Neustart macht er WEITER, nicht von vorn —
 *      gemessen an den Dateisätzen, nicht am Gefühl.
 *   §5 ABBRECHEN hält an, und das Gerechnete bleibt.
 *   §6 GEGENPROBE: ohne offene Seite kein Auftrag; ohne Original EIN
 *      Versuch mit klarer Meldung statt dreier stiller.
 *
 *   node pruefungen/lauf/test320.mts
 * ==========================================================================*/
declare const Store: any; declare const App: any;
declare const Auftraege: any; declare const PdfEinlesen: any;
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9323;

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll),
    `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

/* ---------------------------------------------------------------------------
 * Ein echtes PDF, von Hand gebaut — derselbe Bauplan wie in test177.
 * Vier Seiten, damit „ein Teil ist fertig, der Rest folgt" überhaupt
 * messbar ist.
 * ------------------------------------------------------------------------- */
const alsText = (s: string): string =>
  s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

const machPdf = (seiten: Array<[string, string[]]>): Buffer => {
  const objekte: Buffer[] = [];
  const neu = (inhalt: Buffer | string): number => {
    objekte.push(Buffer.isBuffer(inhalt) ? inhalt : Buffer.from(inhalt, 'latin1'));
    return objekte.length;
  };
  const seitenNr = neu('');
  const schrift = neu('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  const kids: number[] = [];
  for (const [titel, zeilen] of seiten) {
    const strom: string[] = [`BT /F1 36 Tf 60 740 Td (${alsText(titel)}) Tj ET`];
    let y = 690;
    for (const z of zeilen) {
      strom.push(`BT /F1 18 Tf 60 ${y} Td (${alsText(z)}) Tj ET`); y -= 30;
    }
    strom.push('2 w 30 30 535 782 re S');
    const roh = Buffer.from(strom.join('\n'), 'latin1');
    const inhalt = neu(Buffer.concat([
      Buffer.from(`<< /Length ${roh.length} >>\nstream\n`, 'latin1'), roh,
      Buffer.from('\nendstream', 'latin1')]));
    kids.push(neu('<< /Type /Page /Parent 1 0 R /MediaBox [0 0 595 842] ' +
      `/Resources << /Font << /F1 ${schrift} 0 R >> >> /Contents ${inhalt} 0 R >>`));
  }
  objekte[seitenNr - 1] = Buffer.from(
    `<< /Type /Pages /Count ${kids.length} /Kids [${kids.map(k => k + ' 0 R').join(' ')}] >>`,
    'latin1');
  const wurzel = neu(`<< /Type /Catalog /Pages ${seitenNr} 0 R >>`);
  let aus = Buffer.from('%PDF-1.4\n', 'latin1');
  const stellen: number[] = [];
  objekte.forEach((o, i) => {
    stellen.push(aus.length);
    aus = Buffer.concat([aus, Buffer.from(`${i + 1} 0 obj\n`, 'latin1'), o,
                         Buffer.from('\nendobj\n', 'latin1')]);
  });
  const xref = aus.length;
  let tab = `xref\n0 ${objekte.length + 1}\n0000000000 65535 f \n`;
  stellen.forEach(s => { tab += String(s).padStart(10, '0') + ' 00000 n \n'; });
  tab += `trailer\n<< /Size ${objekte.length + 1} /Root ${wurzel} 0 R >>\n` +
         `startxref\n${xref}\n%%EOF\n`;
  return Buffer.concat([aus, Buffer.from(tab, 'latin1')]);
};

const PDF = machPdf([
  ['Grundlagen',  ['1)  Ohmsches Gesetz', '2)  Leistung P = U * I']],
  ['Messtechnik', ['1)  Was misst ein Ohmmeter?', '2)  Innenwiderstand']],
  ['Installation',['1)  Aderfarben nach DIN', '2)  Schutzleiter']],
  ['Sicherheit',  ['1)  Fuenf Sicherheitsregeln', '2)  RCD-Ausloesestrom']]
]);

/* ------------------------------------------------------------------------ */
const TYP: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.json': 'application/json', '.mjs': 'text/javascript',
  '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon',
  '.wasm': 'application/wasm'
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
pc.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 160)));
await pc.goto(`http://localhost:${PORT}/index.html`);
await pc.waitForTimeout(2600);

/* ==========================================================================
 * §1 · Die Art ist angemeldet
 * ========================================================================*/
console.log('\n1 · Die Maschine kennt endlich eine Art');

const arten = await pc.evaluate(() => ({
  liste: Auftraege.arten(),
  griffe: [typeof Auftraege.anlegen, typeof Auftraege.einer, typeof Auftraege.stopp]
}));

p('`pdf-bilder` ist angemeldet', arten.liste.includes('pdf-bilder'),
  JSON.stringify(arten.liste));
/* GEGENPROBE ZUM BOGEN SELBST: vor E327 war diese Liste LEER — das war
   L103 Punkt 1 im Wortlaut. Ein Bogen, der eine leere Liste füllt, muss
   zeigen, dass sie nicht mehr leer ist. */
p('Und die Liste ist damit nicht mehr leer', arten.liste.length >= 1,
  String(arten.liste.length));
gleich('Die drei Griffe, die dieser Bogen braucht, gibt es',
  arten.griffe, ['function', 'function', 'function']);

/* ==========================================================================
 * Vorbereitung: ein PDF einlesen, dann die Bilder wegnehmen
 * --------------------------------------------------------------------------
 * Genau der Zustand nach dem Einspielen einer `.redion`: die Seiten sind
 * da, die abgeleiteten Bilder nicht (E103).
 * ========================================================================*/
await pc.evaluate(async () => {
  Store.setMeta('rundgangGesehen', true);
  await Store.flush();
});
await pc.reload();
await pc.waitForTimeout(2600);

await pc.evaluate(async () => {
  document.querySelectorAll('.overlay').forEach(o => o.remove());
  const s = Store.addPage(null, { text: 'Elektro-Skript' });
  App.oeffne(s.id);
});
await pc.waitForFunction(() => !!document.getElementById('scroll'), null, { timeout: 15000 });

await pc.evaluate((hex: string) => {
  const bytes = Uint8Array.from((hex.match(/../g) || []).map(h => parseInt(h, 16)));
  const datei = new File([bytes], 'elektro.pdf', { type: 'application/pdf' });
  const dt = new DataTransfer();
  dt.items.add(datei);
  document.getElementById('scroll')!.dispatchEvent(
    new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true }));
}, PDF.toString('hex'));

await pc.waitForSelector('.overlay [data-w="untereinander"]', { timeout: 20000 });
await pc.click('.overlay [data-w="untereinander"]');
await pc.waitForFunction(
  () => Object.values(Store.cache.blocks || {})
    .filter((b: any) => b.type === 'pdfseite' && b.alive && b.bildDateiId).length >= 4,
  null, { timeout: 90000 });

/**
 * Die Bilder wegnehmen — auf BEIDE Weisen, die es wirklich gibt.
 *
 * Die halbe Miete steckt im zweiten Fall: nach dem Einspielen einer
 * Sicherung trägt der Block noch seine ALTE `bildDateiId`, aber die Datei
 * dahinter kam nicht mit. Wer nur auf das Vorhandensein der Kennung sieht,
 * hält genau diese Seiten für fertig.
 */
const vorbereitet = await pc.evaluate(async () => {
  /* DIE MASCHINE LÄUFT WEITER, und das ist Absicht.
     Der erste Anlauf dieser Suite hielt sie mit `Auftraege.stopp()` an und
     taktete von Hand — und mass danach lauter Nullen: `takten()` steigt
     bei `!bereit` sofort aus (maschine.ts:247). Der Fehler war also der
     Prüflauf, nicht das Erzeugnis.
     Und der Umweg war ohnehin keiner: `anlegen` stösst selbst einen Takt
     an, es gibt keine vier Sekunden zu überbrücken. Gewartet wird auf das,
     was auch der Mensch sieht — dass der Auftrag zu Ende ist. */
  (globalThis as any).warteAufEnde = async (id: string, msMax = 90000) => {
    const bis = Date.now() + msMax;
    for (;;) {
      const a = await Auftraege.einer(id);
      if (a && JobModell.beendet(a)) return a;
      if (Date.now() > bis) throw new Error('Auftrag ' + id + ' wurde nicht fertig: ' +
                                            JSON.stringify(a && a.zustand));
      await new Promise(r => setTimeout(r, 120));
    }
  };
  await Auftraege.leeren();

  const seiten = (Object.values(Store.cache.blocks) as any[])
    .filter(b => b && b.alive !== false && b.type === 'pdfseite')
    .sort((a, b) => (Number(a.nr) || 0) - (Number(b.nr) || 0));
  const quelleId = seiten[0]?.quelleId || '';

  for (let i = 0; i < seiten.length; i++) {
    const b = seiten[i];
    const alt = b.bildDateiId;
    if (alt) { await Dateien.weg(alt); }
    /* Zwei Seiten verlieren die Kennung ganz, zwei behalten eine, die ins
       Leere zeigt. */
    if (i % 2 === 0) Store.updateBlock(b.id, { bildDateiId: '' });
  }
  await Store.flush();

  const offen = await PdfEinlesen.ohneBild(quelleId);
  return { quelleId, seiten: seiten.length, offen: offen.length,
           mitLeererKennung: seiten.filter((_: any, i: number) => i % 2 === 1).length };
});

console.log('\n   (vorbereitet: ' + vorbereitet.seiten + ' Seiten, ' +
            vorbereitet.offen + ' ohne Bild)');
gleich('Alle vier Seiten gelten als bildlos', vorbereitet.offen, 4);
p('Darunter zwei mit einer Kennung, die ins Leere zeigt',
  vorbereitet.mitLeererKennung === 2, String(vorbereitet.mitLeererKennung));

/* ==========================================================================
 * §2 · Ein Anstoss ergibt EINEN Auftrag
 * ========================================================================*/
console.log('\n2 · Ein Anstoss, ein Auftrag — auch bei zwei Klicks');

const angelegt = await pc.evaluate(async (quelleId: string) => {
  const a1 = await PdfEinlesen.neuBerechnen(quelleId);
  const a2 = await PdfEinlesen.neuBerechnen(quelleId);   /* der zweite Klick */
  const alle = await Auftraege.alle();
  return {
    id1: a1?.auftrag?.id || '', id2: a2?.auftrag?.id || '',
    schon: !!a2?.schon, wieViele: alle.length,
    art: a1?.auftrag?.art || '', schritte: a1?.auftrag?.schritte,
    zustand: a1?.auftrag?.zustand, eingabe: a1?.auftrag?.eingabe,
    text: a1?.auftrag?.text || '', maxVersuche: a1?.auftrag?.maxVersuche
  };
}, vorbereitet.quelleId);

gleich('Es gibt genau EINEN Auftrag', angelegt.wieViele, 1);
p('Der zweite Klick findet denselben', angelegt.id1 === angelegt.id2 && angelegt.schon,
  angelegt.id1 + ' gegen ' + angelegt.id2 + ', schon=' + angelegt.schon);
p('Die Kennung leitet sich aus dem Dokument ab',
  angelegt.id1 === 'pdfbild-' + vorbereitet.quelleId, angelegt.id1);
gleich('Art, Zustand und Schrittzahl stimmen',
  [angelegt.art, angelegt.zustand, angelegt.schritte], ['pdf-bilder', 'wartet', 4]);
gleich('Die Eingabe ist die Kennung des Originals — sonst nichts',
  angelegt.eingabe, { quelleId: vorbereitet.quelleId });
p('Der Text nennt das Dokument beim Namen', /elektro\.pdf/.test(angelegt.text),
  angelegt.text);
/* KEINE WIEDERHOLUNGEN: hier ist kein Fehlschlag vorübergehend. */
gleich('Und höchstens ein Versuch', angelegt.maxVersuche, 1);

/* ==========================================================================
 * §3 · Er rechnet wirklich
 * ========================================================================*/
console.log('\n3 · Er rechnet wirklich — und die Bilder sind echt');

/**
 * Ein Takt nimmt HÖCHSTENS EINEN Auftrag und arbeitet ihn ganz ab — hier
 * also alle vier Seiten in einem Zug. Angestossen hat ihn schon `anlegen`
 * in §2; gewartet wird nur noch auf das Ende.
 */
const gerechnet = await pc.evaluate(async (quelleId: string) => {
  await (globalThis as any).warteAufEnde('pdfbild-' + quelleId);
  const seiten = (Object.values(Store.cache.blocks) as any[])
    .filter(b => b && b.alive !== false && b.type === 'pdfseite')
    .sort((a, b) => (Number(a.nr) || 0) - (Number(b.nr) || 0));
  const auftrag = await Auftraege.einer('pdfbild-' + quelleId);
  /* ECHT HEISST: die Datei liegt da und hat Bytes. Eine Kennung am Block
     ist kein Bild — das ist der Fehler, den `ohneBild` gerade abfängt. */
  const bytes: number[] = [];
  for (const b of seiten) {
    const blob = b.bildDateiId ? await Dateien.alsBlob(b.bildDateiId) : null;
    bytes.push(blob ? blob.size : 0);
  }
  return {
    zustand: auftrag?.zustand, schritt: auftrag?.schritt,
    mitBild: seiten.filter((b: any) => b.bildDateiId).length,
    bytes, offen: (await PdfEinlesen.ohneBild(quelleId)).length,
    stand: auftrag?.stand
  };
}, vorbereitet.quelleId);

gleich('Der Auftrag ist fertig', gerechnet.zustand, 'fertig');
gleich('Vier Schritte gemeldet', gerechnet.schritt, 4);
gleich('Alle vier Seiten haben wieder eine Kennung', gerechnet.mitBild, 4);
p('Und hinter jeder liegen echte Bytes',
  gerechnet.bytes.length === 4 && gerechnet.bytes.every(n => n > 500),
  JSON.stringify(gerechnet.bytes));
gleich('Es ist nichts mehr offen', gerechnet.offen, 0);
gleich('Der Stand nennt, was gerechnet wurde', gerechnet.stand?.seiten, 4);

/* ==========================================================================
 * §4 · Wiederaufnahme: weiter, nicht von vorn
 * --------------------------------------------------------------------------
 * DIE EIGENTLICHE ZUSAGE DIESES BOGENS. Sie ist nur messbar, wenn die
 * Messung „von vorn" von „weiter" unterscheiden KANN. „Am Ende sind alle
 * Bilder da" kann das nicht — das gilt für beide.
 *
 * Was es kann: DIE ZAHL DER DATEISÄTZE. Wer von vorn rechnet, legt für die
 * schon fertigen Seiten ein ZWEITES Bild ab. Genau das ist die Dateileiche
 * aus dem Kommentar in `einlesen.ts`: der zweite Satz trägt einen LEBENDEN
 * `blockId`, also findet `Dateien.verwaist()` ihn nie.
 * ========================================================================*/
console.log('\n4 · Nach dem Neustart geht es weiter, nicht von vorn');

const wieder = await pc.evaluate(async (quelleId: string) => {
  /* Wieder alles wegnehmen und einen frischen Auftrag anlegen. */
  await Auftraege.leeren();
  const seiten = (Object.values(Store.cache.blocks) as any[])
    .filter(b => b && b.alive !== false && b.type === 'pdfseite')
    .sort((a, b) => (Number(a.nr) || 0) - (Number(b.nr) || 0));
  for (const b of seiten) {
    if (b.bildDateiId) await Dateien.weg(b.bildDateiId);
    Store.updateBlock(b.id, { bildDateiId: '' });
  }
  await Store.flush();

  /* ZWEI SEITEN VON HAND FERTIG MACHEN — das ist der „schon gelaufene"
     Teil. Danach steht ein Auftrag da, der nur noch zwei zu tun hat. */
  const roh = await Dateien.alsBlob(quelleId);
  const griff = await PdfLeser.oeffne(new Uint8Array(await roh!.arrayBuffer()));
  for (const b of seiten.slice(0, 2)) {
    const bild = await griff.alsBild(Number(b.nr) || 1);
    const satz = await Dateien.ablegen(
      new File([bild], 'vorher-' + b.nr + '.webp', { type: 'image/webp' }),
      { blockId: b.id, abgeleitet: true });
    Store.updateBlock(b.id, { bildDateiId: satz.id });
  }
  griff.schliessen();
  await Store.flush();

  /* Wieviele Dateisätze hängen an einem Block? `Store.dateienAmBlock` ist
     modulintern; von aussen zählt man über `dateiAlle()`. */
  const zaehle = async (): Promise<Record<string, number>> => {
    const alle = await Store.dateiAlle();
    const n: Record<string, number> = {};
    for (const b of seiten) n[b.id] = alle.filter((d: any) => d.blockId === b.id).length;
    return n;
  };
  const vorher = await zaehle();

  const angelegt = await PdfEinlesen.neuBerechnen(quelleId);
  await (globalThis as any).warteAufEnde('pdfbild-' + quelleId);

  const nachher = await zaehle();
  const bilder = seiten.map((b: any) => Store.getBlock(b.id)?.bildDateiId || '');
  const auftrag = await Auftraege.einer('pdfbild-' + quelleId);
  return {
    schritteImAuftrag: angelegt?.auftrag?.schritte,
    schritt: auftrag?.schritt, zustand: auftrag?.zustand,
    vorher: seiten.map((b: any) => vorher[b.id]),
    nachher: seiten.map((b: any) => nachher[b.id]),
    alleMitBild: bilder.every(x => !!x),
    offen: (await PdfEinlesen.ohneBild(quelleId)).length
  };
}, vorbereitet.quelleId);

gleich('Der Auftrag weiss, dass nur zwei Seiten offen sind',
  wieder.schritteImAuftrag, 2);
gleich('Und macht genau zwei Schritte', wieder.schritt, 2);
gleich('Danach ist er fertig und nichts mehr offen',
  [wieder.zustand, wieder.offen], ['fertig', 0]);
p('Alle vier Seiten haben ein Bild', wieder.alleMitBild);
/* DIE MESSUNG, DIE „VON VORN" ROT MACHT: an den zwei schon fertigen
   Seiten darf KEIN zweiter Dateisatz entstanden sein. */
gleich('An den schon fertigen Seiten kam nichts dazu',
  [wieder.nachher[0], wieder.nachher[1]], [wieder.vorher[0], wieder.vorher[1]]);
gleich('Und an den beiden offenen genau eines',
  [wieder.nachher[2], wieder.nachher[3]], [1, 1]);

/* ==========================================================================
 * §5 · Abbrechen hält an, und das Gerechnete bleibt
 * ========================================================================*/
console.log('\n5 · Abbrechen hält an, ohne wegzuwerfen');

const abgebrochen = await pc.evaluate(async (quelleId: string) => {
  await Auftraege.leeren();
  const seiten = (Object.values(Store.cache.blocks) as any[])
    .filter(b => b && b.alive !== false && b.type === 'pdfseite')
    .sort((a, b) => (Number(a.nr) || 0) - (Number(b.nr) || 0));
  for (const b of seiten) {
    if (b.bildDateiId) await Dateien.weg(b.bildDateiId);
    Store.updateBlock(b.id, { bildDateiId: '' });
  }
  await Store.flush();

  const id = 'pdfbild-' + quelleId;
  await PdfEinlesen.neuBerechnen(quelleId);
  /* NACH DEM ERSTEN SCHRITT abbrechen. Der Läufer fragt in jeder Schleife;
     die Marke wirkt also spätestens bei der nächsten Seite. */
  const ab = new Promise<void>(f => {
    const weg = Ereignisse.horche('auftrag.schritt', (d: any) => {
      if (d && d.id === id) { weg(); void Auftraege.abbrechen(id); f(); }
    });
  });
  await ab;
  await (globalThis as any).warteAufEnde(id);

  const auftrag = await Auftraege.einer(id);
  let mitBild = 0;
  for (const b of seiten) if (Store.getBlock(b.id)?.bildDateiId) mitBild++;
  return { zustand: auftrag?.zustand, schritt: auftrag?.schritt, mitBild,
           vonVier: seiten.length };
}, vorbereitet.quelleId);

gleich('Er steht auf abgebrochen', abgebrochen.zustand, 'abgebrochen');
p('Er hat NICHT alle vier gerechnet',
  abgebrochen.schritt < 4, String(abgebrochen.schritt) + ' Schritte');
/* DAS GERECHNETE BLEIBT. Ein Abbruch, der die fertigen Seiten wieder
   wegnimmt, wäre §46 — er würfe Arbeit weg, um ordentlich auszusehen. */
p('Aber das schon Gerechnete bleibt liegen',
  abgebrochen.mitBild >= 1 && abgebrochen.mitBild === abgebrochen.schritt,
  abgebrochen.mitBild + ' Bilder gegen ' + abgebrochen.schritt + ' Schritte');

/* ==========================================================================
 * §6 · GEGENPROBE
 * ========================================================================*/
console.log('\n6 · GEGENPROBE: wo nichts zu tun ist, entsteht nichts');

const gegen = await pc.evaluate(async (quelleId: string) => {
  await Auftraege.leeren();
  /* Erst alles fertig rechnen … */
  await PdfEinlesen.neuBerechnen(quelleId);
  await (globalThis as any).warteAufEnde('pdfbild-' + quelleId);
  await Auftraege.leeren();
  /* … dann noch einmal anstossen. Jetzt ist nichts offen. */
  const nichts = await PdfEinlesen.neuBerechnen(quelleId);
  const danach = await Auftraege.alle();

  /* UND DER FALL OHNE ORIGINAL: die Bilder wegnehmen, das Original
     dazu. Genau der Zustand nach einer `.json`-Sicherung (ohne Anhänge). */
  const seiten = (Object.values(Store.cache.blocks) as any[])
    .filter(b => b && b.alive !== false && b.type === 'pdfseite');
  for (const b of seiten) {
    if (b.bildDateiId) await Dateien.weg(b.bildDateiId);
    Store.updateBlock(b.id, { bildDateiId: '' });
  }
  await Dateien.weg(quelleId);
  await Store.flush();

  await PdfEinlesen.neuBerechnen(quelleId);
  await (globalThis as any).warteAufEnde('pdfbild-' + quelleId);
  const kaputt = await Auftraege.einer('pdfbild-' + quelleId);
  return {
    ohneOffene: { auftrag: nichts?.auftrag, grund: nichts?.grund },
    keinerAngelegt: danach.length,
    zustand: kaputt?.zustand, versuche: kaputt?.versuche,
    meldung: kaputt?.fehler || ''
  };
}, vorbereitet.quelleId);

gleich('Ohne offene Seite wird kein Auftrag angelegt',
  [gegen.ohneOffene.auftrag, gegen.ohneOffene.grund], [null, 'nichts offen']);
gleich('Und es steht auch keiner in der Ablage', gegen.keinerAngelegt, 0);

gleich('Fehlt das Original, scheitert er sofort', gegen.zustand, 'fehler');
/* NICHT DREIMAL. Der Vorgabewert der Maschine ist drei Versuche; bei einem
   Fehler, der nicht vorübergeht, wären das zwei Wartezeiten umsonst. */
gleich('Nach genau einem Versuch', gegen.versuche, 1);
p('Und sagt dem Menschen, was zu tun ist',
  /Original fehlt/.test(gegen.meldung) && /noch einmal herein/.test(gegen.meldung),
  gegen.meldung);

/* ------------------------------------------------------------------------ */
/* Der Läufer selbst darf nichts anzeigen — er läuft im falschen Tab. */
const quelle = fs.readFileSync(
  path.join(WURZEL, 'src/bereiche/pdf/einlesen.ts'), 'utf-8');
const laeuferText = quelle.slice(quelle.indexOf('const bilderLaeufer'),
                                quelle.indexOf('Auftraege.anmelden'));
p('Der Läufer wirft keine Toasts — angezeigt wird aus den Ereignissen',
  !/UI\.toast/.test(laeuferText.replace(/\/\*[\s\S]*?\*\//g, ' ')));
p('Und er fragt in jeder Schleife, ob abgebrochen wurde',
  /hilfe\.abgebrochen\(\)/.test(laeuferText));

gleich('Keine JS-Fehler', fehler, []);

await browser.close();
await new Promise<void>(f => server.close(() => f()));

console.log(`\n${ok}/${ok + weg} bestanden`);
process.exitCode = weg ? 1 : 0;
