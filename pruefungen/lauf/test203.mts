/* Suite 203 — BABAT-RED als ehrliches, importierbares Lernpaket
 * ----------------------------------------------------------------------------
 * Prüft das eigenständige JSON-Artefakt, den konservativen Importvertrag,
 * Deduplizierung und die niemals aktiv installierte Rohdaten-Quarantäne.
 *
 *   node pruefungen/lauf/test203.mts
 * ==========================================================================*/
import { readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const WURZEL = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const ARTEFAKT = join(WURZEL, 'lernpakete', 'babat-red-elektrofragen-1.0.0.json');

let ok = 0, weg = 0;
const pruefe = (name: string, bedingung: boolean, extra = ''): void => {
  if (bedingung) { ok++; console.log('  ✓ ' + name); }
  else { weg++; console.log('  ✗ ' + name + (extra ? ' — ' + extra : '')); }
};
const gleich = (name: string, ist: unknown, soll: unknown): void =>
  pruefe(name, JSON.stringify(ist) === JSON.stringify(soll),
    'ist=' + JSON.stringify(ist) + ' soll=' + JSON.stringify(soll));

console.log('\n1 · Eigenständiges Artefakt und Manifest');

const rawText = readFileSync(ARTEFAKT, 'utf8');
const raw = JSON.parse(rawText) as any;
pruefe('Das Paket ist eine eigenständige JSON-Datei unter 2 MB',
  statSync(ARTEFAKT).size > 1000 && statSync(ARTEFAKT).size < 2 * 1024 * 1024);
gleich('Schema, Paket-ID und semantische Version sind fest',
  [raw.schema, raw.manifest.id, raw.manifest.version],
  ['redion.learning-package/v1', 'babat-red.electrical.questions', '1.0.0']);
gleich('Ungeklärte Lizenz und Provenienz werden ausdrücklich deklariert',
  [raw.manifest.license, raw.manifest.licenseStatus, raw.manifest.provenanceStatus],
  ['UNRESOLVED', 'not-cleared', 'not-cleared']);
pruefe('Keine Region oder Norm wird als verifiziert behauptet',
  raw.manifest.region === null &&
  /Selbstangabe|nicht als verifizierte/.test(raw.manifest.normPolicy.region));
gleich('Alle sieben Source-Kit-Dateien und alle extrahierten Rohfragen sind inventarisiert',
  [raw.manifest.sourceInventory.sourceFiles.length,
    raw.manifest.sourceInventory.rawQuestionRecords,
    raw.manifest.sourceInventory.uniqueQuarantinedQuestions],
  [7, 378, 378]);

console.log('\n2 · Kuratierte Aktivmenge und Quarantäne');

pruefe('Die aktive Menge enthält nur ausdrücklich normfrei kuratierte Fragen',
  raw.questions.length >= 10 && raw.questions.every((question: any) =>
    question.review?.status === 'curated-norm-free' &&
    question.norm === null && question.region === 'all' &&
    !question.id.startsWith('source-')));
pruefe('Jede extrahierte Originalfrage ist gesperrt und hat Sperrgründe',
  raw.quarantine.length === 378 && raw.quarantine.every((question: any) =>
    question.id.startsWith('source-') &&
    question.quarantine?.status === 'quarantined' &&
    question.quarantine.reasonCodes.includes('license-not-cleared') &&
    question.quarantine.reasonCodes.includes('provenance-not-verified') &&
    question.quarantine.reasonCodes.includes('norm-and-safety-review-missing') &&
    question.region === 'unknown' && question.norm === null));
pruefe('Rohfragen behalten Datei und Zeile als nachvollziehbare Fundstelle',
  raw.quarantine.every((question: any) =>
    Array.isArray(question.quarantine.occurrences) &&
    question.quarantine.occurrences.length > 0 &&
    question.quarantine.occurrences.every((occurrence: any) =>
      /^elektro.*\.ts$/i.test(occurrence.file) && occurrence.line > 0)));

console.log('\n3 · Validierung, Installation und Deduplizierung');

const bloecke: Record<string, any> = {};
let folge = 0;
(globalThis as any).window = globalThis;
(globalThis as any).Store = {
  cache: { blocks: bloecke },
  childrenOf(parentId: string) {
    return Object.values(bloecke).filter((block: any) =>
      block.alive !== false && block.parentId === parentId);
  },
  addPage(parentId: string | null, props: Record<string, unknown>) {
    const block = { id: 'page-' + (++folge), type: 'page', parentId, alive: true, ...props };
    bloecke[block.id] = block;
    return block;
  },
  addBlock(parentId: string, type: string, props: Record<string, unknown>) {
    const block = { id: 'block-' + (++folge), type, parentId, alive: true, ...props };
    bloecke[block.id] = block;
    return block;
  },
  now: () => '2026-08-24T00:00:00.000Z'
};
(globalThis as any).App = { zeichneBaum() {}, oeffne() {}, aktuelleSeite: () => null };
(globalThis as any).UI = { toast() {}, banner() {} };

new Function(readFileSync(join(WURZEL, 'quell/bereiche/wissen/electrical.js'), 'utf8'))();
const Electrical = (globalThis as any).Electrical;
pruefe('Die öffentliche Paketvalidierung ist verfügbar',
  typeof Electrical?.validatePackage === 'function');

const validated = Electrical.validatePackage(raw);
gleich('Der Validator erhält Aktiv- und Quarantänemenge getrennt',
  [validated.questions.length, validated.quarantine.length],
  [raw.questions.length, raw.quarantine.length]);

let ungeprueft = '';
try {
  Electrical.validatePackage({
    schema: raw.schema,
    manifest: raw.manifest,
    questions: [{
      id: 'unsafe-source-question', topic: 'Sicherheit', question: 'Ungeprüfte Behauptung?',
      options: ['Ja', 'Nein'], correct: 0, explanation: '', difficulty: 1,
      region: 'CH', norm: 'NIN ohne Ausgabe',
      source: { title: 'Ungeklärtes Source-Kit' }
    }],
    quarantine: []
  });
} catch (error) { ungeprueft = error instanceof Error ? error.message : String(error); }
pruefe('Ungeklärte normative oder regionale Aktivfragen werden abgelehnt',
  /belegte Ausgabe|normfrei kuratiert|quarantänisiert/.test(ungeprueft), ungeprueft);

let verschoben = '';
try {
  Electrical.validatePackage({ ...raw, questions: [raw.quarantine[0]], quarantine: [] });
} catch (error) { verschoben = error instanceof Error ? error.message : String(error); }
pruefe('Ein Quarantäne-Eintrag kann nicht durch Verschieben aktiv werden',
  /darf nicht aktiv/.test(verschoben), verschoben);

let ohneGrund = '';
try {
  const falsch = structuredClone(raw);
  falsch.quarantine = [{ ...falsch.quarantine[0],
    quarantine: { status: 'quarantined', reasonCodes: [] } }];
  Electrical.validatePackage(falsch);
} catch (error) { ohneGrund = error instanceof Error ? error.message : String(error); }
pruefe('Quarantäne ohne Sperrgrund ist ungültig',
  /keinen Sperrgrund/.test(ohneGrund), ohneGrund);

const erste = Electrical.installPackage(raw);
const zweite = Electrical.installPackage(raw);
const karten = Object.values(bloecke).filter((block: any) =>
  block.learningPackage?.packageId === raw.manifest.id);
gleich('Der bestehende Installer installiert einmal und dedupliziert stabil',
  [erste.added, erste.skipped, erste.quarantined,
    zweite.added, zweite.skipped, zweite.quarantined, karten.length],
  [raw.questions.length, 0, raw.quarantine.length,
    0, raw.questions.length, raw.quarantine.length, raw.questions.length]);
pruefe('Keine quarantänisierte Source-Kit-Frage wurde als Karte angelegt',
  karten.every((card: any) =>
    !card.learningPackage.itemId.startsWith('source-') &&
    card.learningPackage.licenseStatus === 'not-cleared' &&
    card.learningPackage.provenanceStatus === 'not-cleared'));

console.log('\n4 · Offline-Auslieferung und Einzeldatei');

const index = readFileSync(join(WURZEL, 'index.html'), 'utf8');
const sw = readFileSync(join(WURZEL, 'src', 'dienst', 'sw.ts'), 'utf8');
const bauen = readFileSync(join(WURZEL, 'bauen.mts'), 'utf8');
const ui = readFileSync(join(WURZEL, 'src', 'bereiche', 'wissen', 'electrical.ts'), 'utf8');
const einzeldatei = readFileSync(join(WURZEL, 'redion-einzeldatei.html'), 'utf8');
pruefe('Index verweist auf das JSON-Artefakt und der Service Worker legt es offline ab',
  index.includes('data-src="lernpakete/babat-red-elektrofragen-1.0.0.json"') &&
  sw.includes("'./lernpakete/babat-red-elektrofragen-1.0.0.json'"));
pruefe('Die UI kann Datei wählen sowie das BABAT-Paket installieren oder exportieren',
  ui.includes("button('import','Lernpaket importieren')") &&
  ui.includes("button('babat-install','BABAT-Paket installieren')") &&
  ui.includes("button('babat-export','BABAT-Paket exportieren')"));
pruefe('Der Einzeldatei-Bau bettet dasselbe JSON ohne eine TS-Datenkopie ein',
  bauen.includes('redion-learning-package-babat') &&
  bauen.includes("JSON.stringify(paket).replace(/</g, '\\\\u003c')"));
const eingebettet = /<script type="application\/json" id="redion-learning-package-babat"[^>]*>\s*([\s\S]*?)\s*<\/script>/
  .exec(einzeldatei)?.[1] || '';
let eingebettetesPaket: any = null;
try { eingebettetesPaket = JSON.parse(eingebettet); } catch {}
pruefe('Die gebaute Einzeldatei enthält das vollständige, parsebare Paket offline',
  eingebettetesPaket?.manifest?.id === raw.manifest.id &&
  eingebettetesPaket?.questions?.length === raw.questions.length &&
  eingebettetesPaket?.quarantine?.length === raw.quarantine.length);

console.log('\n' + ok + '/' + (ok + weg) + ' Prüfungen bestanden');
if (weg) process.exitCode = 1;
