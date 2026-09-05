/* Suite 389 — Die Einstellungsliste zeigt, was sie hat (E392)
 * ============================================================================
 * GEMESSEN AM 4. SEPTEMBER 2026, bevor etwas geändert wurde. Der UX-Bericht
 * behauptete, die 19 Einstellungsbereiche stünden „auf einer Ebene" und
 * bräuchten Obergruppen. NACHGESEHEN STIMMTE DAS NICHT: es gibt seit Langem
 * vier Gruppen mit sichtbaren Überschriften — am Rechner wie am Telefon.
 *
 * Der wirkliche Fehler stand daneben und war schlimmer:
 *
 *                       Liste braucht   sichtbar   verdeckt
 *   1360 × 900               810 px       718 px     92 px
 *   1280 × 720               810 px       632 px    178 px
 *   1280 × 650               810 px       570 px    240 px
 *
 * Und verdeckt lagen IMMER dieselben Einträge: Speicher, Abrechnung, Über
 * diese App. Nicht auf kleinen Bildschirmen — auf ALLEN, denn `.einst-fenster`
 * war auf `min(720px, 88vh)` gedeckelt und wuchs mit keinem Schirm mit.
 *
 * Dazu stand das Fenster 14vh zu tief: `.overlay` setzt für jedes Fenster
 * `align-items:flex-start; padding-top:14vh`, was für die Suche richtig ist
 * und für ein fast bildschirmhohes Fenster falsch. Bei 1280×720 lag die
 * Unterkante 43 Pixel ausserhalb des Bildes.
 *
 * Der Rollbalken half nicht: in diesem Browser ist er ein Überlagerungs-
 * balken, belegt EIN Pixel und blendet sich aus. Ein Hinweis, der nicht
 * malt, ist keiner (derselbe Fund wie bei der Kontextkante, E388). Also ein
 * eigener Streifen — der wieder verschwindet, sobald man unten ist.
 *
 *   §1 Die vier Gruppen gibt es wirklich (die Berichtsbehauptung ist falsch).
 *   §2 Auf einem gewöhnlichen Schirm fehlt kein Eintrag mehr.
 *   §3 Rollt die Liste, sagt der Streifen es — und schweigt sonst.
 *   §4 Das Fenster passt ins Bild.
 *   §5 Am Telefon bleibt die Zeile ein Fingerziel (§37).
 *
 *   node pruefungen/lauf/test389.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import type { Browser, Page } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9411;

const TYP: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon'
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
  p(n, JSON.stringify(ist) === JSON.stringify(soll),
    `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

const browser: Browser = await chromium.launch();

/** Eine Seite mit offenen Einstellungen. `handy` schaltet das Telefon ein. */
const oeffne = async (w: number, h: number, handy = false): Promise<Page> => {
  const s = await browser.newPage(handy
    ? { viewport: { width: w, height: h }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }
    : { viewport: { width: w, height: h } });
  await s.goto(`http://localhost:${PORT}/index.html`, { waitUntil: 'load' });
  await s.waitForFunction(`typeof Einstellungen === 'object'`, null, { timeout: 20000 });
  await s.waitForTimeout(600);
  /* Der Willkommensrundgang fängt sonst jeden Klick ab. */
  await s.evaluate(`document.getElementById('rg-willkommen')?.remove()`);
  await s.evaluate(`Einstellungen.oeffne()`);
  await s.waitForSelector('.einst-nav', { timeout: 10000 });
  await s.waitForTimeout(350);
  return s;
};

/** Was die Liste gerade tut — in EINEM Griff, damit nichts dazwischenkommt. */
const LAGE = `(() => {
  const nav = document.querySelector('.einst-nav');
  const fen = document.querySelector('.einst-fenster');
  const mehr = document.querySelector('.einst-mehr');
  const fr = fen.getBoundingClientRect();
  const mr = mehr ? mehr.getBoundingClientRect() : { width: 0, height: 0 };
  const nr = nav.getBoundingClientRect();
  const kn = [...nav.querySelectorAll('button')];
  return {
    gruppen: [...nav.querySelectorAll('.einst-grp')]
      .filter(e => e.getBoundingClientRect().height > 0)
      .map(e => e.textContent.trim()),
    gruppenGross: [...nav.querySelectorAll('.einst-grp')]
      .every(e => getComputedStyle(e).textTransform === 'uppercase'),
    letzterSichtbar: (() => {
      const b = kn[kn.length - 1]; if (!b) return false;
      const r = b.getBoundingClientRect();
      return r.top >= nr.top - 1 && r.bottom <= nr.bottom + 1;
    })(),
    knoepfe: kn.length,
    knopfHoehe: kn.length ? Math.round(kn[0].getBoundingClientRect().height) : 0,
    verdeckt: nav.scrollHeight - nav.clientHeight,
    unsichtbar: kn.filter(b => {
      const r = b.getBoundingClientRect();
      return r.bottom > nr.bottom + 1 || r.top < nr.top - 1;
    }).map(b => b.textContent.replace(/\\s+/g, ' ').trim()),
    hatMehr: fen.classList.contains('hat-mehr'),
    mehrSichtbar: Math.round(mr.width) > 0 && Math.round(mr.height) > 0,
    fensterOben: Math.round(fr.top), fensterUnten: Math.round(fr.bottom),
    fensterHoehe: Math.round(fr.height), bildHoehe: window.innerHeight
  };
})()`;

type Lage = {
  gruppen: string[]; gruppenGross: boolean; letzterSichtbar: boolean;
  knoepfe: number; knopfHoehe: number; verdeckt: number;
  unsichtbar: string[]; hatMehr: boolean; mehrSichtbar: boolean;
  fensterOben: number; fensterUnten: number; fensterHoehe: number; bildHoehe: number;
};

/* ==========================================================================
 * §1 · Die vier Gruppen gibt es — die Berichtsbehauptung ist falsch
 * --------------------------------------------------------------------------
 * Der Bericht sagte „19 Kategorien auf einer Ebene". Es sind vier Gruppen:
 * die erste ohne Überschrift (Konto, Einstellungen, Benachrichtigungen,
 * Importieren — die vier, die man täglich braucht), dann drei benannte.
 * Der Abschnitt hält das fest, damit die Behauptung nicht wiederkommt.
 * ========================================================================*/
console.log('\n1 · Die vier Gruppen stehen wirklich da');
{
  const s = await oeffne(1360, 900);
  const l = await s.evaluate(LAGE) as Lage;
  gleich('Drei sichtbare Gruppenüberschriften', l.gruppen,
         ['Funktionen', 'Verwaltung', 'Zugriff und Abrechnung']);
  p('… und sie stehen in Versalien, also als Überschrift', l.gruppenGross);
  gleich('19 Bereiche', l.knoepfe, 19);
  await s.close();
}
{
  const s = await oeffne(390, 844, true);
  const l = await s.evaluate(LAGE) as Lage;
  gleich('Am Telefon dieselben drei Überschriften', l.gruppen,
         ['Funktionen', 'Verwaltung', 'Zugriff und Abrechnung']);
  await s.close();
}

/* ==========================================================================
 * §2 · Auf einem gewöhnlichen Schirm fehlt kein Eintrag mehr
 * --------------------------------------------------------------------------
 * DER ABSCHNITT, DER DEN FEHLER HÄLT. Mit `min(720px, 88vh)` lagen hier drei
 * Einträge ausserhalb; mit `min(920px, 92vh)` keiner. Dreht man die Höhe
 * zurück, wird er rot — nachgeprüft, nicht behauptet.
 * ========================================================================*/
console.log('\n2 · Bei 1360×900 ist die Liste vollständig');
{
  const s = await oeffne(1360, 900);
  const l = await s.evaluate(LAGE) as Lage;
  gleich('Kein Eintrag ausserhalb der Liste', l.unsichtbar, []);
  gleich('Nichts zu rollen', l.verdeckt, 0);
  p('„Über diese App" ist der letzte und steht da',
    !l.unsichtbar.some(t => t.includes('Über diese App')));
  await s.close();
}

/* ==========================================================================
 * §3 · Der Streifen sagt „es geht weiter" — und schweigt sonst
 * --------------------------------------------------------------------------
 * DIE GEGENPROBE IST DER HALBE ABSCHNITT. Eine Anzeige, die immer etwas
 * anzeigt, wird nicht gelesen; diese App ist sechsmal in genau diese Falle
 * gelaufen. Also beides: an, wenn es weitergeht — aus, wenn nicht.
 * ========================================================================*/
console.log('\n3 · Der Hinweis kommt und geht');
{
  const s = await oeffne(1280, 720);
  const oben = await s.evaluate(LAGE) as Lage;
  p('Bei 1280×720 rollt die Liste', oben.verdeckt > 0, `verdeckt ${oben.verdeckt}`);
  p('… und der Streifen steht da', oben.hatMehr && oben.mehrSichtbar,
    `hatMehr ${oben.hatMehr}, sichtbar ${oben.mehrSichtbar}`);

  await s.evaluate(`(() => { const n = document.querySelector('.einst-nav');
                             n.scrollTop = n.scrollHeight; })()`);
  await s.waitForTimeout(250);
  const unten = await s.evaluate(LAGE) as Lage;
  p('Ganz unten schweigt er wieder', !unten.hatMehr && !unten.mehrSichtbar,
    `hatMehr ${unten.hatMehr}, sichtbar ${unten.mehrSichtbar}`);
  p('Und der letzte Eintrag ist dann zu sehen', unten.letzterSichtbar);
  await s.close();
}
{
  const s = await oeffne(1360, 900);
  const l = await s.evaluate(LAGE) as Lage;
  p('Passt alles, schweigt er von Anfang an', !l.hatMehr && !l.mehrSichtbar,
    `hatMehr ${l.hatMehr}, sichtbar ${l.mehrSichtbar}`);
  await s.close();
}

/* ==========================================================================
 * §4 · Das Fenster passt ins Bild
 * --------------------------------------------------------------------------
 * `.overlay` hängt jedes Fenster 14vh unter den oberen Rand. Für die Suche
 * ist das richtig, für ein 92-vh-Fenster nicht: die Unterkante lag 43 px
 * ausserhalb. Geprüft wird die Unterkante, nicht die Regel — eine Prüfung
 * auf `align-items:center` würde nur die Schreibweise wiederholen.
 * ========================================================================*/
console.log('\n4 · Ober- und Unterkante liegen im Bild');
for (const [w, h] of [[1360, 900], [1280, 720], [1280, 650]] as const) {
  const s = await oeffne(w, h);
  const l = await s.evaluate(LAGE) as Lage;
  p(`${w}×${h}: Oberkante nicht über dem Bild`, l.fensterOben >= 0, `${l.fensterOben}`);
  p(`${w}×${h}: Unterkante nicht unter dem Bild`, l.fensterUnten <= l.bildHoehe,
    `${l.fensterUnten} von ${l.bildHoehe}`);
  await s.close();
}

/* ==========================================================================
 * §5 · Am Telefon bleibt die Zeile ein Fingerziel (§37)
 * --------------------------------------------------------------------------
 * Am Rechner wurde das Polster von 7 auf 6 Pixel gesetzt, damit die Liste
 * ganz hineinpasst. Am Telefon hat dieselbe Zeile eine eigene Regel mit
 * `min-height:52px`. Dieser Abschnitt hält fest, dass die Rechnerzeile die
 * Telefonzeile nicht mitzieht — sonst wäre §37 mit einem Zeichen verletzt.
 * ========================================================================*/
console.log('\n5 · Die Telefonzeile bleibt gross genug');
{
  const s = await oeffne(390, 844, true);
  const l = await s.evaluate(LAGE) as Lage;
  p('Zeilenhöhe mindestens 44 px (§37)', l.knopfHoehe >= 44, `${l.knopfHoehe} px`);
  await s.close();
}

await browser.close();
server.close();

console.log(`\n${ok} von ${ok + weg} Prüfungen grün`);
process.exit(weg ? 1 : 0);
