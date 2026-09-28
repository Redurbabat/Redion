/* Suite 587 — Die Fragen der Schale im Fenster des Touch Kits (E710)
 * ============================================================================
 * Redur, 27. September 2026, 21:49 UTC: „was du beim touckit gebaut hast ich
 * will alles so haben mit redion passende inhalten" — und 22:10 UTC: „du
 * muss ofne pause an redion arbeiten ich will wenn ich am morgen die redion
 * öfnnen eien komplet besseren webseit sehen ohne eine funktione löschen
 * bessere ordnungen bessere übergagnge besssere efeckten , bessere
 * oberfläsche alles".
 *
 * Stufe 1b von E699: `Dialog.frage`, `Dialog.wahl` und `Dialog.mehrzeilig`
 * zeichnen jetzt den Dialog (und am Telefon das Aktionsblatt) des Kits — am
 * selben Auslöser, mit denselben Antworten. Diese Suite hält fest, was dabei
 * nicht verlorengehen darf, und was besser werden sollte:
 *
 *   §1  Die drei Fragen kommen im Fenster des Kits — mit denselben Antworten
 *       (Text / null / '' / Kennung), denselben Haken (#fq, data-w, data-a),
 *       Hinweisen unter den Knöpfen, Escape und Tipp daneben als Abbruch.
 *   §2  EINE Ebene für Fokus, Escape und `inert` (das Tor, Kit-Karte
 *       insel-8): ein Kit-Dialog über einem alten Fenster — beide bedienbar
 *       gemessen, Escape nimmt genau eines, Tab bleibt im Dialog.
 *   §3  Am Telefon sitzt eine Frage in der Mitte, eine Wahl ab drei
 *       Antworten kommt von unten — nicht mehr oben angeklebt.
 *   §4  „Ruhige Darstellung" erreicht die Federn des Kits (data-ui-motion).
 *   §5  Akzent als Schrift hält 4,5 : 1 in allen zehn Schemata (L222 Punkt 6),
 *       und „Starker Kontrast" hat kein Glas.
 *   §6  Der Rückweg: kommen die Inseln nicht, fragt das bisherige Fenster.
 *   §7  Der Zeitmesser schliesst auf Escape (war role="dialog" ohne Escape).
 *   §8  Die Frage liegt über jedem Fenster, das sie stellen kann.
 *   §9  Der Fokusrahmen biegt die Knöpfe des Kits nicht mehr (4 px Rundung).
 *   §10 Die Fenster des Browsers (confirm, prompt, alert) werden weniger,
 *       nie mehr: ein Bestand, der nur schrumpfen darf — der Weg dafür ist
 *       `Dialog.bestaetigen` / `Dialog.melden` / `Dialog.frage` (ohne Browser).
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 * Sie WAR es: rot eingecheckt (commit „test587 (rot)") gegen den Stand
 * b3cf193, auf dem es keine Dialog-Insel gab. Dazu im Lauf: eine Gegenprobe
 * je Messart (ein Punkt mitten im Dialog, der NICHT im Dialog liegen dürfte;
 * ein Kontrast, der zu schwach ist; ein Fenster, das inert ist).
 *
 * Eigener Port: keiner — `listen(0)`, wie test400 empfiehlt.
 *
 *   node pruefungen/lauf/test587.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import type { Browser, Page } from 'playwright';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

declare const Store: any, UI: any, Dialog: any, Aussehen: any, Zeitmesser: any;

const WURZEL = path.resolve(import.meta.dirname, '../..');

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll),
    `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

const TYP: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon', '.svg': 'image/svg+xml'
};
const server = http.createServer((a: IncomingMessage, b: ServerResponse) => {
  const rein = decodeURIComponent((a.url ?? '/').split('?')[0] ?? '/');
  const datei = path.join(WURZEL, rein === '/' ? 'index.html' : rein.slice(1));
  if (!datei.startsWith(WURZEL) || !fs.existsSync(datei) || fs.statSync(datei).isDirectory()) {
    b.writeHead(404); b.end(); return;
  }
  b.writeHead(200, { 'Content-Type': TYP[path.extname(datei)] ?? 'application/octet-stream' });
  b.end(fs.readFileSync(datei));
});
await new Promise<void>(f => server.listen(0, f));
const PORT = (server.address() as AddressInfo).port;

const fehlerVon = (seite: Page): string[] => {
  const f: string[] = [];
  seite.on('pageerror', e => f.push(e.message.slice(0, 200)));
  return f;
};
const bereitMachen = async (seite: Page): Promise<void> => {
  await seite.waitForFunction('typeof App !== "undefined" && typeof Store !== "undefined" && ' +
    '(document.getElementById("tree")?.children.length || 0) > 0', null, { timeout: 30000 });
  await seite.evaluate(() => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay,#rg-willkommen,#rg-einladung,.produkt-onboarding-lage')
      .forEach(e => e.remove());
  });
  await seite.waitForTimeout(300);
};

/** Eine Frage stellen; die Antwort landet in window.__a587 (undefined = noch keine). */
const stellen = async (seite: Page, ausdruck: string): Promise<void> => {
  await seite.evaluate('window.__a587 = undefined; (' + ausdruck + ').then(w => { window.__a587 = w; }); 0');
};
const antwort = async (seite: Page): Promise<unknown> => {
  await seite.waitForTimeout(250);
  return seite.evaluate(() => (window as any).__a587);
};
const kitOffen = (seite: Page, ms = 4000): Promise<boolean> =>
  seite.waitForSelector('.overlay[data-insel-traeger] :is(.ui-touch-dialog, .ui-touch-action-sheet)',
    { timeout: ms, state: 'visible' }).then(() => true, () => false);
const zu = (seite: Page): Promise<number> =>
  seite.evaluate(() => document.querySelectorAll('.overlay').length);

/* ==========================================================================
 * §10 · Die Fenster des Browsers werden weniger, nie mehr (ohne Browser)
 * --------------------------------------------------------------------------
 * `confirm()`, `prompt()` und `alert()` halten die ganze Seite an, sehen in
 * jedem System anders aus, kennen keinen roten Knopf und kein Passwortfeld.
 * Am 28. September standen 51 in `src/`, nach E710 noch 45 — jede an einem Weg, den ein
 * Prüflauf kennt (test265 beantwortet das Passwort des Verschlüsselns über
 * das Fenster des Browsers). Sie wandern je Datei zu `Dialog.bestaetigen`,
 * `Dialog.melden` und `Dialog.frage`, mit ihren Prüfläufen im selben Bogen.
 * Bis dahin gilt: die Zahl darf nur sinken. Eine neue Stelle macht das rot.
 * ========================================================================*/
console.log('\n§10 · confirm / prompt / alert in src: ein Bestand, der nur schrumpft');

/* 51 auf dem Stand b3cf193; E710 nimmt sechs davon (die Gefahrzone der
   Einstellungen: KI-Buch, alte Fassungen, zweimal „alles löschen" samt
   Fehlermeldung; das Löschen mehrerer Datenbankzeilen). */
const NATIV_BESTAND = 45;
const nativeStellen = (): string[] => {
  const dateien: string[] = [];
  const lauf = (d: string): void => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const v = path.join(d, e.name);
      if (e.isDirectory()) lauf(v);
      else if (/\.ts$/.test(e.name) && !/\.d\.ts$/.test(e.name)) dateien.push(v);
    }
  };
  lauf(path.join(WURZEL, 'src'));
  /* Kommentare weg — aber nur echte: ein `/*` mitten in 'image/*' ist
     keiner (der erste Entwurf dieses Zählers verschluckte so eine Stelle). */
  const ohneKommentar = (t: string): string => t
    .replace(/(^|[\s;{}(),=])\/\*[\s\S]*?\*\//g, (m: string, v: string) => v + m.slice(v.length).replace(/[^\n]/g, ' '))
    .replace(/(^|\s)\/\/[^\n]*/g, '$1');
  const MUSTER = /(^|[^.\w$])(?:window\.)?(confirm|prompt|alert)\s*\(/g;
  const funde: string[] = [];
  for (const f of dateien) {
    ohneKommentar(fs.readFileSync(f, 'utf8')).split('\n').forEach((z, i) => {
      for (const m of z.matchAll(MUSTER)) funde.push(path.relative(WURZEL, f).split(path.sep).join('/') + ':' + (i + 1) + ' ' + m[2]);
    });
  }
  return funde;
};
const nativ = nativeStellen();
console.log(`   ${nativ.length} Stellen (Bestand ${NATIV_BESTAND}).`);
p('Es gibt nicht mehr Fenster des Browsers als im Bestand (' + NATIV_BESTAND + ') — neue Fragen nehmen Dialog.*',
  nativ.length > 0 && nativ.length <= NATIV_BESTAND, nativ.length + ': ' + nativ.slice(0, 3).join(', '));
p('Gegenprobe: der Zähler findet ein `confirm(` im Code, aber nicht in einem Kommentar oder in \'image/*\'',
  /(^|[^.\w$])(?:window\.)?(confirm|prompt|alert)\s*\(/.test("if (!confirm('x')) return;") &&
  !/(^|[^.\w$])(?:window\.)?(confirm|prompt|alert)\s*\(/.test('Store.confirm(x)'));
p('Der Weg dafür steht bereit: Dialog.bestaetigen und Dialog.melden',
  /const bestaetigen\b/.test(fs.readFileSync(path.join(WURZEL, 'src/schale/ueberlagerung/dialog.ts'), 'utf8')) &&
  /const melden\b/.test(fs.readFileSync(path.join(WURZEL, 'src/schale/ueberlagerung/dialog.ts'), 'utf8')));

const browser: Browser = await chromium.launch();
const alleFehler: string[] = [];

/* ==========================================================================
 * §1 · Die drei Fragen im Fenster des Kits
 * ======================================================================== */
console.log('\n§1 · frage, wahl, mehrzeilig — im Dialog des Kits, mit denselben Antworten');

const k1 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const s1 = await k1.newPage();
alleFehler.push(...fehlerVon(s1));
await s1.goto(pathToFileURL(path.join(WURZEL, 'index.html')).href);
await bereitMachen(s1);

await stellen(s1, `UI.frage('Blatt umbenennen', 'Alter Name')`);
const da1 = await kitOffen(s1);
p('UI.frage öffnet den Dialog des Kits (role="alertdialog") in einem .overlay', da1);
const f1 = await s1.evaluate(() => {
  const d = document.querySelector<HTMLElement>('.overlay[data-insel-traeger] .ui-touch-dialog');
  const fq = document.querySelector<HTMLInputElement>('.overlay #fq');
  return {
    rolle: d?.getAttribute('role') ?? null,
    titel: d?.querySelector('h2')?.textContent ?? null,
    wert: fq?.value ?? null,
    fokus: document.activeElement === fq,
    markiert: fq ? fq.selectionStart === 0 && fq.selectionEnd === fq.value.length : false,
    knoepfe: [...(d?.querySelectorAll('button') ?? [])].map(b => (b as HTMLElement).dataset['a'] ?? '?'),
    hoehe: Math.min(...[...(d?.querySelectorAll('button') ?? [])].map(b => b.getBoundingClientRect().height))
  };
});
gleich('… mit Titel, Vorgabe in #fq, Fokus darin und alles markiert',
  [f1.rolle, f1.titel, f1.wert, f1.fokus, f1.markiert], ['alertdialog', 'Blatt umbenennen', 'Alter Name', true, true]);
gleich('… Abbrechen und Übernehmen tragen ihre Haken (data-a)', f1.knoepfe.sort(), ['ok', 'zu']);
p('… und sind mindestens 44 px hoch (§37)', f1.hoehe >= 44, String(f1.hoehe));
await s1.keyboard.type('Neuer Name');
await s1.keyboard.press('Enter');
gleich('Enter übernimmt den Text', await antwort(s1), 'Neuer Name');
gleich('… und sofort ist kein .overlay mehr offen (die Seite ist wieder bedienbar)', await zu(s1), 0);
await s1.waitForTimeout(500);
gleich('… und nach dem Ausblenden ist auch der Träger fort', await s1.evaluate(() =>
  document.querySelectorAll('[data-insel-traeger]').length), 0);

await stellen(s1, `UI.frage('Name', 'x')`);
await kitOffen(s1);
await s1.keyboard.press('Escape');
gleich('Escape bricht ab: null', await antwort(s1), null);
await stellen(s1, `UI.frage('Name', 'x')`);
await kitOffen(s1);
await s1.fill('.overlay #fq', '');
await s1.keyboard.press('Enter');
gleich('Leer übernommen ist "" — nicht null (dialog.ts: zwei verschiedene Antworten)', await antwort(s1), '');
await stellen(s1, `UI.frage('Name', 'x')`);
await kitOffen(s1);
await s1.click('.overlay [data-a="zu"]');
gleich('„Abbrechen" gibt null', await antwort(s1), null);
await stellen(s1, `UI.frage('Name', 'x')`);
await kitOffen(s1);
await s1.mouse.click(30, 450);
gleich('Ein Tipp neben den Dialog (auf den Schleier) bricht ab — wie bisher', await antwort(s1), null);
await stellen(s1, `Dialog.frage('Passwort des PDFs', '', 'passwort')`);
await kitOffen(s1);
gleich('Die Passwortfrage hat ein Passwortfeld ohne Vervollständigung',
  await s1.evaluate(() => { const i = document.querySelector<HTMLInputElement>('.overlay #fq');
    return [i?.type, i?.autocomplete]; }), ['password', 'off']);
await s1.keyboard.press('Escape');
await antwort(s1);

await stellen(s1, `Dialog.wahl({ titel: 'PDF einlesen', text: 'Die Datei hat 5 Seiten.\\n\\nWas soll mit dem Bestand geschehen?',
  knoepfe: [{ id: 'ersetzen', text: 'Ersetzen', hinweis: 'Die alten Seiten gehen in den Papierkorb' },
            { id: 'dazu', text: 'Dazulegen', hinweis: 'Die neuen kommen hinten dazu' }] })`);
p('Dialog.wahl öffnet den Dialog des Kits', await kitOffen(s1));
const w1 = await s1.evaluate(() => {
  const d = document.querySelector<HTMLElement>('.overlay .ui-touch-dialog')!;
  const k = d.querySelector<HTMLElement>('[data-w="ersetzen"]');
  const hid = k?.getAttribute('aria-describedby');
  return {
    knoepfe: [...d.querySelectorAll<HTMLElement>('[data-w]')].map(b => b.dataset['w']),
    hinweis: hid ? document.getElementById(hid)?.textContent : null,
    abbrechen: d.querySelector('[data-a="zu"]')?.textContent ?? null,
    absatz: getComputedStyle(d.querySelector('.ui-touch-dialog-message')!).whiteSpace,
    fokus: (document.activeElement as HTMLElement)?.dataset?.['w'] ?? null
  };
});
gleich('… jede Antwort ein Knopf mit ihrem Haken (data-w)', w1.knoepfe, ['ersetzen', 'dazu']);
gleich('… der Hinweis steht darunter und ist die Beschreibung des Knopfes', w1.hinweis,
  'Die alten Seiten gehen in den Papierkorb');
gleich('… „Abbrechen" ist sichtbar dabei (am Telefon gibt es kein Escape)', w1.abbrechen, 'Abbrechen');
gleich('… die Absätze des Textes bleiben Absätze', w1.absatz, 'pre-line');
gleich('… und der Fokus steht auf der ersten Antwort, wie bisher', w1.fokus, 'ersetzen');
await s1.click('.overlay [data-w="dazu"]');
gleich('Ein Tipp gibt die Kennung', await antwort(s1), 'dazu');
await stellen(s1, `Dialog.wahl({ titel: 'T', text: 'x', knoepfe: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }] })`);
await kitOffen(s1);
await s1.keyboard.press('Escape');
gleich('Escape bei der Wahl: ""', await antwort(s1), '');

await stellen(s1, `Dialog.mehrzeilig('Haftnotiz', 'erste Zeile')`);
p('Dialog.mehrzeilig öffnet den Dialog des Kits', await kitOffen(s1));
gleich('… mit einem mehrzeiligen #fq', await s1.evaluate(() =>
  document.querySelector('.overlay #fq')?.tagName ?? null), 'TEXTAREA');
await s1.keyboard.press('End');
await s1.keyboard.press('Enter');
await s1.keyboard.type('zweite');
await s1.keyboard.press('Control+Enter');
gleich('Enter macht eine Zeile, Strg+Enter übernimmt', await antwort(s1), 'erste Zeile\nzweite');

/* ==========================================================================
 * §2 · Eine Ebene für Fokus, Escape und inert — das Tor (insel-8)
 * ======================================================================== */
console.log('\n§2 · Kit-Dialog über einem alten Fenster: eine oberste Ebene für beide');

await s1.evaluate(() => {
  const o = document.createElement('div');
  o.className = 'overlay';
  o.dataset['probe'] = 'alt';
  o.innerHTML = '<div class="finder" style="width:320px;padding:20px"><div class="fh">Altes Fenster</div>' +
    '<button id="t587-alt">Knopf im alten Fenster</button></div>';
  document.body.appendChild(o);
});
await s1.waitForTimeout(200);
await stellen(s1, `UI.frage('Darüber', 'oben')`);
await kitOffen(s1);
await s1.waitForTimeout(300);
const tor = await s1.evaluate(() => {
  const panel = document.querySelector<HTMLElement>('.overlay[data-insel-traeger] .ui-touch-dialog')!;
  const alt = document.querySelector<HTMLElement>('[data-probe="alt"]')!;
  const r = panel.getBoundingClientRect();
  const mitte = document.elementFromPoint(r.left + r.width / 2, r.top + 20);
  return {
    kitInert: !!panel.closest('[inert]'),
    altInert: !!alt.closest('[inert]'),
    fokusImKit: panel.contains(document.activeElement),
    trefferImKit: !!mitte && panel.contains(mitte),
    gegenprobe: !!document.elementFromPoint(5, 5) && panel.contains(document.elementFromPoint(5, 5))
  };
});
gleich('Der Kit-Dialog ist bedienbar (nicht inert) — vorher: beide Ebenen inert', tor.kitInert, false);
gleich('… das alte Fenster darunter ist stillgelegt', tor.altInert, true);
gleich('… der Fokus steht im Kit-Dialog, ein Tipp in seine Mitte trifft ihn', [tor.fokusImKit, tor.trefferImKit], [true, true]);
gleich('Gegenprobe: ein Punkt am Rand trifft den Dialog NICHT', tor.gegenprobe, false);
for (let i = 0; i < 4; i++) await s1.keyboard.press('Tab');
p('Tab bleibt im Kit-Dialog (eine Falle, nicht zwei)', await s1.evaluate(() =>
  !!document.querySelector('.overlay[data-insel-traeger] .ui-touch-dialog')?.contains(document.activeElement)));
await s1.keyboard.press('Escape');
gleich('Der erste Escape schliesst NUR den Kit-Dialog (Antwort null) …',
  [await antwort(s1), await s1.evaluate(() => !!document.querySelector('[data-probe="alt"]'))], [null, true]);
gleich('… und das alte Fenster ist wieder bedienbar', await s1.evaluate(() =>
  !!document.querySelector('[data-probe="alt"]')?.closest('[inert]')), false);
await s1.keyboard.press('Escape');
await s1.waitForTimeout(250);
gleich('Der zweite Escape schliesst das alte', await zu(s1), 0);

/* ==========================================================================
 * §4 · Ruhige Darstellung erreicht die Federn des Kits
 * ======================================================================== */
console.log('\n§4 · „Ruhige Darstellung" → data-ui-motion="reduce" (Liquid-Karte, must-fix 1)');

await s1.evaluate(() => { document.body.dataset['bewegung'] = 'ruhig'; });
await stellen(s1, `UI.frage('Ruhig', '')`);
await kitOffen(s1);
gleich('Mit offener Insel und „ruhig": html[data-ui-motion="reduce"]',
  await s1.evaluate(() => document.documentElement.getAttribute('data-ui-motion')), 'reduce');
await s1.evaluate(() => { document.body.dataset['bewegung'] = 'normal'; });
await s1.waitForTimeout(100);
gleich('… „ruhig" aus: das Attribut ist weg', await s1.evaluate(() =>
  document.documentElement.getAttribute('data-ui-motion')), null);
await s1.keyboard.press('Escape');
await antwort(s1);

/* ==========================================================================
 * §5 · Akzent als Schrift, in allen zehn Schemata — und Starker Kontrast ohne Glas
 * ======================================================================== */
console.log('\n§5 · Akzent als Schrift ≥ 4,5 : 1 in allen zehn Schemata (L222 Punkt 6)');

await stellen(s1, `Dialog.wahl({ titel: 'Kontrast', text: 'x', knoepfe: [{ id: 'a', text: 'Antwort' }] })`);
await kitOffen(s1);
const kontraste = await s1.evaluate(() => {
  const hell = (c: string): number => {
    const [r, g, b] = (c.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number).map(v => {
      const x = (v ?? 0) / 255;
      return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (b ?? 0);
  };
  const kontrast = (a: string, b: string): number => {
    const x = hell(a), y = hell(b);
    return Math.round((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) * 100) / 100;
  };
  const farbe = (m: string): string => {
    const d = document.createElement('div'); d.style.color = 'var(' + m + ')';
    document.body.appendChild(d); const c = getComputedStyle(d).color; d.remove(); return c;
  };
  const vorher = Aussehen.einstellung().schema;
  const aus: Record<string, { schrift: number; glas: string }> = {};
  const knopf = document.querySelector<HTMLElement>('.overlay [data-w="a"]')!;
  const panel = document.querySelector<HTMLElement>('.overlay .ui-touch-dialog')!;
  for (const sch of Aussehen.SCHEMATA as Array<{ id: string }>) {
    Aussehen.setzen({ schema: sch.id, akzent: '' });
    aus[sch.id] = { schrift: kontrast(getComputedStyle(knopf).color, farbe('--bg-card')),
                    glas: getComputedStyle(panel).backdropFilter };
  }
  Aussehen.setzen({ schema: vorher, akzent: '' });
  return { aus, gegen: kontrast(farbe('--accent'), farbe('--bg-card')) };
});
const schwach = Object.entries(kontraste.aus).filter(([, k]) => k.schrift < 4.5).map(([s, k]) => s + ' ' + k.schrift);
p('Die Antwort-Knöpfe schreiben in allen zehn Schemata mit mindestens 4,5 : 1',
  Object.keys(kontraste.aus).length === 10 && schwach.length === 0,
  `${Object.keys(kontraste.aus).length} Schemata; darunter: ${schwach.join(', ') || '—'}`);
p('Gegenprobe: mit --accent als Schrift wäre „Standard" darunter (L222: 3,16)', kontraste.gegen < 4.5,
  String(kontraste.gegen));
gleich('„Starker Kontrast": kein Glas am Dialog', kontraste.aus['kontrast']?.glas, 'none');
p('… und die anderen Schemata tragen Redions eine Unschärfe', /blur\(20px\)/.test(kontraste.aus['standard']?.glas ?? ''),
  String(kontraste.aus['standard']?.glas));
await s1.keyboard.press('Escape');
await antwort(s1);

/* ==========================================================================
 * §7 · Der Zeitmesser schliesst auf Escape
 * ======================================================================== */
console.log('\n§7 · Der Zeitmesser (role="dialog") schliesst auf Escape');

await s1.evaluate(() => Zeitmesser.panel());
await s1.waitForTimeout(200);
p('Das Feld ist offen', await s1.evaluate(() => !!document.querySelector('.zm-feld')));
await s1.keyboard.press('Escape');
await s1.waitForTimeout(200);
p('Escape schliesst es — über den gemeinsamen Griff', await s1.evaluate(() => !document.querySelector('.zm-feld')));

/* ==========================================================================
 * §8 · Die Frage liegt über jedem Fenster, das sie stellen kann
 * ======================================================================== */
console.log('\n§8 · Über Einstellungen (940), #r-blatt (950) und Vollbild-Werkzeugen (1000)');

await s1.evaluate(() => {
  const w = document.createElement('div');
  w.id = 't587-vollbild';
  w.style.cssText = 'position:fixed;inset:0;z-index:1000;background:#123';
  document.body.appendChild(w);
});
await stellen(s1, `UI.frage('Über allem', '')`);
await kitOffen(s1);
p('Ein Tipp in die Mitte trifft den Dialog, nicht das Vollbild darunter', await s1.evaluate(() => {
  const panel = document.querySelector<HTMLElement>('.overlay .ui-touch-dialog')!;
  const r = panel.getBoundingClientRect();
  const t = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
  return !!t && panel.contains(t);
}));
await s1.keyboard.press('Escape');
await antwort(s1);
await s1.evaluate(() => document.getElementById('t587-vollbild')?.remove());

/* ==========================================================================
 * §9 · Der Fokusrahmen biegt die Knöpfe des Kits nicht
 * ======================================================================== */
console.log('\n§9 · Fokus mit der Tastatur: die Knöpfe behalten ihre Rundung');

await stellen(s1, `Dialog.wahl({ titel: 'Rundung', text: 'x', knoepfe: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }, { id: 'c', text: 'C' }] })`);
await kitOffen(s1);
await s1.keyboard.press('Tab');
const rund = await s1.evaluate(() => {
  const f = document.activeElement as HTMLElement;
  const andere = document.querySelector<HTMLElement>('.overlay .ui-touch-dialog-button:not(:focus)');
  return { fokus: getComputedStyle(f).borderRadius, ohne: andere ? getComputedStyle(andere).borderRadius : '?',
           sichtbar: f.matches(':focus-visible') };
});
p('Ein Knopf hat mit Tastaturfokus dieselbe Rundung wie ohne (vorher: 4 px dazu)',
  rund.sichtbar && rund.fokus === rund.ohne, JSON.stringify(rund));
await s1.keyboard.press('Escape');
await antwort(s1);
await k1.close();

/* ==========================================================================
 * §3 · Am Telefon: Mitte und unten, nicht oben
 * ======================================================================== */
console.log('\n§3 · Am Telefon (390×844): die Frage in der Mitte, die Wahl von unten');

const k3 = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const s3 = await k3.newPage();
alleFehler.push(...fehlerVon(s3));
await s3.goto(pathToFileURL(path.join(WURZEL, 'index.html')).href);
await bereitMachen(s3);
await stellen(s3, `UI.frage('Blatt umbenennen', 'Skizze')`);
await kitOffen(s3);
await s3.waitForTimeout(600);
const lage = await s3.evaluate(() => {
  const r = document.querySelector<HTMLElement>('.overlay :is(.ui-touch-dialog, .finder)')!.getBoundingClientRect();
  return { mitte: Math.round(r.top + r.height / 2), oben: Math.round(r.top) };
});
p('Die Frage sitzt in der Mitte (Mitte des Fensters zwischen 30 und 70 % der Höhe)',
  lage.mitte > 844 * 0.3 && lage.mitte < 844 * 0.7, JSON.stringify(lage));
await s3.keyboard.press('Escape');
await antwort(s3);
await stellen(s3, `Dialog.wahl({ titel: 'Farbsatz', text: 'Welcher Satz?', knoepfe: [
  { id: 'a', text: 'Tinte', hinweis: 'Blau, Schwarz, Rot' }, { id: 'b', text: 'Marker', hinweis: 'Gelb, Grün' },
  { id: 'c', text: 'Pastell', hinweis: 'Sanfte Töne' }] })`);
const blatt = await s3.waitForSelector('.overlay .ui-touch-action-sheet', { timeout: 4000, state: 'visible' })
  .then(() => true, () => false);
p('Eine Wahl mit drei Antworten kommt als Aktionsblatt', blatt);
await s3.waitForTimeout(900);
const unten = await s3.evaluate(() => {
  const r = document.querySelector<HTMLElement>('.overlay .ui-touch-action-sheet')?.getBoundingClientRect();
  const h = document.querySelector('.overlay .ui-touch-action-sheet [data-w="b"]');
  const hid = h?.getAttribute('aria-describedby');
  return { unten: r ? Math.round(r.bottom) : -1, hinweis: hid ? document.getElementById(hid)?.textContent : null,
           abbrechen: [...document.querySelectorAll('.overlay .ui-touch-action-sheet button')].pop()?.textContent ?? null };
});
p('… unten am Rand, wo der Daumen ist', unten.unten >= 844 - 24 && unten.unten <= 844, String(unten.unten));
gleich('… mit dem Hinweis unter der Antwort und „Abbrechen" als eigenem Knopf', [unten.hinweis, unten.abbrechen],
  ['Gelb, Grün', 'Abbrechen']);
await s3.tap('.overlay .ui-touch-action-sheet [data-w="c"]');
gleich('Ein Tipp gibt die Kennung', await antwort(s3), 'c');
await k3.close();

/* ==========================================================================
 * §6 · Der Rückweg: kommen die Inseln nicht, fragt das bisherige Fenster
 * ======================================================================== */
console.log('\n§6 · Ohne Inseln (react.js fehlt): dieselbe Frage im bisherigen Fenster');

const k6 = await browser.newContext({ viewport: { width: 1280, height: 900 }, serviceWorkers: 'block' });
const s6 = await k6.newPage();
alleFehler.push(...fehlerVon(s6));
await s6.route(/\/quell\/fremd\/react\/react\.js$/, r => r.abort('internetdisconnected'));
await s6.goto(`http://localhost:${PORT}/index.html`);
await bereitMachen(s6);
await stellen(s6, `UI.frage('Ohne Inseln', 'bleibt')`);
const alt = await s6.waitForSelector('.overlay .finder #fq', { timeout: 5000 }).then(() => true, () => false);
p('Die Frage kommt trotzdem — im bisherigen Fenster (.finder, #fq)', alt);
await s6.fill('.overlay #fq', 'geht');
await s6.keyboard.press('Enter');
gleich('… und gibt dieselbe Antwort', await antwort(s6), 'geht');
await k6.close();

console.log('');
gleich('Keine unerwarteten Fehler auf den Seiten', alleFehler.slice(0, 5), []);

await browser.close();
server.close();
console.log(`\n${ok} bestanden, ${weg} durchgefallen`);
process.exit(weg ? 1 : 0);
