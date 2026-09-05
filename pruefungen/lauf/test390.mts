/* Suite 390 — Die Leiste zeigt, wo man WIRKLICH ist (E393)
 * ============================================================================
 * GEMESSEN AM 4. SEPTEMBER 2026, an der Leiste, die E388 gebaut hat. Von den
 * fünf Hauptwegen markierte sie ZWEI richtig:
 *
 *   Ort              App.schauplatz()  Adresse                     markiert
 *   Heute            heute             #welt-lernen-heute          Heute    ✓
 *   Lernzentrum      heute             #welt-lernen-lernen         Heute    ✗
 *   Elektrotechnik   elektro           #elektro                    Elektro  ✓
 *   Bibliothek       workspace         #welt-workspace-bibliothek  keiner   ✗
 *   Aufgaben         workspace         #welt-workspace-aufgaben    keiner   ✗
 *
 * DER GRUND: `App.schauplatz()` bildet den TITEL der Sonderansicht ab, und
 * drei der fünf teilen ihren Titel mit einem Nachbarn. Auf „Lernzentrum"
 * leuchtete deshalb „Heute" — falsch ist schlimmer als leer, weil es an
 * einen Ort zeigt, an dem man nicht steht.
 *
 * Die ADRESSE unterscheidet sie. Sie steht als `adresse` im Register neben
 * `schauplatz`, und dass sie dort steht, ist eine Kopplung: wer den Weg in
 * der Lernwelt umbenennt, muss sie nachziehen. GENAU DAFÜR IST §1 DA — es
 * klickt die fünf Knöpfe wirklich an, statt das Register mit sich selbst zu
 * vergleichen.
 *
 *   §1 Jeder der fünf Orte markiert sich selbst — und nur sich.
 *   §2 Wo keiner der fünf gilt, leuchtet keiner (die Gegenprobe).
 *   §3 Kein Ziel steht zweimal in der Lade.
 *   §4 Von den zwei Zeitmessern bleibt der mit dem brauchbaren Hinweis.
 *
 *   node pruefungen/lauf/test390.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import type { Browser, Page } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9413;
const TYP: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.json': 'application/json',
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

const browser: Browser = await chromium.launch();
const frisch = async (): Promise<Page> => {
  const s = await browser.newPage({ viewport: { width: 1360, height: 900 } });
  await s.goto(`http://localhost:${PORT}/index.html`, { waitUntil: 'load' });
  await s.waitForFunction(`typeof App === 'object' && typeof Register === 'object'`,
                          null, { timeout: 20000 });
  await s.waitForSelector('#kante .k-orte', { timeout: 15000 });
  await s.waitForTimeout(500);
  /* Der Willkommensrundgang fängt sonst jeden Klick ab. */
  await s.evaluate(`document.getElementById('rg-willkommen')?.remove()`);
  return s;
};

/** Welche Ortsknöpfe gerade leuchten. */
const MARKIERT = `[...document.querySelectorAll('#kante .k-orte .k-knopf')]
  .filter(b => b.classList.contains('ist-hier')).map(b => b.dataset.k)`;

/* ==========================================================================
 * §1 · Jeder der fünf Orte markiert sich selbst — und nur sich
 * ========================================================================*/
console.log('\n1 · Wo man steht, leuchtet auch');
const FUENF = ['heute', 'lernzentrum', 'elektro', 'bibliothekOben', 'aufgaben'];
for (const id of FUENF) {
  const s = await frisch();
  await s.evaluate(`document.querySelector('#kante .k-orte .k-knopf[data-k=${JSON.stringify(id)}]')?.click()`);
  await s.waitForTimeout(1300);
  const m = await s.evaluate(MARKIERT) as string[];
  gleich(`„${id}" markiert genau sich selbst`, m, [id]);
  await s.close();
}

/* ==========================================================================
 * §2 · Die Gegenprobe — wo keiner der fünf gilt, leuchtet keiner
 * --------------------------------------------------------------------------
 * OHNE DIESEN ABSCHNITT WÄRE §1 WERTLOS. Eine Leiste, die immer irgendwo
 * leuchtet, sagt nichts (§55.1) — und die einfachste falsche Lösung wäre
 * gewesen, sich den zuletzt geklickten Knopf zu merken. Der bliebe dann
 * auch auf einer offenen Seite stehen.
 * ========================================================================*/
console.log('\n2 · Anderswo leuchtet keiner');
{
  const s = await frisch();
  await s.evaluate(`document.querySelector('#kante .k-orte .k-knopf[data-k="heute"]')?.click()`);
  await s.waitForTimeout(1000);
  gleich('Erst steht „Heute" an', await s.evaluate(MARKIERT), ['heute']);
  /* Und jetzt auf eine gewöhnliche Seite. */
  await s.evaluate(`App.neueSeite()`);
  await s.waitForTimeout(1300);
  gleich('Auf einer Seite leuchtet nichts mehr', await s.evaluate(MARKIERT), []);
  await s.close();
}

/* ==========================================================================
 * §3 · Kein Ziel steht zweimal in der Lade
 * --------------------------------------------------------------------------
 * „Zeitmesser" stand zweimal: einmal als `w-zeit` aus der eigenen Liste des
 * Bandes, einmal als `zeitmesser` aus `Register.module`. Beide riefen
 * `Zeitmesser.panel()`; gemessen öffneten beide dasselbe Feld von 280 × 226
 * Pixeln. Geprüft wird auf DOPPELTE NAMEN, nicht auf diesen einen — eine
 * Prüfung, die nur „Zeitmesser" kennt, findet die nächste Dublette nicht.
 * ========================================================================*/
console.log('\n3 · Jedes Ziel genau einmal');
{
  const s = await frisch();
  const band = await s.evaluate(`(() => {
    const namen = [], ids = [];
    for (const g of (Register.menueband.orte() || []))
      for (const e of (g.eintraege || [])) { namen.push(String(e.name || e.id)); ids.push(String(e.id)); }
    const doppeltName = [...new Set(namen.filter((n, i) => namen.indexOf(n) !== i))];
    const doppeltId = [...new Set(ids.filter((n, i) => ids.indexOf(n) !== i))];
    return { anzahl: ids.length, doppeltName, doppeltId, ids };
  })()`) as { anzahl: number; doppeltName: string[]; doppeltId: string[]; ids: string[] };
  gleich('Kein Name zweimal', band.doppeltName, []);
  gleich('Keine Kennung zweimal', band.doppeltId, []);
  p('Und die Liste lebt weiter — über vierzig Ziele', band.anzahl > 40, String(band.anzahl));

  /* Und wirklich in der Lade, nicht nur im Register. */
  await s.click('.k-knopf[data-k="mehr-orte"]');
  await s.waitForTimeout(700);
  const inLade = await s.evaluate(
    `[...document.querySelectorAll('#kanten-lade .kl-zeile b')].map(b => b.textContent.trim())`) as string[];
  gleich('„Zeitmesser" steht genau einmal in der Lade',
    inLade.filter(n => n === 'Zeitmesser').length, 1);
  await s.close();
}

/* ==========================================================================
 * §4 · Es bleibt der Zeitmesser mit dem brauchbaren Hinweis
 * --------------------------------------------------------------------------
 * Von zwei gleichen Einträgen einen wegzunehmen ist die halbe Arbeit; WELCHER
 * bleibt, ist die andere. `w-zeit` sagt, worauf sich die Uhr bezieht; der
 * Eintrag aus `Register.module` nennt statt dessen die Entscheidungsnummer,
 * aus der er stammt. Das gehört nicht in eine Liste, die ein Mensch liest.
 * ========================================================================*/
console.log('\n4 · Und zwar der mit dem Satz, der etwas sagt');
{
  const s = await frisch();
  /* ALLE einsammeln, nicht den ersten nehmen. Ein `find` hätte hier immer
     `w-zeit` gemeldet, weil „Planung & Lernen" vor „Weiteres" steht — die
     Zeile wäre auch dann grün gewesen, wenn beide dastünden. Gemessen: mit
     dem falschen Zwilling wird sie rot. */
  const alle = await s.evaluate(`(() => {
    const raus = [];
    for (const g of (Register.menueband.orte() || []))
      for (const e of (g.eintraege || []))
        if (String(e.name) === 'Zeitmesser') raus.push({ id: String(e.id), hinweis: String(e.hinweis || '') });
    return raus;
  })()`) as Array<{ id: string; hinweis: string }>;
  gleich('Genau ein Zeitmesser, und zwar `w-zeit`', alle.map(x => x.id), ['w-zeit']);
  p('… und sein Hinweis nennt den Bezug, nicht die Entscheidungsnummer',
    alle.length === 1 && !!alle[0] && alle[0].hinweis.includes('offenen Seite')
      && !/E\d{2,3}/.test(alle[0].hinweis),
    alle.map(x => x.hinweis).join(' | ') || 'kein Zeitmesser gefunden');
  await s.close();
}

await browser.close();
server.close();
console.log(`\n${ok} von ${ok + weg} Prüfungen grün`);
process.exit(weg ? 1 : 0);
