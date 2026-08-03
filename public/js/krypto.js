/* ============================================================================
 * krypto.js — Verschlüsselung mit einem Passwort
 * ----------------------------------------------------------------------------
 * Idee 9 der 10000×-Liste: Ende-zu-Ende-Verschlüsselung. Notion hat sie nicht,
 * und die Notion-KI erklärt auch warum: sie bricht Server-Suche, KI und
 * Integrationen. Bei uns liegt ohnehin alles auf dem Gerät — deshalb kostet
 * Verschlüsselung hier fast nichts.
 *
 * Zwei Dinge stecken drin:
 *
 *   1. VERSCHLÜSSELTE SICHERUNG — der vollständige Bestand als eine Datei,
 *      mit AES-GCM 256 verschlüsselt. Der Schlüssel entsteht aus dem Passwort
 *      über PBKDF2 mit 310 000 Runden und einem zufälligen Salz. Ohne das
 *      Passwort ist die Datei ein Haufen Zufall.
 *
 *   2. SPERRE — beim Öffnen erst das Passwort. Sie schützt vor dem Blick über
 *      die Schulter, nicht vor jemandem mit Zugriff auf die Festplatte; das
 *      steht auch so im Dialog. Wer echten Schutz auf der Platte will, nimmt
 *      die Sicherung und löscht den lokalen Bestand.
 *
 * Alles über die eingebaute Krypto des Browsers — keine fremde Bibliothek.
 * ==========================================================================*/

const Krypto = (() => {

  const enc = new TextEncoder();
  const dec = new TextDecoder();

  const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
  const ausB64 = (s) => Uint8Array.from(atob(s), c => c.charCodeAt(0));

  const RUNDEN = 310000;   /* OWASP-Empfehlung für PBKDF2-SHA256 */

  /** Aus Passwort und Salz einen Schlüssel machen. */
  const schluessel = async (passwort, salz) => {
    const roh = await crypto.subtle.importKey('raw', enc.encode(passwort),
      'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: salz, iterations: RUNDEN, hash: 'SHA-256' },
      roh, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  };

  /**
   * Verschlüsselt einen Text.
   * @returns {Promise<string>} eine JSON-Zeichenkette mit Salz, Zufallszahl und Inhalt
   */
  const verschluesseln = async (text, passwort) => {
    const salz = crypto.getRandomValues(new Uint8Array(16));
    const iv   = crypto.getRandomValues(new Uint8Array(12));
    const k    = await schluessel(passwort, salz);
    const daten = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, k, enc.encode(text));
    return JSON.stringify({
      art: 'redion-verschluesselt', fassung: 1, runden: RUNDEN,
      salz: b64(salz), iv: b64(iv), inhalt: b64(daten)
    });
  };

  /** Entschlüsselt, was verschluesseln() gemacht hat. */
  const entschluesseln = async (json, passwort) => {
    const p = typeof json === 'string' ? JSON.parse(json) : json;
    if (p.art !== 'redion-verschluesselt') throw new Error('Das ist keine verschlüsselte Redion-Datei');
    const salz = ausB64(p.salz), iv = ausB64(p.iv);
    const roh = await crypto.subtle.importKey('raw', enc.encode(passwort),
      'PBKDF2', false, ['deriveKey']);
    const k = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: salz, iterations: p.runden || RUNDEN, hash: 'SHA-256' },
      roh, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
    try {
      const daten = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, k, ausB64(p.inhalt));
      return dec.decode(daten);
    } catch { throw new Error('Falsches Passwort'); }
  };

  /* ========================================================================
   * SPERRE
   * ------------------------------------------------------------------------
   * Gespeichert wird nie das Passwort, sondern nur ein Prüfwert: ein Text,
   * der mit dem Passwort verschlüsselt wurde. Passt das Passwort, lässt er
   * sich entschlüsseln — sonst nicht.
   * ======================================================================*/
  const sperreAn = () => !!Store.getMeta('sperre:pruef', '');

  const sperreEinrichten = async (passwort) => {
    const pruef = await verschluesseln('redion-sperre-ok', passwort);
    Store.setMeta('sperre:pruef', pruef);
    Store.setMeta('sperre:seit', new Date().toISOString());
  };

  const sperreAus = () => { Store.setMeta('sperre:pruef', ''); Store.setMeta('sperre:seit', ''); };

  const passwortStimmt = async (passwort) => {
    const pruef = Store.getMeta('sperre:pruef', '');
    if (!pruef) return true;
    try { return (await entschluesseln(pruef, passwort)) === 'redion-sperre-ok'; }
    catch { return false; }
  };

  /** Der Sperrbildschirm. Löst sich auf, sobald das Passwort stimmt. */
  const sperrschirm = () => new Promise((fertig) => {
    const o = document.createElement('div');
    o.id = 'sperrschirm';
    o.innerHTML =
      '<div class="sp-box">' +
        '<div class="sp-logo">🔒</div>' +
        '<div class="sp-titel">Redion ist gesperrt</div>' +
        '<div class="sp-text">Passwort eingeben, um weiterzumachen.</div>' +
        '<input id="sp-pw" type="password" autocomplete="current-password" placeholder="Passwort">' +
        '<div class="sp-fehler" id="sp-fehler"></div>' +
        '<button id="sp-ok">Öffnen</button>' +
      '</div>';
    document.body.appendChild(o);
    const inp = o.querySelector('#sp-pw');
    inp.focus();

    const pruefen = async () => {
      if (await passwortStimmt(inp.value)) { o.remove(); fertig(true); return; }
      o.querySelector('#sp-fehler').textContent = 'Das Passwort stimmt nicht.';
      inp.select();
    };
    o.querySelector('#sp-ok').addEventListener('click', pruefen);
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') pruefen(); });
  });

  /* ========================================================================
   * SICHERUNG
   * ======================================================================*/
  const bestandSammeln = () => JSON.stringify({
    art: 'redion-sicherung', fassung: 1, wann: new Date().toISOString(),
    blocks: Store.cache.blocks, collections: Store.cache.collections,
    views: Store.cache.views, meta: Store.cache.meta
  });

  const sicherungSchreiben = async (passwort) => {
    const roh = bestandSammeln();
    const inhalt = passwort ? await verschluesseln(roh, passwort) : roh;
    const name = 'redion-sicherung-' + new Date().toISOString().slice(0, 10) +
                 (passwort ? '.verschluesselt.json' : '.json');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([inhalt], { type: 'application/json' }));
    a.download = name;
    a.click();
    Store.setMeta('sicherung:zuletzt', new Date().toISOString());
    return name;
  };

  /** Liest eine Sicherung ein — verschlüsselt oder nicht. */
  const sicherungLesen = async (text, passwort) => {
    let roh = text;
    if (text.trim().startsWith('{') && text.includes('redion-verschluesselt'))
      roh = await entschluesseln(text, passwort);
    const p = JSON.parse(roh);
    if (p.art !== 'redion-sicherung') throw new Error('Das ist keine Redion-Sicherung');
    return p;
  };

  /** Wie viele Dinge stecken in einer Sicherung? Für die Vorschau. */
  const sicherungZahlen = (p) => ({
    bloecke: Object.keys(p.blocks || {}).length,
    datenbanken: Object.keys(p.collections || {}).length,
    ansichten: Object.keys(p.views || {}).length,
    wann: p.wann
  });

  /* ========================================================================
   * DER DIALOG
   * ======================================================================*/
  const dialog = () => {
    const o = document.createElement('div');
    o.className = 'overlay';
    const an = sperreAn();
    o.innerHTML =
      '<div class="finder" style="width:min(600px,95vw)">' +
        '<div class="fh">🔐 Passwort und Sicherung<button class="icon-btn" data-a="zu">✕</button></div>' +
        '<div style="padding:15px 18px; display:flex; flex-direction:column; gap:14px">' +

          '<div class="kr-karte">' +
            '<b>Verschlüsselte Sicherung</b>' +
            '<div class="kr-text">Der ganze Bestand in einer Datei, mit AES-GCM 256 ' +
              'verschlüsselt. Der Schlüssel entsteht aus deinem Passwort über 310 000 Runden. ' +
              'Ohne Passwort ist die Datei nicht zu öffnen — auch nicht von mir.</div>' +
            '<div class="kr-zeile">' +
              '<input id="kr-pw" type="password" placeholder="Passwort für die Datei">' +
              '<button data-a="sichern" class="prim">Sichern</button>' +
            '</div>' +
            '<div class="kr-zeile">' +
              '<input id="kr-datei" type="file" accept=".json">' +
              '<button data-a="laden">Einlesen</button>' +
            '</div>' +
            '<div class="kr-text" id="kr-stand">' +
              (Store.getMeta('sicherung:zuletzt', '')
                ? 'Zuletzt gesichert: ' + Werkzeuge.zeitKurz(Store.getMeta('sicherung:zuletzt'))
                : 'Noch nie gesichert.') +
            '</div>' +
          '</div>' +

          '<div class="kr-karte">' +
            `<b>Sperre beim Öffnen ${an ? '— eingeschaltet' : ''}</b>` +
            '<div class="kr-text">Beim Start erst das Passwort. Das schützt vor dem Blick ' +
              'über die Schulter. Wer Zugriff auf die Festplatte hat, kommt trotzdem an die ' +
              'Rohdaten — dafür ist die verschlüsselte Sicherung da.</div>' +
            (an
              ? '<div class="kr-zeile"><button data-a="sperre-aus">Sperre abschalten</button></div>'
              : '<div class="kr-zeile">' +
                  '<input id="kr-sp1" type="password" placeholder="Neues Passwort">' +
                  '<input id="kr-sp2" type="password" placeholder="Noch einmal">' +
                  '<button data-a="sperre-an" class="prim">Einschalten</button>' +
                '</div>') +
          '</div>' +

        '</div>' +
        '<div class="fbtns"><button data-a="zu">Schliessen</button></div>' +
      '</div>';
    document.body.appendChild(o);

    o.addEventListener('click', async e => {
      if (e.target === o || e.target.closest('[data-a="zu"]')) { o.remove(); return; }

      if (e.target.closest('[data-a="sichern"]')) {
        const pw = o.querySelector('#kr-pw').value;
        const name = await sicherungSchreiben(pw || null);
        UI.toast(pw ? 'Verschlüsselt gesichert: ' + name : 'Ungeschützt gesichert: ' + name);
        return;
      }

      if (e.target.closest('[data-a="laden"]')) {
        const f = o.querySelector('#kr-datei').files[0];
        if (!f) { UI.toast('Erst eine Datei wählen'); return; }
        const text = await f.text();
        let p;
        try { p = await sicherungLesen(text, o.querySelector('#kr-pw').value); }
        catch (err) { UI.banner('Sicherung nicht lesbar: ' + err.message, 'fehler'); return; }
        const z = sicherungZahlen(p);
        const ok = await UI.frage('Sicherung einlesen?',
          `Sie enthält ${z.bloecke} Blöcke, ${z.datenbanken} Datenbanken und ` +
          `${z.ansichten} Ansichten vom ${new Date(z.wann).toLocaleString('de-DE')}. ` +
          'Der jetzige Bestand wird davor als Datei gesichert und dann ersetzt.');
        if (!ok) return;
        await sicherungSchreiben(null);              /* Netz unter dem Seil */
        Object.assign(Store.cache.blocks, p.blocks);
        Object.assign(Store.cache.collections, p.collections);
        Object.assign(Store.cache.views, p.views);
        Object.assign(Store.cache.meta, p.meta);
        Store.alles && Store.alles();
        o.remove();
        UI.toast('Eingelesen — die Seite wird neu geladen');
        setTimeout(() => location.reload(), 900);
        return;
      }

      if (e.target.closest('[data-a="sperre-an"]')) {
        const a1 = o.querySelector('#kr-sp1').value, a2 = o.querySelector('#kr-sp2').value;
        if (!a1) { UI.toast('Ein Passwort brauchen wir schon'); return; }
        if (a1 !== a2) { UI.toast('Die beiden stimmen nicht überein'); return; }
        await sperreEinrichten(a1);
        o.remove();
        UI.toast('Sperre eingeschaltet — beim nächsten Start wird gefragt');
        return;
      }

      if (e.target.closest('[data-a="sperre-aus"]')) {
        sperreAus(); o.remove(); UI.toast('Sperre abgeschaltet');
      }
    });
  };

  /** Beim Start: wenn eine Sperre eingerichtet ist, erst fragen. */
  const startPruefen = async () => {
    if (!sperreAn()) return true;
    return sperrschirm();
  };

  return { verschluesseln, entschluesseln, sperreAn, sperreEinrichten, sperreAus,
           passwortStimmt, sperrschirm, startPruefen, dialog,
           sicherungSchreiben, sicherungLesen, sicherungZahlen, bestandSammeln };
})();

window.Krypto = Krypto;
