/* ============================================================================
 * vergleich.js — Fassungen vergleichen, einzelne Blöcke zurückholen
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

const Vergleich = (() => {

  const esc = (s) => String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  /* ========================================================================
   * BAUM FLACH MACHEN
   * ------------------------------------------------------------------------
   * Store.baum liefert die Seite mit allen Kindern. Zum Vergleichen ist eine
   * flache Liste einfacher: jeder Block mit seiner Kennung, seiner Tiefe und
   * seinem Text.
   * ======================================================================*/
  const flach = (knoten, tiefe = 0, raus = []) => {
    (knoten.kinder || []).forEach(k => {
      raus.push({ id: k.id, typ: k.type, text: k.text || '', tiefe, roh: k });
      flach(k, tiefe + 1, raus);
    });
    return raus;
  };

  /** Die Seite, wie sie jetzt ist — im selben Format wie eine Fassung. */
  const jetzt = (pageId) => Store.baum(pageId);

  /* ========================================================================
   * WÖRTER VERGLEICHEN
   * ------------------------------------------------------------------------
   * Innerhalb eines geänderten Blocks soll man sehen, welche Wörter neu sind
   * und welche weg. Das ist dieselbe Rechnung wie beim Zeilenvergleich, nur
   * auf Wörtern.
   * ======================================================================*/
  const woerter = (s) => String(s || '').split(/(\s+)/).filter(x => x !== '');

  const wortDiff = (alt, neu) => {
    const a = woerter(alt), b = woerter(neu);
    const n = a.length, m = b.length;
    /* Bei sehr langen Texten würde die Tabelle zu gross — dann grob vergleichen. */
    if (n * m > 250000) return [['weg', alt], ['neu', neu]];
    const t = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
    for (let i = n - 1; i >= 0; i--)
      for (let j = m - 1; j >= 0; j--)
        t[i][j] = a[i] === b[j] ? t[i + 1][j + 1] + 1 : Math.max(t[i + 1][j], t[i][j + 1]);
    const raus = [];
    const dazu = (art, wort) => {
      const letzte = raus[raus.length - 1];
      if (letzte && letzte[0] === art) letzte[1] += wort;
      else raus.push([art, wort]);
    };
    let i = 0, j = 0;
    while (i < n && j < m) {
      if (a[i] === b[j]) { dazu('gleich', a[i]); i++; j++; }
      else if (t[i + 1][j] >= t[i][j + 1]) { dazu('weg', a[i]); i++; }
      else { dazu('neu', b[j]); j++; }
    }
    while (i < n) dazu('weg', a[i++]);
    while (j < m) dazu('neu', b[j++]);
    return raus;
  };

  const wortHtml = (alt, neu) => wortDiff(alt, neu).map(([art, s]) =>
    art === 'gleich' ? esc(s) : `<${art === 'weg' ? 'del' : 'ins'}>${esc(s)}</${art === 'weg' ? 'del' : 'ins'}>`
  ).join('');

  /* ========================================================================
   * ZWEI FASSUNGEN VERGLEICHEN
   * ======================================================================*/
  const rechne = (altBaum, neuBaum) => {
    const a = flach(altBaum), b = flach(neuBaum);
    const beiA = new Map(a.map(x => [x.id, x]));
    const beiB = new Map(b.map(x => [x.id, x]));
    const zeilen = [];

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
      const stelle = vor ? zeilen.findIndex(z => (z.neu || z.alt).id === vor.id) : -1;
      const eintrag = { art: 'weg', alt: x };
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
  const blockZurueck = (pageId, eintrag) => {
    if (eintrag.art === 'geaendert') {
      const b = Store.getBlock(eintrag.alt.id);
      if (!b) return false;
      Store.updateBlock(eintrag.alt.id, { text: eintrag.alt.text });
      return true;
    }
    if (eintrag.art === 'weg') {
      /* Liegt der Block nur im Papierkorb, holen wir genau ihn zurück — dann
         behält er seine Kennung und der Vergleich ist danach wirklich leer.
         Wurde er endgültig entfernt, setzen wir ihn neu ein. */
      const alt = Store.cache.blocks[eintrag.alt.id];
      if (alt && alt.alive === false) {
        Store.restoreBlock(eintrag.alt.id);
        Store.updateBlock(eintrag.alt.id, { text: eintrag.alt.text });
      } else {
        Store.baumEinfuegen(eintrag.alt.roh, pageId);
      }
      return true;
    }
    if (eintrag.art === 'neu') {
      /* Diesen Block gab es in der alten Fassung nicht — also wieder weg. */
      Store.trashBlock(eintrag.neu.id);
      return true;
    }
    return false;
  };

  /* ========================================================================
   * FENSTER
   * ======================================================================*/
  const dialog = async (p, vorgabeAltId) => {
    const liste = await Store.versionen(p.id);
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

    const wahl = (sel, mitJetzt) => {
      sel.innerHTML = (mitJetzt ? '<option value="jetzt">Jetzt (aktueller Stand)</option>' : '') +
        liste.map(v => `<option value="${v.id}">` +
          `${new Date(v.zeit).toLocaleString('de-DE')} · ${esc(v.anlass)}</option>`).join('');
    };
    wahl(o.querySelector('#vg-alt'), false);
    wahl(o.querySelector('#vg-neu'), true);
    o.querySelector('#vg-alt').value = altId;
    o.querySelector('#vg-neu').value = neuId;

    const baumVon = (id) => id === 'jetzt' ? jetzt(p.id)
                                           : (liste.find(v => v.id === id) || {}).daten;

    let letzterErg = null;
    const zeichne = () => {
      const a = baumVon(altId), b = baumVon(neuId);
      if (!a || !b) return;
      const erg = rechne(a, b);
      letzterErg = erg;

      o.querySelector('#vg-zahlen').innerHTML =
        `<span class="vg-z neu">+${erg.zahlen.neu} neu</span>` +
        `<span class="vg-z geaendert">~${erg.zahlen.geaendert} geändert</span>` +
        `<span class="vg-z weg">−${erg.zahlen.weg} gelöscht</span>` +
        `<span class="vg-z gleich">${erg.zahlen.gleich} unverändert</span>` +
        (erg.titelAlt !== erg.titelNeu
          ? `<span class="vg-titel">Titel: <del>${esc(erg.titelAlt)}</del> ` +
            `<ins>${esc(erg.titelNeu)}</ins></span>` : '');

      const zeigen = erg.zeilen.filter(z => !nurUnterschiede || z.art !== 'gleich');
      o.querySelector('#vg-liste').innerHTML = zeigen.length
        ? zeigen.map((z, i) => {
            const idx = erg.zeilen.indexOf(z);
            const roh = z.neu || z.alt;
            const zeichen = { neu: '+', weg: '−', geaendert: '~', gleich: ' ' }[z.art];
            const inhalt =
              z.art === 'geaendert' ? wortHtml(z.alt.text, z.neu.text)
              : z.art === 'weg'     ? `<del>${esc(z.alt.text || '(leerer Block)')}</del>`
              : z.art === 'neu'     ? `<ins>${esc(z.neu.text || '(leerer Block)')}</ins>`
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
      if (e.target.id === 'vg-alt') { altId = e.target.value; zeichne(); }
      if (e.target.id === 'vg-neu') { neuId = e.target.value; zeichne(); }
      if (e.target.id === 'vg-nur') { nurUnterschiede = e.target.checked; zeichne(); }
    });

    o.addEventListener('click', async e => {
      if (e.target === o || e.target.closest('[data-a="zu"]')) { o.remove(); return; }

      const z = e.target.closest('[data-zurueck]');
      if (z) {
        const eintrag = letzterErg.zeilen[+z.dataset.zurueck];
        await Store.versionSpeichern(p.id, 'vor einzelnem Zurückholen');
        if (blockZurueck(p.id, eintrag)) {
          UI.toast('Dieser Block ist zurück auf der alten Fassung');
          App.zeichneSeite();
          zeichne();
        } else UI.toast('Dieser Block liess sich nicht zurückholen');
        return;
      }

      if (e.target.closest('[data-a="alles"]')) {
        const v = liste.find(x => x.id === altId);
        if (!v) return;
        if (!confirm('Die ganze Seite auf diese Fassung zurücksetzen? ' +
                     'Der jetzige Stand wird vorher gesichert.')) return;
        await Store.versionSpeichern(p.id, 'vor Wiederherstellung');
        Store.kinderLeeren(p.id);
        (v.daten.kinder || []).forEach(k => Store.baumEinfuegen(k, p.id));
        Store.updateBlock(p.id, { text: v.daten.text, icon: v.daten.icon });
        o.remove();
        App.zeichneBaum(); App.zeichneSeite();
        UI.toast('Fassung wiederhergestellt');
      }
    });
  };

  return { dialog, rechne, flach, wortDiff, wortHtml, blockZurueck, jetzt };
})();

window.Vergleich = Vergleich;
