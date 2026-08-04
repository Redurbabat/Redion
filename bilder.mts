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
      k.style.cssText = 'position:fixed; inset:0; z-index:9999; background:var(--bg);' +
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

  tabelleLeer: {
    titel: 'Der leere Zustand',
    bauen: () => {
      const w = window as any;
      const seite = Object.values(Store.cache.blocks).find((b: any) => b.type === 'page' && b.alive) as any;
      const blk = Store.addBlock(seite.id, 'spreadsheet', { text: 'Neu' });
      const k = document.createElement('div');
      k.id = 'bildkasten';
      k.style.cssText = 'position:fixed; inset:0; z-index:9999; background:var(--bg);' +
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
