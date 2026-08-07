/* Suite 92 — Barrierefreiheit: was ein Vorleseprogramm hört (L12)
 * ============================================================================
 * WARUM ES DIESEN LAUF GIBT. `LUECKEN.md` L12 stand seit Monaten auf „◐
 * Grundlagen da, nicht geprüft" und nannte fünf Punkte. Zwei davon waren in
 * Ordnung, drei nicht — und welche, liess sich nur durch Messen entscheiden.
 * Gemessen am 7. August 2026:
 *
 *   ✓ Fokus sichtbar        2 px Rahmen in der Akzentfarbe, überall
 *   ✓ Escape schliesst      Suche, Befehle, Einstellungen, Papierkorb
 *   ✗ nur über Farbe        der rote Punkt „ungelesen" war leer und still
 *   ✗ Fokusreihenfolge      der Fokus blieb hinter den Einstellungen stehen,
 *                           lief mit Tab aus jedem Dialog heraus und kehrte
 *                           nach dem Schliessen nie zurück
 *   ✗ Vorlesen              null Überschriften auf einer Seite mit Titel und
 *                           Überschrift; Meldungen ohne Live-Bereich; Reiter
 *                           ohne `aria-selected`
 *
 * WAS DIESER LAUF NICHT KANN. Er startet kein echtes Vorleseprogramm. Er
 * prüft das, worauf jedes von ihnen angewiesen ist: Rollen, Namen, Zustände
 * und den Weg, den die Tastatur nimmt. Das ist nicht dasselbe wie ein
 * Durchlauf mit VoiceOver — der bleibt in L12 als offener Punkt stehen.
 *
 * DIE FALLE DABEI, und sie hat beim Schreiben zugeschlagen:
 * `getComputedStyle` gibt ein LEBENDES Objekt zurück. Zweimal daraus lesen —
 * einmal vor und einmal nach `focus()` — liefert zweimal den Zustand von
 * NACHHER. Die erste Fassung meldete deshalb „der Fokus ändert nichts",
 * obwohl er einen 2-px-Rahmen setzt. Werte sofort abschreiben.
 *
 *   node pruefungen/lauf/test128.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8797;

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
const seite = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForTimeout(2400);

/* Vier Überlagerungen, die es in Redion wirklich gibt. */
const DIALOGE: Array<[string, string]> = [
  ['Suche', 'App.suche()'],
  ['Befehle', 'Werkzeuge.palette()'],
  ['Einstellungen', 'Einstellungen.oeffne()'],
  ['Papierkorb', 'App.papierkorb()']
];

const aufraeumen = () => seite.evaluate(() =>
  document.querySelectorAll('.overlay, .menu, .menu-grund, #r-blatt').forEach(x => x.remove()));


console.log('\n1 · Jedes Bedienelement hat einen Namen');

/* EIN KNOPF OHNE NAMEN heisst beim Vorlesen „Schaltfläche". Ist er ein
   Zeichen — ✕, ⋮, ✚ —, hat er auch keinen Text, aus dem sich einer
   ableiten liesse. Für den, der zuhört, sind das lauter gleiche Knöpfe. */
const namenlos = await seite.evaluate(() =>
  [...document.querySelectorAll<HTMLElement>('button, a[href], [role="button"], [role="tab"]')]
    .filter(el => {
      const r = el.getBoundingClientRect();
      return (r.width || r.height) && getComputedStyle(el).visibility !== 'hidden';
    })
    .filter(el => !(el.getAttribute('aria-label') || el.getAttribute('title') ||
                    el.textContent || '').trim())
    .map(el => (el.id ? '#' + el.id : el.tagName) + '.' +
               (typeof el.className === 'string' ? el.className.split(/\s+/)[0] : '')));
p('Kein sichtbarer Knopf ist namenlos', namenlos.length === 0,
  namenlos.slice(0, 8).join(', '));


console.log('\n2 · Der Fokus ist zu sehen');

/* Ohne sichtbaren Fokus ist Tastaturbedienung Raten. */
const fokus = await seite.evaluate(() => {
  const proben = ['#btn-search', '#btn-new', '#btn-settings', '.side-item', '.sr'];
  return proben.map(q => {
    const el = document.querySelector<HTMLElement>(q);
    if (!el) return { q, fehlt: true, anders: false, breite: 0 };
    /* SOFORT ABSCHREIBEN — `getComputedStyle` lebt. */
    const lies = () => { const c = getComputedStyle(el);
      return { o: c.outlineWidth, s: c.boxShadow }; };
    const vorher = lies();
    el.focus();
    const nachher = lies();
    el.blur();
    return { q, fehlt: false, breite: parseFloat(nachher.o) || 0,
             anders: vorher.o !== nachher.o || vorher.s !== nachher.s };
  });
});
p('Jede Probe ist vorhanden', fokus.every(f => !f.fehlt),
  fokus.filter(f => f.fehlt).map(f => f.q).join(', '));
p('Der Fokus verändert das Aussehen sichtbar', fokus.every(f => f.fehlt || f.anders),
  fokus.filter(f => !f.fehlt && !f.anders).map(f => f.q).join(', '));
p('… und der Rahmen ist mindestens 2 px breit',
  fokus.every(f => f.fehlt || f.breite >= 2),
  fokus.map(f => f.q + ':' + f.breite).join(' '));


console.log('\n3 · Überschriften gibt es wirklich');

/* WER NICHT SIEHT, SPRINGT VON ÜBERSCHRIFT ZU ÜBERSCHRIFT. Gemessen am
   7. August fand eine Seite mit Titel und einer h1 genau null davon: jeder
   Block ist ein `<div>`, auch die Überschriften. Sichtbar waren sie durch
   ihre Grösse — hörbar durch gar nichts. */
await aufraeumen();
await seite.evaluate(() => {
  const s = Store.addBlock(null, 'page', { text: 'Gliederung' });
  Store.addBlock(s.id, 'h1', { text: 'Erster Teil' });
  Store.addBlock(s.id, 'h2', { text: 'Ein Abschnitt' });
  Store.addBlock(s.id, 'text', { text: 'Text.' });
  App.oeffne(s.id);
});
await seite.waitForTimeout(900);

const gliederung = await seite.evaluate(() => {
  const h = [...document.querySelectorAll<HTMLElement>('#page [role="heading"]')];
  return {
    stufen: h.map(x => x.getAttribute('aria-level') + ':' +
                       (x.textContent || '').trim().slice(0, 20)),
    titelIstEins: (document.getElementById('title')?.getAttribute('aria-level')) === '1',
    einserAnzahl: h.filter(x => x.getAttribute('aria-level') === '1').length,
    /* Der Griff ✚ ⋮⋮ darf NICHT Teil des Überschriftennamens sein. */
    sauber: h.every(x => !/⋮|＋|^\+/.test((x.textContent || '').trim()[0] || '')),
    fenster: document.title
  };
});
p('Die Seite hat Überschriften', gliederung.stufen.length >= 3,
  gliederung.stufen.join(' | ') + ' — vorher waren es null');
p('Der Seitentitel ist die Stufe 1', gliederung.titelIstEins === true);
/* ZWEI ÜBERSCHRIFTEN DER STUFE 1 heissen beim Vorlesen: hier fangen zwei
   Dokumente an. Der Titel hat die 1, ein h1-Block ist die 2. */
p('… und es gibt nur EINE Stufe 1', gliederung.einserAnzahl === 1,
  String(gliederung.einserAnzahl));
p('Die Griffe stehen nicht im Überschriftentext', gliederung.sauber === true,
  gliederung.stufen.join(' | '));
p('Der Fenstertitel nennt die offene Seite',
  /^Gliederung — Redion$/.test(gliederung.fenster),
  gliederung.fenster + ' — vorher stand dort immer nur „Redion"');


console.log('\n4 · Meldungen werden auch gehört, nicht nur gesehen');

/* „Gespeichert", „3 Zeilen gelöscht", „Der Schlüssel passt nicht" — ohne
   Live-Bereich erscheint das nur auf dem Bildschirm. Wer zuhört, erfährt
   nichts davon, und zwar auch dann nicht, wenn er den Vorgang ausgelöst hat. */
const meldung = await seite.evaluate(() => {
  const t = document.getElementById('toast');
  return { rolle: t?.getAttribute('role'), live: t?.getAttribute('aria-live'),
           ganz: t?.getAttribute('aria-atomic'),
           /* Ein Live-Bereich, der auf `display:none` steht, meldet nichts. */
           weg: t ? getComputedStyle(t).display === 'none' : true };
});
p('Die Meldezeile ist ein Live-Bereich',
  meldung.rolle === 'status' && meldung.live === 'polite',
  JSON.stringify(meldung));
p('… und sie ist nicht ausgeblendet', meldung.weg === false,
  'ein versteckter Live-Bereich meldet nichts');
p('… und der ganze Satz wird gemeldet, nicht nur die geänderten Wörter',
  meldung.ganz === 'true');


console.log('\n5 · Keine Auskunft steckt nur in einer Farbe');

/* DER ROTE PUNKT AM REITER heisst „hier liegt Ungelesenes". Er ist rund,
   acht Pixel gross und leer — für ein Vorleseprogramm ist er nichts. Die
   Zahl gehört in den NAMEN des Knopfes; der Punkt ist das Bild dazu. */
await aufraeumen();
const punkt = await seite.evaluate(async () => {
  const knopf = document.getElementById('hl-mehr')!;
  const pt = knopf.querySelector<HTMLElement>('.hl-punkt')!;
  /* Eine ungelesene Meldung erzeugen und neu zeichnen lassen. */
  Werkzeuge.posteingangMelden({ text: 'Eine ungelesene Meldung', quelle: 'Probe' });
  Seitenleiste.handyLeiste();
  await new Promise(f => setTimeout(f, 200));
  return {
    versteckt: pt.getAttribute('aria-hidden') === 'true',
    name: knopf.getAttribute('aria-label') || '',
    sichtbar: !pt.hidden
  };
});
p('Der Punkt selbst ist für das Vorlesen ausgeblendet', punkt.versteckt === true);
p('Die Zahl steht im Namen des Knopfes', /\d+\s*ungelesen/.test(punkt.name),
  punkt.name || '(kein Name) — vorher hiess der Knopf nur „Mehr", mit und ohne Punkt');
/* Und ohne Ungelesenes verschwindet auch der Zusatz — ein Knopf, der
   dauerhaft „0 ungelesen" heisst, ist schlimmer als keiner. */
const leerName = await seite.evaluate(async () => {
  Werkzeuge.meldungenLeeren();
  Seitenleiste.handyLeiste();
  await new Promise(f => setTimeout(f, 150));
  return document.getElementById('hl-mehr')!.getAttribute('aria-label');
});
p('… und verschwindet, wenn nichts mehr anliegt', !leerName || !/ungelesen/.test(leerName),
  String(leerName));


console.log('\n6 · Die Reiter sagen, auf welchem man steht');

/* `role="tab"` OHNE `aria-selected` meldet vier gleichrangige Reiter. Wo
   man ist, stand einzig in der Farbe der Pille. */
const reiter = await seite.evaluate(async () => {
  Seitenleiste.reiterWechseln('bespr');
  await new Promise(f => setTimeout(f, 300));
  return [...document.querySelectorAll<HTMLElement>('#handy-oben [role="tab"]')]
    .map(t => ({ id: t.id, sel: t.getAttribute('aria-selected') }));
});
p('Jeder Reiter sagt, ob er gewählt ist',
  reiter.length >= 4 && reiter.every(r => r.sel === 'true' || r.sel === 'false'),
  JSON.stringify(reiter));
p('… und genau einer ist es',
  reiter.filter(r => r.sel === 'true').length === 1 &&
  reiter.find(r => r.sel === 'true')?.id === 'hl-bespr',
  JSON.stringify(reiter));

/* Am Rechner sind es keine Reiter, sondern Verweise — dort ist
   `aria-current` das richtige Wort. */
const seitenReiter = await seite.evaluate(() =>
  [...document.querySelectorAll<HTMLElement>('#side-reiter .sr')]
    .map(b => ({ r: b.dataset.reiter, an: b.classList.contains('on'),
                 jetzt: b.getAttribute('aria-current') })));
p('Auch die Seitenleiste sagt es, nicht nur mit Farbe',
  seitenReiter.filter(x => x.an).every(x => x.jetzt === 'page') &&
  seitenReiter.filter(x => !x.an).every(x => !x.jetzt),
  JSON.stringify(seitenReiter));


console.log('\n7 · Dialoge sind Dialoge — und die Tastatur kommt hinein');

/* An 106 Stellen baut Redion ein `<div class="overlay">`. Keiner davon war
   für ein Vorleseprogramm ein Dialog, keiner nahm den Fokus auf, aus zweien
   lief Tab hinaus, und keiner gab den Fokus beim Schliessen zurück.
   Repariert an EINER Stelle — `schale/ueberlagerung/fokus.ts`. */
for (const [name, ruf] of DIALOGE) {
  await aufraeumen();
  await seite.evaluate(async (r) => {
    document.getElementById('btn-search')?.focus();
    (0, eval)(r);
    await new Promise(f => setTimeout(f, 450));
  }, ruf);

  const auf = await seite.evaluate(() => {
    const d = document.querySelector<HTMLElement>('.overlay, .menu-grund');
    const a = document.activeElement;
    return d ? {
      rolle: d.getAttribute('role'), modal: d.getAttribute('aria-modal'),
      name: d.getAttribute('aria-label') || d.getAttribute('aria-labelledby') || '',
      fokusDrin: !!(a && d.contains(a))
    } : null;
  });
  p(`${name}: ist ein Dialog`,
    auf?.rolle === 'dialog' && auf?.modal === 'true', JSON.stringify(auf));
  p(`${name}: hat einen Namen`, !!auf?.name, auf?.name || '(keiner)');
  p(`${name}: der Fokus steht darin`, auf?.fokusDrin === true);

  /* Zwölfmal Tab — läuft der Fokus hinaus? */
  for (let i = 0; i < 12; i++) await seite.keyboard.press('Tab');
  const gehalten = await seite.evaluate(() => {
    const d = document.querySelector<HTMLElement>('.overlay, .menu-grund');
    const a = document.activeElement as HTMLElement | null;
    return { drin: !!(d && a && d.contains(a)),
             wo: a ? (a.id || a.className || a.tagName) : '-' };
  });
  p(`${name}: Tab bleibt im Dialog`, gehalten.drin === true,
    'gelandet bei ' + gehalten.wo + ' — dahinter, unter der Überlagerung');

  await seite.keyboard.press('Escape');
  await seite.waitForTimeout(400);
  const zurueck = await seite.evaluate(() => ({
    offen: document.querySelectorAll('.overlay, .menu-grund').length,
    fokus: (document.activeElement as HTMLElement | null)?.id || '(body)'
  }));
  p(`${name}: Escape schliesst`, zurueck.offen === 0, String(zurueck.offen));
  p(`${name}: und der Fokus kommt zurück`, zurueck.fokus === 'btn-search',
    zurueck.fokus + ' — vorher blieb er auf <body>, und das nächste Tab fing oben an');
}

await aufraeumen();

console.log('\n8 · Das Grundgerüst');

const grund = await seite.evaluate(() => ({
  lang: document.documentElement.lang,
  main: document.querySelectorAll('main, [role="main"]').length,
  nav: document.querySelectorAll('nav, [role="navigation"]').length,
  sprung: !!document.getElementById('zum-inhalt')
}));
p('Die Seite nennt ihre Sprache', grund.lang === 'de', grund.lang);
p('Es gibt einen Hauptbereich', grund.main >= 1, String(grund.main));
p('Es gibt Navigationsbereiche', grund.nav >= 1, String(grund.nav));
p('Und einen Weg an der Seitenleiste vorbei', grund.sprung === true);

await browser.close();
server.close();

console.log(`\n  Suite 92 — Barrierefreiheit: ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
