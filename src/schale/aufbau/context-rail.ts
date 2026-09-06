/* ============================================================================
 * context-rail.js — die Kontextkante: 54 Pixel, die sich merken, wo man ist
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/schale/aufbau/context-rail.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/schale/aufbau/context-rail.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mts` meldet es vorher.
 * ----------------------------------------------------------------------------
 * WAS SIE ERSETZT (E272 Phase F).
 *
 * Die 240 Pixel breite Seitenleiste zeigte 32 Knöpfe, und zwar auf JEDER
 * Seite dieselben (gezählt in E218: 52 Knöpfe im Startbild, 67 mit offener
 * Seite). Zweiundfünfzig Knöpfe, bevor ein Wort geschrieben ist.
 *
 * Die Kante zeigt sechs bis zehn, und zwar die des Ortes, an dem man
 * steht. Sie kostet 54 statt 240 Pixel. Wohin man geht, steht im Reiter
 * „Gehen" (Phase E) — Navigation ist eine Sache, Werkzeug eine andere, und
 * die Seitenleiste war beides gleichzeitig.
 *
 * SIE KENNT KEINEN EINZIGEN BEREICH BEIM NAMEN.
 *
 * Was in ihr steht, liefert `Register.kontext` (Phase F): jeder Bereich
 * meldet sich selbst an. Diese Datei fragt `App.schauplatz()`, holt die
 * Knöpfe und zeichnet. Ein neuer Bereich braucht hier keine Zeile — das
 * ist §5, und es ist der ganze Grund für das Register.
 *
 * DREI DINGE STEHEN TROTZDEM FEST IN DIESER DATEI
 *
 *   · UNTEN: KI · Neu · Einstellungen. Sie gehören keinem Bereich, sondern
 *     der App, und sie sind überall dieselben. Ein Register-Eintrag je
 *     Bereich wäre neunmal dasselbe.
 *
 *   · OBEN: „Seiten". Der Seitenbaum ist die Navigation der Schale und
 *     nicht das Werkzeug eines Bereichs; `Seitenleiste.zeichne()` zeichnet
 *     ihn weiter in `#tree`, und `#tree` wird beim Öffnen in die Lade
 *     GESCHOBEN — nicht kopiert. Ein zweiter Baum wäre ein zweiter Zustand.
 *
 *   · DER SCHAUPLATZ WIRD ÜBERSETZT. `App.schauplatz()` sagt „seite" für
 *     jede offene Seite. Ob das ein Text, eine PDF oder ein Blatt ist,
 *     steht im Baum darunter — `bereichJetzt()` sieht nach und macht daraus
 *     „editor" oder „pdf". Die Alternative wäre, `schale.ts` das
 *     unterscheiden zu lassen; dann wüsste die Schale wieder, was eine PDF
 *     ist.
 *
 * AM TELEFON GIBT ES SIE NICHT. Unter 761 px trägt die untere Fünferleiste
 * (E236/E240) die Navigation, und 54 Pixel von 390 sind ein Siebtel des
 * Bildes. Die Seitenleiste bleibt dort die Schublade, die sie ist.
 * ==========================================================================*/

const Kontextkante = (() => {

  const WURZEL = 'kante';
  const LADE = 'kanten-lade';

  /* KEIN `esc` UND KEIN `innerHTML` IN DIESER DATEI.
     Alles hier wird mit `createElement` und `textContent` gebaut. Namen von
     Seiten und Bereichen sind Nutzertext, und ein Escape, das man einmal
     vergisst, ist ein Loch (§19). Wo nichts zusammengeklebt wird, gibt es
     nichts zu vergessen. */

  const amTelefon = (): boolean => {
    try { return window.matchMedia('(max-width: 760px)').matches; }
    catch { return false; }
  };

  const holen = (name: string): any => {
    try { return (globalThis as any)[name]; } catch { return undefined; }
  };

  /* ══════════════════════════════════════════════════════════════════════
     WO BIN ICH
     ══════════════════════════════════════════════════════════════════════ */

  /**
   * Der Schauplatz, für die Kante übersetzt.
   *
   * `App.schauplatz()` kennt nur „seite". Was für eine Seite es ist, steht
   * im gezeichneten Baum. Gefragt wird der Baum und nicht der Bestand —
   * eine Seite mit einem PDF-Block, die gerade als Text gelesen wird, ist
   * der Editor und nicht die PDF.
   *
   * HIER STANDEN ZWEI TOTE SELEKTOREN (E312). `#page .pdfseite` und
   * `#page .blattraum` haben nie etwas getroffen: der Editor zeichnet
   * `el.className = 'blk b-' + block.type` (editor.ts:433), ein PDF-Block
   * heisst also `.blk.b-pdfseite` und ein Blatt `.blk.b-blatt`. Die Klassen
   * `pdfseite` und `blattraum` gibt es im ganzen Bestand nur hier.
   *
   * Sie sind weg und nicht berichtigt, und zwar mit Absicht: die Zeile
   * darüber beschreibt, was gelten SOLL — nur der Dokumentmodus ist die
   * PDF —, und genau das galt durch den Fehler ohnehin schon. Sie
   * „richtig" zu machen hätte das Verhalten geändert, nicht repariert.
   */
  const bereichJetzt = (): string => {
    let wo = 'leer';
    try { wo = String(App.schauplatz() || 'leer'); } catch { wo = 'leer'; }
    if (wo !== 'seite') return wo;
    try {
      if (document.body.classList.contains('dokument')) return 'pdf';
      /* EINE SEITE, DIE NUR EINE DATENBANK ZEIGT, IST EINE DATENBANK (L95).
         Und eine Seite mit Text davor und danach ist es NICHT — dort will
         man den Editor, und die Kante darf ihn nicht wegnehmen. Gemessen
         wird deshalb nicht „ist eine Datenbank da", sondern „ist ausser ihr
         nichts da": jeder Block der Seite trägt eine.
         Nachgemessen am 1. September: reine Datenbankseite 1 Block / 1 mit
         Datenbank, Mischung 3 / 1, reine Textseite 1 / 0. */
      const bloecke = [...document.querySelectorAll('#page .blk')];
      const mitDb = bloecke.filter(b => b.querySelector('.db'));
      if (mitDb.length && mitDb.length === bloecke.length) return 'datenbank';
    } catch { /* ohne Baum bleibt es der Editor */ }
    return 'editor';
  };

  /* ══════════════════════════════════════════════════════════════════════
     DIE LADE
     ══════════════════════════════════════════════════════════════════════ */

  /** Welcher Knopf die Lade gerade offen hat — leer heisst zu. */
  let offenerKnopf = '';
  /** Wohin der Fokus zurückgeht. */
  let herkunft: HTMLElement | null = null;

  const lade = (): HTMLElement | null => document.getElementById(LADE);

  const ladeZu = (fokusZurueck = true): void => {
    const l = lade();
    if (!l) return;
    l.hidden = true;
    l.replaceChildren();
    offenerKnopf = '';
    markiere();
    /* DEN BAUM ZURÜCKHOLEN, BEVOR DIE LADE LEER GERÄUMT WIRD — sonst ist
       `#tree` weg, und `Seitenleiste.zeichne()` zeichnet ins Nichts.
       (Steht deshalb weiter unten in `baumZurueck`, aufgerufen VOR dem
       Leerräumen; hier bleibt nur der Fokus.) */
    if (fokusZurueck && herkunft && document.contains(herkunft)) {
      try { herkunft.focus(); } catch { /* ohne Fokus geht es auch */ }
    }
    herkunft = null;
  };

  /** `#tree` steht normalerweise in der Seitenleiste. Hier ist sein Zuhause. */
  const baumHeim = (): HTMLElement | null =>
    document.getElementById('sidebar');

  const baumZurueck = (): void => {
    const baum = document.getElementById('tree');
    const heim = baumHeim();
    if (!baum || !heim || baum.parentElement === heim) return;
    /* Vor den Fuss, also dorthin, wo er in `index.html` steht. */
    const fuss = heim.querySelector('.side-fuss');
    if (fuss) heim.insertBefore(baum, fuss); else heim.appendChild(baum);
  };

  /**
   * Die Lade mit dem füllen, was ein Knopf liefert.
   *
   * Ein Sonderfall, und nur einer: „Seiten" bekommt den echten `#tree`
   * hineingeschoben. Alles andere sind Zeilen aus `Register.kontext`.
   */
  const ladeAuf = (knopf: any, quelleKnopf: HTMLElement | null): void => {
    const l = lade();
    if (!l) return;
    baumZurueck();
    l.replaceChildren();

    const kopf = document.createElement('div');
    kopf.className = 'kl-kopf';
    const titel = document.createElement('b');
    titel.textContent = String(knopf.name || '');
    const zu = document.createElement('button');
    zu.type = 'button';
    zu.className = 'kl-zu';
    zu.setAttribute('aria-label', 'Schliessen (Esc)');
    zu.textContent = '✕';
    zu.addEventListener('click', () => ladeZu());
    kopf.appendChild(titel);
    kopf.appendChild(zu);
    l.appendChild(kopf);

    const koerper = document.createElement('div');
    koerper.className = 'kl-koerper';

    if (knopf.id === 'seiten') {
      const baum = document.getElementById('tree');
      if (baum) {
        koerper.appendChild(baum);
        try { holen('Seitenleiste')?.zeichne?.(); }
        catch { /* ohne Baum bleibt die Lade leer, aber offen */ }
      } else {
        koerper.appendChild(satz('Der Seitenbaum ist gerade nicht da.'));
      }
    } else {
      const zeilen = Register.kontext.zeilen(knopf);
      if (!zeilen.length) {
        koerper.appendChild(satz('Hier steht gerade nichts.'));
      } else {
        for (const z of zeilen) koerper.appendChild(zeile(z));
      }
    }
    l.appendChild(koerper);

    /* DER ARBEITSSTAPEL steht unten in JEDER Lade — er sagt, was offen
       ist, und das ist überall dieselbe Frage. Er ist eine ANSICHT auf
       Vorhandenes und kein zweiter Bestand. */
    const stapel = Register.kontext.stapel();
    if (stapel.length) {
      const st = document.createElement('div');
      st.className = 'kl-stapel';
      const t = document.createElement('div');
      t.className = 'kl-grp';
      t.textContent = 'Arbeitsstapel';
      st.appendChild(t);
      for (const z of stapel.slice(0, 8)) st.appendChild(zeile(z));
      l.appendChild(st);
    }

    /* DIE ZEICHEN NACHTRAGEN — dasselbe `fuelle`, das das Band und die
       Kante nutzen. Ohne das steht in der Lade eine Liste ohne Bilder:
       jede Zeile trägt ein `data-sym`, aber niemand hat es eingesetzt.
       (Auf dem Bild der Blöcke-Lade sofort zu sehen.) */
    if (Register?.symbole?.fuelle) {
      try { Register.symbole.fuelle(l); }
      catch { /* ohne Zeichen bleibt der Name, und der ist die Hauptsache */ }
    }

    l.hidden = false;
    offenerKnopf = String(knopf.id || '');
    herkunft = quelleKnopf;
    markiere();
    /* Den Fokus hinein, aber nicht mit Gewalt: steht er schon in der Lade
       (zweiter Klick auf denselben Knopf), bleibt er, wo er ist. */
    if (!l.contains(document.activeElement)) {
      const erstes = l.querySelector<HTMLElement>('button, [tabindex]:not([tabindex="-1"])');
      erstes?.focus();
    }
  };

  const satz = (text: string): HTMLElement => {
    const d = document.createElement('p');
    d.className = 'kl-leer';
    d.textContent = text;
    return d;
  };

  const zeile = (z: any): HTMLElement => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'kl-zeile' + (z.an ? ' ist-an' : '');
    if (z.an) b.setAttribute('aria-current', 'true');
    if (z.zeichen) {
      const s = document.createElement('span');
      s.dataset['sym'] = String(z.zeichen);
      b.appendChild(s);
    }
    const t = document.createElement('span');
    t.className = 'kl-t';
    const n = document.createElement('b');
    n.textContent = String(z.name || '');
    t.appendChild(n);
    if (z.unter) {
      const u = document.createElement('i');
      u.textContent = String(z.unter);
      t.appendChild(u);
    }
    b.appendChild(t);
    b.addEventListener('click', () => {
      try { z.tun(); } catch { /* eine tote Zeile schliesst nicht die Lade */ }
    });
    return b;
  };

  /** Welcher Kantenknopf gerade gedrückt aussieht. */
  const markiere = (): void => {
    const w = document.getElementById(WURZEL);
    if (!w) return;
    w.querySelectorAll<HTMLElement>('.k-knopf').forEach(k => {
      const an = !!offenerKnopf && k.dataset['k'] === offenerKnopf;
      k.classList.toggle('ist-an', an);
      k.setAttribute('aria-expanded', an ? 'true' : 'false');
    });
  };

  /* ══════════════════════════════════════════════════════════════════════
     DIE ORTE (E388)
     ----------------------------------------------------------------------
     WOHIN MAN GEHT, STAND IM BAND. Seit E272 Phase E lag die Navigation im
     Reiter „Gehen", und seit dem ruhigen Band (E383) liegt sie hinter
     einem zugeklappten Band: gemessen am 3. September brauchte „Heute" am
     Rechner zwei Klicks von einem Zustand aus, in dem KEIN Reiter dasteht.
     Der Prüfbericht nennt es F02, Auftrag 01 nennt es Schritt 2, und beide
     sagen dasselbe: ein Ort ist kein Werkzeug.

     KEIN ZWEITER KATALOG. Die fünf Hauptwege stehen im Navigationsregister
     und tragen dort seit E388 `haupt: true`. Alles Übrige holt die Lade
     aus `Register.menueband.orte()` — derselben Liste, die auch „Gehen"
     zeichnet. Zwei Listen, die dasselbe behaupten, laufen auseinander
     (§8, E160).

     UND SIE FRAGT NACH ORTEN, NICHT NACH EINEM REITERBLATT. Der erste
     Entwurf holte sie über den Reiter „Gehen"; `test272 §14` hat das
     gefangen, und zwar zu Recht: sobald dieser Reiter das Band verlässt,
     wäre die Leiste still leer gewesen. `orte()` gibt es, damit die Frage
     überlebt, wo die Antwort gerade wohnt.

     (Der Name des Reiter-Griffs steht hier bewusst NICHT ausgeschrieben:
     der Wächter sucht das Wort, nicht den Aufruf — derselbe Stolperstein,
     den `test272` bei `innerHTML` schon einmal beschreibt.)
     ══════════════════════════════════════════════════════════════════════ */

  /**
   * ALLE Hauptwege des Registers — auch die, die der ruhige Modus verbirgt.
   *
   * Sechs seit dem 6. September: Bibliothek, Notizhefte, Lernzentrum
   * (die in der Leiste stehen) und Heute, Elektrotechnik, Aufgaben (mit
   * `ruhig: false`, hinter „Mehr Orte"). `ortJetzt()` fragt DIESE Liste:
   * wer auf „Heute" steht, steht auf einem Hauptweg, auch wenn dessen
   * Knopf gerade nicht da ist — und das soll die Leiste sagen.
   */
  const alleHauptOrte = (): any[] => {
    try {
      return (Register?.navigation?.alle?.() || [])
        .filter((e: any) => e && e.haupt === true && typeof e.tun === 'function')
        .sort((a: any, b: any) => (a.hauptRang ?? a.rang) - (b.hauptRang ?? b.rang));
    } catch { return []; }
  };

  /** Die wenigen, die in der Leiste stehen. Im ruhigen Modus ohne `ruhig: false`. */
  const hauptOrte = (): any[] =>
    alleHauptOrte().filter((e: any) =>
      typeof Ruhig === 'undefined' || !Ruhig.an() || e.ruhig !== false);

  /**
   * Alles andere, wohin man gehen kann — für die Lade hinter „Mehr Orte".
   *
   * Die Gruppennamen des Bandes reisen als `unter` mit: die Lade zeichnet
   * sie als zweite Zeile, und damit steht bei „Wochenrückblick" auch
   * „Planung & Lernen". Ohne das ist es eine Liste aus zwanzig Wörtern.
   */
  const weitereOrte = (): any[] => {
    /* WAS MAN NICHT SCHON SIEHT — und das ist seit E395 nicht mehr dasselbe
       wie „die fünf Hauptwege". Bei wenig Höhe faltet `kanteAnpassen()` die
       Orte auf zwei zusammen; fragte man hier weiter das Register, wären die
       vier ausgeblendeten NIRGENDS mehr: nicht in der Leiste, weil gefaltet,
       und nicht in der Lade, weil „steht ja schon da". Gemessen bei
       844 × 390 war genau das der Fall — „Heute" und „Lernzentrum" waren
       nicht erreichbar.

       Also die Leiste selbst fragen. Steht sie noch nicht (der allererste
       Aufbau), gilt wieder das Register. */
    let sichtbar: string[] = [];
    try {
      sichtbar = Array.from(document.querySelectorAll<HTMLElement>('#' + WURZEL + ' .k-ort'))
        .map(b => String(b.dataset['k'] || ''));
    } catch { sichtbar = []; }
    const schon = new Set(sichtbar.length
      ? sichtbar
      : hauptOrte().map((e: any) => String(e.id)));
    const raus: any[] = [];
    try {
      for (const g of (Register?.menueband?.orte?.() || [])) {
        for (const e of (g.eintraege || [])) {
          const id = String(e?.id ?? '');
          if (!id || schon.has(id) || typeof e.tun !== 'function') continue;
          raus.push({ id, name: String(e.name ?? id),
                      zeichen: String(e.zeichen ?? 'dots'),
                      unter: String(g.gruppe ?? ''), tun: e.tun });
        }
      }
    } catch { /* ohne Bandregister bleibt die Lade leer, aber sie öffnet */ }
    return raus;
  };

  /** Der sechste Knopf: seltene Ziele, hinter einer Lade. */
  const MEHR_ORTE = { bereich: '*', id: 'mehr-orte', name: 'Mehr Orte',
                      zeichen: 'compass', liefern: () => weitereOrte() };

  /**
   * Welcher der fünf Orte gerade gilt.
   *
   * ERST DIE ADRESSE, DANN DER SCHAUPLATZ (E393). Bis dahin wurde nur
   * `App.schauplatz()` gefragt, und gemessen am 4. September traf das bei
   * ZWEI von fünf Orten zu:
   *
   *     Ort              schauplatz()   Adresse                     markiert
   *     Heute            heute          #welt-lernen-heute          Heute ✓
   *     Lernzentrum      heute          #welt-lernen-lernen         Heute ✗
   *     Elektrotechnik   elektro        #elektro                    Elektro ✓
   *     Bibliothek       workspace      #welt-workspace-bibliothek  keiner ✗
   *     Aufgaben         workspace      #welt-workspace-aufgaben    keiner ✗
   *
   * `schauplatz()` bildet den TITEL der Sonderansicht ab, und drei der
   * fünf Orte teilen sich ihren Titel mit einem Nachbarn: Lernzentrum
   * heisst dort „Heute", Bibliothek und Aufgaben heissen „Arbeitsbereich".
   * Auf „Lernzentrum" leuchtete deshalb „Heute" — schlimmer als gar keine
   * Markierung, weil sie an den falschen Ort zeigt.
   *
   * Die ADRESSE unterscheidet sie, denn genau dafür ist sie da. Sie steht
   * als `adresse` im Register neben `schauplatz`; der Schauplatz bleibt
   * als Rückfall für alles, was keine eigene Adresse hat.
   *
   * DASS DIE ADRESSE IM REGISTER STEHT, IST EINE KOPPLUNG — wer sie in der
   * Lernwelt umbenennt, muss sie hier nachziehen. `test390 §1` klickt
   * deshalb alle fünf Orte an und sieht nach, welcher leuchtet; ein
   * umbenannter Weg wird dort rot, nicht still falsch.
   *
   * Ohne Treffer wird NICHTS markiert — eine Markierung, die immer
   * irgendwo steht, sagt nichts (§55.1).
   */
  const ortJetzt = (): string => {
    /* Gegen ALLE Hauptwege, nicht nur die gezeigten: ein Ort, der hinter
       „Mehr Orte" liegt, ist trotzdem der Ort, an dem man steht. */
    const orte = alleHauptOrte();
    let adr = '';
    try { adr = String(location.hash || ''); } catch { adr = ''; }
    if (adr) {
      const genau = orte.find((e: any) => e.adresse && String(e.adresse) === adr);
      if (genau) return String(genau.id);
    }
    let wo = '';
    try { wo = String(App.schauplatz() || ''); } catch { wo = ''; }
    if (!wo) return '';
    /* HIER STAND EIN `!e.adresse` — und es ist wieder weg (E393).
       Der Gedanke war, dass „Heute" sonst gewinnt, sobald man auf
       „Lernzentrum" steht: beide melden den Schauplatz `heute`. Nachgeprüft
       stimmt der Gedanke nicht, denn die Adresse oben trifft vorher und
       kehrt zurück. Die Bedingung liess sich mit keiner Mutation rot
       bekommen — und ein Wächter, der nie rot war, ist eine Behauptung
       (§55.2). Also weg, statt als Zierat stehen zu bleiben. */
    const treffer = orte.find((e: any) =>
      String(e.schauplatz || e.id) === wo);
    return treffer ? String(treffer.id) : '';
  };

  /* ══════════════════════════════════════════════════════════════════════
     DIE KANTE
     ══════════════════════════════════════════════════════════════════════ */

  /** Der Baum-Knopf, den kein Bereich anmeldet — er gehört der Schale. */
  const SEITEN = { bereich: '*', id: 'seiten', name: 'Seiten',
                   zeichen: 'page', liefern: () => [] };

  /** Unten, überall gleich. */
  const FUSS: any[] = [
    { id: 'ki', name: 'Lokale KI', zeichen: 'sparkle',
      tun: () => { try { App.kiPanel(true); } catch { /* ohne KI bleibt der Knopf */ } } },
    { id: 'neu', name: 'Neu erstellen', zeichen: 'plus',
      tun: () => { try { App.erstellenBlatt(); } catch { /* ohne Katalog nichts */ } } },
    { id: 'einstellungen', name: 'Einstellungen', zeichen: 'settings',
      tun: () => { try { holen('Einstellungen')?.oeffne?.(); } catch { /* … */ } } }
  ];

  const knopfBauen = (k: any, klasse: string): HTMLElement => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'k-knopf ' + klasse;
    b.dataset['k'] = String(k.id);
    /* DER NAME STEHT IM `aria-label` UND IM `title`, nicht daneben (§38).
       54 Pixel tragen kein Wort; ein Zeichen ohne Namen ist für ein
       Vorleseprogramm aber gar nichts. */
    b.setAttribute('aria-label', String(k.name));
    b.title = String(k.name);
    const s = document.createElement('span');
    s.dataset['sym'] = String(k.zeichen || 'dots');
    b.appendChild(s);
    const beschriftung = document.createElement('span');
    beschriftung.className = 'k-beschriftung';
    beschriftung.textContent = String(k.name);
    beschriftung.setAttribute('aria-hidden', 'true');
    b.appendChild(beschriftung);
    b.addEventListener('click', () => {
      /* Zweiter Klick auf denselben Knopf schliesst — wie überall. */
      if (typeof k.liefern === 'function' || k.id === 'seiten') {
        if (offenerKnopf === String(k.id)) { ladeZu(); return; }
        ladeAuf(k, b);
        if (typeof k.tun === 'function') { try { (k.tun as any)(b); } catch { /* … */ } }
        return;
      }
      /* DER KNOPF GIBT SICH SELBST MIT (L95). Ein Menü braucht einen Ort,
         an dem es aufgeht, und den kennt die Kante — nicht der Bereich.
         Wer das Argument nicht braucht, merkt nichts davon. */
      try { (k.tun as any)(b); } catch { /* ein toter Griff lässt die Kante stehen */ }
    });
    return b;
  };

  /** Ein Knopf plus Abstand. Gemessen, nicht geraten: 42 + 2. */
  const KNOPF_PLATZ = 44;

  /**
   * WAS NICHT PASST, WIRD NICHT ABGESCHNITTEN (E388).
   *
   * Seit die Orte oben Platz brauchen, reicht die Höhe auf kleinen
   * Bildschirmen nicht mehr für alles. Gemessen auf einem 1280×720-Laptop:
   * der mittlere Abschnitt bekommt 259 Pixel für 308 — zwei Knöpfe stehen
   * unter der Kante.
   *
   * ERST STAND HIER EIN ROLLBALKEN. Er war nicht zu sehen: Chromium
   * zeichnet hier Überlagerungsbalken, gemessen `offsetWidth 53 /
   * clientWidth 53` — der Balken belegt null Pixel und blendet sich nach
   * dem Rollen aus. Auf dem Bildschirmfoto war schlicht nichts zu sehen,
   * und das ist genau der Fehler aus §55.1: die Werkzeugleiste, die aus
   * dem Bild ragt.
   *
   * Also gar nicht rollen. Was nicht passt, geht hinter einen `···`-Knopf
   * in dieselbe Lade, die auch „Mehr Orte" öffnet — ein Knopf, den man
   * sieht, statt eines Randes, den man nicht sieht.
   *
   * DER ABSCHNITT WIRD DAFÜR EIN ZWEITES MAL GEZEICHNET, und zwar erst,
   * wenn die Masse stehen: `Register.symbole.fuelle` tauscht Platzhalter
   * gegen SVG, und vorher ist die Höhe eine andere.
   */
  const werkzeugeAnpassen = (oben: HTMLElement, knoepfe: any[],
                             platz?: number): void => {
    let hoehe = 0;
    try {
      /* `platz` kommt von `kanteAnpassen()` und sagt, wie viel diese Gruppe
         WIRKLICH bekommt. Ohne ihn misst sie sich selbst — das war bis E395
         der einzige Weg und ging genau dann daneben, wenn es darauf ankam:
         `.k-oben` ist `flex:1` und wurde bei wenig Höhe auf NULL gequetscht.
         Null Pixel meldet keinen Überlauf, also fiel die Zeile darunter aus
         und die sieben Werkzeuge verschwanden ohne Ersatz. */
      hoehe = platz === undefined ? oben.clientHeight : platz;
      if (platz === undefined && oben.scrollHeight - oben.clientHeight <= 2) return;
    } catch { return; }
    if (hoehe < KNOPF_PLATZ * 2) hoehe = KNOPF_PLATZ * 2;   /* mindestens „Seiten" und `···` */
    if (typeof Ruhig !== 'undefined' && Ruhig.an()) hoehe = KNOPF_PLATZ * 2;

    /* Ein Platz geht an „Seiten", einer an den `···`-Knopf. */
    const zeigen = Math.max(0, Math.floor(hoehe / KNOPF_PLATZ) - 2);
    if (zeigen >= knoepfe.length) return;

    const rest = knoepfe.slice(zeigen);
    oben.replaceChildren();
    oben.appendChild(knopfBauen(SEITEN, 'k-seiten'));
    for (const k of knoepfe.slice(0, zeigen)) {
      oben.appendChild(knopfBauen(k, 'k-bereich'));
    }
    oben.appendChild(knopfBauen({
      bereich: '*', id: 'mehr-werkzeuge',
      name: typeof Ruhig !== 'undefined' && Ruhig.an() ? 'Werkzeuge'
        : rest.length + (rest.length === 1 ? ' weiteres Werkzeug' : ' weitere Werkzeuge'),
      zeichen: 'dots',
      /* Ein Werkzeug, das selbst eine Lade öffnet, hat kein `tun` — dann
         wird SEINE Lade geöffnet statt einer leeren Zeile. */
      liefern: () => rest.map((k: any) => ({
        id: k.id, name: k.name, zeichen: k.zeichen,
        tun: () => {
          if (typeof k.tun === 'function') {
            try { (k.tun as any)(); } catch { /* eine tote Zeile bleibt still */ }
          } else { ladeAuf(k, null); }
        }
      }))
    }, 'k-bereich k-mehr'));

    if (Register?.symbole?.fuelle) {
      try { Register.symbole.fuelle(oben); }
      catch { /* ohne Zeichen bleibt der Name im aria-label */ }
    }
  };

  /* ==========================================================================
   * WENN DIE KANTE ZU KURZ IST (E395, Audit F13)
   * --------------------------------------------------------------------------
   * GEMESSEN AM 4. SEPTEMBER bei 844 × 390 — ein Telefon quer, ein iPad im
   * geteilten Bild, ein flaches Fenster. Die Kante ist dort 353 px hoch, ihr
   * Inhalt braucht 424, und `overflow` steht auf `hidden`:
   *
   *     .k-orte    6 Knöpfe   269 px
   *     .k-oben    7 Knöpfe     0 px   (auf null gequetscht, `flex:1`)
   *     .k-unten   3 Knöpfe   137 px   beginnt bei 281 → 65 px draussen
   *
   * ACHT KNÖPFE WAREN NICHT ZU ERREICHEN, darunter Suche, Neu und
   * Einstellungen — und die untere Telefonleiste greift hier nicht, weil sie
   * bei 760 px Breite endet und 844 breiter ist. Auf einem quer gehaltenen
   * Telefon gab es also keinen Weg zu „Neu".
   *
   * DIE REIHENFOLGE, WER PLATZ ABGIBT, ist die Aussage dieses Abschnitts:
   *
   *   1. Die Werkzeuge (`.k-oben`) falten sich zuerst — sie hängen am Ort
   *      und stehen ohnehin schon hinter einem `···`.
   *   2. Dann die Orte (`.k-orte`): es bleibt der, an dem man steht, plus
   *      „Mehr Orte". Der Rest steht in der Lade, die es dafür schon gibt.
   *   3. `.k-unten` gibt NICHTS ab. KI, Neu und Einstellungen sind das,
   *      was man überall braucht; sie wegzufalten hiesse, den Ausweg
   *      wegzufalten.
   * ======================================================================== */
  const kanteAnpassen = (w: HTMLElement, oben: HTMLElement,
                         orte: HTMLElement, knoepfe: any[]): void => {
    /* GEMESSEN, NICHT GERECHNET. Der erste Anlauf schätzte die Höhe der
       Ortsgruppe als `Anzahl × 44` und lag um fünf Pixel daneben — Polster,
       Rand und Abstand der Gruppe zählen mit. Fünf Pixel zu viel Budget
       heisst ein Werkzeug zu viel, und `test387` meldete prompt drei Pixel
       Überlauf. Also die echte Höhe nehmen. */
    const hoch = (el: Element | null): number =>
      el ? Math.ceil(el.getBoundingClientRect().height) : 0;

    let ganz = 0;
    try { ganz = w.clientHeight; } catch { return; }
    if (!ganz) return;
    const frei = ganz - hoch(w.querySelector('.k-unten'));

    /* FALTEN UND NACHSEHEN, statt genauer zu rechnen. 44 Pixel je Knopf ist
       eine Näherung — dazu kommen zwei Pixel Abstand zwischen je zweien, und
       bei sechs Knöpfen sind das zehn. Wer das in die Formel schreibt,
       schreibt am nächsten Stilwechsel wieder daneben. Also einmal falten,
       messen, und wenn es immer noch überläuft, einen Platz weniger geben.
       Die Schleife ist beschränkt und endet spätestens bei zwei Knöpfen. */
    const werkzeugePassend = (budget: number): void => {
      let platz = budget;
      for (let runde = 0; runde < 12; runde++) {
        werkzeugeAnpassen(oben, knoepfe, Math.max(0, platz));
        if (oben.scrollHeight - oben.clientHeight <= 1) return;
        platz -= KNOPF_PLATZ;
        if (platz < KNOPF_PLATZ * 2) return;
      }
    };

    /* 1 — die Werkzeuge falten, mit dem, was neben den Orten übrig ist. */
    werkzeugePassend(frei - hoch(orte));

    /* 2 — passt es immer noch nicht, falten sich auch die Orte. Zwei Knöpfe
           bleiben: wo man ist, und der Weg zu allem anderen. Gefragt wird
           der WIRKLICHE Überlauf der Kante, nicht noch eine Rechnung. */
    if (w.scrollHeight - w.clientHeight <= 1) return;
    const orteZahl = orte.children.length;
    if (orteZahl <= 2) return;

    const hier = ortJetzt();
    const behalten: Element[] = [];
    for (const kind of Array.from(orte.children)) {
      const id = (kind as HTMLElement).dataset['k'] || '';
      if (id === 'mehr-orte' || (hier && id === hier)) behalten.push(kind);
    }
    /* Ohne Treffer (man steht anderswo) bleibt der erste Ort stehen, damit
       die Gruppe nicht nur aus „Mehr Orte" besteht. */
    if (behalten.length < 2 && orte.children[0]) behalten.unshift(orte.children[0]);
    orte.replaceChildren(...behalten);

    /* 3 — und jetzt haben die Werkzeuge mehr Platz als eben. Noch einmal
           verteilen, sonst stünde dort ein `···` über einer halb leeren
           Spalte. `werkzeugeAnpassen` baut aus `knoepfe` neu auf, also
           kommt zurück, was vorhin zu viel war. */
    werkzeugePassend(frei - hoch(orte));
  };

  /**
   * Die Kante für den Ort zeichnen, an dem man gerade steht.
   *
   * Sie wird bei jedem Wechsel neu gebaut. Das ist billig (zehn Knöpfe) und
   * spart den ganzen Abgleich, welcher Knopf jetzt weg muss — der Fehler,
   * an dem die Seitenleiste jahrelang gelitten hat.
   */
  const zeichne = (): void => {
    const w = document.getElementById(WURZEL);
    if (!w) return;
    if (amTelefon()) { w.hidden = true; return; }

    const bereich = bereichJetzt();
    let knoepfe: any[] = [];
    try { knoepfe = Register.kontext.fuer(bereich) || []; }
    catch { knoepfe = []; }
    const ruhig = typeof Ruhig !== 'undefined' && Ruhig.an();
    if (ruhig) knoepfe = [...knoepfe, ...FUSS.filter(k => k.id === 'ki')];

    w.replaceChildren();
    w.hidden = false;
    w.dataset['bereich'] = bereich;

    /* ZUERST DIE ORTE (E388), dann die Werkzeuge des Ortes. Die Reihenfolge
       ist die Aussage: wohin man geht, steht über dem, was man dort tut. */
    const orte = document.createElement('div');
    orte.className = 'k-orte';
    const hier = ortJetzt();
    let gezeigt = false;
    for (const o of hauptOrte()) {
      const b = knopfBauen(o, 'k-ort');
      if (hier && String(o.id) === hier) {
        b.classList.add('ist-hier');
        b.setAttribute('aria-current', 'page');
        gezeigt = true;
      }
      orte.appendChild(b);
    }
    const mehr = knopfBauen(MEHR_ORTE, 'k-ort k-mehr');
    /* WER HINTER „MEHR ORTE" STEHT, LEUCHTET DORT (6. September).
       Heute, Elektrotechnik und Aufgaben sind Hauptwege ohne eigenen Knopf
       im ruhigen Modus. Stünde man dort und nichts leuchtete, sähe die
       Leiste aus wie im Posteingang — und das ist die Markierung, die
       nichts sagt (§55.1). Also leuchtet der Knopf, der dorthin führt.
       Ohne Treffer (Posteingang, eine Seite) leuchtet weiterhin nichts:
       test390 §2 hält die Gegenprobe. */
    if (hier && !gezeigt) {
      mehr.classList.add('ist-hier');
      mehr.setAttribute('aria-current', 'page');
    }
    orte.appendChild(mehr);
    w.appendChild(orte);

    const oben = document.createElement('div');
    oben.className = 'k-oben';
    oben.appendChild(knopfBauen(SEITEN, 'k-seiten'));
    for (const k of knoepfe) oben.appendChild(knopfBauen(k, 'k-bereich'));
    w.appendChild(oben);

    const unten = document.createElement('div');
    unten.className = 'k-unten';
    for (const k of FUSS.filter(k => !ruhig || k.id === 'einstellungen')) {
      unten.appendChild(knopfBauen(k, 'k-fuss'));
    }
    w.appendChild(unten);

    if (Register?.symbole?.fuelle) {
      try { Register.symbole.fuelle(w); }
      catch { /* ohne Zeichen bleibt der Name im aria-label */ }
    }

    /* ERST NACH DEM ZEICHNEN DER SYMBOLE MESSEN. Vorher stehen Platzhalter
       da und die Höhe stimmt nicht. */
    try { requestAnimationFrame(() => kanteAnpassen(w, oben, orte, knoepfe)); }
    catch { kanteAnpassen(w, oben, orte, knoepfe); }

    /* Eine offene Lade, deren Knopf es hier nicht mehr gibt, muss zu —
       sonst steht sie über einem Bereich, zu dem sie nicht gehört. */
    if (offenerKnopf && !w.querySelector('.k-knopf[data-k="' + offenerKnopf + '"]')) {
      baumZurueck();
      ladeZu(false);
    } else {
      markiere();
    }
  };

  /** Auf oder zu — für Strg + Umschalt + Backslash. */
  const schalten = (): void => {
    const w = document.getElementById(WURZEL);
    if (!w) return;
    if (amTelefon()) return;
    const zu = w.hidden;
    w.hidden = !zu;
    if (!zu) { baumZurueck(); ladeZu(false); }
    try { Store.setMeta('kanteZu', !zu); } catch { /* ohne Merker gilt es nur jetzt */ }
  };

  /** Die Lade auf oder zu — für Strg + M. Öffnet den ersten Knopf. */
  const ladeSchalten = (): void => {
    if (offenerKnopf) { baumZurueck(); ladeZu(); return; }
    const w = document.getElementById(WURZEL);
    const erster = w?.querySelector<HTMLElement>('.k-knopf');
    erster?.click();
  };

  /* ══════════════════════════════════════════════════════════════════════
     AUFBAU
     ══════════════════════════════════════════════════════════════════════ */

  let gebunden = false;

  /**
   * Einmal beim Start. Legt Kante und Lade in `#main` an — beide fehlen in
   * `index.html`, weil sie erst etwas zeigen können, wenn das Register
   * geantwortet hat (dasselbe Prinzip wie beim Menüband).
   */
  const binde = (): void => {
    if (gebunden) return;
    const main = document.getElementById('main');
    if (!main) return;
    gebunden = true;

    const w = document.createElement('aside');
    w.id = WURZEL;
    w.setAttribute('role', 'toolbar');
    w.setAttribute('aria-orientation', 'vertical');
    w.setAttribute('aria-label', 'Werkzeuge dieses Bereichs');
    w.hidden = true;

    const l = document.createElement('div');
    l.id = LADE;
    l.setAttribute('role', 'region');
    l.setAttribute('aria-label', 'Ausklappbare Werkzeuge');
    l.hidden = true;

    /* Hinter das Menüband, vor alles andere: das Band steht oben über der
       ganzen Breite, die Kante darunter am linken Rand. */
    const band = document.getElementById('menueband');
    if (band && band.nextSibling) {
      main.insertBefore(w, band.nextSibling);
      main.insertBefore(l, w.nextSibling);
    } else {
      main.insertBefore(w, main.firstChild);
      main.insertBefore(l, w.nextSibling);
    }

    /* Esc schliesst die Lade — aber nur, wenn kein Dialog davor steht.
       `schale.ts` räumt bei Esc die oberste `.overlay` weg; wer beides
       gleichzeitig schliesst, nimmt einem Klick zwei Wirkungen. */
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || !offenerKnopf) return;
      if (document.querySelector('.overlay, .menu')) return;
      baumZurueck();
      ladeZu();
    });

    /* Ein Klick daneben schliesst auch. `pointerdown` und nicht `click`:
       wer in den Inhalt fasst, will dort arbeiten und nicht erst die Lade
       wegklicken. */
    document.addEventListener('pointerdown', (e: Event) => {
      if (!offenerKnopf) return;
      const ziel = e.target instanceof Element ? e.target : null;
      if (!ziel) return;
      if (ziel.closest('#' + LADE) || ziel.closest('#' + WURZEL)) return;
      baumZurueck();
      ladeZu(false);
    });

    /* Der Ort hat gewechselt — andere Knöpfe. */
    window.addEventListener('redion:schauplatz', () => zeichne());

    /* UND DIE ADRESSE, DENN SIE KOMMT SPÄTER (E393). Gemessen: `zeigeSonder`
       setzt zuerst die Adresse aus dem TITEL (`#heute`), meldet dann den
       Schauplatz — und erst danach setzt die Lernwelt ihre eigene Adresse
       (`#welt-lernen-lernen`). Wer nur auf `redion:schauplatz` hört, liest
       also die Adresse von vorletzter Sekunde und markiert den falschen
       Ort. Der erste Versuch dieses Bogens tat genau das und markierte
       daraufhin GAR NICHTS mehr — schlechter als vorher.

       Ein `hashchange` mehr kostet ein Neuzeichnen der Kante; das
       geschieht bei jedem Ortswechsel ohnehin. */
    window.addEventListener('hashchange', () => zeichne());

    /* Am Telefon ist sie aus; beim Drehen oder Aufziehen ändert sich das. */
    try {
      window.matchMedia('(max-width: 760px)').addEventListener('change', () => zeichne());
    } catch { /* alte Browser bekommen die Kante beim nächsten Wechsel */ }

    zeichne();
    /* Ein gemerktes „zu" gilt weiter — aber nur am Rechner. */
    try {
      if (Store.getMeta('kanteZu', false) === true && !amTelefon()) w.hidden = true;
    } catch { /* ohne Merker steht sie offen */ }
  };

  return { binde, zeichne, schalten, ladeSchalten, bereichJetzt,
           ladeZu: () => { baumZurueck(); ladeZu(); },
           offen: () => !!offenerKnopf };
})();

(window as any).Kontextkante = Kontextkante;
