/* Suite 601 — Der Kopf des Lernzentrums in einer Zeile (E726)
 * ============================================================================
 * WAS HIER GEHALTEN WIRD. Redur, PDF vom 29. September 2026, Seite 21, zum
 * Foto der Lernzentrale:
 *
 *     „Ganz oben wo menü/ dort sollte wo heute und was neben das ist im ^
 *      und die unter den das die übersicht neben heute auch mit ^ es nimmt
 *      die anderen wie lernpfand , tranier esc auch mitt. Und die bereiche
 *      momentan das löschen oder am beste das zur fächer wechseln"
 *
 * Gelesen mit der Seite 3 des PDF: die obere Reihe („Heute | Lernen ⌄ |
 * Prüfungen ⌄ | Wo du lernst ⌄") fällt in ein ^ neben „Heute"; die zweite
 * Reihe („Übersicht | Trainer | Lernpfad | Meine Fehler | Fortschritt")
 * wandert als „Übersicht ^" neben „Heute"; aus „Bereich" wird „Fächer".
 * Das ^, das er meint, ist das ⌄ an den Gruppenknöpfen — es versprach ein
 * Menü, das es nicht gab (E206: „bewusst kein Aufklappmenü").
 *
 * DIESER LAUF PRÜFT DIE ZUSAGEN ALS ZAHLEN:
 *
 *   §1 EINE ZEILE. Am Rechner (1440 × 900) und am Telefon (390 × 844),
 *      dunkel und hell, in Heute, Übersicht, Trainer und Noten: keine
 *      `.lw-subnav`, höchstens fünf Bedienelemente im Kopf, alle auf EINER
 *      Höhe, alle ganz im Bild; am Telefon rollt `.lw-nav` nicht mehr
 *      (scrollWidth ≤ clientWidth + 1), und der Inhalt beginnt in der
 *      Übersicht so hoch wie auf „Heute" (keine zweite Reihe). Auch bei
 *      781, 800 und 860 px kürzt kein Hauptteil (§1g), und am Telefon
 *      steht der Chip auf der Mitte der Reiter, mit und ohne die ruhige
 *      Fassung (§1h).
 *   §2 ECHTE ^. Zwei Hauptteile (`[data-lw-nav]`, genau einer mit
 *      `aria-current="page"`) und drei ^ (`[data-lw-klappe]` heute,
 *      uebersicht, faecher) mit `aria-haspopup="menu"`,
 *      `aria-expanded="false"` in Ruhe und einem Namen; am Telefon 44 × 44,
 *      am Rechner 44 breit und so hoch wie die Reiter (E205: 34 px für die
 *      Maus); an der Mitte liegt das ^ selbst (elementFromPoint). Ein Paar
 *      schliesst oben und unten bündig (§2g), und jedes ^ heisst nach
 *      seinem Paar (§2h).
 *   §3 VIER WEGE HINEIN, EINER HINAUS. Maus, Enter, Leertaste und
 *      Fingertipp öffnen ein Menü (`role="menu"`), `aria-expanded` kippt;
 *      Escape schliesst und gibt den Fokus an das ^ zurück; ein zweiter
 *      Klick auf das ^ schliesst. Am Telefon ist es ein Blatt, und „Heute ^"
 *      trägt drei Kartengruppen (Heute · Prüfungen · Wo du lernst).
 *   §4 KEINE ANSICHT GEHT VERLOREN. Hauptteile und Menüeinträge zusammen
 *      sind genau `Lernwelt.ansichten` (alle zwölf); jede Wahl setzt
 *      `data-lw-view`, und `#welt-lernen-<id>` öffnet jede der zwölf.
 *   §5 WO MAN IST, STEHT DA. Nach „Trainer" heisst der Hauptteil „Trainer"
 *      und trägt `aria-current="page"`; im Menü ist „Trainer" angehakt
 *      (✓, `aria-checked="true"`).
 *   §6 FÄCHER. Der Chip zeigt „Alle Fächer"; sein Menü nennt jedes Fach
 *      genau einmal — Themen der Lernkarten und die Zeilen der
 *      Fächer-Datenbank, nach Namen zusammengeführt. „Elektrotechnik"
 *      gewählt: die Zahlen der Lernzentrale sind die von
 *      `Learning.topicProgress` für dieses Thema, die Prüfungen nur seine,
 *      der Chip sagt „Elektrotechnik" und hält den Fokus — und nach dem
 *      Neuladen steht alles noch so. Ein Klick in „Themen & Fächer" setzt
 *      denselben Zustand. Am Telefon sprengt der Chip mit gewähltem Fach die
 *      Zeile nicht: nichts rollt, kein Hauptteil ist gekürzt, und das
 *      Zeichen ist gefüllt statt umrissen (§6o/§6p). Eine Stufe im
 *      Lernpfad startet ihre Themenrunde, setzt aber KEINEN Filter (§6q).
 *   §7 DER LEBENSBEREICH LEBT IM FÄCHERMENÜ — als Gruppe genau dann, wenn
 *      es Lebensbereiche gibt; eine Wahl setzt den Bereich wie früher.
 *   §8 OHNE BEWEGUNG dreht sich das ^ nicht — weder mit „weniger
 *      Bewegung" noch mit `body[data-bewegung="ruhig"]`; offen ist es
 *      trotzdem gedreht (der Zustand bleibt sichtbar).
 *   §9 IN ALLEN ZEHN SCHEMATA lesen sich die Hauptteile und der Chip mit
 *      ≥ 4,5 : 1 und das ^ mit ≥ 3 : 1 — in Ruhe, ohne Zeiger.
 *   §10 AUCH OHNE SERVER: per Doppelklick (file://) und als Einzeldatei
 *      steht derselbe Kopf da.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 *   Gegen den Stand 57a023ecf (claude/lernzentrum-kopf vor E726) rot — die
 *   Zeilen stehen im Commit „test601 (rot)". Die Gegenproben zu E726 stehen
 *   im Commit dazu. §1g, §1h, §2g, §2h und §6q kamen aus der Durchsicht
 *   und waren gegen eaf3ab2c2 rot — die Zeilen stehen im Commit „test601
 *   (rot): was die Durchsicht fand".
 *
 *   node pruefungen/lauf/test601.mts
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
await new Promise<void>(f => { server.listen(0, '127.0.0.1', () => f()); });
const PORT = (server.address() as { port: number }).port;

let ok = 0, weg = 0;
const p = (n: string, wahr: unknown, extra = ''): void => {
  if (wahr) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};

const browser = await chromium.launch();
const fehler: string[] = [];
const warte = (s: Page, ms: number) => s.waitForTimeout(ms);

type Wie = { handy?: boolean; thema?: 'dark' | 'light'; weniger?: boolean; url?: string; breite?: number };
const oeffnen = async (opt: Wie = {}): Promise<{ ctx: BrowserContext; s: Page }> => {
  const ctx = await browser.newContext({
    viewport: opt.handy ? { width: 390, height: 844 } : { width: opt.breite ?? 1440, height: 900 },
    ...(opt.handy ? { isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : {}),
    reducedMotion: opt.weniger ? 'reduce' : 'no-preference'
  });
  const s = await ctx.newPage();
  s.on('pageerror', e => fehler.push(e.message));
  await s.goto(opt.url ?? `http://127.0.0.1:${PORT}/index.html`);
  await s.waitForFunction(() => typeof App !== 'undefined' && typeof Store !== 'undefined' &&
    (document.getElementById('tree')?.children.length || 0) > 0, null, { timeout: 30000 });
  await s.evaluate((t: string) => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung,#rg-neu')
      .forEach(el => el.remove());
    App.theme(t);
  }, opt.thema ?? 'dark');
  await s.mouse.move(2, 2);
  return { ctx, s };
};

/* Zwei Themen aus Lernkarten (Elektrotechnik 10, Geometrie 22), eine
   Fächer-Datenbank (Elektrotechnik, Mathematik, Deutsch) und zwei
   Prüfungen, die über die Beziehung „Fach" auf je ein Fach zeigen. */
const BESTAND = async () => {
  const vorbei = new Date(Date.now() - 2 * 86400000).toISOString();
  const spaeter = new Date(Date.now() + 9 * 86400000).toISOString();
  const at = new Date(Date.now() - 3 * 86400000).toISOString();
  const et = Store.addPage(null, { text: 'Elektrotechnik' });
  const ge = Store.addPage(null, { text: 'Geometrie — Kap. 4' });
  const karte = (seite: any, text: string, art: string, n: string) => {
    if (art === 'neu') return Store.addBlock(seite.id, 'flashcard', { text });
    if (art === 'stabil') return Store.addBlock(seite.id, 'flashcard', { text,
      sr: { ease: 2.6, intervall: 20, wdh: 3, faellig: spaeter },
      reviewVerlauf: { [n]: { id: n, at, rating: 4, algorithm: 'sm2' } } });
    return Store.addBlock(seite.id, 'flashcard', { text,
      sr: { ease: 2.3, intervall: 1, wdh: art === 'fehler' ? 0 : 2, faellig: vorbei },
      reviewVerlauf: { [n]: { id: n, at, rating: art === 'fehler' ? 1 : 4, algorithm: 'sm2' } } });
  };
  ['fehler', 'fehler', 'faellig', 'faellig', 'faellig', 'neu', 'neu', 'neu', 'neu', 'stabil']
    .forEach((a, i) => karte(et, 'ET Frage ' + i + ' :: Antwort ' + i, a, 'e' + i));
  for (let i = 0; i < 22; i++)
    karte(ge, 'Geo Frage ' + i + ' :: Antwort ' + i, ['faellig', 'neu', 'stabil', 'fehler'][i % 4]!, 'g' + i);
  const schule = Store.addPage(null, { text: 'Schule' });
  const faecher = Store.addDatabase(schule.id, 'Fächer', { title: { name: 'Fach', type: 'title' } }, 'table');
  Store.updateCollection(faecher.collectionId, { schoolKind: 'subjects' });
  const zeile: Record<string, any> = {};
  for (const f of ['Elektrotechnik', 'Mathematik', 'Deutsch']) zeile[f] = Store.addRow(faecher.collectionId, { title: f });
  const pr = Store.addDatabase(schule.id, 'Prüfungen', {
    title: { name: 'Prüfung', type: 'title' }, date: { name: 'Termin', type: 'date' },
    subject: { name: 'Fach', type: 'relation', ziel: faecher.collectionId }
  }, 'table');
  Store.updateCollection(pr.collectionId, { schoolKind: 'exams' });
  const inZehn = new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10);
  for (const [t, f] of [['ET Klausur', 'Elektrotechnik'], ['Mathe-Test', 'Mathematik']] as const) {
    const r = Store.addRow(pr.collectionId, { title: t });
    Store.setProp(r.id, 'date', inZehn);
    Store.setProp(r.id, 'subject', [zeile[f].id]);
  }
  await Store.flush();
};
const ansicht = (s: Page, a: string) => s.evaluate(async (a: string) => {
  Produktwelten.lernen(a as never); await new Promise(r => setTimeout(r, 900));
}, a);

/** Der Kopf, wie er gerade steht. */
const KOPF = () => {
  const sicht = (el: Element) => { const r = el.getBoundingClientRect(); const st = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && st.visibility !== 'hidden' && st.display !== 'none'; };
  const lw = document.querySelector<HTMLElement>('.lernwelt');
  if (!lw) return null;
  const kontrollen = [...lw.querySelectorAll<HTMLElement>(
    '.lw-head button, .lw-head select, .lw-nav button, .lw-subnav button')].filter(sicht);
  const mitten = kontrollen.map(k => { const r = k.getBoundingClientRect(); return r.top + r.height / 2; });
  const nav = lw.querySelector<HTMLElement>('.lw-nav');
  const inhalt = document.getElementById('lernwelt-inhalt');
  return {
    sicht: lw.dataset['lwView'] || '',
    subnav: !!lw.querySelector('.lw-subnav'),
    anzahl: kontrollen.length,
    namen: kontrollen.map(k => (k.getAttribute('aria-label') || k.textContent || '').trim().slice(0, 30)),
    spanne: mitten.length ? Math.round(Math.max(...mitten) - Math.min(...mitten)) : -1,
    draussen: kontrollen.filter(k => { const r = k.getBoundingClientRect();
      return r.left < -1 || r.right > innerWidth + 1; }).map(k => (k.textContent || '').trim().slice(0, 20)),
    rollt: nav ? { sw: nav.scrollWidth, cw: nav.clientWidth } : null,
    inhaltY: inhalt ? Math.round(inhalt.getBoundingClientRect().top) : -1
  };
};

/** Ein ^ und was es gerade tut. */
const KLAPPE = (welche: string) => {
  const k = document.querySelector<HTMLElement>(`[data-lw-klappe="${welche}"]`);
  /* Am Rechner trägt das Menü role="menu"; das Blatt am Telefon ist ein
     eigenes Gefäss (menue.ts) — gefragt wird darum `.menu`, die Rolle
     prüft §3a gesondert. */
  const m = document.querySelector<HTMLElement>('.menu');
  return {
    da: !!k,
    offen: !!m && m.isConnected,
    rolle: m?.getAttribute('role') ?? null,
    expanded: k?.getAttribute('aria-expanded') ?? null,
    fokusAufKlappe: !!k && document.activeElement === k,
    blatt: !!m?.classList.contains('blatt'),
    karten: m ? m.querySelectorAll('.blatt-karte').length : 0,
    ids: m ? [...m.querySelectorAll<HTMLElement>('[data-wahl]')].map(b => b.dataset['wahl'] || '') : [],
    namen: m ? [...m.querySelectorAll<HTMLElement>('[data-wahl]')].map(b => (b.textContent || '').replace('✓', '').trim()) : [],
    gruppen: m ? [...m.querySelectorAll<HTMLElement>('.grp')].map(g => (g.textContent || '').trim()) : []
  };
};
const zu = async (s: Page) => { await s.keyboard.press('Escape'); await warte(s, 250); };

/* ══ §1 Eine Zeile ════════════════════════════════════════════════════════ */
console.log('\n§1 Eine Zeile — Rechner und Telefon, dunkel und hell');
for (const handy of [false, true]) for (const thema of ['dark', 'light'] as const) {
  const { ctx, s } = await oeffnen({ handy, thema });
  await s.evaluate(BESTAND);
  const wo = (handy ? 'Telefon' : 'Rechner') + ' ' + (thema === 'dark' ? 'dunkel' : 'hell');
  const lagen: Record<string, any> = {};
  for (const v of ['heute', 'lernen', 'trainer', 'noten']) {
    await ansicht(s, v);
    lagen[v] = await s.evaluate(KOPF);
  }
  const alle = Object.values(lagen);
  console.log(`    ${wo}: ` + Object.entries(lagen).map(([v, l]: [string, any]) =>
    `${v} ${l?.anzahl} Elemente, Spanne ${l?.spanne} px, rollt ${l?.rollt?.sw}/${l?.rollt?.cw}, Inhalt y=${l?.inhaltY}`).join(' · '));
  p(`§1a ${wo}: keine zweite Reihe (.lw-subnav) in Heute, Übersicht, Trainer, Noten`,
    alle.every(l => l && !l.subnav), JSON.stringify(alle.map(l => l?.subnav)));
  p(`§1b ${wo}: höchstens fünf Bedienelemente im Kopf`,
    alle.every(l => l && l.anzahl <= 5), JSON.stringify(alle.map(l => [l?.anzahl, l?.namen])));
  p(`§1c ${wo}: alle auf EINER Höhe (Spanne der Mitten ≤ 6 px)`,
    alle.every(l => l && l.spanne >= 0 && l.spanne <= 6), JSON.stringify(alle.map(l => l?.spanne)));
  p(`§1d ${wo}: keines ragt aus dem Bild`, alle.every(l => l && !l.draussen.length),
    JSON.stringify(alle.map(l => l?.draussen)));
  p(`§1e ${wo}: die Reiterleiste rollt nicht (scrollWidth ≤ clientWidth + 1)`,
    alle.every(l => l?.rollt && l.rollt.sw <= l.rollt.cw + 1), JSON.stringify(alle.map(l => l?.rollt)));
  if (handy) p(`§1f ${wo}: die Übersicht beginnt so hoch wie Heute (± 2 px)`,
    Math.abs((lagen['lernen']?.inhaltY ?? 0) - (lagen['heute']?.inhaltY ?? 999)) <= 2,
    `Übersicht y=${lagen['lernen']?.inhaltY}, Heute y=${lagen['heute']?.inhaltY}`);
  await ctx.close();
}

/* §1g ZWISCHEN 781 UND 899 PX. Die ruhige Fassung hielt dem Chip rechts
   264 px frei — so viel, wie er höchstens breit wird (230). Bei 800 px
   blieben den Paaren 342 px, und „Schule / Ausbildung" wurde zu „Schule /
   Ausb…", „Übersicht" zu „Über…" — auch ohne Filter (Durchsicht, Bild
   breite-800-schule-fach.png). Gemessen wird in „Heute", „Schule /
   Ausbildung" und „Übersicht", ohne Fach und mit dem längsten Fach. */
console.log('\n§1g Zwischen 781 und 899 px kürzt kein Hauptteil');
for (const breite of [781, 800, 860]) {
  const { ctx, s } = await oeffnen({ breite });
  await s.evaluate(BESTAND);
  const lagen: string[] = [];
  for (const fach of ['', 'geometrie — kap. 4']) for (const v of ['heute', 'schule', 'lernen']) {
    await ansicht(s, v);
    if (fach && await s.$('[data-lw-klappe="faecher"]')) {
      await s.click('[data-lw-klappe="faecher"]');
      await warte(s, 300);
      await s.click(`.menu [data-wahl="fach:${fach}"]`).catch(() => {});
      await warte(s, 600);
    }
    const m = await s.evaluate(() => {
      const nav = document.querySelector<HTMLElement>('.lw-nav');
      return {
        rollt: nav ? nav.scrollWidth - nav.clientWidth : -1,
        gekuerzt: [...document.querySelectorAll<HTMLElement>('.lw-nav > [data-lw-nav] > span:last-child')]
          .filter(x => x.scrollWidth > x.clientWidth + 1).map(x => x.textContent || '')
      };
    });
    if (m.rollt > 1 || m.gekuerzt.length) lagen.push(`${fach ? 'mit Fach' : 'ohne Fach'} ${v}: rollt ${m.rollt}, gekürzt ${JSON.stringify(m.gekuerzt)}`);
  }
  p(`§1g ${breite} × 900: kein Hauptteil gekürzt, nichts rollt (Heute, Schule, Übersicht; ohne und mit Fach)`,
    lagen.length === 0, lagen.join(' · '));
  await ctx.close();
}

/* §1h AM TELEFON steht der Chip auf der Mitte der Reiterkarte — mit und
   ohne die ruhige Fassung. Die Karte trägt unten 12 px Abstand, der Chip
   trug 0 (ruhig aus) oder 8 (ruhig an) — in einer mittig ausgerichteten
   Rasterzeile rutschte er um die Hälfte des Unterschieds nach unten
   (Durchsicht, ruhig-aus-390-dark.png). */
console.log('\n§1h Am Telefon: der Chip auf der Mitte der Reiter, ruhig an und aus');
for (const [thema, ruhig] of [['dark', 'aus'], ['light', 'aus'], ['dark', 'an']] as const) {
  const { ctx, s } = await oeffnen({ handy: true, thema });
  await s.evaluate(BESTAND);
  await s.evaluate((r: string) => { document.body.dataset['ruhig'] = r; }, ruhig);
  await ansicht(s, 'lernen');
  const m = await s.evaluate(() => {
    const mitte = (el: Element | null) => { if (!el) return -1; const r = el.getBoundingClientRect(); return r.top + r.height / 2; };
    return { nav: Math.round(mitte(document.querySelector('.lw-nav')) * 10) / 10,
      chip: Math.round(mitte(document.querySelector('[data-lw-klappe="faecher"]')) * 10) / 10 };
  });
  p(`§1h Telefon ${thema === 'dark' ? 'dunkel' : 'hell'}, ruhig ${ruhig}: Mitte des Chips = Mitte der Reiterkarte (± 1 px)`,
    m.nav > 0 && m.chip > 0 && Math.abs(m.chip - m.nav) <= 1, JSON.stringify(m));
  await ctx.close();
}

/* ══ §2 Echte ^ ═══════════════════════════════════════════════════════════ */
console.log('\n§2 Echte ^ — Rolle, Name, Grösse, Treffer');
for (const handy of [false, true]) {
  const { ctx, s } = await oeffnen({ handy });
  await s.evaluate(BESTAND);
  await ansicht(s, 'lernen');
  const m = await s.evaluate(() => {
    const haupt = [...document.querySelectorAll<HTMLElement>('.lw-nav > button[data-lw-nav]')];
    const klappen = [...document.querySelectorAll<HTMLElement>('[data-lw-klappe]')];
    const reiter = haupt[0]?.getBoundingClientRect();
    return {
      haupt: haupt.length,
      aktuell: haupt.filter(b => b.getAttribute('aria-current') === 'page').length,
      klappen: klappen.map(k => {
        const r = k.getBoundingClientRect();
        const t = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return { id: k.dataset['lwKlappe'], popup: k.getAttribute('aria-haspopup'),
          expanded: k.getAttribute('aria-expanded'), name: (k.getAttribute('aria-label') || '').trim(),
          b: Math.round(r.width), h: Math.round(r.height), treffer: !!t && (t === k || k.contains(t)) };
      }),
      reiterHoehe: reiter ? Math.round(reiter.height) : 0,
      /* Ein Paar ist EIN Bedienteil: oben und unten bündig. Gemessen in
         der Durchsicht: Hauptteil 138–174, ^ 139–173 — eine Stufe von
         1 px an der Naht, die §2d nicht sehen konnte (er fragt nur, ob
         das ^ MINDESTENS 34 hoch ist). */
      paare: klappen.filter(k => k.dataset['lwKlappe'] !== 'faecher').map(k => {
        const h = (k.previousElementSibling as HTMLElement | null)?.getBoundingClientRect();
        const r = k.getBoundingClientRect();
        return { id: k.dataset['lwKlappe'], oben: h ? Math.round((r.top - h.top) * 10) / 10 : 99,
          unten: h ? Math.round((r.bottom - h.bottom) * 10) / 10 : 99 };
      }),
      altesAuswahlfeld: !!document.querySelector('[data-lw-area]')
    };
  });
  const wo = handy ? 'Telefon' : 'Rechner';
  console.log(`    ${wo}: ${JSON.stringify(m)}`);
  p(`§2a ${wo}: zwei Hauptteile, genau einer mit aria-current="page"`, m.haupt === 2 && m.aktuell === 1,
    `${m.haupt} Hauptteile, ${m.aktuell} aktuell`);
  p(`§2b ${wo}: drei ^ — heute, uebersicht, faecher`,
    JSON.stringify(m.klappen.map(k => k.id).sort()) === JSON.stringify(['faecher', 'heute', 'uebersicht']),
    JSON.stringify(m.klappen.map(k => k.id)));
  p(`§2c ${wo}: jedes ^ sagt aria-haspopup="menu", aria-expanded="false" und hat einen Namen`,
    m.klappen.length === 3 && m.klappen.every(k => k.popup === 'menu' && k.expanded === 'false' && k.name.length > 3),
    JSON.stringify(m.klappen.map(k => [k.id, k.popup, k.expanded, k.name])));
  p(handy ? `§2d ${wo}: jedes ^ misst mindestens 44 × 44`
          : `§2d ${wo}: jedes ^ ist 44 breit und so hoch wie die Reiter (E205)`,
    m.klappen.length === 3 && m.klappen.every(k => k.b >= 44 && (handy ? k.h >= 44 : k.h >= Math.min(34, m.reiterHoehe))),
    JSON.stringify(m.klappen.map(k => [k.id, k.b, k.h])) + ' Reiter ' + m.reiterHoehe);
  p(`§2e ${wo}: an der Mitte jedes ^ liegt das ^ selbst`, m.klappen.length === 3 && m.klappen.every(k => k.treffer),
    JSON.stringify(m.klappen.map(k => [k.id, k.treffer])));
  p(`§2f ${wo}: das alte Auswahlfeld „Bereich" ist weg`, !m.altesAuswahlfeld);
  p(`§2g ${wo}: jedes ^ schliesst oben und unten bündig an seinen Hauptteil an (± 0,5 px)`,
    m.paare.length === 2 && m.paare.every(x => Math.abs(x.oben) <= 0.5 && Math.abs(x.unten) <= 0.5),
    JSON.stringify(m.paare));
  /* Das ^ neben „Übersicht" hiess „Weitere Ansichten: Lernen", und das
     Blatt am Telefon trug „Lernen" als Titel — unter einem Knopf, auf dem
     „Übersicht" steht (Durchsicht, nach-menue-uebersicht-handy-dunkel.png). */
  const namen = Object.fromEntries(m.klappen.map(k => [k.id, k.name]));
  p(`§2h ${wo}: jedes ^ heisst nach seinem Paar („Weitere Ansichten: Heute", „… Übersicht")`,
    namen['heute'] === 'Weitere Ansichten: Heute' && namen['uebersicht'] === 'Weitere Ansichten: Übersicht',
    JSON.stringify(namen));
  await ctx.close();
}

/* ══ §3 Vier Wege hinein, einer hinaus ════════════════════════════════════ */
console.log('\n§3 Maus, Enter, Leertaste, Finger — und Escape');
{
  const { ctx, s } = await oeffnen();
  await s.evaluate(BESTAND);
  await ansicht(s, 'lernen');
  const wege: Array<[string, () => Promise<void>]> = [
    ['Maus', () => s.click('[data-lw-klappe="heute"]')],
    ['Enter', async () => { await s.focus('[data-lw-klappe="heute"]'); await s.keyboard.press('Enter'); }],
    ['Leertaste', async () => { await s.focus('[data-lw-klappe="heute"]'); await s.keyboard.press(' '); }]
  ];
  for (const [name, tun] of wege) {
    if (!(await s.$('[data-lw-klappe="heute"]'))) { p(`§3 ${name}: „Heute ^" fehlt`, false); continue; }
    await tun();
    await warte(s, 300);
    const auf = await s.evaluate(KLAPPE, 'heute');
    p(`§3a ${name} öffnet „Heute ^" (role=menu, aria-expanded=true)`, auf.offen && auf.rolle === 'menu' &&
      auf.expanded === 'true', JSON.stringify(auf));
    await zu(s);
    const nach = await s.evaluate(KLAPPE, 'heute');
    p(`§3b nach ${name}: Escape schliesst, aria-expanded=false, Fokus zurück auf dem ^`,
      !nach.offen && nach.expanded === 'false' && nach.fokusAufKlappe, JSON.stringify(nach));
  }
  if (await s.$('[data-lw-klappe="uebersicht"]')) {
    await s.click('[data-lw-klappe="uebersicht"]');
    await warte(s, 300);
    const auf = await s.evaluate(KLAPPE, 'uebersicht');
    await s.click('[data-lw-klappe="uebersicht"]');
    await warte(s, 300);
    const wieder = await s.evaluate(KLAPPE, 'uebersicht');
    p('§3c ein zweiter Klick auf „Übersicht ^" schliesst', auf.offen && !wieder.offen && wieder.expanded === 'false',
      JSON.stringify({ auf: auf.offen, wieder }));
  } else p('§3c „Übersicht ^" fehlt', false);
  await ctx.close();
}
{
  const { ctx, s } = await oeffnen({ handy: true });
  await s.evaluate(BESTAND);
  await ansicht(s, 'lernen');
  if (await s.$('[data-lw-klappe="heute"]')) {
    await s.tap('[data-lw-klappe="heute"]');
    await warte(s, 600);
    const auf = await s.evaluate(KLAPPE, 'heute');
    p('§3d Fingertipp öffnet „Heute ^" als Blatt mit drei Kartengruppen', auf.offen && auf.blatt && auf.karten >= 3 &&
      auf.expanded === 'true', JSON.stringify(auf));
    await zu(s);
    const nach = await s.evaluate(KLAPPE, 'heute');
    p('§3e Escape schliesst das Blatt, Fokus zurück auf dem ^', !nach.offen && nach.fokusAufKlappe, JSON.stringify(nach));
  } else p('§3d „Heute ^" fehlt am Telefon', false);
  if (await s.$('[data-lw-klappe="faecher"]')) {
    await s.tap('[data-lw-klappe="faecher"]');
    await warte(s, 600);
    const auf = await s.evaluate(KLAPPE, 'faecher');
    p('§3f Fingertipp auf den Fächer-Chip öffnet ein Blatt', auf.offen && auf.blatt, JSON.stringify(auf));
    await zu(s);
  } else p('§3f der Fächer-Chip fehlt am Telefon', false);
  await ctx.close();
}

/* ══ §4 Keine Ansicht geht verloren ═══════════════════════════════════════ */
console.log('\n§4 Alle zwölf Ansichten — über die ^ und über die Route');
{
  const { ctx, s } = await oeffnen();
  await s.evaluate(BESTAND);
  await ansicht(s, 'heute');
  const soll: string[] = await s.evaluate(() => Lernwelt.ansichten.map((a: any) => a.id).sort());
  const ids = new Set<string>(await s.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('.lw-nav > button[data-lw-nav]')].map(b => b.dataset['lwNav'] || '')));
  const imMenue: Record<string, string> = {};
  for (const k of ['heute', 'uebersicht']) {
    if (!(await s.$(`[data-lw-klappe="${k}"]`))) continue;
    await s.click(`[data-lw-klappe="${k}"]`);
    await warte(s, 300);
    for (const id of (await s.evaluate(KLAPPE, k)).ids) { ids.add(id); imMenue[id] = k; }
    await zu(s);
  }
  p('§4a Hauptteile und Menüeinträge sind zusammen genau die zwölf Ansichten',
    JSON.stringify([...ids].sort()) === JSON.stringify(soll), `ist ${JSON.stringify([...ids].sort())}, soll ${JSON.stringify(soll)}`);
  const verfehlt: string[] = [];
  for (const id of soll) {
    const k = imMenue[id];
    if (!k) { verfehlt.push(id + ' (in keinem Menü)'); continue; }
    await s.click(`[data-lw-klappe="${k}"]`);
    await warte(s, 300);
    const ziel = await s.$(`.menu [data-wahl="${id}"]`);
    if (!ziel) { verfehlt.push(id + ' (kein Eintrag)'); await zu(s); continue; }
    await ziel.click();
    await warte(s, 700);
    const v = await s.evaluate(() => document.querySelector<HTMLElement>('.lernwelt')?.dataset['lwView']);
    if (v !== id) verfehlt.push(id + ' → ' + v);
  }
  p('§4b jede Wahl im Menü setzt data-lw-view', verfehlt.length === 0, verfehlt.join(', '));
  const routen: string[] = [];
  for (const id of soll) {
    const v = await s.evaluate(async (id: string) => {
      Produktwelten.lernen('heute');
      await new Promise(r => setTimeout(r, 300));
      history.replaceState(null, '', '#welt-lernen-' + id);
      Produktwelten.routeOeffnen();
      await new Promise(r => setTimeout(r, 500));
      return document.querySelector<HTMLElement>('.lernwelt')?.dataset['lwView'];
    }, id);
    if (v !== id) routen.push(id + ' → ' + v);
  }
  p('§4c #welt-lernen-<id> öffnet jede der zwölf', routen.length === 0, routen.join(', '));
  await ctx.close();
}

/* ══ §5 Wo man ist, steht da ══════════════════════════════════════════════ */
console.log('\n§5 Der Hauptteil sagt, wo man ist');
{
  const { ctx, s } = await oeffnen();
  await s.evaluate(BESTAND);
  await ansicht(s, 'lernen');
  if (await s.$('[data-lw-klappe="uebersicht"]')) {
    await s.click('[data-lw-klappe="uebersicht"]');
    await warte(s, 300);
    await s.click('.menu [data-wahl="trainer"]').catch(() => {});
    await warte(s, 800);
  }
  const m = await s.evaluate(() => {
    const haupt = [...document.querySelectorAll<HTMLElement>('.lw-nav > button[data-lw-nav]')];
    return {
      sicht: document.querySelector<HTMLElement>('.lernwelt')?.dataset['lwView'],
      haupt: haupt.map(b => ({ nav: b.dataset['lwNav'], text: (b.textContent || '').trim(), aktuell: b.getAttribute('aria-current') }))
    };
  });
  const trainer = m.haupt.find(h => h.nav === 'trainer');
  p('§5a nach „Trainer" heisst der Hauptteil „Trainer" und ist aktuell', m.sicht === 'trainer' && trainer?.text === 'Trainer' &&
    trainer.aktuell === 'page', JSON.stringify(m));
  p('§5b und der andere Hauptteil heisst weiter „Heute"', m.haupt.some(h => h.text === 'Heute' && h.aktuell !== 'page'),
    JSON.stringify(m.haupt));
  if (await s.$('[data-lw-klappe="uebersicht"]')) {
    await s.click('[data-lw-klappe="uebersicht"]');
    await warte(s, 300);
    const haken = await s.evaluate(() => {
      const b = document.querySelector<HTMLElement>('.menu [data-wahl="trainer"]');
      return b ? { checked: b.getAttribute('aria-checked'), haken: /✓/.test(b.textContent || '') } : null;
    });
    p('§5c im Menü ist „Trainer" angehakt (✓, aria-checked="true")', haken?.checked === 'true' && haken.haken, JSON.stringify(haken));
    await zu(s);
  } else p('§5c „Übersicht ^" fehlt', false);
  await ctx.close();
}

/* ══ §6 Fächer ════════════════════════════════════════════════════════════ */
console.log('\n§6 Fächer statt Bereich');
const ZAHLEN = () => {
  const zahl = (wort: string): number => {
    const k = [...document.querySelectorAll<HTMLElement>('.lw-learning .lw-metrik')]
      .find(x => new RegExp('^' + wort + '$').test(([...x.querySelectorAll('span')].map(s => (s.textContent || '').trim())
        .find(t => new RegExp('^' + wort + '$').test(t))) || ''));
    const t = (k?.textContent || '').match(/\d+/);
    return t ? Number(t[0]) : -1;
  };
  const arten = [...document.querySelectorAll<HTMLElement>('.lw-learning .lw-section')]
    .find(x => /Kartenarten/.test(x.textContent || ''));
  const gesamt = Number(((arten?.textContent || '').match(/(\d+) Karten mit Quellen/) || [])[1] ?? -1);
  return {
    fehler: zahl('fällige Fehler'), karten: zahl('fällige Karten'), neu: zahl('neue Karten'), gesamt,
    themen: [...document.querySelectorAll<HTMLElement>('.lw-learning [data-lw-topic] strong')].map(x => (x.textContent || '').trim()),
    chip: (document.querySelector<HTMLElement>('[data-lw-klappe="faecher"]')?.textContent || '').trim(),
    chipName: document.querySelector<HTMLElement>('[data-lw-klappe="faecher"]')?.getAttribute('aria-label') || ''
  };
};
const THEMA = (label: string) => {
  const t = Learning.topicProgress().find((x: any) => x.label === label);
  return t ? { total: t.total, due: t.due, errors: t.errors } : null;
};
{
  const { ctx, s } = await oeffnen();
  await s.evaluate(BESTAND);
  await ansicht(s, 'lernen');
  const vorher = await s.evaluate(ZAHLEN);
  console.log('    vorher ' + JSON.stringify(vorher));
  p('§6a der Chip sagt „Alle Fächer"', /Alle Fächer/.test(vorher.chip), JSON.stringify(vorher.chip));
  let menue: any = null;
  if (await s.$('[data-lw-klappe="faecher"]')) {
    await s.click('[data-lw-klappe="faecher"]');
    await warte(s, 300);
    menue = await s.evaluate(KLAPPE, 'faecher');
  }
  const namen: string[] = menue?.namen ?? [];
  console.log('    Fächermenü ' + JSON.stringify(namen));
  p('§6b das Menü nennt „Alle Fächer", die Themen der Karten und die Zeilen der Fächer-Datenbank',
    ['Alle Fächer', 'Elektrotechnik', 'Geometrie — Kap. 4', 'Mathematik', 'Deutsch'].every(n => namen.includes(n)), JSON.stringify(namen));
  p('§6c jedes Fach steht genau einmal (Elektrotechnik ist Thema UND Zeile)',
    namen.filter(n => n === 'Elektrotechnik').length === 1 && new Set(namen).size === namen.length, JSON.stringify(namen));
  p('§6d ohne Lebensbereiche keine Gruppe „Lebensbereich"', !!menue && !menue.gruppen.includes('Lebensbereich'),
    JSON.stringify(menue?.gruppen));
  const etId = menue ? (menue.ids as string[])[namen.indexOf('Elektrotechnik')] : '';
  if (etId) { await s.click(`.menu [data-wahl="${etId}"]`); await warte(s, 900); }
  const et = await s.evaluate(ZAHLEN);
  const soll = await s.evaluate(THEMA, 'Elektrotechnik');
  console.log('    Elektrotechnik ' + JSON.stringify(et) + ' · topicProgress ' + JSON.stringify(soll));
  p('§6e „Elektrotechnik": fällige Fehler + fällige Karten = topicProgress.due',
    !!soll && et.fehler + et.karten === soll.due, `${et.fehler} + ${et.karten} gegen ${soll?.due}`);
  p('§6f … und „Karten mit Quellen" = topicProgress.total', !!soll && et.gesamt === soll.total, `${et.gesamt} gegen ${soll?.total}`);
  p('§6g … und die Zahlen sind nicht mehr die ungefilterten', et.fehler !== vorher.fehler || et.karten !== vorher.karten,
    `vorher ${vorher.fehler}/${vorher.karten}, jetzt ${et.fehler}/${et.karten}`);
  p('§6h „Themen & Fächer" zeigt nur noch Elektrotechnik', JSON.stringify(et.themen) === '["Elektrotechnik"]', JSON.stringify(et.themen));
  p('§6i der Chip sagt „Elektrotechnik" und hält den Fokus', /Elektrotechnik/.test(et.chip) &&
    await s.evaluate(() => document.activeElement?.matches('[data-lw-klappe="faecher"]') ?? false), JSON.stringify(et.chip));
  const pruef = await s.evaluate(() => Lernwelt.modelle.pruefungen().map((x: any) => x.titel));
  p('§6j die Prüfungen sind nur die des Fachs', JSON.stringify(pruef) === '["ET Klausur"]', JSON.stringify(pruef));
  await s.reload();
  await s.waitForFunction(() => typeof App !== 'undefined' && typeof Store !== 'undefined' &&
    (document.getElementById('tree')?.children.length || 0) > 0, null, { timeout: 30000 });
  await s.evaluate(() => document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung,#rg-neu').forEach(el => el.remove()));
  await ansicht(s, 'lernen');
  const nachLaden = await s.evaluate(ZAHLEN);
  p('§6k nach dem Neuladen: Chip und Zahlen stehen noch so', /Elektrotechnik/.test(nachLaden.chip) &&
    nachLaden.fehler === et.fehler && nachLaden.karten === et.karten && nachLaden.gesamt === et.gesamt, JSON.stringify(nachLaden));
  p('§6l gemerkt unter lernwelt:<aktor>:fach', await s.evaluate(() =>
    Object.keys(Store.cache.meta).some(k => /^lernwelt:.*:fach$/.test(k) && Store.cache.meta[k] === 'elektrotechnik')));
  if (await s.$('[data-lw-klappe="faecher"]')) {
    await s.click('[data-lw-klappe="faecher"]');
    await warte(s, 300);
    await s.click('.menu [data-wahl="fach:"]').catch(() => {});
    await warte(s, 800);
  }
  const zurueck = await s.evaluate(ZAHLEN);
  p('§6m „Alle Fächer" bringt die ungefilterten Zahlen zurück', zurueck.fehler === vorher.fehler &&
    zurueck.karten === vorher.karten && /Alle Fächer/.test(zurueck.chip), JSON.stringify(zurueck));
  const thema = await s.evaluate(async () => {
    const b = [...document.querySelectorAll<HTMLElement>('.lw-learning [data-lw-topic]')]
      .find(x => /Geometrie/.test(x.textContent || ''));
    b?.click();
    await new Promise(r => setTimeout(r, 900));
    return true;
  });
  const geo = await s.evaluate(ZAHLEN);
  const geoSoll = await s.evaluate(THEMA, 'Geometrie — Kap. 4');
  p('§6n ein Klick in „Themen & Fächer" setzt denselben Filter (Chip und Zahlen)', thema && /Geometrie/.test(geo.chip) &&
    !!geoSoll && geo.fehler + geo.karten === geoSoll.due && geo.gesamt === geoSoll.total,
    JSON.stringify({ geo, geoSoll }));
  await ctx.close();
}

/* §6o AM TELEFON MIT GEWÄHLTEM FACH. Der Chip darf die Zeile nicht sprengen:
   im ersten Bau zeigte er „Elektrotec…" in 112 px, und die Hauptteile
   schrumpften zu „He…" und „Üb…" (Bild, §55.1). Gemessen wird, dass die
   Leiste nicht rollt, kein Hauptteil abgeschnitten ist und der Chip sagt,
   DASS er filtert — als Form, nicht nur als Farbe (§38). */
{
  const { ctx, s } = await oeffnen({ handy: true });
  await s.evaluate(BESTAND);
  await ansicht(s, 'lernen');
  if (await s.$('[data-lw-klappe="faecher"]')) {
    await s.tap('[data-lw-klappe="faecher"]');
    await warte(s, 600);
    const b = await s.$('.menu [data-wahl="fach:elektrotechnik"]');
    if (b) await b.tap();
    await warte(s, 900);
  }
  const m = await s.evaluate(() => {
    const nav = document.querySelector<HTMLElement>('.lw-nav');
    const chip = document.querySelector<HTMLElement>('[data-lw-klappe="faecher"]');
    const svg = chip?.querySelector('svg');
    return {
      rollt: nav ? { sw: nav.scrollWidth, cw: nav.clientWidth } : null,
      gekuerzt: [...document.querySelectorAll<HTMLElement>('.lw-nav > [data-lw-nav] > span:last-child')]
        .filter(x => x.scrollWidth > x.clientWidth + 1).map(x => x.textContent),
      name: chip?.getAttribute('aria-label') || '',
      gefuellt: svg ? getComputedStyle(svg).fill : '',
      alle: chip?.parentElement?.getAttribute('data-alle')
    };
  });
  p('§6o Telefon, Fach gewählt: die Leiste rollt nicht, kein Hauptteil ist gekürzt', !!m.rollt &&
    m.rollt.sw <= m.rollt.cw + 1 && m.gekuerzt.length === 0, JSON.stringify(m));
  p('§6p … und der Chip sagt es: Name im aria-label, das Zeichen gefüllt statt umrissen', /Elektrotechnik/.test(m.name) &&
    m.alle === 'nein' && !!m.gefuellt && m.gefuellt !== 'none', JSON.stringify(m));
  await ctx.close();
}

/* §6q EINE THEMENRUNDE IST KEIN FILTER. Seit E726 ist `zustand.themaId` der
   Fächerfilter; der Lernpfad setzte ihn weiter, um seine Themenrunde zu
   starten — und schrieb ihn sogar ins Gedächtnis. Gemessen in der
   Durchsicht: ein Klick auf eine Stufe, und der Lernpfad schrumpfte von 3
   auf 1 Stufe, „Heute" von 16 auf 6 Karten, auch nach dem Neuladen. Die
   Überschrift „Jedes Thema ist erreichbar" stimmte nicht mehr, und unter
   471 px sagte es nur ein gefülltes Zeichen. Den Filter setzen der Chip
   und „Themen & Fächer" (§6n) — eine Runde zu starten ist keine Wahl. */
{
  const { ctx, s } = await oeffnen();
  await s.evaluate(BESTAND);
  const zaehlen = async () => {
    await ansicht(s, 'lernweg');
    const stufen = await s.evaluate(() => document.querySelectorAll('[data-lw-path-topic]').length);
    await ansicht(s, 'heute');
    const heute = await s.evaluate(() => (document.querySelector('.lernwelt')?.textContent || '').match(/(\d+) Karten? für heute/)?.[1] ?? '?');
    const chip = await s.evaluate(() => (document.querySelector<HTMLElement>('[data-lw-klappe="faecher"]')?.textContent || '').trim());
    const fach = await s.evaluate(() => Object.keys(Store.cache.meta).filter(k => /^lernwelt:.*:fach$/.test(k))
      .map(k => Store.cache.meta[k]).filter(Boolean));
    return { stufen, heute, chip, fach };
  };
  const vorher = await zaehlen();
  await ansicht(s, 'lernweg');
  const runde = await s.evaluate(async () => {
    const b = [...document.querySelectorAll<HTMLElement>('[data-lw-path-topic]')].find(x => /Elektrotechnik/.test(x.textContent || ''));
    b?.click();
    await new Promise(r => setTimeout(r, 900));
    const kopf = document.querySelector<HTMLElement>('.lw-training .lw-session-head');
    return { geklickt: !!b, titel: (kopf?.querySelector('p')?.textContent || '').trim(),
      karten: (kopf?.querySelector('h2')?.textContent || '').trim() };
  });
  const soll = await s.evaluate(THEMA, 'Elektrotechnik');
  p('§6q-1 eine Stufe im Lernpfad startet weiter die Themenrunde (nur dieses Thema)', runde.geklickt &&
    runde.titel === 'Thema: Elektrotechnik' && !!soll && runde.karten === 'Karte 1 von ' + soll.total,
    JSON.stringify({ runde, soll }));
  const nachher = await zaehlen();
  p('§6q-2 … und filtert danach nichts: Lernpfad, „Heute", Chip und Gedächtnis wie vorher',
    nachher.stufen === vorher.stufen && nachher.heute === vorher.heute && /Alle Fächer/.test(nachher.chip) &&
    nachher.fach.length === 0, JSON.stringify({ vorher, nachher }));
  await ctx.close();
}

/* ══ §7 Der Lebensbereich lebt im Fächermenü ══════════════════════════════ */
console.log('\n§7 Lebensbereich als zweite Gruppe');
{
  const { ctx, s } = await oeffnen();
  await s.evaluate(BESTAND);
  await s.evaluate(() => { (window as any).Lebensbereiche.anlegen({ name: 'Schule', art: 'schule' }); });
  await ansicht(s, 'lernen');
  let menue: any = null;
  if (await s.$('[data-lw-klappe="faecher"]')) {
    await s.click('[data-lw-klappe="faecher"]');
    await warte(s, 300);
    menue = await s.evaluate(KLAPPE, 'faecher');
  }
  p('§7a mit einem Lebensbereich steht die Gruppe „Lebensbereich" im Menü', !!menue && menue.gruppen.includes('Lebensbereich'),
    JSON.stringify(menue?.gruppen));
  const sid = menue ? (menue.ids as string[]).find(i => /^bereich:bereich-schule/.test(i)) : '';
  if (sid) { await s.click(`.menu [data-wahl="${sid}"]`); await warte(s, 900); }
  const stand = await s.evaluate(() => {
    const k = Object.keys(Store.cache.meta).find(x => /^lernwelt:.*:bereich$/.test(x));
    return { bereich: k ? Store.cache.meta[k] : null,
      chip: document.querySelector<HTMLElement>('[data-lw-klappe="faecher"]')?.getAttribute('aria-label') || '' };
  });
  p('§7b eine Wahl setzt den Bereich wie früher (meta „bereich")', /^bereich-schule/.test(String(stand.bereich)), JSON.stringify(stand));
  p('§7c und der Chip nennt ihn', /Schule/.test(stand.chip), JSON.stringify(stand.chip));
  await ctx.close();
}

/* ══ §8 Ohne Bewegung ═════════════════════════════════════════════════════ */
console.log('\n§8 Das ^ dreht sich nur mit Bewegung');
const DREHUNG = async (s: Page) => {
  if (!(await s.$('[data-lw-klappe="uebersicht"]'))) return null;
  const ruhe = await s.evaluate(() => {
    const z = document.querySelector<HTMLElement>('[data-lw-klappe="uebersicht"] > [data-sym]');
    return z ? getComputedStyle(z).transitionDuration : null;
  });
  await s.click('[data-lw-klappe="uebersicht"]');
  await warte(s, 400);
  const offen = await s.evaluate(() => {
    const z = document.querySelector<HTMLElement>('[data-lw-klappe="uebersicht"] > [data-sym]');
    return z ? getComputedStyle(z).transform : null;
  });
  await zu(s);
  return { ruhe, offen };
};
const dauer = (d: string | null | undefined) => Math.max(0, ...String(d ?? '').split(',').map(x => parseFloat(x) || 0));
{
  const { ctx, s } = await oeffnen();
  await ansicht(s, 'lernen');
  const mit = await DREHUNG(s);
  p('§8a mit Bewegung hat das ^ einen Übergang (sonst wäre §8b blind)', dauer(mit?.ruhe) > 0, JSON.stringify(mit));
  p('§8b offen ist es gedreht', !!mit?.offen && mit.offen !== 'none', JSON.stringify(mit));
  await s.evaluate(() => { document.body.dataset['bewegung'] = 'ruhig'; });
  const ruhig = await DREHUNG(s);
  p('§8c body[data-bewegung="ruhig"]: kein Übergang, und offen trotzdem gedreht', !!ruhig && dauer(ruhig.ruhe) === 0 &&
    !!ruhig.offen && ruhig.offen !== 'none', JSON.stringify(ruhig));
  await ctx.close();
}
{
  const { ctx, s } = await oeffnen({ weniger: true });
  await ansicht(s, 'lernen');
  const weniger = await DREHUNG(s);
  p('§8d „weniger Bewegung": kein Übergang, und offen trotzdem gedreht', !!weniger && dauer(weniger.ruhe) === 0 &&
    !!weniger.offen && weniger.offen !== 'none', JSON.stringify(weniger));
  await ctx.close();
}

/* ══ §9 In allen zehn Schemata ════════════════════════════════════════════ */
console.log('\n§9 In allen zehn Schemata lesbar — in Ruhe');
const SCHEMATA = ['standard', 'hell', 'nacht', 'wald', 'sand', 'papier', 'kontrast', 'rose', 'touchkit-hell', 'touchkit-dunkel'];
const FARBE = `(() => {
  window.__rgb = (s) => { const m = String(s).match(/rgba?\\(([^)]+)\\)/); if (m) { const q = m[1].split(/[ ,/]+/).filter(Boolean).map(Number);
    return { r: q[0], g: q[1], b: q[2], a: q[3] ?? 1 }; }
    const c = String(s).match(/color\\(srgb ([^)]+)\\)/); if (!c) return null;
    const q = c[1].split(/[ /]+/).filter(Boolean).map(Number); return { r: q[0] * 255, g: q[1] * 255, b: q[2] * 255, a: q[3] ?? 1 }; };
  window.__ueber = (o, u) => ({ r: o.r * o.a + u.r * (1 - o.a), g: o.g * o.a + u.g * (1 - o.a), b: o.b * o.a + u.b * (1 - o.a), a: 1 });
  window.__lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  window.__kontrast = (a, b) => { const x = window.__lum(a), y = window.__lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  window.__grund = (el) => { const sch = [];
    for (let e = el; e; e = e.parentElement) { const c = window.__rgb(getComputedStyle(e).backgroundColor);
      if (c && c.a > 0) { sch.push(c); if (c.a >= 1) break; } }
    let g = { r: 255, g: 255, b: 255, a: 1 }; for (const c of sch.reverse()) g = window.__ueber(c, g); return g; };
  window.__deckung = (el) => { let o = 1; for (let e = el; e; e = e.parentElement) o *= Number(getComputedStyle(e).opacity); return o; };
  window.__lesbar = (el, farbquelle) => { const f = window.__rgb(getComputedStyle(farbquelle || el).color); if (!f) return 0;
    const g = window.__grund(el); const d = window.__deckung(farbquelle || el);
    return window.__kontrast(window.__ueber({ ...f, a: f.a * d }, g), g); };
})()`;
{
  const { ctx, s } = await oeffnen();
  await s.evaluate(BESTAND);
  await s.evaluate(FARBE);
  const zuSchwach: string[] = [];
  for (const schema of SCHEMATA) {
    await s.evaluate(async (sch: string) => { Aussehen.setzen({ schema: sch } as never);
      Produktwelten.lernen('lernen'); await new Promise(r => setTimeout(r, 700)); }, schema);
    await s.mouse.move(2, 2); await warte(s, 120);
    const m = await s.evaluate(() => {
      const w = window as any;
      const haupt = [...document.querySelectorAll<HTMLElement>('.lw-nav > button[data-lw-nav]')]
        .map(b => +w.__lesbar(b, b.querySelector('span:last-child') || b).toFixed(2));
      const klappen = [...document.querySelectorAll<HTMLElement>('.lw-nav > [data-lw-klappe]')]
        .map(k => { const z = k.querySelector<HTMLElement>('[data-sym]'); return z ? +w.__lesbar(k, z).toFixed(2) : 0; });
      const chip = document.querySelector<HTMLElement>('[data-lw-klappe="faecher"]');
      const chipText = chip ? +w.__lesbar(chip, chip.querySelector('.lw-fach-name') || chip).toFixed(2) : 0;
      return { haupt, klappen, chipText };
    });
    const schwach = [...m.haupt.filter(x => x < 4.5).map(x => 'Hauptteil ' + x), ...m.klappen.filter(x => x < 3).map(x => '^ ' + x),
      ...(m.chipText < 4.5 ? ['Chip ' + m.chipText] : [])];
    if (!m.haupt.length || !m.klappen.length) schwach.push('Kopf fehlt');
    if (schwach.length) zuSchwach.push(schema + ': ' + schwach.join(', '));
    console.log(`    ${schema}: ${JSON.stringify(m)}`);
  }
  p('§9 Hauptteile und Chip ≥ 4,5 : 1, das ^ ≥ 3 : 1 — in allen zehn Schemata', zuSchwach.length === 0, zuSchwach.join(' | '));
  await ctx.close();
}

/* ══ §10 Auch ohne Server ═════════════════════════════════════════════════ */
console.log('\n§10 Doppelklick und Einzeldatei');
for (const [name, datei] of [['index.html über file://', 'index.html'], ['redion-einzeldatei.html', 'redion-einzeldatei.html']] as const) {
  const { ctx, s } = await oeffnen({ url: 'file://' + path.join(WURZEL, datei) });
  await ansicht(s, 'lernen');
  const m = await s.evaluate(() => ({
    klappen: document.querySelectorAll('[data-lw-klappe]').length,
    subnav: !!document.querySelector('.lw-subnav'),
    chevron: !!document.querySelector('[data-lw-klappe="heute"] svg')
  }));
  p(`§10 ${name}: drei ^ mit gezeichnetem Zeichen, keine zweite Reihe`, m.klappen === 3 && !m.subnav && m.chevron, JSON.stringify(m));
  await ctx.close();
}

await browser.close();
server.close();
const eigene = fehler.filter(f => !/ResizeObserver loop/.test(f));
p('Keine Seitenfehler', eigene.length === 0, eigene.slice(0, 3).join(' | '));
console.log(`\n${ok} von ${ok + weg} — Suite 601 (E726: der Kopf des Lernzentrums in einer Zeile)`);
process.exit(weg ? 1 : 0);
