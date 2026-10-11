/* Suite 265 — Notizhefte: die Heft-Bibliothek aus dem Dossier (E265)
 * ============================================================================
 * Redur zum GoodNotes-Dossier: „Es muss so sein — aber ohne unsere
 * Funktionen zu löschen." Diese Suite misst die Bibliotheks-Seite davon:
 *
 * §1 REITER: Dokumente · Favoriten · Papierkorb als WÖRTER im Kopf (§38);
 *    das Drei-Dinge-Budget von E264 bleibt.
 * §2 FÄCHER: erkannt aus dem Bestand, leer nur mit Merker; öffnen mit
 *    Brotkrume (Hash bleibt), Neu-im-Fach, Verschieben mit Ring-Wache.
 * §3 NEU-MENÜ: am ＋-Knopf und FAB — die grosse Kachel bleibt der
 *    EIN-Klick-Weg (E264-Seele); fremde Wege über App.erstellenWeg (§5).
 * §4 GITTER/LISTE: Meta `heft:form`, Zeilen mit Mini-Deckel und Wörtern.
 * §5 STERN: klickbar an der Karte, Zustand über Form + aria-pressed.
 * §6 DECKELFARBE: bestehendes Feld `color`, Whitelist gegen Einschleusen.
 * §7 VERSCHLÜSSELN im Kontextmenü: das Heft bleibt sichtbar (heftArt),
 *    die Karte lügt nicht (🔒 statt Papier, „Verschlüsselt" statt Zahl).
 * §8 PAPIERKORB-REITER: wiederherstellen ja, endgültig löschen NUR im
 *    Papierkorb selbst (eine Löschmaschine, E29).
 * §9 TELEFON (§37): Reiter, Zeilen, Stern und FAB fingertauglich; der
 *    FAB öffnet dort das Neu-Menü.
 * §10 SICHERHEIT (§19): böser Fachname überall escaped.
 * §11 BAU-HYGIENE: erzeugte Dateien, sw-Fassung, Einzeldatei.
 *
 *   node pruefungen/lauf/test265.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
declare const Store: any; declare const App: any; declare const Notebook: any;
declare const Werkzeuge: any;
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9043;

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

const browser = await chromium.launch();
const seite = await browser.newPage({ viewport: { width: 1360, height: 950 } });
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 140)));
const startbereit = async (): Promise<void> => {
  await seite.waitForFunction(() => typeof Store !== 'undefined' &&
    typeof App !== 'undefined' && typeof (window as any).Notebook !== 'undefined',
    null, { timeout: 30000 });
  await seite.waitForTimeout(1100);
  await seite.evaluate(() => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelector('.produkt-onboarding-lage')?.remove();
    document.getElementById('rg-willkommen')?.remove();
  });
};
/* AN DIE WURZEL, UND ZWAR AUSDRÜCKLICH.
   Bis E282 tat `Notebook.oeffnen()` das von selbst: es setzte Reiter und
   offenes Fach bei jedem Aufruf zurück. Seit E282 tut es das Gegenteil —
   es stellt wieder her, wo man war (L78 Punkt 3, Redurs Entscheidung in
   E277).

   Dieser Prüflauf hat sich an DREI Stellen auf das alte Verhalten
   verlassen, ohne es je zu sagen: §3 legt ein Heft an und meint die
   Wurzel, §4 misst die Listendarstellung und meint die Wurzel, §6 sucht
   die Fach-Karte und meint die Wurzel (§5 hatte vorher den
   Favoriten-Reiter angeklickt). Alle drei sagen es jetzt.

   Das ist keine Nachgiebigkeit gegenüber der neuen Fassung. Eine stille
   Annahme, die eine Entscheidung umwirft, war schon vorher eine stille
   Annahme — sie fiel nur nicht auf. */
const anDieWurzel = async (): Promise<void> => {
  await seite.evaluate(() => {
    Store.setMeta('heft:fach', '');
    Store.setMeta('heft:reiter', 'dokumente');
    (window as any).Notebook.oeffnen();
  });
  await seite.waitForTimeout(400);
};

await seite.goto(`http://localhost:${PORT}/index.html`);
await startbereit();

/* Der Bestand: ein Fach mit zwei Heften, ein loses Heft, eine Textseite. */
const ids = await seite.evaluate(() => {
  const machHeft = (eltern: string | null, name: string, papier: string) => {
    const h = Store.addPage(eltern, { text: name, icon: '📓' });
    const blatt = Store.addBlock(h.id, 'blatt', { text: '', papier });
    Store.addBlock(blatt.id, 'text', { text: '' });
    Store.updateBlock(h.id, { dokumentModus: true });
    return h.id;
  };
  const fach = Store.addPage(null, { text: 'Elektrotechnik', icon: '🗂' });
  const h1 = machHeft(fach.id, 'Mitschrift', 'kariert');
  const h2 = machHeft(fach.id, 'Fachzeichnen', 'mm');
  const lose = machHeft(null, 'Loses Heft', 'liniert');
  const nurText = Store.addPage(null, { text: 'NurText' });
  Store.addBlock(nurText.id, 'text', { text: 'x' });
  return { fach: fach.id, h1, h2, lose, nurText: nurText.id };
});
await seite.evaluate(() => (window as any).Notebook.oeffnen());
await seite.waitForTimeout(600);

console.log('\n1 · Reiter im Kopf (§38), Budget bleibt');
p('Drei Wort-Reiter stehen im Kopf: Dokumente, Favoriten, Papierkorb',
  await seite.evaluate(() => {
    const t = [...document.querySelectorAll('.nh-kopf .nh-reiter [data-reiter]')]
      .map(b => (b.textContent || '').trim());
    return t.length === 3 && t[0] === 'Dokumente' &&
      t[1]?.startsWith('Favoriten') && t[2]?.startsWith('Papierkorb');
  }));
p('Das Drei-Dinge-Budget von E264 hält: neben Kopf und Telefon-Knopf höchstens zwei Kinder',
  await seite.evaluate(() =>
    [...document.querySelectorAll('.nh-regal > *')]
      .filter(k => !k.classList.contains('nh-kopf') &&
                   !k.classList.contains('nh-neu-fab')).length <= 2));
await seite.locator('[data-reiter="favoriten"]').click();
await seite.waitForTimeout(400);
p('Der leere Favoriten-Reiter sagt es in Worten statt leerer Fläche',
  await seite.evaluate(() =>
    (document.querySelector('.nh-nichts')?.textContent || '').includes('Stern')));
await seite.locator('[data-reiter="dokumente"]').click();
await seite.waitForTimeout(400);

console.log('\n2 · Fächer');
const wurzelStand = await seite.evaluate(() => ({
  fachKarten: [...document.querySelectorAll('.nh-fach .bib-deckel[data-fach]')]
    .map(k => (k.textContent || '').trim()),
  deckel: document.querySelectorAll('.nh-gitter .bib-deckel[data-id]').length
}));
p('Die Seite mit zwei Heften steht als Fach-Karte „2 Hefte", ihre Hefte nicht lose daneben',
  wurzelStand.fachKarten.some(t => t.includes('Elektrotechnik') && t.includes('2 Hefte')) &&
  wurzelStand.deckel === 1, JSON.stringify(wurzelStand));
p('Ein frisch angelegtes, noch leeres Fach ist trotzdem sichtbar (heftArt-Merker)',
  await seite.evaluate(() => {
    Store.addPage(null, { text: 'Leeres Fach', icon: '🗂', heftArt: 'fach' });
    (window as any).Notebook.oeffnen();
    return new Promise(f => setTimeout(() => f(
      [...document.querySelectorAll('.nh-fach .bib-deckel')]
        .some(k => (k.textContent || '').includes('Leeres Fach'))), 400));
  }));
await seite.locator(`.bib-deckel[data-fach="${ids.fach}"]`).click();
await seite.waitForTimeout(400);
p('Fach öffnen: nur seine Hefte, die Brotkrume trägt das Wort, der Hash bleibt',
  await seite.evaluate(() =>
    document.querySelectorAll('.nh-gitter .bib-deckel[data-id]').length === 2 &&
    (document.querySelector('.nh-zurueck')?.textContent || '').includes('Notizhefte') &&
    location.hash === '#notizhefte'));
const imFach = await seite.evaluate((fachId: string) => {
  const vorher = Store.childrenOf(fachId).length;
  (document.querySelector('.nh-gitter .nh-neu') as HTMLElement)?.click();
  return new Promise(f => setTimeout(() => {
    const kinder = Store.childrenOf(fachId);
    f({ mehr: kinder.length === vorher + 1,
        letztesIstHeft: kinder.some((k: any) =>
          k.type === 'page' && Store.childrenOf(k.id).some((x: any) => x.type === 'blatt') &&
          String(k.text || '').startsWith('Heft vom')) });
  }, 700));
}, ids.fach);
p('Die ＋-Kachel im offenen Fach legt das Heft IM Fach an (ein Klick, wie an der Wurzel)',
  (imFach as any).mehr && (imFach as any).letztesIstHeft, JSON.stringify(imFach));
await seite.evaluate(() => (window as any).Notebook.oeffnen());
await seite.waitForTimeout(500);
await seite.locator('[data-zurueck]').count().then(async n => {
  if (n) { await seite.locator('[data-zurueck]').click(); await seite.waitForTimeout(300); }
});
await seite.locator(`.nh-karte:not(.nh-fach) [data-mehr="${ids.lose}"]`).click();
await seite.waitForTimeout(250);
await seite.locator('.menu [data-a="fach"]').click();
await seite.waitForTimeout(250);
const zielKnoepfe = await seite.evaluate(() =>
  [...document.querySelectorAll('.menu [data-z]')].map(b => (b.textContent || '').trim()));
await seite.locator(`.menu [data-z="${ids.fach}"]`).click();
await seite.waitForTimeout(500);
p('„In Fach verschieben …" hängt das Heft um — Eltern und content-Liste stimmen',
  await seite.evaluate((a: any) => {
    const h = Store.getBlock(a.lose);
    const alteWurzel = Store.rootPages().some((r: any) => r.id === a.lose);
    const drin = (Store.getBlock(a.fach)?.content || []).includes(a.lose);
    return h?.parentId === a.fach && drin && !alteWurzel;
  }, ids), JSON.stringify(zielKnoepfe));
/* Ein „Fach" als Unterseite des losen Hefts anlegen — es hängt IM Heft.
   Das Heft selbst liegt seit dem Umhängen im Fach, also erst dorthin.
   Die Probe zählt mit, dass das Menü WIRKLICH offen war (mindestens ein
   Ziel oder der Neues-Fach-Knopf) — sonst wäre „nicht angeboten" auch
   bei einem toten Klickweg wahr (§55.2). */
const falleId = await seite.evaluate((a: any) => {
  const falle = Store.addPage(a.lose, { text: 'Falle', heftArt: 'fach' });
  (window as any).Notebook.oeffnen();
  return falle.id;
}, ids);
await seite.waitForTimeout(400);
await seite.locator(`.bib-deckel[data-fach="${ids.fach}"]`).click();
await seite.waitForTimeout(300);
await seite.locator(`[data-mehr="${ids.lose}"]`).click();
await seite.waitForTimeout(250);
await seite.locator('.menu [data-a="fach"]').click();
await seite.waitForTimeout(250);
const ringProbe = await seite.evaluate((falle: string) => {
  const offen = !!document.querySelector('.menu [data-z-neu]');
  const angeboten = [...document.querySelectorAll('.menu [data-z]')]
    .some(b => (b as HTMLElement).dataset['z'] === falle);
  document.querySelectorAll('.menu, .menu-grund').forEach(x => x.remove());
  Store.trashBlock(falle);
  (window as any).Notebook.oeffnen();
  return { offen, angeboten };
}, falleId);
p('Ein Fach, das im Heft selbst liegt, steht NICHT in der Zielliste (Ring-Wache)',
  (ringProbe as any).offen && !(ringProbe as any).angeboten, JSON.stringify(ringProbe));
await seite.waitForTimeout(400);

console.log('\n3 · Das Neu-Menü — und die Kachel bleibt der Ein-Klick-Weg');
/* §2 hat ein Fach GEÖFFNET. Die ＋-Kachel legt ihr Heft dort an, wo das
   Regal gerade steht — dieser Abschnitt meint die Wurzel. */
await anDieWurzel();
await seite.evaluate(() => (window as any).Notebook.oeffnen());
await seite.waitForTimeout(400);
const menueProbe = await seite.evaluate(() => {
  const seitenVorher = Object.keys(Store.cache.blocks).length;
  (document.querySelector('.nh-neu-knopf') as HTMLElement)?.click();
  return new Promise(f => setTimeout(() => {
    const woerter = [...document.querySelectorAll('.menu [data-w]')]
      .map(b => (b.textContent || '').trim());
    const papiere = document.querySelectorAll('.menu [data-w-papier]').length;
    f({ offen: !!document.querySelector('.menu'), woerter, papiere,
        nichtsAngelegt: Object.keys(Store.cache.blocks).length === seitenVorher });
  }, 300));
});
p('„＋ Neu" öffnet ein MENÜ (kein Sofort-Heft): Notizheft, Fach, PDF, Whiteboard, Textseite, Alle Wege',
  (menueProbe as any).offen && (menueProbe as any).nichtsAngelegt &&
  (menueProbe as any).papiere === 5 &&
  ['Notizheft', 'Neues Fach', 'PDF einlesen', 'Whiteboard', 'Textseite']
    .every(wort => (menueProbe as any).woerter.some((t: string) => t.includes(wort))),
  JSON.stringify(menueProbe));
await seite.locator('.menu [data-w-papier="punkte"]').click();
await seite.waitForTimeout(800);
p('Die Papier-Schnellwahl legt das Heft mit DIESEM Papier an und merkt es als Vorgabe',
  await seite.evaluate(() => {
    const id = Store.getMeta('heft:zuletzt', '');
    const blatt = Store.childrenOf(id).find((k: any) => k.type === 'blatt');
    return blatt?.papier === 'punkte' && Store.getMeta('heft:papier', '') === 'punkte' &&
      !!document.activeElement?.closest?.('.blatt-papier');
  }));
await seite.evaluate(() => (window as any).Notebook.oeffnen());
await seite.waitForTimeout(400);
await seite.locator('.nh-neu-knopf').click();
await seite.waitForTimeout(250);
await seite.locator('.menu [data-w="alle"]').click();
await seite.waitForTimeout(400);
p('„Alle Wege …" führt in den EINEN Katalog der Schale (dort steht auch PDF einlesen)',
  await seite.evaluate(() => !!document.querySelector('.menu [data-neu="pdf"]')));
/* ══ DIE FÜNF AUS GOODNOTES STEHEN ALLE DA (E513) ═══════════════════════════
   Redur, 8. September, mit einem Bild des GoodNotes-Menüs: „wenn ich + klicke,
   sollte mir sagen, was ich einfügen will — PDF oder Notizbuch, Text-
   dokument, Whiteboard oder Schnellnotizen."

   Vier davon standen längst hier. Das NOTIZBUCH nicht — obwohl es im Regal
   „Notizhefte" seit E264 einen eigenen Knopf hat. Ein Weg, den man nur
   findet, wenn man ihn schon kennt, ist keiner. */
{
  const da = await seite.evaluate(() => ['pdf', 'heft', 'seite', 'board', 'memo']
    .filter(id => !!document.querySelector('.menu [data-neu="' + id + '"]')));
  p('Alle fünf Wege aus Redurs Liste stehen im Katalog',
    da.length === 5, JSON.stringify(da));
}
await seite.evaluate(() => {
  document.querySelectorAll('.menu, .menu-grund').forEach(x => x.remove());
});
p('App.erstellenWeg führt einen Katalogweg aus — die eine Maschine ist erreichbar',
  await seite.evaluate(() => {
    if (typeof App.erstellenWeg !== 'function') return false;
    const vorher = Object.values<any>(Store.cache.blocks)
      .filter((b: any) => b.type === 'page').length;
    App.erstellenWeg('seite');
    return new Promise(f => setTimeout(() => f(
      Object.values<any>(Store.cache.blocks)
        .filter((b: any) => b.type === 'page').length === vorher + 1), 300));
  }));
await seite.evaluate(() => (window as any).Notebook.oeffnen());
await seite.waitForTimeout(400);
const kachelProbe = await seite.evaluate(() => {
  const hefteVorher = document.querySelectorAll('.nh-gitter .bib-deckel[data-id]').length;
  void hefteVorher;
  const zuletztVorher = Store.getMeta('heft:zuletzt', '');
  (document.querySelector('.nh-gitter .nh-neu') as HTMLElement)?.click();
  return new Promise(f => setTimeout(() => f({
    neuesHeft: Store.getMeta('heft:zuletzt', '') !== zuletztVorher,
    keinMenue: !document.querySelector('.menu')
  }), 600));
});
p('Die grosse ＋-Kachel bleibt der Ein-Klick-Weg: neues Heft, KEIN Menü (E264-Wächter)',
  (kachelProbe as any).neuesHeft && (kachelProbe as any).keinMenue);

console.log('\n4 · Gitter und Liste');
/* AN DER WURZEL MESSEN, und zwar ausdrücklich.
   Bis E282 genügte `oeffnen()` dafür: es setzte das offene Fach jedes Mal
   zurück. Seit E282 tut es das Gegenteil — es stellt wieder her, wo man
   war (L78 Punkt 3), und §2 oben hat ein Fach geöffnet. Dieser Abschnitt
   misst aber die Darstellung an der WURZEL, mit Fach-Karten und losen
   Heften nebeneinander; im Fach stünden nur dessen zwei Hefte.

   Der Merker wird deshalb geräumt, bevor gezeichnet wird. Das ist keine
   Nachgiebigkeit gegenüber der neuen Fassung, sondern die Berichtigung
   einer stillen Annahme: der Abschnitt hat sich immer auf die Wurzel
   verlassen, ohne es je zu sagen. */
await anDieWurzel();
await seite.locator('[data-form="liste"]').click();
await seite.waitForTimeout(400);
/* Mit Befund statt nur ja/nein: dieser Punkt ist einmal rot geworden, und
   „false" allein sagt nicht, WELCHES der drei Stücke fehlte. */
const listenProbe = await seite.evaluate(() => {
  const zeile = document.querySelector('.nh-liste .nh-zeile:not(.nh-fach)');
  const text = zeile?.querySelector('.nh-zeile-text')?.textContent || '';
  return {
    zeileDa: !!zeile,
    mini: !!zeile?.querySelector('.nh-mini[data-papier]'),
    text: text.slice(0, 120),
    blatt: /1 Blatt\b/.test(text),
    gedrueckt: [...document.querySelectorAll('[data-form]')]
      .some(b => b.getAttribute('aria-pressed') === 'true'),
    zeilen: document.querySelectorAll('.nh-liste .nh-zeile').length
  };
}) as any;
p('Die Liste: Zeilen mit Mini-Deckel (Papier), Namen, Blattzahl-WORT und Zeit',
  listenProbe.zeileDa && listenProbe.mini && listenProbe.blatt && listenProbe.gedrueckt,
  JSON.stringify(listenProbe));
p('Die Wahl überlebt als Meta `heft:form` und gilt beim nächsten Öffnen',
  await seite.evaluate(() => {
    if (Store.getMeta('heft:form', '') !== 'liste') return false;
    (window as any).Notebook.oeffnen();
    return new Promise(f => setTimeout(() =>
      f(!!document.querySelector('.nh-liste')), 400));
  }));
await seite.locator('[data-form="gitter"]').click();
await seite.waitForTimeout(400);

console.log('\n5 · Der Stern sitzt an der Karte');
/* Das Heft liegt im Fach — sein Stern also auch. */
await seite.locator(`.bib-deckel[data-fach="${ids.fach}"]`).click();
await seite.waitForTimeout(300);
/* DIE FORM STECKT SEIT E460 IM SVG, NICHT MEHR IM ZEICHEN.
   Diese Zusage las bis dahin `textContent` und erwartete „★". E460 hat
   „★"/„☆" durch DASSELBE Merkzeichen ersetzt, das auch die Kopfleiste
   führt — ein Band als SVG, gefüllt oder offen. Seither ist der Text des
   Knopfes leer, und die Zusage fiel, ohne dass etwas kaputt war: sie
   kannte die alte Form auswendig (dieselbe Sorte wie in E485).
   Geprüft wird jetzt, was §38 wirklich verlangt — dass sich die FORM
   ändert und nicht nur die Farbe: `fill="none"` vorher, `currentColor`
   nachher. */
const sternProbe = await seite.evaluate((a: any) => {
  const fuellung = (k: Element | null): string =>
    k?.querySelector('svg path')?.getAttribute('fill') ?? (k?.textContent || '').trim();
  const stern = document.querySelector<HTMLElement>(`[data-stern="${a.h1}"]`);
  const vorher = {
    da: !!stern, gedrueckt: stern?.getAttribute('aria-pressed'),
    titel: stern?.title || '', form: fuellung(stern ?? null)
  };
  stern?.click();
  return new Promise(f => setTimeout(() => {
    const nachher = document.querySelector<HTMLElement>(`[data-stern="${a.h1}"]`);
    f({ vorher,
        favorit: !!Store.getBlock(a.h1)?.favorite,
        gedrueckt: nachher?.getAttribute('aria-pressed'),
        form: fuellung(nachher ?? null) });
  }, 400));
}, ids);
p('Klick auf den Merker setzt favorite, aria-pressed und die FORM (§38 — nicht nur Farbe)',
  (sternProbe as any).vorher.da && (sternProbe as any).vorher.gedrueckt === 'false' &&
  (sternProbe as any).favorit && (sternProbe as any).gedrueckt === 'true' &&
  (sternProbe as any).vorher.form !== (sternProbe as any).form &&
  ['currentColor', '★'].includes((sternProbe as any).form), JSON.stringify(sternProbe));
await seite.locator('[data-zurueck]').click();
await seite.waitForTimeout(300);
p('Der Favoriten-Reiter zählt ehrlich und zeigt genau die gesternten Hefte',
  await seite.evaluate((a: any) => {
    const reiter = document.querySelector('[data-reiter="favoriten"]');
    const zahlDa = /\(\d+\)/.test(reiter?.textContent || '');
    (reiter as HTMLElement)?.click();
    return new Promise(f => setTimeout(() => {
      const deckel = [...document.querySelectorAll('.bib-deckel[data-id]')];
      f(zahlDa && deckel.length >= 1 &&
        deckel.every(d => !!Store.getBlock((d as HTMLElement).dataset['id'])?.favorite) &&
        deckel.some(d => (d as HTMLElement).dataset['id'] === a.h1));
    }, 400));
  }, ids));
await seite.locator('[data-reiter="dokumente"]').click();
await seite.waitForTimeout(300);

console.log('\n6 · Die Deckelfarbe (bestehendes Feld, Whitelist)');
await seite.locator(`.bib-deckel[data-fach="${ids.fach}"]`).click();
await seite.waitForTimeout(300);
await seite.locator(`[data-mehr="${ids.h1}"]`).click();
await seite.waitForTimeout(250);
await seite.locator('.menu [data-a="farbe"]').click();
await seite.waitForTimeout(250);
await seite.locator('.menu .nh-farben [data-farbe="blue"]').click();
await seite.waitForTimeout(400);
const farbProbe = await seite.evaluate((a: any) => {
  const karte = document.querySelector(`.bib-deckel[data-id="${a.h1}"]`);
  const blatt = karte?.querySelector('.bib-deckel-blatt');
  const kante = blatt ? getComputedStyle(blatt).borderLeftWidth : '';
  return { color: Store.getBlock(a.h1)?.color, attr: karte?.getAttribute('data-farbe'),
           kante };
}, ids);
p('Blau: `color` am Block, `data-farbe` an der Karte, und die Kante IST gemessen da',
  (farbProbe as any).color === 'blue' && (farbProbe as any).attr === 'blue' &&
  parseFloat((farbProbe as any).kante) > 0, JSON.stringify(farbProbe));
await seite.locator(`[data-mehr="${ids.h1}"]`).click();
await seite.waitForTimeout(250);
await seite.locator('.menu [data-a="farbe"]').click();
await seite.waitForTimeout(250);
await seite.locator('.menu [data-farbe=""]').click();
await seite.waitForTimeout(400);
p('„Ohne Farbe" räumt Feld und Attribut',
  await seite.evaluate((a: any) => {
    const karte = document.querySelector(`.bib-deckel[data-id="${a.h1}"]`);
    return Store.getBlock(a.h1)?.color === '' && !karte?.hasAttribute('data-farbe');
  }, ids));
/* Das Heft liegt im Fach — erst an die Wurzel (§5 endete im
   Favoriten-Reiter, und dort steht keine Fach-Karte), dann hinein. */
await seite.evaluate((a: any) => {
  Store.updateBlock(a.h1, { color: 'red;background:url(x)' });
}, ids);
await anDieWurzel();
await seite.locator(`.bib-deckel[data-fach="${ids.fach}"]`).click();
await seite.waitForTimeout(400);
p('Ein eingeschleuster color-Wert erzeugt WEDER Attribut noch Stil (Whitelist, §19)',
  await seite.evaluate((a: any) => {
    const k = document.querySelector(`.bib-deckel[data-id="${a.h1}"]`);
    const sauber = !!k && !k.hasAttribute('data-farbe') &&
      !(k.getAttribute('style') || '').includes('url');
    Store.updateBlock(a.h1, { color: '' });
    return sauber;
  }, ids));

console.log('\n7 · Verschlüsseln im Kontextmenü — das Heft bleibt im Regal');
const dialogAntwort = (d: any) => { void d.accept('pw'); };
seite.on('dialog', dialogAntwort);
await anDieWurzel();
await seite.locator(`.bib-deckel[data-fach="${ids.fach}"]`).click();
await seite.waitForTimeout(300);
await seite.locator(`[data-mehr="${ids.h2}"]`).click();
await seite.waitForTimeout(250);
await seite.locator('.menu [data-a="sperren"]').click();
await seite.waitForTimeout(1200);
p('Verschlüsselt: locked steht, der heftArt-Merker hält das Heft in der Bibliothek',
  await seite.evaluate((a: any) => {
    const h = Store.getBlock(a.h2);
    return !!h?.locked && h?.heftArt === 'heft' &&
      Store.childrenOf(a.h2).length === 0;
  }, ids));
await anDieWurzel();
await seite.locator(`.bib-deckel[data-fach="${ids.fach}"]`).click();
await seite.waitForTimeout(300);
p('Die Karte lügt nicht: 🔒 statt Papier, „Verschlüsselt" statt einer Blattzahl',
  await seite.evaluate((a: any) => {
    const karte = document.querySelector(`.bib-deckel[data-id="${a.h2}"]`);
    return !!karte?.querySelector('.is-gesperrt .nh-schloss') &&
      (karte?.textContent || '').includes('Verschlüsselt') &&
      !karte?.querySelector('[data-papier]');
  }, ids));
await seite.locator(`.bib-deckel[data-id="${ids.h2}"]`).click();
await seite.waitForTimeout(600);
p('Klick auf die 🔒-Karte öffnet den Sperrbildschirm — kein Fokus in Chiffretext',
  await seite.evaluate(() => !!document.querySelector('.gesperrt')) &&
  fehler.length === 0, fehler.join(' | '));
await anDieWurzel();
await seite.locator(`.bib-deckel[data-fach="${ids.fach}"]`).click();
await seite.waitForTimeout(300);
await seite.locator(`[data-mehr="${ids.h2}"]`).click();
await seite.waitForTimeout(250);
await seite.locator('.menu [data-a="entsperren"]').click();
await seite.waitForTimeout(1200);
p('Entschlüsseln bringt Blätter und Papier-Deckel zurück',
  await seite.evaluate((a: any) => {
    const h = Store.getBlock(a.h2);
    const karte = document.querySelector(`.bib-deckel[data-id="${a.h2}"]`);
    return !h?.locked && Store.childrenOf(a.h2).some((k: any) => k.type === 'blatt') &&
      !!karte?.querySelector('[data-papier="mm"]');
  }, ids));
seite.off('dialog', dialogAntwort);

console.log('\n8 · Der Papierkorb-Reiter — eine Löschmaschine, nicht zwei (E29)');
/* „an der Wurzel" steht schon im Kommentar unten — §7 endete im Fach. */
await anDieWurzel();
const loseId = await seite.evaluate(() => {
  /* Das jüngste lose Heft an der Wurzel in den Papierkorb legen. */
  const deckel = document.querySelector<HTMLElement>('.nh-gitter .bib-deckel[data-id]');
  return deckel?.dataset['id'] || '';
});
await seite.locator(`[data-mehr="${loseId}"]`).click();
await seite.waitForTimeout(250);
await seite.locator('.menu [data-a="papierkorb"]').click();
await seite.waitForTimeout(500);
p('Ins Papierkorb gelegt: aus Dokumente verschwunden, der Reiter zählt es',
  await seite.evaluate((id: string) =>
    ![...document.querySelectorAll('.bib-deckel[data-id]')]
      .some(d => (d as HTMLElement).dataset['id'] === id) &&
    /Papierkorb \(\d+\)/.test(
      document.querySelector('[data-reiter="papierkorb"]')?.textContent || ''), loseId));
await seite.locator('[data-reiter="papierkorb"]').click();
await seite.waitForTimeout(400);
p('Die tote Karte trägt genau EINEN Wort-Knopf: „Wiederherstellen" — kein Endgültig hier',
  await seite.evaluate(() => {
    const karten = [...document.querySelectorAll('.nh-tot')];
    const knoepfe = [...document.querySelectorAll('.nh-korb button')]
      .map(b => (b.textContent || '').trim());
    return karten.length >= 1 &&
      knoepfe.some(t => t === 'Wiederherstellen') &&
      !knoepfe.some(t => /endgültig/i.test(t)) &&
      (document.querySelector('.nh-korb-hinweis')?.textContent || '')
        .includes('endgültig löschen nur im Papierkorb');
  }));
await seite.locator('[data-korb-auf]').click();
await seite.waitForTimeout(500);
p('„Papierkorb ganz öffnen" führt in die EINE Löschmaschine mit Rückfrage',
  await seite.evaluate(() => !!document.querySelector('.finder.pk')));
await seite.evaluate(() => { document.querySelector('.overlay')?.remove(); });
await anDieWurzel();
await seite.locator('[data-reiter="papierkorb"]').click();
await seite.waitForTimeout(300);
await seite.locator(`[data-herstellen="${loseId}"]`).click();
await seite.waitForTimeout(500);
p('Wiederherstellen: das Heft lebt und steht wieder unter Dokumente',
  await seite.evaluate((id: string) => {
    const h = Store.getBlock(id);
    (document.querySelector('[data-reiter="dokumente"]') as HTMLElement)?.click();
    return new Promise(f => setTimeout(() => f(
      h?.alive !== false &&
      [...document.querySelectorAll('.bib-deckel[data-id]')]
        .some(d => (d as HTMLElement).dataset['id'] === id)), 400));
  }, loseId));

console.log('\n9 · Telefon (§37)');
await seite.setViewportSize({ width: 390, height: 844 });
await seite.evaluate(() => (window as any).Notebook.oeffnen());
await seite.waitForTimeout(600);
const handy = await seite.evaluate(() => {
  const fab = document.querySelector('.nh-neu-fab')?.getBoundingClientRect();
  const leiste = document.getElementById('handy-oben')?.getBoundingClientRect();
  const reiter = [...document.querySelectorAll('.nh-reiter [data-reiter]')]
    .map(b => b.getBoundingClientRect().height);
  const wege = document.querySelectorAll('#handy-oben [data-hl]').length ||
    document.querySelectorAll('#handy-oben button, #handy-oben a').length;
  return {
    fabGross: !!fab && fab.width >= 44 && fab.height >= 44,
    fabUeberLeiste: !!fab && !!leiste && fab.bottom <= leiste.top,
    reiterHoch: reiter.length === 3 && reiter.every(h => h >= 44),
    wege
  };
});
p('FAB ≥ 44 px und ÜBER der unteren Leiste; die fünf Wege bleiben',
  handy.fabGross && handy.fabUeberLeiste && handy.wege >= 5, JSON.stringify(handy));
p('Die drei Reiter sind fingertauglich (≥ 44 px hoch)', handy.reiterHoch);
await seite.locator('.nh-neu-fab').click();
await seite.waitForTimeout(300);
p('Der FAB öffnet am Telefon das Neu-Menü (Wort „Notizheft" steht darin)',
  await seite.evaluate(() =>
    [...document.querySelectorAll('.menu [data-w]')]
      .some(b => (b.textContent || '').includes('Notizheft'))));
await seite.evaluate(() => {
  document.querySelectorAll('.menu, .menu-grund').forEach(x => x.remove());
});
await seite.locator('[data-form="liste"]').click();
await seite.waitForTimeout(400);
p('Listenzeile und Stern sind am Telefon fingertauglich und SICHTBAR (kein Nur-Hover)',
  await seite.evaluate(() => {
    const zeile = document.querySelector('.nh-zeile:not(.nh-fach)');
    const auf = zeile?.querySelector('.nh-zeile-auf')?.getBoundingClientRect();
    const stern = zeile?.querySelector('.nh-stern');
    const r = stern?.getBoundingClientRect();
    const o = stern ? parseFloat(getComputedStyle(stern).opacity) : 0;
    return !!auf && auf.height >= 44 && !!r && r.width >= 44 && r.height >= 44 && o > 0.3;
  }));
await seite.locator('[data-form="gitter"]').click();
await seite.waitForTimeout(300);
await seite.setViewportSize({ width: 1360, height: 950 });

console.log('\n10 · Sicherheit (§19): der böse Fachname');
p('Ein Fachname mit img-Angriff wird überall als TEXT gezeigt — Karte, Menü, Kopfzeile',
  await seite.evaluate(() => {
    const boese = Store.addPage(null,
      { text: '<img src=x onerror="window.__nhx=1">', icon: '🗂', heftArt: 'fach' });
    (window as any).Notebook.oeffnen();
    return new Promise(f => setTimeout(() => {
      const inKarte = [...document.querySelectorAll('.nh-fach .bib-deckel-name')]
        .some(n => (n.textContent || '').includes('<img'));
      (document.querySelector(`.bib-deckel[data-fach="${boese.id}"]`) as HTMLElement)?.click();
      setTimeout(() => {
        const inKopf = (document.querySelector('.nh-kopf h1')?.textContent || '')
          .includes('<img');
        const keinBild = !document.querySelector('.nh-regal img, .nh-kopf img');
        Store.trashBlock(boese.id);
        (window as any).Notebook.oeffnen();
        f(inKarte && inKopf && keinBild && !(window as any).__nhx);
      }, 400);
    }, 400));
  }));

console.log('\n11 · Bau-Hygiene');
const notebookJs = fs.readFileSync(path.join(WURZEL, 'quell/bereiche/wissen/notebook.js'), 'utf8');
const schaleJs = fs.readFileSync(path.join(WURZEL, 'quell/schale/aufbau/schale.js'), 'utf8');
const swJs = fs.readFileSync(path.join(WURZEL, 'sw.js'), 'utf8');
p('Die erzeugten Dateien tragen den ERZEUGT-Kopf und kennen die neuen Teile',
  notebookJs.includes('ERZEUGT') && notebookJs.includes('nh-reiter') &&
  schaleJs.includes('ERZEUGT') && schaleJs.includes('erstellenWeg'));
/* Nicht „v32" festnageln — die Fassung wächst mit jeder Lieferung. Die
   Wahrheit ist: das erzeugte sw.js trägt DIESELBE Fassung wie seine
   Quelle, und die Dateiliste kennt die Notizhefte weiterhin. */
const swQuelle = fs.readFileSync(path.join(WURZEL, 'src/dienst/sw.ts'), 'utf8');
const fassung = /VERSION = '([^']+)'/.exec(swQuelle)?.[1] || '';
p('sw.js trägt die Fassung seiner Quelle, die Dateiliste kennt die Notizhefte',
  !!fassung && swJs.includes(`'${fassung}'`) &&
  swJs.includes('quell/bereiche/wissen/notebook.js') &&
  swJs.includes('quell/schale/stil/notizhefte.css'));
p('Die Einzeldatei enthält die Reiter-Bibliothek',
  fs.readFileSync(path.join(WURZEL, 'redion-einzeldatei.html'), 'utf8').includes('nh-reiter'));
p('Keine Fehler auf der Seite', fehler.length === 0, fehler.slice(0, 3).join(' | '));

console.log(`\n${ok} bestanden, ${weg} durchgefallen`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
