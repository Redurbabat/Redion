/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/bereiche/ki/kontext.ts (npm run bauen:ts). */
/* ============================================================================
 * ki-kontext.js — Kontext, Berechtigung und Suche für die KI
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/bereiche/ki/kontext.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/bereiche/ki/kontext.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
 * Das ist die Schicht, die in Notion zwischen deiner Frage und dem Modell
 * sitzt. Sie beantwortet drei Fragen, bevor das Modell überhaupt etwas sieht:
 *
 *   1. WELCHE QUELLEN sind erlaubt?        → Kontext-Schicht
 *   2. WAS DARF ICH DAVON LESEN?           → Berechtigungsschicht
 *   3. WELCHE STELLEN PASSEN ZUR FRAGE?    → Suche / Retrieval
 *
 * Zusammen ist das RAG: das Modell weiss nichts über deinen Arbeitsbereich,
 * es bekommt die passenden Ausschnitte gereicht und schreibt daraus eine
 * Antwort — mit Quellen, damit man nachsehen kann.
 *
 * DIE SUCHE
 *   Ohne fremden Dienst gibt es keine echten Embeddings. Statt so zu tun,
 *   als gäbe es welche, steht hier ein Verfahren, das man versteht:
 *
 *     · BM25          zählt Wörter, gewichtet seltene Wörter höher
 *     · Wortstämme    „Ziele", „Ziel", „Zielen" gelten als dasselbe
 *     · Verwandte     eine kleine Wortverwandtschaft für den Alltag
 *     · Dreiergruppen fängt Tippfehler und Wortformen ab
 *     · Frische       was zuletzt bearbeitet wurde, zählt etwas mehr
 *
 *   Wer echte Embeddings will und einen Schlüssel hat, schaltet sie in den
 *   KI-Einstellungen ein — dann werden die Vektoren einmal berechnet und
 *   im Browser abgelegt. Beides läuft nebeneinander.
 * ==========================================================================*/

const Kontext = (() => {

  /* ------------------------------------------------------------------------
   * WORTARBEIT
   * ----------------------------------------------------------------------*/
  const STOPP = new Set(('der die das ein eine einer eines einem einen und oder aber ' +
    'ist sind war waren sein hat habe haben hatte wird werden wurde in im am an auf ' +
    'aus bei mit von vor nach zu zur zum für über unter durch gegen ohne um es er sie ' +
    'ich du wir ihr mir mich dir dich uns euch sich als also auch noch nur schon wenn ' +
    'dass weil denn doch mal man nicht kein keine dem den des this that the and or of ' +
    'to in is are was were be has have with for from at on by').split(' '));

  /** Ein grober Stammschnitt fürs Deutsche. Nicht perfekt, aber verlässlich. */
  const stamm = (w: string): string => {
    let s = w;
    if (s.length > 6) s = s.replace(/(ungen|heiten|keiten|lich|isch|ische|ischen)$/, '');
    if (s.length > 5) s = s.replace(/(ung|heit|keit|nis|tum)$/, '');
    if (s.length > 4) s = s.replace(/(en|er|es|em|ern|st)$/, '');
    if (s.length > 3) s = s.replace(/(e|n|s|t)$/, '');
    return s;
  };

  /* Ein paar Verwandtschaften, die im Alltag ständig gebraucht werden.
     Das ersetzt keine Embeddings, hilft aber genau dort, wo es zählt. */
  const VERWANDT: Record<string, string[]> = {
    ziel: ['vorhaben','plan','vorsatz','okr','absicht','wunsch'],
    aufgab: ['todo','task','erledig','punkt','arbeit','job'],
    termin: ['datum','kalender','treffen','meeting','besprech'],
    training: ['sport','fitness','gym','ubung','workout','laufen'],
    ernahrung: ['essen','kalorien','mahlzeit','kcal','protein'],
    projekt: ['vorhaben','arbeit','auftrag','sache'],
    notiz: ['aufzeichn','memo','gedank','eintrag'],
    geld: ['finanz','kosten','budget','rechnung','preis','euro'],
    lernen: ['studi','uben','kurs','wissen','karteikart'],
    entscheid: ['beschluss','festgeleg','abgemacht'],
    problem: ['fehler','schwierig','block','hindernis'],
    kunde: ['klient','auftraggeb','mandant'],
    mail: ['email','nachricht','post','schreib']
  };

  const zerlegen = (text: unknown): string[] => String(text || '')
    .toLowerCase()
    .replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ß/g, 'ss')
    .split(/[^a-z0-9]+/)
    .filter(w => w.length > 2 && !STOPP.has(w))
    .map(stamm)
    .filter(Boolean);

  /** Die Frage um verwandte Wörter erweitern — das ist der semantische Teil. */
  const erweitern = (woerter: string[]): string[] => {
    const raus = new Set(woerter);
    woerter.forEach((w: any) => {
      Object.keys(VERWANDT).forEach(k => {
        const verwandte = VERWANDT[k] ?? [];
        if (w.startsWith(k) || k.startsWith(w)) {
          raus.add(k);
          verwandte.forEach((v: any) => raus.add(stamm(v)));
        }
        if (verwandte.some((v: any) => stamm(v) === w)) raus.add(k);
      });
    });
    return [...raus];
  };

  const dreier = (w: string): string[] => {
    const s = ' ' + w + ' ';
    const raus = [];
    for (let i = 0; i < s.length - 2; i++) raus.push(s.slice(i, i + 3));
    return raus;
  };

  /* ------------------------------------------------------------------------
   * DER INDEX — PERSISTENT, INKREMENTELL, REPARIERBAR
   * ------------------------------------------------------------------------
   * Jede Seite und jede Datenbankzeile wird ein Eintrag. Die Einträge liegen
   * im IndexedDB-Fach `suchindex`; Blöcke und Sammlungen bleiben jedoch immer
   * die Wahrheit. Ein fehlender, alter oder unlesbarer Eintrag wird aus ihnen
   * neu gebaut. Kein Reparaturweg schreibt jemals Nutzerdaten.
   * ----------------------------------------------------------------------*/
  /* 2 seit E724: Zeilen gespiegelter Datenbanken tragen `verbunden`. Ein
     Index der Fassung 1 kennt das Feld nicht und wird beim ersten Abgleich
     aus den Nutzerdaten neu gebaut — die Daten selbst bleiben, wie sie sind. */
  const INDEX_FASSUNG = 2;
  const KOPF_ID = '@suchindex';
  let index: any = null;
  let letzterDatenStand = -1;
  let letzterBericht: any = null;
  let schreibkette: Promise<any> = Promise.resolve();
  let letzterSchreibfehler = '';

  /** Zwei kleine, unabhängige 32-Bit-Prüfsummen. Kein Sicherheits-Hash —
      nur eine billige Antwort auf „hat sich diese Quelle verändert?". */
  const signatur = (teile: unknown[]): string => {
    let a = 2166136261, b = 0x9e3779b9;
    for (const teil of teile) {
      const s = String(teil ?? '') + '\u0000';
      for (let i = 0; i < s.length; i++) {
        const c = s.charCodeAt(i);
        a = Math.imul(a ^ c, 16777619) >>> 0;
        b = (Math.imul(b ^ (c + i), 2246822519) + 3266489917) >>> 0;
      }
    }
    return a.toString(36) + '-' + b.toString(36);
  };

  const spaeter = (a: string, b: string): string => String(a || '') > String(b || '') ? a : b;

  /** Inhalt plus Quellenstand. Der Stand enthält auch Text und Reihenfolge;
      dadurch heilt der Index sogar Sicherungen, deren `edited`-Zeitstempel
      fälschlich gleich geblieben ist. */
  const inhaltVonSeite = (seiteId: string): any => {
    const text: string[] = [], teile: unknown[] = [];
    let geaendert = '';
    const hinab = (id: string, tiefe: number): void => {
      if (tiefe > 3) return;
      Store.childrenOf(id).forEach((k: any) => {
        if (!k.alive || k.type === 'page') return; /* Unterseite = eigener Eintrag */
        geaendert = spaeter(geaendert, k.edited || k.created || '');
        /* `suchtext` gehört mit in die Signatur, sonst merkt der Index nicht,
           dass eine PDF-Seite ihren Text bekommen hat (E124). */
        /* DIESELBE LISTE WIE `Store.search`, nicht eine zweite daneben. Was ein
           Block an durchsuchbarem Text hat, entscheidet `Store.durchsuchbar` —
           inzwischen auch der Dateiname aus dem Fach `dateien` und die
           Quellenangabe an einer Lernkarte. Stünde die Liste hier ein zweites
           Mal, hätten die beiden Suchen wieder zwei Antworten; genau das ist
           bei den PDF-Texten schon einmal passiert (E124). */
        const felderText = typeof Store.durchsuchbar === 'function'
          ? Store.durchsuchbar(k).filter(Boolean)
          : [k.text, k.suchtext, k.ocrText].filter(Boolean).map(String);
        teile.push(k.id, k.type, k.edited, k.alive, felderText.join('\u0001'),
          Array.isArray(k.rows) ? JSON.stringify(k.rows) : '',
          Array.isArray(k.content) ? k.content.join(',') : '');
        if (k.type === 'database') {
          const c = Store.getCollection(k.collectionId);
          if (c) {
            text.push(c.name || '');
            teile.push(c.id, c.name, c.edited, JSON.stringify(c.schema || {}));
          }
          return;
        }
        /* EINE PDF-SEITE HAT KEINEN `text` — sie ist ein Bild. Ihr Wortlaut
           steht seit E107 in `suchtext`, und `Store.search` liest ihn auch.
           Der Index hier tat es nicht: die Suche im Fenster fand ein
           eingelesenes Skript nicht mehr, während `Store.search` es fand.
           Zwei Suchen mit zwei Antworten sind schlimmer als eine schlechte.
           Deshalb kommt die Liste jetzt von dort. */
        felderText.forEach((wert: string) => text.push(wert));
        if (Array.isArray(k.rows)) text.push(k.rows.flat().join(' '));
        if ((k.content || []).length) hinab(k.id, tiefe + 1);
      });
    };
    hinab(seiteId, 0);
    return { text: text.join(' '), stand: signatur(teile), geaendert };
  };

  const textVonSeite = (seiteId: string): string => inhaltVonSeite(seiteId).text;

  const wortdaten = (text: string): any => {
    const woerter = zerlegen(text);
    const zaehler: Record<string, number> = {};
    woerter.forEach(w => { zaehler[w] = (zaehler[w] || 0) + 1; });
    return { zaehler, laenge: woerter.length };
  };

  /** Ein Durchgang über `blocks`, keine Vollsuche je Sammlung. */
  const indexQuellen = (): any[] => {
    const raus: any[] = [];
    Object.values<any>(Store.cache.blocks).forEach(b => {
      if (!b.alive || b.type !== 'page') return;
      const innen = inhaltVonSeite(b.id);
      if (b.parentTable === 'collection') {
        const c = Store.getCollection(b.parentId);
        if (!c) return;
        raus.push({ art: 'zeile', b, c, innen,
          stand: signatur([b.id, b.text, b.edited, JSON.stringify(b.props || {}),
            c.id, c.name, c.edited, JSON.stringify(c.schema || {}), innen.stand,
            String(c.spiegelQuelle || '')]) });
        return;
      }
      const pfad = Store.pfadText(b.id);
      raus.push({ art: 'seite', b, innen, pfad,
        stand: signatur([b.id, b.text, JSON.stringify(Array.isArray(b.aliases) ? b.aliases : []),
          b.edited, b.alive, pfad, innen.stand]) });
    });
    return raus;
  };

  const eintragVon = (q: any): any => {
    const b = q.b;
    if (q.art === 'seite') {
      const aliases = Array.isArray(b.aliases)
        ? b.aliases.map((value: unknown) => String(value ?? '').trim()).filter(Boolean).join(' ') : '';
      const roh = (b.text || '') + ' ' + aliases + ' ' + q.innen.text;
      return {
        id: b.id, seiteId: b.id, art: 'seite', stand: q.stand,
        titel: b.text || 'Ohne Titel', pfad: q.pfad,
        text: roh.slice(0, 6000),
        geaendert: spaeter(b.edited || b.created || '', q.innen.geaendert),
        ...wortdaten((b.text || '') + ' ' + (b.text || '') + ' ' + aliases + ' ' + roh)
      };
    }
    const c = q.c;
    const felder = Object.keys(c.schema || {})
      .filter(k => !['formula','rollup','uid','button'].includes(c.schema[k].type))
      .map(k => c.schema[k].name + ': ' + Formula.anzeige(Datenbank.wert(b, k, c)))
      .join(' · ');
    const roh = (b.text || '') + ' ' + felder + ' ' + q.innen.text;
    return {
      id: b.id, seiteId: b.id, art: 'zeile', datenbank: c.name, stand: q.stand,
      /* „Verbundenes" (E724): Zeilen, die ein Dienst hereinspiegelt (Mails,
         Termine, GitHub …), erkennt man an `spiegelQuelle` der Sammlung
         (`datenbanken/spiegel/dienst.ts`). Vorher las niemand den Schalter. */
      verbunden: !!c.spiegelQuelle,
      titel: b.text || 'Ohne Titel', pfad: c.name,
      text: roh.slice(0, 4000),
      geaendert: spaeter(b.edited || b.created || '', q.innen.geaendert),
      ...wortdaten((b.text || '') + ' ' + c.name + ' ' + roh)
    };
  };

  const gueltig = (e: any): boolean => !!e && typeof e.id === 'string' &&
    typeof e.stand === 'string' && (e.art === 'seite' || e.art === 'zeile') &&
    e.zaehler && typeof e.zaehler === 'object' && Number.isFinite(e.laenge);

  const indexAus = (eintraege: any[], bericht: any): any => {
    const df = new Map<string, number>();
    const posting = new Map<string, number[]>();
    let gesamt = 0;
    eintraege.forEach((e, nr) => {
      gesamt += e.laenge || 0;
      Object.keys(e.zaehler || {}).forEach(w => {
        df.set(w, (df.get(w) || 0) + 1);
        if (!posting.has(w)) posting.set(w, []);
        posting.get(w)!.push(nr);
      });
    });
    return { eintraege, df, posting,
      laengeSchnitt: gesamt / Math.max(1, eintraege.length),
      anzahl: eintraege.length, bericht };
  };

  const kopf = (anzahl: number): any => ({
    id: KOPF_ID, art: 'kopf', fassung: INDEX_FASSUNG,
    anzahl, gebaut: new Date().toISOString()
  });

  const schreibe = (tun: () => Promise<any>): void => {
    /* Immer in Reihenfolge: ein langsamer Vollaufbau darf nicht nachträglich
       einen jüngeren inkrementellen Stand überschreiben. */
    schreibkette = schreibkette.catch(() => undefined).then(tun).then(() => {
      letzterSchreibfehler = '';
    }, (err: unknown) => {
      letzterSchreibfehler = err instanceof Error ? err.message : String(err);
      if (typeof Reporter !== 'undefined')
        Reporter.warn('Suche', 'Der Suchindex bleibt für diese Sitzung im Arbeitsspeicher', err);
    });
  };

  const abgleichen = (allesNeu = false): any => {
    const begonnen = performance.now();
    const gespeichert = Store.cache.suchindex || {};
    const alterKopf = gespeichert[KOPF_ID];
    const fassungStimmt = !!alterKopf && alterKopf.fassung === INDEX_FASSUNG;
    const alt: Record<string, any> = {};
    if (!allesNeu && fassungStimmt) Object.values<any>(gespeichert).forEach(e => {
      if (e && e.id !== KOPF_ID) alt[e.id] = e;
    });

    const eintraege: any[] = [], setzen: any[] = [], gesehen = new Set<string>();
    let neu = 0, geaendert = 0, wiederverwendet = 0, repariert = 0;
    indexQuellen().forEach(q => {
      gesehen.add(q.b.id);
      const vorher = alt[q.b.id];
      if (gueltig(vorher) && vorher.stand === q.stand) {
        eintraege.push(vorher); wiederverwendet++; return;
      }
      const e = eintragVon(q);
      eintraege.push(e); setzen.push(e);
      if (!vorher) neu++;
      else if (!gueltig(vorher)) repariert++;
      else geaendert++;
    });

    const loeschen = Object.keys(alt).filter(id => !gesehen.has(id));
    eintraege.sort((a, b) => a.id.localeCompare(b.id));
    const bericht = {
      fassung: INDEX_FASSUNG, anzahl: eintraege.length, neu, geaendert,
      geloescht: loeschen.length, wiederverwendet, repariert,
      quelle: fassungStimmt && !allesNeu ? 'persistiert' : 'neu',
      ms: Math.round((performance.now() - begonnen) * 10) / 10
    };
    letzterBericht = bericht;
    index = indexAus(eintraege, bericht);
    letzterDatenStand = Store.datenFassung ? Store.datenFassung() : 0;

    const k = kopf(eintraege.length);
    if (allesNeu || !fassungStimmt) schreibe(() => Store.suchindexErsetzen([k, ...eintraege]));
    else if (setzen.length || loeschen.length || alterKopf.anzahl !== eintraege.length)
      schreibe(() => Store.suchindexAendern([k, ...setzen], loeschen));
    return index;
  };

  /** Der ausdrückliche Neuaufbau aus den Nutzerdaten. */
  const bauen = (): any => abgleichen(true);

  const holen = (frisch = false): any => {
    const stand = Store.datenFassung ? Store.datenFassung() : 0;
    if (frisch) return bauen();
    if (!index || stand !== letzterDatenStand) return abgleichen(false);
    return index;
  };

  const reparieren = (): any => {
    index = null;
    return abgleichen(true);
  };

  const warten = async (): Promise<any> => { await schreibkette; return status(); };
  const status = (): any => ({
    fassung: INDEX_FASSUNG,
    persistierteFassung: Store.cache.suchindex?.[KOPF_ID]?.fassung || 0,
    persistiert: Math.max(0, Object.keys(Store.cache.suchindex || {}).length - 1),
    bericht: letzterBericht,
    schreibfehler: letzterSchreibfehler
  });

  /** Kandidaten für Quick Find. `null` bedeutet: nicht sicher eingrenzbar,
      also den echten Bestand vollständig prüfen. Eine leere Liste bedeutet:
      die Wortmengen sind sicher disjunkt. So verliert der Cache nie Treffer. */
  const kandidaten = (frage: string): string[] | null => {
    const ix = holen();
    const ws = [...new Set(zerlegen(frage))];
    if (!ws.length) return null;
    let menge: Set<number> | null = null;
    for (const w of ws) {
      const liste = ix.posting.get(w);
      if (!liste) return null;
      const seiten = new Set<number>(liste.filter((nr: number) => ix.eintraege[nr]?.art === 'seite'));
      if (menge === null) menge = seiten;
      else {
        const vorher: number[] = Array.from(menge as Set<number>);
        menge = new Set<number>(vorher.filter((nr: number) => seiten.has(nr)));
      }
      if (!menge.size) return [];
    }
    return [...(menge || [])].map(nr => ix.eintraege[nr].seiteId);
  };

  /* ------------------------------------------------------------------------
   * SUCHE
   * ----------------------------------------------------------------------*/
  const bm25 = (eintrag: any, frageWoerter: string[], ix: any): number => {
    const k1 = 1.5, b = 0.75;
    let punkte = 0;
    frageWoerter.forEach((w: any) => {
      const tf = eintrag.zaehler?.[w] || 0;
      if (!tf) return;
      const n = ix.df.get(w) || 0;
      const idf = Math.log(1 + (ix.anzahl - n + 0.5) / (n + 0.5));
      punkte += idf * (tf * (k1 + 1)) /
                (tf + k1 * (1 - b + b * eintrag.laenge / Math.max(1, ix.laengeSchnitt)));
    });
    return punkte;
  };

  /** Dreiergruppen fangen ab, was der Stammschnitt verfehlt. */
  const unschaerfe = (eintrag: any, frageWoerter: string[]): number => {
    if (!frageWoerter.length) return 0;
    const ziel = new Set();
    Object.keys(eintrag.zaehler || {}).slice(0, 400)
      .forEach((w: any) => dreier(w).forEach(d => ziel.add(d)));
    let treffer = 0, gesamt = 0;
    frageWoerter.forEach((w: any) => {
      const d = dreier(w);
      gesamt += d.length;
      d.forEach(x => { if (ziel.has(x)) treffer++; });
    });
    return gesamt ? treffer / gesamt : 0;
  };

  /**
   * Findet die Stellen, die zur Frage passen.
   * @param frage   die Frage im Klartext
   * @param opt     { anzahl, quellen, nurSeite }
   */
  const finden = (frage: string, opt: any = {}): any[] => {
    const ix = holen(opt.frisch);
    const roh = zerlegen(frage);
    const woerter = erweitern(roh);
    if (!woerter.length) return [];

    const jetzt = Date.now();
    const q = quellen();

    /* Die invertierte Wortliste macht den Normalfall abhängig von der Zahl
       der Treffer, nicht von der Zahl aller Seiten. Nur wenn kein Wort exakt
       vorkommt, läuft die absichtlich teurere Tippfehler-Gegenprobe. */
    const nummern = new Set<number>();
    woerter.forEach(w => (ix.posting.get(w) || []).forEach((nr: number) => nummern.add(nr)));
    const pool = nummern.size
      ? [...nummern].map(nr => ix.eintraege[nr]).filter(Boolean)
      : ix.eintraege;

    const bewertet = pool.map((e: any) => {
      /* --- Berechtigungsschicht: was nicht gelesen werden darf, fliegt raus */
      if (!Konten.darf('lesen', e.seiteId)) return null;
      if (opt.nurSeite && e.seiteId !== opt.nurSeite && !istUnter(e.seiteId, opt.nurSeite)) return null;
      if (e.art === 'zeile' && !q.datenbanken) return null;
      if (e.verbunden && !q.verbindungen) return null;
      if (e.art === 'seite' && !q.arbeitsbereich) return null;

      const basis = bm25(e, woerter, ix);
      const fuzzy = basis > 0 ? 0 : unschaerfe(e, roh);
      if (basis <= 0 && fuzzy < 0.34) return null;

      const titelWoerter = zerlegen(e.titel);
      const imTitel = roh.filter(w => titelWoerter.includes(w)).length;
      const alter = (jetzt - new Date(e.geaendert || 0).getTime()) / 86400000;
      const frische = alter < 400 ? (1 - alter / 400) * 0.9 : 0;

      const punkte = basis
        + imTitel * 2.2                          /* Titeltreffer wiegen schwer */
        + fuzzy * 1.6
        + frische
        + (e.seiteId === App.aktuelleSeite() ? 1.4 : 0);

      return { ...e, punkte };
    }).filter(Boolean);

    bewertet.sort((a: any, b: any) => b.punkte - a.punkte);
    return bewertet.slice(0, opt.anzahl || 8);
  };

  const istUnter = (id: string, elternId: string): boolean => {
    let cur = Store.getBlock(id), n = 0;
    while (cur && n++ < 30) {
      if (cur.id === elternId) return true;
      cur = cur.parentId ? Store.getBlock(cur.parentId) : null;
    }
    return false;
  };

  /* ------------------------------------------------------------------------
   * AUSSCHNITTE
   * ------------------------------------------------------------------------
   * Nicht die ganze Seite ans Modell geben, sondern die Stelle, um die es
   * geht. Spart Platz und macht die Antwort genauer.
   * ----------------------------------------------------------------------*/
  const ausschnitt = (eintrag: any, frage: string, laenge = 700): string => {
    const woerter = zerlegen(frage);
    const saetze = String(eintrag.text || '').split(/(?<=[.!?])\s+|\n+/).filter(s => s.trim());
    if (!saetze.length) return String(eintrag.text || '').slice(0, laenge);

    const bewertet = saetze.map((s, i) => {
      const w = zerlegen(s);
      const treffer = woerter.filter(x => w.includes(x)).length;
      return { s, i, treffer };
    });
    bewertet.sort((a, b) => b.treffer - a.treffer || a.i - b.i);

    const genommen: any[] = [];
    let laengeJetzt = 0;
    bewertet.forEach(x => {
      if (laengeJetzt > laenge) return;
      genommen.push(x);
      laengeJetzt += x.s.length;
    });
    genommen.sort((a, b) => a.i - b.i);
    const text = genommen.map(x => x.s.trim()).join(' … ');
    return text.slice(0, laenge + 200);
  };

  /* ------------------------------------------------------------------------
   * QUELLEN — einzeln ein- und ausschaltbar
   * ----------------------------------------------------------------------*/
  const QUELLEN_STANDARD = {
    aktuelleSeite: true,
    arbeitsbereich: true,
    datenbanken: true,
    verbindungen: true,
    web: false
  };

  const quellen = () => Object.assign({}, QUELLEN_STANDARD,
    Store.getMeta('ki:quellen', {}) || {});

  /* ------------------------------------------------------------------------
   * NUR AUS DEINEN QUELLEN (E305, Redurs Punkt 11)
   * ------------------------------------------------------------------------
   * Der gewöhnliche Modus gibt dem Modell die gefundenen Stellen MIT und
   * bittet es, nichts zu erfinden. Das ist eine Bitte. Wer vor einer Prüfung
   * sitzt, will keine Bitte, sondern eine Zusage: entweder es steht in meinen
   * Unterlagen, oder ich bekomme keine Antwort.
   *
   * Der Unterschied ist nicht die Formulierung der Anweisung — es ist, dass
   * bei leerem Fund GAR NICHT GEFRAGT wird. Ein Modell, das nichts vorliegen
   * hat, antwortet trotzdem; das ist seine Natur, und keine Anweisung ändert
   * daran zuverlässig etwas. Also fragt Redion es dann nicht.
   * ----------------------------------------------------------------------*/
  const nurQuellen = (): boolean => !!Store.getMeta('ki:nurQuellen', false);

  const nurQuellenSetzen = (an: unknown): void =>
    Store.setMeta('ki:nurQuellen', !!an);

  /**
   * Darf diese Frage überhaupt ans Modell?
   *
   * Gibt zurück, was zu tun ist — und im Fall `nein` gleich den Satz, der
   * stattdessen dasteht. Der Satz gehört hierher und nicht in die Oberfläche:
   * die Agenten (`ki/agenten.ts`) brauchen dieselbe Entscheidung, und zwei
   * Fassungen davon liefen irgendwann auseinander.
   */
  const darfFragen = (k: { leer?: boolean; quellen?: any[] }): {
    ok: boolean; grund: string;
  } => {
    if (!nurQuellen()) return { ok: true, grund: '' };
    if (k && k.leer === false && (k.quellen || []).length > 0)
      return { ok: true, grund: '' };
    return { ok: false, grund:
      'Dazu finde ich nichts in deinen Unterlagen. Der Nur-Quellen-Modus ist ' +
      'an — Redion fragt das Modell dann gar nicht erst, statt eine Antwort ' +
      'zu bekommen, die nirgends nachzulesen ist. Schalte ihn in den ' +
      'KI-Einstellungen aus, wenn du trotzdem fragen willst.' };
  };

  /** Die Anweisung, die im Nur-Quellen-Modus vor die Auszüge kommt. */
  const nurQuellenAnweisung = (): string =>
    '\n\nWICHTIG — NUR-QUELLEN-MODUS: Antworte AUSSCHLIESSLICH aus den ' +
    'Auszügen oben. Steht die Antwort dort nicht, sage genau das und rate ' +
    'nicht. Nenne zu jeder Aussage, aus welcher der Quellen sie stammt. ' +
    'Ergänze nichts aus deinem eigenen Wissen, auch nichts Naheliegendes.';

  const quelleSetzen = (k: string, an: unknown): void => {
    const q = quellen();
    q[k] = an;
    Store.setMeta('ki:quellen', q);
    /* Ein Schreiber, viele Leser (E724): das KI-Fenster und die
       Einstellungen hören hier zu und setzen Klasse UND aria-pressed. */
    if (typeof Ereignisse !== 'undefined' && typeof ARTEN !== 'undefined')
      Ereignisse.melde(ARTEN.kiQuellenGeaendert, { quelle: k, an: !!an });
  };

  /**
   * Eine Quelle umschalten — der EINE Weg für das KI-Fenster und die
   * Einstellungen (E724). Beim Einschalten des Webs fragt er zuerst, und
   * zwar in einem Redion-Fenster (E710) statt mit `confirm()`, das vorher an
   * zwei Stellen in zwei Fassungen stand. Gibt den neuen Zustand zurück —
   * oder `null`, wenn der Mensch Nein gesagt hat.
   */
  const quelleUmschalten = async (k: string): Promise<boolean | null> => {
    const jetzt = !!quellen()[k];
    if (k === 'web' && !jetzt && Store.getMeta('ki:webFragen', true)) {
      const ja = await Dialog.bestaetigen({
        titel: 'Websuche einschalten?',
        text: 'Für die Websuche wird Wikipedia angefragt. Dabei verlässt dein ' +
              'Suchbegriff den Rechner.',
        ja: 'Einschalten' });
      if (!ja) return null;
    }
    quelleSetzen(k, !jetzt);
    return !jetzt;
  };

  /* ------------------------------------------------------------------------
   * DER FERTIGE KONTEXT FÜR DAS MODELL
   * ----------------------------------------------------------------------*/
  const bauenFuerFrage = async (frage: string, opt: any = {}): Promise<any> => {
    const q = quellen();
    const teile = [];
    const quellenListe = [];

    /* 1. Die Seite, auf der man gerade steht */
    if (q.aktuelleSeite && App.aktuelleSeite()) {
      const p = Store.getBlock(App.aktuelleSeite());
      if (p && Konten.darf('lesen', p.id)) {
        const t = (p.text || 'Ohne Titel') + '\n' + textVonSeite(p.id).slice(0, 2500);
        teile.push('## Die offene Seite\n' + t);
        quellenListe.push({ id: p.id, titel: p.text || 'Ohne Titel',
                            art: 'Offene Seite', geaendert: p.edited });
      }
    }

    /* 1b. Ausdrücklich erwähnte Seiten (E724, „@Seite" im KI-Fenster). Sie
       kommen unabhängig von den Schaltern hinein — wer eine Seite nennt,
       meint sie. Gelesen wird trotzdem nur, was gelesen werden darf. */
    for (const id of (Array.isArray(opt.extraSeiten) ? opt.extraSeiten : [])) {
      if (q.aktuelleSeite && id === App.aktuelleSeite()) continue;
      const p = Store.getBlock(id);
      if (!p || p.alive === false || !Konten.darf('lesen', p.id)) continue;
      teile.push('## Erwähnt: ' + (p.text || 'Ohne Titel') + '\n' + textVonSeite(p.id).slice(0, 2500));
      quellenListe.push({ id: p.id, titel: p.text || 'Ohne Titel', art: 'Erwähnt', geaendert: p.edited });
    }

    /* 2. Der Rest des Arbeitsbereichs — gesucht, nicht komplett */
    if (q.arbeitsbereich || q.datenbanken) {
      /* HIER HÄNGT DER VEKTORWEG (E333, L102 Punkt 3). `findenMitVektoren`
         fällt selbst auf `finden` zurück, wenn keine Vektoren da sind, das
         Kontingent nicht reicht oder der Aufruf scheitert — der gewöhnliche
         Weg bleibt also der gewöhnliche. */
      const treffer = await findenMitVektoren(frage, opt.anzahl || 6,
        { nurSeite: opt.nurSeite });
      treffer.forEach((t: any) => {
        if (t.seiteId === App.aktuelleSeite() && q.aktuelleSeite) return;
        teile.push('## ' + t.titel + (t.datenbank ? ' (aus ' + t.datenbank + ')' : '') +
                   '\n' + ausschnitt(t, frage));
        quellenListe.push({ id: t.seiteId, titel: t.titel,
                            art: t.art === 'zeile' ? ('Eintrag · ' + t.datenbank) : t.pfad || 'Seite',
                            geaendert: t.geaendert, punkte: Math.round(t.punkte * 10) / 10 });
      });
    }

    return {
      text: teile.join('\n\n'),
      quellen: quellenListe,
      leer: !teile.length
    };
  };

  /* ------------------------------------------------------------------------
   * ECHTE EMBEDDINGS — nur, wenn jemand sie will und einen Schlüssel hat
   * ----------------------------------------------------------------------*/
  const embeddingsAn = () => !!Store.getMeta('ki:embeddings', false);

  const embeddingHolen = async (texte: string[]): Promise<any> => {
    const anbieter = Store.getMeta('ki:embAnbieter', 'gemini');
    if (anbieter === 'gemini') {
      const key = Store.getMeta('api:gemini', '');
      if (!key) throw new Error('Für Embeddings fehlt der Gemini-Schlüssel.');
      const raus = [];
      for (const t of texte) {
        const d = await Verbindungen.jsonRuf(
          'https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent',
          { method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
            body: JSON.stringify({ content: { parts: [{ text: t.slice(0, 8000) }] } }) });
        raus.push(d.embedding?.values || []);
      }
      return raus;
    }
    const key = Store.getMeta('api:openai', '');
    if (!key) throw new Error('Für Embeddings fehlt der OpenAI-Schlüssel.');
    const d = await Verbindungen.jsonRuf('https://api.openai.com/v1/embeddings', {
      token: key, method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'text-embedding-3-small',
                             input: texte.map((t: any) => t.slice(0, 8000)) })
    });
    return (d.data || []).map((x: any) => x.embedding);
  };

  const cosinus = (a: number[], b: number[]): number => {
    let p = 0, na = 0, nb = 0;
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
      const x = a[i] ?? 0, y = b[i] ?? 0;
      p += x * y; na += x * x; nb += y * y;
    }
    return (na && nb) ? p / (Math.sqrt(na) * Math.sqrt(nb)) : 0;
  };

  /** Alle Seiten einmal durchrechnen. Dauert, kostet ein paar Cent, hält lange. */
  const embeddingsBauen = async (beiFortschritt?: (fertig: number, gesamt: number) => void): Promise<any> => {
    const ix = holen(true);
    const gemerkt = Store.getMeta('ki:vektoren', {}) || {};
    const offen = ix.eintraege.filter((e: any) => !gemerkt[e.id] ||
      gemerkt[e.id].stand !== String(e.geaendert));
    if (!offen.length) return { neu: 0, gesamt: Object.keys(gemerkt).length };

    /* --- EIN KLICK, ZWEITAUSEND AUFRUFE (E287) --------------------------
       Das hier war die konkreteste Kostengefahr in ganz Redion: jede Seite
       geht einzeln an eine kostenpflichtige API, ohne dass vorher eine
       Zahl fällt, ohne Obergrenze, ohne Abbruch.

       Geschätzt wird der GANZE Stapel, nicht der einzelne Aufruf. Die
       einzelne Anfrage ist harmlos; zweitausend davon sind es nicht, und
       genau diesen Unterschied sieht eine Prüfung je Aufruf nicht.

       Gefragt wird EINMAL, vorher. Eine Rückfrage je Seite wäre
       zweitausend Rückfragen — also keine. */
    const modellName = Store.getMeta('ki:embeddingModell', '') ||
      (Store.getMeta('ki:embedding', '') === 'gemini'
        ? 'text-embedding-004' : 'text-embedding-3-small');
    if (typeof KiBuch !== 'undefined') {
      const texte = offen.map((e: any) => e.titel + '\n' + e.text.slice(0, 3000));
      const s = KiBuch.stapelSchaetzen(modellName, texte);
      if (s.bekannt && !s.frei && s.betrag > 0 && typeof Dialog !== 'undefined') {
        /* `Dialog.wahl` und nicht `confirm`: beide Antworten sind
           vertretbar, und jede bekommt einen Hinweis darunter, damit
           niemand raten muss, was „Abbrechen" hier bedeutet. */
        const antwort = await Dialog.wahl({
          titel: 'Vektoren für ' + offen.length + ' Seite(n) bauen?',
          text: 'Jede Seite geht einzeln an ' + modellName + '.\n\n' + s.satz +
                '\n\nDie Preisliste ist vom ' + KiKosten.STAND + '.',
          knoepfe: [
            { id: 'nein', text: 'Abbrechen',
              hinweis: 'Es wird nichts gesendet und nichts berechnet.' },
            { id: 'ja', text: 'Bauen',
              hinweis: 'Die semantische Suche wird danach besser.' }
          ]
        });
        if (antwort !== 'ja') {
          return { neu: 0, gesamt: Object.keys(gemerkt).length, abgebrochen: true };
        }
      }
      /* Und die Grenzen gelten auch hier — nicht nur die Rückfrage. */
      const urteil = KiKosten.pruefen(s, KiBuch.grenzen(), KiBuch.stand());
      if (!urteil.erlaubt) throw new Error(urteil.satz);
      if (s.bekannt && !s.frei) {
        KiBuch.buchen(modellName, 'embedding', s.tokenEin, 0, false);
      }
    }

    let n = 0;
    for (let i = 0; i < offen.length; i += 8) {
      const gruppe = offen.slice(i, i + 8);
      const v = await embeddingHolen(gruppe.map((e: any) => e.titel + '\n' + e.text.slice(0, 3000)));
      gruppe.forEach((e: any, k: any) => {
        if (v[k] && v[k].length) gemerkt[e.id] = { v: v[k], stand: String(e.geaendert) };
      });
      n += gruppe.length;
      if (beiFortschritt) beiFortschritt(n, offen.length);
      Store.setMeta('ki:vektoren', gemerkt);
    }
    return { neu: n, gesamt: Object.keys(gemerkt).length };
  };

  /**
   * DIE SEMANTISCHE SUCHE — UND WARUM SIE BIS E333 NIEMAND RIEF.
   *
   * L102 Punkt 3: „Der ganze Vektorweg ist toter Code. `findenMitVektoren`
   * ist definiert und exportiert, und im gesamten Verzeichnis ruft es
   * niemand auf. Die semantische Suche existiert also als Code und nicht
   * als Weg (§47)."
   *
   * DIE NAHELIEGENDE VERDRAHTUNG WÄRE FALSCH GEWESEN. Diese Funktion
   * schickt für JEDE Frage eine Einbettung an eine kostenpflichtige API.
   * Sie einfach an den Chat zu hängen hiesse: jede Chatnachricht kostet
   * still Geld — genau der Zustand, den E287 abgeräumt hat, nur an einer
   * anderen Stelle.
   *
   * DER SCHALTER IST DESHALB DAS VORHANDENSEIN DER VEKTOREN. Wer sie
   * gebaut hat, hat dafür einmal ausdrücklich Ja gesagt (E287 fragt mit
   * Betrag). Wer nicht, merkt von alledem nichts und zahlt nichts: dann
   * fällt die Suche auf `finden` zurück, wie sie es schon immer tat.
   *
   * UND DIE EINE ANFRAGE GEHT DURCH DIE KASSE wie jede andere. Reicht das
   * Kontingent nicht, wird nicht heimlich gespart und nicht heimlich
   * ausgegeben — es wird gesucht wie vorher.
   */
  const findenMitVektoren = async (frage: string, anzahl = 8,
                                   opt: { nurSeite?: string } = {}): Promise<any[]> => {
    const wieBisher = () => finden(frage, { anzahl, nurSeite: opt.nurSeite });
    const gemerkt = Store.getMeta('ki:vektoren', {}) || {};
    if (!Object.keys(gemerkt).length) return wieBisher();

    /* Die Frage selbst kostet eine Einbettung. Erst fragen, dann buchen,
       und bei Nein den gewöhnlichen Weg gehen — eine Suche, die wegen
       eines Kontingents GAR NICHT sucht, wäre die schlechtere Antwort. */
    const modellName = Store.getMeta('ki:embeddingModell', '') ||
      (Store.getMeta('ki:embAnbieter', 'gemini') === 'gemini'
        ? 'text-embedding-004' : 'text-embedding-3-small');
    if (typeof KiBuch !== 'undefined') {
      const s = KiBuch.stapelSchaetzen(modellName, [frage]);
      const urteil = KiKosten.pruefen(s, KiBuch.grenzen(), KiBuch.stand());
      if (!urteil.erlaubt) return wieBisher();
      if (s.bekannt && !s.frei) KiBuch.buchen(modellName, 'embedding', s.tokenEin, 0, false);
    }

    let fv: number[] | undefined;
    try { [fv] = await embeddingHolen([frage]); }
    catch { return wieBisher(); }
    if (!fv || !fv.length) return wieBisher();
    const ix = holen();
    const q = quellen();
    const raus = ix.eintraege.map((e: any) => {
      const g = gemerkt[e.id];
      if (!g) return null;
      if (!Konten.darf('lesen', e.seiteId)) return null;
      /* UND `nurSeite` GILT AUCH HIER (E333). `finden` achtet es seit
         jeher (Zeile 433); der Vektorweg tat es nicht, weil ihn niemand
         rief. Beim Verdrahten wäre daraus ein Leck geworden: `bauenFuerFrage`
         reicht `nurSeite` durch, wenn der Aufrufer eine Seite meint, und
         ohne diese Zeile hätte das Modell den ganzen Bestand gesehen. */
      if (opt.nurSeite && e.seiteId !== opt.nurSeite && !istUnter(e.seiteId, opt.nurSeite))
        return null;
      /* Und „Verbundenes" gilt hier wie in `finden` (E724) — sonst wäre der
         Vektorweg das Leck, das E333 für `nurSeite` schon einmal schloss. */
      if (e.verbunden && !q.verbindungen) return null;
      return { ...e, punkte: cosinus(fv, g.v) * 10 };
    }).filter(Boolean);
    raus.sort((a: any, b: any) => b.punkte - a.punkte);
    return raus.slice(0, anzahl);
  };

  return { bauen, abgleichen, reparieren, holen, warten, status, kandidaten,
           finden, findenMitVektoren, ausschnitt, bauenFuerFrage,
           quellen, quelleSetzen, quelleUmschalten, QUELLEN_STANDARD, zerlegen, stamm, erweitern,
           nurQuellen, nurQuellenSetzen, darfFragen, nurQuellenAnweisung,
           embeddingsAn, embeddingsBauen, embeddingHolen, cosinus, textVonSeite };
})();

(window as any).Kontext = Kontext;
