/* Suite 172 — Die zwei Produktwelten tragen (E133)
 * ============================================================================
 * Der Auftrag verlangt unter §56 ausdrücklich Prüfungen für die grossen
 * Produktwege. Diese Suite ist das — und sie hat einen konkreten Anlass.
 *
 * Lernwelt, Arbeitswelt, Lebensbereiche, Produktwelten und die Einrichtung
 * der Hauptwelten lagen als rund 40 000 Zeilen im Verzeichnis und waren im
 * Browser NICHT VORHANDEN: ein Typfehler hatte `bauen:ts` abgebrochen, die
 * fünf `quell/*.js` fehlten, `index.html` lud sie trotzdem, und niemandem
 * fiel es auf (E132).
 *
 * Kein Prüflauf konnte es merken, weil keiner die Welten je geöffnet hat.
 * Genau das tut diese Suite jetzt.
 *
 * ─── KANN SIE ROT WERDEN? (§55.2) ───────────────────────────────────────────
 * Ja, und zwar am selben Fehler: verschwindet eine der fünf Dateien wieder,
 * sind `Produktwelten`, `Lernwelt` und `Lebensbereiche` undefined und §1
 * fällt sofort um. Die Regel „ein Objekt, viele Ansichten" (§51 des
 * Auftrags) misst §3 an Zählwerten vorher/nachher — legt eine Ansicht
 * heimlich eine Kopie an, steigt die Zahl.
 *
 *   node pruefungen/lauf/test206.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import type { Page } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
/* 8967 und nicht 8959, den test204 schon hat. Das ist kein Fehler, den ich
   behebe — ein Dutzend Suiten teilen sich Ports, und weil der Läufer sie
   nacheinander abarbeitet, geht das gut. Ein freier Port kostet aber nichts,
   und beim Nebeneinanderlaufen wäre er der Unterschied. */
const PORT = 8967;

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

const browser = await chromium.launch();
const fehler: string[] = [];

/** Eine frisch geladene Seite, ohne Rundgang und ohne Einrichtungsschirm. */
const seiteAuf = async (breite: number, hoehe: number): Promise<Page> => {
  const s = await browser.newPage({ viewport: { width: breite, height: hoehe } });
  s.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 140)));
  await s.goto(`http://localhost:${PORT}/index.html`);
  await s.waitForTimeout(2600);
  await s.evaluate(() => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelector('.produkt-onboarding-lage')?.remove();
    document.getElementById('rg-willkommen')?.remove();
    document.getElementById('rg-einladung')?.remove();
  });
  return s;
};

const seite = await seiteAuf(1300, 900);

/* ==========================================================================
 * §1 · Die Module sind überhaupt da
 * --------------------------------------------------------------------------
 * Der Punkt, an dem es gefehlt hat. Ein `<script>` auf eine Datei, die es
 * nicht gibt, ist im Browser kein Fehler — die Seite lädt weiter, und das
 * Modul ist einfach nicht da. Deshalb steht das hier ganz vorn.
 * ========================================================================*/
console.log('\n1 · Die Module sind überhaupt da');

const da = await seite.evaluate(() => ({
  produktwelten: typeof (globalThis as any).Produktwelten,
  lernwelt: typeof (globalThis as any).Lernwelt,
  arbeitswelt: typeof (globalThis as any).Arbeitswelt,
  lebensbereiche: typeof (globalThis as any).Lebensbereiche,
  onboarding: typeof (globalThis as any).ProduktOnboarding,
}));
for (const [name, art] of Object.entries(da)) gleich(name + ' ist geladen', art, 'object');

const geladen = await seite.evaluate(() =>
  [...document.querySelectorAll('script[src]')].map(s => (s as HTMLScriptElement).src));
p('index.html lädt die fünf neuen Module',
  ['lebensbereiche', 'lernwelt', 'arbeitswelt', 'produkt_onboarding', 'produktwelten']
    .every(n => geladen.some(s => s.includes(n))));

/* ==========================================================================
 * §2 · Beide Hauptwelten öffnen wirklich
 * ========================================================================*/
console.log('\n2 · Beide Hauptwelten öffnen wirklich');

const welt = async (fn: string, arg: string): Promise<Record<string, unknown>> =>
  seite.evaluate(async (a: { fn: string; arg: string }) => {
    const P = (globalThis as any).Produktwelten;
    (P as any)[a.fn](a.arg);
    await new Promise(r => setTimeout(r, 900));
    /* DIESELBE WURZEL FÜR BEIDES. Der erste Entwurf las `hatInhalt` aus
       `.lernwelt` und den Text aus `#inhalt` — und `#inhalt` ist gar nicht
       der Ort, an dem die Lernwelt zeichnet. Der Punkt war rot, obwohl das
       Datum gut sichtbar auf dem Bildschirm stand. Eine Prüfung, die am
       falschen Element misst, ist schlimmer als keine. */
    const wurzel = (document.querySelector('.lernwelt, .arbeitswelt') ||
                    document.getElementById('inhalt')) as HTMLElement | null;
    const text = (wurzel?.textContent || '').replace(/\s+/g, ' ').trim();
    /* DER WOCHENTAG WIRD AM GANZEN TEXT GESUCHT, NICHT AN DEN ERSTEN 200
       ZEICHEN. Seit E137 steht die Einrichtung als Karte oben auf dem
       Heute-Bild; damit rutschte die Begrüssung aus dem Ausschnitt, und die
       Prüfung meldete einen Fehler, der auf dem Bildschirm nicht existierte.
       Der Ausschnitt ist zum Anschauen da, nicht zum Messen. */
    return {
      aktiv: P.aktiv?.() ?? null,
      text: text.slice(0, 200),
      hatInhalt: text.length > 40,
      wochentag: /Montag|Dienstag|Mittwoch|Donnerstag|Freitag|Samstag|Sonntag/.test(text)
    };
  }, { fn, arg });

const heute = await welt('lernen', 'heute');
p('„Lernen & Alltag / Heute" zeigt etwas', heute.hatInhalt, String(heute.text).slice(0, 90));
p('… und begrüsst mit einem Datum', heute.wochentag, String(heute.text).slice(0, 90));

const lernen = await welt('lernen', 'lernen');
p('„Lernen" zeigt etwas', lernen.hatInhalt, String(lernen.text).slice(0, 90));

const arbeit = await welt('workspace', 'start');
p('„Workspace" zeigt etwas', arbeit.hatInhalt, String(arbeit.text).slice(0, 90));

/* ==========================================================================
 * §3 · Ein Objekt, viele Ansichten — und KEINE Kopie (§51 des Auftrags)
 * --------------------------------------------------------------------------
 * Die wichtigste Produktregel. Geprüft wird sie nicht an Worten, sondern an
 * Zählwerten: eine Datei anlegen, danach durch alle Welten laufen und
 * nachsehen, ob Blöcke, Sammlungen oder Dateien mehr geworden sind.
 * ========================================================================*/
console.log('\n3 · Ein Objekt, viele Ansichten — und keine Kopie');

const kopien = await seite.evaluate(async () => {
  const zaehl = async (): Promise<Record<string, number>> => {
    const dateien = await Store.dateiAlle();
    let stuecke = 0;
    for (const d of dateien) stuecke += (await Store.stueckeVon(d.id)).length;
    return {
      bloecke: Object.keys(Store.cache.blocks).length,
      sammlungen: Object.keys(Store.cache.collections).length,
      dateien: dateien.length,
      stuecke,
    };
  };

  const s = Store.addPage(null, { text: 'Kapitel 4 Lampenschaltungen' });
  const fb = Store.addBlock(s.id, 'file', { text: 'lampen.pdf' });
  const satz = await Dateien.ablegen(
    new File([new Uint8Array(400)], 'lampen.pdf', { type: 'application/pdf' }),
    { blockId: fb.id });
  Store.updateBlock(fb.id, { dateiId: satz.id });
  await Store.settled();

  const vorher = await zaehl();

  const P = (globalThis as any).Produktwelten;
  for (const [fn, arg] of [['lernen', 'heute'], ['lernen', 'lernen'], ['workspace', 'start']] as const) {
    (P as any)[fn](arg);
    await new Promise(r => setTimeout(r, 500));
  }
  P.bibliothek(); await new Promise(r => setTimeout(r, 500));
  P.aufgaben();   await new Promise(r => setTimeout(r, 500));

  const nachher = await zaehl();
  return { vorher, nachher, dateiId: satz.id };
});

gleich('Die Zahl der Blöcke ändert sich nicht', kopien.nachher.bloecke, kopien.vorher.bloecke);
gleich('Die Zahl der Sammlungen auch nicht', kopien.nachher.sammlungen, kopien.vorher.sammlungen);
gleich('Und die Datei bleibt genau eine', kopien.nachher.dateien, kopien.vorher.dateien);
gleich('Mit genau ihren Stücken', kopien.nachher.stuecke, kopien.vorher.stuecke);

/* ==========================================================================
 * §4 · Die Datei ist danach noch dieselbe Datei
 * --------------------------------------------------------------------------
 * Zählwerte allein genügen nicht: eine Ansicht könnte eine Datei ersetzen,
 * statt eine dazuzulegen. Also wird die Kennung nachgesehen.
 * ========================================================================*/
console.log('\n4 · Die Datei ist danach noch dieselbe Datei');

const dieselbe = await seite.evaluate(async (id: string) => {
  const satz = await Store.dateiHolen(id);
  const blob = await Dateien.alsBlob(id);
  return { da: !!satz, name: satz?.name ?? '', groesse: blob ? blob.size : -1 };
}, kopien.dateiId as string);

gleich('Sie trägt noch ihre Kennung', dieselbe.da, true);
gleich('… und ihren Namen', dieselbe.name, 'lampen.pdf');
gleich('… und ihre 400 Bytes', dieselbe.groesse, 400);

/* ==========================================================================
 * §5 · Neu laden behält den Bestand
 * ========================================================================*/
console.log('\n5 · Neu laden behält den Bestand');

await seite.reload();
await seite.waitForTimeout(2600);
/* Nach dem Neuladen ist die Einrichtung der Hauptwelten wieder da —
   sie erscheint 300 ms nach dem Start und fängt Klicks ab (E132). */
await seite.evaluate(() => {
  Store.setMeta('rundgangGesehen', true);
  document.querySelector('.produkt-onboarding-lage')?.remove();
});
const nachNeu = await seite.evaluate(async (id: string) => ({
  seite: Store.rootPages().some((x: any) => x.text === 'Kapitel 4 Lampenschaltungen'),
  datei: !!(await Store.dateiHolen(id)),
  module: typeof (globalThis as any).Produktwelten,
}), kopien.dateiId as string);

gleich('Die Seite ist nach dem Neuladen da', nachNeu.seite, true);
gleich('Die Datei auch', nachNeu.datei, true);
gleich('Und die Module sind wieder geladen', nachNeu.module, 'object');

/* ==========================================================================
 * §6 · Am Telefon läuft nichts über den Rand (§30/§34 des Auftrags)
 * ========================================================================*/
console.log('\n6 · Am Telefon läuft nichts über den Rand');

for (const [breite, hoehe, name] of
     [[390, 844, 'iPhone 13 mini'], [428, 926, 'iPhone 13 Pro Max'], [760, 900, 'Tablet']] as
     [number, number, string][]) {
  const klein = await seiteAuf(breite, hoehe);
  const masse = await klein.evaluate(async () => {
    const P = (globalThis as any).Produktwelten;
    const raus: Record<string, number> = {};
    for (const [fn, arg] of [['lernen', 'heute'], ['lernen', 'lernen'], ['workspace', 'start']] as const) {
      (P as any)[fn](arg);
      await new Promise(r => setTimeout(r, 700));
      raus[fn + ':' + arg] = document.documentElement.scrollWidth -
                             document.documentElement.clientWidth;
    }
    return raus;
  });
  for (const [wo, ueber] of Object.entries(masse))
    p(`${name} · ${wo}: kein waagerechter Überlauf`, ueber <= 0, `${ueber} px zu breit`);
  await klein.close();
}

/* ==========================================================================
 * §7 · Am Rechner steht jede Reiterbeschriftung im Bild
 * --------------------------------------------------------------------------
 * Mit Augen gesehen (§55): auf dem Heute-Bild hing „Schule / Ausbildung"
 * halb ausserhalb der Leiste, und Uni, Arbeit und Fortschritt waren gar
 * nicht zu ahnen. Die Leiste kann gescrollt werden — nur zeigt das nichts
 * an: kein Schatten, kein Pfeil, keine angeschnittene Beschriftung. Neun
 * Reiter brauchen 1016 px, die Leiste hatte 706.
 *
 * Gemessen wird nicht „ist scrollbar", sondern „steht drin": jeder Knopf
 * muss mit seiner ganzen Breite innerhalb der Leiste liegen.
 * ========================================================================*/
console.log('\n7 · Am Rechner steht jede Reiterbeschriftung im Bild');

await seite.evaluate(() => (globalThis as any).Produktwelten.lernen('heute'));
await seite.waitForTimeout(900);
const reiter = await seite.evaluate(() => {
  const leiste = document.querySelector('.lw-nav') as HTMLElement | null;
  if (!leiste) return null;
  const kasten = leiste.getBoundingClientRect();
  const knoepfe = [...leiste.querySelectorAll('button')].map(k => {
    const r = k.getBoundingClientRect();
    return {
      text: (k.textContent || '').trim().slice(0, 24),
      drin: r.left >= kasten.left - 1 && r.right <= kasten.right + 1,
    };
  });
  return { anzahl: knoepfe.length, draussen: knoepfe.filter(k => !k.drin).map(k => k.text) };
});

p('Die Reiterleiste ist da', !!reiter, 'keine .lw-nav gefunden');
if (reiter) {
  /* VIER UND NICHT NEUN. Seit die Leiste gruppiert ist (E164 — „Lernen"
     fasst Lernen, Lernweg, Fehler und Fortschritt zusammen, „Wo du lernst"
     fasst Schule, Uni und Arbeit zusammen), sind es vier Reiter mit einer
     zweiten Reihe darunter. Die Neun stammt aus der Zeit davor, und der
     Punkt war seither rot: er steckt in keiner der Suiten, die man nach
     einer Änderung einzeln startet, und fiel erst beim vollen Durchlauf
     auf. Nachgemessen ist er auch auf dem Stand vor dem Menüband rot.

     Die Zahl bleibt ausgeschrieben und wird nicht aus `REITER` gelesen:
     dieser Punkt soll ja gerade merken, wenn ein Reiter verschwindet. */
  gleich('Sie hat vier Reiter mit zweiter Reihe darunter', reiter.anzahl, 4);
  gleich('Und keiner steht ausserhalb', reiter.draussen, []);
}

/* ==========================================================================
 * §8 · „Ausbildung einrichten" legt wirklich etwas an
 * --------------------------------------------------------------------------
 * Der Reiter „Schule / Ausbildung" zeigt im frischen Bestand nur ein
 * Leerbild mit einem Knopf. Das ist ehrlich — aber nur, wenn der Knopf hält,
 * was er verspricht: „Die additive Vorlage erstellt normale Seiten und
 * Datenbanken." Additiv heisst: dazu, nicht anstelle.
 * ========================================================================*/
console.log('\n8 · „Ausbildung einrichten" legt wirklich etwas an');

const ausbildung = await seite.evaluate(async () => {
  (globalThis as any).Produktwelten.lernen('schule');
  await new Promise(r => setTimeout(r, 900));
  const wurzel = document.querySelector('.lernwelt') as HTMLElement;
  const vorher = {
    bloecke: Object.keys(Store.cache.blocks).length,
    sammlungen: Object.keys(Store.cache.collections).length,
    seiten: Store.rootPages().length,
  };
  const knopf = wurzel.querySelector('[data-lw-action="school-install"]') as HTMLElement | null;
  const beschriftung = knopf?.textContent?.trim() ?? '(kein Knopf)';
  knopf?.click();
  await new Promise(r => setTimeout(r, 2500));
  const text = (wurzel.textContent || '').replace(/\s+/g, ' ');
  return {
    beschriftung,
    vorher,
    nachher: {
      bloecke: Object.keys(Store.cache.blocks).length,
      sammlungen: Object.keys(Store.cache.collections).length,
      seiten: Store.rootPages().length,
    },
    nochLeer: /noch nicht eingerichtet/.test(text),
    text: text.slice(text.indexOf('Fortschritt') + 11, text.indexOf('Fortschritt') + 160),
  };
});

gleich('Der Knopf heisst „Ausbildung einrichten"', ausbildung.beschriftung, 'Ausbildung einrichten');
p('Danach ist der Bestand grösser — es wurde wirklich etwas angelegt',
  ausbildung.nachher.bloecke > ausbildung.vorher.bloecke,
  `${ausbildung.vorher.bloecke} → ${ausbildung.nachher.bloecke} Blöcke`);
p('… darunter neue Datenbanken für Fächer, Prüfungen, Noten',
  ausbildung.nachher.sammlungen > ausbildung.vorher.sammlungen,
  `${ausbildung.vorher.sammlungen} → ${ausbildung.nachher.sammlungen} Sammlungen`);
p('ADDITIV: die vorhandenen Seiten sind noch da',
  ausbildung.nachher.seiten >= ausbildung.vorher.seiten,
  `${ausbildung.vorher.seiten} → ${ausbildung.nachher.seiten} oberste Seiten`);
gleich('Und das Leerbild ist weg', ausbildung.nochLeer, false);
p('Stattdessen steht dort die Ausbildungssicht',
  /Ausbildung/.test(ausbildung.text) && !/noch nicht/.test(ausbildung.text),
  ausbildung.text.slice(0, 90));

/* ==========================================================================
 * §9 · Die Schnellaktionen des Workspace legen wirklich etwas an
 * --------------------------------------------------------------------------
 * „Alle Aktionen schreiben über die bestehenden Redion-Dienste in denselben
 * Bestand", sagt die Übersicht über sich selbst. Geprüft wird das am
 * Whiteboard (Auftrag §22): ein Klick, ein Block mehr, und er zeichnet.
 * ========================================================================*/
console.log('\n9 · Die Schnellaktionen des Workspace legen wirklich etwas an');

const schnell = await seite.evaluate(async () => {
  (globalThis as any).Produktwelten.workspace('start');
  await new Promise(r => setTimeout(r, 1000));
  const wurzel = document.querySelector('.arbeitswelt') as HTMLElement | null;
  if (!wurzel) return null;
  const zaehle = () => Object.values<any>(Store.cache.blocks)
    .filter(b => b.type === 'whiteboard' && b.alive).length;
  const vorher = zaehle();
  /* DIE AKTION, NICHT DER REITER (E138). „Den ersten Knopf nehmen, auf dem
     Whiteboard steht" war eindeutig, solange es nur einen gab. Seit die
     Whiteboards einen eigenen Bereich haben, steht der REITER weiter oben
     im Baum — ein Klick darauf wechselt die Ansicht und legt nichts an, und
     die Prüfung meldete „0 → 0" für einen Knopf, der genau das tat, was auf
     ihm steht. Die Schnellaktion trägt eine eigene Kennung. */
  const knopf = wurzel.querySelector('[data-aw-action="new-whiteboard"]') as HTMLElement | null;
  knopf?.click();
  await new Promise(r => setTimeout(r, 1600));
  return {
    beschriftung: knopf?.textContent?.trim() ?? '(keine Schnellaktion)',
    vorher, nachher: zaehle(),
    gezeichnet: document.querySelectorAll('[class*="whiteboard"], .wb').length,
  };
});

p('Die Workspace-Übersicht ist da', !!schnell, 'keine .arbeitswelt gefunden');
if (schnell) {
  p('Es gibt eine Schnellaktion „Whiteboard"',
    /Whiteboard/.test(schnell.beschriftung), schnell.beschriftung);
  p('Ein Klick legt einen Whiteboard-Block an',
    schnell.nachher > schnell.vorher, `${schnell.vorher} → ${schnell.nachher}`);
  p('Und er wird auch gezeichnet', schnell.gezeichnet > 0, String(schnell.gezeichnet));
}

/* ==========================================================================
 * §10 · Der alte Arbeitsweg lebt weiter
 * --------------------------------------------------------------------------
 * Zwei neue Hauptwelten dürfen das nicht kaputt machen, was Redion schon
 * konnte. Also: eine Seite anlegen, einen Block schreiben, nachlesen.
 * ========================================================================*/
console.log('\n10 · Der alte Arbeitsweg lebt weiter');

const alt = await seite.evaluate(async () => {
  const s = Store.addPage(null, { text: 'Ganz gewöhnliche Seite' });
  const b = Store.addBlock(s.id, 'text', { text: 'Ein Satz von Hand.' });
  await Store.flush();
  return {
    seiteDa: !!Store.getBlock(s.id),
    text: Store.getBlock(b.id)?.text ?? '',
    kinder: Store.getBlock(s.id)?.content?.length ?? -1,
  };
});
gleich('Eine neue Seite entsteht', alt.seiteDa, true);
gleich('Ihr Block trägt den Text', alt.text, 'Ein Satz von Hand.');
gleich('Und hängt an der Seite', alt.kinder, 1);

/* ==========================================================================
 * §11 · Die Befehlspalette führt zu den Welten UND legt an (E138, §29/§46)
 * --------------------------------------------------------------------------
 * §29 des Auftrags nennt acht Beispielsätze, die man tippen können soll.
 * Vier davon fanden nichts: „Neue Aufgabe", „PDF importieren", „Neue Karte",
 * „Schule öffnen". Die Wege dahinter gab es alle — sie standen nur nicht in
 * der Liste, in der man sie sucht.
 *
 * Diese Prüfung tippt jeden der acht Sätze und sieht nach, was oben steht.
 * Gegenprobe: mit den neuen Einträgen entfernt kamen für „Neue Aufgabe",
 * „Neue Lernkarte", „Neues Whiteboard" und „Aufnahme" gar keine Treffer,
 * für „Schule" stand „Sicherung laden" oben.
 * ========================================================================*/
console.log('\n11 · Die Befehlspalette führt zu den Welten und legt an');

/* MIT GRUPPE, NICHT NUR MIT WORT. Die Palette findet auch SEITEN, und §9
   legt weiter oben eine Seite namens „Neues Whiteboard" an — die Zeile
   „Neues Whiteboard" stand also auch dann da, als es den Befehl gar nicht
   gab. Gemessen in der Gegenprobe: fünf Punkte wurden rot, dieser eine
   blieb grün, obwohl er dasselbe prüfen sollte.
   Mit der Gruppe davor ist „Anlegen › Neues Whiteboard" etwas anderes als
   „Seiten › 📄 Neues Whiteboard". */
const paletteSucht = (frage: string): Promise<string[]> => seite.evaluate(async (q: string) => {
  document.querySelectorAll<HTMLElement>('.overlay').forEach(o => o.remove());
  Werkzeuge.palette(q);
  await new Promise(r => setTimeout(r, 380));
  const treffer: string[] = [];
  let gruppe = '?';
  [...(document.querySelector('.overlay .res')?.children || [])].forEach(kind => {
    if (kind.classList.contains('grp')) { gruppe = (kind.textContent || '').trim(); return; }
    if (kind.tagName === 'BUTTON')
      treffer.push(gruppe + ' › ' + (kind.textContent || '').replace(/\s+/g, ' ').trim());
  });
  document.querySelectorAll<HTMLElement>('.overlay').forEach(o => o.remove());
  return treffer;
}, frage);

for (const [frage, erwartet] of [
  ['Neue Seite', 'Anlegen › Neue Seite'],
  ['Neue Aufgabe', 'Anlegen › Neue Aufgabe'],
  ['Neue Lernkarte', 'Anlegen › Neue Lernkarte'],
  ['Neues Whiteboard', 'Anlegen › Neues Whiteboard'],
  ['PDF importieren', 'Anlegen › PDF oder Datei importieren'],
  ['Aufnahme', 'Anlegen › Aufnahme starten'],
  ['Schule', 'Navigation › Schule und Ausbildung öffnen'],
  ['Prüfungen', 'Navigation › Prüfungszentrum']
] as [string, string][]) {
  const treffer = await paletteSucht(frage);
  p(`„${frage}" findet „${erwartet}"`,
    treffer.slice(0, 4).some(zeile => zeile.includes(erwartet)),
    treffer.slice(0, 3).join(' | ') || '(nichts gefunden)');
}

/* Und einer davon wirklich ausgeführt — eine Liste, die nur aussieht wie
   eine Liste, wäre schlimmer als keine. */
const ausgefuehrt = await seite.evaluate(async () => {
  const zaehle = () => Object.values<any>(Store.cache.blocks)
    .filter(b => b.type === 'flashcard' && b.alive !== false).length;
  const vorher = zaehle();
  document.querySelectorAll<HTMLElement>('.overlay').forEach(o => o.remove());
  Werkzeuge.palette('Neue Lernkarte');
  await new Promise(r => setTimeout(r, 380));
  (document.querySelector('.overlay .res button') as HTMLElement | null)?.click();
  await new Promise(r => setTimeout(r, 800));
  return { vorher, nachher: zaehle() };
});
gleich('„Neue Lernkarte" legt wirklich eine an', ausgefuehrt.nachher, ausgefuehrt.vorher + 1);

/* ==========================================================================
 * §12 · Reiter und geteilte Ansicht (Auftrag §16)
 * --------------------------------------------------------------------------
 * Der Workspace zeigt rechts ein Feld „Reiter & geteilte Ansicht". Es stand
 * da, seit die Arbeitswelt steht, und nichts hielt es fest.
 *
 * Geprüft wird über den Weg eines Menschen: zwei Seiten in Reitern öffnen,
 * dazwischen wechseln, eine geteilt öffnen, eine schliessen.
 *
 * ─── Gegenproben, nachgemessen ─────────────────────────────────────────────
 *   `zeichnen()` nach `reiter.teilen` weggelassen → „Und das Feld sagt es"
 *      und „Die Teilung lässt sich schliessen" rot. Genau so war es vor
 *      dem 25. August: `Fenster.geteilt()` gesetzt, `.aw-teilung` nicht da.
 *   `Fenster.neuerReiter` aus der Rückgabe entfernt → dieser Abschnitt hält
 *      an und meldet „Die Fenstersteuerung ist da" rot.
 *
 * Die erste Fassung dieses Kopfes behauptete, ohne `neuerReiter` melde der
 * Vertrag `verfügbar: false`. Gemessen: er stürzt ab, weil die Sperre unten
 * nur `F.reiter` prüfte. Jetzt prüft sie, was sie wirklich braucht.
 * ========================================================================*/
console.log('\n12 · Reiter und geteilte Ansicht');

const fenster = await seite.evaluate(async () => {
  const eins = Store.addPage(null, { text: 'Erste Seite', icon: '📄' });
  const zwei = Store.addPage(null, { text: 'Zweite Seite', icon: '📗' });
  await Store.flush();
  const F = (globalThis as any).Fenster;
  if (!F?.reiter || !F?.neuerReiter || !F?.schliessen) return null;
  /* Sauber anfangen: was von früheren Abschnitten offen ist, zumachen. */
  while ((F.reiter() || []).length > 1) F.schliessen(0);
  F.neuerReiter(eins.id);
  await new Promise(r => setTimeout(r, 400));
  F.neuerReiter(zwei.id);
  await new Promise(r => setTimeout(r, 400));
  (globalThis as any).Produktwelten.workspace('start');
  await new Promise(r => setTimeout(r, 900));
  const wurzel = document.querySelector('.arbeitswelt');
  return {
    eins: eins.id, zwei: zwei.id,
    anzahl: (F.reiter() || []).length,
    titel: [...(wurzel?.querySelectorAll('.aw-reiter-wechsel') || [])]
      .map(k => (k.textContent || '').trim()),
    aktiv: Number(F.aktiv?.() ?? -1),
    ausgewaehlt: [...(wurzel?.querySelectorAll('.aw-reiter-wechsel') || [])]
      .map(k => k.getAttribute('aria-selected'))
  };
});
p('Die Fenstersteuerung ist da', !!fenster, 'Fenster.reiter fehlt');
if (fenster) {
  p('Zwei Reiter stehen offen', fenster.anzahl >= 2, `${fenster.anzahl}`);
  p('Der Workspace nennt sie beim Namen',
    fenster.titel.some(t => /Erste Seite/.test(t)) &&
    fenster.titel.some(t => /Zweite Seite/.test(t)), fenster.titel.join(' | '));
  gleich('Genau einer ist ausgewählt',
    fenster.ausgewaehlt.filter(w => w === 'true').length, 1);

  const gewechselt = await seite.evaluate(async () => {
    const knoepfe = [...document.querySelectorAll<HTMLElement>('.aw-reiter-wechsel')];
    knoepfe[0]?.click();
    await new Promise(r => setTimeout(r, 700));
    return {
      /* `?? -1`, NICHT `|| -1`. Der erste Reiter hat den Zähler 0, und 0 ist
         falsch im Sinne von `||` — die Messung meldete −1 und behauptete, das
         Wechseln gehe nicht. Es geht; nur meine Zeile ging nicht. */
      aktiv: Number((globalThis as any).Fenster.aktiv?.() ?? -1),
      offen: String(App.aktuelleSeite() || '')
    };
  });
  gleich('Ein Klick wechselt auf den ersten Reiter', gewechselt.aktiv, 0);
  p('Und die Seite darunter wechselt mit', !!gewechselt.offen, gewechselt.offen);

  const geteilt = await seite.evaluate(async (ids: any) => {
    (globalThis as any).Produktwelten.workspace('start');
    await new Promise(r => setTimeout(r, 800));
    const teilen = document.querySelector<HTMLElement>(`[data-aw-split="${ids.zwei}"]`);
    teilen?.click();
    await new Promise(r => setTimeout(r, 800));
    const stand = (globalThis as any).Fenster.geteilt?.();
    const text = (document.querySelector('.aw-teilung-text')?.textContent || '').trim();
    return { knopfDa: !!teilen, id: String(stand?.id || ''), text };
  }, fenster);
  p('Es gibt einen Knopf „Geteilt öffnen"', geteilt.knopfDa);
  gleich('Die zweite Seite steht geteilt', geteilt.id, fenster.zwei);
  p('Und das Feld sagt es',
    /Zweite Seite/.test(geteilt.text), geteilt.text || '(kein Text)');

  const zu = await seite.evaluate(async () => {
    const vorher = ((globalThis as any).Fenster.reiter() || []).length;
    (document.querySelector('[data-aw-split-close]') as HTMLElement | null)?.click();
    await new Promise(r => setTimeout(r, 600));
    (globalThis as any).Produktwelten.workspace('start');
    await new Promise(r => setTimeout(r, 800));
    (document.querySelector('[data-aw-tab-close="0"]') as HTMLElement | null)?.click();
    await new Promise(r => setTimeout(r, 700));
    return {
      geteiltWeg: !(globalThis as any).Fenster.geteilt?.(),
      nachher: ((globalThis as any).Fenster.reiter() || []).length, vorher
    };
  });
  p('Die Teilung lässt sich schliessen', zu.geteiltWeg);
  gleich('Und ein Reiter auch', zu.nachher, zu.vorher - 1);
}

gleich('Kein Skriptfehler auf keiner Ansicht', fehler.join(' | '), '');

console.log(`\n  Suite 172 — Die zwei Produktwelten tragen: ${ok} ok, ${weg} offen`);
await browser.close();
server.close();
process.exitCode = weg ? 1 : 0;
