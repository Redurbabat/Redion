"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/schale/aufbau/context-rail.ts (npm run bauen:ts). */
const Kontextkante = (() => {
    const WURZEL = 'kante';
    const LADE = 'kanten-lade';
    const amTelefon = () => {
        try {
            return window.matchMedia('(max-width: 760px)').matches;
        }
        catch {
            return false;
        }
    };
    const holen = (name) => {
        try {
            return globalThis[name];
        }
        catch {
            return undefined;
        }
    };
    const bereichJetzt = () => {
        let wo = 'leer';
        try {
            wo = String(App.schauplatz() || 'leer');
        }
        catch {
            wo = 'leer';
        }
        if (wo !== 'seite')
            return wo;
        try {
            if (document.body.classList.contains('dokument'))
                return 'pdf';
            const bloecke = [...document.querySelectorAll('#page .blk')];
            const mitDb = bloecke.filter(b => b.querySelector('.db'));
            if (mitDb.length && mitDb.length === bloecke.length)
                return 'datenbank';
        }
        catch { }
        return 'editor';
    };
    let offenerKnopf = '';
    let herkunft = null;
    const lade = () => document.getElementById(LADE);
    const ladeZu = (fokusZurueck = true) => {
        const l = lade();
        if (!l)
            return;
        l.hidden = true;
        l.replaceChildren();
        offenerKnopf = '';
        markiere();
        if (fokusZurueck && herkunft && document.contains(herkunft)) {
            try {
                herkunft.focus();
            }
            catch { }
        }
        herkunft = null;
    };
    const baumHeim = () => document.getElementById('sidebar');
    const baumZurueck = () => {
        const baum = document.getElementById('tree');
        const heim = baumHeim();
        if (!baum || !heim || baum.parentElement === heim)
            return;
        const fuss = heim.querySelector('.side-fuss');
        if (fuss)
            heim.insertBefore(baum, fuss);
        else
            heim.appendChild(baum);
    };
    const ladeAuf = (knopf, quelleKnopf) => {
        const l = lade();
        if (!l)
            return;
        baumZurueck();
        l.replaceChildren();
        const kopf = document.createElement('div');
        kopf.className = 'kl-kopf';
        const titel = document.createElement('b');
        titel.textContent = String(knopf.name || '');
        const zu = document.createElement('button');
        zu.type = 'button';
        zu.className = 'kl-zu';
        zu.setAttribute('aria-label', 'Schliessen (Esc)');
        zu.textContent = '✕';
        zu.addEventListener('click', () => ladeZu());
        kopf.appendChild(titel);
        kopf.appendChild(zu);
        l.appendChild(kopf);
        const koerper = document.createElement('div');
        koerper.className = 'kl-koerper';
        if (knopf.id === 'seiten') {
            const baum = document.getElementById('tree');
            if (baum) {
                koerper.appendChild(baum);
                try {
                    holen('Seitenleiste')?.zeichne?.();
                }
                catch { }
            }
            else {
                koerper.appendChild(satz('Der Seitenbaum ist gerade nicht da.'));
            }
        }
        else {
            const zeilen = Register.kontext.zeilen(knopf);
            if (!zeilen.length) {
                koerper.appendChild(satz('Hier steht gerade nichts.'));
            }
            else {
                for (const z of zeilen)
                    koerper.appendChild(zeile(z));
            }
        }
        l.appendChild(koerper);
        const stapel = Register.kontext.stapel();
        if (stapel.length) {
            const st = document.createElement('div');
            st.className = 'kl-stapel';
            const t = document.createElement('div');
            t.className = 'kl-grp';
            t.textContent = 'Arbeitsstapel';
            st.appendChild(t);
            for (const z of stapel.slice(0, 8))
                st.appendChild(zeile(z));
            l.appendChild(st);
        }
        if (Register?.symbole?.fuelle) {
            try {
                Register.symbole.fuelle(l);
            }
            catch { }
        }
        l.hidden = false;
        offenerKnopf = String(knopf.id || '');
        herkunft = quelleKnopf;
        markiere();
        if (!l.contains(document.activeElement)) {
            const erstes = l.querySelector('button, [tabindex]:not([tabindex="-1"])');
            erstes?.focus();
        }
    };
    const satz = (text) => {
        const d = document.createElement('p');
        d.className = 'kl-leer';
        d.textContent = text;
        return d;
    };
    const zeile = (z) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'kl-zeile' + (z.an ? ' ist-an' : '');
        if (z.an)
            b.setAttribute('aria-current', 'true');
        if (z.zeichen) {
            const s = document.createElement('span');
            s.dataset['sym'] = String(z.zeichen);
            b.appendChild(s);
        }
        const t = document.createElement('span');
        t.className = 'kl-t';
        const n = document.createElement('b');
        n.textContent = String(z.name || '');
        t.appendChild(n);
        if (z.unter) {
            const u = document.createElement('i');
            u.textContent = String(z.unter);
            t.appendChild(u);
        }
        b.appendChild(t);
        b.addEventListener('click', () => {
            try {
                z.tun();
            }
            catch { }
        });
        return b;
    };
    const markiere = () => {
        const w = document.getElementById(WURZEL);
        if (!w)
            return;
        w.querySelectorAll('.k-knopf').forEach(k => {
            const an = !!offenerKnopf && k.dataset['k'] === offenerKnopf;
            k.classList.toggle('ist-an', an);
            k.setAttribute('aria-expanded', an ? 'true' : 'false');
        });
    };
    const alleHauptOrte = () => {
        try {
            return (Register?.navigation?.alle?.() || [])
                .filter((e) => e && e.haupt === true && typeof e.tun === 'function')
                .sort((a, b) => (a.hauptRang ?? a.rang) - (b.hauptRang ?? b.rang));
        }
        catch {
            return [];
        }
    };
    const hauptOrte = () => alleHauptOrte().filter((e) => typeof Ruhig === 'undefined' || !Ruhig.an() || e.ruhig !== false);
    const weitereOrte = () => {
        let sichtbar = [];
        try {
            sichtbar = Array.from(document.querySelectorAll('#' + WURZEL + ' .k-ort'))
                .map(b => String(b.dataset['k'] || ''));
        }
        catch {
            sichtbar = [];
        }
        const schon = new Set(sichtbar.length
            ? sichtbar
            : hauptOrte().map((e) => String(e.id)));
        const raus = [];
        try {
            for (const g of (Register?.menueband?.orte?.() || [])) {
                for (const e of (g.eintraege || [])) {
                    const id = String(e?.id ?? '');
                    if (!id || schon.has(id) || typeof e.tun !== 'function')
                        continue;
                    raus.push({ id, name: String(e.name ?? id),
                        zeichen: String(e.zeichen ?? 'dots'),
                        unter: String(g.gruppe ?? ''), tun: e.tun });
                }
            }
        }
        catch { }
        return raus;
    };
    const MEHR_ORTE = { bereich: '*', id: 'mehr-orte', name: 'Mehr Orte',
        zeichen: 'compass', liefern: () => weitereOrte() };
    const ortJetzt = () => {
        const orte = alleHauptOrte();
        let adr = '';
        try {
            adr = String(location.hash || '');
        }
        catch {
            adr = '';
        }
        if (adr) {
            const genau = orte.find((e) => e.adresse && String(e.adresse) === adr);
            if (genau)
                return String(genau.id);
        }
        let wo = '';
        try {
            wo = String(App.schauplatz() || '');
        }
        catch {
            wo = '';
        }
        if (!wo)
            return '';
        const treffer = orte.find((e) => String(e.schauplatz || e.id) === wo);
        return treffer ? String(treffer.id) : '';
    };
    const SEITEN = { bereich: '*', id: 'seiten', name: 'Seiten',
        zeichen: 'page', liefern: () => [] };
    const FUSS = [
        { id: 'ki', name: 'Lokale KI', zeichen: 'sparkle',
            tun: () => { try {
                App.kiPanel(true);
            }
            catch { } } },
        { id: 'neu', name: 'Neu erstellen', zeichen: 'plus',
            tun: (b) => { try {
                App.erstellenBlatt(b);
            }
            catch { } } },
        { id: 'einstellungen', name: 'Einstellungen', zeichen: 'settings',
            tun: () => { try {
                holen('Einstellungen')?.oeffne?.();
            }
            catch { } } }
    ];
    const knopfBauen = (k, klasse) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'k-knopf ' + klasse;
        b.dataset['k'] = String(k.id);
        b.setAttribute('aria-label', String(k.name));
        b.title = String(k.name);
        const s = document.createElement('span');
        s.dataset['sym'] = String(k.zeichen || 'dots');
        b.appendChild(s);
        const beschriftung = document.createElement('span');
        beschriftung.className = 'k-beschriftung';
        beschriftung.textContent = String(k.name);
        beschriftung.setAttribute('aria-hidden', 'true');
        b.appendChild(beschriftung);
        b.addEventListener('click', () => {
            if (typeof k.liefern === 'function' || k.id === 'seiten') {
                if (offenerKnopf === String(k.id)) {
                    ladeZu();
                    return;
                }
                ladeAuf(k, b);
                if (typeof k.tun === 'function') {
                    try {
                        k.tun(b);
                    }
                    catch { }
                }
                return;
            }
            try {
                k.tun(b);
            }
            catch { }
        });
        return b;
    };
    const KNOPF_PLATZ = 44;
    const werkzeugeAnpassen = (oben, knoepfe, platz) => {
        let hoehe = 0;
        try {
            hoehe = platz === undefined ? oben.clientHeight : platz;
            if (platz === undefined && oben.scrollHeight - oben.clientHeight <= 2)
                return;
        }
        catch {
            return;
        }
        if (hoehe < KNOPF_PLATZ * 2)
            hoehe = KNOPF_PLATZ * 2;
        if (typeof Ruhig !== 'undefined' && Ruhig.an())
            hoehe = KNOPF_PLATZ * 2;
        const zeigen = Math.max(0, Math.floor(hoehe / KNOPF_PLATZ) - 2);
        if (zeigen >= knoepfe.length)
            return;
        const rest = knoepfe.slice(zeigen);
        oben.replaceChildren();
        oben.appendChild(knopfBauen(SEITEN, 'k-seiten'));
        for (const k of knoepfe.slice(0, zeigen)) {
            oben.appendChild(knopfBauen(k, 'k-bereich'));
        }
        oben.appendChild(knopfBauen({
            bereich: '*', id: 'mehr-werkzeuge',
            name: typeof Ruhig !== 'undefined' && Ruhig.an() ? 'Werkzeuge'
                : rest.length + (rest.length === 1 ? ' weiteres Werkzeug' : ' weitere Werkzeuge'),
            zeichen: 'dots',
            liefern: () => rest.map((k) => ({
                id: k.id, name: k.name, zeichen: k.zeichen,
                tun: () => {
                    if (typeof k.tun === 'function') {
                        try {
                            k.tun();
                        }
                        catch { }
                    }
                    else {
                        ladeAuf(k, null);
                    }
                }
            }))
        }, 'k-bereich k-mehr'));
        if (Register?.symbole?.fuelle) {
            try {
                Register.symbole.fuelle(oben);
            }
            catch { }
        }
    };
    const kanteAnpassen = (w, oben, orte, knoepfe) => {
        const hoch = (el) => el ? Math.ceil(el.getBoundingClientRect().height) : 0;
        let ganz = 0;
        try {
            ganz = w.clientHeight;
        }
        catch {
            return;
        }
        if (!ganz)
            return;
        const frei = ganz - hoch(w.querySelector('.k-unten'));
        const werkzeugePassend = (budget) => {
            let platz = budget;
            for (let runde = 0; runde < 12; runde++) {
                werkzeugeAnpassen(oben, knoepfe, Math.max(0, platz));
                if (oben.scrollHeight - oben.clientHeight <= 1)
                    return;
                platz -= KNOPF_PLATZ;
                if (platz < KNOPF_PLATZ * 2)
                    return;
            }
        };
        werkzeugePassend(frei - hoch(orte));
        if (w.scrollHeight - w.clientHeight <= 1)
            return;
        const orteZahl = orte.children.length;
        if (orteZahl <= 2)
            return;
        const hier = ortJetzt();
        const behalten = [];
        for (const kind of Array.from(orte.children)) {
            const id = kind.dataset['k'] || '';
            if (id === 'mehr-orte' || (hier && id === hier))
                behalten.push(kind);
        }
        if (behalten.length < 2 && orte.children[0])
            behalten.unshift(orte.children[0]);
        orte.replaceChildren(...behalten);
        werkzeugePassend(frei - hoch(orte));
    };
    const zeichne = () => {
        const w = document.getElementById(WURZEL);
        if (!w)
            return;
        if (amTelefon()) {
            w.hidden = true;
            return;
        }
        const bereich = bereichJetzt();
        let knoepfe = [];
        try {
            knoepfe = Register.kontext.fuer(bereich) || [];
        }
        catch {
            knoepfe = [];
        }
        const ruhig = typeof Ruhig !== 'undefined' && Ruhig.an();
        if (ruhig)
            knoepfe = [...knoepfe, ...FUSS.filter(k => k.id === 'ki')];
        w.replaceChildren();
        w.hidden = false;
        w.dataset['bereich'] = bereich;
        const orte = document.createElement('div');
        orte.className = 'k-orte';
        const hier = ortJetzt();
        let gezeigt = false;
        for (const o of hauptOrte()) {
            const b = knopfBauen(o, 'k-ort');
            if (hier && String(o.id) === hier) {
                b.classList.add('ist-hier');
                b.setAttribute('aria-current', 'page');
                gezeigt = true;
            }
            orte.appendChild(b);
        }
        const mehr = knopfBauen(MEHR_ORTE, 'k-ort k-mehr');
        if (hier && !gezeigt) {
            mehr.classList.add('ist-hier');
            mehr.setAttribute('aria-current', 'page');
        }
        orte.appendChild(mehr);
        w.appendChild(orte);
        const oben = document.createElement('div');
        oben.className = 'k-oben';
        oben.appendChild(knopfBauen(SEITEN, 'k-seiten'));
        for (const k of knoepfe)
            oben.appendChild(knopfBauen(k, 'k-bereich'));
        w.appendChild(oben);
        const unten = document.createElement('div');
        unten.className = 'k-unten';
        for (const k of FUSS.filter(k => !ruhig || k.id === 'einstellungen')) {
            unten.appendChild(knopfBauen(k, 'k-fuss'));
        }
        w.appendChild(unten);
        if (Register?.symbole?.fuelle) {
            try {
                Register.symbole.fuelle(w);
            }
            catch { }
        }
        try {
            requestAnimationFrame(() => kanteAnpassen(w, oben, orte, knoepfe));
        }
        catch {
            kanteAnpassen(w, oben, orte, knoepfe);
        }
        if (offenerKnopf && !w.querySelector('.k-knopf[data-k="' + offenerKnopf + '"]')) {
            baumZurueck();
            ladeZu(false);
        }
        else {
            markiere();
        }
    };
    const schalten = () => {
        const w = document.getElementById(WURZEL);
        if (!w)
            return;
        if (amTelefon())
            return;
        const zu = w.hidden;
        w.hidden = !zu;
        if (!zu) {
            baumZurueck();
            ladeZu(false);
        }
        try {
            Store.setMeta('kanteZu', !zu);
        }
        catch { }
    };
    const ladeSchalten = () => {
        if (offenerKnopf) {
            baumZurueck();
            ladeZu();
            return;
        }
        const w = document.getElementById(WURZEL);
        const erster = w?.querySelector('.k-knopf');
        erster?.click();
    };
    let gebunden = false;
    const binde = () => {
        if (gebunden)
            return;
        const main = document.getElementById('main');
        if (!main)
            return;
        gebunden = true;
        const w = document.createElement('aside');
        w.id = WURZEL;
        w.setAttribute('role', 'toolbar');
        w.setAttribute('aria-orientation', 'vertical');
        w.setAttribute('aria-label', 'Werkzeuge dieses Bereichs');
        w.hidden = true;
        const l = document.createElement('div');
        l.id = LADE;
        l.setAttribute('role', 'region');
        l.setAttribute('aria-label', 'Ausklappbare Werkzeuge');
        l.hidden = true;
        const band = document.getElementById('menueband');
        if (band && band.nextSibling) {
            main.insertBefore(w, band.nextSibling);
            main.insertBefore(l, w.nextSibling);
        }
        else {
            main.insertBefore(w, main.firstChild);
            main.insertBefore(l, w.nextSibling);
        }
        document.addEventListener('keydown', (e) => {
            if (e.key !== 'Escape' || !offenerKnopf)
                return;
            if (document.querySelector('.overlay, .menu'))
                return;
            baumZurueck();
            ladeZu();
        });
        document.addEventListener('pointerdown', (e) => {
            if (!offenerKnopf)
                return;
            const ziel = e.target instanceof Element ? e.target : null;
            if (!ziel)
                return;
            if (ziel.closest('#' + LADE) || ziel.closest('#' + WURZEL))
                return;
            baumZurueck();
            ladeZu(false);
        });
        window.addEventListener('redion:schauplatz', () => zeichne());
        window.addEventListener('hashchange', () => zeichne());
        try {
            window.matchMedia('(max-width: 760px)').addEventListener('change', () => zeichne());
        }
        catch { }
        zeichne();
        try {
            if (Store.getMeta('kanteZu', false) === true && !amTelefon())
                w.hidden = true;
        }
        catch { }
    };
    return { binde, zeichne, schalten, ladeSchalten, bereichJetzt,
        ladeZu: () => { baumZurueck(); ladeZu(); },
        offen: () => !!offenerKnopf };
})();
window.Kontextkante = Kontextkante;
