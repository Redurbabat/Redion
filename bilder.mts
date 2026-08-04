#!/usr/bin/env node
/* ============================================================================
 * bilder.mts — Bildschirmfotos von Redion, damit man das Ergebnis SIEHT
 * ----------------------------------------------------------------------------
 *     node bilder.mts                  alle Ansichten
 *     node bilder.mts tabelle          nur die Tabelle
 *     node bilder.mts tabelle handy    nur die Tabelle am Telefon
 *
 * WARUM ES DIESE DATEI GIBT. Beide Gestaltungs-Skills sagen denselben Satz,
 * und er ist der wichtigste in beiden: *Öffne die Seite wirklich, statt nur
 * den Code zu lesen.* Genau daran scheitert man sonst — der Code liest sich
 * richtig, und auf dem Bildschirm steht etwas anderes.
 *
 * Belegt: gefunden wurden so vier Fehler, die keine einzige Prüfung hatte.
 *
 *   · Eine abgeschnittene Zahl zeigte eine ANDERE Zahl (`634.21` als
 *     `34.21`). Kein Prüflauf sah das, weil beide Zahlen gültig sind.
 *   · Die Ausrichtungsknöpfe `⟨ ≡ ⟩` sahen auf dem Bildschirm aus wie
 *     Klammern.
 *   · Ein zweiter Fokusrahmen zog eine blaue Linie durchs Bild, die nichts
 *     bedeutete.
 *   · Am Telefon stand die halbe Werkzeugleiste ausserhalb des Bildes.
 *
 * ─── DIE BILDER GEHEN NIE AUF GITHUB ───────────────────────────────────────
 *
 * Sie landen in `bilder/`, und `bilder/` steht in `.gitignore`. Das ist eine
 * ausdrückliche Ansage von Redur und kein Versehen: Bildschirmfotos sind
 * Arbeitsmaterial, keine Quelle. Sie gehören auf den Rechner, an dem
 * gearbeitet wird — nicht ins Verzeichnis, nicht in die Einzeldatei, nicht
 * ins Dienst-Skript.
 *
 * Ein Verzeichnis, das mit jedem Durchgang um ein paar hundert Kilobyte
 * wächst, ist nach einem Monat grösser als die App. Und ein Bild von gestern
 * beantwortet keine Frage von heute — was zählt, ist der Blick auf das, was
 * jetzt gebaut wurde.
 *
 * Diese Datei selbst gehört sehr wohl ins Verzeichnis: sie ist das Werkzeug,
 * mit dem jeder die Bilder in zehn Sekunden neu macht.
 *
 * DIE GERÄTE stehen unten in `GERAETE` und kommen aus `redion-mobile-ux`:
 * das iPhone 13 Pro Max ist dort das Zielgerät, 390 px die schmale Probe.
 *
 * `.mts` und nicht `.mjs` — E28: neuer Code ist TypeScript, und `test109`
 * würde eine neue `.mjs` sofort melden. Node führt `.mts` seit 22.18 direkt
 * aus; `.mts` statt `.ts`, weil die `package.json` in der Wurzel kein `type`
 * setzt und dort CommonJS gilt.
 * ==========================================================================*/
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const WURZEL: string = dirname(fileURLToPath(import.meta.url));
const ZIEL = join(WURZEL, 'bilder');
const PORT = 8891;

const TYP: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png',
  '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon', '.svg': 'image/svg+xml'
};

/* Vier Geräte statt zweier Breiten: die Zahlen sind die aus den Skills, und
   das grosse iPhone ist ausdrücklich das Zielgerät, nicht das kleine. */
const GERAETE: Record<string, { breite: number; hoehe: number }> = {
  rechner:   { breite: 1280, hoehe: 900 },
  laptop:    { breite: 1024, hoehe: 768 },
  handy:     { breite: 390,  hoehe: 844 },   /* iPhone 13/14/15 — die enge Probe */
  handyGross:{ breite: 428,  hoehe: 926 }    /* iPhone 13 Pro Max — das Zielgerät */
};

const server = createServer((a, b) => {
  const rein = decodeURIComponent(String(a.url).split('?')[0] || '/');
  const pfad = join(WURZEL, rein === '/' ? 'index.html' : rein.slice(1));
  if (!pfad.startsWith(WURZEL) || !existsSync(pfad)) { b.writeHead(404); b.end(); return; }
  b.writeHead(200, { 'Content-Type': TYP[pfad.slice(pfad.lastIndexOf('.'))] || 'application/octet-stream' });
  b.end(readFileSync(pfad));
});

/* ==========================================================================
 * DIE ANSICHTEN
 * --------------------------------------------------------------------------
 * Jede baut sich ihren Inhalt selbst auf. Ein Bild von einer leeren App
 * zeigt nichts — die Daten hier sind bewusst die, an denen etwas schiefgeht:
 * lange Zahlen, ein Fehlerwert, Währung, Fettes, ein Zirkelbezug.
 * ========================================================================*/
const ANSICHTEN: Record<string, { titel: string; bauen: () => void }> = {

  tabelle: {
    titel: 'Der Tabellenblock',
    bauen: () => {
      const w = window as any;
      const seite = Object.values(Store.cache.blocks).find((b: any) => b.type === 'page' && b.alive) as any;
      const blk = Store.addBlock(seite.id, 'spreadsheet', { text: 'Haushalt' });
      const bl = w.Spreadsheet.neueMappe('Haushalt').blaetter[0];
      const daten = [
        ['Posten', 'Jan', 'Feb', 'Mär', 'Schnitt'],
        ['Miete', '1450', '1450', '1450', '=MITTELWERT(B2:D2)'],
        ['Strom', '98,4', '104,2', '91,75', '=MITTELWERT(B3:D3)'],
        ['Einkauf', '612,3', '588,9', '701,45', '=MITTELWERT(B4:D4)'],
        ['Handy', '39', '39', '39', '=MITTELWERT(B5:D5)'],
        ['Summe', '=SUMME(B2:B5)', '=SUMME(C2:C5)', '=SUMME(D2:D5)', '=SUMME(E2:E5)'],
        ['Zu lang', '1234567890123456', '', '', ''],
        ['Fehler', '=UNBEKANNT(1)', '', '', '']
      ];
      daten.forEach((zeile: string[], z: number) => zeile.forEach((wert: string, sp: number) =>
        w.Spreadsheet.setze(bl, String.fromCharCode(65 + sp) + (z + 1), wert)));
      ['A1', 'B1', 'C1', 'D1', 'E1'].forEach((a: string) => { bl.zellen[a].stil = { fett: true, ausrichtung: 'mitte' }; });
      ['A6', 'B6', 'C6', 'D6', 'E6'].forEach((a: string) => {
        bl.zellen[a].stil = Object.assign({}, bl.zellen[a].stil, { fett: true }); });
      ['B2', 'C2', 'D2', 'E2', 'B6', 'C6', 'D6', 'E6'].forEach((a: string) => {
        bl.zellen[a].stil = Object.assign({}, bl.zellen[a].stil || {},
          { format: { art: 'waehrung', stellen: 2, waehrung: 'CHF' } }); });
      bl.breiten = { 0: 130 };
      blk.mappe = { id: 'm1', name: 'Haushalt', blaetter: [bl], aktiv: bl.id,
                    erstellt: new Date().toISOString(), geaendert: new Date().toISOString() };

      const k = document.createElement('div');
      k.id = 'bildkasten';
      k.style.cssText = 'position:fixed; inset:0; z-index:600; background:var(--bg);' +
                        'padding:24px 20px; overflow:auto';
      k.innerHTML = '<div id="bildinhalt" style="max-width:900px;margin:0 auto">' +
        '<h1 style="font:700 30px var(--font);color:var(--text);margin:0 0 16px">Haushalt</h1></div>';
      document.body.appendChild(k);
      document.getElementById('bildinhalt')!.appendChild(w.SpreadsheetView.zeichne(blk));
      /* Eine Zelle auswählen — sonst sieht man den Auswahlrahmen nie, und der
         ist laut Entwurf das eine Element, an das man sich erinnert. */
      setTimeout(() => {
        const z = k.querySelector('[data-a="C4"]');
        if (z) z.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      }, 120);
    }
  },

  raster: {
    titel: 'Datenbank als Raster',
    bauen: () => {
      const w = window as any;
      const seite = Object.values(Store.cache.blocks).find((b: any) => b.type === 'page' && b.alive) as any;
      /* Eine echte Datenbank anlegen und fuellen. */
      Store.addDatabase(seite.id, 'Kunden', {
        title:  { name: 'Kunde',      type: 'title'  },
        umsatz: { name: 'Umsatz',     type: 'number' },
        ort:    { name: 'Ort',        type: 'text'   },
        status: { name: 'Status',     type: 'select', options: [
          { name: 'Aktiv', color: 'green' }, { name: 'Ruht', color: 'gray' }] },
        seit:   { name: 'Kunde seit', type: 'created' }
      }, 'raster');
      const coll = Object.values(Store.cache.collections).slice(-1)[0] as any;
      const view = Object.values(Store.cache.views)
        .find((v: any) => v.collectionId === coll.id) as any;
      const titel = 'title', zahlKey = 'umsatz', ortKey = 'ort';

      [['Meier AG', 14500, 'Zürich'], ['Bäckerei Süd', 3200, 'Bern'],
       ['Huber & Co', 8750.5, 'Basel'], ['Studio Nord', 1290, 'Luzern'],
       ['Werkstatt Kern', 22400, 'St. Gallen'], ['Café Lindenhof', 640, 'Zug']]
        .forEach(([n, u, o]: any) => {
          const r = Store.addRow(coll.id, {});
          Store.updateBlock(r.id, { text: n });
          Store.setProp(r.id, zahlKey, u);
          Store.setProp(r.id, ortKey, o);
          Store.setProp(r.id, 'status', u > 5000 ? 'Aktiv' : 'Ruht');
        });

      view.layout = 'raster';
      view.breiten = { [titel]: 190, [zahlKey]: 130, [ortKey]: 130 };
      const rows = Store.rowsOf(coll.id);

      const k = document.createElement('div');
      k.id = 'bildkasten';
      k.style.cssText = 'position:fixed; inset:0; z-index:600; background:var(--bg); padding:24px 20px; overflow:auto';
      k.innerHTML = '<div id="bildinhalt" style="max-width:900px;margin:0 auto">' +
        '<h1 style="font:700 30px var(--font);color:var(--text);margin:0 0 4px">Kunden</h1>' +
        '<p style="font:13px var(--font);color:var(--text-dim);margin:0 0 14px">' +
        'Raster — Pfeiltasten, Bereiche, Einfügen aus Excel</p></div>';
      document.body.appendChild(k);
      document.getElementById('bildinhalt')!.appendChild(w.DbRaster.zeichne(coll, view, rows));
      setTimeout(() => {
        const z = k.querySelector('[data-z="1"][data-s="1"]');
        if (z) z.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        const z2 = k.querySelector('[data-z="3"][data-s="1"]');
        if (z2) z2.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, shiftKey: true }));
      }, 200);
    }
  },

  fehler: {
    titel: 'Fehlerwerte, die sagen was los ist',
    bauen: () => {
      const w = window as any;
      const seite = Object.values(Store.cache.blocks).find((b: any) => b.type === 'page' && b.alive) as any;
      const blk = Store.addBlock(seite.id, 'spreadsheet', { text: 'Fehler' });
      const bl = w.Spreadsheet.neueMappe('Fehler').blaetter[0];
      const daten = [
        ['Was', 'Formel', 'Ergebnis'],
        ['Geteilt durch null', '=A1/B9', '=A2/B9'],
        ['Wurzel aus minus', '=WURZEL(-1)', '=WURZEL(-1)'],
        ['Funktion falsch geschrieben', '=LOG(10)', '=LOG(10)'],
        ['Zwei Zellen im Kreis', '=C6', '=C5'],
        ['Zu grosser Bereich', '', '=SUMME(A1:ZZ99999)'],
        ['Geht auf', '=10/4', '=10/4']
      ];
      daten.forEach((z: string[], i: number) => z.forEach((v: string, s: number) =>
        w.Spreadsheet.setze(bl, String.fromCharCode(65 + s) + (i + 1), v)));
      ['A1', 'B1', 'C1'].forEach(a => { bl.zellen[a].stil = { fett: true, ausrichtung: 'mitte' }; });
      bl.breiten = { 0: 210, 1: 150, 2: 130 };
      blk.mappe = { id: 'f', name: 'Fehler', blaetter: [bl], aktiv: bl.id, erstellt: '', geaendert: '' };

      const k = document.createElement('div');
      k.id = 'bildkasten';
      k.style.cssText = 'position:fixed; inset:0; z-index:600; background:var(--bg); padding:24px 20px; overflow:auto';
      k.innerHTML = '<div id="bildinhalt" style="max-width:900px;margin:0 auto">' +
        '<h1 style="font:700 30px var(--font);color:var(--text);margin:0 0 16px">Fehlerwerte</h1></div>';
      document.body.appendChild(k);
      document.getElementById('bildinhalt')!.appendChild(w.SpreadsheetView.zeichne(blk));
      setTimeout(() => {
        const z = k.querySelector('[data-a="C2"]');
        if (z) z.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      }, 150);
    }
  },

  blaetter: {
    titel: 'Mehrere Blätter',
    bauen: () => {
      const w = window as any;
      const seite = Object.values(Store.cache.blocks).find((b: any) => b.type === 'page' && b.alive) as any;
      const blk = Store.addBlock(seite.id, 'spreadsheet', { text: 'Jahr 2026' });
      const mappe = w.Spreadsheet.neueMappe('Jahr 2026');
      const jan = mappe.blaetter[0];
      jan.name = 'Januar';
      const feb = w.Spreadsheet.neuesBlatt('Februar');
      const jahr = w.Spreadsheet.neuesBlatt('Jahr gesamt');
      mappe.blaetter.push(feb, jahr);

      [['Posten', 'Betrag'], ['Miete', '1450'], ['Strom', '98,4'],
       ['Einkauf', '612,3'], ['Summe', '=SUMME(B2:B4)']]
        .forEach((z: string[], i: number) => z.forEach((v: string, s: number) =>
          w.Spreadsheet.setze(jan, String.fromCharCode(65 + s) + (i + 1), v)));
      [['Posten', 'Betrag'], ['Miete', '1450'], ['Strom', '104,2'],
       ['Einkauf', '588,9'], ['Summe', '=SUMME(B2:B4)']]
        .forEach((z: string[], i: number) => z.forEach((v: string, s: number) =>
          w.Spreadsheet.setze(feb, String.fromCharCode(65 + s) + (i + 1), v)));
      [['Monat', 'Summe'], ['Januar', '=Januar!B5'], ['Februar', '=Februar!B5'],
       ['Zusammen', '=SUMME(B2:B3)'], ['Schnitt', '=MITTELWERT(B2:B3)']]
        .forEach((z: string[], i: number) => z.forEach((v: string, s: number) =>
          w.Spreadsheet.setze(jahr, String.fromCharCode(65 + s) + (i + 1), v)));

      [jan, feb, jahr].forEach((b: any) => {
        ['A1', 'B1'].forEach(a => { if (b.zellen[a]) b.zellen[a].stil = { fett: true, ausrichtung: 'mitte' }; });
        ['A5', 'B5'].forEach(a => { if (b.zellen[a]) b.zellen[a].stil = Object.assign({}, b.zellen[a].stil, { fett: true }); });
        b.breiten = { 0: 130 };
      });
      jahr.zellen['B4'].stil = { fett: true, format: { art: 'waehrung', stellen: 2, waehrung: 'CHF' } };

      mappe.aktiv = jahr.id;
      blk.mappe = mappe;

      const k = document.createElement('div');
      k.id = 'bildkasten';
      k.style.cssText = 'position:fixed; inset:0; z-index:600; background:var(--bg); padding:24px 20px; overflow:auto';
      k.innerHTML = '<div id="bildinhalt" style="max-width:900px;margin:0 auto">' +
        '<h1 style="font:700 30px var(--font);color:var(--text);margin:0 0 16px">Jahr 2026</h1></div>';
      document.body.appendChild(k);
      document.getElementById('bildinhalt')!.appendChild(w.SpreadsheetView.zeichne(blk));
      setTimeout(() => {
        const z = k.querySelector('[data-a="B4"]');
        if (z) z.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      }, 150);
    }
  },

  einlesen: {
    titel: 'Die Frage vor dem Einlesen',
    bauen: () => {
      const w = window as any;
      const seite = Object.values(Store.cache.blocks).find((b: any) => b.type === 'page' && b.alive) as any;
      const blk = Store.addBlock(seite.id, 'spreadsheet', { text: 'Haushalt' });
      const bl = w.Spreadsheet.neueMappe('Haushalt').blaetter[0];
      [['Posten', 'Jan'], ['Miete', '1450'], ['Strom', '98,4']].forEach((z: string[], i: number) =>
        z.forEach((v: string, s: number) =>
          w.Spreadsheet.setze(bl, String.fromCharCode(65 + s) + (i + 1), v)));
      blk.mappe = { id: 'm', name: 'Haushalt', blaetter: [bl], aktiv: bl.id,
                    erstellt: '', geaendert: '' };

      const k = document.createElement('div');
      k.id = 'bildkasten';
      k.style.cssText = 'position:fixed; inset:0; z-index:600; background:var(--bg); padding:24px 20px';
      k.innerHTML = '<div id="bildinhalt" style="max-width:900px;margin:0 auto">' +
        '<h1 style="font:700 30px var(--font);color:var(--text);margin:0 0 16px">Haushalt</h1></div>';
      document.body.appendChild(k);
      document.getElementById('bildinhalt')!.appendChild(w.SpreadsheetView.zeichne(blk));

      /* Die Frage, die vor dem Einlesen steht — nachgebaut mit denselben
         Worten, damit das Bild zeigt, was ein Mensch wirklich sieht. */
      setTimeout(() => Dialog.wahl({
        titel: 'Einlesen: Haushalt-2026.xlsx · Blatt „Januar" von 3',
        text: '42 Zeilen × 5 Spalten\n\nPosten · Jan · Feb · Mär\n' +
              'Miete · 1450 · 1450 · 1450\nStrom · 98,4 · 104,2 · 91,75\n…',
        knoepfe: [
          { id: 'a1', text: 'Ab A1 einlesen', hinweis: '6 gefüllte Zellen werden überschrieben' },
          { id: 'hier', text: 'Ab C4 einlesen', hinweis: '0 gefüllte Zellen werden überschrieben' },
          { id: '', text: 'Abbrechen', hinweis: 'Es wird nichts verändert' }
        ]
      }), 200);
    }
  },

  tabelleLeer: {
    titel: 'Der leere Zustand',
    bauen: () => {
      const w = window as any;
      const seite = Object.values(Store.cache.blocks).find((b: any) => b.type === 'page' && b.alive) as any;
      const blk = Store.addBlock(seite.id, 'spreadsheet', { text: 'Neu' });
      const k = document.createElement('div');
      k.id = 'bildkasten';
      k.style.cssText = 'position:fixed; inset:0; z-index:600; background:var(--bg);' +
                        'padding:24px 20px; overflow:auto';
      k.innerHTML = '<div id="bildinhalt" style="max-width:900px;margin:0 auto">' +
        '<h1 style="font:700 30px var(--font);color:var(--text);margin:0 0 16px">Neue Tabelle</h1></div>';
      document.body.appendChild(k);
      document.getElementById('bildinhalt')!.appendChild(w.SpreadsheetView.zeichne(blk));
    }
  }
};

/* ========================================================================*/
const wunsch = process.argv.slice(2);
const nurAnsicht = wunsch.filter(a => ANSICHTEN[a]);
const nurGeraet = wunsch.filter(a => GERAETE[a]);

const ansichten = nurAnsicht.length ? nurAnsicht : Object.keys(ANSICHTEN);
const geraete = nurGeraet.length ? nurGeraet : ['rechner', 'handy'];
const themen = ['dark', 'light'];

if (!existsSync(ZIEL)) mkdirSync(ZIEL, { recursive: true });
await new Promise<void>(f => server.listen(PORT, () => f()));

const browser = await chromium.launch();
const gemacht: string[] = [];

for (const name of ansichten) {
  for (const g of geraete) {
    for (const thema of themen) {
      /* Das Telefon nur einmal — zwei Themen mal vier Geräte wären zwölf
         Bilder, und niemand sieht sich zwölf Bilder an. */
      if (g !== 'rechner' && thema === 'light') continue;

      const seite = await browser.newPage({
        viewport: { width: GERAETE[g].breite, height: GERAETE[g].hoehe },
        deviceScaleFactor: 2
      });
      await seite.goto(`http://localhost:${PORT}/index.html`);
      await seite.waitForFunction(
        () => typeof App !== 'undefined' && typeof Store !== 'undefined' &&
              (document.getElementById('tree')?.children.length || 0) > 0,
        null, { timeout: 30000 });
      await seite.evaluate((t: string) => document.documentElement.setAttribute('data-theme', t), thema);
      await seite.evaluate(ANSICHTEN[name].bauen);
      await seite.waitForTimeout(450);

      const datei = join(ZIEL, `${name}-${g}-${thema === 'light' ? 'hell' : 'dunkel'}.png`);
      await seite.screenshot({ path: datei });
      await seite.close();
      gemacht.push(datei);
      console.log('  ✓ ' + datei.replace(WURZEL + '/', ''));
    }
  }
}

await browser.close();
server.close();
console.log('\n  ' + gemacht.length + ' Bilder in bilder/');
