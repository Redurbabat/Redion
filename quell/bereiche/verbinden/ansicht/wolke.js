"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/bereiche/verbinden/ansicht/wolke.ts (npm run bauen:ts). */
const WolkeFenster = (() => {
    const elVon = (e) => e.target instanceof Element ? e.target : null;
    const esc = (s) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] ?? c));
    const dialog = () => {
        const o = document.createElement('div');
        o.className = 'overlay';
        o.innerHTML = '<div class="finder wolke-blatt" style="width:min(640px,95vw)">' +
            '<div class="fh">☁ Wolke<button class="icon-btn" data-a="zu">✕</button></div>' +
            '<div class="res" id="wo-inhalt" style="padding:18px"></div></div>';
        document.body.appendChild(o);
        const zeichne = async () => {
            const ziel = o.querySelector('#wo-inhalt');
            if (!ziel)
                return;
            ziel.innerHTML = Wolke.angemeldet() ? angemeldetHtml() : abgemeldetHtml();
            if (Wolke.angemeldet())
                await zahlenNachtragen(ziel);
        };
        o.addEventListener('change', (e) => {
            const feld = e.target;
            if (!feld || feld.id !== 'wo-takt')
                return;
            const ms = Wolke.taktSetzen(feld.value);
            UI.toast(ms < 0 ? 'Diesen Takt gibt es nicht — es bleibt beim bisherigen.'
                : ms ? 'Abgleich jetzt alle ' + Math.round(ms / 60000) + ' Minuten.'
                    : 'Abgleich nur noch beim Öffnen und von Hand.');
        });
        o.addEventListener('click', async (e) => {
            if (e.target === o || elVon(e)?.closest('[data-a="zu"]')) {
                o.remove();
                return;
            }
            const a = elVon(e)?.closest('[data-a]');
            if (!a)
                return;
            const was = a.dataset.a;
            try {
                if (was === 'github' || was === 'google') {
                    a.disabled = true;
                    a.textContent = 'Fenster geöffnet …';
                    await Wolke.anmeldenMit(was);
                    await schluesselFragen();
                    await abgleichFragen();
                    await zeichne();
                }
                if (was === 'code') {
                    o.remove();
                    codeFenster();
                }
                if (was === 'freigeben') {
                    o.remove();
                    freigebenFenster();
                }
                if (was === 'abmelden') {
                    if (!confirm('Abmelden? Deine Notizen bleiben auf diesem Gerät — ' +
                        'nur der Abgleich hört auf.'))
                        return;
                    await Wolke.abmelden();
                    await zeichne();
                }
                if (was === 'abgleich-an') {
                    await abgleichFragen();
                    await zeichne();
                }
                if (was === 'neu-lokal') {
                    await Wolke.neuAbgleichAntwort('lokal');
                    UI.toast('Nur lokal: der eingespielte Bestand bleibt auf diesem Gerät. ' +
                        'Den Abgleich kannst du hier jederzeit wieder einschalten.');
                    await zeichne();
                }
                if (was === 'neu-wolke') {
                    a.disabled = true;
                    a.textContent = 'Gleicht ab …';
                    UI.toast('Vollständiger Abgleich läuft — das kann dauern.');
                    try {
                        await Wolke.neuAbgleichAntwort('wolke');
                    }
                    catch { }
                    await zeichne();
                }
                if (was === 'nurlokal') {
                    Wolke.abgleichSetzen(false);
                    UI.toast('Nur lokal: nichts verlässt dieses Gerät, bis du den Abgleich wieder einschaltest.');
                    await zeichne();
                }
                if (was === 'jetzt') {
                    if (Wolke.neuAbgleichOffen()) {
                        UI.toast('Erst oben entscheiden, wie es nach dem Einspielen weitergehen soll.');
                        return;
                    }
                    if (!Wolke.abgleichErlaubt()) {
                        UI.toast('Der Abgleich ist für dieses Gerät ausgeschaltet — erst einschalten.');
                        return;
                    }
                    a.disabled = true;
                    if (typeof Lader !== 'undefined') {
                        a.textContent = '';
                        a.append(Lader.bauen({ art: 'wort', wort: 'Abgleich',
                            text: 'Abgleich läuft …' }).element);
                    }
                    else
                        a.textContent = 'Läuft …';
                    const r = await Wolke.abgleichen();
                    UI.toast(r ? (r.uebernommen + ' geholt, ' + r.angenommen + ' geschickt' +
                        (r.unlesbar ? ' · ' + r.unlesbar + ' nicht lesbar' : '')) : 'Nichts zu tun');
                    await zeichne();
                }
                if (was === 'sichern') {
                    await App.sicherungSpeichern();
                }
                if (was === 'loeschen') {
                    o.remove();
                    loeschenFenster();
                }
                if (was === 'schluessel') {
                    await schluesselFragen();
                    await zeichne();
                }
                if (was === 'geraete') {
                    o.remove();
                    geraeteFenster();
                }
                if (was === 'marken') {
                    o.remove();
                    markenFenster();
                }
                if (was === 'adresse') {
                    const neu = await UI.frage('Adresse des Servers', Wolke.adresse() || 'https://…');
                    if (neu !== null) {
                        const eingabe = neu.trim();
                        const sicher = eingabe ? Wolke.serverAdressePruefen(eingabe) : '';
                        if (eingabe && !sicher)
                            throw new Error('Nur HTTPS-Serveradressen ohne Pfad oder Zugangsdaten sind erlaubt.');
                        const ziel = sicher || (location.protocol === 'https:' || location.protocol === 'http:'
                            ? location.origin : '');
                        if (Wolke.angemeldet() && Wolke.adresse() !== ziel)
                            throw new Error('Bitte zuerst von der Wolke abmelden, bevor du den Server wechselst.');
                        Store.setMeta('wolkeAdresse', sicher);
                        await zeichne();
                    }
                }
                if (was === 'pruefen') {
                    a.disabled = true;
                    a.textContent = 'Sehe nach …';
                    await pruefenUndZeigen(o.querySelector('#wo-pruef'));
                    a.disabled = false;
                    a.textContent = 'Server prüfen';
                }
            }
            catch (err) {
                UI.toast(err instanceof Error ? err.message : String(err));
                await zeichne();
            }
        });
        zeichne();
    };
    const kasten = (art, inhalt) => '<div style="padding:11px 12px; border-radius:8px; font-size:12.5px; ' +
        'line-height:1.6; border:1px solid ' +
        (art === 'gut' ? 'var(--line)' : art === 'fehlt' ? 'var(--warnung)' : 'var(--gefahr)') +
        '">' + inhalt + '</div>';
    const befehl = (text) => '<code style="display:block; margin:4px 0; padding:5px 8px; ' +
        'background:var(--bg-hover); border-radius:5px; font-size:11.5px; ' +
        'overflow-x:auto; white-space:pre">' + esc(text) + '</code>';
    const serverPruefen = async (ziel) => {
        if (!ziel)
            return;
        if (!Wolke.adresse()) {
            ziel.innerHTML = kasten('weg', '<b>Kein sicherer Sync-Server verbunden.</b> Die lokale App bleibt offline nutzbar. ' +
                'Unter „Server: ändern“ eine HTTPS-Adresse eintragen.');
            return;
        }
        let stand = null;
        try {
            stand = await Wolke.ruf('/api/stand');
        }
        catch (err) {
            ziel.innerHTML = kasten('weg', '<b>Nicht erreichbar.</b> ' +
                esc(err instanceof Error ? err.message : String(err)));
            return;
        }
        const ablage = String(stand?.ablage || 'keine');
        const dateien = String(stand?.dateien || 'keine');
        if (ablage === 'keine') {
            ziel.innerHTML = kasten('fehlt', '<b>Der Worker läuft, die Datenbank fehlt.</b> Ohne sie gleicht nichts ab. ' +
                'Das dauert zwei Minuten:' +
                befehl('npx wrangler d1 create redion') +
                'Die Ausgabe zeigt eine <code>database_id</code> — die in ' +
                '<code>wrangler.toml</code> eintragen und die Rauten wegnehmen.' +
                befehl('npx wrangler d1 execute redion --remote --file=server/schema.sql') +
                befehl('npx wrangler deploy') +
                'Ganz steht es in <b>SERVER-EINRICHTEN.md</b>.');
            return;
        }
        if (dateien === 'keine') {
            ziel.innerHTML = kasten('fehlt', '<b>Datenbank steht (' + esc(ablage) + '), der Dateispeicher fehlt.</b> ' +
                'Seiten und Datenbanken gleichen ab — Anhänge wie PDFs und Bilder nicht.' +
                befehl('npx wrangler r2 bucket create redion-dateien') +
                'Danach in <code>wrangler.toml</code> die drei Zeilen unter ' +
                '<code>[[r2_buckets]]</code> einkommentieren und neu veröffentlichen.');
            return;
        }
        ziel.innerHTML = kasten('gut', '<b>Alles bereit.</b> Datenbank: <code>' + esc(ablage) + '</code>, ' +
            'Dateispeicher: <code>' + esc(dateien) + '</code>. ' +
            'Sätze und Anhänge können abgleichen.');
    };
    const pruefenUndZeigen = async (ziel) => {
        await serverPruefen(ziel);
        if (ziel && ziel.scrollIntoView)
            ziel.scrollIntoView({ block: 'end', behavior: 'smooth' });
    };
    const abgemeldetHtml = () => {
        const wurzel = Wolke.adresse();
        return ('<div style="font-size:13px; color:var(--text-dim); line-height:1.65; margin-bottom:18px">' +
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
                    'font-size:13px; line-height:1.6"><b>Offline, kein Sync-Server verbunden.</b> ' +
                    'Deine Notizen bleiben lokal erhalten. Für iPhone und Windows zuerst ' +
                    'eine sichere HTTPS-Serveradresse unter „Server: ändern“ eintragen.</div>') +
            '<hr style="border:none;border-top:1px solid var(--line); margin:18px 0">' +
            '<div style="font-size:12px; color:var(--text-faint); line-height:1.6">' +
            'Server: <code>' + esc(wurzel || 'keiner') + '</code> ' +
            '<button data-a="adresse" class="klein">ändern</button> ' +
            '<button data-a="pruefen" class="klein">Server prüfen</button>' +
            '<div id="wo-pruef" style="margin-top:9px"></div>' +
            '<br>Private Seiten werden auf diesem Gerät verschlüsselt und verlassen es ' +
            'nur so. Der Schlüssel wird nie mitgeschickt — der Server sieht bei ihnen nichts ' +
            'als Buchstabensalat.' +
            '</div>');
    };
    const angemeldetHtml = () => {
        const z = Wolke.zustand;
        const k = z.konto || {};
        const an = Wolke.abgleichErlaubt();
        const frage = Wolke.neuAbgleichOffen();
        return ('<div style="display:flex; gap:13px; align-items:center; margin-bottom:16px">' +
            (k.bild ? `<img src="${esc(k.bild)}" style="width:42px;height:42px;border-radius:50%">`
                : '<div style="width:42px;height:42px;border-radius:50%;background:var(--bg-hover);' +
                    'display:grid;place-items:center;font-size:19px">👤</div>') +
            '<div style="flex:1"><b style="font-size:15px">' + esc(k.name || 'Angemeldet') + '</b>' +
            '<div style="font-size:12px;color:var(--text-faint)">' + esc(k.mail || '') + '</div></div>' +
            '<button data-a="abmelden" style="font-size:12.5px">Abmelden</button>' +
            '</div>' +
            (frage
                ? '<div id="wo-frage" style="padding:13px; border:1px solid var(--warnung); ' +
                    'border-radius:8px; font-size:12.5px; line-height:1.6; margin-bottom:16px">' +
                    '<div style="display:flex; gap:10px; align-items:flex-start">' +
                    '<span style="font-size:17px">⏸</span><div style="flex:1; min-width:0">' +
                    '<b>Der Abgleich wartet auf dich.</b> Du hast eine Sicherung ' +
                    'eingespielt und den Bestand ersetzt. Auf dem Server liegt noch der ' +
                    'Stand von vorher. Es geht gerade nichts hinaus und nichts herein — ' +
                    'Redion entscheidet das nicht von selbst, weil beide Wege Arbeit ' +
                    'kosten können.</div></div>' +
                    '<div style="display:flex; gap:9px; flex-wrap:wrap; margin-top:11px">' +
                    '<button data-a="neu-lokal" class="wo-wahl">' +
                    '<span><b>Nur lokal verwenden</b><br>' +
                    '<span style="color:var(--text-faint)">Der eingespielte Bestand bleibt ' +
                    'auf diesem Gerät. Die Wolke behält, was sie hat.</span></span></button>' +
                    '<button data-a="neu-wolke" class="wo-wahl">' +
                    '<span><b>Vollständig neu abgleichen</b><br>' +
                    '<span style="color:var(--text-faint)">Beide Seiten werden ' +
                    'zusammengeführt. Was sich widerspricht, wird dir gezeigt.</span></span>' +
                    '</button></div></div>'
                : an
                    ? '<div style="padding:12px; border:1px solid var(--line); border-radius:8px; ' +
                        'font-size:12.5px; line-height:1.6; margin-bottom:16px; display:flex; ' +
                        'gap:10px; align-items:center">' +
                        '<span style="font-size:17px">🔄</span><div style="flex:1; min-width:0"><b>Lokal + Abgleich.</b> ' +
                        'Dieses Gerät gleicht mit der Wolke ab.</div>' +
                        '<button data-a="nurlokal" style="font-size:12px; flex:none; width:auto; white-space:nowrap">' +
                        'Nur lokal arbeiten</button></div>'
                    : '<div style="padding:12px; border:1px solid var(--warnung); border-radius:8px; ' +
                        'font-size:12.5px; line-height:1.6; margin-bottom:16px; display:flex; ' +
                        'gap:10px; align-items:center">' +
                        '<span style="font-size:17px">📴</span><div style="flex:1; min-width:0"><b>Nur lokal.</b> ' +
                        'Du bist angemeldet, aber nichts verlässt dieses Gerät.</div>' +
                        '<button data-a="abgleich-an" class="prim" style="font-size:12px; flex:none; ' +
                        'width:auto; white-space:nowrap">Abgleich einschalten</button></div>') +
            '<div id="wo-zahlen" style="display:flex; gap:9px; margin-bottom:16px; flex-wrap:wrap"></div>' +
            '<div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:16px">' +
            '<button data-a="jetzt"' + (frage
            ? ' disabled title="Erst oben entscheiden, wie es nach dem ' +
                'Einspielen weitergehen soll."'
            : ' class="prim"') + '>Jetzt abgleichen</button>' +
            '<button data-a="freigeben">Anderes Gerät freigeben</button>' +
            '<button data-a="geraete">Angemeldete Geräte</button>' +
            '<button data-a="marken">Marken</button>' +
            '</div>' +
            (Wolke.hatSchluessel()
                ? '<div style="padding:12px; border:1px solid var(--line); border-radius:8px; ' +
                    'font-size:12.5px; line-height:1.6; color:var(--text-dim)">' +
                    '🔒 Der Schlüssel ist gesetzt. Private Seiten gehen verschlüsselt hinaus — ' +
                    'der Server kann sie nicht lesen. Nur was du ausdrücklich teilst oder ' +
                    'veröffentlichst, geht im Klartext.</div>'
                : '<div style="padding:12px; border:1px solid var(--warnung); border-radius:8px; ' +
                    'font-size:12.5px; line-height:1.6">' +
                    '⚠ Es ist kein Schlüssel gesetzt. Ohne ihn liegen deine Seiten im Klartext auf ' +
                    'dem Server. <button data-a="schluessel" style="font-size:12px;margin-top:7px">' +
                    'Schlüssel setzen</button></div>') +
            (z.fehler ? '<div style="margin-top:13px; font-size:12.5px; color:var(--gefahr)">' +
                esc(z.fehler) + '</div>' : '') +
            '<div style="margin-top:16px; font-size:12px; color:var(--text-faint); line-height:1.6">' +
            'Letzter Abgleich: ' + (z.letzter ? esc(new Date(z.letzter).toLocaleString('de-CH'))
            : 'noch keiner') +
            '<br>Gerät: ' + esc(Wolke.geraeteName()) +
            '<br>Server: <code>' + esc(Wolke.adresse()) + '</code> ' +
            '<button data-a="pruefen" style="font-size:11.5px; padding:2px 8px">Server prüfen</button>' +
            '<div id="wo-pruef" style="margin-top:9px"></div>' +
            '</div>' +
            '<div style="margin-top:14px; font-size:12px; color:var(--text-faint); ' +
            'display:flex; gap:9px; align-items:center; flex-wrap:wrap">' +
            '<label for="wo-takt">Von selbst abgleichen:</label>' +
            '<select id="wo-takt" style="font-size:12px; padding:4px 8px">' +
            ['0', '120', '600'].map(v => `<option value="${v}"${String(Store.getMeta('wolkeTakt', '120')) === v ? ' selected' : ''}>` +
                (v === '0' ? 'nur beim Öffnen und von Hand'
                    : v === '120' ? 'alle 2 Minuten' : 'alle 10 Minuten') + '</option>').join('') +
            '</select>' +
            '</div>' +
            '<hr style="border:none;border-top:1px solid var(--line); margin:16px 0 12px">' +
            '<div style="display:flex; gap:8px; align-items:center; font-size:12px; ' +
            'color:var(--text-faint); flex-wrap:wrap">' +
            '<button data-a="sichern" style="font-size:12px; width:auto">⬇ Alles als .redion sichern</button>' +
            '<span style="flex:1"></span>' +
            '<button data-a="loeschen" style="font-size:12px; width:auto; color:var(--gefahr)">' +
            'Konto löschen …</button>' +
            '</div>');
    };
    const abgleichFragen = async () => {
        if (!Wolke.angemeldet() || Wolke.abgleichErlaubt())
            return;
        if (Wolke.neuAbgleichOffen()) {
            UI.toast('Nach dem Einspielen steht oben eine Entscheidung — sie ' +
                'ersetzt diese Frage.');
            return;
        }
        const ja = confirm('Dieses Gerät ab jetzt mit der Wolke abgleichen?\n\n' +
            'Deine bisherigen Notizen gehen dann — verschlüsselt — zum Server ' +
            'und erscheinen auf deinen anderen Geräten.\n\n' +
            '„Abbrechen" heisst: angemeldet bleiben, aber alles bleibt nur auf ' +
            'diesem Gerät. Das lässt sich im Wolke-Fenster jederzeit ändern.');
        Wolke.abgleichSetzen(ja);
        if (ja) {
            UI.toast('Abgleich läuft …');
            try {
                await Wolke.abgleichen();
            }
            catch { }
        }
        else {
            UI.toast('Nur lokal: nichts verlässt dieses Gerät.');
        }
    };
    const loeschenFenster = () => {
        const k = Wolke.zustand.konto || {};
        const o = document.createElement('div');
        o.className = 'overlay';
        o.innerHTML = '<div class="finder" style="width:min(520px,94vw)">' +
            '<div class="fh">Konto löschen<button class="icon-btn" data-a="zu">✕</button></div>' +
            '<div class="res" style="padding:18px; font-size:13px; line-height:1.65">' +
            '<div style="padding:12px; border:1px solid var(--gefahr); border-radius:8px; ' +
            'margin-bottom:14px">' +
            'Das löscht auf dem Server <b>endgültig</b>:' +
            '<ul style="margin:8px 0 0 18px; padding:0">' +
            '<li>alle deine Bereiche samt Sätzen und Anhängen</li>' +
            '<li>alle Freigaben und veröffentlichten Seiten</li>' +
            '<li>alle Marken und Sitzungen</li>' +
            '<li>das Konto selbst</li>' +
            '</ul>' +
            '</div>' +
            '<div style="margin-bottom:14px">Die Notizen <b>auf diesem Gerät bleiben</b>. ' +
            'Sichere sie trotzdem vorher — eine Sicherung zu viel hat noch nie geschadet:</div>' +
            '<button data-a="sichern" class="btn" style="margin-bottom:16px">⬇ Alles als .redion sichern</button>' +
            '<div style="margin-bottom:8px">Zum Bestätigen die Mail-Adresse des Kontos eintippen:</div>' +
            '<div class="fn-reihe">' +
            '<input id="wo-mail-bestaetigen" class="fn-feld" placeholder="' + esc(k.mail || '') + '">' +
            '<button data-a="endgueltig" class="btn rot prim" style="flex:none; white-space:nowrap">' +
            'Endgültig löschen</button>' +
            '</div>' +
            '</div></div>';
        document.body.appendChild(o);
        o.addEventListener('click', async (e) => {
            if (e.target === o || elVon(e)?.closest('[data-a="zu"]')) {
                o.remove();
                return;
            }
            const a = elVon(e)?.closest('[data-a]');
            if (!a)
                return;
            if (a.dataset.a === 'sichern') {
                await App.sicherungSpeichern();
                return;
            }
            if (a.dataset.a !== 'endgueltig')
                return;
            const feld = o.querySelector('#wo-mail-bestaetigen');
            const getippt = (feld?.value || '').trim().toLowerCase();
            if (!getippt || getippt !== String(k.mail || '').toLowerCase()) {
                UI.toast('Die Adresse stimmt nicht — nichts wurde gelöscht.');
                return;
            }
            a.disabled = true;
            a.textContent = 'Wird gelöscht …';
            try {
                const r = await Wolke.kontoLoeschen();
                o.remove();
                UI.toast('Das Konto ist gelöscht' +
                    (r && r.bereiche ? ' — samt ' + r.bereiche + ' Bereich(en) auf dem Server.' : '.') +
                    ' Deine Notizen hier sind noch da.');
            }
            catch (err) {
                a.disabled = false;
                a.textContent = 'Endgültig löschen';
                UI.toast(err instanceof Error ? err.message : String(err));
            }
        });
    };
    const zahlenNachtragen = async (ziel) => {
        const kasten = ziel.querySelector('#wo-zahlen');
        if (!kasten)
            return;
        const offen = Wolke.zuSchicken().length;
        const kachel = (n, t, farbe = '') => '<div style="flex:1; min-width:96px; padding:11px; border:1px solid var(--line); ' +
            'border-radius:8px; text-align:center">' +
            `<div style="font-size:21px; font-weight:600${farbe ? ';color:' + farbe : ''}">${n}</div>` +
            `<div style="font-size:11.5px; color:var(--text-faint)">${t}</div></div>`;
        kasten.innerHTML = kachel(offen, offen === 1 ? 'wartet' : 'warten', offen ? 'var(--accent)' : '') +
            kachel(Wolke.zustand.hoch, 'geschickt') +
            kachel(Wolke.zustand.runter, 'geholt');
    };
    const schluesselFragen = async () => {
        const satz = await UI.frage('Ein Satz, den nur du kennst — daraus entsteht der Schlüssel', '');
        if (!satz)
            return false;
        if (satz.length < 8) {
            UI.toast('Zu kurz. Nimm einen ganzen Satz, keine acht Zeichen.');
            return false;
        }
        const ok = await Wolke.schluesselSetzen(satz);
        UI.toast(ok ? '🔒 Schlüssel gesetzt'
            : 'Das passt nicht zu dem, was schon verschlüsselt ist. Tippfehler?');
        return ok;
    };
    const codeFenster = async () => {
        const o = document.createElement('div');
        o.className = 'overlay';
        o.innerHTML = '<div class="finder" style="width:min(460px,94vw)">' +
            '<div class="fh">Mit einem Code anmelden<button class="icon-btn" data-a="zu">✕</button></div>' +
            '<div class="res" id="wo-code" style="padding:22px; text-align:center">' +
            '<div style="font-size:13px;color:var(--text-dim)">Wird geholt …</div></div></div>';
        document.body.appendChild(o);
        o.addEventListener('click', e => {
            if (e.target === o || elVon(e)?.closest('[data-a="zu"]'))
                o.remove();
        });
        try {
            const a = await Wolke.codeHolen();
            const codeFeld = o.querySelector('#wo-code');
            if (codeFeld)
                codeFeld.innerHTML =
                    '<div style="font-size:13px; color:var(--text-dim); line-height:1.65; margin-bottom:18px">' +
                        'Öffne Redion auf einem Gerät, an dem du schon angemeldet bist, gehe dort auf ' +
                        '<b>Wolke → Anderes Gerät freigeben</b> und tippe diesen Code ein:</div>' +
                        '<div style="font:600 30px/1.3 ui-monospace,monospace; letter-spacing:3px; ' +
                        'padding:16px; border:1px solid var(--line); border-radius:10px; ' +
                        'margin-bottom:14px">' + esc(a.code) + '</div>' +
                        '<div style="font-size:12px; color:var(--text-faint)">Zehn Minuten gültig. ' +
                        'Dieses Fenster wartet.</div>';
            const konto = await Wolke.codeWarten(a.code);
            const codeFeld2 = o.querySelector('#wo-code');
            if (codeFeld2)
                codeFeld2.innerHTML =
                    '<div style="font-size:34px; margin-bottom:12px">✅</div>' +
                        '<b style="font-size:16px">Angemeldet als ' + esc(konto?.name || '') + '</b>';
            setTimeout(async () => { o.remove(); await schluesselFragen(); await abgleichFragen(); dialog(); }, 1200);
        }
        catch (e) {
            const codeFeld = o.querySelector('#wo-code');
            if (codeFeld)
                codeFeld.innerHTML =
                    '<div style="font-size:13px; color:var(--gefahr)">' + esc(e instanceof Error ? e.message : String(e)) + '</div>';
        }
    };
    const freigebenFenster = async () => {
        const code = await UI.frage('Den Code vom anderen Gerät eintippen', '');
        if (!code)
            return;
        try {
            await Wolke.codeFreigeben(code.trim().toUpperCase());
            UI.toast('✅ Freigegeben. Das andere Gerät meldet sich gleich an.');
        }
        catch (e) {
            UI.toast(e instanceof Error ? e.message : String(e));
        }
    };
    const teilenFenster = async (seiteId) => {
        const seite = Store.getBlock(seiteId);
        if (!seite)
            return;
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
            try {
                liste = await Wolke.freigaben();
            }
            catch { }
            const meine = liste.freigaben.filter(f => f.seite === seiteId);
            const teilFeld = o.querySelector('#wo-teil');
            if (!teilFeld)
                return;
            teilFeld.innerHTML =
                '<div style="padding:13px; border:1px solid ' +
                    (offen ? 'var(--line)' : 'var(--warnung)') + '; border-radius:8px; ' +
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
                        ? '<div style="margin-bottom:16px">' + meine.map(f => '<div style="display:flex;gap:10px;align-items:center;padding:7px 2px;' +
                            'font-size:13px"><span style="flex:1">' + esc(f.name) +
                            (f.mail ? ' <span style="color:var(--text-faint)">' + esc(f.mail) + '</span>' : '') +
                            '</span><code style="font-size:11.5px">' + esc(f.rolle) + '</code>' +
                            '<button data-weg="' + esc(f.kontoId) + '" style="font-size:12px">✕</button></div>').join('') + '</div>'
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
            o.querySelector('#wo-offen')?.addEventListener('change', (e) => {
                const feld = e.target instanceof HTMLInputElement ? e.target : null;
                if (!feld)
                    return;
                Wolke.geteiltSetzen(seiteId, feld.checked);
                UI.toast(feld.checked
                    ? 'Beim nächsten Abgleich geht sie lesbar hinaus'
                    : 'Sie wird wieder verschlüsselt');
                zeichne();
            });
        };
        o.addEventListener('click', async (e) => {
            if (e.target === o || elVon(e)?.closest('[data-a="zu"]')) {
                o.remove();
                return;
            }
            const weg = elVon(e)?.closest('[data-weg]');
            if (weg) {
                try {
                    await Wolke.freigeben(seiteId, weg.dataset['weg'], 'kein');
                    await zeichne();
                }
                catch (err) {
                    UI.toast(err instanceof Error ? err.message : String(err));
                }
                return;
            }
            const a = elVon(e)?.closest('[data-a]');
            if (!a)
                return;
            try {
                if (a.dataset.a === 'einladen') {
                    const mailFeld = o.querySelector('#wo-mail');
                    const mail = (mailFeld?.value ?? '').trim();
                    if (!mail) {
                        UI.toast('Es fehlt die Adresse.');
                        return;
                    }
                    await Wolke.freigeben(seiteId, mail, o.querySelector('#wo-rolle')?.value ?? 'lesen');
                    if (mailFeld)
                        mailFeld.value = '';
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
                        passwort: o.querySelector('#wo-pw')?.value ?? '',
                        tage: Number(o.querySelector('#wo-tage')?.value) || 0
                    });
                    const adrFeld = o.querySelector('#wo-adresse');
                    if (adrFeld)
                        adrFeld.innerHTML =
                            '✅ <a href="' + esc(r.adresse) + '" target="_blank" rel="noopener">' +
                                esc(r.adresse) + '</a>' +
                                '<button data-a="kopie" style="font-size:11.5px;margin-left:8px">kopieren</button>';
                    if (adrFeld)
                        adrFeld.dataset['adresse'] = r.adresse;
                }
                if (a.dataset.a === 'kopie') {
                    const adr = o.querySelector('#wo-adresse')?.dataset['adresse'] ?? '';
                    Ablage.kopiereJetzt(adr, 'Adresse kopiert');
                }
                if (a.dataset.a === 'zurueck') {
                    await Wolke.zurueckziehen(seiteId);
                    const az = o.querySelector('#wo-adresse');
                    if (az)
                        az.textContent = 'Zurückgezogen.';
                    UI.toast('Die Adresse führt jetzt ins Leere');
                }
            }
            catch (err) {
                UI.toast(err instanceof Error ? err.message : String(err));
            }
        });
        await zeichne();
    };
    const geraeteFenster = async () => {
        const o = document.createElement('div');
        o.className = 'overlay';
        o.innerHTML = '<div class="finder" style="width:min(620px,95vw)">' +
            '<div class="fh">💻 Angemeldete Geräte<button class="icon-btn" data-a="zu">✕</button></div>' +
            '<div class="res" id="wo-geraete" style="padding:18px">Wird geladen …</div></div>';
        document.body.appendChild(o);
        const datum = (x) => {
            if (!x)
                return '';
            const d = new Date(x);
            return isNaN(d.getTime()) ? '' : d.toLocaleDateString('de-CH');
        };
        const zeichne = async () => {
            let liste = { geraete: [] };
            let schiefging = '';
            try {
                liste = await Wolke.geraeteListe();
            }
            catch (e) {
                schiefging = e instanceof Error ? e.message : String(e);
            }
            const feld = o.querySelector('#wo-geraete');
            if (!feld)
                return;
            const alle = Array.isArray(liste.geraete) ? liste.geraete : [];
            feld.innerHTML =
                '<div style="font-size:12.5px; color:var(--text-dim); line-height:1.65; margin-bottom:16px">' +
                    'Jede Anmeldung ist eine Sitzung. Wer ein Gerät zurückzieht, meldet es ab — ' +
                    'die Notizen auf jenem Gerät bleiben, nur der Abgleich hört auf.</div>' +
                    (schiefging
                        ? '<div style="font-size:12.5px;color:var(--gefahr);line-height:1.6">' +
                            esc(schiefging) + '</div>'
                        : alle.length
                            ? alle.map((x) => '<div style="display:flex;gap:10px;align-items:center;padding:9px 2px;' +
                                'border-top:1px solid var(--line);font-size:13px">' +
                                '<div style="flex:1"><b>' + esc(x.geraet || 'Unbekanntes Gerät') + '</b>' +
                                (x.aktuell ? ' <span class="ez-grau" style="font-size:11.5px">· dieses Gerät</span>' : '') +
                                '<div style="font-size:11.5px;color:var(--text-faint)">' +
                                (datum(x.angelegt) ? 'angemeldet am ' + esc(datum(x.angelegt)) : 'angemeldet') +
                                (datum(x.bis) ? ' · läuft ab am ' + esc(datum(x.bis)) : '') +
                                '</div></div>' +
                                '<button class="wo-zeilenknopf" data-weg="' + esc(x.kennung) + '"' +
                                (x.aktuell ? ' data-selbst="1"' : '') + '>' +
                                (x.aktuell ? 'Abmelden' : 'Zurückziehen') + '</button>' +
                                '</div>').join('')
                            : '<div style="font-size:12.5px;color:var(--text-faint)">' +
                                'Nur dieses Gerät — oder der Server kennt noch keine Sitzung.</div>');
        };
        o.addEventListener('click', async (e) => {
            if (e.target === o || elVon(e)?.closest('[data-a="zu"]')) {
                o.remove();
                return;
            }
            const weg = elVon(e)?.closest('[data-weg]');
            if (!weg)
                return;
            if (weg.dataset.selbst && !confirm('Das ist dieses Gerät. Zurückziehen heisst abmelden.\n\n' +
                'Deine Notizen bleiben hier — nur der Abgleich hört auf. Fortfahren?'))
                return;
            try {
                await Wolke.geraetWeg(weg.dataset.weg);
                if (weg.dataset.selbst) {
                    o.remove();
                    location.reload();
                    return;
                }
                await zeichne();
            }
            catch (err) {
                UI.toast(err instanceof Error ? err.message : String(err));
            }
        });
        await zeichne();
    };
    const markenFenster = async () => {
        const o = document.createElement('div');
        o.className = 'overlay';
        o.innerHTML = '<div class="finder" style="width:min(620px,95vw)">' +
            '<div class="fh">🔑 Marken<button class="icon-btn" data-a="zu">✕</button></div>' +
            '<div class="res" id="wo-marken" style="padding:18px">Wird geladen …</div></div>';
        document.body.appendChild(o);
        const zeichne = async () => {
            let liste = { marken: [] };
            try {
                liste = await Wolke.markenListe();
            }
            catch (e) {
                UI.toast(e instanceof Error ? e.message : String(e));
            }
            const markenFeld = o.querySelector('#wo-marken');
            if (!markenFeld)
                return;
            markenFeld.innerHTML =
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
                        ? liste.marken.map((x) => '<div style="display:flex;gap:10px;align-items:center;padding:9px 2px;' +
                            'border-top:1px solid var(--line);font-size:13px">' +
                            '<div style="flex:1"><b>' + esc(x.name) + '</b>' +
                            '<div style="font-size:11.5px;color:var(--text-faint)">' + esc(x.rechte) +
                            (x.benutzt ? ' · zuletzt ' + esc(new Date(x.benutzt).toLocaleDateString('de-CH'))
                                : ' · nie benutzt') +
                            (x.bis ? ' · bis ' + esc(new Date(x.bis).toLocaleDateString('de-CH')) : '') +
                            '</div></div>' +
                            '<button class="wo-zeilenknopf" data-weg="' + esc(x.kennung) + '">Zurückziehen</button>' +
                            '</div>').join('')
                        : '<div style="font-size:12.5px;color:var(--text-faint)">Noch keine Marke.</div>');
        };
        o.addEventListener('click', async (e) => {
            if (e.target === o || elVon(e)?.closest('[data-a="zu"]')) {
                o.remove();
                return;
            }
            const weg = elVon(e)?.closest('[data-weg]');
            if (weg) {
                try {
                    await Wolke.markeWeg(weg.dataset.weg);
                    await zeichne();
                }
                catch (err) {
                    UI.toast(err instanceof Error ? err.message : String(err));
                }
                return;
            }
            const a = elVon(e)?.closest('[data-a]');
            if (!a || a.dataset.a !== 'neu')
                return;
            try {
                const r = await Wolke.markeAnlegen(o.querySelector('#wo-mname')?.value || 'Ohne Namen', (o.querySelector('#wo-mrecht')?.value ?? 'lesen').split(','), Number(o.querySelector('#wo-mtage')?.value) || 0);
                await zeichne();
                const neuFeld = o.querySelector('#wo-neu');
                if (neuFeld)
                    neuFeld.innerHTML =
                        '<div style="padding:12px; border:1px solid var(--accent); border-radius:8px; ' +
                            'margin-bottom:16px"><div style="font-size:12.5px; margin-bottom:7px">' +
                            'Jetzt kopieren — sie wird nicht noch einmal angezeigt:</div>' +
                            '<code style="font-size:12px; word-break:break-all">' + esc(r.token) + '</code></div>';
            }
            catch (err) {
                UI.toast(err instanceof Error ? err.message : String(err));
            }
        });
        await zeichne();
    };
    return { dialog, teilenFenster, markenFenster, geraeteFenster, codeFenster, schluesselFragen,
        serverPruefen };
})();
window.WolkeFenster = WolkeFenster;
