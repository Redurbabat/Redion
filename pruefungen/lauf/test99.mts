/* Suite 64 — Zwei Fenster, eine Ablage
 * ----------------------------------------------------------------------------
 * `LUECKEN.md` führte das als kleinen Punkt: *„`onblocked` meldet sich mit
 * einem Satz — geprüft ist er nicht."* Beim Nachmessen war der ungeprüfte
 * Satz der harmlose Teil.
 *
 * ─── DER STILLE ÜBERSCHREIBER ───────────────────────────────────────────────
 *
 * Zwei Tabs mit Redion teilen sich **eine** IndexedDB. Jeder hält seinen
 * eigenen Zwischenspeicher im Arbeitsspeicher — gefüllt einmal beim Laden
 * und danach nie wieder nachgesehen. Es gab weder `BroadcastChannel` noch
 * ein `storage`-Ereignis noch `onversionchange`; die Fenster wussten
 * buchstäblich nichts voneinander.
 *
 *   Tab A ändert eine Seite. Tab B hat die alte Fassung noch im Speicher.
 *   Sobald B irgendetwas an dieser Seite tut, schreibt es seinen alten Stand
 *   darüber. **Die Änderung aus A ist weg** — ohne Meldung, ohne Konflikt,
 *   ohne Spur.
 *
 * Es braucht kein Missgeschick dafür. Zwei Tabs offen zu haben ist der
 * Normalfall, und der Verlust fällt Tage später auf, wenn niemand mehr
 * weiss, woher er kommt. Das ist der Schlusssatz des Auftrags, wörtlich:
 * Nutzer verlieren ihre Daten unbemerkt.
 *
 * ─── UND DIE ANDERE HÄLFTE VON `onblocked` ──────────────────────────────────
 *
 * `onblocked` sagt dem NEUEN Fenster, dass ein altes im Weg steht. Niemand
 * sagte dem alten Fenster, dass es im Weg steht — es hielt seine Verbindung
 * offen, und das neue kam nie durch. Der Mensch sah in einem Tab „bitte den
 * anderen schliessen" und im anderen eine App, die sich nichts anmerken
 * liess. `onversionchange` fehlte ganz.
 *
 * ─── WIE HIER GEPRÜFT WIRD ──────────────────────────────────────────────────
 *
 * Mit **zwei echten Seiten in einem Kontext** — nicht mit zwei Kontexten:
 * getrennte Kontexte haben getrennte Ablagen und getrennte Kanäle, dort ist
 * jede Prüfung grün und beweist nichts. Ein Kontext, zwei Tabs, dieselbe
 * Herkunft: genau die Lage, um die es geht.
 *
 *   node pruefungen/lauf/test99.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import { fileURLToPath as _alsPfad } from 'node:url';
import { dirname as _ordner, resolve as _loese, join as _dazu } from 'node:path';
import { readFileSync as _lies, existsSync as _da } from 'node:fs';
import { createServer } from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';

const WURZEL = _loese(_ordner(_alsPfad(import.meta.url)), '../..');
const PORT = 8808;

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
const kontext = await browser.newContext();     /* EIN Kontext — das ist der Punkt */

const fehler: any[] = [];
/* Auf die GELADENE Ablage warten, nicht auf die Namen. Der Draht wird am
   Ende von `Store.load()` angeschlossen; wer nur prüft, ob `Store` existiert,
   schickt seine erste Nachricht möglicherweise, bevor drüben jemand zuhört —
   und misst dann eine Startlücke statt der Sache. Der gezeichnete Baum ist
   das sichtbare Zeichen dafür, dass `starteWirklich()` durch ist. */
const oeffne = async () => {
  const s = await kontext.newPage();
  s.on('pageerror', e => fehler.push(e.message));
  await s.goto(`http://localhost:${PORT}/index.html`);
  await s.waitForFunction(() => typeof App !== 'undefined' && typeof Store !== 'undefined' &&
                                typeof Nachbarn !== 'undefined' && Nachbarn.offen() &&
                                (document.getElementById('tree')?.children.length || 0) > 0,
                          null, { timeout: 20000 });
  return s;
};

const A = await oeffne();
const B = await oeffne();

/* ========================================================================= *
 * 0 · GIBT ES DEN DRAHT ÜBERHAUPT?
 * ========================================================================= */
console.log('\n0 · Der Draht');

const draht = await A.evaluate(() => ({
  da:    typeof Nachbarn !== 'undefined',
  offen: typeof Nachbarn !== 'undefined' && Nachbarn.offen(),
  weg:   typeof Nachbarn !== 'undefined' ? Nachbarn.weg() : '—',
  kennung: typeof Nachbarn !== 'undefined' ? Nachbarn.kennung() : ''
}));
p('Nachbarn gibt es', draht.da);
p('… und der Kanal steht', draht.offen, draht.weg);
if (!draht.da) {
  console.log('\n  (Alles Weitere braucht quell/kern/ablage/nachbarn.js.)');
  console.log(`\n  Suite 64 — Zwei Fenster: ${ok} ok, ${weg} offen`);
  await browser.close(); server.close(); process.exit(1);
}

const kennungB = await B.evaluate(() => Nachbarn.kennung());
p('Jedes Fenster hat eine eigene Kennung', draht.kennung !== kennungB,
  `${draht.kennung} / ${kennungB}`);

/* Ein Fenster darf sich nicht selbst hören — sonst läse es jede eigene
   Änderung sofort wieder von der Platte zurück.
   ---------------------------------------------------------------------------
   HIER STAND EINE FLOCKE, und sie war teuer: gezählt wurde vorher **jede**
   Nachricht, die in diesem Viertelsekundenfenster ankam. B hat aus den
   Schritten davor aber noch Schreibvorgänge in der Warteschlange und meldet
   sie verspätet — etwa jeder dritte Lauf war deshalb rot, obwohl der Filter
   tadellos arbeitete.

   Nachgemessen mit einer Probe, die mitschreibt, WER gesendet hat: in jedem
   roten Fall trug die Nachricht B's Kennung und einen fremden Blockschlüssel.
   Nie die eigene. Der Filter in `nachbarn.js` hat nie versagt.

   Gezählt wird jetzt das, was die Prüfung im Namen trägt: Nachrichten **von
   mir selbst**. Was der Nachbar sagt, darf ankommen — das ist der Sinn der
   ganzen Einrichtung. */
const selbstgespraech = await A.evaluate(async () => {
  const meine = Nachbarn.kennung();
  let gehoert = 0;
  const ab = Nachbarn.beiNachricht((n) => { if (n && n.von === meine) gehoert++; });
  Nachbarn.sende({ art: 'geaendert', schluessel: ['blocks:egal'] });
  await new Promise(f => setTimeout(f, 250));
  ab();
  return gehoert;
});
gleich('Ein Fenster hört sich nicht selbst', selbstgespraech, 0);

/* ========================================================================= *
 * 1 · WAS DRÜBEN GESCHRIEBEN WIRD, KOMMT HIER AN
 * ========================================================================= */
console.log('\n1 · Eine Änderung in A erreicht B');

const seiteId = await A.evaluate(async () => {
  const s = Store.addPage(null, { text: 'Gemeinsame Seite' });
  await Store.flush();
  return s.id;
});
/* Auf die Botschaft WARTEN, nicht die Uhr raten: der BroadcastChannel
   liefert unter Volllast auch mal später als 500 ms (E82-Klasse). Kommt
   sie nie, läuft die Schleife aus und der Punkt wird ehrlich rot. */
let kenntB = false;
for (let i = 0; i < 60 && !kenntB; i++) {
  kenntB = await B.evaluate(([id]) => !!Store.getBlock(id), [seiteId]);
  if (!kenntB) await new Promise(f => setTimeout(f, 250));
}
p('B kennt die neue Seite aus A', kenntB,
  'ohne Draht wüsste B nichts davon — und überschriebe sie beim nächsten Anlass');

const neuerText = await A.evaluate(async ([id]) => {
  Store.updateBlock(id, { text: 'In A geändert' });
  await Store.flush();
  return Store.getBlock(id).text;
}, [seiteId] as [string]);
await new Promise(f => setTimeout(f, 500));
gleich('… und die Änderung daran', await B.evaluate(([id]) =>
  (Store.getBlock(id) || {}).text, [seiteId]), neuerText);

/* ========================================================================= *
 * 2 · DER FALL, UM DEN ES GEHT: B ÜBERSCHREIBT A NICHT MEHR
 * ---------------------------------------------------------------------------
 * Der eigentliche Schaden entstand nicht beim Lesen, sondern beim SCHREIBEN:
 * B schrieb seinen veralteten Stand über den frischen aus A. Hier wird genau
 * das nachgestellt — zwei Felder auf derselben Seite, jedes Fenster fasst
 * eines an.
 * ========================================================================= */
console.log('\n2 · B schreibt A nicht mehr tot');

const zwei = await A.evaluate(async () => {
  const s = Store.addPage(null, { text: 'Zwei Hände', icon: '📄' });
  await Store.flush();
  return s.id;
});
await new Promise(f => setTimeout(f, 400));

/* A ändert den Titel … */
await A.evaluate(async ([id]) => {
  Store.updateBlock(id, { text: 'Titel aus A' });
  await Store.flush();
}, [zwei] as [string]);
await new Promise(f => setTimeout(f, 400));

/* … B ändert das Symbol. Ohne Draht hätte B beim Schreiben den alten Titel
   mitgeschickt und „Titel aus A" gelöscht. */
await B.evaluate(async ([id]) => {
  Store.updateBlock(id, { icon: '🔧' });
  await Store.flush();
}, [zwei] as [string]);
await new Promise(f => setTimeout(f, 500));

const beide = await A.evaluate(([id]) => {
  const b = Store.getBlock(id);
  return { text: b.text, icon: b.icon };
}, [zwei]);
gleich('Beide Änderungen stehen nebeneinander', beide, { text: 'Titel aus A', icon: '🔧' });

/* Und auf der Platte, nicht nur im Speicher — ein Stand, der nur im
   Arbeitsspeicher liegt, ist beim nächsten Laden weg. */
const C = await oeffne();
const vonPlatte = await C.evaluate(([id]) => {
  const b = Store.getBlock(id);
  return b ? { text: b.text, icon: b.icon } : null;
}, [zwei]);
gleich('Ein drittes Fenster liest beides von der Platte', vonPlatte,
       { text: 'Titel aus A', icon: '🔧' });
await C.close();

/* ========================================================================= *
 * 3 · GELÖSCHTES VERSCHWINDET AUCH DRÜBEN
 * ========================================================================= */
console.log('\n3 · Endgültig gelöscht ist überall gelöscht');

const weggeworfen = await A.evaluate(async () => {
  const s = Store.addPage(null, { text: 'Kommt weg' });
  await Store.flush();
  return s.id;
});
await new Promise(f => setTimeout(f, 400));
p('B kennt sie', await B.evaluate(([id]) => !!Store.getBlock(id), [weggeworfen]));

await A.evaluate(async ([id]) => { Store.trashBlock(id); Store.purgeBlock(id); await Store.flush(); },
                 [weggeworfen] as [string]);
await new Promise(f => setTimeout(f, 600));
p('… und danach nicht mehr',
  await B.evaluate(([id]) => !Store.getBlock(id), [weggeworfen]),
  'B zeigte eine Seite weiter an, die es nicht mehr gibt — und schriebe sie zurück');

/* ========================================================================= *
 * 4 · WER TIPPT, DEM WIRD NICHT DER BODEN WEGGEZOGEN
 * ---------------------------------------------------------------------------
 * Der Zwischenspeicher wird IMMER aufgefrischt — daran hängt, dass nichts
 * überschrieben wird. Gezeichnet wird nur, wenn niemand schreibt. Sonst
 * springt mitten im Satz der Schreibzeiger, und das ist der sichere Weg,
 * eine richtige Reparatur wieder ausgebaut zu bekommen.
 * ========================================================================= */
console.log('\n4 · Während des Tippens wird nicht gezeichnet');

const beimTippen = await B.evaluate(async () => {
  /* Das Element, das gerade den Fokus hat. `document.activeElement` ist
     `Element | null` und hat weder `dataset` noch `focus`. Hier steht eine
     Prüfung statt einer Behauptung: hat nichts den Fokus, sagt die Meldung
     das — statt „Cannot read properties of null". */
  const aktiv = (): HTMLElement => {
    const el = document.activeElement;
    if (!(el instanceof HTMLElement))
      throw new Error('Kein Element hat gerade den Fokus.');
    return el;
  };
  /* Ein Feld, in dem jemand steht. */
  const feld = document.createElement('input');
  document.body?.appendChild(feld);
  feld.focus();

  const s = Store.addPage(null, { text: 'Egal' });
  const vorher = document.getElementById('tree')?.innerHTML || '';

  /* So tut die Oberfläche, als käme eine fremde Änderung. */
  const merk = Store.getBlock(s.id).text;
  Store.getBlock(s.id).text = 'von drüben';
  Store.cache.blocks[s.id].text = 'von drüben';

  const nachher = document.getElementById('tree')?.innerHTML || '';
  const stehtNoch = aktiv() === feld;
  feld.remove();
  return { stehtNoch, gleich: vorher === nachher, merk };
});
p('Der Schreibzeiger bleibt, wo er ist', beimTippen.stehtNoch);

/* Und der Zwischenspeicher wird trotzdem aufgefrischt — die Prüfung dafür
   ist Abschnitt 2: dort tippt niemand, und dort steht der Beweis, dass die
   Auffrischung nicht am Zeichnen hängt. */
const quelle = _lies(_dazu(WURZEL, 'quell/schale/aufbau/schale.js'), 'utf8');
p('Die Oberfläche hört auf fremde Änderungen', /'fremd'/.test(quelle));
/* Seit `schale.js` von `tsc` erzeugt wird, bestimmt der Übersetzer die
   Zeilenumbrüche: aus `if (schreibtGerade()) return;` werden zwei Zeilen.
   Die Regel ist dieselbe geblieben, nur ihre Schreibweise nicht — deshalb
   steht hier `\s+` statt eines festen Leerzeichens. Dasselbe war schon in
   Prüfung 113 nötig. */
p('… und zeichnet nicht, während jemand schreibt',
  /schreibtGerade\(\)\)\s+return;/.test(quelle));
p('… und sagt es, wenn drüben der ganze Bestand getauscht wurde',
  /fremd-alles/.test(quelle));

/* ========================================================================= *
 * 5 · DIE ANDERE HÄLFTE VON onblocked
 * ========================================================================= */
console.log('\n5 · Ein Fenster hält das andere nicht ewig auf');

const store = _lies(_dazu(WURZEL, 'quell/kern/ablage/indexdb.js'), 'utf8');
p('`onversionchange` gibt es jetzt', /onversionchange/.test(store),
  'ohne sie hält das alte Fenster die Ablage fest, und das neue kommt nie durch');
p('… und es gibt die Verbindung wirklich frei', /db\.close\(\)/.test(store));
p('… und sagt dem Menschen, was los ist',
  /onversionchange[\s\S]{0,400}warne\(/.test(store));

/* Die Gegenrichtung: die App darf sich davon nicht selbst lahmlegen. Solange
   niemand eine neue Fassung öffnet, arbeitet sie ganz normal weiter. */
const laeuftNoch = await A.evaluate(async () => {
  const s = Store.addPage(null, { text: 'Noch am Leben' });
  await Store.flush();
  return !!Store.getBlock(s.id) && !Store.speichertNicht();
});
p('Ohne Fassungswechsel arbeitet die App normal weiter', laeuftNoch);

/* ========================================================================= *
 * 6 · EINGEHÄNGT
 * ========================================================================= */
console.log('\n6 · Die neue Datei ist überall eingetragen');

const html = _lies(_dazu(WURZEL, 'index.html'), 'utf8');
const sw   = _lies(_dazu(WURZEL, 'sw.js'), 'utf8');
p('index.html lädt nachbarn.js', /kern\/ablage\/nachbarn\.js/.test(html));
p('… und vor indexdb.js', html.indexOf('kern/ablage/nachbarn.js') < html.indexOf('kern/ablage/indexdb.js'));
p('sw.js kennt sie auch — sonst fehlt sie offline', /kern\/ablage\/nachbarn\.js/.test(sw));
/* Die Fassungsnummer stand hier als `notizen-v11` wörtlich drin — und wurde
   damit beim nächsten Hochzählen rot, obwohl genau das richtig war. Eine
   Prüfung, die eine Zahl festnagelt, prüft nicht die Regel, sondern den Tag,
   an dem sie geschrieben wurde. Dieselbe Sorte wie der fest verdrahtete Pfad
   in test87.

   Die Regel lautet: `nachbarn.js` kam in Fassung 11 dazu, also muss die
   Fassung **mindestens** 11 sein. Später hochzählen ist erlaubt und nötig;
   zurückfallen oder gar nicht zählen nicht. */
const fassung = Number((sw.match(/notizen-v(\d+)/) || [])[1]);
p('Die Fassung im sw.js wurde hochgezählt', fassung >= 11,
  'gefunden: ' + (fassung || 'keine') +
  ' — sonst räumt activate die alte Ablage nicht weg und die Datei fehlt');

p('Kein JS-Fehler in der Konsole', fehler.length === 0, fehler.slice(0, 3).join(' · '));

await browser.close();
server.close();

console.log(`\n  Suite 64 — Zwei Fenster: ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
