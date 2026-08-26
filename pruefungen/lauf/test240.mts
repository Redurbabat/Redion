/* Suite 206 — Das Formelheft (Elektro, Punkte 61–90)
 * ============================================================================
 * Redur hat es so beschrieben: „wenn ich zeichne und dort bei einfügen
 * Formelheft klicke, sollte das Formelheft dort kommen, und ich es bewegen
 * können, und auf alle Seiten gehen können und die Seiten auch in Favoriten
 * speichern können".
 *
 * DAS ENTSCHEIDENDE WORT IST „WENN ICH ZEICHNE". Ein Nachschlagewerk, das die
 * Arbeit ERSETZT, statt daneben zu stehen, ist keines: man schlägt nach,
 * schliesst es, merkt sich die Formel — und merkt sie sich falsch. Deshalb
 * prüft §3 ausdrücklich, dass der Plan darunter offen und bedienbar bleibt.
 *
 * UND DIE FORMELN MÜSSEN RECHNEN. Eine Sammlung, die nur anzeigt, ist ein
 * Bild von einem Formelheft. §5 setzt Zahlen ein und vergleicht das Ergebnis
 * mit dem, was von Hand herauskommt — samt Rechenweg, denn im Unterricht wird
 * der Weg bewertet und nicht die Zahl.
 *
 * KEIN eval(). §20 verbietet es, und die Formeln lösen deshalb über echte
 * Funktionen. §6 prüft, dass keine hereinkommt.
 *
 *   node pruefungen/lauf/test240.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

declare const Store: any; declare const App: any; declare const Register: any;
declare const Schaltplan: any; declare const Formelheft: any;
declare const Elektrolernbilder: any; declare const Elektroarbeitsplatz: any;

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8999;

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
 * §1 · Die Sammlung
 * ========================================================================*/
console.log('\n1 · Die Formelsammlung');

const sammlung = await seite.evaluate(() => {
  const R = Register.elektroformeln;
  const alle = R.alle();
  const kap = R.kapitel();
  return {
    anzahl: alle.length,
    kapitel: kap.length,
    kapitelIds: kap.map((k: any) => k[0]),
    ohneErklaerung: alle.filter((f: any) => !f.erklaerung).map((f: any) => f.id),
    ohneSchreibweise: alle.filter((f: any) => !f.schreibweise).map((f: any) => f.id),
    ohneGroessen: alle.filter((f: any) => !(f.groessen || []).length).map((f: any) => f.id),
    ohneLoesung: alle.filter((f: any) => !Object.keys(f.loese || {}).length).map((f: any) => f.id),
    /* Zeichen und Name sind Pflicht. Die Einheit ist es NICHT — und das ist
       keine Nachlässigkeit, sondern Physik: der Wirkungsgrad, cos φ, die
       Dielektrizitätszahl und eine Windungszahl sind Verhältnisse und haben
       keine. Der erste Entwurf dieser Prüfung verlangte überall eine Einheit
       und machte damit fünf richtige Einträge rot.

       Geprüft wird deshalb anders: das FELD muss da sein (sonst hat es
       jemand vergessen), und WELCHE Grössen einheitenlos sind, steht unten
       als Liste. So fällt eine neue Grösse ohne Einheit auf, statt sich
       unter den vierzehn richtigen zu verstecken. */
    ohnePflicht: alle.flatMap((f: any) => (f.groessen || [])
      .filter((g: any) => !g.zeichen || !g.name || typeof g.einheit !== 'string')
      .map((g: any) => f.id + '/' + (g.zeichen || '?'))),
    einheitenlos: [...new Set(alle.flatMap((f: any) => (f.groessen || [])
      .filter((g: any) => g.einheit === '')
      .map((g: any) => g.zeichen)))].sort(),
    /* Ein Kapitel, in dem nichts steht, ist ein leeres Versprechen. */
    leereKapitel: kap.map((k: any) => k[0])
      .filter((id: string) => R.imKapitel(id).length === 0)
  };
});
p('Es gibt Formeln', sammlung.anzahl >= 40, `${sammlung.anzahl}`);
p('… in mehreren Kapiteln', sammlung.kapitel >= 10, `${sammlung.kapitel}`);
p('Jede Formel hat eine Schreibweise', !sammlung.ohneSchreibweise.length,
  sammlung.ohneSchreibweise.join(', '));
p('Jede erklärt sich in einem Satz', !sammlung.ohneErklaerung.length,
  sammlung.ohneErklaerung.join(', '));
p('Jede nennt ihre Grössen', !sammlung.ohneGroessen.length, sammlung.ohneGroessen.join(', '));
p('Jede Grösse hat Zeichen, Name und ein Einheitenfeld',
  !sammlung.ohnePflicht.length, sammlung.ohnePflicht.slice(0, 5).join(', '));
/* Wer eine Grösse hinzufügt und die Einheit vergisst, muss diese Zeile
   anfassen — und dabei merken, dass er sie vergessen hat.

   ZWEI SORTEN stehen hier, und der Unterschied gehört benannt:

   Verhältnisse, Faktoren und Stückzahlen sind WIRKLICH einheitenlos —
   cos φ, der Wirkungsgrad, die Windungszahlen, die relative Permeabilität.
   Da gibt es nichts zu vergessen.

   `MB`, `MW` und `AF_abs` aus der Messtechnik sind es NICHT: ein
   Messbereich ist 300 V oder 5 A, je nachdem, was am Gerät eingestellt
   ist. Ihre Einheit steht nicht fest, weil sie von der Messung abhängt —
   und ein falscher fester Eintrag wäre schlimmer als ein leerer. */
const EINHEITENLOS = ['AF_abs', 'MB', 'MW', 'N', 'N₁', 'N₂', 'cosφ', 'k', 'n', 'p',
                      'sinφ', 'tanφ', 'tanφ₁', 'tanφ₂', 'εᵣ', 'η', 'η_B', 'μ_r'];
p('Und einheitenlos sind nur die, die es sein dürfen',
  JSON.stringify(sammlung.einheitenlos) === JSON.stringify(EINHEITENLOS),
  `ist ${JSON.stringify(sammlung.einheitenlos)}`);
p('Jede lässt sich nach mindestens einer Grösse lösen',
  !sammlung.ohneLoesung.length, sammlung.ohneLoesung.join(', '));
p('Kein Kapitel ist leer', !sammlung.leereKapitel.length, sammlung.leereKapitel.join(', '));

/* ==========================================================================
 * §2 · Suchen
 * ========================================================================*/
console.log('\n2 · Suchen');

const suche = await seite.evaluate(() => {
  const R = Register.elektroformeln;
  return {
    ohm: R.suche('ohm').length,
    leistung: R.suche('leistung').length,
    /* Nach dem ZEICHEN suchen, nicht nur nach dem Wort — wer „P" im Kopf
       hat, tippt „P" und nicht „Leistung". */
    zeichen: R.suche('cos').length,
    quatsch: R.suche('zzzqqq').length,
    leer: R.suche('').length
  };
});
p('„ohm" findet etwas', suche.ohm > 0, `${suche.ohm}`);
p('„leistung" findet etwas', suche.leistung > 0, `${suche.leistung}`);
p('Auch ein Formelzeichen findet', suche.zeichen > 0, `${suche.zeichen}`);
p('Unsinn findet nichts', suche.quatsch === 0, `${suche.quatsch}`);
p('Eine leere Suche wirft nicht', typeof suche.leer === 'number');

/* ==========================================================================
 * §3 · Das Fenster schwebt — und die Arbeit bleibt darunter
 * ========================================================================*/
console.log('\n3 · Das Fenster');

/* Ein Schaltplan, damit es etwas gibt, worüber das Heft schweben kann. */
await seite.evaluate(() => {
  const st = Store.addPage(null, { text: 'Formelheft beim Zeichnen' });
  const b = Store.addBlock(st.id, 'schaltplan', { text: 'Stromkreis' });
  const plan = Schaltplan.neuerPlan('stromlauf-aufgeloest');
  plan.breite = 620; plan.hoehe = 340; plan.teile = []; plan.leitungen = []; plan.texte = [];
  let z = 0;
  const teil = (zeichen: string, bmk: string, x: number, y: number) => {
    const t = { id: 't' + (++z), zeichen, x, y, drehung: 0, gespiegelt: false,
                bmk, nummern: {}, gruppe: '', ebene: 'plan' };
    plan.teile.push(t); return t;
  };
  const q = teil('wechselspannung', 'G1', 40, 120);
  const s = teil('ch-schema0', 'S1', 240, 20);
  const h = teil('lampe', 'E1', 230, 120);
  const ort = (t: any, nr: string) => {
    const a = Schaltplan.anschluesseVon(t).find((x: any) => x.nr === nr);
    return { x: a.x, y: a.y };
  };
  plan.leitungen.push({ id: 'l1', ebene: 'plan',
    punkte: [ort(q, 'L'), { x: 70, y: 20 }, ort(s, '3')],
    vonTeil: q.id, vonNr: 'L', nachTeil: s.id, nachNr: '3' });
  plan.leitungen.push({ id: 'l2', ebene: 'plan', punkte: [ort(s, '4'), ort(h, 'X1')],
    vonTeil: s.id, vonNr: '4', nachTeil: h.id, nachNr: 'X1' });
  plan.leitungen.push({ id: 'l3', ebene: 'plan', punkte: [ort(h, 'X2'), ort(q, 'N')],
    vonTeil: h.id, vonNr: 'X2', nachTeil: q.id, nachNr: 'N' });
  Store.updateBlock(b.id, { plan });
  (window as any).__st = st.id;
});
await seite.evaluate(() => { App.zeichneBaum(); App.oeffne((window as any).__st); });
await seite.waitForTimeout(1000);
await seite.evaluate(() =>
  document.querySelectorAll('#rg-willkommen, .overlay').forEach(x => x.remove()));

p('Die Planfläche steht', await seite.locator('.sp-wrap').count() === 1);
p('Und hat einen Knopf fürs Formelheft', await seite.locator('.sp-heft').count() === 1);
p('Das Heft ist noch zu', await seite.locator('.fh-fenster').count() === 0);

await seite.click('.sp-heft');
await seite.waitForTimeout(600);
p('Nach dem Klick steht es da', await seite.locator('.fh-fenster').count() === 1);

/* Der Punkt der ganzen Übung: der Plan bleibt SICHTBAR und BEDIENBAR.
   Ein Dialog mit abdunkelndem Hintergrund würde beides nehmen. */
p('Der Plan darunter ist weiter da', await seite.locator('.sp-flaeche').count() === 1);
p('Und es liegt kein Überlagerungsschleier darüber',
  await seite.locator('.overlay').count() === 0);
const planKlickbar = await seite.evaluate(() => {
  const svg = document.querySelector('.sp-flaeche') as SVGElement;
  const r = svg.getBoundingClientRect();
  const oben = document.elementFromPoint(r.left + 12, r.top + 12);
  return !!oben && !!oben.closest('.sp-wrap');
});
p('Der Plan nimmt Klicks entgegen, während das Heft offen ist', planKlickbar);

/* Es öffnet das Kapitel, das zum Plan passt: eine Lampe ist ein Verbraucher,
   also Leistung — und NICHT Lichttechnik. Das war beim ersten Bau falsch
   herum, und das Heft schlug beim Zeichnen eines Stromkreises die
   Beleuchtungsstärke auf. */
const kapitelOffen = await seite.locator('.fh-kapitel button.an').innerText();
p('Es öffnet das Kapitel, das zum Plan passt', /Leistung/.test(kapitelOffen), kapitelOffen);

/* Das Band rollt quer und sagt es auch — sonst endet „Leistung und Energie"
   scharf am Rand als „Leistung und E" (dasselbe Bild wie E159). */
const band = await seite.evaluate(() => {
  const b = document.querySelector('.fh-band') as HTMLElement;
  const k = document.querySelector('.fh-kapitel') as HTMLElement;
  return { mehr: b?.dataset.mehr ?? '(nicht gesetzt)',
           rollt: k.scrollWidth > k.clientWidth + 1,
           imBild: (() => {
             const a = k.querySelector('.an') as HTMLElement;
             if (!a) return false;
             const ra = a.getBoundingClientRect(), rk = k.getBoundingClientRect();
             return ra.left >= rk.left - 1 && ra.right <= rk.right + 1;
           })() };
});
p('Das Kapitelband rollt hier wirklich', band.rollt);
p('… und zeigt einen auslaufenden Rand', band.mehr !== '(nicht gesetzt)' && band.mehr !== 'nein',
  band.mehr);
p('Das aktive Kapitel steht im Bild', band.imBild);

/* ==========================================================================
 * §4 · Bewegen und wiederfinden
 * ========================================================================*/
console.log('\n4 · Bewegen');

const vorher = (await seite.locator('.fh-fenster').boundingBox())!;
await seite.mouse.move(vorher.x + 100, vorher.y + 14);
await seite.mouse.down();
await seite.mouse.move(vorher.x - 300, vorher.y + 200, { steps: 8 });
await seite.mouse.up();
await seite.waitForTimeout(300);
const nachher = (await seite.locator('.fh-fenster').boundingBox())!;
p('Am Kopf lässt es sich schieben',
  Math.abs(nachher.x - vorher.x) > 100 && Math.abs(nachher.y - vorher.y) > 100,
  `${Math.round(vorher.x)},${Math.round(vorher.y)} → ${Math.round(nachher.x)},${Math.round(nachher.y)}`);

/* Weit über den Rand hinausziehen — es muss im Bild bleiben, sonst ist es
   weg und man bekommt es nie wieder. */
await seite.mouse.move(nachher.x + 100, nachher.y + 14);
await seite.mouse.down();
await seite.mouse.move(-900, -900, { steps: 8 });
await seite.mouse.up();
await seite.waitForTimeout(300);
const geflohen = (await seite.locator('.fh-fenster').boundingBox())!;
p('Es lässt sich nicht aus dem Bild schieben',
  geflohen.x >= -1 && geflohen.y >= -1,
  `${Math.round(geflohen.x)},${Math.round(geflohen.y)}`);

/* Und es merkt sich den Ort über das Schliessen hinweg. */
await seite.evaluate(() => Formelheft.schliessen());
await seite.waitForTimeout(200);
p('Zu ist zu', await seite.locator('.fh-fenster').count() === 0);
await seite.evaluate(() => Formelheft.oeffne());
await seite.waitForTimeout(500);
const wieder = (await seite.locator('.fh-fenster').boundingBox())!;
p('Beim nächsten Öffnen steht es wieder dort',
  Math.abs(wieder.x - geflohen.x) < 6 && Math.abs(wieder.y - geflohen.y) < 6,
  `${Math.round(wieder.x)},${Math.round(wieder.y)} statt ${Math.round(geflohen.x)},${Math.round(geflohen.y)}`);

/* ==========================================================================
 * §5 · Rechnen — mit Weg
 * ========================================================================*/
console.log('\n5 · Rechnen');

const gerechnet = await seite.evaluate(() => {
  const R = Register.elektroformeln;
  const zahl = (e: any) => (e && e.ok) ? e.wert : NaN;
  return {
    /* Ohm: 230 V an 46 Ω sind 5 A. */
    strom:   zahl(R.rechne('ohm', 'I', { U: 230, R: 46 })),
    spannung: zahl(R.rechne('ohm', 'U', { I: 5, R: 46 })),
    widerstand: zahl(R.rechne('ohm', 'R', { U: 230, I: 5 })),
    /* Leistung: 230 V mal 5 A sind 1150 W. */
    leistung: zahl(R.rechne('leistung-ui', 'P', { U: 230, I: 5 })),
    /* Und der Weg dazu. */
    weg: (R.rechne('ohm', 'I', { U: 230, R: 46 }) || {}).weg,
    /* Was fehlt, wird gesagt statt geraten. */
    ohneWert: R.rechne('ohm', 'I', { U: 230 }),
    /* Durch null wird nicht geteilt. */
    durchNull: R.rechne('ohm', 'I', { U: 230, R: 0 }),
    /* Eine Formel, die es nicht gibt, wirft nicht. */
    unbekannt: R.rechne('gibtesnicht', 'X', {}),
    /* Und eine Grösse, nach der sich diese Formel nicht auflösen lässt. */
    falscheGroesse: R.rechne('ohm', 'Z', { U: 230, R: 46 })
  };
});
p('U/R = I: 230 V an 46 Ω sind 5 A', gerechnet.strom === 5, `${gerechnet.strom}`);
p('Und rückwärts: I·R = U', gerechnet.spannung === 230, `${gerechnet.spannung}`);
p('Und nach R: U/I', gerechnet.widerstand === 46, `${gerechnet.widerstand}`);
p('P = U·I: 1150 W', gerechnet.leistung === 1150, `${gerechnet.leistung}`);
p('Es gibt einen Rechenweg', Array.isArray(gerechnet.weg) && gerechnet.weg.length >= 2,
  JSON.stringify(gerechnet.weg));
p('Der Weg nennt die eingesetzten Zahlen',
  (gerechnet.weg || []).some((z: string) => z.includes('230')),
  JSON.stringify(gerechnet.weg));
p('Ein fehlender Wert wird gemeldet, nicht geraten',
  gerechnet.ohneWert && gerechnet.ohneWert.ok === false, JSON.stringify(gerechnet.ohneWert));
p('Durch null wird nicht geteilt',
  gerechnet.durchNull && gerechnet.durchNull.ok === false,
  JSON.stringify(gerechnet.durchNull));
p('Eine unbekannte Formel wirft nicht',
  gerechnet.unbekannt && gerechnet.unbekannt.ok === false);
p('Eine Grösse, nach der es nicht geht, wirft auch nicht',
  gerechnet.falscheGroesse && gerechnet.falscheGroesse.ok === false);

/* Und dasselbe über die Oberfläche — die Rechnung nützt nichts, wenn die
   Felder sie nicht auslösen. */
await seite.evaluate(() => Formelheft.umschalten('grund'));
await seite.waitForTimeout(400);
await seite.evaluate(() => Formelheft.oeffne('grund'));
await seite.waitForTimeout(500);
const ohmKasten = seite.locator('.fh-formel[data-id="ohm"]');
p('Das Ohmsche Gesetz steht im Grundkapitel', await ohmKasten.count() === 1);
await ohmKasten.locator('[data-gesucht="I"]').click();
await ohmKasten.locator('input[data-g="U"]').fill('230');
await ohmKasten.locator('input[data-g="R"]').fill('46');
await seite.waitForTimeout(400);
const anzeige = (await ohmKasten.locator('.fh-ergebnis').innerText()).replace(/\s+/g, ' ');
p('Die Felder rechnen und zeigen 5 A', /\b5\s*A\b/.test(anzeige), anzeige);
p('Das gesuchte Feld ist als solches markiert',
  await ohmKasten.locator('.fh-feld.gesucht').count() === 1);
p('Und es steht auch im gesuchten Feld',
  (await ohmKasten.locator('input[data-g="I"]').inputValue()) === '5',
  await ohmKasten.locator('input[data-g="I"]').inputValue());

/* ==========================================================================
 * §6 · Kein eval() (§20)
 * ========================================================================*/
console.log('\n6 · Keine Fremdausführung');

const quellen = ['quell/register/elektroformeln.js', 'quell/bereiche/elektro/formelheft.js',
                 'quell/bereiche/elektro/simulation.js'];
for (const q of quellen) {
  const text = fs.readFileSync(path.join(WURZEL, q), 'utf8');
  /* `new Function` und `eval` sind beide gemeint — §20 nennt beide. */
  const treffer = /\beval\s*\(|new\s+Function\s*\(/.exec(text);
  p(`${q.split('/').pop()} führt keinen fremden Code aus`, !treffer,
    treffer ? treffer[0] : '');
}
/* Gegenprobe: die Regel muss überhaupt anschlagen können (§55.2). */
p('… und die Regel würde es merken',
  /\beval\s*\(|new\s+Function\s*\(/.test('const x = new Function("return 1")'));

/* ==========================================================================
 * §7 · Favoriten
 * ========================================================================*/
console.log('\n7 · Merken');

const fav = await seite.evaluate(() => {
  const vorher = Formelheft.favoriten().slice();
  const dazu = Formelheft.favoritUmschalten('ohm');
  const mitOhm = Formelheft.favoriten().slice();
  const weg = Formelheft.favoritUmschalten('ohm');
  const ohneOhm = Formelheft.favoriten().slice();
  /* Und Seiten des eigenen Hefts — dieselbe Mechanik, andere Ablage. */
  Formelheft.seiteUmschalten(7);
  Formelheft.seiteUmschalten(3);
  const seiten = Formelheft.seitenFavoriten().slice();
  Formelheft.seiteUmschalten(7);
  const nachher = Formelheft.seitenFavoriten().slice();
  return { vorher, dazu, mitOhm, weg, ohneOhm, seiten, nachher };
});
p('Am Anfang ist nichts gemerkt', fav.vorher.length === 0, JSON.stringify(fav.vorher));
p('Merken meldet „dazu"', fav.dazu === true);
p('… und die Formel steht drin', fav.mitOhm.includes('ohm'));
p('Nochmal drücken meldet „weg"', fav.weg === false);
p('… und sie ist wieder raus', !fav.ohneOhm.includes('ohm'));
p('Seiten lassen sich auch merken', JSON.stringify(fav.seiten) === '[3,7]',
  JSON.stringify(fav.seiten));
p('… und einzeln wieder vergessen', JSON.stringify(fav.nachher) === '[3]',
  JSON.stringify(fav.nachher));

/* Gemerkte Formeln bekommen ein eigenes Kapitel — sonst nützt das Merken
   nichts, weil man sie trotzdem suchen müsste. */
await seite.evaluate(() => {
  Formelheft.favoritUmschalten('ohm');
  Formelheft.favoritUmschalten('leistung-ui');
  Formelheft.schliessen();
});
await seite.evaluate(() => Formelheft.oeffne('fav'));
await seite.waitForTimeout(500);
p('Es gibt ein Kapitel für die gemerkten',
  await seite.locator('.fh-kapitel button[data-k="fav"]').count() === 1);
p('… und darin stehen genau die zwei',
  await seite.locator('.fh-formel').count() === 2,
  `${await seite.locator('.fh-formel').count()}`);

/* ==========================================================================
 * §8 · Der Befehl in der Palette
 * ========================================================================*/
console.log('\n8 · Der zweite Weg hinein');

const befehle = await seite.evaluate(() =>
  Register.befehle.alle().filter((b: any) => /Formelheft/.test(b.titel))
    .map((b: any) => ({ titel: b.titel, gruppe: b.gruppe })));
p('Das Formelheft steht in der Befehlspalette', befehle.length >= 1,
  JSON.stringify(befehle));
p('… unter einer Elektro-Gruppe',
  befehle.every((b: any) => b.gruppe === 'Elektro'), JSON.stringify(befehle));
p('Und die Suche findet es',
  (await seite.evaluate(() => Register.befehle.suche('formelheft').length)) >= 1);

/* ==========================================================================
 * §9 · Am Telefon (§37)
 * ========================================================================*/
console.log('\n9 · Am Telefon');

await seite.evaluate(() => Formelheft.schliessen());
await seite.setViewportSize({ width: 390, height: 780 });
await seite.waitForTimeout(400);
await seite.evaluate(() => Formelheft.oeffne('grund'));
await seite.waitForTimeout(600);
const handy = (await seite.locator('.fh-fenster').boundingBox())!;
p('Es passt auf den Bildschirm',
  handy.x >= -1 && handy.x + handy.width <= 391 && handy.y + handy.height <= 781,
  `${Math.round(handy.width)}x${Math.round(handy.height)} bei ${Math.round(handy.x)},${Math.round(handy.y)}`);
p('Es nimmt die volle Breite', handy.width >= 386, `${Math.round(handy.width)}`);
p('Und sitzt unten, wo der Daumen ist',
  Math.abs((handy.y + handy.height) - 780) < 3, `${Math.round(handy.y + handy.height)}`);

/* §37 nennt 44 px, und die Zahl steht hier auch so. Beim ersten Lauf standen
   der Stern auf 43x27 und die Kapitelknöpfe auf 27 hoch — die Versuchung war,
   die Prüfung auf 30 zu setzen, damit sie grün wird. Eine Prüfung, die sich
   an das anpasst, was gerade da ist, misst nichts. */
const MINDEST = 44;
const zuKlein = await seite.evaluate((mindest: number) => {
  const raus: string[] = [];
  document.querySelectorAll<HTMLElement>('.fh-fenster button').forEach(b => {
    const r = b.getBoundingClientRect();
    if (!r.width || !r.height) return;                /* unsichtbar zählt nicht */
    if (r.height < mindest - 6) raus.push((b.textContent || b.className).slice(0, 18) +
      ' ' + Math.round(r.width) + 'x' + Math.round(r.height));
  });
  return raus;
}, MINDEST);
p('Jeder Knopf ist mit dem Finger zu treffen', zuKlein.length === 0,
  zuKlein.slice(0, 4).join(' · '));

/* Und die Zahlenfelder dürfen nicht abgeschnitten sein — der Fehler aus
   §55.1, bei dem eine gekürzte Zahl eine ANDERE Zahl zeigt. */
const abgeschnitten = await seite.evaluate(() => {
  const raus: string[] = [];
  document.querySelectorAll<HTMLElement>('.fh-fenster .fh-formel header b, ' +
    '.fh-fenster .fh-ergebnis').forEach(e => {
    if (e.scrollWidth > e.clientWidth + 1)
      raus.push((e.textContent || '').slice(0, 24) + ` (${e.scrollWidth}>${e.clientWidth})`);
  });
  return raus;
});
p('Keine Formel und kein Ergebnis wird abgeschnitten', abgeschnitten.length === 0,
  abgeschnitten.slice(0, 3).join(' · '));

/* ==========================================================================
 * §10 · Das Formeldreieck (Punkt 65)
 * ------------------------------------------------------------------------
 * Es wird nicht gezeichnet, sondern aus der SCHREIBWEISE gelesen. Damit gibt
 * es genau so viele Dreiecke wie dreiteilige Produktformeln — und keines für
 * eine Formel, die keines hat. Ein erfundenes Dreieck wäre eine Merkhilfe,
 * die falsch merkt.
 * ========================================================================*/
console.log('\n10 · Formeldreieck');

await seite.setViewportSize({ width: 1200, height: 860 });
await seite.evaluate(() => Formelheft.schliessen());
await seite.waitForTimeout(300);

const dreiecke = await seite.evaluate(() => {
  const L = Elektrolernbilder;
  return {
    alle: L.alleDreiecke().map((d: any) => `${d.oben}=${d.links}·${d.rechts}`),
    ausProdukt: L.ausSchreibweise('U = R · I'),
    ausBruch: L.ausSchreibweise('I = U / R'),
    keinDreieck: [
      L.ausSchreibweise('X_C = 1 / (2 · π · f · C)'),
      L.ausSchreibweise('P = U · I · cosφ'),
      L.ausSchreibweise('U = U'),
      L.ausSchreibweise(''),
      L.ausSchreibweise('R = R · R')
    ].filter(Boolean).length
  };
});
p('Es gibt Dreiecke', dreiecke.alle.length >= 4, dreiecke.alle.join('  '));
p('U = R · I ist dabei', dreiecke.alle.includes('U=R·I'), dreiecke.alle.join('  '));
p('P = U · I auch', dreiecke.alle.includes('P=U·I'));
p('Keine Doppelten', new Set(dreiecke.alle).size === dreiecke.alle.length);
/* `U = R · I` und `I = U / R` beschreiben DASSELBE Dreieck — oben U. Wer sie
   als zwei behandelt, zeigt dieselbe Merkhilfe zweimal mit anderer Spitze. */
p('Produkt und Bruch geben dieselbe Spitze',
  dreiecke.ausProdukt.oben === 'U' && dreiecke.ausBruch.oben === 'U',
  `${dreiecke.ausProdukt.oben} / ${dreiecke.ausBruch.oben}`);
p('Aus dem Dreieck lassen sich drei Formeln ablesen',
  dreiecke.ausProdukt.ablesbar.length === 3,
  JSON.stringify(dreiecke.ausProdukt.ablesbar));
p('… und sie stimmen',
  JSON.stringify(dreiecke.ausProdukt.ablesbar) ===
  JSON.stringify(['U = R · I', 'R = U / I', 'I = U / R']),
  JSON.stringify(dreiecke.ausProdukt.ablesbar));
/* Und die Gegenprobe: Formeln OHNE Dreieck bekommen keines. Ohne diese Zeile
   könnte `ausSchreibweise` alles annehmen und §10 wäre trotzdem grün. */
p('Formeln ohne Dreieck bekommen keines', dreiecke.keinDreieck === 0,
  `${dreiecke.keinDreieck} von 5 fälschlich angenommen`);

await seite.evaluate(() =>
  Elektroarbeitsplatz.zeigeAls('Formeldreieck', Elektrolernbilder.dreieckFlaeche()));
await seite.waitForTimeout(600);
p('Die Fläche steht', await seite.locator('.fd-dreieck').count() === 1);
p('Mit einem Knopf je Dreieck',
  await seite.locator('.fd-knopf').count() === dreiecke.alle.length,
  `${await seite.locator('.fd-knopf').count()}`);
p('Drei Grössen im Bild', await seite.locator('.fd-feld').count() === 3);

await seite.locator('.fd-feld').first().click();
await seite.waitForTimeout(300);
const zugehalten = await seite.locator('.fd-hinweis').innerText();
p('Eine Grösse zuhalten zeigt ihre Formel', /U = R · I/.test(zugehalten), zugehalten);
p('… und sie ist im Bild als verdeckt zu sehen',
  await seite.locator('.fd-feld.verdeckt').count() === 1);
await seite.locator('.fd-feld').nth(1).click();
await seite.waitForTimeout(300);
p('Eine andere zuhalten ergibt eine andere Formel',
  /R = U \/ I/.test(await seite.locator('.fd-hinweis').innerText()),
  await seite.locator('.fd-hinweis').innerText());

await seite.evaluate(() => document.querySelectorAll('.overlay').forEach(x => x.remove()));

/* ==========================================================================
 * §11 · Die Sinuskurve (Punkt 90)
 * ------------------------------------------------------------------------
 * Warum sind 230 V nicht 230 V. Die drei Zahlen müssen stimmen, sonst lernt
 * jemand den Zusammenhang falsch — und der zwischen Scheitel- und
 * Effektivwert ist der, nach dem in jeder Prüfung gefragt wird.
 * ========================================================================*/
console.log('\n11 · Sinuskurve');

const kurve = await seite.evaluate(() => {
  const L = Elektrolernbilder;
  return {
    bei0:   L.werte({ ueff: 230, f: 50, winkel: 0 }),
    bei45:  L.werte({ ueff: 230, f: 50, winkel: 45 }),
    bei90:  L.werte({ ueff: 230, f: 50, winkel: 90 }),
    bei270: L.werte({ ueff: 230, f: 50, winkel: 270 }),
    bei60Hz: L.werte({ ueff: 230, f: 60, winkel: 0 })
  };
});
const nahe = (a: number, b: number, t = 0.01) => Math.abs(a - b) <= t * Math.max(1, Math.abs(b));
p('Scheitelwert ist 230 · √2 = 325,27 V', nahe(kurve.bei0.scheitel, 230 * Math.SQRT2),
  `${kurve.bei0.scheitel.toFixed(2)}`);
p('Bei 0° ist der Momentanwert null', Math.abs(kurve.bei0.momentan) < 1e-9);
/* Bei 45° ist sin = 1/√2, und û/√2 ist genau der Effektivwert. Das ist kein
   Zufall, sondern die Definition — und ein schöner Prüfstein. */
p('Bei 45° liegt der Momentanwert genau auf dem Effektivwert',
  nahe(kurve.bei45.momentan, 230), `${kurve.bei45.momentan.toFixed(2)}`);
p('Bei 90° ist er der Scheitelwert',
  nahe(kurve.bei90.momentan, 230 * Math.SQRT2), `${kurve.bei90.momentan.toFixed(2)}`);
p('Bei 270° ist er negativ', kurve.bei270.momentan < -300,
  `${kurve.bei270.momentan.toFixed(2)}`);
p('Periodendauer bei 50 Hz ist 20 ms', nahe(kurve.bei0.periode, 0.02),
  `${(kurve.bei0.periode * 1000).toFixed(2)} ms`);
p('Bei 60 Hz sind es 16,67 ms', nahe(kurve.bei60Hz.periode, 1 / 60),
  `${(kurve.bei60Hz.periode * 1000).toFixed(2)} ms`);

await seite.evaluate(() =>
  Elektroarbeitsplatz.zeigeAls('Sinuskurve', Elektrolernbilder.sinusFlaeche()));
await seite.waitForTimeout(600);
p('Die Kurve steht', await seite.locator('.sk-kurve').count() === 1);
p('Mit Scheitel- und Effektivwertlinie',
  await seite.locator('.sk-scheitel').count() >= 1 &&
  await seite.locator('.sk-effektiv').count() >= 2);
p('Und fünf Zahlen darunter', await seite.locator('.sk-zahl').count() === 5,
  `${await seite.locator('.sk-zahl').count()}`);

/* Nichts darf aus der Zeichnung ragen. Die Beschriftung „û 325.3" steht
   rechtsbündig am linken Rand — bei zu schmalem Rand war sie angeschnitten. */
const ragtRaus = await seite.evaluate(() => {
  const svg = document.querySelector('.sk-kurve') as SVGSVGElement;
  const rs = svg.getBoundingClientRect();
  const raus: string[] = [];
  svg.querySelectorAll<SVGTextElement>('.sk-mass, .sk-grad, .sk-jetzt').forEach(t => {
    const r = t.getBoundingClientRect();
    if (r.left < rs.left - 0.5 || r.right > rs.right + 0.5)
      raus.push(`"${t.textContent}"`);
  });
  return raus;
});
p('Keine Beschriftung ragt aus der Zeichnung', ragtRaus.length === 0,
  ragtRaus.join(' · '));

/* Der Schieber muss wirken — sonst ist die Kurve ein Bild. */
const vorher90 = await seite.locator('.sk-zahl b').nth(2).innerText();
await seite.locator('.sk-winkel').fill('90');
await seite.dispatchEvent('.sk-winkel', 'input');
await seite.waitForTimeout(300);
const nachher90 = await seite.locator('.sk-zahl b').nth(2).innerText();
p('Der Schieber ändert den Momentanwert', vorher90 !== nachher90,
  `${vorher90} → ${nachher90}`);
p('… und er trifft den Scheitelwert', /325/.test(nachher90), nachher90);
p('Der Scheitelwert selbst bleibt',
  /325/.test(await seite.locator('.sk-zahl b').first().innerText()));

/* Ein anderer Effektivwert ändert alles Übrige mit. */
await seite.locator('.sk-ueff').fill('400');
await seite.dispatchEvent('.sk-ueff', 'input');
await seite.waitForTimeout(300);
p('Ein anderer Effektivwert ändert den Scheitel',
  /565/.test(await seite.locator('.sk-zahl b').first().innerText()),
  await seite.locator('.sk-zahl b').first().innerText());

await seite.evaluate(() => document.querySelectorAll('.overlay').forEach(x => x.remove()));

/* ==========================================================================
 * §12 · Den gesuchten Wert im Plan markieren (Punkt 80)
 * ========================================================================*/
console.log('\n12 · Gesucht im Plan');

const markiert = await seite.evaluate(() => {
  const plan = Schaltplan.neuerPlan('stromlauf-aufgeloest');
  plan.teile = [
    { id: 'a', zeichen: 'widerstand', x: 40, y: 40, drehung: 0, gespiegelt: false,
      bmk: 'R1', nummern: {}, gruppe: '', ebene: 'plan' },
    { id: 'b', zeichen: 'widerstand', x: 160, y: 40, drehung: 0, gespiegelt: false,
      bmk: 'R2', nummern: {}, gruppe: '', ebene: 'plan' }
  ];
  plan.leitungen = [];
  const ohne = Schaltplan.alsSvg(plan, {});
  const mit = Schaltplan.alsSvg(plan, { hervor: 'b' });
  return {
    ohne: (ohne.match(/sp-gesucht/g) || []).length,
    mit: (mit.match(/sp-gesucht/g) || []).length,
    /* Und es muss das RICHTIGE sein. */
    amRichtigen: /data-id="b"/.test(mit.split('sp-gesucht')[1]?.slice(0, 60) || '')
  };
});
p('Ohne Angabe ist nichts markiert', markiert.ohne === 0);
p('Mit Angabe genau eines', markiert.mit === 1, `${markiert.mit}`);
p('… und zwar das genannte', markiert.amRichtigen);

p('Keine Fehler auf der Seite', fehler.length === 0, fehler.join(' · '));

/* ==========================================================================
 * §13 · Jede Formel rechnet hin und zurück
 * --------------------------------------------------------------------------
 * Eine Formelsammlung im Code hat einen Vorteil gegenüber einem gescannten
 * Heft: man kann sie NACHRECHNEN. Also wird sie nachgerechnet.
 *
 * Für jede Formel werden Werte eingesetzt, nach jeder Grösse aufgelöst, und
 * mit dem Ergebnis rückwärts wieder auf eine der eingesetzten Grössen
 * gerechnet. Kommt dabei nicht heraus, was hineinging, ist eine der
 * Umstellungen falsch — und das sieht man einer Formelzeile nicht an.
 *
 * WAS DIESE PRÜFUNG BEIM ERSTEN LAUF FAND: bei vier Formeln fehlten
 * Umstellungen ganz — `leuchtenzahl` liess sich nicht nach dem
 * Planungsfaktor auflösen, `abstandsgesetz` nicht nach dem ersten Abstand,
 * `kompensation-q` nach keinem der beiden Tangenswerte, `kompensation-c`
 * nicht nach der Frequenz. Wer danach fragte, bekam nichts.
 *
 * UND EIN FEHLER IN DER PRÜFUNG SELBST, der hierher gehört: die ersten
 * Testwerte waren 2, 3,7, 5,4 der Reihe nach. Bei Z = √(R²+X²) hiess das
 * Z kleiner als R, und √(Z²−R²) war zu Recht NaN. Die Meldung sagte etwas
 * über die Testwerte und nichts über die Formel. Jetzt wird die erste
 * Grösse — das Ergebnis — aus den übrigen GERECHNET statt gesetzt.
 * ========================================================================*/
console.log('\n13 · Jede Formel rechnet hin und zurück');

const rundlauf = await seite.evaluate(() => {
  const F = Register.elektroformeln;
  const alle = F.alle();
  const schlecht: string[] = [];
  let umstellungen = 0;
  /* Naturkonstanten müssen nicht auflösbar sein — nach der Erdbeschleunigung
     oder der elektrischen Feldkonstanten fragt niemand. */
  const KONSTANT = ['g', 'ε₀', 'μ₀'];

  for (const f of alle as any[]) {
    /* Grössen, nach denen die Formel selbst sagt, dass sie nicht eindeutig
       auflösbar ist — dann muss sie es auch begründen. */
    const MEHRDEUTIG: string[] = f.mehrdeutig || [];
    const zeichen = f.groessen.map((x: any) => x.zeichen);
    umstellungen += Object.keys(f.loese || {}).length;
    for (const z of zeichen)
      if (!f.loese[z] && !KONSTANT.includes(z) && !MEHRDEUTIG.includes(z))
        schlecht.push(`${f.id}: ${z} nicht auflösbar`);
    if (MEHRDEUTIG.length && !f.annahme)
      schlecht.push(`${f.id}: mehrdeutig, aber ohne Begründung`);

    /* MEHRERE WERTESÄTZE PROBIEREN, den ersten nehmen, der geht.
       Bei P = √(S²−Q²) muss S grösser als Q sein; steigende Werte der Reihe
       nach verletzen das, und die Meldung sagte dann etwas über die
       Testwerte statt über die Formel. */
    const SAETZE = [
      (i: number) => 2 + i * 1.7,
      (i: number) => 9 - i * 1.7,
      (i: number) => 3 + i * 0.3,
      (i: number) => 12 - i * 0.9
    ];
    let werte: Record<string, number> | null = null;
    for (const satz of SAETZE) {
      const w: Record<string, number> = {};
      zeichen.slice(1).forEach((z: string, i: number) => { w[z] = satz(i); });
      let erste: number;
      try { erste = f.loese[zeichen[0]] ? f.loese[zeichen[0]](w) : NaN; }
      catch { erste = NaN; }
      if (!Number.isFinite(erste) || erste === 0) continue;
      w[zeichen[0]] = erste;
      werte = w; break;
    }
    if (!werte) { schlecht.push(`${f.id}: kein Wertesatz geht`); continue; }

    for (const ziel of zeichen) {
      if (KONSTANT.includes(ziel) || MEHRDEUTIG.includes(ziel)) continue;
      const rest: Record<string, number> = {};
      zeichen.forEach((z: string) => { if (z !== ziel) rest[z] = werte[z]!; });
      let e: number;
      try { e = f.loese[ziel](rest); } catch { schlecht.push(`${f.id}/${ziel}: wirft`); continue; }
      if (!Number.isFinite(e)) { schlecht.push(`${f.id}/${ziel}: ${e}`); continue; }
      for (const zweit of zeichen) {
        if (zweit === ziel || KONSTANT.includes(zweit) || MEHRDEUTIG.includes(zweit)) continue;
        const r2: Record<string, number> = { ...rest };
        r2[ziel] = e; delete r2[zweit];
        let e2: number;
        try { e2 = f.loese[zweit](r2); } catch { continue; }
        if (!Number.isFinite(e2)) { schlecht.push(`${f.id}: ${ziel}→${zweit} gibt ${e2}`); continue; }
        const soll = werte[zweit]!;
        if (Math.abs(e2 - soll) > Math.abs(soll) * 1e-6 + 1e-9)
          schlecht.push(`${f.id}: ${ziel}→${zweit} ${e2.toPrecision(6)} statt ${soll}`);
      }
    }
  }
  return { formeln: alle.length, umstellungen, schlecht: [...new Set(schlecht)] };
});

const nichtLoesbar = rundlauf.schlecht.filter(
  (x: string) => /nicht auflösbar|ohne Begründung/.test(x));
p('Jede Grösse ist auflösbar — oder sagt begründet, warum nicht',
  !nichtLoesbar.length, nichtLoesbar.slice(0, 3).join(' | '));
p('Und jede Umstellung rechnet hin und zurück dasselbe',
  !rundlauf.schlecht.length, rundlauf.schlecht.slice(0, 3).join(' | '));
p('Es sind auch wirklich viele', rundlauf.umstellungen >= 250,
  `${rundlauf.formeln} Formeln, ${rundlauf.umstellungen} Umstellungen`);

console.log(`\n${ok} bestanden, ${weg} gescheitert`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
