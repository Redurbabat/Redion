/* Die Oberfläche am Handy und am PC — gegen Notions Aufbau gemessen. */
import _pfad from 'node:path';
const WURZEL = _pfad.resolve(import.meta.dirname, '../..');
import { chromium } from 'playwright';

(async () => {
  const b = await chromium.launch();
  const f: any[] = [];
  const pruef: any[] = []; const ok = (n: any, x: any, z?: any) => pruef.push([n, !!x, z]);

  const bauePage = async (p: any) => {
    await p.goto('file://' + WURZEL + '/index.html');
    await p.waitForTimeout(1900);
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
    await p.evaluate(() => {
      const s = Store.addPage(null, { text: 'Layout-Probe', icon: '🎯' });
      Store.addBlock(s.id, 'h1',   { text: 'Überschrift' });
      Store.addBlock(s.id, 'text', { text: 'Ein Absatz mit Text.' });
      Store.addBlock(s.id, 'todo', { text: 'Eine Aufgabe' });
      const { collectionId } = Store.addDatabase(s.id, 'Beispiel', {
        title: { name: 'Name', type: 'title' },
        st:    { name: 'Status', type: 'select', options: [{ name: 'Offen', color: 'gray' }] }
      }, 'table');
      const r = Store.addRow(collectionId, {});
      Store.updateBlock(r.id, { text: 'Zeile 1' });
      App.oeffne(s.id);
    });
    await p.waitForTimeout(1000);
  };

  /* ================= TEIL A — iPhone 13 Pro Max ====================== */
  const t = await b.newPage({ viewport: { width: 428, height: 926 } });
  t.on('pageerror', e => f.push('PAGEERROR: ' + e.message));
  t.on('console', m => { if (m.type() === 'error' && !/11434|CONNECTION_REFUSED|ERR_/i.test(m.text())) f.push('CONSOLE: ' + m.text()); });
  await bauePage(t);

  const handy = await t.evaluate(() => {
    /* Ein Element, das dasein MUSS. Fehlt es, misst der Lauf nichts mehr —
       dann ist eine Meldung mit dem Selektor besser als „Cannot read
       properties of null" zwanzig Zeilen weiter. */
    const musselement = (sel: string): HTMLElement => {
      const x = document.querySelector<HTMLElement>(sel);
      if (!x) throw new Error(sel + ' ist nicht da.');
      return x;
    };
    const r = (s: any) => { const e = document.querySelector(s); return e ? e.getBoundingClientRect() : null; };
    const tb = document.getElementById('topbar');
    if (!tb) throw new Error('topbar ist nicht da — der Lauf misst sonst nichts.');
    return {
      mainLinks:  Math.round(r('#main').left),
      mainBreite: Math.round(r('#main').width),
      seiteBreite: Math.round(r('#page').width),
      seitenleistePos: getComputedStyle(musselement('#sidebar')).position,
      /* NICHT `offsetParent` (E226). Ein Element mit `position:fixed` gibt
         dort `null` zurück, OBWOHL es sichtbar ist — der Sucher stand
         deshalb nie in dieser Liste, solange E223 ihn fest ans Fenster
         stellte, und die erwartete Liste hatte sich still darauf
         eingerichtet. Gefragt ist Sichtbarkeit, nicht Positionierung. */
      kopfKnoepfe: [...tb.querySelectorAll<HTMLElement>('button')]
        .filter(x => { const r = x.getBoundingClientRect();
                       return r.width > 0 && r.height > 0
                              && getComputedStyle(x).visibility !== 'hidden'; })
        .map(x => x.id),
      kopfUeberlauf: tb.scrollWidth - tb.clientWidth,
      krume: musselement('#crumb').textContent.trim(),
      seitlicherUeberlauf: document.documentElement.scrollWidth - 428,
      obenLeiste: [...document.querySelectorAll<HTMLElement>('#handy-oben button')].map(x => x.id),
      /* Die schwebende Leiste gibt es seit E236 nicht mehr; ihre drei Wege
         stehen rechts in der Menüleiste. */
      untenLeiste: [...document.querySelectorAll<HTMLElement>('#menueband .mb-rechts > button')]
        .map(x => x.id).filter(Boolean),
      /* offsetParent ist bei position:fixed immer null — deshalb den
         berechneten Stil fragen. */
      untenSichtbar: getComputedStyle(musselement('#menueband .mb-rechts')).display !== 'none',
      obenSichtbar: getComputedStyle(musselement('#handy-oben')).display !== 'none',
      griffeAus: getComputedStyle(document.querySelector('.blk > .handles') ?? document.body).display
    };
  });
  console.log('   Handy:', JSON.stringify(handy));

  ok('Der Inhalt beginnt ganz links — kein leerer Streifen', handy.mainLinks === 0, handy.mainLinks + ' px');
  ok('Er nimmt die volle Breite ein', handy.mainBreite === 428 && handy.seiteBreite === 428,
     handy.mainBreite + '/' + handy.seiteBreite);
  ok('Die Seitenleiste liegt fest über der Seite, nicht im Fluss',
     handy.seitenleistePos === 'fixed', handy.seitenleistePos);
  ok('Nichts läuft seitlich heraus', handy.seitlicherUeberlauf <= 0, handy.seitlicherUeberlauf + ' px');
  /* DIE KOPFZEILE HAT NUR NOCH, WAS ZUR SEITE GEHÖRT. Die Bereiche stehen
     als Pillen darüber, Suchen und Neu unten beim Daumen, das ☰ ist der
     Kreis links oben. Was hier blieb, ist zurück und das Seitenmenü — und
     mehr braucht eine Seite auch nicht.

     Vorher standen hier fünf Knöpfe, davon drei mit einem Ziel, das es
     nun zweimal gab. */
  ok('Die Kopfzeile zeigt nur noch ‹ und ⋯',
     handy.kopfKnoepfe.join(',') === 'btn-back,btn-page-menu',
     handy.kopfKnoepfe.join(','));
  ok('Die Kopfzeile läuft nicht über', handy.kopfUeberlauf <= 0, handy.kopfUeberlauf + ' px');
  ok('Der Seitentitel steht in der Kopfzeile', /Layout-Probe/.test(handy.krume ?? ''), handy.krume);
  /* SEIT DEM UMBAU NACH DER VORLAGE stehen die Bereiche OBEN als Pillen und
     unten die drei Dinge, die man von überall aus will. Geprüft wird beides
     — vorher stand hier nur die untere Leiste, und die gab es damals auch
     nur einmal. */
  /* Fünf Bereiche seit E132: „Lernen" ist mit den Produktwelten
     dazugekommen. */
  ok('Oben stehen Konto und die fünf Bereiche als Pillen',
     handy.obenSichtbar &&
     handy.obenLeiste.join(',') === 'hl-dok,hl-start,hl-lernen,hl-bespr,hl-mehr',
     handy.obenLeiste.join(','));
  ok('Unten stehen Suchen, KI fragen und Neu',
     handy.untenSichtbar &&
     ['mb-suche', 'mb-ki', 'mb-konto'].every(id => handy.untenLeiste.includes(id)),
     handy.untenLeiste.join(','));
  ok('Die Blockgriffe sind aus, wie in Notion am Handy', handy.griffeAus === 'none', handy.griffeAus);

  /* Was aus der Kopfzeile verschwunden ist, muss im ⋯-Menü stehen */
  await t.evaluate(() => {
    App.seitenMenue(document.getElementById('btn-page-menu'), Store.getBlock(App.aktuelleSeite()));
  });
  await t.waitForTimeout(500);
  const imMenue = await t.evaluate(() => {
    const txt = [...document.querySelectorAll<HTMLElement>('.menu button[data-a]')].map(x => x.textContent);
    const blatt = document.querySelector('.menu')?.classList.contains('blatt');
    document.querySelectorAll<HTMLElement>('.menu, .menu-grund').forEach(x => x.remove());
    return { txt, blatt };
  });
  const hat = (s: any) => imMenue.txt.some(x => (x ?? '').includes(s));
  ok('Teilen, Versionsverlauf, Kommentare und Automationen stehen im ⋯-Menü',
     hat('Teilen') && hat('Versionsverlauf') && hat('Kommentare') && hat('Automationen'),
     imMenue.txt.length + ' Einträge');
  ok('Und das Menü ist am Handy ein Blatt von unten', imMenue.blatt);

  /* Der Kreis links oben — er hat seit E38 nicht mehr die Rolle des ☰.
     Vorher zog er die SEITENLEISTE DES RECHNERS als Schublade herein, mit
     Baum, Reitern und 33-px-Zeilen auf 390 px geschoben. Jetzt öffnet er
     ein Blatt über den ganzen Bildschirm mit Fingerzeilen. */
  await t.click('#mb-konto');
  await t.waitForTimeout(400);
  const auf = await t.evaluate(() => {
    const bl = document.getElementById('r-blatt');
    const r = bl?.getBoundingClientRect();
    return {
      blatt: !!bl,
      voll: !!r && Math.round(r.width) === innerWidth && Math.round(r.height) === innerHeight,
      schublade: document.body?.classList.contains('side-offen'),
      wege: bl ? bl.querySelectorAll('.rm-gruppe button').length : 0
    };
  });
  ok('Der Kreis links oben öffnet das R-Blatt', auf.blatt && auf.voll, JSON.stringify(auf));
  ok('… und NICHT mehr die Schublade des Rechners', auf.schublade === false,
     JSON.stringify(auf));
  ok('Es führt weiter als die alte Schublade', auf.wege >= 10, String(auf.wege));

  /* WAS SICH DAMIT AUCH GEÄNDERT HAT, und es gehört hierher: die Pillen
     oben sind jetzt VERDECKT. Vorher stand hier die Zusage, sie blieben
     „die ganze Zeit sichtbar und anklickbar", und das war die Bedingung,
     unter der die Vollbreite zulässig war. Ein Blatt über den ganzen
     Bildschirm hebt sie auf — also muss es seinen eigenen Ausgang haben,
     und zwar mehr als einen. Beide werden hier geprüft: das Kreuz und der
     Weg, der einen gleich dorthin bringt, wo man hinwollte. */
  await t.click('#r-blatt .rm-zu');
  await t.waitForTimeout(400);
  ok('Das Kreuz führt wieder hinaus', await t.evaluate(() =>
    !document.getElementById('r-blatt')));

  await t.click('#mb-konto');
  await t.waitForTimeout(400);
  await t.click('#r-blatt [data-r="start"]');
  await t.waitForTimeout(500);
  /* DIE PILLE HEISST JETZT „HEUTE". `produktwelten.ts:258` benennt
     `hl-start` am Telefon in „Heute" um (E132) — dieselbe Taste, dasselbe
     Ziel, ein anderer Name. Geprüft wird deshalb die Kennung und nicht mehr
     der Text: ein Name kann sich ändern, ohne dass der Weg kaputt ist. */
  ok('Und „Heute" im Blatt führt hinaus UND dorthin', await t.evaluate(() =>
    !document.getElementById('r-blatt') &&
    document.getElementById('hl-start')?.classList.contains('an') === true));

  /* ================= TEIL B — Windows-Desktop ======================== */
  const d = await b.newPage({ viewport: { width: 1400, height: 900 } });
  d.on('pageerror', e => f.push('PAGEERROR(PC): ' + e.message));
  await bauePage(d);

  const pc = await d.evaluate(() => {
    /* Ein Element, das dasein MUSS. Fehlt es, misst der Lauf nichts mehr —
       dann ist eine Meldung mit dem Selektor besser als „Cannot read
       properties of null" zwanzig Zeilen weiter. */
    const musselement = (sel: string): HTMLElement => {
      const x = document.querySelector<HTMLElement>(sel);
      if (!x) throw new Error(sel + ' ist nicht da.');
      return x;
    };
    const tb = document.getElementById('topbar');
    if (!tb) throw new Error('tb ist nicht da — der Lauf misst sonst nichts.');
    const s = document.getElementById('sidebar');
    if (!s) throw new Error('sidebar ist nicht da — der Lauf misst sonst nichts.');
    /* Die Kante gibt es erst seit E272 Phase F; ohne sie (Einzeldatei
       älteren Standes) wird 0 gemessen und der Punkt sagt es. */
    const kante = document.getElementById('kante');
    return {
      seitenleiste: Math.round(s.getBoundingClientRect().width),
      seitenleistePos: getComputedStyle(s).position,
      kante: kante ? Math.round(kante.getBoundingClientRect().width) : 0,
      /* Seit dem Studio (E440) sagt der Griff, wie breit die Kante ist. */
      navBreite: Number(document.getElementById('studio-divider')?.getAttribute('aria-valuenow')) || 0,
      /* Wo der INHALT anfängt, nicht wo `#main` anfängt: `#main` läuft
         seit Phase F über die volle Breite, weil das Menüband darin oben
         quer darüber steht. Gemessen wird die Rollfläche. */
      inhaltLinks: Math.round(musselement('#scroll').getBoundingClientRect().left),
      mainLinks: Math.round(musselement('#main').getBoundingClientRect().left),
      /* Sichtbarkeit, nicht Positionierung (E226) — siehe oben. */
      kopfKnoepfe: [...tb.querySelectorAll<HTMLElement>('button')]
        .filter(x => { const r = x.getBoundingClientRect();
                       return r.width > 0 && r.height > 0
                              && getComputedStyle(x).visibility !== 'hidden'; })
        .map(x => x.id),
      untenAus: !document.getElementById('handy-unten') &&
                getComputedStyle(musselement('#handy-oben')).display === 'none',
      griffe: !!document.querySelector('.blk > .handles'),
      dbLeiste: [...document.querySelectorAll<HTMLElement>('.db-tools button')].length,
      neuKnopf: !!document.querySelector('.db-tools .db-neu, .db-tools .primaer, .db-neu')
    };
  });
  console.log('   PC:', JSON.stringify(pc));

  /* 240 px UND NICHT 260. E201 hat die Seitenleiste schmaler gemacht —
     „zwanzig Punkte sind dort keine Kosmetik, sie sind zwanzig Punkte
     Arbeitsfläche" steht als Begründung in der CSS. Dieser Punkt behielt
     die alte Zahl und war seither rot; aufgefallen ist es erst beim
     vollständigen Durchlauf, weil er in keiner der Suiten steckt, die man
     nach einer Änderung einzeln startet.

     Die Zahl bleibt hier ausgeschrieben und wird nicht aus der CSS
     gelesen: dieser Punkt soll ja gerade merken, wenn sich die Breite
     ändert, ohne dass jemand es wollte. */
  /* SEIT E272 PHASE F IST ES DIE KONTEXTKANTE UND NICHT DIE SEITENLEISTE.
     240 Pixel zeigten auf jeder Seite dieselben 32 Knöpfe; die Kante zeigt
     54 Pixel breit sechs bis zehn, und zwar die des Ortes, an dem man
     steht. Wohin man geht, steht im Reiter „Gehen" (Phase E).

     Die Zahl bleibt hier ausgeschrieben, aus demselben Grund wie vorher:
     dieser Punkt soll merken, wenn die Breite sich ändert, ohne dass
     jemand es wollte. Die Seitenleiste ist NICHT gelöscht — am Telefon ist
     sie die Schublade, und `#tree` darin ist der einzige Seitenbaum, den
     es gibt (die Lade schiebt ihn sich herüber). Am Rechner ist sie
     `display:none`, und genau das wird hier gemessen. */
  /* SEIT DEM STUDIO (E440) IST DIE KANTE DIE STUDIO-NAVIGATION. Sie ist
     nicht mehr 54 Pixel schmal, sondern 148 bis 260 breit (Standard 184,
     kompakt 62) und trägt Beschriftungen. Die Breite steht am Griff
     `#studio-divider` als aria-valuenow — gemessen wird gegen DIESEN Wert,
     nicht gegen eine Zahl, denn der Mensch darf ziehen. Fest bleibt: der
     Inhalt beginnt genau hinter ihr. (E456 hat den Punkt vom Studio
     eingeholt; bis dahin stand er seit dem Merge rot.) */
  ok('Am PC ist die Kontextkante da und so breit wie die Studio-Navigation',
     pc.kante >= 148 && pc.kante <= 260 && pc.kante === pc.navBreite,
     pc.kante + ' px, der Griff sagt ' + pc.navBreite);
  ok('Und die alte 240-px-Seitenleiste ist dort weg',
     pc.seitenleiste === 0, pc.seitenleistePos + ' / ' + pc.seitenleiste);
  ok('Der Inhalt beginnt hinter der Kante', pc.inhaltLinks === pc.kante,
     pc.inhaltLinks + ' px hinter ' + pc.kante + ' px Kante');
  /* SEIT E219 SIND ES AM PC ABSICHTLICH WENIGER. Fünf Zeichen — Teilen,
     Kommentare, Versionsverlauf, Automationen, Link kopieren — stehen im
     ⋯-Menü, und zwar in demselben Block, der dort schon fürs Telefon war.
     „Alle Knöpfe" wäre damit die falsche Frage. Die richtige ist: sind es
     die fünf, die bleiben sollen, und kommt der Rest zurück, wenn man die
     ruhige Fassung abschaltet? */
  /* SECHS, NICHT FÜNF — und der Unterschied ist eine Lehre (E226). Der
     Sucher gehört selbstverständlich dazu; er stand nur deshalb nicht in
     dieser Liste, weil `offsetParent` bei `position:fixed` `null` liefert.
     Die Zeile war grün, weil sie den Knopf nicht SAH, nicht weil er weg
     war. Als E224 ihn zurück in den Fluss holte, wurde sie rot — und hat
     damit ihren eigenen blinden Fleck gemeldet. */
  /* OHNE `btn-suche-mitte` SEIT E272: die grosse Suchbox in der Kopfzeile ist
     entfallen, weil über ihr die Reiterzeile steht und dort schon ein ⌕ sitzt
     (`mb-suche`, E236). Zwei Sucheingänge übereinander sind der doppelte Kopf,
     den der Premium-Auftrag abschafft. Die Suche selbst ist unverändert
     erreichbar: ⌕ oben, Strg + P, „Suchen" in der Seitenleiste, und am Telefon
     `btn-suche-handy` weiterhin hier in der Kopfzeile. */
  const SOLL_RUHIG = ['btn-back', 'btn-fwd', 'btn-ai', 'btn-fav', 'btn-page-menu'];
  ok('Die Kopfzeile zeigt am PC die sechs, die bleiben',
     SOLL_RUHIG.every(k => pc.kopfKnoepfe.includes(k)) &&
     pc.kopfKnoepfe.length === SOLL_RUHIG.length,
     pc.kopfKnoepfe.join(', '));

  const ohneRuhig = await d.evaluate(() => {
    (globalThis as any).Ruhig?.setzen(false);
    return [...document.querySelectorAll<HTMLElement>('#topbar button')]
      .filter(b => { const r = b.getBoundingClientRect();   /* E226 */
                     return r.width > 0 && r.height > 0
                            && getComputedStyle(b).visibility !== 'hidden'; })
      .map(b => b.id).filter(Boolean);
  });
  ok('Und ausgeschaltet stehen wieder alle da',
     ohneRuhig.length >= 10, ohneRuhig.length + ' Stück: ' + ohneRuhig.join(', '));
  await d.evaluate(() => { (globalThis as any).Ruhig?.setzen(true); });
  ok('Die Handy-Leiste unten ist am PC aus', pc.untenAus);
  ok('Die Blockgriffe sind am PC da', pc.griffe);
  ok('Die Datenbank-Werkzeugleiste ist vollständig', pc.dbLeiste >= 7, pc.dbLeiste + ' Knöpfe');

  /* AUCH BEI EINER BREITE, DIE NICHT DIE VORGABE IST (E716). Der Punkt
     „so breit wie die Studio-Navigation" oben misst bei 184 — und dort
     stimmen Kante und Attribut ZUFÄLLIG überein, auch wenn die Spalte sich
     nie bewegt. Genau so stand der Trenner ein Jahr lang still, ohne dass
     dieser Lauf es sah (Redur, 29. September: „der linie wo man die feld
     grösser und kleiner macht , funktioniert nicht…"). Deshalb hier: Ende
     drücken, dann neu laden — und beide Male die GEZEICHNETE Kante gegen
     das Attribut messen. */
  const kanteJetzt = () => d.evaluate(() => ({
    kante: Math.round(document.getElementById('kante')?.getBoundingClientRect().width || 0),
    navBreite: Number(document.getElementById('studio-divider')?.getAttribute('aria-valuenow')) || 0
  }));
  await d.locator('#studio-divider').focus();
  await d.keyboard.press('End');
  const amEnde = await kanteJetzt();
  ok('Nach „Ende" ist die Kante wirklich 260 px breit, und der Griff sagt dasselbe',
     amEnde.kante === 260 && amEnde.kante === amEnde.navBreite,
     amEnde.kante + ' px, der Griff sagt ' + amEnde.navBreite);
  await d.evaluate(() => Store.flush());
  /* `Store.flush()` schreibt den Stapel der Blöcke — `setMeta` schreibt
     seinen eigenen `put` daneben, und auf den wartet flush NICHT. Unter
     Last schnitt das Neuladen ihn ab (gesehen: „184 px, der Griff sagt
     184"). Ein Lesen über eine zweite Verbindung kommt in IndexedDB erst
     nach dem älteren Schreiben dran — danach ist die Breite auf der Platte. */
  await d.evaluate(() => new Promise<void>(fertig => {
    const r = indexedDB.open(KONSTANTEN.ABLAGE_NAME);
    r.onsuccess = () => {
      try {
        const g = r.result.transaction('meta', 'readonly').objectStore('meta').get('studio:navigation-breite');
        g.onsuccess = g.onerror = () => { r.result.close(); fertig(); };
      } catch { r.result.close(); fertig(); }
    };
    r.onerror = () => fertig();
  }));
  await d.reload();
  await d.waitForFunction(() => typeof App !== 'undefined' && typeof StudioSchale !== 'undefined' &&
    !!Store.cache.blocks && !!document.body.dataset.studioNav);
  /* Unter Last kommt das erste Bild spät: auf die Übereinstimmung warten
     (höchstens 5 s), dann messen — bleibt sie aus, misst der Punkt rot. */
  await d.waitForFunction(() => Math.round(document.getElementById('kante')?.getBoundingClientRect().width || 0) ===
    Number(document.getElementById('studio-divider')?.getAttribute('aria-valuenow')), null, { timeout: 5000 }).catch(() => {});
  const nachLaden = await kanteJetzt();
  ok('Und nach dem Neuladen steht die gemerkte Breite da — gezeichnet, nicht nur im Attribut',
     nachLaden.kante === 260 && nachLaden.kante === nachLaden.navBreite,
     nachLaden.kante + ' px, der Griff sagt ' + nachLaden.navBreite);

  console.log('\n=== OBERFLÄCHE PC UND HANDY ===');
  pruef.forEach(([n, x, z]) => console.log((x ? '✅ ' : '❌ ') + n + (x || z === undefined ? '' : '   → ' + z)));
  console.log('\n' + pruef.filter(x => x[1]).length + '/' + pruef.length + ' bestanden');
  if (f.length) { console.log('\nFEHLER:'); f.slice(0, 8).forEach(x => console.log('  ' + x)); }
  else console.log('Keine JS-Fehler.');
  await b.close();
  /* EIN RÜCKGABEWERT. Ohne ihn endet der Lauf mit 0, auch wenn oben ein ❌
     steht — und der Orchestrator meldete das jahrelang als „bestanden"
     (E56). Seit dem 8. August liest er die Ausgabe mit; die ehrliche
     Auskunft gehört trotzdem hierher, denn wer den Lauf einzeln startet,
     sieht nur den Rückgabewert. */
  process.exit(pruef.some((x: any) => !x[1]) ? 1 : 0);
})();
