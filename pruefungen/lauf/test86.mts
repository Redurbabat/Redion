/* Suite 51 — Die elf Register */
import { fileURLToPath as _alsPfad } from 'node:url';
import { dirname as _ordner, resolve as _loese } from 'node:path';
import { createRequire as _brauche } from 'node:module';
const WURZEL = _loese(_ordner(_alsPfad(import.meta.url)), '../..');
const require = _brauche(import.meta.url);
const { chromium } = require('playwright');

let ok = 0, weg = 0;
const p = (n: any, b: any, extra = '') => { if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); } };

const browser = await chromium.launch();
const seite = await browser.newPage();
const fehler: any[] = [];
seite.on('pageerror', (e: any) => fehler.push(e.message));
await seite.goto('file://' + WURZEL + '/index.html');
await seite.waitForFunction(() => typeof App !== 'undefined' && typeof Register !== 'undefined',
  null, { timeout: 20000 });
await seite.waitForTimeout(1200);

/* Hier stand `r.length === 11`. Eine gepinnte Zahl misst nicht, WELCHE
   Register da sind, sondern nur, dass es zufällig elf sind — und sie wird
   rot, sobald ein Register dazukommt, obwohl genau das nach CLAUDE.md §8
   der vorgesehene Weg ist (mit `fachzeichen` und `elektroformeln` ist es
   dreizehn geworden).

   Geprüft wird jetzt eine INVENTUR: jedes genannte Register muss da sein.
   Verschwindet eines, wird es rot — und das ist der Fall, der wehtut. Ein
   neues fällt nicht mehr rot aus, muss aber unten eingetragen werden, und
   dabei sieht man, dass man eines angelegt hat. */
console.log('\n— Die Register sind vollzählig —');
const PFLICHT = ['ansichten', 'befehle', 'bloecke', 'eigenschaften', 'einstellungen',
                 'elektroformeln', 'fachzeichen', 'formeln', 'kontext', 'menueband',
                 'module', 'navigation', 'symbole', 'tasten', 'verbindungen', 'vorlagen'];
/* `menueband` kam mit E210 dazu — der Katalog der Reiter und Knöpfe oben.
   `symbole` ist älter und stand hier nie: der Punkt hat es seither
   gemeldet, und niemand hat es eingetragen. Genau dafür ist er da.
   `kontext` ist seit E272 Phase F das sechzehnte: was in der Kontextkante
   je Bereich steht, meldet der Bereich selbst an — `navigation` konnte das
   nicht übernehmen, weil test222 §5/§6 es vertraglich als „Seitenleiste"
   festhalten. */
let r = await seite.evaluate(() => Object.keys(Register).sort());
const fehlend = PFLICHT.filter(x => !(r ?? []).includes(x));
const zusaetzlich = (r ?? []).filter((x: string) => !PFLICHT.includes(x));
p('Kein Register fehlt', fehlend.length === 0, 'fehlt: ' + fehlend.join(', '));
p('Und keines ist unangekündigt dazugekommen', zusaetzlich.length === 0,
  'neu: ' + zusaetzlich.join(', ') + ' — bitte oben eintragen');

console.log('\n— Blöcke —');
r = await seite.evaluate(() => ({
  anzahl: Register.bloecke.anzahl(),
  gleichWieBlocks: Register.bloecke.alle() === Blocks.TYPEN,
  gruppen: Register.bloecke.gruppen().length,
  text: (Register.bloecke.eines('text') || {}).name,
  md: (Register.bloecke.zuMarkdown('#') || {}).id,
  mdListe: (Register.bloecke.zuMarkdown('-') || {}).id,
  suche: Register.bloecke.suche('aufgab').map((x: any) => x.id),
  unbekannt: Register.bloecke.eines('gibtsnicht')
}));
p('Die Liste ist gross genug',   Number(r.anzahl ?? -1) >= 40, String(r.anzahl));
p('Und es ist DIESELBE Liste wie im Editor', r.gleichWieBlocks === true,
  'sonst käme eine neue Blockart nirgends an');
p('Gruppen sind da',             r.gruppen >= 4, String(r.gruppen));
p('Nachschlagen geht',           r.text === 'Text' && r.unbekannt === null, JSON.stringify(r));
p('Markdown-Kürzel finden ihren Block', r.md === 'h1' && r.mdListe === 'bullet', JSON.stringify(r));
p('Suche über Name und Kurzwort', (r.suche ?? '').includes('todo'), JSON.stringify(r.suche));

/* ─────────────────────────────────────────────────────────────────────────
   DIE GEZEICHNETEN BLOCKZEICHEN (E273, L92)

   `icon` ist ein Schriftzeichen, `zeichen` der Name eines Strichzeichens
   aus `Register.symbole` — das Menüband liest `zeichen ?? icon`.

   Ein Tippfehler darin ist NICHT sichtbar wie ein Fehler: `zeichenIn`
   (schale/aufbau/menueband.ts:207) fragt `symbole.hat(name)`, und wenn es
   den Namen nicht gibt, setzt es ihn als TEXT. Im Band stünde dann das
   Wort „lightbolb" statt einer Glühbirne — klein, grau, und niemandem
   fällt es auf.

   Genau das prüft dieser Punkt. Die Gegenprobe darunter meldet einen
   Block mit einem erfundenen Namen an; sähe der Punkt ihn nicht, wäre er
   nutzlos (§55.2). */
console.log('\n— Blockzeichen zeigen auf echte Symbole —');
r = await seite.evaluate(() => {
  const mit = (Register.bloecke.benannt() as any[])
    .filter(b => b && b.zeichen)
    .map(b => ({ id: String(b.id), zeichen: String(b.zeichen) }));
  const kaputt = mit.filter(x => !Register.symbole.hat(x.zeichen));
  /* Gegenprobe: ein erfundener Name muss auffallen. */
  Register.bloecke.melde({ id: 'probe-zeichen', name: 'Probe',
    icon: '⚠', zeichen: 'gibtesnichtimregister', gruppe: 'Grundlegend' });
  const jetzt = (Register.bloecke.benannt() as any[])
    .filter(b => b && b.zeichen && !Register.symbole.hat(String(b.zeichen)))
    .map(b => String(b.id));
  Register.bloecke.nimmZurueck('probe-zeichen');
  return { wieviele: mit.length, kaputt: kaputt.map(x => x.id + '→' + x.zeichen),
           gegenprobe: jetzt };
});
p('Es gibt gezeichnete Blockzeichen', Number(r.wieviele ?? 0) >= 20,
  String(r.wieviele) + ' Blockarten mit `zeichen`');
p('Und jedes nennt ein Symbol, das es gibt', (r.kaputt ?? []).length === 0,
  'unbekannt: ' + (r.kaputt ?? []).join(', '));
p('Gegenprobe: ein erfundener Name fällt auf',
  (r.gegenprobe ?? []).length === 1 && r.gegenprobe[0] === 'probe-zeichen',
  JSON.stringify(r.gegenprobe));

console.log('\n— Eine neue Blockart anmelden —');
r = await seite.evaluate(() => {
  const vorher = Register.bloecke.anzahl();
  const gut = Register.bloecke.melde({ id: 'warnung', name: 'Warnung', icon: '⚠',
    gruppe: 'Grundlegend', cmd: ['warnung', 'achtung'] });
  const doppelt = Register.bloecke.melde({ id: 'warnung', name: 'Nochmal' });
  const imEditor = Blocks.TYPEN.some((x: any) => x.id === 'warnung');
  const imSlash = Register.bloecke.suche('achtung').map((x: any) => x.id);
  const mitNeuer = Register.bloecke.anzahl();
  const zurueck = Register.bloecke.nimmZurueck('warnung');
  return { vorher, nachher: mitNeuer, danach: Register.bloecke.anzahl(),
           gut, doppelt, imEditor, imSlash, zurueck };
});
p('Anmelden geht',                 r.gut === true && r.nachher === r.vorher + 1, JSON.stringify(r));
p('Zweimal derselbe Name wird abgelehnt', r.doppelt === false);
p('Der Editor sieht sie sofort',   r.imEditor === true, 'das ist der ganze Sinn des Registers');
p('Und die Suche findet sie',      (r.imSlash ?? '').includes('warnung'), JSON.stringify(r.imSlash));
p('Zurücknehmen geht auch',        r.zurueck === true && r.danach === r.vorher, JSON.stringify(r));

console.log('\n— Eigenschaften —');
r = await seite.evaluate(() => ({
  anzahl: Register.eigenschaften.anzahl(),
  dieselbe: Register.eigenschaften.alle() === Datenbank.TYPEN,
  name: Register.eigenschaften.name('formula'),
  icon: Register.eigenschaften.icon('number') !== '',
  gruppen: Object.keys(Register.eigenschaften.GRUPPEN),
  berechnet: Register.eigenschaften.inGruppe('Berechnet').map((x: any) => x.id),
  /* WIRKLICH nachzählen: die Summe über alle Gruppen muss die ganze Liste
     ergeben. Hier stand `weiteres >= 0` — eine Array-Länge ist IMMER >= 0,
     der Punkt konnte nicht rot werden (§55.2). Mit der Summe wird er es,
     sobald ein Typ aus allen Gruppen herausfällt oder doppelt zählt. */
  abgedeckt: Object.keys(Register.eigenschaften.GRUPPEN)
    .reduce((n: number, g: string) => n + Register.eigenschaften.inGruppe(g).length, 0)
}));
p('Alle Spaltentypen',        Number(r.anzahl ?? -1) >= 20, String(r.anzahl));
p('Dieselbe Liste wie in der Datenbank', r.dieselbe === true);
p('Namen und Zeichen',        r.name === 'Formel' && r.icon === true, JSON.stringify(r));
p('Gruppen decken alles ab',  (r.berechnet ?? '').includes('rollup') && r.abgedeckt === r.anzahl,
  `${r.abgedeckt} in Gruppen, ${r.anzahl} im Register`);

console.log('\n— Ansichten —');
r = await seite.evaluate(() => {
  const vorher = Register.ansichten.anzahl();
  Register.ansichten.melde('mindmap', '🧠', 'Mindmap');
  return { vorher, nachher: Register.ansichten.anzahl(),
    dieselbe: Register.ansichten.alle() === Datenbank.LAYOUTS,
    name: Register.ansichten.name('board'),
    kennt: Register.ansichten.kennt('pivot'),
    kenntNicht: Register.ansichten.kennt('gibtsnicht'),
    neuDrin: Datenbank.LAYOUTS.some((x: any) => x[0] === 'mindmap') };
});
p('Alle Ansichtsarten',       r.vorher >= 10, String(r.vorher));
p('Dieselbe Liste',           r.dieselbe === true);
p('Namen und Kennen',         r.name === 'Board' && r.kennt && !r.kenntNicht, JSON.stringify(r));
p('Eine neue kommt überall an', r.neuDrin === true && r.nachher === Number(r.vorher ?? 0) + 1);

console.log('\n— Tasten —');
r = await seite.evaluate(() => ({
  gruppen: Register.tasten.gruppen().length,
  anzahl: Register.tasten.anzahl(),
  suche: Register.tasten.suche('Papierkorb').length,
  doppelte: Register.tasten.doppelte(),
  mehrfach: Register.tasten.mehrfach().length,
  inGruppe: Register.tasten.inGruppe('Allgemein').length
}));
/* Dreizehn seit „Markdown einfügen" (L20). Diese Zeile hat den Zuwachs
   gemeldet, bevor jemand die Übersicht aufgeschlagen hat — genau dafür
   steht hier eine Zahl und kein `>= 1`. */
p('Dreizehn Gruppen',         r.gruppen === 13, String(r.gruppen));
p('Über hundert Kürzel',      Number(r.anzahl ?? -1) >= 120, String(r.anzahl));
p('Suche findet',             r.suche >= 1, String(r.suche));
p('Innerhalb einer Gruppe keine Taste doppelt', r.doppelte.length === 0,
  JSON.stringify(r.doppelte.slice(0, 3)));
p('Über Gruppen hinweg gibt es gewollte Doppelbelegungen',
  r.mehrfach >= 1, String(r.mehrfach));

console.log('\n— Befehle —');
r = await seite.evaluate(() => {
  let gerufen = 0;
  Register.befehle.melde({ gruppe: 'Probe', titel: 'Ein Probebefehl',
    tun: () => gerufen++ });
  Register.befehle.melde({ gruppe: 'Probe', titel: 'Versteckt',
    tun: () => {}, zeigen: () => false });
  Register.befehle.meldeLieferant(() => [{ gruppe: 'Probe', titel: 'Vom Lieferanten', tun: () => {} }]);
  Register.befehle.meldeLieferant(() => { throw new Error('absicht'); });
  const alle = Register.befehle.alle().map((x: any) => x.titel);
  const gefunden = Register.befehle.suche('Probebefehl').map((x: any) => x.titel);
  Register.befehle.alle().find((x: any) => x.titel === 'Ein Probebefehl')?.tun();
  return { hat: (alle ?? '').includes('Ein Probebefehl'),
           lieferant: (alle ?? '').includes('Vom Lieferanten'),
           versteckt: (alle ?? '').includes('Versteckt'),
           gefunden, gerufen };
});
p('Ein Befehl lässt sich anmelden',  r.hat === true);
p('Ein Lieferant liefert',           r.lieferant === true);
p('zeigen() false hält ihn heraus',  r.versteckt === false);
p('Ein kaputter Lieferant reisst nichts mit', r.gefunden.length === 1, JSON.stringify(r.gefunden));
p('Und der Befehl tut etwas',        r.gerufen === 1);

r = await seite.evaluate(async () => {
  Werkzeuge.palette();
  await new Promise(x => setTimeout(x, 300));
  /* Ohne Suchfeld gibt es nichts zu tippen — dann wäre `hatProbe` falsch, ohne
     dass jemand sähe warum. Deshalb Abbruch mit Text. */
  const feld = document.querySelector<HTMLInputElement>('.overlay #cq');
  if (!feld) throw new Error('Die Befehlspalette hat kein Suchfeld (.overlay #cq)');
  feld.value = 'Probebefehl';
  feld.dispatchEvent(new Event('input', { bubbles: true }));
  await new Promise(x => setTimeout(x, 200));
  const zeilen = document.querySelectorAll('.overlay .res [data-i]').length;
  const text = document.querySelector('.overlay')?.textContent ?? '';
  document.querySelectorAll('.overlay').forEach(o => o.remove());
  return { zeilen, hatProbe: /Probebefehl/.test(text) };
});
p('Die Palette zeigt angemeldete Befehle', r.hatProbe === true, JSON.stringify(r));

console.log('\n— Einstellungen —');
r = await seite.evaluate(() => {
  const vor = Register.einstellungen.lies('wochenstart');
  const gut = Register.einstellungen.setze('wochenstart', '0');
  const schlecht = Register.einstellungen.setze('wochenstart', 'Dienstag');
  const zahlZuGross = Register.einstellungen.setze('schriftgroesse', 99);
  const zahlOk = Register.einstellungen.setze('schriftgroesse', 18);
  const nachher = Register.einstellungen.lies('wochenstart');
  Register.einstellungen.setze('wochenstart', vor);
  return { anzahl: Register.einstellungen.anzahl(),
    gruppen: Register.einstellungen.gruppen(),
    gut, schlecht, zahlZuGross, zahlOk, nachher,
    unbekannt: Register.einstellungen.lies('gibtsnicht'),
    vorgabe: Register.einstellungen.eines('thema').vorgabe };
});
p('Alle Einstellungen beschrieben', Number(r.anzahl ?? -1) >= 10, String(r.anzahl));
p('In Gruppen',                     r.gruppen.length >= 4, JSON.stringify(r.gruppen));
p('Gültige Werte gehen durch',      r.gut === true && r.nachher === '0');
p('Ungültige werden abgelehnt',     r.schlecht === false && r.zahlZuGross === false && r.zahlOk === true,
  JSON.stringify(r));
p('Unbekannte Einstellung: undefined', r.unbekannt === undefined);
p('Vorgaben stehen da',             r.vorgabe === 'auto');

console.log('\n— Formeln —');
r = await seite.evaluate(() => {
  const a = Register.formeln.abgleich();
  return { anzahl: Register.formeln.anzahl(),
    ueberNotion: Register.formeln.ueberNotionHinaus().length,
    einzelne: Register.formeln.eines('runningSum'),
    suche: Register.formeln.suche('random').map((x: any) => x.name),
    ohneFunktion: a.ohneFunktion,
    ohneBeschreibungAnzahl: a.ohneBeschreibung.length };
});
p('Viele Funktionen',            Number(r.anzahl ?? -1) >= 100, String(r.anzahl));
p('Was über Notion hinausgeht',  r.ueberNotion >= 20, String(r.ueberNotion));
p('Mit Beispiel und Bedeutung',  /Kontostand/.test(r.einzelne.was), JSON.stringify(r.einzelne));
p('Suche findet',                (r.suche ?? '').includes('random'), JSON.stringify(r.suche));
p('Keine Beschreibung ohne Funktion', r.ohneFunktion.length === 0, JSON.stringify(r.ohneFunktion));

console.log('\n— Vorlagen, Module, Navigation, Verbindungen —');
r = await seite.evaluate(() => ({
  vorlagen: Register.vorlagen.anzahl(),
  vorlageName: (Register.vorlagen.eines('habit') || {}).name,
  fassung: Register.vorlagen.fassung('habit'),
  module: Register.module.anzahl(),
  modulListe: Register.module.alle().length,
  modulUnbekannt: Register.module.oeffne('gibtsnicht'),
  navOben: Register.navigation.anPlatz('oben').map((x: any) => x.id),
  navUnten: Register.navigation.anPlatz('unten').length,
  navGeteiltVersteckt: !Register.navigation.anPlatz('baum').some((x: any) => x.id === 'geteilt'),
  verbindungen: Register.verbindungen.anzahl(),
  arten: Register.verbindungen.arten(),
  eingerichtet: Register.verbindungen.eingerichtet().length,
  hinaus: (Register.verbindungen.eines('ki-anbieter') || {}).hinaus
}));
p('Vorlagen sind da',           r.vorlagen >= 10 && r.vorlageName === 'Habit-Tracker', JSON.stringify(r));
p('Mit Fassungsnummer',         r.fassung === 2, String(r.fassung));
/* Hier stand `r.module === 8` — eine festgeschriebene Zahl. Sie ging rot,
   als L51 sechs vorhandene Module endlich eintrug: eine RICHTIGE Änderung
   liess die Prüfung scheitern, und das ist der falsche Alarm, den niemand
   zweimal ernst nimmt. Geprüft wird jetzt der Vertrag statt der Zahl —
   `anzahl()` muss zur Liste passen, und die acht Ursprünglichen müssen
   drin sein. Welche sechs dazugekommen sind, prüft test222 namentlich. */
p('Der Bereichskatalog zählt sich richtig',
  r.module === r.modulListe && r.module >= 8, `${r.module} gezählt, ${r.modulListe} in der Liste`);
p('Ein unbekannter Bereich tut nichts', r.modulUnbekannt === false);
p('Die Seitenleiste hat eine Ordnung',
  r.navOben[0] === 'suche' && r.navUnten >= 5, JSON.stringify(r.navOben));
p('„Geteilt" bleibt ohne Konto weg', r.navGeteiltVersteckt === true);
p('Verbindungen sind aufgezählt', r.verbindungen >= 8, String(r.verbindungen));
p('Nach Art gegliedert',         (r.arten ?? '').includes('kalender') && (r.arten ?? '').includes('ki'),
  JSON.stringify(r.arten));
p('Ohne Schlüssel ist nichts eingerichtet', r.eingerichtet === 0, String(r.eingerichtet));
p('Und es steht da, was hinausgeht', /markierst/.test(r.hinaus || ''), r.hinaus);

/* ─────────────────────────────────────────────────────────────────────────
   EIN LIEFERANT WIRD GENAUSO GEPRUEFT WIE EINE ANMELDUNG (E277, L87)

   `melde()` hat seit jeher gesiebt: ohne Kennung, ohne Reiter, ohne
   lebendes `tun` kommt nichts ins Band. `meldeLieferant()` hat es NICHT
   getan — was ein Lieferant zurueckgab, ging ungesehen durch.

   Das ist die gefaehrlichere Haelfte: `melde` bekommt sein Objekt einmal
   und behaelt es, ein Lieferant baut bei JEDEM Zeichnen ein neues. Er ist
   der Weg, auf dem ein kaputter Eintrag wirklich hereinkommt.

   Sichtbar wurde so ein Eintrag erst als Knopf, der beim Klick wirft, oder
   als Zeichen ohne Namen — und dann sucht man an der falschen Stelle. */
console.log('\n— Ein Lieferant wird geprüft wie eine Anmeldung —');
r = await seite.evaluate(() => {
  const M = Register.menueband;
  const vorher = M.anzahl();

  /* Ein Lieferant mit vier kaputten und EINEM guten Eintrag. */
  const kaputt = () => ([
    { reiter: 'ansicht', gruppe: 'Probe', name: 'Ohne Kennung',
      zeichen: 'star', tun: () => {} },                       /* keine id */
    { id: 'p-ohne-reiter', gruppe: 'Probe', name: 'Ohne Reiter',
      zeichen: 'star', tun: () => {} },                       /* kein reiter */
    { id: 'p-ohne-namen', reiter: 'ansicht', gruppe: 'Probe',
      zeichen: 'star', tun: () => {} },                       /* kein name */
    { id: 'p-ohne-tun', reiter: 'ansicht', gruppe: 'Probe',
      name: 'Ohne tun', zeichen: 'star' },                    /* kein tun */
    { id: 'p-heil', reiter: 'ansicht', gruppe: 'Probe', name: 'Heiler Eintrag',
      zeichen: 'star', tun: () => {} }
  ] as any);
  M.meldeLieferant(kaputt);
  const mit = M.alle().map((x: any) => String(x.id || '(ohne)'));

  /* Und abmelden muss gehen — sonst steht der Probeeintrag bis zum Ende
     des Laufs im Band und faellt einem anderen Punkt zur Last (E273). */
  const zurueck = M.nimmZurueckLieferant(kaputt);
  const nochmal = M.nimmZurueckLieferant(kaputt);   /* zweimal geht nicht */
  const nachher = M.anzahl();

  return {
    heilDa:    mit.includes('p-heil'),
    ohneReiter: mit.includes('p-ohne-reiter'),
    ohneNamen:  mit.includes('p-ohne-namen'),
    ohneTun:    mit.includes('p-ohne-tun'),
    ohneId:     mit.filter((x: string) => x === '(ohne)').length,
    zurueck, nochmal, vorher, nachher
  };
});
p('Der heile Eintrag des Lieferanten kommt an', r.heilDa === true);
p('Einer ohne Kennung kommt nicht durch', r.ohneId === 0, String(r.ohneId));
p('Einer ohne Reiter kommt nicht durch',  r.ohneReiter === false);
p('Einer ohne Namen kommt nicht durch',   r.ohneNamen === false);
p('Einer ohne `tun` kommt nicht durch',   r.ohneTun === false);
p('Ein Lieferant lässt sich zurücknehmen', r.zurueck === true);
p('Zweimal zurücknehmen geht nicht',       r.nochmal === false);
p('Und danach ist der Bestand wieder der alte',
  r.nachher === r.vorher, r.vorher + ' → ' + r.nachher);

console.log('\n— Die Seitenleiste liest aus dem Register —');
r = await seite.evaluate(async () => {
  let gerufen = 0;
  Register.navigation.melde({ id: 'probe-eintrag', name: 'Probe-Eintrag', icon: '🧪',
    platz: 'unten', rang: 99, tun: () => gerufen++ });
  App.zeichneBaum();
  await new Promise(x => setTimeout(x, 200));
  const knopf = [...document.querySelectorAll<HTMLElement>('#tree .side-item')]
    .find(b => /Probe-Eintrag/.test(b.textContent ?? ''));
  if (knopf) knopf.click();
  const nurEinmal = [...document.querySelectorAll<HTMLElement>('#tree .side-item')]
    .filter(b => /Probe-Eintrag/.test(b.textContent ?? '')).length;
  Register.navigation.nimmZurueck('probe-eintrag');
  App.zeichneBaum();
  await new Promise(x => setTimeout(x, 200));
  const danach = [...document.querySelectorAll<HTMLElement>('#tree .side-item')]
    .filter(b => /Probe-Eintrag/.test(b.textContent ?? '')).length;
  return { steht: !!knopf, gerufen, nurEinmal, danach };
});
p('Ein angemeldeter Eintrag steht in der Seitenleiste', r.steht === true, JSON.stringify(r));
p('Genau einmal, nicht doppelt',   r.nurEinmal === 1, String(r.nurEinmal));
p('Und er tut etwas',              r.gerufen === 1, String(r.gerufen));
p('Zurückgenommen ist er weg',     r.danach === 0, String(r.danach));

console.log('\n— Die Tastenübersicht liest aus dem Register —');
r = await seite.evaluate(async () => {
  Register.tasten.melde('Allgemein', 'Strg Alt Q', 'Ein Probekürzel');
  Werkzeuge.tastenkuerzel();
  await new Promise(x => setTimeout(x, 300));
  const text = document.querySelector('.overlay')?.textContent ?? '';
  document.querySelectorAll('.overlay').forEach(o => o.remove());
  return /Probekürzel/.test(text);
});
p('Ein neues Kürzel steht sofort in der Übersicht', r === true);

await browser.close();
if (fehler.length) { console.log('\nJS-Fehler:'); fehler.forEach(f => console.log('  ' + f)); }
console.log(`\n  Suite 51 — Register: ${ok} ok, ${weg + fehler.length} offen`);
process.exit(weg || fehler.length ? 1 : 0);
