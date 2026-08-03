/* ==========================================================================
 * WOLKE — die Verbindung zum eigenen Server
 * --------------------------------------------------------------------------
 * Bis hierher lag alles auf dem Gerät, und das bleibt der Normalfall. Wer
 * gar nichts tut, merkt von dieser Datei nichts: keine Anfrage, kein Konto,
 * kein Byte, das die Wohnung verlässt.
 *
 * Wer sich anmeldet, bekommt vier Dinge, die ohne Server nicht gehen:
 *
 *   1. Dieselben Notizen auf Rechner und Telefon
 *   2. Rechte, die wirklich sperren statt nur auszublenden
 *   3. Eine Seite, die man jemandem schicken kann, der kein Redion hat
 *   4. Eine Schnittstelle, die auch von aussen erreichbar ist
 *
 * DIE VERSCHLÜSSELUNG
 * Private Seiten werden auf dem Gerät verschlüsselt und verlassen es nur so.
 * Der Schlüssel entsteht aus einem Satz, den nur der Mensch kennt, und wird
 * nie mitgeschickt. Der Server sieht bei diesen Seiten nichts als Buchstaben-
 * salat — er kann sie nicht lesen, nicht durchsuchen und nicht ausliefern.
 *
 * Was geteilt oder veröffentlicht wird, geht bewusst im Klartext. Anders
 * könnte der Server weder Rechte prüfen noch eine Seite an einen fremden
 * Browser schicken. Das steht auch im Fenster, bevor jemand darauf klickt —
 * eine Verschlüsselung, die man beim Teilen stillschweigend abschaltet, ist
 * schlimmer als gar keine.
 * ========================================================================*/
const Wolke = (() => {

  /* ========================================================================
   * 1 · WO STEHT DER SERVER
   * ======================================================================*/
  const adresse = () => {
    const eigen = Store.getMeta('wolkeAdresse', '');
    if (eigen) return String(eigen).replace(/\/+$/, '');
    /* Von einer echten Adresse aus ist der Server dieselbe Adresse. Von
       einer Datei aus (file://) gibt es keinen — dann bleibt alles lokal. */
    if (location.protocol === 'http:' || location.protocol === 'https:')
      return location.origin;
    return '';
  };

  const token    = () => Store.getMeta('wolkeToken', '');
  const bereich  = () => Store.getMeta('wolkeBereich', '');
  const angemeldet = () => !!token();

  const geraeteName = () => {
    let n = Store.getMeta('wolkeGeraet', '');
    if (n) return n;
    const p = navigator.platform || '';
    const mobil = /iPhone|iPad|Android/i.test(navigator.userAgent);
    n = (mobil ? 'Telefon' : 'Rechner') + (p ? ' (' + p + ')' : '');
    Store.setMeta('wolkeGeraet', n);
    return n;
  };

  /* ========================================================================
   * 2 · ANFRAGEN
   * ======================================================================*/
  const ruf = async (weg, opt = {}) => {
    const wurzel = adresse();
    if (!wurzel) throw new Error(
      'Von einer Datei aus gibt es keinen Server. Öffne Redion über eine Adresse — ' +
      'oder trage in den Einstellungen eine eigene ein.');

    const kopf = { 'Content-Type': 'application/json',
                   'Redion-Geraet': geraeteName(), ...(opt.kopf || {}) };
    if (token() && !kopf.Authorization) kopf.Authorization = 'Bearer ' + token();

    let a;
    try {
      a = await fetch(wurzel + weg, { method: opt.m || 'GET', headers: kopf,
        body: opt.k ? JSON.stringify(opt.k) : undefined });
    } catch (e) {
      throw new Error('Der Server ist nicht erreichbar. ' +
        'Deine Notizen sind trotzdem da — sie liegen auf diesem Gerät.');
    }

    const text = await a.text();
    let b; try { b = text ? JSON.parse(text) : {}; } catch { b = { text }; }

    if (a.status === 401 && token()) {
      /* Die Anmeldung ist abgelaufen. Nicht heimlich weiterversuchen —
         sagen, was los ist, und den toten Schlüssel wegräumen. */
      Store.setMeta('wolkeToken', '');
      zustand.angemeldet = false;
      melden();
      throw new Error('Die Anmeldung ist abgelaufen. Bitte noch einmal anmelden.');
    }
    if (a.status >= 400) throw new Error(b.message || b.error || ('Fehler ' + a.status));
    return b;
  };

  /* ========================================================================
   * 3 · DER SCHLÜSSEL — er bleibt hier
   * --------------------------------------------------------------------
   * Aus einem Satz wird über PBKDF2 ein Schlüssel. 310 000 Runden, wie beim
   * verschlüsselten Sicherungsarchiv — das ist die Zahl, die das OWASP für
   * SHA-256 nennt, und sie kostet auf einem Telefon eine knappe Sekunde.
   * Einmal beim Anmelden, nicht bei jeder Seite.
   * ======================================================================*/
  let schluessel = null;

  const schluesselAus = async (satz, salz) => {
    const roh = await crypto.subtle.importKey('raw',
      new TextEncoder().encode(satz), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: new TextEncoder().encode(salz),
        iterations: 310000, hash: 'SHA-256' },
      roh, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  };

  /**
   * Das Salz gehört zum Konto, nicht zum Gerät.
   *
   * Das war zuerst falsch: jedes Gerät würfelte sein eigenes Salz, und
   * derselbe Satz ergab auf dem Rechner einen anderen Schlüssel als auf dem
   * Telefon. Das Telefon holte die Sätze ab und konnte kein einziges lesen.
   *
   * Ein Salz muss nicht geheim sein — es muss beständig und je Mensch
   * verschieden sein. Die Kontokennung ist beides. Wer ohne Konto
   * verschlüsselt, bekommt weiterhin ein gewürfeltes Salz auf dem Gerät.
   */
  const salzHolen = () => {
    const konto = Store.getMeta('wolkeKonto', null);
    if (konto && konto.id) return 'redion:' + konto.id;
    const gemerkt = Store.getMeta('wolkeSalz', '');
    if (gemerkt) return gemerkt;
    const s = [...crypto.getRandomValues(new Uint8Array(16))]
      .map(x => x.toString(16).padStart(2, '0')).join('');
    Store.setMeta('wolkeSalz', s);
    return s;
  };

  const schluesselSetzen = async (satz) => {
    if (!satz) { schluessel = null; return false; }
    schluessel = await schluesselAus(satz, salzHolen());
    /* Eine Probe, damit ein Tippfehler sofort auffällt und nicht erst,
       wenn nichts mehr zu entschlüsseln ist. */
    const probe = Store.getMeta('wolkeProbe', '');
    if (probe) {
      const auf = await entschluessele(probe);
      if (auf !== 'redion') { schluessel = null; return false; }
    } else {
      Store.setMeta('wolkeProbe', await verschluessele('redion'));
    }
    return true;
  };

  const hatSchluessel = () => !!schluessel;

  const verschluessele = async (text) => {
    if (!schluessel) throw new Error('Es ist kein Schlüssel gesetzt.');
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const daten = new TextEncoder().encode(String(text));
    const chiffre = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, schluessel, daten);
    const alles = new Uint8Array(iv.length + chiffre.byteLength);
    alles.set(iv); alles.set(new Uint8Array(chiffre), iv.length);
    return btoa(String.fromCharCode(...alles));
  };

  const entschluessele = async (paket) => {
    if (!schluessel) return null;
    try {
      const roh = Uint8Array.from(atob(String(paket)), c => c.charCodeAt(0));
      const iv = roh.slice(0, 12);
      const klar = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, schluessel, roh.slice(12));
      return new TextDecoder().decode(klar);
    } catch { return null; }
  };

  /* ========================================================================
   * 4 · ZUSTAND UND MELDUNGEN
   * ======================================================================*/
  const zustand = { angemeldet: false, laeuft: false, letzter: '', fehler: '',
                    hoch: 0, runter: 0, konto: null, rolle: '' };
  const horcher = new Set();
  const melden = () => horcher.forEach(fn => { try { fn(zustand); } catch {} });
  const beiAenderung = (fn) => { horcher.add(fn); fn(zustand); return () => horcher.delete(fn); };

  /* ========================================================================
   * 5 · ANMELDEN
   * ======================================================================*/

  /** Über GitHub oder Google — ein Fenster geht auf, der Schlüssel kommt zurück. */
  const anmeldenMit = (anbieter) => new Promise((fertig, schief) => {
    const wurzel = adresse();
    if (!wurzel) { schief(new Error('Kein Server erreichbar.')); return; }

    const fenster = window.open(
      wurzel + '/konto/oauth/' + anbieter + '?zurueck=' + encodeURIComponent(wurzel),
      'redion-anmeldung', 'width=520,height=680');
    if (!fenster) { schief(new Error(
      'Das Anmeldefenster wurde blockiert. Bitte Pop-ups für diese Seite erlauben.')); return; }

    /* Von wem eine Nachricht kommen DARF: nur vom Server, den wir gefragt
       haben. Diese Prüfung fehlte, und ohne sie durfte jede Seite — auch ein
       eingebetteter Rahmen — einen Schlüssel hereinreichen. Die App hätte ihn
       genommen, und von da an wären die Notizen des Menschen in den Bestand
       eines Fremden geflossen. Nicht gestohlen, sondern hineingeschoben; das
       ist die Richtung, die man leichter übersieht und die mehr kostet.
       In `bereiche/verbinden/konten.js` stand diese Zeile schon — hier nicht.
       Dieselbe Sorte Loch wie die zwanzig halben `esc`. */
    let serverUrsprung;
    try { serverUrsprung = new URL(wurzel).origin; } catch { serverUrsprung = ''; }

    const uhr = setTimeout(() => { aufraeumen(); schief(new Error('Zeit abgelaufen.')); }, 180000);
    const beiPost = async (e) => {
      if (!serverUrsprung || e.origin !== serverUrsprung) return;
      const d = e.data || {};
      if (d.art !== 'redion-anmeldung' || !d.token) return;
      aufraeumen();
      await tokenUebernehmen(d.token);
      fertig(zustand.konto);
    };
    const aufraeumen = () => {
      clearTimeout(uhr);
      window.removeEventListener('message', beiPost);
      try { fenster.close(); } catch {}
    };
    window.addEventListener('message', beiPost);
  });

  /** Für das Telefon: der Rechner zeigt einen Code, das Telefon tippt ihn. */
  const codeHolen = async () => ruf('/konto/code', { m: 'POST', k: { geraet: geraeteName() } });

  const codeWarten = async (code, beiSchritt) => {
    const bis = Date.now() + 10 * 60000;
    while (Date.now() < bis) {
      await new Promise(r => setTimeout(r, 2500));
      try {
        const a = await fetch(adresse() + '/konto/code-holen', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }) });
        if (a.status === 200) {
          const b = await a.json();
          await tokenUebernehmen(b.token);
          return zustand.konto;
        }
        if (a.status !== 202) throw new Error((await a.json()).message || 'Fehler');
      } catch (e) {
        if (!/202/.test(String(e))) { if (beiSchritt) beiSchritt(String(e.message || e)); }
      }
      if (beiSchritt) beiSchritt('');
    }
    throw new Error('Der Code ist abgelaufen. Bitte einen neuen holen.');
  };

  /** Ein anderes Gerät freigeben — auf dem schon angemeldeten. */
  const codeFreigeben = (code) => ruf('/konto/code-freigeben', { m: 'POST', k: { code } });

  const tokenUebernehmen = async (t) => {
    Store.setMeta('wolkeToken', t);
    const ich = await ruf('/konto/ich');
    zustand.angemeldet = true;
    zustand.konto = ich.konto;
    if (!bereich() && ich.bereiche.length) Store.setMeta('wolkeBereich', ich.bereiche[0].id);
    Store.setMeta('wolkeKonto', ich.konto);
    melden();
    if (window.Protokoll)
      Protokoll.notieren('konto', 'Bei der Wolke angemeldet als ' + ich.konto.name);
    return ich;
  };

  const abmelden = async () => {
    try { await ruf('/konto/abmelden', { m: 'POST' }); } catch {}
    Store.setMeta('wolkeToken', '');
    zustand.angemeldet = false;
    zustand.konto = null;
    schluessel = null;
    /* Der gemeinsame Stand gehört zum Konto. Bleibt er liegen, vergleicht
       der nächste Abgleich gegen einen Stand, den es dort nie gab. */
    try { await Store.basisLeeren(); } catch {}
    Store.setMeta('wolkeMarkeHoch', '');
    Store.setMeta('wolkeMarkeRunter', '');
    melden();
    if (window.Protokoll) Protokoll.notieren('konto', 'Von der Wolke abgemeldet');
  };

  /* ========================================================================
   * 6 · DER ABGLEICH
   * ------------------------------------------------------------------------
   * Zwei Richtungen, immer in dieser Reihenfolge: erst holen, dann schicken.
   * Wer zuerst schickt, überschreibt womöglich etwas, das er noch gar nicht
   * gesehen hat.
   * ======================================================================*/

  /** Welche Sätze haben sich seit dem letzten Mal geändert? */
  const zuSchicken = () => {
    const marke = Store.getMeta('wolkeMarkeHoch', '');
    const raus = [];
    Object.values(Store.cache.blocks).forEach(b => {
      if (String(b.edited || b.created || '') <= marke) return;
      raus.push({ id: b.id, tabelle: 'blocks', satz: b,
                  seite: seiteVon(b), geloescht: b.alive === false });
    });
    Object.values(Store.cache.collections).forEach(c => {
      if (String(c.edited || c.created || '') <= marke) return;
      raus.push({ id: c.id, tabelle: 'collections', satz: c, seite: c.id, geloescht: false });
    });
    Object.values(Store.cache.views).forEach(v => {
      if (String(v.edited || v.created || '') <= marke) return;
      raus.push({ id: v.id, tabelle: 'views', satz: v, seite: v.collectionId, geloescht: false });
    });
    return raus;
  };

  /** Zu welcher Seite gehört dieser Block? Für die Rechteprüfung am Server. */
  const seiteVon = (b) => {
    let cur = b, tiefe = 0;
    while (cur && tiefe++ < 40) {
      if (cur.type === 'page' && cur.parentTable !== 'collection') return cur.id;
      if (!cur.parentId) return cur.id;
      const eltern = Store.getBlock(cur.parentId);
      if (!eltern) return cur.id;
      cur = eltern;
    }
    return b.id;
  };

  /** Soll dieser Satz verschlüsselt werden? Alles, was nicht geteilt ist. */
  const istGeteilt = (seiteId) => (Store.getMeta('wolkeGeteilt', []) || []).includes(seiteId);

  /* Wie viele Sätze auf einmal. Der Server nimmt 500; 300 lassen Luft für
     grosse Seiten, ohne dass die Anfrage zu lang wird. */
  const RUNDE = 300;

  /**
   * Alles Wartende hochschicken — in Runden, bis nichts mehr da ist.
   *
   * Das war zuerst ein Abschneiden bei 400 Sätzen, und weil die Liste in
   * der Reihenfolge der Anlage kam, blieb ausgerechnet das Neueste liegen.
   * Ein Abgleich, der still die Hälfte weglässt, ist schlimmer als keiner:
   * man merkt es erst am anderen Gerät, und dann sucht man beim Falschen.
   */
  const hoch = async () => {
    let angenommen = 0;
    const abgelehnt = [], angepasst = [];

    for (let runde = 0; runde < 40; runde++) {
      const liste = zuSchicken();
      if (!liste.length) break;

      /* Das Älteste zuerst — dann rückt die Marke bei jeder Runde vor und
         der nächste Durchgang holt wirklich Neues. */
      liste.sort((a, b) => String(a.satz.edited || a.satz.created || '')
        .localeCompare(String(b.satz.edited || b.satz.created || '')));
      const dran = liste.slice(0, RUNDE);

      const paket = [];
      for (const e of dran) {
        const klar = JSON.stringify(e.satz);
        const offen = istGeteilt(e.seite);
        paket.push({
          id: e.id, tabelle: e.tabelle, seite: e.seite,
          daten: (offen || !hatSchluessel()) ? klar : await verschluessele(klar),
          verschluesselt: !offen && hatSchluessel(),
          version: Number(e.satz.wolkeVersion || 1),
          geaendert: e.satz.edited || e.satz.created || Store.now(),
          geloescht: e.geloescht
        });
      }

      const a = await ruf('/sync/hoch', { m: 'POST', k: { bereich: bereich(), saetze: paket } });
      angenommen += a.angenommen;
      if (Array.isArray(a.abgelehnt)) abgelehnt.push(...a.abgelehnt);

      /* Was angekommen ist, ist ab jetzt der gemeinsame Stand. Ohne diese
         Zeile hätte das andere Gerät später keinen Vergleichspunkt und
         müsste wieder raten, wer was geändert hat. */
      /* Auch was der Server angepasst hat, zählt hier als „nicht so
         angekommen": er hält jetzt etwas anderes als wir geschickt haben,
         und der nächste Vergleich muss das merken. */
      const nein = new Set([...(a.abgelehnt || []), ...(a.angepasst || [])]
        .map(x => (x && x.id) || x));
      for (const e of dran) if (!nein.has(e.id)) await Store.basisPut(e.id, e.satz);
      if (Array.isArray(a.angepasst) && a.angepasst.length) angepasst.push(...a.angepasst);

      /* Die Marke wandert bis zum letzten Satz dieser Runde — nicht auf
         „jetzt", sonst fielen alle Änderungen dazwischen unter den Tisch. */
      const letzte = paket[paket.length - 1];
      Store.setMeta('wolkeMarkeHoch', letzte ? letzte.geaendert : Store.now());

      if (liste.length <= RUNDE) break;
    }

    zustand.hoch += angenommen;
    if (angepasst.length) {
      const felder = [...new Set(angepasst.flatMap(x => x.felder || []))];
      zustand.fehler = angepasst.length + ' Zeilen: Spalten ohne Schreibrecht ' +
        'wurden zurückgesetzt' + (felder.length ? ' (' + felder.join(', ') + ')' : '') + '.';
      melden();
    }
    return { angenommen, abgelehnt, angepasst };
  };

  const runter = async () => {
    /* Auch hier in Runden: der Server liefert höchstens 500 auf einmal und
       sagt mit `mehr`, ob noch etwas übrig ist. */
    let uebernommenGesamt = 0, unlesbarGesamt = 0, gemischtGesamt = 0, mehr = true, runde = 0;
    while (mehr && runde++ < 40) {
      const teil = await runterEinmal();
      uebernommenGesamt += teil.uebernommen;
      unlesbarGesamt += teil.unlesbar;
      gemischtGesamt += teil.gemischt || 0;
      mehr = teil.mehr;
    }

    /* Kam nichts an, lag aber etwas da? Dann stimmt der Satz nicht. Das ist
       die häufigste Verwechslung überhaupt — lieber einmal deutlich sagen
       als still nichts tun. */
    if (unlesbarGesamt && !uebernommenGesamt) {
      zustand.fehler = unlesbarGesamt + ' Seiten liegen da, aber der Schlüssel passt nicht. ' +
        'Wahrscheinlich ein anderer Satz als auf dem ersten Gerät.';
      melden();
    }
    zustand.unlesbar = unlesbarGesamt;
    return { uebernommen: uebernommenGesamt, unlesbar: unlesbarGesamt,
             gemischt: gemischtGesamt,
             strittig: (typeof Zusammen !== 'undefined') ? Zusammen.offene().length : 0,
             mehr: false };
  };

  const runterEinmal = async () => {
    const a = await ruf('/sync/runter', { m: 'POST',
      k: { bereich: bereich(), seit: Store.getMeta('wolkeMarkeRunter', '') } });
    zustand.rolle = a.rolle || '';

    let uebernommen = 0, unlesbar = 0, gemischt = 0, strittig = 0;
    for (const s of a.saetze) {
      let klar = s.daten;
      if (s.verschluesselt) {
        klar = await entschluessele(s.daten);
        if (klar === null) { unlesbar++; continue; }
      }
      let satz;
      try { satz = JSON.parse(klar); } catch { continue; }
      satz.wolkeVersion = s.version;

      const hier = s.tabelle === 'blocks' ? Store.cache.blocks[s.id]
                 : s.tabelle === 'collections' ? Store.cache.collections[s.id]
                 : Store.cache.views[s.id];

      /* Nichts hier? Dann ist es einfach neu. */
      if (!hier) {
        Store.rohSetzen(s.tabelle, satz);
        await Store.basisPut(s.id, satz);
        uebernommen++;
        continue;
      }

      /* Hier unverändert seit dem letzten Abgleich? Dann gilt der Server. */
      const basis = await Store.basisHolen(s.id);

      /* Zusammenführen statt überschreiben. Vorher hiess die Regel „wer
         später gespeichert hat, gewinnt" — und der andere verlor seine
         Arbeit, ohne dass es jemand sah. Mit dem letzten gemeinsamen Stand
         lässt sich unterscheiden, wer was angefasst hat: verschiedene
         Felder gehen beide durch, dieselbe Stelle wird gefragt. */
      const r = (typeof Zusammen !== 'undefined')
        ? Zusammen.dreiWege(basis, hier, satz)
        : { satz: (String(hier.edited || '') > String(s.geaendert || '')) ? hier : satz,
            konflikte: [] };

      const neu = r.satz;
      neu.id = s.id;
      neu.wolkeVersion = s.version;

      Store.rohSetzen(s.tabelle, neu);
      await Store.basisPut(s.id, satz);      /* Basis ist immer der Serverstand */

      if (r.konflikte.length) {
        strittig += r.konflikte.length;
        try { Zusammen.merke(s.id, s.tabelle, r.konflikte); } catch {}
      } else if (r.zusammengefuehrt) gemischt++;
      uebernommen++;
    }

    if (a.marke) Store.setMeta('wolkeMarkeRunter', a.marke);
    zustand.runter += uebernommen;
    zustand.unlesbar = unlesbar;
    zustand.gemischt = (zustand.gemischt || 0) + gemischt;
    zustand.strittig = (typeof Zusammen !== 'undefined') ? Zusammen.offene().length : strittig;

    if (uebernommen) { try { App.zeichneSeite(); App.zeichneBaum(); } catch {} }
    if (typeof Zusammen !== 'undefined') { try { Zusammen.melde(); } catch {} }
    return { uebernommen, unlesbar, gemischt, strittig, mehr: a.mehr };
  };

  /** Beide Richtungen. Läuft nie zweimal gleichzeitig. */
  const abgleichen = async () => {
    if (!angemeldet() || !bereich() || zustand.laeuft) return null;
    zustand.laeuft = true; zustand.fehler = ''; melden();
    try {
      const r = await runter();
      const h = await hoch();
      zustand.letzter = Store.now();
      if (typeof Feldrechte !== 'undefined') { try { await Feldrechte.auffrischen(); } catch {} }
      if (r.strittig && typeof Zusammen !== 'undefined') { try { Zusammen.hinweisen(); } catch {} }
      return { ...r, ...h };
    } catch (e) {
      zustand.fehler = e.message || String(e);
      throw e;
    } finally {
      zustand.laeuft = false; melden();
    }
  };

  /* Alle zwei Minuten von selbst — und wenn das Fenster wieder nach vorne
     kommt, denn dann hat womöglich das andere Gerät gearbeitet. */
  let uhr = null;
  const takt = () => {
    clearInterval(uhr);
    if (!angemeldet()) return;
    uhr = setInterval(() => { abgleichen().catch(() => {}); }, 120000);
  };

  /* ========================================================================
   * 7 · TEILEN UND VERÖFFENTLICHEN
   * ======================================================================*/
  const geteiltSetzen = (seiteId, an) => {
    const liste = Store.getMeta('wolkeGeteilt', []) || [];
    const neu = an ? [...new Set([...liste, seiteId])] : liste.filter(x => x !== seiteId);
    Store.setMeta('wolkeGeteilt', neu);
    /* Damit die Seite beim nächsten Abgleich im Klartext hochgeht */
    Store.setMeta('wolkeMarkeHoch', '');
  };

  const freigeben = (seiteId, kontoMail, rolle) =>
    ruf('/freigabe', { m: 'POST',
      k: { bereich: bereich(), seite: seiteId, konto: kontoMail, rolle } });

  const freigaben = () => ruf('/freigabe?bereich=' + encodeURIComponent(bereich()));

  const veroeffentlichen = async (seiteId, opt = {}) => {
    const seite = Store.getBlock(seiteId);
    if (!seite) throw new Error('Diese Seite gibt es nicht.');
    /* Der Inhalt wird hier gebaut — die App weiss am besten, wie ihre
       Blöcke aussehen. Der Server nimmt nur, was harmlos ist. */
    const html = window.Werkzeuge && Werkzeuge.seiteAlsHtml
      ? Werkzeuge.seiteAlsHtml(seite)
      : '<p>' + String(seite.text || '') + '</p>';
    const a = await ruf('/veroeffentlichen', { m: 'POST',
      k: { bereich: bereich(), seite: seiteId, titel: seite.text || 'Ohne Titel',
           inhalt: html, passwort: opt.passwort || '', tage: opt.tage || 0 } });
    if (window.Protokoll)
      Protokoll.notieren('freigabe', 'Seite veröffentlicht: ' + (seite.text || ''),
        { seite: seiteId, wie: a.adresse });
    return a;
  };

  const zurueckziehen = (seiteId) =>
    ruf('/veroeffentlichen', { m: 'DELETE', k: { bereich: bereich(), seite: seiteId } });

  /* ========================================================================
   * 8 · MARKEN
   * ======================================================================*/
  const markeAnlegen = (name, rechte, tage) =>
    ruf('/marken', { m: 'POST', k: { name, bereich: bereich(), rechte, tage } });
  const markenListe = () => ruf('/marken');
  const markeWeg = (kennung) => ruf('/marken/' + kennung, { m: 'DELETE' });

  /* ========================================================================
   * 9 · START
   * ======================================================================*/
  const start = async () => {
    if (!token()) return;
    zustand.konto = Store.getMeta('wolkeKonto', null);
    zustand.angemeldet = true;
    melden();
    /* Nicht sofort losrennen: erst soll die App stehen. */
    setTimeout(() => {
      abgleichen().catch(() => {});
      takt();
    }, 3000);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && angemeldet()) abgleichen().catch(() => {});
    });
  };

  return { adresse, token, bereich, angemeldet, geraeteName, zustand, beiAenderung,
           anmeldenMit, codeHolen, codeWarten, codeFreigeben, tokenUebernehmen, abmelden,
           schluesselSetzen, hatSchluessel, verschluessele, entschluessele,
           hoch, runter, abgleichen, takt, zuSchicken, seiteVon,
           geteiltSetzen, istGeteilt, freigeben, freigaben,
           veroeffentlichen, zurueckziehen,
           markeAnlegen, markenListe, markeWeg, ruf, start };
})();

window.Wolke = Wolke;
