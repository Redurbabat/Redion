/* Die Seitenanzeige: Kopf, Werkzeugzeile, Blöcke, Pfadleiste, Streifen
 * ----------------------------------------------------------------------------
 * Das Netz für den Umzug A2 — Kopfleiste und Inhaltsfläche wandern aus
 * `schale.js` in eigene Dateien. Anders als bei A1 wird dabei nicht nur ein
 * Block verschoben, sondern eine Funktion aufgeteilt: `zeichneSeite` malt
 * heute Cover, Symbol, Titel, Sperrhinweis, Werkzeugzeile, Wiki-Verzeichnis,
 * Blöcke und Rückverweise in einem Zug in dasselbe Element.
 *
 * Bei so einem Schnitt ist die REIHENFOLGE im Dokument das, was leicht
 * kaputtgeht und was niemand sofort sieht: ein Cover unter dem Titel sieht
 * aus wie ein Stilfehler, nicht wie ein Umzugsfehler. Deshalb prüft dieser
 * Lauf nicht nur, dass die Teile da sind, sondern in welcher Folge sie
 * stehen.
 *
 * Zwei Sperren, die gern verwechselt werden, stehen hier ausdrücklich
 * nebeneinander: `gesperrt` ist der Schreibschutz (die Seite ist zu sehen,
 * aber nicht zu ändern), `locked` ist die Verschlüsselung (die Seite ist
 * nicht einmal zu sehen). Wer beim Umbauen eines für das andere hält, gibt
 * verschlüsselten Inhalt frei.
 *
 *   node pruefungen/seite.mjs
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

const WURZELORDNER = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const PORT = 8797;
const TYP = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json', '.png': 'image/png',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon'
};
const dateien = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://localhost');
  const pf = path.join(WURZELORDNER, u.pathname === '/' ? 'index.html' : u.pathname);
  if (!pf.startsWith(WURZELORDNER) || !fs.existsSync(pf) || fs.statSync(pf).isDirectory()) {
    res.writeHead(404); res.end(''); return;
  }
  res.writeHead(200, { 'Content-Type': TYP[path.extname(pf)] || 'application/octet-stream' });
  res.end(fs.readFileSync(pf));
});
await new Promise(r => dateien.listen(PORT, r));

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
const p = await ctx.newPage();
const fehler = [];
p.on('pageerror', e => fehler.push(e.message));

await p.goto('http://localhost:' + PORT + '/index.html');
await p.waitForFunction(
  () => typeof App !== 'undefined' && typeof Store !== 'undefined' &&
        (document.getElementById('tree') || {}).childElementCount > 0,
  null, { timeout: 30000 });

/* Eine frische Seite anlegen, öffnen und zeichnen. Gibt die Kennung zurück. */
const neueSeite = (felder = {}) => p.evaluate((f) => {
  const s = Store.addPage(null, Object.assign({ text: 'Prüfseite' }, f));
  App.oeffne(s.id);
  App.zeichneSeite();
  return s.id;
}, felder);

/* Die Kinder von #page als Liste von Klassen/Kennungen — daran hängt die
   Reihenfolge, und die ist beim Aufteilen das Empfindliche. */
const aufbau = () => p.evaluate(() =>
  [...document.getElementById('page').children].map(el =>
    el.id ? '#' + el.id : (el.className || el.tagName.toLowerCase())));

/* ======================================================================== *
 * 1 · DER KOPF EINER SEITE
 * ======================================================================== */
console.log('\n--- Der Kopf ---');

const id1 = await neueSeite({ text: 'Meine Seite', icon: '🌞' });

const kopf = await p.evaluate(() => ({
  symbol:  document.querySelector('#page .pg-icon')?.textContent,
  titel:   document.getElementById('title')?.textContent,
  aenderbar: document.getElementById('title')?.contentEditable,
  cover:   !!document.querySelector('#page .cover'),
  tools:   [...document.querySelectorAll('#page .pg-tools button')].map(b => b.dataset.a)
}));
pruef('Das Symbol steht da',        kopf.symbol, '🌞');
pruef('Der Titel steht da',         kopf.titel, 'Meine Seite');
pruef('Und lässt sich ändern',      kopf.aenderbar, 'true');
pruef('Ohne Cover kein Cover',      kopf.cover, false);
pruef('Die Werkzeugzeile ist voll', kopf.tools, ['cover', 'wide', 'font', 'vorlage', 'ai']);

/* Die Reihenfolge im Dokument. Genau das geht beim Aufteilen kaputt.
   Hinter der Werkzeugzeile stehen die Blöcke — eine leere Seite bekommt von
   selbst einen, deshalb wird nur der Kopf verglichen. */
pruef('Symbol vor Titel vor Werkzeugen', (await aufbau()).slice(0, 3),
      ['pg-icon', '#title', 'pg-tools']);
pruef('Und die Blöcke kommen danach',
      (await aufbau()).slice(3).every(x => x.startsWith('blk')), true);

/* Ein Cover schiebt sich VOR das Symbol, nicht irgendwohin. */
await p.evaluate((id) => { Store.updateBlock(id, { cover: '#ff0000' }); App.zeichneSeite(); }, id1);
pruef('Mit Cover steht es ganz oben', (await aufbau()).slice(0, 4),
      ['cover', 'pg-icon', '#title', 'pg-tools']);

/* Der Titel schreibt in den Bestand und zieht die Seitenleiste mit. */
const getippt = await p.evaluate((id) => {
  const t = document.getElementById('title');
  t.textContent = 'Umbenannt';
  t.dispatchEvent(new Event('input', { bubbles: true }));
  return {
    imBestand: Store.getBlock(id).text,
    inDerLeiste: [...document.querySelectorAll('#tree .row .nm')].some(n => n.textContent === 'Umbenannt')
  };
}, id1);
pruef('Tippen landet im Bestand',        getippt.imBestand, 'Umbenannt');
pruef('Und sofort in der Seitenleiste',  getippt.inDerLeiste, true);

/* ======================================================================== *
 * 2 · DIE PFADLEISTE
 * ======================================================================== */
console.log('\n--- Die Pfadleiste ---');

const unterId = await p.evaluate((eltern) => {
  const k = Store.addPage(eltern, { text: 'Unterseite' });
  App.oeffne(k.id);
  App.zeichneSeite();
  return k.id;
}, id1);

const krume = await p.evaluate(() => ({
  glieder: [...document.querySelectorAll('#crumb a')].map(a => a.textContent.trim()),
  trenner: document.querySelectorAll('#crumb .sep').length
}));
pruef('Der Pfad zeigt beide Seiten', krume.glieder.length, 2);
pruef('Die letzte ist die offene',   krume.glieder[1].includes('Unterseite'), true);
pruef('Mit einem Trennzeichen dazwischen', krume.trenner, 1);

/* Ein Klick auf den Pfad springt zurück. */
await p.evaluate(() => document.querySelector('#crumb a').click());
await p.waitForTimeout(250);
pruef('Ein Klick auf den Pfad öffnet die Elternseite',
      await p.evaluate(() => App.aktuelleSeite()), id1);

/* „Pfadnavigation aus" zeigt nur die Seite selbst. */
await p.evaluate((id) => {
  App.oeffne(id); Store.updateBlock(id, { pfad: false }); App.zeichneSeite();
}, unterId);
pruef('Pfadnavigation aus zeigt nur die Seite',
      await p.evaluate(() => document.querySelectorAll('#crumb a').length), 1);
await p.evaluate((id) => { Store.updateBlock(id, { pfad: true }); }, unterId);

/* ======================================================================== *
 * 3 · DIE KNÖPFE IN DER KOPFZEILE
 * Sie werden beim Zeichnen der Pfadleiste mitgesetzt — leicht zu übersehen,
 * wenn man die Pfadleiste verschiebt.
 * ======================================================================== */
console.log('\n--- Die Kopfzeile ---');

const knoepfe = async () => p.evaluate(() => ({
  stern:  document.getElementById('btn-fav').textContent,
  schloss: document.getElementById('btn-lock').textContent,
  blitz:  document.getElementById('btn-auto').style.display
}));

await p.evaluate((id) => { App.oeffne(id); Store.updateBlock(id, { favorite: false, gesperrt: false }); App.zeichneSeite(); }, id1);
let k = await knoepfe();
pruef('Kein Favorit: leerer Stern', k.stern, '☆');
pruef('Nicht gesperrt: offenes Schloss', k.schloss, '🔓');
pruef('Ohne Datenbank kein Blitz', k.blitz, 'none');

await p.evaluate((id) => { Store.updateBlock(id, { favorite: true, gesperrt: true }); App.zeichneSeite(); }, id1);
k = await knoepfe();
pruef('Favorit: voller Stern',           k.stern, '★');
pruef('Gesperrt: geschlossenes Schloss', k.schloss, '🔒');

/* ======================================================================== *
 * 4 · SCHREIBSCHUTZ — sichtbar, aber nicht änderbar
 * ======================================================================== */
console.log('\n--- Schreibschutz (gesperrt) ---');

const schutz = await p.evaluate(() => ({
  hinweis:  !!document.querySelector('#page .sperrhinweis'),
  titelZu:  document.getElementById('title').contentEditable,
  bloecke:  document.querySelectorAll('#page .blk').length
}));
pruef('Ein Hinweis erklärt die Sperre', schutz.hinweis, true);
pruef('Der Titel ist nicht änderbar',   schutz.titelZu, 'false');
pruef('Der Inhalt ist trotzdem zu sehen', schutz.bloecke > 0, true);

/* Der Knopf im Hinweis hebt sie auf. */
await p.evaluate(() => document.querySelector('#page .sperrhinweis [data-a="auf"]').click());
const auf = await p.evaluate((id) => ({
  imBestand: !!Store.getBlock(id).gesperrt,
  hinweis:   !!document.querySelector('#page .sperrhinweis'),
  titel:     document.getElementById('title').contentEditable
}), id1);
pruef('Der Knopf hebt die Sperre auf', auf.imBestand, false);
pruef('Der Hinweis verschwindet',      auf.hinweis, false);
pruef('Und der Titel geht wieder',     auf.titel, 'true');

/* ======================================================================== *
 * 5 · VERSCHLÜSSELT — nicht einmal zu sehen
 * Das ist die andere Sperre. Wer sie beim Umbauen mit `gesperrt` verwechselt,
 * gibt verschlüsselten Inhalt frei.
 * ======================================================================== */
console.log('\n--- Verschlüsselt (locked) ---');

await p.evaluate((id) => { Store.updateBlock(id, { locked: true }); App.zeichneSeite(); }, id1);
const zu = await p.evaluate(() => ({
  bloecke: document.querySelectorAll('#page .blk').length,
  tools:   document.querySelectorAll('#page .pg-tools').length,
  titel:   !!document.getElementById('title'),
  streifen: !!document.getElementById('rand-toc')
}));
pruef('Kein einziger Block ist gezeichnet', zu.bloecke, 0);
pruef('Auch keine Werkzeugzeile',           zu.tools, 0);
pruef('Der Titel steht aber noch da',       zu.titel, true);
pruef('Und kein Inhalts-Streifen',          zu.streifen, false);
await p.evaluate((id) => { Store.updateBlock(id, { locked: false }); App.zeichneSeite(); }, id1);

/* ======================================================================== *
 * 6 · DIE INHALTSFLÄCHE
 * ======================================================================== */
console.log('\n--- Die Blöcke ---');

const inhalt = await p.evaluate((id) => {
  const b1 = Store.addBlock(id, 'h1'); Store.updateBlock(b1.id, { text: 'Erste' });
  const b2 = Store.addBlock(id, 'text'); Store.updateBlock(b2.id, { text: 'Ein Absatz' });
  App.zeichneSeite();
  /* Der Text steht im `.ct`, nicht im Block selbst — davor sitzen die
     Greifer (＋ und ⋮⋮), die sonst im textContent mitkämen. */
  return {
    anzahl: document.querySelectorAll('#page .blk').length,
    texte:  [...document.querySelectorAll('#page .blk .ct')].map(c => c.textContent.trim()).filter(Boolean)
  };
}, id1);
pruef('Die Blöcke sind gezeichnet', inhalt.anzahl >= 2, true);
pruef('Mit ihrem Text',             inhalt.texte.includes('Ein Absatz'), true);
pruef('Und die Überschrift auch',   inhalt.texte.includes('Erste'), true);

/* Eine leere Seite bekommt von selbst einen Textblock — sonst hat man
   nichts, worin man tippen könnte. */
const leerId = await neueSeite({ text: 'Ganz leer' });
pruef('Eine leere Seite bekommt einen Block',
      await p.evaluate(() => document.querySelectorAll('#page .blk').length), 1);
pruef('Und der liegt auch im Bestand',
      await p.evaluate((id) => Store.childrenOf(id).length, leerId), 1);

/* ======================================================================== *
 * 7 · DER STREIFEN AM RECHTEN RAND
 * Ab drei Überschriften, darunter wäre er nur Zierde.
 * ======================================================================== */
console.log('\n--- Der Inhalts-Streifen ---');

await p.evaluate((id) => {
  App.oeffne(id);
  ['Eins', 'Zwei'].forEach(t => {
    const b = Store.addBlock(id, 'h2'); Store.updateBlock(b.id, { text: t });
  });
  App.zeichneSeite();
}, leerId);
pruef('Bei zwei Überschriften kein Streifen',
      await p.evaluate(() => !!document.getElementById('rand-toc')), false);

await p.evaluate((id) => {
  const b = Store.addBlock(id, 'h2'); Store.updateBlock(b.id, { text: 'Drei' });
  App.zeichneSeite();
}, leerId);
const streifen = await p.evaluate(() => ({
  da:     !!document.getElementById('rand-toc'),
  striche: document.querySelectorAll('#rand-toc button').length,
  namen:  [...document.querySelectorAll('#rand-toc span')].map(s => s.textContent)
}));
pruef('Ab drei schon',        streifen.da, true);
pruef('Ein Strich je Überschrift', streifen.striche, 3);
pruef('Mit den Namen dahinter',    streifen.namen, ['Eins', 'Zwei', 'Drei']);

/* Und er verschwindet wieder, wenn man die Seite wechselt. */
await p.evaluate((id) => { App.oeffne(id); App.zeichneSeite(); }, id1);
pruef('Auf einer kurzen Seite ist er wieder weg',
      await p.evaluate(() => !!document.getElementById('rand-toc')), false);

/* ======================================================================== *
 * 8 · BREITE, SCHRIFT, WERKZEUGZEILE
 * ======================================================================== */
console.log('\n--- Breite und Schrift ---');

await p.evaluate(() => document.querySelector('#page .pg-tools [data-a="wide"]').click());
const breit = await p.evaluate((id) => ({
  klasse:    document.getElementById('page').className,
  imBestand: !!Store.getBlock(id).wide,
  knopf:     document.querySelector('#page .pg-tools [data-a="wide"]').textContent
}), id1);
pruef('Volle Breite setzt die Klasse',    breit.klasse, 'wide');
pruef('Und merkt sie sich',               breit.imBestand, true);
pruef('Der Knopf bietet jetzt das Gegenteil an', breit.knopf.includes('Normale Breite'), true);
await p.evaluate(() => document.querySelector('#page .pg-tools [data-a="wide"]').click());
pruef('Und wieder zurück',
      await p.evaluate(() => document.getElementById('page').className), '');

await p.evaluate((id) => { Store.updateBlock(id, { font: 'serif', small: true }); App.zeichneSeite(); }, id1);
const schrift = await p.evaluate(() => ({
  font:  document.body.dataset.font,
  small: document.body.dataset.small
}));
pruef('Die Schrift steht am Körper',   schrift.font, 'serif');
pruef('Und der kleine Text auch',      schrift.small, '1');
await p.evaluate((id) => { Store.updateBlock(id, { font: 'default', small: false }); App.zeichneSeite(); }, id1);

/* Eine Seite ohne Werkzeuge bekommt keine Zeile. */
await p.evaluate((id) => { Store.updateBlock(id, { ohneTools: true }); App.zeichneSeite(); }, id1);
pruef('ohneTools heisst keine Werkzeugzeile',
      await p.evaluate(() => document.querySelectorAll('#page .pg-tools').length), 0);
await p.evaluate((id) => { Store.updateBlock(id, { ohneTools: false }); App.zeichneSeite(); }, id1);

/* ======================================================================== *
 * 9 · RÜCKVERWEISE UND SONDERSEITEN
 * ======================================================================== */
console.log('\n--- Fusszeile und Sonderseiten ---');

pruef('Unter der Seite stehen die Rückverweise',
      await p.evaluate(() => !!document.querySelector('#page .rueck, #page .backlinks, #page .fuss')), true);
await p.evaluate((id) => { Store.updateBlock(id, { ohneRueck: true }); App.zeichneSeite(); }, id1);
pruef('ohneRueck lässt sie weg',
      await p.evaluate(() => !!document.querySelector('#page .rueck, #page .backlinks, #page .fuss')), false);
await p.evaluate((id) => { Store.updateBlock(id, { ohneRueck: false }); App.zeichneSeite(); }, id1);

/* Eine Sonderseite ersetzt alles und schreibt ihren Titel in den Pfad. */
const sonder = await p.evaluate(() => {
  App.zeigeSonder('Eine Sonderseite', (wo) => {
    wo.innerHTML = '<div class="pruef-sonder">Inhalt von aussen</div>';
  });
  return {
    inhalt: !!document.querySelector('#page .pruef-sonder'),
    breit:  document.getElementById('page').className,
    krume:  document.getElementById('crumb').textContent.trim(),
    titel:  !!document.getElementById('title')
  };
});
pruef('Die Sonderseite zeichnet sich selbst', sonder.inhalt, true);
pruef('Sie ist immer breit',                  sonder.breit, 'wide');
pruef('Ihr Titel steht im Pfad',              sonder.krume, 'Eine Sonderseite');
pruef('Und es gibt keinen Seitentitel',       sonder.titel, false);

/* Zurück auf eine echte Seite. */
await p.evaluate((id) => { App.oeffne(id); }, id1);
await p.waitForTimeout(200);
pruef('Eine echte Seite verdrängt die Sonderseite',
      await p.evaluate(() => !!document.getElementById('title')), true);

/* ======================================================================== *
 * 10 · OHNE APP
 * Derselbe Nachweis wie bei der Seitenleiste: die beiden Dateien dürfen `App`
 * nicht kennen. Sonst ist die Aufteilung nur eine neue Datei und keine neue
 * Grenze — und `schale.js` bliebe die Datei, die man für alles aufmachen muss.
 * ======================================================================== */
console.log('\n--- Ohne App ---');

pruef('Die Kopfleiste steht als eigener Name',
      await p.evaluate(() => typeof Kopfleiste !== 'undefined'), true);
pruef('Die Inhaltsfläche auch',
      await p.evaluate(() => typeof Inhaltsflaeche !== 'undefined'), true);
pruef('Und App setzt sie nur zusammen',
      await p.evaluate(() => typeof App.zeichneSeite === 'function'), true);

const nurCode = (text) => text
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .replace(/(^|[^:])\/\/[^\n]*/g, '$1 ')
  .replace(/'(?:[^'\\]|\\.)*'/g, "''")
  .replace(/"(?:[^"\\]|\\.)*"/g, '""')
  .replace(/`(?:[^`\\]|\\.)*`/g, '``');

for (const datei of ['kopfleiste.js', 'inhaltsflaeche.js']) {
  const quelle = nurCode(fs.readFileSync(
    path.join(WURZELORDNER, 'quell/schale/aufbau', datei), 'utf8'));
  pruef(datei + ' ruft App an keiner Stelle', /\bApp\s*\./.test(quelle), false);
}
pruef('Und die Prüfung würde es merken',
      /\bApp\s*\./.test(nurCode('x = App.zeichneSeite()')), true);

/* Der Kopf zeichnet sich mit Attrappen — und sagt bei einer verschlüsselten
   Seite `false`. Dieser Rückgabewert ist die Sperre; wer ihn übersieht, zeigt
   verschlüsselten Inhalt an. */
const ohneApp = await p.evaluate(() => {
  Kopfleiste.binde({
    zeichneSeite: () => {}, zeichneBaum: () => {}, kiPanel: () => {},
    oeffne: () => {}, aktuelleSeite: () => null, sonder: () => null
  });
  const kasten = document.createElement('div');
  const offen = Kopfleiste.zeichne(kasten, { id: 'x', text: 'Attrappe', icon: '🧪' });
  const kasten2 = document.createElement('div');
  const zu = Kopfleiste.zeichne(kasten2, { id: 'y', text: 'Geheim', locked: true });
  return {
    offen, teile: [...kasten.children].map(e => e.id ? '#' + e.id : e.className),
    zu, zuTeile: [...kasten2.children].map(e => e.id ? '#' + e.id : e.className)
  };
});
pruef('Der Kopf entsteht ohne App',        ohneApp.teile, ['pg-icon', '#title', 'pg-tools']);
pruef('Und sagt: es geht weiter',          ohneApp.offen, true);
pruef('Bei verschlüsselt sagt er: Schluss', ohneApp.zu, false);
pruef('Und hängt keine Werkzeugzeile an',
      ohneApp.zuTeile.includes('pg-tools'), false);

/* Und wieder die echten Teile, damit die App danach normal weiterläuft. */
await p.evaluate(() => {
  Kopfleiste.binde({
    zeichneSeite: App.zeichneSeite, zeichneBaum: Seitenleiste.zeichne,
    kiPanel: App.kiPanel, oeffne: App.oeffne, aktuelleSeite: App.aktuelleSeite,
    sonder: () => null
  });
  App.zeichneSeite();
});
pruef('Mit den echten Teilen läuft sie weiter',
      await p.evaluate(() => !!document.getElementById('title')), true);

/* ======================================================================== */
console.log(`\n${ok}/${ok + bad} bestanden`);
console.log(fehler.length ? 'JS-Fehler:\n' + fehler.join('\n') : 'Keine JS-Fehler.');

await browser.close();
await new Promise(r => dateien.close(r));
process.exit(bad || fehler.length ? 1 : 0);
