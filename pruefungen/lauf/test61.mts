/* Der erste Rundgang und die Übersicht „Was Redion kann" */
import _pfad from 'node:path';
const WURZEL = _pfad.resolve(import.meta.dirname, '../..');
import { chromium } from 'playwright';
let ok = 0, bad = 0;
const pruef = (n: any, ist: any, soll: any) => {
  const gut = JSON.stringify(ist) === JSON.stringify(soll);
  console.log((gut ? '✅ ' : '❌ ') + n + (gut ? '' : `  ist=${JSON.stringify(ist)} soll=${JSON.stringify(soll)}`));
  gut ? ok++ : bad++;
};

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
  const fehler: any[] = [];
  p.on('pageerror', e => fehler.push('JS: ' + e.message));
  await p.goto('file://' + WURZEL + '/index.html');
  /* Auf das Willkommen WARTEN, nicht die Uhr raten: es erscheint nach
     rund 1,4 s — unter Volllast der ganzen Suite aber auch mal deutlich
     später (dieselbe Lehre wie E82: der Prüfstand hungert, nicht die
     App). Kommt es nie, wird der Punkt unten ehrlich rot. */
  await p.waitForSelector('#rg-willkommen', { timeout: 15000 }).catch(() => {});
  await p.waitForTimeout(300);

  /* --- BEIM ERSTEN MAL STEHT SEIT E55 EIN WILLKOMMEN DA ------------------
     Vorher war es eine kleine Einladung unten links: „Neu hier? — Führung".
     Der Gedanke war richtig und die Antwort zu klein — sie sagte nicht, was
     Redion überhaupt ist und wohin die Daten gehören. Jetzt drei Wege, und
     die Führung ist der dritte davon. Die Einladung selbst gibt es weiter;
     sie ist die richtige Form für „später nochmal". */
  const willkommen = await p.evaluate(() => ({
    da: !!document.getElementById('rg-willkommen'),
    kasten: !!document.getElementById('rg-kasten'),
    text: (document.getElementById('rg-willkommen') || {}).textContent || '',
    wege: document.querySelectorAll('#rg-willkommen .wk-weg').length
  }));
  pruef('Willkommen erscheint',           willkommen.da, true);
  pruef('Die Führung läuft noch nicht',   willkommen.kasten, false);
  pruef('Es sagt, wo die Daten liegen',
        /auf deinem Gerät/.test(willkommen.text), true);
  pruef('Und bietet drei Wege an',        willkommen.wege, 3);
  pruef('Die Führung ist einer davon',
        /zwei Minuten/.test(willkommen.text), true);

  await p.click('#rg-willkommen [data-a="fuehrung"]');
  await p.waitForTimeout(400);

  /* --- Ab hier läuft die Führung --------------------------------------- */
  const erst = await p.evaluate(() => ({
    kasten: !!document.getElementById('rg-kasten'),
    schleier: !!document.getElementById('rg-schleier'),
    titel: (document.querySelector('.rg-titel') || {}).textContent,
    zahl: (document.querySelector('.rg-zahl') || {}).textContent,
    punkte: document.querySelectorAll('.rg-punkte i').length,
    gesehen: Store.getMeta('rundgangGesehen', false),
    fertig: Store.getMeta('rundgangFertig', false)
  }));
  pruef('Die Führung startet von selbst', erst.kasten, true);
  pruef('Mit Schleier dahinter',          erst.schleier, true);
  pruef('Erster Schritt ist Schritt 1',   erst.zahl, '1 von 9');
  pruef('Neun Punkte als Anzeige',        erst.punkte, 9);
  /* ZWEI MARKEN, ZWEI FRAGEN. Die Begrüssung ist an dieser Stelle gesehen
     — sie stand ja eben noch da, und das war der Fehler, den test115
     beschreibt: sie kam sonst bei jedem Öffnen wieder.

     DIE FÜHRUNG dagegen ist noch NICHT durchlaufen, und genau darauf zielt
     diese Zeile seit jeher: wer mittendrin abbricht, soll sie nicht als
     erledigt vorfinden. Die Frage bleibt, nur die Marke ist jetzt die
     richtige. */
  pruef('Die Begrüssung ist gesehen',        erst.gesehen, true);
  pruef('Die Führung noch nicht durchlaufen', erst.fertig, false);

  /* Das Loch sitzt auf dem echten Knopf */
  const loch = await p.evaluate(() => {
    /* Ein Element, das dasein MUSS. Fehlt es, misst der Lauf nichts mehr —
       dann ist eine Meldung mit dem Selektor besser als „Cannot read
       properties of null" zwanzig Zeilen weiter. */
    const musselement = (sel: string): HTMLElement => {
      const x = document.querySelector<HTMLElement>(sel);
      if (!x) throw new Error(sel + ' ist nicht da.');
      return x;
    };
    const l = musselement('#rg-loch').getBoundingClientRect();
    /* SEIT E390 ZEIGT SCHRITT 1 AUF DIE ORTE IN DER LINKEN LEISTE.
       Vorher war es `#sidebar .ws-btn` (E272 Phase F nahm die Leiste weg),
       danach der Reiter „Gehen" — und der stand seit E383 nur da, wenn
       jemand das Band aufklappte. Genau daran war dieser Punkt rot.
       Der Anker steht in `rundgang.ts` — wer ihn ändert, muss diese Zeile
       mitnehmen, und das ist Absicht: ein Prüfpunkt, der irgendein
       Element nimmt, misst irgendetwas. */
    const z = (document.querySelector('#kante .k-orte') ?? document.body).getBoundingClientRect();
    return { nah: Math.abs(l.left + 6 - z.left) < 3 && Math.abs(l.top + 6 - z.top) < 3,
             sichtbar: getComputedStyle(musselement('#rg-loch')).display };
  });
  pruef('Das Loch liegt auf dem Ziel', loch.nah, true);
  pruef('Und ist sichtbar',            loch.sichtbar !== 'none', true);

  /* Weiter und zurück */
  await p.click('#rg-kasten [data-a="weiter"]');
  await p.waitForTimeout(250);
  const zweiter = await p.evaluate(() => ({
    zahl: (document.querySelector('.rg-zahl') || {}).textContent,
    titel: (document.querySelector('.rg-titel') || {}).textContent,
    zurueck: !!document.querySelector('[data-a="zurueck"]')
  }));
  pruef('Zweiter Schritt', zweiter.zahl, '2 von 9');
  pruef('Zurück ist jetzt da', zweiter.zurueck, true);

  await p.click('#rg-kasten [data-a="zurueck"]');
  await p.waitForTimeout(250);
  const wieder = await p.evaluate(() => (document.querySelector('.rg-zahl') || {}).textContent);
  pruef('Zurück führt zum ersten', wieder, '1 von 9');

  /* Mit den Pfeiltasten */
  await p.keyboard.press('ArrowRight');
  await p.keyboard.press('ArrowRight');
  await p.waitForTimeout(250);
  const mitTasten = await p.evaluate(() => (document.querySelector('.rg-zahl') || {}).textContent);
  pruef('Pfeiltasten blättern', mitTasten, '3 von 9');

  /* Esc beendet */
  await p.keyboard.press('Escape');
  await p.waitForTimeout(300);
  const beendet = await p.evaluate(() => ({
    weg: !document.getElementById('rg-kasten'),
    schleier: !document.getElementById('rg-schleier'),
    gesehen: Store.getMeta('rundgangGesehen', false),
    fertig: Store.getMeta('rundgangFertig', false)
  }));
  pruef('Esc beendet die Führung', beendet.weg, true);
  pruef('Der Schleier geht mit',   beendet.schleier, true);
  pruef('Jetzt als gesehen vermerkt', beendet.gesehen, true);

  /* Startet nicht noch einmal */
  await p.reload();
  await p.waitForTimeout(2800);
  /* Nach dem Neuladen ist die Einrichtung der Hauptwelten wieder da —
     sie erscheint 300 ms nach dem Start und fängt Klicks ab (E132). */
  await p.evaluate(() => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelector('.produkt-onboarding-lage')?.remove();
  });
  const nochmal = await p.evaluate(() => ({
    kasten: !!document.getElementById('rg-kasten'),
    einladung: !!document.getElementById('rg-einladung')
  }));
  pruef('Beim zweiten Mal bleibt sie weg',     nochmal.kasten, false);
  pruef('Auch die Einladung kommt nicht wieder', nochmal.einladung, false);

  /* Bis zum Ende durchgehen */
  const durch = await p.evaluate(async () => {
    Rundgang.start();
    await new Promise(r => setTimeout(r, 200));
    const titel = [];
    for (let i = 0; i < 9; i++) {
      titel.push((document.querySelector('.rg-titel') || {}).textContent);
      document?.querySelector<HTMLElement>('#rg-kasten [data-a="weiter"]')?.click();
      await new Promise(r => setTimeout(r, 120));
    }
    return { titel, weg: !document.getElementById('rg-kasten') };
  });
  pruef('Neun Schritte durchlaufen', durch.titel.length, 9);
  pruef('Alle mit Titel',            durch.titel.every(t => t && t.length > 3), true);
  pruef('Am Ende ist sie zu',        durch.weg, true);

  /* --- Die Übersicht --------------------------------------------------- */
  await p.evaluate(() => Rundgang.uebersicht());
  await p.waitForTimeout(350);
  const ueber = await p.evaluate(() => ({
    themen: document.querySelectorAll('.rg-thema').length,
    punkte: document.querySelectorAll('.rg-thema li').length,
    knoepfe: [...document.querySelectorAll<HTMLElement>('.fbtns button')].map(x => x.textContent),
    ehrlich: (document.querySelector('.rg-vorwort') || {}).textContent
  }));
  pruef('Zwölf Themen',           ueber.themen, 12);
  pruef('Mehr als fünfzig Punkte', Number(ueber.punkte ?? -1) >= 50, true);
  pruef('Führung von hier startbar', ueber.knoepfe.some(x => (x ?? '').includes('Führung')), true);
  pruef('Weg zum Wissensdokument',   ueber.knoepfe.some(x => (x ?? '').includes('Dokument')), true);
  pruef('Vorwort nennt auch das Nicht-Können',
        ueber.ehrlich?.includes('nicht'), true);

  /* Führung aus der Übersicht */
  await p.evaluate(() => document.querySelector<HTMLElement>('[data-a="fuehrung"]')?.click());
  await p.waitForTimeout(400);
  const ausUeber = await p.evaluate(() => ({
    laeuft: !!document.getElementById('rg-kasten'),
    zahl: (document.querySelector('.rg-zahl') || {}).textContent
  }));
  pruef('Führung startet aus der Übersicht', ausUeber.laeuft, true);
  pruef('Und beginnt wieder bei eins',       ausUeber.zahl, '1 von 9');
  await p.keyboard.press('Escape');

  /* --- In der Seitenleiste und in der Palette --------------------------- */
  const wege = await p.evaluate(async () => {
    App.zeichneBaum();
    await new Promise(r => setTimeout(r, 300));
    const inLeiste = !!document.querySelector('[data-app="kann"]');
    Werkzeuge.palette();
    await new Promise(r => setTimeout(r, 250));
    const inp = document.querySelector<HTMLInputElement>('#cq');
    if (!inp) throw new Error('#cq ist nicht da — der Lauf misst sonst nichts.');
    inp.value = 'Was Redion kann';
    inp.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise(r => setTimeout(r, 200));
    const erste = (document.querySelector('#cr button') || {}).textContent || '';
    document.querySelectorAll<HTMLElement>('.overlay').forEach(o => o.remove());
    return { inLeiste, inPalette: (erste ?? '').includes('Was Redion kann') };
  });
  pruef('Eintrag in der Seitenleiste', wege.inLeiste, true);
  pruef('Und in der Befehlspalette',   wege.inPalette, true);

  /* --- Am Telefon ------------------------------------------------------- */
  const handy = await b.newPage({ viewport: { width: 428, height: 926 }, isMobile: true, hasTouch: true });
  const fehler2: any[] = [];
  handy.on('pageerror', e => fehler2.push('JS: ' + e.message));
  await handy.goto('file://' + WURZEL + '/index.html');
  await handy.waitForTimeout(1600);
  const amHandy = await handy.evaluate(async () => {
    /* Ein Element, das dasein MUSS. Fehlt es, misst der Lauf nichts mehr —
       dann ist eine Meldung mit dem Selektor besser als „Cannot read
       properties of null" zwanzig Zeilen weiter. */
    const musselement = (sel: string): HTMLElement => {
      const x = document.querySelector<HTMLElement>(sel);
      if (!x) throw new Error(sel + ' ist nicht da.');
      return x;
    };
    Rundgang.start();
    await new Promise(r => setTimeout(r, 400));
    const k = musselement('#rg-kasten').getBoundingClientRect();
    const raus = k.right > innerWidth + 1 || k.left < -1 || k.bottom > innerHeight + 1;
    Rundgang.fertig();
    Rundgang.uebersicht();
    await new Promise(r => setTimeout(r, 300));
    const f = (document.querySelector('.overlay .finder') ?? document.body).getBoundingClientRect();
    const rausU = f.right > innerWidth + 1 || f.left < -1;
    document.querySelectorAll<HTMLElement>('.overlay').forEach(o => o.remove());
    return { raus, rausU };
  });
  pruef('Die Führung passt aufs Telefon',   amHandy.raus, false);
  pruef('Die Übersicht auch',               amHandy.rausU, false);

  /* ======================================================================
     JEDER SCHRITT ZEIGT AUF ETWAS SICHTBARES — an beiden Grössen (E390)
     ----------------------------------------------------------------------
     DER PUNKT, DEN ES VORHER NICHT GAB, UND DER DEN FEHLER GEFUNDEN HÄTTE.
     Bis hierher prüfte dieser Lauf nur SCHRITT 1. Am 4. September
     nachgemessen zeigten im Grundzustand fünf der neun Schritte am Rechner
     auf nichts und acht am Telefon — drei Ziele waren Reiter des Bandes
     (seit E383 nur sichtbar, wenn man aufklappt), drei waren Knöpfe der
     Kante (die es am Telefon nicht gibt).

     `stellen()` versteckt das Loch dann still. Eine Führung ohne Loch sieht
     aus wie eine Führung und zeigt auf nichts — der Kopf von `rundgang.ts`
     beschreibt genau das seit E272, und es ist trotzdem passiert, weil kein
     Lauf es hielt.

     DIE FÜHRUNG WIRD WIRKLICH DURCHLAUFEN, und gemessen wird DAS LOCH.
     Der erste Entwurf las `Rundgang.SCHRITTE` und suchte selbst den ersten
     sichtbaren Kandidaten — also dieselbe Rechnung noch einmal, daneben.
     Bei der Gegenprobe blieb er GRÜN, als `zielFinden()` den ersten
     VORHANDENEN statt den ersten SICHTBAREN nahm: der Prüflauf rechnete ja
     weiter richtig. Eine Prüfung, die den Mechanismus nachbaut, prüft den
     Nachbau (§55.2). Jetzt klickt sie sich durch alle neun Schritte und
     sieht nach, ob `#rg-loch` dasteht und eine Fläche hat. */
  const zeigtAlles = async (breite: number, hoehe: number, mobil: boolean) => {
    const s = await b.newPage({ viewport: { width: breite, height: hoehe },
                                isMobile: mobil, hasTouch: mobil });
    await s.goto('file://' + WURZEL + '/index.html');
    await s.waitForTimeout(3200);
    await s.evaluate(`document.getElementById('rg-willkommen')?.remove()`);
    await s.evaluate(`Rundgang.start()`);
    await s.waitForTimeout(400);
    const zahl: number = await s.evaluate(`Rundgang.SCHRITTE.length`);
    const blind: string[] = [];
    for (let i = 0; i < zahl; i++) {
      const loch: any = await s.evaluate(`(() => {
        const l = document.getElementById('rg-loch');
        if (!l) return { da: false };
        const r = l.getBoundingClientRect();
        return { da: getComputedStyle(l).display !== 'none' && r.width > 1 && r.height > 1,
                 b: Math.round(r.width), h: Math.round(r.height),
                 titel: ((document.querySelector('#rg-kasten h3, #rg-kasten b') || {})
                          .textContent || '').trim().slice(0, 28) };
      })()`);
      if (!loch.da) blind.push(`${i + 1}: ${loch.titel || '(ohne Titel)'}`);
      if (i < zahl - 1) {
        await s.evaluate(`document.querySelector('#rg-kasten [data-a="weiter"]')?.click()`);
        await s.waitForTimeout(260);
      }
    }
    await s.evaluate(`Rundgang.fertig()`);
    await s.close();
    return { zahl, blind };
  };
  const amRechner = await zeigtAlles(1360, 900, false);
  pruef('Der Rundgang hat neun Schritte (sonst misst die Zeile darunter nichts)',
        amRechner.zahl, 9);
  pruef('Am Rechner zeigt kein Schritt auf nichts', amRechner.blind, []);
  const amTelefon2 = await zeigtAlles(390, 844, true);
  pruef('Am Telefon zeigt kein Schritt auf nichts', amTelefon2.blind, []);

  console.log(`\n${ok}/${ok + bad} bestanden`);
  const alle = [...fehler, ...fehler2];
  console.log(alle.length ? 'JS-Fehler:\n' + alle.join('\n') : 'Keine JS-Fehler.');
  await b.close();
  process.exit(bad || alle.length ? 1 : 0);
})();
