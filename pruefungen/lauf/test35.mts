import _pfad from 'node:path';
const WURZEL = _pfad.resolve(import.meta.dirname, '../..');
import { chromium } from 'playwright';
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1500, height: 950 } });
  const f: any[] = []; p.on('pageerror', e => f.push('PAGEERROR: ' + e.message));
  p.on('console', m => { if (m.type() === 'error' && !/11434|CONNECTION_REFUSED|ERR_/i.test(m.text())) f.push('CONSOLE: ' + m.text()); });
  const pruef: any[] = []; const ok = (n: any, x: any) => pruef.push([n, !!x]);

  await p.goto('file://' + WURZEL + '/index.html');
  await p.waitForTimeout(1800);
  /* KEIN ERSTBESUCHER — das Willkommen wegräumen (E55).
     Seit §11 legt sich beim allerersten Öffnen ein Blatt über den ganzen
     Bildschirm. Für den, der Redion zum ersten Mal sieht, ist das richtig;
     hier misst niemand zum ersten Mal, und Playwright wartet dann
     sechzig Sekunden darauf, dass ein Knopf darunter anklickbar wird. */
  await p.evaluate(() => {
    Store.setMeta('rundgangGesehen', true);
    document.getElementById('rg-willkommen')?.remove();
    /* Und die Einrichtung der Hauptwelten: sie legt sich beim ersten Start
       über alles und fängt Klicks ab (E132). */
    document.querySelector('.produkt-onboarding-lage')?.remove();
    document.getElementById('rg-einladung')?.remove();
  });

  const seite = await p.evaluate(() => {
    const s = Store.addPage(null, { text: 'Menütest', icon: '📄' });
    Store.addBlock(s.id, 'h1', { text: 'Überschrift' });
    Store.addBlock(s.id, 'text', { text: 'Ein Satz mit fünf Wörtern hier.' });
    App.oeffne(s.id);
    return s.id;
  });
  await p.waitForTimeout(600);

  /* ================================================================== *
   * 1) DER AUFBAU DES MENÜS
   * ================================================================== */
  await p.click('#btn-page-menu');
  await p.waitForTimeout(500);

  const menue = await p.evaluate(() => {
    const m = document.querySelector('.menu');
    if (!m) return null;
    return {
      suche: m.querySelector<HTMLInputElement>('.menu-suche input')?.placeholder,
      kacheln: [...m.querySelectorAll<HTMLElement>('[data-schrift]')].map(x => x.textContent),
      eintraege: [...m.querySelectorAll<HTMLElement>('button[data-a]')].map(x => (x.textContent ?? '').trim()),
      schalter: [...m.querySelectorAll<HTMLElement>('.mschalter')].length,
      kenn: m.querySelector('.kenn')?.textContent,
      fuss: m.querySelector('.menu-fuss')?.textContent
    };
  });
  console.log('   Menü:', JSON.stringify(menue?.eintraege, null, 0));
  ok('Suchfeld wie bei Notion', /Suchaktionen/.test(menue?.suche || ''));
  ok('Drei Schriftkacheln', menue?.kacheln.length === 3 &&
     /Standard/.test(menue.kacheln[0] ?? '') && /Serife/.test(menue.kacheln[1] ?? '') && /Mono/.test(menue.kacheln[2] ?? ''));
  ok('Vier echte Schalter statt „an/aus"', menue?.schalter === 4);
  ok('Präsentieren trägt das Beta-Kennzeichen', menue?.kenn === 'Beta');
  ok('Fusszeile mit Wortzahl', /Wortzahl/.test(menue?.fuss || ''));

  /* Kam kein Menü, ist die Liste leer — dann findet `hat` nichts und jede
     der Zeilen darunter wird rot. */
  const eintraege = menue?.eintraege ?? [];
  const hat = (t: string) => eintraege.some(x => (x ?? '').includes(t));
  ok('Link kopieren mit Strg Alt L', eintraege.some(x => /Link kopieren.*Strg Alt L/.test(x)));
  ok('Duplizieren mit Strg D', eintraege.some(x => /Duplizieren.*Strg D/.test(x)));
  ok('Verschieben nach mit Strg ⇧ P', eintraege.some(x => /Verschieben nach.*Strg ⇧ P/.test(x)));
  ok('Archivieren steht im Menü', hat('Archivieren'));
  ok('In den Papierkorb verschieben', hat('In den Papierkorb verschieben'));
  ok('Präsentieren mit Strg Alt P', eintraege.some(x => /Präsentieren.*Strg Alt P/.test(x)));
  ok('Kleiner Text, Volle Breite, Seite anpassen, Seite sperren',
     hat('Kleiner Text') && hat('Volle Breite') && hat('Seite anpassen') && hat('Seite sperren'));
  ok('Mit KI verwenden', hat('Mit KI verwenden'));
  ok('Änderungen vorschlagen und Übersetzen',
     hat('Änderungen vorschlagen') && hat('Übersetzen'));
  ok('Updates und Analysen, Versionsverlauf',
     hat('Updates und Analysen') && hat('Versionsverlauf'));
  ok('Benachrichtigungen und Verbindungen',
     hat('Benachrichtigungen') && hat('Verbindungen'));
  ok('In ein Wiki umwandeln', hat('Wiki'));

  /* Verschieben nach und Präsentieren stehen nur einmal drin */
  const zaehl = (t: string) => eintraege.filter(x => (x ?? '').includes(t)).length;
  console.log('   Doppelte?', JSON.stringify({ verschieben: zaehl('Verschieben nach'),
    praesi: zaehl('Präsentier'), sperren: zaehl('sperren') }));
  ok('Kein Eintrag steht doppelt',
     zaehl('Verschieben nach') === 1 && zaehl('Präsentier') === 1);

  /* ================================================================== *
   * 2) SCHALTER KIPPEN IM MENÜ
   * ================================================================== */
  await p.evaluate(() => {
    const b2 = [...document.querySelectorAll<HTMLElement>('.menu button[data-a]')]
      .find(x => (x.textContent ?? '').includes('Kleiner Text'));
    b2?.click();
  });
  await p.waitForTimeout(500);
  const nachKlick = await p.evaluate(() => {
    const m = document.querySelector('.menu');
    const knoepfe = m ? [...m.querySelectorAll<HTMLElement>('button[data-a]')] : [];
    const b2 = knoepfe.find(x => (x.textContent ?? '').includes('Kleiner Text'));
    return { menueOffen: !!m, an: !!b2?.querySelector('.mschalter')?.classList.contains('an'),
             gespeichert: !!Store.getBlock(App.aktuelleSeite()).small,
             koerper: document.body?.dataset.small };
  });
  console.log('   Kleiner Text:', JSON.stringify(nachKlick));
  ok('Der Schalter kippt, das Menü bleibt offen', nachKlick.menueOffen && nachKlick.an);
  ok('Und die Seite merkt es sich', nachKlick.gespeichert && nachKlick.koerper === '1');

  await p.evaluate(() => {
    const b2 = [...document.querySelectorAll<HTMLElement>('.menu button[data-a]')]
      .find(x => (x.textContent ?? '').includes('Seite sperren'));
    b2?.click();
  });
  await p.waitForTimeout(500);
  ok('Seite sperren wirkt sofort', await p.evaluate(() =>
    Store.getBlock(App.aktuelleSeite()).gesperrt === true));
  await p.evaluate(() => {
    const b2 = [...document.querySelectorAll<HTMLElement>('.menu button[data-a]')]
      .find(x => (x.textContent ?? '').includes('Seite sperren'));
    b2?.click();
  });
  await p.waitForTimeout(400);

  /* ================================================================== *
   * 3) MIT KI VERWENDEN
   * ================================================================== */
  await p.evaluate(() => {
    const b2 = [...document.querySelectorAll<HTMLElement>('.menu button[data-a]')]
      .find(x => (x.textContent ?? '').includes('Mit KI verwenden'));
    b2?.click();
  });
  await p.waitForTimeout(500);
  const kiMenu = await p.evaluate(() => {
    const m = [...document.querySelectorAll<HTMLElement>('.menu')].pop();
    return m ? [...m.querySelectorAll<HTMLElement>('[data-k]')].map(x => (x.textContent ?? '').trim()) : [];
  });
  console.log('   Mit KI verwenden:', JSON.stringify(kiMenu));
  ok('Als KI-Fähigkeit verwenden', kiMenu.some(x => /Als KI-Fähigkeit verwenden/.test(x)));
  ok('Als KI-Anweisung verwenden', kiMenu.some(x => /Als KI-Anweisung verwenden/.test(x)));
  ok('Als KI-Meeting-Anweisung verwenden', kiMenu.some(x => /Meeting-Anweisung/.test(x)));
  ok('Jeder Eintrag erklärt sich', await p.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('.menu .sub')].length >= 3));

  /* Seite zur Anweisung machen */
  await p.evaluate(() => {
    const m = [...document.querySelectorAll<HTMLElement>('.menu')].pop();
    m?.querySelector<HTMLElement>('[data-k="anweisung"]')?.click();
  });
  await p.waitForTimeout(600);
  const anweisung = await p.evaluate(() => ({
    text: Store.getMeta('ki:persoenlich', ''),
    seite: Store.getMeta('ki:anweisungSeite', '')
  }));
  console.log('   Anweisung:', JSON.stringify(anweisung));
  ok('Der Seiteninhalt wird zur KI-Anweisung',
     /Überschrift/.test(anweisung.text ?? '') && anweisung.seite === seite);

  /* Seite zur Fähigkeit machen */
  await p.click('#btn-page-menu'); await p.waitForTimeout(400);
  await p.evaluate(() => {
    const b2 = [...document.querySelectorAll<HTMLElement>('.menu button[data-a]')]
      .find(x => (x.textContent ?? '').includes('Mit KI verwenden'));
    b2?.click();
  });
  await p.waitForTimeout(400);
  await p.evaluate(() => {
    const m = [...document.querySelectorAll<HTMLElement>('.menu')].pop();
    m?.querySelector<HTMLElement>('[data-k="faehig"]')?.click();
  });
  await p.waitForTimeout(500);
  await p.evaluate(() => {
    const i = document.querySelector<HTMLInputElement>('.overlay input');
    if (i) { i.value = 'Menütest-Fähigkeit'; document.querySelector<HTMLElement>('.overlay [data-a="ok"]')?.click(); }
  });
  await p.waitForTimeout(600);
  const faehig = await p.evaluate(() => KI.faehigkeiten().find((x: any) => x.name === 'Menütest-Fähigkeit'));
  console.log('   Fähigkeit aus der Seite:', JSON.stringify(faehig && faehig.name));
  ok('Aus der Seite wird eine Fähigkeit', !!faehig && /Überschrift/.test(faehig.auftrag ?? ''));
  ok('Die Fähigkeit weiss, von welcher Seite sie kommt', faehig.seiteId === seite);

  /* Meeting-Anweisung */
  await p.click('#btn-page-menu'); await p.waitForTimeout(400);
  await p.evaluate(() => {
    [...document.querySelectorAll<HTMLElement>('.menu button[data-a]')]
      .find(x => (x.textContent ?? '').includes('Mit KI verwenden'))?.click();
  });
  await p.waitForTimeout(400);
  await p.evaluate(() => {
    const m = [...document.querySelectorAll<HTMLElement>('.menu')].pop();
    m?.querySelector<HTMLElement>('[data-k="meeting"]')?.click();
  });
  await p.waitForTimeout(500);
  ok('Meeting-Anweisung wird gemerkt', await p.evaluate(() =>
    /Überschrift/.test(Store.getMeta('meeting:anweisung', ''))));

  /* ================================================================== *
   * 4) BENACHRICHTIGUNGEN — GENAU ZWEI
   * ================================================================== */
  await p.click('#btn-page-menu'); await p.waitForTimeout(400);
  await p.evaluate(() => {
    [...document.querySelectorAll<HTMLElement>('.menu button[data-a]')]
      .find(x => (x.textContent ?? '').includes('Benachrichtigungen'))?.click();
  });
  await p.waitForTimeout(500);
  const benach = await p.evaluate(() => {
    const m = [...document.querySelectorAll<HTMLElement>('.menu')].pop();
    if (!m) return null;
    return { eintraege: [...m.querySelectorAll<HTMLElement>('[data-b]')].map(x => (x.textContent ?? '').trim()),
             fuss: m.querySelector('.menu-fuss')?.textContent };
  });
  console.log('   Benachrichtigungen:', JSON.stringify(benach?.eintraege));
  ok('Genau zwei Möglichkeiten', benach?.eintraege.length === 2);
  ok('Alle Kommentare und Antworten mit @-Erwähnungen',
     /Alle Kommentare/.test(benach?.eintraege[0] ?? '') &&
     /Antworten und @-Erwähnungen/.test(benach?.eintraege[1] ?? ''));
  ok('Der Hinweis auf Unterseiten steht darunter', /Unterseiten/.test(benach?.fuss || ''));

  await p.evaluate(() => {
    const m = [...document.querySelectorAll<HTMLElement>('.menu')].pop();
    m?.querySelector<HTMLElement>('[data-b="erwaehnungen"]')?.click();
  });
  await p.waitForTimeout(500);
  ok('Umstellen wirkt', await p.evaluate(() =>
    Store.getBlock(App.aktuelleSeite()).benachrichtigung === 'erwaehnungen'));

  /* ================================================================== *
   * 5) ARCHIVIEREN
   * ================================================================== */
  await p.click('#btn-page-menu'); await p.waitForTimeout(400);
  await p.evaluate(() => {
    [...document.querySelectorAll<HTMLElement>('.menu button[data-a]')]
      .find(x => (x.textContent ?? '').includes('Archivieren'))?.click();
  });
  await p.waitForTimeout(700);

  const nachArchiv = await p.evaluate(() => ({
    imBaum: [...document.querySelectorAll<HTMLElement>('#tree .row')].some(x => (x.textContent ?? '').includes('Menütest')),
    /* Ohne gefundenen Schlüssel bleibt es bei false — die Prüfung wird dann
       rot, statt an einem Zugriff auf `undefined` zu scheitern. */
    markiert: (() => {
      const k = Object.keys(Store.cache.blocks).find(k2 => Store.cache.blocks[k2].text === 'Menütest') ?? '';
      return !!(k && Store.cache.blocks[k].archiviert);
    })(),
    imPapierkorb: Store.trashed().some(x => x.text === 'Menütest')
  }));
  console.log('   Nach Archivieren:', JSON.stringify(nachArchiv));
  ok('Archiviertes verschwindet aus der Seitenleiste', !nachArchiv.imBaum);
  ok('Es ist als archiviert vermerkt', nachArchiv.markiert);
  ok('Und liegt trotzdem nicht im Papierkorb', !nachArchiv.imPapierkorb);

  await p.evaluate(() => App.papierkorb());
  await p.waitForTimeout(600);
  const pkArchiv = await p.evaluate(() => ({
    gruppe: [...document.querySelectorAll<HTMLElement>('.pk-res .grp')].map(x => x.textContent),
    eintrag: [...document.querySelectorAll<HTMLElement>('[data-arch]')].map(x => x.textContent),
    zurueck: !!document.querySelector('[data-a="entarchiv"]')
  }));
  console.log('   Papierkorb mit Archiv:', JSON.stringify(pkArchiv.gruppe));
  ok('Im Papierkorb steht das Archiv als eigene Gruppe',
     (pkArchiv.gruppe ?? '').includes('Archiv') && (pkArchiv.gruppe ?? '').includes('Papierkorb'));
  ok('Die archivierte Seite steht dort', pkArchiv.eintrag.some(x => /Menütest/.test(x)));
  ok('Mit einem Pfeil zum Zurückholen', pkArchiv.zurueck);

  await p.evaluate(() => document.querySelector<HTMLElement>('[data-a="entarchiv"]')?.click());
  await p.waitForTimeout(600);
  const zurueck = await p.evaluate(() => {
    document.querySelectorAll<HTMLElement>('.overlay').forEach(o => o.remove());
    return [...document.querySelectorAll<HTMLElement>('#tree .row')].some(x => (x.textContent ?? '').includes('Menütest'));
  });
  ok('Zurückholen bringt sie in die Seitenleiste', zurueck);

  /* ================================================================== *
   * 6) TASTENKÜRZEL
   * ================================================================== */
  await p.evaluate(() => {
    const s = Store.addPage(null, { text: 'Kürzeltest' });
    Store.addBlock(s.id, 'text', { text: 'Inhalt' });
    App.oeffne(s.id);
  });
  await p.waitForTimeout(600);
  await p.keyboard.press('Control+Alt+p');
  await p.waitForTimeout(700);
  const praesi = await p.evaluate(() => {
    const da = !!document.querySelector('.praesi, .praesentation, #praesi') ||
               /Präsentation/i.test(document.body?.textContent ?? '');
    document.querySelectorAll<HTMLElement>('.overlay, .praesi, .praesentation').forEach(o => o.remove());
    document.body?.classList.remove('praesi-an');
    return da;
  });
  console.log('   Strg+Alt+P:', praesi);
  ok('Strg + Alt + P startet die Präsentation', praesi);

  /* ================================================================== *
   * 7) NACH DEM NEULADEN
   * ================================================================== */
  await p.reload();
  await p.waitForTimeout(1800);
  /* Nach dem Neuladen ist die Einrichtung der Hauptwelten wieder da —
     sie erscheint 300 ms nach dem Start und fängt Klicks ab (E132). */
  await p.evaluate(() => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelector('.produkt-onboarding-lage')?.remove();
  });
  const danach = await p.evaluate(() => ({
    anweisung: /Überschrift/.test(Store.getMeta('ki:persoenlich', '')),
    faehig: KI.faehigkeiten().some((x: any) => x.name === 'Menütest-Fähigkeit'),
    benach: Object.values(Store.cache.blocks).some(b2 => b2.benachrichtigung === 'erwaehnungen')
  }));
  console.log('   Nach Neuladen:', JSON.stringify(danach));
  ok('KI-Anweisung bleibt', danach.anweisung);
  ok('Die Fähigkeit bleibt', danach.faehig);
  ok('Die Benachrichtigungsstufe bleibt', danach.benach);

  console.log('\n=== ERGEBNIS ===');
  pruef.forEach(([n, x]) => console.log((x ? '✅ ' : '❌ ') + n));
  console.log('\n' + pruef.filter(x => x[1]).length + '/' + pruef.length + ' bestanden');
  if (f.length) { console.log('\nFEHLER:'); f.slice(0, 10).forEach(x => console.log('  ' + x)); }
  else console.log('Keine JS-Fehler.');
  await b.close();
  /* EIN RÜCKGABEWERT. Ohne ihn endet der Lauf mit 0, auch wenn oben ein ❌
     steht — und der Orchestrator meldete das jahrelang als „bestanden"
     (E56). Seit dem 8. August liest er die Ausgabe mit; die ehrliche
     Auskunft gehört trotzdem hierher, denn wer den Lauf einzeln startet,
     sieht nur den Rückgabewert. */
  process.exit(pruef.some((x: any) => !x[1]) ? 1 : 0);
})();
