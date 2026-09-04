/* Suite 248 — die ruhige Fassung (E219)
 * ============================================================================
 * Redur am 27. August: „nicht gleich wie es machen sondern ruhiger, besser
 * und nicht so viel Bereiche, aber nichts löschen, alles muss enthalten
 * bleiben."
 *
 * Zwei Forderungen, die einander widersprechen, sobald man „weniger Bereiche"
 * als „weniger Funktionen" liest. Diese Suite hält beide gleichzeitig fest —
 * und das ist ihr eigentlicher Zweck: WENIGER SICHTBAR ist leicht zu bauen
 * und leicht zu übertreiben. Der Wächter dagegen ist §3.
 *
 * §1 WENIGER SICHTBAR. Gemessen wird, was ein Mensch bei 1440 × 900
 *    anklicken KANN — Seitenleiste, Kopfzeile, Menüband. Vorher 52 auf dem
 *    Startbild, 67 auf einer offenen Seite (E218).
 *
 * §2 „MEHR" HOLT ALLES ZURÜCK, an dieselbe Stelle. Kein neues Fenster, keine
 *    zweite Liste — sonst wäre es ein zweiter Katalog neben dem Register
 *    (§8), und der läuft still auseinander.
 *
 * §3 NICHTS IST WEG — und dieser Punkt hat zwei Anläufe gebraucht.
 *
 *    Der erste zählte die Knöpfe IM BAUM und verglich die Zahl. Gegenprobe:
 *    `btn-inbox` ein `hidden` verpasst, also den Posteingang dauerhaft
 *    unsichtbar gemacht — die Prüfung blieb GRÜN. Sie mass, ob etwas im
 *    Dokument steht, nicht ob man hinkommt. Ein Knopf, den niemand je zu
 *    sehen bekommt, ist gelöscht; im Baum zu stehen hilft keinem Menschen.
 *
    Der zweite Anlauf verglich NAMEN: was die alte Leiste zeigt, muss bei
 *    offenem „Mehr" wieder dastehen. Auch grün — denn dieselbe Zeile
 *    `display:none` versteckt den Posteingang in BEIDEN Fassungen, und wer
 *    zwei gleich blinde Bilder vergleicht, sieht keinen Unterschied.
 *
 *    Erst der dritte fragt das Register: jeder Eintrag, der dort steht und
 *    sich nicht selbst per `zeigen()` abmeldet, MUSS bei offenem „Mehr"
 *    wirklich zu sehen sein. Das ist die Behauptung, um die es geht — nicht
 *    „zwei Zustände sind gleich", sondern „der Katalog stimmt mit dem
 *    Bildschirm überein".
 *
 * §4 DIE FÜNF SIND DIE RICHTIGEN, und „Elektro" ist dabei — es hatte vorher
 *    gar keine eigene Zeile (E218).
 *
 * §5 DIE FÜNF ZEICHEN AUS DER KOPFZEILE STEHEN IM ⋯-MENÜ. Ein Knopf, der
 *    verschwindet, ohne dass sein Weg woanders auftaucht, ist gelöscht —
 *    egal, wie es im Stilblatt heisst.
 *
 * §6 DER SCHALTER SCHALTET WIRKLICH ZURÜCK. Wer die alte Leiste will, bekommt
 *    sie, und der Wunsch überlebt den Neustart.
 *
 * §8 WO BIN ICH. Wer wenig zeigt, muss das Wenige richtig zeigen. Vor E221
 *    markierte nur eine CSS-Zeile die WELT — ein Klick auf „Bibliothek"
 *    liess „Workspace" aufleuchten. In der ruhigen Fassung steht „Workspace"
 *    gar nicht mehr da, also markierte nichts mehr etwas.
 *
 * §7 §37/§38: Tippflächen und Tastatur. Der Schalter braucht `aria-expanded`,
 *    und die Zeigen-Knöpfe am Baum müssen bei Tastaturfokus sichtbar werden —
 *    sonst wäre ein fokussierbarer Knopf unsichtbar.
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

declare const Store: any;
declare const App: any;
declare const Ruhig: any;

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8968;

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

const seiteAuf = async (breite = 1440, hoehe = 900) => {
  const seite = await browser.newPage({ viewport: { width: breite, height: hoehe } });
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
    document.querySelectorAll('#rg-willkommen,.overlay,[role=dialog]').forEach(x => x.remove());
    /* AUSGANGSLAGE, NICHT ZUFALL (die Lehre aus §1 unten): der erste Start
       legt eine „Karteikarte ist fällig"-Meldung an (E184), und mit
       Ungelesenem ERSCHEINT die Glocke in der Menüleiste — zu Recht, das
       prüft Suite 258. HIER wird aber der ruhige Grundzustand vermessen,
       und der hat keine ungelesene Post. Also wird sie ausdrücklich
       geleert statt gehofft, dass keine kommt. */
    if (typeof (window as any).Werkzeuge !== 'undefined' &&
        (window as any).Werkzeuge.meldungenLeeren) {
      (window as any).Werkzeuge.meldungenLeeren();
    }
  });
  await seite.waitForTimeout(300);
  return { seite, fehler };
};

/* Was ein Mensch anklicken kann. `visibility` zählt mit — ein Knopf mit
   `visibility:hidden` ist weder klickbar noch im Tabulator-Weg, und die
   Zeigen-Knöpfe am Baum werden genau so versteckt. */
const RAHMEN = `
  (() => {
    const sicht = (el) => {
      const k = el.getBoundingClientRect();
      const st = getComputedStyle(el);
      return k.width > 0 && k.height > 0 && k.top < innerHeight && k.bottom > 0
        && st.visibility !== 'hidden' && st.opacity !== '0';
    };
    const z = (w) => [...document.querySelectorAll(w)].filter(sicht).length;
    return {
      zustand: document.body.dataset.ruhig || '(keiner)',
      leiste: z('#sidebar button, #sidebar a, #sidebar [role=button]'),
      kopf:   z('#topbar button, #topbar a'),
      band:   z('#menueband button, #menueband [role=button], #menueband .mb-knopf'),
      /* Die REITER allein, ohne Klapp-Pfeil und ohne Suche/KI/Konto rechts.
         An ihnen hängt seit E236 die Aussage: die Leiste räumt sich auf. */
      reiter: z('#menueband .mb-reiter-knopf'),
      /* Die Namen dazu — eine Zahl allein sagt nicht, ob die RICHTIGEN
         Reiter dastehen (E272). */
      /* OHNE Typangaben: RAHMEN geht als Quelltext in den Browser.
         Was Node beim Laden entfernt, bleibt hier stehen und faellt erst
         dort auf die Nase. */
      reiterNamen: [...document.querySelectorAll('#menueband [data-mb-reiter]')]
        .map(b => b.getAttribute('data-mb-reiter') || ''),
      imBaum: document.querySelectorAll('#sidebar button, #sidebar a, #topbar button').length,
      /* ALLE benannten Wege der Leiste, nicht nur die oberste Gruppe:
         die Navigation, der Fuss und die Gruppen im Baum. Sonst könnte man
         den Papierkorb verstecken und Paragraf 3 bliebe grün.
         (Keine Rückwärtsstriche hier drin: RAHMEN IST ein Template-Literal,
         und ein Rückwärtsstrich im Kommentar beendet es mitten im Satz.) */
      namen:  [...document.querySelectorAll('#sidebar .side-item, #sidebar .side-chat, ' +
                                            '#sidebar [data-app-gruppe]')]
                .filter(sicht)
                .map(e => (e.textContent || '').replace(/Strg[^]*$/, '').trim()
                           .replace(/\s*\d+\s*$/, '').trim())
                .filter(Boolean)
    };
  })()`;

/* ==========================================================================
 * §1 Weniger sichtbar
 * ========================================================================*/
console.log('\n1 · Weniger sichtbar');

/* GEMESSEN AM TELEFON, SEIT E272 PHASE F.
   Diese Suite prüft die RUHIGE FASSUNG DER SEITENLEISTE (E219): höchstens
   zehn sichtbare Wege, „Mehr" holt alles zurück, nichts ist weg. Die
   Seitenleiste ist am Rechner seit Phase F `display:none` — dort trägt die
   54 Pixel schmale Kontextkante die Werkzeuge und der Reiter „Gehen" die
   Navigation.

   AM TELEFON GILT DER VERTRAG UNVERÄNDERT. Die Seitenleiste ist dort die
   Schublade (E38/E236), „Mehr" schaltet weiter, und genau das misst diese
   Suite. Sie zieht deshalb um statt zu verschwinden: eine Prüfung, die
   aufhört zu messen, weil der Ort sich geändert hat, ist eine Prüfung
   weniger — kein gelöstes Problem.

   Was am Rechner GILT, misst test40 (Kante 54 px, Seitenleiste weg) und
   test272 §13/§14. */
const { seite, fehler } = await seiteAuf(390, 844);

/* UND DIE SCHUBLADE MUSS AUF SEIN. Am Telefon steht die Seitenleiste
   ausserhalb des Bildes, bis man sie holt — Playwright weigerte sich zu
   Recht, auf „Mehr" zu klicken („element is outside of the viewport").
   Das ist kein Kunstgriff für den Prüflauf: es ist genau der Griff, den
   `App.arbeitsbereich()` am Telefon nimmt. */
await seite.evaluate(() => {
  try { (globalThis as any).PWA?.schubladeAuf?.(); } catch { /* … */ }
});
await seite.waitForTimeout(500);
const anStart: any = await seite.evaluate(RAHMEN);

p('Von Haus aus ist die ruhige Fassung an', anStart.zustand === 'an', anStart.zustand);
p('Die Seitenleiste zeigt höchstens 10 Dinge (vorher 32)',
  anStart.leiste <= 10, `sind ${anStart.leiste}`);
p('Die Kopfzeile zeigt höchstens 8 (vorher 13)',
  anStart.kopf <= 8, `sind ${anStart.kopf}`);
/* ==========================================================================
 * E219 IST MIT E236 ZURÜCKGENOMMEN — und die zwei Punkte hier mit ihm.
 * --------------------------------------------------------------------------
 * Sie lauteten: „Über einer Startansicht steht kein Menüband" und „zusammen
 * höchstens 18". Der Gedanke dahinter war richtig — sieben anklickbare
 * Dinge, die alle sagen „nicht jetzt" —, die Schlussfolgerung war es nicht.
 * Der Fehler lag nicht an der Leiste, sondern an ihrem INHALT: drei ihrer
 * sechs Reiter (Start, Einfügen, Zeichnen) schreiben IN eine Seite und
 * haben ohne offene Seite nichts zu tun.
 *
 * Das steht seit E236 an einer Stelle im Register (`BRAUCHT_SEITE`), und
 * die Leiste räumt sich selbst auf: aus sechs Reitern werden drei, statt
 * aus einer Leiste keine.
 *
 * ZWEI ZUSTÄNDE, ZWEI MESSUNGEN — und beide ausdrücklich hergestellt.
 * Vorher hing `anStart` davon ab, wohin `letzte` zeigt; seit Redion beim
 * zuletzt geöffneten Dokument aufgeht, war das eine SEITE und nicht die
 * Startansicht, nach der der Punkt benannt war. Eine Prüfung, deren
 * Ausgangslage vom Zufall abhängt, misst irgendwann etwas anderes als
 * ihr Name sagt.
 * ========================================================================*/
p('Die Menüleiste ist überhaupt da (E219 zurückgenommen)',
  anStart.band > 0, `sind ${anStart.band}`);

await seite.evaluate(() => Bibliothek.oeffne());
await seite.waitForTimeout(700);
const imRegal: any = await seite.evaluate(RAHMEN);
/* FUENF SEIT E272, nicht drei — und die Zahl ist gewachsen, weil die App
   mehr kann, nicht weil die Regel weicher wurde. Aus sechs Reitern sind
   acht geworden: „Werkzeuge" ist aufgeloest, „Elektro" kein Reiter mehr,
   dafuer gibt es Gehen, Verlauf, Ueberpruefen und Hilfe.

   Unveraendert ist das, worauf es hier ankommt: die drei Reiter, die IN
   eine Seite schreiben, stehen ohne Seite nicht da (`BRAUCHT_SEITE`). Das
   prueft die Zeile darunter ausdruecklich — an Namen, nicht an einer Zahl,
   damit sie beim naechsten Reiter nicht wieder nur ein Zaehlwerk ist. */
/* AUFTRAG 01 HAT DIESE STELLE GETEILT, und zwar bewusst.
   Bis dahin stand hier eine Zahl über den Grundzustand: „ohne Seite fünf
   Reiter". Seit dem ruhigen Menüband ist der Grundzustand ein anderer —
   bei zugeklapptem Band steht gar kein Reiter da. Die Aussage von E236/E272
   ist damit NICHT hinfällig: sie sagt, WELCHE Reiter dastehen, wenn sie
   dastehen, nicht DASS sie immer dastehen. Also wird sie dort gemessen, wo
   sie gilt — am aufgeklappten Band —, und der neue Grundzustand bekommt
   seine eigene Zusicherung daneben. Der Widerspruch steht im Wortlaut in
   ENTSCHEIDUNGEN.md; still weicher gemacht wurde hier nichts. */
p('In der Ruhe steht über einer Startansicht KEIN Reiter (Auftrag 01)',
  imRegal.reiter === 0, `sind ${imRegal.reiter}`);

/* Und jetzt die alte Aussage, an ihrem Ort: beim aufgeklappten Band. */
const bandAuf = async (): Promise<void> => {
  const zu = await seite.evaluate(() => !!document.querySelector('#menueband.ist-zu'));
  if (zu) { await seite.click('#menueband .mb-klapp'); await seite.waitForTimeout(600); }
};
/* UND WIEDER ZU. Das aufgeklappte Band ist rund 200 px hoch und schiebt
   alles darunter aus dem Bild — `#btn-mehr` in der Leiste war danach nicht
   mehr anklickbar, und §2 lief in einen Zeitablauf. Was hier aufgeklappt
   wird, wird hier auch wieder zugeklappt. */
const bandZu = async (): Promise<void> => {
  const auf = await seite.evaluate(() => !!document.querySelector('#menueband:not(.ist-zu)'));
  if (auf) { await seite.click('#menueband .mb-klapp'); await seite.waitForTimeout(600); }
};
await bandAuf();
const regalOffen: any = await seite.evaluate(RAHMEN);
/* VIER, NICHT MEHR FÜNF (E391). „Gehen" hat das Band verlassen: wohin man
   geht, steht seit E388 in der linken Leiste, und zwei Wege zum selben Ziel
   waren der Befund F02 des Prüfberichts.

   DIE ZAHL IST NICHT WEICHER GEWORDEN, SIE ZÄHLT ETWAS ANDERES. Die Aussage
   von E236/E272 war: „über einer Startansicht stehen nur die Reiter, die
   ohne Seite etwas können". Das waren fünf, weil „Gehen" dazugehörte. Es
   sind jetzt vier — Verlauf, Überprüfen, Ansicht, Hilfe —, und die Zeile
   darunter prüft weiterhin an den NAMEN, dass es die richtigen sind. */
p('Aufgeklappt bleiben über einer Startansicht vier Reiter statt sieben',
  regalOffen.reiter === 4, `sind ${regalOffen.reiter}`);
p('… und es sind Verlauf, Überprüfen, Ansicht, Hilfe',
  JSON.stringify((regalOffen.reiterNamen || []).slice().sort()) ===
  JSON.stringify(['ansicht', 'hilfe', 'ueberpruefen', 'verlauf']),
  (regalOffen.reiterNamen || []).join(', '));
p('„Gehen" ist keiner davon — es steht jetzt links (E391)',
  !(regalOffen.reiterNamen || []).includes('gehen'),
  (regalOffen.reiterNamen || []).join(', '));
p('Und es sind die, die ohne Seite etwas können',
  !(regalOffen.reiterNamen || []).some((n: string) =>
    ['start', 'einfuegen', 'zeichnen'].includes(n)),
  (regalOffen.reiterNamen || []).join(', '));
await bandZu();
p('Und die Leiste ist trotzdem nicht leer — Suche, KI und Konto stehen rechts',
  imRegal.band >= imRegal.reiter + 3,
  `Reiter ${imRegal.reiter}, Leiste gesamt ${imRegal.band}`);
/* 24 STATT 22, und der Grund ist genau zwei Reiter. Die Zahl war nie eine
   Grenze fuer sich, sondern die Antwort auf „52 Dinge auf einem Startbild".
   Zwei zusaetzliche Reiterknoepfe aendern daran nichts — 24 gegen 52 ist
   dieselbe Aussage. Was die Zahl NICHT decken darf, ist ein Zurueckwachsen
   des Bandes: dass dort hoechstens fuenfzehn Befehle stehen, prueft
   test272; dass keiner davon verloren geht, ebenfalls. */
p('Zusammen höchstens 24 statt 52',
  imRegal.leiste + imRegal.kopf + imRegal.band <= 24,
  `sind ${imRegal.leiste + imRegal.kopf + imRegal.band}`);

/* Und die Gegenrichtung, sonst wäre „drei Reiter" auch dann grün, wenn es
   NIE mehr als drei gäbe: über einer offenen Seite sind es sechs. */
await seite.evaluate(() => { const s1 = Store.rootPages()[0]; if (s1) App.oeffne(s1.id); });
await seite.waitForTimeout(900);
const beiOffenerSeite: any = await seite.evaluate(RAHMEN);
p('Auch über einer offenen Seite ist die Ruhe ruhig — kein Reiter',
  beiOffenerSeite.reiter === 0, `sind ${beiOffenerSeite.reiter}`);
/* Auch hier gilt seit Auftrag 01: erst aufklappen, dann zählen. Die
   Gegenrichtung ist der eigentliche Zweck dieser Zeile — ohne sie wäre
   „fünf" auch dann grün, wenn es NIE mehr als fünf gäbe. */
await bandAuf();
const seiteOffenBand: any = await seite.evaluate(RAHMEN);
/* SIEBEN STATT ACHT, aus demselben Grund (E391): „Gehen" ist weg. Die
   Gegenrichtung bleibt der eigentliche Zweck dieser Zeile — ohne sie wäre
   „vier" auch dann grün, wenn es NIE mehr als vier gäbe. */
p('Über einer offenen Seite sind es aufgeklappt wieder sieben',
  seiteOffenBand.reiter === 7, `sind ${seiteOffenBand.reiter}`);
await bandZu();

/* ==========================================================================
 * §2 „Mehr" holt alles zurück
 * ========================================================================*/
console.log('\n2 · „Mehr" holt alles zurück');

/* DIE SCHUBLADE NOCH EINMAL. `App.oeffne()` eine Handvoll Zeilen weiter
   oben schliesst sie — genau wie beim Menschen, der eine Seite antippt.
   Ohne das steht „Mehr" ausserhalb des Bildes, und Playwright weigert
   sich zu klicken, statt an einer unsichtbaren Stelle zu tippen. */
const schubladeAuf = async () => {
  await seite.evaluate(() => {
    try { (globalThis as any).PWA?.schubladeAuf?.(); } catch { /* ohne PWA bleibt es zu */ }
  });
  await seite.waitForTimeout(400);
};
await schubladeAuf();

await seite.click('#btn-mehr');
await seite.waitForTimeout(400);
const offen: any = await seite.evaluate(RAHMEN);

p('Der Zustand heisst jetzt „offen"', offen.zustand === 'offen', offen.zustand);
/* ZEHN MEHR, NICHT ELF. Am Telefon blendet `bausteine.css` die Kopfzeile
   der Schublade und ihre eigene Reiterleiste aus, und die ruhige Fassung
   beginnt dort bei sieben statt zehn. Gemessen: 7 -> 17. Die Aussage
   bleibt dieselbe — „Mehr" holt mehr als das Doppelte —, nur die Schwelle
   war eine Rechner-Schwelle. */
p('Und die Leiste zeigt deutlich mehr', offen.leiste >= anStart.leiste + 10,
  `${anStart.leiste} → ${offen.leiste}`);
p('Ohne ein zweites Fenster aufzumachen',
  await seite.evaluate(() => !document.querySelector('.overlay,[role=dialog],#sl-mehr-panel')));
p('Der Schalter heisst dann „Weniger"',
  (await seite.textContent('#btn-mehr'))?.includes('Weniger'),
  await seite.textContent('#btn-mehr') ?? '');

await schubladeAuf();
await seite.click('#btn-mehr');
await seite.waitForTimeout(400);
const wiederZu: any = await seite.evaluate(RAHMEN);
p('Und wieder zu ergibt genau dieselbe Zahl wie vorher',
  wiederZu.leiste === anStart.leiste, `${anStart.leiste} → ${wiederZu.leiste}`);

/* ==========================================================================
 * §3 NICHTS IST WEG — der Wächter
 * ========================================================================*/
console.log('\n3 · Nichts ist weg');

await seite.evaluate(() => Ruhig.setzen(false));
await seite.waitForTimeout(400);
const aus: any = await seite.evaluate(RAHMEN);

/* DER WÄCHTER. Nicht zwei Zustände vergleichen, sondern Register gegen
   Bildschirm: was im Katalog steht, muss man sehen können. */
await seite.evaluate(() => { Ruhig.setzen(true); if (!Ruhig.offen()) Ruhig.schalten(); });
await seite.waitForTimeout(400);
const erreichbar: any = await seite.evaluate(() => {
  const sicht = (el: any) => {
    const k = el.getBoundingClientRect();
    const st = getComputedStyle(el);
    return k.width > 0 && k.height > 0 && st.visibility !== 'hidden' && st.opacity !== '0';
  };
  const reg = (window as any).Register?.navigation?.alle?.() || [];
  const fehlt: string[] = [];
  let geprueft = 0;
  for (const e of reg) {
    if (!e.knopfId) continue;                       // nur die mit Knopf im Markup
    if (typeof e.zeigen === 'function' && !e.zeigen()) continue;  // meldet sich selbst ab
    geprueft++;
    const k = document.getElementById(e.knopfId);
    if (!k || !sicht(k)) fehlt.push(e.name + ' (' + e.knopfId + ')');
  }
  return { geprueft, fehlt };
});
p('Jeder Registereintrag mit Knopf ist bei offenem „Mehr" wirklich zu sehen',
  erreichbar.fehlt.length === 0,
  erreichbar.fehlt.length ? 'unsichtbar: ' + erreichbar.fehlt.join(' | ') : '');
p('Und es sind mindestens zehn, die so geprüft wurden',
  erreichbar.geprueft >= 10, `sind ${erreichbar.geprueft}`);
await seite.evaluate(() => { if (Ruhig.offen()) Ruhig.schalten(); Ruhig.setzen(false); });
await seite.waitForTimeout(300);
p('Im Baum stehen in JEDEM Zustand gleich viele Knöpfe',
  anStart.imBaum === offen.imBaum && offen.imBaum === aus.imBaum,
  `an ${anStart.imBaum}, offen ${offen.imBaum}, aus ${aus.imBaum}`);
/* VIERUNDZWANZIG STATT DREISSIG, gemessen und nicht geraten: am Telefon
   blendet `bausteine.css` `.side-top` und `#side-reiter` in der Schublade
   aus, weil den Arbeitsbereich dort der Kreis links oben öffnet.
   Ausgeschaltet gemessen: 25.

   DIE KOPFZEILE STEHT HIER NICHT MEHR. Am Telefon trägt sie seit E236
   drei Knöpfe und nicht dreizehn — die übrigen sind im ⋯-Menü und in der
   unteren Fünferleiste. „Zwölf oder mehr" war eine Rechner-Zahl und wird
   in §5 am Rechner gemessen, wo sie hingehört. */
p('Ausgeschaltet ist die Leiste wieder so voll wie früher',
  aus.leiste >= 24, `sind ${aus.leiste}`);

/* ==========================================================================
 * §4 Die fünf sind die richtigen
 * ========================================================================*/
console.log('\n4 · Die fünf Wege');

await seite.evaluate(() => Ruhig.setzen(true));
await seite.waitForTimeout(400);
const fuenf: any = await seite.evaluate(RAHMEN);
/* „Elektrotechnik", nicht „Elektro" (Audit F16). Der Fachbereich hiess in
   der Seitenleiste „Elektro" und überall sonst „Elektrotechnik" — zwei
   Namen für ein Ziel, und der Nutzer vermutet zwei Ziele. Seit dem
   3. September heisst er überall gleich; der alte Name bleibt in
   `schale.ts` als Alias, damit gemerkte Schauplätze nicht ins Leere zeigen. */
const SOLL = ['Heute', 'Lernzentrum', 'Elektrotechnik', 'Bibliothek', 'Aufgaben'];

for (const name of SOLL) {
  p(`„${name}" steht in der Leiste`, fuenf.namen.includes(name), fuenf.namen.join(' | '));
}
p('Und sonst nur noch „Mehr"',
  fuenf.namen.filter((n: string) => !SOLL.includes(n) && n !== 'Mehr').length === 0,
  fuenf.namen.filter((n: string) => !SOLL.includes(n) && n !== 'Mehr').join(' | '));

/* „Elektro" war vorher gar kein Eintrag — es ist eines der 14 Module.
   ZWEI STUFEN, und die zweite ist die, auf die es ankommt: dass die
   Handlung eine Funktion IST, sagt nichts darüber, ob sie etwas tut.
   Genau daran wäre der Knopf vorbeigekommen — beim Durchklicken aller
   fünf Wege sah es aus, als führe er ins Leere (er öffnet einen Dialog,
   und der Rundgang hatte Dialoge vorher weggeräumt). */
const elektroWirkt = await seite.evaluate(() => {
  const e = document.getElementById('btn-elektro');
  if (!e) return 'kein Knopf';
  const reg = (window as any).Register?.navigation?.alle?.()
    ?.find((x: any) => x.knopfId === 'btn-elektro');
  return reg ? (typeof reg.tun === 'function' ? 'ok' : 'ohne Handlung') : 'nicht im Register';
});
p('„Elektro" hängt am Register und hat eine Handlung', elektroWirkt === 'ok', elektroWirkt);

const vorKlick = await seite.evaluate(() => ({
  krume: (document.getElementById('crumb')?.textContent || '').trim(),
  overlays: document.querySelectorAll('.overlay,[role=dialog]').length,
  seite: (document.getElementById('page')?.textContent || '').slice(0, 120)
}));
await seite.click('#btn-elektro');
await seite.waitForTimeout(1200);
const nachKlick = await seite.evaluate(() => ({
  krume: (document.getElementById('crumb')?.textContent || '').trim(),
  overlays: document.querySelectorAll('.overlay,[role=dialog]').length,
  seite: (document.getElementById('page')?.textContent || '').slice(0, 120)
}));
const passiert = nachKlick.krume !== vorKlick.krume
  || nachKlick.overlays > vorKlick.overlays
  || nachKlick.seite !== vorKlick.seite;
p('Und der Klick bewirkt wirklich etwas — nicht nur „ist eine Funktion"',
  passiert,
  `Krume ${vorKlick.krume} → ${nachKlick.krume}, Überlagerungen ` +
  `${vorKlick.overlays} → ${nachKlick.overlays}`);
await seite.evaluate(() => document.querySelectorAll('.overlay,[role=dialog]').forEach(x => x.remove()));
await seite.waitForTimeout(300);

/* ==========================================================================
 * §5 Die fünf Zeichen aus der Kopfzeile stehen im ⋯-Menü
 * ========================================================================*/
console.log('\n5 · Was aus der Kopfzeile ging, steht im Menü');

/* AB HIER WIEDER AM RECHNER. Die Kopfzeile und die Randleiste sind ein
   Rechner-Vertrag: am Telefon trägt `#topbar` drei Knöpfe, und `#rand-toc`
   steht dort gar nicht erst. Die Paragrafen 1 bis 4 messen die Schublade,
   und die gibt es nur am Telefon; dieser hier misst die Kopfzeile, und die
   ist am Telefon eine andere. Zwei Verträge, zwei Breiten. */
await seite.setViewportSize({ width: 1440, height: 900 });
await seite.waitForTimeout(600);
await seite.evaluate(() => {
  try { (globalThis as any).PWA?.schubladeZu?.(); } catch { /* … */ }
});
await seite.waitForTimeout(300);

await seite.evaluate(() => {
  const St = Store;
  const s = Object.values(St.cache.blocks).find((b: any) => b?.type === 'page' && b.alive) as any;
  if (s) App.oeffne(s.id);
});
await seite.waitForTimeout(900);
/* DIE RANDLEISTE DARF NICHT ÜBER DER KOPFZEILE LIEGEN (E257). Zweimal
   fing sie im vollen Lauf genau diesen Klick ab: `--inhalt-oben` mass
   nur die Menüleiste, und bei genug Überschriften wuchs das
   Inhaltsverzeichnis bis über die Seitenknöpfe. Gemessen wird VOR dem
   Klick — ein Klick, der zufällig durchgeht, ist kein Beweis. */
const rand = await seite.evaluate(() => {
  const r = document.getElementById('rand-toc')?.getBoundingClientRect();
  const k = document.getElementById('topbar')?.getBoundingClientRect();
  return { randOben: r ? Math.round(r.top) : null, kopfUnten: k ? Math.round(k.bottom) : 0 };
});
p('Die Randleiste beginnt unter der Kopfzeile',
  rand.randOben === null || rand.randOben >= rand.kopfUnten, JSON.stringify(rand));
await seite.click('#btn-page-menu');
await seite.waitForTimeout(500);
const imMenue: string = await seite.evaluate(() =>
  [...document.querySelectorAll('.menu button, .ui-menu button, [role=menu] button')]
    .map(b => (b.textContent || '').trim()).join(' | '));
for (const was of ['Teilen', 'Versionsverlauf', 'Kommentare', 'Automationen', 'Link kopieren']) {
  p(`„${was}" ist im Menü erreichbar`, imMenue.includes(was), imMenue.slice(0, 160));
}
await seite.keyboard.press('Escape');
await seite.waitForTimeout(300);

/* Auf einer OFFENEN Seite kommt das Band zurück — sonst wäre es gelöscht. */
const aufSeite: any = await seite.evaluate(RAHMEN);
p('Auf einer offenen Seite ist das Menüband wieder da',
  aufSeite.band > 0, `sind ${aufSeite.band}`);

/* ==========================================================================
 * §6 Der Schalter überlebt den Neustart
 * ========================================================================*/
console.log('\n6 · Der Wunsch überlebt den Neustart');

await seite.evaluate(() => Ruhig.setzen(false));
await seite.waitForTimeout(300);
await seite.reload();
await seite.waitForTimeout(2800);
const nachNeustart: any = await seite.evaluate(RAHMEN);
p('Ausgeschaltet bleibt ausgeschaltet', nachNeustart.zustand === 'aus', nachNeustart.zustand);
await seite.evaluate(() => Ruhig.setzen(true));
await seite.waitForTimeout(300);
await seite.reload();
await seite.waitForTimeout(2800);
const nachNeustart2: any = await seite.evaluate(RAHMEN);
p('Und eingeschaltet eingeschaltet', nachNeustart2.zustand === 'an', nachNeustart2.zustand);

/* ==========================================================================
 * §7 Tippflächen und Tastatur
 * ========================================================================*/
console.log('\n7 · Tippflächen und Tastatur');

/* UND WIEDER ANS TELEFON. Tippflächen sind eine Fingerfrage (§37), und
   der Schalter „Mehr", um den es hier geht, steht am Rechner seit E272
   Phase F nicht mehr im Bild. */
await seite.setViewportSize({ width: 390, height: 844 });
await seite.waitForTimeout(600);
await seite.evaluate(() => {
  document.querySelectorAll('#rg-willkommen,.overlay,[role=dialog]').forEach(x => x.remove());
});
await schubladeAuf();
const zugang: any = await seite.evaluate(() => {
  const m = document.getElementById('btn-mehr');
  return {
    ariaVor: m?.getAttribute('aria-expanded'),
    hoehe: Math.round(m?.getBoundingClientRect().height ?? 0)
  };
});
p('Der Schalter sagt, ob er offen ist', zugang.ariaVor === 'false', String(zugang.ariaVor));
await seite.click('#btn-mehr');
await seite.waitForTimeout(300);
p('Und nach dem Klick sagt er es auch',
  await seite.evaluate(() => document.getElementById('btn-mehr')?.getAttribute('aria-expanded') === 'true'));
await schubladeAuf();
await seite.click('#btn-mehr');
await seite.waitForTimeout(300);

/* Die Zeigen-Knöpfe: mit der Maus versteckt, bei Tastaturfokus sichtbar.
   Ein fokussierbarer Knopf, den man nicht sieht, ist der Fehler, den §38
   meint — deshalb steht `:focus-within` im Stilblatt, und deshalb wird es
   hier geprüft und nicht bloss behauptet. */
const fokus: any = await seite.evaluate(() => {
  const b = document.querySelector('#tree .side-section > button') as HTMLElement | null;
  if (!b) return { gefunden: false };
  const vorher = getComputedStyle(b).opacity;
  b.focus();
  const nachher = getComputedStyle(b).opacity;
  b.blur();
  return { gefunden: true, vorher, nachher };
});
p('Ein Zeigen-Knopf am Baum steht nicht dauernd da',
  fokus.gefunden && fokus.vorher === '0', `Deckkraft ${fokus.vorher}`);
p('Wird aber sichtbar, sobald die Tastatur ihn erreicht',
  fokus.gefunden && fokus.nachher === '1', `Deckkraft ${fokus.nachher}`);

/* ==========================================================================
 * §8 Wo bin ich
 * ========================================================================*/
console.log('\n8 · Wo bin ich');

await seite.evaluate(() => Ruhig.setzen(true));
await seite.waitForTimeout(300);
const markiert = async (): Promise<string[]> => seite.evaluate(() => {
  const gemalt = (el: Element): boolean => {
    const st = getComputedStyle(el);
    return st.backgroundColor !== 'rgba(0, 0, 0, 0)' && st.backgroundColor !== 'transparent';
  };
  return [...document.querySelectorAll('#sidebar .side-item')]
    .filter(e => e.id && gemalt(e)).map(e => e.id);
});

const beimStart = await markiert();
p('Beim Start ist genau ein Weg markiert', beimStart.length === 1, beimStart.join(' | '));

for (const [id, name] of [['btn-library', 'Bibliothek'], ['btn-tasks', 'Aufgaben'],
                          ['btn-home', 'Heute']] as Array<[string, string]>) {
  await seite.evaluate(k => (document.getElementById(k) as HTMLElement)?.click(), id);
  await seite.waitForTimeout(1300);
  await seite.evaluate(() => document.querySelectorAll('.overlay,[role=dialog]').forEach(x => x.remove()));
  const jetzt = await markiert();
  p(`Nach „${name}" ist GENAU DIESER Weg markiert — und nur er`,
    jetzt.length === 1 && jetzt[0] === id, jetzt.join(' | ') || '(nichts)');
}

/* Und für das Ohr, nicht nur für das Auge (§38). */
const fuersOhr = await seite.evaluate(() =>
  document.getElementById('btn-home')?.getAttribute('aria-current'));
p('Der aktive Weg sagt es auch dem Vorleseprogramm', fuersOhr === 'page', String(fuersOhr));

console.log('\nFehler auf der Seite:', fehler.length ? fehler.join(' | ') : 'keine');
p('Keine Fehler auf der Seite', !fehler.length, fehler.join(' | '));

console.log(`\n${ok} bestanden, ${weg} gescheitert`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
