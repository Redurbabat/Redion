/* Suite 195 — Die Abfragesprache der Suche (L23, E175)
 * ============================================================================
 * L23 stand als einzeiliger Wunsch in den Lücken: „Suche über Titel, Inhalt,
 * Zeilen und Kennungen mit einfacher Syntax."
 *
 * Beim Nachsehen ist sie GEBAUT — `src/kern/suche/query.ts`, 406 Zeilen, mit
 * neun Suchbefehlen, Anführungszeichen für genaue Treffer, Erkennung
 * widersprüchlicher Angaben und Fehlermeldungen in Worten statt null
 * Treffern.
 *
 * Und kein einziger Prüflauf nennt sie. Das ist die gefährlichere Hälfte:
 * Code, der fertig aussieht und den nie jemand ausgeführt hat, ist bei
 * E122 schon einmal aufgefallen — dort waren die Einstiegspunkte gar nicht
 * erreichbar, und niemand hatte es gemerkt.
 *
 * Diese Suite fährt die Sprache über das ECHTE SUCHFENSTER ab. Nicht
 * `QueryLanguage.parse` direkt: das prüfte den Parser und liesse die
 * Verdrahtung offen (E93).
 *
 *   node pruefungen/lauf/test229.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8986;

const TYP: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.json': 'application/json', '.mjs': 'text/javascript',
  '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon'
};
const server = http.createServer((a: IncomingMessage, b: ServerResponse) => {
  const rein = decodeURIComponent((a.url ?? '/').split('?')[0] ?? '/');
  const pfad = path.join(WURZEL, rein === '/' ? 'index.html' : rein.slice(1));
  if (!pfad.startsWith(WURZEL) || !fs.existsSync(pfad) || fs.statSync(pfad).isDirectory()) {
    b.writeHead(404); b.end(); return;
  }
  b.writeHead(200, { 'Content-Type': TYP[path.extname(pfad)] ?? 'application/octet-stream' });
  b.end(fs.readFileSync(pfad));
});
await new Promise<void>(f => { server.listen(PORT, () => f()); });

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll),
    `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

const browser = await chromium.launch();
const seite = await browser.newPage();
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 120)));
await seite.setViewportSize({ width: 1300, height: 900 });
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForTimeout(2400);
await seite.evaluate(() => {
  Store.setMeta('rundgangGesehen', true);
  document.getElementById('rg-willkommen')?.remove();
  document.querySelector('.produkt-onboarding-lage')?.remove();
  document.getElementById('rg-einladung')?.remove();
});

/* --- Ein Bestand, an dem sich jeder Suchbefehl zeigen lässt -------------- */
const bestand = await seite.evaluate(async () => {
  const warte = (ms: number) => new Promise(r => setTimeout(r, ms));
  const projekt = Store.addPage(null, { text: 'Projekt Redion' });
  Store.kinderLeeren(projekt.id);
  Store.addBlock(projekt.id, 'text', { text: 'Hier steht etwas über Zebras #arbeit' });

  const privat = Store.addPage(null, { text: 'Privates Zebra' });
  Store.kinderLeeren(privat.id);
  Store.addBlock(privat.id, 'text', { text: 'Nichts von Bedeutung' });

  const unter = Store.addPage(projekt.id, { text: 'Unterseite im Projekt' });
  Store.kinderLeeren(unter.id);

  /* Eine Datenbank mit einer Zeile — für `typ:zeile` und `status:`. */
  const { collectionId } = Store.addDatabase(projekt.id, 'Aufgabenliste', null, 'table');
  const coll = Store.getCollection(collectionId);
  const statusKey = Object.keys(coll.schema).find(k => coll.schema[k].type === 'select') || '';
  /* `addRow` liest `props.title`, nicht `props.text` — der Titel einer Zeile
     ist ihre Titelspalte. Mit `text` bekam die Zeile einen leeren Titel, und
     `typ:zeile` fand sie zu Recht nicht. Nachgesehen in `addRow`. */
  const zeile = Store.addRow(collectionId, { title: 'Zebrastreifen malen' });
  if (statusKey) Store.setProp(zeile.id, statusKey, 'Offen');
  await Store.flush();
  await warte(300);
  return { projekt: projekt.id, privat: privat.id, unter: unter.id,
           zeile: zeile.id, statusKey, coll: collectionId };
});

/* Ein Griff, der das echte Suchfenster öffnet, tippt und die Titel liest. */
const frage = async (text: string): Promise<{ titel: string[]; fehler: string }> => {
  await seite.evaluate(() => document.querySelector('.overlay')?.remove());
  await seite.evaluate(() => { App.suche(); });
  await seite.waitForSelector('#q', { timeout: 8000 });
  await seite.fill('#q', text);
  await seite.waitForTimeout(400);
  return seite.evaluate(() => {
    const o = document.querySelector('.overlay');
    /* Ein Treffer ist ein `button[data-i]`; darin steht der Titel im ersten
       inneren `span` des mittleren Feldes. Nachgesehen in `zeichne()`, nicht
       geraten — die erste Fassung dieser Prüfung las `.f-item` und bekam
       für JEDE Frage eine leere Liste. Vierzehn rote Punkte, und keiner
       davon lag am geprüften Code. */
    const titel = [...(o?.querySelectorAll('button[data-i]') || [])]
      .map(b => (b.querySelectorAll('span')[1]?.querySelector('span')?.textContent || '').trim())
      .filter(Boolean);
    const meldung = (o?.querySelector('[data-query-error] span')?.textContent || '').trim();
    return { titel, fehler: meldung };
  });
};

/* ==========================================================================
 * §1 · Erst einmal: was zeigt das Fenster überhaupt an
 * --------------------------------------------------------------------------
 * Bevor irgendeine Behauptung über Suchbefehle Sinn ergibt, muss klar sein,
 * WORAN sie gemessen wird. Sonst misst man leere Listen gegen leere Listen
 * und alles ist grün.
 * ========================================================================*/
console.log('\n1 · Was das Fenster anzeigt');

const zebra = await frage('Zebra');
p('Eine gewöhnliche Suche findet überhaupt etwas', zebra.titel.length > 0,
  JSON.stringify(zebra.titel).slice(0, 200));
p('Und darunter ist die Seite mit dem Wort im Titel',
  zebra.titel.some(t => /Privates Zebra/.test(t)), JSON.stringify(zebra.titel).slice(0, 200));

const nichts = await frage('Nashorn');
gleich('Und was es nicht gibt, findet sie nicht', nichts.titel.length, 0);

/* ==========================================================================
 * §2 · Die Suchbefehle, einer nach dem anderen
 * ========================================================================*/
console.log('\n2 · Die Suchbefehle');

const nurTitel = await frage('titel:Zebra');
p('`titel:` sucht nur im Titel',
  nurTitel.titel.some(t => /Privates Zebra/.test(t)) &&
  !nurTitel.titel.some(t => /Projekt Redion/.test(t)),
  JSON.stringify(nurTitel.titel).slice(0, 200));

const nurInhalt = await frage('inhalt:Zebras');
p('`inhalt:` sucht nur im Inhalt',
  nurInhalt.titel.some(t => /Projekt Redion/.test(t)),
  JSON.stringify(nurInhalt.titel).slice(0, 200));

const nachTag = await frage('tag:arbeit');
p('`tag:` findet ein Schlagwort aus dem Text',
  nachTag.titel.length > 0, JSON.stringify(nachTag.titel).slice(0, 200));

const nurZeilen = await frage('typ:zeile Zebrastreifen');
p('`typ:zeile` findet die Datenbankzeile',
  nurZeilen.titel.some(t => /Zebrastreifen/.test(t)),
  JSON.stringify(nurZeilen.titel).slice(0, 200));

const nurSeiten = await frage('typ:seite Zebra');
p('`typ:seite` lässt die Zeile weg',
  !nurSeiten.titel.some(t => /Zebrastreifen/.test(t)),
  JSON.stringify(nurSeiten.titel).slice(0, 200));

const heute = await frage('geändert:heute Zebra');
p('`geändert:heute` findet, was eben angelegt wurde',
  heute.titel.length > 0, JSON.stringify(heute.titel).slice(0, 200));

const genau = await frage('"Privates Zebra"');
p('Anführungszeichen suchen die genaue Wendung',
  genau.titel.some(t => /Privates Zebra/.test(t)),
  JSON.stringify(genau.titel).slice(0, 200));

/* ==========================================================================
 * §3 · Und ein Fehler sieht nicht aus wie null Treffer
 * --------------------------------------------------------------------------
 * DAS IST DER PUNKT, DEN DIE SPRACHE ÜBERHAUPT ERST RECHTFERTIGT. Wer
 * `tiitel:Projekt` tippt, bekommt ohne sie eine leere Liste und glaubt, es
 * gebe die Seite nicht.
 * ========================================================================*/
console.log('\n3 · Ein Fehler sieht nicht aus wie null Treffer');

const vertippt = await frage('tiitel:Projekt');
p('Ein unbekannter Suchbefehl wird benannt',
  /kein Suchbefehl/.test(vertippt.fehler), vertippt.fehler || '(keine Meldung)');
p('Und die Meldung sagt, was erlaubt wäre',
  /titel/.test(vertippt.fehler), vertippt.fehler || '(keine Meldung)');

const ohneWert = await frage('titel:');
p('Ein Suchbefehl ohne Wert wird benannt',
  /fehlt ein Wert/.test(ohneWert.fehler), ohneWert.fehler || '(keine Meldung)');

const widerspruch = await frage('typ:seite typ:zeile Zebra');
p('Zwei widersprüchliche Typen werden benannt',
  /widersprüchlich/.test(widerspruch.fehler), widerspruch.fehler || '(keine Meldung)');

const falscherTyp = await frage('typ:elefant');
p('Ein unbekannter Typ wird benannt',
  /ist kein Typ/.test(falscherTyp.fehler), falscherTyp.fehler || '(keine Meldung)');

/* ==========================================================================
 * §4 · Und die Kennung, die L23 ausdrücklich nennt
 * --------------------------------------------------------------------------
 * „Suche über Titel, Inhalt, Zeilen und KENNUNGEN". `Store.search` kann das
 * seit Langem — es schneidet die Kennung sogar aus einer ganzen Adresse
 * heraus. Ob das Suchfenster denselben Weg geht, ist eine andere Frage: es
 * läuft über `QueryLanguage.run`, und dort steht kein Kennungszweig.
 * ========================================================================*/
console.log('\n4 · Und die Kennung');

const perId = await frage(bestand.privat);
p('Der Store findet eine Seite über ihre Kennung',
  (await seite.evaluate((id: string) => Store.search(id).length, bestand.privat)) > 0);
p('Und das Suchfenster tut es auch',
  perId.titel.some(t => /Privates Zebra/.test(t)),
  JSON.stringify(perId.titel).slice(0, 200) + ' · ' + perId.fehler);

/* Und die Form, in der eine Kennung wirklich unterwegs ist: als ganze
   Adresse. Strg + Umschalt + C legt sie so in die Zwischenablage, und wer
   sie sucht, fügt sie so ein (E105). */
const perAdresse = await frage('http://localhost:' + PORT + '/index.html#block=' + bestand.privat);
p('Auch eine ganze Blockadresse wird verstanden',
  perAdresse.titel.some(t => /Privates Zebra/.test(t)),
  JSON.stringify(perAdresse.titel).slice(0, 200));

/* UND DIE GEGENRICHTUNG, und sie ist die schwierigere.
   Der Kennungszweig geht an der Abfragesprache VORBEI — samt ihrer Filter.
   Er darf deshalb nur greifen, wenn `Store.search` wirklich über die Kennung
   gefunden hat (`treffer === 'Seiten-ID'`), nicht schon, wenn der Text
   zufällig wie eine Kennung aussieht.

   GEMESSEN WIRD DAS AM FILTER, nicht am Treffer. Ein Wort, das nur im
   INHALT steht, darf bei „nur Titel" nicht erscheinen. Fängt der Zweig die
   Suche ab, kennt sie diesen Filter nicht und zeigt die Seite trotzdem —
   und genau das wäre stumm falsch.

   Der erste Anlauf hier prüfte, ob das Wort überhaupt gefunden wird. Das
   war keine Prüfung: `Store.search` findet es in JEDER Fehlerform ebenfalls,
   der Punkt konnte gar nicht rot werden (§55.2). */
await seite.evaluate(async () => {
  const s = Store.addPage(null, { text: 'Seite mit Zahlenwort' });
  Store.kinderLeeren(s.id);
  Store.addBlock(s.id, 'text', { text: 'Im Inhalt steht abcdef12-3456 und sonst nichts' });
  await Store.flush();
});
const nurTitelFilter = await seite.evaluate(async () => {
  document.querySelector('.overlay')?.remove();
  App.suche();
  await new Promise(r => setTimeout(r, 300));
  const feld = document.getElementById('q') as HTMLInputElement;
  const wo = document.getElementById('f-wo') as HTMLSelectElement;
  wo.value = 'titel';
  wo.dispatchEvent(new Event('change', { bubbles: true }));
  feld.value = 'abcdef12-3456';
  feld.dispatchEvent(new Event('input', { bubbles: true }));
  await new Promise(r => setTimeout(r, 400));
  return [...document.querySelectorAll('.overlay button[data-i]')]
    .map(b => (b.querySelectorAll('span')[1]?.querySelector('span')?.textContent || '').trim());
});
gleich('Bei „nur Titel" bleibt ein Wort aus dem Inhalt draussen',
  nurTitelFilter, []);

p('Keine Fehler auf der Seite', fehler.length === 0, fehler.join(' | '));

await browser.close();
server.close();
console.log(`\n${ok} bestanden, ${weg} durchgefallen`);
process.exit(weg ? 1 : 0);
