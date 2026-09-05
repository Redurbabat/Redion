/* Suite 423 — „Kalender" öffnet einen Kalender, und zwar als eigenen Ort
 *              (E430, E431)
 * ============================================================================
 * Der Navigationseintrag versprach:
 *
 *     { id: 'app-kalender', name: 'Kalender', icon: '📅',
 *       hinweis: 'Termine aus allen Quellen',
 *       tun: () => Kalender.dialog() }
 *
 * `Kalender.dialog()` ist aber der Dialog „Kalender verbinden" — Google,
 * CalDAV, Client-ID. Kein Kalender, keine Termine, sondern eine Überlagerung
 * mit Verbindungseinstellungen. Der Hinweis sagt „Termine aus allen
 * Quellen", und was aufgeht, sind die Quellen selbst.
 *
 * DEN KALENDER GAB ES DIE GANZE ZEIT. Die Arbeitswelt zeichnet die
 * Chronologie aller Datumsfelder aus allen lesbaren Datenbanken. Es fehlte
 * nur die Tür.
 *
 * UND DER UNTERSCHIED IST NICHT KOSMETISCH. Eine Überlagerung hat keine
 * Adresse, keinen Zurück-Weg und keine Krume; sie liegt über der Seite und
 * ist wieder weg. Ein Ort hat all das — wie „Aufgaben" und „Bibliothek",
 * die im selben Register daneben stehen und es seit jeher richtig machen.
 *
 * E431 — DER KALENDER IST KEIN ABSCHNITT DES ARBEITSBEREICHS.
 * E430 hängte ihn als Ansicht in den Workspace: richtiger Ort, aber mit der
 * Spalte „Übersicht · Bibliothek · Aufgaben · …" daneben, dem Reiterpanel
 * rechts und der Krume „Arbeitsbereich" darüber. Redur wollte ihn „normal
 * wie eine App" — einen eigenen Ort, wie die Elektrotechnik, die auch nicht
 * im Workspace wohnt.
 * Gezeichnet wird er weiter von der Arbeitswelt (§8: ein Kalender, nicht
 * zwei), nur ohne ihre Schale.
 *
 *   §1 Der Eintrag öffnet keine Überlagerung.
 *   §2 Er öffnet die Kalenderansicht — und NICHT den Arbeitsbereich darum.
 *   §3 Und schreibt eine Adresse, über die man zurückfindet.
 *   §4 „Kalender verbinden" bleibt erreichbar — als das, was es ist.
 *   §5 Vom Termine-Bildschirm führt ein Weg dorthin.
 *   §6 Und man kommt dorthin zurück — über die Adresse und über „Weiter
 *      wo du warst".
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 *   §1/§2/§3 → `tun` zurück auf `Kalender.dialog()`.
 *   §2 nackt → `kalenderOeffnen` das `true` wegnehmen, also die volle
 *              Workspace-Schale zeichnen lassen.
 *   §3 Ort   → `zeigeSonder` durch `workspace('kalender')` ersetzen.
 *   §4       → den Befehl „Kalender verbinden" abmelden.
 *   §6       → die Zeile `kalender` aus `SONDER_START` nehmen.
 * Alle gelaufen, Ergebnisse im Bericht zu E430 und E431.
 *
 *   node pruefungen/lauf/test423.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9545;

const TYP: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon', '.svg': 'image/svg+xml'
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
const fehler: string[] = [];
const s = await browser.newPage({ viewport: { width: 1280, height: 900 } });
s.on('pageerror', e => fehler.push(e.message.slice(0, 140)));
await s.goto(`http://localhost:${PORT}/index.html`);
await s.waitForFunction("typeof App !== 'undefined' && typeof Register !== 'undefined'",
                        null, { timeout: 30000 });
await s.waitForTimeout(700);
await s.evaluate(`(() => {
  Store.setMeta('rundgangGesehen', true);
  document.querySelector('.produkt-onboarding-lage')?.remove();
  document.querySelectorAll('.overlay').forEach(o => o.remove());
})()`);

/* Eine Datenbank mit einem Datumsfeld, damit die Chronologie etwas zu
   zeigen hat — sonst prüfte §2 eine leere Seite. */
await s.evaluate(`(async () => {
  const seite = Store.addPage(null, { text: 'Terminprobe' });
  const { collectionId } = Store.addDatabase(seite.id, 'Termine', {
    titel: { name: 'Sache', type: 'title' },
    wann:  { name: 'Wann',  type: 'date' }
  }, 'table');
  for (const [t, d] of [['Zahnarzt', '2026-09-20'], ['Abgabe', '2026-09-24']]) {
    const z = Store.addBlock(collectionId, 'page', { text: t, parentTable: 'collection' });
    Store.updateBlock(z.id, { props: { wann: d } });
  }
  await Store.flush();
})()`);

/* Den Eintrag aus dem Register nehmen und tun, was er tut — nicht klicken.
   Geprüft wird, was der Eintrag VERSPRICHT und was er LIEFERT. */
const eintrag = JSON.parse(await s.evaluate(`JSON.stringify((() => {
  const e = Register.navigation.alle().find(x => x.id === 'app-kalender');
  return e ? { name: e.name, hinweis: e.hinweis, adresse: e.adresse || '' } : null;
})())`) as string);

console.log('\n§1 Der Eintrag öffnet keine Überlagerung');
p('Den Eintrag „Kalender" gibt es', !!eintrag, JSON.stringify(eintrag));
p('Er verspricht Termine aus allen Quellen',
  /Termine/.test(String(eintrag?.hinweis)), JSON.stringify(eintrag?.hinweis));

const nachher = JSON.parse(await s.evaluate(`(async () => {
  const e = Register.navigation.alle().find(x => x.id === 'app-kalender');
  e.tun();
  await new Promise(f => setTimeout(f, 1100));
  const ueber = [...document.querySelectorAll('.overlay')]
    .filter(o => o.getBoundingClientRect().width > 50);
  const krume = document.getElementById('crumb');
  return JSON.stringify({
    overlays: ueber.length,
    overlayText: ueber.map(o => o.textContent.replace(/\\s+/g, ' ').trim().slice(0, 60)),
    hash: location.hash,
    ort: Store.getMeta('zuletztOrt'),
    schauplatz: App.schauplatz(),
    krume: (krume ? krume.textContent : '').replace(/\\s+/g, ' ').trim(),
    /* NICHT DEN ANFANG DER SEITE ABSCHNEIDEN. Der erste Wurf las die ersten
       400 Zeichen des Hauptbereichs — und das ist immer der Kopf der
       Arbeitswelt, den sie in JEDER Ansicht zeichnet. Die Kalenderzeilen
       stehen darunter. Eine Pruefung, die nur den Kopf liest, prueft, ob
       die Arbeitswelt aufgeht — nicht, welche Ansicht.
       (Keine Backticks in einem Kommentar innerhalb einer Vorlage.) */
    /* Die Abschnittsfunktion setzt die Kennung als ID, nicht als Klasse —
       deshalb die Raute. Der erste Wurf suchte eine Klasse und fand nichts,
       obwohl der Abschnitt dastand. */
    kopfDaTitel: !!document.querySelector('#aw-kalender-kopf'),
    /* DIE DREI TEILE DER WORKSPACE-SCHALE, die E431 weggenommen hat. Sie
       werden GEMESSEN und nicht nur gesucht: eine Spalte, die es gibt und
       die 0 px breit ist, waere derselbe Fund. */
    navBreite: (() => { const n = document.querySelector('.arbeitswelt .aw-navigation');
                        return n ? Math.round(n.getBoundingClientRect().width) : -1; })(),
    reiterBreite: (() => { const n = document.querySelector('.arbeitswelt .aw-reiter-panel');
                           return n ? Math.round(n.getBoundingClientRect().width) : -1; })(),
    weltTitel: (() => { const n = document.querySelector('.arbeitswelt .aw-titel');
                        return n ? n.textContent.trim() : ''; })(),
    /* Und der Kopf, der bleibt, muss klein sein — sonst faengt der Kalender
       erst unter einer leeren Buehne an. */
    kopfHoehe: (() => { const n = document.querySelector('.arbeitswelt .aw-kopf');
                        return n ? Math.round(n.getBoundingClientRect().height) : -1; })(),
    bereichWahl: !!document.querySelector('.arbeitswelt [data-aw-bereich]'),
    text: (document.querySelector('main') || document.body)
            .textContent.replace(/\\s+/g, ' ')
  });
})()`) as string);
p('Es geht keine Überlagerung auf', nachher.overlays === 0,
  JSON.stringify(nachher.overlayText));
/* Der konkrete Fall: der Verbindungsdialog trägt „Kalender verbinden". */
p('… und schon gar nicht „Kalender verbinden"',
  !/Kalender verbinden/.test(nachher.overlayText.join(' ')),
  JSON.stringify(nachher.overlayText));

console.log('\n§2 Er öffnet die Kalenderansicht — ohne den Arbeitsbereich darum');
p('Die Kalenderansicht steht da — an ihrem eigenen Kopf erkannt',
  nachher.kopfDaTitel === true, nachher.text.slice(0, 160));
/* Und sie zeigt wirklich Termine, nicht nur eine Überschrift. */
p('Und sie zeigt die Termine der Datenbank',
  /Zahnarzt/.test(nachher.text) && /Abgabe/.test(nachher.text),
  nachher.text.slice(0, 260));
/* E431 — die drei Teile der Workspace-Schale sind weg. `-1` heisst „gibt es
   nicht", und genau das ist hier das Ziel; jede Breite darüber wäre der
   alte Zustand. */
p('Keine Workspace-Spalte daneben', nachher.navBreite === -1,
  'Breite ' + nachher.navBreite + ' px');
p('Kein Reiterpanel rechts', nachher.reiterBreite === -1,
  'Breite ' + nachher.reiterBreite + ' px');
p('Keine Krume „Arbeitsbereich" über dem Kalender',
  nachher.weltTitel === '', JSON.stringify(nachher.weltTitel));
/* WAS BLEIBEN MUSS. Ohne diesen Punkt wäre „nackt" auch dann grün, wenn
   die Lebensbereich-Auswahl mit weggefallen wäre — und dann liesse sich
   nicht mehr wählen, welche Bereiche der Kalender zeigt. */
p('Die Lebensbereich-Auswahl bleibt', nachher.bereichWahl === true,
  String(nachher.bereichWahl));
/* Und der Kopf darum ist eine Zeile, keine Bühne. Gemessen: die volle
   Fassung ist 154 px hoch (min-height in arbeitswelt.css).
   OHNE DIE RUHIGE FASSUNG GEMESSEN, und das ist der Punkt. Von Haus aus
   steht `ruhig` auf `an`, und dann flacht schon `body[data-ruhig="an"]
   .aw-kopf` die Bühne ab — diese Prüfung wäre grün, auch wenn es die
   nackte Regel gar nicht gäbe. Sie wäre eine Behauptung (§55.2).
   Wer die ruhige Fassung abschaltet oder „Mehr" aufklappt, bekommt die
   volle Bühne zurück, und DORT trägt `.aw-nackt .aw-kopf-schmal` allein. */
const kopfOhneRuhig = JSON.parse(await s.evaluate(`(async () => {
  const vorher = Store.getMeta('ruhig', true);
  Store.setMeta('ruhig', false); Ruhig.anwenden();
  await new Promise(f => setTimeout(f, 300));
  const n = document.querySelector('.arbeitswelt .aw-kopf');
  const h = n ? Math.round(n.getBoundingClientRect().height) : -1;
  /* Den Modus ABLESEN, solange er noch gilt — nach dem Zurückstellen
     stünde im Bericht wieder "an", und die Zahl käme aus einem anderen
     Zustand als das Wort daneben. */
  const modus = document.body.dataset.ruhig;
  Store.setMeta('ruhig', vorher); Ruhig.anwenden();
  return JSON.stringify({ hoehe: h, modus });
})()`) as string);
p('Der Kopf ist schmal, keine 154-px-Bühne — auch ohne die ruhige Fassung',
  kopfOhneRuhig.hoehe > 0 && kopfOhneRuhig.hoehe < 80,
  kopfOhneRuhig.hoehe + ' px, ruhig=' + kopfOhneRuhig.modus);
/* Der Vollständigkeit halber die Vorgabefassung dazu — sie soll nicht
   plötzlich grösser sein als die ohne. */
p('… und in der ruhigen Fassung erst recht',
  nachher.kopfHoehe > 0 && nachher.kopfHoehe < 80,
  nachher.kopfHoehe + ' px');

console.log('\n§3 Und schreibt eine Adresse');
/* E431: `zeigeSonder` bildet die Adresse aus dem Titel — „Kalender" wird
   `#kalender`. Vorher war es `#welt-workspace-kalender`, die Adresse des
   Arbeitsbereichs mit einer Ansicht daran. */
p('Die Adresse steht in der Zeile', nachher.hash === '#kalender',
  JSON.stringify(nachher.hash));
/* Eine Adresse allein ist noch kein Ort. Ein Ort wird gemerkt („Weiter wo
   du warst"), meldet seinen Schauplatz an die Kontextkante und trägt seinen
   Namen in der Krume. Alle drei setzt `zeigeSonder`; eine Überlagerung
   setzt keinen davon. */
p('Der Ort wird gemerkt', nachher.ort === 'kalender', JSON.stringify(nachher.ort));
p('Der Schauplatz heisst „kalender"', nachher.schauplatz === 'kalender',
  JSON.stringify(nachher.schauplatz));
p('Und die Krume sagt „Kalender"', nachher.krume === 'Kalender',
  JSON.stringify(nachher.krume));
p('Der Eintrag nennt seine Adresse auch im Register',
  eintrag?.adresse === '#kalender', JSON.stringify(eintrag?.adresse));

console.log('\n§4 „Kalender verbinden" bleibt erreichbar');
/* „Kalender verbinden" steht im KONTEXT-Register, nicht in der
   Befehlspalette — dort meldet es `datenbanken/ansichten/dienst.ts` als
   Zeile des Bereichs „kalender". Der erste Wurf dieser Prüfung suchte in
   `Register.befehle` und bekam eine leere Liste zurück: eine Prüfung, die
   am falschen Ort nachsieht, meldet „weg", wo nichts weg ist. */
const verbinden = JSON.parse(await s.evaluate(`JSON.stringify((() => {
  const K = Register.kontext;
  const b = (K && K.alle ? K.alle() : [])
    .filter(x => /verbinden/i.test(String(x.name || x.titel || '')));
  return b.map(x => String(x.name || x.titel));
})())`) as string);
p('Der Befehl „Kalender verbinden" steht weiter da',
  verbinden.some((n: string) => /Kalender verbinden/.test(n)),
  JSON.stringify(verbinden));
/* Und der Dialog selbst geht noch auf — sonst hätte ich eine Tür zugemacht
   statt eine falsche zu berichtigen. */
const dialogGeht = await s.evaluate(`(async () => {
  Kalender.dialog();
  await new Promise(f => setTimeout(f, 500));
  const auf = [...document.querySelectorAll('.overlay')]
    .some(o => /Kalender verbinden/.test(o.textContent || ''));
  document.querySelectorAll('.overlay').forEach(o => o.remove());
  return auf;
})()`) as boolean;
p('Und der Dialog geht weiter auf', dialogGeht === true, String(dialogGeht));

/* ==========================================================================
 * §5 · VOM TERMINE-BILDSCHIRM FÜHRT EIN WEG ZUM KALENDER
 * --------------------------------------------------------------------------
 * `Ansichten.termine()` ist der Bildschirm, den die untere Leiste am Telefon
 * unter „Termine" öffnet. Er trug zwei Karten, und die mit dem Kalendersymbol
 * führte zum VERBINDUNGSDIALOG. Wer dort einen Kalender suchte, landete bei
 * Google-Client-IDs — und einen anderen Weg zum Kalender gab es von diesem
 * Bildschirm gar nicht.
 * ========================================================================*/
console.log('\n§5 Vom Termine-Bildschirm führt ein Weg zum Kalender');
const karten = JSON.parse(await s.evaluate(`(async () => {
  document.querySelectorAll('.overlay').forEach(o => o.remove());
  Ansichten.termine();
  await new Promise(f => setTimeout(f, 800));
  const k = [...document.querySelectorAll('.home-karten .hk')].map(b => ({
    a: b.dataset.a, text: b.textContent.replace(/\\s+/g, ' ').trim().slice(0, 60) }));
  return JSON.stringify(k);
})()`) as string);
p('Der Bildschirm zeigt seine Karten', karten.length >= 3, JSON.stringify(karten));
p('Eine davon führt zum Kalender',
  karten.some((k: any) => k.a === 'kal-auf'), JSON.stringify(karten.map((k: any) => k.a)));
/* Und sie heisst nicht mehr wie die andere: „Kalender" ist der Ort,
   „Kalender verbinden" die Einrichtung. */
p('… und sie heisst „Kalender", nicht „verbinden"',
  karten.some((k: any) => k.a === 'kal-auf' && /Kalender/.test(k.text) &&
                          !/verbinden/i.test(k.text)),
  JSON.stringify(karten.map((k: any) => k.text)));
p('Und das Verbinden steht als eigene Karte daneben',
  karten.some((k: any) => k.a === 'kal' && /verbinden/i.test(k.text)),
  JSON.stringify(karten.map((k: any) => k.text)));
/* Und der Weg führt wirklich hin, nicht nur dem Namen nach. */
const gefolgt = JSON.parse(await s.evaluate(`(async () => {
  const b = [...document.querySelectorAll('.home-karten .hk')]
    .find(x => x.dataset.a === 'kal-auf');
  if (!b) return JSON.stringify({ fehlt: true });
  b.click();
  await new Promise(f => setTimeout(f, 1000));
  return JSON.stringify({ hash: location.hash,
    kopf: !!document.querySelector('#aw-kalender-kopf'),
    overlays: [...document.querySelectorAll('.overlay')]
      .filter(o => o.getBoundingClientRect().width > 50).length });
})()`) as string);
p('Ein Tipp darauf öffnet den Kalender', gefolgt.kopf === true, JSON.stringify(gefolgt));
p('… mit seiner Adresse', gefolgt.hash === '#kalender',
  JSON.stringify(gefolgt.hash));
p('… und ohne Überlagerung', gefolgt.overlays === 0, JSON.stringify(gefolgt.overlays));

/* ==========================================================================
 * §6 · UND MAN KOMMT DORTHIN ZURÜCK (E431)
 * --------------------------------------------------------------------------
 * Eine Adresse, die beim Neuladen ins Regal führt, ist ein Anker und kein
 * Ort. Zwei Wege müssen zurückführen, und beide hängen an derselben
 * Tabelle `SONDER_START`:
 *
 *   · `#kalender` als Lesezeichen aufrufen
 *   · die App im Kalender verlassen und neu öffnen („Weiter wo du warst")
 *
 * MIT `reload()`, NICHT MIT `goto()`. Der erste Wurf schrieb
 * `goto(index.html#kalender)`, und die Prüfung war grün, ohne etwas zu
 * prüfen: von `index.html` auf `index.html#kalender` ist eine
 * Sprungmarken-Navigation im SELBEN Dokument — die Seite lädt gar nicht neu,
 * `start()` läuft kein zweites Mal, und der Kalender stand einfach noch da.
 * Aufgefallen ist es an der Gegenprobe: die Zeile aus `SONDER_START`
 * herausgenommen, und die Prüfung blieb grün (§55.2).
 *
 * UND DIE BEIDEN WEGE WERDEN GETRENNT. Beim Lesezeichen steht `zuletztOrt`
 * ausdrücklich auf `seite`, sonst könnte der zweite Weg den ersten grün
 * machen; beim gemerkten Ort ist die Sprungmarke leer.
 * ========================================================================*/
console.log('\n§6 Und man kommt dorthin zurück');
const ueberHash = JSON.parse(await s.evaluate(`(async () => {
  Store.setMeta('zuletztOrt', 'seite');
  Store.setMeta('startAnsicht', 'dokument');
  await Store.flush();
  location.hash = '#kalender';
  return JSON.stringify({ vorher: location.hash });
})()`) as string);
await s.reload();
await s.waitForFunction("typeof App !== 'undefined' && typeof Store !== 'undefined'",
                        null, { timeout: 30000 });
await s.waitForTimeout(1800);
const nachHash = JSON.parse(await s.evaluate(`JSON.stringify({
  kopf: !!document.querySelector('#aw-kalender-kopf'),
  schauplatz: App.schauplatz(),
  ortVorher: 'seite',
  hash: location.hash
})`) as string);
p('Das Lesezeichen „#kalender" öffnet den Kalender', nachHash.kopf === true,
  JSON.stringify(nachHash) + ' / ' + JSON.stringify(ueberHash));
p('… und meldet ihn als Schauplatz', nachHash.schauplatz === 'kalender',
  JSON.stringify(nachHash.schauplatz));

/* „Weiter wo du warst": ohne Sprungmarke, aber mit gemerktem Ort. */
await s.evaluate(`(async () => {
  Store.setMeta('zuletztOrt', 'kalender');
  Store.setMeta('startAnsicht', 'dokument');
  await Store.flush();
  history.replaceState(null, '', location.pathname + location.search);
})()`);
await s.reload();
await s.waitForFunction("typeof App !== 'undefined' && typeof Store !== 'undefined'",
                        null, { timeout: 30000 });
await s.waitForTimeout(1800);
const ueberOrt = JSON.parse(await s.evaluate(`JSON.stringify({
  kopf: !!document.querySelector('#aw-kalender-kopf'),
  schauplatz: App.schauplatz()
})`) as string);
p('Wer die App im Kalender verlässt, kommt dort wieder an',
  ueberOrt.kopf === true, JSON.stringify(ueberOrt));

p('Keine Fehler auf der Seite', fehler.length === 0, fehler.join(' | '));

console.log(`\n${ok} von ${ok + weg} Prüfungen grün`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
