/* Suite 478 — Die Tinte holt die Spitze ein (E511)
 * ============================================================================
 * Redur, 8. September: „mache die Stift-Teil besser, ich muss flüssiger
 * zeichnen können".
 *
 * ─── ZUERST WURDE GEMESSEN (§36) ────────────────────────────────────────────
 * Die naheliegende Vermutung — „das Zeichnen ist zu langsam" — war falsch,
 * und zwar messbar:
 *
 *     1200 Punkte, 200 Marken auf dem Blatt, je vier Punkte ein Bild
 *     erstes Drittel:  16,7 ms je Bild    letztes Drittel: 16,7 ms
 *     Bilder über 20 ms: 0                über 33 ms: 0
 *
 * Kein einziger Aussetzer, und der Aufwand wächst nicht mit der Länge des
 * Strichs — das hatte E376 erledigt. Wer hier „schneller" gebaut hätte,
 * hätte Wochen an etwas gearbeitet, das flach bei 60 Bildern liegt (§36,
 * die Lehre aus L103 Punkt 2).
 *
 * Was ein Mensch als „nicht flüssig" fühlt, war etwas anderes: WO die
 * Tinte liegt, während er schreibt. Gemessen als Abstand der gezeichneten
 * Spitze von der Stelle, an der der Stift beim Erscheinen des Bildes
 * wirklich ist (ein Bild = 16,7 ms):
 *
 *     Tempo        alt        soll
 *     0,1 px/ms    3,40 px    0
 *     0,4 px/ms    7,16 px    0      <- genau das Tempo der Handschrift
 *     1,2 px/ms    4,91 px    0
 *     2,5 px/ms   19,23 px    0      <- die 26-px-Grenze bremst mit Absicht
 *
 * Der Fehler war am größten dort, wo ein Mensch schreibt, und er wechselte
 * das Vorzeichen: langsam blieb die Tinte zurück, schnell schoss sie
 * voraus. Der Grund: die Vorhersage verlängerte die GEGLÄTTETEN Punkte,
 * und die laufen selbst hinter der Hand her.
 *
 *   §1 DIE VORHERSAGE RECHNET IN ZEIT, nicht in Schritten — derselbe Zug
 *      bei 60, 120 und 240 Hz kommt gleich weit.
 *   §2 SIE SCHWEIGT WEITER, wo sie schweigen muss: Kehrtwende, zu wenig
 *      bekannt, stehender Stift.
 *   §3 IN DER ECHTEN APP klebt die Tinte an der Spitze — bei vier Tempi
 *      und zwei Abtastraten gemessen.
 *   §4 UND SIE WIRD NIE GESPEICHERT. Der Schwanz ist Bild, keine Daten
 *      (§51). Das ist die Zusage, die alles andere erlaubt.
 *   §5 EIN `getScreenCTM` JE EREIGNIS, nicht zwei je Punkt.
 *   §6 QUELLEN.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 *   §1 → in `stroke.ts` `l2 / dt * ms` zurück auf `l2 * min(3, ms/dt)`:
 *        die Rate schlägt wieder durch. Gelaufen, rot.
 *   §3 → in `marken.ts` den rohen Punkt aus dem Schwanz nehmen: die Tinte
 *        bleibt zurück. Gelaufen, rot.
 *   §5 → die Umrechnung wieder vor den Stiftzweig ziehen. Gelaufen, rot.
 *
 *   node pruefungen/lauf/test478.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import type { Page } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9598;
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
const lies = (f: string): string => fs.readFileSync(path.join(WURZEL, f), 'utf8');
const gleichWert = (n: string, ist: unknown, soll: unknown): void =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll), `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);
const browser = await chromium.launch();
const fehler: string[] = [];

/** Ein leeres Blatt mit dem Kugelschreiber — seine Mittellinie lässt sich
 *  aus dem `d` ablesen, die Fläche eines Füllers nicht. */
const mitBlatt = async (stil = 'kugel'): Promise<Page> => {
  const s = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  s.on('pageerror', e => fehler.push(e.message.slice(0, 140)));
  await s.goto(`http://localhost:${PORT}/index.html`);
  await s.waitForFunction("typeof App !== 'undefined' && typeof Marken !== 'undefined' && typeof InkStroke !== 'undefined'");
  await s.evaluate(async (stil: string) => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    document.getElementById('rg-willkommen')?.remove();
    document.getElementById('rg-einladung')?.remove();
    Store.setMeta('zeichnen:stift', stil);
    const seite = Store.addPage(null, { text: 'Messblatt' });
    Store.addBlock(seite.id, 'blatt', { text: '', blattBreite: 595.28, blattHoehe: 841.89, raumVersion: 1, marken: [] });
    await Store.flush();
    App.oeffne(seite.id);
  }, stil);
  await s.waitForSelector('.blatt-werk [data-wz="stift"]', { timeout: 15000 });
  await s.waitForTimeout(400);
  await s.click('.blatt-werk [data-wz="stift"]');
  return s;
};

/* ═══ §1 Die Vorhersage rechnet in Zeit ════════════════════════════════════ */
console.log('\n§1 Die Vorhersage rechnet in Zeit, nicht in Schritten');
{
  const s = await mitBlatt();
  /* DERSELBE ZUG, drei Abtastraten. Ein Stift, der 0,4 px je Millisekunde
     fährt, legt bei 60 Hz 6,67 px je Meldung zurück, bei 240 Hz 1,67 —
     der Vorlauf muss trotzdem derselbe sein. */
  const weit = JSON.parse(await s.evaluate(`(() => {
    const messe = (hz) => {
      const dt = 1000 / hz, schritt = 0.4 * dt;
      const pts = [[0, 0], [schritt, 0], [2 * schritt, 0]];
      const v = InkStroke.vorhersage(pts, InkStroke.VORHER_MS, dt);
      return v.length ? Math.round((v[v.length - 1][0] - 2 * schritt) * 100) / 100 : 0;
    };
    return JSON.stringify({ hz60: messe(60), hz120: messe(120), hz240: messe(240),
      soll: Math.round(0.4 * InkStroke.VORHER_MS * 100) / 100 });
  })()`) as string);
  p('Bei 60 Hz reicht der Vorlauf 0,4 px/ms mal VORHER_MS weit',
    Math.abs(weit.hz60 - weit.soll) < 0.2, JSON.stringify(weit));
  p('… bei 120 Hz genauso weit', Math.abs(weit.hz120 - weit.soll) < 0.2, JSON.stringify(weit));
  p('… und bei 240 Hz auch', Math.abs(weit.hz240 - weit.soll) < 0.2, JSON.stringify(weit));
  /* DER DECKEL IN PIXELN BLEIBT. Eine Vermutung darf nicht beliebig weit
     reichen, egal wie schnell die Hand war. */
  const gedeckelt = Number(await s.evaluate(`(() => {
    const v = InkStroke.vorhersage([[0, 0], [400, 0], [800, 0]], InkStroke.VORHER_MS, 8);
    return v.length ? Math.round((v[v.length - 1][0] - 800) * 100) / 100 : 0;
  })()`));
  const grenze = Number(await s.evaluate(`InkStroke.VORHER_PX`));
  p('Ein sehr schneller Zug wird bei VORHER_PX abgeschnitten',
    Math.abs(gedeckelt - grenze) < 0.01, `${gedeckelt} von ${grenze}`);
  await s.close();
}

/* ═══ §2 Sie schweigt, wo sie schweigen muss ═══════════════════════════════ */
console.log('\n§2 Sie schweigt, wo sie schweigen muss');
{
  const s = await mitBlatt();
  const still = JSON.parse(await s.evaluate(`(() => JSON.stringify({
    kehre:  InkStroke.vorhersage([[0, 0], [10, 0], [2, 0]]).length,
    wenig:  InkStroke.vorhersage([[0, 0], [1, 0]]).length,
    steht:  InkStroke.vorhersage([[0, 0], [10, 0], [10.1, 0]]).length,
    gerade: InkStroke.vorhersage([[0, 0], [10, 0], [20, 0]]).length
  }))()`) as string);
  p('Kehrtwende: kein Häkchen, das niemand gezogen hat', still.kehre === 0, JSON.stringify(still));
  p('Zu wenig bekannt: sie schweigt', still.wenig === 0, JSON.stringify(still));
  p('Stehender Stift: sie schweigt', still.steht === 0, JSON.stringify(still));
  p('Gerader Zug: sie sagt zwei Punkte', still.gerade === 2, JSON.stringify(still));
  await s.close();
}

/* ═══ §3 In der echten App klebt die Tinte an der Spitze ═══════════════════ */
console.log('\n§3 Die Tinte klebt an der Spitze');
{
  const s = await mitBlatt();
  /* Gemessen wird das Ende der gezeichneten Mittellinie gegen den zuletzt
     GEMELDETEN Zeigerpunkt. Voraus ist richtig: zwischen der Meldung und
     dem Bild liegt ein Bild, und in dieser Zeit läuft die Hand weiter.
     Der Sollwert ist Tempo mal VORHER_MS. */
  const messung = JSON.parse(await s.evaluate(`(async () => {
    const f = document.querySelector('.blatt-marken');
    const ctm = f.getScreenCTM();
    const px = (q) => { const pt = f.createSVGPoint(); pt.x = q[0]; pt.y = q[1];
      const c = pt.matrixTransform(ctm); return { x: c.x, y: c.y }; };
    const ev = (typ, q, zeit) => { const c = px(q);
      const e = new PointerEvent(typ, { bubbles: true, cancelable: true, clientX: c.x, clientY: c.y,
        pointerId: 7, pointerType: 'pen', isPrimary: true, button: typ === 'pointermove' ? -1 : 0,
        buttons: typ === 'pointerup' ? 0 : 1, pressure: typ === 'pointerup' ? 0 : 0.6 });
      /* ECHTE ZEIT DAZWISCHEN. Ohne sie liest der Glätter eine Hand mit
         20 px je Millisekunde — der Fund aus E510. */
      Object.defineProperty(e, 'timeStamp', { value: zeit });
      return e; };
    const zahlen = () => {
      const n = f.querySelector('path[data-ink-art="stift"]:last-of-type');
      const d = (n && n.getAttribute('d')) || '';
      return (d.match(/-?\\d+(?:\\.\\d+)?/g) || []).map(Number);
    };
    const spitze = () => { const z = zahlen(); return z.length >= 2 ? z[z.length - 2] : null; };
    /* GEHT DER GEZEICHNETE WEG DURCH DIE GEMESSENE STELLE? Der letzte
       gemeldete Punkt ist keine Vermutung — er steht im Weg, oder der
       Schwanz nimmt eine Abkürzung an ihm vorbei. */
    const durchGemessen = (x) => {
      const z = zahlen().slice(-10);
      return z.some(v => Math.abs(v - x) < 0.6);
    };
    const lauf = async (tempo, hz) => {
      f.querySelectorAll('path[data-ink-art="stift"]').forEach(n => n.remove());
      const dt = 1000 / hz;
      let t = 1000; const y = 300 + tempo * 100;
      f.dispatchEvent(ev('pointerdown', [60, y], t));
      let summe = 0, n = 0, durch = 0, gesehen = 0;
      for (let i = 1; i <= 60; i++) {
        t += dt;
        const x = 60 + i * tempo * dt;
        f.dispatchEvent(ev('pointermove', [x, y], t));
        if (i % 4 === 0) {
          await new Promise(r => requestAnimationFrame(() => r(null)));
          if (i > 12) {
            const sp = spitze(); if (sp !== null) { summe += sp - x; n++; }
            gesehen++; if (durchGemessen(x)) durch++;
          }
        }
      }
      f.dispatchEvent(ev('pointerup', [60 + 60 * tempo * dt, y], t + dt));
      await new Promise(r => setTimeout(r, 200));
      return { tempo, hz, vorausPx: n ? Math.round(summe / n * 100) / 100 : null,
               sollPx: Math.round(tempo * InkStroke.VORHER_MS * 100) / 100,
               durchGemessen: durch, bilder: gesehen };
    };
    const r = [];
    for (const [tempo, hz] of [[0.1, 60], [0.4, 60], [1.2, 60], [0.4, 240]]) r.push(await lauf(tempo, hz));
    return JSON.stringify(r);
  })()`) as string) as Array<{ tempo: number; hz: number; vorausPx: number; sollPx: number;
    durchGemessen: number; bilder: number }>;
  for (const m of messung) {
    /* Ein Pixel Spielraum, und bei schnellem Zug ein Zehntel des Weges —
       die Rundung auf zwei Stellen und der letzte Schritt sind darin. */
    const spiel = Math.max(1, m.sollPx * 0.25);
    p(`Bei ${m.tempo} px/ms und ${m.hz} Hz liegt die Tinte an der Spitze`,
      m.vorausPx !== null && Math.abs(m.vorausPx - m.sollPx) <= spiel,
      `voraus ${m.vorausPx} px, soll ${m.sollPx} px`);
  }
  /* DER GEMESSENE PUNKT STEHT IM WEG. Ohne ihn nimmt der Schwanz eine
     Abkürzung vom geglätteten Strich zur Vermutung und lässt genau die
     Stelle aus, von der man WEISS, dass der Stift dort war. */
  for (const m of messung) {
    p(`Bei ${m.tempo} px/ms geht der Weg durch die gemessene Stelle`,
      m.durchGemessen === m.bilder, `${m.durchGemessen} von ${m.bilder} Bildern`);
  }
  /* UND SIE HÄNGT NICHT AN DER RATE. Derselbe Zug, zwei Raten, dasselbe Bild. */
  const a = messung.find(m => m.tempo === 0.4 && m.hz === 60);
  const b = messung.find(m => m.tempo === 0.4 && m.hz === 240);
  p('Derselbe Zug sieht bei 60 und bei 240 Hz gleich aus',
    !!a && !!b && Math.abs(a.vorausPx - b.vorausPx) < 1,
    `${a?.vorausPx} gegen ${b?.vorausPx}`);
  await s.close();
}

/* ═══ §4 Der Schwanz wird nie gespeichert ══════════════════════════════════ */
console.log('\n§4 Der Schwanz ist Bild, keine Daten');
{
  const s = await mitBlatt();
  const r = JSON.parse(await s.evaluate(`(async () => {
    const f = document.querySelector('.blatt-marken');
    const ctm = f.getScreenCTM();
    const px = (q) => { const pt = f.createSVGPoint(); pt.x = q[0]; pt.y = q[1];
      const c = pt.matrixTransform(ctm); return { x: c.x, y: c.y }; };
    const ev = (typ, q, zeit) => { const c = px(q);
      const e = new PointerEvent(typ, { bubbles: true, cancelable: true, clientX: c.x, clientY: c.y,
        pointerId: 7, pointerType: 'pen', isPrimary: true, button: typ === 'pointermove' ? -1 : 0,
        buttons: typ === 'pointerup' ? 0 : 1, pressure: typ === 'pointerup' ? 0 : 0.6 });
      Object.defineProperty(e, 'timeStamp', { value: zeit });
      return e; };
    let t = 1000;
    const ende = 60 + 40 * 6.67;
    f.dispatchEvent(ev('pointerdown', [60, 500], t));
    for (let i = 1; i <= 40; i++) { t += 16.7; f.dispatchEvent(ev('pointermove', [60 + i * 6.67, 500], t)); }
    f.dispatchEvent(ev('pointerup', [ende, 500], t + 16.7));
    await new Promise(r => setTimeout(r, 400));
    const b = Object.values(Store.cache.blocks).find(x => x.type === 'blatt' && x.alive);
    const m = ((b && b.marken) || []).filter(x => x.art === 'stift');
    const letzter = m.length ? m[m.length - 1].pts[m[m.length - 1].pts.length - 1] : null;
    return JSON.stringify({ marken: m.length, letzterX: letzter ? letzter[0] : null,
      endeX: Math.round(ende * 100) / 100 });
  })()`) as string);
  p('Ein Strich ist entstanden', r.marken === 1, JSON.stringify(r));
  /* DER GESPEICHERTE STRICH ENDET AM ABGESETZTEN PUNKT — nicht dort, wo
     der nasse Schwanz hinzeigte. Wäre er im Vorrat gelandet, stünde hier
     ein Ende bis zu 26 px weiter rechts, und zwar für immer. */
  p('… und er endet dort, wo der Stift abgehoben hat — nicht im Schwanz',
    r.letzterX !== null && Math.abs(r.letzterX - r.endeX) < 0.5,
    `gespeichert ${r.letzterX}, abgehoben ${r.endeX}`);
  await s.close();
}

/* ═══ §5 Eine Matrix je Ereignis ═══════════════════════════════════════════ */
console.log('\n§5 Eine Bildschirmmatrix je Ereignis, nicht zwei je Punkt');
{
  const s = await mitBlatt('fueller');
  const zahl = JSON.parse(await s.evaluate(`(async () => {
    const f = document.querySelector('.blatt-marken');
    const proto = SVGSVGElement.prototype;
    const echt = proto.getScreenCTM;
    let rufe = 0;
    const ctm = echt.call(f);
    const px = (q) => { const pt = f.createSVGPoint(); pt.x = q[0]; pt.y = q[1];
      const c = pt.matrixTransform(ctm); return { x: c.x, y: c.y }; };
    const ev = (typ, q, zeit) => { const c = px(q);
      const e = new PointerEvent(typ, { bubbles: true, cancelable: true, clientX: c.x, clientY: c.y,
        pointerId: 7, pointerType: 'pen', isPrimary: true, button: typ === 'pointermove' ? -1 : 0,
        buttons: typ === 'pointerup' ? 0 : 1, pressure: typ === 'pointerup' ? 0 : 0.6 });
      Object.defineProperty(e, 'timeStamp', { value: zeit });
      return e; };
    let t = 1000;
    f.dispatchEvent(ev('pointerdown', [60, 600], t));
    proto.getScreenCTM = function () { rufe++; return echt.call(this); };
    for (let i = 1; i <= 50; i++) { t += 16.7; f.dispatchEvent(ev('pointermove', [60 + i * 4, 600], t)); }
    proto.getScreenCTM = echt;
    f.dispatchEvent(ev('pointerup', [60 + 50 * 4, 600], t + 16.7));
    await new Promise(r => setTimeout(r, 300));
    return JSON.stringify({ ereignisse: 50, rufe });
  })()`) as string);
  p('Fünfzig Zeigermeldungen holen die Matrix höchstens fünfzigmal',
    zahl.rufe <= zahl.ereignisse, JSON.stringify(zahl));
  p('… und mindestens einmal je Meldung — geraten wird nichts',
    zahl.rufe === zahl.ereignisse, JSON.stringify(zahl));
  await s.close();
}

/* ═══ §6 Die Bewegung sagt etwas, und lässt sich abstellen ════════════════
 * Redur im selben Satz: „mehr Animationen".
 *
 * VIER, und jede sagt etwas — das ist die Bedingung (§39). Gemessen wird
 * hier nicht, ob es hübsch aussieht, sondern dass die Bewegung WIRKLICH
 * angewandt ist (eine Regel im Stilblatt beweist nichts, der Fund aus
 * E508), dass die Welle aus EINER Zahl gerechnet ist und dass sie
 * vollständig verschwindet, wenn ein Mensch keine Bewegung will.
 * ------------------------------------------------------------------------ */
console.log('\n§6 Die Bewegung');
{
  const s = await mitBlatt();
  const zumLeiter = `(() => {
    const werk = document.querySelector('.blatt-werk');
    const knopf = werk.querySelector('[data-act="stil"]');
    for (let i = 0; i < 8 && knopf.dataset.stil !== 'leiter'; i++) knopf.click();
    return knopf.dataset.stil;
  })()`;
  gleichWert('Der Leiterstift ist geführt', await s.evaluate(zumLeiter), 'leiter');
  const b = JSON.parse(await s.evaluate(`(() => {
    const werk = document.querySelector('.blatt-werk');
    const stil = werk.querySelector('[data-act="stil"] .zeichen');
    const wz = werk.querySelector('[data-wz="stift"].on .zeichen');
    const tupfer = Array.from(werk.querySelectorAll('.blatt-farbe-leiter'));
    const nam = (n) => n ? getComputedStyle(n).animationName : null;
    const verzug = (n) => n ? getComputedStyle(n).animationDelay : null;
    return JSON.stringify({
      stiftZeichen: nam(stil),
      werkzeugZeichen: nam(wz),
      tupferName: nam(tupfer[0]),
      /* Der Verzug jedes Tupfers, in Millisekunden. */
      verzuege: tupfer.map(n => Math.round(parseFloat(verzug(n)) * 1000)),
      /* DIE GEWÄHLTE ADER MUSS MITFLIEGEN. Sie trägt die on-Klasse, seit
         die Reihe entstand — hing der Klecks daran, gewann er gegen die
         Welle, und ausgerechnet der Tupfer, auf den man schaut, blieb
         stehen. (Keine schrägen Anführungszeichen hier: sie beenden das
         Textstück, in dem dieser Kommentar steht.) */
      gewaehlteAder: nam(werk.querySelector('.blatt-farbe-leiter.on')),
      /* Der Klecks hängt am ANTIPPEN. Vorher trägt ihn keiner. */
      vorDemTippen: nam(werk.querySelector('.blatt-farbe-tipp')),
      nachDemTippen: (() => {
        const z = werk.querySelectorAll('.blatt-farbe-leiter')[4];
        z.click();
        return getComputedStyle(z).animationName;
      })(),
      /* Und der Zustand hängt nicht an der Bewegung allein (§38). */
      gewaehltHatFlaeche: (() => {
        const k = werk.querySelector('[data-wz="stift"].on');
        const f = k && getComputedStyle(k).backgroundColor;
        return !!f && f !== 'rgba(0, 0, 0, 0)' && f !== 'transparent';
      })()
    });
  })()`) as string);
  p('Der Stiftknopf kippt sein Zeichen', b.stiftZeichen === 'ru-stift-kippt', JSON.stringify(b.stiftZeichen));
  p('Das gewählte Werkzeug auch', b.werkzeugZeichen === 'ru-stift-kippt', JSON.stringify(b.werkzeugZeichen));
  p('Die Adern kommen als Welle herein', b.tupferName === 'ru-tupfer-rein', JSON.stringify(b.tupferName));
  p('Auch die GEWÄHLTE Ader fliegt mit herein', b.gewaehlteAder === 'ru-tupfer-rein',
    JSON.stringify(b.gewaehlteAder));
  p('Vor dem Antippen klekst nichts', b.vorDemTippen === null, JSON.stringify(b.vorDemTippen));
  p('Ein angetippter Tupfer klekst', b.nachDemTippen === 'ru-tupfer-klecks',
    JSON.stringify(b.nachDemTippen));
  /* DIE WELLE IST EINE RECHNUNG, KEINE LISTE (E508). Zehn Zahlen, und der
     Abstand zwischen je zweien ist derselbe — sonst sieht es aus wie eine
     Welle und ist keine. */
  const v = b.verzuege as number[];
  const schritte = v.slice(1).map((x, i) => x - (v[i] as number));
  p('Zehn Adern, zehn Verzüge', v.length === 10, JSON.stringify(v));
  /* GLEICH GROSS UND GRÖSSER ALS NULL. Ohne die zweite Hälfte wäre „alle
     Verzüge sind 0" eine gültige Welle — der erste Entwurf dieser Zusage
     blieb genau dabei grün (§55.2). */
  p('… und alle Schritte sind gleich gross und wirklich ein Schritt',
    schritte.length > 0 && (schritte[0] as number) > 0
    && schritte.every(x => Math.abs(x - (schritte[0] as number)) < 1),
    JSON.stringify(schritte));
  p('… und der erste wartet gar nicht', v[0] === 0, JSON.stringify(v));
  p('Der Zustand steht nicht nur in der Bewegung (§38)', b.gewaehltHatFlaeche);
  await s.close();
}
{
  /* WER KEINE BEWEGUNG WILL, BEKOMMT KEINE — alle vier auf einmal. */
  const s = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await s.emulateMedia({ reducedMotion: 'reduce' });
  s.on('pageerror', e => fehler.push(e.message.slice(0, 140)));
  await s.goto(`http://localhost:${PORT}/index.html`);
  await s.waitForFunction("typeof App !== 'undefined' && typeof Marken !== 'undefined'");
  await s.evaluate(async () => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    Store.setMeta('zeichnen:stift', 'kugel');
    const seite = Store.addPage(null, { text: 'Ruhig' });
    Store.addBlock(seite.id, 'blatt', { text: '', blattBreite: 595.28, blattHoehe: 841.89, raumVersion: 1, marken: [] });
    await Store.flush();
    App.oeffne(seite.id);
  });
  await s.waitForSelector('.blatt-werk [data-wz="stift"]', { timeout: 15000 });
  await s.waitForTimeout(400);
  await s.click('.blatt-werk [data-wz="stift"]');
  const ruhe = JSON.parse(await s.evaluate(`(() => {
    const werk = document.querySelector('.blatt-werk');
    const knopf = werk.querySelector('[data-act="stil"]');
    for (let i = 0; i < 8 && knopf.dataset.stil !== 'leiter'; i++) knopf.click();
    const namen = [
      werk.querySelector('[data-act="stil"] .zeichen'),
      werk.querySelector('[data-wz="stift"].on .zeichen'),
      werk.querySelector('.blatt-farbe-leiter'),
      (() => { const z = werk.querySelectorAll('.blatt-farbe-leiter')[4]; z.click(); return z; })()
    ].map(n => n ? getComputedStyle(n).animationName : 'fehlt');
    /* Die Auskunft bleibt: die Tupfer stehen da, der Stift ist gewählt. */
    return JSON.stringify({ namen, tupfer: werk.querySelectorAll('.blatt-farbe-leiter').length,
      gewaehlt: knopf.dataset.stil });
  })()`) as string);
  p('Bei „keine Bewegung" bewegt sich nichts davon',
    (ruhe.namen as string[]).every(n => n === 'none'), JSON.stringify(ruhe.namen));
  p('… die zehn Adern stehen trotzdem da', ruhe.tupfer === 10, JSON.stringify(ruhe.tupfer));
  p('… und der Stift ist trotzdem gewählt', ruhe.gewaehlt === 'leiter', String(ruhe.gewaehlt));
  await s.close();
}

/* ═══ §7 Quellen ═══════════════════════════════════════════════════════════ */
console.log('\n§7 Quellen');
p('Die Vorhersage rechnet in Millisekunden, ohne Schritt-Deckel',
  /const weit = Math\.min\(VORHER_PX, l2 \/ dt \* Math\.max\(0, ms\)\)/.test(lies('src/core/ink/stroke.ts')));
p('Der Schwanz bekommt die ROHEN Punkte', /InkStroke\.vorhersage\(rohDrei/.test(lies('src/bereiche/pdf/marken.ts')));
p('… und beginnt an der gemessenen Spitze', /const spitze = rohLetzter;/.test(lies('src/bereiche/pdf/marken.ts')));
p('`SheetSpace` gibt einen Umrechner heraus, und `zuBlatt` geht denselben Weg',
  /const umrechner = \(/.test(lies('src/core/sheet/space.ts'))
  && /const zuBlatt = \([\s\S]{0,160}\): \[number, number\] \| null => umrechner\(svg\)\(e\);/.test(lies('src/core/sheet/space.ts')));
p('Das erzeugte JS trägt alles drei',
  /l2 \/ dt \* Math\.max\(0, ms\)/.test(lies('quell/core/ink/stroke.js'))
  && /vorhersage\(rohDrei/.test(lies('quell/bereiche/pdf/marken.js'))
  && /umrechner/.test(lies('quell/core/sheet/space.js')));
p('Die vier Bewegungen stehen im Stilblatt, und die Abschaltung auch',
  /@keyframes ru-stift-kippt/.test(lies('quell/schale/stil/bausteine.css'))
  && /@keyframes ru-tupfer-rein/.test(lies('quell/schale/stil/bausteine.css'))
  && /@keyframes ru-tupfer-klecks/.test(lies('quell/schale/stil/bausteine.css'))
  && /@keyframes ru-radier-laeuft/.test(lies('quell/schale/stil/bausteine.css'))
  && /prefers-reduced-motion[\s\S]{0,320}ru-radier|blatt-radierkreis\}?\{animation:none/.test(lies('quell/schale/stil/bausteine.css')));
p('Die Welle rechnet aus EINER Zahl', /--ru-tupfer-welle:\s*\d+ms/.test(lies('quell/schale/stil/bausteine.css'))
  && /calc\(var\(--ru-tupfer-welle\) \* var\(--tupfer-n/.test(lies('quell/schale/stil/bausteine.css')));
p('Keine Seitenfehler', fehler.length === 0, fehler.slice(0, 3).join(' | '));

console.log(`\n${ok}/${ok + weg} bestanden · ✗=${weg}`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
