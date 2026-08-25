/* Suite 188 — Jeder Bereich im Register macht wirklich etwas auf (L51)
 * ============================================================================
 * CLAUDE.md §5 Regel 2: „Neuer Bereich = zwei Register-Einträge." L51 hielt am
 * 24. August fest, dass sechs Module diese Regel nicht einhalten — Lernwelt,
 * Arbeitswelt, Lebensbereiche, Electrical, Recognition und DocumentMode
 * hingen ausschliesslich an `globalThis`.
 *
 * Im Betrieb war das kein Fehler; es lief. Der Preis stand woanders: ein
 * Modul ohne Eintrag ist für jede Übersicht unsichtbar — auch für die
 * nächste Prüfung, die „alle Bereiche" durchgehen will. Diese Suite IST
 * diese Prüfung.
 *
 * ─── WAS SIE PRÜFT, UND WARUM GERADE DAS ────────────────────────────────────
 * Nicht, dass Einträge DA sind — das wäre eine Liste, die sich selbst zählt.
 * Sondern dass jeder Eintrag etwas TUT: `Register.oeffne(id)` muss `true`
 * zurückgeben, ohne zu werfen, und danach muss sich am Bildschirm etwas
 * geändert haben. Ein Eintrag, der nichts aufmacht, wäre genau der tote
 * Knopf aus E118 — nur diesmal in einem Katalog, dem man glaubt.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 * Vier Gegenproben, einzeln an einem Abzug des Baums gesetzt und gemessen:
 *
 *   A  die sechs Einträge wieder aus dem Register nehmen        9 rot
 *   B  `lebensbereiche` wieder auf `workspace('uebersicht')`    1 rot
 *   C  `dokumentmodus` steigt wortlos aus, ohne Meldung         3 rot
 *   D  `Hinweis.toast` schreibt den Text, zeigt ihn aber nie    2 rot
 *
 * B und D sind die interessanten. B IST der Fehler, den diese Suite beim
 * ersten Lauf gefunden hat: der Eintrag rief dieselbe Zeile wie sein
 * Nachbar auf, und auf dem Bildschirm änderte sich nichts. D beweist, dass
 * die Messung am `show`-Zustand hängt und nicht bloss am Text — die erste
 * Fassung suchte `.toast` statt `#toast` und wäre bei einem stummen Modul
 * grün geblieben. Eine Prüfung, die immer „passt schon" sagt, ist keine.
 *
 * §3 ist die Gegenrichtung: eine erfundene Kennung muss `false` ergeben und
 * darf NICHT werfen. Die vollständige Herleitung steht in E158.
 *
 *   node pruefungen/lauf/test222.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8980;

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

const browser = await chromium.launch();
const seite = await browser.newPage({ viewport: { width: 1400, height: 950 } });
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 140)));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForTimeout(2700);
await seite.evaluate(() => {
  Store.setMeta('rundgangGesehen', true);
  document.getElementById('rg-willkommen')?.remove();
  document.querySelectorAll<HTMLElement>('.overlay, .produkt-onboarding-lage').forEach(o => o.remove());
});

/* ==========================================================================
 * §1 · Die sechs aus L51 stehen jetzt im Register
 * ========================================================================*/
console.log('\n1 · Die sechs aus L51 stehen jetzt im Register');

const bestand = await seite.evaluate(() => {
  const alle = Register.module.alle();
  return {
    ids: alle.map((m: any) => String(m.id)),
    ohneName: alle.filter((m: any) => !String(m.name || '').trim()).map((m: any) => m.id),
    ohneWas: alle.filter((m: any) => !String(m.was || '').trim()).map((m: any) => m.id),
    ohneOeffnen: alle.filter((m: any) => typeof m.oeffnen !== 'function').map((m: any) => m.id)
  };
});

for (const id of ['lernwelt', 'arbeitswelt', 'lebensbereiche',
                  'elektro', 'erkennung', 'dokumentmodus'])
  p(`„${id}" hat einen Eintrag`, bestand.ids.includes(id), bestand.ids.join(', '));

/* Und die alten sind nicht verlorengegangen. */
for (const id of ['editor', 'datenbanken', 'wissen', 'ki', 'verbinden',
                  'dateien', 'einstellungen', 'hilfe'])
  p(`Der bisherige Eintrag „${id}" steht noch`, bestand.ids.includes(id));

gleich('Jeder Eintrag hat einen Namen', bestand.ohneName, []);
gleich('Jeder erklärt sich in einem Satz', bestand.ohneWas, []);
gleich('Und jeder weiss, wie er aufmacht', bestand.ohneOeffnen, []);

/* ==========================================================================
 * §2 · Und jeder macht wirklich etwas auf
 * --------------------------------------------------------------------------
 * Der eigentliche Punkt. Eine Liste, die sich selbst zählt, beweist nichts.
 * ========================================================================*/
console.log('\n2 · Und jeder macht wirklich etwas auf');

const geoeffnet = await seite.evaluate(async () => {
  const raus: any[] = [];
  for (const m of Register.module.alle()) {
    /* Sauber anfangen: offene Fenster weg, sonst zählt das vorige mit. */
    document.querySelectorAll<HTMLElement>('.overlay, .menu, .menu-grund').forEach(o => o.remove());
    const vorher = document.body.innerHTML.length + ':' + String(App.aktuelleSeite() || '');
    let ergebnis = false, geworfen = '';
    try { ergebnis = Register.module.oeffne(m.id); }
    catch (e) { geworfen = e instanceof Error ? e.message : String(e); }
    await new Promise(r => setTimeout(r, 500));
    const nachher = document.body.innerHTML.length + ':' + String(App.aktuelleSeite() || '');
    raus.push({ id: String(m.id), ergebnis, geworfen, geaendert: vorher !== nachher });
    document.querySelectorAll<HTMLElement>('.overlay, .menu, .menu-grund').forEach(o => o.remove());
  }
  return raus;
});

gleich('Keiner wirft',
  geoeffnet.filter((x: any) => x.geworfen).map((x: any) => `${x.id}: ${x.geworfen}`), []);
gleich('Jeder meldet Erfolg',
  geoeffnet.filter((x: any) => x.ergebnis !== true).map((x: any) => x.id), []);
gleich('Und bei jedem ändert sich etwas auf dem Bildschirm',
  geoeffnet.filter((x: any) => !x.geaendert).map((x: any) => x.id), []);

/* ==========================================================================
 * §3 · Eine erfundene Kennung ergibt false — und wirft nicht
 * ========================================================================*/
console.log('\n3 · Eine erfundene Kennung ergibt false');

const erfunden = await seite.evaluate(() => {
  let ergebnis: unknown = 'nicht gelaufen', geworfen = '';
  try { ergebnis = Register.module.oeffne('gibtesnicht'); }
  catch (e) { geworfen = e instanceof Error ? e.message : String(e); }
  return { ergebnis, geworfen, eines: Register.module.eines('gibtesnicht') };
});
gleich('Sie ergibt false', erfunden.ergebnis, false);
gleich('Ohne zu werfen', erfunden.geworfen, '');
gleich('Und `eines` gibt null', erfunden.eines, null);

/* ==========================================================================
 * §4 · Der Dokumentmodus sagt, warum es gerade nicht geht
 * --------------------------------------------------------------------------
 * Er braucht eine Seite mit PDF-Seiten oder A4-Blättern. Ohne eine solche
 * stieg `toggle` bisher wortlos aus — aus einem Katalog heraus wäre das
 * genau der tote Knopf aus E118.
 * ========================================================================*/
console.log('\n4 · Der Dokumentmodus sagt, warum es gerade nicht geht');

const ohneDokument = await seite.evaluate(async () => {
  const leer = Store.addPage(null, { text: 'Nur Text', icon: '📝' });
  Store.addBlock(leer.id, 'text', { text: 'Hier ist kein Dokument.' });
  await Store.flush();
  App.oeffne(leer.id);
  await new Promise(r => setTimeout(r, 700));
  /* `#toast` ist EIN festes Element in index.html, das ein- und ausgeblendet
     wird — keine Liste, aus der neue Kacheln wachsen. Ein vorheriger Text
     bliebe darin stehen, also erst leeren, dann auslösen, dann lesen. Die
     erste Fassung dieser Prüfung suchte `.toast` und fand nie etwas: sie
     wäre auch bei einem stummen Modul grün geblieben. */
  const balken = document.getElementById('toast');
  if (balken) { balken.textContent = ''; balken.classList.remove('show'); }
  Register.module.oeffne('dokumentmodus');
  await new Promise(r => setTimeout(r, 400));
  return {
    text: (balken?.classList.contains('show') ? balken.textContent || '' : '').trim(),
    modusAn: Store.getBlock(leer.id)?.dokumentModus === true
  };
});
p('Er meldet sich statt zu schweigen', !!ohneDokument.text, ohneDokument.text || '(nichts)');
p('Und sagt, was er bräuchte',
  /PDF-Seiten|A4-Bl/.test(ohneDokument.text), ohneDokument.text);
p('Ohne den Modus einzuschalten', !ohneDokument.modusAn);

/* Und die Gegenrichtung: MIT einem Dokument schaltet er wirklich um. */
const mitDokument = await seite.evaluate(async () => {
  const s = Store.addPage(null, { text: 'Mit PDF', icon: '📕' });
  Store.addBlock(s.id, 'pdfseite', { nr: 1, suchtext: 'Etwas' });
  await Store.flush();
  App.oeffne(s.id);
  await new Promise(r => setTimeout(r, 700));
  Register.module.oeffne('dokumentmodus');
  await new Promise(r => setTimeout(r, 700));
  return Store.getBlock(s.id)?.dokumentModus === true;
});
p('Mit einem Dokument schaltet er um', mitDokument);

/* ==========================================================================
 * §5 · Die oberste Gruppe der Seitenleiste und ihr Register sagen dasselbe
 * --------------------------------------------------------------------------
 * L51 Teil 2. Der Kopf von `register/navigation.ts` behauptete: „Hier steht
 * die Ordnung. Die Seitenleiste liest sie und zeichnet, was sie findet."
 * Nachgezählt am 25. August: gezeichnet werden 45 Zeilen, im Register standen
 * 12, und gelesen wurde davon einzig `anPlatz('unten')` mit `vonAussen`.
 *
 * DAS IST NICHT NUR UNORDENTLICH, SONDERN GEHT KAPUTT. Ein Katalog, den
 * niemand ausführt, wird still falsch:
 *
 *     suche        rief `Werkzeuge.palette()`   das ist „Befehle"
 *     posteingang  rief `Werkzeuge.meldungen()` das ist die Meldungsliste
 *     ki           stand drin                   und wird nirgends gezeigt
 *
 * Drei falsche Einträge, jahrelang, ohne dass etwas rot wurde — weil sie
 * niemand las. Jetzt hängt `schale.ts` die oberste Gruppe über `knopfId`
 * aus dem Register, und diese Prüfung hält Markup und Register aneinander.
 * ========================================================================*/
console.log('\n5 · Seitenleiste und Register sagen dasselbe');

const leiste = await seite.evaluate(() => {
  const zeilen = [...document.querySelectorAll<HTMLElement>('.side-nav .side-item')]
    .map(b => {
      const teile = [...b.children] as HTMLElement[];
      return { knopfId: b.id,
               name: (teile[1]?.textContent || '').trim(),
               kuerzel: (teile.find(x => x.classList.contains('k'))?.textContent || '').trim() };
    });
  const reg = Register.navigation.anPlatz('oben').map((x: any) => ({
    knopfId: String(x.knopfId || ''), name: String(x.name || ''),
    kuerzel: String(x.kuerzel || ''), hatTun: typeof x.tun === 'function' }));
  return { zeilen, reg };
});

gleich('Gleich viele Zeilen wie Einträge',
  leiste.reg.length, leiste.zeilen.length);
gleich('Und in derselben Folge, Knopf für Knopf',
  leiste.reg.map((x: any) => x.knopfId), leiste.zeilen.map((x: any) => x.knopfId));
gleich('Mit denselben Beschriftungen',
  leiste.reg.map((x: any) => x.name), leiste.zeilen.map((x: any) => x.name));
gleich('Und denselben Tastenkürzeln',
  leiste.reg.map((x: any) => x.kuerzel), leiste.zeilen.map((x: any) => x.kuerzel));
gleich('Jeder Eintrag weiss, was er tut',
  leiste.reg.filter((x: any) => !x.hatTun).map((x: any) => x.knopfId), []);

/* Und die zwei, die falsch waren, sind es nicht mehr. Gemessen wird, WAS
   aufgeht — nicht, dass irgendetwas aufgeht. Ein falscher Eintrag öffnete ja
   durchaus etwas; nur eben das Falsche. */
const zwei = await seite.evaluate(async () => {
  const auf = async (id: string) => {
    document.querySelectorAll<HTMLElement>('.overlay').forEach(o => o.remove());
    document.getElementById(id)?.click();
    await new Promise(r => setTimeout(r, 500));
    const o = document.querySelector('.overlay');
    const raus = { suchfeld: !!o?.querySelector('#q'), befehlsfeld: !!o?.querySelector('#cq') };
    document.querySelectorAll<HTMLElement>('.overlay').forEach(x => x.remove());
    return raus;
  };
  return { suchen: await auf('btn-search'), befehle: await auf('btn-cmd') };
});
p('„Suchen" öffnet die Suche', zwei.suchen.suchfeld && !zwei.suchen.befehlsfeld,
  JSON.stringify(zwei.suchen));
p('„Befehle" öffnet die Befehle', zwei.befehle.befehlsfeld && !zwei.befehle.suchfeld,
  JSON.stringify(zwei.befehle));

/* Und keine Zeile ist tot. */
const tot = await seite.evaluate(async () => {
  const raus: string[] = [];
  for (const b of [...document.querySelectorAll<HTMLElement>('.side-nav .side-item')]) {
    document.querySelectorAll<HTMLElement>('.overlay, .menu').forEach(o => o.remove());
    const vorher = document.body.innerHTML.length + ':' + String(App.aktuelleSeite() || '');
    b.click();
    await new Promise(r => setTimeout(r, 450));
    const nachher = document.body.innerHTML.length + ':' + String(App.aktuelleSeite() || '');
    if (vorher === nachher) raus.push(b.id);
    document.querySelectorAll<HTMLElement>('.overlay, .menu').forEach(o => o.remove());
  }
  return raus;
});
gleich('Und jede Zeile macht wirklich etwas auf', tot, []);

/* GENAU EINMAL, NICHT ZWEIMAL. Als die Handlung ins Register wanderte,
   blieb `an('btn-new', …)` in `schale.ts` stehen — die Schleife hängte
   dieselbe Zeile ein zweites Mal an, und ein Klick auf „Neue Seite" legte
   ZWEI Seiten an. Gemessen: 13 vorher, 15 nachher.

   Alle Punkte oben blieben grün. „Macht die Zeile etwas auf?" ist bei zwei
   Seiten genauso wahr wie bei einer, und die Listen stimmten ja. Ein
   doppelt angehängter Knopf ist nur zu sehen, wenn man ZÄHLT. */
const einmal = await seite.evaluate(async () => {
  const zaehle = () => Object.values(Store.cache.blocks)
    .filter((b: any) => b.type === 'page' && b.alive).length;
  const vorher = zaehle();
  document.getElementById('btn-new')?.click();
  await new Promise(r => setTimeout(r, 900));
  return { vorher, nachher: zaehle() };
});
gleich('„Neue Seite" legt genau EINE Seite an',
  einmal.nachher - einmal.vorher, 1);

/* ==========================================================================
 * §6 · „Meine Apps" steht im Register und wird von dort gezeichnet (L58)
 * --------------------------------------------------------------------------
 * Zwanzig Zeilen standen als Datentabelle in `seitenleiste.ts`, und direkt
 * darunter eine Kette aus zwanzig `if (a === '…')`. Zwei Listen für
 * dieselben zwanzig Dinge: wer eine hinzufügte, musste an beide denken.
 *
 * Dieselbe Lage, die §5 eine Gruppe weiter oben aufgelöst hat — nur dass
 * dort das Aussehen in index.html bleibt und hier die Seitenleiste WIRKLICH
 * aus dem Register zeichnet. Beides ist richtig: dort steht das Markup
 * fest, hier entsteht es ohnehin zur Laufzeit.
 *
 * ─── WAS DIESER ABSCHNITT NICHT PRÜFT ───────────────────────────────────────
 * Anders als §5 vergleicht er nicht zwei Quellen, sondern eine Quelle mit
 * ihrer eigenen Ausgabe. Wer im Register einen Namen ändert, ändert damit
 * beides — die Gegenprobe dazu bleibt grün, und das ist richtig so.
 *
 * Was er prüft, ist der ZEICHNER: dass er nichts weglässt, nichts umordnet
 * und den Hinweistext nicht verwechselt. Gegengeprüft mit `slice(0, 12)` —
 * vier Punkte rot. Und dass keine der zwanzig Zeilen tot ist; gegengeprüft
 * mit einem `return` vor der Handlung — zwanzig Kennungen in einer Zeile.
 * ========================================================================*/
console.log('\n6 · „Meine Apps" kommt aus dem Register');

const apps = await seite.evaluate(() => {
  const reg = Register.navigation.anPlatz('apps').map((x: any) => ({
    id: String(x.marke || x.id), name: String(x.name || ''),
    hinweis: String(x.hinweis || ''), hatTun: typeof x.tun === 'function' }));
  /* `data-app` trägt die MARKE, nicht die Registerkennung — sie ist eine
     Adresse nach aussen und bleibt, wie sie war (E167). */
  const gezeichnet = [...document.querySelectorAll<HTMLElement>('.apps-block [data-app]')]
    .map(b => ({ id: b.dataset['app'] || '',
                 name: (b.children[1]?.textContent || '').trim(),
                 hinweis: b.getAttribute('title') || '' }));
  return { reg, gezeichnet };
});

p('Es gibt zwanzig Apps', apps.reg.length === 20, String(apps.reg.length));
gleich('Und genauso viele stehen da', apps.gezeichnet.length, apps.reg.length);
gleich('In derselben Folge', apps.gezeichnet.map((x: any) => x.id),
  apps.reg.map((x: any) => x.id));
/* UND DIE MARKEN SIND DIE ALTEN. E166 hatte sie ohne Not auf `app-…`
   umbenannt; der volle Prüflauf fand drei Zeilen in test33 und test61, die
   die Knöpfe über `[data-app="bib"]` anfassen. Ein solcher Wert ist eine
   Adresse nach aussen — eigenes CSS und eigene Erweiterungen dürfen darauf
   zeigen (E167). */
gleich('Und die Marken sind die kurzen, unveränderten',
  apps.gezeichnet.slice(0, 4).map((x: any) => x.id),
  ['kalender', 'pwa', 'bib', 'aufgaben']);
gleich('Mit denselben Namen', apps.gezeichnet.map((x: any) => x.name),
  apps.reg.map((x: any) => x.name));
gleich('Und denselben Hinweistexten', apps.gezeichnet.map((x: any) => x.hinweis),
  apps.reg.map((x: any) => x.hinweis));
gleich('Jeder Eintrag weiss, was er tut',
  apps.reg.filter((x: any) => !x.hatTun).map((x: any) => x.id), []);

/* Und keine der zwanzig Zeilen ist tot. Ein Katalog, dessen Einträge nichts
   aufmachen, ist E118 mit zwanzig Knöpfen. */
const totApps = await seite.evaluate(async () => {
  const raus: string[] = [];
  for (const b of [...document.querySelectorAll<HTMLElement>('.apps-block [data-app]')]) {
    document.querySelectorAll<HTMLElement>('.overlay, .menu').forEach(o => o.remove());
    const vorher = document.body.innerHTML.length + ':' + String(App.aktuelleSeite() || '');
    b.click();
    await new Promise(r => setTimeout(r, 420));
    const nachher = document.body.innerHTML.length + ':' + String(App.aktuelleSeite() || '');
    if (vorher === nachher) raus.push(b.dataset['app'] || '(ohne)');
    document.querySelectorAll<HTMLElement>('.overlay, .menu').forEach(o => o.remove());
  }
  return raus;
});
gleich('Und jede macht etwas auf', totApps, []);

/* ==========================================================================
 * §7 · Und der Fuss der Seitenleiste (L58, E167)
 * --------------------------------------------------------------------------
 * Drei feste Zeilen ganz unten. Zwei davon hängen seit E167 am Register;
 * `btn-import` nicht, und der Grund steht im Register selbst: sein Menü
 * braucht das Klickereignis, um sich an der richtigen Stelle zu öffnen.
 *
 * DER ZWEITE PUNKT IST DER WICHTIGERE. `btn-trash` hing vorher an einer
 * `an(...)`-Zeile in `schale.ts`. Bliebe sie neben der Registerschleife
 * stehen, wäre der Knopf zweimal verdrahtet — genau der Fehler aus E160,
 * bei dem ein Klick auf „Neue Seite" zwei Seiten anlegte. Ein doppelt
 * angehängter Papierkorb-Knopf öffnet den Papierkorb zweimal, und das
 * sieht man nicht.
 * ========================================================================*/
console.log('\n7 · Und der Fuss der Seitenleiste');

const fuss = await seite.evaluate(async () => {
  const reg = Register.navigation.anPlatz('fuss').map((x: any) => ({
    id: String(x.id), knopfId: String(x.knopfId || ''), hatTun: typeof x.tun === 'function' }));
  /* Zählen, wie oft der Papierkorb wirklich aufgeht: ein doppelt
     angehängter Knopf zeichnet ihn zweimal hintereinander. */
  document.querySelectorAll<HTMLElement>('.overlay').forEach(o => o.remove());
  document.getElementById('btn-trash')?.click();
  await new Promise(r => setTimeout(r, 700));
  const offen = document.querySelectorAll('.overlay').length;
  document.querySelectorAll<HTMLElement>('.overlay').forEach(o => o.remove());
  return { reg, offen };
});

gleich('Zwei Fusszeilen stehen im Register', fuss.reg.map((x: any) => x.knopfId),
  ['btn-trash', 'btn-hilfe']);
gleich('Beide wissen, was sie tun',
  fuss.reg.filter((x: any) => !x.hatTun).map((x: any) => x.id), []);
gleich('Und der Papierkorb geht GENAU EINMAL auf', fuss.offen, 1);

/* ========================================================================*/
console.log(`\n${ok}/${ok + weg} bestanden`);
if (fehler.length) console.log('Browserfehler:\n  ' + fehler.join('\n  '));
p('Keine unbehandelten Browserfehler', fehler.length === 0, fehler.join(' | '));

await browser.close();
await new Promise<void>(f => { server.close(() => f()); });
process.exitCode = weg ? 1 : 0;
