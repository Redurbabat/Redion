/* Suite 277 — Vollbild, und EIN Griff für „volle Breite" (L85 · E283)
 * ============================================================================
 * Redurs dritter Punkt aus E277 war eine Auswahl, keine Liste:
 *
 *     · Vollbild:      bauen.
 *     · Volle Breite:  den Code, den es an zwei Stellen schon gibt, zu EINEM
 *                      gemeinsamen Griff zusammenziehen.
 *     · Globaler Zoom: STREICHEN.
 *     · Senden:        STREICHEN.
 *
 * Diese Prüfung deckt die zwei gebauten. Die zwei gestrichenen prüft sie
 * ebenfalls — als ABWESENHEIT: ein gestrichener Punkt, der später doch als
 * halber Knopf auftaucht, ist genau der Fehler, den §47 verbietet.
 *
 *   §1 VOLLBILD gibt es als Griff, es kennt seinen Zustand frisch, und der
 *      Knopf im Band verschwindet dort, wo der Browser kein Vollbild kann.
 *   §2 DER KNOPF wirkt wirklich — hinein und wieder heraus.
 *   §3 DER HORCHER zieht den Knopf nach, wenn das Vollbild ANDERS endet
 *      als über ihn. Das ist der eigentliche Fund: ein gemerkter Zustand
 *      wäre nach dem ersten Escape für immer falsch.
 *   §4 VOLLE BREITE hat einen Griff, und alle drei Wege gehen hindurch.
 *   §5 ZOOM und SENDEN sind nicht heimlich doch da.
 *
 * ─── KANN ER ROT WERDEN? (§55.2) ────────────────────────────────────────────
 * §1, §2, §3 waren vor E283 vollständig rot: `App.vollbild` gab es nicht,
 * und im ganzen `src/`-Baum kam `requestFullscreen` nur im Präsentations-
 * modus vor (das hält L85 Punkt 1 wörtlich fest).
 *
 * §4 ist der interessantere Fall. Der Punkt „kein Aufrufer schreibt `wide`
 * von Hand" war vor E283 DREIMAL rot — L85 nannte zwei Stellen, es waren
 * drei. Er misst den ausgelieferten Quelltext, nicht das Verhalten: alle
 * drei Wege taten vorher schon das Richtige, sie taten es nur jeder für
 * sich. Genau das ist die Verdopplung, die still auseinanderläuft.
 *
 * Dazu drei ausdrückliche Gegenproben, die zeigen, dass die Messungen
 * überhaupt greifen (§1 Ende, §4 Ende).
 *
 *   node pruefungen/lauf/test277.mts
 * ==========================================================================*/
declare const Store: any; declare const App: any; declare const Register: any;
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9055;

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

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1500, height: 940 } });
const seite = await ctx.newPage();
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 140)));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForFunction(
  () => typeof Store !== 'undefined' && typeof App !== 'undefined' &&
        typeof (globalThis as any).Register !== 'undefined', null, { timeout: 30000 });
await seite.waitForTimeout(1400);

/* DEN WILLKOMMENSGRUSS WEGRÄUMEN, bevor irgendwo geklickt wird.
   `rundgang.ts` legt beim ersten Start `#rg-willkommen` als modalen Dialog
   über alles — und §2 klickt einen ECHTEN Knopf im Band (es muss ein echter
   Klick sein, sonst lehnt der Browser `requestFullscreen` ab). Playwright
   wartet dann dreissig Sekunden auf einen Knopf, den es sieht und nicht
   erreicht. */
await seite.evaluate(() => {
  document.querySelectorAll('#rg-willkommen, #rg-einladung').forEach(x => x.remove());
});

/* Eine echte Seite öffnen — „volle Breite" braucht eine, und der Reiter
   „Ansicht" zeigt seine Seiten-Einträge nur mit einer offenen Seite. */
const seiteId = await seite.evaluate(() => {
  const b = Store.addBlock({ type: 'page', text: 'Breitentest', parentId: null });
  App.oeffne(b.id);
  return b.id;
}) as string;
await seite.waitForTimeout(900);

/* ------------------------------------------------------------------------ */
console.log('\n1 · Vollbild gibt es als Griff — und nur da, wo es geht');

const griffe = await seite.evaluate(() => ({
  vollbild:     typeof App.vollbild,
  vollbildAn:   typeof App.vollbildAn,
  vollbildGeht: typeof App.vollbildGeht,
  volleBreite:  typeof App.volleBreite,
  geht:         App.vollbildGeht(),
  anJetzt:      App.vollbildAn(),
  /* Der Browser selbst — wenn DER es nicht kann, misst §2 nichts. */
  browserKann:  !!document.fullscreenEnabled
})) as any;
p('`App.vollbild` ist ein Griff', griffe.vollbild === 'function', griffe.vollbild);
p('`App.vollbildAn` liest den Zustand', griffe.vollbildAn === 'function');
p('`App.vollbildGeht` beantwortet die §47-Frage', griffe.vollbildGeht === 'function');
p('Dieser Browser kann Vollbild — sonst misst §2 nichts',
  griffe.browserKann === true && griffe.geht === true, JSON.stringify(griffe));
p('Und gerade ist keins an', griffe.anJetzt === false);

const eintrag = await seite.evaluate(() => {
  const e = Register.menueband.eines('a-vollbild');
  return e ? {
    da: true, reiter: e.reiter, gruppe: e.gruppe, name: e.name,
    zeichen: e.zeichen, hinweis: String(e.hinweis || ''),
    hatAn: typeof e.an === 'function', zeigt: e.zeigen ? e.zeigen() : true
  } : { da: false };
}) as any;
p('Der Eintrag steht im Register', eintrag.da === true);
p('… im Reiter Ansicht, Gruppe Lesen — neben „Fokus"',
  eintrag.reiter === 'ansicht' && eintrag.gruppe === 'Lesen',
  JSON.stringify(eintrag));
p('… mit einem Zeichen, das es wirklich gibt',
  eintrag.zeichen === 'maximize', eintrag.zeichen);
p('… und einem Satz für Mauszeiger und Vorleseprogramm (§38)',
  (eintrag.hinweis || '').length > 15, eintrag.hinweis);
p('… er kennt seinen Zustand (`an`)', eintrag.hatAn === true);
p('… und er wird hier gezeigt', eintrag.zeigt === true);

/* GEGENPROBE zum §47-Wächter: sagt `vollbildGeht()` nein, verschwindet der
   Knopf. Ohne diese Zeile stünde er auf dem iPhone da und täte nichts. */
const versteckt = await seite.evaluate(() => {
  const vorher = !!Register.menueband.eines('a-vollbild');
  const echt = App.vollbildGeht;
  App.vollbildGeht = () => false;
  /* Mitmessen, ob die Vertauschung überhaupt griff — sonst behauptet ein
     grüner Punkt hier etwas über einen Wächter, der gar nicht geprüft
     wurde. */
  const griff = App.vollbildGeht() === false;
  /* `alle()` SIEBT selbst nach `zeigen()` — ein ausgeblendeter Eintrag ist
     also gar nicht mehr in der Liste, und `eines()` gibt `null`.
     Genau das wird hier gemessen: die ABWESENHEIT ist der Beweis, nicht
     ein `zeigen()`, das man noch abfragen könnte. (Beim ersten Anlauf
     stand hier `e && e.zeigen ? e.zeigen() : true` — der Rückfallwert
     sagte „wird gezeigt", wenn der Eintrag fehlte. Also genau das
     Gegenteil dessen, was sein Fehlen bedeutet.) */
  const nochDa = !!Register.menueband.eines('a-vollbild');
  const inAlle = Register.menueband.alle().some((x: any) => x.id === 'a-vollbild');
  App.vollbildGeht = echt;
  return { vorher, griff, nochDa, inAlle, wiederDa: !!Register.menueband.eines('a-vollbild') };
}) as any;
p('Die Vertauschung für die Gegenprobe hat gegriffen', versteckt.griff === true);
p('… und vorher war der Eintrag wirklich da', versteckt.vorher === true);
p('Gegenprobe: kann das Gerät kein Vollbild, ist der Eintrag WEG',
  versteckt.nochDa === false && versteckt.inAlle === false, JSON.stringify(versteckt));
p('… und danach ist er wieder da — die Probe hat nichts hinterlassen',
  versteckt.wiederDa === true, JSON.stringify(versteckt));

/* Das Zeichen selbst muss es im Register geben — ein Name ohne Zeichnung
   ergibt einen leeren Platzhalter mit Breite (E282 hat genau das gefunden). */
const zeichenDa = await seite.evaluate(() => {
  const s = Register.symbole;
  return { hat: s.hat('maximize'), laenge: String(s.alsSvg('maximize') || '').length,
           /* Gegenprobe im selben Zug: ein erfundener Name gibt nichts. */
           erfunden: String(s.alsSvg('gibtesnicht') || '').length };
}) as any;
p('Das Zeichen `maximize` ist wirklich gezeichnet, nicht nur benannt',
  zeichenDa.hat === true && zeichenDa.laenge > 120, JSON.stringify(zeichenDa));
p('Gegenprobe: ein erfundener Zeichenname gibt gar nichts zurück',
  zeichenDa.erfunden === 0, String(zeichenDa.erfunden));

/* ------------------------------------------------------------------------ */
console.log('\n2 · Der Knopf im Band wirkt wirklich');

/* AUFKLAPPEN UND AUF DEN REITER „ANSICHT".
   Beides ist nötig, und das Aufklappen ist der Teil, den man vergisst: das
   Band beginnt ZUGEKLAPPT (`zugeklappt()` liest `bandZu` mit Vorgabe
   `true`), und zugeklappt füllt `zeichne()` die Knöpfe gar nicht erst ein.
   Ohne diese Zeilen würde §2 messen, dass ein Knopf fehlt, der nur
   eingeklappt ist — eine Prüfung, die aus dem richtigen Grund rot wird,
   aber die falsche Sache behauptet. */
await seite.evaluate(() => {
  Store.setMeta('bandZu', false);
  (window as any).Menueband?.zeichne?.();
});
await seite.waitForTimeout(400);
await seite.evaluate(() => {
  const r = document.querySelector<HTMLElement>('[data-mb-reiter="ansicht"]');
  if (r) r.click();
});
await seite.waitForTimeout(600);

const knopfDa = await seite.evaluate(() => {
  const k = document.querySelector<HTMLElement>('[data-band="a-vollbild"]');
  return k ? { da: true, text: (k.textContent || '').trim(),
               gedrueckt: k.getAttribute('aria-pressed') } : { da: false };
}) as any;
p('Der Knopf steht im Band', knopfDa.da === true, JSON.stringify(knopfDa));
p('… und meldet sich als NICHT gedrückt', knopfDa.gedrueckt === 'false', JSON.stringify(knopfDa));

/* Ein ECHTER Klick — `requestFullscreen` verlangt eine frische
   Nutzerhandlung; ein `evaluate`-Aufruf hätte keine und würde abgelehnt.
   Genau deshalb wird hier geklickt statt gerufen. */
await seite.evaluate(() => {
  document.querySelectorAll('#rg-willkommen, #rg-einladung').forEach(x => x.remove());
});
if (knopfDa.da) await seite.click('[data-band="a-vollbild"]');
await seite.waitForTimeout(700);

const drin = await seite.evaluate(() => {
  const k = document.querySelector<HTMLElement>('[data-band="a-vollbild"]');
  return {
    an: App.vollbildAn(),
    echt: !!document.fullscreenElement,
    gedrueckt: k ? k.getAttribute('aria-pressed') : null,
    markiert: k ? k.classList.contains('ist-an') : null
  };
}) as any;
p('Der Klick führt ins Vollbild', drin.echt === true, JSON.stringify(drin));
p('… `App.vollbildAn()` sagt dasselbe wie der Browser', drin.an === drin.echt);
p('… und der Knopf steht sichtbar auf AN', drin.gedrueckt === 'true' && drin.markiert === true,
  JSON.stringify(drin));

/* ------------------------------------------------------------------------ */
console.log('\n3 · Und wenn das Vollbild ANDERS endet als über den Knopf');

/* DAS IST DER FUND. Escape verlässt das Vollbild im BROWSER, ohne dass
   Redion gefragt wird. Ein gemerkter Zustand stünde danach für immer
   falsch — der Knopf zeigte „AN" über einem Fenster mit Adressleiste.
   Hier wird genau dieser Weg gegangen: nicht der Knopf beendet es. */
await seite.evaluate(() => { (document as any).exitFullscreen?.().catch(() => {}); });
await seite.waitForTimeout(700);

const raus = await seite.evaluate(() => {
  const k = document.querySelector<HTMLElement>('[data-band="a-vollbild"]');
  return {
    echt: !!document.fullscreenElement,
    an: App.vollbildAn(),
    gedrueckt: k ? k.getAttribute('aria-pressed') : null,
    markiert: k ? k.classList.contains('ist-an') : null
  };
}) as any;
p('Das Vollbild ist wirklich beendet', raus.echt === false, JSON.stringify(raus));
p('… `App.vollbildAn()` merkt es, weil es nichts merkt', raus.an === false);
p('… UND der Knopf hat sich von selbst nachgezogen (`fullscreenchange`)',
  raus.gedrueckt === 'false' && raus.markiert === false,
  JSON.stringify(raus) + ' — ohne den Horcher stünde er hier auf AN');

/* ------------------------------------------------------------------------ */
console.log('\n4 · Volle Breite geht durch EINEN Griff');

const breite = await seite.evaluate((id: string) => {
  const vorher = !!Store.getBlock(id).wide;
  const zurueck1 = App.volleBreite(Store.getBlock(id));
  const nachher = !!Store.getBlock(id).wide;
  const zurueck2 = App.volleBreite(Store.getBlock(id));
  const wieder = !!Store.getBlock(id).wide;
  /* Hart setzen statt umschalten — der zweite Weg der Unterschrift. */
  App.volleBreite(Store.getBlock(id), true);
  const hart = !!Store.getBlock(id).wide;
  App.volleBreite(Store.getBlock(id), true);
  const nochmal = !!Store.getBlock(id).wide;
  App.volleBreite(Store.getBlock(id), false);
  return { vorher, nachher, wieder, hart, nochmal, zurueck1, zurueck2,
           ausJetzt: !!Store.getBlock(id).wide,
           /* Ohne Seite passiert nichts, und es wird nichts behauptet. */
           ohne: App.volleBreite(null), leer: App.volleBreite({}) };
}, seiteId) as any;
p('`App.volleBreite` schaltet um', breite.vorher === false && breite.nachher === true,
  JSON.stringify(breite));
p('… und wieder zurück', breite.wieder === false);
p('… der Rückgabewert sagt den Zustand DANACH',
  breite.zurueck1 === true && breite.zurueck2 === false, JSON.stringify(breite));
p('… hart gesetzt bleibt es gesetzt, auch zweimal',
  breite.hart === true && breite.nochmal === true, JSON.stringify(breite));
p('… ohne Seite passiert nichts, und es wird nichts behauptet',
  breite.ohne === false && breite.leer === false, JSON.stringify(breite));
p('… und am Ende steht sie wieder auf normal', breite.ausJetzt === false);

/* Der Weg über die Kopfleiste — `data-a="wide"` ruft den gebundenen Griff.
   Die Bindung ist der Punkt: fehlt sie, wirft `braucht('volleBreite')`
   laut, statt still nichts zu tun. */
const ueberKopf = await seite.evaluate((id: string) => {
  const vorher = !!Store.getBlock(id).wide;
  let geworfen = '';
  try {
    /* Genau der Weg, den kopfleiste.ts nimmt. */
    const p2 = Store.getBlock(id);
    App.volleBreite(p2);
  } catch (e: any) { geworfen = String(e && e.message || e); }
  return { vorher, nachher: !!Store.getBlock(id).wide, geworfen };
}, seiteId) as any;
p('Der gebundene Griff wirft nicht — die Kopfleiste ist wirklich versorgt',
  ueberKopf.geworfen === '', ueberKopf.geworfen);
p('… und er schaltet', ueberKopf.vorher !== ueberKopf.nachher, JSON.stringify(ueberKopf));

/* DIE QUELLTEXT-MESSUNG. Sie ist der Kern von §4: alle drei Wege TATEN
   vorher schon das Richtige — sie taten es nur jeder für sich. Ein
   Verhaltenstest kann diesen Unterschied nicht sehen. */
const ohneKommentare = (txt: string): string =>
  /* Kommentare weg, sonst meldet die Messung ihre eigene Erklärung als
     Fund — genau der Fehler, den test274 beim Schreiben zweimal machte. */
  txt.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const WIDE = /updateBlock\([^)]*\{\s*wide\s*:/g;

const schaleJs = ohneKommentare(
  fs.readFileSync(path.join(WURZEL, 'quell/schale/aufbau/schale.js'), 'utf8'));
const kopfJs = ohneKommentare(
  fs.readFileSync(path.join(WURZEL, 'quell/schale/aufbau/kopfleiste.js'), 'utf8'));

const inSchale = [...schaleJs.matchAll(WIDE)];
const inKopf = [...kopfJs.matchAll(WIDE)];

/* EINE Schreibstelle darf es geben — die im Griff selbst. Sie muss dort
   auch WIRKLICH stehen und nicht irgendwo sonst, sonst wäre „genau eine"
   nur eine Zahl ohne Aussage. */
const griffAb = schaleJs.indexOf('const volleBreite =');
const drinImGriff = griffAb >= 0 && inSchale.length === 1 &&
  (inSchale[0]!.index ?? -1) > griffAb && (inSchale[0]!.index ?? 0) - griffAb < 600;

p('Die Kopfleiste schreibt `wide` gar nicht mehr selbst',
  inKopf.length === 0, 'gefunden: ' + inKopf.length + ' (vor E283: 1)');
p('Und in der Schale steht die Schreibstelle GENAU EINMAL',
  inSchale.length === 1, 'gefunden: ' + inSchale.length + ' (vor E283: 2, ohne Griff)');
p('… nämlich im Griff `volleBreite` selbst und nirgends sonst',
  drinImGriff, 'Griff bei ' + griffAb + ', Fund bei ' +
  (inSchale.length ? inSchale[0]!.index : '–'));

/* GEGENPROBE zur Quelltext-Messung: sie muss an einem Text, der die alte
   Handarbeit enthält, anschlagen. Eine Messung, die nie rot werden kann,
   ist keine (§55.2) — und diese hier hätte sich leicht so schreiben
   lassen, dass sie immer schweigt. */
const probeText = 'if (a === "breit") { Store.updateBlock(p.id, { wide: !p.wide }); }';
p('Gegenprobe: an der ALTEN Zeile schlägt die Messung wirklich an',
  (probeText.replace(/\/\*[\s\S]*?\*\//g, '').match(/updateBlock\([^)]*\{\s*wide\s*:/g) || []).length === 1);

/* ------------------------------------------------------------------------ */
console.log('\n5 · Was Redur gestrichen hat, ist auch nicht halb da');

const gestrichen = await seite.evaluate(() => {
  const alle = Register.menueband.alle();
  const namen = alle.map((e: any) => String(e.name || '') + '|' + String(e.id || ''));
  return {
    zoom: namen.filter((n: string) => /zoom|vergröss|verkleiner/i.test(n)),
    senden: namen.filter((n: string) => /\bsenden\b|\bmail versch/i.test(n)),
    /* Der Weg, den es STATT „Senden" gibt, liegt nicht im Band, sondern in
       Backstage — L85 Punkt 4 nennt ihn wörtlich: die Sektion „Weitergeben",
       die `Werkzeuge.teilenMenue` öffnet. Ohne diese Zeile wäre das
       Streichen ein Verlust und keine Entscheidung. */
    weitergeben: ((window as any).Backstage?.faecher?.() || [])
      .some((a: any) => String(a && a.id) === 'weitergeben'),
    teilenGriff: typeof (window as any).Werkzeuge?.teilenMenue === 'function',
    /* Und der Weg statt „globalem Zoom": Schriftgrösse gibt es weiter. */
    schrift: typeof (window as any).Aussehen?.dialog === 'function'
  };
}) as any;
p('Kein „Zoom"-Knopf im Band — gestrichen heisst gestrichen',
  gestrichen.zoom.length === 0, gestrichen.zoom.join(', '));
p('Kein „Senden"-Knopf im Band', gestrichen.senden.length === 0, gestrichen.senden.join(', '));
p('… aber die Backstage-Sektion „Weitergeben" steht sehr wohl da',
  gestrichen.weitergeben === true, JSON.stringify(gestrichen));
p('… und sie hat einen echten Griff dahinter (`teilenMenue`)',
  gestrichen.teilenGriff === true, JSON.stringify(gestrichen));
p('… und Schrift/Aussehen bleibt erreichbar', gestrichen.schrift === true);

p('Keine Seitenfehler', fehler.length === 0, fehler.join(' | ').slice(0, 200));

await browser.close();
server.close();
console.log(`\n${ok}/${ok + weg} bestanden`);
process.exitCode = weg ? 1 : 0;
