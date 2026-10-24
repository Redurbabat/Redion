/* Suite 65 — Die Sicherung nimmt die Anhänge mit
 * ----------------------------------------------------------------------------
 * Der letzte offene Punkt aus Etappe 1. `test96` hat vor zwei Schritten
 * festgehalten, was fehlt:
 *
 *   „`dateien` und `stuecke` halten Blobs. `JSON.stringify` macht daraus `{}`
 *    — sie wären scheinbar dabei und in Wahrheit leer, was schlimmer ist als
 *    zu fehlen."
 *
 * Seither sagte die Sicherung wenigstens, dass sie die Anhänge auslässt. Ein
 * benannter Mangel ist kein stiller Verlust — aber ein Mangel bleibt er.
 *
 * ─── DIE FRAGE, DIE E6 OFFEN HIELT ──────────────────────────────────────────
 *
 * Was geschieht bei einem Video von 500 MB? Base64 in derselben JSON-Datei
 * geht nicht: es wird um ein Drittel grösser und liegt vollständig im
 * Arbeitsspeicher, zusammen mit der Zeichenkette, die daraus wird. Auf einem
 * Telefon ist das der sichere Absturz.
 *
 * ─── DIE ANTWORT: `.redion`, EIN GEWÖHNLICHES ZIP ───────────────────────────
 *
 *   daten.json      der Bestand, wie bisher
 *   dateien.json    welcher Anhang zu welcher Kennung gehört
 *   dateien/…       die Anhänge, unter ihren echten Namen
 *
 * Nichts davon geht je ganz durch den Arbeitsspeicher. Die Stücke liegen als
 * Blob in der Ablage, `Dateien.alsBlob` reiht sie aneinander, ohne sie zu
 * lesen, der Packer rechnet die Prüfsumme scheibchenweise, und der Leser
 * holt sich über das Inhaltsverzeichnis am Ende genau den Eintrag, den er
 * braucht. Was durch den Speicher geht, ist immer nur ein Megabyte.
 *
 * Dass die Anhänge unter ihren echten Namen liegen, ist Absicht: wer das
 * Archiv in zehn Jahren mit irgendeinem Packprogramm öffnet, findet seine
 * Bilder. Eine Sicherung muss die App überleben, die sie geschrieben hat.
 *
 * ─── WAS DIESER LAUF PRÜFT ──────────────────────────────────────────────────
 *
 * Den Rundlauf mit echten Bytes: Anhang anlegen, sichern, alles löschen,
 * zurückspielen, Byte für Byte vergleichen. Dazu die beiden Richtungen, in
 * denen es schiefgehen kann — dass beim Ersetzen zu viel weggeht, und dass
 * bei einer `.json`-Sicherung überhaupt etwas weggeht.
 *
 *   node pruefungen/lauf/test100.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import { fileURLToPath as _alsPfad } from 'node:url';
import { dirname as _ordner, resolve as _loese, join as _dazu } from 'node:path';
import { readFileSync as _lies, existsSync as _da } from 'node:fs';
import { createServer } from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';

const WURZEL = _loese(_ordner(_alsPfad(import.meta.url)), '../..');
const PORT = 8815;

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
await seite.waitForFunction(() => typeof App !== 'undefined' && typeof Store !== 'undefined' &&
                                  typeof Austausch !== 'undefined' && typeof Einlesen !== 'undefined',
                            null, { timeout: 20000 });

const neu = await seite.evaluate(() => ({
  packer: typeof Austausch.zipSchreiben === 'function',
  leser:  typeof Einlesen.zipLesenAusBlob === 'function'
}));
p('Der Packer ist da', neu.packer);
p('Der Leser für grosse Archive ist da (zipLesenAusBlob)', neu.leser);
if (!neu.leser) {
  console.log('\n  (Alles Weitere braucht Einlesen.zipLesenAusBlob.)');
  console.log(`\n  Suite 65 — Anhänge in der Sicherung: ${ok} ok, ${weg} offen`);
  await browser.close(); server.close(); process.exit(1);
}

/* ========================================================================= *
 * 1 · DER PACKER NIMMT EINEN BLOB, OHNE IHN ZU LESEN
 * ========================================================================= */
console.log('\n1 · Ein Blob kommt heil durch den Packer');

/* MIT NETZ. Dreht man die Blob-Behandlung im Packer zurück, entsteht ein
   Archiv mit unsinnigen Längenangaben, und das Lesen wirft. Ein Lauf, der
   daran stirbt, ist rot — sagt aber nicht, WAS fehlt. Also wird der Fehler
   hier zur Aussage gemacht statt zum Absturz. */
const rundZip = await seite.evaluate(async () => {
 try {
  /* Vier Megabyte mit einem Muster darin — gross genug, dass die
     Prüfsumme über mehrere Scheiben läuft, klein genug für einen Prüflauf. */
  const gross = new Uint8Array(4 * 1024 * 1024);
  for (let i = 0; i < gross.length; i++) gross[i] = (i * 7 + 13) & 255;
  const blob = new Blob([gross]);

  const archiv = await Austausch.zipSchreiben([
    { name: 'daten.json', inhalt: JSON.stringify({ hallo: 'welt' }) },
    { name: 'dateien/gross.bin', inhalt: blob }
  ]);

  const zip = await Einlesen.zipLesenAusBlob(archiv);
  const zurueck = new Uint8Array(await (await zip.alsBlob('dateien/gross.bin')).arrayBuffer());

  let gleich = zurueck.length === gross.length;
  if (gleich) for (let i = 0; i < gross.length; i++)
    if (zurueck[i] !== gross[i]) { gleich = false; break; }

  return { namen: zip.namen, text: await zip.text('daten.json'),
           laenge: zurueck.length, gleich, archivGroesse: archiv.size };
 } catch (e: unknown) {
   return { namen: [], text: '', laenge: -1, gleich: false, archivGroesse: -1,
            fehler: (e instanceof Error ? e.message : String(e)) };
 }
});

if (rundZip.fehler) console.log('    (Der Packer warf: ' + rundZip.fehler.slice(0, 110) + ')');
gleich('Beide Einträge stehen im Archiv', rundZip.namen,
       ['daten.json', 'dateien/gross.bin']);
gleich('Die JSON kommt unverändert zurück', rundZip.text, '{"hallo":"welt"}');
gleich('Der Blob hat dieselbe Länge', rundZip.laenge, 4 * 1024 * 1024);
p('… und denselben Inhalt, Byte für Byte', rundZip.gleich,
  'ein Archiv, das fast stimmt, ist schlimmer als eines, das fehlt');
p('Das Archiv ist so gross wie sein Inhalt (ungepackt)',
  rundZip.archivGroesse > 4 * 1024 * 1024 && rundZip.archivGroesse < 4.1 * 1024 * 1024,
  String(rundZip.archivGroesse));

/* Die Gegenrichtung: ein Archiv aus lauter kleinen Texten muss weiterhin
   gehen — Word und Excel gehen denselben Weg. */
const kleinKram = await seite.evaluate(async () => {
  const a = await Austausch.zipSchreiben([
    { name: 'a.txt', inhalt: 'eins' },
    { name: 'b/c.txt', inhalt: 'zwei' }
  ]);
  const z = await Einlesen.zipLesen(await a.arrayBuffer());
  return [await z.text('a.txt'), await z.text('b/c.txt')];
});
gleich('Der alte Leser kann das neue Archiv auch', kleinKram, ['eins', 'zwei']);

/* ========================================================================= *
 * 2 · DER RUNDLAUF MIT EINEM ECHTEN ANHANG
 * ========================================================================= */
console.log('\n2 · Anhang sichern, alles löschen, zurückspielen');

const rund = await seite.evaluate(async () => {
  /* Einen Anhang so ablegen, wie es die App tut. */
  const bytes = new Uint8Array(300 * 1024);
  for (let i = 0; i < bytes.length; i++) bytes[i] = (i * 31 + 5) & 255;
  const datei = new File([bytes], 'ferien.jpg', { type: 'image/jpeg' });

  const s = Store.addPage(null, { text: 'Seite mit Bild' });
  const b = Store.addBlock(s.id, 'image', { text: 'ferien.jpg' });
  const satz = await Dateien.ablegen(datei, { blockId: b.id, name: 'ferien.jpg' });
  await Store.flush();

  /* Und ein zweites mit demselben Namen — im Archiv darf ein Name nur
     einmal vorkommen, sonst überschreibt das Auspacken das eine mit dem
     anderen. */
  const zwei = await Dateien.ablegen(new File([bytes.slice(0, 1000)], 'ferien.jpg',
    { type: 'image/jpeg' }), { blockId: b.id, name: 'ferien.jpg' });
  await Store.flush();

  return { seiteId: s.id, blockId: b.id, dateiId: satz.id, zweiteId: zwei.id,
           groesse: satz.groesse };
});
gleich('Der Anhang liegt in der Ablage', rund.groesse, 300 * 1024);

/* Das Archiv bauen — mit `sicherungSpeichern` SELBST, nicht mit einer
   Abschrift davon. Hier standen dreissig Zeilen, Wort für Wort aus
   `schale.ts` kopiert: der Namens-Entdoppler, die Zuordnungskarte, alles.
   Eine Abschrift prüft sich selbst — wäre in der echten Funktion der
   Entdoppler zerbrochen, hätte dieser Lauf weiter Grün gemeldet, denn er
   rechnete mit seiner eigenen, heilen Kopie.

   Die echte Funktion lädt herunter, statt den Blob zurückzugeben. Deshalb
   wird der Download abgefangen: `createObjectURL` legt den Blob beiseite,
   und der Klick auf einen `download`-Anker wird geschluckt. Beides wird
   danach zurückgedreht. */
const archiv = await seite.evaluate(async () => {
  const stand = await Store.exportVorbereiten();
  const gefangen: { blob: Blob | null; name: string } = { blob: null, name: '' };
  const echtURL = URL.createObjectURL.bind(URL);
  const echtClick = HTMLAnchorElement.prototype.click;
  (URL as any).createObjectURL = (b: Blob) => { gefangen.blob = b; return 'blob:gefangen'; };
  HTMLAnchorElement.prototype.click = function (this: HTMLAnchorElement) {
    if (this.download) { gefangen.name = this.download; return; }
    return echtClick.call(this);
  };
  try {
    await App.sicherungSpeichern();
  } finally {
    (URL as any).createObjectURL = echtURL;
    HTMLAnchorElement.prototype.click = echtClick;
  }
  if (!gefangen.blob) return { namen: '', dateienDa: stand.dateien,
    enthaelt: '', fehlt: [], hinweis: '', dateiname: gefangen.name, gemerkt: '' };

  const blob = gefangen.blob;
  (window as any).__archiv = blob;                       /* für den nächsten Schritt */
  const zip = await Einlesen.zipLesenAusBlob(blob);
  const daten = JSON.parse(await zip.text('daten.json'));
  return { namen: zip.namen, dateienDa: stand.dateien,
           enthaelt: daten.enthaelt, fehlt: daten.fehlt, hinweis: daten.hinweis,
           dateiname: gefangen.name,
           /* Und was der echte Weg nebenbei können muss: sich merken, DASS
              gesichert wurde, und womit. Die Abschrift konnte das nie
              mitprüfen — sie lief an `sicherungGemerkt` vorbei. */
           gemerkt: Store.getMeta('sicherung:art') };
});
p('Der echte Weg lädt eine `.redion`-Datei herunter',
  /^redion-sicherung-\d{4}-\d{2}-\d{2}\.redion$/.test((archiv as any).dateiname ?? ''),
  JSON.stringify((archiv as any).dateiname));
gleich('… und merkt sich die Sicherung samt Art', (archiv as any).gemerkt, 'redion');

gleich('Die Sicherung kennt zwei Anhänge', archiv.dateienDa, 2);
p('Beide liegen unter ihrem echten Namen im Archiv',
  (archiv.namen ?? '').includes('dateien/ferien.jpg') && (archiv.namen ?? '').includes('dateien/ferien-2.jpg'),
  JSON.stringify(archiv.namen));
p('Die Zuordnung liegt daneben', (archiv.namen ?? '').includes('dateien.json'));
p('Die Sicherung behauptet nicht mehr, die Anhänge zu vermissen',
  (archiv.enthaelt ?? '').includes('dateien') && archiv.fehlt.length === 0,
  JSON.stringify({ enthaelt: archiv.enthaelt, fehlt: archiv.fehlt }));
p('… und sagt, wo sie liegen', /Ordner/.test(archiv.hinweis || ''), archiv.hinweis);

/* Jetzt alles weg — und zurück. */
const zurueck = await seite.evaluate(async ([dateiId, zweiteId]) => {
  const vorherBlob = await Dateien.alsBlob(dateiId);
  /* Ohne den Anhang gibt es nichts zu vergleichen — dann bricht der Lauf mit
     einem Satz ab, statt später ein „identisch" zu melden, das nichts prüft. */
  if (!vorherBlob) throw new Error('Der Anhang war schon vor dem Löschen nicht lesbar');
  const vorher = new Uint8Array(await vorherBlob.arrayBuffer());

  await Store.wipe();
  const leer = { dateien: (await Store.dateiAlle()).length,
                 bloecke: Object.keys(Store.cache.blocks).length };

  const zip = await Einlesen.zipLesenAusBlob((window as any).__archiv);
  await Store.importAll(await zip.text('daten.json'), 'ersetzen');

  /* Derselbe Weg wie in `anhaengeEinspielen`. */
  const karte = JSON.parse(await zip.text('dateien.json'));
  const nachName: Record<string, string> = {};
  Object.entries(karte.zuordnung).forEach(([name, id]) => { nachName[String(id)] = name; });
  const STUECK = KONSTANTEN.STUECK;
  for (const satz of karte.saetze) {
    const name = nachName[satz.id];
    const roh = await zip.alsBlob(name);
    if (!roh) continue;
    const blob = new Blob([roh], { type: satz.typ });
    for (const alt of await Store.stueckeVon(satz.id)) await Store.stueckWeg(alt.id);
    const teile = Math.max(1, Math.ceil(blob.size / STUECK));
    for (let nr = 0; nr < teile; nr++)
      await Store.stueckPut({ id: satz.id + ':' + nr, dateiId: satz.id, nr,
        blob: blob.slice(nr * STUECK, Math.min((nr + 1) * STUECK, blob.size)) });
    await Store.dateiPut(Object.assign({}, satz, {
      teile, angekommen: teile, zustand: 'fertig', groesse: blob.size }));
  }

  const wieder = await Dateien.alsBlob(dateiId);
  const nachher = wieder ? new Uint8Array(await wieder.arrayBuffer()) : new Uint8Array(0);
  let identisch = nachher.length === vorher.length;
  if (identisch) for (let i = 0; i < vorher.length; i++)
    if (vorher[i] !== nachher[i]) { identisch = false; break; }

  const satzZwei = await Store.dateiHolen(zweiteId);
  return { leer, identisch, laenge: nachher.length,
           zweiteDa: !!satzZwei, zweiteGroesse: satzZwei ? satzZwei.groesse : -1,
           typ: wieder ? wieder.type : '' };
}, [rund.dateiId, rund.zweiteId]);

gleich('Nach dem Löschen ist wirklich nichts mehr da', zurueck.leer,
       { dateien: 0, bloecke: 0 });
p('Der Anhang ist zurück, Byte für Byte identisch', zurueck.identisch,
  `${zurueck.laenge} statt ${300 * 1024} Byte`);
gleich('Auch der zweite mit demselben Namen', zurueck.zweiteDa, true);
gleich('… und mit seiner eigenen Grösse', zurueck.zweiteGroesse, 1000);
gleich('Der Medientyp überlebt — sonst wäre aus dem Bild ein Download geworden',
       zurueck.typ, 'image/jpeg');

/* ========================================================================= *
 * 2b · EIN HALBER UPLOAD IST KEIN HALBES VIDEO
 * -------------------------------------------------------------------------
 * Tab zu bei Stück 25 von 40: der Satz bleibt auf `laeuft`, die 25 Stücke
 * liegen in der Ablage. `alsBlob` reihte sie bis eben kommentarlos
 * aneinander — die Sicherung trug dann ein halbes Video unter vollem Namen,
 * und das Einspielen machte aus den 25 Stücken `zustand: 'fertig'`. Danach
 * war der Verlust keine Lücke mehr, sondern unsichtbar.
 * ========================================================================= */
console.log('\n2b · Ein halber Upload wandert nicht in die Sicherung');

const halb = await seite.evaluate(async () => {
  /* Einen Upload von 3 Stücken anmelden und nur 2 schicken — genau der
     Zustand nach einem geschlossenen Tab. */
  const STUECK = KONSTANTEN.STUECK;
  const satz = await Dateien.anmelden({ name: 'abgebrochen.mp4',
    groesse: 3 * STUECK, typ: 'video/mp4' });
  const stueck = new Blob([new Uint8Array(STUECK)]);
  await Dateien.stueckSchicken(satz.id, 0, stueck);
  await Dateien.stueckSchicken(satz.id, 1, stueck);

  const blob = await Dateien.alsBlob(satz.id);

  /* Und die Sicherung: der echte Weg, wie oben abgefangen. */
  const gefangen: { blob: Blob | null } = { blob: null };
  const echtURL = URL.createObjectURL.bind(URL);
  const echtClick = HTMLAnchorElement.prototype.click;
  (URL as any).createObjectURL = (b: Blob) => { gefangen.blob = b; return 'blob:gefangen'; };
  HTMLAnchorElement.prototype.click = function (this: HTMLAnchorElement) {
    if (this.download) return; return echtClick.call(this);
  };
  let ok = true;
  try { ok = await App.sicherungSpeichern(); }
  finally {
    (URL as any).createObjectURL = echtURL;
    HTMLAnchorElement.prototype.click = echtClick;
  }
  const zip = gefangen.blob ? await Einlesen.zipLesenAusBlob(gefangen.blob) : null;
  const karte = zip ? JSON.parse(await zip.text('dateien.json')) : null;
  const daten = zip ? JSON.parse(await zip.text('daten.json')) : null;
  /* Aufräumen, damit der Rest des Laufs den Torso nicht mitschleppt. */
  await Dateien.weg(satz.id);
  return { blobIstNull: blob === null, vollstaendig: ok,
           imArchiv: zip ? (zip.namen ?? []).some((n: string) => n.includes('abgebrochen')) : null,
           imManifest: karte ? karte.saetze.some((e: any) => e.id === satz.id) : null,
           gewarnt: daten ? Number(daten.unvollstaendigeDateienAusgelassen) >= 1 &&
             /abgebrochen\.mp4/.test(daten.hinweis || '') &&
             /Teilweise:/.test(daten.hinweis || '') &&
             !/Vollständig: die/.test(daten.hinweis || '') : false };
});
p('`alsBlob` setzt einen halben Upload NICHT zusammen',
  (halb as any).blobIstNull === true);
gleich('… und die Sicherung trägt ihn nicht als Datei',
  (halb as any).imArchiv, false);
gleich('… und verspricht ihn auch nicht in dateien.json',
  (halb as any).imManifest, false);
p('… und daten.json warnt ausdrücklich vor der unvollständigen Datei',
  (halb as any).gewarnt === true);
gleich('… und der Export gibt keine vollständige Sicherung für Folgeschritte frei',
  (halb as any).vollstaendig, false);

/* ========================================================================= *
 * 3 · DIE BEIDEN RICHTUNGEN, IN DENEN ES SCHIEFGEHT
 * ========================================================================= */
console.log('\n3 · Was beim Ersetzen weggehen darf — und was nicht');

const quelle = _lies(_dazu(WURZEL, 'quell/schale/aufbau/schale.js'), 'utf8');
p('Beim Ersetzen räumt der Import fremde Anhänge weg',
  /art === 'ersetzen'[\s\S]{0,600}dateiWeg/.test(quelle));
p('Die Anhänge kommen NACH den Blöcken',
  quelle.indexOf('Store.importAll(text, wahl)') < quelle.indexOf('anhaengeEinspielen(zip'),
  'andersherum löscht „ersetzen" sie gleich wieder mit');

/* Eine `.json`-Sicherung sagt selbst, dass sie die Anhänge nicht kennt.
   Etwas wegzuwerfen, weil es in einer Datei fehlt, die zugibt es nicht zu
   kennen, wäre die schlimmste Art von Datenverlust. */
const jsonSchont = await seite.evaluate(async () => {
  const bytes = new Uint8Array(2048);
  const b = Store.addBlock(Store.addPage(null, { text: 'X' }).id, 'image', {});
  const satz = await Dateien.ablegen(new File([bytes], 'bleibt.png', { type: 'image/png' }),
    { blockId: b.id });
  await Store.flush();
  const json = Store.exportAll();            /* ohne Anhänge — wie die .json */
  await Store.importAll(json, 'ersetzen');
  return { nochDa: !!(await Store.dateiHolen(satz.id)),
           sagtEs: /NICHT/.test(JSON.parse(json).hinweis || '') };
});
p('Eine .json-Sicherung lässt die Anhänge in Ruhe', jsonSchont.nochDa,
  'sie kennt sie nicht — und was sie nicht kennt, darf sie nicht löschen');
p('… und sagt ausdrücklich, dass sie sie nicht enthält', jsonSchont.sagtEs);

/* ========================================================================= *
 * 4 · ÜBER VIER GIGABYTE — GESICHERT STATT ABGELEHNT
 * -------------------------------------------------------------------------
 * HIER STAND DAS GEGENTEIL, und der Wechsel ist der Punkt (E39). Bis zum
 * 6. August brach die Sicherung bei einem Anhang über 4 GB ab. Die Meldung
 * war ehrlich und riet, „die Anhänge in zwei Schritten" zu sichern — nur
 * gibt es diesen zweiten Schritt in Redion nicht: jeder Weg mündet in
 * dasselbe eine Archiv mit allen Anhängen. Wer 5 GB Fotos hatte, konnte
 * nicht sichern. Eine ehrliche Fehlermeldung ist besser als ein kaputtes
 * Archiv, aber sie ist keine Sicherung.
 *
 * Jetzt schreibt Redion ZIP64. Geprüft wird das hier an der Verzweigung,
 * nicht an vier echten Gigabyte: `Austausch.grenzen` senkt die Schwelle,
 * und heraus kommt ein vollwertiges ZIP64 mit kleinen Dateien. Dass es
 * eines ist, das fremde Werkzeuge lesen, prüft `test103` Abschnitt 5 mit
 * `unzip` und `zipinfo`.
 * ========================================================================= */
console.log('\n4 · Über vier Gigabyte: gesichert, nicht abgelehnt');

const grossGeht = await seite.evaluate(async () => {
  const alt = Austausch.grenzen.bytes;
  Austausch.grenzen.bytes = 30;          /* „über der Grenze" ab 30 Byte */
  try {
    const blob = await Austausch.zipSchreiben([
      { name: 'daten.json', inhalt: '{"a":1}' },
      { name: 'riesig.mov', inhalt: new Blob([new Uint8Array(400)]) }
    ]);
    const zip = await Einlesen.zipLesenAusBlob(blob);
    const wieder = await zip.alsBlob('riesig.mov');
    return {
      fehler: '',
      namen: zip.namen,
      bytes: wieder ? wieder.size : -1,
      daten: await zip.text('daten.json')
    };
  } catch (e: unknown) {
    return { fehler: (e instanceof Error ? e.message : String(e)), namen: [], bytes: -1, daten: '' };
  } finally {
    Austausch.grenzen.bytes = alt;
  }
});
p('Ein Anhang über der Grenze wird gesichert, nicht abgelehnt',
  grossGeht.fehler === '', grossGeht.fehler.slice(0, 90));
p('… und steht mit Namen im Archiv',
  grossGeht.namen.includes('riesig.mov'), JSON.stringify(grossGeht.namen));
p('… und kommt Byte für Byte zurück', grossGeht.bytes === 400, String(grossGeht.bytes));
p('… ohne den Rest der Sicherung zu beschädigen', grossGeht.daten === '{"a":1}',
  String(grossGeht.daten));

p('Kein JS-Fehler in der Konsole', fehler.length === 0, fehler.slice(0, 2).join(' · '));

await browser.close();
server.close();

console.log(`\n  Suite 65 — Anhänge in der Sicherung: ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
