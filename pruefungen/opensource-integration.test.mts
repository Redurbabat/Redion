
import assert from 'node:assert/strict';
import fs from 'node:fs';
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
