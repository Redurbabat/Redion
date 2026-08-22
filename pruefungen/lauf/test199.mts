/* Suite 165 — Das verschlüsselte Paket, wirklich benutzt (E122)
 * ============================================================================
 * In `krypto.ts` lagen 460 Zeilen für ein vollständig verschlüsseltes
 * `.redion` — Fassung 2, mit Anhängen in Stücken, Schlüsselhülle und
 * Passwortwechsel. Sorgfältig geschrieben, dokumentiert im Kopf der Datei.
 *
 * Und von aussen nicht erreichbar: die Einstiegspunkte standen nicht im
 * `return`-Objekt. Niemand konnte sie aufrufen, kein Prüflauf hat sie je
 * ausgeführt, und eine Typstelle war fehlerhaft.
 *
 * Bei einer SICHERUNG ist das die gefährlichste Sorte Code: er sieht fertig
 * aus. §46 sagt, Datenintegrität geht vor Geschwindigkeit, und §30 sagt,
 * jede Backup-Änderung braucht einen Test mit echten Bytes.
 *
 * Diese Suite ist dieser Test. Sie fährt den Weg ab, den ein Mensch geht,
 * und prüft vor allem, was schiefgehen KANN: falsches Passwort, verändertes
 * Manifest, fehlender Eintrag, unvollständiger Anhang.
 *
 *   node pruefungen/lauf/test199.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8955;

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
  document.getElementById('rg-einladung')?.remove();
});


const BYTES = Array.from({ length: 900 }, (_, i) => (i * 7 + 13) % 256);

/* --------------------------------------------------------------------------
 * FRISCHER BESTAND JE ABSCHNITT
 * --------------------------------------------------------------------------
 * Der erste Entwurf liess jeden Abschnitt auf dem aufbauen, was der vorige
 * hinterlassen hatte. Das rächte sich sofort: §3 mass „0 Bytes zurück" und
 * §5 brach ab, und beides lag nicht am geprüften Code, sondern daran, dass
 * der Bestand nicht mehr der war, den der Abschnitt annahm. Eine Einzel-
 * messung im leeren Browser zeigte den Rundlauf einwandfrei.
 * Also stellt jeder Abschnitt seinen Ausgangszustand selbst her.
 * ----------------------------------------------------------------------- */
const frisch = async (bytes: number[]): Promise<void> => {
  await seite.evaluate(async (b: number[]) => {
    for (const x of Object.values(Store.cache.blocks) as any[])
      if (x.alive !== false && x.parentTable !== 'collection') Store.purgeBlock(x.id);
    for (const d of await Store.dateiAlle()) {
      for (const st of await Store.stueckeVon(d.id)) await Store.stueckWeg(st.id);
      await Store.dateiWeg(d.id);
    }
    const s = Store.addPage(null, { text: 'Geheime Klausur' });
    Store.addBlock(s.id, 'text', { text: 'Antwort: x = 11' });
    const satz = await Dateien.ablegen(
      new File([new Uint8Array(b)], 'anhang.bin',
               { type: 'application/octet-stream' }), {});
    Store.addBlock(s.id, 'file', { text: 'anhang.bin', dateiId: satz.id });
  }, bytes);
};

/* ==========================================================================
 * §1 · Erreichbar — der Punkt, an dem es fehlte
 * ========================================================================*/
console.log('\n1 · Erreichbar — der Punkt, an dem es fehlte');

const da = await seite.evaluate(() => ({
  bauen: typeof Krypto.paketBauen,
  schreiben: typeof Krypto.paketSchreiben,
  oeffnen: typeof Krypto.paketOeffnen,
  einspielen: typeof Krypto.paketEinspielen,
  wechseln: typeof Krypto.paketPasswortWechseln,
}));
for (const [k, v] of Object.entries(da)) gleich('Krypto.' + k, v, 'function');

/* ==========================================================================
 * §2 · Der Rundlauf mit einem echten Anhang
 * ========================================================================*/
console.log('\n2 · Der Rundlauf mit einem echten Anhang');
await frisch(BYTES);


const rund = await seite.evaluate(async () => {
  const paket = await Krypto.paketBauen('geheim123');
  const b = await paket.blob.arrayBuffer();
  return {
    name: paket.name,
    groesse: paket.blob.size,
    anhaenge: paket.anhaenge,
    eintraege: paket.manifest.eintraege.length,
    fassung: paket.manifest.fassung,
    art: paket.manifest.art,
    runden: paket.manifest.kdf.runden,
    /* Und das Entscheidende: steht der Klartext irgendwo im Archiv? */
    klartextDrin: new TextDecoder('latin1').decode(new Uint8Array(b))
      .includes('Geheime Klausur'),
    dateinameDrin: new TextDecoder('latin1').decode(new Uint8Array(b))
      .includes('anhang.bin'),
  };
});

p('Der Dateiname endet auf .verschluesselt.redion',
  /\.verschluesselt\.redion$/.test(rund.name), rund.name);
gleich('Es ist Fassung 2', rund.fassung, 2);
gleich('Und trägt die richtige Art', rund.art, 'redion-verschluesselt');
gleich('Ein Anhang ist mitgekommen', rund.anhaenge, 1);
p('Es gibt Einträge für Daten, Dateiliste und Anhang',
  rund.eintraege >= 3, String(rund.eintraege));
gleich('310 000 Runden für die Schlüsselableitung', rund.runden, 310000);
p('Das Archiv ist nicht leer', rund.groesse > 500, String(rund.groesse));

/* Das ist der ganze Zweck: von aussen darf nichts zu lesen sein. */
gleich('Der Seitentitel steht NICHT im Klartext im Archiv', rund.klartextDrin, false);
gleich('Der Dateiname auch nicht', rund.dateinameDrin, false);

/* ==========================================================================
 * §3 · Und das Zurückholen bringt den Anhang mit
 * --------------------------------------------------------------------------
 * Hier stand einmal das Gegenteil: ein Wächter, der prüfte, dass NIEMAND auf
 * das Paket klicken kann, weil das Zurückholen den Anhang verlor. Der Grund
 * dafür lag nicht in dieser Datei — `Store.purgeBlock` löschte die Anhänge
 * in einer abgelösten Aufgabe, auf die niemand warten konnte, und die kam an,
 * nachdem das Zurückholen sie schon neu geschrieben hatte (E123).
 *
 * Der ausführliche Beweis samt Gegenprobe steht in test200. Hier bleibt der
 * kurze Rundlauf: was diese Datei baut, muss diese Datei auch zurückholen.
 * ========================================================================*/
console.log('\n3 · Und das Zurückholen bringt den Anhang mit');
await frisch(BYTES);

const zurueck = await seite.evaluate(async (b: number[]) => {
  const vorher = (await Store.dateiAlle())[0];
  const gebaut = await Krypto.paketBauen('geheim123');
  const erg = await Krypto.paketEinspielen(gebaut.blob, 'geheim123', 'ersetzen');
  await new Promise(r => setTimeout(r, 600));
  const blob = await Dateien.alsBlob(vorher.id);
  const roh = blob ? [...new Uint8Array(await blob.arrayBuffer())] : [];
  return {
    anhaenge: erg.anhaenge,
    laenge: roh.length,
    gleich: roh.length === b.length && roh.every((x, i) => x === b[i]),
    titel: Store.rootPages().some((x: any) => x.text === 'Geheime Klausur'),
  };
}, BYTES);

gleich('Ein Anhang kommt zurück', zurueck.anhaenge, 1);
gleich('Die Seite auch', zurueck.titel, true);
gleich('Der Anhang hat wieder seine 900 Bytes', zurueck.laenge, 900);
gleich('Und es sind Byte für Byte dieselben', zurueck.gleich, true);

/* ==========================================================================
 * §4 · Und was schiefgehen kann, geht ehrlich schief
 * --------------------------------------------------------------------------
 * Bei einer Sicherung zählt der Fehlerfall mehr als der Erfolgsfall. Keiner
 * dieser Wege darf einen halben Bestand hinterlassen.
 * ========================================================================*/
console.log('\n4 · Und was schiefgehen kann, geht ehrlich schief');
await frisch(BYTES);

const boese = await seite.evaluate(async () => {
  const paket = await Krypto.paketBauen('geheim123');
  const vorher = {
    seiten: Store.rootPages().length,
    dateien: (await Store.dateiAlle()).length,
  };
  const versuch = async (fn: () => Promise<unknown>) => {
    try { await fn(); return 'KEIN FEHLER'; }
    catch (e) { return String((e as Error).message || e); }
  };

  const falsch = await versuch(() => Krypto.paketOeffnen(paket.blob, 'falsch'));
  const leer = await versuch(() => Krypto.paketOeffnen(paket.blob, ''));

  /* Ein verändertes Manifest: eine Zahl im Klartextteil verdrehen. */
  const zip = await Einlesen.zipLesenAusBlob(paket.blob);
  const m = JSON.parse((await zip.text('manifest.json')) as string);
  m.erstellt = '2000-01-01T00:00:00.000Z';
  const geaendert = await Austausch.zipSchreiben([
    { name: 'manifest.json', inhalt: JSON.stringify(m, null, 2) },
    ...(await Promise.all(m.eintraege.map(async (e: any) =>
      ({ name: e.pfad, inhalt: await zip.alsBlob(e.pfad) }))))
  ]);
  const manipuliert = await versuch(() => Krypto.paketOeffnen(geaendert, 'geheim123'));

  /* Ein Paket, dem ein Eintrag fehlt. */
  const ohne = await Austausch.zipSchreiben([
    { name: 'manifest.json', inhalt: JSON.stringify(paket.manifest, null, 2) }
  ]);
  const luecke = await versuch(() => Krypto.paketOeffnen(ohne, 'geheim123'));

  /* Kein Passwort beim Bauen. */
  const ohnePw = await versuch(() => Krypto.paketBauen(''));

  const nachher = {
    seiten: Store.rootPages().length,
    dateien: (await Store.dateiAlle()).length,
  };
  return { falsch, leer, manipuliert, luecke, ohnePw, vorher, nachher };
});

p('Falsches Passwort wird abgelehnt', boese.falsch !== 'KEIN FEHLER', boese.falsch);
p('Und sagt nicht, WAS falsch war',
  /Falsches Passwort oder beschädigte Sicherung/.test(boese.falsch), boese.falsch);
p('Leeres Passwort ebenso', boese.leer !== 'KEIN FEHLER', boese.leer);
p('Ein verändertes Manifest fliegt auf',
  boese.manipuliert !== 'KEIN FEHLER', boese.manipuliert);
p('Ein fehlender Eintrag auch', boese.luecke !== 'KEIN FEHLER', boese.luecke);
p('Ohne Passwort wird gar nicht erst gebaut',
  /Passwort/.test(boese.ohnePw), boese.ohnePw);
gleich('Und nach all dem stehen die Seiten unverändert da',
  boese.nachher.seiten, boese.vorher.seiten);
gleich('Und die Anhänge auch', boese.nachher.dateien, boese.vorher.dateien);

/* ==========================================================================
 * §5 · Passwortwechsel ohne Neuverschlüsseln
 * ========================================================================*/
console.log('\n5 · Passwortwechsel ohne Neuverschlüsseln');
await frisch(BYTES);

const wechsel = await seite.evaluate(async () => {
  const alt = await Krypto.paketBauen('geheim123');
  const neu = await Krypto.paketPasswortWechseln(alt.blob, 'geheim123', 'nochgeheimer');
  const versuch = async (fn: () => Promise<unknown>) => {
    try { await fn(); return 'geht'; } catch { return 'geht nicht'; }
  };
  return {
    mitNeuem: await versuch(() => Krypto.paketOeffnen(neu.blob, 'nochgeheimer')),
    mitAltem: await versuch(() => Krypto.paketOeffnen(neu.blob, 'geheim123')),
    altesPaketMitAltem: await versuch(() => Krypto.paketOeffnen(alt.blob, 'geheim123')),
    gleicheId: neu.manifest.paketId === alt.manifest.paketId,
    andereSalz: neu.manifest.kdf.salz !== alt.manifest.kdf.salz,
    name: neu.name,
  };
});

gleich('Mit dem neuen Passwort geht es auf', wechsel.mitNeuem, 'geht');
gleich('Mit dem alten nicht mehr', wechsel.mitAltem, 'geht nicht');
p('Das ALTE Paket bleibt mit dem alten Passwort lesbar',
  wechsel.altesPaketMitAltem === 'geht',
  'eine Datei, die jemand schon hat, lässt sich nicht widerrufen');
p('Die Paketkennung bleibt dieselbe', wechsel.gleicheId);
p('Aber das Salz ist neu', wechsel.andereSalz);

/* ==========================================================================
 * §6 · Was der Quelltext verspricht
 * ========================================================================*/
console.log('\n6 · Was der Quelltext verspricht');

const code = fs.readFileSync(
  path.join(WURZEL, 'src/kern/sicherheit/krypto.ts'), 'utf8');

p('Die Einstiegspunkte stehen im return-Objekt',
  /paketBauen, paketSchreiben, paketOeffnen, paketEinspielen/.test(code));
p('Ein unvollständiger Anhang bricht ab',
  /ist unvollständig — /.test(code));
p('Und die Rundenzahl ist nach oben begrenzt',
  /PAKET_RUNDEN_MAX/.test(code));
/* Zwei Knöpfe, je zweimal im Quelltext: einmal im Aufbau des Dialogs und
   einmal in seiner Behandlung. Vier Fundstellen heisst: beide Knöpfe sind
   da UND beide tun etwas. */
gleich('Und im Dialog stehen die Knöpfe dafür',
  (code.match(/data-a="paket-/g) || []).length, 4);

p('Keine Fehler auf der Seite', fehler.length === 0, fehler.join(' | '));

await browser.close();
server.close();
console.log(`\n${ok} bestanden, ${weg} durchgefallen`);
process.exit(weg ? 1 : 0);
