"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/schale/bedienung/selection-flow.ts (npm run bauen:ts). */
const SelectionFlow = (() => {
    const kitFeder = (name) => ({ dauer: RedionSpring.PRESETS[name].duration, schwung: RedionSpring.PRESETS[name].bounce });
    const FEDERN = { knapp: kitFeder('snappy'), druck: kitFeder('press') };
    const SCHRITT = 8;
    const bahnVon = (f, x0, v0) => {
        const bei = RedionSpring.solve(RedionSpring.fromPerceptual({ duration: f.dauer, bounce: f.schwung }), x0, 0, v0 * 1000);
        return t => { const z = bei(t / 1000); return { x: z.value, v: z.velocity / 1000 }; };
    };
    const ruheNach = (bahn, genau = 0.35, still = 0.02) => {
        for (let t = 0; t < 1200; t += SCHRITT) {
            const s = bahn(t);
            if (Math.abs(s.x) <= genau && Math.abs(s.v) <= still)
                return Math.max(t, SCHRITT * 4);
        }
        return 1200;
    };
    const DAUER = ruheNach(bahnVon(FEDERN.knapp, -1000, 0), 0.5);
    const OMEGA = (2 * Math.PI) / (FEDERN.knapp.dauer * 1000);
    const DEHNUNG_MAX = 0.24;
    const dehnungAus = (v) => 1 + Math.min(DEHNUNG_MAX, Math.abs(v) * 0.2);
    const STILL = () => ({ x: 0, v: 0 });
    const ruhend = (ziel) => ({ ziel, bahn: STILL, dauer: 0, dehnen: false, hub0: 1, hubBahn: STILL });
    const laeufe = new WeakMap();
    const ruhig = () => typeof AppEinstellung !== 'undefined' ? AppEinstellung.wenigBewegung()
        : !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
            || document.body?.dataset['bewegung'] === 'ruhig';
    const uhr = (l) => {
        if (!l.anim)
            return l.dauer;
        const t = l.anim.currentTime;
        return typeof t === 'number' ? t : l.dauer;
    };
    const stand = (flaeche) => {
        const l = laeufe.get(flaeche);
        if (l?.frei)
            return { ...l.frei };
        if (l && Number.isFinite(l.ziel)) {
            const t = uhr(l);
            const s = l.bahn(t);
            return { ort: l.ziel + s.x, tempo: s.v, hub: 1 + l.hubBahn(t).x };
        }
        const m = flaeche.style.transform.match(/translateX\((-?[\d.]+)px\)/);
        return { ort: m && m[1] ? Number(m[1]) : 0, tempo: 0, hub: 1 };
    };
    const folge = (flaeche, ziel, nachbar, sofort) => {
        const alt = laeufe.get(flaeche);
        if (alt && !alt.frei && alt.ziel === ziel)
            return;
        if (sofort || ruhig()) {
            alt?.anim?.cancel();
            flaeche.style.transform = 'translateX(' + ziel + 'px)';
            flaeche.style.removeProperty('--dehnung');
            flaeche.classList.remove('faehrt');
            laeufe.set(flaeche, ruhend(ziel));
            return;
        }
        const jetzt = stand(flaeche);
        alt?.anim?.cancel();
        const x0 = jetzt.ort - ziel;
        const v0 = jetzt.tempo;
        const hub0 = jetzt.hub;
        const dehnen = nachbar || !!alt?.frei;
        if (Math.abs(x0) < 0.5 && Math.abs(v0) < 0.01 && Math.abs(hub0 - 1) < 0.002) {
            flaeche.style.transform = 'translateX(' + ziel + 'px)';
            laeufe.set(flaeche, ruhend(ziel));
            return;
        }
        const bahn = bahnVon(FEDERN.knapp, x0, v0);
        const gehoben = Math.abs(hub0 - 1) >= 0.002;
        const hubBahn = gehoben ? bahnVon(FEDERN.druck, hub0 - 1, 0) : STILL;
        const dauer = Math.max(ruheNach(bahn), gehoben ? ruheNach(hubBahn, 0.0008, 0.00002) : 0);
        const bilder = [];
        for (let t = 0; t <= dauer; t += SCHRITT) {
            const s = bahn(t);
            const dehnung = dehnen ? dehnungAus(s.v) : 1;
            bilder.push({ transform: 'translateX(' + (ziel + s.x).toFixed(2) + 'px) scaleX(' + dehnung.toFixed(4) + ')'
                    + (gehoben ? ' scale(' + (1 + hubBahn(t).x).toFixed(4) + ')' : '') });
        }
        bilder.push({ transform: 'translateX(' + ziel + 'px) scaleX(1)' + (gehoben ? ' scale(1)' : '') });
        const anim = flaeche.animate(bilder, { duration: dauer, easing: 'linear', fill: 'forwards' });
        laeufe.set(flaeche, { ziel, bahn, dauer, dehnen, hub0, hubBahn, anim });
        flaeche.dataset['fluege'] = String(Number(flaeche.dataset['fluege'] ?? 0) + 1);
        flaeche.classList.add('faehrt');
        anim.finished.then(() => {
            if (laeufe.get(flaeche)?.anim !== anim)
                return;
            flaeche.style.transform = 'translateX(' + ziel + 'px)';
            anim.cancel();
            laeufe.set(flaeche, ruhend(ziel));
            flaeche.classList.remove('faehrt');
        }).catch(() => { });
    };
    const setze = (flaeche, ort, tempo, dehnung, hub) => {
        laeufe.get(flaeche)?.anim?.cancel();
        flaeche.style.transform = 'translateX(' + ort.toFixed(2) + 'px) scaleX(' + dehnung.toFixed(4) + ')'
            + ' scale(' + hub.toFixed(4) + ')';
        flaeche.classList.remove('faehrt');
        laeufe.set(flaeche, { ziel: NaN, bahn: STILL, dauer: 0, dehnen: true, hub0: hub, hubBahn: STILL,
            frei: { ort, tempo, hub } });
    };
    const fliege = (flaeche, von, nach, dehnen) => {
        if (!nach.width || !nach.height)
            return null;
        flaeche.style.left = nach.left + 'px';
        flaeche.style.top = nach.top + 'px';
        flaeche.style.width = nach.width + 'px';
        flaeche.style.height = nach.height + 'px';
        flaeche.style.transformOrigin = '0 0';
        const sx = von.width / nach.width;
        const sy = von.height / nach.height;
        const dx = von.left - nach.left;
        const dy = von.top - nach.top;
        if (ruhig()) {
            flaeche.style.transform = 'none';
            return null;
        }
        const waagerecht = Math.abs(dx) >= Math.abs(dy);
        const weit = Math.max(Math.abs(dx), Math.abs(dy), Math.abs(von.width - nach.width), Math.abs(von.height - nach.height), 1);
        const nah = waagerecht
            ? Math.abs(dx) <= 1.35 * Math.max(von.width, nach.width)
            : Math.abs(dy) <= 1.35 * Math.max(von.height, nach.height);
        const darf = dehnen ?? nah;
        const bahn = bahnVon(FEDERN.knapp, -weit, 0);
        const dauer = ruheNach(bahn, 0.5);
        const bilder = [];
        for (let t = 0; t <= dauer; t += SCHRITT) {
            const s = bahn(t);
            const rest = -s.x / weit;
            let kx = 1 + (sx - 1) * rest;
            let ky = 1 + (sy - 1) * rest;
            let tx = dx * rest;
            let ty = dy * rest;
            if (darf) {
                const d = dehnungAus(s.v);
                if (waagerecht) {
                    tx -= nach.width * kx * (d - 1) / 2;
                    kx *= d;
                }
                else {
                    ty -= nach.height * ky * (d - 1) / 2;
                    ky *= d;
                }
            }
            bilder.push({
                transform: 'translate(' + tx.toFixed(2) + 'px,' + ty.toFixed(2) + 'px)'
                    + ' scale(' + kx.toFixed(4) + ',' + ky.toFixed(4) + ')'
            });
        }
        bilder.push({ transform: 'none' });
        return flaeche.animate(bilder, { duration: dauer, easing: 'linear', fill: 'forwards' });
    };
    const gedrueckt = new WeakMap();
    const marke = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    const einsinken = () => { const v = parseFloat(marke('--motion-instant')); return v > 0 ? v : 80; };
    const kannSkalieren = () => 'scale' in document.documentElement.style;
    const drueckeEin = (el, tiefe = 0.9) => {
        if (!el || ruhig() || !kannSkalieren())
            return;
        const alt = gedrueckt.get(el);
        const von = alt ? (parseFloat(getComputedStyle(el).scale) || 1) : 1;
        alt?.anim.cancel();
        const anim = el.animate([{ scale: String(von) }, { scale: String(tiefe) }], { duration: einsinken(), easing: marke('--ease') || 'ease-out', fill: 'forwards' });
        gedrueckt.set(el, { anim, seit: performance.now() });
    };
    const lasseLos = (el) => {
        if (!el)
            return;
        const alt = gedrueckt.get(el);
        if (!alt || alt.seit < 0)
            return;
        const rest = einsinken() - (performance.now() - alt.seit);
        if (rest > SCHRITT) {
            if (!alt.wartet) {
                alt.wartet = true;
                setTimeout(() => lasseLos(el), rest);
            }
            return;
        }
        const jetzt = parseFloat(getComputedStyle(el).scale);
        const ab = Number.isFinite(jetzt) ? jetzt : 1;
        alt.anim.cancel();
        gedrueckt.delete(el);
        if (Math.abs(ab - 1) < 0.001)
            return;
        const bahn = bahnVon(FEDERN.druck, ab - 1, 0);
        const dauer = ruheNach(bahn, 0.0008, 0.00002);
        const bilder = [];
        for (let t = 0; t <= dauer; t += SCHRITT)
            bilder.push({ scale: (1 + bahn(t).x).toFixed(4) });
        bilder.push({ scale: '1' });
        const anim = el.animate(bilder, { duration: dauer, easing: 'linear' });
        gedrueckt.set(el, { anim, seit: -1 });
        anim.finished.then(() => { if (gedrueckt.get(el)?.anim === anim)
            gedrueckt.delete(el); })
            .catch(() => { });
    };
    const achse = (dx, dy, schwelle) => {
        const ax = Math.abs(dx), ay = Math.abs(dy);
        if (Math.max(ax, ay) < schwelle)
            return null;
        return ax >= ay ? 'x' : 'y';
    };
    const tempoMesser = () => {
        let proben = [];
        const FENSTER = 100;
        return {
            dazu(wert, zeit) {
                proben.push({ wert, zeit });
                const grenze = zeit - FENSTER * 4;
                while (proben.length > 2 && proben[0] && proben[0].zeit < grenze)
                    proben.shift();
            },
            tempo(jetzt) {
                const letzte = proben[proben.length - 1];
                const davor = proben[proben.length - 2];
                if (!letzte || !davor)
                    return 0;
                if (jetzt - letzte.zeit > FENSTER)
                    return 0;
                let bezug = letzte;
                for (let i = proben.length - 2; i >= 0; i--) {
                    const p = proben[i];
                    if (!p || letzte.zeit - p.zeit > FENSTER)
                        break;
                    bezug = p;
                }
                if (bezug === letzte) {
                    if (letzte.zeit - davor.zeit > FENSTER * 2)
                        return 0;
                    bezug = davor;
                }
                const dt = letzte.zeit - bezug.zeit;
                if (dt <= 0)
                    return 0;
                const v = (letzte.wert - bezug.wert) / dt;
                return Number.isFinite(v) ? v : 0;
            }
        };
    };
    const gummiband = (wert, min, max, weite) => {
        const band = (ueber) => (ueber * weite * 0.55) / (weite + 0.55 * Math.abs(ueber));
        if (wert < min)
            return min - band(min - wert);
        if (wert > max)
            return max + band(wert - max);
        return wert;
    };
    const rastpunkt = (ort, tempo, punkte, bremse = 0.98) => {
        const vs = tempo * 1000;
        const weiter = vs === 0 ? 0 : ((vs / 1000) * bremse) / (1 - bremse);
        const ziel = ort + weiter;
        let best = 0;
        punkte.forEach((p, i) => {
            if (Math.abs(p - ziel) < Math.abs((punkte[best] ?? p) - ziel))
                best = i;
        });
        if (Math.abs(vs) >= 300) {
            const richtung = Math.sign(vs);
            if (((punkte[best] ?? ort) - ort) * richtung < 0) {
                let vorn = -1, abstand = 0;
                punkte.forEach((p, i) => {
                    const d = (p - ort) * richtung;
                    if (d > 0 && (vorn === -1 || d < abstand)) {
                        vorn = i;
                        abstand = d;
                    }
                });
                if (vorn !== -1)
                    best = vorn;
            }
        }
        return best;
    };
    const UEBER_TIPP = 16;
    const ziehbar = (a) => {
        if (a.reihe.dataset['ziehbar'])
            return;
        a.reihe.dataset['ziehbar'] = 'an';
        const HUB = a.hub ?? 1.12;
        let zug = null;
        let gedrucktes = null;
        let schlucken = -Infinity;
        let schluckId = NaN;
        let eigenerKlick = false;
        const schlucke = (id) => { schlucken = performance.now(); schluckId = id; };
        const sichtbar = (k) => k.getClientRects().length > 0 && k.offsetWidth > 0;
        const malen = (z) => {
            if (!z.flaeche)
                return;
            if (a.flaeche)
                setze(z.flaeche, z.ort, z.tempo, z.dehnung, z.hub);
            else
                z.flaeche.style.transform = 'translateX(' + z.ort.toFixed(2) + 'px) scaleX('
                    + z.dehnung.toFixed(4) + ') scale(' + z.hub.toFixed(4) + ')';
        };
        const vorleuchten = (z) => {
            const mitte = z.ort + z.breite / 2;
            let best = null;
            let abstand = Infinity;
            for (let i = 0; i < z.mitten.length; i++) {
                const d = Math.abs((z.mitten[i] ?? 0) - mitte);
                if (d < abstand) {
                    abstand = d;
                    best = z.liste[i] ?? null;
                }
            }
            if (best === z.vorn)
                return;
            z.vorn?.removeAttribute('data-anvisiert');
            best?.setAttribute('data-anvisiert', '');
            z.vorn = best;
        };
        const takt = (jetzt) => {
            const z = zug;
            if (!z || !z.amZiehen)
                return;
            const dt = Math.min(48, Math.max(0, jetzt - z.zuletzt));
            z.zuletzt = jetzt;
            const erste = z.mitten[0] ?? 0, letzte = z.mitten[z.mitten.length - 1] ?? 0;
            const ziel = gummiband(z.finger - z.versatz, Math.min(erste, letzte), Math.max(erste, letzte), z.breite * 0.5) - z.breite / 2;
            if (z.zieht) {
                const s = bahnVon(FEDERN.knapp, z.ort - ziel, z.tempo)(dt);
                z.ort = ziel + s.x;
                z.tempo = s.v;
                if (Math.abs(z.ort - ziel) < 0.5 && Math.abs(z.tempo) < 0.3) {
                    z.zieht = false;
                    z.versatz = z.finger - (z.ort + z.breite / 2);
                }
            }
            else {
                z.ort = ziel;
                z.tempo = z.messer.tempo(jetzt);
            }
            const soll = ruhig() ? 1 : dehnungAus(z.tempo);
            z.dehnung = soll > z.dehnung ? soll : 1 + (z.dehnung - 1) * Math.pow(0.5, dt / 40);
            const hubSoll = ruhig() ? 1 : HUB;
            z.hub += (hubSoll - z.hub) * (1 - Math.pow(0.5, dt / 30));
            malen(z);
            vorleuchten(z);
            z.bild = requestAnimationFrame(takt);
        };
        const aufraeumen = (z) => {
            cancelAnimationFrame(z.bild);
            z.amZiehen = false;
            delete a.reihe.dataset['gehalten'];
            z.vorn?.removeAttribute('data-anvisiert');
            z.vorn = null;
            schlucke(z.id);
        };
        const abbrechen = () => {
            const z = zug;
            zug = null;
            lasseLos(gedrucktes);
            if (z?.ue) {
                schlucke(z.id);
                z.ue.cancel();
                return;
            }
            if (!z || !z.amZiehen || !z.flaeche)
                return;
            aufraeumen(z);
            if (a.flaeche)
                setze(z.flaeche, z.ort, 0, z.dehnung, z.hub);
            a.zurueck(a.gewaehlt(), z.flaeche);
        };
        a.reihe.addEventListener('pointerdown', (e) => {
            if (e.button !== 0 || zug?.amZiehen || zug?.ue)
                return;
            const liste = a.optionen().filter(sichtbar);
            const ziel = e.target instanceof Element ? e.target : null;
            const k = liste.find(o => ziel && o.contains(ziel)) || null;
            zug = null;
            if (!k)
                return;
            gedrucktes = a.zeichen ? a.zeichen(k) : null;
            drueckeEin(gedrucktes, 0.9);
            const aktiv = a.gewaehlt();
            const oben = a.hinauf ? a.reihe.getBoundingClientRect().top : 0;
            const spalte = a.hinauf ? k.getBoundingClientRect() : null;
            const kLinks = spalte?.left ?? 0, kRechts = spalte?.right ?? 0;
            if (!aktiv || !sichtbar(aktiv) || (a.nurAmGewaehlten && k !== aktiv)) {
                if (a.hinauf)
                    zug = {
                        id: e.pointerId, x0: e.clientX, y0: e.clientY, maus: e.pointerType === 'mouse',
                        zieht: false, amZiehen: false, nullX: 0, breite: 0, mitten: [], liste, aktiv: k, auf: false,
                        finger: 0, versatz: 0, ort: 0, tempo: 0, dehnung: 1, hub: 1, messer: tempoMesser(),
                        flaeche: null, zuletzt: performance.now(), bild: 0, vorn: null,
                        k, kLinks, kRechts, oben, hoch: false, ue: null, nurHinauf: true
                    };
                return;
            }
            const ar = aktiv.getBoundingClientRect();
            let nullX = ar.left;
            if (a.flaeche) {
                const rr = a.reihe.getBoundingClientRect();
                nullX = rr.left + a.reihe.clientLeft - a.reihe.scrollLeft;
            }
            const mitten = liste.map(o => { const r = o.getBoundingClientRect(); return r.left - nullX + r.width / 2; });
            const stehtBei = a.flaeche ? stand(a.flaeche) : { ort: 0, tempo: 0, hub: 1 };
            const finger = e.clientX - nullX;
            zug = {
                id: e.pointerId, x0: e.clientX, y0: e.clientY, maus: e.pointerType === 'mouse',
                zieht: false, amZiehen: false, nullX, breite: ar.width, mitten, liste, aktiv,
                auf: Math.abs(finger - (stehtBei.ort + ar.width / 2)) <= ar.width / 2,
                finger, versatz: 0, ort: stehtBei.ort, tempo: stehtBei.tempo,
                dehnung: 1, hub: stehtBei.hub, messer: tempoMesser(),
                flaeche: a.flaeche ?? null, zuletzt: performance.now(), bild: 0, vorn: null,
                k, kLinks, kRechts, oben, hoch: false, ue: null, nurHinauf: false
            };
        });
        const uebergeben = (z, e) => {
            if (!a.hinauf)
                return false;
            const zog = z.amZiehen;
            const k = zog ? (z.vorn ?? z.k) : z.k;
            if (zog) {
                cancelAnimationFrame(z.bild);
                z.vorn?.removeAttribute('data-anvisiert');
                z.vorn = null;
            }
            const ue = a.hinauf.nimm(k, zog ? 'aus-zug' : 'hoch', e.clientX, e.clientY);
            if (!ue) {
                if (zog) {
                    z.zuletzt = performance.now();
                    z.bild = requestAnimationFrame(takt);
                }
                return false;
            }
            if (zog)
                delete a.reihe.dataset['gehalten'];
            z.amZiehen = false;
            z.hoch = false;
            z.ue = ue;
            lasseLos(gedrucktes);
            try {
                a.reihe.setPointerCapture(e.pointerId);
            }
            catch { }
            window.getSelection()?.removeAllRanges();
            return true;
        };
        a.reihe.addEventListener('pointermove', (e) => {
            const z = zug;
            if (!z || e.pointerId !== z.id)
                return;
            if (z.ue) {
                z.ue.move(e.clientX, e.clientY);
                return;
            }
            if (e.pointerType !== 'touch' && e.buttons === 0) {
                abbrechen();
                return;
            }
            if (!z.amZiehen && !z.hoch) {
                const ax = achse(e.clientX - z.x0, e.clientY - z.y0, z.maus ? 2 : 10);
                if (ax === null)
                    return;
                if (ax === 'y') {
                    if (!(a.hinauf && e.clientY < z.y0)) {
                        zug = null;
                        lasseLos(gedrucktes);
                        return;
                    }
                    z.hoch = true;
                    lasseLos(gedrucktes);
                }
                else if (z.nurHinauf) {
                    zug = null;
                    lasseLos(gedrucktes);
                    return;
                }
                else {
                    z.amZiehen = true;
                    lasseLos(gedrucktes);
                    try {
                        a.reihe.setPointerCapture(e.pointerId);
                    }
                    catch { }
                    window.getSelection()?.removeAllRanges();
                    a.reihe.dataset['gehalten'] = '';
                    if (!z.flaeche && a.baue)
                        z.flaeche = a.baue(z.aktiv);
                    if (!z.flaeche) {
                        zug = null;
                        delete a.reihe.dataset['gehalten'];
                        return;
                    }
                    if (z.auf)
                        z.versatz = (e.clientX - z.nullX) - (z.ort + z.breite / 2);
                    else
                        z.zieht = true;
                    z.zuletzt = performance.now();
                    z.bild = requestAnimationFrame(takt);
                }
            }
            if (z.hoch && (e.clientX < z.kLinks || e.clientX > z.kRechts)) {
                zug = null;
                return;
            }
            if (a.hinauf && (z.hoch || z.amZiehen) && e.clientY < z.oben && z.y0 - e.clientY >= UEBER_TIPP
                && uebergeben(z, e))
                return;
            if (z.hoch)
                return;
            z.finger = e.clientX - z.nullX;
            z.messer.dazu(z.finger - z.versatz, e.timeStamp);
        });
        const loslassen = (e) => {
            const z = zug;
            if (!z || e.pointerId !== z.id)
                return;
            zug = null;
            lasseLos(gedrucktes);
            if (z.ue) {
                eigenerKlick = true;
                try {
                    z.ue.up(e.clientX, e.clientY);
                }
                finally {
                    eigenerKlick = false;
                }
                schlucke(z.id);
                return;
            }
            if (z.hoch) {
                eigenerKlick = true;
                try {
                    a.waehle(z.k, z.flaeche ?? a.flaeche ?? a.reihe);
                }
                finally {
                    eigenerKlick = false;
                }
                schlucke(z.id);
                return;
            }
            if (!z.amZiehen || !z.flaeche)
                return;
            aufraeumen(z);
            const tempo = z.zieht ? z.tempo : z.messer.tempo(e.timeStamp);
            const wahl = z.liste[rastpunkt(z.ort + z.breite / 2, tempo, z.mitten)] ?? null;
            const jetzt = a.gewaehlt();
            if (a.flaeche)
                setze(z.flaeche, z.ort, tempo, z.dehnung, z.hub);
            if (wahl && wahl !== jetzt) {
                eigenerKlick = true;
                try {
                    a.waehle(wahl, z.flaeche);
                }
                finally {
                    eigenerKlick = false;
                }
            }
            else {
                a.zurueck(jetzt, z.flaeche);
            }
        };
        a.reihe.addEventListener('pointerup', loslassen);
        a.reihe.addEventListener('pointercancel', (e) => {
            if (zug && e.pointerId === zug.id)
                abbrechen();
        });
        a.reihe.addEventListener('lostpointercapture', (e) => {
            if (e.target === a.reihe && zug && (zug.amZiehen || zug.ue) && e.pointerId === zug.id)
                abbrechen();
        });
        window.addEventListener('pointerdown', () => { schlucken = -Infinity; }, true);
        window.addEventListener('click', (e) => {
            if (eigenerKlick || performance.now() - schlucken >= 500)
                return;
            const aufReihe = e.target instanceof Node && a.reihe.contains(e.target);
            if (!aufReihe && e.pointerId !== schluckId)
                return;
            schlucken = -Infinity;
            e.preventDefault();
            e.stopPropagation();
        }, true);
        a.reihe.addEventListener('touchend', (e) => {
            if (performance.now() - schlucken < 300)
                e.stopPropagation();
        });
        window.addEventListener('keydown', (e) => {
            if (e.key !== 'Escape' || !(zug?.amZiehen || zug?.ue))
                return;
            e.preventDefault();
            e.stopPropagation();
            abbrechen();
        }, true);
    };
    const GEWAEHLT = '[aria-checked="true"],[aria-selected="true"],[aria-current="page"],' +
        '[aria-current="true"],[aria-pressed="true"],.on,.an,.is-active';
    const optionenIn = (reihe, gruppe = null) => {
        const je = reihe instanceof HTMLElement ? reihe.dataset['materialJe'] : undefined;
        return Array.from(reihe.children).filter((k) => k instanceof HTMLElement && k.matches('button,[role="tab"],[role="radio"]')
            && (!je || (gruppe !== null && k.dataset[je] === gruppe)));
    };
    const gewaehltIn = (reihe, gruppe = null) => optionenIn(reihe, gruppe).find(k => k.matches(GEWAEHLT)) || null;
    const traegerVon = (reihe) => {
        let t = reihe;
        while (t.parentElement && getComputedStyle(t).display === 'contents')
            t = t.parentElement;
        return t;
    };
    const DURCHSICHTIG = /^(transparent|rgba\([^)]*,\s*0\))$/;
    const reiheFluege = new WeakMap();
    const reiheSuchen = (name, rahmen) => {
        let beste = null;
        let abstand = Infinity;
        for (const r of Array.from(document.querySelectorAll('[data-material]'))) {
            if ((r.dataset['material'] || '') !== name)
                continue;
            const q = r.getBoundingClientRect();
            const d = Math.abs(q.left - rahmen.left) + Math.abs(q.top - rahmen.top);
            if (d < abstand) {
                abstand = d;
                beste = r;
            }
        }
        return beste;
    };
    const materialFliegen = (reihe, von, neu, gruppe = null, runde = 0) => {
        if (ruhig())
            return;
        const nach = neu.getBoundingClientRect();
        if (!nach.width || !nach.height || !von.width || !von.height)
            return;
        if (Math.abs(von.left - nach.left) < 1 && Math.abs(von.top - nach.top) < 1)
            return;
        const zeile = Math.abs(von.top - nach.top) < Math.max(von.height, nach.height) * 0.5;
        const spalte = Math.abs(von.left - nach.left) < Math.max(von.width, nach.width) * 0.5;
        if (!zeile && !spalte)
            return;
        const st = getComputedStyle(neu);
        const inhalt = !!(neu.style.background || neu.style.backgroundColor);
        const grund = inhalt ? 'transparent' : st.backgroundColor;
        const bild = inhalt ? 'none' : st.backgroundImage;
        const seiten = ['top', 'right', 'bottom', 'left'].map(s => ({
            s, w: parseFloat(st.getPropertyValue('border-' + s + '-width')) || 0,
            art: st.getPropertyValue('border-' + s + '-style'),
            farbe: st.getPropertyValue('border-' + s + '-color')
        }));
        const rand = seiten.some(r => r.w > 0 && r.art !== 'none' && !DURCHSICHTIG.test(r.farbe.trim()));
        if (DURCHSICHTIG.test(grund.trim()) && bild === 'none' && st.boxShadow === 'none' && !rand)
            return;
        const traeger = traegerVon(reihe);
        let start = von;
        const alt = reiheFluege.get(traeger);
        if (alt) {
            if (alt.flug.isConnected)
                start = alt.flug.getBoundingClientRect();
            alt.fertig();
        }
        const flug = document.createElement('i');
        flug.className = 'ru-flug';
        flug.setAttribute('aria-hidden', 'true');
        flug.style.backgroundColor = grund;
        flug.style.backgroundImage = bild;
        flug.style.borderRadius = st.borderRadius;
        flug.style.boxShadow = st.boxShadow;
        for (const r of seiten) {
            flug.style.setProperty('border-' + r.s, r.w + 'px ' + (r.art || 'none') + ' ' + r.farbe);
        }
        traeger.classList.add('ru-traeger');
        traeger.append(flug);
        const bezug = flug.offsetParent ?? traeger;
        const b = bezug.getBoundingClientRect();
        const lokal = (r) => ({
            left: r.left - b.left - bezug.clientLeft + bezug.scrollLeft,
            top: r.top - b.top - bezug.clientTop + bezug.scrollTop,
            width: r.width, height: r.height
        });
        neu.style.setProperty('--ru-grund', grund);
        neu.classList.add(inhalt ? 'ru-wartet-rand' : 'ru-wartet');
        const eintrag = { flug, ziel: neu, fertig: () => { } };
        reiheFluege.set(traeger, eintrag);
        eintrag.fertig = () => {
            if (reiheFluege.get(traeger) !== eintrag)
                return;
            reiheFluege.delete(traeger);
            neu.classList.add('ru-landet');
            neu.classList.remove('ru-wartet', 'ru-wartet-rand');
            neu.style.removeProperty('--ru-grund');
            flug.remove();
            traeger.classList.remove('ru-traeger');
            requestAnimationFrame(() => requestAnimationFrame(() => neu.classList.remove('ru-landet')));
        };
        const bahn = fliege(flug, lokal(start), lokal(nach));
        if (!bahn) {
            eintrag.fertig();
            return;
        }
        flug.dataset['fluege'] = '1';
        bahn.finished.then(eintrag.fertig).catch(() => { });
        setTimeout(eintrag.fertig, DAUER + 250);
        const name = reihe.dataset['material'] || '';
        let zuletzt = start;
        let rahmen = reihe.getBoundingClientRect();
        const wache = () => {
            if (reiheFluege.get(traeger) !== eintrag)
                return;
            if (flug.isConnected && neu.isConnected && reihe.isConnected) {
                zuletzt = flug.getBoundingClientRect();
                rahmen = reihe.getBoundingClientRect();
                requestAnimationFrame(wache);
                return;
            }
            eintrag.fertig();
            const andere = runde < 3 ? reiheSuchen(name, rahmen) : null;
            const ziel = andere ? gewaehltIn(andere, gruppe) : null;
            if (andere && ziel)
                materialFliegen(andere, zuletzt, ziel, gruppe, runde + 1);
        };
        requestAnimationFrame(wache);
    };
    const nachsehen = (m, runde) => {
        requestAnimationFrame(() => {
            const reihe = m.reihe.isConnected ? m.reihe : reiheSuchen(m.name, m.rahmen);
            const neu = reihe ? gewaehltIn(reihe, m.gruppe) : null;
            if (!reihe || !neu || neu === m.alt) {
                if (runde < 6)
                    nachsehen(m, runde + 1);
                return;
            }
            const q = reihe.getBoundingClientRect();
            if (m.von)
                materialFliegen(reihe, { left: m.von.left + q.left - m.rahmen.left,
                    top: m.von.top + q.top - m.rahmen.top, width: m.von.width, height: m.von.height }, neu, m.gruppe);
        });
    };
    const vormerken = (e) => {
        const ziel = e.target instanceof Element ? e.target : null;
        const reihe = ziel?.closest('[data-material]') ?? null;
        if (!reihe || !ziel || ruhig())
            return;
        const je = reihe.dataset['materialJe'];
        const knopf = Array.from(reihe.children).find(k => k.contains(ziel));
        const gruppe = je && knopf instanceof HTMLElement ? (knopf.dataset[je] ?? null) : null;
        if (je && gruppe === null)
            return;
        if (!optionenIn(reihe, gruppe).some(k => k.contains(ziel)))
            return;
        const alt = gewaehltIn(reihe, gruppe);
        const laufend = reiheFluege.get(traegerVon(reihe));
        const r = laufend?.flug.isConnected ? laufend.flug.getBoundingClientRect()
            : alt ? alt.getBoundingClientRect() : null;
        nachsehen({ name: reihe.dataset['material'] || '', reihe, rahmen: reihe.getBoundingClientRect(), gruppe,
            von: r ? { left: r.left, top: r.top, width: r.width, height: r.height } : null, alt }, 0);
    };
    document.addEventListener('click', vormerken, true);
    document.addEventListener('keydown', (e) => {
        if (/^(Arrow|Home$|End$)/.test(e.key))
            vormerken(e);
    }, true);
    const gleitLaeufe = new WeakMap();
    const gleitStand = (g) => {
        const t = g.anim && typeof g.anim.currentTime === 'number' ? g.anim.currentTime : g.dauer;
        const z = [g.ziel.left, g.ziel.top, g.ziel.width, g.ziel.height];
        return { werte: g.bahnen.map((b, k) => (z[k] ?? 0) + b(t).x), tempi: g.bahnen.map(b => b(t).v) };
    };
    const glide = (marke, nach, sofort = false) => {
        const alt = gleitLaeufe.get(marke);
        if (alt && !sofort && Math.abs(alt.ziel.left - nach.left) < 0.5 && Math.abs(alt.ziel.top - nach.top) < 0.5
            && Math.abs(alt.ziel.width - nach.width) < 0.5 && Math.abs(alt.ziel.height - nach.height) < 0.5)
            return;
        const jetzt = alt ? gleitStand(alt) : null;
        alt?.anim?.cancel();
        marke.style.left = nach.left + 'px';
        marke.style.top = nach.top + 'px';
        marke.style.width = nach.width + 'px';
        marke.style.height = nach.height + 'px';
        marke.style.transformOrigin = '0 0';
        const ruhe = () => {
            marke.style.transform = 'none';
            marke.classList.remove('faehrt');
            gleitLaeufe.set(marke, { ziel: nach, bahnen: [STILL, STILL, STILL, STILL], dauer: 0 });
        };
        if (!jetzt || sofort || ruhig() || !nach.width || !nach.height) {
            ruhe();
            return;
        }
        const z = [nach.left, nach.top, nach.width, nach.height];
        const bahnen = z.map((zk, k) => bahnVon(FEDERN.knapp, (jetzt.werte[k] ?? zk) - zk, jetzt.tempi[k] ?? 0));
        const [bx, by, bw, bh] = bahnen;
        const weg = Math.max(...bahnen.map(b => Math.abs(b(0).x)), ...bahnen.map(b => Math.abs(b(0).v) * 60));
        if (weg < 0.5) {
            ruhe();
            return;
        }
        const dauer = Math.max(...bahnen.map(b => ruheNach(b, 0.5)));
        const senkrecht = Math.abs(by(0).x) >= Math.abs(bx(0).x);
        const darf = senkrecht ? Math.abs(by(0).x) <= 1.35 * Math.max(nach.height, (jetzt.werte[3] ?? 0))
            : Math.abs(bx(0).x) <= 1.35 * Math.max(nach.width, (jetzt.werte[2] ?? 0));
        const bild = (t) => {
            const w = nach.width + bw(t).x, h = nach.height + bh(t).x;
            let kx = w / nach.width, ky = h / nach.height;
            let tx = bx(t).x, ty = by(t).x;
            if (darf) {
                const d = dehnungAus(senkrecht ? by(t).v : bx(t).v);
                if (senkrecht) {
                    ty -= h * (d - 1) / 2;
                    ky *= d;
                }
                else {
                    tx -= w * (d - 1) / 2;
                    kx *= d;
                }
            }
            return { transform: 'translate(' + tx.toFixed(2) + 'px,' + ty.toFixed(2) + 'px)'
                    + ' scale(' + kx.toFixed(4) + ',' + ky.toFixed(4) + ')' };
        };
        const bilder = [];
        for (let t = 0; t <= dauer; t += SCHRITT)
            bilder.push(bild(t));
        bilder.push({ transform: 'none' });
        const anim = marke.animate(bilder, { duration: dauer, easing: 'linear', fill: 'forwards' });
        gleitLaeufe.set(marke, { ziel: nach, bahnen, dauer, anim });
        marke.classList.add('faehrt');
        marke.dataset['fluege'] = String(Number(marke.dataset['fluege'] ?? 0) + 1);
        anim.finished.then(() => {
            if (gleitLaeufe.get(marke)?.anim !== anim)
                return;
            ruhe();
            anim.cancel();
        }).catch(() => { });
    };
    const lageIn = (traeger, el) => {
        let x = 0, y = 0;
        let e = el;
        while (e && e !== traeger) {
            x += e.offsetLeft;
            y += e.offsetTop;
            const p = e.offsetParent;
            if (p && p !== traeger) {
                x += p.clientLeft - p.scrollLeft;
                y += p.clientTop - p.scrollTop;
            }
            e = p;
        }
        if (e === traeger)
            return { left: x, top: y, width: el.offsetWidth, height: el.offsetHeight };
        const t = traeger.getBoundingClientRect(), r = el.getBoundingClientRect();
        return { left: r.left - t.left - traeger.clientLeft + traeger.scrollLeft,
            top: r.top - t.top - traeger.clientTop + traeger.scrollTop, width: r.width, height: r.height };
    };
    const markenVon = new WeakMap();
    const highlight = (liste, ziel, o = {}) => {
        let m = markenVon.get(liste);
        if (!m) {
            m = document.createElement('i');
            m.className = 'ru-marke' + (o.still ? ' ru-marke-still' : '');
            m.setAttribute('aria-hidden', 'true');
            if (o.taste) {
                const t = document.createElement('span');
                t.className = 'ru-marke-taste';
                t.textContent = o.taste;
                m.appendChild(t);
            }
            markenVon.set(liste, m);
        }
        liste.classList.add('ru-marke-traeger');
        if (m.parentElement !== liste)
            liste.prepend(m);
        if (!ziel || !ziel.isConnected || !ziel.offsetWidth) {
            m.hidden = true;
            return m;
        }
        const warDa = !m.hidden && gleitLaeufe.has(m);
        m.hidden = false;
        glide(m, lageIn(liste, ziel), !warDa);
        return m;
    };
    const gesehen = new WeakMap();
    const stagger = (liste, zeilen, schluessel) => {
        const vorher = gesehen.get(liste);
        const jetzt = new Set();
        const ruhe = ruhig();
        let n = 0;
        zeilen.forEach((z, k) => {
            const s = schluessel[k] ?? String(k);
            jetzt.add(s);
            if (ruhe || vorher?.has(s))
                return;
            if (n < 10) {
                z.classList.add('ru-kommt');
                z.style.setProperty('--ru-n', String(n));
            }
            n++;
        });
        gesehen.set(liste, jetzt);
    };
    const growFrom = (fenster, anker, rahmen) => {
        if (!anker || !anker.width || !anker.height || ruhig())
            return null;
        const { easing, duration } = RedionSpring.token('smooth');
        if (!(duration > 2))
            return null;
        fenster.classList.add('ru-waechst');
        const r = rahmen ?? fenster.getBoundingClientRect();
        if (!r.width || !r.height)
            return null;
        fenster.style.transformOrigin = '0 0';
        const von = 'translate(' + (anker.left - r.left).toFixed(1) + 'px,' + (anker.top - r.top).toFixed(1) + 'px)'
            + ' scale(' + (anker.width / r.width).toFixed(4) + ',' + (anker.height / r.height).toFixed(4) + ')';
        const inhalt = Math.min(duration, 460);
        Array.from(fenster.children).forEach(k => {
            if (k instanceof HTMLElement)
                k.animate([{ opacity: 0 }, { opacity: 0, offset: 0.3 }, { opacity: 1 }], { duration: inhalt, easing: 'linear' });
        });
        return fenster.animate([{ transform: von }, { transform: 'none' }], { duration, easing });
    };
    const gooLeihe = new WeakMap();
    const goo = (ebene, an) => {
        if (!an || ruhig()) {
            ebene.classList.remove('ru-goo-an');
            gooLeihe.get(ebene)?.();
            gooLeihe.delete(ebene);
            return false;
        }
        if (!gooLeihe.has(ebene) && typeof Linse !== 'undefined')
            gooLeihe.set(ebene, Linse.tropfenLeihen());
        ebene.classList.add('ru-goo-an');
        return true;
    };
    return {
        folge, fliege, setze, stand, ziehbar, ruhig,
        glide, highlight, stagger, growFrom, goo,
        druecke: { ein: drueckeEin, los: lasseLos },
        FEDERN, DAUER, OMEGA, DEHNUNG_MAX
    };
})();
window.SelectionFlow = SelectionFlow;
