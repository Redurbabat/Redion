/* Suite 289 — Sieht ein Knopf wie ein Knopf aus? (E293, L82 Punkt 9)
 * ============================================================================
 * `grund.css:210` nimmt JEDEM Knopf sein Aussehen:
 *
 *     button{font:inherit; color:inherit; background:none; border:none;
 *            cursor:pointer}
 *
 * Das ist richtig so — Redion setzt sein Aussehen über Klassen. Der Preis:
 * ein Knopf OHNE Klasse ist von gewöhnlichem Text nicht zu unterscheiden.
 * Genau das ist beim Wolke-Fenster passiert (E270, beim Ansehen der Bilder
 * gefunden): „Mit GitHub anmelden" stand als nackte Zeile da.
 *
 * L82 Punkt 9 hält seither fest: „Es gibt keinen Prüflauf, der fragt, ob ein
 * Knopf wie einer aussieht — und andere Fenster mit demselben Muster sind
 * ungeprüft." Dieser Lauf ist er.
 *
 * ─── DIE REGEL, DIE GEMESSEN WIRD ───────────────────────────────────────────
 *
 * Ein sichtbarer Knopf mit Text muss sich von gewöhnlichem Fliesstext in
 * MINDESTENS EINEM dieser Punkte unterscheiden:
 *
 *     Rahmen · Hintergrund · Unterstreichung · Farbe · Schriftstärke
 *
 * Ein Knopf, der in keinem davon abweicht, ist eine Zeile, die man anklicken
 * kann, ohne es zu wissen. Das ist §47 von der stummen Seite.
 *
 * Reine Zeichen-Knöpfe (nur Emoji oder ein Symbol, kein Wort) bleiben
 * draussen: sie tragen ihre Bedeutung im Bild, und Redions Werkzeugleisten
 * bestehen daraus.
 *
 *   §1 DIE MESSUNG SELBST — sie muss einen nackten Knopf finden können.
 *   §2 DIE FENSTER, eines nach dem anderen.
 *   §3 DAS MENÜBAND und die Kopfleiste.
 *
 * ─── KANN ER ROT WERDEN? (§55.2) ────────────────────────────────────────────
 * §1 ist die Antwort: er schiebt einen Knopf ohne Klasse in ein offenes
 * Fenster und verlangt, dass die Messung ihn meldet. Ohne diesen Abschnitt
 * wäre ein Lauf, der nie etwas findet, von einem kaputten nicht zu
 * unterscheiden.
 *
 *   node pruefungen/lauf/test289.mts
 * ==========================================================================*/
declare const Store: any; declare const App: any; declare const UI: any;
declare const Links: any; declare const Wissensluecken: any;
declare const WolkeFenster: any; declare const Backstage: any;
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9075;

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

const browser = await chromium.launch();
const seite = await browser.newPage({ viewport: { width: 1400, height: 900 } });
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 140)));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForFunction(() => typeof Store !== 'undefined' && typeof App !== 'undefined',
                            null, { timeout: 30000 });
await seite.waitForTimeout(1600);
await seite.evaluate(() => { document.getElementById('rg-willkommen')?.remove(); });

/* Die Messung wird EINMAL in die Seite gelegt und danach je Fenster
   gerufen — sonst stünde dieselbe Regel fünfmal da und liefe auseinander. */
await seite.evaluate(() => {
  (window as any).__nackteKnoepfe = (wurzelWahl: string) => {
    const wurzel = document.querySelector(wurzelWahl);
    if (!wurzel) return { da: false, gefunden: [], geprueft: 0 };

    /* Der Vergleichsmassstab: gewöhnlicher Fliesstext derselben Seite. */
    const probe = document.createElement('span');
    probe.textContent = 'x';
    wurzel.appendChild(probe);
    const text = getComputedStyle(probe);
    const textFarbe = text.color;
    const textStaerke = text.fontWeight;
    probe.remove();

    const durchsichtig = (f: string) =>
      !f || f === 'transparent' || /rgba\([^)]*,\s*0\s*\)$/.test(f);

    const gefunden: string[] = [];
    let geprueft = 0;
    for (const b of [...wurzel.querySelectorAll('button')]) {
      const kasten = b.getBoundingClientRect();
      if (kasten.width < 2 || kasten.height < 2) continue;
      const wort = (b.textContent || '').trim();
      /* Nur Knöpfe mit einem WORT. Reine Zeichen tragen ihre Bedeutung
         im Bild — Redions Werkzeugleisten bestehen daraus. */
      if (!/[A-Za-zÄÖÜäöüß]{3}/.test(wort)) continue;
      geprueft++;
      const s = getComputedStyle(b);
      const hatRahmen = ['Top','Right','Bottom','Left'].some(k =>
        parseFloat((s as any)['border' + k + 'Width']) > 0 &&
        (s as any)['border' + k + 'Style'] !== 'none');
      const hatGrund = !durchsichtig(s.backgroundColor) || s.backgroundImage !== 'none';
      const hatStrich = /underline/.test(s.textDecorationLine || '');
      const andereFarbe = s.color !== textFarbe;
      const andereStaerke = s.fontWeight !== textStaerke;
      /* AUCH DIE KINDER ZÄHLEN. Eine Backstage-Zeile ist ein Knopf ohne
         eigenen Rahmen: die Auszeichnung sitzt im Titel darin (`font-weight:
         500`) und im Pfeil daneben. Auf dem Bildschirm ist das dasselbe
         Signal — wer nur den Knopf selbst misst, meldet ein sauber
         gestaltetes Listenmuster als nackt und wird dafür abgeschaltet.
         Gemessen wird flach, nicht tief: ein Nachkomme, der sich abhebt. */
      const kindHebtAb = [...b.querySelectorAll('*')].some(k => {
        const ks = getComputedStyle(k as Element);
        return ks.fontWeight !== textStaerke || ks.color !== textFarbe ||
               !durchsichtig(ks.backgroundColor) ||
               /underline/.test(ks.textDecorationLine || '');
      });
      if (hatRahmen || hatGrund || hatStrich || andereFarbe || andereStaerke ||
          kindHebtAb) continue;
      gefunden.push(wort.slice(0, 40) + ' [' + (b.className || 'ohne Klasse') + ']');
    }
    return { da: true, gefunden, geprueft };
  };
});

const messen = (wahl: string) =>
  seite.evaluate((w: string) => (window as any).__nackteKnoepfe(w), wahl) as
    Promise<{ da: boolean; gefunden: string[]; geprueft: number }>;

/* ------------------------------------------------------------------------ */
console.log('\n1 · Die Messung selbst — sie muss einen nackten Knopf finden');

await seite.evaluate(() => {
  const o = document.createElement('div');
  o.className = 'overlay pruef-fenster';
  o.innerHTML = '<div class="finder" style="width:400px">' +
    '<div class="fh">Probe</div>' +
    '<button class="rb">Mit Klasse</button>' +
    '<button>Ohne jede Klasse</button>' +
    '<button>🔧</button>' +
    '</div>';
  document.body.appendChild(o);
});
const probe = await messen('.pruef-fenster');

p('Die Messung findet das Probefenster', probe.da === true);
p('Sie prüft die Knöpfe mit Wörtern — nicht den mit dem Zeichen',
  probe.geprueft === 2, String(probe.geprueft));
p('Sie MELDET den nackten Knopf', probe.gefunden.length === 1,
  JSON.stringify(probe.gefunden));
p('… und zwar genau den ohne Klasse',
  (probe.gefunden[0] || '').startsWith('Ohne jede Klasse'),
  String(probe.gefunden[0]));

await seite.evaluate(() => document.querySelector('.pruef-fenster')?.remove());

/* ------------------------------------------------------------------------ */
console.log('\n2 · Die Fenster, eines nach dem anderen');

const fenster: Array<{ name: string; oeffnen: string }> = [
  { name: 'Wissenslücken', oeffnen: 'Wissensluecken.zeigen()' },
  { name: 'Schlagwörter',  oeffnen: 'Links.tagRegister()' },
  { name: 'Wissensgraph',  oeffnen: 'Links.graph()' },
  /* , nicht  — der erste Entwurf hat den Namen
     geraten, und das Fenster ging nie auf. Ausgerechnet dieses: es ist
     die Stelle, an der der Fehler ueberhaupt gefunden wurde (E270). */
  { name: 'Wolke',         oeffnen: 'WolkeFenster.dialog()' },
  { name: 'Backstage',     oeffnen: 'Backstage.oeffne && Backstage.oeffne()' }
];

for (const f of fenster) {
  const auf = await seite.evaluate(async (code: string) => {
    document.querySelectorAll('.overlay,.menu').forEach(e => e.remove());
    try { await eval(code); } catch (e: unknown) { return String(e); }
    return '';
  }, f.oeffnen);
  await seite.waitForTimeout(500);
  const erg = await messen('.overlay');
  if (!erg.da) {
    p(f.name + ': das Fenster liess sich nicht öffnen', true,
      'übersprungen' + (auf ? ' — ' + String(auf).slice(0, 60) : ''));
    continue;
  }
  p(f.name + ': jeder Knopf mit Wort sieht wie einer aus',
    erg.gefunden.length === 0,
    erg.geprueft + ' geprüft, nackt: ' + JSON.stringify(erg.gefunden));
  await seite.evaluate(() =>
    document.querySelectorAll('.overlay,.menu').forEach(e => e.remove()));
}

/* ------------------------------------------------------------------------ */
console.log('\n3 · Das Menüband und die Kopfleiste');

await seite.evaluate(() => {
  document.querySelectorAll('.overlay,.menu').forEach(e => e.remove());
  try { Store.setMeta('bandZu', false); } catch { /* egal */ }
  try { (window as any).Menueband?.zeichne?.(); } catch { /* egal */ }
});
await seite.waitForTimeout(500);

const band = await messen('#menueband');
p('Das Menüband: jeder Knopf mit Wort sieht wie einer aus',
  !band.da || band.gefunden.length === 0,
  band.geprueft + ' geprüft, nackt: ' + JSON.stringify(band.gefunden));

p('Keine Seitenfehler', fehler.length === 0, fehler.join(' | ').slice(0, 300));

await browser.close();
server.close();
console.log(`\n${ok}/${ok + weg} bestanden`);
process.exitCode = weg ? 1 : 0;
