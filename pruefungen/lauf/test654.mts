/* ============================================================================
 * test654 — Die Einstellungen wie die iPhone-Einstellungen, mit Redions
 *           eigenen Mitteln (E812)
 * ----------------------------------------------------------------------------
 * Redur, 24. November 2026: „Die Einstellungen aufräumen, sie sollen wie die
 * iPhone-Einstellungen sein." Gemeint ist der AUFBAU, nicht ein Abbild: keine
 * Apple-Grafiken, keine Apple-Texte. Jede Zusage hat zwei Hälften — was jetzt
 * wie dort aussieht, und dass der Griff dahinter noch da ist (§43, E218).
 *
 * WAS DIESER LAUF HÄLT
 *   §1  Gruppen-Karten: die Bereiche stehen in Karten mit runden Ecken, je
 *       Gruppe eine Karte, darüber eine kleine graue Überschrift. Die 20
 *       Bereiche stehen mit denselben Kennungen, Wörtern und in derselben
 *       Folge wie vorher (§5 Regel 1 / test580 §3 / test32).
 *   §2  Zeilen: mindestens 44 px hoch, links ein farbiges Quadrat mit
 *       weissem Zeichen, rechts ein Pfeil „›", Trennlinie ab dem Text.
 *   §3  Hell und dunkel: die Karte hebt sich vom Grund ab (dunkel: die Karte
 *       ist etwas heller, wie bei iOS). Gemessen an gerenderten Farben.
 *   §4  Telefon: die Liste ist eine Seite mit grossem Titel und Suche;
 *       Antippen öffnet die Detailseite mit „‹ Einstellungen" zum Zurück.
 *       Zurück, Escape und Enter funktionieren.
 *   §5  Rechner: links die gruppierte Liste, rechts die Detailseite; der
 *       gewählte Bereich ist markiert, und rechts wechselt der Inhalt.
 *   §6  Detailseite: die Zeilen (`.ez-zeile`) stehen in Karten (`.ez-karte`),
 *       jede Zeile mindestens 44 px hoch.
 *   §7  Suche: tippen blendet Bereiche und leere Gruppen aus; leeren stellt
 *       alles wieder her. Die Griffe bleiben im Baum.
 *   §8  Tastatur: Tab erreicht jede Zeile mit sichtbarem Fokus.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 *   Vor dem Umbau (Stand 2d6038e) ist sie rot: es gibt keine Karten, keine
 *   Suche, keine Titelzeile. Das ist die Gegenprobe; sie steht im Bericht.
 *   Eine Zeile, die grün bleibt, wenn der Umbau fehlt, ist ein Fehler dieses
 *   Laufs.
 *
 *   node pruefungen/alle.mts 654
 * ==========================================================================*/
import { chromium } from 'playwright';
import type { Page, BrowserContext } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const TYP: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon', '.svg': 'image/svg+xml'
};
const server = http.createServer((a, b) => {
  const rein = decodeURIComponent((a.url ?? '/').split('?')[0] ?? '/');
  const datei = path.join(WURZEL, rein === '/' ? 'index.html' : rein.slice(1));
  if (!datei.startsWith(WURZEL) || !fs.existsSync(datei) || fs.statSync(datei).isDirectory()) {
    b.writeHead(404); b.end(); return;
  }
  b.writeHead(200, { 'Content-Type': TYP[path.extname(datei)] ?? 'application/octet-stream' });
  b.end(fs.readFileSync(datei));
});
/* Ein freier Port vom System — kein fester, damit nichts zusammenstösst. */
await new Promise<void>(f => server.listen(0, '127.0.0.1', () => f()));
const PORT = (server.address() as { port: number }).port;

let ok = 0, weg = 0;
const p = (n: string, wahr: unknown, extra = ''): void => {
  if (wahr) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll),
    `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

const browser = await chromium.launch();
const fehler: string[] = [];
const warte = (s: Page, ms: number) => s.waitForTimeout(ms);

/* Die 20 Bereiche in ihrer Folge (Kennung, Wort). Der Bestand hat 20 —
   `geraete` (iPhone und Windows) gehört dazu; test32 und test580 zählen noch
   19 und sind deshalb schon vor diesem Umbau rot (siehe Bericht E812). */
const BEREICHE = ['konto=Mein Konto', 'allgemein=Einstellungen', 'benachricht=Benachrichtigungen',
  'daten=Importieren', 'ki=Künstliche Intelligenz', 'verbindungen=Verbindungen', 'mcp=MCP',
  'worker=Worker', 'verifiziert=Verifizierte Seiten', 'oeffentlich=Öffentliche Seiten', 'emoji=Emoji',
  'geraete=iPhone und Windows', 'arbeitsplatz=Arbeitsbereich', 'analysen=Analysen', 'bereiche=Bereiche',
  'sicherheit=Sicherheit', 'schluessel=Schlüssel und APIs', 'speicher=Speicher', 'abrechnung=Abrechnung',
  'ueber=Über diese App'];
const KENNUNGEN = BEREICHE.map(x => x.split('=')[0]);
const WOERTER = BEREICHE.map(x => x.split('=')[1]);

/** Die App öffnen. Telefon 390 × 844 mit Tastgerät, Rechner 1440 × 900. */
const oeffnen = async (handy: boolean, thema: 'light' | 'dark', weniger = false): Promise<{ ctx: BrowserContext; s: Page }> => {
  const ctx = await browser.newContext({
    viewport: handy ? { width: 390, height: 844 } : { width: 1440, height: 900 },
    reducedMotion: weniger ? 'reduce' : 'no-preference',
    ...(handy ? { isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : {})
  });
  const s = await ctx.newPage();
  s.on('pageerror', e => fehler.push(e.message));
  await s.goto(`http://127.0.0.1:${PORT}/index.html`);
  await s.waitForFunction(() => typeof App !== 'undefined' && typeof Store !== 'undefined' &&
    (document.getElementById('tree')?.children.length || 0) > 0, null, { timeout: 30000 });
  await s.evaluate((t: string) => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung')
      .forEach(el => el.remove());
    App.theme(t);
  }, thema);
  await s.mouse.move(2, 2);
  return { ctx, s };
};

/* Farben aus der Berechnung des Browsers lesen: „rgb(r, g, b)" oder „rgba(…)". */
const farbe = (text: string): { r: number; g: number; b: number; a: number } | null => {
  const m = /^rgba?\(([^)]+)\)$/.exec(text.trim());
  if (!m) return null;
  const t = (m[1] ?? '').split(/[ ,\/]+/).filter(Boolean).map(Number);
  if (t.length < 3) return null;
  return { r: t[0] ?? 0, g: t[1] ?? 0, b: t[2] ?? 0, a: t.length > 3 ? (t[3] ?? 1) : 1 };
};
const hell = (c: { r: number; g: number; b: number }) => (c.r + c.g + c.b) / 3;

/* ══ §1 Gruppen-Karten — dieselben Bereiche, dieselbe Folge ═══════════════ */
console.log('\n§1 Gruppen-Karten — 20 Bereiche in Karten, dieselben Kennungen und Wörter');
for (const handy of [false, true]) {
  const g = handy ? 'Telefon' : 'Rechner';
  const { ctx, s } = await oeffnen(handy, 'light');
  await s.evaluate(() => (window as any).Einstellungen.oeffne());
  await warte(s, 600);
  const z = await s.evaluate(() => {
    const kn = [...document.querySelectorAll<HTMLElement>('.einst-nav button[data-b]')];
    const karten = [...document.querySelectorAll<HTMLElement>('.einst-nav .einst-karte')];
    return {
      kennungen: kn.map(b => b.dataset.b),
      woerter: kn.map(b => (b.textContent ?? '').trim()),
      karten: karten.length,
      inKarte: kn.filter(b => b.parentElement?.classList.contains('einst-karte')).length,
      kopfe: [...document.querySelectorAll<HTMLElement>('.einst-nav .einst-grp')].map(x => x.textContent),
      radius: karten.map(k => parseFloat(getComputedStyle(k).borderRadius) || 0)
    };
  });
  gleich(`${g} · dieselben Kennungen in derselben Folge`, z.kennungen, KENNUNGEN);
  gleich(`${g} · dieselben Wörter`, z.woerter, WOERTER);
  p(`${g} · genau vier Gruppen-Karten, jede mit runden Ecken (≥ 10 px)`,
    z.karten === 4 && z.radius.every(r => r >= 10), JSON.stringify({ karten: z.karten, radius: z.radius }));
  p(`${g} · jeder Bereich steht in einer Karte`, z.inKarte === 20, `${z.inKarte} von 20`);
  gleich(`${g} · die grauen Überschriften der Gruppen`, z.kopfe, ['Funktionen', 'Verwaltung', 'Zugriff und Abrechnung']);
  await ctx.close();
}

/* ══ §2 Zeilen — 44 px, Zeichen-Quadrat, Pfeil ════════════════════════════ */
console.log('\n§2 Zeilen — mindestens 44 px, farbiges Quadrat mit weissem Zeichen, Pfeil');
for (const handy of [false, true]) {
  const g = handy ? 'Telefon' : 'Rechner';
  const { ctx, s } = await oeffnen(handy, 'light');
  await s.evaluate(() => (window as any).Einstellungen.oeffne());
  await warte(s, 600);
  const z = await s.evaluate(() => {
    const kn = [...document.querySelectorAll<HTMLElement>('.einst-nav button[data-b]')];
    return kn.map(b => {
      const mi = b.querySelector<HTMLElement>('.mi');
      const svg = mi?.querySelector<HTMLElement>('svg');
      const r = b.getBoundingClientRect();
      const q = mi?.getBoundingClientRect();
      const pfeil = getComputedStyle(b, '::after').content;
      /* Die Trennlinie ist ein Verlauf als HINTERGRUNDBILD der Zeile, keine
         eigene Lage: die Zeile bleibt `static` (test623 §3a). Die erste Zeile
         einer Karte hat keine Linie darüber. */
      const erste = b.parentElement?.firstElementChild === b;
      return {
        id: b.dataset.b,
        hoehe: Math.round(r.height),
        quadrat: q ? Math.round(q.width) : 0,
        quadratHoehe: q ? Math.round(q.height) : 0,
        hintergrund: mi ? getComputedStyle(mi).backgroundColor : '',
        zeichenFarbe: svg ? getComputedStyle(svg).color : '',
        pfeil: pfeil.includes('›'),
        trennlinie: erste ? true : getComputedStyle(b).backgroundImage.includes('gradient'),
        lage: getComputedStyle(b).position
      };
    });
  });
  p(`${g} · jede Zeile ≥ 44 px hoch`, z.every(x => x.hoehe >= 44),
    JSON.stringify(z.filter(x => x.hoehe < 44).map(x => [x.id, x.hoehe])));
  p(`${g} · jedes Quadrat etwa 29 px und farbig`, z.every(x => x.quadrat >= 28 && x.quadrat <= 32 && x.quadratHoehe >= 28 &&
      x.hintergrund !== '' && x.hintergrund !== 'rgba(0, 0, 0, 0)' && x.hintergrund !== 'transparent'),
    JSON.stringify(z.filter(x => !(x.quadrat >= 28 && x.quadrat <= 32)).map(x => [x.id, x.quadrat, x.hintergrund])));
  p(`${g} · das Zeichen im Quadrat ist weiss`, z.every(x => x.zeichenFarbe === 'rgb(255, 255, 255)'),
    JSON.stringify(z.filter(x => x.zeichenFarbe !== 'rgb(255, 255, 255)').slice(0, 3).map(x => [x.id, x.zeichenFarbe])));
  p(`${g} · jede Zeile hat den Pfeil „›"`, z.every(x => x.pfeil), JSON.stringify(z.filter(x => !x.pfeil).map(x => x.id)));
  p(`${g} · Trennlinie ab dem Text (Zeilen nach der ersten)`,
    z.slice(1).every(x => x.trennlinie), JSON.stringify(z.slice(1).filter(x => !x.trennlinie).map(x => x.id)));
  p(`${g} · keine Zeile hat eine eigene Lage (static, wie im Klassischen — test623 §3a)`,
    z.every(x => x.lage === 'static'), JSON.stringify(z.filter(x => x.lage !== 'static').map(x => [x.id, x.lage])));
  await ctx.close();
}

/* ══ §3 Hell und dunkel — die Karte hebt sich vom Grund ab ════════════════ */
console.log('\n§3 Hell und dunkel — die Karte hebt sich vom Grund ab');
for (const thema of ['light', 'dark'] as const) {
  const { ctx, s } = await oeffnen(false, thema);
  await s.evaluate(() => (window as any).Einstellungen.oeffne());
  await warte(s, 600);
  const z = await s.evaluate(() => {
    const fenster = document.querySelector<HTMLElement>('.einst-fenster');
    const karte = document.querySelector<HTMLElement>('.einst-nav .einst-karte');
    return {
      grund: fenster ? getComputedStyle(fenster).backgroundColor : '',
      karte: karte ? getComputedStyle(karte).backgroundColor : ''
    };
  });
  const g = farbe(z.grund), k = farbe(z.karte);
  p(`${thema === 'light' ? 'Hell' : 'Dunkel'} · Grund und Karte sind verschiedene, deckende Farben`,
    !!g && !!k && g.a > 0.9 && k.a > 0.9 && (Math.abs(g.r - k.r) + Math.abs(g.g - k.g) + Math.abs(g.b - k.b)) >= 12,
    JSON.stringify({ grund: z.grund, karte: z.karte }));
  if (g && k) {
    /* Hell: Karte heller als Grund (weiss auf grau). Dunkel: Karte heller als
       Grund (iOS). In beiden Fällen ist die Karte die hellere Fläche. */
    p(`${thema === 'light' ? 'Hell' : 'Dunkel'} · die Karte ist heller als der Grund`,
      hell(k) > hell(g), `Karte ${hell(k).toFixed(1)}, Grund ${hell(g).toFixed(1)}`);
  }
  await ctx.close();
}

/* ══ §4 Telefon — Liste, Detailseite, Zurück ══════════════════════════════ */
console.log('\n§4 Telefon — Liste mit Titel und Suche, Antippen öffnet, Zurück führt zurück');
{
  const { ctx, s } = await oeffnen(true, 'light');
  await s.evaluate(() => (window as any).Einstellungen.oeffne());
  await warte(s, 600);
  const titel = await s.evaluate(() => {
    const t = document.querySelector<HTMLElement>('.einst-nav .einst-titel');
    const sf = document.querySelector<HTMLElement>('.einst-nav .einst-suche');
    return { titel: t?.textContent?.trim() ?? '', titelHoehe: t ? Math.round(t.getBoundingClientRect().height) : 0,
             suche: !!sf, sucheHoehe: sf ? Math.round(sf.getBoundingClientRect().height) : 0,
             blick: document.querySelector('.einst-fenster')?.getAttribute('data-blick') };
  });
  gleich('Telefon · die Liste heisst „Einstellungen" (grosser Titel)', titel.titel, 'Einstellungen');
  p('Telefon · die Suche steht unter dem Titel, ≥ 44 px hoch', titel.suche && titel.sucheHoehe >= 44,
    JSON.stringify(titel));
  gleich('Telefon · am Anfang steht die Liste', titel.blick, 'liste');

  await s.click('.einst-nav button[data-b="ki"]');
  await warte(s, 900);
  const bereich = await s.evaluate(() => ({
    blick: document.querySelector('.einst-fenster')?.getAttribute('data-blick'),
    zurueck: (document.querySelector('.einst-zurueck') as HTMLElement | null)?.textContent?.trim() ?? '',
    zurueckSichtbar: (() => { const z = document.querySelector('.einst-zurueck') as HTMLElement | null;
      return !!z && getComputedStyle(z).display !== 'none' && z.getBoundingClientRect().height >= 44; })()
  }));
  gleich('Telefon · Antippen öffnet die Detailseite', bereich.blick, 'bereich');
  p('Telefon · Zurück-Knopf sichtbar, ≥ 44 px, mit „‹ Einstellungen"',
    bereich.zurueckSichtbar && bereich.zurueck.includes('Einstellungen') && bereich.zurueck.includes('‹'),
    JSON.stringify(bereich));

  await s.click('.einst-zurueck');
  await warte(s, 900);
  gleich('Telefon · Zurück führt zur Liste', await s.evaluate(() =>
    document.querySelector('.einst-fenster')?.getAttribute('data-blick')), 'liste');

  await s.click('.einst-nav button[data-b="ki"]');
  await warte(s, 900);
  await s.keyboard.press('Escape');
  await warte(s, 700);
  gleich('Telefon · Escape führt von der Detailseite zur Liste', await s.evaluate(() =>
    document.querySelector('.einst-fenster')?.getAttribute('data-blick')), 'liste');

  /* Enter auf einer Zeile öffnet sie — die Tastatur kommt vor dem Finger. */
  await s.focus('.einst-nav button[data-b="daten"]');
  await s.keyboard.press('Enter');
  await warte(s, 900);
  gleich('Telefon · Enter auf einer Zeile öffnet den Bereich', await s.evaluate(() =>
    document.querySelector('.einst-fenster')?.getAttribute('data-blick')), 'bereich');
  await ctx.close();
}

/* ══ §5 Rechner — links die Liste, rechts die Detailseite ═════════════════ */
console.log('\n§5 Rechner — links die gruppierte Liste, rechts die Detailseite');
{
  const { ctx, s } = await oeffnen(false, 'light');
  await s.evaluate(() => (window as any).Einstellungen.oeffne());
  await warte(s, 600);
  const spalten = await s.evaluate(() => {
    const n = document.querySelector('.einst-nav')?.getBoundingClientRect();
    const i = document.querySelector('.einst-inhalt')?.getBoundingClientRect();
    return { navLinks: n ? Math.round(n.left) : -1, navBreite: n ? Math.round(n.width) : 0,
             inhaltRechts: i ? Math.round(i.left) : -1, inhaltBreite: i ? Math.round(i.width) : 0 };
  });
  p('Rechner · links die Liste (≥ 260 px), rechts der Inhalt, nebeneinander',
    spalten.navBreite >= 260 && spalten.inhaltRechts >= spalten.navLinks + spalten.navBreite - 2 &&
    spalten.inhaltBreite >= 400, JSON.stringify(spalten));
  const vorher = await s.evaluate(() => document.querySelector('.einst-inhalt')?.innerHTML.length ?? 0);
  await s.click('.einst-nav button[data-b="verbindungen"]');
  await warte(s, 500);
  const nachher = await s.evaluate(() => ({
    an: document.querySelector('.einst-nav button.on')?.getAttribute('data-b'),
    lange: document.querySelector('.einst-inhalt')?.innerHTML.length ?? 0
  }));
  gleich('Rechner · der gewählte Bereich ist markiert', nachher.an, 'verbindungen');
  p('Rechner · rechts wechselt der Inhalt', nachher.lange !== vorher, `${vorher} → ${nachher.lange}`);
  await ctx.close();
}

/* ══ §6 Detailseite — Zeilen in Karten, mindestens 44 px ═════════════════ */
console.log('\n§6 Detailseite — die Zeilen stehen in Karten');
{
  const { ctx, s } = await oeffnen(false, 'light');
  await s.evaluate(() => (window as any).Einstellungen.oeffne('allgemein'));
  await warte(s, 700);
  const z = await s.evaluate(() => {
    const karten = [...document.querySelectorAll<HTMLElement>('#ei .ez-karte')];
    const grund = getComputedStyle(document.querySelector('.einst-fenster') as HTMLElement).backgroundColor;
    return {
      anzahl: karten.length,
      alleZeilen: karten.reduce((n, k) => n + k.querySelectorAll(':scope > .ez-zeile').length, 0),
      kartenFarben: karten.map(k => getComputedStyle(k).backgroundColor),
      grund,
      zeilenHoehe: karten.flatMap(k => [...k.querySelectorAll<HTMLElement>(':scope > .ez-zeile')])
        .map(r => Math.round(r.getBoundingClientRect().height)),
      radius: karten.map(k => parseFloat(getComputedStyle(k).borderRadius) || 0)
    };
  });
  p('Detailseite · die Zeilen stehen in Karten (mindestens eine)', z.anzahl >= 1 && z.alleZeilen >= 2,
    JSON.stringify({ anzahl: z.anzahl, zeilen: z.alleZeilen }));
  p('Detailseite · jede Karte hat runde Ecken (≥ 10 px) und eine eigene Fläche',
    z.radius.every(r => r >= 10) && z.kartenFarben.every(f => f !== z.grund && f !== 'rgba(0, 0, 0, 0)'),
    JSON.stringify({ radius: z.radius, farben: z.kartenFarben, grund: z.grund }));
  p('Detailseite · jede Zeile in einer Karte ≥ 44 px hoch', z.zeilenHoehe.length > 0 && z.zeilenHoehe.every(h => h >= 44),
    JSON.stringify(z.zeilenHoehe.filter(h => h < 44)));
  await ctx.close();
}

/* ══ §7 Suche — tippen blendet aus, leeren stellt her ═════════════════════ */
console.log('\n§7 Suche — Bereiche und leere Gruppen blenden aus, die Griffe bleiben');
{
  const { ctx, s } = await oeffnen(false, 'light');
  await s.evaluate(() => (window as any).Einstellungen.oeffne());
  await warte(s, 600);
  const sichtbar = () => s.evaluate(() => [...document.querySelectorAll<HTMLElement>('.einst-nav button[data-b]')]
    .filter(b => getComputedStyle(b).display !== 'none' && !b.hidden).map(b => b.dataset.b));
  await s.fill('.einst-nav .einst-suche', 'verb');
  await warte(s, 300);
  gleich('Suche „verb" zeigt nur „Verbindungen"', await sichtbar(), ['verbindungen']);
  await s.fill('.einst-nav .einst-suche', 'zzzz');
  await warte(s, 300);
  const leer = await s.evaluate(() => ({
    sichtbar: [...document.querySelectorAll<HTMLElement>('.einst-nav button[data-b]')]
      .filter(b => getComputedStyle(b).display !== 'none').length,
    karten: [...document.querySelectorAll<HTMLElement>('.einst-nav .einst-karte')]
      .filter(k => getComputedStyle(k).display !== 'none').length,
    gesamt: document.querySelectorAll('.einst-nav button[data-b]').length
  }));
  gleich('Suche ohne Treffer: keine Zeile, keine Karte sichtbar, alle 20 im Baum', leer, { sichtbar: 0, karten: 0, gesamt: 20 });
  await s.fill('.einst-nav .einst-suche', '');
  await warte(s, 300);
  gleich('Suche geleert: alle 20 Bereiche wieder da', (await sichtbar()).length, 20);
  await ctx.close();
}

/* ══ §8 Tastatur — Tab erreicht jede Zeile, mit sichtbarem Fokus ══════════ */
console.log('\n§8 Tastatur — Tab erreicht die Zeilen, Fokus sichtbar');
{
  const { ctx, s } = await oeffnen(false, 'light');
  await s.evaluate(() => (window as any).Einstellungen.oeffne());
  await warte(s, 600);
  await s.focus('.einst-nav .einst-suche');
  await s.keyboard.press('Tab');
  const erste = await s.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    return { b: el?.dataset.b ?? '', umriss: el ? getComputedStyle(el).outlineStyle : '' };
  });
  gleich('Tab aus der Suche landet auf der ersten Zeile', erste.b, 'konto');
  p('Die fokussierte Zeile hat einen sichtbaren Umriss', erste.umriss !== 'none', erste.umriss);
  await ctx.close();
}

/* ══ §10 Bewegung wie eine iOS-App (E812, Zusatz) ═════════════════════════ */
console.log('\n§10 Bewegung — Telefon fährt wie ein Navigationsstapel, Wischen, Glasleiste, Blatt, Überblenden');
/* Ein Auslöser; danach Bild für Bild der Abstand der Detailseite und der Liste zum linken Rand. */
const fahrt = (s: Page, auslöser: string, dauer = 900) =>
  s.evaluate(([aus, ms]: [string, number]) => new Promise<{ detail: number[]; liste: number[]; typen: string[]; trans: string[] }>(res => {
    const detail = document.querySelector<HTMLElement>('.einst-inhalt')!;
    const liste = document.querySelector<HTMLElement>('.einst-nav')!;
    const d: number[] = [], l: number[] = [];
    const typen = new Set<string>();
    const t0 = performance.now();
    /* Der Startwert VOR dem Klick — sonst sähe ein sofortiger Wechsel wie der Anfang aus. */
    d.push(Math.round(detail.getBoundingClientRect().left * 10) / 10);
    l.push(Math.round(liste.getBoundingClientRect().left * 10) / 10);
    const tick = () => {
      d.push(Math.round(detail.getBoundingClientRect().left * 10) / 10);
      l.push(Math.round(liste.getBoundingClientRect().left * 10) / 10);
      for (const a of document.getAnimations()) {
        const pr = (a as any).transitionProperty as string | undefined;
        if (pr) typen.add(pr);
      }
      if (performance.now() - t0 < ms) requestAnimationFrame(tick);
      else res({ detail: d, liste: l, typen: [...typen], trans: [detail, liste].map(e => getComputedStyle(e).transitionProperty) });
    };
    requestAnimationFrame(tick);
    (document.querySelector(aus) as HTMLElement | null)?.click();
  }), [auslöser, dauer] as [string, number]);
const zwischen = (werte: number[], lo: number, hi: number) => werte.filter(x => x > lo && x < hi).length;

{
  const { ctx, s } = await oeffnen(true, 'light');
  await s.evaluate(() => (window as any).Einstellungen.oeffne());
  await warte(s, 1000); /* das Blatt braucht seine 796 ms, bevor gemessen wird */
  const hin = await fahrt(s, '.einst-nav button[data-b="ki"]');
  p('Telefon · die Detailseite schiebt von rechts: Zwischenwerte zwischen 390 und 0 (Bild für Bild)',
    zwischen(hin.detail, 2, 388) >= 3, `Werte ${JSON.stringify(hin.detail.slice(0, 12))}`);
  p('Telefon · die Detailseite beginnt rechts ausserhalb (≥ 380) und endet genau bei 0', (hin.detail[0] ?? 0) >= 380 && hin.detail[hin.detail.length - 1] === 0,
    String(hin.detail[hin.detail.length - 1]));
  p('Telefon · die Liste wandert gleichzeitig nach links (Versatz unter 0, etwa 30 %)',
    Math.min(...hin.liste) <= -60 && Math.min(...hin.liste) >= -130, `Minimum ${Math.min(...hin.liste)}`);
  p('Telefon · während der Fahrt bewegen sich nur transform und opacity',
    hin.typen.every(t => t === 'transform' || t === 'opacity') && hin.trans.every(t => t.split(',').map(x => x.trim()).every(x => x === 'transform' || x === 'opacity')),
    JSON.stringify({ typen: hin.typen, trans: hin.trans }));
  const zurueck = await fahrt(s, '.einst-zurueck');
  p('Telefon · „‹ Einstellungen" spielt es rückwärts: Zwischenwerte, Ende genau bei der Liste',
    (zurueck.detail[0] ?? 999) <= 2 && zwischen(zurueck.detail, 2, 388) >= 3 && zurueck.detail[zurueck.detail.length - 1] === 390,
    `Ende ${zurueck.detail[zurueck.detail.length - 1]}`);
  await ctx.close();
}

/* Wischen vom linken Rand: langer Zug zurück, kurzer Zug federt zurück. */
{
  const { ctx, s } = await oeffnen(true, 'light');
  const cdp = await ctx.newCDPSession(s);
  const wisch = async (x0: number, x1: number) => {
    await s.evaluate(() => (window as any).Einstellungen.oeffne());
    await warte(s, 400);
    await s.click('.einst-nav button[data-b="ki"]');
    await warte(s, 800);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x0, y: 400 }] });
    for (let x = x0 + 20; x <= x1; x += 20) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: 402 }] });
      await warte(s, 16);
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await warte(s, 900);
    return s.evaluate(() => document.querySelector('.einst-fenster')?.getAttribute('data-blick'));
  };
  gleich('Wischen vom Rand über die Mitte: die Liste ist wieder da', await wisch(10, 300), 'liste');
  gleich('Kurzer Wisch vom Rand: die Detailseite bleibt', await wisch(10, 60), 'bereich');
  await ctx.close();
}

/* Grosser Titel → kleine Glasleiste beim Rollen. */
{
  const { ctx, s } = await oeffnen(true, 'light');
  await s.evaluate(() => (window as any).Einstellungen.oeffne('ki'));
  await warte(s, 600);
  const vorher = await s.evaluate(() => {
    const t = document.querySelector<HTMLElement>('.einst-inhalt .einst-leiste-titel');
    return t ? getComputedStyle(t).opacity : 'fehlt';
  });
  await s.evaluate(() => { const i = document.querySelector<HTMLElement>('#ei'); if (i) i.scrollTop = 400; });
  await warte(s, 1000);
  const gerollt = await s.evaluate(() => {
    const l = document.querySelector<HTMLElement>('.einst-inhalt > .einst-leiste');
    const t = l?.querySelector<HTMLElement>('.einst-leiste-titel');
    if (!l || !t) return { da: false };
    const cs = getComputedStyle(l);
    return { da: true, titel: getComputedStyle(t).opacity, glas: cs.backdropFilter || (cs as any).webkitBackdropFilter || 'none',
      traegt: CSS.supports('backdrop-filter', 'blur(1px)') || CSS.supports('-webkit-backdrop-filter', 'blur(1px)'),
      linie: getComputedStyle(l, '::after').opacity, name: t.textContent?.trim() ?? '' };
  });
  p('Telefon · vor dem Rollen steht der kleine Titel nicht in der Leiste', vorher === '0', `opacity ${vorher}`);
  p('Telefon · nach dem Rollen erscheint die kleine Leiste mit ihrem Titel', gerollt.da === true && gerollt.titel === '1' && gerollt.name === 'Künstliche Intelligenz',
    JSON.stringify(gerollt));
  p('Telefon · nach dem Rollen ist die Leiste Glas (blur), wo der Browser es kann', !gerollt.traegt || (String(gerollt.glas).includes('blur')),
    String(gerollt.glas));
  p('Telefon · nach dem Rollen erscheint die Haarlinie', gerollt.linie === '1', String(gerollt.linie));
  await ctx.close();
}

/* Starker Kontrast: kein Glas, deckend. */
{
  const { ctx, s } = await oeffnen(true, 'light');
  await s.evaluate(() => (window as any).Einstellungen.oeffne('ki'));
  await warte(s, 500);
  await s.evaluate(() => { document.body.classList.add('kontrast'); document.body.dataset.kontrast = 'hoch';
    const i = document.querySelector<HTMLElement>('#ei'); if (i) i.scrollTop = 400; });
  await warte(s, 400);
  const k = await s.evaluate(() => { const l = document.querySelector<HTMLElement>('.einst-inhalt > .einst-leiste');
    const cs = l ? getComputedStyle(l) : null; return cs ? (cs.backdropFilter || (cs as any).webkitBackdropFilter || 'none') : 'fehlt'; });
  p('Starker Kontrast · die Leiste hat kein Glas (backdrop-filter none)', k === 'none', k);
  await ctx.close();
}

/* Weniger Bewegung: „Ruhige Darstellung" und prefers-reduced-motion — Wechsel im ersten Bild. */
for (const [nam, weniger, ruhig] of [['Ruhige Darstellung', false, true], ['prefers-reduced-motion', true, false]] as const) {
  const { ctx, s } = await oeffnen(true, 'light', weniger);
  if (ruhig) await s.evaluate(() => { document.body.dataset.bewegung = 'ruhig'; });
  await s.evaluate(() => (window as any).Einstellungen.oeffne());
  await warte(s, 1000); /* das Blatt braucht seine 796 ms, bevor gemessen wird */
  const r = await fahrt(s, '.einst-nav button[data-b="ki"]', 600);
  p(`${nam} · kein Zwischenwert: die Detailseite ist im ersten Bild da`,
    (r.detail[0] ?? 0) >= 380 && zwischen(r.detail, 2, 388) === 0 && r.detail[r.detail.length - 1] === 0, JSON.stringify(r.detail.slice(0, 6)));
  await ctx.close();
}

/* Rechner: der Bereichswechsel blendet über, er schiebt nicht. */
{
  const { ctx, s } = await oeffnen(false, 'light');
  await s.evaluate(() => (window as any).Einstellungen.oeffne('allgemein'));
  await warte(s, 600);
  const ueber = await s.evaluate(() => new Promise<{ start: string; ende: string }>(res => {
    const ei = document.querySelector<HTMLElement>('#ei')!;
    const werte: number[] = [];
    const t0 = performance.now();
    const tick = () => { werte.push(Number(getComputedStyle(ei).opacity));
      if (performance.now() - t0 < 400) requestAnimationFrame(tick);
      else res({ start: String(werte[0]), ende: String(werte[werte.length - 1]) }); };
    requestAnimationFrame(tick);
    (document.querySelector('.einst-nav button[data-b="verbindungen"]') as HTMLElement).click();
  }));
  p('Rechner · der Wechsel blendet über (opacity beginnt unter 1 und endet bei 1)',
    Number(ueber.start) < 1 && Number(ueber.ende) === 1, JSON.stringify(ueber));
  await ctx.close();
}

/* ══ §9 Kontrast — Zeichen auf dem Quadrat, Name auf dem Akzent ═══════════ */
console.log('\n§9 Kontrast — weisses Zeichen auf dem Quadrat ≥ 3 : 1 (§38, WCAG 1.4.11); Name auf dem Akzent ≥ 4,5 : 1');
{
  const { ctx, s } = await oeffnen(false, 'light');
  /* Jedes Schema (hell und dunkel) durchmessen — wie test584 es tut. */
  const schemata = await s.evaluate(() => (window as any).Aussehen.SCHEMATA.map((x: { id: string }) => x.id)) as string[];
  const rechnung = await s.evaluate(async (liste: string[]) => {
    /* Gerenderte Farbe über eine 1×1-Leinwand: auch `color-mix(…)` kommt als Zahl an.
       Ein ungültiger Wert lässt den Sentinel stehen — das zählt als Fehler. */
    const kanal = (css: string): [number, number, number] | null => {
      const c = document.createElement('canvas'); c.width = c.height = 1;
      const x = c.getContext('2d'); if (!x) return null;
      x.fillStyle = '#010203'; x.fillStyle = css;
      if (x.fillStyle === '#010203' && css.trim().toLowerCase() !== '#010203') return null;
      x.fillRect(0, 0, 1, 1);
      const d = x.getImageData(0, 0, 1, 1).data;
      return [d[0] ?? 0, d[1] ?? 0, d[2] ?? 0];
    };
    const lum = (c: [number, number, number]) => {
      const f = (v: number) => { const u = v / 255; return u <= 0.03928 ? u / 12.92 : Math.pow((u + 0.055) / 1.055, 2.4); };
      return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
    };
    const kontrast = (a: [number, number, number], b: [number, number, number]) => {
      const la = lum(a), lb = lum(b);
      return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
    };
    const WEISS: [number, number, number] = [255, 255, 255];
    const ergebnisse: Array<{ schema: string; thema: string; quadratMin: number; quadratWer: string; akzentName: number; zeichenGewaehlt: number; ungueltig: number }> = [];
    for (const id of liste) {
      (window as any).Aussehen.setzen({ schema: id, akzent: '' });
      (window as any).Einstellungen.oeffne();
      await new Promise(r => setTimeout(r, 250));
      const thema = document.documentElement.dataset.theme ?? '';
      let min = Infinity, wer = '', ungueltig = 0;
      document.querySelectorAll<HTMLElement>('.einst-nav button[data-b]').forEach(b => {
        const mi = b.querySelector<HTMLElement>('.mi');
        const rgb = mi ? kanal(getComputedStyle(mi).backgroundColor) : null;
        if (!rgb) { ungueltig++; return; }
        const k = kontrast(WEISS, rgb);
        if (k < min) { min = k; wer = (b.dataset.b ?? '') + ' ' + getComputedStyle(mi!).backgroundColor; }
      });
      /* Die gewählte Zeile: „verbindungen" anklicken, dann Name auf Akzent. */
      const zeile = document.querySelector<HTMLElement>('.einst-nav button[data-b="verbindungen"]');
      zeile?.click();
      await new Promise(r => setTimeout(r, 250));
      const on = document.querySelector<HTMLElement>('.einst-nav button.on');
      const akzentName = on ? (() => {
        const bg = kanal(getComputedStyle(on).backgroundColor);
        const txt = kanal(getComputedStyle(on).color);
        return bg && txt ? kontrast(txt, bg) : 0;
      })() : 0;
      /* Das Zeichen der gewählten Zeile gegen SEIN Quadrat. */
      const gMi = on?.querySelector<HTMLElement>('.mi') ?? null;
      const gSvg = on?.querySelector<HTMLElement>('svg') ?? null;
      const zeichenGewaehlt = gMi && gSvg ? (() => {
        const q = kanal(getComputedStyle(gMi).backgroundColor);
        const z = kanal(getComputedStyle(gSvg).color);
        return q && z ? kontrast(z, q) : 0;
      })() : 0;
      ergebnisse.push({ schema: id, thema, quadratMin: Math.round(min * 100) / 100, quadratWer: wer,
        akzentName: Math.round(akzentName * 100) / 100, zeichenGewaehlt: Math.round(zeichenGewaehlt * 100) / 100, ungueltig });
    }
    (window as any).Aussehen.setzen({ schema: 'standard', akzent: '' });
    return ergebnisse;
  }, schemata);
  const hell = rechnung.filter(r => r.thema === 'light'), dunkel = rechnung.filter(r => r.thema === 'dark');
  const minQuadrat = (liste: typeof rechnung) => Math.min(...liste.map(r => r.quadratMin));
  p('Hell: mindestens ein Schema gemessen, und jedes Quadrat ≥ 3 : 1 gegen Weiss',
    hell.length > 0 && minQuadrat(hell) >= 3 && hell.every(r => r.ungueltig === 0),
    `kleinster Wert ${minQuadrat(hell)} bei ${hell.find(r => r.quadratMin === minQuadrat(hell))?.quadratWer}`);
  p('Dunkel: mindestens ein Schema gemessen, und jedes Quadrat ≥ 3 : 1 gegen Weiss',
    dunkel.length > 0 && minQuadrat(dunkel) >= 3 && dunkel.every(r => r.ungueltig === 0),
    `kleinster Wert ${minQuadrat(dunkel)} bei ${dunkel.find(r => r.quadratMin === minQuadrat(dunkel))?.quadratWer}`);
  p('In allen Schemata: der Name der gewählten Zeile auf dem Akzent ≥ 4,5 : 1',
    rechnung.length > 0 && rechnung.every(r => r.akzentName >= 4.5),
    JSON.stringify(rechnung.filter(r => r.akzentName < 4.5).map(r => [r.schema, r.akzentName])));
  p('In allen Schemata: das Zeichen der gewählten Zeile ≥ 3 : 1 gegen sein Quadrat',
    rechnung.length > 0 && rechnung.every(r => r.zeichenGewaehlt >= 3),
    JSON.stringify(rechnung.filter(r => r.zeichenGewaehlt < 3).map(r => [r.schema, r.zeichenGewaehlt])));
  console.log('    Messwerte (Schema, Thema, kleinstes Quadrat, Name auf Akzent, Zeichen gewählt): ' +
    JSON.stringify(rechnung.map(r => [r.schema, r.thema, r.quadratMin, r.akzentName, r.zeichenGewaehlt])));
  await ctx.close();
}

p('Kein Seitenfehler während des Laufs', fehler.length === 0, fehler.slice(0, 3).join(' | '));

await browser.close();
server.close();
console.log(`\n  Suite 654 — Einstellungen wie iOS: ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
