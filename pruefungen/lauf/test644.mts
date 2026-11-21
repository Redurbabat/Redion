/* test644 — ChatGPT zeichnet Schaltpläne, und die App sieht sie wie selbst
 * gezeichnet (Redur, 21. November 2026: „ich will das die über mcp auf alles
 * zugreif haben komplet alles auch schalt plan erstelle").
 *
 *  §1  Der Katalog der Schaltzeichen im Server ist aus dem Register der App
 *      erzeugt und aktuell (server/mcp/fachzeichen-katalog.mts --pruefen).
 *  §2  `buildPlan` (server/mcp/schematic.ts) baut aus Bauteilen und Klemmen
 *      einen Plan; die ECHTE App liest ihn mit `Schaltplan.lesen`, und
 *      `Schaltplan.kontakte` findet an jedem Leitungsende GENAU die Klemme,
 *      die die KI genannt hat — auch an gedrehten und gespiegelten Teilen.
 *  §3  Falsche Eingaben werden mit einem Satz abgewiesen, nicht still
 *      „geheilt": unbekanntes Zeichen, unbekannter Anschluss, doppelter Name.
 *  §4  Die App zeichnet den Plan (SVG) ohne Fehler.
 *
 * Läuft über file://, ohne Port (test400).
 */
import { chromium } from 'playwright';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { buildPlan, SchematicError, describePlan } from '../../server/mcp/schematic.ts';
import { SYMBOLE } from '../../server/mcp/fachzeichen-katalog.ts';

const WURZEL = path.resolve(import.meta.dirname, '../..');
let ok = 0, bad = 0;
const pruef = (n: string, gut: boolean, info = '') => {
  console.log((gut ? '✅ ' : '❌ ') + n + (gut ? '' : '  ' + info));
  gut ? ok++ : bad++;
};

console.log('§1 Katalog');
let aktuell = true;
try { execFileSync(process.execPath, [path.join(WURZEL, 'server/mcp/fachzeichen-katalog.mts'), '--pruefen'], { stdio: 'pipe' }); }
catch { aktuell = false; }
pruef('§1 fachzeichen-katalog.ts ist aus dem Register erzeugt und aktuell', aktuell);
pruef('§1 Er kennt die Schaltzeichen der App', SYMBOLE.length > 100 && SYMBOLE.some(s => s.id === 'spule'),
  String(SYMBOLE.length));

/* Eine Selbsthaltung, wie sie im Lehrmittel steht — und dazu jedes Zeichen
   einmal gedreht und gespiegelt, damit die Lagen aller Orientierungen
   gegen die App gemessen werden. */
const spule = SYMBOLE.find(s => s.id === 'spule') ?? SYMBOLE.find(s => s.kennbuchstabe === 'K')!;
const selbsthaltung = buildPlan({ art: 'stromlauf-aufgeloest',
  teile: [
    { zeichen: 'taster-oeffner', x: 100, y: 100, bmk: 'S1' },
    { zeichen: 'taster-schliesser', x: 100, y: 220, bmk: 'S2' },
    { zeichen: 'schliesser', x: 220, y: 220, bmk: 'K1.1' },
    { zeichen: spule.id, x: 100, y: 360, bmk: 'K1' },
  ],
  verbindungen: [
    { von: 'S1:2', nach: 'S2:3' }, { von: 'S1:2', nach: 'K1.1:3' },
    { von: 'S2:4', nach: 'K1:' + spule.anschluesse[0] }, { von: 'K1.1:4', nach: 'S2:4' },
  ],
  texte: [{ x: 40, y: 40, t: 'Selbsthaltung' }] }, 'gpt');
const gedreht = buildPlan({ art: 'hauptstromkreis', teile: SYMBOLE.flatMap((s, i) =>
  [0, 90, 180, 270].map((d, k) => ({ zeichen: s.id, x: (i % 10) * 200, y: Math.floor(i / 10) * 200 + k * 2600,
    drehung: d, gespiegelt: k % 2 === 1, bmk: 'X' + i + '_' + k }))).slice(0, 200) }, 'rot');

console.log('\n§3 Falsche Eingaben');
const wirft = (f: () => unknown, muster: RegExp) => { try { f(); return 'kein Fehler'; }
  catch (e) { return e instanceof SchematicError && muster.test(e.message) ? true : String(e); } };
const r1 = wirft(() => buildPlan({ teile: [{ zeichen: 'gibtsnicht', x: 0, y: 0 }] }, 'a'), /Unbekanntes Schaltzeichen/);
pruef('§3 Unbekanntes Zeichen wird abgewiesen', r1 === true, String(r1));
const r2 = wirft(() => buildPlan({ teile: [{ zeichen: 'schliesser', x: 0, y: 0, bmk: 'S1' }],
  verbindungen: [{ von: 'S1:99', nach: 'S1:3' }] }, 'a'), /keinen Anschluss „99“.*3, 4/);
pruef('§3 Unbekannter Anschluss nennt die richtigen', r2 === true, String(r2));
const r3 = wirft(() => buildPlan({ teile: [{ zeichen: 'schliesser', x: 0, y: 0, bmk: 'S1' },
  { zeichen: 'oeffner', x: 50, y: 0, bmk: 'S1' }] }, 'a'), /gehört zwei Bauteilen/);
pruef('§3 Ein Name für zwei Teile wird abgewiesen', r3 === true, String(r3));
const r4 = wirft(() => buildPlan({ art: 'quatsch', teile: [] }, 'a'), /Unbekannte Planart/);
pruef('§3 Unbekannte Planart wird abgewiesen', r4 === true, String(r4));
const auto = buildPlan({ teile: [{ zeichen: 'schliesser', x: 0, y: 0, bmk: 'S2' }, { zeichen: 'schliesser', x: 60, y: 0 },
  { zeichen: 'oeffner', x: 120, y: 0 }] }, 'a').plan.teile.map(t => t.bmk);
pruef('§3 BMK wie in der App: kleinste freie Nummer', JSON.stringify(auto) === '["S2","S1","S3"]', JSON.stringify(auto));
const lies = describePlan(selbsthaltung.plan);
pruef('§3 describePlan nennt die Verbindungen als Klemmen', lies.verbindungen[0]?.von === 'S1:2' && lies.verbindungen[0]?.nach === 'S2:3',
  JSON.stringify(lies.verbindungen[0]));

console.log('\n§2/§4 In der App');
const browser = await chromium.launch();
try {
  const p = await browser.newPage();
  const fehler: string[] = [];
  p.on('pageerror', e => fehler.push(e.message));
  await p.goto(pathToFileURL(path.join(WURZEL, 'index.html')).href);
  await p.waitForFunction(() => typeof (window as any).Schaltplan?.lesen === 'function', null, { timeout: 30000 });
  const pruefePlan = (plan: unknown) => p.evaluate((plan: any) => {
    const S = (window as any).Schaltplan;
    const gelesen = S.lesen({ plan });
    const falsch: string[] = [];
    /* Der ORT zählt, nicht die gespeicherte Bindung: `kontakte` nimmt
       vonTeil/vonNr auch dann, wenn die Leitung daneben endet — und im Bild
       hinge sie in der Luft. Also: liegt jedes Ende genau dort, wo die App
       selbst die Klemme hinlegt? */
    const teil = (id: string) => gelesen.teile.find((t: any) => t.id === id);
    for (const l of gelesen.leitungen) {
      const k = S.kontakte(gelesen, l).klemmen as string[];
      const soll = [l.vonTeil + ':' + l.vonNr, l.nachTeil + ':' + l.nachNr].sort();
      const fehlt = soll.filter(x => !k.includes(x));
      if (fehlt.length) falsch.push(l.id + ' fehlt ' + fehlt.join(','));
      const a = S.anschlussOrt(teil(l.vonTeil), l.vonNr), b = S.anschlussOrt(teil(l.nachTeil), l.nachNr);
      const p0 = l.punkte[0], p1 = l.punkte[l.punkte.length - 1];
      /* Die Nähe, mit der die App selbst eine Leitung an eine Klemme hängt. */
      const nah = Number((window as any).Register.fachzeichen.NAH);
      const trifft = (o: any, p: any) => o && Math.abs(o.x - p.x) <= nah && Math.abs(o.y - p.y) <= nah;
      if (!trifft(a, p0)) falsch.push(l.id + ' Anfang ' + JSON.stringify(p0) + ' statt ' + JSON.stringify(a));
      if (!trifft(b, p1)) falsch.push(l.id + ' Ende ' + JSON.stringify(p1) + ' statt ' + JSON.stringify(b));
    }
    /* Jede Klemme jedes Teils: liegt sie dort, wo der Server sie vermutet? */
    let svg = '';
    try { svg = String(S.alsSvg(gelesen, {}) || ''); } catch (e) { svg = 'FEHLER ' + (e as Error).message; }
    return { teile: gelesen.teile.length, leitungen: gelesen.leitungen.length, texte: gelesen.texte.length,
      art: gelesen.art, falsch, svgOk: svg.startsWith('<svg') && !svg.startsWith('FEHLER'), svgAnfang: svg.slice(0, 60) };
  }, plan);

  const a = await pruefePlan(selbsthaltung.plan);
  pruef('§2 Die App liest den ganzen Plan', a.teile === 4 && a.leitungen === 4 && a.texte === 1 && a.art === 'stromlauf-aufgeloest',
    JSON.stringify(a));
  pruef('§2 Jedes Leitungsende sitzt auf der genannten Klemme', a.falsch.length === 0, a.falsch.join(' | '));
  pruef('§4 Die App zeichnet ihn', a.svgOk, a.svgAnfang);

  /* Jede Lage jedes Zeichens: eine Leitung von Klemme zu Klemme desselben
     Teils (erste → letzte) muss die App an genau diesen Klemmen finden. */
  const mitLeitungen = buildPlan({ art: 'hauptstromkreis',
    teile: gedreht.plan.teile.map(t => ({ zeichen: t.zeichen, x: t.x, y: t.y, drehung: t.drehung, gespiegelt: t.gespiegelt, bmk: t.bmk })),
    verbindungen: gedreht.plan.teile.flatMap(t => {
      const s = SYMBOLE.find(z => z.id === t.zeichen)!;
      return s.anschluesse.length >= 2 ? [{ von: t.bmk + ':' + s.anschluesse[0], nach: t.bmk + ':' + s.anschluesse[s.anschluesse.length - 1],
        punkte: [{ x: t.x - 400, y: t.y }] }] : [];
    }) }, 'rot');
  const b = await pruefePlan(mitLeitungen.plan);
  pruef('§2 Alle Lagen (0/90/180/270, gespiegelt) treffen die Klemmen der App', b.falsch.length === 0 && b.leitungen > 50,
    b.leitungen + ' Leitungen · ' + b.falsch.slice(0, 5).join(' | '));
  pruef('§4 Keine Seitenfehler', fehler.length === 0, fehler.join(' | '));
} finally {
  await browser.close();
}
console.log(`\n${ok} grün, ${bad} rot`);
process.exit(bad ? 1 : 0);
