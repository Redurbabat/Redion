/* Suite 504 — „Präsentation" ist ein Weg, und sie hat fertige Folienvorlagen
 * ============================================================================
 * Redur, 13. September: „könntest du so eine PowerPoint-Modus im Menü
 * einfügen … oben mit Menü, links Seiten, so dass ich Präsentation erstellen
 * könnte, füge dort auch fertige Vorlagen."
 *
 * Was es SCHON gab und was gefehlt hat — nachgemessen, nicht erinnert:
 *
 *   da     Die Ansicht. Der Dokumentmodus hat die Leiste oben und die
 *          Folienliste links (E546), und die Liste zeigt seit E547 wirklich
 *          Folien. „Präsentieren" und „Drucken" stehen daneben.
 *   da     Die Handgriffe. Einfügen, Duplizieren, Löschen, Verschieben gibt
 *          es seit G3 im Menü jeder Folie.
 *   FEHLT  Der WEG hinein. Im Anlegen-Menü standen dreizehn Wege — Notizbuch,
 *          Blatt, Whiteboard, Schaltplan, Datenbank … und kein einziger, der
 *          eine Präsentation anlegt. Wer eine wollte, musste eine Seite
 *          anlegen, ein Blatt hineinsetzen, dessen Masse von Hand auf 16:9
 *          stellen und den Dokumentmodus selbst finden.
 *   FEHLT  Die Vorlagen. Eine neue Folie war immer weisses Papier. In
 *          PowerPoint wählt man ein Layout — Titelfolie, Titel und Inhalt,
 *          zwei Inhalte, Abschnitt —, und genau darum ging Redurs Satz.
 *
 *   §1 DER WEG steht im Anlegen-Katalog und legt eine Präsentation an.
 *   §2 DIE VORLAGEN sind echte Layouts, nicht achtmal dasselbe.
 *   §3 DIE NEUE PRÄSENTATION geht als Foliensatz auf — 16:9, Dokumentmodus.
 *   §4 DER BEFEHL „Neue Folie" hängt eine Folie mit gewähltem Layout an.
 *
 * ─── WAS HIER NICHT GEMESSEN WIRD (§35) ─────────────────────────────────────
 * Dass es „1:1 wie PowerPoint" aussieht. Es gibt kein Menüband mit Reitern
 * (Start · Einfügen · Entwurf · Übergänge), und die Folie rollt durch statt
 * zu stehen. Beides steht als offen in AUFGABEN.md unter O4.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 * Alle vier wirklich gefahren, die Zahlen sind GEMESSEN (27 grün ist gesund):
 *   §1 → den Weg aus dem Anlegen-Katalog nehmen:     24 grün,  3 rot.
 *   §2 → `alle()` gibt eine leere Liste:             20 grün,  7 rot.
 *   §3 → `neuePraesentation` ohne `dokumentModus`:   25 grün,  2 rot.
 *   §4 → den Befehl „Neue Folie" nicht anmelden:     26 grün,  1 rot.
 *
 * §2 fing beim ersten Versuch nur ZWEI statt sieben — und der Grund gehört
 * hierher, weil er der Fehler aus §55.2 in Reinform ist: `every()` auf einer
 * LEEREN Liste ist wahr. Sechs Zusagen sagten also „passt schon" über
 * nichts. Jede davon trägt jetzt ihre Mindestzahl daneben.
 *
 *   node pruefungen/lauf/test504.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
declare const Store: any;
declare const App: any;

declare const Folienvorlagen: any;
declare const Register: any;
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9614;
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
  p(n, ist === soll, 'ist ' + JSON.stringify(ist) + ', soll ' + JSON.stringify(soll));

const browser = await chromium.launch();
const fehler: string[] = [];
const kontext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const seite = await kontext.newPage();
seite.on('pageerror', e => fehler.push(e.message));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForFunction('typeof Store !== "undefined" && typeof App !== "undefined"');
for (let versuch = 0; versuch < 8; versuch++) {
  await seite.evaluate(() => {
    document.querySelectorAll<HTMLElement>('#rg-willkommen [data-a="los"]').forEach(b => b.click());
  });
  await seite.waitForTimeout(250);
  if (!await seite.evaluate(() => !!document.querySelector('#rg-willkommen'))) break;
}
await seite.waitForTimeout(400);

/* ══ §1 DER WEG STEHT IM KATALOG ═════════════════════════════════════════ */
console.log('\n§1 „Präsentation" steht im Anlegen-Menü');
{
  const m = await seite.evaluate(() => {
    /* Der Katalog hängt an `App`, nicht an einem `Schale`-Objekt — der
       erste Entwurf rief `Schale.erstellenWege()` und bekam eine leere
       Liste statt eines Fehlers (E21: nachsehen, nicht erinnern). */
    const wege = typeof App !== 'undefined' && App.erstellenWege
      ? App.erstellenWege() : [];
    const eintrag = wege.find((w: any) => w.id === 'praesentation');
    return {
      zahl: wege.length,
      da: !!eintrag,
      name: eintrag ? eintrag.name : '',
      sub: eintrag ? eintrag.sub : '',
      /* Kein Weg darf zweimal dieselbe Kennung tragen — sonst führt einer
         von beiden ins Leere, und man sieht nicht, welcher. */
      doppelte: wege.length - new Set(wege.map((w: any) => w.id)).size,
    };
  });

  p('Der Weg ist im Katalog', m.da, JSON.stringify(m.name));
  p('Er heisst „Präsentation"', /Präsentation/.test(m.name), m.name);
  p('… und sagt, was man bekommt', /16:9|Folien|Vorlage/i.test(m.sub), m.sub);
  gleich('Keine doppelten Kennungen im Katalog', m.doppelte, 0);
}

/* ══ §2 DIE VORLAGEN SIND ECHTE LAYOUTS ══════════════════════════════════ */
console.log('\n§2 Acht Layouts, und keine zwei gleich');
{
  const m = await seite.evaluate(() => {
    if (typeof Folienvorlagen === 'undefined') return null;
    const liste = Folienvorlagen.alle();
    /* JEDES LAYOUT WIRKLICH BAUEN und ansehen, was herauskommt — nicht die
       Beschreibung lesen. Eine Vorlage, die nichts baut, stünde sonst
       genauso in der Liste wie eine, die es tut. */
    const gebaut = liste.map((v: any) => {
      const marken = Folienvorlagen.marken(v.id, 960, 540);
      return {
        id: v.id, name: v.name,
        zahl: marken.length,
        arten: [...new Set(marken.map((k: any) => k.art))].sort().join(','),
        /* Der Fingerabdruck: Lage und Grösse jeder Marke. Zwei Layouts mit
           demselben Abdruck sind dasselbe Layout unter zwei Namen. */
        abdruck: marken.map((k: any) =>
          k.art + '@' + Math.round(k.point?.[0] ?? k.pts?.[0]?.[0] ?? 0) + ',' +
          Math.round(k.point?.[1] ?? k.pts?.[0]?.[1] ?? 0)).join('|'),
        texte: marken.filter((k: any) => k.art === 'text').map((k: any) => k.text),
      };
    });
    return { liste: liste.length, gebaut };
  });

  p('Es gibt ein Register der Folienvorlagen', !!m);
  if (m) {
    p('Mindestens sechs Layouts', m.liste >= 6, String(m.liste));
    p('Jedes hat einen Namen',
      m.gebaut.length >= 6 && m.gebaut.every((g: any) => !!g.name), String(m.gebaut.length));
    /* „Leer" DARF leer sein — alles andere nicht.
       JEDES `every` BRAUCHT SEINE ZAHL DANEBEN. Auf einer leeren Liste ist
       `every` WAHR, und die Gegenprobe „gar keine Layouts" fing damit nur
       zwei Zusagen statt sechs (gemessen). Genau die Falle aus §55.2: eine
       Prüfung, die immer „passt schon" sagt, ist keine. */
    const ohneLeer = m.gebaut.filter((g: any) => g.id !== 'leer');
    p('Jedes ausser „Leer" bringt Marken mit',
      ohneLeer.length >= 5 && ohneLeer.every((g: any) => g.zahl > 0),
      JSON.stringify(m.gebaut.map((g: any) => g.id + ':' + g.zahl)));
    p('Und jedes ausser „Leer" bringt Text mit, den man ersetzen kann',
      ohneLeer.length >= 5 &&
      ohneLeer.every((g: any) => g.texte.length > 0 && g.texte.every((t: string) => !!t)),
      JSON.stringify(ohneLeer.map((g: any) => g.id + ':' + g.texte.length)));
    p('Keine zwei Layouts sind dasselbe',
      m.gebaut.length >= 6 &&
      new Set(m.gebaut.map((g: any) => g.abdruck)).size === m.gebaut.length,
      new Set(m.gebaut.map((g: any) => g.abdruck)).size + ' von ' + m.gebaut.length);
    p('Die PowerPoint-Klassiker sind dabei',
      ['titel', 'titelInhalt', 'zweiInhalte', 'abschnitt', 'leer']
        .every(id => m.gebaut.some((g: any) => g.id === id)),
      JSON.stringify(m.gebaut.map((g: any) => g.id)));
    /* Jede Marke muss AUF der Folie liegen. Ein Layout, dessen Titel bei
       x = 1200 auf einer 960 breiten Folie steht, ist unsichtbar — und
       niemand sieht es im Code. */
    const drauf = await seite.evaluate(() => {
      const raus: string[] = [];
      for (const v of Folienvorlagen.alle()) {
        for (const k of Folienvorlagen.marken(v.id, 960, 540)) {
          const x = k.point?.[0] ?? k.pts?.[0]?.[0] ?? 0;
          const y = k.point?.[1] ?? k.pts?.[0]?.[1] ?? 0;
          const x2 = (k.pts?.[1]?.[0] ?? (x + (k.breiteBox || 0)));
          const y2 = (k.pts?.[1]?.[1] ?? y);
          if (x < 0 || y < 0 || x2 > 960 || y2 > 540)
            raus.push(v.id + ' ' + k.art + ' ' + [x, y, x2, y2].map(Math.round).join('/'));
        }
      }
      return raus;
    });
    p('Keine Marke ragt über die Folie hinaus',
      m.gebaut.length >= 6 && drauf.length === 0, drauf.join(' | '));
    if (drauf.length) console.log('      → ' + drauf.join(' | '));
  }
}

/* ══ §3 DIE NEUE PRÄSENTATION GEHT ALS FOLIENSATZ AUF ════════════════════ */
console.log('\n§3 Der Weg legt eine 16:9-Präsentation an und schlägt sie auf');
{
  const m = await seite.evaluate(async () => {
    const vorher = Store.rootPages().length;
    /* Ohne Wähler, mit ausdrücklichem Layout — den Wähler prüft §4. */
    const s = Folienvorlagen.neuePraesentation('titelInhalt');
    await new Promise(f => setTimeout(f, 300));
    const blaetter = Store.childrenOf(s.id);
    const erste = blaetter[0];
    return {
      neueSeiten: Store.rootPages().length - vorher,
      dokumentModus: !!Store.getBlock(s.id).dokumentModus,
      icon: Store.getBlock(s.id).icon,
      blaetter: blaetter.length,
      art: erste?.type,
      breite: erste?.blattBreite, hoehe: erste?.blattHoehe,
      marken: (erste?.marken || []).length,
      /* Der Editor darf ihr NICHT eine leere Zeile anhängen (E546). */
      kinder: erste ? Store.childrenOf(erste.id).length : -1,
      id: s.id,
    };
  });

  gleich('Genau eine neue Seite', m.neueSeiten, 1);
  gleich('Sie ist als Foliensatz markiert', m.dokumentModus, true);
  p('Mit dem Folienzeichen', m.icon === '📽️', String(m.icon));
  gleich('Eine Folie steht darauf', m.blaetter, 1);
  gleich('… und die ist ein Blatt', m.art, 'blatt');
  gleich('… in 16:9, nicht A4', Math.round((m.breite / m.hoehe) * 100) / 100, 1.78);
  p('… mit den Marken des Layouts', m.marken >= 2, String(m.marken));
  gleich('… und ohne angehängte Leerzeile (E546)', m.kinder, 0);
}

/* ══ §4 „NEUE FOLIE" HÄNGT EINE AN ═══════════════════════════════════════ */
console.log('\n§4 „Neue Folie" hängt eine Folie mit gewähltem Layout an');
{
  const m = await seite.evaluate(async () => {
    const s = Folienvorlagen.neuePraesentation('titel');
    /* ERST ÖFFNEN. `zeigen()` am Befehl fragt die GERADE offene Seite —
       genau so soll es sein: „Neue Folie" gehört nicht in die Palette,
       wenn gar keine Präsentation offen ist. Der erste Entwurf prüfte
       ohne zu öffnen und hielt das Richtige für einen Fehler. */
    App.oeffne(s.id);
    await new Promise(f => setTimeout(f, 400));
    const vorher = Store.childrenOf(s.id).length;
    const neu = Folienvorlagen.neueFolie(s.id, 'zweiInhalte');
    const blaetter = Store.childrenOf(s.id);
    const befehle = typeof Register !== 'undefined' && Register.befehle
      ? Register.befehle.alle().map((b: any) => b.titel) : [];
    return {
      vorher, nachher: blaetter.length,
      letzteIstNeue: blaetter[blaetter.length - 1]?.id === neu?.id,
      markenDerNeuen: (neu?.marken || []).length,
      /* Und die ERSTE Folie darf sich dabei nicht geändert haben. */
      ersteMarken: (blaetter[0]?.marken || []).length,
      befehlDa: befehle.some((t: string) => /Neue Folie/i.test(t)),
      befehle: befehle.filter((t: string) => /Folie|Präsentation/i.test(t)),
    };
  });

  gleich('Vorher eine Folie', m.vorher, 1);
  gleich('Nachher zwei', m.nachher, 2);
  p('Die neue steht am Ende', m.letzteIstNeue);
  p('Sie trägt die Marken ihres Layouts', m.markenDerNeuen >= 3, String(m.markenDerNeuen));
  p('Die erste ist unberührt geblieben', m.ersteMarken >= 2, String(m.ersteMarken));
  p('Der Befehl „Neue Folie" steht in der Palette (§8 Regel 3)',
    m.befehlDa, JSON.stringify(m.befehle));
}

p('Keine Browserfehler', fehler.length === 0, fehler.join(' | '));

await kontext.close();
await browser.close();
server.close();
console.log(`\nSuite 504: ${ok} grün` + (weg ? `, ${weg} rot` : '') + '.');
process.exit(weg ? 1 : 0);
