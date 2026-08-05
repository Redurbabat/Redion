"use strict";
/* ============================================================================
 * meeting.js — Meeting Notes
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/bereiche/verbinden/besprechung.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/bereiche/verbinden/besprechung.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
 * Der Ablauf aus der Doku, Schritt für Schritt:
 *
 *     Audio  →  Transkript  →  KI-Zusammenfassung  →  Aufgaben und
 *     Entscheidungen  →  Notion-Seite
 *
 * WIE DAS OHNE DIENST GEHT
 *   Der Browser kann selbst zuhören. Chrome und Edge bringen eine
 *   Spracherkennung mit (SpeechRecognition), die live mitschreibt —
 *   kostenlos, ohne Schlüssel, ohne Konto. Parallel läuft eine Aufnahme
 *   mit dem MediaRecorder, damit man später nachhören kann.
 *
 *   Firefox und Safari haben die Spracherkennung nicht. Dort wird nur
 *   aufgenommen, und das Transkript tippt man selbst — oder man lädt es
 *   als Textdatei dazu. Das steht auch so in der Oberfläche; es wird
 *   nichts vorgetäuscht.
 *
 * WAS WO BLEIBT
 *   Die Aufnahme liegt im Browser. In den Einstellungen steht, ob sie
 *   überhaupt behalten wird und ob das Transkript nach der Zusammenfassung
 *   gelöscht werden soll.
 * ==========================================================================*/
const Meeting = (() => {
    /* Das angeklickte Element — oder nichts. `e.target` ist `EventTarget | null`
       und muss ein `Element` sein, bevor `closest` daran etwas findet. Vorher
       stand hier ungeprüft `e.target.closest(…)`: bei einem Klick, dessen Ziel
       kein Element ist, warf das mitten im Behandeln. */
    const elVon = (e) => e.target instanceof Element ? e.target : null;
    const esc = (s) => String(s ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const p2 = (n) => String(n).padStart(2, '0');
    /* ------------------------------------------------------------------------
     * EINSTELLUNGEN
     * ----------------------------------------------------------------------*/
    const E = {
        audioBehalten: () => Store.getMeta('meet:audio', true),
        transkriptLoeschen: () => Store.getMeta('meet:transkriptWeg', false),
        sprache: () => Store.getMeta('meet:sprache', 'de-DE')
    };
    const erkennungsBau = () => window.SpeechRecognition ||
        window.webkitSpeechRecognition;
    const kannZuhoeren = () => !!erkennungsBau();
    const kannAufnehmen = () => !!(navigator.mediaDevices && window.MediaRecorder);
    /* ------------------------------------------------------------------------
     * DIE AUFNAHME
     * ----------------------------------------------------------------------*/
    let laeuft = null;
    const starten = async (beiText, beiZeit) => {
        if (laeuft)
            throw new Error('Es läuft schon eine Aufnahme.');
        const zustand = {
            start: Date.now(), stuecke: [], transkript: [], teil: '',
            recorder: null, erkennung: null, strom: null, uhr: null
        };
        /* 1. Mitschnitt */
        if (kannAufnehmen()) {
            try {
                zustand.strom = await navigator.mediaDevices.getUserMedia({ audio: true });
                zustand.recorder = new MediaRecorder(zustand.strom);
                zustand.recorder.ondataavailable = (e) => {
                    if (e.data && e.data.size)
                        zustand.stuecke.push(e.data);
                };
                zustand.recorder.start(1000);
            }
            catch (e) {
                throw new Error('Das Mikrofon wurde nicht freigegeben: ' +
                    (e instanceof Error ? e.message : String(e)));
            }
        }
        /* 2. Mitschreiben */
        if (kannZuhoeren()) {
            const SR = erkennungsBau();
            if (!SR)
                return;
            const r = new SR();
            r.lang = E.sprache();
            r.continuous = true;
            r.interimResults = true;
            r.onresult = (e) => {
                let teil = '';
                for (let i = e.resultIndex; i < e.results.length; i++) {
                    const t = e.results[i][0].transcript;
                    if (e.results[i].isFinal) {
                        const sek = Math.round((Date.now() - zustand.start) / 1000);
                        zustand.transkript.push({ sek, text: t.trim() });
                    }
                    else
                        teil += t;
                }
                zustand.teil = teil;
                if (beiText)
                    beiText(zustand.transkript, teil);
            };
            /* Die Erkennung hört von selbst auf — dann eben wieder anfangen. */
            r.onend = () => { if (laeuft === zustand) {
                try {
                    r.start();
                }
                catch { }
            } };
            r.onerror = (e) => {
                if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
                    UI.banner('Die Spracherkennung wurde nicht erlaubt. Es wird nur aufgenommen.', 'warn');
                }
            };
            try {
                r.start();
                zustand.erkennung = r;
            }
            catch { }
        }
        zustand.uhr = setInterval(() => {
            if (beiZeit)
                beiZeit(Math.round((Date.now() - zustand.start) / 1000));
        }, 1000);
        laeuft = zustand;
        return zustand;
    };
    const stoppen = () => new Promise((ok) => {
        const z = laeuft;
        if (!z) {
            ok(null);
            return;
        }
        laeuft = null;
        clearInterval(z.uhr);
        if (z.erkennung) {
            try {
                z.erkennung.stop();
            }
            catch { }
        }
        const fertig = () => {
            if (z.strom)
                z.strom.getTracks().forEach((t) => t.stop());
            const blob = z.stuecke.length ? new Blob(z.stuecke, { type: 'audio/webm' }) : null;
            ok({ transkript: z.transkript, dauer: Math.round((Date.now() - z.start) / 1000), blob });
        };
        if (z.recorder && z.recorder.state !== 'inactive') {
            z.recorder.onstop = fertig;
            try {
                z.recorder.stop();
            }
            catch {
                fertig();
            }
        }
        else
            fertig();
    });
    const zeitText = (sek) => p2(Math.floor(sek / 60)) + ':' + p2(sek % 60);
    const transkriptText = (liste) => (liste || []).map((z) => '[' + zeitText(z.sek) + '] ' + z.text).join('\n');
    /* ------------------------------------------------------------------------
     * AUSWERTEN
     * ------------------------------------------------------------------------
     * Ein Durchgang, drei Ergebnisse: Zusammenfassung, Entscheidungen,
     * Aufgaben. Alles auf einmal, damit das lokale Modell nicht dreimal
     * denselben Text lesen muss.
     * ----------------------------------------------------------------------*/
    const auswerten = async (text, beiFortschritt) => {
        if (!String(text || '').trim())
            throw new Error('Es gibt keinen Text zum Auswerten.');
        const anweisung = 'Du wertest ein Besprechungsprotokoll aus. Antworte AUSSCHLIESSLICH mit JSON, ' +
            'ohne Text davor oder danach, in genau dieser Form:\n' +
            '{"titel":"kurzer Titel der Besprechung",' +
            '"zusammenfassung":["Punkt 1","Punkt 2"],' +
            '"entscheidungen":["Was beschlossen wurde"],' +
            '"aufgaben":[{"was":"Aufgabe","wer":"Name oder leer","bis":"JJJJ-MM-TT oder leer"}],' +
            '"themen":["Thema"],"beteiligte":["Name"]}\n' +
            'Höchstens sechs Punkte je Liste. Alles auf Deutsch. ' +
            'Erfinde nichts — was nicht im Text steht, lässt du weg.';
        if (beiFortschritt)
            beiFortschritt('Die KI liest mit …');
        const roh = await KI.frageKurz('Das Protokoll:\n\n' + String(text).slice(0, 12000), anweisung);
        const plan = Agent.JSON_HOLEN(roh);
        if (!plan)
            throw new Error('Die KI hat kein brauchbares Ergebnis geliefert.');
        return plan;
    };
    /* ------------------------------------------------------------------------
     * DIE SEITE
     * ----------------------------------------------------------------------*/
    const seiteAnlegen = (ergebnis, transkript, dauer, audioUrl) => {
        const jetzt = new Date();
        const p = Store.addPage(App.aktuelleSeite(), {
            text: (ergebnis.titel || 'Besprechung') + ' · ' + jetzt.toLocaleDateString('de-DE'),
            icon: '🎙', besprechung: true
        });
        Store.addBlock(p.id, 'callout', {
            text: jetzt.toLocaleString('de-DE') + ' · Dauer ' + zeitText(dauer || 0) +
                ((ergebnis.beteiligte || []).length ? ' · ' + ergebnis.beteiligte.join(', ') : ''),
            icon: '🎙', color: 'bg-blue'
        });
        if ((ergebnis.zusammenfassung || []).length) {
            Store.addBlock(p.id, 'h2', { text: 'Zusammenfassung' });
            ergebnis.zusammenfassung.forEach((x) => Store.addBlock(p.id, 'bullet', { text: String(x) }));
        }
        if ((ergebnis.entscheidungen || []).length) {
            Store.addBlock(p.id, 'h2', { text: 'Entscheidungen' });
            ergebnis.entscheidungen.forEach((x) => Store.addBlock(p.id, 'quote', { text: String(x) }));
        }
        if ((ergebnis.aufgaben || []).length) {
            Store.addBlock(p.id, 'h2', { text: 'Aufgaben' });
            ergebnis.aufgaben.forEach((a) => Store.addBlock(p.id, 'todo', {
                text: String(a.was || a) + (a.wer ? ' — ' + a.wer : '') + (a.bis ? ' (bis ' + a.bis + ')' : '')
            }));
        }
        if ((ergebnis.themen || []).length) {
            Store.addBlock(p.id, 'h2', { text: 'Themen' });
            Store.addBlock(p.id, 'text', { text: ergebnis.themen.map((t) => '#' + String(t).replace(/\s+/g, '-')).join(' ') });
        }
        if (audioUrl && E.audioBehalten()) {
            Store.addBlock(p.id, 'h2', { text: 'Aufnahme' });
            Store.addBlock(p.id, 'audio', { src: audioUrl, caption: 'Mitschnitt · ' + zeitText(dauer || 0) });
        }
        if (transkript && !E.transkriptLoeschen()) {
            const t = Store.addBlock(p.id, 'toggle', { text: 'Volles Transkript', open: false });
            String(transkript).split('\n').slice(0, 400).forEach(z => {
                if (z.trim())
                    Store.addBlock(t.id, 'text', { text: z });
            });
        }
        /* Aufgaben zusätzlich in eine Datenbank, damit sie nicht nur auf dieser
           Seite stehen — genau das macht Notion auch. */
        if ((ergebnis.aufgaben || []).length) {
            const db = aufgabenDatenbank();
            ergebnis.aufgaben.forEach((a) => {
                const r = Store.addRow(db.id, {
                    wer: a.wer || '', bis: a.bis || '', status: 'Offen',
                    quelle: ergebnis.titel || 'Besprechung', seite: p.id
                });
                Store.updateBlock(r.id, { text: String(a.was || a) });
            });
        }
        App.zeichneBaum();
        return p;
    };
    const aufgabenDatenbank = () => {
        const da = Object.values(Store.cache.collections)
            .find(c => c.name === 'Aufgaben aus Besprechungen');
        if (da)
            return da;
        let eltern = Store.rootPages().find((p) => p.text === 'Besprechungen');
        if (!eltern)
            eltern = Store.addPage(null, { text: 'Besprechungen', icon: '🎙' });
        const { collectionId } = Store.addDatabase(eltern.id, 'Aufgaben aus Besprechungen', {
            title: { name: 'Aufgabe', type: 'title' },
            wer: { name: 'Wer', type: 'person' },
            bis: { name: 'Bis', type: 'date' },
            status: { name: 'Status', type: 'status', options: [
                    { name: 'Offen', color: 'blue' },
                    { name: 'In Arbeit', color: 'yellow' },
                    { name: 'Erledigt', color: 'green' }
                ] },
            quelle: { name: 'Aus welcher Besprechung', type: 'text' },
            seite: { name: 'Seite', type: 'text' }
        }, 'board');
        return Store.getCollection(collectionId);
    };
    /* ------------------------------------------------------------------------
     * OBERFLÄCHE
     * ----------------------------------------------------------------------*/
    const panel = () => {
        const o = document.createElement('div');
        o.className = 'overlay';
        o.innerHTML = '<div class="finder" style="width:min(720px,95vw)">' +
            '<div class="fh">🎙 Besprechungsnotizen<button class="icon-btn" data-a="zu">✕</button></div>' +
            '<div id="mk" style="padding:14px 18px 6px"></div>' +
            '<div class="meet-text" id="mt"></div>' +
            '<div class="fbtns" id="mf"></div></div>';
        document.body.appendChild(o);
        let phase = 'bereit'; /* bereit · laeuft · fertig · ausgewertet */
        let ergebnisAudio = null;
        let ergebnisText = '';
        let ergebnisDauer = 0;
        let auswertung = null;
        const kopf = () => {
            const k = o.querySelector('#mk');
            if (!k)
                return;
            if (phase === 'bereit') {
                k.innerHTML =
                    '<div class="verb-text">Der Browser hört zu und schreibt live mit. ' +
                        'Danach macht die KI daraus Zusammenfassung, Entscheidungen und Aufgaben.</div>' +
                        (kannZuhoeren()
                            ? '<div class="meet-ok">✓ Diese Browserversion kann live mitschreiben.</div>'
                            : '<div class="meet-warn">Dieser Browser kann nicht live mitschreiben. ' +
                                'Chrome und Edge können es. Es wird trotzdem aufgenommen — das Transkript ' +
                                'kannst du danach einfügen oder als Textdatei laden.</div>') +
                        (kannAufnehmen() ? '' : '<div class="meet-warn">Aufnehmen geht hier auch nicht. ' +
                            'Du kannst trotzdem ein vorhandenes Transkript einfügen und auswerten lassen.</div>');
            }
            if (phase === 'laeuft') {
                k.innerHTML = '<div class="meet-laeuft"><span class="meet-punkt"></span>' +
                    '<b id="muhr">00:00</b><span>läuft — sprich einfach weiter</span></div>';
            }
            if (phase === 'fertig') {
                k.innerHTML = '<div class="verb-text">Aufnahme beendet nach ' + zeitText(ergebnisDauer) +
                    '. Der Text unten lässt sich noch bearbeiten, bevor die KI ihn liest.</div>';
            }
            if (phase === 'ausgewertet') {
                k.innerHTML = '<div class="meet-ok">✓ Ausgewertet: ' +
                    (auswertung.zusammenfassung || []).length + ' Punkte, ' +
                    (auswertung.entscheidungen || []).length + ' Entscheidungen, ' +
                    (auswertung.aufgaben || []).length + ' Aufgaben.</div>';
            }
        };
        const fuss = () => {
            const f = o.querySelector('#mf');
            if (!f)
                return;
            if (phase === 'bereit')
                f.innerHTML = '<button data-a="los" class="prim">● Aufnahme starten</button>' +
                    '<button data-a="datei">Transkript laden</button>' +
                    '<button data-a="tippen">Text einfügen</button>' +
                    '<button data-a="einst">Einstellungen</button>' +
                    '<button data-a="zu">Schliessen</button>';
            if (phase === 'laeuft')
                f.innerHTML = '<button data-a="stopp" class="prim">■ Beenden</button>';
            if (phase === 'fertig')
                f.innerHTML = '<button data-a="werten" class="prim">✨ Auswerten lassen</button>' +
                    '<button data-a="nurseite">Nur als Seite ablegen</button>' +
                    '<button data-a="zu">Verwerfen</button>';
            if (phase === 'ausgewertet')
                f.innerHTML = '<button data-a="seite" class="prim">Seite anlegen</button>' +
                    '<button data-a="zu">Schliessen</button>';
        };
        const textFeld = (wert, lesbar) => {
            const feld = o.querySelector('#mt');
            if (!feld)
                return;
            feld.innerHTML = lesbar
                ? `<div class="meet-vorschau">${esc(wert).replace(/\n/g, '<br>')}</div>`
                : `<textarea id="mtx" rows="10" placeholder="Hier steht das Transkript.">${esc(wert)}</textarea>`;
        };
        kopf();
        fuss();
        textFeld('', false);
        o.addEventListener('click', async (e) => {
            if (e.target === o || elVon(e)?.closest('[data-a="zu"]')) {
                if (laeuft)
                    await stoppen();
                o.remove();
                return;
            }
            const b = elVon(e)?.closest('button[data-a]');
            if (!b)
                return;
            const a = b.dataset.a;
            try {
                if (a === 'einst') {
                    einstellungenDialog();
                    return;
                }
                if (a === 'tippen') {
                    phase = 'fertig';
                    ergebnisDauer = 0;
                    kopf();
                    fuss();
                    textFeld('', false);
                    o.querySelector('#mtx')?.focus();
                    return;
                }
                if (a === 'datei') {
                    const inp = document.createElement('input');
                    inp.type = 'file';
                    inp.accept = '.txt,.md,.vtt,.srt,text/plain';
                    inp.addEventListener('change', async () => {
                        const f = inp.files?.[0];
                        if (!f)
                            return;
                        let t = await f.text();
                        /* Untertitelformate von den Zeitmarken befreien */
                        t = t.replace(/^WEBVTT.*$/gm, '')
                            .replace(/^\d+$/gm, '')
                            .replace(/^[\d:.,]+\s*-->.*$/gm, '')
                            .replace(/\n{3,}/g, '\n\n').trim();
                        ergebnisText = t;
                        ergebnisDauer = 0;
                        phase = 'fertig';
                        kopf();
                        fuss();
                        textFeld(t, false);
                    });
                    inp.click();
                    return;
                }
                if (a === 'los') {
                    await starten((liste, teil) => {
                        const el = o.querySelector('#mtx');
                        const t = transkriptText(liste) + (teil ? '\n[…] ' + teil : '');
                        if (el) {
                            el.value = t;
                            el.scrollTop = el.scrollHeight;
                        }
                    }, (sek) => { const u = o.querySelector('#muhr'); if (u)
                        u.textContent = zeitText(sek); });
                    phase = 'laeuft';
                    kopf();
                    fuss();
                    textFeld('', false);
                    return;
                }
                if (a === 'stopp') {
                    const r = await stoppen();
                    if (!r)
                        return;
                    ergebnisDauer = r.dauer;
                    ergebnisText = transkriptText(r.transkript) ||
                        (o.querySelector('#mtx')?.value || '');
                    const mitschnitt = r.blob;
                    if (mitschnitt && E.audioBehalten()) {
                        ergebnisAudio = await new Promise(ok => {
                            const fr = new FileReader();
                            fr.onload = () => ok(fr.result);
                            fr.readAsDataURL(mitschnitt);
                        });
                        /* Sehr lange Aufnahmen sprengen den Speicher — dann lieber ohne */
                        if (ergebnisAudio.length > 9000000) {
                            ergebnisAudio = null;
                            UI.toast('Die Aufnahme war zu lang zum Behalten — Text bleibt.');
                        }
                    }
                    phase = 'fertig';
                    kopf();
                    fuss();
                    textFeld(ergebnisText, false);
                    return;
                }
                if (a === 'werten') {
                    ergebnisText = o.querySelector('#mtx')?.value || ergebnisText;
                    b.disabled = true;
                    const mt = o.querySelector('#mt');
                    if (mt)
                        mt.innerHTML = '<div class="agent-laeuft">Die KI liest mit …</div>';
                    auswertung = await auswerten(ergebnisText, null);
                    phase = 'ausgewertet';
                    kopf();
                    fuss();
                    if (mt)
                        mt.innerHTML =
                            '<div class="meet-vorschau">' +
                                '<b>' + esc(auswertung.titel || 'Besprechung') + '</b><br><br>' +
                                (auswertung.zusammenfassung || []).map((x) => '• ' + esc(x)).join('<br>') +
                                ((auswertung.entscheidungen || []).length
                                    ? '<br><br><b>Entscheidungen</b><br>' +
                                        auswertung.entscheidungen.map((x) => '„' + esc(x) + '"').join('<br>') : '') +
                                ((auswertung.aufgaben || []).length
                                    ? '<br><br><b>Aufgaben</b><br>' +
                                        auswertung.aufgaben.map((x) => '☐ ' + esc(x.was || x) +
                                            (x.wer ? ' — ' + esc(x.wer) : '')).join('<br>') : '') +
                                '</div>';
                    return;
                }
                if (a === 'nurseite') {
                    ergebnisText = o.querySelector('#mtx')?.value || ergebnisText;
                    const p = seiteAnlegen({ titel: 'Besprechung', zusammenfassung: [], aufgaben: [] }, ergebnisText, ergebnisDauer, ergebnisAudio);
                    o.remove();
                    App.oeffne(p.id);
                    UI.toast('Als Seite abgelegt');
                    return;
                }
                if (a === 'seite') {
                    const p = seiteAnlegen(auswertung, ergebnisText, ergebnisDauer, ergebnisAudio);
                    o.remove();
                    App.oeffne(p.id);
                    UI.toast('Besprechungsnotiz angelegt');
                    return;
                }
            }
            catch (err) {
                UI.banner('Besprechung: ' + (err instanceof Error ? err.message : String(err)), 'warn');
                b.disabled = false;
            }
        });
    };
    const einstellungenDialog = () => {
        const o = document.createElement('div');
        o.className = 'overlay';
        o.innerHTML = '<div class="finder" style="width:min(520px,94vw)">' +
            '<div class="fh">🎙 Einstellungen für Besprechungen<button class="icon-btn" data-a="zu">✕</button></div>' +
            '<div style="padding:16px 18px; display:flex; flex-direction:column; gap:14px">' +
            '<label style="display:flex;gap:10px;align-items:center;font-size:14px">' +
            `<input type="checkbox" id="ma"${E.audioBehalten() ? ' checked' : ''}> ` +
            'Aufnahme behalten<br></label>' +
            '<div class="verb-text" style="margin:-8px 0 0">Die Tondatei liegt dann in der Seite. ' +
            'Ausgeschaltet wird nur der Text behalten — das spart viel Platz.</div>' +
            '<label style="display:flex;gap:10px;align-items:center;font-size:14px">' +
            `<input type="checkbox" id="mtw"${E.transkriptLoeschen() ? ' checked' : ''}> ` +
            'Transkript nach der Auswertung löschen</label>' +
            '<div class="verb-text" style="margin:-8px 0 0">Dann bleibt nur die Zusammenfassung — ' +
            'gut, wenn das Wortprotokoll niemanden etwas angeht.</div>' +
            '<label>Sprache der Erkennung<br><select id="ms">' +
            ['de-DE', 'de-CH', 'de-AT', 'en-US', 'en-GB', 'tr-TR', 'fr-FR', 'it-IT', 'es-ES']
                .map(s => `<option${E.sprache() === s ? ' selected' : ''}>${s}</option>`).join('') +
            '</select></label>' +
            '</div>' +
            '<div class="fbtns"><button data-a="zu" class="prim">Fertig</button></div></div>';
        document.body.appendChild(o);
        o.addEventListener('change', () => {
            const ma = o.querySelector('#ma');
            const mtw = o.querySelector('#mtw');
            const ms = o.querySelector('#ms');
            if (ma)
                Store.setMeta('meet:audio', ma.checked);
            if (mtw)
                Store.setMeta('meet:transkriptWeg', mtw.checked);
            if (ms)
                Store.setMeta('meet:sprache', ms.value);
        });
        o.addEventListener('click', e => {
            if (e.target === o || elVon(e)?.closest('[data-a="zu"]'))
                o.remove();
        });
    };
    /**
     * Der Besprechungs-Reiter der Seitenleiste. Notion zeigt oben, was ansteht,
     * darunter die heutigen Notizen — mit einem Weg zum Kalender, wenn keiner
     * verbunden ist.
     */
    const seitenleiste = (baum) => {
        const abschnitt = (name) => {
            const d = document.createElement('div');
            d.className = 'side-section';
            d.innerHTML = `<span>${name}</span>`;
            return d;
        };
        baum.appendChild(abschnitt('Bevorstehend'));
        const kommend = App.kommendeTermine(5);
        const oben = document.createElement('div');
        oben.className = 'wz-block';
        if (kommend.length) {
            oben.innerHTML = kommend.map((t) => `<button class="side-item" data-t="${t.id}"><span>📌</span>` +
                `<span>${esc(t.text)}</span><span class="k">${esc(t.wann)}</span></button>`).join('');
        }
        else {
            oben.innerHTML =
                '<button class="side-item" data-a="kal"><span>📅</span>' +
                    '<span>Verbinde deinen Kalender</span></button>' +
                    '<div class="side-leer">Dann stehen hier alle Termine und du kannst ' +
                    'für jeden eine Notiz anlegen.</div>';
        }
        oben.addEventListener('click', e => {
            const t = elVon(e)?.closest('[data-t]');
            if (t) {
                App.oeffne(t.dataset.t);
                return;
            }
            if (elVon(e)?.closest('[data-a="kal"]'))
                Kalender.dialog();
        });
        baum.appendChild(oben);
        baum.appendChild(abschnitt('Heute'));
        const unten = document.createElement('div');
        unten.className = 'wz-block';
        /* Alle Seiten, die aus einer Besprechung entstanden sind */
        const notizen = Object.values(Store.cache.blocks)
            .filter(b => b.type === 'page' && b.alive !== false && b.besprechung)
            .sort((a, b) => String(b.created).localeCompare(String(a.created)))
            .slice(0, 8);
        /* IST HIER GAR NICHTS, steht der leere Zustand statt der Liste — mit
           der einen Handlung, die es an dieser Stelle gibt. Eine graue Zeile
           unter einem „＋"-Knopf sagt weniger als beides zusammen. */
        unten.innerHTML = notizen.length
            ? '<button class="side-item" data-a="neu"><span>＋</span><span>Neue Meeting-Notiz</span></button>' +
                notizen.map(p => `<button class="side-item" data-p="${p.id}"><span>${p.icon || '🎙'}</span>` +
                    `<span>${esc(p.text || 'Ohne Titel')}</span></button>`).join('')
            : Hinweis.leer({
                zeichen: '🎙',
                gross: 'Noch keine Besprechung',
                klein: 'Rede mit, statt mitzuschreiben — Redion hört zu und legt ' +
                    'daraus eine Notiz an. Die Aufnahme bleibt auf diesem Gerät.',
                handlung: 'Neue Meeting-Notiz',
                daten: 'data-a="neu"'
            });
        unten.addEventListener('click', e => {
            if (elVon(e)?.closest('[data-a="neu"]')) {
                panel();
                return;
            }
            const p = elVon(e)?.closest('[data-p]');
            if (p)
                App.oeffne(p.dataset.p);
        });
        baum.appendChild(unten);
    };
    return { starten, stoppen, auswerten, seiteAnlegen, aufgabenDatenbank,
        transkriptText, zeitText, kannZuhoeren, kannAufnehmen,
        panel, einstellungenDialog, seitenleiste, E };
})();
window.Meeting = Meeting;
