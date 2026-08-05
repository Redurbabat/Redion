/* Notions eigene Schreibweisen: verschachtelte Werte und der Formelbaum v2 */
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
  const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
  const fehler: any[] = [];
  p.on('pageerror', e => fehler.push('JS: ' + e.message));
  await p.goto('file://' + WURZEL + '/index.html');
  await p.waitForTimeout(1600);

  /* --- 1 · Werte lesen --------------------------------------------------- */
  const lesen = await p.evaluate(() => {
    const L = NotionFormat.wertLesen;
    return {
      zahl:      L([['80']], 'number'),
      text:      L([['Hallo']]),
      zwei:      L([['Hallo'], [' Welt']]),
      fett:      L([['Hallo', [['b']]]]),
      haken:     L([['Yes']], 'checkbox'),
      keinHaken: L([['No']], 'checkbox'),
      datum:     L([['‣', [['d', { type: 'date', start_date: '2026-08-03' }]]]]),
      datumZeit: L([['‣', [['d', { type: 'datetime', start_date: '2026-08-03', start_time: '14:30' }]]]]),
      spanne:    L([['‣', [['d', { start_date: '2026-08-01', end_date: '2026-08-09' }]]]]),
      auswahl:   L([['Fertig']], 'select'),
      mehrfach:  L([['Rot,Blau,Grün']], 'multi'),
      person:    L([['‣', [['u', 'nutzer-1']]]], 'person'),
      relation:  L([['‣', [['p', 'id-eins']]], [','], ['‣', [['p', 'id-zwei']]]], 'relation'),
      adresse:   L([['redion.ch', [['a', 'https://redion.ch']]]]),
      leer:      L([]),
      nichts:    L(null),
      /* Etwas, das schon flach ist, bleibt flach */
      schonFlach: L('einfach so'),
      zahlFlach:  L(42)
    };
  });
  pruef('Zahl aus [["80"]]',            lesen.zahl, 80);
  pruef('Text',                         lesen.text, 'Hallo');
  pruef('Zwei Stücke werden eins',      lesen.zwei, 'Hallo Welt');
  pruef('Fett verliert die Marke',      lesen.fett, 'Hallo');
  pruef('Yes wird wahr',                lesen.haken, true);
  pruef('No wird falsch',               lesen.keinHaken, false);
  pruef('Datum',                        lesen.datum, '2026-08-03');
  pruef('Datum mit Uhrzeit',            lesen.datumZeit, '2026-08-03T14:30');
  pruef('Zeitspanne',                   lesen.spanne, '2026-08-01 → 2026-08-09');
  pruef('Auswahl',                      lesen.auswahl, 'Fertig');
  pruef('Mehrfachauswahl wird Liste',   lesen.mehrfach, ['Rot', 'Blau', 'Grün']);
  pruef('Person wird Liste',            lesen.person, ['nutzer-1']);
  pruef('Verknüpfung mit zwei Zielen',  lesen.relation, ['id-eins', 'id-zwei']);
  pruef('Adresse hinter dem Text',      lesen.adresse, 'https://redion.ch');
  pruef('Leere Liste',                  lesen.leer, '');
  pruef('null',                         lesen.nichts, '');
  pruef('Flacher Text bleibt',          lesen.schonFlach, 'einfach so');
  pruef('Flache Zahl bleibt',           lesen.zahlFlach, 42);

  /* --- 2 · Werte schreiben ----------------------------------------------- */
  const schreiben = await p.evaluate(() => {
    const S = NotionFormat.wertSchreiben;
    return {
      zahl:     S(80, 'number'),
      text:     S('Hallo', 'text'),
      haken:    S(true, 'checkbox'),
      kein:     S(false, 'checkbox'),
      datum:    S('2026-08-03', 'date'),
      datumZeit:S('2026-08-03T14:30', 'date'),
      mehrfach: S(['Rot', 'Blau'], 'multi'),
      relation: S(['a', 'b'], 'relation'),
      person:   S(['u1'], 'person'),
      datei:    S([{ name: 'plan.pdf', url: 'data:,x' }], 'files'),
      leer:     S('', 'text'),
      nichts:   S(null, 'text')
    };
  });
  pruef('Zahl wird [["80"]]',      schreiben.zahl, [['80']]);
  pruef('Text wird [["Hallo"]]',   schreiben.text, [['Hallo']]);
  pruef('wahr wird Yes',           schreiben.haken, [['Yes']]);
  pruef('falsch wird No',          schreiben.kein, [['No']]);
  pruef('Datum als Marke',         schreiben.datum,
        [['‣', [['d', { type: 'date', start_date: '2026-08-03' }]]]]);
  pruef('Datum mit Uhrzeit',       schreiben.datumZeit,
        [['‣', [['d', { type: 'datetime', start_date: '2026-08-03', start_time: '14:30' }]]]]);
  pruef('Mehrfachauswahl mit Komma', schreiben.mehrfach, [['Rot,Blau']]);
  pruef('Verknüpfung mit Trennern',  schreiben.relation,
        [['‣', [['p', 'a']]], [','], ['‣', [['p', 'b']]]]);
  pruef('Person mit u-Marke',      schreiben.person, [['‣', [['u', 'u1']]]]);
  pruef('Datei mit Adresse',       schreiben.datei, [['plan.pdf', [['a', 'data:,x']]]]);
  pruef('Leer bleibt leer',        schreiben.leer, []);
  pruef('null wird leer',          schreiben.nichts, []);

  /* --- 3 · Hin und zurück ------------------------------------------------ */
  const hinZurueck = await p.evaluate(() => {
    const faelle = [
      ['text',     'Hallo Welt'],
      ['number',   1234],
      ['checkbox', true],
      ['checkbox', false],
      ['date',     '2026-12-24'],
      ['date',     '2026-12-24T08:15'],
      ['select',   'In Arbeit'],
      ['multi',    ['A', 'B', 'C']],
      ['relation', ['x1', 'x2']],
      ['url',      'https://redion.ch/pfad?a=1']
    ];
    return faelle.map(([typ, wert]: any[]) => {
      const hin = NotionFormat.wertSchreiben(wert, typ);
      const zurueck = NotionFormat.wertLesen(hin, typ);
      return [typ + ':' + JSON.stringify(wert),
              JSON.stringify(zurueck) === JSON.stringify(wert)];
    });
  });
  hinZurueck.forEach(([n, gut]) => pruef('Hin und zurück ' + n, gut, true));

  /* --- 4 · Auszeichnungen ------------------------------------------------ */
  const marken = await p.evaluate(() => ({
    fett:   NotionFormat.alsMarkdown([['Hallo', [['b']]], [' Welt']]),
    kursiv: NotionFormat.alsMarkdown([['schräg', [['i']]]]),
    code:   NotionFormat.alsMarkdown([['x = 1', [['c']]]]),
    durch:  NotionFormat.alsMarkdown([['weg', [['s']]]]),
    link:   NotionFormat.alsMarkdown([['hier', [['a', 'https://redion.ch']]]]),
    zurueckFett: NotionFormat.ausMarkdown('**Hallo** Welt'),
    zurueckLink: NotionFormat.ausMarkdown('[hier](https://redion.ch)'),
    gemischt: NotionFormat.ausMarkdown('Ein **fettes** und ein *schräges* Wort'),
    rund: NotionFormat.alsMarkdown(NotionFormat.ausMarkdown('**A** *B* `C` ~~D~~'))
  }));
  pruef('Fett wird **',         marken.fett, '**Hallo** Welt');
  pruef('Kursiv wird *',        marken.kursiv, '*schräg*');
  pruef('Code wird Backtick',   marken.code, '`x = 1`');
  pruef('Durchgestrichen ~~',   marken.durch, '~~weg~~');
  pruef('Link in Klammern',     marken.link, '[hier](https://redion.ch)');
  pruef('** wird zur b-Marke',  marken.zurueckFett, [['Hallo', [['b']]], [' Welt']]);
  pruef('Link wird zur a-Marke', marken.zurueckLink, [['hier', [['a', 'https://redion.ch']]]]);
  pruef('Gemischt bleibt vollständig', marken.gemischt.length, 5);
  pruef('Markdown übersteht die Runde', marken.rund, '**A** *B* `C` ~~D~~');

  /* --- 5 · Formeln in Notions Baum --------------------------------------- */
  const formel = await p.evaluate(() => {
    const F = NotionFormat.formelAlsNotion;
    return {
      einfach: F('1 + 2'),
      prop:    F('prop("Preis")'),
      ruf:     F('round(prop("Preis") * 1.081)'),
      text:    F('"Hallo"'),
      bool:    F('true'),
      wenn:    F('if(prop("Zahl") > 10, "gross", "klein")'),
      undOder: F('prop("A") and prop("B")'),
      negativ: F('-5'),
      nicht:   F('not(prop("Haken"))'),
      kaputt:  F('prop( "unfertig')
    };
  });
  pruef('1 + 2 wird add',            formel.einfach.name, 'add');
  pruef('Als operator, nicht function', formel.einfach.type, 'operator');
  pruef('Ergebnistyp Zahl',          formel.einfach.result_type, 'number');
  pruef('Beide Seiten sind Konstanten',
        formel.einfach.args.map((a: any) => a.type), ['constant', 'constant']);
  pruef('prop wird eigener Knoten',  formel.prop.type, 'property');
  pruef('Mit dem Spaltennamen',      formel.prop.name, 'Preis');
  pruef('round bleibt eine Funktion', formel.ruf.name, 'round');
  pruef('Und hat ein Argument',      formel.ruf.args.length, 1);
  pruef('Darin steckt multiply',     formel.ruf.args[0].name, 'multiply');
  pruef('Text wird Konstante',       formel.text.value_type, 'string');
  pruef('Wahrheitswert wird checkbox', formel.bool.result_type, 'checkbox');
  pruef('if bekommt drei Argumente', formel.wenn.args.length, 3);
  pruef('and ist eine function',     formel.undOder.type, 'function');
  pruef('Minus wird 0 minus x',      formel.negativ.args[0].value, '0');
  pruef('not bleibt not',            formel.nicht.name, 'not');
  pruef('Kaputte Formel gibt null',  formel.kaputt, null);

  /* --- 6 · Und wieder zurück --------------------------------------------- */
  const zurueck = await p.evaluate(() => {
    const F = NotionFormat.formelAusNotion;
    return {
      add: F({ type: 'operator', name: 'add', args: [
        { type: 'constant', value_type: 'number', value: '1' },
        { type: 'constant', value_type: 'number', value: '2' }] }),
      prop: F({ type: 'property', name: 'Preis' }),
      klammern: F({ type: 'operator', name: 'multiply', args: [
        { type: 'operator', name: 'add', args: [
          { type: 'property', name: 'A' }, { type: 'property', name: 'B' }] },
        { type: 'constant', value_type: 'number', value: '2' }] }),
      ohneKlammern: F({ type: 'operator', name: 'add', args: [
        { type: 'operator', name: 'multiply', args: [
          { type: 'property', name: 'A' }, { type: 'property', name: 'B' }] },
        { type: 'constant', value_type: 'number', value: '2' }] }),
      funktion: F({ type: 'function', name: 'round', args: [
        { type: 'property', name: 'X' }] }),
      text: F({ type: 'constant', value_type: 'string', value: 'Hallo' }),
      alsText: F('{"type":"property","name":"Aus JSON"}'),
      unsinn: F('kein json'),
      nichts: F(null)
    };
  });
  pruef('add wird wieder +',          zurueck.add, '1 + 2');
  pruef('property wird prop()',       zurueck.prop, 'prop("Preis")');
  pruef('Klammern nur wo nötig',      zurueck.klammern, '(prop("A") + prop("B")) * 2');
  pruef('Und sonst keine',            zurueck.ohneKlammern, 'prop("A") * prop("B") + 2');
  pruef('Funktion bleibt Funktion',   zurueck.funktion, 'round(prop("X"))');
  pruef('Text bekommt Anführungszeichen', zurueck.text, '"Hallo"');
  pruef('JSON als Zeichenkette geht auch', zurueck.alsText, 'prop("Aus JSON")');
  pruef('Unsinn gibt leer',           zurueck.unsinn, '');
  pruef('null gibt leer',             zurueck.nichts, '');

  /* --- 7 · Der Rundlauf rechnet noch dasselbe --------------------------- */
  const rund = await p.evaluate(() => {
    const proben = [
      '1 + 2 * 3',
      'prop("Menge") * prop("Preis")',
      'round(prop("Summe") * 1.081)',
      'if(prop("Zahl") > 10, "gross", "klein")',
      'concat("a", "b", "c")',
      '(prop("A") + prop("B")) / 2',
      'not(prop("Haken"))',
      'length(prop("Titel")) > 5'
    ];
    return proben.map(f => {
      const r = NotionFormat.rundlauf(f);
      /* Und ob beide Fassungen dasselbe rechnen */
      const werte: Record<string, any> = { Menge: 3, Preis: 4, Summe: 100, Zahl: 20, A: 6, B: 4,
                      Haken: false, Titel: 'Hallo Welt' };
      const hole = (n: any) => werte[n] ?? null;
      const a = Formula.run(f, hole);
      const c = Formula.run(r.zurueck, hole);
      return [f, r.ok, JSON.stringify(a.wert) === JSON.stringify(c.wert)];
    });
  });
  rund.forEach(([f, gut, gleich]) => {
    pruef('Rundlauf gültig: ' + f, gut, true);
    pruef('Und rechnet dasselbe: ' + f, gleich, true);
  });

  /* --- 8 · Seiten-IDs ---------------------------------------------------- */
  const ids = await p.evaluate(() => ({
    hin:  NotionFormat.idMitStrichen('1f2a3b4c5d6e7f8091a2b3c4d5e6f708'),
    her:  NotionFormat.idOhneStriche('1f2a3b4c-5d6e-7f80-91a2-b3c4d5e6f708'),
    rund: NotionFormat.idMitStrichen(NotionFormat.idOhneStriche(
            '1f2a3b4c-5d6e-7f80-91a2-b3c4d5e6f708')),
    kurz: NotionFormat.idMitStrichen('zukurz')
  }));
  pruef('ID bekommt Striche', ids.hin, '1f2a3b4c-5d6e-7f80-91a2-b3c4d5e6f708');
  pruef('Und verliert sie wieder', ids.her, '1f2a3b4c5d6e7f8091a2b3c4d5e6f708');
  pruef('Hin und zurück bleibt gleich', ids.rund, '1f2a3b4c-5d6e-7f80-91a2-b3c4d5e6f708');
  pruef('Zu kurze ID bleibt unverändert', ids.kurz, 'zukurz');

  /* --- 9 · Eine ganze Notion-Sammlung einlesen -------------------------- */
  const einlesen = await p.evaluate(async () => {
    const roh = {
      name: [['Bestellungen']],
      schema: {
        title: { name: [['Artikel']], type: 'title' },
        menge: { name: [['Menge']],   type: 'number' },
        preis: { name: [['Preis']],   type: 'number' },
        st:    { name: [['Status']],  type: 'select',
                 options: [{ value: 'Offen' }, { value: 'Bezahlt' }] },
        summe: { name: [['Summe']],   type: 'formula',
                 formula: { type: 'operator', name: 'multiply', args: [
                   { type: 'property', name: 'Menge' },
                   { type: 'property', name: 'Preis' }] } }
      },
      rows: [
        { properties: { title: [['Schrauben']], menge: [['4']], preis: [['2.5']],
                        st: [['Offen']] } },
        { properties: { title: [['Nägel']],     menge: [['10']], preis: [['0.9']],
                        st: [['Bezahlt']] } }
      ]
    };
    const seite = Store.addBlock(null, 'page', { text: 'Notion-Rohform' });
    const erg = Austausch.ausNotionJson(roh, seite.id, 'Ersatz');
    await new Promise(r => setTimeout(r, 400));
    const c = Object.values(Store.cache.collections).find(x => x.name === 'Bestellungen');
    const zeilen = Store.rowsOf(c.id);
    const erste = zeilen.find(z => z.text === 'Schrauben');
    return { erg,
             sammlung: !!c,
             spalten: Object.keys(c.schema).length,
             formelText: c.schema.summe.formula,
             optionen: c.schema.st.options,
             zeilen: zeilen.length,
             titel: zeilen.map(z => z.text).sort(),
             menge: erste.props.menge,
             summe: Datenbank.wert(erste, 'summe', c) };
  });
  pruef('Die Sammlung entstand',        einlesen.sammlung, true);
  pruef('Fünf Spalten',                 einlesen.spalten, 5);
  pruef('Die Formel wurde übersetzt',   einlesen.formelText, 'prop("Menge") * prop("Preis")');
  pruef('Die Auswahlwerte kamen mit',   einlesen.optionen, ['Offen', 'Bezahlt']);
  pruef('Zwei Zeilen',                  einlesen.zeilen, 2);
  pruef('Mit den richtigen Titeln',     einlesen.titel, ['Nägel', 'Schrauben']);
  pruef('Die Zahl ist eine Zahl',       einlesen.menge, 4);
  pruef('Und die Formel rechnet',       einlesen.summe, 10);
  pruef('Der Bericht zählt die Formel', einlesen.erg.formeln, 1);
  pruef('Und die Werte',                einlesen.erg.werte, 8);

  /* --- 10 · Das Fenster --------------------------------------------------- */
  const fenster = await p.evaluate(async () => {
    document.querySelectorAll<HTMLElement>('.overlay').forEach(o => o.remove());
    NotionFormat.dialog();
    await new Promise(r => setTimeout(r, 300));
    document?.querySelector<HTMLElement>('[data-a="hin"]')?.click();
    await new Promise(r => setTimeout(r, 250));
    const baum = document.querySelector<HTMLElement>('#nf-aus')?.textContent;
    document?.querySelector<HTMLElement>('[data-a="rund"]')?.click();
    await new Promise(r => setTimeout(r, 250));
    const rundText = document.querySelector<HTMLElement>('#nf-aus')?.textContent;
    document?.querySelector<HTMLElement>('[data-a="md"]')?.click();
    await new Promise(r => setTimeout(r, 250));
    const md = document.querySelector<HTMLElement>('#nf-aus2')?.textContent;
    const _el821 = document.querySelector<HTMLInputElement>('#nf-wert');
    if (!_el821) throw new Error('#nf-wert ist nicht da — der Lauf misst sonst nichts.');
    _el821.value = 'kein json';
    document?.querySelector<HTMLElement>('[data-a="lesen"]')?.click();
    await new Promise(r => setTimeout(r, 200));
    const meckert = document.querySelector<HTMLElement>('#nf-aus2')?.textContent;
    const breit = (document.querySelector('.overlay .finder') ?? document.body).getBoundingClientRect();
    document.querySelectorAll<HTMLElement>('.overlay').forEach(o => o.remove());
    return { baum, rundText, md, meckert, passt: breit.right <= innerWidth + 1 };
  });
  pruef('Das Fenster zeigt einen Baum', fenster.baum?.includes('"type"'), true);
  pruef('Der Rundlauf meldet Erfolg',   fenster.rundText?.includes('✅'), true);
  pruef('Markdown mit Fettschrift',     fenster.md, '**Hallo** Welt');
  pruef('Unsinn wird gemeldet',         fenster.meckert?.includes('kein gültiges JSON'), true);
  pruef('Das Fenster passt',            fenster.passt, true);

  /* Und über die Befehlspalette erreichbar */
  const palette = await p.evaluate(async () => {
    Werkzeuge.palette();
    await new Promise(r => setTimeout(r, 250));
    const inp = document.querySelector<HTMLInputElement>('#cq');
    if (!inp) throw new Error('#cq ist nicht da — der Lauf misst sonst nichts.');
    inp.value = 'Notion-Formate';
    inp.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise(r => setTimeout(r, 250));
    const t = (document.querySelector('#cr button') || {}).textContent || '';
    document.querySelectorAll<HTMLElement>('.overlay').forEach(o => o.remove());
    return (t ?? '').includes('Notion-Formate');
  });
  pruef('In der Befehlspalette zu finden', palette, true);

  /* --- 11 · Am Telefon ---------------------------------------------------- */
  const handy = await b.newPage({ viewport: { width: 428, height: 926 }, isMobile: true, hasTouch: true });
  const fehler2: any[] = [];
  handy.on('pageerror', e => fehler2.push('JS: ' + e.message));
  await handy.goto('file://' + WURZEL + '/index.html');
  await handy.waitForTimeout(1800);
  const amHandy = await handy.evaluate(async () => {
    NotionFormat.dialog();
    await new Promise(r => setTimeout(r, 300));
    const f = (document.querySelector('.overlay .finder') ?? document.body).getBoundingClientRect();
    const raus = f.right > innerWidth + 1 || f.left < -1;
    document.querySelectorAll<HTMLElement>('.overlay').forEach(o => o.remove());
    return raus;
  });
  pruef('Auch am Telefon passt es', amHandy, false);

  console.log(`\n${ok}/${ok + bad} bestanden`);
  const alle = [...fehler, ...fehler2];
  console.log(alle.length ? 'JS-Fehler:\n' + alle.join('\n') : 'Keine JS-Fehler.');
  await b.close();
  process.exit(bad || alle.length ? 1 : 0);
})();
