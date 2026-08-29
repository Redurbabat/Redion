/* ==========================================================================
 * WOLKE — die Verbindung zum eigenen Server
 * --------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/kern/abgleich/maschine.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/kern/abgleich/maschine.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
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

  /* Was der Server annimmt. Hier stand ein blankes `100 * 1024 * 1024`
     mitten in einer Schleife — ohne Namen und ohne Verbindung zu
     `DATEI_GRENZE` in `server/dateien.ts`, das dieselbe Zahl trägt. Wäre
     eine der beiden gewachsen, hätte das Gerät entweder Dateien
     zurückgehalten, die der Server genommen hätte, oder welche geschickt,
     die er mit 413 abweist. `test140` rechnet beide Zahlen nach. */
  const SERVER_DATEI_MAX =
    (typeof KONSTANTEN !== 'undefined' && Number((KONSTANTEN as any).SERVER_DATEI_MAX)) ||
    100 * 1024 * 1024;

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
  /* Ein Aufruf an den Server: Weg, Verb, Kopfzeilen und der Körper.
     Vorher stand hier nur `opt = {}` — TypeScript las daraus „ein leeres
     Objekt für immer" und kannte weder `opt.m` noch `opt.k`. */
  const ruf = async (weg: any, opt: { m?: string; kopf?: Record<string, string>; k?: any } = {}) => {
    const wurzel = adresse();
    if (!wurzel) throw new Error(
      'Von einer Datei aus gibt es keinen Server. Öffne Redion über eine Adresse — ' +
      'oder trage in den Einstellungen eine eigene ein.');

    const kopf: Record<string, string> = { 'Content-Type': 'application/json',
                   'Redion-Geraet': geraeteName(), ...(opt.kopf || {}) };
    if (token() && !kopf.Authorization) kopf.Authorization = 'Bearer ' + token();

    let a;
    try {
      /* `body` nur setzen, wenn es einen gibt: mit `exactOptionalPropertyTypes`
         ist ein ausdrückliches `undefined` etwas anderes als gar kein Feld. */
      a = await fetch(wurzel + weg, opt.k
        ? { method: opt.m || 'GET', headers: kopf, body: JSON.stringify(opt.k) }
        : { method: opt.m || 'GET', headers: kopf });
    } catch {
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
  let schluessel: any = null;

  const schluesselAus = async (satz: any, salz: any) => {
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

  const schluesselSetzen = async (satz: any) => {
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

  const verschluessele = async (text: string) => {
    if (!schluessel) throw new Error('Es ist kein Schlüssel gesetzt.');
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const daten = new TextEncoder().encode(String(text));
    const chiffre = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, schluessel, daten);
    const alles = new Uint8Array(iv.length + chiffre.byteLength);
    alles.set(iv); alles.set(new Uint8Array(chiffre), iv.length);
    /* Aus `core/helpers/bytes.ts`. Der Spread sprengte hier ab etwa 128 000
       Bytes den Aufrufstapel — bei einem Abgleichpaket mit einem grösseren
       Seitenbaum ist das schnell erreicht. */
    return Bytes.toBase64(alles);
  };

  const entschluessele = async (paket: any) => {
    if (!schluessel) return null;
    try {
      const roh = Bytes.fromBase64(paket);
      const iv = roh.slice(0, 12);
      const klar = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, schluessel, roh.slice(12));
      return new TextDecoder().decode(klar);
    } catch { return null; }
  };

  /* ========================================================================
   * 4 · ZUSTAND UND MELDUNGEN
   * ======================================================================*/
  /* Das angemeldete Konto, so wie der Server es liefert. Vorher stand hier
     nur `konto: null` — für TypeScript hiess das „bleibt für immer null",
     und jeder Zugriff auf `konto.name` war ein Fehler. */
  type Konto = { id?: string; name?: string; mail?: string; bild?: string };
  type Zustand = {
    angemeldet: boolean; laeuft: boolean; letzter: string; fehler: string;
    hoch: number; runter: number; konto: Konto | null; rolle: string;
    /* Was der letzte Abgleich ergeben hat. Standen vorher nirgends —
       sie wurden erst beim Schreiben angelegt, und `zustand.gemischt`
       war beim ersten Lesen `undefined`. */
    unlesbar?: number; gemischt?: number; strittig?: number;
    /* Anhänge haben ihren eigenen Fehlerplatz: ein hakender Upload darf
       nicht so aussehen, als wäre der Satz-Abgleich gescheitert. */
    fehlerDateien?: string;
  };
  const zustand: Zustand = { angemeldet: false, laeuft: false, letzter: '', fehler: '',
                    hoch: 0, runter: 0, konto: null, rolle: '' };
  const horcher = new Set<(z: Zustand) => void>();
  const melden = () => horcher.forEach((fn: any) => { try { fn(zustand); } catch {} });
  const beiAenderung = (fn: any) => { horcher.add(fn); fn(zustand); return () => horcher.delete(fn); };

  /* ========================================================================
   * 5 · ANMELDEN
   * ======================================================================*/

  /** Über GitHub oder Google — ein Fenster geht auf, der Schlüssel kommt zurück. */
  const anmeldenMit = (anbieter: any) => new Promise((fertig, schief) => {
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
    const beiPost = async (e: any) => {
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

  const codeWarten = async (code: any, beiSchritt?: any) => {
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
        if (!/202/.test(String(e))) {
          if (beiSchritt) beiSchritt(e instanceof Error ? e.message : String(e));
        }
      }
      if (beiSchritt) beiSchritt('');
    }
    throw new Error('Der Code ist abgelaufen. Bitte einen neuen holen.');
  };

  /** Ein anderes Gerät freigeben — auf dem schon angemeldeten. */
  const codeFreigeben = (code: any) => ruf('/konto/code-freigeben', { m: 'POST', k: { code } });

  const tokenUebernehmen = async (t: string) => {
    Store.setMeta('wolkeToken', t);
    const ich = await ruf('/konto/ich');
    zustand.angemeldet = true;
    zustand.konto = ich.konto;
    if (!bereich() && ich.bereiche.length) Store.setMeta('wolkeBereich', ich.bereiche[0].id);
    Store.setMeta('wolkeKonto', ich.konto);
    melden();
    if (typeof Protokoll !== 'undefined')
      Protokoll.notieren('konto', 'Bei der Wolke angemeldet als ' + ich.konto.name);
    return ich;
  };

  /** Das Konto samt allem Serverseitigen löschen — die Notizen auf diesem
   *  Gerät bleiben. Der Server räumt die Kaskade, danach wird lokal
   *  aufgeräumt wie beim Abmelden. */
  const kontoLoeschen = async () => {
    const a = await ruf('/konto/loeschen', { m: 'POST' });
    await abmelden();
    return a;
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
    Store.setMeta('wolkeMarkeDateien', '');
    Store.setMeta('wolkeDateienOben', []);
    /* Unversandte Datei-Grabsteine gehören zu DIESEM Konto: nach dem
       Abmelden bleibt der Server-Bestand unangetastet, und ein späteres,
       anderes Konto erbt keine fremden Löschabsichten (E249). */
    Store.setMeta('wolkeDateienWeg', []);
    /* Das Ja zum Abgleich gehörte zu DIESEM Konto — das nächste wird neu
       gefragt. */
    Store.setMeta('wolkeAbgleich', null);
    melden();
    if (typeof Protokoll !== 'undefined') Protokoll.notieren('konto', 'Von der Wolke abgemeldet');
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
    const raus: any[] = [];
    Object.values<any>(Store.cache.blocks).forEach(b => {
      if (String(b.edited || b.created || '') <= marke) return;
      raus.push({ id: b.id, tabelle: 'blocks', satz: b,
                  seite: seiteVon(b), geloescht: b.alive === false });
    });
    Object.values<any>(Store.cache.collections).forEach(c => {
      if (String(c.edited || c.created || '') <= marke) return;
      raus.push({ id: c.id, tabelle: 'collections', satz: c, seite: c.id, geloescht: false });
    });
    Object.values<any>(Store.cache.views).forEach(v => {
      if (String(v.edited || v.created || '') <= marke) return;
      raus.push({ id: v.id, tabelle: 'views', satz: v, seite: v.collectionId, geloescht: false });
    });
    return raus;
  };

  /** Zu welcher Seite gehört dieser Block? Für die Rechteprüfung am Server. */
  const seiteVon = (b: any) => {
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
  const istGeteilt = (seiteId: string) => (Store.getMeta('wolkeGeteilt', []) || []).includes(seiteId);

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
      const zeitVon = (e: any) => String(e.satz.edited || e.satz.created || '');
      liste.sort((a, b) => zeitVon(a).localeCompare(zeitVon(b)));

      /* ─── EINE MILLISEKUNDE WIRD NIE ZERSCHNITTEN ─────────────────────────
       *
       * DIE STELLE, AN DER STILL ETWAS NIE ANKOMMT. Die Marke wandert unten
       * auf den Zeitstempel des letzten gesendeten Satzes, und `zuSchicken`
       * filtert mit `edited <= marke`. Lägen zwei Sätze in DERSELBEN
       * Millisekunde und fiele der Schnitt zwischen sie, wäre der zweite ab
       * sofort ausgeschlossen — für immer. Er stünde auf diesem Gerät da und
       * käme nie in der Wolke an. Kein Fehler, keine Meldung, nichts.
       *
       * Von Hand passiert das nie: dreihundert Sätze in einer Millisekunde
       * schreibt kein Mensch. Beim Einfügen aus Excel, beim CSV-Import und
       * bei Vorlagen entstehen sie in Reihe — und genau die sind es, die
       * jemand hinterher vermisst.
       *
       * Also nimmt die Runde alles mit, was denselben Zeitstempel trägt wie
       * ihr letzter Satz. Sie wird dadurch gelegentlich grösser als RUNDE.
       * Das ist der richtige Preis: lieber ein Paket zu gross als ein Satz
       * zu wenig. */
      let bis = Math.min(RUNDE, liste.length);
      if (bis < liste.length) {
        const grenze = zeitVon(liste[bis - 1]);
        while (bis < liste.length && zeitVon(liste[bis]) === grenze) bis++;
      }
      const dran = liste.slice(0, bis);

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

      if (liste.length <= dran.length) break;
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

  /* ------------------------------------------------------------------------
   * DER SCHALTER — abgleichen nur mit ausdrücklichem Ja (E1, E34)
   * ------------------------------------------------------------------------
   * Angemeldet sein und abgleichen sind zwei Entscheidungen. Die zweite
   * fällt hier: ohne `wolkeAbgleich` verlässt kein Satz und kein Stück
   * dieses Gerät — egal wer Takt, Sichtwechsel oder online-Ereignis ist,
   * sie laufen alle durch `abgleichen()`.
   *
   * Bestandsgeräte: wer vor dem Schalter schon abgeglichen hat, hat sein
   * Ja längst gegeben — ein stiller Sync-Stopp wäre die falsche Sorte
   * Überraschung. Die Marken sind der Beleg. */
  const abgleichErlaubt = () => {
    const v = Store.getMeta('wolkeAbgleich', null);
    if (v !== null) return !!v;
    return !!(Store.getMeta('wolkeMarkeHoch', '') || Store.getMeta('wolkeMarkeRunter', ''));
  };
  const abgleichSetzen = (an: boolean) => { Store.setMeta('wolkeAbgleich', !!an); melden(); };

  /** Beide Richtungen. Läuft nie zweimal gleichzeitig. */
  const abgleichen = async () => {
    if (!angemeldet() || !bereich() || zustand.laeuft || !abgleichErlaubt()) return null;
    zustand.laeuft = true; zustand.fehler = ''; melden();
    try {
      const r = await runter();
      const h = await hoch();
      /* Erst die Sätze, dann die Bytes dazu — ein Blockverweis ohne Datei
         ist ein kurzer Zustand, eine Datei ohne Block ein verwaister. */
      const d = await dateienAbgleichen();
      zustand.letzter = Store.now();
      if (typeof Feldrechte !== 'undefined') { try { await Feldrechte.auffrischen(); } catch {} }
      if (r.strittig && typeof Zusammen !== 'undefined') { try { Zusammen.hinweisen(); } catch {} }
      return { ...r, ...h, ...(d || {}) };
    } catch (e) {
      zustand.fehler = e instanceof Error ? e.message : String(e);
      throw e;
    } finally {
      zustand.laeuft = false; melden();
    }
  };

  /* Alle zwei Minuten von selbst — und wenn das Fenster wieder nach vorne
     kommt, denn dann hat womöglich das andere Gerät gearbeitet. */
  let uhr: any = null;
  const takt = () => {
    clearInterval(uhr);
    if (!angemeldet()) return;
    uhr = setInterval(() => { abgleichen().catch(() => {}); }, 120000);
  };

  /* ========================================================================
   * 6b · ANHÄNGE — die Bytes zu den Blöcken (G2, E33)
   * ------------------------------------------------------------------------
   * Die Sätze nehmen nur den VERWEIS mit (dateiId am Block). Hier gehen die
   * Bytes selbst: stückweise, wie sie in `stuecke` liegen — nie eine ganze
   * Datei im Arbeitsspeicher. Wer seine Sätze verschlüsselt, verschlüsselt
   * auch seine Stücke; der Server sieht nur das Flag.
   *
   * Merken statt raten: `wolkeDateienOben` hält die Kennungen, die der
   * Server schon hat, `wolkeMarkeDateien` die Stand-Marke fürs Holen.
   * Beide räumt `abmelden()` weg, wie die Satz-Marken auch.
   * ======================================================================*/

  const verschluesseleBytes = async (bytes: Uint8Array): Promise<Uint8Array> => {
    if (!schluessel) throw new Error('Es ist kein Schlüssel gesetzt.');
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const chiffre = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, schluessel,
      bytes as BufferSource);
    const alles = new Uint8Array(iv.length + chiffre.byteLength);
    alles.set(iv); alles.set(new Uint8Array(chiffre), iv.length);
    return alles;
  };

  const entschluesseleBytes = async (bytes: Uint8Array): Promise<Uint8Array | null> => {
    if (!schluessel) return null;
    try {
      const iv = bytes.slice(0, 12);
      const klar = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, schluessel, bytes.slice(12));
      return new Uint8Array(klar);
    } catch { return null; }
  };

  /* Läuft der Server ohne Dateispeicher (kein R2 gebunden), sagt er das mit
     einem klaren Satz. Dann bis zum nächsten Laden der App nicht mehr
     anklopfen — der Zustand ändert sich nicht von allein, und ein Fehler
     alle zwei Minuten wäre nur Lärm über einen dokumentierten Betrieb. */
  let dateienGehenNicht = false;

  /** Zu welcher Seite gehört diese Datei? Über ihren Block — für die
   *  Rechteprüfung am Server. Ohne Block gilt die Kennung selbst. */
  const seiteFuerDatei = (d: any) => {
    const b = d.blockId ? Store.getBlock(d.blockId) : null;
    return b ? seiteVon(b) : String(d.blockId || d.id);
  };

  /** Melden, was hier endgültig gelöscht wurde (E249/L6) — und zwar VOR
   *  dem Holen: sonst lädt `dateienRunter` die eben gelöschte Datei vom
   *  Server zurück, bevor ihr Grabstein je gesendet war. */
  const dateienWeg = async () => {
    const offen: string[] = Store.getMeta('wolkeDateienWeg', []) || [];
    let gemeldet = 0;
    for (const id of offen) {
      try {
        await ruf('/datei/weg', { m: 'POST', k: { bereich: bereich(), dateiId: id } });
        Store.dateiGrabsteinWeg(id);
        gemeldet++;
      } catch (e) {
        const satz = e instanceof Error ? e.message : String(e);
        /* Kein Dateispeicher: derselbe Riegel wie bei Runter/Hoch. */
        if (/Dateispeicher/.test(satz)) throw e;
        /* 404 — der Server kennt sie nicht (mehr): erledigt. */
        if (/gibt es hier nicht/.test(satz)) { Store.dateiGrabsteinWeg(id); continue; }
        /* 403 — kein Schreibrecht auf der Seite: der Grabstein wird
           ausgetragen statt ewig wiederholt. Die Datei bleibt auf dem
           Server, und das steht im Protokoll — Rechte entscheiden final
           (§26), ein Zwei-Minuten-Takt ändert daran nichts. */
        if (/Schreibrecht/.test(satz)) {
          Store.dateiGrabsteinWeg(id);
          if (typeof Protokoll !== 'undefined')
            Protokoll.notieren('konto', 'Eine gelöschte Datei bleibt auf dem Server: ' +
              'kein Schreibrecht auf ihrer Seite (' + id + ').');
          continue;
        }
        /* Netz oder Serverfehler: liegen lassen — der nächste Takt
           versucht es wieder. Der Grabstein ist beharrlich, nicht laut. */
      }
    }
    return { dateienWeggemeldet: gemeldet };
  };

  /** Holen, was der Server hat und hier fehlt — und löschen, was er als
   *  Grabstein meldet. */
  const dateienRunter = async () => {
    let marke = Store.getMeta('wolkeMarkeDateien', '');
    const oben = new Set<string>(Store.getMeta('wolkeDateienOben', []) || []);
    /* Was hier zum Löschen vorgemerkt ist, wird nicht wiederbelebt —
       auch dann nicht, wenn der Versand eben gescheitert ist. */
    const wegOffen = new Set<string>(Store.getMeta('wolkeDateienWeg', []) || []);
    let geholt = 0, entfernt = 0, unlesbar = 0;
    for (let runde = 0; runde < 20; runde++) {
      const a = await ruf('/datei/stand', { m: 'POST',
        k: { bereich: bereich(), seit: marke, grenze: 200 } });
      for (const d of (a.dateien || [])) {
        if (wegOffen.has(d.id)) continue;
        const lokal = await Store.dateiHolen(d.id);
        if (d.geloescht) {
          if (lokal) {
            for (const st of await Store.stueckeVon(d.id)) await Store.stueckWeg(st.id);
            await Store.dateiWeg(d.id);
            entfernt++;
          }
          oben.delete(d.id);
          continue;
        }
        if (lokal) { if (lokal.zustand === 'fertig') oben.add(d.id); continue; }

        /* Stück für Stück holen; eine Datei, die nicht ganz ankommt oder
           sich nicht entschlüsseln lässt, wird NICHT halb angelegt. */
        const teile = Math.max(1, Number(d.teile) || 1);
        let ganz = true;
        for (let nr = 0; nr < teile; nr++) {
          const r = await ruf('/datei/runter', { m: 'POST',
            k: { bereich: bereich(), dateiId: d.id, nr } });
          const roh = Bytes.fromBase64(String(r.base64 || ''));
          const bytes = d.verschluesselt ? await entschluesseleBytes(roh) : roh;
          if (!bytes) { ganz = false; unlesbar++; break; }
          await Store.stueckPut({ id: d.id + ':' + nr, dateiId: d.id, nr,
            blob: new Blob([bytes as any], { type: String(d.typ || '') }) });
        }
        if (!ganz) {
          for (const st of await Store.stueckeVon(d.id)) await Store.stueckWeg(st.id);
          continue;
        }
        /* Den Block wiederfinden, der auf die Datei zeigt — die Sätze sind
           vor den Anhängen abgeglichen, er ist also schon da, wenn es ihn
           gibt. Der Server kennt nur die Seite, nicht den Block. */
        const block = Object.values<any>(Store.cache.blocks)
          .find(b => b && b.dateiId === d.id);
        await Store.dateiPut({ id: d.id, name: String(d.name || ''),
          groesse: Number(d.groesse) || 0, typ: String(d.typ || ''),
          blockId: block ? block.id : null, teile, angekommen: teile,
          zustand: 'fertig', angelegt: Store.now(), fertigAm: Store.now() });
        oben.add(d.id);
        geholt++;
      }
      if (a.marke && String(a.marke) !== marke) {
        marke = String(a.marke);
        Store.setMeta('wolkeMarkeDateien', marke);
      }
      if (!a.mehr) break;
    }
    Store.setMeta('wolkeDateienOben', [...oben]);
    return { dateienGeholt: geholt, dateienEntfernt: entfernt, dateienUnlesbar: unlesbar };
  };

  /** Schicken, was hier fertig liegt und dem Server noch fehlt. */
  const dateienHoch = async () => {
    const oben = new Set<string>(Store.getMeta('wolkeDateienOben', []) || []);
    const alle = await Store.dateiAlle();
    let rauf = 0;
    for (const d of alle) {
      if (!d || d.zustand !== 'fertig' || oben.has(d.id)) continue;
      /* Abgeleitetes wandert nicht zum Server (E103): es ist in Sekunden
         neu gerechnet und kostet als Base64 ein Drittel mehr Leitung. */
      if (d.abgeleitet) continue;
      /* Über der Server-Grenze: gar nicht erst anklopfen. Für solche Dateien
         gilt der .redion-Weg — steht so in E33. */
      if ((Number(d.groesse) || 0) > SERVER_DATEI_MAX) continue;
      const stuecke = (await Store.stueckeVon(d.id))
        .sort((x: any, y: any) => (Number(x.nr) || 0) - (Number(y.nr) || 0));
      if (!stuecke.length) continue;
      await ruf('/datei/melden', { m: 'POST', k: { bereich: bereich(), datei: {
        id: d.id, name: d.name, groesse: d.groesse, typ: d.typ,
        seite: seiteFuerDatei(d), teile: stuecke.length,
        verschluesselt: hatSchluessel() ? 1 : 0 } } });
      for (const st of stuecke) {
        const bytes = new Uint8Array(await st.blob.arrayBuffer());
        const raus = hatSchluessel() ? await verschluesseleBytes(bytes) : bytes;
        await ruf('/datei/stueck', { m: 'POST', k: { bereich: bereich(),
          dateiId: d.id, nr: Number(st.nr) || 0, base64: Bytes.toBase64(raus) } });
      }
      oben.add(d.id);
      Store.setMeta('wolkeDateienOben', [...oben]);
      rauf++;
    }
    return { dateienRauf: rauf };
  };

  /** Beide Richtungen für Anhänge — nach den Sätzen, nie statt ihrer.
   *  Zuerst die Grabsteine (E249): wer erst holt, belebt das eben
   *  Gelöschte wieder, bevor der Server je davon erfuhr. */
  const dateienAbgleichen = async () => {
    if (dateienGehenNicht) return null;
    try {
      const w = await dateienWeg();
      const r = await dateienRunter();
      const h = await dateienHoch();
      zustand.fehlerDateien = '';
      return { ...w, ...r, ...h };
    } catch (e) {
      const satz = e instanceof Error ? e.message : String(e);
      if (/Dateispeicher/.test(satz)) { dateienGehenNicht = true; return null; }
      zustand.fehlerDateien = satz;
      melden();
      return null;
    }
  };

  /* ========================================================================
   * 7 · TEILEN UND VERÖFFENTLICHEN
   * ======================================================================*/
  const geteiltSetzen = (seiteId: string, an: any) => {
    const liste = Store.getMeta('wolkeGeteilt', []) || [];
    const neu = an ? [...new Set([...liste, seiteId])] : liste.filter((x: any) => x !== seiteId);
    Store.setMeta('wolkeGeteilt', neu);
    /* Damit die Seite beim nächsten Abgleich im Klartext hochgeht */
    Store.setMeta('wolkeMarkeHoch', '');
  };

  const freigeben = (seiteId: string, kontoMail: any, rolle: any) =>
    ruf('/freigabe', { m: 'POST',
      k: { bereich: bereich(), seite: seiteId, konto: kontoMail, rolle } });

  const freigaben = () => ruf('/freigabe?bereich=' + encodeURIComponent(bereich()));

  const veroeffentlichen = async (seiteId: string, opt: { passwort?: string; tage?: number } = {}) => {
    const seite = Store.getBlock(seiteId);
    if (!seite) throw new Error('Diese Seite gibt es nicht.');
    /* Der Inhalt wird hier gebaut — die App weiss am besten, wie ihre
       Blöcke aussehen. Der Server nimmt nur, was harmlos ist. */
    const html = typeof Werkzeuge !== 'undefined' && Werkzeuge.seiteAlsHtml
      ? Werkzeuge.seiteAlsHtml(seite)
      : '<p>' + String(seite.text || '') + '</p>';
    const a = await ruf('/veroeffentlichen', { m: 'POST',
      k: { bereich: bereich(), seite: seiteId, titel: seite.text || 'Ohne Titel',
           inhalt: html, passwort: opt.passwort || '', tage: opt.tage || 0 } });
    if (typeof Protokoll !== 'undefined')
      Protokoll.notieren('freigabe', 'Seite veröffentlicht: ' + (seite.text || ''),
        { seite: seiteId, wie: a.adresse });
    return a;
  };

  const zurueckziehen = (seiteId: string) =>
    ruf('/veroeffentlichen', { m: 'DELETE', k: { bereich: bereich(), seite: seiteId } });

  /* ========================================================================
   * 8 · MARKEN
   * ======================================================================*/
  const markeAnlegen = (name: string, rechte: any, tage: any) =>
    ruf('/marken', { m: 'POST', k: { name, bereich: bereich(), rechte, tage } });
  const markenListe = () => ruf('/marken');
  const markeWeg = (kennung: any) => ruf('/marken/' + kennung, { m: 'DELETE' });

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
           abgleichErlaubt, abgleichSetzen, kontoLoeschen,
           schluesselSetzen, hatSchluessel, verschluessele, entschluessele,
           hoch, runter, abgleichen, dateienAbgleichen, takt, zuSchicken, seiteVon,
           geteiltSetzen, istGeteilt, freigeben, freigaben,
           veroeffentlichen, zurueckziehen,
           markeAnlegen, markenListe, markeWeg, ruf, start };
})();

(window as any).Wolke = Wolke;
