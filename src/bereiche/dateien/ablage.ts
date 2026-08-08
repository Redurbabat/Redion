/* ==========================================================================
 * DATEIEN — hochladen in Schritten, in Stücken abgelegt
 * --------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/bereiche/dateien/ablage.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/bereiche/dateien/ablage.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
 * Notion lädt grosse Dateien in drei Schritten hoch: erst anmelden („ich
 * habe eine Datei dieser Grösse"), dann die Teile schicken, dann bestätigen.
 * Der Grund ist nicht Umständlichkeit, sondern Wirklichkeit: eine Datei von
 * 300 MB geht nicht in einem Stück, und wenn bei Teil 47 die Verbindung
 * abreisst, will man nicht wieder bei Teil 1 anfangen.
 *
 * Hier steht das lange auf „teilweise" mit der Begründung: die Datei wird
 * direkt als Data-URL abgelegt. Das ist bequem und für ein kleines Bild
 * richtig — aber es hat drei Nachteile, die man erst bei grösseren Dateien
 * merkt:
 *
 *   1. Eine Data-URL ist Base64. Sie ist um ein Drittel grösser als die
 *      Datei selbst.
 *   2. Sie liegt vollständig im Arbeitsspeicher, jedes Mal, wenn der Block
 *      gezeichnet wird — auch wenn niemand hinsieht.
 *   3. Der ganze Block wird mitgeschrieben, sobald sich irgendetwas an ihm
 *      ändert. Ein Video von 50 MB wandert dann bei jedem Umbenennen des
 *      Bildtitels durch die Ablage.
 *
 * Deshalb hier derselbe Ablauf wie bei Notion, nur ohne Server: anmelden,
 * Stücke schreiben, bestätigen. Jedes Stück liegt einzeln in IndexedDB —
 * als Blob, nicht als Text. Zum Anzeigen wird eine Blob-Adresse gebaut, die
 * der Browser selbst verwaltet und die keinen Arbeitsspeicher kostet.
 *
 * Was bleibt: kleine Dateien gehen weiter den kurzen Weg. Für ein Bild von
 * 40 KB wäre dieser Apparat Unfug.
 * ========================================================================*/
const Dateien = (() => {

  /* Das angeklickte Element — oder nichts. `e.target` ist `EventTarget | null`
     und muss ein `Element` sein, bevor `closest` daran etwas findet. Vorher
     stand hier ungeprüft `e.target.closest(…)`: bei einem Klick, dessen Ziel
     kein Element ist, warf das mitten im Behandeln. */
  const elVon = (e: Event): Element | null =>
    e.target instanceof Element ? e.target : null;

  /* AUS DEN KONSTANTEN, nicht abgeschrieben. Hier standen dieselben drei
     Zahlen ein zweites Mal — sie stimmten überein, aber nichts hätte es
     gemerkt, wenn eine der beiden Seiten sich geändert hätte. Genau diese
     Fehlerklasse hat am 8. August dreimal zugeschlagen (E64, E65).
     Der Rückfall gilt nur, wenn `konstanten.js` nicht geladen ist — dann
     ist die App ohnehin kaputt, aber eine Grenze von `undefined` liesse
     jede Datei durch, und das wäre schlimmer als eine falsche Grenze. */
  const K = (n: string, standard: number): number =>
    (typeof KONSTANTEN !== 'undefined' && Number((KONSTANTEN as any)[n])) || standard;
  const STUECK = K('STUECK', 1024 * 1024);            /* 1 MB je Stück */
  const KLEIN  = K('KLEIN', 256 * 1024);              /* darunter lohnt der Aufwand nicht */
  const GRENZE = K('DATEI_MAX', 500 * 1024 * 1024);   /* darüber wird es auch lokal eng */

  /* Laufende Uploads: id → { datei, teile, fertig, abgebrochen } */
  const laufend = new Map();

  /* Blob-Adressen, die schon gebaut wurden — damit dieselbe Datei nicht
     zehnmal zusammengesetzt wird. */
  const adressen = new Map();

  /* ========================================================================
   * 1 · ANMELDEN — Notions „create file upload"
   * ======================================================================*/
  const anmelden = async ({ name, groesse, typ, blockId }: { name: string; groesse: number; typ?: string; blockId?: string }): Promise<any> => {
    if (!groesse && groesse !== 0) throw new Error('Es fehlt die Grösse.');
    if (groesse > GRENZE)
      throw new Error('Diese Datei ist grösser als ' + Math.round(GRENZE / 1048576) +
                      ' MB. So viel hält der Browser nicht.');
    const id = Store.uid();
    const teile = Math.max(1, Math.ceil(groesse / STUECK));
    const satz = {
      id, name: name || 'Datei', groesse, typ: typ || 'application/octet-stream',
      blockId: blockId || null, teile, angekommen: 0,
      zustand: 'wartet', angelegt: Store.now(), fertigAm: null
    };
    await Store.dateiPut(satz);
    laufend.set(id, { satz, abgebrochen: false });
    return satz;
  };

  /* ========================================================================
   * 2 · EIN STÜCK SCHICKEN — Notions „send file upload part"
   * ======================================================================*/
  const stueckSchicken = async (dateiId: string, nr: number, blob: Blob): Promise<any> => {
    const lauf = laufend.get(dateiId);
    const satz = (lauf && lauf.satz) || await Store.dateiHolen(dateiId);
    if (!satz) throw new Error('Diesen Upload gibt es nicht.');
    if (satz.zustand === 'fertig') throw new Error('Dieser Upload ist schon abgeschlossen.');
    if (nr < 0 || nr >= satz.teile)
      throw new Error('Stück ' + nr + ' gibt es nicht — es sind ' + satz.teile + '.');

    await Store.stueckPut({ id: dateiId + ':' + nr, dateiId, nr, blob });
    satz.angekommen = Math.max(satz.angekommen, nr + 1);
    satz.zustand = 'laeuft';
    await Store.dateiPut(satz);
    return { nr, von: satz.teile, anteil: satz.angekommen / satz.teile };
  };

  /* ========================================================================
   * 3 · BESTÄTIGEN — Notions „complete file upload"
   * ======================================================================*/
  const bestaetigen = async (dateiId: string): Promise<any> => {
    const satz = await Store.dateiHolen(dateiId);
    if (!satz) throw new Error('Diesen Upload gibt es nicht.');
    const stuecke = await Store.stueckeVon(dateiId);
    if (stuecke.length !== satz.teile) {
      /* Ehrlich sagen, welches Stück fehlt — sonst sucht man im Dunkeln. */
      const da = new Set(stuecke.map((s: any) => s.nr));
      const fehlt = [];
      for (let i = 0; i < satz.teile; i++) if (!da.has(i)) fehlt.push(i);
      throw new Error('Es fehlen noch ' + fehlt.length + ' Stück(e): ' +
                      fehlt.slice(0, 8).join(', ') + (fehlt.length > 8 ? ' …' : ''));
    }
    satz.zustand = 'fertig';
    satz.fertigAm = Store.now();
    await Store.dateiPut(satz);
    laufend.delete(dateiId);
    if (typeof Protokoll !== 'undefined')
      Protokoll.notieren('import', 'Datei „' + satz.name + '" abgelegt (' +
        groesseText(satz.groesse) + ', ' + satz.teile + ' Stück)', { id: dateiId });
    return satz;
  };

  /* Abbrechen: die Stücke wieder weg, sonst liegt Müll in der Ablage. */
  const abbrechen = async (dateiId: string): Promise<any> => {
    const lauf = laufend.get(dateiId);
    if (lauf) lauf.abgebrochen = true;
    await weg(dateiId);
    return true;
  };

  /* ========================================================================
   * 4 · DER BEQUEME WEG — eine ganze Datei auf einmal
   * ======================================================================*/
  /**
   * Legt eine Datei ab und ruft dabei laufend zurück, wie weit es ist.
   * @param {File|Blob} datei
   * @param {object} opt  { blockId, name, beiFortschritt(anteil, nr, von) }
   * @returns {Promise<object>} der Dateisatz
   */
  const ablegen = async (datei: File, opt?: any): Promise<any> => {
    opt = opt || {};
    const satz = await anmelden({
      name: opt.name || datei.name || 'Datei',
      groesse: datei.size, typ: datei.type, blockId: opt.blockId });

    try {
      for (let nr = 0; nr < satz.teile; nr++) {
        const lauf = laufend.get(satz.id);
        if (lauf && lauf.abgebrochen) throw new Error('Abgebrochen.');
        const von = nr * STUECK;
        await stueckSchicken(satz.id, nr, datei.slice(von, Math.min(von + STUECK, datei.size)));
        if (opt.beiFortschritt) opt.beiFortschritt((nr + 1) / satz.teile, nr + 1, satz.teile);
      }
      return await bestaetigen(satz.id);
    } catch (e) {
      await weg(satz.id);
      throw e;
    }
  };

  /* ========================================================================
   * 5 · WIEDER HERAUS
   * ======================================================================*/
  /** Die ganze Datei als Blob — erst hier wird zusammengesetzt. */
  const alsBlob = async (dateiId: string): Promise<Blob | null> => {
    const satz = await Store.dateiHolen(dateiId);
    if (!satz) return null;
    const stuecke = await Store.stueckeVon(dateiId);
    if (!stuecke.length) return null;
    /* Unvollständig ist nicht „etwas kleiner", sondern KAPUTT. Hier wurden
       bis eben 25 von 40 Stücken kommentarlos aneinandergereiht — ein
       abgebrochener Upload wanderte so als halbes Video in die
       `.redion`-Sicherung, deren `dateien.json` daneben 40 Teile
       deklarierte. Beim Einspielen wurde aus den 25 dann `zustand: 'fertig'`
       — und die fehlenden 15 MB waren keine Lücke mehr, sondern Geschichte.
       Ein halbes Video ist kein kleineres Video; es ist keines. */
    if (typeof satz.teile === 'number' && satz.teile > 0 &&
        stuecke.length !== satz.teile) {
      if (typeof Reporter !== 'undefined')
        Reporter.warn('dateien', 'Datei „' + satz.name + '" ist unvollständig (' +
          stuecke.length + ' von ' + satz.teile + ' Stücken) und wird nicht zusammengesetzt');
      return null;
    }
    return new Blob(stuecke.map((s: any) => s.blob), { type: satz.typ });
  };

  /**
   * Eine Adresse, die sich in ein src-Feld schreiben lässt.
   * Der Browser hält den Blob selbst; wir merken uns die Adresse, damit
   * dieselbe Datei nicht bei jedem Zeichnen neu zusammengesetzt wird.
   */
  const adresse = async (dateiId: string): Promise<string | null> => {
    if (adressen.has(dateiId)) return adressen.get(dateiId);
    const blob = await alsBlob(dateiId);
    if (!blob) return null;
    const url = URL.createObjectURL(blob);
    adressen.set(dateiId, url);
    return url;
  };

  const adresseWeg = (dateiId: string): void => {
    const url = adressen.get(dateiId);
    if (url) { try { URL.revokeObjectURL(url); } catch {} adressen.delete(dateiId); }
  };

  /** Herunterladen, ohne die Datei je ganz durch den Arbeitsspeicher zu ziehen. */
  const herunterladen = async (dateiId: string): Promise<boolean> => {
    const satz = await Store.dateiHolen(dateiId);
    const url = await adresse(dateiId);
    if (!url || !satz) { UI.toast('Diese Datei gibt es nicht mehr'); return false; }
    const a = document.createElement('a');
    a.href = url; a.download = satz.name;
    a.click();
    if (typeof Protokoll !== 'undefined')
      Protokoll.notieren('export', 'Datei „' + satz.name + '" heruntergeladen', { id: dateiId });
    return true;
  };

  /* ========================================================================
   * 6 · AUFRÄUMEN
   * ======================================================================*/
  const weg = async (dateiId: string): Promise<any> => {
    const stuecke = await Store.stueckeVon(dateiId);
    for (const s of stuecke) await Store.stueckWeg(s.id);
    await Store.dateiWeg(dateiId);
    adresseWeg(dateiId);
    laufend.delete(dateiId);
    return stuecke.length;
  };

  /**
   * Verwaiste Dateien: der Block, an dem sie hingen, ist weg — oder der
   * Upload wurde nie zu Ende gebracht. Beides sammelt sich sonst still an.
   */
  const verwaist = async (): Promise<any[]> => {
    const alle = await Store.dateiAlle();
    return alle.filter((d: any) => {
      if (d.zustand !== 'fertig') return true;
      if (!d.blockId) return false;
      const b = Store.getBlock(d.blockId);
      return !b || b.alive === false;
    });
  };

  const aufraeumen = async (): Promise<{ anzahl: number; bytes: number }> => {
    const liste = await verwaist();
    let bytes = 0;
    for (const d of liste) { bytes += d.groesse || 0; await weg(d.id); }
    return { anzahl: liste.length, bytes };
  };

  /* ========================================================================
   * 7 · ZAHLEN UND TEXTE
   * ======================================================================*/
  const groesseText = (n: unknown): string => {
    const b = Number(n) || 0;
    if (b < 1024) return b + ' B';
    if (b < 1048576) return (b / 1024).toFixed(1).replace('.0', '') + ' KB';
    if (b < 1073741824) return (b / 1048576).toFixed(1).replace('.0', '') + ' MB';
    return (b / 1073741824).toFixed(2) + ' GB';
  };

  const zahlen = async (): Promise<any> => {
    const alle = await Store.dateiAlle();
    const fertig = alle.filter((d: any) => d.zustand === 'fertig');
    return {
      anzahl: alle.length,
      fertig: fertig.length,
      offen: alle.length - fertig.length,
      bytes: alle.reduce((n: any, d: any) => n + (d.groesse || 0), 0),
      stuecke: alle.reduce((n: any, d: any) => n + (d.teile || 0), 0)
    };
  };

  /* Lohnt sich der Umweg? Kleine Dateien gehen weiter direkt in den Block. */
  const lohntSich = (groesse: unknown): boolean => Number(groesse) > KLEIN;

  /* ========================================================================
   * 8 · DAS FENSTER
   * ======================================================================*/
  const esc = (s: unknown): string => String(s ?? '').replace(/[&<>"]/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' } as Record<string, string>)[c] ?? c);

  const dialog = async (): Promise<void> => {
    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML =
      '<div class="finder" style="width:min(700px,95vw)">' +
        '<div class="fh">📎 Dateien <em id="da-zahl"></em>' +
          '<button class="icon-btn" data-a="zu">✕</button></div>' +
        '<div class="res" id="da-liste" style="padding:8px"></div>' +
        '<div class="fbtns">' +
          '<span id="da-summe" style="flex:1; font-size:12px; color:var(--text-faint); ' +
            'align-self:center"></span>' +
          '<button data-a="neu">Datei ablegen</button>' +
          '<button data-a="putz">Verwaistes aufräumen</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(o);

    const zeichne = async () => {
      const alle = (await Store.dateiAlle())
        .sort((a: any, b: any) => String(b.angelegt).localeCompare(String(a.angelegt)));
      const z = await zahlen();
      const zahlFeld = o.querySelector('#da-zahl'), summeFeld = o.querySelector('#da-summe'),
            listeFeld = o.querySelector('#da-liste');
      if (!zahlFeld || !summeFeld || !listeFeld) return;
      zahlFeld.textContent = String(z.anzahl);
      summeFeld.textContent =
        z.anzahl ? groesseText(z.bytes) + ' in ' + z.stuecke + ' Stücken' +
                   (z.offen ? ' · ' + z.offen + ' unfertig' : '')
                 : 'Noch nichts abgelegt.';
      listeFeld.innerHTML = alle.length
        ? alle.map((d: any) => {
            const b = d.blockId ? Store.getBlock(d.blockId) : null;
            const wo = b && b.alive !== false
              ? esc((b.text || 'Ohne Titel').slice(0, 40))
              : (d.blockId ? '<i>Block gelöscht</i>' : '<i>frei</i>');
            const anteil = Math.round((d.angekommen / Math.max(1, d.teile)) * 100);
            return '<div class="da-zeile">' +
              `<span class="da-ic">${d.zustand === 'fertig' ? '📄' : '⏳'}</span>` +
              `<div class="da-mitte"><b>${esc(d.name)}</b>` +
                `<span>${esc(groesseText(d.groesse))} · ${d.teile} Stück · ${wo}` +
                (d.zustand === 'fertig' ? '' : ` · ${anteil}%`) + '</span></div>' +
              (d.zustand === 'fertig'
                ? `<button data-lade="${d.id}" title="Herunterladen">⭳</button>` : '') +
              `<button data-weg="${d.id}" title="Löschen">🗑</button>` +
            '</div>';
          }).join('')
        : '<div style="padding:22px; color:var(--text-faint); font-size:14px">' +
          'Noch keine Datei in Stücken abgelegt. Kleine Dateien gehen weiterhin ' +
          'direkt in den Block — der Umweg lohnt sich erst ab ' +
          groesseText(KLEIN) + '.</div>';
    };
    await zeichne();

    o.addEventListener('click', async e => {
      if (e.target === o || elVon(e)?.closest<HTMLElement>('[data-a="zu"]')) { o.remove(); return; }
      const lade = elVon(e)?.closest<HTMLElement>('[data-lade]');
      if (lade?.dataset["lade"]) { await herunterladen(lade.dataset["lade"]); return; }
      const w = elVon(e)?.closest<HTMLElement>('[data-weg]');
      if (w) {
        if (!w.dataset["weg"]) return;
        await weg(w.dataset["weg"]);
        await zeichne();
        UI.toast('Datei gelöscht');
        return;
      }
      const a = elVon(e)?.closest<HTMLElement>('[data-a]');
      if (!a) return;
      if (a.dataset['a'] === 'putz') {
        const erg = await aufraeumen();
        await zeichne();
        UI.toast(erg.anzahl
          ? erg.anzahl + ' aufgeräumt, ' + groesseText(erg.bytes) + ' frei'
          : 'Nichts aufzuräumen');
      }
      if (a.dataset['a'] === 'neu') {
        const inp = document.createElement('input');
        inp.type = 'file';
        inp.addEventListener('change', async () => {
          const f = inp.files?.[0];
          if (!f) return;
          const balken = document.createElement('div');
          balken.className = 'da-fortschritt';
          balken.innerHTML = '<b>' + esc(f.name) + '</b><i></i><span>0 %</span>';
          o.querySelector('#da-liste')?.prepend(balken);
          try {
            await ablegen(f, { beiFortschritt: (anteil: number) => {
              const i2 = balken.querySelector<HTMLElement>('i'), sp = balken.querySelector('span');
              if (i2) i2.style.width = Math.round(anteil * 100) + '%';
              if (sp) sp.textContent = Math.round(anteil * 100) + ' %';

            } });
            await zeichne();
            UI.toast('„' + f.name + '" abgelegt');
          } catch (err) {
            balken.remove();
            UI.toast('Ging nicht: ' + (err instanceof Error ? err.message : String(err)));
          }
        });
        inp.click();
      }
    });
  };

  return { STUECK, KLEIN, GRENZE,
           anmelden, stueckSchicken, bestaetigen, abbrechen, ablegen,
           alsBlob, adresse, adresseWeg, herunterladen,
           weg, verwaist, aufraeumen, zahlen, groesseText, lohntSich, dialog };
})();

(window as any).Dateien = Dateien;
