/* Suite 43 — Rechte bis auf die einzelne Spalte
 * Zwei Konten, eine geteilte Datenbank, eine Gehaltsspalte. */
import { fileURLToPath as _alsPfad } from 'node:url';
import { dirname as _ordner, resolve as _loese } from 'node:path';
import { createRequire as _brauche } from 'node:module';
const WURZEL = _loese(_ordner(_alsPfad(import.meta.url)), '../..');
const require = _brauche(import.meta.url);
import { starte } from '../../server/pruefserver.js';
import { kennung, abdruck, feldRechte, feldFilter, feldSchutz } from '../../server/kern.js';

let ok = 0, bad = 0;
const pruef = (n, ist, soll) => {
  const gut = JSON.stringify(ist) === JSON.stringify(soll);
  console.log((gut ? '✅ ' : '❌ ') + n + (gut ? '' : `  ist=${JSON.stringify(ist)} soll=${JSON.stringify(soll)}`));
  gut ? ok++ : bad++;
};

const kern = await starte(8798);
const W = kern.adresse;
const ablage = kern.ablage;

/* --- Zwei Konten -------------------------------------------------------- */
const konto = async (id, mail, name) => {
  await ablage.setze('konten', { id, mail, name, bild: '', herkunft: 'test',
    angelegt: new Date().toISOString(), gesperrt: 0 });
  const roh = 'sit_' + kennung();
  await ablage.setze('sitzungen', { token: await abdruck(roh), kontoId: id,
    geraet: 'Prüfung', angelegt: new Date().toISOString(),
    bis: new Date(Date.now() + 86400000).toISOString() });
  return roh;
};
const CHEF = await konto('k1', 'chef@x.ch', 'Chefin');
const TEAM = await konto('k2', 'team@x.ch', 'Teammitglied');

const ruf = async (tok, pfad, m = 'GET', k) => {
  const a = await fetch(W + pfad, { method: m,
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tok },
    body: k ? JSON.stringify(k) : undefined });
  let j = null; try { j = await a.json(); } catch {}
  return { status: a.status, ...j };
};

const bereich = (await ruf(CHEF, '/bereich', 'POST', { name: 'Firma' })).id;
await ruf(CHEF, '/freigabe', 'POST', { bereich, seite: '*', konto: 'team@x.ch', rolle: 'edit' });

/* --- Eine Zeile mit einer Gehaltsspalte, im Klartext -------------------- */
const zeile = (props) => JSON.stringify({
  id: 'z1', type: 'page', parentTable: 'collection', parentId: 'slg1',
  text: 'Anna', props, edited: '2026-08-01T10:00:00.000Z' });

const hoch = (tok, daten, version = 1) => ruf(tok, '/sync/hoch', 'POST', {
  bereich, saetze: [{ id: 'z1', tabelle: 'blocks', seite: 'seite1',
    daten, verschluesselt: false, version, geaendert: '2026-08-01T10:0' + version + ':00.000Z' }] });

let r = await hoch(CHEF, zeile({ name: 'Anna', gehalt: 9000, ort: 'Zürich' }));
pruef('Die Chefin schreibt die Zeile', r.angenommen, 1);

console.log('\n--- Ohne Spaltenrechte sieht das Team alles ---');
r = await ruf(TEAM, '/sync/runter', 'POST', { bereich, seit: '' });
let gesehen = JSON.parse(r.saetze[0].daten);
pruef('Gehalt ist sichtbar', gesehen.props.gehalt, 9000);

console.log('\n--- Gehalt für alle sperren ---');
r = await ruf(CHEF, '/feldrecht', 'POST',
  { bereich, sammlung: 'slg1', feld: 'gehalt', konto: '*', rolle: 'kein' });
pruef('Regel gesetzt', r.ok, true);

r = await ruf(TEAM, '/sync/runter', 'POST', { bereich, seit: '' });
gesehen = JSON.parse(r.saetze[0].daten);
pruef('Das Team sieht das Gehalt nicht mehr', 'gehalt' in gesehen.props, false);
pruef('Aber alles andere schon',              gesehen.props.ort, 'Zürich');
pruef('Und es erfährt, dass etwas fehlt',     gesehen.feldrechteWeg, ['gehalt']);

r = await ruf(CHEF, '/sync/runter', 'POST', { bereich, seit: '' });
pruef('Die Chefin sieht ihr eigenes Feld weiter',
  JSON.parse(r.saetze[0].daten).props.gehalt, 9000);

console.log('\n--- Das Team versucht, das Gehalt zu ändern ---');
r = await hoch(TEAM, zeile({ name: 'Anna', gehalt: 99000, ort: 'Bern' }), 2);
pruef('Die Zeile geht durch',           r.angenommen, 1);
pruef('Aber die Spalte wird gemeldet',  r.angepasst.length, 1);
pruef('Mit Namen',                      r.angepasst[0].felder, ['gehalt']);

r = await ruf(CHEF, '/sync/runter', 'POST', { bereich, seit: '' });
const jetzt = JSON.parse(r.saetze[0].daten);
pruef('Das Gehalt steht unverändert da', jetzt.props.gehalt, 9000);
pruef('Die erlaubte Änderung kam an',    jetzt.props.ort, 'Bern');

console.log('\n--- Nur-lesen ---');
await ruf(CHEF, '/feldrecht', 'POST',
  { bereich, sammlung: 'slg1', feld: 'gehalt', konto: 'team@x.ch', rolle: 'lesen' });
r = await ruf(TEAM, '/sync/runter', 'POST', { bereich, seit: '' });
gesehen = JSON.parse(r.saetze[0].daten);
pruef('Jetzt sieht das Team das Gehalt', gesehen.props.gehalt, 9000);
pruef('Der persönliche Eintrag sticht den für alle', 'feldrechteWeg' in gesehen, false);

r = await hoch(TEAM, zeile({ name: 'Anna', gehalt: 1, ort: 'Bern' }), 3);
pruef('Ändern bleibt trotzdem verboten', r.angepasst[0].felder, ['gehalt']);

console.log('\n--- Wer darf Rechte vergeben ---');
r = await ruf(TEAM, '/feldrecht', 'POST',
  { bereich, sammlung: 'slg1', feld: 'ort', konto: '*', rolle: 'kein' });
pruef('Das Team darf keine Spaltenrechte setzen', r.status, 403);

r = await ruf(CHEF, '/feldrecht', 'POST',
  { bereich, sammlung: 'slg1', feld: 'gehalt', konto: 'chef@x.ch', rolle: 'kein' });
pruef('Der Besitzer kann sich nicht selbst aussperren', r.status, 400);

r = await ruf(CHEF, '/feldrecht', 'POST',
  { bereich, sammlung: 'slg1', feld: 'gehalt', konto: '*', rolle: 'irgendwas' });
pruef('Erfundene Stufen werden abgewiesen', r.status, 400);

console.log('\n--- Aufheben ---');
await ruf(CHEF, '/feldrecht', 'POST',
  { bereich, sammlung: 'slg1', feld: 'gehalt', konto: 'team@x.ch', entfernen: true, rolle: 'voll' });
await ruf(CHEF, '/feldrecht', 'POST',
  { bereich, sammlung: 'slg1', feld: 'gehalt', konto: '*', entfernen: true, rolle: 'voll' });
r = await hoch(TEAM, zeile({ name: 'Anna', gehalt: 12000, ort: 'Bern' }), 4);
pruef('Danach darf das Team wieder', (r.angepasst || []).length, 0);
r = await ruf(CHEF, '/sync/runter', 'POST', { bereich, seit: '' });
pruef('Und der neue Wert steht da', JSON.parse(r.saetze[0].daten).props.gehalt, 12000);

console.log('\n--- Verschlüsseltes bleibt unangetastet ---');
const geheim = { id: 'z2', tabelle: 'blocks', seite: 'seite1',
  daten: 'AAAA-verschluesselt-BBBB', verschluesselt: true, version: 1,
  geaendert: '2026-08-01T11:00:00.000Z' };
await ruf(CHEF, '/sync/hoch', 'POST', { bereich, saetze: [geheim] });
await ruf(CHEF, '/feldrecht', 'POST',
  { bereich, sammlung: 'slg1', feld: 'gehalt', konto: '*', rolle: 'kein' });
r = await ruf(TEAM, '/sync/runter', 'POST', { bereich, seit: '' });
const z2 = r.saetze.find(s => s.id === 'z2');
pruef('Das verschlüsselte Paket kommt unverändert an', z2.daten, 'AAAA-verschluesselt-BBBB');

console.log('\n--- Die Bausteine einzeln ---');
const karte = await feldRechte(ablage, bereich, 'slg1', 'k2');
pruef('Die Karte kennt die Spalte', karte.gehalt, 'kein');
const leer = await feldRechte(ablage, bereich, 'gibtsnicht', 'k2');
pruef('Ohne Regeln eine leere Karte', leer, {});

const gefiltert = await feldFilter(ablage, bereich, 'k2',
  { tabelle: 'blocks', verschluesselt: 0, daten: zeile({ gehalt: 1, ort: 'X' }) });
pruef('feldFilter nimmt das Gehalt heraus',
  'gehalt' in JSON.parse(gefiltert.daten).props, false);

const nichtZeile = await feldFilter(ablage, bereich, 'k2',
  { tabelle: 'blocks', verschluesselt: 0, daten: JSON.stringify({ id: 'x', type: 'text', text: 'nur ein Absatz' }) });
pruef('Ein normaler Absatz wird nicht angefasst',
  JSON.parse(nichtZeile.daten).text, 'nur ein Absatz');

const kaputt = await feldFilter(ablage, bereich, 'k2',
  { tabelle: 'blocks', verschluesselt: 0, daten: 'kein JSON' });
pruef('Unlesbares geht unverändert durch', kaputt.daten, 'kein JSON');

const schutz = await feldSchutz(ablage, bereich, 'k2',
  { tabelle: 'blocks', verschluesselt: 0, daten: zeile({ gehalt: 5, ort: 'Y' }) },
  { verschluesselt: 0, daten: zeile({ gehalt: 3, ort: 'X' }) });
pruef('feldSchutz dreht zurück', JSON.parse(schutz.daten).props.gehalt, 3);
pruef('Und lässt das Erlaubte stehen', JSON.parse(schutz.daten).props.ort, 'Y');

await kern.stopp();
console.log(`\n${ok}/${ok + bad} bestanden`);
process.exit(bad ? 1 : 0);
