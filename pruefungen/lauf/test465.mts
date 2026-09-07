/* Suite 465 — Cornell und Notenlinien: zwei Papiere aus GoodNotes (E495)
 * ============================================================================
 * Redurs Auftrag vom 7. September, weiter: „schau wie ist es bei GoodNotes
 * und mache genau 1:1 so". GoodNotes' Vorlagenwähler hat neben Blanko,
 * Liniert, Kariert und Punktraster zwei Papiere, die Redion nicht hatte:
 * **Cornell-Notizen** und **Notenlinien**. Beide sind reine Darstellung —
 * ein Feld am Block, Verläufe im Stilblatt (E100), kein zweites Format.
 *
 *   §1 DER KATALOG steht einmal: `Blatt.PAPIERE`. Die Leiste, die Klappe und
 *      der Wähler für neue Seiten im Studio lesen ihn alle.
 *   §2 DIE MASSE SIND KACHELMASSE, nicht Blattmasse — der Fund des Bildes.
 *      Auf einem einseitigen und einem dreiseitigen Blatt muss dasselbe
 *      Papier dieselben ABSOLUTEN Abstände haben.
 *   §3 DIE MUSTER STEHEN WIRKLICH DA: die Schichten, ihre Reihenfolge, und
 *      dass Kopf und Fuss die Zeilen abdecken.
 *   §4 DER WÄHLER: sieben Knöpfe, jeder mit seinem Muster und seinem Namen.
 *   §5 WECHSELN VERLIERT NICHTS — Text und Marken überstehen jeden Wechsel.
 *   §6 QUELLEN, keine Seitenfehler.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 * Fünf Gegenproben, alle gelaufen, alle rot gesehen:
 *   §1 → den Eintrag `noten` aus `PAPIERE` nehmen. Rot in vier Zusagen —
 *        auch in der Klappe, weil sie denselben Katalog liest.
 *   §2 → `inKachel(3, 27)` durch `seite(3)` ersetzen (Prozent des BLATTES
 *        statt der Kachel). Rot: 1,01 statt 11,11 % — genau der Fehler, den
 *        das Bild gefunden hat, und der eine Linie je System zeichnete.
 *   §2 → `inSeitenkachel(30)` durch `seite(30)` ersetzen: die Cornell-
 *        Kopfzeile steht auf dem dreiseitigen Blatt bei 3,37 % statt bei
 *        10,1 %. Rot.
 *   §3 → die zwei Bänder in Papierfarbe aus dem Stilblatt nehmen: vier
 *        Schichten statt sechs, und die Spaltenlinie liefe durch Kopf und
 *        Fuss. Rot.
 *   §5 → `papier.dataset.papier` fest auf „blanko" setzen: das gewählte
 *        Papier erreicht den Aufbau nicht mehr. Rot in vier Zusagen.
 *
 *   node pruefungen/lauf/test465.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import type { Page } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

declare const Store: any; declare const App: any; declare const Blatt: any;

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9585;
const A4_HOEHE = 841.89;
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

/** Eine Seite mit zwei Blättern: eines einseitig, eines dreiseitig. */
const mitBlaettern = async (): Promise<Page> => {
  const s = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  s.on('pageerror', e => fehler.push(e.message.slice(0, 140)));
  await s.goto(`http://localhost:${PORT}/index.html`);
  await s.waitForFunction("typeof App !== 'undefined' && typeof Blatt !== 'undefined'");
  await s.evaluate(async (hoehe: number) => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    document.getElementById('rg-willkommen')?.remove();
    document.getElementById('rg-einladung')?.remove();
    const seite = Store.addPage(null, { text: 'Papierprobe' });
    Store.addBlock(seite.id, 'blatt', { text: '', blattBreite: 595.28, blattHoehe: hoehe,
      raumVersion: 1, marken: [], papier: 'cornell' });
    Store.addBlock(seite.id, 'blatt', { text: '', blattBreite: 595.28, blattHoehe: hoehe * 3,
      raumVersion: 1, marken: [], papier: 'cornell' });
    await Store.flush();
    App.oeffne(seite.id);
  }, A4_HOEHE);
  await s.waitForSelector('.blatt-papier', { timeout: 15000 });
  await s.waitForTimeout(500);
  return s;
};

/* ═══ §1 Der Katalog ═══════════════════════════════════════════════════════ */
console.log('\n§1 Sieben Papiere, an einer Stelle');
{
  const s = await mitBlaettern();
  const r = JSON.parse(await s.evaluate(`(() => {
    const ids = Blatt.PAPIERE.map(x => x.id);
    const namen = Blatt.PAPIERE.map(x => x.name);
    /* Nur die Klappe des ERSTEN Blatts — auf der Probeseite stehen zwei. */
    const knoepfe = [...document.querySelector('.blatt-huelle')
      .querySelectorAll('.blatt-papierliste .blatt-papierwahl')]
      .map(k => k.getAttribute('data-papier'));
    return JSON.stringify({ ids, namen, knoepfe });
  })()`) as string);
  gleich('Die sieben Kennungen', r.ids,
    ['blanko', 'liniert', 'kariert', 'punkte', 'mm', 'cornell', 'noten']);
  p('Cornell und Noten heissen auf Deutsch',
    r.namen.includes('Cornell-Notizen') && r.namen.includes('Notenlinien'), JSON.stringify(r.namen));
  gleich('Die Klappe zeigt genau diese sieben — sie liest denselben Katalog', r.knoepfe, r.ids);
}

/* ═══ §2 Kachelmasse, nicht Blattmasse ═════════════════════════════════════ */
console.log('\n§2 Dasselbe Papier misst auf jedem Blatt dasselbe');
{
  const s = await mitBlaettern();
  const r = JSON.parse(await s.evaluate(`(() => {
    const zwei = [...document.querySelectorAll('.blatt-papier')];
    const lies = (el) => {
      const cs = getComputedStyle(el);
      const h = el.getBoundingClientRect().height;
      const b = el.getBoundingClientRect().width;
      /* Prozentzahlen aufloesen: was auf die Kachel geht, bleibt Prozent;
         was auf das Blatt geht, wird in Pixel umgerechnet. */
      const proz = (name) => parseFloat(cs.getPropertyValue(name));
      return {
        hoehe: Math.round(h), breite: Math.round(b),
        seiteHoch: proz('--blatt-seite-hoch'),
        /* Kachelmasse — muessen auf BEIDEN Blaettern gleich sein */
        kopf: proz('--blatt-cornell-kopf'),
        fuss: proz('--blatt-cornell-fuss'),
        notenLinie: proz('--blatt-noten-linie'),
        notenSatz: proz('--blatt-noten-satz'),
        spalte: proz('--blatt-cornell-spalte'),
        /* Blattmasse — muessen in PIXELN gleich sein */
        taktPx: proz('--blatt-noten-takt') / 100 * h,
        zeilePx: proz('--blatt-zeile') / 100 * h,
        seitePx: proz('--blatt-seite-hoch') / 100 * h
      };
    };
    return JSON.stringify({ eins: lies(zwei[0]), drei: lies(zwei[1]) });
  })()`) as string);
  const rund = (x: number) => Math.round(x * 100) / 100;
  p('Das dreiseitige Blatt ist dreimal so hoch', Math.abs(r.drei.hoehe - r.eins.hoehe * 3) <= 3,
    `${r.eins.hoehe} → ${r.drei.hoehe}`);
  gleich('Eine Seite ist dort ein Drittel des Blattes', [rund(r.eins.seiteHoch), rund(r.drei.seiteHoch)],
    [100, 33.33]);
  /* DIE KACHELMASSE: gleich, weil sie sich auf die Kachel beziehen und die
     Kachel je Blatt EINE Seite ist. Vor der Berichtigung waren sie es nicht,
     und das Notenpapier zeigte eine Linie je System statt fünf. */
  gleich('Cornell-Kopf: dieselbe Prozentzahl auf beiden', rund(r.eins.kopf), rund(r.drei.kopf));
  gleich('Cornell-Fuss: dieselbe', rund(r.eins.fuss), rund(r.drei.fuss));
  gleich('Notenabstand: dieselbe', rund(r.eins.notenLinie), rund(r.drei.notenLinie));
  gleich('Notensystem: dieselbe', rund(r.eins.notenSatz), rund(r.drei.notenSatz));
  gleich('Die Spalte misst quer und ist auf beiden gleich', rund(r.eins.spalte), rund(r.drei.spalte));
  /* UND DIE ZAHLEN SELBST — gegen die Millimeter gerechnet, nicht abgeschrieben. */
  gleich('Der Kopf ist 30 von 297 mm', rund(r.eins.kopf), rund(30 / 297 * 100));
  gleich('Der Fuss 50 von 297 mm', rund(r.eins.fuss), rund(50 / 297 * 100));
  gleich('Die Spalte 50 von 210 mm', rund(r.eins.spalte), rund(50 / 210 * 100));
  gleich('Der Notenabstand 3 von 27 mm', rund(r.eins.notenLinie), rund(3 / 27 * 100));
  gleich('Das Notensystem 12 von 27 mm', rund(r.eins.notenSatz), rund(12 / 27 * 100));
  /* DIE BLATTMASSE: in PIXELN gleich, obwohl die Prozentzahl verschieden ist. */
  p('Ein Notentakt ist auf beiden gleich lang (in Pixeln)',
    Math.abs(r.eins.taktPx - r.drei.taktPx) < 1.5, `${rund(r.eins.taktPx)} px gegen ${rund(r.drei.taktPx)} px`);
  p('Eine Zeile auch', Math.abs(r.eins.zeilePx - r.drei.zeilePx) < 1.5,
    `${rund(r.eins.zeilePx)} px gegen ${rund(r.drei.zeilePx)} px`);
  p('Und eine Seite auch', Math.abs(r.eins.seitePx - r.drei.seitePx) < 1.5,
    `${rund(r.eins.seitePx)} px gegen ${rund(r.drei.seitePx)} px`);
  await s.close();
}

/* ═══ §3 Die Muster stehen da ══════════════════════════════════════════════ */
console.log('\n§3 Sechs Schichten bei Cornell, eine bei den Noten');
{
  const s = await mitBlaettern();
  const r = JSON.parse(await s.evaluate(`(() => {
    const el = document.querySelector('.blatt-papier');
    /* JEDER WERT WIRD SOFORT ABGESCHRIEBEN. getComputedStyle gibt ein
       LEBENDES Objekt zurueck: wer es aufhebt und danach data-papier
       umstellt, liest hinterher die Werte des NEUEN Papiers aus einer
       Variablen, die nach dem alten aussieht. Genau daran ist die erste
       Fassung dieses Punktes gescheitert — sie las die Wiederholung von
       blanko und hielt sie fuer die von Cornell. */
    const jetzt = () => {
      const cs = getComputedStyle(el);
      return { bild: cs.backgroundImage, wdh: cs.backgroundRepeat,
        papier: cs.getPropertyValue('--paper').trim() };
    };
    const cornell = jetzt();
    el.setAttribute('data-papier', 'noten');
    const noten = jetzt();
    el.setAttribute('data-papier', 'blanko');
    const blanko = jetzt();
    el.setAttribute('data-papier', 'cornell');
    /* Die Papierfarbe als rgb(), damit die Baender daran messbar sind. */
    const probe = document.createElement('div');
    probe.style.color = cornell.papier || '#fff';
    document.body.appendChild(probe);
    const papierRgb = getComputedStyle(probe).color;
    probe.remove();
    return JSON.stringify({
      cornellSchichten: (cornell.bild.split('linear-gradient(').length - 1),
      baender: (cornell.bild.split(papierRgb).length - 1),
      papierFarbe: cornell.papier, papierRgb,
      wiederholung: cornell.wdh,
      notenSchichten: (noten.bild.split('linear-gradient(').length - 1),
      notenLinien: (noten.bild.split('rgb(142, 163, 189)').length - 1),
      leer: blanko.bild
    });
  })()`) as string);
  gleich('Cornell hat sechs Schichten', r.cornellSchichten, 6);
  /* DIE PAPIERFARBE IST NICHT WEISS, sondern `--paper` = #f8f8f5 — und die
     Bänder nehmen genau dieses Token. Ein Band in reinem Weiss stünde als
     hellerer Streifen auf dem Papier, und niemand wüsste, warum. */
  p('Zwei Bänder in genau der Papierfarbe (sie decken Kopf und Fuss)', r.baender >= 4,
    `${r.baender} Stopps in ${r.papierRgb} (Token ${r.papierFarbe})`);
  /* Sechs Schichten, sechsmal `repeat-y` — der berechnete Wert nennt jede
     Schicht einzeln, auch wenn im Stilblatt nur einmal `repeat-y` steht. */
  p('Jede Kachel wiederholt sich längs, nicht in beide Richtungen',
    r.wiederholung.split(',').every((x: string) => x.trim() === 'repeat-y'), r.wiederholung);
  gleich('Notenlinien sind EIN Verlauf', r.notenSchichten, 1);
  p('… mit zehn Farbstopps für fünf Linien', r.notenLinien === 10, String(r.notenLinien));
  gleich('Blanko hat gar keines', r.leer, 'none');
  await s.close();
}

/* ═══ §4 Der Wähler ════════════════════════════════════════════════════════ */
console.log('\n§4 Sieben Knöpfe, jeder mit Muster und Namen');
{
  const s = await mitBlaettern();
  const r = JSON.parse(await s.evaluate(`(() => {
    /* NUR DIE ERSTE LEISTE. Auf der Seite stehen zwei Blätter, also zwei
       Leisten und vierzehn Knöpfe — gezählt wird die Klappe EINES Blatts. */
    const huelle = document.querySelector('.blatt-huelle');
    huelle.querySelector('.blatt-papierknopf').click();
    const liste0 = huelle.querySelector('.blatt-papierliste');
    const knoepfe = [...liste0.querySelectorAll('.blatt-papierwahl')];
    const masse = knoepfe.map(k => Math.round(k.getBoundingClientRect().height));
    const namen = knoepfe.map(k => k.getAttribute('aria-label'));
    const muster = knoepfe.map(k => {
      const i = k.querySelector('i');
      return getComputedStyle(i).backgroundImage !== 'none' || k.getAttribute('data-papier') === 'blanko';
    });
    return JSON.stringify({ anzahl: knoepfe.length, masse, namen, muster,
      offen: !liste0.hasAttribute('hidden'),
      rollt: liste0.scrollWidth > liste0.clientWidth + 2 });
  })()`) as string);
  gleich('Sieben Knöpfe in der Klappe', r.anzahl, 7);
  p('Jeder trägt seinen Namen (§38)',
    r.namen.includes('Papier: Cornell-Notizen') && r.namen.includes('Papier: Notenlinien'),
    JSON.stringify(r.namen));
  p('Jeder zeigt SEIN Muster, keinen leeren Kasten', r.muster.every(Boolean), JSON.stringify(r.muster));
  p('Die Klappe rollt nicht — sieben passen nebeneinander', !r.rollt);
  p('Alle gleich hoch', new Set(r.masse).size === 1, JSON.stringify(r.masse));

  /* DAS STUDIO LIEST DENSELBEN KATALOG (§8) — nicht seine eigene Liste. */
  p('Der Wähler für neue Seiten im Studio hängt an `Blatt.PAPIERE`',
    /Array\.isArray\(\(Blatt as any\)\.PAPIERE\)/.test(lies('src/bereiche/pdf/document-mode.ts')));
  await s.close();
}

/* ═══ §5 Wechseln verliert nichts ══════════════════════════════════════════ */
console.log('\n§5 Papier wechseln, Inhalt behalten');
{
  const s = await mitBlaettern();
  const r = JSON.parse(await s.evaluate(`(async () => {
    const flaeche = document.querySelector('.blatt-marken');
    const id = flaeche.closest('[data-bid]').getAttribute('data-bid');
    Store.updateBlock(id, { marken: [
      { id: 'w1', art: 'stift', farbe: '#111111', breite: 2, pts: [[10, 10], [80, 80]] }
    ] });
    Store.addBlock(id, 'text', { text: 'Bleibt stehen' });
    App.zeichneSeite();
    await new Promise(f => setTimeout(f, 600));
    const wege = ['blanko', 'noten', 'cornell', 'mm', 'cornell'];
    for (const art of wege) {
      Store.updateBlock(id, { papier: art });
      App.zeichneSeite();
      await new Promise(f => setTimeout(f, 250));
    }
    const block = Store.getBlock(id);
    const kinder = (block.content || []).map(k => Store.getBlock(k)).filter(Boolean);
    return JSON.stringify({
      papier: block.papier,
      marken: (block.marken || []).length,
      markeId: (block.marken || [])[0]?.id,
      text: kinder.map(k => k.text).join('|'),
      imBild: document.querySelector('.blatt-papier').getAttribute('data-papier')
    });
  })()`) as string);
  gleich('Am Ende steht Cornell', [r.papier, r.imBild], ['cornell', 'cornell']);
  gleich('Die Marke ist noch da, mit ihrer Kennung', [r.marken, r.markeId], [1, 'w1']);
  p('Und der Text auch', /Bleibt stehen/.test(String(r.text)), String(r.text));
  await s.close();
}

/* ═══ §6 Quellen ═══════════════════════════════════════════════════════════ */
console.log('\n§6 Quellen');
{
  const q = lies('src/bereiche/bloecke/arten/blatt.ts');
  p('Der Katalog steht einmal (`PAPIERE`)', (q.match(/const PAPIERE = /g) || []).length === 1);
  p('Es gibt beide Rechenwege, und sie heissen verschieden',
    /const inKachel = /.test(q) && /const inSeitenkachel = /.test(q) && /const seite = /.test(q));
  p('Warum Kachel und nicht Blatt, steht daneben',
    /beziehen sich auf die KACHEL/.test(q));
  p('Isometrisches Papier ist begründet abgelehnt, nicht vergessen',
    /WARUM KEIN ISOMETRISCHES PAPIER/.test(q));
  p('Das erzeugte JS trägt es', /cornell/.test(lies('quell/bereiche/bloecke/arten/blatt.js')));
  const css = lies('quell/schale/stil/bausteine.css');
  p('Das Stilblatt kennt beide Papiere',
    /\[data-papier="cornell"\]/.test(css) && /\[data-papier="noten"\]/.test(css));
  p('… und beide Vorschauen im Wähler',
    /data-vorschau="cornell"/.test(css) && /data-vorschau="noten"/.test(css));
  gleich('Keine Seitenfehler', fehler, []);
}

await browser.close();
server.close();
console.log(`\n${ok}/${ok + weg} bestanden · ✗=${weg}`);
process.exit(weg ? 1 : 0);
