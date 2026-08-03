/* Suite 59 — Die CSP der veröffentlichten Seite hält wirklich
 * ----------------------------------------------------------------------------
 * `test93` prüft, dass die Kopfzeile **gesendet** wird. Dieser Lauf prüft, dass
 * sie **wirkt** — und das ist nicht dieselbe Frage. Eine CSP mit einem Tippfehler
 * im Direktivnamen wird ausgeliefert, gilt aber nicht; sie sieht in jedem
 * Kopfzeilen-Vergleich richtig aus und schützt nichts.
 *
 * WARUM DIESE SEITE UND KEINE ANDERE. `/s/:schluessel` ist die einzige Seite
 * dieser App, die ein **fremder** Browser darstellt. Und der Inhalt geht dort
 * durch `sauber()` in `server/kern.js` — eine Säuberung mit **regulären
 * Ausdrücken**, nicht mit einem Parser. Ein Ausdruck ist leichter zu
 * überlisten als ein Parser; die App selbst benutzt deshalb drüben ein
 * `<template>`. Auf dem Server geht das nicht: ein Cloudflare-Arbeiter hat
 * kein DOM.
 *
 * Also wird hier genau der Fall nachgestellt, den man nicht ausschliessen
 * kann: **was passiert, wenn `sauber()` einmal versagt?** Das Skript wird
 * deshalb nach dem Säubern von Hand in die Ablage gelegt. Nicht um die
 * Säuberung schlechtzumachen, sondern weil eine zweite Sperre nur dann etwas
 * wert ist, wenn sie ohne die erste geprüft wurde.
 *
 * UND DIE GEGENRICHTUNG, die genauso zählt: die Seite muss trotzdem
 * funktionieren. Eine CSP, die das eigene Aussehen abschaltet, wird beim
 * ersten Blick wieder ausgebaut.
 *
 *   node pruefungen/lauf/test94.mjs
 * ==========================================================================*/
import { chromium } from 'playwright';
import { starte } from '../../server/pruefserver.js';
import { abdruck } from '../../server/kern.js';

let ok = 0, weg = 0;
const p = (n, b, extra = '') => { if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); } };

const srv = await starte(8801);   /* 8795 gehört test76 */
await srv.ablage.setze('konten', { id: 'k1', mail: 'a@b.ch', name: 'A' });
const tok = 'sit_pruefung_csp';
await srv.ablage.setze('sitzungen', { token: await abdruck(tok), kontoId: 'k1',
  bis: new Date(Date.now() + 86400000).toISOString() });
await srv.ablage.setze('bereiche', { id: 'b1', name: 'T', besitzer: 'k1' });

const v = await (await fetch(srv.adresse + '/veroeffentlichen', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tok },
  body: JSON.stringify({ bereich: 'b1', seite: 's1', titel: 'Probe',
                         inhalt: '<p>Sichtbarer Text</p>' })
})).json();

/* Der Server säubert beim Anlegen — für diesen Nachweis muss die Säuberung
   umgangen werden. Sonst prüfte der Lauf sie und nicht die CSP. */
const satz = await srv.ablage.hole('oeffentlich', { schluessel: v.schluessel });
await srv.ablage.setze('oeffentlich', { ...satz,
  inhalt: '<p>Sichtbarer Text</p>' +
          '<script>window.__lief = 1</' + 'script>' +
          '<img src="gibt-es-nicht" onerror="window.__lief2 = 1">' +
          '<a id="js" href="javascript:window.__lief3 = 1">klick</a>' });

const browser = await chromium.launch();
const seite = await browser.newPage();
const verstoesse = [];
seite.on('console', m => {
  if (/Content Security Policy/i.test(m.text())) verstoesse.push(m.text());
});

await seite.goto(srv.adresse + '/s/' + v.schluessel);
await seite.waitForTimeout(900);

console.log('\n1 · Was NICHT laufen darf');
p('Ein <script> im Inhalt läuft nicht',
  await seite.evaluate(() => window.__lief) === undefined);
p('Ein onerror am Bild läuft nicht',
  await seite.evaluate(() => window.__lief2) === undefined);

await seite.evaluate(() => document.getElementById('js')?.click());
await seite.waitForTimeout(300);
p('Ein javascript:-Verweis läuft auch beim Anklicken nicht',
  await seite.evaluate(() => window.__lief3) === undefined);

/* Der Browser muss es auch GEMELDET haben. Bliebe das Protokoll leer, wäre
   das kein guter Nachweis, sondern der Hinweis, dass gar nichts ankam —
   etwa weil der Inhalt nie in die Seite geriet. */
p('Der Browser meldet die abgewehrten Versuche', verstoesse.length >= 2,
  verstoesse.length + ' Meldung(en)');
p('… und zwar wegen eines Skripts',
  verstoesse.some(x => /inline script/i.test(x)));
p('… und wegen eines Ereignis-Attributs',
  verstoesse.some(x => /inline event handler/i.test(x)));

console.log('\n2 · Was weiterhin funktionieren muss');
const text = await seite.textContent('body');
p('Der Text der Seite ist da', text.includes('Sichtbarer Text'), text.slice(0, 60));
p('Der Titel ist da', text.includes('Probe'));

/* Das Aussehen kommt aus einem <style>-Block. Käme es nicht an, sähe die
   Seite wie ein Fehler aus — und eine CSP, die so wirkt, baut der Nächste
   wieder aus. */
const schrift = await seite.evaluate(() => getComputedStyle(document.body).maxWidth);
p('Das eigene Aussehen wirkt', schrift === '720px', 'max-width ist ' + schrift);

p('Der Fusstext steht darunter', text.includes('Veröffentlicht mit Redion'));

await browser.close();
await srv.stopp();

console.log(`\n  Suite 59 — Die CSP hält: ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
