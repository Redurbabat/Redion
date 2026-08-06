/* Suite 75 — Der Tabellenblock im Browser
 * ----------------------------------------------------------------------------
 * `test110` prüft den Kern ohne Bildschirm: Adressen, Formeln, Zirkelbezüge,
 * Bezüge verschieben. Was es dort NICHT gibt, ist alles, was erst durch das
 * Zeichnen entsteht — und genau da sitzen die Fehler, die ein Mensch merkt:
 *
 *   · **Speichert das blosse Ansehen?** Wer eine Seite nur öffnet, darf keine
 *     Änderung in der Ablage hinterlassen. Sonst steht auf dem Gerät, auf dem
 *     jemand nachgesehen hat, das jüngere `edited` — und beim Abgleich
 *     gewinnt es gegen die echte Änderung vom anderen Gerät. Das ist kein
 *     Schönheitsfehler, das ist Datenverlust, und er sieht wie nichts aus.
 *
 *   · **Übersteht die Mappe den Neustart?** Eine Tabelle, deren Zahlen beim
 *     nächsten Öffnen weg sind, ist schlimmer als keine.
 *
 *   · **Sammeln sich Zuhörer an?** `App.zeichneSeite()` läuft bei jeder
 *     Kleinigkeit. Hängt der Block dabei jedes Mal einen `mouseup` ans
 *     Dokument, den er nie abhängt, wird die App langsam und niemand weiss
 *     wovon. Hier wird gezählt.
 *
 *   · **Sieht man, wo der Fokus steht — auch am Telefon?** Ohne Fokusring ist
 *     die Tabelle für jeden unbenutzbar, der die Tastatur benutzt.
 *
 * Gestartet wird gegen `index.html` über einen kleinen Server, weil ein
 * Dienst-Skript und IndexedDB unter `file://` nicht laufen.
 *
 *   node pruefungen/lauf/test111.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import { fileURLToPath as alsPfad } from 'node:url';
import { dirname as ordnerVon, resolve as loese, join as dazu } from 'node:path';
import { readFileSync as lies, existsSync as da } from 'node:fs';
import { createServer } from 'node:http';

const WURZEL: string = loese(ordnerVon(alsPfad(import.meta.url)), '../..');
const PORT = 8813;

let ok = 0, weg = 0;
const p = (n: string, b: boolean, extra: string = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); } };
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll),
    `ist=${JSON.stringify(ist)} soll=${JSON.stringify(soll)}`);

const TYP: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.ico': 'image/x-icon' };

const server = createServer((a, b) => {
  const rein = decodeURIComponent(String(a.url).split('?')[0] || '/');
  const pfad = dazu(WURZEL, rein === '/' ? 'index.html' : rein.slice(1));
  if (!pfad.startsWith(WURZEL) || !da(pfad)) { b.writeHead(404); b.end(); return; }
  b.writeHead(200, { 'Content-Type': TYP[pfad.slice(pfad.lastIndexOf('.'))] || 'application/octet-stream' });
  b.end(lies(pfad));
});
await new Promise<void>(f => server.listen(PORT, () => f()));

const browser = await chromium.launch();
const kontext = await browser.newContext();
const fehler: string[] = [];

const oeffne = async (): Promise<any> => {
  const s = await kontext.newPage();
  s.on('pageerror', (e: Error) => fehler.push(e.message));
  await s.goto(`http://localhost:${PORT}/index.html`);
  await s.waitForFunction(() => typeof App !== 'undefined' && typeof Store !== 'undefined' &&
    (document.getElementById('tree')?.children.length || 0) > 0, null, { timeout: 30000 });
  return s;
};

const seite = await oeffne();

/* ========================================================================= *
 * 0 · IST DER BLOCK ÜBERHAUPT ANGESCHLOSSEN?
 * ========================================================================= */
console.log('\n0 · Angeschlossen');

const angeschlossen = await seite.evaluate(() => ({
  ansicht: typeof (window as any).SpreadsheetView !== 'undefined',
  kern:    typeof (window as any).Spreadsheet !== 'undefined',
  refs:    typeof (window as any).CellRefs !== 'undefined',
  register: !!(window as any).Register?.bloecke?.alle?.().some?.((b: any) => b.id === 'spreadsheet')
}));
p('SpreadsheetView ist geladen', angeschlossen.ansicht);
p('Der Kern ist geladen', angeschlossen.kern);
p('Die Adressen sind geladen', angeschlossen.refs);

if (!angeschlossen.ansicht || !angeschlossen.kern) {
  console.log('\n  (Ohne die beiden geht nichts weiter.)');
  console.log(`\n  Suite 75 — Tabellenblock: ${ok} ok, ${weg + 1} offen`);
  await browser.close(); server.close(); process.exit(1);
}

/* Einen Block anlegen und zeichnen lassen — ohne den Editor, damit diese
   Prüfung misst, was SIE misst, und nicht den halben Editor mit. */
/* `Store` steht NICHT auf `window` — es ist ein gewöhnliches `const` auf
   oberster Ebene, und ein solches ist ein globaler Name, aber keine
   Eigenschaft von `window`. Wer hier `window.Store` schreibt, bekommt
   `undefined` und eine Meldung, die nach einem kaputten Baustein aussieht.
   Dieselbe Falle steht schon im Kopf von `engine.ts`. */
const aufbauen = async (): Promise<void> => {
  await seite.evaluate(() => {
    const w = window as any;
    const seiteId = Object.values(Store.cache.blocks)
      .find((b: any) => b.type === 'page' && b.alive) as any;
    const blk = Store.addBlock(seiteId.id, 'spreadsheet', { text: 'Prüfung' });
    w.__blockId = blk.id;
    const kasten = document.createElement('div');
    kasten.id = 'pruef-tabelle';
    document.body?.appendChild(kasten);
    kasten.appendChild(w.SpreadsheetView.zeichne(blk));
  });
};
await aufbauen();

/* ========================================================================= *
 * 1 · DAS RASTER STEHT
 * ========================================================================= */
console.log('\n1 · Das Raster');

const raster = await seite.evaluate(() => {
  const t = document.querySelector<HTMLTableElement>('#pruef-tabelle .tbl') as HTMLElement;
  return {
    da: !!t,
    spalten: t.querySelectorAll('.tbl-sp').length,
    zeilen: t.querySelectorAll('.tbl-zeile').length,
    kopf: !!t.querySelector('.tbl-eingabe'),
    fuss: (t.querySelector('.tbl-fuss') as HTMLElement)?.textContent || '',
    gewaehlt: (t.querySelector('.tbl-z.gewaehlt') as HTMLElement)?.dataset.a,
    ecke: (t.querySelector('.tbl-z.ecke') as HTMLElement)?.dataset.a,
    /* Der Fokusring am Raster: die Tabelle ist EIN Tabstopp, also muss man
       sehen, wenn man drinsteht. Gemessen wird die gerechnete Regel, nicht
       der Text im Stilblatt. */
    fokusring: [...document.styleSheets].some(bl => {
      try {
        return [...(bl.cssRules || [])].some(r =>
          /\.tbl-feld:focus-visible/.test((r as any).selectorText || '') &&
          /solid/.test((r as any).style?.outline || ''));
      } catch { return false; }
    }),
    fokusUmriss: ''
  };
});
p('Der Block ist gezeichnet', raster.da);
gleich('Zwanzig Spalten', raster.spalten, 20);
p('Nicht alle fünfzig Zeilen auf einmal — nur das Sichtbare',
  raster.zeilen > 0 && raster.zeilen < 50, String(raster.zeilen));
p('Die Bearbeitungszeile ist da', raster.kopf);
gleich('A1 ist ausgewählt', raster.gewaehlt, 'A1');
gleich('Und trägt den Anfasser', raster.ecke, 'A1');
/* Eine leere Tabelle erklärt sich nicht von selbst — wer noch nie eine
   Formel getippt hat, weiss nicht, dass sie mit `=` anfängt. */
p('Die leere Tabelle sagt, womit man anfängt',
  (raster.fuss ?? '').includes('=SUMME'), raster.fuss);
p('Das Raster hat einen sichtbaren Fokusring', raster.fokusring, raster.fokusUmriss);

/* ========================================================================= *
 * 2 · DAS ÖFFNEN ALLEIN ÄNDERT NICHTS
 * ------------------------------------------------------------------------
 * Der Kern dieser Suite. Siehe Kopf.
 * ========================================================================= */
console.log('\n2 · Ansehen ist keine Änderung');

const ansehen = await seite.evaluate(async () => {
  const w = window as any;
  const blk = Store.getBlock(w.__blockId);
  const vorher = blk.edited;
  /* Warten, bis alles ruht — dann ein zweites Mal zeichnen, wie es
     App.zeichneSeite() bei jeder Kleinigkeit tut. */
  await new Promise(f => setTimeout(f, 60));
  const dazwischen = Store.getBlock(w.__blockId).edited;
  const kasten = document.getElementById('pruef-tabelle')!;
  kasten.innerHTML = '';
  kasten.appendChild(w.SpreadsheetView.zeichne(Store.getBlock(w.__blockId)));
  await new Promise(f => setTimeout(f, 60));
  return { vorher, dazwischen, nachher: Store.getBlock(w.__blockId).edited };
});
p('Nach dem ersten Zeichnen steht kein neues Datum in der Ablage',
  ansehen.vorher === ansehen.dazwischen, `${ansehen.vorher} → ${ansehen.dazwischen}`);
p('Und nach dem zweiten auch nicht',
  ansehen.dazwischen === ansehen.nachher, `${ansehen.dazwischen} → ${ansehen.nachher}`);

/* ========================================================================= *
 * 3 · ES SAMMELN SICH KEINE ZUHÖRER AN
 * ------------------------------------------------------------------------
 * Gezählt wird über einen untergeschobenen `addEventListener` am Dokument.
 * Ein Block, der beim Zeichnen einen anhängt und nie abhängt, fällt hier auf
 * — und zwar beim zehnten Zeichnen, nicht erst nach einer Stunde Arbeit.
 * ========================================================================= */
console.log('\n3 · Keine Zuhörer auf Vorrat');

const zuhoerer = await seite.evaluate(async () => {
  const w = window as any;
  let dazu = 0, weg = 0;
  const altAn = document.addEventListener.bind(document);
  const altAb = document.removeEventListener.bind(document);
  (document as any).addEventListener = (...a: any[]) => { dazu++; return (altAn as any)(...a); };
  (document as any).removeEventListener = (...a: any[]) => { weg++; return (altAb as any)(...a); };

  const kasten = document.getElementById('pruef-tabelle')!;
  for (let i = 0; i < 10; i++) {
    kasten.innerHTML = '';
    kasten.appendChild(w.SpreadsheetView.zeichne(Store.getBlock(w.__blockId)));
  }
  await new Promise(f => setTimeout(f, 30));
  (document as any).addEventListener = altAn;
  (document as any).removeEventListener = altAb;
  return { dazu, weg };
});
p('Zehnmal zeichnen hängt nichts Dauerhaftes ans Dokument',
  zuhoerer.dazu === 0, `${zuhoerer.dazu} angehängt, ${zuhoerer.weg} abgehängt`);

/* ========================================================================= *
 * 4 · TIPPEN, RECHNEN, SPEICHERN
 * ========================================================================= */
console.log('\n4 · Tippen und rechnen');

const tippen = await seite.evaluate(async () => {
  /* Das Element, das gerade den Fokus hat. `document.activeElement` ist
     `Element | null` und hat weder `dataset` noch `focus`. Hier steht eine
     Prüfung statt einer Behauptung: hat nichts den Fokus, sagt die Meldung
     das — statt „Cannot read properties of null". */
  const aktiv = (): HTMLElement => {
    const el = document.activeElement;
    if (!(el instanceof HTMLElement))
      throw new Error('Kein Element hat gerade den Fokus.');
    return el;
  };
  const w = window as any;
  const t = document.querySelector<HTMLTableElement>('#pruef-tabelle .tbl') as HTMLElement;
  const feld = t.querySelector('.tbl-feld') as HTMLElement;
  const zeile = t.querySelector('.tbl-eingabe') as HTMLInputElement;

  const setzen = async (adr: string, text: string) => {
    (t.querySelector(`[data-a="${adr}"]`) as HTMLElement)
      .dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    zeile.value = text;
    zeile.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await new Promise(f => setTimeout(f, 10));
  };

  await setzen('A1', '10');
  await setzen('A2', '32');
  await setzen('A3', '=SUMME(A1:A2)');
  await new Promise(f => setTimeout(f, 40));

  const zellText = (adr: string) =>
    (t.querySelector(`[data-a="${adr}"]`) as HTMLElement)?.textContent;

  const blk = Store.getBlock(w.__blockId);
  return {
    a3: zellText('A3'),
    formelmarke: (t.querySelector('[data-a="A3"]') as HTMLElement).classList.contains('formel'),
    zahlRechts: (t.querySelector('[data-a="A1"]') as HTMLElement).classList.contains('zahl'),
    gespeichert: blk.mappe?.blaetter?.[0]?.zellen?.A3?.formel,
    wertGespeichert: blk.mappe?.blaetter?.[0]?.zellen?.A3?.wert,
    fuss: (t.querySelector('.tbl-fuss') as HTMLElement).textContent,
    fokus: aktiv() === feld
  };
});
gleich('A3 zeigt die Summe', tippen.a3, '42');
p('A3 trägt die Formelecke', tippen.formelmarke);
p('Eine Zahl steht rechts', tippen.zahlRechts);
gleich('Die Formel steht in der Ablage', tippen.gespeichert, '=SUMME(A1:A2)');
gleich('Und der gerechnete Wert auch', tippen.wertGespeichert, 42);
p('Nach Enter liegt der Fokus wieder im Raster', tippen.fokus);

/* ========================================================================= *
 * 4b · EINE ZAHL, DIE NICHT PASST, DARF KEINE ANDERE ZAHL SEIN
 * ------------------------------------------------------------------------
 * Der schlimmste Fehler, den dieser Block hatte, und er sah harmlos aus.
 * Zahlen stehen rechtsbündig; passt eine nicht in die Spalte, schneidet der
 * Browser sie VORNE ab. `634.2166666667` stand als `34.2166666667` da — das
 * ist keine halbe Zahl mehr, sondern eine andere. Vollständig aussehend,
 * plausibel, und niemand rechnet nach.
 *
 * Die erste Prüfung dagegen mass `scrollWidth` gegen `clientWidth` und
 * bekam für eine 21-stellige Zahl in 109 px: 109 gegen 109. Der Text ist
 * ein anonymes Flex-Element und wird gestaucht statt überzustehen — es gibt
 * gar keinen überstehenden Inhalt. Deshalb steht hier der SICHTBARE Text
 * gegen den gespeicherten Wert, und nicht irgendeine Breite.
 * ========================================================================= */
console.log('\n4b · Keine abgeschnittenen Zahlen');

const zahlen = await seite.evaluate(() => {
  const w = window as any;
  const blk = Store.getBlock(w.__blockId);
  const bl = blk.mappe.blaetter[0];
  w.Spreadsheet.setze(bl, 'G1', '634.2166666667');
  w.Spreadsheet.setze(bl, 'G2', '1234567890123456');
  w.Spreadsheet.setze(bl, 'G3', '42');
  const kasten = document.getElementById('pruef-tabelle')!;
  kasten.innerHTML = '';
  kasten.appendChild(w.SpreadsheetView.zeichne(blk));
  return new Promise(f => setTimeout(() => {
    const lies = (a: string) => {
      const d = kasten.querySelector(`[data-a="${a}"]`) as HTMLElement;
      return { text: d.textContent || '', titel: d.title, klassen: d.className,
               vorgelesen: d.getAttribute('aria-label') || '' };
    };
    f({ g1: lies('G1'), g2: lies('G2'), g3: lies('G3') });
  }, 60));
}) as any;

/* Der eine Satz, um den es geht: was dasteht, ist entweder die Zahl oder
   sichtbar keine Zahl — aber nie eine andere. */
p('Eine zu lange Zahl wird gekürzt, nicht abgeschnitten',
  zahlen.g1.text.startsWith('634'), zahlen.g1.text);
p('… und der volle Wert steht im Titel',
  (zahlen.g1.titel ?? '').includes('634.2166666667'), zahlen.g1.titel);
p('Passt nicht einmal die Grössenordnung, steht ### da',
  zahlen.g2.text === '###', zahlen.g2.text);
p('… mit dem vollen Wert und einem Rat im Titel',
  (zahlen.g2.titel ?? '').includes('zu schmal'), zahlen.g2.titel);
p('Eine kurze Zahl bleibt unangetastet', zahlen.g3.text === '42', zahlen.g3.text);
/* Vorgelesen wird immer der volle Wert — die Kürzung ist eine Sache des
   Platzes, nicht des Inhalts. */
p('Vorgelesen wird der volle Wert, nicht der gekürzte',
  (zahlen.g1.vorgelesen ?? '').includes('634.2166666667'), zahlen.g1.vorgelesen);
p('… und bei ### erst recht',
  /1|2|3/.test(zahlen.g2.vorgelesen) && !(zahlen.g2.vorgelesen ?? '').includes('###'),
  zahlen.g2.vorgelesen);

/* ========================================================================= *
 * 4c · DER RUNDLAUF MIT ECHTEN BYTES
 * ------------------------------------------------------------------------
 * `AUFGABEN.md` Phase 8 sagt, wann Import und Export fertig sind: **„ein
 * Rundlauf mit echten Bytes: exportieren, löschen, importieren,
 * vergleichen."** Nicht: die Funktion gibt einen Text zurück, der plausibel
 * aussieht.
 *
 * Also wird hier wirklich eine .xlsx gebaut — mit ZIP, CRC32 und den vier
 * Beipackzetteln, die das Format verlangt —, wieder auseinandergenommen und
 * Zelle für Zelle verglichen. Geht dabei etwas verloren, fällt es hier auf
 * und nicht bei jemandem, der seine Tabelle wiederhaben will.
 * ========================================================================= */
console.log('\n4c · Ausgeben und wieder einlesen');

const rundlauf = await seite.evaluate(async () => {
  const w = window as any;

  /* Ein Blatt mit genau den Zeichen, die wehtun: Semikolon im Feld,
     Anführungszeichen, deutsches Komma, Umlaut, leere Zeile. */
  const bl = w.Spreadsheet.neuesBlatt('Rundlauf', 20, 5);
  const drin = [
    ['Posten', 'Betrag', 'Wer'],
    ['Miete', '1450,5', 'Meier; Hans'],
    ['Strom', '98,4', 'sagte "ja"'],
    ['', '', ''],
    ['Müller & Söhne', '0', 'Ümlaut']
  ];
  drin.forEach((zeile, z) => zeile.forEach((wert, sp) =>
    w.Spreadsheet.setze(bl, String.fromCharCode(65 + sp) + (z + 1), wert)));

  const alsZeilen = (): string[][] => {
    const raus: string[][] = [];
    for (let z = 0; z < 5; z++) {
      const eine: string[] = [];
      for (let s = 0; s < 3; s++) {
        const c = bl.zellen[String.fromCharCode(65 + s) + (z + 1)];
        const v = c ? c.wert : '';
        eine.push(v === '' || v === undefined || v === null ? '' : String(v));
      }
      raus.push(eine);
    }
    return raus;
  };
  const vorher = alsZeilen();

  /* --- CSV: schreiben und mit demselben Modul wieder lesen --- */
  const csvText = w.Csv.mitBom(w.Csv.schreibe(vorher, ';'));
  const csvZurueck = w.Csv.zerlege(csvText);

  /* --- XLSX: echte Bytes durch zipSchreiben und wieder heraus --- */
  const blob = await w.Austausch.zipSchreiben([
    { name: '[Content_Types].xml', inhalt:
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
      '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
      '</Types>' },
    { name: '_rels/.rels', inhalt:
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
      '</Relationships>' },
    { name: 'xl/workbook.xml', inhalt:
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ' +
      'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
      '<sheets><sheet name="Rundlauf" sheetId="1" r:id="rId1"/></sheets></workbook>' },
    { name: 'xl/_rels/workbook.xml.rels', inhalt:
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>' +
      '</Relationships>' },
    { name: 'xl/worksheets/sheet1.xml', inhalt: w.Austausch.blattXml(vorher) }
  ]);

  const bytes = blob.size;
  const blaetter = await w.Einlesen.xlsxLesen(await blob.arrayBuffer());
  const xlsxZurueck = (blaetter[0]?.zeilen || []).map((z: any[]) =>
    [0, 1, 2].map(i => (z[i] === undefined || z[i] === null) ? '' : String(z[i])));

  return { vorher, csvZurueck, xlsxZurueck, bytes, blattName: blaetter[0]?.name };
}) as any;

/* Vergleich mit dem, was Excel wirklich zurückgibt: eine Zahl kommt als
   Zahl zurück, `1450,5` also als `1450.5`. Das ist richtig so und muss beim
   Vergleich berücksichtigt werden — sonst prüft der Test seine eigene
   Erwartung statt der Sache. */
const alsZahlText = (z: string[][]) => z.map(r => r.map(v => {
  const n = Number(String(v).replace(',', '.'));
  return (v !== '' && isFinite(n)) ? String(n) : v;
}));

gleich('CSV: der Rundlauf ergibt Zeile für Zeile dasselbe',
  rundlauf.csvZurueck, rundlauf.vorher);
p('XLSX: es sind wirklich Bytes entstanden', rundlauf.bytes > 400, rundlauf.bytes + ' Bytes');
gleich('XLSX: der Blattname übersteht es', rundlauf.blattName, 'Rundlauf');
gleich('XLSX: der Rundlauf ergibt Zeile für Zeile dasselbe',
  rundlauf.xlsxZurueck, alsZahlText(rundlauf.vorher));

/* Und die drei Zeichen, an denen so ein Rundlauf sonst scheitert. */
p('Das Semikolon im Feld hat überlebt',
  JSON.stringify(rundlauf.csvZurueck).includes('Meier; Hans'));
p('Das Anführungszeichen im Feld auch',
  JSON.stringify(rundlauf.csvZurueck).includes('sagte \\"ja\\"'));
p('Und der Umlaut', JSON.stringify(rundlauf.xlsxZurueck).includes('Ümlaut'));
p('Die leere Zeile ist noch an ihrer Stelle',
  rundlauf.csvZurueck[3] && rundlauf.csvZurueck[3].every((x: string) => x === ''),
  JSON.stringify(rundlauf.csvZurueck[3]));

/* ========================================================================= *
 * 5 · DER NEUSTART
 * ------------------------------------------------------------------------
 * Nicht „steht es im Zwischenspeicher", sondern: neue Seite, neuer
 * IndexedDB-Zugriff, und die Zahlen sind noch da.
 * ========================================================================= */
console.log('\n5 · Nach dem Neustart');

/* Alle ausstehenden IndexedDB-Schreibvorgänge abschliessen, bevor die zweite
   Seite die Datenbank liest. `Store.flush()` gibt jetzt ein Promise zurück,
   das erst auflöst, wenn die Transaktion wirklich abgeschlossen ist. */
await seite.evaluate(() => Store.flush());
const blockId = await seite.evaluate(() => (window as any).__blockId);
const zweite = await oeffne();
const nachNeustart = await zweite.evaluate((id: string) => {
  const blk = Store.getBlock(id);
  if (!blk) return { da: false };
  const blatt = blk.mappe?.blaetter?.[0];
  return {
    da: true,
    typ: blk.type,
    a1: blatt?.zellen?.A1?.wert,
    a3formel: blatt?.zellen?.A3?.formel,
    a3wert: blatt?.zellen?.A3?.wert
  };
}, blockId);
p('Der Block ist nach dem Neustart da', nachNeustart.da);
gleich('… und ist eine Kalkulationstabelle', nachNeustart.typ, 'spreadsheet');
gleich('A1 ist noch 10', nachNeustart.a1, 10);
gleich('Die Formel steht noch in A3', nachNeustart.a3formel, '=SUMME(A1:A2)');
gleich('Und ihr Wert auch', nachNeustart.a3wert, 42);

/* Und das Wichtigste: der Kern rechnet sie nach dem Laden identisch nach.
   Ergäbe das etwas anderes, hätte das Speichern etwas verloren. */
const nachgerechnet = await zweite.evaluate((id: string) => {
  const blatt = Store.getBlock(id).mappe.blaetter[0];
  const erg = (window as any).Spreadsheet.rechne(blatt);
  return { geaendert: erg.geaendert, a3: blatt.zellen.A3.wert };
}, blockId);
gleich('Nachrechnen ändert nichts', nachgerechnet.geaendert, []);
gleich('… und A3 bleibt 42', nachgerechnet.a3, 42);
await zweite.close();

/* ========================================================================= *
 * 5b · DIE BLATTREITER
 * ------------------------------------------------------------------------
 * Drei Dinge, die man beim Zeichnen falsch machen kann und die keine
 * Kernprüfung findet:
 *
 *   · **Welches Blatt offen ist, muss den Neustart überleben.** Steht es nur
 *     in einer Variablen der Ansicht, springt die Tabelle bei jedem Öffnen
 *     zurück auf das erste — und wer auf Blatt 7 arbeitet, sucht es jedes Mal.
 *   · **Bei EINEM Blatt sind die Reiter unsichtbar.** Ein einzelner Reiter
 *     über einer einzelnen Tabelle erklärt nichts und kostet in jedem Block
 *     eine Zeile Höhe.
 *   · **Der Plus-Knopf bleibt trotzdem sichtbar** — sonst gäbe es keinen Weg
 *     zum zweiten Blatt, und eine Funktion ohne Weg dorthin gibt es nicht.
 * ========================================================================= */
console.log('\n5b · Blattreiter');

const reiter = await seite.evaluate(async () => {
  const w = window as any;
  const blk = Store.getBlock(w.__blockId);
  const kasten = document.getElementById('pruef-tabelle')!;

  const zeichne = () => {
    kasten.innerHTML = '';
    kasten.appendChild(w.SpreadsheetView.zeichne(Store.getBlock(w.__blockId)));
  };

  /* Mit einem Blatt: keine Reiter, aber ein Plus. */
  zeichne();
  const einzeln = {
    sichtbar: kasten.querySelectorAll('.tbl-reiter-eins').length,
    versteckt: (kasten.querySelector('.tbl-reiter') as HTMLElement).classList.contains('einzeln'),
    plus: !!kasten.querySelector('.tbl-reiter-plus')
  };

  /* Ein zweites Blatt, das aus dem ersten liest. */
  blk.mappe.blaetter[0].name = 'Januar';
  const feb = w.Spreadsheet.neuesBlatt('Februar');
  blk.mappe.blaetter.push(feb);
  w.Spreadsheet.setze(feb, 'A1', '=SUMME(Januar!A1:A2)');
  blk.mappe.aktiv = feb.id;
  Store.updateBlock(blk.id, { mappe: blk.mappe });
  zeichne();
  await new Promise(f => setTimeout(f, 60));

  const viele = {
    anzahl: kasten.querySelectorAll('.tbl-reiter-eins').length,
    namen: [...kasten.querySelectorAll<HTMLElement>('.tbl-reiter-eins')].map(x => x.textContent),
    aktiv: (kasten.querySelector('.tbl-reiter-eins.aktiv') as HTMLElement)?.textContent,
    /* Februar!A1 muss die Summe aus Januar zeigen — A1 ist 10, A2 ist 32. */
    a1: (kasten.querySelector('[data-a="A1"]') as HTMLElement)?.textContent
  };

  /* Auf Januar klicken. */
  const ersterReiter = kasten.querySelector('.tbl-reiter-eins') as HTMLElement;
  ersterReiter.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  await new Promise(f => setTimeout(f, 60));
  const nachWechsel = {
    aktiv: (kasten.querySelector('.tbl-reiter-eins.aktiv') as HTMLElement)?.textContent,
    a1: (kasten.querySelector('[data-a="A1"]') as HTMLElement)?.textContent,
    gemerkt: Store.getBlock(w.__blockId).mappe.aktiv === blk.mappe.blaetter[0].id
  };

  /* Umbenennen — und die Formel auf dem anderen Blatt muss mitwandern. */
  blk.mappe.blaetter.forEach((b: any) => {
    Object.keys(b.zellen).forEach(a => {
      const z = b.zellen[a];
      if (z.formel) z.formel = w.Spreadsheet.blattUmbenannt(z.formel, 'Januar', 'Jan');
    });
  });
  blk.mappe.blaetter[0].name = 'Jan';
  const erg = w.Spreadsheet.rechneMappe(blk.mappe);

  return { einzeln, viele, nachWechsel,
           formelNachher: feb.zellen.A1.formel,
           wertNachher: feb.zellen.A1.wert,
           kreise: erg.zirkel.length };
}) as any;

gleich('Mit einem Blatt ist kein Reiter zu sehen', reiter.einzeln.sichtbar, 1);
p('… die Leiste ist als „einzeln" gekennzeichnet', reiter.einzeln.versteckt);
p('… der Plus-Knopf bleibt trotzdem da', reiter.einzeln.plus);

gleich('Mit zwei Blättern stehen zwei Reiter da', reiter.viele.anzahl, 2);
gleich('… mit ihren Namen', reiter.viele.namen, ['Januar', 'Februar']);
gleich('Der aktive ist markiert', reiter.viele.aktiv, 'Februar');
gleich('Februar rechnet mit Januars Zahlen', reiter.viele.a1, '42');

gleich('Ein Klick wechselt das Blatt', reiter.nachWechsel.aktiv, 'Januar');
gleich('… und zeigt dessen Inhalt', reiter.nachWechsel.a1, '10');
p('… und die Mappe merkt sich, welches offen ist', reiter.nachWechsel.gemerkt);

gleich('Beim Umbenennen wandert die Formel mit',
  reiter.formelNachher, '=SUMME(Jan!A1:A2)');
gleich('… und rechnet weiterhin richtig', reiter.wertNachher, 42);
gleich('Kein Blatt liest sich versehentlich selbst', reiter.kreise, 0);

/* ========================================================================= *
 * 6 · DIE TASTATUR
 * ========================================================================= */
console.log('\n6 · Tastatur');

const tastatur = await seite.evaluate(async () => {
  const t = document.querySelector<HTMLTableElement>('#pruef-tabelle .tbl') as HTMLElement;
  const feld = t.querySelector('.tbl-feld') as HTMLElement;
  const wo = () => (t.querySelector('.tbl-z.gewaehlt') as HTMLElement)?.dataset.a;
  const taste = async (key: string, opt: any = {}) => {
    feld.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...opt }));
    await new Promise(f => setTimeout(f, 10));
  };
  (t.querySelector('[data-a="B2"]') as HTMLElement)
    .dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
  await new Promise(f => setTimeout(f, 10));
  const start = wo();
  await taste('ArrowDown'); const runter = wo();
  await taste('ArrowRight'); const rechts = wo();
  await taste('Home'); const heim = wo();
  await taste('ArrowRight', { shiftKey: true });
  const bereich = t.querySelectorAll('.tbl-z.imBereich, .tbl-z.gewaehlt').length;
  await taste('End', { ctrlKey: true }); const ende = wo();
  return { start, runter, rechts, heim, bereich, ende };
});
gleich('Ein Klick wählt B2', tastatur.start, 'B2');
gleich('Pfeil runter geht nach B3', tastatur.runter, 'B3');
gleich('Pfeil rechts nach C3', tastatur.rechts, 'C3');
gleich('Home springt an den Zeilenanfang', tastatur.heim, 'A3');
p('Umschalt+Pfeil wählt einen Bereich', tastatur.bereich >= 2, String(tastatur.bereich));
gleich('Strg+Ende geht in die letzte Ecke', tastatur.ende, 'T50');

/* ========================================================================= *
 * 7 · DAS AUSSEHEN — HELL UND DUNKEL
 * ------------------------------------------------------------------------
 * Gemessen wird der wirklich gerechnete Wert, nicht das, was im Stilblatt
 * steht. Eine Farbe, die von einer späteren Regel überschrieben wird, sieht
 * im Quelltext richtig aus und auf dem Bildschirm falsch.
 * ========================================================================= */
console.log('\n7 · Hell und dunkel');

/* UMGESCHALTET WIRD ÜBER `html[data-theme="light"]` — genau so, wie es
   `hell.css` in seinem Kopf schreibt, und nicht über eine ausgedachte
   Klasse. Der erste Entwurf schaltete eine Klasse `hell` um; gemessen wurden
   dann zweimal dieselben dunklen Werte, und die Prüfung wäre dauerhaft grün
   gewesen, egal wie kaputt der Hellmodus ist.

   Gemessen wird ausserdem die FLÄCHE am `.tbl`, nicht an der Zelle: die
   Zelle ist mit Absicht durchsichtig und zeigt den Grund des Blocks. Wer
   dort misst, misst `rgba(0,0,0,0)` und lernt nichts. */
const farbenVon = async (hell: boolean) => await seite.evaluate((h: boolean) => {
  document.documentElement.setAttribute('data-theme', h ? 'light' : 'dark');
  const t = document.querySelector<HTMLTableElement>('#pruef-tabelle .tbl') as HTMLElement;
  const z = t.querySelector('.tbl-z') as HTMLElement;
  const kopf = t.querySelector('.tbl-sp') as HTMLElement;
  const kopfLeiste = t.querySelector('.tbl-spalten') as HTMLElement;
  const g = (el: Element, eig: string) => getComputedStyle(el).getPropertyValue(eig);
  const zahl = (s: string) => (s.match(/[\d.]+/g) || []).map(Number);
  const hellig = (s: string) => { const [r, gr, b] = zahl(s); return (0.2126 * (r ?? 0) + 0.7152 * (gr ?? 0) + 0.0722 * (b ?? 0)); };
  return {
    zelleGrund: g(t, 'background-color'),
    zelleText: g(z, 'color'),
    /* Die einzelne Spaltenüberschrift ist durchsichtig und zeigt den Grund
       der Leiste — gemessen wird deshalb die Leiste. */
    kopfGrund: g(kopfLeiste, 'background-color'),
    kopfText: g(kopf, 'color'),
    hellGrund: hellig(g(t, 'background-color')),
    hellText: hellig(g(z, 'color')),
    hellKopf: hellig(g(kopf, 'color')),
    radius: g(t.querySelector('.tbl-z.gewaehlt')!, 'border-radius'),
    schatten: g(t.querySelector('.tbl-z.gewaehlt')!, 'box-shadow'),
    ziffern: g(z, 'font-variant-numeric')
  };
}, hell);

const dunkel = await farbenVon(false);
const hell = await farbenVon(true);
await seite.evaluate(() => { document.documentElement.setAttribute('data-theme', 'dark'); });

p('Der Hellmodus schaltet überhaupt um — sonst misst alles Weitere nichts',
  dunkel.zelleGrund !== hell.zelleGrund, `${dunkel.zelleGrund} / ${hell.zelleGrund}`);
p('Dunkel: die Zellfläche ist dunkel', dunkel.hellGrund < 90, dunkel.zelleGrund);
p('Dunkel: die Schrift ist hell', dunkel.hellText > 140, dunkel.zelleText);
p('Hell: die Zellfläche ist hell', hell.hellGrund > 200, hell.zelleGrund);
p('Hell: die Schrift ist dunkel', hell.hellText < 120, hell.zelleText);
p('Auch die Köpfe sind in beiden Fassungen verschieden',
  dunkel.kopfGrund !== hell.kopfGrund, `${dunkel.kopfGrund} / ${hell.kopfGrund}`);

/* Der Kopfzeilentext ist der, den man am ehesten verhungern lässt. */
const abstand = (a: number, b: number) => Math.abs(a - b);
p('Dunkel: die Kopfbeschriftung hebt sich ab',
  abstand(dunkel.hellKopf, dunkel.hellGrund) > 45,
  `Kopf ${Math.round(dunkel.hellKopf)} gegen Grund ${Math.round(dunkel.hellGrund)}`);
p('Hell: ebenso',
  abstand(hell.hellKopf, hell.hellGrund) > 45,
  `Kopf ${Math.round(hell.hellKopf)} gegen Grund ${Math.round(hell.hellGrund)}`);

/* Die zwei Entscheidungen aus DESIGN-TABELLE.md, die man sonst still
   verliert, sobald jemand „mal eben" ein Radius-Token durchzieht. */
gleich('Die Auswahl hat keinen Radius', dunkel.radius, '0px');
p('Die Auswahl liegt innen (inset)', /inset/.test(dunkel.schatten ?? ''), dunkel.schatten);
p('Die Ziffern haben gleiche Breite', /tabular-nums/.test(dunkel.ziffern ?? ''), dunkel.ziffern);

/* ========================================================================= *
 * 8 · AM TELEFON
 * ------------------------------------------------------------------------
 * 390 px ist ein iPhone 13/14/15. Die Zahl steht in DESIGN-TABELLE.md, und
 * die 16 px im Eingabefeld sind dort keine Geschmacksfrage: Safari zoomt die
 * ganze Seite hinein, sobald ein Feld kleiner ist.
 * ========================================================================= */
console.log('\n8 · Am Telefon (390 px)');

const handy = await kontext.newPage();
handy.on('pageerror', (e: Error) => fehler.push(e.message));
await handy.setViewportSize({ width: 390, height: 844 });
await handy.goto(`http://localhost:${PORT}/index.html`);
/* Auf die GELADENE Ablage warten, nicht nur auf die Namen. Der Block
   entstand in der anderen Seite; diese hier muss ihn erst aus IndexedDB
   geholt haben, sonst ist er schlicht noch nicht da. */
await handy.waitForFunction(() => typeof App !== 'undefined' && typeof Store !== 'undefined' &&
  (document.getElementById('tree')?.children.length || 0) > 0, null, { timeout: 30000 });

/* IN EINEN KASTEN VON GENAU 390 px. Sonst misst diese Prüfung die
   App-Schale mit — der Rumpf ist wegen der Seitenleiste breiter als das
   Fenster, und der Block sähe schuldig aus, obwohl er brav die Breite
   seines Elternteils nimmt. Gefragt ist: passt der Block in das, was ihm
   gegeben wird. */
const amHandy = await handy.evaluate((id: string) => {
  const w = window as any;
  const kasten = document.createElement('div');
  kasten.id = 'pruef-tabelle';
  kasten.style.cssText = 'width:390px; position:fixed; left:0; top:0; z-index:99999';
  document.body?.appendChild(kasten);
  kasten.appendChild(w.SpreadsheetView.zeichne(Store.getBlock(id)));
  const t = kasten.querySelector<HTMLTableElement>('.tbl') as HTMLElement;
  const z = t.querySelector('.tbl-z') as HTMLElement;
  const knopf = t.querySelector('.tbl-werkzeuge button') as HTMLElement;
  const eingabe = t.querySelector('.tbl-eingabe') as HTMLElement;
  const feld = t.querySelector('.tbl-feld') as HTMLElement;
  const px = (el: Element, eig: string) => parseFloat(getComputedStyle(el).getPropertyValue(eig));
  return {
    zeilenhoehe: z.getBoundingClientRect().height,
    zellSchrift: px(z, 'font-size'),
    eingabeSchrift: px(eingabe, 'font-size'),
    knopfHoehe: knopf.getBoundingClientRect().height,
    knopfBreite: knopf.getBoundingClientRect().width,
    /* Rollt die Leiste, steckt ein Knopf zu viel drin — und der letzte ist
       der ⋯-Knopf mit „Als Excel speichern" dahinter. */
    leisteRollt: (t.querySelector('.tbl-werkzeuge') as HTMLElement).scrollWidth >
                 (t.querySelector('.tbl-werkzeuge') as HTMLElement).clientWidth + 1,
    eingabeBreite: eingabe.getBoundingClientRect().width,
    breite: t.getBoundingClientRect().width,
    rollt: feld.scrollWidth > feld.clientWidth
  };
}, blockId);

p('Die Zeile ist am Finger hoch genug (≥ 38 px)',
  amHandy.zeilenhoehe >= 38, String(Math.round(amHandy.zeilenhoehe)));
gleich('Die Zellschrift ist 16 px', amHandy.zellSchrift, 16);
p('Das Eingabefeld ist mindestens 16 px — sonst zoomt iOS',
  amHandy.eingabeSchrift >= 16, String(amHandy.eingabeSchrift));
/* 44 px, weil ein Finger 44 px braucht — die Zahl steht so in
   `redion-mobile-ux`. Sie ist der Grund, warum die Leiste am Telefon zwei
   Knöpfe zeigt statt elf: elf mal 44 wären 484 px auf einem 390 px breiten
   Gerät. */
p('Die Knöpfe treffen einen Finger (≥ 44 px)',
  amHandy.knopfHoehe >= 44 && amHandy.knopfBreite >= 44,
  `${Math.round(amHandy.knopfBreite)}×${Math.round(amHandy.knopfHoehe)}`);
p('Die Werkzeugleiste passt ohne Rollen ins Bild',
  !amHandy.leisteRollt, 'sie rollt — dann ist ein Knopf zu viel drin');
p('Und die Bearbeitungszeile ist breit genug zum Tippen (≥ 150 px)',
  amHandy.eingabeBreite >= 150, String(Math.round(amHandy.eingabeBreite)));
p('Der Block passt in 390 px', Number(amHandy.breite ?? -1) <= 390.5, String(Math.round(amHandy.breite)));
p('Die Tabelle rollt waagerecht statt zu quetschen', amHandy.rollt);
await handy.close();

/* ========================================================================= *
 * 9 · ES GAB KEINEN FEHLER IN DER KONSOLE
 * ========================================================================= */
console.log('\n9 · Die Konsole');
p('Kein Skriptfehler auf keiner Seite', fehler.length === 0, fehler.slice(0, 3).join(' · '));

await browser.close();
server.close();
console.log(`\n  Suite 75 — Tabellenblock: ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
