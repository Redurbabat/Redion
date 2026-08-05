/* Der Umweg über `createRequire` stand hier, solange der Prüfserver eine
   CommonJS-Datei war. Seit Bündel 19 ist er TypeScript und wird geladen wie
   jedes andere Modul — `WURZEL` und `require` brauchte danach niemand mehr. */
import { starte } from '../../server/pruefserver.ts';

let ok = 0, bad = 0;
const pruef = (n: any, ist: any, soll: any) => {
  const gut = JSON.stringify(ist) === JSON.stringify(soll);
  console.log((gut ? '✅ ' : '❌ ') + n + (gut ? '' : `  ist=${JSON.stringify(ist)} soll=${JSON.stringify(soll)}`));
  gut ? ok++ : bad++;
};

const s = await starte(8790);
/** Was ein Aufruf mitbringen kann: `m` die Methode, `kopf` zusätzliche
 *  Kopfzeilen, `k` der Körper (wird zu JSON gemacht). */
type RufOpt = { m?: string; kopf?: Record<string, string>; k?: unknown };

const ruf = async (weg: string, opt: RufOpt = {}) => {
  const a = await fetch(s.adresse + weg, {
    method: opt.m || 'GET',
    headers: { 'Content-Type': 'application/json', ...(opt.kopf || {}) },
    ...(opt.k ? { body: JSON.stringify(opt.k) } : {})
  });
  const text = await a.text();
  let b; try { b = JSON.parse(text); } catch { b = text; }
  return { status: a.status, body: b };
};

/* --- Lebenszeichen --- */
const stand = await ruf('/api/stand');
pruef('Lebenszeichen antwortet', stand.status, 200);
pruef('Und nennt die Ablage',    stand.body.ablage, 'speicher');

/* --- Ohne Token geht nichts --- */
const ohne = await ruf('/bereich');
pruef('Ohne Token: 401', ohne.status, 401);

/* --- Anmelden über Gerätecode --- */
const code = await ruf('/konto/code', { m: 'POST', k: { geraet: 'Prüfrechner' } });
pruef('Ein Code kommt',      code.status, 200);
pruef('Und sieht lesbar aus', /^[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(code.body.code), true);

const wartet = await ruf('/konto/code-holen', { m: 'POST', k: { code: code.body.code } });
pruef('Noch nicht freigegeben: 202', wartet.status, 202);

/* Ein Konto von Hand anlegen (im Betrieb macht das OAuth) */
await s.ablage.setze('konten', { id: 'k1', mail: 'red@beispiel.ch', name: 'Redur',
  bild: '', herkunft: 'test', angelegt: new Date().toISOString(), gesperrt: 0 });
/* Relativ wie die Zeile oben: `WURZEL` gibt es seit Bündel 19 nicht mehr. */
const { kennung, abdruck } = await import('../../server/kern.ts');
const roh = 'sit_' + kennung();
await s.ablage.setze('sitzungen', { token: await abdruck(roh), kontoId: 'k1',
  geraet: 'Erstes Gerät', angelegt: new Date().toISOString(),
  bis: new Date(Date.now() + 86400000).toISOString() });
const AUTH = { Authorization: 'Bearer ' + roh };

const frei = await ruf('/konto/code-freigeben', { m: 'POST', kopf: AUTH, k: { code: code.body.code } });
pruef('Freigeben klappt', frei.status, 200);

const geholt = await ruf('/konto/code-holen', { m: 'POST', k: { code: code.body.code } });
pruef('Jetzt kommt ein Token',   geholt.status, 200);
pruef('Es beginnt mit sit_',     String(geholt.body.token).startsWith('sit_'), true);
pruef('Und ein Bereich ist da',  geholt.body.bereiche.length >= 1, true);

const nochmal = await ruf('/konto/code-holen', { m: 'POST', k: { code: code.body.code } });
pruef('Derselbe Code geht nicht zweimal', nochmal.status, 404);

/* --- Wer bin ich --- */
const ich = await ruf('/konto/ich', { kopf: AUTH });
pruef('konto/ich antwortet', ich.status, 200);
pruef('Mit dem Namen',       ich.body.konto.name, 'Redur');

/* --- Bereich anlegen --- */
const b = await ruf('/bereich', { m: 'POST', kopf: AUTH, k: { name: 'Arbeit' } });
pruef('Bereich angelegt', b.status, 200);
const BEREICH = b.body.id;

/* --- Hochladen und herunterladen --- */
const hoch = await ruf('/sync/hoch', { m: 'POST', kopf: { ...AUTH, 'Redion-Geraet': 'PC' },
  k: { bereich: BEREICH, saetze: [
    { id: 'a1', tabelle: 'blocks', daten: JSON.stringify({ type: 'page', text: 'Erste Seite' }),
      seite: 'a1', version: 1, geaendert: new Date().toISOString() },
    { id: 'a2', tabelle: 'blocks', daten: 'VERSCHLUESSELT-XYZ', verschluesselt: true,
      seite: 'a2', version: 1, geaendert: new Date().toISOString() }
  ] } });
pruef('Zwei Sätze angenommen', hoch.body.angenommen, 2);

const runter = await ruf('/sync/runter', { m: 'POST', kopf: AUTH, k: { bereich: BEREICH } });
pruef('Beide kommen zurück',    runter.body.saetze.length, 2);
pruef('Verschlüsselt bleibt verschlüsselt',
      runter.body.saetze.find((x: any) => x.id === 'a2').verschluesselt, true);
pruef('Die Rolle steht dabei',  runter.body.rolle, 'voll');

/* Nur Neues holen */
const nurNeu = await ruf('/sync/runter', { m: 'POST', kopf: AUTH,
  k: { bereich: BEREICH, seit: runter.body.marke } });
pruef('Seit der Marke nichts Neues', nurNeu.body.saetze.length, 0);

/* Veraltetes wird abgelehnt */
const alt = await ruf('/sync/hoch', { m: 'POST', kopf: AUTH,
  k: { bereich: BEREICH, saetze: [
    { id: 'a1', tabelle: 'blocks', daten: '{"text":"Alt"}', version: 0,
      geaendert: '2020-01-01T00:00:00.000Z' } ] } });
pruef('Veralteter Satz wird abgelehnt', alt.body.abgelehnt.length, 1);
pruef('Mit Begründung',                 alt.body.abgelehnt[0].grund, 'veraltet');

console.log(`\n${ok}/${ok + bad} bestanden`);
await s.stopp();
process.exit(bad ? 1 : 0);
