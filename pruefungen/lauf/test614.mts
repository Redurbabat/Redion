/* Suite 614 — Die Zielleiste über der unteren Leiste, am Telefon (E749)
 * ============================================================================
 * WAS HIER GEHALTEN WIRD. Redur, 12. Oktober 2026, mit einem Bild (rotes Feld
 * direkt über der unteren Leiste, ein Pfeil vom Reiter „Dokumente" hinauf):
 *
 *     „hier will ich etwas neues haben , wenn ich bei dokemnt bin und sowohl
 *      bei laptop mit maus drauber gehen als auch b eim hand mit finderr das
 *      ich so das es mir so oben wo rot gezeichnet ist eine neu dock dort
 *      kommen … ich sollte direk mit hand ohne klick direk wächseln können es
 *      sollte flüssig sein mit appel efeck usw aber zuers nur bei handy"
 *
 * Seine Antworten auf Frage 1 und 4 (Empfehlung) und seine Korrektur vom
 * 13. Oktober, 01:08 UTC, die allem vorgeht:
 *
 *     „die neu dock nur wenn ich mit hand nach oven so zi eht kommt das doet
 *      aber beim klicken nicht"
 *
 * Die Zielleiste öffnet NUR durch Hochziehen — der Finger steigt über die
 * Oberkante der Leiste. Ein Tipp öffnet sie nie, Halten öffnet sie auch nicht.
 * Bogen 1 (E748, test613) hat die Quelle gebaut: `Register.navigation.ziele`.
 * Dieser Lauf hält BOGEN 2: die Geste und das Bild, nur am Telefon.
 *
 * DIE ZUSAGEN (die Abschnitte des Entwurfs, §0–§19):
 *
 *   §0  Ruhe: `#ho-ziele` steht im Baum, ist ein Menü und verborgen; die fünf
 *       Reiter sagen, dass sie eines haben (aria-haspopup, aria-controls).
 *   §1  Ein Tipp bleibt ein Tipp: je Reiter genau ein Klick, und in KEINEM
 *       Bild ist die Zielleiste zu sehen. Ein Daumen, der innerhalb der Leiste
 *       12 oder 24 px hinaufrollt, tippt genau einmal — auch am oberen Rand
 *       des Reiters, wo 10–15 px über die Kante reichen (§1c), und nichts
 *       fällt daneben auf die Seite. Hinauf und dann seitwärts: nichts (§1d).
 *   §2  Halten öffnet nichts: 800 ms ruhig liegen — in keinem Bild eine
 *       Zielleiste, und das Loslassen tut, was es auf dem Grundstand tut.
 *   §3  Hinaufziehen öffnet in höchstens zwei Bildern, mit dem Namen des
 *       Reiters, fünf Zielen, `aria-expanded` und der Lage über der Leiste.
 *   §4  Gleiten und Loslassen wählt GENAU EINMAL — auch während die Scheibe
 *       noch wächst. Kein Klick auf die Leiste, die Schublade bleibt zu.
 *   §5  Zwischen den Reitern tauscht nur der Inhalt; dieselbe Scheibe, in
 *       keinem Bild weg. Und aus dem Pillenzug heraus hinauf.
 *   §6  Losgelassen auf einem anderen Reiter: genau ein Klick dieses Reiters;
 *       unter der Leiste (Home-Strich) ist abgebrochen (§6b, §6c).
 *   §7  Abbrechen: zu hoch losgelassen, Escape mit dem Finger unten,
 *       touchCancel — nichts geschieht, die Pille kehrt zurück; und der
 *       nächste echte Tipp danach kommt an (§7f).
 *   §8  Hinab öffnet nichts und tut, was es auf dem Grundstand tut.
 *   §9  Jedes Ziel über die Geste: jeder der 17 Orte schaltet SEINEN Reiter
 *       an, jede der 8 Handlungen öffnet, was sie nennt, und der Reiter bleibt.
 *   §10 Eine Quelle: Name, Folge und Zeichen sind `Register.navigation.ziele`;
 *       ein Name mit Markup steht als Text da (§19);
 *       wo man steht, sagt `aria-current` und fette Schrift.
 *   §11 §37/§38: 44 px gerendert, Text, `menuitem`; angepeilt nicht nur über
 *       Farbe (Marke und gehobenes Zeichen); die Schrift 4,5 : 1 über dem
 *       schwarz-weiss-rot-blauen Muster, hell und dunkel; und der Reiter
 *       unter der Pille bleibt lesbar — keine Brechung über seinem Wort,
 *       solange die Zielleiste offen steht (§11e, vom BILD gefunden); die
 *       Marke hebt sich mit 3 : 1 von der Scheibe ab, wo sich kein Zeichen
 *       hebt — ruhig, Hoher Kontrast, erzwungene Farben (§11f, Bildpunkte).
 *   §12 Tastatur: Pfeil hinauf am Reiter öffnet, Pfeile rundum, Pos1/Ende,
 *       Enter wählt, Escape gibt den Fokus zurück, Tab schliesst; nach der
 *       Wahl eines Orts steht der Fokus auf dem Reiter (§12g), eine Handlung
 *       gibt ihn ihrem Fenster (§12h).
 *   §13 Ruhig (System UND „Ruhige Darstellung"): keine Animation, der
 *       Zustand ist trotzdem zu sehen.
 *   §14 Nur `transform` und `opacity` in allen Bildern.
 *   §15 Wo nicht: am Rechner, beim Schreiben, im offenen Dokument, quer.
 *   §16 Kein Konflikt: Schublade, Wischen, das Heben eines Blocks (E83).
 *   §17 Über Toast und Neu-Laden-Streifen; danach stehen beide unverändert.
 *   §18 Glas: dasselbe Rezept im selben `@supports`-Block wie die Leiste,
 *       deckend unter Kontrast und weniger Transparenz, ≤ 60 % Glasfläche.
 *   §19 Start: die neue Datei ist geladen, im Grundstock und klein.
 *
 * EINGABE NUR ECHT: `Input.dispatchTouchEvent` über CDP (wie test585) und
 * `page.keyboard` für Tasten — nie `dispatchEvent` (P135: ein Ereignis, das
 * der Lauf selbst schickt, beweist nur den Horcher, nicht den Weg dorthin).
 * Beobachtet wird Bild für Bild über `requestAnimationFrame`.
 *
 * GEMESSEN VOR DEM SCHREIBEN (messungen.md §106): Chromium klickt nach einer
 * Berührung bis 15 px Weg, ab 20 px nicht mehr — mit `pan-y` und mit `none`
 * gleich. Senkrechtes Ziehen auf der Leiste rollte am Grundstand NICHTS und
 * endete nach zwei Zügen mit `pointercancel`; mit `touch-action:none` kommt
 * jeder Zug bei der Leiste an. Ein langer Tipp bringt in der kopflosen Schale
 * kein `contextmenu` (auch nicht über `synthesizeTapGesture`).
 *
 * KANN DIESER LAUF ROT WERDEN? (§55.2) Gegen `352eed65c` rot mit 29 von 105
 * — die Zeilen stehen im Commit „test614 (rot)". Fünf Gegenproben, jede rot
 * (E749): das Klickschlucken heraus (§1b zwei Klicks, §16a die Schublade),
 * die Treffer aus `getBoundingClientRect` während des Wachsens (§4b wählt
 * die Notizhefte statt der Favoriten), `touch-action:pan-y` zurück (61 rot:
 * nichts kommt oben an), die Ruhig-Abfrage heraus (§13 „Ruhige
 * Darstellung", 9 Animationen), `innerHTML` statt `textContent` (§10c).
 *
 * DIE DURCHSICHT (E749, 13. Oktober) brachte 16 Zusagen dazu: §1c, §1d, §6b,
 * §6c, §7f, §11f, §12g, §12h. Gegen `f4ebb5816` rot mit 15 von 122 — nur §12h
 * war schon grün (eine Handlung gab den Fokus schon ihrem Fenster). Sieben
 * Gegenproben, jede rot (E749): die 16-px-Schwelle heraus (§1c), die Spalte
 * (§1d), das Ende des Schluckens beim Aufsetzen (§7f), das Schlucken daneben
 * (§1c, „page@760"), der Home-Strich (§6b, §6c), der Fokus (§12g), der Ring
 * (§11f fünfmal).
 *
 * Kein fester Port (`listen(0)`) — test400 bleibt unberührt.
 *
 *   node pruefungen/lauf/test614.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import type { Page, BrowserContext, CDPSession, Browser } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

declare const App: any, Store: any, UI: any, Register: any, Einstellungen: any, Aussehen: any, Wischen: any;

const WURZEL = path.resolve(import.meta.dirname, '../..');
/* Echte Vergleichsbilder der laufenden Redion-App nur mit synthetischem
   Browserkontext. Die bisherige 614er-Suite bleibt ohne --capture unverändert. */
const BILDER = process.argv.includes('--capture')
  ? path.join(WURZEL, 'bilder', 'workspace-2', 'mobile-nav') : '';
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
const warte = (ms: number) => new Promise(f => setTimeout(f, ms));
const lies = (datei: string) => fs.existsSync(path.join(WURZEL, datei)) ? fs.readFileSync(path.join(WURZEL, datei), 'utf8') : '';

/* ══ WAS REDUR GEWÄHLT HAT (Frage 2, E748) ═════════════════════════════════ */
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
const REITER_LISTE = SCHLUESSEL.map(k => REITER[k]!);

const fehler: string[] = [];
const browser = await chromium.launch();

type Auf = { ctx: BrowserContext; pc: Page; cdp: CDPSession; downloads: string[] };
const aufmachen = async (o: { handy?: boolean; ruhig?: boolean; dunkel?: boolean; breite?: number; hoehe?: number;
                              mit?: Browser; muster?: boolean; farben?: boolean } = {}): Promise<Auf> => {
  const handy = o.handy !== false;
  const ctx = await (o.mit ?? browser).newContext({
    viewport: { width: o.breite ?? (handy ? 390 : 1440), height: o.hoehe ?? (handy ? 844 : 900) },
    hasTouch: handy, isMobile: handy, colorScheme: o.dunkel ? 'dark' : 'light',
    ...(o.ruhig ? { reducedMotion: 'reduce' as const } : {}),
    ...(o.farben ? { forcedColors: 'active' as const } : {})
  });
  const pc = await ctx.newPage();
  const downloads: string[] = [];
  pc.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 200)));
  pc.on('download', d => downloads.push(d.suggestedFilename()));
  await pc.goto(`http://127.0.0.1:${PORT}/index.html`);
  await pc.waitForFunction(() => typeof App !== 'undefined' && typeof Store !== 'undefined' &&
    !!document.querySelector('#page'), null, { timeout: 30000 });
  await pc.waitForTimeout(1600);
  await pc.evaluate((dunkel: boolean) => {
    Store.setMeta('rundgangGesehen', true);
    Store.setMeta('neuerungenGesehen', 1e9);
    document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung,#rg-neu')
      .forEach(el => el.remove());
    App.theme(dunkel ? 'dark' : 'light');
  }, !!o.dunkel);
  await pc.waitForTimeout(400);
  const cdp = await ctx.newCDPSession(pc);
  return { ctx, pc, cdp, downloads };
};

type Punkt = { x: number; y: number };
const finger = (cdp: CDPSession, typ: 'touchStart' | 'touchMove' | 'touchEnd' | 'touchCancel', x = 0, y = 0) =>
  cdp.send('Input.dispatchTouchEvent', {
    type: typ, touchPoints: (typ === 'touchEnd' || typ === 'touchCancel') ? [] : [{ x, y }]
  });
/** Den Finger in kleinen Schritten führen — wie eine Hand, nicht wie ein Sprung. */
const fuehren = async (cdp: CDPSession, von: Punkt, nach: Punkt, schritte = 4, takt = 16) => {
  for (let i = 1; i <= schritte; i++) {
    await finger(cdp, 'touchMove', von.x + (nach.x - von.x) * i / schritte, von.y + (nach.y - von.y) * i / schritte);
    await warte(takt);
  }
};

/* ══ DER BEOBACHTER IM BROWSER ══════════════════════════════════════════════
 * Ein Horcher je Seite (ein zweiter zählte jeden Klick doppelt — test585).
 * Er zählt Klicks auf die Reiter, Ankünfte über den Reiterweg (`dockWechsel`
 * ruft `Wischen.ankunft` genau einmal), und Bild für Bild, ob die Zielleiste
 * zu sehen ist. `ueberBild` ist das Bild, in dem der Finger die Oberkante der
 * Leiste überquerte — gelesen aus dem Zeigerstrom, nicht geschickt. */
const BEOBACHTEN = () => {
  const w = window as any;
  if (!w.__z614) {
    const z: any = w.__z614 = { klicks: {}, wechsel: 0, bild: 0, offenBilder: 0, sichtbarAb: -1, ueberBild: -1,
      zuBilder: 0, laeuft: false, oben: 0, fremd: [] };
    document.addEventListener('click', e => {
      const t = e.target as Element | null;
      const k = t?.closest?.('#handy-oben > button');
      if (k) z.klicks[k.id] = (z.klicks[k.id] || 0) + 1;
      /* DANEBEN (Durchsicht E749): ein Klick, der weder die Leiste noch die
         Zielleiste trifft und trotzdem bei der Seite ankommt — so fiel
         Chromiums Klick nach einem Hochrollen am Rand auf den Inhalt darüber. */
      else if (t && !t.closest?.('#ho-ziele'))
        z.fremd.push(((t.closest?.('[id]') as Element | null)?.id || t.tagName) + '@' + Math.round((e as MouseEvent).clientY));
    });
    if (typeof Wischen !== 'undefined' && typeof Wischen.ankunft === 'function') {
      const alt = Wischen.ankunft;
      Wischen.ankunft = function (...a: unknown[]) { z.wechsel++; return alt.apply(this, a); };
    }
    document.getElementById('handy-oben')?.addEventListener('pointermove', e => {
      if (z.ueberBild < 0 && e.clientY < z.oben) z.ueberBild = z.bild;
    }, { capture: true, passive: true });
    const sichtbar = (): boolean => {
      const s = document.getElementById('ho-ziele');
      if (!s || s.hidden) return false;
      const st = getComputedStyle(s);
      const r = s.getBoundingClientRect();
      return st.display !== 'none' && st.visibility !== 'hidden' && +st.opacity > 0 && r.width > 0 && r.height > 0;
    };
    z.sichtbar = sichtbar;
    const takt = () => {
      z.bild++;
      if (sichtbar()) { z.offenBilder++; if (z.sichtbarAb < 0) z.sichtbarAb = z.bild; }
      else if (z.sichtbarAb >= 0) z.zuBilder++;
      requestAnimationFrame(takt);
    };
    requestAnimationFrame(takt);
  }
  const z = w.__z614;
  z.klicks = {}; z.wechsel = 0; z.offenBilder = 0; z.sichtbarAb = -1; z.ueberBild = -1; z.zuBilder = 0; z.fremd = [];
  z.oben = document.getElementById('handy-oben')?.getBoundingClientRect().top ?? 0;
};
const beobachten = (pc: Page) => pc.evaluate(BEOBACHTEN);

type Stand = { klicks: Record<string, number>; wechsel: number; bild: number; offenBilder: number; sichtbarAb: number;
  ueberBild: number; zuBilder: number; offen: boolean; an: string[]; hash: string; wo: string; schublade: boolean;
  anvisiert: string[]; expanded: string[]; titel: string; pille: number; gehalten: boolean; fremd: string[] };
const stand = (pc: Page): Promise<Stand> => pc.evaluate(() => {
  const z = (window as any).__z614;
  const pille = document.getElementById('ho-pille');
  return {
    klicks: { ...z.klicks }, fremd: [...z.fremd], wechsel: z.wechsel, bild: z.bild, offenBilder: z.offenBilder, sichtbarAb: z.sichtbarAb,
    ueberBild: z.ueberBild, zuBilder: z.zuBilder, offen: z.sichtbar(),
    an: [...document.querySelectorAll('#handy-oben [role="tab"]')].filter(b => b.getAttribute('aria-selected') === 'true').map(b => b.id),
    hash: location.hash, wo: String(App.schauplatz()), schublade: document.body.classList.contains('side-offen'),
    anvisiert: [...document.querySelectorAll('#handy-oben > [data-anvisiert]')].map(b => b.id),
    expanded: [...document.querySelectorAll('#handy-oben [role="tab"][aria-expanded="true"]')].map(b => b.id),
    titel: document.title,
    pille: pille ? Math.round(pille.getBoundingClientRect().left) : -1,
    gehalten: !!document.getElementById('handy-oben')?.hasAttribute('data-gehalten')
  };
});

/** Die Lage der Leiste und eines Reiters — einmal gemessen, die Leiste bewegt sich nicht. */
const reiterMitte = (pc: Page, id: string): Promise<Punkt & { links: number; breite: number }> => pc.evaluate((i: string) => {
  const r = document.getElementById(i)!.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, links: r.left, breite: r.width };
}, id);
const leisteOben = (pc: Page): Promise<number> => pc.evaluate(() => document.getElementById('handy-oben')!.getBoundingClientRect().top);

/** Was die Zielleiste zeigt — gelesen, nachdem ihre Bewegung vorbei ist. */
type Regal = { da: boolean; rolle: string | null; name: string | null; kasten: { l: number; o: number; r: number; u: number };
  ziele: Array<{ text: string; sym: string; svg: boolean; rolle: string | null; x: number; y: number; b: number; h: number;
    aktuell: boolean; fett: number; anvisiert: boolean; hub: number }> };
const regal = async (pc: Page, warten = true): Promise<Regal | null> => {
  if (warten) await pc.waitForFunction(() => {
    const s = document.getElementById('ho-ziele');
    return !s || s.getAnimations({ subtree: true }).every(a => a.playState !== 'running');
  }, null, { timeout: 3000 }).catch(() => null);
  return pc.evaluate(() => {
    const s = document.getElementById('ho-ziele');
    if (!s) return null;
    const r = s.getBoundingClientRect();
    return {
      da: !s.hidden && r.height > 0, rolle: s.getAttribute('role'), name: s.getAttribute('aria-label'),
      kasten: { l: r.left, o: r.top, r: r.right, u: r.bottom },
      ziele: [...s.querySelectorAll<HTMLElement>(':scope > button')].map(b => {
        const k = b.getBoundingClientRect();
        const z = b.querySelector<HTMLElement>('.ho-z');
        const m = z ? new DOMMatrixReadOnly(getComputedStyle(z).transform === 'none' ? '' : getComputedStyle(z).transform) : null;
        return { text: (b.textContent || '').trim(), sym: z?.dataset['sym'] || '', svg: !!z?.querySelector('svg'),
          rolle: b.getAttribute('role'), x: k.left + k.width / 2, y: k.top + k.height / 2, b: k.width, h: k.height,
          aktuell: b.getAttribute('aria-current') === 'page',
          fett: +getComputedStyle(b.querySelector('b') || b).fontWeight, anvisiert: b.hasAttribute('data-anvisiert'),
          hub: m ? m.a : 1 };
      })
    };
  });
};
const quelle = (pc: Page, key: string): Promise<Array<{ id: string; etikett: string; zeichen: string; ort: boolean }>> =>
  pc.evaluate((k: string) => {
    const nav = (globalThis as any).Register?.navigation;
    if (!nav || typeof nav.ziele !== 'function') return [];
    return nav.ziele(k).map((z: any) => ({ id: String(z.id), etikett: String(z.kurz ?? z.name), zeichen: String(z.zeichen), ort: z.ort === true }));
  }, key);

/** Reiter antippen — echt — und warten, bis der Bildschirm steht. */
const tippe = async (a: Auf, id: string, ms = 900) => {
  const m = await reiterMitte(a.pc, id);
  await finger(a.cdp, 'touchStart', m.x, m.y); await warte(60);
  await finger(a.cdp, 'touchEnd'); await warte(ms);
};
const allesZu = async (a: Auf) => {
  await a.pc.keyboard.press('Escape'); await warte(150);
  await a.pc.keyboard.press('Escape'); await warte(150);
  await a.pc.evaluate(() => document.querySelectorAll('.overlay,.menu,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung,#rg-neu')
    .forEach(el => el.remove()));
};

/** Vom Reiter hinauf, bis die Zielleiste offen sein sollte. Der Finger
 *  bleibt unten; zurück kommt die Stelle, an der er steht. */
const hinauf = async (a: Auf, id: string, bis = 0): Promise<Punkt> => {
  const m = await reiterMitte(a.pc, id);
  const oben = await leisteOben(a.pc);
  const ziel = { x: m.x, y: bis || oben - 30 };
  await finger(a.cdp, 'touchStart', m.x, m.y); await warte(40);
  await fuehren(a.cdp, m, { x: m.x, y: oben + 4 }, 3, 16);      /* noch in der Leiste */
  await fuehren(a.cdp, { x: m.x, y: oben + 4 }, ziel, 2, 16);   /* über die Kante */
  return ziel;
};

/* ═══ §0 Ruhe ═══════════════════════════════════════════════════════════════ */
console.log('\n§0 In Ruhe ist die Zielleiste nicht da');
const A = await aufmachen();
await beobachten(A.pc);
{
  const r = await A.pc.evaluate(() => {
    const s = document.getElementById('ho-ziele');
    const l = document.getElementById('handy-oben')!.getBoundingClientRect();
    const tabs = [...document.querySelectorAll<HTMLElement>('#handy-oben > button[role="tab"]')];
    return {
      da: !!s, hidden: s ? s.hidden : null, rolle: s?.getAttribute('role') ?? null,
      sichtbar: (window as any).__z614.sichtbar(),
      leiste: [Math.round(l.top), Math.round(l.bottom)],
      folge: tabs.map(t => t.id),
      popup: tabs.map(t => [t.getAttribute('aria-haspopup'), t.getAttribute('aria-controls'), t.getAttribute('aria-expanded')].join('/')),
      ausserhalb: s ? !document.getElementById('handy-oben')!.contains(s) : null
    };
  });
  p('§0a #ho-ziele steht im Baum, ist ein Menü und verborgen', r.da && r.hidden === true && r.rolle === 'menu', JSON.stringify(r));
  p('§0b in Ruhe ist sie in keinem Bild zu sehen', !r.sichtbar);
  p('§0c die Leiste liegt bei 775…835 mit fünf Reitern in ihrer Folge',
    r.leiste[0] === 775 && r.leiste[1] === 835 && JSON.stringify(r.folge) === JSON.stringify(REITER_LISTE), JSON.stringify(r));
  p('§0d jeder Reiter sagt, dass er ein Menü hat (aria-haspopup=menu, aria-controls=ho-ziele, aria-expanded=false)',
    r.popup.every(x => x === 'menu/ho-ziele/false'), JSON.stringify(r.popup));
  p('§0e die Zielleiste liegt NEBEN der Leiste, nicht darin (das Glas der Leiste fängt `position:fixed`)',
    r.ausserhalb === true, String(r.ausserhalb));
  const preview = await A.pc.evaluate(() => {
    const el = document.querySelector<HTMLElement>('#ho-ziele > .ho-ziel-vorschau');
    const nav = document.getElementById('ho-ziele');
    return { da: !!el, versteckt: !nav?.hasAttribute('data-vorschau-aktiv'),
      nurDekoration: el?.getAttribute('aria-hidden') === 'true',
      keinFingerziel: el ? getComputedStyle(el).pointerEvents === 'none' : false };
  });
  p('§0f die neue Vollnamen-Vorschau ist in Ruhe verborgen, dekorativ und kein zweiter Touchweg',
    preview.da && preview.versteckt && preview.nurDekoration && preview.keinFingerziel, JSON.stringify(preview));
  if (BILDER) {
    fs.mkdirSync(BILDER, { recursive: true });
    await A.pc.screenshot({ path: path.join(BILDER, '390-hell-untere-leiste.png') });
  }
}

/* ═══ §1 Ein Tipp bleibt ein Tipp ═════════════════════════════════════════ */
console.log('\n§1 Ein Tipp bleibt ein Tipp — und öffnet in keinem Bild etwas');
{
  /* Je Reiter: von einem anderen Reiter aus, damit der Tipp etwas wechselt. */
  for (const id of ['hl-start', 'hl-lernen', 'hl-bespr', 'hl-mehr', 'hl-dok']) {
    await beobachten(A.pc);
    await tippe(A, id);
    const s = await stand(A.pc);
    p(`§1a Tipp auf ${id}: genau ein Klick, der Reiter ist gewählt, in 0 Bildern eine Zielleiste`,
      JSON.stringify(s.klicks) === JSON.stringify({ [id]: 1 }) && s.an[0] === id && s.offenBilder === 0,
      JSON.stringify({ klicks: s.klicks, an: s.an, bilder: s.offenBilder }));
  }
  /* Der Daumen rollt beim Tippen hinauf — innerhalb der Leiste bleibt es ein Tipp. */
  for (const weg of [12, 24]) {
    await beobachten(A.pc);
    const m = await reiterMitte(A.pc, 'hl-lernen');
    await finger(A.cdp, 'touchStart', m.x, m.y); await warte(30);
    await fuehren(A.cdp, m, { x: m.x, y: m.y - weg }, 2, 16);
    await warte(30);
    await finger(A.cdp, 'touchEnd'); await warte(900);
    const s = await stand(A.pc);
    p(`§1b ${weg} px hinaufgerollt, unter der Oberkante: GENAU EIN Klick auf „Lernen", keine Zielleiste`,
      JSON.stringify(s.klicks) === '{"hl-lernen":1}' && s.an[0] === 'hl-lernen' && s.offenBilder === 0,
      JSON.stringify({ klicks: s.klicks, an: s.an, bilder: s.offenBilder }));
    await tippe(A, 'hl-dok');
  }
  /* §1c AM OBEREN RAND DES REITERS (Durchsicht E749, der Hauptfund). Der Reiter
     beginnt 6 px unter der Oberkante der Leiste. Ein Daumen, der dort aufsetzt
     und 10–15 px hinaufrollt, überquert die Kante — und hat getippt: Chromium
     klickt bis 15 px Weg selbst, ab 16 nicht (gemessen, messungen §106). Gegen
     f4ebb5816 ging hier die Zielleiste auf, und das Loslassen im Zielbereich
     wählte „Lernpfad"; bei 13–15 px fiel Chromiums eigener Klick obendrein auf
     den Inhalt ÜBER der Leiste (`fremd`). Gemessen vom Bildschirm „Dokumente"
     aus, wo über der Leiste eine Zeile zum Aufklappen steht. */
  const lernMitte = await reiterMitte(A.pc, 'hl-lernen');
  const reiterOben = await A.pc.evaluate(() => document.getElementById('hl-lernen')!.getBoundingClientRect().top);
  for (const unter of [1, 4, 7]) {
    const falsch: string[] = [];
    for (const weg of [10, 12, 14, 15]) {
      await tippe(A, 'hl-dok');
      await beobachten(A.pc);
      const y0 = reiterOben + unter;
      await finger(A.cdp, 'touchStart', lernMitte.x, y0); await warte(40);
      await finger(A.cdp, 'touchMove', lernMitte.x, y0 - weg / 2); await warte(16);
      await finger(A.cdp, 'touchMove', lernMitte.x, y0 - weg); await warte(30);
      await finger(A.cdp, 'touchEnd'); await warte(900);
      const s = await stand(A.pc);
      if (!(JSON.stringify(s.klicks) === '{"hl-lernen":1}' && s.offenBilder === 0 && s.fremd.length === 0
            && s.hash === '#welt-lernen-lernen'))
        falsch.push(`${weg} px: ` + JSON.stringify({ klicks: s.klicks, bilder: s.offenBilder, fremd: s.fremd, hash: s.hash }));
    }
    p(`§1c ${unter} px unter dem Rand des Reiters, 10/12/14/15 px hinauf: je GENAU EIN Klick auf „Lernen", keine Zielleiste, nichts daneben`,
      falsch.length === 0, falsch.join(' · '));
  }
  /* §1d HINAUF, DANN SEITWÄRTS (Durchsicht E749). Auf dem Grundstand geschah
     nichts: die Achse warf den Zug ab, und über 15 px klickt Chromium nicht.
     Gegen f4ebb5816 klickte `ziehbar` beim Loslassen den GEDRÜCKTEN Reiter —
     „Lernen", während der Finger auf „Termine" lag. */
  {
    await tippe(A, 'hl-dok');
    await beobachten(A.pc);
    const te = await reiterMitte(A.pc, 'hl-bespr');
    await finger(A.cdp, 'touchStart', lernMitte.x, lernMitte.y); await warte(40);
    await finger(A.cdp, 'touchMove', lernMitte.x, lernMitte.y - 6); await warte(16);
    await finger(A.cdp, 'touchMove', lernMitte.x, lernMitte.y - 14); await warte(16);
    await fuehren(A.cdp, { x: lernMitte.x, y: lernMitte.y - 14 }, { x: te.x, y: lernMitte.y - 14 }, 6, 16);
    await finger(A.cdp, 'touchEnd'); await warte(900);
    const d = await stand(A.pc);
    p('§1d 14 px hinauf, dann seitwärts auf „Termine": kein Klick, „Dokumente" bleibt — wie auf dem Grundstand',
      Object.keys(d.klicks).length === 0 && d.an[0] === 'hl-dok' && d.offenBilder === 0 && d.wechsel === 0 && d.fremd.length === 0,
      JSON.stringify({ klicks: d.klicks, an: d.an, bilder: d.offenBilder, fremd: d.fremd }));
  }
}

/* ═══ §2 Halten öffnet nichts ════════════════════════════════════════════ */
console.log('\n§2 Halten öffnet nichts (Redur, 13. Oktober, 01:08 UTC)');
{
  await beobachten(A.pc);
  const m = await reiterMitte(A.pc, 'hl-lernen');
  await finger(A.cdp, 'touchStart', m.x, m.y);
  await warte(800);
  const mitten = await stand(A.pc);
  await finger(A.cdp, 'touchEnd'); await warte(900);
  const s = await stand(A.pc);
  p('§2a 800 ms ruhig gehalten: in keinem Bild eine Zielleiste, kein aria-expanded',
    mitten.offenBilder === 0 && !mitten.offen && mitten.expanded.length === 0 && s.offenBilder === 0,
    JSON.stringify({ bilder: s.offenBilder, expanded: mitten.expanded }));
  /* Der Grundstand (gemessen, Sonde vor dem Bau): 800 ms halten und
     loslassen ist ein Klick — der Reiter wechselt. */
  p('§2b das Loslassen tut, was es auf dem Grundstand tut: ein Klick, „Lernen" gewählt',
    JSON.stringify(s.klicks) === '{"hl-lernen":1}' && s.an[0] === 'hl-lernen', JSON.stringify({ klicks: s.klicks, an: s.an }));
  await tippe(A, 'hl-dok');
}

/* ═══ §3 Hinaufziehen ═══════════════════════════════════════════════════ */
console.log('\n§3 Hinaufziehen öffnet sofort');
const GEOMETRIE: Record<string, Punkt[]> = {};
{
  await beobachten(A.pc);
  await hinauf(A, 'hl-lernen');
  await warte(120);
  const s = await stand(A.pc);
  const r = await regal(A.pc);
  const q = await quelle(A.pc, 'lernen');
  const oben = await leisteOben(A.pc);
  p('§3a offen in höchstens zwei Bildern, nachdem der Finger die Oberkante überquert hat',
    s.ueberBild >= 0 && s.sichtbarAb >= 0 && s.sichtbarAb - s.ueberBild <= 2,
    `über die Kante in Bild ${s.ueberBild}, sichtbar ab Bild ${s.sichtbarAb}`);
  p('§3b ein Menü mit dem Namen „Ziele in Lernen"', !!r?.da && r.rolle === 'menu' && r.name === 'Ziele in Lernen',
    JSON.stringify({ rolle: r?.rolle, name: r?.name }));
  p('§3c fünf Ziele, Wort für Wort die von „Lernen" aus der Quelle',
    !!r && r.ziele.length === 5 && JSON.stringify(r.ziele.map(z => z.text)) === JSON.stringify(q.map(z => z.etikett))
      && JSON.stringify(q.map(z => z.etikett)) === JSON.stringify(REDUR['lernen']),
    JSON.stringify(r?.ziele.map(z => z.text)));
  p('§3d „Lernen" ist aufgeklappt (aria-expanded), kein anderer', JSON.stringify(s.expanded) === '["hl-lernen"]', JSON.stringify(s.expanded));
  p('§3e sie liegt direkt über der Leiste: 8 px Luft, 10 px vom Rand, so hoch wie die Leiste',
    !!r && Math.abs(r.kasten.u - (oben - 8)) <= 1 && Math.abs(r.kasten.l - 10) <= 1 && Math.abs(r.kasten.r - 380) <= 1
      && Math.abs((r.kasten.u - r.kasten.o) - 60) <= 1, JSON.stringify(r?.kasten));
  p('§3f nichts gewählt, solange der Finger unten ist', Object.keys(s.klicks).length === 0 && s.wechsel === 0, JSON.stringify(s));
  if (r) GEOMETRIE['lernen'] = r.ziele.map(z => ({ x: z.x, y: z.y }));
  /* Zu hoch losgelassen: nichts (§7 prüft es genauer). */
  await fuehren(A.cdp, { x: 195, y: oben - 30 }, { x: 195, y: 560 }, 3, 16);
  await finger(A.cdp, 'touchEnd'); await warte(700);
}

/* ═══ §4 Gleiten und Loslassen, während die Scheibe wächst ═══════════════════ */
console.log('\n§4 Gleiten und Loslassen wählt genau einmal — auch während die Scheibe wächst');
{
  await tippe(A, 'hl-lernen', 1200);
  /* Die Lage der Ziele ist die der Ruhe (§3 hat sie für „Lernen" gemessen;
     für „Dokumente" einmal vorher, mit Abbruch). */
  await hinauf(A, 'hl-dok'); await warte(900);
  const vorher = await regal(A.pc);
  if (vorher) GEOMETRIE['dokumente'] = vorher.ziele.map(z => ({ x: z.x, y: z.y }));
  await fuehren(A.cdp, { x: 50, y: 740 }, { x: 50, y: 560 }, 3, 16);
  await finger(A.cdp, 'touchEnd'); await warte(800);
  const fav = GEOMETRIE['dokumente']?.[2];
  await beobachten(A.pc);
  const m = await reiterMitte(A.pc, 'hl-dok');
  const oben = await leisteOben(A.pc);
  await finger(A.cdp, 'touchStart', m.x, m.y); await warte(30);
  await finger(A.cdp, 'touchMove', m.x, m.y - 14); await warte(16);
  await finger(A.cdp, 'touchMove', m.x, oben - 10); await warte(16);
  if (fav) { await finger(A.cdp, 'touchMove', (m.x + fav.x) / 2, fav.y); await warte(16); await finger(A.cdp, 'touchMove', fav.x, fav.y); }
  await warte(16);
  const waechst = await A.pc.evaluate(() => (document.getElementById('ho-ziele')?.getAnimations() ?? []).filter(a => a.playState === 'running').length);
  /* Für den Bildlauf erst nach dem Testfenster eine kurze visuelle Pause.
     Der normale §4-Test misst weiterhin die laufende Feder vor Loslassen. */
  if (BILDER) {
    await warte(280);
    await A.pc.screenshot({ path: path.join(BILDER, '390-hell-zielvorschau.png') });
  }
  const vorschau = await A.pc.evaluate(() => {
    const s = document.getElementById('ho-ziele');
    const v = s?.querySelector<HTMLElement>('.ho-ziel-vorschau');
    const active = s?.querySelector<HTMLElement>(':scope > button[data-anvisiert]');
    const key = active?.dataset.ziel || '';
    const full = (window as any).Register?.navigation?.ziele?.('dokumente')
      ?.find((z: any) => z.id === key)?.name || '';
    const vr = v?.getBoundingClientRect(), sr = s?.getBoundingClientRect();
    return {
      sichtbar: s?.hasAttribute('data-vorschau-aktiv') &&
        v ? getComputedStyle(v).visibility === 'visible' : false,
      name: v?.querySelector('.ho-ziel-vorschau-name')?.textContent || '',
      bereich: v?.querySelector('.ho-ziel-vorschau-bereich')?.textContent || '',
      quelle: full, above: !!vr && !!sr && vr.bottom <= sr.top,
      original: active?.getAttribute('aria-label') || '',
      keinZiel: v ? getComputedStyle(v).pointerEvents === 'none' : false,
      /* DIE GEOMETRIE, NICHT DAS BILD DER FEDER (E761). Hier stand nur
         `getBoundingClientRect().height` — und die Scheibe WÄCHST in
         diesem Augenblick noch (§4a verlangt genau das): `growFrom` legt
         ein `transform: scale(…)` darüber, der gemalte Kasten mass 53,17
         und 53,99 px, je nachdem, wie weit die Feder war. Grün war die
         Zusage nur mit `--capture`, das vorher 280 ms wartet. „Unverändert"
         meint, was die Treffer trägt: die Treffer kommen aus dem Layout
         (tab-shelf.ts, `offsetLeft`/`offsetWidth`), also misst sie das
         Layout — 60 px hoch, fünf gleich breite Ziele. Das gemalte Mass
         steht daneben, als Auskunft. */
      hoehe: sr?.height ?? 0,
      hoeheLayout: s?.offsetHeight ?? 0,
      breiten: [...(s?.querySelectorAll<HTMLElement>(':scope > button') ?? [])].map(b => b.offsetWidth)
    };
  });
  await finger(A.cdp, 'touchEnd'); await warte(1300);
  const s = await stand(A.pc);
  const an = await A.pc.evaluate(() => {
    const z = ((globalThis as any).Register?.navigation?.ziele?.('dokumente') || []).find((x: any) => x.id === 'favoriten');
    return z ? !!z.an() : null;
  });
  p('§4a beim Loslassen wuchs die Scheibe noch (die Prüfung fällt in die Bewegung)', waechst > 0, String(waechst));
  p('§4b gewählt ist „Favoriten" — das Regal steht darauf, „Dokumente" leuchtet',
    an === true && s.an[0] === 'hl-dok', JSON.stringify({ an, reiter: s.an, wo: s.wo }));
  p('§4c GENAU EINE Ankunft über den Reiterweg, kein Klick auf die Leiste',
    s.wechsel === 1 && Object.keys(s.klicks).length === 0, JSON.stringify({ wechsel: s.wechsel, klicks: s.klicks }));
  p('§4d die Schublade bleibt zu, die Zielleiste ist weg, nichts mehr aufgeklappt',
    !s.schublade && !s.offen && s.expanded.length === 0 && s.anvisiert.length === 0, JSON.stringify(s));
  p('§4e beim Ziehen steht der VOLLE Name über der unveränderten 60px-Zielleiste',
    vorschau.sichtbar && vorschau.name === vorschau.quelle && !!vorschau.name &&
      vorschau.bereich === 'Dokumente' && vorschau.above && vorschau.hoeheLayout === 60 &&
      vorschau.breiten.length === 5 && new Set(vorschau.breiten).size === 1 &&
      vorschau.original === vorschau.quelle && vorschau.keinZiel, JSON.stringify(vorschau));
  const reset = await A.pc.evaluate(() =>
    !document.getElementById('ho-ziele')?.hasAttribute('data-vorschau-aktiv'));
  p('§4f beim Loslassen verschwindet die Vorschau ohne offene Zusatzleiste', reset);
}

/* ═══ §5 Zwischen Reitern ═════════════════════════════════════════════════ */
console.log('\n§5 Zwischen den Reitern tauscht nur der Inhalt');
{
  await tippe(A, 'hl-dok', 1000);
  await beobachten(A.pc);
  await A.pc.evaluate(() => { (window as any).__z614.scheibe = document.getElementById('ho-ziele'); });
  const p0 = await hinauf(A, 'hl-dok');
  await warte(250);
  const dok = await regal(A.pc, false);
  const unten = await reiterMitte(A.pc, 'hl-dok');
  const lernen = await reiterMitte(A.pc, 'hl-lernen');
  await fuehren(A.cdp, p0, { x: unten.x, y: unten.y }, 3, 16);
  await fuehren(A.cdp, { x: unten.x, y: unten.y }, { x: lernen.x, y: lernen.y }, 6, 20);
  await warte(250);
  const r = await regal(A.pc, false);
  const s = await stand(A.pc);
  const q = await quelle(A.pc, 'lernen');
  const gleich = await A.pc.evaluate(() => (window as any).__z614.scheibe === document.getElementById('ho-ziele'));
  p('§5a erst die Ziele von „Dokumente"', JSON.stringify(dok?.ziele.map(z => z.text)) === JSON.stringify(REDUR['dokumente']),
    JSON.stringify(dok?.ziele.map(z => z.text)));
  p('§5b auf „Lernen" geglitten: die Ziele von „Lernen", der Name sagt es, „Lernen" ist angepeilt und aufgeklappt',
    JSON.stringify(r?.ziele.map(z => z.text)) === JSON.stringify(q.map(z => z.etikett)) && r?.name === 'Ziele in Lernen'
      && JSON.stringify(s.anvisiert) === '["hl-lernen"]' && JSON.stringify(s.expanded) === '["hl-lernen"]',
    JSON.stringify({ ziele: r?.ziele.map(z => z.text), name: r?.name, anvisiert: s.anvisiert, expanded: s.expanded }));
  p('§5c dieselbe Scheibe, und in keinem Bild war sie weg', gleich && s.zuBilder === 0 && s.offen,
    JSON.stringify({ gleich, zuBilder: s.zuBilder }));
  p('§5d unterwegs wurde nichts gewählt', s.wechsel === 0 && Object.keys(s.klicks).length === 0, JSON.stringify(s.klicks));
  /* Hinauf zu „Trainer" und loslassen. */
  const ziel = (r?.ziele ?? []).find(z => z.text === 'Trainer');
  if (ziel) {
    await fuehren(A.cdp, { x: lernen.x, y: lernen.y }, { x: lernen.x, y: ziel.y + 20 }, 2, 16);
    await fuehren(A.cdp, { x: lernen.x, y: ziel.y + 20 }, { x: ziel.x, y: ziel.y }, 3, 16);
  }
  await warte(60);
  await finger(A.cdp, 'touchEnd'); await warte(1400);
  const t = await stand(A.pc);
  p('§5e „Trainer" gewählt: #welt-lernen-trainer, „Lernen" leuchtet, genau eine Ankunft, kein Klick',
    t.hash === '#welt-lernen-trainer' && t.an[0] === 'hl-lernen' && t.wechsel === 1 && Object.keys(t.klicks).length === 0,
    JSON.stringify({ hash: t.hash, an: t.an, wechsel: t.wechsel, klicks: t.klicks }));

  /* Zweiter Weg: erst seitwärts (die Pille ist gegriffen), dann hinauf. */
  await tippe(A, 'hl-start', 1200);
  await beobachten(A.pc);
  const st = await reiterMitte(A.pc, 'hl-start');
  const be = await reiterMitte(A.pc, 'hl-bespr');
  const oben = await leisteOben(A.pc);
  await finger(A.cdp, 'touchStart', st.x, st.y); await warte(40);
  await fuehren(A.cdp, st, be, 10, 24);
  await warte(160);
  const gehalten = await A.pc.evaluate(() => document.getElementById('handy-oben')!.hasAttribute('data-gehalten'));
  await fuehren(A.cdp, be, { x: be.x, y: oben - 30 }, 4, 16);
  await warte(250);
  const z2 = await regal(A.pc, false);
  const s2 = await stand(A.pc);
  p('§5f aus dem Pillenzug hinauf: die Pille war gegriffen, dann die Ziele von „Termine"',
    gehalten && JSON.stringify(z2?.ziele.map(z => z.text)) === JSON.stringify(REDUR['termine']) && z2?.name === 'Ziele in Termine',
    JSON.stringify({ gehalten, ziele: z2?.ziele.map(z => z.text), name: z2?.name }));
  await fuehren(A.cdp, { x: be.x, y: oben - 30 }, { x: be.x, y: 560 }, 3, 16);
  await finger(A.cdp, 'touchEnd'); await warte(900);
  const s3 = await stand(A.pc);
  p('§5g zu hoch losgelassen: nichts gewählt, „Heute" bleibt, und die Pille ist nicht mehr gehalten',
    s3.an[0] === 'hl-start' && s3.wechsel === 0 && Object.keys(s3.klicks).length === 0 && !s3.offen && !s3.gehalten,
    JSON.stringify({ an: s3.an, wechsel: s3.wechsel, klicks: s3.klicks, gehalten: s3.gehalten }));
  void s2;
}

/* ═══ §6 Losgelassen auf einem anderen Reiter ═══════════════════════════════ */
console.log('\n§6 Losgelassen auf einem anderen Reiter: genau ein Klick');
{
  await tippe(A, 'hl-dok', 1000);
  await beobachten(A.pc);
  const p0 = await hinauf(A, 'hl-dok');
  await warte(200);
  const be = await reiterMitte(A.pc, 'hl-bespr');
  await fuehren(A.cdp, p0, be, 6, 20);
  await warte(80);
  await finger(A.cdp, 'touchEnd'); await warte(1200);
  const s = await stand(A.pc);
  p('§6a GENAU EIN Klick auf „Termine", Termine gewählt, die Zielleiste ist weg',
    JSON.stringify(s.klicks) === '{"hl-bespr":1}' && s.an[0] === 'hl-bespr' && !s.offen && s.wechsel === 1,
    JSON.stringify({ klicks: s.klicks, an: s.an, offen: s.offen, wechsel: s.wechsel }));
  /* §6b UNTER DER LEISTE LOSGELASSEN (Durchsicht E749). Zwischen der Unterkante
     der Leiste und dem Rand liegt der Home-Strich, kein Reiter. Gegen
     f4ebb5816 zählte ein Loslassen dort als „auf dem nächsten Reiter" und
     klickte „Lernen". Der Entwurf sagt: anderswo losgelassen ist abgebrochen. */
  await tippe(A, 'hl-dok', 1000);
  await beobachten(A.pc);
  const p1 = await hinauf(A, 'hl-lernen');
  await warte(200);
  const unten = await A.pc.evaluate(() => document.getElementById('handy-oben')!.getBoundingClientRect().bottom);
  const le = await reiterMitte(A.pc, 'hl-lernen');
  await fuehren(A.cdp, p1, { x: le.x, y: unten + 4 }, 4, 16);
  await warte(60);
  const dort = await stand(A.pc);
  await finger(A.cdp, 'touchEnd'); await warte(1000);
  const u = await stand(A.pc);
  p('§6b unter der Leiste losgelassen (Home-Strich): kein Klick, nichts gewählt, „Dokumente" bleibt, die Zielleiste zu',
    Object.keys(u.klicks).length === 0 && u.wechsel === 0 && u.an[0] === 'hl-dok' && !u.offen && u.expanded.length === 0,
    JSON.stringify({ klicks: u.klicks, wechsel: u.wechsel, an: u.an, offen: u.offen }));
  p('§6c … und solange der Finger dort liegt, leuchtet kein Reiter vor', dort.offen && dort.anvisiert.length === 0,
    JSON.stringify({ offen: dort.offen, anvisiert: dort.anvisiert, y: unten + 4 }));
}

/* ═══ §7 Abbrechen ═══════════════════════════════════════════════════════ */
console.log('\n§7 Abbrechen: nichts geschieht');
{
  await tippe(A, 'hl-dok', 1000);
  const vorher = await stand(A.pc);
  /* a) zu hoch losgelassen */
  await beobachten(A.pc);
  const p0 = await hinauf(A, 'hl-lernen');
  await warte(250);
  const r = await regal(A.pc, false);
  const hoch = (r?.kasten.o ?? 707) - 40;
  await fuehren(A.cdp, p0, { x: p0.x, y: hoch }, 3, 16);
  const mitten = await stand(A.pc);
  await finger(A.cdp, 'touchEnd'); await warte(1000);
  const a = await stand(A.pc);
  p('§7a über dem Ziel-Bereich: keine Marke, die Pille zurück unter dem gewählten Reiter',
    mitten.offen && mitten.anvisiert.length === 0, JSON.stringify({ offen: mitten.offen, anvisiert: mitten.anvisiert }));
  p('§7b zu hoch losgelassen: Adresse, Titel und Reiter wie vorher, keine Ankunft, kein Klick, Zielleiste zu',
    a.hash === vorher.hash && a.titel === vorher.titel && a.an[0] === 'hl-dok' && a.wechsel === 0
      && Object.keys(a.klicks).length === 0 && !a.offen && a.expanded.length === 0,
    JSON.stringify({ hash: [vorher.hash, a.hash], an: a.an, wechsel: a.wechsel, klicks: a.klicks, offen: a.offen }));
  p('§7c die Pille steht wieder unter „Dokumente"', Math.abs(a.pille - vorher.pille) <= 1, `${vorher.pille} → ${a.pille}`);
  /* b) Escape mit dem Finger unten */
  await beobachten(A.pc);
  const p1 = await hinauf(A, 'hl-lernen');
  await warte(200);
  const ziel = (await regal(A.pc, false))?.ziele[1];
  if (ziel) await fuehren(A.cdp, p1, ziel, 3, 16);
  await warte(60);
  await A.pc.keyboard.press('Escape');
  await warte(250);                         /* sie blendet in --motion-fast aus */
  const nachEsc = await stand(A.pc);
  await finger(A.cdp, 'touchEnd'); await warte(1000);
  const b = await stand(A.pc);
  p('§7d Escape mit dem Finger auf einem Ziel: die Zielleiste geht zu, das Loslassen wählt nichts',
    !nachEsc.offen && b.wechsel === 0 && Object.keys(b.klicks).length === 0 && b.an[0] === 'hl-dok' && b.hash === vorher.hash,
    JSON.stringify({ offen: nachEsc.offen, wechsel: b.wechsel, klicks: b.klicks, an: b.an, hash: b.hash }));
  /* c) touchCancel */
  await beobachten(A.pc);
  const p2 = await hinauf(A, 'hl-mehr');
  await warte(200);
  const ziel2 = (await regal(A.pc, false))?.ziele[4];
  if (ziel2) await fuehren(A.cdp, p2, ziel2, 3, 16);
  await finger(A.cdp, 'touchCancel'); await warte(1000);
  const c = await stand(A.pc);
  const offenNoch = await A.pc.evaluate(() => document.querySelectorAll('.overlay').length);
  p('§7e touchCancel: zu, nichts gewählt, kein Dialog', !c.offen && c.wechsel === 0 && Object.keys(c.klicks).length === 0
    && c.an[0] === 'hl-dok' && offenNoch === 0, JSON.stringify({ offen: c.offen, wechsel: c.wechsel, klicks: c.klicks, dialoge: offenNoch }));
  /* §7f DER NÄCHSTE TIPP KOMMT AN (Durchsicht E749). Nach einer Geste schluckt
     `ziehbar` den Klick des Browsers — aber nur DEN. Folgt keiner (abgebrochen,
     zu hoch losgelassen, mehr als 15 px Weg), darf der nächste echte Tipp nicht
     an seiner Stelle verschwinden. Gegen f4ebb5816 blieb ein Tipp auf „Termine"
     120–200 ms danach ohne Wirkung; nach einem Pillenzug war es schon auf dem
     Grundstand so. */
  for (const [art, ms] of [['touchCancel', 200], ['zu hoch losgelassen', 120], ['nach einem Pillenzug', 150]] as const) {
    await tippe(A, 'hl-dok', 1000);
    await beobachten(A.pc);
    const le = await reiterMitte(A.pc, 'hl-lernen');
    const te = await reiterMitte(A.pc, 'hl-bespr');
    if (art === 'nach einem Pillenzug') {
      const d = await reiterMitte(A.pc, 'hl-dok');
      const st = await reiterMitte(A.pc, 'hl-start');
      await finger(A.cdp, 'touchStart', d.x, d.y); await warte(40);
      await fuehren(A.cdp, d, st, 8, 20); await warte(60);
      await finger(A.cdp, 'touchEnd');
    } else {
      await finger(A.cdp, 'touchStart', le.x, le.y); await warte(40);
      await fuehren(A.cdp, le, { x: le.x, y: le.y - 70 }, 5, 16);
      if (art === 'touchCancel') await finger(A.cdp, 'touchCancel');
      else { await finger(A.cdp, 'touchMove', le.x, le.y - 400); await warte(16); await finger(A.cdp, 'touchEnd'); }
    }
    await warte(ms);
    await finger(A.cdp, 'touchStart', te.x, te.y); await warte(50);
    await finger(A.cdp, 'touchEnd'); await warte(1000);
    const f = await stand(A.pc);
    p(`§7f ${art}, ${ms} ms später ein echter Tipp auf „Termine": er kommt an — ein Klick, Termine gewählt`,
      (f.klicks['hl-bespr'] ?? 0) === 1 && f.an[0] === 'hl-bespr', JSON.stringify({ klicks: f.klicks, an: f.an }));
  }
}

/* ═══ §8 Hinab ═══════════════════════════════════════════════════════════ */
console.log('\n§8 Hinab öffnet nichts');
{
  /* Auf dem Grundstand gemessen: 12 px hinab ist ein Klick (unter Chromiums
     15 px), 24 px hinab nichts. So bleibt es. */
  for (const [weg, klick] of [[24, 0], [12, 1]] as const) {
    await tippe(A, 'hl-dok', 900);
    await beobachten(A.pc);
    const m = await reiterMitte(A.pc, 'hl-start');
    await finger(A.cdp, 'touchStart', m.x, m.y); await warte(30);
    await fuehren(A.cdp, m, { x: m.x, y: m.y + weg }, 2, 16);
    await finger(A.cdp, 'touchEnd'); await warte(900);
    const s = await stand(A.pc);
    p(`§8 ${weg} px hinab: in keinem Bild eine Zielleiste, ${klick} Klick wie auf dem Grundstand`,
      s.offenBilder === 0 && (s.klicks['hl-start'] ?? 0) === klick && Object.keys(s.klicks).length === klick,
      JSON.stringify({ bilder: s.offenBilder, klicks: s.klicks }));
  }
}

/* ═══ §9 Jedes Ziel über die Geste ════════════════════════════════════════ */
console.log('\n§9 Jedes Ziel über die Geste — jeder Ort schaltet SEINEN Reiter an');
const KOPF: Record<string, RegExp> = {
  Tagesplan: /Tagesplan/, Besprechung: /Besprechungsnotizen/, Verbinden: /Kalender verbinden/,
  Wolke: /Wolke/, Papierkorb: /Papierkorb/, Einstellungen: /^Einstellungen$/
};
const dialogKoepfe = (pc: Page) => pc.evaluate(() => [...document.querySelectorAll('.overlay')]
  .map(o => (o.querySelector('.fh, h2')?.textContent || '').replace(/\s+/g, ' ').trim() ||
    (o.querySelector<HTMLInputElement>('input[placeholder]')?.placeholder || '').trim()));
{
  let orte = 0, handlungen = 0;
  for (const key of SCHLUESSEL) {
    const q = await quelle(A.pc, key);
    for (let i = 0; i < q.length; i++) {
      const z = q[i]!;
      await allesZu(A);
      /* Von einem ANDEREN Reiter aus — sonst wechselte der Ort nichts. */
      const start = key === 'dokumente' ? 'hl-start' : 'hl-dok';
      await tippe(A, start, 1100);
      await allesZu(A);
      const vorher = await stand(A.pc);
      const koepfeVorher = await dialogKoepfe(A.pc);
      A.downloads.length = 0;
      await beobachten(A.pc);
      const p0 = await hinauf(A, REITER[key]!);
      await warte(80);
      const ort = await A.pc.evaluate((k: number) => {
        const s = document.getElementById('ho-ziele');
        const b = s?.querySelectorAll<HTMLElement>(':scope > button')[k];
        if (!s || !b) return null;
        /* Aus dem Layout, nicht aus dem gemalten Kasten: die Scheibe wächst noch. */
        return { x: s.offsetLeft + s.clientLeft + b.offsetLeft + b.offsetWidth / 2,
                 y: s.offsetTop + s.clientTop + b.offsetTop + b.offsetHeight / 2 };
      }, i);
      if (ort) await fuehren(A.cdp, p0, ort, 3, 16);
      await warte(60);
      await finger(A.cdp, 'touchEnd'); await warte(1400);
      const s = await stand(A.pc);
      if (z.ort) {
        const an = await A.pc.evaluate(([k, id]) => {
          const x = ((globalThis as any).Register.navigation.ziele(k) || []).find((y: any) => y.id === id);
          try { return x && typeof x.an === 'function' ? !!x.an() : null; } catch { return null; }
        }, [key, z.id] as const);
        p(`§9 ${key} › ${z.etikett}: „${REITER[key]}" leuchtet, man steht dort, eine Ankunft`,
          s.an.length === 1 && s.an[0] === REITER[key] && an === true && s.wechsel === 1 && !s.offen,
          JSON.stringify({ an: s.an, steht: an, wechsel: s.wechsel, wo: s.wo, hash: s.hash }));
        orte++;
      } else {
        const koepfe = await dialogKoepfe(A.pc);
        const kopf = KOPF[z.etikett];
        const wie = z.etikett === 'Posteingang' ? (s.wo === 'posteingang' ? 'Posteingang offen' : '')
          : z.etikett === 'Sicherung' ? (A.downloads.some(d => /^redion-sicherung-/.test(d)) ? 'Sicherung gespeichert' : '')
          : (kopf && !koepfeVorher.some(k => kopf.test(k)) ? (koepfe.find(k => kopf.test(k)) ?? '') : '');
        const reiterBleibt = z.etikett === 'Posteingang' ? s.an.length === 0
          : JSON.stringify(s.an) === JSON.stringify(vorher.an) && Math.abs(s.pille - vorher.pille) <= 1;
        p(`§9 ${key} › ${z.etikett}: ${wie || 'NICHTS'} — der Reiter und die Pille bleiben`,
          !!wie && reiterBleibt && !s.offen && Object.keys(s.klicks).length === 0,
          JSON.stringify({ an: [vorher.an, s.an], pille: [vorher.pille, s.pille], wo: s.wo, koepfe, klicks: s.klicks }));
        handlungen++;
      }
    }
  }
  p('§9z alle 17 Orte und alle 8 Handlungen über die Geste geprüft', orte === 17 && handlungen === 8, `${orte} / ${handlungen}`);
  await allesZu(A);
}

/* ═══ §10 Eine Quelle ═══════════════════════════════════════════════════ */
console.log('\n§10 Eine Quelle: was die Zielleiste zeigt, ist Register.navigation.ziele');
{
  await tippe(A, 'hl-dok', 1100);
  for (const key of SCHLUESSEL) {
    const p0 = await hinauf(A, REITER[key]!);
    await warte(900);
    const r = await regal(A.pc);
    const q = await quelle(A.pc, key);
    p(`§10 ${key}: Namen, Folge und Zeichen aus der Quelle, jedes Zeichen gemalt`,
      !!r && r.ziele.length === q.length && q.length === 5
        && r.ziele.every((z, i) => z.text === q[i]!.etikett && z.sym === q[i]!.zeichen && z.svg),
      JSON.stringify(r?.ziele.map(z => [z.text, z.sym, z.svg])));
    if (key === 'dokumente') {
      /* Wo man steht, sagt die Quelle (`an()`); das Regal merkt sich seinen
         Ort, also steht hier, was §9 zuletzt gewählt hat. */
      const an = await A.pc.evaluate(() => (Register.navigation.ziele('dokumente') || [])
        .map((z: any) => { try { return typeof z.an === 'function' && !!z.an(); } catch { return false; } }));
      p('§10b wo man steht, sagt aria-current UND fette Schrift — genau dort, wo `an()` ja sagt',
        !!r && an.filter(Boolean).length === 1 && r.ziele.every((z, i) => z.aktuell === an[i] && (an[i] ? z.fett >= 600 : z.fett < 600)),
        JSON.stringify({ an, ziele: r?.ziele.map(z => [z.text, z.aktuell, z.fett]) }));
    }
    await fuehren(A.cdp, p0, { x: p0.x, y: 560 }, 3, 16);
    await finger(A.cdp, 'touchEnd'); await warte(700);
  }
  /* Ein Name ist Text, kein Markup (§19). Ein Lieferant über den öffentlichen
     Weg (`meldeZiele`), nur solange der Lauf ihn einschaltet. */
  const GIFT = 'Gift <img src=x onerror="window.__gift614=1"><b>fett</b>';
  await A.pc.evaluate((name: string) => {
    const w = window as any;
    w.__giftAn = true;
    Register.navigation.meldeZiele('dokumente', () => w.__giftAn
      ? [{ id: 't614-gift', name, zeichen: 'star', rang: 0, tun: () => { w.__giftTun = (w.__giftTun || 0) + 1; } }] : []);
  }, GIFT);
  const p0 = await hinauf(A, 'hl-dok');
  await warte(900);
  const g = await A.pc.evaluate(() => {
    const s = document.getElementById('ho-ziele');
    const b = s?.querySelector<HTMLElement>(':scope > button');
    return { text: b?.querySelector('b')?.textContent ?? null, bilder: s ? s.querySelectorAll('img').length : -1,
             fett: b ? b.querySelectorAll('b').length : -1, lief: (window as any).__gift614 ?? null };
  });
  await fuehren(A.cdp, p0, { x: p0.x, y: 560 }, 3, 16);
  await finger(A.cdp, 'touchEnd'); await warte(600);
  await A.pc.evaluate(() => { (window as any).__giftAn = false; });
  p('§10c ein Name mit Markup steht als TEXT da: kein <img>, kein zweites <b>, nichts ausgeführt (§19)',
    g.text === GIFT && g.bilder === 0 && g.fett === 1 && g.lief === null, JSON.stringify(g));
}

/* ═══ §11 §37 und §38 ════════════════════════════════════════════════════ */
console.log('\n§11 44 px, Text, nicht nur Farbe, lesbar');
{
  await tippe(A, 'hl-dok', 1000);
  const p0 = await hinauf(A, 'hl-lernen');
  await warte(900);
  const r = await regal(A.pc);
  p('§11a jedes Ziel ist gerendert mindestens 44 × 44 px, hat Text und ist ein menuitem',
    !!r && r.ziele.length === 5 && r.ziele.every(z => z.b >= 44 && z.h >= 44 && z.text.length > 0 && z.rolle === 'menuitem'),
    JSON.stringify(r?.ziele.map(z => [Math.round(z.b), Math.round(z.h), z.rolle])));
  const mitte = r?.ziele[2];
  if (mitte) await fuehren(A.cdp, p0, mitte, 3, 16);
  await warte(700);
  const r2 = await regal(A.pc);
  const marke = await A.pc.evaluate(() => {
    const m = document.querySelector<HTMLElement>('#ho-ziele > .ru-marke');
    const z = document.querySelector<HTMLElement>('#ho-ziele > button[data-anvisiert]');
    if (!m || !z) return null;
    const a = m.getBoundingClientRect(), b = z.getBoundingClientRect();
    return { sichtbar: !m.hidden && a.width > 0 && +getComputedStyle(m).opacity > 0.5,
             dx: Math.abs(a.left - b.left), db: Math.abs(a.width - b.width) };
  });
  p('§11b angepeilt nicht nur über Farbe: die Marke liegt als Form unter dem Ziel',
    !!marke && marke.sichtbar && marke.dx <= 1.5 && marke.db <= 1.5, JSON.stringify(marke));
  const hub = r2?.ziele.map(z => +z.hub.toFixed(2)) ?? [];
  p('§11c … und das Zeichen hebt sich (×1,3), die Nachbarn halb (×1,13), der Rest ruht',
    hub.length === 5 && Math.abs(hub[2]! - 1.3) < 0.02 && Math.abs(hub[1]! - 1.13) < 0.02 && Math.abs(hub[3]! - 1.13) < 0.02
      && hub[0] === 1 && hub[4] === 1 && !!r2?.ziele[2]!.anvisiert, JSON.stringify(hub));
  /* GEFUNDEN AUF DEM BILD (§55.1): mit `data-gehalten` an der Leiste brach die
     Pille das Licht, solange der Finger oben war, und das Wort darunter stand
     doppelt und versetzt da („Do…okumente"). Gemessen wird die Brechung an der
     ruhenden Pille, nicht das Wort. */
  const lesbar = await A.pc.evaluate(() => {
    const l = document.getElementById('handy-oben')!;
    const pille = document.getElementById('ho-pille')!;
    const unter = l.querySelector<HTMLElement>(':scope > button[data-anvisiert]');
    return { gehalten: l.hasAttribute('data-gehalten'), bruch: /url\(/.test(getComputedStyle(pille).backdropFilter || ''),
             reiter: unter?.id ?? null, still: pille.getAnimations().length };
  });
  p('§11e der Reiter unter der Pille bleibt lesbar: in Ruhe keine Brechung über seinem Wort, und er ist angepeilt',
    !lesbar.gehalten && !lesbar.bruch && lesbar.still === 0 && lesbar.reiter === 'hl-lernen', JSON.stringify(lesbar));
  await fuehren(A.cdp, mitte ?? p0, { x: 195, y: 560 }, 3, 16);
  await finger(A.cdp, 'touchEnd'); await warte(700);
}
{
  /* DIE LESBARKEIT, an Bildpunkten gemessen (wie test576 §6): ein Muster in
     Weiss, Schwarz, Rot und Blau hinter dem Glas, die Schrift unsichtbar
     gemacht, gegen jedes Pixel ihres Grundes. Auf dem GPU-Weg — sonst
     zeichnet die kopflose Schale die Unschärfe nicht (test576, E703). */
  const gpu = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader',
    '--ignore-gpu-blocklist', '--enable-gpu-compositing'] });
  for (const dunkel of [false, true]) {
    const g = await aufmachen({ mit: gpu, dunkel });
    await g.pc.evaluate(async () => {
      const s = Store.addPage(null, { text: 'Glas' });
      await Store.flush(); App.zeichneBaum(); App.oeffne(s.id);
      await new Promise(f => setTimeout(f, 700));
      document.querySelectorAll('#rg-willkommen, .overlay').forEach(x => x.remove());
      const muster = document.createElement('div');
      muster.id = 't614-muster';
      muster.style.cssText = 'position:fixed;inset:0;z-index:0;pointer-events:none;display:grid;' +
        'grid-template-columns:repeat(4,1fr);grid-auto-rows:120px;';
      for (let i = 0; i < 64; i++) {
        const z = document.createElement('div');
        z.style.background = ['#ffffff', '#000000', '#e02020', '#1f5cff'][(i + Math.floor(i / 4)) % 4]!;
        muster.appendChild(z);
      }
      document.body.appendChild(muster);
      for (const s2 of ['#app', '#main', '#scroll', '#page', 'body']) {
        const el = document.querySelector<HTMLElement>(s2);
        if (el) el.style.background = 'transparent';
      }
    });
    await warte(300);
    /* Offen gehalten, der Finger ÜBER dem Zielbereich: keine Marke, kein
       Fokusring — gemessen wird die stille Schrift auf dem Glas allein. */
    const p0 = await hinauf(g, 'hl-dok');
    await warte(200);
    await fuehren(g.cdp, p0, { x: p0.x, y: 600 }, 3, 16);
    await warte(900);
    const kasten = await g.pc.evaluate(() => {
      const el = document.getElementById('ho-ziele');
      const tx = el?.querySelector<HTMLElement>(':scope > button:not([aria-current="page"]) b');
      if (!el || !tx || el.hidden) return null;
      const farbe = getComputedStyle(tx).color;
      const st = document.createElement('style');
      st.id = 't614-leise';
      st.textContent = '#ho-ziele *, #ho-ziele{color:transparent!important;text-shadow:none!important}' +
        '#ho-ziele svg{visibility:hidden!important}';
      document.head.appendChild(st);
      const r = el.getBoundingClientRect();
      return { x: r.left + 8, y: r.top + 8, w: r.width - 16, h: r.height - 16, farbe };
    });
    let k: { schlimmster: number; mitte: number } | null = null;
    if (kasten && kasten.w > 10 && kasten.h > 10) {
      await warte(80);
      const bild = await g.pc.screenshot({ clip: { x: kasten.x, y: kasten.y, width: kasten.w, height: kasten.h } });
      await g.pc.evaluate(() => document.getElementById('t614-leise')?.remove());
      k = await g.pc.evaluate(async ([b64, farbe]) => {
        const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
        const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
        const gg = c.getContext('2d')!; gg.drawImage(img, 0, 0);
        const d = gg.getImageData(0, 0, c.width, c.height).data;
        const lin = (v: number) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
        const L = (r: number, g2: number, b: number) => 0.2126 * lin(r) + 0.7152 * lin(g2) + 0.0722 * lin(b);
        const cv = document.createElement('canvas'); cv.width = cv.height = 1;
        const cg = cv.getContext('2d')!; cg.fillStyle = farbe!; cg.fillRect(0, 0, 1, 1);
        const m = Array.from(cg.getImageData(0, 0, 1, 1).data);
        const Lt = L(m[0]!, m[1]!, m[2]!);
        const werte: number[] = [];
        for (let i = 0; i < d.length; i += 16) {
          const Lb = L(d[i]!, d[i + 1]!, d[i + 2]!);
          werte.push((Math.max(Lt, Lb) + 0.05) / (Math.min(Lt, Lb) + 0.05));
        }
        werte.sort((x, y) => x - y);
        return { schlimmster: +werte[Math.floor(werte.length * 0.01)]!.toFixed(2), mitte: +werte[Math.floor(werte.length / 2)]!.toFixed(2) };
      }, [bild.toString('base64'), kasten.farbe] as const);
    }
    const wort = dunkel ? 'dunkel' : 'hell';
    if (k) console.log(`    gemessen (${wort}): schlimmster ${k.schlimmster} : 1 · Mitte ${k.mitte} : 1`);
    p(`§11d die Beschriftung erreicht über dem Muster 4,5 : 1 (${wort})`, !!k && k.schlimmster >= 4.5,
      k ? `schlimmster ${k.schlimmster} · Mitte ${k.mitte}` : 'nicht messbar — keine Zielleiste');
    await finger(g.cdp, 'touchEnd'); await warte(300);
    await g.ctx.close();
  }
  await gpu.close();
}
{
  /* §11f DIE MARKE IST ZU SEHEN — gerade dort, wo sich kein Zeichen hebt
     (Durchsicht E749, §38 „keine Information nur über Farbe"). Ohne Bewegung
     (System oder „Ruhige Darstellung") ist die Lupe aus; dann tragen das
     Angepeilte nur noch die Marke und der Farbton der Schrift. Gegen
     f4ebb5816 gemessen: `--bg-hover` auf der Scheibe 1,08 : 1 (hell) — §11b
     und §13 prüfen nur, dass die Marke DA ist, und eine unsichtbare bestand
     beide (§55.2). Gemessen wird an Bildpunkten, auf dem GPU-Weg wie §11d:
     der Rand der Marke gegen die Scheibe daneben, mindestens 3 : 1 (WCAG
     1.4.11, Formen). Dazu „Hoher Kontrast" und erzwungene Farben, wo das
     System Schatten und Hintergründe selbst setzt. */
  const gpu = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader',
    '--ignore-gpu-blocklist', '--enable-gpu-compositing'] });
  const ARTEN = [
    { art: 'ruhig, hell', ruhig: true, dunkel: false, kontrast: false, farben: false },
    { art: 'ruhig, dunkel', ruhig: true, dunkel: true, kontrast: false, farben: false },
    { art: 'Hoher Kontrast, hell', ruhig: false, dunkel: false, kontrast: true, farben: false },
    { art: 'Hoher Kontrast, dunkel', ruhig: false, dunkel: true, kontrast: true, farben: false },
    { art: 'erzwungene Farben', ruhig: false, dunkel: false, kontrast: false, farben: true }
  ];
  for (const v of ARTEN) {
    const g = await aufmachen({ mit: gpu, dunkel: v.dunkel, ruhig: v.ruhig, farben: v.farben });
    if (v.kontrast) await g.pc.evaluate(() => { Store.setMeta('kontrast', true); Einstellungen.anwenden(); });
    await warte(200);
    await tippe(g, 'hl-dok', 900);
    const p0 = await hinauf(g, 'hl-dok');
    await warte(900);
    const r = await regal(g.pc);
    const ziel = r?.ziele[2];
    if (ziel) await fuehren(g.cdp, p0, ziel, 3, 16);
    await warte(900);
    const m = await g.pc.evaluate(() => {
      const el = document.querySelector<HTMLElement>('#ho-ziele > .ru-marke');
      const s = document.getElementById('ho-ziele');
      const z = document.querySelector<HTMLElement>('#ho-ziele > button[data-anvisiert]');
      if (!el || !s || s.hidden || !z) return null;
      const a = el.getBoundingClientRect();
      return { l: a.left, o: a.top, b: a.width, h: a.height, ziel: (z.textContent || '').trim() };
    });
    let k: { rand: number; innen: number } | null = null;
    if (m && m.b > 20 && m.h > 20) {
      /* Ein Streifen über den linken Rand der Marke, auf halber Höhe (die
         Ecken sind rund, Zeichen und Wort stehen in der Mitte des Ziels). */
      const x0 = Math.floor(m.l) - 10;
      const y0 = Math.round(m.o + m.h * 0.35);
      const bild = await g.pc.screenshot({ clip: { x: x0, y: y0, width: 22, height: Math.round(m.h * 0.3) } });
      k = await g.pc.evaluate(async ([b64, rand]) => {
        const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
        const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
        const gg = c.getContext('2d')!; gg.drawImage(img, 0, 0);
        const d = gg.getImageData(0, 0, c.width, c.height).data;
        const lin = (v: number) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
        const L = (x: number, y: number) => { const i = (y * c.width + x) * 4; return 0.2126 * lin(d[i]!) + 0.7152 * lin(d[i + 1]!) + 0.0722 * lin(d[i + 2]!); };
        const spalte = (x: number) => { const w: number[] = []; for (let y = 0; y < c.height; y++) w.push(L(x, y)); w.sort((a, b) => a - b); return w[Math.floor(w.length / 2)]!; };
        const kr = (a: number, b: number) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
        /* Die Scheibe: vier Spalten 4–7 px links der Marke. Der Rand: die
           stärkste Spalte in den ersten 5 px der Marke. Das Innere: 8 px drin. */
        const draussen = [2, 3, 4, 5].map(spalte).sort((a, b) => a - b)[1]!;
        let bester = 1;
        for (let x = rand - 1; x <= rand + 4; x++) bester = Math.max(bester, kr(spalte(x), draussen));
        return { rand: +bester.toFixed(2), innen: +kr(spalte(rand + 8), draussen).toFixed(2) };
      }, [bild.toString('base64'), Math.round(m.l - x0)] as const);
    }
    console.log(`    Marke (${v.art}): Rand ${k?.rand ?? '–'} : 1 · Fläche ${k?.innen ?? '–'} : 1 · auf „${m?.ziel ?? '–'}"`);
    p(`§11f die Marke hebt sich ab: ihr Rand mindestens 3 : 1 gegen die Scheibe (${v.art})`, !!k && k.rand >= 3,
      k ? `Rand ${k.rand} : 1 · Fläche ${k.innen} : 1` : 'nicht messbar — keine Marke');
    await fuehren(g.cdp, ziel ?? p0, { x: 195, y: 560 }, 3, 16);
    await finger(g.cdp, 'touchEnd'); await warte(300);
    await g.ctx.close();
  }
  await gpu.close();
}

/* ═══ §12 Tastatur ══════════════════════════════════════════════════════ */
console.log('\n§12 Die Tastatur ist der Weg ohne Geste (§38)');
{
  await tippe(A, 'hl-start', 1000);
  await beobachten(A.pc);
  await A.pc.focus('#hl-dok');
  await A.pc.keyboard.press('ArrowUp');
  await warte(200);
  const f = () => A.pc.evaluate(() => {
    const a = document.activeElement as HTMLElement | null;
    return { text: (a?.textContent || '').trim(), id: a?.id || '', rolle: a?.getAttribute('role') || '' };
  });
  const s = await stand(A.pc);
  const f0 = await f();
  p('§12a Pfeil hinauf auf „Dokumente": offen, aufgeklappt, der Fokus auf dem ersten Ziel',
    s.offen && JSON.stringify(s.expanded) === '["hl-dok"]' && f0.text === 'Meine Ablage' && f0.rolle === 'menuitem',
    JSON.stringify({ offen: s.offen, expanded: s.expanded, fokus: f0 }));
  await A.pc.keyboard.press('ArrowRight'); const f1 = await f();
  await A.pc.keyboard.press('ArrowLeft'); await A.pc.keyboard.press('ArrowLeft'); const f2 = await f();
  await A.pc.keyboard.press('Home'); const f3 = await f();
  await A.pc.keyboard.press('End'); const f4 = await f();
  p('§12b → nächstes, ← rundum zum letzten, Pos1 erstes, Ende letztes',
    f1.text === 'Zuletzt' && f2.text === 'Notizhefte' && f3.text === 'Meine Ablage' && f4.text === 'Notizhefte',
    JSON.stringify([f1.text, f2.text, f3.text, f4.text]));
  const stopps = await A.pc.evaluate(() => [...document.querySelectorAll<HTMLElement>('#ho-ziele > button')].filter(b => b.tabIndex === 0).length);
  p('§12c genau ein Tabstopp im Menü (wandernder tabindex)', stopps === 1, String(stopps));
  await A.pc.keyboard.press('Escape'); await warte(200);
  const e = await stand(A.pc); const fe = await f();
  p('§12d Escape: zu, der Fokus zurück auf „Dokumente", nichts gewählt',
    !e.offen && fe.id === 'hl-dok' && e.expanded.length === 0 && e.wechsel === 0 && e.an[0] === 'hl-start',
    JSON.stringify({ offen: e.offen, fokus: fe.id, wechsel: e.wechsel, an: e.an }));
  await A.pc.keyboard.press('ArrowUp'); await warte(150);
  await A.pc.keyboard.press('Tab'); await warte(200);
  const t = await stand(A.pc);
  p('§12e Tab verlässt das Menü und schliesst es', !t.offen && t.expanded.length === 0, JSON.stringify({ offen: t.offen }));
  await A.pc.focus('#hl-dok');
  await A.pc.keyboard.press('ArrowUp'); await warte(150);
  await A.pc.keyboard.press('End');
  await A.pc.keyboard.press('Enter'); await warte(1400);
  const n = await stand(A.pc);
  const fn = await f();
  p('§12f Enter wählt „Notizhefte": die Notizhefte, „Dokumente" leuchtet, eine Ankunft',
    n.wo === 'notizhefte' && n.an[0] === 'hl-dok' && n.wechsel === 1 && !n.offen,
    JSON.stringify({ wo: n.wo, an: n.an, wechsel: n.wechsel }));
  /* Durchsicht E749 (§38 „die Tastaturbedienung bleibt erhalten"): Enter auf
     dem Reiter selbst lässt den Fokus auf dem Reiter. Gegen f4ebb5816 stand er
     nach der Wahl eines Orts auf <body> — die Zielleiste hielt ihn, als sie
     verschwand, und niemand gab ihn zurück. */
  p('§12g … und der Fokus steht danach auf „Dokumente", nicht auf der Seite', fn.id === 'hl-dok',
    JSON.stringify({ id: fn.id, rolle: fn.rolle, text: fn.text.replace(/\s+/g, ' ').slice(0, 40) }));
  await allesZu(A);
  /* Eine Handlung bekommt den Fokus in ihr Fenster (die Einstellungen). */
  await A.pc.focus('#hl-mehr');
  await A.pc.keyboard.press('ArrowUp'); await warte(150);
  await A.pc.keyboard.press('End');
  await A.pc.keyboard.press('Enter'); await warte(900);
  const fh = await A.pc.evaluate(() => {
    const a = document.activeElement as HTMLElement | null;
    return { tag: a?.tagName || '', imFenster: !!a?.closest('.overlay,[role="dialog"]'), offen: document.querySelectorAll('.overlay').length };
  });
  p('§12h Enter auf „Einstellungen": das Fenster ist offen und hat den Fokus', fh.offen > 0 && fh.imFenster, JSON.stringify(fh));
  await allesZu(A);
}

/* ═══ §13 Ruhig ═════════════════════════════════════════════════════════ */
console.log('\n§13 Ohne Bewegung: keine Animation, der Zustand bleibt sichtbar');
for (const art of ['System (reduce)', 'Ruhige Darstellung'] as const) {
  const R = await aufmachen({ ruhig: art === 'System (reduce)' });
  if (art === 'Ruhige Darstellung') await R.pc.evaluate(() => Einstellungen.S('bewegung', 'ruhig'));
  await warte(200);
  await R.pc.evaluate(() => {
    const w = window as any;
    w.__anim614 = 0;
    const zaehle = () => {
      const s = document.getElementById('ho-ziele');
      if (s) w.__anim614 += s.getAnimations({ subtree: true }).length;
      w.__anim614raf = requestAnimationFrame(zaehle);
    };
    zaehle();
  });
  const p0 = await hinauf(R, 'hl-dok');
  await warte(150);
  const r = await regal(R.pc, false);
  const ziel = r?.ziele[3];
  if (ziel) await fuehren(R.cdp, p0, ziel, 3, 16);
  await warte(60);
  const lern = await reiterMitte(R.pc, 'hl-lernen');
  const mitten = await R.pc.evaluate(() => {
    const m = document.querySelector<HTMLElement>('#ho-ziele > .ru-marke');
    const z = document.querySelector<HTMLElement>('#ho-ziele > button[data-anvisiert]');
    return { marke: !!m && !m.hidden && +getComputedStyle(m).opacity > 0.5 && !!z
               && Math.abs(m.getBoundingClientRect().left - z.getBoundingClientRect().left) <= 1.5,
             ziel: (z?.textContent || '').trim() };
  });
  await fuehren(R.cdp, ziel ?? p0, { x: lern.x, y: lern.y }, 4, 16);
  await warte(80);
  const getauscht = await regal(R.pc, false);
  await fuehren(R.cdp, { x: lern.x, y: lern.y }, { x: lern.x, y: 560 }, 3, 16);
  await finger(R.cdp, 'touchEnd'); await warte(300);
  const n = await R.pc.evaluate(() => { cancelAnimationFrame((window as any).__anim614raf); return (window as any).__anim614; });
  p(`§13 ${art}: offen, getauscht und zu — 0 Animationen an der Zielleiste und ihren Kindern`,
    !!r?.da && n === 0 && JSON.stringify(getauscht?.ziele.map(z => z.text)) === JSON.stringify(REDUR['lernen']), `${n} Animationen`);
  p(`§13 ${art}: die Marke ist gesetzt, das Ziel angepeilt („PDFs")`, mitten.marke && mitten.ziel === 'PDFs', JSON.stringify(mitten));
  await R.ctx.close();
}

/* ═══ §14 Nur transform und opacity ══════════════════════════════════════ */
console.log('\n§14 In allen Bildern bewegt sich nur transform und opacity');
{
  await tippe(A, 'hl-dok', 900);
  await A.pc.evaluate(() => {
    const w = window as any;
    w.__eig614 = new Set<string>();
    w.__anz614 = 0;
    const sieh = () => {
      const s = document.getElementById('ho-ziele');
      for (const a of s ? s.getAnimations({ subtree: true }) : []) {
        w.__anz614++;
        const e = a.effect as KeyframeEffect | null;
        for (const k of e?.getKeyframes() ?? [])
          for (const n of Object.keys(k)) if (!['offset', 'computedOffset', 'easing', 'composite'].includes(n)) w.__eig614.add(n);
        if ((a as any).transitionProperty) w.__eig614.add((a as any).transitionProperty);
      }
      w.__eig614raf = requestAnimationFrame(sieh);
    };
    sieh();
  });
  const p0 = await hinauf(A, 'hl-dok');
  await warte(100);
  const r = await regal(A.pc, false);
  if (r) { await fuehren(A.cdp, p0, r.ziele[1]!, 3, 16); await fuehren(A.cdp, r.ziele[1]!, r.ziele[3]!, 4, 20); }
  const lern = await reiterMitte(A.pc, 'hl-lernen');
  await fuehren(A.cdp, r?.ziele[3] ?? p0, lern, 4, 20);
  await warte(200);
  await fuehren(A.cdp, lern, { x: 195, y: 560 }, 3, 16);
  await finger(A.cdp, 'touchEnd'); await warte(500);
  const e = await A.pc.evaluate(() => { const w = window as any; cancelAnimationFrame(w.__eig614raf); return { eig: [...w.__eig614], n: w.__anz614 }; });
  const fremd = e.eig.filter((x: string) => !['transform', 'opacity'].includes(x));
  p('§14 die Zielleiste hat sich bewegt (sonst prüfte das nichts)', e.n > 0, `${e.n} Animationsbilder`);
  p('§14 und nur über transform und opacity — kein filter, kein backdrop-filter, keine Breite', e.n > 0 && fremd.length === 0,
    JSON.stringify(e.eig));
}

/* ═══ §15 Wo nicht ═══════════════════════════════════════════════════════ */
console.log('\n§15 Wo es die Zielleiste nicht gibt');
{
  const D = await aufmachen({ handy: false });
  const d = await D.pc.evaluate(() => {
    const s = document.getElementById('ho-ziele');
    const l = document.getElementById('handy-oben')!.getBoundingClientRect();
    if (!s) return { da: false, leiste: l.height };
    const war = s.hidden; s.hidden = false;
    const anzeige = getComputedStyle(s).display;
    s.hidden = war;
    return { da: true, leiste: l.height, anzeige };
  });
  p('§15a am Rechner (1440 × 900): keine Leiste, und die Zielleiste ist per Stilblatt aus — selbst unverborgen',
    d.da && d.leiste === 0 && (d as any).anzeige === 'none', JSON.stringify(d));
  await D.ctx.close();

  const Q = await aufmachen({ breite: 844, hoehe: 390 });
  await beobachten(Q.pc);
  await finger(Q.cdp, 'touchStart', 300, 370); await warte(30);
  await fuehren(Q.cdp, { x: 300, y: 370 }, { x: 300, y: 250 }, 4, 16);
  await finger(Q.cdp, 'touchEnd'); await warte(400);
  const q = await stand(Q.pc);
  const qLeiste = await Q.pc.evaluate(() => document.getElementById('handy-oben')!.getBoundingClientRect().height);
  p('§15b quer (844 × 390): keine Leiste, und ein Zug von unten öffnet in keinem Bild etwas', qLeiste === 0 && q.offenBilder === 0,
    JSON.stringify({ leiste: qLeiste, bilder: q.offenBilder }));
  await Q.ctx.close();

  /* Beim Schreiben ist die Leiste weg (body.schreibt) — ein Zug von dort
     unten trifft den Text, nicht die Leiste. */
  await A.pc.evaluate(async () => {
    const s = Store.addPage(null, { text: 'Schreiben' });
    Store.addBlock(s.id, 'text', { text: 'Ein Absatz zum Schreiben.' });
    await Store.flush(); App.oeffne(s.id);
  });
  await warte(800);
  const blk = await A.pc.evaluate(() => {
    const e = document.querySelector<HTMLElement>('#page .blk [contenteditable]');
    const r = e?.getBoundingClientRect();
    return r ? { x: r.left + 20, y: r.top + r.height / 2 } : null;
  });
  if (blk) { await finger(A.cdp, 'touchStart', blk.x, blk.y); await warte(40); await finger(A.cdp, 'touchEnd'); await warte(500); }
  await beobachten(A.pc);
  const schreibt = await A.pc.evaluate(() => document.body.classList.contains('schreibt'));
  await finger(A.cdp, 'touchStart', 50, 805); await warte(30);
  await fuehren(A.cdp, { x: 50, y: 805 }, { x: 50, y: 700 }, 4, 16);
  await finger(A.cdp, 'touchEnd'); await warte(400);
  const w = await stand(A.pc);
  p('§15c beim Schreiben (body.schreibt): ein Zug von unten öffnet in keinem Bild etwas', schreibt && w.offenBilder === 0,
    JSON.stringify({ schreibt, bilder: w.offenBilder }));
  await A.pc.evaluate(() => { (document.activeElement as HTMLElement | null)?.blur(); document.body.classList.remove('schreibt'); });
  await allesZu(A);
  await tippe(A, 'hl-dok', 900);
  /* Im offenen Dokument ist die Leiste per Stilblatt weg. Der Zustand wird
     gesetzt (ein PDF zu öffnen ist hier nicht der Gegenstand), die Geste ist echt. */
  await A.pc.evaluate(() => { document.body.dataset['dokument'] = 'an'; });
  await beobachten(A.pc);
  await finger(A.cdp, 'touchStart', 50, 805); await warte(30);
  await fuehren(A.cdp, { x: 50, y: 805 }, { x: 50, y: 700 }, 4, 16);
  await finger(A.cdp, 'touchEnd'); await warte(400);
  const dd = await stand(A.pc);
  p('§15d im offenen Dokument (data-dokument="an"): nichts', dd.offenBilder === 0, JSON.stringify({ bilder: dd.offenBilder }));
  await A.pc.evaluate(() => { delete document.body.dataset['dokument']; });
  await allesZu(A);
}

/* ═══ §16 Kein Konflikt ═══════════════════════════════════════════════════ */
console.log('\n§16 Kein Konflikt mit Schublade, Wischen und dem Heben eines Blocks');
{
  await tippe(A, 'hl-dok', 1000);
  await beobachten(A.pc);
  /* a) Ab x = 20 (die Schublade hört unter 26 zu): hinauf, zurück auf die
     Leiste, 100 px nach rechts — für `pwa.ts` sähe das aus wie der Wisch vom Rand. */
  const oben = await leisteOben(A.pc);
  await finger(A.cdp, 'touchStart', 20, 805); await warte(30);
  await fuehren(A.cdp, { x: 20, y: 805 }, { x: 20, y: oben - 30 }, 4, 16);
  await warte(120);
  const offenA = (await stand(A.pc)).offen;
  await fuehren(A.cdp, { x: 20, y: oben - 30 }, { x: 20, y: 805 }, 3, 16);
  await fuehren(A.cdp, { x: 20, y: 805 }, { x: 120, y: 805 }, 5, 16);
  await finger(A.cdp, 'touchEnd'); await warte(1100);
  const a = await stand(A.pc);
  p('§16a ab x = 20 hinauf und über die Leiste zurück: die Schublade bleibt zu, genau ein Klick auf „Heute"',
    offenA && !a.schublade && JSON.stringify(a.klicks) === '{"hl-start":1}',
    JSON.stringify({ offen: offenA, schublade: a.schublade, klicks: a.klicks }));
  await A.pc.evaluate(() => { if (document.body.classList.contains('side-offen')) (window as any).PWA?.schubladeZu?.(); });
  /* b) Wischen: ein weiter waagerechter Zug IN der Zielleiste ist kein Bereichswechsel. */
  await tippe(A, 'hl-lernen', 1100);
  await beobachten(A.pc);
  const p0 = await hinauf(A, 'hl-lernen');
  await warte(200);
  await fuehren(A.cdp, p0, { x: 60, y: oben - 40 }, 3, 16);
  await fuehren(A.cdp, { x: 60, y: oben - 40 }, { x: 340, y: oben - 40 }, 8, 16);
  await fuehren(A.cdp, { x: 340, y: oben - 40 }, { x: 340, y: 560 }, 3, 16);
  await finger(A.cdp, 'touchEnd'); await warte(900);
  const b = await stand(A.pc);
  p('§16b 280 px waagerecht in der Zielleiste und zu hoch losgelassen: kein Wischen, „Lernen" bleibt',
    b.an[0] === 'hl-lernen' && b.wechsel === 0 && Object.keys(b.klicks).length === 0, JSON.stringify({ an: b.an, wechsel: b.wechsel }));
  /* c) E83: Halten auf einem Block hebt ihn weiterhin. */
  await A.pc.evaluate(async () => {
    const s = Store.addPage(null, { text: 'Heben' });
    Store.addBlock(s.id, 'text', { text: 'Dieser Absatz wird gehoben.' });
    await Store.flush(); App.oeffne(s.id);
  });
  await warte(900);
  const blk = await A.pc.evaluate(() => {
    const e = document.querySelector<HTMLElement>('#page .blk');
    const r = e?.getBoundingClientRect();
    return r ? { x: r.left + r.width / 2, y: r.top + Math.min(14, r.height / 2) } : null;
  });
  let gehoben = false;
  if (blk) {
    await finger(A.cdp, 'touchStart', blk.x, blk.y);
    await warte(750);
    gehoben = await A.pc.evaluate(() => !!document.querySelector('.blk.gehoben'));
    await finger(A.cdp, 'touchEnd'); await warte(500);
  }
  p('§16c Halten auf einem Block hebt ihn weiterhin (E83)', gehoben, String(gehoben));
  await allesZu(A);
}

/* ═══ §17 Über Toast und Neu-Laden-Streifen ═══════════════════════════════ */
console.log('\n§17 Die Zielleiste liegt über dem, was über der Leiste schwebt');
{
  await tippe(A, 'hl-dok', 1000);
  await A.pc.evaluate(() => {
    UI.toast('Eine Meldung über der Leiste', 30000);
    UI.banner('Es liegt eine neue Fassung bereit. <button id="pwa-neu" class="banner-tat">Jetzt laden</button>', 'info unten');
  });
  await warte(600);
  const vorher = await A.pc.evaluate(() => {
    const t = document.getElementById('toast');
    const b = document.getElementById('banner');
    const r = (e: HTMLElement | null) => e ? [Math.round(e.getBoundingClientRect().top), Math.round(e.getBoundingClientRect().height)].join('/') : 'fehlt';
    return { toast: r(t), toastDa: !!t && t.classList.contains('show'), banner: r(b), bannerDa: !!b && !b.hidden };
  });
  const p0 = await hinauf(A, 'hl-dok');
  await warte(900);
  const treffer = await A.pc.evaluate(() => [...document.querySelectorAll<HTMLElement>('#ho-ziele > button')].map(b => {
    const r = b.getBoundingClientRect();
    const e = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return !!e && b.contains(e);
  }));
  await fuehren(A.cdp, p0, { x: p0.x, y: 560 }, 3, 16);
  await finger(A.cdp, 'touchEnd'); await warte(700);
  const nachher = await A.pc.evaluate(() => {
    const t = document.getElementById('toast');
    const b = document.getElementById('banner');
    const r = (e: HTMLElement | null) => e ? [Math.round(e.getBoundingClientRect().top), Math.round(e.getBoundingClientRect().height)].join('/') : 'fehlt';
    return { toast: r(t), toastDa: !!t && t.classList.contains('show'), banner: r(b), bannerDa: !!b && !b.hidden };
  });
  p('§17a mit Toast und Neu-Laden-Streifen: in der Mitte jedes Ziels liegt das Ziel',
    treffer.length === 5 && treffer.every(Boolean) && vorher.bannerDa && vorher.toastDa, JSON.stringify({ treffer, vorher }));
  p('§17b danach stehen Toast und Streifen unverändert', JSON.stringify(vorher) === JSON.stringify(nachher),
    JSON.stringify({ vorher, nachher }));
  await A.pc.evaluate(() => { document.getElementById('banner')?.remove(); document.getElementById('toast')?.classList.remove('show'); });
}

/* ═══ §18 Glas ═══════════════════════════════════════════════════════════ */
console.log('\n§18 Das Glas der Leiste, und deckend, wo es kein Glas gibt');
{
  const css = lies('quell/schale/stil/bausteine.css');
  /* Der @supports-Block der Leiste (E695) — derselbe Block muss die Zielleiste tragen. */
  const block = /@supports \(\(backdrop-filter:blur\(1px\)\) or \(-webkit-backdrop-filter:blur\(1px\)\)\)\{([^{}]*\{[^{}]*\})+\s*\}/g;
  const leisteBlock = [...css.matchAll(block)].map(m => m[0]).find(b => /#handy-oben\s*[,{]/.test(b)) ?? '';
  p('§18a die Zielleiste steht im SELBEN @supports-Block wie die Leiste, mit derselben Fläche und Unschärfe',
    /#ho-ziele/.test(leisteBlock) && /background:var\(--bg-schwebend-dicht\)/.test(leisteBlock)
      && /-webkit-backdrop-filter:var\(--glas-blur\)/.test(leisteBlock) && /[^-]backdrop-filter:var\(--glas-blur\)/.test(leisteBlock),
    leisteBlock.slice(0, 200).replace(/\s+/g, ' '));
  for (const art of ['weniger Transparenz', 'Hoher Kontrast'] as const) {
    const K = await aufmachen();
    if (art === 'weniger Transparenz') await K.cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-transparency', value: 'reduce' }] });
    else await K.pc.evaluate(() => { Store.setMeta('kontrast', true); Einstellungen.anwenden(); });
    await warte(200);
    const p0 = await hinauf(K, 'hl-dok');
    await warte(900);
    const g = await K.pc.evaluate(() => {
      const s = document.getElementById('ho-ziele');
      if (!s || s.hidden) return null;
      const st = getComputedStyle(s);
      const cv = document.createElement('canvas'); cv.width = cv.height = 1;
      const c = cv.getContext('2d')!; c.fillStyle = st.backgroundColor; c.fillRect(0, 0, 1, 1);
      return { blur: st.backdropFilter, alpha: c.getImageData(0, 0, 1, 1).data[3] };
    });
    p(`§18b ${art}: die Zielleiste ist deckend, ohne Unschärfe`, !!g && (g.blur === 'none' || g.blur === '') && g.alpha === 255,
      JSON.stringify(g));
    await fuehren(K.cdp, p0, { x: p0.x, y: 560 }, 3, 16);
    await finger(K.cdp, 'touchEnd'); await warte(300);
    await K.ctx.close();
  }
  /* Höchstens 60 % des Bildschirms unter Glas, mit offener Zielleiste (test582 §7). */
  const p0 = await hinauf(A, 'hl-dok');
  await warte(900);
  const flaeche = await A.pc.evaluate(() => {
    let summe = 0; const namen: string[] = [];
    for (const el of document.querySelectorAll<HTMLElement>('body *')) {
      const s = getComputedStyle(el);
      if (!s.backdropFilter || s.backdropFilter === 'none') continue;
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1 || s.display === 'none' || +s.opacity === 0) continue;
      if (el.id === 'ho-pille') continue;          /* ein Teil der Leiste, keine zweite Fläche (test582) */
      summe += r.width * r.height; namen.push(el.id || el.className);
    }
    return { anteil: summe / (innerWidth * innerHeight), namen };
  });
  console.log(`    Glas mit offener Zielleiste: ${(flaeche.anteil * 100).toFixed(1)} % · ${flaeche.namen.join(' | ')}`);
  p('§18c mit offener Zielleiste höchstens 60 % des Bildschirms unter Glas — und sie ist eine davon',
    flaeche.anteil <= 0.6 && flaeche.namen.includes('ho-ziele'), JSON.stringify({ anteil: +(flaeche.anteil * 100).toFixed(1), namen: flaeche.namen }));
  await fuehren(A.cdp, p0, { x: p0.x, y: 560 }, 3, 16);
  await finger(A.cdp, 'touchEnd'); await warte(500);
}

/* ═══ §19 Start ══════════════════════════════════════════════════════════ */
console.log('\n§19 Start: geladen, im Grundstock, klein');
{
  const js = 'quell/schale/aufbau/tab-shelf.js';
  const html = lies('index.html');
  const sw = lies('src/dienst/sw.ts');
  const da = fs.existsSync(path.join(WURZEL, js));
  const gz = da ? zlib.gzipSync(fs.readFileSync(path.join(WURZEL, js)), { level: 6 }).length : 0;
  const ladeOrt = html.indexOf('src="' + js + '"');
  p('§19a tab-shelf.js ist gebaut, steht in index.html (nach wischen.js, vor seitenleiste.js) und im GRUNDSTOCK',
    da && ladeOrt > html.indexOf('quell/schale/aufbau/wischen.js') && ladeOrt < html.indexOf('quell/schale/aufbau/seitenleiste.js')
      && sw.includes("'./" + js + "'"), JSON.stringify({ da, ladeOrt }));
  console.log(`    tab-shelf.js: ${(gz / 1024).toFixed(2)} KB gzip`);
  p('§19b und sie ist klein: höchstens 5 KB gzip (die Decke des Starts hält test388 §5)', da && gz <= 5 * 1024, `${gz} B`);
}

p('§20 keine Seitenfehler', fehler.length === 0, fehler.slice(0, 4).join(' · '));

await A.ctx.close();
await browser.close();
server.close();
console.log(`\n${ok}/${ok + weg} bestanden`);
process.exit(weg ? 1 : 0);
