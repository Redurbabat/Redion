/* ============================================================================
 * bereiche/pdf/einlesen.ts — ein PDF wird zu Seiten
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/bereiche/pdf/einlesen.ts`.
 * ----------------------------------------------------------------------------
 * Der Weg vom Dokument zu beschreibbaren Seiten, mit vier Regeln:
 *
 *   Das Original bleibt   Es wird als Anhang abgelegt, Byte für Byte, und
 *                         nie überschrieben.
 *   Eine Seite zur Zeit   Nie zwei Leinwände gleichzeitig im Speicher. Eine
 *                         A4-Seite kostet gerastert rund neun Megabyte; bei
 *                         fünfzig Seiten gleichzeitig gibt jedes Telefon auf.
 *   Sichtbarer Fortschritt Ein Skript mit achtzig Seiten braucht Zeit. Wer
 *                         nicht sieht, dass etwas geschieht, drückt noch
 *                         einmal.
 *   Abgeleitet ist abgeleitet  Seitenbilder tragen `abgeleitet: true`. Sie
 *                         gehören nicht in jede Sicherung und nicht in jeden
 *                         Abgleich — sie entstehen in Sekunden neu.
 *
 *   Nichts verschwindet lautlos  Klappt das Lesen nicht — kaputt, mit
 *                         Passwort geschützt, oder der Mensch bricht ab —
 *                         hängt die Datei trotzdem SICHTBAR an der Seite.
 *                         Bytes ablegen und keinen Block bauen hiesse: der
 *                         Mensch zieht etwas herein und sieht nichts (E104).
 *
 * SEIT E104 GIBT ES ZWEI ANORDNUNGEN. Redur hatte es so beschrieben: „wenn
 * ich die pdf hochlade sollte ich neben es … so leeren a4 blatt haben die
 * ich direk dort schreiben kann". Also kann jede Seite ein Notizblatt neben
 * sich bekommen — genauso hoch und breit wie sie selbst, damit links und
 * rechts auf einer Linie liegen.
 *
 *   untereinander    Seite, Seite, Seite. Wie bisher.
 *   nebeneinander    je Seite: columns → spalte(Seite) + spalte(Blatt)
 *
 * GEFRAGT WIRD JEDES MAL, nicht einmal und dann heimlich gemerkt. Die
 * zuletzt gewählte Anordnung steht nur vorn — ein gemerkter Zustand, den
 * man nirgends sieht und nirgends ändert, ist genau die Sorte Falle, die
 * man erst beim dritten PDF bemerkt.
 * ==========================================================================*/

const PdfEinlesen = (() => {
  /* Ab hier wird nicht mehr ungefragt alles gerastert. Achtzig Seiten sind
     rund fünfzehn Megabyte Bilder — das soll ein Mensch entscheiden. */
  const OHNE_FRAGE = 30;

  /* `%PDF-` als Bytes — siehe `alsSeiten`. */
  const PDF_KOPF = [0x25, 0x50, 0x44, 0x46, 0x2d];

  const alsSeiten = async (datei: File, elternId: string): Promise<any> => {
    if (typeof PdfLeser === 'undefined')
      throw new Error('Der PDF-Leser ist nicht geladen.');

    /* Jedes PDF beginnt mit `%PDF-`. Fünf Bytes lesen kostet nichts und
       spart bei einer falsch benannten 20-MB-Datei das vollständige Ablegen
       und Einlesen, bevor jemand merkt, dass es keine ist. Wer hier
       herausfliegt, geht den gewöhnlichen Anhang-Weg — und der legt den
       Block ZUERST an, sodass sofort etwas dasteht.

       VERGLICHEN WIRD ÜBER ZAHLEN, nicht über eine Zeichenkette. Der erste
       Entwurf schrieb `String.fromCharCode(...kopf)`, und `test87` §9 hat
       das zu Recht angestrichen: der Spread reicht jedes Byte als eigenen
       Aufrufparameter weiter und sprengt bei grossen Puffern den Stapel.
       Bei fünf Bytes wäre er harmlos — aber genau so wandert ein Muster
       weiter, und die nächste Stelle hat dann ein Megabyte. */
    const kopf = new Uint8Array(await datei.slice(0, PDF_KOPF.length).arrayBuffer());
    if (PDF_KOPF.some((b, i) => kopf[i] !== b))
      throw new Error('Das ist keine PDF-Datei.');

    const melder = UI.toast('„' + datei.name + '" wird gelesen …', 120000);
    const sageAn = (t: string) => {
      if (melder && melder.textContent !== undefined) melder.textContent = t;
    };

    let griff: any = null;

    /* DAS ORIGINAL ZUERST — es ist das, was zählt. Geht danach etwas schief,
       hat der Mensch trotzdem seine Datei. Geht schon DAS schief, fliegt der
       Fehler nach oben: dann hat noch nichts stattgefunden, und der
       gewöhnliche Anhang-Weg in `werkzeuge.ts` übernimmt von vorn.
       Ausserhalb des grossen `try`, damit `quelle` auch im `catch` da ist. */
    let quelle: any;
    try {
      quelle = await Dateien.ablegen(datei, { blockId: elternId });
    } catch (e: unknown) {
      melder.remove();
      throw e;
    }

    /**
     * Der Rückfall: die Datei hängt SICHTBAR an der Seite, als gewöhnlicher
     * Anhang. Gebraucht wird er, wenn das Lesen scheitert oder der Mensch
     * abbricht.
     *
     * VORHER GAB ES IHN NICHT, und das war ein stiller Verlust: die Bytes
     * lagen in der Ablage, ein Block dazu entstand nie. Wer ein kaputtes PDF
     * hereinzog, sah eine Meldung und danach eine leere Seite. `test173`
     * fiel darüber — mit einem 20 MB grossen „PDF", das keines war. Ein
     * Hinweistext ist kein Ersatz für etwas, das man anklicken kann.
     */
    const nurAnhaengen = async (warum: string): Promise<any> => {
      const b = Store.addBlock(elternId, 'file', {
        text: datei.name, dateiId: quelle.id, typ: datei.type });
      /* Der Datei-Satz zeigt jetzt auf DIESEN Block statt auf die Seite —
         sonst überlebte er das Löschen des Anhangs (E99). */
      try { await Store.dateiPut({ ...quelle, blockId: b.id }); }
      catch { /* der Satz bleibt dann an der Seite; kein Verlust */ }
      App.zeichneSeite();
      UI.toast('„' + datei.name + '" ' + warum);
      return { seiten: 0, quelle, block: b.id };
    };

    try {
      const bytes = new Uint8Array(await datei.arrayBuffer());
      griff = await PdfLeser.oeffne(bytes, async (nochmal: boolean) => {
        if (typeof Dialog === 'undefined') return null;
        melder.textContent = '„' + datei.name + '" ist geschützt.';
        return await Dialog.frage(
          nochmal ? 'Das Passwort stimmte nicht — noch einmal'
                  : 'Passwort für „' + datei.name + '"',
          '', 'passwort');
      });
      const gesamt = griff.seiten;

      /* ---- Anordnung ---------------------------------------------------- */
      const zuletzt = String(Store.getMeta('pdfAnordnung', 'nebeneinander'));
      const knopfSeite = {
        id: 'nebeneinander', text: 'Seite und Notizblatt nebeneinander',
        hinweis: 'Links die Seite, rechts ein leeres Blatt zum Schreiben und ' +
                 'Malen — genauso hoch. Am Telefon liegt das Blatt darunter.' };
      const knopfNur = {
        id: 'untereinander', text: 'Nur die Seiten',
        hinweis: 'Seite für Seite untereinander. Schreiben und malen kannst ' +
                 'du auch direkt darauf.' };
      const anordnung = typeof Dialog !== 'undefined'
        ? await Dialog.wahl({
            titel: datei.name,
            text: 'Wie soll „' + datei.name + '" auf der Seite liegen?',
            knoepfe: [
              ...(zuletzt === 'untereinander' ? [knopfNur, knopfSeite]
                                              : [knopfSeite, knopfNur]),
              { id: '', text: 'Abbrechen',
                hinweis: 'Die Datei bleibt als Anhang liegen' }
            ] })
        : zuletzt;
      if (!anordnung) {
        melder.remove();
        return nurAnhaengen('liegt als Anhang auf der Seite.');
      }
      Store.setMeta('pdfAnordnung', anordnung);
      const daneben = anordnung === 'nebeneinander';

      let bis = gesamt;
      if (gesamt > OHNE_FRAGE) {
        const antwort = typeof Dialog !== 'undefined'
          ? await Dialog.wahl({
              titel: datei.name,
              text: 'Dieses Dokument hat ' + gesamt + ' Seiten.\n\n' +
                    'Jede Seite wird als Bild vorbereitet, damit du darauf ' +
                    'schreiben kannst. Das kostet Zeit und Platz — bis zu ' +
                    Math.max(1, Math.round(gesamt * 0.3)) + ' MB und etwa ' +
                    Math.max(1, Math.round(gesamt * 0.35)) + ' Sekunden.\n\n' +
                    'In die Sicherung kommen diese Bilder nicht; sie lassen ' +
                    'sich jederzeit aus dem Original zurückholen.',
              knoepfe: [
                { id: 'alle',  text: 'Alle ' + gesamt + ' Seiten vorbereiten',
                  hinweis: 'Dauert am längsten, dafür ist alles fertig' },
                { id: 'erste', text: 'Nur die ersten ' + OHNE_FRAGE,
                  hinweis: 'Der Rest bleibt als Anhang erhalten' },
                { id: '', text: 'Abbrechen', hinweis: 'Nur das Original wird angehängt' }
              ] })
          : 'alle';
        if (!antwort) {
          melder.remove();
          return nurAnhaengen('liegt als Anhang auf der Seite.');
        }
        bis = antwort === 'erste' ? OHNE_FRAGE : gesamt;
      }

      const gemacht: string[] = [];
      for (let n = 1; n <= bis; n++) {
        sageAn('Seite ' + n + ' von ' + bis + ' …');
        const geo = await griff.geometrie(n);
        const bild = await griff.alsBild(n);

        /* Nebeneinander: ein Spaltenblock je Seite, mit derselben Hülle wie
           die von Hand angelegten Spalten (E102) — columns → spalte →
           Inhalt. Eine eigene Bauform wäre eine zweite Wahrheit über
           dasselbe Ding. */
        let wohin = elternId;
        let nachher = (): void => { /* nichts danebenzustellen */ };
        if (daneben) {
          const sp = Store.addBlock(elternId, 'columns', { text: '', spalten: 2 });
          const links = Store.addBlock(sp.id, 'spalte', { text: '' });
          const rechts = Store.addBlock(sp.id, 'spalte', { text: '' });
          wohin = links.id;
          nachher = () => {
            /* Das Notizblatt bekommt die MASSE DER SEITE, nicht A4. Ein
               querformatiges PDF neben einem hochkanten Blatt sähe aus wie
               ein Fehler, und die Zeilen links und rechts lägen nie auf
               einer Höhe. */
            const blatt = Store.addBlock(rechts.id, 'blatt', {
              text: '', blattBreite: geo.bw, blattHoehe: geo.bh,
              raumVersion: SheetSpace.RAUM_VERSION });
            Store.addBlock(blatt.id, 'text', { text: '' });
          };
        }

        /* Die SEITE zuerst, das Blatt danach. Bei achtzig Seiten sieht man
           beim Einlesen zu, und ein Spaltenblock mit leerem linken Fach ist
           für den Bruchteil einer Sekunde ein Bild von einem Fehler.

           UND DIE SEITE WEISS GLEICH, WER SIE IST. Vorher entstand sie leer
           und bekam Nummer, Masse und Herkunft erst nach dem Ablegen des
           Bildes nachgereicht. Dazwischen lag ein Block ohne alles — für ein
           paar Millisekunden je Seite, aber lang genug, dass zwei Prüfläufe
           genau dort hineinlasen und `nr: null` fanden. Ein Zustand, der
           nicht vorkommen kann, muss auch nicht behandelt werden.
           Nur `bildDateiId` bleibt ein Nachtrag: die Ablage braucht die
           Block-Kennung, die es vorher noch nicht gibt. Diese eine Lücke
           kennt der Zeichner und schreibt „Seite wird vorbereitet …" hin. */
        /* DER TEXT DER SEITE, damit die Suche sie findet (E107). Er steht
           in `suchtext` und nicht in `text`: `text` ist, was ein Mensch
           geschrieben hat, und die Oberfläche zeigt es an vielen Stellen —
           eine halbe Seite Skript in der Krümelspur wäre keine Verbesserung.
           Anders als die Bilder kommt der Text MIT in die Sicherung: er ist
           klein, und ohne ihn wäre ein eingespieltes Skript stumm, bis
           jemand alle Seiten neu rechnet. */
        const seitenText = await griff.text(n);

        const b = Store.addBlock(wohin, 'pdfseite', {
          text: '', suchtext: seitenText, nr: n, vonSeiten: gesamt,
          bw: geo.bw, bh: geo.bh, dreh: geo.dreh,
          quelleId: quelle.id, raumVersion: SheetSpace.RAUM_VERSION
        });
        nachher();
        const satz = await Dateien.ablegen(
          new File([bild], datei.name.replace(/\.pdf$/i, '') + '-s' + n + '.webp',
                   { type: 'image/webp' }),
          { blockId: b.id, abgeleitet: true });
        Store.updateBlock(b.id, { bildDateiId: satz.id });
        gemacht.push(b.id);
        /* Dem Browser Luft lassen — sonst steht die Oberfläche still. */
        await new Promise(r => setTimeout(r, 0));
      }

      if (melder && melder.remove) melder.remove();

      /* UND DANN GEHT DIE PDF AUCH ALS DOKUMENT AUF (E296).
         Bisher landeten die Seitenbloecke in der laufenden Notizseite:
         zwischen Text und Werkzeugzeile, in Spaltenbreite, unter einem
         Seitenkopf, der ein Drittel des Bildes nahm. Wer eine Vorlesungs-PDF
         einliest, will sie lesen — nicht einen Absatz darin.

         ZWEI BEDINGUNGEN, UND BEIDE SIND WICHTIG:

         `bis > 0` — ohne Seiten gaebe es nichts zu zeigen, und der
         Dokumentmodus liesse sich gar nicht einschalten (`available()`
         zaehlt die Dokumentbloecke).

         `dokumentModus === undefined` — nur beim ERSTEN Mal. Wer den Modus
         schon einmal verlassen hat, steht danach auf `false`, und ein
         zweites Einlesen holt ihn nicht zurueck. Eine Ansicht, die sich
         gegen die Entscheidung des Nutzers wieder einschaltet, ist keine
         Hilfe (§47).

         UND NICHT BEI „NEBENEINANDER". Das ist die dritte Bedingung, und
         sie kam erst durch drei Pruefungen dazu, die genau darueber fielen
         (test177, test178, test228 im vollen Lauf).

         Wer oben „Seite und Notizblatt nebeneinander" waehlt, sagt damit:
         ich will beim Lesen daneben schreiben. Der Dokumentmodus zeigt aber
         EINE Seite und keine Spalten — die eben getroffene Wahl waere
         unsichtbar geworden, ohne Meldung. Eine Ansicht, die die Antwort auf
         ihre eigene Frage ueberschreibt, ist schlimmer als gar keine Frage.

         Bei „Nur die Seiten" gilt das nicht: dort ist genau das gemeint,
         was der Dokumentmodus zeigt. */
      const zielSeite = typeof Links !== 'undefined' ? Links.seiteVon(elternId) : null;
      if (bis > 0 && !daneben && zielSeite && zielSeite.dokumentModus === undefined)
        Store.updateBlock(zielSeite.id, { dokumentModus: true });

      App.zeichneSeite();
      UI.toast(bis + ' von ' + gesamt + ' Seiten aus „' + datei.name + '" vorbereitet');
      return { seiten: bis, gesamt, quelle, bloecke: gemacht };
    } catch (e: unknown) {
      melder.remove();
      const text = e instanceof Error ? e.message : String(e);
      /* Verschlüsselte Dateien sind der häufigste Fall — und der einzige,
         bei dem eine allgemeine Meldung ratlos machen würde. */
      const warum = /password|encrypt/i.test(text)
        /* Seit E110 gibt es die Passwortfrage — wer hier landet, hat sie
           abgebrochen oder dreimal danebengetippt. Der Satz sagt deshalb
           nicht mehr „Redion kann sie nicht öffnen", sondern was los ist. */
        ? 'bleibt ohne Passwort zu — sie liegt als Anhang auf der Seite.'
        : 'liess sich nicht als Seiten lesen (' + text +
          ') — sie liegt als Anhang auf der Seite.';
      /* NICHT weiterwerfen: die Datei ist da und sichtbar. Ein Fehler, der
         nach oben geht, obwohl unten alles aufgeräumt ist, führt nur dazu,
         dass jemand oben noch einmal dasselbe versucht. */
      return await nurAnhaengen(warum);
    } finally {
      if (griff) griff.schliessen();
    }
  };


  /* ==========================================================================
   * SEITENBILDER AUS DEM ORIGINAL ZURÜCKHOLEN
   * --------------------------------------------------------------------------
   * E103 lässt die gerasterten Seitenbilder aus der Sicherung heraus, weil sie
   * „in Sekunden neu entstehen". Der Satz stimmte bisher nur der Möglichkeit
   * nach: NICHTS stellte sie wirklich wieder her. Wer eine `.redion` einspielte,
   * bekam sein Skript zurück — die Marken darauf, die Notizblätter daneben, das
   * Original als Anhang — und lauter leere Seiten mit dem Satz „Für diese Seite
   * gibt es noch kein Bild." Ein Hinweis ohne Ausweg.
   *
   * Jetzt gibt es den Ausweg, und zwar für das GANZE Dokument auf einmal: das
   * Original aufzuschlagen ist der teure Teil, eine einzelne Seite daraus zu
   * zeichnen der billige. Wer eine Seite anklickt, meint das Skript.
   *
   * DIE MASSE WERDEN NICHT NEU GELESEN. `bw`, `bh` und `nr` stehen am Block und
   * bleiben, wie sie sind — die Marken liegen in genau diesem Raum (E100).
   * Käme aus einer neuen Messung eine andere Zahl, läge jeder Strich woanders.
   * ========================================================================*/

  /**
   * Alle Seiten eines Dokuments, die kein Bild haben.
   *
   * „KEIN BILD" HEISST NICHT NUR „KEINE KENNUNG". Nach dem Einspielen einer
   * Sicherung trägt jeder Block seine alte `bildDateiId` — die Datei dahinter
   * ist aber nicht mitgekommen (E103). Eine Kennung, die ins Leere zeigt,
   * ist kein Bild; wer nur auf ihr Vorhandensein sieht, hält genau die
   * Seiten für fertig, um die es hier geht.
   */
  const ohneBild = async (quelleId: string): Promise<any[]> => {
    const kandidaten = (Object.values(Store.cache.blocks) as any[])
      .filter(b => b && b.alive !== false && b.type === 'pdfseite' &&
                   b.quelleId === quelleId)
      .sort((a, b) => (Number(a.nr) || 0) - (Number(b.nr) || 0));
    const offen: any[] = [];
    for (const b of kandidaten) {
      if (!b.bildDateiId) { offen.push(b); continue; }
      const satz = await Store.dateiHolen(b.bildDateiId);
      if (!satz || satz.zustand !== 'fertig') offen.push(b);
    }
    return offen;
  };

  /**
   * Die fehlenden Seitenbilder eines Dokuments neu rechnen.
   * @param quelleId Kennung des abgelegten Originals
   */
  /* WER RECHNET GERADE AN WELCHEM DOKUMENT (E116).
     Jede bildlose Seite bekommt einen eigenen Knopf, und jeder Knopf sperrte
     bisher nur SICH SELBST. Ein zweiter Klick auf einer anderen Seite startete
     einen vollständigen zweiten Lauf über dieselbe Liste: beide legen für
     denselben Block eine Datei ab, aber nur die zuletzt geschriebene steht
     danach in `bildDateiId`. Die andere bleibt als fertiger Datei-Satz mit
     LEBENDEM `blockId` liegen — und `Dateien.verwaist()` sucht nach Sätzen
     ohne Block, findet diesen also grundsätzlich nie. Eine Dateileiche, die
     niemand mehr wegräumen kann.
     Der Schlüssel ist die Kennung des Originals: zwei verschiedene Dokumente
     dürfen sehr wohl nebeneinander rechnen. */
  const laufendeRechnungen = new Map<string, Promise<any>>();

  const neuBerechnen = (quelleId: string): Promise<any> => {
    const schon = laufendeRechnungen.get(quelleId);
    if (schon) return schon;
    const lauf = neuBerechnenWirklich(quelleId)
      .finally(() => { laufendeRechnungen.delete(quelleId); });
    laufendeRechnungen.set(quelleId, lauf);
    return lauf;
  };

  const neuBerechnenWirklich = async (quelleId: string): Promise<any> => {
    const offen = await ohneBild(quelleId);
    if (!offen.length) return { seiten: 0, grund: 'nichts offen' };

    const roh = await Dateien.alsBlob(quelleId);
    if (!roh) {
      /* Das kann echt vorkommen: eine `.json`-Sicherung kennt keine Anhänge,
         also fehlt auch das Original. Dann hilft nur die Datei selbst. */
      UI.toast('Das Original fehlt in diesem Bestand — zieh die PDF-Datei ' +
               'noch einmal herein.');
      return { seiten: 0, grund: 'ohne Original' };
    }

    /* Der Name steht am Datei-Satz, nicht am Block: ein `pdfseite`-Block
       trägt keinen Text. */
    const satzQuelle = await Store.dateiHolen(quelleId);
    const name = String(satzQuelle?.name || 'dem Original');
    const melder = UI.toast('„' + name + '": Seitenbilder werden neu gerechnet …', 120000);
    let griff: any = null;
    let fertig = 0;
    try {
      griff = await PdfLeser.oeffne(new Uint8Array(await roh.arrayBuffer()));
      for (const b of offen) {
        const n = Number(b.nr) || 1;
        if (n > griff.seiten) continue;   /* Seite gibt es im Original nicht */
        /* Links wie rechts dieselbe Zählung. Vorher stand links die
             Seitennummer IM DOKUMENT und rechts die Anzahl der noch zu
             rechnenden Seiten — bei Seite 80 eines Skripts, von dem eine
             fehlt, las man „Seite 80 von 1" (E116). */
        melder.textContent = 'Seite ' + (fertig + 1) + ' von ' + offen.length +
          ' wird gerechnet …';
        /* Wer diese Seite einmal schärfer gerechnet hat, will sie nicht
           beim nächsten Zurückholen wieder grob haben. Die Breite steht am
           Block und kommt mit in die Sicherung (E173). */
        const bild = await griff.alsBild(n, Number(b.bildBreite) || undefined);
        const satz = await Dateien.ablegen(
          new File([bild], 'seite-' + n + '.webp', { type: 'image/webp' }),
          { blockId: b.id, abgeleitet: true });
        /* Fehlt der Suchtext noch — bei allem, was vor E107 eingelesen
           wurde —, kommt er jetzt mit. Das Dokument ist ohnehin offen. */
        const nach: Record<string, unknown> = { bildDateiId: satz.id };
        if (!b.suchtext) nach.suchtext = await griff.text(n);
        Store.updateBlock(b.id, nach);
        fertig++;
        await new Promise(r => setTimeout(r, 0));
      }
      melder.remove();
      App.zeichneSeite();
      UI.toast('„' + name + '": ' + (fertig === 1 ? 'eine Seite ist wieder da'
                                              : fertig + ' Seiten sind wieder da'));
      return { seiten: fertig };
    } catch (e: unknown) {
      melder.remove();
      /* AUCH HIER NEU ZEICHNEN (E116). Bricht es bei Seite 40 von 80 ab,
         sind vierzig Bilder fertig und stehen am Block — sie erschienen nur
         nicht, weil das Neuzeichnen allein am Erfolgsweg hing. Und der Knopf,
         über den man es erneut versuchen würde, stand für immer auf „wird
         gerechnet …". Beides erledigt dieser eine Aufruf. */
      App.zeichneSeite();
      UI.toast('Die Seiten liessen sich nicht neu rechnen: ' +
               (e instanceof Error ? e.message : String(e)));
      return { seiten: fertig, fehler: true };
    } finally {
      if (griff) griff.schliessen();
    }
  };

  /* ========================================================================
   * EINE SEITE SCHÄRFER RECHNEN (L37, E173)
   * ------------------------------------------------------------------------
   * Seiten entstehen bei 1654 px Breite — bei A4 genau 200 dpi, Scan-
   * Qualität. Wer stark hineinzoomt, sieht trotzdem Unschärfe, und L37 hielt
   * das als offene Arbeit fest: eine Seite auf Wunsch feiner rechnen.
   *
   * Alles dafür war schon da und wurde nur nie gerufen: `alsBild` nimmt seit
   * jeher eine Breite entgegen, das Original liegt in der Ablage (E103), und
   * die Marken liegen in SEITENPUNKTEN und nicht in Bildpunkten (E100) —
   * sie bleiben deshalb liegen, wo sie liegen. Das ist der Grund, warum das
   * hier überhaupt gefahrlos geht.
   *
   * Die Grenze ist 3308 px, also 400 dpi bei A4. Darüber wird eine Seite als
   * WebP schnell ein paar Megabyte, und das trägt ein Telefon nicht mehr
   * (§36, §37).
   * ======================================================================*/
  const BREITE_MAX = 3308;

  const schaerfer = async (block: any): Promise<any> => {
    if (!block || block.type !== 'pdfseite') return { ok: false, grund: 'keine PDF-Seite' };
    if (!block.quelleId)
      return { ok: false, grund: 'Ohne das Original lässt sich nichts neu rechnen.' };

    const jetzt = Number(block.bildBreite) || PdfLeser.BREITE_PX;
    if (jetzt >= BREITE_MAX)
      return { ok: false, grund: 'Diese Seite ist schon so fein gerechnet, ' +
                                 'wie Redion es anbietet.' };
    const ziel = Math.min(BREITE_MAX, jetzt * 2);

    const roh = await Dateien.alsBlob(block.quelleId);
    if (!roh)
      return { ok: false, grund: 'Das Original fehlt in diesem Bestand — zieh ' +
                                 'die PDF-Datei noch einmal herein.' };

    const melder = UI.toast('Seite wird feiner gerechnet …', 120000);
    let griff: any = null;
    try {
      griff = await PdfLeser.oeffne(new Uint8Array(await roh.arrayBuffer()));
      const n = Number(block.nr) || 1;
      if (n > griff.seiten) return { ok: false, grund: 'Diese Seite gibt es im Original nicht.' };
      const bild = await griff.alsBild(n, ziel);
      const satz = await Dateien.ablegen(
        new File([bild], 'seite-' + n + '-' + ziel + '.webp', { type: 'image/webp' }),
        { blockId: block.id, abgeleitet: true });

      /* ERST DIE NEUE KENNUNG AN DEN BLOCK, DANN DIE ALTE DATEI WEG.
         Andersherum stünde zwischen beiden Schritten eine Seite ohne Bild da,
         und bricht es dazwischen ab, ist das Bild fort und das neue nicht da.
         In dieser Reihenfolge ist der schlimmste Fall eine Datei zu viel —
         die findet die Pflegeseite (E171). */
      const alt = block.bildDateiId;
      Store.updateBlock(block.id, { bildDateiId: satz.id, bildBreite: ziel });
      if (alt && alt !== satz.id) { try { await Dateien.weg(alt); } catch {} }

      melder.remove();
      App.zeichneSeite();
      UI.toast('Seite ' + n + ' ist jetzt bei ' +
               Math.round(ziel * 72 / (Number(block.bw) || 595.28)) + ' dpi');
      return { ok: true, breite: ziel };
    } catch (e: unknown) {
      melder.remove();
      const grund = e instanceof Error ? e.message : String(e);
      UI.toast('Die Seite liess sich nicht feiner rechnen: ' + grund);
      return { ok: false, grund };
    } finally {
      if (griff) griff.schliessen();
    }
  };

  /**
   * EINE PDF AUSSUCHEN UND EINLESEN (L62).
   *
   * `alsSeiten` braucht eine `File`. Der Weg dahin war bisher nur das Ziehen
   * einer PDF auf die Seite — und für jemanden mit Vorlesungs-PDFs ist das
   * Menüband genau die Stelle, an der er zuerst sucht.
   *
   * WARUM DER WÄHLER HIER STEHT UND NICHT IM BAND. `register/menueband.ts`
   * ist ein KATALOG: er führt auf, was es gibt, und tut selbst nichts (E210).
   * Ein `<input type="file">` dort wäre neues Verhalten in einer Datei, die
   * keines haben darf. Also bekommt der Bereich, dem die Sache gehört, den
   * Einstieg, und das Band führt ihn nur auf — dieselbe Antwort wie bei den
   * Zeichenwerkzeugen (E212).
   *
   * OHNE ZIELSEITE PASSIERT NICHTS. `alsSeiten` legt die Seitenblöcke unter
   * einem Elternblock an; ohne den wüsste niemand, wohin. Ein Knopf, der
   * still nichts tut, ist schlimmer als einer, der sagt warum.
   */
  const waehlen = async (elternId?: string): Promise<any> => {
    const ziel = elternId || (typeof App !== 'undefined' ? App.aktuelleSeite() : '');
    if (!ziel) { UI.toast('Erst eine Seite öffnen — dorthin kommen die PDF-Seiten.'); return null; }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/pdf,.pdf';
    /* Der Wähler hängt im Dokument. In Chromium öffnet er sich auch ohne
       das — nachgemessen mit der Gegenprobe zu test247 §13. Es bleibt
       trotzdem stehen, weil andere Browser hier bekanntermassen
       empfindlich sind und es nichts kostet; dass ES DORT NÖTIG ist, ist
       hier aber nicht nachgemessen und wird deshalb auch nicht behauptet.
       Danach wieder weg. */
    input.style.display = 'none';
    document.body.appendChild(input);

    return new Promise(fertig => {
      let entschieden = false;
      const auf = async (): Promise<void> => {
        if (entschieden) return;
        entschieden = true;
        const datei = input.files?.[0];
        input.remove();
        if (!datei) { fertig(null); return; }
        try {
          fertig(await alsSeiten(datei, ziel));
        } catch (e) {
          UI.toast('Die PDF liess sich nicht einlesen: ' +
                   (e instanceof Error ? e.message : String(e)));
          fertig(null);
        }
      };
      input.addEventListener('change', () => { void auf(); });
      /* Abbrechen meldet in den meisten Browsern `cancel`. Wo nicht, bleibt
         das Versprechen offen — es hängt dann an nichts weiter als an sich
         selbst, und der nächste Klick legt einen neuen Wähler an. */
      input.addEventListener('cancel', () => {
        if (entschieden) return;
        entschieden = true; input.remove(); fertig(null);
      });
      input.click();
    });
  };

  return { alsSeiten, waehlen, neuBerechnen, ohneBild, schaerfer, BREITE_MAX, OHNE_FRAGE };
})();

(window as any).PdfEinlesen = PdfEinlesen;
