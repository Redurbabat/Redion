/* ============================================================================
 * Erzeugt den quarantänisierten Rohdaten-Anhang des BABAT-RED-Lernpakets.
 *
 * Die aktiven, redaktionell geprüften Fragen stehen ausschliesslich in der
 * JSON-Datei. Dieses Skript liest die lokalen TypeScript-Quelldateien nur als
 * Syntaxbaum und übernimmt jede gefundene Originalfrage in die Quarantäne.
 * Es führt keinen Quellcode aus und macht keine Frage automatisch aktiv.
 * ========================================================================== */
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import * as ts from 'typescript';

const WURZEL = resolve(import.meta.dirname, '..');
const STANDARD_QUELLE =
  'C:\\Users\\redur\\redion-source-kit\\Redurbabat__BABAT-RED\\app\\src\\apps\\learning\\elektriker\\data';
const QUELLE = resolve(process.argv[2] || STANDARD_QUELLE);
const ZIEL = resolve(process.argv[3] ||
  join(WURZEL, 'lernpakete', 'babat-red-elektrofragen-1.0.0.json'));

type Fundstelle = { file: string; line: number };
type Rohfrage = {
  topic: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
  occurrences: Fundstelle[];
};

const eigenschaftsName = (name: ts.PropertyName): string | null => {
  if (ts.isIdentifier(name) || ts.isStringLiteralLike(name) || ts.isNumericLiteral(name))
    return name.text;
  return null;
};

const eigenschaft = (objekt: ts.ObjectLiteralExpression, name: string): ts.Expression | null => {
  const gefunden = objekt.properties.find((eintrag): eintrag is ts.PropertyAssignment =>
    ts.isPropertyAssignment(eintrag) && eigenschaftsName(eintrag.name) === name);
  return gefunden?.initializer || null;
};

const text = (ausdruck: ts.Expression | null): string | null =>
  ausdruck && ts.isStringLiteralLike(ausdruck) ? ausdruck.text : null;

const zahl = (ausdruck: ts.Expression | null): number | null => {
  if (!ausdruck || !ts.isNumericLiteral(ausdruck)) return null;
  const wert = Number(ausdruck.text);
  return Number.isInteger(wert) ? wert : null;
};

const texte = (ausdruck: ts.Expression | null): string[] | null => {
  if (!ausdruck || !ts.isArrayLiteralExpression(ausdruck)) return null;
  const werte = ausdruck.elements.map(eintrag =>
    ts.isStringLiteralLike(eintrag) ? eintrag.text : null);
  return werte.every((wert): wert is string => wert !== null) ? werte : null;
};

const thema = (frage: ts.ObjectLiteralExpression, datei: string): string => {
  let knoten: ts.Node | undefined = frage.parent;
  while (knoten) {
    if (ts.isPropertyAssignment(knoten)) {
      const name = eigenschaftsName(knoten.name);
      if (name && name !== 'uebung') return name.slice(0, 120);
    }
    if (ts.isObjectLiteralExpression(knoten)) {
      const titel = text(eigenschaft(knoten, 'titel'));
      const id = text(eigenschaft(knoten, 'id'));
      if (titel || id) return (titel || id || 'Allgemein').slice(0, 120);
    }
    knoten = knoten.parent;
  }
  return basename(datei, '.ts').slice(0, 120);
};

const normalisiere = (wert: string): string =>
  wert.normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('de-CH');

const schluessel = (frage: Omit<Rohfrage, 'occurrences'>): string =>
  JSON.stringify([normalisiere(frage.question), frage.options.map(normalisiere), frage.correct]);

const dateien = readdirSync(QUELLE)
  .filter(name => /^elektro.*\.ts$/i.test(name))
  .sort((a, b) => a.localeCompare(b, 'de'));
if (dateien.length === 0) throw new Error('Keine BABAT-RED-Elektrodateien gefunden: ' + QUELLE);

const eindeutig = new Map<string, Rohfrage>();
let rohzahl = 0;

for (const file of dateien) {
  const voll = join(QUELLE, file);
  const inhalt = readFileSync(voll, 'utf8');
  const baum = ts.createSourceFile(file, inhalt, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const besuche = (knoten: ts.Node): void => {
    if (ts.isObjectLiteralExpression(knoten)) {
      const question = text(eigenschaft(knoten, 'frage'));
      const options = texte(eigenschaft(knoten, 'antworten'));
      const correct = zahl(eigenschaft(knoten, 'richtig'));
      const explanation = text(eigenschaft(knoten, 'erkl'));
      if (question !== null && options !== null && correct !== null && explanation !== null) {
        if (options.length < 2 || correct < 0 || correct >= options.length)
          throw new Error(`${file}: ungültige Antwortposition bei „${question}“`);
        rohzahl++;
        const line = baum.getLineAndCharacterOfPosition(knoten.getStart(baum)).line + 1;
        const kern = { topic: thema(knoten, file), question, options, correct, explanation };
        const key = schluessel(kern);
        const vorhanden = eindeutig.get(key);
        if (vorhanden) vorhanden.occurrences.push({ file, line });
        else eindeutig.set(key, { ...kern, occurrences: [{ file, line }] });
      }
    }
    ts.forEachChild(knoten, besuche);
  };
  besuche(baum);
}

const quarantäne = [...eindeutig.entries()].map(([key, frage]) => {
  const hash = createHash('sha256').update(key).digest('hex').slice(0, 20);
  const erste = frage.occurrences[0]!;
  return {
    id: 'source-' + hash,
    topic: frage.topic,
    question: frage.question,
    options: frage.options,
    correct: frage.correct,
    explanation: frage.explanation,
    difficulty: 1,
    region: 'unknown',
    norm: null,
    source: {
      title: `Lokales BABAT-RED-Source-Kit: ${erste.file}:${erste.line}`,
      license: 'UNRESOLVED'
    },
    quarantine: {
      status: 'quarantined',
      reasonCodes: [
        'license-not-cleared',
        'provenance-not-verified',
        'norm-and-safety-review-missing'
      ],
      note: 'Nicht aktiv installieren: Lizenz, fachliche Provenienz und gegebenenfalls Normausgabe sind nicht geklärt.',
      occurrences: frage.occurrences
    }
  };
});

const paket = JSON.parse(readFileSync(ZIEL, 'utf8')) as Record<string, unknown>;
const manifest = paket.manifest;
if (!manifest || typeof manifest !== 'object') throw new Error('Zielartefakt hat kein Manifest.');
Object.assign(manifest, {
  sourceInventory: {
    sourceFiles: dateien,
    rawQuestionRecords: rohzahl,
    uniqueQuarantinedQuestions: quarantäne.length,
    activeCuratedQuestions: Array.isArray(paket.questions) ? paket.questions.length : 0,
    extractionMethod: 'TypeScript-AST; keine Ausführung des Source-Kit-Codes'
  }
});
paket.quarantine = quarantäne;
writeFileSync(ZIEL, JSON.stringify(paket, null, 2) + '\n', 'utf8');
console.log(`${quarantäne.length} eindeutige von ${rohzahl} Rohfragen quarantänisiert: ${ZIEL}`);
