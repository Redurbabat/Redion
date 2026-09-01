/* Suite 303 — Was nur beim Überfahren erscheint, gibt es am Telefon nicht (L108)
 * ============================================================================
 * E300 fand es an einer Kleinigkeit: im Telefonbild fehlte das Schliesskreuz
 * eines Reiters, während der Prüflauf an derselben Stelle `opacity: 1` mass.
 * Beide hatten recht — sie sahen zwei verschiedene Geräte an. `bilder.mts`
 * hatte das Telefon nur über die Bildgrösse nachgestellt, also galt dort
 * `hover:hover`.
 *
 * L108 fragte danach: WIE VIELE solche Stellen gibt es? Eine gezählte
 * Antwort gab es nicht. Dieser Lauf ist die Antwort und hält sie fest.
 *
 * ─── WAS GENAU EINE FALLE IST, UND WAS NICHT ────────────────────────────────
 *
 * Nicht jede `:hover`-Regel ist ein Problem. Von 327 machen 39 überhaupt
 * etwas sichtbar, und die meisten davon heben nur etwas hervor, das ohnehin
 * dasteht — ein Griff, der von 55 % auf 100 % geht, ist auf dem Telefon
 * einfach nur blasser.
 *
 * Eine FALLE ist es, wenn alle drei Dinge zusammenkommen:
 *
 *   1 · der Grundzustand ist ganz weg — `opacity:0`, `display:none`,
 *       `visibility:hidden`,
 *   2 · sichtbar wird es NUR über `:hover`,
 *   3 · und es gibt keinen zweiten Weg: kein `:focus-visible`, kein
 *       Zustandsklasse wie `.an`, kein `@media(hover:none)`.
 *
 * Dann ist der Griff auf einem Tastgerät nicht schwer zu finden, sondern
 * nicht vorhanden. Genau das war er neunmal.
 *
 *   §1 DIE MESSUNG findet Regeln, Grundzustände und Rettungen.
 *   §2 GEGENPROBE: eine erfundene Falle WIRD gefunden.
 *   §3 UND EINE GERETTETE wird NICHT gemeldet — dreimal, je Rettungsart.
 *   §4 IM ECHTEN BESTAND ist keine Falle mehr offen.
 *   §5 DIE ACHT von L108 haben wirklich einen Tast-Zweig bekommen.
 *
 *   node pruefungen/lauf/test303.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const STIL = path.join(WURZEL, 'quell/schale/stil');

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll),
    `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

type Regel = { datei: string; zeile: number; media: string; sel: string; koerper: string };

/**
 * Regeln samt Medienbedingung.
 *
 * JEDE geschweifte At-Regel wird auf den Stapel gelegt, nicht nur `@media`.
 * Der erste Entwurf legte nur `@media` ab und zählte trotzdem jede
 * schliessende Klammer als Ende — ein `@keyframes einblenden{…}` mitten im
 * Telefon-Zweig beendete ihn damit VORZEITIG. Die Folge war kein Fehler,
 * sondern etwas Schlimmeres: `#side-griff{display:none}` stand danach
 * scheinbar für alle Geräte da, und der Lauf meldete eine Falle, die keine
 * ist. Ein Wächter, der sich seine Funde ausdenkt, ist keiner.
 */
const regelnVon = (text: string, datei: string): Regel[] => {
  const raus: Regel[] = [];
  const stapel: string[] = [];
  const re = /@([a-z-]+)([^{}]*)\{|([^{}]+)\{([^{}]*)\}|\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m[1] !== undefined) stapel.push(m[1] === 'media' ? (m[2] ?? '').trim() : '');
    else if (m[3] !== undefined)
      raus.push({ datei, zeile: text.slice(0, m.index).split('\n').length,
                  media: stapel.filter(Boolean).join(' and '),
                  sel: m[3].trim(), koerper: m[4] ?? '' });
    else stapel.pop();
  }
  return raus;
};

const ZEIGT = /(^|;|\s)(opacity\s*:\s*(0?\.[1-9]\d*|1)\b|display\s*:\s*(flex|block|inline|inline-flex|inline-block|grid|table)|visibility\s*:\s*visible)/i;
const WEG   = /(^|;|\s)(opacity\s*:\s*0\s*(;|$|\s)|display\s*:\s*none|visibility\s*:\s*hidden)/i;
/**
 * Ein Telefon-Zweig.
 *
 * `hover:none` und `pointer:coarse` sind die genauen Fragen. `max-width`
 * zählt mit, weil Redion seinen Telefon-Zweig fast überall so schreibt —
 * und weil die Frage dieses Laufs nicht lautet „ist es exakt ein
 * Tastgerät", sondern „hat für dieses Element überhaupt jemand ans Telefon
 * gedacht". Ein `max-width`-Zweig, der den Griff sichtbar macht ODER ihn
 * ausdrücklich wegnimmt, ist eine Entscheidung. Keine Falle.
 */
const TAST  = /hover\s*:\s*none|pointer\s*:\s*coarse|max-width/i;
/** Ein zweiter Weg ohne Maus: Tastatur oder ein Zustand am Element selbst. */
const ANDERS = /:focus|\.an\b|\.on\b|\.aktiv\b|:checked/;

/** Der Teil eines Selektors, der sichtbar gemacht wird. */
const ziel = (teil: string): string => {
  const stueck = teil.trim().split(/\s*[>+~]\s*|\s+/);
  const letzte = stueck[stueck.length - 1] ?? teil;
  return (letzte.split(':')[0] || letzte).trim();
};

/** Die Fallen in einem Satz Regeln. */
const fallen = (regeln: Regel[]): string[] => {
  const raus: string[] = [];
  for (const r of regeln) {
    if (!r.sel.includes(':hover') || !ZEIGT.test(r.koerper)) continue;
    if (TAST.test(r.media)) continue;
    const teile = r.sel.split(',').map(x => x.trim());
    /* Steht in derselben Regel eine Fassung ohne `:hover`, ist alles gut. */
    if (teile.some(x => !x.includes(':hover'))) continue;
    const zieleAlle = [...new Set(teile.map(ziel).filter(Boolean))];

    for (const z of zieleAlle) {
      if (!/[.#]/.test(z)) continue;   /* `rect`, `button` — zu allgemein */
      const passt = (s: string): boolean =>
        new RegExp(z.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?![\\w-])').test(s);
      /* 1 · Ist der Grundzustand überhaupt ganz weg? */
      const grundWeg = regeln.some(g =>
        !g.sel.includes(':hover') && !TAST.test(g.media) && !ANDERS.test(g.sel) &&
        passt(g.sel) && WEG.test(g.koerper));
      if (!grundWeg) continue;
      /* 2 · Gibt es einen Weg ohne Maus — oder wenigstens eine
             Entscheidung? Wer den Griff im Telefon-Zweig ausdrücklich
             WEGNIMMT, hat ihn nicht vergessen. */
      const gerettet = regeln.some(g =>
        !g.sel.includes(':hover') && ZEIGT.test(g.koerper) && passt(g.sel) &&
        (TAST.test(g.media) || ANDERS.test(g.sel)));
      const entschieden = regeln.some(g =>
        !g.sel.includes(':hover') && TAST.test(g.media) && passt(g.sel) &&
        WEG.test(g.koerper));
      if (!gerettet && !entschieden) raus.push(`${r.datei}:${r.zeile} ${z}`);
    }
  }
  return [...new Set(raus)];
};

/* ------------------------------------------------------------------------ */
console.log('\n1 · Die Messung findet Regeln, Grundzustände und Rettungen');

const dateien = fs.readdirSync(STIL).filter(n => n.endsWith('.css')).sort();
const alle: Regel[] = [];
for (const n of dateien)
  alle.push(...regelnVon(fs.readFileSync(path.join(STIL, n), 'utf-8'), n));

p('Es gibt Stildateien', dateien.length >= 10, String(dateien.length));
p('Und darin Regeln', alle.length >= 1500, String(alle.length));
const hoverRegeln = alle.filter(r => r.sel.includes(':hover'));
p('Darunter viele mit :hover', hoverRegeln.length >= 200, String(hoverRegeln.length));
p('Und einige, die etwas sichtbar machen',
  hoverRegeln.filter(r => ZEIGT.test(r.koerper)).length >= 20,
  String(hoverRegeln.filter(r => ZEIGT.test(r.koerper)).length));

/* ------------------------------------------------------------------------ */
console.log('\n2 · GEGENPROBE: eine erfundene Falle wird gefunden');

const FALLE = `
.probe-griff{opacity:0; padding:4px}
.probe-zeile:hover .probe-griff{opacity:1}
`;
gleich('Die erfundene Falle wird gemeldet',
  fallen(regelnVon(FALLE, 'probe.css')).map(x => x.split(' ')[1]), ['.probe-griff']);

/* Und die zweite Sorte: `display:none`. */
const FALLE2 = `
.probe-leiste{display:none}
.probe-rahmen:hover .probe-leiste{display:flex}
`;
gleich('Auch die display-Fassung', fallen(regelnVon(FALLE2, 'probe.css')).length, 1);

/* ------------------------------------------------------------------------ */
console.log('\n3 · Drei Rettungen, und jede zählt');

const RETTUNG_TAST = FALLE + `
@media(hover:none){ .probe-griff{opacity:1} }
`;
gleich('Ein @media(hover:none) rettet', fallen(regelnVon(RETTUNG_TAST, 'probe.css')), []);

const RETTUNG_FOKUS = `
.probe-griff{opacity:0}
.probe-zeile:hover .probe-griff, .probe-griff:focus-visible{opacity:1}
`;
gleich('Ein :focus-visible in derselben Regel rettet',
  fallen(regelnVon(RETTUNG_FOKUS, 'probe.css')), []);

const RETTUNG_ZUSTAND = FALLE + `
.probe-griff.an{opacity:1}
`;
gleich('Und eine Zustandsklasse rettet', fallen(regelnVon(RETTUNG_ZUSTAND, 'probe.css')), []);

/* Was NICHT rettet: ein Griff, der ohnehin dasteht, ist keine Falle — aber
   auch keine Rettung, sondern gar kein Fall. */
const KEIN_FALL = `
.probe-blass{opacity:.55}
.probe-zeile:hover .probe-blass{opacity:1}
`;
gleich('Ein blasser, aber sichtbarer Griff ist kein Fall',
  fallen(regelnVon(KEIN_FALL, 'probe.css')), []);

/* ------------------------------------------------------------------------ */
console.log('\n4 · Im echten Bestand ist keine Falle mehr offen');

gleich('Keine Falle in quell/schale/stil/', fallen(alle), []);

/* ------------------------------------------------------------------------ */
console.log('\n5 · Die neun von L108 haben wirklich einen Tast-Zweig');

const tastRegeln = alle.filter(r => TAST.test(r.media));
/* Acht davon standen in der ersten Runde; `.stab-tools` fand erst der
   Wächter selbst, nachdem die acht zu waren. */
const NEUN: ReadonlyArray<readonly [string, string]> = [
  ['.tt-auf',      'ansichten.css'],
  ['.act',         'aufbau.css'],
  ['.bild-werk',   'bausteine.css'],
  ['.bild-griff',  'bausteine.css'],
  ['.ki-pin',      'bausteine.css'],
  ['.zeilen-aus',  'einstellungen.css'],
  ['.stab-griff',  'einstellungen.css'],
  ['.knopf-set',   'werkzeuge.css'],
  ['.stab-tools',  'werkzeuge.css']
];
const ohne = NEUN.filter(([klasse, datei]) =>
  !tastRegeln.some(r => r.datei === datei && r.sel.includes(klasse) && ZEIGT.test(r.koerper)))
  .map(([k]) => k);
gleich('Alle neun stehen unter @media(hover:none)', ohne, []);

/* Und der Reiter aus E300, mit dem alles anfing. */
p('Auch das Schliesskreuz des Reiters (E300)',
  tastRegeln.some(r => r.sel.includes('.rt-tab') && ZEIGT.test(r.koerper)));

/* Gegenprobe zu §5: die Liste misst wirklich etwas. Ein Name, den es nicht
   gibt, muss fehlen — sonst wäre der Punkt grün, weil er nichts prüft. */
p('Ein erfundener Name fehlt und würde auffallen',
  !tastRegeln.some(r => r.sel.includes('.gibt-es-nicht-xyz')));

/* ------------------------------------------------------------------------ */
console.log('\n6 · Im Browser gemessen: am Telefon da, am Rechner nicht');

/* GEMESSEN WIRD IN DER ECHTEN SEITE, nicht in einem nachgebauten Gerüst.
 *
 * Der erste Entwurf baute eine kleine HTML-Datei, die nur die Stildateien
 * lädt. Sie war schneller — und sie log: `table.grid td.tt .tt-auf` stand
 * dort als Regel im Blatt, `el.matches()` sagte ja, und die berechnete
 * Deckkraft war trotzdem 1. Dieselbe Erklärung als `<style>` im Kopf wirkte
 * sofort. Woran es lag, ist bis heute nicht geklärt.
 *
 * Und genau deshalb ist es weg. Ein Wächter, dessen Messung man nicht
 * erklären kann, ist keine Messung — er ist eine zweite Sache, die man
 * prüfen müsste. `index.html` hat den Stil, den Redur wirklich sieht.
 *
 * Das Gerüst wird in die laufende Seite gehängt: die neun Klassen aus echten
 * Blöcken zu erzeugen wäre neun Aufbauten lang, und geprüft wird hier der
 * STIL, nicht das Erzeugen. Dass die App diese Klassen vergibt, halten die
 * Bereichsläufe fest.
 */
const TYP: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon'
};
const PORT = 9312;
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

const PROBE = `
<table class="grid"><tr><td class="tt"><span class="tt-t">Zeile</span>
  <button class="tt-auf">⤢ Öffnen</button></td></tr></table>
<div class="row"><span>Baum</span><span class="act"><button>⋯</button></span></div>
<div class="bild-rahmen"><div class="bild-werk"><button>Zuschnitt</button></div>
  <div class="bild-griff"></div></div>
<div class="ki-chat"><span class="k">·</span>
  <button class="ki-pin">P</button><button class="ki-weg">X</button></div>
<table class="grid"><tr><td class="td-aus"><input class="zeilen-aus" type="checkbox"></td></tr></table>
<div class="stab-wrap"><div class="stab-griff x"></div>
  <div class="stab-tools"><button>Winkel</button></div></div>
<div class="knopf-blk"><button>Knopf</button><span class="knopf-set">Zahnrad</span></div>`;

const MESSEN = ['.tt-auf', '.act', '.bild-werk', '.bild-griff', '.ki-pin',
                '.zeilen-aus', '.stab-griff', '.stab-tools', '.knopf-set'];

const browser = await chromium.launch();
const lesen = async (telefon: boolean): Promise<Record<string, string>> => {
  const ctx = await browser.newContext(telefon
    ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }
    : { viewport: { width: 1440, height: 900 } });
  const seite = await ctx.newPage();
  await seite.goto(`http://localhost:${PORT}/index.html`);
  await seite.waitForTimeout(2600);
  const raus = await seite.evaluate(({ liste, markup }: { liste: string[]; markup: string }) => {
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    const lade = document.createElement('div');
    lade.id = 'l108-probe';
    lade.innerHTML = markup;
    document.body.appendChild(lade);
    const o: Record<string, string> = {};
    for (const k of liste) {
      const el = lade.querySelector(k);
      if (!el) { o[k] = 'fehlt'; continue; }
      const s = getComputedStyle(el);
      o[k] = s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0
        ? 'weg' : 'da';
    }
    lade.remove();
    return o;
  }, { liste: MESSEN, markup: PROBE });
  await ctx.close();
  return raus;
};

const amTelefon = await lesen(true);
const amRechner = await lesen(false);
await browser.close();
await new Promise<void>(f => server.close(() => f()));

gleich('Am Telefon ist jeder der neun Griffe da',
  MESSEN.filter(k => amTelefon[k] !== 'da').map(k => k + '=' + amTelefon[k]), []);
/* Und die Gegenprobe: am Rechner sind sie ohne Maus weiterhin weg. Wären
   sie es nicht, hätte der Tast-Zweig nichts verändert und §6 nichts
   gemessen. */
gleich('Am Rechner ohne Maus sind sie weg',
  MESSEN.filter(k => amRechner[k] !== 'weg').map(k => k + '=' + amRechner[k]), []);

console.log(`\n${ok}/${ok + weg} bestanden`);
process.exitCode = weg ? 1 : 0;
