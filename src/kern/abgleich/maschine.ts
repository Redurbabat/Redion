/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/kern/abgleich/maschine.ts (npm run bauen:ts). */
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
  /* Native Windows-App: redion-local:// ist ein lokaler Dokumentursprung,
     aber KEIN Sync-Server. Erlaubt ist nur eine echte HTTPS-Serveradresse.
     HTTP bleibt ausschliesslich für lokale Browser-Entwicklung (localhost).
     Keine Zugangsdaten/Fragmente/Pfade in einer Adresse, an die später ein
     Bearer-Token geschickt wird. */
  const serverAdressePruefen = (wert: any): string => {
    const roh = String(wert ?? '').trim();
    if (!roh) return '';
    try {
      const u = new URL(roh);
      const lokal = u.protocol === 'http:' && location.protocol === 'http:' &&
        /^(localhost|127\.0\.0\.1|\[::1\])$/i.test(u.hostname);
      if (u.protocol !== 'https:' && !lokal) return '';
      if (u.username || u.password || u.search || u.hash || u.pathname !== '/') return '';
      return u.origin;
    } catch { return ''; }
  };

  const adresse = () => {
    const eigen = Store.getMeta('wolkeAdresse', '');
    if (eigen) return serverAdressePruefen(eigen);
    /* Im Browser ist derselbe Ursprung auch der Server. Eine installierte
       Windows-App benötigt eine ausdrücklich gesetzte HTTPS-Adresse. */
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
      'Kein sicherer Redion-Server eingerichtet. In „Wolke“ eine gültige HTTPS-Serveradresse eintragen.');

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
    /* Nur ein Satz, der die Probe bestanden hat, wird gemerkt (E799). */
    void desktopSchluessel()?.schluesselMerken?.(String(satz)).catch(() => {});
    return true;
  };

  /* DER GEMERKTE SCHLÜSSEL DER WINDOWS-APP (E799, Redur am 21. November 2026:
     „Ja, merken"). Ohne ihn stand der Abgleich nach jedem Neustart still,
     bis jemand den Satz wieder eintippte — und Seiten von ChatGPT kamen nie
     „von selbst". Die Windows-App legt den Satz mit `safeStorage` (DPAPI)
     ab: lesbar nur für dieses Windows-Konto auf diesem Rechner, nie im
     Browser, nie in IndexedDB, nie in einer Sicherung. Im Browser gibt es
     die Brücke nicht — dort bleibt alles wie in E797. */
  const desktopSchluessel = (): any => {
    const d = (globalThis as any).RedionDesktop;
    return d && typeof d.schluesselHolen === 'function' ? d : null;
  };
  const gemerktenSchluesselSetzen = async (): Promise<boolean> => {
    const d = desktopSchluessel();
    if (!d || schluessel || !Store.getMeta('wolkeProbe', '')) return false;
    let satz: unknown = null;
    try { satz = await d.schluesselHolen(); } catch { return false; }
    if (typeof satz !== 'string' || !satz) return false;
    const ok = await schluesselSetzen(satz);
    /* Passt er nicht mehr (anderer Satz auf einem anderen Gerät gewählt),
       wird er vergessen statt bei jedem Start erneut probiert. */
    if (!ok) { try { await d.schluesselVergessen(); } catch {} }
    else melden();
    return ok;
  };

  const hatSchluessel = () => !!schluessel;

  /* DER SCHLÜSSEL, DER NACH EINEM NEUSTART FEHLT (E797). Der Schlüssel lebt
     absichtlich nur im Arbeitsspeicher. Am 19. November 2026 lud die Windows-
     App mitten im ersten Abgleich neu; der Schlüssel war weg, der Abgleich
     blieb eingeschaltet — und der Takt schickte 4 646 private Sätze im
     Klartext. Die Probe `wolkeProbe` sagt, dass auf diesem Gerät einmal ein
     Schlüssel gesetzt wurde. Steht sie da und fehlt der Schlüssel, verlässt
     NICHTS das Gerät — weder Sätze noch Grabsteine noch Anhänge —, bis er
     wieder eingegeben ist. Wer nie einen gesetzt hat, gleicht weiter so ab,
     wie er es ausdrücklich gewählt hat (E796). */
  const schluesselFehlt = () => !!Store.getMeta('wolkeProbe', '') && !schluessel;
  const SCHLUESSEL_FEHLT = 'Der Schlüssel fehlt — nach einem Neustart im Wolke-Fenster ' +
    '„Schlüssel setzen“. Bis dahin verlässt nichts dieses Gerät.';
  const wacheSchluessel = () => { if (schluesselFehlt()) throw new Error(SCHLUESSEL_FEHLT); };

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
    /* Sätze über EINZEL_MAX, die auf dem Gerät geblieben sind (E796). */
    zuGrossLokal?: number;
    /* Wartet eine Entscheidung aus L76? Der Punkt oben rechts zeigte sonst
       „Letzter Abgleich 14:03" und damit einen Stand, den es nicht mehr
       gibt — der Abgleich steht ja. */
    frage?: boolean;
  };
  const zustand: Zustand = { angemeldet: false, laeuft: false, letzter: '', fehler: '',
                    hoch: 0, runter: 0, konto: null, rolle: '' };
  const horcher = new Set<(z: Zustand) => void>();
  const melden = () => {
    /* Vor dem Melden nachsehen: die Frage wird in `Store.importAll`
       gesetzt, also ausserhalb dieses Moduls (§5 — die Ablage lädt vor der
       Abgleichmaschine und kennt sie nicht). Wer sie hier nicht abliest,
       meldet einen Stand von vorhin. */
    zustand.frage = neuAbgleichOffen();
    horcher.forEach((fn: any) => { try { fn(zustand); } catch {} });
  };
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
  /** Auf der Website selbst: Cloudflare Access hat den Menschen schon geprüft,
   *  der Server macht daraus eine Redion-Sitzung (E795). Nur, wenn diese Seite
   *  ihr eigener Server ist — eine App mit fremder Adresse hat kein Access. */
  const accessMoeglich = () =>
    location.protocol === 'https:' && adresse() === location.origin;
  const anmeldenMitAccess = async () => {
    if (!accessMoeglich()) throw new Error('Die Access-Anmeldung geht nur auf der Redion-Website selbst.');
    const a = await fetch(location.origin + '/konto/access', {
      method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    let b: any = null;
    try { b = await a.json(); } catch { /* unten gemeldet */ }
    if (!a.ok || !b || typeof b.token !== 'string')
      throw new Error((b && b.message) || 'Die Anmeldung über Cloudflare Access hat nicht geklappt.');
    return tokenUebernehmen(b.token);
  };

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
    /* Abmelden vergisst auch den gemerkten Satz (E799). */
    try { await desktopSchluessel()?.schluesselVergessen?.(); } catch {}
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
    Store.setMeta('wolkeBloeckeWeg', []);
    /* Das Ja zum Abgleich gehörte zu DIESEM Konto — das nächste wird neu
       gefragt. Und die offene Frage aus L76 genauso: sie ist die Frage,
       was mit DIESEM Konto in der Wolke geschehen soll. Bliebe sie
       stehen, fände das nächste Konto beim Anmelden eine Entscheidung
       vor, die es gar nicht betrifft — und käme an keinen Abgleich, ohne
       zu verstehen warum. */
    Store.setMeta('wolkeAbgleich', null);
    Store.setMeta('wolkeNeuAbgleich', '');
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
  /**
   * DAS DAZUGELEGTE KOMMT MIT, SO ALT ES AUCH IST (L100, E314).
   *
   * Der Filter `edited <= marke` ist richtig für alles, was auf diesem
   * Gerät entstanden ist: was älter ist als der letzte Versand, wurde schon
   * geschickt. Für eine EINGESPIELTE Sicherung stimmt er nicht — deren
   * Sätze sind alt, aber hier neu.
   *
   * `importAll` merkt sie deshalb beim Zusammenführen vor. Ist die
   * Sicherung sehr gross, steht statt der Liste eine Marke: dann ist ein
   * Vollabgleich ohnehin billiger als ein Verzeichnis mit
   * hunderttausend Einträgen.
   */
  const nachtrag = (): { alles: boolean; ids: Set<string> } => {
    if (Store.getMeta('wolkeNachtragAlles', false) === true)
      return { alles: true, ids: new Set<string>() };
    const w = Store.getMeta('wolkeNachtrag', []);
    return { alles: false, ids: new Set<string>(Array.isArray(w) ? w.map(String) : []) };
  };

  const zuSchicken = () => {
    const marke = Store.getMeta('wolkeMarkeHoch', '');
    const nach = nachtrag();
    /** Nimmt die Marke ihn schon mit — oder ist er nachgetragen? */
    const dran = (id: string, zeit: string): boolean =>
      zeit > marke || nach.alles || nach.ids.has(String(id));
    const raus: any[] = [];
    Object.values<any>(Store.cache.blocks).forEach(b => {
      if (!dran(b.id, String(b.edited || b.created || ''))) return;
      raus.push({ id: b.id, tabelle: 'blocks', satz: b,
                  seite: seiteVon(b), geloescht: b.alive === false });
    });
    Object.values<any>(Store.cache.collections).forEach(c => {
      if (!dran(c.id, String(c.edited || c.created || ''))) return;
      raus.push({ id: c.id, tabelle: 'collections', satz: c, seite: c.id, geloescht: false });
    });
    Object.values<any>(Store.cache.views).forEach(v => {
      if (!dran(v.id, String(v.edited || v.created || ''))) return;
      raus.push({ id: v.id, tabelle: 'views', satz: v, seite: v.collectionId, geloescht: false });
    });
    return raus;
  };

  /**
   * Was angekommen ist, muss nicht mehr nachgetragen werden.
   *
   * Ohne dieses Streichen bliebe die Liste für immer stehen, und JEDER
   * spätere Abgleich schickte dieselben Sätze noch einmal — eine Anzeige,
   * die immer anzeigt, nur als Netzverkehr.
   */
  const nachtragStreichen = (ids: string[]): void => {
    const w = Store.getMeta('wolkeNachtrag', []);
    if (!Array.isArray(w) || !w.length) return;
    const weg = new Set(ids.map(String));
    const rest = w.filter((x: any) => !weg.has(String(x)));
    if (rest.length !== w.length) Store.setMeta('wolkeNachtrag', rest);
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

  /* UND EINE BYTEGRENZE (E796). Dreihundert Sätze sind bei Textnotizen ein paar
     hundert Kilobyte — bei Seiten mit eingebetteten Bildern oder PDF-Text
     schnell weit mehr, als ein Aufruf verträgt. Am 18. November 2026 brach der
     erste echte Abgleich (1,1 GB, 11 000 Blöcke) nach dem ersten Paket mit
     „Server nicht erreichbar“ ab. Der Server nimmt für /sync 16 MB; ein Paket
     bleibt deutlich darunter. Ein einzelner Satz über EINZEL_MAX geht gar nicht
     hinaus — er bleibt auf dem Gerät und wird gezählt, statt jeden Abgleich
     abreissen zu lassen. */
  const PAKET_BYTES = 4 * 1024 * 1024;
  const EINZEL_MAX = 12 * 1024 * 1024;
  /** Welche Sätze zu gross waren — je Sitzung, nicht je Runde gezählt. */
  const zuGrossIds = new Set<string>();

  /**
   * Alles Wartende hochschicken — in Runden, bis nichts mehr da ist.
   *
   * Das war zuerst ein Abschneiden bei 400 Sätzen, und weil die Liste in
   * der Reihenfolge der Anlage kam, blieb ausgerechnet das Neueste liegen.
   * Ein Abgleich, der still die Hälfte weglässt, ist schlimmer als keiner:
   * man merkt es erst am anderen Gerät, und dann sucht man beim Falschen.
   */
  const hoch = async () => {
    wacheSchluessel();
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
        const offen = istGeteilt(e.seite) || istGeteilt(String(e.id));
        paket.push({
          id: e.id, tabelle: e.tabelle, seite: e.seite,
          daten: (offen || !hatSchluessel()) ? klar : await verschluessele(klar),
          verschluesselt: !offen && hatSchluessel(),
          version: Number(e.satz.wolkeVersion || 1),
          geaendert: e.satz.edited || e.satz.created || Store.now(),
          geloescht: e.geloescht
        });
      }

      /* Nach Bytes schneiden. Der erste Satz geht immer mit (sonst stünde die
         Schleife), ausser er ist allein schon zu gross. */
      const gesendet: any[] = [], gesendetDran: any[] = [], zuGross: string[] = [];
      let bytes = 0, schnitt = paket.length;
      for (let i = 0; i < paket.length; i++) {
        const p = paket[i], e = dran[i];
        if (!p || !e) continue;
        const g = String(p.daten).length + 400;
        if (g > EINZEL_MAX) { zuGross.push(String(p.id)); continue; }
        if (gesendet.length && bytes + g > PAKET_BYTES) { schnitt = i; break; }
        bytes += g; gesendet.push(p); gesendetDran.push(e);
      }
      if (zuGross.length) {
        /* Eindeutig zählen, und aus dem Nachtrag streichen — sonst kehrte der
           Riese in jeder Runde zurück und hielte die Liste für immer offen. */
        for (const id of zuGross) zuGrossIds.add(id);
        zustand.zuGrossLokal = zuGrossIds.size;
        nachtragStreichen(zuGross);
        if (typeof Protokoll !== 'undefined')
          Protokoll.notieren('wolke', zuGross.length + ' Satz/Sätze zu gross für die Wolke — bleiben auf diesem Gerät');
      }
      /* Was hinter dem Schnitt liegt, aber in DERSELBEN Millisekunde wie der
         letzte gesendete Satz, fiele hinter die Marke — es kommt auf die
         Nachtrag-Liste (L100/E314), die unabhängig von der Marke mitnimmt. */
      const letzteZeit = String((gesendet[gesendet.length - 1] ?? paket[paket.length - 1])?.geaendert ?? '');
      const nachtragen = dran.slice(schnitt)
        .filter(e => zeitVon(e) <= letzteZeit && !zuGross.includes(String(e.id)))
        .map(e => String(e.id));
      if (nachtragen.length) Store.metaListeAendern('wolkeNachtrag', (alt: any[]) =>
        [...new Set([...(Array.isArray(alt) ? alt.map(String) : []), ...nachtragen])]);

      if (!gesendet.length) {
        /* Nur Übergrosses in dieser Runde: Marke weiter, nichts schicken. */
        if (letzteZeit) Store.setMeta('wolkeMarkeHoch', letzteZeit);
        if (liste.length <= dran.length) break;
        continue;
      }
      const a = await ruf('/sync/hoch', { m: 'POST', k: { bereich: bereich(), saetze: gesendet } });
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
      for (const e of gesendetDran) if (!nein.has(e.id)) await Store.basisPut(e.id, e.satz);
      if (Array.isArray(a.angepasst) && a.angepasst.length) angepasst.push(...a.angepasst);

      /* Die Marke wandert bis zum letzten Satz dieser Runde — nicht auf
         „jetzt", sonst fielen alle Änderungen dazwischen unter den Tisch. */
      const letzte = gesendet[gesendet.length - 1];
      Store.setMeta('wolkeMarkeHoch', letzte ? letzte.geaendert : Store.now());
      /* Und die Nachgetragenen dieser Runde von der Liste streichen — sonst
         reisen sie bei jedem Abgleich wieder mit (L100, E314). */
      nachtragStreichen(gesendetDran.filter(e => !nein.has(e.id)).map(e => String(e.id)));

      /* Geschnitten? Dann gibt es sicher noch etwas — die nächste Runde holt es. */
      if (schnitt === paket.length && liste.length <= dran.length) break;
    }

    /* --- DIE MERKLISTE AUFRÄUMEN (L100, E314) --------------------------
       Die Schleife ist durch: was zu schicken war, ist geschickt. Zwei
       Dinge bleiben sonst für immer stehen und lassen jeden weiteren
       Abgleich dasselbe noch einmal senden —

         · die Marke „alles nachtragen" (bei einer sehr grossen Sicherung
           steht sie statt einer Liste),
         · und Kennungen, zu denen es gar keinen Satz mehr gibt: gelöscht,
           ersetzt, oder aus einer Sicherung, deren Sätze beim nächsten
           Ersetzen wieder verschwunden sind.

       Beides wird hier gestrichen. Was der Server abgelehnt hat, bleibt
       auf der Liste — es soll ja noch hin. */
    if (Store.getMeta('wolkeNachtragAlles', false) === true)
      Store.setMeta('wolkeNachtragAlles', false);
    const rest = Store.getMeta('wolkeNachtrag', []);
    if (Array.isArray(rest) && rest.length) {
      const lebt = rest.filter((id: any) => {
        const k = String(id);
        return !!(Store.cache.blocks[k] || Store.cache.collections[k] ||
                  Store.cache.views[k]);
      });
      if (lebt.length !== rest.length) Store.setMeta('wolkeNachtrag', lebt);
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

  /** Melden, welche SÄTZE hier endgültig gelöscht wurden (E254/L73 Teil 2).
   *  Das Gegenstück zu `dateienWeg`: die Merkliste `wolkeBloeckeWeg` hält
   *  versandfertige Grabsteine aus `purgeTief` — Sätze, die `zuSchicken`
   *  nie mehr sieht, weil sie den Zwischenspeicher schon verlassen haben.
   *
   *  Läuft VOR dem Holen: wer erst holt, belebt das eben Gelöschte wieder
   *  (dieselbe Reihenfolge-Lehre wie bei den Dateien).
   *
   *  Die basis-Wache steht HIER und nicht am Schreibpunkt: `basisHolen`
   *  ist asynchron, der Purge synchron. Kein gemeinsamer Stand heisst,
   *  der Server hat den Satz nie gesehen — offline Angelegtes-und-
   *  Gelöschtes wird still ausgetragen statt gemeldet. */
  const bloeckeWeg = async () => {
    wacheSchluessel();
    const offen: any[] = Store.getMeta('wolkeBloeckeWeg', []) || [];
    if (!offen.length) return { bloeckeWeggemeldet: 0 };
    let gemeldet = 0;
    const dran: any[] = [];
    for (const e of offen) {
      if (!e || !e.id || !e.satz) { if (e && e.id) Store.blockGrabsteinWeg(e.id); continue; }
      const basis = await Store.basisHolen(e.id);
      if (!basis) { Store.blockGrabsteinWeg(e.id); continue; }
      dran.push(e);
    }
    for (let von = 0; von < dran.length; von += RUNDE) {
      const teil = dran.slice(von, von + RUNDE);
      const paket = [];
      for (const e of teil) {
        const klar = JSON.stringify(e.satz);
        const geteilt = istGeteilt(e.seite) || istGeteilt(String(e.id));
        paket.push({
          id: e.id, tabelle: e.tabelle || 'blocks', seite: e.seite,
          daten: (geteilt || !hatSchluessel()) ? klar : await verschluessele(klar),
          verschluesselt: !geteilt && hatSchluessel(),
          version: Number(e.satz.wolkeVersion || 1),
          geaendert: e.satz.edited || e.satz.created || Store.now(),
          geloescht: true
        });
      }
      const a = await ruf('/sync/hoch', { m: 'POST', k: { bereich: bereich(), saetze: paket } });
      const gruende = new Map<string, string>();
      for (const x of [...(a.abgelehnt || []), ...(a.angepasst || [])]) {
        if (x && x.id) gruende.set(x.id, String(x.grund || 'angepasst'));
        else if (typeof x === 'string') gruende.set(x, '');
      }
      for (const e of teil) {
        if (gruende.has(e.id)) {
          /* Abgelehnt wird nicht wiederholt — der Takt käme alle zwei
             Minuten mit derselben Antwort. „veraltet" heisst: drüben ist
             neuer, der fremde Stand kommt beim Holen zurück (bestehende
             Konfliktregel, kein neues Loch). Fehlendes Schreibrecht steht
             im Protokoll — Rechte entscheiden final (§26). */
          Store.blockGrabsteinWeg(e.id);
          if (/Schreibrecht/.test(gruende.get(e.id) || '') && typeof Protokoll !== 'undefined')
            Protokoll.notieren('konto', 'Ein gelöschter Block bleibt auf dem Server: ' +
              'kein Schreibrecht auf seiner Seite (' + e.id + ').');
          continue;
        }
        Store.blockGrabsteinWeg(e.id);
        /* Jetzt darf auch das Gedächtnis weg — der gemeinsame Stand IST
           die Löschung. */
        await Store.basisWeg(e.id);
        gemeldet++;
      }
    }
    zustand.hoch += gemeldet;
    return { bloeckeWeggemeldet: gemeldet };
  };

  const runterEinmal = async () => {
    const a = await ruf('/sync/runter', { m: 'POST',
      k: { bereich: bereich(), seit: Store.getMeta('wolkeMarkeRunter', '') } });
    zustand.rolle = a.rolle || '';

    /* Was hier zum Löschen vorgemerkt ist, wird nicht wiederbelebt — auch
       dann nicht, wenn der Versand eben gescheitert ist (E254, dasselbe
       Muster wie `wegOffen` bei den Dateien). */
    const wegOffen = new Set<string>(
      (Store.getMeta('wolkeBloeckeWeg', []) || []).map((e: any) => e && e.id).filter(Boolean));

    let uebernommen = 0, unlesbar = 0, gemischt = 0, strittig = 0;
    /* Seiten, die im KLARTEXT ankommen, obwohl dieses Gerät verschlüsselt —
       das sind Seiten, die eine KI über den Cloud-Link angelegt hat, oder
       die ein anderes Gerät für KI lesbar gemacht hat. Sie bleiben lesbar:
       sonst ginge die erste Änderung hier verschlüsselt zurück, und ChatGPT
       verlöre die Seite, die es eben geschrieben hat (Redur, 21. November
       2026). Bewusst NICHT über `geteiltSetzen`: das setzt die Marke zurück
       und schickte den ganzen Bestand noch einmal. */
    const klarSeiten: string[] = [];
    for (const s of a.saetze) {
      if (wegOffen.has(s.id)) continue;
      let klar = s.daten;
      if (s.verschluesselt) {
        klar = await entschluessele(s.daten);
        if (klar === null) { unlesbar++; continue; }
      }
      let satz;
      try { satz = JSON.parse(klar); } catch { continue; }
      satz.wolkeVersion = s.version;
      /* Die Seite, unter der `zuSchicken` den Satz später verschickt: eine
         Seite selbst, die Sammlung für Sammlung und Ansicht, und eine
         Datenbankzeile für sich (seiteVon gibt bei ihr die eigene Kennung). */
      if (!s.verschluesselt && !s.geloescht && hatSchluessel() && satz) {
        if (s.tabelle === 'collections') klarSeiten.push(String(s.id));
        else if (s.tabelle === 'views' && satz.collectionId) klarSeiten.push(String(satz.collectionId));
        /* JEDER Block, nicht nur Seiten (21. November 2026): kam ein Block
           an, bevor die App seine Seite kannte, gehörte er zu keiner
           geteilten Seite — und ging verschlüsselt zurück. Was im Klartext
           kam, bleibt Klartext, über seine eigene Kennung. */
        else if (s.tabelle === 'blocks') klarSeiten.push(String(s.id));
      }

      const hier = s.tabelle === 'blocks' ? Store.cache.blocks[s.id]
                 : s.tabelle === 'collections' ? Store.cache.collections[s.id]
                 : Store.cache.views[s.id];

      /* Nichts hier? Dann ist es einfach neu — AUSSER es ist ein
         Grabstein (E254). Der eigene käme sonst als Papierkorbleiche
         zurück (Echo, dessen Frist-Purge den nächsten Grabstein schriebe),
         und fremde legten Leichen für nie Gehabtes an. Stellt drüben
         jemand wieder her, kommt der Satz mit geloescht:false und wird
         normal angelegt. */
      if (!hier) {
        if (s.geloescht) { await Store.basisWeg(s.id); continue; }
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

    if (klarSeiten.length) {
      const liste: string[] = Store.getMeta('wolkeGeteilt', []) || [];
      const fehlt = klarSeiten.filter(id => !liste.includes(id));
      if (fehlt.length) Store.setMeta('wolkeGeteilt', [...liste, ...fehlt]);
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
   * DIE OFFENE FRAGE NACH EINEM EINGESPIELTEN ERSETZEN (L76 / E279)
   * ------------------------------------------------------------------------
   * `Store.importAll(…, 'ersetzen')` setzt `wolkeNeuAbgleich`, wenn dieses
   * Gerät angemeldet ist. Dann stehen zwei Bestände nebeneinander — der
   * eben eingespielte hier und der, den die Wolke noch hat — und Redion
   * entscheidet NICHT, welcher gewinnt.
   *
   * Solange die Frage steht, geht nichts hinaus und nichts kommt herein.
   * Das ist keine dritte Meinung, sondern das Anhalten: beide Richtungen
   * können Arbeit kosten, also wartet der Abgleich auf einen Menschen.
   *
   * Die Frage steht VOR `wolkeAbgleich` und nicht darin — dessen
   * Rückfallweg unten liest die Marken, und die sind nach dem Einspielen
   * leer. Wer die Frage über `wolkeAbgleich` abbilden wollte, hätte damit
   * schon „nur lokal" gewählt.
   */
  const neuAbgleichOffen = () => !!Store.getMeta('wolkeNeuAbgleich', '');

  /**
   * Die Antwort. Zwei Wege, beide gleichwertig, keiner die Vorgabe.
   *
   *   'lokal'  Der eingespielte Bestand bleibt auf diesem Gerät. Die Wolke
   *            behält, was sie hat. Nichts wird überschrieben.
   *   'wolke'  Beide Seiten werden vollständig zusammengeführt. Die Marken
   *            sind leer und die Basis auch, also sieht der Abgleich alles
   *            auf beiden Seiten; Kollisionen laufen über die bestehende
   *            Konfliktanzeige.
   *
   * Alles andere ist ein Fehler und keine stille Vorgabe: wer hier raten
   * müsste, träfe genau die Entscheidung, die niemand treffen soll.
   */
  const neuAbgleichAntwort = async (wahl: string) => {
    if (wahl !== 'lokal' && wahl !== 'wolke')
      throw new Error('Nach dem Einspielen muss feststehen, was geschehen ' +
                      'soll: „lokal" behält den Bestand auf diesem Gerät, ' +
                      '„wolke" gleicht beide Seiten vollständig ab. Ohne ' +
                      'Angabe wird nichts getan.');
    Store.setMeta('wolkeNeuAbgleich', '');
    Store.setMeta('wolkeAbgleich', wahl === 'wolke');
    melden();
    if (typeof Protokoll !== 'undefined')
      Protokoll.notieren('konto', wahl === 'wolke'
        ? 'Nach dem Einspielen: vollständig mit der Wolke abgleichen'
        : 'Nach dem Einspielen: nur lokal weiterarbeiten');
    if (wahl === 'lokal') return null;
    return abgleichen();
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
    /* Steht die Frage aus L76, ist die Antwort nein — und zwar bevor
       irgendein Altwert gelesen wird. Ein `wolkeAbgleich: true` von vor
       dem Einspielen galt für einen Bestand, den es nicht mehr gibt. */
    if (neuAbgleichOffen()) return false;
    const v = Store.getMeta('wolkeAbgleich', null);
    if (v !== null) return !!v;
    return !!(Store.getMeta('wolkeMarkeHoch', '') || Store.getMeta('wolkeMarkeRunter', ''));
  };
  const abgleichSetzen = (an: boolean) => { Store.setMeta('wolkeAbgleich', !!an); melden(); };

  /** Beide Richtungen. Läuft nie zweimal gleichzeitig. */
  const abgleichen = async () => {
    if (!angemeldet() || !bereich() || zustand.laeuft || !abgleichErlaubt()) return null;
    /* Vor allem anderen: ohne den einmal gesetzten Schlüssel gar nicht erst
       anfangen — auch das Holen nicht, denn es legt den Stand fest, gegen den
       danach hochgeladen würde. */
    if (schluesselFehlt()) { zustand.fehler = SCHLUESSEL_FEHLT; melden(); return null; }
    zustand.laeuft = true; zustand.fehler = ''; melden();
    try {
      /* Grabsteine VOR dem Holen (E254) — wer erst holt, belebt das eben
         Gelöschte wieder. Scheitert der Versand am Netz, bleibt die
         Merkliste liegen und die Wache in `runterEinmal` hält solange;
         der Takt selbst darf weiterlaufen. */
      let w: any = null;
      try { w = await bloeckeWeg(); }
      catch { /* nächster Takt versucht es wieder — beharrlich, nicht laut */ }
      const r = await runter();
      const h = await hoch();
      /* Erst die Sätze, dann die Bytes dazu — ein Blockverweis ohne Datei
         ist ein kurzer Zustand, eine Datei ohne Block ein verwaister. */
      const d = await dateienAbgleichen();
      zustand.letzter = Store.now();
      if (typeof Feldrechte !== 'undefined') { try { await Feldrechte.auffrischen(); } catch {} }
      if (r.strittig && typeof Zusammen !== 'undefined') { try { Zusammen.hinweisen(); } catch {} }
      return { ...r, ...h, ...(d || {}), ...(w || {}) };
    } catch (e) {
      zustand.fehler = e instanceof Error ? e.message : String(e);
      throw e;
    } finally {
      zustand.laeuft = false; melden();
    }
  };

  /* Von selbst in einem gewählten Takt — und wenn das Fenster wieder nach
     vorne kommt, denn dann hat womöglich das andere Gerät gearbeitet.

     DER TAKT STAND HIER ALS ZAHL, UND DIE EINSTELLUNG DANEBEN WAR TOT
     (E270). `Register.einstellungen` führt seit Langem `wolkeTakt` mit den
     Werten „nur von Hand / 2 Minuten / 10 Minuten" — gelesen hat sie
     niemand, hier standen 120000 fest. Wer „10 Minuten" wählte, bekam
     zwei; wer „nur von Hand" wählte, bekam trotzdem alle zwei Minuten
     einen Abgleich. Ein Schalter, der nichts tut, ist schlimmer als
     keiner (§47).

     DER RÜCKGABEWERT IST DIE GESTELLTE ZAHL, nicht void. Sonst lässt sich
     von aussen nicht messen, ob die Wahl ankam — und eine Prüfung, die
     nichts messen kann, ist keine (§55.2). */
  let uhr: any = null;
  const takt = (): number => {
    clearInterval(uhr);
    uhr = null;
    /* Das Live-Holen hängt am selben Takt-Schalter (unten). */
    liveStellen();
    if (!angemeldet()) return 0;
    const sek = Number(Store.getMeta('wolkeTakt', '120'));
    /* `0` heisst „nur beim Öffnen und von Hand" — der Weg über
       `visibilitychange` bleibt, denn er kostet nichts, solange niemand
       hinsieht, und ohne ihn liefen zwei Geräte lautlos auseinander. Wer
       gar nichts schicken will, schaltet den Abgleich aus (E1/E34); das
       ist die Frage, für die es diesen Schalter NICHT gibt. */
    if (!Number.isFinite(sek) || sek <= 0) return 0;
    const ms = sek * 1000;
    uhr = setInterval(() => { abgleichen().catch(() => {}); }, ms);
    return ms;
  };

  /* ------------------------------------------------------------------------
   * LIVE HOLEN — was eine KI oder ein anderes Gerät schreibt, erscheint
   * hier innerhalb weniger Sekunden (Redur, 21. November 2026: „wenn chat
   * gpt etwas erstelle das ich über windows app und ios app direk alles
   * sofort sehen kann ohne selber etwas mache").
   * ------------------------------------------------------------------------
   * Nur HOLEN, nur solange das Fenster sichtbar ist, und nur wenn nichts
   * anderes läuft. Ein Ruf auf /sync/runter mit der Marke liest über den
   * Index (bereich, geaendert) und liefert leer zurück, wenn nichts Neues
   * da ist — ein Ruf alle fünf Sekunden ist im Gratis-Tarif tragbar
   * (100 000 Rufe am Tag, gemessen am 21. November: ein Gerät, das zwölf
   * Stunden offen ist, braucht 8 640). Hochladen bleibt beim Takt: wer
   * tippt, soll nicht alle fünf Sekunden ein Paket verschicken.
   *
   * „Nur von Hand" (wolkeTakt 0) heisst auch hier: kein Live-Holen. */
  const LIVE_MS = 5000;
  let liveUhr: any = null;
  const liveHolen = async () => {
    if (document.hidden || !angemeldet() || !bereich() || zustand.laeuft || !abgleichErlaubt()) return 0;
    if (schluesselFehlt() || neuAbgleichOffen()) return 0;
    zustand.laeuft = true;
    try {
      const r = await runter();
      if (r.uebernommen) { zustand.letzter = Store.now(); melden(); }
      return r.uebernommen;
    } catch { return 0; }
    finally { zustand.laeuft = false; }
  };
  const liveStellen = () => {
    clearInterval(liveUhr);
    liveUhr = null;
    if (!angemeldet() || Number(Store.getMeta('wolkeTakt', '120')) <= 0) return 0;
    liveUhr = setInterval(() => { liveHolen().catch(() => {}); }, LIVE_MS);
    return LIVE_MS;
  };

  /**
   * Den Takt ändern und sofort neu stellen. Die Wertprüfung steckt im
   * Register — hier wird sie benutzt, nicht nachgebaut (§8).
   *
   * `-1` heisst: das Register hat den Wert NICHT genommen, und der alte
   * Takt läuft weiter. Das ist die richtige Antwort auf einen unmöglichen
   * Wert — den Abgleich anzuhalten wäre schlimmer als ihn zu behalten —
   * aber sie muss ablesbar sein. Ein `taktSetzen`, das bei einer
   * abgelehnten Zahl dieselbe Zahl zurückgibt wie bei einer genommenen,
   * behauptet einen Erfolg, den es nicht gab.
   */
  const taktSetzen = (wert: string | number): number => {
    const text = String(wert);
    const reg = (globalThis as any).Register;
    if (reg?.einstellungen?.setze) reg.einstellungen.setze('wolkeTakt', text);
    else Store.setMeta('wolkeTakt', text);
    if (String(Store.getMeta('wolkeTakt', '120')) !== text) return -1;
    return takt();
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
    wacheSchluessel();
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
  /* Die angemeldeten Geräte (E669). Dieselbe Bauart wie die Marken daneben:
     ein Weg zum Lesen, einer zum Zurückziehen. Was hier „kennung" heisst,
     ist ein Stück des Abdrucks — nie der Token (§42). */
  const geraeteListe = () => ruf('/konto/geraete');
  const geraetWeg = (kennung: any) =>
    ruf('/konto/geraete/weg', { m: 'POST', k: { kennung } });
  const markeWeg = (kennung: any) => ruf('/marken/' + kennung, { m: 'DELETE' });

  /* ========================================================================
   * 9 · START
   * ======================================================================*/
  const start = async () => {
    /* Ein Einspielen kann die Frage aus L76 stellen, und es geschieht
       ausserhalb dieses Moduls. Ohne dieses Anmelden zeigte der Punkt oben
       rechts bis zum nächsten Takt — also bis zu zwei Minuten lang —
       weiter „Letzter Abgleich 14:03", während der Abgleich längst stand.
       Der Horcher hängt VOR dem Token-Abbruch: die Frage gehört auch dann
       gemeldet, wenn dieses Gerät gerade nicht angemeldet ist. */
    if (typeof Store.on === 'function')
      Store.on((was: any) => { if (was === 'import') melden(); });
    if (!token()) return;
    zustand.konto = Store.getMeta('wolkeKonto', null);
    zustand.angemeldet = true;
    melden();
    /* Nicht sofort losrennen: erst soll die App stehen. */
    setTimeout(async () => {
      /* Erst den gemerkten Schlüssel (E799), dann abgleichen — sonst hielte
         die Sperre aus E797 den ersten Lauf an. */
      try { await gemerktenSchluesselSetzen(); } catch {}
      abgleichen().catch(() => {});
      takt();
    }, 3000);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && angemeldet()) abgleichen().catch(() => {});
    });
    /* Wird der Takt anderswo geändert — im Wolke-Fenster, über das
       Register —, gilt er sofort und nicht erst nach dem Neuladen. */
    const ev = (globalThis as any).Ereignisse;
    if (ev?.horche) ev.horche(ARTEN.einstellungGeaendert, (d: any) => {
      if (d && d.id === 'wolkeTakt') takt();
    });
  };

  return { adresse, serverAdressePruefen, token, bereich, angemeldet, geraeteName, zustand, beiAenderung,
           anmeldenMit, accessMoeglich, anmeldenMitAccess, codeHolen, codeWarten, codeFreigeben, tokenUebernehmen, abmelden,
           abgleichErlaubt, abgleichSetzen, kontoLoeschen,
           neuAbgleichOffen, neuAbgleichAntwort,
           schluesselSetzen, hatSchluessel, schluesselFehlt, verschluessele, entschluessele,
           hoch, runter, abgleichen, dateienAbgleichen, takt, taktSetzen, liveHolen, liveStellen, zuSchicken, seiteVon,
           geteiltSetzen, istGeteilt, freigeben, freigaben,
           veroeffentlichen, zurueckziehen,
           markeAnlegen, markenListe, markeWeg, geraeteListe, geraetWeg,
           ruf, start };
})();

(window as any).Wolke = Wolke;
