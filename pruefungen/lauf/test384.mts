/* Suite 384 — das ruhige Menüband (Auftrag 01)
 * ============================================================================
 * Redion soll sich anfühlen wie GoodNotes und Notion zusammen: fast nichts zu
 * sehen, nichts entfernt. Neun Reiter und „Datei" standen bisher auf JEDEM
 * Bild — auch auf dem Startbild, auf dem drei davon nichts tun können, weil
 * sie eine offene Seite brauchen (`BRAUCHT_SEITE`, E236).
 *
 * Diese Suite hält die neue Zusage fest, und zwar in beide Richtungen:
 *
 * §1 IN RUHE SIND SIE WEG. Bei `data-ruhig="an"` und zugeklapptem Band steht
 *    kein Reiter und kein „Datei" mehr da.
 *
 * §2 ABER ERREICHBAR — und DAS ist der eigentliche Punkt. Die Lehre aus
 *    Suite 248 §3, wörtlich:
 *
 *        Ein Knopf, den niemand je zu sehen bekommt, ist gelöscht; im Baum
 *        zu stehen hilft keinem Menschen.
 *
 *    Also wird nicht geprüft, ob die Reiter im DOM stehen, sondern ob ein
 *    Mensch hinkommt: über den Klapp-Pfeil, über den Schalter, über „Mehr".
 *    Und die NAMEN müssen dieselben sein wie in der alten Fassung — eine
 *    blosse Zahl sagt nicht, ob die RICHTIGEN Reiter zurückkommen.
 *
 * §3 DIE SUCHE ÜBERLEBT. `#mb-suche`, `#mb-ki` und `#mb-konto` liegen in
 *    `.mb-rechts`, NICHT in der Kopfzeile — die Kopfzeile hat zwar ein
 *    eigenes `#btn-ai`, aber keine Suche. Wer später `.mb-reiter` im Ganzen
 *    ausblendet, macht die Suche unerreichbar. Diese Zusicherung steht hier,
 *    damit das auffällt.
 *
 * §4 DIE GEGENPROBE: KANN DER LAUF ÜBERHAUPT ROT WERDEN? Mit
 *    `data-ruhig="aus"` MÜSSEN die Reiter sichtbar sein. Ohne diesen Punkt
 *    wäre §1 auch dann grün, wenn die Reiter aus einem ganz anderen Grund
 *    nie erscheinen (§55.2 — eine Prüfung, die immer „passt schon" sagt,
 *    ist keine Prüfung).
 *
 * §5 AM TELEFON. `zugeklappt()` lautet `amTelefon() || meta(...)` — am
 *    Telefon ist das Band also IMMER zu, und die neue Regel greift dort in
 *    jedem Fall. Das ist erwünscht (E240: Redurs vier iPhone-Fotos, auf
 *    denen das Band 371 von 844 px belegte). Der Weg zurück läuft dort über
 *    einen anderen Zweig: `__klapp` ruft `fluechtig(false)`, was `.ist-zu`
 *    als KLASSE vom Baum nimmt, ohne den Speicher anzufassen.
 *
 * §6 KEINE FEHLER AUF DER SEITE, wie in jedem Lauf des Hauses.
 *
 * Gerüst (Server, `seiteAuf`, Sichtbarkeit) wörtlich von Suite 248
 * übernommen — nicht neu gebaut (§8: keine zweite Fassung derselben Sache).
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

declare const Store: any;
declare const Ruhig: any;

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9371;

const TYP: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.json': 'application/json', '.mjs': 'text/javascript',
  '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml'
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

const browser = await chromium.launch();

const seiteAuf = async (breite = 1440, hoehe = 900) => {
  const seite = await browser.newPage({ viewport: { width: breite, height: hoehe } });
  const fehler: string[] = [];
  seite.on('pageerror', e => fehler.push(String(e)));
  await seite.goto(`http://localhost:${PORT}/index.html`);
  await seite.waitForTimeout(2400);
  await seite.evaluate(() => {
    Store.setMeta('rundgangGesehen', true);
    Store.setMeta('neuerungenGesehen', 99);
  });
  await seite.reload();
  await seite.waitForTimeout(2800);
  await seite.evaluate(() => {
    document.querySelectorAll('#rg-willkommen,.overlay,[role=dialog]').forEach(x => x.remove());
    if (typeof (window as any).Werkzeuge !== 'undefined' &&
        (window as any).Werkzeuge.meldungenLeeren) {
      (window as any).Werkzeuge.meldungenLeeren();
    }
  });
  await seite.waitForTimeout(300);
  return { seite, fehler };
};

/* Was ein Mensch anklicken kann. `visibility` und `opacity` zählen mit — ein
   Element mit `visibility:hidden` ist weder klickbar noch im Tabulator-Weg.
   Wörtlich aus Suite 248 übernommen (§4 des Auftrags verlangt genau das). */
const MESS = `
  (() => {
    const sicht = (el) => {
      const k = el.getBoundingClientRect();
      const st = getComputedStyle(el);
      return k.width > 0 && k.height > 0 && k.top < innerHeight && k.bottom > 0
        && st.visibility !== 'hidden' && st.opacity !== '0';
    };
    const alle = (w) => [...document.querySelectorAll(w)];
    const da = (w) => { const e = document.querySelector(w); return !!e && sicht(e); };
    const band = document.getElementById('menueband');
    return {
      zustand: document.body.dataset.ruhig || '(keiner)',
      istZu: !!band && band.classList.contains('ist-zu'),
      reiter: alle('#menueband .mb-reiter-knopf').filter(sicht).length,
      /* Die NAMEN der sichtbaren Reiter — eine Zahl sagt nicht, ob die
         richtigen zurückkommen (E272). */
      namen: alle('#menueband [data-mb-reiter]').filter(sicht)
               .map(b => b.getAttribute('data-mb-reiter') || ''),
      datei: da('#mb-datei'),
      suche: da('#mb-suche'),
      ki: da('#mb-ki'),
      konto: da('#mb-konto'),
      marke: da('#menueband .mb-marke'),
      klapp: da('#menueband .mb-klapp'),
      /* Das Wort am Pfeil — es soll GENAU dann dastehen, wenn die Reiter
         fehlen, und sonst nicht (sonst wäre es Doppelung). */
      wort: da('#menueband .mb-klapp-wort'),
      wortText: (document.querySelector('#menueband .mb-klapp-wort') || {}).textContent || '',
      /* PASST DAS WORT AUCH IN SEINEN KNOPF? Der Klapp-Knopf ist von Haus
         aus 32 px BREIT FESTGESETZT. Beim ersten Versuch ragten Wort und
         Pfeil heraus, und der Pfeil lag UEBER dem Suchknopf — ein Klick
         haette das Falsche getroffen. Gemessen statt angesehen, damit es
         nicht wiederkommt.
         (KEINE Rueckwaertsstriche und KEINE Schraegstriche-Anfuehrungen in
         diesem Block: MESS IST ein Template-Literal, und ein Gegenstrich
         beendet es mitten im Satz.) */
      kaesten: (() => {
        const kasten = (w) => { const e = document.querySelector(w); if (!e) return null;
          const r = e.getBoundingClientRect();
          return { l: Math.round(r.left), r: Math.round(r.right), w: Math.round(r.width) }; };
        return { wort: kasten('#menueband .mb-klapp-wort'),
                 klapp: kasten('#menueband .mb-klapp'),
                 pfeil: kasten('#menueband .mb-klapp [data-sym]'),
                 suche: kasten('#mb-suche') };
      })(),
      /* Waagerechter Überlauf — am Telefon der eigentliche Prüfstein. */
      ueberlauf: document.documentElement.scrollWidth - document.documentElement.clientWidth
    };
  })()`;

const { seite, fehler } = await seiteAuf();

/* ==========================================================================
 * §1 In Ruhe sind sie weg
 * ========================================================================*/
console.log('\n1 · In Ruhe sind die Reiter weg');

/* AUSGANGSLAGE, NICHT ZUFALL — ausdrücklich setzen statt hoffen. */
await seite.evaluate(() => { Ruhig.setzen(true); if (Ruhig.offen()) Ruhig.schalten(); });
await seite.waitForTimeout(500);
const ruhe: any = await seite.evaluate(MESS);

gleich('Der Zustand ist „an"', ruhe.zustand, 'an');
p('Das Band ist zugeklappt', ruhe.istZu === true, JSON.stringify(ruhe));
gleich('KEIN Reiter ist zu sehen', ruhe.reiter, 0);
p('… und „Datei" auch nicht', ruhe.datei === false, JSON.stringify(ruhe.datei));

/* DAS WORT AM PFEIL. Beim Hinsehen (§55) war das der ernsteste Fund: der
   Pfeil war bisher das Ende einer Reihe; allein an der rechten Kante ist er
   eine Zierde, die niemand anklickt. Redur hat entschieden, ihm ein Wort zu
   geben. Es ist der einzige neue Knopf dieses Bogens — und er ersetzt zehn. */
p('Der Pfeil trägt jetzt ein Wort', ruhe.wort === true, JSON.stringify(ruhe.wort));
gleich('… und das Wort heisst „Werkzeuge"', String(ruhe.wortText).trim(), 'Werkzeuge');

/* DER KNOPF MUSS SEINEN INHALT AUCH FASSEN. `.mb-klapp` ist 32 px breit
   festgesetzt; ohne `width:auto` ragten Wort (1288–1354) und Pfeil
   (1358–1373) aus dem Knopf (1317–1344) heraus, und der Pfeil lag über dem
   Suchknopf (1346–1374). Diese drei Zeilen halten das fest. */
const kk = ruhe.kaesten || {};
p('Das Wort steht IM Knopf, nicht daneben',
  !!kk.wort && !!kk.klapp && kk.wort.l >= kk.klapp.l && kk.wort.r <= kk.klapp.r,
  JSON.stringify(kk));
p('… der Pfeil auch',
  !!kk.pfeil && !!kk.klapp && kk.pfeil.l >= kk.klapp.l && kk.pfeil.r <= kk.klapp.r,
  JSON.stringify(kk));
p('… und der Knopf überlappt die Suche nicht',
  !!kk.klapp && !!kk.suche && (kk.klapp.r <= kk.suche.l || kk.suche.r <= kk.klapp.l),
  JSON.stringify(kk));

/* ==========================================================================
 * §2 Aber erreichbar — und das ist der eigentliche Punkt
 * ========================================================================*/
console.log('\n2 · Aber erreichbar');

/* Erst die alte Fassung ansehen: WELCHE Reiter gehören dorthin? */
await seite.evaluate(() => Ruhig.setzen(false));
await seite.waitForTimeout(500);
const alt: any = await seite.evaluate(MESS);
p('In der alten Fassung stehen Reiter da', alt.reiter > 0, JSON.stringify(alt.reiter));

/* Zurück in die Ruhe, dann den Klapp-Pfeil drücken. */
await seite.evaluate(() => { Ruhig.setzen(true); if (Ruhig.offen()) Ruhig.schalten(); });
await seite.waitForTimeout(400);
await seite.click('#menueband .mb-klapp');
await seite.waitForTimeout(600);
const aufgeklappt: any = await seite.evaluate(MESS);

p('Ein Klick auf den Klapp-Pfeil bringt die Reiter zurück',
  aufgeklappt.reiter > 0, JSON.stringify(aufgeklappt));
gleich('… und zwar genau dieselben wie in der alten Fassung',
  aufgeklappt.namen, alt.namen);
p('… „Datei" kommt mit', aufgeklappt.datei === true);
p('… und das Wort am Pfeil verschwindet wieder — sonst wäre es Doppelung',
  aufgeklappt.wort === false, JSON.stringify(aufgeklappt.wort));

/* Wieder zuklappen, damit der nächste Weg von vorne anfängt. */
await seite.click('#menueband .mb-klapp');
await seite.waitForTimeout(600);
const wiederZu: any = await seite.evaluate(MESS);
gleich('Wieder zugeklappt sind sie wieder weg', wiederZu.reiter, 0);

/* Weg zwei: der Schalter der ruhigen Fassung. */
await seite.evaluate(() => Ruhig.setzen(false));
await seite.waitForTimeout(500);
const ausSchalter: any = await seite.evaluate(MESS);
p('Weg 2 — `Ruhig.setzen(false)` zeigt sie wieder',
  ausSchalter.reiter > 0, JSON.stringify(ausSchalter.reiter));

/* Weg drei: „Mehr" — der Zustand `offen`. */
await seite.evaluate(() => { Ruhig.setzen(true); if (!Ruhig.offen()) Ruhig.schalten(); });
await seite.waitForTimeout(500);
const offen: any = await seite.evaluate(MESS);
gleich('Weg 3 — der Zustand heisst „offen"', offen.zustand, 'offen');
p('… und auch dort stehen die Reiter', offen.reiter > 0, JSON.stringify(offen.reiter));

/* ==========================================================================
 * §3 Die Suche überlebt
 * ========================================================================*/
console.log('\n3 · Die Suche überlebt jeden Zustand');

/* Der Reihe nach durch alle drei Zustände, und in JEDEM müssen die drei
   Griffe rechts stehen. Sie liegen in `.mb-rechts`, nicht in der Kopfzeile;
   die Kopfzeile hat keine Suche. */
const zustaende: Array<[string, () => Promise<void>]> = [
  ['ruhig zu', async () => {
    await seite.evaluate(() => { Ruhig.setzen(true); if (Ruhig.offen()) Ruhig.schalten(); });
  }],
  ['ruhig offen', async () => {
    await seite.evaluate(() => { Ruhig.setzen(true); if (!Ruhig.offen()) Ruhig.schalten(); });
  }],
  ['alte Fassung', async () => { await seite.evaluate(() => Ruhig.setzen(false)); }]
];
for (const [name, setzen] of zustaende) {
  await setzen();
  await seite.waitForTimeout(450);
  const m: any = await seite.evaluate(MESS);
  p(`${name}: Suche, KI und Konto stehen rechts`,
    m.suche && m.ki && m.konto,
    JSON.stringify({ suche: m.suche, ki: m.ki, konto: m.konto }));
  p(`${name}: die Marke „N" bleibt der Weg in die Backstage`, m.marke === true);
  p(`${name}: der Klapp-Pfeil ist erreichbar`, m.klapp === true);
}

/* ==========================================================================
 * §4 Die Gegenprobe: kann der Lauf überhaupt rot werden?
 * ========================================================================*/
console.log('\n4 · Die Gegenprobe');

await seite.evaluate(() => Ruhig.setzen(false));
await seite.waitForTimeout(500);
const gegen: any = await seite.evaluate(MESS);
p('Mit `data-ruhig="aus"` sind die Reiter SICHTBAR — sonst misst §1 nichts',
  gegen.reiter > 0, JSON.stringify(gegen));
p('… und das Band ist dabei immer noch zugeklappt',
  gegen.istZu === true, JSON.stringify(gegen.istZu));
p('… womit bewiesen ist, dass §1 an `data-ruhig` hängt und nicht am Zufall',
  gegen.reiter > 0 && ruhe.reiter === 0,
  `aus=${gegen.reiter}, an=${ruhe.reiter}`);

/* ==========================================================================
 * §5 Am Telefon
 * ========================================================================*/
console.log('\n5 · Am Telefon');

const { seite: handy, fehler: handyFehler } = await seiteAuf(390, 844);
await handy.evaluate(() => { Ruhig.setzen(true); if (Ruhig.offen()) Ruhig.schalten(); });
await handy.waitForTimeout(600);
const tel: any = await handy.evaluate(MESS);

p('Am Telefon ist das Band von Haus aus zu', tel.istZu === true, JSON.stringify(tel.istZu));
gleich('… also stehen dort auch keine Reiter', tel.reiter, 0);
gleich('Nichts läuft waagerecht über', tel.ueberlauf, 0);
p('… und die Suche steht trotzdem rechts', tel.suche === true);

/* DER WEG ZURÜCK AM TELEFON läuft über einen anderen Zweig als am Rechner:
   `__klapp` ruft dort `fluechtig(false)`, und das nimmt `.ist-zu` als Klasse
   vom Baum, ohne den Speicher anzufassen. Prüfen statt annehmen. */
await handy.click('#menueband .mb-klapp');
await handy.waitForTimeout(700);
const telAuf: any = await handy.evaluate(MESS);
p('Ein Tipp auf den Klapp-Pfeil holt sie auch am Telefon',
  telAuf.reiter > 0, JSON.stringify(telAuf));
p('… weil `.ist-zu` dabei als Klasse fällt', telAuf.istZu === false,
  JSON.stringify(telAuf.istZu));

/* Und nach einer Neuzeichnung ist das Band wieder zu — so will es E240. */
await handy.evaluate(() => { if (typeof (window as any).Menueband !== 'undefined' &&
  (window as any).Menueband.zeichne) (window as any).Menueband.zeichne(); });
await handy.waitForTimeout(700);
const telNeu: any = await handy.evaluate(MESS);
p('Nach einer Neuzeichnung ist das Band wieder zu (E240)',
  telNeu.istZu === true, JSON.stringify(telNeu.istZu));
gleich('… und die Reiter wieder weg', telNeu.reiter, 0);

/* ==========================================================================
 * §6 Keine Fehler auf der Seite
 * ========================================================================*/
console.log('\n6 · Keine Fehler auf der Seite');
p('Am Rechner keine Fehler', fehler.length === 0, fehler.slice(0, 3).join(' | '));
p('Am Telefon keine Fehler', handyFehler.length === 0, handyFehler.slice(0, 3).join(' | '));

console.log(`\n${ok}/${ok + weg} bestanden · ✗=${weg}`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
