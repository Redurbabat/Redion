/* Der volle Lauf, in Stücken und wiederaufnehmbar
 * ============================================================================
 * §30 beschreibt diese Arbeitsweise seit dem 3. September 2026 — Redur hat
 * sie selbst entschieden —, und es gab sie nur als HANDGRIFF: zehn Nummern
 * abtippen, warten, die nächsten zehn abtippen, und im Kopf behalten, wo man
 * war. Beim vorletzten vollen Lauf ist genau das schiefgegangen.
 *
 *   „Ein voller Lauf dauert länger, als eine Sitzung sicher steht. Er wird
 *    deshalb in Stücken und wiederaufnehmbar gefahren: zehn Läufe je Stück,
 *    eine Merkdatei hält fest, welche Stücke fertig sind. Bricht die Sitzung
 *    ab, geht nur das laufende Stück verloren, nicht die Stunde davor."
 *
 * Das hier ist diese Merkdatei mit einem Programm darum.
 *
 * AUFRUF
 *
 *   node pruefungen/volllauf.mts            weitermachen, wo es aufhörte
 *   node pruefungen/volllauf.mts --neu      von vorne, Merkdatei verwerfen
 *   node pruefungen/volllauf.mts --stand    nur sagen, wie weit es ist
 *   node pruefungen/volllauf.mts --stueck 5 Stückgrösse ändern (Vorgabe 10)
 *   node pruefungen/volllauf.mts --rot      nur die roten Läufe wiederholen
 *
 * WO ER LÄUFT. In einem eigenen Arbeitsbaum (`git worktree`), damit im
 * Hauptbaum weitergearbeitet werden kann — und dort wird dabei KEIN Prüflauf
 * gestartet: jede Suite hält einen Port, zwei Läufe mit derselben Zahl machen
 * einander rot. Das ist am 4. und am 19. September je einmal passiert.
 *
 * UND DER ARBEITSBAUM IST NICHT DER HAUPTBAUM. Dort ist `.git` eine DATEI
 * und `node_modules` ein Symlink; `test270` filtert Ordnermuster mit
 * `istOrdner && name === …` und meldet deshalb dort etwas, das im Hauptbaum
 * richtig ist. Ein roter Lauf aus dem Arbeitsbaum wird im Hauptbaum
 * nachgemessen, BEVOR jemand ihn repariert (§30).
 * ==========================================================================*/
import { spawn } from 'node:child_process';
import { readdirSync, existsSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const PRUEF = dirname(fileURLToPath(import.meta.url));
const WURZEL = join(PRUEF, '..');
const MERK = join(PRUEF, '.volllauf-stand.json');

const args = process.argv.slice(2);
const vonVorne = args.includes('--neu');
const nurStand = args.includes('--stand');
const nurRot = args.includes('--rot');
const stueckGroesse = (() => {
  const i = args.indexOf('--stueck');
  const n = i >= 0 ? Number(args[i + 1]) : NaN;
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 10;
})();

/** Alle Nummern, gezählt statt geschätzt — dieselbe Quelle wie §30. */
const alleNummern = (): number[] =>
  readdirSync(join(PRUEF, 'lauf'))
    .filter(f => /^test\d+\.mts$/.test(f))
    .map(f => Number(f.match(/\d+/)![0]))
    .sort((a, b) => a - b);

type Stand = {
  begonnen: string;
  stueckGroesse: number;
  nummern: number[];
  fertig: number[];      /** Nummern, die grün durch sind */
  rot: number[];         /** Nummern, die rot waren */
  dauer: Record<string, number>;
};

const standLesen = (): Stand | null => {
  if (!existsSync(MERK)) return null;
  try { return JSON.parse(readFileSync(MERK, 'utf8')) as Stand; }
  catch { return null; }
};
const standSchreiben = (s: Stand): void =>
  writeFileSync(MERK, JSON.stringify(s, null, 2) + '\n');

/* ------------------------------------------------------------------------ */
const nummern = alleNummern();
let stand = vonVorne ? null : standLesen();

/* DIE LISTE DARF SICH ÄNDERN, WÄHREND DER LAUF LÄUFT. Ein neuer Prüflauf
   entsteht mitten im Sweep — dann gehört er dazu und ist noch nicht fertig.
   Einer, der verschwindet, fällt aus allen drei Listen. */
if (stand) {
  stand.nummern = nummern;
  stand.fertig = stand.fertig.filter(n => nummern.includes(n));
  stand.rot = stand.rot.filter(n => nummern.includes(n));
} else {
  stand = { begonnen: new Date().toISOString(), stueckGroesse,
            nummern, fertig: [], rot: [], dauer: {} };
}

const offen = (): number[] => nurRot
  ? stand!.rot.slice()
  : stand!.nummern.filter(n => !stand!.fertig.includes(n) && !stand!.rot.includes(n));

const bericht = (): void => {
  const o = offen();
  console.log('\n' + '─'.repeat(64));
  console.log('Voller Lauf · Stand');
  console.log('─'.repeat(64));
  console.log('  begonnen   ' + stand!.begonnen);
  console.log('  Läufe      ' + stand!.nummern.length);
  console.log('  grün       ' + stand!.fertig.length);
  console.log('  ROT        ' + stand!.rot.length +
    (stand!.rot.length ? '  → ' + stand!.rot.join(' ') : ''));
  console.log('  offen      ' + o.length);
  const gesamt = Object.values(stand!.dauer).reduce((a, b) => a + b, 0);
  if (gesamt) console.log('  gelaufen   ' + Math.round(gesamt / 60) + ' min');
};

if (nurStand) { bericht(); process.exit(0); }

if (vonVorne && existsSync(MERK)) unlinkSync(MERK);
standSchreiben(stand);

/** Ein Stück fahren: `alle.mts` mit den Nummern, Ausgabe durchreichen. */
const stueckFahren = (teil: number[]): Promise<{ code: number; text: string }> =>
  new Promise(fertig => {
    const kind = spawn('node', [join(PRUEF, 'alle.mts'), ...teil.map(String)],
      { cwd: WURZEL, stdio: ['ignore', 'pipe', 'pipe'] });
    let text = '';
    kind.stdout.on('data', d => { text += d; process.stdout.write(d); });
    kind.stderr.on('data', d => { text += d; process.stderr.write(d); });
    kind.on('close', code => fertig({ code: code ?? 1, text }));
  });

/** Welche Nummern in der Ausgabe rot waren — aus dem Text, nicht geraten. */
const roteAus = (text: string, teil: number[]): number[] => {
  const rot = new Set<number>();
  for (const zeile of text.split('\n')) {
    /* `alle.mts` schreibt je Lauf eine Zeile mit ✓ oder ✗ und dem Dateinamen. */
    if (!/✗|FEHLER|fehlgeschlagen/i.test(zeile)) continue;
    const m = zeile.match(/test(\d+)/);
    if (m && m[1]) rot.add(Number(m[1]));
  }
  /* Kein Treffer, aber der Prozess war rot? Dann ist unklar, WELCHER es war —
     also gilt das ganze Stück als rot, statt still einen davon zu erfinden. */
  return rot.size ? [...rot] : teil.slice();
};

bericht();

const zuTun = offen();
if (!zuTun.length) {
  console.log('\nNichts offen.' + (stand.rot.length
    ? ' Aber ' + stand.rot.length + ' Läufe sind ROT: ' + stand.rot.join(' ')
    : ' Der volle Lauf ist GRÜN.'));
  process.exit(stand.rot.length ? 1 : 0);
}

console.log('\n' + zuTun.length + ' Läufe offen, in Stücken zu ' + stueckGroesse + '.\n');

for (let i = 0; i < zuTun.length; i += stueckGroesse) {
  const teil = zuTun.slice(i, i + stueckGroesse);
  const nr = Math.floor(i / stueckGroesse) + 1;
  const von = Math.ceil(zuTun.length / stueckGroesse);
  console.log('\n══ Stück ' + nr + '/' + von + ' — ' + teil.join(' ') + ' ══');
  const begonnen = Date.now();
  const { code, text } = await stueckFahren(teil);
  const dauer = (Date.now() - begonnen) / 1000;

  const rot = code === 0 ? [] : roteAus(text, teil);
  for (const n of teil) {
    stand.dauer[String(n)] = dauer / teil.length;
    if (rot.includes(n)) { if (!stand.rot.includes(n)) stand.rot.push(n); }
    else if (!stand.fertig.includes(n)) stand.fertig.push(n);
    /* Ein Lauf, der jetzt grün ist, war vielleicht vorher rot. */
    if (!rot.includes(n)) stand.rot = stand.rot.filter(x => x !== n);
  }
  /* NACH JEDEM STÜCK SCHREIBEN, nicht am Ende. Sonst ist bei einem Abbruch
     genau das verloren, wogegen die Merkdatei gebaut wurde. */
  standSchreiben(stand);
  console.log('   → ' + (rot.length ? 'ROT: ' + rot.join(' ') : 'grün') +
    ' · ' + Math.round(dauer) + ' s · gemerkt');
}

bericht();
console.log('\n' + (stand.rot.length
  ? 'ROT. Diese Läufe im HAUPTBAUM nachmessen, bevor jemand sie repariert (§30):\n  ' +
    'node pruefungen/alle.mts ' + stand.rot.join(' ')
  : 'GRÜN. `main` darf vorgespult werden (§46) — im Hauptbaum.'));
process.exit(stand.rot.length ? 1 : 0);
