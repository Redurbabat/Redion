/* ============================================================================
 * test589 — Tropfen, Linse und Kacheln aus dem Liquid-Glass-Video (E712)
 * ----------------------------------------------------------------------------
 * Redur, 27. September 2026, ca. 22:05 UTC, zu einem Video „LIQUID GLASS":
 * „Schau mal das auch an ich will das auch haben". Und ca. 22:10 UTC:
 * „… ohne eine funktione löschen bessere ordnungen bessere übergagnge
 * besssere efeckten , bessere oberfläsche …".
 *
 * Drei Szenen des Videos, in Redions eigenem TypeScript und CSS (R1: kein
 * React beim Start), mit den Federn aus E702 und dem Material aus E706:
 *
 *   01 MORPH    Das „+" (Neu erstellen) und das „⋯" der Seite fliessen wie
 *               ein Tropfen in ihr Menü; das Menü WÄCHST AUS DEM KNOPF (am
 *               Rechner stand das „+"-Menü bis hierher oben links in der
 *               Ecke, weit weg vom Knopf). Oben teilen sich drei runde
 *               Glasknöpfe ab — und JEDER bisherige Eintrag steht darunter,
 *               am selben Auslöser, ohne Zwischenschritt (§43).
 *   03 REFRACT  Die Linse gleitet einmal über „Aufmachen. / Weiterdenken.",
 *               mit der Brechung aus linse.ts (keine dritte).
 *   04 CONTROL  Glaskacheln oben in „Mehr" (Telefon) und in der Übersicht
 *               der Einstellungen (Rechner): Dunkel, Fokus-Modus, Ruhige
 *               Darstellung, Hoher Kontrast, Zeitmesser, Schriftgrösse und
 *               Zeilenabstand — dieselben Griffe wie bisher, die Auswahl-
 *               felder in „Allgemein" bleiben, wo sie sind.
 *
 * WAS DIESER LAUF HÄLT
 *   §1  Das „+" am Rechner: das Menü steht AM Knopf, nicht in der Ecke.
 *   §2  Drei runde Knöpfe oben (PDF einlesen · Neue Seite · Notizbuch), je
 *       44 px; darunter alle Wege des Katalogs, keiner fehlt; ein runder
 *       Knopf tut genau, was sein Eintrag tut.
 *   §3  EIN Tropfenfilter im Dokument, nur während des Fliessens an — in
 *       Ruhe trägt kein Element ihn. Bewegt werden nur transform/opacity.
 *   §4  Zu: das Menü ist sofort weg (Escape, E302), und der Tropfen fliesst
 *       sichtbar in den Knopf zurück — und ist danach auch weg.
 *   §5  Das „⋯" der Seite: Präsentieren · Merkzeichen · Teilen und ausgeben;
 *       alle bisherigen Einträge bleiben; das Merkzeichen füllt sich an Ort
 *       und Stelle; Präsentieren geht denselben Weg wie sein Eintrag.
 *   §6  Am Telefon: das Blatt trägt dieselben drei Knöpfe unter dem Titel.
 *   §7  Ruhig und „weniger Bewegung": kein Tropfen, kein Fliessen, sofort.
 *   §8  Die Linse über „Heute": einmal beim Ankommen, dann Stillstand; die
 *       Schrift bleibt echte Schrift; EINE Brechung im Dokument.
 *   §9  Die Kacheln in „Mehr" (Telefon): sieben Griffe, 44 px, jeder tut,
 *       was sein bisheriger Ort tut; beim Rollen eine Chipleiste.
 *   §10 Die Kacheln in den Einstellungen (Rechner): oben in „Allgemein",
 *       die alten Felder darunter, beide zeigen denselben Stand.
 *   §11 Kein Seitenfehler.
 *
 * KANN ER ROT WERDEN? Gegen den Stand b3cf1933 (vor E712) ist er rot, in
 * jedem Abschnitt ausser den „bleibt"-Zusagen — siehe Commit „test589 (rot)".
 *
 *   node pruefungen/alle.mts 589
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
/* Ein freier Port vom System (test400) — kein fester. */
await new Promise<void>(f => { server.listen(0, '127.0.0.1', () => f()); });
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

const oeffnen = async (handy: boolean, weniger = false): Promise<{ ctx: BrowserContext; s: Page }> => {
  const ctx = await browser.newContext({
    viewport: handy ? { width: 390, height: 844 } : { width: 1440, height: 900 },
    ...(handy ? { isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : {}),
    reducedMotion: weniger ? 'reduce' : 'no-preference'
  });
  const s = await ctx.newPage();
  s.on('pageerror', e => fehler.push(e.message));
  await s.goto(`http://127.0.0.1:${PORT}/index.html`);
  await s.waitForFunction(() => typeof App !== 'undefined' && typeof Store !== 'undefined' &&
    (document.getElementById('tree')?.children.length || 0) > 0, null, { timeout: 30000 });
  await s.evaluate(() => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung')
      .forEach(el => el.remove());
    App.theme('dark');
  });
  await s.mouse.move(2, 2);
  return { ctx, s };
};

const aufraeumen = (s: Page) => s.evaluate(() =>
  document.querySelectorAll('.overlay, .menu, .menu-grund, #r-blatt').forEach(x => x.remove()));

/** Eine Seite anlegen und öffnen — für das „⋯". */
const seiteAuf = (s: Page) => s.evaluate(async () => {
  const neu = Store.addPage(null, { text: 'Wärmepumpe — Notizen' });
  Store.addBlock(neu.id, 'text', { text: 'Vorlauftemperatur und Spreizung.' });
  await Store.flush();
  App.oeffne(neu.id);
  await new Promise(r => setTimeout(r, 600));
  return neu.id as string;
});

/* Was IN der Seite gemessen wird, als Zeichenkette — in jedem evaluate gleich. */
const MESSEN = `
  window.__kopf = () => [...document.querySelectorAll('.menu .ru-tropfen-kopf .ru-tropfen-knopf')]
    .map(b => (b.querySelector('.ru-tropfen-name')?.textContent || '').trim());
  window.__tropfenTraeger = () => [...document.querySelectorAll('*')]
    .filter(el => /ru-linse-tropfen/.test(getComputedStyle(el).filter || '')).length;
  window.__nurTransform = () => {
    const erlaubt = new Set(['offset', 'easing', 'composite', 'computedOffset', 'transform', 'opacity', 'scale']);
    const falsch = [];
    for (const a of document.getAnimations()) {
      const e = a.effect;
      if (!e || typeof e.getKeyframes !== 'function') continue;
      /* Nur, was dieser Bogen bewegt: Menü, Bühne, Linse und Satz. */
      const t = e.target;
      if (!t || !t.closest || !t.closest('.menu, .ru-tropfen-buehne, .lw-desk')) continue;
      for (const k of e.getKeyframes()) for (const n of Object.keys(k))
        if (!erlaubt.has(n)) falsch.push(n + ' @ ' + ((e.target && e.target.className) || '?'));
    }
    return [...new Set(falsch)];
  };
`;

/* ==========================================================================
 * §1–§4 · Das „+" am Rechner
 * ========================================================================*/
{
  const { ctx, s } = await oeffnen(false);
  await s.evaluate(MESSEN);
  await seiteAuf(s);

  console.log('\n§1 · Das „+" am Rechner: das Menü wächst aus dem Knopf');
  await s.click('#studio-create');
  const frueh = await s.evaluate(() => ({
    buehne: !!document.querySelector('.ru-tropfen-buehne'),
    traeger: (window as any).__tropfenTraeger(),
    nurTransform: (window as any).__nurTransform()
  }));
  await warte(s, 1300);
  const lage = await s.evaluate(() => {
    const k = document.getElementById('studio-create')!.getBoundingClientRect();
    const m = document.querySelector<HTMLElement>('.menu:not(.blatt)')?.getBoundingClientRect();
    return m ? { k: { l: k.left, r: k.right, t: k.top, b: k.bottom },
                 m: { l: m.left, r: m.right, t: m.top, b: m.bottom } } : null;
  });
  p('Das „+" öffnet ein Menü', !!lage);
  if (lage) {
    p('… es steht am Knopf und nicht oben links in der Ecke (senkrecht höchstens 14 px Luft)',
      Math.abs(lage.m.t - lage.k.b) <= 14 || Math.abs(lage.k.t - lage.m.b) <= 14,
      JSON.stringify(lage));
    p('… und waagrecht über dem Knopf (die Kanten überdecken sich)',
      lage.m.r >= lage.k.l && lage.m.l <= lage.k.r, JSON.stringify(lage));
  }

  console.log('\n§2 · Drei runde Knöpfe oben, darunter jeder Weg');
  gleich('Oben: PDF einlesen · Neue Seite · Notizbuch', await s.evaluate(() => (window as any).__kopf()),
    ['PDF einlesen', 'Neue Seite', 'Notizbuch']);
  const kopf = await s.evaluate(() => {
    const m = document.querySelector('.menu')!;
    const k = m.querySelector('.ru-tropfen-kopf');
    const runde = [...m.querySelectorAll<HTMLElement>('.ru-tropfen-kopf .ru-tropfen-rund')]
      .map(r => { const q = r.getBoundingClientRect(); return [Math.round(q.width), Math.round(q.height)]; });
    const namen = [...m.querySelectorAll<HTMLElement>('.ru-tropfen-knopf')].map(b => b.getAttribute('aria-label'));
    const liste = m.querySelector('.menu-liste');
    return {
      zuerst: !!k && !!liste && !!(k.compareDocumentPosition(liste) & Node.DOCUMENT_POSITION_FOLLOWING),
      runde, namen,
      wege: [...m.querySelectorAll<HTMLElement>('.menu-liste [data-neu]')].map(b => b.dataset['neu']),
      katalog: App.erstellenWege().map((w: any) => w.id),
      ohneDataNeu: m.querySelectorAll('.ru-tropfen-kopf [data-neu]').length
    };
  });
  p('Die Knöpfe stehen VOR der Liste, im selben Menü', kopf.zuerst);
  p('Jeder runde Knopf misst mindestens 44 × 44 px (§37)',
    kopf.runde.length === 3 && kopf.runde.every(([b, h]) => b! >= 44 && h! >= 44), JSON.stringify(kopf.runde));
  p('Jeder hat einen Namen für Vorleser (§38)', kopf.namen.every(n => !!n && n.length > 3), JSON.stringify(kopf.namen));
  gleich('Darunter JEDER Weg des Katalogs, in derselben Folge (§43)', kopf.wege, kopf.katalog);
  gleich('Die runden Knöpfe zählen nicht als zweiter Weg (kein data-neu)', kopf.ohneDataNeu, 0);

  console.log('\n§3 · Ein Tropfenfilter, nur während des Fliessens');
  p('Beim Öffnen fliesst ein Tropfen (die Bühne steht)', frueh.buehne);
  p('… und genau dann trägt eine Fläche den Tropfenfilter', frueh.traeger >= 1, String(frueh.traeger));
  gleich('… bewegt wird nur transform und opacity', frueh.nurTransform, []);
  const ruhe = await s.evaluate(() => ({
    buehne: document.querySelectorAll('.ru-tropfen-buehne').length,
    traeger: (window as any).__tropfenTraeger(),
    filter: document.querySelectorAll('filter#ru-linse-tropfen').length
  }));
  gleich('In Ruhe: keine Bühne mehr', ruhe.buehne, 0);
  gleich('In Ruhe: KEIN Element trägt den Tropfenfilter', ruhe.traeger, 0);
  gleich('Der Filter steht genau einmal im Dokument', ruhe.filter, 1);

  console.log('\n§4 · Zu: sofort weg, und der Tropfen fliesst zurück');
  await s.keyboard.press('Escape');
  const zu = await s.evaluate(() => ({
    menue: document.querySelectorAll('.menu').length,
    zurueck: !!document.querySelector('.ru-tropfen-buehne')
  }));
  gleich('Escape nimmt das Menü sofort (E302)', zu.menue, 0);
  p('… und der Tropfen fliesst sichtbar in den Knopf zurück', zu.zurueck);
  await warte(s, 1200);
  gleich('… danach ist auch er weg', await s.evaluate(() => document.querySelectorAll('.ru-tropfen-buehne').length), 0);

  /* Zweimal auf, zweimal zu — der Filter bleibt einer. */
  for (let i = 0; i < 2; i++) {
    await s.click('#studio-create'); await warte(s, 700);
    await s.keyboard.press('Escape'); await warte(s, 700);
  }
  gleich('Nach dreimal Auf und Zu: weiter genau EIN Filter', await s.evaluate(() =>
    document.querySelectorAll('filter#ru-linse-tropfen').length), 1);

  /* Der runde Knopf „Neue Seite" tut, was der Eintrag „Neue Seite" tut. */
  const vorher = await s.evaluate(() => Store.rootPages().length);
  await s.click('#studio-create'); await warte(s, 700);
  await s.evaluate(() => document.querySelector<HTMLElement>('.menu .ru-tropfen-knopf[data-tropfen="seite"]')?.click());
  await warte(s, 800);
  const nachher = await s.evaluate(() => ({ n: Store.rootPages().length, menue: document.querySelectorAll('.menu').length }));
  gleich('„Neue Seite" rund legt eine Seite an wie der Eintrag', nachher.n, vorher + 1);
  gleich('… und das Menü ist zu', nachher.menue, 0);

  /* ======================================================================
   * §5 · Das „⋯" der Seite
   * ====================================================================*/
  console.log('\n§5 · Das „⋯" der Seite');
  await aufraeumen(s);
  const id = await seiteAuf(s);
  await s.click('#btn-page-menu'); await warte(s, 900);
  gleich('Oben: Präsentieren · Merkzeichen · Teilen und ausgeben', await s.evaluate(() => (window as any).__kopf()),
    ['Präsentieren', 'Merkzeichen', 'Teilen und ausgeben']);
  const eintraege = await s.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('.menu .menu-liste [data-a]')].map(b => b.dataset['a']));
  const muss = ['link', 'inhalt', 'dup', 'wz-verschieben', 'archiv', 'del', 'wz-praesi', 'klein', 'breit', 'pfad',
    'anpassen', 'offline', 'wz-gesperrt', 'mitki', 'fav', 'produkt-bereiche', 'rename', 'icon', 'cover', 'pid',
    'komm', 'vorschlag', 'uebersetzen', 'undo', 'export', 'import', 'stat2', 'updates', 'benach', 'verbind', 'papier'];
  const fehlt = muss.filter(a => !eintraege.includes(a));
  gleich('Jeder bisherige Eintrag steht weiter darunter (§43)', fehlt, []);
  const punkte = await s.evaluate(() => {
    const k = document.getElementById('btn-page-menu')!.getBoundingClientRect();
    const m = document.querySelector<HTMLElement>('.menu')!.getBoundingClientRect();
    return { k: [k.left, k.top, k.right, k.bottom], m: [m.left, m.top, m.right, m.bottom] };
  });
  p('Das Menü steht am „⋯" (senkrecht höchstens 14 px Luft)',
    Math.abs(punkte.m[1]! - punkte.k[3]!) <= 14 || Math.abs(punkte.k[1]! - punkte.m[3]!) <= 14, JSON.stringify(punkte));
  const merk = await s.evaluate(async (pid: string) => {
    const b = document.querySelector<HTMLElement>('.menu .ru-tropfen-knopf[data-tropfen="merkzeichen"]');
    const vorher = b?.getAttribute('aria-pressed');
    b?.click();
    await new Promise(r => setTimeout(r, 300));
    const b2 = document.querySelector<HTMLElement>('.menu .ru-tropfen-knopf[data-tropfen="merkzeichen"]');
    return { vorher, nachher: b2?.getAttribute('aria-pressed'), fav: !!Store.getBlock(pid)?.favorite,
             offen: !!document.querySelector('.menu') };
  }, id);
  gleich('Das Merkzeichen füllt sich an Ort und Stelle', [merk.vorher, merk.nachher, merk.fav, merk.offen],
    ['false', 'true', true, true]);
  const praesi = await s.evaluate(async () => {
    const W = (window as any).Werkzeuge;
    const alt = W.seitenMenueAktion;
    let gerufen = '';
    W.seitenMenueAktion = (a: string) => { gerufen = a; return true; };
    document.querySelector<HTMLElement>('.menu .ru-tropfen-knopf[data-tropfen="wz-praesi"]')?.click();
    await new Promise(r => setTimeout(r, 200));
    W.seitenMenueAktion = alt;
    return gerufen;
  });
  gleich('„Präsentieren" rund geht denselben Weg wie sein Eintrag', praesi, 'wz-praesi');
  await aufraeumen(s);
  await ctx.close();
}

/* ==========================================================================
 * §6 · Am Telefon
 * ========================================================================*/
{
  console.log('\n§6 · Am Telefon: dieselben drei Knöpfe im Blatt');
  const { ctx, s } = await oeffnen(true);
  await s.evaluate(MESSEN);
  await s.evaluate(() => App.erstellenBlatt());
  await warte(s, 900);
  const blatt = await s.evaluate(() => {
    const m = document.querySelector('.menu.blatt');
    const titel = m?.querySelector('.blatt-titel');
    const kopf = m?.querySelector('.ru-tropfen-kopf');
    return { da: !!m, nachTitel: !!titel && !!kopf && titel.nextElementSibling === kopf,
             wege: m?.querySelectorAll('.menu-liste [data-neu]').length,
             katalog: App.erstellenWege().length };
  });
  p('Das „+"-Blatt kommt', blatt.da);
  gleich('Drei runde Knöpfe', await s.evaluate(() => (window as any).__kopf()), ['PDF einlesen', 'Neue Seite', 'Notizbuch']);
  p('… direkt unter dem Titel', blatt.nachTitel);
  gleich('… und darunter jeder Weg', blatt.wege, blatt.katalog);
  await aufraeumen(s);
  await ctx.close();
}

/* ==========================================================================
 * §7 · Ruhig und weniger Bewegung
 * ========================================================================*/
for (const [name, weniger] of [['„Ruhige Darstellung"', false], ['prefers-reduced-motion', true]] as const) {
  console.log(`\n§7 · ${name}: kein Tropfen, sofort`);
  const { ctx, s } = await oeffnen(false, weniger);
  await s.evaluate(MESSEN);
  if (!weniger) await s.evaluate(() => Einstellungen.S('bewegung', 'ruhig'));
  await seiteAuf(s);
  await s.click('#studio-create');
  const r = await s.evaluate(() => ({
    buehne: document.querySelectorAll('.ru-tropfen-buehne').length,
    kopf: document.querySelectorAll('.menu .ru-tropfen-kopf .ru-tropfen-knopf').length,
    laeuft: document.getAnimations().filter(a => {
      const t = (a.effect as KeyframeEffect | null)?.target as Element | null;
      return !!t && !!t.closest('.menu') && a.playState === 'running' &&
        ((a.effect as KeyframeEffect).getComputedTiming().duration as number) > 5;
    }).length
  }));
  gleich('Kein Tropfen beim Öffnen', r.buehne, 0);
  gleich('Die drei Knöpfe stehen trotzdem da', r.kopf, 3);
  gleich('Am Menü läuft keine Bewegung', r.laeuft, 0);
  await s.keyboard.press('Escape');
  gleich('Kein Tropfen beim Schliessen', await s.evaluate(() => document.querySelectorAll('.ru-tropfen-buehne').length), 0);
  await ctx.close();
}

/* ==========================================================================
 * §8 · Die Linse über „Heute"
 * ========================================================================*/
{
  console.log('\n§8 · Die Linse gleitet einmal über „Aufmachen. / Weiterdenken."');
  const { ctx, s } = await oeffnen(false);
  await s.evaluate(MESSEN);
  await s.evaluate(() => Produktwelten.lernen('heute'));
  await s.waitForSelector('.lw-desk h2', { timeout: 8000 });
  await warte(s, 150);
  const frueh = await s.evaluate(() => {
    const held = document.querySelector('.lw-desk')!;
    const laeuft = document.getAnimations().filter(a => {
      const t = (a.effect as KeyframeEffect | null)?.target as Element | null;
      return !!t && held.contains(t) && a.playState === 'running';
    });
    return { laeuft: laeuft.length, nurTransform: (window as any).__nurTransform(),
             linse: !!held.querySelector('.ru-held-linse[aria-hidden="true"]') };
  });
  p('Eine Linse liegt über dem Satz (aria-hidden)', frueh.linse);
  p('Beim Ankommen bewegt sie sich', frueh.laeuft > 0, String(frueh.laeuft));
  gleich('… nur transform und opacity', frueh.nurTransform, []);
  await warte(s, 2600);
  const spaeter = await s.evaluate(() => {
    const held = document.querySelector('.lw-desk')!;
    const h2 = held.querySelector('h2')!;
    const laeuft = document.getAnimations().filter(a => {
      const t = (a.effect as KeyframeEffect | null)?.target as Element | null;
      return !!t && held.contains(t) && a.playState === 'running';
    }).length;
    const bruch = [...held.querySelectorAll<HTMLElement>('.ru-held-linse *')]
      .some(el => /ru-linse-fahrt/.test(getComputedStyle(el).filter || ''));
    return { laeuft, text: (h2.textContent || '').replace(/\s+/g, ''),
             displacement: document.querySelectorAll('feDisplacementMap').length, bruch };
  });
  gleich('Danach steht alles still (keine Dauerbewegung)', spaeter.laeuft, 0);
  gleich('Die Überschrift bleibt echte Schrift', spaeter.text, 'Aufmachen.Weiterdenken.');
  p('In Ruhe bricht die Linse mit der Brechung aus linse.ts', spaeter.bruch);
  gleich('EINE Brechung im Dokument (keine dritte)', spaeter.displacement, 1);
  await s.evaluate(() => Einstellungen.S('bewegung', 'ruhig'));
  await s.evaluate(() => Produktwelten.lernen('heute'));
  await warte(s, 400);
  const still = await s.evaluate(() => {
    const held = document.querySelector('.lw-desk');
    return { linse: !!held?.querySelector('.ru-held-linse'),
             laeuft: document.getAnimations().filter(a => {
               const t = (a.effect as KeyframeEffect | null)?.target as Element | null;
               return !!t && !!held && held.contains(t) && a.playState === 'running';
             }).length };
  });
  gleich('Ruhig: die Linse liegt still an ihrem Ort, nichts gleitet', [still.linse, still.laeuft], [true, 0]);
  await ctx.close();
}

/* ==========================================================================
 * §9 · Die Kacheln in „Mehr" (Telefon)
 * ========================================================================*/
const NAMEN = ['Dunkel', 'Fokus-Modus', 'Ruhige Darstellung', 'Hoher Kontrast', 'Zeitmesser', 'Schriftgrösse', 'Zeilenabstand'];
{
  console.log('\n§9 · Die Kacheln in „Mehr"');
  const { ctx, s } = await oeffnen(true);
  await s.evaluate(() => Ansichten.mehr());
  await warte(s, 700);
  const k = await s.evaluate(() => {
    const home = document.querySelector('.home');
    const kacheln = home?.querySelector('.ru-kacheln');
    const erstesH2 = home?.querySelector('h2');
    const alle = [...(kacheln?.querySelectorAll<HTMLElement>('[data-kachel]') || [])];
    return {
      da: !!kacheln,
      vorListe: !!kacheln && !!erstesH2 && !!(kacheln.compareDocumentPosition(erstesH2) & Node.DOCUMENT_POSITION_FOLLOWING),
      namen: alle.map(b => (b.querySelector('.ru-kachel-name')?.textContent || '').trim()),
      klein: alle.filter(b => { const r = b.getBoundingClientRect(); return r.width < 44 || r.height < 44; }).length,
      schalter: alle.filter(b => b.hasAttribute('aria-pressed')).map(b => b.dataset['kachel']),
      regler: alle.filter(b => b.getAttribute('role') === 'slider')
        .map(b => [b.dataset['kachel'], b.getAttribute('aria-valuemin'), b.getAttribute('aria-valuemax'), !!b.getAttribute('aria-valuetext')]),
      wege: [...(home?.querySelectorAll<HTMLElement>('.home-liste [data-a]') || [])].map(b => b.dataset['a'])
    };
  });
  p('Die Kacheln stehen oben in „Mehr", vor der ersten Gruppe', k.da && k.vorListe);
  gleich('Sieben Griffe in dieser Folge', k.namen, NAMEN);
  gleich('Keiner unter 44 px (§37)', k.klein, 0);
  gleich('Vier Schalter mit aria-pressed', k.schalter, ['dunkel', 'fokus', 'ruhig', 'kontrast']);
  gleich('Zwei Regler mit drei Stufen', k.regler,
    [['schrift', '0', '2', true], ['abstand', '0', '2', true]]);
  gleich('Jeder bisherige Weg in „Mehr" bleibt', k.wege,
    ['workspace', 'schublade', 'kompass', 'befehle', 'tasten', 'vorlagen', 'sichern', 'import', 'inbox', 'wolke',
     'papierkorb', 'einstellungen', 'ueber']);

  const tu = async (was: string): Promise<void> => {
    await s.evaluate((w: string) => document.querySelector<HTMLElement>(`.home .ru-kacheln [data-kachel="${w}"]`)?.click(), was);
    await warte(s, 250);
  };
  await tu('dunkel');
  const hell = await s.evaluate(() => [document.documentElement.dataset['theme'],
    document.querySelector('.ru-kacheln [data-kachel="dunkel"]')?.getAttribute('aria-pressed')]);
  gleich('„Dunkel" schaltet wie #studio-theme (hell)', hell, ['light', 'false']);
  await tu('dunkel');
  gleich('… und zurück (dunkel)', await s.evaluate(() => document.documentElement.dataset['theme']), 'dark');
  await tu('fokus');
  gleich('„Fokus-Modus" schaltet body.fokus (Werkzeuge.fokus)', await s.evaluate(() => document.body.classList.contains('fokus')), true);
  await tu('fokus');
  gleich('… und wieder aus', await s.evaluate(() => document.body.classList.contains('fokus')), false);
  await tu('ruhig');
  gleich('„Ruhige Darstellung" setzt S(bewegung)', await s.evaluate(() => [document.body.dataset['bewegung'], Einstellungen.V('bewegung', '')]), ['ruhig', 'ruhig']);
  await tu('ruhig');
  await tu('kontrast');
  const gelb = await s.evaluate(() => {
    const b = document.querySelector<HTMLElement>('.ru-kacheln [data-kachel="kontrast"]');
    /* Ohne Kachel (vor E712) rot, nicht abgebrochen — §10 und §11 sollen weiterlaufen. */
    if (!b) return { kontrast: document.body.dataset['kontrast'], an: null, grund: [] as number[], schrift: [] as number[] };
    const cs = getComputedStyle(b), schicht = getComputedStyle(b, '::before');
    const zahl = (t: string) => (t.match(/[\d.]+/g) || []).map(Number);
    return { kontrast: document.body.dataset['kontrast'], an: b.getAttribute('aria-pressed'),
             grund: +schicht.opacity > 0.95 ? zahl(schicht.backgroundColor) : [], schrift: zahl(cs.color) };
  });
  p('„Hoher Kontrast" setzt S(kontrast)', gelb.kontrast === 'hoch' && gelb.an === 'true', JSON.stringify(gelb));
  p('… gelbe Kachel (die Farbschicht ::before), schwarze Schrift (Redur: „schwarze Schrift auf Gelb")',
    (gelb.grund[0] ?? 0) > 200 && (gelb.grund[1] ?? 0) > 170 && (gelb.grund[2] ?? 255) < 110 &&
    (gelb.schrift[0] ?? 255) < 60 && (gelb.schrift[1] ?? 255) < 60 && (gelb.schrift[2] ?? 255) < 60, JSON.stringify(gelb));
  await tu('kontrast');
  const regler = await s.evaluate(async () => {
    const r = document.querySelector<HTMLElement>('.ru-kacheln [data-kachel="schrift"]');
    const a = document.querySelector<HTMLElement>('.ru-kacheln [data-kachel="abstand"]');
    if (!r || !a) return { gross: [] as (string | null | undefined)[], klein: '', weit: '', normal: '' };
    r.focus();
    r.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await new Promise(f => setTimeout(f, 120));
    const gross = [document.body.dataset['schrift'], r.getAttribute('aria-valuenow')];
    r.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    await new Promise(f => setTimeout(f, 120));
    const klein = document.body.dataset['schrift'];
    r.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    a.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    await new Promise(f => setTimeout(f, 120));
    return { gross, klein, weit: document.body.dataset['dichte'], normal: document.body.dataset['schrift'] };
  });
  gleich('Schriftgrösse: Pfeil rechts → gross', regler.gross, ['gross', '2']);
  gleich('… Pos1 → klein', regler.klein, 'klein');
  gleich('Zeilenabstand: Ende → weit', regler.weit, 'weit');
  await s.evaluate(() => { Einstellungen.S('dichte', 'normal'); Einstellungen.S('schriftgroesse', 'normal'); });
  await tu('zeit');
  gleich('„Zeitmesser" öffnet das Feld (Zeitmesser.panel)', await s.evaluate(() => !!document.querySelector('.zm-feld')), true);
  await s.evaluate(() => document.querySelector('.zm-feld')?.remove());

  const leiste = await s.evaluate(async () => {
    const sc = document.getElementById('scroll')!;
    const l = document.querySelector<HTMLElement>('.ru-kacheln-leiste');
    const vorher = l ? !l.hidden : null;
    sc.scrollTop = sc.scrollHeight;
    sc.dispatchEvent(new Event('scroll'));
    await new Promise(f => setTimeout(f, 700));
    const l2 = document.querySelector<HTMLElement>('.ru-kacheln-leiste');
    const chips = [...(l2?.querySelectorAll<HTMLElement>('[data-kachel]') || [])];
    return { vorher, nachher: l2 ? !l2.hidden : null,
             chips: chips.length, klein: chips.filter(c => c.getBoundingClientRect().height < 44).length };
  });
  gleich('Oben: keine Chipleiste', leiste.vorher, false);
  gleich('Gerollt: die Kacheln werden zur Chipleiste', leiste.nachher, true);
  p('… mit allen sieben Griffen, keiner unter 44 px', leiste.chips === 7 && leiste.klein === 0, JSON.stringify(leiste));
  await ctx.close();
}

/* ==========================================================================
 * §10 · Die Kacheln in den Einstellungen (Rechner)
 * ========================================================================*/
{
  console.log('\n§10 · Die Kacheln oben in „Allgemein", die Felder darunter');
  const { ctx, s } = await oeffnen(false);
  await s.evaluate(() => Einstellungen.oeffne('allgemein'));
  await warte(s, 700);
  const e = await s.evaluate(() => {
    const ei = document.getElementById('ei')!;
    const h2 = ei.querySelector('h2');
    const kacheln = ei.querySelector('.ru-kacheln');
    const felder = [...ei.querySelectorAll<HTMLElement>('[data-set],[data-toggle]')]
      .map(f => f.dataset['set'] || f.dataset['toggle']);
    return { direkt: !!h2 && !!kacheln && h2.nextElementSibling === kacheln,
             namen: [...(kacheln?.querySelectorAll('.ru-kachel-name') || [])].map(n => (n.textContent || '').trim()),
             felder };
  });
  p('Die Kacheln stehen direkt unter „Einstellungen"', e.direkt);
  gleich('Dieselben sieben Griffe', e.namen, NAMEN);
  gleich('Die Auswahlfelder bleiben, wo sie sind (§43)', e.felder,
    ['theme', 'schriftgroesse', 'dichte', 'startAnsicht', 'wochenstart', 'datumsformat', 'zeitformat', 'kontrast',
     'bewegung', 'lesen', 'enterZeile', 'rechtschreib', 'seiteZu']);
  const sync = await s.evaluate(async () => {
    const r = document.querySelector<HTMLElement>('#ei .ru-kacheln [data-kachel="abstand"]');
    if (!r) return { nachKachel: '', kachel: null as string | null };
    r.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    await new Promise(f => setTimeout(f, 150));
    const feld = document.querySelector<HTMLSelectElement>('#ei select[data-set="dichte"]')!;
    const nachKachel = feld.value;
    feld.value = 'weit';
    feld.dispatchEvent(new Event('change', { bubbles: true }));
    await new Promise(f => setTimeout(f, 200));
    const r2 = document.querySelector<HTMLElement>('#ei .ru-kacheln [data-kachel="abstand"]');
    return { nachKachel, kachel: r2 ? r2.getAttribute('aria-valuenow') : null };
  });
  gleich('Kachel → Feld: derselbe Stand', sync.nachKachel, 'eng');
  gleich('Feld → Kachel: derselbe Stand', sync.kachel, '2');
  await s.evaluate(() => Einstellungen.S('dichte', 'normal'));
  await ctx.close();
}

console.log('\n§11 · Kein Seitenfehler');
p('Kein Seitenfehler während des Laufs', fehler.length === 0, fehler.slice(0, 3).join(' | '));

await browser.close();
server.close();
console.log(`\n  Suite 589 — Tropfen, Linse und Kacheln: ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
