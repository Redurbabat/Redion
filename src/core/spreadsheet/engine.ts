/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/core/spreadsheet/engine.ts (npm run bauen:ts). */
/* ============================================================================
 * core/spreadsheet/engine.ts — der Tabellenkern, ohne Oberfläche
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/core/spreadsheet/engine.ts`. `npm run bauen:ts`
 * schreibt daraus `quell/core/spreadsheet/engine.js`. Wer das .js bearbeitet,
 * verliert die Änderung beim nächsten Bauen; `pruefungen/lauf/test105.mjs`
 * meldet es vorher.
 * ----------------------------------------------------------------------------
 * Rechnen, Abhängigkeiten, Zirkelbezüge. Kein DOM, kein `document` — das ist
 * der Punkt: dieser Kern lässt sich in Node prüfen, in Sekunden statt in
 * Minuten, und ein Fehler darin fällt auf, bevor irgendeine Oberfläche
 * existiert.
 *
 * ─── DIE ENTSCHEIDUNG, DIE ALLES ANDERE TRÄGT ───────────────────────────────
 *
 * Es gibt **keine zweite Formelmaschine.** Eine Tabellenformel wird in die
 * Sprache übersetzt, die `formeln/laufzeit.js` seit jeher spricht:
 *
 *     =SUMME(A1:A3)   →   SUMME(prop("A1"), prop("A2"), prop("A3"))
 *     =A1*2           →   prop("A1")*2
 *
 * `prop()` ist der Zugriff auf eine Spalte einer Datenbankzeile; hier ist es
 * der Zugriff auf eine Zelle. Dieselbe Maschine, ein anderer Nachschlager.
 *
 * Warum nicht die Maschine erweitern: weil dann jede bestehende
 * Datenbankformel durch neuen Code liefe. 158 Funktionen, 262 Einträge, ein
 * Zerleger, an dem heute alles hängt — die Sorte Änderung, deren Schaden man
 * erst Wochen später sieht. Übersetzen kostet dreissig Zeilen und kann
 * nichts kaputtmachen, was es schon gibt.
 *
 * ─── WAS DIESER KERN AN FEHLERWERTEN KANN, UND WAS NICHT ────────────────────
 *
 * `src/core/types/spreadsheet.ts` erlaubt einer Zelle Excel-Fehlerwerte
 * (`CellValue` schliesst `FormulaErrorCode` ein). Erzeugt werden sie hier
 * aber nur, wo dieser Kern es **selbst sicher weiss**:
 *
 *     #BEZUG!   Zirkelbezug · ungültige Adresse · zu grosser Bereich
 *     #NAME?    unbekannte Funktion
 *     #WERT!    die Formel liess sich nicht zerlegen
 *
 *     #DIV/0!   geteilt durch null
 *     #ZAHL!    kein Ergebnis, das eine Zahl ist
 *
 * DIE LETZTEN BEIDEN GAB ES LANGE NICHT, und der Grund ist lehrreich: die
 * Laufzeit rechnet abwehrend. `1/0` ergibt dort 0, `WURZEL(-1)` ergibt 0 —
 * sie *meldet* nichts, also konnte dieser Kern nichts weiterreichen.
 *
 * Für eine Datenbank ist das richtig. Eine Spalte „Umsatz pro Kunde" über
 * einer Zeile ohne Kunden soll keine Fehlermeldung zeigen. Für eine Tabelle
 * ist es falsch: wer `=A1/B1` schreibt und B1 leer lässt, bekäme eine Null,
 * die aussieht wie ein Ergebnis.
 *
 * `laufzeit.js` kennt deshalb seit E31 einen **strengen Modus**
 * (`umgebung.streng`), und nur dieser Kern schaltet ihn ein. Jede bestehende
 * Datenbankformel rechnet unverändert weiter — das war die Bedingung dafür,
 * eine Datei mit 158 Funktionen überhaupt anzufassen.
 *
 * SPRACHE. Namen englisch, Erklärungen deutsch — E27. Neu und damit von
 * Anfang an TypeScript — E28.
 * ==========================================================================*/

const Spreadsheet = (() => {

  /* --- Was von aussen gebraucht wird -------------------------------------
     `typeof` statt `self.`: `Formula` ist ein gewöhnliches `const` auf
     oberster Ebene und steht nicht auf `window`. Wer hier `self.Formula`
     prüfte, bekäme immer `undefined` und stünde vor einem Kern, der
     wortlos nichts rechnet. */
  const maschine = (): any =>
    (typeof Formula !== 'undefined') ? Formula : null;

  const adressen = (): any =>
    (typeof CellRefs !== 'undefined') ? CellRefs : null;

  /* ==========================================================================
   * 1 · EINE FORMEL ÜBERSETZEN
   * --------------------------------------------------------------------------
   * IN EINEM DURCHGANG, und das ist keine Sparsamkeit, sondern die Lehre aus
   * dem ersten Versuch. Der lief dreimal über die Formel: Zeichenketten
   * wegmaskieren, Bereiche ausschreiben, Einzelbezüge ersetzen. Zwei Fehler
   * auf einmal:
   *
   *   · Der dritte Durchgang traf das `A1` **im Ergebnis des zweiten** und
   *     machte aus `prop("A1")` ein `prop("prop("A1")")`.
   *   · Der Platzhalter für eine Zeichenkette sah selbst wie eine Zelle aus
   *     (`TXT0` — drei Buchstaben, eine Ziffer) und wurde mitersetzt.
   *
   * Ein einziger regulärer Ausdruck mit drei Zweigen hat beides nicht: was
   * ein Zweig zurückgibt, wird nicht noch einmal angesehen, und
   * Zeichenketten sind ein Zweig statt eines Verstecks.
   * ========================================================================*/

  /**
   * Drei Zweige, und die Reihenfolge darin entscheidet:
   *
   *   1. Zeichenkette — zuerst, damit `="A1 ist leer"` nichts nachschlägt
   *   2. Bereich `A1:C3` — vor dem Einzelbezug, sonst frisst der das `A1`
   *   3. Einzelbezug `A1`, nicht gefolgt von `(` — das wäre ein Funktionsname
   *
   * Ein Bereich hat **kein Leerzeichen um den Doppelpunkt.** Das ist eine
   * Entscheidung: die Formelsprache kennt auch `bedingung ? a : b`, und dort
   * steht ebenfalls ein Doppelpunkt. In einer Tabelle ist der Bereich die
   * erwartete Bedeutung, und Excel schreibt ihn nie mit Leerzeichen.
   *
   * ─── WARUM HIER KEIN `\b` MEHR STEHT ────────────────────────────────────
   *
   * Es stand eines, und es hat das Dollarzeichen abgeschnitten. `\b` verlangt
   * eine Wortgrenze — `$` ist kein Wortzeichen, also passte die Grenze nicht
   * VOR das `$`, sondern erst dahinter. Aus `=$A$1` wurde deshalb:
   *
   *     $A$1  →  $prop("A1")        ← das führende $ blieb einfach stehen
   *
   * Ein `$` mitten in der Formel, das die Laufzeit nicht kennt. Feste Bezüge
   * haben also nie funktioniert, und beim Ausfüllen war es schlimmer als ein
   * Absturz: `$A$1` wanderte mit, obwohl es genau das nicht sollte — eine
   * ganze Spalte rechnete still gegen die falsche Zelle.
   *
   * Der Rückblick statt `\b` leistet dasselbe für Buchstaben und schliesst
   * das `$` mit ein. Und er hält weiterhin die wissenschaftliche Schreibweise
   * heraus: in `2e6` steht vor dem `e` eine Ziffer.
   */
  const ADRESSE = '\\$?[A-Za-z]{1,3}\\$?[0-9]{1,7}';
  const NICHT_DAVOR = '(?<![A-Za-z0-9_$.])';

  /**
   * Der Blattname vor dem Ausrufezeichen: `Januar!A1` oder `'Mein Blatt'!A1`.
   *
   * MIT ANFÜHRUNGSZEICHEN, SOBALD EIN LEERZEICHEN DRIN IST — so wie in Excel,
   * und aus demselben Grund: ohne sie liesse sich `SUMME(Mein Blatt!A1)` nicht
   * eindeutig lesen.
   *
   * Und was hier ausdrücklich NICHT schiefgeht: `A1!=B1`. Der Zerleger
   * probiert `A1!` als Blattnamen, findet dahinter kein `=B1`, das wie eine
   * Adresse aussieht, nimmt den Versuch zurück und liest `A1` allein. Danach
   * beginnt der nächste Versuch bei `B1`. Das ist kein Zufall, sondern das,
   * was ein regulärer Ausdruck beim Zurücksetzen tut — geprüft wird es
   * trotzdem, in `test110`.
   */
  const BLATT = '(?:\'[^\']+\'|[A-Za-z_\\u00C0-\\u024F][A-Za-z0-9_\\u00C0-\\u024F]*)!';

  /* DIE ZEICHENKETTE BLEIBT VORN — aber sie lässt einen Blattnamen durch.
     Ein einfach angeführter Text sieht genauso aus wie ein Blattname mit
     Leerzeichen: `'Mein Blatt'`. Stand der Zeichenketten-Zweig ungeschützt
     zuerst, wurde aus `='Mein Blatt'!A1` ein `'Mein Blatt'!prop("A1")` —
     der Blattname blieb als Text stehen, und die Laufzeit sah ein `!`
     (also „nicht") vor einer Klammer.

     Der Rückwärtsblick löst es genau dort, wo der Unterschied liegt: ein
     Text, hinter dem sofort `!` und eine Adresse folgen, ist kein Text.
     Vorn bleibt der Zweig trotzdem, denn `="A1 ist leer"` darf weiterhin
     nichts nachschlagen. */
  const TEILE = new RegExp([
    '("(?:[^"\\\\]|\\\\.)*"|\'(?:[^\'\\\\]|\\\\.)*\'(?!\\s*!\\s*\\$?[A-Za-z]))',
    '(' + NICHT_DAVOR + '(?:' + BLATT + ')?' + ADRESSE + ':(?:' + BLATT + ')?' + ADRESSE + ')',
    '(' + NICHT_DAVOR + '(?:' + BLATT + ')?' + ADRESSE + '\\b(?!\\s*\\())'
  ].join('|'), 'g');

  /** `'Mein Blatt'!A1` → `{ blatt: 'Mein Blatt', adresse: 'A1' }`. */
  const trenneBlatt = (stueck: string): { blatt: string; adresse: string } => {
    const i = stueck.lastIndexOf('!');
    if (i < 0) return { blatt: '', adresse: stueck };
    let name = stueck.slice(0, i);
    if (name.startsWith('\'') && name.endsWith('\'')) name = name.slice(1, -1);
    return { blatt: name, adresse: stueck.slice(i + 1) };
  };

  /**
   * Der SCHLÜSSEL — wie eine Zelle intern heisst: `Mein Blatt!A1`, ohne
   * Anführungszeichen.
   *
   * Er ist bewusst nicht dasselbe wie das, was in einer Formel steht. In der
   * Formel braucht ein Name mit Leerzeichen Anführungszeichen, sonst liesse
   * er sich nicht lesen. Als Schlüssel im Graphen wären sie eine Fehlerquelle
   * mehr: `'Mein Blatt'!A1` und `Mein Blatt!A1` wären zwei verschiedene
   * Zellen, und je nachdem, wie die Formel geschrieben war, führe der eine
   * oder der andere Eintrag ins Leere.
   *
   * Eine Sache, ein Name. Das Anführen gehört zur Schreibweise, nicht zur
   * Sache.
   */
  const schluessel = (blatt: string, adresse: string): string =>
    blatt ? blatt + '!' + adresse : adresse;

  /** Und für die Formel — mit Anführungszeichen, wenn der Name welche braucht. */
  const mitBlatt = (blatt: string, adresse: string): string => {
    if (!blatt) return adresse;
    return (/^[A-Za-z_\u00C0-\u024F][A-Za-z0-9_\u00C0-\u024F]*$/.test(blatt)
      ? blatt : '\'' + blatt + '\'') + '!' + adresse;
  };

  const ohneDollar = (s: string): string => s.replace(/\$/g, '').toUpperCase();

  /**
   * Aus einer Tabellenformel eine Formel für `laufzeit.js` machen.
   *
   * Gibt zusätzlich die gelesenen Adressen zurück — daraus entsteht der
   * Abhängigkeitsgraph. Sie hier einzusammeln statt später noch einmal zu
   * suchen ist nicht Bequemlichkeit: zwei Stellen, die dieselbe Formel
   * zerlegen, laufen auseinander, und dann rechnet die Tabelle etwas
   * anderes, als der Graph glaubt.
   */
  const uebersetze = (formel: unknown, eigenesBlatt = ''): {
    quelle: string; liest: string[]; fehler: string | null;
  } => {
    const roh = String(formel ?? '').trim().replace(/^=/, '');
    if (!roh) return { quelle: '', liest: [], fehler: null };

    const A = adressen();
    if (!A) return { quelle: '', liest: [], fehler: 'CellRefs fehlt' };

    const liest: string[] = [];
    let fehler: string | null = null;

    /* Jeder gelesene Name ist VOLL QUALIFIZIERT: `Januar!A1`, auch wenn in
       der Formel nur `A1` steht. Sonst hiessen zwei Zellen auf zwei
       Blättern gleich, und der Abhängigkeitsgraph legte sie zusammen — eine
       Tabelle rechnete dann mit dem Wert der anderen. */
    const voll = (blatt: string, adresse: string): string =>
      schluessel(blatt || eigenesBlatt, adresse);

    const quelle = roh.replace(TEILE, (ganz, text, bereich, zelle) => {
      if (text !== undefined) return text;          /* 1 · unangetastet */

      if (bereich !== undefined) {                  /* 2 · ausschreiben */
        const [links, rechts] = bereich.split(/:(?![^']*')/).length === 2
          ? bereich.split(/:(?![^']*')/) : [bereich, ''];
        const a = trenneBlatt(String(links));
        const b = trenneBlatt(String(rechts));
        /* `Januar!A1:A9` — der Blattname steht nur vorn und gilt für beide.
           `Januar!A1:Februar!A9` gibt es nicht: ein Bereich liegt auf einem
           Blatt. Excel sagt dazu dasselbe. */
        if (b.blatt && a.blatt && b.blatt !== a.blatt) {
          fehler = 'Ein Bereich kann nicht über zwei Blätter gehen';
          return ganz;
        }
        const wo = a.blatt || b.blatt;
        const sauber = ohneDollar(a.adresse) + ':' + ohneDollar(b.adresse);
        const erg = A.zellenIn(sauber);
        if (erg.zuGross) { fehler = 'Der Bereich ' + sauber + ' ist zu gross'; return ganz; }
        if (!erg.adressen.length) { fehler = 'Der Bereich ' + sauber + ' ergibt keine Zellen'; return ganz; }
        erg.adressen.forEach((x: string) => liest.push(voll(wo, x)));
        return erg.adressen.map((x: string) => 'prop("' + voll(wo, x) + '")').join(', ');
      }

      const t = trenneBlatt(zelle);                 /* 3 · einzelne Zelle */
      const sauber = ohneDollar(t.adresse);
      if (!A.gueltig(sauber)) return ganz;
      const name = voll(t.blatt, sauber);
      liest.push(name);
      return 'prop("' + name + '")';
    });

    return { quelle, liest: [...new Set(liest)], fehler };
  };

  /* ==========================================================================
   * 2 · DER ABHÄNGIGKEITSGRAPH
   * ========================================================================*/

  /**
   * Aus den Zellen eines Blattes den Graphen bauen.
   *
   * @param blattName  wenn gesetzt, heissen die Knoten `Januar!A1` statt `A1`
   *                   — nötig, sobald mehr als ein Blatt im Spiel ist
   */
  const graphVon = (zellen: Record<string, any>, blattName = ''): {
    liest: Record<string, string[]>; gelesenVon: Record<string, string[]>;
  } => {
    const liest: Record<string, string[]> = {};
    const gelesenVon: Record<string, string[]> = {};
    for (const adresse of Object.keys(zellen || {})) {
      const zelle = zellen[adresse];
      if (!zelle || !zelle.formel) continue;
      const { liest: quellen } = uebersetze(zelle.formel, blattName);
      const ich = schluessel(blattName, adresse);
      liest[ich] = quellen;
      for (const q of quellen) (gelesenVon[q] = gelesenVon[q] || []).push(ich);
    }
    return { liest, gelesenVon };
  };

  /**
   * Welche Zellen liegen in einem Kreis?
   *
   * Tiefensuche mit drei Zuständen — weiss (ungesehen), grau (gerade auf dem
   * Weg), schwarz (fertig). Trifft der Weg auf Grau, ist der Kreis
   * gefunden.
   *
   * WARUM DIE LISTE UND NICHT NUR EIN JA. „Irgendwo ist ein Zirkelbezug" ist
   * keine Hilfe — in einer Tabelle mit dreihundert Formeln sucht man dann
   * von Hand. Zurück kommen die Adressen, die wirklich im Kreis liegen.
   */
  const zirkel = (liest: Record<string, string[]>): string[] => {
    const grau = new Set<string>();
    const schwarz = new Set<string>();
    const gefunden = new Set<string>();
    const weg: string[] = [];

    const geh = (adresse: string): void => {
      if (schwarz.has(adresse)) return;
      if (grau.has(adresse)) {
        /* Alles ab dem ersten Auftreten im Weg gehört zum Kreis. */
        const ab = weg.indexOf(adresse);
        if (ab >= 0) weg.slice(ab).forEach(a => gefunden.add(a));
        return;
      }
      grau.add(adresse); weg.push(adresse);
      for (const naechste of liest[adresse] || []) geh(naechste);
      weg.pop(); grau.delete(adresse); schwarz.add(adresse);
    };

    for (const adresse of Object.keys(liest)) geh(adresse);
    return [...gefunden].sort();
  };

  /**
   * Die Reihenfolge, in der gerechnet werden muss: was gelesen wird, zuerst.
   *
   * Zellen im Kreis fallen heraus — sie bekommen `#BEZUG!` und werden nicht
   * gerechnet. Ohne das läuft die Tiefensuche endlos, und der Tab steht.
   */
  const reihenfolge = (liest: Record<string, string[]>, imKreis: Set<string>): string[] => {
    const fertig = new Set<string>();
    const raus: string[] = [];

    const geh = (adresse: string): void => {
      if (fertig.has(adresse) || imKreis.has(adresse)) return;
      fertig.add(adresse);
      for (const naechste of liest[adresse] || []) geh(naechste);
      if (liest[adresse]) raus.push(adresse);
    };

    for (const adresse of Object.keys(liest)) geh(adresse);
    return raus;
  };

  /* ==========================================================================
   * 3 · RECHNEN
   * ========================================================================*/

  /**
   * Aus einer Fehlermeldung der Laufzeit den passenden Excel-Wert machen.
   *
   * Ein Fehlerwert, den die Laufzeit im strengen Modus selbst schon so nennt
   * (`#DIV/0!`, `#ZAHL!`), wird durchgereicht statt übersetzt. Zweimal
   * denselben Namen zu vergeben, wäre zwei Stellen, die auseinanderlaufen.
   */
  const alsFehlerwert = (satz: unknown): string => {
    const s = String(satz ?? '');
    if (/^#[A-Z/0-9]+[!?]$/.test(s.trim())) return s.trim();
    if (/Unbekannte Funktion/i.test(s)) return '#NAME?';
    return '#WERT!';
  };

  /**
   * Ein Blatt neu rechnen. Verändert die Zellen an Ort und Stelle und sagt,
   * was sich geändert hat.
   */
  /**
   * Eine ganze Mappe rechnen — alle Blätter zusammen, in einem Durchgang.
   *
   * ─── WARUM NICHT BLATT FÜR BLATT ───────────────────────────────────────
   *
   * Weil `Januar!A1` auf `Februar!B2` zeigen darf und umgekehrt. Rechnete man
   * Blatt für Blatt, hinge das Ergebnis an der Reihenfolge der Blätter — und
   * ein Zirkelbezug über zwei Blätter fiele gar nicht auf, weil jedes Blatt
   * für sich kreisfrei ist.
   *
   * Also: ein Graph über alle Blätter, mit vollen Namen als Knoten
   * (`Januar!A1`), eine Tiefensuche, eine Reihenfolge.
   */
  const rechneMappe = (mappe: any): {
    geaendert: string[]; zirkel: string[]; dauer: number; fehler: string | null;
  } => {
    const t0 = (typeof performance !== 'undefined' && performance.now)
      ? performance.now() : 0;
    const F = maschine();
    if (!F) return { geaendert: [], zirkel: [], dauer: 0, fehler: 'Formula fehlt' };
    const blaetter: any[] = (mappe && mappe.blaetter) || [];
    if (!blaetter.length) return { geaendert: [], zirkel: [], dauer: 0, fehler: 'Keine Blätter' };

    /* Mit nur einem Blatt bleiben die Knoten unqualifiziert (`A1` statt
       `Tabelle 1!A1`). Das ist kein Sonderfall aus Bequemlichkeit: eine
       Mappe, die vor den Blattreitern gespeichert wurde, hat Formeln ohne
       Blattnamen, und ihre gemeldeten Zirkelbezüge sollen weiterhin `A1`
       heissen und nicht plötzlich anders. */
    const einzeln = blaetter.length === 1;
    const nameVon = (b: any, i: number): string =>
      einzeln ? '' : String(b.name || ('Blatt ' + (i + 1)));

    /* Ein Nachschlagewerk über alle Blätter: voller Name → Zelle. */
    const wo: Record<string, Record<string, any>> = {};
    blaetter.forEach((b, i) => { wo[nameVon(b, i)] = (b && b.zellen) || {}; });

    let liest: Record<string, string[]> = {};
    blaetter.forEach((b, i) => {
      const teil = graphVon((b && b.zellen) || {}, nameVon(b, i));
      liest = Object.assign(liest, teil.liest);
    });

    const imKreis = zirkel(liest);
    const kreisMenge = new Set(imKreis);
    const geaendert: string[] = [];

    const zelleZu = (voll: string): any => {
      const t = trenneBlatt(voll);
      const tafel = wo[t.blatt] || (einzeln ? wo[''] : null);
      return tafel ? tafel[String(t.adresse).toUpperCase()] : null;
    };

    /* Zellen im Kreis zuerst — damit alles, was sie liest, den Fehlerwert
       sieht und nicht einen alten Wert von gestern. */
    for (const name of imKreis) {
      const zelle = zelleZu(name);
      if (!zelle) continue;
      if (zelle.wert !== '#BEZUG!') { zelle.wert = '#BEZUG!'; geaendert.push(name); }
    }

    /* Der Nachschlager: ein voller Name, ein Zellwert. Eine leere Zelle ist
       nicht `undefined`, sondern 0 — sonst ergäbe `=SUMME(A1:A9)` über einer
       halb gefüllten Spalte nichts statt der Summe der gefüllten.

       Zeigt eine Formel auf ein Blatt, das es nicht (mehr) gibt, ist das
       nicht 0, sondern `#BEZUG!`. Ein gelöschtes Blatt still als Null zu
       rechnen wäre die schlimmere Antwort: die Summe stimmte dann nicht und
       sähe richtig aus. */
    let blattFehlt = false;
    const hole = (name: string): any => {
      const t = trenneBlatt(String(name));
      if (t.blatt && !(t.blatt in wo)) { blattFehlt = true; return 0; }
      const zelle = zelleZu(String(name));
      if (!zelle) return 0;
      return zelle.wert === undefined || zelle.wert === null ? 0 : zelle.wert;
    };

    for (const name of reihenfolge(liest, kreisMenge)) {
      const zelle = zelleZu(name);
      if (!zelle || !zelle.formel) continue;
      const eigenes = trenneBlatt(name).blatt;
      const { quelle, fehler } = uebersetze(zelle.formel, eigenes);
      let neu: any;
      if (fehler) neu = '#BEZUG!';
      else {
        blattFehlt = false;
        /* STRENG — das ist der Unterschied zwischen einer Datenbankspalte
           und einer Tabellenzelle. In der Datenbank ist `1/0` gleich 0 und
           soll keine Liste rot färben; in einer Tabelle ist es `#DIV/0!`,
           weil dort keine Zahl ist und nicht die Null. `laufzeit.js` kann
           beides, seit es `umgebung.streng` gibt. */
        const e = F.run(quelle, hole, null, { streng: true });
        neu = blattFehlt ? '#BEZUG!' : (e.ok ? e.wert : alsFehlerwert(e.fehler));
      }
      if (zelle.wert !== neu) { zelle.wert = neu; geaendert.push(name); }
    }

    const dauer = ((typeof performance !== 'undefined' && performance.now)
      ? performance.now() : 0) - t0;
    return { geaendert, zirkel: imKreis, dauer: Math.round(dauer), fehler: null };
  };

  /**
   * Ein einzelnes Blatt rechnen.
   *
   * Bleibt, weil es der häufige Fall ist und weil alles, was es schon
   * aufruft, weiterlaufen soll. Es reicht an `rechneMappe` durch — eine
   * zweite Rechenschleife daneben liefe irgendwann auseinander, und dann
   * rechnete ein Blatt allein anders als dasselbe Blatt in seiner Mappe.
   */
  const rechne = (blatt: any): {
    geaendert: string[]; zirkel: string[]; dauer: number; fehler: string | null;
  } => {
    if (!blatt || !blatt.zellen)
      return { geaendert: [], zirkel: [], dauer: 0, fehler: 'Kein Blatt' };
    return rechneMappe({ blaetter: [blatt] });
  };

  /* ==========================================================================
   * 4 · BLÄTTER UND MAPPEN
   * ========================================================================*/

  const kennung = (): string =>
    (typeof Ids !== 'undefined') ? Ids.short(8)
      : 'x' + Math.random().toString(36).slice(2, 10);

  const neuesBlatt = (name = 'Tabelle 1', zeilen = 50, spalten = 20): any => ({
    id: kennung(), name: String(name), zellen: {},
    zeilen: Math.max(1, zeilen), spalten: Math.max(1, spalten)
  });

  const neueMappe = (name = 'Neue Tabelle'): any => {
    const blatt = neuesBlatt();
    return { id: kennung(), name: String(name), blaetter: [blatt], aktiv: blatt.id,
             erstellt: new Date().toISOString(), geaendert: new Date().toISOString() };
  };

  /**
   * Eine Zelle setzen. Beginnt der Wert mit `=`, ist es eine Formel.
   *
   * Zahlen werden erkannt, damit `12` eine Zahl wird und nicht der Text
   * „12" — sonst rechnet `=SUMME(A1:A2)` mit Text und ergibt 0. Das deutsche
   * Komma zählt dabei mit: wer `1,5` tippt, meint eineinhalb.
   *
   * DREI DINGE, DIE EINE TABELLE KÖNNEN MUSS UND DIE HIER GEFEHLT HABEN:
   *
   * **Leeren wirft die Gestaltung nicht weg.** `delete blatt.zellen[a]` hat
   * mit dem Inhalt auch Fett, Ausrichtung und Währung gelöscht. Wer eine
   * Spalte formatiert, die Zahlen probeweise löscht und neu tippt, stand
   * wieder am Anfang. Excel trennt beides, und zwar aus genau diesem Grund.
   *
   * **WAHR und FALSCH sind Wahrheitswerte**, keine Wörter. Sonst ergibt
   * `=WENN(A1; …)` über einem getippten „WAHR" immer den Sonst-Zweig, und
   * niemand sieht warum.
   *
   * **Ein führendes `'` erzwingt Text.** Postleitzahl `'0815`, Telefonnummer,
   * Artikelnummer — überall dort, wo die führende Null zum Wert gehört.
   */
  const setze = (blatt: any, adresse: unknown, eingabe: unknown): any => {
    const A = adressen();
    if (!blatt || !A) return null;
    const a = String(adresse ?? '').toUpperCase();
    if (!A.gueltig(a)) return null;

    const roh = eingabe === null || eingabe === undefined ? '' : String(eingabe);
    const vorher = blatt.zellen[a] || {};

    if (roh === '') {
      /* Inhalt weg, Gestaltung bleibt — und nur wenn auch keine Gestaltung
         da ist, verschwindet der Eintrag ganz. Sonst füllte sich das Blatt
         mit leeren Zellen, und die Sicherung wüchse ohne einen Inhalt. */
      const stil = (vorher as any).stil;
      if (stil && Object.keys(stil).length) { blatt.zellen[a] = { wert: '', stil }; return blatt.zellen[a]; }
      delete blatt.zellen[a];
      return null;
    }

    if (roh.startsWith('=')) {
      blatt.zellen[a] = { ...vorher, formel: roh, wert: vorher.wert ?? '' };
      return blatt.zellen[a];
    }

    const neu: any = { ...vorher };
    delete neu.formel;

    if (roh.startsWith("'")) {                       /* erzwungener Text */
      neu.wert = roh.slice(1);
      neu.text = true;
    } else {
      delete neu.text;
      const oben = roh.trim().toUpperCase();
      if (oben === 'WAHR' || oben === 'TRUE') neu.wert = true;
      else if (oben === 'FALSCH' || oben === 'FALSE') neu.wert = false;
      else {
        const alsZahl = roh.trim().replace(',', '.');
        const zahl = /^-?\d+(\.\d+)?$/.test(alsZahl) ? Number(alsZahl) : null;
        neu.wert = zahl === null ? roh : zahl;
      }
    }
    blatt.zellen[a] = neu;
    return blatt.zellen[a];
  };

  /* ==========================================================================
   * 5 · BEZÜGE VERSCHIEBEN
   * --------------------------------------------------------------------------
   * Eine Funktion, zwei Anwender — und deshalb steht sie hier und nicht
   * zweimal in der Oberfläche:
   *
   *   · **Ausfüllen.** Wer `=A1+B1` aus C1 nach C2 zieht, erwartet `=A2+B2`.
   *     Das ist der ganze Sinn eines relativen Bezugs.
   *   · **Zeile oder Spalte einfügen und löschen.** Wird über Zeile 5 etwas
   *     eingeschoben, muss `=SUMME(A1:A9)` zu `=SUMME(A1:A10)` werden. Sonst
   *     rechnet die Tabelle ab dem Einfügen still falsch — und das ist die
   *     schlimmste Sorte Fehler, die eine Tabelle haben kann: sie sieht
   *     weiterhin richtig aus.
   *
   * `$` HEISST NUR BEIM AUSFÜLLEN ETWAS. Beim Einfügen einer Zeile wandert
   * auch `$A$1` mit — es zeigt weiterhin auf dieselbe Zelle, und die ist
   * jetzt woanders. Excel macht es genauso, und wer es anders macht, bekommt
   * beim ersten Einfügen falsche Summen.
   *
   * Fällt ein Bezug beim Löschen weg, wird die ganze Formel `=#BEZUG!` —
   * nicht heimlich eine Zelle daneben. Ein sichtbarer Fehler ist ein Fehler,
   * den jemand behebt.
   * ========================================================================*/

  /** Eine Adresse mit ihren `$`-Marken zerlegt. */
  const teileAdresse = (roh: string): {
    absS: boolean; spalte: string; absZ: boolean; zeile: number;
  } | null => {
    const m = String(roh).match(/^(\$?)([A-Za-z]{1,3})(\$?)([0-9]{1,7})$/);
    if (!m) return null;
    return { absS: m[1] === '$', spalte: String(m[2]).toUpperCase(),
             absZ: m[3] === '$', zeile: Number(m[4]) };
  };

  const KAPUTT = '#BEZUG!';

  /**
   * Der gemeinsame Weg: jede Adresse in der Formel durch `wandle` schicken.
   * Gibt `wandle` `null` zurück, ist die ganze Formel hin.
   */
  const bezuegeUm = (
    formel: unknown,
    wandle: (t: { absS: boolean; spalte: string; absZ: boolean; zeile: number }) => string | null
  ): string => {
    const roh = String(formel ?? '');
    if (!roh.startsWith('=')) return roh;
    let kaputt = false;

    const eine = (stueck: string): string => {
      const t = teileAdresse(stueck);
      if (!t) return stueck;
      const raus = wandle(t);
      if (raus === null) { kaputt = true; return KAPUTT; }
      return raus;
    };

    const neu = roh.slice(1).replace(TEILE, (_ganz, text, bereich, zelle) => {
      if (text !== undefined) return text;
      if (bereich !== undefined) return bereich.split(':').map(eine).join(':');
      return eine(zelle);
    });

    return kaputt ? '=' + KAPUTT : '=' + neu;
  };

  /** Relativ verschieben — für das Ausfüllen. `$` bleibt stehen. */
  const verschiebe = (formel: unknown, dz: number, ds: number): string =>
    bezuegeUm(formel, (t) => {
      const A = adressen();
      if (!A) return null;
      const spalte = t.absS ? A.textZuSpalte(t.spalte) : A.textZuSpalte(t.spalte) + ds;
      const zeile = t.absZ ? t.zeile - 1 : t.zeile - 1 + dz;
      if (spalte < 0 || zeile < 0) return null;
      const txt = A.spalteZuText(spalte);
      if (!txt) return null;
      return (t.absS ? '$' : '') + txt + (t.absZ ? '$' : '') + (zeile + 1);
    });

  /**
   * Nach einem Einfügen oder Löschen nachziehen.
   *
   * @param art    'zeile' oder 'spalte'
   * @param bei    ab welchem Index (0-basiert)
   * @param anzahl positiv = eingefügt, negativ = gelöscht
   */
  const bezuegeNachEingriff = (
    formel: unknown, art: 'zeile' | 'spalte', bei: number, anzahl: number
  ): string =>
    bezuegeUm(formel, (t) => {
      const A = adressen();
      if (!A) return null;
      let spalte = A.textZuSpalte(t.spalte);
      let zeile = t.zeile - 1;
      if (spalte < 0 || zeile < 0) return null;

      const wert = art === 'zeile' ? zeile : spalte;
      let neu = wert;
      if (anzahl > 0) {
        if (wert >= bei) neu = wert + anzahl;
      } else {
        const weg = -anzahl;
        if (wert >= bei && wert < bei + weg) return null;   /* stand in der gelöschten Zeile */
        if (wert >= bei + weg) neu = wert - weg;
      }
      if (art === 'zeile') zeile = neu; else spalte = neu;

      const txt = A.spalteZuText(spalte);
      if (!txt || zeile < 0) return null;
      return (t.absS ? '$' : '') + txt + (t.absZ ? '$' : '') + (zeile + 1);
    });

  /**
   * Ein Blatt wurde umbenannt — jede Formel nachziehen.
   *
   * OHNE DAS ZEIGT NACH DEM UMBENENNEN ALLES INS LEERE, sofort und überall.
   * Das ist der Grund, warum Umbenennen in manchen Programmen als gefährlich
   * gilt: dort wird es nicht nachgezogen, und man merkt es erst an der
   * dritten Summe.
   *
   * Angefasst wird nur der Blattname; Adresse und `$` bleiben, wie sie sind.
   */
  const blattUmbenannt = (formel: unknown, alt: string, neu: string): string => {
    const roh = String(formel ?? '');
    if (!roh.startsWith('=') || !alt || alt === neu) return roh;

    const raus = roh.slice(1).replace(TEILE, (_ganz, text, bereich, zelle) => {
      if (text !== undefined) return text;
      const stueck = bereich !== undefined ? bereich : zelle;
      const teile = String(stueck).split(/:(?![^']*')/);
      const neuTeile = teile.map((t: string) => {
        const g = trenneBlatt(t);
        if (g.blatt !== alt) return t;
        return mitBlatt(neu, g.adresse);
      });
      return neuTeile.join(':');
    });
    return '=' + raus;
  };

  /* ==========================================================================
   * 6 · ZEILEN UND SPALTEN
   * --------------------------------------------------------------------------
   * Die Zellen eines Blattes liegen unter ihrer Adresse — beim Einfügen muss
   * also jede betroffene Zelle umziehen, und zwar **von hinten nach vorn**.
   * Andersherum überschreibt der Umzug von Zeile 5 die Zeile 6, bevor die
   * selbst umgezogen ist. Ein Fehler, den man erst bei drei Zeilen bemerkt.
   * ========================================================================*/

  const eingriff = (blatt: any, art: 'zeile' | 'spalte', bei: number, anzahl: number): boolean => {
    const A = adressen();
    if (!blatt || !blatt.zellen || !A || !anzahl) return false;
    const weg = anzahl < 0 ? -anzahl : 0;

    const alt = blatt.zellen as Record<string, any>;
    const neu: Record<string, any> = {};

    for (const adresse of Object.keys(alt)) {
      const l = A.lies(adresse);
      if (!l) continue;
      let z = l.zeile, s = l.spalte;
      const wert = art === 'zeile' ? z : s;

      if (weg) {
        if (wert >= bei && wert < bei + weg) continue;        /* fällt weg */
        if (wert >= bei + weg) { if (art === 'zeile') z -= weg; else s -= weg; }
      } else if (wert >= bei) {
        if (art === 'zeile') z += anzahl; else s += anzahl;
      }

      /* JEDE Formel wird nachgezogen, auch die einer Zelle, die selbst
         stehen bleibt: `=A9` in B1 muss nach dem Einfügen `=A10` heissen,
         obwohl B1 sich nicht bewegt hat. */
      const zelle = alt[adresse];
      if (zelle && zelle.formel)
        zelle.formel = bezuegeNachEingriff(zelle.formel, art, bei, anzahl);
      neu[A.schreibe(z, s)] = zelle;
    }

    blatt.zellen = neu;
    if (art === 'zeile') blatt.zeilen = Math.max(1, (blatt.zeilen || 0) + anzahl);
    else blatt.spalten = Math.max(1, (blatt.spalten || 0) + anzahl);
    return true;
  };

  const zeileEinfuegen  = (blatt: any, bei: number, anzahl = 1): boolean => eingriff(blatt, 'zeile', bei, Math.max(1, anzahl));
  const zeileLoeschen   = (blatt: any, bei: number, anzahl = 1): boolean => eingriff(blatt, 'zeile', bei, -Math.max(1, anzahl));
  const spalteEinfuegen = (blatt: any, bei: number, anzahl = 1): boolean => eingriff(blatt, 'spalte', bei, Math.max(1, anzahl));
  const spalteLoeschen  = (blatt: any, bei: number, anzahl = 1): boolean => eingriff(blatt, 'spalte', bei, -Math.max(1, anzahl));

  /* ==========================================================================
   * 7 · AUSFÜLLEN
   * --------------------------------------------------------------------------
   * Der Anfasser unten rechts an der Auswahl verspricht das. Ein Anfasser,
   * der nichts tut, ist schlimmer als keiner — deshalb steht das hier und
   * nicht auf der Liste für später.
   *
   * Drei Fälle, in dieser Reihenfolge:
   *   1. **Formel** — mitverschoben (`=A1` wird `=A2`)
   *   2. **Zwei Zahlen oder mehr** — die Schrittweite fortgesetzt: 2, 4 → 6, 8
   *   3. **Alles andere** — wiederholt
   *
   * Bei Fall 2 zählt der Abstand des LETZTEN Paars. `1, 2, 4` füllt mit 6, 8 —
   * eine Tabelle rät keine Potenzreihe.
   */
  const fuelle = (
    blatt: any, von: { vonZ: number; bisZ: number; vonS: number; bisS: number },
    bisZeile: number, bisSpalte: number
  ): number => {
    const A = adressen();
    if (!blatt || !A) return 0;

    const runter = bisZeile > von.bisZ;
    const rechts = bisSpalte > von.bisS;
    if (!runter && !rechts) return 0;

    const quelle: string[] = [];
    let gefuellt = 0;

    const eineReihe = (fest: number, laenge: number, alsZeile: boolean,
                       vonI: number, bisI: number, zielBis: number): void => {
      quelle.length = 0;
      for (let i = vonI; i <= bisI; i++)
        quelle.push(alsZeile ? A.schreibe(i, fest) : A.schreibe(fest, i));

      /* Die Zahlenreihe, falls es eine ist. */
      const zahlen = quelle.map(a => {
        const zelle = blatt.zellen[a];
        return zelle && typeof zelle.wert === 'number' && !zelle.formel ? zelle.wert : null;
      });
      const alleZahlen = zahlen.length > 1 && zahlen.every(z => z !== null);
      const schritt = alleZahlen
        ? (zahlen[zahlen.length - 1] as number) - (zahlen[zahlen.length - 2] as number) : 0;

      for (let i = bisI + 1; i <= zielBis; i++) {
        const ziel = alsZeile ? A.schreibe(i, fest) : A.schreibe(fest, i);
        const abstand = i - bisI;
        const vorbild = quelle[(abstand - 1) % laenge] || '';
        const zelleV = blatt.zellen[vorbild];

        if (alleZahlen) {
          blatt.zellen[ziel] = { ...(zelleV || {}),
            wert: (zahlen[zahlen.length - 1] as number) + schritt * abstand };
          delete blatt.zellen[ziel].formel;
        } else if (zelleV && zelleV.formel) {
          const dz = alsZeile ? i - (A.lies(vorbild) as any).zeile : 0;
          const ds = alsZeile ? 0 : i - (A.lies(vorbild) as any).spalte;
          blatt.zellen[ziel] = { ...zelleV, formel: verschiebe(zelleV.formel, dz, ds) };
        } else if (zelleV) {
          blatt.zellen[ziel] = { ...zelleV };
        } else {
          delete blatt.zellen[ziel];
        }
        gefuellt++;
      }
    };

    if (runter) {
      const laenge = von.bisZ - von.vonZ + 1;
      for (let s = von.vonS; s <= von.bisS; s++)
        eineReihe(s, laenge, true, von.vonZ, von.bisZ, bisZeile);
      if (bisZeile + 1 > (blatt.zeilen || 0)) blatt.zeilen = bisZeile + 1;
    }
    if (rechts) {
      const laenge = von.bisS - von.vonS + 1;
      for (let z = von.vonZ; z <= von.bisZ; z++)
        eineReihe(z, laenge, false, von.vonS, von.bisS, bisSpalte);
      if (bisSpalte + 1 > (blatt.spalten || 0)) blatt.spalten = bisSpalte + 1;
    }
    return gefuellt;
  };

  /* ==========================================================================
   * 8 · SORTIEREN
   * --------------------------------------------------------------------------
   * Nach einer Spalte, über einen Zeilenbereich. Formeln wandern **nicht**
   * mit angepassten Bezügen — eine sortierte Formel zeigt danach auf ihre
   * neue Nachbarschaft, und das ist auch in Excel so. Wer Formeln sortiert,
   * weiss meist selbst nicht, was er erwartet; wer Zahlen sortiert, schon.
   * ========================================================================*/
  const sortiere = (blatt: any, spalte: number, vonZ: number, bisZ: number, ab = true): boolean => {
    const A = adressen();
    if (!blatt || !A || bisZ <= vonZ) return false;
    const breite = blatt.spalten || 0;

    const zeilen: any[][] = [];
    for (let z = vonZ; z <= bisZ; z++) {
      const eine: any[] = [];
      for (let s = 0; s < breite; s++) eine.push(blatt.zellen[A.schreibe(z, s)] || null);
      zeilen.push(eine);
    }

    const schluessel = (r: any[]): any => (r[spalte] ? r[spalte].wert : '');
    zeilen.sort((x, y) => {
      const a = schluessel(x), b = schluessel(y);
      const leerA = a === '' || a === null || a === undefined;
      const leerB = b === '' || b === null || b === undefined;
      if (leerA && leerB) return 0;
      if (leerA) return 1;                       /* Leeres immer nach unten */
      if (leerB) return -1;
      if (typeof a === 'number' && typeof b === 'number') return ab ? a - b : b - a;
      const va = String(a), vb = String(b);
      return ab ? va.localeCompare(vb, 'de') : vb.localeCompare(va, 'de');
    });

    zeilen.forEach((eine, i) => {
      const z = vonZ + i;
      for (let s = 0; s < breite; s++) {
        const ziel = A.schreibe(z, s);
        if (eine[s]) blatt.zellen[ziel] = eine[s];
        else delete blatt.zellen[ziel];
      }
    });
    return true;
  };

  /** Was in der Zelle steht — für die Anzeige. */
  const wert = (blatt: any, adresse: unknown): any => {
    const zelle = blatt && blatt.zellen ? blatt.zellen[String(adresse ?? '').toUpperCase()] : null;
    return zelle ? zelle.wert : '';
  };

  /** Was der Mensch getippt hat — für die Bearbeitungszeile. */
  const eingabe = (blatt: any, adresse: unknown): string => {
    const zelle = blatt && blatt.zellen ? blatt.zellen[String(adresse ?? '').toUpperCase()] : null;
    if (!zelle) return '';
    if (zelle.formel) return String(zelle.formel);
    return zelle.wert === undefined || zelle.wert === null ? '' : String(zelle.wert);
  };

  return { uebersetze, graphVon, zirkel, reihenfolge, rechne, rechneMappe,
           trenneBlatt, mitBlatt, schluessel, blattUmbenannt,
           neuesBlatt, neueMappe, setze, wert, eingabe, alsFehlerwert,
           verschiebe, bezuegeNachEingriff,
           zeileEinfuegen, zeileLoeschen, spalteEinfuegen, spalteLoeschen,
           fuelle, sortiere };
})();

(window as any).Spreadsheet = Spreadsheet;
