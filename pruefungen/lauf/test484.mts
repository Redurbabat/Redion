/* Suite 484 — Die Leiste ist eine Kapsel, und man wischt zwischen den Bereichen (E526)
 * ============================================================================
 * Redur, 9. September, mit einem Bild der Apple-TV-Leiste:
 *
 *   „Könntets du die reduon unter teil wie erste bild machen … das ich
 *    zwischen bereichen mit maus so wenn ich draus von links nach rechst
 *    oder umketerk dort gehe … jetzt ist bei redion nur wenn man klick kann
 *    man wechseln und ich will nicht nur so haben sondern kannst du so rund
 *    machen"
 *
 * Zwei Dinge, und das zweite hat ein drittes gefunden.
 *
 *   §1 DIE KAPSEL. Sie schwebt (Luft nach links, rechts und unten), und ihr
 *      Radius ist die HALBE HÖHE. Das ist der Unterschied zwischen einer
 *      Kapsel und abgerundeten Ecken; vorher stand dort 20 px bei 60 px
 *      Höhe.
 *   §2 WISCHEN WECHSELT — vorwärts und rückwärts, und zwar über denselben
 *      Weg wie ein Tipp: die Geste DRÜCKT den Nachbarknopf.
 *   §3 KEIN UMLAUF. Von „Mehr" nach links kommt nicht wieder „Dokumente".
 *   §4 WAS NICHT WISCHT: zu kurz, zu schräg, am Bildrand, über etwas, das
 *      waagerecht rollt, im offenen Dokument, beim Zeichnen.
 *   §5 TIPPEN GEHT WEITER — und JEDER Reiter markiert danach sich selbst.
 *      Das ist der dritte Fund: ein Klick auf „Lernen" liess „Heute"
 *      markiert, weil `lernwelt.ts` alle elf Ansichten unter dem Titel
 *      „Lernen & Alltag" anmeldete und dieser Titel in `schale.ts` `heute`
 *      bedeutet. Älter als die Geste, sichtbar geworden durch sie.
 *   §6 AM RECHNER PASSIERT NICHTS. Dort gibt es die Leiste nicht.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 *   §1 → Radius zurück auf `var(--radius-2xl)`: eine Zusage.
 *   §2 → `Wischen.starten()` nicht rufen: vier Zusagen.
 *   §4 → die Randsperre entfernen: eine Zusage.
 *   §5 → den Titel wieder auf „Lernen & Alltag": eine Zusage.
 *
 *   node pruefungen/lauf/test484.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import type { Page } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9604;
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
await new Promise<void>(f => server.listen(PORT, f));

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll),
    `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

const browser = await chromium.launch();
const fehler: string[] = [];
const seite: Page = await browser.newPage({ viewport: { width: 390, height: 844 } });
seite.on('pageerror', e => fehler.push(e.message));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForTimeout(2600);
await seite.evaluate(() => {
  document.getElementById('rg-willkommen')?.remove();
  document.querySelector('.produkt-onboarding-lage')?.remove();
  document.getElementById('rg-einladung')?.remove();
});

const aktiv = (): Promise<string> =>
  seite.evaluate(() => document.querySelector('#handy-oben button.an')?.id ?? 'keiner');

/** Eine Wischbewegung. `dx` negativ heisst nach links, also weiter. */
const wisch = async (dx: number, dy = 2, y = 300, startX?: number): Promise<void> => {
  const x0 = startX ?? (dx < 0 ? 300 : 90);
  await seite.mouse.move(x0, y);
  await seite.mouse.down();
  for (let i = 1; i <= 8; i++) await seite.mouse.move(x0 + dx * i / 8, y + dy * i / 8);
  await seite.mouse.up();
  await seite.waitForTimeout(520);
};

/* ══ §1 DIE KAPSEL ═══════════════════════════════════════════════════════ */
console.log('\n§1 Die Leiste ist eine Kapsel');
{
  const m = await seite.evaluate(() => {
    const el = document.getElementById('handy-oben');
    if (!el) return null;
    const r = el.getBoundingClientRect(), s = getComputedStyle(el);
    return {
      breite: Math.round(r.width), hoehe: Math.round(r.height),
      links: Math.round(r.left), rechts: Math.round(innerWidth - r.right),
      unten: Math.round(innerHeight - r.bottom),
      radius: parseFloat(s.borderTopLeftRadius),
      knoepfe: [...el.querySelectorAll('button')].map(b => Math.round(b.getBoundingClientRect().height))
    };
  });
  p('Die Leiste ist da', !!m, JSON.stringify(m));
  if (m) {
    p('Sie schwebt — Luft links, rechts und unten',
      m.links >= 6 && m.rechts >= 6 && m.unten >= 6, JSON.stringify(m));
    p('Ihr Radius ist die halbe Höhe — sonst ist es keine Kapsel',
      Math.abs(m.radius - m.hoehe / 2) <= 1, `Radius ${m.radius}, Höhe ${m.hoehe}`);
    /* §37: was der Daumen täglich trifft, misst 44 px. */
    p('Jeder Weg ist mindestens 44 px hoch (§37)',
      m.knoepfe.length === 5 && m.knoepfe.every(h => h >= 44), JSON.stringify(m.knoepfe));
  } else { weg += 3; }
}

/* ══ §2 WISCHEN WECHSELT ═════════════════════════════════════════════════ */
console.log('\n§2 Wischen wechselt den Bereich');
{
  await seite.click('#hl-dok'); await seite.waitForTimeout(500);
  gleich('Ausgangspunkt: Dokumente', await aktiv(), 'hl-dok');
  await wisch(-120);
  gleich('Nach links → Heute', await aktiv(), 'hl-start');
  await wisch(-120);
  gleich('Noch einmal links → Lernen', await aktiv(), 'hl-lernen');
  await wisch(+120);
  gleich('Nach rechts → wieder Heute', await aktiv(), 'hl-start');
  const letzte = await seite.evaluate(() => (window as any).Wischen?.letzte?.());
  p('Die Geste sagt selbst, dass sie gewechselt hat',
    letzte?.grund === 'gewechselt', JSON.stringify(letzte));
}

/* ══ §3 KEIN UMLAUF ══════════════════════════════════════════════════════ */
console.log('\n§3 An den Enden ist Schluss');
{
  await seite.click('#hl-dok'); await seite.waitForTimeout(500);
  await wisch(+120);
  gleich('Ganz links, nach rechts → bleibt Dokumente', await aktiv(), 'hl-dok');
  p('… und der Grund ist benannt',
    (await seite.evaluate(() => (window as any).Wischen?.letzte?.()))?.grund === 'kein Nachbar');
  await seite.click('#hl-mehr'); await seite.waitForTimeout(500);
  await wisch(-120);
  gleich('Ganz rechts, nach links → bleibt Mehr', await aktiv(), 'hl-mehr');
}

/* ══ §4 WAS NICHT WISCHT ═════════════════════════════════════════════════ */
console.log('\n§4 Was kein Wischen ist');
{
  await seite.click('#hl-start'); await seite.waitForTimeout(500);
  await wisch(-40);
  gleich('Zu kurz → nichts', await aktiv(), 'hl-start');
  await wisch(-120, 160);
  gleich('Zu schräg → nichts', await aktiv(), 'hl-start');
  /* NACH RECHTS, NICHT NACH LINKS. Hier stand `wisch(-120, 2, 300, 10)`:
     von x=10 um 120 nach links, also bis x=−110. Playwright klemmt die Maus
     am Bildrand ab, der wirkliche Weg war damit kürzer als 70, und die
     Zusage war aus dem falschen Grund grün — die Gegenprobe (Randsperre
     entfernt) blieb ebenfalls grün. Eine Prüfung, die immer „passt schon"
     sagt, ist keine (§55.2). Nach rechts bleibt der Weg im Bild. */
  await wisch(+120, 2, 300, 10);
  gleich('Am Bildrand → nichts (dort hört das Gerät zu)', await aktiv(), 'hl-start');

  /* Die drei Sperren einzeln befragen, statt sie zu erfingern. */
  const sperren = await seite.evaluate(() => {
    const W = (window as any).Wischen;
    const mitte = document.getElementById('scroll') ?? document.body;

    /* Etwas, das waagerecht rollt — eine Tabelle, ein Bilderband. */
    const roller = document.createElement('div');
    roller.style.cssText = 'overflow-x:auto;width:200px';
    const breit = document.createElement('div');
    breit.style.cssText = 'width:900px;height:20px';
    roller.appendChild(breit);
    mitte.appendChild(roller);
    const ueberRoller = W.darf(breit, 200);
    roller.remove();

    const inLeiste = W.darf(document.getElementById('hl-dok'), 200);

    document.body.dataset.dokument = 'an';
    const imDokument = W.darf(mitte, 200);
    delete document.body.dataset.dokument;

    document.body.classList.add('schreibt');
    const beimZeichnen = W.darf(mitte, 200);
    document.body.classList.remove('schreibt');

    return { ueberRoller, inLeiste, imDokument, beimZeichnen, normal: W.darf(mitte, 200) };
  });
  p('Über etwas, das waagerecht rollt: nein', sperren.ueberRoller === false);
  p('Auf der Leiste selbst: nein', sperren.inLeiste === false);
  p('Im offenen Dokument: nein', sperren.imDokument === false);
  p('Beim Zeichnen: nein', sperren.beimZeichnen === false);
  p('Sonst aber ja — die Sperren sperren nicht alles', sperren.normal === true);

  /* UND DIE GESTE MUSS EIN ZWEITES MAL GEHEN. Liegt eine Textauswahl unter
     dem Zeiger — und die entsteht schon beim vorherigen senkrechten Ziehen —,
     macht der Browser aus dem nächsten Ziehen ein TEXT-Ziehen: `dragstart`
     feuert, `pointerup` kommt nie, und die Geste stirbt lautlos. Gemessen mit
     einer Ereignisspur: `down·up · down·up · down·dragstart`. */
  await seite.click('#hl-start'); await seite.waitForTimeout(560);
  await wisch(-120, 200);                       /* senkrecht: wählt Text aus */
  gleich('Senkrecht ziehen wechselt nichts', await aktiv(), 'hl-start');
  await wisch(-120);
  gleich('… und danach wischt es trotzdem noch', await aktiv(), 'hl-lernen');
}

/* ══ §5 TIPPEN GEHT WEITER, UND JEDER REITER MARKIERT SICH ═══════════════ */
console.log('\n§5 Tippen bleibt — und markiert den richtigen Weg');
{
  for (const [id, name] of [['hl-dok', 'Dokumente'], ['hl-start', 'Heute'],
                            ['hl-lernen', 'Lernen'], ['hl-bespr', 'Termine'],
                            ['hl-mehr', 'Mehr']] as const) {
    await seite.click('#' + id); await seite.waitForTimeout(560);
    gleich(`Klick auf ${name} markiert ${name}`, await aktiv(), id);
  }
  /* Und die Quelle des Fundes: der Titel entscheidet den Schauplatz.
     SEIT E748 (L147, Redurs Antwort auf Frage 3) kommt der Titel aus der
     KLAPPE: was oben unter „Heute ^" steht, heisst „Heute", alles andere
     „Lernzentrum". Hier stand der alte Satz wörtlich
     (`start === 'heute' ? 'Heute' : 'Lernzentrum'`) — er hielt die Regel,
     die Redur geändert hat, nicht den Fund. Der Fund bleibt gehalten:
     zwei Titel, kein „Lernen & Alltag". */
  const lern = fs.readFileSync(path.join(WURZEL, 'src/bereiche/wissen/lernwelt.ts'), 'utf8');
  p('Das Lernzentrum meldet sich nicht mehr als „Lernen & Alltag" — der Titel kommt aus der Klappe',
    /klappeVon\(ansicht\)\?\.id === 'heute' \? 'Heute' : 'Lernzentrum'/.test(lern) &&
      /App\.zeigeSonder\(titelVon\(start\)/.test(lern) && !lern.includes("'Lernen & Alltag'"));
}

/* ══ §6 AM RECHNER PASSIERT NICHTS ═══════════════════════════════════════ */
console.log('\n§6 Am Rechner gibt es die Leiste nicht');
{
  await seite.setViewportSize({ width: 1280, height: 860 });
  await seite.waitForTimeout(400);
  const amRechner = await seite.evaluate(() => {
    const W = (window as any).Wischen;
    const el = document.getElementById('handy-oben')!;
    return { sichtbar: getComputedStyle(el).display !== 'none',
             darf: W.darf(document.getElementById('scroll') ?? document.body, 400) };
  });
  p('Die Leiste ist ausgeblendet', amRechner.sichtbar === false);
  p('… und damit wischt dort nichts', amRechner.darf === false);
  await seite.setViewportSize({ width: 390, height: 844 });
}

p('Keine Seitenfehler', fehler.length === 0, fehler.slice(0, 3).join(' | '));

console.log(`\n${ok}/${ok + weg} bestanden · ✗=${weg}`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
