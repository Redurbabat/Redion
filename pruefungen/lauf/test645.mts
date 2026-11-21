/* test645 — Jede Blockart, die eine KI anlegen darf, bringt die Seite nicht
 * zum Absturz (Redur, 21. November 2026: „es sollte alles machen kann
 * wirklich alles").
 *
 * redion_add_block (server/mcp/cloud-tools.ts) legt JEDE Blockart aus
 * Register.bloecke an, mit Datenfeldern, die von aussen kommen. Was eine KI
 * schreibt, kann leer, unvollständig oder schlicht falsch sein. §18: der
 * Editor darf daran nicht sterben — eine Seite, die beim Öffnen abstürzt,
 * ist für den Nutzer verlorene Arbeit.
 *
 *  §1  Der Katalog der Blockarten ist aus dem Register erzeugt und aktuell.
 *  §2  Jede anlegbare Art mit LEEREN Daten: die Seite öffnet, kein Fehler.
 *  §3  Jede anlegbare Art mit FALSCHEN Daten (Zahl statt Liste, Text statt
 *      Objekt, null, verschachtelter Unsinn in den üblichen Feldnamen):
 *      die Seite öffnet, kein Fehler, die anderen Blöcke stehen noch da.
 *
 * Läuft über file://, ohne Port (test400).
 */
import { chromium } from 'playwright';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { BLOCKARTEN } from '../../server/mcp/blockarten-katalog.ts';

const WURZEL = path.resolve(import.meta.dirname, '../..');
let ok = 0, bad = 0;
const pruef = (n: string, gut: boolean, info = '') => {
  console.log((gut ? '✅ ' : '❌ ') + n + (gut ? '' : '  ' + info));
  gut ? ok++ : bad++;
};

console.log('§1 Katalog');
let aktuell = true;
try { execFileSync(process.execPath, [path.join(WURZEL, 'server/mcp/blockarten-katalog.mts'), '--pruefen'], { stdio: 'pipe' }); }
catch { aktuell = false; }
pruef('§1 blockarten-katalog.ts ist aus dem Register erzeugt und aktuell', aktuell);
const ARTEN = BLOCKARTEN.filter(b => !/^(a-|ai-|db-)/.test(b.id) && b.id !== 'page').map(b => b.id);
pruef('§1 Es gibt anlegbare Arten', ARTEN.length > 30, String(ARTEN.length));

/* Unsinn in den Feldnamen, die Blockarten wirklich benutzen. */
const UNSINN = { plan: 'kaputt', mappe: 5, blaetter: 'x', elemente: { a: 1 }, shapes: 'nein', knoten: 7, kanten: 'x',
  karten: null, url: 12345, src: { x: 1 }, lang: ['ts'], checked: 'vielleicht', spalten: 'drei', daten: [1, [2, [3]]],
  html: 12, formel: { tief: { tiefer: [] } }, chart: 'balken', reihen: 'x', ink: 'strich', icon: 99, zellen: 'x',
  vorne: { a: 1 }, hinten: [null], frage: 7, antwort: { x: [] }, sr: 'x', bild: 1, datei: 'x', dateiId: 7, quelle: [] };

const browser = await chromium.launch();
try {
  for (const [abschnitt, extra] of [['§2 leer', {}], ['§3 falsch', UNSINN]] as const) {
    console.log('\n' + abschnitt);
    const p = await browser.newPage();
    const fehler: string[] = [];
    p.on('pageerror', e => fehler.push(e.message));
    await p.goto(pathToFileURL(path.join(WURZEL, 'index.html')).href);
    await p.waitForFunction(() => typeof App !== 'undefined' && typeof App.oeffne === 'function' && typeof Store !== 'undefined', null, { timeout: 30000 });
    await p.waitForTimeout(800);
    const ergebnis = await p.evaluate(async ({ arten, extra }: { arten: string[]; extra: Record<string, unknown> }) => {
      const S = Store, A = App;
      const zeit = new Date().toISOString();
      const roh = (id: string, type: string, parentId: string | null, mehr: Record<string, unknown> = {}) =>
        S.rohSetzen('blocks', { id, type, text: type === 'text' ? 'Anker' : 'KI ' + type, content: [], parentId,
          parentTable: 'block', color: '', created: zeit, edited: zeit, erstelltVon: 'ChatGPT', alive: true, ...mehr });
      const absturz: string[] = [];
      const fehlt: string[] = [];
      for (const art of arten) {
        const seite = 'p645_' + art;
        roh(seite, 'page', null, { content: ['a645_' + art, 'b645_' + art, 'z645_' + art], icon: '📄' });
        roh('a645_' + art, 'text', seite);
        roh('b645_' + art, art, seite, JSON.parse(JSON.stringify(extra)));
        roh('z645_' + art, 'text', seite, { text: 'Ende' });
        try { A.oeffne(seite); await new Promise(r => setTimeout(r, 30)); }
        catch (e) { absturz.push(art + ': ' + (e as Error).message); continue; }
        /* Steht der Block danach noch da, und der Text darunter auch? */
        const da = !!document.querySelector('[data-bid="z645_' + art + '"]');
        if (!da) fehlt.push(art);
      }
      return { absturz, fehlt };
    }, { arten: ARTEN, extra });
    await p.waitForTimeout(500);
    pruef(abschnitt + ': keine Art wirft beim Öffnen der Seite', ergebnis.absturz.length === 0, ergebnis.absturz.join(' | '));
    pruef(abschnitt + ': der Block danach steht noch auf der Seite', ergebnis.fehlt.length === 0, ergebnis.fehlt.join(', '));
    pruef(abschnitt + ': keine Seitenfehler', fehler.length === 0, [...new Set(fehler)].slice(0, 6).join(' | '));
    await p.close();
  }
} finally {
  await browser.close();
}
console.log(`\n${ok} grün, ${bad} rot`);
process.exit(bad ? 1 : 0);
