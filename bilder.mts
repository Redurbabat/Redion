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
/* `bauen` darf ein Versprechen zurückgeben. `page.evaluate` wartet darauf,
   und die Produktwelten zeichnen asynchron — ohne das Warten stünde auf dem
   Bild der Zustand von davor. */
const ANSICHTEN: Record<string, { titel: string; bauen: () => void | Promise<void> }> = {

  /* --- Die zwei Produktwelten ---------------------------------------------
     Sie fehlten hier, und das hat gekostet: vier falsche Zahlen im
     Heute-Bild — „0 neu" bei fabrikneuen Karten, „null Tage" beim
     Prüfungs-Countdown, ein Lernziel, das sich nie bewegt — blieben
     unbemerkt, weil niemand hingesehen hat (E135). §55 sagt: öffne die
     Seite wirklich, statt nur den Code zu lesen. Dafür muss sie in dieser
     Liste stehen. */

  heute: {
    titel: 'Lernen & Alltag — Heute',
    bauen: async () => {
      const w = window as any;
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      document.getElementById('rg-einladung')?.remove();

      const fach = Store.addPage(null, { text: 'Elektrotechnik' });
      for (const q of ['Ohmsches Gesetz :: U = R · I', 'Leistung :: P = U · I',
                       'Arbeit :: W = P · t', 'Reihenschaltung :: R = R1 + R2'])
        Store.addBlock(fach.id, 'flashcard', { text: q });

      /* Eine Prüfung, damit der Countdown etwas zu rechnen hat. */
      const plan = Store.addPage(null, { text: 'Klausurplan' });
      const db = Store.addDatabase(plan.id, 'Klausuren', {
        title: { name: 'Name', type: 'title' },
        wann: { name: 'Datum', type: 'date' } });
      Store.updateCollection(db.collectionId, { schoolKind: 'exams' });
      const in5 = new Date(); in5.setDate(in5.getDate() + 5);
      const zeile = Store.addRow(db.collectionId, { title: 'Ohmsches Gesetz und Leistung' });
      Store.setProp(zeile.id, 'wann', in5.toISOString().slice(0, 10));

      w.Produktwelten.lernen('heute');
      await new Promise(r => setTimeout(r, 900));
    }
  },

  lernzentrale: {
    titel: 'Die Lernzentrale mit ihren vier Startkacheln',
    bauen: async () => {
      const w = window as any;
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      const fach = Store.addPage(null, { text: 'Elektrotechnik' });
      for (const q of ['Ohmsches Gesetz :: U = R · I', 'Leistung :: P = U · I',
                       'Arbeit :: W = P · t'])
        Store.addBlock(fach.id, 'flashcard', { text: q });
      const plan = Store.addPage(null, { text: 'Klausurplan' });
      const db = Store.addDatabase(plan.id, 'Klausuren', {
        title: { name: 'Name', type: 'title' }, wann: { name: 'Datum', type: 'date' } });
      Store.updateCollection(db.collectionId, { schoolKind: 'exams' });
      const in5 = new Date(); in5.setDate(in5.getDate() + 5);
      const zeile = Store.addRow(db.collectionId, { title: 'Ohmsches Gesetz und Leistung' });
      Store.setProp(zeile.id, 'wann', in5.toISOString().slice(0, 10));
      w.Produktwelten.lernen('lernen');
      await new Promise(r => setTimeout(r, 900));
    }
  },

  workspace: {
    titel: 'Workspace — die Übersicht',
    bauen: async () => {
      const w = window as any;
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      w.Produktwelten.workspace('start');
      await new Promise(r => setTimeout(r, 900));
    }
  },

  papier: {
    titel: 'Die Papiervorlagen am A4-Blatt',
    bauen: async () => {
      const w = window as any;
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      /* ÜBER DIE SONDERANSICHT LEGEN, NICHT DURCH SIE HINDURCH NAVIGIEREN.
         Der erste Wurf rief `App.oeffne(seite.id)` — und bekam das
         Heute-Dashboard aufs Bild: seit den Produktwelten steht beim Start
         eine Sonderansicht davor, und `oeffne` räumt sie nicht weg. Die
         anderen Ansichten hier bauen sich deshalb längst ihren eigenen
         Kasten; das ist auch der ehrlichere Weg für ein Bauteilbild. */
      const seite = Object.values(Store.cache.blocks)
        .find((b: any) => b.type === 'page' && b.alive) as any;
      const blatt = Store.addBlock(seite.id, 'blatt', { text: '' });
      Store.updateBlock(blatt.id, { papier: 'kariert' });
      /* Das Kind VOR dem Zeichnen anlegen: `Blatt.zeichne` legt selbst eines
         an, wenn keines da ist — danach zu schreiben käme zu spät. */
      Store.addBlock(blatt.id, 'text', { text: 'Ohmsches Gesetz: U = R · I' });

      const kasten = document.createElement('div');
      kasten.id = 'bildkasten';
      kasten.style.cssText = 'position:fixed; inset:0; z-index:600; background:var(--bg);' +
                             'padding:20px; overflow:auto';
      kasten.innerHTML = '<div id="bildinhalt" style="max-width:820px;margin:0 auto">' +
        '<h1 style="font:700 28px var(--font);color:var(--text);margin:0 0 14px">' +
        'Papiervorlagen</h1></div>';
      document.body.appendChild(kasten);
      document.getElementById('bildinhalt')!.appendChild(w.Blatt.zeichne(Store.getBlock(blatt.id)));
      await new Promise(r => setTimeout(r, 500));
    }
  },


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

  app: {
    titel: 'Die App selbst',
    bauen: () => {
      /* Nichts nachbauen — die echte Schale zeigen, so wie sie startet.
         Alles andere in dieser Datei stellt einen Block frei; hier geht es
         genau um das Drumherum. */
      const alt = document.getElementById('bildkasten');
      if (alt) alt.remove();
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

  /* --- Die Lernwelt jenseits von „Heute" ----------------------------------
     Fünf Ansichten, die in keinem Bilddurchgang vorkamen: Lernpfad,
     Fehlertraining, Prüfungszentrale und die drei Domänen. Genau dort sass
     E135 (sieben falsche Zahlen) und E136 (drei Dinge, die dastanden und
     nicht funktionierten) — beide unbemerkt, weil niemand hingesehen hat. */

  lernpfad: {
    titel: 'Der Lernpfad: Etappen, Fortschritt, nächste Runde',
    bauen: async () => {
      const w = window as any;
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      document.getElementById('rg-einladung')?.remove();
      const fach = Store.addPage(null, { text: 'Elektrotechnik', icon: '⚡' });
      const karten = [
        'Ohmsches Gesetz :: U = R · I', 'Leistung :: P = U · I',
        'Arbeit :: W = P · t', 'Reihenschaltung :: R = R1 + R2',
        'Parallelschaltung :: 1/R = 1/R1 + 1/R2', 'Widerstand :: R = ρ · l / A',
        'Kurzschlussstrom :: Ik = U / Zk', 'Schutzleiter :: PE ist grün-gelb'
      ];
      karten.forEach((q, i) => {
        const b = Store.addBlock(fach.id, 'flashcard', { text: q });
        /* Die ersten vier sind gelernt, zwei davon sicher — sonst zeigt der
           Pfad überall dieselbe Null. */
        if (i < 4) Store.updateBlock(b.id, {
          sr: { wdh: i < 2 ? 3 : 1, ef: 2.5, faellig: new Date(Date.now() + 864e5 * (i + 2)).toISOString() }
        });
      });
      w.Produktwelten.lernen('lernweg');
      await new Promise(r => setTimeout(r, 1000));
    }
  },

  pruefungen: {
    titel: 'Die Prüfungszentrale mit Countdown und Simulation',
    bauen: async () => {
      const w = window as any;
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      document.getElementById('rg-einladung')?.remove();
      const fach = Store.addPage(null, { text: 'Elektrotechnik', icon: '⚡' });
      ['Ohmsches Gesetz :: U = R · I', 'Leistung :: P = U · I',
       'Arbeit :: W = P · t', 'Reihenschaltung :: R = R1 + R2']
        .forEach(q => Store.addBlock(fach.id, 'flashcard', { text: q }));
      const plan = Store.addPage(null, { text: 'Klausurplan', icon: '📝' });
      const db = Store.addDatabase(plan.id, 'Klausuren', {
        title: { name: 'Name', type: 'title' },
        wann: { name: 'Datum', type: 'date' },
        fach: { name: 'Fach', type: 'text' } });
      Store.updateCollection(db.collectionId, { schoolKind: 'exams' });
      const tage = (n: number): string => {
        const d = new Date(); d.setDate(d.getDate() + n);
        return d.toISOString().slice(0, 10);
      };
      [['Ohmsches Gesetz und Leistung', 5, 'Elektrotechnik'],
       ['Schutzmassnahmen', 19, 'Elektrotechnik'],
       ['Mathematik: Vektoren', 33, 'Mathematik']].forEach(([name, n, f]) => {
        const zeile = Store.addRow(db.collectionId, { title: String(name) });
        Store.setProp(zeile.id, 'wann', tage(Number(n)));
        Store.setProp(zeile.id, 'fach', String(f));
      });
      w.Produktwelten.lernen('pruefungen');
      await new Promise(r => setTimeout(r, 1000));
    }
  },

  schule: {
    titel: 'Schule und Ausbildung: Fächer, Aufgaben, Material',
    bauen: async () => {
      const w = window as any;
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      document.getElementById('rg-einladung')?.remove();
      ['Elektrotechnik', 'Mathematik', 'Deutsch', 'Betriebskunde'].forEach(name => {
        const fach = Store.addPage(null, { text: name, icon: '📘' });
        Store.addBlock(fach.id, 'flashcard', { text: name + ' :: erste Karte' });
        Store.addBlock(fach.id, 'todo', { text: 'Aufgabenblatt ' + name + ' abgeben' });
      });
      const plan = Store.addPage(null, { text: 'Noten', icon: '🎓' });
      const db = Store.addDatabase(plan.id, 'Noten', {
        title: { name: 'Fach', type: 'title' },
        note: { name: 'Note', type: 'number' } });
      Store.updateCollection(db.collectionId, { schoolKind: 'grades' });
      [['Elektrotechnik', 5], ['Mathematik', 4.5], ['Deutsch', 5.5]].forEach(([f, n]) => {
        const zeile = Store.addRow(db.collectionId, { title: String(f) });
        Store.setProp(zeile.id, 'note', Number(n));
      });
      w.Produktwelten.lernen('schule');
      await new Promise(r => setTimeout(r, 1000));
    }
  },

  arbeit: {
    titel: 'Arbeit: Projekte, Meetings, Termine, Wissen',
    bauen: async () => {
      const w = window as any;
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      document.getElementById('rg-einladung')?.remove();
      ['Umbau Halle 3', 'Wartungsplan 2026'].forEach(name => {
        const s = Store.addPage(null, { text: name, icon: '💼' });
        Store.addBlock(s.id, 'todo', { text: 'Material bestellen für ' + name });
      });
      const bespr = Store.addPage(null, { text: 'Baustellenbesprechung KW 34', icon: '🎙' });
      Store.updateBlock(bespr.id, { besprechung: true });
      Store.addBlock(bespr.id, 'text', { text: 'Termin für die Abnahme steht.' });
      const wissen = Store.addPage(null, { text: 'Entscheidung: Kabeltyp NYM', icon: '💡' });
      Store.addBlock(wissen.id, 'text', { text: 'NYM-J 5×2,5 für alle Zuleitungen.' });
      w.Produktwelten.lernen('arbeit');
      await new Promise(r => setTimeout(r, 1000));
    }
  },

  /* --- Drei Ansichten, die §25 bis §27 tragen und in keinem Bilddurchgang
     vorkamen. Nach E135, E141 und E143 ist das die Lage, in der Fehler
     jahrelang stehenbleiben. */

  bibliothek: {
    titel: 'Die Bibliothek mit Reitern, Spalten und Quellen',
    bauen: async () => {
      const w = window as any;
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      document.getElementById('rg-einladung')?.remove();
      [['Elektrotechnik Skript', '📕'], ['Wochenplan KW 35', '📅'],
       ['Baustelle Halle 3', '💼'], ['Rezepte', '🍲'],
       ['Prüfungsvorbereitung', '📝']].forEach(([name, icon], i) => {
        const s = Store.addPage(null, { text: String(name), icon: String(icon) });
        if (i < 2) Store.updateBlock(s.id, { favorite: true });
        Store.addBlock(s.id, 'text', { text: 'Ein Satz auf ' + name + '.' });
      });
      await Store.flush();
      w.Produktwelten.bibliothek();
      await new Promise(r => setTimeout(r, 1100));
    }
  },

  aufgaben: {
    titel: 'Aufgaben aus mehreren Quellen in einer Liste',
    bauen: async () => {
      const w = window as any;
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      document.getElementById('rg-einladung')?.remove();
      const projekt = Store.addPage(null, { text: 'Umbau Halle 3', icon: '💼' });
      const db = Store.addDatabase(projekt.id, 'Sprint', {
        title: { name: 'Aufgabe', type: 'title' },
        wann: { name: 'Fällig', type: 'date' },
        status: { name: 'Status', type: 'select', options: [
          { name: 'Offen', color: 'gray' }, { name: 'Erledigt', color: 'green' }] } });
      const tage = (n: number): string => {
        const d = new Date(); d.setDate(d.getDate() + n);
        return d.toISOString().slice(0, 10);
      };
      [['Material bestellen', 1, 'Offen'], ['Kabelwege prüfen', 3, 'Offen'],
       ['Abnahme vorbereiten', 8, 'Offen'], ['Angebot verschickt', -2, 'Erledigt']]
        .forEach(([name, n, st]) => {
          const z = Store.addRow(db.collectionId, { title: String(name) });
          Store.setProp(z.id, 'wann', tage(Number(n)));
          Store.setProp(z.id, 'status', String(st));
        });
      const notiz = Store.addPage(null, { text: 'Notizen', icon: '📝' });
      Store.addBlock(notiz.id, 'todo', { text: 'Aufgabenblatt Elektrotechnik abgeben' });
      Store.addBlock(notiz.id, 'todo', { text: 'Ollama installieren', erledigt: true });
      await Store.flush();
      w.Produktwelten.aufgaben();
      await new Promise(r => setTimeout(r, 1100));
    }
  },

  kalender: {
    titel: 'Termine und Planung in der Wochenansicht',
    bauen: async () => {
      const w = window as any;
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      document.getElementById('rg-einladung')?.remove();
      const plan = Store.addPage(null, { text: 'Termine', icon: '📅' });
      const db = Store.addDatabase(plan.id, 'Termine', {
        title: { name: 'Was', type: 'title' },
        wann: { name: 'Wann', type: 'date' } });
      const tage = (n: number): string => {
        const d = new Date(); d.setDate(d.getDate() + n);
        return d.toISOString().slice(0, 10);
      };
      [['Berufsschule', 0], ['Baustellenbesprechung', 1], ['Klausur Elektrotechnik', 5],
       ['Zahnarzt', 2], ['Abgabe Berichtsheft', 6]].forEach(([name, n]) => {
        const z = Store.addRow(db.collectionId, { title: String(name) });
        Store.setProp(z.id, 'wann', tage(Number(n)));
      });
      await Store.flush();
      w.Produktwelten.workspace('kalender');
      await new Promise(r => setTimeout(r, 1200));
    }
  },

  elektro: {
    titel: 'Der Elektrotechnik-Rechner mit Annahme und Ergebnis',
    bauen: async () => {
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      document.getElementById('rg-einladung')?.remove();
      const seite = Store.addPage(null, { text: 'Elektro-Notizen', icon: '⚡' });
      App.oeffne(seite.id);
      await new Promise(r => setTimeout(r, 500));
      (window as any).Electrical.open();
      await new Promise(r => setTimeout(r, 400));
      const dialog = document.querySelector('.electrical-dialog') as HTMLElement | null;
      if (!dialog) return;
      const wahl = dialog.querySelector('select') as HTMLSelectElement;
      const leistung = [...wahl.options].findIndex(o => /Leistung/.test(o.textContent || ''));
      wahl.selectedIndex = Math.max(0, leistung);
      wahl.dispatchEvent(new Event('change'));
      await new Promise(r => setTimeout(r, 200));
      dialog.querySelectorAll<HTMLInputElement>('input[data-field]').forEach((feld, i) => {
        feld.value = i === 0 ? '230' : '10';
      });
      (dialog.querySelector('[data-action="calculate"]') as HTMLElement | null)?.click();
      await new Promise(r => setTimeout(r, 400));
    }
  },

  whiteboard: {
    titel: 'Die freie Fläche mit Ausschnitt, Massstab und Verbindungen',
    bauen: async () => {
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      document.getElementById('rg-einladung')?.remove();
      const seite = Store.addPage(null, { text: 'Projektskizze', icon: '🖍' });
      Store.addBlock(seite.id, 'whiteboard', {
        text: 'Whiteboard',
        hoehe: 460,
        shapes: [
          { id: 'k1', art: 'notiz', x: 70, y: 60, w: 190, h: 110, farbe: '#529cca',
            text: 'Aufnahme im Unterricht' },
          { id: 'k2', art: 'notiz', x: 380, y: 200, w: 190, h: 110, farbe: '#4dab9a',
            text: 'Karten daraus erzeugen' },
          { id: 'k3', art: 'notiz', x: 700, y: 70, w: 190, h: 110, farbe: '#ffa344',
            text: 'Prüfung in fünf Tagen' },
          { id: 'v1', art: 'verbindung', von: 'k1', nach: 'k2', farbe: '#9b9a97' },
          { id: 'v2', art: 'verbindung', von: 'k2', nach: 'k3', farbe: '#9b9a97' },
          { id: 'e1', art: 'ellipse', x: 330, y: 30, w: 120, h: 90, farbe: '#9a6dd7' },
          { id: 's1', art: 'stift', farbe: '#ff7369',
            pts: [[120, 250], [160, 300], [210, 260], [260, 320], [310, 270]] },
          { id: 't1', art: 'text', x: 640, y: 330, farbe: '#e255a1', text: 'Skizze vom Montag' }
        ]
      });
      App.oeffne(seite.id);
      await new Promise(r => setTimeout(r, 900));
    }
  },

  whiteboards: {
    titel: 'Whiteboards als eigener Bereich im Workspace',
    bauen: async () => {
      const w = window as any;
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      document.getElementById('rg-einladung')?.remove();
      const machen = (name: string, farbe: string, versatz: number): void => {
        const seite = Store.addPage(null, { text: name, icon: '🖍' });
        Store.addBlock(seite.id, 'whiteboard', {
          text: name,
          shapes: [
            { id: 'a' + versatz, art: 'notiz', x: 40 + versatz, y: 40, w: 160, h: 100, farbe, text: name },
            { id: 'b' + versatz, art: 'rechteck', x: 250, y: 120 + versatz, w: 180, h: 110, farbe },
            { id: 'c' + versatz, art: 'stift', farbe,
              pts: [[60, 220], [110, 260], [170, 210], [230, 280]] },
            { id: 'd' + versatz, art: 'verbindung', von: 'a' + versatz, nach: 'b' + versatz, farbe }
          ]
        });
      };
      machen('Projektskizze', '#529cca', 0);
      machen('Schaltplan Übung 3', '#4dab9a', 30);
      machen('Lernplan Sommer', '#ffa344', 60);
      w.Produktwelten.whiteboards();
      await new Promise(r => setTimeout(r, 1100));
    }
  },

  dokument: {
    titel: 'Der PDF-Arbeitsplatz: Miniaturen, Dokument, Inspector',
    bauen: async () => {
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      document.getElementById('rg-einladung')?.remove();

      /* Eine „gescannte" Seite selbst zeichnen — der Arbeitsplatz braucht
         echte Bilder, und ein PDF einzulesen wäre für ein Bildschirmfoto
         der falsche Aufwand. */
      const blattBild = async (nr: number): Promise<Blob> => {
        const c = document.createElement('canvas');
        c.width = 595; c.height = 842;
        const g = c.getContext('2d');
        if (!g) throw new Error('Kein Zeichenkontext');
        g.fillStyle = '#fdfdfb'; g.fillRect(0, 0, c.width, c.height);
        g.fillStyle = '#1c1c1c';
        g.font = '600 30px system-ui, sans-serif';
        g.fillText('Grundlagen der Elektrotechnik', 56, 96);
        g.font = '17px system-ui, sans-serif';
        g.fillText('Kapitel ' + nr, 56, 132);
        g.fillStyle = '#4a4a48';
        g.font = '15px system-ui, sans-serif';
        const zeilen = [
          'Der elektrische Widerstand eines Leiters hängt von seinem',
          'Werkstoff, seiner Länge und seinem Querschnitt ab. Für einen',
          'homogenen Leiter gilt R = ρ · l / A.',
          '',
          'Das ohmsche Gesetz verknüpft Spannung, Stromstärke und',
          'Widerstand: U = R · I. Aus ihm folgt unmittelbar die',
          'Leistungsformel P = U · I und daraus P = R · I².',
          '',
          'In einer Reihenschaltung addieren sich die Widerstände,',
          'in einer Parallelschaltung die Leitwerte.'
        ];
        zeilen.forEach((z, i) => g.fillText(z, 56, 186 + i * 27));
        g.strokeStyle = '#d7d7d3';
        g.strokeRect(56, 500, 483, 220);
        g.fillStyle = '#9b9a97';
        g.font = '13px system-ui, sans-serif';
        g.fillText('Abb. ' + nr + ' · Reihen- und Parallelschaltung', 56, 748);
        return await new Promise<Blob>(fertig =>
          c.toBlob(blob => fertig(blob as Blob), 'image/png'));
      };

      const seite = Store.addPage(null, { text: 'Elektrotechnik – Skript', icon: '📕' });
      for (let nr = 1; nr <= 4; nr++) {
        const block = Store.addBlock(seite.id, 'pdfseite', {
          text: '', suchtext: 'Ohmsches Gesetz Leistung Widerstand',
          nr, vonSeiten: 4, bw: 595, bh: 842, quelleId: 'skript-1'
        });
        const satz = await Dateien.ablegen(
          new File([await blattBild(nr)], 'skript-s' + nr + '.png', { type: 'image/png' }),
          { blockId: block.id, abgeleitet: true });
        Store.updateBlock(block.id, { bildDateiId: satz.id });
      }
      Store.updateBlock(seite.id, { dokumentModus: true });
      await Store.flush();
      App.oeffne(seite.id);
      await new Promise(r => setTimeout(r, 1400));
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
  /* Nachschlagen mit Nachsehen. `noUncheckedIndexedAccess` besteht darauf,
     und es hat recht: `node bilder.mts handi` schrieb bisher „cannot read
     property breite of undefined" — ein Satz über die Innerei statt über den
     Tippfehler. Jetzt steht da, was falsch ist und was es gäbe. */
  const ansicht = ANSICHTEN[name];
  if (!ansicht) {
    console.error(`Unbekannte Ansicht: ${name} — es gibt ${Object.keys(ANSICHTEN).join(', ')}`);
    process.exitCode = 1;
    continue;
  }

  for (const g of geraete) {
    const geraet = GERAETE[g];
    if (!geraet) {
      console.error(`Unbekanntes Gerät: ${g} — es gibt ${Object.keys(GERAETE).join(', ')}`);
      process.exitCode = 1;
      continue;
    }

    for (const thema of themen) {
      /* Das Telefon nur einmal — zwei Themen mal vier Geräte wären zwölf
         Bilder, und niemand sieht sich zwölf Bilder an. */
      if (g !== 'rechner' && thema === 'light') continue;

      const seite = await browser.newPage({
        viewport: { width: geraet.breite, height: geraet.hoehe },
        deviceScaleFactor: 2
      });
      await seite.goto(`http://localhost:${PORT}/index.html`);
      await seite.waitForFunction(
        () => typeof App !== 'undefined' && typeof Store !== 'undefined' &&
              (document.getElementById('tree')?.children.length || 0) > 0,
        null, { timeout: 30000 });
      await seite.evaluate((t: string) => document.documentElement.setAttribute('data-theme', t), thema);
      await seite.evaluate(ansicht.bauen);
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
