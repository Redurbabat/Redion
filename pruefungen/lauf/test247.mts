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
p('Über „Abschnitte anpassen" kommen sie zurück',
  zurueck.geht && nachRueckkehr.length === SOLL.length,
  zurueck.grund || `${nachRueckkehr.length} Zeilen`);

/* Und wieder weg — sonst stünde die Prüfung mit eingeschalteten Werkzeugen
   da und die nächsten Punkte messen einen anderen Zustand. */
await seite.evaluate(() => Seitenleiste.abschnittSchalten('werkzeuge'));
await seite.waitForTimeout(400);

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

console.log('\nFehler am Telefon:', handyFehler.length ? handyFehler.join(' | ') : 'keine');
p('Keine Fehler am Telefon', !handyFehler.length, handyFehler.join(' | '));
await handy.close();

console.log(`\n${ok} bestanden, ${weg} gescheitert`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
