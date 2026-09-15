/* Suite 527 — Direkt auf dem Blatt schreiben, wie in OneNote (E597)
 * ============================================================================
 * REDURS SATZ, 15. September 2026: „bei redion fehlt freier Text einfügen bei
 * der PDF oder überhaupt — es sollte wie OneNote sein: wenn ich irgendwo
 * klicke, sollte ich direkt Text schreiben können."
 *
 * GEMESSEN, WAS VORHER WAR: ein Tipp mit dem Textwerkzeug öffnete einen
 * MODALEN DIALOG („Text · Übernehmen mit Strg + Enter · Übernehmen ·
 * Abbrechen"). Das Getippte stand in dessen Textfeld, `marken` blieb leer,
 * und auf dem Blatt war nichts zu sehen, bis man den Dialog bestätigte.
 * Gegen diesen Stand sind §1 bis §6 rot.
 *
 * §1 EIN TIPP ÖFFNET KEINEN DIALOG, sondern ein Schreibfeld auf dem Blatt.
 * §2 DAS FELD STEHT, WO GETIPPT WURDE — und trägt Farbe, Grösse, Schrift.
 * §3 DAS GETIPPTE LANDET IN DER MARKE, an der Stelle des Tipps.
 * §4 EIN TIPP WOANDERS schliesst das eine Feld und öffnet gleich das nächste.
 * §5 LEER BLEIBT LEER — ein Feld ohne Text hinterlässt keine Marke.
 * §6 EIN VORHANDENER TEXT wird an Ort und Stelle weitergeschrieben.
 * §7 GESPERRT BLEIBT GESPERRT (E473) — kein Feld, kein stiller Verlust.
 * §8 ZURÜCK nimmt den geschriebenen Text in EINEM Schritt.
 * §9 EIN DOPPELTIPP öffnet einen Text auch mit der Auswahl.
 * §10 AM TELEFON bricht das Feld dort um, wo der fertige Text es tut.
 * §11 AUF EINER PDF-SEITE gilt dasselbe — Redur hat die PDF ausdrücklich genannt.
 * §12 GEHT DER REITER ZU, während das Feld offen ist, ist der Satz nicht weg (§51).
 * §13 DIE SCHRIFTLEISTE wirkt auf den Kasten, in den gerade getippt wird (E599).
 * §14 ZWEIMAL AUF LEERES PAPIER heisst: hier schreiben — auch mit der Auswahl (E599).
 *
 * ZWEI DINGE, DIE BEIM SCHREIBEN DIESES LAUFS GEMESSEN WURDEN:
 *
 *   · DREI ZUSICHERUNGEN WAREN GEGEN DEN ALTEN STAND GRÜN, OHNE ETWAS ZU
 *     HALTEN: „Escape schliesst das Feld", „das neue Feld ist leer" und
 *     „kein Schreibfeld über einer gesperrten Marke" sind alle wahr, wenn
 *     es gar kein Feld gibt. Sie stehen trotzdem hier — sie halten den
 *     NEUEN Zustand —, aber sie sind kein Beleg dafür, dass dieser Lauf rot
 *     werden kann. Das sind die anderen sechzehn (§55.2).
 *   · DAS BLATT IST HÖHER ALS DAS FENSTER: 841,89 Blatteinheiten werden bei
 *     1440 × 960 zu 1384 Bildpunkten. Ein Tipp unterhalb von etwa y=430
 *     landet AUSSERHALB des Fensters und kommt nirgends an. Der erste
 *     Entwurf tippte auf y=600 und hielt das Ausbleiben des Feldes für
 *     einen Fehler der App — es war einer des Laufs.
 * ==========================================================================*/
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { resolve, extname } from 'node:path';
declare const Store: any;
declare const App: any;
const root = resolve(import.meta.dirname, '../..');
const types: Record<string, string> = { '.html': 'text/html', '.js': 'text/javascript',
  '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json' };
const server = createServer((request, response) => {
  const file = resolve(root, '.' + (request.url?.split('?')[0] || '/index.html'));
  if (!file.startsWith(root) || !existsSync(file) || statSync(file).isDirectory()) {
    response.writeHead(404).end(); return;
  }
  response.setHeader('Content-Type', (types[extname(file)] || 'application/octet-stream') + '; charset=utf-8');
  response.end(readFileSync(file));
});
await new Promise<void>(done => server.listen(0, '127.0.0.1', done));
const port = (server.address() as { port: number }).port;
const browser = await chromium.launch();
let failed = 0, passed = 0;
const pr = (name: string, value: unknown, zusatz = ''): void => {
  value ? passed++ : failed++;
  console.log((value ? '  ✓ ' : '  ✗ ') + name + (value || !zusatz ? '' : ' — ' + zusatz));
};
const errors: string[] = [];
const BREITE = 595.28, HOEHE = 841.89;
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 }, deviceScaleFactor: 1 });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${port}/index.html`);
  await page.waitForFunction('typeof Store !== "undefined" && typeof App !== "undefined"');
  await page.waitForTimeout(500);
  const ids = await page.evaluate(async ({ breite, hoehe }) => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung')
      .forEach(node => node.remove());
    const heft = Store.addPage(null, { text: 'Schreibprobe', icon: '📓' });
    const blatt = Store.addBlock(heft.id, 'blatt', { text: '', papier: 'punkte',
      blattBreite: breite, blattHoehe: hoehe, raumVersion: 1, marken: [] });
    Store.updateBlock(heft.id, { dokumentModus: true });
    await Store.flush(); App.oeffne(heft.id);
    return { heft: heft.id, blatt: blatt.id };
  }, { breite: BREITE, hoehe: HOEHE });
  await page.waitForSelector('.document-drawingbar');
  const flaeche = page.locator('.blatt-marken').first();
  /** Einen Blattpunkt antippen — die Fläche trägt den ganzen Blattraum. */
  const tippe = async (x: number, y: number): Promise<void> => {
    const kasten = await flaeche.boundingBox();
    if (!kasten) throw new Error('Die Blattfläche hat keinen Kasten.');
    await page.mouse.click(kasten.x + (x / BREITE) * kasten.width,
                           kasten.y + (y / HOEHE) * kasten.height);
    await page.waitForTimeout(160);
  };
  const marken = async (): Promise<any[]> =>
    await page.evaluate(id => JSON.parse(JSON.stringify(Store.getBlock(id)?.marken || [])), ids.blatt);

  await page.locator('[data-document-tool="text"]').click();
  await page.waitForTimeout(200);

  console.log('\n1 · Ein Tipp öffnet kein Fenster, sondern ein Schreibfeld auf dem Blatt');
  await tippe(120, 160);
  const nachTipp = await page.evaluate(() => {
    const feld = document.querySelector<HTMLTextAreaElement>('.blatt-schreiber');
    return { overlays: document.querySelectorAll('.overlay').length,
      feld: !!feld, fokus: !!feld && document.activeElement === feld };
  });
  pr('Kein modaler Dialog — das Fenster von früher bleibt zu', nachTipp.overlays === 0,
    nachTipp.overlays + ' Überlagerungen');
  pr('Stattdessen steht ein Schreibfeld auf dem Blatt', nachTipp.feld);
  pr('… und es hat den Fokus, ohne dass man es anklicken muss', nachTipp.fokus);

  console.log('\n2 · Das Feld steht dort, wo getippt wurde');
  const lage = await page.evaluate(({ breite, hoehe }) => {
    const feld = document.querySelector<HTMLElement>('.blatt-schreiber');
    const raum = feld?.parentElement;
    if (!feld || !raum) return null;
    const f = feld.getBoundingClientRect(), r = raum.getBoundingClientRect();
    const stil = getComputedStyle(feld);
    return { x: ((f.left - r.left) / r.width) * breite, y: ((f.top - r.top) / r.height) * hoehe,
      farbe: stil.color, schriftPx: parseFloat(stil.fontSize),
      skala: r.height / hoehe };
  }, { breite: BREITE, hoehe: HOEHE });
  pr('Waagrecht dort, wo der Zeiger war (120 ± 6)',
    !!lage && Math.abs(lage.x - 120) <= 6, JSON.stringify(lage));
  pr('Senkrecht dort, wo der Zeiger war (160 ± 6)',
    !!lage && Math.abs(lage.y - 160) <= 6, JSON.stringify(lage));

  console.log('\n3 · Das Getippte landet in der Marke');
  await page.keyboard.type('Freier Text, direkt aufs Blatt');
  await page.waitForTimeout(120);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(250);
  const eine = await marken();
  pr('Genau eine Textmarke', eine.length === 1 && eine[0]?.art === 'text',
    JSON.stringify(eine.map(m => m.art)));
  pr('Mit genau dem, was getippt wurde',
    eine[0]?.text === 'Freier Text, direkt aufs Blatt', JSON.stringify(eine[0]?.text));
  pr('An der Stelle des Tipps (120/160 ± 6)',
    Math.abs((eine[0]?.point?.[0] ?? -999) - 120) <= 6 &&
    Math.abs((eine[0]?.point?.[1] ?? -999) - 160) <= 6, JSON.stringify(eine[0]?.point));
  pr('Escape schliesst das Feld', await page.locator('.blatt-schreiber').count() === 0);
  /* DIE SCHRIFTGRÖSSE GEGEN DIE ENTSTANDENE MARKE, nicht gegen eine geratene
     Zahl: die Vorgabe ist 16 und nicht 18, und ein Lauf, der eine Zahl aus
     dem Gedächtnis prüft, prüft sein Gedächtnis (E21). Was hier zählt, ist
     dass im Feld DIESELBE Grösse steht wie danach auf dem Blatt — mit der
     Fläche skaliert. */
  pr('Im Feld stand die Schriftgrösse, die die fertige Marke trägt',
    !!lage && Math.abs(lage.schriftPx - (Number(eine[0]?.fontSize) || 0) * lage.skala) <= 1.5,
    lage ? lage.schriftPx + ' px · Marke ' + eine[0]?.fontSize + ' × ' + lage.skala.toFixed(3) : '—');

  console.log('\n4 · Ein Tipp woanders schliesst das eine Feld und öffnet das nächste');
  await tippe(120, 330);
  await page.keyboard.type('Zweiter Kasten');
  await tippe(350, 260);
  const zweiTipps = await page.evaluate(() => {
    const feld = document.querySelector<HTMLTextAreaElement>('.blatt-schreiber');
    return { felder: document.querySelectorAll('.blatt-schreiber').length,
      leer: (feld?.value || '') === '' };
  });
  pr('Es steht immer nur EIN Schreibfeld offen', zweiTipps.felder === 1,
    zweiTipps.felder + ' Felder');
  pr('Das neue Feld ist leer — es hat den alten Text nicht geerbt', zweiTipps.leer);
  const nachZwei = await marken();
  pr('Der zweite Kasten ist beim Weitertippen gesichert worden',
    nachZwei.length === 2 && nachZwei.some(m => m.text === 'Zweiter Kasten'),
    JSON.stringify(nachZwei.map(m => m.text)));

  console.log('\n5 · Leer bleibt leer');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(220);
  const nachLeer = await marken();
  pr('Ein Feld ohne Text hinterlässt keine Marke', nachLeer.length === 2,
    nachLeer.length + ' Marken');

  console.log('\n6 · Ein vorhandener Text wird an Ort und Stelle weitergeschrieben');
  await tippe(130, 340);
  const beimOeffnen = await page.evaluate(() =>
    document.querySelector<HTMLTextAreaElement>('.blatt-schreiber')?.value ?? null);
  pr('Der Tipp auf einen vorhandenen Text öffnet ihn statt ihn zu überschreiben',
    beimOeffnen === 'Zweiter Kasten', JSON.stringify(beimOeffnen));
  await page.keyboard.press('End');
  await page.keyboard.type(' — erweitert');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(250);
  const erweitert = await marken();
  pr('Der geänderte Text steht in DERSELBEN Marke',
    erweitert.length === 2 && erweitert.some(m => m.text === 'Zweiter Kasten — erweitert'),
    JSON.stringify(erweitert.map(m => m.text)));

  console.log('\n7 · Eine gesperrte Marke bleibt gesperrt (E473)');
  await page.evaluate(id => {
    const liste = JSON.parse(JSON.stringify(Store.getBlock(id).marken));
    const ziel = liste.find((m: any) => m.art === 'text');
    if (ziel) ziel.gesperrt = true;
    Store.updateBlock(id, { marken: liste });
  }, ids.blatt);
  await page.reload();
  await page.waitForFunction('typeof Store !== "undefined" && typeof App !== "undefined"');
  await page.evaluate(id => { Store.setMeta('rundgangGesehen', true); App.oeffne(id); }, ids.heft);
  await page.waitForSelector('.document-drawingbar');
  await page.locator('[data-document-tool="text"]').click();
  await page.waitForTimeout(250);
  await tippe(130, 170);
  pr('Kein Schreibfeld über einer gesperrten Marke',
    await page.locator('.blatt-schreiber').count() === 0);
  const nachSperre = await marken();
  pr('Und ihr Text steht unverändert da',
    nachSperre.some(m => m.gesperrt && m.text === 'Freier Text, direkt aufs Blatt'),
    JSON.stringify(nachSperre.filter(m => m.gesperrt).map(m => m.text)));

  console.log('\n8 · Zurück nimmt den geschriebenen Text in einem Schritt');
  await tippe(330, 410);
  await page.keyboard.type('Wieder weg');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(250);
  const vorZurueck = await marken();
  await page.evaluate(() => { (document.querySelector('[data-document-action="ink-undo"]') as HTMLElement)?.click(); });
  await page.waitForTimeout(300);
  const nachZurueck = await marken();
  pr('Ein Schritt zurück nimmt genau diesen einen Kasten',
    vorZurueck.length === nachZurueck.length + 1 &&
    !nachZurueck.some(m => m.text === 'Wieder weg'),
    vorZurueck.length + ' → ' + nachZurueck.length);

  console.log('\n9 · Ein Doppeltipp öffnet einen Text auch mit der Auswahl');
  await page.locator('[data-document-tool="select"]').click();
  await page.waitForTimeout(200);
  {
    const kasten = await flaeche.boundingBox();
    if (kasten) {
      await page.mouse.dblclick(kasten.x + (130 / BREITE) * kasten.width,
                                kasten.y + (340 / HOEHE) * kasten.height);
      await page.waitForTimeout(250);
    }
  }
  const beimDoppel = await page.evaluate(() =>
    document.querySelector<HTMLTextAreaElement>('.blatt-schreiber')?.value ?? null);
  pr('Zwei Tipps auf einen Text öffnen ihn, ohne das Werkzeug zu wechseln',
    beimDoppel === 'Zweiter Kasten — erweitert', JSON.stringify(beimDoppel));
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);

  console.log('\n10 · Am Telefon bricht das Feld dort um, wo der Text es tut');
  /* DER FUND VOM BILD (§55.1): am Telefon stand im Feld „Ein Klick, und /
     ich schreibe / schon." — drei Zeilen — und auf dem Blatt danach zwei.
     `bausteine.css:312` setzt unter 760 px `input, textarea, select{
     font-size:16px !important }`, damit iOS beim Tippen nicht hineinzoomt;
     das Feld rechnete deshalb mit 16 px statt mit den gesetzten 9,23.

     WARUM DIESE ZUSICHERUNG ROT WERDEN KANN: sie vergleicht nicht mit einer
     Zahl, sondern die zwei Umbrüche MITEINANDER. Wer die Grösse des Feldes
     wieder der Stilregel überlässt, bekommt hier 3 gegen 2. */
  await page.setViewportSize({ width: 390, height: 844 });
  /* NEU LADEN, NICHT NUR DIE GRÖSSE ÄNDERN: das Studio baut seine Leisten
     beim Öffnen nach der Fensterbreite: eine Grössenänderung mitten im Lauf
     lässt das Blatt an einer Stelle, an der der Tipp danebengeht. Gemessen —
     der erste Entwurf tippte ins Leere und bekam „Feld -1 Zeilen". */
  await page.reload();
  await page.waitForFunction('typeof Store !== "undefined" && typeof App !== "undefined"');
  /* GRÖSSE 34 UND NICHT DIE VORGABE 16. Bei 16 fällt die Rechnung zufällig
     mit der Stilregel zusammen — beide sagen „16 px", und die Zusicherung
     wäre grün, egal wer gewinnt. Bei 34 sind es 19,6 px gegen 16, und erst
     dann sieht man, ob sich das Blattmass durchsetzt (§55.2). */
  await page.evaluate(id => {
    Store.setMeta('rundgangGesehen', true);
    Store.setMeta('zeichnen:schrift', { familie: 'standard', groesse: 34,
      fett: false, rahmen: false, ausricht: 'links' });
    App.oeffne(id);
  }, ids.heft);
  await page.waitForSelector('.document-drawingbar');
  await page.waitForTimeout(400);
  await page.locator('[data-document-tool="text"]').click();
  await page.waitForTimeout(250);
  await tippe(60, 520);
  const feldZeilen = await page.evaluate(() => {
    const feld = document.querySelector<HTMLTextAreaElement>('.blatt-schreiber');
    if (!feld) return null;
    const stil = getComputedStyle(feld);
    const innen = feld.scrollHeight - parseFloat(stil.paddingTop) - parseFloat(stil.paddingBottom);
    return { zeilen: Math.round(innen / parseFloat(stil.lineHeight)),
      schriftPx: parseFloat(stil.fontSize) };
  });
  await page.keyboard.type('Ein Klick, und ich schreibe schon.');
  await page.waitForTimeout(150);
  const imFeld = await page.evaluate(() => {
    const feld = document.querySelector<HTMLTextAreaElement>('.blatt-schreiber');
    if (!feld) return -1;
    const stil = getComputedStyle(feld);
    const innen = feld.scrollHeight - parseFloat(stil.paddingTop) - parseFloat(stil.paddingBottom);
    return Math.round(innen / parseFloat(stil.lineHeight));
  });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(350);
  const aufDemBlatt = await page.evaluate(() => {
    const knoten = [...document.querySelectorAll('.blatt-marken [data-ink-art="text"] text')];
    const letzter = knoten[knoten.length - 1];
    return letzter ? letzter.querySelectorAll('tspan').length : -1;
  });
  pr('Das Feld bricht so um wie der fertige Text (Telefon, 390 × 844)',
    imFeld > 0 && imFeld === aufDemBlatt, 'Feld ' + imFeld + ' Zeilen · Blatt ' + aufDemBlatt);
  pr('Und die Schrift bleibt bei mindestens 16 px, damit iOS nicht hineinzoomt',
    !!feldZeilen && feldZeilen.schriftPx >= 16, JSON.stringify(feldZeilen));
  pr('Die Stilregel „textarea 16px !important" setzt sich nicht über das Blattmass',
    !!feldZeilen && Math.abs(feldZeilen.schriftPx - 16) > 1, JSON.stringify(feldZeilen));

  console.log('\n11 · Auch auf einer PDF-Seite, nicht nur auf einem Blatt');
  /* REDUR HAT AUSDRÜCKLICH „bei der PDF" GESAGT. Eine PDF-Seite und ein
     Blatt teilen sich `Marken.schicht` — aber „teilen sich dieselbe
     Funktion" ist eine Behauptung über den Code, und diese Zusicherung ist
     eine über das Erzeugnis. Sie kostet dreissig Sekunden und beantwortet
     genau die Frage, die gestellt wurde. */
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.reload();
  await page.waitForFunction('typeof Store !== "undefined" && typeof App !== "undefined"');
  const pdfIds = await page.evaluate(async ({ breite, hoehe }) => {
    Store.setMeta('rundgangGesehen', true);
    /* DIE SCHRIFT WIEDER AUF DIE VORGABE. §10 hat sie auf 34 gestellt, und
       ein 34er Kasten ist dreizeilig und 151 Einheiten hoch — der Tipp in
       §12 landete darin, statt daneben. Gemessen, nicht geraten: der Lauf
       meldete EINE Marke „Randnotiz zur PDFNoch nicht bestätigt" statt
       zweier. Ein Abschnitt, der den Zustand des vorigen erbt, prüft nicht
       das, was er behauptet. */
    Store.setMeta('zeichnen:schrift', { familie: 'standard', groesse: 16,
      fett: false, rahmen: false, ausricht: 'links' });
    const skript = Store.addPage(null, { text: 'Ein Skript als PDF', icon: '📕' });
    const s1 = Store.addBlock(skript.id, 'pdfseite', { text: '', nr: 1, vonSeiten: 1,
      bw: breite, bh: hoehe, raumVersion: 1, marken: [] });
    Store.updateBlock(skript.id, { dokumentModus: true });
    await Store.flush(); App.oeffne(skript.id);
    return { skript: skript.id, seite: s1.id };
  }, { breite: BREITE, hoehe: HOEHE });
  await page.waitForSelector('.document-drawingbar');
  await page.waitForTimeout(400);
  await page.locator('[data-document-tool="text"]').click();
  await page.waitForTimeout(250);
  await tippe(100, 200);
  pr('Auch über einer PDF-Seite öffnet der Tipp ein Schreibfeld',
    await page.locator('.blatt-schreiber').count() === 1);
  await page.keyboard.type('Randnotiz zur PDF');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  const aufPdf = await page.evaluate(id =>
    JSON.parse(JSON.stringify(Store.getBlock(id)?.marken || [])), pdfIds.seite);
  pr('Und der Satz steht danach als Marke auf der PDF-Seite',
    aufPdf.length === 1 && aufPdf[0]?.art === 'text' && aufPdf[0]?.text === 'Randnotiz zur PDF',
    JSON.stringify(aufPdf.map((m: any) => m.text)));

  console.log('\n12 · Geht der Reiter zu, ist der Satz nicht weg');
  /* §51: „lieber langsamer neue Funktionen, als jemals Nutzerdaten zu
     verlieren." Ein Feld, das noch offen ist, wenn die Fläche verschwindet,
     nähme den Satz mit — und niemand hätte etwas gemerkt. Die Lebenswache
     aus E115 schliesst deshalb seit E597 auch das Schreibfeld.
     WARUM DAS ROT WERDEN KANN: ohne die Zeile in `registerLayer` steht hier
     eine leere Markenliste. */
  /* WEIT GENUG WEG, UND ZWAR WAAGRECHT. Zwei Stolpersteine auf einmal:
     Blatt-y 500 liegt bei 1440 × 960 ausserhalb des Fensters (siehe Kopf),
     und (100/300) lag INNERHALB des Kastens aus §11 — der ist bei
     Schriftgrösse 34 dreizeilig und 151 Einheiten hoch. Gemessen, nicht
     geraten: der Lauf meldete EINE Marke „Randnotiz zur PDFNoch nicht
     bestätigt" statt zweier. x=380 liegt rechts von seinem rechten Rand
     (100 + 238), ganz gleich wie hoch er ist. */
  await tippe(380, 420);
  await page.keyboard.type('Noch nicht bestätigt');
  await page.waitForTimeout(150);
  /* `pagehide` UND NICHT „auf eine andere Seite gehen". Beim Blättern
     übernimmt schon `blur` den Satz — diese Zusicherung wäre dort grün,
     auch wenn die Wache gar nichts täte, und wäre damit kein Beleg (§55.2).
     Gemessen: mit ausgebauter Wache blieb der Weg über das Blättern grün.
     `pagehide` ist der Fall, den NUR die Wache hält: der Reiter geht zu,
     ein `blur` kommt nicht mehr. */
  await page.evaluate(() => { window.dispatchEvent(new Event('pagehide')); });
  await page.waitForTimeout(400);
  const gerettet = await page.evaluate(id =>
    JSON.parse(JSON.stringify(Store.getBlock(id)?.marken || [])), pdfIds.seite);
  pr('Geht der Reiter zu, während das Feld offen ist, wird der Satz übernommen',
    gerettet.some((m: any) => m.text === 'Noch nicht bestätigt'),
    JSON.stringify(gerettet.map((m: any) => m.text)));

  console.log('\n13 · Die Schriftleiste wirkt auf den Kasten, in den gerade getippt wird');
  /* E599. Ohne das tippt man einen Satz, drückt „A+ Grösser" — und nichts
     passiert: die neue Grösse gilt erst dem NÄCHSTEN Kasten. Genau die
     Stelle, an der „was ich sehe, ist was dasteht" mitten im Schreiben
     bricht. Geprüft wird beides: das Feld auf dem Schirm UND die Marke
     danach; eine Zusicherung nur auf das Feld liesse offen, ob die Grösse
     auch ankommt. */
  /* DIE SCHRIFT AUSDRÜCKLICH AUF EINE MITTLERE STUFE. Die Stufen sind
     11 · 13 · 16 · 20 · 26 · 34; auf 34 ist „Grösser" ein Knopf, der nichts
     tut, und die Zusicherung wäre rot, ohne dass etwas kaputt wäre. §10 hat
     sie auf 34 gestellt — gemessen, nicht vermutet: der Lauf meldete
     „55,89 → 55,89" und `fontSize 34`. */
  await page.evaluate(async id => {
    Store.setMeta('zeichnen:schrift', { familie: 'standard', groesse: 16,
      fett: false, rahmen: false, ausricht: 'links' });
    await Store.flush();
    App.oeffne(id);
  }, pdfIds.skript);
  await page.waitForSelector('.document-drawingbar');
  await page.waitForTimeout(400);
  await page.locator('[data-document-tool="text"]').click();
  await page.waitForTimeout(250);
  /* (60/60) ist frei: der Kasten aus §11 beginnt bei (100/200), der aus
     §12 bei (380/420). Frei sein muss er bei JEDER Schriftgrösse — ein
     34er Kasten ist 151 Einheiten hoch, und darauf ist dieser Lauf schon
     einmal hereingefallen. */
  await tippe(60, 60);
  await page.keyboard.type('Wächst mit');
  const vorher = await page.evaluate(() =>
    parseFloat(getComputedStyle(document.querySelector('.blatt-schreiber')!).fontSize));
  await page.locator('[data-act="groesser"]').first().click();
  await page.waitForTimeout(250);
  const nachher = await page.evaluate(({ hoehe }) => {
    const feld = document.querySelector<HTMLTextAreaElement>('.blatt-schreiber');
    if (!feld) return null;
    const raum = document.querySelector('.blatt-marken')!.getBoundingClientRect();
    return { px: parseFloat(getComputedStyle(feld).fontSize), wert: feld.value,
      skala: raum.height / hoehe };
  }, { hoehe: HOEHE });
  pr('Das offene Feld wird sofort grösser', !!nachher && nachher.px > vorher,
    vorher + ' → ' + (nachher?.px ?? '—'));
  pr('… und der getippte Satz steht noch darin',
    nachher?.wert === 'Wächst mit', JSON.stringify(nachher?.wert));
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  const gewachsen = await page.evaluate(id =>
    JSON.parse(JSON.stringify(Store.getBlock(id)?.marken || [])), pdfIds.seite);
  const neueMarke = gewachsen.find((m: any) => m.text === 'Wächst mit');
  /* GEGEN DIE GEMESSENE GRÖSSE, nicht gegen 16: die Vorgabe wandert im Lauf
     (§10 stellt sie auf 34). Eine feste Zahl wäre hier grün, ohne dass der
     Knopf etwas getan hätte. */
  pr('Und die fertige Marke trägt die neue Grösse, nicht die alte',
    !!neueMarke && !!nachher && Math.abs(Number(neueMarke.fontSize) - nachher.px / (nachher.skala || 1)) < 1.5
      && nachher.px > vorher,
    JSON.stringify({ marke: neueMarke?.fontSize, feldPx: nachher?.px, vorher }));

  console.log('\n14 · Zweimal auf die leere Fläche heisst: hier schreiben');
  /* Der letzte Schritt zu Redurs Satz. Mit der Auswahl in der Hand musste
     man bisher erst das Textwerkzeug holen, nur um einen Satz daneben zu
     schreiben. EIN Tipp geht nicht — er bedeutet mit der Auswahl schon
     etwas; zwei bedeuteten bisher nichts. */
  await page.locator('[data-document-tool="select"]').click();
  await page.waitForTimeout(250);
  {
    const kasten = await flaeche.boundingBox();
    if (kasten) {
      /* (350/380) liegt rechts vom Kasten aus §11 (100 + 238 = 338) und
         über dem aus §12 (y 420) — frei bei jeder Schriftgrösse. */
      await page.mouse.dblclick(kasten.x + (350 / BREITE) * kasten.width,
                                kasten.y + (380 / HOEHE) * kasten.height);
      await page.waitForTimeout(300);
    }
  }
  pr('Zwei Tipps auf leeres Papier öffnen ein Schreibfeld, auch mit der Auswahl',
    await page.locator('.blatt-schreiber').count() === 1);
  await page.keyboard.type('Ohne Werkzeugwechsel');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  const ohneWechsel = await page.evaluate(id =>
    JSON.parse(JSON.stringify(Store.getBlock(id)?.marken || [])), pdfIds.seite);
  pr('Und der Satz steht danach auf der Seite',
    ohneWechsel.some((m: any) => m.text === 'Ohne Werkzeugwechsel'),
    JSON.stringify(ohneWechsel.map((m: any) => m.text)));

  console.log('\n15 · Und nichts ist dabei kaputtgegangen');
  pr('Keine Seitenfehler', errors.length === 0, errors.slice(0, 3).join(' · '));
} catch (fehler) {
  failed++;
  console.log('  ✗ Der Lauf ist abgebrochen — ' + String((fehler as Error)?.message || fehler));
} finally {
  await browser.close();
  server.close();
}
console.log('\n' + (passed + failed ? passed + '/' + (passed + failed) + ' bestanden · ✗=' + failed : ''));
process.exit(failed ? 1 : 0);
