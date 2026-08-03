/* ==========================================================================
 * WOLKE-FENSTER — die Oberfläche zum Server
 * --------------------------------------------------------------------------
 * Alles, was der Mensch von der Wolke sieht: anmelden, abgleichen, teilen,
 * veröffentlichen, Marken verwalten.
 *
 * Eine Regel für jedes Fenster hier: es sagt, was mit den Daten geschieht,
 * bevor es geschieht. „Diese Seite geht im Klartext auf den Server" steht
 * über dem Knopf, nicht in einer Fussnote.
 * ========================================================================*/
const WolkeFenster = (() => {

  const esc = (s) => String(s ?? '').replace(/[&<>"]/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const zu = () => document.querySelectorAll('.overlay').forEach(o => o.remove());

  /* ========================================================================
   * 1 · DAS HAUPTFENSTER
   * ======================================================================*/
  const dialog = () => {
    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML = '<div class="finder" style="width:min(640px,95vw)">' +
      '<div class="fh">☁ Wolke<button class="icon-btn" data-a="zu">✕</button></div>' +
      '<div class="res" id="wo-inhalt" style="padding:18px"></div></div>';
    document.body.appendChild(o);

    const zeichne = async () => {
      const ziel = o.querySelector('#wo-inhalt');
      ziel.innerHTML = Wolke.angemeldet() ? angemeldetHtml() : abgemeldetHtml();
      if (Wolke.angemeldet()) await zahlenNachtragen(ziel);
    };

    o.addEventListener('click', async (e) => {
      if (e.target === o || e.target.closest('[data-a="zu"]')) { o.remove(); return; }
      const a = e.target.closest('[data-a]');
      if (!a) return;
      const was = a.dataset.a;

      try {
        if (was === 'github' || was === 'google') {
          a.disabled = true; a.textContent = 'Fenster geöffnet …';
          await Wolke.anmeldenMit(was);
          await schluesselFragen();
          await zeichne();
        }
        if (was === 'code')      { o.remove(); codeFenster(); }
        if (was === 'freigeben') { o.remove(); freigebenFenster(); }
        if (was === 'abmelden') {
          if (!confirm('Abmelden? Deine Notizen bleiben auf diesem Gerät — ' +
                       'nur der Abgleich hört auf.')) return;
          await Wolke.abmelden();
          await zeichne();
        }
        if (was === 'jetzt') {
          a.disabled = true; a.textContent = 'Läuft …';
          const r = await Wolke.abgleichen();
          UI.toast(r ? (r.uebernommen + ' geholt, ' + r.angenommen + ' geschickt' +
            (r.unlesbar ? ' · ' + r.unlesbar + ' nicht lesbar' : '')) : 'Nichts zu tun');
          await zeichne();
        }
        if (was === 'schluessel') { await schluesselFragen(); await zeichne(); }
        if (was === 'marken')     { o.remove(); markenFenster(); }
        if (was === 'adresse') {
          const neu = await UI.frage('Adresse des Servers',
            Wolke.adresse() || 'https://…');
          if (neu !== null) { Store.setMeta('wolkeAdresse', neu.trim()); await zeichne(); }
        }
      } catch (err) {
        UI.toast(err.message || String(err));
        await zeichne();
      }
    });

    zeichne();
  };

  /* ------------------------------------------------------------------ */
  const abgemeldetHtml = () => {
    const wurzel = Wolke.adresse();
    return (
      '<div style="font-size:13px; color:var(--text-dim); line-height:1.65; margin-bottom:18px">' +
        'Ohne Konto liegt alles auf diesem Gerät — so wie bisher, und so bleibt es, ' +
        'wenn du dieses Fenster einfach schliesst.<br><br>' +
        '<b>Mit Konto</b> bekommst du vier Dinge, die ohne Server nicht gehen: ' +
        'dieselben Notizen auf Rechner und Telefon, Rechte die wirklich sperren, ' +
        'eine Seite zum Verschicken an Leute ohne Redion, und eine Schnittstelle ' +
        'von aussen.' +
      '</div>' +
      (wurzel
        ? '<div style="display:flex; flex-direction:column; gap:9px">' +
            '<button data-a="github" class="prim" style="justify-content:center">' +
              'Mit GitHub anmelden</button>' +
            '<button data-a="google" style="justify-content:center">' +
              'Mit Google anmelden</button>' +
            '<button data-a="code" style="justify-content:center">' +
              'Mit einem Code von einem anderen Gerät</button>' +
          '</div>'
        : '<div style="padding:14px; border:1px solid var(--line); border-radius:8px; ' +
          'font-size:13px; line-height:1.6">Redion läuft gerade als Datei auf deinem ' +
          'Rechner — da gibt es keinen Server. Öffne es über eine Adresse, oder trage ' +
          'unten eine eigene ein.</div>') +
      '<hr style="border:none;border-top:1px solid var(--line); margin:18px 0">' +
      '<div style="font-size:12px; color:var(--text-faint); line-height:1.6">' +
        'Server: <code>' + esc(wurzel || 'keiner') + '</code> ' +
        '<button data-a="adresse" style="font-size:11.5px; padding:2px 8px">ändern</button>' +
        '<br><br>Private Seiten werden auf diesem Gerät verschlüsselt und verlassen es ' +
        'nur so. Der Schlüssel wird nie mitgeschickt — der Server sieht bei ihnen nichts ' +
        'als Buchstabensalat.' +
      '</div>');
  };

  const angemeldetHtml = () => {
    const z = Wolke.zustand;
    const k = z.konto || {};
    return (
      '<div style="display:flex; gap:13px; align-items:center; margin-bottom:16px">' +
        (k.bild ? `<img src="${esc(k.bild)}" style="width:42px;height:42px;border-radius:50%">`
                : '<div style="width:42px;height:42px;border-radius:50%;background:var(--bg-hover);' +
                  'display:grid;place-items:center;font-size:19px">👤</div>') +
        '<div style="flex:1"><b style="font-size:15px">' + esc(k.name || 'Angemeldet') + '</b>' +
          '<div style="font-size:12px;color:var(--text-faint)">' + esc(k.mail || '') + '</div></div>' +
        '<button data-a="abmelden" style="font-size:12.5px">Abmelden</button>' +
      '</div>' +

      '<div id="wo-zahlen" style="display:flex; gap:9px; margin-bottom:16px; flex-wrap:wrap"></div>' +

      '<div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:16px">' +
        '<button data-a="jetzt" class="prim">Jetzt abgleichen</button>' +
        '<button data-a="freigeben">Anderes Gerät freigeben</button>' +
        '<button data-a="marken">Marken</button>' +
      '</div>' +

      (Wolke.hatSchluessel()
        ? '<div style="padding:12px; border:1px solid var(--line); border-radius:8px; ' +
          'font-size:12.5px; line-height:1.6; color:var(--text-dim)">' +
          '🔒 Der Schlüssel ist gesetzt. Private Seiten gehen verschlüsselt hinaus — ' +
          'der Server kann sie nicht lesen. Nur was du ausdrücklich teilst oder ' +
          'veröffentlichst, geht im Klartext.</div>'
        : '<div style="padding:12px; border:1px solid var(--warn,#c88); border-radius:8px; ' +
          'font-size:12.5px; line-height:1.6">' +
          '⚠ Es ist kein Schlüssel gesetzt. Ohne ihn liegen deine Seiten im Klartext auf ' +
          'dem Server. <button data-a="schluessel" style="font-size:12px;margin-top:7px">' +
          'Schlüssel setzen</button></div>') +

      (z.fehler ? '<div style="margin-top:13px; font-size:12.5px; color:var(--rot,#d64545)">' +
        esc(z.fehler) + '</div>' : '') +

      '<div style="margin-top:16px; font-size:12px; color:var(--text-faint); line-height:1.6">' +
        'Letzter Abgleich: ' + (z.letzter ? esc(new Date(z.letzter).toLocaleString('de-CH'))
                                          : 'noch keiner') +
        '<br>Gerät: ' + esc(Wolke.geraeteName()) +
        '<br>Server: <code>' + esc(Wolke.adresse()) + '</code>' +
      '</div>');
  };

  const zahlenNachtragen = async (ziel) => {
    const kasten = ziel.querySelector('#wo-zahlen');
    if (!kasten) return;
    const offen = Wolke.zuSchicken().length;
    const kachel = (n, t, farbe) =>
      '<div style="flex:1; min-width:96px; padding:11px; border:1px solid var(--line); ' +
      'border-radius:8px; text-align:center">' +
      `<div style="font-size:21px; font-weight:600${farbe ? ';color:' + farbe : ''}">${n}</div>` +
      `<div style="font-size:11.5px; color:var(--text-faint)">${t}</div></div>`;
    kasten.innerHTML = kachel(offen, offen === 1 ? 'wartet' : 'warten',
                              offen ? 'var(--accent)' : '') +
                       kachel(Wolke.zustand.hoch, 'geschickt') +
                       kachel(Wolke.zustand.runter, 'geholt');
  };

  /* ========================================================================
   * 2 · DER SCHLÜSSEL
   * ======================================================================*/
  const schluesselFragen = async () => {
    const satz = await UI.frage(
      'Ein Satz, den nur du kennst — daraus entsteht der Schlüssel', '');
    if (!satz) return false;
    if (satz.length < 8) {
      UI.toast('Zu kurz. Nimm einen ganzen Satz, keine acht Zeichen.');
      return false;
    }
    const ok = await Wolke.schluesselSetzen(satz);
    UI.toast(ok ? '🔒 Schlüssel gesetzt'
                : 'Das passt nicht zu dem, was schon verschlüsselt ist. Tippfehler?');
    return ok;
  };

  /* ========================================================================
   * 3 · ANMELDEN MIT CODE
   * ======================================================================*/
  const codeFenster = async () => {
    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML = '<div class="finder" style="width:min(460px,94vw)">' +
      '<div class="fh">Mit einem Code anmelden<button class="icon-btn" data-a="zu">✕</button></div>' +
      '<div class="res" id="wo-code" style="padding:22px; text-align:center">' +
      '<div style="font-size:13px;color:var(--text-dim)">Wird geholt …</div></div></div>';
    document.body.appendChild(o);
    o.addEventListener('click', e => {
      if (e.target === o || e.target.closest('[data-a="zu"]')) o.remove();
    });

    try {
      const a = await Wolke.codeHolen();
      o.querySelector('#wo-code').innerHTML =
        '<div style="font-size:13px; color:var(--text-dim); line-height:1.65; margin-bottom:18px">' +
          'Öffne Redion auf einem Gerät, an dem du schon angemeldet bist, gehe dort auf ' +
          '<b>Wolke → Anderes Gerät freigeben</b> und tippe diesen Code ein:</div>' +
        '<div style="font:600 30px/1.3 ui-monospace,monospace; letter-spacing:3px; ' +
          'padding:16px; border:1px solid var(--line); border-radius:10px; ' +
          'margin-bottom:14px">' + esc(a.code) + '</div>' +
        '<div style="font-size:12px; color:var(--text-faint)">Zehn Minuten gültig. ' +
          'Dieses Fenster wartet.</div>';

      const konto = await Wolke.codeWarten(a.code);
      o.querySelector('#wo-code').innerHTML =
        '<div style="font-size:34px; margin-bottom:12px">✅</div>' +
        '<b style="font-size:16px">Angemeldet als ' + esc(konto.name) + '</b>';
      setTimeout(async () => { o.remove(); await schluesselFragen(); dialog(); }, 1200);
    } catch (e) {
      o.querySelector('#wo-code').innerHTML =
        '<div style="font-size:13px; color:var(--rot,#d64545)">' + esc(e.message) + '</div>';
    }
  };

  const freigebenFenster = async () => {
    const code = await UI.frage('Den Code vom anderen Gerät eintippen', '');
    if (!code) return;
    try {
      await Wolke.codeFreigeben(code.trim().toUpperCase());
      UI.toast('✅ Freigegeben. Das andere Gerät meldet sich gleich an.');
    } catch (e) { UI.toast(e.message); }
  };

  /* ========================================================================
   * 4 · TEILEN — je Seite
   * ======================================================================*/
  const teilenFenster = async (seiteId) => {
    const seite = Store.getBlock(seiteId);
    if (!seite) return;
    if (!Wolke.angemeldet()) {
      UI.toast('Zum Teilen brauchst du ein Konto — siehe Wolke.');
      dialog();
      return;
    }

    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML = '<div class="finder" style="width:min(600px,95vw)">' +
      '<div class="fh">↗ Teilen: ' + esc(seite.text || 'Ohne Titel') +
        '<button class="icon-btn" data-a="zu">✕</button></div>' +
      '<div class="res" id="wo-teil" style="padding:18px">Wird geladen …</div></div>';
    document.body.appendChild(o);

    const zeichne = async () => {
      const offen = Wolke.istGeteilt(seiteId);
      let liste = { freigaben: [] };
      try { liste = await Wolke.freigaben(); } catch {}
      const meine = liste.freigaben.filter(f => f.seite === seiteId);

      o.querySelector('#wo-teil').innerHTML =
        '<div style="padding:13px; border:1px solid ' +
          (offen ? 'var(--line)' : 'var(--warn,#c88)') + '; border-radius:8px; ' +
          'font-size:12.5px; line-height:1.65; margin-bottom:16px">' +
          (offen
            ? '🔓 Diese Seite geht <b>im Klartext</b> auf den Server. Anders könnte er ' +
              'weder Rechte prüfen noch sie an jemanden ausliefern. Alle anderen Seiten ' +
              'bleiben verschlüsselt.'
            : '🔒 Diese Seite ist verschlüsselt. Zum Teilen muss sie lesbar werden — ' +
              'das ist eine bewusste Entscheidung, deshalb dieser Schalter.') +
          '<div style="margin-top:10px"><label style="display:flex;gap:8px;align-items:center">' +
          '<input type="checkbox" id="wo-offen"' + (offen ? ' checked' : '') + '> ' +
          'Für die Freigabe lesbar machen</label></div>' +
        '</div>' +

        '<div style="display:flex; gap:7px; margin-bottom:14px">' +
          '<input id="wo-mail" placeholder="Adresse der Person" style="flex:1">' +
          '<select id="wo-rolle">' +
            '<option value="lesen">Lesen</option>' +
            '<option value="komm">Kommentieren</option>' +
            '<option value="edit">Bearbeiten</option>' +
            '<option value="voll">Vollzugriff</option>' +
            '<option value="kein">Kein Zugriff</option>' +
          '</select>' +
          '<button data-a="einladen" class="prim">Einladen</button>' +
        '</div>' +

        (meine.length
          ? '<div style="margin-bottom:16px">' + meine.map(f =>
              '<div style="display:flex;gap:10px;align-items:center;padding:7px 2px;' +
              'font-size:13px"><span style="flex:1">' + esc(f.name) +
              (f.mail ? ' <span style="color:var(--text-faint)">' + esc(f.mail) + '</span>' : '') +
              '</span><code style="font-size:11.5px">' + esc(f.rolle) + '</code>' +
              '<button data-weg="' + esc(f.kontoId) + '" style="font-size:12px">✕</button></div>'
            ).join('') + '</div>'
          : '<div style="font-size:12.5px;color:var(--text-faint);margin-bottom:16px">' +
            'Noch niemand eingeladen.</div>') +

        '<hr style="border:none;border-top:1px solid var(--line); margin:16px 0">' +
        '<div style="font-size:13px; margin-bottom:10px"><b>Ins Netz stellen</b></div>' +
        '<div style="font-size:12.5px; color:var(--text-dim); line-height:1.6; margin-bottom:12px">' +
          'Die Seite bekommt eine eigene Adresse. Wer sie hat, kann sie ansehen — ' +
          'auch ohne Redion und ohne Konto.</div>' +
        '<div style="display:flex; gap:7px; flex-wrap:wrap">' +
          '<input id="wo-pw" placeholder="Passwort (freiwillig)" style="flex:1;min-width:150px">' +
          '<input id="wo-tage" type="number" placeholder="Tage" style="width:90px">' +
          '<button data-a="netz" class="prim">Veröffentlichen</button>' +
          '<button data-a="zurueck">Zurückziehen</button>' +
        '</div>' +
        '<div id="wo-adresse" style="margin-top:12px; font-size:12.5px"></div>';

      o.querySelector('#wo-offen').addEventListener('change', (e) => {
        Wolke.geteiltSetzen(seiteId, e.target.checked);
        UI.toast(e.target.checked
          ? 'Beim nächsten Abgleich geht sie lesbar hinaus'
          : 'Sie wird wieder verschlüsselt');
        zeichne();
      });
    };

    o.addEventListener('click', async (e) => {
      if (e.target === o || e.target.closest('[data-a="zu"]')) { o.remove(); return; }
      const weg = e.target.closest('[data-weg]');
      if (weg) {
        try { await Wolke.freigeben(seiteId, weg.dataset.weg, 'kein'); await zeichne(); }
        catch (err) { UI.toast(err.message); }
        return;
      }
      const a = e.target.closest('[data-a]');
      if (!a) return;
      try {
        if (a.dataset.a === 'einladen') {
          const mail = o.querySelector('#wo-mail').value.trim();
          if (!mail) { UI.toast('Es fehlt die Adresse.'); return; }
          await Wolke.freigeben(seiteId, mail, o.querySelector('#wo-rolle').value);
          o.querySelector('#wo-mail').value = '';
          UI.toast('Eingeladen');
          await zeichne();
        }
        if (a.dataset.a === 'netz') {
          if (!Wolke.istGeteilt(seiteId)) {
            UI.toast('Erst oben lesbar machen — sonst kann der Server sie nicht ausliefern.');
            return;
          }
          await Wolke.abgleichen();
          const r = await Wolke.veroeffentlichen(seiteId, {
            passwort: o.querySelector('#wo-pw').value,
            tage: Number(o.querySelector('#wo-tage').value) || 0 });
          o.querySelector('#wo-adresse').innerHTML =
            '✅ <a href="' + esc(r.adresse) + '" target="_blank" rel="noopener">' +
            esc(r.adresse) + '</a>' +
            '<button data-a="kopie" style="font-size:11.5px;margin-left:8px">kopieren</button>';
          o.querySelector('#wo-adresse').dataset.adresse = r.adresse;
        }
        if (a.dataset.a === 'kopie') {
          const adr = o.querySelector('#wo-adresse').dataset.adresse;
          navigator.clipboard?.writeText(adr).then(() => UI.toast('Adresse kopiert'));
        }
        if (a.dataset.a === 'zurueck') {
          await Wolke.zurueckziehen(seiteId);
          o.querySelector('#wo-adresse').textContent = 'Zurückgezogen.';
          UI.toast('Die Adresse führt jetzt ins Leere');
        }
      } catch (err) { UI.toast(err.message || String(err)); }
    });

    await zeichne();
  };

  /* ========================================================================
   * 5 · MARKEN
   * ======================================================================*/
  const markenFenster = async () => {
    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML = '<div class="finder" style="width:min(620px,95vw)">' +
      '<div class="fh">🔑 Marken<button class="icon-btn" data-a="zu">✕</button></div>' +
      '<div class="res" id="wo-marken" style="padding:18px">Wird geladen …</div></div>';
    document.body.appendChild(o);

    const zeichne = async () => {
      let liste = { marken: [] };
      try { liste = await Wolke.markenListe(); } catch (e) { UI.toast(e.message); }
      o.querySelector('#wo-marken').innerHTML =
        '<div style="font-size:12.5px; color:var(--text-dim); line-height:1.65; margin-bottom:16px">' +
          'Eine Marke ist ein Schlüssel für ein Programm — für die Schnittstelle ' +
          '<code>/v1/</code> oder für MCP. Sie kann weniger dürfen als du: nur lesen, ' +
          'nur einen Bereich, nur eine Weile.</div>' +
        '<div style="display:flex; gap:7px; flex-wrap:wrap; margin-bottom:16px">' +
          '<input id="wo-mname" placeholder="Wofür ist sie?" style="flex:1;min-width:140px">' +
          '<select id="wo-mrecht">' +
            '<option value="lesen">nur lesen</option>' +
            '<option value="lesen,schreiben">lesen und schreiben</option>' +
          '</select>' +
          '<input id="wo-mtage" type="number" placeholder="Tage" style="width:84px">' +
          '<button data-a="neu" class="prim">Anlegen</button>' +
        '</div>' +
        '<div id="wo-neu"></div>' +
        (liste.marken.length
          ? liste.marken.map(x =>
              '<div style="display:flex;gap:10px;align-items:center;padding:9px 2px;' +
              'border-top:1px solid var(--line);font-size:13px">' +
              '<div style="flex:1"><b>' + esc(x.name) + '</b>' +
              '<div style="font-size:11.5px;color:var(--text-faint)">' + esc(x.rechte) +
              (x.benutzt ? ' · zuletzt ' + esc(new Date(x.benutzt).toLocaleDateString('de-CH'))
                         : ' · nie benutzt') +
              (x.bis ? ' · bis ' + esc(new Date(x.bis).toLocaleDateString('de-CH')) : '') +
              '</div></div>' +
              '<button data-weg="' + esc(x.kennung) + '" style="font-size:12px">Zurückziehen</button>' +
              '</div>').join('')
          : '<div style="font-size:12.5px;color:var(--text-faint)">Noch keine Marke.</div>');
    };

    o.addEventListener('click', async (e) => {
      if (e.target === o || e.target.closest('[data-a="zu"]')) { o.remove(); return; }
      const weg = e.target.closest('[data-weg]');
      if (weg) { try { await Wolke.markeWeg(weg.dataset.weg); await zeichne(); }
                 catch (err) { UI.toast(err.message); } return; }
      const a = e.target.closest('[data-a]');
      if (!a || a.dataset.a !== 'neu') return;
      try {
        const r = await Wolke.markeAnlegen(
          o.querySelector('#wo-mname').value || 'Ohne Namen',
          o.querySelector('#wo-mrecht').value.split(','),
          Number(o.querySelector('#wo-mtage').value) || 0);
        await zeichne();
        o.querySelector('#wo-neu').innerHTML =
          '<div style="padding:12px; border:1px solid var(--accent); border-radius:8px; ' +
          'margin-bottom:16px"><div style="font-size:12.5px; margin-bottom:7px">' +
          'Jetzt kopieren — sie wird nicht noch einmal angezeigt:</div>' +
          '<code style="font-size:12px; word-break:break-all">' + esc(r.token) + '</code></div>';
      } catch (err) { UI.toast(err.message); }
    });

    await zeichne();
  };

  return { dialog, teilenFenster, markenFenster, codeFenster, schluesselFragen };
})();

window.WolkeFenster = WolkeFenster;
