/* Suite 392 — Das Abnahmetor über vier Bildschirmgrössen (E395, Audit F13)
 * ============================================================================
 * DER BERICHT VERLANGT EINEN GERÄTE-ABNAHMELAUF über 360×800, 390×844,
 * 428×926 und Querformat. Ein echtes iPhone gibt es im Container nicht; die
 * VIER GRÖSSEN gibt es sehr wohl, und sie finden das meiste.
 *
 * GEMESSEN AM 4. SEPTEMBER, bevor etwas geändert wurde. Die drei Hochformate
 * waren sauber — nichts rollte waagerecht, die Fingerziele der unteren
 * Leiste massen 48 px. Das QUERFORMAT war es nicht:
 *
 *     844 × 390     Kante 353 px hoch, Inhalt 424 px, overflow hidden
 *       .k-orte     6 Knöpfe   269 px
 *       .k-oben     7 Knöpfe     0 px   (auf null gequetscht)
 *       .k-unten    3 Knöpfe   137 px   begann bei 281 → 65 px draussen
 *
 * ACHT KNÖPFE WAREN NICHT ZU ERREICHEN — Übersicht, Notizhefte, Aufgaben,
 * Alle Seiten, Suchen, Zuletzt, Neu, Einstellungen. Und die untere
 * Telefonleiste greift dort nicht: sie endet bei 760 px Breite, 844 ist
 * breiter. Auf einem quer gehaltenen Telefon gab es keinen Weg zu „Neu".
 *
 *   §1 Nichts rollt waagerecht — an allen vier Grössen.
 *   §2 Die untere Leiste trifft der Finger (§37).
 *   §3 Im Querformat steht kein Knopf ausserhalb.
 *   §4 Und was gefaltet wurde, steht in den Laden.
 *   §5 Am Rechner wird nicht gefaltet — die Gegenprobe.
 *
 *   node pruefungen/lauf/test392.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import type { Browser, Page } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9417;
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
const auf = async (w: number, h: number): Promise<Page> => {
  const s = await browser.newPage({ viewport: { width: w, height: h },
                                    isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await s.goto(`http://localhost:${PORT}/index.html`, { waitUntil: 'load' });
  await s.waitForFunction(`typeof App === 'object'`, null, { timeout: 20000 });
  await s.waitForTimeout(900);
  await s.evaluate(`document.getElementById('rg-willkommen')?.remove()`);
  /* OHNE RUHIGEN MODUS MESSEN (E457). Dieser Lauf misst das FALTEN der
     Kante (E395): sechs Orte, sieben Werkzeuge, drei im Fuss, und was bei
     wenig Höhe hinter „···" geht. Im ruhigen Modus zeigt die Kante drei
     Orte, zwei Griffe und einen Fuss — dort gibt es nichts zu falten;
     test387 §5 und test430 halten diese Fassung. Das Falten gilt weiter,
     nämlich in der alten Leiste, und die wird hier hergestellt. */
  await s.evaluate(`(globalThis.Ruhig && Ruhig.setzen(false))`);
  await s.waitForTimeout(400);
  return s;
};

/* Die vier Grössen des Berichts. */
const HOCH: Array<[number, number]> = [[360, 800], [390, 844], [428, 926]];
const QUER: [number, number] = [844, 390];

/* ==========================================================================
 * §1 · Nichts rollt waagerecht
 * --------------------------------------------------------------------------
 * Die einfachste und schärfste Frage an ein Bild: passt es in die Breite?
 * Eine Seite, die waagerecht rollt, hat irgendwo etwas, das zu breit ist —
 * und man findet es nie, weil man nicht dorthin scrollt.
 * ========================================================================*/
console.log('\n1 · Keine Seite rollt waagerecht');
for (const [w, h] of [...HOCH, QUER]) {
  const s = await auf(w, h);
  const quer = await s.evaluate(
    `document.documentElement.scrollWidth - window.innerWidth`) as number;
  p(`${w}×${h}: passt in die Breite`, quer <= 0, `${quer} px zu breit`);
  await s.close();
}

/* ==========================================================================
 * §2 · Die untere Leiste trifft der Finger (§37)
 * ========================================================================*/
console.log('\n2 · Fingerziele der unteren Leiste');
for (const [w, h] of HOCH) {
  const s = await auf(w, h);
  const m = await s.evaluate(`(() => {
    const b = [...document.querySelectorAll('#hl-dok, #hl-start, #hl-lernen, #hl-bespr, #hl-mehr')];
    return b.map(x => { const r = x.getBoundingClientRect();
                        return { id: x.id, w: Math.round(r.width), h: Math.round(r.height) }; });
  })()`) as Array<{ id: string; w: number; h: number }>;
  gleich(`${w}×${h}: fünf Wege stehen da`, m.length, 5);
  const zuKlein = m.filter(x => x.h < 44 || x.w < 44).map(x => `${x.id} ${x.w}×${x.h}`);
  gleich(`${w}×${h}: alle mindestens 44 px`, zuKlein, []);
  await s.close();
}

/* ==========================================================================
 * §3 · Im Querformat steht kein Knopf ausserhalb
 * --------------------------------------------------------------------------
 * DER ABSCHNITT, DER DEN FEHLER HÄLT. Vor E395 lagen hier acht Knöpfe
 * ausserhalb und `.k-unten` war ganz weg.
 * ========================================================================*/
console.log('\n3 · Querformat: die Kante ist vollständig');
{
  const s = await auf(QUER[0], QUER[1]);
  const m = await s.evaluate(`(() => {
    const k = document.getElementById('kante');
    if (!k || getComputedStyle(k).display === 'none') return { kante: false };
    const kr = k.getBoundingClientRect();
    const draussen = [];
    for (const b of k.querySelectorAll('.k-knopf')) {
      const r = b.getBoundingClientRect();
      if (r.bottom > kr.bottom + 1 || r.top < kr.top - 1) draussen.push(b.dataset.k);
    }
    const u = k.querySelector('.k-unten');
    const ur = u ? u.getBoundingClientRect() : null;
    return { kante: true, draussen,
             untenGanzDrin: !!ur && ur.bottom <= kr.bottom + 1 && ur.top >= kr.top - 1,
             fuss: [...k.querySelectorAll('.k-unten .k-knopf')].map(b => b.dataset.k) };
  })()`) as { kante: boolean; draussen?: string[]; untenGanzDrin?: boolean; fuss?: string[] };
  p('Die Kante ist überhaupt da', m.kante);
  gleich('Kein Knopf liegt ausserhalb', m.draussen, []);
  p('Der Fuss steht ganz im Bild', m.untenGanzDrin);
  gleich('… und trägt KI, Neu und Einstellungen', m.fuss,
         ['ki', 'neu', 'einstellungen']);
  await s.close();
}

/* ==========================================================================
 * §4 · Was gefaltet wurde, steht in den Laden
 * --------------------------------------------------------------------------
 * OHNE DIESEN ABSCHNITT WÄRE §3 EINE FALLE: „kein Knopf ausserhalb" ist auch
 * dann grün, wenn man einfach die Hälfte weglässt. Gemessen war das beim
 * ersten Anlauf tatsächlich so — die vier ausgeblendeten Orte standen weder
 * in der Leiste noch in der Lade, weil die Lade weiter das Register fragte
 * statt der Leiste.
 * ========================================================================*/
console.log('\n4 · Und alles Weggefaltete ist über die Laden erreichbar');
{
  const s = await auf(QUER[0], QUER[1]);
  /* MIT `evaluate` STATT `click`, und das ist Absicht: liegt ein Knopf unter
     einem anderen, wartet `page.click` dreissig Sekunden und wirft. Ein
     Prüflauf, der bei einem Fehler ABSTÜRZT statt ihn zu melden, hilft
     niemandem — genau das passierte bei der Mutation zu diesem Abschnitt. */
  await s.evaluate(`document.querySelector('.k-knopf[data-k="mehr-orte"]')?.click()`);
  await s.waitForTimeout(700);
  const orte = await s.evaluate(
    `[...document.querySelectorAll('#kanten-lade .kl-zeile b')].map(b => b.textContent.trim())`) as string[];
  for (const name of ['Heute', 'Lernzentrum', 'Elektrotechnik', 'Aufgaben'])
    p(`„${name}" steht in der Ortslade`, orte.includes(name), `${orte.length} Zeilen`);
  await s.evaluate(`document.querySelector('#kanten-lade .kl-zu, #kanten-lade button')?.click()`);
  await s.waitForTimeout(400);

  /* Der Rundgang baut sich beim Neuzeichnen wieder auf und fängt dann jeden
     Klick ab — vor jedem weiteren Griff also noch einmal weg damit. */
  await s.evaluate(`document.getElementById('rg-willkommen')?.remove()`);
  const mehrDa = await s.evaluate(`!!document.querySelector('.k-knopf[data-k="mehr-werkzeuge"]')`);
  p('Es gibt einen „···"-Knopf für die Werkzeuge', mehrDa);
  if (mehrDa) {
    await s.evaluate(`document.querySelector('.k-knopf[data-k="mehr-werkzeuge"]')?.click()`);
    await s.waitForTimeout(700);
    const werk = await s.evaluate(
      `[...document.querySelectorAll('#kanten-lade .kl-zeile b')].map(b => b.textContent.trim())`) as string[];
    p('Und „Suchen" steht darin', werk.includes('Suchen'), werk.join(', '));
  }
  await s.close();
}

/* ==========================================================================
 * §5 · Am Rechner wird nicht gefaltet — die Gegenprobe
 * --------------------------------------------------------------------------
 * Eine Kante, die IMMER faltet, wäre kein Gewinn, sondern der Verlust der
 * Leiste. Bei 1360 × 900 stehen alle Orte und alle Werkzeuge da.
 * ========================================================================*/
console.log('\n5 · Am Rechner steht alles da');
{
  /* 1080 STATT 900 SEIT E457: die alte Leiste trägt sieben Orte (Notizhefte
     ist der sechste Hauptweg) plus sieben Werkzeuge, „Seiten" und drei im
     Fuss — 18 Knöpfe zu 44 px sind 792 px vor Abständen, und bei 900 px
     faltet sie zu Recht. Die Gegenprobe fragt, ob sie IMMER faltet; das
     misst sie dort, wo Platz ist. */
  const s = await browser.newPage({ viewport: { width: 1360, height: 1080 } });
  await s.goto(`http://localhost:${PORT}/index.html`, { waitUntil: 'load' });
  /* Auch hier die alte Leiste (E457, siehe `auf()` oben). */
  await s.waitForFunction(`typeof App === 'object'`, null, { timeout: 20000 });
  await s.evaluate(`(globalThis.Ruhig && Ruhig.setzen(false))`);
  await s.waitForTimeout(400);
  await s.waitForFunction(`typeof App === 'object'`, null, { timeout: 20000 });
  await s.waitForTimeout(1200);
  await s.evaluate(`document.getElementById('rg-willkommen')?.remove()`);
  const m = await s.evaluate(`(() => {
    const k = document.getElementById('kante');
    return { orte: k.querySelectorAll('.k-orte .k-knopf').length,
             werkzeuge: k.querySelectorAll('.k-oben .k-knopf').length,
             gefaltet: !!k.querySelector('.k-knopf[data-k="mehr-werkzeuge"]') };
  })()`) as { orte: number; werkzeuge: number; gefaltet: boolean };
  /* Sieben seit E457: Notizhefte ist der sechste Hauptweg (`haupt: true`). */
  p('Sieben Ortsknöpfe (sechs Orte und „Mehr Orte")', m.orte === 7, String(m.orte));
  p('Mehr als zwei Werkzeuge', m.werkzeuge > 2, String(m.werkzeuge));
  p('Und kein „···" — es ist ja Platz', !m.gefaltet);
  await s.close();
}

await browser.close();
server.close();
console.log(`\n${ok} von ${ok + weg} Prüfungen grün`);
process.exit(weg ? 1 : 0);
