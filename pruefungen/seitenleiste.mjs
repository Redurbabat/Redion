/* Die Seitenleiste: Abschnitte, Reihenfolge, Klappen, Reiter, Baum, Register
 * ----------------------------------------------------------------------------
 * Dieser Lauf ist zuerst als Netz für den Umzug A1 entstanden — die
 * Seitenleiste wandert aus `schale.js` in `seitenleiste.js`. Ein Umzug ist nur
 * dann einer, wenn sich das Verhalten nicht ändert, und das kann man nicht
 * behaupten, sondern nur zeigen: derselbe Lauf muss vorher und nachher
 * dasselbe Ergebnis liefern.
 *
 * Deshalb prüft er ausschliesslich über die öffentliche Fläche von `App` und
 * über das, was im Fenster wirklich steht — nicht über Namen, die drinnen
 * liegen. Was innen verschoben wird, darf hier gar nicht auffallen.
 *
 * Geprüft wird, was ein Mensch merken würde: dass die Abschnitte da sind, dass
 * Ausblenden wirkt und hält, dass die Reihenfolge sich ändern lässt, dass ein
 * zugeklappter Abschnitt zubleibt, dass der Reiterwechsel markiert wird, dass
 * die Seiten im Baum stehen und sich öffnen lassen.
 *
 *   node pruefungen/seitenleiste.mjs
 * ==========================================================================*/

import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

let ok = 0, bad = 0;
const pruef = (n, ist, soll) => {
  const gut = JSON.stringify(ist) === JSON.stringify(soll);
  console.log((gut ? '✅ ' : '❌ ') + n + (gut ? '' : `  ist=${JSON.stringify(ist)} soll=${JSON.stringify(soll)}`));
  gut ? ok++ : bad++;
};

/* Die Wurzel des Repositories — eine Ebene über pruefungen/. */
const WURZELORDNER = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

/* --------------------------------------------------------------------------
 * Ein Dateiserver. Die App muss über http:// geladen werden und nicht über
 * file:// — sonst verweigert der Browser IndexedDB und den Service Worker,
 * und geprüft würde etwas, das es so nie gibt.
 * ------------------------------------------------------------------------*/
const PORT = 8796;
const TYP = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json', '.png': 'image/png',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon'
};

const dateien = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://localhost');
  const pf = path.join(WURZELORDNER, u.pathname === '/' ? 'index.html' : u.pathname);
  /* Nichts ausserhalb der Wurzel ausliefern — ein Prüfserver ist auch einer. */
  if (!pf.startsWith(WURZELORDNER) || !fs.existsSync(pf) || fs.statSync(pf).isDirectory()) {
    res.writeHead(404); res.end(''); return;
  }
  res.writeHead(200, { 'Content-Type': TYP[path.extname(pf)] || 'application/octet-stream' });
  res.end(fs.readFileSync(pf));
});
await new Promise(r => dateien.listen(PORT, r));
const WURZEL = 'http://localhost:' + PORT;

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
const p = await ctx.newPage();
const fehler = [];
p.on('pageerror', e => fehler.push(e.message));

await p.goto(WURZEL + '/index.html');

/* `App` steht bewusst nicht auf `window` — deshalb `typeof` statt `window.App`.
   Und gewartet wird auf den fertigen Baum, nicht auf eine feste Zeit: eine
   Zahl in Millisekunden ist auf einem langsamen Rechner immer zu kurz. */
await p.waitForFunction(
  () => typeof App !== 'undefined' && typeof Store !== 'undefined' &&
        (document.getElementById('tree') || {}).childElementCount > 0,
  null, { timeout: 30000 });

/* Die Namen der Abschnitts-Überschriften, in der Reihenfolge, in der sie
   dastehen. `firstChild` lässt den Klapp-Pfeil weg, der im selben span sitzt. */
const ueberschriften = () => p.evaluate(() =>
  [...document.querySelectorAll('#tree .side-section')]
    .map(el => (el.querySelector('span')?.firstChild?.textContent || '').trim()));

/* ======================================================================== *
 * 1 · GRUNDLAGEN
 * ======================================================================== */
console.log('\n--- Grundlagen ---');

const grund = await p.evaluate(() => ({
  app:      typeof App !== 'undefined',
  store:    typeof Store !== 'undefined',
  ui:       typeof UI !== 'undefined',
  eintraege: document.getElementById('tree').childElementCount > 0,
  reiterDa: !!document.getElementById('side-reiter')
}));
pruef('Die App steht',                grund.app, true);
pruef('Der Speicher steht',           grund.store, true);
pruef('Die Überlagerungen stehen',    grund.ui, true);
pruef('Im Baum steht etwas',          grund.eintraege, true);
pruef('Die Reiterleiste ist da',      grund.reiterDa, true);

const abschnitte = await p.evaluate(() => App.ABSCHNITTE.map(x => x[0]));
pruef('Acht Abschnitte sind bekannt', abschnitte,
      ['werkzeuge', 'agenten', 'bespr', 'kuerzlich', 'favoriten', 'bereiche', 'privat', 'apps']);

const namenJetzt = await ueberschriften();
pruef('Werkzeuge steht da',    namenJetzt.includes('Werkzeuge'), true);
pruef('Agenten steht da',      namenJetzt.includes('Agenten'), true);
pruef('Besprechungen steht da', namenJetzt.includes('Besprechungen'), true);
pruef('Meine Apps steht da',   namenJetzt.includes('Meine Apps'), true);

/* Die Werkzeugknöpfe und die App-Knöpfe — sie sind der eigentliche Inhalt der
   Leiste, und ein fehlender fällt sonst niemandem auf. */
const knoepfe = await p.evaluate(() => ({
  wz:  [...document.querySelectorAll('#tree [data-wz]')].map(b => b.dataset.wz),
  apps: document.querySelectorAll('#tree [data-app]').length
}));
pruef('Die sieben Werkzeuge stehen da', knoepfe.wz,
      ['journal', 'memos', 'vorlagen', 'graph', 'tags', 'lernen', 'stand']);
pruef('Und zwanzig Apps',               knoepfe.apps, 20);

/* ======================================================================== *
 * 2 · EINEN ABSCHNITT AUSBLENDEN — UND WIEDER HOLEN
 * ======================================================================== */
console.log('\n--- Ausblenden ---');

await p.evaluate(() => App.abschnittSchalten('werkzeuge'));
const ohneWz = await ueberschriften();
pruef('Werkzeuge ist weg',        ohneWz.includes('Werkzeuge'), false);
pruef('Meine Apps ist noch da',   ohneWz.includes('Meine Apps'), true);
pruef('Und der Speicher weiss es',
      await p.evaluate(() => (Store.getMeta('sidebarAus', []) || []).includes('werkzeuge')), true);
pruef('Ausgeblendet heisst auch: nicht mehr an',
      await p.evaluate(() => App.abschnittAn('werkzeuge')), false);

await p.evaluate(() => App.abschnittSchalten('werkzeuge'));
pruef('Wieder eingeblendet',      (await ueberschriften()).includes('Werkzeuge'), true);
pruef('Und der Speicher ist wieder leer',
      await p.evaluate(() => (Store.getMeta('sidebarAus', []) || []).length), 0);

/* ======================================================================== *
 * 3 · DIE REIHENFOLGE DER ABSCHNITTE
 * ======================================================================== */
console.log('\n--- Reihenfolge ---');

const vorher = await ueberschriften();
pruef('Werkzeuge steht vor Meine Apps',
      vorher.indexOf('Werkzeuge') < vorher.indexOf('Meine Apps'), true);

/* Umdrehen: Meine Apps nach ganz oben. */
await p.evaluate(() => {
  Store.setMeta('sidebarFolge', ['apps', 'werkzeuge', 'agenten', 'bespr',
                                 'kuerzlich', 'favoriten', 'bereiche', 'privat']);
  App.zeichneBaum();
});
const gedreht = await ueberschriften();
pruef('Jetzt steht Meine Apps vorn',
      gedreht.indexOf('Meine Apps') < gedreht.indexOf('Werkzeuge'), true);
pruef('Es sind dieselben Abschnitte wie vorher',
      [...gedreht].sort(), [...vorher].sort());

await p.evaluate(() => { Store.setMeta('sidebarFolge', null); App.zeichneBaum(); });
pruef('Zurückgesetzt steht wieder Werkzeuge vorn',
      (await ueberschriften()).indexOf('Werkzeuge') <
      (await ueberschriften()).indexOf('Meine Apps'), true);

/* ======================================================================== *
 * 4 · ZUKLAPPEN — UND ES BLEIBT ZU
 * ======================================================================== */
console.log('\n--- Zuklappen ---');

/* So, wie ein Mensch es tut: auf die Überschrift klicken. */
await p.evaluate(() => {
  const el = [...document.querySelectorAll('#tree .side-section')]
    .find(e => (e.querySelector('span')?.firstChild?.textContent || '').trim() === 'Meine Apps');
  el.querySelector('span').click();
});
pruef('Der Speicher merkt sich den zugeklappten Abschnitt',
      await p.evaluate(() => (Store.getMeta('sidebarZu', []) || []).includes('Meine Apps')), true);

/* Das Verstecken läuft über ein setTimeout(…, 0) nach dem Zeichnen. */
await p.waitForFunction(() =>
  [...document.querySelectorAll('#tree .side-section')]
    .some(e => e.classList.contains('zu')), null, { timeout: 5000 });
const zuStand = await p.evaluate(() => {
  const el = [...document.querySelectorAll('#tree .side-section')]
    .find(e => (e.querySelector('span')?.firstChild?.textContent || '').trim() === 'Meine Apps');
  let n = el.nextElementSibling, versteckt = 0;
  while (n && !n.classList.contains('side-section')) {
    if (n.style.display === 'none') versteckt++;
    n = n.nextElementSibling;
  }
  return { klasse: el.classList.contains('zu'), versteckt };
});
pruef('Die Überschrift ist als zu markiert', zuStand.klasse, true);
pruef('Und was darunter hängt, ist versteckt', zuStand.versteckt > 0, true);

/* Nach einem Neuzeichnen muss es zu bleiben — sonst wäre es keine Einstellung,
   sondern ein Zufall. */
await p.evaluate(() => App.zeichneBaum());
await p.waitForFunction(() =>
  [...document.querySelectorAll('#tree .side-section')]
    .some(e => e.classList.contains('zu')), null, { timeout: 5000 });
pruef('Nach dem Neuzeichnen immer noch zu',
      await p.evaluate(() =>
        [...document.querySelectorAll('#tree .side-section')]
          .find(e => (e.querySelector('span')?.firstChild?.textContent || '').trim() === 'Meine Apps')
          .classList.contains('zu')), true);

await p.evaluate(() => { Store.setMeta('sidebarZu', []); App.zeichneBaum(); });

/* ======================================================================== *
 * 5 · DAS ⋯-MENÜ EINES ABSCHNITTS
 * ======================================================================== */
console.log('\n--- Das Menü am Abschnitt ---');

await p.evaluate(() => {
  const el = [...document.querySelectorAll('#tree .side-section')]
    .find(e => (e.querySelector('span')?.firstChild?.textContent || '').trim() === 'Werkzeuge');
  [...el.querySelectorAll('button')].find(b => b.textContent === '⋯').click();
});
const menue = await p.evaluate(() => {
  const m = document.querySelector('.menu');
  return m ? [...m.querySelectorAll('[data-a]')].map(b => b.dataset.a) : null;
});
pruef('Das Menü bietet alles an, was es verspricht', menue,
      ['klappen', 'alleZu', 'alleAuf', 'hoch', 'runter', 'aus', 'anpassen']);
await p.evaluate(() => document.querySelectorAll('.menu').forEach(m => m.remove()));

/* ======================================================================== *
 * 6 · DIE REITER
 * ======================================================================== */
console.log('\n--- Reiter ---');

const aktiverReiter = () => p.evaluate(() =>
  ([...document.querySelectorAll('#side-reiter .sr')].find(b => b.classList.contains('on')) || {})
    .dataset?.reiter || null);

pruef('Am Anfang steht Start', await aktiverReiter(), 'start');
await p.evaluate(() => App.reiterWechseln('chat'));
pruef('Nach dem Wechsel ist Chat markiert', await aktiverReiter(), 'chat');
pruef('Und der Baum zeigt etwas anderes',
      await p.evaluate(() => document.querySelectorAll('#tree [data-wz]').length), 0);

await p.evaluate(() => App.reiterWechseln('start'));
pruef('Zurück auf Start',                  await aktiverReiter(), 'start');
pruef('Und die Werkzeuge sind wieder da',
      await p.evaluate(() => document.querySelectorAll('#tree [data-wz]').length), 7);

/* ======================================================================== *
 * 7 · DIE SEITEN IM BAUM
 * ======================================================================== */
console.log('\n--- Der Seitenbaum ---');

const baum = await p.evaluate(() => ({
  zeilen: document.querySelectorAll('#tree .row').length,
  ziehbar: [...document.querySelectorAll('#tree .row')].every(r => r.draggable),
  mitNamen: [...document.querySelectorAll('#tree .row .nm')].every(n => n.textContent.length > 0),
  markiert: document.querySelectorAll('#tree .row.on').length
}));
pruef('Es stehen Seiten im Baum',      baum.zeilen > 0, true);
pruef('Jede Zeile lässt sich ziehen',  baum.ziehbar, true);
pruef('Und jede hat einen Namen',      baum.mitNamen, true);
pruef('Die offene Seite ist markiert', baum.markiert, 1);

/* Eine Seite anlegen und nachsehen, ob sie in der Leiste ankommt. */
const nachher = await p.evaluate(() => {
  const vorher = document.querySelectorAll('#tree .row').length;
  const s = Store.addPage(null, { text: 'Prüfseite Seitenleiste' });
  App.zeichneBaum();
  return { vorher, nachher: document.querySelectorAll('#tree .row').length, id: s.id };
});
pruef('Eine neue Seite steht sofort in der Leiste',
      nachher.nachher, nachher.vorher + 1);
pruef('Und zwar mit ihrem Namen',
      await p.evaluate(() => [...document.querySelectorAll('#tree .row .nm')]
        .some(n => n.textContent === 'Prüfseite Seitenleiste')), true);

/* Anklicken öffnet sie — das ist der Zweck der ganzen Leiste. */
await p.evaluate(() => {
  [...document.querySelectorAll('#tree .row')]
    .find(r => r.querySelector('.nm')?.textContent === 'Prüfseite Seitenleiste').click();
});
await p.waitForTimeout(300);
pruef('Ein Klick öffnet die Seite',
      await p.evaluate(() => App.aktuelleSeite()), nachher.id);
pruef('Und die Zeile ist jetzt die markierte',
      await p.evaluate(() => document.querySelector('#tree .row.on .nm')?.textContent),
      'Prüfseite Seitenleiste');

/* ======================================================================== *
 * 8 · WAS DAS REGISTER BEISTEUERT
 * ======================================================================== */
console.log('\n--- Register ---');

const regDa = await p.evaluate(() => {
  Register.navigation.melde({ id: 'pruef-eintrag', name: 'Prüfeintrag', icon: '🧪',
                              platz: 'unten', rang: 900, tun: () => {} });
  App.zeichneBaum();
  return [...document.querySelectorAll('#tree .side-item')]
    .some(b => b.textContent.includes('Prüfeintrag'));
});
pruef('Ein angemeldeter Eintrag steht in der Leiste', regDa, true);

const regWeg = await p.evaluate(() => {
  Register.navigation.nimmZurueck('pruef-eintrag');
  App.zeichneBaum();
  return [...document.querySelectorAll('#tree .side-item')]
    .some(b => b.textContent.includes('Prüfeintrag'));
});
pruef('Zurückgenommen ist er wieder weg', regWeg, false);

/* Ein Eintrag, dessen `zeigen()` nein sagt, darf gar nicht erst kommen. */
const regStumm = await p.evaluate(() => {
  Register.navigation.melde({ id: 'pruef-stumm', name: 'Nicht zeigen', icon: '🙈',
                              platz: 'unten', rang: 901, zeigen: () => false, tun: () => {} });
  App.zeichneBaum();
  const da = [...document.querySelectorAll('#tree .side-item')]
    .some(b => b.textContent.includes('Nicht zeigen'));
  Register.navigation.nimmZurueck('pruef-stumm');
  return da;
});
pruef('Wer sich nicht zeigen will, kommt nicht mit', regStumm, false);

/* ======================================================================== *
 * 9 · DER ANPASSMODUS
 * ======================================================================== */
console.log('\n--- Abschnitte anpassen ---');

await p.evaluate(() => App.abschnitteAnpassen());
const anpass = await p.evaluate(() => ({
  zeilen: document.querySelectorAll('#tree .side-item.anpass').length,
  fertig: !!document.querySelector('#tree .anpass-fertig'),
  werkzeugeWeg: document.querySelectorAll('#tree [data-wz]').length
}));
pruef('Jeder Abschnitt bekommt eine Zeile', anpass.zeilen >= 8, true);
pruef('Und es gibt einen Weg heraus',       anpass.fertig, true);
pruef('Der gewöhnliche Baum ist solange weg', anpass.werkzeugeWeg, 0);

await p.evaluate(() => document.querySelector('#tree .anpass-fertig').click());
pruef('Nach Erledigt steht der Baum wieder da',
      await p.evaluate(() => document.querySelectorAll('#tree [data-wz]').length), 7);

/* ======================================================================== */
console.log(`\n${ok}/${ok + bad} bestanden`);
console.log(fehler.length ? 'JS-Fehler:\n' + fehler.join('\n') : 'Keine JS-Fehler.');

await browser.close();
await new Promise(r => dateien.close(r));
process.exit(bad || fehler.length ? 1 : 0);
