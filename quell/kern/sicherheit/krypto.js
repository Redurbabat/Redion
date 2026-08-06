"use strict";
/* ============================================================================
 * krypto.js — Verschlüsselung mit einem Passwort
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/kern/sicherheit/krypto.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/kern/sicherheit/krypto.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
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
    /* Das angeklickte Element — oder nichts. `e.target` ist `EventTarget | null`
       und muss ein `Element` sein, bevor `closest` daran etwas findet. Vorher
       stand hier ungeprüft `e.target.closest(…)`: bei einem Klick, dessen Ziel
       kein Element ist, warf das mitten im Behandeln. */
    const elVon = (e) => e.target instanceof Element ? e.target : null;
    /** Ein Satz aus einem Fehler — auch wenn geworfen wurde, was kein Fehler ist. */
    const satzVon = (err) => err instanceof Error ? err.message : String(err);
    const enc = new TextEncoder();
    const dec = new TextDecoder();
    /* Aus `core/helpers/bytes.ts`. Hier stand vorher die Fassung mit dem
       Spread, die ab etwa 128 000 Bytes den Aufrufstapel sprengte — also genau
       dann, wenn der Bestand gross genug war, dass sich das Sichern lohnt.
       Dort steht, warum es nur noch eine Fassung davon gibt. */
    const b64 = (buf) => Bytes.toBase64(buf);
    const ausB64 = (s) => Bytes.fromBase64(s);
    const RUNDEN = 310000; /* OWASP-Empfehlung für PBKDF2-SHA256 */
    /** Aus Passwort und Salz einen Schlüssel machen. */
    const schluessel = async (passwort, salz) => {
        const roh = await crypto.subtle.importKey('raw', enc.encode(passwort), 'PBKDF2', false, ['deriveKey']);
        return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: salz, iterations: RUNDEN, hash: 'SHA-256' }, roh, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
    };
    /**
     * Verschlüsselt einen Text.
     * @returns {Promise<string>} eine JSON-Zeichenkette mit Salz, Zufallszahl und Inhalt
     */
    const verschluesseln = async (text, passwort) => {
        const salz = crypto.getRandomValues(new Uint8Array(16));
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const k = await schluessel(passwort, salz);
        const daten = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, k, enc.encode(text));
        return JSON.stringify({
            art: 'redion-verschluesselt', fassung: 1, runden: RUNDEN,
            salz: b64(salz), iv: b64(iv), inhalt: b64(daten)
        });
    };
    /** Entschlüsselt, was verschluesseln() gemacht hat. */
    const entschluesseln = async (json, passwort) => {
        const p = typeof json === 'string' ? JSON.parse(json) : json;
        if (p.art !== 'redion-verschluesselt')
            throw new Error('Das ist keine verschlüsselte Redion-Datei');
        /* `Uint8Array<ArrayBufferLike>` gegen `BufferSource`: die Web-Crypto-API
           will einen eigenständigen Puffer, `Bytes.fromBase64` gibt eine Sicht
           darauf. Zur Laufzeit dasselbe — die Umschreibung sagt es TypeScript,
           ohne die Prüfung an den Aufrufstellen abzuschalten. */
        const salz = ausB64(p.salz);
        const iv = ausB64(p.iv);
        const roh = await crypto.subtle.importKey('raw', enc.encode(passwort), 'PBKDF2', false, ['deriveKey']);
        const k = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: salz, iterations: p.runden || RUNDEN, hash: 'SHA-256' }, roh, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
        try {
            const daten = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, k, ausB64(p.inhalt));
            return dec.decode(daten);
        }
        catch {
            throw new Error('Falsches Passwort');
        }
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
        if (!pruef)
            return true;
        try {
            return (await entschluesseln(pruef, passwort)) === 'redion-sperre-ok';
        }
        catch {
            return false;
        }
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
        const fehler = o.querySelector('#sp-fehler');
        const okKnopf = o.querySelector('#sp-ok');
        /* Alle drei stehen in der Zeichenkette oben. Fehlt eines, gibt es kein
           Sperrfenster — dann die Überlagerung wieder wegnehmen, statt eine
           stehenzulassen, in die niemand etwas eintippen kann. */
        if (!inp || !fehler || !okKnopf) {
            o.remove();
            fertig(false);
            return;
        }
        inp.focus();
        const pruefen = async () => {
            if (await passwortStimmt(inp.value)) {
                o.remove();
                fertig(true);
                return;
            }
            fehler.textContent = 'Das Passwort stimmt nicht.';
            inp.select();
        };
        okKnopf.addEventListener('click', pruefen);
        inp.addEventListener('keydown', e => { if (e.key === 'Enter')
            pruefen(); });
    });
    /* ========================================================================
     * SICHERUNG
     * ======================================================================*/
    /**
     * Der Bestand als JSON — **dasselbe**, was der Hauptweg schreibt.
     *
     * WARUM NICHT MEHR EIGENS GESAMMELT. Vorher stand hier ein zweites Format:
     * `blocks`, `collections`, `views`, `meta` — und sonst nichts. Es fehlten
     * der Versionsverlauf und, ohne ein Wort darüber, die Anhänge. Zwei
     * Sicherungswege hiessen „Sicherung" und enthielten nicht dasselbe; wer den
     * verschlüsselten nahm, verlor seinen Verlauf, ohne es zu erfahren.
     *
     * `exportAll` trägt `enthaelt`, `fehlt` und `hinweis` — genau die Felder,
     * die eine unvollständige Sicherung dazu bringen, das selbst zu sagen.
     * Genau die fehlten hier.
     *
     * `art` und `fassung` bleiben zusätzlich stehen, damit Sicherungen, die
     * schon geschrieben wurden, weiter erkannt werden. Eine Datei, die jemand
     * vor einem Jahr angelegt hat, ist kein Altlastenproblem — sie ist der
     * Zweck der Übung.
     */
    const bestandSammeln = async () => {
        /* Holt den Verlauf aus der Ablage; er liegt bewusst nicht im
           Zwischenspeicher. Ohne diesen Aufruf wäre `versions` leer — still. */
        if (Store.exportVorbereiten)
            await Store.exportVorbereiten();
        const d = JSON.parse(Store.exportAll());
        return JSON.stringify(Object.assign({ art: 'redion-sicherung', fassung: 1, wann: d.exportiert }, d), null, 2);
    };
    const sicherungSchreiben = async (passwort) => {
        const roh = await bestandSammeln();
        const inhalt = passwort ? await verschluesseln(roh, passwort) : roh;
        const name = 'redion-sicherung-' + new Date().toISOString().slice(0, 10) +
            (passwort ? '.verschluesselt.json' : '.json');
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([inhalt], { type: 'application/json' }));
        a.download = name;
        a.click();
        Store.setMeta('sicherung:zuletzt', new Date().toISOString());
        /* Auch dieser Weg schreibt JSON — ohne Anhänge. Der Start-Bildschirm sagt
           das jetzt dazu, also muss hier stehen, was für eine Sicherung es war. */
        Store.setMeta('sicherung:art', 'json');
        return name;
    };
    /**
     * Liest eine Sicherung — verschlüsselt oder nicht.
     *
     * Erkannt werden beide Bauarten: die mit `art: 'redion-sicherung'` aus
     * diesem Weg und die mit `version` aus dem Hauptweg. Eine `.json`, die
     * jemand über „Sicherung speichern" angelegt hat, ist eine Sicherung — sie
     * hier abzulehnen, weil ihr ein Feld fehlt, wäre eine Schikane gegen den
     * eigenen Nutzer.
     */
    const sicherungLesen = async (text, passwort) => {
        let roh = text;
        if (text.trim().startsWith('{') && text.includes('redion-verschluesselt'))
            roh = await entschluesseln(text, passwort ?? '');
        const p = JSON.parse(roh);
        if (p.art !== 'redion-sicherung' && !p.blocks)
            throw new Error('Das ist keine Redion-Sicherung');
        return p;
    };
    /**
     * Eine gelesene Sicherung wirklich einspielen.
     *
     * WAS VORHER GESCHAH, UND WARUM ES DER SCHLIMMSTE FALL WAR. An dieser
     * Stelle standen vier `Object.assign` auf `Store.cache`, gefolgt von
     * `Store.alles && Store.alles()`. Diese Funktion gibt es nicht; der Aufruf
     * war abgesichert und deshalb ein stiller Leerlauf. Nichts ging in die
     * Ablage. Neunhundert Millisekunden später lud die Seite neu, las aus der
     * Ablage — und dort stand unverändert der alte Bestand.
     *
     * Die Wiederherstellung wurde als geglückt gemeldet und war eine Sekunde
     * später verschwunden. Wer sie brauchte, brauchte sie meistens dringend.
     *
     * Dazu kam, dass `Object.assign` zusammenführt. Der Dialog sagte „und dann
     * ersetzt" — zwei verschiedene Dinge, und der Nutzer las das eine und
     * bekam das andere.
     *
     * Beides erledigt jetzt `Store.importAll`: es schreibt in die Ablage, es
     * kennt „ersetzen" und „zusammenfuehren", und es lehnt jede andere Angabe
     * ab. Es ist derselbe Weg, den die Sicherung ohne Passwort schon immer
     * genommen hat — es gibt keinen Grund, warum die mit Passwort einen
     * eigenen bräuchte.
     *
     * @param {string} text  die gelesene (bereits entschlüsselte) Sicherung
     * @param {'ersetzen'|'zusammenfuehren'} art
     */
    const sicherungEinspielen = async (text, art) => Store.importAll(typeof text === 'string' ? text : JSON.stringify(text), art);
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
        o.addEventListener('click', async (e) => {
            if (e.target === o || elVon(e)?.closest('[data-a="zu"]')) {
                o.remove();
                return;
            }
            if (elVon(e)?.closest('[data-a="sichern"]')) {
                const pw = o.querySelector('#kr-pw')?.value ?? '';
                const name = await sicherungSchreiben(pw || undefined);
                UI.toast(pw ? 'Verschlüsselt gesichert: ' + name : 'Ungeschützt gesichert: ' + name);
                return;
            }
            if (elVon(e)?.closest('[data-a="laden"]')) {
                const f = o.querySelector('#kr-datei')?.files?.[0];
                if (!f) {
                    UI.toast('Erst eine Datei wählen');
                    return;
                }
                const text = await f.text();
                let p;
                try {
                    p = await sicherungLesen(text, o.querySelector('#kr-pw')?.value ?? '');
                }
                catch (err) {
                    UI.banner('Sicherung nicht lesbar: ' + satzVon(err), 'fehler');
                    return;
                }
                const z = sicherungZahlen(p);
                const ok = await UI.frage('Sicherung einlesen?', `Sie enthält ${z.bloecke} Blöcke, ${z.datenbanken} Datenbanken und ` +
                    `${z.ansichten} Ansichten vom ${new Date(z.wann).toLocaleString('de-DE')}. ` +
                    'Der jetzige Bestand wird davor als Datei gesichert und dann ersetzt: ' +
                    'was nicht in der Sicherung steht, wird gelöscht.' +
                    (p.hinweis ? '\n\n' + p.hinweis : ''));
                if (!ok)
                    return;
                await sicherungSchreiben(); /* Netz unter dem Seil */
                /* „ersetzen", weil genau das oben zugesagt wurde. Und über
                   `Store.importAll`, weil es in die Ablage schreibt — vorher ging
                   das Eingespielte beim Neuladen neunhundert Millisekunden später
                   wieder verloren, und gemeldet wurde trotzdem ein Erfolg. */
                try {
                    await sicherungEinspielen(JSON.stringify(p), 'ersetzen');
                }
                catch (err) {
                    UI.banner('Einspielen fehlgeschlagen: ' + satzVon(err), 'fehler');
                    return;
                }
                o.remove();
                UI.toast('Eingelesen — die Seite wird neu geladen');
                setTimeout(() => location.reload(), 900);
                return;
            }
            if (elVon(e)?.closest('[data-a="sperre-an"]')) {
                const a1 = o.querySelector('#kr-sp1')?.value ?? '';
                const a2 = o.querySelector('#kr-sp2')?.value ?? '';
                if (!a1) {
                    UI.toast('Ein Passwort brauchen wir schon');
                    return;
                }
                if (a1 !== a2) {
                    UI.toast('Die beiden stimmen nicht überein');
                    return;
                }
                await sperreEinrichten(a1);
                o.remove();
                UI.toast('Sperre eingeschaltet — beim nächsten Start wird gefragt');
                return;
            }
            if (elVon(e)?.closest('[data-a="sperre-aus"]')) {
                sperreAus();
                o.remove();
                UI.toast('Sperre abgeschaltet');
            }
        });
    };
    /** Beim Start: wenn eine Sperre eingerichtet ist, erst fragen. */
    const startPruefen = async () => {
        if (!sperreAn())
            return true;
        return sperrschirm();
    };
    return { verschluesseln, entschluesseln, sperreAn, sperreEinrichten, sperreAus,
        passwortStimmt, sperrschirm, startPruefen, dialog,
        sicherungSchreiben, sicherungLesen, sicherungZahlen, bestandSammeln,
        sicherungEinspielen };
})();
window.Krypto = Krypto;
