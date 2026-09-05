/* Suite 417 — Der Feed beschriftet seine Werte (E424)
 * ============================================================================
 * Auf dem Bild `db-feed` stand in einer Karte:
 *
 *     Offen  Messung   15.09.2026 60 CHF
 *
 * Ein Datum und ein Betrag, nebeneinander, ohne Trennung und ohne Namen.
 * „60 CHF" — Kosten? Budget? Und „15.09.2026 60 CHF" liest sich als EIN
 * Wert. In der Karte darüber stand nur „30.09.2026", in der darunter nur
 * „19.09.2026" — dieselbe Stelle, verschiedene Bedeutung, nichts sagt
 * welche.
 *
 * E411 hat genau dieses Problem für Board- und Galeriekarten gelöst:
 * `kartenWerte` schreibt an, was seinen Namen braucht — nackte Zahlen,
 * Daten, Zeitspannen —, und lässt Etiketten, Sterne und Ortsmarken ohne,
 * weil eine Beschriftung an JEDEM Wert wieder niemand liest. Der Feed
 * benutzte diese Maschine nicht; er klebte die ersten vier Zellen mit einem
 * Leerzeichen aneinander.
 *
 * Dazu ein zweiter Fund aus demselben Bild: das Datum oben rechts stand als
 * `2026-09-22`, das Datum in derselben Karte als `30.09.2026`. Zwei
 * Datumsformate in einer Karte, und eines davon ist keines, das ein
 * deutschsprachiger Mensch schreibt (§3).
 *
 *   §1 Jeder Wert, der seinen Namen braucht, trägt ihn.
 *   §2 Und zwei Werte kleben nicht aneinander.
 *   §3 Das Datum oben rechts ist deutsch formatiert.
 *   §4 Titel, Öffnen und Kommentar stehen weiter.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 *   §1/§2 → zurück auf `.map(k => zelle(...)).join(' ')`.
 *   §3    → zurück auf `Formula.anzeige(...)`.
 * Beide gelaufen, Ergebnisse im Bericht zu E424.
 *
 *   node pruefungen/lauf/test417.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9539;

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

const bilderQuelle = fs.readFileSync(path.join(WURZEL, 'bilder.mts'), 'utf8');
const teil = bilderQuelle.slice(bilderQuelle.indexOf('const dbAufbau'),
                                bilderQuelle.indexOf('for (const l of DB_ANSICHTEN)'));
const vorlage = teil.slice(teil.indexOf('`') + 1, teil.lastIndexOf('`'));

const browser = await chromium.launch();
const fehler: string[] = [];
const s = await browser.newPage({ viewport: { width: 1280, height: 950 } });
s.on('pageerror', e => fehler.push(e.message.slice(0, 140)));
await s.goto(`http://localhost:${PORT}/index.html`);
await s.waitForFunction("typeof App !== 'undefined' && typeof Store !== 'undefined'",
                        null, { timeout: 30000 });
await s.waitForTimeout(400);
await s.evaluate(new Function(vorlage.replace('${layout}', 'feed')) as any);
await s.waitForTimeout(1200);

const karten = JSON.parse(await s.evaluate(`JSON.stringify(
  [...document.querySelectorAll('.feed-eintrag')].map(e => ({
    titel: (e.querySelector('.fe-kopf b') || {}).textContent || '',
    wann: (e.querySelector('.fe-kopf span') || {}).textContent || '',
    namen: [...e.querySelectorAll('.mv-n')].map(x => x.textContent.trim()),
    werte: [...e.querySelectorAll('.mv')].map(x => x.textContent.trim()),
    knoepfe: [...e.querySelectorAll('button')].map(b => b.textContent.trim())
  })))`) as string);

/* ==========================================================================
 * §1 · JEDER WERT, DER SEINEN NAMEN BRAUCHT, TRÄGT IHN
 * ========================================================================*/
console.log('\n§1 Jeder Wert, der seinen Namen braucht, trägt ihn');
p('Es gibt Feed-Karten', karten.length >= 5, String(karten.length));
p('Jede Karte trägt einzelne Werte, nicht einen Klumpen',
  karten.every((k: any) => k.werte.length > 0),
  JSON.stringify(karten.map((k: any) => k.werte.length)));
/* Der konkrete Fall vom Bild: „Isolationsmessung" hatte 15.09.2026 und
   60 CHF nebeneinander. Beide brauchen einen Namen — eine nackte Zahl und
   ein Datum sagen von sich aus nicht, was sie sind. */
const iso = karten.find((k: any) => /Isolationsmessung/.test(String(k.titel)));
p('Die Karte vom Bild ist dabei', !!iso, JSON.stringify(karten.map((k: any) => k.titel)));
p('… und ihre Zahl trägt einen Namen',
  iso ? iso.namen.some((n: string) => /Kosten/.test(n)) : false,
  JSON.stringify(iso?.namen));
p('… und ihr Datum auch',
  iso ? iso.namen.some((n: string) => /Anfang|Ende/.test(n)) : false,
  JSON.stringify(iso?.namen));
/* Und NICHT alles: ein Etikett sagt sich selbst. Stünde vor jedem Wert ein
   Name, läse ihn wieder niemand — das ist der Kern von E411. */
p('Aber nicht jeder Wert trägt einen — Etiketten sagen sich selbst',
  karten.some((k: any) => k.namen.length < k.werte.length),
  JSON.stringify(karten.map((k: any) => k.namen.length + '/' + k.werte.length)));

/* ==========================================================================
 * §2 · ZWEI WERTE KLEBEN NICHT ANEINANDER
 * ========================================================================*/
console.log('\n§2 Zwei Werte kleben nicht aneinander');
/* GEMESSEN WIRD ZWISCHEN NAME UND WERT, NICHT ZWISCHEN DEN WERTEN.
   Der Fehler auf dem Bild war „Ende30.09.2026" — die Beschriftung klebte am
   Wert INNERHALB eines Eintrags. Der erste Wurf dieser Prüfung mass den
   Abstand zwischen den Eintraegen und blieb in der Gegenprobe gruen: den
   halten .fe-merkmale mit seinem eigenen gap, auch wenn die Regel fuer den
   Eintrag fehlt. Eine Pruefung, die den falschen Spalt misst, misst nichts
   (§55.2).
   Der Abstand kommt aus display:inline-flex plus gap. Ohne beides steht die
   Beschriftung unmittelbar am Wert — gemessen null Pixel. */
const geklebt = await s.evaluate(`JSON.stringify(
  [...document.querySelectorAll('.fe-merkmale .mv')].map(mv => {
    const n = mv.querySelector('.mv-n');
    if (!n) return null;
    const nr = n.getBoundingClientRect();
    /* Was direkt nach der Beschriftung kommt — Textknoten oder Element. */
    const naechst = n.nextSibling;
    if (!naechst) return null;
    let wr;
    if (naechst.nodeType === 3) {
      const r = document.createRange(); r.selectNodeContents(naechst);
      wr = r.getBoundingClientRect();
    } else wr = naechst.getBoundingClientRect();
    if (!wr || !wr.width) return null;
    return { name: n.textContent.trim(), spalt: Math.round((wr.left - nr.right) * 10) / 10 };
  }).filter(Boolean))`) as string;
const kleb = JSON.parse(geklebt);
p('Es gibt beschriftete Werte zu messen', kleb.length >= 3, String(kleb.length));
const eng = kleb.filter((x: any) => x.spalt < 2);
p('Keine Beschriftung klebt an ihrem Wert',
  eng.length === 0, JSON.stringify(eng).slice(0, 200));
/* UND DER ZWEITE SPALT, DER IN DIE ANDERE RICHTUNG ZÄHLT (E432).
   Der Absatz darüber sagt, dass der erste Wurf zwischen den EINTRÄGEN mass
   und dass das der falsche Spalt war. Richtig — für den Fehler „Ende30.09.2026".
   Falsch als Schluss, dass der Spalt zwischen den Einträgen niemanden
   angeht: er muss GRÖSSER sein als der innerhalb eines Eintrags, sonst
   steht dort eine Kette gleich weit entfernter Wörter, und man sieht nicht
   mehr, welcher Name zu welchem Wert gehört.
   Gemessen auf dem Bild `db-feed-rechner-hell.png`: 4 px innen, 5 px
   aussen. „Ende 30.09.2026 Kosten 0 CHF" las sich als ein Satz. Der Grund
   stand in `datenbanken.css` — eine tote Regel, die `einstellungen.css`
   überschrieb (test332 fand sie). */
const spalten = JSON.parse(await s.evaluate(`JSON.stringify((() => {
  const raus = [];
  for (const m of document.querySelectorAll('.fe-merkmale')) {
    const mv = [...m.querySelectorAll(':scope > .mv')];
    for (let i = 0; i + 1 < mv.length; i++) {
      const a = mv[i].getBoundingClientRect(), b = mv[i + 1].getBoundingClientRect();
      /* Nur nebeneinander, nicht über einen Umbruch hinweg. */
      if (Math.abs(a.top - b.top) > 2) continue;
      raus.push({ links: mv[i].textContent.trim().slice(0, 22),
                  rechts: mv[i + 1].textContent.trim().slice(0, 22),
                  spalt: Math.round((b.left - a.right) * 10) / 10 });
    }
  }
  return raus;
})())`) as string);
p('Es gibt nebeneinanderstehende Werte zu messen', spalten.length >= 2,
  String(spalten.length));
/* Der innere Spalt ist 4 px (`.mv{gap:4px}`). Aussen muss deutlich mehr
   stehen — die Grenze ist 8 px und damit das Doppelte, nicht ein Härchen. */
const zuEng = spalten.filter((x: any) => x.spalt < 8);
p('Zwischen zwei Werten steht mehr Luft als zwischen Name und Wert',
  zuEng.length === 0, JSON.stringify(zuEng).slice(0, 220));

/* UND DER STROM BLEIBT EIN STROM. Der erste Wurf hängte ALLE Spalten an —
   dreizehn Werte in einer Zeile, samt Sternen, Ortsmarke, Kästchen und
   Anhang. Auf dem Bild war das eine Wand, keine Auskunft. Eine Karte im
   Board darf alles zeigen; ein Feed ist zum Überfliegen da. */
p('Keine Karte zeigt mehr als fünf Werte',
  karten.every((k: any) => k.werte.length <= 5),
  JSON.stringify(karten.map((k: any) => k.werte.length)));
/* Und mindestens drei, sonst wäre die Grenze eine Ausrede für „gar nichts". */
p('… und mindestens drei, wo es sie gibt',
  karten.every((k: any) => k.werte.length >= 3),
  JSON.stringify(karten.map((k: any) => k.werte.length)));

/* ==========================================================================
 * §3 · DAS DATUM OBEN RECHTS IST DEUTSCH
 * ========================================================================*/
console.log('\n§3 Das Datum oben rechts ist deutsch');
p('Jede Karte trägt ein Datum oben rechts',
  karten.every((k: any) => String(k.wann).trim().length >= 6),
  JSON.stringify(karten.map((k: any) => k.wann)));
/* `2026-09-22` ist kein Datum, das ein deutschsprachiger Mensch schreibt
   (§3). Es ist ausserdem genau das Format, das `Formula.anzeige` liefert —
   die rohe gespeicherte Zeichenkette. */
const roh = karten.filter((k: any) => /^\d{4}-\d{2}-\d{2}/.test(String(k.wann)));
p('Keines steht als rohes 2026-09-22 da', roh.length === 0,
  JSON.stringify(roh.map((k: any) => k.wann)));
p('Und mindestens eines sieht deutsch aus',
  karten.some((k: any) => /\d{1,2}\.\d{1,2}\.\d{4}/.test(String(k.wann))),
  JSON.stringify(karten.map((k: any) => k.wann)));

/* ==========================================================================
 * §4 · WAS VORHER DA WAR, IST NOCH DA
 * ========================================================================*/
console.log('\n§4 Titel, Öffnen und Kommentar stehen weiter');
p('Jede Karte hat einen Titel',
  karten.every((k: any) => String(k.titel).trim().length > 2),
  JSON.stringify(karten.map((k: any) => k.titel)));
p('Und beide Knöpfe',
  karten.every((k: any) => k.knoepfe.some((b: string) => /Öffnen/.test(b)) &&
                           k.knoepfe.some((b: string) => /Kommentar/.test(b))),
  JSON.stringify(karten[0]?.knoepfe));

p('Keine Fehler auf der Seite', fehler.length === 0, fehler.join(' | '));

console.log(`\n${ok} von ${ok + weg} Prüfungen grün`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
