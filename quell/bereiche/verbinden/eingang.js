/* ============================================================================
 * eingang.js — Was von aussen hereinkommt
 * ----------------------------------------------------------------------------
 * Notion hat seit 2024 einen eingehenden Webhook: ein fremder Dienst schickt
 * etwas hin und löst damit eine Automation aus. Dafür braucht Notion einen
 * Server — Redion hat keinen.
 *
 * Der Weg hier ist ein anderer, und er hat einen Vorteil: nichts geht durch
 * fremde Hände.
 *
 *   1. ABHOLEN statt zugeschickt bekommen. Redion fragt in einem Takt eine
 *      Adresse ab (eigener Server, Zapier-Catch, Pipedream, eine JSON-Datei
 *      auf einem Speicher). Was dort steht, wird zu Zeilen.
 *
 *   2. EINWERFEN von Hand oder aus der Zwischenablage — JSON hineinkippen,
 *      Felder zuordnen, fertig.
 *
 *   3. AUS DER ADRESSE. Ein Link mit `#neu=...` legt beim Öffnen eine Zeile
 *      an. Damit kann jede Verknüpfung, jeder Tastenkürzel-Dienst und jedes
 *      Handy-Kurzbefehl etwas nach Redion schicken.
 *
 * Jeder Eingang gehört zu genau einer Datenbank, hat eine Feldzuordnung und
 * lässt sich einzeln abschalten. Was hereinkommt, löst die Automationen der
 * Datenbank aus — genau wie eine von Hand angelegte Zeile.
 * ==========================================================================*/

const Eingang = (() => {

  const esc = (s) => String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const TAKTE = [
    ['aus',        'nur von Hand'],
    ['5min',       'alle 5 Minuten',   5 * 60 * 1000],
    ['15min',      'alle 15 Minuten', 15 * 60 * 1000],
    ['stunde',     'stündlich',       60 * 60 * 1000],
    ['start',      'beim Öffnen der App', 0]
  ];

  const liste = () => Store.getMeta('eingaenge', []) || [];
  const sichern = (l) => Store.setMeta('eingaenge', l);

  /* ========================================================================
   * EINE MELDUNG IN EINE ZEILE VERWANDELN
   * ======================================================================*/
  /**
   * @param e       der Eingang mit seiner Zuordnung
   * @param daten   ein Objekt aus der fremden Quelle
   * @returns die neue Zeile oder null
   */
  const alsZeile = (e, daten) => {
    const c = Store.getCollection(e.db);
    if (!c || !daten || typeof daten !== 'object') return null;

    /* Doppelte fernhalten: wenn ein Schlüsselfeld gesetzt ist und der Wert
       schon existiert, wird nichts angelegt. Notions Webhook kann das nicht. */
    const props = {};
    let titel = '';

    /* Jeder Wert kommt als Text herein — hier wird er zu dem, was die Spalte
       erwartet. Sonst stünde in einer Zahlenspalte der Text „9". */
    const passend = (typ, v) =>
        typ === 'checkbox' ? (v === true || v === 'true' || v === '1' || v === 1)
      : typ === 'number' || typ === 'sterne' || typ === 'prozent'
          ? (String(v).trim() === '' ? null : Number(String(v).replace(',', '.')))
      : typ === 'multi' || typ === 'person'
          ? (Array.isArray(v) ? v.map(String) : String(v).split(',').map(x => x.trim()).filter(Boolean))
      : Array.isArray(v)   ? v.join(', ')
      : (v && typeof v === 'object') ? JSON.stringify(v)
      : String(v);

    Object.entries(e.zuordnung || {}).forEach(([von, nach]) => {
      if (!nach) return;
      const v = daten[von];
      if (v === undefined) return;
      if (nach === 'title') { titel = String(v); return; }
      if (!c.schema[nach]) return;
      props[nach] = passend(c.schema[nach].type, v);
    });
    /* Felder, die genauso heissen wie eine Spalte, werden ohne Zuordnung übernommen */
    if (e.automatisch !== false) {
      Object.entries(daten).forEach(([n, v]) => {
        const k = Object.keys(c.schema).find(x =>
          c.schema[x].name.toLowerCase() === String(n).toLowerCase());
        if (!k || props[k] !== undefined) return;
        if (c.schema[k].type === 'title') { if (!titel) titel = String(v); return; }
        props[k] = passend(c.schema[k].type, v);
      });
    }
    if (!titel) titel = String(daten.titel || daten.title || daten.name || daten.subject ||
                              'Von aussen · ' + new Date().toLocaleString('de-DE'));

    if (e.schluessel) {
      const meiner = String(props[e.schluessel] ?? titel).trim().toLowerCase();
      const schon = Store.rowsOf(c.id).some(r =>
        String(e.schluessel === 'title' ? r.text : (r.props || {})[e.schluessel] ?? '')
          .trim().toLowerCase() === meiner);
      if (schon) return null;
    }

    const z = Store.addRow(c.id, props);
    Store.updateBlock(z.id, { text: titel });
    /* Genau wie bei einer Formularantwort: die Automationen laufen mit. */
    setTimeout(() => Datenbank.automationenLaufen(Store.getBlock(z.id), c, 'formular-neu'), 0);
    return z;
  };

  /** Mehrere auf einmal — die Quelle darf ein Objekt oder eine Liste liefern. */
  const uebernehmen = (e, roh) => {
    let daten = roh;
    if (typeof daten === 'string') { try { daten = JSON.parse(daten); } catch { return { fehler: 'Kein JSON' }; } }
    if (daten && !Array.isArray(daten) && e.pfad) {
      e.pfad.split('.').forEach(t => { daten = daten && daten[t]; });
    }
    const stapel = Array.isArray(daten) ? daten : [daten];
    let neu = 0, uebersprungen = 0;
    stapel.forEach(d => { if (alsZeile(e, d)) neu++; else uebersprungen++; });
    return { neu, uebersprungen };
  };

  /* ========================================================================
   * ABHOLEN
   * ======================================================================*/
  const holen = async (e) => {
    if (!e.url) return { fehler: 'Keine Adresse' };
    const kopf = {};
    if (e.schluesselWert) {
      if (e.authArt === 'bearer') kopf.Authorization = 'Bearer ' + e.schluesselWert;
      else if (e.authArt === 'kopf') kopf[e.authName || 'X-Api-Key'] = e.schluesselWert;
    }
    try {
      const r = await KI.holen(e.url, { headers: kopf }, { versuche: 2 });
      if (!r.ok) return { fehler: 'Antwort ' + r.status };
      const text = await r.text();
      const erg = uebernehmen(e, text);
      const l = liste();
      const i = l.findIndex(x => x.id === e.id);
      if (i >= 0) { l[i].zuletzt = Store.now(); l[i].letzteZahl = erg.neu; sichern(l); }
      return erg;
    } catch (err) {
      return { fehler: err.message };
    }
  };

  const alleHolen = async (nurTakt) => {
    const raus = [];
    for (const e of liste()) {
      if (e.an === false) continue;
      if (nurTakt && e.takt !== nurTakt) continue;
      raus.push({ e, r: await holen(e) });
    }
    const neu = raus.reduce((n, x) => n + ((x.r && x.r.neu) || 0), 0);
    if (neu) {
      UI.toast(neu + (neu === 1 ? ' neuer Eintrag von aussen' : ' neue Einträge von aussen'));
      App.zeichneSeite();
    }
    return raus;
  };

  /* ========================================================================
   * AUS DER ADRESSE — #neu=<datenbank>&titel=…&feld=…
   * ------------------------------------------------------------------------
   * Damit kann jede Verknüpfung auf dem Desktop, jeder Kurzbefehl auf dem
   * Telefon und jeder Dienst mit „URL öffnen" etwas nach Redion schicken.
   * ======================================================================*/
  const ausAdresse = () => {
    const h = String(location.hash || '');
    if (!h.includes('neu=')) return null;
    const p = new URLSearchParams(h.slice(1));
    const wunsch = p.get('neu');
    if (!wunsch) return null;
    const c = Store.getCollection(wunsch) ||
              Object.values(Store.cache.collections).find(x =>
                (x.name || '').toLowerCase() === wunsch.toLowerCase());
    if (!c) { UI.toast('Datenbank „' + wunsch + '" gibt es nicht'); return null; }

    const daten = {};
    p.forEach((v, k) => { if (k !== 'neu') daten[k] = v; });
    const z = alsZeile({ db: c.id, zuordnung: {}, automatisch: true }, daten);
    location.hash = z ? z.id : '';
    if (z) {
      UI.toast('Von aussen angelegt: ' + (z.text || ''));
      App.zeichneBaum();
      App.oeffne(z.id);
    }
    return z;
  };

  /* ========================================================================
   * DAS FENSTER
   * ======================================================================*/
  const dialog = () => {
    const o = document.createElement('div');
    o.className = 'overlay';
    document.body.appendChild(o);

    const zeichne = () => {
      const l = liste();
      const dbs = Object.values(Store.cache.collections);
      o.innerHTML =
        '<div class="finder" style="width:min(720px,95vw)">' +
          `<div class="fh">📨 Was hereinkommt <em>${l.length}</em>` +
            '<button class="icon-btn" data-a="zu">✕</button></div>' +
          '<div class="eg-koerper">' +
            '<div class="eg-hinweis">Notion lässt sich von fremden Diensten etwas ' +
            '<b>zuschicken</b> — dafür braucht es einen Server. Redion <b>holt</b> stattdessen ab, ' +
            'in einem Takt deiner Wahl. Was ankommt, wird zu Zeilen und löst die Automationen aus.</div>' +
            (l.length
              ? '<div class="eg-liste">' + l.map((e, i) => {
                  const c = Store.getCollection(e.db);
                  return `<div class="eg-z${e.an === false ? ' aus' : ''}">` +
                    `<button class="schalter${e.an === false ? '' : ' an'}" data-an="${i}"><i></i></button>` +
                    '<div class="eg-text">' +
                      `<b>${esc(e.name || 'Ohne Namen')}</b>` +
                      `<span>${esc((c && c.name) || 'Datenbank fehlt')} · ` +
                      `${esc((TAKTE.find(t => t[0] === e.takt) || [, 'nur von Hand'])[1])}` +
                      (e.zuletzt ? ' · zuletzt ' + esc(Werkzeuge.zeitKurz(e.zuletzt)) : '') +
                      '</span></div>' +
                    `<button data-jetzt="${i}" title="Jetzt abholen">▶</button>` +
                    `<button data-bearb="${i}" title="Ändern">✎</button>` +
                    `<button data-weg="${i}" title="Entfernen">🗑</button>` +
                  '</div>';
                }).join('') + '</div>'
              : '<div class="pf-gut">Noch kein Eingang eingerichtet.</div>') +

            '<div class="eg-titel">Von Hand einwerfen</div>' +
            '<div class="eg-wurf">' +
              '<select id="eg-db">' + dbs.map(c =>
                `<option value="${c.id}">${esc(c.name || 'Ohne Namen')}</option>`).join('') + '</select>' +
              '<textarea id="eg-json" rows="4" spellcheck="false" ' +
                'placeholder=\'{"Titel": "Neue Aufgabe", "Status": "Offen"}  —  auch eine Liste geht\'></textarea>' +
              '<button data-a="werfen" class="prim">Übernehmen</button>' +
            '</div>' +

            '<div class="eg-titel">Aus einer Adresse</div>' +
            '<div class="eg-adresse">' +
              'Ein Link wie dieser legt beim Öffnen eine Zeile an — ' +
              'gut für Verknüpfungen auf dem Desktop und Kurzbefehle am Telefon:' +
              `<code>${esc(location.origin + location.pathname)}#neu=` +
              `${esc((dbs[0] && dbs[0].name) || 'Datenbank')}&titel=Von+aussen&Status=Offen</code>` +
              '<button data-a="linkkopie">Beispiel kopieren</button>' +
            '</div>' +
          '</div>' +
          '<div class="fbtns">' +
            '<button data-a="alle">Alle jetzt abholen</button>' +
            '<button data-a="neu">＋ Eingang einrichten</button>' +
            '<button data-a="zu" class="prim">Schliessen</button></div>' +
        '</div>';
    };
    zeichne();

    o.addEventListener('click', async e => {
      if (e.target === o || e.target.closest('[data-a="zu"]')) { o.remove(); return; }
      const l = liste();

      const an = e.target.closest('[data-an]');
      if (an) { const i = +an.dataset.an; l[i].an = l[i].an === false; sichern(l); zeichne(); return; }

      const weg = e.target.closest('[data-weg]');
      if (weg) { l.splice(+weg.dataset.weg, 1); sichern(l); zeichne(); return; }

      const jetzt = e.target.closest('[data-jetzt]');
      if (jetzt) {
        const r = await holen(l[+jetzt.dataset.jetzt]);
        UI.toast(r.fehler ? '⛔ ' + r.fehler
                          : r.neu + ' neu, ' + r.uebersprungen + ' übersprungen');
        zeichne();
        return;
      }

      const bearb = e.target.closest('[data-bearb]');
      if (bearb) { einrichten(l[+bearb.dataset.bearb], +bearb.dataset.bearb, zeichne); return; }
      if (e.target.closest('[data-a="neu"]')) { einrichten(null, -1, zeichne); return; }

      if (e.target.closest('[data-a="alle"]')) {
        const r = await alleHolen();
        UI.toast(r.length ? 'Alle abgeholt' : 'Kein Eingang eingerichtet');
        zeichne();
        return;
      }

      if (e.target.closest('[data-a="werfen"]')) {
        const db = o.querySelector('#eg-db').value;
        const text = o.querySelector('#eg-json').value.trim();
        if (!text) { UI.toast('Erst etwas hineinschreiben'); return; }
        const r = uebernehmen({ db, zuordnung: {}, automatisch: true }, text);
        if (r.fehler) { UI.toast('⛔ ' + r.fehler); return; }
        UI.toast(r.neu + (r.neu === 1 ? ' Zeile angelegt' : ' Zeilen angelegt'));
        o.querySelector('#eg-json').value = '';
        App.zeichneSeite();
        return;
      }

      if (e.target.closest('[data-a="linkkopie"]')) {
        const code = o.querySelector('.eg-adresse code');
        navigator.clipboard?.writeText(code.textContent);
        UI.toast('Beispiel kopiert');
      }
    });
  };

  /** Einen Eingang einrichten oder ändern. */
  const einrichten = (e, index, fertig) => {
    const dbs = Object.values(Store.cache.collections);
    const jetzt = e || { name: '', db: (dbs[0] || {}).id, url: '', takt: 'stunde',
                         an: true, zuordnung: {}, automatisch: true, pfad: '',
                         authArt: 'keine', authName: 'X-Api-Key', schluesselWert: '', schluessel: '' };
    const c = Store.getCollection(jetzt.db) || dbs[0];

    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML =
      '<div class="finder" style="width:min(600px,94vw)">' +
        `<div class="fh">📨 ${index < 0 ? 'Neuer Eingang' : 'Eingang ändern'}` +
          '<button class="icon-btn" data-a="zu">✕</button></div>' +
        '<div class="eg-koerper">' +
          `<label class="ew-feld">Name<input id="eg-n" value="${esc(jetzt.name)}" placeholder="z. B. Aufträge aus dem Shop"></label>` +
          '<label class="ew-feld">In welche Datenbank<select id="eg-c">' +
            dbs.map(x => `<option value="${x.id}"${x.id === jetzt.db ? ' selected' : ''}>` +
                         `${esc(x.name || 'Ohne Namen')}</option>`).join('') + '</select></label>' +
          `<label class="ew-feld">Adresse, von der geholt wird<input id="eg-u" value="${esc(jetzt.url)}" placeholder="https://…/daten.json"></label>` +
          '<label class="ew-feld">Wie oft<select id="eg-t">' +
            TAKTE.map(([id, n]) => `<option value="${id}"${id === jetzt.takt ? ' selected' : ''}>${n}</option>`).join('') +
          '</select></label>' +
          `<label class="ew-feld">Pfad im JSON (leer = ganz oben)<input id="eg-p" value="${esc(jetzt.pfad || '')}" placeholder="z. B. daten.eintraege"></label>` +
          '<label class="ew-feld">Anmeldung<select id="eg-a">' +
            [['keine', 'ohne'], ['bearer', 'Bearer-Schlüssel'], ['kopf', 'eigene Kopfzeile']]
              .map(([id, n]) => `<option value="${id}"${id === jetzt.authArt ? ' selected' : ''}>${n}</option>`).join('') +
          '</select></label>' +
          `<label class="ew-feld">Schlüssel<input id="eg-s" value="${esc(jetzt.schluesselWert || '')}" placeholder="bleibt in diesem Gerät"></label>` +
          '<label class="ew-feld">Doppelte fernhalten über<select id="eg-k">' +
            '<option value="">— alles übernehmen —</option>' +
            (c ? Object.keys(c.schema).map(k =>
              `<option value="${k}"${k === jetzt.schluessel ? ' selected' : ''}>` +
              `${esc(c.schema[k].name)}</option>`).join('') : '') +
          '</select></label>' +
          '<div class="eg-hinweis">Felder, die genauso heissen wie eine Spalte, werden von ' +
          'selbst übernommen. Für alles andere: <code>{"fremdName": "spaltenSchlüssel"}</code></div>' +
          `<label class="ew-feld">Eigene Zuordnung als JSON<textarea id="eg-z" rows="3" spellcheck="false">` +
            `${esc(JSON.stringify(jetzt.zuordnung || {}, null, 1))}</textarea></label>` +
          '<div class="ew-pruef" id="eg-pruef"></div>' +
        '</div>' +
        '<div class="fbtns">' +
          '<button data-a="probe">Probe holen</button>' +
          '<button data-a="zu">Abbrechen</button>' +
          '<button data-a="ok" class="prim">Speichern</button></div>' +
      '</div>';
    document.body.appendChild(o);

    const lesen = () => {
      let z = {};
      try { z = JSON.parse(o.querySelector('#eg-z').value || '{}'); } catch { z = {}; }
      return { id: jetzt.id || Store.uid().slice(0, 8),
               name: o.querySelector('#eg-n').value.trim() || 'Eingang',
               db: o.querySelector('#eg-c').value,
               url: o.querySelector('#eg-u').value.trim(),
               takt: o.querySelector('#eg-t').value,
               pfad: o.querySelector('#eg-p').value.trim(),
               authArt: o.querySelector('#eg-a').value,
               authName: jetzt.authName || 'X-Api-Key',
               schluesselWert: o.querySelector('#eg-s').value.trim(),
               schluessel: o.querySelector('#eg-k').value,
               zuordnung: z, automatisch: true, an: jetzt.an !== false,
               zuletzt: jetzt.zuletzt };
    };

    o.addEventListener('click', async ev => {
      if (ev.target === o || ev.target.closest('[data-a="zu"]')) { o.remove(); return; }

      if (ev.target.closest('[data-a="probe"]')) {
        const p = o.querySelector('#eg-pruef');
        const e2 = lesen();
        if (!e2.url) { p.className = 'ew-pruef schlecht'; p.textContent = '⛔ Erst eine Adresse eintragen'; return; }
        p.className = 'ew-pruef'; p.textContent = 'Wird geholt …';
        const r = await holen(e2);
        p.className = 'ew-pruef ' + (r.fehler ? 'schlecht' : 'gut');
        p.textContent = r.fehler ? '⛔ ' + r.fehler
          : '✅ ' + r.neu + ' neu angelegt, ' + r.uebersprungen + ' übersprungen';
        App.zeichneSeite();
        return;
      }

      if (ev.target.closest('[data-a="ok"]')) {
        const l = liste();
        const neu = lesen();
        if (index < 0) l.push(neu); else l[index] = neu;
        sichern(l);
        o.remove();
        UI.toast('Eingang gespeichert');
        if (fertig) fertig();
      }
    });
  };

  /* ========================================================================
   * START
   * ======================================================================*/
  let uhr = null;
  const start = () => {
    setTimeout(() => { ausAdresse(); }, 900);
    if (!liste().length) return;
    setTimeout(() => alleHolen('start'), 2500);
    clearInterval(uhr);
    /* Ein Takt von fünf Minuten reicht als Raster für alle Stufen. */
    let zaehler = 0;
    uhr = setInterval(() => {
      zaehler++;
      alleHolen('5min');
      if (zaehler % 3 === 0)  alleHolen('15min');
      if (zaehler % 12 === 0) alleHolen('stunde');
    }, 5 * 60 * 1000);
  };

  return { start, liste, sichern, alsZeile, uebernehmen, holen, alleHolen,
           ausAdresse, dialog, einrichten, TAKTE };
})();

window.Eingang = Eingang;
