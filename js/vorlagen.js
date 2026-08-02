/* ============================================================================
 * vorlagen.js — Die Vorlagengalerie
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

  const esc = (s) => String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const heute = () => new Date().toISOString().slice(0, 10);
  const inTagen = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };

  /* Kurzschreibweise für Auswahloptionen */
  const opt = (...paare) => paare.map(([name, color]) => ({ name, color }));

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

    const { collectionId, viewId } = Store.addDatabase(p.id, 'Tagesdaten', schema, 'table');

    /* Sechs Ansichten wie im Bauplan */
    const heuteView = Store.addView(collectionId, 'table', 'Heute');
    Store.updateView(heuteView.id, { filters: { operator: 'and', rules: [{ key: 'dt', op: 'ist heute', wert: '' }] } });

    const echteView = Store.addView(collectionId, 'table', 'Echte Tage');
    Store.updateView(echteView.id, {
      filters: { operator: 'and', rules: [{ key: 'voll', op: 'ist aktiviert', wert: '' }] },
      sorts: [{ key: 'dt', richtung: 'ab' }]
    });

    const kalView = Store.addView(collectionId, 'calendar', 'Kalender');
    Store.updateView(kalView.id, { datumKey: 'dt' });

    const wocheView = Store.addView(collectionId, 'chart', 'Wochenreview');
    Store.updateView(wocheView.id, { chartGruppe: 'woche', chartWert: 'score', chartTyp: 'bar' });

    const schwachView = Store.addView(collectionId, 'table', 'Schwache Tage');
    Store.updateView(schwachView.id, {
      filters: { operator: 'and', rules: [
        { key: 'voll', op: 'ist aktiviert', wert: '' },
        { key: 'score', op: 'kleiner als', wert: '50' }
      ]},
      sorts: [{ key: 'dt', richtung: 'ab' }]
    });

    const koerperView = Store.addView(collectionId, 'chart', 'Körper');
    Store.updateView(koerperView.id, { chartGruppe: 'woche', chartWert: 'gew', chartTyp: 'line' });

    /* Drei Beispieltage, damit man sofort etwas sieht */
    [[0, true, true, true, 2.4, 8, 2100, 78.5, 8],
     [-1, false, true, false, 1.2, 6.5, 2600, 78.8, 6],
     [-2, true, false, true, 2.0, 7.5, 2200, 78.6, 7]].forEach(([tag, gym, fit, les, was, sch, kcal, gew, sel]) => {
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

    const db = (name, icon, schema, layout) => {
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
      .forEach(([n, kat, kcal, pro]) => {
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

    [[60, 10, 7], [70, 8, 8], [75, 6, 9]].forEach(([g, w, rpe], i) => {
      const r = Store.addRow(satz.collectionId, {
        gewicht: g, wdh: w, rpe, uebRel: [uIds[0]], einRel: [eId]
      });
      Store.updateBlock(r.id, { text: 'Satz ' + (i + 1) });
    });

    ['Wasser trinken', 'Lesen', 'Spazieren', 'Dehnen', 'Früh schlafen'].forEach((n, i) => {
      const r = Store.addRow(habit.collectionId, { dt: heute(), erledigt: i < 4, kat: 'Gesundheit', tagRel: [tIds[0]] });
      Store.updateBlock(r.id, { text: n });
    });

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
     ['Rückmeldung geben','Prüfen','Hoch',0,1]].forEach(([t, st, pr, tage, auf]) => {
      const r = Store.addRow(collectionId, { st, pr, dt: inTagen(tage), auf });
      Store.updateBlock(r.id, { text: t });
    });
    Store.addView(collectionId, 'timeline', 'Zeitplan');
    Store.addView(collectionId, 'calendar', 'Kalender');
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
   * DIE GALERIE
   * ======================================================================*/
  const VORLAGEN = [
    { id: 'habit',   icon: '📊', name: 'Habit-Tracker',
      text: '100-Punkte-Score aus Gym, Schlaf, Wasser, Lesen und Selbstkontrolle. Sechs Ansichten, drei Beispieltage.',
      quelle: 'Teil 12 der Doku', bauen: habitTracker },
    { id: 'fitness', icon: '🏋️', name: 'Fitness-OS',
      text: 'Zehn verknüpfte Datenbanken: Übungen, Sätze, Einheiten, Mahlzeiten, Habits, Körpermasse. Mit Volumen, 1RM und Rollups.',
      quelle: 'Teil 16 der Doku', bauen: fitnessOS },
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
      quelle: '', bauen: wochenplan }
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
      if (e.target === o || e.target.closest('[data-a="zu"]')) { o.remove(); return; }
      const k = e.target.closest('[data-v]');
      if (!k) return;
      const v = VORLAGEN.find(x => x.id === k.dataset.v);
      o.remove();
      const seite = v.bauen();
      App.zeichneBaum();
      App.oeffne(seite.id);
      UI.toast('„' + v.name + '" angelegt');
    });
  };

  return { oeffne, VORLAGEN, habitTracker, fitnessOS };
})();

window.Galerie = Galerie;
