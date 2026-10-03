"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/bereiche/elektro/lernbilder.ts (npm run bauen:ts). */
const Elektrolernbilder = (() => {
    const esc = (s) => String(s ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    const ausSchreibweise = (schreibweise) => {
        const roh = String(schreibweise || '').replace(/\s+/g, ' ').trim();
        const teil = '([A-Za-zΦΩμµ][A-Za-z0-9₀₁₂₃ₙ_]*)';
        const produkt = new RegExp(`^${teil} = ${teil} · ${teil}$`);
        const bruch = new RegExp(`^${teil} = ${teil} / ${teil}$`);
        let oben = '', links = '', rechts = '';
        const mP = produkt.exec(roh);
        const mB = bruch.exec(roh);
        if (mP) {
            oben = mP[1];
            links = mP[2];
            rechts = mP[3];
        }
        else if (mB) {
            oben = mB[2];
            links = mB[1];
            rechts = mB[3];
        }
        else
            return null;
        if (oben === links || oben === rechts || links === rechts)
            return null;
        return {
            oben, links, rechts, formel: roh,
            ablesbar: [
                `${oben} = ${links} · ${rechts}`,
                `${links} = ${oben} / ${rechts}`,
                `${rechts} = ${oben} / ${links}`
            ]
        };
    };
    const alleDreiecke = () => {
        const R = (typeof Register !== 'undefined' && Register.elektroformeln)
            ? Register.elektroformeln : null;
        if (!R)
            return [];
        const raus = [];
        const gesehen = new Set();
        R.alle().forEach(f => {
            const d = ausSchreibweise(f.schreibweise);
            if (!d)
                return;
            const schluessel = [d.oben, d.links, d.rechts].slice().sort().join('|');
            if (gesehen.has(schluessel))
                return;
            gesehen.add(schluessel);
            raus.push(d);
        });
        return raus;
    };
    const dreieckSvg = (d, opt = {}) => {
        if (!d)
            return '';
        const b = opt.breite || 200;
        const h = Math.round(b * 0.88);
        const zu = opt.zeigeAuf;
        const feld = (name, x, y) => {
            const verdeckt = zu === name;
            return `<g class="fd-feld${verdeckt ? ' verdeckt' : ''}" data-groesse="${esc(name)}">` +
                `<circle cx="${x}" cy="${y}" r="${Math.round(b * 0.13)}" ` +
                `fill="${verdeckt ? 'currentColor' : 'transparent'}" opacity="${verdeckt ? '.18' : '1'}"/>` +
                `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central" ` +
                `font-size="${Math.round(b * 0.16)}" font-weight="700" ` +
                `fill="currentColor"${verdeckt ? ' opacity=".12"' : ''}>${esc(name)}</text></g>`;
        };
        const m = Math.round(b * 0.06);
        return `<svg class="fd-dreieck" viewBox="0 0 ${b} ${h}" width="${b}" height="${h}" ` +
            `role="img" aria-label="Formeldreieck ${esc(d.formel)}">` +
            `<path d="M${b / 2},${m} L${b - m},${h - m} L${m},${h - m} Z" ` +
            `fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" opacity=".55"/>` +
            `<line x1="${m + b * 0.08}" y1="${h * 0.54}" x2="${b - m - b * 0.08}" y2="${h * 0.54}" ` +
            `stroke="currentColor" stroke-width="1.5" opacity=".35"/>` +
            `<text x="${b / 2}" y="${h * 0.79}" text-anchor="middle" dominant-baseline="central" ` +
            `font-size="${Math.round(b * 0.1)}" fill="currentColor" opacity=".4">·</text>` +
            feld(d.oben, b / 2, h * 0.31) +
            feld(d.links, b * 0.29, h * 0.79) +
            feld(d.rechts, b * 0.71, h * 0.79) +
            `</svg>`;
    };
    const formelFuer = (d, groesse) => {
        if (!d)
            return '';
        if (groesse === d.oben)
            return d.ablesbar[0];
        if (groesse === d.links)
            return d.ablesbar[1];
        if (groesse === d.rechts)
            return d.ablesbar[2];
        return '';
    };
    const WURZEL2 = Math.SQRT2;
    const werte = (k) => {
        const scheitel = k.ueff * WURZEL2;
        const bogen = k.winkel * Math.PI / 180;
        return {
            scheitel,
            effektiv: k.ueff,
            momentan: scheitel * Math.sin(bogen),
            periode: k.f > 0 ? 1 / k.f : 0,
            zeit: k.f > 0 ? (k.winkel / 360) / k.f : 0
        };
    };
    const rund = (x, stellen = 1) => Number(x.toFixed(stellen));
    const kurveSvg = (k, opt = {}) => {
        const b = opt.breite || 720;
        const h = opt.hoehe || 300;
        const linksRand = 68, rechtsRand = 16, obenRand = 18, untenRand = 32;
        const zeichenB = b - linksRand - rechtsRand;
        const zeichenH = h - obenRand - untenRand;
        const mitte = obenRand + zeichenH / 2;
        const w = werte(k);
        const massstab = (zeichenH / 2) / (w.scheitel * 1.12);
        const yVon = (v) => mitte - v * massstab;
        const xVon = (grad) => linksRand + (grad / 360) * zeichenB;
        const punkte = [];
        for (let g = 0; g <= 360; g += 2)
            punkte.push(`${xVon(g).toFixed(1)},${yVon(w.scheitel * Math.sin(g * Math.PI / 180)).toFixed(1)}`);
        const px = xVon(k.winkel), py = yVon(w.momentan);
        const linie = (v, klasse, text) => `<line class="${klasse}" x1="${linksRand}" y1="${yVon(v).toFixed(1)}" ` +
            `x2="${b - rechtsRand}" y2="${yVon(v).toFixed(1)}"/>` +
            `<text class="sk-mass" x="${linksRand - 6}" y="${yVon(v).toFixed(1)}" ` +
            `text-anchor="end" dominant-baseline="central">${esc(text)}</text>`;
        return `<svg class="sk-kurve" viewBox="0 0 ${b} ${h}" width="${b}" height="${h}" ` +
            `role="img" aria-label="Sinuskurve, Effektivwert ${rund(k.ueff)} Volt">` +
            `<line class="sk-null" x1="${linksRand}" y1="${mitte}" x2="${b - rechtsRand}" y2="${mitte}"/>` +
            [90, 180, 270].map(g => `<line class="sk-teil" x1="${xVon(g).toFixed(1)}" y1="${obenRand}" ` +
                `x2="${xVon(g).toFixed(1)}" y2="${h - untenRand}"/>`).join('') +
            [0, 90, 180, 270, 360].map(g => `<text class="sk-grad" x="${xVon(g).toFixed(1)}" y="${h - untenRand + 16}" ` +
                `text-anchor="middle">${g}°</text>`).join('') +
            linie(w.scheitel, 'sk-scheitel', 'û ' + rund(w.scheitel)) +
            linie(w.effektiv, 'sk-effektiv', 'U ' + rund(w.effektiv)) +
            linie(-w.effektiv, 'sk-effektiv', '') +
            `<polyline class="sk-linie" points="${punkte.join(' ')}"/>` +
            `<line class="sk-lot" x1="${px.toFixed(1)}" y1="${mitte}" ` +
            `x2="${px.toFixed(1)}" y2="${py.toFixed(1)}"/>` +
            `<circle class="sk-punkt" cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="5"/>` +
            `<text class="sk-jetzt" x="${(px + 9).toFixed(1)}" y="${(py - 9).toFixed(1)}">` +
            `${rund(w.momentan)} V</text>` +
            `</svg>`;
    };
    const sinusFlaeche = (start = {}) => {
        const wurzel = document.createElement('div');
        wurzel.className = 'sk-wrap';
        const k = {
            ueff: start.ueff ?? 230,
            f: start.f ?? 50,
            winkel: start.winkel ?? 45
        };
        const male = () => {
            const w = werte(k);
            wurzel.innerHTML =
                `<div class="sk-bild">${kurveSvg(k)}</div>` +
                    `<div class="sk-regler">` +
                    `<label><span>Winkel</span>` +
                    `<input type="range" class="sk-winkel" min="0" max="360" step="1" ` +
                    `value="${k.winkel}" aria-label="Winkel in Grad"><b>${k.winkel}°</b></label>` +
                    `<label><span>Effektivwert</span>` +
                    `<input type="number" class="sk-ueff" min="1" max="1000" step="1" ` +
                    `value="${rund(k.ueff)}" aria-label="Effektivwert in Volt"><b>V</b></label>` +
                    `<label><span>Frequenz</span>` +
                    `<input type="number" class="sk-f" min="1" max="1000" step="1" ` +
                    `value="${rund(k.f)}" aria-label="Frequenz in Hertz"><b>Hz</b></label>` +
                    `</div>` +
                    `<div class="sk-zahlen">` +
                    `<div class="sk-zahl"><b>${rund(w.scheitel)} V</b>` +
                    `<span>Scheitelwert û = U · √2</span></div>` +
                    `<div class="sk-zahl"><b>${rund(w.effektiv)} V</b>` +
                    `<span>Effektivwert U — was auf dem Typenschild steht</span></div>` +
                    `<div class="sk-zahl"><b>${rund(w.momentan)} V</b>` +
                    `<span>Momentanwert u = û · sin ${k.winkel}°</span></div>` +
                    `<div class="sk-zahl"><b>${rund(w.periode * 1000, 2)} ms</b>` +
                    `<span>Periodendauer T = 1 / f</span></div>` +
                    `<div class="sk-zahl"><b>${rund(w.zeit * 1000, 2)} ms</b>` +
                    `<span>vergangene Zeit bei ${k.winkel}°</span></div>` +
                    `</div>`;
        };
        wurzel.addEventListener('input', e => {
            const f = e.target;
            const zahl = Number(f.value);
            if (!Number.isFinite(zahl))
                return;
            if (f.classList.contains('sk-winkel'))
                k.winkel = Math.max(0, Math.min(360, zahl));
            else if (f.classList.contains('sk-ueff'))
                k.ueff = Math.max(1, zahl);
            else if (f.classList.contains('sk-f'))
                k.f = Math.max(1, zahl);
            else
                return;
            const bild = wurzel.querySelector('.sk-bild');
            if (bild)
                bild.innerHTML = kurveSvg(k);
            const w2 = werte(k);
            const zahlen = wurzel.querySelectorAll('.sk-zahl b');
            const texte = wurzel.querySelectorAll('.sk-zahl span');
            const setze = (i, wert, text) => {
                const el = zahlen[i];
                if (el)
                    el.textContent = wert;
                if (text !== undefined) {
                    const t = texte[i];
                    if (t)
                        t.textContent = text;
                }
            };
            setze(0, rund(w2.scheitel) + ' V');
            setze(1, rund(w2.effektiv) + ' V');
            setze(2, rund(w2.momentan) + ' V', `Momentanwert u = û · sin ${k.winkel}°`);
            setze(3, rund(w2.periode * 1000, 2) + ' ms');
            setze(4, rund(w2.zeit * 1000, 2) + ' ms', `vergangene Zeit bei ${k.winkel}°`);
            const marke = wurzel.querySelector('.sk-regler b');
            if (marke)
                marke.textContent = k.winkel + '°';
        });
        male();
        return wurzel;
    };
    const dreieckFlaeche = () => {
        const wurzel = document.createElement('div');
        wurzel.className = 'fd-wrap';
        const liste = alleDreiecke();
        let wahl = 0;
        let zu = '';
        const male = () => {
            const d = liste[wahl] || null;
            wurzel.innerHTML =
                `<div class="fd-wahl">` + liste.map((x, i) => `<button class="fd-knopf${i === wahl ? ' an' : ''}" data-nr="${i}">` +
                    `${esc(x.oben)} = ${esc(x.links)} · ${esc(x.rechts)}</button>`).join('') +
                    `</div>` +
                    (d
                        ? `<div class="fd-bild">${dreieckSvg(d, zu ? { zeigeAuf: zu } : {})}</div>` +
                            `<p class="fd-hinweis">${zu
                                ? `Zugehalten: <b>${esc(zu)}</b> — abgelesen: <b>${esc(formelFuer(d, zu))}</b>`
                                : 'Eine Grösse antippen, um sie zuzuhalten — dann steht die Formel für sie da.'}</p>` +
                            `<ul class="fd-alle">` + d.ablesbar
                            .map(f => `<li>${esc(f)}</li>`).join('') + `</ul>`
                        : `<div class="ea-leer"><p>Es gibt keine Formel mit drei Grössen.</p></div>`);
        };
        wurzel.addEventListener('click', e => {
            const b = e.target.closest('[data-nr]');
            if (b) {
                wahl = Number(b.dataset.nr) || 0;
                zu = '';
                male();
                return;
            }
            const g = e.target.closest('[data-groesse]');
            if (!g)
                return;
            const name = g.dataset.groesse || '';
            zu = (zu === name) ? '' : name;
            male();
        });
        male();
        return wurzel;
    };
    if (typeof Register !== 'undefined' && Register.befehle) {
        Register.befehle.melde({
            titel: 'Elektro: Formeldreieck', gruppe: 'Elektro',
            tun: () => {
                if (typeof Elektroarbeitsplatz !== 'undefined')
                    Elektroarbeitsplatz.zeigeAls('Formeldreieck', dreieckFlaeche());
            }
        });
        Register.befehle.melde({
            titel: 'Elektro: Sinuskurve', gruppe: 'Elektro',
            tun: () => {
                if (typeof Elektroarbeitsplatz !== 'undefined')
                    Elektroarbeitsplatz.zeigeAls('Sinuskurve', sinusFlaeche());
            }
        });
    }
    return { ausSchreibweise, alleDreiecke, dreieckSvg, formelFuer, dreieckFlaeche,
        werte, kurveSvg, sinusFlaeche };
})();
window.Elektrolernbilder = Elektrolernbilder;
