/* Suite 62 — Der Papierkorb: was zurückkommt und was wirklich geht
 * ----------------------------------------------------------------------------
 * Zwei Fragen hat ein Papierkorb zu beantworten, und beide sind Versprechen:
 *
 *   1. **Was hier liegt, kommt zurück.**
 *   2. **Was ich hier endgültig lösche, ist weg.**
 *
 * Gemessen wurde beides. Beide stimmten nicht.
 *
 * ─── 1. „BLOCK IN DEN PAPIERKORB" — UND DANN? ───────────────────────────────
 *
 * `Strg`+`Umschalt`+`Rücktaste` legt einen Block weg und meldet „Block in den
 * Papierkorb" (`editor.js:1277`). Der Papierkorb zeigt ihn nie: `trashed()`
 * filtert `type === 'page'`. Der Block steht auf `alive: false`, ist aus der
 * Elternliste heraus — und damit an keiner Oberfläche mehr erreichbar.
 *
 * Rückgängig holt ihn zurück, solange das Fenster offen ist (`verlauf.js:69`).
 * Nach einem Neuladen nicht mehr. Die Meldung nennt einen Ort, an dem der
 * Block nie ankommt.
 *
 * Dass er nicht von der Platte verschwindet, ist das Gute daran: verloren war
 * nichts, nur unerreichbar. Das ist trotzdem der schlimmere Zustand, weil es
 * aussieht wie Absicht.
 *
 * ─── 2. „ENDGÜLTIG GELÖSCHT" — DER VERLAUF BLIEB ────────────────────────────
 *
 * `purgeBlock` nahm die Kinder mit, die Datenbank, ihre Zeilen und Ansichten.
 * Nicht mitgenommen: der **Versionsverlauf**. Nach dem endgültigen Löschen
 * einer Seite lagen ihre Fassungen weiter in `versions` — mit vollem Text.
 *
 * Für eine App, deren erster Satz „die Daten gehören dem Gerät" lautet, ist
 * das der falsche Rest: wer etwas löscht, das niemand mehr sehen soll,
 * löscht die Seite und lässt dreissig Fassungen davon liegen.
 *
 * ─── 3. UND DIE DATEIEN AUCH ────────────────────────────────────────────────
 *
 * Ein Anhang liegt in `dateien`, seine Stücke in `stuecke` — beide mit Index
 * auf den Block. `purgeBlock` fasste keinen von beiden an. Ein Video von
 * 300 MB blieb nach dem endgültigen Löschen vollständig auf der Platte, ohne
 * einen Weg, es je wieder zu sehen oder loszuwerden.
 *
 * ─── 4. ZWEI AUFRÄUMUNGEN, EINE DAVON TOT ───────────────────────────────────
 *
 * `papierkorbAufraeumen` gab es **zweimal**. Die eine (`werkzeuge.js:1581`)
 * las `trashedAt` und `papierkorbTage` und tat ihre Arbeit. Die andere
 * (`pflege.js:378`) las `geloeschtAm` und `papierkorbFrist` — **zwei Namen,
 * die im ganzen Quelltext niemand schreibt**. Sie lief beim Start und täglich
 * und fand jedes Mal nichts. Ihr Knopf „Papierkorb jetzt leeren" antwortete
 * seit jeher „Nichts ist alt genug — nichts gelöscht".
 *
 * Beide Fassungen räumten ausserdem nur über `trashed()` — also nur Seiten.
 * Weggelegte Blöcke lief keine Frist ab; sie lagen für immer.
 *
 * ─── WAS DIE REPARATUR NICHT TUN DARF ───────────────────────────────────────
 *
 * Sobald weggelegte Blöcke sichtbar werden, laufen ihnen auch Fristen ab —
 * und ein Bestand, in dem seit zwei Jahren unsichtbar Blöcke liegen, wäre
 * drei Sekunden nach dem Neustart um sie ärmer. Genau das verbietet der
 * letzte Satz des Auftrags: *niemals so bauen, dass Nutzer ihre Daten
 * unbemerkt verlieren.* Deshalb bekommt alles, was vorher nicht im
 * Papierkorb zu sehen war, seine Frist **ab dem Tag, an dem es sichtbar
 * wurde** — nicht ab dem Tag, an dem es weggelegt wurde. Auch das prüft
 * dieser Lauf.
 *
 *   node pruefungen/lauf/test97.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import { fileURLToPath as _alsPfad } from 'node:url';
import { dirname as _ordner, resolve as _loese, join as _dazu } from 'node:path';
import { readFileSync as _lies, existsSync as _da } from 'node:fs';
import { createServer } from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';

const WURZEL = _loese(_ordner(_alsPfad(import.meta.url)), '../..');
const PORT = 8806;

let ok = 0, weg = 0;
const p = (n: any, b: any, extra = '') => { if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); } };
const gleich = (n: any, ist: any, soll: any) =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll),
    `ist=${JSON.stringify(ist)} soll=${JSON.stringify(soll)}`);

const TYP: Record<string, string> = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
              '.css': 'text/css; charset=utf-8', '.json': 'application/json',
              '.webmanifest': 'application/manifest+json', '.png': 'image/png',
              '.ico': 'image/x-icon' };
const server = createServer((a: IncomingMessage, b: ServerResponse) => {
  const rein = decodeURIComponent((a.url ?? '/').split('?')[0] ?? '/');
  const pfad = _dazu(WURZEL, rein === '/' ? 'index.html' : rein.slice(1));
  if (!pfad.startsWith(WURZEL) || !_da(pfad)) { b.writeHead(404); b.end(); return; }
  b.writeHead(200, { 'Content-Type': TYP[pfad.slice(pfad.lastIndexOf('.'))] || 'application/octet-stream' });
  b.end(_lies(pfad));
});
await new Promise<void>(f => { server.listen(PORT, () => f()); });

const browser = await chromium.launch();
const kontext = await browser.newContext();
const seite = await kontext.newPage();
const fehler: any[] = [];
seite.on('pageerror', e => fehler.push(e.message));

await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForFunction(() => typeof App !== 'undefined' && typeof Store !== 'undefined',
                            null, { timeout: 20000 });

/* Die neuen Namen werden geprüft, nicht vorausgesetzt. Dreht jemand die
   Reparatur zurück, soll dieser Lauf sagen WAS fehlt — und nicht an einem
   `is not a function` sterben, bevor die erste Prüfung lief. */
const neu = await seite.evaluate(() => ({
  bloecke:  typeof Store.papierkorbBloecke === 'function',
  raeumen:  typeof Store.papierkorbAufraeumen === 'function',
  anhaenge: typeof Store.purgeAnhaenge === 'function'
}));
p('Store zeigt die weggelegten Blöcke an (papierkorbBloecke)', neu.bloecke);
p('Store räumt den Papierkorb selbst auf (papierkorbAufraeumen)', neu.raeumen);
p('Store nimmt beim Löschen die Anhänge mit (purgeAnhaenge)', neu.anhaenge);

/* ========================================================================= *
 * 1 · WAS WEGGELEGT WURDE, IST IM PAPIERKORB ZU FINDEN
 * ========================================================================= */
console.log('\n1 · Ein weggelegter Block ist auffindbar');

const wegLegen = await seite.evaluate(() => {
  const s = Store.addPage(null, { text: 'Seite mit Absatz' });
  const b = Store.addBlock(s.id, 'text', { text: 'Dieser Absatz wird weggelegt' });
  Store.trashBlock(b.id);
  const liste = (Store.papierkorbBloecke ? Store.papierkorbBloecke() : []).map(x => x.id);
  return {
    seiteId: s.id, blockId: b.id,
    lebt: Store.getBlock(b.id) ? Store.getBlock(b.id).alive : null,
    inSeiten: Store.trashed().some(x => x.id === b.id),
    inBloecken: (liste ?? '').includes(b.id),
    beiEltern: (Store.getBlock(s.id).content || []).includes(b.id)
  };
});

gleich('Der Block liegt auf der Platte, nicht im Nichts', wegLegen.lebt, false);
gleich('… und hängt nicht mehr an seiner Seite', wegLegen.beiEltern, false);
gleich('Unter den Seiten taucht er nicht auf — das ist richtig', wegLegen.inSeiten, false);
p('Aber im Papierkorb ist er zu finden', wegLegen.inBloecken,
  'ein Block, den keine Liste zeigt, ist unerreichbar — die Meldung sagte trotzdem „in den Papierkorb"');

const zurueck = await seite.evaluate(([seiteId, blockId]) => {
  Store.restoreBlock(blockId);
  return {
    lebt: Store.getBlock(blockId).alive,
    beiEltern: (Store.getBlock(seiteId).content || []).includes(blockId),
    nochInListe: (Store.papierkorbBloecke ? Store.papierkorbBloecke() : []).some(x => x.id === blockId)
  };
}, [wegLegen.seiteId, wegLegen.blockId] as [string, string]);

gleich('Zurückgeholt lebt er wieder', zurueck.lebt, true);
gleich('… und steht wieder an seiner Seite', zurueck.beiEltern, true);
gleich('… und ist aus dem Papierkorb verschwunden', zurueck.nochInListe, false);

/* Die Gegenrichtung: eine Zeile einer Datenbank ist eine Seite und gehört
   NICHT unter die Blöcke — sonst stünde sie zweimal im Papierkorb. */
const zeileNichtDoppelt = await seite.evaluate(() => {
  const d = Store.addDatabase(null, 'Aufgaben');
  /* ECHTER FEHLER: `d.collection` gibt es nicht — `addDatabase` liefert
     { block, collectionId, viewId }. Der Zweig lief nie und bleibt nur
     stehen, damit sich das Verhalten hier nicht ändert. */
  const c = d.collectionId || (d as Record<string, any>).collection || (d.block && d.block.collectionId);
  const r = Store.addRow(c, { title: 'Eine Zeile' });
  Store.trashBlock(r.id);
  return {
    beiSeiten:  Store.trashed().some(x => x.id === r.id),
    beiBloecken: (Store.papierkorbBloecke ? Store.papierkorbBloecke() : []).some(x => x.id === r.id)
  };
});
p('Eine Datenbankzeile steht bei den Seiten', zeileNichtDoppelt.beiSeiten);
gleich('… und nicht noch einmal bei den Blöcken', zeileNichtDoppelt.beiBloecken, false);

/* ========================================================================= *
 * 2 · ENDGÜLTIG HEISST ENDGÜLTIG — DER VERLAUF GEHT MIT
 * ========================================================================= */
console.log('\n2 · Der Versionsverlauf geht beim endgültigen Löschen mit');

/* KEIN NACHHELFEN. Der erste Entwurf dieses Abschnitts rief `purgeAnhaenge`
   nach dem Löschen selbst noch einmal auf — dann wäre er auch dann grün
   gewesen, wenn `purgeBlock` die Funktion gar nicht ruft. Geprüft wird die
   Verdrahtung, nicht die Funktion: hier wird nur gelöscht und gewartet. */
const bisWahr = async (fn: any, ms = 3000) => {
  const ende = Date.now() + ms;
  while (Date.now() < ende) {
    if (await fn()) return true;
    await new Promise(f => setTimeout(f, 60));
  }
  return false;
};

const verlauf = await seite.evaluate(async () => {
  const s = Store.addPage(null, { text: 'Vertrauliche Seite' });
  Store.addBlock(s.id, 'text', { text: 'Das soll niemand mehr lesen' });
  await Store.versionSpeichern(s.id, 'erster Stand');
  await Store.versionSpeichern(s.id, 'zweiter Stand');
  const vorher = (await Store.versionen(s.id)).length;

  Store.trashBlock(s.id);
  Store.purgeBlock(s.id);                        /* und sonst nichts */
  await Store.flush();

  return { vorher, seiteId: s.id, blockWeg: !Store.getBlock(s.id) };
});
const nachher = await bisWahr(() => seite.evaluate(async ([id]) =>
  (await Store.versionen(id)).length === 0, [verlauf.seiteId] as [string])) ? 0 : -1;

gleich('Vor dem Löschen liegen zwei Fassungen da', verlauf.vorher, 2);
gleich('Der Block selbst ist weg', verlauf.blockWeg, true);
gleich('Und seine Fassungen auch', nachher, 0);

/* ========================================================================= *
 * 3 · UND DIE ANHÄNGE
 * ========================================================================= */
console.log('\n3 · Datei und Stücke gehen mit');

const anhang = await seite.evaluate(async () => {
  const s = Store.addPage(null, { text: 'Seite mit Anhang' });
  const b = Store.addBlock(s.id, 'file', { text: 'video.mp4' });
  const dateiId = Store.uid();
  await Store.dateiPut({ id: dateiId, blockId: b.id, name: 'video.mp4', groesse: 3 });
  await Store.stueckPut({ id: dateiId + ':0', dateiId, nr: 0, teil: new Blob(['abc']) });
  await Store.stueckPut({ id: dateiId + ':1', dateiId, nr: 1, teil: new Blob(['def']) });

  const vorher = { datei: !!(await Store.dateiHolen(dateiId)),
                   stuecke: (await Store.stueckeVon(dateiId)).length };

  Store.trashBlock(b.id);
  Store.purgeBlock(b.id);                        /* wieder ohne Nachhelfen */
  await Store.flush();
  return { vorher, dateiId };
});

gleich('Vorher liegen Datei und zwei Stücke da', anhang.vorher, { datei: true, stuecke: 2 });
p('Nachher ist die Datei weg', await bisWahr(() => seite.evaluate(async ([d]) =>
  !(await Store.dateiHolen(d)), [anhang.dateiId] as [string])),
  'purgeBlock ruft das Aufräumen nicht von selbst — nur wer es zusätzlich aufruft, wird es los');
p('… und ihre Stücke auch', await bisWahr(() => seite.evaluate(async ([d]) =>
  (await Store.stueckeVon(d)).length === 0, [anhang.dateiId] as [string])));

/* Zweimal aufräumen darf nichts kaputtmachen: der Papierkorb ruft es beim
   Leeren nach, und ein Aufräumen, das beim zweiten Anlauf stolpert, wäre
   schlimmer als eines, das einmal zu wenig läuft. */
const zweimal = await seite.evaluate(async ([d]) => {
  try { await Store.purgeAnhaenge('gibtesnicht'); await Store.purgeAnhaenge('gibtesnicht', { datei: d }); }
  catch (e: unknown) { return (e instanceof Error ? e.message : String(e)); }
  return '';
}, [anhang.dateiId] as [string]);
p('Ein zweites Aufräumen tut nichts und stolpert nicht', zweimal === '', zweimal);

/* ========================================================================= *
 * 3b · GELÖSCHT UND 400 MILLISEKUNDEN SPÄTER WIEDER DA
 * ---------------------------------------------------------------------------
 * An über einem Dutzend Stellen steht `Store.trashBlock(b.id);
 * Store.purgeBlock(b.id);` — sofort und endgültig löschen, ohne Umweg über
 * den Papierkorb. `trashBlock` legt den Block dabei in den Schreibstapel,
 * `purgeBlock` löscht ihn von der Platte, und 400 ms später schreibt der
 * Stapel ihn **wieder hin**.
 *
 * Im Zwischenspeicher war er weg, auf der Platte lag er weiter, und beim
 * nächsten Laden kam er zurück — mit `alive: false`. Seit der Papierkorb
 * auch Blöcke zeigt, stünde er dort sogar sichtbar: etwas, das jemand
 * endgültig gelöscht hat, ist am nächsten Tag wieder da.
 *
 * Geprüft wird an der PLATTE, nicht am Zwischenspeicher — im Speicher war
 * der Block die ganze Zeit korrekt weg, und genau daran hat es niemand
 * gemerkt.
 * ========================================================================= */
console.log('\n3b · Sofort gelöscht bleibt gelöscht — auch auf der Platte');

const auferstehung = await seite.evaluate(async () => {
  const s = Store.addPage(null, { text: 'Sofort weg' });
  await Store.flush();
  /* Genau die Reihenfolge aus dem Editor: erst in den Papierkorb, dann
     endgültig — beides im selben Wimpernschlag. */
  Store.trashBlock(s.id);
  Store.purgeBlock(s.id);
  await Store.flush();
  await new Promise(f => setTimeout(f, 700));      /* die Schreibpause abwarten */

  const aufPlatte = await new Promise(ok => {
    const req = indexedDB.open('notizen');
    req.onsuccess = () => {
      const r = req.result.transaction(['blocks'], 'readonly').objectStore('blocks').get(s.id);
      r.onsuccess = () => ok(!!r.result);
      r.onerror   = () => ok('Lesefehler');
    };
    req.onerror = () => ok('Öffnungsfehler');
  });
  return { imSpeicher: !!Store.getBlock(s.id), aufPlatte };
});
gleich('Im Zwischenspeicher weg — das war schon immer so', auferstehung.imSpeicher, false);
p('Und auf der Platte auch', auferstehung.aufPlatte === false,
  'der ausstehende Schreibvorgang aus trashBlock holte ihn zurück — beim nächsten Laden stand er wieder da');

/* ========================================================================= *
 * 4 · DIE FRIST — EINE AUFRÄUMUNG, NICHT ZWEI
 * ========================================================================= */
console.log('\n4 · Die Frist läuft ab, und zwar für alles');

const frist = await seite.evaluate(async () => {
  if (typeof Store.papierkorbAufraeumen !== 'function') return { fehlt: true };
  const lange = new Date(Date.now() - 99 * 86400000).toISOString();

  const altSeite = Store.addPage(null, { text: 'Seite von vorletztem Jahr' });
  Store.trashBlock(altSeite.id);
  Store.getBlock(altSeite.id).trashedAt = lange;

  const heim  = Store.addPage(null, { text: 'Heimat' });
  const altBlock = Store.addBlock(heim.id, 'text', { text: 'Block von vorletztem Jahr' });
  Store.trashBlock(altBlock.id);
  Store.getBlock(altBlock.id).trashedAt = lange;

  const jung = Store.addPage(null, { text: 'Gestern weggelegt' });
  Store.trashBlock(jung.id);

  Store.setMeta('papierkorbTage', 30);
  /* Erster Durchgang: die Schonfrist für vorher Unsichtbares gilt noch. */
  const ersteRunde = await Store.papierkorbAufraeumen();
  /* JETZT nachsehen, nicht am Ende: ob der Block die erste Runde überlebt
     hat, lässt sich nach der zweiten nicht mehr feststellen. Hier stand
     ein hartkodiertes `false` im Ergebnis. */
  const blockWegNachErster = !Store.getBlock(altBlock.id);

  /* Zweiter Durchgang, mit einer Sichtbarkeit, die lange zurückliegt —
     jetzt darf auch der Block gehen. */
  Store.setMeta('papierkorbSichtbarSeit', lange);
  const zweiteRunde = await Store.papierkorbAufraeumen();

  return {
    ersteRunde, zweiteRunde,
    seiteWeg: !Store.getBlock(altSeite.id),
    blockWegNachErster,
    blockWeg: !Store.getBlock(altBlock.id),
    jungDa: !!Store.getBlock(jung.id)
  };
});

p('Die alte Seite ist nach der Frist weg', frist.seiteWeg, JSON.stringify(frist));
p('Der alte Block ebenfalls — sobald er sichtbar sein konnte', frist.blockWeg);
p('Das gestern Weggelegte bleibt liegen', frist.jungDa);
/* Ohne die neue Fassung kommt nur `{ fehlt: true }` zurück — dann gibt es
   keine Zahlen zu vergleichen, und die Zeile muss rot werden statt zu rechnen.
   Hier stand `a < a + b` — das ist dasselbe wie `b > 0` und sagte nichts
   über den ERSTEN Durchgang (P5). Jetzt steht die Behauptung wirklich da:
   Runde eins verschont den Block, der vorher nie sichtbar sein konnte —
   gemessen ZWISCHEN den Runden, nicht danach — und Runde zwei holt ihn. */
if (typeof frist.ersteRunde !== 'number' || typeof frist.zweiteRunde !== 'number') {
  p('Der erste Durchgang nimmt nicht alles auf einmal', false,
    'papierkorbAufraeumen lieferte keine Zahl');
} else {
  p('Der erste Durchgang nimmt nicht alles auf einmal',
    frist.blockWegNachErster === false && frist.zweiteRunde > 0,
    `Block nach Runde 1 weg: ${frist.blockWegNachErster}, zweite=${frist.zweiteRunde}`);
}

/* Ab hier braucht es die neue Fassung. Ohne sie stürbe der Lauf an einem
   `is not a function`, und ein Absturz sagt nicht, WAS fehlt. */
if (!neu.raeumen) {
  console.log('\n  (Die übrigen Abschnitte brauchen die neue Fassung von indexdb.js.)');
  console.log(`\n  Suite 62 — Der Papierkorb: ${ok} ok, ${weg} offen`);
  await browser.close(); server.close(); process.exit(1);
}

/* Frist 0 heisst: nie automatisch. Das ist die Einstellung, auf die sich
   jemand verlässt, der nichts verlieren will. */
const nie = await seite.evaluate(async () => {
  const s = Store.addPage(null, { text: 'Bleibt für immer' });
  Store.trashBlock(s.id);
  Store.getBlock(s.id).trashedAt = new Date(Date.now() - 999 * 86400000).toISOString();
  Store.setMeta('papierkorbTage', 0);
  await Store.papierkorbAufraeumen();
  const da = !!Store.getBlock(s.id);
  Store.setMeta('papierkorbTage', 30);
  return da;
});
p('Bei „nie" wird nichts angefasst', nie);

/* ========================================================================= *
 * 5 · KEINE ZWEITE AUFRÄUMUNG MEHR, DIE INS LEERE LIEST
 * ========================================================================= */
console.log('\n5 · Im Quelltext steht nur noch eine Wahrheit');

/* OHNE KOMMENTARE MESSEN. Der erste Anlauf dieses Abschnitts war rot,
   obwohl die Reparatur stand: der Kopfkommentar in `pflege.js` NENNT
   `geloeschtAm` und `papierkorbFrist`, um zu erklären, was dort falsch war.
   Ein Lauf, der Kommentare mitliest, verbietet, den Fehler zu erklären —
   und genau das Erklären ist hier vorgeschrieben. */
const ohneKommentar = (s: any) => s
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');

const pflege = ohneKommentar(_lies(_dazu(WURZEL, 'quell/bereiche/einstellungen/pflege.js'), 'utf8'));
const werkzeuge = ohneKommentar(_lies(_dazu(WURZEL, 'quell/bereiche/wissen/werkzeuge.js'), 'utf8'));

p('`geloeschtAm` liest niemand mehr — das Feld heisst trashedAt',
  !/geloeschtAm/.test(pflege), 'pflege.js liest ein Feld, das nie geschrieben wird');
p('`papierkorbFrist` liest niemand mehr — die Einstellung heisst papierkorbTage',
  !/papierkorbFrist/.test(pflege));
/* Eine Weiterreichung darf stehenbleiben — der Name gehört zur öffentlichen
   Fläche beider Bereiche. Was nicht zweimal dastehen darf, ist die RECHNUNG:
   wer die Frist selbst ausrechnet, hat eine zweite Wahrheit gebaut. */
p('Die Frist wird nicht mehr in pflege.js gerechnet', !/papierkorbTage/.test(pflege));
p('… und nicht mehr in werkzeuge.js', !/papierkorbTage/.test(werkzeuge));
p('Beide Bereiche rufen dieselbe Stelle im Kern',
  /Store\.papierkorbAufraeumen/.test(pflege) && /Store\.papierkorbAufraeumen/.test(werkzeuge));

/* Ein Bereich ruft keinen anderen Bereich — CLAUDE.md, Regel 1. Genau das
   wäre die bequeme Lösung gewesen: pflege.js ruft Werkzeuge. */
p('pflege.js ruft dafür nicht in den Bereich wissen hinein',
  !/Werkzeuge\.papierkorbAufraeumen/.test(pflege));

/* ========================================================================= *
 * 6 · DER PAPIERKORB ZEIGT BEIDES AN
 * ========================================================================= */
console.log('\n6 · Die Ansicht zeigt Seiten und Blöcke');

const schale = _lies(_dazu(WURZEL, 'quell/schale/aufbau/schale.js'), 'utf8');
p('Die Papierkorb-Ansicht kennt die Blöcke', /papierkorbBloecke/.test(schale));

const sichtbar = await seite.evaluate(async () => {
  const s = Store.addPage(null, { text: 'Noch eine Seite' });
  const b = Store.addBlock(s.id, 'text', { text: 'ZUFINDENDER ABSATZ' });
  Store.trashBlock(b.id);
  App.papierkorb();
  await new Promise(f => setTimeout(f, 120));
  const o = document.querySelector('.overlay .pk');
  const text = o ? o.textContent : '';
  const treffer = o ? !!o.querySelector(`[data-id="${b.id}"]`) : false;
  document.querySelector('.overlay')?.remove();
  return { text: (text ?? '').includes('ZUFINDENDER ABSATZ'), treffer };
});
p('Der weggelegte Absatz steht im Papierkorb', sichtbar.text);
p('… und lässt sich dort anfassen', sichtbar.treffer);

/* ========================================================================= *
 * 7 · „ALLES LÖSCHEN" HEISST ALLES
 * ---------------------------------------------------------------------------
 * Ein Tür weiter derselbe Befund: `wipe()` leerte fünf der neun Fächer. Nicht
 * dabei ausgerechnet die grössten — `dateien` und `stuecke`. Wer zweimal
 * bestätigte, ALLE Seiten und Datenbanken zu löschen, bekam eine leere App
 * und behielt jedes Video auf der Platte.
 *
 * Zuletzt geprüft, weil danach nichts mehr da ist, worauf man prüfen könnte.
 * ========================================================================= */
console.log('\n7 · Alles löschen lässt nichts liegen');

const alles = await seite.evaluate(async () => {
  const s = Store.addPage(null, { text: 'Letzte Seite' });
  await Store.versionSpeichern(s.id, 'ein Stand');
  const dateiId = Store.uid();
  await Store.dateiPut({ id: dateiId, blockId: s.id, name: 'gross.mp4' });
  await Store.stueckPut({ id: dateiId + ':0', dateiId, nr: 0, teil: new Blob(['xyz']) });
  await Store.basisPut(s.id, { text: 'Letzte Seite' });
  await Store.vorratPut('irgendeine-db', { wert: 1 });
  await Store.flush();

  await Store.wipe();

  return {
    bloecke:  Object.keys(Store.cache.blocks).length,
    dateien:  (await Store.dateiAlle()).length,
    stuecke:  (await Store.stueckeVon(dateiId)).length,
    basis:    (await Store.basisAlle()).length,
    vorrat:   (await Store.vorratAlle()).length,
    versionen:(await Store.versionen(s.id)).length
  };
});
gleich('Keine Blöcke mehr', alles.bloecke, 0);
gleich('Keine Fassungen mehr', alles.versionen, 0);
p('Und auch keine Dateien mehr', alles.dateien === 0,
  `${alles.dateien} Datei(en) blieben nach „alles löschen" auf der Platte`);
p('… keine Stücke', alles.stuecke === 0, `${alles.stuecke} Stück(e) blieben liegen`);
p('… kein Abgleichsstand', alles.basis === 0);
p('… kein Vorrat', alles.vorrat === 0);

p('Kein JS-Fehler in der Konsole', fehler.length === 0, fehler.slice(0, 2).join(' · '));

await browser.close();
server.close();

console.log(`\n  Suite 62 — Der Papierkorb: ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
