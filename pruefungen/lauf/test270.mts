/* Suite 270 — Deine Daten auf allen Geräten (E270)
 * ============================================================================
 * Redur: „ich will meine alle daten auf icloud speichern kannst du das
 * machen". Ein Browser kann nicht in iCloud schreiben — was er kann, sind
 * zwei Wege, und beide waren vorhanden und keiner benutzbar:
 *
 *   · Der eigene Server (Cloudflare) war FERTIG GEBAUT und nicht
 *     scharfgeschaltet, und die Oberfläche behauptete an vier Stellen, es
 *     gäbe ihn gar nicht.
 *   · Ein Ordner, in den Redion von selbst sichert — den gab es noch nicht.
 *     Liegt er in iCloud Drive, erledigt den Rest der Dienst selbst.
 *
 * §1  `.assetsignore` — der Sicherheitsfund. Ohne sie ginge beim nächsten
 *     Push der ganze Quelltext ins Netz.
 * §2  `/api/stand` nennt auch den Dateispeicher — in BEIDEN Server-Zweigen.
 * §3  `wolkeTakt` wird gelesen: `takt()` gibt die Millisekunden zurück.
 * §4  „Mein Konto" sagt die Wahrheit und führt zum vorhandenen Fenster (E29).
 * §5  „Server prüfen" nennt in Worten, was fehlt — gegen eine Attrappe.
 * §6  Das Teilen-Menü behauptet nicht mehr, es gäbe keine Freigabe.
 * §7  DIE SICHERUNGS-FALLE: der Ordnerzugriff darf nicht in die Sicherung
 *     und muss das Einspielen überleben. Beides — sonst schriebe die erste
 *     Sicherung `{}` über einen lebenden Zugriff.
 * §8  `zuLoeschen` als reine Funktion: Fremdes bleibt liegen.
 * §9  Der Abdruck ändert sich bei echten Änderungen — und NICHT durch die
 *     Marken, die das Sichern selbst schreibt (sonst sichert es endlos).
 * §10 Ohne `showDirectoryPicker` ein ehrlicher Satz statt eines Knopfs (§47).
 * §11 Eine ECHTE Runde: 5-MB-Anhang, Handle-Attrappe, gültiges ZIP.
 * §12 Bau-Hygiene.
 *
 *   node pruefungen/lauf/test270.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
declare const Store: any; declare const App: any; declare const Wolke: any;
declare const OrdnerSicherung: any; declare const Dateien: any;
declare const WolkeFenster: any; declare const Einstellungen: any;
declare const Werkzeuge: any; declare const Sicherung: any;
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9048;
const API = 9049;

/* --- Die Server-Attrappe (Port 9049) -------------------------------------
   Sie antwortet auf `/api/stand` mit dem, was `standAntwort` gerade sagt.
   Damit lassen sich die vier Ausgänge von „Server prüfen" durchspielen,
   ohne einen echten Worker zu veröffentlichen. */
let standAntwort: any = { ablage: 'd1', dateien: 'r2' };
const attrappe = http.createServer((a: IncomingMessage, b: ServerResponse) => {
  /* `Wolke.ruf` schickt eigene Kopfzeilen (Content-Type, Redion-Geraet).
     Damit wird jede Anfrage von einem anderen Ursprung vorab mit OPTIONS
     erfragt — wer das vergisst, bekommt „nicht erreichbar" und sucht den
     Fehler in der App. */
  const kopf: Record<string, string> = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
  };
  if (a.method === 'OPTIONS') { b.writeHead(204, kopf); b.end(); return; }
  b.writeHead(200, { ...kopf, 'Content-Type': 'application/json' });
  b.end(JSON.stringify(standAntwort));
});
await new Promise<void>(f => { attrappe.listen(API, () => f()); });

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
  p(n, JSON.stringify(ist) === JSON.stringify(soll),
    `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);
const lies = (rel: string): string =>
  fs.existsSync(path.join(WURZEL, rel))
    ? fs.readFileSync(path.join(WURZEL, rel), 'utf8') : '';

/* ==========================================================================
 * §1 — .assetsignore
 * ========================================================================*/
console.log('\n1 · .assetsignore: was NICHT ins Netz geht');
const ignore = lies('.assetsignore');
const zeilen = ignore.split(/\r?\n/).map(z => z.trim())
  .filter(z => z && !z.startsWith('#'));
p('Die Datei gibt es überhaupt', !!ignore.trim(),
  'ohne sie lädt `wrangler deploy` das ganze Verzeichnis hoch');
for (const raus of ['src/', 'pruefungen/', 'node_modules/', '.git/'])
  p('… schliesst ' + raus + ' aus',
    zeilen.some(z => z === raus || z === raus.replace(/\/$/, '') ||
                     z === raus + '**'), zeilen.join(' · '));
p('… schliesst .env aus (dort stünden echte Geheimnisse, §42)',
  zeilen.some(z => z.startsWith('.env')), zeilen.join(' · '));
/* Und die Gegenrichtung — eine Ausschlussliste, die die App mit ausschliesst,
   veröffentlicht eine leere Seite. */
for (const drin of ['quell/', 'index.html', 'sw.js', 'oeffentlich/'])
  p('… schliesst ' + drin + ' NICHT aus',
    !zeilen.some(z => drin.startsWith(z.replace(/\*+$/, '')) && z.length > 2),
    zeilen.join(' · '));

/* ── §1b — PERSÖNLICHES BLEIBT DRAUSSEN (E520) ────────────────────────────
   GEFUNDEN IM DEPLOY-LOG, das Redur am 9. September geschickt hat. Er kam
   wegen einer Namenswarnung; im Upload standen zwischen 290 Zeilen diese:

       + /Redur_Babat_FZ_MOE_Lehrpersonen.pdf
       + /Schul Inhalt

   Fünf Megabyte Zeugnis unter einer ratbaren Adresse. Das Verzeichnis ist
   privat, die veröffentlichte Seite nicht — und dazwischen lag nur diese
   Ausschlussliste, die es nicht wusste.

   DIE ZUSAGE IST BEWUSST BREITER ALS DER FUND: nicht „diese eine PDF",
   sondern KEINE PDF und KEINE Sicherung aus der Wurzel. Eine Zusage, die
   den gefundenen Dateinamen aufzählt, hält genau bis zur nächsten Datei. */
console.log('\n1b · Persönliches bleibt draussen');
{
  /* `/chronik/` MIT SCHRÄGSTRICH VORNE (E524): ohne ihn griff das Muster auf
     jeder Ebene und nahm `quell/bereiche/chronik/` mit — zwei Skripte, die
     der Browser wirklich lädt. §1d misst genau diese Gegenrichtung. */
  const rausMuster = ['*.pdf', '*.redion', '/chronik/', 'quell/entwicklung/'];
  for (const m of rausMuster)
    p('… schliesst ' + m + ' aus', zeilen.includes(m), zeilen.join(' · '));

  /* UND JETZT GEGEN DIE WIRKLICHKEIT, nicht gegen die Liste: was liegt
     tatsächlich in der Wurzel, das keiner der Ausschlüsse fasst? */
  const wurzel = fs.readdirSync(WURZEL, { withFileTypes: true });
  /* DER STERN STEHT NICHT NUR AM ANFANG. Der erste Wurf dieses Matchers
     kannte `*.pdf` und `name*`, aber nicht `tsconfig*.json` — und meldete
     vier tsconfig-Dateien als Leck, die längst ausgeschlossen waren. Ein
     Wächter, der falschen Alarm gibt, wird nach dem zweiten Mal ignoriert;
     also richtig: das Muster wird zu einem Ausdruck. */
  const alsMuster = (z: string): RegExp =>
    new RegExp('^' + z.replace(/[.+^${}()|[\]\\]/g, '\\$&')
                       .replace(/\*/g, '.*') + '$');
  const faellt = (name: string, istOrdner: boolean): boolean =>
    zeilen.some(z => {
      /* Ein führender Schrägstrich verankert an der Wurzel — für diese
         Zählung, die nur die Wurzel ansieht, heisst das: abschneiden. */
      const m = z.startsWith('/') ? z.slice(1) : z;
      if (m.endsWith('/')) return istOrdner && name === m.slice(0, -1);
      return alsMuster(m).test(name);
    });
  const geht = wurzel.filter(e => !faellt(e.name, e.isDirectory()))
    .map(e => e.name + (e.isDirectory() ? '/' : ''));
  /* Was gehen DARF — nachgesehen in index.html, nicht geraten. */
  const erlaubt = new Set(['index.html', 'sw.js', 'quell/', 'oeffentlich/',
    'lernpakete/', 'redion-einzeldatei.html', 'worker.ts']);
  const zuviel = geht.filter(n => !erlaubt.has(n));
  p('In der Wurzel geht nichts ins Netz, was dort nicht hingehört',
    zuviel.length === 0, JSON.stringify(zuviel));
  /* DIE PERSÖNLICHE DATEI IST NOCH DA — sie wurde nicht gelöscht (§43),
     sie geht nur nicht mehr mit. Beides gehört gemessen: eine Zusage, die
     auch nach dem Löschen grün bliebe, hielte das Falsche fest. */
  const pdf = 'Redur_Babat_FZ_MOE_Lehrpersonen.pdf';
  p('Die persönliche Datei liegt weiterhin im Verzeichnis (nichts gelöscht)',
    fs.existsSync(path.join(WURZEL, pdf)));
  p('… und ist von der Veröffentlichung ausgenommen', faellt(pdf, false));
}

/* ── §1d — WAS DER BROWSER LÄDT, DARF NIE AUSGESCHLOSSEN SEIN (E524) ──────
   DER FEHLER, DEN ES GEFANGEN HÄTTE, war einen Bogen alt und stand live:
   E520 schrieb `chronik/` in die Ausschlussliste, um die Quelle der Chronik
   draussen zu halten. Ein gitignore-Muster ohne führenden Schrägstrich
   greift aber auf JEDER Ebene — es nahm `quell/bereiche/chronik/` mit, und
   dort liegen die zwei Skripte, die `index.html` mit `<script>` lädt.

   Auf der veröffentlichten Seite hätten beide ein blankes 404 bekommen:
   `worker.ts` reicht nur Adressen OHNE Punkt an die Startseite weiter.
   Redion hätte also im Netz einen toten Bereich gehabt, und der Dienst
   hätte seine Ablage nicht vollständig füllen können.

   §1 misst, was DRAUSSEN bleiben muss. Hier steht die Gegenrichtung, und
   sie ist die gefährlichere: was DRIN bleiben muss. Eine Ausschlussliste,
   die zu viel fängt, macht keinen Lärm — die Seite ist einfach kaputt.

   GEMESSEN MIT GIT SELBST, nicht mit einem nachgebauten Musterabgleich:
   `.assetsignore` wird in ein leeres Verzeichnis als `.gitignore` kopiert
   und `git check-ignore` gefragt. Das ist dieselbe Bibliothek, deren
   Regeln Wrangler folgt — ein eigener Abgleich hätte genau den Fehler
   wiederholt, den er finden soll (der erste Wurf von §1b kannte den Stern
   in der Mitte nicht). */
console.log('\n1d · Was der Browser lädt, bleibt drin');
{
  const html = lies('index.html');
  const sw = lies('sw.js');
  /* Alles, was die Startseite wirklich holt, und alles aus dem Grundstock. */
  const ausHtml = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(m => m[1] ?? '')
    .filter(w => /^(quell|oeffentlich|lernpakete)\//.test(w) || w === 'sw.js');
  const ausSw = [...sw.matchAll(/'((?:quell|oeffentlich|lernpakete)\/[^']+)'/g)]
    .map(m => m[1] ?? '');
  const gebraucht = [...new Set([...ausHtml, ...ausSw, 'index.html', 'sw.js'])];
  p('Es ist eine ernstzunehmende Menge Dateien', gebraucht.length >= 50, String(gebraucht.length));

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'assets-'));
  let ausgeschlossen: string[] = [];
  try {
    spawnSync('git', ['init', '-q', '.'], { cwd: tmp });
    fs.writeFileSync(path.join(tmp, '.gitignore'), ignore);
    for (const w of gebraucht) {
      const ziel = path.join(tmp, w);
      fs.mkdirSync(path.dirname(ziel), { recursive: true });
      fs.writeFileSync(ziel, '');
    }
    const r = spawnSync('git', ['check-ignore', ...gebraucht], { cwd: tmp, encoding: 'utf8' });
    ausgeschlossen = (r.stdout || '').split('\n').map((z: string) => z.trim()).filter(Boolean);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  p('Keine einzige davon ist ausgeschlossen',
    ausgeschlossen.length === 0, JSON.stringify(ausgeschlossen.slice(0, 8)));
  /* UND DIE QUELLE DER CHRONIK BLEIBT DRAUSSEN — beides zugleich, sonst
     hätte man den einen Fehler gegen den anderen getauscht. */
  p('Die Chronik-Quelle in der Wurzel bleibt trotzdem draussen',
    zeilen.includes('/chronik/'), zeilen.filter(z => z.includes('chronik')).join(' · '));
}

/* ── §1c — DER WORKER HEISST WIE BEI CLOUDFLARE (E520) ────────────────────
   Wrangler warnte bei jedem Bau: der Name hier war `redion`, Cloudflare
   erwartete `red-ion`, und es überschrieb ihn. Es lief — aber eine Warnung,
   die immer kommt, liest niemand mehr, und dann übersieht man die daneben.
   Genau das ist im selben Log passiert: unter der Namenswarnung stand der
   Fehler, an dem der Deploy wirklich scheiterte. */
console.log('\n1c · Der Worker heisst wie bei Cloudflare');
{
  const toml = lies('wrangler.toml');
  const name = /^name = "([^"]+)"/m.exec(toml)?.[1];
  gleich('Der Worker heisst red-ion', name, 'red-ion');
  /* UND DIE DATENBANK HEISST WEITER redion. Zwei verschiedene Dinge; sie
     anzugleichen wäre eine andere Datenbank. */
  const db = /database_name = "([^"]+)"/.exec(toml)?.[1];
  gleich('Die D1-Datenbank heisst weiterhin redion', db, 'redion');
}

/* ==========================================================================
 * §2 — /api/stand nennt den Dateispeicher, in beiden Zweigen
 * ========================================================================*/
console.log('\n2 · /api/stand nennt auch den Dateispeicher');
const kernQuelle = lies('server/kern.ts');
const cfQuelle = lies('server/cloudflare.ts');
p('server/kern.ts gibt `dateien` mit aus', /dateien:\s*umwelt/.test(kernQuelle),
  'sonst kann die Oberfläche nicht sagen, dass R2 fehlt');
p('server/cloudflare.ts tut es im Zweig OHNE Datenbank auch',
  /dateien:\s*env\s*&&\s*env\.R2/.test(cfQuelle),
  'genau dieser Zweig läuft vor `wrangler d1 create` — er ist der wichtigere');

/* ==========================================================================
 * Ab hier im Browser
 * ========================================================================*/
const browser = await chromium.launch();
const seite = await browser.newPage({ viewport: { width: 1360, height: 950 } });
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 140)));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForFunction(() => typeof Store !== 'undefined' &&
  typeof App !== 'undefined' &&
  typeof (window as any).OrdnerSicherung !== 'undefined',
  null, { timeout: 30000 });
await seite.waitForTimeout(1100);
await seite.evaluate(() => {
  Store.setMeta('rundgangGesehen', true);
  document.querySelector('.produkt-onboarding-lage')?.remove();
  document.getElementById('rg-willkommen')?.remove();
  const s = Store.addPage(null, { text: 'Ohmsches Gesetz' });
  Store.addBlock(s.id, 'text', { text: 'U = R · I' });
  App.oeffne(s.id);
});
await seite.waitForTimeout(600);

/* ==========================================================================
 * §3 — takt() gibt die Millisekunden zurück
 * ========================================================================*/
console.log('\n3 · wolkeTakt wird gelesen (vorher stand 120 s fest im Code)');
/* Ohne Anmeldung ist die Antwort in jedem Fall 0 — das ist richtig so und
   deshalb kein Beweis. Für die Zahlen wird eine Anmeldung vorgetäuscht. */
const taktOhne = await seite.evaluate(() => Wolke.takt());
p('Ohne Konto läuft kein Zeitgeber', taktOhne === 0, String(taktOhne));
const takte = await seite.evaluate(() => {
  /* Nur der Prüfung wegen: `angemeldet()` ist `!!token()`, und der Schlüssel
     steht unter `wolkeToken`. */
  Store.setMeta('wolkeToken', 'attrappe-schluessel');
  const raus: Record<string, number> = {};
  raus['aus'] = Wolke.taktSetzen('0');
  raus['zehn'] = Wolke.taktSetzen('600');
  raus['zwei'] = Wolke.taktSetzen('120');
  raus['unsinn'] = Wolke.taktSetzen('keine Zahl');
  return raus;
});
p('„0" heisst kein Zeitgeber — nicht „sofort"', takte['aus'] === 0, JSON.stringify(takte));
p('„600" ergibt 600 000 ms', takte['zehn'] === 600000, JSON.stringify(takte));
p('„120" ergibt 120 000 ms', takte['zwei'] === 120000, JSON.stringify(takte));
/* Ein unmöglicher Wert darf den Abgleich nicht anhalten — aber er darf
   auch nicht als Erfolg durchgehen. `-1` sagt beides: nicht genommen, alter
   Takt läuft weiter. */
p('Unsinn wird abgelehnt (-1) statt still übernommen', takte['unsinn'] === -1,
  JSON.stringify(takte));
p('… und der vorige Takt läuft weiter, statt auszusetzen',
  await seite.evaluate(() => Wolke.takt()) === 120000);
p('Der Wert steht danach wirklich in der Ablage',
  await seite.evaluate(() => String(Store.getMeta('wolkeTakt', ''))) === '120');

/* ==========================================================================
 * §4 — Mein Konto: die Wahrheit, und der Weg zum vorhandenen Fenster
 * ========================================================================*/
console.log('\n4 · „Mein Konto" sagt die Wahrheit (§47) und baut keinen zweiten Dialog (E29)');
await seite.evaluate(() => {
  Store.setMeta('wolkeToken', '');
  Einstellungen.oeffne('konto');
});
await seite.waitForTimeout(400);
const kontoText = await seite.evaluate(() =>
  (document.querySelector('.overlay')?.textContent || ''));
for (const luege of ['kennt kein Konto und keinen Server',
                     'es gibt keine Anmeldung',
                     'Nichts wird übertragen'])
  p('Der Satz „' + luege + '" steht nicht mehr da', !kontoText.includes(luege),
    kontoText.slice(0, 160));
p('Stattdessen führt ein Knopf zum Wolke-Fenster',
  await seite.evaluate(() => !!document.querySelector('[data-tun="wolke-oeffnen"]')));
const vorherOverlays = await seite.evaluate(() =>
  document.querySelectorAll('.overlay').length);
await seite.evaluate(() =>
  (document.querySelector('[data-tun="wolke-oeffnen"]') as HTMLElement)?.click());
await seite.waitForTimeout(700);
const nachherOverlays = await seite.evaluate(() =>
  document.querySelectorAll('.overlay').length);
p('… und öffnet GENAU EIN Fenster (das Einstellungsblatt schliesst dabei)',
  nachherOverlays === 1, 'vorher ' + vorherOverlays + ', nachher ' + nachherOverlays);

/* ==========================================================================
 * §5 — „Server prüfen" in vier Ausgängen
 * ========================================================================*/
console.log('\n5 · „Server prüfen" sagt in Worten, was fehlt');
const pruefe = async (antwort: any): Promise<string> => {
  standAntwort = antwort;
  return await seite.evaluate(async () => {
    const ziel = document.createElement('div');
    document.body.appendChild(ziel);
    /* Die Adresse zeigt auf die Attrappe — `Wolke.ruf` nimmt sie von dort. */
    Store.setMeta('wolkeAdresse', 'http://localhost:9049');
    await (WolkeFenster as any).serverPruefen(ziel);
    const t = ziel.textContent || '';
    ziel.remove();
    return t;
  });
};
const ohneDb = await pruefe({ ablage: 'keine', dateien: 'keine' });
p('Fehlt die Datenbank, nennt es den Befehl `wrangler d1 create redion`',
  ohneDb.includes('wrangler d1 create redion') && ohneDb.includes('Datenbank fehlt'),
  ohneDb.slice(0, 160));
const ohneR2 = await pruefe({ ablage: 'd1', dateien: 'keine' });
p('Fehlt nur der Dateispeicher, sagt es genau das — und nicht „alles kaputt"',
  ohneR2.includes('wrangler r2 bucket create redion-dateien') &&
  ohneR2.includes('Dateispeicher fehlt'), ohneR2.slice(0, 160));
const bereit = await pruefe({ ablage: 'd1', dateien: 'r2' });
p('Steht beides, sagt es „Alles bereit"',
  bereit.includes('Alles bereit') && bereit.includes('d1') && bereit.includes('r2'),
  bereit.slice(0, 160));
const wegVom = await seite.evaluate(async () => {
  const ziel = document.createElement('div');
  document.body.appendChild(ziel);
  Store.setMeta('wolkeAdresse', 'http://localhost:9099');   /* da lauscht nichts */
  await (WolkeFenster as any).serverPruefen(ziel);
  const t = ziel.textContent || '';
  ziel.remove();
  return t;
});
p('Antwortet nichts, heisst es „Nicht erreichbar" statt stiller Leere',
  wegVom.includes('Nicht erreichbar'), wegVom.slice(0, 160));

/* ==========================================================================
 * §6 — Das Teilen-Menü
 * ========================================================================*/
console.log('\n6 · Das Teilen-Menü behauptet nicht mehr, es gäbe keine Freigabe');
const teilenQuelle = lies('quell/bereiche/wissen/werkzeuge.js');
p('Der Satz „Es gibt keinen Server und kein Konto" steht nicht mehr im Code',
  !teilenQuelle.includes('Es gibt keinen Server und kein Konto'),
  'vierzehn Zeilen darüber ruft dieselbe Datei WolkeFenster.teilenFenster()');

/* ==========================================================================
 * §7 — DIE SICHERUNGS-FALLE
 * ========================================================================*/
console.log('\n7 · Der Ordnerzugriff: nicht in die Sicherung, und er überlebt das Einspielen');
const sicherung = await seite.evaluate(async () => {
  /* Ein Platzhalter statt eines echten Zugriffs: `importAll` schreibt `meta`
     in eine IndexedDB-Transaktion, und ein Objekt mit Funktionen liesse sich
     dort nicht klonen. Für die Rettungslogik zählt nur, dass etwas da ist. */
  Store.cache.meta['sicherungOrdner'] = { kind: 'directory', name: 'iCloudRedion' };
  Store.setMeta('sicherungOrdnerName', 'iCloudRedion');
  await Store.exportVorbereiten();
  return Store.exportAll();
});
const paket = JSON.parse(sicherung);
p('Der Zugriff selbst ist NICHT in der Sicherung',
  !('sicherungOrdner' in (paket.meta || {})),
  'JSON.stringify macht daraus `{}` — und das überschriebe beim Einspielen einen lebenden Zugriff');
p('Der Name bleibt als Text drin (man soll lesen können, welcher Ordner es war)',
  paket.meta?.['sicherungOrdnerName'] === 'iCloudRedion');
p('`fehlt` nennt ihn — eine Sicherung muss sagen, was sie auslässt (§52.10)',
  Array.isArray(paket.fehlt) && paket.fehlt.includes('sicherungOrdner'),
  JSON.stringify(paket.fehlt));
p('… und `hinweis` sagt es in einem Satz, mit dem Namen',
  String(paket.hinweis || '').includes('Sicherungsordner') &&
  String(paket.hinweis).includes('iCloudRedion'),
  String(paket.hinweis || '').slice(0, 200));

const nachErsetzen = await seite.evaluate(async () => {
  const roh = Store.exportAll();
  await Store.importAll(roh, 'ersetzen');
  const o = Store.getMeta('sicherungOrdner', null);
  return { da: !!o, name: o ? String(o.name || '') : '' };
});
p('Nach „ersetzen" steht der lebende Zugriff noch — die Sicherung kennt ihn nicht',
  nachErsetzen.da && nachErsetzen.name === 'iCloudRedion', JSON.stringify(nachErsetzen));

const nachZusammen = await seite.evaluate(async () => {
  /* Der andere Weg herum: eine ältere oder von Hand gebaute Sicherung bringt
     das `{}` mit, das `JSON.stringify` aus einem Zugriff macht. */
  const d = JSON.parse(Store.exportAll());
  d.meta['sicherungOrdner'] = {};
  d.meta['sicherungOrdnerName'] = 'FremdesGeraet';
  await Store.importAll(JSON.stringify(d), 'zusammenfuehren');
  const o = Store.getMeta('sicherungOrdner', null);
  return { name: o ? String(o.name || '') : '',
           anzeige: String(Store.getMeta('sicherungOrdnerName', '')) };
});
p('Eine Sicherung mit `{}` überschreibt den lebenden Zugriff NICHT',
  nachZusammen.name === 'iCloudRedion', JSON.stringify(nachZusammen));
p('… und der angezeigte Name bleibt der des eigenen Geräts',
  nachZusammen.anzeige === 'iCloudRedion', JSON.stringify(nachZusammen));

/* ==========================================================================
 * §8 — zuLoeschen als reine Funktion
 * ========================================================================*/
console.log('\n8 · zuLoeschen: Fremdes bleibt liegen');
const T = (tag: string, zeit = '1200') =>
  'redion-sicherung-' + tag + '-' + zeit + '.redion';
const loeschErg = await seite.evaluate(({ namen, jetzt }: any) =>
  OrdnerSicherung.zuLoeschen(namen, jetzt, ''), {
  namen: [
    T('2026-08-30'), T('2026-08-29'), T('2026-08-28'),      /* frisch */
    T('2026-06-15'), T('2026-06-02'),                        /* Juni: einer bleibt */
    T('2026-05-20'),                                          /* Mai: der einzige */
    'Steuererklaerung.pdf', 'redion-sicherung.redion',
    'redion-sicherung-2026-06-15-1200.txt', 'Urlaubsbilder'
  ],
  jetzt: Date.UTC(2026, 7, 30, 12, 0)
});
p('Nichts Fremdes wird genannt', !loeschErg.some((n: string) =>
  ['Steuererklaerung.pdf', 'redion-sicherung.redion',
   'redion-sicherung-2026-06-15-1200.txt', 'Urlaubsbilder'].includes(n)),
  loeschErg.join(' · '));
p('Die letzten sieben Tage bleiben vollständig liegen',
  !loeschErg.includes(T('2026-08-30')) && !loeschErg.includes(T('2026-08-29')) &&
  !loeschErg.includes(T('2026-08-28')), loeschErg.join(' · '));
p('Vom Juni bleibt die jüngste, die ältere geht',
  loeschErg.includes(T('2026-06-02')) && !loeschErg.includes(T('2026-06-15')),
  loeschErg.join(' · '));
p('Der einzige Mai-Eintrag bleibt', !loeschErg.includes(T('2026-05-20')),
  loeschErg.join(' · '));
const mitSchutz = await seite.evaluate(({ namen, jetzt, schutz }: any) =>
  OrdnerSicherung.zuLoeschen(namen, jetzt, schutz), {
  namen: [T('2026-06-15'), T('2026-06-02')],
  jetzt: Date.UTC(2026, 7, 30, 12, 0), schutz: T('2026-06-02')
});
p('Die eben geschriebene Datei wird nie genannt',
  !mitSchutz.includes(T('2026-06-02')), mitSchutz.join(' · '));
p('Bei einer einzigen Datei wird gar nichts gelöscht',
  (await seite.evaluate(({ n, j }: any) => OrdnerSicherung.zuLoeschen(n, j, ''),
    { n: [T('2020-01-01')], j: Date.UTC(2026, 7, 30) })).length === 0);

/* ==========================================================================
 * §9 — Der Abdruck
 * ========================================================================*/
console.log('\n9 · Der Abdruck ändert sich bei echten Änderungen — und nur dann');
const abdruecke = await seite.evaluate(async () => {
  const warte = (ms: number) => new Promise(f => setTimeout(f, ms));
  const a = OrdnerSicherung.standAbdruck();
  Store.setMeta('sicherung:zuletzt', new Date().toISOString());
  Store.setMeta('irgendeineEinstellung', 'anders');
  const b = OrdnerSicherung.standAbdruck();
  const s = Store.addPage(null, { text: 'Neue Seite' });
  const c = OrdnerSicherung.standAbdruck();
  await warte(30);
  Store.updateBlock(s.id, { text: 'Ein deutlich längerer Text als vorher' });
  const d = OrdnerSicherung.standAbdruck();
  return { a, b, c, d };
});
p('Eine Marke in `meta` ändert ihn NICHT — sonst sichert Redion endlos im Kreis',
  abdruecke.a === abdruecke.b, JSON.stringify(abdruecke));
p('Eine neue Seite ändert ihn', abdruecke.b !== abdruecke.c, JSON.stringify(abdruecke));
p('Ein geänderter Text ändert ihn auch', abdruecke.c !== abdruecke.d,
  JSON.stringify(abdruecke));

/* ==========================================================================
 * §10 — Ohne showDirectoryPicker ein Satz statt eines Knopfs
 * ========================================================================*/
console.log('\n10 · Kann der Browser es nicht, steht ein Satz da und kein Knopf (§47)');
const ohnePicker = await browser.newPage({ viewport: { width: 1360, height: 950 } });
await ohnePicker.addInitScript(() => {
  /* Safari auf iPhone und Firefox nachgestellt. */
  delete (window as any).showDirectoryPicker;
}).catch(() => {});
await ohnePicker.goto(`http://localhost:${PORT}/index.html`);
await ohnePicker.waitForFunction(() => typeof Store !== 'undefined' &&
  typeof (window as any).OrdnerSicherung !== 'undefined', null, { timeout: 30000 });
await ohnePicker.waitForTimeout(900);
await ohnePicker.evaluate(() => {
  Store.setMeta('rundgangGesehen', true);
  document.querySelector('.produkt-onboarding-lage')?.remove();
  Einstellungen.oeffne('daten');
});
await ohnePicker.waitForTimeout(400);
const ohneText = await ohnePicker.evaluate(() =>
  (document.querySelector('.overlay')?.textContent || ''));
p('`moeglich()` sagt nein', await ohnePicker.evaluate(() => OrdnerSicherung.moeglich()) === false);
p('Es steht ein erklärender Satz da', ohneText.includes('nicht möglich') ||
  ohneText.includes('keinen Ordner behalten'), ohneText.slice(0, 200));
p('… und KEIN Knopf, der beim Drücken nichts täte',
  await ohnePicker.evaluate(() =>
    !document.querySelector('[data-tun="ordner-sicherung-an"]')));
await ohnePicker.close();

/* ==========================================================================
 * §11 — Eine echte Runde mit 5-MB-Anhang
 * ========================================================================*/
console.log('\n11 · Eine echte Runde: 5-MB-Anhang, Handle-Attrappe, gültiges ZIP');
const runde = await seite.evaluate(async () => {
  const seiteId = Object.values<any>(Store.cache.blocks)
    .find(x => x && x.type === 'page' && x.alive)?.id ||
    Object.keys(Store.cache.blocks)[0];
  const b = Store.addBlock(seiteId, 'datei', { text: '' });
  const bytes = new Uint8Array(5 * 1024 * 1024);
  for (let i = 0; i < bytes.length; i += 4096) bytes[i] = i % 251;
  await Dateien.ablegen(new File([bytes], 'video.bin',
    { type: 'application/octet-stream' }), { blockId: b.id, name: 'video.bin' });

  /* Die Ordner-Attrappe. Sie merkt sich, was geschrieben und was gelöscht
     wurde — mehr braucht diese Prüfung nicht. Sie wird direkt in den
     Zwischenspeicher gelegt und nicht über `setMeta`: ein Objekt mit
     Funktionen liesse sich in IndexedDB nicht klonen. */
  const geschrieben: { name: string; bytes: Uint8Array }[] = [];
  const geloescht: string[] = [];
  /* Zwei aus demselben Januar: von denen darf genau die ältere weg. Die
     Februar-Datei ist die einzige ihres Monats und bleibt, die PDF ist
     nicht unsere. */
  const vorhanden = ['redion-sicherung-2020-01-01-1200.redion',
                     'redion-sicherung-2020-01-20-1200.redion',
                     'redion-sicherung-2020-02-01-1200.redion',
                     'Steuern-2019.pdf'];
  const attrappe: any = {
    kind: 'directory', name: 'iCloudRedion',
    queryPermission: async () => 'granted',
    requestPermission: async () => 'granted',
    getFileHandle: async (n: string) => ({
      createWritable: async () => {
        const teile: BlobPart[] = [];
        return {
          write: async (x: BlobPart) => { teile.push(x); },
          close: async () => {
            const blob = new Blob(teile);
            geschrieben.push({ name: n,
              bytes: new Uint8Array(await blob.arrayBuffer()) });
          }
        };
      }
    }),
    values: async function* () {
      for (const n of vorhanden) yield { kind: 'file', name: n };
      for (const g of geschrieben) yield { kind: 'file', name: g.name };
      yield { kind: 'directory', name: 'redion-sicherung-2019-01-01-1200.redion' };
    },
    removeEntry: async (n: string) => { geloescht.push(n); }
  };
  Store.cache.meta['sicherungOrdner'] = attrappe;

  const erg = await OrdnerSicherung.jetztSichern(false);
  const g = geschrieben[0];
  const kopf = g ? Array.from(g.bytes.slice(0, 4)) : [];
  const text = g ? new TextDecoder('latin1').decode(g.bytes) : '';
  return {
    ok: erg.ok, grund: erg.grund, datei: erg.datei,
    anzahl: geschrieben.length, groesse: g ? g.bytes.length : 0,
    kopf, hatDaten: text.includes('daten.json'), hatVideo: text.includes('video.bin'),
    geloescht,
    abdruck: String(Store.getMeta('sicherungOrdnerAbdruck', '')),
    zuletzt: String(Store.getMeta('sicherungOrdnerZuletzt', '')),
    art: String(Store.getMeta('sicherung:art', ''))
  };
});
p('Die Sicherung kam zustande', runde.ok, runde.grund);
p('Genau eine Datei geschrieben, und ihr Name passt aufs eigene Muster',
  runde.anzahl === 1 &&
  /^redion-sicherung-\d{4}-\d{2}-\d{2}-\d{4}\.redion$/.test(String(runde.datei)),
  String(runde.datei));
p('Es ist ein gültiges ZIP (PK\\x03\\x04) und nicht ein leerer Blob',
  runde.kopf.join(',') === '80,75,3,4', JSON.stringify(runde.kopf));
p('Der 5-MB-Anhang ist wirklich drin (die Datei ist grösser als 5 MB)',
  runde.groesse > 5 * 1024 * 1024, runde.groesse + ' Bytes');
p('daten.json und video.bin stehen im Verzeichnis des Archivs',
  runde.hatDaten && runde.hatVideo,
  'daten.json ' + runde.hatDaten + ', video.bin ' + runde.hatVideo);
p('Aufgeräumt wurde nur nach dem eigenen Muster — die fremde PDF blieb liegen',
  !runde.geloescht.includes('Steuern-2019.pdf') &&
  runde.geloescht.includes('redion-sicherung-2020-01-01-1200.redion') &&
  !runde.geloescht.includes('redion-sicherung-2020-02-01-1200.redion'),
  runde.geloescht.join(' · '));
p('… und kein Verzeichnis, auch nicht eines mit passendem Namen',
  !runde.geloescht.includes('redion-sicherung-2019-01-01-1200.redion'),
  runde.geloescht.join(' · '));
p('Der Abdruck ist danach vermerkt — sonst sicherte der nächste Takt sofort wieder',
  !!runde.abdruck && !!runde.zuletzt, JSON.stringify(runde));
p('`Sicherung.merken` wurde gerufen: die Sicherung gilt als redion-Sicherung',
  runde.art === 'redion', runde.art);

/* Und der Fall ohne Erlaubnis — er darf nicht still durchgehen. */
const ohneRecht = await seite.evaluate(async () => {
  const o = Store.cache.meta['sicherungOrdner'];
  o.queryPermission = async () => 'prompt';
  const erg = await OrdnerSicherung.jetztSichern(false);
  return { ok: erg.ok, fehler: OrdnerSicherung.fehler() };
});
p('Ist die Erlaubnis weg, wird NICHT gesichert und es steht ein Satz da',
  !ohneRecht.ok && ohneRecht.fehler.includes('nicht mehr'),
  JSON.stringify(ohneRecht));

/* ==========================================================================
 * §12 — Bau-Hygiene
 * ========================================================================*/
console.log('\n12 · Bau-Hygiene');
p('index.html lädt quell/kern/helfer/ordnersicherung.js',
  lies('index.html').includes('quell/kern/helfer/ordnersicherung.js'));
p('Der Dienst-Arbeiter cacht sie mit (sonst fehlt sie offline)',
  lies('src/dienst/sw.ts').includes('./quell/kern/helfer/ordnersicherung.js'));
p('Die Einzeldatei enthält sie auch',
  lies('redion-einzeldatei.html').includes('OrdnerSicherung'),
  'nach Änderungen `node bauen.mts` laufen lassen (§29)');
p('SERVER-EINRICHTEN.md nennt den echten Ordner, nicht „Redion-App"',
  lies('SERVER-EINRICHTEN.md').includes('Redion-src') &&
  !lies('SERVER-EINRICHTEN.md').includes('Redion-App'));
p('CLOUDFLARE.md behauptet keinen public/-Ordner mehr',
  !/^public\/\s+←/m.test(lies('CLOUDFLARE.md')));
p('… und nennt das richtige Repository',
  lies('CLOUDFLARE.md').includes('Redurbabat/Redion'));
p('Keine Fehler auf der Seite', fehler.length === 0, fehler.join(' | '));

await browser.close();
server.close();
attrappe.close();
console.log('\n  Suite 270 — Daten auf allen Geräten: ' + ok + ' ok, ' + weg + ' offen');
process.exit(weg ? 1 : 0);
