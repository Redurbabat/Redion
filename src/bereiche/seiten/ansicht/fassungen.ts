/* ============================================================================
 * vergleich.js — Fassungen vergleichen, einzelne Blöcke zurückholen
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/bereiche/seiten/ansicht/fassungen.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/bereiche/seiten/ansicht/fassungen.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
 * Notions Versionsverlauf zeigt eine alte Fassung und bietet einen einzigen
 * Knopf: alles zurück. Was sich geändert hat, muss man selbst suchen, und wer
 * nur einen Absatz zurückhaben will, hat Pech.
 *
 * Hier gibt es:
 *   · den Vergleich zweier Fassungen, Block für Block, mit Wörtern in Farbe
 *   · das Zurückholen eines einzelnen Blocks statt der ganzen Seite
 *   · den Vergleich zweier beliebiger Fassungen, nicht nur gegen jetzt
 *   · eine Zusammenfassung: so viele Blöcke neu, geändert, gelöscht
 * ==========================================================================*/

/** Ein Block, aus dem Baum herausgeklappt: Kennung, Art, Text, Tiefe. */
type FlacherBlock = { id: string; typ: string; text: string; tiefe: number; roh: any };

/** Ein Stück Wortvergleich: was damit geschah, und welcher Text es war. */
type WortStueck = ['gleich' | 'neu' | 'weg', string];

/** Eine Zeile des Vergleichs zweier Fassungen. */
type VergleichsZeile = {
  art: 'neu' | 'geaendert' | 'weg' | 'gleich';
  alt?: FlacherBlock;
  neu?: FlacherBlock;
};

const Vergleich = (() => {

  /* Das angeklickte Element — oder nichts. `e.target` ist `EventTarget | null`
     und muss ein `Element` sein, bevor `closest` daran etwas findet. Vorher
     stand hier ungeprüft `e.target.closest(…)`: bei einem Klick, dessen Ziel
     kein Element ist, warf das mitten im Behandeln. */
  const elVon = (e: Event): Element | null =>
    e.target instanceof Element ? e.target : null;

  const esc = (s: unknown): string => String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  /* ========================================================================
   * BAUM FLACH MACHEN
   * ------------------------------------------------------------------------
   * Store.baum liefert die Seite mit allen Kindern. Zum Vergleichen ist eine
   * flache Liste einfacher: jeder Block mit seiner Kennung, seiner Tiefe und
   * seinem Text.
   * ======================================================================*/
  const flach = (knoten: any, tiefe = 0, raus: FlacherBlock[] = []): FlacherBlock[] => {
    (knoten.kinder || []).forEach((k: any) => {
      raus.push({ id: k.id, typ: k.type, text: k.text || '', tiefe, roh: k });
      flach(k, tiefe + 1, raus);
    });
    return raus;
  };

  /** Die Seite, wie sie jetzt ist — im selben Format wie eine Fassung. */
  const jetzt = (pageId: string): any => Store.baum(pageId);

  /* ========================================================================
   * WÖRTER VERGLEICHEN
   * ------------------------------------------------------------------------
   * Innerhalb eines geänderten Blocks soll man sehen, welche Wörter neu sind
   * und welche weg. Das ist dieselbe Rechnung wie beim Zeilenvergleich, nur
   * auf Wörtern.
   * ======================================================================*/
  const woerter = (s: unknown): string[] => String(s || '').split(/(\s+)/).filter(x => x !== '');

  const wortDiff = (alt: unknown, neu: unknown): WortStueck[] => {
    const a = woerter(alt), b = woerter(neu);
    const n = a.length, m = b.length;
    /* Bei sehr langen Texten würde die Tabelle zu gross — dann grob vergleichen. */
    if (n * m > 250000) return [['weg', String(alt ?? '')], ['neu', String(neu ?? '')]];

    /* ----------------------------------------------------------------------
     * Die Tabelle ist (n+1)×(m+1) gross und die Schleifen laufen nur bis n-1
     * bzw. m-1 — jeder Zugriff hier trifft. TypeScript weiss das nicht, und
     * `noUncheckedIndexedAccess` besteht deshalb auf einer Antwort.
     *
     * Statt zwölfmal `!` zu schreiben, stehen hier zwei Handgriffe: sie
     * machen den Zugriff EINMAL sicher und benennen dabei, was gemeint ist.
     * -------------------------------------------------------------------- */
    const t = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
    const tab = (i: number, j: number): number => t[i]?.[j] ?? 0;
    const setzeTab = (i: number, j: number, w: number): void => { const z = t[i]; if (z) z[j] = w; };

    for (let i = n - 1; i >= 0; i--)
      for (let j = m - 1; j >= 0; j--)
        setzeTab(i, j, a[i] === b[j] ? tab(i + 1, j + 1) + 1
                                     : Math.max(tab(i + 1, j), tab(i, j + 1)));

    const raus: WortStueck[] = [];
    const dazu = (art: WortStueck[0], wort: string | undefined): void => {
      if (wort === undefined) return;
      const letzte = raus[raus.length - 1];
      if (letzte && letzte[0] === art) letzte[1] += wort;
      else raus.push([art, wort]);
    };
    let i = 0, j = 0;
    while (i < n && j < m) {
      if (a[i] === b[j]) { dazu('gleich', a[i]); i++; j++; }
      else if (tab(i + 1, j) >= tab(i, j + 1)) { dazu('weg', a[i]); i++; }
      else { dazu('neu', b[j]); j++; }
    }
    while (i < n) dazu('weg', a[i++]);
    while (j < m) dazu('neu', b[j++]);
    return raus;
  };

  const wortHtml = (alt: unknown, neu: unknown): string => wortDiff(alt, neu).map(([art, s]) =>
    art === 'gleich' ? esc(s) : `<${art === 'weg' ? 'del' : 'ins'}>${esc(s)}</${art === 'weg' ? 'del' : 'ins'}>`
  ).join('');

  /* ========================================================================
   * ZWEI FASSUNGEN VERGLEICHEN
   * ======================================================================*/
  const rechne = (altBaum: any, neuBaum: any) => {
    const a = flach(altBaum), b = flach(neuBaum);
    const beiA = new Map(a.map(x => [x.id, x]));
    const beiB = new Map(b.map(x => [x.id, x]));
    const zeilen: VergleichsZeile[] = [];

    /* Der neuen Fassung folgen — so bleibt die Reihenfolge lesbar. */
    b.forEach(x => {
      const alt = beiA.get(x.id);
      if (!alt) zeilen.push({ art: 'neu', neu: x });
      else if (alt.text !== x.text || alt.typ !== x.typ)
        zeilen.push({ art: 'geaendert', alt, neu: x });
      else zeilen.push({ art: 'gleich', alt, neu: x });
    });
    /* Was nur in der alten Fassung stand, hinten anhängen — an der Stelle,
       an der es einmal stand. */
    a.forEach((x, i) => {
      if (beiB.has(x.id)) return;
      /* Möglichst dort einfügen, wo der Vorgänger steht */
      const vor = a[i - 1];
      const stelle = vor ? zeilen.findIndex(z => (z.neu ?? z.alt)?.id === vor.id) : -1;
      const eintrag: VergleichsZeile = { art: 'weg', alt: x };
      if (stelle >= 0) zeilen.splice(stelle + 1, 0, eintrag);
      else zeilen.push(eintrag);
    });

    const zahlen = { neu: 0, geaendert: 0, weg: 0, gleich: 0 };
    zeilen.forEach(z => zahlen[z.art]++);
    return { zeilen, zahlen,
             titelAlt: altBaum.text || '',
             titelNeu: neuBaum.text || '' };
  };

  /* ========================================================================
   * EINZELNEN BLOCK ZURÜCKHOLEN
   * ======================================================================*/
  const blockZurueck = (pageId: string, eintrag: VergleichsZeile): boolean => {
    /* `alt` und `neu` sind je nach Art da oder nicht — genau deshalb stehen
       sie mit Fragezeichen im Typ. Vorher stand in jedem Zweig ein
       ungeprüfter Zugriff, und die Zweige gehören zusammen: `art: 'weg'`
       ohne `alt` wäre eine Zeile, die nichts aussagt. */
    const alt = eintrag.alt, neu = eintrag.neu;

    if (eintrag.art === 'geaendert') {
      if (!alt || !Store.getBlock(alt.id)) return false;
      Store.updateBlock(alt.id, { text: alt.text });
      return true;
    }
    if (eintrag.art === 'weg') {
      if (!alt) return false;
      /* Liegt der Block nur im Papierkorb, holen wir genau ihn zurück — dann
         behält er seine Kennung und der Vergleich ist danach wirklich leer.
         Wurde er endgültig entfernt, setzen wir ihn neu ein. */
      const imPapierkorb = Store.cache.blocks[alt.id];
      if (imPapierkorb && imPapierkorb.alive === false) {
        Store.restoreBlock(alt.id);
        Store.updateBlock(alt.id, { text: alt.text });
      } else {
        Store.baumEinfuegen(alt.roh, pageId);
      }
      return true;
    }
    if (eintrag.art === 'neu') {
      if (!neu) return false;
      /* Diesen Block gab es in der alten Fassung nicht — also wieder weg. */
      Store.trashBlock(neu.id);
      return true;
    }
    return false;
  };

  /* ========================================================================
   * FENSTER
   * ======================================================================*/
  const dialog = async (p: any, vorgabeAltId?: string): Promise<void> => {
    /* Die Meldung darunter behauptet etwas über den Bestand. Sie darf nur
       fallen, wenn wirklich nachgesehen werden konnte. */
    let liste: any[];
    try { liste = await Store.versionen(p.id); }
    catch (err) {
      UI.toast('Die Fassungen sind gerade nicht lesbar');
      if (typeof Reporter !== 'undefined')
        Reporter.error('seiten', 'Fassungen nicht lesbar', err);
      return;
    }
    if (!liste.length) { UI.toast('Für diese Seite gibt es noch keine Fassung'); return; }

    let altId = vorgabeAltId || liste[0].id;
    let neuId = 'jetzt';
    let nurUnterschiede = true;

    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML =
      '<div class="finder" style="width:min(900px,96vw)">' +
        '<div class="fh">🕘 Fassungen vergleichen<button class="icon-btn" data-a="zu">✕</button></div>' +
        '<div class="vg-leiste">' +
          '<label>Alt <select id="vg-alt"></select></label>' +
          '<span class="vg-pfeil">→</span>' +
          '<label>Neu <select id="vg-neu"></select></label>' +
          '<label class="vg-schalter"><input type="checkbox" id="vg-nur" checked> ' +
            'nur Unterschiede</label>' +
        '</div>' +
        '<div class="vg-zahlen" id="vg-zahlen"></div>' +
        '<div class="vg-liste" id="vg-liste"></div>' +
        '<div class="fbtns">' +
          '<button data-a="alles">Ganze Fassung zurückholen</button>' +
          '<button data-a="zu" class="prim">Schliessen</button></div>' +
      '</div>';
    document.body.appendChild(o);

    const wahl = (sel: HTMLSelectElement | null, mitJetzt: boolean): void => {
      if (!sel) return;
      sel.innerHTML = (mitJetzt ? '<option value="jetzt">Jetzt (aktueller Stand)</option>' : '') +
        liste.map((v: any) => `<option value="${v.id}">` +
          `${new Date(v.zeit).toLocaleString('de-DE')} · ${esc(v.anlass)}</option>`).join('');
    };
    const feldAlt = o.querySelector<HTMLSelectElement>('#vg-alt');
    const feldNeu = o.querySelector<HTMLSelectElement>('#vg-neu');
    wahl(feldAlt, false);
    wahl(feldNeu, true);
    if (feldAlt) feldAlt.value = altId;
    if (feldNeu) feldNeu.value = neuId;

    const baumVon = (id: string): any => id === 'jetzt' ? jetzt(p.id)
                                           : (liste.find((v: any) => v.id === id) || {}).daten;

    let letzterErg: ReturnType<typeof rechne> | null = null;
    const zeichne = (): void => {
      const a = baumVon(altId), b = baumVon(neuId);
      if (!a || !b) return;
      const erg = rechne(a, b);
      letzterErg = erg;

      const zahlenFeld = o.querySelector('#vg-zahlen');
      const listenFeld = o.querySelector('#vg-liste');
      if (!zahlenFeld || !listenFeld) return;

      zahlenFeld.innerHTML =
        `<span class="vg-z neu">+${erg.zahlen.neu} neu</span>` +
        `<span class="vg-z geaendert">~${erg.zahlen.geaendert} geändert</span>` +
        `<span class="vg-z weg">−${erg.zahlen.weg} gelöscht</span>` +
        `<span class="vg-z gleich">${erg.zahlen.gleich} unverändert</span>` +
        (erg.titelAlt !== erg.titelNeu
          ? `<span class="vg-titel">Titel: <del>${esc(erg.titelAlt)}</del> ` +
            `<ins>${esc(erg.titelNeu)}</ins></span>` : '');

      const zeigen = erg.zeilen.filter(z => !nurUnterschiede || z.art !== 'gleich');
      listenFeld.innerHTML = zeigen.length
        ? zeigen.map(z => {
            const idx = erg.zeilen.indexOf(z);
            /* Jede Zeile hat mindestens eine Seite — sonst wäre sie keine.
               Fehlt beides, wird sie übersprungen statt zu werfen. */
            const roh = z.neu ?? z.alt;
            if (!roh) return '';
            const zeichen = { neu: '+', weg: '−', geaendert: '~', gleich: ' ' }[z.art];
            const inhalt =
              z.art === 'geaendert' ? wortHtml(z.alt?.text, z.neu?.text)
              : z.art === 'weg'     ? `<del>${esc(z.alt?.text || '(leerer Block)')}</del>`
              : z.art === 'neu'     ? `<ins>${esc(z.neu?.text || '(leerer Block)')}</ins>`
              : esc(roh.text || '');
            return `<div class="vg-zeile vg-${z.art}" style="padding-left:${8 + roh.tiefe * 16}px">` +
              `<span class="vg-zeichen">${zeichen}</span>` +
              `<span class="vg-typ">${esc(roh.typ)}</span>` +
              `<span class="vg-inhalt">${inhalt || '<i>leer</i>'}</span>` +
              (z.art !== 'gleich' && neuId === 'jetzt'
                ? `<button data-zurueck="${idx}" title="Nur diesen Block auf die alte Fassung ` +
                  `zurücksetzen">↩</button>` : '') +
            '</div>';
          }).join('')
        : '<div class="pf-gut">Zwischen diesen beiden Fassungen hat sich nichts geändert.</div>';
    };
    zeichne();

    o.addEventListener('change', e => {
      const ziel = e.target;
      if (ziel instanceof HTMLSelectElement) {
        if (ziel.id === 'vg-alt') { altId = ziel.value; zeichne(); }
        if (ziel.id === 'vg-neu') { neuId = ziel.value; zeichne(); }
      }
      if (ziel instanceof HTMLInputElement && ziel.id === 'vg-nur') {
        nurUnterschiede = ziel.checked; zeichne();
      }
    });

    o.addEventListener('click', async e => {
      if (e.target === o || elVon(e)?.closest<HTMLElement>('[data-a="zu"]')) { o.remove(); return; }

      const z = elVon(e)?.closest<HTMLElement>('[data-zurueck]');
      if (z?.dataset['zurueck'] !== undefined) {
        const eintrag = letzterErg?.zeilen[+z.dataset['zurueck']];
        if (!eintrag) return;
        await Store.versionSpeichern(p.id, 'vor einzelnem Zurückholen');
        if (blockZurueck(p.id, eintrag)) {
          UI.toast('Dieser Block ist zurück auf der alten Fassung');
          App.zeichneSeite();
          zeichne();
        } else UI.toast('Dieser Block liess sich nicht zurückholen');
        return;
      }

      if (elVon(e)?.closest<HTMLElement>('[data-a="alles"]')) {
        const v = liste.find((x: any) => x.id === altId);
        if (!v) return;
        if (!confirm('Die ganze Seite auf diese Fassung zurücksetzen? ' +
                     'Der jetzige Stand wird vorher gesichert.')) return;
        await Store.versionSpeichern(p.id, 'vor Wiederherstellung');
        /* ABGLEICHEN, NICHT ABREISSEN (E685, wie E684 im Verlauf): bis
           hierher purgte `kinderLeeren` jedes Kind und `baumEinfuegen` legte
           es mit frischer Kennung neu an — eine Unterseite verlor dabei
           Kennung und Fassungen. */
        Store.baumAbgleichen(p.id, v.daten);
        Store.updateBlock(p.id, { text: v.daten.text, icon: v.daten.icon });
        o.remove();
        App.zeichneBaum(); App.zeichneSeite();
        UI.toast('Fassung wiederhergestellt');
      }
    });
  };

  return { dialog, rechne, flach, wortDiff, wortHtml, blockZurueck, jetzt };
})();

(window as any).Vergleich = Vergleich;
