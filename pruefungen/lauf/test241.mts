/* Suite 207 — Üben, prüfen, arbeiten (Elektro, Punkte 2–10, 51–60, 91–100)
 * ============================================================================
 * Aufgaben werden hier nicht GESCHRIEBEN, sondern ERZEUGT — aus dem
 * Symbolregister, aus dem Formelregister und aus einer Handvoll Schaltungen.
 * Das hat einen Grund, und dieser Prüflauf misst genau ihn:
 *
 * EINE MUSTERLÖSUNG, DIE DANEBENGESCHRIEBEN WIRD, KANN FALSCH SEIN. Eine, die
 * gerechnet wird, kann es nicht — sie kommt aus demselben Code, der auch im
 * Formelheft rechnet. §3 prüft deshalb für jede Art und vierzig Würfelungen:
 * die Aufgabe muss ihre eigene Lösung als richtig durchgehen lassen. Klingt
 * selbstverständlich; beim ersten Bau war es das bei zwei Arten nicht.
 *
 * UND EINE FRAGE MIT ZWEI GLEICHEN ANTWORTEN IST KEINE FRAGE. Sie sieht
 * völlig normal aus, und wer die zweite anklickt, bekommt ein rotes Kreuz für
 * dieselbe Antwort. §2 hat genau das gefunden: zwei Bauteile mit derselben
 * Anschlussliste standen nebeneinander.
 *
 * §4 IST DER, DER AM LEICHTESTEN ÜBERSEHEN WIRD. Eine Rechenaufgabe kann aus
 * lauter plausiblen Werten bestehen und trotzdem Unsinn sein: 82 kΩ ist ein
 * Widerstand, 3,9 A ist ein Strom, und zusammen ergeben sie 320 000 Volt. Wer
 * so etwas rechnet, gewöhnt sich ab, das Ergebnis anzusehen — und genau das
 * Ansehen ist im Beruf die einzige Sicherung gegen einen Zahlendreher.
 *
 *   node pruefungen/lauf/test241.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

declare const Store: any; declare const Register: any;
declare const Elektroaufgaben: any; declare const Elektroarbeitsplatz: any;

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8994;

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
const seite = await browser.newPage({ viewport: { width: 1400, height: 900 } });
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
 * §1 · Die Arten
 * ========================================================================*/
console.log('\n1 · Die Aufgabenarten');

const arten = await seite.evaluate(() => ({
  anzahl: Elektroaufgaben.ARTEN.length,
  ids: Elektroaufgaben.ARTEN.map((a: any) => a.id),
  gruppen: Elektroaufgaben.gruppen(),
  ohneName: Elektroaufgaben.ARTEN.filter((a: any) => !a.name).map((a: any) => a.id),
  ohneGruppe: Elektroaufgaben.ARTEN.filter((a: any) => !a.gruppe).map((a: any) => a.id),
  doppelt: Elektroaufgaben.ARTEN.map((a: any) => a.id)
    .filter((x: string, i: number, l: string[]) => l.indexOf(x) !== i)
}));
p('Es gibt Aufgabenarten', arten.anzahl >= 8, `${arten.anzahl}`);
p('… in mehreren Gruppen', arten.gruppen.length >= 3, arten.gruppen.join(', '));
p('Jede hat einen Namen', !arten.ohneName.length, arten.ohneName.join(', '));
p('Jede gehört zu einer Gruppe', !arten.ohneGruppe.length, arten.ohneGruppe.join(', '));
p('Keine Kennung doppelt', !arten.doppelt.length, arten.doppelt.join(', '));
p('Fachzeichen, Rechnen, Schaltungen und Messen sind dabei',
  ['Fachzeichen', 'Rechnen', 'Schaltungen', 'Messen']
    .every(g => arten.gruppen.includes(g)), arten.gruppen.join(', '));

/* ==========================================================================
 * §2 · Jede Art liefert brauchbare Aufgaben
 * ------------------------------------------------------------------------
 * Vierzig Würfelungen je Art. Weniger wäre Glück: der Fall mit zwei gleichen
 * Antwortmöglichkeiten trat bei etwa jeder zwölften auf.
 * ========================================================================*/
console.log('\n2 · Vierzig Würfelungen je Art');

const proben = await seite.evaluate(() => {
  const raus: Record<string, any> = {};
  for (const art of Elektroaufgaben.ARTEN) {
    const maengel: string[] = [];
    let erzeugt = 0;
    for (let i = 0; i < 40; i++) {
      const a = Elektroaufgaben.erzeuge(art.id, 3000 + i * 13);
      if (!a) { maengel.push('nichts erzeugt'); continue; }
      erzeugt++;
      if (!a.frage) maengel.push('ohne Frage');
      if (!a.loesung) maengel.push('ohne Lösung');
      if (!a.erklaerung) maengel.push('ohne Erklärung');
      if (!(a.stufe >= 1 && a.stufe <= 3)) maengel.push('Stufe ' + a.stufe);
      if (a.art !== art.id) maengel.push('falsche Art: ' + a.art);
      if (a.antwortart === 'wahl') {
        const o: string[] = a.optionen || [];
        if (o.length !== 4) maengel.push(o.length + ' Möglichkeiten');
        if (!o.includes(a.loesung)) maengel.push('Lösung fehlt in den Möglichkeiten');
        if (new Set(o).size !== o.length) maengel.push('zwei gleiche Möglichkeiten');
        if (a.optionZeichen && a.optionZeichen.length !== o.length)
          maengel.push('Bilder und Texte zählen verschieden');
      }
      if (a.antwortart === 'zahl') {
        if (!Number.isFinite(Number(a.loesung))) maengel.push('Lösung keine Zahl');
        if (!a.einheit && a.art === 'umrechnen') maengel.push('ohne Einheit');
      }
    }
    raus[art.id] = { erzeugt, maengel: [...new Set(maengel)] };
  }
  return raus;
});
for (const art of arten.ids) {
  const r = proben[art];
  p(`${art}: vierzig Würfelungen ohne Mangel`,
    r.erzeugt === 40 && !r.maengel.length,
    `${r.erzeugt}/40 · ${r.maengel.slice(0, 2).join(' | ')}`);
}

/* ==========================================================================
 * §3 · Die eigene Lösung muss durchgehen
 * ------------------------------------------------------------------------
 * Der Kern. Eine Aufgabe, die ihre eigene Musterlösung ablehnt, ist nicht
 * schwer, sondern kaputt — und sie sieht völlig normal aus.
 * ========================================================================*/
console.log('\n3 · Die Aufgabe kennt ihre eigene Lösung');

const selbsttest = await seite.evaluate(() => {
  const raus: Record<string, string[]> = {};
  for (const art of Elektroaufgaben.ARTEN) {
    const schlecht: string[] = [];
    for (let i = 0; i < 40; i++) {
      const a = Elektroaufgaben.erzeuge(art.id, 5000 + i * 29);
      if (!a) continue;
      const pr = Elektroaufgaben.pruefe(a, a.loesung);
      if (!pr.richtig) schlecht.push(a.loesung + ' → ' + pr.hinweis);
    }
    raus[art.id] = schlecht.slice(0, 2);
  }
  return raus;
});
for (const art of arten.ids) {
  const schlecht = selbsttest[art] ?? ['(keine Probe gelaufen)'];
  p(`${art}: eigene Lösung gilt als richtig`, !schlecht.length, schlecht.join(' | '));
}

/* Und die Gegenprobe: eine falsche Antwort muss ABGELEHNT werden. Ohne diese
   Zeile würde ein `pruefe`, das immer `true` sagt, alles oben grün machen. */
const gegenprobe = await seite.evaluate(() => {
  const a = Elektroaufgaben.erzeuge('zeichen-name', 12345);
  const falsch = (a.optionen as string[]).find(o => o !== a.loesung);
  const r = Elektroaufgaben.rechne ? null : Elektroaufgaben.pruefe(a, falsch);
  const zahl = Elektroaufgaben.erzeuge('umrechnen', 999);
  return {
    wahlFalsch: r ? r.richtig : true,
    zahlFalsch: Elektroaufgaben.pruefe(zahl, String(Number(zahl.loesung) * 3)).richtig,
    leer: Elektroaufgaben.pruefe(a, '').richtig,
    quatsch: Elektroaufgaben.pruefe(zahl, 'abc').richtig
  };
});
p('Eine falsche Wahl wird abgelehnt', gegenprobe.wahlFalsch === false);
p('Eine falsche Zahl wird abgelehnt', gegenprobe.zahlFalsch === false);
p('Eine leere Antwort wird abgelehnt', gegenprobe.leer === false);
p('Buchstaben statt einer Zahl werden abgelehnt', gegenprobe.quatsch === false);

/* Der Faktor tausend ist der häufigste Fehler im Beruf. Ihn zu BENENNEN ist
   mehr wert als ein rotes Kreuz — der Rechenweg war richtig, das Komma nicht. */
const kommafehler = await seite.evaluate(() => {
  const a = Elektroaufgaben.erzeuge('umrechnen', 4711);
  return Elektroaufgaben.pruefe(a, String(Number(a.loesung) * 1000)).hinweis;
});
p('Ein Faktor tausend wird als solcher benannt',
  /tausendmal/.test(kommafehler), kommafehler);

/* ==========================================================================
 * §4 · Rechenaufgaben sind auch als Ganzes plausibel
 * ========================================================================*/
console.log('\n4 · Plausible Rechenaufgaben');

const rechenwerte = await seite.evaluate(() => {
  const raus: Array<{ frage: string; wert: number; einheit: string }> = [];
  for (let i = 0; i < 60; i++) {
    const a = Elektroaufgaben.erzeuge('rechnen', 8000 + i * 17);
    if (a) raus.push({ frage: a.frage, wert: Number(a.loesung), einheit: a.einheit });
  }
  return raus;
});
const absurd = rechenwerte.filter(x =>
  (x.einheit === 'V' && (x.wert > 1200 || x.wert < 0.01)) ||
  (x.einheit === 'A' && (x.wert > 200 || x.wert < 1e-6)) ||
  (x.einheit === 'W' && x.wert > 30000));
p('Keine Aufgabe verlangt 320 000 Volt', absurd.length === 0,
  absurd.slice(0, 2).map(x => `${x.wert} ${x.einheit}`).join(' | '));
p('Es kommen trotzdem genug Aufgaben zustande', rechenwerte.length >= 55,
  `${rechenwerte.length}/60`);
p('Jede Rechenaufgabe hat einen Rechenweg',
  (await seite.evaluate(() => {
    let ohne = 0;
    for (let i = 0; i < 30; i++) {
      const a = Elektroaufgaben.erzeuge('rechnen', 9000 + i * 11);
      if (a && !(a.weg || []).length) ohne++;
    }
    return ohne;
  })) === 0);

/* Und die Einheitenumrechnung bleibt in einem Bereich, den es im Beruf gibt. */
const umgerechnet = await seite.evaluate(() => {
  const raus: string[] = [];
  for (let i = 0; i < 40; i++) {
    const a = Elektroaufgaben.erzeuge('umrechnen', 11000 + i * 7);
    if (a) raus.push(a.frage);
  }
  return raus;
});
p('Keine Umrechnung über neun Zehnerpotenzen',
  !umgerechnet.some(f => /µ\w+ sind wie viel k/.test(f) || /p\w+ sind wie viel M/.test(f)),
  umgerechnet.filter(f => /µ\w+ sind wie viel k/.test(f))[0] || '');

/* ==========================================================================
 * §5 · Derselbe Startwert gibt dieselbe Aufgabe
 * ========================================================================*/
console.log('\n5 · Wiederholbarkeit');

const wieder = await seite.evaluate(() => {
  const a = Elektroaufgaben.erzeuge('rechnen', 4242);
  const b = Elektroaufgaben.erzeuge('rechnen', 4242);
  const c = Elektroaufgaben.erzeuge('rechnen', 4243);
  const r1 = Elektroaufgaben.reihe(8, { saat: 777 });
  const r2 = Elektroaufgaben.reihe(8, { saat: 777 });
  return {
    gleich: JSON.stringify(a) === JSON.stringify(b),
    anders: JSON.stringify(a) !== JSON.stringify(c),
    reiheGleich: JSON.stringify(r1) === JSON.stringify(r2),
    reiheLaenge: r1.length,
    reiheArten: new Set(r1.map((x: any) => x.art)).size,
    reiheDoppelt: r1.length - new Set(r1.map((x: any) => x.frage)).size
  };
});
p('Saat 4242 gibt zweimal dasselbe', wieder.gleich);
p('Saat 4243 gibt etwas anderes', wieder.anders);
p('Auch eine ganze Reihe wiederholt sich', wieder.reiheGleich);
p('Eine Reihe von acht ist acht lang', wieder.reiheLaenge === 8, `${wieder.reiheLaenge}`);
p('… aus mehreren Arten', wieder.reiheArten >= 4, `${wieder.reiheArten}`);
p('… und ohne doppelte Frage', wieder.reiheDoppelt === 0, `${wieder.reiheDoppelt}`);

/* Auf eine Art eingeschränkt: dann kommt auch nur die. */
const nurEine = await seite.evaluate(() =>
  Elektroaufgaben.reihe(6, { saat: 5, arten: ['umrechnen'] })
    .map((x: any) => x.art));
p('Eine Reihe lässt sich auf eine Art einschränken',
  nurEine.length === 6 && nurEine.every((x: string) => x === 'umrechnen'),
  nurEine.join(', '));

/* ==========================================================================
 * §6 · Die Übungsfläche
 * ========================================================================*/
console.log('\n6 · Üben');

await seite.evaluate(() => {
  Store.setMeta('elektro:uebungsstand', {});
  Store.setMeta('elektro:uebungsarten', []);
  Elektroarbeitsplatz.zeigeAls('Üben', Elektroarbeitsplatz.uebung());
});
await seite.waitForTimeout(700);
p('Die Übungsfläche steht', await seite.locator('.ea-wrap').count() === 1);
p('Es gibt eine Frage', (await seite.locator('.ea-frage').innerText()).length > 8);
p('Und Knöpfe für die Aufgabenarten',
  await seite.locator('.ea-art').count() === arten.anzahl + 1,
  `${await seite.locator('.ea-art').count()}`);

/* Das Band mit elf Arten rollt — und muss das zeigen. Ohne den auslaufenden
   Rand endet die letzte Art scharf an der Kante (E159, E188). */
const bandStand = await seite.evaluate(() => {
  const k = document.querySelector('.ea-artwahl') as HTMLElement;
  const l = document.querySelector('.ea-leiste') as HTMLElement;
  return { rollt: k.scrollWidth > k.clientWidth + 1, mehr: l.dataset.mehr ?? '(nicht gesetzt)' };
});
p('Das Artenband rollt hier wirklich', bandStand.rollt);
p('… und zeigt es mit einem auslaufenden Rand',
  bandStand.mehr !== '(nicht gesetzt)' && bandStand.mehr !== 'nein', bandStand.mehr);

/* Antworten: die richtige Möglichkeit wird IMMER markiert, auch wenn man sie
   getroffen hat — sonst weiss man nach einem Fehlgriff noch immer nicht, was
   stimmt, und rät beim nächsten Mal wieder. */
const vorAntwort = await seite.locator('.ea-aufloesung').count();
p('Vor der Antwort steht keine Auflösung da', vorAntwort === 0);
await seite.locator('.ea-option, [data-a="pruefen"]').first().click();
await seite.waitForTimeout(400);
p('Nach der Antwort schon', await seite.locator('.ea-aufloesung').count() === 1);
p('Die richtige Möglichkeit ist markiert',
  await seite.locator('.ea-option.loesung').count() === 1);
p('Und es steht dabei, WARUM', (await seite.locator('.ea-warum').innerText()).length > 20);
p('Weiterklicken ist nicht mehr möglich',
  await seite.locator('.ea-option:not([disabled])').count() === 0);

const standText = await seite.locator('.ea-stand').innerText();
p('Der Fuss zählt mit', /von 1 richtig/.test(standText), standText);

await seite.locator('[data-a="weiter"]').click();
await seite.waitForTimeout(400);
p('Die nächste Aufgabe kommt', await seite.locator('.ea-aufloesung').count() === 0);

/* Eine Art auswählen: dann kommt nur die. */
await seite.locator('.ea-art[data-art="umrechnen"]').click();
await seite.waitForTimeout(400);
p('Eine gewählte Art gilt',
  /einheiten/i.test(await seite.locator('.ea-artname').innerText()),
  await seite.locator('.ea-artname').innerText());
p('Und der Knopf ist als gewählt zu sehen',
  await seite.locator('.ea-art[data-art="umrechnen"].an').count() === 1);

/* Der Stand überlebt das Schliessen — er gehört dem Menschen. */
const gemerkt = await seite.evaluate(() => Store.getMeta('elektro:uebungsstand', {}));
p('Der Übungsstand liegt in Store.meta', Object.keys(gemerkt).length >= 1,
  JSON.stringify(gemerkt));

await seite.evaluate(() => document.querySelectorAll('.overlay').forEach(x => x.remove()));

/* ==========================================================================
 * §7 · Der Prüfungsmodus (Punkt 99)
 * ========================================================================*/
console.log('\n7 · Prüfung');

await seite.evaluate(() =>
  Elektroarbeitsplatz.zeigeAls('Prüfung', Elektroarbeitsplatz.pruefungFlaeche(5, 4242)));
await seite.waitForTimeout(700);
p('Die Prüfung steht', await seite.locator('.ea-pruefung').count() === 1);
p('Sie sagt, wo man ist', /Aufgabe 1 von 5/.test(
  await seite.locator('.ea-fortschritt').innerText()));
/* In der Prüfung gibt es KEINE Auflösung — sonst wäre es eine Übung mit
   Zeitdruck. */
await seite.locator('.ea-option, [data-a="vor"]').first().click();
await seite.waitForTimeout(400);
p('Nach der Antwort kommt keine Auflösung',
  await seite.locator('.ea-warum').count() === 0);
p('Sondern die nächste Aufgabe', /Aufgabe 2 von 5/.test(
  await seite.locator('.ea-fortschritt').innerText()),
  await seite.locator('.ea-fortschritt').innerText());
p('Zurückblättern geht', await seite.locator('[data-a="zurueck"]:not([disabled])').count() === 1);

for (let i = 0; i < 8; i++) {
  if (await seite.locator('.ea-ergebnis').count()) break;
  const wahl = seite.locator('.ea-option');
  if (await wahl.count()) await wahl.first().click();
  else { const f = seite.locator('.ea-antwort');
         if (await f.count()) await f.fill('1');
         await seite.locator('[data-a="vor"]').click(); }
  await seite.waitForTimeout(250);
}
p('Am Ende steht ein Ergebnis', await seite.locator('.ea-ergebnis').count() === 1);
const ergebnis = await seite.locator('.ea-ergebnis').innerText();
p('Es nennt die Zahl der richtigen', /von 5 richtig/.test(ergebnis), ergebnis.slice(0, 40));
p('… und eine Note', /Note \d/.test(ergebnis));
p('… und listet die Aufgaben einzeln auf',
  await seite.locator('.ea-liste li').count() === 5,
  `${await seite.locator('.ea-liste li').count()}`);
/* Der Startwert steht da: damit lässt sich dieselbe Prüfung im Unterricht
   für alle gleich stellen und später Wort für Wort nachbesprechen. */
p('Der Startwert wird genannt', /4242/.test(ergebnis), ergebnis.slice(-90));
p('Und man kann die Aufgaben danach durchgehen',
  await seite.locator('[data-a="durchgehen"]').count() === 1);

await seite.locator('[data-a="durchgehen"]').click();
await seite.waitForTimeout(500);
p('Beim Durchgehen stehen alle fünf da',
  await seite.locator('.ea-durchgang .ea-aufgabe').count() === 5,
  `${await seite.locator('.ea-durchgang .ea-aufgabe').count()}`);
p('… jetzt MIT Erklärung', await seite.locator('.ea-durchgang .ea-warum').count() === 5);

const auswertung = await seite.evaluate(() => {
  const pr = Elektroarbeitsplatz.pruefungStarten(4, 999);
  pr.antworten = pr.aufgaben.map((a: any) => a.loesung);   /* alles richtig */
  const alles = Elektroarbeitsplatz.auswerten(pr);
  pr.antworten = pr.aufgaben.map(() => 'unsinn');          /* alles falsch */
  const nichts = Elektroarbeitsplatz.auswerten(pr);
  return { alles, nichts };
});
p('Alles richtig ergibt die volle Zahl', auswertung.alles.richtig === 4,
  `${auswertung.alles.richtig}/4`);
p('… und Note 6', auswertung.alles.note === '6.0', auswertung.alles.note);
p('Nichts richtig ergibt null', auswertung.nichts.richtig === 0);
p('… und Note 1', auswertung.nichts.note === '1.0', auswertung.nichts.note);

await seite.evaluate(() => document.querySelectorAll('.overlay').forEach(x => x.remove()));

/* ==========================================================================
 * §8 · Der Arbeitsplatz (Punkt 100)
 * ========================================================================*/
console.log('\n8 · Der Arbeitsplatz');

await seite.evaluate(() =>
  Elektroarbeitsplatz.zeigeAls('Arbeitsplatz', Elektroarbeitsplatz.arbeitsplatz()));
await seite.waitForTimeout(800);
p('Er hat drei Spalten', await seite.locator('.ea-spalte').count() === 3);
const kopfe = await seite.locator('.ea-spaltenkopf').allInnerTexts();
p('Aufgaben, Plan und Notizen',
  JSON.stringify(kopfe) === JSON.stringify(['AUFGABEN', 'PLAN', 'NOTIZEN']),
  JSON.stringify(kopfe));
p('Links stehen Aufgaben', await seite.locator('.ea-links .ea-aufgabe').count() === 1);
p('Rechts ein Feld für Notizen', await seite.locator('.ea-notizen').count() === 1);
p('Und ein Knopf zum Formelheft', await seite.locator('[data-a="heft"]').count() === 1);

/* Alles muss im Bild sein. Beim ersten Bau stand das Fenster bei y=126, war
   800 hoch und endete damit 26 px UNTER dem Bildschirmrand — der Weiter-Knopf
   war unerreichbar, und die Übung damit zu Ende. */
const passt = await seite.evaluate(() => {
  const f = document.querySelector('.ea-fenster') as HTMLElement;
  const r = f.getBoundingClientRect();
  const fuss = document.querySelector('.ea-links .ea-fuss') as HTMLElement;
  const rf = fuss.getBoundingClientRect();
  return { unten: Math.round(r.bottom), sicht: window.innerHeight,
           fussUnten: Math.round(rf.bottom) };
});
p('Das Fenster passt auf den Bildschirm', passt.unten <= passt.sicht,
  `${passt.unten} von ${passt.sicht}`);
p('Und der Weiter-Knopf ist erreichbar', passt.fussUnten <= passt.sicht,
  `${passt.fussUnten} von ${passt.sicht}`);

/* Nichts darf abgeschnitten sein — der Fehler aus §55.1, hier in Buchstaben.
   Die Aufgabenspalte ist 280 px breit, während das Fenster 1180 hat: eine
   Medienabfrage nach Bildschirmbreite sieht das nie. */
const geschnitten = await seite.evaluate(() => {
  const raus: string[] = [];
  document.querySelectorAll<HTMLElement>('.ea-option, .ea-art, .ea-spaltenkopf')
    .forEach(e => {
      if (e.scrollWidth > e.clientWidth + 1)
        raus.push((e.textContent || '').trim().slice(0, 26) +
          ` (${e.scrollWidth}>${e.clientWidth})`);
    });
  return raus;
});
/* Die Artenleiste DARF rollen — sie hat ihren auslaufenden Rand. Die
   Antwortmöglichkeiten dürfen es nicht. */
const echteFehler = geschnitten.filter(x => !/^(Alles gemischt|Zeichen|Gruppe|Anschl|Kennbuch|Rechnen|Einheiten|Fehlendes|Schaltung|Betriebsm|Richtig)/.test(x));
p('Keine Antwortmöglichkeit ist abgeschnitten', echteFehler.length === 0,
  echteFehler.slice(0, 3).join(' · '));

/* Die Notizen überleben — sie gehören dem Menschen. */
await seite.locator('.ea-notizen').fill('R1 ist der Vorwiderstand, 220 Ω');
await seite.waitForTimeout(700);
const notiz = await seite.evaluate(() => Store.getMeta('elektro:notizen', ''));
p('Notizen werden gemerkt', notiz === 'R1 ist der Vorwiderstand, 220 Ω', notiz);

/* ==========================================================================
 * §9 · Der Weg hinein
 * ========================================================================*/
console.log('\n9 · Befehle');

const befehle = await seite.evaluate(() =>
  Register.befehle.alle().filter((b: any) => /^Elektro/.test(b.titel))
    .map((b: any) => b.titel));
p('Üben, Prüfung und Arbeitsplatz stehen in der Palette',
  befehle.length >= 3, JSON.stringify(befehle));
p('… alle unter „Elektro"',
  (await seite.evaluate(() => Register.befehle.alle()
    .filter((b: any) => /^Elektro/.test(b.titel))
    .every((b: any) => b.gruppe === 'Elektro'))));

/* ==========================================================================
 * §10 · Am Telefon (§37)
 * ========================================================================*/
console.log('\n10 · Am Telefon');

await seite.evaluate(() => document.querySelectorAll('.overlay').forEach(x => x.remove()));
await seite.setViewportSize({ width: 390, height: 780 });
await seite.waitForTimeout(300);
await seite.evaluate(() => Elektroarbeitsplatz.zeigeAls('Üben', Elektroarbeitsplatz.uebung()));
await seite.waitForTimeout(700);

const handy = await seite.evaluate(() => {
  const f = document.querySelector('.ea-fenster') as HTMLElement;
  const r = f.getBoundingClientRect();
  const klein: string[] = [];
  document.querySelectorAll<HTMLElement>('.ea-option, .ea-fuss button').forEach(b => {
    const rb = b.getBoundingClientRect();
    if (rb.height && rb.height < 38)
      klein.push((b.textContent || '').trim().slice(0, 16) + ' ' + Math.round(rb.height));
  });
  const eineSpalte = getComputedStyle(
    document.querySelector('.ea-wahl') || document.createElement('div'))
    .gridTemplateColumns.split(' ').length;
  return { breite: Math.round(r.width), unten: Math.round(r.bottom),
           sicht: window.innerHeight, klein, spalten: eineSpalte };
});
p('Es passt auf den Telefonbildschirm',
  handy.breite <= 391 && handy.unten <= handy.sicht + 1,
  `${handy.breite} breit, unten ${handy.unten} von ${handy.sicht}`);
p('Die Möglichkeiten stehen untereinander', handy.spalten === 1, `${handy.spalten} Spalten`);
p('Jeder Knopf ist mit dem Finger zu treffen', handy.klein.length === 0,
  handy.klein.slice(0, 3).join(' · '));

p('Keine Fehler auf der Seite', fehler.length === 0, fehler.join(' · '));

console.log(`\n${ok} bestanden, ${weg} gescheitert`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
