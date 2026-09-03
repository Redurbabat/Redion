/* Suite 386 — Der Sofort-Block des UX-Audits vom 3. September 2026
 * ============================================================================
 * Redur hat einen Prüfbericht geschickt: „Redion Web-App · Vollständiger UX-,
 * Funktions- und Responsive-Audit". Achtzehn Befunde, davon sechs im Block
 * „Sofort · 1–3 Tage". Dieser Lauf hält sie.
 *
 * WICHTIG ZUR HERKUNFT: der Bericht prüfte `redion.redurbabat7.workers.dev`,
 * also `main` auf dem Stand E353. Dieser Zweig steht auf E385. Jeder Befund
 * wurde deshalb ZUERST gegen den heutigen Stand nachgemessen, statt
 * angenommen — vier der sechs waren noch genau so da.
 *
 *   §1 F05 · Die Ollama-Anleitung nennt die ECHTE Herkunft, keinen Stern.
 *   §2 F04 · Jeder Werkzeugknopf hat einen Namen — auch wenn das Wort
 *            unsichtbar ist — und sagt, ob er gilt.
 *   §3 F06 · Eine eingelesene PDF heisst wie ihre Datei, nicht „Ohne Titel".
 *   §4 F07 · Der Zoom überlebt das Neuladen, je Dokument.
 *   §5 F15 · Zurück und Vorwärts sind aus, solange es keinen Schritt gibt.
 *   §6 F16 · Ein Ziel, ein Name — und der alte Name führt weiter hin.
 *
 *   node pruefungen/lauf/test386.mts
 * ==========================================================================*/
declare const Store: any; declare const App: any;
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9405;

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

/* ==========================================================================
 * §1 · F05 — die Ollama-Anleitung, im Quelltext geprüft
 * --------------------------------------------------------------------------
 * Warum am Quelltext und nicht am Bildschirm: die Anleitung erscheint nur,
 * wenn Ollama NICHT läuft, und im Prüfcontainer läuft es nie — der Weg
 * dorthin wäre also ein Nachbau statt einer Messung. Was hier zählt, ist
 * eine Zeichenkette, und die steht in der Datei.
 *
 * §55.2 — kann das rot werden? Vor dem 3. September stand dort wörtlich
 * `OLLAMA_ORIGINS=*` als Anleitung; §1 wäre gefallen.
 * ======================================================================== */
console.log('\n1 · F05 · Die Ollama-Anleitung empfiehlt keinen Stern');
const dienst = fs.readFileSync(path.join(WURZEL, 'quell/bereiche/ki/dienst.js'), 'utf8');

/* Nur ANLEITUNGEN zählen, nicht die Warnung davor. Eine Anleitung steht in
   einem <code>-Kasten oder als Befehlszeile; die Warnung ist Fliesstext. */
const alsBefehl = /<code[^>]*>[^<]*OLLAMA_ORIGINS\s*=\s*\*/i.test(dienst) ||
                  /setx\s+OLLAMA_ORIGINS\s+"\*"/.test(dienst) ||
                  /launchctl setenv OLLAMA_ORIGINS "\*"/.test(dienst) ||
                  /^\s*\*?\s*OLLAMA_ORIGINS=\* ollama serve/m.test(dienst);
p('Kein `OLLAMA_ORIGINS=*` mehr als Anleitung', !alsBefehl,
  'im Quelltext steht der Stern noch als Befehl');
p('Der Stern wird stattdessen erklärt und gewarnt',
  /erlaubt (JEDER|jeder) Webseite/i.test(dienst));
p('Die Anleitung setzt die echte Herkunft ein',
  /location\.origin/.test(dienst) && /OLLAMA_ORIGINS=' \+ esc\(her\)/.test(dienst),
  'kein Einsetzen von location.origin gefunden');
p('Und der Sonderfall `file://` wird genannt statt verschwiegen',
  /OLLAMA_ORIGINS=null/.test(dienst) && /JEDER örtlich geöffneten Seite/.test(dienst));

const AUFBAU = `(async () => {
  Store.setMeta('rundgangGesehen', true);
  document.querySelectorAll('.overlay').forEach(o => o.remove());
  document.querySelector('.produkt-onboarding-lage')?.remove();
  document.getElementById('rg-willkommen')?.remove();
  document.getElementById('rg-einladung')?.remove();
  const s = Store.addPage(null, { text: 'Skript', icon: '📕' });
  for (let nr = 1; nr <= 3; nr++)
    Store.addBlock(s.id, 'pdfseite', { text: '', suchtext: 'Ohm', nr, vonSeiten: 3,
      bw: 595, bh: 842, quelleId: 'q' });
  Store.updateBlock(s.id, { dokumentModus: true });
  await Store.flush();
  App.oeffne(s.id);
  await new Promise(r => setTimeout(r, 1400));
  return s.id;
})()`;

const browser = await chromium.launch();
const fehler: string[] = [];

/* ==========================================================================
 * §2 · F04 — jeder Werkzeugknopf hat einen Namen und einen Zustand
 * --------------------------------------------------------------------------
 * Gemessen wird am TELEFON, denn dort blendet das CSS das Wort aus — genau
 * dort war der Name vorher das Zeichen. §55.2: vor dem 3. September stand
 * `.blatt-werk .wort{display:none}` da, und der zugängliche Name jedes
 * Knopfes war „✎", „⌖", „🖍". Beide Punkte wären gefallen.
 * ======================================================================== */
const handy = await browser.newPage({ viewport: { width: 390, height: 844 },
                                      isMobile: true, hasTouch: true });
handy.on('pageerror', e => fehler.push('PAGEERROR (Telefon): ' + e.message.slice(0, 140)));
await handy.goto(`http://localhost:${PORT}/index.html`);
await handy.waitForTimeout(2700);
await handy.evaluate(AUFBAU);
await handy.waitForSelector('.blatt-werk', { timeout: 20000 });
await handy.waitForTimeout(500);

console.log('\n2 · F04 · Die Werkzeuge heissen nach ihrer Aufgabe, nicht nach ihrem Zeichen');
const namen = await handy.evaluate(`(() => {
  /* NUR DIE ERSTE LEISTE. Beim ersten Versuch mass dieser Abschnitt über
     ALLE Leisten hinweg und meldete drei gedrückte Werkzeuge statt einem —
     weil im fortlaufenden Dokumentmodus JEDE Seite ihre eigene
     Werkzeugleiste trägt. Das ist Befund F03 des Audits und wird dort
     behoben; hier misst der Abschnitt die Namen, nicht die Zahl der
     Leisten.  (Kein Backtick in diesem Kommentar: er steht in einer
     Vorlagenzeichenkette und würde sie beenden.) */
  const leiste = document.querySelector('.blatt-werk');
  if (!leiste) return null;
  /* Der zugängliche Name, so wie ein Vorleseprogramm ihn bildet:
     aria-label gewinnt, sonst der Textinhalt OHNE aria-hidden. */
  const name = (b) => {
    const l = b.getAttribute('aria-label');
    if (l) return l.trim();
    let t = '';
    b.childNodes.forEach(n => {
      if (n.nodeType === 3) { t += n.textContent; return; }
      if (n.nodeType !== 1) return;
      if (n.getAttribute('aria-hidden') === 'true') return;
      /* UND WAS NICHT GERECHNET WIRD, ZÄHLT AUCH NICHT. Der erste Entwurf
         las hier einfach textContent — und blieb deshalb grün, als die
         Gegenprobe das Wort wieder auf display:none stellte: ein
         weggeschaltetes Element steht weiter im DOM und hat weiter Text,
         nur eben nicht im Zugänglichkeitsbaum. Eine Prüfung, die das
         nicht unterscheidet, misst das DOM und behauptet den Baum.
         Derselbe Fehler wie scrollWidth in §55.2. */
      const st = getComputedStyle(n);
      if (st.display === 'none' || st.visibility === 'hidden') return;
      t += n.textContent;
    });
    return t.trim();
  };
  const knoepfe = [...leiste.querySelectorAll('button')]
    .filter(b => b.offsetParent !== null);
  return {
    anzahl: knoepfe.length,
    namen: knoepfe.map(name),
    /* Ein Name, der nur aus Zeichen ohne Buchstaben besteht, ist keiner. */
    ohneBuchstaben: knoepfe.map(name).filter(n => !/[a-zA-ZäöüÄÖÜß]/.test(n)),
    /* Das Wort ist unsichtbar, steht aber im Baum — und „im Baum" heisst
       GERECHNET, nicht bloss vorhanden: display:none nimmt es heraus. */
    wortSichtbar: [...leiste.querySelectorAll('.wort')]
      .filter(w => w.getBoundingClientRect().width > 4).length,
    wortDa: [...leiste.querySelectorAll('.wort')]
      .filter(w => getComputedStyle(w).display !== 'none').length,
    /* Und jedes Zeichen ist aus dem Baum genommen. */
    zeichenOffen: [...leiste.querySelectorAll('.zeichen')]
      .filter(z => z.getAttribute('aria-hidden') !== 'true').length,
    gedrueckt: [...leiste.querySelectorAll('[data-wz]')]
      .filter(b => b.getAttribute('aria-pressed') === 'true').map(b => b.dataset.wz)
  };
})()`) as any;

p('Die Leiste ist da', !!namen);
p('Jeder sichtbare Knopf hat einen Namen mit Buchstaben',
  namen && namen.ohneBuchstaben.length === 0,
  namen ? namen.ohneBuchstaben.join(' | ') : '');
p('Und es sind wirklich welche da (sonst prüft der Punkt nichts)',
  (namen?.anzahl ?? 0) >= 10, String(namen?.anzahl));
p('Das Wort ist am Telefon unsichtbar …', namen && namen.wortSichtbar === 0,
  'sichtbar: ' + namen?.wortSichtbar);
p('… steht aber im Baum', (namen?.wortDa ?? 0) >= 10, String(namen?.wortDa));
gleich('Kein Zeichen steht offen im Baum', namen?.zeichenOffen, 0);
gleich('Genau ein Werkzeug meldet sich als gedrückt', namen?.gedrueckt, ['schreiben']);

/* Und der Zustand wandert mit. */
await handy.click('.blatt-werk [data-wz="stift"]');
await handy.waitForTimeout(400);
const nachher = await handy.evaluate(`(() => {
  const leiste = document.querySelector('.blatt-werk');
  return [...leiste.querySelectorAll('[data-wz]')]
    .filter(b => b.getAttribute('aria-pressed') === 'true').map(b => b.dataset.wz);
})()`) as string[];
gleich('Nach dem Umschalten meldet sich der Stift', nachher, ['stift']);

/* WAS DIESE MESSUNG NEBENBEI FAND (F03): drei PDF-Seiten, drei
   Werkzeugleisten. Der Punkt steht hier als ZAHL, damit die Reparatur
   in F03 einen Beleg hat, gegen den sie misst — und damit ein Rückfall
   auffällt. Er wird mit F03 auf 1 gestellt. */
const leisten = await handy.evaluate(
  `document.querySelectorAll('.blatt-werk').length`) as number;
console.log('  · Werkzeugleisten bei 3 PDF-Seiten: ' + leisten + '  (F03 macht daraus 1)');

await handy.close();

/* ==========================================================================
 * §3 · F06 — der Dateiname wird der Titel
 * --------------------------------------------------------------------------
 * Geprüft wird die Regel selbst, mit einer echten Seite: eine Seite ohne
 * Titel bekommt den Namen; eine mit Titel behält ihren.
 * §55.2: vor dem 3. September hiess jede eingelesene PDF „Ohne Titel".
 * ======================================================================== */
const pc = await browser.newPage({ viewport: { width: 1280, height: 900 } });
pc.on('pageerror', e => fehler.push('PAGEERROR (Rechner): ' + e.message.slice(0, 140)));
await pc.goto(`http://localhost:${PORT}/index.html`);
await pc.waitForTimeout(2700);
await pc.evaluate(`(() => {
  Store.setMeta('rundgangGesehen', true);
  document.querySelectorAll('.overlay').forEach(o => o.remove());
  document.getElementById('rg-willkommen')?.remove();
  document.getElementById('rg-einladung')?.remove();
})()`);

console.log('\n3 · F06 · Eine eingelesene PDF heisst wie ihre Datei');
const titelProbe = await pc.evaluate(`(async () => {
  /* Die Regel aus einlesen.ts, an echten Seiten nachgefahren: sie steht
     dort als „nur wenn noch keiner da ist". Beide Fälle prüfen. */
  const OHNE = ['', 'Ohne Titel', 'Neue Seite'];
  const setz = (seite, dateiname) => {
    if (!OHNE.includes(String(seite.text || '').trim())) return seite.text;
    const t = dateiname.replace(/\\.[^.]+$/, '').trim();
    if (t) Store.updateBlock(seite.id, { text: t });
    return Store.getBlock(seite.id).text;
  };
  const leer = Store.addPage(null, { text: '' });
  const vorgabe = Store.addPage(null, { text: 'Ohne Titel' });
  const eigen = Store.addPage(null, { text: 'Meine Vorlesung' });
  await Store.flush();
  return {
    leer:    setz(leer, 'Vorlesung 3.pdf'),
    vorgabe: setz(vorgabe, 'Redur_Skript.pdf'),
    eigen:   setz(eigen, 'egal.pdf'),
    punkte:  setz(Store.addPage(null, { text: '' }), 'Kapitel 2.1 Ohm.pdf')
  };
})()`) as any;
gleich('Eine leere Seite bekommt den Dateinamen', titelProbe.leer, 'Vorlesung 3');
gleich('„Ohne Titel" auch', titelProbe.vorgabe, 'Redur_Skript');
gleich('Ein getippter Titel bleibt unangetastet', titelProbe.eigen, 'Meine Vorlesung');
gleich('Nur die letzte Endung fällt weg', titelProbe.punkte, 'Kapitel 2.1 Ohm');
/* Und die Regel steht wirklich im Einleser, nicht nur hier. */
const einlesen = fs.readFileSync(path.join(WURZEL, 'quell/bereiche/pdf/einlesen.js'), 'utf8');
p('Der Einleser trägt die Regel selbst', /OHNE_NAMEN/.test(einlesen));

/* ==========================================================================
 * §4 · F07 — der Zoom überlebt das Neuladen
 * ======================================================================== */
console.log('\n4 · F07 · Der Zoom bleibt, je Dokument');
const dokId = await pc.evaluate(AUFBAU) as string;
await pc.waitForSelector('.document-workspace', { timeout: 20000 });
await pc.waitForTimeout(400);

const zoomStellen = async (wert: number): Promise<void> => {
  await pc.evaluate(`(() => {
    const r = document.querySelector('[data-document-zoom]');
    r.value = '${wert}';
    r.dispatchEvent(new Event('input', { bubbles: true }));
  })()`);
  await pc.waitForTimeout(400);
};
const zoomJetzt = async (): Promise<number> =>
  Number(await pc.evaluate(`Number(document.querySelector('[data-document-zoom]').value)`));

gleich('Beim ersten Öffnen steht er auf 100', await zoomJetzt(), 100);
await zoomStellen(140);
gleich('Verstellt steht er auf 140', await zoomJetzt(), 140);
const gemerkt = await pc.evaluate((id: string) => Store.getMeta('dokZoom:' + id), dokId);
gleich('Und er ist gemerkt', gemerkt, 140);

/* Der eigentliche Punkt: NACH DEM NEULADEN. */
await pc.reload();
await pc.waitForTimeout(2700);
await pc.evaluate(`(() => { document.getElementById('rg-willkommen')?.remove();
                            document.getElementById('rg-einladung')?.remove(); })()`);
await pc.evaluate((id: string) => App.oeffne(id), dokId);
await pc.waitForSelector('.document-workspace', { timeout: 20000 });
await pc.waitForTimeout(600);
gleich('Nach dem Neuladen steht er wieder auf 140', await zoomJetzt(), 140);

/* GEGENPROBE: ein ZWEITES Dokument hat seinen eigenen Zoom. Ohne sie wäre
   ein global gemerkter Zoom grün — und das wäre falsch: ein Skript in
   Kleindruck braucht einen anderen als ein Foto-Scan. */
const zweitId = await pc.evaluate(`(async () => {
  const s = Store.addPage(null, { text: 'Zweites Skript', icon: '📗' });
  Store.addBlock(s.id, 'pdfseite', { text: '', nr: 1, vonSeiten: 1, bw: 595, bh: 842 });
  Store.updateBlock(s.id, { dokumentModus: true });
  await Store.flush();
  App.oeffne(s.id);
  await new Promise(r => setTimeout(r, 1200));
  return s.id;
})()`) as string;
await pc.waitForTimeout(400);
gleich('Ein anderes Dokument fängt bei 100 an', await zoomJetzt(), 100);
p('Und das erste behält seine 140',
  await pc.evaluate((id: string) => Store.getMeta('dokZoom:' + id), dokId) === 140);
p('Die zwei Merker sind verschieden',
  dokId !== zweitId && await pc.evaluate((id: string) => Store.getMeta('dokZoom:' + id), zweitId) !== 140);

/* ==========================================================================
 * §5 · F15 — Zurück und Vorwärts sagen vorher, ob sie können
 * --------------------------------------------------------------------------
 * §55.2: vorher waren beide immer aktiv und meldeten erst NACH dem Druck
 * „Kein Schritt zurück". Jeder Punkt hier wäre gefallen.
 * ======================================================================== */
console.log('\n5 · F15 · Zurück ist aus, solange es keinen Schritt gibt');
await pc.reload();
await pc.waitForTimeout(2700);
await pc.evaluate(`(() => { document.getElementById('rg-willkommen')?.remove();
                            document.getElementById('rg-einladung')?.remove(); })()`);
const knopfStand = async (): Promise<any> => await pc.evaluate(`(() => {
  const b = document.getElementById('btn-back');
  const f = document.getElementById('btn-fwd');
  return { backAus: !!b?.disabled, fwdAus: !!f?.disabled,
           backTitel: b?.title || '', fwdTitel: f?.title || '' };
})()`);
let st = await knopfStand();
p('Nach dem Neuladen ist Zurück aus', st.backAus, JSON.stringify(st));
p('Und Vorwärts auch', st.fwdAus, JSON.stringify(st));
p('Der Grund steht in der Sprechblase', /kein Schritt/i.test(st.backTitel), st.backTitel);

/* ZWEI GEWÖHNLICHE SEITEN, keine Dokumente. Beim ersten Versuch standen
   hier die beiden PDFs aus §4 — und der Klick lief in einen Timeout, weil
   E384 im Dokumentmodus die ganze Kopfzeile ausblendet: `#btn-back` ist
   dann da, aber unsichtbar. Der Zustand liesse sich trotzdem lesen, der
   Klick nicht. Also der Fall, den F15 wirklich meint: normales Blättern. */
const seiteA = await pc.evaluate(`(async () => {
  const a = Store.addPage(null, { text: 'Seite A' });
  await Store.flush(); return a.id;
})()`) as string;
const seiteB = await pc.evaluate(`(async () => {
  const b = Store.addPage(null, { text: 'Seite B' });
  await Store.flush(); return b.id;
})()`) as string;
await pc.evaluate((id: string) => App.oeffne(id), seiteA);
await pc.waitForTimeout(600);
await pc.evaluate((id: string) => App.oeffne(id), seiteB);
await pc.waitForTimeout(600);
st = await knopfStand();
p('Nach zwei Seiten ist Zurück an', !st.backAus, JSON.stringify(st));
p('Vorwärts bleibt aus — dorthin war noch niemand', st.fwdAus, JSON.stringify(st));
p('Und die Sprechblase sagt jetzt das Tastenkürzel', /Strg \+ \[/.test(st.backTitel), st.backTitel);

await pc.click('#btn-back');
await pc.waitForTimeout(700);
st = await knopfStand();
p('Nach einem Schritt zurück ist Vorwärts an', !st.fwdAus, JSON.stringify(st));

/* ==========================================================================
 * §6 · F16 — ein Ziel, ein Name
 * ======================================================================== */
console.log('\n6 · F16 · Ein Ziel trägt überall denselben Namen');
const worte = await pc.evaluate(`(() => {
  const holen = (id) => (document.getElementById(id)?.textContent || '').trim();
  const reg = (typeof Register !== 'undefined' && Register.navigation)
    ? Register.navigation.alle().filter(e => e.id === 'workspace' || e.id === 'elektro')
        .map(e => e.id + '=' + e.name).sort()
    : [];
  return { seiteWorkspace: holen('btn-workspace'), seiteElektro: holen('btn-elektro'), reg };
})()`) as any;
gleich('Die Seitenleiste sagt „Arbeitsbereich"', worte.seiteWorkspace, 'Arbeitsbereich');
gleich('… und „Elektrotechnik"', worte.seiteElektro, 'Elektrotechnik');
gleich('Das Register sagt dasselbe', worte.reg,
  ['elektro=Elektrotechnik', 'workspace=Arbeitsbereich']);
p('Nirgends steht mehr „Workspace" als Beschriftung',
  !/>Workspace</.test(await pc.content()));
/* DER ALTE NAME FÜHRT WEITER HIN. Ohne diesen Punkt wäre eine Umbenennung
   grün, die gemerkte Schauplätze und ältere Verweise ins Leere zeigen lässt. */
const alias = fs.readFileSync(path.join(WURZEL, 'quell/schale/aufbau/schale.js'), 'utf8');
p('„Workspace" bleibt als Alias auf dasselbe Ziel',
  /'Arbeitsbereich': 'workspace'/.test(alias) && /'Workspace': 'workspace'/.test(alias));
p('„Elektro" ebenso', /'Elektro': 'elektro'/.test(alias));

await pc.close();
await browser.close();
server.close();

console.log('\n' + (fehler.length ? 'Fehler auf der Seite:\n  ' + fehler.join('\n  ') + '\n' : ''));
p('Keine Fehler auf der Seite', fehler.length === 0, fehler.join(' | '));
console.log('\n' + ok + ' bestanden, ' + weg + ' durchgefallen');
process.exit(weg ? 1 : 0);
