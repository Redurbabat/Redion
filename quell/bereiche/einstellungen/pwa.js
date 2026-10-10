"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/bereiche/einstellungen/pwa.ts (npm run bauen:ts). */
const PWA = (() => {
    const elVon = (e) => e.target instanceof Element ? e.target : null;
    const istApple = () => /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const istSafari = () => /^((?!chrome|android|crios|fxios).)*safari/i.test(navigator.userAgent);
    const istInstalliert = () => window.matchMedia('(display-mode: standalone)').matches ||
        navigator.standalone === true;
    const istTelefon = () => typeof AppEinstellung !== 'undefined'
        ? AppEinstellung.amTelefon()
        : window.matchMedia('(max-width: 760px)').matches;
    const workerAnmelden = async () => {
        if (!('serviceWorker' in navigator))
            return;
        if (location.protocol === 'file:')
            return;
        try {
            const reg = await navigator.serviceWorker.register('sw.js', { scope: './' });
            reg.addEventListener('updatefound', () => {
                const neu = reg.installing;
                if (!neu)
                    return;
                neu.addEventListener('statechange', () => {
                    if (neu.state === 'installed' && navigator.serviceWorker.controller) {
                        const b = UI.banner('Es liegt eine neue Fassung bereit. ' +
                            '<button id="pwa-neu" class="banner-tat">Jetzt laden</button>', 'info unten');
                        b.querySelector('#pwa-neu')?.addEventListener('click', () => {
                            neu.postMessage('aktualisieren');
                            location.reload();
                        });
                    }
                });
            });
            let neugeladen = false;
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                if (neugeladen)
                    return;
                neugeladen = true;
            });
        }
        catch (e) {
            console.info('Service Worker nicht angemeldet:', e instanceof Error ? e.message : e);
        }
    };
    let angebot = null;
    const angebotAnnehmen = () => {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            angebot = e;
            knopfZeigen();
        });
        window.addEventListener('appinstalled', () => {
            angebot = null;
            Store.setMeta('pwa:installiert', true);
            document.getElementById('btn-install')?.remove();
            UI.toast('Fertig — Redion liegt jetzt als App auf dem Gerät.');
        });
    };
    const knopfZeigen = () => {
        if (istInstalliert() || document.getElementById('btn-install'))
            return;
        if (Store.getMeta('pwa:nichtFragen', false))
            return;
        const fuss = document.querySelector('.side-fuss');
        if (!fuss)
            return;
        const b = document.createElement('button');
        b.className = 'side-item';
        b.id = 'btn-install';
        b.innerHTML = '<span>⬇</span><span>Als App installieren</span>';
        b.addEventListener('click', () => installieren());
        fuss.insertBefore(b, fuss.firstChild);
    };
    const installieren = async () => {
        if (angebot) {
            angebot.prompt();
            const { outcome } = await angebot.userChoice;
            angebot = null;
            if (outcome === 'accepted')
                UI.toast('Wird installiert …');
            else
                UI.toast('Abgebrochen — geht später auch noch.');
            return;
        }
        anleitung();
    };
    const anleitung = () => {
        const apple = istApple();
        const o = document.createElement('div');
        o.className = 'overlay';
        o.innerHTML = '<div class="finder" style="width:min(520px,94vw)">' +
            '<div class="fh">⬇ Als App installieren<button class="icon-btn" data-a="zu">✕</button></div>' +
            '<div style="padding:6px 18px 16px; max-height:70vh; overflow:auto">' +
            (istInstalliert()
                ? '<div class="meet-ok">✓ Läuft schon als App.</div>'
                : '') +
            (apple
                ? '<div class="verb-karte">' +
                    '<div class="verb-kopf"><span>📱</span><b>iPhone und iPad</b></div>' +
                    '<div class="verb-text">Apple lässt das Installieren nur über <b>Safari</b> zu — ' +
                    'in Chrome oder Firefox auf dem iPhone gibt es den Punkt nicht.</div>' +
                    '<ol class="pwa-schritte">' +
                    '<li>Diese Seite in <b>Safari</b> öffnen</li>' +
                    '<li>Unten auf den <b>Teilen-Knopf</b> tippen — das Quadrat mit dem Pfeil nach oben</li>' +
                    '<li>In der Liste nach unten wischen bis <b>„Zum Home-Bildschirm"</b></li>' +
                    '<li>Oben rechts auf <b>Hinzufügen</b></li>' +
                    '</ol>' +
                    '<div class="verb-text" style="margin-top:10px">Danach liegt Redion als eigenes ' +
                    'Symbol auf dem Bildschirm, startet ohne Adresszeile und läuft auch ohne Netz. ' +
                    'Deine Daten bleiben im App-Speicher.</div>' +
                    (istSafari() ? '' :
                        '<div class="meet-warn">Das hier ist nicht Safari. Öffne die Seite dort, ' +
                            'sonst fehlt der Punkt „Zum Home-Bildschirm".</div>') +
                    '</div>'
                : '<div class="verb-karte">' +
                    '<div class="verb-kopf"><span>💻</span><b>Chrome, Edge und Android</b></div>' +
                    '<div class="verb-text">Rechts in der Adresszeile erscheint ein kleines ' +
                    'Installieren-Symbol. Oder über das Menü ⋮ → <b>App installieren</b>. ' +
                    'Auf Android: ⋮ → <b>Zum Startbildschirm hinzufügen</b>.</div>' +
                    (angebot ? '<div class="verb-knoepfe">' +
                        '<button data-a="jetzt">Jetzt installieren</button></div>' : '') +
                    '</div>') +
            '<div class="verb-karte">' +
            '<div class="verb-kopf"><span>🔌</span><b>Was offline geht</b></div>' +
            '<div class="verb-text">Alles, was auf dem Gerät liegt: Seiten, Datenbanken, ' +
            'Formeln, Ansichten, Suche, Vorlagen. Nur was von draussen kommt — Google-Kalender, ' +
            'Gmail, GitHub, Wikipedia — braucht Netz. Die KI läuft ohne Netz, wenn du ein ' +
            'Modell im Browser geladen hast.</div>' +
            '</div>' +
            '<div class="verb-karte">' +
            '<div class="verb-kopf"><span>💾</span><b>Bleiben die Daten?</b></div>' +
            '<div class="verb-text">Ja. Als installierte App räumt iOS den Speicher nicht ' +
            'von selbst weg — im normalen Safari-Tab kann das nach sieben Tagen ohne Besuch ' +
            'passieren. Genau deshalb lohnt sich das Installieren. Trotzdem gilt: ' +
            'ab und zu unter <b>Einstellungen → Import und Export</b> eine Sicherung ziehen.</div>' +
            '<div class="verb-knoepfe"><button data-a="dauerhaft">Speicher dauerhaft anfordern</button>' +
            '<button data-a="sichern">Jetzt sichern</button></div>' +
            '</div>' +
            '</div><div class="fbtns">' +
            '<button data-a="nie">Nicht mehr fragen</button>' +
            '<button data-a="zu" class="prim">Fertig</button></div></div>';
        document.body.appendChild(o);
        o.addEventListener('click', async (e) => {
            if (e.target === o || elVon(e)?.closest('[data-a="zu"]')) {
                o.remove();
                return;
            }
            const b = elVon(e)?.closest('button[data-a]');
            if (!b)
                return;
            if (b.dataset.a === 'jetzt') {
                o.remove();
                installieren();
            }
            if (b.dataset.a === 'nie') {
                Store.setMeta('pwa:nichtFragen', true);
                document.getElementById('btn-install')?.remove();
                o.remove();
                UI.toast('Gut — der Punkt steht weiter in den Einstellungen.');
            }
            if (b.dataset.a === 'dauerhaft') {
                if (navigator.storage?.persist) {
                    const ok = await navigator.storage.persist();
                    UI.toast(ok ? '✓ Der Browser behält die Daten dauerhaft.'
                        : 'Der Browser hat das abgelehnt — Sicherungen helfen trotzdem.');
                }
                else
                    UI.toast('Dieser Browser kennt die Anfrage nicht.');
            }
            if (b.dataset.a === 'sichern') {
                o.remove();
                App.sicherungSpeichern();
            }
        });
    };
    const schubladeAuf = () => {
        document.body.classList.add('side-offen');
        if (!document.getElementById('side-schatten')) {
            const s = document.createElement('div');
            s.id = 'side-schatten';
            s.addEventListener('click', schubladeZu);
            document.body.appendChild(s);
        }
    };
    const schubladeZu = () => {
        document.body.classList.remove('side-offen');
        document.getElementById('side-schatten')?.remove();
    };
    const tastenleiste = () => {
        const leiste = document.getElementById('tastenleiste');
        if (!leiste)
            return;
        let aktiv = null;
        const lege = () => {
            const vv = window.visualViewport;
            const unten = vv ? Math.max(0, window.innerHeight - vv.height - vv.offsetTop) : 0;
            leiste.style.bottom = unten + 'px';
        };
        window.visualViewport?.addEventListener('resize', lege);
        window.visualViewport?.addEventListener('scroll', lege);
        const zeigen = (feld) => {
            if (!istTelefon())
                return;
            aktiv = feld;
            leiste.hidden = false;
            document.body.classList.add('schreibt');
            lege();
        };
        const verstecken = () => {
            leiste.hidden = true;
            leiste.style.bottom = '';
            document.body.classList.remove('schreibt');
            aktiv = null;
        };
        document.addEventListener('focusin', (e) => {
            const ct = elVon(e)?.closest('.blk [contenteditable], #title');
            if (ct)
                zeigen(ct);
            else if (!elVon(e)?.closest('#tastenleiste'))
                verstecken();
        });
        document.addEventListener('focusout', () => {
            setTimeout(() => {
                if (!document.activeElement ||
                    !document.activeElement.closest('.blk [contenteditable], #title, #tastenleiste'))
                    verstecken();
            }, 120);
        });
        leiste.addEventListener('mousedown', (e) => e.preventDefault());
        leiste.addEventListener('touchstart', (e) => {
            if (elVon(e)?.closest('button'))
                e.preventDefault();
        }, { passive: false });
        leiste.addEventListener('click', (e) => {
            const b = elVon(e)?.closest('button[data-t]');
            if (!b)
                return;
            const was = b.dataset.t;
            const feld = aktiv;
            if (was === 'fertig') {
                feld && feld.blur();
                verstecken();
                return;
            }
            if (!feld)
                return;
            feld.focus();
            const blk = feld.closest('.blk');
            const block = blk ? Store.getBlock(blk.dataset.bid) : null;
            const einsetzen = (txt) => document.execCommand('insertText', false, txt);
            if (was === 'plus') {
                if (!block)
                    return;
                const eltern = Store.getBlock(block.parentId);
                const idx = eltern ? eltern.content.indexOf(block.id) + 1 : -1;
                const neu = Store.addBlock(block.parentId, 'text', {}, idx);
                App.zeichneSeite(neu.id);
                return;
            }
            if (was === 'slash') {
                einsetzen('/');
                feld.dispatchEvent(new InputEvent('input', { bubbles: true }));
                setTimeout(() => Blocks.slashMenue(feld, block), 30);
                return;
            }
            if (was === 'fett') {
                einsetzenUm(feld, '**');
                return;
            }
            if (was === 'kursiv') {
                einsetzenUm(feld, '*');
                return;
            }
            if (was === 'unter') {
                einsetzenUm(feld, '__');
                return;
            }
            if (was === 'code') {
                einsetzenUm(feld, '`');
                return;
            }
            if (was === 'link') {
                const u = prompt('Adresse für den Link:');
                if (!u)
                    return;
                const t = (getSelection()?.toString() || u);
                einsetzen('[' + t + '](' + u + ')');
                return;
            }
            if (was === 'todo' && block) {
                Store.updateBlock(block.id, { type: block.type === 'todo' ? 'text' : 'todo' });
                App.zeichneSeite(block.id, 'ende');
                return;
            }
            if ((was === 'rein' || was === 'raus') && block) {
                feld.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: was === 'raus', bubbles: true, cancelable: true }));
                return;
            }
        });
    };
    const einsetzenUm = (feld, zeichen) => {
        const sel = getSelection();
        const txt = sel && sel.toString();
        if (txt)
            document.execCommand('insertText', false, zeichen + txt + zeichen);
        else {
            document.execCommand('insertText', false, zeichen + zeichen);
            if (!sel || !sel.rangeCount) {
                feld.dispatchEvent(new InputEvent('input', { bubbles: true }));
                return;
            }
            const r = sel.getRangeAt(0);
            r.setStart(r.startContainer, Math.max(0, r.startOffset - zeichen.length));
            r.collapse(true);
            sel.removeAllRanges();
            sel.addRange(r);
        }
        feld.dispatchEvent(new InputEvent('input', { bubbles: true }));
    };
    const beruehrung = () => {
        let halten = null, startX = 0, startY = 0, gezogen = null, verschoben = 0;
        let hebung = null;
        let fallZiel = null;
        let getragen = false;
        let marke = null;
        const aufraeumen = () => {
            clearTimeout(halten);
            halten = null;
            if (gezogen) {
                gezogen.style.transform = '';
                gezogen.style.opacity = '';
                gezogen = null;
            }
            verschoben = 0;
            absetzen();
        };
        const nachzuegler = () => Menue.nachzuegler();
        const tragen = (e) => {
            if (!hebung)
                return;
            const t = e.touches[0];
            if (!t)
                return;
            e.preventDefault();
            if (Math.abs(t.clientX - startX) > 12 || Math.abs(t.clientY - startY) > 12)
                getragen = true;
            const roller = document.getElementById('scroll');
            if (roller) {
                if (t.clientY < 150)
                    roller.scrollTop -= (150 - t.clientY) / 5;
                else if (t.clientY > innerHeight - 170)
                    roller.scrollTop += (t.clientY - (innerHeight - 170)) / 5;
            }
            const unter = document.elementFromPoint(t.clientX, t.clientY);
            const blk = unter ? unter.closest('.blk') : null;
            if (!blk || !blk.dataset.bid || blk.dataset.bid === hebung.id)
                return;
            const r = blk.getBoundingClientRect();
            const danach = t.clientY > r.top + r.height / 2;
            fallZiel = { id: blk.dataset.bid, danach };
            if (!marke) {
                marke = document.createElement('div');
                marke.className = 'fallmarke';
                document.body.appendChild(marke);
            }
            marke.style.top = ((danach ? r.bottom : r.top) - 1) + 'px';
            marke.style.left = r.left + 'px';
            marke.style.width = r.width + 'px';
        };
        const absetzen = () => {
            if (hebung && hebung.el)
                hebung.el.classList.remove('gehoben');
            hebung = null;
            fallZiel = null;
            getragen = false;
            if (marke) {
                marke.remove();
                marke = null;
            }
            document.removeEventListener('touchmove', tragen);
        };
        new MutationObserver(() => {
            if (hebung && !hebung.el.isConnected)
                absetzen();
        }).observe(document.body, { childList: true, subtree: true });
        document.addEventListener('touchstart', (e) => {
            if (!istTelefon() || e.touches.length !== 1)
                return;
            const t = e.touches[0];
            if (!t)
                return;
            startX = t.clientX;
            startY = t.clientY;
            Menue.nachzueglerWeg();
            if (hebung)
                absetzen();
            const blk = elVon(e)?.closest('.blk');
            const imSchreibfeld = (() => {
                const feld = elVon(e)?.closest('[contenteditable="true"]');
                return !!(feld && feld === document.activeElement);
            })();
            const rollerVorher = document.getElementById('scroll');
            const scrollVorher = rollerVorher ? rollerVorher.scrollTop : 0;
            if (blk && !imSchreibfeld && !elVon(e)?.closest('#tastenleiste, .handles')) {
                halten = setTimeout(() => {
                    halten = null;
                    const rollerJetzt = document.getElementById('scroll');
                    if (rollerJetzt && Math.abs(rollerJetzt.scrollTop - scrollVorher) > 4)
                        return;
                    const b = Store.getBlock(blk.dataset.bid);
                    if (!b)
                        return;
                    const blkJetzt = blk.isConnected ? blk
                        : document.querySelector(`.blk[data-bid="${b.id}"]`);
                    if (!blkJetzt)
                        return;
                    if (navigator.vibrate)
                        navigator.vibrate(12);
                    hebung = { id: b.id, el: blkJetzt };
                    blkJetzt.classList.add('gehoben');
                    if (gezogen) {
                        gezogen.style.transform = '';
                        gezogen.style.opacity = '';
                    }
                    gezogen = null;
                    verschoben = 0;
                    document.addEventListener('touchmove', tragen, { passive: false });
                }, Menue.HALTEN_MS);
            }
            const zeile = elVon(e)?.closest('tbody tr[data-rid], .blk.b-todo, .liste-zeile[data-rid]');
            const schreibfeld = elVon(e)?.closest('[contenteditable="true"], textarea, input:not([type="checkbox"]):not([type="radio"])');
            const rolltSeitlich = (von) => {
                for (let p = von; p && p !== document.body; p = p.parentElement) {
                    if (p.scrollWidth > p.clientWidth + 4) {
                        const ueber = getComputedStyle(p).overflowX;
                        if (ueber === 'auto' || ueber === 'scroll')
                            return true;
                    }
                }
                return false;
            };
            if (zeile && !(schreibfeld && schreibfeld === document.activeElement) &&
                !rolltSeitlich(zeile))
                gezogen = zeile;
        }, { passive: true });
        document.addEventListener('touchmove', (e) => {
            if (!istTelefon() || e.touches.length !== 1)
                return;
            if (hebung)
                return;
            const t = e.touches[0];
            if (!t)
                return;
            const dx = t.clientX - startX, dy = t.clientY - startY;
            if (halten && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
                clearTimeout(halten);
                halten = null;
            }
            if (!gezogen)
                return;
            if (Math.abs(dy) > Math.abs(dx)) {
                aufraeumen();
                return;
            }
            verschoben = Math.max(-120, Math.min(120, dx));
            gezogen.style.transform = 'translateX(' + verschoben + 'px)';
            gezogen.style.opacity = String(1 - Math.abs(verschoben) / 260);
        }, { passive: true });
        document.addEventListener('touchend', (e) => {
            if (e.touches && e.touches.length)
                return;
            if (halten) {
                clearTimeout(halten);
                halten = null;
            }
            if (hebung) {
                const id = hebung.id;
                const el = document.querySelector(`.blk[data-bid="${id}"]`) || hebung.el;
                const ziel = fallZiel, trug = getragen;
                absetzen();
                nachzuegler();
                if (trug && ziel) {
                    Blocks.lege(id, ziel.id, ziel.danach);
                    if (navigator.vibrate)
                        navigator.vibrate(8);
                }
                else if (!trug) {
                    const b = Store.getBlock(id);
                    const griff = el.querySelector('.handles button[data-act="menu"]');
                    if (b)
                        Blocks.blockMenue(griff || el, b);
                }
                return;
            }
            if (!gezogen)
                return;
            const el = gezogen, weg = verschoben;
            el.style.transition = 'transform .18s ease, opacity .18s ease';
            el.style.transform = '';
            el.style.opacity = '';
            setTimeout(() => { el.style.transition = ''; }, 200);
            gezogen = null;
            verschoben = 0;
            if (Math.abs(weg) < 70)
                return;
            nachzuegler();
            const rid = el.dataset.rid;
            if (rid) {
                const row = Store.getBlock(rid);
                if (!row)
                    return;
                if (weg < 0) {
                    Store.updateBlock(rid, { archiviert: !row.archiviert });
                    App.zeichneSeite();
                    UI.toast(row.archiviert ? 'Zurückgeholt' : 'Archiviert — nochmal wischen holt es zurück');
                }
                else {
                    const coll = Store.getCollection(row.parentId);
                    const k = coll && Object.keys(coll.schema).find(x => coll.schema[x].type === 'checkbox');
                    if (!k) {
                        UI.toast('Hier gibt es nichts zum Abhaken');
                        return;
                    }
                    Store.setProp(rid, k, !(row.props || {})[k]);
                    App.zeichneSeite();
                    UI.toast((row.props || {})[k] ? 'Häkchen weg' : '✓ Abgehakt');
                }
                return;
            }
            const b = el.dataset.bid && Store.getBlock(el.dataset.bid);
            if (b && b.type === 'todo') {
                if (weg > 0) {
                    Store.updateBlock(b.id, { checked: !b.checked });
                    App.zeichneSeite();
                    UI.toast(b.checked ? 'Häkchen weg' : '✓ Erledigt');
                }
                else {
                    Store.trashBlock(b.id);
                    App.zeichneSeite();
                    UI.toast('Gelöscht — im Papierkorb');
                }
            }
        }, { passive: true });
        document.addEventListener('touchcancel', aufraeumen, { passive: true });
    };
    const telefonOberflaeche = () => {
        tastenleiste();
        beruehrung();
        if (!document.getElementById('btn-menu')) {
            const b = document.createElement('button');
            b.className = 'top-btn schmal nur-telefon';
            b.id = 'btn-menu';
            b.title = 'Seitenleiste';
            b.setAttribute('aria-label', 'Seitenleiste öffnen');
            b.innerHTML = (typeof Register !== 'undefined' && Register.symbole)
                ? Register.symbole.alsSvg('menu') : '';
            b.addEventListener('click', () => document.body.classList.contains('side-offen') ? schubladeZu() : schubladeAuf());
            document.getElementById('topbar')?.prepend(b);
        }
        const altOeffne = App.oeffne;
        App.oeffne = function (...a) {
            const r = altOeffne.apply(App, a);
            if (istTelefon())
                schubladeZu();
            return r;
        };
        let startX = 0, startY = 0, zieht = false;
        document.addEventListener('touchstart', (e) => {
            if (!istTelefon())
                return;
            const t = e.touches[0];
            if (!t)
                return;
            startX = t.clientX;
            startY = t.clientY;
            zieht = startX < 26 || document.body.classList.contains('side-offen');
        }, { passive: true });
        document.addEventListener('touchend', (e) => {
            if (!zieht || !istTelefon())
                return;
            zieht = false;
            const t = e.changedTouches[0];
            if (!t)
                return;
            const dx = t.clientX - startX, dy = Math.abs(t.clientY - startY);
            if (dy > 60)
                return;
            if (dx > 70)
                schubladeAuf();
            if (dx < -70)
                schubladeZu();
        }, { passive: true });
        const hoehe = () => {
            if (typeof AppEinstellung !== 'undefined')
                AppEinstellung.viewportAktualisieren();
            else
                document.documentElement.style
                    .setProperty('--vh', (window.innerHeight * 0.01) + 'px');
        };
        hoehe();
        window.addEventListener('resize', hoehe);
        window.addEventListener('orientationchange', () => setTimeout(hoehe, 250));
    };
    const abkuerzung = () => {
        const h = (location.hash || '').replace('#', '');
        if (!h)
            return;
        const tun = {
            neu: () => App.neueSeite(),
            suche: () => App.suche(),
            journal: () => Werkzeuge.journal(),
            meeting: () => Meeting.panel()
        }[h];
        if (!tun)
            return;
        history.replaceState(null, '', location.pathname + location.search);
        setTimeout(tun, 400);
    };
    const geteiltes = () => {
        const p = new URLSearchParams(location.search);
        const adresse = p.get('adresse'), titel = p.get('titel'), text = p.get('text');
        if (!adresse && !text)
            return;
        history.replaceState(null, '', location.pathname);
        const r = Clipper.ablegen({
            url: adresse || '', titel: titel || adresse || 'Geteilt',
            auswahl: text || '', kurz: text || ''
        });
        App.zeichneBaum();
        App.oeffne(r.id);
        UI.toast('Geteiltes gespeichert');
    };
    const NUR_MIT_NETZ = ['KI-Antworten aus der Wolke', 'Karten von OpenStreetMap',
        'Webhooks und E-Mail', 'Kalender-Abgleich', 'Wikipedia'];
    const verbindungAnzeigen = (drin) => {
        document.getElementById('offline-streifen')?.remove();
        if (drin)
            return;
        const d = document.createElement('div');
        d.id = 'offline-streifen';
        d.innerHTML = '<span>⚡ Ohne Verbindung — alles Eigene läuft weiter</span>' +
            '<button data-a="was">Was geht jetzt nicht?</button>' +
            '<button data-a="zu" title="Ausblenden">✕</button>';
        d.addEventListener('click', e => {
            if (elVon(e)?.closest('[data-a="zu"]')) {
                d.remove();
                return;
            }
            if (!elVon(e)?.closest('[data-a="was"]'))
                return;
            const ziel = elVon(e);
            if (!ziel)
                return;
            const r = ziel.getBoundingClientRect();
            UI.menu('<div class="grp">Braucht eine Verbindung</div>' +
                NUR_MIT_NETZ.map(x => `<button><span class="mi">⚠</span>${x}</button>`).join('') +
                '<hr><div class="grp">Läuft weiter</div>' +
                ['Schreiben und Lesen', 'Datenbanken, Filter, Formeln', 'Suche und Vorlagen',
                    'Sicherung als Datei', 'Automationen im Gerät']
                    .map(x => `<button><span class="mi">✓</span>${x}</button>`).join(''), Math.max(10, r.left - 120), r.bottom + 6);
        });
        document.body.appendChild(d);
    };
    const verbindungUeberwachen = () => {
        verbindungAnzeigen(navigator.onLine);
        addEventListener('online', () => {
            verbindungAnzeigen(true);
            UI.toast('Verbindung ist wieder da');
            Wolke.abgleichen();
        });
        addEventListener('offline', () => { verbindungAnzeigen(false); });
    };
    const start = () => {
        workerAnmelden();
        angebotAnnehmen();
        telefonOberflaeche();
        verbindungUeberwachen();
        setTimeout(() => { abkuerzung(); geteiltes(); }, 500);
        if (istApple() && !istInstalliert())
            setTimeout(knopfZeigen, 1500);
    };
    return { start, installieren, anleitung, istInstalliert, istApple, istTelefon, tastenleiste,
        schubladeAuf, schubladeZu, knopfZeigen,
        verbindungAnzeigen, verbindungUeberwachen, NUR_MIT_NETZ };
})();
window.PWA = PWA;
