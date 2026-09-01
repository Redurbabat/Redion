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
/* Der Port lässt sich überschreiben. Grund: ein voller Prüflauf belegt eine
   ganze Reihe Ports, und wer währenddessen ein Bild machen will, steht sonst
   vor „address already in use" — gemessen am 1. September. */
const PORT = Number(process.env['REDION_BILD_PORT']) || 8891;

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
const ANSICHTEN: Record<string, {
  titel: string;
  bauen: () => void | Promise<void>;
  /* GANZE SEITE STATT AUSSCHNITT. Manche Ansichten sind länger als jeder
     Bildschirm — die Lernzentrale hat unter „Fortschritt" vier Blöcke
     übereinander, und was zählt, steht im dritten. Rollen half nicht: die
     Ansicht zeichnet nach dem Aufbau noch einmal und setzt die Rollhöhe
     zurück, und drei Anläufe mit Rollen bewegten das Bild kein Pixel.
     `fullPage` nimmt einfach alles. */
  ganzeSeite?: boolean;
}> = {

  /* --- Die Schale selbst (E272) ------------------------------------------
     Bis hierher zeigte jede Ansicht einen INHALT und die Schale nur
     nebenbei. Für den Umbau der Schale ist das die falsche Richtung: das
     Menüband ist standardmässig ZUGEKLAPPT, also war auf keinem der 34
     Bilder je ein Bandknopf zu sehen — und dass „Zeitmesser" seit E268
     fehlte, konnte deshalb niemand bemerken (§55.2).

     `bandZu` ist der Merker, den `schale/aufbau/menueband.ts:57` liest;
     `bandZu:welt` gilt ohne offene Seite. Beide auf `false`, damit das
     Band wirklich aufgeht. */

  schaleBand: {
    titel: 'Die Schale — Menüband offen, Reiter Werkzeuge',
    bauen: async () => {
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      Store.setMeta('bandZu', false);
      Store.setMeta('bandZu:welt', false);
      Store.setMeta('bandReiter', 'werkzeuge');

      const s = Store.addPage(null, { text: 'Elektrotechnik — Skript' });
      Store.addBlock(s.id, 'h1', { text: 'Grundlagen' });
      Store.addBlock(s.id, 'text', { text: 'U = R · I, und daraus P = U · I.' });
      App.oeffne(s.id);
      (window as any).Menueband?.zeichne?.();
    }
  },

  schaleMehr: {
    titel: 'Die Schale — die Mehr-Lade des Reiters offen',
    bauen: async () => {
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      Store.setMeta('bandZu', false);
      Store.setMeta('bandZu:welt', false);
      Store.setMeta('bandReiter', 'einfuegen');

      const s = Store.addPage(null, { text: 'Elektrotechnik — Skript' });
      Store.addBlock(s.id, 'text', { text: 'Hier kommt ein Block hin.' });
      App.oeffne(s.id);
      (window as any).Menueband?.zeichne?.();
      /* Zwei Bilder abwarten: der Ueberlauf misst per rAF, und vorher steht
         der Mehr-Knopf noch auf `hidden`. */
      await new Promise(f => requestAnimationFrame(() => requestAnimationFrame(f)));
      await new Promise(f => setTimeout(f, 260));
      document.querySelector<HTMLElement>('.mb-mehr')?.click();
    }
  },

  /* ── Die Kontextkante (E272 Phase F) ─────────────────────────────────────
     Zwei Bilder: die Kante mit geschlossener Lade steht schon in
     `schaleBand`; hier geht es um die LADE. „Seiten" zeigt den echten
     Seitenbaum (hineingeschoben, nicht kopiert), „Fassungen" eine Liste
     aus dem Register. */
  kanteLade: {
    titel: 'Die Kontextkante — Lade „Seiten" offen',
    bauen: async () => {
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      Store.setMeta('bandZu', true);
      Store.setMeta('bandZu:welt', true);
      const s = Store.addPage(null, { text: 'Elektrotechnik — Skript' });
      Store.addBlock(s.id, 'h1', { text: 'Grundlagen' });
      Store.addBlock(s.id, 'text', { text: 'U = R · I, und daraus P = U · I.' });
      Store.addPage(null, { text: 'Formelsammlung' });
      Store.addPage(null, { text: 'Klausurplan' });
      App.oeffne(s.id);
      await new Promise(f => setTimeout(f, 300));
      document.querySelector<HTMLElement>('#kante .k-knopf[data-k="seiten"]')?.click();
      await new Promise(f => setTimeout(f, 200));
    }
  },

  /* ── Die vier Bildschirme, die seit E273 ihren Ort kennen ──────────────── */
  kantePosteingang: {
    titel: 'Posteingang — Kante mit den drei Laden',
    bauen: async () => {
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      Store.setMeta('bandZu', true);
      Store.setMeta('bandZu:welt', true);
      const s = Store.addPage(null, { text: 'Elektrotechnik — Skript' });
      Store.addBlock(s.id, 'text', { text: 'U = R · I.' });
      /* Die Erinnerung DIREKT in den Bestand — `erinnerungSetzen` öffnet
         einen Dialog, und der stünde dann auf dem Bild statt der Lade. */
      Store.setMeta('erinnerungen', [
        { id: 'b1', pageId: s.id, zeit: '2026-09-02T08:00',
          text: 'Zusammenfassung schreiben', erledigt: false },
        { id: 'b2', pageId: s.id, zeit: '2026-09-05T14:30',
          text: 'Aufgabenblatt 3 abgeben', erledigt: false },
        { id: 'b3', pageId: s.id, zeit: '2026-08-28T09:15',
          text: 'Laborbericht gegenlesen', erledigt: true }
      ]);
      Store.setMeta('meldungen', [
        { id: 'm1', text: 'Klausurplan wurde geändert', seite: s.id, gelesen: false },
        { id: 'm2', text: 'Sicherung erfolgreich', gelesen: true }
      ]);
      App.oeffne(s.id);
      (window as any).Ansichten.posteingang();
      await new Promise(f => setTimeout(f, 320));
      document.querySelector<HTMLElement>('#kante .k-knopf[data-k="erinnerungen"]')?.click();
      await new Promise(f => setTimeout(f, 220));
    }
  },

  kanteKalender: {
    titel: 'Termine — Kante mit Tagesplan und Wochenrückblick',
    bauen: async () => {
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      Store.setMeta('bandZu', true);
      Store.setMeta('bandZu:welt', true);
      (window as any).Ansichten.termine();
      await new Promise(f => setTimeout(f, 320));
      document.querySelector<HTMLElement>('#kante .k-knopf[data-k="kommend"]')?.click();
      await new Promise(f => setTimeout(f, 220));
    }
  },

  kanteNotizhefte: {
    titel: 'Notizhefte — Kante, die vorher leer war',
    bauen: async () => {
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      Store.setMeta('bandZu', true);
      Store.setMeta('bandZu:welt', true);
      (window as any).Notebook.oeffnen();
      await new Promise(f => setTimeout(f, 340));
    }
  },

  kiVerlauf: {
    titel: 'KI — der Chatverlauf am Rechner (L93)',
    bauen: async () => {
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      Store.setMeta('bandZu', true);
      Store.setMeta('bandZu:welt', true);
      const heute = new Date();
      const tage = (n: number) => {
        const d = new Date(heute); d.setDate(d.getDate() - n); return d.toISOString();
      };
      Store.setMeta('chats', [
        { id: 'c1', titel: 'Spannungsteiler nachrechnen', wann: tage(0),
          angeheftet: true, verlauf: [] },
        { id: 'c2', titel: 'Kapitel 4 zusammenfassen', wann: tage(0), verlauf: [] },
        { id: 'c3', titel: 'Karteikarten aus dem Skript', wann: tage(1), verlauf: [] },
        { id: 'c4', titel: 'Wie berechne ich den Leiterquerschnitt?', wann: tage(4),
          verlauf: [] },
        { id: 'c5', titel: 'Prüfungsplan für den September', wann: tage(40),
          verlauf: [] }
      ]);
      const s = Store.addPage(null, { text: 'Elektrotechnik — Skript' });
      Store.addBlock(s.id, 'text', { text: 'U = R · I.' });
      App.oeffne(s.id);
      App.kiPanel(true);
      await new Promise(f => setTimeout(f, 320));
      document.getElementById('ai-verlauf')?.click();
      await new Promise(f => setTimeout(f, 240));
    }
  },

  kanteBloecke: {
    titel: 'Die Kontextkante — Lade „Blöcke" offen',
    bauen: async () => {
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      Store.setMeta('bandZu', true);
      Store.setMeta('bandZu:welt', true);
      const s = Store.addPage(null, { text: 'Elektrotechnik — Skript' });
      Store.addBlock(s.id, 'text', { text: 'U = R · I.' });
      App.oeffne(s.id);
      await new Promise(f => setTimeout(f, 300));
      document.querySelector<HTMLElement>('#kante .k-knopf[data-k="bloecke"]')?.click();
      await new Promise(f => setTimeout(f, 200));
    }
  },

  /* ── Die Datei-Fläche (E272 Phase G) ─────────────────────────────────────
     Zwei Bilder, weil zwei ganz verschiedene Dinge darauf zu sehen sind:
     „Informationen" zeigt echte Auskünfte (Sicherungsstand, Ordner, Platz),
     „Neu" den Katalog aus `App.erstellenWege()`. Ein Bild von nur einem
     Fach hätte die halbe Fläche nie gezeigt. */
  backstageInfo: {
    titel: 'Die Datei-Fläche — Informationen',
    bauen: async () => {
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      const s = Store.addPage(null, { text: 'Elektrotechnik — Skript' });
      Store.addBlock(s.id, 'text', { text: 'U = R · I, und daraus P = U · I.' });
      App.oeffne(s.id);
      (window as any).Backstage?.oeffne?.('info');
      /* Der Platz kommt als Versprechen zurück — ohne Warten stünde auf dem
         Bild „wird gemessen …", also genau das, was niemand sehen will. */
      await new Promise(f => setTimeout(f, 320));
    }
  },

  backstageNeu: {
    titel: 'Die Datei-Fläche — Neu',
    bauen: async () => {
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      (window as any).Backstage?.oeffne?.('neu');
      await new Promise(f => setTimeout(f, 120));
    }
  },

  schaleBandStart: {
    titel: 'Die Schale — Menüband offen, Reiter Start',
    bauen: async () => {
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      Store.setMeta('bandZu', false);
      Store.setMeta('bandZu:welt', false);
      Store.setMeta('bandReiter', 'start');

      const s = Store.addPage(null, { text: 'Elektrotechnik — Skript' });
      Store.addBlock(s.id, 'h1', { text: 'Grundlagen' });
      Store.addBlock(s.id, 'text', { text: 'U = R · I, und daraus P = U · I.' });
      App.oeffne(s.id);
      (window as any).Menueband?.zeichne?.();
    }
  },

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

  auffrischen: {
    titel: 'Lernen → „Zuerst auffrischen" (E325)',
    bauen: async () => {
      const w = window as any;
      Store.setMeta('rundgangGesehen', true);
      document.querySelectorAll('.overlay').forEach(o => o.remove());

      /* Drei Fächer, verschieden stark verblasst — genau die Reihenfolge,
         die der Kern rechnen soll. */
      const bau = (fach: string, wieViele: number, tageHer: number, intervall: number) => {
        const seite = Store.addPage(null, { text: fach });
        const zuletzt = new Date(Date.now() - tageHer * 86400000).toISOString();
        for (let i = 0; i < wieViele; i++) {
          const k = Store.addBlock(seite.id, 'flashcard',
            { text: fach + ' Frage ' + (i + 1) + ' :: Antwort' });
          Store.updateBlock(k.id, {
            sr: { ease: 2.5, intervall, wdh: 4, zuletzt, faellig: zuletzt },
            reviewVerlauf: Array.from({ length: 6 }, (_, n) => ({
              at: new Date(Date.now() - (tageHer + 20 - n * 3) * 86400000).toISOString(),
              rating: n % 4 === 0 ? 2 : 3
            }))
          });
        }
      };
      bau('Elektrotechnik', 24, 55, 12);
      bau('Mathematik', 9, 40, 20);
      bau('Deutsch', 14, 6, 30);
      await Store.flush();

      w.Learning.open();
      await new Promise(r => setTimeout(r, 1100));
      const h = [...document.querySelectorAll('.overlay h3')]
        .find(x => /Zuerst auffrischen/.test(x.textContent || ''));
      h?.scrollIntoView({ block: 'start' });
      await new Promise(r => setTimeout(r, 400));
    }
  },

  luecken: {
    titel: 'Wissenslücken mit „erledigt" (E324)',
    bauen: async () => {
      const w = window as any;
      Store.setMeta('rundgangGesehen', true);
      document.querySelectorAll('.overlay').forEach(o => o.remove());
      Store.setMeta('wissen:luecken:erledigt', []);

      /* Ein paar echte Löcher: Geisterverweise und offene Fragen. */
      const s1 = Store.addPage(null, { text: 'Elektrotechnik' });
      Store.addBlock(s1.id, 'text', { text: 'Siehe [[Blindleistung]] und [[Scheinleistung]].' });
      Store.addBlock(s1.id, 'text', { text: 'Warum brummt der Trafo bei Teillast?' });
      const s2 = Store.addPage(null, { text: 'Messtechnik' });
      Store.addBlock(s2.id, 'text', { text: 'Auch [[Blindleistung]] fehlt hier noch.' });
      Store.addBlock(s2.id, 'text', { text: 'Wie genau ist ein Zangenamperemeter wirklich?' });
      Store.addPage(null, { text: 'Loses Blatt ohne Verweise' });
      await Store.flush();

      w.Wissensluecken.zeigen();
      await new Promise(r => setTimeout(r, 700));
    }
  },

  auftraege: {
    titel: 'Was gerade läuft — die Auftragsanzeige (E322)',
    bauen: async () => {
      const w = window as any;
      Store.setMeta('rundgangGesehen', true);
      document.querySelectorAll('.overlay').forEach(o => o.remove());

      /* Drei Aufträge in drei verschiedenen Zuständen — genau die drei
         Fälle, die der Balken auseinanderhalten muss. */
      await w.Auftraege.anlegen('ocr', { seiten: 80 },
        { schritte: 80, text: 'Seite 34 von 80 — „Reihenschaltung"' });
      await w.Auftraege.anlegen('embeddings', { texte: 1200 },
        { schritte: 0, text: 'Gedächtnis wird gebaut' });
      await w.Auftraege.anlegen('sicherung', {},
        { schritte: 4, text: 'Anhänge werden geprüft' });

      /* Zwei davon ein Stück weit vorschieben, damit der Balken etwas zeigt. */
      const alle = await w.Auftraege.alle();
      for (const a of alle) {
        if (a.art === 'ocr') await Store.auftragPut({ ...a, zustand: 'laeuft', schritt: 34 });
        if (a.art === 'embeddings') await Store.auftragPut({ ...a, zustand: 'laeuft', schritt: 7 });
      }

      await w.AuftragsAnzeige.knopfFrisch();
      w.AuftragsAnzeige.oeffnen();
      await new Promise(r => setTimeout(r, 600));
    }
  },

  kikosten: {
    titel: 'Einstellungen → KI: Kosten und Grenzen (E321)',
    bauen: async () => {
      const w = window as any;
      Store.setMeta('rundgangGesehen', true);
      document.querySelectorAll('.overlay').forEach(o => o.remove());

      /* Ein paar echte Buchungen, damit die Summe etwas zu zeigen hat —
         gemischt gezählt und geschätzt, denn genau das soll man sehen. */
      Store.setMeta(w.KiBuch.SCHL_BUCH, []);
      const b1 = w.KiBuch.buchen('gpt-4o-mini', 'openai', 128000, 41000, false);
      w.KiBuch.berichtigen(b1.id, 96400, 30100);
      const b2 = w.KiBuch.buchen('gpt-4o', 'openai', 22000, 8000, false);
      w.KiBuch.berichtigen(b2.id, 19800, 7100);
      w.KiBuch.buchen('llama-3.3-70b-versatile', 'groq', 340000, 90000, false);

      w.Einstellungen.oeffne('ki');
      await new Promise(r => setTimeout(r, 700));
      /* Bis zum neuen Abschnitt scrollen — er steht weit unten. */
      const ziel = [...document.querySelectorAll('.overlay h2')]
        .find(h => /Kosten und Grenzen/.test(h.textContent || ''));
      ziel?.scrollIntoView({ block: 'start' });
      await new Promise(r => setTimeout(r, 400));
    }
  },

  /* E339: der Kompetenzsatz, wenn die Belege aus ZWEI Quellen kommen. Ohne
     Simulation nennt er die Herkunft gar nicht — genau das soll man auch
     sehen können, deshalb baut diese Ansicht beides. */
  belege: {
    titel: 'Woher die Belege für Können kommen (E339)',
    ganzeSeite: true,
    bauen: async () => {
      const w = window as any;
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      const fach = Store.addPage(null, { text: 'Elektrotechnik' });
      const jetzt = Date.now();
      for (const q of ['Ohmsches Gesetz :: U = R · I', 'Leistung :: P = U · I',
                       'Arbeit :: W = P · t']) {
        const k = Store.addBlock(fach.id, 'flashcard',
          { text: q, lernThema: 'Ohmsches Gesetz' });
        const v: any = {};
        for (let j = 0; j < 5; j++)
          v['r' + j] = { at: new Date(jetzt - (j + 1) * 86400000).toISOString(),
                         rating: j === 2 ? 1 : 4 };
        Store.updateBlock(k.id, { reviewVerlauf: v, sr: {
          wdh: 3, intervall: 10,
          zuletzt: new Date(jetzt - 86400000).toISOString(),
          faellig: new Date(jetzt + 5 * 86400000).toISOString() } });
      }
      const konto = w.Konten && w.Konten.aktiv ? w.Konten.aktiv() : null;
      Store.setMeta('lernwelt:' + ((konto && konto.id) || 'lokal') + ':simulationen', [{
        id: 'sim-1', titel: 'Probeklausur', beendet: new Date(jetzt).toISOString(),
        richtig: 8, gesamt: 10, dauerMin: 20,
        themen: [{ thema: 'Ohmsches Gesetz', gesamt: 10, fehler: 2 }]
      }]);
      w.Produktwelten.lernen('lernen');
      await new Promise(r => setTimeout(r, 1100));
      /* DER SATZ STEHT IN DER KLASSISCHEN LERNANSICHT, nicht in der
         Lernzentrale. Drei Anläufe gingen daneben, bevor das gemessen
         statt geraten wurde: die Lernzentrale hat einen eigenen Block
         „Themenfortschritt" (neben „Wochenverlauf"), und der ist NICHT
         der aus `learning.ts`. Der Kopf, den E289 und E339 füllen, kommt
         erst hinter „Klassische Lernansicht". */
      const knopf = [...document.querySelectorAll('button, a')]
        .find(b => /Klassische Lernansicht/.test(b.textContent || '')) as HTMLElement | undefined;
      knopf?.click();
      await new Promise(r => setTimeout(r, 1000));
    }
  },

  zeitplan: {
    titel: 'Der Zeitplan für lange Arbeiten (E342) — Einstellungen → Speicher',
    ganzeSeite: true,
    bauen: async () => {
      const w = window as any;
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      /* Einen Zeitplan setzen, damit auch die Zeile „Eingestellt" im Bild
         steht — ohne sie zeigte das Bild nur den leeren Fall. */
      await w.Auftraege.planSetzen({ vonMinute: 1320, bisMinute: 360, amStrom: true });
      /* `oeffne`, nicht `oeffnen` — nachgesehen, nicht geraten (§E21). */
      w.Einstellungen.oeffne('speicher');
      await new Promise(r => setTimeout(r, 800));
      /* Bis ganz nach unten: die Abteilung steht am Ende der Seite. Der
         Kasten mit dem Rollbalken heisst `#ei`. */
      const kasten = document.getElementById('ei');
      if (kasten) kasten.scrollTop = kasten.scrollHeight;
      await new Promise(r => setTimeout(r, 400));
    }
  },

  auftragsfenster: {
    titel: 'Wartet worauf? Das Auftragsfenster mit dem Grund (E342)',
    bauen: async () => {
      const w = window as any;
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      w.Auftraege.stopp();
      await w.Auftraege.leeren();
      w.Auftraege.anmelden('bild-ocr', async () => true, 'Text aus Seitenbildern');
      w.Auftraege.anmelden('bild-sicher', async () => true, 'Sicherung');
      const d = new Date();
      const jetztMin = d.getHours() * 60 + d.getMinutes();
      await w.Auftraege.anlegen('bild-ocr', { n: 1 },
        { text: 'Skript Elektrotechnik, 84 Seiten',
          schritte: 84,
          bedingung: { vonMinute: (jetztMin + 120) % 1440, bisMinute: (jetztMin + 480) % 1440 } });
      await w.Auftraege.anlegen('bild-sicher', { n: 2 },
        { text: 'Vollständige Sicherung', bedingung: null });
      (document.getElementById('mb-auftraege') as HTMLElement | null)?.click();
      await new Promise(r => setTimeout(r, 600));
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
      /* Bis zum Lernplan-Schalter herunterrollen (E303) — er steht am Fuss
         der Übersicht, und ein Bild vom oberen Drittel zeigt ihn nicht. */
      document.querySelector('.lern-verfahren')
        ?.scrollIntoView({ block: 'center' });
      await new Promise(r => setTimeout(r, 400));
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

  /* --- Der Weg zurück zur Quelle (§44, E155) -----------------------------
     Ein Knopf, der nur unter einer Bedingung erscheint, ist genau die Sorte
     Sache, die man auf keinem Bild sieht, solange man ihn nicht absichtlich
     herstellt. */
  quelle: {
    titel: 'Abgeleitete Objekte finden zurück zu ihrer Quelle',
    bauen: async () => {
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      document.getElementById('rg-einladung')?.remove();

      const skript = Store.addPage(null, { text: 'Elektrotechnik Skript', icon: '📕' });
      const s14 = Store.addBlock(skript.id, 'pdfseite',
        { nr: 14, suchtext: 'Kabelquerschnitt und Spannungsfall' });
      const bespr = Store.addPage(null, { text: 'Bauleitung KW 35', icon: '🎙', besprechung: true });
      const zeile = Store.addBlock(bespr.id, 'text', { text: '01:02 · Verteiler versetzen' });

      const lernen = Store.addPage(null, { text: 'Woher das alles kommt', icon: '🧭' });
      Store.addBlock(lernen.id, 'h2', { text: 'Aus einem Skript' });
      Store.addBlock(lernen.id, 'flashcard', {
        text: 'Welcher Querschnitt bei 25 A? :: 4 mm²',
        sourceRef: { version: 1, kind: 'pdfseite', pageId: skript.id, blockId: s14.id,
          label: 'Elektrotechnik Skript', pageNumber: 14,
          region: { x: .1, y: .2, width: .5, height: .25 }, createdAt: Store.now() } });
      Store.addBlock(lernen.id, 'h2', { text: 'Aus einer Besprechung' });
      Store.addBlock(lernen.id, 'todo', {
        text: 'Verteiler UV3 versetzen',
        sourceRef: { version: 1, kind: 'block', pageId: bespr.id, blockId: zeile.id,
          label: 'Bauleitung KW 35', createdAt: Store.now() } });
      Store.addBlock(lernen.id, 'h2', { text: 'Und ohne Quelle' });
      Store.addBlock(lernen.id, 'text',
        { text: 'Einfach so getippt — hier steht bewusst kein Knopf.' });

      await Store.flush();
      App.oeffne(lernen.id);
      await new Promise(r => setTimeout(r, 900));
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

  noten: {
    titel: 'Die Notenübersicht mit Semester-Wahl und Zielrechner (E241/E242)',
    bauen: async () => {
      const w = window as any;
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      const seite = Store.addPage(null, { text: 'Schule', icon: '🎓' });
      const db = Store.addDatabase(seite.id, 'Noten', {
        title: { name: 'Leistung', type: 'title' },
        d1: { name: 'Datum', type: 'date' },
        f1: { name: 'Fach', type: 'text' },
        p1: { name: 'Punkte', type: 'number' },
        m1: { name: 'Maximum', type: 'number' },
        n1: { name: 'Note', type: 'number' },
        g1: { name: 'Gewichtung', type: 'number' } });
      Store.updateCollection(db.collectionId, { schoolKind: 'grades' });
      const heute = new Date().toISOString().slice(0, 10);
      const alt = new Date(); alt.setMonth(alt.getMonth() - 6);
      const altTag = alt.toISOString().slice(0, 10);
      const rein = (titel: string, fach: string, note: number | null, gewicht: number,
                    wann: string, punkte: number | null = null, max: number | null = null) => {
        const zeile = Store.addRow(db.collectionId, { title: titel });
        Store.setProp(zeile.id, 'f1', fach);
        Store.setProp(zeile.id, 'd1', wann);
        Store.setProp(zeile.id, 'g1', gewicht);
        if (note !== null) Store.setProp(zeile.id, 'n1', note);
        if (punkte !== null) { Store.setProp(zeile.id, 'p1', punkte); Store.setProp(zeile.id, 'm1', max); }
      };
      rein('Ohmsches Gesetz', 'Elektrotechnik', 5.5, 2, heute);
      rein('VDE-Prüfung', 'Elektrotechnik', null, 1, heute, 21, 30);
      rein('Algebra', 'Mathematik', 3.5, 2, heute);
      rein('Geometrie', 'Mathematik', 3.0, 1, heute);
      rein('Aufsatz', 'Deutsch', 5.0, 1, heute);
      rein('Altes Semester', 'Deutsch', 6.0, 1, altTag);
      w.Produktwelten.lernen('noten');
      await new Promise(r => setTimeout(r, 1000));
    }
  },

  stundenplan: {
    titel: 'Der Stundenplan: Woche mit Jetzt-Zeile (E243)',
    bauen: async () => {
      const w = window as any;
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      const seite = Store.addPage(null, { text: 'Ausbildung', icon: '🎓' });
      const db = Store.addDatabase(seite.id, 'Stundenplan', {
        title: { name: 'Lektion', type: 'title' },
        day: { name: 'Tag', type: 'select', options: [
          { name: 'Montag', color: 'blue' }, { name: 'Dienstag', color: 'green' },
          { name: 'Mittwoch', color: 'orange' }, { name: 'Donnerstag', color: 'purple' },
          { name: 'Freitag', color: 'red' }] },
        from: { name: 'Von', type: 'text' },
        to: { name: 'Bis', type: 'text' },
        room: { name: 'Raum', type: 'text' } });
      Store.updateCollection(db.collectionId, { schoolKind: 'timetable' });
      const rein = (titel: string, tag: string, von: string, bis: string, raum: string) => {
        const zeile = Store.addRow(db.collectionId, { title: titel });
        Store.setProp(zeile.id, 'day', tag);
        Store.setProp(zeile.id, 'from', von);
        Store.setProp(zeile.id, 'to', bis);
        Store.setProp(zeile.id, 'room', raum);
      };
      rein('Mathematik', 'Montag', '07:45', '09:15', 'A101');
      rein('Elektrotechnik', 'Montag', '09:35', '11:05', 'B204');
      rein('Fachzeichnen', 'Dienstag', '07:45', '09:15', 'C12');
      rein('Berufskunde', 'Dienstag', '09:35', '11:05', 'B204');
      rein('Allgemeinbildung', 'Donnerstag', '13:15', '14:45', 'A210');
      rein('Sport', 'Freitag', '10:00', '11:30', 'Halle');
      /* Eine Lektion, die JETZT läuft — damit das Bild die Jetzt-Zeile
         zeigt. Am Sonntag gibt es keine; das Bild zeigt dann die Woche. */
      const heute = new Date().getDay();
      if (heute >= 1 && heute <= 5) {
        const TAGE = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'];
        rein('Laborpraktikum', TAGE[heute - 1]!, '00:00', '23:59', 'Labor 2');
      }
      w.Produktwelten.lernen('stundenplan');
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
      /* `projekt: true` UND NICHT NUR EIN NAME. Die erste Fassung legte
         „Umbau Halle 3" und „Wartungsplan 2026" an und erwartete sie unter
         „Projekte" — `projekte()` sucht aber nach dem Merkmal `projekt`
         oder nach dem WORT „Projekt" im Titel. Beides fehlte, und das Bild
         zeigte monatelang „Noch kein laufendes Projekt zugeordnet" neben
         einer vollen Aufgabenliste. Ein Bild von einer halb leeren App
         zeigt nichts — genau davor warnt der Kopf dieser Datei. */
      ['Umbau Halle 3', 'Wartungsplan 2026'].forEach(name => {
        const s = Store.addPage(null, { text: name, icon: '💼' });
        Store.updateBlock(s.id, { projekt: true, status: 'Laufendes Projekt' });
        Store.addBlock(s.id, 'todo', { text: 'Material bestellen für ' + name });
      });
      const bespr = Store.addPage(null, { text: 'Baustellenbesprechung KW 34', icon: '🎙' });
      Store.updateBlock(bespr.id, { besprechung: true });
      Store.addBlock(bespr.id, 'text', { text: 'Termin für die Abnahme steht.' });
      const wissen = Store.addPage(null, { text: 'Entscheidung: Kabeltyp NYM', icon: '💡' });
      Store.addBlock(wissen.id, 'text', { text: 'NYM-J 5×2,5 für alle Zuleitungen.' });
      /* Und ein PDF, damit „Dokumente & PDFs" nicht leer bleibt. */
      const plan = Store.addPage(null, { text: 'Schaltplan Halle 3', icon: '📕' });
      Store.addBlock(plan.id, 'pdfseite', { nr: 1, suchtext: 'Verteiler UV3' });
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
      /* `checked`, NICHT `erledigt`. Redion hält den Haken eines Todo-Blocks
         in `checked` (Editor, Markdown-Ausgang, Arbeitswelt lesen alle das).
         Mit `erledigt` entstand ein Block mit einer Eigenschaft, die niemand
         liest — und das Bild zeigte die Aufgabe als OFFEN, obwohl das
         Beispiel sie als erledigt meinte. Ein Bild, das etwas anderes zeigt
         als gemeint, ist schlimmer als kein Bild (§52.8: nachsehen, nicht
         raten). */
      Store.addBlock(notiz.id, 'todo', { text: 'Ollama installieren', checked: true });
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

  /* --- Der Lernplan-Schalter (E303) ----------------------------------------
     Er steht am Fuss der LERNZENTRALE — das ist die Überlagerung aus
     `learning.ts`, nicht die Lernwelt-Seite. Zwei verschiedene Bildschirme,
     und der Unterschied ist beim ersten Bildversuch aufgefallen: gerollt
     wurde in der falschen Ansicht. */

  /* --- Der Zeitbudget-Planer (E308, Redurs Punkt 7) -----------------------
     Vorher rechnete der Tagesplan `Anzahl × 30 Minuten`. Das Bild muss
     zeigen: eine Zeitangabe oben, je Zeile eine ECHTE Dauer, und den einen
     Satz, der nur dann dasteht, wenn eine Frist wirklich reisst. */

  tagesplan: {
    titel: 'Zeitbudget-Planer — was in 90 Minuten passt (E308)',
    bauen: async () => {
      const w = window as any;
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      document.getElementById('rg-einladung')?.remove();
      Store.setMeta('zeitbudget', 90);

      const tag = (n: number): string => {
        const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + n);
        return d.toISOString().slice(0, 10);
      };
      const { collectionId } = Store.addDatabase(null, 'Schulaufgaben', {
        titel:  { name: 'Aufgabe', type: 'title' },
        wann:   { name: 'Fällig',  type: 'date' },
        dauer:  { name: 'Dauer (Min.)', type: 'number' },
        fertig: { name: 'Erledigt', type: 'checkbox' }
      });
      const zeilen: [string, number, number][] = [
        ['Referat Energieverteilung vorbereiten', 1, 240],
        ['Matheblatt Seite 34',                   1, 25],
        ['Vokabeln Französisch',                  2, 15],
        ['Elektro-Protokoll abgeben',             4, 90],
        ['Lektüre Kapitel 7',                     6, 45]
      ];
      for (const [t, wann, dauer] of zeilen) {
        const r = Store.addRow(collectionId, { title: t });
        Store.setProp(r.id, 'wann', tag(wann));
        Store.setProp(r.id, 'dauer', dauer);
      }
      await Store.flush();
      w.Plan.tagesplan();
      await new Promise(r => setTimeout(r, 700));
    }
  },

  /* --- Die Kontextkante der Datenbank (L95, E312) -------------------------
     Sie war der einzige Schauplatz ohne eigene Kante: eine Datenbankseite
     zeigte die Griffe des Editors. Das Bild muss zeigen, dass rechts jetzt
     Ansicht, Filter, Sortieren, Gruppieren und Spalten stehen. */

  datenbankkante: {
    titel: 'Kontextkante der Datenbank (E312, L95)',
    bauen: async () => {
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      document.getElementById('rg-einladung')?.remove();
      const seite = Store.addPage(null, { text: 'Projekte', icon: '📋' });
      const { collectionId } = Store.addDatabase(seite.id, 'Projekte', {
        titel:  { name: 'Projekt', type: 'title' },
        status: { name: 'Status', type: 'status',
                  options: [{ name: 'Offen' }, { name: 'Läuft' }, { name: 'Fertig' }] },
        wann:   { name: 'Frist', type: 'date' }
      });
      for (const [t, st] of [['Schaltplan zeichnen', 'Läuft'],
                             ['Messprotokoll', 'Offen'],
                             ['Abgabe vorbereiten', 'Offen'],
                             ['Bericht Kapitel 1', 'Fertig']]) {
        const r = Store.addRow(collectionId, { title: String(t) });
        Store.setProp(r.id, 'status', st);
      }
      await Store.flush();
      App.oeffne(seite.id);
      await new Promise(r => setTimeout(r, 900));
    }
  },

  /* --- Vorschaubild auf dem Deckel (L61, E313) ----------------------------
     Vorher stand auf dem Deckel eines eingelesenen PDF ein weisses Blatt
     mit dem Wort „PDF". Das Bild muss zeigen, dass dort jetzt die erste
     Seite steht — und dass die Marke daneben trotzdem lesbar bleibt. */

  deckelbild: {
    titel: 'Der Deckel zeigt die Seite (E313, L61)',
    bauen: async () => {
      const w = window as any;
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      document.getElementById('rg-einladung')?.remove();

      /* Ein gezeichnetes Blatt als „eingelesene Seite" — echte Bytes, kein
         Platzhalter: nur so zeigt das Bild wirklich den Weg durch die
         Dateiablage. */
      const male = (text: string, farbe: string): Promise<Blob> => {
        const c = document.createElement('canvas');
        c.width = 595; c.height = 842;
        const g = c.getContext('2d')!;
        g.fillStyle = '#fff'; g.fillRect(0, 0, 595, 842);
        g.fillStyle = farbe; g.fillRect(0, 0, 595, 96);
        g.fillStyle = '#fff'; g.font = 'bold 34px sans-serif';
        g.fillText(text, 34, 62);
        g.fillStyle = '#333'; g.font = '19px sans-serif';
        for (let i = 0; i < 14; i++)
          g.fillText('Zeile ' + (i + 1) + ' des Skripts \u2014 Elektrotechnik', 34, 150 + i * 32);
        return new Promise(r => c.toBlob(b => r(b!), 'image/png'));
      };

      for (const [titel, farbe] of [['Grundlagen Elektrotechnik', '#2563eb'],
                                    ['Messtechnik', '#059669'],
                                    ['Installationsnormen', '#b45309']]) {
        const seite = Store.addPage(null, { text: String(titel), icon: '\u{1F4D5}' });
        const blob = await male(String(titel), String(farbe));
        const datei = await w.Dateien.ablegen(blob, { name: titel + '.png', blockId: seite.id });
        Store.addBlock(seite.id, 'pdfseite', { nr: 1, bildDateiId: datei.id });
      }
      await Store.flush();
      w.Bibliothek.oeffne();
      await new Promise(r => setTimeout(r, 1400));
    }
  },

  lernplan: {
    titel: 'SM-2 oder FSRS — der Lernplan-Schalter (E303)',
    bauen: async () => {
      const w = window as any;
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      document.getElementById('rg-einladung')?.remove();
      Store.setMeta('lernVerfahren', 'sm2');
      const seite = Store.addPage(null, { text: 'Elektrotechnik – Karten', icon: '🃏' });
      for (const [v, r] of [['Ohmsches Gesetz', 'U = R · I'],
                            ['Leistung', 'P = U · I'],
                            ['Reihenschaltung', 'R = R₁ + R₂ + R₃']])
        Store.addBlock(seite.id, 'flashcard', { text: v, rueck: r });
      await Store.flush();
      w.Learning.open();
      await new Promise(r => setTimeout(r, 1000));
      document.querySelector('.lern-verfahren')?.scrollIntoView({ block: 'center' });
      await new Promise(r => setTimeout(r, 400));
    }
  },

  /* --- Der Randstreifen neben der Seite (E301, L107) -----------------------
     Redur: „ich sollte so neben das pdf direk zeichnen können wie one note."
     Das Bild muss zeigen, dass die Seite links steht, der Rand rechts, und
     ein Strich über die Kante durchläuft. */

  randstreifen: {
    titel: 'Neben der Seite schreiben — der Randstreifen (E301)',
    bauen: async () => {
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      document.getElementById('rg-einladung')?.remove();

      const blattBild = async (nr: number): Promise<Blob> => {
        const c = document.createElement('canvas');
        c.width = 595; c.height = 842;
        const g = c.getContext('2d');
        if (!g) throw new Error('Kein Zeichenkontext');
        g.fillStyle = '#fdfdfb'; g.fillRect(0, 0, c.width, c.height);
        g.fillStyle = '#1c1c1c'; g.font = '600 26px system-ui, sans-serif';
        g.fillText('Reihen- und Parallelschaltung', 52, 88);
        g.fillStyle = '#4a4a48'; g.font = '15px system-ui, sans-serif';
        ['In einer Reihenschaltung addieren sich die Widerstände:',
         'R = R₁ + R₂ + R₃.',
         '',
         'In einer Parallelschaltung addieren sich die Leitwerte:',
         '1/R = 1/R₁ + 1/R₂ + 1/R₃.',
         '',
         'Die Spannung teilt sich in der Reihenschaltung im',
         'Verhältnis der Widerstände auf.'
        ].forEach((z, i) => g.fillText(z, 52, 150 + i * 26));
        g.strokeStyle = '#c8c8c4'; g.strokeRect(52, 400, 490, 200);
        g.fillStyle = '#9b9a97'; g.font = '13px system-ui, sans-serif';
        g.fillText('Abb. ' + nr, 52, 625);
        return await new Promise<Blob>(f => c.toBlob(b => f(b as Blob), 'image/png'));
      };

      const seite = Store.addPage(null, { text: 'Elektrotechnik – Skript', icon: '📕' });
      const ids: string[] = [];
      for (let nr = 1; nr <= 2; nr++) {
        const block = Store.addBlock(seite.id, 'pdfseite', {
          text: '', suchtext: 'Reihenschaltung', nr, vonSeiten: 2,
          bw: 595, bh: 842, quelleId: 'skript-rand'
        });
        ids.push(block.id);
        const satz = await Dateien.ablegen(
          new File([await blattBild(nr)], 'rand-s' + nr + '.png', { type: 'image/png' }),
          { blockId: block.id, abgeleitet: true });
        Store.updateBlock(block.id, { bildDateiId: satz.id });
      }
      /* Ein Strich, der auf der Seite anfängt und im Rand weitergeht — genau
         das, was ohne Rand gar nicht ginge. */
      Store.updateBlock(ids[0]!, { marken: [
        { id: 'e301a', art: 'stroke', farbe: '#2f6fd0', breite: 3,
          pts: [[430, 470], [520, 470], [640, 430], [790, 430]] },
        { id: 'e301b', art: 'stroke', farbe: '#2f6fd0', breite: 3,
          pts: [[640, 470], [830, 470]] },
        { id: 'e301c', art: 'stroke', farbe: '#2f6fd0', breite: 3,
          pts: [[640, 510], [760, 510]] }
      ]});
      Store.updateBlock(seite.id, { dokumentModus: true, randBreite: 0.45 });
      await Store.flush();
      App.oeffne(seite.id);
      await new Promise(r => setTimeout(r, 1800));
    }
  },

  /* --- Die Reiterzeile über den Dokumenten (E300) --------------------------
     Redurs Bild aus GoodNotes zeigte oben eine Zeile mit den offenen
     Dokumenten. Damit hier etwas zu sehen ist, müssen ZWEI offen sein — bei
     einem einzelnen bleibt die Zeile absichtlich verborgen. */

  dokumentreiter: {
    titel: 'Zwischen zwei PDFs wechseln — die Reiterzeile (E300)',
    bauen: async () => {
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      document.getElementById('rg-einladung')?.remove();

      const blattBild = async (titel: string, nr: number): Promise<Blob> => {
        const c = document.createElement('canvas');
        c.width = 595; c.height = 842;
        const g = c.getContext('2d');
        if (!g) throw new Error('Kein Zeichenkontext');
        g.fillStyle = '#fdfdfb'; g.fillRect(0, 0, c.width, c.height);
        g.fillStyle = '#1c1c1c';
        g.font = '600 28px system-ui, sans-serif';
        g.fillText(titel, 56, 96);
        g.font = '17px system-ui, sans-serif';
        g.fillStyle = '#4a4a48';
        g.fillText('Seite ' + nr, 56, 132);
        g.font = '15px system-ui, sans-serif';
        ['Der elektrische Widerstand eines Leiters hängt von seinem',
         'Werkstoff, seiner Länge und seinem Querschnitt ab:',
         'R = ρ · l / A.',
         '',
         'Aus dem ohmschen Gesetz U = R · I folgt die Leistung',
         'P = U · I und daraus P = R · I².'
        ].forEach((z, i) => g.fillText(z, 56, 190 + i * 27));
        g.strokeStyle = '#d7d7d3';
        g.strokeRect(56, 420, 483, 200);
        return await new Promise<Blob>(fertig =>
          c.toBlob(blob => fertig(blob as Blob), 'image/png'));
      };

      const mach = async (titel: string, symbol: string): Promise<string> => {
        const seite = Store.addPage(null, { text: titel, icon: symbol });
        for (let nr = 1; nr <= 2; nr++) {
          const block = Store.addBlock(seite.id, 'pdfseite', {
            text: '', suchtext: 'Ohmsches Gesetz', nr, vonSeiten: 2,
            bw: 595, bh: 842, quelleId: 'q-' + seite.id
          });
          const satz = await Dateien.ablegen(
            new File([await blattBild(titel, nr)], 'blatt.png', { type: 'image/png' }),
            { blockId: block.id, abgeleitet: true });
          Store.updateBlock(block.id, { bildDateiId: satz.id });
        }
        Store.updateBlock(seite.id, { dokumentModus: true });
        return seite.id;
      };

      const eins = await mach('Kapitel 8 – Schaltungen', '📕');
      const zwei = await mach('Formelsammlung', '📗');
      await Store.flush();
      App.oeffne(eins);
      await new Promise(r => setTimeout(r, 900));
      App.oeffne(zwei);
      await new Promise(r => setTimeout(r, 1500));
    }
  },

  /* --- Die Notizhefte (E264) ----------------------------------------------
     Das Regal und ein offenes Heft. Die Daten sind bewusst drei Hefte mit
     DREI verschiedenen Papieren — die Deckel-Muster im Regal unterscheiden
     sich sonst nicht, und genau dieses Unterscheiden ist der Sinn der
     Miniaturen. */

  notizhefte: {
    titel: 'Die Notizhefte — das Regal mit Fächern, Stern und Farbe (E265)',
    bauen: async () => {
      const w = window as any;
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      const mach = (eltern: string | null, name: string, papier: string,
                    zeilen: string[]) => {
        const p = Store.addPage(eltern, { text: name, icon: '📓' });
        const blatt = Store.addBlock(p.id, 'blatt', { text: '', papier });
        for (const z of zeilen) Store.addBlock(blatt.id, 'text', { text: z });
        Store.updateBlock(p.id, { dokumentModus: true });
        return p;
      };
      /* Ein Fach mit zwei Heften, zwei lose Hefte — eines gesternt, eines
         mit Deckelfarbe: so zeigt EIN Bild alles Neue von E265. */
      const fach = Store.addPage(null, { text: 'Elektrotechnik', icon: '🗂' });
      mach(fach.id, 'Mitschrift', 'kariert', ['Reihenschaltung: R = R1 + R2']);
      mach(fach.id, 'Fachzeichnen', 'mm', ['Massstab 1:50 üben']);
      const gesternt = mach(null, 'Prüfungsstoff', 'punkte', ['Formeln wiederholen']);
      Store.updateBlock(gesternt.id, { favorite: true });
      const letztes = mach(null, 'Ohmsches Gesetz', 'liniert', ['U = R · I', 'P = U · I']);
      Store.updateBlock(letztes.id, { color: 'blue' });
      Store.setMeta('heft:zuletzt', letztes.id);
      w.Notebook.oeffnen();
      await new Promise(r => setTimeout(r, 700));
    }
  },

  abdeckband: {
    titel: 'Das Abdeckband — zugedeckt lernen, antippen, wissen (E266)',
    bauen: async () => {
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      const s = Store.addPage(null, { text: 'Formeln abfragen', icon: '📓' });
      const blatt = Store.addBlock(s.id, 'blatt', { text: '', papier: 'liniert' });
      for (const z of ['Leistung:  P = U · I', '',
                       'Reihenschaltung:  R = R1 + R2', '',
                       'Ohmsches Gesetz:  U = R · I'])
        Store.addBlock(blatt.id, 'text', { text: z });
      /* Zwei Bänder über den rechten Formelhälften — das obere bleibt zu,
         das untere wird im Bild aufgedeckt gezeigt. */
      Store.updateBlock(blatt.id, { marken: [
        { id: 'b1', art: 'abdeck', farbe: '#e0a419', pts: [[150, 60], [330, 88]] },
        { id: 'b2', art: 'abdeck', farbe: '#2f7ed8', pts: [[170, 148], [360, 176]] }
      ] });
      App.oeffne(s.id);
      await new Promise(r => setTimeout(r, 900));
      const unten = [...document.querySelectorAll('[data-ink-art="abdeck"]')]
        .find(k => k.getAttribute('data-sid') === 'b2');
      unten?.setAttribute('data-auf', '1');
      await new Promise(r => setTimeout(r, 200));
    }
  },

  ordnersicherung: {
    titel: 'Sicherung in einen Ordner — Redurs iCloud-Weg (E270)',
    bauen: async () => {
      const w = window as any;
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      /* Ein gewählter Ordner, damit der eingeschaltete Zustand zu sehen
         ist — die Attrappe reicht, gezeichnet wird aus Name und Zeit. */
      Store.cache.meta['sicherungOrdner'] = { kind: 'directory', name: 'iCloudRedion' };
      Store.setMeta('sicherungOrdnerName', 'iCloudRedion');
      Store.setMeta('sicherungOrdnerZuletzt', new Date().toISOString());
      Store.setMeta('sicherungErinnern', true);
      w.Einstellungen.oeffne('daten');
      await new Promise(r => setTimeout(r, 700));
      const blatt = document.querySelector('.overlay');
      const zeile = [...(blatt?.querySelectorAll('*') || [])]
        .find(e => (e.textContent || '').startsWith('Sicherung in einen Ordner'));
      zeile?.scrollIntoView({ block: 'center' });
      await new Promise(r => setTimeout(r, 300));
    }
  },

  meinkonto: {
    titel: 'Mein Konto — jetzt ehrlich, mit Weg zur Wolke (E270)',
    bauen: async () => {
      const w = window as any;
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      w.Einstellungen.oeffne('konto');
      await new Promise(r => setTimeout(r, 700));
    }
  },

  serverpruefen: {
    titel: 'Wolke → Server prüfen: was fehlt, in Worten (E270)',
    bauen: async () => {
      const w = window as any;
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      w.WolkeFenster.dialog();
      await new Promise(r => setTimeout(r, 700));
      /* Der Ausgang „Datenbank fehlt" — der, den Redur als Erstes sieht,
         solange der Server nicht scharfgeschaltet ist. */
      const ziel = document.querySelector('#wo-pruef');
      if (ziel) {
        const alt = w.Wolke.ruf;
        w.Wolke.ruf = async () => ({ ablage: 'keine', dateien: 'keine' });
        Store.setMeta('wolkeAdresse', 'https://redion.beispiel.workers.dev');
        await w.WolkeFenster.serverPruefen(ziel);
        w.Wolke.ruf = alt;
        ziel.scrollIntoView({ block: 'end' });
      }
      await new Promise(r => setTimeout(r, 800));
    }
  },

  zeitmesser: {
    titel: 'Der Zeitmesser — Lernzeit messen statt schätzen (E268)',
    bauen: async () => {
      const w = window as any;
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      const s = Store.addPage(null, { text: 'Ohmsches Gesetz üben', icon: '📓' });
      Store.addBlock(s.id, 'text', { text: 'U = R · I — Aufgaben 1 bis 12' });
      App.oeffne(s.id);
      await new Promise(r => setTimeout(r, 700));
      /* Ein paar Sitzungen im Verlauf, damit „Zuletzt" etwas zeigt. */
      Store.setMeta('zeit:sitzungen', [
        { art: 'timer', beginn: 1, dauerSek: 1500, sollSek: 1500,
          seiteId: '', seitenName: 'Ohmsches Gesetz üben' },
        { art: 'stoppuhr', beginn: 1, dauerSek: 738, sollSek: 0,
          seiteId: '', seitenName: 'Fachzeichnen' },
        { art: 'timer', beginn: 1, dauerSek: 300, sollSek: 300,
          seiteId: '', seitenName: 'Prüfungsstoff' }
      ]);
      w.Zeitmesser.start('timer', 25 * 60);
      w.Zeitmesser.panel();
      await new Promise(r => setTimeout(r, 700));
    }
  },

  haftnotiz: {
    titel: 'Haftnotiz und Lineal auf dem Blatt (E267)',
    bauen: async () => {
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      const s = Store.addPage(null, { text: 'Skizze mit Zetteln', icon: '📓' });
      const blatt = Store.addBlock(s.id, 'blatt', { text: '', papier: 'kariert' });
      Store.addBlock(blatt.id, 'text', { text: 'Schaltung der Werkstatt — Fragen an den Meister' });
      Store.updateBlock(blatt.id, { marken: [
        { id: 'z1', art: 'zettel', farbe: '#e0a419', pts: [[330, 70], [560, 150]],
          text: 'Nachfragen: Warum 1,5 mm² statt 2,5 mm²?\nLeitungslänge prüfen!' },
        { id: 'z2', art: 'zettel', farbe: '#2f7ed8', pts: [[60, 300], [230, 360]],
          text: 'FI 30 mA — Pflicht im Bad' },
        /* Zwei Linien, wie sie das Lineal rastet: exakt 45° und waagrecht. */
        { id: 'l1', art: 'line', farbe: '#111111', breite: 2.4, pts: [[80, 120], [230, 270]] },
        { id: 'l2', art: 'line', farbe: '#d64545', breite: 2.4, pts: [[80, 120], [300, 120]] }
      ] });
      App.oeffne(s.id);
      await new Promise(r => setTimeout(r, 900));
    }
  },

  notizhefteFach: {
    titel: 'Ein offenes Fach in der Listenform (E265)',
    bauen: async () => {
      const w = window as any;
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      const mach = (eltern: string | null, name: string, papier: string) => {
        const p = Store.addPage(eltern, { text: name, icon: '📓' });
        const blatt = Store.addBlock(p.id, 'blatt', { text: '', papier });
        Store.addBlock(blatt.id, 'text', { text: '' });
        Store.updateBlock(p.id, { dokumentModus: true });
        return p;
      };
      const fach = Store.addPage(null, { text: 'Elektrotechnik', icon: '🗂' });
      mach(fach.id, 'Mitschrift', 'kariert');
      const bunt = mach(fach.id, 'Fachzeichnen', 'mm');
      Store.updateBlock(bunt.id, { color: 'green' });
      const stern = mach(fach.id, 'Prüfungsstoff', 'liniert');
      Store.updateBlock(stern.id, { favorite: true });
      Store.setMeta('heft:form', 'liste');
      w.Notebook.oeffnen();
      await new Promise(r => setTimeout(r, 500));
      document.querySelector<HTMLElement>(
        `.bib-deckel[data-fach="${fach.id}"], .nh-zeile-auf[data-fach="${fach.id}"]`)?.click();
      await new Promise(r => setTimeout(r, 600));
    }
  },

  notizheft: {
    titel: 'Ein offenes Heft — weiterschreiben ohne Umweg',
    bauen: async () => {
      const w = window as any;
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      const p = Store.addPage(null, { text: 'Ohmsches Gesetz', icon: '📓' });
      const blatt = Store.addBlock(p.id, 'blatt', { text: '', papier: 'liniert' });
      for (const z of ['U = R · I', 'P = U · I  →  P = R · I²',
                       'Reihenschaltung: R = R1 + R2'])
        Store.addBlock(blatt.id, 'text', { text: z });
      Store.updateBlock(p.id, { dokumentModus: true });
      Store.setMeta('heft:zuletzt', p.id);
      w.Notebook.resume();
      await new Promise(r => setTimeout(r, 900));
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

      /* DAS TELEFON IST EIN TASTGERÄT (E300). Hier stand nur die Bildgrösse.
         Damit galt in jedem Telefonbild `hover:hover` — und alles, was erst
         beim Überfahren erscheint, war darauf zu sehen, obwohl es auf einem
         echten Telefon niemand zu sehen bekommt.

         Aufgefallen an der Reiterzeile: das Schliesskreuz des nicht aktiven
         Reiters fehlte im Bild, während `getComputedStyle` im Prüflauf
         `opacity: 1` meldete. Beide hatten recht — sie sahen zwei
         verschiedene Geräte an. */
      const seite = await browser.newPage({
        viewport: { width: geraet.breite, height: geraet.hoehe },
        deviceScaleFactor: 2,
        ...(g === 'rechner' ? {} : { isMobile: true, hasTouch: true })
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
      await seite.screenshot({ path: datei, fullPage: !!ansicht.ganzeSeite });
      await seite.close();
      gemacht.push(datei);
      console.log('  ✓ ' + datei.replace(WURZEL + '/', ''));
    }
  }
}

await browser.close();
server.close();
console.log('\n  ' + gemacht.length + ' Bilder in bilder/');
