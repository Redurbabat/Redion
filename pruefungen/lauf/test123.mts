/* Suite 87 — WENNFEHLER: ein Fehler entsteht dort, wo jemand danach fragt
 * ============================================================================
 * `LUECKEN.md` L4 führte das lange als blockierte Architekturfrage, und die
 * Begründung stimmte: Redion rechnet abwehrend. `1/0` ergibt 0, `WURZEL(-1)`
 * ergibt 0 — wo kein Fehler entsteht, gibt es für `WENNFEHLER` nichts zu
 * fangen. Und das Rechnen umzustellen war nie eine Option: es änderte das
 * Ergebnis JEDER bestehenden Formelspalte in JEDER bestehenden Datenbank.
 * Wo heute 0 steht, stünde ein Fehler. Das ist Priorität 1.
 *
 * DIE AUFLÖSUNG BRAUCHT KEINE UMSTELLUNG. `WENNFEHLER` und `ISTFEHLER`
 * werten ihr Argument im strengen Modus aus (E31) — dem, den der
 * Tabellenblock ohnehin benutzt. Sie sind eine INSEL: streng gerechnet wird
 * nur, wonach ausdrücklich gefragt wurde, und nur innerhalb der Klammer.
 *
 * DASS BESTEHENDE SPALTEN UNBERÜHRT BLEIBEN, ist deshalb kein Versprechen,
 * sondern eine Beobachtung — und Abschnitt 1 macht sie. Eine bestehende
 * Formel kann diese Funktionen gar nicht enthalten: es gab sie bis heute
 * nicht.
 *
 * UND EIN TIPPFEHLER BLEIBT EIN TIPPFEHLER. Excel schluckt mit IFERROR auch
 * `#NAME?`; hier nicht. Der Grund steht schon in `laufzeit.ts`: wer einen
 * Tippfehler als Rechenfehler ausgibt, schickt den Menschen an die falsche
 * Stelle. `WENNFEHLER(SUMEE(A); 0)` soll nicht stillschweigend 0 ergeben.
 *
 *   node pruefungen/lauf/test123.mts
 * ==========================================================================*/

import { chromium } from 'playwright';
import path from 'node:path';

declare const Formula: any; declare const Register: any;

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

const lauf = (formel: string, streng = false) => seite.evaluate(([f, s]: [string, boolean]) => {
  const e = Formula.run(f, () => null, null, s ? { streng: true } : undefined);
  return e.ok ? { ok: true, wert: e.wert } : { ok: false, fehler: String(e.fehler) };
}, [formel, streng] as [string, boolean]) as Promise<{ ok: boolean; wert?: unknown; fehler?: string }>;

/* ==========================================================================
 * 1 · Die Zusicherung: bestehende Spalten rechnen wie gestern
 * ========================================================================*/
console.log('\n1 · Bestehende Spalten rechnen wie gestern');

const abwehrend = [
  ['1/0', 0], ['4/0', 0], ['mod(5, 0)', 0], ['sqrt(-1)', 0],
  ['ln(0)', 0], ['log10(-5)', 0], ['tonumber("abc")', 0]
] as [string, number][];
for (const [formel, soll] of abwehrend) {
  const r = await lauf(formel);
  p(`${formel} ergibt weiterhin ${soll}`, r.ok && r.wert === soll,
    JSON.stringify(r));
}

/* ==========================================================================
 * 2 · WENNFEHLER fängt den Rechenfehler
 * ========================================================================*/
console.log('\n2 · WENNFEHLER fängt den Rechenfehler');

const gefangen = await lauf('iferror(1/0, "—")');
p('iferror(1/0, "—") ergibt den Ersatz', gefangen.ok && gefangen.wert === '—',
  JSON.stringify(gefangen));
p('Ohne Fehler kommt der echte Wert durch',
  (await lauf('iferror(4/2, "—")')).wert === 2);
p('Auch WURZEL(-1) gilt als Rechenfehler',
  (await lauf('iferror(sqrt(-1), "nix")')).wert === 'nix');
p('Ohne Ersatz kommt Leer statt Fehler',
  (await lauf('iferror(1/0)')).wert === '');
p('Verschachtelt geht auch',
  (await lauf('iferror(iferror(1/0, 2/0), "beide")')).wert === 'beide');

const deutsch = await lauf('WENNFEHLER(1/0, "—")');
p('Der deutsche Name WENNFEHLER tut dasselbe', deutsch.ok && deutsch.wert === '—',
  JSON.stringify(deutsch));
p('ISTFEHLER sagt wahr bei 1/0', (await lauf('ISTFEHLER(1/0)')).wert === true);
p('… und falsch bei 4/2', (await lauf('iserror(4/2)')).wert === false);

/* ==========================================================================
 * 3 · Die Strenge bleibt eine Insel
 * ========================================================================*/
console.log('\n3 · Die Strenge bleibt eine Insel');

p('Ausserhalb der Klammer wird weiter abwehrend gerechnet',
  (await lauf('iferror(1/0, 0) + 1/0')).wert === 0,
  'die Strenge ist ausgelaufen — dann ändert WENNFEHLER fremde Formeln mit');
p('Nach dem Fangen lässt sich weiterrechnen',
  (await lauf('iferror(1/0, 0) + 5')).wert === 5);
p('Und eine Formel ganz ohne WENNFEHLER bleibt unberührt',
  (await lauf('1/0 + 7')).wert === 7);

/* ==========================================================================
 * 4 · Ein Tippfehler bleibt ein Tippfehler
 * ========================================================================*/
console.log('\n4 · Ein Tippfehler bleibt ein Tippfehler');

const tipp = await lauf('iferror(gibtsnicht(1), 0)');
p('Eine unbekannte Funktion wird NICHT verschluckt', !tipp.ok,
  'sie ergab ' + JSON.stringify(tipp.wert) + ' — der Mensch sucht dann in seinen Zahlen');
p('… und die Meldung nennt den Namen', /gibtsnicht/.test(String(tipp.fehler)),
  String(tipp.fehler));

/* ==========================================================================
 * 5 · Der Tabellenblock rechnet weiterhin streng von sich aus
 * ========================================================================*/
console.log('\n5 · Der Tabellenblock rechnet weiterhin streng');

const streng = await lauf('1/0', true);
p('Im strengen Modus ist 1/0 ein #DIV/0!', !streng.ok && streng.fehler === '#DIV/0!',
  JSON.stringify(streng));
p('Und WENNFEHLER fängt es auch dort',
  (await lauf('iferror(1/0, "leer")', true)).wert === 'leer');

/* ==========================================================================
 * 6 · Beschrieben sind sie auch
 * ========================================================================*/
console.log('\n6 · Beschrieben sind sie auch');

const verz = await seite.evaluate(() => {
  const ab = Register.formeln.abgleich();
  const namen = ['iferror', 'iserror', 'WENNFEHLER', 'ISTFEHLER'];
  return {
    ohneBeschreibung: ab.ohneBeschreibung, ohneFunktion: ab.ohneFunktion,
    eintraege: namen.map(n => {
      const e = Register.formeln.eines(n);
      return { n, da: !!e, was: e ? String(e.was || '') : '' };
    })
  };
}) as { ohneBeschreibung: string[]; ohneFunktion: string[];
        eintraege: { n: string; da: boolean; was: string }[] };
p('Alle vier stehen im Verzeichnis', verz.eintraege.every(e => e.da && e.was.length > 10),
  JSON.stringify(verz.eintraege));
p('Das Verzeichnis bleibt in beide Richtungen dicht',
  verz.ohneBeschreibung.length === 0 && verz.ohneFunktion.length === 0,
  JSON.stringify([verz.ohneBeschreibung, verz.ohneFunktion]));

p('Keine JS-Fehler beim Laden', jsFehler.length === 0, jsFehler.slice(0, 2).join(' · '));

await browser.close();
console.log(`\n  Suite 87 — WENNFEHLER und ISTFEHLER: ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
