/* Suite 592 — Der Trenner zieht wirklich (E716)
 * ============================================================================
 * WAS HIER GEHALTEN WIRD. Redur hat im Masterprompt vom 29. September 2026
 * (Seite 25, mit einem Foto auf Seite 26) geschrieben:
 *
 *     „der linie wo man die feld grösser und kleiner macht , funktioniert
 *      nicht…"
 *
 * Gemeint ist `#studio-divider`: die senkrechte Linie zwischen der
 * Studio-Navigation `#kante` (Bibliothek, Notizhefte, Lernzentrum …) und dem
 * Inhalt, am Rechner ab 761 px. Der Zeiger wird zum ↔, Ziehen tut nichts.
 *
 * DIE URSACHE war eine Zeile CSS: `--studio-nav-width` wurde auf `:root`
 * aus `--studio-nav-expanded` abgeleitet, `studio.ts` schrieb
 * `--studio-nav-expanded` aber auf `<body>`. `var()` wird dort aufgelöst, wo
 * die Eigenschaft STEHT — auf `<html>` gab es den Wert nicht, also galt der
 * Ersatz 184 px (156 px bei 761–1100), und `<body>` erbte die fertige Zahl.
 * Der Griff schrieb `aria-valuenow`, IndexedDB merkte sich die Breite — nur
 * die Spalte bewegte sich nie.
 *
 * WARUM ES NIEMAND MERKTE. `test424` prüfte nach Ende/Pos1 nur
 * `aria-valuenow`, also genau das Attribut, das der Griff SELBST schreibt.
 * `test40`, `test245` und `test272` verglichen `#kante` mit diesem Attribut
 * nur bei der Vorgabe 184, wo beide zufällig übereinstimmen. Eine Prüfung,
 * die misst, was der Griff schreibt, misst den Griff — nicht seine Wirkung.
 * Deshalb misst dieser Lauf überall die GEZEICHNETE Breite von `#kante`.
 *
 * DIE ZUSAGEN, jede als Zahl:
 *
 *   §1  MAUS. Ziehen um +60 macht `#kante` 60 px breiter (±1), der Inhalt
 *       `#scroll` beginnt dahinter, die Zwischenbreiten steigen stetig (kein
 *       Sprung am Ende), `aria-valuenow` und `aria-valuetext` nennen die
 *       gezeichnete Breite, und die Breite ist gemerkt.
 *   §2  FINGER (CDP-Berührung). +48 und danach −24 wirken genauso.
 *   §3  TASTEN. ←/→ ±8, Umschalt+←/→ und Bild↑/Bild↓ ±32, Pos1 148,
 *       Ende 260 — gemessen an der GEZEICHNETEN Breite.
 *   §4  GRENZEN UND ABBRUCH. ±400 endet bei 260 und 148. Ein Klick ohne
 *       Bewegung ändert nichts und schreibt nichts. Escape mitten im Ziehen
 *       stellt die Anfangsbreite wieder her. Ein verlorener Zeigerfang
 *       (`lostpointercapture`) räumt `body.studio-resizing` weg.
 *   §5  ZURÜCKSETZEN. Doppelklick auf den Trenner und der Palettenbefehl
 *       „Navigationsbreite zurücksetzen" führen auf die Vorgabe der CSS
 *       zurück (184 bei 1440, 156 bei 1024) und vergessen die gemerkte
 *       Breite; eine Meldung sagt es.
 *   §6  NEU LADEN. Eine gemerkte Breite steht nach `Store.flush()` und dem
 *       Neuladen wieder da — gezeichnet, nicht nur im Attribut.
 *   §7  KOMPAKT. Kompakt sind es 62 px; zurück kommt die gemerkte Breite.
 *   §8  1024 PX OHNE GEMERKTE BREITE. Die Vorgabe ist 156, und das Attribut
 *       sagt 156 — nicht 184.
 *   §9  TREFFEN. 6 px links und rechts der Kante liegt der Trenner (16 px
 *       Fläche, mittig auf der Kante); die Mitte des ersten Navigationsknopfs
 *       und `#btn-back` treffen weiter sich selbst. Der Griff ist in Ruhe
 *       sichtbar (nie nur beim Überfahren), und der Tastaturfokus hat einen
 *       Rahmen. Mit grobem Zeiger (Finger) ist die Fläche um den Griff
 *       mindestens `--touch-min` breit UND hoch (§37).
 *   §10 BEWEGUNG. Der Griff bewegt nur `opacity` und `transform`; unter
 *       „weniger Bewegung" und unter „Ruhige Darstellung"
 *       (`body[data-bewegung=ruhig]`) dauert das höchstens 1 ms. Keine
 *       Animation der Spaltenbreite.
 *   §11 GEGENPROBE (§55.2). Mit der Ableitung zurück auf `:root` wird §1s
 *       Messung rot — der Lauf KANN den Fehler sehen.
 *   §12 DIE EINZELDATEI. `redion-einzeldatei.html` zieht genauso und merkt
 *       sich die Breite über das Neuladen.
 *
 * Kein Port: geladen wird über file:// — `index.html` per Doppelklick und
 * die Einzeldatei, so wie Redion startet (§6, §29).
 *
 *   node pruefungen/alle.mts 592
 * ==========================================================================*/
import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const INDEX = pathToFileURL(path.join(WURZEL, 'index.html')).href;
const EINZEL = pathToFileURL(path.join(WURZEL, 'redion-einzeldatei.html')).href;
const BREITE = 'studio:navigation-breite';

let ok = 0, weg = 0;
const p = (n: string, wahr: unknown, extra = ''): void => {
  if (wahr) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};

const browser: Browser = await chromium.launch();
const fehler: string[] = [];

type Offen = { pc: Page; kontext: BrowserContext };
type Wahl = { breite?: number; hoehe?: number; finger?: boolean; weniger?: boolean; hell?: boolean; adresse?: string };

const BEREIT = "typeof App !== 'undefined' && typeof StudioSchale !== 'undefined' && typeof Store !== 'undefined' && !!Store.cache.blocks && !!document.body.dataset.studioNav";

const einrichten = (pc: Page): Promise<unknown> => pc.evaluate(`(() => {
  Store.setMeta('rundgangGesehen', true);
  try { Store.setMeta('neuerungenGesehen', Math.max(...Rundgang.NEUERUNGEN.map(n => n.nr))); } catch { /* ohne Rundgang */ }
  document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung,#rg-neu').forEach(e => e.remove());
  Bibliothek.oeffne(null);
  /* Die Kennung des Zeigers merken, damit §4 den Fang gezielt lösen kann. */
  document.getElementById('studio-divider')?.addEventListener('pointerdown', e => { window.__zeiger = e.pointerId; });
})()`);

const oeffnen = async (o: Wahl = {}): Promise<Offen> => {
  const kontext = await browser.newContext({
    viewport: { width: o.breite ?? 1440, height: o.hoehe ?? 900 },
    hasTouch: !!o.finger,
    colorScheme: o.hell ? 'light' : 'dark',
    ...(o.weniger ? { reducedMotion: 'reduce' as const } : {})
  });
  const pc = await kontext.newPage();
  pc.setDefaultTimeout(15000);
  pc.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 160)));
  await pc.goto(o.adresse ?? INDEX);
  await pc.waitForFunction(BEREIT);
  await pc.waitForTimeout(900);
  await einrichten(pc);
  await pc.waitForTimeout(400);
  return { pc, kontext };
};

const neuLaden = async (pc: Page): Promise<void> => {
  await pc.evaluate('Store.flush()');
  await pc.reload();
  await pc.waitForFunction(BEREIT);
  await pc.waitForTimeout(900);
  await einrichten(pc);
  await pc.waitForTimeout(400);
};

/* Zwei Bilder abwarten: was ein `requestAnimationFrame` gesammelt hat und was
   ein ResizeObserver danach schreibt, steht dann sicher. */
const rahmen = (pc: Page): Promise<unknown> =>
  pc.evaluate('new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => r(0))))');

type Mass = { kante: number; inhalt: number; aria: number; text: string; meta: unknown; zieht: boolean; innen: string };
const mass = (pc: Page): Promise<Mass> => pc.evaluate(`(() => {
  const d = document.getElementById('studio-divider');
  const k = document.getElementById('kante');
  const s = document.getElementById('scroll');
  return {
    kante: k ? Math.round(k.getBoundingClientRect().width) : -1,
    inhalt: s ? Math.round(s.getBoundingClientRect().left) : -1,
    aria: Number(d?.getAttribute('aria-valuenow')),
    text: d?.getAttribute('aria-valuetext') || '',
    meta: Store.getMeta(${JSON.stringify(BREITE)}, '(keins)'),
    zieht: document.body.classList.contains('studio-resizing'),
    innen: document.body.style.getPropertyValue('--studio-nav-expanded')
  };
})()`) as Promise<Mass>;

type Punkt = { x: number; y: number; kante: number };
const griff = (pc: Page): Promise<Punkt> => pc.evaluate(`(() => {
  const r = document.getElementById('studio-divider').getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, kante: Math.round(document.getElementById('kante').getBoundingClientRect().right) };
})()`) as Promise<Punkt>;

/* Ziehen mit der Maus in Schritten; nach jedem Schritt die gezeichnete Breite. */
const ziehenMaus = async (pc: Page, dx: number, schritte = 6): Promise<number[]> => {
  const g = await griff(pc);
  await pc.mouse.move(g.x, g.y);
  await pc.mouse.down();
  const zwischen: number[] = [];
  for (let i = 1; i <= schritte; i++) {
    await pc.mouse.move(g.x + dx * i / schritte, g.y);
    await rahmen(pc);
    zwischen.push((await mass(pc)).kante);
  }
  await pc.mouse.up();
  await rahmen(pc);
  return zwischen;
};

/* Ziehen mit dem Finger über das Chrome-Protokoll — echte Berührungen, aus
   denen der Browser Zeigerereignisse vom Typ „touch" macht. */
const ziehenFinger = async (pc: Page, kontext: BrowserContext, dx: number, schritte = 6): Promise<void> => {
  const cdp = await kontext.newCDPSession(pc);
  const g = await griff(pc);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: g.x, y: g.y }] });
  for (let i = 1; i <= schritte; i++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: g.x + dx * i / schritte, y: g.y }] });
    await rahmen(pc);
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await rahmen(pc);
  await cdp.detach();
};

const taste = async (pc: Page, name: string): Promise<Mass> => {
  await pc.keyboard.press(name);
  await rahmen(pc);
  return mass(pc);
};

/* Die Zusage aus §1 als Funktion — §11 ruft sie unter der Gegenprobe noch
   einmal auf und erwartet ROT. */
const mausZieht = async (pc: Page): Promise<{ gut: boolean; vorher: Mass; nachher: Mass; zwischen: number[] }> => {
  const vorher = await mass(pc);
  const zwischen = await ziehenMaus(pc, 60);
  const nachher = await mass(pc);
  const gut = Math.abs(nachher.kante - (vorher.kante + 60)) <= 1 && nachher.inhalt === nachher.kante;
  return { gut, vorher, nachher, zwischen };
};

try {
  /* ─── §1–§7, §9 · 1440 × 900, index.html ─────────────────────────────── */
  {
    const { pc, kontext } = await oeffnen();

    console.log('\n§1 · Maus: Ziehen um +60 bewegt die Spalte');
    const m1 = await mausZieht(pc);
    p('Die Navigation ist 60 px breiter (gezeichnet, ±1)', m1.gut,
      `vorher ${m1.vorher.kante}, nachher ${m1.nachher.kante}, Inhalt ab ${m1.nachher.inhalt}, aria ${m1.nachher.aria}`);
    const stufen = m1.zwischen.map((w, i) => w - (i ? m1.zwischen[i - 1]! : m1.vorher.kante));
    p('Die Zwischenbreiten steigen stetig — kein Sprung am Ende',
      stufen.every(s => s >= 0 && s <= 11) && new Set(m1.zwischen).size >= 5,
      'Zwischenbreiten ' + m1.zwischen.join(' → '));
    p('aria-valuenow nennt die GEZEICHNETE Breite', m1.nachher.aria === m1.nachher.kante,
      `aria ${m1.nachher.aria}, gezeichnet ${m1.nachher.kante}`);
    p('aria-valuetext sagt es in Worten („… Pixel breit")', m1.nachher.text === m1.nachher.kante + ' Pixel breit',
      JSON.stringify(m1.nachher.text));
    p('Die Breite ist gemerkt', m1.nachher.meta === m1.nachher.kante, 'Meta ' + JSON.stringify(m1.nachher.meta));
    p('Nach dem Loslassen ist das Ziehen vorbei', !m1.nachher.zieht);

    console.log('\n§3 · Tasten ändern die gezeichnete Breite');
    await pc.locator('#studio-divider').focus();
    const t0 = (await mass(pc)).kante;
    const tR = await taste(pc, 'ArrowRight');
    p('→ macht 8 px breiter', tR.kante === Math.min(260, t0 + 8), `${t0} → ${tR.kante}`);
    const tL = await taste(pc, 'ArrowLeft');
    p('← macht 8 px schmaler', tL.kante === tR.kante - 8, `${tR.kante} → ${tL.kante}`);
    const tSL = await taste(pc, 'Shift+ArrowLeft');
    p('Umschalt+← macht 32 px schmaler', tSL.kante === tL.kante - 32, `${tL.kante} → ${tSL.kante}`);
    const tSR = await taste(pc, 'Shift+ArrowRight');
    p('Umschalt+→ macht 32 px breiter', tSR.kante === tSL.kante + 32, `${tSL.kante} → ${tSR.kante}`);
    const tPD = await taste(pc, 'PageDown');
    p('Bild↓ macht 32 px schmaler', tPD.kante === tSR.kante - 32, `${tSR.kante} → ${tPD.kante}`);
    const tPU = await taste(pc, 'PageUp');
    p('Bild↑ macht 32 px breiter', tPU.kante === tPD.kante + 32, `${tPD.kante} → ${tPU.kante}`);
    const tE = await taste(pc, 'End');
    p('Ende: 260 px gezeichnet, und das Attribut sagt dasselbe', tE.kante === 260 && tE.aria === 260, `gezeichnet ${tE.kante}, aria ${tE.aria}`);
    const tH = await taste(pc, 'Home');
    p('Pos1: 148 px gezeichnet, und das Attribut sagt dasselbe', tH.kante === 148 && tH.aria === 148, `gezeichnet ${tH.kante}, aria ${tH.aria}`);
    p('Die Taste merkt sich die Breite', tH.meta === 148, 'Meta ' + JSON.stringify(tH.meta));

    console.log('\n§4 · Grenzen, Klick, Escape, verlorener Fang');
    await taste(pc, 'End');
    await ziehenMaus(pc, -400, 8);
    const g148 = await mass(pc);
    p('−400 endet bei 148', g148.kante === 148, String(g148.kante));
    await ziehenMaus(pc, 400, 8);
    const g260 = await mass(pc);
    p('+400 endet bei 260', g260.kante === 260, String(g260.kante));
    /* Klick ohne Bewegung: erst die gemerkte Breite vergessen, damit man
       sieht, ob der Klick etwas SCHREIBT. */
    await pc.evaluate(`Store.setMeta(${JSON.stringify(BREITE)}, 'unberuehrt')`);
    const vorKlick = await mass(pc);
    const gk = await griff(pc);
    await pc.mouse.click(gk.x, gk.y);
    await rahmen(pc);
    const nachKlick = await mass(pc);
    p('Ein Klick ohne Bewegung ändert die Breite nicht', nachKlick.kante === vorKlick.kante, `${vorKlick.kante} → ${nachKlick.kante}`);
    p('… und schreibt nichts', nachKlick.meta === 'unberuehrt', 'Meta ' + JSON.stringify(nachKlick.meta));
    await taste(pc, 'Home');
    const vorEsc = await mass(pc);
    const ge = await griff(pc);
    await pc.mouse.move(ge.x, ge.y);
    await pc.mouse.down();
    await pc.mouse.move(ge.x + 20, ge.y); await rahmen(pc);
    await pc.mouse.move(ge.x + 40, ge.y); await rahmen(pc);
    const mitten = await mass(pc);
    await pc.keyboard.press('Escape');
    await rahmen(pc);
    await pc.mouse.move(ge.x + 70, ge.y); await rahmen(pc);
    await pc.mouse.up();
    await rahmen(pc);
    const nachEsc = await mass(pc);
    p('Mitten im Ziehen ist die Spalte schon breiter', mitten.kante === vorEsc.kante + 40, `${vorEsc.kante} → ${mitten.kante}`);
    p('Escape stellt die Anfangsbreite wieder her', nachEsc.kante === vorEsc.kante, `${vorEsc.kante} → ${mitten.kante} → ${nachEsc.kante}`);
    p('… merkt nichts Neues und hört auf zu ziehen', nachEsc.meta === vorEsc.meta && !nachEsc.zieht,
      `Meta ${JSON.stringify(vorEsc.meta)} → ${JSON.stringify(nachEsc.meta)}, zieht ${nachEsc.zieht}`);
    const vorFang = await mass(pc);
    const gf = await griff(pc);
    await pc.mouse.move(gf.x, gf.y);
    await pc.mouse.down();
    await pc.mouse.move(gf.x + 30, gf.y); await rahmen(pc);
    await pc.evaluate("document.getElementById('studio-divider').releasePointerCapture(window.__zeiger)");
    await pc.mouse.move(gf.x + 31, gf.y); await rahmen(pc);
    const nachFang = await mass(pc);
    await pc.mouse.up();
    await rahmen(pc);
    p('Verlorener Fang räumt body.studio-resizing weg', !nachFang.zieht, 'zieht ' + nachFang.zieht);
    p('… und stellt die Anfangsbreite wieder her', nachFang.kante === vorFang.kante, `${vorFang.kante} → ${nachFang.kante}`);

    console.log('\n§5 · Zurücksetzen: Doppelklick und Palette');
    await pc.locator('#studio-divider').focus();
    const z0 = await taste(pc, 'End');
    const gd = await griff(pc);
    await pc.mouse.dblclick(gd.x, gd.y);
    await rahmen(pc);
    const z1 = await mass(pc);
    const meldung = await pc.evaluate("document.getElementById('toast')?.textContent || ''");
    p('Doppelklick führt von 260 auf die Vorgabe 184', z0.kante === 260 && z1.kante === 184, `${z0.kante} → ${z1.kante}`);
    p('… vergisst die gemerkte Breite', z1.meta === null && z1.innen === '', `Meta ${JSON.stringify(z1.meta)}, am body ${JSON.stringify(z1.innen)}`);
    p('… und sagt es („Breite zurückgesetzt")', meldung === 'Breite zurückgesetzt', JSON.stringify(meldung));
    p('… und das Attribut sagt 184', z1.aria === 184 && z1.text === '184 Pixel breit', `${z1.aria} / ${z1.text}`);
    await pc.locator('#studio-divider').focus();
    const z2 = await taste(pc, 'End');
    await pc.evaluate('Werkzeuge.palette()');
    await pc.locator('#cq').fill('Navigationsbreite');
    await pc.waitForTimeout(150);
    const gefunden = await pc.evaluate("[...document.querySelectorAll('#cr button')].map(b => b.textContent.trim()).filter(t => /Navigationsbreite zur/.test(t)).length");
    await pc.keyboard.press('Enter');
    await rahmen(pc);
    const z3 = await mass(pc);
    p('Die Palette kennt „Navigationsbreite zurücksetzen"', gefunden === 1, gefunden + ' Treffer');
    p('… und der Befehl führt von 260 auf 184 und vergisst die Breite', z2.kante === 260 && z3.kante === 184 && z3.meta === null,
      `${z2.kante} → ${z3.kante}, Meta ${JSON.stringify(z3.meta)}`);
    await pc.evaluate("document.querySelectorAll('.overlay').forEach(e => e.remove())");

    console.log('\n§6 · Neu laden: die gemerkte Breite steht wieder da');
    await pc.locator('#studio-divider').focus();
    await taste(pc, 'End');
    const r0 = await taste(pc, 'ArrowLeft');
    await neuLaden(pc);
    const r1 = await mass(pc);
    p('252 gemerkt, nach dem Neuladen 252 gezeichnet', r0.kante === 252 && r1.kante === 252, `vorher ${r0.kante}, nachher ${r1.kante} (Meta ${JSON.stringify(r1.meta)})`);
    p('… das Attribut sagt dasselbe, der Inhalt beginnt dahinter', r1.aria === 252 && r1.inhalt === 252, `aria ${r1.aria}, Inhalt ab ${r1.inhalt}`);

    console.log('\n§7 · Kompakt und zurück');
    await pc.locator('#studio-nav').click();
    await rahmen(pc);
    const k1 = await mass(pc);
    await pc.locator('#studio-nav').click();
    await rahmen(pc);
    const k2 = await mass(pc);
    p('Kompakt sind es 62 px', k1.kante === 62, String(k1.kante));
    p('Zurück kommt die gemerkte Breite (252), gezeichnet und im Attribut', k2.kante === 252 && k2.aria === 252, `gezeichnet ${k2.kante}, aria ${k2.aria}`);

    console.log('\n§9 · Treffen, sehen, Fokus');
    await pc.evaluate("StudioSchale.breiteZuruecksetzen ? StudioSchale.breiteZuruecksetzen() : null");
    await rahmen(pc);
    const treffer = await pc.evaluate(`(() => {
      const d = document.getElementById('studio-divider');
      const k = document.getElementById('kante').getBoundingClientRect();
      const r = d.getBoundingClientRect();
      const y = r.top + r.height / 2;
      const hier = (x, y) => document.elementFromPoint(x, y);
      const knopf = [...document.querySelectorAll('#kante .k-knopf')].find(e => e.getBoundingClientRect().width > 0);
      const kr = knopf.getBoundingClientRect();
      const zurueck = document.getElementById('btn-back');
      const zr = zurueck.getBoundingClientRect();
      const vor = getComputedStyle(d, '::before');
      return {
        links: !!hier(k.right - 6, y)?.closest('#studio-divider'),
        rechts: !!hier(k.right + 6, y)?.closest('#studio-divider'),
        knopf: hier(kr.left + kr.width / 2, kr.top + kr.height / 2)?.closest('.k-knopf') === knopf,
        zurueck: hier(zr.left + zr.width / 2, zr.top + zr.height / 2)?.closest('#btn-back') === zurueck,
        griff: { inhalt: vor.content, hoch: parseFloat(vor.height) || 0, deck: Number(vor.opacity), farbe: vor.backgroundColor },
        breite: Math.round(r.width)
      };
    })()`) as { links: boolean; rechts: boolean; knopf: boolean; zurueck: boolean; griff: { inhalt: string; hoch: number; deck: number; farbe: string }; breite: number };
    p('6 px links der Kante liegt der Trenner', treffer.links, `Trenner ${treffer.breite} px breit`);
    p('6 px rechts der Kante liegt der Trenner', treffer.rechts, `Trenner ${treffer.breite} px breit`);
    p('Die Mitte des ersten Navigationsknopfs trifft weiter ihn selbst', treffer.knopf);
    p('Die Mitte von #btn-back trifft weiter ihn selbst', treffer.zurueck);
    p('Der Griff ist in Ruhe sichtbar (nie nur beim Überfahren)',
      treffer.griff.inhalt !== 'none' && treffer.griff.hoch >= 24 && treffer.griff.deck >= 0.4 && !/rgba\([^)]*,\s*0\)|transparent/.test(treffer.griff.farbe),
      JSON.stringify(treffer.griff));
    await pc.keyboard.press('Shift');
    await pc.locator('#studio-divider').focus();
    const fokus = await pc.evaluate(`(() => { const d = document.getElementById('studio-divider'); const s = getComputedStyle(d);
      return { sichtbar: d.matches(':focus-visible'), stil: s.outlineStyle, dicke: parseFloat(s.outlineWidth) || 0 }; })()`) as { sichtbar: boolean; stil: string; dicke: number };
    p('Der Tastaturfokus hat einen Rahmen (≥ 2 px)', fokus.sichtbar && fokus.stil !== 'none' && fokus.dicke >= 2, JSON.stringify(fokus));
    const name = await pc.evaluate(`(() => { const d = document.getElementById('studio-divider');
      return { rolle: d.getAttribute('role'), name: d.getAttribute('aria-label'), steuert: d.getAttribute('aria-controls'), titel: d.getAttribute('title') || '' }; })()`) as { rolle: string; name: string; steuert: string; titel: string };
    p('Der Trenner heisst, was er tut, und sagt, was er steuert', name.rolle === 'separator' && !!name.name && name.steuert === 'kante' && /Doppelklick/.test(name.titel),
      JSON.stringify(name));

    await kontext.close();
  }

  /* ─── §2 und §9 grob · Finger ─────────────────────────────────────────── */
  {
    console.log('\n§2 · Finger: dieselbe Wirkung');
    const { pc, kontext } = await oeffnen({ finger: true });
    const f0 = await mass(pc);
    await ziehenFinger(pc, kontext, 48);
    const f1 = await mass(pc);
    await ziehenFinger(pc, kontext, -24);
    const f2 = await mass(pc);
    p('Grober Zeiger erkannt (pointer: coarse)', await pc.evaluate("matchMedia('(pointer: coarse)').matches"));
    p('Finger +48: die Spalte ist 48 px breiter', Math.abs(f1.kante - (f0.kante + 48)) <= 1, `${f0.kante} → ${f1.kante}, aria ${f1.aria}`);
    p('Finger −24: die Spalte ist 24 px schmaler', Math.abs(f2.kante - (f1.kante - 24)) <= 1, `${f1.kante} → ${f2.kante}`);
    p('Der Finger merkt sich die Breite', f2.meta === f2.kante && !f2.zieht, `Meta ${JSON.stringify(f2.meta)}, zieht ${f2.zieht}`);

    console.log('\n§9 · Mit dem Finger: die Fläche um den Griff ist gross genug (§37)');
    const grob = await pc.evaluate(`(() => {
      const d = document.getElementById('studio-divider');
      const k = document.getElementById('kante').getBoundingClientRect();
      const r = d.getBoundingClientRect();
      const y = r.top + r.height / 2;
      const min = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--touch-min')) || 44;
      const h = min / 2 - 1;
      const auf = (x, y) => !!document.elementFromPoint(x, y)?.closest('#studio-divider');
      const knopf = [...document.querySelectorAll('#kante .k-knopf')].find(e => e.getBoundingClientRect().width > 0);
      const kr = knopf.getBoundingClientRect();
      return { min, breit: auf(k.right - h, y) && auf(k.right + h, y), hoch: auf(k.right + h, y - h) && auf(k.right + h, y + h),
               knopf: document.elementFromPoint(kr.left + kr.width / 2, kr.top + kr.height / 2)?.closest('.k-knopf') === knopf };
    })()`) as { min: number; breit: boolean; hoch: boolean; knopf: boolean };
    p(`Um den Griff ist die Fläche mindestens ${grob.min} px breit`, grob.breit);
    p(`… und mindestens ${grob.min} px hoch`, grob.hoch);
    p('… und die Navigationsknöpfe treffen weiter sich selbst', grob.knopf);
    await kontext.close();
  }

  /* ─── §5 und §8 · 1024 × 768 ──────────────────────────────────────────── */
  {
    console.log('\n§8 · 1024 px ohne gemerkte Breite');
    const { pc, kontext } = await oeffnen({ breite: 1024, hoehe: 768 });
    const v = await mass(pc);
    p('Die Vorgabe ist 156, und das Attribut sagt 156', v.kante === 156 && v.aria === 156 && v.text === '156 Pixel breit',
      `gezeichnet ${v.kante}, aria ${v.aria}, ${JSON.stringify(v.text)}`);
    p('Nichts ist gemerkt, nichts steht am body', v.meta === '(keins)' && v.innen === '', `Meta ${JSON.stringify(v.meta)}, am body ${JSON.stringify(v.innen)}`);
    await pc.locator('#studio-divider').focus();
    const e = await taste(pc, 'End');
    const gd = await griff(pc);
    await pc.mouse.dblclick(gd.x, gd.y);
    await rahmen(pc);
    const z = await mass(pc);
    p('§5 bei 1024: Doppelklick führt von 260 auf 156', e.kante === 260 && z.kante === 156 && z.aria === 156, `${e.kante} → ${z.kante}, aria ${z.aria}`);
    await kontext.close();
  }

  /* ─── §10 · Bewegung ──────────────────────────────────────────────────── */
  {
    console.log('\n§10 · Der Griff bewegt nur opacity und transform, und ohne Bewegung gar nicht');
    const lies = (pc: Page): Promise<{ inhalt: string; eigen: string; dauer: number[]; gitter: number[] }> => pc.evaluate(`(() => {
      const d = document.getElementById('studio-divider');
      const s = getComputedStyle(d, '::before');
      const sek = t => String(t).split(',').map(x => parseFloat(x) * (/ms/.test(x) ? 1 : 1000) || 0);
      return { inhalt: s.content, eigen: s.transitionProperty, dauer: sek(s.transitionDuration), gitter: sek(getComputedStyle(document.getElementById('main')).transitionDuration) };
    })()`);
    const normal = await oeffnen();
    const n = await lies(normal.pc);
    const eigen = n.eigen.split(',').map(x => x.trim());
    p('Der Griff ist da und bewegt nur opacity und transform',
      n.inhalt !== 'none' && eigen.every(x => x === 'opacity' || x === 'transform') && Math.max(...n.dauer) > 1,
      JSON.stringify(n));
    p('Die Spaltenbreite wird nicht animiert', Math.max(...n.gitter) <= 1, JSON.stringify(n.gitter));
    await normal.kontext.close();
    const weniger = await oeffnen({ weniger: true });
    const w = await lies(weniger.pc);
    p('„Weniger Bewegung": der Griff ist da, höchstens 1 ms', w.inhalt !== 'none' && Math.max(...w.dauer) <= 1, JSON.stringify(w));
    await weniger.kontext.close();
    const ruhig = await oeffnen();
    await ruhig.pc.evaluate("document.body.dataset.bewegung = 'ruhig'");
    const r = await lies(ruhig.pc);
    p('„Ruhige Darstellung": der Griff ist da, höchstens 1 ms', r.inhalt !== 'none' && Math.max(...r.dauer) <= 1, JSON.stringify(r));
    await ruhig.kontext.close();
  }

  /* ─── §11 · Gegenprobe ────────────────────────────────────────────────── */
  {
    console.log('\n§11 · Gegenprobe: die Ableitung zurück auf :root');
    const { pc, kontext } = await oeffnen();
    await pc.evaluate(`(() => {
      const s = document.createElement('style');
      s.textContent = ':root{--studio-nav-width:var(--studio-nav-expanded,184px)} body:not([data-studio-nav="kompakt"]){--studio-nav-width:inherit !important}';
      document.head.appendChild(s);
    })()`);
    const g = await mausZieht(pc);
    p('Unter der Gegenprobe ist §1 rot (die Spalte bleibt stehen)', !g.gut,
      `vorher ${g.vorher.kante}, nachher ${g.nachher.kante} — der Lauf sieht den Fehler`);
    await kontext.close();
  }

  /* ─── §12 · Die Einzeldatei ───────────────────────────────────────────── */
  {
    console.log('\n§12 · redion-einzeldatei.html');
    const { pc, kontext } = await oeffnen({ adresse: EINZEL });
    const e1 = await mausZieht(pc);
    p('Einzeldatei: Ziehen um +60 bewegt die Spalte', e1.gut && e1.nachher.aria === e1.nachher.kante,
      `vorher ${e1.vorher.kante}, nachher ${e1.nachher.kante}, aria ${e1.nachher.aria}`);
    await neuLaden(pc);
    const e2 = await mass(pc);
    p('Einzeldatei: nach dem Neuladen steht die gemerkte Breite da', e2.kante === e1.nachher.kante && e2.kante !== e1.vorher.kante,
      `gemerkt ${JSON.stringify(e2.meta)}, gezeichnet ${e2.kante}`);
    await kontext.close();
  }
} catch (e) {
  weg++;
  console.log('  ✗ Abbruch: ' + (e instanceof Error ? e.message.split('\n')[0] : String(e)));
}

await browser.close();
if (fehler.length) { console.log('\nFEHLER:'); fehler.slice(0, 6).forEach(x => console.log('  ' + x)); }
console.log(`\n${ok}/${ok + weg} bestanden`);
process.exit(weg || fehler.length ? 1 : 0);
