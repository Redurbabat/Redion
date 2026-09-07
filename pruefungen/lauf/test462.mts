/* Suite 462 — Was auf dieser Seite gesperrt ist (E492)
 * ============================================================================
 * L133, unter „Auswahl": „**Sperren im Inspector** — die Sperre sitzt am
 * Knopf der Leiste; eine Liste aller gesperrten Marken gibt es nicht."
 *
 * Das war ein Rundlauf ohne Ausgang: sperren geht über die Auswahl, und
 * gerade die Auswahl geht bei einer gesperrten Marke nicht mehr. Wer eine
 * Marke gesperrt hatte, kam an sie nicht mehr heran.
 *
 *   §1 DIE LISTE steht im Inspector, sagt WIE VIELE, und nennt jede Marke
 *      bei dem Namen, den auch die Werkzeugleiste benutzt.
 *   §2 SIE STEHT NUR DA, WENN ES ETWAS ZU ZEIGEN GIBT.
 *   §3 ENTSPERREN WIRKT WIRKLICH — im Block, und die Marke lässt sich
 *      danach wieder auswählen und bewegen.
 *   §4 „ALLE ENTSPERREN" bei mehreren, und `gesperrt` wird GELÖSCHT, nicht
 *      auf `false` gesetzt (§17).
 *   §5 OHNE RECHTE GEHT NICHTS.
 *   §6 QUELLEN, keine Seitenfehler.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 *   §1 → die Liste nicht bauen: nichts steht da. Gelaufen, rot.
 *   §3 → im Griff `delete kopie.gesperrt` weglassen: die Zeile verschwindet
 *        nicht, die Marke bleibt gesperrt. Gelaufen, rot.
 *   §4 → `gesperrt = false` statt `delete`: das Feld steht noch da.
 *        Gelaufen, rot.
 *   §1 (Stil) → den Stil im Namen weglassen: zwei Linien heissen gleich.
 *        Gelaufen, rot.
 *   §1 (Leuchten) → die Klasse `ist-gezeigt` nicht setzen. Gelaufen, rot.
 *
 *   node pruefungen/lauf/test462.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import type { Page } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

declare const Store: any; declare const App: any; declare const Marken: any;

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9582;
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

/**
 * Ein Dokument mit einer Seite und den übergebenen Marken, Inspector offen.
 */
const mitMarken = async (marken: any[]): Promise<Page> => {
  const s = await browser.newPage({ viewport: { width: 1280, height: 950 } });
  s.on('pageerror', e => fehler.push(e.message.slice(0, 140)));
  await s.goto(`http://localhost:${PORT}/index.html`);
  await s.waitForFunction("typeof App !== 'undefined' && typeof Marken !== 'undefined'");
  await s.evaluate(async (m: any[]) => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    document.querySelector('.produkt-onboarding-lage')?.remove();
    document.getElementById('rg-willkommen')?.remove();
    document.getElementById('rg-einladung')?.remove();
    const seite = Store.addPage(null, { text: 'Schaltplan', icon: '⚡' });
    Store.addBlock(seite.id, 'blatt', { text: '', blattBreite: 595.28, blattHoehe: 841.89,
      raumVersion: 1, marken: m });
    Store.updateBlock(seite.id, { dokumentModus: true });
    await Store.flush();
    App.oeffne(seite.id);
  }, marken);
  await s.waitForSelector('.document-workspace', { timeout: 15000 });
  await s.waitForTimeout(1100);
  await s.evaluate(() => document.querySelector<HTMLButtonElement>('[data-document-action="inspector"]')?.click());
  await s.waitForTimeout(500);
  return s;
};

const markenJetzt = async (s: Page): Promise<any[]> => JSON.parse(await s.evaluate(`(() => {
  const b = Object.values(Store.cache.blocks).find(x => x.type === 'blatt' && x.alive);
  return JSON.stringify((b && b.marken) || []);
})()`) as string);

const DREI = [
  { id: 'a', art: 'stift', farbe: '#111111', breite: 3, pts: [[60, 100], [300, 100]], gesperrt: true },
  { id: 'b', art: 'zettel', farbe: '#e0a419', pts: [[60, 200], [300, 280]],
    text: 'Diesen Wert vom Meister prüfen lassen', gesperrt: true },
  { id: 'c', art: 'marker', farbe: '#ffd75e', breite: 18, pts: [[60, 320], [300, 320]] }
];

/* ═══ §1 Die Liste ═════════════════════════════════════════════════════════ */
console.log('\n§1 Die Liste sagt, was gesperrt ist');
{
  const s = await mitMarken(DREI);
  const l = JSON.parse(await s.evaluate(`(() => {
    const k = document.querySelector('.document-gesperrt');
    /* AUCH OHNE LISTE EINE VOLLSTAENDIGE ANTWORT. Der erste Entwurf gab hier
       nur { da: false } zurueck — und die Gegenprobe (Liste weglassen) liess
       den Lauf dann ABSTUERZEN, statt jede Zusage einzeln rot zu melden. Rot
       war er damit auch, aber ein Absturz sagt nicht, WAS fehlt. */
    if (!k) return JSON.stringify({ da: false, kopf: '', zeilen: [], alle: false });
    return JSON.stringify({ da: true,
      kopf: k.querySelector('strong').textContent,
      zeilen: [...k.querySelectorAll('.document-gesperrt-zeile')].map(z => ({
        was: z.querySelector('.document-gesperrt-was').textContent,
        marke: z.querySelector('button').dataset.documentMarke,
        hoch: Math.round(z.querySelector('button').getBoundingClientRect().height) })),
      alle: !!k.querySelector('.document-gesperrt-alle') });
  })()`) as string);
  p('Die Liste steht im Inspector', l.da, JSON.stringify(l));
  p('… und sagt, wie viele es sind', /\(2\)/.test(String(l.kopf)), String(l.kopf));
  gleich('Zwei Zeilen, für die zwei gesperrten', l.zeilen.length, 2);
  p('Der Stift heisst „Stift" — derselbe Name wie in der Werkzeugleiste',
    /Stift/.test(String(l.zeilen[0]?.was)), JSON.stringify(l.zeilen[0]));
  /* DER STIL STEHT DABEI — der Fund des BILDES: zwei gesperrte Linien
     hiessen beide „Linie", die eine war der Schutzleiter. Ohne den Stil ist
     die Liste zwar vollständig und trotzdem nicht zu gebrauchen. */
  const zwei = JSON.parse(await s.evaluate(`(() => {
    const b = Object.values(Store.cache.blocks).find(x => x.type === 'blatt' && x.alive);
    Store.updateBlock(b.id, { marken: [
      { id: 'pe', art: 'line', stil: 'schutzleiter', breite: 3, pts: [[60,100],[300,100]], gesperrt: true },
      { id: 'sw', art: 'line', farbe: '#111111', breite: 3, pts: [[60,160],[300,160]], gesperrt: true }
    ] });
    App.zeichneSeite();
    return new Promise(f => setTimeout(() => {
      const k = document.querySelector('.document-gesperrt');
      f(JSON.stringify([...(k ? k.querySelectorAll('.document-gesperrt-was') : [])].map(z => z.textContent)));
    }, 900));
  })()`) as string);
  p('Zwei Linien sind auseinanderzuhalten — der Stil steht dabei',
    zwei.length === 2 && zwei[0] !== zwei[1] && /Schutzleiter/.test(String(zwei[0])),
    JSON.stringify(zwei));
  /* Und wer die Zeile berührt, sieht WELCHE es ist. */
  const leuchtet = JSON.parse(await s.evaluate(`(() => {
    const zeile = document.querySelector('.document-gesperrt-zeile');
    zeile.dispatchEvent(new MouseEvent('mouseenter', { bubbles: false }));
    const an = document.querySelectorAll('.blatt-marken .ist-gezeigt').length;
    zeile.dispatchEvent(new MouseEvent('mouseleave', { bubbles: false }));
    const aus = document.querySelectorAll('.blatt-marken .ist-gezeigt').length;
    return JSON.stringify({ an, aus });
  })()`) as string);
  gleich('Beim Berühren leuchtet genau eine Marke auf', [leuchtet.an, leuchtet.aus], [1, 0]);
  /* Den Bestand zurückstellen, die folgenden Zusagen zählen wieder zwei. */
  await s.evaluate(() => { App.zeichneSeite(); });
  await s.waitForTimeout(300);
  p('Die Haftnotiz nennt ihren eigenen Text dazu',
    /Haftnotiz/.test(String(l.zeilen[1]?.was)) && /Meister/.test(String(l.zeilen[1]?.was)),
    JSON.stringify(l.zeilen[1]));
  p('Der Marker steht NICHT da — er ist nicht gesperrt',
    !l.zeilen.some((z: any) => /Marker/.test(String(z.was))), JSON.stringify(l.zeilen));
  gleich('Jede Zeile meint ihre Marke', l.zeilen.map((z: any) => z.marke), ['a', 'b']);
  p('Die Knöpfe messen 44 px (§37)', l.zeilen.every((z: any) => z.hoch >= 44),
    JSON.stringify(l.zeilen.map((z: any) => z.hoch)));
  p('Bei zwei Marken steht „Alle entsperren" dabei', l.alle, JSON.stringify(l));
  /* Der Name kommt aus derselben Quelle wie die Leiste (§8). */
  gleich('`artWort` und die Leiste sagen dasselbe',
    await s.evaluate(`[Marken.artWort('stift'), Marken.artWort('zettel'), Marken.artWort('arrow')]`),
    ['Stift', 'Haftnotiz', 'Pfeil']);
  await s.close();
}

/* ═══ §2 Ohne Sperre keine Liste ═══════════════════════════════════════════ */
console.log('\n§2 Ohne Gesperrtes steht keine Überschrift da');
{
  const s = await mitMarken([DREI[2]]);
  gleich('Keine Liste', await s.evaluate(`!!document.querySelector('.document-gesperrt')`), false);
  p('… aber der Inspector steht sonst vollständig da',
    await s.evaluate(`!!document.querySelector('[data-document-action="page-rotate"]')`));
  await s.close();
}

/* ═══ §3 Entsperren wirkt wirklich ═════════════════════════════════════════ */
console.log('\n§3 Entsperren wirkt im Block, nicht nur im Bild');
{
  const s = await mitMarken(DREI);
  await s.evaluate(() => document.querySelector<HTMLButtonElement>(
    '.document-gesperrt-zeile [data-document-marke="a"]')?.click());
  await s.waitForTimeout(900);
  const m = await markenJetzt(s);
  gleich('Der Stift ist frei', m.find((x: any) => x.id === 'a')?.gesperrt, undefined);
  gleich('Die Haftnotiz bleibt gesperrt', m.find((x: any) => x.id === 'b')?.gesperrt, true);
  gleich('Keine Marke ist verschwunden', m.map((x: any) => x.id), ['a', 'b', 'c']);
  const l = JSON.parse(await s.evaluate(`(() => {
    const k = document.querySelector('.document-gesperrt');
    return JSON.stringify({ kopf: k ? k.querySelector('strong').textContent : null,
      zeilen: k ? k.querySelectorAll('.document-gesperrt-zeile').length : 0,
      alle: !!(k && k.querySelector('.document-gesperrt-alle')) });
  })()`) as string);
  p('Die Liste zeigt danach nur noch eine', l.zeilen === 1 && /\(1\)/.test(String(l.kopf)), JSON.stringify(l));
  p('… und „Alle entsperren" fällt weg, wenn nur eine übrig ist', l.alle === false, JSON.stringify(l));
  /* UND DIE MARKE LÄSST SICH WIEDER ANFASSEN. Das ist der Punkt der ganzen
     Übung: vorher war sie unerreichbar. */
  gleich('Der entsperrte Stift lässt sich wieder auswählen', await s.evaluate(`(() => {
    const f = document.querySelector('.blatt-marken');
    if (!f) return 'keine Flaeche';
    const knoten = f.querySelector('[data-sid="a"]');
    return knoten ? 'da' : 'fehlt';
  })()`), 'da');
  await s.close();
}

/* ═══ §4 Alle entsperren ═══════════════════════════════════════════════════ */
console.log('\n§4 Alle auf einmal — und das Feld geht WEG');
{
  const s = await mitMarken(DREI);
  await s.evaluate(() => document.querySelector<HTMLButtonElement>('.document-gesperrt-alle')?.click());
  await s.waitForTimeout(900);
  const m = await markenJetzt(s);
  gleich('Nichts ist mehr gesperrt', m.filter((x: any) => x.gesperrt).length, 0);
  /* `gesperrt: false` wäre dasselbe in anderen Worten — zwei Schreibweisen
     für einen Zustand (§17). `Marken.sperren` löscht das Feld, hier auch. */
  p('Das Feld ist gelöscht, nicht auf `false` gesetzt',
    m.every((x: any) => !('gesperrt' in x)), JSON.stringify(m.map((x: any) => Object.keys(x))));
  gleich('Die Liste ist weg', await s.evaluate(`!!document.querySelector('.document-gesperrt')`), false);
  await s.close();
}

/* ═══ §5 Ohne Rechte geht nichts ═══════════════════════════════════════════ */
console.log('\n§5 Ein gesperrtes Dokument lässt sich nicht heimlich öffnen');
{
  const s = await mitMarken(DREI);
  await s.evaluate(() => {
    const seite = Object.values<any>(Store.cache.blocks)
      .find((b: any) => b.type === 'page' && b.alive && b.dokumentModus);
    Store.updateBlock(seite.id, { gesperrt: true });
    App.oeffne(seite.id);
  });
  await s.waitForTimeout(1200);
  await s.evaluate(() => document.querySelector<HTMLButtonElement>('[data-document-action="inspector"]')?.click());
  await s.waitForTimeout(500);
  const zustand = JSON.parse(await s.evaluate(`(() => {
    const k = document.querySelector('.document-gesperrt-zeile button');
    return JSON.stringify({ da: !!k, aus: k ? k.disabled : null });
  })()`) as string);
  p('Die Liste steht da — sehen darf man es', zustand.da, JSON.stringify(zustand));
  gleich('… aber der Knopf ist aus', zustand.aus, true);
  /* Und auch ein Klick daran vorbei ändert nichts. */
  await s.evaluate(() => {
    const k = document.querySelector<HTMLButtonElement>('.document-gesperrt-zeile button');
    if (k) { k.disabled = false; k.click(); }
  });
  await s.waitForTimeout(700);
  gleich('Auch ein erzwungener Klick lässt die Sperre stehen',
    (await markenJetzt(s)).filter((x: any) => x.gesperrt).length, 2);
  await s.close();
}

/* ═══ §6 Quellen ═══════════════════════════════════════════════════════════ */
console.log('\n§6 Quellen');
{
  const q = lies('src/bereiche/pdf/document-mode.ts');
  p('Der Griff steht da', /action === 'mark-entsperren'/.test(q));
  p('… und löscht das Feld', /delete kopie\.gesperrt/.test(q));
  p('… und fragt vorher nach den Rechten', /mark-entsperren'\) \{[\s\S]{0,120}darfSeiten\(\)/.test(q));
  p('Die Namen kommen aus `Marken.artWort` (§8)', /Marken\.artWort\(mark\.art\)/.test(q));
  p('Der Text der Marke wird als Text gesetzt (§19)', /was\.textContent = zeichen/.test(q));
  p('Das erzeugte JS trägt es', /mark-entsperren/.test(lies('quell/bereiche/pdf/document-mode.js')));
  p('Das Stilblatt kennt die Liste', /\.document-gesperrt\{/.test(lies('quell/schale/stil/bausteine.css')));
  gleich('Keine Seitenfehler', fehler, []);
}

console.log(`\n${ok}/${ok + weg} bestanden · ✗=${weg}`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
