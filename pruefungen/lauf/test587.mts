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
 *   §11 Die Einzeldatei allein, ohne Netz: die erste Frage kommt sofort im
 *       Fenster des Kits, und nach Escape oder Antwort steht der Fokus
 *       wieder auf dem Knopf, der gefragt hat (Durchsicht, 3. Oktober).
 *   §12 Was die Aufrufer mitbringen, bleibt: ihr eigener Abbruch steht, wo
 *       sie ihn hinsetzten (und hat den Fokus, wenn er zuerst kommt), ein
 *       „Abbrechen" unter der Kennung `nein` ist DAS Abbrechen; stolpert die
 *       Insel, fragt das bisherige Fenster; „ruhig" schliesst im selben
 *       Bild, und `data-ui-motion` (E702) bleibt; der Rückweg für Ja/Nein hat
 *       ein sichtbares „Abbrechen" (Durchsicht, 5. Oktober).
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 * Sie WAR es: rot eingecheckt (commit „test587 (rot)") gegen den Stand
 * b3cf193, auf dem es keine Dialog-Insel gab. Dazu im Lauf: eine Gegenprobe
 * je Messart (ein Punkt mitten im Dialog, der NICHT im Dialog liegen dürfte;
 * ein Kontrast, der zu schwach ist; ein Fenster, das inert ist).
 * §11 (Nachtrag) war rot gegen den Endbau 9575ebc40: im bisherigen Fenster
 * ging die mit Enter gegebene Antwort verloren (3. Oktober). Ohne beide
 * Rückgaben des Fokus (dialog.ts und `useModal` des Kits) werden seine
 * Fokus-Punkte rot (4. Oktober, 69/73).
 * §12 (Durchsicht) war rot gegen den Endbau 1654e75d9: 80 bestanden, 17
 * durchgefallen, alle 17 in §12 (5. Oktober). Sein Punkt d) läuft auf einer
 * eigenen Seite: auf der Seite von c) hielt gegen den Endbau eine gestolperte
 * Insel den Spiegel an, und „data-ui-motion bleibt" war dort aus dem
 * falschen Grund grün.
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
import os from 'node:os';
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

/* JA ODER NEIN, UND ES LÖSCHT (Dialog.bestaetigen mit gefahr): „Abbrechen"
   links und im Fokus, die Antwort rot — ein Enter aus Versehen löscht nichts.
   Nach dem roten Commit dazugekommen (gesehen am ersten Bild: „Löschen"
   links und im Fokus); rot gesehen gegen den ersten Bau dieses Zweigs. */
await stellen(s1, `Dialog.bestaetigen({ titel: 'Alle verbuchten KI-Kosten löschen?', text: 'Die Übersicht beginnt danach wieder bei null.', ja: 'Löschen', gefahr: true })`);
p('Dialog.bestaetigen öffnet den Dialog des Kits', await kitOffen(s1));
const g1 = await s1.evaluate(() => {
  const d = document.querySelector<HTMLElement>('.overlay .ui-touch-dialog')!;
  const k = [...d.querySelectorAll<HTMLElement>('button')];
  return { folge: k.map(b => b.dataset['w'] ?? b.dataset['a'] ?? '?'),
           fokus: (document.activeElement as HTMLElement)?.dataset?.['a'] ?? null,
           rot: !!d.querySelector('[data-w="ja"].ui-touch-dialog-button--destructive') };
});
gleich('… „Abbrechen" links, die gefährliche Antwort rechts', g1.folge, ['zu', 'ja']);
gleich('… der Fokus auf „Abbrechen", die Antwort rot', [g1.fokus, g1.rot], ['zu', true]);
await s1.keyboard.press('Enter');
gleich('Enter beantwortet sie mit „nein" (false)', await antwort(s1), false);
await stellen(s1, `Dialog.bestaetigen({ titel: 'Löschen?', ja: 'Löschen', gefahr: true })`);
await kitOffen(s1);
await s1.click('.overlay [data-w="ja"]');
gleich('… und ein Tipp auf „Löschen" mit true', await antwort(s1), true);

/* DIE SCHEIBE KOMMT ALS SCHEIBE (E703, test582): im ersten Augenblick
   Deckkraft 1, keine opacity im Ankommen — nur der Inhalt blendet ein. */
await stellen(s1, `UI.frage('Scheibe', '')`);
await kitOffen(s1, 4000);
const scheibe = await s1.evaluate(() => {
  const el = document.querySelector<HTMLElement>('.overlay .ui-touch-dialog')!;
  const eigene = el.getAnimations();
  for (const a of [...eigene, ...[...el.children].flatMap(k => k.getAnimations())]) { a.pause(); a.currentTime = 0; }
  const erstes = el.firstElementChild as HTMLElement | null;
  return { deck: +getComputedStyle(el).opacity,
           nebel: eigene.some(a => (a.effect as KeyframeEffect).getKeyframes().some(k => 'opacity' in k && +(k['opacity'] as string) < 1)),
           inhalt: erstes ? +getComputedStyle(erstes).opacity : 1, glas: getComputedStyle(el).backdropFilter };
});
p('Die Glasscheibe des Dialogs ist vom ersten Bild an da; ihr Inhalt blendet ein (E703)',
  scheibe.deck === 1 && !scheibe.nebel && scheibe.inhalt < 0.5 && scheibe.glas !== 'none', JSON.stringify(scheibe));
await s1.evaluate(() => document.getAnimations().forEach(a => a.play()));
await s1.keyboard.press('Escape');
await antwort(s1);

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
  /* Fokus legt das Vollbild still (`inert`), und was `inert` ist, übergeht
     die Trefferprüfung — dann träfe der Tipp den Dialog auch, wenn er
     DARUNTER läge. Die Gegenprobe (Träger auf z-index 1) war darum grün.
     Also hier ohne `inert`: es zählt nur die Reihenfolge der Ebenen. */
  document.getElementById('t587-vollbild')?.removeAttribute('inert');
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
await stellen(s3, `Dialog.mehrzeilig('Haftnotiz', 'Ohmsches Gesetz')`);
await kitOffen(s3);
gleich('Am Telefon steht unter „Übernehmen" kein „Strg + Enter" (keine Tastatur)',
  await s3.evaluate(() => document.querySelector('.overlay [data-a="ok"] .ui-touch-dialog-button-hint')?.textContent ?? null), null);
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

/* ==========================================================================
 * §11 · Die Einzeldatei allein, ohne Netz: die erste Frage sofort im Kit,
 *       und der Fokus kehrt zum Auslöser zurück (Durchsicht, 3. Oktober)
 * --------------------------------------------------------------------------
 * Die Inseln kommen erst nach dem Start (E699). Redion läuft aber auch als
 * EINE Datei per Doppelklick, ohne Netz — dort darf die erste Frage weder
 * warten noch ausbleiben. Und wer mit der Tastatur fragt, steht nach Escape
 * oder Antwort wieder auf dem Knopf, von dem die Frage kam (§38; das Kit
 * liest seinen Rückweg erst nach dem Öffnen, wenn Fokus die Seite schon
 * stillgelegt hat — darum merkt sich dialog.ts den Auslöser selbst).
 * Gegenprobe im Lauf: dieselbe Datei ohne ihren React-Behälter — dann MUSS
 * dieselbe Frage im bisherigen Fenster kommen, sonst misst der Punkt nichts.
 * ======================================================================== */
console.log('\n§11 · Die Einzeldatei allein, ohne Netz: die erste Frage sofort im Kit, der Fokus zurück');

const ALLEIN = fs.mkdtempSync(path.join(os.tmpdir(), 'redion-t587-'));
const EINZEL = fs.readFileSync(path.join(WURZEL, 'redion-einzeldatei.html'), 'utf8');
const REACT_BEHAELTER = '<script type="text/plain" id="inseln-react">';
fs.writeFileSync(path.join(ALLEIN, 'redion-einzeldatei.html'), EINZEL);
fs.writeFileSync(path.join(ALLEIN, 'ohne-react.html'),
  EINZEL.replace(REACT_BEHAELTER, '<script type="text/plain" id="inseln-react-fehlt">'));
p('Die Einzeldatei trägt ihren React-Behälter genau einmal (für die Gegenprobe)',
  EINZEL.split(REACT_BEHAELTER).length === 2);

/** Ein Knopf, der fragt; er misst die Zeit von seinem Klick bis zum Fenster der Frage. */
const ausloeser = async (seite: Page, ausdruck: string): Promise<void> => {
  await seite.evaluate((a) => {
    document.getElementById('t587-ausloeser')?.remove();
    const k = document.createElement('button');
    k.id = 't587-ausloeser';
    k.textContent = 'Fragen';
    k.style.cssText = 'position:fixed;left:8px;bottom:8px;z-index:5';
    k.addEventListener('click', () => {
      const w = window as any;
      w.__a587 = undefined;
      w.__t587 = { klick: performance.now(), da: 0 };
      const beob = new MutationObserver(() => {
        if (!document.querySelector('.overlay :is(.ui-touch-dialog, .finder)')) return;
        w.__t587.da = performance.now();
        beob.disconnect();
      });
      beob.observe(document.body, { childList: true, subtree: true });
      ((0, eval)(a) as Promise<unknown>).then(x => { w.__a587 = x; });
    });
    document.body.appendChild(k);
  }, ausdruck);
  await seite.focus('#t587-ausloeser');
  await seite.keyboard.press('Enter');
};
const zeitBisFenster = (seite: Page): Promise<number> => seite.evaluate(() => {
  const t = (window as any).__t587;
  return t?.da ? Math.round(t.da - t.klick) : -1;
});
const fokusAuf = (seite: Page): Promise<string | null> =>
  seite.evaluate(() => document.activeElement?.id || document.activeElement?.tagName || null);

const k11 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await k11.setOffline(true);
const s11 = await k11.newPage();
const f11 = fehlerVon(s11);
const geholt11: string[] = [];
s11.on('request', r => geholt11.push(r.url()));
await s11.goto(pathToFileURL(path.join(ALLEIN, 'redion-einzeldatei.html')).href, { waitUntil: 'load' });
await bereitMachen(s11);
p('Ohne Netz, per Doppelklick: die Einzeldatei wärmt die Inseln im Leerlauf vor',
  await s11.waitForFunction('typeof window.RedionIslands !== "undefined"', null, { timeout: 10000 })
    .then(() => true, () => false));

await ausloeser(s11, `UI.frage('Blatt umbenennen', 'Skizze')`);
p('Die erste Frage kommt im Fenster des Kits', await kitOffen(s11));
const zeit11 = await zeitBisFenster(s11);
console.log(`    gemessen: ${zeit11} ms vom Klick bis zum Fenster`);
p('… sofort: höchstens 250 ms vom Klick bis zum Fenster', zeit11 >= 0 && zeit11 <= 250, zeit11 + ' ms');
await s11.keyboard.press('Escape');
gleich('Escape bricht ab (null) …', await antwort(s11), null);
await s11.waitForTimeout(450);
gleich('… und der Fokus steht wieder auf dem Knopf, der gefragt hat', await fokusAuf(s11), 't587-ausloeser');

await s11.keyboard.press('Enter');
await kitOffen(s11);
await s11.keyboard.type('Stromkreis');
await s11.keyboard.press('Enter');
gleich('Eine Antwort mit Enter …', await antwort(s11), 'Stromkreis');
await s11.waitForTimeout(450);
gleich('… gibt den Fokus ebenso zurück', await fokusAuf(s11), 't587-ausloeser');

await ausloeser(s11, `Dialog.bestaetigen({ titel: 'Alle verbuchten KI-Kosten löschen?', ja: 'Löschen', gefahr: true })`);
await kitOffen(s11);
await s11.keyboard.press('Escape');
const nein11 = await antwort(s11);
await s11.waitForTimeout(450);
gleich('Dialog.bestaetigen: Escape heisst nein, der Fokus zurück auf dem Knopf', [nein11, await fokusAuf(s11)],
  [false, 't587-ausloeser']);
gleich('Kein Zugriff auf eine Datei daneben (nur die Seite und Blob-Adressen)',
  geholt11.filter(u => !u.startsWith('blob:') && !u.startsWith('data:') && !/redion-einzeldatei\.html$/.test(u))
    .map(u => u.split('/').slice(-3).join('/')), []);
alleFehler.push(...f11);
await k11.close();

/* Gegenprobe: ohne den React-Behälter findet die Datei keine Inseln (sie
   sucht dann `quell/fremd/react/react.js` neben sich — dort ist nichts). */
const k11g = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await k11g.setOffline(true);
const s11g = await k11g.newPage();
const f11g = fehlerVon(s11g);
await s11g.goto(pathToFileURL(path.join(ALLEIN, 'ohne-react.html')).href, { waitUntil: 'load' });
await bereitMachen(s11g);
await ausloeser(s11g, `UI.frage('Ohne React', 'bleibt')`);
const alt11 = await s11g.waitForSelector('.overlay .finder #fq', { timeout: 5000 }).then(() => true, () => false);
console.log(`    Gegenprobe: ${await zeitBisFenster(s11g)} ms bis zum bisherigen Fenster`);
p('Gegenprobe: ohne den React-Behälter kommt dieselbe Frage im bisherigen Fenster, nicht im Kit',
  alt11 && !(await s11g.$('.ui-touch-dialog')));
await s11g.fill('.overlay #fq', 'trotzdem');
await s11g.keyboard.press('Enter');
gleich('… und antwortet ebenso', await antwort(s11g), 'trotzdem');
/* Gefunden mit diesem Punkt (3. Oktober): das Enter fiel nach dem Schliessen
   als Tastendruck auf den Knopf, dem Fokus den Fokus zurückgab — die Antwort
   ging verloren, und dieselbe Frage stand sofort wieder da. */
gleich('… und dieselbe Frage geht danach nicht gleich wieder auf', await zu(s11g), 0);
await ausloeser(s11g, `Dialog.mehrzeilig('Haftnotiz', '')`);
await s11g.waitForSelector('.overlay .finder textarea#fq', { timeout: 5000 }).catch(() => {});
await s11g.keyboard.type('Ohmsches Gesetz');
await s11g.keyboard.press('Control+Enter');
gleich('Die mehrzeilige Frage im bisherigen Fenster: Strg+Enter übernimmt, und sie geht nicht wieder auf',
  [await antwort(s11g), await zu(s11g)], ['Ohmsches Gesetz', 0]);
if (f11g.length) console.log('    (Meldungen der Gegenprobe, erwartet: ' + f11g.slice(0, 2).join(' | ') + ')');
await k11g.close();
fs.rmSync(ALLEIN, { recursive: true, force: true });

/* ==========================================================================
 * §12 · Durchsicht (5. Oktober): was die Aufrufer mitbringen, bleibt, und
 *       keine Frage bleibt stehen, wenn das Kit stolpert
 * --------------------------------------------------------------------------
 * Gefunden bei der Durchsicht am Endbau 1654e75d9, je im Browser gesehen:
 *
 *  a) DIE FOLGE DES AUFRUFERS. Bringt ein Aufrufer seinen eigenen Abbruch
 *     mit, stand er im bisherigen Fenster dort, wo der Aufrufer ihn
 *     hinsetzte — oft ZUERST, und dann hatte er den Fokus („Blatt löschen?":
 *     „Behalten" vor „Löschen"; „Vektoren bauen?": „Abbrechen" vor dem Knopf,
 *     der Geld kostet). Das Kit-Fenster schob ihn ans Ende: der Fokus stand
 *     auf „Löschen", und ein Enter löschte das Blatt.
 *  b) EIN „ABBRECHEN", NICHT ZWEI. Vier Aufrufer nennen ihren Abbruch
 *     „Abbrechen" unter der Kennung `nein` (Seiten zerlegen, zwei Mal
 *     „ersetzen?" in der Stiftleiste, Vektoren bauen). Das Kit-Fenster
 *     stellte sein eigenes „Abbrechen" daneben — zwei gleiche Knöpfe.
 *  c) STOLPERT DIE INSEL beim Zeichnen, stand ein leeres, unsichtbares
 *     Fenster über der ganzen Seite: alles still, Escape tat nichts, die
 *     Frage kam nie. Jetzt fragt das bisherige Fenster — wie wenn die Inseln
 *     gar nicht kommen —, und Escape nimmt einen Träger ohne Kit-Fenster weg.
 *  d) „RUHIGE DARSTELLUNG": ohne Bewegung meldet das Kit kein Ende seiner
 *     Ausblendung, und das Fenster stand nach der Antwort noch 240 ms
 *     regungslos da. Jetzt ist es im selben Bild weg. Und das Etikett
 *     `data-ui-motion`, das E702 für „ruhig" setzt, nahm die Brücke mit der
 *     letzten Insel wieder weg — es bleibt, solange „ruhig" gilt.
 *  e) DER RÜCKWEG FÜR JA/NEIN: ohne Inseln hatte `Dialog.bestaetigen` im
 *     bisherigen Fenster nur den einen Knopf („Alles löschen") — kein
 *     sichtbares „Abbrechen", am Telefon nur ein Tipp daneben. `confirm()`
 *     hatte eines. Jetzt steht es da, bei Gefahr zuerst und im Fokus.
 * ======================================================================== */
console.log('\n§12 · Durchsicht: die Folge des Aufrufers, ein Abbrechen, kein totes Fenster, ruhig im selben Bild');

/** Die Knöpfe des offenen Fensters: Haken, Beschriftung, und wer den Fokus hat. */
const knopfListe = (seite: Page): Promise<{ haken: string[]; namen: string[]; fokus: string | null }> =>
  seite.evaluate(() => {
    const k = [...document.querySelectorAll<HTMLElement>(
      '.overlay :is(.ui-touch-dialog, .ui-touch-action-sheet, .finder) button')];
    const haken = (b: HTMLElement): string => b.dataset['w'] !== undefined ? 'w:' + b.dataset['w'] : 'a:' + (b.dataset['a'] ?? '?');
    const a = document.activeElement as HTMLElement | null;
    return {
      haken: k.map(haken),
      namen: k.map(b => (b.querySelector('.ui-touch-dialog-button-label, .ui-touch-action-sheet-button-label, b')
        ?.textContent ?? b.textContent ?? '').trim()),
      fokus: a && k.includes(a) ? haken(a) : null
    };
  });

const k12 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const s12 = await k12.newPage();
alleFehler.push(...fehlerVon(s12));
await s12.goto(pathToFileURL(path.join(WURZEL, 'index.html')).href);
await bereitMachen(s12);

/* a) „Blatt löschen?" (spreadsheet/ansicht.ts): „Behalten" (Kennung '') zuerst. */
await stellen(s12, `Dialog.wahl({ titel: 'Blatt „Tabelle 2" löschen?', text: '12 gefüllte Zellen', knoepfe: [
  { id: '', text: 'Behalten', hinweis: 'Es wird nichts verändert' },
  { id: 'ja', text: 'Löschen', hinweis: '12 Zellen gehen verloren' }] })`);
await kitOffen(s12);
const behalten = await knopfListe(s12);
gleich('a) Der eigene Abbruch des Aufrufers bleibt, wo er stand: „Behalten" zuerst', behalten.haken, ['w:', 'w:ja']);
gleich('… und hat den Fokus, wie im bisherigen Fenster', behalten.fokus, 'w:');
await s12.keyboard.press('Enter');
gleich('… ein Enter behält das Blatt ("") — es löscht nicht', await antwort(s12), '');

/* a/b) „Vektoren bauen?" (ki/kontext.ts): „Abbrechen" unter `nein`, zuerst. */
await stellen(s12, `Dialog.wahl({ titel: 'Vektoren für 3 Seite(n) bauen?', text: 'Kostet etwa 0,01 CHF.', knoepfe: [
  { id: 'nein', text: 'Abbrechen', hinweis: 'Es wird nichts gesendet und nichts berechnet.' },
  { id: 'ja', text: 'Bauen', hinweis: 'Die semantische Suche wird danach besser.' }] })`);
await kitOffen(s12);
const bauen = await knopfListe(s12);
gleich('b) Ein „Abbrechen" des Aufrufers (Kennung nein) ist DAS Abbrechen — kein zweites daneben',
  bauen.namen, ['Abbrechen', 'Bauen']);
gleich('… es steht zuerst und hat den Fokus (der andere Knopf kostet Geld)', [bauen.haken, bauen.fokus],
  [['w:nein', 'w:ja'], 'w:nein']);
await s12.keyboard.press('Escape');
gleich('… und Escape antwortet wie es (nein) — der Aufrufer prüft auf „ja"', await antwort(s12), 'nein');

/* b) „Den Satz ersetzen?" (pdf/marken.ts): „Abbrechen" unter `nein`, zuletzt. */
await stellen(s12, `Dialog.wahl({ titel: 'Den Satz ersetzen?', text: 'Es gibt schon einen Farbsatz „Tinte".', knoepfe: [
  { id: 'ja', text: 'Ersetzen', hinweis: 'Die bisherigen Farben dieses Satzes gehen weg' },
  { id: 'nein', text: 'Abbrechen', hinweis: 'Nichts ändert sich' }] })`);
await kitOffen(s12);
const ersetzen = await knopfListe(s12);
gleich('b) „Ersetzen?": zwei Knöpfe, ein „Abbrechen"', ersetzen.namen, ['Ersetzen', 'Abbrechen']);
await s12.click('.overlay [data-w="nein"]');
gleich('… und ein Tipp darauf gibt die Kennung des Aufrufers (nein)', await antwort(s12), 'nein');
await s12.waitForTimeout(400);

/* c) Die Insel stolpert beim Zeichnen: das Portal des Kits lässt sich nicht
   einhängen (nur dieses eine Element wirft). Ein Fehler beim Zeichnen, den
   die Fehlergrenze der Insel fängt — wie jeder, den das Kit in einem
   Browser hätte, den es nicht kennt. */
await s12.evaluate(() => {
  const w = window as any;
  w.__echtesAnhaengen = Node.prototype.appendChild;
  Node.prototype.appendChild = function <T extends Node>(this: Node, kind: T): T {
    if (kind instanceof Element && kind.classList.contains('ui-touch-portal'))
      throw new Error('Probe test587 §12c: das Kit stolpert');
    return w.__echtesAnhaengen.call(this, kind);
  };
});
await stellen(s12, `UI.frage('Kaputt', 'bleibt')`);
const alt12 = await s12.waitForSelector('.overlay .finder #fq', { timeout: 4000, state: 'visible' })
  .then(() => true, () => false);
const tot = await s12.evaluate(() => document.querySelectorAll('[data-insel-traeger]').length);
p('c) Stolpert die Insel, fragt das bisherige Fenster — kein leeres Fenster über der Seite',
  alt12 && tot === 0, JSON.stringify({ altesFenster: alt12, traeger: tot }));
if (alt12) {
  await s12.fill('.overlay #fq', 'trotzdem');
  await s12.keyboard.press('Enter');
}
gleich('… und die Antwort kommt an', await antwort(s12), 'trotzdem');
/* Stillgelegt von Geburt an sind nur die Hüllen der SVG-Halter (textur.ts,
   linse.ts — `aria-hidden`, nie Inhalt); alles andere muss wieder gehen. */
gleich('… danach ist nichts mehr stillgelegt', await s12.evaluate(() =>
  [...document.body.children].filter(c => c.hasAttribute('inert') && c.getAttribute('aria-hidden') !== 'true')
    .map(c => c.id || c.className || c.tagName).slice(0, 6)), []);
await s12.evaluate(() => { Node.prototype.appendChild = (window as any).__echtesAnhaengen; });

/* c) Escape nimmt einen Träger, in dem kein Fenster des Kits steht. */
await s12.evaluate(() => {
  const o = document.createElement('div');
  o.className = 'overlay';
  o.setAttribute('data-insel-traeger', 'offen');
  document.body.appendChild(o);
});
await s12.waitForTimeout(150);
await s12.keyboard.press('Escape');
await s12.waitForTimeout(150);
gleich('… und Escape nimmt einen Träger ohne Kit-Fenster weg (sonst bliebe alles still)',
  await s12.evaluate(() => document.querySelectorAll('[data-insel-traeger]').length), 0);

await k12.close();

/* d) Ruhige Darstellung: im selben Bild weg, und das Etikett bleibt.
   AUF EINER FRISCHEN SEITE (finale Durchsicht, 5. Oktober): auf der Seite
   von c) blieb gegen den Endbau eine gestolperte Insel stehen, und mit ihr
   der Spiegel — das Etikett blieb dort aus dem falschen Grund, und der Punkt
   war gegen den Endbau grün. Hier steht nur die eine Frage, und gemessen
   wird erst, wenn ihr Träger fort ist (die letzte Insel weg). */
const k12d = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const s12d = await k12d.newPage();
alleFehler.push(...fehlerVon(s12d));
await s12d.goto(pathToFileURL(path.join(WURZEL, 'index.html')).href);
await bereitMachen(s12d);
await s12d.evaluate(() => (window as any).Einstellungen.S('bewegung', 'ruhig'));
await s12d.waitForTimeout(150);
await stellen(s12d, `UI.frage('Ruhig', 'x')`);
await kitOffen(s12d);
await s12d.waitForTimeout(300);
const ruhigWeg = await s12d.evaluate(() => new Promise<number>(fertig => {
  const t0 = performance.now();
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  const schau = (): void => {
    const d = document.querySelector<HTMLElement>('.ui-touch-dialog');
    const sichtbar = !!d && d.checkVisibility({ opacityProperty: true, visibilityProperty: true } as CheckVisibilityOptions);
    if (!sichtbar || performance.now() - t0 > 1000) fertig(Math.round(performance.now() - t0));
    else requestAnimationFrame(schau);
  };
  requestAnimationFrame(schau);
}));
p('d) „Ruhig": nach Escape ist das Fenster im nächsten Bild weg (vorher 240 ms regungslos)', ruhigWeg <= 50,
  ruhigWeg + ' ms');
gleich('… die Antwort ist null', await antwort(s12d), null);
const ohneInsel = await s12d.waitForFunction(() => !document.querySelector('[data-insel-traeger], [data-insel]'),
  null, { timeout: 3000 }).then(() => true, () => false);
p('… danach ist der Träger fort und keine Insel mehr eingehängt (der Spiegel ist aus)', ohneInsel);
await s12d.waitForTimeout(150);
gleich('… und html[data-ui-motion="reduce"] (E702) bleibt, solange „ruhig" gilt — auch ohne Insel',
  await s12d.evaluate(() => document.documentElement.getAttribute('data-ui-motion')), 'reduce');
await s12d.evaluate(() => (window as any).Einstellungen.S('bewegung', 'normal'));
await s12d.waitForTimeout(150);
gleich('… „ruhig" aus: es geht', await s12d.evaluate(() => document.documentElement.getAttribute('data-ui-motion')), null);
await stellen(s12d, `UI.frage('Normal', 'x')`);
await kitOffen(s12d);
await s12d.waitForTimeout(700);
const normalWeg = await s12d.evaluate(() => new Promise<number>(fertig => {
  const t0 = performance.now();
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  const schau = (): void => {
    const d = document.querySelector<HTMLElement>('.ui-touch-dialog');
    if (!d || performance.now() - t0 > 1000) { fertig(Math.round(performance.now() - t0)); return; }
    requestAnimationFrame(schau);
  };
  requestAnimationFrame(schau);
}));
p('Gegenprobe: mit Bewegung blendet es aus (es steht noch einige Bilder, ≥ 100 ms)', normalWeg >= 100,
  normalWeg + ' ms');
await antwort(s12d);
await k12d.close();

/* b) Am Telefon dasselbe: „Seiten zerlegen" (pdf/document-mode.ts). */
const k12t = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const s12t = await k12t.newPage();
alleFehler.push(...fehlerVon(s12t));
await s12t.goto(pathToFileURL(path.join(WURZEL, 'index.html')).href);
await bereitMachen(s12t);
await stellen(s12t, `Dialog.wahl({ titel: 'Dieses Blatt in 3 Seiten zerlegen?', text: 'Aus einem Blatt werden drei.', knoepfe: [
  { id: 'ja', text: 'In 3 Seiten zerlegen', hinweis: 'Nichts geht dabei verloren' },
  { id: 'nein', text: 'Abbrechen', hinweis: 'Das Blatt bleibt, wie es ist' }] })`);
await kitOffen(s12t);
gleich('b) Telefon, „Seiten zerlegen": ein „Abbrechen", nicht zwei',
  (await knopfListe(s12t)).namen, ['In 3 Seiten zerlegen', 'Abbrechen']);
await s12t.tap('.overlay [data-w="nein"]');
gleich('… und es antwortet „nein"', await antwort(s12t), 'nein');
await k12t.close();

/* e) Der Rückweg für Ja/Nein: ohne Inseln ein sichtbares „Abbrechen". */
const k12r = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true,
  serviceWorkers: 'block' });
const s12r = await k12r.newPage();
alleFehler.push(...fehlerVon(s12r));
await s12r.route(/\/quell\/fremd\/react\/react\.js$/, r => r.abort('internetdisconnected'));
await s12r.goto(`http://localhost:${PORT}/index.html`);
await bereitMachen(s12r);
await stellen(s12r, `Dialog.bestaetigen({ titel: 'Alle Daten löschen?', ja: 'Alles löschen', gefahr: true })`);
await s12r.waitForSelector('.overlay .finder [data-w]', { timeout: 5000 }).catch(() => {});
const rueck = await knopfListe(s12r);
gleich('e) Ohne Inseln: „Abbrechen" steht sichtbar da, bei Gefahr zuerst und im Fokus',
  [rueck.namen, rueck.haken, rueck.fokus], [['Abbrechen', 'Alles löschen'], ['w:', 'w:ja'], 'w:']);
await s12r.keyboard.press('Enter');
gleich('… ein Enter löscht nichts (false)', await antwort(s12r), false);
await stellen(s12r, `Dialog.bestaetigen({ titel: 'Übernehmen?', ja: 'Übernehmen' })`);
await s12r.waitForSelector('.overlay .finder [data-w]', { timeout: 5000 }).catch(() => {});
gleich('… ohne Gefahr steht die Antwort zuerst, „Abbrechen" daneben', (await knopfListe(s12r)).haken, ['w:ja', 'w:']);
await s12r.tap('.overlay [data-w="ja"]');
gleich('… und ein Tipp darauf gibt true', await antwort(s12r), true);
await k12r.close();

console.log('');
gleich('Keine unerwarteten Fehler auf den Seiten', alleFehler.slice(0, 5), []);

await browser.close();
server.close();
console.log(`\n${ok} bestanden, ${weg} durchgefallen`);
process.exit(weg ? 1 : 0);
