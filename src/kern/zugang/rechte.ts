/* ============================================================================
 * feldrechte.js — Rechte bis auf die einzelne Spalte
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/kern/zugang/rechte.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/kern/zugang/rechte.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
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

/** Wie weit ein Konto an eine einzelne Spalte heran darf. */
type Feldstufe = 'voll' | 'lesen' | 'kein';

/** Für eine Sammlung: welches Feld auf welcher Stufe steht. */
type Feldkarte = Record<string, Feldstufe>;

const Feldrechte = (() => {

  const esc = (s: unknown): string => String(s ?? '').replace(/[&<>"]/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' } as Record<string, string>)[c] ?? c);

  const STUFEN: [Feldstufe, string][] = [
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

  const alleKarten = (): Record<string, Feldkarte> =>
    Store.getMeta('feldrechteMeins', {}) || {};

  /** Die Karte { feldSchlüssel: 'voll'|'lesen'|'kein' } für eine Sammlung. */
  const karte = (sammlungId: string): Feldkarte => alleKarten()[sammlungId] || {};

  const karteSetzen = (sammlungId: string, k: Feldkarte | null | undefined): void => {
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
  const inKraft = (): boolean => Object.keys(alleKarten()).length > 0;

  const stufe = (sammlungId: string, feld: string): Feldstufe => {
    if (!inKraft()) return 'voll';
    return karte(sammlungId)[feld] || 'voll';
  };

  const darfSehen     = (sammlungId: string, feld: string): boolean =>
    stufe(sammlungId, feld) !== 'kein';
  const darfSchreiben = (sammlungId: string, feld: string): boolean =>
    stufe(sammlungId, feld) === 'voll';

  /** Für den Kopf einer Spalte: ein Schloss, wenn sie nicht offen ist. */
  const zeichen = (sammlungId: string, feld: string): string => {
    const s = stufe(sammlungId, feld);
    return s === 'kein' ? '⃠' : s === 'lesen' ? '🔒' : '';
  };

  /* ========================================================================
   * 2 · MIT DEM SERVER REDEN
   * ======================================================================*/

  /** Die Rechte einer Sammlung holen — und gleich merken, was für mich gilt. */
  const holen = async (sammlungId: string): Promise<any> => {
    if (typeof Wolke === 'undefined' || !Wolke.angemeldet()) return null;
    const a = await Wolke.ruf('/feldrecht?bereich=' + encodeURIComponent(Wolke.bereich()) +
      '&sammlung=' + encodeURIComponent(sammlungId), { m: 'GET' });
    karteSetzen(sammlungId, a.meins || {});
    return a;
  };

  /** Ein Recht setzen. konto: eine Mail, eine Konto-Kennung oder '*'. */
  const setzen = async (sammlungId: string, feld: string, konto: string,
                        rolle: Feldstufe | string, entfernen = false): Promise<any> => {
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
      const meins: Record<string, Feldkarte> = {};
      const ich = (Wolke.zustand.konto || {}).id;
      (a.feldrechte || []).forEach((f: any) => {
        if (f.kontoId !== '*' && f.kontoId !== ich) return;
        const fuerSammlung = meins[f.sammlung] ?? {};
        meins[f.sammlung] = fuerSammlung;
        /* Ein persönlicher Eintrag sticht den für alle. */
        if (f.kontoId === ich || fuerSammlung[f.feld] === undefined)
          fuerSammlung[f.feld] = f.rolle;
      });
      /* Der Besitzer sieht immer alles — sonst könnte er sich selbst
         aus seinen eigenen Daten aussperren. */
      Store.setMeta('feldrechteMeins', (ich && ich === a.besitzer) ? {} : meins);
    } catch { /* kein Netz: die gemerkte Karte gilt weiter */ }
  };

  /* ========================================================================
   * 3 · DAS FENSTER
   * ======================================================================*/

  const fenster = async (sammlungId: string): Promise<HTMLDivElement | undefined> => {
    const coll = Store.getCollection(sammlungId);
    if (!coll) return undefined;

    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML = '<div class="finder" style="width:min(720px,96vw)">' +
      '<div class="fh">🔒 Rechte je Spalte — ' + esc(coll.name || 'Datenbank') +
      '<button class="icon-btn" data-a="zu">✕</button></div>' +
      '<div class="res" id="fr-inhalt" style="padding:18px;max-height:72vh;overflow:auto"></div></div>';
    document.body.appendChild(o);

    const zeichne = async (): Promise<void> => {
      const ziel = o.querySelector('#fr-inhalt');
      if (!ziel) return;

      if (typeof Wolke === 'undefined' || !Wolke.angemeldet()) {
        ziel.innerHTML =
          '<p style="opacity:.8;margin-top:0">Spaltenrechte brauchen einen Server — sie ' +
          'werden dort geprüft, nicht hier. Solange alles nur auf diesem Gerät liegt, ' +
          'gibt es niemanden, vor dem etwas zu verbergen wäre.</p>' +
          '<button class="btn prim" data-a="wolke">Wolke einrichten</button>';
        return;
      }

      ziel.innerHTML = '<p style="opacity:.7">Wird geholt …</p>';
      let daten: any;
      try { daten = await holen(sammlungId); }
      catch (e) {
        const grund = e instanceof Error ? e.message : String(e);
        ziel.innerHTML = '<p style="color:var(--gefahr)">' + esc(grund) + '</p>';
        return;
      }

      const liste: any[] = daten?.feldrechte || [];
      const proFeld: Record<string, any[]> = {};
      liste.forEach(f => { (proFeld[f.feld] = proFeld[f.feld] || []).push(f); });

      ziel.innerHTML =
        '<p style="opacity:.8;margin-top:0">Wer nichts eingetragen bekommt, darf die Spalte ' +
        'sehen und ändern. Der Besitzer des Bereichs ist immer aussen vor.</p>' +
        '<p style="opacity:.65;font-size:.9em">Das gilt für <b>geteilte</b> Seiten. ' +
        'Verschlüsselte kann der Server nicht filtern — dort hat ohnehin nur einer den Schlüssel.</p>' +
        Object.entries<any>(coll.schema).map(([k, d]) => {
          const eintraege = proFeld[k] || [];
          return '<div style="border:1px solid var(--line,#ddd);border-radius:8px;' +
            'padding:12px;margin:10px 0">' +
            '<div style="font-weight:600;margin-bottom:8px">' + esc(d.name || k) +
              '<span style="opacity:.6;font-weight:400"> · ' + esc(d.type) + '</span></div>' +
            (eintraege.length
              ? eintraege.map((f: any) =>
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

    const satzVon = (err: unknown): string =>
      err instanceof Error ? err.message : String(err);

    o.addEventListener('click', async (e) => {
      const ziel = e.target instanceof Element ? e.target : null;
      if (e.target === o || ziel?.closest('[data-a="zu"]')) { o.remove(); return; }
      if (ziel?.closest('[data-a="wolke"]')) { o.remove(); WolkeFenster.dialog(); return; }

      const setz = ziel?.closest<HTMLButtonElement>('[data-setz]');
      if (setz) {
        const k = setz.dataset['setz'];
        if (!k) return;
        const mailFeld = o.querySelector<HTMLInputElement>('[data-mail="' + CSS.escape(k) + '"]');
        const stufeFeld = o.querySelector<HTMLSelectElement>('[data-stufe="' + CSS.escape(k) + '"]');
        if (!mailFeld || !stufeFeld) return;
        const mail = (mailFeld.value || '*').trim() || '*';
        setz.disabled = true;
        try { await setzen(sammlungId, k, mail, stufeFeld.value); UI.toast('Gesetzt'); }
        catch (err) { UI.toast(satzVon(err)); }
        setz.disabled = false;
        await zeichne();
        return;
      }

      const weg = ziel?.closest<HTMLElement>('[data-weg]');
      if (weg) {
        const [k, konto] = (weg.dataset['weg'] || '').split('|');
        if (!k || !konto) return;
        try { await setzen(sammlungId, k, konto, 'voll', true); UI.toast('Aufgehoben'); }
        catch (err) { UI.toast(satzVon(err)); }
        await zeichne();
      }
    });

    await zeichne();
    return o;
  };

  return { STUFEN, karte, karteSetzen, stufe, darfSehen, darfSchreiben, zeichen,
           inKraft, holen, setzen, auffrischen, fenster };
})();

(window as any).Feldrechte = Feldrechte;
