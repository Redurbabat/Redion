/* ============================================================================
 * bereiche/bloecke/arten/blatt.ts — das A4-Blatt
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/bereiche/bloecke/arten/blatt.ts`.
 * ----------------------------------------------------------------------------
 * Ein Blatt Papier in A4, auf das man BEIDES kann: schreiben und malen.
 *
 * Geschrieben wird in gewöhnlichen Redion-Blöcken — sie sind Kinder dieses
 * Blocks. Damit erbt das Blatt alles, was der Editor kann: Slash-Menü,
 * Überschriften, Aufgabenlisten, Verweise, Suche, Export. Ein eigener
 * Texteditor auf dem Blatt wäre eine zweite Maschine für dieselbe Frage
 * (E29), und die zweite ist immer die schlechtere.
 *
 * Gemalt wird auf `Marken` — DERSELBEN Zeichenschicht, die auch die
 * PDF-Seite benutzt (E103). Sie lag zuerst hier; als die PDF-Seite sie
 * brauchte, wurde sie herausgelöst statt abgeschrieben (§34). Was sie kann
 * und warum sie nicht in Bildschirmpunkten rechnet, steht in E100.
 * ==========================================================================*/

const Blatt = (() => {

  /* ==========================================================================
   * PAPIERVORLAGEN
   * --------------------------------------------------------------------------
   * Blanko, liniert, kariert, Punktraster, Millimeterpapier — mehr braucht
   * niemand, und mehr wäre auch nicht mehr nachzuhalten.
   *
   * Es ist NUR Darstellung. Kein zweites Dokumentformat, kein zweiter
   * Speicher: ein Feld am Block, ein Hintergrundbild im Stilblatt. Wer eine
   * Vorlage wechselt, ändert nichts an seinem Text und nichts an seinen
   * Strichen — deshalb kann man beliebig hin- und herwechseln, ohne etwas zu
   * verlieren.
   *
   * DIE ABSTÄNDE STEHEN IN BLATTMASSEN, NICHT IN BILDSCHIRMPUNKTEN. Das ist
   * dieselbe Regel wie in E100, und sie ist hier genauso wichtig: das Blatt
   * folgt der Fensterbreite über `aspect-ratio`. Ein Kästchen in Pixeln wäre
   * am Telefon ein anderes Kästchen als am Rechner — und dann ist es kein
   * Karopapier mehr, sondern ein Muster. Gerechnet wird deshalb in Prozent
   * der Blattmasse, und die Prozentzahlen entstehen aus dem Block: bei einem
   * dreiseitigen Blatt ist die Höhe dreimal A4, und 5 mm sind dort ein
   * Drittel so viel Prozent. Der Abstand auf dem Papier bleibt derselbe.
   * ========================================================================*/
  const MM = 2.8346457;                 /* ein Millimeter in Punkt (72/25,4) */

  /* SIEBEN SEIT E495. Cornell und Notenlinien sind die zwei Papiere, die
     GoodNotes' Vorlagenwähler hat und Redion nicht hatte — und sie sind
     immer noch nur Darstellung: ein Feld am Block, Verläufe im Stilblatt.
     Wer von Cornell auf blanko wechselt, verliert kein Wort und keinen
     Strich.

     WARUM KEIN ISOMETRISCHES PAPIER, obwohl GoodNotes es hat: seine Linien
     laufen schräg, und ein schräger `repeating-linear-gradient` misst seinen
     Abstand SENKRECHT zur Linie — in Prozent der Fläche heisst das, dass
     sich der Abstand mit dem Seitenverhältnis ändert. Am Telefon wären es
     andere Dreiecke als am Rechner (dieselbe Falle wie E100). Das ginge nur
     mit einem gezeichneten Muster, und das ist ein eigener Bogen. */
  const PAPIERE = [
    { id: 'blanko',  name: 'Blanko' },
    { id: 'liniert', name: 'Liniert' },
    { id: 'kariert', name: 'Kariert' },
    { id: 'punkte',  name: 'Punktraster' },
    { id: 'mm',      name: 'Millimeterpapier' },
    { id: 'cornell', name: 'Cornell-Notizen' },
    { id: 'noten',   name: 'Notenlinien' },
  ] as const;

  type PapierArt = typeof PAPIERE[number]['id'];

  /** Was am Block steht — und bei allem Unbekannten: blanko. */
  const papierVon = (block: any): PapierArt => {
    const wert = String(block?.papier ?? 'blanko');
    return PAPIERE.some(x => x.id === wert) ? wert as PapierArt : 'blanko';
  };

  /**
   * Die Abstände als Prozentzahlen, damit CSS sie einsetzen kann.
   *
   * `seitenHoehe` ist die Höhe EINER Seite (A4), `hoehe` die des ganzen
   * Blatts. Bei einem einseitigen Blatt sind beide gleich; bei einem
   * dreiseitigen ist `hoehe` dreimal so gross. Den Unterschied brauchen die
   * Papiere, deren Muster sich je SEITE wiederholt statt je Zeile —
   * Cornell hat eine Kopf- und eine Fusszeile, und die gehören auf jede
   * Seite, nicht alle 8,75 mm.
   */
  const masse = (breite: number, hoehe: number, seitenHoehe = hoehe): Record<string, string> => {
    const quer  = (mm: number) => (mm * MM / breite * 100) + '%';
    const hoch  = (mm: number) => (mm * MM / hoehe  * 100) + '%';
    /* Die Höhe einer SEITE, als Anteil des Blattes — der Takt, in dem sich
       die Seitenmuster wiederholen (und die Kachelhöhe im Stilblatt). */
    const seite = (mm: number) => (mm * MM / hoehe * 100) + '%';
    /* EIN MASS INNERHALB EINER KACHEL, nicht innerhalb des Blattes.
       ═══ Das ist der Unterschied, den das Bild gefunden hat (§55). ═══
       Prozentzahlen IN einem Verlauf beziehen sich auf die KACHEL
       (`background-size`), nicht auf das Element. Die Notenlinien standen
       zuerst in Prozent des Blattes: 3 mm sind dort rund 1 %, und 1 % einer
       27-mm-Kachel ist ein Viertelmillimeter — alle fünf Linien fielen
       aufeinander, und auf dem Papier stand eine Linie je System statt
       fünf. Kein Prüflauf hätte das gemeldet; beide Fassungen zeichnen
       Linien, nur die falsche zeichnet die falschen. */
    const inKachel = (mm: number, kachelMm: number) => (mm / kachelMm * 100) + '%';
    const inSeitenkachel = (mm: number) => (mm * MM / seitenHoehe * 100) + '%';
    return {
      /* EINE SEITE, in Prozent des Blattes — der Takt der Seitenmuster. */
      '--blatt-seite-hoch': (seitenHoehe / hoehe * 100) + '%',
      /* CORNELL (A4, 210 × 297 mm): die Spalte für die Stichworte ist 50 mm
         breit, der Kopf 30 mm hoch, die Zusammenfassung unten 50 mm. Die
         Zahlen sind die des Originals von Walter Pauk, nicht geraten.
         Die Spalte misst quer — dort IST die Kachel so breit wie das Blatt,
         also ist `quer` richtig. Kopf und Fuss messen längs, und dort ist
         die Kachel eine SEITE. */
      '--blatt-cornell-spalte': quer(50),
      '--blatt-cornell-kopf':   inSeitenkachel(30),
      '--blatt-cornell-fuss':   inSeitenkachel(50),
      /* NOTENLINIEN: fünf Linien im Abstand von 3 mm (12 mm Systemhöhe),
         danach 15 mm Luft — ein Takt von 27 mm, also elf Systeme je A4.
         Die Kachel IST der Takt; darum 3/27 und 12/27. */
      '--blatt-noten-linie': inKachel(3, 27),
      '--blatt-noten-satz':  inKachel(12, 27),
      '--blatt-noten-takt':  seite(27),
      /* Schulheft-Lineatur: 8,75 mm. */
      '--blatt-zeile':       hoch(8.75),
      /* Karo: 5 mm, und quer wie hoch derselbe absolute Abstand. */
      '--blatt-karo-quer':   quer(5),
      '--blatt-karo-hoch':   hoch(5),
      /* Millimeterpapier: das feine Netz und die kräftige Zehnerlinie. */
      '--blatt-mm-quer':     quer(1),
      '--blatt-mm-hoch':     hoch(1),
      '--blatt-mm-zehn-quer': quer(10),
      '--blatt-mm-zehn-hoch': hoch(10),
    };
  };

  /* DIE PAPIERWAHL ALS KLAPPE (E359). Vorher standen die fuenf Vorlagen in
     der Reihe und nahmen 210 px — die der Leiste fehlten (L115 Punkt 9).
     Jetzt zeigt EIN Knopf das Papier, das gilt; die fuenf liegen darunter,
     bis man sie braucht. Die Knoepfe selbst bleiben, wie sie waren
     (`data-papier`, `aria-pressed`, ihr Muster) — nur ihr Ort ist neu. */
  const waehler = (jetzt: PapierArt): string => {
    const name = PAPIERE.find(x => x.id === jetzt)?.name || jetzt;
    return '<span class="blatt-trenn"></span>' +
      '<span class="blatt-papiermenue">' +
      `<button class="blatt-papierknopf" data-a="papier" aria-haspopup="true" aria-expanded="false" ` +
      `title="Papier: ${name} — antippen zum Wechseln" aria-label="Papier: ${name}">` +
      `<i data-vorschau="${jetzt}"></i><span class="wort">Papier</span></button>` +
      '<span class="blatt-papierliste" hidden>' +
      PAPIERE.map(art =>
        `<button class="blatt-papierwahl${art.id === jetzt ? ' on' : ''}" ` +
        `data-papier="${art.id}" title="Papier: ${art.name}" aria-label="Papier: ${art.name}" ` +
        `aria-pressed="${art.id === jetzt ? 'true' : 'false'}">` +
        `<i data-vorschau="${art.id}"></i></button>`).join('') +
      '</span></span>';
  };

  const zeichne = (block: any): HTMLElement => {
    const R = SheetSpace;
    const hoehe = Number(block.blattHoehe) || R.A4_HOEHE;
    const breite = Number(block.blattBreite) || R.A4_BREITE;

    const w = document.createElement('div');
    w.className = 'blatt-huelle';

    /* Die Zeichenschicht zuerst — die Leiste braucht ihre Schalter. */
    const schicht = Marken.schicht(block, breite, hoehe, R.A4_HOEHE);

    const jetzt = papierVon(block);
    const werk = Marken.leiste(schicht,
      '<span class="blatt-trenn"></span>' +
      '<button data-a="seite" title="Eine Seite anhängen">' +
        '<span class="zeichen">＋</span><span class="wort">Seite</span></button>' +
      waehler(jetzt));
    w.appendChild(werk);

    const papier = document.createElement('div');
    papier.className = 'blatt-papier';
    /* Die Höhe folgt der Breite über das Seitenverhältnis — dann stimmt das
       Blatt bei jeder Fensterbreite, ohne eine einzige gerechnete Zahl. */
    papier.style.setProperty('aspect-ratio', breite + ' / ' + hoehe);
    papier.dataset.papier = jetzt;
    for (const [name, wert] of Object.entries(masse(breite, hoehe, R.A4_HOEHE)))
      papier.style.setProperty(name, wert);
    /* Gedreht per Huelle (E467); ungedreht haengt das Papier wie immer
       unmittelbar in der Huelle. */
    w.appendChild(R.drehHuelle(block, papier));

    /* Die Klappe: auf, zu, zu bei Tipp daneben, zu bei Escape (§38). Der
       Tipp daneben wird beim Aufmachen angemeldet und beim Zumachen wieder
       abgemeldet — kein Dauerhorcher am Dokument je Blatt. Gehorcht wird
       auf `click`, nicht auf den Zeiger: das Blatt hat keine eigene
       Zeichenschicht, und test174 haelt fest, dass hier kein Zeigerweg
       entsteht — die Klappe ist ein Menue, kein Malen. */
    const papierListe = werk.querySelector<HTMLElement>('.blatt-papierliste');
    const papierKnopf = werk.querySelector<HTMLElement>('.blatt-papierknopf');
    const nebenTipp = (e: Event): void => {
      if (!(e.target as Element)?.closest?.('.blatt-papiermenue')) papierMenue(false);
    };
    const escTaste = (e: KeyboardEvent): void => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      papierMenue(false);
      papierKnopf?.focus();
    };
    const papierMenue = (an: boolean): void => {
      if (!papierListe || !papierKnopf) return;
      papierListe.hidden = !an;
      papierKnopf.setAttribute('aria-expanded', an ? 'true' : 'false');
      if (an) {
        document.addEventListener('click', nebenTipp, true);
        document.addEventListener('keydown', escTaste, true);
      } else {
        document.removeEventListener('click', nebenTipp, true);
        document.removeEventListener('keydown', escTaste, true);
      }
    };

    werk.addEventListener('click', e => {
      const b = (e.target as HTMLElement)?.closest?.('button') as HTMLElement | null;
      if (!b) return;

      if (b.dataset.a === 'papier') { papierMenue(papierListe ? papierListe.hidden : false); return; }

      if (b.dataset.papier) {
        /* NUR DAS FELD, SONST NICHTS. Kein Neuzeichnen der Seite: der Text
           steht in Kindblöcken, die Striche in der Zeichenschicht, und
           beide würden beim Neuaufbau ihren Bearbeitungsstand verlieren —
           der Cursor spränge mitten im Satz weg. Der Hintergrund ist eine
           Eigenschaft des Papiers, also wird das Papier umgestellt. */
        const art = b.dataset.papier;
        Store.updateBlock(block.id, { papier: art });
        /* Das zuletzt gewählte Papier wird die Vorgabe für neue Hefte
           (Notizhefte, E264). Store ist Kern — keine Bereichskopplung. */
        Store.setMeta('heft:papier', art);
        papier.dataset.papier = art;
        werk.querySelectorAll<HTMLElement>('[data-papier]').forEach(k => {
          const an = k.dataset.papier === art;
          k.classList.toggle('on', an);
          k.setAttribute('aria-pressed', an ? 'true' : 'false');
        });
        /* Der Knopf zeigt das neue Papier, und die Klappe geht zu. */
        const name = PAPIERE.find(x => x.id === art)?.name || art;
        papierKnopf?.querySelector('i')?.setAttribute('data-vorschau', art);
        papierKnopf?.setAttribute('title', `Papier: ${name} — antippen zum Wechseln`);
        papierKnopf?.setAttribute('aria-label', `Papier: ${name}`);
        papierMenue(false);
        return;
      }

      if (b.dataset.a !== 'seite') return;
      Store.updateBlock(block.id, {
        blattHoehe: hoehe + R.A4_HOEHE, blattBreite: breite,
        raumVersion: R.RAUM_VERSION
      });
      App.zeichneSeite();
    });

    /* Der Text: gewöhnliche Blöcke, im Satzspiegel. Ein Prozent-Innenabstand
       bezieht sich in CSS auf die BREITE — auch oben und unten. Also EIN
       Wert, sonst wären die Ränder oben schmaler als seitlich. */
    const inhalt = document.createElement('div');
    inhalt.className = 'blatt-inhalt';
    inhalt.style.padding = (R.RAND / breite * 100) + '%';
    /* `Blocks` liegt NICHT auf `window` — bei `module: none` teilen sich alle
       Dateien einen Namensraum, und der Editor hängt sich nirgends an. */
    const kinder = Store.childrenOf(block.id);
    if (!kinder.length) {
      /* EINE ZEILE MUSS DA SEIN (E118). Ohne sie ist das Papier eine Fläche
         ohne einziges bearbeitbares Element — man kann darauf malen und
         sonst nichts. Gemessen an einem Blatt aus dem Slash-Menü:
         `contenteditable` im Block = 0.
         Alle Wege, die bisher funktionierten, legten das Kind von Hand an
         (`PdfEinlesen.alsSeiten` tut es, `test174` tut es). Nur der Weg,
         den ein Mensch geht — `/blatt` tippen —, tat es nicht: `umwandeln`
         kennt keine Anfangskinder.
         Die Spalte daneben löst dasselbe seit E102 genau so. */
      const leer = Store.addBlock(block.id, 'text', { text: '' });
      inhalt.appendChild(Blocks.render(leer, 0));
    } else {
      kinder.forEach((k: any) => { inhalt.appendChild(Blocks.render(k, 0)); });
    }
    papier.appendChild(inhalt);
    papier.appendChild(schicht.flaeche);

    /* Beim Malen soll der Finger nicht durch den Text markieren. */
    const urspruenglich = schicht.setzeWerkzeug;
    schicht.setzeWerkzeug = (wz: string) => {
      urspruenglich(wz);
      papier.classList.toggle('malt', wz !== 'schreiben');
    };

    return w;
  };

  return { zeichne, PAPIERE, papierVon, masse };
})();

(window as any).Blatt = Blatt;
