/* Suite 215 — Was Bedeutung trägt, muss man lesen können (§38, E230)
 * ============================================================================
 * §38 verlangt: „Kontrast im Hell- und Dunkelmodus prüfen." Geprüft wurde er
 * bisher an einzelnen Stellen — an der ⋯-Zeile, an den Pillen, an der Suche.
 * Diese Suite fragt es für ALLE Produktwelten auf einmal, in BEIDEN Themen,
 * und zwar mit der WCAG-Formel statt nach Augenmass.
 *
 * ─── WOHER SIE KOMMT ───────────────────────────────────────────────────────
 *
 * `--text-faint` steht in `dunkel.css` mit einem Kommentar, der die Absicht
 * genau benennt: „3.9:1 — nur Beiwerk und Symbole". Die Absicht ist richtig
 * und die Zahl bewusst unter AA.
 *
 * Nachgemessen lagen elf Stellen darunter, und sieben davon waren kein
 * Beiwerk: der Platzhalter der Suche, das Versprechen „Alles bleibt auf
 * diesem Gerät.", die Überschrift „Privat" über den eigenen Seiten, die vier
 * Zeilen, die sagen was die Zahl darüber BEDEUTET, dazu in der Planung die
 * Datumsangaben und die Abschnittsüberschrift „Bevorstehend".
 *
 * Das Token blieb. Die sieben Stellen bekamen `--text-dim`.
 *
 * ─── DIE AUSNAHMEN SIND NAMENTLICH, NICHT PAUSCHAL ─────────────────────────
 *
 * Zwei Dinge dürfen blass bleiben, weil sie wirklich Beiwerk sind: der
 * Tastenhinweis `Strg P` im Suchfeld und der Aufklapp-Pfeil `▸` im Baum.
 * Beide stehen unten mit Grund in `ERLAUBT`. Eine Ausnahmeliste, die nur aus
 * Klassennamen besteht, wächst irgendwann still — deshalb steht bei jeder
 * der Grund daneben, und deshalb ist sie kurz.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ──────────────────────────────────
 *
 * GEMESSEN, mit `--text-faint` an den sieben Stellen wieder eingesetzt:
 *
 *     hell    lernzentrale   11 zu schwach   (statt 0)
 *     dunkel  lernzentrale   11 zu schwach   (statt 0)
 *     dunkel  planung        10 zu schwach   (statt 0)
 *
 * Und die Gegenrichtung: `ERLAUBT` leer gemacht, meldet sie die beiden
 * Beiwerk-Stellen — die Liste wirkt also wirklich und ist nicht bloss
 * Dekoration.
 *
 *   node pruefungen/lauf/test249.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8991;

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

/* WAS BLASS BLEIBEN DARF — und warum. Jede Zeile ist eine Entscheidung,
   keine Abkürzung. Der Wähler muss auf das Element passen, das den TEXT
   trägt, nicht auf irgendeinen Vorfahren: sonst deckt eine Ausnahme mehr ab,
   als sie soll. */
const ERLAUBT: { wahl: string; grund: string }[] = [
  { wahl: '#topbar .sucher kbd',
    grund: 'Tastenhinweis neben dem Feld — die Handlung steht daneben im Klartext' },
  { wahl: '#tree .tw',
    grund: 'Aufklapp-Pfeil ▸, ein Symbol; sein Zustand steht in aria-expanded' }
];

const WELTEN: { name: string; ruf: string; arg?: string }[] = [
  { name: 'Lernzentrale', ruf: 'lernen' },
  { name: 'Workspace',    ruf: 'workspace' },
  { name: 'Bibliothek',   ruf: 'bibliothek' },
  { name: 'Aufgaben',     ruf: 'aufgaben' },
  { name: 'Whiteboards',  ruf: 'whiteboards' },
  { name: 'Planung',      ruf: 'planung' },
  { name: 'Arbeit',       ruf: 'lernen', arg: 'arbeit' },
  { name: 'Prüfungen',    ruf: 'lernen', arg: 'pruefungen' }
];

const browser = await chromium.launch();
const fehler: string[] = [];

type Fund = { text: string; wert: number; weg: string };

const messen = async (hell: boolean, welt: typeof WELTEN[number]): Promise<Fund[]> => {
  const seite = await browser.newPage({
    viewport: { width: 1280, height: 900 }, colorScheme: hell ? 'light' : 'dark' });
  seite.on('pageerror', (e: any) =>
    fehler.push(`PAGEERROR(${welt.name}/${hell ? 'hell' : 'dunkel'}): ` + String(e.message).slice(0, 110)));
  await seite.goto(`http://localhost:${PORT}/index.html`);
  await seite.waitForTimeout(2600);
  await seite.evaluate((h: boolean) => {
    Store.setMeta('rundgangGesehen', true);
    document.getElementById('rg-willkommen')?.remove();
    document.querySelector('.produkt-onboarding-lage')?.remove();
    const neu = h ? 'light' : 'dark';
    if (typeof Aussehen !== 'undefined') Aussehen.setzen({ schema: h ? 'hell' : 'standard' });
    document.documentElement.dataset['theme'] = neu;
    Store.setMeta('theme', neu);
  }, hell);
  try {
    await seite.evaluate(async (x: any) => {
      await (globalThis as any).Produktwelten[x.ruf]?.(x.arg);
    }, welt);
  } catch { /* eine Welt, die sich nicht öffnen lässt, meldet §0 */ }
  await seite.waitForTimeout(1400);

  const funde = await seite.evaluate((erlaubt: { wahl: string; grund: string }[]) => {
    /* WCAG 2.1, wörtlich. Keine Näherung: eine Näherung, die knapp daneben
       liegt, macht die Prüfung an genau den Stellen falsch, an denen es
       darauf ankommt. */
    const anteil = (c: number): number => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    const licht = (f: number[]): number =>
      0.2126 * anteil(f[0] ?? 0) + 0.7152 * anteil(f[1] ?? 0) + 0.0722 * anteil(f[2] ?? 0);
    const verhaeltnis = (a: number[], b: number[]): number => {
      const [x, y] = [licht(a), licht(b)].sort((m, n) => n - m) as [number, number];
      return (x + 0.05) / (y + 0.05);
    };
    const zuRgb = (s: string): number[] | null => {
      const m = /rgba?\(([^)]+)\)/.exec(s);
      if (!m) return null;
      const t = (m[1] ?? '').split(',').map(Number);
      return t.length > 3 && (t[3] ?? 1) < 0.05 ? null : t.slice(0, 3);
    };
    /* Der Hintergrund ist der erste Vorfahr mit echter Farbe — genau das,
       was das Auge sieht. */
    const hinter = (e: Element): number[] => {
      for (let x: Element | null = e; x; x = x.parentElement) {
        const c = zuRgb(getComputedStyle(x).backgroundColor);
        if (c) return c;
      }
      return [255, 255, 255];
    };

    const raus: { text: string; wert: number; weg: string }[] = [];
    for (const e of document.querySelectorAll('#main *, #topbar *, #sidebar *')) {
      const eigen = [...e.childNodes]
        .filter(n => n.nodeType === 3 && (n.textContent || '').trim())
        .map(n => (n.textContent || '').trim()).join(' ');
      if (!eigen) continue;
      if (erlaubt.some(x => e.matches(x.wahl))) continue;
      const r = e.getBoundingClientRect();
      if (r.width < 4 || r.height < 4 || r.top > innerHeight || r.bottom < 0) continue;
      const s = getComputedStyle(e);
      if (s.visibility === 'hidden' || s.display === 'none' || Number(s.opacity) < 0.1) continue;
      /* Ein abgeschaltetes Bedienelement ist nach WCAG ausgenommen — und es
         SAGT ja auch, dass es gerade nichts tut. */
      if ((e as HTMLButtonElement).disabled || e.closest('[disabled],[aria-disabled="true"]')) continue;
      const vg = zuRgb(s.color);
      if (!vg) continue;
      const gross = parseFloat(s.fontSize) >= 18.66 ||
        (parseFloat(s.fontSize) >= 14 && Number(s.fontWeight) >= 700);
      const v = verhaeltnis(vg, hinter(e));
      if (v >= (gross ? 3 : 4.5)) continue;
      const pfad: string[] = [];
      for (let x: Element | null = e; x && pfad.length < 3; x = x.parentElement)
        pfad.push(x.tagName.toLowerCase() +
          (x.id ? '#' + x.id : '') +
          (x.className ? '.' + String(x.className).split(' ')[0] : ''));
      raus.push({ text: eigen.slice(0, 34), wert: Math.round(v * 100) / 100, weg: pfad.join(' < ') });
    }
    return raus.sort((a, b) => a.wert - b.wert);
  }, ERLAUBT);

  await seite.close();
  return funde;
};

console.log('§38 · Kontrast in allen Produktwelten, hell und dunkel');
console.log('     Ausgenommen und begründet:');
for (const e of ERLAUBT) console.log('       ' + e.wahl.padEnd(22) + e.grund);

let gesamt = 0;
for (const hell of [true, false]) {
  console.log(`\n${hell ? 'HELL' : 'DUNKEL'}`);
  for (const welt of WELTEN) {
    const funde = await messen(hell, welt);
    gesamt += funde.length;
    p(`${welt.name}: jeder Text erreicht AA`, funde.length === 0,
      funde.slice(0, 5).map(f => `${f.wert} „${f.text}" ${f.weg}`).join('  |  '));
  }
}

console.log(`\nZu schwach insgesamt: ${gesamt}`);
p('Keine unbehandelten Browserfehler', fehler.length === 0, fehler.slice(0, 3).join(' | '));

console.log(`\n${ok}/${ok + weg} bestanden`);
await browser.close();
await new Promise<void>(f => { server.close(() => f()); });
process.exitCode = weg ? 1 : 0;
