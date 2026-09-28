/* Dateien in Stücken: anmelden, schicken, bestätigen — Notions Ablauf ohne Server */
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
  await p.waitForTimeout(1800);

  /* --- 0 · Die Ablage kennt die neuen Fächer ----------------------------- */
  const faecher = await p.evaluate(async () => {
    const namen = [];
    const req = indexedDB.open('notizen');
    const db = await new Promise<IDBDatabase>(r => { req.onsuccess = () => r(req.result); });
    for (const n of db.objectStoreNames) namen.push(n);
    db.close();
    return namen.sort();
  });
  /* Die Liste steht ABSICHTLICH als Literal da und wird nicht aus der App
     abgeleitet. Eine Prüfung, die ihre Erwartung aus derselben Quelle holt,
     die sie prüft, kann nie rot werden (§55.2) — sie würde ein vergessenes
     Fach genauso brav bestätigen wie ein vorhandenes. Der Preis ist, dass
     jede neue Fassung diese Zeile anfasst; das ist der Sinn.
     Fassung 7 brachte `auftraege` dazu (E286). */
  pruef('Elf Fächer in der Ablage', faecher,
        ['auftraege', 'basis', 'blocks', 'collections', 'dateien', 'meta',
         'stuecke', 'suchindex', 'versions', 'views', 'vorrat']);

  /* --- 1 · Die drei Schritte einzeln ------------------------------------- */
  const schritte = await p.evaluate(async () => {
    const satz = await Dateien.anmelden({ name: 'probe.bin', groesse: 2500000,
                                          typ: 'application/octet-stream' });
    const nachAnmelden = { ...satz };

    /* Bestätigen, bevor alles da ist, muss scheitern */
    let zuFrueh = null;
    try { await Dateien.bestaetigen(satz.id); }
    catch (e: unknown) { zuFrueh = (e instanceof Error ? e.message : String(e)); }

    /* Ein Stück zu viel */
    let zuWeit = null;
    try { await Dateien.stueckSchicken(satz.id, 99, new Blob(['x'])); }
    catch (e: unknown) { zuWeit = (e instanceof Error ? e.message : String(e)); }

    /* Die drei Stücke schicken */
    const rueck = [];
    for (let i = 0; i < satz.teile; i++)
      rueck.push(await Dateien.stueckSchicken(satz.id, i,
        new Blob([new Uint8Array(i === satz.teile - 1 ? 452288 : 1048576)])));

    const fertig = await Dateien.bestaetigen(satz.id);
    return { nachAnmelden, zuFrueh, zuWeit, rueck, fertig: { ...fertig } };
  });
  pruef('Drei Stücke bei 2,5 MB',      schritte.nachAnmelden.teile, 3);
  pruef('Zustand am Anfang: wartet',   schritte.nachAnmelden.zustand, 'wartet');
  pruef('Zu früh bestätigen geht nicht', !!schritte.zuFrueh, true);
  pruef('Und sagt, wie viele fehlen',
        (schritte.zuFrueh ?? '').includes('Es fehlen noch 3 Stück'), true);
  pruef('Ein Stück ausserhalb geht nicht',
        (schritte.zuWeit || '').includes('gibt es nicht'), true);
  pruef('Jedes Stück meldet den Anteil',
        schritte.rueck.map(r => Math.round(r.anteil * 100)), [33, 67, 100]);
  pruef('Am Ende: fertig',             schritte.fertig.zustand, 'fertig');
  pruef('Mit einem Zeitstempel',       !!schritte.fertig.fertigAm, true);

  /* --- 2 · Wieder herausholen -------------------------------------------- */
  const zurueck = await p.evaluate(async () => {
    const inhalt = new Uint8Array(300000);
    for (let i = 0; i < inhalt.length; i++) inhalt[i] = i % 251;
    const datei = new File([inhalt], 'muster.bin', { type: 'application/octet-stream' });

    const fortschritt: any[] = [];
    const satz = await Dateien.ablegen(datei,
      { beiFortschritt: (_a: any, nr: any, von: any) => fortschritt.push([nr, von]) });

    const blob = await Dateien.alsBlob(satz.id);
    if (!blob) throw new Error('blob ist nicht da — der Lauf misst sonst nichts.');
    const raus = new Uint8Array(await blob.arrayBuffer());
    let gleich = raus.length === inhalt.length;
    if (gleich) for (let i = 0; i < inhalt.length; i += 997)
      if (raus[i] !== inhalt[i]) { gleich = false; break; }

    const url = await Dateien.adresse(satz.id);
    if (!url) throw new Error('url ist nicht da — der Lauf misst sonst nichts.');
    const nochmal = await Dateien.adresse(satz.id);
    return { teile: satz.teile, fortschritt, groesse: blob.size, typ: blob.type,
             gleich, urlArt: url.slice(0, 5), gemerkt: url === nochmal };
  });
  pruef('300 KB sind ein Stück',    zurueck.teile, 1);
  pruef('Der Fortschritt meldet sich', zurueck.fortschritt, [[1, 1]]);
  pruef('Die Grösse stimmt wieder',  zurueck.groesse, 300000);
  pruef('Der Typ auch',              zurueck.typ, 'application/octet-stream');
  pruef('Und der Inhalt Byte für Byte', zurueck.gleich, true);
  pruef('Die Adresse ist eine Blob-Adresse', zurueck.urlArt, 'blob:');
  pruef('Und wird nur einmal gebaut', zurueck.gemerkt, true);

  /* --- 3 · Über mehrere Stücke hinweg ------------------------------------ */
  const mehrere = await p.evaluate(async () => {
    /* 2,3 MB mit einem Muster, das über die Stückgrenzen läuft */
    const n = 2300000;
    const inhalt = new Uint8Array(n);
    for (let i = 0; i < n; i++) inhalt[i] = (i * 7) % 256;
    const satz = await Dateien.ablegen(new File([inhalt], 'gross.bin'));
    const blob = await Dateien.alsBlob(satz.id);
    if (!blob) throw new Error('Die abgelegte Datei ist nicht mehr da — der Lauf misst sonst nichts.');
    const raus = new Uint8Array(await blob.arrayBuffer());
    /* Genau an den Nahtstellen prüfen */
    const nahtstellen = [1048575, 1048576, 1048577, 2097151, 2097152, 2097153];
    const stimmt = nahtstellen.every(i => raus[i] === inhalt[i]);
    return { teile: satz.teile, laenge: raus.length, stimmt,
             ersteBytes: [...raus.slice(0, 3)], letzte: raus[n - 1] };
  });
  pruef('2,3 MB werden drei Stücke', mehrere.teile, 3);
  pruef('Zusammengesetzt wieder 2,3 MB', mehrere.laenge, 2300000);
  pruef('An den Nahtstellen stimmt es', mehrere.stimmt, true);
  pruef('Der Anfang stimmt',         mehrere.ersteBytes, [0, 7, 14]);
  pruef('Und das letzte Byte',       mehrere.letzte, (2299999 * 7) % 256);

  /* --- 4 · Abbrechen lässt nichts liegen --------------------------------- */
  const abbruch = await p.evaluate(async () => {
    const vorher = (await Store.dateiAlle()).length;
    const satz = await Dateien.anmelden({ name: 'weg.bin', groesse: 3000000 });
    await Dateien.stueckSchicken(satz.id, 0, new Blob([new Uint8Array(1048576)]));
    const mitten = (await Store.dateiAlle()).length;
    const stueckeDa = (await Store.stueckeVon(satz.id)).length;
    await Dateien.abbrechen(satz.id);
    return { vorher, mitten, stueckeDa,
             nachher: (await Store.dateiAlle()).length,
             stueckeWeg: (await Store.stueckeVon(satz.id)).length };
  });
  pruef('Mitten drin liegt einer mehr', abbruch.mitten, Number(abbruch.vorher ?? 0) + 1);
  pruef('Mit einem Stück',              abbruch.stueckeDa, 1);
  pruef('Nach dem Abbruch wieder wie vorher', abbruch.nachher, abbruch.vorher);
  pruef('Und keine Stücke übrig',       abbruch.stueckeWeg, 0);

  /* Ein Fehler mitten im Ablegen räumt auch auf */
  const fehlerMittendrin = await p.evaluate(async () => {
    const vorher = (await Store.dateiAlle()).length;
    let meldung = null;
    try {
      await Dateien.ablegen(new File([new Uint8Array(2000000)], 'x.bin'),
        { beiFortschritt: (_a: any, nr: any) => { if (nr === 2) throw new Error('Hier bricht es ab'); } });
    } catch (e: unknown) { meldung = (e instanceof Error ? e.message : String(e)); }
    return { meldung, vorher, nachher: (await Store.dateiAlle()).length };
  });
  pruef('Der Fehler kommt durch', fehlerMittendrin.meldung, 'Hier bricht es ab');
  pruef('Und es bleibt nichts liegen', fehlerMittendrin.nachher, fehlerMittendrin.vorher);

  /* --- 5 · Grenzen ------------------------------------------------------- */
  const grenzen = await p.evaluate(async () => {
    let zuGross = null;
    try { await Dateien.anmelden({ name: 'riesig', groesse: 600 * 1024 * 1024 }); }
    catch (e: unknown) { zuGross = (e instanceof Error ? e.message : String(e)); }
    let ohneGroesse = null;
    /* OHNE `groesse` — und das ist Absicht: die Zeile prüft, dass `anmelden`
       eine unvollständige Anmeldung ablehnt. Die Form verlangt das Feld, der
       Aufruf lässt es weg; deshalb hier eine zweite Sicht auf dieselbe
       Funktion statt einer Behauptung mit `as any`. */
    const anmeldenOhneAlles = Dateien.anmelden as (d: { name: string }) => Promise<unknown>;
    try { await anmeldenOhneAlles({ name: 'leer' }); }
    catch (e: unknown) { ohneGroesse = (e instanceof Error ? e.message : String(e)); }
    return { zuGross, ohneGroesse,
             lohntKlein: Dateien.lohntSich(40 * 1024),
             lohntGross: Dateien.lohntSich(3 * 1024 * 1024),
             stueck: Dateien.STUECK, klein: Dateien.KLEIN };
  });
  pruef('Zu grosse Datei wird gemeldet', (grenzen.zuGross || '').includes('500 MB'), true);
  pruef('Ohne Grösse geht es nicht',     !!grenzen.ohneGroesse, true);
  pruef('40 KB lohnen den Umweg nicht',  grenzen.lohntKlein, false);
  pruef('3 MB schon',                    grenzen.lohntGross, true);
  pruef('Ein Stück ist 1 MB',            grenzen.stueck, 1048576);
  pruef('Die Grenze liegt bei 256 KB',   grenzen.klein, 262144);

  /* --- 6 · Verwaistes finden und aufräumen -------------------------------- */
  const verwaist = await p.evaluate(async () => {
    /* Alles Alte weg, damit die Zahlen stimmen */
    for (const d of await Store.dateiAlle()) await Dateien.weg(d.id);

    const s = Store.addBlock(null, 'page', { text: 'Dateiseite' });
    const bleibt = Store.addBlock(s.id, 'file', { text: 'bleibt' });
    const geht   = Store.addBlock(s.id, 'file', { text: 'geht' });

    const a = await Dateien.ablegen(new File([new Uint8Array(1000)], 'a.bin'),
                                    { blockId: bleibt.id });
    const c = await Dateien.ablegen(new File([new Uint8Array(1000)], 'c.bin'),
                                    { blockId: geht.id });
    /* Eine ohne Block — das ist erlaubt und gilt nicht als verwaist */
    const frei = await Dateien.ablegen(new File([new Uint8Array(1000)], 'frei.bin'));
    /* Eine unfertige */
    const halb = await Dateien.anmelden({ name: 'halb.bin', groesse: 2000000 });

    Store.trashBlock(geht.id);
    await new Promise(r => setTimeout(r, 200));

    const liste = await Dateien.verwaist();
    const namen = liste.map(d => d.name).sort();
    const vorher = await Dateien.zahlen();
    const erg = await Dateien.aufraeumen();
    const nachher = await Dateien.zahlen();
    return { namen, vorher, erg, nachher,
             bleibtDa: !!(await Store.dateiHolen(a.id)),
             freiDa: !!(await Store.dateiHolen(frei.id)),
             gehtWeg: !(await Store.dateiHolen(c.id)),
             halbWeg: !(await Store.dateiHolen(halb.id)) };
  });
  pruef('Zwei sind verwaist',        verwaist.namen, ['c.bin', 'halb.bin']);
  pruef('Vier waren es',             verwaist.vorher.anzahl, 4);
  pruef('Zwei werden aufgeräumt',    verwaist.erg.anzahl, 2);
  pruef('Zwei bleiben',              verwaist.nachher.anzahl, 2);
  pruef('Die am lebenden Block bleibt', verwaist.bleibtDa, true);
  pruef('Die freie auch',            verwaist.freiDa, true);
  pruef('Die am gelöschten geht',    verwaist.gehtWeg, true);
  pruef('Die unfertige auch',        verwaist.halbWeg, true);

  /* --- 7 · Zahlen und Texte ----------------------------------------------- */
  const texte = await p.evaluate(async () => ({
    b: Dateien.groesseText(500),
    kb: Dateien.groesseText(2048),
    mb: Dateien.groesseText(5 * 1048576),
    gb: Dateien.groesseText(2 * 1073741824),
    null0: Dateien.groesseText(0),
    unsinn: Dateien.groesseText('abc'),
    zahlen: await Dateien.zahlen()
  }));
  pruef('Bytes',      texte.b, '500 B');
  pruef('Kilobytes',  texte.kb, '2 KB');
  pruef('Megabytes',  texte.mb, '5 MB');
  pruef('Gigabytes',  texte.gb, '2.00 GB');
  pruef('Null',       texte.null0, '0 B');
  pruef('Unsinn wird 0', texte.unsinn, '0 B');
  pruef('Die Zählung stimmt', texte.zahlen.anzahl, 2);

  /* --- 8 · Ein Block hängt sie an ---------------------------------------- */
  const amBlock = await p.evaluate(async () => {
    const s = Store.addBlock(null, 'page', { text: 'Anhangprobe' });
    const bl = Store.addBlock(s.id, 'file', { text: '' });
    App.oeffne(s.id);
    await new Promise(r => setTimeout(r, 400));
    const satz = await Dateien.ablegen(new File([new Uint8Array(900000)], 'anhang.pdf',
      { type: 'application/pdf' }), { blockId: bl.id });
    const url = await Dateien.adresse(satz.id);
    Store.updateBlock(bl.id, { src: url, dateiId: satz.id, text: 'anhang.pdf' });
    App.zeichneSeite();
    await new Promise(r => setTimeout(r, 400));
    const b2 = Store.getBlock(bl.id);
    return { dateiId: b2.dateiId === satz.id,
             srcKurz: b2.src.length < 200,      /* keine Data-URL im Block! */
             teile: satz.teile,
             gezeichnet: !!document.querySelector('#page') };
  });
  pruef('Der Block merkt sich die Kennung', amBlock.dateiId, true);
  pruef('Und trägt keine Data-URL mehr',    amBlock.srcKurz, true);
  pruef('900 KB sind ein Stück',            amBlock.teile, 1);
  pruef('Die Seite steht',                  amBlock.gezeichnet, true);

  /* --- 9 · Überlebt den Neustart ------------------------------------------ */
  const vorNeustart = await p.evaluate(async () => {
    const satz = await Dateien.ablegen(new File([new TextEncoder().encode('Hallo Welt')],
      'gruss.txt', { type: 'text/plain' }));
    await Store.flush();
    return satz.id;
  });
  await p.reload();
  await p.waitForTimeout(2200);
  /* Nach dem Neuladen ist die Einrichtung der Hauptwelten wieder da —
     sie erscheint 300 ms nach dem Start und fängt Klicks ab (E132). */
  await p.evaluate(() => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelector('.produkt-onboarding-lage')?.remove();
  });
  const nachNeustart = await p.evaluate(async (id) => {
    const satz = await Store.dateiHolen(id);
    const blob = await Dateien.alsBlob(id);
    return { da: !!satz, name: satz && satz.name,
             text: blob ? await blob.text() : null };
  }, vorNeustart);
  pruef('Die Datei ist nach dem Neustart da', nachNeustart.da, true);
  pruef('Mit ihrem Namen',                    nachNeustart.name, 'gruss.txt');
  pruef('Und ihrem Inhalt',                   nachNeustart.text, 'Hallo Welt');

  /* --- 10 · Das Fenster ---------------------------------------------------- */
  const fenster = await p.evaluate(async () => {
    document.querySelectorAll<HTMLElement>('.overlay').forEach(o => o.remove());
    document.getElementById('rg-einladung')?.remove();
    await Dateien.dialog();
    await new Promise(r => setTimeout(r, 400));
    const o = document.querySelector('.overlay');
    if (!o) throw new Error('.overlay ist nicht da — der Lauf misst sonst nichts.');
    const zeilen = o.querySelectorAll('.da-zeile').length;
    const summe = o.querySelector<HTMLElement>('#da-summe')?.textContent;
    const knoepfe = [...o.querySelectorAll<HTMLElement>('.fbtns button')].map(x => x.dataset.a);
    const laden = o.querySelectorAll('[data-lade]').length;
    const breit = (o.querySelector('.finder') ?? document.body).getBoundingClientRect();
    return { zeilen, summe, knoepfe, laden, passt: breit.right <= innerWidth + 1 };
  });
  pruef('Die Dateien stehen im Fenster', Number(fenster.zeilen ?? -1) >= 1, true);
  pruef('Mit einer Summe',    /Stücken/.test(fenster.summe ?? ''), true);
  pruef('Zwei Knöpfe unten',  fenster.knoepfe, ['neu', 'putz']);
  pruef('Fertige lassen sich laden', Number(fenster.laden ?? -1) >= 1, true);
  pruef('Das Fenster passt',  fenster.passt, true);

  const geloescht = await p.evaluate(async () => {
    const o = document.querySelector('.overlay');
    if (!o) throw new Error('o ist nicht da — der Lauf misst sonst nichts.');
    const vorher = o.querySelectorAll('.da-zeile').length;
    /* Der Löschen-Knopf fragt selbst (E709): der erste Druck öffnet
       „Löschen" / „Abbrechen", erst die rote Pille löscht. */
    o?.querySelector<HTMLElement>('[data-weg]')?.click();
    await new Promise(r => setTimeout(r, 120));
    const gefragt = o.querySelectorAll('.da-zeile').length;
    document.querySelector<HTMLElement>('.ru-loesch-ja')?.click();
    await new Promise(r => setTimeout(r, 500));
    const nachher = o.querySelectorAll('.da-zeile').length;
    document.querySelectorAll<HTMLElement>('.overlay').forEach(y => y.remove());
    return { vorher, gefragt, nachher };
  });
  pruef('Der erste Druck fragt nur (E709)', geloescht.gefragt, geloescht.vorher);
  pruef('Löschen entfernt eine Zeile', geloescht.nachher, Number(geloescht.vorher ?? 0) - 1);

  /* --- 11 · In der Befehlspalette ------------------------------------------ */
  const palette = await p.evaluate(async () => {
    Werkzeuge.palette();
    await new Promise(r => setTimeout(r, 250));
    const inp = document.querySelector<HTMLInputElement>('#cq');
    if (!inp) throw new Error('#cq ist nicht da — der Lauf misst sonst nichts.');
    inp.value = 'Dateien in Stücken';
    inp.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise(r => setTimeout(r, 250));
    const t = (document.querySelector('#cr button') || {}).textContent || '';
    document.querySelectorAll<HTMLElement>('.overlay').forEach(o => o.remove());
    return (t ?? '').includes('Dateien');
  });
  pruef('In der Befehlspalette', palette, true);

  /* --- 12 · Am Telefon ------------------------------------------------------ */
  const handy = await b.newPage({ viewport: { width: 428, height: 926 }, isMobile: true, hasTouch: true });
  const fehler2: any[] = [];
  handy.on('pageerror', e => fehler2.push('JS: ' + e.message));
  await handy.goto('file://' + WURZEL + '/index.html');
  await handy.waitForTimeout(1900);
  const amHandy = await handy.evaluate(async () => {
    await Dateien.ablegen(new File([new Uint8Array(500000)],
      'ein-recht-langer-dateiname-fuers-telefon.bin'));
    await Dateien.dialog();
    await new Promise(r => setTimeout(r, 400));
    const f = (document.querySelector('.overlay .finder') ?? document.body).getBoundingClientRect();
    const raus = f.right > innerWidth + 1 || f.left < -1;
    const ueberlauf = document.documentElement.scrollWidth - innerWidth;
    document.querySelectorAll<HTMLElement>('.overlay').forEach(o => o.remove());
    return { raus, ueberlauf };
  });
  pruef('Auch am Telefon passt es',   amHandy.raus, false);
  pruef('Nichts läuft seitlich raus', Number(amHandy.ueberlauf ?? -1) <= 1, true);

  console.log(`\n${ok}/${ok + bad} bestanden`);
  const alleF = [...fehler, ...fehler2];
  console.log(alleF.length ? 'JS-Fehler:\n' + alleF.join('\n') : 'Keine JS-Fehler.');
  await b.close();
  process.exit(bad || alleF.length ? 1 : 0);
})();
