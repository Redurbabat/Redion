/* ============================================================================
 * ki-kontext.js — Kontext, Berechtigung und Suche für die KI
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
  const stamm = (w) => {
    let s = w;
    if (s.length > 6) s = s.replace(/(ungen|heiten|keiten|lich|isch|ische|ischen)$/, '');
    if (s.length > 5) s = s.replace(/(ung|heit|keit|nis|tum)$/, '');
    if (s.length > 4) s = s.replace(/(en|er|es|em|ern|st)$/, '');
    if (s.length > 3) s = s.replace(/(e|n|s|t)$/, '');
    return s;
  };

  /* Ein paar Verwandtschaften, die im Alltag ständig gebraucht werden.
     Das ersetzt keine Embeddings, hilft aber genau dort, wo es zählt. */
  const VERWANDT = {
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

  const zerlegen = (text) => String(text || '')
    .toLowerCase()
    .replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ß/g, 'ss')
    .split(/[^a-z0-9]+/)
    .filter(w => w.length > 2 && !STOPP.has(w))
    .map(stamm)
    .filter(Boolean);

  /** Die Frage um verwandte Wörter erweitern — das ist der semantische Teil. */
  const erweitern = (woerter) => {
    const raus = new Set(woerter);
    woerter.forEach(w => {
      Object.keys(VERWANDT).forEach(k => {
        if (w.startsWith(k) || k.startsWith(w)) {
          raus.add(k);
          VERWANDT[k].forEach(v => raus.add(stamm(v)));
        }
        if (VERWANDT[k].some(v => stamm(v) === w)) raus.add(k);
      });
    });
    return [...raus];
  };

  const dreier = (w) => {
    const s = ' ' + w + ' ';
    const raus = [];
    for (let i = 0; i < s.length - 2; i++) raus.push(s.slice(i, i + 3));
    return raus;
  };

  /* ------------------------------------------------------------------------
   * DER INDEX
   * ------------------------------------------------------------------------
   * Jede Seite und jede Datenbankzeile wird ein Eintrag. Der Index lebt im
   * Arbeitsspeicher und wird bei Bedarf neu gebaut — bei ein paar tausend
   * Seiten dauert das Millisekunden.
   * ----------------------------------------------------------------------*/
  let index = null;
  let indexZeit = 0;

  const textVonSeite = (seiteId, tiefe = 0) => {
    if (tiefe > 3) return '';
    let t = '';
    Store.childrenOf(seiteId).forEach(k => {
      if (!k.alive) return;
      if (k.type === 'page') return;              /* Unterseiten sind eigene Einträge */
      if (k.type === 'database') {
        const c = Store.getCollection(k.collectionId);
        if (c) t += ' ' + c.name;
        return;
      }
      if (k.text) t += ' ' + k.text;
      if (Array.isArray(k.rows)) t += ' ' + k.rows.flat().join(' ');
      if ((k.content || []).length) t += ' ' + textVonSeite(k.id, tiefe + 1);
    });
    return t;
  };

  const bauen = () => {
    const eintraege = [];

    /* Seiten */
    Object.values(Store.cache.blocks).forEach(b => {
      if (!b.alive || b.type !== 'page') return;
      if (b.parentTable === 'collection') return;   /* Zeilen kommen gleich */
      const roh = (b.text || '') + ' ' + textVonSeite(b.id);
      eintraege.push({
        id: b.id, seiteId: b.id, art: 'seite',
        titel: b.text || 'Ohne Titel',
        pfad: Store.pfadText(b.id),
        text: roh.slice(0, 6000),
        geaendert: b.edited || b.created,
        woerter: zerlegen((b.text || '') + ' ' + (b.text || '') + ' ' + roh)  /* Titel zählt doppelt */
      });
    });

    /* Datenbankzeilen — auch Mails, Termine, Issues landen so im Index */
    Object.values(Store.cache.collections).forEach(c => {
      Store.rowsOf(c.id).forEach(r => {
        const felder = Object.keys(c.schema)
          .filter(k => !['formula','rollup','uid','button'].includes(c.schema[k].type))
          .map(k => c.schema[k].name + ': ' + Formula.anzeige(Datenbank.wert(r, k, c)))
          .join(' · ');
        const roh = (r.text || '') + ' ' + felder + ' ' + textVonSeite(r.id);
        eintraege.push({
          id: r.id, seiteId: r.id, art: 'zeile', datenbank: c.name,
          titel: r.text || 'Ohne Titel',
          pfad: c.name,
          text: roh.slice(0, 4000),
          geaendert: r.edited || r.created,
          woerter: zerlegen((r.text || '') + ' ' + c.name + ' ' + roh)
        });
      });
    });

    /* Dokumentfrequenzen für BM25 */
    const df = new Map();
    eintraege.forEach(e => {
      new Set(e.woerter).forEach(w => df.set(w, (df.get(w) || 0) + 1));
    });
    const laengeSchnitt = eintraege.reduce((s, e) => s + e.woerter.length, 0) /
                          Math.max(1, eintraege.length);

    index = { eintraege, df, laengeSchnitt, anzahl: eintraege.length };
    indexZeit = Date.now();
    return index;
  };

  const holen = (frisch = false) => {
    if (frisch || !index || Date.now() - indexZeit > 20000) bauen();
    return index;
  };

  /* ------------------------------------------------------------------------
   * SUCHE
   * ----------------------------------------------------------------------*/
  const bm25 = (eintrag, frageWoerter, ix) => {
    const k1 = 1.5, b = 0.75;
    const zaehler = new Map();
    eintrag.woerter.forEach(w => zaehler.set(w, (zaehler.get(w) || 0) + 1));
    let punkte = 0;
    frageWoerter.forEach(w => {
      const tf = zaehler.get(w) || 0;
      if (!tf) return;
      const n = ix.df.get(w) || 0;
      const idf = Math.log(1 + (ix.anzahl - n + 0.5) / (n + 0.5));
      punkte += idf * (tf * (k1 + 1)) /
                (tf + k1 * (1 - b + b * eintrag.woerter.length / Math.max(1, ix.laengeSchnitt)));
    });
    return punkte;
  };

  /** Dreiergruppen fangen ab, was der Stammschnitt verfehlt. */
  const unschaerfe = (eintrag, frageWoerter) => {
    if (!frageWoerter.length) return 0;
    const ziel = new Set();
    eintrag.woerter.slice(0, 400).forEach(w => dreier(w).forEach(d => ziel.add(d)));
    let treffer = 0, gesamt = 0;
    frageWoerter.forEach(w => {
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
  const finden = (frage, opt = {}) => {
    const ix = holen(opt.frisch);
    const roh = zerlegen(frage);
    const woerter = erweitern(roh);
    if (!woerter.length) return [];

    const jetzt = Date.now();
    const q = quellen();

    const bewertet = ix.eintraege.map(e => {
      /* --- Berechtigungsschicht: was nicht gelesen werden darf, fliegt raus */
      if (!Konten.darf('lesen', e.seiteId)) return null;
      if (opt.nurSeite && e.seiteId !== opt.nurSeite && !istUnter(e.seiteId, opt.nurSeite)) return null;
      if (e.art === 'zeile' && !q.datenbanken) return null;
      if (e.art === 'seite' && !q.arbeitsbereich) return null;

      const basis = bm25(e, woerter, ix);
      if (basis <= 0 && unschaerfe(e, roh) < 0.34) return null;

      const titelWoerter = zerlegen(e.titel);
      const imTitel = roh.filter(w => titelWoerter.includes(w)).length;
      const alter = (jetzt - new Date(e.geaendert || 0).getTime()) / 86400000;
      const frische = alter < 400 ? (1 - alter / 400) * 0.9 : 0;

      const punkte = basis
        + imTitel * 2.2                          /* Titeltreffer wiegen schwer */
        + unschaerfe(e, roh) * 1.6
        + frische
        + (e.seiteId === App.aktuelleSeite() ? 1.4 : 0);

      return { ...e, punkte };
    }).filter(Boolean);

    bewertet.sort((a, b) => b.punkte - a.punkte);
    return bewertet.slice(0, opt.anzahl || 8);
  };

  const istUnter = (id, elternId) => {
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
  const ausschnitt = (eintrag, frage, laenge = 700) => {
    const woerter = zerlegen(frage);
    const saetze = String(eintrag.text || '').split(/(?<=[.!?])\s+|\n+/).filter(s => s.trim());
    if (!saetze.length) return String(eintrag.text || '').slice(0, laenge);

    const bewertet = saetze.map((s, i) => {
      const w = zerlegen(s);
      const treffer = woerter.filter(x => w.includes(x)).length;
      return { s, i, treffer };
    });
    bewertet.sort((a, b) => b.treffer - a.treffer || a.i - b.i);

    const genommen = [];
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

  const quelleSetzen = (k, an) => {
    const q = quellen();
    q[k] = an;
    Store.setMeta('ki:quellen', q);
  };

  /* ------------------------------------------------------------------------
   * DER FERTIGE KONTEXT FÜR DAS MODELL
   * ----------------------------------------------------------------------*/
  const bauenFuerFrage = (frage, opt = {}) => {
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

    /* 2. Der Rest des Arbeitsbereichs — gesucht, nicht komplett */
    if (q.arbeitsbereich || q.datenbanken) {
      const treffer = finden(frage, { anzahl: opt.anzahl || 6, nurSeite: opt.nurSeite });
      treffer.forEach(t => {
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

  const embeddingHolen = async (texte) => {
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
                             input: texte.map(t => t.slice(0, 8000)) })
    });
    return (d.data || []).map(x => x.embedding);
  };

  const cosinus = (a, b) => {
    let p = 0, na = 0, nb = 0;
    for (let i = 0; i < Math.min(a.length, b.length); i++) { p += a[i]*b[i]; na += a[i]*a[i]; nb += b[i]*b[i]; }
    return (na && nb) ? p / (Math.sqrt(na) * Math.sqrt(nb)) : 0;
  };

  /** Alle Seiten einmal durchrechnen. Dauert, kostet ein paar Cent, hält lange. */
  const embeddingsBauen = async (beiFortschritt) => {
    const ix = holen(true);
    const gemerkt = Store.getMeta('ki:vektoren', {}) || {};
    const offen = ix.eintraege.filter(e => !gemerkt[e.id] ||
      gemerkt[e.id].stand !== String(e.geaendert));
    if (!offen.length) return { neu: 0, gesamt: Object.keys(gemerkt).length };

    let n = 0;
    for (let i = 0; i < offen.length; i += 8) {
      const gruppe = offen.slice(i, i + 8);
      const v = await embeddingHolen(gruppe.map(e => e.titel + '\n' + e.text.slice(0, 3000)));
      gruppe.forEach((e, k) => {
        if (v[k] && v[k].length) gemerkt[e.id] = { v: v[k], stand: String(e.geaendert) };
      });
      n += gruppe.length;
      if (beiFortschritt) beiFortschritt(n, offen.length);
      Store.setMeta('ki:vektoren', gemerkt);
    }
    return { neu: n, gesamt: Object.keys(gemerkt).length };
  };

  const findenMitVektoren = async (frage, anzahl = 8) => {
    const gemerkt = Store.getMeta('ki:vektoren', {}) || {};
    if (!Object.keys(gemerkt).length) return finden(frage, { anzahl });
    const [fv] = await embeddingHolen([frage]);
    const ix = holen();
    const raus = ix.eintraege.map(e => {
      const g = gemerkt[e.id];
      if (!g) return null;
      if (!Konten.darf('lesen', e.seiteId)) return null;
      return { ...e, punkte: cosinus(fv, g.v) * 10 };
    }).filter(Boolean);
    raus.sort((a, b) => b.punkte - a.punkte);
    return raus.slice(0, anzahl);
  };

  return { bauen, holen, finden, findenMitVektoren, ausschnitt, bauenFuerFrage,
           quellen, quelleSetzen, QUELLEN_STANDARD, zerlegen, stamm, erweitern,
           embeddingsAn, embeddingsBauen, embeddingHolen, cosinus, textVonSeite };
})();

window.Kontext = Kontext;
