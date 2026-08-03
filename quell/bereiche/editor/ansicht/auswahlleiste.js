/* ============================================================================
 * apps/schreiben/auswahlleiste/ansicht.js — aus notion.js herausgelöst
 * ----------------------------------------------------------------------------
 * Stammt aus der früheren Sammeldatei notion.js. Der Inhalt ist unverändert;
 * nur der Ort ist jetzt der, an dem man ihn sucht.
 * ==========================================================================*/

const Auswahl = (() => {

  let leiste = null;
  let letzteFarbe = 'yellow';

  const weg = () => { if (leiste) { leiste.remove(); leiste = null; } };

  const markierterBlock = () => {
    const s = getSelection();
    if (!s.rangeCount) return null;
    let n = s.getRangeAt(0).startContainer;
    if (n.nodeType === 3) n = n.parentElement;
    const blk = n?.closest?.('.blk');
    return blk ? Store.getBlock(blk.dataset.bid) : null;
  };

  /** Legt Marken um die Auswahl — genau wie Notions Strg + B. */
  const umschliesse = (marke) => {
    const s = getSelection();
    const txt = s.toString();
    if (!txt) return;
    const b = markierterBlock();
    if (!b) return;
    const neu = (b.text || '').replace(txt, marke + txt + marke);
    Store.updateBlock(b.id, { text: neu });
    App.zeichneSeite(b.id, 'ende');
    weg();
  };

  const zeigen = () => {
    const s = getSelection();
    const txt = s.toString().trim();
    if (!txt || !s.rangeCount) { weg(); return; }
    const bereich = s.getRangeAt(0);
    const start = bereich.startContainer.parentElement;
    if (!start || !start.closest('#page') || !start.closest('.ct')) { weg(); return; }

    weg();
    const r = bereich.getBoundingClientRect();
    leiste = document.createElement('div');
    leiste.className = 'auswahlleiste';
    leiste.innerHTML =
      '<button data-a="ki" class="ki">✨ KI</button>' +
      '<span class="tr"></span>' +
      '<button data-a="turn">Umwandeln ▾</button>' +
      '<span class="tr"></span>' +
      '<button data-a="b" title="Fett — Strg B"><b>B</b></button>' +
      '<button data-a="i" title="Kursiv — Strg I"><i>I</i></button>' +
      '<button data-a="u" title="Unterstrichen — Strg U"><u>U</u></button>' +
      '<button data-a="s" title="Durchgestrichen — Strg Shift S"><s>S</s></button>' +
      '<button data-a="c" title="Code — Strg E">&lt;/&gt;</button>' +
      '<button data-a="m" title="Formel">∑</button>' +
      '<button data-a="link" title="Link — Strg K">🔗</button>' +
      '<span class="tr"></span>' +
      '<button data-a="komm" title="Kommentar — Strg Shift M">💬</button>' +
      '<button data-a="farbe" title="Farbe">🎨 ▾</button>';

    document.body.appendChild(leiste);
    const hoehe = leiste.getBoundingClientRect();
    leiste.style.left = Math.max(8, Math.min(r.left, innerWidth - hoehe.width - 10)) + 'px';
    leiste.style.top = Math.max(8, r.top - hoehe.height - 8) + 'px';

    leiste.addEventListener('mousedown', e => e.preventDefault());
    leiste.addEventListener('click', e => {
      const b = e.target.closest('button[data-a]');
      if (!b) return;
      const a = b.dataset.a;
      const block = markierterBlock();
      const text = getSelection().toString();

      if (a === 'b') return umschliesse('**');
      if (a === 'i') return umschliesse('*');
      if (a === 'u') return umschliesse('__');
      if (a === 's') return umschliesse('~~');
      if (a === 'c') return umschliesse('`');
      if (a === 'm') return umschliesse('$');
      if (a === 'link') {
        const url = prompt('Adresse des Links', 'https://');
        if (!url || url === 'https://') return;
        const bl = markierterBlock();
        if (!bl) return;
        Store.updateBlock(bl.id, { text: (bl.text || '').replace(text, `[${text}](${url})`) });
        App.zeichneSeite(bl.id, 'ende'); weg();
        return;
      }
      if (a === 'ki') {
        weg();
        App.kiPanel(true);
        KI.frageMitAuswahl(text);
        return;
      }
      if (a === 'komm') { weg(); if (block) Kommentare.neu(block, text); return; }
      if (a === 'turn') {
        const rr = b.getBoundingClientRect();
        weg();
        if (block) Blocks.umwandelnMenue(rr, block);
        return;
      }
      if (a === 'farbe') {
        const rr = b.getBoundingClientRect();
        const FARBEN = [['default','Standard'],['gray','Grau'],['brown','Braun'],['orange','Orange'],
          ['yellow','Gelb'],['green','Grün'],['blue','Blau'],['purple','Lila'],['pink','Pink'],['red','Rot']];
        const m = UI.menu(
          '<div class="grp">Textfarbe</div><div class="swatches">' +
          FARBEN.map(([f, n]) => `<button data-c="${f}" title="${n}" style="background:var(--c-${f})"></button>`).join('') +
          '</div><div class="grp">Hintergrund</div><div class="swatches">' +
          FARBEN.slice(1).map(([f, n]) => `<button data-c="bg-${f}" title="${n}" style="background:var(--b-${f})"></button>`).join('') +
          '</div>', rr.left, rr.bottom + 6);
        m.addEventListener('click', ev => {
          const c = ev.target.closest('button[data-c]');
          if (!c || !block) return;
          letzteFarbe = c.dataset.c;
          Store.updateBlock(block.id, { color: c.dataset.c === 'default' ? '' : c.dataset.c });
          m.remove(); weg(); App.zeichneSeite();
        });
        return;
      }
    });
  };

  const letzteFarbeAnwenden = () => {
    const b = markierterBlock();
    if (!b) return;
    Store.updateBlock(b.id, { color: letzteFarbe });
    App.zeichneSeite();
  };

  const start = () => {
    document.addEventListener('mouseup', e => {
      if (e.target.closest('.auswahlleiste') || e.target.closest('.menu')) return;
      setTimeout(zeigen, 10);
    });
    document.addEventListener('keyup', e => {
      if (e.shiftKey && e.key.startsWith('Arrow')) setTimeout(zeigen, 10);
    });
    document.addEventListener('mousedown', e => {
      if (!e.target.closest('.auswahlleiste')) weg();
    });
    document.addEventListener('scroll', weg, true);
  };

  return { start, zeigen, weg, umschliesse, letzteFarbeAnwenden };
})();
window.Auswahl = Auswahl;


/* ==========================================================================
 * 3. ERWÄHNUNGEN UND EMOJIS
 * --------------------------------------------------------------------------
 * @ für Seite, Datum oder Person · : für Emoji — beides mitten im Text.
 * ========================================================================*/
