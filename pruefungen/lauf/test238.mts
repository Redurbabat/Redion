/* Suite 204 — Fachzeichen und Schaltplan (Elektro, Punkte 1–40)
 * ============================================================================
 * Redion bekommt einen Elektro-Modus: Fachzeichen lernen, Schaltpläne
 * zeichnen, rechnen, Aufgaben lösen. Diese Suite hält die beiden Fundamente
 * fest — die Symbolbibliothek und den Planeditor.
 *
 * WARUM DAS RASTER DER WICHTIGSTE PUNKT IST. Ein Schaltplan lebt davon, dass
 * eine Leitung einen Anschluss WIRKLICH trifft. Liegt ein Anschluss auf
 * 25 statt 30, rastet nichts ein, und der Plan sieht verbunden aus, wo er es
 * nicht ist. Beim ersten Bau lagen 27 von 72 Zeichen neben dem Raster; §1
 * misst das, und es kann jederzeit wieder rot werden.
 *
 * UND WARUM VERBINDUNGSPUNKTE. Der Unterschied zwischen „hier verbunden" und
 * „hier gekreuzt" ist der wichtigste im ganzen Plan. Wer ihn nicht sieht,
 * liest die Schaltung falsch — und lernt sie falsch.
 *
 *   node pruefungen/lauf/test238.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

declare const Store: any; declare const App: any;
declare const Register: any; declare const Schaltplan: any; declare const Planflaeche: any;

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8997;

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
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll),
    `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

const browser = await chromium.launch();
const seite = await browser.newPage({ viewport: { width: 1320, height: 1000 } });
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
 * §1 · Die Bibliothek — vollständig, gruppiert, im Raster
 * ========================================================================*/
console.log('\n1 · Die Fachzeichen-Bibliothek');

const bib = await seite.evaluate(() => {
  const alle = Register.fachzeichen.alle();
  const gruppen = Register.fachzeichen.gruppen();
  return {
    anzahl: alle.length,
    gruppen: gruppen.map((g: any) => g[0]),
    ohneGruppe: alle.filter((z: any) => !gruppen.some((g: any) => g[0] === z.gruppe)).map((z: any) => z.id),
    ohneAnschluss: alle.filter((z: any) => !z.anschluesse.length).map((z: any) => z.id),
    ohneErklaerung: alle.filter((z: any) => !String(z.erklaerung || '').trim()).map((z: any) => z.id),
    ohneName: alle.filter((z: any) => !String(z.name || '').trim()).map((z: any) => z.id),
    doppelteKennung: alle.map((z: any) => z.id)
      .filter((id: string, i: number, a: string[]) => a.indexOf(id) !== i),
    /* PUNKT 8: einheitliche Grössen INNERHALB der Bibliothek. Alles auf
       Vielfachen des Rasters — sonst rastet später nichts ein. */
    nebenDemRaster: alle.filter((z: any) =>
      z.w % Register.fachzeichen.RASTER || z.h % Register.fachzeichen.RASTER ||
      z.anschluesse.some((a: any) => a.x % Register.fachzeichen.RASTER ||
                                     a.y % Register.fachzeichen.RASTER)).map((z: any) => z.id),
    /* Anschlüsse müssen AM RAND liegen, sonst kann keine Leitung hin. */
    innenliegend: alle.filter((z: any) => z.anschluesse.some((a: any) =>
      a.x > 0 && a.x < z.w && a.y > 0 && a.y < z.h)).map((z: any) => z.id)
  };
});
p('Es gibt mindestens 60 Fachzeichen', bib.anzahl >= 60, String(bib.anzahl));
p('Es gibt mindestens 10 Gruppen', bib.gruppen.length >= 10, String(bib.gruppen.length));
gleich('Jedes Zeichen steht in einer bekannten Gruppe', bib.ohneGruppe, []);
gleich('Jedes Zeichen hat mindestens einen Anschluss', bib.ohneAnschluss, []);
gleich('Jedes Zeichen hat einen Namen', bib.ohneName, []);
gleich('Jedes Zeichen hat einen Erklärungssatz für den Lernmodus', bib.ohneErklaerung, []);
gleich('Keine Kennung kommt zweimal vor', bib.doppelteKennung, []);
gleich('Alle Masse und Anschlüsse liegen im Raster (Punkt 8)', bib.nebenDemRaster, []);
gleich('Kein Anschluss liegt mitten im Zeichen', bib.innenliegend, []);

/* Die Gruppen aus dem Auftrag müssen wirklich da sein. */
['schalter', 'relais', 'motoren', 'schutz', 'sensoren', 'messen'].forEach(g =>
  p('Gruppe „' + g + "\" gibt es (Punkt 5)", bib.gruppen.includes(g), bib.gruppen.join(',')));

/* ==========================================================================
 * §2 · Jedes Zeichen wird wirklich gezeichnet
 * ------------------------------------------------------------------------
 * Ein Symbol, das keine Geometrie erzeugt, steht als leerer Kasten in der
 * Palette — und niemand merkt es, bis jemand es setzen will.
 * ========================================================================*/
console.log('\n2 · Jedes Zeichen wird wirklich gezeichnet');

const gezeichnet = await seite.evaluate(() => {
  const raus = { leer: [] as string[], ohneSvg: [] as string[], knoten: 0 };
  Register.fachzeichen.alle().forEach((z: any) => {
    const svg = Register.fachzeichen.alsSvg(z.id);
    if (!svg) { raus.ohneSvg.push(z.id); return; }
    const d = document.createElement('div');
    d.innerHTML = svg; document.body.appendChild(d);
    const n = d.querySelectorAll('path, circle, text').length;
    raus.knoten += n;
    if (n < 2) raus.leer.push(z.id + ':' + n);
    d.remove();
  });
  return raus;
});
gleich('Jedes Zeichen liefert ein SVG', gezeichnet.ohneSvg, []);
gleich('Kein Zeichen besteht aus weniger als zwei Strichen', gezeichnet.leer, []);
p('Insgesamt entstehen viele hundert Geometrieknoten',
  gezeichnet.knoten > 300, String(gezeichnet.knoten));

/* Beschriftung ausblenden zum Lernen (Punkt 9) — der Motor darf sein „M"
   verlieren, sonst verrät die Beschriftung die Antwort. */
const ohneText = await seite.evaluate(() => ({
  mit: (Register.fachzeichen.alsSvg('motor-drehstrom', {}).match(/<text/g) || []).length,
  ohne: (Register.fachzeichen.alsSvg('motor-drehstrom', { zeigeText: false }).match(/<text/g) || []).length
}));
p('Mit Beschriftung steht Text im Bild', ohneText.mit >= 2, JSON.stringify(ohneText));
gleich('Ohne Beschriftung steht keiner mehr (Punkt 9)', ohneText.ohne, 0);

/* ==========================================================================
 * §3 · Drehen und Spiegeln verschieben die Anschlüsse richtig
 * ------------------------------------------------------------------------
 * Das ist die Rechnung, die alles andere trägt: rastet sie falsch, enden
 * Leitungen neben dem Symbol und der Plan lügt.
 * ========================================================================*/
console.log('\n3 · Drehen und Spiegeln');

const dreh = await seite.evaluate(() => {
  const F = Register.fachzeichen;
  /* Der Schliesser ist 40 breit, 60 hoch, Anschluss „3" oben mittig (20,0). */
  return {
    null:    F.anschlussLage('schliesser', '3', 0, false),
    neunzig: F.anschlussLage('schliesser', '3', 90, false),
    hundert80: F.anschlussLage('schliesser', '3', 180, false),
    gespiegelt: F.anschlussLage('schliesser', '3', 0, true),
    masseNull: F.masse('schliesser', 0),
    masse90: F.masse('schliesser', 90),
    unbekannt: F.anschlussLage('gibtesnicht', '1', 0, false)
  };
});
gleich('Ungedreht sitzt Anschluss 3 oben mittig', dreh.null, { x: 20, y: 0 });
/* 90° um die Mitte (20,30): aus (20,0) wird (50,30) — und das liegt
   ausserhalb der ungedrehten Breite, genau deshalb tauschen die Masse. */
gleich('Um 90° gedreht wandert er nach rechts', dreh.neunzig, { x: 50, y: 30 });
gleich('Um 180° gedreht liegt er unten', dreh.hundert80, { x: 20, y: 60 });
gleich('Gespiegelt bleibt er mittig — er liegt ja auf der Achse', dreh.gespiegelt, { x: 20, y: 0 });
gleich('Ungedreht sind die Masse 40 × 60', dreh.masseNull, { w: 40, h: 60 });
gleich('Um 90° gedreht tauschen Breite und Höhe', dreh.masse90, { w: 60, h: 40 });
gleich('Ein unbekanntes Zeichen gibt null statt eines Absturzes', dreh.unbekannt, null);

/* ==========================================================================
 * §4 · Rechtwinklig führen (Punkt 14)
 * ========================================================================*/
console.log('\n4 · Leitungen laufen rechtwinklig');

const winkel = await seite.evaluate(() => ({
  gerade:  Schaltplan.rechtwinklig({ x: 0, y: 0 }, { x: 100, y: 0 }),
  senkrecht: Schaltplan.rechtwinklig({ x: 0, y: 0 }, { x: 0, y: 100 }),
  breiter: Schaltplan.rechtwinklig({ x: 0, y: 0 }, { x: 100, y: 20 }),
  hoeher:  Schaltplan.rechtwinklig({ x: 0, y: 0 }, { x: 20, y: 100 })
}));
gleich('Waagrecht bleibt eine Strecke', winkel.gerade, [{ x: 0, y: 0 }, { x: 100, y: 0 }]);
gleich('Senkrecht bleibt eine Strecke', winkel.senkrecht, [{ x: 0, y: 0 }, { x: 0, y: 100 }]);
/* Weiter nach rechts als nach unten: erst waagrecht. Das ist, was man beim
   Ziehen erwartet, und es ist IMMER gleich — ein Plan, in dem die Ecke mal
   so und mal so liegt, sieht unruhig aus. */
gleich('Weiter seitlich → erst waagrecht, dann senkrecht',
  winkel.breiter, [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 20 }]);
gleich('Weiter nach unten → erst senkrecht, dann waagrecht',
  winkel.hoeher, [{ x: 0, y: 0 }, { x: 0, y: 100 }, { x: 20, y: 100 }]);

/* ==========================================================================
 * §5 · Verbindungspunkt und Kreuzung (Punkte 15, 16)
 * ------------------------------------------------------------------------
 * Der wichtigste Unterschied im ganzen Plan.
 * ========================================================================*/
console.log('\n5 · Verbindungspunkt und Kreuzung');

const kreuz = await seite.evaluate(() => {
  const mach = (leitungen: any[]) => ({
    art: 'stromlauf-aufgeloest', breite: 400, hoehe: 400, teile: [], texte: [],
    ebenen: Schaltplan.EBENEN_VORGABE.map((e: any) => ({ ...e })),
    leitungen: leitungen.map((l, i) => ({ id: 'L' + i, ebene: 'plan', punkte: l }))
  });
  /* Fall A: eine senkrechte Leitung ENDET auf einer waagrechten → Verbindung */
  const a = mach([
    [{ x: 0, y: 100 }, { x: 300, y: 100 }],
    [{ x: 150, y: 100 }, { x: 150, y: 300 }]
  ]);
  /* Fall B: eine senkrechte KREUZT eine waagrechte, ohne dort zu enden */
  const b = mach([
    [{ x: 0, y: 100 }, { x: 300, y: 100 }],
    [{ x: 150, y: 0 }, { x: 150, y: 300 }]
  ]);
  return {
    aPunkte: Schaltplan.verbindungspunkte(a),
    aKreuz: Schaltplan.kreuzungen(a),
    bPunkte: Schaltplan.verbindungspunkte(b),
    bKreuz: Schaltplan.kreuzungen(b),
    /* Und der Pfad muss die Lücke wirklich enthalten. */
    bPfad: Schaltplan.leitungPfad(b.leitungen[0], Schaltplan.kreuzungen(b))
  };
});
gleich('Wer auf einer Leitung endet, bekommt einen Verbindungspunkt',
  kreuz.aPunkte, [{ x: 150, y: 100 }]);
gleich('… und dort wird nichts unterbrochen', kreuz.aKreuz, []);
gleich('Wer nur kreuzt, bekommt KEINEN Punkt', kreuz.bPunkte, []);
gleich('… sondern eine Kreuzung', kreuz.bKreuz, [{ x: 150, y: 100 }]);
p('Und der Pfad hat dort wirklich eine Lücke',
  /M0,100 L145,100.*M155,100 L300,100/.test(kreuz.bPfad), kreuz.bPfad);

/* ==========================================================================
 * §6 · Fortlaufende Nummerierung (Punkt 20)
 * ========================================================================*/
console.log('\n6 · Betriebsmittel werden fortlaufend nummeriert');

const nummern = await seite.evaluate(() => {
  const plan = Schaltplan.neuerPlan('stromlauf-aufgeloest');
  const setze = (zeichen: string) => {
    const bmk = Schaltplan.naechstesBmk(plan, zeichen);
    plan.teile.push({ id: Schaltplan.uid(), zeichen, x: 0, y: 0, drehung: 0,
                      gespiegelt: false, bmk, nummern: {}, gruppe: '', ebene: 'plan' });
    return bmk;
  };
  const eins = setze('spule');          /* K1 */
  const zwei = setze('spule');          /* K2 */
  const s1 = setze('taster-schliesser'); /* S1 — eigener Buchstabe */
  const drei = setze('spule');          /* K3 */
  /* Jetzt K2 löschen und ein neues Schütz setzen: es muss K2 heissen. */
  plan.teile = plan.teile.filter((t: any) => t.bmk !== 'K2');
  const wieder = setze('spule');
  const ohne = Schaltplan.naechstesBmk(plan, 'verbindungspunkt');
  return { eins, zwei, s1, drei, wieder, ohne };
});
gleich('Das erste Schütz heisst K1', nummern.eins, 'K1');
gleich('Das zweite K2', nummern.zwei, 'K2');
gleich('Ein Taster fängt bei S1 an — eigener Buchstabe', nummern.s1, 'S1');
gleich('Das dritte Schütz K3', nummern.drei, 'K3');
/* NICHT „Anzahl plus eins": wer K2 löscht, bekommt K2 zurück und nicht K4 —
   sonst fehlt K2 im Plan für immer. */
gleich('Nach dem Löschen von K2 wird die Lücke wieder gefüllt', nummern.wieder, 'K2');
gleich('Ein Zeichen ohne Kennbuchstabe bekommt kein Kennzeichen', nummern.ohne, '');

/* ==========================================================================
 * §7 · Der Plan ist ein normaler Block
 * ------------------------------------------------------------------------
 * Er muss durch Speichern, Neuladen und Papierkorb gehen wie jeder andere.
 * ========================================================================*/
console.log('\n7 · Der Plan ist ein normaler Block');

const gebaut = await seite.evaluate(() => {
  const s = Store.addPage(null, { text: 'Elektro-Prüfung' });
  const b = Store.addBlock(s.id, 'schaltplan', { text: 'Selbsthaltung' });
  const plan = Schaltplan.neuerPlan('stromlauf-aufgeloest');
  const T = (zeichen: string, x: number, y: number, bmk: string) =>
    ({ id: Schaltplan.uid(), zeichen, x, y, drehung: 0, gespiegelt: false,
       bmk, nummern: {}, gruppe: '', ebene: 'plan' });
  plan.teile = [T('taster-oeffner', 100, 100, 'S0'), T('spule', 100, 300, 'K1')];
  plan.leitungen = [{ id: Schaltplan.uid(), ebene: 'plan',
    punkte: [{ x: 120, y: 160 }, { x: 120, y: 300 }] }];
  Store.updateBlock(b.id, { plan });
  return { seite: s.id, block: b.id };
});
await seite.evaluate((x: any) => { App.zeichneBaum(); App.oeffne(x.seite); }, gebaut);
await seite.waitForTimeout(900);
await seite.evaluate(() =>
  document.querySelectorAll('#rg-willkommen, .overlay').forEach(x => x.remove()));

const imBild = await seite.evaluate(() => ({
  flaeche: !!document.querySelector('.sp-wrap'),
  svg: !!document.querySelector('.sp-flaeche'),
  teile: document.querySelectorAll('.sp-teil').length,
  leitungen: document.querySelectorAll('.sp-leitung').length,
  palette: document.querySelectorAll('.sp-sym').length,
  werkzeuge: document.querySelectorAll('.sp-wz').length,
  ebenen: document.querySelectorAll('.sp-ebene').length,
  /* Das Betriebsmittel steht am Symbol (Punkt 19) */
  bmk: [...document.querySelectorAll('.sp-teil text')].map(t => t.textContent)
}));
p('Die Fläche ist da', imBild.flaeche);
gleich('Beide Symbole stehen im Bild', imBild.teile, 2);
gleich('Die Leitung auch', imBild.leitungen, 1);
p('Die Palette bietet alle Zeichen an (Punkt 12)', imBild.palette >= 60, String(imBild.palette));
gleich('Vier Werkzeuge', imBild.werkzeuge, 4);
gleich('Drei Ebenen (Punkte 48/49)', imBild.ebenen, 3);
gleich('Die Betriebsmittel stehen am Symbol (Punkt 19)',
  imBild.bmk.slice().sort(), ['K1', 'S0']);

/* Nach dem Neuladen muss alles noch da sein — der Plan liegt im Block. */
await seite.reload();
await seite.waitForTimeout(2600);
await seite.evaluate(() =>
  document.querySelectorAll('#rg-willkommen, .overlay').forEach(x => x.remove()));
await seite.evaluate((x: any) => App.oeffne(x.seite), gebaut);
await seite.waitForTimeout(900);
const nachNeuladen = await seite.evaluate(() => ({
  teile: document.querySelectorAll('.sp-teil').length,
  leitungen: document.querySelectorAll('.sp-leitung').length
}));
gleich('Nach dem Neuladen stehen die Symbole noch da', nachNeuladen.teile, 2);
gleich('Und die Leitung auch', nachNeuladen.leitungen, 1);

/* ==========================================================================
 * §8 · Das aktive Werkzeug ist sichtbar
 * ------------------------------------------------------------------------
 * Beim ersten Bau stand hier `var(--akzent)` — eine Variable, die es in
 * Redion nicht gibt. Der Hintergrund blieb durchsichtig und die Schrift
 * wurde `#231000`: fast schwarz auf fast schwarzem Grund. Ausgerechnet das
 * AKTIVE Werkzeug war damit das einzige unsichtbare, und keine Prüfung hätte
 * es gefunden — die Klasse `an` war ja gesetzt.
 * ========================================================================*/
console.log('\n8 · Das aktive Werkzeug ist sichtbar');

const werkzeug = await seite.evaluate(() => {
  const wz = [...document.querySelectorAll('.sp-wz')] as HTMLElement[];
  const an = wz.find(w => w.classList.contains('an'));
  if (!an) return null;
  const cs = getComputedStyle(an);
  const zahl = (f: string) => (f.match(/[\d.]+/g) || []).map(Number);
  const [hr, hg, hb, ha] = zahl(cs.backgroundColor);
  const [vr, vg, vb] = zahl(cs.color);
  const kanal = (c: number) => { const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
  const hell = (r: number, g: number, b: number) =>
    0.2126 * kanal(r) + 0.7152 * kanal(g) + 0.0722 * kanal(b);
  const a = hell(hr!, hg!, hb!), b2 = hell(vr!, vg!, vb!);
  return {
    deckend: (ha === undefined ? 1 : ha) > 0.5,
    kontrast: Math.round(((Math.max(a, b2) + 0.05) / (Math.min(a, b2) + 0.05)) * 10) / 10,
    hg: cs.backgroundColor, fg: cs.color
  };
});
p('Es gibt ein aktives Werkzeug', !!werkzeug, JSON.stringify(werkzeug));
p('Sein Hintergrund ist wirklich gefüllt, nicht durchsichtig',
  werkzeug?.deckend === true, JSON.stringify(werkzeug));
/* §38 verlangt 4.5:1 für Text. Ein 15-px-Zeichen ist gross genug für 3:1,
   aber die Akzentfarbe schafft mehr — also wird auch mehr verlangt. */
p('Und der Kontrast reicht (§38)', (werkzeug?.kontrast ?? 0) >= 4.5,
  JSON.stringify(werkzeug));

/* ==========================================================================
 * §9 · Alle elf Planarten gibt es (Punkte 31–40)
 * ========================================================================*/
console.log('\n9 · Die Planarten');

const arten = await seite.evaluate(() => ({
  liste: Schaltplan.ARTEN.map((a: any) => a.id),
  ohneErklaerung: Schaltplan.ARTEN.filter((a: any) => !a.erklaerung).map((a: any) => a.id),
  ohneGruppen: Schaltplan.ARTEN.filter((a: any) => !a.gruppen.length).map((a: any) => a.id),
  /* Eine unbekannte Art darf nicht werfen, sondern fällt auf die erste. */
  unbekannt: Schaltplan.artVon('gibtesnicht').id,
  imFenster: [...document.querySelectorAll('.sp-art option')].map(o => (o as HTMLOptionElement).value)
}));
['stromlauf-aufgeloest', 'stromlauf-zusammenhaengend', 'installationsplan',
 'uebersichtsplan', 'klemmenplan', 'verdrahtungsplan', 'anschlussplan',
 'blockschaltbild', 'funktionsplan', 'aufbauplan'].forEach(a =>
  p('Planart „' + a + '" gibt es', arten.liste.includes(a), arten.liste.join(',')));
gleich('Jede Art erklärt sich', arten.ohneErklaerung, []);
gleich('Jede Art schlägt Symbolgruppen vor', arten.ohneGruppen, []);
gleich('Eine unbekannte Art fällt auf die erste zurück',
  arten.unbekannt, 'stromlauf-aufgeloest');
gleich('Und alle stehen im Auswahlfeld', arten.imFenster.length, arten.liste.length);

/* ==========================================================================
 * §10 · Ein alter oder kaputter Plan bringt den Editor nicht um
 * ------------------------------------------------------------------------
 * Ein Block kann aus einer Sicherung kommen, die es vor diesem Editor gab.
 * ========================================================================*/
console.log('\n10 · Kaputte Pläne werden geheilt, nicht geworfen');

const geheilt = await seite.evaluate(() => {
  const f = (roh: any) => {
    try { return { ok: true, plan: Schaltplan.lesen({ plan: roh }) }; }
    catch (e: any) { return { ok: false, fehler: String(e && e.message) }; }
  };
  const leer = f(undefined);
  const muell = f({ teile: 'kein array', leitungen: 42, ebenen: null, art: 'quatsch' });
  const halb = f({ teile: [{ zeichen: 'spule' }], leitungen: [{ punkte: [{ x: 1 }] }] });
  return {
    leerOk: leer.ok, leerTeile: leer.ok ? leer.plan.teile.length : -1,
    leerEbenen: leer.ok ? leer.plan.ebenen.length : -1,
    muellOk: muell.ok, muellArt: muell.ok ? muell.plan.art : '',
    halbOk: halb.ok,
    /* Ein Teil ohne Ort landet bei 0,0 und behält seine Kennung. */
    halbTeil: halb.ok ? halb.plan.teile[0] : null,
    /* Eine Leitung mit einem Punkt ist keine Leitung — sie fliegt raus. */
    halbLeitungen: halb.ok ? halb.plan.leitungen.length : -1
  };
});
p('Ein fehlender Plan wirft nicht', geheilt.leerOk);
gleich('Er ist leer', geheilt.leerTeile, 0);
gleich('… hat aber schon die drei Ebenen', geheilt.leerEbenen, 3);
p('Müll in den Feldern wirft nicht', geheilt.muellOk);
gleich('Eine unbekannte Art wird zur ersten', geheilt.muellArt, 'stromlauf-aufgeloest');
p('Ein halbes Teil wirft nicht', geheilt.halbOk);
p('Es bekommt Ort, Drehung und Ebene ergänzt',
  geheilt.halbTeil && geheilt.halbTeil.x === 0 && geheilt.halbTeil.drehung === 0 &&
  geheilt.halbTeil.ebene === 'plan', JSON.stringify(geheilt.halbTeil));
gleich('Eine Leitung mit nur einem Punkt fliegt raus', geheilt.halbLeitungen, 0);

p('Keine Fehler auf der Seite', fehler.length === 0, fehler.join(' · '));

console.log(`\n${ok} bestanden, ${weg} gescheitert`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
