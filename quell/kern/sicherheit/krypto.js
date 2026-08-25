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
 * Drei Dinge stecken drin:
 *
 *   1. VERSCHLÜSSELTES `.redion` — Bestand, Verlauf und alle Anhänge. Ein
 *      zufälliger Datenschlüssel verschlüsselt jeden Eintrag einzeln mit
 *      AES-GCM 256. Das Passwort schützt diesen Schlüssel über PBKDF2-SHA256
 *      mit 310 000 Runden und zufälligem Salz. Anhänge bleiben in Stücken;
 *      auch ein grosses Video geht nie vollständig durch den Arbeitsspeicher.
 *
 *   2. SCHLÜSSELWECHSEL — das Passwort wird neu abgeleitet und der zufällige
 *      Datenschlüssel neu eingehüllt. Die grossen verschlüsselten Einträge
 *      müssen dafür weder entschlüsselt noch neu verschlüsselt werden.
 *
 *   3. SPERRE — beim Öffnen erst das Passwort. Sie schützt vor dem Blick über
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
    const PAKET_ART = 'redion-verschluesselt';
    const PAKET_FASSUNG = 2;
    const PAKET_MANIFEST = 'manifest.json';
    const PAKET_RUNDEN_MIN = 100000;
    const PAKET_RUNDEN_MAX = 2000000;
    /** Aus Passwort und Salz einen Schlüssel machen. */
    const schluessel = async (passwort, salz, runden = RUNDEN) => {
        const roh = await crypto.subtle.importKey('raw', enc.encode(passwort), 'PBKDF2', false, ['deriveKey']);
        return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: salz, iterations: runden, hash: 'SHA-256' }, roh, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
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
    /* Was der letzten gesammelten Sicherung fehlte — für den Toast danach.
       Das Manifest in der Datei sagt es auch, aber verschlüsselt liest es
       niemand, bevor er es braucht. */
    let zuletztGefehlt = [];
    const bestandSammeln = async () => {
        /* Holt den Verlauf aus der Ablage; er liegt bewusst nicht im
           Zwischenspeicher. Ohne diesen Aufruf wäre `versions` leer — still. */
        if (Store.exportVorbereiten)
            await Store.exportVorbereiten();
        const d = JSON.parse(Store.exportAll());
        zuletztGefehlt = Array.isArray(d.fehlt) ? d.fehlt : [];
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
     * VOLLSTÄNDIGES, VERSCHLÜSSELTES `.redion` — FORMATFASSUNG 2
     * ------------------------------------------------------------------------
     * Das äussere ZIP ist nur ein Behälter. Lesbar bleiben ausschliesslich die
     * Kryptoparameter, zufällige Kennungen, Zahl und verschlüsselte Grösse der
     * Einträge. Titel, Dateinamen, Medientypen, Datei-Kennungen und Inhalte
     * stehen nur in AES-GCM-verschlüsselten Einträgen.
     *
     * Ein zufälliger Datenschlüssel schützt die Einträge. Das Passwort schützt
     * diesen Schlüssel. Das ist keine eigene Chiffre, sondern das übliche
     * Schlüsselhüllen-Muster mit zwei Anwendungen von AES-GCM. Es macht den
     * Schlüsselwechsel möglich, ohne einen 500-MB-Anhang erneut zu lesen.
     * ======================================================================*/
    const zufall = (laenge) => crypto.getRandomValues(new Uint8Array(laenge));
    const aad = (paketId, zweck) => enc.encode(`redion-paket-v${PAKET_FASSUNG}:${paketId}:${zweck}`);
    const aesVerschluesseln = async (daten, key, zusatz) => {
        const iv = zufall(12);
        const inhalt = await crypto.subtle.encrypt({
            name: 'AES-GCM', iv: iv,
            additionalData: zusatz, tagLength: 128
        }, key, daten);
        return { iv: b64(iv), inhalt: new Uint8Array(inhalt) };
    };
    const aesEntschluesseln = async (daten, key, ivText, zusatz
    /* `Uint8Array<ArrayBuffer>`, nicht bloss `Uint8Array`: seit den neueren
       DOM-Typen ist das voreingestellte `ArrayBufferLike` auch ein
       `SharedArrayBuffer`, und ein solcher taugt nicht als `BlobPart`. Der
       Wert hier kommt aus `new Uint8Array(ArrayBuffer)` und ist immer der
       engere Fall — sagen muss man es trotzdem. */
    ) => {
        const iv = ausB64(ivText);
        if (iv.byteLength !== 12)
            throw new Error('Die Nonce im Paket ist ungültig.');
        const inhalt = await crypto.subtle.decrypt({
            name: 'AES-GCM', iv: iv,
            additionalData: zusatz, tagLength: 128
        }, key, daten);
        return new Uint8Array(inhalt);
    };
    /** Der authentifizierte, kanonische Teil des Manifests. */
    const manifestKern = (m) => ({
        art: m.art,
        fassung: m.fassung,
        paketId: m.paketId,
        erstellt: m.erstellt,
        kdf: m.kdf,
        chiffre: m.chiffre,
        schluessel: m.schluessel,
        eintraege: m.eintraege
    });
    const manifestKernText = (m) => JSON.stringify(manifestKern(m));
    const istObjekt = (wert) => !!wert && typeof wert === 'object' && !Array.isArray(wert);
    /**
     * Liest nur die öffentliche Hülle und begrenzt dabei auch PBKDF2. Ein
     * manipuliertes Paket darf nicht mit Milliarden Runden den Browser
     * festhalten, bevor überhaupt eine Authentifizierung möglich ist.
     */
    const manifestPruefen = (wert) => {
        if (!istObjekt(wert) || wert.art !== PAKET_ART || wert.fassung !== PAKET_FASSUNG)
            throw new Error('Das ist kein verschlüsseltes Redion-Paket der Fassung 2.');
        const kdf = wert.kdf, chiffre = wert.chiffre;
        if (!istObjekt(kdf) || kdf.name !== 'PBKDF2' || kdf.hash !== 'SHA-256' ||
            !Number.isInteger(kdf.runden) || kdf.runden < PAKET_RUNDEN_MIN ||
            kdf.runden > PAKET_RUNDEN_MAX || typeof kdf.salz !== 'string')
            throw new Error('Die Schlüsselableitung im Paket ist ungültig.');
        if (!istObjekt(chiffre) || chiffre.name !== 'AES-GCM' || chiffre.bits !== 256 ||
            chiffre.tagBits !== 128)
            throw new Error('Die Verschlüsselungsangabe im Paket ist ungültig.');
        if (typeof wert.paketId !== 'string' || !/^[A-Za-z0-9_-]{16,80}$/.test(wert.paketId) ||
            typeof wert.erstellt !== 'string' || !istObjekt(wert.schluessel) ||
            typeof wert.schluessel.iv !== 'string' || typeof wert.schluessel.inhalt !== 'string' ||
            !istObjekt(wert.pruef) || typeof wert.pruef.iv !== 'string' ||
            typeof wert.pruef.inhalt !== 'string' || !Array.isArray(wert.eintraege))
            throw new Error('Das Manifest des Pakets ist unvollständig.');
        const pfade = new Set();
        for (const roh of wert.eintraege) {
            if (!istObjekt(roh) || typeof roh.pfad !== 'string' ||
                !/^(daten\.enc|dateien\.enc|anhaenge\/[0-9]{6}\/[0-9]{6}\.enc)$/.test(roh.pfad) ||
                !['daten', 'dateiliste', 'anhang'].includes(String(roh.art)) ||
                typeof roh.iv !== 'string' || !Number.isSafeInteger(roh.bytes) || roh.bytes < 16 ||
                pfade.has(roh.pfad))
                throw new Error('Die Eintragsliste des Pakets ist ungültig.');
            pfade.add(roh.pfad);
        }
        if (wert.eintraege.length > 1000000)
            throw new Error('Das Paket kündigt unrealistisch viele Einträge an.');
        if (ausB64(kdf.salz).byteLength !== 16)
            throw new Error('Das Salz im Paket ist ungültig.');
        return wert;
    };
    const eintragVon = (m, art) => {
        const liste = m.eintraege.filter(e => e.art === art);
        if (liste.length !== 1)
            throw new Error(`Das Paket braucht genau einen Eintrag der Art „${art}“.`);
        return liste[0];
    };
    const eintragEntschluesseln = async (zip, m, e, key) => {
        const blob = await zip.alsBlob(e.pfad);
        if (!blob || blob.size !== e.bytes)
            throw new Error(`Der verschlüsselte Eintrag „${e.pfad}“ fehlt oder ist abgeschnitten.`);
        try {
            return await aesEntschluesseln(await blob.arrayBuffer(), key, e.iv, aad(m.paketId, 'eintrag:' + e.pfad));
        }
        catch {
            throw new Error(`Der Eintrag „${e.pfad}“ ist beschädigt oder nicht authentisch.`);
        }
    };
    /** Erstellt den zufälligen Datenschlüssel und seine passwortgeschützte Hülle. */
    const paketSchluesselNeu = async (passwort, paketId) => {
        if (!passwort)
            throw new Error('Für eine verschlüsselte Sicherung ist ein Passwort nötig.');
        const roh = zufall(32);
        const datenSchluessel = await crypto.subtle.importKey('raw', roh, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
        const salz = zufall(16);
        const passwortSchluessel = await schluessel(passwort, salz);
        const huelle = await aesVerschluesseln(roh, passwortSchluessel, aad(paketId, 'schluessel'));
        return {
            roh,
            datenSchluessel,
            kdf: { name: 'PBKDF2', hash: 'SHA-256', runden: RUNDEN, salz: b64(salz) },
            huelle: { iv: huelle.iv, inhalt: b64(huelle.inhalt) }
        };
    };
    /**
     * Öffnet nur den Datenschlüssel. Vor diesem Schritt wird weder eine
     * Nutzdatei entschlüsselt noch irgendein Store-Schreibweg erreicht.
     */
    const paketSchluesselOeffnen = async (m, passwort) => {
        try {
            const salz = ausB64(m.kdf.salz);
            const passwortSchluessel = await schluessel(passwort, salz, m.kdf.runden);
            const roh = await aesEntschluesseln(ausB64(m.schluessel.inhalt), passwortSchluessel, m.schluessel.iv, aad(m.paketId, 'schluessel'));
            if (roh.byteLength !== 32)
                throw new Error('Schlüssellänge');
            const datenSchluessel = await crypto.subtle.importKey('raw', roh, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
            const belegt = await aesEntschluesseln(ausB64(m.pruef.inhalt), datenSchluessel, m.pruef.iv, aad(m.paketId, 'manifest'));
            if (dec.decode(belegt) !== manifestKernText(m))
                throw new Error('Manifest stimmt nicht');
            return { roh, datenSchluessel };
        }
        catch {
            /* Falsches Passwort und manipulierte Hülle sind absichtlich nicht zu
               unterscheiden. Beides muss vor der ersten Datenänderung enden. */
            throw new Error('Falsches Passwort oder beschädigte Sicherung — nichts wurde verändert.');
        }
    };
    /**
     * Baut ein vollständiges verschlüsseltes Archiv. Jedes Anhangsstück wird
     * einzeln gelesen und sofort wieder als verschlüsseltes Blob abgelegt.
     */
    const paketBauen = async (passwort) => {
        if (!passwort)
            throw new Error('Für eine verschlüsselte Sicherung ist ein Passwort nötig.');
        await Store.exportVorbereiten();
        const saetze = await Store.dateiAlle();
        const paketId = b64(zufall(18)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
        const schutz = await paketSchluesselNeu(passwort, paketId);
        const eintraege = [];
        const archiv = [];
        const verschluesseltAblegen = async (pfad, art, roh) => {
            const geheim = await aesVerschluesseln(roh, schutz.datenSchluessel, aad(paketId, 'eintrag:' + pfad));
            eintraege.push({ pfad, art, iv: geheim.iv, bytes: geheim.inhalt.byteLength });
            archiv.push({ name: pfad, inhalt: geheim.inhalt });
        };
        /* Die JSON behauptet nur dann, Anhänge seien enthalten, wenn jedes
           Stück unten wirklich lesbar ist. Ein halber Upload bricht die ganze
           Sicherung ab; er wird nie als vollständige Datei ausgegeben. */
        await verschluesseltAblegen('daten.enc', 'daten', enc.encode(Store.exportAll(true)));
        const dateien = [];
        for (let dateiNr = 0; dateiNr < saetze.length; dateiNr++) {
            const satz = saetze[dateiNr];
            const stuecke = await Store.stueckeVon(satz.id);
            const soll = Number(satz.teile);
            if (satz.zustand !== 'fertig' || !Number.isInteger(soll) || soll < 1 ||
                stuecke.length !== soll)
                throw new Error(`Anhang „${satz.name || satz.id}“ ist unvollständig — ` +
                    'die verschlüsselte Sicherung wurde nicht geschrieben.');
            const teile = [];
            let groesse = 0;
            for (let nr = 0; nr < stuecke.length; nr++) {
                const stueck = stuecke[nr];
                if (stueck.nr !== nr)
                    throw new Error(`Anhang „${satz.name || satz.id}“ hat eine Lücke bei Stück ${nr}.`);
                const blob = stueck.blob instanceof Blob ? stueck.blob
                    : stueck.teil instanceof Blob ? stueck.teil : null;
                if (!blob)
                    throw new Error(`Stück ${nr} von „${satz.name || satz.id}“ ist nicht lesbar.`);
                groesse += blob.size;
                const pfad = 'anhaenge/' + String(dateiNr).padStart(6, '0') + '/' +
                    String(nr).padStart(6, '0') + '.enc';
                await verschluesseltAblegen(pfad, 'anhang', await blob.arrayBuffer());
                teile.push({ nr, pfad });
            }
            if (Number(satz.groesse) !== groesse)
                throw new Error(`Anhang „${satz.name || satz.id}“ hat ${groesse} statt ` +
                    `${Number(satz.groesse)} Byte — nichts wurde geschrieben.`);
            dateien.push({ id: String(satz.id), teile });
        }
        const dateiliste = { version: 2, saetze, dateien };
        await verschluesseltAblegen('dateien.enc', 'dateiliste', enc.encode(JSON.stringify(dateiliste)));
        const manifest = {
            art: PAKET_ART,
            fassung: PAKET_FASSUNG,
            paketId,
            erstellt: new Date().toISOString(),
            kdf: schutz.kdf,
            chiffre: { name: 'AES-GCM', bits: 256, tagBits: 128 },
            schluessel: schutz.huelle,
            eintraege,
            pruef: { iv: '', inhalt: '' }
        };
        const pruef = await aesVerschluesseln(enc.encode(manifestKernText(manifest)), schutz.datenSchluessel, aad(paketId, 'manifest'));
        manifest.pruef = { iv: pruef.iv, inhalt: b64(pruef.inhalt) };
        const blob = await Austausch.zipSchreiben([
            { name: PAKET_MANIFEST, inhalt: JSON.stringify(manifest, null, 2) }, ...archiv
        ]);
        const name = 'redion-sicherung-' + new Date().toISOString().slice(0, 10) +
            '.verschluesselt.redion';
        return { blob, name, manifest, anhaenge: saetze.length };
    };
    const paketSchreiben = async (passwort) => {
        const paket = await paketBauen(passwort);
        Austausch.laden(paket.blob, paket.name);
        Store.setMeta('sicherung:zuletzt', new Date().toISOString());
        Store.setMeta('sicherung:art', 'redion-verschluesselt');
        return paket.name;
    };
    /**
     * Entschlüsselt und authentifiziert ALLES als Probelauf. Besonders wichtig:
     * `Store.importAll`, `dateiPut` und `stueckPut` stehen nicht in dieser
     * Funktion. Ein falsches Passwort oder beschädigtes letztes Stück kann
     * deshalb keinen halben Import hinterlassen.
     */
    const paketOeffnen = async (blob, passwort) => {
        const zip = await Einlesen.zipLesenAusBlob(blob);
        const manifestText = await zip.text(PAKET_MANIFEST);
        if (!manifestText)
            throw new Error('Das Archiv hat kein verschlüsseltes Redion-Manifest.');
        let manifestRoh;
        try {
            manifestRoh = JSON.parse(manifestText);
        }
        catch {
            throw new Error('Das verschlüsselte Manifest ist nicht lesbar.');
        }
        const manifest = manifestPruefen(manifestRoh);
        const erwartet = new Set([PAKET_MANIFEST, ...manifest.eintraege.map(e => e.pfad)]);
        if (zip.namen.length !== erwartet.size || zip.namen.some((n) => !erwartet.has(n)))
            throw new Error('Das Archiv enthält nicht deklarierte oder doppelte Einträge.');
        const geoeffnet = await paketSchluesselOeffnen(manifest, passwort);
        const datenBytes = await eintragEntschluesseln(zip, manifest, eintragVon(manifest, 'daten'), geoeffnet.datenSchluessel);
        const dateiBytes = await eintragEntschluesseln(zip, manifest, eintragVon(manifest, 'dateiliste'), geoeffnet.datenSchluessel);
        const datenText = dec.decode(datenBytes);
        let daten, dateiliste;
        try {
            daten = JSON.parse(datenText);
            dateiliste = JSON.parse(dec.decode(dateiBytes));
        }
        catch {
            throw new Error('Der entschlüsselte Paketinhalt ist kein gültiges JSON.');
        }
        if (!istObjekt(daten) || !istObjekt(daten.blocks) ||
            !Array.isArray(daten.enthaelt) || !daten.enthaelt.includes('dateien') ||
            !daten.enthaelt.includes('stuecke') ||
            !istObjekt(dateiliste) || dateiliste.version !== 2 ||
            !Array.isArray(dateiliste.saetze) || !Array.isArray(dateiliste.dateien))
            throw new Error('Der entschlüsselte Bestand ist keine vollständige Redion-Sicherung.');
        const saetze = new Map();
        for (const satz of dateiliste.saetze) {
            if (!istObjekt(satz) || typeof satz.id !== 'string' || saetze.has(satz.id))
                throw new Error('Die verschlüsselte Dateiliste enthält eine ungültige Kennung.');
            saetze.set(satz.id, satz);
        }
        if (dateiliste.dateien.length !== saetze.size)
            throw new Error('Dateisätze und verschlüsselte Anhänge sind nicht vollständig zugeordnet.');
        const eintragNachPfad = new Map(manifest.eintraege.map(e => [e.pfad, e]));
        const benutzt = new Set();
        const dateiIds = new Set();
        for (const datei of dateiliste.dateien) {
            if (!istObjekt(datei) || typeof datei.id !== 'string' || dateiIds.has(datei.id) ||
                !Array.isArray(datei.teile) || !saetze.has(datei.id))
                throw new Error('Die verschlüsselte Stückliste ist ungültig.');
            dateiIds.add(datei.id);
            const satz = saetze.get(datei.id);
            if (datei.teile.length !== Number(satz.teile))
                throw new Error(`Der Anhang „${satz.name || datei.id}“ ist im Paket unvollständig.`);
            let groesse = 0;
            for (let nr = 0; nr < datei.teile.length; nr++) {
                const teil = datei.teile[nr];
                if (!istObjekt(teil) || teil.nr !== nr || typeof teil.pfad !== 'string' ||
                    benutzt.has(teil.pfad))
                    throw new Error(`Die Stückfolge von „${satz.name || datei.id}“ ist ungültig.`);
                const e = eintragNachPfad.get(teil.pfad);
                if (!e || e.art !== 'anhang')
                    throw new Error(`Anhangsstück „${teil.pfad}“ fehlt.`);
                benutzt.add(teil.pfad);
                const roh = await eintragEntschluesseln(zip, manifest, e, geoeffnet.datenSchluessel);
                groesse += roh.byteLength;
            }
            if (groesse !== Number(satz.groesse))
                throw new Error(`Der Anhang „${satz.name || datei.id}“ hat nach dem Prüfen ` +
                    `${groesse} statt ${Number(satz.groesse)} Byte.`);
        }
        const anhangEintraege = manifest.eintraege.filter(e => e.art === 'anhang');
        if (benutzt.size !== anhangEintraege.length)
            throw new Error('Das Paket enthält nicht zugeordnete verschlüsselte Anhangsstücke.');
        return {
            blob, zip, manifest, daten, datenText, dateiliste,
            datenSchluessel: geoeffnet.datenSchluessel,
            roherDatenSchluessel: geoeffnet.roh
        };
    };
    /** Schreibt ein bereits vollständig geprüftes Paket in den Bestand. */
    const geoeffnetesPaketEinspielen = async (paket, art) => {
        if (art !== 'ersetzen' && art !== 'zusammenfuehren')
            throw new Error('Beim Einspielen muss „ersetzen“ oder „zusammenfuehren“ gewählt sein.');
        const erg = await Store.importAll(paket.datenText, art);
        /* ERST ALLES LANDEN LASSEN, DANN DIE ANHÄNGE (E123).
           Hier stand ein `flush()` und daneben die Vermutung, `importAll`
           schreibe gepuffert weiter. Das war falsch; gemessen hat es nichts
           geändert. Der Wettlauf kam von `Store.purgeBlock`: das kehrt sofort
           zurück und löscht die Anhänge in einer abgelösten Aufgabe hinterher —
           die kam an, NACHDEM diese Schleife den Anhang neu geschrieben hatte,
           und nahm ihn wieder mit.
           `Store.importAll` wartet seit E123 vorn und hinten auf `settled()`.
           Der Aufruf hier ist der Gürtel zum Hosenträger: zwischen dem
           Einspielen und der ersten Anhangszeile darf nichts mehr unterwegs
           sein — ein Wiederherstellen, das den Anhang STILL verliert, ist
           schlimmer als eines, das scheitert (§46). */
        await Store.settled();
        const saetze = new Map(paket.dateiliste.saetze.map(s => [String(s.id), s]));
        const eintragNachPfad = new Map(paket.manifest.eintraege.map(e => [e.pfad, e]));
        let anhaenge = 0;
        for (const datei of paket.dateiliste.dateien) {
            const satz = saetze.get(datei.id);
            for (const alt of await Store.stueckeVon(datei.id))
                await Store.stueckWeg(alt.id);
            for (const teil of datei.teile) {
                const e = eintragNachPfad.get(teil.pfad);
                const roh = await eintragEntschluesseln(paket.zip, paket.manifest, e, paket.datenSchluessel);
                await Store.stueckPut({
                    id: datei.id + ':' + teil.nr, dateiId: datei.id, nr: teil.nr,
                    blob: new Blob([roh], { type: satz.typ || 'application/octet-stream' })
                });
            }
            await Store.dateiPut(Object.assign({}, satz, {
                teile: datei.teile.length, angekommen: datei.teile.length,
                zustand: 'fertig', groesse: Number(satz.groesse)
            }));
            anhaenge++;
        }
        if (art === 'ersetzen') {
            const behalten = new Set(paket.dateiliste.saetze.map(s => String(s.id)));
            for (const alt of await Store.dateiAlle()) {
                if (behalten.has(String(alt.id)))
                    continue;
                for (const st of await Store.stueckeVon(alt.id))
                    await Store.stueckWeg(st.id);
                await Store.dateiWeg(alt.id);
            }
        }
        return Object.assign({}, erg, { anhaenge });
    };
    const paketEinspielen = async (blob, passwort, art) => geoeffnetesPaketEinspielen(await paketOeffnen(blob, passwort), art);
    /**
     * Passwortwechsel per Schlüsselhülle. Die verschlüsselten Nutzdaten werden
     * bytegleich übernommen; nur Salz, Passwortschlüssel, Schlüsselhülle und
     * authentifiziertes Manifest sind neu. Alte Pakete bleiben mit dem alten
     * Passwort lesbar — eine Datei, die jemand schon besitzt, lässt sich nicht
     * nachträglich widerrufen.
     */
    const paketPasswortWechseln = async (blob, altesPasswort, neuesPasswort) => {
        if (!neuesPasswort)
            throw new Error('Das neue Passwort darf nicht leer sein.');
        const offen = await paketOeffnen(blob, altesPasswort);
        const salz = zufall(16);
        const passwortSchluessel = await schluessel(neuesPasswort, salz, RUNDEN);
        const huelle = await aesVerschluesseln(offen.roherDatenSchluessel, passwortSchluessel, aad(offen.manifest.paketId, 'schluessel'));
        const manifest = Object.assign({}, offen.manifest, {
            erstellt: new Date().toISOString(),
            kdf: { name: 'PBKDF2', hash: 'SHA-256', runden: RUNDEN, salz: b64(salz) },
            schluessel: { iv: huelle.iv, inhalt: b64(huelle.inhalt) },
            pruef: { iv: '', inhalt: '' }
        });
        const pruef = await aesVerschluesseln(enc.encode(manifestKernText(manifest)), offen.datenSchluessel, aad(manifest.paketId, 'manifest'));
        manifest.pruef = { iv: pruef.iv, inhalt: b64(pruef.inhalt) };
        const archiv = [
            { name: PAKET_MANIFEST, inhalt: JSON.stringify(manifest, null, 2) }
        ];
        for (const e of manifest.eintraege) {
            const inhalt = await offen.zip.alsBlob(e.pfad);
            if (!inhalt)
                throw new Error(`Der Eintrag „${e.pfad}“ fehlt beim Schlüsselwechsel.`);
            archiv.push({ name: e.pfad, inhalt });
        }
        const neu = await Austausch.zipSchreiben(archiv);
        return {
            blob: neu,
            name: 'redion-sicherung-' + new Date().toISOString().slice(0, 10) +
                '.schluessel-neu.verschluesselt.redion',
            manifest
        };
    };
    const sperreWechseln = async (alt, neu) => {
        if (!sperreAn())
            throw new Error('Die Sperre ist nicht eingeschaltet.');
        if (!(await passwortStimmt(alt)))
            throw new Error('Das bisherige Passwort stimmt nicht.');
        if (!neu)
            throw new Error('Das neue Passwort darf nicht leer sein.');
        await sperreEinrichten(neu);
    };
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
                '<div class="kr-text">Seiten, Datenbanken, Ansichten, Einstellungen und ' +
                'Versionsverlauf in einer Datei, mit AES-GCM 256 verschlüsselt. ' +
                'Dateianhänge sind <b>nicht</b> dabei — die stehen im vollständigen ' +
                'Paket eine Karte weiter (.redion-Datei). ' +
                'Der Schlüssel entsteht aus deinem Passwort über 310 000 Runden. ' +
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
                /* FASSUNG 2 — das vollständige Paket.
                   Diese Karte war schon einmal geschrieben und wurde wieder
                   ausgebaut: das Zurückholen verlor den Anhang, und ein Knopf,
                   hinter dem Datenverlust liegt, gehört nicht in die App (L42).
                   Seit E123 ist der Wettlauf behoben und gemessen — dreimal rot
                   ohne die Behebung, dreimal grün mit ihr. Jetzt darf der Knopf
                   da sein. */
                '<div class="kr-karte">' +
                '<b>Vollständiges Paket — verschlüsselt, mit Anhängen</b>' +
                '<div class="kr-text">Alles: Seiten, Datenbanken, Ansichten, ' +
                'Einstellungen, Versionsverlauf <b>und</b> die Dateianhänge. ' +
                'Jeder Teil einzeln mit AES-GCM 256 verschlüsselt, die Anhänge ' +
                'in Stücken — auch ein halbes Gigabyte geht durch, ohne dass es ' +
                'je ganz im Arbeitsspeicher liegt. ' +
                'Ohne Passwort ist nichts davon zu öffnen, nicht einmal die ' +
                'Dateinamen.</div>' +
                '<div class="kr-zeile">' +
                '<input id="kr-pk-pw" type="password" placeholder="Passwort für das Paket">' +
                '<button data-a="paket-sichern" class="prim">Paket sichern</button>' +
                '</div>' +
                '<div class="kr-zeile">' +
                '<input id="kr-pk-datei" type="file" accept=".redion">' +
                '<button data-a="paket-laden">Paket zurückholen</button>' +
                '</div>' +
                '<div class="kr-text">Zurückholen ersetzt den ganzen Bestand. ' +
                'Vorher wird der jetzige Stand als Datei gesichert.</div>' +
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
                /* Wenn Anhänge da sind und hier fehlen, gehört das in den Toast —
                   nicht nur ins verschlüsselte Manifest, wo es niemand liest. */
                const dazu = zuletztGefehlt.includes('dateien')
                    ? ' — ohne die Dateianhänge (dafür: .redion-Sicherung)' : '';
                UI.toast((pw ? 'Verschlüsselt gesichert: ' : 'Ungeschützt gesichert: ') + name + dazu);
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
            if (elVon(e)?.closest('[data-a="paket-sichern"]')) {
                const pw = o.querySelector('#kr-pk-pw')?.value ?? '';
                if (!pw) {
                    UI.toast('Ohne Passwort geht das Paket nicht');
                    return;
                }
                try {
                    const name = await paketSchreiben(pw);
                    UI.toast('Paket gesichert: ' + name);
                }
                catch (err) {
                    UI.banner('Das Paket kam nicht zustande: ' + satzVon(err), 'fehler');
                }
                return;
            }
            if (elVon(e)?.closest('[data-a="paket-laden"]')) {
                const f = o.querySelector('#kr-pk-datei')?.files?.[0];
                if (!f) {
                    UI.toast('Erst eine Datei wählen');
                    return;
                }
                const pw = o.querySelector('#kr-pk-pw')?.value ?? '';
                if (!pw) {
                    UI.toast('Ohne Passwort ist das Paket nicht zu öffnen');
                    return;
                }
                /* ERST ÖFFNEN, DANN FRAGEN. `paketOeffnen` entschlüsselt und prüft
                   ALLES, ohne einen einzigen Satz zu schreiben. Ein falsches
                   Passwort oder ein beschädigtes Stück scheitert also, bevor der
                   Nutzer die Frage überhaupt sieht — und der Bestand ist zu diesem
                   Zeitpunkt noch unangetastet. */
                let offen;
                try {
                    offen = await paketOeffnen(f, pw);
                }
                catch (err) {
                    UI.banner('Paket nicht lesbar: ' + satzVon(err), 'fehler');
                    return;
                }
                const anhaenge = offen.dateiliste.dateien.length;
                const ok = await UI.frage('Paket zurückholen?', `Es enthält den Bestand vom ${new Date(offen.manifest.erstellt).toLocaleString('de-DE')} ` +
                    `und ${anhaenge} Dateianhang/Dateianhänge. ` +
                    'Der jetzige Bestand wird davor als Datei gesichert und dann ersetzt: ' +
                    'was nicht im Paket steht, wird gelöscht.');
                if (!ok)
                    return;
                await sicherungSchreiben(); /* Netz unter dem Seil */
                try {
                    const erg = await geoeffnetesPaketEinspielen(offen, 'ersetzen');
                    o.remove();
                    UI.toast(`Zurückgeholt: ${erg.bloecke} Blöcke und ${erg.anhaenge} Anhang/Anhänge — ` +
                        'die Seite wird neu geladen');
                    setTimeout(() => location.reload(), 900);
                }
                catch (err) {
                    UI.banner('Zurückholen fehlgeschlagen: ' + satzVon(err), 'fehler');
                }
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
        sicherungEinspielen,
        /* Fassung 2 — das vollständige verschlüsselte Paket MIT Anhängen.
           Stand bis hierher nur als Code da und war von aussen nicht
           erreichbar; ohne diese Zeile kann niemand es aufrufen (E122). */
        paketBauen, paketSchreiben, paketOeffnen, paketEinspielen,
        geoeffnetesPaketEinspielen, paketPasswortWechseln, sperreWechseln };
})();
window.Krypto = Krypto;
