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

console.log('\n— Alle elf sind da —');
let r = await seite.evaluate(() => Object.keys(Register).sort());
p('Elf Register',
  r.length === 11 && (r ?? '').includes('bloecke') && (r ?? '').includes('tasten') && (r ?? '').includes('verbindungen'),
  JSON.stringify(r));

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
  weiteres: Register.eigenschaften.inGruppe('Weiteres').length
}));
p('Alle Spaltentypen',        Number(r.anzahl ?? -1) >= 20, String(r.anzahl));
p('Dieselbe Liste wie in der Datenbank', r.dieselbe === true);
p('Namen und Zeichen',        r.name === 'Formel' && r.icon === true, JSON.stringify(r));
p('Gruppen decken alles ab',  (r.berechnet ?? '').includes('rollup') && r.weiteres >= 0, JSON.stringify(r));

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
p('Zwölf Gruppen',            r.gruppen === 12, String(r.gruppen));
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
p('Acht Bereiche',              r.module === 8, String(r.module));
p('Ein unbekannter Bereich tut nichts', r.modulUnbekannt === false);
p('Die Seitenleiste hat eine Ordnung',
  r.navOben[0] === 'suche' && r.navUnten >= 5, JSON.stringify(r.navOben));
p('„Geteilt" bleibt ohne Konto weg', r.navGeteiltVersteckt === true);
p('Verbindungen sind aufgezählt', r.verbindungen >= 8, String(r.verbindungen));
p('Nach Art gegliedert',         (r.arten ?? '').includes('kalender') && (r.arten ?? '').includes('ki'),
  JSON.stringify(r.arten));
p('Ohne Schlüssel ist nichts eingerichtet', r.eingerichtet === 0, String(r.eingerichtet));
p('Und es steht da, was hinausgeht', /markierst/.test(r.hinaus || ''), r.hinaus);

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
