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
 * §13 „PDF EINLESEN" ÖFFNET WIRKLICH EINEN WÄHLER (L62). §4 prüft nur, ob
 *    die Funktion dahinter existiert — sie kann existieren und trotzdem
 *    nichts öffnen.
 *
 * §14 „IM TEXT" (L63). Erwähnung und Emoji brauchten den Schreibzeiger.
 *    Jetzt hängen sie einen Block ans Ende. Beim Emoji war der Weg über das
 *    Auslösezeichen „:" tot — es braucht zwei Buchstaben dahinter.
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
declare const Marken: any;
declare const Blocks: any;

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
    /* SEIT E272 PHASE G LIEGT DIE ROLLE AUF DEM INNEREN KASTEN.
       In `.mb-reiter` stehen inzwischen die Marke, „Datei", Suche, KI,
       Konto und der Klapp-Pfeil — nichts davon ist ein Reiter. Die
       `tablist` ist deshalb `.mb-tabs`. */
    rolle: band?.querySelector('.mb-tabs')?.getAttribute('role'),
    /* Und die Zusage muss stimmen: NUR Reiter darin. */
    fremdInListe: [...(band?.querySelector('.mb-tabs')?.children ?? [])]
      .filter(k => k.getAttribute('role') !== 'tab')
      .map(k => k.className),
    registerZahl: Register?.menueband?.anzahl?.() ?? -1
  };
});

p('Der Kasten ist im Baum', grund.da);
p('Er ist nicht versteckt', !grund.versteckt);
/* ACHT SEIT E272, und zwei Namen fehlen mit Absicht.
   „Werkzeuge" ist aufgeloest — der Reiter war eine Restekiste, seine elf
   Eintraege stehen jetzt in Gehen, Verlauf, Ueberpruefen und Hilfe
   (doku/PREMIUM-SHELL-MATRIX.md, R6). „Elektro" ist auf Redurs Entscheid
   kein eigener Reiter mehr; seine acht Eintraege behalten trotzdem
   `reiter: 'elektro'` im Register, weil `bereiche/elektro/start.ts` seine
   Kacheln daraus liest — geprueft wird das in test272 §5. */
p('Alle acht Reiter stehen da',
  ['gehen', 'start', 'einfuegen', 'zeichnen', 'verlauf', 'ueberpruefen',
   'ansicht', 'hilfe'].every(r => grund.reiter.includes(r)),
  grund.reiter.join(', '));
p('Und „Werkzeuge" ist wirklich weg, nicht nur leer',
  !grund.reiter.includes('werkzeuge'), grund.reiter.join(', '));
p('Genau EIN Reiter ist gewählt', grund.aktiv.length === 1, grund.aktiv.join(','));
p('Die Reiterliste ist eine tablist (§38)', grund.rolle === 'tablist', String(grund.rolle));
/* GEGENPROBE-TAUGLICH: wer „Datei" wieder in die Liste schiebt, macht
   diesen Punkt rot — genau das war der Grund fuer den inneren Kasten. */
p('… und darin steht NUR, was ein Reiter ist',
  grund.fremdInListe.length === 0, grund.fremdInListe.join(' | '));
p('Das Register hat mehr als achtzig Einträge', grund.registerZahl > 80,
  String(grund.registerZahl));

/* Jeder Reiter hat etwas zu zeigen. Ein leerer Reiter ist ein Reiter, den
   niemand braucht — oder ein `zeigen()`, das zu streng ist. */
console.log('\n1b · Kein Reiter ist leer');
const proReiter: Record<string, number> = {};
/* NUR DIE SICHTBAREN. Seit E272 verbirgt der Ueberlauf alles, was nicht in
   die eine Zeile passt (`hidden`), und ein verborgener Knopf hat die Breite
   null — die Messung „hat das SVG Flaeche" meldete ihn als zeichenlos. Beim
   Reiter „Einfuegen" waren das 56 falsche Treffer.
   Dass die Verborgenen erreichbar bleiben, prueft §2b darunter. */
for (const r of ['gehen', 'start', 'einfuegen', 'zeichnen', 'verlauf',
                 'ueberpruefen', 'ansicht', 'hilfe']) {
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
const wortStattZeichen: string[] = [];
for (const r of ['start', 'einfuegen', 'zeichnen', 'werkzeuge', 'elektro', 'ansicht']) {
  await klick(seite, `#menueband [data-mb-reiter="${r}"]`);
  await seite.waitForTimeout(240);
  const fund = await seite.evaluate((reiter: string) =>
    [...document.querySelectorAll('#menueband .mb-knopf:not([hidden])')].map(b => {
      const svg = b.querySelector('svg');
      const glyph = b.querySelector('.mb-glyph');
      /* „Vorhanden" reicht nicht — ein leeres <span data-sym="B"> ist da und
         zeigt nichts. Gemessen wird, ob es FLÄCHE hat. */
      const svgDa = !!svg && svg.getBoundingClientRect().width > 4;
      const glyphDa = !!glyph && (glyph.textContent || '').trim().length > 0
        && glyph.getBoundingClientRect().width > 4;
      /* EIN ZEICHEN, DAS SEINEN EIGENEN NAMEN ZEIGT, IST KEINES.
         `zeichen: 'file'` gibt es im Symbolregister nicht — der Zeichner
         fällt dann auf das Textzeichen zurück und malt das WORT „file" in
         einen 19-px-Kasten. §2 liess das durch: ein Textzeichen war ja da
         und hatte Fläche.

         Gemessen sind von 93 Textzeichen im Band alle ein oder zwei
         Zeichen lang (`H₁`, `•`, `1.`, `T`, Emoji), das längste ist `</>`
         mit drei — und keines besteht aus Kleinbuchstaben. Genau das ist
         die Form eines Symbolnamens, der nicht gefunden wurde. */
      const wort = /^[a-z][a-z-]{2,}$/.test((glyph?.textContent || '').trim());
      return { reiter, id: (b as HTMLElement).dataset['band'] || '',
               name: (b.querySelector('.mb-name')?.textContent || '').trim(),
               wort, glyphText: (glyph?.textContent || '').trim(),
               zeichen: svgDa || glyphDa,
               beschriftung: (b.getAttribute('aria-label') || '').trim(),
               titel: (b as HTMLElement).title };
    }), r);
  fund.forEach(k => {
    if (!k.zeichen) ohneZeichen.push({ reiter: k.reiter, name: k.name || k.id });
    if (!k.beschriftung || !k.titel) ohneName.push({ reiter: k.reiter, id: k.id });
    if (k.wort) wortStattZeichen.push(`${k.reiter}/${k.id}: „${k.glyphText}"`);
  });
}
p('Jeder Knopf zeigt ein Zeichen', ohneZeichen.length === 0,
  ohneZeichen.map(x => `${x.reiter}/${x.name}`).join(', '));
p('Und keiner zeigt statt eines Zeichens seinen Symbolnamen',
  wortStattZeichen.length === 0, wortStattZeichen.slice(0, 5).join(' | '));

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

/* EINEN BEFEHL ANKLICKEN, EGAL OB ER SICHTBAR IST (E272).
   Seit die 15er-Regel gilt, steht nicht mehr jeder Befehl im Band —
   „Erwähnung" und „Emoji" sind die letzten zwei von 69 in „Einfügen" und
   liegen im „•••". Ein Prüflauf, der stur auf den Bandknopf klickt, misst
   ab dann nicht mehr die Funktion, sondern die Fensterbreite.

   Er geht deshalb denselben Weg wie ein Mensch: erst schauen, ob der Knopf
   dasteht; wenn nicht, das „•••" öffnen und ihn dort nehmen. Findet er ihn
   auch dort nicht, gibt er `false` zurück — dann ist der Befehl wirklich
   verloren, und genau das soll rot werden. */
const klickBefehl = async (s2: any, id: string): Promise<boolean> => {
  const drin = await s2.evaluate((k: string) => {
    const b = document.querySelector<HTMLElement>(`#menueband [data-band="${k}"]`);
    return !!b && !b.hidden;
  }, id);
  if (drin) return klick(s2, `#menueband [data-band="${id}"]`);
  const mehrDa = await klick(s2, '#menueband .mb-mehr');
  if (!mehrDa) return false;
  await s2.waitForTimeout(220);
  return klick(s2, `#mb-mehr-lade [data-band="${id}"]`);
};

/* Und einer wird wirklich gedrückt. „Journal" legt einen Tageseintrag an —
   das ist im Bestand sichtbar und braucht keine Vermutung. */
/* „Journal" wohnt seit E272 unter „Gehen" — derselbe Eintrag, derselbe
   Griff `Werkzeuge.journal()`, nur ein anderer Reiter. */
await klick(seite, '#menueband [data-mb-reiter="gehen"]');
await seite.waitForTimeout(260);
const vorher = await seite.evaluate(() =>
  Object.keys(Store.cache.blocks).length);
/* SEIT PHASE E STEHT „JOURNAL" NICHT MEHR VORNE. Der Reiter „Gehen" liest
   jetzt aus `Register.module` und `Register.navigation` — 45 Einträge statt
   sechs, und „Erfassen" kommt nach „Hauptbereiche" und „Planung & Lernen".
   Damit landet Journal jenseits der fünfzehn und steht im „•••". Der
   Prüflauf geht denselben Weg wie ein Mensch. */
const journalDa = await klickBefehl(seite, 'w-journal');
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
  /* SEIT E272 UEBER ALLE REITER, nicht nur ueber „werkzeuge" — den gibt es
     nicht mehr. Die Frage ist dieselbe geblieben: stehen die sieben
     Werkzeuge irgendwo im Band, oder sind sie beim Umbau verlorengegangen? */
  const imBand = (R?.alle?.() || []).map((e: any) => e.name);
  const inLeiste = [...document.querySelectorAll('#sidebar [data-abschnitt="werkzeuge"] button')]
    .map(b => (b.textContent || '').trim());
  return { imBand, inLeiste };
});
const SOLL = ['Journal', 'Schnellnotizen', 'Vorlagen', 'Graph', 'Schlagwörter',
              'Karteikarten', 'Umsetzungsstand'];
p('Alle sieben stehen weiterhin im Band',
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
  /* SEIT E272 UEBER DAS GANZE BAND. Den Reiter „werkzeuge" gibt es nicht
     mehr; „Agenten" und „Besprechungen" stehen unter „Gehen", „Zuletzt
     verwendet" unter „Verlauf". Die Frage von E211 bleibt dieselbe: stehen
     sie OBEN und nicht mehr links? */
  const namen = (R?.alle?.() || []).map((e: any) => e.name);
  const linksTitel = [...document.querySelectorAll('#sidebar .side-section span')]
    .map(x => (x.textContent || '').replace(/[⌄›]/g, '').trim());
  return { namen, linksTitel };
});
for (const n of ['Agenten', 'Besprechungen', 'Zuletzt verwendet'])
  p(`„${n}" steht im Band`, dreiOben.namen.includes(n), dreiOben.namen.join(', '));
for (const t of ['Agenten', 'Besprechungen', 'Kürzlich verwendet'])
  p(`„${t}" steht nicht mehr links`, !dreiOben.linksTitel.includes(t),
    dreiOben.linksTitel.join(', '));

/* UND SIE TUN WIRKLICH ETWAS — SEIT E273 ETWAS ANDERES.

   Hier stand: „Agenten schaltet die Seitenleiste auf ihren Reiter",
   gemessen an `#side-reiter .sr.on`. Das war bis E272 Phase F richtig und
   danach eine Prüfung auf eine Wirkung, die niemand sieht: die
   Seitenleiste ist am Rechner `display:none`. Der Reiter wechselte
   brav — hinter einer Wand.

   Genau deshalb heissen die neuen Griffe `Agent.panel()` und
   `Meeting.panel()` (E273): sie öffnen eine eigene Fläche, und die sieht
   man. Gemessen wird jetzt die Fläche. `test272` §15 stellt dieselbe
   Frage für alle 43 Wege in „Gehen". */
const flaecheNach = async (kennung: string) => {
  await seite.evaluate(() => {
    document.querySelectorAll('.overlay, .menu, .menu-grund').forEach(x => x.remove());
  });
  await seite.waitForTimeout(200);
  await klickBefehl(seite, kennung);
  await seite.waitForTimeout(700);
  return await seite.evaluate(() => {
    const o = document.querySelector('.overlay');
    return { lagen: document.querySelectorAll('.overlay').length,
             titel: (o?.querySelector('.fh')?.textContent || '').replace(/[✕×]/g, '').trim() };
  });
};

const agentenAuf = await flaecheNach('w-agenten');
p('„Agenten" öffnet die Agentenfläche',
  agentenAuf.lagen === 1 && /Agent/i.test(agentenAuf.titel),
  JSON.stringify(agentenAuf));

const besprAuf = await flaecheNach('w-bespr');
p('„Besprechungen" öffnet die Besprechungsfläche',
  besprAuf.lagen === 1 && /Besprech/i.test(besprAuf.titel),
  JSON.stringify(besprAuf));

/* Aufräumen, sonst messen die nächsten Punkte durch eine Überlagerung. */
await seite.evaluate(() => {
  document.querySelectorAll('.overlay, .menu, .menu-grund').forEach(x => x.remove());
  App.reiterWechseln('start');
});
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

/* Und „Einfügen" ist kein zweiter Blockkatalog.

   NUR DIE BLOCKARTEN, NICHT DER GANZE REITER. Seit E215 steht dort auch
   die Gruppe „Im Text" mit zwei Aktionen (`akt-…`), und die sind keine
   Blockarten — der Punkt wurde dadurch rot, obwohl genau das Richtige
   geschah: 67 Blockarten gegen 69 Einträge. Gemeint war immer „kein
   zweiter BLOCKKATALOG", und danach wird jetzt auch gefragt. */
const einfuegenQuell = await seite.evaluate(() => {
  const bloecke = (Register.bloecke.alle() as any[])
    .filter(b => b && b.id && !b.aktion).map(b => b.name).sort();
  const imBand = (Register.menueband.inReiter('einfuegen') || [])
    .flatMap((g: any) => g.eintraege)
    .filter((e: any) => String(e.id || '').startsWith('blk-'))
    .map((e: any) => e.name).sort();
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
/* SEIT E272 IST „ELEKTRO" KEIN REITER MEHR (Redurs Entscheid). Gemerkt
   wird der Reiter weiterhin — er faellt nur auf den ersten zurueck, wenn der
   gemerkte nicht mehr existiert. Genau das prueft diese Zeile jetzt: das
   Merken funktioniert, und ein Reiter, den es nicht gibt, fuehrt nicht zu
   einer leeren Auswahl. */
p('Ein gemerkter Reiter, den es nicht mehr gibt, faellt sauber zurueck',
  nachNeustart === 'gehen', nachNeustart);

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
p('Die Reiterzeile bleibt stehen', zu.reiterDa === 8, String(zu.reiterDa));
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
/* Der Pfeil geht EINEN weiter, und der erste heisst seit E272 „Gehen". */
p('Pfeil rechts wechselt den Reiter', nachPfeil === 'start', nachPfeil);

await seite.keyboard.press('Home');
await seite.waitForTimeout(320);
const nachHome = await seite.evaluate(() =>
  [...document.querySelectorAll('#menueband [data-mb-reiter]')]
    .filter(b => b.getAttribute('aria-selected') === 'true')
    .map(b => (b as HTMLElement).dataset['mbReiter'])[0] || '');
p('Pos1 springt zum ersten', nachHome === 'gehen', nachHome);

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
  reiter: document.querySelectorAll('#menueband [data-mb-reiter]').length,
  namen: [...document.querySelectorAll<HTMLElement>('#menueband [data-mb-reiter]')]
    .map(b => b.dataset['mbReiter'] || '')
}));
/* E219 STAND HIER — E236 HAT IHN ZURÜCKGENOMMEN, und der Grund gehört
   hierher, weil diese Prüfung die alte Entscheidung bewachte.

   E219 sagte: „Ein Menüband über einer Startansicht kann ohnehin fast
   nichts", also weg damit. Zugeklappt blieben sonst sechs Reiter und ein
   Pfeil stehen — sieben anklickbare Dinge, die alle dasselbe sagen: nicht
   jetzt.

   Der Fehler war aber nicht die LEISTE, sondern ihr INHALT. Drei ihrer
   sechs Reiter — Start, Einfügen, Zeichnen — schreiben in eine Seite und
   können ohne eine gar nichts. Die anderen drei öffnen ihre eigenen
   Sachen und funktionieren überall.

   Seit E236 steht das im Register (`BRAUCHT_SEITE`), und damit räumt die
   Leiste sich selbst auf: aus sechs Reitern werden drei, statt aus einer
   Leiste keine. Und sie bleibt, weil Redur sie ganz oben haben will, wie
   an einem Rechner.

   GEPRÜFT WIRD DESHALB DAS, WAS E219 EIGENTLICH MEINTE: dass hier kein
   Knopf steht, der nichts kann. Rot wird die Prüfung, wenn ein Reiter,
   der eine Seite braucht, ohne Seite dasteht — oder wenn die Leiste ganz
   verschwindet und die drei nutzbaren Reiter mitnimmt. */
p('Zurück auf „Heute" bleibt die Leiste stehen',
  zurueckHeute && aufHeute.sonder === true && aufHeute.hoch > 25,
  JSON.stringify(aufHeute));
p('Aber nur mit den Reitern, die ohne Seite etwas können',
  /* FUENF SEIT E272, nicht drei: zu Gehen und Ansicht sind Verlauf,
     Ueberpruefen und Hilfe gekommen. Die REGEL ist unveraendert und das
     Wichtige an dieser Zeile: die drei Reiter, die eine Seite brauchen,
     stehen ohne Seite nicht da. */
  aufHeute.reiter === 5 && !aufHeute.namen.some((n: string) =>
    ['start', 'einfuegen', 'zeichnen'].includes(n)),
  `${aufHeute.reiter} Reiter: ${aufHeute.namen.join(', ')}`);

/* Ausgeschaltet gilt weiter das Alte: zugeklappt, aber mit Reiterzeile.
   Ohne diesen Punkt wäre nicht geprüft, dass der Schalter wirklich
   zurückschaltet — und die ruhige Fassung wäre keine Fassung, sondern
   ein Umbau ohne Weg zurück. */
await seite.evaluate(() => { (globalThis as any).Ruhig?.setzen(false); });
await seite.waitForTimeout(300);
await seite.evaluate(() => { (globalThis as any).Menueband?.zeichne(); });
await seite.waitForTimeout(400);
const ohneRuhig = await seite.evaluate(() => ({
  zu: document.getElementById('menueband')?.classList.contains('ist-zu'),
  hoch: Math.round(document.getElementById('menueband')?.getBoundingClientRect().height || 0),
  reiter: document.querySelectorAll('#menueband [data-mb-reiter]').length
}));
/* Der Schalter der ruhigen Fassung ändert an der Leiste seit E236 nichts
   mehr — sie hing nie an der Ruhe, sondern daran, ob eine Seite offen
   ist. Geprüft wird deshalb, dass das Zurückschalten sie nicht kaputt
   macht: dieselben drei Reiter, dieselbe Höhe. */
p('Ohne die ruhige Fassung steht dieselbe Reiterzeile da',
  ohneRuhig.reiter === 5 && ohneRuhig.hoch > 25 && ohneRuhig.zu === true,
  JSON.stringify(ohneRuhig));
await seite.evaluate(() => { (globalThis as any).Ruhig?.setzen(true); });
await seite.waitForTimeout(300);

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
  /* „ZU" HEISST SEIT E219 AUCH „GAR NICHT DA". Wo das Band nichts kann,
     steht es nicht mehr zugeklappt herum, sondern fehlt — und ein
     fehlendes Band trägt keine Klasse `ist-zu`. Wer nur die Klasse
     abfragt, hält „weg" für „offen" und meldet das Gegenteil der
     Wahrheit; genau das ist hier passiert. */
  const stand = await seite.evaluate(() => {
    const b = document.getElementById('menueband');
    const hoch = Math.round(b?.getBoundingClientRect().height || 0);
    return {
      zu: hoch === 0 || b?.classList.contains('ist-zu') === true,
      weg: hoch === 0,
      titel: !!document.getElementById('title'),
      klassen: document.getElementById('page')?.className || ''
    };
  });
  if (!ging || stand.zu !== sollZu)
    falscherOrt.push(`${name}: ${ging ? '' : 'nicht erreicht, '}Band ` +
      `${stand.weg ? 'weg' : stand.zu ? 'zu' : 'offen'}` +
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
  /* NUR DIE WERKZEUGGRUPPE.
     Erst stand hier „genau ein Knopf im Band ist markiert". Das stimmte,
     solange das Werkzeug das Einzige war, was markiert werden konnte —
     seit Farbe und Stärke dazugekommen sind (E213), sind es drei, und der
     Punkt wurde rot, obwohl genau das Richtige geschah. Gemeint war immer:
     genau EIN WERKZEUG. Also wird auch danach gefragt. */
  imBand: [...document.querySelectorAll('#menueband .mb-knopf.ist-an')]
    .map(b => (b as HTMLElement).dataset['band'] || '')
    .filter(x => x.startsWith('wz-')),
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
    .filter(x => x.startsWith('wz-'))
}));
p('Umschalten an der Leiste kommt im Band an',
  nachMarker.imKern === 'marker'
    && nachMarker.imBand.length === 1 && nachMarker.imBand[0] === 'wz-marker',
  JSON.stringify(nachMarker));

/* FARBE UND STRICHSTÄRKE (E213).
   Beim Zeichnen gehören sie zum Werkzeug. Sie standen nur an der Leiste
   unter der Fläche; im Band fehlten sie, und ein Reiter „Zeichnen" ohne
   Farbe ist kein Zeichenreiter. */
const farbStand = await seite.evaluate(() => ({
  farben: [...document.querySelectorAll('#menueband [data-band^="zf-"]')].map(b => ({
    name: (b.querySelector('.mb-name')?.textContent || '').trim(),
    tupfer: (b.querySelector('.mb-probe') as HTMLElement)?.style.background || '',
    an: b.classList.contains('ist-an')
  })),
  striche: [...document.querySelectorAll('#menueband [data-band^="zs-"]')].map(b => ({
    name: (b.querySelector('.mb-name')?.textContent || '').trim(),
    hoch: +((b.querySelector('.mb-probe i') as HTMLElement)?.getBoundingClientRect().height || 0).toFixed(2),
    an: b.classList.contains('ist-an')
  })),
  ausRegister: (() => { try { return (Marken.FARBEN || []).length; } catch { return -1; } })(),
  leisteFarbe: [...document.querySelectorAll('.blatt-farbe.on')].map(b => (b as HTMLElement).dataset['c']),
  leisteStrich: [...document.querySelectorAll('.blatt-strich.on')].map(b => (b as HTMLElement).dataset['b'])
}));
/* Aus DEMSELBEN Katalog wie die Leiste — nicht aus einer zweiten Liste. */
p('Die Farben im Band kommen aus `Marken.FARBEN`',
  farbStand.ausRegister > 0 && farbStand.farben.length === farbStand.ausRegister,
  `${farbStand.farben.length} Knöpfe, ${farbStand.ausRegister} im Katalog`);
p('Jeder Farbknopf trägt einen Tupfer UND einen Namen (§38)',
  farbStand.farben.length > 0 && farbStand.farben.every(f => f.tupfer && f.name),
  JSON.stringify(farbStand.farben));

/* DIE DREI STÄRKEN MÜSSEN AUSEINANDERZUHALTEN SEIN.
   Mit der wahren Stärke und `Math.max(2, …)` wurden aus 1,2 / 2,4 / 5 px
   gemessene 2,0 / 2,5 / 6,5 — „Dünn" und „Mittel" trennte ein halber
   Pixel, und auf dem dreifach vergrösserten Bild sahen sie gleich aus.
   Geprüft wird auf ein Verhältnis, nicht auf feste Zahlen: jede Probe muss
   spürbar dicker sein als die davor. */
const stufen = farbStand.striche.map(x => x.hoch);
const waechst = stufen.length >= 2 &&
  stufen.every((h, i) => i === 0 || h >= (stufen[i - 1] ?? 0) * 1.5);
p('Die Strichproben wachsen sichtbar — jede mindestens anderthalbfach',
  stufen.length > 0 && waechst, JSON.stringify(farbStand.striche));

/* SCHON VOR DEM ERSTEN KLICK MÜSSEN SICH BEIDE EINIG SEIN.
   Die Leiste malt sich ihre Vorgabe selbst an (Schwarz, mittlere Stärke).
   Sagt sie das dem Kern nicht, zeigt das Band fünf Farbknöpfe und markiert
   keinen — während unten einer markiert ist. Die Gegenprobe zu diesem
   Punkt (`uebernehmeFarbe` bei der Anmeldung entfernt) liess ALLE anderen
   Punkte grün: sie prüfen erst, nachdem geklickt wurde, und danach stimmt
   es wieder. Der Anfangszustand hatte niemanden. */
const anfangsFarbe = farbStand.farben.filter(f => f.an);
const anfangsStrich = farbStand.striche.filter(x => x.an);
p('Band und Leiste sind schon vor dem ersten Klick derselben Meinung',
  anfangsFarbe.length === 1 && anfangsStrich.length === 1
    && farbStand.leisteFarbe.length === 1 && farbStand.leisteStrich.length === 1,
  `Band: ${JSON.stringify(anfangsFarbe.map(f => f.name))} / ` +
  `${JSON.stringify(anfangsStrich.map(x => x.name))}  ·  ` +
  `Leiste: ${JSON.stringify(farbStand.leisteFarbe)} / ${JSON.stringify(farbStand.leisteStrich)}`);

/* Und beide Richtungen, wie beim Werkzeug. */
await klick(seite, '#menueband [data-band="zf-2"]');
await seite.waitForTimeout(400);
await klick(seite, '#menueband [data-band="zs-2"]');
await seite.waitForTimeout(400);
const nachFarbe = await seite.evaluate(() => ({
  kernFarbe: Zeichenziel.jetztFarbe(), kernDicke: Zeichenziel.jetztDicke(),
  leisteFarbe: [...document.querySelectorAll('.blatt-farbe.on')].map(b => (b as HTMLElement).dataset['c']),
  leisteStrich: [...document.querySelectorAll('.blatt-strich.on')].map(b => (b as HTMLElement).dataset['b']),
  bandAn: [...document.querySelectorAll('#menueband .mb-knopf.ist-an')]
    .map(b => (b as HTMLElement).dataset['band'])
}));
p('Farbe und Stärke aus dem Band kommen an der Leiste an',
  nachFarbe.leisteFarbe.length === 1 && nachFarbe.leisteFarbe[0] === '#2f7ed8'
    && nachFarbe.leisteStrich.length === 1 && nachFarbe.leisteStrich[0] === '5',
  JSON.stringify(nachFarbe));

/* UND JETZT WIRKLICH ZEICHNEN.
   Der Punkt darüber vergleicht zwei ANZEIGEN. Die Gegenprobe hat gezeigt,
   dass das zu wenig ist: mit ausgebautem `steuerung.setzeFarbe` blieb er
   grün — beide Anzeigen waren sich einig, und die Fläche hätte trotzdem
   schwarz gezeichnet.

   Beim Werkzeug gibt es `data-tool` am SVG, an dem sich die Wirkung ablesen
   lässt. Für Farbe und Stärke gibt es nichts dergleichen: `setzeFarbe` setzt
   eine Variable, die niemand von aussen sehen kann. Die einzige ehrliche
   Frage ist deshalb die, auf die es ankommt — MALT der Stift blau? Also
   wird ein Strich gezogen und nachgesehen, was dabei herauskommt. */
const ziehe = async (): Promise<{ stroke: string; breite: number; anzahl: number } | null> => {
  const flaeche = await seite.$('svg[data-tool]');
  if (!flaeche) return null;
  const box = await flaeche.boundingBox();
  if (!box) return null;
  const x = box.x + box.width / 2, y = box.y + 80;
  await seite.mouse.move(x, y);
  await seite.mouse.down();
  for (let i = 1; i <= 8; i++) { await seite.mouse.move(x + i * 12, y + i * 5); await seite.waitForTimeout(25); }
  await seite.mouse.up();
  await seite.waitForTimeout(700);
  return seite.evaluate(() => {
    const f = document.querySelector('svg[data-tool]');
    if (!f) return null;
    const wege = [...f.querySelectorAll('path, polyline')];
    const letzt = wege[wege.length - 1] as SVGElement | undefined;
    return { anzahl: wege.length, stroke: letzt?.getAttribute('stroke') || '',
             breite: Number(letzt?.getAttribute('stroke-width') || 0) };
  });
};
const dick = await ziehe();
await klick(seite, '#menueband [data-band="zs-0"]');
await seite.waitForTimeout(400);
const duenn = await ziehe();

p('Der gezogene Strich ist wirklich blau',
  dick !== null && dick.anzahl > 0 && dick.stroke === '#2f7ed8',
  dick === null ? 'kein Strich zustande gekommen — so kann der Punkt nie rot werden'
                : JSON.stringify(dick));

/* DIE STÄRKE NUR IM VERHÄLTNIS, NICHT ALS ZAHL.
   Der erste Entwurf verlangte `stroke-width === 5`. In meiner Handmessung
   stand da 5, im Prüflauf 20 — die Fläche rechnet die Stärke auf ihre
   Zoomstufe um, und die hängt davon ab, wie breit das Blatt gerade steht.
   Eine feste Zahl prüft damit die Fensterbreite und nicht die Stärke.

   Das Verhältnis ist dagegen unabhängig davon: dick zu dünn ist 5 : 1,2,
   also gut das Vierfache, egal wie gross das Blatt gezeichnet wird. */
const verhaeltnis = dick && duenn && duenn.breite > 0 ? dick.breite / duenn.breite : 0;
p('Und „Dick" zieht wirklich rund viermal so breit wie „Dünn"',
  dick !== null && duenn !== null && verhaeltnis > 3.5 && verhaeltnis < 5,
  `dick ${dick?.breite} : dünn ${duenn?.breite} = ${verhaeltnis.toFixed(2)}` +
  ` (erwartet ${(5 / 1.2).toFixed(2)})`);
p('Und das Band markiert genau die gewählte Farbe und Stärke',
  nachFarbe.bandAn.includes('zf-2') && nachFarbe.bandAn.includes('zs-2')
    && nachFarbe.bandAn.filter(x => (x || '').startsWith('zf-')).length === 1
    && nachFarbe.bandAn.filter(x => (x || '').startsWith('zs-')).length === 1,
  JSON.stringify(nachFarbe.bandAn));

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

/* ==========================================================================
 * §13 „PDF einlesen" öffnet wirklich einen Dateiwähler (L62)
 * ========================================================================*/
console.log('\n13 · Der Weg zur PDF (L62)');

/* WARUM DAS EIN EIGENER PUNKT IST.
   §4 fragt nur, ob die Funktion hinter dem Knopf EXISTIERT. `waehlen` gibt
   es — und hätte trotzdem nichts tun können, wenn der `<input>` nicht im
   Dokument hängt: in manchen Browsern öffnet sich dann kein Wähler, und
   zwar ohne Fehlermeldung. Ein Knopf, der still nichts tut, sieht aus wie
   einer, den man falsch bedient hat. */
await klick(seite, '#menueband [data-mb-reiter="zeichnen"]');
await seite.waitForTimeout(350);
let waehlerKam = false;
let waehlerTypen = '';
const aufWaehler = seite.waitForEvent('filechooser', { timeout: 4000 })
  .then(async (chooser: any) => {
    waehlerKam = true;
    /* AM WÄHLER SELBST ABLESEN, NICHT ÜBER DAS DOKUMENT SUCHEN.
       Der erste Entwurf fragte `document.querySelector('input[type=file]
       [accept*=pdf]')`. Das ist im Kreis gemessen: gesucht wurde nach
       genau der Eigenschaft, die geprüft werden sollte — findet er nichts,
       kommt '' heraus und der Punkt wird rot, egal warum. In der
       Gegenprobe „der input hängt nicht im Dokument" wurde er dadurch rot,
       obwohl `accept` völlig in Ordnung war.
       `chooser.element()` ist der Wähler, den der Browser wirklich
       geöffnet hat — unabhängig davon, wo er hängt. */
    try {
      const el = await chooser.element();
      waehlerTypen = (await el.getAttribute('accept')) || '';
    } catch { waehlerTypen = ''; }
    /* Wieder zumachen, sonst bleibt der Wähler offen und die nächsten
       Klicks laufen ins Leere. */
    try { await chooser.setFiles([]); } catch { /* dann eben so */ }
  })
  .catch(() => { /* kein Wähler — das meldet der Punkt gleich */ });
await klick(seite, '#menueband [data-band="z-pdf"]');
await aufWaehler;
p('„PDF einlesen" öffnet einen Dateiwähler', waehlerKam,
  'kein filechooser-Ereignis innerhalb von 4 Sekunden');
p('Und er fragt nach PDF, nicht nach allem', waehlerKam && waehlerTypen.includes('pdf'),
  `accept="${waehlerTypen}"`);

/* ==========================================================================
 * §14 Die Slash-Aktionen, die ohne Schreibzeiger gehen (L63)
 * ========================================================================*/
console.log('\n14 · „Im Text": Erwähnung und Emoji ohne Schreibzeiger (L63)');

await klick(seite, '#menueband [data-mb-reiter="einfuegen"]');
await seite.waitForTimeout(420);
const imText = await seite.evaluate(() => ({
  ausEditor: (() => { try { return [...(Blocks.AM_ENDE || [])]; } catch { return []; } })(),
  knoepfe: [...document.querySelectorAll('#menueband [data-band^="akt-"]')]
    .map(b => (b as HTMLElement).dataset['band'] || ''),
  /* KLEINGESCHRIEBEN VERGLEICHEN. Auf dem Bildschirm steht „IM TEXT", aber
     die Grossbuchstaben macht `text-transform:uppercase` — im `textContent`
     steht „Im Text". Der erste Entwurf verglich gegen die Grossschreibung
     und war damit IMMER falsch; aufgefallen ist es nur, weil das Feld in
     einer Gegenprobe mit ausgegeben wurde und dort `false` stand, wo es
     `true` hätte sein müssen. */
  gruppe: [...document.querySelectorAll('#menueband .mb-gruppe-titel')]
    .map(g => (g.textContent || '').trim().toLowerCase()).includes('im text')
}));
/* Welche es sind, sagt der Editor — nicht eine zweite Liste im Register. */
p('Die Gruppe „Im Text" führt genau das, was `Blocks.AM_ENDE` nennt',
  imText.ausEditor.length > 0 && imText.knoepfe.length === imText.ausEditor.length
    && imText.ausEditor.every(w => imText.knoepfe.includes('akt-' + w)),
  JSON.stringify(imText));
/* Ohne Überschrift steht die Gruppe am Telefon ohne Trennung neben der
   vorigen — dort ist sie das Einzige, was Gruppen auseinanderhält. */
p('Und sie trägt ihre Überschrift', imText.gruppe, JSON.stringify(imText));

/* „Erwähnung" hängt einen Block an und öffnet das Menü, das am „@" hängt. */
const vorMention = await seite.evaluate(() => Store.childrenOf(App.aktuelleSeite()).length);
await klickBefehl(seite, 'akt-mention');
await seite.waitForTimeout(1200);
const nachMention = await seite.evaluate(() => {
  const kinder = Store.childrenOf(App.aktuelleSeite());
  const letzt = kinder[kinder.length - 1];
  return { anzahl: kinder.length, text: letzt?.text ?? '',
           menues: document.querySelectorAll('.menu').length };
});
p('„Erwähnung" hängt einen Block an und öffnet das Menü',
  nachMention.anzahl === vorMention + 1 && nachMention.text === '@' && nachMention.menues === 1,
  JSON.stringify(nachMention));
await seite.keyboard.press('Escape').catch(() => {});
await seite.waitForTimeout(300);

/* EMOJI: DER DOPPELPUNKT ALLEIN TUT NICHTS.
   Gemessen: das Emoji-Menü hängt an `:` PLUS mindestens zwei Buchstaben —
   sonst klappte im Satz bei jedem Doppelpunkt etwas auf. Beim Knopfdruck
   steht am Ende aber nur der Doppelpunkt, und es passierte nichts: ein
   Knopf, der einen einsamen Doppelpunkt hinterlässt.

   Deshalb geht der Weg jetzt über den Ereignisbus zur vollen Auswahl. Der
   Punkt prüft beides: dass die Auswahl AUFGEHT und dass KEIN Doppelpunkt
   stehen bleibt. */
await seite.evaluate(() => { document.querySelectorAll('.menu').forEach(m => m.remove()); });
const vorEmoji = await seite.evaluate(() => Store.childrenOf(App.aktuelleSeite()).length);
await klickBefehl(seite, 'akt-emoji');
await seite.waitForTimeout(1200);
const nachEmoji = await seite.evaluate(() => {
  const kinder = Store.childrenOf(App.aktuelleSeite());
  const letzt = kinder[kinder.length - 1];
  return { anzahl: kinder.length, text: letzt?.text ?? '', id: letzt?.id ?? '',
           auswahl: document.querySelectorAll('.swatches.emojis').length,
           suchfeld: document.querySelectorAll('.emoji-suche').length,
           knoepfe: document.querySelectorAll('.swatches.emojis button[data-e]').length };
});
p('„Emoji" öffnet die volle Auswahl mit Suchfeld',
  nachEmoji.anzahl === vorEmoji + 1 && nachEmoji.auswahl === 1
    && nachEmoji.suchfeld === 1 && nachEmoji.knoepfe > 20,
  JSON.stringify(nachEmoji));
p('Und lässt keinen einsamen Doppelpunkt stehen',
  nachEmoji.text === '', `Blocktext „${nachEmoji.text}"`);

/* Und die Wahl muss ankommen — sonst wäre die Auswahl auch nur Zierde. */
const gewaehlt = await seite.evaluate(() => {
  const knopf = document.querySelector<HTMLElement>('.swatches.emojis button[data-e]');
  if (!knopf) return null;
  const zeichen = knopf.dataset['e'] || '';
  knopf.click();
  return zeichen;
});
await seite.waitForTimeout(900);
const imBlock = await seite.evaluate((id: string) => Store.getBlock(id)?.text ?? '(weg)',
  nachEmoji.id);
p('Ein angeklicktes Emoji steht danach im Block',
  !!gewaehlt && imBlock === gewaehlt,
  gewaehlt === null ? 'kein Emoji-Knopf zum Anklicken — so kann der Punkt nie rot werden'
                    : `gewählt „${gewaehlt}", im Block „${imBlock}"`);

/* ==========================================================================
 * 15 · Die Elektro-Seite liest dieses Register (L65)
 * --------------------------------------------------------------------------
 * „Elektro" war der einzige der fünf Wege in der obersten Gruppe der
 * Seitenleiste, der KEIN Ort war: er rief `Electrical.open()`, eine
 * Überlagerung mit dem Rechner. Vier Wege ändern die Krume, der fünfte tat
 * es nicht.
 *
 * WAS HIER GEPRÜFT WIRD, IST DIE KOPPLUNG. Die Seite hat keinen eigenen
 * Katalog (§8) — sie liest `Register.menueband.inReiter('elektro')`. Genau
 * das wird gemessen: kommt ein Weg ins Register, steht er auf der Seite;
 * fehlt einer, fehlt er dort auch. Eine Prüfung, die nur „acht Kacheln"
 * zählt, wäre auch dann grün, wenn die Seite ihre eigene Liste führte.
 * ========================================================================*/
console.log('\n15 · Die Elektro-Seite liest dieses Register (L65)');

await seite.evaluate(() => { document.getElementById('btn-elektro')?.click(); });
await seite.waitForTimeout(800);
const els = await seite.evaluate(() => {
  const ausRegister = Register.menueband.inReiter('elektro')
    .flatMap((g: any) => g.eintraege)
    .filter((e: any) => { try { return typeof e.zeigen !== 'function' || e.zeigen(); }
                          catch { return false; } });
  return {
    krume: (document.getElementById('crumb')?.textContent || '').trim(),
    ueberschrift: (document.querySelector('.els-kopf h1')?.textContent || '').trim(),
    /* Die Kacheln, in der Folge, in der sie stehen. */
    kacheln: [...document.querySelectorAll<HTMLElement>('.els-kachel')]
      .map(k => (k.querySelector('b')?.textContent || '').trim()),
    wege: [...document.querySelectorAll<HTMLElement>('.els-kachel')]
      .map(k => k.dataset['weg'] || ''),
    gruppen: [...document.querySelectorAll<HTMLElement>('.els-abschnitt h2')]
      .map(h => (h.textContent || '').trim()),
    /* Und dasselbe direkt aus dem Register. */
    imRegister: ausRegister.map((e: any) => String(e.name)),
    idsImRegister: ausRegister.map((e: any) => String(e.id)),
    /* Ein Zeichen je Kachel — leere graue Quadrate standen im ersten Bild. */
    ohneZeichen: [...document.querySelectorAll<HTMLElement>('.els-kachel')]
      .filter(k => {
        const z = k.querySelector('.els-zeichen');
        return !z || (!z.querySelector('svg') && !(z.textContent || '').trim());
      })
      .map(k => (k.querySelector('b')?.textContent || '').trim()),
    /* Nichts ragt aus dem Bild. */
    ueberlauf: [...document.querySelectorAll<HTMLElement>('.els *')]
      .filter(e => e.getBoundingClientRect().right > innerWidth + 0.5).length
  };
});
p('Der fünfte Weg führt jetzt an einen Ort', els.krume === 'Elektro', els.krume);
p('Und die Seite nennt sich selbst so', /Elektro/.test(els.ueberschrift), els.ueberschrift);
p('Es gibt überhaupt Wege im Register zu prüfen', els.imRegister.length >= 5,
  String(els.imRegister.length));
/* DIE EIGENTLICHE AUSSAGE: dieselben Namen, dieselbe Folge. */
p('Die Kacheln sind genau die Register-Einträge',
  els.kacheln.join(' | ') === els.imRegister.join(' | '),
  `Seite: ${els.kacheln.join(', ')} — Register: ${els.imRegister.join(', ')}`);
p('Und jede Kachel nennt die Kennung, über die sie ausgeführt wird',
  els.wege.join(' | ') === els.idsImRegister.join(' | '),
  els.wege.join(', '));
p('Die Gruppen des Registers stehen als Überschriften',
  ['Rechnen', 'Üben', 'Zeichnen'].every(g => els.gruppen.includes(g)),
  els.gruppen.join(', '));
/* MIT DER BEDINGUNG „ES GIBT ÜBERHAUPT KACHELN", und das ist kein Zierat:
   in der Gegenprobe, die den fünften Weg wieder zum Fenster machte, stand
   dieser Punkt grün da — es gab keine einzige Kachel, also auch keine ohne
   Zeichen. Eine Prüfung, die bei NICHTS zufrieden ist, prüft nichts. */
p('Keine Kachel steht ohne Zeichen da',
  els.kacheln.length >= 5 && els.ohneZeichen.length === 0,
  els.kacheln.length < 5 ? `nur ${els.kacheln.length} Kacheln`
                         : els.ohneZeichen.join(', '));
p('Nichts ragt aus dem Bild', els.ueberlauf === 0, String(els.ueberlauf));

/* UND DIE GEGENRICHTUNG: ein Klick führt wirklich aus. Geprüft am
   Formelheft, weil es sich messbar öffnet und nichts anlegt. */
const gestartet = await seite.evaluate(async () => {
  document.querySelectorAll<HTMLElement>('.overlay,[role=dialog]').forEach(o => o.remove());
  const k = document.querySelector<HTMLElement>('.els-kachel[data-weg="e-formelheft"]');
  if (!k) return '(keine Formelheft-Kachel)';
  k.click();
  await new Promise(r => setTimeout(r, 700));
  const auf = document.querySelector('.overlay, [role=dialog], .fh-wrap');
  return auf ? 'auf' : 'nichts';
});
p('Ein Klick auf eine Kachel führt sie aus', gestartet === 'auf', gestartet);

/* ==========================================================================
 * 16 · Was „+ Neu" anlegt, wird auch gezeichnet
 * --------------------------------------------------------------------------
 * DER FEHLER, DEN DAS AUFGEDECKT HAT: „Neue Tabelle" legte seit E45 einen
 * Block der Art `tabelle` an — und die gibt es nicht. Der Editor kennt
 * `table` (Einfache Tabelle) und `spreadsheet` (Kalkulationstabelle).
 * Gemessen war der Block 24 px hoch mit dem Inhalt „+⋮⋮": nur der Griff.
 * Wer auf „Neue Tabelle · Rechnen wie in Excel" tippte, bekam eine leere
 * Seite mit einem unsichtbaren Block darin.
 *
 * WARUM KEINE PRÜFUNG DAS FAND: E236 fragte „tut jeder Weg etwas?", und
 * eine neue Seite ist etwas. Die Frage war zu schwach. Sie lautet jetzt:
 *
 *   Kennt das Blockregister die Art, die dabei entsteht?
 *
 * `tabelle` stand in keinem Register, und das ist die Ursache und nicht die
 * Folge: eine Art, die niemand angemeldet hat, zeichnet auch niemand. Ein
 * zweiter Punkt („ist der Block höher als sein Griff?") stand hier kurz und
 * ist wieder weg — warum, steht weiter unten bei der Messung.
 * ========================================================================*/
console.log('\n16 · Was „+ Neu" anlegt, wird auch gezeichnet');

const angelegt = await seite.evaluate(async () => {
  const raus: any[] = [];
  App.erstellenBlatt();
  await new Promise(r => setTimeout(r, 400));
  const wege = [...document.querySelectorAll<HTMLElement>('.menu [data-neu]')]
    .map(k => ({ id: k.dataset['neu'] || '',
                 name: (k.querySelector('b')?.textContent || k.textContent || '').trim() }));
  document.querySelectorAll<HTMLElement>('.menu,.menu-grund').forEach(o => o.remove());

  for (const w of wege) {
    document.querySelectorAll<HTMLElement>('.menu,.menu-grund,.overlay').forEach(o => o.remove());
    App.erstellenBlatt();
    await new Promise(r => setTimeout(r, 350));
    const knopf = document.querySelector<HTMLElement>(`.menu [data-neu="${w.id}"]`);
    if (!knopf) { raus.push({ ...w, fehlt: true }); continue; }
    knopf.click();
    await new Promise(r => setTimeout(r, 1500));
    /* Was steht jetzt auf der Seite? Nur BLÖCKE zählen; Wege, die ein
       Fenster öffnen oder einen Dateiwähler klicken, legen keinen an und
       sind hier nicht gemeint. */
    const bloecke = [...document.querySelectorAll<HTMLElement>('#page .blk[data-bid]')]
      .map(e => ({ art: (e.className.match(/\bb-([a-z0-9_-]+)/) || [])[1] || '?',
                   h: Math.round(e.getBoundingClientRect().height) }))
      /* Der leere Textblock ist der Anfang jeder neuen Seite und nicht das,
         was der Weg anlegt. */
      .filter(b => b.art !== 'text');
    raus.push({ ...w, bloecke,
                unbekannt: bloecke.filter(b => !Register.bloecke.eines(b.art)).map(b => b.art) });
    document.querySelectorAll<HTMLElement>('.menu,.menu-grund,.overlay').forEach(o => o.remove());
  }
  return raus;
});

const mitBlock = angelegt.filter((x: any) => (x.bloecke || []).length);
p('Es gibt überhaupt Wege, die einen Block anlegen', mitBlock.length >= 5,
  String(mitBlock.length));
p('Jede Art, die dabei entsteht, kennt das Blockregister',
  angelegt.every((x: any) => !(x.unbekannt || []).length),
  angelegt.filter((x: any) => (x.unbekannt || []).length)
    .map((x: any) => x.name + ' → ' + x.unbekannt.join(', ')).join(' | '));
/* HIER STAND EIN ZWEITER PUNKT, UND ER IST WIEDER WEG.
   „Ist der Block höher als sein blosser Griff?" — die Idee war, den Fall zu
   fangen, in dem eine BEKANNTE Art nichts zeichnet. Gemessen im kaputten
   Zustand geht das nicht:

       Art                 Kasten   Kinder   Text   HTML
       tabelle (kaputt)     24 px      1       0     113
       todo (leer)          26 px      2       0     127
       divider               1 px      1       0      23
       table               169 px      1      56    1130

   Der kaputte Block bekommt vom Zeichner dieselbe leere Schreibzeile wie
   jeder unbekannte Typ. Es gibt kein Mass, das ihn von einer leeren
   Aufgabe oder einer Trennlinie trennt — jede Grenze wäre geraten, und
   eine geratene Grenze ist entweder blind oder launisch.

   Der Punkt darüber fängt den Fall dagegen sauber: `tabelle` stand in
   keinem Register, und das ist die Ursache, nicht die Folge. Eine Prüfung,
   die nicht rot werden kann, ist keine — auch dann nicht, wenn sie grün
   gut aussieht (§55.2). */
p('Kein Weg des Blattes ist verschwunden',
  angelegt.every((x: any) => !x.fehlt),
  angelegt.filter((x: any) => x.fehlt).map((x: any) => x.name).join(', '));

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
    /* Wie viele es SEIN sollen, sagt das Register — nicht die Zahl 67.
       Sie stand hier fest, und die zwei Einträge aus E215 machten den Punkt
       rot, obwohl nichts fehlte. Eine feste Zahl in einem Punkt, der eine
       Liste bewacht, schlägt bei jedem neuen Eintrag an und sagt dabei
       nichts über den Fehler, den sie finden sollte — derselbe Befund wie
       bei den Werkzeug-Zeilen in E211. */
    sollen: (() => { try {
      return (Register.menueband.inReiter('einfuegen') || [])
        .reduce((n: number, g: any) => n + g.eintraege.length, 0);
    } catch { return -1; } })(),
    zuKlein: kn.filter(b => b.getBoundingClientRect().height < 44).length,
    rolltSenkrecht: band.scrollHeight > band.clientHeight + 4,
    rolltWaagerecht: band.scrollWidth > band.clientWidth + 4,
    bandHoch: Math.round(band.getBoundingClientRect().height)
  };
});
p('Aufgeklappt steht jeder Eintrag des Reiters da',
  handyAuf.sollen > 60 && handyAuf.knoepfe === handyAuf.sollen,
  `${handyAuf.knoepfe} gezeichnet, ${handyAuf.sollen} im Register`);
p('Jeder Knopf ist mindestens 44 px hoch', handyAuf.zuKlein === 0, String(handyAuf.zuKlein));
/* Waagerechtes Rollen findet niemand von selbst — deshalb bricht das Band um
   und rollt senkrecht. Das ist der Unterschied zwischen „vierzehn von 67
   sichtbar" und „alle erreichbar". */
p('Es rollt senkrecht und nicht seitwärts',
  handyAuf.rolltSenkrecht && !handyAuf.rolltWaagerecht,
  `senkrecht ${handyAuf.rolltSenkrecht}, waagerecht ${handyAuf.rolltWaagerecht}`);
p('Und nimmt höchstens die halbe Höhe', handyAuf.bandHoch <= 844 / 2,
  `${handyAuf.bandHoch} px`);

/* ==========================================================================
 * AM TELEFON IST DAS OFFENE BAND EIN MENÜ (E240)
 * --------------------------------------------------------------------------
 * Redur hat vier Fotos seines iPhones geschickt: das Band stand offen über
 * Termine, Lernen, Heute und einer offenen Seite — 371 von 844 px,
 * dauerhaft. Der Weg dahin war EIN Reitertipp: er schrieb `bandZu:welt=
 * false`, dieser eine Schlüssel gilt für alle Startansichten und übersteht
 * jedes Neuladen. Zuklappen konnte nur der Pfeil; ein Tipp daneben, ein
 * Bereichswechsel, ein Befehl — nichts davon schloss.
 *
 * Die vier Punkte hier sind die vier Eigenschaften eines Menüs. Jeder
 * wurde einzeln rot gemacht (Gegenproben in E240). */
const anfangZu = await handy.evaluate(() => {
  document.getElementById('menueband')?.classList.add('ist-zu');
  return Math.round(document.getElementById('scroll')?.getBoundingClientRect().top || 0);
});
await klick(handy, '#menueband .mb-reiter-knopf');
await handy.waitForTimeout(350);
const alsMenu = await handy.evaluate(() => ({
  offen: document.getElementById('menueband')?.classList.contains('ist-zu') === false,
  bandHoch: Math.round(document.querySelector('.mb-band')?.getBoundingClientRect().height || 0),
  seiteAb: Math.round(document.getElementById('scroll')?.getBoundingClientRect().top || 0)
}));
p('Offen liegt das Band ÜBER dem Inhalt statt ihn zu verdrängen',
  alsMenu.offen && alsMenu.bandHoch > 100 && alsMenu.seiteAb === anfangZu,
  `Band ${alsMenu.bandHoch} px, Inhalt ab ${alsMenu.seiteAb} (zu: ${anfangZu})`);

/* Ein Tipp daneben schliesst — der Inhalt unter dem Band ist „daneben". */
await handy.mouse.down(); await handy.mouse.up();
await handy.mouse.move(195, 700);
await handy.mouse.down(); await handy.mouse.up();
await handy.waitForTimeout(250);
p('Ein Tipp daneben schliesst es',
  await handy.evaluate(() =>
    document.getElementById('menueband')?.classList.contains('ist-zu') === true));

/* Ein Bereichswechsel unten schliesst — Redurs Fotos: es blieb offen.
   ZWEI WEGE TRAGEN DIESEN PUNKT, und das ist Absicht: der pointerdown-
   Listener (der Tipp auf die Leiste ist „daneben") UND der Beobachter, der
   beim Wechsel Seite→Welt neu zeichnet — am Telefon beginnt jede Zeichnung
   zu. In der Gegenprobe ohne Listener blieb der Punkt deshalb grün; der
   Listener ist durch „Ein Tipp daneben" allein belegt (dort wurde er rot). */
await klick(handy, '#menueband .mb-reiter-knopf');
await handy.waitForTimeout(300);
await klick(handy, '#hl-start');
await handy.waitForTimeout(600);
p('Ein Bereichswechsel unten schliesst es',
  await handy.evaluate(() =>
    document.getElementById('menueband')?.classList.contains('ist-zu') === true));

/* Und der GESPEICHERTE kaputte Zustand echter Geräte muss geheilt sein:
   auf Redurs iPhone stehen beide Merker auf „offen". Das Telefon liest
   sie nicht mehr — die Vorgabe gilt, der Rechner behält seine Wahl. */
const geerbt = await handy.evaluate(async () => {
  Store.setMeta('bandZu', false);
  Store.setMeta('bandZu:welt', false);
  Menueband.zeichne();
  await new Promise(r => setTimeout(r, 250));
  return document.getElementById('menueband')?.classList.contains('ist-zu');
});
p('Ein gemerktes „offen" von früher zählt am Telefon nicht mehr',
  geerbt === true);

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
