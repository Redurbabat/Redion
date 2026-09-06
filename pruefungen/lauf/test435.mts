/* Suite 435 — Schalter, Staffelei, Textur, Symbolreihe: vier Vorgaben, ein Grundsatz (E462)
 * ============================================================================
 * Vier Bauteile aus Redurs Vorgaben vom 6. September, und bei jedem gilt:
 * die Vorgabe liefert das AUSSEHEN, Redion liefert den ZUSTAND — und der
 * kommt aus dem, was es schon gibt.
 *
 *   §1 DIE STAFFELEI: `role="switch"`, `aria-checked`, das Wort daneben;
 *      ein Druck wechselt wirklich das Schema — nach derselben Regel wie
 *      der Knopf im Studio-Kopf (zuletzt benutztes Schema des Grundtons).
 *   §2 DER SCHALTER: das Markup der 18 Aufrufer ist unverändert; der
 *      Verlauf hängt an `::before` und nur an `.an`; die Trefferfläche
 *      bleibt 44 (§37) und liegt VOR dem Verlauf.
 *   §3 DIE TEXTUR: der Filter ist genau EINMAL im Dokument, auch nach
 *      dreimal Legen; sie sitzt im Willkommen-Kopf und nirgends sonst.
 *   §4 DIE SYMBOLREIHE: die Blase ist der echte Vorlesename und erscheint
 *      nur mit Zeiger — am Telefon nicht.
 *   §5 OHNE BEWEGUNG: Verlauf steht, Blende springt, Pinsel springt.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 *   §1 → in `aussehen.ts` den `beiWechsel` leer lassen: das Schema bleibt.
 *        Gelaufen am 6. September 2026, rot.
 *   §3 → in `textur.ts` den Halter nicht mehr wiederfinden (`getElementById`
 *        auf einen falschen Namen): drei Halter statt einem. Gelaufen, rot.
 *
 *   node pruefungen/lauf/test435.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9555;
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
const oeffne = async (opt: { breite?: number; ruhig?: boolean; beruehrung?: boolean } = {}) => {
  const s = await browser.newPage({
    viewport: { width: opt.breite ?? 1280, height: 900 },
    ...(opt.ruhig ? { reducedMotion: 'reduce' as const } : {}),
    ...(opt.beruehrung ? { hasTouch: true, isMobile: true } : {})
  });
  s.on('pageerror', e => fehler.push(e.message.slice(0, 140)));
  s.on('console', m => { if (m.type() === 'error') fehler.push('console: ' + m.text().slice(0, 140)); });
  await s.goto(`http://localhost:${PORT}/index.html`);
  await s.waitForFunction("typeof App !== 'undefined' && typeof Staffelei !== 'undefined' " +
                          "&& typeof Textur !== 'undefined' && typeof Aussehen !== 'undefined' " +
                          "&& typeof Rundgang !== 'undefined'", null, { timeout: 30000 });
  await s.waitForTimeout(700);
  await s.evaluate(`(() => {
    document.querySelectorAll('.overlay, #rg-willkommen, #rg-einladung, ' +
      '.produkt-onboarding-lage').forEach(x => x.remove());
    Store.setMeta('rundgangGesehen', true);
  })()`);
  return s;
};

const s = await oeffne();

console.log('\n§1 Die Staffelei wechselt wirklich das Schema');
const staff = JSON.parse(await s.evaluate(`(async () => {
  Aussehen.setzen({ schema: 'standard', akzent: '' });
  Aussehen.dialog();
  await new Promise(r => setTimeout(r, 500));
  const k = document.querySelector('.ru-staff');
  if (!k) return JSON.stringify({ da: false });
  const lies = () => ({
    rolle: k.getAttribute('role'), checked: k.getAttribute('aria-checked'),
    label: k.getAttribute('aria-label'), wort: k.querySelector('.ru-staff-wort').textContent,
    hell: k.dataset.hell, schema: Aussehen.einstellung().schema,
    grund: document.documentElement.dataset.theme,
    blende: Math.round(k.querySelector('.ru-staff-blende').getBoundingClientRect().width),
    bildVersteckt: k.querySelector('.ru-staff-rahmen').getAttribute('aria-hidden') === 'true'
  });
  const vorher = lies();
  document.querySelector('.ru-staff').click();
  await new Promise(r => setTimeout(r, 900));
  const nachher = lies();
  /* Zurück — und zwar in das Schema, das vorher galt (Standard), nicht
     irgendein dunkles. Das ist die Regel aus studio.ts. */
  Aussehen.setzen({ schema: 'nacht', akzent: '' });
  await new Promise(r => setTimeout(r, 200));
  document.querySelector('.ru-staff').click();
  await new Promise(r => setTimeout(r, 400));
  const wiederHell = Aussehen.einstellung().schema;
  document.querySelector('.ru-staff').click();
  await new Promise(r => setTimeout(r, 400));
  const wiederDunkel = Aussehen.einstellung().schema;
  document.querySelector('.au-overlay, .overlay')?.remove();
  return JSON.stringify({ da: true, vorher, nachher, wiederHell, wiederDunkel });
})()`) as string);
p('Die Staffelei steht im Aussehen-Dialog', staff.da);
p('Sie ist ein Umschalter (role=switch)', staff.da && staff.vorher.rolle === 'switch');
p('Ihr Bild ist für Vorleser unsichtbar, das Wort nicht', staff.da && staff.vorher.bildVersteckt);
p('Dunkel: aria-checked=true, das Wort sagt „Dunkel"',
  staff.da && staff.vorher.checked === 'true' && staff.vorher.wort === 'Dunkel', JSON.stringify(staff.vorher));
p('… und die Blende ist offen (das Bild ist gemalt)', staff.da && staff.vorher.blende > 100, String(staff.vorher?.blende));
p('Ein Druck wechselt zum hellen Grundton', staff.da && staff.nachher.grund === 'light', String(staff.nachher?.grund));
p('… in ein helles Schema', staff.da && staff.nachher.schema === 'hell', String(staff.nachher?.schema));
p('… das Wort sagt „Hell", aria-checked=false',
  staff.da && staff.nachher.wort === 'Hell' && staff.nachher.checked === 'false');
p('… und die Blende ist zu (die Skizze steht)', staff.da && staff.nachher.blende === 0, String(staff.nachher?.blende));
p('Zurück ins Dunkle kommt das ZULETZT benutzte dunkle Schema (Mitternacht), nicht Standard',
  staff.da && staff.wiederDunkel === 'nacht', String(staff.wiederDunkel));
p('… und der Weg dorthin lief über Hell', staff.da && staff.wiederHell === 'hell', String(staff.wiederHell));

console.log('\n§2 Der Schalter: gleiches Markup, Verlauf nur an, Trefferfläche davor');
const schalter = JSON.parse(await s.evaluate(`(async () => {
  Einstellungen.oeffne();
  await new Promise(r => setTimeout(r, 900));
  const alle = [...document.querySelectorAll('.schalter')];
  /* EINEN SELBST EINSCHALTEN. Auf einem frischen Bestand steht kein
     Schalter auf „an", und ein Verlauf, der nie erscheint, ist nicht
     geprüft. Der erste Wurf suchte einen und fand keinen. Nachher wird
     er zurückgestellt — die Einstellung gehört dem Menschen. */
  const erster = alle[0];
  const warAn = erster?.classList.contains('an');
  if (erster && !warAn) { erster.click(); await new Promise(r => setTimeout(r, 250)); }
  const an = alle.find(x => x.classList.contains('an'));
  const aus = alle.find(x => !x.classList.contains('an'));
  const vor = (el, ps) => getComputedStyle(el, ps);
  const wert = {
    anzahl: alle.length,
    markup: alle.every(x => x.tagName === 'BUTTON' && x.getAttribute('role') === 'switch' &&
      x.querySelector('i') && x.children.length === 1),
    anDeckung: an ? vor(an, '::before').opacity : null,
    ausDeckung: aus ? vor(aus, '::before').opacity : null,
    anDreht: an ? vor(an, '::before').animationName : null,
    ausDreht: aus ? vor(aus, '::before').animationName : null,
    trefferZ: an ? vor(an, '::after').zIndex : null,
    verlaufZ: an ? vor(an, '::before').zIndex : null,
    hoch: an ? Math.round(an.getBoundingClientRect().height) : 0
  };
  /* Trifft ein Klick den Schalter noch? Der Verlauf darf ihn nicht
     verdecken — und zwar auch nicht in der Mitte, wo der Knebel liegt. */
  if (an) {
    const r = an.getBoundingClientRect();
    const oben = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    wert.trifft = !!oben && an.contains(oben);
  }
  if (erster && !warAn) erster.click();
  document.querySelector('.overlay')?.remove();
  return JSON.stringify(wert);
})()`) as string);
p('Es gibt Schalter, und alle tragen das alte Markup (button[role=switch] > i)',
  schalter.anzahl >= 3 && schalter.markup, String(schalter.anzahl));
p('Der Verlauf liegt nur am eingeschalteten Schalter',
  Number(schalter.anDeckung) > 0.5 && Number(schalter.ausDeckung) === 0,
  schalter.anDeckung + ' / ' + schalter.ausDeckung);
p('… und dreht sich nur dort', schalter.anDreht !== 'none' && schalter.ausDreht === 'none');
p('Die Trefferfläche liegt VOR dem Verlauf', Number(schalter.trefferZ) > Number(schalter.verlaufZ),
  schalter.trefferZ + ' / ' + schalter.verlaufZ);
p('Ein Klick in die Mitte trifft den Schalter, nicht den Verlauf', schalter.trifft === true);

console.log('\n§3 Die Textur: ein Filter, ein Ort');
const textur = JSON.parse(await s.evaluate(`JSON.stringify((() => {
  const a = document.createElement('div'); a.style.cssText = 'width:200px;height:80px';
  document.body.append(a);
  Textur.legen(a); Textur.legen(a); Textur.legen(a);
  const b = document.createElement('div'); document.body.append(b); Textur.legen(b);
  const halter = document.querySelectorAll('#' + Textur.HALTER).length;
  const filter = document.querySelectorAll('filter').length;
  const lagenA = a.querySelectorAll(':scope > .ru-textur').length;
  const inhaltA = a.classList.contains('ru-textur-wirt');
  const verweis = getComputedStyle(a.querySelector('.ru-textur-fein')).filter;
  const versteckt = document.getElementById(Textur.HALTER).getAttribute('aria-hidden');
  const groesse = document.getElementById(Textur.HALTER).getBoundingClientRect();
  a.remove(); b.remove();
  return { halter, filter, lagenA, inhaltA, verweis, versteckt, breit: groesse.width, hoch: groesse.height };
})())`) as string);
p('Dreimal legen, viermal legen — EIN Halter', textur.halter === 1, String(textur.halter));
p('… und genau zwei Filter (fein, grob) im ganzen Dokument', textur.filter === 2, String(textur.filter));
p('Dreimal legen gibt trotzdem nur zwei Lagen', textur.lagenA === 2, String(textur.lagenA));
p('Die Lage zeigt auf den globalen Filter', /url\("?#ru-textur-fein"?\)/.test(textur.verweis), textur.verweis);
p('Der Halter ist für Vorleser unsichtbar und ohne Grösse',
  textur.versteckt === 'true' && textur.breit === 0 && textur.hoch === 0);
const willkommen = JSON.parse(await s.evaluate(`(async () => {
  /* Das wahr erzwingt: ohne das sieht die Begrüssung nach, ob sie schon
     gelaufen ist, und oben steht rundgangGesehen absichtlich auf wahr. */
  Rundgang.willkommen(true);
  await new Promise(r => setTimeout(r, 500));
  const kopf = document.querySelector('#rg-willkommen .wk-kopf');
  const wert = { imKopf: !!kopf && kopf.querySelectorAll(':scope > .ru-textur').length === 2,
    sonstNirgends: document.querySelectorAll('.ru-textur-wirt').length === 1,
    titelLesbar: !!kopf && getComputedStyle(kopf.querySelector('h2')).position === 'relative' };
  document.getElementById('rg-willkommen')?.remove();
  return JSON.stringify(wert);
})()`) as string);
p('Die Textur liegt im Willkommen-Kopf', willkommen.imKopf);
p('… und sonst nirgends', willkommen.sonstNirgends);
p('… und die Überschrift liegt DARÜBER, nicht darunter', willkommen.titelLesbar);

console.log('\n§4 Die Symbolreihe: die Blase ist der Vorlesename, und nur mit Zeiger');
const reihe = JSON.parse(await s.evaluate(`JSON.stringify((() => {
  /* studio-theme, nicht studio-search: die Suche ist ein Feld mit
     sichtbarem Wort, kein Symbolknopf — und hat keinen Vorlesenamen.
     (Kein Backtick hier drin: der Block ist eine Vorlagenzeichenkette.) */
  const k = document.getElementById('studio-theme');
  if (!k) return { da: false };
  const vor = getComputedStyle(k, '::after');
  return { da: true, inhalt: vor.content, label: k.getAttribute('aria-label'), anzeige: vor.display,
    ueberlauf: document.documentElement.scrollWidth - innerWidth };
})())`) as string);
p('Ein Knopf der Reihe hat einen Vorlesenamen', reihe.da && !!reihe.label);
p('Die Blase trägt genau diesen Namen (attr(aria-label))',
  reihe.da && reihe.inhalt.replace(/^"|"$/g, '') === reihe.label, reihe.inhalt + ' / ' + reihe.label);
/* `display:none`, nicht `opacity:0` (E464): eine durchsichtige Blase nimmt
   Platz — die des letzten Knopfes ragte 45 px aus dem Fenster, test54 rot. */
p('… und gibt es ohne Zeiger darauf gar nicht', reihe.da && reihe.anzeige === 'none', reihe.anzeige);
p('… also ragt auch nichts aus dem Fenster (test54)', reihe.ueberlauf <= 0, reihe.ueberlauf + ' px');
await s.hover('#studio-theme');
await s.waitForTimeout(300);
const beiZeiger = JSON.parse(await s.evaluate(`JSON.stringify((() => {
  const k = document.getElementById('studio-theme');
  const vor = getComputedStyle(k, '::after');
  const r = k.getBoundingClientRect();
  return { anzeige: vor.display, deckung: vor.opacity, verschoben: getComputedStyle(k).transform !== 'none',
    imBild: r.top >= 0 && r.left >= 0 };
})())`) as string);
p('Mit Zeiger darauf erscheint sie', beiZeiger.anzeige === 'block' && beiZeiger.deckung === '1',
  beiZeiger.anzeige + ' / ' + beiZeiger.deckung);
p('… und der Knopf rückt heraus', beiZeiger.verschoben);
const handy = await oeffne({ breite: 390, beruehrung: true });
const amTelefon = JSON.parse(await handy.evaluate(`JSON.stringify((() => {
  const k = document.querySelector('.studio-icon[aria-label]');
  return { da: !!k, inhalt: k ? getComputedStyle(k, '::after').content : '' };
})())`) as string);
p('Am Telefon gibt es die Blase gar nicht', !amTelefon.da || amTelefon.inhalt === 'none',
  JSON.stringify(amTelefon));
await handy.close();

console.log('\n§5 Ohne Bewegung');
const ruhig = await oeffne({ ruhig: true });
const still = JSON.parse(await ruhig.evaluate(`(async () => {
  Aussehen.dialog();
  await new Promise(r => setTimeout(r, 500));
  const k = document.querySelector('.ru-staff');
  const blende = getComputedStyle(k.querySelector('.ru-staff-blende')).transitionDuration;
  const pinsel = getComputedStyle(k.querySelector('.ru-staff-pinsel')).transitionDuration;
  document.querySelector('.overlay')?.remove();
  Einstellungen.oeffne();
  await new Promise(r => setTimeout(r, 700));
  const erster = document.querySelector('.schalter');
  if (erster && !erster.classList.contains('an')) { erster.click(); await new Promise(r => setTimeout(r, 250)); }
  const an = document.querySelector('.schalter.an');
  const dreht = an ? getComputedStyle(an, '::before').animationName : 'kein an';
  const deckung = an ? getComputedStyle(an, '::before').opacity : '';
  if (erster && erster === an) erster.click();
  document.querySelector('.overlay')?.remove();
  return JSON.stringify({ blende, pinsel, dreht, deckung,
    reduziert: matchMedia('(prefers-reduced-motion: reduce)').matches });
})()`) as string);
const sekunden = (w: string): number => Math.max(...String(w).split(',').map(t => parseFloat(t) || 0));
p('Die Seite weiss, dass keine Bewegung gewünscht ist', still.reduziert);
p('Die Blende springt statt zu gleiten', sekunden(still.blende) < 0.05, still.blende);
p('Der Pinsel auch', sekunden(still.pinsel) < 0.05, still.pinsel);
p('Der Verlauf im Schalter steht still — bleibt aber sichtbar',
  still.dreht === 'none' && Number(still.deckung) > 0.5, still.dreht + ' / ' + still.deckung);
await ruhig.close();

console.log('\n§6 Eingebunden');
for (const name of ['textur', 'staffelei']) {
  p(`index.html lädt ${name}.js`, new RegExp('quell/schale/bedienung/' + name + '\\.js').test(lies('index.html')));
  p(`Der GRUNDSTOCK kennt ${name}.js (§28)`,
    new RegExp('\\./quell/schale/bedienung/' + name + '\\.js').test(lies('src/dienst/sw.ts')));
  p(`${name}: die Quelle ist TypeScript, das .js ist erzeugt`,
    fs.existsSync(path.join(WURZEL, 'src/schale/bedienung/' + name + '.ts')) &&
    /ERZEUGT/.test(lies('quell/schale/bedienung/' + name + '.js')));
}
p('Der Schalter-Verlauf steht in einstellungen.css, nicht in einem neuen Blatt',
  /\.schalter\.an::before\{opacity:\.85; animation:ez-schalter-dreh/.test(lies('quell/schale/stil/einstellungen.css')));

p('Keine Fehler auf den Seiten', fehler.length === 0, fehler.slice(0, 3).join(' | '));
console.log(`\n${ok}/${ok + weg} bestanden · ✗=${weg}`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
