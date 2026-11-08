/* Suite 636 — Gespeicherte Schaltplan-Vorlagen mehrfach sicher einsetzen.
 * Die echten Menue-Klicks und die echte Planablage werden mit Chromium
 * geprueft: keine uebereinanderliegenden Symbole, eindeutige Kennungen,
 * keine Referenzen auf Bauteile ausserhalb der kopierten Vorlage.
 *
 * Start: node pruefungen/lauf/test636.mts
 */
import { chromium } from 'playwright';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

declare const Store: any; declare const App: any; declare const Register: any;

const ROOT = path.resolve(import.meta.dirname, '../..');
const INDEX = pathToFileURL(path.join(ROOT, 'index.html')).href;
let bestanden = 0;
let fehlgeschlagen = 0;
const pruefe = (name: string, wahr: unknown, details = ''): void => {
  if (wahr) { bestanden++; console.log('  ✓ ' + name); }
  else { fehlgeschlagen++; console.log('  ✗ ' + name + (details ? ': ' + details : '')); }
};

const browser = await chromium.launch();
try {
  const context = await browser.newContext({ viewport: { width: 1300, height: 860 } });
  const page = await context.newPage();
  const pageErrors: string[] = [];
  page.on('pageerror', e => pageErrors.push(e.message.slice(0, 140)));
  page.on('dialog', d => d.dismiss().catch(() => {}));
  await page.goto(INDEX);
  await page.waitForFunction(() => typeof App !== 'undefined' &&
    !!document.querySelector('#page')?.firstElementChild, null, { timeout: 30000 });

  const blockId = await page.evaluate(async () => {
    Store.setMeta('rundgangGesehen', true);
    Store.setMeta('neuerungenGesehen', 99);
    Store.setMeta('kartenGemeldet', new Date().toISOString().slice(0, 10));
    Store.setMeta('elektro:planvorlagen', [{
      id: 'tpl636', name: 'Kopierprobe 636', art: 'stromlauf-aufgeloest',
      teile: [
        { id: 'altA', zeichen: 'spule', x: 0, y: 0, drehung: 0,
          gespiegelt: false, bmk: 'K2', nummern: {}, gruppe: 'altG', ebene: 'plan' },
        { id: 'altB', zeichen: 'spule', x: 160, y: 0, drehung: 0,
          gespiegelt: false, bmk: 'K3', nummern: {}, gruppe: 'altG', ebene: 'plan' }
      ],
      leitungen: [
        { id: 'altL1', ebene: 'plan', vonTeil: 'altA', vonNr: 'A2',
          nachTeil: 'altB', nachNr: 'A1',
          punkte: [{ x: 30, y: 60 }, { x: 190, y: 0 }] },
        { id: 'altL2', ebene: 'plan', vonTeil: 'altA', vonNr: 'A1',
          nachTeil: 'ursprungsTeil', nachNr: 'A2',
          punkte: [{ x: 30, y: 0 }, { x: 80, y: 0 }] }
      ]
    }]);
    const sp = Store.addPage(null, { text: 'Vorlagentest 636', icon: '⚡' });
    const b = Store.addBlock(sp.id, 'schaltplan', {
      text: 'Plan',
      plan: {
        art: 'stromlauf-aufgeloest', breite: 800, hoehe: 600,
        teile: [{ id: 'ursprungsTeil', zeichen: 'spule', x: 120, y: 80,
          drehung: 0, gespiegelt: false, bmk: 'K1', nummern: {},
          gruppe: '', ebene: 'plan' }],
        leitungen: [], texte: [],
        ebenen: [{ id: 'plan', name: 'Plan', farbe: 'var(--text)', sichtbar: true }]
      }
    });
    await Store.flush();
    App.zeichneBaum();
    App.oeffne(sp.id);
    await new Promise(resolve => setTimeout(resolve, 900));
    document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung')
      .forEach(el => el.remove());
    return b.id as string;
  });

  const plan = () => page.evaluate((id: string) =>
    JSON.parse(JSON.stringify(Store.getBlock(id).plan)), blockId);

  const einsetzen = async (): Promise<void> => {
    await page.locator('.sp-wrap [data-a="netz"]').click();
    await page.locator('[data-v="0"]').click();
    await page.waitForTimeout(200);
  };
  await einsetzen();
  const a = await plan();
  pruefe('Erstes Einfuegen: 2 neue Bauteile und 2 Leitungen',
    a.teile.length === 3 && a.leitungen.length === 2);

  await einsetzen();
  const b = await plan();
  pruefe('Zweites Einfuegen: nochmals 2 Bauteile und 2 Leitungen',
    b.teile.length === 5 && b.leitungen.length === 4);

  const ids = b.teile.map((t: any) => t.id);
  const wireIds = b.leitungen.map((l: any) => l.id);
  pruefe('Jede Kopie hat eigene Teil- und Leitungskennungen',
    new Set(ids).size === ids.length && new Set(wireIds).size === wireIds.length);

  pruefe('Keine alten Teilreferenzen aus der Vorlage',
    b.leitungen.every((l: any) =>
      (!l.vonTeil || ids.includes(l.vonTeil)) &&
      (!l.nachTeil || ids.includes(l.nachTeil)) &&
      l.vonTeil !== 'altA' && l.nachTeil !== 'altB'));

  const gebunden = b.leitungen.filter((l: any) => l.vonTeil && l.nachTeil);
  pruefe('Interne Verbindungen bleiben verbunden und externes Ende wird frei',
    gebunden.length === 2 &&
    b.leitungen.filter((l: any) => !l.nachTeil && !l.nachNr).length === 2);

  const groups = b.teile.slice(1).map((t: any) => t.gruppe);
  pruefe('Gruppen bleiben innerhalb der Kopie, nicht zwischen Kopien',
    groups[0] && groups[0] === groups[1] &&
    groups[2] === groups[3] && groups[0] !== groups[2] && groups[0] !== 'altG');

  const overlaps = await page.evaluate((id: string) => {
    const p = Store.getBlock(id).plan;
    const rect = (t: any) => {
      const m = Register.fachzeichen.masse(t.zeichen, t.drehung);
      return { x: t.x, y: t.y, right: t.x + m.w, bottom: t.y + m.h };
    };
    const parts = p.teile.map(rect);
    const hits: string[] = [];
    for (let i = 0; i < parts.length; i++)
      for (let j = i + 1; j < parts.length; j++) {
        const x = parts[i], y = parts[j];
        if (x.x < y.right && x.right > y.x &&
            x.y < y.bottom && x.bottom > y.y) hits.push(i + ':' + j);
      }
    return hits;
  }, blockId);
  pruefe('Wiederholtes Einfuegen ohne Bauteil-Ueberlappung',
    overlaps.length === 0, JSON.stringify(overlaps));

  await page.locator('.sp-wrap [data-a="zurueck"]').click();
  await page.waitForTimeout(200);
  const undo = await plan();
  pruefe('Eine Einfuegung ist genau ein Undo-Schritt',
    undo.teile.length === 3 && undo.leitungen.length === 2);
  /* Leitungen ausserhalb des Bauteilrahmens muessen auch in den
     Platzvergleich einfliessen. Sonst kann eine gueltige Vorlage ihre
     Leitungen ausserhalb des sichtbaren Schaltplans ablegen. */
  const setzeVorlageMitDraht = async (links: number): Promise<void> => {
    await page.evaluate((drahtX: number) => {
      Store.setMeta('elektro:planvorlagen', [{
        id: 'draht-vorlage', name: 'Draht-Randprobe', art: 'stromlauf-aufgeloest',
        teile: [{ id: 'altR', zeichen: 'spule', x: 0, y: 0, drehung: 0,
          gespiegelt: false, bmk: 'K3', nummern: {}, gruppe: '', ebene: 'plan' }],
        leitungen: [{ id: 'altW', ebene: 'plan', vonTeil: 'altR', vonNr: 'A1',
          punkte: [{ x: drahtX, y: 20 }, { x: 30, y: 20 }] }]
      }]);
    }, links);
  };
  await setzeVorlageMitDraht(-80);
  const vorRand = await plan();
  await einsetzen();
  const nachRand = await plan();
  pruefe('Vorlage mit Leitungsueberhang findet eine gueltige Position',
    nachRand.teile.length === vorRand.teile.length + 1 &&
    nachRand.leitungen.length === vorRand.leitungen.length + 1);
  const letzteLeitung = nachRand.leitungen[nachRand.leitungen.length - 1];
  pruefe('Alle Punkte der eingefuegten Leitung bleiben innerhalb des Blatts',
    letzteLeitung?.punkte.every((p: any) => Number.isFinite(p.x) && Number.isFinite(p.y) &&
      p.x >= 10 && p.y >= 10 && p.x <= 790 && p.y <= 590));

  await setzeVorlageMitDraht(-900);
  const vorUnmoeglich = JSON.stringify(await plan());
  await einsetzen();
  pruefe('Zu lange Leitung wird ohne Planveraenderung abgelehnt',
    JSON.stringify(await plan()) === vorUnmoeglich);

  pruefe('Keine JavaScript-Seitenfehler', pageErrors.length === 0, pageErrors.join(' | '));
  await context.close();
} finally {
  await browser.close();
}
console.log('\n' + bestanden + ' bestanden, ' + fehlgeschlagen + ' fehlgeschlagen');
process.exit(fehlgeschlagen ? 1 : 0);
