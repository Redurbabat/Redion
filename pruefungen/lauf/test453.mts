/* Suite 453 — Die Miniaturenleiste wie GoodNotes: Menü je Seite und Ziehen (E480)
 * ============================================================================
 * L133 führte seit dem 7. September: „Seiten ziehen in der Miniaturenleiste
 * und ein Menü je Miniatur (GoodNotes' „…" an jeder Seite) — heute gehen
 * alle Seitengriffe über den Inspector der Seite, die man ANSIEHT."
 *
 * Beides steht jetzt. Das Neue am Menü ist nicht, dass es dieselben Griffe
 * zeigt — es ist, dass sie eine ANDERE Seite meinen als die angesehene.
 * Genau daran hängt §2.
 *
 *   §1 JEDE MINIATUR hat ihren Knopf, 44 px, und er sagt, wozu er gehört.
 *   §2 DAS MENÜ MEINT SEINE SEITE: gelöscht wird die, an der es hängt —
 *      nicht die, die auf der Bühne steht.
 *   §3 UND ES GEHT WIEDER ZU: Escape, ein Tipp daneben, das Rollen.
 *   §4 ZIEHEN ORDNET UM — und der Klick danach springt nicht mit.
 *   §5 MIT DEM FINGER ERST NACH DEM HALTEN: eine Bewegung ohne Halten
 *      rollt die Leiste und ordnet nichts um.
 *   §6 RECHTE: ohne Bearbeitungsrecht kein Menü und kein Ziehen.
 *   §7 QUELLEN, keine Seitenfehler.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 *   §2 → `zielSeite` nicht übergeben (alle Griffe wieder auf `jetzt()`):
 *        gelöscht wird die angesehene Seite. Gelaufen, rot.
 *   §4 → in `seiteAnStelle` den Zielplatz um eins verschieben: die Seite
 *        landet einen Platz zu weit. Gelaufen, rot.
 *   §5 → `bereit` sofort auf true: der Finger ordnet ohne Halten um, und
 *        die Leiste liesse sich nicht mehr rollen. Gelaufen, rot.
 *
 *   node pruefungen/lauf/test453.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import type { Page } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

declare const Store: any; declare const App: any; declare const DocumentMode: any;

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9573;
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
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll), `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);
const lies = (f: string): string => fs.readFileSync(path.join(WURZEL, f), 'utf8');

const browser = await chromium.launch();
const fehler: string[] = [];

/** Ein Dokument mit sechs Seiten, die Leiste offen. */
const frisch = async (nurLesen = false): Promise<Page> => {
  const s = await browser.newPage({ viewport: { width: 1280, height: 860 } });
  s.on('pageerror', e => fehler.push(e.message.slice(0, 140)));
  await s.goto(`http://localhost:${PORT}/index.html`);
  await s.waitForFunction("typeof App !== 'undefined' && typeof DocumentMode !== 'undefined'");
  await s.evaluate(async (nurLesen: boolean) => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    document.querySelector('.produkt-onboarding-lage')?.remove();
    document.getElementById('rg-willkommen')?.remove();
    document.getElementById('rg-einladung')?.remove();
    const seite = Store.addPage(null, { text: 'Skript', icon: '📕' });
    Store.updateBlock(seite.id, { dokumentModus: true, ...(nurLesen ? { freigaben: { '*': 'lesen' } } : {}) });
    for (let i = 1; i <= 6; i++)
      Store.addBlock(seite.id, 'pdfseite', { text: '', nr: i, vonSeiten: 6, bw: 595, bh: 842,
        quelleId: 'q', raumVersion: 1 });
    (window as any).__seite = seite.id;
    await Store.flush();
    App.oeffne(seite.id);
  }, nurLesen);
  await s.waitForSelector('.document-workspace', { timeout: 15000 });
  await s.waitForTimeout(1300);
  await s.evaluate(() => document.querySelector<HTMLButtonElement>('[data-document-action="thumbnails"]')?.click());
  await s.waitForTimeout(500);
  return s;
};
/** Die Nummern der Seiten in ihrer Reihenfolge. */
const reihe = (s: Page): Promise<number[]> => s.evaluate(() =>
  DocumentMode.documentsIn(Store.getBlock((window as any).__seite)).map((b: any) => Number(b.nr)));
/** Einen Zug in der Leiste fahren: Zeile `von` aufnehmen und VOR Zeile
 *  `vor` fallen lassen (`vor` = Zeilenzahl heisst: ganz ans Ende).
 *
 *  Gezielt wird knapp unter die OBERKANTE der Zielzeile, denn eingefügt
 *  wird vor der Zeile, deren Mitte unter dem Zeiger liegt — wer auf ihre
 *  untere Hälfte zielt, landet dahinter. */
type ZugOpt = { art?: string; halten?: number; schritte?: number };
const ziehen = (s: Page, von: number, vor: number, opt: ZugOpt = {}) =>
  s.evaluate(async ({ von, vor, opt }: { von: number; vor: number; opt: ZugOpt }) => {
    const leiste = document.querySelector<HTMLElement>('.document-thumbnails')!;
    const zeilen = [...leiste.querySelectorAll<HTMLElement>('.document-thumb-zeile')];
    const a = zeilen[von]!.getBoundingClientRect();
    const zielZeile = zeilen[vor];
    const zielY = zielZeile ? zielZeile.getBoundingClientRect().top + 4
      : zeilen[zeilen.length - 1]!.getBoundingClientRect().bottom - 2;
    const art = opt.art || 'mouse';
    const ev = (typ: string, x: number, y: number) => new PointerEvent(typ, { bubbles: true, cancelable: true,
      clientX: x, clientY: y, pointerId: 5, pointerType: art, isPrimary: true,
      button: typ === 'pointermove' ? -1 : 0, buttons: typ === 'pointerup' ? 0 : 1 });
    const x0 = a.left + a.width / 2, y0 = a.top + a.height / 2;
    zeilen[von]!.dispatchEvent(ev('pointerdown', x0, y0));
    if (opt.halten) await new Promise(r => setTimeout(r, opt.halten));
    const n = opt.schritte ?? 8;
    for (let i = 1; i <= n; i++)
      leiste.dispatchEvent(ev('pointermove', x0, y0 + (zielY - y0) * i / n));
    leiste.dispatchEvent(ev('pointerup', x0, zielY));
    /* Der Klick kommt beim echten Zeiger nach dem Loslassen — hier auch. */
    zeilen[von]!.querySelector('button')?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    await new Promise(r => setTimeout(r, 600));
  }, { von, vor, opt });

/* ═══ §1 Der Knopf an jeder Miniatur ═══════════════════════════════════════ */
console.log('\n§1 Jede Miniatur hat ihren Knopf');
const s = await frisch();
{
  const r = JSON.parse(await s.evaluate(`(() => {
    const zeilen = [...document.querySelectorAll('.document-thumb-zeile')];
    const knoepfe = [...document.querySelectorAll('.document-thumb-menue-knopf')];
    return JSON.stringify({
      zeilen: zeilen.length, knoepfe: knoepfe.length,
      kleinste: Math.min(...knoepfe.map(k => Math.round(k.getBoundingClientRect().height))),
      schmalste: Math.min(...knoepfe.map(k => Math.round(k.getBoundingClientRect().width))),
      name: knoepfe[2] ? knoepfe[2].getAttribute('aria-label') : null,
      auf: knoepfe[0] ? knoepfe[0].getAttribute('aria-expanded') : null,
      miniaturen: document.querySelectorAll('.document-thumbnail').length
    });
  })()`) as string);
  gleich('Sechs Zeilen, sechs Knöpfe, sechs Miniaturen', [r.zeilen, r.knoepfe, r.miniaturen], [6, 6, 6]);
  p('Jeder misst 44 px in beide Richtungen (§37)', r.kleinste >= 44 && r.schmalste >= 44, JSON.stringify(r));
  p('… und sagt, zu welcher Seite er gehört', /Seite 3.*Menü/.test(String(r.name)), String(r.name));
  gleich('Zu ist zu', r.auf, 'false');
  await s.evaluate(() => document.querySelector<HTMLButtonElement>('[data-document-thumb-menue="2"]')?.click());
  await s.waitForTimeout(300);
  const auf = JSON.parse(await s.evaluate(`(() => {
    const m = document.querySelector('.document-thumb-menue');
    const s = document.querySelector('.document-thumbnails').getBoundingClientRect();
    const r = m ? m.getBoundingClientRect() : null;
    return JSON.stringify({ da: !!m, eintraege: m ? m.querySelectorAll('button').length : 0,
      kleinste: m ? Math.min(...[...m.querySelectorAll('button')].map(b => Math.round(b.getBoundingClientRect().height))) : 0,
      drin: !!r && r.left >= s.left - 1 && r.right <= s.right + 1,
      knopf: document.querySelector('[data-document-thumb-menue="2"]').getAttribute('aria-expanded') });
  })()`) as string);
  p('Ein Tipp öffnet das Menü mit acht Griffen', auf.da && auf.eintraege === 8, JSON.stringify(auf));
  p('… jeder 44 px hoch (§37)', auf.kleinste >= 44, JSON.stringify(auf));
  p('… es steht ganz in der Leiste', auf.drin === true, JSON.stringify(auf));
  gleich('… und der Knopf sagt, dass es offen ist', auf.knopf, 'true');
}

/* ═══ §2 Das Menü meint seine Seite ════════════════════════════════════════ */
console.log('\n§2 Das Menü meint SEINE Seite, nicht die angesehene');
{
  gleich('Sechs Seiten, in der Reihe 1…6', await reihe(s), [1, 2, 3, 4, 5, 6]);
  gleich('Angesehen wird die erste',
    await s.evaluate(`document.querySelector('.document-position').textContent`), 'Seite 1/6');
  /* Das Menü der DRITTEN Seite ist offen (§1) — löschen. */
  await s.evaluate(() => document.querySelector<HTMLButtonElement>('.document-thumb-menue [data-document-action="page-delete"]')?.click());
  await s.waitForTimeout(700);
  gleich('Gelöscht wird die dritte — nicht die, die auf der Bühne stand',
    await reihe(s), [1, 2, 4, 5, 6]);
  /* Und dasselbe mit einem Griff, der schreibt statt löscht. */
  await s.evaluate(() => document.querySelector<HTMLButtonElement>('[data-document-thumb-menue="3"]')?.click());
  await s.waitForTimeout(300);
  await s.evaluate(() => document.querySelector<HTMLButtonElement>('.document-thumb-menue [data-document-action="page-bookmark"]')?.click());
  await s.waitForTimeout(600);
  gleich('Das Lesezeichen sitzt an der vierten Miniatur (Seite 5)',
    await s.evaluate(() => DocumentMode.documentsIn(Store.getBlock((window as any).__seite))
      .map((b: any) => Number(b.nr)).filter((_n: number, i: number) =>
        DocumentMode.documentsIn(Store.getBlock((window as any).__seite))[i].lesezeichen)), [5]);
}

/* ═══ §3 Und es geht wieder zu ═════════════════════════════════════════════ */
console.log('\n§3 Das Menü geht wieder zu');
{
  const offen = () => s.evaluate(`!!document.querySelector('.document-thumb-menue')`);
  await s.evaluate(() => document.querySelector<HTMLButtonElement>('[data-document-thumb-menue="1"]')?.click());
  await s.waitForTimeout(250);
  p('Auf', await offen());
  await s.keyboard.press('Escape');
  await s.waitForTimeout(250);
  p('Escape schliesst es (E302)', !(await offen()));
  await s.evaluate(() => document.querySelector<HTMLButtonElement>('[data-document-thumb-menue="1"]')?.click());
  await s.waitForTimeout(250);
  await s.evaluate(() => {
    const b = document.querySelector<HTMLElement>('.document-center')!;
    b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: 700, clientY: 500 }));
  });
  await s.waitForTimeout(250);
  p('Ein Tipp auf die Bühne auch', !(await offen()));
  await s.evaluate(() => document.querySelector<HTMLButtonElement>('[data-document-thumb-menue="1"]')?.click());
  await s.waitForTimeout(250);
  await s.evaluate(() => document.querySelector('.document-thumbnails')!.dispatchEvent(new Event('scroll')));
  await s.waitForTimeout(250);
  p('Und das Rollen der Leiste auch', !(await offen()));
  /* Derselbe Knopf zweimal: auf, zu. */
  await s.evaluate(() => document.querySelector<HTMLButtonElement>('[data-document-thumb-menue="1"]')?.click());
  await s.waitForTimeout(250);
  await s.evaluate(() => document.querySelector<HTMLButtonElement>('[data-document-thumb-menue="1"]')?.click());
  await s.waitForTimeout(250);
  p('Zweimal derselbe Knopf schliesst es wieder', !(await offen()));
}
await s.close();

/* ═══ §4 Ziehen ordnet um ══════════════════════════════════════════════════ */
console.log('\n§4 Ziehen ordnet um');
{
  const t = await frisch();
  gleich('Vorher 1…6', await reihe(t), [1, 2, 3, 4, 5, 6]);
  /* WELCHE Seite auf der Bühne steht, nicht welche NUMMER sie trägt: die
     gezogene wandert unter der Bühne weg, ihre Zahl ändert sich also —
     das ist richtig so. Falsch wäre, wenn plötzlich eine ANDERE Seite
     dastünde. */
  const aufDerBuehne = () => t.evaluate(() => {
    const liste = DocumentMode.documentsIn(Store.getBlock((window as any).__seite));
    const nr = Number((document.querySelector('.document-position')?.textContent || '').replace(/\D+/g, '').slice(0, 1));
    return String(liste[nr - 1]?.nr ?? '');
  });
  const vorher = await aufDerBuehne();
  await ziehen(t, 0, 4);
  gleich('Die erste Seite liegt jetzt an vierter Stelle', await reihe(t), [2, 3, 4, 1, 5, 6]);
  gleich('Und auf der Bühne steht dieselbe Seite wie vorher', await aufDerBuehne(), vorher);
  /* Rückwärts geht es auch. */
  await ziehen(t, 3, 0);
  gleich('Zurück nach vorn', await reihe(t), [1, 2, 3, 4, 5, 6]);
  /* Auf sich selbst gezogen passiert nichts. */
  await ziehen(t, 2, 2);
  gleich('Auf die eigene Stelle gezogen ändert nichts', await reihe(t), [1, 2, 3, 4, 5, 6]);
  /* Und ganz ans Ende. */
  await ziehen(t, 0, 6);
  gleich('Ganz ans Ende gezogen', await reihe(t), [2, 3, 4, 5, 6, 1]);
  await t.close();
}

/* ═══ §5 Mit dem Finger erst nach dem Halten ═══════════════════════════════ */
console.log('\n§5 Mit dem Finger erst nach dem Halten');
{
  const t = await frisch();
  await ziehen(t, 0, 4, { art: 'touch' });
  gleich('Ein Wisch ohne Halten rollt nur — die Reihe bleibt', await reihe(t), [1, 2, 3, 4, 5, 6]);
  await ziehen(t, 0, 4, { art: 'touch', halten: 500 });
  gleich('Nach einem halben Sekunde Halten ordnet er um', await reihe(t), [2, 3, 4, 1, 5, 6]);
  await t.close();
}

/* ═══ §6 Rechte ════════════════════════════════════════════════════════════ */
console.log('\n§6 Ohne Bearbeitungsrecht geht keines von beidem');
{
  const t = await frisch(true);
  await t.evaluate(() => document.querySelector<HTMLButtonElement>('[data-document-thumb-menue="1"]')?.click());
  await t.waitForTimeout(400);
  p('Kein Menü', !(await t.evaluate(`!!document.querySelector('.document-thumb-menue')`)));
  await ziehen(t, 0, 4);
  gleich('Und kein Umordnen', await reihe(t), [1, 2, 3, 4, 5, 6]);
  await t.close();
}

console.log('\n§7 Quellen');
p('`document-mode.ts` kennt Zeile, Menü und `seiteAnStelle`',
  /document-thumb-zeile/.test(lies('src/bereiche/pdf/document-mode.ts'))
  && /const menueOeffnen = /.test(lies('src/bereiche/pdf/document-mode.ts'))
  && /const seiteAnStelle = \(block: any, zielIndex: number\): boolean/.test(lies('src/bereiche/pdf/document-mode.ts')));
p('Die Seitengriffe nehmen entgegen, WEN sie meinen',
  /const seiteLoeschen = \(wen\?: any\)/.test(lies('src/bereiche/pdf/document-mode.ts'))
  && /seiteLoeschen\(zielSeite\)/.test(lies('src/bereiche/pdf/document-mode.ts')));
p('Das Stilblatt kennt die Zeile, das Menü und die Marke',
  /\.document-thumb-zeile\{/.test(lies('quell/schale/stil/pdf-studio.css'))
  && /\.document-thumb-menue\{/.test(lies('quell/schale/stil/pdf-studio.css'))
  && /\.document-thumb-marke\{/.test(lies('quell/schale/stil/pdf-studio.css')));
p('Das erzeugte JS trägt es', /seiteAnStelle/.test(lies('quell/bereiche/pdf/document-mode.js')));
gleich('Keine Seitenfehler', fehler, []);

console.log(`\n${ok}/${ok + weg} bestanden · ✗=${weg}`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
