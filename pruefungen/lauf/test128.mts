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

/* Die Module heissen im Browser schlicht so — mit `module: none` sind sie
   gewöhnliche Konstanten im Skript-Bereich und hängen NICHT am Fenster. */
declare const Ruhig: any;
declare const Store: any;
declare const App: any;

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9503;

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

/* SEIT E219 STEHT DIE LEISTE RUHIG: „Suchen", „Neue Seite" und die Reiter
   sind da, aber hinter „Mehr". Ein verstecktes Element nimmt keinen Fokus
   an — `focus()` tut dann schlicht nichts, und die Messung liest den
   Rahmen des unfokussierten Zustands.
   Also erst aufklappen. Das ist kein Umweg der Prüfung, sondern der Weg,
   den auch ein Mensch geht (dieselbe Stelle wie in test33). */
await seite.evaluate(() => {
  if (typeof Ruhig !== 'undefined' && Ruhig.an() && !Ruhig.offen()) Ruhig.schalten();
});
await seite.waitForTimeout(300);

/* UND ERST EINE SEITE ÖFFNEN — dieselbe Lehre, ein Schritt weiter (E279).
   `#btn-page-menu` und der Stern stehen seit E278/L68 nur noch auf einer
   ECHTEN Seite: ohne sie täten sie lautlos nichts, also sind sie `hidden`
   (§47). Ein verstecktes Element nimmt keinen Fokus an — genau der Fall,
   den der Absatz darüber schon für die Seitenleiste beschreibt.

   Der Punkt war deshalb rot, und er hatte recht: gemessen wurde ein Knopf,
   den es auf diesem Bildschirm gar nicht gibt. Die Antwort ist nicht, ihn
   aus der Liste zu streichen — dann bliebe der Fokusrahmen der Kopfzeile
   ungeprüft —, sondern den Bildschirm herzustellen, auf dem er steht. */
await seite.evaluate(() => {
  const s = Store.addBlock(null, 'page', { text: 'Fokusprobe' });
  App.oeffne(s.id);
});
await seite.waitForTimeout(400);

/* Ohne sichtbaren Fokus ist Tastaturbedienung Raten. */
const fokus = await seite.evaluate(() => {
  /* DIE PROBEN SIND DIE SCHALE VON HEUTE (E272 Phase F).
     Vorher standen hier fünf Selektoren aus der Seitenleiste. Die ist am
     Rechner `display:none`, und ein unsichtbares Element nimmt den Fokus
     nicht an — `el.focus()` tat nichts, `outlineWidth` blieb 0, und der
     Punkt meldete „kein sichtbarer Fokus" für eine Leiste, die gar nicht
     da war. Falscher Alarm auf einer echten Frage.

     Gemessen wird jetzt, was ein Mensch am Rechner mit der Tastatur
     wirklich erreicht: der Reiter, „Datei", die Suche oben rechts, ein
     Knopf der Kontextkante und einer der Kopfzeile.

     SEIT E728 IST DIE SUCHE OBEN RECHTS `#studio-search` IM KOPF. Bei
     offener Lade steht `#mb-suche` am Rechner nicht mehr ein zweites Mal
     im Band (L117 Punkt 3) — derselbe Griff (`App.suche()`) eine Zeile
     darüber. Ein verborgener Knopf nimmt keinen Fokus an; gemessen wird
     deshalb der, den ein Mensch mit der Tastatur erreicht. Am Telefon
     bleibt `#mb-suche` im Band (test40, test384). */
  const proben = ['.mb-reiter-knopf', '#mb-datei', '#studio-search',
                  '#kante .k-knopf', '#btn-page-menu'];
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
  /* Auch hier: der Knopf, auf den der Fokus zurückkommen soll, muss
     sichtbar sein. `aufraeumen` zeichnet die Leiste neu und klappt „Mehr"
     dabei zu. */
  await seite.evaluate(() => {
    if (typeof Ruhig !== 'undefined' && Ruhig.an() && !Ruhig.offen()) Ruhig.schalten();
  });
  await seite.waitForTimeout(200);
  /* DER HERKUNFTSKNOPF IST SEIT E272 PHASE F `mb-suche`.
     Vorher war es `#btn-search` in der Seitenleiste; die ist am Rechner
     `display:none`, und ein unsichtbares Element nimmt den Fokus nicht an
     — `focus()` tut dann schlicht nichts, ohne Fehler. Der Dialog hatte
     also keine Herkunft, und `fokus.ts` fiel korrekt auf `#page` zurück
     (E223). Gemessen wurde damit die Notlösung statt des Regelfalls.
     `mb-suche` ist derselbe Griff (`App.suche()`), nur an der Stelle, an
     der er heute steht. */
  /* Seit E728 ist es `studio-search`: dieselbe Handlung, der Knopf, der
     am Rechner sichtbar ist (siehe oben). */
  await seite.evaluate(async (r) => {
    document.getElementById('studio-search')?.focus();
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
  p(`${name}: und der Fokus kommt zurück`, zurueck.fokus === 'studio-search',
    zurueck.fokus + ' — vorher blieb er auf <body>, und das nächste Tab fing oben an');
}

await aufraeumen();

/* ==========================================================================
 * DER FALL, DEN DIE RUHIGE FASSUNG ERST SCHAFFT (E219)
 * --------------------------------------------------------------------------
 * Oben wird „Mehr" aufgeklappt, damit der Knopf, auf den der Fokus
 * zurückkommen soll, überhaupt da ist. Es gibt aber den anderen Weg: Strg+P
 * öffnet die Suche AUCH mit zugeklappter Leiste — dann ist der Auslöser
 * unsichtbar, und ein unsichtbares Element kann den Fokus nicht annehmen.
 *
 * Was dann? Nicht `<body>`: von dort fängt das nächste Tab wieder ganz oben
 * an, und genau davor schützt der Punkt darüber. Es muss irgendein
 * sichtbares, fokussierbares Element sein — wo genau, ist Geschmackssache,
 * dass überhaupt eines, ist es nicht.
 * ========================================================================*/
console.log('\n7b · Fokus zurück, wenn der Auslöser versteckt ist');

await seite.evaluate(() => {
  if (typeof Ruhig !== 'undefined') { Ruhig.setzen(true); if (Ruhig.offen()) Ruhig.schalten(); }
});
await seite.waitForTimeout(300);
const versteckt = await seite.evaluate(() => {
  const k = document.getElementById('btn-search');
  if (!k) return 'kein Knopf';
  return getComputedStyle(k).display === 'none' ? 'versteckt' : 'sichtbar';
});
p('Mit zugeklappter Leiste ist „Suchen" wirklich versteckt',
  versteckt === 'versteckt', versteckt);

await seite.keyboard.press('Control+p');
await seite.waitForTimeout(500);
await seite.keyboard.press('Escape');
await seite.waitForTimeout(450);
const danach = await seite.evaluate(() => {
  const a = document.activeElement as HTMLElement | null;
  if (!a || a === document.body) return { wo: '(body)', sichtbar: false, fokussierbar: false };
  const k = a.getBoundingClientRect();
  const st = getComputedStyle(a);
  return {
    wo: a.id || a.className || a.tagName,
    sichtbar: k.width > 0 && k.height > 0 && st.visibility !== 'hidden' && st.display !== 'none'
  };
});
p('Der Fokus landet nicht auf <body>', danach.wo !== '(body)', danach.wo);
p('Sondern auf etwas Sichtbarem', danach.sichtbar === true, danach.wo);

/* UND DIE EIGENTLICHE FRAGE, nicht die Eigenschaft, sondern die Wirkung.
   `tabindex="-1"` heisst „programmatisch fokussierbar, aber nicht im
   Tab-Weg" — genau richtig für einen Inhaltsbereich. Ob das Ziel taugt,
   entscheidet sich also nicht an einem Attribut, sondern daran, ob das
   nächste Tab WEITERGEHT statt oben neu anzufangen. */
const vorTab = danach.wo;
await seite.keyboard.press('Tab');
await seite.waitForTimeout(250);
const nachTab = await seite.evaluate(() => {
  const a = document.activeElement as HTMLElement | null;
  const ersterInLeiste = document.querySelector<HTMLElement>('#sidebar button');
  return { wo: a ? (a.id || a.className || a.tagName) : '(body)',
           gehtObenLosWieder: !!(a && ersterInLeiste && a === ersterInLeiste) };
});
p('Und das nächste Tab fängt nicht wieder ganz oben an',
  !nachTab.gehtObenLosWieder, `${vorTab} → ${nachTab.wo}`);

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

/* ==========================================================================
 * 9 · KEIN KNOPF SCHREIBT WEISS AUF WEISS
 * --------------------------------------------------------------------------
 * In der Prüfungszentrale stand „Simulation starten" da, war anklickbar —
 * und war nicht zu sehen. Gemessen im Hellmodus: Schrift rgb(255,255,255)
 * auf rgb(251,251,250), ein Kontrast von 1,02 zu 1.
 *
 * Die Ursache war die Kaskade, nicht die Farbwahl: eine spezifischere Regel
 * setzte den Hintergrund neu und liess die Schriftfarbe stehen. Genau das
 * kann jederzeit wieder passieren — deshalb misst diese Prüfung nicht die
 * eine Regel, sondern das Ergebnis an jedem sichtbaren Knopf.
 *
 * GEPRÜFT WIRD IN BEIDEN LAGEN. Im Dunkelmodus fiel der Fehler nicht auf,
 * weil `--bg-side` dort dunkel ist; §48 verlangt beides.
 *
 * Die Schwelle ist 3,0 — das ist die WCAG-Grenze für grosse Schrift und für
 * Bedienelemente, nicht die 4,5 für Fliesstext. Eine strengere Zahl würde
 * heute an gestalterisch gewollten Stellen anschlagen; darum geht es hier
 * nicht. Es geht um „gar nicht zu sehen".
 * ========================================================================*/
console.log('\n9 · Kein Knopf schreibt weiss auf weiss');

/* Relative Leuchtdichte nach WCAG 2.1 — dieselbe Formel wie jedes
   Prüfwerkzeug, hier von Hand, weil kein Paket dazukommen soll. */
const KONTRAST_MESSUNG = `(async () => {
  /* ZWEI SCHREIBWEISEN, ZWEI ZAHLENBEREICHE. \`rgb(55, 53, 47)\` zählt in
     0–255, \`color(srgb 0.94 0.87 0.83)\` in 0–1 — und Chrome gibt die
     zweite Form zurück, sobald eine Farbe aus \`color-mix()\` kommt.

     Mein erster Versuch las beide gleich. Ergebnis: der aktive Reiter
     „Prüfungen" wurde als 1,70 zu 1 gemeldet, obwohl er dunkelgrau auf
     hellem Pfirsich steht und rund 10 zu 1 hat. Ein Messgerät, das
     Fehlalarme erzeugt, wird abgeschaltet — und dann sieht es auch den
     echten Fall nicht mehr. */
  const zahl = (farbe) => {
    const roh = (String(farbe).match(/[\\d.]+(?=[\\s,)])|[\\d.]+$/g) || []).map(Number);
    if (!/^color\\(/.test(String(farbe))) return roh;
    return roh.map((wert, i) => i < 3 ? wert * 255 : wert);
  };
  const helligkeit = (rgb) => {
    const teil = rgb.slice(0, 3).map(wert => {
      const v = wert / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * teil[0] + 0.7152 * teil[1] + 0.0722 * teil[2];
  };
  /* Der Grund eines Knopfes kann durchsichtig sein — dann zählt der Grund
     dahinter. Ohne diesen Aufstieg misst man Transparenz gegen Transparenz
     und bekommt für jeden schlichten Knopf einen Fehlalarm.

     UND HALBDURCHSICHTIG IST NICHT DECKEND (E272 Phase G). Der erste
     Aufstieg hielt bei der ersten Farbe mit Alpha über 0,05 an und rechnete
     mit ihr, als wäre sie deckend. Beim gewählten Reiter des Menübands ist
     der Grund die Marke --gold-glass: Gold zu 13 Prozent über fast Schwarz.
     Gemessen ergab das 1,34 zu 1 und war ein Fehlalarm: wirklich sind es
     9,04 zu 1, denn 13 Prozent Gold über #1b1d20 ist #333129 und nicht
     Gold. Die Schichten werden deshalb übereinandergerechnet, bis eine
     deckt — genau das, was der Browser auch tut.

     Das ist derselbe Grund, aus dem der Absatz darüber steht: ein Messgerät
     mit Fehlalarmen wird abgeschaltet, und dann sieht es den echten Fall
     auch nicht mehr. */
  /* UND EIN VERLAUF IST AUCH EIN GRUND (E272 Phase G).
     Redions Hauptknoepfe tragen die Marke --haupt-flaeche, und die ist ein
     linear-gradient — also ein background-IMAGE. backgroundColor gibt
     dafuer rgba(0,0,0,0) zurueck. Der Aufstieg lief deshalb an der
     violetten Flaeche vorbei bis zur weissen Tafel dahinter und meldete
     weisse Schrift auf Weiss: 1,07 zu 1 fuer "Simulation starten".

     GEMESSEN AM LAUFENDEN KNOPF: color rgb(255,255,255),
     backgroundColor rgba(0,0,0,0), backgroundImage
     linear-gradient(rgb(124,58,237), color(srgb 0.44 0.20 0.84)) — der
     Knopf ist violett und weiss lesbar. L84 war ein Messfehler, kein
     Kontrastfehler.

     Genommen wird die Farbstufe des Verlaufs mit dem SCHLECHTESTEN
     Kontrast: ein Waechter darf im Zweifel strenger sein, nie milder. */
  const stufenAusVerlauf = (el) => {
    const bild = getComputedStyle(el).backgroundImage;
    if (!bild || bild === 'none' || !/gradient\\(/.test(bild)) return [];
    return (bild.match(/rgba?\\([^)]*\\)|color\\([^)]*\\)/g) || [])
      .map(zahl).filter(t => t.length >= 3 && (t.length < 4 || t[3] > 0.5))
      .map(t => [t[0], t[1], t[2]]);
  };
  const grundVon = (el, vorne) => {
    let knoten = el;
    const schichten = [];
    while (knoten && knoten !== document.documentElement) {
      const teile = zahl(getComputedStyle(knoten).backgroundColor);
      let gesetzt = false;
      if (teile.length >= 3) {
        const alpha = teile.length < 4 ? 1 : teile[3];
        if (alpha > 0.001) {
          schichten.push([teile[0], teile[1], teile[2], alpha]);
          gesetzt = true;
          if (alpha >= 0.999) break;              /* deckt — dahinter zählt nichts */
        }
      }
      if (!gesetzt) {
        const stufen = stufenAusVerlauf(knoten);
        if (stufen.length) {
          const hellV = helligkeit(vorne);
          let schlimmste = stufen[0], schlecht = Infinity;
          for (const st of stufen) {
            const h = helligkeit(st);
            const k = (Math.max(hellV, h) + 0.05) / (Math.min(hellV, h) + 0.05);
            if (k < schlecht) { schlecht = k; schlimmste = st; }
          }
          schichten.push([schlimmste[0], schlimmste[1], schlimmste[2], 1]);
          break;                                   /* ein Verlauf deckt */
        }
      }
      knoten = knoten.parentElement;
    }
    /* Von hinten nach vorne zusammenrechnen. Deckt keine Schicht, liegt
       ganz hinten das Weiss der Seite. */
    let unten = [255, 255, 255];
    if (schichten.length && schichten[schichten.length - 1][3] >= 0.999)
      unten = schichten.pop().slice(0, 3);
    for (let i = schichten.length - 1; i >= 0; i--) {
      const s = schichten[i], a = s[3];
      unten = [0, 1, 2].map(k => a * s[k] + (1 - a) * unten[k]);
    }
    return unten;
  };
  const schlecht = [];
  document.querySelectorAll('button').forEach(knopf => {
    const kasten = knopf.getBoundingClientRect();
    if (kasten.width < 8 || kasten.height < 8) return;
    const stil = getComputedStyle(knopf);
    if (stil.visibility === 'hidden' || stil.opacity === '0') return;
    if (knopf.disabled) return;
    if (!(knopf.textContent || '').trim()) return;
    const vorne = zahl(stil.color);
    if (vorne.length >= 4 && vorne[3] < 0.5) return;
    const hell1 = helligkeit(vorne), hell2 = helligkeit(grundVon(knopf, vorne));
    const kontrast = (Math.max(hell1, hell2) + 0.05) / (Math.min(hell1, hell2) + 0.05);
    if (kontrast < 3)
      schlecht.push(((knopf.textContent || '').trim().slice(0, 34)) +
        ' [' + kontrast.toFixed(2) + ':1]');
  });
  return schlecht;
})()`;

/* ERST EINE PRÜFUNG ANLEGEN, DANN MESSEN. Die erste Fassung öffnete die
   Prüfungszentrale eines leeren Bestandes — dort gibt es keine Prüfungskarte
   und damit auch keinen Knopf „Simulation starten". Die Gegenprobe blieb
   deshalb grün, obwohl der Fehler wieder eingebaut war: gemessen wurde eine
   Seite, auf der das Gesuchte gar nicht vorkommt.
   Eine Prüfung, die nichts sieht, weil sie am falschen Ort steht, ist die
   gefährlichste Sorte — sie meldet Erfolg. */
const pruefungAngelegt = await seite.evaluate(async () => {
  const fach = Store.addPage(null, { text: 'Elektrotechnik', icon: '⚡' });
  ['Ohm :: U = R · I', 'Leistung :: P = U · I']
    .forEach(q => Store.addBlock(fach.id, 'flashcard', { text: q }));
  const plan = Store.addPage(null, { text: 'Klausurplan', icon: '📝' });
  const db = Store.addDatabase(plan.id, 'Klausuren', {
    title: { name: 'Name', type: 'title' }, wann: { name: 'Datum', type: 'date' } });
  Store.updateCollection(db.collectionId, { schoolKind: 'exams' });
  const inTagen = new Date(); inTagen.setDate(inTagen.getDate() + 6);
  const zeile = Store.addRow(db.collectionId, { title: 'Ohmsches Gesetz und Leistung' });
  Store.setProp(zeile.id, 'wann', inTagen.toISOString().slice(0, 10));
  await Store.flush();
  (globalThis as any).Produktwelten?.lernen?.('pruefungen');
  await new Promise(r => setTimeout(r, 1100));
  return [...document.querySelectorAll('.lernwelt button')]
    .filter(b => /Simulation starten/.test(b.textContent || '')).length;
});
p('Der Knopf, um den es geht, steht überhaupt da', pruefungAngelegt >= 1,
  `${pruefungAngelegt} mal „Simulation starten"`);

for (const lage of ['light', 'dark']) {
  const gefunden = await seite.evaluate(async (wunsch: string) => {
    document.documentElement.setAttribute('data-theme', wunsch);
    await new Promise(r => setTimeout(r, 120));
    (globalThis as any).Produktwelten?.lernen?.('pruefungen');
    await new Promise(r => setTimeout(r, 900));
  }, lage).then(() => seite.evaluate(KONTRAST_MESSUNG)) as string[];
  p(`Prüfungszentrale, ${lage === 'light' ? 'hell' : 'dunkel'}: jeder Knopf ist lesbar`,
    gefunden.length === 0, gefunden.slice(0, 5).join(' · '));
}

/* Gegenprobe im Lauf: die Messung muss einen wirklich blassen Knopf finden.
   Sonst ist „0 Treffer" kein Ergebnis, sondern ein defektes Messgerät. */
const erkannt = await seite.evaluate(async (code: string) => {
  const probe = document.createElement('button');
  probe.textContent = 'Unsichtbar';
  probe.style.cssText = 'color:#fff;background:#fbfbfa;padding:10px;position:fixed;top:0;left:0;z-index:9';
  document.body.appendChild(probe);
  await new Promise(r => setTimeout(r, 60));
  const treffer = await eval(code) as string[];
  probe.remove();
  return treffer.filter(x => x.startsWith('Unsichtbar'));
}, KONTRAST_MESSUNG);
p('Die Messung erkennt einen weiss-auf-weiss-Knopf', erkannt.length === 1,
  JSON.stringify(erkannt));

await seite.evaluate(() => document.documentElement.removeAttribute('data-theme'));

await browser.close();
server.close();

console.log(`\n  Suite 92 — Barrierefreiheit: ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
