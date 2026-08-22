/* ============================================================================
 * schale/aufbau/kopfleiste.js — alles über dem Inhalt
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/schale/aufbau/kopfleiste.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/schale/aufbau/kopfleiste.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
 * Cover, Symbol, Titel, der Hinweis auf den Schreibschutz, die Werkzeugzeile
 * — und die Pfadleiste ganz oben im Fenster. Es lag bis hierher mitten in
 * `zeichneSeite`, zusammen mit dem Zeichnen der Blöcke, in einer Funktion von
 * 160 Zeilen.
 *
 * WAS DARAN LEICHT SCHIEFGEHT
 *
 * 1. Die REIHENFOLGE. Cover, Symbol, Titel, Sperrhinweis, Werkzeugzeile —
 *    alle hängen sich nacheinander in dasselbe Element. Wer eines
 *    verschiebt, verschiebt es auf dem Bildschirm. Ein Cover unter dem Titel
 *    sieht aus wie ein Stilfehler, und man sucht dann in der CSS.
 *
 * 2. `zeichne` gibt einen Wahrheitswert zurück, und der ist kein Beiwerk:
 *    **false heisst, dass hier Schluss ist.** Eine verschlüsselte Seite
 *    (`locked`) bekommt den Sperrbildschirm und danach nichts mehr — keine
 *    Werkzeugzeile, keine Blöcke, keine Rückverweise. Wer den Rückgabewert
 *    ignoriert, zeigt verschlüsselten Inhalt an.
 *
 * 3. `locked` und `gesperrt` sind zwei verschiedene Dinge, und sie lesen
 *    sich ähnlich. `gesperrt` ist der Schreibschutz: die Seite ist zu sehen,
 *    aber nicht zu ändern — sie bekommt nur einen Hinweis. `locked` ist die
 *    Verschlüsselung.
 *
 * 4. `pfad()` zeichnet nicht nur die Pfadleiste. Es setzt nebenbei Stern,
 *    Schloss und den Blitz in der Kopfzeile. Das ist leicht zu übersehen —
 *    verliert man es, bricht nichts, die Knöpfe zeigen nur für immer den
 *    falschen Zustand.
 * ==========================================================================*/

const Kopfleiste = (() => {

  /* Das angeklickte Element — oder nichts. `e.target` ist `EventTarget | null`
     und muss ein `Element` sein, bevor `closest` daran etwas findet. Vorher
     stand hier ungeprüft `e.target.closest(…)`: bei einem Klick, dessen Ziel
     kein Element ist, warf das mitten im Behandeln. */
  const elVon = (e: Event): Element | null =>
    e.target instanceof Element ? e.target : null;

  const esc = (s: unknown): string => String(s ?? '')
    .replace(/[<>&"]/g, c => ({ '<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;' } as Record<string, string>)[c] ?? c);

  let gebunden: Record<string, (...args: any[]) => any> = {};

  const braucht = (name: string) => (...args: unknown[]): any => {
    const fn = gebunden[name];
    if (typeof fn !== 'function') {
      throw new Error('Die Kopfleiste wurde ohne „' + name + '" gebunden. ' +
        'Die Kopfleiste.binde({ … }) gehört an den Anfang von App.start(), vor das erste Zeichnen.');
    }
    return fn(...args);
  };

  const binde = (teile: Record<string, (...args: any[]) => any> | null | undefined): void => { gebunden = Object.assign({}, gebunden, teile || {}); };

  const zeichneSeite  = braucht('zeichneSeite');
  const zeichneBaum   = braucht('zeichneBaum');
  const kiPanel       = braucht('kiPanel');
  const oeffne        = braucht('oeffne');
  const aktuelleSeite = braucht('aktuelleSeite');
  /* Die Sonderansicht ist ein Zustand der Schale, kein Aufruf — deshalb ein
     Leser statt einer Weiterreichung. */
  const sonderJetzt   = () =>
    (typeof gebunden['sonder'] === 'function' ? gebunden['sonder']() : null);

  /** Eine Gruppe im Titelbild-Wähler: Überschrift und ihre Auswahl. */
  const COVER_GRUPPEN: [string, string[]][] = [
    ['Farbe und Gradient', [
      '#e03e3e', '#ffdc49', '#2eaadc', '#f7f3ee',
      'linear-gradient(160deg,#7fd4d0,#e8c9b0)', 'linear-gradient(160deg,#ff2d78,#ff7bb0)',
      'linear-gradient(160deg,#e8845a,#e03e3e)', 'linear-gradient(160deg,#cfe3ee,#e8b9a8)',
      'linear-gradient(140deg,#2b6cb0,#e03e3e)', 'linear-gradient(140deg,#6d5bd0,#e255a1)',
      'linear-gradient(140deg,#c9a89a,#529cca)'
    ]],
    ['Verläufe und Flächen', [
      'linear-gradient(120deg,#2eaadc,#9a6dd7)', 'linear-gradient(120deg,#ffa344,#ff7369)',
      'linear-gradient(120deg,#4dab9a,#529cca)', 'linear-gradient(120deg,#37352f,#787774)',
      'linear-gradient(200deg,#529cca,#4dab9a)', 'linear-gradient(200deg,#ffdc49,#4dab9a)',
      '#9a6dd7', '#4dab9a'
    ]],
    ['Papier und Struktur', [
      'repeating-linear-gradient(45deg,#3a3a38,#3a3a38 6px,#403f3c 6px,#403f3c 12px)',
      'repeating-linear-gradient(90deg,#2f4858,#2f4858 4px,#33506080 4px,#33506080 8px)',
      'radial-gradient(circle at 30% 30%,#6b8f9c,#2f4858)',
      'radial-gradient(circle at 70% 20%,#c9b8a8,#6b5b4d)',
      'conic-gradient(from 200deg,#4dab9a,#529cca,#9a6dd7,#4dab9a)',
      'conic-gradient(from 20deg,#ffa344,#e03e3e,#9a6dd7,#ffa344)'
    ]]
  ];

  const coverWaehlen = (p: any): void => {
    let reiter = 'galerie';
    const o = document.createElement('div');
    o.className = 'overlay cover-overlay';
    document.body.appendChild(o);

    const zeichne = () => {
      o.innerHTML =
        '<div class="cover-blatt">' +
          '<div class="cb-kopf">' +
            '<button class="cb-links" data-a="weg">Entfernen</button>' +
            '<b>Seiten-Cover</b>' +
            '<button class="cb-rechts" data-a="zu">Schliessen</button>' +
          '</div>' +
          '<div class="cb-reiter">' +
            [['galerie', 'Galerie'], ['hoch', 'Hochladen'], ['link', 'Link']]
              .map(([id, n]) => `<button data-r="${id}" class="${reiter === id ? 'on' : ''}">${n}</button>`).join('') +
          '</div>' +
          '<div class="cb-inhalt">' +
            (reiter === 'galerie'
              ? COVER_GRUPPEN.map(([name, liste]) =>
                  `<div class="cb-grp">${esc(name)}</div>` +
                  '<div class="cover-gitter">' +
                    liste.map((f: any) => `<button data-c="${esc(f)}" style="background:${f}"` +
                      `${p.cover === f ? ' class="on"' : ''}></button>`).join('') +
                  '</div>').join('')
              : reiter === 'hoch'
                ? '<div class="cb-mitte"><button class="cb-knopf" data-a="bild">Bild wählen</button>' +
                  '<div class="cb-hinweis">Bis 6 MB. Das Bild bleibt auf diesem Gerät.</div></div>'
                : '<div class="cb-mitte"><input id="cb-link" placeholder="https://…">' +
                  '<button class="cb-knopf" data-a="linkok">Übernehmen</button>' +
                  '<div class="cb-hinweis">Die Adresse eines Bildes im Netz.</div></div>') +
          '</div>' +
        '</div>';
    };
    zeichne();

    o.addEventListener('click', e => {
      const r = elVon(e)?.closest<HTMLElement>('[data-r]');
      if (r?.dataset["r"]) { reiter = r.dataset["r"]; zeichne(); return; }
      const c = elVon(e)?.closest<HTMLElement>('[data-c]');
      if (c) { Store.updateBlock(p.id, { cover: c.dataset["c"] }); o.remove(); zeichneSeite(); return; }
      if (elVon(e)?.closest<HTMLElement>('[data-a="weg"]')) {
        Store.updateBlock(p.id, { cover: '' }); o.remove(); zeichneSeite(); return;
      }
      if (elVon(e)?.closest<HTMLElement>('[data-a="linkok"]')) {
        const v = (o.querySelector<HTMLInputElement>('#cb-link')?.value ?? '').trim();
        if (v) { Store.updateBlock(p.id, { cover: v }); o.remove(); zeichneSeite(); }
        return;
      }
      if (elVon(e)?.closest<HTMLElement>('[data-a="bild"]')) {
        const inp = document.createElement('input');
        inp.type = 'file'; inp.accept = 'image/*';
        inp.addEventListener('change', () => {
          const f = inp.files?.[0]; if (!f) return;
          if (f.size > 6 * 1024 * 1024) { UI.toast('Bitte ein Bild unter 6 MB'); return; }
          const rd = new FileReader();
          rd.onload = () => { Store.updateBlock(p.id, { cover: rd.result }); o.remove(); zeichneSeite(); };
          rd.readAsDataURL(f);
        });
        inp.click();
        return;
      }
      if (elVon(e)?.closest<HTMLElement>('[data-a="zu"]') || e.target === o) o.remove();
    });
  };

  /**
   * Der Fenstertitel folgt der offenen Seite: „Projekte — Redion".
   *
   * Er stand dauerhaft auf „Redion". In einem Fenster unter zwanzig anderen
   * ist das keine Auskunft, ein Lesezeichen darauf heisst später auch nur
   * so, und ein Vorleseprogramm nennt den Fenstertitel beim Wechsel — es
   * sagte also bei jeder Seite dasselbe.
   */
  const fensterTitel = (text: unknown): void => {
    const t = String(text ?? '').trim();
    document.title = t ? t + ' — Redion' : 'Redion';
  };

  /* ------------------------------------------------------------------------
   * Der Kopf einer Seite.
   * Gibt `false` zurück, wenn danach Schluss ist — siehe Punkt 2 oben.
   * ----------------------------------------------------------------------*/
  const zeichne = (wrap: HTMLElement, p: any): boolean => {
    /* Cover */
    if (p.cover) {
      const c = document.createElement('div');
      c.className = 'cover';
      c.style.background = p.cover.startsWith('#') || p.cover.startsWith('linear')
        ? p.cover : `url(${p.cover}) center/cover`;
      wrap.appendChild(c);
    }

    /* Symbol */
    const ico = document.createElement('div');
    ico.className = 'pg-icon';
    ico.textContent = p.icon || '📄';
    ico.addEventListener('click', () => UI.emojiWaehlen(ico, (e) => {
      Store.updateBlock(p.id, { icon: e });
      zeichneSeite(); zeichneBaum();
    }));
    wrap.appendChild(ico);

    /* Titel */
    const t = document.createElement('div');
    t.id = 'title';
    /* EIN TITEL, DER KEINE ÜBERSCHRIFT IST, IST FÜR EIN VORLESEPROGRAMM
       nur ein Absatz irgendwo auf der Seite. Wer nicht sieht, springt von
       Überschrift zu Überschrift — gemessen am 7. August fand die Seite
       null davon, den eigenen Titel eingeschlossen.

       `role="heading"` statt eines echten `<h1>`: das Feld ist bearbeitbar
       und trägt eigene Masse; ein Elementwechsel wäre ein Umbau des
       Aussehens für einen Zweck, den zwei Angaben genauso erfüllen. Für
       ein Vorleseprogramm sind beide dasselbe. */
    t.setAttribute('role', 'heading');
    t.setAttribute('aria-level', '1');
    t.contentEditable = p.gesperrt ? 'false' : 'true';
    t.spellcheck = !!Store.getMeta('rechtschreib', false);
    t.textContent = p.text || '';
    /* Und der Fenstertitel sagt, wo man ist. Er stand dauerhaft auf
       „Redion" — in einem Fenster unter zwanzig anderen ist das keine
       Auskunft, und ein Lesezeichen darauf heisst später auch nur so. */
    fensterTitel(p.text);
    t.addEventListener('input', () => {
      Store.updateBlock(p.id, { text: t.textContent });
      fensterTitel(t.textContent);
      zeichneBaum();
    });
    t.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const erste = Store.childrenOf(p.id)[0];
        if (erste) {
          const ct = document.querySelector<HTMLElement>(`[data-bid="${erste.id}"] .ct`);
          if (ct) ct.focus();
        } else {
          const b = Store.addBlock(p.id, 'text');
          zeichneSeite(b.id);
        }
      }
    });
    wrap.appendChild(t);

    /* Hinweis bei gesperrter Seite */
    if (p.gesperrt) {
      const h = document.createElement('div');
      h.className = 'sperrhinweis';
      h.innerHTML = '🔏 Diese Seite ist gegen Bearbeiten gesperrt. ' +
                    '<button data-a="auf">Bearbeiten erlauben</button>';
      h.addEventListener('click', e => {
        if (elVon(e)?.closest<HTMLElement>('[data-a="auf"]')) {
          Store.updateBlock(p.id, { gesperrt: false }); zeichneSeite();
        }
      });
      wrap.appendChild(h);
    }

    /* Verschlüsselte Seite: nur der Sperrbildschirm, und dann nichts mehr. */
    if (p.locked) {
      Werkzeuge.sperrAnsicht(p, wrap);
      return false;
    }

    /* Werkzeugzeile */
    if (!p.ohneTools) {
      const tools = document.createElement('div');
      tools.className = 'pg-tools';
      tools.innerHTML =
        '<button data-a="cover">🖼 Cover</button>' +
        '<button data-a="wide">' + (p.wide ? '↹ Normale Breite' : '↔ Volle Breite') + '</button>' +
        (DocumentMode.available(p)
          ? '<button data-a="document">▤ ' + (DocumentMode.active(p) ? 'Normale Seite' : 'Dokumentmodus') + '</button>'
          : '') +
        (p.schoolRoot ? '<button data-a="electrical">⚡ Rechner</button>' : '') +
        '<button data-a="font">🅰 Schrift</button>' +
        '<button data-a="vorlage">🧩 Vorlage</button>' +
        '<button data-a="ai">✨ Mit KI</button>';
      tools.addEventListener('click', e => {
        const b = elVon(e)?.closest<HTMLElement>('button[data-a]');
        if (!b) return;
        const a = b.dataset.a;
        if (a === 'cover') coverWaehlen(p);
        if (a === 'wide') { Store.updateBlock(p.id, { wide: !p.wide }); zeichneSeite(); }
        if (a === 'document') DocumentMode.toggle(p);
        if (a === 'electrical') Electrical.open(p);
        if (a === 'vorlage') Werkzeuge.vorlageEinfuegen(p);
        if (a === 'font') {
          const r = b.getBoundingClientRect();
          const m = UI.menu(
            '<button data-f="default">Standard</button>' +
            '<button data-f="serif">Serif</button>' +
            '<button data-f="mono">Monospace</button>' +
            '<hr><button data-f="small">Kleiner Text an/aus</button>', r.left, r.bottom + 4);
          m.addEventListener('click', ev => {
            const f = elVon(ev)?.closest<HTMLElement>('button[data-f]');
            if (!f) return;
            if (f.dataset.f === 'small') Store.updateBlock(p.id, { small: !p.small });
            else Store.updateBlock(p.id, { font: f.dataset.f });
            m.remove(); zeichneSeite();
          });
        }
        if (a === 'ai') kiPanel(true);
      });
      wrap.appendChild(tools);
    }

    return true;
  };

  /* ------------------------------------------------------------------------
   * Die Pfadleiste — und die Knöpfe rechts daneben.
   * ----------------------------------------------------------------------*/
  const pfad = (): void => {
    const sonder = sonderJetzt();
    const seiteId = aktuelleSeite();
    const c = document.getElementById('crumb');
    /* Ohne Brotkrume gibt es keinen Pfad zu zeichnen — und, siehe Punkt 4 im
       Kopf, auch keinen Stern, kein Schloss und keinen Blitz. Die hängen
       alle an der Kopfzeile, die es dann nicht gibt. */
    if (!c) return;
    if (sonder) { c.innerHTML = '<a>' + esc(sonder.titel) + '</a>'; return; }
    if (!seiteId) { c.innerHTML = ''; return; }
    /* „Pfadnavigation anzeigen" — aus zeigt nur die Seite selbst */
    const jetzt = Store.getBlock(seiteId);
    const pfad = jetzt && jetzt.pfad === false ? [jetzt] : Store.pathOf(seiteId);
    c.innerHTML = pfad.map((p: any, i: any) =>
      `<a data-id="${p.id}">${p.icon || ''} ${esc(p.text || 'Ohne Titel')}</a>` +
      (i < pfad.length - 1 ? '<span class="sep">/</span>' : '')).join('');
    c.querySelectorAll('a').forEach(a =>
      a.addEventListener('click', () => oeffne(a.dataset['id'])));

    /* Stern und Kommentarzähler in der Kopfzeile */
    const p = Store.getBlock(seiteId);
    const stern = document.getElementById('btn-fav');
    if (stern && p) {
      stern.textContent = p.favorite ? '★' : '☆';
      stern.classList.toggle('on', !!p.favorite);
    }
    const kb = document.getElementById('btn-komm');
    if (kb && p) {
      const n = Kommentare.offeneAnzahl(p.id);
      kb.textContent = n ? '💬 ' + n : '💬';
    }
    /* Schloss zeigt den Zustand, nicht nur die Aktion */
    const schloss = document.getElementById('btn-lock');
    if (schloss && p) {
      schloss.textContent = p.gesperrt ? '🔒' : '🔓';
      schloss.classList.toggle('on', !!p.gesperrt);
      schloss.title = p.gesperrt ? 'Seite ist gesperrt — zum Entsperren klicken'
                                 : 'Seite gegen Bearbeiten sperren';
    }
    /* Der Blitz nur dort, wo es auch eine Datenbank gibt */
    const blitz = document.getElementById('btn-auto');
    if (blitz && p) {
      const hatDb = Store.childrenOf(p.id).some((b: any) => b.type === 'database');
      blitz.style.display = hatDb ? '' : 'none';
    }
  };

  return { binde, zeichne, pfad, coverWaehlen };
})();

(window as any).Kopfleiste = Kopfleiste;
