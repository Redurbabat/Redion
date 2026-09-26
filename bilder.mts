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
  /* DER BREITE BILDSCHIRM (E617). Er fehlte, und das ist mehr als eine
     Lücke im Werkzeug: die Werkzeugleiste hat drei Schwellen, bei denen
     Woerter aufgehen — 820, 1150 und 1300 px LEISTENBREITE. Bei 1280 px
     Fenster ist die Leiste 860 px breit; die obere Schwelle war damit auf
     KEINEM Bild dieses Verzeichnisses je zu sehen. Ein Zustand, den kein
     Bild erreicht, wird auch nicht angesehen (§55).
     1920 x 1080 ist der haeufigste Rechnerbildschirm; die Leiste ist dort
     1407 px breit und damit ueber allen drei Schwellen. */
  breit:     { breite: 1920, hoehe: 1080 },
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
/* --- Die Wahl Einzelseite / Fortlaufend (E398, Audit F03 Rest) -----------
   Zwei Dinge müssen auf dem Bild stehen: der SCHALTER im Inspector (dass es
   ihn gibt und dass er sagt, was er tut) und das ERGEBNIS (dass wirklich nur
   noch eine Seite dasteht statt vier untereinander).

   Der Eintrag steht UNTER dem Katalog und nicht darin, weil er den Aufbau
   der Ansicht `dokument` weiterverwendet — im Literal selbst wäre
   `ANSICHTEN` noch nicht fertig. */
const ANSICHTEN: Record<string, {
  titel: string;
  bauen: () => void | Promise<void>;
  /* BAUEN, DANN BEDIENEN (E398). `bauen` wird in die Seite hineingereicht
     und dort ausgewertet — eine Node-Konstante ist darin nicht erreichbar,
     also kann eine Ansicht das `bauen` einer anderen nicht aufrufen.
     Wer denselben Aufbau, aber einen anderen ZUSTAND fotografieren will,
     nimmt `bauen` der ersten und legt die Klicks in `dann`. */
  dann?: () => void | Promise<void>;
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

  /* DIE BEGRÜSSUNGSFLÄCHE HATTE NIE EIN BILDZIEL (E418) — im Gegenteil:
     jedes andere Ziel wirft sie mit `.produkt-onboarding-lage?.remove()`
     hinaus, damit sie nicht im Weg steht. 126 Zeilen Stil, die nie jemand
     angesehen hat. Beim Verschieben nach `produktwelten.css` war das die
     eigentliche Frage — nicht „stimmen die gerechneten Werte", sondern
     „sieht es aus wie vorher". */
  /* DER KALENDER ALS ORT (E430). Vorher öffnete der Eintrag „Kalender" den
     Verbindungsdialog; ein Bildziel dafür gab es nie, weil es nichts zu
     sehen gab ausser einer Überlagerung. */
  /* Der Umschalter (E439) — drei Zustaende nebeneinander, damit man die
     Markierung wirklich vergleichen kann statt sie zu behaupten. */
  segment: {
    titel: 'Der Umschalter (E439)',
    bauen: async () => {
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      const platz = document.createElement('div');
      platz.style.cssText = 'position:fixed;left:50%;top:120px;transform:translateX(-50%);'
        + 'z-index:9000;display:grid;gap:22px;justify-items:start';
      const S = (window as any).Segment;
      for (const [titel, wahlen, gewaehlt] of [
        ['Ansicht', [{ id: 'liste', name: 'Liste' }, { id: 'raster', name: 'Raster' },
                     { id: 'karten', name: 'Karten' }], 'liste'],
        ['Elektro', [{ id: 'bau', name: 'Aufbauen' }, { id: 'sim', name: 'Simulieren' },
                     { id: 'mess', name: 'Messen' }], 'sim'],
        ['Zwei', [{ id: 'a', name: 'Offen' }, { id: 'b', name: 'Erledigt' }], 'b']
      ] as Array<[string, any[], string]>) {
        const zeile = document.createElement('div');
        const kopf = document.createElement('p');
        kopf.textContent = titel;
        kopf.style.cssText = 'margin:0 0 6px;font-size:12px;opacity:.6';
        zeile.append(kopf);
        zeile.append(S.bauen({ name: titel, wahlen, gewaehlt }).element);
        platz.append(zeile);
      }
      document.body.append(platz);
      await new Promise(f => setTimeout(f, 400));
    }
  },

  kalender2: {
    titel: 'Der Kalender als eigener Ort (E430, E431)',
    bauen: async () => {
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      const seite = Store.addPage(null, { text: 'Termine' });
      const { collectionId } = Store.addDatabase(seite.id, 'Termine', {
        titel: { name: 'Sache', type: 'title' },
        wann:  { name: 'Wann',  type: 'date' }
      }, 'table');
      const heute = new Date();
      const tage: Array<[string, number]> = [
        ['Zahnarzt', 2], ['Abgabe Bericht', 4], ['Messung Halle 3', 5],
        ['Elternabend', 9], ['Prüfung Elektro', 12]
      ];
      for (const [t, plus] of tage) {
        const d = new Date(heute.getTime() + plus * 86400000);
        const z = Store.addBlock(collectionId, 'page', { text: t, parentTable: 'collection' });
        Store.updateBlock(z.id, { props: { wann: d.toISOString().slice(0, 10) } });
      }
      await Store.flush();
      (window as any).Produktwelten?.kalender?.();
      await new Promise(f => setTimeout(f, 900));
    }
  },

  /* Der Termine-Bildschirm — das ist der Ort, den die untere Leiste am
     Telefon unter „Termine" oeffnet (E430). */
  termine2: {
    titel: 'Termine — mit einem Weg zum Kalender (E430)',
    bauen: async () => {
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      const seite = Store.addPage(null, { text: 'Termine' });
      const { collectionId } = Store.addDatabase(seite.id, 'Termine', {
        titel: { name: 'Sache', type: 'title' },
        wann:  { name: 'Wann',  type: 'date' }
      }, 'table');
      const heute = new Date();
      for (const [t, plus] of [['Zahnarzt', 2], ['Abgabe Bericht', 4],
                               ['Elternabend', 9]] as Array<[string, number]>) {
        const d = new Date(heute.getTime() + plus * 86400000);
        const z = Store.addBlock(collectionId, 'page', { text: t, parentTable: 'collection' });
        Store.updateBlock(z.id, { props: { wann: d.toISOString().slice(0, 10) } });
      }
      await Store.flush();
      (window as any).Ansichten?.termine?.();
      await new Promise(f => setTimeout(f, 800));
    }
  },

  /* Die Absage des Nur-Quellen-Modus neben einer gewöhnlichen Antwort —
     nur nebeneinander ist „sieht anders aus" überhaupt zu sehen. */
  kiAbsage: {
    titel: 'Die KI sagt ab, statt zu raten (E305, E418)',
    bauen: async () => {
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      const s = Store.addPage(null, { text: 'KI-Probe' });
      App.oeffne(s.id);
      await new Promise(f => setTimeout(f, 400));
      /* Das Panel wird über die Klasse `open` an `#ai` aufgeklappt —
         `kiPanel()` liegt in `schale.ts` und ist von aussen nicht zu rufen. */
      document.getElementById('ai')?.classList.add('open');
      await new Promise(f => setTimeout(f, 400));
      const chat = document.getElementById('chat');
      if (!chat) return;
      chat.innerHTML =
        '<div class="msg u">Was steht in meinen Unterlagen über Kirchhoff?</div>' +
        '<div class="msg a">Die Knotenregel sagt: was in einen Knoten ' +
        'hineinfliesst, fliesst auch wieder heraus.</div>' +
        '<div class="msg u">Und über Maxwell?</div>' +
        '<div class="msg a msg-ohne-quelle">Dazu finde ich nichts in deinen ' +
        'Unterlagen. Der Nur-Quellen-Modus ist an — Redion fragt das Modell ' +
        'dann gar nicht erst, statt eine Antwort zu bekommen, die nirgends ' +
        'nachzulesen ist. Schalte ihn in den KI-Einstellungen aus, wenn du ' +
        'trotzdem fragen willst.</div>';
    }
  },

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

  /* ── EIN KATALOG STATT DREI (E694, L218) ──────────────────────────────
     Zwei Bilder für einen Umzug, der NICHTS aussehen soll: der Reiter
     „Zeichnen" holt Name und Zeichen jetzt aus `Register.werkzeuge` bzw.
     `Marken.FORMEN`, die Studioleiste aus demselben Katalog. Ein Umzug, der
     das Aussehen ändert, ist kein Umzug (§55.3: man sieht es, also gibt es
     ein Bild). */
  bandZeichnen: {
    titel: 'Menüband — Reiter „Zeichnen" über einem Blatt (E694)',
    bauen: async () => {
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      Store.setMeta('bandZu', false);
      Store.setMeta('bandZu:welt', false);
      Store.setMeta('bandReiter', 'zeichnen');

      const s = Store.addPage(null, { text: 'Blatt zum Zeichnen' });
      Store.addBlock(s.id, 'blatt', { text: '', blattBreite: 595.28,
                                      blattHoehe: 841.89, raumVersion: 1, marken: [] });
      App.oeffne(s.id);
      await new Promise(f => setTimeout(f, 900));
      (window as any).Menueband?.zeichne?.();
      await new Promise(f => setTimeout(f, 300));
    }
  },

  studioLeiste: {
    titel: 'Die Studioleiste — vierzehn Werkzeuge aus dem Katalog (E694)',
    bauen: async () => {
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      Store.setMeta('bandZu', true);

      const s = Store.addPage(null, { text: 'Blatt mit Werkzeugen' });
      Store.addBlock(s.id, 'blatt', { text: '', blattBreite: 595.28,
                                      blattHoehe: 841.89, raumVersion: 1, marken: [] });
      App.oeffne(s.id);
      await new Promise(f => setTimeout(f, 1100));
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

  /* --- Das KI-Blatt am Telefon (E653) -------------------------------------
     Zu sehen ist genau das, was gefehlt hat: das Kreuz rechts im Kopf, und
     darüber der Strich, der jetzt hält, was er zeigt. Am Rechner wäre das
     Bild sinnlos — dort klappt `#btn-ai` in der Kopfleiste auf und zu.
       node bilder.mts kiBlatt handy */
  /* --- Die Tabellenwerkzeuge am Telefon (E660) ----------------------------
     Zu sehen ist der Unterschied, den keine Zahl allein zeigt: sieben Knöpfe,
     die ein Daumen trifft, unter einer Tabelle auf 390 px.
       node bilder.mts tabelleDaumen handy */
  tabelleDaumen: {
    titel: 'Tabellenwerkzeuge am Telefon — 44 px (E660)',
    bauen: async () => {
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      const s = Store.addPage(null, { text: 'Kabelquerschnitte', icon: '⚡' });
      Store.addBlock(s.id, 'table', { rows: [
        ['Querschnitt', 'Strom', 'Absicherung'],
        ['1,5 mm²', '16 A', 'B16'],
        ['2,5 mm²', '20 A', 'B20'],
        ['4 mm²', '25 A', 'B25']], kopfZeile: true });
      App.oeffne(s.id);
      await new Promise(f => setTimeout(f, 450));
      /* Am Rechner hält `@media(hover:none)` die Leiste blass; für das Bild
         wird sie eingeblendet, damit zu sehen ist, was ein Telefon zeigt. */
      const l = document.querySelector('#page .stab-tools') as HTMLElement | null;
      if (l) { l.style.opacity = '1'; l.style.gap = '8px';
               l.querySelectorAll('button').forEach(b => {
                 (b as HTMLElement).style.minHeight = '44px';
                 (b as HTMLElement).style.padding = '0 14px';
                 (b as HTMLElement).style.fontSize = '13.5px'; }); }
      await new Promise(f => setTimeout(f, 200));
    }
  },

  /* --- Das Tor vor einer Textänderung (E656) ------------------------------
     Was Redur sieht, bevor ein Satz umgeschrieben wird: die Stelle vorher
     und nachher, im Klartext. „Höchstens ein gespeichertes Objekt" stand da
     früher — richtig, und ohne jeden Nutzen für die Entscheidung.
       node bilder.mts kiTextTor rechner */
  kiTextTor: {
    titel: 'Die KI möchte einen Satz ändern (E656)',
    bauen: async () => {
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      Store.setMeta('agent:fragen', 'immer');
      const s = Store.addPage(null, { text: 'Installationshinweise', icon: '🔌' });
      Store.addBlock(s.id, 'text',
        { text: 'Der Leiter wird an die Klemme gefuehrt und dort gesichert.' });
      Store.addBlock(s.id, 'text', { text: 'Danach wird gemessen.' });
      App.oeffne(s.id);
      await new Promise(f => setTimeout(f, 250));
      (KI as any).frageKurz = () => Promise.resolve(JSON.stringify({
        gedanke: 'Der Fachbegriff heisst Reihenklemme',
        werkzeug: 'textBearbeiten',
        argument: { titel: 'Installationshinweise',
                    alt: 'an die Klemme gefuehrt',
                    neu: 'auf die Reihenklemme aufgelegt' } }));
      Store.setMeta('agent:eigene', [{ id: 'bild-text', name: 'Redakteur', guthaben: 3,
        werkzeuge: ['textBearbeiten', 'fertig'], anweisung: '', wissen: [], ausloeser: {} }]);
      void Agent.laufen('bild-text', 'Bring die Fachbegriffe in Ordnung');
      await new Promise(f => setTimeout(f, 700));
    }
  },

  /* --- Was die KI jetzt bauen kann (E655) ---------------------------------
     Die Tabelle ist das Sichtbare der drei: Lernkarten prüft man an
     `Learning.cards()`, PDF-Text an seinem Wortlaut — eine Tabelle sieht man
     oder man sieht sie nicht (§55.3).
       node bilder.mts kiTabelle rechner */
  kiTabelle: {
    titel: 'Die KI hat eine Tabelle gebaut (E655)',
    bauen: async () => {
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      const s = Store.addPage(null, { text: 'Kabelquerschnitte', icon: '⚡' });
      Store.addBlock(s.id, 'text',
        { text: 'Aus dem Skript, Kapitel 7 — von der KI zusammengestellt.' });
      App.oeffne(s.id);
      await new Promise(f => setTimeout(f, 250));
      await Agent.WERKZEUGE['tabelleAnlegen'].lauf({
        kopfzeile: ['Querschnitt', 'Belastbarkeit', 'Absicherung', 'Typische Verwendung'],
        zeilen: [
          ['1,5 mm²', '16 A', 'B16', 'Licht, Steckdosen'],
          ['2,5 mm²', '20 A', 'B20', 'Steckdosenkreise'],
          ['4 mm²', '25 A', 'B25', 'Herd, Durchlauferhitzer'],
          ['6 mm²', '32 A', 'B32', 'Zuleitungen, Unterverteilung']]
      }, { ids: [] });
      App.zeichneSeite();
      await new Promise(f => setTimeout(f, 400));
    }
  },

  /* --- Das Tor vor dem Löschen (E654) -------------------------------------
     Zu sehen ist, was Redur sieht, bevor irgendetwas verschwindet: die Seite
     beim Namen, wie viele Blöcke daran hängen, und ZWEI Knöpfe — kein
     „für diesen Lauf erlauben".
       node bilder.mts kiLoeschTor rechner */
  kiLoeschTor: {
    titel: 'Die KI möchte löschen — und fragt (E654)',
    bauen: async () => {
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      const alt2 = Store.addPage(null, { text: 'Notizen von der Messe 2024', icon: '📦' });
      Store.addBlock(alt2.id, 'text', { text: 'Stand B14, Ansprechpartner …' });
      Store.addBlock(alt2.id, 'bullet', { text: 'Preisliste nachfragen' });
      Store.addBlock(alt2.id, 'bullet', { text: 'Kabeltrommel 3×2,5 mm²' });
      App.oeffne(alt2.id);
      /* Ein ECHTER Agentenlauf, kein nachgebauter Dialog: nur das Modell ist
         abgehängt, damit das Bild nicht von einem Ollama abhängt. */
      /* `KI` ist eine Konstante im Skript-Bereich, KEIN Feld an `window` —
         `window.KI` ist undefined, und der erste Anlauf ist genau daran
         gescheitert. Der Name selbst ist hier erreichbar. */
      (KI as any).frageKurz = () => Promise.resolve(JSON.stringify({
        gedanke: 'Die alte Messeseite wird nicht mehr gebraucht',
        werkzeug: 'seiteLoeschen',
        argument: { titel: 'Notizen von der Messe 2024' } }));
      Store.setMeta('agent:eigene', [{ id: 'bild-loesch', name: 'Persönlicher Assistent',
        guthaben: 3, werkzeuge: ['seiteLoeschen', 'fertig'], anweisung: '',
        wissen: [], ausloeser: {} }]);
      /* NICHT abwarten — der Dialog steht, bis jemand drückt. Genau das
         soll auf dem Bild sein. */
      void Agent.laufen('bild-loesch', 'Räum die alten Messenotizen weg');
      await new Promise(f => setTimeout(f, 700));
    }
  },

  kiBlatt: {
    titel: 'KI am Telefon — der Weg zurück (E653)',
    bauen: async () => {
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      const s = Store.addPage(null, { text: 'Elektrotechnik — Skript', icon: '⚡' });
      Store.addBlock(s.id, 'text', { text: 'U = R · I.' });
      App.oeffne(s.id);
      App.kiPanel(true);
      await new Promise(f => setTimeout(f, 520));
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

  werkzeugtafel: {
    titel: 'Die Werkzeugleiste: Wort unter dem Zeichen (W2+W3)',
    bauen: async () => {
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      document.querySelectorAll('.overlay').forEach(o => o.remove());
      const s = Store.addPage(null, { text: 'Werkzeugleiste', icon: '🧰' });
      /* BREIT. Die Wörter hängen an der Breite der LEISTE, nicht des
         Fensters (E359, Behälterabfrage) — eine schmale Seite zeigte hier
         gar keine. */
      Store.updateBlock(s.id, { wide: true });
      const b = Store.addBlock(s.id, 'blatt', { text: '', papier: 'kariert' });
      Store.addBlock(b.id, 'text', { text: 'Ohmsches Gesetz: U = R · I' });
      await Store.flush();
      App.oeffne(s.id);
      await new Promise(r => setTimeout(r, 1100));
      document.querySelector<HTMLElement>('.blatt-werk [data-wz="stift"]')?.click();
      await new Promise(r => setTimeout(r, 400));
      /* DIE KLAPPE MIT DEM REGLER AUFMACHEN (E616). Sie geht auf, wenn man
         die schon gewählte Stufe ein zweites Mal antippt (E465) — und erst
         dann steht die Zahl mit ihrer Einheit im Bild. */
      await new Promise(r => setTimeout(r, 200));
    }
  },

  /* --- Suchen auf der Seite (E667) ---------------------------------------
     Die Leiste hatte Feld, Zahl und Kreuz — und keinen Weg zur zweiten
     Fundstelle. Auf dem Bild ist zu sehen, was der Zähler jetzt sagt
     („2 von 4") und dass die aktive Stelle einen Rahmen trägt, nicht nur
     eine andere Farbe (§38). */
  suchen: {
    titel: 'Suchen auf der Seite — zweite von vier Stellen',
    bauen: async () => {
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      const seite = Store.addPage(null, { text: 'Kabelkunde' });
      for (let i = 1; i <= 4; i++) {
        Store.addBlock(seite.id, 'text',
          { text: 'Stelle ' + i + ': der Schutzleiter ist grün-gelb und wird zuerst angeklemmt.' });
        Store.addBlock(seite.id, 'text', { text: 'Fuelltext '.repeat(14) });
      }
      App.oeffne(seite.id);
      await new Promise(r => setTimeout(r, 500));
    },
    dann: async () => {
      document.dispatchEvent(new KeyboardEvent('keydown',
        { key: 'f', ctrlKey: true, bubbles: true, cancelable: true }));
      await new Promise(r => setTimeout(r, 250));
      const feld = document.querySelector('#findbar input') as HTMLInputElement | null;
      if (!feld) return;
      feld.value = 'Schutzleiter';
      feld.dispatchEvent(new Event('input', { bubbles: true }));
      await new Promise(r => setTimeout(r, 350));
      (document.querySelector('#findbar [data-a="vor"]') as HTMLElement | null)?.click();
      await new Promise(r => setTimeout(r, 500));
    }
  },


  /* --- Die angemeldeten Geräte (E669) -------------------------------------
     Die Einstellungen versprachen „Die Liste … steht im Wolke-Fenster";
     dort stand eine einzige Zeile mit DIESEM Gerät. Der Server wird hier
     durch einen Stellvertreter ersetzt — zu sehen ist das Fenster. */
  geraete: {
    titel: 'Angemeldete Geräte im Wolke-Fenster',
    bauen: async () => {
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      (Wolke as any).geraeteListe = async () => ({ geraete: [
        { kennung: 'aaaabbbbccccdddd', geraet: 'Arbeitsrechner · Firefox',
          angelegt: '2026-09-01T10:00:00.000Z', bis: '2026-10-01T10:00:00.000Z', aktuell: true },
        { kennung: '1111222233334444', geraet: 'iPhone · Safari',
          angelegt: '2026-08-20T08:30:00.000Z', bis: '2026-09-19T08:30:00.000Z', aktuell: false },
        { kennung: '5555666677778888', geraet: 'Altes Notebook',
          angelegt: '2026-06-02T19:05:00.000Z', bis: '2026-07-02T19:05:00.000Z', aktuell: false }
      ] });
      await WolkeFenster.geraeteFenster();
      await new Promise(r => setTimeout(r, 450));
    }
  },


  /* --- Text der PDF ändern (E670) ------------------------------------------
     Auf dem Bild steht dieselbe Seite zweimal nicht: links, was die PDF
     sagt, gibt es nicht als zweites Bild. Zu sehen ist die GEÄNDERTE Seite
     — „B16" ist „C16", „1,5 mm2" ist „2,5 mm2", und der Prüfer heisst
     anders. Was zählt: es sieht nicht nach Korrektur aus, sondern nach
     Dokument. Genau das ist der Anspruch. */
  pdftext: {
    titel: 'Text einer PDF ändern — die Seite danach',
    bauen: async () => {
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      const roh = atob('JVBERi0xLjQKMSAwIG9iago8PCAvVHlwZSAvUGFnZXMgL0NvdW50IDEgL0tpZHMgWzQgMCBSXSA+PgplbmRvYmoKMiAwIG9iago8PCAvVHlwZSAvRm9udCAvU3VidHlwZSAvVHlwZTEgL0Jhc2VGb250IC9IZWx2ZXRpY2EgPj4KZW5kb2JqCjMgMCBvYmoKPDwgL0xlbmd0aCAyNTggPj4Kc3RyZWFtCkJUIC9GMSAyMiBUZiA2MCA3NTAgVGQgKFBydWVmcHJvdG9rb2xsIFdlcmtzdGF0dCkgVGogRVQKQlQgL0YxIDE2IFRmIDYwIDY5MCBUZCAoU2ljaGVydW5nOiBCMTYpIFRqIEVUCkJUIC9GMSAxNiBUZiA2MCA2NjAgVGQgKExlaXRlcnF1ZXJzY2huaXR0OiAxLDUgbW0yKSBUaiBFVApCVCAvRjEgMTYgVGYgNjAgNjMwIFRkIChQcnVlZmVyOiBNLiBNdXN0ZXIpIFRqIEVUCkJUIC9GMSAxNiBUZiA2MCA2MDAgVGQgKERhdHVtOiAxMi4wMy4yMDI2KSBUaiBFVAplbmRzdHJlYW0KZW5kb2JqCjQgMCBvYmoKPDwgL1R5cGUgL1BhZ2UgL1BhcmVudCAxIDAgUiAvTWVkaWFCb3ggWzAgMCA1OTUgODQyXSAvUmVzb3VyY2VzIDw8IC9Gb250IDw8IC9GMSAyIDAgUiA+PiA+PiAvQ29udGVudHMgMyAwIFIgPj4KZW5kb2JqCjUgMCBvYmoKPDwgL1R5cGUgL0NhdGFsb2cgL1BhZ2VzIDEgMCBSID4+CmVuZG9iagp4cmVmCjAgNgowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMDkgMDAwMDAgbiAKMDAwMDAwMDA2NiAwMDAwMCBuIAowMDAwMDAwMTM2IDAwMDAwIG4gCjAwMDAwMDA0NDUgMDAwMDAgbiAKMDAwMDAwMDU3MSAwMDAwMCBuIAp0cmFpbGVyCjw8IC9TaXplIDYgL1Jvb3QgNSAwIFIgPj4Kc3RhcnR4cmVmCjYyMAolJUVPRgo=');
      const bytes = new Uint8Array(roh.length);
      for (let i = 0; i < roh.length; i++) bytes[i] = roh.charCodeAt(i);
      const seite = Store.addPage(null, { text: 'Prüfprotokoll' });
      await PdfEinlesen.alsSeiten(
        new File([bytes], 'pruefprotokoll.pdf', { type: 'application/pdf' }),
        seite.id, { anordnung: 'untereinander', ueberGrenze: 'alle' });
      await new Promise(r => setTimeout(r, 900));
      const blatt = Store.childrenOf(seite.id).find((b: any) => b && b.type === 'pdfseite');
      if (blatt) {
        const stuecke = await PdfLeser.lageVonBlock(Store.getBlock(blatt.id));
        const setze = (suche: string, neuerText: string) => {
          const st = stuecke.find((x: any) => String(x.s || '').includes(suche));
          if (!st) return null;
          return { id: 'fix-' + suche.replace(/\W/g, ''), art: 'textfix',
                   kasten: { x: st.x, y: st.y, w: st.w, h: st.h },
                   alt: st.s, text: neuerText, farbe: '#000000', grund: '#ffffff' };
        };
        const marken = [
          setze('B16', 'Sicherung: C16'),
          setze('1,5 mm', 'Leiterquerschnitt: 2,5 mm2'),
          setze('M. Muster', 'Prüfer: R. Babat')
        ].filter(Boolean);
        Store.updateBlock(blatt.id, { marken });
      }
      App.oeffne(seite.id);
      await new Promise(r => setTimeout(r, 1200));
    }
  },


  /* --- Ordnerfarben (E672) ---------------------------------------------------
     Vier Ordner, vier Farben, einer ohne — nebeneinander im Regal. Was das
     Bild zeigen soll: die Farbe sitzt auf Körper UND Reiter des gezeichneten
     Ordners, nicht an einem Rücken; und der farblose behält die Akzentfarbe. */
  ordnerfarbe: {
    titel: 'Ordner mit Farben in der Bibliothek',
    bauen: async () => {
      Store.setMeta('rundgangGesehen', true);
      Store.setMeta('bibForm', 'deckel');
      Store.setMeta('bibOrdner', '');
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      const ordner: Array<[string, string]> = [
        ['Elektrotechnik', 'blue'], ['Arbeitssicherheit', 'red'],
        ['Werkstatt', 'orange'], ['Prüfungen', 'green'], ['Sonstiges', '']];
      for (const [name, farbe] of ordner) {
        const o = Store.addPage(null, { text: name, icon: '\u{1F4C1}' });
        Store.addPage(o.id, { text: 'Kapitel 1' });
        Store.addPage(o.id, { text: 'Kapitel 2' });
        if (farbe) Store.updateBlock(o.id, { color: farbe });
      }
      await Store.flush();
      Bibliothek.oeffne();
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

  /* DER KOPF DES REGALS (E516, L139). Genau die Stelle, an der Redur
     „oben eine neue PDF einfügen" wollte: die Karte „Weiterarbeiten" und
     der Importknopf nebeneinander. Sie hiessen beide „PDF öffnen" und
     machten das Gegenteil voneinander — hier sieht man, ob das eine Wort
     jetzt nur noch einmal dasteht. */
  regalkopf: {
    titel: 'Der Kopf des Regals: Weiterlesen und PDF öffnen',
    bauen: async () => {
      const w = window as any;
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      document.getElementById('rg-einladung')?.remove();
      const akte = Store.addPage(null, { text: 'Elektrotechnik Skript', icon: '📕' });
      Store.addBlock(akte.id, 'pdfseite', { text: '', nr: 1, bw: 595, bh: 842, herkunft: 'quelle' });
      Store.updateBlock(akte.id, { zuletztGeoeffnet: new Date().toISOString() });
      [['Wochenplan KW 35', '📅'], ['Prüfungsvorbereitung', '📝'],
       ['Baustelle Halle 3', '💼']].forEach(([name, icon]) => {
        const s = Store.addPage(null, { text: String(name), icon: String(icon) });
        Store.addBlock(s.id, 'text', { text: 'Ein Satz auf ' + name + '.' });
      });
      await Store.flush();
      w.Produktwelten.bibliothek();
      await new Promise(r => setTimeout(r, 1200));
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

  /* Die neue Leiste in ihren Zuständen (E689, W6). Zwei Ziele mehr, weil ein
     Untermenü nur auf einem Bild zu sehen ist, auf dem es offen ist (§55.3).
     Sie bauen ihre Fläche selbst: `bauen` läuft im Browser und kennt
     `ANSICHTEN` nicht — daran ist der erste Anlauf gescheitert. */
  whiteboardFarben: {
    titel: 'Die Werkzeugleiste mit offenem Farbmenue (E689)',
    bauen: async () => {
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      document.getElementById('rg-einladung')?.remove();
      const seite = Store.addPage(null, { text: 'Projektskizze', icon: '🖍' });
      Store.addBlock(seite.id, 'whiteboard', {
        text: 'Whiteboard', hoehe: 460,
        shapes: [
          { id: 'k1', art: 'notiz', x: 70, y: 60, w: 190, h: 110, farbe: '#529cca', text: 'Aufnahme im Unterricht' },
          { id: 'k2', art: 'notiz', x: 380, y: 200, w: 190, h: 110, farbe: '#4dab9a', text: 'Karten daraus erzeugen' },
          { id: 'v1', art: 'verbindung', von: 'k1', nach: 'k2', farbe: '#9b9a97' },
          { id: 's1', art: 'stift', farbe: '#ff7369', pts: [[120, 250], [160, 300], [210, 260], [260, 320], [310, 270]] }
        ]
      });
      App.oeffne(seite.id);
      await new Promise(r => setTimeout(r, 900));
    },
    dann: async () => {
      document.querySelector<HTMLElement>('.wb-tools [data-menue="farbe"]')?.click();
      await new Promise(r => setTimeout(r, 280));
    }
  },
  whiteboardMehr: {
    titel: 'Die Werkzeugleiste mit offenem Mehr-Menue (E689)',
    bauen: async () => {
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      document.getElementById('rg-einladung')?.remove();
      const seite = Store.addPage(null, { text: 'Projektskizze', icon: '🖍' });
      Store.addBlock(seite.id, 'whiteboard', {
        text: 'Whiteboard', hoehe: 460,
        shapes: [
          { id: 'k1', art: 'notiz', x: 70, y: 60, w: 190, h: 110, farbe: '#529cca', text: 'Aufnahme im Unterricht' },
          { id: 'k2', art: 'notiz', x: 380, y: 200, w: 190, h: 110, farbe: '#4dab9a', text: 'Karten daraus erzeugen' },
          { id: 'v1', art: 'verbindung', von: 'k1', nach: 'k2', farbe: '#9b9a97' },
          { id: 's1', art: 'stift', farbe: '#ff7369', pts: [[120, 250], [160, 300], [210, 260], [260, 320], [310, 270]] }
        ]
      });
      App.oeffne(seite.id);
      await new Promise(r => setTimeout(r, 900));
    },
    dann: async () => {
      document.querySelector<HTMLElement>('.wb-tools [data-menue="mehr"]')?.click();
      await new Promise(r => setTimeout(r, 280));
    }
  },

  /* ------------------------------------------------------------------------
     DIE DREI ANSICHTEN EINER SEITE (E690, 26. September 2026)
     Redur wollte AFFiNEs zwei eins zu eins und dazu unsere eigene. Drei Ziele,
     weil §55.3 ALLE Zustände verlangt und eine Ansicht ohne Bild eine
     Behauptung wäre.

     JEDES BAUT DIESELBE SEITE NEU, und das ist kein Versehen: `bauen` wird in
     die Seite hineingereicht, eine Node-Konstante ist darin nicht erreichbar
     (siehe die Anmerkung am Katalog oben). Ein gemeinsamer Helfer wäre in
     Node erreichbar und im Browser undefiniert — genau der Fehler, der beim
     Whiteboard-Bogen schon einmal passiert ist.
     ----------------------------------------------------------------------*/
  ansichtRedion: {
    titel: 'Ansicht „Redion" — unsere eigene: Cover, Symbol, Titel, Werkzeugzeile',
    bauen: async () => {
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      document.getElementById('rg-einladung')?.remove();
      const seite = Store.addPage(null, { text: 'Wärmepumpe — Notizen', icon: '🔥',
        cover: 'linear-gradient(160deg,#7fd4d0,#e8c9b0)' });
      Store.addBlock(seite.id, 'heading', { text: 'Was zu prüfen ist' });
      Store.addBlock(seite.id, 'text', { text: 'Vorlauftemperatur, Volumenstrom und die Spreizung an beiden Fühlern — dazu die Jahresarbeitszahl aus dem Zählerstand.' });
      Store.addBlock(seite.id, 'todo', { text: 'Fühler am Rücklauf nachziehen' });
      Store.addBlock(seite.id, 'text', { text: 'Der Verdichter läuft laut Protokoll 4,2 Stunden am Tag.' });
      App.oeffne(seite.id);
      await new Promise(r => setTimeout(r, 800));
    }
  },
  ansichtSeite: {
    titel: 'Ansicht „Seite" — AFFiNEs `page`: Symbol und Titel, kein Cover, keine Werkzeugzeile',
    bauen: async () => {
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      document.getElementById('rg-einladung')?.remove();
      const seite = Store.addPage(null, { text: 'Wärmepumpe — Notizen', icon: '🔥',
        cover: 'linear-gradient(160deg,#7fd4d0,#e8c9b0)' });
      Store.addBlock(seite.id, 'heading', { text: 'Was zu prüfen ist' });
      Store.addBlock(seite.id, 'text', { text: 'Vorlauftemperatur, Volumenstrom und die Spreizung an beiden Fühlern — dazu die Jahresarbeitszahl aus dem Zählerstand.' });
      Store.addBlock(seite.id, 'todo', { text: 'Fühler am Rücklauf nachziehen' });
      Store.addBlock(seite.id, 'text', { text: 'Der Verdichter läuft laut Protokoll 4,2 Stunden am Tag.' });
      App.oeffne(seite.id);
      await new Promise(r => setTimeout(r, 800));
    },
    dann: async () => {
      const knopf = document.querySelector<HTMLElement>('.pg-ansichten [data-seg-wahl="seite"]');
      knopf?.click();
      await new Promise(r => setTimeout(r, 700));
    }
  },
  ansichtFlaeche: {
    titel: 'Ansicht „Fläche" — AFFiNEs `edgeless`: Punktraster, der Text als Kasten darauf',
    bauen: async () => {
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      document.getElementById('rg-einladung')?.remove();
      const seite = Store.addPage(null, { text: 'Wärmepumpe — Notizen', icon: '🔥',
        cover: 'linear-gradient(160deg,#7fd4d0,#e8c9b0)' });
      Store.addBlock(seite.id, 'heading', { text: 'Was zu prüfen ist' });
      Store.addBlock(seite.id, 'text', { text: 'Vorlauftemperatur, Volumenstrom und die Spreizung an beiden Fühlern — dazu die Jahresarbeitszahl aus dem Zählerstand.' });
      Store.addBlock(seite.id, 'todo', { text: 'Fühler am Rücklauf nachziehen' });
      Store.addBlock(seite.id, 'text', { text: 'Der Verdichter läuft laut Protokoll 4,2 Stunden am Tag.' });
      App.oeffne(seite.id);
      await new Promise(r => setTimeout(r, 800));
    },
    dann: async () => {
      const knopf = document.querySelector<HTMLElement>('.pg-ansichten [data-seg-wahl="flaeche"]');
      knopf?.click();
      await new Promise(r => setTimeout(r, 700));
    }
  },
  /* ------------------------------------------------------------------------
     DER VOLLAUSBAU DER FLÄCHE (E691, 26. September 2026)
     Redur: „ja mach den vollausbau, jeder block auf die fläche ziehbar."
     Drei Zustände, weil §55.3 ALLE verlangt: Kästen nebeneinander, ein
     ausgeblendeter Block, und der leere Seitenkasten.
     ----------------------------------------------------------------------*/
  flaecheBloecke: {
    titel: 'Vollausbau — zwei Blöcke liegen als eigene Kästen auf der Fläche',
    bauen: async () => {
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      document.getElementById('rg-einladung')?.remove();
      const seite = Store.addPage(null, { text: 'Wärmepumpe — Notizen', icon: '🔥',
        seitenAnsicht: 'flaeche' });
      const b1 = Store.addBlock(seite.id, 'heading', { text: 'Was zu prüfen ist' });
      const b2 = Store.addBlock(seite.id, 'text', { text: 'Vorlauftemperatur, Volumenstrom und die Spreizung an beiden Fühlern.' });
      const b3 = Store.addBlock(seite.id, 'todo', { text: 'Fühler am Rücklauf nachziehen' });
      const b4 = Store.addBlock(seite.id, 'text', { text: 'Verdichter: 4,2 Stunden am Tag laut Protokoll.' });
      void b1; void b2;
      Store.updateBlock(b3.id, { flaecheOrt: { x: 820, y: 40, w: 340, raumVersion: 1 } });
      Store.updateBlock(b4.id, { flaecheOrt: { x: 820, y: 210, w: 340, raumVersion: 1 } });
      App.oeffne(seite.id);
      await new Promise(r => setTimeout(r, 900));
    }
  },
  flaecheVersteckt: {
    titel: 'Vollausbau — ein Kasten steht NUR auf der Fläche („nicht auf der Seite")',
    bauen: async () => {
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      document.getElementById('rg-einladung')?.remove();
      const seite = Store.addPage(null, { text: 'Wärmepumpe — Notizen', icon: '🔥',
        seitenAnsicht: 'flaeche' });
      const b1 = Store.addBlock(seite.id, 'heading', { text: 'Was zu prüfen ist' });
      const b2 = Store.addBlock(seite.id, 'text', { text: 'Vorlauftemperatur, Volumenstrom und die Spreizung an beiden Fühlern.' });
      const b3 = Store.addBlock(seite.id, 'todo', { text: 'Fühler am Rücklauf nachziehen' });
      const b4 = Store.addBlock(seite.id, 'text', { text: 'Verdichter: 4,2 Stunden am Tag laut Protokoll.' });
      void b1; void b2;
      Store.updateBlock(b3.id, { flaecheOrt: { x: 820, y: 60, w: 340, raumVersion: 1 },
                                 sichtbarIn: 'flaeche' });
      void b4;
      App.oeffne(seite.id);
      await new Promise(r => setTimeout(r, 900));
    }
  },
  flaecheLeer: {
    titel: 'Vollausbau — alles liegt draussen, der Seitenkasten sagt, wofür er noch da ist',
    bauen: async () => {
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      document.getElementById('rg-einladung')?.remove();
      const seite = Store.addPage(null, { text: 'Wärmepumpe — Notizen', icon: '🔥',
        seitenAnsicht: 'flaeche' });
      const b1 = Store.addBlock(seite.id, 'heading', { text: 'Was zu prüfen ist' });
      const b2 = Store.addBlock(seite.id, 'text', { text: 'Vorlauftemperatur, Volumenstrom und die Spreizung an beiden Fühlern.' });
      const b3 = Store.addBlock(seite.id, 'todo', { text: 'Fühler am Rücklauf nachziehen' });
      const b4 = Store.addBlock(seite.id, 'text', { text: 'Verdichter: 4,2 Stunden am Tag laut Protokoll.' });
      void b1; void b2;
      [b1, b2, b3, b4].forEach((b, i) => Store.updateBlock(b.id,
        { flaecheOrt: { x: 780 + (i % 2) * 380, y: 40 + Math.floor(i / 2) * 200, w: 340, raumVersion: 1 } }));
      App.oeffne(seite.id);
      await new Promise(r => setTimeout(r, 900));
    }
  },
  /* ------------------------------------------------------------------------
     AUF DER FLAECHE ZEICHNEN (E693, 26. September 2026)
     Redur: „weiter" - und in L219 stand, was der Flaeche fehlte. Zwei Bilder:
     die Formen auf der Leinwand, und die Leiste mit allen acht Werkzeugen.
     ----------------------------------------------------------------------*/
  flaecheTinte: {
    titel: 'Auf der Fläche zeichnen — Stift, Pfeil, Rechteck und Ellipse neben den Kästen',
    bauen: async () => {
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      document.getElementById('rg-einladung')?.remove();
      const seite = Store.addPage(null, { text: 'Wärmepumpe — Notizen', icon: '🔥',
        seitenAnsicht: 'flaeche' });
      Store.addBlock(seite.id, 'heading', { text: 'Was zu prüfen ist' });
      Store.addBlock(seite.id, 'text', { text: 'Vorlauftemperatur, Volumenstrom und die Spreizung an beiden Fühlern.' });
      const b3 = Store.addBlock(seite.id, 'todo', { text: 'Fühler am Rücklauf nachziehen' });
      Store.updateBlock(b3.id, { flaecheOrt: { x: 840, y: 300, w: 320, raumVersion: 1 } });
      /* Formen wie von Hand gezogen - dasselbe Format wie im Whiteboard. */
      Store.updateBlock(seite.id, { raumVersion: 1, shapes: [
        { id: 'f1', art: 'stift', farbe: '#ff7369',
          pts: [[820, 120], [860, 96], [910, 128], [960, 88], [1010, 120]] },
        { id: 'f2', art: 'pfeil', x: 700, y: 210, w: 150, h: 96, farbe: '#529cca' },
        { id: 'f3', art: 'rechteck', x: 820, y: 170, w: 260, h: 96, farbe: '#4dab9a' },
        { id: 'f4', art: 'ellipse', x: 1120, y: 300, w: 170, h: 110, farbe: '#9a6dd7' }
      ] });
      App.oeffne(seite.id);
      await new Promise(r => setTimeout(r, 900));
    }
  },
  flaecheWerkzeuge: {
    titel: 'Die Werkzeugleiste der Fläche — acht Werkzeuge, und jedes tut etwas',
    bauen: async () => {
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      document.getElementById('rg-einladung')?.remove();
      const seite = Store.addPage(null, { text: 'Werkzeuge', icon: '✏️', seitenAnsicht: 'flaeche' });
      Store.addBlock(seite.id, 'text', { text: 'Stift, Linie, Pfeil, Rechteck, Ellipse, Radierer.' });
      App.oeffne(seite.id);
      await new Promise(r => setTimeout(r, 900));
    },
    dann: async () => {
      document.querySelector<HTMLElement>('.pg-flaeche .gfx-tb-sockel [data-wz="stift"]')?.click();
      await new Promise(r => setTimeout(r, 200));
      document.querySelector<HTMLElement>('.pg-flaeche .gfx-tb-sockel [data-menue="farbe"]')?.click();
      await new Promise(r => setTimeout(r, 400));
    }
  },
  schaltplan: {
    /* Der Stromkreis ist der aus test263 (senkrechte Zweige, keine Leitung
       überbrückt einen Anschluss). Das Bild zeigt die Planfläche mit ihrer
       eigenen Werkzeugleiste — das „Vorher" für W6 (25. September 2026). */
    titel: 'Der Schaltplan: Planfläche mit eigener Werkzeugleiste, ein kleiner Stromkreis',
    bauen: async () => {
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      document.getElementById('rg-einladung')?.remove();
      const seite = Store.addPage(null, { text: 'Schaltplan Übung 3', icon: '⚡' });
      const b = Store.addBlock(seite.id, 'schaltplan', { text: 'Schaltplan' });
      const plan: any = Schaltplan.neuerPlan('stromlauf-aufgeloest');
      plan.teile = []; plan.leitungen = []; plan.texte = [];
      const teil = (zeichen: string, bmk: string, x: number, y: number) => {
        const t: any = { id: 't' + plan.teile.length, zeichen, x, y, drehung: 0,
                         gespiegelt: false, bmk, nummern: {}, gruppe: '', ebene: 'plan' };
        plan.teile.push(t); return t;
      };
      const q = teil('wechselspannung', 'G1', 40, 120);
      const s = teil('ch-schema0', 'S1', 240, 20);
      const h = teil('lampe', 'E1', 230, 120);
      const ort = (t: any, nr: string) => {
        const a = Schaltplan.anschluesseVon(t).find((x: any) => x.nr === nr);
        if (!a) throw new Error(`Anschluss ${nr} fehlt an ${t.zeichen}`);
        return { x: a.x, y: a.y };
      };
      const leitung = (punkte: any[], a: any, an: string, b2: any, bn: string) =>
        plan.leitungen.push({ id: 'l' + plan.leitungen.length, ebene: 'plan',
          punkte, vonTeil: a.id, vonNr: an, nachTeil: b2.id, nachNr: bn });
      leitung([ort(q, 'L'), { x: 70, y: 20 }, ort(s, '3')], q, 'L', s, '3');
      leitung([ort(s, '4'), ort(h, 'X1')], s, '4', h, 'X1');
      leitung([ort(h, 'X2'), ort(q, 'N')], h, 'X2', q, 'N');
      Store.updateBlock(b.id, { plan });
      App.oeffne(seite.id);
      await new Promise(r => setTimeout(r, 900));
    }
  },
  gedankenkarte: {
    titel: 'Die Gedankenkarte — zentrales Thema, Äste nach beiden Seiten (E607)',
    bauen: async () => {
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      document.getElementById('rg-einladung')?.remove();
      const seite = Store.addPage(null, { text: 'Prüfungsplan', icon: '🧠' });
      const k = (id: string, text: string, eltern: string | null, rest: object = {}) =>
        ({ id, text, eltern, ...rest });
      Store.addBlock(seite.id, 'mindmap', {
        text: 'Gedankenkarte',
        hoehe: 460,
        karte: {
          aufbau: 'karte',
          knoten: [
            k('w', 'Prüfung Elektrotechnik', null),
            k('a', 'Grundlagen', 'w'),
              k('a1', 'Ohmsches Gesetz', 'a'),
              k('a2', 'Leistung und Arbeit', 'a'),
              k('a3', 'Reihe und Parallel', 'a'),
            k('b', 'Schutzmassnahmen', 'w'),
              k('b1', 'Schutzleiter', 'b'),
              k('b2', 'FI-Schalter', 'b'),
              k('b3', 'Schutzklassen I bis III', 'b'),
            k('c', 'Messen', 'w'),
              k('c1', 'Spannung', 'c'),
              k('c2', 'Strom', 'c'),
              k('c3', 'Isolationswiderstand', 'c'),
            k('d', 'Schaltpläne lesen', 'w'),
              k('d1', 'Stromlaufplan', 'd'),
              k('d2', 'Übersichtsplan', 'd'),
            k('e', 'Termine', 'w'),
              k('e1', 'Probe am 24.', 'e'),
              k('e2', 'Prüfung am 8.', 'e'),
          ]
        }
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

  farbsaetze: {
    titel: 'Farbsätze — die eigenen Farben unter einem Namen (E486)',
    bauen: async () => {
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      /* Drei gesicherte Sätze und vier eigene Tupfer — der Zustand, in dem
         der Dialog etwas zu zeigen hat. */
      Store.setMeta('zeichnen:farben', ['#8e44ad', '#16a085', '#e67e22', '#2c3e50']);
      Store.setMeta('zeichnen:farbsaetze', [
        { name: 'Korrektur', farben: ['#d81b60', '#8e24aa'] },
        { name: 'Mitschrift', farben: ['#1e88e5', '#43a047', '#fb8c00'] },
        { name: 'Zeichnung', farben: ['#455a64'] }
      ]);
      const s = Store.addPage(null, { text: 'Farben sortieren', icon: '🎨' });
      const blatt = Store.addBlock(s.id, 'blatt', { text: '', papier: 'kariert' });
      Store.addBlock(blatt.id, 'text', { text: 'Korrekturfarben getrennt von den Mitschriftfarben' });
      Store.updateBlock(blatt.id, { marken: [
        { id: 'a', art: 'stift', farbe: '#8e44ad', breite: 2.4, pts: [[70, 150], [230, 150]] },
        { id: 'b', art: 'stift', farbe: '#16a085', breite: 2.4, pts: [[70, 185], [300, 185]] },
        { id: 'c', art: 'marker', farbe: '#e67e22', breite: 16, pts: [[70, 230], [340, 230]] }
      ] });
      App.oeffne(s.id);
      await new Promise(r => setTimeout(r, 900));
      /* Erst der Stift — die Farbgruppe steht nur bei einem Werkzeug, das
         färbt (E356). Dann das „+", das seit E486 zu allem führt, was Farbe
         ist: Farbwähler und Farbsätze in einer Wahl. */
      document.querySelector<HTMLElement>('.blatt-werk [data-wz="stift"]')?.click();
      await new Promise(r => setTimeout(r, 250));
      document.querySelector<HTMLElement>('.blatt-werk .blatt-farbe-neu')?.click();
      await new Promise(r => setTimeout(r, 400));
    }
  },

  formelbuch: {
    titel: 'Das Formelbuch als Marke — verschieben, ziehen, drehen (E502)',
    bauen: async () => {
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      /* Eine Seite, die aussieht wie eine Formelbuchseite — gezeichnet,
         damit das Bild ohne fremde Datei auskommt. Der WEG dahin ist im
         Prüflauf (test470 §4): PDF wählen, Seite nennen, gerastert. */
      const mal = (breit: number, hoch: number, tun: (c: CanvasRenderingContext2D) => void) => {
        const l = document.createElement('canvas');
        l.width = breit; l.height = hoch;
        const c = l.getContext('2d')!;
        tun(c);
        return new Promise<Blob>(f => l.toBlob(b => f(b!), 'image/png'));
      };
      const seiteBlob = await mal(620, 877, c => {
        c.fillStyle = '#fdfdfb'; c.fillRect(0, 0, 620, 877);
        c.strokeStyle = '#d8d8d0'; c.lineWidth = 2; c.strokeRect(1, 1, 618, 875);
        c.fillStyle = '#111'; c.font = 'bold 30px sans-serif';
        c.fillText('Formelsammlung', 48, 76);
        c.font = '18px sans-serif'; c.fillStyle = '#333';
        const zeilen = ['Ohmsches Gesetz      U = R · I',
          'Leistung             P = U · I = R · I²',
          'Reihenschaltung      R = R₁ + R₂ + R₃',
          'Parallelschaltung    1/R = 1/R₁ + 1/R₂',
          'Arbeit               W = P · t',
          'Wirkungsgrad         η = P_ab / P_zu',
          'Leiterwiderstand     R = ρ · l / A',
          'Spannungsteiler      U₂ = U · R₂/(R₁+R₂)'];
        zeilen.forEach((z, i) => c.fillText(z, 48, 140 + i * 46));
        c.strokeStyle = '#c9d4e4'; c.lineWidth = 1;
        for (let y = 118; y < 860; y += 46) { c.beginPath(); c.moveTo(40, y); c.lineTo(580, y); c.stroke(); }
      });
      const gifBlob = await mal(120, 120, c => {
        c.fillStyle = '#ffd75e'; c.beginPath(); c.arc(60, 60, 56, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#111'; c.beginPath(); c.arc(42, 48, 7, 0, Math.PI * 2); c.fill();
        c.beginPath(); c.arc(78, 48, 7, 0, Math.PI * 2); c.fill();
        c.strokeStyle = '#111'; c.lineWidth = 6; c.beginPath();
        c.arc(60, 62, 30, 0.25 * Math.PI, 0.75 * Math.PI); c.stroke();
      });
      const seite = Store.addPage(null, { text: 'Prüfungsvorbereitung', icon: '📐' });
      const blatt = Store.addBlock(seite.id, 'blatt', { text: '', papier: 'liniert',
        blattBreite: 595.28, blattHoehe: 841.89, raumVersion: 1, marken: [] });
      Store.addBlock(blatt.id, 'text', { text: 'Aufgabe 4 — Reihenschaltung berechnen' });
      const buch = await Dateien.ablegen(new File([seiteBlob], 'Formelbuch — Seite 12.png',
        { type: 'image/png' }), { blockId: blatt.id, name: 'Formelbuch — Seite 12.png' });
      const gif = await Dateien.ablegen(new File([gifBlob], 'daumen.gif',
        { type: 'image/gif' }), { blockId: blatt.id, name: 'daumen.gif' });
      Store.updateBlock(blatt.id, { marken: [
        { id: 'buch', art: 'bild', dateiId: buch.id, pts: [[290, 60], [545, 420]] },
        { id: 'gif', art: 'bild', dateiId: gif.id, pts: [[70, 300], [140, 370]] },
        { id: 'notiz', art: 'stift', farbe: '#d64545', breite: 3,
          pts: [[60, 120], [250, 120]] },
        { id: 'notiz2', art: 'text', farbe: '#2f7ed8', point: [60, 170], fontSize: 15,
          text: 'R gesamt = R1 + R2' }
      ] });
      App.oeffne(seite.id);
      await new Promise(r => setTimeout(r, 1200));
      /* Die Buchseite wählen, damit die Griffe zu sehen sind — genau das,
         womit man sie kleiner macht und verschiebt. */
      document.querySelector<HTMLElement>('.blatt-werk [data-wz="select"]')?.click();
      await new Promise(r => setTimeout(r, 250));
      const flaeche = document.querySelector<HTMLElement>('.blatt-marken');
      const knoten = flaeche?.querySelector<HTMLElement>('[data-sid="buch"]');
      const kasten = knoten?.getBoundingClientRect();
      if (kasten && knoten) {
        const x = kasten.left + kasten.width / 2, y = kasten.top + kasten.height / 2;
        const ev = (typ: string, dx: number, buttons: number) => new PointerEvent(typ,
          { bubbles: true, cancelable: true, clientX: x + dx, clientY: y,
            pointerId: 3, pointerType: 'mouse', isPrimary: true, button: 0, buttons });
        knoten.dispatchEvent(ev('pointerdown', 0, 1));
        flaeche?.dispatchEvent(ev('pointermove', 1, 1));
        flaeche?.dispatchEvent(ev('pointerup', 1, 0));
      }
      await new Promise(r => setTimeout(r, 600));
      document.querySelector('.blatt-papier')?.scrollIntoView({ block: 'start' });
      await new Promise(r => setTimeout(r, 400));
    }
  },

  leiter: {
    titel: 'Der Leiterstift: zehn Adern beim Namen (E509)',
    bauen: async () => {
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      Store.setMeta('zeichnen:stift', 'leiter');
      const M = (window as any).Marken;
      const seite = Store.addPage(null, { text: 'Wechselschaltung', icon: '⌁' });
      /* Je Ader ein Strich, in ihrer Farbe und Strichart, mit dem Kürzel
         daneben — genau die Reihe aus dem Katalog. */
      const marken: any[] = [];
      (M.LEITER as any[]).forEach((ader, i) => {
        const y = 70 + i * 46;
        marken.push({ id: 'a' + i, art: 'stift', stil: ader.stil, leiter: ader.id,
          farbe: ader.farbe, breite: 3, pts: [[150, y], [520, y]] });
        marken.push({ id: 't' + i, art: 'text', farbe: '#333333',
          point: [56, y - 7], fontSize: 13, text: ader.kurz + '  ' + ader.name });
      });
      Store.addBlock(seite.id, 'blatt', { text: '', papier: 'blanko',
        blattBreite: 595.28, blattHoehe: 560, raumVersion: 1, marken });
      App.oeffne(seite.id);
      await new Promise(r => setTimeout(r, 1300));
      /* Den Stift wählen, damit die Adernreihe in der Leiste steht. */
      document.querySelector<HTMLElement>('.blatt-werk [data-wz="stift"]')?.click();
      await new Promise(r => setTimeout(r, 250));
      const knopf = document.querySelector<HTMLElement>('.blatt-werk [data-act="stil"]');
      for (let i = 0; i < 8 && knopf && knopf.dataset.stil !== 'leiter'; i++) knopf.click();
      await new Promise(r => setTimeout(r, 500));
    }
  },

  chronik: {
    titel: 'Red-ur — die Chronik mit Graphen und dem Stapel der Tage (E514)',
    bauen: async () => {
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      /* Direkt zeigen — der Code ist die Tür, nicht der Inhalt, und ein
         Bild von einem Passwortfeld zeigt nichts (§55.3). */
      (window as any).Chronik?.zeigen?.();
      await new Promise(r => setTimeout(r, 500));
      /* Den Stapel einmal drehen, damit die Tiefe im stehenden Bild zu
         sehen ist — sonst liegen die Platten genau hintereinander. */
      const buehne = document.querySelector<HTMLElement>('.chr-buehne');
      buehne?.style.setProperty('--dx', '-26deg');
      buehne?.style.setProperty('--dy', '9deg');
      await new Promise(r => setTimeout(r, 260));
    }
  },

  leisteLinks: {
    titel: 'Die Werkzeugleiste an der Seite — vier Plätze (E512)',
    bauen: async () => {
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      Store.setMeta('zeichnen:stift', 'fueller');
      Store.setMeta('zeichnen:leistenlage', 'links');
      const seite = Store.addPage(null, { text: 'Wechselschaltung', icon: '⌁' });
      Store.addBlock(seite.id, 'blatt', { text: '', papier: 'kariert',
        blattBreite: 595.28, blattHoehe: 700, raumVersion: 1, marken: [] });
      App.oeffne(seite.id);
      await new Promise(r => setTimeout(r, 1300));
      document.querySelector<HTMLElement>('.blatt-werk [data-wz="stift"]')?.click();
      await new Promise(r => setTimeout(r, 400));
    }
  },

  spitze: {
    titel: 'Der Füller läuft spitz aus (E673)',
    /* Vier Zeilen, jede mit einer Welle, einem Haken und einem Punkt:
       Füller fein, Füller breit, Pinsel, Bleistift. Die ersten drei
       müssen an beiden Enden spitz auslaufen, der Bleistift nicht — und
       der Punkt muss ein Punkt bleiben (test561 §3).
         node bilder.mts spitze */
    bauen: async () => {
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      Store.setMeta('zeichnen:stift', 'fueller');
      const seite = Store.addPage(null, { text: 'Die Spitze', icon: '🖋' });
      const marken: any[] = [];
      const zeile = (y: number, stil: string, farbe: string, breite: number, k: string): void => {
        /* Die Welle: 121 Punkte über 360 pt, Druck leicht → fest → leicht. */
        marken.push({ id: k + 'w', art: 'stift', stil, farbe, breite,
          pts: Array.from({ length: 121 }, (_v, i) => [60 + i * 3, y + Math.sin(i / 120 * Math.PI * 3) * 20]),
          pressure: Array.from({ length: 121 }, (_v, i) => Math.round((0.35 + 0.45 * Math.sin(i / 120 * Math.PI)) * 100) / 100) });
        /* Der Haken: 12 pt, und der Punkt: 2 pt. */
        marken.push({ id: k + 'h', art: 'stift', stil, farbe, breite,
          pts: Array.from({ length: 13 }, (_v, i) => [450 + i, y - 6 + i * 0.9]),
          pressure: Array.from({ length: 13 }, () => 0.6) });
        marken.push({ id: k + 'p', art: 'stift', stil, farbe, breite,
          pts: Array.from({ length: 5 }, (_v, i) => [490 + i * 0.5, y]),
          pressure: Array.from({ length: 5 }, () => 0.6) });
      };
      zeile(90, 'fueller', '#1a1a1a', 2.4, 'a');
      zeile(170, 'fueller', '#1f4fa8', 5, 'b');
      zeile(250, 'pinsel', '#b8312f', 2.4, 'c');
      zeile(330, 'bleistift', '#333333', 2.4, 'd');
      Store.addBlock(seite.id, 'blatt', { text: '', papier: 'liniert',
        blattBreite: 595.28, blattHoehe: 400, raumVersion: 1, marken });
      App.oeffne(seite.id);
      await new Promise(r => setTimeout(r, 1300));
    }
  },

  werkzeugwerte: {
    titel: 'Jedes Werkzeug merkt sich Farbe und Stärke (E674)',
    /* Der Marker war Grün und Fein, der Stift Rot und Breit — und nach dem
       Wechsel zurück zum Stift zeigt die Leiste Rot und Breit, nicht das,
       was der Marker zuletzt hatte. Beide Striche liegen auf dem Blatt.
         node bilder.mts werkzeugwerte */
    bauen: async () => {
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      Store.setMeta('zeichnen:stift', 'fueller');
      Store.setMeta('zeichnen:werkzeugwerte', {
        stift: { farbe: '#d64545', breite: 5 },
        marker: { farbe: '#3aa757', breite: 1.2 }
      });
      const seite = Store.addPage(null, { text: 'Skript', icon: '🖍' });
      Store.addBlock(seite.id, 'blatt', { text: '', papier: 'liniert',
        blattBreite: 595.28, blattHoehe: 300, raumVersion: 1, marken: [
          { id: 'm1', art: 'marker', farbe: '#3aa757', breite: 1.2,
            pts: [[70, 96], [330, 96]], pressure: [0.5, 0.5] },
          { id: 's1', art: 'stift', stil: 'fueller', farbe: '#d64545', breite: 5,
            pts: Array.from({ length: 61 }, (_v, i) => [70 + i * 4, 150 + Math.sin(i / 60 * Math.PI * 2) * 18]),
            pressure: Array.from({ length: 61 }, () => 0.5) }
        ] });
      App.oeffne(seite.id);
      await new Promise(r => setTimeout(r, 1300));
      /* Marker wählen, dann zurück zum Stift — die Leiste muss Rot/Breit zeigen. */
      document.querySelector<HTMLElement>('.blatt-werk [data-wz="marker"]')?.click();
      await new Promise(r => setTimeout(r, 300));
      document.querySelector<HTMLElement>('.blatt-werk [data-wz="stift"]')?.click();
      await new Promise(r => setTimeout(r, 400));
    }
  },

  ecke: {
    titel: 'Der Glätter hält die Ecke (E676)',
    /* Ein langsam gezogenes „M" und ein „W" mit dem Stift — echte
       Zeigerereignisse, 2 px je 16 ms, damit der Glätter so stark mittelt
       wie bei einer langsamen Hand. Die Spitzen müssen Spitzen sein.
         node bilder.mts ecke */
    bauen: async () => {
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      Store.setMeta('zeichnen:stift', 'fueller');
      Store.setMeta('zeichnen:werkzeugwerte', { stift: { farbe: '#1a1a1a', breite: 2.4 } });
      const seite = Store.addPage(null, { text: 'Die Ecke', icon: '🖋' });
      Store.addBlock(seite.id, 'blatt', { text: '', papier: 'liniert',
        blattBreite: 595.28, blattHoehe: 320, raumVersion: 1, marken: [] });
      App.oeffne(seite.id);
      await new Promise(r => setTimeout(r, 1300));
      document.querySelector<HTMLElement>('.blatt-werk [data-wz="stift"]')?.click();
      await new Promise(r => setTimeout(r, 300));
      const svg = document.querySelector<SVGSVGElement>('.blatt-marken');
      if (!svg) return;
      const ctm = svg.getScreenCTM();
      if (!ctm) return;
      const zu = (x: number, y: number) => { const pt = svg.createSVGPoint(); pt.x = x; pt.y = y; const c = pt.matrixTransform(ctm); return { clientX: c.x, clientY: c.y }; };
      const ev = (typ: string, x: number, y: number) => new PointerEvent(typ, { ...zu(x, y), pointerType: 'pen',
        pressure: typ === 'pointerup' ? 0 : 0.5, isPrimary: true, button: 0, buttons: typ === 'pointerup' ? 0 : 1,
        pointerId: 7, bubbles: true, cancelable: true });
      const zug = async (ecken: number[][]): Promise<void> => {
        const pts: number[][] = [];
        for (let e = 0; e < ecken.length - 1; e++) {
          const [ax, ay] = ecken[e]!, [bx, by] = ecken[e + 1]!;
          const n = Math.round(Math.hypot(bx! - ax!, by! - ay!) / 2);
          for (let i = 0; i < n; i++) pts.push([ax! + (bx! - ax!) * i / n, ay! + (by! - ay!) * i / n]);
        }
        pts.push(ecken[ecken.length - 1]!);
        svg.dispatchEvent(ev('pointerdown', pts[0]![0]!, pts[0]![1]!));
        for (let i = 1; i < pts.length; i++) {
          await new Promise(r => setTimeout(r, 16));
          svg.dispatchEvent(ev('pointermove', pts[i]![0]!, pts[i]![1]!));
        }
        const l = pts[pts.length - 1]!;
        svg.dispatchEvent(ev('pointerup', l[0]!, l[1]!));
        await new Promise(r => setTimeout(r, 250));
      };
      /* Ein „M" (unten-oben-unten-oben-unten) und ein „W" daneben. */
      await zug([[80, 220], [80, 120], [120, 200], [160, 120], [160, 220]]);
      await zug([[220, 120], [245, 220], [270, 150], [295, 220], [320, 120]]);
      /* Und ein Zickzack, wie ihn test564 misst. */
      await zug([[380, 220], [405, 150], [430, 220], [455, 150], [480, 220], [505, 150]]);
      await new Promise(r => setTimeout(r, 400));
    }
  },

  laser: {
    titel: 'Der Laserpointer: zeigen statt schreiben (E512)',
    bauen: async () => {
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      Store.setMeta('zeichnen:leistenlage', 'oben');
      Store.setMeta('zeichnen:laser', 'linie');
      const seite = Store.addPage(null, { text: 'Wechselschaltung', icon: '⌁' });
      /* Etwas, worauf man zeigen kann. */
      const marken: any[] = [];
      for (let i = 0; i < 3; i++) {
        const y = 90 + i * 70;
        marken.push({ id: 'l' + i, art: 'stift', stil: 'kugel', farbe: '#7a4a21',
          breite: 3, pts: [[110, y], [480, y]] });
      }
      Store.addBlock(seite.id, 'blatt', { text: '', papier: 'blanko',
        blattBreite: 595.28, blattHoehe: 380, raumVersion: 1, marken });
      App.oeffne(seite.id);
      await new Promise(r => setTimeout(r, 1300));
      document.querySelector<HTMLElement>('.blatt-werk [data-wz="laser"]')?.click();
      await new Promise(r => setTimeout(r, 300));
      /* Den Strahl WÄHREND des Zeigens festhalten: nach dem Loslassen ist
         er weg, und genau das soll er ja sein (§55.3). */
      const f = document.querySelector<SVGSVGElement>('.blatt-marken')!;
      const ctm = f.getScreenCTM()!;
      const px = (q: number[]) => { const pt = f.createSVGPoint(); pt.x = q[0]!; pt.y = q[1]!;
        const c = pt.matrixTransform(ctm); return { x: c.x, y: c.y }; };
      const ev = (typ: string, q: number[]) => { const c = px(q);
        return new PointerEvent(typ, { bubbles: true, cancelable: true, clientX: c.x, clientY: c.y,
          pointerId: 1, pointerType: 'mouse', isPrimary: true,
          button: typ === 'pointermove' ? -1 : 0, buttons: 1, pressure: 0.6 }); };
      f.dispatchEvent(ev('pointerdown', [120, 240]));
      for (let i = 1; i <= 30; i++)
        f.dispatchEvent(ev('pointermove', [120 + i * 11, 240 - Math.sin(i / 5) * 55]));
      await new Promise(r => setTimeout(r, 120));
    }
  },

  bewegung: {
    titel: 'Die Adernreihe kommt als Welle (E511)',
    bauen: async () => {
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      Store.setMeta('zeichnen:stift', 'kugel');
      const seite = Store.addPage(null, { text: 'Wechselschaltung', icon: '⌁' });
      Store.addBlock(seite.id, 'blatt', { text: '', papier: 'blanko',
        blattBreite: 595.28, blattHoehe: 420, raumVersion: 1, marken: [] });
      App.oeffne(seite.id);
      await new Promise(r => setTimeout(r, 1300));
      document.querySelector<HTMLElement>('.blatt-werk [data-wz="stift"]')?.click();
      await new Promise(r => setTimeout(r, 250));
      /* MITTEN IN DER WELLE ANHALTEN. Eine Bewegung lässt sich auf einem
         stehenden Bild nur zeigen, solange sie läuft: 130 ms nach dem
         Umschalten sind die vorderen Tupfer da, die hinteren noch
         unterwegs, und genau das ist die Welle (§55.3). */
      const knopf = document.querySelector<HTMLElement>('.blatt-werk [data-act="stil"]');
      for (let i = 0; i < 8 && knopf && knopf.dataset.stil !== 'leiter'; i++) knopf.click();
      await new Promise(r => requestAnimationFrame(() => r(null)));
      /* MITTEN IN DER WELLE ANHALTEN, und zwar GENAU — nicht mit einer
         Wartezeit, die beim nächsten Rechner anders ausgeht. Jede
         Bewegung wird auf dieselbe Uhrzeit gestellt und angehalten; weil
         jeder Tupfer eine andere Verzögerung hat, steht jeder an einer
         anderen Stelle seiner eigenen Bewegung. Das IST die Welle. */
      document.querySelectorAll('.blatt-werk .blatt-farbe-leiter, .blatt-werk .zeichen')
        .forEach(el => (el as any).getAnimations?.().forEach((a: any) => {
          a.currentTime = 260; a.pause();
        }));
      await new Promise(r => setTimeout(r, 60));
    }
  },

  ordnerkarte: {
    titel: 'Der Blick in den Ordner kommt beim Hinschauen (E508)',
    bauen: async () => {
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      const fach = Store.addPage(null, { text: 'BT-Arbeitssicherheit', icon: '📁',
        heftArt: 'fach' });
      ['Chemie für Elektroberufe', 'Schutzmassnahmen nach NIV',
       'Erste Hilfe im Betrieb', 'Gefahrstoffe und Kennzeichnung',
       'Prüfprotokoll Anlage 4', 'Anhang: Formelblatt']
        .forEach(t => Store.addPage(fach.id, { text: t }));
      await Store.flush();
      (window as any).Bibliothek?.oeffne?.();
      await new Promise(r => setTimeout(r, 900));
      /* Über denselben Weg, den auch die Maus nimmt: hinschauen, warten. */
      const knopf = document.querySelector<HTMLElement>('.bib-blick[data-blick]');
      const k = knopf?.getBoundingClientRect();
      if (knopf && k) {
        knopf.dispatchEvent(new PointerEvent('pointerenter', { bubbles: false,
          pointerId: 1, pointerType: 'mouse', isPrimary: true,
          clientX: k.left + k.width / 2, clientY: k.top + k.height / 2 }));
      }
      await new Promise(r => setTimeout(r, 1400));
    }
  },

  neigung: {
    titel: 'Der Bleistift schattiert, wenn man ihn flach hält (E507)',
    bauen: async () => {
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      const seite = Store.addPage(null, { text: 'Schattieren', icon: '✏' });
      /* Drei Striche derselben Länge und desselben Drucks — nur die
         Neigung wächst. Was man sieht, ist allein ihr Werk. */
      const strich = (id: string, y: number, n: number) => {
        const pts: number[][] = [];
        const neigung: number[] = [];
        for (let i = 0; i <= 20; i++) {
          pts.push([70 + i * 22, y + Math.sin(i / 3) * 6]);
          neigung.push(n);
        }
        return { id, art: 'stift', stil: 'bleistift', farbe: '#2b2b2b', breite: 4,
                 pts, pressure: pts.map(() => 0.6), neigung };
      };
      const beschriftung = (id: string, y: number, text: string) =>
        ({ id, art: 'text', farbe: '#666666', point: [70, y], fontSize: 13, text });
      Store.addBlock(seite.id, 'blatt', { text: '', papier: 'blanko',
        blattBreite: 595.28, blattHoehe: 500, raumVersion: 1,
        marken: [
          beschriftung('t1', 100, 'senkrecht gehalten'),
          strich('s1', 140, 0),
          beschriftung('t2', 220, 'halb geneigt'),
          strich('s2', 260, 0.5),
          beschriftung('t3', 340, 'flach gehalten — schattiert'),
          strich('s3', 380, 1)
        ] });
      App.oeffne(seite.id);
      await new Promise(r => setTimeout(r, 1400));
    }
  },

  exporthinweis: {
    titel: 'Der PDF-Export sagt sichtbar, was er tut (E505)',
    bauen: async () => {
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      const skript = Store.addPage(null, { text: 'Elektro — Skript', icon: '📘' });
      Store.addBlock(skript.id, 'blatt', { text: '', papier: 'liniert',
        blattBreite: 595.28, blattHoehe: 841.89, raumVersion: 1,
        marken: [{ id: 'a', art: 'text', farbe: '#111111', point: [58, 96], fontSize: 16,
          text: 'Kapitel 3 — Leistung und Arbeit' }] });
      Store.updateBlock(skript.id, { dokumentModus: true });
      App.oeffne(skript.id);
      await new Promise(r => setTimeout(r, 1400));
      document.querySelector<HTMLElement>('[data-document-action="inspector"]')?.click();
      await new Promise(r => setTimeout(r, 700));
      document.querySelector('.document-export-hinweis')
        ?.scrollIntoView({ block: 'center' });
      await new Promise(r => setTimeout(r, 400));
    }
  },

  heftimstudio: {
    titel: 'Das eigene Formelheft über dem Dokument (E503)',
    bauen: async () => {
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      Store.setMeta('elektro:heftOrt', null);
      Store.setMeta('elektro:heftAnsicht', 'kapitel');
      Store.setMeta('elektro:heftPdf', '');
      const skript = Store.addPage(null, { text: 'Elektro — Prüfungsvorbereitung', icon: '📘' });
      const blatt = Store.addBlock(skript.id, 'blatt', { text: '', papier: 'liniert',
        blattBreite: 595.28, blattHoehe: 841.89, raumVersion: 1,
        marken: [
          { id: 'a', art: 'text', farbe: '#111111', point: [58, 96], fontSize: 17,
            text: 'Aufgabe 4 — Spannungsteiler' },
          { id: 'b', art: 'stift', farbe: '#d64545', breite: 3,
            pts: [[58, 118], [300, 118]] },
          { id: 'c', art: 'text', farbe: '#2f6fd0', point: [58, 168], fontSize: 15,
            text: 'U2 = U · R2 / (R1 + R2)' }
        ] });
      Store.addBlock(blatt.id, 'text', { text: '' });
      Store.updateBlock(skript.id, { dokumentModus: true });
      App.oeffne(skript.id);
      await new Promise(r => setTimeout(r, 1400));
      /* Das Heft aufklappen — über denselben Knopf, den auch der Mensch
         trifft: neben dem Fachzeichen in der Zeichenleiste. */
      document.querySelector<HTMLElement>(
        '.document-drawingbar [data-document-action="formelheft"]')?.click();
      await new Promise(r => setTimeout(r, 800));
      /* Auf die Buchseiten stellen, damit im Bild etwas zu lesen steht. */
      document.querySelector<HTMLElement>('.fh-fenster [data-a="buch"]')?.click();
      await new Promise(r => setTimeout(r, 900));
    }
  },

  schalensuche: {
    titel: 'Die Schalensuche nennt die Seite im Dokument (E500)',
    bauen: async () => {
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      const skript = Store.addPage(null, { text: 'Elektrotechnik — Skript', icon: '📕' });
      ['Vorwort und Aufbau', 'Kapitel 1 — Ladung und Strom',
       'Kapitel 2 — Der Kirchhoffsche Knotensatz erklärt die Stromverteilung im Netz',
       'Kapitel 3 — Leistung und Arbeit', 'Anhang: Formelsammlung']
        .forEach((t, i) => Store.addBlock(skript.id, 'pdfseite', { text: '', nr: i + 1,
          vonSeiten: 5, bw: 595, bh: 842, quelleId: 'q1', raumVersion: 1, suchtext: t }));
      Store.updateBlock(skript.id, { dokumentModus: true });

      const heft = Store.addPage(null, { text: 'Mitschrift 12. Mai', icon: '📗' });
      for (let i = 0; i < 3; i++) {
        const blatt = Store.addBlock(heft.id, 'blatt', { text: '', papier: 'liniert',
          blattBreite: 595.28, blattHoehe: 841.89, raumVersion: 1,
          marken: i === 1
            ? [{ id: 'mk', art: 'text', farbe: '#111111', point: [60, 120], fontSize: 15,
                text: 'Knotensatz: was reingeht, geht auch wieder raus' }]
            : [] });
        Store.addBlock(blatt.id, 'text', { text: '' });
      }
      Store.updateBlock(heft.id, { dokumentModus: true });
      App.oeffne(skript.id);
      await new Promise(r => setTimeout(r, 1200));
      App.suche();
      await new Promise(r => setTimeout(r, 400));
      const feld = document.querySelector<HTMLInputElement>('.overlay #q');
      if (feld) { feld.value = 'Knotensatz'; feld.dispatchEvent(new Event('input', { bubbles: true })); }
      await new Promise(r => setTimeout(r, 700));
    }
  },

  zerlegen: {
    titel: 'Ein mehrseitiges Blatt in Seiten zerlegen (E499)',
    bauen: async () => {
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      const A4 = 841.89;
      const seite = Store.addPage(null, { text: 'Mitschrift 12. Mai', icon: '📗' });
      const blatt = Store.addBlock(seite.id, 'blatt', { text: '', papier: 'kariert',
        blattBreite: 595.28, blattHoehe: A4 * 3, raumVersion: 1, marken: [
          { id: 'a', art: 'stift', farbe: '#111111', breite: 3, pts: [[60, 120], [420, 120]] },
          { id: 'b', art: 'stift', farbe: '#d64545', breite: 3,
            pts: [[60, A4 + 120], [420, A4 + 120]] },
          { id: 'c', art: 'stift', farbe: '#3aa757', breite: 3,
            pts: [[60, A4 * 2 + 120], [420, A4 * 2 + 120]] },
          { id: 'd', art: 'stift', farbe: '#2f7ed8', breite: 3,
            pts: [[480, A4 - 80], [480, A4 + 80]] }
        ] });
      Store.addBlock(blatt.id, 'text', { text: 'Reihenschaltung, Parallelschaltung, Leistung' });
      Store.updateBlock(seite.id, { dokumentModus: true });
      App.oeffne(seite.id);
      await new Promise(r => setTimeout(r, 1300));
      document.querySelector<HTMLElement>('[data-document-action="inspector"]')?.click();
      await new Promise(r => setTimeout(r, 400));
      document.querySelector<HTMLElement>('[data-document-action="page-split"]')?.click();
      await new Promise(r => setTimeout(r, 700));
    }
  },

  zoomruhe: {
    titel: '„Ausschnitt" und „Erkennen" ruhen im Zoom-Fenster (E498)',
    bauen: async () => {
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      const seite = Store.addPage(null, { text: 'Elektrotechnik — Skript', icon: '📕' });
      for (let i = 0; i < 2; i++) {
        const blatt = Store.addBlock(seite.id, 'blatt', { text: '', papier: 'liniert',
          blattBreite: 595.28, blattHoehe: 841.89, raumVersion: 1, marken: [
            { id: 'z' + i, art: 'stift', farbe: '#2f7ed8', breite: 3,
              pts: [[70, 120], [420, 120]] }] });
        Store.addBlock(blatt.id, 'text', { text: 'Kapitel ' + (i + 1) });
      }
      Store.updateBlock(seite.id, { dokumentModus: true });
      App.oeffne(seite.id);
      await new Promise(r => setTimeout(r, 1300));
      document.querySelector<HTMLElement>('[data-document-action="inspector"]')?.click();
      await new Promise(r => setTimeout(r, 400));
      document.querySelector<HTMLElement>('[data-document-action="lupe"]')?.click();
      await new Promise(r => setTimeout(r, 800));
      document.querySelector('.document-inspector-actions')?.scrollIntoView({ block: 'center' });
      await new Promise(r => setTimeout(r, 400));
    }
  },

  seitenumzug: {
    titel: 'Eine Seite in ein anderes Dokument — kopieren oder verschieben (E496)',
    bauen: async () => {
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      const mach = (name: string, icon: string, seiten: number) => {
        const seite = Store.addPage(null, { text: name, icon });
        for (let i = 0; i < seiten; i++) {
          const blatt = Store.addBlock(seite.id, 'blatt', { text: '', papier: 'liniert',
            blattBreite: 595.28, blattHoehe: 841.89, raumVersion: 1, marken: [
              { id: name + i, art: 'stift', farbe: '#2f7ed8', breite: 3,
                pts: [[70, 120 + i * 40], [420, 120 + i * 40]] }] });
          Store.addBlock(blatt.id, 'text', { text: name + ' — Seite ' + (i + 1) });
        }
        Store.updateBlock(seite.id, { dokumentModus: true });
        return seite;
      };
      const skript = mach('Elektrotechnik — Skript', '📕', 3);
      mach('Mitschrift 12. Mai', '📗', 2);
      mach('Prüfungsstoff', '📘', 4);
      mach('Laborbericht', '📙', 1);
      App.oeffne(skript.id);
      await new Promise(r => setTimeout(r, 1300));
      document.querySelector<HTMLElement>('[data-document-action="inspector"]')?.click();
      await new Promise(r => setTimeout(r, 400));
      document.querySelector<HTMLElement>('[data-document-action="page-to-doc"]')?.click();
      await new Promise(r => setTimeout(r, 700));
    }
  },

  papiere: {
    titel: 'Cornell-Notizen und Notenlinien — die zwei Papiere von GoodNotes (E495)',
    bauen: async () => {
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      const s = Store.addPage(null, { text: 'Papiere', icon: '📐' });
      const cornell = Store.addBlock(s.id, 'blatt', { text: '', papier: 'cornell' });
      Store.addBlock(cornell.id, 'text', { text: '' });
      Store.updateBlock(cornell.id, { marken: [
        { id: 'c1', art: 'text', farbe: '#111111', breite: 2, point: [120, 52],
          text: 'Ohmsches Gesetz', fontSize: 22 },
        { id: 'c2', art: 'text', farbe: '#2f7ed8', breite: 2, point: [24, 150],
          text: 'Was ist R?', fontSize: 13 },
        { id: 'c3', art: 'text', farbe: '#111111', breite: 2, point: [160, 150],
          text: 'U = R · I — der Widerstand ist der Quotient', fontSize: 13 },
        { id: 'c4', art: 'text', farbe: '#2f7ed8', breite: 2, point: [24, 200],
          text: 'Einheit?', fontSize: 13 },
        { id: 'c5', art: 'text', farbe: '#111111', breite: 2, point: [160, 200],
          text: 'Ohm (Ω) = Volt je Ampere', fontSize: 13 },
        { id: 'c6', art: 'text', farbe: '#3aa757', breite: 2, point: [24, 700],
          text: 'Zusammenfassung: Spannung, Strom und Widerstand hängen zusammen.', fontSize: 13 }
      ] });
      const noten = Store.addBlock(s.id, 'blatt', { text: '', papier: 'noten' });
      Store.addBlock(noten.id, 'text', { text: '' });
      App.oeffne(s.id);
      await new Promise(r => setTimeout(r, 1100));
    }
  },

  papierfuss: {
    titel: 'Der Fuss des Cornell-Blatts und die Notenlinien (E495)',
    bauen: async () => {
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      const s = Store.addPage(null, { text: 'Papiere unten', icon: '📐' });
      const cornell = Store.addBlock(s.id, 'blatt', { text: '', papier: 'cornell' });
      Store.addBlock(cornell.id, 'text', { text: '' });
      Store.updateBlock(cornell.id, { marken: [
        { id: 'f1', art: 'text', farbe: '#3aa757', breite: 2, point: [30, 760],
          text: 'Zusammenfassung: U = R · I verknüpft alle drei Grössen.', fontSize: 13 }
      ] });
      const noten = Store.addBlock(s.id, 'blatt', { text: '', papier: 'noten' });
      Store.addBlock(noten.id, 'text', { text: '' });
      App.oeffne(s.id);
      await new Promise(r => setTimeout(r, 1200));
      /* Bis an den Fuss des ersten Blatts rollen — dort steht die
         Zusammenfassungslinie, und gleich darunter fangen die Noten an. */
      const zweites = document.querySelectorAll('.blatt-papier')[1];
      zweites?.scrollIntoView({ block: 'start' });
      await new Promise(r => setTimeout(r, 600));
      /* `window.scrollBy` tut hier nichts — gerollt wird ein Kasten INNEN,
         nicht das Fenster. Also den ersten Vorfahren suchen, der wirklich
         rollt, und ihn zurücknehmen. */
      let kasten = zweites?.parentElement as HTMLElement | null;
      while (kasten && kasten.scrollHeight <= kasten.clientHeight + 2) kasten = kasten.parentElement;
      if (kasten) kasten.scrollTop -= 620;
      await new Promise(r => setTimeout(r, 400));
    }
  },

  elemente: {
    titel: 'Die Elemente-Bibliothek — gesicherte Marken stempeln (E494)',
    bauen: async () => {
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      /* Vier Elemente, wie sie nach ein paar Wochen Arbeit dastünden:
         ein Häkchen, ein Kreuz, ein Rahmen, eine Unterschrift. */
      Store.setMeta('zeichnen:elemente', [
        { id: 'el-haken', name: 'Häkchen', breite: 60, hoehe: 52, marken: [
          { art: 'stift', farbe: '#3aa757', breite: 5, pts: [[2, 28], [22, 50], [58, 2]] }] },
        { id: 'el-kreuz', name: 'Kreuz rot', breite: 48, hoehe: 48, marken: [
          { art: 'stift', farbe: '#d64545', breite: 5, pts: [[2, 2], [46, 46]] },
          { art: 'stift', farbe: '#d64545', breite: 5, pts: [[46, 2], [2, 46]] }] },
        { id: 'el-rahmen', name: 'Merkkasten', breite: 150, hoehe: 70, marken: [
          { art: 'rectangle', farbe: '#e0a419', breite: 2.4, pts: [[0, 0], [150, 70]] },
          { art: 'marker', farbe: '#e0a419', breite: 16, pts: [[10, 35], [140, 35]] }] },
        { id: 'el-name', name: 'Unterschrift', breite: 160, hoehe: 54, marken: [
          { art: 'stift', farbe: '#2f7ed8', breite: 2.4, stil: 'pinsel', pts: [
            [2, 40], [16, 8], [30, 44], [46, 10], [62, 42], [86, 16], [110, 40],
            [132, 12], [158, 34]] }] }
      ]);
      const s = Store.addPage(null, { text: 'Hefte durchsehen', icon: '⭐' });
      const blatt = Store.addBlock(s.id, 'blatt', { text: '', papier: 'liniert' });
      Store.addBlock(blatt.id, 'text', { text: 'Aufgabe 3 — Reihenschaltung' });
      /* Gestempelt: zweimal das Häkchen, einmal das Kreuz. */
      Store.updateBlock(blatt.id, { marken: [
        { id: 's1', art: 'stift', farbe: '#3aa757', breite: 5, pts: [[92, 118], [112, 140], [148, 92]] },
        { id: 's2', art: 'stift', farbe: '#3aa757', breite: 5, pts: [[92, 208], [112, 230], [148, 182]] },
        { id: 's3', art: 'stift', farbe: '#d64545', breite: 5, pts: [[96, 282], [140, 326]] },
        { id: 's4', art: 'stift', farbe: '#d64545', breite: 5, pts: [[140, 282], [96, 326]] }
      ] });
      App.oeffne(s.id);
      await new Promise(r => setTimeout(r, 900));
      /* Das Werkzeug wählen — dann steht sein Knopf in der Zubehörzeile —
         und die Bibliothek öffnen. */
      document.querySelector<HTMLElement>('.blatt-werk [data-wz="elemente"]')?.click();
      await new Promise(r => setTimeout(r, 250));
      document.querySelector<HTMLElement>('.blatt-werk [data-act="elemente"]')?.click();
      await new Promise(r => setTimeout(r, 500));
    }
  },

  dokumentsuche: {
    titel: 'Die Suche über mehrere Dokumente (E487)',
    bauen: async () => {
      Store.setMeta('rundgangGesehen', true);
      Store.setMeta('dokFindAlle', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      const mach = (name: string, icon: string, texte: string[]) => {
        const seite = Store.addPage(null, { text: name, icon });
        texte.forEach((t, i) => Store.addBlock(seite.id, 'pdfseite',
          { text: '', nr: i + 1, vonSeiten: texte.length, bw: 595, bh: 842,
            quelleId: 'q-' + name, raumVersion: 1, suchtext: t }));
        Store.updateBlock(seite.id, { dokumentModus: true });
        return seite;
      };
      const offen = mach('Elektrotechnik — Skript', '📕', [
        'Kapitel 3 — Das Ohmsche Gesetz beschreibt den Zusammenhang von Spannung, Strom und Widerstand.',
        'Übungen zum Kapitel']);
      mach('Mitschrift 12. Mai', '📗', ['Tafelbild',
        'Der Lehrer hat das Ohmsche Gesetz an einem Beispiel gerechnet: U = R · I']);
      mach('Prüfungsstoff', '📘', ['Ohmsches Gesetz, Kirchhoff, Leistung']);
      mach('Laborbericht', '📙', ['Messreihe 1', 'Ohmsches Gesetz überprüft, Abweichung 2 %']);
      App.oeffne(offen.id);
      await new Promise(r => setTimeout(r, 1400));
      document.querySelector<HTMLElement>('.document-find-button')?.click();
      await new Promise(r => setTimeout(r, 300));
      const feld = document.querySelector<HTMLInputElement>('[data-document-find]');
      if (feld) { feld.value = 'Ohmsche'; feld.dispatchEvent(new Event('input', { bubbles: true })); }
      await new Promise(r => setTimeout(r, 900));
    }
  },

  pdfausfuhr: {
    titel: 'Das ganze Dokument als PDF sichern (E488)',
    bauen: async () => {
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      const seite = Store.addPage(null, { text: 'Elektrotechnik — Skript', icon: '📕' });
      for (let i = 1; i <= 4; i++)
        Store.addBlock(seite.id, 'blatt', { text: '', blattBreite: 595.28, blattHoehe: 841.89,
          raumVersion: 1, papier: 'kariert', marken: [
            { id: 's' + i, art: 'stift', farbe: '#d64545', breite: 3,
              pts: [[60, 120 + i * 10], [420, 120 + i * 10]] },
            { id: 'z' + i, art: 'zettel', farbe: '#e0a419', pts: [[330, 220], [560, 300]],
              text: 'Seite ' + i + ' — hier nachfragen' }
          ] });
      Store.updateBlock(seite.id, { dokumentModus: true });
      App.oeffne(seite.id);
      await new Promise(r => setTimeout(r, 1400));
      document.querySelector<HTMLElement>('[data-document-action="inspector"]')?.click();
      await new Promise(r => setTimeout(r, 600));
    }
  },

  schutzleiter: {
    titel: 'Der Schutzleiter-Stift: grün-gelb und Strich-Punkt (E490)',
    bauen: async () => {
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      const p = Store.addPage(null, { text: 'Schaltplan mit Schutzleiter', icon: '⚡' });
      const blatt = Store.addBlock(p.id, 'blatt', { text: '', papier: 'kariert' });
      Store.addBlock(blatt.id, 'text', { text: 'Steckdose an L, N und PE — der Schutzleiter grün-gelb' });
      Store.updateBlock(blatt.id, { marken: [
        /* Zwei gewöhnliche Adern und darunter der Schutzleiter: gerade
           gezogen (gehalten) und einmal von Hand. */
        { id: 'l', art: 'line', farbe: '#111111', breite: 2.4, pts: [[70, 150], [430, 150]] },
        { id: 'n', art: 'line', farbe: '#2f7ed8', breite: 2.4, pts: [[70, 190], [430, 190]] },
        { id: 'pe1', art: 'line', stil: 'schutzleiter', breite: 3, pts: [[70, 230], [430, 230]] },
        { id: 'pe2', art: 'stift', stil: 'schutzleiter', breite: 3,
          pts: Array.from({ length: 40 }, (_, i) => {
            const t = i / 39;
            return [70 + t * 360, 300 + Math.sin(t * 6) * 26];
          }) },
        { id: 'z', art: 'zettel', farbe: '#e0a419', pts: [[70, 380], [400, 450]],
          text: 'PE: gerade ziehen und halten — er bleibt grün-gelb' }
      ] });
      App.oeffne(p.id);
      await new Promise(r => setTimeout(r, 900));
    }
  },

  gesperrt: {
    titel: 'Was auf dieser Seite gesperrt ist (E492)',
    bauen: async () => {
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      const p = Store.addPage(null, { text: 'Schaltplan Werkstatt', icon: '⚡' });
      Store.addBlock(p.id, 'blatt', { text: '', papier: 'kariert', marken: [
        { id: 'pe', art: 'line', stil: 'schutzleiter', breite: 3,
          pts: [[70, 120], [430, 120]], gesperrt: true },
        { id: 'l1', art: 'line', farbe: '#111111', breite: 2.4,
          pts: [[70, 170], [430, 170]], gesperrt: true },
        { id: 'z1', art: 'zettel', farbe: '#e0a419', pts: [[70, 220], [400, 300]],
          text: 'Vorlage vom Meister — nicht verschieben', gesperrt: true },
        { id: 'frei', art: 'stift', farbe: '#d64545', breite: 2.4,
          pts: [[70, 340], [200, 380], [330, 340]] }
      ] });
      Store.updateBlock(p.id, { dokumentModus: true });
      App.oeffne(p.id);
      await new Promise(r => setTimeout(r, 1400));
      document.querySelector<HTMLElement>('[data-document-action="inspector"]')?.click();
      await new Promise(r => setTimeout(r, 600));
    }
  },

  praesentieren: {
    titel: 'Präsentieren mit Laserpointer (E493)',
    bauen: async () => {
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      const p = Store.addPage(null, { text: 'Schulung Schutzmassnahmen', icon: '⚡' });
      for (let i = 1; i <= 3; i++) {
        const blatt = Store.addBlock(p.id, 'blatt', { text: '', papier: 'blanko' });
        Store.addBlock(blatt.id, 'text', { text: 'Folie ' + i + ' — Schutzleiter und Fehlerstrom' });
        Store.updateBlock(blatt.id, { marken: [
          { id: 'pe' + i, art: 'line', stil: 'schutzleiter', breite: 4, pts: [[70, 200], [500, 200]] },
          { id: 't' + i, art: 'stift', farbe: '#d64545', breite: 3,
            pts: [[70, 300], [200, 260], [330, 320], [460, 280]] }
        ] });
      }
      Store.updateBlock(p.id, { dokumentModus: true });
      App.oeffne(p.id);
      await new Promise(r => setTimeout(r, 1400));
      document.querySelector<HTMLElement>('[data-document-action="praesentieren"]')?.click();
      await new Promise(r => setTimeout(r, 900));
      /* Einen Laserpunkt setzen, damit er auf dem Bild zu sehen ist. */
      const f = document.querySelector<HTMLElement>('.document-zeigen-flaeche');
      if (f) {
        const r = f.getBoundingClientRect();
        f.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: r.left + r.width * 0.55,
          clientY: r.top + r.height * 0.42, pointerId: 1, buttons: 1 }));
        f.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: r.left + r.width * 0.55,
          clientY: r.top + r.height * 0.42, pointerId: 1, buttons: 1 }));
      }
      await new Promise(r => setTimeout(r, 300));
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

  /* --- Der Trainer (E677) ------------------------------------------------
     Zwei Zustände: die Übersicht mit den sechs Boxen nach dem Anlegen des
     Kapitels, und eine Prüfungsfrage nach dem Prüfen — richtig, falsch und
     gefehlt als Wort und Farbe an jeder Antwort. */
  trainer: {
    titel: 'Der Trainer: Boxen und Runden nach dem Anlegen des Kapitels',
    bauen: async () => {
      const w = window as any;
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      w.Produktwelten.lernen('trainer');
      await new Promise(r => setTimeout(r, 700));
      document.querySelector<HTMLElement>('.lernwelt [data-tr-anlegen]')?.click();
      await new Promise(r => setTimeout(r, 700));
    }
  },
  trainerFrage: {
    titel: 'Der Trainer: eine Prüfungsfrage, geprüft — richtig, gefehlt, falsch',
    bauen: async () => {
      const w = window as any;
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      w.Produktwelten.lernen('trainer');
      await new Promise(r => setTimeout(r, 700));
      document.querySelector<HTMLElement>('.lernwelt [data-tr-anlegen]')?.click();
      await new Promise(r => setTimeout(r, 700));
      document.querySelector<HTMLElement>('.lernwelt [data-tr-start="pruefung"]')?.click();
      await new Promise(r => setTimeout(r, 400));
      /* a) und c) ankreuzen — bei Frage 1 sind alle vier richtig: zwei
         richtig, zwei gefehlt. */
      document.querySelector<HTMLInputElement>('.lernwelt input[data-tr-option="0"]')?.click();
      document.querySelector<HTMLInputElement>('.lernwelt input[data-tr-option="2"]')?.click();
      document.querySelector<HTMLElement>('.lernwelt [data-tr-pruefen]')?.click();
      await new Promise(r => setTimeout(r, 300));
    }
  },
  trainerLuecke: {
    titel: 'Der Trainer: eine Lücke im Satz, falsch getippt',
    bauen: async () => {
      const w = window as any;
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      w.Produktwelten.lernen('trainer');
      await new Promise(r => setTimeout(r, 700));
      document.querySelector<HTMLElement>('.lernwelt [data-tr-anlegen]')?.click();
      await new Promise(r => setTimeout(r, 700));
      document.querySelector<HTMLElement>('.lernwelt [data-tr-start="art"][data-art="luecke"]')?.click();
      await new Promise(r => setTimeout(r, 400));
      const feld = document.querySelector<HTMLInputElement>('.lernwelt [data-tr-luecke]');
      if (feld) feld.value = 'Republik';
      document.querySelector<HTMLElement>('.lernwelt [data-tr-pruefen]')?.click();
      await new Promise(r => setTimeout(r, 300));
    }
  },

  /* --- Der Trainer mit zwei Kapiteln (E679) ------------------------------
     Die Übersicht mit Staatskunde und NIN Kap. 5–7 nebeneinander, und eine
     Ankreuzfrage der NIN-Prüfung mit Nummer, Punkten und Seite. */
  trainerNin: {
    titel: 'Der Trainer: zwei Kapitel, je mit Prüfung und Themen',
    bauen: async () => {
      const w = window as any;
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      w.Produktwelten.lernen('trainer');
      await new Promise(r => setTimeout(r, 700));
      document.querySelector<HTMLElement>('.lernwelt [data-tr-anlegen="staatskunde-kapitel"]')?.click();
      await new Promise(r => setTimeout(r, 700));
      document.querySelector<HTMLElement>('.lernwelt [data-tr-anlegen="nin-kapitel-5-7"]')?.click();
      await new Promise(r => setTimeout(r, 900));
    }
  },
  trainerNinFrage: {
    titel: 'Der Trainer: Frage 5 der Probeprüfung 1, angekreuzt und geprüft',
    bauen: async () => {
      const w = window as any;
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      w.Produktwelten.lernen('trainer');
      await new Promise(r => setTimeout(r, 700));
      document.querySelector<HTMLElement>('.lernwelt [data-tr-anlegen="nin-kapitel-5-7"]')?.click();
      await new Promise(r => setTimeout(r, 900));
      const kap = document.querySelector<HTMLElement>('.lernwelt .lw-trainer-kapitel[data-tr-kapitel^="Regeln"]');
      kap?.querySelector<HTMLElement>('[data-tr-start="pruefung"]')?.click();
      await new Promise(r => setTimeout(r, 400));
      /* Bis zur Ankreuzfrage 5: Schreiben aufdecken und mit „Gut" bewerten, die Lücke lösen. */
      for (let i = 0; i < 6; i++) {
        const r = document.querySelector<HTMLElement>('.lernwelt .lw-trainer-runde');
        if (!r || r.dataset['trKind'] === 'mc') break;
        if (r.dataset['trKind'] === 'schreiben') {
          r.querySelector<HTMLElement>('[data-tr-aufdecken]')?.click(); await new Promise(x => setTimeout(x, 100));
          document.querySelector<HTMLElement>('.lernwelt [data-tr-rate="3"]')?.click();
        } else {
          const k = Store.getBlock(r.dataset['trId'] || '');
          const feld = r.querySelector<HTMLInputElement>('[data-tr-luecke]');
          if (feld && k) feld.value = String(k.quiz.loesungen[0]);
          r.querySelector<HTMLElement>('[data-tr-pruefen]')?.click(); await new Promise(x => setTimeout(x, 100));
          document.querySelector<HTMLElement>('.lernwelt [data-tr-weiter]')?.click();
        }
        await new Promise(x => setTimeout(x, 200));
      }
      /* a) und d) ankreuzen: a) richtig, c) gefehlt, d) falsch. */
      document.querySelector<HTMLInputElement>('.lernwelt input[data-tr-option="0"]')?.click();
      document.querySelector<HTMLInputElement>('.lernwelt input[data-tr-option="3"]')?.click();
      document.querySelector<HTMLElement>('.lernwelt [data-tr-pruefen]')?.click();
      await new Promise(r => setTimeout(r, 300));
    }
  },

  /* --- Der Streifen zur neuen Fassung (E678) ------------------------------
     Er wird gezeigt, wie pwa.ts ihn bestellt — ohne Service Worker, der
     meldet sich nur über https. Unten, am Telefon über der Leiste. */
  fassung: {
    titel: 'Der Streifen „neue Fassung" liegt unten, am Telefon über der Leiste',
    bauen: async () => {
      const w = window as any;
      Store.setMeta('rundgangGesehen', true);
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-willkommen')?.remove();
      w.UI.banner('Es liegt eine neue Fassung bereit. <button id="pwa-neu" class="banner-tat">Jetzt laden</button>', 'info unten');
      await new Promise(r => setTimeout(r, 300));
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

/* --- Willkommen mit Textur, Schalter und Symbolreihe (E462) ---------------
   Drei Vorgaben auf einem Bild: die Rauschtextur im Kopf des
   Begrüssungsschirms, der eingeschaltete Schalter mit seinem Verlauf und
   die Beschriftung an einem Symbol der Studio-Reihe. */
/* --- E463: sichtbar und lustig ------------------------------------------
   Acht Ansichten für die Runde, in der die Vorgaben an die Wege kamen, die
   man täglich sieht. Jede zeigt genau EIN Bauteil an seinem echten Ort.
   Das Aufräumen steht in jeder einzeln — `bauen` läuft in der Seite, und
   eine Node-Konstante ist dort nicht erreichbar (E398, oben). */
/* Der Vorhang ist nach dem Start weg — für das Bild wird er noch einmal
   zugezogen. Die Notbremse (6 s) wird abgeschaltet, sonst ist er beim
   Fotografieren schon wieder auf. */
ANSICHTEN['vorhang'] = {
  titel: 'Der Vorhang beim Start: „Redion" geht Buchstabe für Buchstabe an (E463)',
  bauen: async () => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    document.querySelector('.produkt-onboarding-lage')?.remove();
    document.getElementById('rg-willkommen')?.remove();
    document.getElementById('rg-einladung')?.remove();
    /* Der Start versteckt ihn 600 ms nach seinem Ende — erst danach wieder
       zuziehen, sonst zieht der Start ihn gleich noch einmal auf. */
    await new Promise(r => setTimeout(r, 900));
    const v = document.getElementById('ru-vorhang');
    if (v) { v.hidden = false; v.style.animation = 'none'; v.classList.remove('ru-vorhang-weg'); }
    await new Promise(r => setTimeout(r, 700));
  }
};

ANSICHTEN['hand'] = {
  titel: 'Die Hand im Rundgang: sie tippt auf das, was der Kasten erklärt (E463)',
  bauen: async () => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    document.querySelector('.produkt-onboarding-lage')?.remove();
    document.getElementById('rg-willkommen')?.remove();
    document.getElementById('rg-einladung')?.remove();
    (window as any).Rundgang.start();
    await new Promise(r => setTimeout(r, 900));
  }
};

ANSICHTEN['pdfpresse'] = {
  titel: 'Die Presse beim PDF-Einlesen: Seite für Seite, unten rechts (E463)',
  bauen: async () => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    document.querySelector('.produkt-onboarding-lage')?.remove();
    document.getElementById('rg-willkommen')?.remove();
    document.getElementById('rg-einladung')?.remove();
    Store.addPage(null, { text: 'Skript Elektrotechnik' });
    await Store.flush();
    Bibliothek.oeffne();
    await new Promise(r => setTimeout(r, 500));
    const w = window as any;
    /* Dieselbe Karte, die `einlesen.ts` baut — nur ohne echte PDF, die ein
       Bildschirmfoto nicht braucht. Text und Zahl sind die aus dem Lauf. */
    w.UI.toast('Seite 7 von 12 …', 120000);
    w.Lader.schweben({ art: 'presse', text: 'Seite 7 von 12 …' });
    await new Promise(r => setTimeout(r, 600));
  }
};

ANSICHTEN['sterne'] = {
  titel: 'Die Sterne im Studio-Kopf: zwei Aufträge laufen (E463)',
  bauen: async () => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    document.querySelector('.produkt-onboarding-lage')?.remove();
    document.getElementById('rg-willkommen')?.remove();
    document.getElementById('rg-einladung')?.remove();
    const w = window as any;
    await w.Auftraege.anlegen('ocr', { seiten: 80 }, { schritte: 80, text: 'Seite 34 von 80' });
    await w.Auftraege.anlegen('embeddings', { texte: 1200 }, { schritte: 0, text: 'Gedächtnis wird gebaut' });
    await w.AuftragsAnzeige.knopfFrisch();
    Bibliothek.oeffne();
    await new Promise(r => setTimeout(r, 600));
  }
};

ANSICHTEN['funkel'] = {
  titel: 'Die KI-Aktionen glimmen in Werkzeuggruppen (E528)',
  bauen: async () => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    document.querySelector('.produkt-onboarding-lage')?.remove();
    document.getElementById('rg-willkommen')?.remove();
    document.getElementById('rg-einladung')?.remove();
    const seite = Store.addPage(null, { text: 'Projektplan' });
    await Store.flush();
    App.oeffne(seite.id);
    await new Promise(r => setTimeout(r, 400));
    App.kiPanel();
    await new Promise(r => setTimeout(r, 900));
    const tools = document.querySelector<HTMLDetailsElement>('#ai-tools');
    if (tools) tools.open = true;
  }
};

ANSICHTEN['lernstart'] = {
  titel: '„Lernen starten" in der Lernwelt glimmt (E463)',
  bauen: async () => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    document.querySelector('.produkt-onboarding-lage')?.remove();
    document.getElementById('rg-willkommen')?.remove();
    document.getElementById('rg-einladung')?.remove();
    const fach = Store.addPage(null, { text: 'Elektrotechnik' });
    for (const q of ['Ohmsches Gesetz :: U = R · I', 'Leistung :: P = U · I',
                     'Arbeit :: W = P · t', 'Reihenschaltung :: R = R1 + R2'])
      Store.addBlock(fach.id, 'flashcard', { text: q });
    await Store.flush();
    (window as any).Produktwelten.lernen('heute');
    await new Promise(r => setTimeout(r, 900));
  }
};

ANSICHTEN['covertextur'] = {
  titel: 'Das Rauschen als Cover einer Seite (E463)',
  bauen: async () => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    document.querySelector('.produkt-onboarding-lage')?.remove();
    document.getElementById('rg-willkommen')?.remove();
    document.getElementById('rg-einladung')?.remove();
    const seite = Store.addPage(null, { text: 'Nachtschicht', icon: '🌙' });
    Store.updateBlock(seite.id, { cover: 'textur:nacht' });
    Store.addBlock(seite.id, 'text', { text: 'Was heute noch zu tun ist.' });
    await Store.flush();
    App.oeffne(seite.id);
    await new Promise(r => setTimeout(r, 900));
  }
};

ANSICHTEN['auge'] = {
  titel: 'Das Auge am Ordnerdeckel — und der Blick hinein (E463)',
  bauen: async () => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    document.querySelector('.produkt-onboarding-lage')?.remove();
    document.getElementById('rg-willkommen')?.remove();
    document.getElementById('rg-einladung')?.remove();
    const fach = Store.addPage(null, { text: 'Elektrotechnik', icon: '⚡' });
    Store.updateBlock(fach.id, { heftArt: 'fach' });
    ['Kapitel 2 — Spannung und Strom', 'Formelsammlung', 'Prüfung Februar',
     'Messprotokoll 14.03.'].forEach(t => Store.addPage(fach.id, { text: t }));
    Store.addPage(null, { text: 'Lose Notiz' });
    await Store.flush();
    Bibliothek.oeffne();
    await new Promise(r => setTimeout(r, 700));
  },
  dann: async () => {
    document.querySelector<HTMLElement>('.bib-blick[data-blick]')?.click();
    await new Promise(r => setTimeout(r, 900));
  }
};

/* --- G1: Zeichnen wie GoodNotes (E465) -----------------------------------
   Ein A4-Blatt mit Dreieck, rundem Rechteck, einem Bleistift- und einem
   Fuellerstrich; darunter die Blattleiste mit dem Stift gewaehlt, damit
   Stil, Farben, Stufen und der neue Staerke-Regler zu sehen sind. */
ANSICHTEN['zeichnen'] = {
  titel: 'Zeichnen wie GoodNotes: Dreieck, rundes Rechteck, Bleistift, freie Stärke (E465)',
  bauen: async () => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    document.querySelector('.produkt-onboarding-lage')?.remove();
    document.getElementById('rg-willkommen')?.remove();
    document.getElementById('rg-einladung')?.remove();
    Store.setMeta('zeichnen:stift', 'bleistift');
    const seite = Store.addPage(null, { text: 'Skizzen zur Reihenschaltung' });
    const welle = (x0: number, y0: number, n: number, amp: number) => {
      const pts: number[][] = [], druck: number[] = [];
      for (let i = 0; i <= n; i++) {
        pts.push([Math.round((x0 + i * 6) * 10) / 10, Math.round((y0 + Math.sin(i / 2.2) * amp) * 10) / 10]);
        druck.push(Math.round((0.35 + 0.5 * Math.abs(Math.sin(i / 3))) * 100) / 100);
      }
      return { pts, druck };
    };
    const b = welle(70, 150, 60, 14), f = welle(70, 230, 60, 14);
    Store.addBlock(seite.id, 'blatt', {
      text: '', blattBreite: 595.28, blattHoehe: 841.89, raumVersion: 1,
      marken: [
        { id: 'g1-1', art: 'triangle', farbe: '#d64545', breite: 2.4, pts: [[60, 330], [220, 470]] },
        { id: 'g1-2', art: 'roundrect', farbe: '#2f7ed8', breite: 2.4, pts: [[260, 330], [470, 470]] },
        { id: 'g1-3', art: 'rectangle', farbe: '#3aa757', breite: 2.4, pts: [[60, 510], [220, 620]] },
        { id: 'g1-4', art: 'ellipse', farbe: '#e0a419', breite: 2.4, pts: [[260, 510], [470, 620]] },
        { id: 'g1-5', art: 'stift', stil: 'bleistift', farbe: '#111111', breite: 2.4, pts: b.pts, pressure: b.druck },
        { id: 'g1-6', art: 'stift', stil: 'fueller', farbe: '#111111', breite: 2.4, pts: f.pts, pressure: f.druck },
        { id: 'g1-7', art: 'text', farbe: '#111111', breite: 2.4, point: [70, 90], text: 'Bleistift oben, Füller darunter', fontSize: 16 }
      ]
    });
    await Store.flush();
    App.oeffne(seite.id);
    await new Promise(r => setTimeout(r, 700));
    document.querySelector<HTMLElement>('.blatt-werk [data-wz="stift"]')?.click();
    await new Promise(r => setTimeout(r, 400));
  }
};

/* Derselbe Aufbau wie `zeichnen`, ein anderer Zustand: die Klappe offen. */
ANSICHTEN['staerke'] = {
  titel: 'Die Klappe mit dem Regler der freien Stärke (E465 Nachtrag)',
  bauen: ANSICHTEN['zeichnen']!.bauen,
  dann: async () => {
    document.querySelector<HTMLElement>('.blatt-werk .blatt-strich.on')?.click();
    await new Promise(r => setTimeout(r, 300));
  }
};

/* --- G2: Auswahl wie GoodNotes (E466) ------------------------------------
   Ein gedrehtes rundes Rechteck, ein gesperrtes Bild-Ersatzkaestchen mit
   Schloss, ein gewaehlter Strich mit Drehgriff — und die Auswahl-Leiste mit
   Ausschneiden, nach vorn, nach hinten, Sperren. */
ANSICHTEN['auswahl'] = {
  titel: 'Auswahl wie GoodNotes: Drehgriff, Schloss, Ausschneiden, Reihenfolge (E466)',
  bauen: async () => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    document.querySelector('.produkt-onboarding-lage')?.remove();
    document.getElementById('rg-willkommen')?.remove();
    document.getElementById('rg-einladung')?.remove();
    const seite = Store.addPage(null, { text: 'Schaltplan, Auswahl' });
    const pts: number[][] = [], druck: number[] = [];
    for (let i = 0; i <= 50; i++) { pts.push([80 + i * 7, 420 + Math.sin(i / 3) * 18]); druck.push(0.5 + 0.3 * Math.abs(Math.sin(i / 4))); }
    Store.addBlock(seite.id, 'blatt', {
      text: '', blattBreite: 595.28, blattHoehe: 841.89, raumVersion: 1,
      marken: [
        { id: 'g2-1', art: 'roundrect', farbe: '#2f7ed8', breite: 2.4, pts: [[90, 120], [300, 240]], dreh: -14 },
        { id: 'g2-2', art: 'zettel', farbe: '#e0a419', breite: 2.4, pts: [[340, 110], [520, 220]], text: 'Gesperrt: die Vorlage bleibt liegen', gesperrt: true },
        { id: 'g2-3', art: 'triangle', farbe: '#d64545', breite: 2.4, pts: [[120, 280], [260, 380]] },
        { id: 'g2-4', art: 'stift', stil: 'fueller', farbe: '#111111', breite: 2.4, pts, pressure: druck }
      ]
    });
    await Store.flush();
    App.oeffne(seite.id);
    await new Promise(r => setTimeout(r, 700));
    document.querySelector<HTMLElement>('.blatt-werk [data-wz="select"]')?.click();
    await new Promise(r => setTimeout(r, 200));
    /* Das gedrehte Rechteck und den Zettel waehlen — dann stehen Griffe,
       Drehgriff und Schloss im Bild. */
    const f = document.querySelector<SVGSVGElement>('.blatt-marken');
    const ctm = f?.getScreenCTM();
    if (f && ctm) {
      const tipp = (id: string, x: number, y: number, shift: boolean) => {
        const pt = f.createSVGPoint(); pt.x = x; pt.y = y; const c = pt.matrixTransform(ctm);
        const el = f.querySelector('[data-sid="' + id + '"]') || f;
        const ev = (typ: string) => new PointerEvent(typ, { bubbles: true, cancelable: true, clientX: c.x, clientY: c.y,
          pointerId: 7, pointerType: 'mouse', isPrimary: true, button: 0, buttons: typ === 'pointerup' ? 0 : 1, shiftKey: shift });
        el.dispatchEvent(ev('pointerdown')); f.dispatchEvent(ev('pointerup'));
      };
      tipp('g2-1', 190, 180, false);
      tipp('g2-2', 430, 165, true);
    }
    await new Promise(r => setTimeout(r, 400));
  }
};

ANSICHTEN['seiten'] = {
  titel: 'Seiten wie GoodNotes: Seitenmenü, gedrehte Seite, Lesezeichen (E467)',
  bauen: async () => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    document.querySelector('.produkt-onboarding-lage')?.remove();
    document.getElementById('rg-willkommen')?.remove();
    document.getElementById('rg-einladung')?.remove();
    const seite = Store.addPage(null, { text: 'Physik, Kapitel 3', icon: '📕' });
    const welle = (y: number) => { const pts: number[][] = []; for (let i = 0; i <= 40; i++) pts.push([90 + i * 10, y + Math.sin(i / 2.5) * 12]); return pts; };
    Store.addBlock(seite.id, 'blatt', { text: '', papier: 'liniert', blattBreite: 595.28, blattHoehe: 841.89, raumVersion: 1,
      marken: [{ id: 's1', art: 'text', farbe: '#111111', breite: 2.4, point: [80, 90], text: 'Reihenschaltung: R = R1 + R2', fontSize: 18 },
               { id: 's2', art: 'stift', stil: 'fueller', farbe: '#2f7ed8', breite: 2.4, pts: welle(200) }] });
    const quer = Store.addBlock(seite.id, 'blatt', { text: '', papier: 'kariert', blattBreite: 595.28, blattHoehe: 841.89, raumVersion: 1, gedreht: 90, lesezeichen: true,
      marken: [{ id: 's3', art: 'rectangle', farbe: '#d64545', breite: 2.4, pts: [[80, 120], [520, 300]] },
               { id: 's4', art: 'text', farbe: '#111111', breite: 2.4, point: [100, 160], text: 'Quer: Schaltplan', fontSize: 20 }] });
    Store.addBlock(quer.id, 'text', { text: '' });
    Store.addBlock(seite.id, 'blatt', { text: '', papier: 'blanko', blattBreite: 595.28, blattHoehe: 841.89, raumVersion: 1, marken: [] });
    Store.updateBlock(seite.id, { dokumentModus: true });
    await Store.flush();
    App.oeffne(seite.id);
    await new Promise(r => setTimeout(r, 1200));
    document.querySelector<HTMLElement>('[data-document-action="inspector"]')?.click();
    document.querySelector<HTMLElement>('[data-document-action="thumbnails"]')?.click();
    await new Promise(r => setTimeout(r, 300));
    document.querySelector<HTMLElement>('.document-thumbnails [data-document-index="1"]')?.click();
    await new Promise(r => setTimeout(r, 900));
  }
};

ANSICHTEN['suche'] = {
  titel: 'Suchen im Dokument und die Verweise der PDF (E468)',
  bauen: async () => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    document.querySelector('.produkt-onboarding-lage')?.remove();
    document.getElementById('rg-willkommen')?.remove();
    document.getElementById('rg-einladung')?.remove();
    /* Dieselbe kleine PDF wie in test441: Text, ein Verweis nach draussen,
       einer auf Seite 2 — von Hand gebaut, ohne Bibliothek. */
    const objs: string[] = [];
    objs.push('<< /Type /Pages /Count 2 /Kids [4 0 R 6 0 R] >>');
    objs.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
    const s1 = 'BT /F1 24 Tf 50 770 Td (Reihenschaltung: R = R1 + R2) Tj ET\n' +
               'BT /F1 14 Tf 50 720 Td (Der Widerstand in Ohm addiert sich. Ohm ist die Einheit,) Tj ET\n' +
               'BT /F1 14 Tf 50 700 Td (benannt nach Georg Simon Ohm.) Tj ET\n' +
               'BT /F1 12 Tf 50 650 Td (Weiter zu Seite 2  |  Mehr im Netz) Tj ET\n';
    objs.push('<< /Length ' + s1.length + ' >>\nstream\n' + s1 + 'endstream');
    objs.push('<< /Type /Page /Parent 1 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 2 0 R >> >> /Contents 3 0 R /Annots [7 0 R 8 0 R] >>');
    const s2 = 'BT /F1 24 Tf 50 770 Td (Kapitel 2: Parallelschaltung) Tj ET\n';
    objs.push('<< /Length ' + s2.length + ' >>\nstream\n' + s2 + 'endstream');
    objs.push('<< /Type /Page /Parent 1 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 2 0 R >> >> /Contents 5 0 R >>');
    objs.push('<< /Type /Annot /Subtype /Link /Rect [160 640 250 665] /Border [0 0 0] /A << /S /URI /URI (https://example.org/ohm) >> >>');
    objs.push('<< /Type /Annot /Subtype /Link /Rect [50 640 150 665] /Border [0 0 0] /Dest [6 0 R /XYZ 0 842 0] >>');
    objs.push('<< /Type /Catalog /Pages 1 0 R >>');
    let text = '%PDF-1.4\n'; const offsets: number[] = [];
    objs.forEach((obj, i) => { offsets.push(text.length); text += (i + 1) + ' 0 obj\n' + obj + '\nendobj\n'; });
    const xref = text.length;
    text += 'xref\n0 ' + (objs.length + 1) + '\n0000000000 65535 f \n' + offsets.map(n => String(n).padStart(10, '0') + ' 00000 n \n').join('');
    text += 'trailer\n<< /Size ' + (objs.length + 1) + ' /Root ' + objs.length + ' 0 R >>\nstartxref\n' + xref + '\n%%EOF';
    const bytes = new TextEncoder().encode(text);
    const seite = Store.addPage(null, { text: 'Elektrotechnik, Skript', icon: '📕' });
    await PdfEinlesen.alsSeiten(new File([bytes], 'skript.pdf', { type: 'application/pdf' }), seite.id, { anordnung: 'untereinander', ueberGrenze: 'alle' });
    Store.updateBlock(seite.id, { dokumentModus: true });
    await Store.flush();
    App.oeffne(seite.id);
    await new Promise(r => setTimeout(r, 1500));
    document.querySelector<HTMLElement>('[data-document-action="read"]')?.click();
    document.querySelector<HTMLElement>('[data-document-action="find"]')?.click();
    await new Promise(r => setTimeout(r, 200));
    const feld = document.querySelector<HTMLInputElement>('.document-findbar input');
    if (feld) {
      feld.value = 'ohm';
      feld.dispatchEvent(new Event('input', { bubbles: true }));
      await new Promise(r => setTimeout(r, 900));
      feld.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      await new Promise(r => setTimeout(r, 500));
    }
  }
};

ANSICHTEN['lupe'] = {
  titel: 'Das Zoom-Fenster: die Seite gross, unten die Übersicht mit dem Band (E469)',
  bauen: async () => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    document.querySelector('.produkt-onboarding-lage')?.remove();
    document.getElementById('rg-willkommen')?.remove();
    document.getElementById('rg-einladung')?.remove();
    const seite = Store.addPage(null, { text: 'Mathe, Übungsblatt', icon: '📕' });
    const welle = (y: number) => { const pts: number[][] = []; for (let i = 0; i <= 40; i++) pts.push([90 + i * 10, y + Math.sin(i / 2.5) * 10]); return pts; };
    Store.addBlock(seite.id, 'blatt', { text: '', papier: 'kariert', blattBreite: 595.28, blattHoehe: 841.89, raumVersion: 1,
      marken: [{ id: 'l1', art: 'text', farbe: '#111111', breite: 2.4, point: [70, 80], text: 'Aufgabe 3: Löse die Gleichung 2x + 5 = 17', fontSize: 16 },
               { id: 'l2', art: 'stift', stil: 'fueller', farbe: '#2f7ed8', breite: 2.4, pts: welle(160) },
               { id: 'l3', art: 'stift', stil: 'fueller', farbe: '#2f7ed8', breite: 2.4, pts: welle(200) },
               { id: 'l4', art: 'rectangle', farbe: '#d64545', breite: 2.4, pts: [[80, 250], [300, 300]] }] });
    Store.updateBlock(seite.id, { dokumentModus: true });
    await Store.flush();
    App.oeffne(seite.id);
    await new Promise(r => setTimeout(r, 1200));
    document.querySelector<HTMLElement>('[data-document-action="annotate"]')?.click();
    await new Promise(r => setTimeout(r, 200));
    document.querySelector<HTMLElement>('[data-document-action="inspector"]')?.click();
    await new Promise(r => setTimeout(r, 300));
    document.querySelector<HTMLElement>('.document-inspector [data-document-action="lupe"]')?.click();
    await new Promise(r => setTimeout(r, 900));
    /* Ein Strich IM STREIFEN, damit auf dem Bild zu sehen ist, dass dort
       wirklich geschrieben wird — und dass er oben im Abbild ankommt. */
    const f = document.querySelector<HTMLElement>('.document-lupe-fenster');
    const flaeche = f?.querySelector<SVGElement>('svg.blatt-marken');
    if (f && flaeche) {
      const r = f.getBoundingClientRect();
      const ev = (typ: string, x: number, y: number, tasten: number) =>
        new PointerEvent(typ, { bubbles: true, cancelable: true, clientX: x, clientY: y,
          pointerId: 12, pointerType: 'mouse', isPrimary: true, button: 0, buttons: tasten, pressure: 0.6 });
      const y0 = r.top + r.height * 0.55;
      flaeche.dispatchEvent(ev('pointerdown', r.left + 60, y0, 1));
      for (let i = 1; i <= 24; i++)
        flaeche.dispatchEvent(ev('pointermove', r.left + 60 + i * 18, y0 + Math.sin(i / 2.2) * 16, 1));
      flaeche.dispatchEvent(ev('pointerup', r.left + 60 + 24 * 18, y0, 0));
      await new Promise(r2 => setTimeout(r2, 600));
    }
  }
};

ANSICHTEN['willkommen'] = {
  titel: 'Willkommen: Rauschtextur im Kopf (E462)',
  bauen: async () => {
    Store.setMeta('rundgangGesehen', false);
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    document.querySelector('.produkt-onboarding-lage')?.remove();
    Rundgang.willkommen();
    await new Promise(r => setTimeout(r, 700));
  }
};

ANSICHTEN['staffelei'] = {
  titel: 'Die Staffelei: hell und dunkel als Bild (E462)',
  bauen: async () => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    document.querySelector('.produkt-onboarding-lage')?.remove();
    document.getElementById('rg-willkommen')?.remove();
    document.getElementById('rg-einladung')?.remove();
    Aussehen.dialog();
    await new Promise(r => setTimeout(r, 900));
  },
  /* Einmal drücken: dann steht die Skizze (Tag) da, und der Pinsel ist
     zurückgefahren. Das erste Bild zeigte nur die Nacht. */
  dann: async () => {
    document.querySelector<HTMLElement>('.ru-staff')?.click();
    await new Promise(r => setTimeout(r, 900));
  }
};

ANSICHTEN['schalter'] = {
  titel: 'Der Schalter mit dem Verlauf der Vorgabe (E462)',
  bauen: async () => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    document.querySelector('.produkt-onboarding-lage')?.remove();
    document.getElementById('rg-willkommen')?.remove();
    document.getElementById('rg-einladung')?.remove();
    Einstellungen.oeffne();
    await new Promise(r => setTimeout(r, 900));
  }
};

/* --- Die vier Lader (E461) -----------------------------------------------
   Zu sehen sind alle vier nebeneinander, mit echten Werten: der flüssige
   Ring bei 42 %, die Sterne, das Wort „Abgleich", die Presse. Ihre echten
   Orte lassen sich nicht fotografieren — ein Modell-Download dauert
   Minuten, ein Auftrag braucht ein PDF, der Abgleich einen Server. Was
   das Bild beantwortet, ist die Frage, die es beantworten kann: sehen die
   vier aus wie vier Auskünfte oder wie viermal dasselbe? */
ANSICHTEN['lader'] = {
  titel: 'Die vier Lader: ein Bild je Sorte Auskunft (E461)',
  bauen: async () => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    document.querySelector('.produkt-onboarding-lage')?.remove();
    document.getElementById('rg-willkommen')?.remove();
    document.getElementById('rg-einladung')?.remove();
    await new Promise(r => setTimeout(r, 300));
    const platz = document.createElement('div');
    /* NEBENEINANDER, ABER JEDER MIT PLATZ. Beim ersten Bild quetschte die
       Reihe jeden Satz auf 60 px, und „Abgleich läuft …" stand in drei
       Zeilen — das sagt etwas über meine Probe, nicht über den Lader. */
    platz.style.cssText = 'position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);' +
      'z-index:9000;display:grid;grid-template-columns:repeat(2,minmax(240px,1fr));' +
      'gap:26px 34px;align-items:center;padding:28px 32px;' +
      'background:var(--bg-card);border:1px solid var(--line);border-radius:16px;' +
      'box-shadow:var(--shadow)';
    document.body.append(platz);
    platz.append(Lader.bauen({ art: 'fluss', anteil: 0.42, text: 'Modell wird geladen …' }).element);
    platz.append(Lader.bauen({ art: 'sterne', text: 'Bilder werden gelesen' }).element);
    platz.append(Lader.bauen({ art: 'wort', wort: 'Abgleich', text: 'Abgleich läuft …' }).element);
    platz.append(Lader.bauen({ art: 'presse', text: 'Seite 7 von 14' }).element);
    await new Promise(r => setTimeout(r, 600));
  }
};

/* --- Das Merkzeichen (E460) ----------------------------------------------
   Zu sehen: derselbe Merker zweimal — gefüllt in der Kopfleiste einer
   gemerkten Seite, offen daneben. Vorher war das in der Kopfleiste ein
   SVG mit einer Klasse und im Heft ein „★" aus der Schrift. */
ANSICHTEN['merkzeichen'] = {
  titel: 'Der Merker: ein Zeichen für „gemerkt" (E460)',
  bauen: async () => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    document.querySelector('.produkt-onboarding-lage')?.remove();
    document.getElementById('rg-willkommen')?.remove();
    document.getElementById('rg-einladung')?.remove();
    const p = Store.addPage(null, { text: 'Formelsammlung Elektrotechnik', icon: '⚡' });
    Store.updateBlock(p.id, { favorite: true });
    Store.addBlock(p.id, 'h2', { text: 'Ohmsches Gesetz' });
    Store.addBlock(p.id, 'text', { text: 'U = R · I, und daraus folgt alles Weitere.' });
    await Store.flush();
    App.oeffne(p.id);
    await new Promise(r => setTimeout(r, 800));
  }
};

/* --- Die Ordnerkarte (E459) ----------------------------------------------
   Zu sehen: der Blick in ein Fach — fünf echte Kinder fächern heraus, jedes
   mit seinem Namen und seiner Art, der Zähler nennt die echte Zahl. Das
   Menü wird nicht geklickt, sondern die Karte direkt gestellt: ein Menü im
   Bild verdeckt genau das, was zu sehen sein soll. */
ANSICHTEN['ordnerkarte'] = {
  titel: 'Die Ordnerkarte: der Blick ins Fach (E459)',
  bauen: async () => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    document.querySelector('.produkt-onboarding-lage')?.remove();
    document.getElementById('rg-willkommen')?.remove();
    document.getElementById('rg-einladung')?.remove();
    const fach = Store.addPage(null, { text: 'Elektrotechnik', icon: '⚡' });
    Store.updateBlock(fach.id, { heftArt: 'fach' });
    ['Kapitel 2 — Spannung und Strom', 'Formelsammlung', 'Prüfung Februar',
     'Messprotokoll 14.03.', 'Notizen Vorlesung', 'Altklausuren']
      .forEach(t => Store.addPage(fach.id, { text: t }));
    const unter = Store.addPage(fach.id, { text: 'Laborberichte' });
    Store.updateBlock(unter.id, { heftArt: 'fach' });
    Store.addPage(unter.id, { text: 'Versuch 3 — Widerstandsmessung' });
    await Store.flush();
    Bibliothek.oeffne();
    await new Promise(r => setTimeout(r, 700));
  },
  dann: async () => {
    const deckel = document.querySelector<HTMLElement>('.bib-deckel[data-art="ordner"]');
    deckel?.querySelector<HTMLElement>('.bib-deckel-mehr')?.click();
    await new Promise(r => setTimeout(r, 250));
    document.querySelector<HTMLElement>('.menu [data-a="blick"]')?.click();
    await new Promise(r => setTimeout(r, 900));
  }
};

/* --- Die Drucker-Karte (E458) --------------------------------------------
   Zu sehen: die Karte unten rechts ueber einer offenen Seite, im Zustand
   „rendern" — Blatt mit Druck, Lampe im Akzent, der Satz darunter. Der
   Zustand wird hier GESETZT, nicht gedruckt: ein Druckdialog laesst sich
   nicht fotografieren, die Karte schon. */
ANSICHTEN['drucker'] = {
  titel: 'Die Drucker-Karte: was der Druckauftrag gerade tut (E458)',
  bauen: async () => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    document.querySelector('.produkt-onboarding-lage')?.remove();
    document.getElementById('rg-willkommen')?.remove();
    document.getElementById('rg-einladung')?.remove();
    const p = Store.addPage(null, { text: 'Elektrotechnik – Kapitel 2', icon: '⚡' });
    Store.addBlock(p.id, 'h2', { text: 'Spannung, Strom und Widerstand' });
    Store.addBlock(p.id, 'text', { text: 'U = R · I — die Grundgleichung, aus der alles Weitere folgt.' });
    await Store.flush();
    App.oeffne(p.id);
    await new Promise(r => setTimeout(r, 600));
    Drucker.zeigen().setzen('rendern');
    await new Promise(r => setTimeout(r, 500));
  }
};

/* --- Die Befehlspalette (E400) -------------------------------------------
   Zu sehen ist zweierlei: dass die Liste bei 60 Zeilen aufhört, und dass sie
   das SAGT statt so zu tun, als wäre sie vollständig. Ohne Eingabe, denn nur
   dann ist überhaupt etwas abgeschnitten. */
ANSICHTEN['palette'] = {
  titel: 'Die Befehlspalette — 60 Zeilen, und der Rest sagt Bescheid (E400)',
  bauen: async () => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    document.querySelector('.produkt-onboarding-lage')?.remove();
    document.getElementById('rg-willkommen')?.remove();
    document.getElementById('rg-einladung')?.remove();
    await new Promise(r => setTimeout(r, 300));
  },
  dann: async () => {
    document.dispatchEvent(new KeyboardEvent('keydown',
      { key: 'K', ctrlKey: true, shiftKey: true, bubbles: true }));
    await new Promise(r => setTimeout(r, 600));
    /* Bis ans Ende rollen — dort steht die Zeile, um die es geht. */
    const res = document.querySelector('#cr');
    if (res) res.scrollTop = res.scrollHeight;
    await new Promise(r => setTimeout(r, 400));
  }
};

/* --- Palette mit Gedächtnis (E401) ---------------------------------------
   Drei Dinge müssen auf dem Bild stehen: die Überschrift „Angeheftet", die
   Überschrift „Zuletzt" darunter, und der goldene Stern an den angehefteten
   Zeilen. Der Merker wird vorher gesetzt — sonst müsste das Bild erst fünf
   Befehle ausführen, und dann stünde etwas anderes im Vordergrund. */
/* --- Der Favoritenblock, der vier Bögen lang leer war (E402) --------------
   Zu sehen ist eine Überschrift, die es vorher nie gab: „Favoriten". Der
   Filter fragte `b.fav`, das Feld heisst `favorite` — und weil ein leerer
   Abschnitt ganz weggelassen wird, fehlte nicht einmal ein Hinweis. */
ANSICHTEN['seitenfavoriten'] = {
  titel: 'Der Favoritenblock, der immer leer war (E402)',
  bauen: async () => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    document.querySelector('.produkt-onboarding-lage')?.remove();
    document.getElementById('rg-willkommen')?.remove();
    document.getElementById('rg-einladung')?.remove();
    const a = Store.addPage(null, { text: 'Formelsammlung Elektrotechnik', icon: '⚡' });
    Store.updateBlock(a.id, { favorite: true });
    const b = Store.addPage(null, { text: 'Prüfung Februar', icon: '📝' });
    Store.updateBlock(b.id, { favorite: true });
    Store.addPage(null, { text: 'Notizen vom Montag', icon: '📄' });
    await Store.flush();
    Ansichten.seiten();
    await new Promise(r => setTimeout(r, 900));
  }
};

ANSICHTEN['palettegemerkt'] = {
  titel: 'Die Palette merkt sich, was du brauchst (E401)',
  bauen: async () => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    document.querySelector('.produkt-onboarding-lage')?.remove();
    document.getElementById('rg-willkommen')?.remove();
    document.getElementById('rg-einladung')?.remove();
    Store.setMeta('paletteFest', ['Papierkorb', 'Tastenkürzel anzeigen']);
    /* Echte Befehlsnamen — beim ersten Bild standen hier zwei erfundene,
       und die Absicherung liess sie still fallen. */
    Store.setMeta('paletteZuletzt', ['Suchen', 'Lernpfad', 'Neue Seite']);
    await new Promise(r => setTimeout(r, 300));
  },
  dann: async () => {
    document.dispatchEvent(new KeyboardEvent('keydown',
      { key: 'K', ctrlKey: true, shiftKey: true, bubbles: true }));
    await new Promise(r => setTimeout(r, 700));
  }
};

ANSICHTEN['dokumenteinzel'] = {
  titel: 'Einzelseite statt Rolle — der Schalter im Inspector (E398)',
  bauen: ANSICHTEN['dokument']!.bauen,
  dann: async () => {
    /* NUR ZWEI KLICKS. Beim ersten Versuch standen hier drei — Inspector auf,
       umschalten, Inspector „wieder" auf — und das Bild zeigte ihn ZU: der
       Zustand überlebt den Neuaufbau (`state.inspectorOpen`), der dritte
       Klick hat ihn also geschlossen. Auf dem Bild gesehen, nicht im Code. */
    document.querySelector<HTMLElement>('[data-document-action="inspector"]')?.click();
    await new Promise(r => setTimeout(r, 500));
    document.querySelector<HTMLElement>('[data-document-action="lauf"]')?.click();
    await new Promise(r => setTimeout(r, 900));
    /* AM TELEFON WIEDER ZU. Dort ist der Inspector eine Überlagerung über
       dem ganzen Bild — er verdeckt genau das, was er gerade verändert hat.
       Am Rechner steht er als Spalte daneben, und dann zeigt ein Bild beides
       auf einmal: den Schalter und die eine Seite. */
    if (window.innerWidth < 760) {
      document.querySelector<HTMLElement>('[data-document-action="inspector-close"]')?.click();
      await new Promise(r => setTimeout(r, 600));
    }
  }
};


/* ========================================================================*/
/* ==========================================================================
 * DIE DREIZEHN ANSICHTEN EINER DATENBANK (E409)
 * --------------------------------------------------------------------------
 * Ein Eintrag je Ansichtsart, alle mit DERSELBEN Datenbank: neun Zeilen mit
 * Status, Auswahl, Mehrfachauswahl, Anfang und Ende, Zahl, Fortschritt,
 * Bewertung, Person, Ort, Haken und einem echten Bild — also genau die
 * Werte, an denen eine Ansicht etwas zu zeigen hat. Was hier fehlt, fehlt
 * auf dem Bild, und dann weiss man wenigstens, dass es fehlt.
 *
 * Die Einträge stehen UNTER dem Katalog, weil sie erzeugt werden: `bauen`
 * wird in die Seite hineingereicht und dort ausgewertet, ein Verschluss über
 * eine Node-Variable überlebt das nicht. Die Ansichtsart steht deshalb als
 * Wortlaut im Funktionstext — `new Function` baut ihn, einmal je Ansicht.
 * ========================================================================*/
const DB_ANSICHTEN = ['table', 'raster', 'board', 'timeline', 'calendar', 'list',
  'gallery', 'chart', 'feed', 'map', 'dashboard', 'pivot', 'form'];

const dbAufbau = (layout: string): string => `return (async () => {
  const w = window;
  Store.setMeta('rundgangGesehen', true);
  document.querySelector('.produkt-onboarding-lage')?.remove();
  document.getElementById('rg-willkommen')?.remove();
  document.getElementById('rg-einladung')?.remove();

  /* Ein gemaltes Bild als Anhang — echte Bytes, damit Galerie und Board
     wirklich ein Bild finden und nicht nur einen Platzhalter. */
  const male = (text, farbe) => {
    const c = document.createElement('canvas');
    c.width = 480; c.height = 300;
    const g = c.getContext('2d');
    g.fillStyle = farbe; g.fillRect(0, 0, 480, 300);
    g.fillStyle = 'rgba(255,255,255,.18)';
    for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(80 + i * 70, 150 + (i % 2) * 40, 60, 0, 7); g.fill(); }
    g.fillStyle = '#fff'; g.font = 'bold 30px sans-serif'; g.fillText(text, 26, 260);
    return new Promise(r => c.toBlob(b => r(b), 'image/png'));
  };

  const seite = Store.addPage(null, { text: 'Projekte 2026', icon: '📋' });
  const { block, collectionId } = Store.addDatabase(seite.id, 'Projekte 2026', {
    titel:   { name: 'Projekt',   type: 'title' },
    status:  { name: 'Status',    type: 'status',
               options: [{ name: 'Offen', color: 'gray' }, { name: 'Läuft', color: 'blue' },
                         { name: 'Prüfung', color: 'orange' }, { name: 'Fertig', color: 'green' }] },
    bereich: { name: 'Bereich',   type: 'select',
               options: [{ name: 'Elektro', color: 'yellow' }, { name: 'Bericht', color: 'purple' },
                         { name: 'Messung', color: 'red' }] },
    tags:    { name: 'Schlagworte', type: 'multi',
               options: [{ name: 'Schule', color: 'blue' }, { name: 'Abgabe', color: 'red' },
                         { name: 'Team', color: 'green' }] },
    anfang:  { name: 'Anfang',    type: 'date' },
    ende:    { name: 'Ende',      type: 'date' },
    kosten:  { name: 'Kosten',    type: 'number', einheit: 'CHF' },
    stand:   { name: 'Stand',     type: 'prozent' },
    wert:    { name: 'Bewertung', type: 'sterne' },
    wer:     { name: 'Wer',       type: 'person' },
    ort:     { name: 'Ort',       type: 'place' },
    fertig:  { name: 'Erledigt',  type: 'checkbox' },
    bild:    { name: 'Bild',      type: 'files' }
  }, 'table');

  const zeilen = [
    ['Schaltplan Werkstatt',  'Läuft',   'Elektro', ['Schule','Team'],  '2026-09-01', '2026-09-12',  420,  55, 4, 'Redur',  'Zürich',   false, '#2563eb'],
    ['Messprotokoll Motor',   'Offen',   'Messung', ['Schule'],         '2026-09-08', '2026-09-10',   85,   0, 3, 'Lina',   'Bern',     false, '#059669'],
    ['Bericht Kapitel 1',     'Fertig',  'Bericht', ['Abgabe'],         '2026-08-20', '2026-08-29',    0, 100, 5, 'Redur',  'Basel',    true,  '#b45309'],
    ['Bericht Kapitel 2',     'Prüfung', 'Bericht', ['Abgabe','Team'],  '2026-09-03', '2026-09-16',    0,  80, 4, 'Amir',   'Luzern',   false, '#7c3aed'],
    ['Steuerung Rolltor',     'Läuft',   'Elektro', ['Team'],           '2026-09-05', '2026-09-26', 1290,  35, 2, 'Lina',   'Winterthur', false, '#dc2626'],
    ['Isolationsmessung',     'Offen',   'Messung', [],                 '2026-09-15', '2026-09-15',   60,   0, 0, 'Amir',   'St. Gallen', false, '#0891b2'],
    ['Abgabe vorbereiten',    'Offen',   'Bericht', ['Abgabe'],         '2026-09-22', '2026-09-30',    0,  10, 3, 'Redur',  'Zürich',   false, '#4f46e5'],
    ['Verteiler beschriften', 'Fertig',  'Elektro', ['Schule'],         '2026-08-25', '2026-08-26',   35, 100, 5, 'Lina',   'Bern',     true,  '#16a34a'],
    ['Lastmessung Halle 3',   'Läuft',   'Messung', ['Team','Schule'],  '2026-09-09', '2026-09-19',  740,  60, 4, 'Amir',   'Chur',     false, '#ea580c']
  ];
  const ORTE = { 'Zürich': [47.3769, 8.5417], 'Bern': [46.948, 7.4474], 'Basel': [47.5596, 7.5886],
                 'Luzern': [47.0502, 8.3093], 'Winterthur': [47.4988, 8.7237], 'St. Gallen': [47.4245, 9.3767],
                 'Chur': [46.8508, 9.5320] };
  /* NICHT w als Name für die Bewertung: das verdeckt das w von oben, und
     w.Dateien wurde dadurch zu (4).Dateien. Und KEINE Schrägstriche als
     Anführung in diesem Kommentar — er steht in einem Template-Literal,
     und ein Gegenstrich darin beendet es. */
  for (const [t, st, ber, tags, a, e, k, pr, bew, wer, ort, fertig, farbe] of zeilen) {
    const r = Store.addRow(collectionId, { title: t });
    Store.setProp(r.id, 'status', st);
    Store.setProp(r.id, 'bereich', ber);
    Store.setProp(r.id, 'tags', tags);
    Store.setProp(r.id, 'anfang', a);
    Store.setProp(r.id, 'ende', e);
    Store.setProp(r.id, 'kosten', k);
    Store.setProp(r.id, 'stand', pr);
    Store.setProp(r.id, 'wert', bew);
    Store.setProp(r.id, 'wer', wer);
    Store.setProp(r.id, 'ort', { name: ort, lat: ORTE[ort][0], lon: ORTE[ort][1], voll: ort + ', Schweiz' });
    Store.setProp(r.id, 'fertig', fertig);
    const blob = await male(t, farbe);
    const datei = await w.Dateien.ablegen(blob, { name: t + '.png', blockId: r.id });
    Store.setProp(r.id, 'bild', [{ id: datei.id, name: datei.name, url: URL.createObjectURL(blob) }]);
  }

  const layout = '${layout}';
  let view = Store.getView(Store.getCollection(collectionId).viewIds[0]);
  if (layout !== 'table') view = Store.addView(collectionId, layout);
  Store.updateBlock(block.id, { aktiveView: view.id });
  await Store.flush();
  App.oeffne(seite.id);
  await new Promise(r => setTimeout(r, 1200));
})();`;

for (const l of DB_ANSICHTEN) {
  ANSICHTEN['db-' + l] = {
    titel: 'Datenbank als ' + l + ' (E409)',
    bauen: new Function(dbAufbau(l)) as () => Promise<void>
  };
}

/* --- Formen, Griffe und freie Verbindungen (E628) -------------------------
   Zu sehen ist das, was Redur bestellt hat, in einem Bild: sechs Formen an
   sechs Ästen, eine gestrichelte Verbindung quer durch die Karte — die,
   die der Baum nicht hergibt —, und die vier Griffe am gewählten Thema.

   Der gewählte Knoten wird nicht geklickt, sondern der Zeiger auf ihn
   gesetzt: ein Klick auf dem Telefon öffnet die Tastatur, und ein Bild mit
   halb verdeckter Karte zeigt nichts. */
ANSICHTEN['gkformen'] = {
  titel: 'Gedankenkarte: sechs Formen, freie Verbindungen, die vier Griffe (E628)',
  bauen: async () => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    document.querySelector('.produkt-onboarding-lage')?.remove();
    document.getElementById('rg-willkommen')?.remove();
    document.getElementById('rg-einladung')?.remove();
    const seite = Store.addPage(null, { text: 'Prüfungsplan', icon: '🧠' });
    const k = (id: string, text: string, eltern: string | null, rest: object = {}) =>
      ({ id, text, eltern, ...rest });
    Store.addBlock(seite.id, 'mindmap', {
      text: 'Gedankenkarte', hoehe: 520,
      karte: {
        aufbau: 'karte',
        knoten: [
          k('w', 'Prüfung Elektrotechnik', null),
          k('a', 'Grundlagen', 'w', { seite: 'rechts', farbe: '#d9534f' }),
            k('a1', 'Ohmsches Gesetz', 'a', { form: 'kasten' }),
            k('a2', 'Leistung und Arbeit', 'a'),
          k('b', 'Schutzmassnahmen', 'w', { seite: 'links', farbe: '#e08a2e', form: 'pille' }),
            k('b1', 'Schutzleiter', 'b'),
            k('b2', 'FI-Schalter', 'b', { form: 'ellipse' }),
          k('c', 'Messen', 'w', { seite: 'rechts', farbe: '#4a9d5f', form: 'sechseck' }),
            k('c1', 'Isolationswiderstand', 'c'),
          k('d', 'Schaltpläne lesen', 'w', { seite: 'links', farbe: '#2f8ab5', form: 'kasten' }),
            k('d1', 'Stromlaufplan', 'd'),
          k('e', 'Termine', 'w', { seite: 'rechts', farbe: '#7a5cc5', form: 'raute' }),
            k('e1', 'Prüfung am 8.', 'e')
        ],
        /* Genau das, was ein Baum nicht kann: „Messen" hängt an
           „Schutzmassnahmen", ohne dort zu wohnen. */
        verbindungen: [
          { id: 'v1', von: 'c', zu: 'b' },
          { id: 'v2', von: 'e1', zu: 'a1' }
        ]
      }
    });
    await Store.flush();
    App.oeffne(seite.id);
    await new Promise(r => setTimeout(r, 800));
    document.querySelector<HTMLElement>('.gk-kn[data-k="b"]')
      ?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    await new Promise(r => setTimeout(r, 400));
  }
};

/* Derselbe Aufbau, ein anderer Zustand: die Vorlagenliste offen. */
ANSICHTEN['gkvorlagen'] = {
  titel: 'Gedankenkarte: die sechs fertigen Vorlagen (E628)',
  bauen: ANSICHTEN['gkformen']!.bauen,
  dann: async () => {
    document.querySelector<HTMLElement>('.gk-leiste [data-a="vorlage"]')?.click();
    await new Promise(r => setTimeout(r, 400));
  }
};

/* WELCHE GERAETE EINEN ZEIGER HABEN (E617).
   Bis hierher stand zweimal `g !== 'rechner'` — einmal fuer „nur ein Thema"
   und einmal fuer „mit Beruehrung nachstellen". Solange es genau EIN
   Rechnergeraet gab, war das dasselbe; mit `breit` ist es das nicht mehr,
   und ein 1920er Bildschirm waere als Tastgeraet nachgestellt worden.
   Das ist genau der Fund aus L108, nur andersherum.

   `laptop` bleibt absichtlich draussen und behaelt sein bisheriges
   Verhalten: seine Bilder aendern sich damit nicht. Ob 1024 x 768 wirklich
   ein Tastgeraet ist, ist eine eigene Frage — siehe L184. */
const ZEIGER_GERAETE = new Set(['rechner', 'breit']);

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
      if (!ZEIGER_GERAETE.has(g) && thema === 'light') continue;

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
        ...(ZEIGER_GERAETE.has(g) ? {} : { isMobile: true, hasTouch: true })
      });
      await seite.goto(`http://localhost:${PORT}/index.html`);
      await seite.waitForFunction(
        () => typeof App !== 'undefined' && typeof Store !== 'undefined' &&
              (document.getElementById('tree')?.children.length || 0) > 0,
        null, { timeout: 30000 });
      await seite.evaluate((t: string) => document.documentElement.setAttribute('data-theme', t), thema);
      await seite.evaluate(ansicht.bauen);
      await seite.waitForTimeout(450);
      if (ansicht.dann) { await seite.evaluate(ansicht.dann); await seite.waitForTimeout(450); }

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
