/* Suite 613 — Die Ziele der unteren Reiter, aus EINER Quelle (E748, L147)
 * ============================================================================
 * WAS HIER GEHALTEN WIRD. Redur, 12. Oktober 2026, mit einem Bild (rotes Feld
 * direkt über der unteren Leiste, ein Pfeil vom Reiter „Dokumente" hinauf):
 *
 *     „hier will ich etwas neues haben , wenn ich bei dokemnt bin … das es
 *      mir so oben wo rot gezeichnet ist eine neu dock dort kommen und dort
 *      nur sachen die mit unteren zutun haben dann für alle so"
 *
 * Seine Antwort auf Frage 2 (Empfehlung) legt den Inhalt fest:
 *
 *     Dokumente  Meine Ablage · Zuletzt · Favoriten · PDFs · Notizhefte
 *     Heute      Heute · Prüfungen · Noten · Stundenplan · Schule
 *     Lernen     Übersicht · Trainer · Lernpfad · Fehler · Fortschritt
 *     Termine    Übersicht · Kalender · Tagesplan · Besprechung · Verbinden
 *     Mehr       Posteingang · Sicherung · Wolke · Papierkorb · Einstellungen
 *
 * und seine Antwort auf Frage 3 eine Korrektur, ohne die diese Liste lügen
 * würde: „Prüfungen, Noten, Stundenplan und Schule schalten unten künftig
 * ‚Heute' an (wie oben unter ‚Heute ^', E726)" — L147.
 *
 * Dieser Lauf hält BOGEN 1 der Zielleiste: die Quelle, noch ohne Oberfläche.
 * `Register.navigation.ziele(reiter)` liefert, was die Zielleiste in Bogen 2
 * zeigen wird. Der Schlüssel ist das Merkmal `data-ziele` am Reiterknopf.
 *
 * DIE ZUSAGEN:
 *
 *   §1  Der Vertrag: `meldeZiele(reiter, fn)` und `ziele(reiter)` gibt es;
 *       ohne Reiter oder ohne Funktion wird nichts angemeldet, dieselbe
 *       Funktion nicht zweimal.
 *   §2  Redurs fünf: `ziele(key)` liefert je Reiter genau seine fünf, in
 *       seiner Folge (die Kurzform, wo es eine gibt), jedes mit eindeutiger
 *       Kennung, einem Zeichen aus `Register.symbole`, einem `tun` und
 *       aufsteigendem Rang. Welche davon ORTE sind (`ort: true`), steht
 *       ebenfalls fest: 17 von 25.
 *   §3  Der Schlüssel am Knopf: die fünf Reiter tragen `data-ziele`
 *       (dokumente · heute · lernen · termine · mehr), in der Folge der
 *       Leiste, und jeder Schlüssel liefert fünf Ziele.
 *   §4  Eine Quelle: jeder Name steht auf dem Bildschirm seiner Quelle — aus
 *       dem DOM gelesen, nicht aus dem Code: das Ortsmenü der Dokumente, die
 *       Klappen „Heute ^" und „Übersicht ^", die Karten der Termine, die
 *       Liste unter „Mehr"; Notizhefte, Übersicht und Tagesplan aus der
 *       Kante (`Register.kontext`), weil sie dort stehen. Eine Kurzform ist
 *       ein Stück ihres Namens.
 *   §5  Jedes Ort-Ziel schaltet SEINEN Reiter an: alle 17, jedes von einem
 *       anderen Bildschirm aus über sein `tun()` geöffnet — `aria-selected`
 *       steht auf dem Reiter, dessen `data-ziele` es geliefert hat, der
 *       Bildschirm zeigt das Ziel, und `an()` sagt ja (die Nachbarn nein).
 *   §6  Jedes Handlungs-Ziel tut, was es nennt: alle 8 öffnen ihren Dialog,
 *       ihren Bildschirm oder ihre Sicherung; der Reiter bleibt, wo er war
 *       (der Posteingang hat keinen). Ein Dialog wird an seinem Kopf erkannt,
 *       nicht an der Zahl offener Dialoge — „Wolke", das die Einstellungen
 *       öffnet, ist rot.
 *   §7  L147: die Ansichten unter „Heute ^" (Prüfungen, Noten, Stundenplan,
 *       Schule, Uni, Arbeit) schalten „Heute" an und melden sich als „heute",
 *       die unter „Übersicht ^" schalten „Lernen" an. Auch DRINNEN, mit dem
 *       Finger: im Lernzentrum über die Klappen gewechselt, folgt der Reiter
 *       — und die Adresse, so dass ein Neuladen dorthin zurückführt. Am
 *       Rechner (§7g/§7h) leuchtet die Kante nach einem Wechsel drinnen so
 *       wie nach dem direkten Öffnen derselben Ansicht, und wer danach
 *       weggeht und mit „Zurück" wiederkommt (§7i/§7j), findet dieselbe
 *       Ansicht unter demselben Titel und derselben Adresse.
 *   §8  Ein kaputter Lieferant nimmt nur sich selbst mit — ein werfender
 *       Lieferant, ein werfendes `zeigen()`, ein Ziel ohne `tun`, eine
 *       doppelte Kennung; sortiert nach Rang, höchstens fünf, jedes Mal neu
 *       gefragt. Und an einem echten Reiter ändert ein werfender Lieferant
 *       nichts an Redurs fünf. Unter „Termine" trägt jedes Ziel sein
 *       `zeigen()`: fehlt das Modul, fehlt das Ziel (§8g).
 *   §9  §5 und §8: die Listen bleiben privat (`ORTE`, `KLAPPEN`,
 *       `mehrGruppen` sind nicht ausgeführt), jeder Lieferant meldet sich
 *       INNERHALB seines Moduls an, die Schale meldet keinen — und `test537`
 *       (kein Bereich fasst einen anderen an) ist grün.
 *   §10 Der Bildschirm bleibt, wie er war: Mehr-Liste und Termine-Karten
 *       tragen dieselben Einträge in derselben Folge, und ein echter Tipp
 *       auf „Kalender", „Besprechung", „Sicherung" und „Wolke" tut dasselbe
 *       wie vorher — Besprechung und Wolke am Kopf ihres Dialogs erkannt.
 *   §11 Keine Seitenfehler.
 *
 * Kein fester Port (`listen(0)`, wie test601) — test400 bleibt unberührt.
 *
 * KANN DIESER LAUF ROT WERDEN? (§55.2) Gegen ba51915dc rot — die Zeilen
 * stehen im Commit „test613 (rot)" und in E748. Die Gegenproben stehen in
 * E748: einen Lieferanten weglassen, die L147-Korrektur zurückdrehen, die
 * Sortierung brechen.
 *
 *   node pruefungen/lauf/test613.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import type { Page, BrowserContext } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

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
await new Promise<void>(f => { server.listen(0, '127.0.0.1', () => f()); });
const PORT = (server.address() as { port: number }).port;

let ok = 0, weg = 0;
const p = (n: string, wahr: unknown, extra = ''): void => {
  if (wahr) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};

/* ══ WAS REDUR GEWÄHLT HAT ══════════════════════════════════════════════════
   Die Erwartung steht HIER, nicht im Produkt: der Lauf soll rot werden, wenn
   das Produkt etwas anderes liefert, als Redur gesagt hat. */
const REDUR: Record<string, string[]> = {
  dokumente: ['Meine Ablage', 'Zuletzt', 'Favoriten', 'PDFs', 'Notizhefte'],
  heute: ['Heute', 'Prüfungen', 'Noten', 'Stundenplan', 'Schule'],
  lernen: ['Übersicht', 'Trainer', 'Lernpfad', 'Fehler', 'Fortschritt'],
  termine: ['Übersicht', 'Kalender', 'Tagesplan', 'Besprechung', 'Verbinden'],
  mehr: ['Posteingang', 'Sicherung', 'Wolke', 'Papierkorb', 'Einstellungen']
};
const SCHLUESSEL = ['dokumente', 'heute', 'lernen', 'termine', 'mehr'];
const REITER: Record<string, string> = {
  dokumente: 'hl-dok', heute: 'hl-start', lernen: 'hl-lernen', termine: 'hl-bespr', mehr: 'hl-mehr'
};
/* Welche Ziele ORTE sind: nach dem Öffnen steht man auf einem Bildschirm,
   der einen Reiter hat — und zwar den eigenen. Handlungen öffnen einen
   Dialog oder einen Bildschirm ohne Reiter (der Posteingang). */
const HANDLUNG: Record<string, string[]> = {
  termine: ['Tagesplan', 'Besprechung', 'Verbinden'],
  mehr: ['Posteingang', 'Sicherung', 'Wolke', 'Papierkorb', 'Einstellungen']
};

const browser = await chromium.launch();
const fehler: string[] = [];
const warte = (s: Page, ms: number) => s.waitForTimeout(ms);

const oeffnen = async (): Promise<{ ctx: BrowserContext; s: Page; downloads: string[] }> => {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2
  });
  const s = await ctx.newPage();
  const downloads: string[] = [];
  s.on('pageerror', e => fehler.push(e.message));
  s.on('download', d => downloads.push(d.suggestedFilename()));
  await s.goto(`http://127.0.0.1:${PORT}/index.html`);
  await s.waitForFunction(() => typeof App !== 'undefined' && typeof Store !== 'undefined' &&
    (document.getElementById('tree')?.children.length || 0) > 0, null, { timeout: 30000 });
  await s.evaluate(() => {
    Store.setMeta('rundgangGesehen', true);
    /* Und die Neuerungen als gesehen: sonst legt sich 1,8 s nach jedem Start
       der Kasten „Neu in Redion" (#rg-neu, rundgang.ts) über die Seite und
       fängt einen späteren Tipp ab — gegen ba51915dc geschah genau das nach
       dem Neuladen in §7f. */
    Store.setMeta('neuerungenGesehen', 1e9);
    document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung,#rg-neu')
      .forEach(el => el.remove());
  });
  return { ctx, s, downloads };
};

/** Was die Quelle liefert — als reine Daten, ohne die Funktionen. */
type ZielDaten = { id: string; name: string; kurz: string | null; zeichen: string; rang: number | null;
                   ort: boolean; hatTun: boolean; hatAn: boolean; zeichenDa: boolean };
const zieleLesen = (s: Page, key: string): Promise<ZielDaten[] | null> => s.evaluate((k: string) => {
  const nav = (globalThis as any).Register?.navigation;
  if (!nav || typeof nav.ziele !== 'function') return null;
  const sym = (globalThis as any).Register?.symbole;
  return (nav.ziele(k) || []).map((z: any) => ({
    id: String(z.id), name: String(z.name), kurz: z.kurz ? String(z.kurz) : null,
    zeichen: String(z.zeichen || ''), rang: typeof z.rang === 'number' ? z.rang : null,
    ort: z.ort === true, hatTun: typeof z.tun === 'function', hatAn: typeof z.an === 'function',
    zeichenDa: !!(sym && typeof sym.hat === 'function' && sym.hat(String(z.zeichen || '')))
  }));
}, key);
const etikett = (z: ZielDaten): string => z.kurz ?? z.name;

/** Welcher Reiter leuchtet, und wo man ist. `koepfe` sagt, WELCHE Dialoge
 *  offen sind, nicht nur wie viele: der Kopf `.fh` (Redions Dialogkopf),
 *  sonst die erste `h2`, sonst der Platzhalter des Suchfelds — dieselbe
 *  Folge, nach der `fokus.ts` dem Dialog seinen Namen gibt. Gefunden in der
 *  Durchsicht: mit der Zahl allein blieb §6 grün, wenn „Wolke" die
 *  Einstellungen öffnete. */
const lage = (s: Page) => s.evaluate(() => {
  const offen = [...document.querySelectorAll('.overlay')].filter(o => (o as HTMLElement).offsetParent !== null
    || getComputedStyle(o).position === 'fixed');
  return {
    an: [...document.querySelectorAll('#handy-oben [role="tab"]')]
      .filter(b => b.getAttribute('aria-selected') === 'true').map(b => b.id),
    wo: String(App.schauplatz()),
    hash: location.hash,
    view: document.querySelector<HTMLElement>('[data-lw-view]')?.dataset['lwView'] ?? null,
    ort: (document.querySelector('.bib-ort .bib-pille-wort')?.textContent || '').trim(),
    dialoge: offen.length,
    koepfe: offen.map(o => (o.querySelector('.fh, h2')?.textContent || '').replace(/\s+/g, ' ').trim() ||
      (o.querySelector<HTMLInputElement>('input[placeholder]')?.placeholder || '').trim())
  };
});
/** Woran ein Dialog zu erkennen ist: sein Kopf (gemessen, E748). */
const KOPF: Record<string, RegExp> = {
  Tagesplan: /Tagesplan/, Besprechung: /Besprechungsnotizen/, Verbinden: /Kalender verbinden/,
  Wolke: /Wolke/, Papierkorb: /Papierkorb/, Einstellungen: /^Einstellungen$/
};
/** Ein Dialog mehr, und der neue heisst wie verlangt — sein Kopf, sonst ''. */
const neuerDialog = (vorher: { dialoge: number; koepfe: string[] }, nachher: { dialoge: number; koepfe: string[] },
                     kopf: RegExp | undefined): string =>
  !kopf || nachher.dialoge <= vorher.dialoge || vorher.koepfe.some(k => kopf.test(k)) ? ''
    : nachher.koepfe.find(k => kopf.test(k)) ?? '';

/** Ein Ziel über sein eigenes `tun()` öffnen — der Weg, den die Zielleiste
 *  in Bogen 2 nimmt. */
const tun = (s: Page, key: string, id: string): Promise<string> => s.evaluate(([k, i]) => {
  try {
    const z = ((globalThis as any).Register.navigation.ziele(k) || []).find((x: any) => x.id === i);
    if (!z) return 'fehlt';
    z.tun();
    return 'ok';
  } catch (e) { return 'warf: ' + String((e as Error)?.message || e); }
}, [key, id] as const);

const anWerte = (s: Page, key: string): Promise<Record<string, boolean | null>> => s.evaluate((k: string) => {
  const raus: Record<string, boolean | null> = {};
  for (const z of ((globalThis as any).Register?.navigation?.ziele?.(k) || []))
    raus[String(z.id)] = typeof z.an === 'function' ? (() => { try { return !!z.an(); } catch { return null; } })() : null;
  return raus;
}, key);

const allesZu = async (s: Page): Promise<void> => {
  await s.keyboard.press('Escape'); await warte(s, 150);
  await s.keyboard.press('Escape'); await warte(s, 150);
  await s.evaluate(() => document.querySelectorAll('.overlay,.menu,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung,#rg-neu')
    .forEach(el => el.remove()));
};

const menueLesen = (s: Page): Promise<string[]> => s.evaluate(() =>
  [...document.querySelectorAll('.menu [data-wahl]')].map(b => (b.textContent || '').replace(/✓/g, '').trim()));

const { ctx, s, downloads } = await oeffnen();

/* ═══ §1 Der Vertrag ═══════════════════════════════════════════════════════ */
console.log('\n§1 Der Vertrag im Register');
{
  const v = await s.evaluate(() => {
    const nav = (globalThis as any).Register?.navigation;
    if (!nav || typeof nav.meldeZiele !== 'function' || typeof nav.ziele !== 'function')
      return { da: false, leer: null, keineFn: null, erst: null, zweit: null };
    const fn = () => [];
    return { da: true, leer: nav.meldeZiele('', fn), keineFn: nav.meldeZiele('pruef-613-a', 42),
             erst: nav.meldeZiele('pruef-613-a', fn), zweit: nav.meldeZiele('pruef-613-a', fn) };
  });
  p('§1a Register.navigation hat meldeZiele und ziele', v.da === true);
  p('§1b ohne Reiter wird nichts angemeldet', v.leer === false, String(v.leer));
  p('§1c ohne Funktion wird nichts angemeldet', v.keineFn === false, String(v.keineFn));
  p('§1d eine Funktion wird angemeldet — und dieselbe kein zweites Mal', v.erst === true && v.zweit === false,
    `${v.erst} / ${v.zweit}`);
}

/* ═══ §2 Redurs fünf ═══════════════════════════════════════════════════════ */
console.log('\n§2 Redurs fünf je Reiter, in seiner Folge');
const QUELLE: Record<string, ZielDaten[]> = {};
{
  let orte = 0;
  for (const key of SCHLUESSEL) {
    const z = await zieleLesen(s, key) ?? [];
    QUELLE[key] = z;
    const etiketten = z.map(etikett);
    p(`§2a ${key}: ${REDUR[key]!.join(' · ')}`, JSON.stringify(etiketten) === JSON.stringify(REDUR[key]),
      JSON.stringify(etiketten));
    const ids = z.map(x => x.id);
    p(`§2b ${key}: Kennungen eindeutig, jedes Ziel hat ein tun`,
      z.length === 5 && new Set(ids).size === ids.length && z.every(x => x.hatTun), JSON.stringify(ids));
    p(`§2c ${key}: jedes Zeichen gibt es in Register.symbole`,
      z.length === 5 && z.every(x => x.zeichenDa), z.filter(x => !x.zeichenDa).map(x => x.zeichen).join(', '));
    const raenge = z.map(x => x.rang);
    p(`§2d ${key}: der Rang steigt`,
      z.length === 5 && raenge.every((r, i) => typeof r === 'number' && (i === 0 || r > (raenge[i - 1] as number))),
      JSON.stringify(raenge));
    const handlung = HANDLUNG[key] ?? [];
    const falsch = z.filter(x => x.ort === handlung.includes(etikett(x)));
    p(`§2e ${key}: ${5 - handlung.length} Orte, ${handlung.length} Handlungen`, z.length === 5 && falsch.length === 0,
      falsch.map(x => `${etikett(x)} ort=${x.ort}`).join(', '));
    orte += z.filter(x => x.ort).length;
  }
  p('§2f zusammen 17 Orte von 25 Zielen', orte === 17, String(orte));
}

/* ═══ §3 Der Schlüssel am Knopf ════════════════════════════════════════════ */
console.log('\n§3 data-ziele an den fünf Reitern');
{
  const m = await s.evaluate(() => [...document.querySelectorAll<HTMLElement>('#handy-oben [role="tab"]')]
    .map(b => ({ id: b.id, key: b.dataset['ziele'] ?? null,
                 zahl: b.dataset['ziele'] ? ((globalThis as any).Register?.navigation?.ziele?.(b.dataset['ziele']) || []).length : 0 })));
  p('§3a die fünf Reiter tragen data-ziele, in der Folge der Leiste',
    JSON.stringify(m.map(x => x.key)) === JSON.stringify(SCHLUESSEL), JSON.stringify(m.map(x => `${x.id}=${x.key}`)));
  p('§3b jeder Reiter gehört zu seinem Schlüssel', m.every(x => x.key && REITER[x.key] === x.id),
    JSON.stringify(m));
  p('§3c jeder Schlüssel liefert fünf Ziele', m.length === 5 && m.every(x => x.zahl === 5),
    JSON.stringify(m.map(x => x.zahl)));
}

/* ═══ §4 Eine Quelle ═══════════════════════════════════════════════════════ */
console.log('\n§4 Jeder Name steht auf dem Bildschirm seiner Quelle (aus dem DOM; drei aus der Kante)');
const kante = (bereich: string): Promise<string[]> => s.evaluate((b: string) =>
  ((globalThis as any).Register?.kontext?.fuer?.(b) || []).map((k: any) => String(k.name)), bereich);
const namenIn = (key: string, quelle: string[], nur?: string[]) => {
  const z = (QUELLE[key] ?? []).filter(x => !nur || nur.includes(etikett(x)));
  const fehlt = z.filter(x => !quelle.includes(x.name)).map(x => x.name);
  return { z, fehlt };
};
{
  /* DOKUMENTE — das Ortsmenü hinter der Ortspille. */
  await s.click('#hl-dok'); await warte(s, 700);
  await s.click('[data-orte]'); await warte(s, 450);
  const ortsmenue = await menueLesen(s);
  await allesZu(s);
  const a = namenIn('dokumente', ortsmenue, ['Meine Ablage', 'Zuletzt', 'Favoriten', 'PDFs']);
  p('§4a Dokumente: die vier Orte stehen im Ortsmenü', a.z.length === 4 && !a.fehlt.length,
    `fehlt: ${a.fehlt.join(', ')} · Menü: ${ortsmenue.join(' | ')}`);
  const kanteBib = await kante('bibliothek');
  const b = namenIn('dokumente', kanteBib, ['Notizhefte']);
  p('§4b Dokumente: „Notizhefte" steht in der Kante der Bibliothek', b.z.length === 1 && !b.fehlt.length,
    `Kante: ${kanteBib.join(' | ')}`);

  /* HEUTE und LERNEN — die zwei Klappen im Kopf des Lernzentrums. */
  await s.click('#hl-start'); await warte(s, 700);
  await s.click('[data-lw-klappe="heute"]'); await warte(s, 450);
  const heuteMenue = await menueLesen(s);
  await allesZu(s);
  const c = namenIn('heute', heuteMenue);
  p('§4c Heute: alle fünf stehen in „Heute ^"', c.z.length === 5 && !c.fehlt.length,
    `fehlt: ${c.fehlt.join(', ')} · Menü: ${heuteMenue.join(' | ')}`);
  await s.click('[data-lw-klappe="uebersicht"]'); await warte(s, 450);
  const uebMenue = await menueLesen(s);
  await allesZu(s);
  const d = namenIn('lernen', uebMenue);
  p('§4d Lernen: alle fünf stehen in „Übersicht ^"', d.z.length === 5 && !d.fehlt.length,
    `fehlt: ${d.fehlt.join(', ')} · Menü: ${uebMenue.join(' | ')}`);

  /* TERMINE — die Karten des Bildschirms und die Kante „kalender". */
  await s.click('#hl-bespr'); await warte(s, 700);
  const karten = await s.evaluate(() => [...document.querySelectorAll('.home-karten .hk b')].map(b => (b.textContent || '').trim()));
  const e = namenIn('termine', karten, ['Kalender', 'Besprechung', 'Verbinden']);
  p('§4e Termine: Kalender, Besprechung und Verbinden stehen auf den Karten', e.z.length === 3 && !e.fehlt.length,
    `fehlt: ${e.fehlt.join(', ')} · Karten: ${karten.join(' | ')}`);
  const kanteKal = await kante('kalender');
  const f = namenIn('termine', kanteKal, ['Übersicht', 'Tagesplan']);
  p('§4f Termine: Übersicht und Tagesplan stehen in der Kante „kalender"', f.z.length === 2 && !f.fehlt.length,
    `fehlt: ${f.fehlt.join(', ')} · Kante: ${kanteKal.join(' | ')}`);

  /* MEHR — die Liste des Bildschirms. */
  await s.click('#hl-mehr'); await warte(s, 700);
  const liste = await s.evaluate(() => [...document.querySelectorAll('.home-liste button[data-a]')]
    .map(b => (b.querySelector('.pt')?.firstChild?.textContent || '').trim()));
  const g = namenIn('mehr', liste);
  p('§4g Mehr: alle fünf stehen in der Liste', g.z.length === 5 && !g.fehlt.length,
    `fehlt: ${g.fehlt.join(', ')} · Liste: ${liste.join(' | ')}`);

  const kurz = SCHLUESSEL.flatMap(k => (QUELLE[k] ?? []).filter(x => x.kurz));
  const schlecht = kurz.filter(x => !x.name.toLocaleLowerCase('de').includes((x.kurz ?? '').toLocaleLowerCase('de')));
  p('§4h jede Kurzform ist ein Stück ihres Namens (Zuletzt, PDFs, Schule, Fehler, Verbinden)',
    kurz.length === 5 && !schlecht.length, kurz.map(x => `${x.kurz} ⊂ ${x.name}`).join(' · '));
}

/* ═══ §5 Jedes Ort-Ziel schaltet SEINEN Reiter an ══════════════════════════ */
console.log('\n§5 Jedes Ort-Ziel schaltet seinen Reiter an');
{
  let geprueft = 0;
  for (const key of SCHLUESSEL) {
    for (const z of (QUELLE[key] ?? []).filter(x => x.ort)) {
      /* Von einem ANDEREN Bildschirm aus: sonst stünde der Reiter schon da. */
      const weg = key === 'mehr' ? '#hl-dok' : '#hl-mehr';
      await s.click(weg); await warte(s, 500);
      const vorher = await lage(s);
      const r = await tun(s, key, z.id);
      await warte(s, 650);
      const nachher = await lage(s);
      const an = await anWerte(s, key);
      const soll = REITER[key]!;
      const zeigt = (key === 'heute' || key === 'lernen') ? nachher.view === z.id
        : key === 'dokumente' && z.id !== 'notizhefte' ? nachher.ort === z.name && nachher.wo === 'bibliothek'
        : key === 'dokumente' ? nachher.wo === 'notizhefte'
        : nachher.wo === 'kalender';
      const nachbarn = Object.entries(an).filter(([id]) => id !== z.id);
      p(`§5 ${key} › ${etikett(z)} → ${soll}`,
        r === 'ok' && vorher.an[0] !== soll && JSON.stringify(nachher.an) === JSON.stringify([soll]) && zeigt &&
          an[z.id] === true && nachbarn.every(([, w]) => w !== true),
        `tun ${r} · vorher ${vorher.an} · nachher ${nachher.an} · wo ${nachher.wo} · view ${nachher.view} · ort „${nachher.ort}" · an ${JSON.stringify(an)}`);
      geprueft++;
    }
  }
  p('§5z alle 17 Orte geprüft', geprueft === 17, String(geprueft));
}

/* ═══ §6 Jedes Handlungs-Ziel tut, was es nennt ════════════════════════════ */
console.log('\n§6 Jedes Handlungs-Ziel öffnet, was es nennt');
{
  let geprueft = 0;
  for (const key of SCHLUESSEL) {
    for (const z of (QUELLE[key] ?? []).filter(x => !x.ort)) {
      await allesZu(s);
      await s.click('#' + REITER[key]); await warte(s, 600);
      const vorher = await lage(s);
      downloads.length = 0;
      const r = await tun(s, key, z.id);
      await warte(s, 800);
      const nachher = await lage(s);
      const wie = z.id === 'inbox' || etikett(z) === 'Posteingang'
        ? (nachher.wo === 'posteingang' ? 'Posteingang offen' : '')
        : etikett(z) === 'Sicherung'
          ? (downloads.some(d => /^redion-sicherung-/.test(d)) ? 'Sicherung ' + downloads.join(',') : '')
          : (neuerDialog(vorher, nachher, KOPF[etikett(z)]) ? `Dialog „${neuerDialog(vorher, nachher, KOPF[etikett(z)])}" offen` : '');
      const reiterBleibt = etikett(z) === 'Posteingang'
        ? nachher.an.length === 0
        : JSON.stringify(nachher.an) === JSON.stringify(vorher.an) && vorher.an[0] === REITER[key];
      p(`§6 ${key} › ${etikett(z)}: ${wie || 'NICHTS'}`, r === 'ok' && !!wie && reiterBleibt,
        `tun ${r} · Reiter ${vorher.an} → ${nachher.an} · wo ${nachher.wo} · Dialoge ${vorher.dialoge} → ${nachher.dialoge} · Köpfe ${JSON.stringify(nachher.koepfe)}`);
      geprueft++;
    }
  }
  p('§6z alle 8 Handlungen geprüft', geprueft === 8, String(geprueft));
  await allesZu(s);
}

/* ═══ §7 L147 ══════════════════════════════════════════════════════════════ */
console.log('\n§7 L147: was unter „Heute ^" steht, schaltet „Heute" an');
{
  const HEUTE_KLAPPE = ['heute', 'pruefungen', 'noten', 'stundenplan', 'schule', 'uni', 'arbeit'];
  const UEB_KLAPPE = ['lernen', 'trainer', 'lernweg', 'fehler', 'fortschritt'];
  const falsch: string[] = [];
  for (const v of [...HEUTE_KLAPPE, ...UEB_KLAPPE]) {
    await s.click('#hl-mehr'); await warte(s, 400);
    await s.evaluate((x: string) => (globalThis as any).Produktwelten.lernen(x), v);
    await warte(s, 500);
    const l = await lage(s);
    const soll = HEUTE_KLAPPE.includes(v) ? ['hl-start', 'heute'] : ['hl-lernen', 'lernen'];
    if (l.an[0] !== soll[0] || l.wo !== soll[1] || l.view !== v) falsch.push(`${v}: ${l.an} ${l.wo} ${l.view}`);
  }
  p('§7a geöffnet: sieben Ansichten unter „Heute ^" → Heute, fünf unter „Übersicht ^" → Lernen',
    falsch.length === 0, falsch.join(' · '));

  /* Drinnen, mit dem Finger — der Fall, den L147 beim Namen nennt. */
  await s.click('#hl-lernen'); await warte(s, 700);
  const start = await lage(s);
  await s.click('[data-lw-klappe="heute"]'); await warte(s, 450);
  await s.click('.menu [data-wahl="noten"]'); await warte(s, 600);
  const noten = await lage(s);
  p('§7b in der Übersicht „Heute ^" → Noten: unten leuchtet Heute',
    start.an[0] === 'hl-lernen' && noten.view === 'noten' && noten.an[0] === 'hl-start' && noten.wo === 'heute',
    `vorher ${start.an} · nachher ${noten.an} · wo ${noten.wo} · view ${noten.view}`);
  await s.click('[data-lw-klappe="uebersicht"]'); await warte(s, 450);
  await s.click('.menu [data-wahl="trainer"]'); await warte(s, 600);
  const trainer = await lage(s);
  p('§7c und „Übersicht ^" → Trainer: unten leuchtet wieder Lernen',
    trainer.view === 'trainer' && trainer.an[0] === 'hl-lernen' && trainer.wo === 'lernen',
    `nachher ${trainer.an} · wo ${trainer.wo} · view ${trainer.view}`);
  await s.click('[data-lw-nav="heute"]'); await warte(s, 600);
  const haupt = await lage(s);
  p('§7d der Hauptteil „Heute" → Heute leuchtet', haupt.view === 'heute' && haupt.an[0] === 'hl-start' && haupt.wo === 'heute',
    `nachher ${haupt.an} · wo ${haupt.wo} · view ${haupt.view}`);
  await s.click('[data-lw-klappe="heute"]'); await warte(s, 450);
  await s.click('.menu [data-wahl="stundenplan"]'); await warte(s, 600);
  const plan = await lage(s);
  p('§7e und innerhalb von „Heute ^" bleibt es Heute (Stundenplan)',
    plan.view === 'stundenplan' && plan.an[0] === 'hl-start' && plan.wo === 'heute',
    `nachher ${plan.an} · wo ${plan.wo} · view ${plan.view}`);

  /* Die Adresse zieht mit: die Kante am Rechner liest sie zuerst (E393),
     und ein Neuladen führt dorthin, wo man war — nicht dorthin, wo man das
     Lernzentrum betreten hat. */
  await s.click('#hl-lernen'); await warte(s, 700);
  await s.click('[data-lw-klappe="heute"]'); await warte(s, 450);
  await s.click('.menu [data-wahl="noten"]'); await warte(s, 600);
  const adr = await lage(s);
  await s.reload();
  await s.waitForFunction(() => typeof App !== 'undefined' && !!document.querySelector('[data-lw-view]'),
    null, { timeout: 30000 });
  await s.evaluate(() => document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung,#rg-neu')
    .forEach(el => el.remove()));
  await warte(s, 800);
  const neu = await lage(s);
  p('§7f drinnen gewechselt, steht man an der Adresse der Ansicht — und ein Neuladen kommt dorthin zurück',
    adr.hash === '#welt-lernen-noten' && neu.view === 'noten' && neu.an[0] === 'hl-start' && neu.wo === 'heute',
    `vorher ${adr.hash} · nach dem Neuladen view ${neu.view}, ${neu.an}, wo ${neu.wo}, ${neu.hash}`);
}

/* ═══ §7g L147 am Rechner: die Kante sagt drinnen dasselbe wie beim Öffnen ═
   Gefunden beim Fertigstellen dieses Bogens, mit einer Sonde: wer am Rechner
   in der Übersicht über „Heute ^" auf Noten wechselte, sah in der Kante
   weiter „Lernzentrum" leuchten — wer Noten direkt öffnete, „Mehr Orte"
   (dahinter liegt „Heute", E388). Der Grund war eine Reihenfolge: der Titel
   meldete den neuen Schauplatz, BEVOR die Adresse umgeschrieben war, die
   Kante liest zuerst die Adresse (E393), und `replaceState` meldet sich
   danach nicht mehr. Gemessen wird nicht ein bestimmter Knopf, sondern die
   Gleichheit mit dem direkten Öffnen — welcher Knopf dort der richtige ist,
   bleibt Redurs Frage (L123 F02). */
console.log('\n§7g L147 am Rechner: die Kante sagt drinnen dasselbe wie beim Öffnen');
{
  const ctxR = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const r = await ctxR.newPage();
  r.on('pageerror', e => fehler.push(e.message));
  await r.goto(`http://127.0.0.1:${PORT}/index.html`);
  await r.waitForFunction(() => typeof App !== 'undefined' && typeof Store !== 'undefined' &&
    (document.getElementById('tree')?.children.length || 0) > 0, null, { timeout: 30000 });
  await r.evaluate(() => {
    Store.setMeta('rundgangGesehen', true);
    /* Und die Neuerungen als gesehen: sonst legt sich 1,8 s nach jedem Start
       der Kasten „Neu in Redion" (#rg-neu, rundgang.ts) über die Seite und
       fängt einen späteren Tipp ab — gegen ba51915dc geschah genau das nach
       dem Neuladen in §7f. */
    Store.setMeta('neuerungenGesehen', 1e9);
    document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung,#rg-neu')
      .forEach(el => el.remove());
  });
  const kanteLage = () => r.evaluate(() => ({
    mark: [...document.querySelectorAll<HTMLElement>('#kante .k-orte .k-knopf.ist-hier')].map(b => b.dataset['k'] ?? '?'),
    wo: String(App.schauplatz()), hash: location.hash,
    view: document.querySelector<HTMLElement>('[data-lw-view]')?.dataset['lwView'] ?? null
  }));
  const direkt: Record<string, { mark: string[]; wo: string }> = {};
  for (const v of ['noten', 'trainer']) {
    await r.evaluate((x: string) => (globalThis as any).Produktwelten.lernen(x), v);
    await r.waitForTimeout(600);
    direkt[v] = await kanteLage();
  }
  await r.evaluate(() => (globalThis as any).Produktwelten.lernen('lernen'));
  await r.waitForTimeout(600);
  await r.click('[data-lw-klappe="heute"]'); await r.waitForTimeout(450);
  await r.click('.menu [data-wahl="noten"]'); await r.waitForTimeout(600);
  const drinNoten = await kanteLage();
  p('§7g Übersicht → „Heute ^" → Noten: die Kante leuchtet wie bei direkt geöffneten Noten',
    drinNoten.view === 'noten' && drinNoten.wo === 'heute' && drinNoten.mark.length === 1 &&
      JSON.stringify(drinNoten.mark) === JSON.stringify(direkt['noten']?.mark),
    `drinnen ${JSON.stringify(drinNoten)} · direkt ${JSON.stringify(direkt['noten'])}`);
  await r.click('[data-lw-klappe="uebersicht"]'); await r.waitForTimeout(450);
  await r.click('.menu [data-wahl="trainer"]'); await r.waitForTimeout(600);
  const drinTrainer = await kanteLage();
  p('§7h und zurück über „Übersicht ^" → Trainer: wieder wie beim direkten Öffnen',
    drinTrainer.view === 'trainer' && drinTrainer.wo === 'lernen' && drinTrainer.mark.length === 1 &&
      JSON.stringify(drinTrainer.mark) === JSON.stringify(direkt['trainer']?.mark),
    `drinnen ${JSON.stringify(drinTrainer)} · direkt ${JSON.stringify(direkt['trainer'])}`);

  /* §7i/§7j DER SCHRITT ZURÜCK. Gefunden beim Fertigstellen, mit einer
     Sonde: der Verlauf merkt sich beim Weggehen Titel, Adresse UND den
     Zeichner der offenen Ansicht. Drinnen gewechselt, änderten sich Titel
     und Adresse — der Zeichner blieb der vom Öffnen. Zurück stand dann
     „Heute" im Kopf, `#welt-lernen-noten` in der Adresse und darunter die
     Übersicht. Hier wird mit dem echten Knopf zurückgegangen. */
  const sichtbar = () => r.evaluate(() => ({
    view: [...document.querySelectorAll<HTMLElement>('[data-lw-view]')]
      .filter(e => e.offsetParent !== null).map(e => e.dataset['lwView'] ?? '?'),
    wo: String(App.schauplatz()), hash: location.hash,
    mark: [...document.querySelectorAll<HTMLElement>('#kante .k-orte .k-knopf.ist-hier')].map(b => b.dataset['k'] ?? '?')
  }));
  for (const [klappe, wahl, wo, n] of [['heute', 'noten', 'heute', 'i'], ['uebersicht', 'trainer', 'lernen', 'j']] as const) {
    await r.evaluate(() => (globalThis as any).Produktwelten.lernen('lernen'));
    await r.waitForTimeout(600);
    await r.click(`[data-lw-klappe="${klappe}"]`); await r.waitForTimeout(450);
    await r.click(`.menu [data-wahl="${wahl}"]`); await r.waitForTimeout(600);
    await r.click('#kante .k-knopf[data-k="bibliothekOben"]'); await r.waitForTimeout(600);
    const weg = await sichtbar();
    await r.click('#btn-back'); await r.waitForTimeout(800);
    const zurueck = await sichtbar();
    p(`§7${n} Übersicht → „${klappe === 'heute' ? 'Heute' : 'Übersicht'} ^" → ${wahl}, weg und mit „Zurück" wieder da: dieselbe Ansicht unter demselben Titel und derselben Adresse`,
      weg.wo === 'bibliothek' && JSON.stringify(zurueck.view) === JSON.stringify([wahl]) && zurueck.wo === wo &&
        zurueck.hash === '#welt-lernen-' + wahl && JSON.stringify(zurueck.mark) === JSON.stringify(direkt[wahl]?.mark),
      `weg ${JSON.stringify(weg)} · zurück ${JSON.stringify(zurueck)} · direkt ${JSON.stringify(direkt[wahl])}`);
  }
  await ctxR.close();
}

/* ═══ §8 Ein kaputter Lieferant nimmt nur sich selbst mit ══════════════════ */
console.log('\n§8 Ein kaputter Lieferant nimmt nur sich selbst mit');
{
  const m = await s.evaluate(() => {
    const nav = (globalThis as any).Register?.navigation;
    if (!nav?.meldeZiele || !nav?.ziele) return null;
    let gefragt = 0;
    const tu = () => {};
    nav.meldeZiele('pruef-613-b', () => {
      gefragt++;
      return [{ id: 'c', name: 'C', zeichen: 'star', rang: 30, tun: tu },
              { id: 'a', name: 'A', zeichen: 'star', rang: 10, tun: tu },
              { id: 'b', name: 'B', zeichen: 'star', rang: 20, tun: tu }];
    });
    nav.meldeZiele('pruef-613-b', () => { throw new Error('kaputt'); });
    nav.meldeZiele('pruef-613-b', () => 'keine Liste');
    nav.meldeZiele('pruef-613-b', () => [
      { id: 'w', name: 'Wirft', zeichen: 'star', rang: 5, zeigen: () => { throw new Error('zeigen'); }, tun: tu },
      { id: 'n', name: 'Nein', zeichen: 'star', rang: 6, zeigen: () => false, tun: tu },
      { id: 'o', name: 'Ohne tun', zeichen: 'star', rang: 7 },
      { id: 'a', name: 'Doppelt', zeichen: 'star', rang: 1, tun: tu },
      { id: 'd', name: 'D', zeichen: 'star', rang: 40, tun: tu }]);
    const eins = nav.ziele('pruef-613-b').map((z: any) => z.id + ':' + z.name);
    const zwei = nav.ziele('pruef-613-b').length;
    nav.meldeZiele('pruef-613-c', () => Array.from({ length: 7 }, (_, i) =>
      ({ id: 'x' + i, name: 'X' + i, zeichen: 'star', rang: 70 - i * 10, tun: tu })));
    const sieben = nav.ziele('pruef-613-c').map((z: any) => z.id);
    const vorher = nav.ziele('dokumente').map((z: any) => z.id).join(',');
    nav.meldeZiele('dokumente', () => { throw new Error('kaputt'); });
    nav.meldeZiele('heute', () => [{ id: 'gift', name: 'Gift', zeichen: 'star', rang: 0,
      zeigen: () => { throw new Error('zeigen'); }, tun: tu }]);
    return { eins, gefragt, zwei, sieben, vorher,
             nachherDok: nav.ziele('dokumente').map((z: any) => z.id).join(','),
             heute: nav.ziele('heute').map((z: any) => z.kurz ?? z.name),
             unbekannt: nav.ziele('gibt-es-nicht').length };
  });
  p('§8a ein werfender Lieferant, keine Liste, werfendes zeigen(), zeigen()=false, ohne tun, doppelt: alle fallen allein weg',
    JSON.stringify(m?.eins) === JSON.stringify(['a:A', 'b:B', 'c:C', 'd:D']), JSON.stringify(m?.eins));
  p('§8b jeder Lieferant wird bei jedem Fragen neu gefragt', m?.gefragt === 2 && m?.zwei === 4,
    `gefragt ${m?.gefragt}, ${m?.zwei} Ziele`);
  p('§8c höchstens fünf, nach Rang', JSON.stringify(m?.sieben) === JSON.stringify(['x6', 'x5', 'x4', 'x3', 'x2']),
    JSON.stringify(m?.sieben));
  p('§8d ein werfender Lieferant an „dokumente" ändert nichts an Redurs fünf',
    !!m && m.vorher.split(',').length === 5 && m.vorher === m.nachherDok, `${m?.vorher} → ${m?.nachherDok}`);
  p('§8e ein Ziel mit werfendem zeigen() an „heute" nimmt nur sich selbst mit',
    JSON.stringify(m?.heute) === JSON.stringify(REDUR['heute']), JSON.stringify(m?.heute));
  p('§8f ein Reiter ohne Lieferant liefert eine leere Liste', m?.unbekannt === 0, String(m?.unbekannt));

  /* §8g FEHLT DAS MODUL, FEHLT DAS ZIEL. Der Entwurf, unter „Termine":
     „Jedes Ziel trägt `zeigen()` wie im Kontext-Register." Gefunden in der
     Durchsicht: Besprechung und Verbinden kamen aus den Karten ohne
     `zeigen` — ohne `Meeting` stand „Besprechung" weiter in der Liste, und
     ihr `tun` tat still nichts. Hier wird je ein Modul kurz vom Fenster
     genommen (dieselbe Stelle, an der die Ziele es suchen) und sofort
     zurückgelegt. */
  const ohne = await s.evaluate(() => {
    const w = globalThis as any;
    const ids = (): string[] => (w.Register?.navigation?.ziele?.('termine') || []).map((z: any) => String(z.id));
    const raus: Record<string, string[]> = { alle: ids() };
    for (const name of ['Meeting', 'Kalender', 'Produktwelten', 'Plan']) {
      const alt = w[name];
      w[name] = undefined;
      try { raus[name] = ids(); } finally { w[name] = alt; }
    }
    raus['wieder'] = ids();
    return raus;
  });
  const ALLE = ['uebersicht', 'kal-auf', 'tagesplan', 'mtg', 'kal'];
  const ohneZiel: Record<string, string> = { Meeting: 'mtg', Kalender: 'kal', Produktwelten: 'kal-auf', Plan: 'tagesplan' };
  const falschOhne = Object.entries(ohneZiel)
    .filter(([modul, id]) => JSON.stringify(ohne[modul]) !== JSON.stringify(ALLE.filter(x => x !== id)))
    .map(([modul]) => `ohne ${modul}: ${JSON.stringify(ohne[modul])}`);
  p('§8g Termine: ohne Meeting fehlt Besprechung, ohne Kalender Verbinden, ohne Produktwelten Kalender, ohne Plan Tagesplan — und nur das',
    JSON.stringify(ohne['alle']) === JSON.stringify(ALLE) && JSON.stringify(ohne['wieder']) === JSON.stringify(ALLE) &&
      falschOhne.length === 0,
    `alle ${JSON.stringify(ohne['alle'])} · ${falschOhne.join(' · ')} · wieder ${JSON.stringify(ohne['wieder'])}`);
}

/* ═══ §9 Privat bleibt privat, kein Bereich fasst einen anderen an ════════ */
console.log('\n§9 §5 und §8: die Listen bleiben, wo sie sind');
{
  const m = await s.evaluate(() => ({
    orte: typeof (globalThis as any).Bibliothek?.ORTE,
    klappen: typeof (globalThis as any).Lernwelt?.KLAPPEN,
    mehr: typeof (globalThis as any).Ansichten?.mehrGruppen
  }));
  p('§9a ORTE, KLAPPEN und mehrGruppen sind nicht ausgeführt',
    m.orte === 'undefined' && m.klappen === 'undefined' && m.mehr === 'undefined', JSON.stringify(m));
  /* Innerhalb des Moduls heisst: vor der Zeile, mit der es sich am Fenster
     anmeldet — dahinter sähe der Lieferant die privaten Listen nicht. */
  const drinnen = (datei: string, modul: string): boolean => {
    const t = fs.readFileSync(path.join(WURZEL, datei), 'utf8');
    const ruf = t.indexOf('meldeZiele(');
    const ende = t.indexOf(`(window as any).${modul} = ${modul};`);
    return ruf > 0 && ende > 0 && ruf < ende;
  };
  p('§9b Bibliothek meldet ihre Ziele innerhalb ihres Moduls', drinnen('src/bereiche/wissen/bibliothek.ts', 'Bibliothek'));
  p('§9c Lernwelt meldet ihre Ziele innerhalb ihres Moduls', drinnen('src/bereiche/wissen/lernwelt.ts', 'Lernwelt'));
  p('§9d Ansichten melden ihre Ziele innerhalb ihres Moduls',
    drinnen('src/bereiche/datenbanken/ansichten/dienst.ts', 'Ansichten'));
  const schale = ['src/schale/aufbau/schale.ts', 'src/schale/aufbau/seitenleiste.ts']
    .filter(d => fs.readFileSync(path.join(WURZEL, d), 'utf8').includes('meldeZiele('));
  p('§9e die Schale meldet keine Ziele — sie kennt keinen Bereich beim Namen', schale.length === 0, schale.join(', '));
  const lauf = spawnSync(process.execPath, [path.join(WURZEL, 'pruefungen/lauf/test537.mts')], { encoding: 'utf8' });
  p('§9f test537: kein Bereich fasst einen anderen neu an', lauf.status === 0,
    (lauf.stdout || '').split('\n').filter(z => z.includes('✗')).join(' | ').slice(0, 400));
}

/* ═══ §10 Der Bildschirm bleibt, wie er war ════════════════════════════════ */
console.log('\n§10 Mehr und Termine tun, was sie vorher taten');
{
  await allesZu(s);
  await s.click('#hl-mehr'); await warte(s, 700);
  const liste = await s.evaluate(() => [...document.querySelectorAll<HTMLElement>('.home-liste button[data-a]')]
    .map(b => b.dataset['a'] + ':' + (b.querySelector('.pt')?.firstChild?.textContent || '').trim()));
  p('§10a die Mehr-Liste: dieselben 13 Einträge in derselben Folge', JSON.stringify(liste) === JSON.stringify([
    'workspace:Seiten & Wissen', 'schublade:Arbeitsbereich', 'kompass:Kompass', 'befehle:Befehle',
    'tasten:Tastenkürzel', 'vorlagen:Vorlagen', 'sichern:Sicherung', 'import:Importieren', 'inbox:Posteingang',
    'wolke:Wolke', 'papierkorb:Papierkorb', 'einstellungen:Einstellungen', 'ueber:Über Redion']), JSON.stringify(liste));
  downloads.length = 0;
  await s.click('.home-liste button[data-a="sichern"]'); await warte(s, 900);
  p('§10b ein Tipp auf „Sicherung" speichert eine Sicherung', downloads.some(d => /^redion-sicherung-/.test(d)),
    downloads.join(', '));
  const vorWolke = await lage(s);
  await s.click('.home-liste button[data-a="wolke"]'); await warte(s, 700);
  const nachWolke = await lage(s);
  p('§10c ein Tipp auf „Wolke" öffnet den Wolken-Dialog', !!neuerDialog(vorWolke, nachWolke, KOPF['Wolke']),
    `${vorWolke.dialoge} → ${nachWolke.dialoge} · Köpfe ${JSON.stringify(nachWolke.koepfe)}`);
  await allesZu(s);
  await s.click('.home-liste button[data-a="kompass"]'); await warte(s, 600);
  p('§10d ein Tipp auf „Kompass" führt in den Kompass', (await lage(s)).wo === 'kompass', (await lage(s)).wo);

  await s.click('#hl-bespr'); await warte(s, 700);
  const karten = await s.evaluate(() => [...document.querySelectorAll<HTMLElement>('.home-karten .hk')]
    .map(b => b.dataset['a'] + ':' + (b.querySelector('b')?.textContent || '').trim() + ':' + (b.querySelector('span')?.textContent || '').trim()));
  p('§10e die Termine-Karten: dieselben drei, mit denselben Sätzen', JSON.stringify(karten) === JSON.stringify([
    'kal-auf:Kalender:Alle Termine in einer Chronologie', 'kal:Kalender verbinden:Google, CalDAV — Termine hereinholen',
    'mtg:Besprechung:Mitreden statt mitschreiben']), JSON.stringify(karten));
  const vorMtg = await lage(s);
  await s.click('.home-karten .hk[data-a="mtg"]'); await warte(s, 700);
  const nachMtg = await lage(s);
  p('§10f ein Tipp auf „Besprechung" öffnet die Besprechung', !!neuerDialog(vorMtg, nachMtg, KOPF['Besprechung']),
    `${vorMtg.dialoge} → ${nachMtg.dialoge} · Köpfe ${JSON.stringify(nachMtg.koepfe)}`);
  await allesZu(s);
  await s.click('#hl-bespr'); await warte(s, 600);
  await s.click('.home-karten .hk[data-a="kal-auf"]'); await warte(s, 700);
  const kal = await lage(s);
  p('§10g ein Tipp auf „Kalender" führt in den Kalender, Termine bleibt an',
    kal.wo === 'kalender' && kal.hash === '#kalender' && kal.an[0] === 'hl-bespr', `${kal.wo} ${kal.hash} ${kal.an}`);
}

/* ═══ §11 Keine Seitenfehler ═══════════════════════════════════════════════ */
console.log('\n§11 Keine Seitenfehler');
p('§11 keine Seitenfehler', fehler.length === 0, fehler.slice(0, 3).join(' | '));

await ctx.close();
await browser.close();
server.close();
console.log(`\n${ok} von ${ok + weg} — Suite 613 (E748: die Ziele der unteren Reiter, aus einer Quelle)`);
process.exit(weg ? 1 : 0);
