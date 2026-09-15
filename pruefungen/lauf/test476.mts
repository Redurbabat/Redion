/* Suite 476 — Der Blick in den Ordner kommt beim Hinschauen (E508)
 * ============================================================================
 * Redur, 8. September, mit zwei Bildern der Ordnerkarte: „das sieht brutal
 * gut aus … so was wollte ich haben. Könntest du nicht, wenn ich klicke,
 * das kommen, sondern wenn ich mit Maus drauf gehe? Und ich will, dass du
 * es bisschen lustig machst."
 *
 * Also: die Karte kommt beim ÜBERFAHREN. Aber der Klick bleibt — §37 nennt
 * das Telefon den Normalfall, und dort gibt es kein Überfahren. Eine
 * Bedienung, die nur mit der Maus geht, ist eine halbe Bedienung.
 *
 *   §1 DIE MAUS ÖFFNET, OHNE ZU KLICKEN — nach einer kurzen Wartezeit.
 *   §2 EIN KURZES ÜBERSTREICHEN ÖFFNET NICHTS. Wer mit der Maus über das
 *      Regal fährt, soll nicht fünf Karten hinter sich aufklappen sehen.
 *   §3 DER ZEIGER DARF IN DIE KARTE WANDERN, ohne dass sie zugeht — sonst
 *      wäre sie zu sehen und nicht zu benutzen.
 *   §4 UND WEG IST WEG: verlässt der Zeiger beides, klappt sie zu.
 *   §5 DER KLICK BLEIBT, und eine geklickte Karte bleibt offen. Wer sie
 *      antippt, will sie halten — nicht, dass sie beim Wegziehen der Hand
 *      verschwindet.
 *   §6 EINE BERÜHRUNG ÖFFNET NICHT PER ÜBERFAHREN. `pointerType: touch`
 *      meldet auf manchen Geräten ein Hover, das kein Hover ist.
 *   §7 DAS LUSTIGE: die Blätter fächern NACHEINANDER heraus, nicht alle
 *      auf einmal — und jedes hebt sich, wenn man darauf zeigt.
 *   §8 UND ES LÄSST SICH ABSTELLEN: `prefers-reduced-motion` nimmt die
 *      Staffelung weg (§39).
 *   §9 QUELLEN, keine Seitenfehler.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 * Vor dem Bauen war sie es in §1 bis §4 und §7. Die Gegenproben danach
 * stehen in ENTSCHEIDUNGEN.md unter E508.
 *
 *   node pruefungen/lauf/test476.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import type { Page } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

declare const Store: any; declare const App: any; declare const Bibliothek: any;

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9596;
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

/** Die Bibliothek mit einem Ordner voller Sachen. */
const mitOrdner = async (): Promise<Page> => {
  const s = await browser.newPage({ viewport: { width: 1280, height: 950 } });
  s.on('pageerror', e => fehler.push(e.message.slice(0, 140)));
  s.on('dialog', d => d.dismiss().catch(() => {}));
  await s.goto(`http://localhost:${PORT}/index.html`);
  await s.waitForFunction("typeof App !== 'undefined' && typeof Store !== 'undefined'");
  await s.evaluate(`(async () => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    document.querySelector('.produkt-onboarding-lage')?.remove();
    document.getElementById('rg-willkommen')?.remove();
    /* heftArt 'fach' ist das, woran artVon einen Ordner erkennt —
       nachgesehen in bibliothek.ts, nicht geraten (E21). */
    const fach = Store.addPage(null, { text: 'BT-Arbeitssicherheit', icon: '📁', heftArt: 'fach' });
    ['Chemie für Elektroberufe', 'Schutzmassnahmen', 'Erste Hilfe',
     'Gefahrstoffe', 'Prüfprotokoll', 'Anhang'].forEach(t =>
      Store.addPage(fach.id, { text: t }));
    await Store.flush();
  })()`);
  return s;
};

/** Zur Bibliothek gehen und den Blick-Knopf finden. */
const zumRegal = async (s: Page): Promise<void> => {
  await s.evaluate('Bibliothek.oeffne()');
  await s.waitForSelector('.bib-blick[data-blick]', { timeout: 20000 });
  await s.waitForTimeout(400);
};

/** Den Zeiger auf ein Element setzen — als MAUS, wie ein Mensch. */
const zeigeAuf = async (s: Page, wahl: string, art = 'mouse'): Promise<void> => {
  await s.evaluate(`(() => {
    const el = document.querySelector('${wahl}');
    if (!el) return;
    const r = el.getBoundingClientRect();
    const mitte = { clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 };
    for (const typ of ['pointerover', 'pointerenter', 'pointermove']) {
      el.dispatchEvent(new PointerEvent(typ, { bubbles: typ !== 'pointerenter',
        cancelable: true, pointerId: 1, pointerType: '${art}', isPrimary: true, ...mitte }));
    }
  })()`);
};
const zeigeWeg = async (s: Page, wahl: string, art = 'mouse'): Promise<void> => {
  await s.evaluate(`(() => {
    const el = document.querySelector('${wahl}');
    if (!el) return;
    for (const typ of ['pointerout', 'pointerleave']) {
      el.dispatchEvent(new PointerEvent(typ, { bubbles: typ !== 'pointerleave',
        cancelable: true, pointerId: 1, pointerType: '${art}', isPrimary: true,
        clientX: 5, clientY: 5 }));
    }
  })()`);
};
const karteDa = async (s: Page): Promise<boolean> =>
  await s.evaluate(`!!document.querySelector('.ru-fach-lage')`) as boolean;

/* ═══ §1/§2 Die Maus öffnet — aber nicht sofort ════════════════════════════ */
console.log('\n§1 Die Maus öffnet die Karte, ohne zu klicken');
{
  const s = await mitOrdner();
  await zumRegal(s);
  await zeigeAuf(s, '.bib-blick[data-blick]');
  await s.waitForTimeout(700);
  p('Nach kurzem Verweilen steht die Karte da', await karteDa(s));
  const inhalt = JSON.parse(await s.evaluate(`(() => {
    const k = document.querySelector('.ru-fach-lage');
    if (!k) return JSON.stringify({ da: false });
    return JSON.stringify({ da: true,
      offen: k.querySelector('.ru-fach')?.dataset.offen,
      blaetter: k.querySelectorAll('.ru-fach-blatt').length,
      name: (k.querySelector('.ru-fach-name') || {}).textContent || '' });
  })()`) as string);
  gleich('… und sie ist aufgeklappt', inhalt.offen, 'ja');
  p('… mit echten Blättern darin', inhalt.blaetter >= 5, String(inhalt.blaetter));
  await s.close();
}

console.log('\n§2 Ein kurzes Überstreichen öffnet nichts');
{
  const s = await mitOrdner();
  await zumRegal(s);
  await zeigeAuf(s, '.bib-blick[data-blick]');
  await s.waitForTimeout(90);
  /* IM AUGENBLICK DES VORBEIFAHRENS MESSEN, nicht danach. Der erste
     Entwurf sah erst nach dem Weggehen nach — und dann ist die Karte auch
     ohne Wartezeit wieder zu, weil das Zuklappen sie holt. Die Gegenprobe
     (Wartezeit auf null) blieb deshalb grün: ein Wächter, der den Fehler
     nicht sehen kann, den er bewachen soll (§55.2). */
  p('Nach 90 ms Verweilen steht noch nichts da', !(await karteDa(s)));
  await zeigeWeg(s, '.bib-blick[data-blick]');
  await s.waitForTimeout(700);
  p('… und nach dem Weggehen erst recht nicht', !(await karteDa(s)));
  await s.close();
}

/* ═══ §3/§4 In die Karte hinein und wieder weg ═════════════════════════════ */
console.log('\n§3 Der Zeiger darf in die Karte wandern');
{
  const s = await mitOrdner();
  await zumRegal(s);
  await zeigeAuf(s, '.bib-blick[data-blick]');
  await s.waitForTimeout(700);
  p('Die Karte ist offen', await karteDa(s));
  /* VOM KNOPF WEG, DANN IN DIE KARTE — in dieser Reihenfolge, denn so
     meldet es der Browser: erst verlässt der Zeiger den Knopf, dann
     erreicht er die Karte. Andersherum geprüft wäre es eine Bewegung, die
     es nicht gibt. */
  await zeigeWeg(s, '.bib-blick[data-blick]');
  await zeigeAuf(s, '.ru-fach-lage');
  await s.waitForTimeout(600);
  p('Sie bleibt stehen, während der Zeiger auf ihr liegt', await karteDa(s));
  /* Und ein Blatt lässt sich wirklich treffen. */
  const trifft = await s.evaluate(`(() => {
    const b = document.querySelector('.ru-fach-blatt');
    if (!b) return false;
    const r = b.getBoundingClientRect();
    return r.width > 20 && r.height > 10 && document.elementFromPoint(
      Math.round(r.left + r.width / 2), Math.round(r.bottom - 8))?.closest('.ru-fach-blatt') === b;
  })()`) as boolean;
  p('… und ein Blatt ist mit dem Zeiger zu treffen', trifft);

  console.log('\n§4 Und weg ist weg');
  await zeigeWeg(s, '.ru-fach-lage');
  await s.waitForTimeout(700);
  p('Verlässt der Zeiger beides, klappt sie zu', !(await karteDa(s)));
  await s.close();
}

/* ═══ §5 Der Klick bleibt ══════════════════════════════════════════════════ */
console.log('\n§5 Der Klick bleibt — und hält');
{
  const s = await mitOrdner();
  await zumRegal(s);
  await s.click('.bib-blick[data-blick]');
  await s.waitForTimeout(400);
  p('Ein Klick öffnet die Karte', await karteDa(s));
  await zeigeWeg(s, '.bib-blick[data-blick]');
  await zeigeWeg(s, '.ru-fach-lage');
  await s.waitForTimeout(800);
  p('… und sie bleibt offen, auch wenn der Zeiger weggeht', await karteDa(s));
  await s.keyboard.press('Escape');
  await s.waitForTimeout(300);
  p('Escape schliesst sie (§38)', !(await karteDa(s)));
  await s.close();
}

/* ═══ §6 Der Finger öffnet nicht per Hover ═════════════════════════════════ */
console.log('\n§6 Eine Berührung öffnet nicht per Überfahren');
{
  const s = await mitOrdner();
  await zumRegal(s);
  await zeigeAuf(s, '.bib-blick[data-blick]', 'touch');
  await s.waitForTimeout(800);
  p('Ein Finger allein öffnet nichts — dafür ist der Tipp da', !(await karteDa(s)));
  await s.close();
}

/* ═══ §7/§8 Das Lustige ════════════════════════════════════════════════════ */
console.log('\n§7 Die Blätter fächern nacheinander heraus');
{
  const s = await mitOrdner();
  await zumRegal(s);
  await zeigeAuf(s, '.bib-blick[data-blick]');
  await s.waitForTimeout(700);
  const r = JSON.parse(await s.evaluate(`(() => {
    const blaetter = Array.from(document.querySelectorAll('.ru-fach-blatt'));
    const verzug = blaetter.map(b => {
      const st = getComputedStyle(b);
      return { nr: b.dataset.nr, delay: st.transitionDelay, dauer: st.transitionDuration };
    });
    return JSON.stringify({ verzug });
  })()`) as string);
  /* DAS HEBEN WIRD GEMESSEN, NICHT GESUCHT. Eine Regel `.ru-fach-blatt:hover`
     gab es schon (E459), und ein `@keyframes ru-fach-puls` auch — beide
     Zusagen waren grün, bevor irgendetwas gebaut war. Eine Zusage, die vor
     der Arbeit grün ist, ist keine (§55.2). Also: den Zeiger wirklich auf
     ein Blatt setzen und nachsehen, ob sich etwas bewegt. */
  /* MIT DER ECHTEN MAUS. Ein gesendetes `pointerover` lässt CSS `:hover`
     kalt — das entscheidet der Browser nach der wirklichen Zeigerlage.
     Der erste Versuch mass deshalb zweimal denselben Wert und wäre grün
     geblieben, egal was im Stilblatt steht (§55.2). */
  /* ══ ERST LIEGEN LASSEN, DANN ZIELEN (E582) ═══════════════════════════════
     Diese Stelle war seit mindestens E571 rot, und der Grund war kein Fehler
     im Produkt: das Rechteck wurde gelesen, WÄHREND die Blätter noch aus dem
     Fach fliegen (Verzug bis 0,152 s plus Übergang mit Überschwingen), und
     die Maus dann dorthin gesetzt, wo das Blatt EINMAL war. Gemessen an der
     laufenden App: `elementFromPoint` traf das Blatt, `:hover` aber nicht —
     und in einem zweiten Lauf lag der Punkt sogar 226 px daneben, weil die
     Karte selbst an einer anderen Stelle aufging.
     Jetzt wird gewartet, bis das Blatt zwei Messungen lang an derselben
     Stelle liegt. Eine Prüfung, die auf eine Animation zielt, misst die
     Animation, nicht die Regel. */
  await s.waitForFunction(`(() => {
    const b = document.querySelector('.ru-fach-blatt');
    if (!b) return false;
    const jetzt = Math.round(b.getBoundingClientRect().top * 10) / 10;
    const vorher = (window as any).__ruhe;
    (window as any).__ruhe = jetzt;
    return vorher === jetzt;
  })()`.replace(/ as any/g, ''), null, { timeout: 8000 }).catch(() => { /* dann misst die Zusage es */ });
  const kasten = JSON.parse(await s.evaluate(`(() => {
    const b = document.querySelector('.ru-fach-blatt');
    if (!b) return JSON.stringify({ da: false });
    const r = b.getBoundingClientRect();
    return JSON.stringify({ da: true, oben: Math.round(r.top * 10) / 10,
      x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2),
      translate: String(getComputedStyle(b).translate) });
  })()`) as string);
  if (kasten.da) await s.mouse.move(kasten.x, kasten.y);
  await s.waitForTimeout(600);
  const nachher = JSON.parse(await s.evaluate(`(() => {
    const b = document.querySelector('.ru-fach-blatt');
    if (!b) return JSON.stringify({ da: false });
    const r = b.getBoundingClientRect();
    return JSON.stringify({ da: true, oben: Math.round(r.top * 10) / 10,
      translate: String(getComputedStyle(b).translate) });
  })()`) as string);
  const zahlen = r.verzug.map((v: any) => parseFloat(String(v.delay)) || 0);
  console.log('     Verzug je Blatt: ' + r.verzug.map((v: any) => v.nr + '=' + v.delay).join(' · '));
  p('Jedes Blatt hat einen eigenen Verzug', new Set(zahlen).size >= 4, JSON.stringify(zahlen));
  /* EINE WELLE IST MONOTON — in welche Richtung, ist Geschmack; dass sie
     nicht springt, ist es nicht. Und die Schritte müssen GLEICH gross
     sein: vier von Hand gewählte Zahlen sahen aus wie eine Welle und
     hatten in der Mitte einen halben Schritt (E508). */
  const schritte = zahlen.slice(1).map((v: number, i: number) =>
    Math.round((v - zahlen[i]!) * 1000) / 1000);
  p('… und sie ist monoton — eine Welle, kein Sprung',
    schritte.every((d: number) => d > 0) || schritte.every((d: number) => d < 0),
    JSON.stringify(zahlen));
  p('… mit gleich grossen Schritten (eine Zahl, nicht vier geratene)',
    new Set(schritte.map((d: number) => Math.abs(d))).size === 1, JSON.stringify(schritte));
  console.log(`     Blatt ruhig: oben ${kasten.oben} (${kasten.translate})`);
  console.log(`     unter dem Zeiger: oben ${nachher.oben} (${nachher.translate})`);
  p('Ein Blatt HEBT sich, wenn der Zeiger darauf liegt',
    kasten.da && nachher.da && nachher.oben < kasten.oben - 4,
    `${kasten.oben} → ${nachher.oben}`);
  await s.close();
}

console.log('\n§8 Wer keine Bewegung will, bekommt keine');
{
  const s = await browser.newPage({ viewport: { width: 1280, height: 950 } });
  s.on('pageerror', e => fehler.push(e.message.slice(0, 140)));
  await s.emulateMedia({ reducedMotion: 'reduce' });
  await s.goto(`http://localhost:${PORT}/index.html`);
  await s.waitForFunction("typeof App !== 'undefined'");
  await s.evaluate(`(async () => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    const fach = Store.addPage(null, { text: 'Ruhig', icon: '📁', heftArt: 'fach' });
    ['a','b','c','d','e','f'].forEach(t => Store.addPage(fach.id, { text: t }));
    await Store.flush();
  })()`);
  await zumRegal(s);
  await zeigeAuf(s, '.bib-blick[data-blick]');
  await s.waitForTimeout(700);
  p('Die Karte kommt auch ohne Bewegung', await karteDa(s));
  const ruhig = JSON.parse(await s.evaluate(`(() => {
    const b = document.querySelector('.ru-fach-blatt');
    if (!b) return JSON.stringify({ da: false });
    const st = getComputedStyle(b);
    return JSON.stringify({ da: true, delay: st.transitionDelay, dauer: st.transitionDuration });
  })()`) as string);
  p('… aber ohne Staffelung', ruhig.da && parseFloat(String(ruhig.delay)) === 0,
    JSON.stringify(ruhig));
  await s.close();
}

/* ═══ §9 Quellen ═══════════════════════════════════════════════════════════ */
console.log('\n§9 Quellen');
{
  const b = lies('src/bereiche/wissen/bibliothek.ts');
  const css = lies('quell/schale/stil/bausteine.css');
  p('Das Überfahren hat eine Wartezeit, keinen Sofortstart',
    /SCHAU_AUF_MS\s*=\s*\d/.test(b) && /SCHAU_ZU_MS\s*=\s*\d/.test(b));
  p('… und gilt nur, wo es wirklich ein Überfahren gibt',
    /hover: hover|pointerType !== 'mouse'|pointerType === 'mouse'/.test(b));
  p('Eine geklickte Karte weiss, dass sie geklickt wurde',
    /geklickt|perKlick|festgehalten/.test(b));
  p('Die Staffelung steht als EINE Zahl im Stilblatt, nicht im Code',
    /--ru-fach-welle:\s*\d+ms/.test(css)
    && /calc\(var\(--ru-fach-welle\) \* 4\)/.test(css));
  p('Und die Karte hat ein bisschen Schwung bekommen',
    /@keyframes ru-fach-wippe/.test(css) && /cubic-bezier\(\.34,1\.36/.test(css));
  p('Und sie ist bei `prefers-reduced-motion` weg',
    /prefers-reduced-motion[\s\S]{0,400}ru-fach/.test(css));
  p('Keine Seitenfehler', fehler.length === 0, fehler.join(' | '));
}

console.log(`\n${ok}/${ok + weg} bestanden · ✗=${weg}`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
