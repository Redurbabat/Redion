/* ============================================================================
 * vorlagen.js — Die Vorlagengalerie
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/bereiche/vorlagen/daten.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/bereiche/vorlagen/daten.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
 * Fertige Aufbauten, die man mit einem Klick anlegt. Zwei davon kommen
 * wörtlich aus der Dokumentation:
 *
 *   Habit-Tracker   Teil 12 — die reparierte 100-Punkte-Formel
 *   Fitness-OS      Teil 16 — zehn verknüpfte Datenbanken
 *
 * Dazu einige, die man ständig braucht: Projekte, Lesetagebuch,
 * Wissensdatenbank, Wochenplan.
 * ==========================================================================*/

const Galerie = (() => {

  /* Das angeklickte Element — oder nichts. `e.target` ist `EventTarget | null`
     und muss ein `Element` sein, bevor `closest` daran etwas findet. Vorher
     stand hier ungeprüft `e.target.closest(…)`: bei einem Klick, dessen Ziel
     kein Element ist, warf das mitten im Behandeln. */
  const elVon = (e: Event): Element | null =>
    e.target instanceof Element ? e.target : null;

  const esc = (s: any) => String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const heute = () => new Date().toISOString().slice(0, 10);
  const inTagen = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };

  /* Kurzschreibweise für Auswahloptionen */
  const opt = (...paare: string[][]) => paare.map(([name, color]) => ({ name, color }));

  /* Eine Ansicht anlegen und gleich einrichten. `addView` gibt `null`
     zurück, wenn es die Sammlung nicht gibt — dann gibt es auch nichts
     einzustellen. Vorher stand an neun Stellen `Store.updateView(x.id, …)`
     direkt hinter dem `addView`, ohne dazwischen zu prüfen. */
  const sicht = (collectionId: any, layout: string, name: string, patch: any) => {
    const v = Store.addView(collectionId, layout, name);
    if (v) Store.updateView(v.id, patch);
    return v;
  };

  /* ========================================================================
   * 1. HABIT-TRACKER   (Teil 12)
   * ======================================================================*/
  const habitTracker = () => {
    const p = Store.addPage(null, { text: 'Habit-Tracker', icon: '📊' });

    Store.addBlock(p.id, 'h1', { text: 'Täglich eintragen, monatlich auswerten' });
    Store.addBlock(p.id, 'callout', {
      text: 'Der **Habit Score** vergibt 100 Punkte: Gym 20, Schlaf 20, Fitness 15, Lesen 15, ' +
            'Wasser 15, Selbstkontrolle 15. Kalorien und Gewicht bleiben bewusst draussen — ' +
            'das eine ist ohne Ziel nicht fair bewertbar, das andere ist Ergebnis, kein Verhalten.',
      icon: '🎯', color: 'bg-blue'
    });

    const schema = {
      title: { name: 'Datum', type: 'title' },
      dt:  { name: 'DATUM', type: 'date' },
      gym: { name: 'GYM', type: 'checkbox' },
      fit: { name: 'Fitness', type: 'checkbox' },
      les: { name: 'Lesen', type: 'checkbox' },
      was: { name: 'Wasser', type: 'number' },
      sch: { name: 'SCHLAFZEITEN', type: 'number' },
      kcal:{ name: 'KCAL', type: 'number' },
      gew: { name: 'GEWICHT', type: 'number' },
      sel: { name: 'SELBSTKONTROLLE', type: 'number' },

      score: { name: 'Habit Score', type: 'formula', anzeige: 'bar', max: 100, formula:
        'round(' +
        'if(prop("GYM"), 20, 0) + if(prop("Fitness"), 15, 0) + if(prop("Lesen"), 15, 0) + ' +
        'if(empty(prop("Wasser")), 0, min(prop("Wasser") / 2, 1) * 15) + ' +
        'if(empty(prop("SCHLAFZEITEN")), 0, ' +
          'if(and(prop("SCHLAFZEITEN") >= 7, prop("SCHLAFZEITEN") <= 9), 20, ' +
          'if(and(prop("SCHLAFZEITEN") >= 6, prop("SCHLAFZEITEN") < 7), 12, ' +
          'if(and(prop("SCHLAFZEITEN") > 9, prop("SCHLAFZEITEN") <= 10), 12, 0)))) + ' +
        'if(empty(prop("SELBSTKONTROLLE")), 0, min(prop("SELBSTKONTROLLE"), 10) / 10 * 15)' +
        ')' },

      voll: { name: 'Tag vollständig?', type: 'formula', formula:
        'or(prop("GYM"), prop("Fitness"), prop("Lesen"), ' +
        'not(empty(prop("Wasser"))), not(empty(prop("SCHLAFZEITEN"))), ' +
        'not(empty(prop("SELBSTKONTROLLE"))))' },

      erf: { name: 'Habit erfüllt?', type: 'formula', formula: 'prop("Habit Score") >= 70' },

      ampel: { name: 'Ampel', type: 'formula', formula:
        'if(not(prop("Tag vollständig?")), "⚪", ' +
        'if(prop("Habit Score") >= 80, "🟢", if(prop("Habit Score") >= 50, "🟡", "🟠")))' },

      balken: { name: 'Fortschritt', type: 'formula', formula:
        'repeat("█", round(prop("Habit Score") / 10)) + repeat("░", 10 - round(prop("Habit Score") / 10))' },

      woche: { name: 'Woche', type: 'formula', formula: 'formatDate(prop("DATUM"), "YYYY-[KW]WW")' },
      monat: { name: 'Monat', type: 'formula', formula: 'formatDate(prop("DATUM"), "YYYY-MM")' },
      wtag:  { name: 'Wochentag', type: 'formula', formula: 'formatDate(prop("DATUM"), "dddd")' },
      szone: { name: 'Schlaf-Zone', type: 'formula', formula:
        'if(empty(prop("SCHLAFZEITEN")), "—", ' +
        'if(prop("SCHLAFZEITEN") < 6, "zu wenig", if(prop("SCHLAFZEITEN") <= 9, "gut", "viel")))' },
      wziel: { name: 'Wasser-Ziel erreicht?', type: 'formula', formula: 'prop("Wasser") >= 2' },
      notiz: { name: 'Notizen', type: 'text' }
    };

    const { collectionId } = Store.addDatabase(p.id, 'Tagesdaten', schema, 'table');

    /* Sechs Ansichten wie im Bauplan */
    sicht(collectionId, 'table', 'Heute', { filters: { operator: 'and', rules: [{ key: 'dt', op: 'ist heute', wert: '' }] } });

    sicht(collectionId, 'table', 'Echte Tage', {
      filters: { operator: 'and', rules: [{ key: 'voll', op: 'ist aktiviert', wert: '' }] },
      sorts: [{ key: 'dt', richtung: 'ab' }]
    });

    sicht(collectionId, 'calendar', 'Kalender', { dateKey: 'dt' });

    sicht(collectionId, 'chart', 'Wochenreview', { chartGruppe: 'woche', chartWert: 'score', chartTyp: 'bar' });

    sicht(collectionId, 'table', 'Schwache Tage', {
      filters: { operator: 'and', rules: [
        { key: 'voll', op: 'ist aktiviert', wert: '' },
        { key: 'score', op: 'kleiner als', wert: '50' }
      ]},
      sorts: [{ key: 'dt', richtung: 'ab' }]
    });

    sicht(collectionId, 'chart', 'Körper', { chartGruppe: 'woche', chartWert: 'gew', chartTyp: 'line' });

    /* Drei Beispieltage, damit man sofort etwas sieht */
    [[0, true, true, true, 2.4, 8, 2100, 78.5, 8],
     [-1, false, true, false, 1.2, 6.5, 2600, 78.8, 6],
     [-2, true, false, true, 2.0, 7.5, 2200, 78.6, 7]].forEach(([tag, gym, fit, les, was, sch, kcal, gew, sel]: any[]) => {
      const d = inTagen(tag);
      const r = Store.addRow(collectionId, { dt: d, gym, fit, les, was, sch, kcal, gew, sel });
      Store.updateBlock(r.id, { text: d });
    });

    Store.addBlock(p.id, 'h2', { text: 'So arbeitest du damit' });
    ['Jeden Abend eine Zeile ausfüllen — die Ansicht **Heute** zeigt nur den heutigen Tag',
     'Der Score rechnet sich selbst aus, der Balken zeigt ihn auf einen Blick',
     '**Echte Tage** blendet leere Zeilen aus, damit Durchschnitte stimmen',
     '**Wochenreview** zeigt, ob es aufwärts geht',
     '**Schwache Tage** ist die ehrliche Liste — dort steht, woran es lag']
      .forEach(t => Store.addBlock(p.id, 'bullet', { text: t }));

    return p;
  };

  /* ========================================================================
   * 2. FITNESS-OS   (Teil 16)
   * ======================================================================*/
  const fitnessOS = () => {
    const p = Store.addPage(null, { text: 'Fitness-OS', icon: '🏋️' });
    Store.addBlock(p.id, 'h1', { text: 'Zehn Datenbanken, die zusammenspielen' });
    Store.addBlock(p.id, 'callout', {
      text: 'Die **Tagesbilanz** ist die Drehscheibe: ein Eintrag je Tag, alles andere hängt daran. ' +
            'Übungen und Lebensmittel sind Stammdaten — einmal erfassen, immer wiederverwenden.',
      icon: '🧭', color: 'bg-green'
    });

    const db = (name: string, icon: any, schema: any, layout?: any) => {
      Store.addBlock(p.id, 'h2', { text: icon + ' ' + name });
      return Store.addDatabase(p.id, name, schema, layout || 'table');
    };

    /* --- Stammdaten ---------------------------------------------------- */
    const uebung = db('Übungen-Katalog', '🏋️', {
      title: { name: 'Übung', type: 'title' },
      mg: { name: 'Muskelgruppe', type: 'select', options:
            opt(['Brust','red'],['Rücken','blue'],['Beine','green'],['Schultern','orange'],
                ['Arme','purple'],['Bauch','yellow'],['Ganzkörper','gray']) },
      ger: { name: 'Gerät', type: 'select', options:
             opt(['Langhantel','blue'],['Kurzhantel','green'],['Maschine','gray'],
                 ['Kabelzug','purple'],['Eigengewicht','yellow']) },
      schwer: { name: 'Schwierigkeit', type: 'select', options:
                opt(['Einsteiger','green'],['Fortgeschritten','yellow'],['Profi','red']) },
      eigen: { name: 'Nur Eigengewicht', type: 'checkbox' },
      ersatz: { name: 'Ersatzübung', type: 'relation' },
      hinweis: { name: 'Ausführung', type: 'text' }
    });
    /* Selbstverknüpfung — Ersatzübung zeigt auf dieselbe Datenbank */
    const uc = Store.getCollection(uebung.collectionId);
    uc.schema.ersatz.ziel = uebung.collectionId;
    Store.updateCollection(uc.id, { schema: uc.schema });

    const lebensmittel = db('Lebensmittel', '🥗', {
      title: { name: 'Lebensmittel', type: 'title' },
      kat: { name: 'Kategorie', type: 'select', options:
             opt(['Protein','red'],['Kohlenhydrate','yellow'],['Fettquelle','orange'],
                 ['Gemüse','green'],['Obst','pink'],['Snack','purple'],['Getränk','blue']) },
      portion: { name: 'Portionsgrösse g', type: 'number' },
      kcal: { name: 'Kalorien pro 100g', type: 'number' },
      pro: { name: 'Protein pro 100g', type: 'number' },
      kh:  { name: 'Kohlenhydrate pro 100g', type: 'number' },
      fett:{ name: 'Fett pro 100g', type: 'number' },
      ampel: { name: 'Bewertung', type: 'select', options:
               opt(['Top','green'],['Okay','yellow'],['Selten','red']) }
    });

    /* --- Tagesbilanz als Drehscheibe ------------------------------------ */
    const tag = db('Tagesbilanz', '📅', {
      title: { name: 'Tag', type: 'title' },
      dt: { name: 'Datum', type: 'date' },
      gew: { name: 'Gewicht kg', type: 'number' },
      kcalZiel: { name: 'Kalorienziel', type: 'number' },
      proZiel: { name: 'Proteinziel g', type: 'number' },
      workout: { name: 'Trainiert', type: 'checkbox' },
      hGesamt: { name: 'Habits gesamt', type: 'number' },
      hFertig: { name: 'Habits erledigt', type: 'number' },
      quote: { name: 'Habit-Quote %', type: 'formula', formula:
        'if(empty(prop("Habits gesamt")) or prop("Habits gesamt") == 0, 0, ' +
        'round(prop("Habits erledigt") / prop("Habits gesamt") * 100))' },
      score: { name: 'Tages-Score', type: 'formula', anzeige: 'bar', max: 100, formula:
        'round((prop("Habit-Quote %") + if(prop("Trainiert"), 100, 0)) / 2)' },
      ampel: { name: 'Ampel', type: 'formula', formula:
        'if(prop("Tages-Score") >= 80, "🟢", if(prop("Tages-Score") >= 50, "🟡", ' +
        'if(prop("Tages-Score") > 0, "🟠", "⚪")))' },
      balken: { name: 'Fortschritt', type: 'formula', formula:
        'repeat("█", round(prop("Tages-Score") / 10)) + repeat("░", 10 - round(prop("Tages-Score") / 10))' }
    });

    /* --- Training -------------------------------------------------------- */
    const einheit = db('Trainingseinheiten', '💪', {
      title: { name: 'Einheit', type: 'title' },
      dt: { name: 'Datum', type: 'date' },
      start: { name: 'Startzeit', type: 'date' },
      ende: { name: 'Endzeit', type: 'date' },
      dauer: { name: 'Dauer min', type: 'formula', formula:
        'if(empty(prop("Endzeit")), 0, dateBetween(prop("Endzeit"), prop("Startzeit"), "minutes"))' },
      art: { name: 'Art', type: 'select', options:
             opt(['Push','red'],['Pull','blue'],['Beine','green'],['Ganzkörper','purple'],['Ausdauer','orange']) },
      gefuehl: { name: 'Gefühl 1-10', type: 'number' },
      tagRel: { name: 'Tagesbilanz', type: 'relation', ziel: tag.collectionId }
    });

    const satz = db('Satz-Protokoll', '📋', {
      title: { name: 'Satz', type: 'title' },
      uebRel: { name: 'Übung', type: 'relation', ziel: uebung.collectionId },
      einRel: { name: 'Einheit', type: 'relation', ziel: einheit.collectionId },
      gewicht: { name: 'Gewicht kg', type: 'number' },
      wdh: { name: 'Wiederholungen', type: 'number' },
      rpe: { name: 'RPE', type: 'number' },
      volumen: { name: 'Volumen', type: 'formula', formula:
        'prop("Gewicht kg") * prop("Wiederholungen")' },
      rm: { name: 'Geschätztes 1RM', type: 'formula', formula:
        'round(prop("Gewicht kg") * (1 + prop("Wiederholungen") / 30))' },
      intensitaet: { name: 'Intensität', type: 'formula', formula:
        'if(prop("RPE") >= 9, "🔴 sehr hart", if(prop("RPE") >= 7, "🟠 hart", ' +
        'if(prop("RPE") >= 5, "🟡 mittel", "🟢 locker")))' }
    });

    /* --- Ernährung -------------------------------------------------------- */
    const mahlzeit = db('Mahlzeiten', '🍽', {
      title: { name: 'Mahlzeit', type: 'title' },
      dt: { name: 'Datum', type: 'date' },
      zeit: { name: 'Zeitpunkt', type: 'select', options:
              opt(['Frühstück','yellow'],['Mittag','orange'],['Abend','blue'],['Snack','gray']) },
      lmRel: { name: 'Lebensmittel', type: 'relation', ziel: lebensmittel.collectionId },
      menge: { name: 'Menge g', type: 'number' },
      kcal100: { name: 'Kalorien je 100g', type: 'rollup',
                 relation: 'lmRel', zielKey: 'kcal', rollup: 'Summe' },
      kcal: { name: 'Kalorien', type: 'formula', formula:
        'round(prop("Menge g") / 100 * prop("Kalorien je 100g"))' },
      tagRel: { name: 'Tagesbilanz', type: 'relation', ziel: tag.collectionId }
    });

    /* --- Gewohnheiten und Körper ------------------------------------------ */
    const habit = db('Habit-Log', '✅', {
      title: { name: 'Gewohnheit', type: 'title' },
      dt: { name: 'Datum', type: 'date' },
      erledigt: { name: 'Erledigt', type: 'checkbox' },
      kat: { name: 'Bereich', type: 'select', options:
             opt(['Gesundheit','green'],['Kopf','purple'],['Arbeit','blue'],['Haushalt','gray']) },
      tagRel: { name: 'Tagesbilanz', type: 'relation', ziel: tag.collectionId }
    }, 'board');

    db('Körpermasse', '📏', {
      title: { name: 'Messung', type: 'title' },
      dt: { name: 'Datum', type: 'date' },
      gew: { name: 'Gewicht kg', type: 'number' },
      bauch: { name: 'Bauch cm', type: 'number' },
      brust: { name: 'Brust cm', type: 'number' },
      arm: { name: 'Arm cm', type: 'number' },
      bein: { name: 'Bein cm', type: 'number' },
      kfa: { name: 'Körperfett %', type: 'number' }
    });

    db('Trainingspläne', '🗂', {
      title: { name: 'Plan', type: 'title' },
      ziel: { name: 'Ziel', type: 'select', options:
              opt(['Muskelaufbau','green'],['Abnehmen','orange'],['Kraft','red'],['Erhalt','gray']) },
      tage: { name: 'Tage pro Woche', type: 'number' },
      uebRel: { name: 'Übungen', type: 'relation', ziel: uebung.collectionId },
      aktiv: { name: 'Aktiv', type: 'checkbox' }
    });

    db('Wochenreview', '📈', {
      title: { name: 'Woche', type: 'title' },
      von: { name: 'Von', type: 'date' },
      bis: { name: 'Bis', type: 'date' },
      einheiten: { name: 'Einheiten', type: 'number' },
      volumen: { name: 'Volumen gesamt', type: 'number' },
      schnitt: { name: 'Score-Schnitt', type: 'number' },
      fazit: { name: 'Fazit', type: 'text' }
    });

    /* --- Beispieldaten ----------------------------------------------------- */
    const uebungen = [['Bankdrücken','Brust','Langhantel'], ['Kniebeuge','Beine','Langhantel'],
                      ['Klimmzug','Rücken','Eigengewicht'], ['Schulterdrücken','Schultern','Kurzhantel']];
    const uIds = uebungen.map(([n, mg, g]) => {
      const r = Store.addRow(uebung.collectionId, { mg, ger: g, schwer: 'Fortgeschritten', eigen: g === 'Eigengewicht' });
      Store.updateBlock(r.id, { text: n });
      return r.id;
    });

    [['Magerquark','Protein',66,12], ['Haferflocken','Kohlenhydrate',372,13],
     ['Hähnchenbrust','Protein',108,23], ['Olivenöl','Fettquelle',884,0]]
      .forEach(([n, kat, kcal, pro]: any[]) => {
        const r = Store.addRow(lebensmittel.collectionId, { kat, kcal, pro, portion: 100, ampel: 'Top' });
        Store.updateBlock(r.id, { text: n });
      });

    const tIds = [0, -1, -2].map(n => {
      const d = inTagen(n);
      const r = Store.addRow(tag.collectionId, {
        dt: d, gew: 78.5 + n * 0.1, kcalZiel: 2400, proZiel: 150,
        workout: n !== -1, hGesamt: 5, hFertig: n === -1 ? 2 : 4
      });
      Store.updateBlock(r.id, { text: d });
      return r.id;
    });

    const eId = (() => {
      const r = Store.addRow(einheit.collectionId, {
        dt: heute(), art: 'Push', gefuehl: 8, tagRel: [tIds[0]],
        start: heute() + 'T18:00', ende: heute() + 'T19:15'
      });
      Store.updateBlock(r.id, { text: 'Push A' });
      return r.id;
    })();

    [[60, 10, 7], [70, 8, 8], [75, 6, 9]].forEach(([g, w, rpe]: any[], i: number) => {
      const r = Store.addRow(satz.collectionId, {
        gewicht: g, wdh: w, rpe, uebRel: [uIds[0]], einRel: [eId]
      });
      Store.updateBlock(r.id, { text: 'Satz ' + (i + 1) });
    });

    ['Wasser trinken', 'Lesen', 'Spazieren', 'Dehnen', 'Früh schlafen'].forEach((n, i) => {
      const r = Store.addRow(habit.collectionId, { dt: heute(), erledigt: i < 4, kat: 'Gesundheit', tagRel: [tIds[0]] });
      Store.updateBlock(r.id, { text: n });
    });

    /* --- Zwölf fertige Ansichten, jede mit gesetztem Filter --------------
     * Teil 16 der Doku listet sie namentlich auf. Sie entstehen hier gleich
     * mit, damit nach dem Anlegen nichts mehr eingestellt werden muss.
     * -------------------------------------------------------------------*/
    const ansicht = (collectionId: any, layout: any, name: string, patch: any) => {
      const v = Store.addView(collectionId, layout, name);
      if (v && patch) Store.updateView(v.id, patch);
      return v;
    };
    const regel = (key: any, op: any, wert?: any) => ({ operator: 'and', rules: [{ key, op, wert: wert ?? '' }] });

    /* Tagesbilanz */
    ansicht(tag.collectionId, 'calendar', 'Monatsübersicht', { dateKey: 'dt' });
    ansicht(tag.collectionId, 'chart', 'Score-Verlauf',
      { chartGruppe: 'dt', chartWert: 'score', chartArt: 'Durchschnitt', chartTyp: 'line', chartStufe: 'tag' });
    ansicht(tag.collectionId, 'table', 'Nur Trainingstage',
      { filters: regel('workout', 'ist aktiviert'), sorts: [{ key: 'dt', richtung: 'ab' }] });
    ansicht(tag.collectionId, 'table', 'Schwache Tage',
      { filters: regel('quote', 'kleiner als', '50'), sorts: [{ key: 'dt', richtung: 'ab' }] });

    /* Training */
    ansicht(einheit.collectionId, 'board', 'Nach Art', { groupBy: 'art' });
    ansicht(einheit.collectionId, 'timeline', 'Trainingsplan', { startKey: 'dt' });
    ansicht(satz.collectionId, 'table', 'Harte Sätze',
      { filters: regel('rpe', 'größer oder gleich', '8'), sorts: [{ key: 'volumen', richtung: 'ab' }] });
    ansicht(satz.collectionId, 'chart', 'Volumen je Übung',
      { chartGruppe: 'uebRel', chartWert: 'volumen', chartArt: 'Summe', chartTyp: 'bar' });

    /* Ernährung */
    ansicht(mahlzeit.collectionId, 'board', 'Tagesablauf', { groupBy: 'zeit' });
    ansicht(mahlzeit.collectionId, 'table', 'Heute gegessen',
      { filters: regel('dt', 'ist heute'), calc: { kcal: 'Summe' } });

    /* Gewohnheiten */
    ansicht(habit.collectionId, 'table', 'Offen',
      { filters: regel('erledigt', 'ist nicht aktiviert'), sorts: [{ key: 'dt', richtung: 'ab' }] });
    ansicht(habit.collectionId, 'chart', 'Quote je Bereich',
      { chartGruppe: 'kat', chartWert: 'erledigt', chartArt: 'Prozent aktiviert', chartTyp: 'bar' });

    Store.addBlock(p.id, 'h2', { text: 'Wie alles zusammenhängt' });
    ['**Tagesbilanz** ist die Drehscheibe — ein Eintrag je Tag',
     '**Satz-Protokoll** rechnet Volumen und geschätztes 1RM nach Epley',
     '**Mahlzeiten** holt die Nährwerte per Rollup aus den **Lebensmitteln**',
     '**Habit-Log** füllt die Habit-Quote der Tagesbilanz',
     '**Übungen-Katalog** kennt Ersatzübungen über eine Verknüpfung auf sich selbst']
      .forEach(t => Store.addBlock(p.id, 'bullet', { text: t }));

    return p;
  };

  /* ========================================================================
   * 3. WEITERE VORLAGEN
   * ======================================================================*/
  const projekte = () => {
    const p = Store.addPage(null, { text: 'Projekte', icon: '🚀' });
    Store.addBlock(p.id, 'h1', { text: 'Was gerade läuft' });
    const { collectionId } = Store.addDatabase(p.id, 'Aufgaben', {
      title: { name: 'Aufgabe', type: 'title' },
      st: { name: 'Status', type: 'status', options:
            opt(['Backlog','gray'],['Diese Woche','blue'],['In Arbeit','yellow'],['Prüfen','purple'],['Fertig','green']) },
      pr: { name: 'Priorität', type: 'select', options: opt(['Hoch','red'],['Mittel','yellow'],['Niedrig','gray']) },
      dt: { name: 'Fällig', type: 'date' },
      auf: { name: 'Aufwand h', type: 'number' },
      tage: { name: 'Tage übrig', type: 'formula', formula:
        'if(empty(prop("Fällig")), "—", format(dateBetween(prop("Fällig"), now(), "days")) + " Tage")' },
      dringend: { name: 'Dringend', type: 'formula', formula:
        'if(empty(prop("Fällig")), "", if(dateBetween(prop("Fällig"), now(), "days") <= 2, "🔥", ""))' }
    }, 'board');

    [['Angebot schreiben','In Arbeit','Hoch',1,3],
     ['Rechnung stellen','Diese Woche','Mittel',3,1],
     ['Website aufräumen','Backlog','Niedrig',14,4],
     ['Rückmeldung geben','Prüfen','Hoch',0,1]].forEach(([t, st, pr, tage, auf]: any[]) => {
      const r = Store.addRow(collectionId, { st, pr, dt: inTagen(tage), auf });
      Store.updateBlock(r.id, { text: t });
    });
    Store.addView(collectionId, 'timeline', 'Zeitplan');
    Store.addView(collectionId, 'calendar', 'Kalender');
    return p;
  };

  /* ========================================================================
   * MUSIK-APP   (Teil 2, Kapitel 4)
   * ------------------------------------------------------------------------
   * Zwei Datenbanken: Song-Bibliothek und Playlists, mit den vier Ansichten
   * aus der Dokumentation.
   * ======================================================================*/
  const musik = () => {
    const p = Store.addPage(null, { text: 'Musik', icon: '🎵' });
    Store.addBlock(p.id, 'h1', { text: 'Nach Stimmung sortiert, nicht nach Alphabet' });
    Store.addBlock(p.id, 'callout', {
      text: 'Die **Stimmung** ist die wichtigste Spalte. Im Board zieht man einen Song ' +
            'von 😌 Chill nach 🔥 Power — der Wert ändert sich sofort.',
      icon: '🎧', color: 'bg-purple'
    });

    Store.addBlock(p.id, 'h2', { text: '🎵 Song-Bibliothek' });
    const song = Store.addDatabase(p.id, 'Song-Bibliothek', {
      title: { name: 'Song', type: 'title' },
      art: { name: 'Künstler', type: 'text' },
      genre: { name: 'Genre', type: 'multi', options:
        opt(['Hip-Hop','orange'],['Rap','red'],['Pop','pink'],['Rock','brown'],['Elektro','purple'],
            ['Türkisch','yellow'],['Klassik','gray'],['Lofi','blue'],['Workout','green']) },
      st: { name: 'Stimmung', type: 'select', options:
        opt(['🔥 Power','red'],['😌 Chill','blue'],['🎯 Fokus','purple'],
            ['😢 Melancholisch','gray'],['🎉 Party','pink']) },
      note: { name: 'Bewertung', type: 'select', options:
        opt(['⭐⭐⭐⭐⭐','green'],['⭐⭐⭐⭐','blue'],['⭐⭐⭐','yellow'],['⭐⭐','orange'],['⭐','red']) },
      min: { name: 'Länge Min', type: 'number' },
      jahr: { name: 'Jahr', type: 'number' },
      fav: { name: 'Favorit', type: 'checkbox' },
      zuletzt: { name: 'Zuletzt gehört', type: 'date' },
      link: { name: 'Link', type: 'url' },
      pl: { name: 'Playlist', type: 'select', options:
        opt(['🏋️ Gym Power','red'],['🌙 Abends chillen','blue'],
            ['📚 Lernen & Fokus','purple'],['🚗 Autofahrt','orange']) }
    }, 'table');

    /* Die vier Ansichten aus der Doku */
    sicht(song.collectionId, 'board', 'Nach Stimmung', { groupBy: 'st' });
    Store.addView(song.collectionId, 'gallery', 'Galerie');
    sicht(song.collectionId, 'list', 'Playlist-Liste', { sorts: [{ key: 'pl', richtung: 'auf' }] });

    [['Sirtaki 2.0','Deniz Kaya',['Türkisch','Pop'],'🎉 Party','⭐⭐⭐⭐',3.4,2024,true,'🚗 Autofahrt'],
     ['Iron Lungs','Bar Bell',['Workout','Rock'],'🔥 Power','⭐⭐⭐⭐⭐',4.1,2023,true,'🏋️ Gym Power'],
     ['Slow Rain','Mira Lo',['Lofi'],'😌 Chill','⭐⭐⭐⭐',2.8,2022,false,'🌙 Abends chillen'],
     ['Deep Work','Nocturne',['Klassik','Lofi'],'🎯 Fokus','⭐⭐⭐⭐⭐',18.2,2021,true,'📚 Lernen & Fokus'],
     ['Letzter Zug','Halbmond',['Rap','Hip-Hop'],'😢 Melancholisch','⭐⭐⭐',3.9,2020,false,'🌙 Abends chillen'],
     ['Voltage','Kern',['Elektro'],'🔥 Power','⭐⭐⭐⭐',5.2,2025,false,'🏋️ Gym Power']]
      .forEach(([t, a, g, st, n, m, j, fv, pl]: any[], i: number) => {
        const r = Store.addRow(song.collectionId, {
          art: a, genre: g, st, note: n, min: m, jahr: j, fav: fv, pl,
          zuletzt: inTagen(-i), link: 'https://open.spotify.com/search/' + encodeURIComponent(t)
        });
        Store.updateBlock(r.id, { text: t });
      });

    Store.addBlock(p.id, 'h2', { text: '💿 Playlists' });
    const pls = Store.addDatabase(p.id, 'Playlists', {
      title: { name: 'Playlist', type: 'title' },
      besch: { name: 'Beschreibung', type: 'text' },
      anzahl: { name: 'Anzahl Songs', type: 'number' },
      dauer: { name: 'Gesamtdauer Min', type: 'number' },
      st: { name: 'Stimmung', type: 'select', options:
        opt(['🔥 Power','red'],['😌 Chill','blue'],['🎯 Fokus','purple'],['🎉 Party','pink']) },
      anlass: { name: 'Anlass', type: 'multi', options:
        opt(['Training','red'],['Schlafen','blue'],['Kochen','orange'],
            ['Lernen','purple'],['Auto','green']) },
      schnitt: { name: 'Minuten je Song', type: 'formula', formula:
        'if(empty(prop("Anzahl Songs")) or prop("Anzahl Songs") == 0, 0, ' +
        'round(prop("Gesamtdauer Min") / prop("Anzahl Songs") * 10) / 10)' }
    }, 'gallery');

    [['🏋️ Gym Power','Für schwere Sätze',9,43,'🔥 Power',['Training']],
     ['🌙 Abends chillen','Wenn der Tag ausklingt',6,29,'😌 Chill',['Schlafen','Kochen']],
     ['📚 Lernen & Fokus','Lange Stücke, kein Gesang',4,76,'🎯 Fokus',['Lernen']],
     ['🚗 Autofahrt','Mitsingen erlaubt',7,29,'🎉 Party',['Auto']]]
      .forEach(([t, b2, n, d, st, an]) => {
        const r = Store.addRow(pls.collectionId, { besch: b2, anzahl: n, dauer: d, st, anlass: an });
        Store.updateBlock(r.id, { text: t });
      });

    Store.addBlock(p.id, 'divider', {});
    ['**Nach Stimmung** ist ein Board — Ziehen ändert die Stimmung sofort',
     '**Galerie** zeigt Kacheln, gut zum Durchblättern',
     '**Playlist-Liste** ist die kompakte Liste, nach Playlist sortiert',
     'Die Playlists rechnen sich die durchschnittliche Songlänge selbst aus']
      .forEach(t => Store.addBlock(p.id, 'bullet', { text: t }));
    return p;
  };

  /* ========================================================================
   * PERSÖNLICHE ANALYSE   (Teil 2, Kapitel 5)
   * ------------------------------------------------------------------------
   * Der tägliche Check-in mit 16 Spalten, zwei Ansichten und der
   * Auswertung, die in der Doku auf der Seite steht.
   * ======================================================================*/
  const analyse = () => {
    const p = Store.addPage(null, { text: 'Persönliche Analyse', icon: '📊' });

    Store.addBlock(p.id, 'callout', {
      text: 'Jeden Abend eine Zeile ausfüllen — mehr nicht.',
      icon: '🧭', color: 'bg-blue'
    });
    Store.addBlock(p.id, 'h1', { text: '📆 Täglicher Check-in' });
    Store.addBlock(p.id, 'text', {
      text: 'Vier Gewohnheiten, ein paar Zahlen. Der Tages-Score zählt die Haken, ' +
            'die Bewertung entsteht daraus von selbst.'
    });

    const check = Store.addDatabase(p.id, 'Täglicher Check-in', {
      title: { name: 'Tag', type: 'title' },
      dt: { name: 'Datum', type: 'date' },
      wt: { name: 'Wochentag', type: 'formula', formula: 'formatDate(prop("Datum"), "dddd")' },
      schlaf: { name: 'Schlaf h', type: 'number' },
      energie: { name: 'Energie 1-10', type: 'number' },
      stimmung: { name: 'Stimmung', type: 'select', options:
        opt(['😄 Super','green'],['🙂 Gut','blue'],['😐 Neutral','gray'],
            ['😕 Mässig','orange'],['😞 Schlecht','red']) },
      wasser: { name: 'Wasser L', type: 'number' },
      schritte: { name: 'Schritte', type: 'number' },
      training: { name: '🏋️ Training', type: 'checkbox' },
      essen: { name: '🍽️ Sauber gegessen', type: 'checkbox' },
      lesen: { name: '📖 Gelesen', type: 'checkbox' },
      musik: { name: '🎵 Musik bewusst gehört', type: 'checkbox' },
      schirm: { name: 'Bildschirmzeit h', type: 'number' },
      score: { name: 'Tages-Score 0-4', type: 'formula', anzeige: 'bar', max: 4, formula:
        'toNumber(prop("🏋️ Training")) + toNumber(prop("🍽️ Sauber gegessen")) + ' +
        'toNumber(prop("📖 Gelesen")) + toNumber(prop("🎵 Musik bewusst gehört"))' },
      bewertung: { name: 'Bewertung', type: 'formula', formula:
        'if(prop("Tages-Score 0-4") == 4, "🔥 Top-Tag", ' +
        'if(prop("Tages-Score 0-4") == 3, "👍 Guter Tag", ' +
        'if(prop("Tages-Score 0-4") >= 1, "😐 Mittel", "❌ Schwacher Tag")))' },
      notiz: { name: 'Notiz', type: 'text' }
    }, 'table');

    sicht(check.collectionId, 'board', 'Nach Bewertung', { groupBy: 'stimmung' });

    /* Die Beispielwoche aus der Doku */
    [['Montag',    7.5, 8, '🙂 Gut',    2.4,  9200, 1,1,1,0, 4.0],
     ['Dienstag',  8.0, 9, '😄 Super',  2.8, 11400, 1,1,1,1, 3.0],
     ['Mittwoch',  6.0, 6, '😐 Neutral',1.9,  7800, 1,1,1,0, 5.0],
     ['Donnerstag',7.8, 8, '😄 Super',  2.6, 10500, 1,1,1,1, 3.5],
     ['Freitag',   7.0, 7, '🙂 Gut',    2.1,  8900, 1,1,1,0, 4.5],
     ['Samstag',   5.5, 5, '😕 Mässig', 1.4,  6200, 0,1,1,1, 7.5],
     ['Sonntag',   9.0, 9, '🙂 Gut',    2.2,  5400, 0,1,1,1, 6.0]]
      .forEach(([name, sch, en, sti, wa, sr, tr, es, le, mu, bi]: any[], i: number) => {
        const r = Store.addRow(check.collectionId, {
          dt: inTagen(i - 6), schlaf: sch, energie: en, stimmung: sti, wasser: wa,
          schritte: sr, training: !!tr, essen: !!es, lesen: !!le, musik: !!mu, schirm: bi
        });
        Store.updateBlock(r.id, { text: name });
      });

    Store.addBlock(p.id, 'divider', {});
    Store.addBlock(p.id, 'h1', { text: '📊 Auswertung der Woche' });

    Store.addBlock(p.id, 'h2', { text: '🏋️ Training' });
    ['Fünf von sieben Tagen trainiert — die zwei freien Tage waren Samstag und Sonntag',
     'Die Tage mit wenig Schlaf hatten auch das kleinste Volumen']
      .forEach(t => Store.addBlock(p.id, 'bullet', { text: t }));

    Store.addBlock(p.id, 'h2', { text: '🍽️ Ernährung' });
    ['Jeden Tag sauber gegessen — das ist die stabilste Gewohnheit der Woche',
     'Wasser lag im Schnitt bei 2,2 Litern, an zwei Tagen unter zwei']
      .forEach(t => Store.addBlock(p.id, 'bullet', { text: t }));

    Store.addBlock(p.id, 'h2', { text: '🎵 Musik' });
    ['An vier Tagen bewusst gehört, immer an Tagen mit hoher Energie']
      .forEach(t => Store.addBlock(p.id, 'bullet', { text: t }));

    Store.addBlock(p.id, 'h2', { text: '🔗 Zusammenhänge, die auffallen' });
    Store.addBlock(p.id, 'quote', {
      text: 'Die zwei Tage mit unter 6,5 h Schlaf (Mittwoch und Samstag) sind exakt die zwei ' +
            'Tage mit der niedrigsten Energie und dem kleinsten Trainingsvolumen.'
    });
    Store.addBlock(p.id, 'quote', {
      text: 'Am Tag mit der höchsten Bildschirmzeit (7,5 h am Samstag) war die Schrittzahl ' +
            'am niedrigsten.'
    });
    Store.addBlock(p.id, 'callout', {
      text: 'Schlaf vor 23 Uhr priorisieren und die Kalorien um rund 800 kcal pro Tag erhöhen. ' +
            'Beides zusammen würde das Trainingsvolumen am stärksten heben.',
      icon: '💡', color: 'bg-yellow'
    });
    return p;
  };

  const lesen = () => {
    const p = Store.addPage(null, { text: 'Lesetagebuch', icon: '📚' });
    Store.addBlock(p.id, 'h1', { text: 'Was ich lese' });
    const { collectionId } = Store.addDatabase(p.id, 'Bücher', {
      title: { name: 'Titel', type: 'title' },
      autor: { name: 'Autor', type: 'text' },
      st: { name: 'Status', type: 'status', options:
            opt(['Wunschliste','gray'],['Lese ich','blue'],['Gelesen','green'],['Abgebrochen','red']) },
      seiten: { name: 'Seiten', type: 'number' },
      gelesen: { name: 'Gelesen', type: 'number' },
      fortschritt: { name: 'Fortschritt', type: 'formula', anzeige: 'bar', max: 100, formula:
        'if(empty(prop("Seiten")) or prop("Seiten") == 0, 0, round(prop("Gelesen") / prop("Seiten") * 100))' },
      balken: { name: 'Balken', type: 'formula', formula:
        'repeat("█", round(prop("Fortschritt") / 10)) + repeat("░", 10 - round(prop("Fortschritt") / 10))' },
      note: { name: 'Bewertung', type: 'select', options:
              opt(['★★★★★','green'],['★★★★','blue'],['★★★','yellow'],['★★','orange'],['★','red']) },
      fertig: { name: 'Beendet am', type: 'date' }
    }, 'gallery');
    [['Der Report','Nora Zwei','Lese ich',320,180],
     ['Tiefe Arbeit','Cal N.','Gelesen',300,300]].forEach(([t, a, st, s2, g]) => {
      const r = Store.addRow(collectionId, { autor: a, st, seiten: s2, gelesen: g });
      Store.updateBlock(r.id, { text: t });
    });
    return p;
  };

  const wissen = () => {
    const p = Store.addPage(null, { text: 'Wissen', icon: '📚', wiki: true });
    Store.addBlock(p.id, 'text', { text: 'Alles, was ich nicht vergessen will. Jede Unterseite ein Thema.' });
    ['Einrichtung des Rechners', 'Tastenkürzel, die ich ständig brauche', 'Rezepte, die immer klappen']
      .forEach(t => {
        const k = Store.addPage(p.id, { text: t, icon: '📄' });
        Store.addBlock(k.id, 'text', { text: 'Hier hinein schreiben. Mit [[' + t + ']] verlinkst du diese Seite von überall.' });
      });
    Store.updateBlock(p.id, { aufgeklappt: true });
    return p;
  };

  const wochenplan = () => {
    const p = Store.addPage(null, { text: 'Wochenplan', icon: '🗓' });
    Store.addBlock(p.id, 'h1', { text: 'Diese Woche' });
    ['Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag','Sonntag'].forEach(t => {
      Store.addBlock(p.id, 'h3', { text: t, toggleKopf: true, open: t === new Date().toLocaleDateString('de-DE', { weekday: 'long' }) });
      const b = Store.childrenOf(p.id).slice(-1)[0];
      Store.addBlock(b.id, 'todo', { text: '' });
    });
    return p;
  };


  /* ========================================================================
   * BAUPLAN — zeigt, was Redion mehr kann als Notion
   * ------------------------------------------------------------------------
   * Ein echtes Bauprojekt: Aufgaben mit Abhängigkeiten, ein Board mit Bahnen,
   * eine Kreuztabelle über Gewerk × Status und ein Zeitstrahl mit Pfeilen.
   * Wer diese Vorlage anlegt, sieht in einer Minute alles Wesentliche.
   * ======================================================================*/
  const bauplan = () => {
    const p = Store.addPage(null, { text: 'Bauplan', icon: '🏗' });
    Store.addBlock(p.id, 'h1', { text: 'Ein Projekt, sechs Blickwinkel' });
    Store.addBlock(p.id, 'callout', {
      text: 'Dieselben zwölf Aufgaben — einmal als **Zeitstrahl mit Abhängigkeitspfeilen**, ' +
            'einmal als **Board mit Bahnen**, einmal als **Kreuztabelle**. ' +
            'Alle drei kann Notion so nicht.',
      icon: '🏗', color: 'bg-orange'
    });

    const { collectionId } = Store.addDatabase(p.id, 'Bauaufgaben', {
      title:  { name: 'Aufgabe',  type: 'title' },
      von:    { name: 'Start',    type: 'date' },
      bis:    { name: 'Ende',     type: 'date' },
      gewerk: { name: 'Gewerk',   type: 'select', options:
                opt(['Rohbau','brown'],['Ausbau','blue'],['Technik','purple'],['Aussen','green']) },
      st:     { name: 'Status',   type: 'status', options:
                opt(['Offen','gray'],['In Arbeit','yellow'],['Fertig','green']) },
      kosten: { name: 'Kosten',   type: 'number' },
      vor:    { name: 'Hängt ab von', type: 'relation', ziel: null }
    }, 'timeline');

    /* Selbstverknüpfung — daraus entstehen die Pfeile im Zeitstrahl */
    const c = Store.getCollection(collectionId);
    c.schema.vor.ziel = collectionId;
    c.schema.vor.limit = 0;
    /* Statusübergänge: rückwärts von Fertig auf Offen ist nicht vorgesehen */
    c.schema.st.uebergaenge = { 'Offen': ['In Arbeit'],
                                'In Arbeit': ['Fertig', 'Offen'],
                                'Fertig': ['In Arbeit'] };
    Store.updateCollection(collectionId, { schema: c.schema });

    const ids: Record<string, string> = {};
    [['Baugrube',      'Rohbau',  -20, -14, 'Fertig',    18000, null],
     ['Fundament',     'Rohbau',  -13,  -6, 'Fertig',    32000, 'Baugrube'],
     ['Mauerwerk',     'Rohbau',   -5,   8, 'In Arbeit', 46000, 'Fundament'],
     ['Dachstuhl',     'Rohbau',    9,  16, 'Offen',     28000, 'Mauerwerk'],
     ['Fenster',       'Ausbau',   17,  22, 'Offen',     19000, 'Dachstuhl'],
     ['Elektro',       'Technik',  18,  27, 'Offen',     14000, 'Dachstuhl'],
     ['Sanitär',       'Technik',  18,  25, 'Offen',     16000, 'Dachstuhl'],
     ['Estrich',       'Ausbau',   28,  32, 'Offen',      9000, 'Elektro'],
     ['Innenputz',     'Ausbau',   33,  40, 'Offen',     12000, 'Estrich'],
     ['Böden',         'Ausbau',   41,  47, 'Offen',     15000, 'Innenputz'],
     ['Aussenanlage',  'Aussen',   41,  52, 'Offen',     11000, 'Innenputz'],
     ['Abnahme',       'Aussen',   53,  54, 'Offen',         0, 'Böden']]
      .forEach(([t, gewerk, a, b, st, kosten, vorher]: any[]) => {
        const r = Store.addRow(collectionId, {
          gewerk, st, kosten, von: inTagen(a), bis: inTagen(b),
          vor: vorher && ids[vorher] ? [ids[vorher]] : []
        });
        Store.updateBlock(r.id, { text: t });
        ids[t] = r.id;
      });

    /* Der Zeitstrahl weiss, welche Spalten er nehmen soll */
    const zs = Object.values<any>(Store.cache.views).find(v => v.collectionId === collectionId);
    Store.updateView(zs.id, { name: 'Zeitstrahl', startKey: 'von', endeKey: 'bis',
                              abhKey: 'vor', zoom: 'monat', limit: 0 });

    sicht(collectionId, 'board', 'Board mit Bahnen', { groupBy: 'st', bahnKey: 'gewerk', limit: 0 });

    sicht(collectionId, 'pivot', 'Kosten je Gewerk', { pivotZeile: 'gewerk', pivotSpalte: 'st',
                                 pivotWert: 'kosten', pivotArt: 'summe', limit: 0 });

    sicht(collectionId, 'table', 'Nach Gewerk gruppiert', { groupBy: 'gewerk', calc: { kosten: 'Summe' }, limit: 0 });

    sicht(collectionId, 'calendar', 'Kalender', { dateKey: 'von', endeKey: 'bis', limit: 0 });

    sicht(collectionId, 'chart', 'Kosten als Diagramm', { chartGruppe: 'gewerk', chartWert: 'kosten',
                                    chartArt: 'Summe', chartTyp: 'bar', limit: 0 });

    Store.addBlock(p.id, 'h2', { text: 'Was hier zu sehen ist' });
    [['Zeitstrahl', 'Die Pfeile kommen aus der Spalte „Hängt ab von". Zieh einen Balken — ' +
                    'die Daten ändern sich mit.'],
     ['Board mit Bahnen', 'Status läuft waagrecht, Gewerk senkrecht. Eine Karte in eine ' +
                          'andere Bahn ziehen ändert beide Werte.'],
     ['Kosten je Gewerk', 'Kreuztabelle. Ein Klick in eine Zelle zeigt die Aufgaben dahinter.'],
     ['Nach Gewerk gruppiert', 'Jede Gruppe hat ihre eigene Kostensumme.'],
     ['Status', 'Von „Fertig" direkt zurück auf „Offen" geht nicht — nur über ' +
                '„In Arbeit". Das ist eine Prüfregel, kein Zufall.']]
      .forEach(([a, b]) => Store.addBlock(p.id, 'bullet', { text: '**' + a + '** — ' + b }));

    return p;
  };

  /* ========================================================================
   * REDAKTIONSPLAN — Formular, Automation und Wiedervorlage
   * ======================================================================*/
  const redaktion = () => {
    const p = Store.addPage(null, { text: 'Redaktionsplan', icon: '✍' });
    Store.addBlock(p.id, 'h1', { text: 'Von der Idee bis zum Beitrag' });
    Store.addBlock(p.id, 'callout', {
      text: 'Ideen kommen über das **Formular** herein. Wird eine auf „In Arbeit" gesetzt, ' +
            'trägt eine **Automation** das heutige Datum ein und hängt einen Kommentar an.',
      icon: '✍', color: 'bg-blue'
    });

    const { collectionId } = Store.addDatabase(p.id, 'Beiträge', {
      title:  { name: 'Titel',    type: 'title' },
      art:    { name: 'Art',      type: 'select', options:
                opt(['Artikel','blue'],['Video','red'],['Newsletter','green'],['Kurznotiz','gray']) },
      st:     { name: 'Status',   type: 'status', options:
                opt(['Idee','gray'],['In Arbeit','yellow'],['Prüfen','purple'],['Veröffentlicht','green']) },
      wann:   { name: 'Geplant',  type: 'date' },
      start:  { name: 'Begonnen', type: 'date' },
      woerter:{ name: 'Wörter',   type: 'number' },
      notiz:  { name: 'Worum geht es?', type: 'text' },
      tempo:  { name: 'Wörter je Tag', type: 'formula', formula:
        'if(empty(prop("Begonnen")) or prop("Wörter") == 0, "—", ' +
        'format(roundTo(prop("Wörter") / max(1, dateBetween(now(), prop("Begonnen"), "days")), 0)) + " / Tag")' }
    }, 'board');

    [['Warum Notion langsam wird', 'Artikel',    'In Arbeit',   3, -4, 1400],
     ['Formeln, die keiner kennt', 'Artikel',    'Idee',       10, null,   0],
     ['Zehn Minuten Aufräumen',    'Video',      'Prüfen',      1, -9,  600],
     ['Was diesen Monat kam',      'Newsletter', 'Veröffentlicht', -2, -12, 900],
     ['Kurz notiert: Tastenkürzel','Kurznotiz',  'Idee',       14, null,   0]]
      .forEach(([t, art, st, tage, begonnen, woerter]: any[]) => {
        const r = Store.addRow(collectionId, {
          art, st, woerter, wann: inTagen(tage),
          start: begonnen === null ? '' : inTagen(begonnen)
        });
        Store.updateBlock(r.id, { text: t });
      });

    const c = Store.getCollection(collectionId);
    c.automationen = [{
      id: 'redak1', name: 'Wenn es losgeht', an: true,
      wenn: { art: 'prop-wert', key: 'st', wert: 'In Arbeit' },
      bedingungen: [],
      dann: [
        { art: 'setze-prop', key: 'start', wert: 'heute' },
        { art: 'kommentar', text: 'Angefangen: {titel}' }
      ]
    }];
    Store.updateCollection(collectionId, { automationen: c.automationen });

    const board = Object.values<any>(Store.cache.views).find(v => v.collectionId === collectionId);
    Store.updateView(board.id, { name: 'Board', groupBy: 'st', bahnKey: 'art', limit: 0 });

    sicht(collectionId, 'calendar', 'Kalender', { dateKey: 'wann', limit: 0 });

    sicht(collectionId, 'form', 'Ideen einreichen', {
      formTitel: 'Hast du eine Idee?',
      formText: 'Kurz beschreiben — der Rest kommt später.',
      formKnopf: 'Idee einreichen',
      formDankTitel: 'Notiert!',
      formDankText: 'Die Idee steht jetzt auf dem Board unter „Idee".',
      pflicht: ['title'],
      hidden: ['start', 'woerter', 'tempo'],
      limit: 0
    });

    Store.addBlock(p.id, 'h2', { text: 'Zum Ausprobieren' });
    [['Formular „Ideen einreichen"', 'Etwas eintragen und abschicken — es erscheint eine ' +
                                     'Danke-Seite, und die Idee steht auf dem Board.'],
     ['Eine Karte auf „In Arbeit" ziehen', 'Die Automation setzt das Datum und hängt einen ' +
                                           'Kommentar an. Im Blitz-Menü steht der Laufverlauf.'],
     ['Spalte „Wörter je Tag"', 'Eine Formel mit roundTo und max — beides hat Notion nicht.']]
      .forEach(([a, b]) => Store.addBlock(p.id, 'bullet', { text: '**' + a + '** — ' + b }));

    return p;
  };

  /* ========================================================================
   * DIE GALERIE
   * ======================================================================*/
  const VORLAGEN = [
    { id: 'habit',   icon: '📊', name: 'Habit-Tracker',
      text: '100-Punkte-Score aus Gym, Schlaf, Wasser, Lesen und Selbstkontrolle. Sechs Ansichten, drei Beispieltage.',
      quelle: 'Teil 12 der Doku', bauen: habitTracker },
    { id: 'fitness', icon: '🏋️', name: 'Fitness-OS',
      text: 'Zehn verknüpfte Datenbanken: Übungen, Sätze, Einheiten, Mahlzeiten, Habits, Körpermasse. Mit Volumen, 1RM und Rollups.',
      quelle: 'Teil 16 der Doku', bauen: fitnessOS },
    { id: 'musik',   icon: '🎵', name: 'Musik-App',
      text: 'Song-Bibliothek und Playlists. Board nach Stimmung, Galerie, kompakte Liste — Ziehen ändert die Stimmung sofort.',
      quelle: 'Teil 2 der Doku', bauen: musik },
    { id: 'analyse', icon: '📊', name: 'Persönliche Analyse',
      text: 'Täglicher Check-in mit 16 Spalten, Tages-Score aus vier Gewohnheiten und die fertige Wochenauswertung.',
      quelle: 'Teil 2 der Doku', bauen: analyse },
    { id: 'projekte',icon: '🚀', name: 'Projekte',
      text: 'Kanban mit Status, Priorität, Fälligkeit und Dringlichkeitszeichen. Dazu Zeitplan und Kalender.',
      quelle: '', bauen: projekte },
    { id: 'lesen',   icon: '📚', name: 'Lesetagebuch',
      text: 'Bücher als Galerie mit Fortschrittsbalken und Bewertung.',
      quelle: '', bauen: lesen },
    { id: 'wissen',  icon: '🧠', name: 'Wissensdatenbank',
      text: 'Ein Wiki mit Besitzer und Prüfvermerk, drei Startseiten.',
      quelle: '', bauen: wissen },
    { id: 'woche',   icon: '🗓', name: 'Wochenplan',
      text: 'Sieben Toggle-Überschriften, eine je Wochentag, heute schon aufgeklappt.',
      quelle: '', bauen: wochenplan },
    { id: 'bauplan', icon: '🏗', name: 'Bauplan',
      text: 'Zwölf Aufgaben mit Abhängigkeiten — als Zeitstrahl mit Pfeilen, Board mit Bahnen, ' +
            'Kreuztabelle und gruppierter Tabelle. Zeigt in einer Minute, was Notion nicht kann.',
      quelle: 'zeigt die Redion-Besonderheiten', bauen: bauplan },
    { id: 'redaktion', icon: '✍', name: 'Redaktionsplan',
      text: 'Ideen kommen über ein Formular herein, eine Automation stempelt den Beginn und ' +
            'schreibt einen Kommentar. Mit Bahnen-Board und eigener Tempoformel.',
      quelle: 'Formular, Automation, Kommentar', bauen: redaktion }
  ];

  const oeffne = () => {
    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML =
      '<div class="finder" style="width:min(760px,95vw)">' +
        '<div class="fh">🧩 Vorlagengalerie<button class="icon-btn" data-a="zu">✕</button></div>' +
        '<div class="gal">' +
          VORLAGEN.map(v =>
            `<button class="gal-karte" data-v="${v.id}">` +
              `<span class="gal-ico">${v.icon}</span>` +
              `<b>${esc(v.name)}</b>` +
              `<span class="gal-text">${esc(v.text)}</span>` +
              (v.quelle ? `<span class="gal-quelle">${esc(v.quelle)}</span>` : '') +
            '</button>').join('') +
        '</div>' +
        '<div class="hint">Jede Vorlage legt eine neue Seite an. Ändern kannst du danach alles.</div>' +
      '</div>';
    document.body.appendChild(o);

    o.addEventListener('click', e => {
      if (e.target === o || elVon(e)?.closest<HTMLElement>('[data-a="zu"]')) { o.remove(); return; }
      const k = elVon(e)?.closest<HTMLElement>('[data-v]');
      if (!k) return;
      const v = VORLAGEN.find(x => x.id === k.dataset.v);
      o.remove();
      if (!v) return;
      const seite = v.bauen();
      App.zeichneBaum();
      App.oeffne(seite.id);
      UI.toast('„' + v.name + '" angelegt');
    });
  };

  /** Eine Vorlage anlegen, ohne die Galerie zu öffnen. */
  const bauen = (id: string) => {
    const v = VORLAGEN.find(x => x.id === id);
    return v ? v.bauen() : null;
  };

  return { oeffne, bauen, VORLAGEN, habitTracker, fitnessOS, musik, analyse };
})();

(window as any).Galerie = Galerie;
