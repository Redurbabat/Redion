/* ============================================================================
 * agent.js — Der Agent
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/bereiche/ki/agenten.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/bereiche/ki/agenten.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
 * Ein Chat beantwortet eine Frage. Ein Agent arbeitet mehrstufig:
 *
 *     Ziel verstehen  →  Plan machen  →  suchen  →  handeln  →  Ergebnis
 *
 * Der Unterschied ist nicht das Modell, sondern die Schleife: der Agent darf
 * Werkzeuge benutzen, sieht deren Ergebnis und entscheidet dann weiter. Jeder
 * Schritt steht im Protokoll und lässt sich einzeln zurücknehmen.
 *
 * VIER AGENTENTYPEN — wie in der Doku
 *   🧭 Persönlicher Assistent   sucht, fasst zusammen, legt an
 *   🔍 Rechercheur              sammelt und vergleicht, schreibt mit Quellen
 *   ✍️ Redakteur                überarbeitet Texte, ohne den Sinn zu ändern
 *   🗂 Datenbank-Baumeister     entwirft Datenbanken und füllt sie
 *
 * Dazu kommen eigene Agenten: eigener Name, eigene Anweisungen, eigene
 * Werkzeugrechte, eigene Wissensquellen, eigene Auslöser, eigenes Guthaben.
 *
 * GUTHABEN
 *   Ein Agent, der sich verrennt, soll nicht ewig weiterlaufen. Jeder Agent
 *   hat ein Guthaben in Schritten. Ist es aufgebraucht, hört er auf und
 *   sagt es. Das ist die ehrliche Version eines Kostenlimits — hier zählt
 *   es Schritte statt Geld, weil die lokale KI nichts kostet.
 * ==========================================================================*/

const Agent = (() => {

  /* Das angeklickte Element — oder nichts. `e.target` ist `EventTarget | null`
     und muss ein `Element` sein, bevor `closest` daran etwas findet. Vorher
     stand hier ungeprüft `e.target.closest(…)`: bei einem Klick, dessen Ziel
     kein Element ist, warf das mitten im Behandeln. */
  const elVon = (e: Event): Element | null =>
    e.target instanceof Element ? e.target : null;

  const esc = (s: string) => String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  /* ========================================================================
   * DIE WERKZEUGE
   * ------------------------------------------------------------------------
   * Jedes Werkzeug ist eine Funktion mit einer Beschreibung, die das Modell
   * lesen kann. Was ein Agent nicht darf, steht ihm gar nicht erst zur
   * Verfügung — die Rechte werden hier gefiltert, nicht im Text erbeten.
   * ======================================================================*/
  const WERKZEUGE: Record<string, any> = {

    suchen: {
      recht: 'lesen',
      beschreibung: 'Sucht im Arbeitsbereich. Argument: {"frage":"Suchtext"}',
      lauf: async (a: any) => {
        const treffer = Kontext.finden(a.frage || '', { anzahl: 6 });
        if (!treffer.length) return 'Nichts gefunden zu: ' + (a.frage || '');
        return treffer.map(t =>
          '- ' + t.titel + (t.datenbank ? ' (aus ' + t.datenbank + ')' : '') +
          ': ' + Kontext.ausschnitt(t, a.frage || '', 260)).join('\n');
      }
    },

    seiteLesen: {
      recht: 'lesen',
      beschreibung: 'Liest eine Seite ganz. Argument: {"titel":"Name der Seite"}',
      lauf: async (a: any) => {
        const p = Object.values<any>(Store.cache.blocks).find(b =>
          b.alive && b.type === 'page' && b.parentTable !== 'collection' &&
          (b.text || '').toLowerCase().includes(String(a.titel || '').toLowerCase()));
        if (!p) return 'Keine Seite gefunden, die „' + a.titel + '" heisst.';
        if (!Konten.darf('lesen', p.id)) return 'Diese Seite darfst du nicht lesen.';
        return p.text + '\n' + Kontext.textVonSeite(p.id).slice(0, 4000);
      }
    },

    seiteAnlegen: {
      recht: 'bearbeiten',
      beschreibung: 'Legt eine Seite an. Argument: ' +
        '{"titel":"…","icon":"📄","bloecke":[{"typ":"h1|h2|text|bullet|todo|quote|callout","text":"…"}]}',
      lauf: async (a: any, protokoll: any) => {
        const p = Store.addPage(App.aktuelleSeite(), { text: a.titel || 'Neue Seite', icon: a.icon || '📄' });
        (a.bloecke || []).forEach((b: any) => {
          const typ = ['h1','h2','h3','text','bullet','number','todo','quote','callout','divider','code']
            .includes(b.typ) ? b.typ : 'text';
          Store.addBlock(p.id, typ, { text: b.text || '' });
        });
        protokoll.ids.push(p.id);
        App.zeichneBaum();
        return 'Seite „' + (a.titel || 'Neue Seite') + '" angelegt mit ' +
               (a.bloecke || []).length + ' Blöcken.';
      }
    },

    datenbankAnlegen: {
      recht: 'bearbeiten',
      beschreibung: 'Legt eine Datenbank an. Argument: ' +
        '{"name":"…","spalten":[{"name":"…","typ":"Text|Zahl|Auswahl|Datum|Kontrollkästchen|Formel",' +
        '"optionen":["…"],"formel":"…"}],"zeilen":[{"Titel":"…","Spalte":"Wert"}]}',
      lauf: async (a: any, protokoll: any) => {
        const erg = KI.datenbankBauenAus(a, App.aktuelleSeite());
        if (erg && erg.blockId) protokoll.ids.push(erg.blockId);
        return erg ? ('Datenbank „' + a.name + '" mit ' + erg.spalten + ' Spalten und ' +
                      erg.zeilen + ' Zeilen angelegt.')
                   : 'Die Datenbank liess sich nicht bauen.';
      }
    },

    zeileAnlegen: {
      recht: 'bearbeiten',
      beschreibung: 'Legt einen Eintrag in einer vorhandenen Datenbank an. Argument: ' +
        '{"datenbank":"Name","werte":{"Spalte":"Wert"}}',
      lauf: async (a: any) => {
        const c = Object.values<any>(Store.cache.collections).find(x =>
          (x.name || '').toLowerCase() === String(a.datenbank || '').toLowerCase());
        if (!c) return 'Keine Datenbank namens „' + a.datenbank + '".';
        const props = {};
        let titel = '';
        Object.entries<any>(a.werte || {}).forEach(([n, v]) => {
          const k = Object.keys(c.schema).find(x => c.schema[x].name.toLowerCase() === n.toLowerCase());
          if (!k) return;
          if (c.schema[k].type === 'title') titel = v; else (props as Record<string, any>)[k] = v;
        });
        const r = Store.addRow(c.id, props);
        Store.updateBlock(r.id, { text: titel || 'Ohne Titel' });
        App.zeichneSeite();
        return 'Eintrag „' + (titel || 'Ohne Titel') + '" in „' + c.name + '" angelegt.';
      }
    },

    datenbankLesen: {
      recht: 'lesen',
      beschreibung: 'Liest eine Datenbank als Tabelle. Argument: {"name":"…","grenze":30}',
      lauf: async (a: any) => {
        const c = Object.values<any>(Store.cache.collections).find(x =>
          (x.name || '').toLowerCase().includes(String(a.name || '').toLowerCase()));
        if (!c) return 'Keine Datenbank gefunden zu „' + a.name + '".';
        const keys = Object.keys(c.schema);
        const kopf = keys.map(k => c.schema[k].name).join(' | ');
        const zeilen = Store.rowsOf(c.id).slice(0, a.grenze || 30).map((r: any) =>
          keys.map(k => Formula.anzeige(Datenbank.wert(r, k, c))).join(' | '));
        return c.name + '\n' + kopf + '\n' + zeilen.join('\n');
      }
    },

    feldFuellen: {
      recht: 'bearbeiten',
      beschreibung: 'Füllt ein Feld aller Einträge einer Datenbank per KI. Argument: ' +
        '{"datenbank":"…","spalte":"…","auftrag":"Was soll dort stehen?"}',
      lauf: async (a: any) => {
        const c = Object.values<any>(Store.cache.collections).find(x =>
          (x.name || '').toLowerCase().includes(String(a.datenbank || '').toLowerCase()));
        if (!c) return 'Keine Datenbank gefunden.';
        const k = Object.keys(c.schema).find(x =>
          c.schema[x].name.toLowerCase() === String(a.spalte || '').toLowerCase());
        if (!k) return 'Keine Spalte namens „' + a.spalte + '".';
        c.schema[k].auftrag = a.auftrag || c.schema[k].auftrag;
        Store.updateCollection(c.id, { schema: c.schema });
        const zeilen = Store.rowsOf(c.id).slice(0, 15);
        for (const r of zeilen) await Datenbank.kiFeldFuellenFuer(r, k, c);
        return zeilen.length + ' Einträge in „' + a.spalte + '" gefüllt.';
      }
    },

    nachschlagen: {
      recht: 'lesen',
      beschreibung: 'Schlägt einen Begriff in der Wikipedia nach. Argument: {"begriff":"…"}',
      lauf: async (a: any) => {
        if (!Kontext.quellen().web) return 'Die Websuche ist ausgeschaltet.';
        const d = await KI.wikipedia(a.begriff || '');
        return d ? (d.titel + ': ' + d.text) : 'Kein Wikipedia-Eintrag zu „' + a.begriff + '".';
      }
    },

    kalenderLesen: {
      recht: 'lesen',
      beschreibung: 'Liest die nächsten Termine. Argument: {"tage":14}',
      lauf: async (a: any) => {
        const c = Object.values<any>(Store.cache.collections).find(x => x.schema && x.schema.start && x.schema.uid);
        if (!c) return 'Es gibt noch keine Termin-Datenbank.';
        const grenze = new Date();
        grenze.setDate(grenze.getDate() + (Number(a.tage) || 14));
        const heute = new Date(); heute.setHours(0, 0, 0, 0);
        const liste = Store.rowsOf(c.id)
          .map((r: any) => ({ r, d: new Date(Datenbank.wert(r, 'start', c) || 0) }))
          .filter((x: any) => !isNaN(x.d) && x.d >= heute && x.d <= grenze)
          .sort((a2: any, b2: any) => a2.d - b2.d)
          .slice(0, 40);
        if (!liste.length) return 'Keine Termine in diesem Zeitraum.';
        return liste.map((x: any) => x.d.toLocaleDateString('de-DE') + ' ' +
          (String(Datenbank.wert(x.r, 'start', c)).length > 10
            ? String(Datenbank.wert(x.r, 'start', c)).slice(11, 16) + ' ' : '') +
          x.r.text).join('\n');
      }
    },

    mailLesen: {
      recht: 'lesen',
      beschreibung: 'Liest die letzten Mails. Argument: {"nurUngelesen":true,"grenze":20}',
      lauf: async (a: any) => {
        const c = Object.values<any>(Store.cache.collections).find(x => x.schema && x.schema.mid && x.schema.von);
        if (!c) return 'Es gibt noch keine Mail-Datenbank.';
        let zeilen = Store.rowsOf(c.id);
        if (a.nurUngelesen) zeilen = zeilen.filter((r: any) => !Datenbank.wert(r, 'gelesen', c));
        return zeilen.slice(0, a.grenze || 20).map((r: any) =>
          '- ' + Datenbank.wert(r, 'von', c) + ': ' + r.text + ' — ' +
          String(Datenbank.wert(r, 'kurz', c) || '').slice(0, 120)).join('\n') || 'Keine Mails.';
      }
    },

    worker: {
      recht: 'bearbeiten',
      beschreibung: 'Führt einen gespeicherten Worker aus. Argument: {"name":"…","eingabe":{}}',
      lauf: async (a: any) => {
        const w = worker().find((x: any) => x.name === a.name);
        if (!w) return 'Keinen Worker namens „' + a.name + '" gefunden. Vorhanden: ' +
                      (worker().map((x: any) => x.name).join(', ') || 'keiner');
        try {
          const raus = await workerLaufen(w, a.eingabe || {});
          return 'Worker „' + w.name + '" sagt: ' + JSON.stringify(raus).slice(0, 1200);
        } catch (e: unknown) { return 'Worker „' + w.name + '" ist gescheitert: ' +
          (e instanceof Error ? e.message : String(e)); }
      }
    },

    fertig: {
      recht: 'lesen',
      beschreibung: 'Beendet die Arbeit. Argument: {"antwort":"Das Ergebnis für den Menschen"}',
      lauf: async (a: any) => a.antwort || 'Fertig.'
    }
  };

  /* ========================================================================
   * DIE VIER TYPEN
   * ======================================================================*/
  const TYPEN = [
    { id: 'assistent', icon: '🧭', name: 'Persönlicher Assistent',
      text: 'Sucht im Arbeitsbereich, fasst zusammen, legt Seiten und Einträge an.',
      werkzeuge: ['suchen','seiteLesen','seiteAnlegen','zeileAnlegen','datenbankLesen',
                  'kalenderLesen','mailLesen','fertig'],
      anweisung: 'Du bist ein persönlicher Assistent. Arbeite ruhig und knapp. ' +
        'Suche zuerst im Arbeitsbereich, bevor du etwas behauptest. ' +
        'Wenn du etwas anlegst, sag genau, was du angelegt hast.' },

    { id: 'recherche', icon: '🔍', name: 'Rechercheur',
      text: 'Sammelt aus mehreren Quellen, vergleicht und schreibt mit Quellenangabe.',
      werkzeuge: ['suchen','seiteLesen','datenbankLesen','nachschlagen','seiteAnlegen','fertig'],
      anweisung: 'Du recherchierst. Sammle erst breit, dann ordne. Nenne zu jeder Aussage, ' +
        'woher sie stammt. Was du nicht belegen kannst, kennzeichnest du als Vermutung.' },

    { id: 'redakteur', icon: '✍️', name: 'Redakteur',
      text: 'Überarbeitet Texte, ohne den Sinn zu verändern.',
      werkzeuge: ['seiteLesen','suchen','fertig'],
      anweisung: 'Du überarbeitest Texte. Der Sinn bleibt, die Sprache wird klarer. ' +
        'Keine neuen Behauptungen, keine Ausschmückung. Schreib in ganzen Sätzen.' },

    { id: 'bau', icon: '🗂', name: 'Datenbank-Baumeister',
      text: 'Entwirft Datenbanken, legt Spalten an und füllt sie.',
      werkzeuge: ['suchen','datenbankLesen','datenbankAnlegen','zeileAnlegen','feldFuellen','fertig'],
      anweisung: 'Du baust Datenbanken. Denk zuerst über die Spalten nach: welcher Typ, ' +
        'welche Optionen, welche Formel. Lege lieber wenige gute Spalten an als viele halbe.' }
  ];

  /* ========================================================================
   * EIGENE AGENTEN
   * ======================================================================*/
  const eigene = () => Store.getMeta('agent:eigene', []) || [];
  const eigeneSpeichern = (l: any) => Store.setMeta('agent:eigene', l);

  const alle = () => [
    ...TYPEN.map(t => ({ ...t, fest: true })),
    ...eigene()
  ];

  const holen = (id: any) => alle().find(a => a.id === id) || TYPEN[0];

  /* ========================================================================
   * WORKERS — eigener Code als Werkzeug
   * ------------------------------------------------------------------------
   * Der Code läuft in einem Web Worker: eigener Faden, kein Zugriff auf die
   * Seite, kein Zugriff auf die Daten. Was hineingeht und was herauskommt,
   * bestimmt allein die Nachricht. Damit kann ein Worker rechnen und Text
   * verarbeiten, aber nichts kaputtmachen.
   * ======================================================================*/
  const WORKER_BEISPIEL =
    '/* Eingabe steht in "eingabe", das Ergebnis kommt aus return. */\n' +
    'const zahlen = (eingabe.werte || []).map(Number).filter(n => !isNaN(n));\n' +
    'const summe = zahlen.reduce((a, b) => a + b, 0);\n' +
    'return { summe, schnitt: zahlen.length ? summe / zahlen.length : 0, anzahl: zahlen.length };';

  const worker = () => Store.getMeta('agent:worker', []) || [];
  const workerSpeichern = (l: any) => Store.setMeta('agent:worker', l);

  const workerLaufen = (w: any, eingabe: any) => new Promise((ok, fehler) => {
    const quelle =
      'self.onmessage = async (e) => {\n' +
      '  const eingabe = e.data;\n' +
      '  try {\n' +
      '    const fn = new Function("eingabe", ' + JSON.stringify('return (async () => {' + w.code + '})();') + ');\n' +
      '    const r = await fn(eingabe);\n' +
      '    self.postMessage({ ok: true, wert: r });\n' +
      '  } catch (err) { self.postMessage({ ok: false, fehler: String(err && err.message || err) }); }\n' +
      '};';
    let u;
    try {
      u = URL.createObjectURL(new Blob([quelle], { type: 'text/javascript' }));
    } catch (e) { fehler(new Error('Worker lassen sich hier nicht starten.')); return; }

    const wk = new Worker(u);
    const wache = setTimeout(() => {
      wk.terminate(); URL.revokeObjectURL(u);
      fehler(new Error('Der Worker hat zu lange gebraucht (über 5 Sekunden).'));
    }, 5000);

    wk.onmessage = (e) => {
      clearTimeout(wache); wk.terminate(); URL.revokeObjectURL(u);
      e.data.ok ? ok(e.data.wert) : fehler(new Error(e.data.fehler));
    };
    wk.onerror = (e) => {
      clearTimeout(wache); wk.terminate(); URL.revokeObjectURL(u);
      fehler(new Error(e.message || 'Fehler im Worker'));
    };
    wk.postMessage(eingabe || {});
  });

  /* ========================================================================
   * DIE SCHLEIFE
   * ======================================================================*/
  const laeufe = () => Store.getMeta('agent:laeufe', []) || [];

  const werkzeugText = (namen: any) => namen
    .filter((n: any) => WERKZEUGE[n])
    .map((n: any) => '- ' + n + ': ' + WERKZEUGE[n].beschreibung)
    .join('\n');

  const JSON_HOLEN = (text: string) => {
    const t = String(text || '');
    const start = t.indexOf('{');
    if (start < 0) return null;
    let tiefe = 0, inText = false, flucht = false;
    for (let i = start; i < t.length; i++) {
      const c = t[i];
      if (flucht) { flucht = false; continue; }
      if (c === '\\') { flucht = true; continue; }
      if (c === '"') inText = !inText;
      if (inText) continue;
      if (c === '{') tiefe++;
      if (c === '}') { tiefe--; if (!tiefe) {
        try { return JSON.parse(t.slice(start, i + 1)); } catch { return null; }
      } }
    }
    return null;
  };

  /**
   * Lässt einen Agenten arbeiten.
   * @param agentId   welcher Agent
   * @param auftrag   was er tun soll
   * @param beiSchritt Rückmeldung nach jedem Schritt
   */
  const laufen = async (agentId: any, auftrag: any, beiSchritt?: any) => {
    const a = holen(agentId);
    const guthaben = Number(a.guthaben) || 8;
    const erlaubt = (a.werkzeuge || []).filter((n: any) => WERKZEUGE[n]);

    /* Berechtigungsschicht: kein Werkzeug, das der angemeldete Mensch selbst
       nicht dürfte. Der Agent kann nicht mehr als du. */
    const nutzbar = erlaubt.filter((n: any) => Konten.darf(WERKZEUGE[n].recht));
    const gesperrt = erlaubt.filter((n: any) => !nutzbar.includes(n));

    /* Ein Schritt des Agenten: was er sich gedacht hat, welches Werkzeug er
       genommen hat und was dabei herauskam. `ergebnis` steht erst nach dem
       Lauf fest — deshalb wahlweise. */
    type Schritt = { nr: number; gedanke: string; werkzeug: string;
                     argument?: any; ergebnis?: string };
    type Protokoll = { agent: string; auftrag: string; schritte: Schritt[];
                       ids: string[]; zeit: any; antwort?: string };
    const protokoll: Protokoll = { agent: a.name, auftrag, schritte: [], ids: [], zeit: Store.now() };

    /* Wissensquellen des Agenten kommen gleich mit in den Kontext */
    const wissen = (a.wissen || []).map((id: any) => {
      const p = Store.getBlock(id);
      return p && Konten.darf('lesen', p.id)
        ? '## ' + (p.text || 'Ohne Titel') + '\n' + Kontext.textVonSeite(p.id).slice(0, 1500) : '';
    }).filter(Boolean).join('\n\n');

    const system =
      (a.anweisung || '') + '\n\n' +
      (Store.getMeta('ki:persoenlich', '') ? 'Dauerhafte Anweisungen des Menschen:\n' +
        Store.getMeta('ki:persoenlich', '') + '\n\n' : '') +
      'Du arbeitest in Schritten. Antworte in JEDEM Schritt mit genau einem JSON-Objekt, ' +
      'ohne Text davor oder danach:\n' +
      '{"gedanke":"kurz, was du vorhast","werkzeug":"name","argument":{…}}\n\n' +
      'Diese Werkzeuge hast du:\n' + werkzeugText(nutzbar) + '\n\n' +
      (gesperrt.length ? 'Nicht erlaubt (fehlende Rechte): ' + gesperrt.join(', ') + '\n\n' : '') +
      'Regeln: Suche, bevor du behauptest. Lege nichts doppelt an. ' +
      'Wenn du fertig bist, nimm das Werkzeug "fertig" und schreib die Antwort für den Menschen.' +
      (wissen ? '\n\nDas ist dein hinterlegtes Wissen:\n' + wissen : '');

    const verlauf = [{ role: 'user', content: auftrag }];

    for (let i = 0; i < guthaben; i++) {
      const antwort = await KI.frageKurz(
        verlauf.map(m => (m.role === 'user' ? 'MENSCH: ' : 'DU: ') + m.content).join('\n\n') +
        '\n\nDein nächster Schritt als JSON:', system);

      const plan = JSON_HOLEN(antwort);
      if (!plan || !plan.werkzeug) {
        protokoll.schritte.push({ nr: i + 1, gedanke: 'Antwort ohne Plan', werkzeug: 'fertig',
                                  ergebnis: String(antwort).slice(0, 2000) });
        break;
      }

      const schritt: Schritt = { nr: i + 1, gedanke: plan.gedanke || '', werkzeug: plan.werkzeug,
                        argument: plan.argument || {} };

      if (plan.werkzeug === 'fertig') {
        schritt.ergebnis = (plan.argument && plan.argument.antwort) || 'Fertig.';
        protokoll.schritte.push(schritt);
        if (beiSchritt) beiSchritt(schritt, protokoll);
        break;
      }

      const wz = WERKZEUGE[plan.werkzeug];
      if (!wz || !nutzbar.includes(plan.werkzeug)) {
        schritt.ergebnis = 'Dieses Werkzeug gibt es nicht oder du darfst es nicht. ' +
                           'Erlaubt sind: ' + nutzbar.join(', ');
      } else {
        try {
          schritt.ergebnis = String(await wz.lauf(plan.argument || {}, protokoll) || '').slice(0, 4000);
        } catch (e: unknown) {
          schritt.ergebnis = 'Das Werkzeug ist gescheitert: ' +
            (e instanceof Error ? e.message : String(e));
        }
      }

      protokoll.schritte.push(schritt);
      if (beiSchritt) beiSchritt(schritt, protokoll);

      verlauf.push({ role: 'assistant', content: JSON.stringify(plan) });
      verlauf.push({ role: 'user', content: 'Ergebnis von ' + plan.werkzeug + ':\n' + schritt.ergebnis });

      if (i === guthaben - 1) {
        protokoll.schritte.push({ nr: i + 2, gedanke: 'Guthaben aufgebraucht', werkzeug: 'fertig',
          ergebnis: 'Das Guthaben von ' + guthaben + ' Schritten ist aufgebraucht. ' +
                    'Was bis hierhin herauskam, steht oben.' });
      }
    }

    const l = laeufe();
    l.unshift(protokoll);
    Store.setMeta('agent:laeufe', l.slice(0, 30));
    return protokoll;
  };

  /** Alles zurücknehmen, was ein Lauf angelegt hat. */
  const zuruecknehmen = (protokoll: any) => {
    (protokoll.ids || []).forEach((id: any) => { Store.trashBlock(id); Store.purgeBlock(id); });
    App.zeichneBaum(); App.zeichneSeite();
  };

  /* ========================================================================
   * AUSLÖSER — der Agent läuft von selbst
   * ======================================================================*/
  const ausloeserPruefen = async () => {
    const jetzt = new Date();
    const liste = eigene();
    let geaendert = false;

    for (const a of liste) {
      const t = a.ausloeser;
      if (!t || !t.art) continue;
      if (t.art === 'taeglich') {
        if (jetzt.getHours() < (Number(t.stunde) || 8)) continue;
        const tag = jetzt.toISOString().slice(0, 10);
        if (t.zuletzt === tag) continue;
        t.zuletzt = tag;
        geaendert = true;
        UI.toast('🤖 ' + a.name + ' läuft …');
        try { await laufen(a.id, t.auftrag || a.anweisung || 'Mach deine tägliche Runde.'); }
        catch (e: unknown) { UI.banner(a.name + ': ' +
          (e instanceof Error ? e.message : String(e)), 'warn'); }
      }
    }
    if (geaendert) eigeneSpeichern(liste);
  };

  const start = () => {
    setTimeout(ausloeserPruefen, 9000);
    setInterval(ausloeserPruefen, 1800000);
  };

  /* ========================================================================
   * OBERFLÄCHE
   * ======================================================================*/
  const panel = (vorgabe = '') => {
    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML = '<div class="finder" style="width:min(760px,95vw)">' +
      '<div class="fh">🤖 Agent<button class="icon-btn" data-a="zu">✕</button></div>' +
      '<div style="padding:12px 18px 4px">' +
        '<div class="agent-typen" id="at"></div>' +
        `<textarea id="aa" rows="3" placeholder="Was soll der Agent tun? Zum Beispiel: ` +
          `Finde alle offenen Punkte aus meinen Notizen und leg daraus eine Aufgabenliste an."` +
          `>${esc(vorgabe)}</textarea>` +
      '</div>' +
      '<div class="res" id="al" style="max-height:44vh"></div>' +
      '<div class="fbtns"><button data-a="los" class="prim">Loslegen</button>' +
        '<button data-a="eigen">Eigener Agent</button>' +
        '<button data-a="worker">Workers</button>' +
        '<button data-a="verlauf">Frühere Läufe</button>' +
        '<button data-a="zu">Schliessen</button></div></div>';
    document.body.appendChild(o);

    let gewaehlt = Store.getMeta('agent:zuletzt', 'assistent');

    const zeichneTypen = (): void => {
      const kasten = o.querySelector('#at');
      if (!kasten) return;
      kasten.innerHTML = alle().map((a: any) =>
        `<button class="agent-karte${a.id === gewaehlt ? ' on' : ''}" data-t="${esc(a.id)}">` +
        `<span class="agent-ico">${a.icon || '🤖'}</span>` +
        `<b>${esc(a.name)}</b><span>${esc(a.text || a.anweisung || '').slice(0, 70)}</span>` +
        `<em>${(a.werkzeuge || []).length} Werkzeuge · ${a.guthaben || 8} Schritte</em>` +
        '</button>').join('');
    };
    zeichneTypen();

    const zeigeSchritt = (s: any): void => {
      const liste = o.querySelector('#al');
      if (!liste) return;
      const el = document.createElement('div');
      el.className = 'agent-schritt';
      el.innerHTML =
        `<div class="as-kopf"><span class="as-nr">${s.nr}</span>` +
        `<b>${esc(s.werkzeug)}</b>` +
        (s.gedanke ? `<span class="as-gedanke">${esc(s.gedanke)}</span>` : '') + '</div>' +
        `<div class="as-erg">${esc(String(s.ergebnis || '')).slice(0, 1200).replace(/\n/g, '<br>')}</div>`;
      liste.appendChild(el);
      liste.scrollTop = 99999;
    };

    o.addEventListener('click', async e => {
      if (e.target === o || elVon(e)?.closest<HTMLElement>('[data-a="zu"]')) { o.remove(); return; }
      const t = elVon(e)?.closest<HTMLElement>('[data-t]');
      if (t) { gewaehlt = t.dataset.t; Store.setMeta('agent:zuletzt', gewaehlt); zeichneTypen(); return; }

      const b = elVon(e)?.closest<HTMLElement>('button[data-a]');
      if (!b) return;

      if (b.dataset.a === 'eigen')   { o.remove(); eigenerDialog(); return; }
      if (b.dataset.a === 'worker')  { o.remove(); workerDialog(); return; }
      if (b.dataset.a === 'verlauf') { o.remove(); verlaufDialog(); return; }

      if (b.dataset.a === 'los') {
        const auftrag = (o.querySelector<HTMLTextAreaElement>('#aa')?.value || '').trim();
        const liste = o.querySelector('#al');
        if (!auftrag) { UI.toast('Was soll er tun?'); return; }
        if (!liste) return;
        liste.innerHTML = '<div class="agent-laeuft">Der Agent denkt nach …</div>';
        (b as HTMLButtonElement).disabled = true;
        try {
          const erst = o.querySelector('.agent-laeuft');
          const p = await laufen(gewaehlt, auftrag, (s: any) => {
            if (erst) erst.remove();
            zeigeSchritt(s);
          });
          const letzte = p.schritte[p.schritte.length - 1];
          const fertig = document.createElement('div');
          fertig.className = 'agent-fertig';
          fertig.innerHTML = '<b>Ergebnis</b><div>' +
            esc(String(letzte?.ergebnis || '')).replace(/\n/g, '<br>') + '</div>' +
            (p.ids.length ? `<button data-zurueck="1">${p.ids.length} angelegte Seiten zurücknehmen</button>` : '');
          liste.appendChild(fertig);
          fertig.querySelector('[data-zurueck]')?.addEventListener('click', () => {
            zuruecknehmen(p); UI.toast('Zurückgenommen'); fertig.querySelector('button')?.remove();
          });
        } catch (err: unknown) {
          liste.innerHTML = '<div class="agent-fehler">' +
            esc(err instanceof Error ? err.message : String(err)) + '</div>';
        }
        (b as HTMLButtonElement).disabled = false;
      }
    });
  };

  const eigenerDialog = () => {
    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML = '<div class="finder" style="width:min(680px,94vw)">' +
      '<div class="fh">🤖 Eigene Agenten<button class="icon-btn" data-a="zu">✕</button></div>' +
      '<div class="res" id="el"></div>' +
      '<div class="fbtns"><button data-a="neu" class="prim">＋ Agent anlegen</button>' +
      '<button data-a="zu">Fertig</button></div></div>';
    document.body.appendChild(o);

    const zeichne = (): void => {
      const l = eigene();
      const kasten = o.querySelector('#el');
      if (!kasten) return;
      kasten.innerHTML = l.length
        ? l.map((a: any, i: any) =>
            `<div class="frei-zeile"><span class="frei-kreis bg-purple">${a.icon || '🤖'}</span>` +
            `<span class="frei-name"><b>${esc(a.name)}</b>` +
            `<span>${(a.werkzeuge || []).length} Werkzeuge · ${a.guthaben || 8} Schritte` +
            `${a.ausloeser?.art === 'taeglich' ? ' · täglich ab ' + a.ausloeser.stunde + ' Uhr' : ''}` +
            `${(a.wissen || []).length ? ' · ' + a.wissen.length + ' Wissensseiten' : ''}</span></span>` +
            `<button data-bearb="${i}">✎</button><button data-weg="${i}">🗑</button></div>`).join('')
        : '<div style="padding:18px;color:var(--text-faint);font-size:14px">' +
          'Noch kein eigener Agent. Ein eigener Agent hat eigene Anweisungen, eigene ' +
          'Werkzeugrechte, eigene Wissensseiten und darf zu einer festen Uhrzeit von ' +
          'selbst loslegen.</div>';
    };
    zeichne();

    const bauen = async (vorhanden: any, index2: any) => {
      const o2 = document.createElement('div');
      o2.className = 'overlay';
      const a = vorhanden || { name: '', icon: '🤖', anweisung: '', guthaben: 8,
                               werkzeuge: ['suchen','seiteLesen','fertig'], wissen: [], ausloeser: {} };
      const seiten = Object.values<any>(Store.cache.blocks)
        .filter(b => b.type === 'page' && b.alive && b.parentTable !== 'collection')
        .sort((x, y) => (x.text || '').localeCompare(y.text || ''));

      o2.innerHTML = '<div class="finder" style="width:min(620px,94vw)">' +
        `<div class="fh">${vorhanden ? 'Agent ändern' : 'Neuer Agent'}` +
          '<button class="icon-btn" data-a="zu">✕</button></div>' +
        '<div style="padding:16px 18px; display:flex; flex-direction:column; gap:13px; ' +
             'max-height:64vh; overflow:auto">' +
          `<label>Name<br><input id="en" value="${esc(a.name)}" placeholder="z. B. Morgenrunde"></label>` +
          `<label>Symbol<br><input id="ei" value="${esc(a.icon || '🤖')}" style="width:70px"></label>` +
          '<label>Anweisung — wie soll er arbeiten?<br>' +
            `<textarea id="ea" rows="4">${esc(a.anweisung)}</textarea></label>` +
          '<label>Werkzeuge, die er benutzen darf<br><div class="wz-liste">' +
            Object.keys(WERKZEUGE).map(w =>
              `<label class="wz-w"><input type="checkbox" data-w="${w}"` +
              `${(a.werkzeuge || []).includes(w) ? ' checked' : ''}> ${w}</label>`).join('') +
          '</div></label>' +
          '<label>Wissensseiten — die kennt er immer<br><select id="ew" multiple size="5">' +
            seiten.slice(0, 200).map(p =>
              `<option value="${p.id}"${(a.wissen || []).includes(p.id) ? ' selected' : ''}>` +
              `${esc(p.text || 'Ohne Titel')}</option>`).join('') +
          '</select></label>' +
          `<label>Guthaben — wie viele Schritte höchstens<br>` +
            `<input id="eg" type="number" min="1" max="30" value="${a.guthaben || 8}"></label>` +
          '<label>Auslöser<br><select id="et">' +
            `<option value=""${!a.ausloeser?.art ? ' selected' : ''}>nur auf Zuruf</option>` +
            `<option value="taeglich"${a.ausloeser?.art === 'taeglich' ? ' selected' : ''}>` +
              'jeden Tag zu einer Uhrzeit</option>' +
          '</select></label>' +
          '<label id="ets">Ab wann<br>' +
            `<input id="es" type="number" min="0" max="23" value="${a.ausloeser?.stunde ?? 8}"></label>` +
          '<label id="eta">Was soll er dann tun?<br>' +
            `<input id="eauf" value="${esc(a.ausloeser?.auftrag || '')}" ` +
            'placeholder="z. B. Fasse zusammen, was gestern dazugekommen ist."></label>' +
        '</div>' +
        '<div class="fbtns"><button data-a="ok" class="prim">Sichern</button>' +
        '<button data-a="zu">Abbrechen</button></div></div>';
      document.body.appendChild(o2);

      const auffrischen = (): void => {
        const an = o2.querySelector<HTMLSelectElement>('#et')?.value === 'taeglich';
        const ets = o2.querySelector<HTMLElement>('#ets');
        const eta = o2.querySelector<HTMLElement>('#eta');
        if (ets) ets.style.display = an ? '' : 'none';
        if (eta) eta.style.display = an ? '' : 'none';
      };
      auffrischen();
      o2.querySelector('#et')?.addEventListener('change', auffrischen);

      o2.addEventListener('click', ev => {
        const ziel = elVon(ev);
        if (ev.target === o2 || ziel?.closest('[data-a="zu"]')) { o2.remove(); return; }
        if (!ziel?.closest('[data-a="ok"]')) return;
        /* Alle Felder auf einmal holen. Fehlt eines, ist das Fenster nicht
           das, wofür wir es halten — dann lieber nichts sichern als einen
           halben Agenten. */
        const feld = (id: string) => o2.querySelector<HTMLInputElement>(id);
        const en = feld('#en'), ei = feld('#ei'), ea = feld('#ea'), eg = feld('#eg');
        const ew = o2.querySelector<HTMLSelectElement>('#ew');
        const et = o2.querySelector<HTMLSelectElement>('#et');
        if (!en || !ei || !ea || !eg || !ew || !et) return;
        const neu: Record<string, any> = {
          id: (vorhanden && vorhanden.id) || 'e' + Store.uid().slice(0, 6),
          name: en.value || 'Agent',
          icon: ei.value || '🤖',
          anweisung: ea.value,
          werkzeuge: [...o2.querySelectorAll<HTMLElement>('[data-w]:checked')].map(x => x.dataset.w),
          wissen: [...ew.selectedOptions].map(x => x.value),
          guthaben: Number(eg.value) || 8,
          text: (ea.value || '').slice(0, 90)
        };
        const art = et.value;
        if (art === 'taeglich') neu.ausloeser = {
          art, stunde: Number(feld('#es')?.value) || 8,
          auftrag: feld('#eauf')?.value || '',
          zuletzt: (vorhanden && vorhanden.ausloeser && vorhanden.ausloeser.zuletzt) || null
        };
        const l = eigene();
        if (index2 == null) l.push(neu); else l[index2] = neu;
        eigeneSpeichern(l);
        o2.remove(); zeichne();
        UI.toast('Agent gesichert');
      });
    };

    o.addEventListener('click', e => {
      if (e.target === o || elVon(e)?.closest<HTMLElement>('[data-a="zu"]')) { o.remove(); return; }
      const bearb = elVon(e)?.closest<HTMLElement>('[data-bearb]');
      if (bearb) { bauen(eigene()[Number(bearb.dataset.bearb)], Number(bearb.dataset.bearb)); return; }
      const weg = elVon(e)?.closest<HTMLElement>('[data-weg]');
      if (weg) { const l = eigene(); l.splice(Number(weg.dataset.weg), 1); eigeneSpeichern(l); zeichne(); return; }
      if (elVon(e)?.closest<HTMLElement>('[data-a="neu"]')) bauen(null, null);
    });
  };

  const workerDialog = () => {
    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML = '<div class="finder" style="width:min(700px,94vw)">' +
      '<div class="fh">⚙️ Workers<button class="icon-btn" data-a="zu">✕</button></div>' +
      '<div style="padding:10px 18px 0; font-size:13px; color:var(--text-dim); line-height:1.6">' +
        'Ein Worker ist ein kleines Stück eigener Code, das der Agent als Werkzeug aufrufen kann. ' +
        'Er läuft in einem eigenen Faden ohne Zugriff auf die Seite oder deine Daten — nur die ' +
        'Eingabe geht hinein, nur der Rückgabewert kommt heraus. Nach fünf Sekunden wird er ' +
        'abgebrochen.</div>' +
      '<div class="res" id="wl"></div>' +
      '<div class="fbtns"><button data-a="neu" class="prim">＋ Worker</button>' +
      '<button data-a="zu">Fertig</button></div></div>';
    document.body.appendChild(o);

    const zeichne = (): void => {
      const l = worker();
      const kasten = o.querySelector('#wl');
      if (!kasten) return;
      kasten.innerHTML = l.length
        ? l.map((w: any, i: any) =>
            `<div class="frei-zeile"><span class="frei-kreis bg-orange">⚙️</span>` +
            `<span class="frei-name"><b>${esc(w.name)}</b>` +
            `<span>${esc(w.beschreibung || '').slice(0, 60) || 'ohne Beschreibung'}</span></span>` +
            `<button data-test="${i}">Testen</button>` +
            `<button data-bearb="${i}">✎</button><button data-weg="${i}">🗑</button></div>`).join('')
        : '<div style="padding:18px;color:var(--text-faint);font-size:14px">Noch kein Worker.</div>';
    };
    zeichne();

    const bauen = (vorhanden: any, index2: any) => {
      const w = vorhanden || { name: '', beschreibung: '', code: WORKER_BEISPIEL };
      const o2 = document.createElement('div');
      o2.className = 'overlay';
      o2.innerHTML = '<div class="finder" style="width:min(680px,94vw)">' +
        '<div class="fh">Worker<button class="icon-btn" data-a="zu">✕</button></div>' +
        '<div style="padding:16px 18px; display:flex; flex-direction:column; gap:12px">' +
          `<label>Name<br><input id="wn" value="${esc(w.name)}" placeholder="z. B. summe"></label>` +
          `<label>Wozu ist er da?<br><input id="wb" value="${esc(w.beschreibung || '')}"></label>` +
          '<label>Code — <code>eingabe</code> hinein, <code>return</code> heraus<br>' +
            `<textarea id="wc" rows="10" spellcheck="false" ` +
            `style="font:12.5px/1.55 var(--mono)">${esc(w.code)}</textarea></label>` +
        '</div>' +
        '<div class="fbtns"><button data-a="ok" class="prim">Sichern</button>' +
        '<button data-a="zu">Abbrechen</button></div></div>';
      document.body.appendChild(o2);
      o2.addEventListener('click', ev => {
        const ziel = elVon(ev);
        if (ev.target === o2 || ziel?.closest('[data-a="zu"]')) { o2.remove(); return; }
        if (!ziel?.closest('[data-a="ok"]')) return;
        const wn = o2.querySelector<HTMLInputElement>('#wn');
        const wb = o2.querySelector<HTMLInputElement>('#wb');
        const wc = o2.querySelector<HTMLTextAreaElement>('#wc');
        if (!wn || !wb || !wc) return;
        const neu = { name: wn.value || 'worker',
                      beschreibung: wb.value,
                      code: wc.value };
        const l = worker();
        if (index2 == null) l.push(neu); else l[index2] = neu;
        workerSpeichern(l);
        o2.remove(); zeichne();
        UI.toast('Worker gesichert');
      });
    };

    o.addEventListener('click', async e => {
      if (e.target === o || elVon(e)?.closest<HTMLElement>('[data-a="zu"]')) { o.remove(); return; }
      const test = elVon(e)?.closest<HTMLElement>('[data-test]');
      if (test) {
        const w = worker()[Number(test.dataset.test)];
        const roh = await UI.frage('Eingabe als JSON', '{"werte":[1,2,3]}');
        if (roh == null) return;
        try {
          const erg = await workerLaufen(w, JSON.parse(roh));
          UI.toast('Ergebnis: ' + JSON.stringify(erg).slice(0, 120));
        } catch (err: unknown) { UI.banner('Worker: ' +
          (err instanceof Error ? err.message : String(err)), 'warn'); }
        return;
      }
      const bearb = elVon(e)?.closest<HTMLElement>('[data-bearb]');
      if (bearb) { bauen(worker()[Number(bearb.dataset.bearb)], Number(bearb.dataset.bearb)); return; }
      const weg = elVon(e)?.closest<HTMLElement>('[data-weg]');
      if (weg) { const l = worker(); l.splice(Number(weg.dataset.weg), 1); workerSpeichern(l); zeichne(); return; }
      if (elVon(e)?.closest<HTMLElement>('[data-a="neu"]')) bauen(null, null);
    });
  };

  const verlaufDialog = () => {
    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML = '<div class="finder" style="width:min(720px,94vw)">' +
      '<div class="fh">🧾 Frühere Läufe<button class="icon-btn" data-a="zu">✕</button></div>' +
      '<div class="res" id="vl" style="max-height:62vh"></div>' +
      '<div class="fbtns"><button data-a="leeren">Verlauf leeren</button>' +
      '<button data-a="zu" class="prim">Fertig</button></div></div>';
    document.body.appendChild(o);

    const zeichne = (): void => {
      const l = laeufe();
      const kasten = o.querySelector('#vl');
      if (!kasten) return;
      kasten.innerHTML = l.length
        ? l.map((p: any, i: any) =>
            `<details class="lauf"><summary><b>${esc(p.agent)}</b> · ${esc(p.auftrag).slice(0, 60)}` +
            `<em>${p.schritte.length} Schritte · ${esc(String(p.zeit).slice(0, 16).replace('T', ' '))}</em>` +
            '</summary>' +
            p.schritte.map((s: any) => `<div class="agent-schritt"><div class="as-kopf">` +
              `<span class="as-nr">${s.nr}</span><b>${esc(s.werkzeug)}</b>` +
              `<span class="as-gedanke">${esc(s.gedanke || '')}</span></div>` +
              `<div class="as-erg">${esc(String(s.ergebnis || '')).slice(0, 700)}</div></div>`).join('') +
            (p.ids && p.ids.length ? `<button data-zurueck="${i}">Angelegtes zurücknehmen</button>` : '') +
            '</details>').join('')
        : '<div style="padding:18px;color:var(--text-faint);font-size:14px">Noch kein Lauf.</div>';
    };
    zeichne();

    o.addEventListener('click', e => {
      if (e.target === o || elVon(e)?.closest<HTMLElement>('[data-a="zu"]')) { o.remove(); return; }
      const z = elVon(e)?.closest<HTMLElement>('[data-zurueck]');
      if (z) { zuruecknehmen(laeufe()[Number(z.dataset.zurueck)]); UI.toast('Zurückgenommen'); return; }
      if (elVon(e)?.closest<HTMLElement>('[data-a="leeren"]')) { Store.setMeta('agent:laeufe', []); zeichne(); }
    });
  };

  return { WERKZEUGE, TYPEN, alle, holen, eigene, laufen, zuruecknehmen, laeufe,
           worker, workerLaufen, WORKER_BEISPIEL, panel, eigenerDialog, workerDialog,
           verlaufDialog, start, ausloeserPruefen, JSON_HOLEN };
})();

(window as any).Agent = Agent;
