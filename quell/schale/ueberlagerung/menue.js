/* ============================================================================
 * schale/ueberlagerung/menue.js — Menüs und Kontextmenüs
 * ----------------------------------------------------------------------------
 * Zwei Sorten: das schlichte Menü und das mit Suchfeld. Der Unterschied ist
 * keine Geschmacksfrage — ab etwa fünfzehn Einträgen liest niemand mehr,
 * sondern sucht.
 *
 * Beide sorgen selbst dafür, dass sie ins Bild passen: ein Menü, das unten
 * aus dem Fenster ragt, klappt nach oben. Das klingt nach einer Kleinigkeit
 * und ist der Unterschied zwischen „geht" und „geht am Laptop nicht".
 *
 * Stammt aus der Schale; dort lag es zwischen 2800 Zeilen Anwendungslogik.
 * ==========================================================================*/

const Menue = (() => {


  /** Öffnet ein Menü an einer Position. Schliesst sich beim Klick daneben. */
  /** Auf dem Telefon werden aus Menüs Blätter, die von unten hochfahren. */
  const amTelefon = () => innerWidth <= 760;

  /**
   * @param opt { titel }  Überschrift des Blattes auf dem Telefon
   */
  const menu = (html, x, y, opt = {}) => {
    document.querySelectorAll('.menu, .menu-grund').forEach(m => m.remove());
    const m = document.createElement('div');
    m.className = 'menu';
    m.innerHTML = html;

    if (amTelefon()) {
      /* Blatt von unten — genau wie in Notions Telefon-App */
      m.classList.add('blatt');
      m.innerHTML = '<div class="blatt-griff"></div>' +
        (opt.titel ? `<div class="blatt-titel">${opt.titel}</div>` : '') + html;
      const grund = document.createElement('div');
      grund.className = 'menu-grund';
      grund.addEventListener('click', () => { m.remove(); grund.remove(); });
      document.body.appendChild(grund);
      document.body.appendChild(m);
      /* Nach unten wischen schliesst es */
      let start = 0;
      m.addEventListener('touchstart', e => { start = e.touches[0].clientY; }, { passive: true });
      m.addEventListener('touchend', e => {
        const weg = e.changedTouches[0].clientY - start;
        if (weg > 90 && m.scrollTop <= 0) { m.remove(); grund.remove(); }
      });
      /* Einträge in Karten gruppieren — iOS-Art, wie in Notions App:
         was zwischen zwei Trennlinien steht, kommt in eine Karte. */
      const ziel = m.querySelector('.menu-liste') || m;
      const kinder = [...ziel.children];
      let karte = null;
      kinder.forEach(el => {
        if (el.tagName === 'HR') { karte = null; el.remove(); return; }
        if (el.classList.contains('grp') || el.classList.contains('menu-fuss') ||
            el.classList.contains('menu-suche') || el.classList.contains('av-karte') ||
            el.classList.contains('av-besch') || el.classList.contains('sp-kopf')) {
          karte = null; return;
        }
        if (!karte) {
          karte = document.createElement('div');
          karte.className = 'blatt-karte';
          ziel.insertBefore(karte, el);
        }
        karte.appendChild(el);
      });
      /* Löschen ist rot — genau wie bei Notion */
      m.querySelectorAll('[data-a="del"], [data-a="purge"]').forEach(x => x.classList.add('rot'));

      requestAnimationFrame(() => m.classList.add('auf'));
      return m;
    }

    document.body.appendChild(m);

    /* Nicht über den Rand hinausragen lassen */
    const r = m.getBoundingClientRect();
    m.style.left = Math.max(8, Math.min(x, innerWidth  - r.width  - 8)) + 'px';
    m.style.top  = Math.max(8, Math.min(y, innerHeight - r.height - 8)) + 'px';

    setTimeout(() => {
      const zu = (e) => {
        if (!m.contains(e.target)) { m.remove(); document.removeEventListener('mousedown', zu); }
      };
      document.addEventListener('mousedown', zu);
    }, 0);
    return m;
  };

  /**
   * Ein Menü mit Suchfeld und Fusszeile — das Muster, das in Notion in
   * fast jedem grösseren Menü steckt („Aktionen filtern…", „Suchaktionen…").
   * Getippt wird sofort gefiltert; Pfeiltasten und Enter wählen aus.
   *
   * @param opt { platzhalter, fuss, kopf, breite }
   */
  const menuMitSuche = (html, x, y, opt = {}) => {
    const m = menu(
      (opt.kopf || '') +
      `<div class="menu-suche"><input placeholder="${opt.platzhalter || 'Filtern …'}" ` +
      'autocomplete="off" spellcheck="false"></div>' +
      '<div class="menu-liste">' + html + '</div>' +
      (opt.fuss ? '<div class="menu-fuss">' + opt.fuss + '</div>' : ''),
      x, y, { titel: opt.titel });
    if (opt.breite && !m.classList.contains('blatt')) m.style.width = opt.breite;

    const feld = m.querySelector('.menu-suche input');
    const liste = m.querySelector('.menu-liste');

    const sichtbare = () => [...liste.querySelectorAll('button')]
      .filter(b => b.offsetParent !== null || b.style.display !== 'none')
      .filter(b => b.style.display !== 'none' &&
                   (!b.parentElement.style.display || b.parentElement.style.display !== 'none'));

    const markiere = (b) => {
      liste.querySelectorAll('button.jetzt').forEach(x2 => x2.classList.remove('jetzt'));
      if (!b) return;
      b.classList.add('jetzt');
      b.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    };

    /* Der Filter kennt die Form des Menüs nicht: Knöpfe können direkt
       darinliegen oder in einem Gitter stecken. Deshalb wird nach Knöpfen
       gesucht, nicht nach einer bestimmten Verschachtelung. */
    const filtern = () => {
      const q = feld.value.trim().toLowerCase();
      let gruppe = null, inGruppe = 0;

      const abschliessen = () => {
        if (gruppe && !inGruppe) gruppe.style.display = 'none';
      };

      [...liste.children].forEach(el => {
        if (el.classList.contains('grp')) {
          abschliessen();
          gruppe = el; inGruppe = 0;
          el.style.display = '';
          return;
        }
        if (el.tagName === 'HR') { el.style.display = q ? 'none' : ''; return; }

        const knoepfe = el.tagName === 'BUTTON' ? [el] : [...el.querySelectorAll('button')];
        if (!knoepfe.length) return;
        let sichtbar = 0;
        knoepfe.forEach(b => {
          const treffer = !q || b.textContent.toLowerCase().includes(q);
          b.style.display = treffer ? '' : 'none';
          if (treffer) sichtbar++;
        });
        if (el.tagName !== 'BUTTON') el.style.display = sichtbar ? '' : 'none';
        inGruppe += sichtbar;
      });
      abschliessen();

      markiere(sichtbare()[0]);
    };

    feld.addEventListener('input', filtern);
    feld.addEventListener('keydown', e => {
      const alle = sichtbare();
      const i = alle.findIndex(b => b.classList.contains('jetzt'));
      if (e.key === 'ArrowDown') { e.preventDefault(); markiere(alle[Math.min(i + 1, alle.length - 1)]); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); markiere(alle[Math.max(i - 1, 0)]); }
      if (e.key === 'Enter')     { e.preventDefault(); (alle[i] || alle[0])?.click(); }
      if (e.key === 'Escape')    { e.preventDefault(); m.remove(); }
    });
    liste.addEventListener('mousemove', e => {
      const b = e.target.closest('button');
      if (b && !b.classList.contains('jetzt')) markiere(b);
    });

    markiere(sichtbare()[0]);
    setTimeout(() => feld.focus(), 30);
    return m;
  };

  let toastTimer = null;
  /**
   * Eine kurze Meldung.
   * @param {string} text
   * @param {number} dauer  wie lange sie stehen bleibt — für laufende
   *                        Arbeiten (ein Upload) länger, sonst 2,6 Sekunden
   * @returns ein Griff mit setzen() und weg(), damit eine laufende Meldung
   *          sich fortschreiben lässt, statt zehnmal neu zu erscheinen
   */

  return { menu, menuMitSuche, amTelefon };
})();

window.Menue = Menue;
