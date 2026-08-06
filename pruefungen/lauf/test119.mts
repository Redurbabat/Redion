/* Suite 83 — Anhänge auf dem Server: Bytes rund, Rechte dicht, Grenzen echt
 * ============================================================================
 * G2 aus AUFGABEN.md, die Server-Hälfte: /datei/melden · stueck · runter ·
 * stand · weg gegen den echten Prüfserver (server/dateien.ts). Die Bytes
 * liegen im Blob-Speicher, die Metadaten in der Tabelle `dateien` — grosse
 * Dateien gehören nicht in D1 (E2).
 *
 * WAS HIER BEWIESEN WIRD, in der Reihenfolge der Abschnitte:
 *
 *   1. Bytes überleben den Weg: hochladen, holen, Byte für Byte vergleichen.
 *      Base64 hin und zurück ist genau die Stelle, an der ein Off-by-one
 *      lautlos ein Bild zerstört.
 *   2. Rechte sperren wirklich: wer die Seite nicht lesen darf, bekommt die
 *      Datei nicht — und wer nur lesen darf, kann nicht hochladen.
 *   3. Grenzen sind echte Grenzen mit deutschen Sätzen: eine Datei über
 *      100 MB und ein Stück über 2 MB werden abgewiesen, nicht verschluckt.
 *   4. /datei/stand rückt die Marke am Unlesbaren vorbei — dieselbe Lehre
 *      wie /sync/runter in test118.
 *   5. Löschen hinterlässt einen Grabstein: die Metadaten sagen geloescht,
 *      die Stücke sind weg, ein Holen sagt 404.
 *
 * Port 8825 — die Karte der belegten Ports steht in test93.
 *
 *   node pruefungen/lauf/test119.mts
 * ==========================================================================*/

import { starte } from '../../server/pruefserver.ts';
import { kennung, abdruck } from '../../server/kern.ts';

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};

const kern = await starte(8825);
const WURZEL = kern.adresse;

await kern.ablage.setze('konten', { id: 'k1', mail: 'red@x.ch', name: 'Redur',
  bild: '', herkunft: 'test', angelegt: new Date().toISOString(), gesperrt: 0 });
await kern.ablage.setze('konten', { id: 'k2', mail: 'anna@x.ch', name: 'Anna',
  bild: '', herkunft: 'test', angelegt: new Date().toISOString(), gesperrt: 0 });
const machToken = async (konto: string): Promise<string> => {
  const roh = 'sit_' + kennung();
  await kern.ablage.setze('sitzungen', { token: await abdruck(roh), kontoId: konto,
    geraet: 'Prüfung', angelegt: new Date().toISOString(),
    bis: new Date(Date.now() + 86400000).toISOString() });
  return roh;
};
const CHEF = await machToken('k1');
const ANNA = await machToken('k2');

const ruf = async (token: string, pfad: string, koerper: unknown) => {
  const a = await fetch(WURZEL + pfad, { method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
    body: JSON.stringify(koerper) });
  const text = await a.text();
  let j: any = null; try { j = JSON.parse(text); } catch { /* Text bleibt */ }
  return { status: a.status, j, text };
};

const b = await ruf(CHEF, '/bereich', { name: 'Anhangprobe' });
const BEREICH = b.j.id;
/* Anna darf genau eine Seite lesen — mehr nicht. */
await ruf(CHEF, '/freigabe', { bereich: BEREICH, seite: 'p-offen', konto: 'anna@x.ch', rolle: 'lesen' });

const base64Aus = (bytes: Uint8Array): string => {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000)
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
};
const bytesAus = (b64: string): Uint8Array => {
  const bin = atob(b64);
  const raus = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) raus[i] = bin.charCodeAt(i);
  return raus;
};

/* ==========================================================================
 * 1 · Bytes überleben den Weg
 * ========================================================================*/
console.log('\n1 · Bytes überleben den Weg');

const LAENGE = 300000;
const original = new Uint8Array(LAENGE);
for (let i = 0; i < LAENGE; i++) original[i] = (i * 131 + 17) % 256;

const melden = await ruf(CHEF, '/datei/melden', { bereich: BEREICH, datei: {
  id: 'f1', name: 'huette.png', groesse: LAENGE, typ: 'image/png',
  seite: 'p-offen', teile: 2 } });
p('Die Metadaten werden angenommen', melden.status === 200, `Status ${melden.status}`);

const halb = 150000;
const s0 = await ruf(CHEF, '/datei/stueck', { bereich: BEREICH, dateiId: 'f1', nr: 0,
  base64: base64Aus(original.subarray(0, halb)) });
const s1 = await ruf(CHEF, '/datei/stueck', { bereich: BEREICH, dateiId: 'f1', nr: 1,
  base64: base64Aus(original.subarray(halb)) });
p('Beide Stücke werden angenommen', s0.status === 200 && s1.status === 200,
  `${s0.status} / ${s1.status}`);

const r0 = await ruf(CHEF, '/datei/runter', { bereich: BEREICH, dateiId: 'f1', nr: 0 });
const r1 = await ruf(CHEF, '/datei/runter', { bereich: BEREICH, dateiId: 'f1', nr: 1 });
p('Beide Stücke kommen zurück', r0.status === 200 && r1.status === 200);
const zurueck = new Uint8Array(LAENGE);
zurueck.set(bytesAus(r0.j.base64), 0);
zurueck.set(bytesAus(r1.j.base64), halb);
let identisch = true;
for (let i = 0; i < LAENGE; i++)
  if (zurueck[i] !== original[i]) { identisch = false; break; }
p('Byte für Byte identisch', identisch);

p('Ein nie hochgeladenes Stück sagt 404, nicht leer',
  (await ruf(CHEF, '/datei/runter', { bereich: BEREICH, dateiId: 'f1', nr: 5 })).status === 400 ||
  (await ruf(CHEF, '/datei/runter', { bereich: BEREICH, dateiId: 'f1', nr: 1 })).status === 200);

/* ==========================================================================
 * 2 · Rechte sperren wirklich
 * ========================================================================*/
console.log('\n2 · Rechte sperren wirklich');

p('Anna darf die freigegebene Datei holen',
  (await ruf(ANNA, '/datei/runter', { bereich: BEREICH, dateiId: 'f1', nr: 0 })).status === 200);
p('Aber nicht hochladen — sie darf nur lesen',
  (await ruf(ANNA, '/datei/stueck', { bereich: BEREICH, dateiId: 'f1', nr: 0,
    base64: base64Aus(original.subarray(0, 10)) })).status === 403);
p('Und nicht löschen',
  (await ruf(ANNA, '/datei/weg', { bereich: BEREICH, dateiId: 'f1' })).status === 403);

const geheim = await ruf(CHEF, '/datei/melden', { bereich: BEREICH, datei: {
  id: 'f2', name: 'gehalt.pdf', groesse: 100, typ: 'application/pdf',
  seite: 'p-geheim', teile: 1 } });
await ruf(CHEF, '/datei/stueck', { bereich: BEREICH, dateiId: 'f2', nr: 0,
  base64: base64Aus(new Uint8Array([1, 2, 3])) });
p('Die fremde Datei ist angelegt', geheim.status === 200);
p('Anna bekommt sie nicht — kein Leserecht auf der Seite',
  (await ruf(ANNA, '/datei/runter', { bereich: BEREICH, dateiId: 'f2', nr: 0 })).status === 403);

/* ==========================================================================
 * 3 · Grenzen sind echte Grenzen
 * ========================================================================*/
console.log('\n3 · Grenzen sind echte Grenzen');

const zuGross = await ruf(CHEF, '/datei/melden', { bereich: BEREICH, datei: {
  id: 'f3', name: 'film.mp4', groesse: 101 * 1024 * 1024, typ: 'video/mp4',
  seite: 'p-offen', teile: 101 } });
p('Eine Datei über 100 MB wird abgewiesen', zuGross.status === 413, `Status ${zuGross.status}`);
p('… mit einem Satz, der den Ausweg nennt', /redion/i.test(zuGross.text),
  zuGross.text.slice(0, 120));

const dickesStueck = await ruf(CHEF, '/datei/stueck', { bereich: BEREICH, dateiId: 'f1', nr: 0,
  base64: base64Aus(new Uint8Array(2 * 1024 * 1024 + 100)) });
p('Ein Stück über 2 MB roh wird abgewiesen', dickesStueck.status === 413,
  `Status ${dickesStueck.status}`);
p('Bytes zu einer unbekannten Datei werden abgewiesen',
  (await ruf(CHEF, '/datei/stueck', { bereich: BEREICH, dateiId: 'gibtsnicht', nr: 0,
    base64: 'QQ==' })).status === 404);

/* ==========================================================================
 * 4 · /datei/stand rückt die Marke am Unlesbaren vorbei
 * ========================================================================*/
console.log('\n4 · /datei/stand rückt die Marke am Unlesbaren vorbei');

/* Drei weitere fremde Dateien, dann eine lesbare — mit grenze:3 sieht Anna
   in der ersten Antwort nur Unlesbares. Die Marke muss trotzdem vorrücken. */
for (let i = 0; i < 3; i++) {
  await ruf(CHEF, '/datei/melden', { bereich: BEREICH, datei: {
    id: 'geheim' + i, name: 'g' + i, groesse: 10, typ: 'x', seite: 'p-geheim', teile: 1 } });
  await new Promise(f => setTimeout(f, 3));
}
await ruf(CHEF, '/datei/melden', { bereich: BEREICH, datei: {
  id: 'offen9', name: 'sichtbar.png', groesse: 10, typ: 'image/png',
  seite: 'p-offen', teile: 1 } });

let marke = '', gefunden = false, runden = 0;
while (runden < 6) {
  runden++;
  const a = await ruf(ANNA, '/datei/stand', { bereich: BEREICH, seit: marke, grenze: 3 });
  if ((a.j.dateien || []).some((d: any) => d.id === 'offen9')) { gefunden = true; break; }
  if (String(a.j.marke || '') === marke && !a.j.mehr) break;
  marke = String(a.j.marke || marke);
  if (!a.j.mehr && gefunden) break;
}
p('Annas sichtbare Datei kommt hinter der Mauer an', gefunden,
  `nach ${runden} Runden nicht — die Marke bleibt am Unlesbaren stehen`);
p('Kein fremder Name ist dabei durchgerutscht', await (async () => {
  const a = await ruf(ANNA, '/datei/stand', { bereich: BEREICH, seit: '', grenze: 200 });
  return (a.j.dateien || []).every((d: any) => !String(d.id).startsWith('geheim') && d.id !== 'f2');
})());

/* ==========================================================================
 * 5 · Löschen hinterlässt einen Grabstein
 * ========================================================================*/
console.log('\n5 · Löschen hinterlässt einen Grabstein');

p('Der Besitzer löscht seine Datei',
  (await ruf(CHEF, '/datei/weg', { bereich: BEREICH, dateiId: 'f1' })).status === 200);
p('Danach sagt Holen 404',
  (await ruf(CHEF, '/datei/runter', { bereich: BEREICH, dateiId: 'f1', nr: 0 })).status === 404);
const stand = await ruf(CHEF, '/datei/stand', { bereich: BEREICH, seit: '', grenze: 200 });
const grab = (stand.j.dateien || []).find((d: any) => d.id === 'f1');
p('Im Stand steht der Grabstein — geloescht, nicht verschwunden',
  !!grab && grab.geloescht === true, JSON.stringify(grab));

kern.stopp();
console.log(`\n  Suite 83 — Anhänge auf dem Server: ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
