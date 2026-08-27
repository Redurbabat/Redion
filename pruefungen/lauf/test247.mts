/* Suite 247 — das Menüband (E210)
 * ============================================================================
 * Start · Einfügen · Zeichnen · Werkzeuge · Elektro · Ansicht, und darunter
 * die Knöpfe des gewählten Reiters. Was hier geprüft wird, sind die Fehler,
 * die beim Bauen wirklich passiert sind — nicht die, die man sich ausdenkt.
 *
 * §1 DAS BAND STEHT DA, mit allen Reitern, und wirft keinen Fehler.
 *
 * §2 KEIN KNOPF OHNE ZEICHEN. Der erste Entwurf unterschied Symbolnamen von
 *    Textzeichen mit `/^[a-zA-Z]+$/` — „nur Buchstaben, also ein Symbolname".
 *    Damit wurden „B", „I" und „S" (Fett, Kursiv, Durchgestrichen) zu
 *    Symbolnamen, die es nicht gibt, und drei Knöpfe standen leer da. Das
 *    Auge sah es sofort; keine Prüfung hätte es gemeldet. Jetzt gibt es eine.
 *
 * §3 KEIN KNOPF OHNE NAMEN FÜR DAS OHR. Die Namen werden auf zwei Zeilen
 *    gekürzt — wer nicht sieht, muss den ganzen Namen trotzdem bekommen.
 *
 * §4 KEIN TOTER KNOPF. Jeder Eintrag ruft eine Funktion, die es gibt. Die
 *    Prüfung ist zweistufig: der Typprüfer hat sechs falsche Aufrufe
 *    gefunden (`Werkzeuge.versionen()` statt `versionen(seite)`), aber ein
 *    Eintrag, dessen Modul zur Laufzeit fehlt, geht ihm durch.
 *
 * §5 DIE WERKZEUGE SIND UMGEZOGEN UND NICHT WEG. Sieben Zeilen standen
 *    links; sie stehen jetzt oben. Der Weg zurück muss funktionieren —
 *    ein Schalter, der nichts schaltet, wäre schlimmer als kein Schalter.
 *
 * §6 EINE QUELLE, NICHT ZWEI. Seitenleiste und Band zeichnen aus demselben
 *    Register. Sonst laufen sie auseinander, und zwar still.
 *
 * §7 DER GEWÄHLTE REITER ÜBERLEBT DEN NEUSTART. Beim Bibliotheks-Regal war
 *    genau das kaputt: der Zustand wurde beim Laden der Datei gelesen, als
 *    IndexedDB noch nicht offen war (E207).
 *
 * §8 AM TELEFON: 44 px Tippfläche (§37), und das Band startet zugeklappt —
 *    aufgeklappt begann die Seite erst bei y=274 von 844.
 *
 * §9 TASTATUR (§38): Pfeiltasten wechseln den Reiter.
 *
 * §10 DAS BAND RICHTET SICH NACH DEM ORT. Auf „Heute" oder in der
 *    Bibliothek ist es zu — dort gibt es nichts einzufügen.
 *
 * §11 DIE ZEICHENWERKZEUGE (E212). Der Reiter „Zeichnen" muss auf die
 *    Fläche wirken, die gerade gemeint ist. Geprüft wird am `data-tool` der
 *    Fläche selbst, in BEIDE Richtungen (Band → Leiste und Leiste → Band),
 *    und dass sich keine toten Flächen sammeln.
 *
 * §12 KEIN NAME BRICHT MITTEN IM WORT. „Whiteboar/d", „Fachzeich/en" — 22
 *    von 113, gefunden mit Augen, von keinem Punkt hier gemeldet, weil die
 *    Knöpfe ja alle da waren.
 *
 * Starten:
 *
 *   node pruefungen/lauf/test247.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

/* DIE MODULE HEISSEN IM BROWSER SCHLICHT SO.
   `(globalThis as any).Store` ist `undefined` — mit `module: none` sind die
   Module gewöhnliche Konstanten im Skript-Bereich und hängen NICHT am
   Fenster. Genau daran ist der Vorschau-Helfer gescheitert (E207), und der
   erste Entwurf dieser Prüfung ist prompt in dieselbe Falle gelaufen. */
declare const Store: any;
declare const App: any;
declare const Register: any;
declare const Seitenleiste: any;
declare const Zeichenziel: any;

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8967;

const TYP: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.json': 'application/json', '.mjs': 'text/javascript',
  '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml'
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

/**
 * Klicken, ohne den ganzen Lauf zu verlieren.
 *
 * `page.click` wartet 30 Sekunden und wirft dann. Beim Gegenbeweis zu §7 hat
 * genau das zugeschlagen: der eingebaute Fehler liess das Band auf „Start"
 * stehen, `[data-band="w-journal"]` gab es nie, und der Lauf brach bei §4 ab
 * — die Punkte danach wurden nie geprüft, und die Meldung war ein
 * Stapelabzug statt eines Satzes.
 *
 * Eine Prüfung, die beim ersten fehlenden Element aufhört, prüft den Rest
 * nicht. Hier wird stattdessen `false` gemeldet und weitergemacht.
 */
const klick = async (seite: any, wahl: string): Promise<boolean> => {
  try { await seite.click(wahl, { timeout: 2500 }); return true; }
  catch { return false; }
};

/** Eine vorbereitete Seite: Rundgang weg, eine echte Seite offen. */
const seiteAuf = async (breite = 1440, hoehe = 980) => {
  const seite = await browser.newPage({ viewport: { width: breite, height: hoehe },
    ...(breite < 600 ? { isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : {}) });
  const fehler: string[] = [];
  seite.on('pageerror', e => fehler.push(String(e)));
  await seite.goto(`http://localhost:${PORT}/index.html`);
  await seite.waitForTimeout(2400);
  await seite.evaluate(() => {
    Store.setMeta('rundgangGesehen', true);
    Store.setMeta('neuerungenGesehen', 99);
  });
  await seite.reload();
  await seite.waitForTimeout(2800);
  await seite.evaluate(() => {
    document.querySelectorAll('#rg-willkommen,.overlay').forEach(x => x.remove());
    const St = Store;
    const s = Object.values(St.cache.blocks).find((b: any) => b?.type === 'page' && b.alive) as any;
    if (s) App.oeffne(s.id);
  });
  await seite.waitForTimeout(900);
  return { seite, fehler };
};

/* ==========================================================================
 * §1 Das Band steht da
 * ========================================================================*/
console.log('\n1 · Das Band steht da');

const { seite, fehler } = await seiteAuf();

const grund = await seite.evaluate(() => {
  const band = document.getElementById('menueband');
  const reiter = [...document.querySelectorAll('#menueband [data-mb-reiter]')]
    .map(b => (b as HTMLElement).dataset['mbReiter']);
  return {
    da: !!band, versteckt: band?.hidden !== false,
    reiter,
    aktiv: [...document.querySelectorAll('#menueband [data-mb-reiter]')]
      .filter(b => b.getAttribute('aria-selected') === 'true')
      .map(b => (b as HTMLElement).dataset['mbReiter']),
    rolle: band?.querySelector('.mb-reiter')?.getAttribute('role'),
    registerZahl: Register?.menueband?.anzahl?.() ?? -1
  };
});

p('Der Kasten ist im Baum', grund.da);
p('Er ist nicht versteckt', !grund.versteckt);
p('Alle sechs Reiter stehen da',
  ['start', 'einfuegen', 'zeichnen', 'werkzeuge', 'elektro', 'ansicht']
    .every(r => grund.reiter.includes(r)), grund.reiter.join(', '));
p('Genau EIN Reiter ist gewählt', grund.aktiv.length === 1, grund.aktiv.join(','));
p('Die Reiterzeile ist eine tablist (§38)', grund.rolle === 'tablist', String(grund.rolle));
p('Das Register hat mehr als achtzig Einträge', grund.registerZahl > 80,
  String(grund.registerZahl));

/* Jeder Reiter hat etwas zu zeigen. Ein leerer Reiter ist ein Reiter, den
   niemand braucht — oder ein `zeigen()`, das zu streng ist. */
console.log('\n1b · Kein Reiter ist leer');
const proReiter: Record<string, number> = {};
for (const r of ['start', 'einfuegen', 'zeichnen', 'werkzeuge', 'elektro', 'ansicht']) {
  await klick(seite, `#menueband [data-mb-reiter="${r}"]`);
  await seite.waitForTimeout(260);
  const z = await seite.evaluate(() => ({
    knoepfe: document.querySelectorAll('#menueband .mb-knopf').length,
    leer: !!document.querySelector('#menueband .mb-leer')
  }));
  proReiter[r] = z.knoepfe;
  p(`[${r}] hat Knöpfe`, z.knoepfe > 0 && !z.leer, `${z.knoepfe}${z.leer ? ' + LEER-Hinweis' : ''}`);
}

/* ==========================================================================
 * §2 Kein Knopf ohne Zeichen
 * ========================================================================*/
console.log('\n2 · Kein Knopf ohne sichtbares Zeichen');

/* Über ALLE Reiter, nicht nur den offenen: der Fehler mit „B"/„I"/„S" sass
   in „Start", und wer nur den gerade offenen Reiter prüft, findet ihn nur
   mit Glück. */
const ohneZeichen: Array<{ reiter: string; name: string }> = [];
const ohneName: Array<{ reiter: string; id: string }> = [];
for (const r of ['start', 'einfuegen', 'zeichnen', 'werkzeuge', 'elektro', 'ansicht']) {
  await klick(seite, `#menueband [data-mb-reiter="${r}"]`);
  await seite.waitForTimeout(240);
  const fund = await seite.evaluate((reiter: string) =>
    [...document.querySelectorAll('#menueband .mb-knopf')].map(b => {
      const svg = b.querySelector('svg');
      const glyph = b.querySelector('.mb-glyph');
      /* „Vorhanden" reicht nicht — ein leeres <span data-sym="B"> ist da und
         zeigt nichts. Gemessen wird, ob es FLÄCHE hat. */
      const svgDa = !!svg && svg.getBoundingClientRect().width > 4;
      const glyphDa = !!glyph && (glyph.textContent || '').trim().length > 0
        && glyph.getBoundingClientRect().width > 4;
      return { reiter, id: (b as HTMLElement).dataset['band'] || '',
               name: (b.querySelector('.mb-name')?.textContent || '').trim(),
               zeichen: svgDa || glyphDa,
               beschriftung: (b.getAttribute('aria-label') || '').trim(),
               titel: (b as HTMLElement).title };
    }), r);
  fund.forEach(k => {
    if (!k.zeichen) ohneZeichen.push({ reiter: k.reiter, name: k.name || k.id });
    if (!k.beschriftung || !k.titel) ohneName.push({ reiter: k.reiter, id: k.id });
  });
}
p('Jeder Knopf zeigt ein Zeichen', ohneZeichen.length === 0,
  ohneZeichen.map(x => `${x.reiter}/${x.name}`).join(', '));

/* ==========================================================================
 * §3 Der ganze Name kommt beim Ohr an
 * ========================================================================*/
console.log('\n3 · Der ganze Name steht in aria-label und title');
p('Jeder Knopf hat beides', ohneName.length === 0,
  ohneName.map(x => `${x.reiter}/${x.id}`).join(', '));

/* Der sichtbare Text darf gekürzt sein — die Beschriftung nicht. */
await klick(seite, '#menueband [data-mb-reiter="einfuegen"]');
await seite.waitForTimeout(260);
const gekuerzt = await seite.evaluate(() => {
  const raus: Array<{ id: string; sicht: string; label: string }> = [];
  document.querySelectorAll('#menueband .mb-knopf').forEach(b => {
    const n = b.querySelector('.mb-name');
    if (!n) return;
    const sicht = (n.textContent || '').trim();
    const label = (b.getAttribute('aria-label') || '').trim();
    /* Gekürzt heisst: der Kasten ist schmaler als der Inhalt. */
    if (n.scrollHeight > n.clientHeight + 2 || n.scrollWidth > n.clientWidth + 2)
      raus.push({ id: (b as HTMLElement).dataset['band'] || '', sicht, label });
  });
  return raus;
});
const labelZuKurz = gekuerzt.filter(x => x.label.length < x.sicht.length);
p('Wo der Text gekürzt ist, trägt die Beschriftung mehr',
  labelZuKurz.length === 0,
  labelZuKurz.map(x => x.id).join(', '));
console.log(`     (${gekuerzt.length} von ${proReiter['einfuegen']} Namen werden gekürzt)`);

/* ==========================================================================
 * §4 Kein toter Knopf
 * ========================================================================*/
console.log('\n4 · Kein Eintrag zeigt ins Leere');

const tot = await seite.evaluate(() => {
  const R = Register?.menueband;
  if (!R) return { fehlt: ['Register.menueband fehlt'], gesamt: 0 };
  const fehlt: string[] = [];
  const alle = R.alle();
  for (const e of alle) {
    if (typeof e.tun !== 'function') { fehlt.push(e.id + ': kein tun()'); continue; }
    if (!e.name) fehlt.push(e.id + ': kein Name');
    if (!e.zeichen) fehlt.push(e.id + ': kein Zeichen');
    if (!e.reiter) fehlt.push(e.id + ': kein Reiter');
  }
  /* Doppelte Kennungen: zwei Einträge mit derselben id heissen, dass ein
     Klick den falschen trifft — `eines(id)` findet nur den ersten. */
  const ids = alle.map((e: any) => e.id);
  const doppelt = ids.filter((x: string, i: number) => ids.indexOf(x) !== i);
  if (doppelt.length) fehlt.push('doppelte Kennung: ' + [...new Set(doppelt)].join(', '));
  return { fehlt, gesamt: alle.length };
});
p('Jeder Eintrag ist vollständig', tot.fehlt.length === 0, tot.fehlt.slice(0, 4).join(' | '));

/* Und einer wird wirklich gedrückt. „Journal" legt einen Tageseintrag an —
   das ist im Bestand sichtbar und braucht keine Vermutung. */
await klick(seite, '#menueband [data-mb-reiter="werkzeuge"]');
await seite.waitForTimeout(260);
const vorher = await seite.evaluate(() =>
  Object.keys(Store.cache.blocks).length);
const journalDa = await klick(seite, '#menueband [data-band="w-journal"]');
await seite.waitForTimeout(900);
p('Der Knopf „Journal" ist im Band anklickbar', journalDa);
const nachher = await seite.evaluate(() => ({
  bloecke: Object.keys(Store.cache.blocks).length,
  seite: App.aktuelleSeite()
}));
p('„Journal" im Band legt wirklich etwas an', nachher.bloecke > vorher,
  `${vorher} → ${nachher.bloecke}`);

/* ==========================================================================
 * §5 Die Werkzeuge sind umgezogen und nicht weg
 * ========================================================================*/
console.log('\n5 · Die Werkzeuge sind umgezogen, nicht gelöscht');

const werkzeuge = await seite.evaluate(() => {
  const R = Register?.menueband;
  const imBand = (R?.inReiter?.('werkzeuge') || [])
    .flatMap((g: any) => g.eintraege).map((e: any) => e.name);
  const inLeiste = [...document.querySelectorAll('#sidebar [data-abschnitt="werkzeuge"] button')]
    .map(b => (b.textContent || '').trim());
  return { imBand, inLeiste };
});
const SOLL = ['Journal', 'Schnellnotizen', 'Vorlagen', 'Graph', 'Schlagwörter',
              'Karteikarten', 'Umsetzungsstand'];
p('Alle sieben stehen im Band',
  SOLL.every(n => werkzeuge.imBand.includes(n)),
  'fehlt: ' + SOLL.filter(n => !werkzeuge.imBand.includes(n)).join(', '));
p('Und links stehen sie nicht mehr', werkzeuge.inLeiste.length === 0,
  werkzeuge.inLeiste.join(', '));

/* Der Weg zurück. Ein Schalter, der nichts schaltet, wäre schlimmer als
   keiner — genau deshalb bekam `abschnittAn` eine zweite Liste. */
const zurueck = await seite.evaluate(() => {
  const Sl = Seitenleiste;
  if (!Sl?.abschnittSchalten) return { geht: false, grund: 'Seitenleiste.abschnittSchalten fehlt' };
  Sl.abschnittSchalten('werkzeuge');
  return { geht: true, grund: '' };
});
await seite.waitForTimeout(500);
const nachRueckkehr = await seite.evaluate(() =>
  [...document.querySelectorAll('#sidebar [data-abschnitt="werkzeuge"] button')].map(b => (b.textContent || '').trim()));
/* GEGEN DAS REGISTER, NICHT GEGEN EINE ZAHL.
   Hier stand `=== SOLL.length`, also sieben. Mit E211 kamen drei Einträge
   dazu (Agenten, Besprechungen, Zuletzt), und der Punkt wurde rot — obwohl
   genau das Richtige passierte: die Seitenleiste zeichnet ALLES, was im
   Band unter „Werkzeuge" steht, weil beide aus derselben Quelle lesen.
   Eine feste Zahl hätte bei jedem neuen Eintrag wieder angeschlagen. */
const imBandJetzt = await seite.evaluate(() =>
  (Register?.menueband?.inReiter?.('werkzeuge') || [])
    .flatMap((g: any) => g.eintraege).length);
p('Über „Abschnitte anpassen" kommen sie zurück — vollständig',
  zurueck.geht && nachRueckkehr.length === imBandJetzt,
  zurueck.grund || `${nachRueckkehr.length} Zeilen gegen ${imBandJetzt} im Band`);

/* Und wieder weg — sonst stünde die Prüfung mit eingeschalteten Werkzeugen
   da und die nächsten Punkte messen einen anderen Zustand. */
await seite.evaluate(() => Seitenleiste.abschnittSchalten('werkzeuge'));
await seite.waitForTimeout(400);

/* ==========================================================================
 * §5b Agenten, Besprechungen, Zuletzt — auch umgezogen (E211)
 * ========================================================================*/
console.log('\n5b · Drei weitere Abschnitte sind oben statt links');

/* Redur: „links habe ich sehr viele Bereiche … dort oben kommt nur, was man
   nicht so viel braucht." Bei Agenten und Besprechungen war es sogar eine
   Doppelung: die Seitenleiste hat OBEN schon Reiter dafür. */
const dreiOben = await seite.evaluate(() => {
  const R = Register?.menueband;
  const namen = (R?.inReiter?.('werkzeuge') || [])
    .flatMap((g: any) => g.eintraege).map((e: any) => e.name);
  const linksTitel = [...document.querySelectorAll('#sidebar .side-section span')]
    .map(x => (x.textContent || '').replace(/[⌄›]/g, '').trim());
  return { namen, linksTitel };
});
for (const n of ['Agenten', 'Besprechungen', 'Zuletzt verwendet'])
  p(`„${n}" steht im Band`, dreiOben.namen.includes(n), dreiOben.namen.join(', '));
for (const t of ['Agenten', 'Besprechungen', 'Kürzlich verwendet'])
  p(`„${t}" steht nicht mehr links`, !dreiOben.linksTitel.includes(t),
    dreiOben.linksTitel.join(', '));

/* Und sie tun wirklich etwas. „Agenten" schaltet die Seitenleiste auf ihren
   Reiter — messbar daran, welcher Reiter danach `on` trägt. */
await klick(seite, '#menueband [data-mb-reiter="werkzeuge"]');
await seite.waitForTimeout(300);
const vorReiter = await seite.evaluate(() =>
  document.querySelector('#side-reiter .sr.on')?.getAttribute('data-reiter') || '');
await klick(seite, '#menueband [data-band="w-agenten"]');
await seite.waitForTimeout(700);
const nachAgenten = await seite.evaluate(() =>
  document.querySelector('#side-reiter .sr.on')?.getAttribute('data-reiter') || '');
p('„Agenten" schaltet die Seitenleiste auf ihren Reiter',
  vorReiter !== 'chat' && nachAgenten === 'chat', `${vorReiter} → ${nachAgenten}`);

await klick(seite, '#menueband [data-band="w-bespr"]');
await seite.waitForTimeout(700);
const nachBespr = await seite.evaluate(() =>
  document.querySelector('#side-reiter .sr.on')?.getAttribute('data-reiter') || '');
p('„Besprechungen" ebenso', nachBespr === 'bespr', `${nachAgenten} → ${nachBespr}`);

/* Zurück auf den Seitenbaum, sonst messen die nächsten Punkte einen
   anderen Zustand. */
await seite.evaluate(() => App.reiterWechseln('start'));
await seite.waitForTimeout(500);

/* ==========================================================================
 * §6 Eine Quelle, nicht zwei
 * ========================================================================*/
console.log('\n6 · Seitenleiste und Band lesen dasselbe Register');

const einQuell = await seite.evaluate(() => {
  const R = Register?.menueband;
  const ausRegister = (R?.inReiter?.('werkzeuge') || [])
    .flatMap((g: any) => g.eintraege).map((e: any) => e.name);
  Seitenleiste.abschnittSchalten('werkzeuge');
  return { ausRegister };
});
await seite.waitForTimeout(500);
const ausLeiste = await seite.evaluate(() =>
  [...document.querySelectorAll('#sidebar [data-abschnitt="werkzeuge"] button')]
    .map(b => [...b.children].filter(c => c.tagName === 'SPAN' && !c.hasAttribute('data-sym')
      && !c.classList.contains('k')).map(c => (c.textContent || '').trim()).join('')));
p('Beide Listen sind Zeichen für Zeichen dieselbe',
  JSON.stringify(einQuell.ausRegister) === JSON.stringify(ausLeiste),
  JSON.stringify(ausLeiste));
await seite.evaluate(() => Seitenleiste.abschnittSchalten('werkzeuge'));
await seite.waitForTimeout(300);

/* Und „Einfügen" ist kein zweiter Blockkatalog. */
const einfuegenQuell = await seite.evaluate(() => {
  const bloecke = (Register.bloecke.alle() as any[])
    .filter(b => b && b.id && !b.aktion).map(b => b.name).sort();
  const imBand = (Register.menueband.inReiter('einfuegen') || [])
    .flatMap((g: any) => g.eintraege).map((e: any) => e.name).sort();
  return { bloecke, imBand };
});
p('„Einfügen" zeigt genau die Blockarten aus dem Blockregister',
  JSON.stringify(einfuegenQuell.bloecke) === JSON.stringify(einfuegenQuell.imBand),
  `${einfuegenQuell.bloecke.length} gegen ${einfuegenQuell.imBand.length}`);

/* ==========================================================================
 * §7 Der gewählte Reiter überlebt den Neustart
 * ========================================================================*/
console.log('\n7 · Der gewählte Reiter wird gemerkt');

await klick(seite, '#menueband [data-mb-reiter="elektro"]');
await seite.waitForTimeout(320);
await seite.reload();
await seite.waitForTimeout(2800);
const nachNeustart = await seite.evaluate(() =>
  [...document.querySelectorAll('#menueband [data-mb-reiter]')]
    .filter(b => b.getAttribute('aria-selected') === 'true')
    .map(b => (b as HTMLElement).dataset['mbReiter'])[0] || '');
p('Nach dem Neustart steht „Elektro" noch', nachNeustart === 'elektro', nachNeustart);

/* Zuklappen und wieder auf. */
await klick(seite, '#menueband .mb-klapp');
await seite.waitForTimeout(300);
const zu = await seite.evaluate(() => ({
  klasse: document.getElementById('menueband')?.classList.contains('ist-zu'),
  bandHoch: Math.round(document.querySelector('.mb-band')?.getBoundingClientRect().height || 0),
  reiterDa: document.querySelectorAll('#menueband [data-mb-reiter]').length
}));
p('Zugeklappt verschwindet das Band', zu.klasse === true && zu.bandHoch === 0,
  `Klasse ${zu.klasse}, Höhe ${zu.bandHoch}`);
p('Die Reiterzeile bleibt stehen', zu.reiterDa === 6, String(zu.reiterDa));
await klick(seite, '#menueband .mb-klapp');
await seite.waitForTimeout(300);
const wiederAuf = await seite.evaluate(() =>
  Math.round(document.querySelector('.mb-band')?.getBoundingClientRect().height || 0));
p('Und kommt wieder', wiederAuf > 40, String(wiederAuf));

/* ==========================================================================
 * §9 Tastatur
 * ========================================================================*/
console.log('\n9 · Tastatur (§38)');

await seite.evaluate(() => {
  const b = document.querySelector('#menueband [aria-selected="true"]') as HTMLElement;
  b?.focus();
});
await seite.keyboard.press('ArrowRight');
await seite.waitForTimeout(320);
const nachPfeil = await seite.evaluate(() =>
  [...document.querySelectorAll('#menueband [data-mb-reiter]')]
    .filter(b => b.getAttribute('aria-selected') === 'true')
    .map(b => (b as HTMLElement).dataset['mbReiter'])[0] || '');
p('Pfeil rechts wechselt den Reiter', nachPfeil === 'ansicht', nachPfeil);

await seite.keyboard.press('Home');
await seite.waitForTimeout(320);
const nachHome = await seite.evaluate(() =>
  [...document.querySelectorAll('#menueband [data-mb-reiter]')]
    .filter(b => b.getAttribute('aria-selected') === 'true')
    .map(b => (b as HTMLElement).dataset['mbReiter'])[0] || '');
p('Pos1 springt zum ersten', nachHome === 'start', nachHome);

const tabFolge = await seite.evaluate(() =>
  [...document.querySelectorAll('#menueband [data-mb-reiter]')]
    .map(b => (b as HTMLElement).tabIndex));
p('Nur der gewählte Reiter ist in der Tabulator-Folge',
  tabFolge.filter(t => t === 0).length === 1, JSON.stringify(tabFolge));

/* ==========================================================================
 * §10 Das Band richtet sich nach dem Ort
 * ========================================================================*/
console.log('\n10 · Auf einer Sonderansicht ist das Band zu');

/* Erst auf eine echte Seite, dann zurück auf „Heute". Der Rückweg ist der
   interessante: es gibt kein Ereignis dafür, der Beobachter am `#page` muss
   ihn selbst bemerken. */
await seite.evaluate(() => {
  const s2 = Object.values(Store.cache.blocks)
    .find((b: any) => b?.type === 'page' && b.alive) as any;
  if (s2) App.oeffne(s2.id);
});
await seite.waitForTimeout(900);
const aufSeite = await seite.evaluate(() => ({
  sonder: document.getElementById('page')?.classList.contains('produkt-welt'),
  zu: document.getElementById('menueband')?.classList.contains('ist-zu'),
  hoch: Math.round(document.getElementById('menueband')?.getBoundingClientRect().height || 0)
}));
p('Auf einer Seite ist das Band offen',
  aufSeite.sonder === false && aufSeite.zu === false && aufSeite.hoch > 100,
  JSON.stringify(aufSeite));
/* Und es passt in EINE Zeile. Mit der Gruppe „Finden" waren es zwei und
   221 px — bei 1400 px Fensterbreite, nicht bei 1440. Genau die Sorte
   Kippkante, die man nur trifft, wenn man beide Breiten misst. */
p('Und braucht dafür nur eine Zeile', aufSeite.hoch <= 150, `${aufSeite.hoch} px`);

const zurueckHeute = await seite.evaluate(() => {
  const L = (globalThis as any).Lernwelt;
  if (!L?.oeffnen) return false;
  L.oeffnen('heute'); return true;
});
await seite.waitForTimeout(1100);
const aufHeute = await seite.evaluate(() => ({
  sonder: document.getElementById('page')?.classList.contains('produkt-welt'),
  zu: document.getElementById('menueband')?.classList.contains('ist-zu'),
  hoch: Math.round(document.getElementById('menueband')?.getBoundingClientRect().height || 0),
  reiter: document.querySelectorAll('#menueband [data-mb-reiter]').length
}));
p('Zurück auf „Heute" klappt es von selbst zu',
  zurueckHeute && aufHeute.sonder === true && aufHeute.zu === true,
  JSON.stringify(aufHeute));
p('Die Reiterzeile bleibt dort stehen', aufHeute.reiter === 6 && aufHeute.hoch > 25,
  `${aufHeute.reiter} Reiter, ${aufHeute.hoch} px`);

/* VIER ANSICHTEN, NICHT EINE.
   Der erste Test fragte, ob `#page` die Klasse `produkt-welt` trägt. „Heute"
   trägt sie, die BIBLIOTHEK nicht — sie trägt `wide`. Das Band stand dort
   also offen, mit einem Reiter „Einfügen", der nichts einzufügen hatte. Auf
   einem Bildschirmfoto gesehen, von keiner Prüfung gemeldet (§55.1).

   Deshalb wird jetzt jede Ansicht einzeln gefragt, und die Bibliothek ist
   ausdrücklich dabei: sie ist die, die den ersten Test überlistet hat. */
const ORTE: Array<[string, string, boolean]> = [
  ['echte Seite',   'seite',      false],
  ['Bibliothek',    'bibliothek', true],
  ['Lernwelt heute','lernwelt',   true]
];
const falscherOrt: string[] = [];
for (const [name, wie, sollZu] of ORTE) {
  const ging = await seite.evaluate((w: string) => {
    try {
      if (w === 'seite') {
        const s2 = Object.values(Store.cache.blocks)
          .find((b: any) => b?.type === 'page' && b.alive) as any;
        if (!s2) return false;
        App.oeffne(s2.id); return true;
      }
      if (w === 'bibliothek') {
        const B = (globalThis as any).Bibliothek;
        if (!B?.oeffne) return false;
        B.oeffne(); return true;
      }
      const L = (globalThis as any).Lernwelt;
      if (!L?.oeffnen) return false;
      L.oeffnen('heute'); return true;
    } catch { return false; }
  }, wie);
  await seite.waitForTimeout(1200);
  const stand = await seite.evaluate(() => ({
    zu: document.getElementById('menueband')?.classList.contains('ist-zu') === true,
    titel: !!document.getElementById('title'),
    klassen: document.getElementById('page')?.className || ''
  }));
  if (!ging || stand.zu !== sollZu)
    falscherOrt.push(`${name}: ${ging ? '' : 'nicht erreicht, '}Band ${stand.zu ? 'zu' : 'offen'}` +
      ` (soll ${sollZu ? 'zu' : 'offen'}), #title ${stand.titel}, „${stand.klassen}"`);
}
p('Das Band ist genau dort offen, wo eine Seite offen ist',
  falscherOrt.length === 0, falscherOrt.join(' | '));

/* ==========================================================================
 * §11 Die Zeichenwerkzeuge (E212)
 * ========================================================================*/
console.log('\n11 · Der Reiter „Zeichnen" wirkt auf die Fläche (E212)');

/* Zurück auf eine echte Seite — §10 hat zuletzt die Lernwelt geöffnet. */
await seite.evaluate(() => {
  const s2 = Object.values(Store.cache.blocks)
    .find((b: any) => b?.type === 'page' && b.alive) as any;
  if (s2) App.oeffne(s2.id);
});
await seite.waitForTimeout(1000);
await klick(seite, '#menueband [data-mb-reiter="zeichnen"]');
await seite.waitForTimeout(400);

/* OHNE FLÄCHE KEIN WERKZEUG.
   Ein Stift-Knopf ohne Blatt darunter hätte nichts zu tun. Er soll nicht
   ausgegraut dastehen, sondern gar nicht — das ist der Unterschied zwischen
   „geht gerade nicht" und „gibt es hier nicht". */
const ohneFlaeche = await seite.evaluate(() => ({
  da: Zeichenziel.da(),
  knoepfe: document.querySelectorAll('#menueband .mb-knopf').length,
  werkzeug: document.querySelectorAll('#menueband [data-band^="wz-"]').length
}));
p('Ohne Zeichenfläche stehen keine Werkzeuge im Band',
  ohneFlaeche.da === false && ohneFlaeche.werkzeug === 0 && ohneFlaeche.knoepfe > 0,
  JSON.stringify(ohneFlaeche));

/* Ein Blatt über den Band-Knopf selbst einfügen — nicht über einen
   Umweg. Wenn der Knopf nicht tut, was er verspricht, soll es hier
   auffallen und nicht später. */
await klick(seite, '#menueband [data-band="z-blatt"]');
await seite.waitForTimeout(1800);
const mitFlaeche = await seite.evaluate(() => ({
  da: Zeichenziel.da(), anzahl: Zeichenziel.anzahl(),
  werkzeug: document.querySelectorAll('#menueband [data-band^="wz-"]').length,
  svg: document.querySelectorAll('svg[data-tool]').length
}));
p('Mit Blatt erscheinen die Werkzeuge',
  mitFlaeche.da === true && mitFlaeche.werkzeug >= 10 && mitFlaeche.svg >= 1,
  JSON.stringify(mitFlaeche));

/* DER KNOPF MUSS WIRKEN, NICHT NUR AUSSEHEN.
   Das ist der ganze Grund für `kern/helfer/zeichenziel.ts`: ein Knopf oben
   muss wissen, auf welche Fläche er zielt. Gemessen wird am `data-tool` der
   Fläche selbst, nicht an einer Zustandsvariablen — die könnte stimmen,
   während die Fläche etwas anderes tut. */
await klick(seite, '#menueband [data-band="wz-stift"]');
await seite.waitForTimeout(500);
const nachStift = await seite.evaluate(() => ({
  amSvg: document.querySelector('svg[data-tool]')?.getAttribute('data-tool') || '',
  imKern: Zeichenziel.jetzt(),
  imBand: [...document.querySelectorAll('#menueband .mb-knopf.ist-an')]
    .map(b => (b as HTMLElement).dataset['band'] || ''),
  gedrueckt: document.querySelector('#menueband [data-band="wz-stift"]')
    ?.getAttribute('aria-pressed') || '',
  anDerLeiste: [...document.querySelectorAll('[data-wz].on')]
    .filter(b => !b.closest('#menueband'))
    .map(b => (b as HTMLElement).dataset['wz'] || '')
}));
p('„Stift" im Band stellt die Fläche wirklich um',
  nachStift.amSvg === 'stift' && nachStift.imKern === 'stift', JSON.stringify(nachStift));
p('Und das Band zeigt es an — nicht nur farbig, auch aria-pressed (§38)',
  nachStift.imBand.length === 1 && nachStift.imBand[0] === 'wz-stift'
    && nachStift.gedrueckt === 'true', JSON.stringify(nachStift));

/* ZWEI ANSICHTEN DESSELBEN ZUSTANDS.
   Die Leiste am Blatt zeigte „Schreiben", während das Band „Stift" zeigte
   und die Fläche längst auf Stift stand. Auf dem Bildschirmfoto sofort zu
   sehen (§55.1) — von der ersten Fassung dieser Prüfung nicht gemeldet,
   weil sie nur das Band ansah. */
p('Die Leiste am Blatt zeigt dasselbe wie das Band',
  nachStift.anDerLeiste.length === 1 && nachStift.anDerLeiste[0] === 'stift',
  'Leiste: ' + JSON.stringify(nachStift.anDerLeiste));

/* UND DIE GEGENRICHTUNG.
   Wer an der Leiste umschaltet, muss es im Band sehen. Sonst stünde dort
   ein Werkzeug markiert, das niemand mehr benutzt. */
await klick(seite, '.blatt-werk [data-wz="marker"]');
await seite.waitForTimeout(450);
const nachMarker = await seite.evaluate(() => ({
  imKern: Zeichenziel.jetzt(),
  imBand: [...document.querySelectorAll('#menueband .mb-knopf.ist-an')]
    .map(b => (b as HTMLElement).dataset['band'] || '')
}));
p('Umschalten an der Leiste kommt im Band an',
  nachMarker.imKern === 'marker'
    && nachMarker.imBand.length === 1 && nachMarker.imBand[0] === 'wz-marker',
  JSON.stringify(nachMarker));

/* TOTE FLÄCHEN DÜRFEN SICH NICHT SAMMELN.
   Niemand meldet eine Fläche ab. Gemessen wuchs die Liste bei jedem
   Seitenwechsel um eins, und der Zeiger blieb auf der ERSTEN stehen — nach
   fünf Wechseln hätte der Stift auf ein längst verschwundenes Blatt
   gewirkt. Sichtbar wäre davon nichts gewesen: der Knopf hätte einfach
   nichts getan. */
const seitenIds = await seite.evaluate(() =>
  (Object.values(Store.cache.blocks) as any[])
    .filter(b => b?.type === 'page' && b.alive).slice(0, 2).map(b => b.id));
for (let i = 0; i < 3 && seitenIds.length > 1; i++) {
  await seite.evaluate((ids: string[]) => { App.oeffne(ids[1]); }, seitenIds);
  await seite.waitForTimeout(450);
  await seite.evaluate((ids: string[]) => { App.oeffne(ids[0]); }, seitenIds);
  await seite.waitForTimeout(650);
}
const nachWechseln = await seite.evaluate(() => ({
  anzahl: Zeichenziel.anzahl(),
  svg: document.querySelectorAll('svg[data-tool]').length
}));
p('Nach drei Seitenwechseln steht nur die lebende Fläche in der Liste',
  seitenIds.length < 2 || nachWechseln.anzahl === nachWechseln.svg,
  `${nachWechseln.anzahl} gemeldet, ${nachWechseln.svg} wirklich da`);

/* DIE RANDLEISTE DARF NICHT INS BAND RAGEN.
   `#rand-toc` stand auf `top:50%` von `main` — und `main` enthält seit E210
   auch das Menüband. Bei vierzehn Überschriften begann die Leiste bei
   y=156, das Band reicht bis y=192. Die Striche lagen über den Knöpfen. */
/* EINE SEITE SUCHEN, DIE ÜBERSCHRIFTEN HAT — NICHT WELCHE ERFINDEN.
   Der erste Versuch legte vierzehn `h1` mit `Store.addBlock({parentId})` an
   und öffnete die Seite. Gemessen ging `Store.childrenOf(id)` dabei von 1
   auf 1: `addBlock` hängt den Block nicht in die `content`-Liste des
   Elternblocks, und der Streifen zählt genau die. Es entstand also keine
   Randleiste, und der Punkt meldete „keine gefunden" statt eines Masses.
   Der Arbeitsbereich bringt vier solche Seiten mit; eine davon genügt. */
const mitKoepfen = await seite.evaluate(() => {
  /* DIE SEITE MIT DEN MEISTEN ÜBERSCHRIFTEN, NICHT DIE ERSTBESTE.
     `find` nahm, was zuerst kam — und ob das eine Seite mit vier oder mit
     39 Überschriften war, entschied die Reihenfolge im Zwischenspeicher.
     Beim Gegenbeweis kam eine andere heraus als im Durchlauf davor, und
     der Punkt war einmal grün und einmal rot, ohne dass sich am Programm
     etwas geändert hätte. Ein Punkt, der von der Reihenfolge abhängt,
     prüft die Reihenfolge. */
  const s2 = (Object.values(Store.cache.blocks) as any[])
    .filter(b => b?.type === 'page' && b.alive)
    .map(b => ({ b, k: Store.childrenOf(b.id)
      .filter((k: any) => ['h1', 'h2', 'h3'].includes(k.type) && (k.text || '').trim()).length }))
    .sort((x, y) => y.k - x.k)[0];
  if (!s2 || s2.k < 3) return null;
  App.oeffne(s2.b.id);
  return `${s2.b.text || s2.b.id} (${s2.k} Überschriften)`;
});
await seite.waitForTimeout(1800);
const raender = await seite.evaluate(() => {
  const t = document.getElementById('rand-toc');
  const b = document.getElementById('menueband');
  if (!t || !b) return null;
  const tr = t.getBoundingClientRect(), br2 = b.getBoundingClientRect();
  return { tocOben: Math.round(tr.top), tocHoch: Math.round(tr.height),
           tocUnten: Math.round(tr.bottom), fenster: window.innerHeight,
           striche: t.querySelectorAll('button').length,
           rollt: t.scrollHeight > t.clientHeight + 1,
           bandUnten: Math.round(br2.bottom), ueberlappt: tr.top < br2.bottom,
           raus: tr.top < 0 || tr.bottom > window.innerHeight };
});
/* Ohne Randleiste ist hier nichts zu prüfen, und „grün" wäre gelogen. */
/* Und sie darf auch unten nicht hinausragen: was dort steht, ist genauso
   weg wie das, was oben unter dem Band liegt. */
p('Die Randleiste bleibt im Fenster, oben wie unten',
  mitKoepfen !== null && raender !== null && raender.tocHoch > 0 && !raender.raus,
  mitKoepfen === null ? 'keine Seite mit >=3 Überschriften gefunden — so kann der Punkt nie rot werden'
    : raender === null ? `Seite „${mitKoepfen}" offen, aber keine Randleiste gezeichnet`
    : JSON.stringify(raender));
p('Die Randleiste beginnt unter dem Band, nicht darin',
  mitKoepfen !== null && raender !== null && raender.tocHoch > 0 && !raender.ueberlappt,
  mitKoepfen === null ? 'keine Seite mit >=3 Überschriften gefunden — so kann der Punkt nie rot werden'
    : raender === null ? `Seite „${mitKoepfen}" offen, aber keine Randleiste gezeichnet`
    : JSON.stringify(raender));

/* ==========================================================================
 * §12 Kein Name bricht mitten im Wort
 * ========================================================================*/
console.log('\n12 · Namen brechen an Fugen, nicht in Wörtern');

/* GEFUNDEN MIT AUGEN, NICHT MIT EINER PRÜFUNG (§55.1).
   Auf dem Bildschirmfoto stand „Whiteboar/d" und „Fachzeich/en". Über alle
   sechs Reiter gemessen waren es 22 von 113 Namen. Kein Punkt hier meldete
   das: die Knöpfe waren da, hatten Zeichen, Namen und `aria-label` — nur
   lesen liess sich die Beschriftung nicht.

   Gemessen wird Zeichen für Zeichen: zu welcher Zeile gehört es? Wo eine
   Zeile auf einem Buchstaben endet und die nächste mit einem beginnt, ist
   mitten im Wort gebrochen worden. Ein Bruch an einem Leerzeichen ist
   dagegen richtig und wird nicht gezählt.

   Warum nicht einfach `scrollWidth > clientWidth`: weil das im Flex-Kasten
   immer gleich misst — der Text wird GESTAUCHT statt überzustehen. Genau
   diese Falle steht in CLAUDE.md §55.2 über die Tabellenzelle. */
const brueche: string[] = [];
let namenGeprueft = 0;
for (const r of ['start', 'einfuegen', 'zeichnen', 'werkzeuge', 'elektro', 'ansicht']) {
  await klick(seite, `#menueband [data-mb-reiter="${r}"]`);
  await seite.waitForTimeout(300);
  const fund = await seite.evaluate(() => {
    const raus: Array<{ name: string; zeilen: string[] }> = [];
    document.querySelectorAll('#menueband .mb-knopf .mb-name').forEach(el => {
      const knoten = el.firstChild;
      if (!knoten || knoten.nodeType !== 3) return;
      const text = knoten.textContent || '';
      const bereich = document.createRange();
      const zeilen: string[] = [];
      let letztesY: number | null = null;
      for (let i = 0; i < text.length; i++) {
        bereich.setStart(knoten, i); bereich.setEnd(knoten, i + 1);
        const k = bereich.getClientRects()[0];
        if (!k) continue;
        const y = Math.round(k.top);
        if (letztesY === null || Math.abs(y - letztesY) > 3) { zeilen.push(''); letztesY = y; }
        /* `noUncheckedIndexedAccess`: beides ist hier belegt — die Zeile
           wurde eben angelegt, und `i` läuft über die Länge. */
        zeilen[zeilen.length - 1] = (zeilen[zeilen.length - 1] ?? '') + (text[i] ?? '');
      }
      raus.push({ name: text, zeilen });
    });
    return raus;
  });
  for (const f of fund) {
    namenGeprueft++;
    for (let i = 0; i < f.zeilen.length - 1; i++) {
      const a = f.zeilen[i] ?? '', b = f.zeilen[i + 1] ?? '';
      if (/[A-Za-zÄÖÜäöüß]$/.test(a) && /^[A-Za-zÄÖÜäöüß]/.test(b)) {
        brueche.push(`${r}: „${f.name}" → ${f.zeilen.map(z => `„${z}"`).join(' + ')}`);
        break;
      }
    }
  }
}
p('Über alle sechs Reiter bricht kein Name mitten im Wort',
  namenGeprueft > 100 && brueche.length === 0,
  brueche.length ? `${brueche.length} von ${namenGeprueft}: ${brueche.slice(0, 4).join(' | ')}`
                 : `${namenGeprueft} Namen geprüft`);

console.log('\nFehler auf der Seite:', fehler.length ? fehler.join(' | ') : 'keine');
p('Keine Fehler auf der Seite', !fehler.length, fehler.join(' | '));
await seite.close();

/* ==========================================================================
 * §8 Am Telefon
 * ========================================================================*/
console.log('\n8 · Am Telefon (§37)');

const { seite: handy, fehler: handyFehler } = await seiteAuf(390, 844);

const handyStart = await handy.evaluate(() => {
  const band = document.getElementById('menueband');
  return {
    zu: band?.classList.contains('ist-zu'),
    bandHoch: Math.round(band?.getBoundingClientRect().height || 0),
    seiteAb: Math.round(document.getElementById('scroll')?.getBoundingClientRect().top || 0),
    reiterHoch: [...document.querySelectorAll('#menueband [data-mb-reiter]')]
      .map(b => Math.round(b.getBoundingClientRect().height))
  };
});
p('Das Band startet zugeklappt', handyStart.zu === true, `Höhe ${handyStart.bandHoch}`);
p('Die Seite beginnt im oberen Viertel', handyStart.seiteAb < 844 / 4,
  `y=${handyStart.seiteAb} von 844`);
p('Die Reiter sind mindestens 44 px hoch (Fingerregel)',
  handyStart.reiterHoch.every(h => h >= 44), JSON.stringify(handyStart.reiterHoch));

/* DER KLAPP-KNOPF MUSS IM BILD SEIN.
   Er stand am Ende der rollenden Reiterzeile und rollte mit — am Telefon
   also ausserhalb. Aufklappen ging über einen Reiter, ZUklappen gar nicht.
   Auf dem Bild sofort zu sehen, von keiner Prüfung gemeldet (§55.1). */
const klappLage = await handy.evaluate(() => {
  const k = document.querySelector('#menueband .mb-klapp');
  if (!k) return null;
  const r = k.getBoundingClientRect();
  return { links: Math.round(r.left), rechts: Math.round(r.right),
           breit: Math.round(r.width), hoch: Math.round(r.height) };
});
/* DER GEWÄHLTE REITER MUSS IM BILD SEIN.
   Vier von sechs passen auf 390 px. Wählt man den fünften, zeigte das Band
   dessen Knöpfe, während der Reiter selbst ausserhalb stand — auf dem Bild
   sah „Zeichnen" aus wie der aktive, obwohl „Elektro" gewählt war. */
await klick(handy, '#menueband [data-mb-reiter="elektro"]');
await handy.waitForTimeout(400);
const aktivImBild = await handy.evaluate(() => {
  const an = document.querySelector('#menueband .mb-reiter-knopf.ist-an');
  const zeile = document.querySelector('#menueband .mb-reiter');
  if (!an || !zeile) return null;
  const a = an.getBoundingClientRect(), z = zeile.getBoundingClientRect();
  /* „Im Kasten" reicht nicht: der Klapp-Knopf KLEBT am rechten Rand. Beim
     ersten Anlauf stand „Elektro" vollständig im Kasten und trotzdem zur
     Hälfte darunter. Gemessen wird gegen die Kante des Knopfes. */
  const k = document.querySelector('#menueband .mb-klapp')?.getBoundingClientRect();
  return { name: (an.textContent || '').trim(),
           links: Math.round(a.left - z.left), rechts: Math.round(a.right - z.left),
           zeileBreit: Math.round(z.width),
           verdeckt: !!k && a.right > k.left + 1 };
});
p('Der gewählte Reiter rollt von selbst ins Bild',
  !!aktivImBild && aktivImBild.links >= -1 && aktivImBild.rechts <= aktivImBild.zeileBreit + 1,
  JSON.stringify(aktivImBild));
p('Und liegt nicht unter dem Klapp-Knopf',
  !!aktivImBild && aktivImBild.verdeckt === false, JSON.stringify(aktivImBild));

p('Der Klapp-Knopf steht im sichtbaren Bereich',
  !!klappLage && klappLage.rechts <= 390 && klappLage.links >= 0,
  JSON.stringify(klappLage));
p('Und ist gross genug zum Antippen',
  !!klappLage && klappLage.hoch >= 44 && klappLage.breit >= 40,
  JSON.stringify(klappLage));

await klick(handy, '#menueband [data-mb-reiter="einfuegen"]');
await handy.waitForTimeout(400);
const handyAuf = await handy.evaluate(() => {
  const kn = [...document.querySelectorAll('#menueband .mb-knopf')];
  const band = document.querySelector('.mb-band') as HTMLElement;
  return {
    knoepfe: kn.length,
    zuKlein: kn.filter(b => b.getBoundingClientRect().height < 44).length,
    rolltSenkrecht: band.scrollHeight > band.clientHeight + 4,
    rolltWaagerecht: band.scrollWidth > band.clientWidth + 4,
    bandHoch: Math.round(band.getBoundingClientRect().height)
  };
});
p('Aufgeklappt stehen alle 67 Blockarten da', handyAuf.knoepfe === 67, String(handyAuf.knoepfe));
p('Jeder Knopf ist mindestens 44 px hoch', handyAuf.zuKlein === 0, String(handyAuf.zuKlein));
/* Waagerechtes Rollen findet niemand von selbst — deshalb bricht das Band um
   und rollt senkrecht. Das ist der Unterschied zwischen „vierzehn von 67
   sichtbar" und „alle erreichbar". */
p('Es rollt senkrecht und nicht seitwärts',
  handyAuf.rolltSenkrecht && !handyAuf.rolltWaagerecht,
  `senkrecht ${handyAuf.rolltSenkrecht}, waagerecht ${handyAuf.rolltWaagerecht}`);
p('Und nimmt höchstens die halbe Höhe', handyAuf.bandHoch <= 844 / 2,
  `${handyAuf.bandHoch} px`);

/* AM TELEFON SIND ES ZEILEN, UND SIE STEHEN AUF EINER LINIE.

   Erst standen dort Kacheln: die grossen (Zeichen links, Name rechts) neben
   den kleinen (Name unter dem Zeichen), in derselben Reihe — es sah aus wie
   zwei Menüs übereinander. Jetzt sind es zweispaltige Zeilen.

   Und die Namen müssen fluchten. Der `<span data-sym>` hatte keine feste
   Breite, also begannen sie zwischen x=79 und x=94 — 15 px Versatz, in
   einer Zeilenliste sofort zu sehen und von keiner Prüfung gemeldet. */
/* ÜBER ALLE REITER, NICHT NUR ÜBER EINEN.
   Die erste Fassung mass nur den offenen Reiter („Einfügen"). Beim
   Gegenbeweis flog das auf: ein absichtlich zu breites Zeichen am Knopf
   „Karteikarten" liess den Punkt grün, weil dieser Knopf im Reiter
   „Einfügen" gar nicht vorkommt. Ein Punkt, der fünf von sechs Reitern
   nicht ansieht, prüft fünf Sechstel nicht. */
const zeilenMessen = () => handy.evaluate(() => {
  const kn = [...document.querySelectorAll('#menueband .mb-knopf')];
  if (!kn.length) return null;
  const spalten: Record<number, number[]> = {};
  let quer = 0;
  for (const b of kn) {
    const k = b.getBoundingClientRect();
    const n = b.querySelector('.mb-name');
    if (!n) continue;
    /* Zeile heisst: das Zeichen steht LINKS vom Namen, nicht darüber. */
    const z = b.querySelector('svg, .mb-glyph');
    if (z && z.getBoundingClientRect().left < n.getBoundingClientRect().left) quer++;
    (spalten[Math.round(k.left / 100)] ||= []).push(Math.round(n.getBoundingClientRect().left));
  }
  const streu = Object.values(spalten).map(xs => Math.max(...xs) - Math.min(...xs));
  return { gesamt: kn.length, quer, spalten: Object.keys(spalten).length,
           groessteStreuung: streu.length ? Math.max(...streu) : -1 };
});

let zeilenForm = { gesamt: 0, quer: 0, groessteStreuung: 0 };
const schief: string[] = [];
for (const r of ['start', 'einfuegen', 'zeichnen', 'werkzeuge', 'elektro', 'ansicht']) {
  await klick(handy, `#menueband [data-mb-reiter="${r}"]`);
  await handy.waitForTimeout(320);
  const m = await zeilenMessen();
  if (!m) continue;
  zeilenForm.gesamt += m.gesamt;
  zeilenForm.quer += m.quer;
  zeilenForm.groessteStreuung = Math.max(zeilenForm.groessteStreuung, m.groessteStreuung);
  if (m.groessteStreuung > 0 || m.quer !== m.gesamt)
    schief.push(`${r}: ${m.quer}/${m.gesamt} quer, ${m.groessteStreuung} px Streuung`);
}
p('Am Telefon steht das Zeichen links vom Namen — in jedem Reiter',
  zeilenForm.gesamt > 0 && zeilenForm.quer === zeilenForm.gesamt,
  schief.join(' | ') || JSON.stringify(zeilenForm));
p('Und alle Namen einer Spalte fluchten — in jedem Reiter',
  zeilenForm.gesamt > 0 && zeilenForm.groessteStreuung === 0,
  schief.join(' | ') || `${zeilenForm.gesamt} Knöpfe geprüft`);

console.log('\nFehler am Telefon:', handyFehler.length ? handyFehler.join(' | ') : 'keine');
p('Keine Fehler am Telefon', !handyFehler.length, handyFehler.join(' | '));
await handy.close();

console.log(`\n${ok} bestanden, ${weg} gescheitert`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
