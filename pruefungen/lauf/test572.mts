/* Suite 572 — EINE Werkzeugleiste für alle Flächen, zuerst am Whiteboard (E689, Bogen 5a, W6)
 * ============================================================================
 * Redur, 25. September 2026, mit einem Bild von AFFiNEs Edgeless-Leiste:
 * „ich will so was haben wie die affine schau mal es nach" — und einen Satz
 * später, nachdem ich die Leiste fürs Whiteboard eingeordnet hatte:
 * „integriere alles zusammen".
 *
 * ALSO NICHT EINE LEISTE FÜRS WHITEBOARD, sondern EINE für alle vier Flächen
 * (Whiteboard, Gedankenkarte, Planfläche, Blatt/PDF). Heute sind es vier:
 * vier Klassenpräfixe (`.wb-`, `.gk-`, `.sp-`, `.blatt-`), vier Klick-Handler,
 * vier Kataloge — und im Kern KEIN Werkzeugbegriff (doku/karte/thema-
 * werkzeugleisten.md, gelesen am 25. September). Dieser Bogen baut die zwei
 * Teile, die alle vier brauchen, und lässt EINE Fläche darauf umziehen.
 *
 * WAS DIESER LAUF HÄLT
 *
 *   §1  Der Kern kennt keinen Bereich. `core/gfx/toolbar.js` enthält kein
 *       `wb-`, kein `gk-`, kein `sp-`, kein `blatt-`, kein `Register`, kein
 *       `Store`, kein `App` (§5). Gelesen wird das GEBAUTE JavaScript, denn
 *       das ist, was läuft (wie test571 §1).
 *   §2  Es gibt EINEN Katalog: `Register.werkzeuge` kennt die Werkzeuge des
 *       Whiteboards UND die des Studios, gibt sie in der bestellten
 *       Reihenfolge heraus und lässt Unbekanntes weg statt `undefined`.
 *   §3  Und er läuft nicht mit dem Bestand auseinander: jede Kennung aus
 *       `Marken.WERKZEUGE` steht mit demselben Namen im Register (§8). So
 *       lange es zwei Listen gibt (bis 5b, L217), hält das diese Zusage.
 *   §4  Beide Dateien sind angemeldet: `<script>` in `index.html` UND Zeile
 *       im `GRUNDSTOCK` (§28) — und `toolbar.js` steht vor der Fläche.
 *   §5  DIE HARTE REGEL AUS §37: „Die Werkzeugleiste darf nicht verdecken,
 *       was sie bedient." Gemessen, nicht behauptet: die Oberkante der
 *       Leiste liegt unter der Unterkante der Zeichenfläche.
 *   §6  Am Rechner EINE Zeile statt drei, und kein Werkzeug steht ausserhalb
 *       des Kastens.
 *   §7  Am Telefon (390 px) misst jeder Knopf 44 px als GERENDERTE Box —
 *       nicht als `::after`-Behauptung (L206, `test551`s Lehre).
 *   §8  Ein Werkzeug ist gewählt, und zwar genau eines; ein Klick wechselt
 *       es; `aria-pressed` sagt die Wahrheit (§38).
 *   §9  Das Untermenü klappt NACH OBEN auf (es soll die Leiste nicht aus
 *       dem Kasten schieben), und Escape schliesst es (§38, E302).
 *   §10 Die alten Verträge halten: `.wb-tools [data-wz]`, `[data-a]`,
 *       `.wb-massstab` — daran hängen test209, test568, test570.
 *   §11 Strichzeichen statt Emoji, und jeder Knopf sagt einem Vorleser,
 *       was er ist (§38, `register/symbole.ts` Kopf).
 *   §12 Und was ein Mensch liest, kommt aus dem Katalog: `Marken.WERKZEUGE`
 *       IST der Katalogeintrag, und jeder Name im Menüband steht im Katalog
 *       oder in `Marken.FORMEN` (E694, L218).
 *   §13 EIN Tabstopp, auch wenn die Leiste losgelöst gebaut wurde; Tab
 *       erreicht sie in der Seitenansicht UND in der Fläche, Pfeile wandern,
 *       Escape schliesst ihr Menü zuerst (E722, §38).
 *
 * GEGEN DEN ALTEN STAND ist alles ab §1 rot: es gibt weder
 * `core/gfx/toolbar.js` noch `register/werkzeuge.js`, und die Leiste des
 * Whiteboards steht OBEN über der Fläche in drei Zeilen.
 *
 *   node pruefungen/alle.mts 572
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
let ok = 0, weg = 0;
const p = (n: string, wahr: unknown, extra = ''): void => {
  if (wahr) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};
const lies = (rel: string): string => {
  const f = path.join(WURZEL, rel);
  return fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : '';
};
/** Nur der CODE, ohne Kommentare und Zeichenketten.
 *
 *  DIESER HELFER IST EIN FUND DIESES BOGENS. Der erste Anlauf von §1 las den
 *  Rohtext und war rot mit „wb-, gk-, sp-, blatt-" — gefunden im KOPF des
 *  Kernbauteils, wo wörtlich steht, dass es diese Namen nicht kennt. Ein
 *  Wächter, der einen Kommentar für Code hält, meldet genau die Sorgfalt als
 *  Verstoss, die er erzwingen soll (derselbe Fehler wie in test444, siehe den
 *  Plan „Rot zuerst"). */
const nurCode = (quelle: string): string => quelle
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .replace(/(^|[^:])\/\/[^\n]*/g, '$1 ')
  .replace(/'(?:[^'\\\n]|\\.)*'/g, "''")
  .replace(/"(?:[^"\\\n]|\\.)*"/g, '""')
  .replace(/`(?:[^`\\]|\\.)*`/g, '``');

/* ==========================================================================
 * §1 · Der Kern kennt keinen Bereich (§5)
 * --------------------------------------------------------------------------
 * `src/core/` ist wie `kern/`: gemeinsame Logik, die keinen Bereich kennt und
 * keinen kennen darf. Eine Leiste, die „wb-" sagt, ist keine gemeinsame
 * Leiste, sondern die des Whiteboards mit einem neuen Ort.
 * ======================================================================== */
console.log('\n1 · Der Kern kennt keinen Bereich');
const kernJs = lies('quell/core/gfx/toolbar.js');
p('Es gibt `quell/core/gfx/toolbar.js`', kernJs.length > 500, `${kernJs.length} Zeichen`);
const kernCode = nurCode(kernJs);
const verboten = ['wb-', 'gk-', 'sp-', 'blatt-', 'whiteboard', 'Gedankenkarte', 'Planflaeche', 'Marken.'];
const gefunden = verboten.filter(w => kernCode.includes(w));
p('Und er nennt keine Fläche beim Namen', gefunden.length === 0, gefunden.join(', '));
for (const name of ['Register.', 'Store.', 'App.', 'UI.', 'Dialog.']) {
  p(`Er ruft ${name.replace('.', '')} nicht`, !kernCode.includes(name));
}
p('Er meldet sich als `GfxToolbar` an', /window as any\)\.GfxToolbar|\.GfxToolbar\s*=/.test(kernJs));

/* ==========================================================================
 * §2 · EIN Katalog (§8, §5 Regel 3)
 * ======================================================================== */
console.log('\n2 · Das Register der Werkzeuge');
const regJs = lies('quell/register/werkzeuge.js');
p('Es gibt `quell/register/werkzeuge.js`', regJs.length > 500, `${regJs.length} Zeichen`);
let R: any = null;
if (regJs) {
  const fenster: any = { window: {} };
  fenster.window = fenster;
  try {
    // eslint-disable-next-line no-new-func
    new Function('window', 'Register', regJs)(fenster, fenster.Register = {});
    R = fenster.Register.werkzeuge;
  } catch (e) { p('Das Register lässt sich laden', false, String(e).slice(0, 120)); }
}
p('`Register.werkzeuge` steht bereit', !!R && typeof R.alle === 'function');
if (R) {
  const alle = R.alle();
  /* 12 + 14 − 4: `stift`, `text`, `bild` und `radierer` gehören beiden Flächen
     und stehen deshalb EINMAL im Katalog (gezählt beim Schreiben, nicht geschätzt). */
  p('Es kennt 22 Werkzeuge — 12 Fläche + 14 Studio, vier davon geteilt', alle.length === 22, `${alle.length}`);
  const stift = R.holen('stift');
  p('Ein Eintrag hat Kennung, Name, Zeichen, Symbol und Gruppe',
    !!stift && !!stift.name && !!stift.zeichen && !!stift.sym && /^(quick|senior)$/.test(stift.gruppe),
    JSON.stringify(stift));
  const wahl = R.auswahl(['radierer', 'stift', 'gibtesnicht']);
  p('`auswahl` hält die bestellte Reihenfolge', wahl.map((w: any) => w.id).join(',') === 'radierer,stift',
    wahl.map((w: any) => w.id).join(','));
  p('Und lässt Unbekanntes weg statt `undefined` einzureihen',
    wahl.every((w: any) => w && w.id), JSON.stringify(wahl));
  const doppelt = alle.map((w: any) => w.id).filter((x: string, i: number, a: string[]) => a.indexOf(x) !== i);
  p('Keine Kennung steht zweimal darin', doppelt.length === 0, doppelt.join(', '));
  p('Jedes Werkzeug trägt ein Symbol aus `Register.symbole`',
    alle.every((w: any) => typeof w.sym === 'string' && w.sym.length > 1),
    alle.filter((w: any) => !w.sym).map((w: any) => w.id).join(', '));
}

/* ==========================================================================
 * §3 · EINE Liste, nicht drei (§8, L218)
 * --------------------------------------------------------------------------
 * Bis Bogen 5b hielt dieser Abschnitt zwei Listen im Gleichlauf: was in
 * `Marken.WERKZEUGE` stand, musste mit demselben Namen im Register stehen.
 * Das war die richtige Zusage, solange es zwei Listen GAB — aber eine Zusage
 * über einen Zustand, den §8 verbietet.
 *
 * Seit E694 gibt es nur noch eine. Der Abschnitt prüft deshalb jetzt das
 * Stärkere: dass die zwei Abschriften WEG sind und niemand sie
 * zurückschreibt.
 *
 *   marken.ts      hielt 14 Werkzeuge mit Kennung, Zeichen, Symbol, Name, Titel
 *   menueband.ts   hielt 13 Vierertupel [id, Name, Zeichen, Hinweis] — neun
 *                  davon Studiowerkzeuge, vier aus `Marken.FORMEN`
 *
 * Gemessen wird am QUELLTEXT (die Abschrift darf nicht wiederkommen) UND am
 * laufenden Programm (die Namen, die ein Mensch sieht, kommen aus dem
 * Katalog).
 * ======================================================================== */
console.log('\n3 · Eine Liste, nicht drei');
const markenTs = lies('src/bereiche/pdf/marken.ts');
const bandTs = lies('src/register/menueband.ts');
p('`marken.ts` gibt es', markenTs.length > 1000, `${markenTs.length} Zeichen`);

/* Die Abschrift im Studio: ein `const WERKZEUGE = [` mit Objektliteralen,
   die `name:` tragen. Gezählt wird im CODE, nicht im Rohtext — sonst zählte
   der Kopfkommentar mit, der beschreibt, was hier NICHT mehr stehen darf
   (derselbe Fehler wie in §1). */
const markenCode = nurCode(markenTs);
const studioBlock = (() => {
  const i = markenCode.indexOf('const WERKZEUGE = [');
  if (i < 0) return '';
  const j = markenCode.indexOf('];', i);
  return j < 0 ? markenCode.slice(i) : markenCode.slice(i, j);
})();
p('`marken.ts` hält KEINE eigene Werkzeugliste mehr',
  studioBlock === '' || !/name\s*:/.test(studioBlock),
  studioBlock ? `${(studioBlock.match(/id\s*:/g) ?? []).length} Einträge mit Feldern` : 'kein Block');
p('Und holt sie aus dem Katalog', /Register\.werkzeuge\.(auswahl|alle|holen)/.test(markenCode),
  'kein `Register.werkzeuge.…` in marken.ts');

/* Die Abschrift im Menüband: Vierertupel mit Namen. Danach darf dort nur noch
   eine Liste von KENNUNGEN stehen — eine Reihenfolge ist keine zweite
   Wahrheit, ein Name schon. */
const bandCode = nurCode(bandTs);
const bandBlock = (() => {
  const i = bandCode.indexOf('const WERKZEUGE');
  if (i < 0) return '';
  const j = bandCode.indexOf('];', i);
  return j < 0 ? bandCode.slice(i) : bandCode.slice(i, j);
})();
p('`menueband.ts` hält nur noch Kennungen, keine Namen',
  bandBlock !== '' && !/,\s*''\s*,/.test(bandBlock),
  bandBlock.replace(/\s+/g, ' ').slice(0, 160));
p('Und holt Name und Zeichen aus dem Katalog',
  /Register\.werkzeuge\.holen/.test(bandCode), 'kein `Register.werkzeuge.holen` im Menüband');

/* ==========================================================================
 * §4 · Angemeldet an beiden Stellen (§28)
 * ======================================================================== */
console.log('\n4 · Die zwei Dateien sind angemeldet');
const html = lies('index.html');
const sw = lies('src/dienst/sw.ts');
p('`index.html` lädt das Register', html.includes('quell/register/werkzeuge.js'));
p('`index.html` lädt das Kernbauteil', html.includes('quell/core/gfx/toolbar.js'));
p('Der GRUNDSTOCK kennt das Register (§28)', sw.includes('quell/register/werkzeuge.js'));
p('Der GRUNDSTOCK kennt das Kernbauteil (§28)', sw.includes('quell/core/gfx/toolbar.js'));
p('Das Kernbauteil steht VOR der Zeichenfläche',
  html.indexOf('quell/core/gfx/toolbar.js') < html.indexOf('bloecke/arten/zeichenflaeche.js'),
  `${html.indexOf('quell/core/gfx/toolbar.js')} gegen ${html.indexOf('bloecke/arten/zeichenflaeche.js')}`);
p('Das Register steht VOR der Zeichenfläche',
  html.indexOf('quell/register/werkzeuge.js') < html.indexOf('bloecke/arten/zeichenflaeche.js'));

/* --- Ab hier der Browser --------------------------------------------------- */
const TYP: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon'
};
const server = http.createServer((a, b) => {
  const rein = decodeURIComponent((a.url ?? '/').split('?')[0] ?? '/');
  const pfad = path.join(WURZEL, rein === '/' ? 'index.html' : rein.slice(1));
  if (!pfad.startsWith(WURZEL) || !fs.existsSync(pfad) || fs.statSync(pfad).isDirectory()) {
    b.writeHead(404); b.end(); return;
  }
  b.writeHead(200, { 'Content-Type': TYP[path.extname(pfad)] ?? 'application/octet-stream' });
  b.end(fs.readFileSync(pfad));
});
await new Promise<void>(f => { server.listen(0, '127.0.0.1', () => f()); });
const PORT = (server.address() as { port: number }).port;
const browser = await chromium.launch();

const bauen = async (breite: number, hoehe: number) => {
  const pg = await browser.newPage({ viewport: { width: breite, height: hoehe } });
  await pg.goto(`http://127.0.0.1:${PORT}/index.html`);
  await pg.waitForFunction(() => typeof App !== 'undefined' && !!document.querySelector('#page')?.firstElementChild);
  await pg.evaluate(async () => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung').forEach(el => el.remove());
    const s = Store.addPage(null, { text: 'Werkzeugleiste' });
    (window as any).__seite572 = s.id;
    Store.addBlock(s.id, 'whiteboard', { text: 'Skizze', hoehe: 360, shapes: [
      { id: 'f1', art: 'rechteck', x: 60, y: 60, w: 180, h: 90, farbe: '#529cca' }
    ] });
    await Store.flush(); App.zeichneBaum(); App.oeffne(s.id);
    await new Promise(f => setTimeout(f, 900));
    document.querySelectorAll('#rg-willkommen, .overlay').forEach(x => x.remove());
  });
  await pg.waitForTimeout(250);
  return pg;
};

/* ==========================================================================
 * §5 · Die Leiste verdeckt nicht, was sie bedient (§37, HART)
 * --------------------------------------------------------------------------
 * AFFiNEs Leiste schwebt ÜBER der Fläche. Redions §37 sagt das Gegenteil, und
 * zwar als harte Regel. Deshalb schwebt die Leiste hier in einem Sockel UNTER
 * der Zeichenfläche: dasselbe Bild (gerundet, eigener Grund, Schatten, unten
 * in der Mitte), aber kein verdeckter Strich — und kein Zeigerdruck, der auf
 * der Leiste landet statt auf der Fläche (`test209` setzt bis 20 px an den
 * unteren Rand).
 * ======================================================================== */
console.log('\n5 · Die Leiste verdeckt die Fläche nicht (§37)');
const rechner = await bauen(1300, 950);
const lage = await rechner.evaluate(() => {
  const leiste = document.querySelector('.wb-tools')?.getBoundingClientRect();
  const flaeche = document.querySelector('.wb-flaeche')?.getBoundingClientRect();
  const kasten = document.querySelector('.wb')?.getBoundingClientRect();
  const z = (r?: DOMRect) => r ? { t: Math.round(r.top), b: Math.round(r.bottom), l: Math.round(r.left), r: Math.round(r.right), h: Math.round(r.height), w: Math.round(r.width) } : null;
  return { leiste: z(leiste as DOMRect), flaeche: z(flaeche as DOMRect), kasten: z(kasten as DOMRect) };
});
p('Es gibt eine Leiste und eine Fläche', !!lage.leiste && !!lage.flaeche, JSON.stringify(lage));
p('Die Leiste steht UNTER der Fläche, nicht darüber',
  !!lage.leiste && !!lage.flaeche && lage.leiste.t >= lage.flaeche.b - 1,
  `Leiste oben ${lage.leiste?.t} · Fläche unten ${lage.flaeche?.b}`);
p('Und sie bleibt im Kasten',
  !!lage.leiste && !!lage.kasten && lage.leiste.l >= lage.kasten.l - 1 && lage.leiste.r <= lage.kasten.r + 1,
  `Leiste ${lage.leiste?.l}…${lage.leiste?.r} · Kasten ${lage.kasten?.l}…${lage.kasten?.r}`);

/* ==========================================================================
 * §6 · Eine Zeile statt drei
 * ======================================================================== */
console.log('\n6 · Am Rechner eine Zeile');
const zeilen = await rechner.evaluate(() => {
  const knoepfe = [...document.querySelectorAll<HTMLElement>('.wb-tools button')]
    .filter(b => b.offsetParent !== null);
  const oben = new Set(knoepfe.map(b => Math.round(b.getBoundingClientRect().top)));
  const kasten = document.querySelector('.wb')!.getBoundingClientRect();
  return {
    zeilen: oben.size,
    knoepfe: knoepfe.length,
    raus: knoepfe.filter(b => b.getBoundingClientRect().right > kasten.right + 1).length,
    hoehe: Math.round(document.querySelector('.wb-tools')!.getBoundingClientRect().height),
    kapsel: Math.round(document.querySelector('.gfx-tb-haupt')!.getBoundingClientRect().height),
    rollt: (() => { const s = document.querySelector('.gfx-tb-roller') as HTMLElement; return s.scrollWidth > s.clientWidth + 1; })()
  };
});
p('Die Knöpfe stehen in EINER Zeile', zeilen.zeilen === 1, `${zeilen.zeilen} Zeilen, ${zeilen.knoepfe} Knöpfe`);
p('Die Kapsel ist höchstens 44 px hoch', zeilen.kapsel <= 44, `Kapsel ${zeilen.kapsel} px, Sockel ${zeilen.hoehe} px`);
p('Und der ganze Sockel höchstens 64 px', zeilen.hoehe <= 64, `${zeilen.hoehe} px`);
p('Kein Knopf steht ausserhalb des Kastens', zeilen.raus === 0, `${zeilen.raus} draussen`);
p('Und am Rechner muss niemand rollen — alles passt', zeilen.rollt === false);

/* ==========================================================================
 * §8 · Genau ein Werkzeug ist gewählt (§38)
 * ======================================================================== */
console.log('\n8 · Ein Werkzeug ist gewählt, und man sieht es');
const vorher = await rechner.evaluate(() => {
  const an = [...document.querySelectorAll<HTMLElement>('.wb-tools [data-wz]')]
    .filter(b => b.getAttribute('aria-pressed') === 'true');
  return { anzahl: an.length, id: an[0]?.dataset.wz ?? '' };
});
p('Genau ein Werkzeug trägt `aria-pressed="true"`', vorher.anzahl === 1, `${vorher.anzahl} (${vorher.id})`);
await rechner.click('.wb-tools [data-wz="rechteck"]');
await rechner.waitForTimeout(150);
const nachher = await rechner.evaluate(() => {
  const an = [...document.querySelectorAll<HTMLElement>('.wb-tools [data-wz]')]
    .filter(b => b.getAttribute('aria-pressed') === 'true');
  return { anzahl: an.length, id: an[0]?.dataset.wz ?? '' };
});
p('Ein Klick wechselt es, und es bleibt genau eines',
  nachher.anzahl === 1 && nachher.id === 'rechteck', `${nachher.anzahl} (${nachher.id})`);

/* ==========================================================================
 * §9 · Das Untermenü klappt nach oben und Escape schliesst es
 * ======================================================================== */
console.log('\n9 · Das Untermenü');
const menue = await rechner.evaluate(async () => {
  const knopf = document.querySelector<HTMLElement>('.wb-tools [data-menue]');
  if (!knopf) return { da: false };
  knopf.click();
  await new Promise(f => setTimeout(f, 180));
  const m = document.querySelector<HTMLElement>('.gfx-tb-menue');
  if (!m) return { da: true, offen: false };
  const mr = m.getBoundingClientRect(), kr = knopf.getBoundingClientRect();
  /* NICHT NUR DIE LAGE, SONDERN OB MAN ES SIEHT. Der erste Stand dieses
     Bogens hatte das Menü genau richtig gesetzt — und ein rollender Vorfahr
     schnitt es ab; gemessen war alles grün, auf dem Bild war nichts (§55.1).
     elementFromPoint fragt den Browser, was an der Stelle WIRKLICH liegt. */
  const tupfer = m.querySelector('button');
  const tr = tupfer?.getBoundingClientRect();
  const getroffen = tr ? document.elementFromPoint(tr.left + tr.width / 2, tr.top + tr.height / 2) : null;
  return { da: true, offen: true, nachOben: mr.bottom <= kr.top + 2,
    trefferImMenue: !!getroffen && m.contains(getroffen),
    wasLiegtDa: (getroffen as HTMLElement | null)?.className ?? '(nichts)',
    masse: `Menü ${Math.round(mr.top)}…${Math.round(mr.bottom)} · Knopf ${Math.round(kr.top)}` };
});
p('Es gibt einen Knopf mit Untermenü', menue.da === true);
p('Und es klappt auf', menue.offen === true);
p('Es klappt NACH OBEN auf', menue.nachOben === true, menue.masse ?? '');
p('Und man kann wirklich hineintippen — nichts schneidet es ab',
  menue.trefferImMenue === true, 'an der Stelle liegt: ' + (menue.wasLiegtDa ?? ''));
await rechner.keyboard.press('Escape');
await rechner.waitForTimeout(150);
p('Escape schliesst es (§38)',
  await rechner.evaluate(() => !document.querySelector('.gfx-tb-menue')));

/* ==========================================================================
 * §10 · Die alten Verträge halten
 * ======================================================================== */
console.log('\n10 · Was test209, test568 und test570 anfassen');
const vertrag = await rechner.evaluate(() => ({
  werkzeuge: document.querySelectorAll('.wb-tools [data-wz]').length,
  rechteck: !!document.querySelector('.wb-tools [data-wz="rechteck"]'),
  zurueck: !!document.querySelector('.wb-tools [data-a="zurueck"]'),
  vor: !!document.querySelector('.wb-tools [data-a="vor"]'),
  groesser: !!document.querySelector('.wb-tools [data-a="groesser"]'),
  passend: !!document.querySelector('.wb-tools [data-a="passend"]'),
  massstab: document.querySelector('.wb-massstab')?.textContent?.trim() ?? '',
  knoepfe: document.querySelectorAll('.wb-tools button').length
}));
p('`.wb-tools [data-wz="rechteck"]` gibt es', vertrag.rechteck);
p('`[data-a="zurueck"]`, `[data-a="vor"]`, `[data-a="groesser"]`, `[data-a="passend"]` auch',
  vertrag.zurueck && vertrag.vor && vertrag.groesser && vertrag.passend, JSON.stringify(vertrag));
p('`.wb-massstab` sagt 100 %', vertrag.massstab === '100 %', vertrag.massstab);
p('Die Leiste hat mindestens 18 Knöpfe (test209 §9)', vertrag.knoepfe >= 18, `${vertrag.knoepfe}`);
p('Alle zwölf Werkzeuge sind da', vertrag.werkzeuge === 12, `${vertrag.werkzeuge}`);

/* ==========================================================================
 * §11 · Striche statt Emoji, und ein Wort für den Vorleser (§38)
 * ======================================================================== */
console.log('\n11 · Zeichen und Namen');
const zeichen = await rechner.evaluate(() => {
  const kn = [...document.querySelectorAll<HTMLElement>('.wb-tools button')];
  const emoji = /[\u{1F300}-\u{1FAFF}\u{2700}-\u{27BF}\u{2B00}-\u{2BFF}]/u;
  return {
    mitSvg: kn.filter(b => !!b.querySelector('svg')).length,
    gesamt: kn.length,
    mitEmoji: kn.filter(b => emoji.test(b.textContent ?? '')).map(b => b.dataset.wz ?? b.dataset.a ?? '?'),
    ohneNamen: kn.filter(b => !(b.getAttribute('aria-label') || b.getAttribute('title') || (b.textContent ?? '').trim())).length
  };
});
p('Jeder Knopf trägt ein Strichzeichen', zeichen.mitSvg === zeichen.gesamt, `${zeichen.mitSvg} von ${zeichen.gesamt}`);
p('Und keiner mehr ein Emoji', zeichen.mitEmoji.length === 0, zeichen.mitEmoji.join(', '));
p('Jeder Knopf sagt einem Vorleser, was er ist (§38)', zeichen.ohneNamen === 0, `${zeichen.ohneNamen} stumm`);
await rechner.close();

/* ==========================================================================
 * §7 · Am Telefon 44 px, GEMESSEN (§37, L206)
 * --------------------------------------------------------------------------
 * `test402` prüft dieselbe Regel über eine Textsuche nach `height:` in den
 * Stilblättern und konnte die 26 px des Whiteboards deshalb nie sehen — sie
 * kamen aus Innenabstand und Schriftgrösse (L206). Hier wird die GERENDERTE
 * Box gemessen, und zwar die des Knopfes selbst, nicht die seines `::after`.
 * ======================================================================== */
console.log('\n7 · Am Telefon (390 px)');
const handy = await bauen(390, 844);
const klein = await handy.evaluate(() => {
  const kn = [...document.querySelectorAll<HTMLElement>('.wb-tools button')].filter(b => b.offsetParent !== null);
  const kasten = document.querySelector('.wb')!.getBoundingClientRect();
  const masse = kn.map(b => { const r = b.getBoundingClientRect(); return { id: b.dataset.wz ?? b.dataset.a ?? '?', w: Math.round(r.width), h: Math.round(r.height) }; });
  const leiste = document.querySelector('.wb-tools')!.getBoundingClientRect();
  return {
    zuKlein: masse.filter(m => m.h < 44 || m.w < 44),
    anzahl: masse.length,
    letzterErreichbar: (() => {
      const s = document.querySelector('.gfx-tb-roller') as HTMLElement;
      s.scrollLeft = s.scrollWidth;
      const letzter = kn[kn.length - 1]!.getBoundingClientRect();
      const sr = s.getBoundingClientRect();
      const gut = letzter.right <= sr.right + 1 && letzter.left >= sr.left - 1;
      s.scrollLeft = 0;
      return gut;
    })(),
    leisteDrin: (() => {
      const s = document.querySelector('.wb-tools')!.getBoundingClientRect();
      return s.left >= kasten.left - 1 && s.right <= kasten.right + 1;
    })(),
    rollMasse: (() => { const s = document.querySelector('.gfx-tb-roller') as HTMLElement;
      return `Inhalt ${Math.round(s.scrollWidth)} px in ${Math.round(s.clientWidth)} px`; })(),
    zeilen: new Set(kn.map(b => Math.round(b.getBoundingClientRect().top))).size,
    hoehe: Math.round(leiste.height)
  };
});
p('Jeder sichtbare Knopf misst 44 px (gerenderte Box)', klein.zuKlein.length === 0,
  klein.zuKlein.map(m => `${m.id} ${m.w}×${m.h}`).join(' · '));
/* AM TELEFON ROLLT DIE LEISTE (E356, wie die Studioleiste). „Steht ausserhalb
   des Kastens" ist dort kein Fehler, sondern der Zustand vor dem Rollen —
   gemessen wird deshalb, ob man JEDEN Knopf erreichen kann. */
p('Der letzte Knopf ist durch Rollen erreichbar', klein.letzterErreichbar === true, klein.rollMasse ?? '');
p('Und die Leiste selbst bleibt im Kasten', klein.leisteDrin === true);
p('Die Leiste bleibt eine Zeile (sie rollt, statt umzubrechen)', klein.zeilen === 1,
  `${klein.zeilen} Zeilen bei ${klein.anzahl} Knöpfen, ${klein.hoehe} px hoch`);
await handy.close();

/* ==========================================================================
 * §12 · Was ein Mensch liest, kommt aus dem Katalog (§8, L218)
 * --------------------------------------------------------------------------
 * §3 misst den Quelltext: die Abschriften sind weg. Hier wird gemessen, was
 * daraus im LAUFENDEN Programm wird — denn eine Datei, die aus dem Katalog
 * liest und daneben etwas anderes anzeigt, hätte nichts gewonnen.
 *
 * Zwei Kataloge sind erlaubt, und das ist kein Widerspruch zu §8: die vier
 * Formen des Menübands (`line`, `arrow`, `rectangle`, `ellipse`) sind KEINE
 * Werkzeuge des Studios, sondern Einträge aus `Marken.FORMEN` — im Studio
 * liegen sie unter dem einen Knopf `formen`. Ihre Kennungen stehen so in
 * jeder gespeicherten Marke (§53.3) und dürfen sich nicht in die deutschen
 * Flächen-Kennungen `linie`/`pfeil`/`rechteck`/`ellipse` verwandeln.
 * ======================================================================== */
console.log('\n12 · Die Namen kommen aus dem Katalog');
const pgk = await bauen(1400, 950);
/* EIN ECHTES BLATT, KEIN GESTELLTES ZIEL (§30: keine Mocks, wo die echte App
   geprueft werden kann). Der Reiter „Zeichnen" zeigt seine Werkzeuge nur,
   wenn `Zeichenziel.da()` wahr ist - und das meldet das Studio, wenn ein
   Blatt offen liegt. Der erste Anlauf mass ohne Blatt und fand null
   Werkzeuge; das sah nach einem Fund aus und war nur eine fehlende Seite. */
await pgk.evaluate(async () => {
  const s = Store.addPage(null, { text: 'Blatt fuer das Band' });
  Store.addBlock(s.id, 'blatt', { text: '', blattBreite: 595.28, blattHoehe: 841.89,
                                  raumVersion: 1, marken: [] });
  await Store.flush(); App.zeichneBaum(); App.oeffne(s.id);
  await new Promise(f => setTimeout(f, 900));
});
await pgk.waitForTimeout(400);
const katalog = await pgk.evaluate(() => {
  const reg = (id: string) => (Register as any).werkzeuge.holen(id);
  const form = (id: string) => ((Marken as any).FORMEN ?? []).find((f: any) => f.id === id);
  /* `inReiter` gibt GRUPPEN zurueck (`{gruppe, eintraege}`), keine flache
     Liste - der erste Anlauf filterte darauf nach `e.id` und fand null. Ein
     Waechter, der eine Form annimmt statt sie nachzusehen, ist aus dem
     falschen Grund rot (L206). */
  const band = (Register as any).menueband.inReiter('zeichnen')
    .filter((g: any) => g.gruppe === 'Werkzeug')
    .flatMap((g: any) => g.eintraege ?? [])
    .map((e: any) => ({ id: String(e.id).replace(/^wz-/, ''), name: e.name, zeichen: e.zeichen }));
  return {
    studio: ((Marken as any).WERKZEUGE ?? []).map((w: any) => ({ id: w.id, name: w.name })),
    studioSchief: ((Marken as any).WERKZEUGE ?? []).filter((w: any) => {
      const r = reg(w.id); return !r || r.name !== w.name || r.zeichen !== w.zeichen;
    }).map((w: any) => w.id),
    band,
    /* BEIDE Kataloge werden gefragt, nicht der erste, der antwortet.
       `ellipse` gibt es ZWEIMAL: als Flaechenwerkzeug (`◯`) und als
       Studio-Form (`○`). Ein `reg(id) ?? form(id)` haette die Form
       stillschweigend durch das Werkzeug ersetzt - und der Waechter waere
       rot geworden, obwohl das Band recht hat. */
    bandSchief: band.filter((e: any) => {
      const kandidaten = [reg(e.id), form(e.id)].filter(Boolean);
      return !kandidaten.some((q: any) => q.name === e.name && q.zeichen === e.zeichen);
    }).map((e: any) => e.id)
  };
});
p('`Marken.WERKZEUGE` gibt es weiter — andere Stellen lesen es',
  katalog.studio.length === 14, `${katalog.studio.length} Einträge`);
p('Und jeder Eintrag IST der Katalogeintrag (Name und Zeichen)',
  katalog.studioSchief.length === 0, katalog.studioSchief.join(', '));
p('Das Menüband zeigt 13 Werkzeuge', katalog.band.length === 13, `${katalog.band.length}`);
p('Und jeder Name dort steht im Katalog oder in `Marken.FORMEN`',
  katalog.bandSchief.length === 0, katalog.bandSchief.join(', '));
/* Die Formkennungen bleiben englisch — sie stehen so in gespeicherten Marken. */
p('Die vier Formen heissen weiter `line`, `arrow`, `rectangle`, `ellipse`',
  ['line', 'arrow', 'rectangle', 'ellipse'].every(id => katalog.band.some((e: any) => e.id === id)),
  katalog.band.map((e: any) => e.id).join(','));
await pgk.close();

/* ==========================================================================
 * §13 · EIN Tabstopp, auch wenn die Leiste losgelöst gebaut wurde (E722, §38)
 * --------------------------------------------------------------------------
 * Gemessen am 6. Oktober, gegen 1bfaca53: NULL Knöpfe mit `tabIndex 0` in
 * beiden Leisten, und eine Tab-Runde von 60 Tasten erreichte keinen davon.
 * `tabstoppSetzen` lief am Ende von `erstelle`, als die Wurzel noch nicht im
 * Dokument hing — `offsetParent` ist dort für JEDEN Knopf `null`, die Liste
 * leer, und erst ein Mausklick auf ein Werkzeug setzte einen Halt. Wer nur
 * die Tastatur hat, kam nie an die Werkzeuge.
 * ======================================================================== */
console.log('\n13 · Ein Tabstopp, auch losgelöst gebaut (§38)');
const pt = await bauen(1400, 950);
const losgeloest = await pt.evaluate(() => {
  const G = (window as any).GfxToolbar;
  const l = G.erstelle({
    werkzeuge: [{ id: 'eins', name: 'Eins', sym: 'cursor' }, { id: 'zwei', name: 'Zwei', sym: 'hand' }],
    aktiv: 'zwei', aktionen: [{ id: 'x', name: 'Zurück', sym: 'undo' }] });
  const halt = [...l.element.querySelectorAll('button')]
    .filter((b: any) => b.tabIndex === 0).map((b: any) => b.dataset.wz ?? b.dataset.a);
  l.zerstoere();
  return halt;
});
p('Losgelöst gebaut trägt die Leiste schon EINEN Tabstopp — das gewählte Werkzeug',
  losgeloest.length === 1 && losgeloest[0] === 'zwei', JSON.stringify(losgeloest));
const halteSeite = await pt.evaluate(() =>
  [...document.querySelectorAll<HTMLElement>('.wb-tools button')].filter(b => b.tabIndex === 0).length);
p('Seitenansicht: die Leiste des Whiteboards ist genau EIN Tabstopp', halteSeite === 1, `${halteSeite}`);
await pt.evaluate(() => document.querySelector<HTMLElement>('.wb')?.focus());
await pt.keyboard.press('Tab');
/* EIN KNOPF, nicht irgendetwas in der Leiste: Chrome macht einen Roller
   ohne erreichbaren Knopf selbst zum Tabhalt (`.gfx-tb-roller` rollt). Der
   erste Anlauf dieses Abschnitts war deshalb gegen den alten Stand GRÜN —
   der Fokus lag im Roller, nicht auf einem Werkzeug (L206). */
const imBalken = await pt.evaluate(() => ({
  drin: !!document.activeElement?.closest('.wb-tools') && document.activeElement?.tagName === 'BUTTON',
  name: (document.activeElement as HTMLElement | null)?.getAttribute('aria-label') ?? '' }));
p('Tab vom Whiteboard aus erreicht seine Leiste', imBalken.drin, JSON.stringify(imBalken));
await pt.keyboard.press('ArrowRight');
const gewandert = await pt.evaluate(() => ({
  drin: !!document.activeElement?.closest('.wb-tools'),
  name: (document.activeElement as HTMLElement | null)?.getAttribute('aria-label') ?? '' }));
p('Pfeil rechts wandert in der Leiste', imBalken.drin && gewandert.drin && gewandert.name !== imBalken.name,
  `${imBalken.name} → ${gewandert.name}`);
await pt.evaluate(() => document.querySelector<HTMLElement>('.wb-tools [data-menue]')?.focus());
await pt.keyboard.press('Enter');
await pt.waitForTimeout(150);
const offen13 = await pt.evaluate(() => !!document.querySelector('.wb-tools .gfx-tb-menue'));
await pt.keyboard.press('Escape');
await pt.waitForTimeout(150);
const zu13 = await pt.evaluate(() => ({
  menue: !!document.querySelector('.wb-tools .gfx-tb-menue'),
  drin: !!document.activeElement?.closest('.wb-tools') }));
p('Enter öffnet ihr Menü, Escape schliesst es zuerst, und der Fokus bleibt in der Leiste',
  offen13 && !zu13.menue && zu13.drin, JSON.stringify({ offen13, ...zu13 }));
/* Dieselbe Seite als Fläche: dort ist die Leiste der Schacht (E722). */
await pt.evaluate(async () => {
  const id = (window as any).__seite572 as string;
  Store.updateBlock(id, { seitenAnsicht: 'flaeche' }); await Store.flush(); App.oeffne(id);
  await new Promise(f => setTimeout(f, 900));
});
const halteFlaeche = await pt.evaluate(() =>
  [...document.querySelectorAll<HTMLElement>('.pg-flaeche > .gfx-tb-sockel button')].filter(b => b.tabIndex === 0).length);
p('Fläche: die eine Leiste ist genau EIN Tabstopp', halteFlaeche === 1, `${halteFlaeche}`);
await pt.evaluate(() => document.querySelector<HTMLElement>('.pg-flaeche')?.focus());
let runde = 0, angekommen = false;
for (; runde < 60 && !angekommen; runde++) {
  await pt.keyboard.press('Tab');
  angekommen = await pt.evaluate(() => !!document.activeElement?.closest('.pg-flaeche > .gfx-tb-sockel')
    && document.activeElement?.tagName === 'BUTTON');
}
p('Fläche: Tab erreicht die Leiste', angekommen, `nach ${runde} Mal Tab nicht`);
await pt.close();

/* Desktop gallery: selecting a tool from another controller must reveal its
   real card without triggering a second command. Labels remain derived from
   the accessible name and hidden outside desktop conditions. */
const pd = await bauen(1400, 950);
const gallery = await pd.evaluate(async () => {
  const G = (window as any).GfxToolbar;
  const ids = ['a','b','c','d','e','f'];
  let actions = 0;
  const toolbar = G.erstelle({
    werkzeuge: ids.map(id => ({id,name:'Werkzeug '+id,titel:'Werkzeug '+id,sym:'cursor',zeichen:'',gruppe:'senior'})),
    aktiv:'a',galerie:{schnell:[],karten:ids.map(id=>({id,knoepfe:[id]})),edgeless:{zusatz:[]}},
    aufWerkzeug:()=>actions++
  });
  document.body.append(toolbar.element);
  const strip = toolbar.element.querySelector('.gfx-tb-kartenfenster') as HTMLElement;
  strip.style.flex='0 0 96px'; strip.style.width='96px';
  await new Promise(resolve=>setTimeout(resolve,100));
  const target = toolbar.element.querySelector('[data-wz="f"]') as HTMLButtonElement;
  const before = target.closest<HTMLElement>('.gfx-tb-karte')?.hidden;
  toolbar.setzeWerkzeug('f');
  const after = target.closest<HTMLElement>('.gfx-tb-karte')?.hidden;
  const label = target.querySelector('.gfx-tb-desktop-name')?.textContent;
  const pressed = target.getAttribute('aria-pressed');
  document.documentElement.setAttribute('data-windows-titelleiste','');
  const material = getComputedStyle(toolbar.element.querySelector('.gfx-tb-haupt')!, '::before').borderImageSource;
  const caption = getComputedStyle(target.querySelector('.gfx-tb-desktop-name')!).display;
  document.documentElement.removeAttribute('data-windows-titelleiste');
  toolbar.zerstoere();
  return {before,after,label,pressed,actions,material,caption};
});
p('Desktop: externe Werkzeugwahl zeigt die aktive Karte und ihren Namen, ohne Doppelaktion',
  gallery.before===true && gallery.after===false && gallery.label==='Werkzeug f' && gallery.pressed==='true' && gallery.actions===0,JSON.stringify(gallery));
p('Windows Studio: Desktop-Namen sichtbar und Dock ohne festes Rasterbild',
  gallery.material==='none' && gallery.caption==='block',JSON.stringify(gallery));
await pd.close();

await browser.close();
server.close();
console.log(`\n${ok} ok, ${weg} rot`);
process.exit(weg ? 1 : 0);
