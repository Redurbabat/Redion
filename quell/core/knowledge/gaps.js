"use strict";
/* ============================================================================
 * core/knowledge/gaps.ts — was FEHLT, nicht was da ist
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/core/knowledge/gaps.ts`. `npm run bauen:ts` schreibt
 * daraus `quell/core/knowledge/gaps.js`.
 * ----------------------------------------------------------------------------
 * Redion kann heute sagen, was in einem Bestand steht: suchen, verweisen,
 * zählen, seit E285 auch ranken. Es kann nicht sagen, was NICHT darin steht.
 * Diese Datei beantwortet die zweite Frage, und zwar nur aus dem Bestand
 * selbst — keine KI, kein Netz, keine fremde Liste von „das sollte man
 * wissen". Was fehlt, verrät der Bestand durch die Löcher, die er schlägt.
 *
 * ─── DIE GEFAHR BEI GENAU DIESER SORTE FUNKTION ─────────────────────────────
 *
 * Eine Lückenliste findet IMMER etwas. Wer fünf Listen aneinanderhängt und
 * die Länge addiert, zeigt einem frischen Bestand mit drei Seiten „14
 * Wissenslücken" — und bringt dem Menschen bei, die Anzeige zu überlesen.
 * Genau dieser Fehler ist mir in derselben Woche zweimal passiert: die
 * Warnung, die bei gewöhnlichem Gebrauch anspringt (E284), und das `fehlt`,
 * das nie leer sein kann (E286).
 *
 * Deshalb trägt hier JEDER Fund eine STÄRKE von 0 bis 100, und gezählt wird
 * nur, was über der Schwelle liegt. Ein Geisterverweis, auf den fünf Seiten
 * zeigen, ist ein Fund. Ein Schlagwort, das einmal vorkommt, ist eine
 * Beobachtung. Beide werden gezeigt, aber nur der erste wird gezählt.
 *
 * ─── WAS SIE NICHT TUT ──────────────────────────────────────────────────────
 *
 * Sie liest nichts und schreibt nichts. Sie kennt weder `Store` noch die
 * Uhr — `jetzt` kommt als Zahl herein, damit sich „seit 200 Tagen nicht
 * angefasst" prüfen lässt, ohne 200 Tage zu warten. Sie kennt auch keinen
 * Bereich: der Aufrufer löst die Verweise auf (das kann nur `Links`, mit
 * Aliasen und Pfaden) und reicht das Ergebnis herein.
 * ==========================================================================*/
const KnowledgeGaps = (() => {
    const VORGABE = {
        schwelle: 40, verstaubtTage: 90, verstaubtRang: 45, jeArt: 30
    };
    const TAG_MS = 86400000;
    /** Tage zwischen einer ISO-Zeit und jetzt. Ohne Zeit: sehr lange her. */
    const tageSeit = (iso, jetzt) => {
        if (!iso)
            return 9999;
        const d = Date.parse(String(iso));
        if (!Number.isFinite(d))
            return 9999;
        return Math.max(0, Math.round((jetzt - d) / TAG_MS));
    };
    /* ------------------------------------------------------------------------
     * FRAGEN AUS EINEM TEXT
     *
     * Eine Frage im eigenen Text ist der ehrlichste Hinweis auf eine Lücke:
     * man hat sie selbst aufgeschrieben. Drei Sorten Text müssen aber
     * draussen bleiben, sonst besteht die Liste aus lauter Nicht-Lücken:
     *
     *   Überschriften        „## Warum kippt die Spannung?" ist die Gliederung
     *                        eines Textes, der die Antwort enthält.
     *   Code                 ein `?` in einem Ausdruck ist keine Frage.
     *   Karteikarten         eine Karteikarte IST eine Frage. Sie hier zu
     *                        listen hiesse, jedem Lernenden seine eigene
     *                        Kartei als Wissenslücke vorzuwerfen — der
     *                        sicherste Weg, die Liste unbrauchbar zu machen.
     *
     * Die ersten beiden erkennt diese Datei am Text. Die dritte kann sie
     * nicht: welcher Block eine Karteikarte ist, weiss nur der Aufrufer. Er
     * lässt solche Blöcke deshalb schon beim Sammeln weg.
     * ---------------------------------------------------------------------- */
    /**
     * Auszeichnungszeichen aus einem Text nehmen.
     *
     * Beim ERSTEN Hinsehen auf das fertige Fenster stand da wörtlich
     * „Statusübergänge** — von welchem Wert darf man zu welchem springen?"
     * und „*„Was würde Notion 10 000-mal besser machen?". Kein Prüflauf
     * konnte das melden: die Funde waren richtig, nur unlesbar. Genau dafür
     * ist §55.1 da.
     */
    const ohneMarkierung = (t) => String(t || '')
        .replace(/`([^`]*)`/g, '$1')
        .replace(/__(.+?)__/g, '$1')
        .replace(/[*~]/g, '')
        .replace(/\s{2,}/g, ' ')
        .trim();
    const fragenAus = (text) => {
        const gefunden = new Map();
        const merken = (roh, ganzeZeile) => {
            const t = ohneMarkierung(roh);
            if (t.length < 8)
                return;
            const alt = gefunden.get(t);
            /* Steht dieselbe Frage einmal allein und einmal eingebettet, gilt die
               stärkere Auskunft. */
            if (!alt || (ganzeZeile && !alt.ganzeZeile))
                gefunden.set(t, { text: t, ganzeZeile });
        };
        let inCode = false;
        for (const roh of String(text || '').split(/\r?\n/)) {
            const zeile = roh.replace(/^[\s>*+\-]+/, '').trim();
            if (/^```/.test(zeile)) {
                inCode = !inCode;
                continue;
            }
            if (inCode || !zeile || zeile.startsWith('#'))
                continue;
            if (zeile.length >= 8 && zeile.length <= 200 && zeile.endsWith('?')) {
                merken(zeile, true);
                continue;
            }
            /* Eine Frage mitten im Fliesstext: beginnt gross, endet auf `?`.
               Sie zählt WENIGER — siehe `staerkeFrage`. */
            for (const treffer of zeile.matchAll(/([A-ZÄÖÜ][^.?!\n]{6,180}\?)/g))
                merken(treffer[1] || '', false);
        }
        return [...gefunden.values()];
    };
    /* ------------------------------------------------------------------------
     * DIE STÄRKEN
     *
     * Sie stehen hier zusammen und nicht verstreut, weil sie das Einzige
     * sind, was diese Datei WERTET. Jede ist eine Behauptung, die man
     * bestreiten kann, und deshalb soll man sie an einer Stelle finden.
     * ---------------------------------------------------------------------- */
    /** Ein Geist: je mehr Seiten auf ihn zeigen, desto sicherer fehlt er. */
    const staerkeGeist = (referenzen) => Math.min(100, 40 + 20 * Math.max(0, referenzen - 1));
    /**
     * Ein mehrdeutiger Verweis ist immer stark. Er ist kein Hinweis, sondern
     * ein FEHLER: der Verweis führt irgendwohin, und niemand weiss wohin.
     * Ein falscher Weg ist schlimmer als ein fehlender.
     */
    const staerkeMehrdeutig = (kandidaten) => Math.min(100, 80 + 5 * Math.max(0, kandidaten - 2));
    /**
     * Ein Schlagwort mit einer einzigen Seite — UND SEIT WANN (E329,
     * L105 Punkt 5).
     *
     * Vorher gab diese Funktion die feste Zahl 25 zurück. Die Schwelle liegt
     * bei 40, also lag die Art IMMER darunter und wurde NIE gezählt. L105
     * nannte das beim Namen: „Damit sind sie beinahe Zierde — entweder sie
     * bekommen eine bessere Regel (etwa: ein Schlagwort, das einmal vorkommt
     * UND älter als ein Vierteljahr ist), oder sie entfallen."
     *
     * Genau diese Regel steht jetzt hier, und sie ist die richtige, weil sie
     * den Unterschied trifft, um den es geht: ein Schlagwort, das heute an
     * einer Seite steht, ist eine ANGEFANGENE Sache — morgen steht es an
     * dreien. Eines, das seit einem Vierteljahr an genau einer Seite steht,
     * ist eine liegengebliebene.
     *
     * Unter der Grenze bleibt es bei 25: gezeigt, nicht gezählt. Darüber
     * beginnt es bei der Schwelle und wächst langsam.
     *
     * DER DECKEL IST 55, UND ER IST AN DER INSEL GEEICHT — nicht am Geist.
     * Der erste Entwurf stand bei 70 mit der Begründung „damit ein einsames
     * Schlagwort nie einen Geistverweis überholt". Die Begründung war falsch,
     * und der Prüflauf sagte es sofort: `staerkeGeist(1)` ist 40, nicht mehr.
     * Ein Geist mit EINER Quelle ist eben auch nur eine schwache Aussage.
     *
     * Geeicht gehört es an die Insel (`staerkeInsel`, gedeckelt bei 55), denn
     * beide sagen dasselbe: hier liegt etwas, und niemand kümmert sich. Ein
     * Geist dagegen ist ein FEHLER — ein Verweis, der ins Leere zeigt — und
     * steigt mit jeder weiteren Quelle bis 100. Ab zwei Quellen (60) liegt er
     * über allem, was hier je herauskommen kann, und das ist die Ordnung, die
     * gemeint war.
     */
    const THEMA_TAGE = 90;
    const staerkeThema = (tage) => {
        if (!(tage >= THEMA_TAGE))
            return 25;
        return Math.min(55, 40 + 5 * Math.floor((tage - THEMA_TAGE) / 30));
    };
    /**
     * Eine Frage: je ausführlicher sie gestellt ist, desto eher war sie
     * ernst gemeint. „Wie geht das?" ist im Vorbeigehen hingeschrieben, ein
     * ganzer Satz nicht.
     *
     * Die Zahlen sind so gewählt, dass die Grenze bei rund dreissig Zeichen
     * liegt — das ist ungefähr die Länge, ab der ein deutscher Fragesatz ein
     * Satz ist und keine Einwendung. Mein erster Entwurf teilte durch sechs
     * und liess damit auch eine ausformulierte Frage unter der Schwelle: die
     * Art hätte es dann zwar gegeben, aber gezählt worden wäre sie nie.
     */
    const staerkeFrage = (laenge, ganzeZeile = true) => {
        const roh = Math.max(20, Math.min(70, 25 + Math.round(laenge / 2)));
        /* EINE FRAGE MITTEN IM SATZ IST MEIST KEINE OFFENE FRAGE.
           Das Fenster zeigte beim ersten Hinsehen dreimal Zeilen der Form
           „Die Antwort auf die Frage „Was würde X besser machen?" — also einen
           Satz, der die Frage ZITIERT und gleich beantwortet. Sie ganz
           wegzuwerfen wäre falsch (manchmal steht dort wirklich eine offene
           Frage), sie voll zu zählen aber auch: 26 der 33 gezählten Lücken
           waren solche Zeilen, und eine Liste, die zu vier Fünfteln aus
           Fehlalarm besteht, wird nicht gelesen.
           Sie bleibt also stehen — als schwache Beobachtung. */
        return ganzeZeile ? roh : Math.min(30, Math.round(roh / 2));
    };
    /**
     * Wichtig und lange nicht angefasst. Beides zählt: der Rang bestimmt,
     * wie hoch es geht, die Zeit, wie weit dorthin.
     */
    const staerkeVerstaubt = (rang, tage, grenzeTage) => {
        const ueber = Math.max(0, tage - grenzeTage);
        const zeit = Math.min(1, ueber / (grenzeTage * 2));
        return Math.round(Math.min(100, rang * (0.6 + 0.4 * zeit)));
    };
    /**
     * Eine Insel ist verdächtig, aber gewöhnlich: jede frisch angelegte
     * Seite ist eine. Erst wenn sie ALT ist und immer noch niemand auf sie
     * zeigt, ist sie ein Fund.
     */
    const staerkeInsel = (tage) => tage < 7 ? 10 : Math.min(55, 20 + Math.round(tage / 10));
    /* ---------------------------------------------------------------------- */
    const finden = (seiten, verweise, themen, opt = {}) => {
        const jetzt = typeof opt.jetzt === 'number' ? opt.jetzt : Date.now();
        const schwelle = typeof opt.schwelle === 'number' ? opt.schwelle : VORGABE.schwelle;
        const verstaubtTage = typeof opt.verstaubtTage === 'number'
            ? opt.verstaubtTage : VORGABE.verstaubtTage;
        const verstaubtRang = typeof opt.verstaubtRang === 'number'
            ? opt.verstaubtRang : VORGABE.verstaubtRang;
        const jeArtMax = typeof opt.jeArt === 'number' ? opt.jeArt : VORGABE.jeArt;
        const funde = [];
        const alleSeiten = (seiten || []).filter(s => s && s.id);
        /* Wieviel der Schnitt je Art weggelassen hat. Ein Schnitt, der sich
           verschweigt, liest sich wie Vollständigkeit — §35. */
        let abgeschnitten = 0;
        /* --- Geisterverweise: gemeinsam gezählt, nicht je Vorkommen ---------- */
        const geister = new Map();
        for (const v of verweise || []) {
            if (!v || v.status !== 'fehlt')
                continue;
            const schluessel = String(v.ziel || '').trim().toLocaleLowerCase('de');
            if (!schluessel)
                continue;
            if (!geister.has(schluessel))
                geister.set(schluessel, { ziel: String(v.ziel).trim(), von: new Map() });
            geister.get(schluessel).von.set(v.vonId, v.vonTitel || 'Ohne Titel');
        }
        abgeschnitten += Math.max(0, geister.size - jeArtMax);
        [...geister.values()]
            .sort((a, b) => b.von.size - a.von.size || a.ziel.localeCompare(b.ziel, 'de'))
            .slice(0, jeArtMax)
            .forEach(g => {
            const quellen = [...g.von.entries()].map(([id, titel]) => ({ id, titel }));
            funde.push({
                art: 'geist', titel: g.ziel, staerke: staerkeGeist(quellen.length),
                quellen,
                satz: quellen.length === 1
                    ? '„' + g.ziel + '" wird erwähnt, aber es gibt keine Seite dazu.'
                    : quellen.length + ' Seiten verweisen auf „' + g.ziel +
                        '" — die Seite gibt es nicht.'
            });
        });
        /* --- Mehrdeutige Verweise ------------------------------------------- */
        const mehrdeutig = new Map();
        for (const v of verweise || []) {
            if (!v || v.status !== 'mehrdeutig')
                continue;
            const schluessel = String(v.ziel || '').trim().toLocaleLowerCase('de');
            if (!schluessel)
                continue;
            if (!mehrdeutig.has(schluessel))
                mehrdeutig.set(schluessel, {
                    ziel: String(v.ziel).trim(),
                    kandidaten: Math.max(2, v.kandidaten || 2), von: new Map()
                });
            mehrdeutig.get(schluessel).von.set(v.vonId, v.vonTitel || 'Ohne Titel');
        }
        abgeschnitten += Math.max(0, mehrdeutig.size - jeArtMax);
        [...mehrdeutig.values()]
            .sort((a, b) => b.von.size - a.von.size || a.ziel.localeCompare(b.ziel, 'de'))
            .slice(0, jeArtMax)
            .forEach(m => funde.push({
            art: 'mehrdeutig', titel: m.ziel,
            staerke: staerkeMehrdeutig(m.kandidaten),
            quellen: [...m.von.entries()].map(([id, titel]) => ({ id, titel })),
            satz: '„' + m.ziel + '" passt auf ' + m.kandidaten +
                ' Seiten. Der Verweis führt irgendwohin — welche gemeint ist, ' +
                'steht nirgends.'
        }));
        /* --- Dünne Themen ----------------------------------------------------
           MIT DEM ALTER DER SEITE, an der das Schlagwort hängt (E329). Ein
           Schlagwort, das heute an einer Seite steht, ist eine angefangene
           Sache; eines, das seit einem Vierteljahr dort allein steht, eine
           liegengebliebene. Vorher war die Stärke eine feste 25 und die Art
           damit unzählbar — siehe `staerkeThema`.
    
           Die ältesten zuerst, damit der Schnitt bei dreissig nicht die
           liegengebliebenen wegwirft und die frischen behält. */
        const seitenNachId = new Map(alleSeiten.map(s => [s.id, s]));
        const duenn = (themen || [])
            .filter(t => t && Array.isArray(t.seiten) && t.seiten.length === 1)
            .map(t => {
            const seite = seitenNachId.get(String(t.seiten[0] || ''));
            return { t, tage: seite ? tageSeit(seite.edited, jetzt) : 0 };
        })
            .sort((a, b) => b.tage - a.tage);
        abgeschnitten += Math.max(0, duenn.length - jeArtMax);
        duenn
            .slice(0, jeArtMax)
            .forEach(({ t, tage }) => funde.push({
            art: 'thema', titel: '#' + t.tag, staerke: staerkeThema(tage),
            seiteId: String(t.seiten[0] || ''),
            satz: tage >= THEMA_TAGE
                ? 'Das Schlagwort #' + t.tag + ' steht seit ' + tage + ' Tagen an ' +
                    'genau einer Seite. Angefangen und liegengeblieben.'
                : 'Das Schlagwort #' + t.tag + ' steht an genau einer Seite. ' +
                    'Angefangen und nicht weitergeführt.'
        }));
        /* --- Offene Fragen ----------------------------------------------------
           Erst ALLE sammeln, dann nach Stärke ordnen, dann schneiden.
    
           Mein erster Entwurf brach die Schleife bei dreissig ab und behielt
           damit die ersten dreissig in der Reihenfolge, in der die Seiten
           zufällig kamen — eine ausführliche Frage auf der letzten Seite fiel
           weg, eine hingeworfene auf der ersten blieb. Der Prüflauf zeigte es
           sofort: die frisch angelegte Frage tauchte gar nicht auf, weil der
           Demobestand die dreissig schon aufgebraucht hatte.
    
           Ein Schnitt ist in Ordnung. Ein Schnitt, der nach Zufall statt nach
           Stärke schneidet, ist es nicht. */
        /* DIESELBE FRAGE AUF ZWEI SEITEN IST EIN FUND MIT ZWEI QUELLEN.
           Im Demobestand stand ein Satz auf zwei Seiten, und das Fenster
           zeigte ihn zweimal untereinander — es sah aus wie ein Fehler, obwohl
           beide Funde stimmten. Zusammengefasst wie die Geister ist es eine
           Auskunft mehr statt einer Zeile mehr. */
        const jeFrage = new Map();
        for (const s of alleSeiten) {
            for (const frage of fragenAus(s.text || '')) {
                const schluessel = frage.text.toLocaleLowerCase('de');
                const da = jeFrage.get(schluessel);
                if (da) {
                    da.von.set(s.id, s.titel);
                    if (frage.ganzeZeile)
                        da.ganzeZeile = true;
                }
                else {
                    jeFrage.set(schluessel, {
                        text: frage.text, ganzeZeile: frage.ganzeZeile,
                        von: new Map([[s.id, s.titel]])
                    });
                }
            }
        }
        const fragenFunde = [...jeFrage.values()].map(f => {
            const quellen = [...f.von.entries()].map(([id, titel]) => ({ id, titel }));
            const ersteId = quellen[0] ? quellen[0].id : '';
            const ersterTitel = quellen[0] ? quellen[0].titel : '';
            return {
                art: 'frage', titel: f.text,
                staerke: staerkeFrage(f.text.length, f.ganzeZeile),
                seiteId: ersteId, quellen,
                satz: quellen.length === 1
                    ? 'Offene Frage auf „' + ersterTitel + '".'
                    : 'Dieselbe offene Frage steht auf ' + quellen.length + ' Seiten.'
            };
        });
        fragenFunde.sort((a, b) => b.staerke - a.staerke ||
            a.titel.localeCompare(b.titel, 'de'));
        abgeschnitten += Math.max(0, fragenFunde.length - jeArtMax);
        for (const f of fragenFunde.slice(0, jeArtMax))
            funde.push(f);
        /* --- Wichtig, aber verstaubt ------------------------------------------
           EINE GESPERRTE SEITE IST NICHT VERSTAUBT, SONDERN FERTIG (E329).
           „Verstaubt" heisst: du wolltest hier wahrscheinlich weiterarbeiten.
           Wer eine Seite gegen Bearbeiten gesperrt hat, hat genau das Gegenteil
           gesagt — und zwar ausdrücklich, mit einem Schalter. Sie danach zu
           mahnen, weil sie seit neunzig Tagen nicht angefasst wurde, ist eine
           Mahnung an jemanden, der schon geantwortet hat.
    
           NUR HIER UND NICHT BEI DEN INSELN: eine gesperrte Insel bleibt eine
           Insel. Dass eine Seite fertig ist, heisst nicht, dass irgendwer sie
           findet. */
        const staubig = alleSeiten
            .map(s => ({ s, tage: tageSeit(s.edited, jetzt), rang: s.rang || 0 }))
            .filter(e => !e.s.gesperrt && e.rang >= verstaubtRang && e.tage >= verstaubtTage)
            .sort((a, b) => b.rang - a.rang || b.tage - a.tage);
        abgeschnitten += Math.max(0, staubig.length - jeArtMax);
        staubig
            .slice(0, jeArtMax)
            .forEach(e => funde.push({
            art: 'verstaubt', titel: e.s.titel,
            staerke: staerkeVerstaubt(e.rang, e.tage, verstaubtTage),
            seiteId: e.s.id,
            satz: '„' + e.s.titel + '" trägt viel im Netz (Rang ' + Math.round(e.rang) +
                '), wurde aber seit ' + e.tage + ' Tagen nicht angefasst.'
        }));
        /* --- Inseln ------------------------------------------------------------ */
        const inseln = alleSeiten
            .filter(s => (s.grad || 0) === 0)
            .map(s => ({ s, tage: tageSeit(s.edited, jetzt) }))
            .sort((a, b) => b.tage - a.tage);
        abgeschnitten += Math.max(0, inseln.length - jeArtMax);
        inseln
            .slice(0, jeArtMax)
            .forEach(e => funde.push({
            art: 'insel', titel: e.s.titel, staerke: staerkeInsel(e.tage),
            seiteId: e.s.id,
            satz: '„' + e.s.titel + '" hängt an nichts: kein Verweis hin, keiner weg.'
        }));
        /* --- Sortieren: nach STÄRKE, nicht nach Art -------------------------- */
        funde.sort((a, b) => b.staerke - a.staerke ||
            a.titel.localeCompare(b.titel, 'de'));
        /* Jeder Fund bekommt seine Kennung, bevor irgendwer filtert. */
        for (const f of funde)
            f.id = kennung(f);
        /* --- ERLEDIGTES AUSSORTIEREN (L105 Punkt 2, E324) ------------------- */
        const erledigt = new Set((opt.erledigt || []).map(String));
        const versteckt = erledigt.size
            ? funde.filter(f => erledigt.has(f.id)).length : 0;
        const sichtbar = versteckt ? funde.filter(f => !erledigt.has(f.id)) : funde;
        const stark = sichtbar.filter(f => f.staerke >= schwelle);
        const jeArt = {};
        for (const f of stark)
            jeArt[f.art] = (jeArt[f.art] || 0) + 1;
        return {
            funde: sichtbar, gezaehlt: stark.length, gesamt: sichtbar.length,
            jeArt, abgeschnitten, versteckt,
            satz: satzZu(stark.length, sichtbar.length, abgeschnitten, versteckt)
        };
    };
    /**
     * DIE KENNUNG EINES FUNDS (L105 Punkt 2, E324).
     *
     * Sie muss zwei Dinge zugleich können, und das zweite ist der Grund,
     * warum sie so aussieht:
     *
     *   · Über Neuberechnungen hinweg GLEICH bleiben. Sonst käme ein
     *     erledigter Fund beim nächsten Öffnen als neuer zurück.
     *   · Sich ÄNDERN, wenn sich der Fund ändert. Wer seine offene Frage
     *     umformuliert, hat eine andere Frage — und die soll wieder
     *     auftauchen. Ein „erledigt" gilt dem Fund, nicht der Zeile.
     *
     * Deshalb Art, Seite und Titel zusammen. Kleinschreibung und
     * zusammengezogene Leerzeichen, damit ein nachträglich eingefügtes
     * Leerzeichen keine neue Frage erfindet.
     */
    const kennung = (f) => String(f.art) + '|' + String(f.seiteId || '') + '|' +
        String(f.titel || '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('de');
    /**
     * Der Satz oben. Er sagt AUCH etwas, wenn nichts Zählbares da ist —
     * „nichts gefunden" ist eine Auskunft, keine leere Seite.
     */
    const satzZu = (gezaehlt, gesamt, abgeschnitten = 0, versteckt = 0) => {
        const rest = gesamt - gezaehlt;
        /* ABGEHAKTES WIRD GENANNT, aber nur wenn es welches gibt. Eine Liste,
           die schweigend etwas weglässt, liest sich wie Vollständigkeit — und
           „0 erledigt" wäre die Zeile, die man nach dem zweiten Mal überliest. */
        const ab = versteckt
            ? ' ' + versteckt + (versteckt === 1 ? ' Fund ist' : ' Funde sind') +
                ' abgehakt und nicht dabei.' : '';
        /* Der Schnitt wird IMMER genannt, wenn er zugeschlagen hat. Eine Liste,
           die dreissig zeigt und schweigend zweihundert weglässt, liest sich
           wie Vollständigkeit. */
        const mehr = abgeschnitten
            ? ' Weitere ' + abgeschnitten + ' sind nicht aufgeführt — je Art werden ' +
                'höchstens die stärksten gezeigt.' : '';
        if (!gesamt)
            return 'Keine Lücken gefunden. Der Bestand hängt zusammen.' + mehr + ab;
        if (!gezaehlt)
            return 'Nichts Auffälliges. ' + gesamt +
                ' schwache Beobachtungen stehen unten — sie sind zu unsicher zum Zählen.' + mehr + ab;
        const wort = gezaehlt === 1 ? 'eine Lücke' : gezaehlt + ' Lücken';
        return 'Deutlich: ' + wort +
            (rest ? ', dazu ' + rest + ' schwächere Beobachtung' + (rest === 1 ? '' : 'en') : '') +
            '.' + mehr + ab;
    };
    return {
        finden, kennung, fragenAus, ohneMarkierung, tageSeit, satzZu,
        staerkeGeist, staerkeMehrdeutig, staerkeThema, staerkeFrage,
        staerkeVerstaubt, staerkeInsel, VORGABE, THEMA_TAGE
    };
})();
window.KnowledgeGaps = KnowledgeGaps;
