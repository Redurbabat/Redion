"use strict";
/* ============================================================================
 * chronik/chronik.js — das zweite Gehirn, in Redion sichtbar
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/bereiche/chronik/chronik.ts`. `npm run bauen:ts`
 * schreibt daraus diese Datei.
 * ==========================================================================*/
/* ===========================================================================
 * WAS DAS IST (E514)
 * ===========================================================================
 *
 * Redur, 9. September 2026:
 *
 *   „es sollte auch im Redion sichtbar sein: wenn ich bei der Redion in der
 *    Suche 'Red-ur' schreibe, sollte dort direkt die Daten sich öffnen, aber
 *    mit Zugangscode 733877, und dort solltest du die Graphen verwenden,
 *    3D-Ansichten und so."
 *
 * DIE DATEN KOMMEN AUS EINER QUELLE (§8). `chronik/chronik.json` hält sie;
 * `node chronik.mts` schreibt daraus UR.md, PROBLEME.md und `daten.ts`, das
 * dieser Bereich liest. Wer hier etwas anderes zeigt als in UR.md, hat einen
 * Fehler — nicht eine zweite Meinung.
 *
 * ══ DER CODE IST EIN TÜRSCHILD, KEIN SCHLOSS ═══════════════════════════════
 *
 * Das gehört an den Anfang und nicht ins Kleingedruckte: Redion ist ein
 * offenes Verzeichnis. Wer den Quelltext liest, findet die sechs Ziffern in
 * zehn Sekunden — sie stehen hier, im Klartext, weil sie hier stehen MÜSSEN:
 * die App läuft ohne Server, es gibt niemanden, der eine Prüfung vornehmen
 * könnte (§22). Ein Passwortfeld, das etwas anderes behauptet, wäre genau
 * das, was §33 verbietet: ein Versprechen, das nicht hält.
 *
 * Was der Code TATSÄCHLICH tut, ist das, wofür Redur ihn wollte: die Chronik
 * geht nicht versehentlich auf. Wer neben ihm sitzt und über die Schulter
 * schaut, sieht sie nicht, weil er ein Wort in die Suche getippt hat.
 *
 * Ein echtes Schloss gäbe es: dieselbe Verschlüsselung, die Redion für
 * verschlüsselte Seiten benutzt (AES-GCM, §19), mit einem Passwort, das nur
 * im Kopf steht. Das ist ein eigener Bogen und steht als L140.
 * ===========================================================================*/
const Chronik = (() => {
    const CODE = '733877';
    const M_OFFEN = 'chronik:offen'; /* nur für diese Sitzung gemerkt */
    const esc = (wert) => String(wert ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    const daten = () => window.ChronikDaten || { tage: [], probleme: [] };
    /** Passt der Suchtext auf die Chronik? „Red-ur", „redur", „red ur". */
    const trifft = (text) => /^\s*red[\s\-_]?ur\s*$/i.test(String(text ?? ''));
    /* ── Zahlen für die Graphen ────────────────────────────────────────────
       Sie werden GERECHNET, nicht abgeschrieben. Eine zweite Zahlenreihe
       neben den Tagen liefe mit ihnen auseinander (§8). */
    const zahlen = () => {
        const d = daten();
        const tage = (d.tage || []).map((t) => ({
            datum: String(t.datum || ''),
            titel: String(t.titel || ''),
            nachrichten: (t.nachrichten || []).length,
            commits: Number(t.zahlen?.commits) || 0,
            entscheidungen: Number(t.zahlen?.entscheidungen) || 0,
            pruefungen: Number(t.zahlen?.neuePruefungen) || 0,
            zusagen: Number(t.zahlen?.neueZusagen) || 0,
            arbeiten: (t.arbeit || []).length
        }));
        const schweren = { schwer: 0, mittel: 0, klein: 0, offen: 0 };
        (d.probleme || []).forEach((p) => {
            const s = String(p.schwere || 'klein');
            schweren[s] = (schweren[s] || 0) + 1;
        });
        return { tage, schweren, probleme: (d.probleme || []).length };
    };
    /* ── Ein Balkendiagramm, aus SVG, ohne Bibliothek ──────────────────────
       Kein Diagrammpaket: §6 verbietet unnötige Abhängigkeiten, und ein
       Balken ist ein Rechteck. Beschriftet wird jeder Balken, damit die
       Auskunft nicht nur in der Höhe steckt (§38). */
    const balken = (titel, reihen) => {
        const hoch = Math.max(1, ...reihen.map(r => r.wert));
        const b = 100 / Math.max(1, reihen.length);
        return `<figure class="chr-graph"><figcaption>${esc(titel)}</figcaption>` +
            `<svg viewBox="0 0 100 62" role="img" aria-label="${esc(titel)}: ` +
            esc(reihen.map(r => r.name + ' ' + r.wert).join(', ')) + '">' +
            reihen.map((r, i) => {
                const h = r.wert / hoch * 42;
                const x = i * b + b * 0.15, w = b * 0.7;
                return `<rect class="chr-balken" x="${x.toFixed(2)}" y="${(46 - h).toFixed(2)}" ` +
                    `width="${w.toFixed(2)}" height="${Math.max(0.6, h).toFixed(2)}" rx="0.8"></rect>` +
                    `<text class="chr-wert" x="${(x + w / 2).toFixed(2)}" y="${(44 - h).toFixed(2)}">${r.wert}</text>` +
                    `<text class="chr-name" x="${(x + w / 2).toFixed(2)}" y="54">${esc(r.name)}</text>`;
            }).join('') + '</svg></figure>';
    };
    /* ── Der 3D-Stapel ────────────────────────────────────────────────────
       Redur wollte „3D-Ansichten". Was hier räumlich ist, ist der STAPEL DER
       TAGE: jeder Tag eine Platte, hintereinander gestaffelt, und man dreht
       sie mit dem Zeiger. Das ist keine Zierde — die Tiefe SAGT etwas: wie
       viele Tage schon hinter uns liegen und wie dick jeder war.
  
       Reine CSS-Perspektive, kein WebGL (§6). Bei `prefers-reduced-motion`
       steht der Stapel still und liegt flach — die Auskunft bleibt dieselbe. */
    const stapel = () => {
        const z = zahlen();
        return '<div class="chr-3d" data-chr-3d><div class="chr-buehne">' +
            z.tage.map((t, i) => {
                /* DIE KANTE IST DIE ARBEIT DES TAGES, gedeckelt: bei 26 px wäre
                   sie breiter als der Text daneben und sagte nichts mehr. */
                const dick = Math.min(14, 3 + t.commits + t.arbeiten);
                return `<div class="chr-platte" style="--i:${i};--dick:${dick}px">` +
                    `<b>${esc(t.datum)}</b><span>${esc(t.titel)}</span>` +
                    `<i>${t.commits} Commits · ${t.arbeiten} Bögen · ${t.nachrichten} Nachrichten</i></div>`;
            }).join('') + '</div>' +
            '<p class="chr-fuss">Zeiger darüber bewegen dreht den Stapel. ' +
            'Die Dicke einer Platte ist die Arbeit des Tages.</p></div>';
    };
    /* ── Die Ansichten ────────────────────────────────────────────────────*/
    const uebersicht = () => {
        const z = zahlen();
        return '<div class="chr-raster">' +
            balken('Commits je Tag', z.tage.map((t) => ({ name: t.datum.slice(5), wert: t.commits }))) +
            balken('Nachrichten je Tag', z.tage.map((t) => ({ name: t.datum.slice(5), wert: t.nachrichten }))) +
            balken('Neue Prüfläufe je Tag', z.tage.map((t) => ({ name: t.datum.slice(5), wert: t.pruefungen }))) +
            balken('Probleme nach Schwere', Object.entries(z.schweren)
                .map(([k, v]) => ({ name: k, wert: v }))) +
            '</div>' + stapel();
    };
    const tageAnsicht = () => {
        const d = daten();
        return (d.tage || []).map((t) => {
            const n = (t.nachrichten || []).map((m, i) => `<details class="chr-nachricht"><summary><b>${i + 1}</b> ` +
                `<span class="chr-zeit">${esc(m.zeit)}</span> ` +
                `<span class="chr-anriss">${esc(String(m.wortlaut).slice(0, 90))}…</span></summary>` +
                `<blockquote class="chr-wort">${esc(m.wortlaut)}</blockquote>` +
                `<p><b>Gemeint:</b> ${esc(m.gemeint)}</p>` +
                `<p><b>Besser geschrieben:</b> ${esc(m.besser)}</p>` +
                `<p><b>Besserer Prompt:</b> ${esc(m.besserePrompt)}</p></details>`).join('');
            const a = (t.arbeit || []).map((x) => `<tr><td>${esc(x.was)}</td><td><code>${esc(x.vonCommit)}</code> → <code>${esc(x.bisCommit)}</code></td>` +
                `<td>${esc(x.zeitraum)}</td><td>${esc(x.dauer || '—')}</td></tr>`).join('');
            const m = (t.massnahmen || []).map((x) => `<tr><td>${esc(x.zeit)}</td><td>${esc(x.was)}</td><td>${esc(x.warum)}</td><td>${esc(x.risiko)}</td></tr>`).join('');
            return `<section class="chr-tag"><h3>${esc(t.datum)} · ${esc(t.wochentag)}</h3>` +
                `<p class="chr-titel">${esc(t.titel)}</p>` +
                (t.wasIchWeiss ? `<p class="chr-hinweis">${esc(t.wasIchWeiss)}</p>` : '') +
                (n ? `<h4>Was Redur geschrieben hat</h4>${n}` : '') +
                (a ? `<h4>Was gearbeitet wurde</h4><table class="chr-tab"><thead><tr>` +
                    `<th>Arbeit</th><th>von → bis</th><th>Zeitraum</th><th>Dauer</th></tr></thead>` +
                    `<tbody>${a}</tbody></table>` : '') +
                (t.groesstesProblem ? `<h4>Das grösste Problem</h4><p>${esc(t.groesstesProblem)}</p>` : '') +
                ((t.interessantesteAnfrage || t.interessantestes)
                    ? `<h4>Das Interessanteste</h4><p>${esc(t.interessantesteAnfrage || t.interessantestes)}</p>` : '') +
                (m ? `<h4>Massnahmen an den Daten</h4><table class="chr-tab"><thead><tr>` +
                    `<th>Zeit</th><th>Was</th><th>Warum</th><th>Risiko</th></tr></thead>` +
                    `<tbody>${m}</tbody></table>` : '') +
                '</section>';
        }).join('');
    };
    const problemAnsicht = () => {
        const d = daten();
        const zeichen = {
            schwer: '🔴', mittel: '🟠', klein: '🟡', offen: '⚪'
        };
        return (d.probleme || []).map((p) => {
            const felder = [
                ['Das Bild', 'symptom'], ['Die falsche Vermutung', 'falscheVermutung'],
                ['Wie es gefunden wurde', 'wieGefunden'], ['Wie gesucht wurde', 'wieGesucht'],
                ['Die Ursache', 'ursache'], ['Die Lösung', 'loesung'],
                ['Warum keine Uhr', 'warumKeineUhr'], ['Die Gegenrichtung', 'gegenrichtung'],
                ['Was es kostet', 'kosten'], ['Was offen ist', 'offen'],
                ['Was fehlt', 'wasFehlt'], ['Der Stand', 'stand'],
                ['Der Beweis', 'beweis'], ['Die Lehre', 'lehre']
            ];
            return `<details class="chr-problem" data-schwere="${esc(p.schwere)}">` +
                `<summary><span class="chr-ampel">${zeichen[String(p.schwere)] || '·'}</span> ` +
                `<b>${esc(p.nr)}</b> ${esc(p.titel)} ` +
                `<span class="chr-zeit">${esc(p.datum)}</span></summary>` +
                felder.filter(([, f]) => p[f]).map(([t, f]) => `<p><b>${esc(t)}.</b> ${esc(p[f])}</p>`).join('') +
                (p.entscheidung ? `<p class="chr-hinweis">Entscheidung: ${esc(p.entscheidung)}</p>` : '') +
                '</details>';
        }).join('');
    };
    const wissenAnsicht = () => {
        const d = daten();
        const r = d.ueberRedur || { wer: [], wieMitIhmArbeiten: [] };
        const a = d.arbeitsweise || { grundsaetze: [], wieIchPlane: [] };
        return '<section class="chr-tag"><h3>Über Redur</h3>' +
            '<ul>' + (r.wer || []).map((s) => `<li>${esc(s)}</li>`).join('') + '</ul>' +
            '<h4>Wie mit ihm gearbeitet wird</h4>' +
            '<ul>' + (r.wieMitIhmArbeiten || []).map((s) => `<li>${esc(s)}</li>`).join('') + '</ul>' +
            '</section><section class="chr-tag"><h3>' + esc(a.titel || 'Arbeitsweise') + '</h3>' +
            (a.grundsaetze || []).map((g, i) => `<h4>${i + 1}. ${esc(g.name)} <span class="chr-zeit">${esc(g.regel)}</span></h4>` +
                `<p>${esc(g.warum)}</p>`).join('') +
            '<h4>Die Reihenfolge, in der gearbeitet wird</h4><ol class="chr-plan">' +
            (a.wieIchPlane || []).map((s) => `<li>${esc(String(s).replace(/^\d+\.\s*/, ''))}</li>`).join('') +
            '</ol></section>';
    };
    const ANSICHTEN = [
        { id: 'uebersicht', name: 'Übersicht', bauen: uebersicht },
        { id: 'tage', name: 'Tage', bauen: tageAnsicht },
        { id: 'probleme', name: 'Probleme', bauen: problemAnsicht },
        { id: 'wissen', name: 'Redur & Arbeitsweise', bauen: wissenAnsicht }
    ];
    /* ── Das Fenster ──────────────────────────────────────────────────────*/
    let lage = null;
    const schliessen = () => { lage?.remove(); lage = null; };
    const zeigen = () => {
        schliessen();
        const d = daten();
        lage = document.createElement('div');
        lage.className = 'overlay chr-lage';
        lage.innerHTML =
            '<div class="chr-fenster" role="dialog" aria-modal="true" aria-label="Red-ur — die Chronik">' +
                '<header class="chr-kopf"><h2>Red-ur</h2>' +
                `<p>${d.tage.length} Tage · ${(d.probleme || []).length} Probleme · ` +
                'aus <code>chronik/chronik.json</code></p>' +
                '<button data-chr="zu" aria-label="Schliessen" title="Schliessen">✕</button></header>' +
                '<nav class="chr-reiter">' +
                ANSICHTEN.map((a, i) => `<button data-chr-ansicht="${a.id}"${i === 0 ? ' class="on"' : ''} ` +
                    `aria-pressed="${i === 0 ? 'true' : 'false'}">${esc(a.name)}</button>`).join('') +
                '</nav>' +
                '<div class="chr-inhalt" id="chr-inhalt">' + ANSICHTEN[0].bauen() + '</div>' +
                '</div>';
        document.body.appendChild(lage);
        const inhalt = lage.querySelector('#chr-inhalt');
        lage.addEventListener('click', (e) => {
            const ziel = e.target instanceof Element ? e.target : null;
            if (!ziel)
                return;
            if (ziel === lage || ziel.closest('[data-chr="zu"]')) {
                schliessen();
                return;
            }
            const reiter = ziel.closest('[data-chr-ansicht]');
            if (!reiter || !inhalt)
                return;
            const a = ANSICHTEN.find(x => x.id === reiter.dataset.chrAnsicht);
            if (!a)
                return;
            lage?.querySelectorAll('[data-chr-ansicht]').forEach(k => {
                const an = k === reiter;
                k.classList.toggle('on', an);
                k.setAttribute('aria-pressed', an ? 'true' : 'false');
            });
            inhalt.innerHTML = a.bauen();
            dreherBinden();
        });
        document.addEventListener('keydown', beiTaste);
        dreherBinden();
    };
    const beiTaste = (e) => {
        if (e.key !== 'Escape' || !lage)
            return;
        schliessen();
        document.removeEventListener('keydown', beiTaste);
    };
    /** Der Stapel dreht sich mit dem Zeiger — die einzige Bewegung, die
     *  etwas sagt: sie zeigt, dass die Platten hintereinander liegen. */
    const dreherBinden = () => {
        const kasten = lage?.querySelector('[data-chr-3d]');
        if (!kasten)
            return;
        const buehne = kasten.querySelector('.chr-buehne');
        if (!buehne)
            return;
        kasten.addEventListener('pointermove', (e) => {
            const r = kasten.getBoundingClientRect();
            const x = (e.clientX - r.left) / Math.max(1, r.width) - 0.5;
            const y = (e.clientY - r.top) / Math.max(1, r.height) - 0.5;
            buehne.style.setProperty('--dx', (x * 34).toFixed(1) + 'deg');
            buehne.style.setProperty('--dy', (-y * 18).toFixed(1) + 'deg');
        });
        kasten.addEventListener('pointerleave', () => {
            buehne.style.removeProperty('--dx');
            buehne.style.removeProperty('--dy');
        });
    };
    /* ── Die Tür ──────────────────────────────────────────────────────────*/
    const offen = () => {
        try {
            return sessionStorage.getItem(M_OFFEN) === '1';
        }
        catch {
            return false;
        }
    };
    /**
     * Öffnen — mit Code, wenn er in dieser Sitzung noch nicht kam.
     *
     * EINMAL JE SITZUNG, nicht einmal je Klick: wer die Chronik durchsieht,
     * geht zehnmal hinein und heraus. Beim nächsten Öffnen der App fragt sie
     * wieder.
     */
    const oeffnen = async () => {
        if (offen()) {
            zeigen();
            return true;
        }
        const eingabe = typeof Dialog !== 'undefined' && Dialog.frage
            ? await Dialog.frage('Red-ur — Zugangscode', '', 'passwort')
            : prompt('Red-ur — Zugangscode');
        if (eingabe === null || eingabe === undefined)
            return false;
        if (String(eingabe).trim() !== CODE) {
            if (typeof UI !== 'undefined')
                UI.toast('Der Code stimmt nicht.');
            return false;
        }
        try {
            sessionStorage.setItem(M_OFFEN, '1');
        }
        catch { /* dann eben je Klick */ }
        zeigen();
        return true;
    };
    /* Als Befehl in der Palette — derselbe Weg, denselben Namen (§8). */
    if (typeof Register !== 'undefined' && Register.befehle) {
        Register.befehle.melde({
            titel: 'Red-ur — die Chronik', gruppe: 'Redion',
            tun: () => { void oeffnen(); }
        });
    }
    return { trifft, oeffnen, zeigen, schliessen, zahlen, CODE_LAENGE: CODE.length };
})();
window.Chronik = Chronik;
