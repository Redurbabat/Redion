/* Suite 609 — Die Vorlage „Dark (2017–2020)" ist eingebaut und heil (E739)
 * ============================================================================
 * WAS HIER GEHALTEN WIRD. Redur hat am 30. September 2026 auf seinem Zweig
 * `feat/dark-2017-fach-dossier` ein Serienfach geschrieben:
 * `src/bereiche/wissen/dark-dossier.ts`, eine Vorlage `dark-2017-dossier`
 * mit zwölf Unterseiten, eigenen SVG-Schaubildern und 16 Lernkarten. Am
 * 11. Oktober 2026 hat er auf die Frage, ob es als eingebaute Vorlage auf
 * main kommt, „Ja" gesagt.
 *
 * Übernommen wurde nur die .ts (49da007a5). Sie war für sich nicht lauffähig:
 * keine Zeile in index.html, keine im GRUNDSTOCK, 23 implizite `any`, und
 * der Wikipedia-Verweis `…/wiki/Dark_(Fernsehserie)` zerbricht am
 * Link-Muster des Editors (`\((https?:[^)]+)\)` endet an der ERSTEN
 * schliessenden Klammer): die Adresse verlöre ihr `)`, und hinter dem
 * Verweis stünde eine einzelne `)` im Text.
 *
 * DIE ZUSAGEN:
 *
 *   §1  ZWEI EINTRÄGE (§28): `dark-dossier.js` steht in index.html NACH
 *       `register/vorlagen.js` (sonst meldet sich die Vorlage ins Leere —
 *       sie fragt `Register.vorlagen.melde` beim Laden) und im GRUNDSTOCK
 *       des Dienst-Arbeiters (sonst fehlt sie offline).
 *   §2  DIE VORLAGE: `Register.vorlagen` kennt `dark-2017-dossier`;
 *       `Register.vorlagen.bauen` — derselbe Weg wie „Vorlage einsetzen" in
 *       der Arbeitswelt — legt EINE Wurzelseite mit genau 12 Unterseiten an,
 *       `heftArt: 'fach'`, `vorlage: 'dark-2017-dossier'`, und
 *       `Learning.cards()` zählt danach 16 Karten mehr (eine Karte, die nur
 *       als Block dasteht und vom Lernzentrum nicht gezählt wird, ist keine).
 *   §3  JEDER VERWEIS IST GANZ: auf jeder der 13 Seiten trägt jeder
 *       gezeichnete Verweis nach aussen genau die Adresse, die im Text
 *       zwischen den Klammern steht (mit Klammertiefe gelesen, nicht mit
 *       dem Muster des Editors), hat ausgeglichene Klammern, und hinter
 *       keinem Verweis steht eine einzelne `)`.
 *   §4  JEDES BILD IST EIGEN: jeder Bildblock ist eine eigene
 *       `data:image/svg+xml`-Adresse ohne Verweis nach aussen (kein
 *       `<image>`, kein `href`, kein `url(http…)`), und gezeichnet hat jedes
 *       Bild eine natürliche Breite > 0 — es lässt sich also dekodieren.
 *   §5  Keine Seitenfehler.
 *
 * Kein Port: geladen wird über file:// (§6, §29) — test400 bleibt unberührt.
 *
 * KANN DIESER LAUF ROT WERDEN? (§55.2) Ja: gegen den übernommenen Stand
 * allein (keine Skriptzeile, kein .js) ist §1 und §2 rot, und §3/§4 werden
 * gar nicht erst erreicht. Gegenproben in E739: die Skriptzeile heraus →
 * §1/§2 rot; die Klammern wieder roh → §3 rot.
 *
 *   node pruefungen/alle.mts 609
 * ==========================================================================*/
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const INDEX = pathToFileURL(path.join(WURZEL, 'index.html')).href;
const SKRIPT = 'quell/bereiche/wissen/dark-dossier.js';
const ID = 'dark-2017-dossier';

let ok = 0, weg = 0;
const p = (n: string, wahr: unknown, extra = ''): void => {
  if (wahr) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};

console.log('\n' + '─'.repeat(60));
console.log('Suite 609 — Die Vorlage „Dark (2017–2020)" ist eingebaut und heil (E739)');
console.log('─'.repeat(60));

/* ══ §1 Zwei Einträge ══════════════════════════════════════════════════════ */
console.log('\n§1 Zwei Einträge für das Skript (§28)');
const indexHtml = fs.readFileSync(path.join(WURZEL, 'index.html'), 'utf8');
const swTs = fs.readFileSync(path.join(WURZEL, 'src/dienst/sw.ts'), 'utf8');
const tag = indexHtml.indexOf('<script src="' + SKRIPT + '"');
const register = indexHtml.indexOf('<script src="quell/register/vorlagen.js"');
p('dark-dossier.js steht in index.html', tag > 0);
p('… nach register/vorlagen.js (sonst meldet sie sich ins Leere)', tag > 0 && register > 0 && tag > register,
  `vorlagen.js @${register}, dark-dossier.js @${tag}`);
p('… und trägt defer (test388)', tag > 0 && /^<script src="[^"]+" defer><\/script>/.test(indexHtml.slice(tag, tag + 120)));
p('dark-dossier.js steht im GRUNDSTOCK des Dienst-Arbeiters', swTs.includes("'./" + SKRIPT + "'"));
p('Das erzeugte Skript liegt da', fs.existsSync(path.join(WURZEL, SKRIPT)));

/* ══ Browser ═══════════════════════════════════════════════════════════════ */
const browser = await chromium.launch();
const fehler: string[] = [];
const kontext = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: 'dark' });
const seite = await kontext.newPage();
seite.setDefaultTimeout(20000);
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 200)));
await seite.goto(INDEX);
await seite.waitForFunction("typeof App !== 'undefined' && typeof Store !== 'undefined' && !!Store.cache.blocks && typeof Register !== 'undefined' && !!Register.vorlagen && typeof Learning !== 'undefined'");
await seite.waitForTimeout(900);
await seite.evaluate(`(() => {
  Store.setMeta('rundgangGesehen', true);
  try { Store.setMeta('neuerungenGesehen', Math.max(...Rundgang.NEUERUNGEN.map(n => n.nr))); } catch { /* ohne Rundgang */ }
  document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung,#rg-neu').forEach(e => e.remove());
})()`);

/* ══ §2 Die Vorlage ════════════════════════════════════════════════════════ */
console.log('\n§2 Die Vorlage baut ein Fach mit zwölf Unterseiten und 16 Karten');
const bau = await seite.evaluate(`(() => {
  const v = Register.vorlagen.eines(${JSON.stringify(ID)});
  const vorher = Learning.cards().length;
  const wurzelnVorher = Store.rootPages().length;
  const root = v ? Register.vorlagen.bauen(${JSON.stringify(ID)}) : null;
  if (!root) return { gemeldet: !!v, root: null };
  const r = Store.getBlock(root.id);
  const unter = r.content.map(id => Store.getBlock(id)).filter(b => b && b.type === 'page');
  return { gemeldet: true, root: r.id, titel: r.text, heftArt: r.heftArt, vorlage: r.vorlage,
    unter: unter.map(u => ({ id: u.id, text: u.text })),
    karten: Learning.cards().length - vorher,
    wurzeln: Store.rootPages().length - wurzelnVorher,
    global: typeof window.DarkDossier === 'object' && typeof window.DarkDossier.bauen === 'function' };
})()`) as any;
p(`Register.vorlagen kennt „${ID}"`, bau.gemeldet);
p('Register.vorlagen.bauen legt eine Wurzelseite an', !!bau.root && bau.wurzeln === 1, JSON.stringify({ root: bau.root, wurzeln: bau.wurzeln }));
p('… mit genau 12 Unterseiten', bau.unter?.length === 12, String(bau.unter?.length) + ': ' + (bau.unter ?? []).map((u: any) => u.text).join(' | ').slice(0, 300));
p("… als Fach (heftArt 'fach')", bau.heftArt === 'fach', String(bau.heftArt));
p(`… mit dem Vermerk vorlage: '${ID}'`, bau.vorlage === ID, String(bau.vorlage));
p('Learning.cards() zählt danach 16 Karten mehr', bau.karten === 16, String(bau.karten));
p('window.DarkDossier ist da (wie NinQuiz)', bau.global === true);

/* ══ §3 Jeder Verweis ist ganz ════════════════════════════════════════════ */
console.log('\n§3 Jeder gezeichnete Verweis trägt die ganze Adresse');
/* Die Adressen, die der Text MEINT — mit Klammertiefe gelesen. Genau das
   tut das Muster des Editors nicht, und darum ist es hier anders gebaut. */
const gemeinteAdressen = (text: string): string[] => {
  const raus: string[] = [];
  let i = 0;
  while ((i = text.indexOf('](http', i)) >= 0) {
    let tiefe = 0, j = i + 1;
    for (; j < text.length; j++) {
      if (text[j] === '(') tiefe++;
      else if (text[j] === ')') { tiefe--; if (tiefe === 0) break; }
    }
    raus.push(text.slice(i + 2, j));
    i = j;
  }
  return raus;
};
const klammernGleich = (s: string): boolean => (s.match(/\(/g) ?? []).length === (s.match(/\)/g) ?? []).length;

if (bau.root) {
  const seitenIds: string[] = [bau.root, ...bau.unter.map((u: any) => u.id)];
  const texte = await seite.evaluate(`(() => {
    const raus = [];
    const geh = (id) => { const b = Store.getBlock(id); if (!b) return; if (typeof b.text === 'string') raus.push(b.text);
      (b.content || []).forEach(geh); };
    geh(${JSON.stringify(bau.root)});
    return raus;
  })()`) as string[];
  const gemeint = texte.flatMap(gemeinteAdressen);
  const gezeichnet: Array<{ seite: string; href: string; danach: string }> = [];
  for (const id of seitenIds) {
    await seite.evaluate(`App.oeffne(${JSON.stringify(id)})`);
    await seite.waitForTimeout(250);
    const links = await seite.evaluate(`(() => [...document.querySelectorAll('#page a[href^="http"]')].map(a => ({
      href: a.getAttribute('href') || '',
      danach: (a.nextSibling && a.nextSibling.nodeType === 3 ? a.nextSibling.textContent : '') || '' })))()`) as Array<{ href: string; danach: string }>;
    for (const l of links) gezeichnet.push({ seite: id, ...l });
  }
  p(`Der Text meint Verweise nach aussen (${gemeint.length})`, gemeint.length >= 4, gemeint.join(' '));
  p(`Gezeichnet sind ebenso viele (${gezeichnet.length})`, gezeichnet.length === gemeint.length,
    gezeichnet.map(g => g.href).join(' '));
  const unvollstaendig = gezeichnet.filter(g => !gemeint.includes(g.href));
  p('Jeder gezeichnete Verweis trägt genau die gemeinte Adresse', unvollstaendig.length === 0,
    unvollstaendig.map(g => g.href).join(' | '));
  const fehlt = gemeint.filter(a => !gezeichnet.some(g => g.href === a));
  p('… und keine gemeinte Adresse fehlt', fehlt.length === 0, fehlt.join(' | '));
  const schief = gezeichnet.filter(g => !klammernGleich(g.href));
  p('Jede Adresse hat ausgeglichene Klammern', schief.length === 0, schief.map(g => g.href).join(' | '));
  const streu = gezeichnet.filter(g => g.danach.startsWith(')'));
  p('Hinter keinem Verweis steht eine einzelne „)"', streu.length === 0,
    streu.map(g => g.href + ' → „' + g.danach.slice(0, 30) + '"').join(' | '));
} else {
  p('§3 erreicht (die Vorlage wurde gebaut)', false, 'keine Wurzelseite');
}

/* ══ §4 Jedes Bild ist eigen ══════════════════════════════════════════════ */
console.log('\n§4 Jedes Bild ist ein eigenes SVG und lässt sich zeichnen');
if (bau.root) {
  const bilder = await seite.evaluate(`(() => {
    const raus = [];
    const geh = (id, seiteId) => { const b = Store.getBlock(id); if (!b) return;
      const s = b.type === 'page' ? b.id : seiteId;
      if (b.type === 'image') raus.push({ id: b.id, seite: s, src: String(b.src || ''), dateiId: b.dateiId || null });
      (b.content || []).forEach(k => geh(k, s)); };
    geh(${JSON.stringify(bau.root)}, ${JSON.stringify(bau.root)});
    return raus;
  })()`) as Array<{ id: string; seite: string; src: string; dateiId: string | null }>;
  p(`Das Fach trägt Bilder (${bilder.length})`, bilder.length >= 6, String(bilder.length));
  const nichtSvg = bilder.filter(b => !b.src.startsWith('data:image/svg+xml') || b.dateiId);
  p('Jedes ist eine data:image/svg+xml-Adresse, keine Datei und keine Webadresse', nichtSvg.length === 0,
    nichtSvg.map(b => b.src.slice(0, 60)).join(' | '));
  const nachAussen = bilder.filter(b => {
    let svg = '';
    try { svg = decodeURIComponent(b.src.slice(b.src.indexOf(',') + 1)); } catch { return true; }
    const ohneNs = svg.replace(/xmlns(:\w+)?="[^"]*"/g, '');
    return /<image\b|\bhref\s*=|url\(\s*['"]?https?:|https?:\/\//i.test(ohneNs) || !svg.startsWith('<svg');
  });
  p('… und keines holt etwas von aussen (kein <image>, kein href, keine http-Adresse)', nachAussen.length === 0,
    nachAussen.map(b => b.id).join(', '));
  const seitenMitBild = [...new Set(bilder.map(b => b.seite))];
  const gezeichnet: Array<{ seite: string; w: number; ok: boolean }> = [];
  for (const id of seitenMitBild) {
    await seite.evaluate(`App.oeffne(${JSON.stringify(id)})`);
    await seite.waitForFunction(`[...document.querySelectorAll('#page img')].every(i => i.complete)`, null, { timeout: 10000 }).catch(() => {});
    const m = await seite.evaluate(`[...document.querySelectorAll('#page img')].filter(i => (i.getAttribute('src') || '').startsWith('data:image/svg+xml')).map(i => ({ w: i.naturalWidth, ok: i.complete }))`) as Array<{ w: number; ok: boolean }>;
    for (const x of m) gezeichnet.push({ seite: id, ...x });
  }
  p(`Gezeichnet sind ebenso viele Bilder (${gezeichnet.length} von ${bilder.length})`, gezeichnet.length === bilder.length);
  const kaputt = gezeichnet.filter(g => !(g.ok && g.w > 0));
  p('Jedes gezeichnete Bild hat eine natürliche Breite > 0', kaputt.length === 0 && gezeichnet.length > 0,
    JSON.stringify(gezeichnet.map(g => g.w)));
} else {
  p('§4 erreicht (die Vorlage wurde gebaut)', false, 'keine Wurzelseite');
}

/* ══ §5 ════════════════════════════════════════════════════════════════════ */
console.log('\n§5 Ruhe');
p('Keine Seitenfehler', fehler.length === 0, fehler.slice(0, 3).join(' | '));

console.log(`\n${ok}/${ok + weg} bestanden · ✗=${weg}`);
await browser.close();
process.exit(weg ? 1 : 0);
