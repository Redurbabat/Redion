/* Suite 209 — Redions eigenes Formelbuch: Seiten, Skizzen, Tiefstellung (E194)
 * ============================================================================
 * Redur wollte kein PDF im Programm, sondern ein Buch, das Redion selbst
 * schreibt — eigene Gestaltung, eigene Skizzen —, aber mit DENSELBEN
 * SEITENZAHLEN wie sein gedrucktes Heft. Wer beides nebeneinander liegen
 * hat, blättert in beiden auf 14 und findet beide Male die
 * Wechselstromwiderstände.
 *
 * Dieser Lauf prüft, dass das wirklich so ist — und zwar an vier Stellen,
 * an denen es schon einmal nicht so war:
 *
 * §1 JEDE FORMEL STEHT AUF EINER SEITE. Der Abschnitt ist Pflichtfeld am
 *    Formeleintrag; zeigt er ins Leere, hat die Formel keine Seite und
 *    taucht im Buch nirgends auf. Das fiele sonst niemandem auf, denn in
 *    der Kapitelansicht steht sie ja da.
 *
 * §2 DAS LEERZEICHEN, DAS FLEXBOX FRISST. `Q_L = I_L · t_L` wird zu
 *    `Q<sub>L</sub> = …`, und das `<sub>` ist ein ELEMENT. Stand an der
 *    Formelzeile `display:flex` — wie es am Telefon einmal stand, um sie auf
 *    44 px zu bringen —, dann wurden aus Text und Auszeichnung lauter
 *    Flex-Elemente, und Flexbox lässt die Leerzeichen dazwischen
 *    verschwinden. Auf dem Bildschirm stand `Q_L= I_L· t_L`.
 *
 *    UND DAS IST DER PUNKT: `textContent` hat die Leerzeichen weiterhin.
 *    Jede Prüfung, die den TEXT liest, sagt „passt schon". Sichtbar ist es
 *    nur im Bild — oder eben hier, indem der Lauf die Anzeigeart misst und
 *    die tatsächliche Breite gegen die Breite ohne Zwischenräume hält.
 *    Derselbe Mechanismus wie bei der gestauchten Tabellenzelle (§55.2).
 *
 * §3 EINE SKIZZE, DIE AUS DEM BLATT LÄUFT. Die Schaltbilder entstehen aus
 *    echten Plänen; ein Bauteil an der Blattkante wird halb abgeschnitten.
 *    Beim ersten Durchgang traf das fünf von sechsunddreissig Skizzen, und
 *    keine Prüfung hätte es gemerkt — sie waren ja alle da.
 *
 * §4 EINE LEITUNG, DIE AUF SICH SELBST ZEIGT. Bei den Motorzuleitungen stand
 *    `draht(m,'U1', m,'U1', …)`: eine Leitung von einem Anschluss zu
 *    DEMSELBEN Anschluss. Sie lief hin und wieder zurück und sah im Bild wie
 *    eine Diagonale quer durch den Motor aus.
 *
 *   node pruefungen/lauf/test244.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

declare const Store: any; declare const Register: any;
declare const Formelheft: any; declare const Elektroskizzen: any;

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8964;

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

const browser = await chromium.launch();
const seite = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 140)));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForTimeout(2400);
await seite.evaluate(() => { Store.setMeta('rundgangGesehen', true);
                             Store.setMeta('neuerungenGesehen', 99);
                             Store.setMeta('kartenGemeldet', new Date().toISOString().slice(0, 10)); });
await seite.reload();
await seite.waitForTimeout(2400);
await seite.evaluate(() =>
  document.querySelectorAll('#rg-willkommen, .overlay').forEach(x => x.remove()));

/* ==========================================================================
 * §1 · Die Abschnitte und ihre Seitenzahlen
 * ========================================================================*/
console.log('\n1 · Abschnitte und Seitenzahlen');

const bau = await seite.evaluate(() => {
  const R = Register.elektroformeln;
  const abschnitte = R.abschnitte() as any[];
  const alle = R.alle() as any[];
  const ids = new Set(abschnitte.map(a => a.id));
  return {
    abschnitte: abschnitte.length,
    formeln: alle.length,
    letzteSeite: R.letzteSeite(),
    seiten: R.seitenMitInhalt() as number[],
    /* Eine Formel, deren Abschnitt es nicht gibt, steht im Buch nirgends. */
    verwaist: alle.filter(f => !ids.has(f.abschnitt)).map(f => f.id),
    /* Ein Abschnitt ohne Formeln ist eine Überschrift über nichts. */
    leer: abschnitte.filter(a => !alle.some(f => f.abschnitt === a.id)).map(a => a.id),
    ohneTitel: abschnitte.filter(a => !a.titel).map(a => a.id),
    /* Die Seitenzahl muss im Buch liegen und ganzzahlig sein. */
    schiefeSeite: abschnitte
      .filter(a => !Number.isInteger(a.seite) || a.seite < 1 || a.seite > R.letzteSeite())
      .map(a => `${a.id}:${a.seite}`),
    /* Das Buchkapitel muss es geben. */
    unbekanntesKapitel: abschnitte
      .filter(a => !R.buchkapitelName(a.buch))
      .map(a => `${a.id}:${a.buch}`),
    /* Abschnitte derselben Seite müssen beieinander stehen — sonst
       springt die Seite zwischen zwei Kapiteln hin und her. */
    zerrissen: (() => {
      const gesehen: number[] = [];
      const schlecht: number[] = [];
      abschnitte.forEach(a => {
        if (gesehen.length && gesehen[gesehen.length - 1] === a.seite) return;
        if (gesehen.includes(a.seite)) schlecht.push(a.seite);
        gesehen.push(a.seite);
      });
      return schlecht;
    })()
  };
});
p('Es gibt Abschnitte', bau.abschnitte >= 50, `${bau.abschnitte}`);
p('Jede Formel steht in einem Abschnitt, den es gibt',
  !bau.verwaist.length, bau.verwaist.slice(0, 4).join(', '));
p('Kein Abschnitt ohne Formel', !bau.leer.length, bau.leer.slice(0, 4).join(', '));
p('Jeder Abschnitt hat eine Überschrift', !bau.ohneTitel.length, bau.ohneTitel.join(', '));
p('Jede Seitenzahl liegt im Buch', !bau.schiefeSeite.length, bau.schiefeSeite.join(', '));
p('Jedes Buchkapitel ist benannt',
  !bau.unbekanntesKapitel.length, bau.unbekanntesKapitel.join(', '));
p('Eine Seite steht am Stück', !bau.zerrissen.length, bau.zerrissen.join(', '));
p('Das Buch hat 36 Seiten', bau.letzteSeite === 36, `${bau.letzteSeite}`);
p('… und auf etlichen steht etwas', bau.seiten.length >= 15, `${bau.seiten.length}`);

/* Die Seitenzahlen sind der ganze Zweck: sie müssen mit dem gedruckten Heft
   übereinstimmen. Drei Stichproben aus dem Inhaltsverzeichnis. */
const stichprobe = await seite.evaluate(() => {
  const R = Register.elektroformeln;
  const kapitelAuf = (n: number) =>
    [...new Set((R.aufSeite(n) as any[]).map(t => t.abschnitt.buch))].sort((a, b) => a - b);
  return {
    s4: kapitelAuf(4), s11: kapitelAuf(11), s14: kapitelAuf(14),
    s18: kapitelAuf(18), s22: kapitelAuf(22),
    ohm: R.seiteVon('ohm'),
    trafo: R.seiteVon('trafo-uebersetzung'),
    akku: R.seiteVon('akku-ladekapazitaet'),
    resonanz: R.seiteVon('resonanzfrequenz')
  };
});
p('Seite 4 ist Kapitel 2, Grundlagen', JSON.stringify(stichprobe.s4) === '[2]',
  JSON.stringify(stichprobe.s4));
p('Seite 11 ist Kapitel 7, Batterien', JSON.stringify(stichprobe.s11) === '[7]',
  JSON.stringify(stichprobe.s11));
p('Seite 14 ist Kapitel 11, Wechselstromwiderstände',
  JSON.stringify(stichprobe.s14) === '[11]', JSON.stringify(stichprobe.s14));
p('Seite 18 ist Kapitel 13, Transformatoren',
  JSON.stringify(stichprobe.s18) === '[13]', JSON.stringify(stichprobe.s18));
p('Seite 22 ist Kapitel 17, Beleuchtung',
  JSON.stringify(stichprobe.s22) === '[17]', JSON.stringify(stichprobe.s22));
p('Das ohmsche Gesetz steht auf Seite 4', stichprobe.ohm === 4, `${stichprobe.ohm}`);
p('Die Übersetzung steht auf Seite 18', stichprobe.trafo === 18, `${stichprobe.trafo}`);
p('Die Ladekapazität steht auf Seite 11', stichprobe.akku === 11, `${stichprobe.akku}`);
p('Die Resonanz steht auf Seite 15', stichprobe.resonanz === 15, `${stichprobe.resonanz}`);

/* ==========================================================================
 * §2 · Das Fenster blättert
 * ========================================================================*/
console.log('\n2 · Blättern');

await seite.evaluate(() => {
  Store.setMeta('elektro:heftAnsicht', 'buch');
  Store.setMeta('elektro:heftSeite', 11);
  Store.setMeta('elektro:heftOrt', { x: 60, y: 40, w: 700, h: 900 });
  Formelheft.oeffne();
});
await seite.waitForTimeout(900);

p('Das Heft steht offen', await seite.locator('.fh-fenster').count() === 1);
p('Der Buchknopf ist an', await seite.locator('.fh-kopfknoepfe [data-a="buch"].an').count() === 1);
p('Eine Buchseite steht da', await seite.locator('.bs-blatt').count() === 1);
p('… und es ist Seite 11',
  (await seite.locator('.bs-blatt').getAttribute('data-seite')) === '11');
p('Der Kopf nennt Kapitel und Seitenzahl',
  /7 · Chemische/.test(await seite.locator('.bs-kapitel').innerText()) &&
  /Seite 11/.test(await seite.locator('.bs-seitenzahl').innerText()));

const abschnitteDa = await seite.locator('.bs-abschnitt').count();
p('Die Abschnitte der Seite stehen da', abschnitteDa === 4, `${abschnitteDa}`);

await seite.click('[data-a="vorSeite"]');
await seite.waitForTimeout(500);
p('Vorwärts blättern geht auf 12',
  (await seite.locator('.bs-blatt').getAttribute('data-seite')) === '12');
await seite.click('[data-a="zurueckSeite"]');
await seite.waitForTimeout(500);
p('Und zurück auf 11',
  (await seite.locator('.bs-blatt').getAttribute('data-seite')) === '11');

await seite.locator('.bs-nr').fill('22');
await seite.waitForTimeout(600);
p('Eine Seitenzahl eintippen blättert hin',
  (await seite.locator('.bs-blatt').getAttribute('data-seite')) === '22');

/* Eine Seite, die es im Heft gibt, in Redion aber noch nicht, sagt das —
   statt leer zu bleiben und wie ein Fehler auszusehen. */
await seite.locator('.bs-nr').fill('2');
await seite.waitForTimeout(600);
p('Eine noch nicht geschriebene Seite sagt es',
  await seite.locator('.bs-leer').count() === 1);
p('… und nennt, welche geschrieben sind',
  /Geschrieben sind/.test(await seite.locator('.bs-leer').innerText()));

/* Die Doppelpfeile springen zur nächsten Seite MIT Inhalt. */
await seite.click('[data-a="naechsteVoll"]');
await seite.waitForTimeout(600);
const nachSprung = await seite.locator('.bs-blatt').getAttribute('data-seite');
p('Der Doppelpfeil springt zur nächsten geschriebenen Seite', nachSprung === '4', `${nachSprung}`);

/* Am Rand stehenbleiben statt umspringen. */
await seite.locator('.bs-nr').fill('1');
await seite.waitForTimeout(500);
p('Auf Seite 1 ist der Zurück-Knopf gesperrt',
  await seite.locator('[data-a="zurueckSeite"]').isDisabled());
await seite.locator('.bs-nr').fill('36');
await seite.waitForTimeout(500);
p('Auf der letzten Seite ist der Vor-Knopf gesperrt',
  await seite.locator('[data-a="vorSeite"]').isDisabled());

/* ==========================================================================
 * §3 · Die Tiefstellung — und das Leerzeichen, das Flexbox frisst
 * ========================================================================*/
console.log('\n3 · Tiefstellung');

await seite.locator('.bs-nr').fill('11');
await seite.waitForTimeout(700);

const tief = await seite.evaluate(() => {
  const erste = document.querySelector('.bs-formel') as HTMLElement;
  const alle = [...document.querySelectorAll('.bs-formel')] as HTMLElement[];
  return {
    html: erste.innerHTML,
    text: erste.textContent,
    /* Wie viele Formeln überhaupt eine Tiefstellung tragen. */
    mitSub: alle.filter(x => x.querySelector('sub')).length,
    gesamt: alle.length,
    /* Kein Unterstrich darf STEHENBLEIBEN, wo eine Tiefstellung hingehört. */
    nochUnterstrich: alle.filter(x => /_[A-Za-z0-9]/.test(x.textContent || ''))
      .map(x => x.textContent),
    /* Und die Grössenliste genauso. */
    legendeSub: document.querySelectorAll('.bs-groessen sub').length
  };
});
p('Die Formel trägt echte Tiefstellungen', tief.mitSub > 0, `${tief.mitSub}/${tief.gesamt}`);
p('Kein Unterstrich bleibt stehen',
  !tief.nochUnterstrich.length, tief.nochUnterstrich.slice(0, 3).join(' | '));
p('Auch die Legende ist tiefgestellt', tief.legendeSub > 0, `${tief.legendeSub}`);
p('Der Text behält seine Leerzeichen',
  / = /.test(tief.text || '') && / · /.test(tief.text || ''), `${tief.text}`);

/* DER EIGENTLICHE WÄCHTER (§55.2).
 *
 * Der Text hat die Leerzeichen IMMER — auch dann, wenn der Bildschirm sie
 * nicht zeigt. Gemessen wird deshalb die BREITE: dieselbe Formel ohne die
 * Zwischenräume ist messbar schmaler. Ist die gezeichnete Breite so klein
 * wie die ohne Zwischenräume, sind sie verschwunden.
 *
 * Und weil eine Prüfung, die nicht rot werden kann, keine Prüfung ist, wird
 * der Fehler hier absichtlich hergestellt und nachgemessen. */
const messung = await seite.evaluate(() => {
  const el = document.querySelector('.bs-formel') as HTMLElement;
  const messe = (): number => Math.round(el.getBoundingClientRect().width);
  const alt = el.style.display;

  const echt = messe();
  const anzeige = getComputedStyle(el).display;

  /* Zum Vergleich: dieselbe Zeile mit `display:flex` — so, wie sie einmal
     stand. Flexbox macht aus Text und `<sub>` lauter Flex-Elemente und
     lässt die Leerzeichen dazwischen wegfallen. */
  el.style.display = 'flex';
  el.style.alignItems = 'center';
  const gestaucht = messe();
  el.style.display = alt;
  el.style.alignItems = '';

  return { echt, gestaucht, anzeige, zurueck: messe() };
});
p('Die Formelzeile ist kein Flex-Kasten', messung.anzeige !== 'flex', messung.anzeige);
p('Mit Flexbox WÄRE sie schmaler — die Messung kann also rot werden',
  messung.gestaucht < messung.echt - 3,
  `echt ${messung.echt}, mit flex ${messung.gestaucht}`);
p('Und sie ist wieder so breit wie vorher', messung.zurueck === messung.echt,
  `${messung.zurueck} statt ${messung.echt}`);

/* ==========================================================================
 * §4 · Die Skizzen
 * ========================================================================*/
console.log('\n4 · Selbst gezeichnete Skizzen');

const skizzen = await seite.evaluate(() => {
  const namen = Elektroskizzen.alle() as string[];
  const R = Register.elektroformeln;
  const ids = new Set((R.abschnitte() as any[]).map(a => a.id));
  const leer: string[] = [];
  const raus: Array<{ id: string; grund: string }> = [];
  const selbstschleife: string[] = [];

  namen.forEach(n => {
    const s = Elektroskizzen.zu(n) as string;
    if (!s) { leer.push(n); return; }

    /* In ein unsichtbares Feld hängen und WIRKLICH messen — geraten wäre
       hier so gut wie gar nicht geprüft. */
    const kasten = document.createElement('div');
    kasten.style.cssText = 'position:fixed;left:-4000px;top:0;width:600px';
    kasten.innerHTML = s;
    document.body.appendChild(kasten);
    const svg = kasten.querySelector('svg') as SVGSVGElement | null;
    if (!svg) { raus.push({ id: n, grund: 'kein svg' }); kasten.remove(); return; }
    /* Über die SVG-eigene Schnittstelle statt über einen Regex: `viewBox`
       ist ein Wert und keine Zeichenkette, und ein Regex darauf war hier
       schon einmal falsch geschrieben — er lieferte 0×0 und machte die
       Prüfung damit unbrauchbar streng statt unbrauchbar milde. */
    const breite = svg.viewBox.baseVal.width;
    const hoehe = svg.viewBox.baseVal.height;
    /* Der wirkliche Platzbedarf allen Inhalts, im Zeichenraum. */
    const kiste = (svg as any).getBBox ? (svg as any).getBBox() : null;
    /* Zwei Punkte Nachsicht: eine Strichstärke von 2 wird um ihre Hälfte
       über die Mittellinie hinaus gezeichnet, und eine Beschriftung mit
       Unterlänge misst ein wenig mehr, als sie sichtbar braucht. Mehr als
       zwei Punkte ist ein abgeschnittenes Bauteil. */
    if (kiste && (kiste.x < -2 || kiste.y < -2 ||
                  kiste.x + kiste.width > breite + 2 ||
                  kiste.y + kiste.height > hoehe + 2)) {
      raus.push({ id: n, grund:
        `${Math.round(kiste.x)},${Math.round(kiste.y)} ` +
        `${Math.round(kiste.width)}×${Math.round(kiste.height)} in ${breite}×${hoehe}` });
    }
    kasten.remove();
  });
  return {
    namen, anzahl: namen.length, leer, raus, selbstschleife,
    /* Jede Skizze muss zu einem Abschnitt gehören, den es gibt. */
    fremd: namen.filter(n => !ids.has(n))
  };
});
p('Es gibt Skizzen', skizzen.anzahl >= 30, `${skizzen.anzahl}`);
p('Keine Skizze bleibt leer', !skizzen.leer.length, skizzen.leer.join(', '));
p('Jede Skizze gehört zu einem Abschnitt, den es gibt',
  !skizzen.fremd.length, skizzen.fremd.join(', '));
p('Keine Skizze läuft aus ihrem Blatt',
  !skizzen.raus.length, skizzen.raus.slice(0, 4).map(x => `${x.id} (${x.grund})`).join(' | '));

/* Eine Leitung, die an demselben Anschluss beginnt und endet, ist keine
   Leitung. Im Motorbild sah sie aus wie eine Diagonale quer durchs Bauteil. */
const schleifen = await seite.evaluate(() => {
  const raus: string[] = [];
  (Elektroskizzen.alle() as string[]).forEach(n => {
    const s = Elektroskizzen.zu(n) as string;
    const kasten = document.createElement('div');
    kasten.style.cssText = 'position:fixed;left:-4000px;top:0;width:600px';
    kasten.innerHTML = s;
    document.body.appendChild(kasten);
    kasten.querySelectorAll('path.sp-leitung, path[data-leitung]').forEach(pf => {
      const d = pf.getAttribute('d') || '';
      const punkte = [...d.matchAll(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g)]
        .map(m => `${Math.round(Number(m[1]))},${Math.round(Number(m[2]))}`);
      if (punkte.length >= 2 && punkte[0] === punkte[punkte.length - 1])
        raus.push(`${n}: ${punkte[0]}`);
    });
    kasten.remove();
  });
  return raus;
});
p('Keine Leitung beginnt und endet am selben Punkt',
  !schleifen.length, schleifen.slice(0, 3).join(' | '));

/* Auf der Seite selbst müssen die Skizzen auch ankommen. */
const aufSeite = await seite.evaluate(() => ({
  svg: document.querySelectorAll('.bs-skizze svg').length,
  abschnitte: document.querySelectorAll('.bs-abschnitt').length
}));
p('Die Seite zeigt ihre Skizzen', aufSeite.svg >= 2,
  `${aufSeite.svg} bei ${aufSeite.abschnitte} Abschnitten`);

/* ==========================================================================
 * §5 · Die Formel antippen — der Rechner klappt auf
 * ========================================================================*/
console.log('\n5 · Rechnen auf der Buchseite');

await seite.locator('.bs-formel').first().click();
await seite.waitForTimeout(400);
p('Ein Tipp öffnet den Rechner', await seite.locator('.bs-rechner').count() === 1);
p('Mit Feldern für die Grössen',
  await seite.locator('.bs-rechner .fh-feld').count() >= 2);
p('Und die Formel ist als offen zu sehen',
  await seite.locator('.bs-formel.offen').count() === 1);

/* Q_L = I_L · t_L: 4 A über 3 h ergeben 12 Ah. */
const felder = seite.locator('.bs-rechner .fh-feld input');
const anzahlFelder = await felder.count();
for (let i = 0; i < anzahlFelder; i++) {
  const gesucht = await felder.nth(i).isDisabled();
  if (!gesucht) await felder.nth(i).fill(i === 1 ? '4' : '3');
}
await seite.waitForTimeout(400);
const erg = await seite.locator('.bs-rechner .fh-ergebnis').innerText();
p('Und er rechnet', /12/.test(erg), erg.replace(/\n/g, ' ').slice(0, 60));

await seite.locator('.bs-formel').first().click();
await seite.waitForTimeout(300);
p('Noch ein Tipp schliesst ihn wieder', await seite.locator('.bs-rechner').count() === 0);

/* Nur EINER zur Zeit — zwei offene Rechner sind zwei Zustände. */
await seite.locator('.bs-formel').nth(0).click();
await seite.waitForTimeout(250);
await seite.locator('.bs-formel').nth(1).click();
await seite.waitForTimeout(250);
p('Es ist immer nur ein Rechner offen',
  await seite.locator('.bs-rechner').count() === 1);

/* ==========================================================================
 * §6 · Suchen führt zur Seite
 * ========================================================================*/
console.log('\n6 · Suchen');

await seite.locator('.fh-suche input').fill('resonanz');
await seite.waitForTimeout(600);
const zeilen = await seite.locator('.bs-treffer-zeile').allInnerTexts();
p('Die Suche findet etwas', zeilen.length > 0, `${zeilen.length}`);
/* „resonanz" trifft ZWEI Formeln: die Resonanzfrequenz auf Seite 15 und die
   Reihenschaltung von R, X_L und X_C auf 14, in deren Erklärung das Wort
   vorkommt. Der erste Entwurf dieser Prüfung nahm blind den ersten Treffer
   und war rot, obwohl die Suche richtig arbeitete — eine Prüfung, die eine
   Reihenfolge annimmt, prüft die Reihenfolge und nicht die Sache. */
p('Jeder Treffer sagt, auf welcher Seite er steht',
  zeilen.every(z => /Seite \d+/.test(z)), zeilen.join(' | '));
p('Und die Resonanzfrequenz steht auf Seite 15',
  zeilen.some(z => /Seite 15/.test(z)), zeilen.join(' | '));
await seite.locator('.bs-treffer-zeile', { hasText: 'Seite 15' }).first().click();
await seite.waitForTimeout(800);
p('Ein Tipp blättert hin',
  (await seite.locator('.bs-blatt').getAttribute('data-seite')) === '15');
p('… und öffnet gleich die gesuchte Formel',
  await seite.locator('.bs-rechner').count() === 1);

/* ==========================================================================
 * §7 · Am Telefon
 * ========================================================================*/
console.log('\n7 · Am Telefon');

await seite.setViewportSize({ width: 390, height: 844 });
await seite.waitForTimeout(700);
await seite.evaluate(() => {
  Store.setMeta('elektro:heftSeite', 11);
  Formelheft.schliessen(); Formelheft.oeffne();
});
await seite.waitForTimeout(900);

const handy = await seite.evaluate(() => {
  const fenster = document.querySelector('.fh-fenster') as HTMLElement;
  const fr = fenster.getBoundingClientRect();
  const knoepfe = [...document.querySelectorAll('.fh-pdffuss button, .fh-pdffuss input')]
    .map(b => {
      const r = (b as HTMLElement).getBoundingClientRect();
      return { t: (b as HTMLElement).textContent || 'Feld',
               w: Math.round(r.width), h: Math.round(r.height),
               unten: Math.round(r.bottom) };
    });
  const formel = document.querySelector('.bs-formel') as HTMLElement;
  const skizze = document.querySelector('.bs-skizze') as HTMLElement | null;
  return {
    fensterUnten: Math.round(fr.bottom),
    knoepfe,
    /* Die Formelzeile darf auch am Telefon kein Flex-Kasten sein (§2). */
    formelAnzeige: getComputedStyle(formel).display,
    formelText: formel.textContent,
    /* Skizze und Formeln stehen untereinander statt nebeneinander. */
    koerperRichtung: getComputedStyle(
      document.querySelector('.bs-koerper') as HTMLElement).flexDirection,
    skizzeBreit: skizze ? Math.round(skizze.getBoundingClientRect().width) : 0,
    /* Nichts darf seitlich hinauslaufen. */
    quer: (document.querySelector('.fh-inhalt') as HTMLElement).scrollWidth >
          (document.querySelector('.fh-inhalt') as HTMLElement).clientWidth + 1
  };
});
p('Jeder Knopf im Fuss ist mit dem Finger zu treffen',
  handy.knoepfe.every(k => k.w >= 44 && k.h >= 44),
  handy.knoepfe.filter(k => k.w < 44 || k.h < 44).map(k => `${k.t} ${k.w}×${k.h}`).join(', '));
p('Und keiner steht unter dem Bildschirmrand',
  handy.knoepfe.every(k => k.unten <= handy.fensterUnten + 1),
  handy.knoepfe.filter(k => k.unten > handy.fensterUnten + 1)
    .map(k => `${k.t} bis ${k.unten}, Fenster bis ${handy.fensterUnten}`).join(', '));
p('Die Formelzeile bleibt auch am Telefon kein Flex-Kasten',
  handy.formelAnzeige !== 'flex', handy.formelAnzeige);
p('… und behält ihre Leerzeichen',
  / = /.test(handy.formelText || ''), `${handy.formelText}`);
p('Skizze und Formeln stehen untereinander',
  handy.koerperRichtung === 'column', handy.koerperRichtung);
p('Die Seite läuft nicht seitlich hinaus', !handy.quer);

console.log('\nFehler auf der Seite:', fehler.length ? fehler.join(' | ') : 'keine');
p('Keine Fehler auf der Seite', !fehler.length, fehler.join(' | '));

console.log(`\n${ok} bestanden, ${weg} gescheitert`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
