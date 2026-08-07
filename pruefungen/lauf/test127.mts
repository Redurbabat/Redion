/* Suite 91 — Kontrast: gerechnet, nicht geschätzt
 * ============================================================================
 * Beim Umstieg auf Nocturne (E44) war die Farbwahl an zwei Stellen strittig,
 * und beide Male hat eine Rechnung entschieden statt eines Geschmacks:
 *
 *   · Die Vorgabe nennt #EF4444 gleichzeitig als Akzent UND als Gefahr. Auf
 *     einer Karte kommt Rot auf 4.33:1 — unter die Grenze für Text. Orange
 *     liegt bei 5.8:1. Also Orange als Akzent, Rot bleibt das Zeichen für
 *     Unwiderrufliches.
 *
 *   · Dasselbe Orange auf Weiss: 2.80:1. Eine Farbe, die auf Schwarz
 *     leuchtet, verschwindet auf Weiss — der häufigste Fehler bei dunkel
 *     entworfenen Oberflächen. Der Hellmodus hat deshalb eigene Werte.
 *
 * WARUM DAS EINE PRÜFUNG BRAUCHT. Ein Kontrast ist keine Meinung, aber er
 * ist auch nicht sichtbar: 4.4:1 und 4.6:1 sehen gleich aus, und nur eines
 * davon kann jemand mit schwachen Augen lesen. Ohne Rechnung hält so eine
 * Entscheidung bis zur nächsten Farbänderung.
 *
 * GEMESSEN WIRD AM LAUFENDEN BROWSER, nicht an den Stilblättern: was zählt,
 * ist der Wert, der am Ende gilt — samt allem, was ihn unterwegs
 * überschreibt. Genau daran hing der erste Versuch: ein Inline-Stil aus den
 * Einstellungen setzte den alten Akzent, und die neue Farbe war zwar im
 * Stilblatt, aber nie auf dem Bildschirm.
 *
 *   node pruefungen/lauf/test127.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};

/** Relative Helligkeit nach WCAG. */
const helligkeit = (rgb: [number, number, number]): number => {
  const f = (c: number) => { const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(rgb[0]) + 0.7152 * f(rgb[1]) + 0.0722 * f(rgb[2]);
};
const verhaeltnis = (a: [number, number, number], b: [number, number, number]): number => {
  const [h, d] = [helligkeit(a), helligkeit(b)].sort((x, y) => y - x) as [number, number];
  return (h + 0.05) / (d + 0.05);
};

const browser = await chromium.launch();

/** Die Farben so lesen, wie der Browser sie am Ende hat. */
const farben = async (hell: boolean) => {
  const s = await browser.newPage({ viewport: { width: 1200, height: 800 } });
  await s.goto('file://' + WURZEL + '/index.html');
  await s.waitForTimeout(2000);
  if (hell) {
    await s.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
    await s.waitForTimeout(300);
  }
  const raus = await s.evaluate(() => {
    /* Über ein echtes Element auflösen — `getPropertyValue` gibt den
       rohen Text, `getComputedStyle(el).color` die aufgelöste Farbe. */
    const probe = document.createElement('span');
    document.body.appendChild(probe);
    const lies = (marke: string) => {
      probe.style.color = `var(${marke})`;
      const c = getComputedStyle(probe).color;
      const z = (c.match(/[\d.]+/g) || []).map(Number);
      return [z[0] ?? 0, z[1] ?? 0, z[2] ?? 0] as [number, number, number];
    };
    const werte: Record<string, [number, number, number]> = {};
    ['--bg', '--bg-card', '--text', '--text-dim', '--text-faint',
     '--accent', '--gefahr', '--erfolg', '--info', '--warnung'].forEach(m => { werte[m] = lies(m); });
    probe.remove();
    return werte;
  });
  await s.close();
  return raus as Record<string, [number, number, number]>;
};

for (const [name, hell] of [['Dunkel', false], ['Hell', true]] as [string, boolean][]) {
  console.log(`\n${name === 'Dunkel' ? '1' : '2'} · ${name}modus`);
  const f = await farben(hell);
  const grund = f['--bg']!, karte = f['--bg-card']!;

  const pruefe = (marke: string, grenze: number, wozu: string) => {
    const aufGrund = verhaeltnis(f[marke]!, grund);
    const aufKarte = verhaeltnis(f[marke]!, karte);
    p(`${marke} ${wozu} (≥ ${grenze}:1)`,
      aufGrund >= grenze && aufKarte >= grenze,
      `Grund ${aufGrund.toFixed(2)}:1, Karte ${aufKarte.toFixed(2)}:1`);
  };

  pruefe('--text', 7, 'ist gut lesbar');
  pruefe('--text-dim', 4.5, 'trägt Fliesstext');
  /* `--text-faint` ist Beiwerk — Zeitstempel, Zähler. 3:1 ist die Grenze
     für Grosstext und Symbole, und mehr behauptet Redion davon auch nicht. */
  pruefe('--text-faint', 3, 'ist Beiwerk');
  pruefe('--accent', 4.5, 'trägt Text und Knöpfe');
  pruefe('--gefahr', 4, 'ist als Warnung lesbar');
  pruefe('--erfolg', 4, 'ist lesbar');
  pruefe('--info', 4, 'ist lesbar');
  pruefe('--warnung', 4, 'ist lesbar');

  /* DIE ZWEITE HÄLFTE DER ENTSCHEIDUNG: Akzent und Gefahr müssen sich
     UNTERSCHEIDEN. Sind sie gleich, sieht „Sichern" aus wie „Löschen" —
     und genau das schlägt die Vorgabe vor, die beide auf #EF4444 setzt. */
  const a = f['--accent']!, g = f['--gefahr']!;
  const abstand = Math.abs(a[0] - g[0]) + Math.abs(a[1] - g[1]) + Math.abs(a[2] - g[2]);
  p('Akzent und Gefahr sind unterscheidbar', abstand >= 60,
    `Abstand ${abstand} — sonst sieht „Sichern" aus wie „Löschen"`);
}

console.log('\n3 · Der Akzent gehört dem Stilblatt, nicht einem Inline-Stil');

/* HIER HING DER GANZE UMSTIEG. Die Schemata „Standard" und „Hell" setzten
   den Akzent per `style.setProperty` auf `documentElement` — das schlägt
   jedes Stilblatt. Die Nocturne-Farbe stand in `dunkel.css` und kam nie
   an. Und ein einziger Inline-Wert kann für beide Modi nicht stimmen. */
const s = await browser.newPage({ viewport: { width: 1200, height: 800 } });
await s.goto('file://' + WURZEL + '/index.html');
await s.waitForTimeout(2000);
const inline = await s.evaluate(() => ({
  gesetzt: document.documentElement.style.getPropertyValue('--accent').trim(),
  gilt: getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()
}));
p('Kein Inline-Akzent im Standardschema', inline.gesetzt === '',
  `„${inline.gesetzt}" — damit kann kein Stilblatt den Modus mehr bestimmen`);
p('Und es gilt trotzdem einer', inline.gilt !== '', inline.gilt);
await s.close();

await browser.close();
console.log(`\n  Suite 91 — Kontrast: ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
