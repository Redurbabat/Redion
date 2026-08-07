/* Suite 90 — Bewegung: Marken, Rückmeldung, und wer keine will
 * ============================================================================
 * AUS REDURS VORGABE (E43). Sie sagt drei Dinge, und alle drei sind
 * messbar — was bei Gestaltung selten genug ist:
 *
 *   1. Es gibt gemeinsame Marken für Dauer und Kurve. Vorher stand jede
 *      Dauer an ihrer eigenen Stelle: .14s hier, 200ms dort, .22s im Blatt.
 *      Gemessen am 7. August: rund achtunddreissig Übergänge in sieben
 *      Stilblättern, kein gemeinsamer Wert.
 *
 *   2. Jedes Antippen antwortet. Am Telefon gibt es kein Hover — ohne
 *      `:active` antwortet auf eine Berührung GAR NICHTS, und bis die neue
 *      Ansicht steht, weiss man nicht, ob man getroffen hat. Zweifel führen
 *      zum zweiten Tippen.
 *
 *   3. Wer keine Bewegung mag, bekommt keine. Das ist keine Höflichkeit,
 *      sondern Barrierefreiheit (CLAUDE.md §38/§39): für manche Menschen
 *      löst Bewegung Übelkeit aus.
 *
 * WAS DIESER LAUF NICHT KANN: beurteilen, ob es SCHÖN aussieht. Er prüft,
 * dass die Werte da sind, dass sie greifen und dass die Abschaltung wirkt.
 * Das Aussehen prüft ein Blick auf `bilder.mts`.
 *
 *   node pruefungen/lauf/test126.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};

const browser = await chromium.launch();

console.log('\n1 · Die Marken sind da und haben die Werte aus der Vorgabe');

const handy = await browser.newPage({
  viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true
});
await handy.goto('file://' + WURZEL + '/index.html');
await handy.waitForTimeout(2200);

const marken = await handy.evaluate(() => {
  const w = getComputedStyle(document.documentElement);
  const hol = (n: string) => w.getPropertyValue(n).trim();
  return {
    fast: hol('--motion-fast'), normal: hol('--motion-normal'), slow: hol('--motion-slow'),
    standard: hol('--ease-standard'), enter: hol('--ease-enter'), exit: hol('--ease-exit'),
    press: hol('--press-scale'), karte: hol('--card-press-scale')
  };
});
p('Es gibt drei Dauern', !!marken.fast && !!marken.normal && !!marken.slow,
  JSON.stringify(marken));
p('Sie sind aufsteigend', parseInt(marken.fast) < parseInt(marken.normal) &&
                          parseInt(marken.normal) < parseInt(marken.slow),
  `${marken.fast} / ${marken.normal} / ${marken.slow}`);
p('Schnell ist wirklich schnell (unter 150 ms)', parseInt(marken.fast) <= 150, marken.fast);
p('Langsam bleibt unter einer halben Sekunde', parseInt(marken.slow) <= 400, marken.slow);
p('Es gibt drei Kurven', /cubic-bezier/.test(marken.standard) &&
                         /cubic-bezier/.test(marken.enter) && /cubic-bezier/.test(marken.exit));
/* KEINE FEDERN. Eine Kurve mit einem Wert über 1 im zweiten Glied schwingt
   über das Ziel hinaus — nett beim ersten Mal, lästig beim fünfzigsten.
   Redion ist ein Arbeitsgerät. */
p('Keine Kurve schwingt über (kein Nachwippen)',
  ![marken.standard, marken.enter, marken.exit].some(k => {
    const z = (k.match(/-?[\d.]+/g) || []).map(Number);
    return (z[1] ?? 0) > 1.001 || (z[3] ?? 0) > 1.001;
  }),
  [marken.standard, marken.enter, marken.exit].join(' | '));
p('Das Einsinken beim Antippen ist spürbar, aber klein',
  parseFloat(marken.press) < 1 && parseFloat(marken.press) >= 0.9 &&
  parseFloat(marken.karte) < 1 && parseFloat(marken.karte) > parseFloat(marken.press),
  `Knopf ${marken.press}, Karte ${marken.karte}`);

console.log('\n2 · Am Telefon antwortet jedes Antippen');

const rueck = await handy.evaluate(() => {
  const el = document.querySelector<HTMLElement>('#handy-unten #hu-suche') ||
             document.querySelector<HTMLElement>('#handy-oben button');
  if (!el) return null;
  const st = getComputedStyle(el);
  return { dauer: st.transitionDuration, was: st.transitionProperty };
});
p('Die untere Leiste hat einen Übergang', !!rueck && rueck.dauer !== '0s',
  JSON.stringify(rueck));
/* NUR `transform` UND `opacity`. Nur diese beiden zeichnet der Browser
   ohne den Aufbau neu zu rechnen; eine Höhe zu animieren sieht am Rechner
   gleich aus und ruckelt am Telefon. */
p('… und bewegt nur, was ohne Neuaufbau geht',
  !!rueck && !/\b(width|height|top|left|margin|padding)\b/.test(rueck.was),
  String(rueck?.was));

console.log('\n3 · Am Rechner bleibt es beim Überfahren');

const gross = await browser.newPage({ viewport: { width: 1400, height: 900 } });
await gross.goto('file://' + WURZEL + '/index.html');
await gross.waitForTimeout(2000);
const amPC = await gross.evaluate(() =>
  getComputedStyle(document.getElementById('handy-oben')!).display);
p('Die Telefon-Leiste ist am Rechner gar nicht da', amPC === 'none', amPC);

console.log('\n4 · Wer keine Bewegung mag, bekommt keine');

/* DER EIGENTLICHE PUNKT DIESES LAUFS. Für manche Menschen löst Bewegung
   Übelkeit aus — die Einstellung ist kein Geschmack, sondern eine
   Notwendigkeit. Geprüft wird sie mit einem Browser, der sie WIRKLICH
   gesetzt hat, nicht mit einer Behauptung im Stilblatt. */
const ruhig = await browser.newPage({
  viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true,
  reducedMotion: 'reduce'
});
await ruhig.goto('file://' + WURZEL + '/index.html');
await ruhig.waitForTimeout(2200);
/* GERECHNET, NICHT GELESEN. Der erste Entwurf suchte nach Ziffern im Text
   und scheiterte an `1e-06s` — so schreibt der Browser die 0.001ms der
   Abschaltregel. Die Prüfung war rot, die App richtig. Eine Prüfung, die
   Zeichen vergleicht statt Zahlen, misst die Schreibweise. */
const sekunden = (wert: string): number =>
  Math.max(0, ...wert.split(',').map(s => {
    const t = s.trim();
    const z = parseFloat(t);
    return Number.isNaN(z) ? 0 : (/ms\s*$/.test(t) ? z / 1000 : z);
  }));

const still = await ruhig.evaluate(() => {
  const proben = ['#handy-unten #hu-suche', '#handy-oben button', '#page'];
  return proben.map(sel => {
    const el = document.querySelector<HTMLElement>(sel);
    if (!el) return { sel, da: false, uebergang: '', animation: '' };
    const st = getComputedStyle(el);
    return { sel, da: true, uebergang: st.transitionDuration, animation: st.animationDuration };
  });
});
/* 20 ms ist die Grenze: darunter sieht kein Mensch eine Bewegung, und die
   Vorgabe erlaubt in diesem Fall ausdrücklich ein kurzes Überblenden. */
const bewegt = still.filter(x => x.da &&
  (sekunden(x.uebergang) > 0.02 || sekunden(x.animation) > 0.02));
p('Nichts bewegt sich mehr, wenn man es abschaltet', bewegt.length === 0,
  bewegt.map(x => `${x.sel}: ${x.uebergang} / ${x.animation}`).join(' · '));
p('… und die Prüfung misst wirklich diesen Browser',
  still.every(x => x.da), still.filter(x => !x.da).map(x => x.sel).join(', '));

console.log('\n5 · Ladeskelette statt Kreisel (Vorgabe §23)');

/* „Use skeletons, not random spinners everywhere." Der Grund ist nicht
   Mode: ein Kreisel sagt „warte", ein Skelett sagt „hier kommen sechs
   Zeilen mit einem Symbol links und einem Datum rechts". Wenn der Inhalt
   kommt, springt nichts. */
const sk = await handy.evaluate(() => {
  const b = document.getElementById('page');
  if (!b) return null;
  b.innerHTML = '<div class="home">' + (window as any).Ansichten.skelett(6, true) + '</div>';
  const zeilen = [...b.querySelectorAll<HTMLElement>('.sk-zeile')];
  const striche = zeilen.map(z =>
    (z.querySelector<HTMLElement>('.sk-strich')?.style.width) || '');
  const st = zeilen[0] ? getComputedStyle(zeilen[0]) : null;
  const verzoegert = zeilen.map(z => getComputedStyle(z).animationDelay);
  return {
    zeilen: zeilen.length,
    karten: b.querySelectorAll('.sk-karte').length,
    striche,
    dauer: st ? st.animationDuration : '',
    verzoegert,
    sagtEs: /Wird geladen/.test(b.textContent || '')
  };
}) as { zeilen: number; karten: number; striche: string[]; dauer: string;
        verzoegert: string[]; sagtEs: boolean } | null;

p('Es entsteht ein Skelett', (sk?.zeilen ?? 0) === 6, String(sk?.zeilen));
p('… mit zwei Karten darüber', sk?.karten === 2, String(sk?.karten));
p('… und es sagt, dass geladen wird', sk?.sagtEs === true);
/* SECHS GLEICH LANGE BALKEN SEHEN AUS WIE EIN MUSTER, ungleiche wie Text.
   Genau darum geht es: das Auge soll die Form von Inhalt erkennen. */
p('Die Striche sind ungleich lang',
  new Set(sk?.striche ?? []).size >= 5, (sk?.striche ?? []).join(' '));
/* Ein Skelett, das blitzt, zieht die Aufmerksamkeit auf das Warten statt
   auf das, was kommt. Die Vorgabe: 1000–1400 ms, „very subtle". */
p('Das Atmen ist langsam (1000–1400 ms)',
  parseFloat(sk?.dauer || '0') >= 1 && parseFloat(sk?.dauer || '0') <= 1.4,
  sk?.dauer);
/* Und versetzt — sonst pulsiert die Liste wie ein Block, und das wirkt
   wie ein Fehler statt wie Warten. */
p('Die Zeilen atmen versetzt',
  new Set(sk?.verzoegert ?? []).size >= 5, (sk?.verzoegert ?? []).join(' '));

console.log('\n6 · Zeilen kommen versetzt herein');

/* Erscheint eine Liste als Block, sieht man einen Sprung — das Auge liest
   „da war nichts, jetzt ist alles da" und muss von vorn anfangen. Kommen
   die Zeilen nacheinander, folgt der Blick der Bewegung von oben nach
   unten, also in Leserichtung. */
const staffel = await handy.evaluate(() => {
  (window as any).Ansichten.seiten();
  const kn = [...document.querySelectorAll<HTMLElement>('#page .home-liste button')];
  const verz = kn.slice(0, 12).map(b => getComputedStyle(b).animationDelay);
  return {
    zeilen: kn.length,
    verz,
    dauer: kn[0] ? getComputedStyle(kn[0]).animationDuration : '',
    name: kn[0] ? getComputedStyle(kn[0]).animationName : ''
  };
}) as { zeilen: number; verz: string[]; dauer: string; name: string };

p('Die Zeilen sind überhaupt animiert', staffel.name !== 'none' && !!staffel.name,
  staffel.name);
p('Sie kommen versetzt', new Set(staffel.verz.slice(0, 6)).size >= 4,
  staffel.verz.slice(0, 6).join(' '));
/* DIE OBERGRENZE IST DER PUNKT: bei 20 ms je Zeile und zwanzig Zeilen wären
   das 400 ms, in denen die Liste noch nicht steht. Das ist kein Aufbau
   mehr, das ist Warten. */
const groesste = Math.max(0, ...staffel.verz.map(v => parseFloat(v) * (/ms/.test(v) ? 1 : 1000)));
p('Die Staffel bleibt unter 200 ms', groesste <= 200, groesste + ' ms');
p('Und die Bewegung selbst ist kurz',
  parseFloat(staffel.dauer) <= 0.3, staffel.dauer);

await browser.close();
console.log(`\n  Suite 90 — Bewegung: ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
