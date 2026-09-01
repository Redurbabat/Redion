/* Suite 144 — Das Notizblatt steht gleich neben der Seite (E104)
 * ============================================================================
 * Redurs Satz zum PDF hatte zwei Hälften. Die erste — durchblättern und
 * darauf schreiben — steht seit E103. Die zweite stand noch aus:
 *
 *     „wenn ich die pdf hochlade sollte ich neben es … so leeren a4 balat
 *      haben die ich direk dort schreiben kann"
 *
 * Beim Einlesen wird jetzt gefragt, und bei „nebeneinander" bekommt jede
 * Seite ein leeres Blatt neben sich — in DENSELBEN Massen wie die Seite.
 *
 * DREI FRAGEN, DIE DIESE SUITE BEANTWORTET:
 *
 *   §1  Steht das Blatt wirklich daneben, und in den Massen der Seite?
 *       Ein hochkantes Blatt neben einer querformatigen Seite sähe aus wie
 *       ein Fehler, und keine Zeile läge auf derselben Höhe.
 *
 *   §2  Bleibt die andere Wahl die andere Wahl? „Nur die Seiten" muss
 *       genau das bauen, was E103 gebaut hat — sonst ist die Frage keine
 *       Frage, sondern eine Verzierung.
 *
 *   §5  Was macht das Telefon damit? Nebeneinander gibt es dort nicht.
 *       Das Blatt muss UNTER der Seite landen, nicht halb daneben.
 *
 *   node pruefungen/lauf/test178.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8923;

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

/* --------------------------------------------------------------------------
 * Ein PDF von Hand — zwei Seiten, davon eine QUER.
 * --------------------------------------------------------------------------
 * Die Querseite ist Absicht: sie ist der einzige Fall, in dem sich „das
 * Blatt hat die Masse der Seite" von „das Blatt ist A4" unterscheidet.
 * Ohne sie wären beide Aussagen dasselbe, und §1 prüfte nichts.
 * ------------------------------------------------------------------------*/
const alsText = (s: string): string =>
  s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

const machPdf = (seiten: Array<{ titel: string; breit: number; hoch: number }>): Buffer => {
  const objekte: Buffer[] = [];
  const neu = (inhalt: Buffer | string): number => {
    objekte.push(Buffer.isBuffer(inhalt) ? inhalt : Buffer.from(inhalt, 'latin1'));
    return objekte.length;
  };
  const seitenNr = neu('');
  const schrift = neu('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  const kids: number[] = [];
  for (const s of seiten) {
    const roh = Buffer.from(
      `BT /F1 30 Tf 50 ${s.hoch - 90} Td (${alsText(s.titel)}) Tj ET\n` +
      `2 w 25 25 ${s.breit - 50} ${s.hoch - 50} re S`, 'latin1');
    const inhalt = neu(Buffer.concat([
      Buffer.from(`<< /Length ${roh.length} >>\nstream\n`, 'latin1'), roh,
      Buffer.from('\nendstream', 'latin1')]));
    kids.push(neu(`<< /Type /Page /Parent 1 0 R /MediaBox [0 0 ${s.breit} ${s.hoch}] ` +
      `/Resources << /Font << /F1 ${schrift} 0 R >> >> /Contents ${inhalt} 0 R >>`));
  }
  objekte[seitenNr - 1] = Buffer.from(
    `<< /Type /Pages /Count ${kids.length} /Kids [${kids.map(k => k + ' 0 R').join(' ')}] >>`, 'latin1');
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
  { titel: 'Hochkant', breit: 595, hoch: 842 },
  { titel: 'Quer',     breit: 842, hoch: 595 }
]);

const browser = await chromium.launch();
const seite = await browser.newPage();
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message));
await seite.setViewportSize({ width: 1500, height: 950 });
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

/** Ein PDF fallen lassen und im Dialog `wahl` drücken. Gibt die Seite zurück. */
const wirfHin = async (wahl: string): Promise<string> => {
  const sid = await seite.evaluate(async () => {
    const s = Store.addPage(null, { text: 'Probe' });
    App.oeffne(s.id);
    return s.id;
  });
  await seite.waitForFunction(() => !!document.getElementById('scroll'));
  await seite.evaluate((hex: string) => {
    const bytes = Uint8Array.from((hex.match(/../g) || []).map(h => parseInt(h, 16)));
    const dt = new DataTransfer();
    dt.items.add(new File([bytes], 'klausur.pdf', { type: 'application/pdf' }));
    document.getElementById('scroll')!.dispatchEvent(
      new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true }));
  }, PDF.toString('hex'));
  await seite.waitForSelector(`.overlay [data-w="${wahl}"]`, { timeout: 20000 });
  await seite.click(`.overlay [data-w="${wahl}"]`);
  /* AUF BEIDE SEITEN WARTEN, nicht auf „da steht irgendetwas".
     Der erste Entwurf wartete darauf, dass die Seite Kinder hat — das war
     sofort wahr, denn `addPage` legt eine leere Startzeile an. Gelesen wurde
     dann mitten im Bauen: der zweite Spaltenblock stand schon da, sein
     linkes Fach war aber noch leer. Zwei Punkte meldeten `undefined`, und
     der Fehler sah aus wie ein Fehler im Baum. */
  if (wahl) await seite.waitForFunction(
    /* UNTER DIESER SEITE, nicht im ganzen Bestand. Über alle Blöcke gezählt
       war die Bedingung beim zweiten Durchgang sofort wahr — die zwei
       Seiten aus dem ersten lagen ja noch da. */
    (s: string) => {
      const zaehl = (id: string): number => {
        const b = Store.getBlock(id);
        if (!b || !b.alive) return 0;
        /* Mitgezählt wird nur eine Seite MIT BILD. Das ist der letzte
           Handgriff je Seite und damit das einzige ehrliche „fertig" —
           die blosse Anwesenheit des Blocks ist es nicht. */
        return (b.type === 'pdfseite' && b.bildDateiId ? 1 : 0) +
          (b.content || []).reduce((n: number, k: string) => n + zaehl(k), 0);
      };
      return zaehl(s) >= 2;
    }, sid, { timeout: 60000 });
  return sid;
};

/**
 * Der Baum unter einer Seite, auf das Nötige eingedampft.
 *
 * OHNE DIE LEERE STARTZEILE. `Store.addPage` legt jeder neuen Seite eine
 * leere Textzeile hinein, damit man hineinschreiben kann. Sie ist echt und
 * richtig — nur ist sie nicht das, was hier geprüft wird, und als erstes
 * Kind verschob sie jeden Index um eins. Der erste Entwurf verglich deshalb
 * `a[0]` mit `columns` und bekam `text`.
 *
 * Zwei Punkte gingen dabei sogar durch, weil `undefined === undefined` gilt.
 * Ein Vergleich, dessen beide Seiten fehlen, ist keine Zusage.
 */
const baum = async (sid: string) => seite.evaluate((s: string) => {
  const lies = (id: string): any => {
    const b = Store.getBlock(id);
    if (!b || !b.alive) return null;
    return {
      typ: b.type, text: String(b.text || ''), bw: b.bw, bh: b.bh,
      blattBreite: b.blattBreite, blattHoehe: b.blattHoehe,
      kinder: (b.content || []).map(lies).filter(Boolean)
    };
  };
  return (Store.getBlock(s)?.content || []).map(lies).filter(Boolean)
    .filter((x: any) => !(x.typ === 'text' && !x.text && !x.kinder.length))
    /* DAS ORIGINAL OBEN ZAEHLT NICHT MIT (E299). Seit Redurs Wunsch „ganz
       oben sollte immer die orginale pdf dort stehen" legt `alsSeiten` die
       eingelesene Datei als `file`-Block an Stelle 0. Dieser Abschnitt misst
       die ANORDNUNG der Seiten — nebeneinander oder untereinander. Der
       Anhang gehoert nicht zu dieser Frage; dass er da ist, prueft §6. */
    .filter((x: any) => x.typ !== 'file');
}, sid);

/* ==========================================================================
 * §1 · Nebeneinander: links die Seite, rechts das Blatt
 * ========================================================================*/
console.log('\n1 · Nebeneinander: links die Seite, rechts das Blatt');

const sidA = await wirfHin('nebeneinander');
const a = await baum(sidA);

gleich('Zwei Spaltenblöcke, einer je Seite', a.length, 2);
gleich('Und es sind Spaltenblöcke', a[0]?.typ, 'columns');
gleich('Mit zwei Spalten darin', a[0]?.kinder?.length, 2);
gleich('Links die Seite', a[0]?.kinder?.[0]?.kinder?.[0]?.typ, 'pdfseite');
gleich('Rechts ein Blatt', a[0]?.kinder?.[1]?.kinder?.[0]?.typ, 'blatt');
p('Das Blatt hat schon eine Zeile zum Hineinschreiben',
  (a[0]?.kinder?.[1]?.kinder?.[0]?.kinder || []).length >= 1);

/* DER PUNKT, AN DEM SICH „Masse der Seite" von „A4" UNTERSCHEIDET. */
const hoch = a[0], quer = a[1];
const blattVon = (x: any) => x?.kinder?.[1]?.kinder?.[0];
const seiteVon = (x: any) => x?.kinder?.[0]?.kinder?.[0];

p('Die erste Seite ist hochkant',
  Number(seiteVon(hoch)?.bw) < Number(seiteVon(hoch)?.bh),
  `${seiteVon(hoch)?.bw} × ${seiteVon(hoch)?.bh}`);
p('Die zweite ist quer',
  Number(seiteVon(quer)?.bw) > Number(seiteVon(quer)?.bh),
  `${seiteVon(quer)?.bw} × ${seiteVon(quer)?.bh}`);
gleich('Das Blatt der hochkanten Seite ist genauso breit',
  blattVon(hoch)?.blattBreite, seiteVon(hoch)?.bw);
gleich('… und genauso hoch', blattVon(hoch)?.blattHoehe, seiteVon(hoch)?.bh);
gleich('Das Blatt der QUEREN Seite ebenso',
  blattVon(quer)?.blattBreite, seiteVon(quer)?.bw);
gleich('… und ebenso hoch', blattVon(quer)?.blattHoehe, seiteVon(quer)?.bh);
p('Gegenprobe: es ist also NICHT einfach A4',
  Number(blattVon(quer)?.blattBreite) > Number(blattVon(quer)?.blattHoehe),
  'das quere Blatt müsste breiter als hoch sein');

/* ==========================================================================
 * §2 · Und die andere Wahl bleibt die andere Wahl
 * ========================================================================*/
console.log('\n2 · Und die andere Wahl bleibt die andere Wahl');

const sidB = await wirfHin('untereinander');
const b = await baum(sidB);

gleich('Zwei Blöcke', b.length, 2);
gleich('Und es sind die Seiten selbst', b[0]?.typ, 'pdfseite');
gleich('Beide', b[1]?.typ, 'pdfseite');
p('Kein Spaltenblock weit und breit',
  !b.some((x: any) => x.typ === 'columns'));
p('Und kein Blatt', !b.some((x: any) => x.typ === 'blatt'));

/* ==========================================================================
 * §3 · Die zuletzt gewählte Anordnung steht vorn
 * --------------------------------------------------------------------------
 * Nur vorn — nicht heimlich angewandt. Ein gemerkter Zustand, den man
 * nirgends sieht, ist die Falle, die man erst beim dritten PDF bemerkt.
 * ========================================================================*/
console.log('\n3 · Die zuletzt gewählte Anordnung steht vorn');

gleich('Gemerkt ist die letzte Wahl',
  await seite.evaluate(() => Store.getMeta('pdfAnordnung')), 'untereinander');

const sidC = await seite.evaluate(async () => {
  const s = Store.addPage(null, { text: 'Probe 3' });
  App.oeffne(s.id);
  return s.id;
});
await seite.waitForFunction(() => !!document.getElementById('scroll'));
await seite.evaluate((hex: string) => {
  const bytes = Uint8Array.from((hex.match(/../g) || []).map(h => parseInt(h, 16)));
  const dt = new DataTransfer();
  dt.items.add(new File([bytes], 'klausur.pdf', { type: 'application/pdf' }));
  document.getElementById('scroll')!.dispatchEvent(
    new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true }));
}, PDF.toString('hex'));
await seite.waitForSelector('.overlay [data-w]', { timeout: 20000 });

const reihenfolge = await seite.evaluate(() =>
  [...document.querySelectorAll('.overlay [data-w]')].map(
    x => (x as HTMLElement).dataset['w']));
gleich('Also steht sie als erster Knopf da', reihenfolge[0], 'untereinander');
gleich('Die andere daneben', reihenfolge[1], 'nebeneinander');
gleich('Und Abbrechen zuletzt', reihenfolge[2], '');
p('Der erste Knopf hat den Fokus — Enter genügt',
  await seite.evaluate(() =>
    document.activeElement === document.querySelector('.overlay [data-w]')));

/* ==========================================================================
 * §4 · Abbrechen heisst: SICHTBAR anhängen
 * --------------------------------------------------------------------------
 * DER PUNKT, DEN E103 FALSCH HATTE. Beim Abbrechen legte das Einlesen die
 * Bytes ab, baute aber keinen Block: die Datei war in der Ablage und auf der
 * Seite stand nichts. Dazu eine Meldung „ist als Anhang abgelegt" — für
 * etwas, das man nirgends anklicken konnte.
 *
 * Dasselbe traf jedes unlesbare PDF. `test173` fiel darüber, mit 20 MB
 * Füllbytes, die `.pdf` hiessen: „Ein Block ist entstanden — angelegt 0".
 * Gefunden hat es der volle Lauf, nicht diese Suite — die Nachbarschaft,
 * die ich nach E103 prüfte, war nach dem THEMA gewählt (Blatt, Spalten,
 * Schrift) und nicht nach dem, was der Eingriff berührte: den Ablegeweg.
 * ========================================================================*/
console.log('\n4 · Abbrechen heisst: SICHTBAR anhängen');

await seite.click('.overlay [data-w=""]');
await seite.waitForFunction((s: string) =>
  (Store.getBlock(s)?.content || []).some(
    (k: string) => Store.getBlock(k)?.type === 'file'), sidC, { timeout: 20000 });

const nachAbbruch = await seite.evaluate(async (s: string) => {
  const saetze = await Store.dateiAlle();
  const kinder = (Store.getBlock(s)?.content || [])
    .map((k: string) => Store.getBlock(k)).filter(Boolean);
  /* Die leere Startzeile der Seite zählt nicht mit — sie war schon da,
     bevor die Datei fiel. */
  const gebaut = kinder.filter((b: any) => b.type !== 'text' || b.text);
  const anhang = gebaut[0];
  const satz = saetze.find((x: any) => x.id === anhang?.dateiId);
  return {
    wieViele: gebaut.length,
    art: anhang?.type, beschriftung: String(anhang?.text || ''),
    zeigtAufDatei: !!anhang?.dateiId,
    satzName: satz?.name, satzGehoert: satz?.blockId === anhang?.id,
    imBild: !!document.querySelector('.blk.b-file'),
    pdfsDa: saetze.filter((x: any) => /\.pdf$/i.test(x.name)).length,
    bilder: saetze.filter((x: any) => x.abgeleitet).length,
    /* Nichts gerastert, nichts nebeneinandergestellt */
    seitenGebaut: gebaut.filter((b: any) =>
      b.type === 'pdfseite' || b.type === 'columns').length
  };
}, sidC);

gleich('Genau ein Block steht auf der Seite', nachAbbruch.wieViele, 1);
gleich('Und es ist ein Anhang', nachAbbruch.art, 'file');
gleich('Mit dem Dateinamen daran', nachAbbruch.beschriftung, 'klausur.pdf');
p('Er zeigt auf die abgelegte Datei', nachAbbruch.zeigtAufDatei);
gleich('Und zwar auf die richtige', nachAbbruch.satzName, 'klausur.pdf');
p('Der Datei-Satz gehört jetzt DIESEM Block — sonst überlebt er das Löschen',
  nachAbbruch.satzGehoert);
p('Man sieht ihn auch wirklich auf der Seite', nachAbbruch.imBild);
gleich('Keine Seite wurde gebaut', nachAbbruch.seitenGebaut, 0);
gleich('Die drei PDFs liegen in der Ablage', nachAbbruch.pdfsDa, 3);
gleich('Und für die abgebrochene wurde kein Bild gerechnet',
  nachAbbruch.bilder, 2 + 2);

/* ==========================================================================
 * §4b · Und ein KAPUTTES PDF verschwindet auch nicht
 * --------------------------------------------------------------------------
 * Kein Dialog, keine Wahl — pdf.js kommt nicht durch. Genau hier stand
 * vorher `catch { continue; }`, und die Datei fiel ins Nichts.
 *
 * DIE DATEI HAT EINEN GÜLTIGEN KOPF UND EINEN KAPUTTEN LEIB, und das ist
 * Absicht. Seit E106 sieht das Einlesen zuerst auf die ersten fünf Bytes;
 * eine Datei, die nur `.pdf` HEISST, fliegt dort sofort heraus und geht den
 * gewöhnlichen Weg. Der Rückfall in `alsSeiten` — Original schon abgelegt,
 * dann scheitert das Lesen — wird nur von dieser Sorte erreicht. Mit
 * blossen Füllbytes hätte dieser Abschnitt ab E106 etwas anderes geprüft
 * als das, was sein Name sagt.
 * ========================================================================*/
console.log('\n4b · Und ein KAPUTTES PDF verschwindet auch nicht');

const sidD = await seite.evaluate(async () => {
  const s = Store.addPage(null, { text: 'Kaputt' });
  App.oeffne(s.id);
  return s.id;
});
await seite.waitForFunction(() => !!document.getElementById('scroll'));
await seite.evaluate(() => {
  /* Gültiger Kopf, danach ein Megabyte Unsinn. pdf.js beginnt zu lesen und
     scheitert am Inhalt — genau der Fall, für den es den Rückfall gibt. */
  const kopf = new TextEncoder().encode('%PDF-1.4\n');
  const leib = new Uint8Array(1024 * 1024).fill(7);
  const dt = new DataTransfer();
  dt.items.add(new File([kopf, leib],
    'kein-echtes.pdf', { type: 'application/pdf' }));
  document.getElementById('scroll')!.dispatchEvent(
    new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true }));
});
await seite.waitForFunction((s: string) =>
  (Store.getBlock(s)?.content || []).some(
    (k: string) => Store.getBlock(k)?.type === 'file'), sidD, { timeout: 30000 });

const kaputt = await seite.evaluate(async (s: string) => {
  const saetze = await Store.dateiAlle();
  const kinder = (Store.getBlock(s)?.content || [])
    .map((k: string) => Store.getBlock(k)).filter(Boolean)
    .filter((b: any) => b.type !== 'text' || b.text);
  const anhang = kinder[0];
  const satz = saetze.find((x: any) => x.id === anhang?.dateiId);
  return {
    wieViele: kinder.length, art: anhang?.type,
    name: String(anhang?.text || ''),
    bytes: satz?.groesse, stuecke: satz?.teile,
    seiten: kinder.filter((b: any) => b.type === 'pdfseite').length,
    /* WIE OFT liegt diese Datei in der Ablage? Genau einmal. Zweimal hiesse:
       `alsSeiten` hat sie abgelegt, dann geworfen, und der gewöhnliche Weg
       hat sie noch einmal abgelegt — ein Megabyte doppelt, bei einem
       Schulskript zweihundert. Der Block sähe in beiden Fällen gleich aus;
       nur diese Zahl unterscheidet sie. */
    saetzeDafuer: saetze.filter((x: any) => x.name === 'kein-echtes.pdf').length
  };
}, sidD);

gleich('Ein Block steht da', kaputt.wieViele, 1);
gleich('Und es ist ein Anhang', kaputt.art, 'file');
gleich('Mit dem Namen der Datei', kaputt.name, 'kein-echtes.pdf');
gleich('Die Bytes sind vollständig da', kaputt.bytes, 1024 * 1024 + 9);
p('In Stücken, weil ein Megabyte sich dafür lohnt',
  Number(kaputt.stuecke) >= 1, String(kaputt.stuecke));
gleich('Und keine einzige Seite wurde gerastert', kaputt.seiten, 0);
gleich('Die Datei liegt GENAU EINMAL in der Ablage', kaputt.saetzeDafuer, 1);

/* ==========================================================================
 * §5 · Am Telefon liegt das Blatt UNTER der Seite
 * ========================================================================*/
console.log('\n5 · Am Telefon liegt das Blatt UNTER der Seite');

await seite.evaluate((s: string) => App.oeffne(s), sidA);
await seite.waitForSelector('.spalten-block .pdfs');
await seite.waitForTimeout(500);

const lage = async () => seite.evaluate(() => {
  const sp = document.querySelector('.spalten-block')!;
  const s = sp.querySelector('.pdfs')!.getBoundingClientRect();
  const b = sp.querySelector('.blatt-huelle:not(.pdfs)')!.getBoundingClientRect();
  return {
    seiteOben: Math.round(s.top), blattOben: Math.round(b.top),
    seiteUnten: Math.round(s.bottom),
    seiteLinks: Math.round(s.left), blattLinks: Math.round(b.left),
    spalten: getComputedStyle(sp).gridTemplateColumns.split(' ').length
  };
});

const pc = await lage();
gleich('Am Rechner sind es zwei Spalten', pc.spalten, 2);

/* --------------------------------------------------------------------------
 * DIE SPUREN MÜSSEN GLEICH BREIT SEIN UND INS GITTER PASSEN
 * --------------------------------------------------------------------------
 * `1fr 1fr` klingt danach, als könne das gar nicht schiefgehen. Es ging
 * schief: die Gitterzelle ist nicht `.spalte`, sondern die Hülle `.blk`
 * darum, und `min-width: 0` stand seit E102 auf der inneren Schicht. Ohne
 * min-width am Kind nimmt jede Spur die Mindestbreite ihres Inhalts —
 * gemessen 587 und 544 px in einem 708 px breiten Gitter, zusammen 1155.
 * Die rechte Spalte stand ausserhalb des Fensters.
 *
 * Aufgefallen ist das erst mit E104, weil handgemachte Spalten Text
 * enthalten und dessen Mindestbreite ein Wort ist. Eine Werkzeugleiste ist
 * 479 px breit.
 * ------------------------------------------------------------------------*/
const spuren = await seite.evaluate(() => {
  const g = document.querySelector('.spalten-block') as HTMLElement;
  const werk = g.querySelector('.blatt-werk') as HTMLElement;
  return {
    gitter: Math.round(g.getBoundingClientRect().width),
    ueberlauf: g.scrollWidth - g.clientWidth,
    breiten: getComputedStyle(g).gridTemplateColumns.split(' ')
      .map(x => Math.round(parseFloat(x))),
    /* Wie breit WÄRE die Leiste ungebremst? */
    werkNoetig: werk.scrollWidth, werkDa: Math.round(werk.clientWidth),
    zellenMinBreite: [...g.children]
      .map(c => getComputedStyle(c as HTMLElement).minWidth)
  };
});

gleich('Zwei Spuren', spuren.breiten.length, 2);
gleich('Und sie sind gleich breit', spuren.breiten[0], spuren.breiten[1]);
p('Zusammen passen sie ins Gitter',
  spuren.breiten[0]! * 2 <= spuren.gitter,
  `${spuren.breiten.join(' + ')} in ${spuren.gitter}`);
gleich('Nichts steht rechts heraus', spuren.ueberlauf, 0);
p('Die Gitterzellen selbst tragen min-width: 0',
  spuren.zellenMinBreite.every(x => x === '0px'),
  spuren.zellenMinBreite.join(', '));
p('Gegenprobe: der Inhalt WÄRE breiter als seine Spur',
  spuren.werkNoetig > spuren.werkDa + 50,
  `die Leiste bräuchte ${spuren.werkNoetig} px, hat ${spuren.werkDa}`);
p('Sie rollt deshalb, statt zu drängeln',
  await seite.evaluate(() => {
    const w = document.querySelector('.spalten-block .blatt-werk') as HTMLElement;
    const vorher = w.scrollLeft; w.scrollLeft = 9999;
    const nachher = w.scrollLeft; w.scrollLeft = vorher;
    return nachher > 0;
  }));
p('Seite und Blatt beginnen auf derselben Höhe',
  Math.abs(pc.seiteOben - pc.blattOben) < 6,
  `${pc.seiteOben} gegen ${pc.blattOben}`);
p('Und das Blatt steht rechts daneben',
  pc.blattLinks > pc.seiteLinks + 100,
  `${pc.seiteLinks} gegen ${pc.blattLinks}`);

await seite.setViewportSize({ width: 390, height: 844 });
await seite.evaluate(() => App.zeichneSeite());
await seite.waitForSelector('.spalten-block .pdfs');
await seite.waitForTimeout(500);

const handy = await lage();
gleich('Am Telefon ist es eine Spalte', handy.spalten, 1);
p('Das Blatt liegt UNTER der Seite, nicht halb daneben',
  handy.blattOben >= handy.seiteUnten - 4,
  `Blatt oben ${handy.blattOben}, Seite unten ${handy.seiteUnten}`);
p('Und beide beginnen links am selben Rand',
  Math.abs(handy.blattLinks - handy.seiteLinks) < 4,
  `${handy.seiteLinks} gegen ${handy.blattLinks}`);
p('Gegenprobe: am Rechner lagen sie NICHT untereinander',
  pc.blattOben < pc.seiteUnten - 100);

await seite.setViewportSize({ width: 1500, height: 950 });
await seite.evaluate(() => App.zeichneSeite());
await seite.waitForTimeout(400);

/* ==========================================================================
 * §6 · Auf beiden Blättern lässt sich getrennt malen
 * ========================================================================*/
console.log('\n6 · Auf beiden Blättern lässt sich getrennt malen');

const malen = async (waehler: string): Promise<void> => {
  await seite.evaluate((w: string) => {
    const knopf = document.querySelector(w + ' [data-wz="stift"]') as HTMLElement;
    knopf?.click();
  }, waehler);
  const flaeche = seite.locator(waehler + ' svg.blatt-marken').first();
  const k = await flaeche.boundingBox();
  if (!k) throw new Error('Keine Zeichenfläche bei ' + waehler);
  await seite.mouse.move(k.x + k.width * 0.3, k.y + k.height * 0.10);
  await seite.mouse.down();
  await seite.mouse.move(k.x + k.width * 0.7, k.y + k.height * 0.14, { steps: 10 });
  await seite.mouse.up();
};

await malen('.spalten-block .pdfs');
await malen('.spalten-block .blatt-huelle:not(.pdfs)');
await seite.waitForTimeout(500);

const striche = await seite.evaluate(() => {
  const alle = Object.values(Store.cache.blocks || {}) as any[];
  const s1 = alle.find(x => x.type === 'pdfseite' && x.nr === 1 &&
    (x.marken || []).length);
  const bl = alle.filter(x => x.type === 'blatt' && (x.marken || []).length);
  return { aufSeite: (s1?.marken || []).length, blaetterMitStrich: bl.length,
           aufBlatt: (bl[0]?.marken || []).length };
});

gleich('Ein Strich auf der PDF-Seite', striche.aufSeite, 1);
gleich('Ein Strich auf genau einem Notizblatt', striche.blaetterMitStrich, 1);
gleich('Und zwar einer', striche.aufBlatt, 1);

/* ==========================================================================
 * §7 · Und darin lässt sich schreiben — das war ja der Punkt
 * --------------------------------------------------------------------------
 * „direk neben es die aufgaben lösen kann". Also: hineinklicken, tippen,
 * Enter, weitertippen. Drei Schichten tief (columns → spalte → blatt), und
 * genau dort brach es vor E102: Enter legte ein Geschwister an, und aus
 * zwei Spalten wurden drei. Diese Prüfung steht hier, weil das Notizblatt
 * die erste Stelle ist, an der ein Mensch WIRKLICH in einer Spalte tippt.
 * ========================================================================*/
console.log('\n7 · Und darin lässt sich schreiben — das war ja der Punkt');

/* Zurück zum Schreibwerkzeug, sonst fängt die Zeichenschicht den Klick. */
await seite.evaluate(() => {
  document.querySelectorAll('.spalten-block [data-wz="schreiben"]')
    .forEach(k => (k as HTMLElement).click());
});

const zeileImBlatt = seite.locator(
  '.spalten-block .blatt-huelle:not(.pdfs) .blatt-inhalt .ct').first();
await zeileImBlatt.click();
await seite.keyboard.type('1) x = 11');
await seite.keyboard.press('Enter');
await seite.keyboard.type('2) 2/3');
await seite.waitForTimeout(400);

const getippt = await seite.evaluate(() => {
  const bl = (Object.values(Store.cache.blocks || {}) as any[])
    .find(x => x.type === 'blatt' && x.alive);
  const spalten = (Object.values(Store.cache.blocks || {}) as any[])
    .filter(x => x.type === 'spalte' && x.alive);
  const cols = (Object.values(Store.cache.blocks || {}) as any[])
    .filter(x => x.type === 'columns' && x.alive);
  return {
    zeilen: (bl?.content || []).map((k: string) => Store.getBlock(k))
      .filter(Boolean).map((b: any) => String(b.text || '')),
    arten: (bl?.content || []).map((k: string) => Store.getBlock(k))
      .filter(Boolean).map((b: any) => b.type),
    spaltenGesamt: spalten.length,
    spaltenBlöcke: cols.length,
    /* Und der Elternteil der zweiten Zeile ist das BLATT, nicht die Spalte */
    elternDerZweiten: (() => {
      const zweite = Store.getBlock((bl?.content || [])[1]);
      return zweite ? Store.getBlock(zweite.parentId)?.type : '(keine zweite)';
    })()
  };
});

gleich('Zwei Zeilen stehen im Notizblatt', getippt.zeilen.length, 2);

/* „1) " IST EIN MARKDOWN-KÜRZEL, und das ist hier die richtige Antwort und
   kein Verlust: der Block wird eine nummerierte Liste, und die Nummer malt
   die Liste. Der erste Entwurf dieser Prüfung verglich mit „1) x = 11" und
   fand „x = 11" — er hielt ein Merkmal für einen Fehler. Genau darum steht
   die Blockart hier daneben: nur beides zusammen sagt, dass nichts weg ist. */
gleich('Aus „1) " wird eine nummerierte Liste', getippt.arten[0], 'number');
gleich('Und der Text danach steht darin', getippt.zeilen[0], 'x = 11');
/* Enter in einer nummerierten Liste macht schon eine nummerierte Zeile.
   Das getippte „2) " ist dort KEIN Kürzel mehr — es wird gewöhnlicher Text,
   und das ist richtig: ein Kürzel, das in einer Liste noch einmal zuschlüge,
   frässe jede Ziffer, die jemand am Zeilenanfang schreibt. Auch diese
   Erwartung stand erst falsch in der Prüfung. */
gleich('Die zweite Zeile ist schon von selbst nummeriert',
  getippt.arten[1], 'number');
gleich('Und „2) " bleibt dort stehen, weil es kein Kürzel mehr ist',
  getippt.zeilen[1], '2) 2/3');
gleich('Und beide liegen IM Blatt, nicht daneben',
  getippt.elternDerZweiten, 'blatt');
gleich('Es sind immer noch zwei Spaltenblöcke', getippt.spaltenBlöcke, 2);
gleich('Mit zusammen vier Spalten', getippt.spaltenGesamt, 4);

/* ==========================================================================
 * §8 · Was der Quelltext verspricht
 * ========================================================================*/
console.log('\n8 · Was der Quelltext verspricht');

const ohneKommentare = (t: string): string =>
  t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const quelle = ohneKommentare(
  fs.readFileSync(path.join(WURZEL, 'src/bereiche/pdf/einlesen.ts'), 'utf8'));

p('Die Spalten entstehen als columns → spalte, wie von Hand (E102)',
  /addBlock\(elternId, 'columns'/.test(quelle) &&
  /addBlock\(sp\.id, 'spalte'/.test(quelle));
p('Das Blatt bekommt die Masse der Seite, nicht A4',
  /blattBreite: geo\.bw/.test(quelle) && /blattHoehe: geo\.bh/.test(quelle));
p('Die Wahl wird gemerkt, aber jedes Mal gefragt',
  /Store\.setMeta\('pdfAnordnung'/.test(quelle) &&
  /Dialog\.wahl\(/.test(quelle));

p('Keine Fehler auf der Seite', fehler.length === 0, fehler.join(' | '));

/* ==========================================================================
 * §6 · Und ganz oben steht die Originaldatei (E299)
 * --------------------------------------------------------------------------
 * Redur: „ganz oben sollte immer die orginale pdf dort stehen und die
 * anderen als eien kopier dort ausdrucken". Bis dahin lagen die Bytes zwar
 * in der Ablage — an jeder Seite als `quelleId` —, aber nichts auf der Seite
 * zeigte darauf. Wer die Datei weiterschicken oder auf einem anderen Rechner
 * oeffnen wollte, kam nicht an sie heran, obwohl sie da war.
 *
 * §55.2 — vor E299 gab es diesen Block bei erfolgreichem Einlesen gar nicht:
 * `nurAnhaengen` legte ihn nur an, WENN das Einlesen scheiterte.
 * ========================================================================*/
console.log('\n6 · Und ganz oben steht die Originaldatei');

const oben = await seite.evaluate((s: string) => {
  const kinder = (Store.getBlock(s)?.content || [])
    .map((id: string) => Store.getBlock(id)).filter(Boolean);
  const erst = kinder[0];
  return { typ: erst?.type || '', name: String(erst?.text || ''),
           hatDatei: !!erst?.dateiId, alsOriginal: erst?.original === true,
           wieViele: kinder.filter((b: any) => b?.type === 'file').length };
}, sidA) as any;

gleich('Das erste Kind der Seite ist eine Datei', oben.typ, 'file');
p('Sie trägt den Namen der eingelesenen PDF', /\.pdf$/i.test(oben.name), oben.name);
p('Und zeigt auf einen echten Dateisatz', oben.hatDatei);
p('Sie ist als Original gekennzeichnet', oben.alsOriginal);
gleich('Genau eine — nicht bei jedem Einlesen eine weitere', oben.wieViele, 1);

await browser.close();
server.close();
console.log(`\n${ok} bestanden, ${weg} durchgefallen`);
process.exit(weg ? 1 : 0);
