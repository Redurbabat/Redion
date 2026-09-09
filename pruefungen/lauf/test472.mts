/* Suite 472 — Was das Stift-Dossier gefunden hat: Zeitnormierung und Abbruch (E504)
 * ============================================================================
 * Redur, 8. September, mit „Digitale Stifte und PDF-Annotationen: Vom
 * Sensorsignal bis zur gespeicherten Tintenlinie" (22 Seiten): „schau mal das
 * genauer an."
 *
 * Ein Prüflauf über einundzwanzig Punkte des Dossiers fand zwei Dinge, die
 * kein Auge sieht und keine bisherige Prüfung hielt:
 *
 *   §1 DER GLÄTTER IST PRO MESSUNG NORMIERT, NICHT PRO ZEIT. `stroke.ts`
 *      rechnet `alpha` aus dem Tempo und wendet es dann je Punkt an — ohne
 *      `dt`. Der 1-Euro-Filter (Dossier S.8) macht genau das anders:
 *      α = 1/(1 + τ/dt). Die Folge ist ausrechenbar: die Zeitkonstante eines
 *      EMA ist τ ≈ dt·(1−α)/α, sie SCHRUMPFT also mit der Abtastrate. Auf
 *      einem 240-Hz-Stift ist derselbe Filter viermal schwächer als auf dem
 *      60-Hz-Gerät, an dem die drei Zahlen gemessen wurden — auf genau dem
 *      Gerät, für das man diese Schicht baut.
 *      GEMESSEN WIRD DIE VERZÖGERUNG IN PIXELN bei DERSELBEN physischen
 *      Handbewegung, einmal mit 60 und einmal mit 240 Hz abgetastet. Sie
 *      muss gleich sein — es ist dieselbe Hand.
 *   §2 `pointercancel` SPEICHERT den Strich, statt ihn zu verwerfen. Das
 *      Dossier S.17: „Android verlangt bei ACTION_CANCEL / Palm-Rejection
 *      ausdrücklich das Entfernen des betreffenden Motion Sets. Eine App,
 *      die Cancel ignoriert, produziert Artefakte." Berührt der Handballen
 *      das Glas VOR dem Stift — die übliche Reihenfolge beim Aufsetzen der
 *      Hand — und erkennt der Browser ihn als Palm, stand danach ein
 *      Fremdstrich im Dokument.
 *   §3 UND DER STIFT WIRD NICHT VERWORFEN. §51 steht über dem Dossier: ein
 *      abgebrochener STIFT-Zug ist Handschrift, die ein Mensch gezogen hat,
 *      und die geht nicht verloren. Verworfen wird, was ein Finger war.
 *   §4 NACH DEM VERWERFEN IST ES SAUBER: kein Knoten, kein Schritt im
 *      Verlauf, und der nächste Strich geht normal.
 *   §5 QUELLEN, keine Seitenfehler.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 * Vor dem Bauen war sie es — §1 und §2 gegen den Stand von E503. Die
 * Gegenproben nach dem Bauen stehen in ENTSCHEIDUNGEN.md unter E504.
 *
 *   node pruefungen/lauf/test472.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import type { Page } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

declare const Store: any; declare const App: any; declare const InkStroke: any;

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9592;
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

const mitBlatt = async (): Promise<Page> => {
  const s = await browser.newPage({ viewport: { width: 1280, height: 950 } });
  s.on('pageerror', e => fehler.push(e.message.slice(0, 140)));
  s.on('dialog', d => d.dismiss().catch(() => {}));
  await s.goto(`http://localhost:${PORT}/index.html`);
  await s.waitForFunction("typeof App !== 'undefined' && typeof InkStroke !== 'undefined'");
  await s.evaluate(async () => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    document.querySelector('.produkt-onboarding-lage')?.remove();
    document.getElementById('rg-willkommen')?.remove();
    document.getElementById('rg-einladung')?.remove();
    const seite = Store.addPage(null, { text: 'Handschrift' });
    Store.addBlock(seite.id, 'blatt', { text: '', blattBreite: 595.28, blattHoehe: 841.89,
      raumVersion: 1, marken: [] });
    await Store.flush();
    App.oeffne(seite.id);
  });
  await s.waitForSelector('.blatt-werk [data-wz="stift"]', { timeout: 15000 });
  await s.waitForTimeout(400);
  return s;
};

/* ═══ §1 Der Glätter rechnet in Zeit, nicht in Messungen ═══════════════════ */
console.log('\n§1 Dieselbe Hand, zwei Abtastraten — dieselbe Verzögerung');
{
  const s = await mitBlatt();
  /* EINE physische Bewegung: gerade Linie, 0,3 px je Millisekunde.
     Einmal mit 60 Hz abgetastet (4,8 px je Punkt, dt 16), einmal mit
     240 Hz (1,2 px je Punkt, dt 4). Gemessen wird der Rückstand des
     geglätteten Punktes hinter dem echten — in PIXELN, nicht in Punkten:
     die Hand weiss nichts von der Abtastrate. */
  const r = JSON.parse(await s.evaluate(`(() => {
    const lauf = (dt, schritt, punkte) => {
      const gl = InkStroke.glaetter([0, 0]);
      let x = 0, rueck = 0;
      for (let i = 1; i <= punkte; i++) {
        x = i * schritt;
        const w = gl([x, 0], dt);
        /* Erst messen, wenn der Filter eingeschwungen ist. */
        if (i > punkte * 0.6) rueck = Math.max(rueck, x - w[0]);
      }
      return Math.round(rueck * 1000) / 1000;
    };
    /* 0,3 px je ms, 800 ms lang — beide Male dieselbe Strecke. */
    return JSON.stringify({
      hz60: lauf(16, 4.8, 50),
      hz240: lauf(4, 1.2, 200),
      hz120: lauf(8, 2.4, 100)
    });
  })()`) as string);
  console.log(`     Rückstand: 60 Hz ${r.hz60} px · 120 Hz ${r.hz120} px · 240 Hz ${r.hz240} px`);
  p('Bei 60 Hz bleibt der gemessene Rückstand, wie er war (2–9 px)',
    r.hz60 > 2 && r.hz60 < 9, String(r.hz60));
  p('240 Hz verzögert genauso wie 60 Hz — dieselbe Hand, dasselbe Papier',
    Math.abs(r.hz240 - r.hz60) < 0.5 * r.hz60, `${r.hz60} vs ${r.hz240}`);
  p('… und 120 Hz liegt dazwischen, nicht daneben',
    Math.abs(r.hz120 - r.hz60) < 0.5 * r.hz60, `${r.hz60} vs ${r.hz120}`);

  /* Und die andere Seite derselben Münze: das Zittern der stehenden Hand
     muss bei hoher Rate mindestens so gut weggehen wie bei niedriger. */
  const z = JSON.parse(await s.evaluate(`(() => {
    /* Ein fester Zufall, damit die Messung wiederholbar ist. */
    let saat = 12345;
    const rnd = () => { saat = (saat * 1103515245 + 12345) & 0x7fffffff; return saat / 0x7fffffff - 0.5; };
    const lauf = (dt, punkte) => {
      saat = 12345;
      const gl = InkStroke.glaetter([0, 0]);
      let summe = 0, n = 0, vorher = null, vorvor = null;
      for (let i = 0; i < punkte; i++) {
        const w = gl([rnd() * 0.8, rnd() * 0.8], dt);
        if (vorher && vorvor) {
          summe += Math.hypot(w[0] - 2 * vorher[0] + vorvor[0], w[1] - 2 * vorher[1] + vorvor[1]);
          n++;
        }
        vorvor = vorher; vorher = w;
      }
      /* Zittern JE MILLISEKUNDE, nicht je Punkt — sonst vergleicht man
         Äpfel mit Birnen: bei 240 Hz gibt es viermal so viele Schritte. */
      return Math.round(summe / Math.max(1, n) / dt * 10000) / 10000;
    };
    return JSON.stringify({ hz60: lauf(16, 400), hz240: lauf(4, 1600) });
  })()`) as string);
  console.log(`     Restzittern je ms: 60 Hz ${z.hz60} · 240 Hz ${z.hz240}`);
  p('Bei 240 Hz zittert es nicht mehr als bei 60 Hz',
    z.hz240 <= z.hz60 * 1.6, `${z.hz60} vs ${z.hz240}`);
  await s.close();
}

/* ═══ §2 Ein abgebrochener Finger hinterlässt nichts ═══════════════════════ */
console.log('\n§2 pointercancel mit dem Finger verwirft den Strich');
{
  const s = await mitBlatt();
  const r = JSON.parse(await s.evaluate(`(() => {
    const flaeche = document.querySelector('.blatt-marken');
    const kasten = flaeche.getBoundingClientRect();
    const ev = (typ, dx, dy, buttons, art) => flaeche.dispatchEvent(new PointerEvent(typ,
      { bubbles: true, cancelable: true,
        clientX: kasten.left + 80 + dx, clientY: kasten.top + 120 + dy,
        pointerId: 11, pointerType: art, isPrimary: true, button: 0, buttons, pressure: 0.5 }));
    document.querySelector('[data-wz="stift"]').click();
    ev('pointerdown', 0, 0, 1, 'touch');
    for (let i = 1; i <= 12; i++) ev('pointermove', i * 5, i * 2, 1, 'touch');
    const waehrend = flaeche.querySelectorAll('path,g').length;
    ev('pointercancel', 65, 26, 0, 'touch');
    const block = Store.getBlock(Store.getBlock(App.aktuelleSeite()).content[0]);
    return JSON.stringify({
      waehrend,
      knotenDanach: flaeche.querySelectorAll('[data-sid]').length,
      markenDanach: (block.marken || []).length
    });
  })()`) as string);
  p('Während des Zugs steht ein Strich auf der Fläche', r.waehrend > 0);
  gleich('Nach dem Abbruch steht kein Knoten mehr da', r.knotenDanach, 0);
  gleich('… und keine Marke ist gespeichert', r.markenDanach, 0);

  /* Und der nächste Strich geht ganz normal — der Abbruch darf nichts
     hinterlassen, was den folgenden Zug stört. */
  const n = JSON.parse(await s.evaluate(`(() => {
    const flaeche = document.querySelector('.blatt-marken');
    const kasten = flaeche.getBoundingClientRect();
    const ev = (typ, dx, dy, buttons) => flaeche.dispatchEvent(new PointerEvent(typ,
      { bubbles: true, cancelable: true,
        clientX: kasten.left + 200 + dx, clientY: kasten.top + 300 + dy,
        pointerId: 12, pointerType: 'touch', isPrimary: true, button: 0, buttons, pressure: 0.5 }));
    ev('pointerdown', 0, 0, 1);
    for (let i = 1; i <= 12; i++) ev('pointermove', i * 6, i * 3, 1);
    ev('pointerup', 72, 36, 0);
    const block = Store.getBlock(Store.getBlock(App.aktuelleSeite()).content[0]);
    const marken = block.marken || [];
    return JSON.stringify({ zahl: marken.length, art: marken[0] ? marken[0].art : '',
                            punkte: marken[0] ? marken[0].pts.length : 0 });
  })()`) as string);
  gleich('Der nächste Zug wird ganz normal eine Marke', n.zahl, 1);
  gleich('… und es ist ein Stiftstrich', n.art, 'stift');
  p('… mit mehr als zwei Punkten', n.punkte > 2, String(n.punkte));
  await s.close();
}

/* ═══ §3 Ein Stift wird NICHT verworfen ════════════════════════════════════ */
console.log('\n§3 Ein abgebrochener STIFT-Zug bleibt — §51 steht über dem Dossier');
{
  const s = await mitBlatt();
  const r = JSON.parse(await s.evaluate(`(() => {
    const flaeche = document.querySelector('.blatt-marken');
    const kasten = flaeche.getBoundingClientRect();
    const ev = (typ, dx, dy, buttons) => flaeche.dispatchEvent(new PointerEvent(typ,
      { bubbles: true, cancelable: true,
        clientX: kasten.left + 90 + dx, clientY: kasten.top + 140 + dy,
        pointerId: 21, pointerType: 'pen', isPrimary: true, button: 0, buttons, pressure: 0.6 }));
    document.querySelector('[data-wz="stift"]').click();
    ev('pointerdown', 0, 0, 1);
    for (let i = 1; i <= 14; i++) ev('pointermove', i * 5, i * 2, 1);
    ev('pointercancel', 70, 28, 0);
    const block = Store.getBlock(Store.getBlock(App.aktuelleSeite()).content[0]);
    const marken = block.marken || [];
    return JSON.stringify({ zahl: marken.length, art: marken[0] ? marken[0].art : '',
                            punkte: marken[0] ? marken[0].pts.length : 0 });
  })()`) as string);
  gleich('Der Stiftstrich ist gespeichert, nicht weggeworfen', r.zahl, 1);
  gleich('… als Stiftstrich', r.art, 'stift');
  p('… mit seinen Punkten', r.punkte > 2, String(r.punkte));
  await s.close();
}

/* ═══ §4 Der Verlauf bleibt sauber ═════════════════════════════════════════ */
console.log('\n§4 Ein verworfener Zug ist kein Schritt im Verlauf');
{
  const s = await mitBlatt();
  const r = JSON.parse(await s.evaluate(`(() => {
    const flaeche = document.querySelector('.blatt-marken');
    const kasten = flaeche.getBoundingClientRect();
    const zug = (id, art, x0, y0, ende) => {
      const ev = (typ, dx, dy, buttons) => flaeche.dispatchEvent(new PointerEvent(typ,
        { bubbles: true, cancelable: true,
          clientX: kasten.left + x0 + dx, clientY: kasten.top + y0 + dy,
          pointerId: id, pointerType: art, isPrimary: true, button: 0, buttons, pressure: 0.5 }));
      ev('pointerdown', 0, 0, 1);
      for (let i = 1; i <= 10; i++) ev('pointermove', i * 5, i * 2, 1);
      ev(ende, 50, 20, 0);
    };
    document.querySelector('[data-wz="stift"]').click();
    zug(31, 'touch', 60, 100, 'pointerup');      /* ein echter Strich */
    zug(32, 'touch', 60, 260, 'pointercancel');  /* ein Handballen */
    const lesen = () => (Store.getBlock(Store.getBlock(App.aktuelleSeite()).content[0]).marken || []).length;
    const vorher = lesen();
    /* Ein Zurück muss den ECHTEN Strich nehmen — nicht den Handballen,
       den es gar nicht gab. */
    document.querySelector('[data-act="undo"]').click();
    return JSON.stringify({ vorher, nachUndo: lesen() });
  })()`) as string);
  gleich('Nach echtem Strich und Handballen steht genau eine Marke', r.vorher, 1);
  gleich('Ein Zurück nimmt sie weg — der Handballen war kein Schritt', r.nachUndo, 0);
  await s.close();
}

/* ═══ §5 Quellen ═══════════════════════════════════════════════════════════ */
console.log('\n§5 Quellen');
{
  const st = lies('src/core/ink/stroke.ts');
  const mk = lies('src/bereiche/pdf/marken.ts');
  const stJs = lies('quell/core/ink/stroke.js');
  const mkJs = lies('quell/bereiche/pdf/marken.js');
  p('Der Glätter rechnet mit einer Zeitkonstante, nicht mit einem festen Anteil',
    /MESS_MS/.test(st) && /tau|TAU/.test(st));
  p('Die drei gemessenen Zahlen stehen weiter da (kein neues Designsystem)',
    /ALPHA_LANGSAM = 0\.28/.test(st) && /ALPHA_SCHNELL = 0\.92/.test(st) && /TEMPO_VOLL = 1\.1/.test(st));
  p('`pointercancel` hat einen eigenen Griff, nicht denselben wie `pointerup`',
    /pointercancel'?,\s*beiAbbruch|beiAbbruch\b/.test(mk));
  p('… und er entscheidet nach der Zeigerart', /zeigerArt[\s\S]{0,200}verwerfen|verwerfen[\s\S]{0,200}zeigerArt/.test(mk));
  p('Das erzeugte JS trägt beides', /MESS_MS|tau/.test(stJs) && /beiAbbruch/.test(mkJs));
  p('Keine Seitenfehler', fehler.length === 0, fehler.join(' | '));
}

console.log(`\n${ok}/${ok + weg} bestanden · ✗=${weg}`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
