/* Suite 434 — Vier Lader, vier Auskünfte, und keiner erfindet einen Anteil (E461)
 * ============================================================================
 * `fluss` zeigt einen Anteil, weil es einen gibt. `sterne`, `wort` und
 * `presse` zeigen keinen, weil es keinen gibt. Das ist der ganze Punkt:
 * ein Kreisel für alles sagt bei jedem Vorgang dasselbe, nämlich nichts.
 *
 *   §1 DAS BAUTEIL: `role="status"` am Wirt, `aria-hidden` an jedem Bild,
 *      ein Satz daneben; `fluss` schreibt seine Zahl ALS TEXT (§38) und
 *      lässt sie weg, wenn es keinen Anteil gibt.
 *   §2 DIE MASKE IST JE INSTANZ EIGEN. Zwei Ringe auf einer Seite teilen
 *      sich sonst die Maske — der Befund aus E440 zum KI-Funken.
 *   §3 DER STAND STEIGT WIRKLICH: die Oberfläche des Ringes steht bei
 *      0 %, 42 % und 100 % an drei verschiedenen Höhen, und die Zahl
 *      stimmt mit der Höhe überein.
 *   §4 AM ECHTEN AUFTRAGSFENSTER: ein `pdf-bilder`-Auftrag bekommt die
 *      Presse, ein Auftrag ohne bekannte Schrittzahl die Sterne, und ein
 *      wartender bekommt KEIN Bild.
 *   §5 DIE VERDRAHTUNG STEHT an den zwei Stellen, die sich hier nicht
 *      auslösen lassen (Modell-Download, Abgleich am Server).
 *   §6 OHNE BEWEGUNG steht alles still, und man sieht trotzdem etwas.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 *   §2 → den Zähler in `lader.ts` durch eine feste ID ersetzen: zwei Ringe
 *        auf einer Seite haben dieselbe. Gelaufen am 6. September 2026, rot.
 *   §4 → in `auftraege.ts` `bildArt` immer '' zurückgeben lassen: die
 *        Presse fehlt. Gelaufen, rot.
 *
 *   node pruefungen/lauf/test434.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9554;
const TYP: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon', '.svg': 'image/svg+xml'
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
const lies = (f: string): string => fs.readFileSync(path.join(WURZEL, f), 'utf8');

const browser = await chromium.launch();
const fehler: string[] = [];
const oeffne = async (ruhig = false) => {
  const s = await browser.newPage({ viewport: { width: 1280, height: 900 },
    ...(ruhig ? { reducedMotion: 'reduce' as const } : {}) });
  s.on('pageerror', e => fehler.push(e.message.slice(0, 140)));
  s.on('console', m => { if (m.type() === 'error') fehler.push('console: ' + m.text().slice(0, 140)); });
  await s.goto(`http://localhost:${PORT}/index.html`);
  await s.waitForFunction("typeof App !== 'undefined' && typeof Lader !== 'undefined' " +
                          "&& typeof Auftraege !== 'undefined' && typeof AuftragsAnzeige !== 'undefined'",
                          null, { timeout: 30000 });
  await s.waitForTimeout(700);
  await s.evaluate(`(() => {
    document.querySelectorAll('.overlay, #rg-willkommen, #rg-einladung, ' +
      '.produkt-onboarding-lage').forEach(x => x.remove());
    Store.setMeta('rundgangGesehen', true);
  })()`);
  return s;
};

const s = await oeffne();

console.log('\n§1 Das Bauteil: ein Bild, ein Satz, und die Zahl als Text');
const bauteil = JSON.parse(await s.evaluate(`JSON.stringify((() => {
  const raus = {};
  for (const art of ['fluss', 'sterne', 'wort', 'presse']) {
    const g = Lader.bauen({ art, text: 'Probe ' + art, ...(art === 'wort' ? { wort: 'Abgleich' } : {}) });
    document.body.append(g.element);
    raus[art] = {
      rolle: g.element.getAttribute('role'),
      art: g.element.dataset.art,
      bilderVersteckt: [...g.element.querySelectorAll('.ru-lader-bild')]
        .every(b => b.getAttribute('aria-hidden') === 'true'),
      bilder: g.element.querySelectorAll('.ru-lader-bild').length,
      satz: g.element.querySelector('.ru-lader-text').textContent,
      zahl: g.element.querySelector('.ru-lader-zahl') ? g.element.querySelector('.ru-lader-zahl').textContent : null,
      anteilMarke: g.element.dataset.anteil,
      anteil: g.anteil()
    };
    g.entfernen();
  }
  /* Mit Anteil: die Zahl steht als Text da und stimmt. */
  const mit = Lader.bauen({ art: 'fluss', anteil: 0.42 });
  document.body.append(mit.element);
  const mitZahl = { text: mit.element.querySelector('.ru-lader-zahl').textContent,
    marke: mit.element.dataset.anteil, wert: mit.anteil(),
    satz: mit.element.querySelector('.ru-lader-text').textContent };
  mit.setzen({ anteil: 0.87, text: 'Fast fertig' });
  const nach = { text: mit.element.querySelector('.ru-lader-zahl').textContent,
    satz: mit.element.querySelector('.ru-lader-text').textContent };
  /* Über 1 und unter 0 werden geklemmt, nicht durchgereicht. */
  mit.setzen({ anteil: 5 });
  const klemm = mit.element.querySelector('.ru-lader-zahl').textContent;
  mit.entfernen();
  const wortZeichen = (() => {
    const g = Lader.bauen({ art: 'wort', wort: 'Abgleich' });
    document.body.append(g.element);
    const n = g.element.querySelectorAll('.ru-lader-buchstabe').length;
    const text = [...g.element.querySelectorAll('.ru-lader-buchstabe')].map(b => b.textContent).join('');
    g.entfernen();
    return { n, text };
  })();
  return { raus, mitZahl, nach, klemm, wortZeichen };
})())`) as string);
for (const art of ['fluss', 'sterne', 'wort', 'presse']) {
  const w = bauteil.raus[art];
  p(art + ': ist eine Statuszeile mit Satz',
    w.rolle === 'status' && w.satz === 'Probe ' + art, JSON.stringify(w));
  p(art + ': das Bild ist für Vorleser unsichtbar', w.bilderVersteckt && w.bilder === 1);
}
p('Ohne Anteil steht keine Zahl da — „0 %" wäre eine Behauptung',
  bauteil.raus.fluss.zahl === '' && bauteil.raus.fluss.anteilMarke === 'unbekannt' &&
  bauteil.raus.fluss.anteil === null, JSON.stringify(bauteil.raus.fluss));
p('Nur `fluss` hat überhaupt eine Zahl',
  ['sterne', 'wort', 'presse'].every(a => bauteil.raus[a].zahl === null));
p('Mit Anteil steht die Zahl als TEXT da (§38)',
  bauteil.mitZahl.text === '42 %' && bauteil.mitZahl.marke === 'bekannt', bauteil.mitZahl.text);
p('… und ohne eigenen Satz steht der Standardsatz',
  bauteil.mitZahl.satz === 'Wird geladen …', bauteil.mitZahl.satz);
p('Nachstellen ändert Zahl und Satz', bauteil.nach.text === '87 %' && bauteil.nach.satz === 'Fast fertig');
p('Ein Wert über 1 wird geklemmt, nicht durchgereicht', bauteil.klemm === '100 %', bauteil.klemm);
p('Das Wort wird in einzelne Buchstaben zerlegt',
  bauteil.wortZeichen.n === 8 && bauteil.wortZeichen.text === 'Abgleich',
  JSON.stringify(bauteil.wortZeichen));

console.log('\n§2 Die Maske ist je Instanz eigen');
const masken = JSON.parse(await s.evaluate(`JSON.stringify((() => {
  const a = Lader.bauen({ art: 'fluss', anteil: 0.3 });
  const b = Lader.bauen({ art: 'fluss', anteil: 0.7 });
  document.body.append(a.element, b.element);
  const id = (g) => g.element.querySelector('mask').getAttribute('id');
  const zeigt = (g) => g.element.querySelector('g[mask]').getAttribute('mask');
  const wert = { a: id(a), b: id(b), zeigtA: zeigt(a), zeigtB: zeigt(b),
    imDokument: document.querySelectorAll('.ru-lader mask').length };
  a.entfernen(); b.entfernen();
  return wert;
})())`) as string);
p('Zwei Ringe haben zwei verschiedene Masken-Kennungen',
  masken.a !== masken.b, masken.a + ' / ' + masken.b);
p('… und jeder zeigt auf SEINE', masken.zeigtA === 'url(#' + masken.a + ')' &&
  masken.zeigtB === 'url(#' + masken.b + ')');

console.log('\n§3 Der Stand steigt wirklich');
const stand = JSON.parse(await s.evaluate(`JSON.stringify((() => {
  const g = Lader.bauen({ art: 'fluss', anteil: 0 });
  document.body.append(g.element);
  const messe = (wert) => {
    g.setzen({ anteil: wert });
    const r = g.element.querySelector('.ru-lader-spiegel');
    return { y: Number(r.getAttribute('y')), h: Number(r.getAttribute('height')),
      zahl: g.element.querySelector('.ru-lader-zahl').textContent,
      welle: Number(g.element.querySelector('.ru-lader-welle').getAttribute('cy')) };
  };
  const wert = { null: messe(0), halb: messe(0.42), voll: messe(1) };
  g.entfernen();
  return wert;
})())`) as string);
p('Bei 0 % ist die Fläche leer', stand.null.h === 0 && stand.null.y === 100, JSON.stringify(stand.null));
p('Bei 42 % steht die Oberfläche bei 58 von 100', stand.halb.y === 58 && stand.halb.h === 42,
  JSON.stringify(stand.halb));
p('Bei 100 % ist sie ganz voll', stand.voll.y === 0 && stand.voll.h === 100);
p('Die Zahl stimmt mit der Höhe überein',
  stand.halb.zahl === '42 %' && stand.voll.zahl === '100 %');
p('Die Wellen sitzen AUF der Oberfläche, nicht in der Mitte',
  stand.halb.welle === stand.halb.y && stand.voll.welle === stand.voll.y,
  stand.halb.welle + ' / ' + stand.halb.y);

console.log('\n§4 Am echten Auftragsfenster');
const auftraege = JSON.parse(await s.evaluate(`(async () => {
  await Auftraege.anlegen('pdf-bilder', { quelleId: 'x' },
    { id: 'probe-presse', schritte: 14, text: 'skript.pdf: Seitenbilder' });
  await Auftraege.anlegen('zip-import', { datei: 'y' },
    { id: 'probe-sterne', schritte: 0, text: 'archiv.zip wird entpackt' });
  await Auftraege.anlegen('zip-import', { datei: 'z' },
    { id: 'probe-wartet', schritte: 9, text: 'zweites Archiv' });
  /* ZWEI VON DREI AUF „laeuft" STELLEN. Ein frisch angelegter Auftrag
     steht auf 'wartet', und ein wartender bekommt bewusst kein Bild —
     genau das prüft der letzte Punkt unten. */
  for (const id of ['probe-presse', 'probe-sterne']) {
    const a = await Auftraege.einer(id);
    await Store.auftragPut({ ...a, zustand: 'laeuft', schritt: id === 'probe-presse' ? 7 : 3 });
  }
  AuftragsAnzeige.oeffnen();
  await AuftragsAnzeige.auffrischen();
  await new Promise(r => setTimeout(r, 400));
  const zeile = (id) => document.querySelector('.arb-z[data-id="' + id + '"]');
  const bild = (id) => {
    const z = zeile(id);
    if (!z) return 'keine Zeile';
    const l = z.querySelector('.ru-lader');
    return l ? l.dataset.art : 'kein Bild';
  };
  const wert = {
    presse: bild('probe-presse'), sterne: bild('probe-sterne'), wartet: bild('probe-wartet'),
    balkenBeiPresse: !!zeile('probe-presse')?.querySelector('.arb-balken'),
    balkenBeiSternen: !!zeile('probe-sterne')?.querySelector('.arb-balken'),
    standPresse: zeile('probe-presse')?.querySelector('.arb-stand')?.textContent,
    doppelterSatz: zeile('probe-presse')?.querySelectorAll('.ru-lader-text').length,
    vorlese: zeile('probe-presse')?.querySelector('.ru-lader')?.getAttribute('role')
  };
  AuftragsAnzeige.zu();
  for (const id of ['probe-presse', 'probe-sterne', 'probe-wartet'])
    await Auftraege.abbrechen(id).catch(() => {});
  return JSON.stringify(wert);
})()`) as string);
p('Ein `pdf-bilder`-Auftrag bekommt die Presse', auftraege.presse === 'presse', String(auftraege.presse));
p('… und daneben den echten Balken, weil die Zahl bekannt ist', auftraege.balkenBeiPresse);
p('… mit der echten Zahl im Satz', /7 von 14/.test(String(auftraege.standPresse)),
  String(auftraege.standPresse));
p('Ein Auftrag ohne bekannte Schrittzahl bekommt die Sterne',
  auftraege.sterne === 'sterne', String(auftraege.sterne));
p('… und KEINEN Balken (E286)', auftraege.balkenBeiSternen === false);
p('Ein wartender Auftrag bekommt gar kein Bild', auftraege.wartet === 'kein Bild',
  String(auftraege.wartet));
p('Der Satz steht nur EINMAL in der Zeile', auftraege.doppelterSatz === 0,
  String(auftraege.doppelterSatz));
p('Das Bild bleibt trotzdem eine Statuszeile', auftraege.vorlese === 'status');

console.log('\n§5 Die Verdrahtung an den zwei Stellen, die hier nicht laufen');
/* Ein Modell-Download dauert Minuten, ein Abgleich braucht einen Server.
   Was hier geprüft wird, ist deshalb die Verdrahtung — und ausdrücklich
   NICHT, dass sie im Betrieb aussieht wie gedacht. Das steht in L119. */
const ki = lies('src/bereiche/ki/dienst.ts');
p('WebLLM gibt seinen echten Anteil an den Ring weiter',
  /Lader\.bauen\(\{ art: 'fluss'/.test(ki) && /ring\.setzen\(\{ anteil \}\)/.test(ki));
p('… und der alte Balken bleibt als Rückfall', /balken\.className = 'prog'/.test(ki));
const wolke = lies('src/bereiche/verbinden/ansicht/wolke.ts');
p('Der Abgleich bekommt das Wort, keinen Balken',
  /Lader\.bauen\(\{ art: 'wort', wort: 'Abgleich'/.test(wolke) && !/art: 'fluss'/.test(wolke));
p('… und auch dort bleibt der alte Text als Rückfall',
  /else a\.textContent = 'Läuft …'/.test(wolke));

console.log('\n§6 Ohne Bewegung');
const ruhig = await oeffne(true);
const still = JSON.parse(await ruhig.evaluate(`JSON.stringify((() => {
  const namen = {};
  for (const art of ['fluss', 'sterne', 'wort', 'presse']) {
    const g = Lader.bauen({ art, anteil: 0.5, wort: 'Abgleich' });
    document.body.append(g.element);
    const teile = [...g.element.querySelectorAll('*')]
      .map(e => getComputedStyle(e).animationName).filter(n => n && n !== 'none');
    namen[art] = { laufend: teile.length,
      sichtbar: g.element.querySelector('.ru-lader-bild').getBoundingClientRect().height };
    g.entfernen();
  }
  return namen;
})())`) as string);
for (const art of ['fluss', 'sterne', 'wort', 'presse']) {
  p(art + ': nichts bewegt sich', still[art].laufend === 0, String(still[art].laufend));
  p(art + ': das Bild steht trotzdem da', still[art].sichtbar > 20, String(still[art].sichtbar));
}
await ruhig.close();

console.log('\n§7 Eingebunden');
p('index.html lädt lader.js', /quell\/schale\/bedienung\/lader\.js/.test(lies('index.html')));
p('Der GRUNDSTOCK kennt es (§28)', /\.\/quell\/schale\/bedienung\/lader\.js/.test(lies('src/dienst/sw.ts')));
p('Die Quelle ist TypeScript, das .js ist erzeugt',
  fs.existsSync(path.join(WURZEL, 'src/schale/bedienung/lader.ts')) &&
  /ERZEUGT/.test(lies('quell/schale/bedienung/lader.js')));

p('Keine Fehler auf den Seiten', fehler.length === 0, fehler.slice(0, 3).join(' | '));
console.log(`\n${ok}/${ok + weg} bestanden · ✗=${weg}`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
