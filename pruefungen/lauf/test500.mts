/* Suite 500 — Ein Blatt füllt eine Folie, und der Klick schaltet sie weiter
 * ============================================================================
 * Redur, 12. September: „könnten wir das so mit Videoeffekt, wenn ich klicke,
 * die Antwort zeigen — und dass es das Original 1:1 öffnet."
 *
 * L153 nannte dafür den Schrittzähler. Beim Nachmessen lag DAVOR ein Fehler,
 * den die Lücke nicht kannte und der den Schrittzähler sinnlos gemacht hätte:
 *
 *   §1 EINE EINGELESENE PRÄSENTATION WAR EINE EINZIGE FOLIE. `Folien.teilen`
 *      beginnt eine neue Folie bei Trennlinie, Überschrift 1 und Überschrift 2
 *      (E297). Der .pptx-Einleser legt pro PowerPoint-Folie EINEN `blatt`-Block
 *      als direktes Kind der Seite — ohne Trenner dazwischen. Gemessen an drei
 *      Folien: `Folien.teilen` gab **1** zurück, der Vortrag zeigte „1 / 1" und
 *      stapelte die drei Blätter untereinander, das dritte halb ausserhalb des
 *      Bildes (`bilder/l153-vorher.png`). Redurs echte Datei hat 27.
 *      Ein Blatt und eine PDF-Seite sind eine GANZE Seite Papier; zwei davon
 *      teilen sich nie eine Folie. Steht jetzt als `EIGENE_FOLIE` im Kern —
 *      an derselben Stelle wie die übrige Regel, nicht im Vortrag abgeschrieben.
 *
 *   §2 DER KLICK SCHALTETE IMMER DIE FOLIE WEITER. Jede Abdeckung trägt seit
 *      E542 die Nummer des Klicks, bei dem sie weichen soll (`schritt`, aus
 *      `p:timing`) — benutzt wurde sie nie. Jetzt gehen erst die Schritte der
 *      Folie durch, dann erst kommt die nächste. Wie in PowerPoint.
 *
 *   §4 UND DIE FOLIE FÜLLTE ACHT PROZENT DER LEINWAND. `.folie-blatt` ist
 *      für zwei A4-Seiten NEBENeinander gebaut (`max-width:min(100%,45vh)`,
 *      E109); eine 16:9-Folie allein stand damit auf 370 × 208 px in einem
 *      1280er Fenster, der Rest schwarz. Gefunden auf dem Bild, nicht im Code.
 *
 *   §3 DAS AUFDECKEN WAR EIN SPRUNG. PowerPoint löst mit `dissolve` auf.
 *      Jetzt ein weiches Ausblenden — aber nur beim Aufdecken, nie im
 *      Leerlauf (E528), und nicht bei `prefers-reduced-motion` (§39).
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 * Alle drei am 12. September wirklich gefahren, die Zahlen sind GEMESSEN:
 *   §1 → `EIGENE_FOLIE` in `src/core/slides/folien.ts` leeren:
 *        33 grün  ->  16 grün, 17 rot.
 *   §2 → in `praesentation` (`wissen/werkzeuge.ts`) den Schrittzweig aus
 *        `weiter()` nehmen, sodass jeder Klick blättert:
 *        33 grün  ->  23 grün, 10 rot.
 *   §3 → die `transition`-Zeile in `motion.css` streichen:
 *        33 grün  ->  31 grün, 2 rot („dauert wirklich etwas" 0 s, und die
 *        Zusage, dass der Übergang der Deckkraft gilt).
 *   §4 → die `:only-child`-Regel in `werkzeuge.css` streichen:
 *        45 grün  ->  43 grün, 2 rot (1280 px: 0,29 der Breite; 1920 px: 0,25).
 *        AM TELEFON BLEIBT SIE GRÜN, und das ist kein Mangel, sondern der
 *        Grund für die vier Grössen: 45vh sind bei 844 px Höhe rund 380 px,
 *        und ein 390-px-Schirm ist damit ohnehin voll. Wer nur am Telefon
 *        gemessen hätte, hätte den Fehler nie gesehen (§35).
 *
 *   node pruefungen/lauf/test500.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
/* Die App lädt als klassische Skripte — `Store`, `Folien` und `Werkzeuge`
   sind Top-Level-Konstanten im Seitenbereich, NICHT Felder von `window`. */
declare const Store: any;
declare const Folien: any;
declare const Werkzeuge: any;
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9610;
const TYP: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon', '.svg': 'image/svg+xml'
};
const server = http.createServer((a: IncomingMessage, b: ServerResponse) => {
  const rein = decodeURIComponent((a.url ?? '/').split('?')[0] ?? '/');
  const datei = path.join(WURZEL, rein === '/' ? 'index.html' : rein.slice(1));
  if (!datei.startsWith(WURZEL) || !fs.existsSync(datei) || fs.statSync(datei).isDirectory()) {
    b.writeHead(404); b.end(); return;
  }
  b.writeHead(200, { 'Content-Type': TYP[path.extname(datei)] ?? 'application/octet-stream' });
  b.end(fs.readFileSync(datei));
});
await new Promise<void>(f => server.listen(PORT, f));

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, ist === soll, 'ist ' + JSON.stringify(ist) + ', soll ' + JSON.stringify(soll));

const browser = await chromium.launch();
const fehler: string[] = [];

const seiteAuf = async (wenigerBewegung = false) => {
  const kontext = await browser.newContext({
    viewport: { width: 1280, height: 820 },
    ...(wenigerBewegung ? { reducedMotion: 'reduce' as const } : {})
  });
  const seite = await kontext.newPage();
  seite.on('pageerror', e => fehler.push(e.message));
  await seite.goto(`http://localhost:${PORT}/index.html`);
  await seite.waitForFunction(
    'typeof Store !== "undefined" && typeof Folien !== "undefined" && typeof Werkzeuge !== "undefined"');
  await seite.evaluate(() => {
    document.querySelectorAll<HTMLElement>('#rg-willkommen [data-a="los"]').forEach(b => b.click());
  });
  await seite.waitForTimeout(400);
  return { kontext, seite };
};

/** Baut eine Seite, wie der .pptx-Einleser sie baut: N Blätter, kein Trenner. */
const VORTRAG_BAUEN = (n: number) => {
  const seite = Store.addPage(null, { text: 'Kapitel 4', icon: '📽️' });
  for (let k = 1; k <= n; k++) {
    const b = Store.addBlock(seite.id, 'blatt', {
      text: 'Folie ' + k, blattBreite: 960, blattHoehe: 540, papier: 'blanko' });
    Store.updateBlock(b.id, { marken: [
      { id: 'tx' + k, art: 'text', point: [40, 40], breiteBox: 700,
        text: 'Aufgabe ' + k, fontSize: 24 },
      { id: 'a' + k + '_1', art: 'abdeck', farbe: '#ffcc00', schritt: 1,
        pts: [[40, 200], [400, 250]] },
      { id: 'a' + k + '_2', art: 'abdeck', farbe: '#ffcc00', schritt: 2,
        pts: [[40, 300], [400, 350]] },
      /* Eine VON HAND gesetzte Abdeckung ohne `schritt` (E266). Sie darf vom
         Schrittzähler nie angefasst werden — sonst verlöre das Lernen im
         eigenen Heft seine Ordnung. */
      { id: 'h' + k, art: 'abdeck', farbe: '#88ccff',
        pts: [[500, 200], [800, 250]] },
    ] });
  }
  return seite.id;
};

/* ══ §1 EIN BLATT FÜLLT EINE FOLIE ═══════════════════════════════════════ */
console.log('\n§1 Drei eingelesene Folien sind drei Folien, nicht eine');
{
  const { kontext, seite } = await seiteAuf();

  const geteilt = await seite.evaluate((bauen: string) => {
    const sid = (new Function('Store', 'return (' + bauen + ')(3)'))(Store);
    const folien = Folien.teilen(Store.getBlock(sid), (id: string) => Store.childrenOf(id));

    /* GEGENPROBE IM SELBEN LAUF: dieselben Blätter, aber in Spalten. Dort
       gehören sie ZUSAMMEN auf eine Folie — genau der Fall aus test183, den
       die neue Regel nicht kaputtmachen darf. */
    const s2 = Store.addPage(null, { text: 'Nebeneinander' });
    const c = Store.addBlock(s2.id, 'columns', { text: '', spalten: 2 });
    const li = Store.addBlock(c.id, 'spalte', { text: '' });
    const re = Store.addBlock(c.id, 'spalte', { text: '' });
    Store.addBlock(li.id, 'blatt', { text: '', blattBreite: 595, blattHoehe: 842 });
    Store.addBlock(re.id, 'pdfseite', { text: '', nr: 7, bw: 595, bh: 842 });
    const spaltenFolien = Folien.teilen(Store.getBlock(s2.id), (id: string) => Store.childrenOf(id));

    /* Und eine leere Seite muss weiterhin GENAU EINE Folie ergeben — sonst
       liefe der Vortrag an `folien[0] === undefined`. */
    const s3 = Store.addPage(null, { text: '' });
    const leer = Folien.teilen(Store.getBlock(s3.id), (id: string) => Store.childrenOf(id));

    return {
      sid, zahl: folien.length,
      jeEins: folien.every((f: any) => f.eintraege.length === 1),
      alleBlatt: folien.every((f: any) => f.eintraege[0]?.block.type === 'blatt'),
      reihenfolge: folien.map((f: any) => f.eintraege[0]?.block.text),
      spaltenZahl: spaltenFolien.length,
      leerZahl: leer.length,
    };
  }, VORTRAG_BAUEN.toString());

  gleich('Drei Blätter ergeben drei Folien', geteilt.zahl, 3);
  p('Auf jeder steht genau ein Eintrag', geteilt.jeEins);
  p('… und das ist das Blatt', geteilt.alleBlatt);
  p('Die Reihenfolge bleibt die der Datei',
    JSON.stringify(geteilt.reihenfolge) === JSON.stringify(['Folie 1', 'Folie 2', 'Folie 3']),
    JSON.stringify(geteilt.reihenfolge));
  p('Keine leere Folie am Ende', geteilt.zahl === 3);
  gleich('Blatt und PDF-Seite in Spalten bleiben EINE Folie (test183)',
    geteilt.spaltenZahl, 1);
  gleich('Eine leere Seite ergibt weiterhin genau eine Folie', geteilt.leerZahl, 1);

  await kontext.close();
}

/* ══ §2 DER KLICK SCHALTET EINEN SCHRITT WEITER ══════════════════════════ */
console.log('\n§2 Erst die Schritte der Folie, dann die nächste Folie');
{
  const { kontext, seite } = await seiteAuf();

  await seite.evaluate(async (bauen: string) => {
    const sid = (new Function('Store', 'return (' + bauen + ')(3)'))(Store);
    await Werkzeuge.praesentation(Store.getBlock(sid));
  }, VORTRAG_BAUEN.toString());
  await seite.waitForSelector('.praesi .folie', { timeout: 20000 });
  await seite.waitForTimeout(400);

  /* Gemessen wird am ECHTEN Knoten, nicht an einer Zustandsvariablen: was
     der Zuschauer sieht, ist `data-auf` im Bild. */
  const stand = () => seite.evaluate(() => {
    const deckel = [...document.querySelectorAll<SVGElement>('.praesi [data-ink-art="abdeck"]')];
    return {
      zaehler: (document.querySelector('.praesi-leiste span')?.textContent || '').replace(/\s+/g, ' ').trim(),
      blaetter: document.querySelectorAll('.praesi .folie-blatt').length,
      deckel: deckel.length,
      offen: deckel.filter(d => d.getAttribute('data-auf') === '1').length,
      offeneSchritte: deckel.filter(d => d.getAttribute('data-auf') === '1')
        .map(d => d.getAttribute('data-schritt') || 'ohne').sort().join(','),
    };
  });
  /* Ein Klick auf die FLÄCHE, nicht auf einen Deckel und nicht auf die
     Leiste — genau das, was ein Vortragender tut. */
  const klick = async () => {
    await seite.evaluate(() => {
      const f = document.querySelector('.praesi .folie');
      f?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await seite.waitForTimeout(120);
  };

  const a0 = await stand();
  gleich('Zu Beginn: Folie 1 von 3', a0.zaehler.startsWith('1 / 3'), true);
  gleich('Nur EIN Blatt im Bild', a0.blaetter, 1);
  gleich('Drei Abdeckungen auf der Folie', a0.deckel, 3);
  gleich('Und alle sind zu', a0.offen, 0);
  p('Der Zähler nennt den Schritt', /Schritt 0\s*\/\s*2/.test(a0.zaehler), a0.zaehler);

  await klick();
  const a1 = await stand();
  gleich('Ein Klick deckt Schritt 1 auf — die Folie bleibt', a1.zaehler.startsWith('1 / 3'), true);
  gleich('… genau eine Abdeckung ist offen', a1.offen, 1);
  gleich('… und zwar die mit schritt=1', a1.offeneSchritte, '1');

  await klick();
  const a2 = await stand();
  gleich('Der zweite Klick deckt Schritt 2 auf', a2.offen, 2);
  gleich('… die Folie steht immer noch', a2.zaehler.startsWith('1 / 3'), true);
  p('Die von Hand gesetzte Abdeckung bleibt zu (E266)',
    !a2.offeneSchritte.includes('ohne'), a2.offeneSchritte);

  await klick();
  const a3 = await stand();
  gleich('Erst der dritte Klick blättert weiter', a3.zaehler.startsWith('2 / 3'), true);
  gleich('… und dort ist wieder alles zu', a3.offen, 0);

  /* ZURÜCK LANDET AUF DER VOLLEN FOLIE — wie in PowerPoint. Wer zurückgeht,
     will sehen, was er gerade gezeigt hat, nicht wieder alles zudecken. */
  await seite.keyboard.press('ArrowLeft');
  await seite.waitForTimeout(150);
  const zurueck = await stand();
  gleich('Pfeil zurück führt auf Folie 1', zurueck.zaehler.startsWith('1 / 3'), true);
  gleich('… und zeigt sie AUFGEDECKT, nicht von vorn', zurueck.offen, 2);

  /* Ein Klick auf eine Abdeckung deckt genau DIESE auf, statt zu blättern —
     auch die von Hand gesetzte ohne `schritt`. */
  await seite.evaluate(() => {
    const ohne = [...document.querySelectorAll<SVGElement>('.praesi [data-ink-art="abdeck"]')]
      .find(d => !d.hasAttribute('data-schritt'));
    ohne?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  await seite.waitForTimeout(150);
  const getippt = await stand();
  gleich('Ein Tipp auf die Abdeckung deckt sie auf, ohne zu blättern',
    getippt.zaehler.startsWith('1 / 3'), true);
  gleich('… und jetzt sind alle drei offen', getippt.offen, 3);

  await seite.evaluate(() => document.querySelector('.praesi')?.remove());
  await kontext.close();
}

/* ══ §3 DAS AUFLÖSEN IST WEICH, ABER NICHT IM LEERLAUF ═══════════════════ */
console.log('\n§3 Der Deckel löst sich auf, statt zu verschwinden');
{
  const { kontext, seite } = await seiteAuf();
  await seite.evaluate(async (bauen: string) => {
    const sid = (new Function('Store', 'return (' + bauen + ')(2)'))(Store);
    await Werkzeuge.praesentation(Store.getBlock(sid));
  }, VORTRAG_BAUEN.toString());
  await seite.waitForSelector('.praesi .folie', { timeout: 20000 });
  await seite.waitForTimeout(400);

  /* GEMESSEN WIRD NACH DEM ÜBERGANG, nicht davor. Der erste Entwurf las
     `fillOpacity` unmittelbar nach dem Setzen von `data-auf` und bekam 1 —
     richtig, denn `getComputedStyle` gibt den GERADE laufenden Wert zurück,
     und zu diesem Zeitpunkt hat sich nichts bewegt. Eine Prüfung, die den
     Anfangswert misst und ihn für das Ergebnis hält, prüft nichts (§55.2). */
  const vorMessung = await seite.evaluate(() => {
    const d = document.querySelector<SVGElement>('.praesi [data-ink-art="abdeck"][data-schritt]');
    if (!d) return null;
    const st = getComputedStyle(d);
    return { dauer: st.transitionDuration, was: st.transitionProperty,
             laeuft: (d.getAnimations?.() || []).length, deckendVorher: st.fillOpacity };
  });
  await seite.evaluate(() => {
    document.querySelector<SVGElement>('.praesi [data-ink-art="abdeck"][data-schritt]')
      ?.setAttribute('data-auf', '1');
  });
  await seite.waitForTimeout(900);
  const nachMessung = await seite.evaluate(() => {
    const d = document.querySelector<SVGElement>('.praesi [data-ink-art="abdeck"][data-schritt]');
    const wert = d ? getComputedStyle(d).fillOpacity : '';
    d?.removeAttribute('data-auf');
    return wert;
  });
  const gemessen = vorMessung ? { ...vorMessung, deckendNachher: nachMessung } : null;

  p('Die Abdeckung ist da und messbar', !!gemessen);
  if (gemessen) {
    p('Zugedeckt ist sie wirklich deckend',
      Number(gemessen.deckendVorher) >= 1 || gemessen.deckendVorher === '1',
      gemessen.deckendVorher);
    p('Aufgedeckt ist sie ganz weg — kein Schatten auf der Leinwand',
      Number(gemessen.deckendNachher) === 0, gemessen.deckendNachher);
    p('Der Übergang dauert wirklich etwas', parseFloat(gemessen.dauer) > 0, gemessen.dauer);
    p('Und er gilt der Deckkraft, nicht allem',
      /fill-opacity/.test(gemessen.was), gemessen.was);
    /* E528: im Leerlauf bewegt sich nichts. Ein Übergang ist keine Animation,
       die von selbst läuft — `getAnimations()` muss leer sein. */
    gleich('Im Leerlauf läuft keine Animation (E528)', gemessen.laeuft, 0);
  }
  await seite.evaluate(() => document.querySelector('.praesi')?.remove());
  await kontext.close();
}

console.log('\n§3b Wer weniger Bewegung will, bekommt keine');
{
  const { kontext, seite } = await seiteAuf(true);
  await seite.evaluate(async (bauen: string) => {
    const sid = (new Function('Store', 'return (' + bauen + ')(2)'))(Store);
    await Werkzeuge.praesentation(Store.getBlock(sid));
  }, VORTRAG_BAUEN.toString());
  await seite.waitForSelector('.praesi .folie', { timeout: 20000 });
  await seite.waitForTimeout(300);
  await seite.evaluate(() => {
    document.querySelector<SVGElement>('.praesi [data-ink-art="abdeck"][data-schritt]')
      ?.setAttribute('data-auf', '1');
  });
  await seite.waitForTimeout(200);
  const ruhig = await seite.evaluate(() => {
    const d = document.querySelector<SVGElement>('.praesi [data-ink-art="abdeck"][data-schritt]');
    if (!d) return null;
    const st = getComputedStyle(d);
    return { dauer: st.transitionDuration, deckend: st.fillOpacity };
  });
  /* NICHT auf exakt 0 s prüfen. `grund.css` setzt unter diesem Schirm
     `transition-duration:.001ms !important` für alles (E340) — gemessen
     also 1e-06 s, nicht 0. Wer hier `=== 0` schriebe, prüfte gegen eine
     Zahl, die es im Projekt gar nicht gibt. Was zählt: nicht wahrnehmbar. */
  p('Bei prefers-reduced-motion ist der Übergang aus (E340)',
    !!ruhig && parseFloat(ruhig.dauer) < 0.01, ruhig ? ruhig.dauer : 'keine Abdeckung');
  p('… aber aufgedeckt wird trotzdem — die Funktion bleibt',
    !!ruhig && Number(ruhig.deckend) === 0, ruhig ? ruhig.deckend : '');
  await seite.evaluate(() => document.querySelector('.praesi')?.remove());
  await kontext.close();
}

/* ══ §4 DIE FOLIE FÜLLT DIE LEINWAND — UND BLEIBT 16:9 ═══════════════════ */
console.log('\n§4 Ein Blatt allein füllt die Folie, bei jeder Bildschirmgrösse');
{
  /* DAS HAT DAS BILD GEFUNDEN, NICHT DER CODE (§55.1). `bilder/l153-vorher.png`
     zeigte die Folie auf 370 × 208 px in einem 1280er Fenster — acht Prozent
     der Leinwand. Und die erste Reparatur sah am Rechner richtig aus und
     stellte am Telefon die 16:9-Folie hochkant.
     Gemessen wird deshalb an VIER Grössen. Eine Messung an einer einzigen
     hätte beide Fehler durchgelassen. */
  for (const [was, breite, hoehe] of
       [['Rechner', 1280, 820], ['Telefon', 390, 844],
        ['schmal', 320, 640], ['breit', 1920, 1080]] as [string, number, number][]) {
    const kontext = await browser.newContext({ viewport: { width: breite, height: hoehe } });
    const seite = await kontext.newPage();
    seite.on('pageerror', e => fehler.push(e.message));
    await seite.goto(`http://localhost:${PORT}/index.html`);
    await seite.waitForFunction('typeof Store !== "undefined" && typeof Werkzeuge !== "undefined"');
    await seite.evaluate(() => {
      document.querySelectorAll<HTMLElement>('#rg-willkommen [data-a="los"]').forEach(b => b.click());
    });
    await seite.waitForTimeout(300);
    await seite.evaluate(async (bauen: string) => {
      const sid = (new Function('Store', 'return (' + bauen + ')(2)'))(Store);
      await Werkzeuge.praesentation(Store.getBlock(sid));
    }, VORTRAG_BAUEN.toString());
    await seite.waitForSelector('.praesi .folie-blatt', { timeout: 20000 });
    await seite.waitForTimeout(350);

    const m = await seite.evaluate(() => {
      const k = document.querySelector('.praesi .folie-blatt')?.getBoundingClientRect();
      if (!k) return null;
      return { b: k.width, h: k.height, v: +(k.width / k.height).toFixed(3),
               anteil: +(k.width / innerWidth).toFixed(2),
               imBild: k.top >= 0 && k.bottom <= innerHeight && k.right <= innerWidth + 1 };
    });
    p(`${was} (${breite}px): das Blatt steht 16:9`,
      !!m && Math.abs(m.v - 960 / 540) < 0.02, m ? String(m.v) : 'kein Blatt');
    p(`${was} (${breite}px): es füllt die Breite wirklich aus`,
      !!m && m.anteil > 0.6, m ? m.anteil + ' der Fensterbreite' : '');
    p(`${was} (${breite}px): und steht ganz im Bild`, !!m && m.imBild);

    await kontext.close();
  }
}

p('Keine Browserfehler', fehler.length === 0, fehler.join(' | '));

await browser.close();
server.close();
console.log(`\nSuite 500: ${ok} grün` + (weg ? `, ${weg} rot` : '') + '.');
process.exit(weg ? 1 : 0);
