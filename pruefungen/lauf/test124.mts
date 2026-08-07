/* Suite 88 — Erinnerungen am Telefon, und ein Fehlerbalken, der etwas sagt
 * ============================================================================
 * ZWEI SACHEN AUS DEM BETRIEB, beide am Telefon gemeldet.
 *
 * 1 · DER VORSCHLAG IM ERINNERUNGSDIALOG WAR ZWEI STUNDEN FALSCH.
 *     Dort stand `toISOString().slice(0, 16)`, und das ist WELTZEIT; ein
 *     `datetime-local`-Feld erwartet ORTSZEIT. In der Schweiz schlug der
 *     Dialog im Sommer 19:43 vor, wo 21:43 gemeint war — „in einer Stunde"
 *     wurde zu „vor einer Stunde". Wer den Vorschlag übernahm, setzte eine
 *     Erinnerung in die Vergangenheit, und sie meldete sich sofort.
 *
 *     Dieser Fehler ist in London unsichtbar. Ein Prüflauf ohne Zeitzone
 *     hätte ihn nie gefunden — deshalb läuft dieser hier ausdrücklich in
 *     `Europe/Zurich`.
 *
 * 2 · DER FEHLERBALKEN BAT UM ETWAS, DAS ES NICHT GAB.
 *     „Es ist ein Fehler aufgetreten: Script error. — bitte melde mir
 *     diesen Text." `Script error.` ist die leere Hülle, die jeder Browser
 *     liefert, wenn ein Skript von FREMDER Adresse stolpert: keine Datei,
 *     keine Zeile, kein Stapel. Es gibt nichts zu melden, und die Bitte
 *     darum lässt den Menschen mit einer unlösbaren Aufgabe zurück.
 *
 * DAZU DAS, WONACH GEFRAGT WURDE: ein Kalendereintrag trägt sein Datum in
 * einer Spalte. Wer dort „morgen 08:00" stehen hat und eine Erinnerung
 * setzt, meint diese Zeit — der Dialog schlägt sie jetzt vor, statt sie am
 * Telefon abtippen zu lassen.
 *
 *   node pruefungen/lauf/test124.mts
 * ==========================================================================*/

import { chromium } from 'playwright';
import path from 'node:path';

declare const Store: any; declare const Werkzeuge: any; declare const UI: any;

const WURZEL = path.resolve(import.meta.dirname, '../..');
let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};

const browser = await chromium.launch();
/* Telefon, und zwar mit Zeitzone: ohne sie ist Abschnitt 1 blind. */
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true,
  timezoneId: 'Europe/Zurich', locale: 'de-CH',
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 ' +
             '(KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
});
const seite = await ctx.newPage();
const jsFehler: string[] = [];
seite.on('pageerror', (e: Error) => jsFehler.push(e.message));
await seite.goto('file://' + WURZEL + '/index.html');
await seite.waitForTimeout(2200);

/* ==========================================================================
 * 1 · Der Vorschlag steht in Ortszeit
 * ========================================================================*/
console.log('\n1 · Der Vorschlag steht in Ortszeit');

const zeit = await seite.evaluate(() => {
  const p2 = Store.addBlock(null, 'page', { text: 'Irgendwas' });
  Werkzeuge.erinnerungSetzen(p2);
  const feld = document.querySelector<HTMLInputElement>('#ez');
  const wert = feld?.value ?? '';
  document.querySelector('.overlay')?.remove();
  const inEinerStunde = new Date(Date.now() + 3600000);
  const ortszeit = new Date(inEinerStunde.getTime() - inEinerStunde.getTimezoneOffset() * 60000)
    .toISOString().slice(0, 16);
  const weltzeit = inEinerStunde.toISOString().slice(0, 16);
  return { wert, ortszeit, weltzeit, versatz: inEinerStunde.getTimezoneOffset() };
}) as { wert: string; ortszeit: string; weltzeit: string; versatz: number };

p('Die Prüfung läuft wirklich in einer verschobenen Zone', zeit.versatz !== 0,
  `Versatz ${zeit.versatz} Minuten — ohne Versatz kann dieser Abschnitt nicht rot werden`);
p('Der Vorschlag ist die Ortszeit', zeit.wert === zeit.ortszeit,
  `vorgeschlagen ${zeit.wert}, richtig wäre ${zeit.ortszeit}`);
p('… und ausdrücklich NICHT die Weltzeit', zeit.wert !== zeit.weltzeit,
  `beides ${zeit.wert} — dann ist die Zone gerade zufällig gleich`);
p('Der Vorschlag liegt in der Zukunft', new Date(zeit.wert).getTime() > Date.now(),
  'eine Erinnerung, die beim Öffnen schon vorbei ist, meldet sich sofort');

/* ==========================================================================
 * 2 · Ein Kalendereintrag bringt seine Zeit mit
 * ========================================================================*/
console.log('\n2 · Ein Kalendereintrag bringt seine Zeit mit');

const kalender = await seite.evaluate(() => {
  const s2 = Store.addBlock(null, 'page', { text: 'Termine' });
  /* `addDatabase` gibt { block, collectionId, viewId } zurück — die
     Sammlungskennung ist nicht die Blockkennung. */
  const db = Store.addDatabase(s2.id, 'Kalender',
    { Name: { name: 'Name', type: 'text' }, Wann: { name: 'Wann', type: 'date' } });
  const morgen = new Date(); morgen.setDate(morgen.getDate() + 1); morgen.setHours(8, 0, 0, 0);
  const row = Store.addRow(db.collectionId, { title: 'Aufstehen' });
  Store.setProp(row.id, 'Wann', morgen.toISOString());

  Werkzeuge.erinnerungSetzen(Store.getBlock(row.id));
  const wert = document.querySelector<HTMLInputElement>('#ez')?.value ?? '';
  const text = document.querySelector<HTMLInputElement>('#et')?.value ?? '';
  const kasten = document.querySelector<HTMLElement>('.finder')?.getBoundingClientRect();
  document.querySelector('.overlay')?.remove();

  const soll = new Date(morgen.getTime() - morgen.getTimezoneOffset() * 60000)
    .toISOString().slice(0, 16);
  return { wert, soll, text,
           breite: kasten ? Math.round(kasten.width) : -1,
           links: kasten ? Math.round(kasten.left) : -1 };
}) as { wert: string; soll: string; text: string; breite: number; links: number };

p('Die Zeit aus der Datumsspalte wird vorgeschlagen', kalender.wert === kalender.soll,
  `vorgeschlagen ${kalender.wert}, im Kalender steht ${kalender.soll}`);
p('Der Name des Eintrags steht als Text da', kalender.text === 'Aufstehen', kalender.text);
p('Der Dialog passt aufs Telefon', kalender.breite > 0 && kalender.breite <= 390 &&
  kalender.links >= 0, `${kalender.breite} px breit, links bei ${kalender.links}`);

/* Ein Datum OHNE Uhrzeit meint den Morgen, nicht Mitternacht. */
const mitternacht = await seite.evaluate(() => {
  const s3 = Store.addBlock(null, 'page', { text: 'Ganztägig' });
  const db = Store.addDatabase(s3.id, 'Tage',
    { Name: { name: 'Name', type: 'text' }, Tag: { name: 'Tag', type: 'date' } });
  const tag = new Date(); tag.setDate(tag.getDate() + 2); tag.setHours(0, 0, 0, 0);
  const row = Store.addRow(db.collectionId, { title: 'Zahnarzt' });
  Store.setProp(row.id, 'Tag', tag.toISOString());
  Werkzeuge.erinnerungSetzen(Store.getBlock(row.id));
  const wert = document.querySelector<HTMLInputElement>('#ez')?.value ?? '';
  document.querySelector('.overlay')?.remove();
  return wert;
}) as string;
p('Ein Datum ohne Uhrzeit wird zu 08:00, nicht zu 00:00',
  mitternacht.endsWith('T08:00'), mitternacht + ' — um Mitternacht will niemand geweckt werden');

/* ==========================================================================
 * 3 · Eine verpasste Erinnerung sagt, dass sie verpasst ist
 * ========================================================================*/
console.log('\n3 · Eine verpasste Erinnerung sagt es');

const verpasst = await seite.evaluate(() => {
  const gestern = new Date(Date.now() - 3 * 3600000);
  const s4 = Store.addBlock(null, 'page', { text: 'Alt' });
  Store.setMeta('erinnerungen', [{ id: 'e-alt', pageId: s4.id,
    zeit: gestern.toISOString(), text: 'Aufstehen', erledigt: false }]);
  const gesehen: string[] = [];
  const alt = UI.toast;
  UI.toast = (t: string) => { gesehen.push(String(t)); };
  Werkzeuge.erinnerungenPruefen();
  UI.toast = alt;
  const wann = gestern.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  return { gesehen, wann,
           erledigt: (Store.getMeta('erinnerungen', []) || [])[0]?.erledigt };
}) as { gesehen: string[]; wann: string; erledigt: boolean };

p('Die alte Erinnerung meldet sich', verpasst.gesehen.length === 1,
  JSON.stringify(verpasst.gesehen));
p('Sie sagt „Verpasst" und nennt die gemeinte Zeit',
  (verpasst.gesehen[0] ?? '').startsWith('Verpasst um ' + verpasst.wann),
  `„${verpasst.gesehen[0]}" — sie tut so, als wäre es jetzt`);
p('Und sie meldet sich nur einmal', verpasst.erledigt === true);

const puenktlich = await seite.evaluate(() => {
  const s5 = Store.addBlock(null, 'page', { text: 'Jetzt' });
  Store.setMeta('erinnerungen', [{ id: 'e-neu', pageId: s5.id,
    zeit: new Date(Date.now() - 5000).toISOString(), text: 'Tee', erledigt: false }]);
  const gesehen: string[] = [];
  const alt = UI.toast;
  UI.toast = (t: string) => { gesehen.push(String(t)); };
  Werkzeuge.erinnerungenPruefen();
  UI.toast = alt;
  return gesehen[0] ?? '';
}) as string;
p('Eine pünktliche Erinnerung sagt NICHT „Verpasst"',
  puenktlich.startsWith('⏰'), `„${puenktlich}"`);

/* ==========================================================================
 * 4 · Der Fehlerbalken sagt, was er weiss — und was nicht
 * ========================================================================*/
console.log('\n4 · Der Fehlerbalken sagt, was er weiss');

const balken = await seite.evaluate(() => {
  const lies = () => [...document.querySelectorAll('#fehler-karte')]
    .map(b => (b.textContent || '').trim());
  const leeren = () => document.querySelectorAll('#fehler-karte').forEach(b => b.remove());

  leeren();
  /* Die leere Hülle: genau dieser Satz, ohne Datei, ohne Fehlerobjekt. */
  dispatchEvent(new ErrorEvent('error', { message: 'Script error.' }));
  const fremd = lies();

  leeren();
  dispatchEvent(new ErrorEvent('error', { message: 'x ist nicht definiert',
    filename: 'https://beispiel.ch/quell/kern/etwas.js', lineno: 42 }));
  const echt = lies();

  leeren();
  dispatchEvent(new ErrorEvent('error', { message: 'zweimal derselbe',
    filename: 'a.js', lineno: 7 }));
  dispatchEvent(new ErrorEvent('error', { message: 'zweimal derselbe',
    filename: 'a.js', lineno: 7 }));
  const doppelt = lies().length;

  /* Die Karte selbst: nicht markierbar, Schliessen gross genug, und der
     technische Text steht NICHT darin — er wartet hinter „Details". */
  leeren();
  dispatchEvent(new ErrorEvent('error', { message: 'geheimer technikkram',
    filename: 'b.js', lineno: 3 }));
  const karte = document.querySelector<HTMLElement>('#fehler-karte');
  const zu = karte?.querySelector<HTMLElement>('.fk-zu');
  const form = karte ? {
    markierbar: getComputedStyle(karte).userSelect !== 'none',
    breite: Math.round(karte.getBoundingClientRect().width),
    zuHoch: zu ? Math.round(zu.getBoundingClientRect().height) : 0,
    hatKopieren: /Details kopieren/.test(karte.textContent || ''),
    hatSchliessen: /Schliessen/.test(karte.textContent || ''),
    zeigtTechnik: /geheimer technikkram/.test(karte.textContent || ''),
    alltagssatz: /nicht ausführen|von ausserhalb/.test(karte.textContent || '')
  } : null;
  leeren();
  return { fremd, echt, doppelt, form,
           protokoll: (Store.getMeta('fehlerprotokoll', []) || []).length };
}) as { fremd: string[]; echt: string[]; doppelt: number;
        form: { markierbar: boolean; breite: number; zuHoch: number; hatKopieren: boolean;
                hatSchliessen: boolean; zeigtTechnik: boolean; alltagssatz: boolean } | null;
        protokoll: number };

p('Ein fremder Fehler erzeugt einen Balken', balken.fremd.length === 1,
  JSON.stringify(balken.fremd));
p('Er bittet NICHT mehr um einen Text, den es nicht gibt',
  !/melde mir diesen Text/.test(balken.fremd.join(' ')),
  balken.fremd.join(' '));
p('Er sagt stattdessen, woher der Fehler kommt und dass Redion weiterläuft',
  /ausserhalb/.test(balken.fremd.join(' ')) && /läuft weiter/.test(balken.fremd.join(' ')),
  balken.fremd.join(' '));
p('Ein echter Fehler sagt es in Alltagssprache', /nicht ausführen/.test(balken.echt.join(' ')),
  balken.echt.join(' '));
p('… und stellt den technischen Text NICHT auf die Karte',
  !/etwas\.js:42/.test(balken.echt.join(' ')) && !/nicht definiert/.test(balken.echt.join(' ')),
  balken.echt.join(' ') + ' — der technische Teil gehört hinter „Details kopieren"');
p('Derselbe Fehler zweimal ergibt einen Balken, nicht zwei', balken.doppelt === 1,
  String(balken.doppelt) + ' — eine Schleife baut sonst einen Balken pro Durchgang');
p('Die Fehler stehen im Protokoll — auf dem Telefon gibt es keine Konsole',
  balken.protokoll >= 3, String(balken.protokoll));

console.log('\n5 · Die Fehlerkarte hat die Form aus der Vorgabe');
p('Es gibt eine Karte', !!balken.form);
p('Sie ist nicht markierbar', balken.form?.markierbar === false,
  'markierter Fehlertext sieht aus wie Inhalt, den man anfassen soll');
p('Sie ist schmaler als der Bildschirm', (balken.form?.breite ?? 999) <= 390 - 20,
  String(balken.form?.breite));
p('Das Schliessen-Kreuz ist 44 px hoch', (balken.form?.zuHoch ?? 0) >= 44,
  String(balken.form?.zuHoch));
p('„Details kopieren" und „Schliessen" stehen da',
  balken.form?.hatKopieren === true && balken.form?.hatSchliessen === true);
p('Der technische Text steht NICHT auf der Karte',
  balken.form?.zeigtTechnik === false,
  'er gehört hinter „Details kopieren", nicht vor die Augen');
p('Stattdessen ein Satz in Alltagssprache', balken.form?.alltagssatz === true);

console.log('\n6 · Die Meldung des Geräts — auf dem Weg, den ein iPhone kann');

/* ===========================================================================
 * DER FEHLER, GEGEN DEN DIESER ABSCHNITT STEHT (7. August 2026)
 * ---------------------------------------------------------------------------
 * Redion zeigte Erinnerungen mit
 *
 *     try { new Notification(text, { … }); } catch {}
 *
 * und auf einem iPhone ist das eine Zeile, die nichts tut. Eine
 * INSTALLIERTE Web-App kennt den Konstruktor `Notification` dort gar nicht
 * — Apple unterstützt ausschliesslich `registration.showNotification()`.
 * Der Aufruf wirft `Illegal constructor`, das `catch` verschluckte es, und
 * übrig blieb der Hinweis in der App. Genau die Funktion, um die Redur
 * gebeten hatte, scheiterte auf seinem Gerät lautlos.
 *
 * WIE MAN DAS OHNE IPHONE PRÜFT. Nicht mit einem zweiten Browser, sondern
 * indem man ihm dieselbe Einschränkung gibt: `window.Notification` wird
 * durch einen Konstruktor ersetzt, der wirft — wie auf dem iPhone. Bleibt
 * dann eine Meldung übrig, kann sie nur über die Registrierung gekommen
 * sein. Der Weg ist der Beweis, nicht die Absicht.
 * =========================================================================*/
const meldung = await seite.evaluate(async () => {
  const gesehen: any[] = [];
  const echterKonstruktor = (window as any).Notification;
  const echterSW = (navigator as any).serviceWorker;

  /* DAS IPHONE NACHSTELLEN: der Konstruktor wirft, wie dort. */
  const kaputt: any = function () { throw new TypeError('Illegal constructor'); };
  kaputt.permission = 'granted';
  (window as any).Notification = kaputt;

  /* Die Registrierung wird NACHGESTELLT statt abgewartet. Auf das echte
     Dienst-Skript zu warten hiesse, die Lebensdauer eines Service Workers
     mitzuprüfen — und `serviceWorker.ready` bleibt offen, wenn nie eines
     kommt: dieser Prüflauf blieb daran hängen. Gemessen wird Redions
     Verzweigung, nicht die Maschinerie des Browsers. */
  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    get: () => ({
      ready: Promise.resolve({
        showNotification: (titel: string, o: any) => {
          gesehen.push({ titel, body: o && o.body, tag: o && o.tag,
                         seite: o && o.data && o.data.seite });
          return Promise.resolve();
        }
      })
    })
  });

  const weg = await Werkzeuge.geraeteMeldung('Erinnerung: Aufstehen', 'In Redion',
                                             'e1', 'seite-42');

  Object.defineProperty(navigator, 'serviceWorker',
    { get: () => echterSW, configurable: true });
  (window as any).Notification = echterKonstruktor;
  return { weg, gesehen };
}) as { weg: string; gesehen: any[] };

p('Auch ohne `new Notification` kommt eine Meldung an',
  meldung.gesehen.length === 1,
  'genau das war der iPhone-Fall — vorher blieb hier nichts übrig');
p('Sie geht über das Dienst-Skript', meldung.weg === 'dienst', meldung.weg);
p('Der Text steht drin', meldung.gesehen[0]?.titel === 'Erinnerung: Aufstehen',
  String(meldung.gesehen[0]?.titel));
p('Und die Seite reist mit, damit der Tipp irgendwo hinführt',
  meldung.gesehen[0]?.seite === 'seite-42', String(meldung.gesehen[0]?.seite));

/* Und die Gegenrichtung: OHNE Dienst-Skript muss der alte Weg bleiben —
   Redion soll auch per Doppelklick aus dem Dateisystem laufen (§6), und
   dort lässt sich keines registrieren. */
const ohneDienst = await seite.evaluate(async () => {
  let gebaut: any = null;
  try {
    Object.defineProperty(Notification, 'permission',
      { get: () => 'granted', configurable: true });
  } catch {}
  const echterKonstruktor = (window as any).Notification;
  const attrappe: any = function (this: any, titel: string, o: any) {
    gebaut = { titel, body: o && o.body }; this.onclick = null;
  };
  attrappe.permission = 'granted';
  (window as any).Notification = attrappe;

  /* Kein Dienst-Skript: `serviceWorker` verschwindet für diesen Aufruf. */
  const echterSW = (navigator as any).serviceWorker;
  Object.defineProperty(navigator, 'serviceWorker',
    { get: () => undefined, configurable: true });

  const weg = await Werkzeuge.geraeteMeldung('Ohne Dienst', 'Text', 'e2', '');

  Object.defineProperty(navigator, 'serviceWorker',
    { get: () => echterSW, configurable: true });
  (window as any).Notification = echterKonstruktor;
  return { weg, gebaut };
}) as { weg: string; gebaut: any };

p('Ohne Dienst-Skript bleibt der alte Weg', ohneDienst.weg === 'fenster', ohneDienst.weg);
p('… und zeigt denselben Text', ohneDienst.gebaut?.titel === 'Ohne Dienst',
  String(ohneDienst.gebaut?.titel));

/* ---------------------------------------------------------------------------
 * UND DER FALL, DER DIESEN PRÜFLAUF SELBST ZUM HÄNGEN BRACHTE
 * ---------------------------------------------------------------------------
 * `navigator.serviceWorker.ready` wird nie ABGELEHNT. Kommt nie eines,
 * bleibt das Versprechen einfach offen — für immer. Der erste Entwurf von
 * `geraeteMeldung` wartete darauf ohne Frist und hätte die Erinnerung damit
 * ganz verschluckt, statt sie über den Rückfall zu zeigen: schlimmer als
 * der Fehler, den sie beheben sollte. Gefunden hat es dieser Abschnitt,
 * indem er daran hängenblieb.
 * -------------------------------------------------------------------------*/
const haengt = await seite.evaluate(async () => {
  const echterKonstruktor = (window as any).Notification;
  const echterSW = (navigator as any).serviceWorker;
  let gebaut: any = null;

  const attrappe: any = function (this: any, titel: string) { gebaut = { titel }; };
  attrappe.permission = 'granted';
  (window as any).Notification = attrappe;

  /* Ein `ready`, das nie fertig wird — genau wie im Browser ohne Skript. */
  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    get: () => ({ ready: new Promise(() => { /* nie */ }) })
  });

  const start = Date.now();
  const weg = await Werkzeuge.geraeteMeldung('Trotzdem', 'Text', 'e3', '');
  const dauer = Date.now() - start;

  Object.defineProperty(navigator, 'serviceWorker',
    { get: () => echterSW, configurable: true });
  (window as any).Notification = echterKonstruktor;
  return { weg, dauer, gebaut };
}) as { weg: string; dauer: number; gebaut: any };

p('Ein Dienst-Skript, das nie fertig wird, verschluckt die Meldung nicht',
  haengt.weg === 'fenster', haengt.weg + ' nach ' + haengt.dauer + ' ms');
p('… und die Frist greift in wenigen Sekunden', haengt.dauer < 4000,
  haengt.dauer + ' ms — ohne Frist wäre es nie zurückgekommen');
p('… und der Text ist trotzdem da', haengt.gebaut?.titel === 'Trotzdem');

/* Der Tipp auf die Meldung gehört ab jetzt dem Dienst-Skript. Ohne diesen
   Zweig öffnet er gar nichts — geprüft an der Quelle, weil ein Prüflauf
   keine Systemmeldung antippen kann. */
const swQuelle = await (await import('node:fs')).promises.readFile(
  path.join(WURZEL, 'sw.js'), 'utf8');
p('Das Dienst-Skript nimmt den Tipp entgegen',
  /addEventListener\('notificationclick'/.test(swQuelle),
  'ohne `notificationclick` führt die Meldung ins Leere');
p('… und holt ein offenes Fenster nach vorn, statt ein zweites zu öffnen',
  /matchAll/.test(swQuelle) && /focus\(\)/.test(swQuelle));

p('Keine echten JS-Fehler beim Laden', jsFehler.length === 0, jsFehler.slice(0, 2).join(' · '));

await browser.close();
console.log(`\n  Suite 88 — Erinnerungen und Fehlerbalken: ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
