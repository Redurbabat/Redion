/* Suite 86 — Jede Funktion hat einen Satz, und jeder Satz eine Funktion
 * ============================================================================
 * `LUECKEN.md` L9 führte 169 Namen, die die Maschine kann und über die
 * niemand einen Satz sagt. Wer eine Funktion nicht findet, hat sie nicht.
 *
 * DIE LÜCKE WAR NIE VERSTECKT. `Register.formeln.abgleich()` vergleicht
 * beide Listen seit jeher und hat die 169 die ganze Zeit korrekt gemeldet —
 * nur hat niemand gefragt. Genau das ist der Unterschied zwischen einer
 * Prüfung und einer Funktion, die eine Prüfung sein könnte.
 *
 * DER GRUND, WARUM DIE BESCHREIBUNGEN FRÜHER FEHLTEN, steht im Kopf von
 * `register/formeln.ts`: „eine Liste, die man doppelt pflegen muss, wird
 * nicht gepflegt." Das stimmt, solange niemand nachsieht. Dieser Lauf sieht
 * nach — in BEIDE Richtungen:
 *
 *   ohneBeschreibung   die Maschine kann etwas, das niemand erklärt
 *   ohneFunktion       jemand erklärt etwas, das die Maschine nicht kann
 *
 * Die zweite Richtung ist die gefährlichere: eine Beschreibung ohne
 * Funktion ist ein Versprechen, das beim Tippen bricht.
 *
 * UND ZUM SCHLUSS die Gegenprobe, ohne die der Lauf wertlos wäre: er muss
 * rot werden KÖNNEN. Ein erfundener Eintrag wird untergeschoben, und
 * `abgleich()` muss ihn nennen.
 *
 *   node pruefungen/lauf/test122.mts
 * ==========================================================================*/

import { chromium } from 'playwright';
import path from 'node:path';

declare const Register: any; declare const Formula: any;

const WURZEL = path.resolve(import.meta.dirname, '../..');
let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};

const browser = await chromium.launch();
const seite = await browser.newPage();
const jsFehler: string[] = [];
seite.on('pageerror', (e: Error) => jsFehler.push(e.message));
await seite.goto('file://' + WURZEL + '/index.html');
await seite.waitForTimeout(2000);

console.log('\n1 · Beide Listen decken sich');

const stand = await seite.evaluate(() => {
  const ab = Register.formeln.abgleich();
  /* `namen()` fügt drei Quellen zusammen und nennt manches doppelt —
     verglichen wird deshalb die Menge, nicht die Länge der Liste. */
  return { ohneBeschreibung: ab.ohneBeschreibung, ohneFunktion: ab.ohneFunktion,
           anzahl: Register.formeln.anzahl(),
           maschine: new Set(Formula.namen().map((n: string) => String(n).toLowerCase())).size };
}) as { ohneBeschreibung: string[]; ohneFunktion: string[]; anzahl: number; maschine: number };

p('Keine Funktion ohne Beschreibung', stand.ohneBeschreibung.length === 0,
  `${stand.ohneBeschreibung.length} ohne Satz: ` + stand.ohneBeschreibung.slice(0, 12).join(', '));
p('Keine Beschreibung ohne Funktion', stand.ohneFunktion.length === 0,
  `${stand.ohneFunktion.length} versprochen, aber nicht da: ` + stand.ohneFunktion.slice(0, 12).join(', '));
p('Die Maschine kennt über 250 verschiedene Namen', stand.maschine >= 250, String(stand.maschine));
p('Das Verzeichnis kennt mindestens so viele', stand.anzahl >= stand.maschine,
  `${stand.anzahl} gegen ${stand.maschine}`);

console.log('\n2 · Die Sätze taugen etwas');

const form = await seite.evaluate(() => {
  const alle = Register.formeln.alle();
  const GRUPPEN: string[] = Register.formeln.GRUPPEN;
  return {
    leer: alle.filter((x: any) => !x.was || !String(x.was).trim()).map((x: any) => x.name),
    ohneArgs: alle.filter((x: any) => !x.args).map((x: any) => x.name),
    fremdeGruppe: alle.filter((x: any) => !GRUPPEN.includes(x.gruppe))
      .map((x: any) => x.name + ':' + x.gruppe),
    platzhalter: alle.filter((x: any) => String(x.args) === '(…)').map((x: any) => x.name),
    zuKurz: alle.filter((x: any) => String(x.was || '').trim().length < 8).map((x: any) => x.name)
  };
}) as { leer: string[]; ohneArgs: string[]; fremdeGruppe: string[];
        platzhalter: string[]; zuKurz: string[] };

p('Kein Eintrag hat einen leeren Satz', form.leer.length === 0,
  form.leer.slice(0, 10).join(', '));
p('Jeder Eintrag sagt, welche Argumente er nimmt', form.ohneArgs.length === 0,
  form.ohneArgs.slice(0, 10).join(', '));
p('Keiner steht mehr auf dem Platzhalter „(…)"', form.platzhalter.length === 0,
  form.platzhalter.slice(0, 10).join(', '));
p('Jede Gruppe ist eine der bekannten', form.fremdeGruppe.length === 0,
  form.fremdeGruppe.slice(0, 8).join(', '));
p('Kein Satz ist ein einzelnes Wort', form.zuKurz.length === 0,
  form.zuKurz.slice(0, 10).join(', '));

console.log('\n3 · Und man findet sie auch');

const suche = await seite.evaluate(() => ({
  wurzel: Register.formeln.suche('sqrt').map((x: any) => x.name),
  nachSinn: Register.formeln.suche('Wochentag').map((x: any) => x.name),
  sonstiges: Register.formeln.inGruppe('Sonstiges').length,
  zahlen: Register.formeln.inGruppe('Zahlen').length
})) as { wurzel: string[]; nachSinn: string[]; sonstiges: number; zahlen: number };
p('Die Suche findet nach Namen', suche.wurzel.includes('sqrt'));
p('… und nach dem, was drinsteht', suche.nachSinn.length > 0,
  'nach „Wochentag" wird nichts gefunden');
p('Die Gruppe Zahlen ist gut gefüllt', suche.zahlen >= 30, String(suche.zahlen));
p('„Sonstiges" ist nicht mehr die grösste Gruppe', suche.sonstiges <= suche.zahlen,
  `Sonstiges ${suche.sonstiges}, Zahlen ${suche.zahlen} — dann sind die Gruppen nicht vergeben`);

console.log('\n4 · Die Gegenprobe: der Lauf muss rot werden können');

const gegen = await seite.evaluate(() => {
  /* Einen Namen unterschieben, den die Maschine nicht kennt. `melde` ist
     der Weg, auf dem Erweiterungen Einträge nachreichen. */
  Register.formeln.melde({ name: 'gibtesnicht', gruppe: 'Sonstiges',
    args: '()', was: 'Diese Funktion gibt es nicht' });
  return Register.formeln.abgleich().ohneFunktion;
}) as string[];
p('Ein erfundener Eintrag wird gemeldet', gegen.includes('gibtesnicht'),
  'die Prüfung kann gar nicht rot werden — dann prüft sie nichts');

p('Keine JS-Fehler beim Laden', jsFehler.length === 0, jsFehler.slice(0, 2).join(' · '));

await browser.close();
console.log(`\n  Suite 86 — Formelverzeichnis: ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
