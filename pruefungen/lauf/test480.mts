/* Suite 480 — Die Leiste wie GoodNotes: Stiftreihe, Laser, vier Plätze (E512)
 * ============================================================================
 * Redur, 8. September, mit fünf Bildern aus GoodNotes und drei Sätzen:
 *
 *   „Die Fachzeichen-Stift kommt, wenn ich die Stift klicke — sollte neben
 *    es, also links unten, wo die Farben dort sind, mir zeigen, welche
 *    Stift ich will."
 *   „Alter, wieso habe ich keinen Laserpointer? Mache es sofort."
 *   „Und die Stift[leiste] sollte ich als komplett bewegen können, also
 *    nach links, rechts, Mitte und ganz oben."
 *
 *   §1 DIE STIFTREIHE: sechs Knöpfe statt eines Wechslers, EIN Tipp je
 *      Stift, der geführte ist zu sehen — und der alte Rundlauf ist nicht
 *      weg, er liegt auf der Taste P.
 *   §2 DER LASERPOINTER: ein Werkzeug, das ZEIGT und nichts schreibt.
 *      Keine Marke, kein Schritt im Verlauf, nichts in der Sicherung.
 *   §3 VIER PLÄTZE für die Leiste, gemerkt, und an der Seite steht sie
 *      wirklich am Rand — gemessen, nicht behauptet.
 *   §4 QUELLEN.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 *   §1 → die Reihe zurück auf einen Wechselknopf: fünf der sechs Zusagen.
 *   §2 → im Laser-Zweig `return` streichen: der Strahl wird ein Strich.
 *   §3 → `row.dataset.lage` beim Bauen weglassen: der gemerkte Platz gilt
 *        erst nach dem ersten Klick — derselbe Fund wie in E509.
 *
 *   node pruefungen/lauf/test480.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import type { Page } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9600;
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

const mitBlatt = async (): Promise<Page> => {
  const s = await browser.newPage({ viewport: { width: 1360, height: 900 } });
  s.on('pageerror', e => fehler.push(e.message.slice(0, 140)));
  await s.goto(`http://localhost:${PORT}/index.html`);
  await s.waitForFunction("typeof App !== 'undefined' && typeof Marken !== 'undefined'");
  await s.evaluate(async () => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    document.getElementById('rg-willkommen')?.remove();
    Store.setMeta('zeichnen:stift', 'fueller');
    const a = Store.addPage(null, { text: 'Werkblatt' });
    Store.addBlock(a.id, 'blatt', { text: '', blattBreite: 595.28, blattHoehe: 841.89, raumVersion: 1, marken: [] });
    await Store.flush();
    App.oeffne(a.id);
  });
  await s.waitForSelector('.blatt-werk [data-wz="stift"]', { timeout: 15000 });
  await s.waitForTimeout(400);
  return s;
};

/* ═══ §1 Die Stiftreihe ════════════════════════════════════════════════════ */
console.log('\n§1 Sechs Stifte stehen da, statt sich zu verstecken');
{
  const s = await mitBlatt();
  await s.click('.blatt-werk [data-wz="stift"]');
  await s.waitForTimeout(200);
  const r = JSON.parse(await s.evaluate(`(() => {
    const werk = document.querySelector('.blatt-werk');
    const knoepfe = Array.from(werk.querySelectorAll('[data-act="stilwahl"]'));
    return JSON.stringify({
      zahl: knoepfe.length,
      stifte: knoepfe.map(k => k.dataset.stil),
      gefuehrt: knoepfe.filter(k => k.classList.contains('on')).map(k => k.dataset.stil),
      /* Jeder sagt seinen Namen — im Titel und für einen Vorleser (§38). */
      titel: knoepfe.map(k => k.getAttribute('title') || ''),
      namen: knoepfe.map(k => k.getAttribute('aria-label') || ''),
      /* UND KEINER IST EINE FALLE FÜR DEN DAUMEN (§37). Gemessen wird die
         TREFFFLÄCHE, nicht der sichtbare Kasten: die Leiste gibt jedem
         Knopf seit E406 ein 44 px hohes Feld über das ::after, damit die
         Knöpfe nebeneinander schmal bleiben und der Finger trotzdem
         trifft. Wer hier den Kasten misst, misst das Falsche. */
      hoehen: knoepfe.map(k => parseFloat(getComputedStyle(k, '::after').height) || 0),
      /* Die Reihe steht LINKS VOR den Farben — Redurs Wunsch wörtlich. */
      vorDenFarben: (() => {
        const letzterStift = knoepfe[knoepfe.length - 1].getBoundingClientRect();
        const ersteFarbe = werk.querySelector('.blatt-farbe').getBoundingClientRect();
        return letzterStift.right <= ersteFarbe.left + 1;
      })()
    });
  })()`) as string);
  gleich('Sechs Stifte, jeder mit eigenem Knopf', r.zahl, 6);
  gleich('… und in der bekannten Reihenfolge', r.stifte,
    ['fueller', 'kugel', 'pinsel', 'bleistift', 'schutzleiter', 'leiter']);
  gleich('Genau EINER ist geführt, und es ist der gemerkte', r.gefuehrt, ['fueller']);
  p('Jeder sagt seinen Namen', r.titel.every((t: string) => t.length > 2)
    && r.namen.every((n: string) => /^Stift /.test(n)), JSON.stringify(r.titel));
  p('Jeder ist mindestens 44 px hoch (§37)',
    r.hoehen.every((h: number) => h >= 44), JSON.stringify(r.hoehen));
  p('Die Reihe steht links vor den Farben — genau dort, wo Redur sie wollte',
    r.vorDenFarben, JSON.stringify(r.vorDenFarben));

  /* EIN TIPP, EIN STIFT — nicht bis zu fünf. */
  await s.click('.blatt-werk [data-act="stilwahl"][data-stil="leiter"]');
  await s.waitForTimeout(200);
  gleich('Ein einziger Tipp holt den letzten Stift',
    await s.evaluate(`document.querySelector('.blatt-werk [data-act="stilwahl"].on').dataset.stil`), 'leiter');
  gleich('… und er ist gemerkt', await s.evaluate(`Store.getMeta('zeichnen:stift')`), 'leiter');

  /* DER RUNDLAUF IST NICHT WEG — er liegt auf der Taste. */
  await s.click('.blatt-werk [data-act="stilwahl"][data-stil="fueller"]');
  await s.waitForTimeout(150);
  await s.keyboard.press('p');
  await s.waitForTimeout(150);
  gleich('P noch einmal gedrückt wechselt weiter — der alte Weg lebt',
    await s.evaluate(`document.querySelector('.blatt-werk [data-act="stilwahl"].on').dataset.stil`), 'kugel');
  await s.close();
}

/* ═══ §2 Der Laserpointer zeigt und schreibt nicht ═════════════════════════ */
console.log('\n§2 Der Laserpointer');
{
  const s = await mitBlatt();
  const da = JSON.parse(await s.evaluate(`(() => JSON.stringify({
    imKatalog: Marken.WERKZEUGE.some(w => w.id === 'laser'),
    arten: (Marken.LASER || []).map(l => l.id),
    knopf: !!document.querySelector('.blatt-werk [data-wz="laser"]')
  }))()`) as string);
  p('Es gibt ein Werkzeug „laser"', da.imKatalog && da.knopf, JSON.stringify(da));
  gleich('… mit zwei Arten: Punkt und Linie', da.arten, ['punkt', 'linie']);

  await s.click('.blatt-werk [data-wz="laser"]');
  await s.waitForTimeout(250);
  const sichtbar = await s.evaluate(`(() => {
    const k = document.querySelectorAll('.blatt-werk [data-act="laserart"]');
    return [...k].filter(x => x.getBoundingClientRect().width > 0).length;
  })()`);
  gleich('Beim Laser stehen seine zwei Arten in der Leiste', sichtbar, 2);

  const r = JSON.parse(await s.evaluate(`(async () => {
    const f = document.querySelector('.blatt-marken');
    const ctm = f.getScreenCTM();
    const px = (q) => { const pt = f.createSVGPoint(); pt.x = q[0]; pt.y = q[1];
      const c = pt.matrixTransform(ctm); return { x: c.x, y: c.y }; };
    const ev = (typ, q, t) => { const c = px(q);
      const e = new PointerEvent(typ, { bubbles: true, cancelable: true, clientX: c.x, clientY: c.y,
        pointerId: 1, pointerType: 'mouse', isPrimary: true, button: typ === 'pointermove' ? -1 : 0,
        buttons: typ === 'pointerup' ? 0 : 1, pressure: typ === 'pointerup' ? 0 : 0.6 });
      Object.defineProperty(e, 'timeStamp', { value: t });
      return e; };
    const blatt = () => Object.values(Store.cache.blocks).find(x => x.type === 'blatt' && x.alive);
    let t = 2000;
    f.dispatchEvent(ev('pointerdown', [100, 300], t));
    for (let i = 1; i <= 10; i++) { t += 16.7; f.dispatchEvent(ev('pointermove', [100 + i * 20, 300], t)); }
    const waehrend = {
      strahl: document.querySelectorAll('.blatt-laser').length,
      marken: ((blatt() || {}).marken || []).length
    };
    f.dispatchEvent(ev('pointerup', [300, 300], t + 16.7));
    await new Promise(r => setTimeout(r, 1100));
    return JSON.stringify({ waehrend,
      danachStrahl: document.querySelectorAll('.blatt-laser').length,
      danachMarken: ((blatt() || {}).marken || []).length,
      zurueckMoeglich: !document.querySelector('.blatt-werk [data-act="undo"]').disabled });
  })()`) as string);
  p('Während des Zeigens leuchtet ein Strahl', r.waehrend.strahl === 1, JSON.stringify(r));
  p('… und er ist KEINE Marke', r.waehrend.marken === 0, JSON.stringify(r));
  p('Nach dem Loslassen ist er verschwunden', r.danachStrahl === 0, JSON.stringify(r));
  p('… und hat nichts hinterlassen', r.danachMarken === 0, JSON.stringify(r));
  /* KEIN SCHRITT IM VERLAUF. Ein „Zurück", das einen Laserstrahl
     zurücknimmt, wäre ein Schritt, den niemand gemacht hat. */
  p('Er steht auch nicht im Verlauf', r.zurueckMoeglich === false, JSON.stringify(r));

  await s.click('.blatt-werk [data-act="laserart"][data-laser="linie"]');
  await s.waitForTimeout(150);
  gleich('Die gewählte Art wird gemerkt', await s.evaluate(`Store.getMeta('zeichnen:laser')`), 'linie');
  await s.close();
}

/* ═══ §3 Vier Plätze für die Leiste ════════════════════════════════════════ */
console.log('\n§3 Die Leiste lässt sich verschieben');
{
  const s = await mitBlatt();
  const knopfDa = await s.evaluate(`!!document.querySelector('.blatt-werk [data-act="lage"]')`);
  p('Es gibt einen Knopf für den Platz', knopfDa);
  const runde: string[] = [];
  for (let n = 0; n < 4; n++) {
    await s.click('.blatt-werk [data-act="lage"]');
    await s.waitForTimeout(160);
    runde.push(await s.evaluate(`document.querySelector('.blatt-reihe').dataset.lage`) as string);
  }
  gleich('Vier Plätze im Rundlauf: links, rechts, unten, wieder oben',
    runde, ['links', 'rechts', 'unten', 'oben']);

  /* AN DER SEITE STEHT SIE WIRKLICH AM RAND — gemessen, nicht geglaubt. */
  await s.click('.blatt-werk [data-act="lage"]');   /* → links */
  await s.waitForTimeout(250);
  const lage = JSON.parse(await s.evaluate(`(() => {
    const reihe = document.querySelector('.blatt-reihe');
    const huelle = reihe.closest('.blatt-huelle') || reihe.parentElement;
    const a = reihe.getBoundingClientRect(), h = huelle.getBoundingClientRect();
    const werk = reihe.querySelector('.blatt-werk');
    const knoepfe = [...werk.querySelectorAll('[data-wz]')].slice(0, 4)
      .map(k => Math.round(k.getBoundingClientRect().left));
    return JSON.stringify({ lage: reihe.dataset.lage,
      abstandLinks: Math.round(a.left - h.left), schmal: Math.round(a.width),
      /* Untereinander heisst: die ersten Knöpfe teilen ihre linke Kante. */
      gleicheKante: new Set(knoepfe).size <= 2,
      hoehen: [...werk.querySelectorAll('[data-wz]')].slice(0, 4)
        .map(k => parseFloat(getComputedStyle(k, '::after').height) || 0) });
  })()`) as string);
  gleich('Sie steht links', lage.lage, 'links');
  p('… wirklich am linken Rand des Blattes', lage.abstandLinks >= 0 && lage.abstandLinks <= 12, JSON.stringify(lage));
  p('… als schmale Spalte', lage.schmal > 0 && lage.schmal <= 90, JSON.stringify(lage));
  p('… mit den Knöpfen untereinander', lage.gleicheKante, JSON.stringify(lage));
  p('… und jeder trifft weiterhin 44 px (§37)',
    lage.hoehen.every((h: number) => h >= 44), JSON.stringify(lage.hoehen));

  /* UND DER PLATZ ÜBERLEBT. Neu zeichnen und nachsehen — der Fund aus
     E509 war genau hier: gemerkt ja, angewandt erst beim nächsten Klick. */
  await s.evaluate(`App.zeichneSeite()`);
  await s.waitForTimeout(500);
  gleich('Nach dem Neuzeichnen steht sie immer noch links',
    await s.evaluate(`document.querySelector('.blatt-reihe').dataset.lage`), 'links');
  gleich('… und es ist gemerkt', await s.evaluate(`Store.getMeta('zeichnen:leistenlage')`), 'links');
  await s.close();
}

/* ═══ §5 Die Zeichen sind gezeichnet, nicht getippt (E515) ════════════════
 * Redur, 9. September, mit einem Ausschnitt der GoodNotes-Leiste:
 * „nehme die Symbole für die Redion bitte 1:1."
 *
 * Die Leiste trug ✎ ⌖ 🖍 ▰ □ ▬ 🗒 T ⚡ ⭐ 🖼 ⌫ ⦿ — dreizehn Zeichen aus fünf
 * Welten. `register/symbole.ts` beschreibt seit jeher, warum das nicht geht:
 * Emoji sind Bilder, keine Zeichen; sie tragen eigene Farbe und Stärke und
 * sehen auf jedem System anders aus.
 *
 * WAS HIER GEMESSEN WIRD, ist nicht „sieht gut aus", sondern dreierlei:
 * jedes Werkzeug hat ein Zeichen, das Zeichen ist WIRKLICH gemalt (ein
 * leeres `data-sym` sieht aus wie nichts), und in der Leiste steht kein
 * Emoji mehr.
 * ------------------------------------------------------------------------ */
console.log('\n§5 Gezeichnete Zeichen statt Emoji');
{
  const s = await mitBlatt();
  await s.click('.blatt-werk [data-wz="stift"]');
  await s.waitForTimeout(250);
  const r = JSON.parse(await s.evaluate(`(() => {
    const werk = document.querySelector('.blatt-werk');
    const felder = [...werk.querySelectorAll('[data-sym]')];
    /* EIN LEERES FELD IST EIN FEHLER, kein leeres Feld: das Register malt
       nur, was es kennt, und lässt Unbekanntes stehen. */
    const leer = felder.filter(f => !f.querySelector('svg')).map(f => f.dataset.sym);
    /* KEINE FLÄCHE, NUR STRICHE — das Raster dieser Datei. */
    const gefuellt = felder.filter(f => {
      const p = f.querySelector('path, rect, circle, ellipse');
      return p && p.getAttribute('fill') && p.getAttribute('fill') !== 'none';
    }).length;
    /* WAS AN TEXT ÜBRIG IST. Erlaubt sind genau drei Sorten: die
       Schriftknöpfe (A+, A−, F, ▭ — Buchstaben sagen dort mehr als
       Striche), die zwei Laserarten, die IHR MUSTER zeigen, und das „Aa".
       Das „Aa" ist kein Emoji, sondern eine SCHRIFTPROBE: es steht in der
       gerade gewählten Familie und zeigt damit genau das, was ein
       gezeichnetes Zeichen nicht zeigen könnte — wie die Schrift aussieht.
       Ein Strichzeichen an dieser Stelle wäre eine Verschlechterung. */
    const erlaubt = new Set(['A+', 'A−', 'F', '▭', '•', '⌇', 'Aa']);
    const text = [...werk.querySelectorAll('.zeichen:not([data-sym])')]
      .map(z => (z.textContent || '').trim()).filter(t => t && !erlaubt.has(t));
    return JSON.stringify({
      zeichen: felder.length, leer, gefuellt, text,
      /* Und jedes WERKZEUG hat eins. */
      ohneSym: Marken.WERKZEUGE.filter(w => !w.sym).map(w => w.id),
      unbekannt: Marken.WERKZEUGE.filter(w => w.sym && !Register.symbole.hat(w.sym)).map(w => w.id),
      formenOhneSym: Marken.FORMEN.filter(f => !f.sym).map(f => f.id)
    });
  })()`) as string);
  p('In der Leiste stehen gezeichnete Zeichen', r.zeichen >= 13, JSON.stringify(r.zeichen));
  p('… und jedes ist wirklich gemalt', r.leer.length === 0, JSON.stringify(r.leer));
  p('… nur Striche, keine Fläche', r.gefuellt === 0, String(r.gefuellt));
  p('Jedes Werkzeug hat ein Zeichen, und das Register kennt es',
    r.ohneSym.length === 0 && r.unbekannt.length === 0, JSON.stringify([r.ohneSym, r.unbekannt]));
  p('Jede Form auch', r.formenOhneSym.length === 0, JSON.stringify(r.formenOhneSym));
  p('Kein Emoji mehr in der Leiste — ausser wo ein Buchstabe mehr sagt',
    r.text.length === 0, JSON.stringify(r.text));

  /* DER FORMKNOPF BLEIBT DIE GEWÄHLTE FORM — auch nach dem Wechsel, und
     auch dann gezeichnet. Der erste Wurf schrieb beim Wechsel wieder ein
     Textzeichen hinein; das fällt erst nach dem ersten Klick auf. */
  await s.click('.blatt-werk [data-wz="formen"]');
  await s.waitForTimeout(200);
  await s.click('.blatt-werk [data-act="formart"][data-form="triangle"]');
  await s.waitForTimeout(250);
  const nach = JSON.parse(await s.evaluate(`(() => {
    const k = document.querySelector('.blatt-werk [data-wz="formen"]');
    const z = k.querySelector('.zeichen');
    return JSON.stringify({ form: k.dataset.form, sym: z ? z.dataset.sym : null,
      gemalt: !!(z && z.querySelector('svg')) });
  })()`) as string);
  gleich('Nach dem Formwechsel trägt der Knopf das Dreieck', nach.sym, 'formTriangle');
  p('… und es ist gezeichnet, nicht getippt', nach.gemalt, JSON.stringify(nach));
  await s.close();
}

/* ══ §7 Sechs Stifte, sechs Bilder ═════════════════════════════════════════
 *
 * DAS BILD HAT ES GEFUNDEN, nicht der Prüflauf: auf dem Zeichenblatt sahen
 * Füller, Kugelschreiber und Bleistift aus wie derselbe schräge Stift mit
 * einer anderen Spitze. Der Kommentar im Register behauptete sogar, sie
 * seien „an ihrer Spitze zu erkennen" — bei 16 px ist eine Spitze zwei
 * Punkte gross.
 *
 * WIE MAN SO ETWAS MISST, statt es anzuschauen: jedes Zeichen wird in
 * 16 × 16 gerastert, und für jedes Paar wird gezählt, wie viele Tintenpunkte
 * beide teilen — Schnitt durch Vereinigung. Gemessen am Bestand vor dieser
 * Reparatur: Kugelschreiber gegen Bleistift 73 %, Füller gegen Bleistift
 * 69 %. Die Paare, die man SOFORT auseinanderhält, lagen bei 24 bis 38 %.
 *
 * DIE GRENZE IST DESHALB 60 % — mitten in der gemessenen Lücke zwischen
 * „zwei Bilder" und „dasselbe Bild". Sie ist keine runde Zahl aus dem
 * Gefühl, sondern die Mitte zwischen 38 und 69.
 * ------------------------------------------------------------------------ */
console.log('\n§7 Sechs Stifte, sechs Bilder');
{
  const s = await mitBlatt();
  const GRENZE = 60;
  const r = JSON.parse(await s.evaluate(`(async () => {
    const namen = Marken.STIFTE.map(x => x.sym);
    const raster = async (n) => {
      const wrap = document.createElement('span');
      wrap.dataset.sym = n; document.body.appendChild(wrap);
      Register.symbole.fuelle(wrap.parentNode);
      const svg = wrap.querySelector('svg');
      if (!svg) { wrap.remove(); return null; }
      const txt = new XMLSerializer().serializeToString(svg);
      const url = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(txt)));
      const img = new Image(); img.width = 16; img.height = 16;
      await new Promise((f, x) => { img.onload = f; img.onerror = x; img.src = url; });
      const c = document.createElement('canvas'); c.width = 16; c.height = 16;
      const g = c.getContext('2d'); g.drawImage(img, 0, 0, 16, 16);
      const d = g.getImageData(0, 0, 16, 16).data;
      const bits = []; let tinte = 0;
      for (let i = 0; i < 256; i++) { const an = d[i*4+3] > 40 ? 1 : 0; bits.push(an); tinte += an; }
      wrap.remove();
      return { bits, tinte };
    };
    const b = {};
    for (const n of namen) b[n] = await raster(n);
    const leer = namen.filter(n => !b[n] || b[n].tinte < 8);
    const paare = [];
    for (let i = 0; i < namen.length; i++) for (let j = i + 1; j < namen.length; j++) {
      const a = b[namen[i]], c = b[namen[j]];
      if (!a || !c) continue;
      let schnitt = 0, vereint = 0;
      for (let k = 0; k < 256; k++) {
        if (a.bits[k] && c.bits[k]) schnitt++;
        if (a.bits[k] || c.bits[k]) vereint++;
      }
      paare.push({ p: namen[i] + '/' + namen[j], gleich: Math.round(100 * schnitt / vereint) });
    }
    paare.sort((x, y) => y.gleich - x.gleich);
    return JSON.stringify({ namen, leer, paare });
  })()`) as string) as { namen: string[]; leer: string[];
                         paare: Array<{ p: string; gleich: number }> };

  gleich('Sechs Stifte, sechs verschiedene Namen', new Set(r.namen).size, 6);
  p('… und jedes Zeichen hat wirklich Tinte auf dem Raster',
    r.leer.length === 0, JSON.stringify(r.leer));
  const schlimmstes = r.paare[0];
  p(`Kein Paar teilt mehr als ${GRENZE} % seiner Tinte`,
    !!schlimmstes && schlimmstes.gleich <= GRENZE,
    schlimmstes ? `${schlimmstes.p} = ${schlimmstes.gleich} %` : 'kein Paar gemessen');
  /* UND DER NAME DAZU, damit der nächste sieht, WELCHE zwei sich nähern —
     eine Zahl allein sagt nicht, wo man hinsehen muss. */
  console.log('      (das ähnlichste Paar: ' +
    (schlimmstes ? schlimmstes.p + ' = ' + schlimmstes.gleich + ' %' : '—') + ')');

  /* DER ZETTEL WAR EIN DOKUMENT. Er stand mit zwei Textzeilen und einer
     Ecke oben da — dasselbe Bild wie ein Blatt, und in derselben Reihe
     steht der Textknopf. Jetzt ist er eine Haftnotiz mit umgeschlagener
     Ecke unten. */
  const zettel = JSON.parse(await s.evaluate(`(() => {
    const d = Register.symbole.alsSvg('inkNote');
    return JSON.stringify({ zeilen: /M7\\.4 13h7/.test(d), da: !!d });
  })()`) as string) as { zeilen: boolean; da: boolean };
  p('Der Zettel trägt keine Textzeilen mehr — er ist kein Dokument',
    !zettel.zeilen, JSON.stringify(zettel));
  await s.close();
}

/* ══ §7b Dreizehn Werkzeuge, dreizehn Bilder ═══════════════════════════════
 *
 * DIESELBE METHODE WIE §7, AUF DIE ANDERE LISTE. §7 misst `Marken.STIFTE` —
 * die sechs Stiftarten. Die dreizehn WERKZEUGE daneben hat bis zum
 * 14. September 2026 niemand gegeneinander gemessen, und genau dort lagen
 * die zwei schlimmsten Paare des ganzen Registers:
 *
 *     inkPen  / inkLaser   69 %      (ein Griffel neben einem Griffel)
 *     inkText / inkImage   64 %      (zweimal derselbe abgerundete Rahmen)
 *
 * Beide über der Grenze, die E515 für die Stifte gezogen hat — und beide
 * stehen in DERSELBEN Reihe unmittelbar nebeneinander, wo der Unterschied
 * am meisten zählt. Nach E577: 52 % das schlimmste Paar.
 *
 * WARUM DER CODE HIER NOCH EINMAL STEHT statt geteilt zu werden: §7 ist ein
 * laufender, grüner Wächter. Ihn zum Teilen umzubauen, um einen zweiten zu
 * bekommen, hiesse zwei Dinge auf einmal zu tun — und wenn danach etwas rot
 * ist, weiss niemand, welches davon (§45).
 * ------------------------------------------------------------------------ */
console.log('\n§7b Dreizehn Werkzeuge, dreizehn Bilder');
{
  const s = await mitBlatt();
  const GRENZE = 60;
  const r = JSON.parse(await s.evaluate(`(async () => {
    const namen = Marken.WERKZEUGE.map(x => x.sym).filter(Boolean);
    const raster = async (n) => {
      const wrap = document.createElement('span');
      wrap.dataset.sym = n; document.body.appendChild(wrap);
      Register.symbole.fuelle(wrap.parentNode);
      const svg = wrap.querySelector('svg');
      if (!svg) { wrap.remove(); return null; }
      const txt = new XMLSerializer().serializeToString(svg);
      const url = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(txt)));
      const img = new Image(); img.width = 16; img.height = 16;
      await new Promise((f, x) => { img.onload = f; img.onerror = x; img.src = url; });
      const c = document.createElement('canvas'); c.width = 16; c.height = 16;
      const g = c.getContext('2d'); g.drawImage(img, 0, 0, 16, 16);
      const d = g.getImageData(0, 0, 16, 16).data;
      const bits = []; let tinte = 0;
      for (let i = 0; i < 256; i++) { const an = d[i*4+3] > 40 ? 1 : 0; bits.push(an); tinte += an; }
      wrap.remove();
      return { bits, tinte };
    };
    const b = {};
    for (const n of namen) b[n] = await raster(n);
    const leer = namen.filter(n => !b[n] || b[n].tinte < 8);
    const paare = [];
    for (let i = 0; i < namen.length; i++) for (let j = i + 1; j < namen.length; j++) {
      const a = b[namen[i]], c = b[namen[j]];
      if (!a || !c) continue;
      let schnitt = 0, vereint = 0;
      for (let k = 0; k < 256; k++) {
        if (a.bits[k] && c.bits[k]) schnitt++;
        if (a.bits[k] || c.bits[k]) vereint++;
      }
      paare.push({ p: namen[i] + '/' + namen[j], gleich: Math.round(100 * schnitt / vereint) });
    }
    paare.sort((x, y) => y.gleich - x.gleich);
    return JSON.stringify({ namen, leer, paare });
  })()`) as string) as { namen: string[]; leer: string[];
                         paare: Array<{ p: string; gleich: number }> };

  gleich('Dreizehn Werkzeuge, dreizehn verschiedene Zeichen', new Set(r.namen).size, 13);
  p('… und jedes hat wirklich Tinte auf dem Raster',
    r.leer.length === 0, JSON.stringify(r.leer));
  const schlimmstes = r.paare[0];
  p(`Kein Paar teilt mehr als ${GRENZE} % seiner Tinte`,
    !!schlimmstes && schlimmstes.gleich <= GRENZE,
    schlimmstes ? `${schlimmstes.p} = ${schlimmstes.gleich} %` : 'kein Paar gemessen');
  console.log('      (das ähnlichste Paar: ' +
    (schlimmstes ? schlimmstes.p + ' = ' + schlimmstes.gleich + ' %' : '—') + ')');
  /* DIE ZWEI NAMENTLICH, damit ein Rückschritt nicht als „irgendein Paar"
     durchgeht: sie sind der Grund, warum es diesen Abschnitt gibt. */
  const paarWert = (name: string) => r.paare.find(x => x.p === name)?.gleich ?? -1;
  p('inkPen und inkLaser sind nicht mehr dasselbe Bild',
    paarWert('inkPen/inkLaser') >= 0 && paarWert('inkPen/inkLaser') <= GRENZE,
    `${paarWert('inkPen/inkLaser')} % (vorher 69)`);
  p('inkText und inkImage auch nicht',
    paarWert('inkText/inkImage') >= 0 && paarWert('inkText/inkImage') <= GRENZE,
    `${paarWert('inkText/inkImage')} % (vorher 64)`);
  await s.close();
}


/* ══ §7c Sieben Formen, sieben Bilder ══════════════════════════════════════
 *
 * DIESELBE METHODE, DIE DRITTE LISTE. §7 misst die sechs Stiftarten, §7b die
 * dreizehn Werkzeuge; die sieben FORMEN hat bis zum 15. September 2026
 * niemand gegeneinander gehalten. Gemessen ergab das drei Paare über der
 * Grenze, die E515 für die Stifte gezogen hat:
 *
 *     formRect     / formRoundrect    75 %
 *     formEllipse  / formRoundrect    72 %
 *     formLine     / formArrow        70 %
 *
 * Die drei stehen alle in DERSELBEN Zeile nebeneinander, und am Telefon
 * tragen die Knöpfe kein Wort mehr (44 × 44 px, nur das Zeichen) — dort ist
 * das Zeichen die einzige Auskunft darüber, welche Form man gerade wählt.
 *
 * WARUM DIESE DREI UND NICHT DIE ANDEREN: `formRoundrect` war `formRect` mit
 * `rx="4.2"` — dieselbe Kontur, vier abgerundete Ecken, und die vier Ecken
 * sind bei 16 px zusammen ein knappes Viertel der Tinte. `formArrow` war
 * `formLine` plus ein Häkchen am Ende.
 *
 * WARUM DER CODE HIER NOCH EINMAL STEHT: derselbe Grund wie bei §7b — §7 und
 * §7b sind laufende, grüne Wächter, und sie zum Teilen umzubauen hiesse zwei
 * Dinge auf einmal zu tun (§45). Dass drei Abschnitte dieselben dreissig
 * Zeilen tragen, steht als L164 in `LUECKEN.md`.
 * ------------------------------------------------------------------------ */
console.log('\n§7c Sieben Formen, sieben Bilder');
{
  const s = await mitBlatt();
  const GRENZE = 60;
  const r = JSON.parse(await s.evaluate(`(async () => {
    const namen = Marken.FORMEN.map(x => x.sym).filter(Boolean);
    const raster = async (n) => {
      const wrap = document.createElement('span');
      wrap.dataset.sym = n; document.body.appendChild(wrap);
      Register.symbole.fuelle(wrap.parentNode);
      const svg = wrap.querySelector('svg');
      if (!svg) { wrap.remove(); return null; }
      const txt = new XMLSerializer().serializeToString(svg);
      const url = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(txt)));
      const img = new Image(); img.width = 16; img.height = 16;
      await new Promise((f, x) => { img.onload = f; img.onerror = x; img.src = url; });
      const c = document.createElement('canvas'); c.width = 16; c.height = 16;
      const g = c.getContext('2d'); g.drawImage(img, 0, 0, 16, 16);
      const d = g.getImageData(0, 0, 16, 16).data;
      const bits = []; let tinte = 0;
      for (let i = 0; i < 256; i++) { const an = d[i*4+3] > 40 ? 1 : 0; bits.push(an); tinte += an; }
      wrap.remove();
      return { bits, tinte };
    };
    const b = {};
    for (const n of namen) b[n] = await raster(n);
    const leer = namen.filter(n => !b[n] || b[n].tinte < 8);
    const paare = [];
    for (let i = 0; i < namen.length; i++) for (let j = i + 1; j < namen.length; j++) {
      const a = b[namen[i]], c = b[namen[j]];
      if (!a || !c) continue;
      let schnitt = 0, vereint = 0;
      for (let k = 0; k < 256; k++) {
        if (a.bits[k] && c.bits[k]) schnitt++;
        if (a.bits[k] || c.bits[k]) vereint++;
      }
      paare.push({ p: namen[i] + '/' + namen[j], gleich: Math.round(100 * schnitt / vereint) });
    }
    paare.sort((x, y) => y.gleich - x.gleich);
    return JSON.stringify({ namen, leer, paare });
  })()`) as string) as { namen: string[]; leer: string[];
                         paare: Array<{ p: string; gleich: number }> };

  gleich('Sieben Formen, sieben verschiedene Zeichen', new Set(r.namen).size, 7);
  p('… und jedes hat wirklich Tinte auf dem Raster',
    r.leer.length === 0, JSON.stringify(r.leer));
  const schlimmstes = r.paare[0];
  p(`Kein Formenpaar teilt mehr als ${GRENZE} % seiner Tinte`,
    !!schlimmstes && schlimmstes.gleich <= GRENZE,
    schlimmstes ? `${schlimmstes.p} = ${schlimmstes.gleich} %` : 'kein Paar gemessen');
  console.log('      (das ähnlichste Paar: ' +
    (schlimmstes ? schlimmstes.p + ' = ' + schlimmstes.gleich + ' %' : '—') + ')');
  /* DIE DREI NAMENTLICH, damit ein Rückschritt nicht als „irgendein Paar"
     durchgeht: sie sind der Grund, warum es diesen Abschnitt gibt. */
  const paarWert = (name: string) => r.paare.find(x => x.p === name)?.gleich ?? -1;
  for (const [name, vorher] of [['formRect/formRoundrect', 75],
                                ['formEllipse/formRoundrect', 72],
                                ['formLine/formArrow', 70]] as const) {
    p(`${name} ist nicht mehr dasselbe Bild`,
      paarWert(name) >= 0 && paarWert(name) <= GRENZE,
      `${paarWert(name)} % (vorher ${vorher})`);
  }
  await s.close();
}


/* ═══ §4 Quellen ═══════════════════════════════════════════════════════════ */
console.log('\n§6 Quellen');
p('Die Stiftreihe steht EINMAL im Quelltext, aus dem Katalog gebaut',
  /STIFTE\.map\(st => `<button data-act="stilwahl"/.test(lies('src/bereiche/pdf/marken.ts')));
p('Der Laser hat einen eigenen Katalog', /const LASER = \[/.test(lies('src/bereiche/pdf/marken.ts')));
p('Die vier Plätze auch', /const LAGEN = \[/.test(lies('src/bereiche/pdf/marken.ts')));
p('Das Stilblatt kennt alle vier',
  ['links', 'rechts', 'unten'].every(l =>
    new RegExp('data-lage="' + l + '"').test(lies('quell/schale/stil/bausteine.css'))));
p('Das erzeugte JS trägt alles',
  /stilwahl/.test(lies('quell/bereiche/pdf/marken.js'))
  && /laserAn/.test(lies('quell/bereiche/pdf/marken.js'))
  && /leistenlage/.test(lies('quell/bereiche/pdf/marken.js')));
p('Keine Seitenfehler', fehler.length === 0, fehler.slice(0, 3).join(' | '));

console.log(`\n${ok}/${ok + weg} bestanden · ✗=${weg}`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
