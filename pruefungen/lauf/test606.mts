/* Suite 606 — Die Lernansicht muss aussehen wie ein Knopf, nicht wie ein Satz
 * ============================================================================
 * Diese Suite ist aus einem Fund entstanden, den KEIN Prüflauf hatte finden
 * können — und der Grund dafür ist der eigentliche Inhalt:
 *
 *   Der Hauptknopf der Lernansicht, „Tagesrunde starten", war 44 px hoch.
 *   §37 misst die Höhe, und die stimmte. Gemessen war er aber auch:
 *
 *       Fläche  rgba(0, 0, 0, 0)     Rand  0px     Radius  0px
 *
 *   Er trug die Klasse `prim`, und für das Panel `finder lern` gab es KEINE
 *   Stilregel — jeder andere Dialog bringt seine eigene mit, dieser nicht.
 *   Der wichtigste Knopf der ganzen Ansicht sah aus wie eine Bildunterschrift.
 *
 * EINE GRÖSSE IST KEINE SICHTBARKEIT. Das ist die Lehre, und deshalb misst
 * diese Suite nicht die Höhe (das tun andere), sondern die FLÄCHE: hat der
 * Knopf überhaupt einen Hintergrund, oder ist er durchsichtig?
 *
 * §3 hält dazu die Gliederung: acht Zahlen in zwei Reihen ohne Überschrift
 * sahen aus, als stünde dieselbe Reihe zweimal da.
 *
 *   node pruefungen/lauf/test606.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

declare const Store: any;

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8958;

const TYP: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.json': 'application/json', '.mjs': 'text/javascript',
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
/** Ist diese Farbe überhaupt eine Fläche — oder durchsichtig? */
const sichtbar = (farbe: string): boolean => {
  if (!farbe) return false;
  const m = /rgba?\(([^)]+)\)/.exec(farbe);
  if (!m) return farbe !== 'transparent';
  const t = m[1]!.split(',').map(x => parseFloat(x.trim()));
  return t.length < 4 || t[3]! > 0.05;
};

const browser = await chromium.launch();
const fehler: string[] = [];

const oeffne = async (breite: number, hoehe: number) => {
  const seite = await browser.newPage({ viewport: { width: breite, height: hoehe } });
  seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 140)));
  await seite.goto(`http://localhost:${PORT}/index.html`);
  await seite.waitForTimeout(2500);
  await seite.evaluate(() => {
    Store.setMeta('rundgangGesehen', true);
    Store.setMeta('neuerungenGesehen', 99);
    document.querySelectorAll('#rg-willkommen, .overlay, .produkt-onboarding-lage')
      .forEach(x => x.remove());
    const fach = Store.addPage(null, { text: 'Elektrotechnik' });
    for (let i = 0; i < 4; i++) {
      const k = Store.addBlock(fach.id, 'flashcard',
        { text: `Frage ${i} :: Antwort ${i}`, lernThema: 'Drehstrom' });
      Store.updateBlock(k.id, { sr: { wdh: i, intervall: 3,
        zuletzt: new Date(Date.now() - 86400000).toISOString(),
        faellig: new Date(Date.now() - 3600000).toISOString() } });
    }
  });
  await seite.evaluate(() => (window as any).Produktwelten.lernen('lernen'));
  await seite.waitForTimeout(1000);
  const knopf = await seite.evaluateHandle(() =>
    [...document.querySelectorAll('button, a')]
      .find(b => /Klassische Lernansicht/.test(b.textContent || '')));
  const el = knopf.asElement();
  if (el) { await el.click(); await seite.waitForTimeout(1000); }
  return seite;
};

/* ==========================================================================
 * §1 · Der Hauptknopf ist als Knopf zu erkennen
 * ========================================================================*/
console.log('\n1 · Der Hauptknopf');

const seite = await oeffne(1280, 900);
const haupt = await seite.evaluate(() => {
  const b = [...document.querySelectorAll('.lern button.prim')]
    .find(x => /Tagesrunde/.test(x.textContent || '')) as HTMLElement | undefined;
  if (!b) return null;
  const c = getComputedStyle(b);
  const r = b.getBoundingClientRect();
  return { bg: c.backgroundColor, radius: parseFloat(c.borderTopLeftRadius),
           farbe: c.color, hoehe: Math.round(r.height), fett: c.fontWeight };
});
p('Es gibt ihn überhaupt', !!haupt);
p('Er hat eine Fläche und ist nicht durchsichtig', haupt && sichtbar(haupt.bg),
  `Fläche ist ${haupt ? haupt.bg : '—'}`);
p('Er ist abgerundet wie jeder andere Knopf', !!haupt && haupt.radius >= 4,
  `Radius ${haupt ? haupt.radius : '—'}`);
p('Und weiterhin 44 px hoch (§37)', !!haupt && haupt.hoehe >= 44,
  `${haupt ? haupt.hoehe : '—'} px`);

/* Der zweite Knopf ist KEIN Hauptknopf und darf deshalb flächenlos sein —
   er muss sich aber trotzdem als Knopf zeigen, nämlich über den Rand. */
const zweit = await seite.evaluate(() => {
  const b = [...document.querySelectorAll('.lern button')]
    .find(x => /Fehler trainieren/.test(x.textContent || '')) as HTMLElement | undefined;
  if (!b) return null;
  const c = getComputedStyle(b);
  return { rand: parseFloat(c.borderTopWidth), randfarbe: c.borderTopColor,
           radius: parseFloat(c.borderTopLeftRadius), deckkraft: parseFloat(c.opacity),
           aus: (b as HTMLButtonElement).disabled };
});
p('Der Nebenknopf zeigt sich über seinen Rand', !!zweit && zweit.rand > 0
  && sichtbar(zweit.randfarbe), `Rand ${zweit ? zweit.rand + 'px ' + zweit.randfarbe : '—'}`);
p('Abgeschaltet sagt er es über die Deckkraft, nicht nur über die Farbe (§38)',
  !!zweit && (!zweit.aus || zweit.deckkraft < 0.8),
  `deaktiviert=${zweit && zweit.aus}, Deckkraft ${zweit && zweit.deckkraft}`);

/* ==========================================================================
 * §2 · Der Fortschrittsbalken gehört zur App
 * ========================================================================*/
console.log('\n2 · Der Fortschrittsbalken');

const balken = await seite.evaluate(() => {
  const b = document.querySelector('.lern progress') as HTMLElement | null;
  if (!b) return null;
  const c = getComputedStyle(b);
  return { appearance: c.appearance || (c as any).webkitAppearance,
           hoehe: Math.round(b.getBoundingClientRect().height),
           radius: parseFloat(c.borderTopLeftRadius) };
});
p('Es gibt einen', !!balken);
/* Der Browser-Standardbalken ist BLAU — die einzige blaue Fläche in einer
   violetten App. Wer `appearance` nicht abschaltet, bekommt genau den. */
p('Er ist nicht der Browser-Standard', !!balken && balken.appearance === 'none',
  `appearance ist "${balken ? balken.appearance : '—'}"`);
p('Und er ist abgerundet', !!balken && balken.radius >= 3);

/* ==========================================================================
 * §3 · Acht Zahlen brauchen zwei Überschriften
 * ========================================================================*/
console.log('\n3 · Die Gliederung');

const titel = await seite.evaluate(() =>
  [...document.querySelectorAll('.lern strong')]
    .map(x => (x.textContent || '').trim()).filter(Boolean));
p('„Heute" steht über der ersten Zahlenreihe', titel.includes('Heute'), titel.join(' | '));
p('„Insgesamt" über der zweiten', titel.includes('Insgesamt'), titel.join(' | '));

const reihenfolge = await seite.evaluate(() => {
  /* Kleingeschrieben verglichen: die Titel stehen per `text-transform` in
     Grossbuchstaben auf dem Schirm, und `innerText` gibt genau das zurück.
     Der erste Anlauf suchte „Heute" und fand −1 — die Prüfung mass die
     Darstellung und meinte den Inhalt. */
  const text = (document.querySelector('.lern') as HTMLElement).innerText.toLowerCase();
  return { heute: text.indexOf('heute'), knopf: text.indexOf('tagesrunde starten'),
           gesamt: text.indexOf('insgesamt') };
});
p('Und zwar in dieser Reihenfolge: Heute, dann der Knopf, dann Insgesamt',
  reihenfolge.heute >= 0 && reihenfolge.heute < reihenfolge.knopf
  && reihenfolge.knopf < reihenfolge.gesamt,
  JSON.stringify(reihenfolge));

await seite.close();

/* ==========================================================================
 * §4 · Am Telefon auch
 * ========================================================================*/
console.log('\n4 · Am Telefon');

const handy = await oeffne(390, 780);
const amHandy = await handy.evaluate(() => {
  const b = [...document.querySelectorAll('.lern button.prim')]
    .find(x => /Tagesrunde/.test(x.textContent || '')) as HTMLElement | undefined;
  if (!b) return null;
  const r = b.getBoundingClientRect();
  const c = getComputedStyle(b);
  return { hoehe: Math.round(r.height), breite: Math.round(r.width),
           bg: c.backgroundColor, rechts: Math.round(r.right) };
});
p('Der Hauptknopf steht auch am Telefon da', !!amHandy);
p('Er ist 44 px hoch (§37)', !!amHandy && amHandy.hoehe >= 44,
  `${amHandy ? amHandy.hoehe : '—'} px`);
p('Er hat auch dort eine Fläche', !!amHandy && sichtbar(amHandy.bg),
  `Fläche ist ${amHandy ? amHandy.bg : '—'}`);
p('Und ragt nicht aus dem Bild', !!amHandy && amHandy.rechts <= 390,
  `rechter Rand bei ${amHandy ? amHandy.rechts : '—'} px`);
await handy.close();

p('Keine Fehler auf der Seite', fehler.length === 0, fehler.join(' | '));

console.log(`\n${ok} bestanden, ${weg} gescheitert`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
