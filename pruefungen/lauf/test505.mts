/* Suite 505 — Das Menüband bekommt einen Reiter „Präsentation" — und zeigt sich
 * ============================================================================
 * Redur: „oben mit Menü". Beim Nachsehen war die Lage wieder eine andere als
 * erwartet, und zwar in beide Richtungen:
 *
 *   DA, UND VOLLSTÄNDIG. Redion HAT ein Menüband — `register/menueband.ts`
 *   (1156 Zeilen Katalog) und `schale/aufbau/menueband.ts` (1371 Zeilen
 *   Zeichner), mit Reitern Start · Einfügen · Zeichnen · Verlauf ·
 *   Überprüfen · Ansicht · Hilfe. Gebaut, weil Redur es schon einmal wollte.
 *
 *   ABER UNSICHTBAR, UND ZWEIMAL AUS GUTEM GRUND:
 *     · `studio.css`: am Rechner ist das Band eine LADE hinter
 *       `#studio-tools` — der Studio-Kopf zeigt Werkzeuge, Suche, KI und
 *       Konto schon, ein zweiter Kopf wäre doppelt (6. September).
 *     · `pdf-studio.css:84`: im Dokumentmodus verschwindet alles Gerüst,
 *       auch `#menueband` — dort regiert die Dokumentleiste.
 *
 *   UND OHNE FOLIEN. Kein Reiter für eine Präsentation, in keinem der
 *   sieben: kein „Neue Folie", kein „Layout", kein „Präsentieren".
 *
 *   §1 DER REITER erscheint — und NUR bei einem Foliensatz.
 *   §2 SEINE KNÖPFE sind Wege, die es schon gibt, in benannten Gruppen.
 *   §3 IM FOLIENSATZ steht das Folien-MENÜ oben in der Dokumentleiste.
 *      DAS GANZE BAND DORT ZU ZEIGEN WAR DER ERSTE VERSUCH, und er wurde
 *      gemessen und zurückgenommen: `#menueband` ist am Rechner eine
 *      zugeklappte Lade, und im Dokumentmodus legte es sich als Ecke
 *      „Werkzeuge ⌄" über die Dokumentleiste — 1440 × 852 px, deckungsgleich
 *      mit dem Inhalt darunter. Zwei Köpfe übereinander, genau wovor die
 *      Zeile in `pdf-studio.css` steht. Der KATALOG ist trotzdem derselbe.
 *   §4 EIN NOTIZHEFT bleibt, wie es war — hochkant, ohne Reiter, ohne Band.
 *
 * §4 ist der wichtigste Abschnitt dieser Suite. Die zwei Regeln oben sind
 * Entscheidungen, keine Versehen; wer sie für alle Dokumente aufhebt, baut
 * zwei Köpfe übereinander. Gemessen wird deshalb beides: dass es beim
 * Foliensatz kommt UND dass es sonst wegbleibt.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 * Alle vier wirklich gefahren, die Zahlen sind GEMESSEN (26 grün ist gesund):
 *   §1 → den Reiter aus `REITER` nehmen:              25 grün,  1 rot.
 *   §2 → den Lieferanten nicht anmelden:              14 grün, 12 rot.
 *   §3 → den Folien-Knopf immer verstecken:           23 grün,  3 rot.
 *   §4 → `istFoliensatz` auf jedes Blatt gehen lassen
 *        (also auch auf ein hochkantes Notizheft):    24 grün,  2 rot.
 *
 * Die vierte ist die, auf die es ankommt. Sie prüft nicht, ob etwas DA ist,
 * sondern ob es WEGBLEIBT, wo es nicht hingehört — und genau daran ist der
 * erste Versuch dieses Bogens gescheitert.
 *
 *   node pruefungen/lauf/test505.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
declare const Store: any;
declare const App: any;
declare const Register: any;
declare const Folienvorlagen: any;
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9615;
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

/* Zwei Dokumente: ein Foliensatz (quer) und ein Notizheft (hochkant). */
const gebaut = await seite.evaluate(() => {
  const deck = Folienvorlagen.neuePraesentation('titelInhalt');
  Folienvorlagen.neueFolie(deck.id, 'zweiInhalte');
  const heft = Store.addPage(null, { text: 'Notizheft', icon: '📓' });
  Store.addBlock(heft.id, 'blatt', { text: '', blattBreite: 595, blattHoehe: 842 });
  Store.updateBlock(heft.id, { dokumentModus: true });
  return { deck: deck.id, heft: heft.id };
});

const oeffne = async (id: string) => {
  await seite.evaluate((x: string) => App.oeffne(x), id);
  await seite.waitForTimeout(1600);
  await seite.evaluate(() => {
    document.querySelectorAll<HTMLElement>('#rg-willkommen').forEach(o => o.remove());
  });
};

/* ══ §1 DER REITER ERSCHEINT — UND NUR BEIM FOLIENSATZ ═══════════════════ */
console.log('\n§1 „Präsentation" steht im Band, sobald ein Foliensatz offen ist');
{
  await oeffne(gebaut.deck);
  const imDeck = await seite.evaluate(() => ({
    reiter: Register.menueband.reiter().map((r: any) => r.id),
    eintraege: Register.menueband.inReiter('praesentation'),
  }));
  p('Der Reiter ist da', imDeck.reiter.includes('praesentation'),
    JSON.stringify(imDeck.reiter));
  p('Und er hat Gruppen', Array.isArray(imDeck.eintraege) && imDeck.eintraege.length > 0,
    String(imDeck.eintraege?.length));

  await oeffne(gebaut.heft);
  const imHeft = await seite.evaluate(() => ({
    reiter: Register.menueband.reiter().map((r: any) => r.id),
  }));
  p('Im Notizheft ist er weg', !imHeft.reiter.includes('praesentation'),
    JSON.stringify(imHeft.reiter));
  p('Die anderen Reiter bleiben', imHeft.reiter.length >= 4, JSON.stringify(imHeft.reiter));
}

/* ══ §2 SEINE KNÖPFE SIND WEGE, DIE ES SCHON GIBT ════════════════════════ */
console.log('\n§2 Echte Wege in benannten Gruppen, keine zweite Rechnung');
{
  await oeffne(gebaut.deck);
  const m = await seite.evaluate(() => {
    const gruppen = Register.menueband.inReiter('praesentation') as any[];
    const flach = gruppen.flatMap((g: any) => g.eintraege || g.liste || []);
    return {
      gruppen: gruppen.map((g: any) => g.name || g.gruppe || '?'),
      zahl: flach.length,
      alleMitTun: flach.length > 0 && flach.every((e: any) => typeof e.tun === 'function'),
      alleMitName: flach.length > 0 && flach.every((e: any) => !!e.name),
      /* Ein Hinweis gehört an jeden — er ist der Satz für den Mauszeiger
         UND für Vorleseprogramme (§38). */
      alleMitHinweis: flach.length > 0 && flach.every((e: any) => !!e.hinweis),
      namen: flach.map((e: any) => e.name),
      /* Keine doppelten Kennungen: zwei Knöpfe mit derselben id wären für
         den Zeichner derselbe. */
      doppelte: flach.length - new Set(flach.map((e: any) => e.id)).size,
    };
  });

  p('Mindestens zwei Gruppen', m.gruppen.length >= 2, JSON.stringify(m.gruppen));
  p('Mindestens fünf Knöpfe', m.zahl >= 5, String(m.zahl));
  p('Jeder tut wirklich etwas', m.alleMitTun);
  p('Jeder hat einen Namen', m.alleMitName, JSON.stringify(m.namen));
  p('Jeder hat einen Satz für Zeiger und Vorleseprogramm (§38)', m.alleMitHinweis);
  gleich('Keine doppelten Kennungen', m.doppelte, 0);
  p('„Neue Folie" ist dabei', m.namen.some((n: string) => /Neue Folie/i.test(n)),
    JSON.stringify(m.namen));
  p('„Präsentieren" ist dabei', m.namen.some((n: string) => /Präsentieren|Vortrag/i.test(n)),
    JSON.stringify(m.namen));
}

/* ══ §3 OBEN IM FOLIENSATZ STEHT DAS FOLIEN-MENÜ ═════════════════════════ */
console.log('\n§3 Oben das Folien-Menü, links die Folien — Redurs Satz, gemessen');
{
  /* WARUM NICHT DAS GANZE MENÜBAND. Genau das war der erste Versuch, und er
     wurde GEMESSEN und zurückgenommen: `#menueband` ist am Rechner eine
     zugeklappte Lade (`studio.css`, 6. September), und im Dokumentmodus
     legte es sich als Ecke „Werkzeuge ⌄" über die Dokumentleiste — 1440 × 852
     px, deckungsgleich mit dem Inhalt darunter. Zwei Köpfe übereinander.
     Der KATALOG ist trotzdem derselbe: das Menü liest `Register.menueband`,
     Reiter `praesentation` — dieselbe Liste, die §2 misst (§8). */
  await oeffne(gebaut.deck);
  const m = await seite.evaluate(() => {
    const knopf = document.querySelector<HTMLElement>('[data-document-action="folienmenue"]');
    const k = knopf?.getBoundingClientRect();
    const inhalt = document.querySelector('.blatt-papier')?.getBoundingClientRect();
    return {
      da: !!knopf, versteckt: !!knopf?.hidden,
      sichtbar: !!k && k.height > 0,
      /* OBEN heisst: über der Folie, nicht irgendwo. */
      ueberDemInhalt: !!k && !!inhalt && k.height > 0 && k.bottom <= inhalt.top + 1,
      hatMenue: knopf?.getAttribute('aria-haspopup') === 'menu',
      /* 44 px auf einem Hauptweg (§37). */
      hoehe: k ? Math.round(k.height) : 0,
      /* NACH DER TAT GEFRAGT, NICHT NACH DEM WORT (E552).
         Hier stand `/^▤\s*Seiten$/` — und seit im Foliensatz „▤ Folien"
         dransteht, war die Zeile rot, obwohl der Knopf unverändert da ist
         und dasselbe tut. Eine Zusage, die am WORTLAUT hängt, bricht bei
         jeder Umbenennung; die Aktion ist das, was gemeint war. */
      seitenKnopf: !!document.querySelector<HTMLElement>(
        '[data-document-action="thumbnails"]'),
      seitenWort: (document.querySelector<HTMLElement>(
        '[data-document-action="thumbnails"]')?.textContent || '').trim(),
    };
  });

  p('Der Folien-Knopf steht in der Leiste', m.da && !m.versteckt);
  p('… und ist im Bild', m.sichtbar, m.hoehe + ' px');
  p('… über der Folie, nicht daneben', m.ueberDemInhalt);
  p('… und sagt an, dass ein Menü kommt (§38)', m.hatMenue);
  p('Die Folienliste bleibt erreichbar', m.seitenKnopf);
  p('… und heisst im Foliensatz „Folien", nicht „Seiten" (E552)',
    /Folien/.test(m.seitenWort), m.seitenWort);

  /* Und das Menü muss wirklich aufgehen und die Einträge tragen. */
  await seite.evaluate(() => {
    document.querySelector<HTMLElement>('[data-document-action="folienmenue"]')?.click();
  });
  await seite.waitForTimeout(500);
  const auf = await seite.evaluate(() => {
    const menue = document.querySelector('.menu');
    const texte = [...(menue?.querySelectorAll('button[data-fm]') || [])]
      .map(b => (b.textContent || '').replace(/\s+/g, ' ').trim());
    const gruppen = [...(menue?.querySelectorAll('.grp') || [])]
      .map(g => (g.textContent || '').trim());
    const hoechste = Math.max(0, ...[...(menue?.querySelectorAll('button[data-fm]') || [])]
      .map(b => Math.round(b.getBoundingClientRect().height)));
    document.querySelectorAll<HTMLElement>('.menu, .menu-grund').forEach(x => x.remove());
    return { texte, gruppen, hoechste };
  });
  p('Das Menü geht auf', auf.texte.length >= 5, String(auf.texte.length));
  /* AM GEZEICHNETEN TEXT, NICHT AM REGISTER. §2 liest den Katalog und war
     grün, während im Menü drei LEERE graue Streifen standen: das Feld heisst
     `gruppe`, der erste Entwurf las `g.name`. Eine Prüfung, die die Quelle
     misst statt das Bild, misst nicht, was der Mensch sieht (§55.2). */
  p('… mit benannten Gruppen — und die Namen stehen wirklich da',
    auf.gruppen.length >= 2 && auf.gruppen.every((g: string) => g.length > 0),
    JSON.stringify(auf.gruppen));
  /* Und kein Name darf umbrechen: ein Eintrag höher als zwei Zeilen ist
     einer, dem der Platz genommen wurde. */
  p('… und kein Name bricht um', auf.hoechste <= 40, auf.hoechste + ' px');
  p('… und „Neue Folie" darin',
    auf.texte.some((t: string) => /Neue Folie/.test(t)), JSON.stringify(auf.texte.slice(0, 3)));
}

/* ══ §4 EIN NOTIZHEFT BLEIBT, WIE ES WAR ═════════════════════════════════ */
console.log('\n§4 Im Notizheft kein Band — die Entscheidung von damals gilt weiter');
{
  await oeffne(gebaut.heft);
  const m = await seite.evaluate(() => {
    const band = document.getElementById('menueband');
    const k = band?.getBoundingClientRect();
    return {
      sichtbar: !!k && k.height > 0,
      hoehe: k ? Math.round(k.height) : 0,
      dokumentModus: document.body.dataset['dokument'] || '',
      werkzeuge: [...document.querySelectorAll<HTMLElement>('.blatt-werk')]
        .filter(e => e.getBoundingClientRect().height > 0).length,
      folienKnopfWeg: (() => {
        const kn = document.querySelector<HTMLElement>('[data-document-action="folienmenue"]');
        return !kn || kn.hidden || kn.getBoundingClientRect().height === 0;
      })(),
    };
  });
  p('Kein Band über dem Notizheft', !m.sichtbar, m.hoehe + ' px');
  p('Und kein Folien-Knopf in seiner Leiste', m.folienKnopfWeg);
  p('Der Dokumentmodus steht trotzdem', m.dokumentModus === 'an', m.dokumentModus);
  p('Und seine Werkzeugleiste ist da', m.werkzeuge >= 1, String(m.werkzeuge));
}

p('Keine Browserfehler', fehler.length === 0, fehler.join(' | '));

await kontext.close();
await browser.close();
server.close();
console.log(`\nSuite 505: ${ok} grün` + (weg ? `, ${weg} rot` : '') + '.');
process.exit(weg ? 1 : 0);
