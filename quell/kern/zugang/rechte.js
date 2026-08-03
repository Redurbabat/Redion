/* ============================================================================
 * feldrechte.js — Rechte bis auf die einzelne Spalte
 * ----------------------------------------------------------------------------
 * Idee 21 der 10000×-Liste. Eine Freigabe sagt „diese Seite ja". Oft ist das
 * zu grob: die Personalliste soll das Team sehen, die Gehaltsspalte nicht.
 * Notion kann das nicht — dort ist die Seite die kleinste Einheit.
 *
 * Drei Stufen je Spalte und Person:
 *
 *      voll   sehen und ändern
 *      lesen  sehen, aber nicht ändern
 *      kein   gar nicht — der Wert verlässt den Server nicht
 *
 * Wo die Sperre wirklich sitzt: **auf dem Server.** Beim Herunterladen wirft
 * er die Werte weg, beim Hochladen dreht er unerlaubte Änderungen zurück.
 * Was diese Datei hier macht, ist nur die Höflichkeit davor: eine Spalte, die
 * man nicht ändern darf, soll sich auch nicht ändern lassen, statt es erst
 * beim Abgleich stillschweigend zurückzunehmen.
 *
 * Und eine ehrliche Grenze: das geht nur bei geteilten Seiten. Was
 * verschlüsselt hochgeht, kann der Server nicht filtern — er sieht Zufall.
 * Dort hat aber ohnehin nur einer den Schlüssel. Feldrechte greifen also
 * genau dort, wo es sie braucht.
 * ==========================================================================*/

const Feldrechte = (() => {

  const esc = (s) => String(s ?? '').replace(/[&<>"]/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const STUFEN = [
    ['voll',  'Sehen und ändern'],
    ['lesen', 'Nur sehen'],
    ['kein',  'Gar nicht']
  ];

  /* ========================================================================
   * 1 · WAS HIER GILT
   * ------------------------------------------------------------------------
   * Der Server schickt beim Abgleich mit, was für dieses Konto gilt. Das
   * liegt lokal, damit die Oberfläche auch ohne Netz weiss, was sie zeigen
   * darf — und wird bei jedem Abgleich frisch geholt.
   * ======================================================================*/

  const alleKarten = () => Store.getMeta('feldrechteMeins', {}) || {};

  /** Die Karte { feldSchlüssel: 'voll'|'lesen'|'kein' } für eine Sammlung. */
  const karte = (sammlungId) => alleKarten()[sammlungId] || {};

  const karteSetzen = (sammlungId, k) => {
    const alle = alleKarten();
    if (k && Object.keys(k).length) alle[sammlungId] = k;
    else delete alle[sammlungId];
    Store.setMeta('feldrechteMeins', alle);
  };

  /**
   * Gilt hier überhaupt eine Einschränkung?
   *
   * Die Karte entsteht ausschliesslich aus dem, was der Server geschickt hat.
   * Ist sie leer, gibt es niemanden, gegen den geprüft werden müsste — dann
   * darf alles. Bewusst nicht an „angemeldet" gehängt: wer die Verbindung
   * verliert, soll nicht plötzlich Spalten ändern dürfen, die ihm gesperrt
   * sind. Die gemerkte Karte gilt weiter, bis der Server etwas anderes sagt.
   */
  const inKraft = () => Object.keys(alleKarten()).length > 0;

  const stufe = (sammlungId, feld) => {
    if (!inKraft()) return 'voll';
    return karte(sammlungId)[feld] || 'voll';
  };

  const darfSehen     = (sammlungId, feld) => stufe(sammlungId, feld) !== 'kein';
  const darfSchreiben = (sammlungId, feld) => stufe(sammlungId, feld) === 'voll';

  /** Für den Kopf einer Spalte: ein Schloss, wenn sie nicht offen ist. */
  const zeichen = (sammlungId, feld) => {
    const s = stufe(sammlungId, feld);
    return s === 'kein' ? '⃠' : s === 'lesen' ? '🔒' : '';
  };

  /* ========================================================================
   * 2 · MIT DEM SERVER REDEN
   * ======================================================================*/

  /** Die Rechte einer Sammlung holen — und gleich merken, was für mich gilt. */
  const holen = async (sammlungId) => {
    if (typeof Wolke === 'undefined' || !Wolke.angemeldet()) return null;
    const a = await Wolke.ruf('/feldrecht?bereich=' + encodeURIComponent(Wolke.bereich()) +
      '&sammlung=' + encodeURIComponent(sammlungId), { m: 'GET' });
    karteSetzen(sammlungId, a.meins || {});
    return a;
  };

  /** Ein Recht setzen. konto: eine Mail, eine Konto-Kennung oder '*'. */
  const setzen = async (sammlungId, feld, konto, rolle, entfernen = false) => {
    const a = await Wolke.ruf('/feldrecht', { m: 'POST', k: {
      bereich: Wolke.bereich(), sammlung: sammlungId, feld,
      konto: konto || '*', rolle, entfernen: !!entfernen } });
    await holen(sammlungId);
    return a;
  };

  /** Nach dem Abgleich: für alle Sammlungen, die es hier gibt, neu holen. */
  const auffrischen = async () => {
    if (typeof Wolke === 'undefined' || !Wolke.angemeldet() || !Wolke.bereich()) return;
    try {
      const a = await Wolke.ruf('/feldrecht?bereich=' +
        encodeURIComponent(Wolke.bereich()), { m: 'GET' });
      const meins = {};
      const ich = (Wolke.zustand.konto || {}).id;
      (a.feldrechte || []).forEach(f => {
        if (f.kontoId !== '*' && f.kontoId !== ich) return;
        meins[f.sammlung] = meins[f.sammlung] || {};
        /* Ein persönlicher Eintrag sticht den für alle. */
        if (f.kontoId === ich || meins[f.sammlung][f.feld] === undefined)
          meins[f.sammlung][f.feld] = f.rolle;
      });
      /* Der Besitzer sieht immer alles — sonst könnte er sich selbst
         aus seinen eigenen Daten aussperren. */
      Store.setMeta('feldrechteMeins', (ich && ich === a.besitzer) ? {} : meins);
    } catch { /* kein Netz: die gemerkte Karte gilt weiter */ }
  };

  /* ========================================================================
   * 3 · DAS FENSTER
   * ======================================================================*/

  const fenster = async (sammlungId) => {
    const coll = Store.getCollection(sammlungId);
    if (!coll) return;

    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML = '<div class="finder" style="width:min(720px,96vw)">' +
      '<div class="fh">🔒 Rechte je Spalte — ' + esc(coll.name || 'Datenbank') +
      '<button class="icon-btn" data-a="zu">✕</button></div>' +
      '<div class="res" id="fr-inhalt" style="padding:18px;max-height:72vh;overflow:auto"></div></div>';
    document.body.appendChild(o);

    const zeichne = async () => {
      const ziel = o.querySelector('#fr-inhalt');

      if (typeof Wolke === 'undefined' || !Wolke.angemeldet()) {
        ziel.innerHTML =
          '<p style="opacity:.8;margin-top:0">Spaltenrechte brauchen einen Server — sie ' +
          'werden dort geprüft, nicht hier. Solange alles nur auf diesem Gerät liegt, ' +
          'gibt es niemanden, vor dem etwas zu verbergen wäre.</p>' +
          '<button class="btn prim" data-a="wolke">Wolke einrichten</button>';
        return;
      }

      ziel.innerHTML = '<p style="opacity:.7">Wird geholt …</p>';
      let daten;
      try { daten = await holen(sammlungId); }
      catch (e) { ziel.innerHTML = '<p style="color:var(--rot,#c33)">' + esc(e.message) + '</p>'; return; }

      const liste = daten.feldrechte || [];
      const proFeld = {};
      liste.forEach(f => { (proFeld[f.feld] = proFeld[f.feld] || []).push(f); });

      ziel.innerHTML =
        '<p style="opacity:.8;margin-top:0">Wer nichts eingetragen bekommt, darf die Spalte ' +
        'sehen und ändern. Der Besitzer des Bereichs ist immer aussen vor.</p>' +
        '<p style="opacity:.65;font-size:.9em">Das gilt für <b>geteilte</b> Seiten. ' +
        'Verschlüsselte kann der Server nicht filtern — dort hat ohnehin nur einer den Schlüssel.</p>' +
        Object.entries(coll.schema).map(([k, d]) => {
          const eintraege = proFeld[k] || [];
          return '<div style="border:1px solid var(--line,#ddd);border-radius:8px;' +
            'padding:12px;margin:10px 0">' +
            '<div style="font-weight:600;margin-bottom:8px">' + esc(d.name || k) +
              '<span style="opacity:.6;font-weight:400"> · ' + esc(d.type) + '</span></div>' +
            (eintraege.length
              ? eintraege.map(f =>
                  '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">' +
                  '<span style="flex:1">' + esc(f.kontoId === '*' ? 'Alle anderen' : f.kontoId) + '</span>' +
                  '<span style="opacity:.75">' +
                    esc((STUFEN.find(s => s[0] === f.rolle) || ['', f.rolle])[1]) + '</span>' +
                  '<button class="btn" data-weg="' + esc(k) + '|' + esc(f.kontoId) + '">aufheben</button>' +
                  '</div>').join('')
              : '<div style="opacity:.6;margin-bottom:6px">Keine Einschränkung.</div>') +
            '<div style="display:flex;gap:6px;margin-top:8px">' +
              '<input placeholder="Mail oder * für alle" data-mail="' + esc(k) + '" ' +
                'style="flex:1;padding:6px 8px;border:1px solid var(--line,#ddd);border-radius:6px">' +
              '<select data-stufe="' + esc(k) + '" style="padding:6px 8px">' +
                STUFEN.map(s => '<option value="' + s[0] + '">' + s[1] + '</option>').join('') +
              '</select>' +
              '<button class="btn prim" data-setz="' + esc(k) + '">Setzen</button>' +
            '</div></div>';
        }).join('');
    };

    o.addEventListener('click', async (e) => {
      if (e.target === o || e.target.closest('[data-a="zu"]')) { o.remove(); return; }
      if (e.target.closest('[data-a="wolke"]')) { o.remove(); WolkeFenster.dialog(); return; }

      const setz = e.target.closest('[data-setz]');
      if (setz) {
        const k = setz.dataset.setz;
        const mail = (o.querySelector('[data-mail="' + CSS.escape(k) + '"]').value || '*').trim() || '*';
        const rolle = o.querySelector('[data-stufe="' + CSS.escape(k) + '"]').value;
        setz.disabled = true;
        try { await setzen(sammlungId, k, mail, rolle); UI.toast('Gesetzt'); }
        catch (err) { UI.toast(err.message); }
        setz.disabled = false;
        await zeichne();
        return;
      }

      const weg = e.target.closest('[data-weg]');
      if (weg) {
        const [k, konto] = weg.dataset.weg.split('|');
        try { await setzen(sammlungId, k, konto, 'voll', true); UI.toast('Aufgehoben'); }
        catch (err) { UI.toast(err.message); }
        await zeichne();
      }
    });

    await zeichne();
    return o;
  };

  return { STUFEN, karte, karteSetzen, stufe, darfSehen, darfSchreiben, zeichen,
           inKraft, holen, setzen, auffrischen, fenster };
})();

window.Feldrechte = Feldrechte;
