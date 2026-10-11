"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/schale/aufbau/menueband.ts (npm run bauen:ts). */
const Menueband = (() => {
    const WURZEL = 'menueband';
    const merkeReiter = 'bandReiter';
    const merkeZuSeite = 'bandZu';
    const merkeZuWelt = 'bandZu:welt';
    const meta = (name, standard) => {
        if (typeof Store === 'undefined' || typeof Store.getMeta !== 'function')
            return standard;
        try {
            return Store.getMeta(name, standard);
        }
        catch {
            return standard;
        }
    };
    const setzeMeta = (name, wert) => {
        if (typeof Store === 'undefined' || typeof Store.setMeta !== 'function')
            return;
        try {
            Store.setMeta(name, wert);
        }
        catch { }
    };
    const reiterJetzt = () => String(meta(merkeReiter, 'start') || 'start');
    const seiteOffen = () => !!document.getElementById('title');
    const merkeZu = () => seiteOffen() ? merkeZuSeite : merkeZuWelt;
    const amTelefon = () => {
        try {
            return window.matchMedia('(max-width: 760px)').matches;
        }
        catch {
            return false;
        }
    };
    const zugeklappt = () => amTelefon() || meta(merkeZu(), true) === true;
    const fluechtig = (zu) => {
        const w = document.getElementById(WURZEL);
        if (!w)
            return;
        if (!zu) {
            const band = w.querySelector('.mb-band');
            if (band && !band.childElementCount) {
                bandFuellen(band, reiterJetzt());
                if (Register?.symbole?.fuelle) {
                    try {
                        Register.symbole.fuelle(band);
                    }
                    catch { }
                }
            }
        }
        w.classList.toggle('ist-zu', zu);
    };
    const zeichenIn = (wo, zeichen) => {
        if (Register?.symbole?.hat?.(zeichen)) {
            const s = document.createElement('span');
            s.dataset['sym'] = zeichen;
            wo.appendChild(s);
            return;
        }
        const s = document.createElement('span');
        s.className = 'mb-glyph';
        s.textContent = zeichen;
        s.setAttribute('aria-hidden', 'true');
        wo.appendChild(s);
    };
    const knopf = (e) => {
        const b = document.createElement('button');
        b.type = 'button';
        let gewaehlt = false;
        if (typeof e.an === 'function') {
            try {
                gewaehlt = e.an() === true;
            }
            catch {
                gewaehlt = false;
            }
        }
        b.className = 'mb-knopf' + (e.gross ? ' ist-gross' : '') + (gewaehlt ? ' ist-an' : '');
        if (gewaehlt)
            b.setAttribute('aria-pressed', 'true');
        else if (typeof e.an === 'function')
            b.setAttribute('aria-pressed', 'false');
        b.dataset['band'] = String(e.id);
        if (e.probe && (e.probe.farbe || e.probe.dicke)) {
            const pr = document.createElement('span');
            pr.className = 'mb-probe';
            if (e.probe.farbe) {
                pr.classList.add('ist-farbe');
                pr.style.background = String(e.probe.farbe);
            }
            else {
                pr.classList.add('ist-strich');
                const bar = document.createElement('i');
                bar.style.height = Math.max(2, Number(e.probe.dicke) * 2) + 'px';
                pr.appendChild(bar);
            }
            b.appendChild(pr);
        }
        else {
            zeichenIn(b, String(e.zeichen || '▫'));
        }
        const t = document.createElement('span');
        t.className = 'mb-name';
        t.textContent = String(e.name || '');
        b.appendChild(t);
        const satz = String(e.hinweis || e.name || '') +
            (e.kurz ? '  (' + String(e.kurz) + ')' : '');
        if (satz) {
            b.title = satz;
            b.setAttribute('aria-label', satz);
        }
        return b;
    };
    const gruppeZeichnen = (g) => {
        const kasten = document.createElement('div');
        kasten.className = 'mb-gruppe';
        kasten.dataset['gruppe'] = g.gruppe;
        const reihe = document.createElement('div');
        reihe.className = 'mb-reihe';
        g.eintraege.forEach(e => reihe.appendChild(knopf(e)));
        const titel = document.createElement('div');
        titel.className = 'kicker mb-gruppe-titel';
        titel.textContent = g.gruppe;
        kasten.append(reihe, titel);
        return kasten;
    };
    const bandFuellen = (band, reiter) => {
        band.replaceChildren();
        const gruppen = Register?.menueband?.inReiter?.(reiter) || [];
        if (!gruppen.length) {
            const leer = document.createElement('div');
            leer.className = 'mb-leer';
            leer.textContent = 'Hier ist gerade nichts verfügbar.';
            band.appendChild(leer);
            return;
        }
        gruppen.forEach((g, i) => {
            if (i) {
                const strich = document.createElement('div');
                strich.className = 'mb-trenner';
                strich.setAttribute('aria-hidden', 'true');
                band.appendChild(strich);
            }
            band.appendChild(gruppeZeichnen(g));
        });
        const mehr = document.createElement('button');
        mehr.type = 'button';
        mehr.className = 'mb-mehr';
        mehr.dataset['band'] = '__mehr';
        mehr.hidden = true;
        mehr.setAttribute('aria-haspopup', 'dialog');
        mehr.setAttribute('aria-label', 'Weitere Befehle');
        mehr.title = 'Weitere Befehle';
        const punkte = document.createElement('span');
        punkte.dataset['sym'] = 'dots';
        mehr.appendChild(punkte);
        band.appendChild(mehr);
    };
    const HOECHSTENS = 15;
    let imUeberlauf = [];
    const ueberlaufLayout = () => {
        const wurzel = document.getElementById(WURZEL);
        if (!wurzel || wurzel.classList.contains('ist-zu'))
            return;
        if (amTelefon())
            return;
        const band = wurzel.querySelector('.mb-band');
        const mehr = wurzel.querySelector('.mb-mehr');
        if (!band || !mehr)
            return;
        const knoepfe = [...band.querySelectorAll('.mb-knopf[data-band]')];
        const gruppen = [...band.querySelectorAll('.mb-gruppe')];
        const trenner = [...band.querySelectorAll('.mb-trenner')];
        knoepfe.forEach(k => { k.hidden = false; });
        gruppen.forEach(g => { g.hidden = false; });
        trenner.forEach(t => { t.hidden = false; });
        mehr.hidden = true;
        imUeberlauf = [];
        const versteckt = [];
        const verstecke = (i) => {
            const k = knoepfe[i];
            if (!k || k.hidden)
                return;
            k.hidden = true;
            versteckt.push(i);
            const g = k.closest('.mb-gruppe');
            if (g && !g.querySelector('.mb-knopf[data-band]:not([hidden])'))
                g.hidden = true;
        };
        const PLATZ_MEHR = 34;
        const passtNoch = (abzug) => {
            const sichtbar = knoepfe.filter(k => !k.hidden);
            const letzte = sichtbar[sichtbar.length - 1];
            if (!letzte)
                return true;
            const stil = getComputedStyle(band);
            const rechts = band.getBoundingClientRect().right
                - (parseFloat(stil.paddingRight) || 0)
                - (parseFloat(stil.borderRightWidth) || 0);
            return letzte.getBoundingClientRect().right <= rechts - abzug + 1;
        };
        const istProbe = (k) => !!k.querySelector('.mb-probe');
        const zaehlbar = knoepfe.filter(k => !istProbe(k));
        for (let n = zaehlbar.length - 1; n >= HOECHSTENS; n--) {
            const k = zaehlbar[n];
            if (k)
                verstecke(knoepfe.indexOf(k));
        }
        for (let i = Math.min(HOECHSTENS, knoepfe.length) - 1; i >= 0; i--) {
            if (passtNoch(versteckt.length ? PLATZ_MEHR : 0))
                break;
            verstecke(i);
        }
        for (let i = Math.min(HOECHSTENS, knoepfe.length) - 1; i >= 0 && versteckt.length && !passtNoch(PLATZ_MEHR); i--)
            verstecke(i);
        gruppen.forEach(g => {
            if (!g.querySelector('.mb-knopf[data-band]:not([hidden])'))
                g.hidden = true;
        });
        trenner.forEach(t => {
            const naechste = t.nextElementSibling;
            if (!naechste || naechste.hidden)
                t.hidden = true;
        });
        if (!versteckt.length)
            return;
        imUeberlauf = versteckt
            .sort((a, b) => a - b)
            .map(i => {
            const k = knoepfe[i];
            const id = k?.dataset['band'] || '';
            const gruppe = k?.closest('.mb-gruppe')?.dataset['gruppe'] || '';
            const eintrag = Register?.menueband?.eines?.(id);
            return eintrag ? { ...eintrag, gruppe: eintrag.gruppe || gruppe } : null;
        })
            .filter(Boolean);
        mehr.hidden = false;
        mehr.setAttribute('aria-label', imUeberlauf.length + ' weitere Befehle');
        mehr.title = imUeberlauf.length + ' weitere Befehle';
    };
    const ueberlaufBald = () => {
        try {
            requestAnimationFrame(() => ueberlaufLayout());
        }
        catch {
            ueberlaufLayout();
        }
    };
    let messUhr = null;
    const beobachten = () => {
        try {
            const b = new ResizeObserver(() => {
                if (messUhr)
                    clearTimeout(messUhr);
                messUhr = setTimeout(ueberlaufBald, 70);
            });
            const w = document.getElementById(WURZEL);
            if (w)
                b.observe(w);
        }
        catch { }
    };
    const ladeSchliessen = () => {
        const lade = document.getElementById('mb-mehr-lade');
        if (!lade)
            return;
        lade.remove();
        const mehr = document.querySelector('.mb-mehr');
        try {
            mehr?.focus();
        }
        catch { }
    };
    const ladeOeffnen = () => {
        if (document.getElementById('mb-mehr-lade')) {
            ladeSchliessen();
            return;
        }
        if (!imUeberlauf.length)
            return;
        const lade = document.createElement('div');
        lade.id = 'mb-mehr-lade';
        lade.setAttribute('role', 'dialog');
        lade.setAttribute('aria-modal', 'false');
        lade.setAttribute('aria-label', 'Weitere Befehle');
        const kopf = document.createElement('div');
        kopf.className = 'mbl-kopf';
        const reiterName = (Register?.menueband?.reiter?.() || [])
            .find((r) => r.id === reiterJetzt())?.name || '';
        kopf.textContent = reiterName ? 'Weitere Befehle — ' + reiterName : 'Weitere Befehle';
        lade.appendChild(kopf);
        let letzteGruppe = '';
        imUeberlauf.forEach(e => {
            if (e.gruppe && e.gruppe !== letzteGruppe) {
                letzteGruppe = e.gruppe;
                const t = document.createElement('div');
                t.className = 'kicker mbl-gruppe';
                t.textContent = e.gruppe;
                lade.appendChild(t);
            }
            const z = document.createElement('button');
            z.type = 'button';
            z.className = 'mbl-zeile';
            z.dataset['band'] = String(e.id);
            zeichenIn(z, String(e.zeichen || 'dots'));
            const name = document.createElement('span');
            name.className = 'mbl-name';
            name.textContent = String(e.name || e.id);
            z.appendChild(name);
            if (e.kurz) {
                const k = document.createElement('span');
                k.className = 'mbl-kurz';
                k.textContent = String(e.kurz);
                z.appendChild(k);
            }
            if (e.hinweis)
                z.title = String(e.hinweis);
            lade.appendChild(z);
        });
        const wurzel = document.getElementById(WURZEL);
        (wurzel || document.body).appendChild(lade);
        if (Register?.symbole?.fuelle) {
            try {
                Register.symbole.fuelle(lade);
            }
            catch { }
        }
        try {
            lade.querySelector('.mbl-zeile')?.focus();
        }
        catch { }
        lade.addEventListener('keydown', ev => {
            if (ev.key === 'Escape') {
                ev.stopPropagation();
                ladeSchliessen();
                return;
            }
            if (ev.key !== 'Tab')
                return;
            const drin = [...lade.querySelectorAll('button')];
            if (!drin.length)
                return;
            const erste = drin[0], letzte = drin[drin.length - 1];
            if (ev.shiftKey && document.activeElement === erste) {
                ev.preventDefault();
                letzte.focus();
            }
            else if (!ev.shiftKey && document.activeElement === letzte) {
                ev.preventDefault();
                erste.focus();
            }
        });
    };
    let gebunden = false;
    let beobachtet = false;
    let zielStand = '';
    const zielJetzt = () => {
        if (typeof Zeichenziel === 'undefined')
            return '';
        try {
            return [Zeichenziel.da(), Zeichenziel.jetzt(), Zeichenziel.jetztFarbe(),
                Zeichenziel.jetztDicke()].join('|');
        }
        catch {
            return '';
        }
    };
    const zeichne = () => {
        const wurzel = document.getElementById(WURZEL);
        if (!wurzel)
            return;
        zielStand = zielJetzt();
        const reiter = Register?.menueband?.reiter?.() || [];
        if (!reiter.length) {
            wurzel.hidden = true;
            wurzel.replaceChildren();
            return;
        }
        void seiteOffen;
        wurzel.hidden = false;
        sichtbarSetzen(!zugeklappt());
        let gewaehlt = reiterJetzt();
        if (!reiter.some((r) => r.id === gewaehlt))
            gewaehlt = String(reiter[0].id);
        const zu = zugeklappt();
        wurzel.classList.toggle('ist-zu', zu);
        wurzel.replaceChildren();
        const zeile = document.createElement('div');
        zeile.className = 'mb-reiter';
        const reiterliste = document.createElement('div');
        reiterliste.className = 'mb-tabs';
        reiterliste.setAttribute('role', 'tablist');
        reiterliste.setAttribute('aria-label', 'Menüband');
        const datei = document.createElement('button');
        datei.type = 'button';
        datei.id = 'mb-datei';
        datei.className = 'mb-datei';
        datei.textContent = 'Datei';
        datei.setAttribute('aria-haspopup', 'dialog');
        datei.title = 'Datei — sichern, drucken, weitergeben, Einstellungen';
        datei.addEventListener('click', () => {
            try {
                window.Backstage?.schalten?.();
            }
            catch { }
        });
        zeile.appendChild(datei);
        reiter.forEach((r) => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'mb-reiter-knopf';
            b.dataset['mbReiter'] = String(r.id);
            b.setAttribute('role', 'tab');
            const aktiv = r.id === gewaehlt;
            b.setAttribute('aria-selected', aktiv ? 'true' : 'false');
            b.tabIndex = aktiv ? 0 : -1;
            if (aktiv)
                b.classList.add('ist-an');
            zeichenIn(b, String(r.zeichen || 'dots'));
            const t = document.createElement('span');
            t.textContent = String(r.name || r.id);
            b.appendChild(t);
            reiterliste.appendChild(b);
        });
        zeile.appendChild(reiterliste);
        const platz = document.createElement('div');
        platz.className = 'mb-platz';
        zeile.appendChild(platz);
        const RECHTS = [
            ['mb-suche', 'search', 'Suchen (Strg + P)',
                () => { try {
                    App.suche();
                }
                catch { } }],
            ['mb-ki', 'sparkle', 'Lokale KI (Strg + J)',
                () => { try {
                    App.kiPanel(true);
                }
                catch { } }],
            ['mb-konto', '', 'Arbeitsbereich',
                () => {
                    try {
                        App.arbeitsbereich();
                    }
                    catch { }
                }]
        ];
        const rechts = document.createElement('div');
        rechts.className = 'mb-rechts';
        const glocke = document.createElement('button');
        glocke.type = 'button';
        glocke.id = 'mb-glocke';
        glocke.className = 'mb-rechts-knopf';
        glocke.hidden = true;
        glocke.setAttribute('aria-label', 'Posteingang');
        glocke.title = 'Posteingang';
        const glockenZeichen = document.createElement('span');
        glockenZeichen.dataset['sym'] = 'bell';
        glocke.appendChild(glockenZeichen);
        const glockenZahl = document.createElement('b');
        glockenZahl.className = 'glocke-zahl';
        glockenZahl.hidden = true;
        glockenZahl.setAttribute('aria-hidden', 'true');
        glocke.appendChild(glockenZahl);
        glocke.addEventListener('click', () => {
            try {
                Ansichten.posteingang();
            }
            catch { }
        });
        Hinweis.faecherBinden(glocke);
        rechts.appendChild(glocke);
        const arbeit = document.createElement('button');
        arbeit.type = 'button';
        arbeit.id = 'mb-auftraege';
        arbeit.className = 'mb-rechts-knopf mb-arbeit';
        arbeit.hidden = true;
        arbeit.setAttribute('aria-label', 'Was gerade läuft');
        arbeit.title = 'Was gerade läuft';
        const arbeitZeichen = document.createElement('i');
        arbeitZeichen.className = 'arb-kreisel';
        arbeitZeichen.setAttribute('aria-hidden', 'true');
        arbeit.appendChild(arbeitZeichen);
        const arbeitZahl = document.createElement('b');
        arbeitZahl.className = 'glocke-zahl';
        arbeitZahl.hidden = true;
        arbeitZahl.setAttribute('aria-hidden', 'true');
        arbeit.appendChild(arbeitZahl);
        arbeit.addEventListener('click', () => {
            try {
                AuftragsAnzeige.oeffnen();
            }
            catch { }
        });
        rechts.appendChild(arbeit);
        try {
            AuftragsAnzeige.anmelden();
            void AuftragsAnzeige.knopfFrisch();
        }
        catch { }
        RECHTS.forEach(([id, zeichen, titel, tun]) => {
            const b = document.createElement('button');
            b.type = 'button';
            b.id = id;
            b.className = 'mb-rechts-knopf' + (zeichen ? '' : ' mb-konto');
            b.title = titel;
            b.setAttribute('aria-label', titel);
            if (zeichen) {
                const z = document.createElement('span');
                z.dataset['sym'] = zeichen;
                b.appendChild(z);
            }
            else {
                const z = document.createElement('span');
                z.dataset['sym'] = 'workspace';
                b.appendChild(z);
                const punkt = document.createElement('i');
                punkt.className = 'wolke-punkt';
                punkt.hidden = true;
                punkt.setAttribute('aria-hidden', 'true');
                b.appendChild(punkt);
            }
            b.addEventListener('click', tun);
            rechts.appendChild(b);
        });
        zeile.appendChild(rechts);
        const klapp = document.createElement('button');
        klapp.type = 'button';
        klapp.className = 'mb-klapp';
        klapp.dataset['band'] = '__klapp';
        klapp.setAttribute('aria-expanded', zu ? 'false' : 'true');
        klapp.title = zu ? 'Menüband aufklappen' : 'Menüband zuklappen';
        klapp.setAttribute('aria-label', klapp.title);
        const wort = document.createElement('span');
        wort.className = 'mb-klapp-wort';
        wort.textContent = 'Werkzeuge';
        klapp.appendChild(wort);
        const pfeil = document.createElement('span');
        pfeil.dataset['sym'] = 'chevronD';
        klapp.appendChild(pfeil);
        rechts.insertBefore(klapp, rechts.firstChild);
        wurzel.appendChild(zeile);
        const band = document.createElement('div');
        band.className = 'mb-band';
        band.setAttribute('role', 'tabpanel');
        band.setAttribute('aria-label', 'Menüband: ' + gewaehlt);
        if (!zu)
            bandFuellen(band, gewaehlt);
        wurzel.appendChild(band);
        if (Register?.symbole?.fuelle) {
            try {
                Register.symbole.fuelle(wurzel);
            }
            catch { }
        }
        const an = wurzel.querySelector('.mb-reiter-knopf.ist-an');
        if (an) {
            try {
                an.scrollIntoView({ inline: 'nearest', block: 'nearest' });
            }
            catch { }
        }
        if (!gebunden) {
            binde(wurzel);
            gebunden = true;
        }
        const heim = wurzel.parentElement;
        if (heim) {
            const kopf = document.getElementById('topbar');
            const bis = Math.max(wurzel.offsetTop + wurzel.offsetHeight, kopf ? kopf.offsetTop + kopf.offsetHeight : 0);
            heim.style.setProperty('--inhalt-oben', bis + 'px');
        }
        glockeFrisch();
        wolkeFrisch();
        ladeSchliessen();
        ueberlaufBald();
        if (!beobachtet) {
            beobachten();
            beobachtet = true;
        }
    };
    const binde = (wurzel) => {
        wurzel.addEventListener('click', ereignis => {
            const ziel = ereignis.target instanceof Element ? ereignis.target : null;
            if (!ziel)
                return;
            const reiterKnopf = ziel.closest('[data-mb-reiter]');
            if (reiterKnopf) {
                const id = reiterKnopf.dataset['mbReiter'] || 'start';
                setzeMeta(merkeReiter, id);
                if (amTelefon()) {
                    zeichne();
                    fluechtig(false);
                    return;
                }
                if (zugeklappt())
                    setzeMeta(merkeZu(), false);
                zeichne();
                return;
            }
            const band = ziel.closest('[data-band]');
            if (!band)
                return;
            const id = band.dataset['band'] || '';
            if (id === '__mehr') {
                ladeOeffnen();
                return;
            }
            if (id === '__klapp') {
                if (amTelefon()) {
                    const w = document.getElementById(WURZEL);
                    fluechtig(!w?.classList.contains('ist-zu'));
                    return;
                }
                setzeMeta(merkeZu(), !zugeklappt());
                zeichne();
                return;
            }
            const eintrag = Register?.menueband?.eines?.(id);
            if (!eintrag)
                return;
            if (ziel.closest('#mb-mehr-lade'))
                ladeSchliessen();
            try {
                eintrag.tun();
            }
            catch (fehler) {
                const satz = fehler instanceof Error ? fehler.message : String(fehler);
                if (typeof UI !== 'undefined' && typeof UI.toast === 'function')
                    UI.toast(satz);
            }
            if (amTelefon())
                fluechtig(true);
        });
        document.addEventListener('pointerdown', ereignis => {
            if (!amTelefon())
                return;
            const w = document.getElementById(WURZEL);
            if (!w || w.classList.contains('ist-zu'))
                return;
            const ziel = ereignis.target instanceof Element ? ereignis.target : null;
            if (ziel && w.contains(ziel))
                return;
            fluechtig(true);
        });
        wurzel.addEventListener('keydown', ereignis => {
            const ziel = ereignis.target instanceof Element ? ereignis.target : null;
            const jetzt = ziel?.closest('[data-mb-reiter]');
            if (!jetzt)
                return;
            const alle = [...wurzel.querySelectorAll('[data-mb-reiter]')];
            const i = alle.indexOf(jetzt);
            if (i < 0)
                return;
            let zu = -1;
            if (ereignis.key === 'ArrowRight')
                zu = (i + 1) % alle.length;
            if (ereignis.key === 'ArrowLeft')
                zu = (i - 1 + alle.length) % alle.length;
            if (ereignis.key === 'Home')
                zu = 0;
            if (ereignis.key === 'End')
                zu = alle.length - 1;
            if (zu < 0)
                return;
            ereignis.preventDefault();
            const ziel2 = alle[zu];
            if (!ziel2)
                return;
            setzeMeta(merkeReiter, ziel2.dataset['mbReiter'] || 'start');
            if (amTelefon()) {
                zeichne();
                fluechtig(false);
            }
            else {
                setzeMeta(merkeZu(), false);
                zeichne();
            }
            document.querySelector(`#${WURZEL} [data-mb-reiter="${ziel2.dataset['mbReiter']}"]`)?.focus();
        });
    };
    const glockeFrisch = () => {
        let offen = 0;
        try {
            offen = (typeof Werkzeuge !== 'undefined' && Werkzeuge.meldungen
                ? Werkzeuge.meldungen() : [])
                .filter((m) => !m.gelesen).length;
        }
        catch { }
        const wort = offen ? 'Posteingang, ' + offen + ' ungelesen' : 'Posteingang';
        for (const id of ['mb-glocke', 'studio-glocke']) {
            const glocke = document.getElementById(id);
            if (!glocke)
                continue;
            glocke.hidden = !offen;
            const zahl = glocke.querySelector('.glocke-zahl');
            if (zahl) {
                zahl.textContent = offen > 99 ? '99+' : String(offen);
                zahl.hidden = !offen;
            }
            glocke.setAttribute('aria-label', wort);
            glocke.title = wort;
        }
    };
    let wolkeStand = null;
    const wolkeFrisch = () => {
        wolkeAn('mb-konto', 'Arbeitsbereich');
        wolkeAn('studio-account', 'Konto und Arbeitsbereich');
    };
    const wolkeAn = (id, grundname) => {
        const konto = document.getElementById(id);
        const punkt = konto?.querySelector('.wolke-punkt');
        if (!konto || !punkt)
            return;
        const z = wolkeStand;
        if (!z || !z.angemeldet) {
            punkt.hidden = true;
            konto.title = grundname;
            konto.setAttribute('aria-label', grundname);
            return;
        }
        const schlecht = String(z.fehler || z.fehlerDateien || '');
        punkt.hidden = false;
        punkt.className = 'wolke-punkt ' +
            (schlecht ? 'ist-fehler' : z.frage ? 'ist-frage'
                : z.laeuft ? 'ist-laeuft' : 'ist-gut');
        const name = z.konto && z.konto.name ? String(z.konto.name) : 'angemeldet';
        const stand = schlecht ? 'Abgleichfehler: ' + schlecht
            : z.frage ? 'Abgleich wartet auf eine Entscheidung (Mehr → Wolke)'
                : z.laeuft ? 'Abgleich läuft'
                    : z.letzter ? 'Letzter Abgleich ' + String(z.letzter).slice(11, 16)
                        : 'noch kein Abgleich';
        konto.title = grundname + ' · ' + name + ' · ' + stand;
        konto.setAttribute('aria-label', grundname + ' — Konto ' + name + ', ' + stand);
    };
    let warOffen = null;
    const beobachte = () => {
        const wo = document.getElementById('page');
        if (!wo || typeof MutationObserver === 'undefined')
            return;
        warOffen = seiteOffen();
        new MutationObserver(() => {
            const jetzt = seiteOffen();
            if (jetzt === warOffen)
                return;
            warOffen = jetzt;
            zeichne();
        }).observe(wo, { attributes: true, attributeFilter: ['class'],
            childList: true, subtree: true });
    };
    const start = () => {
        zeichne();
        beobachte();
        if (typeof Zeichenziel !== 'undefined' && typeof Zeichenziel.horche === 'function') {
            try {
                Zeichenziel.horche(() => { if (zielJetzt() !== zielStand)
                    zeichne(); });
            }
            catch { }
        }
        document.addEventListener('fullscreenchange', () => zeichne());
        if (typeof Ereignisse !== 'undefined' && typeof Ereignisse.horche === 'function') {
            const name = typeof ARTEN !== 'undefined' && ARTEN.ablageGeladen ? ARTEN.ablageGeladen : 'ablage.geladen';
            try {
                Ereignisse.horche(name, () => zeichne(), { nachreichen: true });
            }
            catch { }
        }
        document.addEventListener('redion:meldungen', glockeFrisch);
        glockeFrisch();
        if (typeof Wolke !== 'undefined' && typeof Wolke.beiAenderung === 'function') {
            try {
                Wolke.beiAenderung((z) => { wolkeStand = z; wolkeFrisch(); });
            }
            catch { }
        }
    };
    const zeige = (reiter) => {
        setzeMeta(merkeReiter, reiter);
        if (amTelefon()) {
            zeichne();
            fluechtig(false);
            return;
        }
        setzeMeta(merkeZu(), false);
        zeichne();
    };
    const sichtbarSetzen = (an) => {
        document.body.dataset.studioTools = an ? 'offen' : 'zu';
        const knopf = document.getElementById('studio-tools');
        const name = an ? 'Werkzeuge ausblenden' : 'Werkzeuge einblenden';
        knopf?.setAttribute('aria-expanded', String(an));
        knopf?.setAttribute('aria-label', name);
        if (knopf)
            knopf.title = name;
    };
    const aufklappen = () => { zeige(reiterJetzt()); };
    const schliessen = () => {
        if (amTelefon()) {
            fluechtig(true);
            return;
        }
        setzeMeta(merkeZu(), true);
        zeichne();
    };
    return { start, zeichne, zeige, aufklappen, schliessen, WURZEL,
        knopf, gruppeZeichnen };
})();
window.Menueband = Menueband;
