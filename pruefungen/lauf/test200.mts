/* Suite 166 — Der Wettlauf beim Zurückholen (E123)
 * ============================================================================
 * DER FEHLER, IN EINEM SATZ: wer eine Seite mit Anhang endgültig löscht und
 * gleich darauf eine Sicherung zurückholt, bekam die Seite zurück — den
 * Anhang nicht.
 *
 * `Store.purgeBlock` kehrt sofort zurück und löscht die Anhänge danach in
 * einer abgelösten Aufgabe. Das ist richtig so: bei einer Seite mit
 * fünfhundert Blöcken darf der Bildschirm nicht stehen bleiben. Nur war auf
 * diese Aufgabe nicht zu warten — und so lief sie mitten in das
 * Zurückholen hinein:
 *
 *     Seite gelöscht           `purgeBlock` kehrt zurück, das Löschen läuft
 *     Sicherung zurückgeholt   Blöcke stehen wieder, Anhang neu geschrieben
 *     … Augenblick später      das alte Löschen kommt an und nimmt den
 *                              NEUEN Anhang mit
 *
 * Und zwar zielsicher: `purgeAnhaenge` liest den Block aus dem
 * Zwischenspeicher, und der ist nach dem Einspielen der EINGESPIELTE. Das
 * Löschen findet also genau die Kennung, die gerade zurückgeholt wurde.
 *
 * ─── KANN DIESE PRÜFUNG ÜBERHAUPT ROT WERDEN? (§55.2) ───────────────────────
 * Ja, gemessen — nicht behauptet. Derselbe Ablauf, zweimal drei Läufe:
 *
 *     ohne die Behebung   dateien=0  stuecke=0  alsBlob=0     3 von 3
 *     mit der Behebung    dateien=1  stuecke=1  alsBlob=900   3 von 3
 *
 * Der Unterschied zwischen den Bäumen war eine einzige Änderung:
 * `Store.settled()`. §2 und §3 unten fahren genau diesen Ablauf.
 *
 * ZWEI BEDINGUNGEN, UND BEIDE SIND LEICHT ZU VERLIEREN:
 *
 *   1. Das endgültige Löschen muss unmittelbar vor dem Zurückholen stehen.
 *   2. Der Bestand muss GROSS sein. Bei drei Blöcken ist die Löschkette
 *      durch, bevor das Zurückholen anfängt — dann ist alles grün, obwohl
 *      der Fehler dasteht. Genau das ist beim ersten Entwurf dieser Suite
 *      passiert: die Gegenprobe blieb grün, und nur die Quellenzeugen
 *      schlugen an. Deshalb leert `frisch` den Bestand NICHT.
 *
 * Das erklärt auch, warum test100 es übersehen hat, obwohl es genau diesen
 * Weg prüft: es fängt jedes Mal aufgeräumt an.
 *
 *   node pruefungen/lauf/test200.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8956;

const TYP: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.json': 'application/json',
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
  p(n, ist === soll, `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

const browser = await chromium.launch();
const seite = await browser.newPage();
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 140)));
await seite.setViewportSize({ width: 1300, height: 880 });
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForTimeout(2400);
await seite.evaluate(() => {
  Store.setMeta('rundgangGesehen', true);
  document.getElementById('rg-willkommen')?.remove();
  /* Und die Einrichtung der Hauptwelten: sie legt sich beim ersten Start
     über alles und fängt Klicks ab (E132). */
  document.querySelector('.produkt-onboarding-lage')?.remove();
  document.getElementById('rg-einladung')?.remove();
});

/* 900 Bytes mit einem Muster: eine Länge allein sagt nicht, dass es
   DIESELBEN Bytes sind (§13 „Byte für Byte vergleichen"). */
const BYTES = Array.from({ length: 900 }, (_, i) => (i * 7 + 13) % 256);
const PRUEFSUMME = BYTES.reduce((a, b) => (a * 31 + b) % 1000003, 7);

/* ==========================================================================
 * §1 · Auf abgelöste Arbeit lässt sich warten
 * --------------------------------------------------------------------------
 * Der Kern der Behebung. Wenn `settled()` nur ein leeres Versprechen wäre,
 * ist der zweite Punkt rot: der Anhang läge nach dem Warten noch da.
 * ========================================================================*/
console.log('\n1 · Auf abgelöste Arbeit lässt sich warten');

gleich('Store.settled gibt es', await seite.evaluate(() => typeof Store.settled), 'function');

const gewartet = await seite.evaluate(async (b: number[]) => {
  /* Der Weg, den der Editor geht: erst der Block, dann die Datei MIT seiner
     Kennung. Nur so trägt der Dateisatz ein `blockId`, und nur dann findet
     `purgeAnhaenge` ihn über den Index (siehe L43). */
  const s = Store.addPage(null, { text: 'Wird gelöscht' });
  const fb = Store.addBlock(s.id, 'file', { text: 'weg.bin' });
  const satz = await Dateien.ablegen(
    new File([new Uint8Array(b)], 'weg.bin', { type: 'application/octet-stream' }),
    { blockId: fb.id });
  Store.updateBlock(fb.id, { dateiId: satz.id });
  await Store.settled();                       /* der Upload selbst */
  const vorher = !!(await Store.dateiHolen(satz.id));

  Store.purgeBlock(s.id);
  /* DER PUNKT, AN DEM DIE PRÜFUNG ROT WERDEN KANN: hier ist der Anhang noch
     da. `purgeBlock` hat zurückgegeben, das Löschen läuft. Genau in diese
     Lücke lief das Zurückholen hinein. */
  const sofort = !!(await Store.dateiHolen(satz.id));

  /* KEINE Wartezeit, kein setTimeout — nur `settled`. */
  await Store.settled();
  return { vorher, sofort, nachher: !!(await Store.dateiHolen(satz.id)) };
}, BYTES);

gleich('Vor dem Löschen ist der Anhang da', gewartet.vorher, true);
gleich('Gleich nach `purgeBlock` ist er NOCH da — das ist die Lücke',
       gewartet.sofort, true);
gleich('Nach `settled()` ist er wirklich weg — ohne eine einzige Wartezeit',
       gewartet.nachher, false);

/* --------------------------------------------------------------------------
 * Ein frischer Bestand für die beiden Rundläufe.
 * ----------------------------------------------------------------------- */
const frisch = async (bytes: number[], titel: string): Promise<string> =>
    seite.evaluate(async (arg: { b: number[]; titel: string }) => {
  const b = arg.b;
  /* DER BESTAND WIRD NICHT GELEERT, und das ist der Kern dieser Prüfung.
     Mit drei Blöcken im Bestand ist das endgültige Löschen durch, bevor das
     Zurückholen überhaupt anfängt — der Wettlauf findet dann gar nicht
     statt, und eine Prüfung, die nur so misst, ist immer grün.
     Redion startet mit knapp zweitausend Blöcken (den Wissensseiten). Genau
     die sorgen dafür, dass die abgelöste Löschkette noch läuft, wenn die
     Sicherung schon wieder drinsteht. Gemessen ohne die Behebung: 1972
     Blöcke, dreimal von drei Läufen der Anhang weg. */
  for (const d of await Store.dateiAlle()) {
    for (const st of await Store.stueckeVon(d.id)) await Store.stueckWeg(st.id);
    await Store.dateiWeg(d.id);
  }
  const s = Store.addPage(null, { text: arg.titel });
  Store.addBlock(s.id, 'text', { text: 'Antwort: x = 11' });
  const fb = Store.addBlock(s.id, 'file', { text: 'aufgabe.bin' });
  const satz = await Dateien.ablegen(
    new File([new Uint8Array(b)], 'aufgabe.bin', { type: 'application/octet-stream' }),
    { blockId: fb.id });
  Store.updateBlock(fb.id, { dateiId: satz.id });
  await Store.settled();
  return satz.id;
}, { b: bytes, titel });

/* ==========================================================================
 * §2 · Der menschliche Weg mit `.redion` — löschen, dann zurückholen
 * --------------------------------------------------------------------------
 * Das ist der Weg, den es heute schon gibt, und er war der schlimmere: das
 * verschlüsselte Paket steckte hinter einem Knopf, den es nicht gab, die
 * gewöhnliche `.redion`-Sicherung dagegen steht in den Einstellungen.
 * ========================================================================*/
console.log('\n2 · Der menschliche Weg mit `.redion` — löschen, dann zurückholen');
const ID2 = await frisch(BYTES, 'Klausur Mathe');

const klar = await seite.evaluate(async (arg: { id: string }) => {
  /* Eine `.redion` genau so bauen, wie `sicherungSpeichern` sie baut. */
  const saetze = await Store.dateiAlle();
  const eintraege: any[] = [{ name: 'daten.json', inhalt: await Store.exportAll() }];
  const zuordnung: Record<string, string> = {};
  for (const sa of saetze) {
    eintraege.push({ name: 'dateien/' + sa.name, inhalt: await Dateien.alsBlob(sa.id) });
    zuordnung['dateien/' + sa.name] = sa.id;
  }
  eintraege.push({ name: 'dateien.json',
                   inhalt: JSON.stringify({ version: 1, saetze, zuordnung }) });
  const archiv = await Austausch.zipSchreiben(eintraege);

  /* UND JETZT DER AUSLÖSER: erst endgültig löschen, dann zurückholen. */
  for (const b of Object.values(Store.cache.blocks) as any[])
    if (b.alive !== false && b.parentTable !== 'collection') Store.purgeBlock(b.id);

  const zip = await Einlesen.zipLesenAusBlob(archiv);
  await Store.importAll((await zip.text('daten.json'))!, 'ersetzen');

  /* Derselbe Weg wie in `anhaengeEinspielen` (schale.ts). */
  const karte = JSON.parse((await zip.text('dateien.json'))!);
  const nachName: Record<string, string> = {};
  Object.entries<any>(karte.zuordnung || {}).forEach(([n, id]) => { nachName[id] = n; });
  for (const sa of karte.saetze) {
    const blob = await zip.alsBlob(nachName[sa.id]);
    for (const alt of await Store.stueckeVon(sa.id)) await Store.stueckWeg(alt.id);
    await Store.stueckPut({ id: sa.id + ':0', dateiId: sa.id, nr: 0, blob });
    await Store.dateiPut(Object.assign({}, sa,
      { teile: 1, angekommen: 1, zustand: 'fertig', groesse: blob.size }));
  }

  /* Die Atempause gehört zur Prüfung: der Wettlauf schlug mal sofort zu,
     mal erst danach. Ohne sie wäre die Prüfung selbst flockig. */
  await new Promise(r => setTimeout(r, 900));

  const zurueck = await Dateien.alsBlob(arg.id);
  const roh = zurueck ? new Uint8Array(await zurueck.arrayBuffer()) : new Uint8Array(0);
  return {
    dateien: (await Store.dateiAlle()).length,
    stuecke: (await Store.stueckeVon(arg.id)).length,
    groesse: roh.length,
    summe: [...roh].reduce((a, b) => (a * 31 + b) % 1000003, 7),
    seiten: Store.rootPages().filter((x: any) => x.text === 'Klausur Mathe').length,
    bestand: Object.keys(Store.cache.blocks).length,
  };
}, { id: ID2 });

p('Der Bestand war gross genug, dass der Wettlauf stattfinden KANN',
  klar.bestand > 1000, String(klar.bestand));
gleich('Die Seite ist zurück', klar.seiten, 1);
gleich('Der Dateisatz ist zurück', klar.dateien, 1);
gleich('Das Stück auch', klar.stuecke, 1);
gleich('Der Anhang hat wieder seine 900 Bytes', klar.groesse, 900);
gleich('Und es sind DIESELBEN Bytes', klar.summe, PRUEFSUMME);

/* ==========================================================================
 * §3 · Derselbe Weg mit dem verschlüsselten Paket (Fassung 2)
 * ========================================================================*/
console.log('\n3 · Derselbe Weg mit dem verschlüsselten Paket (Fassung 2)');
const ID3 = await frisch(BYTES, 'Klausur Physik');

const paket = await seite.evaluate(async (arg: { id: string }) => {
  const gebaut = await Krypto.paketBauen('geheim123');

  for (const b of Object.values(Store.cache.blocks) as any[])
    if (b.alive !== false && b.parentTable !== 'collection') Store.purgeBlock(b.id);

  const erg = await Krypto.paketEinspielen(gebaut.blob, 'geheim123', 'ersetzen');
  await new Promise(r => setTimeout(r, 900));

  const zurueck = await Dateien.alsBlob(arg.id);
  const roh = zurueck ? new Uint8Array(await zurueck.arrayBuffer()) : new Uint8Array(0);
  return {
    gemeldet: erg.anhaenge,
    dateien: (await Store.dateiAlle()).length,
    stuecke: (await Store.stueckeVon(arg.id)).length,
    groesse: roh.length,
    summe: [...roh].reduce((a, b) => (a * 31 + b) % 1000003, 7),
    seiten: Store.rootPages().filter((x: any) => x.text === 'Klausur Physik').length,
    bestand: Object.keys(Store.cache.blocks).length,
  };
}, { id: ID3 });

p('Auch hier ist der Bestand gross genug', paket.bestand > 1000, String(paket.bestand));
gleich('Die Seite ist zurück', paket.seiten, 1);
gleich('Das Einspielen meldet einen Anhang', paket.gemeldet, 1);
gleich('… und der ist auch wirklich da', paket.dateien, 1);
gleich('Mit seinem Stück', paket.stuecke, 1);
gleich('900 Bytes', paket.groesse, 900);
gleich('Und dieselben Bytes wie vorher', paket.summe, PRUEFSUMME);

/* ==========================================================================
 * §4 · Jetzt darf der Knopf da sein
 * --------------------------------------------------------------------------
 * In test199 §3 stand das Gegenteil: solange der Anhang verlorenging, durfte
 * niemand auf das Paket klicken können. Diese Sperre wird hier aufgehoben —
 * aber erst NACH §2 und §3, und in derselben Datei. Wer die Behebung
 * zurücknimmt, macht damit beides rot.
 * ========================================================================*/
console.log('\n4 · Jetzt darf der Knopf da sein');

const knoepfe = await seite.evaluate(async () => {
  Krypto.dialog();
  await new Promise(r => setTimeout(r, 300));
  const o = document.querySelector('.overlay');
  const antwort = {
    sichern: !!o?.querySelector('[data-a="paket-sichern"]'),
    laden: !!o?.querySelector('[data-a="paket-laden"]'),
    feld: !!o?.querySelector('#kr-pk-pw'),
    datei: (o?.querySelector('#kr-pk-datei') as HTMLInputElement | null)?.accept ?? '',
    text: (o?.textContent || '').replace(/\s+/g, ' '),
  };
  (o?.querySelector('[data-a="zu"]') as HTMLElement)?.click();
  return antwort;
});

p('Es gibt einen Knopf „Paket sichern"', knoepfe.sichern);
p('Und einen zum Zurückholen', knoepfe.laden);
p('Mit einem eigenen Passwortfeld', knoepfe.feld);
gleich('Der Dateiwähler nimmt .redion', knoepfe.datei, '.redion');
p('Die Karte sagt, dass die Anhänge dabei sind',
  /verschlüsselt, mit Anhängen/.test(knoepfe.text), knoepfe.text.slice(0, 120));
p('Und die alte Karte verweist auf sie, statt auf die Einstellungen',
  /eine Karte weiter/.test(knoepfe.text));

/* ==========================================================================
 * §5 · Die Behebung steht in der Quelle, nicht nur im Ergebnis
 * --------------------------------------------------------------------------
 * Ein grüner Rundlauf kann auch aus Glück grün sein. Diese Zeugen halten
 * fest, WORAN es lag — damit die Behebung nicht beim nächsten Umbau still
 * herausfällt.
 * ========================================================================*/
console.log('\n5 · Die Behebung steht in der Quelle, nicht nur im Ergebnis');

const ablage = fs.readFileSync(path.join(WURZEL, 'src/kern/ablage/indexdb.ts'), 'utf8');
const krypto = fs.readFileSync(path.join(WURZEL, 'src/kern/sicherheit/krypto.ts'), 'utf8');

p('`purgeBlock` vermerkt seine abgelöste Aufgabe',
  /abloesen\(\(async \(\) => \{/.test(ablage));
gleich('`settled` wartet in Runden, aber nicht ewig',
  /for \(let runde = 0; runde < 20 && unterwegs\.size; runde\+\+\)/.test(ablage), true);

const importAb = ablage.slice(ablage.indexOf('const importAll = async'));
const importBis = importAb.slice(0, importAb.indexOf('\n  const baum ='));
gleich('`importAll` wartet zweimal auf `settled()` — vorn und hinten',
       (importBis.match(/await settled\(\);/g) || []).length, 2);

p('Das Einspielen des Pakets wartet ebenfalls',
  /await Store\.settled\(\);/.test(krypto));
p('Und die alte Vermutung mit `flush` steht nicht mehr da',
  !/typeof \(Store as any\)\.flush === 'function'/.test(krypto));

gleich('Kein Skriptfehler', fehler.join(' | '), '');

console.log(`\nSuite 166 — Wettlauf beim Zurückholen: ${ok} ok, ${weg} offen`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
