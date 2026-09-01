/* Planen: Zurückstellen, Tagesplan, Wochenrückblick; Befehlspalette */
import _pfad from 'node:path';
const WURZEL = _pfad.resolve(import.meta.dirname, '../..');
import { chromium } from 'playwright';
let ok = 0, bad = 0;
const pruef = (n: any, ist: any, soll: any) => {
  const gut = JSON.stringify(ist) === JSON.stringify(soll);
  console.log((gut ? '✅ ' : '❌ ') + n + (gut ? '' : `  ist=${JSON.stringify(ist)} soll=${JSON.stringify(soll)}`));
  gut ? ok++ : bad++;
};

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1300, height: 900 } });
  const fehler: any[] = [];
  p.on('pageerror', e => fehler.push('JS: ' + e.message));
  await p.goto('file://' + WURZEL + '/index.html');
  await p.waitForTimeout(1500);

  /* --- Aufgaben anlegen ------------------------------------------------ */
  await p.evaluate(async () => {
    const iso = (tage: any) => { const d = new Date(); d.setHours(0,0,0,0);
      d.setDate(d.getDate() + tage);
      const z = (n: any) => String(n).padStart(2, '0');
      return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate()); };

    /* Erst aufräumen: die Beispielinhalte der frischen App würden mitzählen */
    Store.rootPages().forEach(x => Store.trashBlock(x.id));
    Object.keys(Store.cache.collections).forEach(id => { delete Store.cache.collections[id]; });
    Object.values(Store.cache.blocks).forEach(x => { if (x.type === 'todo') x.alive = false; });

    const s = Store.addBlock(null, 'page', { text: 'Projekt' });
    Store.addBlock(s.id, 'todo', { text: 'Blockaufgabe offen', checked: false });
    Store.addBlock(s.id, 'todo', { text: 'Blockaufgabe fertig', checked: true,
                                   erledigtAm: new Date().toISOString() });

    const db = Store.addDatabase(s.id, 'Aufgaben', {
      title:  { name: 'Aufgabe', type: 'title' },
      status: { name: 'Status',  type: 'status', options: [
                 { name: 'Offen', color: 'gray' }, { name: 'Erledigt', color: 'green' } ] },
      wann:   { name: 'Fällig',  type: 'date' }
    });
    const c = Store.getCollection(db.collectionId);
    Store.addRow(c.id, { title: 'Heute fällig',   status: 'Offen',    wann: iso(0) });
    Store.addRow(c.id, { title: 'Gestern fällig', status: 'Offen',    wann: iso(-1) });
    Store.addRow(c.id, { title: 'Nächste Woche',  status: 'Offen',    wann: iso(6) });
    Store.addRow(c.id, { title: 'Ohne Datum',     status: 'Offen' });
    const fertig = Store.addRow(c.id, { title: 'Schon erledigt', status: 'Erledigt', wann: iso(-2) });
    Store.updateBlock(fertig.id, { erledigtAm: new Date().toISOString() });
    App.oeffne(s.id);
    await new Promise(r => setTimeout(r, 400));
    return { seite: s.id, coll: c.id };
  });

  /* --- Aufgaben einsammeln --------------------------------------------- */
  const gesammelt = await p.evaluate(() => {
    const a = Plan.aufgaben();
    return { gesamt: a.length,
             offen: a.filter(x => !x.fertig).length,
             fertig: a.filter(x => x.fertig).length,
             ausBlock: a.filter(x => x.art === 'block').length,
             ausDb: a.filter(x => x.art === 'zeile').length,
             namen: a.map(x => x.text).sort() };
  });
  pruef('Sieben Aufgaben gefunden',   gesammelt.gesamt, 7);
  pruef('Zwei aus Blöcken',           gesammelt.ausBlock, 2);
  pruef('Fünf aus der Datenbank',     gesammelt.ausDb, 5);
  pruef('Zwei sind erledigt',         gesammelt.fertig, 2);
  pruef('Fünf sind offen',            gesammelt.offen, 5);

  /* --- Tagesplan -------------------------------------------------------- */
  await p.evaluate(() => Plan.tagesplan());
  await p.waitForTimeout(350);
  /* DIE KACHELN WERDEN AM SCHILD GELESEN, NICHT AN DER STELLE (E320).
     Hier stand einmal `plan.karten[0]`, `[1]`, `[2]`. Als E308 den Tagesplan
     zum Zeitbudget-Planer machte, tauschten die Kacheln Inhalt und Reihen-
     folge — und die Prüfung meldete vier Fehler, von denen keiner sagte, was
     wirklich los war: sie las weiter Stelle 0 und bekam eine andere Zahl.

     Ein Schild ist der stabile Teil. Wer die Kachel „überfällig" umbenennt
     oder entfernt, bekommt EINEN klaren Fehler an der richtigen Stelle. */
  const plan = await p.evaluate(() => {
    const kachel: Record<string, string> = {};
    document.querySelectorAll<HTMLElement>('.wr-k').forEach(k => {
      const schild = k.querySelector('span')?.textContent?.trim() || '';
      if (schild) kachel[schild] = k.querySelector('b')?.textContent?.trim() || '';
    });
    return {
      kachel,
      ueberschriften: [...document.querySelectorAll<HTMLElement>('.wr-titel')].map(x => x.textContent),
      zeilen: [...document.querySelectorAll<HTMLElement>('.wr-z span:nth-child(2)')].map(x => x.textContent),
      /* Die Zeilen NACH Gruppen, in der Reihenfolge, in der sie stehen. Nur
         so lässt sich eine Kachel gegen die wirklich gezeichnete Liste
         halten statt gegen dieselbe Zahl an zweiter Stelle. */
      gruppen: (() => {
        const g: { titel: string; zeilen: number }[] = [];
        document.querySelectorAll<HTMLElement>('.wr-titel, .wr-z').forEach(el => {
          if (el.classList.contains('wr-titel')) {
            g.push({ titel: el.textContent || '', zeilen: 0 });
          } else if (g.length) { g[g.length - 1]!.zeilen++; }
        });
        return g;
      })(),
      spaeterKnoepfe: document.querySelectorAll('.wr-spaeter').length,
      budget: Number((document.querySelector('#pl-b') as HTMLInputElement)?.value || 0),
      breiteBudget: document.querySelector('#pl-b')?.getBoundingClientRect().width ?? 0,
      breiteDauer:  document.querySelector('#pl-d')?.getBoundingClientRect().width ?? 0
    };
  });

  /* Die vier Kacheln des Planers, jede an ihrem Schild. */
  pruef('Kachel „verplant" ist eine Dauer',
        /(Min\.|Std)/.test(plan.kachel['verplant'] ?? ''), true);
  pruef('Kachel „noch frei" ist eine Dauer',
        /(Min\.|Std)/.test(plan.kachel['noch frei'] ?? ''), true);
  pruef('Eine überfällig',            plan.kachel['überfällig'], '1');
  /* KEINE MAGISCHE ZAHL HIER. Wie viele heute nicht mehr passen, hängt am
     Feinschliff der Verteilung — eine Aufgabe mit sechs Tagen Frist nimmt
     heute nur eine Scheibe —, und genau das prüft test302 mit 64 Punkten.
     Hier zählt die Kachel gegen die GEZEICHNETE Liste.

     UND NICHT GEGEN DIE ÜBERSCHRIFT DANEBEN: die liest `draussen.length`,
     dieselbe Zahl wie die Kachel. Eine Prüfung, die zwei Ausgaben desselben
     Ausdrucks vergleicht, kann nicht rot werden — genau der Fall, den L89
     festhält. Die gezeichneten Zeilen kommen dagegen aus der Schleife
     darunter: fällt dort eine weg oder eine doppelt hinein, sagen Kachel und
     Liste Verschiedenes. */
  const raus = plan.gruppen.find(g => /Heute nicht mehr/.test(g.titel));
  pruef('Die Kachel stimmt mit der gezeichneten Liste überein',
        plan.kachel['passt nicht mehr'], String(raus ? raus.zeilen : 0));

  /* Und keine Aufgabe fällt zwischen die Stühle: was im Tag steht plus was
     draussen bleibt, ist alles, was offen ist. */
  pruef('Jede offene Aufgabe steht in genau einer Gruppe',
        plan.gruppen.reduce((n, g) => n + g.zeilen, 0), gesammelt.offen);

  /* SCHÄRFER ALS DIE ALTE PRÜFUNG: verplant und frei müssen das Budget
     ergeben. Acht Aufgaben zu 30 Minuten gegen 90 Minuten Budget — es passen
     drei, der Rest bleibt draussen, und frei bleibt nichts. Diese Beziehung
     hatte vorher keine Prüfung, und sie kann rot werden: verrechnet sich der
     Planer um einen Posten, stimmt die Summe nicht mehr. */
  const min = (t: string): number => {
    const std = /(\d+)\s*Std/.exec(t); const m = /(\d+)\s*Min/.exec(t);
    const rest = /Std\s+(\d+)/.exec(t);
    return (std ? Number(std[1]) * 60 : 0) + (rest ? Number(rest[1]) : 0) +
           (m && !std ? Number(m[1]) : 0);
  };
  pruef('Verplant und frei ergeben zusammen das Budget',
        min(plan.kachel['verplant'] ?? '') + min(plan.kachel['noch frei'] ?? ''),
        plan.budget);

  /* ZWEI ZAHLENFELDER, DIE DASSELBE TUN, MÜSSEN GLEICH AUSSEHEN (E320).
     Das Budgetfeld war 479 px breit für eine zweistellige Zahl — nicht durch
     Absicht, sondern weil `.finder label input{width:100%}` in werkzeuge.css
     gegen `.pl-budget input{width:76px}` gewann: ein Klassenname plus zwei
     Elemente schlägt einen plus eines. Sein Zwilling `#pl-d` sass in einem
     `span` statt in einem `label` und behielt seine 62 px.

     KANN ER ROT WERDEN? Gemessen: mit der alten Regel 479 gegen 62. Der Punkt
     hat also einen Zustand, in dem er fällt, und den hatte er bis heute. */
  pruef('Das Budgetfeld ist ein Zahlenfeld, kein Textfeld',
        plan.breiteBudget > 0 && plan.breiteBudget <= 120, true);
  pruef('Und es ist so breit wie sein Zwilling im Fuss',
        Math.abs(plan.breiteBudget - plan.breiteDauer) <= 20, true);

  pruef('Der Tag hat eine Überschrift', plan.ueberschriften[0], 'Dein Tag');
  /* ÜBERFÄLLIGES ZUERST — das ist die Zusage, und sie steht jetzt in der
     Reihenfolge statt in einer eigenen Überschrift. Der Planer verteilt nach
     Frist; wer gestern fällig war, steht oben. */
  pruef('Die überfällige Aufgabe steht ganz oben', plan.zeilen[0], 'Gestern fällig');
  pruef('Und die heute fällige darunter, vor allem Späteren',
        plan.zeilen.indexOf('Heute fällig') < plan.zeilen.indexOf('Nächste Woche'), true);
  pruef('Zurückstellen an jeder Zeile', Number(plan.spaeterKnoepfe ?? -1) >= 3, true);

  /* --- Zurückstellen ---------------------------------------------------- */
  const spaeter = await p.evaluate(async () => {
    const a = Plan.aufgaben().find(x => x.text === 'Gestern fällig');
    const d = new Date(); d.setDate(d.getDate() + 3);
    Plan.zurueckstellen(a.id, d, 'Test');
    await new Promise(r => setTimeout(r, 150));
    return { liste: Plan.liste().length,
             amBlock: !!Store.getBlock(a.id).zurueckBis,
             faellig: Plan.faellige().length, id: a.id };
  });
  pruef('Eintrag in der Liste',   spaeter.liste, 1);
  pruef('Am Block vermerkt',      spaeter.amBlock, true);
  pruef('Noch nicht fällig',      spaeter.faellig, 0);

  /* Übersicht */
  await p.evaluate(() => { document.querySelector<HTMLElement>('.overlay [data-a="zu"]')?.click();
                           Plan.uebersicht(); });
  await p.waitForTimeout(300);
  const uebersicht = await p.evaluate(() => ({
    zeilen: document.querySelectorAll('.res [data-id]').length,
    text: (document.querySelector('.res .snip') || {}).textContent
  }));
  pruef('Übersicht zeigt den Eintrag', uebersicht.zeilen, 1);
  pruef('Mit Datum beschriftet',       uebersicht.text?.startsWith('bis '), true);

  /* Wieder holen */
  await p.evaluate(() => document.querySelector<HTMLElement>('[data-holen]')?.click());
  await p.waitForTimeout(350);
  const geholt = await p.evaluate((s) => ({
    liste: Plan.liste().length,
    amBlock: Store.getBlock(s.id).zurueckBis
  }), spaeter);
  pruef('Nach dem Holen leer',     geholt.liste, 0);
  pruef('Vermerk am Block weg',    geholt.amBlock, null);

  /* Fälliges kommt von selbst zurück */
  const zurueck = await p.evaluate(async () => {
    const a = Plan.aufgaben().find(x => x.text === 'Ohne Datum');
    const vorbei = new Date(Date.now() - 60000);
    Plan.zurueckstellen(a.id, vorbei);
    await new Promise(r => setTimeout(r, 100));
    const vorher = Plan.faellige().length;
    const geholt2 = Plan.pruefen();
    return { vorher, geholt: geholt2, danach: Plan.liste().length,
             meldungen: (Werkzeuge.meldungen ? Werkzeuge.meldungen().length : 0) };
  });
  pruef('Fälliges wird erkannt',        zurueck.vorher, 1);
  pruef('Und wieder hochgeholt',        zurueck.geholt, 1);
  pruef('Liste danach leer',            zurueck.danach, 0);
  pruef('Meldung im Posteingang',       Number(zurueck.meldungen ?? -1) >= 1, true);

  /* --- Wochenrückblick -------------------------------------------------- */
  await p.evaluate(() => { document.querySelector<HTMLElement>('.overlay [data-a="zu"]')?.click();
                           Plan.wochenrueckblick(); });
  await p.waitForTimeout(400);
  const woche = await p.evaluate(() => ({
    karten: [...document.querySelectorAll<HTMLElement>('.wr-k b')].map(x => x.textContent),
    balken: document.querySelectorAll('.wr-b').length,
    titel: [...document.querySelectorAll<HTMLElement>('.wr-titel')].map(x => x.textContent),
    erledigt: [...document.querySelectorAll<HTMLElement>('.wr-p.gut')].length
  }));
  pruef('Zwei erledigte diese Woche', woche.karten[0], '2');
  pruef('Sieben Balken',              woche.balken, 7);
  pruef('Balkenüberschrift da',       (woche.titel ?? '').includes('Erledigt je Tag'), true);
  pruef('Erledigtes mit Haken',       woche.erledigt, 2);

  /* Woche davor hat andere Zahlen */
  await p.evaluate(() => document.querySelector<HTMLElement>('[data-v="-1"]')?.click());
  await p.waitForTimeout(400);
  const davor = await p.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('.wr-k b')].map(x => x.textContent)[0]);
  pruef('Woche davor: nichts erledigt', davor, '0');

  /* Als Seite anlegen */
  await p.evaluate(() => { document.querySelector<HTMLElement>('.overlay [data-a="zu"]')?.click();
                           Plan.wochenrueckblick(); });
  await p.waitForTimeout(350);
  await p.evaluate(() => document.querySelector<HTMLElement>('[data-a="seite"]')?.click());
  await p.waitForTimeout(500);
  const alsSeite = await p.evaluate(() => {
    const s = Store.getBlock(App.aktuelleSeite());
    return { titel: s.text,
             bloecke: Store.childrenOf(s.id).map((b: any) => b.type),
             texte: Store.childrenOf(s.id).map((b: any) => b.text) };
  });
  pruef('Seite mit Rückblick angelegt', alsSeite.titel.startsWith('Wochenrückblick'), true);
  pruef('Zahlen als Liste drin',        (alsSeite.bloecke ?? '').includes('bullet'), true);
  pruef('Aufgaben als Kästchen',        (alsSeite.bloecke ?? '').includes('todo'), true);

  /* --- Befehlspalette --------------------------------------------------- */
  const palette = await p.evaluate(async () => {
    Werkzeuge.palette();
    await new Promise(r => setTimeout(r, 250));
    const inp = document.querySelector<HTMLInputElement>('#cq');
    if (!inp) throw new Error('#cq ist nicht da — der Lauf misst sonst nichts.');
    const tippen = async (t: any) => {
      inp.value = t;
      inp.dispatchEvent(new Event('input', { bubbles: true }));
      await new Promise(r => setTimeout(r, 120));
      return [...document.querySelectorAll<HTMLElement>('#cr button')].map(x => (x.textContent ?? '').trim());
    };
    const unscharf = await tippen('wchrck');       /* Wochenrückblick, ohne Vokale */
    const genau    = await tippen('Tagesplan');
    const seiten   = await tippen('Projekt');
    const gruppen  = [...document.querySelectorAll<HTMLElement>('#cr .grp')].map(x => x.textContent);
    document.querySelector('.overlay')?.remove();
    return { unscharf: unscharf[0], genau: genau[0], seiten, gruppen };
  });
  pruef('Unscharfe Suche findet den Wochenrückblick',
        (palette.unscharf || '').includes('Wochenrückblick'), true);
  pruef('Genaue Suche findet den Tagesplan',
        (palette.genau || '').includes('Tagesplan'), true);
  pruef('Seiten tauchen in der Palette auf',
        palette.seiten.some(x => (x ?? '').includes('Projekt')), true);
  pruef('Gruppe „Seiten" vorhanden', (palette.gruppen ?? '').includes('Seiten'), true);

  /* Häufig Benutztes steht oben */
  const gemerkt = await p.evaluate(async () => {
    Store.setMeta('paletteOft', { 'Tagesplan': 20 });
    Werkzeuge.palette();
    await new Promise(r => setTimeout(r, 250));
    const erste = document.querySelector<HTMLElement>('#cr button')?.textContent.trim();
    document.querySelector('.overlay')?.remove();
    return erste;
  });
  pruef('Oft Benutztes steht oben', (gemerkt ?? '').includes('Tagesplan'), true);

  console.log(`\n${ok}/${ok + bad} bestanden`);
  console.log(fehler.length ? 'JS-Fehler:\n' + fehler.join('\n') : 'Keine JS-Fehler.');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
