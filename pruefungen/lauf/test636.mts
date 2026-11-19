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

  /* Eine Leitungsstrecke darf beim Vorlageneinsatz weder sichtbar noch
     elektrisch unbeabsichtigt durch ein fremdes Bauteil laufen. Im
     ersten Suchfeld (120/80) wuerde die lange Leitung das vorhandene K1
     quer schneiden, obwohl das neue Symbol selbst nicht auf K1 liegt. */
  const kollisionsBlock = await page.evaluate(async () => {
    Store.setMeta('elektro:planvorlagen', [{
      id: 'kollision636', name: 'Kollisionsprobe', art: 'stromlauf-aufgeloest',
      teile: [{ id: 't', zeichen: 'spule', x: 0, y: 0,
        drehung: 0, gespiegelt: false, bmk: 'K2', nummern: {},
        gruppe: '', ebene: 'plan' }],
      leitungen: [{ id: 'w', punkte: [{ x: 20, y: 30 }, { x: 350, y: 30 }],
        ebene: 'plan', vonTeil: 't', vonNr: 'A1' }]
    }]);
    const sp = Store.addPage(null, { text: 'Kollision 636', icon: '⚡' });
    const block = Store.addBlock(sp.id, 'schaltplan', { text: 'Plan', plan: {
      art: 'stromlauf-aufgeloest', breite: 800, hoehe: 600,
      teile: [{ id: 'bestehend', zeichen: 'spule', x: 320, y: 80,
        drehung: 0, gespiegelt: false, bmk: 'K1', nummern: {},
        gruppe: '', ebene: 'plan' }],
      leitungen: [], texte: [],
      ebenen: [{ id: 'plan', name: 'Plan', farbe: 'var(--text)', sichtbar: true }]
    } });
    await Store.flush();
    App.zeichneBaum();
    App.oeffne(sp.id);
    await new Promise(resolve => setTimeout(resolve, 700));
    document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung')
      .forEach(el => el.remove());
    return block.id as string;
  });
  await einsetzen();
  const kollisionsPlan = await page.evaluate((id: string) =>
    JSON.parse(JSON.stringify(Store.getBlock(id).plan)), kollisionsBlock);
  pruefe('Vorlage mit langer Leitung wird trotz Hindernis eingesetzt',
    kollisionsPlan.teile.length === 2 && kollisionsPlan.leitungen.length === 1);
  const kollisionsFrei = await page.evaluate((id: string) => {
    const p = Store.getBlock(id).plan;
    const bestand = p.teile.find((t: any) => t.id === 'bestehend');
    const leitung = p.leitungen[0];
    if (!bestand || !leitung) return false;
    const m = Register.fachzeichen.masse(bestand.zeichen, bestand.drehung);
    const a = leitung.punkte[0], b = leitung.punkte[1];
    /* Diese Testvorlage hat genau eine horizontale Strecke. */
    return !(a.y >= bestand.y - 6 && a.y <= bestand.y + m.h + 6 &&
      Math.max(a.x, b.x) >= bestand.x - 6 &&
      Math.min(a.x, b.x) <= bestand.x + m.w + 6);
  }, kollisionsBlock);
  pruefe('Eingefuegte Leitung beruehrt kein bestehendes Bauteil', kollisionsFrei);

  /* Eine Vorlage darf keine bestehende Leitung deckungsgleich ueberlagern.
     Eine geometrische Kreuzung ohne Knoten bleibt dagegen erlaubt. */
  const leiterBlock = await page.evaluate(async () => {
    Store.setMeta('elektro:planvorlagen', [{
      id: 'draht-ueberlagerung', name: 'Leitungsueberlagerung',
      art: 'stromlauf-aufgeloest',
      teile: [{ id: 't', zeichen: 'spule', x: 0, y: 0, drehung: 0,
        gespiegelt: false, bmk: 'K2', nummern: {}, gruppe: '', ebene: 'plan' }],
      leitungen: [{ id: 'l', ebene: 'plan',
        punkte: [{ x: 20, y: 30 }, { x: 350, y: 30 }] }]
    }]);
    const seite = Store.addPage(null, { text: 'Leiter 636', icon: '⚡' });
    const block = Store.addBlock(seite.id, 'schaltplan', { text: 'Plan', plan: {
      art: 'stromlauf-aufgeloest', breite: 800, hoehe: 600,
      teile: [{ id: 'weitweg', zeichen: 'spule', x: 600, y: 400,
        drehung: 0, gespiegelt: false, bmk: 'K1', nummern: {},
        gruppe: '', ebene: 'plan' }],
      leitungen: [{ id: 'vorher', ebene: 'plan',
        punkte: [{ x: 300, y: 110 }, { x: 500, y: 110 }] }],
      texte: [],
      ebenen: [{ id: 'plan', name: 'Plan', farbe: 'var(--text)', sichtbar: true }]
    } });
    await Store.flush(); App.zeichneBaum(); App.oeffne(seite.id);
    await new Promise(resolve => setTimeout(resolve, 700));
    document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung')
      .forEach(el => el.remove());
    return block.id as string;
  });
  await einsetzen();
  const leiterPlan = await page.evaluate((id: string) =>
    JSON.parse(JSON.stringify(Store.getBlock(id).plan)), leiterBlock);
  pruefe('Vorlage mit Leitungsueberlagerung findet anderen Platz',
    leiterPlan.leitungen.length === 2 && leiterPlan.teile.length === 2);
  const neueLeitung = leiterPlan.leitungen.find((l: any) => l.id !== 'vorher');
  const alteLeitung = leiterPlan.leitungen.find((l: any) => l.id === 'vorher');
  const schaltplan = (await page.evaluate(() =>
    typeof (window as any).Schaltplan?.ueberlappt === 'function'));
  pruefe('Eingefuegte Leitung ueberdeckt keine bestehende Strecke',
    !!schaltplan && !!neueLeitung && !!alteLeitung &&
      !(await page.evaluate((args: any) =>
        (window as any).Schaltplan.ueberlappt(args.punkte, [args.alt]),
        { punkte: neueLeitung?.punkte, alt: alteLeitung })));

  /* Regressionsfall: eine bereits vorhandene Leitung verläuft dort, wo
     das Symbol der Vorlage bei festem Versatz sitzen würde. Auch OHNE
     kopierte Leitung muss die Platzsuche das bestehende Kabel schützen. */
  const bauteilAufLeitungBlock = await page.evaluate(async () => {
    Store.setMeta('elektro:planvorlagen', [{
      id: 'symbol-kabel-636', name: 'Symbol auf Kabel',
      art: 'stromlauf-aufgeloest',
      teile: [{ id: 'old', zeichen: 'spule', x: 0, y: 0,
        drehung: 0, gespiegelt: false, bmk: 'K2',
        nummern: {}, gruppe: '', ebene: 'plan' }],
      leitungen: []
    }]);
    const sp = Store.addPage(null, { text: 'Bauteil-auf-Leitung 636', icon: '⚡' });
    const block = Store.addBlock(sp.id, 'schaltplan', { text: 'Plan', plan: {
      art: 'stromlauf-aufgeloest', breite: 800, hoehe: 600, teile: [],
      leitungen: [{ id: 'bestehenderDraht', ebene: 'plan',
        punkte: [{ x: 140, y: 110 }, { x: 200, y: 110 }] }],
      texte: [],
      ebenen: [{ id: 'plan', name: 'Plan', farbe: 'var(--text)', sichtbar: true }]
    } });
    await Store.flush(); App.zeichneBaum(); App.oeffne(sp.id);
    await new Promise(resolve => setTimeout(resolve, 700));
    document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung')
      .forEach(el => el.remove());
    return block.id as string;
  });
  await einsetzen();
  const symbolAufDraht = await page.evaluate((id: string) => {
    const plan = Store.getBlock(id).plan;
    const t = plan.teile[0];
    const draht = plan.leitungen[0];
    if (!t || !draht) return { eingefuegt: false, frei: false };
    const m = Register.fachzeichen.masse(t.zeichen, t.drehung);
    const y = draht.punkte[0].y;
    const x1 = Math.min(draht.punkte[0].x, draht.punkte[1].x);
    const x2 = Math.max(draht.punkte[0].x, draht.punkte[1].x);
    const abstand = 6;
    const trifft = y >= t.y - abstand && y <= t.y + m.h + abstand &&
      x2 >= t.x - abstand && x1 <= t.x + m.w + abstand;
    return { eingefuegt: plan.teile.length === 1 && plan.leitungen.length === 1,
      frei: !trifft };
  }, bauteilAufLeitungBlock);
  pruefe('Vorlage mit einem Symbol wird neben vorhandener Leitung eingesetzt',
    symbolAufDraht.eingefuegt);
  pruefe('Kopiertes Symbol schneidet vorhandene Leitung nicht',
    symbolAufDraht.frei);

  /* Die grobe Raster-Suche (40 Schritte) verpasst schmale freie Plaetze.
     Zwischen zwei bestehenden Leitungen bleibt ein 10er-Rasterplatz
     frei: eine Vorlage muss dort eingesetzt werden statt "Kein Platz". */
  const schmaleLueckeId = await page.evaluate(async () => {
    Store.setMeta('elektro:planvorlagen', [{
      id: 'schmale-luecke-636', name: 'Schmale Luecke',
      art: 'stromlauf-aufgeloest',
      teile: [{ id: 'old', zeichen: 'spule', x: 0, y: 0,
        drehung: 0, gespiegelt: false, bmk: 'K1',
        nummern: {}, gruppe: '', ebene: 'plan' }],
      leitungen: []
    }]);
    const sp = Store.addPage(null, { text: 'Schmale Luecke 636', icon: '⚡' });
    const block = Store.addBlock(sp.id, 'schaltplan', { text: 'Plan', plan: {
      art: 'stromlauf-aufgeloest', breite: 120, hoehe: 100,
      teile: [],
      leitungen: [
        { id: 'links', ebene: 'plan',
          punkte: [{ x: 20, y: 20 }, { x: 20, y: 80 }] },
        { id: 'rechts', ebene: 'plan',
          punkte: [{ x: 100, y: 20 }, { x: 100, y: 80 }] }
      ],
      texte: [],
      ebenen: [{ id: 'plan', name: 'Plan', farbe: 'var(--text)', sichtbar: true }]
    } });
    await Store.flush(); App.zeichneBaum(); App.oeffne(sp.id);
    await new Promise(resolve => setTimeout(resolve, 700));
    document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung')
      .forEach(el => el.remove());
    return block.id as string;
  });
  await einsetzen();
  const lueckenPlan = await page.evaluate((id: string) =>
    JSON.parse(JSON.stringify(Store.getBlock(id).plan)), schmaleLueckeId);
  pruefe('Auch schmale 10er-Rasterluecke wird fuer Vorlage gefunden',
    lueckenPlan.teile.length === 1 &&
    lueckenPlan.teile[0].x === 30 && lueckenPlan.teile[0].y === 10);
  pruefe('Bestehende Leitungen bleiben bei der Einfuegung unveraendert',
    lueckenPlan.leitungen.length === 2 &&
    lueckenPlan.leitungen[0].punkte[0].x === 20 &&
    lueckenPlan.leitungen[1].punkte[0].x === 100);

  /* 90-Grad-Symbole rotieren um ihre eigene Mitte. Eine 160x80-
     Drehstromquelle belegt rotiert 80x160, also NICHT den Rahmen
     [x,x+80] × [y,y+160]. Frueher wurde sie bei (120,80) eingefuegt
     und ueberschneidete trotz vermeintlich freier Lage den Schliesser. */
  const gedrehtBlock = await page.evaluate(async () => {
    Store.setMeta('elektro:planvorlagen', [{
      id: 'rotationsrahmen636', name: 'Gedrehte Vorlage',
      art: 'stromlauf-aufgeloest',
      teile: [{ id: 'altD', zeichen: 'drehstromquelle', x: 0, y: 0,
        drehung: 90, gespiegelt: false, bmk: 'G1', nummern: {},
        gruppe: '', ebene: 'plan' }],
      leitungen: []
    }]);
    const sp = Store.addPage(null, { text: 'Rotation 636', icon: '⚡' });
    const block = Store.addBlock(sp.id, 'schaltplan', { text: 'Plan', plan: {
      art: 'stromlauf-aufgeloest', breite: 800, hoehe: 600,
      teile: [{ id: 'bestand', zeichen: 'schliesser', x: 180, y: 10,
        drehung: 0, gespiegelt: false, bmk: 'S1', nummern: {},
        gruppe: '', ebene: 'plan' }],
      leitungen: [], texte: [],
      ebenen: [{ id: 'plan', name: 'Plan', farbe: 'var(--text)', sichtbar: true }]
    } });
    await Store.flush(); App.zeichneBaum(); App.oeffne(sp.id);
    await new Promise(resolve => setTimeout(resolve, 700));
    document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung')
      .forEach(el => el.remove());
    return block.id as string;
  });
  await einsetzen();
  const rotationsErgebnis = await page.evaluate((id: string) => {
    const plan = Store.getBlock(id).plan;
    const kopie = plan.teile.find((t: any) => t.zeichen === 'drehstromquelle');
    const bestand = plan.teile.find((t: any) => t.id === 'bestand');
    if (!kopie || !bestand) return { eingefuegt: false, frei: false, aufBlatt: false };
    const rahmen = (t: any) => {
      const zc = Register.fachzeichen.holen(t.zeichen);
      const m = Register.fachzeichen.masse(t.zeichen, t.drehung);
      const cx = t.x + zc.w / 2, cy = t.y + zc.h / 2;
      return { l: cx - m.w / 2, r: cx + m.w / 2,
        o: cy - m.h / 2, u: cy + m.h / 2 };
    };
    const a = rahmen(kopie), b = rahmen(bestand);
    const kollidiert = a.l < b.r && b.l < a.r && a.o < b.u && b.o < a.u;
    return { eingefuegt: plan.teile.length === 2 && kopie.drehung === 90,
      frei: !kollidiert, aufBlatt: a.l >= 10 && a.o >= 10 &&
        a.r <= plan.breite - 10 && a.u <= plan.hoehe - 10 };
  }, gedrehtBlock);
  pruefe('Gedrehtes Symbol wird als Vorlage eingesetzt',
    rotationsErgebnis.eingefuegt);
  pruefe('Gedrehter Originalmittelpunkt-Rahmen kollidiert nicht und bleibt im Plan',
    rotationsErgebnis.frei && rotationsErgebnis.aufBlatt);

  /* Versteckte Aufgaben-/Loesungsebenen duerfen keine Einfuegeposition
     blockieren. alsSvg() und Anschlussfang blenden sie bereits aus;
     die Platzsuche muss dieselbe Sichtbarkeit verwenden. Die beiden
     Varianten pruefen alte Bauteile und alte Leitungen unabhaengig. */
  const versteckteEbene = async (art: 'teil' | 'leitung'): Promise<any> => {
    const id = await page.evaluate(async (welche: 'teil' | 'leitung') => {
      Store.setMeta('elektro:planvorlagen', [{
        id: 'sichtbarkeit636', name: 'Sichtbarkeit',
        art: 'stromlauf-aufgeloest',
        teile: [{ id: 'neu-alt', zeichen: 'spule', x: 0, y: 0,
          drehung: 0, gespiegelt: false, bmk: 'K2',
          nummern: {}, gruppe: '', ebene: 'plan' }],
        leitungen: []
      }]);
      const sp = Store.addPage(null, { text: 'Unsichtbar 636 ' + welche, icon: '⚡' });
      const block = Store.addBlock(sp.id, 'schaltplan', { text: 'Plan', plan: {
        art: 'stromlauf-aufgeloest', breite: 800, hoehe: 600,
        teile: welche === 'teil'
          ? [{ id: 'verstecktesTeil', zeichen: 'spule', x: 120, y: 80,
              drehung: 0, gespiegelt: false, bmk: 'K1',
              nummern: {}, gruppe: '', ebene: 'loesung' }]
          : [],
        leitungen: welche === 'leitung'
          ? [{ id: 'versteckterDraht', ebene: 'loesung',
              punkte: [{ x: 140, y: 110 }, { x: 200, y: 110 }] }]
          : [],
        texte: [],
        ebenen: [
          { id: 'plan', name: 'Plan', farbe: 'var(--text)', sichtbar: true },
          { id: 'loesung', name: 'Loesung', farbe: '#0a0', sichtbar: false }
        ]
      } });
      await Store.flush(); App.zeichneBaum(); App.oeffne(sp.id);
      await new Promise(resolve => setTimeout(resolve, 700));
      document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung')
        .forEach(el => el.remove());
      return block.id as string;
    }, art);
    await einsetzen();
    return page.evaluate((bid: string) =>
      JSON.parse(JSON.stringify(Store.getBlock(bid).plan)), id);
  };

  const nebenVerstecktemTeil = await versteckteEbene('teil');
  const sichtbaresTeil = nebenVerstecktemTeil.teile.find((t: any) =>
    t.ebene === 'plan' && t.id !== 'verstecktesTeil');
  pruefe('Verstecktes Bauteil blockiert freie Vorlagenposition nicht',
    nebenVerstecktemTeil.teile.length === 2 &&
    sichtbaresTeil?.x === 120 && sichtbaresTeil?.y === 80 &&
    nebenVerstecktemTeil.teile.find((t: any) =>
      t.id === 'verstecktesTeil')?.ebene === 'loesung');

  const nebenVersteckterLeitung = await versteckteEbene('leitung');
  pruefe('Versteckte Leitung blockiert freie Vorlagenposition nicht',
    nebenVersteckterLeitung.teile.length === 1 &&
    nebenVersteckterLeitung.teile[0].x === 120 &&
    nebenVersteckterLeitung.teile[0].y === 80 &&
    nebenVersteckterLeitung.leitungen.length === 1 &&
    nebenVersteckterLeitung.leitungen[0].id === 'versteckterDraht');

  /* Eine gespeicherte Vorlage kann nach dem Entfernen eines benutzer-
     definierten Symbols unvollstaendig sein. Nicht nur das fehlende
     Symbol, sondern die gesamte Einfuegung muss dann entfallen:
     keinerlei geisterhafte 0x0-Bauteile und kein partieller Undo-Schritt. */
  const unbekanntBlock = await page.evaluate(async () => {
    Store.setMeta('elektro:planvorlagen', [{
      id: 'unbekannt636', name: 'Fehlendes Zeichen',
      art: 'stromlauf-aufgeloest',
      teile: [
        { id: 'altOK', zeichen: 'spule', x: 0, y: 0, drehung: 0,
          gespiegelt: false, bmk: 'K1', nummern: {}, gruppe: '', ebene: 'plan' },
        { id: 'altFehlt', zeichen: 'nicht-registriert-636', x: 120, y: 0,
          drehung: 0, gespiegelt: false, bmk: 'X1', nummern: {}, gruppe: '', ebene: 'plan' }
      ],
      leitungen: [{ id: 'altDraht', punkte: [
        { x: 30, y: 60 }, { x: 150, y: 60 }
      ], ebene: 'plan' }]
    }]);
    const sp = Store.addPage(null, { text: 'Ungültige Vorlage 636', icon: '⚡' });
    const block = Store.addBlock(sp.id, 'schaltplan', { text: 'Plan', plan: {
      art: 'stromlauf-aufgeloest', breite: 800, hoehe: 600,
      teile: [{ id: 'bestand', zeichen: 'spule', x: 300, y: 200,
        drehung: 0, gespiegelt: false, bmk: 'K3',
        nummern: {}, gruppe: '', ebene: 'plan' }],
      leitungen: [], texte: [],
      ebenen: [{ id: 'plan', name: 'Plan', farbe: 'var(--text)', sichtbar: true }]
    } });
    await Store.flush(); App.zeichneBaum(); App.oeffne(sp.id);
    await new Promise(resolve => setTimeout(resolve, 700));
    document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung')
      .forEach(el => el.remove());
    return block.id as string;
  });
  const vorUnbekannt = await page.evaluate((id: string) =>
    JSON.stringify(Store.getBlock(id).plan), unbekanntBlock);
  await einsetzen();
  const nachUnbekannt = await page.evaluate((id: string) =>
    JSON.stringify(Store.getBlock(id).plan), unbekanntBlock);
  pruefe('Vorlage mit unbekanntem Fachzeichen wird komplett abgelehnt',
    nachUnbekannt === vorUnbekannt);
  const uPlan = await page.evaluate((id: string) =>
    JSON.parse(JSON.stringify(Store.getBlock(id).plan)), unbekanntBlock);
  pruefe('Weder Ghost-Symbol noch teilweise kopierte Leitung entsteht',
    uPlan.teile.length === 1 && uPlan.teile[0].id === 'bestand' &&
    uPlan.leitungen.length === 0);

  /* Unvollstaendige oder doppelte Bauteil-IDs duerfen nicht in die
     Zuordnung alter zu neuer Leitungsenden gelangen: eine Map wuerde
     bei doppelten IDs den ersten Anschluss still zum zweiten umbiegen.
     Beide Faelle muessen den Plan vollstaendig unveraendert lassen. */
  for (const [art, ids] of [
    ['doppelt', ['duplikat', 'duplikat']],
    ['fehlend', ['richtig', '']]
  ] as const) {
    await page.evaluate((vorlage: { ids: readonly string[] }) => {
      Store.setMeta('elektro:planvorlagen', [{
        id: 'kaputte-ids-636', name: 'Ungueltige Kennungen',
        art: 'stromlauf-aufgeloest',
        teile: vorlage.ids.map((id, i) => ({
          id, zeichen: 'spule', x: i * 160, y: 0, drehung: 0,
          gespiegelt: false, bmk: 'K' + (i + 1),
          nummern: {}, gruppe: '', ebene: 'plan'
        })),
        leitungen: [{ id: 'zugeordnet', ebene: 'plan',
          vonTeil: vorlage.ids[0], vonNr: 'A2',
          nachTeil: vorlage.ids[1], nachNr: 'A1',
          punkte: [{ x: 30, y: 60 }, { x: 190, y: 0 }] }]
      }]);
    }, { ids });
    const davor = await page.evaluate((id: string) =>
      JSON.stringify(Store.getBlock(id).plan), unbekanntBlock);
    await einsetzen();
    const danach = await page.evaluate((id: string) =>
      JSON.stringify(Store.getBlock(id).plan), unbekanntBlock);
    pruefe('Vorlage mit ' + art + 'en Bauteil-IDs wird ohne Teilkopie abgelehnt',
      davor === danach);
  }

  /* Beschaedigte Vorlagen duerfen weder TypeErrors ausloesen noch
     Leitungen still weglassen. Einfuegung bleibt bei allen Faellen
     atomar, bestehende Bauteile und Verbindungen unveraendert. */
  const falscheLeitungen: Array<{ name: string; leitungen: any[] }> = [
    { name: 'null-Leitung', leitungen: [null] },
    { name: 'fehlender Punkt', leitungen: [{
      id: 'schlecht', punkte: [{ x: 30, y: 60 }, null]
    }] },
    { name: 'nur ein Punkt', leitungen: [{
      id: 'schlecht', punkte: [{ x: 30, y: 60 }]
    }] },
    { name: 'ungueltige Koordinate', leitungen: [{
      id: 'schlecht', punkte: [{ x: 30, y: 60 }, { x: 'NaN', y: 60 }]
    }] }
  ];
  for (const fall of falscheLeitungen) {
    await page.evaluate((leitungen: any[]) => {
      Store.setMeta('elektro:planvorlagen', [{
        id: 'ungueltige-leitungen-636', name: 'Kaputte Leitung',
        art: 'stromlauf-aufgeloest',
        teile: [{ id: 'teil636', zeichen: 'spule', x: 0, y: 0,
          drehung: 0, gespiegelt: false, bmk: 'K1',
          nummern: {}, gruppe: '', ebene: 'plan' }],
        leitungen
      }]);
    }, fall.leitungen);
    const davor = await page.evaluate((id: string) =>
      JSON.stringify(Store.getBlock(id).plan), unbekanntBlock);
    await einsetzen();
    const danach = await page.evaluate((id: string) =>
      JSON.stringify(Store.getBlock(id).plan), unbekanntBlock);
    pruefe('Beschaedigte Vorlage (' + fall.name + ') wird ohne Planverlust abgelehnt',
      davor === danach);
  }

  /* Eine Vorlage mit intern ueberlappenden Bauteilen kann durch
     Verschieben niemals kollisionsfrei werden. Sie muss abgelehnt werden;
     aneinanderliegende, aber nicht ueberlappende Bauteile bleiben gueltig. */
  const vorlageMitAbstand = async (abstand: number): Promise<void> => {
    await page.evaluate((dx: number) => {
      Store.setMeta('elektro:planvorlagen', [{
        id: 'innenkollision636', name: 'Vorlage mit zwei Symbolen',
        art: 'stromlauf-aufgeloest',
        teile: [
          { id: 'innenA', zeichen: 'spule', x: 0, y: 0,
            drehung: 0, gespiegelt: false, bmk: 'K1',
            nummern: {}, gruppe: '', ebene: 'plan' },
          { id: 'innenB', zeichen: 'spule', x: dx, y: 0,
            drehung: 0, gespiegelt: false, bmk: 'K2',
            nummern: {}, gruppe: '', ebene: 'plan' }
        ],
        leitungen: []
      }]);
    }, abstand);
    await einsetzen();
  };

  const vorInnenkollision = await page.evaluate((id: string) =>
    JSON.stringify(Store.getBlock(id).plan), unbekanntBlock);
  await vorlageMitAbstand(20);
  const nachInnenkollision = await page.evaluate((id: string) =>
    JSON.stringify(Store.getBlock(id).plan), unbekanntBlock);
  pruefe('Vorlage mit zwei ueberlappenden Bauteilen wird atomar abgelehnt',
    vorInnenkollision === nachInnenkollision);

  await vorlageMitAbstand(40);
  const beruehrendeBauteile = await page.evaluate((id: string) =>
    JSON.parse(JSON.stringify(Store.getBlock(id).plan)), unbekanntBlock);
  pruefe('Vorlage mit nur aneinanderliegenden Bauteilen bleibt nutzbar',
    beruehrendeBauteile.teile.length === 3 &&
    beruehrendeBauteile.leitungen.length === 0 &&
    beruehrendeBauteile.teile[1].x + 40 === beruehrendeBauteile.teile[2].x &&
    beruehrendeBauteile.teile[1].y === beruehrendeBauteile.teile[2].y);

  pruefe('Keine JavaScript-Seitenfehler', pageErrors.length === 0, pageErrors.join(' | '));
  await context.close();
} finally {
  await browser.close();
}
console.log('\n' + bestanden + ' bestanden, ' + fehlgeschlagen + ' fehlgeschlagen');
process.exit(fehlgeschlagen ? 1 : 0);
