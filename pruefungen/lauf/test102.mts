/* Suite 67 — „Diese Marke darf nur lesen" — und was sie wirklich durfte
 * ----------------------------------------------------------------------------
 * Eine **Marke** ist ein Zugangsschlüssel für ein Programm. Beim Anlegen kann
 * man ihr sagen, was sie darf: `lesen`, `schreiben`, `alles`. Die Oberfläche
 * bietet das an, die Antwort beim Anlegen nennt es, und in der Datenbank
 * steht es.
 *
 * ─── GEPRÜFT WURDE ES AN ZWEI VON NEUN WEGEN ────────────────────────────────
 *
 * `markeDarf(…)` stand in `v1Weg` und in `mcpWeg`. Die übrigen fragten nicht
 * danach:
 *
 *   /sync              der ganze Bestand — lesen und schreiben
 *   /bereich           Bereiche anlegen, umbenennen, löschen
 *   /veroeffentlichen  Seiten ins offene Netz stellen
 *   /protokoll         wer wann was getan hat
 *   /freigabe          wen man in einen Bereich lässt
 *   /feldrecht         welche Spalte wer sehen darf
 *   /marken            **neue Schlüssel ausstellen**
 *
 * Der letzte ist der schlimmste: eine Marke mit `lesen` konnte sich selbst
 * eine neue mit `alles` ausstellen. Eine Einschränkung, die man mit einem
 * Aufruf abstreifen kann, ist keine.
 *
 * Es ist dieselbe Sorte Fehler wie schon sechsmal in dieser Session — an
 * einer Stelle getan, an der benachbarten nicht. Nur trägt sie hier den
 * Namen einer Sicherheitszusage.
 *
 * ─── DIE REGEL, DIE JETZT GILT ──────────────────────────────────────────────
 *
 *   1. Ein Mensch am Gerät (Sitzung) darf, was seine Rolle hergibt. Unverändert.
 *   2. Eine Marke schreibt nur mit `schreiben` oder `alles`; lesen darf, wer
 *      irgendetwas davon hat — wer schreiben darf, muss nachsehen können.
 *   3. **Rechte und Schlüssel ändert keine Marke**, auch keine mit `alles`.
 *
 * Regel 3 sieht wie eine Unbequemlichkeit aus, solange man nicht daran denkt,
 * dass eine Marke abhandenkommen kann.
 *
 *   node pruefungen/lauf/test102.mts
 * ==========================================================================*/
import { fileURLToPath as _alsPfad } from 'node:url';
import { dirname as _ordner, resolve as _loese, join as _dazu } from 'node:path';
import { readFileSync as _lies } from 'node:fs';

const WURZEL = _loese(_ordner(_alsPfad(import.meta.url)), '../..');

let ok = 0, weg = 0;
const p = (n: any, b: any, extra = '') => { if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); } };
const gleich = (n: any, ist: any, soll: any) =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll),
    `ist=${JSON.stringify(ist)} soll=${JSON.stringify(soll)}`);

let M = null, ladefehler = null;
try { M = await import('../../server/sicherheit/marken.ts'); }
catch (e: unknown) { ladefehler = (e instanceof Error ? e.message : String(e)); }
p('Es gibt eine Stelle für die Markenrechte', !!M,
  ladefehler ? ladefehler.split('\n')[0] ?? '' : '');

/* ========================================================================= *
 * 1 · DIE REGEL FÜR SICH
 * ========================================================================= */
if (M) {
  console.log('\n1 · Die Regel');

  const marke = (rechte: any) => ({ konto: { id: 'k1' }, marke: { rechte } });
  const mensch = { konto: { id: 'k1' }, sitzung: { token: 'x' } };

  gleich('Ein Mensch darf schreiben', M.darfMarke(mensch, 'schreiben'), true);
  gleich('Eine Lesemarke darf lesen', M.darfMarke(marke('lesen'), 'lesen'), true);
  gleich('… und nicht schreiben', M.darfMarke(marke('lesen'), 'schreiben'), false);
  gleich('Eine Schreibmarke darf schreiben',
    M.darfMarke(marke('schreiben'), 'schreiben'), true);
  /* Wer schreiben darf, muss nachsehen können, was er geschrieben hat. */
  gleich('… und auch lesen', M.darfMarke(marke('schreiben'), 'lesen'), true);
  gleich('`alles` darf beides', M.darfMarke(marke('alles'), 'schreiben'), true);
  gleich('Eine Marke ohne Rechte darf nichts',
    M.darfMarke(marke(''), 'lesen'), false);
  gleich('Ein erfundenes Recht zählt nicht',
    M.darfMarke(marke('superuser'), 'schreiben'), false);

  console.log('\n2 · Das Tor');
  gleich('Ein Mensch kommt überall durch',
    M.torPruefen(mensch, 'marken', 'POST'), null);
  gleich('Eine Lesemarke darf lesend durch',
    M.torPruefen(marke('lesen'), 'bereich', 'GET'), null);
  p('… aber nicht schreibend',
    (M.torPruefen(marke('lesen'), 'bereich', 'POST') || {}).status === 403);
  p('Auch nicht mit PATCH oder DELETE',
    (M.torPruefen(marke('lesen'), 'bereich', 'PATCH') || {}).status === 403 &&
    (M.torPruefen(marke('lesen'), 'bereich', 'DELETE') || {}).status === 403);

  /* Der Kern der Sache. */
  p('KEINE Marke stellt neue Marken aus — auch nicht mit `alles`',
    (M.torPruefen(marke('alles'), 'marken', 'POST') || {}).status === 403,
    'ein Schlüssel, der neue Schlüssel ausstellt, ist keine Einschränkung mehr');
  p('… und keine vergibt Freigaben',
    (M.torPruefen(marke('alles'), 'freigabe', 'POST') || {}).status === 403);
  p('… und keine ändert Spaltenrechte',
    (M.torPruefen(marke('alles'), 'feldrecht', 'POST') || {}).status === 403);
  p('Auch LESEN ist dort zu — die Liste der Schlüssel geht sie nichts an',
    (M.torPruefen(marke('alles'), 'marken', 'GET') || {}).status === 403);

  /* NICHT JEDER POST IST EIN SCHREIBEN. `POST /v1/search` sucht, und
     `POST /v1/databases/:id/query` fragt ab — der Filter gehört in den
     Körper, nicht in die Adresse. Der erste Wurf des Tores hat die Methode
     für die Antwort gehalten und `test75` umgeworfen. Dort entscheidet die
     Route selbst, mit derselben Funktion. */
  gleich('Ein lesender POST auf /v1 wird nicht vom Tor abgefangen',
    M.torPruefen(marke('lesen'), 'v1', 'POST'), null);
  gleich('Auch das MCP entscheidet selbst',
    M.torPruefen(marke('lesen'), 'mcp', 'POST'), null);
  /* Regel 3 gilt trotzdem: auch von dort führt kein Weg zu neuen Schlüsseln. */
  p('Regel 3 gilt auch dort — aber /marken bleibt zu',
    (M.torPruefen(marke('alles'), 'marken', 'POST') || {}).status === 403);

  /* Die Meldung muss sagen, was zu tun ist. Ein 403 ohne Weg ist eine Wand. */
  const satz = (M.torPruefen(marke('lesen'), 'bereich', 'POST') || {}).satz || '';
  p('Die Absage nennt die Rechte der Marke', /lesen/.test(satz), satz);
  p('… und sagt, was jetzt zu tun ist', /neue Marke|Redion/.test(satz), satz);
}

/* ========================================================================= *
 * 3 · AM ECHTEN SERVER, MIT EINER ECHTEN MARKE
 * ---------------------------------------------------------------------------
 * Die Regel kann stimmen und trotzdem nie gerufen werden. Genau das war hier
 * der Fall: `markeDarf` gab es, an zwei von neun Wegen.
 * ========================================================================= */
console.log('\n3 · Am echten Server');

const { starte } = await import('../../server/pruefserver.ts');
const srv = await starte(8817, { umwelt: { ADRESSE: 'http://localhost:8817' } });

/** Was ein Aufruf mitbringen kann. */
type RufOpt = { methode?: string; token?: string; koerper?: unknown };

const ruf = async (pfad: string, opt: RufOpt = {}) => {
  const a = await fetch(srv.adresse + pfad, {
    method: opt.methode || 'GET',
    headers: Object.assign({ 'Content-Type': 'application/json' },
      opt.token ? { Authorization: 'Bearer ' + opt.token } : {}),
    ...(opt.koerper ? { body: JSON.stringify(opt.koerper) } : {})
  });
  const text = await a.text();
  let j = null; try { j = JSON.parse(text); } catch {}
  return { status: a.status, j, text };
};

/* Ein Konto und eine Sitzung. Der Weg über einen fremden Anbieter geht in
   einem Prüflauf nicht; die Ablage liegt aber offen, und ein Satz darin ist
   dasselbe, was die Anmeldung auch geschrieben hätte. Geprüft wird das TOR,
   nicht die Anmeldung — die hat ihre eigenen Läufe. */
const { abdruck, jetzt } = await import('../../server/kern.ts');
const sitzung = 'sit_pruef_' + Math.abs(Date.now() % 1e9).toString(36);
await srv.ablage.setze('konten', { id: 'k-pruef', name: 'Prüfmensch',
  mail: 'pruef@example.invalid', herkunft: 'pruef', angelegt: jetzt() });
await srv.ablage.setze('sitzungen', { token: await abdruck(sitzung), kontoId: 'k-pruef',
  geraet: 'Prüflauf', angelegt: jetzt(), bis: '' });

const gehtDurch = await ruf('/bereich', { token: sitzung });
p('Die Sitzung im Prüflauf ist echt', gehtDurch.status === 200,
  `Status ${gehtDurch.status} — ohne sie prüft der Rest nichts`);

const fremd = await ruf('/bereich', { token: 'red_ausgedacht' });
gleich('Eine erfundene Marke wird abgewiesen', fremd.status, 401);

{
  const marke = async (rechte: any) => {
    const r = await ruf('/marken', { methode: 'POST', token: sitzung,
      koerper: { name: 'Prüfmarke ' + rechte, rechte } });
    return r.j && r.j.token;
  };

  const nurLesen = await marke('lesen');
  p('Eine Lesemarke lässt sich anlegen', !!nurLesen);

  const lesen = await ruf('/bereich', { token: nurLesen });
  p('Sie darf lesen', lesen.status === 200, `Status ${lesen.status}`);

  const schreiben = await ruf('/bereich', { methode: 'POST', token: nurLesen,
    koerper: { name: 'Heimlich' } });
  p('Sie darf NICHT schreiben', schreiben.status === 403,
    `Status ${schreiben.status} — vorher legte sie den Bereich einfach an`);

  const neueMarke = await ruf('/marken', { methode: 'POST', token: nurLesen,
    koerper: { name: 'Von der Lesemarke', rechte: 'alles' } });
  p('Und sie stellt sich keine neue Marke aus', neueMarke.status === 403,
    `Status ${neueMarke.status} — das war der Weg aus jeder Einschränkung heraus`);

  /* Die Gegenrichtung: eine Schreibmarke muss weiterhin arbeiten können. Eine
     Sperre, die den Richtigen trifft, wird ausgebaut statt benutzt. */
  const darfSchreiben = await marke('schreiben');
  const angelegt = await ruf('/bereich', { methode: 'POST', token: darfSchreiben,
    koerper: { name: 'Vom Programm angelegt' } });
  p('Eine Schreibmarke legt weiterhin an', angelegt.status === 200,
    `Status ${angelegt.status}`);
  const auchLesen = await ruf('/bereich', { token: darfSchreiben });
  p('… und darf auch lesen', auchLesen.status === 200, `Status ${auchLesen.status}`);

  /* Und ein erfundenes Recht darf beim Anlegen gar nicht erst hineinkommen. */
  const erfunden = await ruf('/marken', { methode: 'POST', token: sitzung,
    koerper: { name: 'Ausgedacht', rechte: 'superuser' } });
  p('Ein erfundenes Recht wird beim Anlegen auf `lesen` zurückgestuft',
    erfunden.j && JSON.stringify(erfunden.j.rechte) === JSON.stringify(['lesen']),
    JSON.stringify(erfunden.j && erfunden.j.rechte));

  /* Und der Mensch selbst darf weiterhin alles. */
  const menschDarf = await ruf('/bereich', { methode: 'POST', token: sitzung,
    koerper: { name: 'Von Hand' } });
  p('Ein Mensch am Gerät ist von alldem nicht betroffen', menschDarf.status === 200,
    `Status ${menschDarf.status}`);
}

await srv.stopp();

/* ========================================================================= *
 * 4 · DER QUELLTEXT-BELEG
 * ========================================================================= */
console.log('\n4 · Eine Prüfung, nicht zwei');

const ohneKommentar = (s: any) => s
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');
const kern = ohneKommentar(_lies(_dazu(WURZEL, 'server/kern.ts'), 'utf8'));

p('Das Tor steht vor allen Wegen', /torPruefen\(wer, t\[0\], m\)/.test(kern));
p('… und zwar nach dem Token und vor der ersten Route',
  kern.indexOf('torPruefen') < kern.indexOf("t[0] === 'sync'"),
  'sonst prüft es die Wege, die es schon durchgelassen hat');
p('Die alte Kopie in v1Weg rechnet nicht mehr selbst',
  !/markenRechte/.test(kern),
  'zwei Fassungen derselben Prüfung laufen auseinander, und die falsche merkt niemand');
p('Beide Stellen rufen dieselbe Regel',
  (kern.match(/darfMarke\(wer, was\)/g) || []).length >= 2);
p('Die Rechte werden beim Anlegen gegen die Liste geprüft',
  /ausListe\([\s\S]{0,40}MARKEN_RECHTE/.test(kern));

console.log(`\n  Suite 67 — Was eine Marke darf: ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
