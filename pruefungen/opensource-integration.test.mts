
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import test from 'node:test';
import vm from 'node:vm';

function laden(dateien: string[], globals = {}) {
  const context = vm.createContext({ window: {}, ...globals });
  for (const datei of dateien) {
    vm.runInContext(fs.readFileSync(new URL('../quell/' + datei, import.meta.url), 'utf8'), context, { filename: datei });
  }
  return context;
}

function normal<T>(wert: T): T {
  return JSON.parse(JSON.stringify(wert));
}

type Knoten = { id: string; text: string; eltern: string | null; zu?: boolean };
type Pruefpunkt = { id: string; stufe: string; art: string };

test('Gedankenkarte liest Überschriften und Listen und schreibt ihren gesamten Baum', () => {
  const { Gedankenkarte: karte } = laden(['bereiche/bloecke/arten/gedankenkarte.js']).window;
  const input = '\uFEFF---\ntitle: Beispiel\n---\n# Schaltung #\n## Vorbereitung\n- Klemmen\n  1. L\n  2. N\n' +
    '```md\n# Ignoriert\n- Ignoriert\n```\n### Beschriftung\n- <img src=x>';
  const modell: { knoten: Knoten[] } = karte.ausMarkdown(input);
  assert.deepEqual(normal(modell.knoten.map(k => [k.text, k.eltern])), [
    ['Schaltung', null], ['Vorbereitung', 'w'], ['Klemmen', 'md-1'],
    ['L', 'md-2'], ['N', 'md-2'], ['Beschriftung', 'md-1'], ['<img src=x>', 'md-5'],
  ]);
  const [wurzel, ast] = modell.knoten;
  assert.ok(wurzel && ast);
  wurzel.text = 'Licht #';
  ast.zu = true;
  ast.text = 'L_1 * plus \\ Erde';
  const ausgabe = karte.alsMarkdown(modell);
  assert.match(ausgabe, /^# Licht \\\#/);
  assert.match(ausgabe, /\\<img src=x\\>/);
  assert.deepEqual(normal(karte.ausMarkdown(ausgabe).knoten), normal(modell.knoten.map(({ id, eltern, text }) => ({
    id, eltern, text,
  }))));
  assert.throws(() => karte.ausMarkdown('Nur Fliesstext'), /keine Markdown/);
  assert.throws(() => karte.ausMarkdown('x'.repeat(262_145)), /zu gross/);
  assert.throws(() => karte.ausMarkdown('- Thema\n'.repeat(250)), /250 Themen/);
});

test('Prüfzentrum unterscheidet gültige, verschobene und fehlende Klemmenbezüge', () => {
  const { Planpruefung: pruefung } =
    laden(['bereiche/bloecke/arten/schaltplan-pruefung.js']).window;
  const pos = (x: number) => ({ x, y: 0 });
  const plan = {
    breite: 100, hoehe: 100, texte: [],
    teile: [{ id: 't1', zeichen: 'klemme', bmk: 'X1', ...pos(10) }],
    leitungen: [
      { id: 'l1', vonTeil: 't1', vonNr: '1', punkte: [pos(10), pos(20)] },
      { id: 'l2', vonTeil: 't1', vonNr: '2', punkte: [pos(30), pos(40)] },
      { id: 'l3', nachTeil: 't1', nachNr: '1', punkte: [pos(50), pos(60)] },
      { id: 'l4', vonTeil: 'geloescht', vonNr: '1', punkte: [pos(70), pos(80)] },
      { id: 'l5', punkte: [pos(90), pos(100)] },
    ],
  };
  const hilfen = {
    anschluesseVon: () => [{ nr: '1', ...pos(10) }],
    holeSymbol: () => ({ name: 'Klemme' }),
  };
  const vorher = JSON.stringify(plan);
  const ergebnis: { punkte: Pruefpunkt[] } = pruefung.analysieren(plan, hilfen);
  assert.deepEqual(normal(ergebnis.punkte.filter(p => p.stufe === 'fehler').map(p => [p.id, p.art])), [
    ['l2', 'klemmenbezug-fehlt'], ['l3', 'klemmenbezug-versetzt'], ['l4', 'klemmenbezug-fehlt'],
  ]);
  assert.equal(ergebnis.punkte.filter(p => p.art === 'offenes-ende' && p.id === 'l5').length, 2);
  assert.equal(JSON.stringify(plan), vorher);
  const json = JSON.parse(pruefung.berichtJson(ergebnis));
  assert.equal(json.format, 'redion-schaltplan-pruefbericht');
  assert.equal(json.version, 1);
  assert.equal(json.zaehler.fehler, 3);
});

test('Lernintervalle zeigen dieselbe Planung wie die Bewertung und schreiben erst beim Bewerten', () => {
  let algorithmus = 'sm2';
  const geschrieben: unknown[] = [];
  const Store = {
    getMeta: (key: string, ersatz: unknown) => key === 'lernVerfahren' ? algorithmus : ersatz,
    uid: () => 'review-1',
    now: () => new Date().toISOString(),
    updateBlock: (_id: string, update: unknown) => geschrieben.push(update),
  };
  const { WissenDienst: lernen } = laden(['core/learning/fsrs.js', 'bereiche/wissen/dienst.js'], { Store }).window;
  const karte = { id: 'lernkarte', sr: { ease: 2.5, intervall: 6, wdh: 2 } };
  const original = JSON.stringify(karte);
  assert.deepEqual(normal(lernen.planVorschau(karte)), [0, 1, 15, 15]);
  algorithmus = 'fsrs';
  const intervall = lernen.planVorschau(karte)[2];
  assert.equal(geschrieben.length, 0);
  assert.equal(JSON.stringify(karte), original);
  assert.equal(lernen.planen(karte, 3).intervall, intervall);
  assert.equal(geschrieben.length, 1);
  assert.equal((geschrieben[0] as any).reviewVerlauf['review-1'].algorithm, 'fsrs');
});

test('Vendored PDF and ink code matches the audited licenses and hashes', () => {
  const bestand = JSON.parse(fs.readFileSync(new URL('./fremd-bestand.json', import.meta.url), 'utf8'));
  const eintraege = bestand.eintraege.filter((e: { paket: string }) => ['pdf-lib', 'perfect-freehand'].includes(e.paket));
  assert.equal(eintraege.length, 2);
  for (const e of eintraege) {
    const bytes = fs.readFileSync(new URL('../' + e.pfad, import.meta.url));
    const lizenz = fs.readFileSync(new URL('../' + e.lizenzdatei, import.meta.url));
    assert.equal(bytes.length, e.datei.bytes);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), e.datei.sha256);
    assert.equal(createHash('sha256').update(lizenz).digest('hex'), e.lizenzSha256);
    assert.match(lizenz.toString('utf8'), /MIT License/i);
    for (const notice of e.hinweise ?? []) {
      const code = fs.readFileSync(new URL('../' + notice.pfad, import.meta.url));
      assert.equal(createHash('sha256').update(code).digest('hex'), notice.sha256);
    }
  }
});

test('PDF-Seitenkopie übernimmt Seiten in Wunschreihenfolge und mit relativer Drehung', async () => {
  const vmContext = laden(['fremd/pdf-lib/library.js', 'fremd/pdf-lib/laden.js'], { Blob, ArrayBuffer, Uint8Array });
  const { PDFLib: lib, PdfOriginal: original } = vm.runInContext('({ PDFLib, PdfOriginal })', vmContext);
  const source = await lib.PDFDocument.create();
  const erste = source.addPage();
  erste.setSize(280, 160);
  erste.drawText('REDION TEST');
  const zweite = source.addPage();
  zweite.setSize(320, 180);
  zweite.setRotation(lib.degrees(270));
  const sourceBlob = new Blob([await source.save({ useObjectStreams: false })], { type: 'application/pdf' });
  const additional = await lib.PDFDocument.create();
  additional.addPage().setSize(400, 200);
  const additionalBlob = new Blob([await additional.save()], { type: 'application/pdf' });
  assert.deepEqual(normal(original.seitenleser('3–1, 2', 3)), [2, 1, 0, 1]);
  assert.throws(() => original.seitenleser('1,0', 3), /Seiten mit Kommas/);
  assert.throws(() => original.seitenleser('1-4', 3), /3 Seiten/);
  await assert.rejects(() => original.zusammenstellen([{ datei: sourceBlob, auswahl: '*' }], 45), /ungültig/);
  const blob = await original.zusammenstellen([
    { datei: sourceBlob, auswahl: '2,1' }, { datei: additionalBlob, auswahl: '*' }
  ], 90);
  assert.equal(blob.type, 'application/pdf');
  const copied = await lib.PDFDocument.load(await blob.arrayBuffer());
  assert.deepEqual(normal(copied.getPages().map((p: { getWidth(): number; getRotation(): { angle: number } }) =>
    [p.getWidth(), p.getRotation().angle])), [[320, 0], [280, 90], [400, 90]]);
  assert.equal((await lib.PDFDocument.load(await sourceBlob.arrayBuffer())).getPageCount(), 2);
});

test('Weiche Druckkonturen behalten ihre Einstellung und ältere Striche behalten die bestehende Kontur', () => {
  const context = laden(['fremd/perfect-freehand/ink.js', 'core/ink/stroke.js']);
  const ink: typeof InkStroke = vm.runInContext('InkStroke', context);
  const basis = { id: 'probe', art: 'stift', pts: [[0, 0], [5, 1], [10, 3], [20, 3]], breite: 3, farbe: '#334455', ebene: 'plan' };
  const alt = ink.readAnnotation(basis);
  const neu = ink.readAnnotation({ ...basis, kontur: 'weich', pressure: [.2, .5, .8, .9] });
  assert.ok(alt && neu);
  assert.equal(alt.kontur, undefined);
  assert.equal(neu.kontur, 'weich');
  assert.equal(ink.weichUmriss(alt).length, 0);
  const umriss = ink.weichUmriss(neu);
  assert.ok(umriss.length > 5);
  assert.ok(umriss.every(p => p.every(Number.isFinite)));
});

test('Excalidraw-Labels werden Themen und ihre gebundenen Pfeile werden Mermaid-Querverbindungen', () => {
  const { Gedankenkarte: karte } = laden(['bereiche/bloecke/arten/gedankenkarte.js']).window;
  const datei = JSON.stringify({ type: 'excalidraw', version: 2, elements: [
    { id: 't1', type: 'text', text: 'Klemme "L"', containerId: 'box1' },
    { id: 't2', type: 'text', text: '<Geprüft>', containerId: 'box2' },
    { id: 'a', type: 'arrow', startBinding: { elementId: 'box1' }, endBinding: { elementId: 'box2' } },
    { id: 'x', type: 'text', text: 'Gelöscht', isDeleted: true },
    { id: 'bild', type: 'image', status: 'saved' }
  ]});
  const importiert = karte.ausExcalidraw(datei, 'Unterverteilung');
  assert.equal(importiert.knoten.length, 3);
  assert.deepEqual(normal(importiert.verbindungen), [{ id: 'v0', von: 'x1', zu: 'x2' }]);
  const diagramm = karte.alsMermaid(importiert);
  assert.match(diagramm, /^flowchart TD\n/);
  assert.match(diagramm, /n1\["Klemme #34;L#34;"\]/);
  assert.match(diagramm, /n1 -\.-> n2/);
  assert.doesNotMatch(diagramm, /<Geprüft>|Gelöscht/);
  assert.throws(() => karte.ausExcalidraw('{"type":"excalidraw","elements":[]}', 'Leer'), /keine beschrifteten/);
});

test('Schematico übernimmt explizite IEC-Klemmen und weist geänderte Netze oder unbekannte Symbole ab', () => {
  let next = 0;
  const context = laden([
    'register/fachzeichen.js', 'bereiche/bloecke/arten/schaltplan.js',
    'bereiche/elektro/simulation.js', 'bereiche/bloecke/arten/schematico-import.js'
  ], { Register: {}, Ids: { short: () => String(++next) }, performance: { now: () => 1 } });
  const { SchematicoImport: adapter, Stromfluss: strom } = vm.runInContext('({ SchematicoImport, Stromfluss })', context);
  const probe = { type: 'ems', page: {
    title: 'Steuerstrom', pageType: 'schematic', connectionMode: 'explicit',
    components: [
      { id: 's', symbolId: 'contact_no', bmk: '-S1', x: 50, y: 50, rotation: 0 },
      { id: 'p', symbolId: 'pilot_lamp', bmk: '-P1', x: 200, y: 200, rotation: 0 }
    ],
    wires: [{ id: 'w1', from: { componentId: 's', pinId: '14' }, to: { componentId: 'p', pinId: 'X1' } }],
    texts: [{ id: 'text1', text: 'Beispiel', x: 70, y: 25 }]
  }};
  const { blaetter, logischeLeitungen } = adapter.lesen(JSON.stringify(probe));
  const plan = adapter.importieren(blaetter[0], logischeLeitungen, strom.netze);
  assert.deepEqual(normal(plan.teile.map((t: { bmk: string }) => t.bmk)), ['-S1', '-P1']);
  assert.equal(plan.teile[0].nummern['4'], '14');
  assert.equal(plan.leitungen[0].vonNr, '4');
  assert.equal(plan.leitungen[0].nachNr, 'X1');
  assert.equal(plan.texte[0].t, 'Beispiel');
  assert.throws(() => adapter.importieren(blaetter[0], [], () => ({ netzVon: new Map() })), /elektrische Verbindungen/);
  probe.page.components[0]!.symbolId = 'unbekannt';
  const andere = adapter.lesen(JSON.stringify(probe));
  assert.throws(() => adapter.importieren(andere.blaetter[0], [], strom.netze), /nicht eindeutig/);
});
