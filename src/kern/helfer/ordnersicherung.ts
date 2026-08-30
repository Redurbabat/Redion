/* ============================================================================
 * ordnersicherung.js — Die Sicherung schreibt sich selbst, in einen Ordner
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/kern/helfer/ordnersicherung.ts`. `npm run bauen:ts`
 * schreibt daraus `quell/kern/helfer/ordnersicherung.js`. Wer das .js
 * bearbeitet, verliert die Änderung beim nächsten Bauen; `test105.mts` meldet
 * es vorher.
 * ----------------------------------------------------------------------------
 * DER GRUND, WARUM ES DIESE DATEI GIBT
 *
 * Redur wollte seine Daten „auf iCloud". Ein Browser kann das nicht — Apple
 * gibt fremden Seiten keinen Schreibzugriff auf iCloud Drive, und das ist
 * keine Lücke in Redion, sondern eine Grenze der Plattform.
 *
 * Was ein Browser kann: in EINEN Ordner schreiben, den ein Mensch ihm einmal
 * gezeigt hat. Und wenn dieser Ordner `iCloudDrive\Redion` heisst, lädt
 * iCloud die Datei von sich aus hoch, und sie liegt auf iPhone und iPad in
 * „Dateien". Das ist nicht „Redion in iCloud", aber es ist das, was Redur
 * eigentlich wollte: die Sicherung liegt woanders als auf diesem einen
 * Rechner, ohne dass er daran denken muss.
 *
 * DIE DREI SÄTZE, DIE DIESE DATEI REGIEREN
 *
 * 1. Kein Ordner ohne ausdrückliche Zusage. Ein Schreibzugriff auf ein echtes
 *    Verzeichnis ist keine Einstellung, die man nebenbei umlegt.
 * 2. Erst schliessen, dann aufräumen. Gelöscht wird NIEMALS, bevor die neue
 *    Datei geschrieben UND geschlossen ist — und nur, was genau dem eigenen
 *    Namensmuster entspricht.
 * 3. Kein stiller Ausfall. Wenn die Erlaubnis weg ist oder das Schreiben
 *    scheitert, muss man das sehen können. Eine Sicherung, die aufgehört hat
 *    und nichts sagt, ist schlimmer als gar keine.
 *
 * WAS HIER STEHT
 *
 *     moeglich()        kann dieser Browser das überhaupt?
 *     an() / name()     ist ein Ordner gewählt, und wie hiess er?
 *     waehlen(zusagen)  Ordner wählen — nach ausdrücklicher Zusage
 *     loesen()          Ordner wieder vergessen (löscht nichts auf der Platte)
 *     standAbdruck()    hat sich seit der letzten Sicherung etwas geändert?
 *     jetztSichern()    einmal schreiben, jetzt
 *     zuLoeschen()      REINE Funktion: welche Dateien dürfen weg?
 *     start()           Zeitplan: alle fünf Minuten und beim Zurückkommen
 *     fehler()          was zuletzt schiefging (leer = nichts)
 * ==========================================================================*/

const OrdnerSicherung = (() => {

  /** Alle fünf Minuten nachsehen — nicht sichern, nur nachsehen. */
  const TAKT = 5 * 60 * 1000;

  /**
   * Der Name, den diese Datei schreibt — und das einzige Muster, das sie
   * jemals löscht.
   *
   * `redion-sicherung-2026-08-30-1412.redion`
   *
   * Die Uhrzeit gehört dazu, weil an einem Tag mehr als eine Sicherung
   * entstehen kann und die zweite die erste sonst überschriebe. Bis dahin ist
   * das nur unpraktisch; schlimm wird es, wenn die zweite scheitert, nachdem
   * die erste schon überschrieben war.
   */
  const MUSTER = /^redion-sicherung-(\d{4})-(\d{2})-(\d{2})-(\d{2})(\d{2})\.(redion|json)$/;

  /** Alles aus den letzten sieben Tagen bleibt liegen. */
  const BEHALTEN_TAGE = 7;

  let uhr: any = null;
  let laeuft = false;
  let gestartet = false;

  const meta = (name: string, standard: any): any => {
    if (typeof Store === 'undefined' || typeof Store.getMeta !== 'function') return standard;
    try { return Store.getMeta(name, standard); } catch { return standard; }
  };
  const setzen = (name: string, wert: any): void => {
    if (typeof Store === 'undefined' || typeof Store.setMeta !== 'function') return;
    try { Store.setMeta(name, wert); } catch { /* volle Ablage — nicht hier lösen */ }
  };

  /**
   * Kann dieser Browser einen Ordner behalten?
   *
   * Safari auf iPhone und iPad kann es NICHT, und Firefox auch nicht. Die
   * Oberfläche muss das wissen: dort gehört ein ehrlicher Satz hin und kein
   * Knopf, der beim Drücken nichts tut (§47).
   */
  const moeglich = (): boolean =>
    typeof window !== 'undefined' &&
    typeof (window as any).showDirectoryPicker === 'function';

  const an = (): boolean => !!meta('sicherungOrdner', null);
  const name = (): string => String(meta('sicherungOrdnerName', '') || '');
  const fehler = (): string => String(meta('sicherungOrdnerFehler', '') || '');
  const zuletzt = (): string => String(meta('sicherungOrdnerZuletzt', '') || '');

  const melden = (text: string): void => setzen('sicherungOrdnerFehler', text);

  /**
   * Erlaubnis prüfen — und nur mit `fragen` auch danach fragen.
   *
   * `requestPermission` verlangt eine Handlung des Menschen. Aus dem
   * Fünf-Minuten-Takt heraus gibt es keine, und der Aufruf würde ohnehin
   * abgelehnt. Deshalb fragt der Takt nur nach (`queryPermission`) und meldet
   * ehrlich, wenn die Erlaubnis fehlt, statt sie erschleichen zu wollen.
   */
  const erlaubnis = async (ordner: any, fragen: boolean): Promise<boolean> => {
    if (!ordner) return false;
    try {
      if (typeof ordner.queryPermission === 'function') {
        const stand = await ordner.queryPermission({ mode: 'readwrite' });
        if (stand === 'granted') return true;
      }
      if (!fragen || typeof ordner.requestPermission !== 'function') return false;
      return (await ordner.requestPermission({ mode: 'readwrite' })) === 'granted';
    } catch { return false; }
  };

  /**
   * Hat sich seit der letzten Sicherung etwas geändert?
   *
   * Gelesen wird der Spiegel im Arbeitsspeicher (`Store.cache`) und nicht die
   * Ablage: alle fünf Minuten eine IndexedDB-Runde zu drehen, nur um
   * festzustellen, dass nichts passiert ist, wäre teurer als die Sicherung
   * selbst.
   *
   * `meta` bleibt bewusst DRAUSSEN. Nach jeder Sicherung schreibt diese Datei
   * selbst zwei Marken dorthin (`sicherung:zuletzt`, den Abdruck). Zählte man
   * `meta` mit, wäre der Abdruck nach dem Sichern sofort wieder ein anderer —
   * und Redion sicherte alle fünf Minuten, für immer, ohne dass sich an
   * seinen Daten irgendetwas geändert hätte.
   */
  const standAbdruck = (): string => {
    if (typeof Store === 'undefined' || !(Store as any).cache) return '';
    const c: any = (Store as any).cache;
    let zahl = 0;
    let juengste = '';
    /* DIE ZAHL UND DER JÜNGSTE ZEITSTEMPEL REICHEN NICHT.
       Wer zwei Wörter in derselben Millisekunde ändert, ändert damit weder
       die Anzahl noch den Höchststand — und die Änderung fiele durch. Ein
       einfacher Streuwert über Kennung und Zeitstempel schliesst das, und er
       kostet nichts: die Schleife läuft ohnehin. Bewusst KEINE echte
       Prüfsumme über die Inhalte — die würde bei zehntausend Blöcken alle
       fünf Minuten spürbar. */
    let streu = 0;
    for (const fach of ['blocks', 'collections', 'views']) {
      const o = c[fach];
      if (!o) continue;
      for (const k of Object.keys(o)) {
        zahl++;
        const e = o[k];
        const t = String((e && (e.edited || e.created)) || '');
        if (t > juengste) juengste = t;
        /* Die Textlänge kommt mit hinein. Sie kostet nichts (kein Durchlauf,
           nur ein Feld) und fängt genau den Fall, den `edited` nicht fängt:
           zwei Änderungen in derselben Millisekunde. */
        const wort = k + '|' + t + '|' + String((e && e.text) || '').length;
        for (let i = 0; i < wort.length; i++)
          streu = (streu * 31 + wort.charCodeAt(i)) | 0;
      }
    }
    return zahl + ':' + juengste + ':' + (streu >>> 0).toString(36);
  };

  /** Zwei Ziffern, immer. */
  const zw = (n: number): string => (n < 10 ? '0' : '') + n;

  /** `2026-08-30-1412` — der Zeitstempel im Dateinamen. */
  const stempel = (d = new Date()): string =>
    d.getFullYear() + '-' + zw(d.getMonth() + 1) + '-' + zw(d.getDate()) +
    '-' + zw(d.getHours()) + zw(d.getMinutes());

  /** Zeitpunkt aus einem Dateinamen — NaN, wenn er nicht unserer ist. */
  const zeitAus = (dateiname: string): number => {
    const m = MUSTER.exec(dateiname);
    if (!m) return NaN;
    const [, jj, mm, tt, hh, min] = m;
    return new Date(Number(jj), Number(mm) - 1, Number(tt),
                    Number(hh), Number(min)).getTime();
  };

  /**
   * WELCHE DATEIEN DÜRFEN WEG — als reine Funktion.
   *
   * Sie fasst nichts an. Sie bekommt eine Liste von Namen und gibt eine
   * kürzere zurück. Genau deshalb lässt sie sich prüfen, ohne dass ein
   * Prüflauf einen echten Ordner mit echten Dateien braucht — und beim
   * Löschen von Dateien ist „lässt sich prüfen" keine Bequemlichkeit.
   *
   * Die Regel:
   *   · Was nicht exakt auf `MUSTER` passt, wird NIE gelöscht. Kein
   *     Unterordner, keine fremde Datei, keine ähnlich heissende.
   *   · `schutz` (die eben geschriebene Datei) bleibt immer.
   *   · Alles aus den letzten sieben Tagen bleibt.
   *   · Von allem Älteren bleibt je Kalendermonat die jüngste.
   *   · Und die allerjüngste bleibt in jedem Fall — auch wenn die Uhr des
   *     Rechners falsch geht und plötzlich alles „alt" ist.
   *
   * @param namen  was im Ordner liegt (nur Dateien, keine Ordner)
   * @param jetzt  Zeitpunkt in ms — als Angabe, damit ein Prüflauf ihn setzen
   *               kann, statt auf einen Tag warten zu müssen
   * @param schutz Name der eben geschriebenen Datei
   */
  const zuLoeschen = (namen: string[], jetzt: number, schutz = ''): string[] => {
    const unsere: { n: string; t: number }[] = [];
    for (const n of namen || []) {
      const t = zeitAus(String(n));
      if (Number.isNaN(t)) continue;
      unsere.push({ n: String(n), t });
    }
    if (unsere.length < 2) return [];
    unsere.sort((a, b) => b.t - a.t);            /* jüngste zuerst */

    const behalten = new Set<string>();
    if (schutz) behalten.add(schutz);
    const erste = unsere[0];
    if (erste) behalten.add(erste.n);            /* die jüngste, immer */

    const grenze = jetzt - BEHALTEN_TAGE * 86400000;
    const monatBelegt = new Set<string>();
    for (const e of unsere) {
      if (e.t >= grenze) { behalten.add(e.n); continue; }
      const d = new Date(e.t);
      const monat = d.getFullYear() + '-' + zw(d.getMonth() + 1);
      if (!monatBelegt.has(monat)) { monatBelegt.add(monat); behalten.add(e.n); }
    }
    return unsere.filter(e => !behalten.has(e.n)).map(e => e.n);
  };

  /** Aufräumen — erst nach `close()`, und nur nach dem eigenen Muster. */
  const aufraeumen = async (ordner: any, schutz: string): Promise<number> => {
    if (!ordner || typeof ordner.values !== 'function') return 0;
    const namen: string[] = [];
    try {
      for await (const eintrag of ordner.values()) {
        /* Ordner werden nicht einmal betrachtet. `zuLoeschen` würde sie
           ohnehin nicht nennen — aber ein Verzeichnis mit passendem Namen
           versehentlich zu löschen ist genau die Sorte Fehler, gegen die
           zwei Riegel besser sind als einer. */
        if (eintrag && eintrag.kind === 'file') namen.push(String(eintrag.name));
      }
    } catch { return 0; }

    const weg = zuLoeschen(namen, Date.now(), schutz);
    let zahl = 0;
    for (const n of weg) {
      try { await ordner.removeEntry(n); zahl++; }
      catch { /* eine, die nicht wegging, ist kein Grund, die nächste zu lassen */ }
    }
    return zahl;
  };

  /**
   * EINMAL SICHERN, JETZT.
   *
   * @param laut true, wenn ein Mensch den Knopf gedrückt hat — dann darf es
   *        Toasts geben. Aus dem Takt heraus bleibt es still: eine Meldung
   *        alle fünf Minuten wäre keine Information, sondern ein Ticken.
   */
  const jetztSichern = async (laut = false): Promise<{ ok: boolean; grund: string; datei?: string }> => {
    if (laeuft) return { ok: false, grund: 'Es läuft gerade schon eine Sicherung.' };
    const ordner = meta('sicherungOrdner', null);
    if (!ordner) return { ok: false, grund: 'Es ist kein Ordner gewählt.' };
    if (typeof App === 'undefined' || typeof App.sicherungPaketBauen !== 'function')
      return { ok: false, grund: 'Die App ist noch nicht bereit.' };

    laeuft = true;
    try {
      if (!await erlaubnis(ordner, false)) {
        const satz = 'Der Ordner „' + (name() || 'Sicherung') + '" ist nicht mehr ' +
          'freigegeben. Das passiert, wenn der Browser die Erlaubnis zurückgesetzt ' +
          'hat. Wähle ihn in den Einstellungen einmal neu — bis dahin wird NICHT ' +
          'automatisch gesichert.';
        melden(satz);
        if (laut && typeof UI !== 'undefined' && UI.toast) UI.toast(satz);
        return { ok: false, grund: satz };
      }

      /* DER ABDRUCK WIRD VOR DEM PACKEN GENOMMEN.
         Packen dauert bei Anhängen Sekunden. Wer in dieser Zeit tippt,
         steht nicht mehr im Paket — nähme man den Abdruck danach, wäre
         diese Änderung als „gesichert" abgehakt und fiele bis zur nächsten
         echten Änderung durch. Vorher genommen heisst: sie gilt weiter als
         offen, und der nächste Takt schreibt sie mit. Einmal zuviel
         gesichert ist ein verschwendeter Moment; einmal zuwenig ist ein
         verlorener Tag. */
      const abdruck = standAbdruck();
      const paket = await App.sicherungPaketBauen(
        laut ? null : () => { /* still */ });

      const dateiname = 'redion-sicherung-' + stempel() + paket.endung;
      const griff = await ordner.getFileHandle(dateiname, { create: true });
      const strom = await griff.createWritable();
      await strom.write(paket.blob);
      /* ERST `close()` MACHT DIE DATEI ECHT. Bis dahin steht sie in einer
         Zwischendatei des Browsers. Alles, was danach kommt — merken,
         aufräumen — hängt daran. */
      await strom.close();

      if (typeof Sicherung !== 'undefined') Sicherung.merken(paket.art);
      setzen('sicherungOrdnerAbdruck', abdruck);
      setzen('sicherungOrdnerZuletzt', new Date().toISOString());
      melden('');

      const weg = await aufraeumen(ordner, dateiname);
      if (laut && typeof UI !== 'undefined' && UI.toast)
        UI.toast('Im Ordner gesichert: ' + dateiname +
                 (weg ? ' — ' + weg + ' alte Sicherung(en) aufgeräumt' : ''));
      return { ok: true, grund: '', datei: dateiname };
    } catch (err: unknown) {
      const satz = 'Die Sicherung in den Ordner kam nicht zustande: ' +
        (err instanceof Error ? err.message : String(err));
      melden(satz);
      if (typeof Reporter !== 'undefined') Reporter.error('Sicherung', satz, err);
      if (laut && typeof UI !== 'undefined' && UI.toast) UI.toast(satz);
      return { ok: false, grund: satz };
    } finally {
      laeuft = false;
    }
  };

  /** Nachsehen — und nur sichern, wenn sich wirklich etwas geändert hat. */
  const nachsehen = async (): Promise<boolean> => {
    if (!an() || laeuft) return false;
    const jetzt = standAbdruck();
    if (!jetzt) return false;
    if (jetzt === String(meta('sicherungOrdnerAbdruck', ''))) return false;
    const erg = await jetztSichern(false);
    return erg.ok;
  };

  /**
   * ORDNER WÄHLEN — nach ausdrücklicher Zusage.
   *
   * `zusagen` bekommt die Frage und gibt zurück, ob der Mensch ja gesagt hat.
   * Sie ist eine Angabe und kein `confirm` im Code, damit die Oberfläche
   * ihren eigenen Dialog nehmen kann (E29: eine Maschine je Frage) und ein
   * Prüflauf sie setzen kann.
   *
   * Die Zusage kommt NACH dem Wählen, nicht davor: vorher wüsste niemand,
   * welchen Ordner er zusagt, und „ja" zu einem ungenannten Verzeichnis ist
   * keine Zusage.
   */
  const waehlen = async (
    zusagen?: ((frage: string) => Promise<boolean> | boolean) | null
  ): Promise<{ ok: boolean; grund: string; name?: string }> => {
    if (!moeglich())
      return { ok: false, grund: 'Dieser Browser kann keinen Ordner behalten. ' +
        'Safari auf iPhone und iPad und Firefox können es nicht — dort bleibt ' +
        'der Weg „Sicherung speichern" von Hand.' };

    let ordner: any = null;
    try {
      ordner = await (window as any).showDirectoryPicker({
        id: 'redion-sicherung', mode: 'readwrite', startIn: 'documents' });
    } catch {
      /* Abbruch ist kein Fehler — jemand hat es sich anders überlegt. */
      return { ok: false, grund: '' };
    }
    if (!ordner) return { ok: false, grund: '' };

    if (!await erlaubnis(ordner, true))
      return { ok: false, grund: 'Ohne Schreibrecht kann Redion dort nichts ablegen.' };

    const wie = String(ordner.name || 'Ordner');
    const frage = 'Redion legt ab jetzt alle fünf Minuten eine vollständige ' +
      'Sicherung in „' + wie + '" ab — mit allen Seiten, Datenbanken und ' +
      'Anhängen, unverschlüsselt, so wie sie hier liegen.\n\n' +
      'Alte Sicherungen aus diesem Ordner räumt Redion selbst weg: die letzten ' +
      'sieben Tage bleiben vollständig, davor je Monat eine. Angefasst wird ' +
      'NUR, was Redion selbst geschrieben hat.\n\nSoll das so sein?';
    const ja = zusagen ? await zusagen(frage)
      : (typeof confirm === 'function' ? confirm(frage) : false);
    if (!ja) return { ok: false, grund: '' };

    /* Der Zugriff selbst in die Ablage — er ist strukturiert klonbar und
       übersteht damit das Neuladen. Was ihn NICHT übersteht, ist eine
       Sicherung: `exportAll` lässt ihn aus und `importAll` rettet den
       lebenden (E270). */
    setzen('sicherungOrdner', ordner);
    setzen('sicherungOrdnerName', wie);
    setzen('sicherungOrdnerAbdruck', '');
    melden('');
    starteUhr();
    return { ok: true, grund: '', name: wie };
  };

  /**
   * Den Ordner wieder vergessen.
   *
   * Auf der Platte bleibt alles liegen. Redion hat dort Dateien abgelegt;
   * sie beim Abschalten wegzuräumen wäre das Gegenteil von dem, wofür sie da
   * sind (CLAUDE.md: nichts löschen, was der Mensch nicht gemeint hat).
   */
  const loesen = (): void => {
    setzen('sicherungOrdner', null);
    setzen('sicherungOrdnerAbdruck', '');
    melden('');
    if (uhr) { clearInterval(uhr); uhr = null; }
  };

  const starteUhr = (): void => {
    if (uhr) { clearInterval(uhr); uhr = null; }
    if (!an()) return;
    uhr = setInterval(() => { nachsehen().catch(() => {}); }, TAKT);
  };

  /**
   * DIE ERINNERUNG (`sicherungErinnern`).
   *
   * Der Schalter hiess einmal „beim Schliessen erinnern" und tat nichts —
   * er konnte nichts tun: beim Entladen einer Seite darf kein Fenster mehr
   * aufgehen, und eine asynchrone Sicherung läuft nicht mehr zu Ende. Ein
   * Versprechen, das die Plattform nicht halten kann, gehört nicht auf einen
   * Schalter (§47).
   *
   * Was sie halten kann: beim Zurückkommen daran erinnern, wenn die letzte
   * Sicherung älter ist als eine Woche — dieselbe Frist, die `Sicherung`
   * ohnehin führt. Höchstens einmal am Tag; eine Erinnerung, die bei jedem
   * Reiterwechsel kommt, erinnert nach zwei Tagen an nichts mehr.
   */
  const vielleichtErinnern = (): void => {
    if (typeof Sicherung === 'undefined') return;
    if (!meta('sicherungErinnern', false)) return;
    const heute = new Date().toISOString().slice(0, 10);
    if (String(meta('sicherung:erinnertAm', '')) === heute) return;
    const s = Sicherung.stand();
    if (s.stufe === 'gut') return;
    setzen('sicherung:erinnertAm', heute);
    const wie = s.tage === null ? 'Es ist noch keine Sicherung bekannt.'
      : 'Die letzte Sicherung ist ' + s.tage + ' Tage alt.';
    if (typeof UI !== 'undefined' && UI.toast)
      UI.toast(wie + ' Mehr → Daten und Sicherheit → Sicherung speichern.');
  };

  /**
   * Zeitplan: alle fünf Minuten, und beim Wiedersichtbarwerden.
   *
   * Das `visibilitychange` ist der wichtigere von beiden. Ein Fenster im
   * Hintergrund bekommt seine Zeitgeber gedrosselt — in manchen Browsern auf
   * einmal pro Minute, in schlafenden Reitern gar nicht. Wer stundenlang in
   * einem anderen Programm war und zurückkommt, soll nicht warten müssen,
   * bis der Takt sich wieder gefangen hat.
   */
  const start = (): void => {
    if (gestartet) return;
    gestartet = true;
    starteUhr();
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState !== 'visible') return;
        vielleichtErinnern();
        nachsehen().catch(() => {});
      });
    }
    /* Einmal kurz nach dem Start — aber nicht sofort: beim Hochfahren ist
       der Bestand gerade erst geladen, und eine Sicherung, die sich in den
       Start hineindrängt, macht ihn langsam. */
    setTimeout(() => { vielleichtErinnern(); nachsehen().catch(() => {}); }, 20000);
  };

  return { moeglich, an, name, fehler, zuletzt, waehlen, loesen,
           standAbdruck, jetztSichern, nachsehen, zuLoeschen, start,
           MUSTER, BEHALTEN_TAGE, TAKT };
})();

(window as any).OrdnerSicherung = OrdnerSicherung;
