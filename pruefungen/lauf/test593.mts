/* Suite 593 — Der Seiteneditor ohne Stau (E717)
 * ============================================================================
 * WAS HIER GEHALTEN WIRD. Redur hat im Masterprompt vom 29. September
 * (PDF S. 5, OneNote S. 14) geschrieben:
 *
 *     „Bei pdf wenn ich seiteneditor klicke bleibt es für ca 30-40 sekunden
 *      stiel und dann kommt die dieses seite antwortet nicht und dann kann
 *      dort nicht mehr bearbeiten oder ändern ."
 *
 * Und als Abnahme für den Punkt: „Fortschritt/Ladezustand anzeigen … Fehler
 * werden nachvollziehbar gemeldet."
 *
 * Der Knopf ist `[data-document-action="exit"]` ganz rechts in der Leiste
 * des Dokumentmodus. Er schaltet in die Seitenansicht, und die zeichnete
 * JEDE PDF-Seite auf einmal: Leiste, Zeichenschicht, Bild. Jede Leiste
 * meldete ihre Fläche beim `Zeichenziel` an, jede Meldung baute das ganze
 * Menüband neu und rief `scrollIntoView` — ein volles Layout der wachsenden
 * Seite, zweimal je PDF-Seite. Das wächst quadratisch (gemessen in der
 * Karte: 40 Seiten 1,3 s, 80 Seiten 4,3 s, 134 Seiten 12 s am Rechner und
 * 52 s am Telefon). Und danach kannte das `Zeichenziel` nur noch EINE von
 * 134 Flächen: die Aufräumregel lief in der eigenen Meldung der Anmeldung,
 * solange die Hülle noch lose war, und warf jede Fläche nach der ersten
 * weg. Das Menüband „Zeichnen" und die Werkzeugtasten wirkten deshalb auf
 * Seite 1, egal welche Seite man anfasste — „kann dort nicht mehr
 * bearbeiten oder ändern".
 *
 * Der Lauf ist SYNTHETISCH (N PDF-Seiten ohne pdf.js und ohne Bild) und
 * zählt, statt zu stoppen: die CPU wird mit anderen Läufen geteilt, eine
 * Zeit wäre ein Würfel. Gezählt wird, was quadratisch wuchs.
 *
 *   §1 Beim Klick auf „Seiteneditor" baut das Menüband höchstens zweimal neu
 *      (gezählt am `scrollIntoView` des Reiters) und das `Zeichenziel` meldet
 *      höchstens dreimal — bei 40 Seiten genauso oft wie bei 80.
 *   §2 Danach sind nur die Seiten in der Nähe gezeichnet (≤ 6), jede Seite
 *      behält ihren Block `.blk[data-bid]`, und der Rollbalken lügt nicht:
 *      die Höhe mit Platzhaltern liegt innerhalb von 2 % der ganz
 *      gezeichneten (die Zusage aus E399, jetzt für die Seitenansicht).
 *   §3 `Zeichenziel.anzahl()` ist gleich der Zahl der gezeichneten Flächen —
 *      nach dem Wechsel, nach dem Rollen zu Seite K und nach einem
 *      `App.zeichneSeite()`.
 *   §4 Wer Seite K anfasst und im Menüband „Zeichnen" den Marker wählt, trifft
 *      Seite K und nur sie. Die Werkzeugtaste trifft sie auch.
 *   §5 Ein Neuzeichnen nach einer Änderung baut das Band auch höchstens
 *      zweimal neu, die Lesestelle bleibt, und die Seite, auf der man steht,
 *      ist im selben Durchgang wieder gezeichnet — kein Platzhalter blitzt
 *      an der Lesestelle auf.
 *   §6 Ein Platzhalter ist mit der Tastatur erreichbar (`tabindex`, Name
 *      „Seite N"); der Fokus zeichnet ihn, steht danach in seiner Leiste,
 *      und die Pfeiltasten führen darin weiter (`role="toolbar"`, E621) —
 *      44 px gross (§37, §38).
 *   §7 Fehler werden gemeldet: wirft der Zeichner EINER Seite, zeichnen die
 *      anderen weiter, die Seite zeigt den Satz und „Neu zeichnen", eine
 *      Meldung nennt sie, und es bleibt keine Ausnahme liegen. Der Knopf
 *      zeigt `aria-busy`, solange er arbeitet; wirft der Aufbau der
 *      Seitenansicht ganz, bleibt das Dokument offen und eine Meldung nennt
 *      den Seiteneditor.
 *   §8 §1–§4 noch einmal am Telefon (390 × 844, Finger) — und dort steht
 *      kein „✕" mehr, das wie Schliessen aussieht, sondern das Seitenzeichen,
 *      und der Name sagt „Seiteneditor".
 *   §9 Der Kern selbst: eine Fläche, die im laufenden Durchgang lose gemeldet
 *      wurde, überlebt jede Nachfrage darin (`anzahl`, `aktive`, `jetzt`,
 *      `da`) und ist danach weg, wenn sie nie eingehängt wurde.
 *  §10 Der Seiteneditor öffnet an der Seite, die im Dokument offen war —
 *      oben im Fenster und gezeichnet (Vorgabe zu Redurs Frage 2).
 *  §11 Ein Verweis in ein fernes Blatt findet sein Ziel: `App.zeigeBlock`
 *      und `#block=` auf einen Textblock in Blatt 5 und 6 (die Plätze sind)
 *      zeichnen das Blatt, rollen hin und heben hervor.
 *  §12 Strg+F findet, was in fernen Blättern steht — sechs Stellen über
 *      sechs Blätter, eine getippte Marke auf PDF-Seite 8 —, und der Satz
 *      eines Platzes („… wird vorbereitet") ist kein Fund; und ein Wort,
 *      das nur in den Nummern „Seite N von M" steht, zeichnet keine fernen
 *      Seiten (sonst wäre der Stau beim ersten Buchstaben zurück).
 *
 *   node pruefungen/lauf/test593.mts
 * ==========================================================================*/
import { chromium, type Page } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');

/* `listen(0)` statt einer festen Zahl (L205). */
const TYP: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon'
};
const server = http.createServer((a, b) => {
  const rein = decodeURIComponent((a.url ?? '/').split('?')[0] ?? '/');
  const pfad = path.join(WURZEL, rein === '/' ? 'index.html' : rein.slice(1));
  if (!pfad.startsWith(WURZEL) || !fs.existsSync(pfad) || fs.statSync(pfad).isDirectory()) {
    b.writeHead(404); b.end(); return;
  }
  b.writeHead(200, { 'Content-Type': TYP[path.extname(pfad)] ?? 'application/octet-stream' });
  b.end(fs.readFileSync(pfad));
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

type Auf = { pc: Page; zu: () => Promise<void> };
const aufmachen = async (handy = false): Promise<Auf> => {
  const kontext = await browser.newContext({
    viewport: handy ? { width: 390, height: 844 } : { width: 1440, height: 900 },
    hasTouch: handy, isMobile: handy, deviceScaleFactor: handy ? 2 : 1
  });
  const pc = await kontext.newPage();
  pc.on('pageerror', e => fehler.push((handy ? '390 ' : '1440 ') + 'PAGEERROR: ' + e.message.slice(0, 160)));
  await pc.goto(`http://127.0.0.1:${PORT}/index.html`);
  await pc.waitForFunction('typeof App !== "undefined" && typeof Store !== "undefined" && typeof Zeichenziel !== "undefined" && !!document.querySelector("#page")');
  await pc.waitForTimeout(1400);
  await pc.evaluate(`(() => {
    Store.setMeta('rundgangGesehen', true);
    Store.setMeta('neuerungenGesehen', 99);
    document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung,#rg-neu').forEach(e => e.remove());
    /* Jede Meldung mitschreiben — auch die, die gleich wieder überdeckt wird. */
    window.__meldungen = [];
    const alt = UI.toast;
    UI.toast = (t, d) => { window.__meldungen.push(String(t)); return alt(t, d); };
  })()`);
  return { pc, zu: () => kontext.close() };
};

/** Ein Skript mit N PDF-Seiten, im Dokumentmodus geöffnet. Ohne `quelleId`:
 *  kein Bild, kein pdf.js — gemessen wird der Aufbau, nicht das Rechnen. */
const skript = async (pc: Page, n: number): Promise<string> => {
  const id = await pc.evaluate(`(async () => {
    const s = Store.addPage(null, { text: 'Skript ${n} Seiten', icon: '📕' });
    for (let nr = 1; nr <= ${n}; nr++)
      Store.addBlock(s.id, 'pdfseite', { text: '', suchtext: 'Seite ' + nr, nr, vonSeiten: ${n}, bw: 595, bh: 842 });
    Store.updateBlock(s.id, { dokumentModus: true });
    await Store.flush();
    App.oeffne(s.id);
    return s.id;
  })()`) as string;
  await pc.waitForFunction(`document.body.dataset.dokument === 'an' && !!document.querySelector('[data-document-action="exit"]')`, null, { timeout: 30000 });
  await pc.waitForTimeout(900);
  return id;
};

/** Zähler einhängen: Neubauten des Menübands (am `scrollIntoView` des
 *  gewählten Reiters, dem teuren Teil) und Meldungen des `Zeichenziel`. */
const zaehlerAn = (pc: Page): Promise<unknown> => pc.evaluate(`(() => {
  window.__z = { band: 0, ziel: 0 };
  if (!window.__zEin) {
    window.__zEin = true;
    const roll = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = function (...a) {
      if (this.classList && this.classList.contains('mb-reiter-knopf')) window.__z.band++;
      return roll.apply(this, a);
    };
    Zeichenziel.horche(() => { window.__z.ziel++; });
  }
})()`);

/** Auf „Seiteneditor" klicken und warten, bis die Seitenansicht steht. */
const umschalten = async (pc: Page, n: number): Promise<{ band: number; ziel: number; ms: number }> => {
  await zaehlerAn(pc);
  const t0 = Date.now();
  await pc.click('[data-document-action="exit"]', { timeout: 10000 });
  await pc.waitForFunction(`!document.body.dataset.dokument && document.querySelectorAll('#page .blk.b-pdfseite[data-bid]').length >= ${n}`,
    null, { timeout: 180000, polling: 100 });
  const ms = Date.now() - t0;
  await pc.waitForTimeout(700);
  const z = await pc.evaluate('window.__z') as { band: number; ziel: number };
  return { ...z, ms };
};

const stand = (pc: Page): Promise<any> => pc.evaluate(`(() => {
  const bloecke = [...document.querySelectorAll('#page .blk.b-pdfseite[data-bid]')];
  return {
    bloecke: bloecke.length,
    gezeichnet: document.querySelectorAll('#page svg[data-tool]').length,
    platzhalter: document.querySelectorAll('#page [data-nah="wartet"]').length,
    anzahl: Zeichenziel.anzahl(),
    hoehe: document.getElementById('scroll').scrollHeight,
    oben: document.getElementById('scroll').scrollTop
  };
})()`);

/** Zur Seite K rollen (ihr Block an den oberen Rand) und kurz warten. */
const zuSeite = async (pc: Page, k: number): Promise<void> => {
  await pc.evaluate(`(() => {
    const b = document.querySelectorAll('#page .blk.b-pdfseite[data-bid]')[${k - 1}];
    const r = document.getElementById('scroll');
    r.scrollTop += b.getBoundingClientRect().top - r.getBoundingClientRect().top - 8;
  })()`);
  await pc.waitForTimeout(700);
};

/** Ist Seite K gezeichnet — und welches Werkzeug steht an jeder Fläche? */
const werkzeuge = (pc: Page): Promise<Array<{ nr: number; tool: string }>> => pc.evaluate(`(() =>
  [...document.querySelectorAll('#page .blk.b-pdfseite[data-bid]')].map((b, i) => ({
    nr: i + 1, tool: b.querySelector('svg[data-tool]')?.getAttribute('data-tool') || ''
  })).filter(x => x.tool))()`) as Promise<Array<{ nr: number; tool: string }>>;

/** §4: Seite K anfassen, im Band den Marker wählen, dann die Taste „e". */
const markerAufK = async (pc: Page, k: number, handy: boolean): Promise<void> => {
  const wz = await werkzeuge(pc);
  p(`Seite ${k} ist gezeichnet, bevor sie angefasst wird`, wz.some(x => x.nr === k), JSON.stringify(wz.map(x => x.nr)));
  await pc.evaluate(`(() => {
    const svg = document.querySelectorAll('#page .blk.b-pdfseite[data-bid]')[${k - 1}]?.querySelector('svg[data-tool]');
    svg?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: '${handy ? 'touch' : 'mouse'}', isPrimary: true }));
    svg?.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerType: '${handy ? 'touch' : 'mouse'}', isPrimary: true }));
  })()`);
  await pc.waitForTimeout(250);
  /* Der Reiter „Zeichnen" — am Telefon klappt er das Band als Menü auf. */
  const reiter = await pc.evaluate(`(() => {
    const r = document.querySelector('#menueband [data-mb-reiter="zeichnen"]');
    if (!r) return false;
    r.click(); return true;
  })()`);
  await pc.waitForTimeout(450);
  const marker = await pc.evaluate(`(() => {
    const m = document.querySelector('#menueband [data-band="wz-marker"]');
    if (!m) return false;
    m.click(); return true;
  })()`);
  await pc.waitForTimeout(450);
  const nach = await werkzeuge(pc);
  const marker1 = nach.filter(x => x.tool === 'marker').map(x => x.nr);
  p(`Menüband „Zeichnen" → Marker trifft Seite ${k} und nur sie`,
    reiter && marker && marker1.length === 1 && marker1[0] === k,
    `Reiter ${reiter}, Knopf ${marker}, Marker an Seite ${JSON.stringify(marker1)}`);
  await pc.evaluate(`document.activeElement && document.activeElement.blur && document.activeElement.blur()`);
  await pc.keyboard.press('e');
  await pc.waitForTimeout(400);
  const taste = await werkzeuge(pc);
  const rad = taste.filter(x => x.tool === 'radierer').map(x => x.nr);
  p(`… und die Taste „e" (Radierer) trifft auch Seite ${k}`,
    rad.length === 1 && rad[0] === k, `Radierer an Seite ${JSON.stringify(rad)}`);
};

/* ==========================================================================
 * §1–§7 am Rechner
 * ========================================================================*/
{
  console.log('\n1 · Der Klick auf „Seiteneditor" baut das Band nicht je Seite neu');
  const a = await aufmachen(false);
  const zahlen: Record<number, { band: number; ziel: number; ms: number }> = {};
  let id40 = '';
  try {
    for (const n of [80, 40]) {
      const id = await skript(a.pc, n);
      if (n === 40) id40 = id;
      zahlen[n] = await umschalten(a.pc, n);
      console.log(`    N=${n}: ${zahlen[n]!.band} Neubauten, ${zahlen[n]!.ziel} Meldungen, ${zahlen[n]!.ms} ms bis zur Seitenansicht`);
    }
    const z40 = zahlen[40]!, z80 = zahlen[80]!;
    p('Bei 40 Seiten: höchstens 2 Neubauten des Menübands', z40.band <= 2, `${z40.band} Neubauten`);
    p('Bei 40 Seiten: höchstens 3 Meldungen des Zeichenziels', z40.ziel <= 3, `${z40.ziel} Meldungen`);
    p('Bei 80 Seiten: höchstens 2 Neubauten und 3 Meldungen', z80.band <= 2 && z80.ziel <= 3, `${z80.band} / ${z80.ziel}`);
    p('Und bei 80 Seiten nicht mehr als bei 40 — die Zahl hängt nicht an N',
      z80.band === z40.band && z80.ziel === z40.ziel, `40: ${z40.band}/${z40.ziel} · 80: ${z80.band}/${z80.ziel}`);

    console.log('\n2 · Gezeichnet wird, was in der Nähe ist (E299 für die Seitenansicht)');
    const s = await stand(a.pc);
    p('Alle 40 Seiten haben ihren Block `.blk[data-bid]`', s.bloecke === 40, `${s.bloecke} Blöcke`);
    p('Höchstens 6 Seiten sind gezeichnet (1440 × 900)', s.gezeichnet >= 1 && s.gezeichnet <= 6, `${s.gezeichnet} gezeichnet, ${s.platzhalter} Platzhalter`);
    p('Der Rest wartet als Platzhalter mit dem Satz „Seite N wird vorbereitet …"',
      s.platzhalter >= 34 && await a.pc.evaluate(`(() => {
        const w = document.querySelector('#page [data-nah="wartet"]');
        return !!w && /Seite \\d+ wird vorbereitet/.test(w.textContent || '') && !!w.querySelector('.blatt-papier');
      })()`), `${s.platzhalter} Platzhalter`);
    /* DER ROLLBALKEN LÜGT NICHT (E399 für die Seitenansicht). Alle
       Platzhalter über ihren eigenen Weg zeichnen — den Fokus, ohne zu
       rollen — und die Höhe vergleichen. Danach wieder wie vorher. */
    const ganz = await a.pc.evaluate(`(() => {
      const r = document.getElementById('scroll');
      const mit = r.scrollHeight;
      for (const w of [...document.querySelectorAll('#page [data-nah="wartet"]')]) w.focus({ preventScroll: true });
      const ohne = r.scrollHeight;
      const rest = document.querySelectorAll('#page [data-nah="wartet"]').length;
      const gez = document.querySelectorAll('#page svg[data-tool]').length;
      document.activeElement?.blur?.();
      r.scrollTop = 0;
      App.zeichneSeite();
      return { mit, ohne, rest, gez, abw: +(100 * Math.abs(mit - ohne) / Math.max(1, ohne)).toFixed(2) };
    })()`) as { mit: number; ohne: number; rest: number; gez: number; abw: number };
    await a.pc.waitForTimeout(500);
    p('Mit Platzhaltern ist die Seite so hoch wie ganz gezeichnet (±2 %)',
      ganz.rest === 0 && ganz.gez === 40 && ganz.abw <= 2, JSON.stringify(ganz));

    console.log('\n3 · Das Zeichenziel kennt jede gezeichnete Fläche');
    p('Nach dem Wechsel: anzahl() = gezeichnete Flächen', s.anzahl === s.gezeichnet, `${s.anzahl} gemeldet, ${s.gezeichnet} gezeichnet`);
    await zuSeite(a.pc, 20);
    const s20 = await stand(a.pc);
    const wz20 = await werkzeuge(a.pc);
    p('Nach dem Rollen zu Seite 20 ist sie gezeichnet', wz20.some(x => x.nr === 20), JSON.stringify(wz20.map(x => x.nr)));
    p('… und anzahl() = gezeichnete Flächen', s20.anzahl === s20.gezeichnet, `${s20.anzahl} gemeldet, ${s20.gezeichnet} gezeichnet`);
    await a.pc.evaluate('App.zeichneSeite()');
    await a.pc.waitForTimeout(600);
    const sz = await stand(a.pc);
    p('Nach App.zeichneSeite(): anzahl() = gezeichnete Flächen', sz.anzahl === sz.gezeichnet, `${sz.anzahl} gemeldet, ${sz.gezeichnet} gezeichnet`);
    /* DIESELBE SEITE NEU GEZEICHNET — UND MAN STEHT NOCH DORT. Auf dem
       alten Stand sprang die Rolle hier auf 0: wer auf Seite 20 etwas
       auslöste, das neu zeichnet (✂ Lernkarte, ＋ Seite), stand danach auf
       Seite 1. */
    p('… und die Lesestelle bleibt bei Seite 20 (±4 px)', s20.oben > 5000 && Math.abs(sz.oben - s20.oben) <= 4, `vorher ${s20.oben}, nachher ${sz.oben}`);

    console.log('\n4 · Das Menüband „Zeichnen" wirkt auf die angefasste Seite');
    await markerAufK(a.pc, 20, false);

    console.log('\n5 · Ein Neuzeichnen nach einer Änderung bleibt billig und an Ort und Stelle');
    /* Erst wieder zu Seite 20: §4 hat das Band aufgeklappt und getippt. Und
       sie muss es auch WIRKLICH sein, sonst prüft „die Lesestelle bleibt"
       eine Rolle, die ohnehin oben steht — so war dieser Punkt im ersten
       Anlauf grün, auf dem alten Stand wie auf dem neuen. */
    await zuSeite(a.pc, 20);
    await zaehlerAn(a.pc);
    const nachAenderung = await a.pc.evaluate(`(async () => {
      const r = document.getElementById('scroll');
      const vorher = r.scrollTop;
      Store.addBlock('${id40}', 'text', { text: 'Ein neuer Absatz' });
      App.zeichneSeite();
      /* Ein Mikroschritt später ist der Durchgang zu Ende — VOR dem nächsten Bild. */
      await new Promise(f => queueMicrotask(f));
      await new Promise(f => queueMicrotask(f));
      const b20 = document.querySelectorAll('#page .blk.b-pdfseite[data-bid]')[19];
      return { vorher, nachher: r.scrollTop, seite20: !!b20?.querySelector('svg[data-tool]') };
    })()`) as { vorher: number; nachher: number; seite20: boolean };
    p('(Vorbedingung: vor der Änderung steht die Rolle wirklich bei Seite 20)', nachAenderung.vorher > 5000, JSON.stringify(nachAenderung));
    await a.pc.waitForTimeout(500);
    const z5 = await a.pc.evaluate('window.__z') as { band: number; ziel: number };
    p('Einfügen + Neuzeichnen: höchstens 2 Neubauten des Menübands', z5.band <= 2, `${z5.band} Neubauten, ${z5.ziel} Meldungen`);
    p('Die Seite, auf der man steht (20), ist im selben Durchgang wieder gezeichnet',
      nachAenderung.seite20, JSON.stringify(nachAenderung));
    p('… und die Lesestelle bleibt, wo sie war (±4 px)',
      Math.abs(nachAenderung.nachher - nachAenderung.vorher) <= 4, JSON.stringify(nachAenderung));

    console.log('\n6 · Ein Platzhalter ist mit der Tastatur erreichbar');
    const platz = await a.pc.evaluate(`(() => {
      const w = [...document.querySelectorAll('#page [data-nah="wartet"]')].pop();
      if (!w) return null;
      return { tab: w.tabIndex, name: w.getAttribute('aria-label') || '', bid: w.closest('.blk')?.dataset.bid || '' };
    })()`) as { tab: number; name: string; bid: string } | null;
    p('Er steht in der Tab-Folge und heisst „Seite N"', !!platz && platz.tab === 0 && /^Seite \d+$/.test(platz.name), JSON.stringify(platz));
    if (platz) {
      await a.pc.evaluate(`document.querySelector('#page .blk[data-bid="${platz.bid}"] [data-nah="wartet"]')?.focus()`);
      await a.pc.waitForTimeout(150);
      const fokus = await a.pc.evaluate(`(() => {
        const blk = document.querySelector('#page .blk[data-bid="${platz.bid}"]');
        const a = document.activeElement;
        return { gezeichnet: !!blk?.querySelector('svg[data-tool]'), wartet: !!blk?.querySelector('[data-nah="wartet"]'),
                 inLeiste: !!a && !!a.closest('.blatt-werk') && blk.contains(a) };
      })()`) as { gezeichnet: boolean; wartet: boolean; inLeiste: boolean };
      p('Der Fokus zeichnet ihn, und der Fokus steht danach in seiner Leiste', fokus.gezeichnet && !fokus.wartet && fokus.inLeiste, JSON.stringify(fokus));
      /* In der Leiste führen die PFEILTASTEN weiter, nicht Tab: sie ist eine
         `role="toolbar"` mit EINEM Tabstopp (E621). Der erste Entwurf
         drückte Tab und landete — richtig — hinter der Leiste. */
      await a.pc.keyboard.press('ArrowRight');
      await a.pc.waitForTimeout(120);
      const weiter = await a.pc.evaluate(`(() => {
        const blk = document.querySelector('#page .blk[data-bid="${platz.bid}"]');
        const a = document.activeElement;
        if (!a || !blk?.contains(a) || !a.closest('.blatt-werk')) return { drin: false };
        const r = a.getBoundingClientRect();
        const nach = parseFloat(getComputedStyle(a, '::after').height) || 0;
        return { drin: true, hoch: Math.round(Math.max(r.height, nach)), breit: Math.round(r.width), name: a.getAttribute('aria-label') || a.title || a.textContent.trim() };
      })()`) as { drin: boolean; hoch?: number; name?: string };
      p('Pfeil → führt zum nächsten Werkzeug derselben Seite, 44 px hoch (§37)', weiter.drin && (weiter.hoch ?? 0) >= 44 && !!weiter.name, JSON.stringify(weiter));
    }

    console.log('\n7 · Fehler werden gemeldet, nicht verschluckt');
    await a.pc.evaluate(`(() => {
      document.getElementById('scroll').scrollTop = 0;
      window.__meldungen = [];
      window.__altZeichner = PdfSeite.zeichne;
      PdfSeite.zeichne = (b) => { if (Number(b.nr) === 2) throw new Error('Probe: Seite 2 kaputt'); return window.__altZeichner(b); };
      App.zeichneSeite();
    })()`).catch(e => p('App.zeichneSeite() wirft nicht bis zum Aufrufer durch', false, String(e).split('\n')[0]));
    await a.pc.waitForTimeout(500);
    const kaputt = await a.pc.evaluate(`(() => {
      const bl = [...document.querySelectorAll('#page .blk.b-pdfseite[data-bid]')];
      const zwei = bl[1];
      return { bloecke: bl.length,
               eins: !!bl[0]?.querySelector('svg[data-tool]'), drei: !!bl[2]?.querySelector('svg[data-tool]'),
               satz: zwei?.querySelector('[data-nah="fehler"]')?.textContent || '',
               neu: !!zwei?.querySelector('[data-nah="fehler"] button'),
               meldungen: window.__meldungen.slice() };
    })()`) as any;
    p('Die anderen Seiten zeichnen weiter (1 und 3, alle 40 Blöcke da)', kaputt.bloecke === 40 && kaputt.eins && kaputt.drei, JSON.stringify(kaputt));
    p('Seite 2 sagt es und bietet „Neu zeichnen"', /Seite 2/.test(kaputt.satz) && /Neu zeichnen/.test(kaputt.satz) && kaputt.neu, JSON.stringify(kaputt.satz));
    p('… und eine Meldung nennt die Seite', kaputt.meldungen.some((m: string) => /Seite 2/.test(m)), JSON.stringify(kaputt.meldungen));
    await a.pc.evaluate(`PdfSeite.zeichne = window.__altZeichner`);
    await a.pc.evaluate(`document.querySelectorAll('#page .blk.b-pdfseite[data-bid]')[1]?.querySelector('[data-nah="fehler"] button')?.click()`);
    await a.pc.waitForTimeout(300);
    p('„Neu zeichnen" zeichnet sie, wenn der Fehler weg ist',
      await a.pc.evaluate(`!!document.querySelectorAll('#page .blk.b-pdfseite[data-bid]')[1]?.querySelector('svg[data-tool]')`));

    /* Wieder in den Dokumentmodus — über den Weg des Menschen, den Knopf
       „Dokument" im Kopf, oder sonst über die Schaltfunktion selbst. */
    const zurueck = async (): Promise<void> => {
      await a.pc.evaluate(`(() => { const s = Store.getBlock('${id40}'); DocumentMode.toggle(s, true); })()`);
      await a.pc.waitForFunction(`document.body.dataset.dokument === 'an'`, null, { timeout: 20000 });
      await a.pc.waitForTimeout(600);
    };
    await zurueck();
    await a.pc.evaluate(`(() => {
      window.__busy = [];
      const k = document.querySelector('[data-document-action="exit"]');
      new MutationObserver(() => { window.__busy.push(k.getAttribute('aria-busy')); })
        .observe(k, { attributes: true, attributeFilter: ['aria-busy'] });
    })()`);
    await a.pc.click('[data-document-action="exit"]');
    await a.pc.waitForFunction(`!document.body.dataset.dokument`, null, { timeout: 30000 });
    await a.pc.waitForTimeout(400);
    const busy = await a.pc.evaluate(`({ gesehen: window.__busy.slice(), bleibt: document.querySelectorAll('[aria-busy="true"]').length })`) as { gesehen: string[]; bleibt: number };
    p('Der Knopf zeigt aria-busy, solange er arbeitet, und danach nicht mehr', busy.gesehen.includes('true') && busy.bleibt === 0, JSON.stringify(busy));

    await zurueck();
    const vorFehler = fehler.length;
    await a.pc.evaluate(`(() => {
      window.__meldungen = [];
      window.__altFlaeche = Inhaltsflaeche.zeichne;
      Inhaltsflaeche.zeichne = () => { throw new Error('Probe: Seitenansicht kaputt'); };
    })()`);
    await a.pc.click('[data-document-action="exit"]');
    await a.pc.waitForTimeout(1200);
    const voll = await a.pc.evaluate(`({ dok: document.body.dataset.dokument || '', meldungen: window.__meldungen.slice(),
      knopf: !!document.querySelector('[data-document-action="exit"]') })`) as { dok: string; meldungen: string[]; knopf: boolean };
    await a.pc.evaluate(`Inhaltsflaeche.zeichne = window.__altFlaeche`);
    p('Wirft der Aufbau der Seitenansicht, bleibt das Dokument offen', voll.dok === 'an' && voll.knopf, JSON.stringify(voll));
    p('… und eine Meldung nennt den Seiteneditor', voll.meldungen.some(m => /Seiteneditor/.test(m)), JSON.stringify(voll.meldungen));
    p('… und keine Ausnahme bleibt im Browser liegen', fehler.length === vorFehler, fehler.slice(vorFehler).join(' · '));

    /* §9 DER KERN SELBST: EINE FLÄCHE IM BAU ÜBERLEBT JEDE NACHFRAGE IM
       SELBEN DURCHGANG. Die Ursache war eine Aufräumregel, die mitten im
       Aufbau gefragt wurde — vom Menüband, das die Meldung sofort hörte.
       §1–§4 halten das über den echten Weg; dieser Punkt hält die Zusage
       des Kerns, auch wenn jemand anderes mitten im Durchgang nachfragt:
       eine lose gemeldete Fläche zählt, bis der Durchgang zu Ende ist, und
       ist danach weg, wenn sie dann immer noch lose ist. */
    console.log('\n9 · Der Kern: eine Fläche im Bau überlebt den eigenen Durchgang');
    const kern = await a.pc.evaluate(`(async () => {
      const lebend = Zeichenziel.anzahl();
      const lose = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      Zeichenziel.melde({ flaeche: lose, setzeWerkzeug() {} }, 'Probe');
      const mitten = Zeichenziel.anzahl();
      Zeichenziel.aktive(); Zeichenziel.jetzt(); Zeichenziel.da();
      const nachFragen = Zeichenziel.anzahl();
      await new Promise(f => setTimeout(f, 0));
      return { lebend, mitten, nachFragen, danach: Zeichenziel.anzahl() };
    })()`) as { lebend: number; mitten: number; nachFragen: number; danach: number };
    p('Mitten im Durchgang zählt die lose Fläche mit — auch nach aktive()/jetzt()/da()',
      kern.lebend >= 1 && kern.mitten === kern.lebend + 1 && kern.nachFragen === kern.lebend + 1, JSON.stringify(kern));
    p('… und nach dem Durchgang ist sie weg, weil sie nie eingehängt wurde', kern.danach === kern.lebend, JSON.stringify(kern));

    /* §10 DER SEITENEDITOR ÖFFNET, WO MAN LIEST (Vorgabe zu Redurs Frage 2).
       Bisher öffnete er immer oben: wer im Dokument Seite 25 las, musste
       danach 24 Seiten zurückrollen. Jetzt steht Seite 25 oben im Fenster,
       gezeichnet. */
    console.log('\n10 · Der Seiteneditor öffnet an der Seite, die man im Dokument liest');
    await a.pc.evaluate(`(() => {
      const s = Store.getBlock('${id40}');
      const ziel = DocumentMode.documentsIn(s)[24];
      DocumentMode.select(s, ziel.id);
      App.zeichneSeite();
    })()`);
    await a.pc.waitForTimeout(900);
    await a.pc.click('[data-document-action="exit"]');
    await a.pc.waitForFunction(`!document.body.dataset.dokument`, null, { timeout: 30000 });
    await a.pc.waitForTimeout(500);
    const lage = await a.pc.evaluate(`(() => {
      const r = document.getElementById('scroll');
      const b = document.querySelectorAll('#page .blk.b-pdfseite[data-bid]')[24];
      return { abstand: Math.round(b.getBoundingClientRect().top - r.getBoundingClientRect().top),
               oben: r.scrollTop, gezeichnet: !!b.querySelector('svg[data-tool]'),
               nr: b.querySelector('.pdfs-nr')?.textContent || '' };
    })()`) as { abstand: number; oben: number; gezeichnet: boolean; nr: string };
    p('Seite 25 steht oben im Fenster (0 … 40 px unter dem Rand)', lage.abstand >= -4 && lage.abstand <= 40, JSON.stringify(lage));
    p('… und sie ist gezeichnet, mit ihrer Nummer', lage.gezeichnet && /Seite 25 von 40/.test(lage.nr), JSON.stringify(lage));
  } catch (e) { p('§1–§7 laufen bis zum Ende durch', false, String(e).split('\n')[0]); }
  await a.zu();
}

/* ==========================================================================
 * §11–§12 Was in einem fernen Blatt steht, bleibt erreichbar
 *
 * Gefunden in der Durchsicht des Zweigs, nicht im ersten Bau: ein Platz
 * hält nur den Block des Blatts (`.blk[data-bid]`), nicht seine KINDER.
 * Der Textblock in Blatt 6 war nicht im DOM, also fand `App.zeigeBlock`
 * (Verweise `#block=`, Suchtreffer, Rückverweise, Erwähnungen, Sprünge aus
 * Kommentaren) nichts und schwieg; und Strg+F („Auf dieser Seite suchen",
 * E667) zählte nur, was gezeichnet war — „1 von 3" statt „1 von 6". Auf
 * `1bfaca53` war beides heil, weil alles gezeichnet war (§43).
 * ========================================================================*/
{
  console.log('\n11 · Ein Verweis in ein fernes Blatt findet sein Ziel');
  const a = await aufmachen(false);
  try {
    const seite = await a.pc.evaluate(`(async () => {
      const s = Store.addPage(null, { text: 'Sechs Blätter' });
      const kinder = [];
      for (let i = 1; i <= 6; i++) {
        const b = Store.addBlock(s.id, 'blatt', {});
        kinder.push(Store.addBlock(b.id, 'text', { text: 'Zielwort' + i }).id);
      }
      for (let nr = 1; nr <= 8; nr++)
        Store.addBlock(s.id, 'pdfseite', { text: '', nr, vonSeiten: 8, bw: 595, bh: 842,
          marken: nr === 8 ? [{ id: 'm8', art: 'text', text: 'Randnotiz acht', point: [60, 80] }] : [] });
      await Store.flush();
      App.oeffne(s.id);
      return { id: s.id, kinder };
    })()`) as { id: string; kinder: string[] };
    await a.pc.waitForTimeout(1200);
    const vorher = await a.pc.evaluate(`(() => ({
      plaetze: document.querySelectorAll('#page [data-nah="wartet"]').length,
      kind6: !!document.querySelector('[data-bid="${seite.kinder[5]}"]')
    }))()`) as { plaetze: number; kind6: boolean };
    console.log(`    vorher: ${vorher.plaetze} Plätze, Kind von Blatt 6 im DOM: ${vorher.kind6}`);

    /* Über `App.zeigeBlock` — denselben Weg nehmen Suchtreffer,
       Rückverweise, Erwähnungen und Kommentarsprünge. */
    const ziel = async (kind: string): Promise<any> => {
      /* Die Hervorhebung lebt 1,4 s — also nach 0,6 s nachsehen, die Lage
         erst, wenn das weiche Rollen sicher steht. */
      await a.pc.waitForTimeout(600);
      const hervor = await a.pc.evaluate(`(() => {
        const z = document.querySelector('[data-bid="${kind}"]');
        return !!z && (z.classList.contains('hebe-hervor') || !!z.closest('.hebe-hervor'));
      })()`);
      await a.pc.waitForTimeout(900);
      return a.pc.evaluate(`(() => {
        const z = document.querySelector('[data-bid="${kind}"]');
        const r = document.getElementById('scroll').getBoundingClientRect();
        const b = z ? z.getBoundingClientRect() : null;
        return { imDom: !!z, imBild: !!b && b.bottom > r.top && b.top < r.bottom,
                 oben: document.getElementById('scroll').scrollTop, hervor: ${hervor} };
      })()`);
    };
    await a.pc.evaluate(`(() => { document.getElementById('scroll').scrollTop = 0; App.zeigeBlock('${seite.kinder[5]}'); })()`);
    const z1 = await ziel(seite.kinder[5]!);
    p('App.zeigeBlock auf den Text in Blatt 6: er steht im DOM und im Bild', z1.imDom && z1.imBild, JSON.stringify(z1));
    p('… und er ist hervorgehoben (hebe-hervor)', z1.hervor, JSON.stringify(z1));

    /* Derselbe Sprung über einen Verweis in der Adresse. */
    await a.pc.evaluate(`(() => { App.zeichneSeite(); document.getElementById('scroll').scrollTop = 0; })()`);
    await a.pc.waitForTimeout(600);
    await a.pc.evaluate(`location.hash = '#block=${seite.kinder[4]}'`);
    const z2 = await ziel(seite.kinder[4]!);
    p('Ein Verweis #block= auf den Text in Blatt 5 rollt ihn ins Bild', z2.imDom && z2.imBild && z2.hervor, JSON.stringify(z2));

    console.log('\n12 · Strg+F findet auch, was in fernen Blättern steht');
    /* Eine EIGENE Seite: §11 hat Blatt 5 und 6 gezeichnet, und was nah
       war, zeichnet beim nächsten Mal sofort — die Gegenprobe ohne
       `zeichneFuerSuche` blieb bei „Zielwort" sonst grün. */
    const seite2 = await a.pc.evaluate(`(async () => {
      const s = Store.addPage(null, { text: 'Sechs Blätter, gesucht' });
      for (let i = 1; i <= 6; i++) {
        const b = Store.addBlock(s.id, 'blatt', {});
        Store.addBlock(b.id, 'text', { text: 'Zielwort' + i });
      }
      for (let nr = 1; nr <= 8; nr++)
        Store.addBlock(s.id, 'pdfseite', { text: '', nr, vonSeiten: 8, bw: 595, bh: 842,
          marken: nr === 8 ? [{ id: 'm8b', art: 'text', text: 'Randnotiz acht', point: [60, 80] }] : [] });
      await Store.flush();
      return s.id;
    })()`) as string;
    await a.pc.evaluate(`(() => { location.hash = ''; App.oeffne('${seite2}'); })()`);
    await a.pc.waitForTimeout(900);
    await a.pc.evaluate(`(() => { document.getElementById('scroll').scrollTop = 0; })()`);
    await a.pc.waitForTimeout(300);
    const suche = async (wort: string): Promise<any> => {
      await a.pc.evaluate(`(() => { document.getElementById('findbar')?.remove(); App.seitenSuche(); })()`);
      await a.pc.waitForSelector('#findbar input');
      await a.pc.fill('#findbar input', wort);
      await a.pc.waitForTimeout(500);
      return a.pc.evaluate(`(() => ({
        zaehler: document.querySelector('#findbar .n')?.textContent || '',
        marken: document.querySelectorAll('#page mark').length,
        lose: [...document.querySelectorAll('#page mark')].filter(m => m.closest('.blatt-platz')).length
      }))()`);
    };
    const s1 = await suche('Zielwort');
    p('„Zielwort" über sechs Blätter: 6 Stellen („1 von 6")', s1.marken === 6 && /von 6$/.test(s1.zaehler), JSON.stringify(s1));
    await a.pc.keyboard.press('Shift+Enter');
    await a.pc.waitForTimeout(900);
    const letzte = await a.pc.evaluate(`(() => {
      const m = document.querySelector('#page mark.aktiv');
      const r = document.getElementById('scroll').getBoundingClientRect();
      const b = m ? m.getBoundingClientRect() : null;
      return { text: m?.textContent || '', imBild: !!b && b.bottom > r.top && b.top < r.bottom,
               zaehler: document.querySelector('#findbar .n')?.textContent || '' };
    })()`) as { text: string; imBild: boolean; zaehler: string };
    p('… Umschalt+Enter springt zur letzten Stelle in Blatt 6 und zeigt sie', letzte.imBild && /6 von 6/.test(letzte.zaehler), JSON.stringify(letzte));
    const s2 = await suche('Randnotiz');
    p('Eine getippte Marke auf PDF-Seite 8 wird gefunden', s2.marken === 1, JSON.stringify(s2));
    const s3 = await suche('vorbereitet');
    p('Der Satz eines Platzes ist kein Fund', s3.marken === 0 && s3.lose === 0, JSON.stringify(s3));
    /* Und kein Stau durch die Hintertür: „von" steht in jeder Nummer
       „Seite N von M" und sonst nirgends. Fern wartende Seiten deshalb zu
       zeichnen hiesse, beim ersten Buchstaben alle zu zeichnen (L238). */
    /* Gezählt im selben Aufruf wie die Eingabe — danach rollt die Suche
       zur ersten Stelle, und was dabei in die Nähe kommt, zeichnet der
       Beobachter ohnehin (das ist kein Stau). */
    const von = await a.pc.evaluate(`(() => {
      document.getElementById('findbar')?.remove(); App.seitenSuche();
      const inp = document.querySelector('#findbar input');
      const vor = document.querySelectorAll('#page [data-nah="wartet"]').length;
      inp.value = 'von'; inp.dispatchEvent(new Event('input'));
      return { vor, nach: document.querySelectorAll('#page [data-nah="wartet"]').length,
               zaehler: document.querySelector('#findbar .n').textContent };
    })()`) as { vor: number; nach: number; zaehler: string };
    p('„von" (nur in „Seite N von M") zeichnet keine fernen Seiten', von.vor > 0 && von.nach === von.vor,
      JSON.stringify(von));
    await a.pc.keyboard.press('Escape');
  } catch (e) { p('§11–§12 laufen bis zum Ende durch', false, String(e).split('\n')[0]); }
  await a.zu();
}

/* ==========================================================================
 * §8 am Telefon
 * ========================================================================*/
{
  console.log('\n8 · Am Telefon (390 × 844, Finger)');
  const a = await aufmachen(true);
  try {
    await skript(a.pc, 40);
    const knopf = await a.pc.evaluate(`(() => {
      const k = document.querySelector('[data-document-action="exit"]');
      const r = k.getBoundingClientRect();
      const vor = getComputedStyle(k, '::before').content;
      return { name: k.getAttribute('aria-label') || '', vor, zeichen: !!k.querySelector('svg'),
               b: Math.round(r.width), h: Math.round(r.height) };
    })()`) as { name: string; vor: string; zeichen: boolean; b: number; h: number };
    p('Der Knopf zeigt kein „✕" mehr, sondern das Seitenzeichen', !/✕/.test(knopf.vor) && knopf.zeichen, JSON.stringify(knopf));
    p('… sein Name sagt „Seiteneditor"', /Seiteneditor/.test(knopf.name), JSON.stringify(knopf.name));
    p('… und er bleibt 44 × 44 px gross (§37)', knopf.b >= 44 && knopf.h >= 44 && knopf.b <= 48, JSON.stringify(knopf));
    const z = await umschalten(a.pc, 40);
    console.log(`    N=40: ${z.band} Neubauten, ${z.ziel} Meldungen, ${z.ms} ms bis zur Seitenansicht`);
    p('§1 am Telefon: höchstens 2 Neubauten und 3 Meldungen', z.band <= 2 && z.ziel <= 3, `${z.band} / ${z.ziel}`);
    const s = await stand(a.pc);
    p('§2 am Telefon: höchstens 6 Seiten gezeichnet, alle 40 Blöcke da', s.gezeichnet >= 1 && s.gezeichnet <= 6 && s.bloecke === 40, `${s.gezeichnet} gezeichnet, ${s.bloecke} Blöcke`);
    p('§3 am Telefon: anzahl() = gezeichnete Flächen', s.anzahl === s.gezeichnet, `${s.anzahl} / ${s.gezeichnet}`);
    await zuSeite(a.pc, 15);
    const s15 = await stand(a.pc);
    p('§3 am Telefon nach dem Rollen zu Seite 15: anzahl() = gezeichnete Flächen', s15.anzahl === s15.gezeichnet, `${s15.anzahl} / ${s15.gezeichnet}`);
    await markerAufK(a.pc, 15, true);
  } catch (e) { p('§8 läuft bis zum Ende durch', false, String(e).split('\n')[0]); }
  await a.zu();
}

p('Keine Ausnahme im Browser', fehler.length === 0, fehler.slice(0, 3).join(' · '));

await browser.close();
server.close();
console.log(`\n${ok}/${ok + weg} bestanden`);
process.exit(weg ? 1 : 0);
