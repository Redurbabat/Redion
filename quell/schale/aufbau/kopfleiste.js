"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/schale/aufbau/kopfleiste.ts (npm run bauen:ts). */
const Kopfleiste = (() => {
    const elVon = (e) => e.target instanceof Element ? e.target : null;
    const esc = (s) => String(s ?? '')
        .replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c] ?? c));
    let gebunden = {};
    const braucht = (name) => (...args) => {
        const fn = gebunden[name];
        if (typeof fn !== 'function') {
            throw new Error('Die Kopfleiste wurde ohne „' + name + '" gebunden. ' +
                'Die Kopfleiste.binde({ … }) gehört an den Anfang von App.start(), vor das erste Zeichnen.');
        }
        return fn(...args);
    };
    const binde = (teile) => { gebunden = Object.assign({}, gebunden, teile || {}); };
    const zeichneSeite = braucht('zeichneSeite');
    const zeichneBaum = braucht('zeichneBaum');
    const kiPanel = braucht('kiPanel');
    const oeffne = braucht('oeffne');
    const aktuelleSeite = braucht('aktuelleSeite');
    const volleBreite = braucht('volleBreite');
    const sonderJetzt = () => (typeof gebunden['sonder'] === 'function' ? gebunden['sonder']() : null);
    const COVER_GRUPPEN = [
        ['Farbe und Gradient', [
                '#e03e3e', '#ffdc49', '#2eaadc', '#f7f3ee',
                'linear-gradient(160deg,#7fd4d0,#e8c9b0)', 'linear-gradient(160deg,#ff2d78,#ff7bb0)',
                'linear-gradient(160deg,#e8845a,#e03e3e)', 'linear-gradient(160deg,#cfe3ee,#e8b9a8)',
                'linear-gradient(140deg,#2b6cb0,#e03e3e)', 'linear-gradient(140deg,#6d5bd0,#e255a1)',
                'linear-gradient(140deg,#c9a89a,#529cca)'
            ]],
        ['Verläufe und Flächen', [
                'linear-gradient(120deg,#2eaadc,#9a6dd7)', 'linear-gradient(120deg,#ffa344,#ff7369)',
                'linear-gradient(120deg,#4dab9a,#529cca)', 'linear-gradient(120deg,#37352f,#787774)',
                'linear-gradient(200deg,#529cca,#4dab9a)', 'linear-gradient(200deg,#ffdc49,#4dab9a)',
                '#9a6dd7', '#4dab9a'
            ]],
        ['Papier und Struktur', [
                'repeating-linear-gradient(45deg,#3a3a38,#3a3a38 6px,#403f3c 6px,#403f3c 12px)',
                'repeating-linear-gradient(90deg,#2f4858,#2f4858 4px,#33506080 4px,#33506080 8px)',
                'radial-gradient(circle at 30% 30%,#6b8f9c,#2f4858)',
                'radial-gradient(circle at 70% 20%,#c9b8a8,#6b5b4d)',
                'conic-gradient(from 200deg,#4dab9a,#529cca,#9a6dd7,#4dab9a)',
                'conic-gradient(from 20deg,#ffa344,#e03e3e,#9a6dd7,#ffa344)'
            ]],
        ['Rauschen', ['textur:nebel', 'textur:sand', 'textur:nacht']]
    ];
    const texturVon = (cover) => cover.startsWith('textur:') ? cover.slice(7).replace(/[^a-z]/g, '') : '';
    const coverWaehlen = (p) => {
        let reiter = 'galerie';
        const o = document.createElement('div');
        o.className = 'overlay cover-overlay';
        document.body.appendChild(o);
        const zeichne = () => {
            o.innerHTML =
                '<div class="cover-blatt">' +
                    '<div class="cb-kopf">' +
                    '<button class="cb-links" data-a="weg">Entfernen</button>' +
                    '<b>Seiten-Cover</b>' +
                    '<button class="cb-rechts" data-a="zu">Schliessen</button>' +
                    '</div>' +
                    '<div class="cb-reiter">' +
                    [['galerie', 'Galerie'], ['hoch', 'Hochladen'], ['link', 'Link']]
                        .map(([id, n]) => `<button data-r="${id}" class="${reiter === id ? 'on' : ''}">${n}</button>`).join('') +
                    '</div>' +
                    '<div class="cb-inhalt">' +
                    (reiter === 'galerie'
                        ? COVER_GRUPPEN.map(([name, liste]) => `<div class="cb-grp">${esc(name)}</div>` +
                            '<div class="cover-gitter">' +
                            liste.map((f) => {
                                const textur = texturVon(f);
                                const klassen = [textur ? 'cover-textur cover-textur-' + textur : '',
                                    p.cover === f ? 'on' : ''].filter(Boolean).join(' ');
                                return `<button data-c="${esc(f)}"` +
                                    (textur ? '' : ` style="background:${f}"`) +
                                    (klassen ? ` class="${klassen}"` : '') + '></button>';
                            }).join('') +
                            '</div>').join('')
                        : reiter === 'hoch'
                            ? '<div class="cb-mitte"><button class="cb-knopf" data-a="bild">Bild wählen</button>' +
                                '<div class="cb-hinweis">Bis 6 MB. Das Bild bleibt auf diesem Gerät.</div></div>'
                            : '<div class="cb-mitte"><input id="cb-link" placeholder="https://…">' +
                                '<button class="cb-knopf" data-a="linkok">Übernehmen</button>' +
                                '<div class="cb-hinweis">Die Adresse eines Bildes im Netz.</div></div>') +
                    '</div>' +
                    '</div>';
            if (typeof Textur !== 'undefined')
                o.querySelectorAll('.cover-textur').forEach(b => Textur.legen(b));
        };
        zeichne();
        o.addEventListener('click', e => {
            const r = elVon(e)?.closest('[data-r]');
            if (r?.dataset["r"]) {
                reiter = r.dataset["r"];
                zeichne();
                return;
            }
            const c = elVon(e)?.closest('[data-c]');
            if (c) {
                Store.updateBlock(p.id, { cover: c.dataset["c"] });
                o.remove();
                zeichneSeite();
                return;
            }
            if (elVon(e)?.closest('[data-a="weg"]')) {
                Store.updateBlock(p.id, { cover: '' });
                o.remove();
                zeichneSeite();
                return;
            }
            if (elVon(e)?.closest('[data-a="linkok"]')) {
                const v = (o.querySelector('#cb-link')?.value ?? '').trim();
                if (v) {
                    Store.updateBlock(p.id, { cover: v });
                    o.remove();
                    zeichneSeite();
                }
                return;
            }
            if (elVon(e)?.closest('[data-a="bild"]')) {
                const inp = document.createElement('input');
                inp.type = 'file';
                inp.accept = 'image/*';
                inp.addEventListener('change', () => {
                    const f = inp.files?.[0];
                    if (!f)
                        return;
                    if (f.size > 6 * 1024 * 1024) {
                        UI.toast('Bitte ein Bild unter 6 MB');
                        return;
                    }
                    const rd = new FileReader();
                    rd.onload = () => { Store.updateBlock(p.id, { cover: rd.result }); o.remove(); zeichneSeite(); };
                    rd.readAsDataURL(f);
                });
                inp.click();
                return;
            }
            if (elVon(e)?.closest('[data-a="zu"]') || e.target === o)
                o.remove();
        });
    };
    const fensterTitel = (text) => {
        const t = String(text ?? '').trim();
        document.title = t ? t + ' — Redion' : 'Redion';
    };
    const zeichne = (wrap, p) => {
        const art = typeof Seitenansicht !== 'undefined' ? Seitenansicht.art(p) : 'redion';
        const eigen = art === 'redion';
        if (p.cover && eigen) {
            const c = document.createElement('div');
            c.className = 'cover';
            const textur = texturVon(String(p.cover));
            if (textur) {
                c.classList.add('cover-textur', 'cover-textur-' + textur);
                if (typeof Textur !== 'undefined')
                    Textur.legen(c);
            }
            else {
                c.style.background = /^(#|[a-z-]*gradient\()/.test(p.cover)
                    ? p.cover : `url(${p.cover}) center/cover`;
            }
            wrap.appendChild(c);
        }
        const ico = document.createElement('div');
        ico.className = 'pg-icon';
        ico.textContent = p.icon || '📄';
        ico.addEventListener('click', () => UI.emojiWaehlen(ico, (e) => {
            Store.updateBlock(p.id, { icon: e });
            zeichneSeite();
            zeichneBaum();
        }));
        wrap.appendChild(ico);
        const t = document.createElement('div');
        t.id = 'title';
        t.setAttribute('role', 'heading');
        t.setAttribute('aria-level', '1');
        t.contentEditable = p.gesperrt ? 'false' : 'true';
        t.spellcheck = !!Store.getMeta('rechtschreib', false);
        t.textContent = p.text || '';
        fensterTitel(p.text);
        t.addEventListener('input', () => {
            Store.updateBlock(p.id, { text: t.textContent });
            fensterTitel(t.textContent);
            zeichneBaum();
        });
        t.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const erste = Store.childrenOf(p.id)[0];
                if (erste) {
                    const ct = document.querySelector(`[data-bid="${erste.id}"] .ct`);
                    if (ct)
                        ct.focus();
                }
                else {
                    const b = Store.addBlock(p.id, 'text');
                    zeichneSeite(b.id);
                }
            }
        });
        wrap.appendChild(t);
        if (p.gesperrt) {
            const h = document.createElement('div');
            h.className = 'sperrhinweis';
            h.innerHTML = '🔏 Diese Seite ist gegen Bearbeiten gesperrt. ' +
                '<button data-a="auf">Bearbeiten erlauben</button>';
            h.addEventListener('click', e => {
                if (elVon(e)?.closest('[data-a="auf"]')) {
                    Store.updateBlock(p.id, { gesperrt: false });
                    zeichneSeite();
                }
            });
            wrap.appendChild(h);
        }
        if (p.locked) {
            Werkzeuge.sperrAnsicht(p, wrap);
            return false;
        }
        if (!p.ohneTools && eigen) {
            const tools = document.createElement('div');
            tools.className = 'pg-tools';
            tools.setAttribute('role', 'group');
            tools.setAttribute('aria-label', 'Seitenwerkzeuge');
            const caption = document.createElement('span');
            caption.className = 'pg-tools-caption';
            caption.textContent = 'Seitenwerkzeuge';
            caption.setAttribute('aria-hidden', 'true');
            const z = (name) => {
                try {
                    return Register.symbole.alsSvg(name, 15);
                }
                catch {
                    return '';
                }
            };
            tools.innerHTML =
                '<button data-a="cover">' + z('image') + 'Cover</button>' +
                    '<button data-a="wide">' + (p.wide ? z('widthNarrow') + 'Normale Breite'
                    : z('widthWide') + 'Volle Breite') + '</button>' +
                    (DocumentMode.available(p)
                        ? '<button data-a="document">' + z('page') + (DocumentMode.active(p) ? 'Normale Seite' : 'Dokumentmodus') + '</button>'
                        : '') +
                    (p.schoolRoot ? '<button data-a="electrical">' + z('bolt') + 'Rechner</button>' : '') +
                    '<button data-a="font">' + z('typeface') + 'Schrift</button>' +
                    '<button data-a="vorlage">' + z('puzzle') + 'Vorlage</button>' +
                    '<button data-a="ai">' + z('sparkle') + 'Mit KI</button>';
            tools.prepend(caption);
            tools.addEventListener('click', e => {
                const b = elVon(e)?.closest('button[data-a]');
                if (!b)
                    return;
                const a = b.dataset.a;
                if (a === 'cover')
                    coverWaehlen(p);
                if (a === 'wide') {
                    volleBreite(p);
                }
                if (a === 'document')
                    DocumentMode.toggle(p);
                if (a === 'electrical')
                    Electrical.open(p);
                if (a === 'vorlage')
                    Werkzeuge.vorlageEinfuegen(p);
                if (a === 'font') {
                    const r = b.getBoundingClientRect();
                    const m = UI.menu('<button data-f="default">Standard</button>' +
                        '<button data-f="serif">Serif</button>' +
                        '<button data-f="mono">Monospace</button>' +
                        '<hr><button data-f="small">Kleiner Text an/aus</button>', r.left, r.bottom + 4);
                    m.addEventListener('click', ev => {
                        const f = elVon(ev)?.closest('button[data-f]');
                        if (!f)
                            return;
                        if (f.dataset.f === 'small')
                            Store.updateBlock(p.id, { small: !p.small });
                        else
                            Store.updateBlock(p.id, { font: f.dataset.f });
                        m.remove();
                        zeichneSeite();
                    });
                }
                if (a === 'ai')
                    kiPanel(true);
            });
            wrap.appendChild(tools);
            Rollrand.binde(tools, { art: 'mehr' });
        }
        return true;
    };
    let titelWaechter = null;
    let beobachtet = null;
    const titelBeobachten = () => {
        const bar = document.getElementById('topbar');
        const letzte = document.querySelector('#crumb > a:last-child');
        const scr = document.getElementById('scroll');
        const gross = document.querySelector('#page #title') ||
            document.querySelector('#page h1');
        const norm = (t) => (t || '').replace(/\s+/g, ' ').trim();
        const name = gross ? norm(gross.textContent) : '';
        const passt = !!(bar && letzte && scr && gross && name &&
            typeof IntersectionObserver !== 'undefined' &&
            norm(letzte.textContent).endsWith(name));
        if (passt && beobachtet && beobachtet.el === gross && beobachtet.name === name)
            return;
        titelWaechter?.disconnect();
        titelWaechter = null;
        beobachtet = null;
        if (!passt || !bar || !scr || !gross) {
            if (bar)
                delete bar.dataset['titelSichtbar'];
            return;
        }
        beobachtet = { el: gross, name };
        const verdeckt = Math.max(0, Math.round(bar.getBoundingClientRect().bottom - scr.getBoundingClientRect().top));
        titelWaechter = new IntersectionObserver(eintraege => {
            const e = eintraege[eintraege.length - 1];
            if (!e)
                return;
            if (e.isIntersecting)
                bar.dataset['titelSichtbar'] = '';
            else
                delete bar.dataset['titelSichtbar'];
        }, { root: scr, rootMargin: `-${verdeckt}px 0px 0px 0px`, threshold: 0 });
        titelWaechter.observe(gross);
    };
    const pfad = () => {
        pfadZeichnen();
        titelBeobachten();
    };
    const pfadZeichnen = () => {
        const sonder = sonderJetzt();
        const seiteId = aktuelleSeite();
        const c = document.getElementById('crumb');
        if (!c)
            return;
        const echteSeite = !sonder && !!seiteId && !!Store.getBlock(seiteId);
        for (const id of ['btn-page-menu', 'btn-fav']) {
            const k = document.getElementById(id);
            if (k)
                k.hidden = !echteSeite;
        }
        if (sonder) {
            c.innerHTML = '<a>' + esc(sonder.titel) + '</a>';
            return;
        }
        if (!seiteId) {
            c.innerHTML = '';
            return;
        }
        const jetzt = Store.getBlock(seiteId);
        const pfad = jetzt && jetzt.pfad === false ? [jetzt] : Store.pathOf(seiteId);
        c.innerHTML = pfad.map((p, i) => `<a data-id="${p.id}">${p.icon || ''} ${esc(p.text || 'Ohne Titel')}</a>` +
            (i < pfad.length - 1 ? '<span class="sep">/</span>' : '')).join('');
        c.querySelectorAll('a').forEach(a => a.addEventListener('click', () => oeffne(a.dataset['id'])));
        const p = Store.getBlock(seiteId);
        const zeichen = (id) => (typeof Register !== 'undefined' && Register.symbole)
            ? Register.symbole.alsSvg(id) : '';
        const stern = document.getElementById('btn-fav');
        if (stern && p) {
            if (typeof Merkzeichen !== 'undefined')
                Merkzeichen.markieren(stern, { an: !!p.favorite, name: p.text || 'Ohne Titel' });
            else {
                stern.innerHTML = zeichen('star');
                stern.classList.toggle('on', !!p.favorite);
            }
        }
        const kb = document.getElementById('btn-komm');
        if (kb && p) {
            const n = Kommentare.offeneAnzahl(p.id);
            kb.innerHTML = zeichen('chat') + (n ? '<span class="zaehler">' + esc(n) + '</span>' : '');
        }
        const schloss = document.getElementById('btn-lock');
        if (schloss && p) {
            schloss.innerHTML = zeichen(p.gesperrt ? 'lock' : 'lockOpen');
            schloss.classList.toggle('on', !!p.gesperrt);
            schloss.title = p.gesperrt ? 'Seite ist gesperrt — zum Entsperren klicken'
                : 'Seite gegen Bearbeiten sperren';
        }
        const blitz = document.getElementById('btn-auto');
        if (blitz && p) {
            const hatDb = Store.childrenOf(p.id).some((b) => b.type === 'database');
            blitz.style.display = hatDb ? '' : 'none';
        }
    };
    return { binde, zeichne, pfad, coverWaehlen };
})();
window.Kopfleiste = Kopfleiste;
