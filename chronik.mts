/* ============================================================================
 * chronik.mts — aus EINER Quelle drei Ansichten
 * ----------------------------------------------------------------------------
 * Redur, 9. September 2026:
 *
 *   „speicher das alles im problemw.md … dann will ich, dass du eine ur.md
 *    erstellst und dort alles speicherst als ein 2. Gehirn … und es sollte
 *    auch im Redion sichtbar sein."
 *
 * DREI ORTE, EINE WAHRHEIT (§8). Die Daten stehen in `chronik/chronik.json`.
 * Dieses Skript schreibt daraus:
 *
 *     UR.md                         für einen Menschen, der liest
 *     PROBLEME.md                   für einen Menschen, der sucht
 *     src/bereiche/chronik/daten.ts für Redion selbst
 *
 * WARUM NICHT UMGEKEHRT — die Markdown-Datei als Quelle und der Rest daraus?
 * Weil ein Markdown-Leser raten muss, was eine Überschrift bedeutet. Ein
 * Zitat, eine Verbesserung und ein besserer Prompt sehen im Text gleich aus;
 * in JSON heissen sie, wie sie heissen. Die Prosa geht dabei nicht verloren —
 * sie steht in den Feldern, nur benannt.
 *
 * KEIN CODE IN UR.md. Das war Redurs ausdrückliche Grenze, und sie steht
 * hier als Regel: dieses Skript schreibt keine Quelltextzeilen in die
 * Markdown-Dateien. Was von Code erzählt wird, ist erzählt, nicht abgedruckt.
 *
 *     node chronik.mts            schreibt alle drei
 *     node chronik.mts --pruefen  sagt nur, ob sie aktuell sind (für die CI)
 * ==========================================================================*/
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = import.meta.dirname;
const QUELLE = path.join(WURZEL, 'chronik/chronik.json');
const daten = JSON.parse(fs.readFileSync(QUELLE, 'utf8'));
const nurPruefen = process.argv.includes('--pruefen');

const kopf = (datei: string, was: string): string =>
  `<!-- ERZEUGT — NICHT VON HAND ÄNDERN.\n` +
  `     Die Quelle ist chronik/chronik.json. \`node chronik.mts\` schreibt\n` +
  `     daraus diese Datei, PROBLEME.md und die Ansicht in Redion. Wer hier\n` +
  `     schreibt, verliert es beim nächsten Lauf. -->\n\n` +
  `# ${datei}\n\n${was}\n`;

const zeile = (s: unknown): string => String(s ?? '').trim();

/* ── UR.md ──────────────────────────────────────────────────────────────── */
const urText = (): string => {
  const t: string[] = [];
  t.push(kopf('UR.md — das zweite Gehirn',
    'Alles über Redur, über Redion und über die Art, wie hier gearbeitet wird.\n' +
    'Kein Quelltext. Was von Code erzählt wird, ist erzählt, nicht abgedruckt.'));

  t.push('\n## Über die Uhr\n\n' + zeile(daten.zeitangaben) + '\n');

  t.push('\n---\n\n## Teil I — Über Redur\n');
  t.push('**' + zeile(daten.ueberRedur.name) + '**\n');
  daten.ueberRedur.wer.forEach((s: string) => t.push('- ' + zeile(s)));
  t.push('\n### Wie mit ihm gearbeitet wird\n');
  daten.ueberRedur.wieMitIhmArbeiten.forEach((s: string) => t.push('- ' + zeile(s)));

  /* WEITERE ABSCHNITTE ÜBER REDUR, frei benannt. Redur am 19. September:
     „wie arbeite ich, wieso und alles wirklich alles dort strukturiert
     dokumentieren". Zwei Listen trugen das nicht mehr — aber jeder
     Abschnitt bleibt eine Liste aus Sätzen, damit die Datei nicht in
     Fliesstext zerläuft. `quelle` steht klein darunter: wo eine Zahl
     herkommt, steht neben der Zahl (§35). */
  (daten.ueberRedur.abschnitte || []).forEach((a: any) => {
    t.push('\n### ' + zeile(a.titel) + '\n');
    if (a.einleitung) t.push(zeile(a.einleitung) + '\n');
    (a.punkte || []).forEach((s: string) => t.push('- ' + zeile(s)));
    if (a.quelle) t.push('\n*Gemessen: ' + zeile(a.quelle) + '*');
  });

  t.push('\n---\n\n## Teil II — ' + zeile(daten.arbeitsweise.titel) + '\n');
  daten.arbeitsweise.grundsaetze.forEach((g: any, i: number) => {
    t.push(`\n### ${i + 1}. ${zeile(g.name)}  ·  ${zeile(g.regel)}\n`);
    t.push(zeile(g.warum));
  });
  t.push('\n### Die Reihenfolge, in der gearbeitet wird\n');
  daten.arbeitsweise.wieIchPlane.forEach((s: string) => t.push(zeile(s) + '  '));

  t.push('\n---\n\n## Teil III — Die Tage\n');
  daten.tage.forEach((tag: any) => {
    t.push(`\n### ${zeile(tag.datum)} · ${zeile(tag.wochentag)} — ${zeile(tag.titel)}\n`);
    if (tag.wasIchWeiss) t.push('> ' + zeile(tag.wasIchWeiss) + '\n');

    if (tag.nachrichten?.length) {
      t.push('\n#### Was Redur geschrieben hat\n');
      tag.nachrichten.forEach((n: any, i: number) => {
        t.push(`\n**${i + 1} · ${zeile(n.zeit)}**\n`);
        t.push('> ' + zeile(n.wortlaut).replace(/\n/g, '\n> ') + '\n');
        t.push('**Gemeint:** ' + zeile(n.gemeint) + '\n');
        t.push('**Besser geschrieben:** ' + zeile(n.besser) + '\n');
        t.push('**Besserer Prompt:** ' + zeile(n.besserePrompt) + '\n');
      });
    }

    if (tag.arbeit?.length) {
      t.push('\n#### Was gearbeitet wurde\n');
      t.push('| Arbeit | von → bis | Zeitraum | Dauer | Prüfungen |');
      t.push('|---|---|---|---|---|');
      tag.arbeit.forEach((a: any) => t.push(
        `| ${zeile(a.was)} | \`${zeile(a.vonCommit)}\` → \`${zeile(a.bisCommit)}\` | ` +
        `${zeile(a.zeitraum)} | ${zeile(a.dauer) || '—'} | ${zeile(a.pruefungen) || zeile(a.entscheidungen) || '—'} |`));
    }

    if (tag.zahlen) {
      t.push('\n#### Zahlen des Tages\n');
      Object.entries(tag.zahlen).forEach(([k, v]) => t.push(`- **${k}:** ${zeile(v)}`));
    }
    if (tag.groesstesProblem) t.push('\n#### Das grösste Problem\n\n' + zeile(tag.groesstesProblem));
    const inter = tag.interessantesteAnfrage || tag.interessantestes;
    if (inter) t.push('\n#### Das Interessanteste, das Redur wollte\n\n' + zeile(inter));

    if (tag.massnahmen?.length) {
      t.push('\n#### Massnahmen an den Daten\n');
      t.push('| Zeit | Was | Warum | Risiko |');
      t.push('|---|---|---|---|');
      tag.massnahmen.forEach((m: any) => t.push(
        `| ${zeile(m.zeit)} | ${zeile(m.was)} | ${zeile(m.warum)} | ${zeile(m.risiko)} |`));
    }
  });

  t.push('\n---\n\n## Teil IV — Wo die Probleme stehen\n');
  t.push('In `PROBLEME.md`, aus derselben Quelle erzeugt. ' +
         `Zurzeit ${daten.probleme.length} Einträge.\n`);
  return t.join('\n') + '\n';
};

/* ── PROBLEME.md ────────────────────────────────────────────────────────── */
const problemText = (): string => {
  const t: string[] = [];
  t.push(kopf('PROBLEME.md — was schiefging und wie es gelöst wurde',
    'Ein Eintrag je Problem: das Bild, die falsche Vermutung, der Fund, die\n' +
    'Lösung und der Beweis. Die falschen Vermutungen stehen mit drin — sie\n' +
    'sind der teuerste Teil und der lehrreichste.'));

  const schwer: Record<string, string> = {
    schwer: '🔴 schwer', mittel: '🟠 mittel', klein: '🟡 klein', offen: '⚪ offen'
  };
  t.push('\n## Übersicht\n');
  t.push('| Nr | Datum | Titel | Schwere | Entscheidung |');
  t.push('|---|---|---|---|---|');
  daten.probleme.forEach((p: any) => t.push(
    `| ${zeile(p.nr)} | ${zeile(p.datum)} | ${zeile(p.titel)} | ` +
    `${schwer[String(p.schwere)] || zeile(p.schwere)} | ${zeile(p.entscheidung) || '—'} |`));

  daten.probleme.forEach((p: any) => {
    t.push(`\n---\n\n## ${zeile(p.nr)} · ${zeile(p.titel)}\n`);
    t.push(`*${zeile(p.datum)} · ${schwer[String(p.schwere)] || zeile(p.schwere)}` +
           (p.entscheidung ? ` · ${zeile(p.entscheidung)}` : '') + '*\n');
    const felder: Array<[string, string]> = [
      ['Das Bild', 'symptom'], ['Die falsche Vermutung', 'falscheVermutung'],
      ['Wie es gefunden wurde', 'wieGefunden'], ['Wie gesucht wurde', 'wieGesucht'],
      ['Die Ursache', 'ursache'], ['Die Lösung', 'loesung'],
      ['Warum keine Uhr', 'warumKeineUhr'], ['Die Gegenrichtung', 'gegenrichtung'],
      ['Was es kostet', 'kosten'], ['Was offen ist', 'offen'],
      ['Was fehlt', 'wasFehlt'], ['Der Stand', 'stand'],
      ['Der Beweis', 'beweis'], ['Die Lehre', 'lehre']
    ];
    felder.forEach(([titel, feld]) => {
      if (p[feld]) t.push(`**${titel}.** ${zeile(p[feld])}\n`);
    });
  });
  return t.join('\n') + '\n';
};

/* ── Die Daten für Redion ───────────────────────────────────────────────── */
const appText = (): string =>
  '/* ============================================================================\n' +
  ' * chronik/daten.js — die Chronik, wie Redion sie liest\n' +
  ' * ----------------------------------------------------------------------------\n' +
  ' * ERZEUGT — NICHT VON HAND ÄNDERN.\n' +
  ' * Die Quelle ist `chronik/chronik.json`; `node chronik.mts` schreibt daraus\n' +
  ' * diese Datei, UR.md und PROBLEME.md. Eine Wahrheit, drei Ansichten (§8).\n' +
  ' * ==========================================================================*/\n\n' +
  'const ChronikDaten = ' + JSON.stringify(daten, null, 1) + ' as const;\n\n' +
  '(window as any).ChronikDaten = ChronikDaten;\n';

const schreiben = (datei: string, inhalt: string): boolean => {
  const p = path.join(WURZEL, datei);
  const alt = fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
  if (alt === inhalt) { console.log('  =  ' + datei + ' — unverändert'); return false; }
  if (nurPruefen) { console.log('  ✗  ' + datei + ' — NICHT aktuell'); return true; }
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, inhalt);
  console.log('  ✓  ' + datei + ' — geschrieben');
  return true;
};

console.log('Chronik aus ' + path.relative(WURZEL, QUELLE) + ':');
let anders = false;
anders = schreiben('UR.md', urText()) || anders;
anders = schreiben('PROBLEME.md', problemText()) || anders;
anders = schreiben('src/bereiche/chronik/daten.ts', appText()) || anders;
if (nurPruefen && anders) {
  console.log('\nDie erzeugten Dateien passen nicht zur Quelle. `node chronik.mts` läuft lassen.');
  process.exit(1);
}
console.log('\nTage: ' + daten.tage.length + ' · Probleme: ' + daten.probleme.length);
