"use strict";
/* ============================================================================
 * core/ai/kosten.ts — was ein KI-Aufruf kostet, BEVOR er läuft
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/core/ai/kosten.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/core/ai/kosten.js`. Wer das .js bearbeitet, verliert die Änderung
 * beim nächsten Bauen; `pruefungen/lauf/test105.mts` meldet es vorher.
 * ----------------------------------------------------------------------------
 * WARUM ES DIESE LÜCKE GAB — und sie war ausgesprochen, nicht vergessen.
 *
 * `agenten.ts:26` sagt es wörtlich:
 *
 *     „Das ist die ehrliche Version eines Kostenlimits — hier zählt es
 *      Schritte statt Geld, weil die lokale KI nichts kostet."
 *
 * Die Annahme stimmte, als sie geschrieben wurde. Damals war Redions KI
 * Ollama und WebLLM. Heute stehen sechs Anbieter in der Liste, zwei davon
 * ausdrücklich `frei: false` — OpenAI und Anthropic. Die Begründung ist
 * stehengeblieben und die Welt darunter hat sich gedreht.
 *
 * ─── DIE DREI KONKRETEN GEFAHREN, GEMESSEN ──────────────────────────────────
 *
 * 1. `embeddingsBauen` schickt JEDE Seite einzeln an eine kostenpflichtige
 *    API. Ein Klick. Keine Zahl vorher, keine Obergrenze, kein Abbruch.
 *    Bei zweitausend Seiten sind das zweitausend Aufrufe.
 * 2. Der normale Chat hat GAR KEIN Limit — weder Tageslimit noch Notaus
 *    noch Zähler. Beides hängt allein an `Agent.laufen`.
 * 3. Bis zu vier Versuche je Anfrage, und `frageKurz` steckt in der
 *    Agentenschleife: dreissig Schritte mal vier Anfragen ist der
 *    Extremfall.
 *
 * ─── WAS DIESE DATEI TUT, UND WAS SIE BEWUSST NICHT TUT ─────────────────────
 *
 * Sie SCHÄTZT und sie RECHNET. Sie ruft nichts auf, sie speichert nichts,
 * sie kennt keinen Anbieter — die Preise kommen als Daten herein.
 *
 * Sie behauptet ausdrücklich NICHT, genau zu sein. Eine Schätzung, die sich
 * als Rechnung ausgibt, ist schlimmer als keine: wer „0,42 CHF" liest und
 * 0,71 bezahlt, glaubt der Zahl nie wieder. Jede Schätzung trägt deshalb
 * ihre Unsicherheit mit, und für ein unbekanntes Modell gibt es KEINE Zahl
 * statt einer geratenen.
 *
 * ─── WARUM DIE PREISLISTE EIN DATUM TRÄGT ───────────────────────────────────
 *
 * Preise ändern sich, und eine Liste im Code veraltet still. Sie trägt
 * deshalb `STAND` — und wer die Zahlen anzeigt, kann sagen, von wann sie
 * sind. Das ist derselbe Gedanke wie `fehlt` im Sicherungs-Manifest: eine
 * Angabe, die nicht sagt, wie sicher sie ist, ist die gefährlichere.
 * ==========================================================================*/
const KiKosten = (() => {
    /**
     * Wann diese Preise nachgesehen wurden.
     *
     * Wer sie anzeigt, nennt dieses Datum dazu. Eine Zahl ohne Datum liest
     * sich wie eine Tatsache und ist eine Momentaufnahme.
     */
    const STAND = '2026-08-31';
    /** Ab wann eine Preisliste als alt gilt. Ein halbes Jahr. */
    const ALT_NACH_TAGEN = 182;
    /**
     * Ist die Preisliste alt genug, um sie zu erwähnen? (L104 Punkt 3, E319)
     *
     * Die Liste altert von selbst, und niemand erinnert daran. In einem Jahr
     * rechnet sie mit den Preisen von heute weiter, und die angezeigte Summe
     * ist dann still falsch — die unangenehmste Sorte (§35).
     *
     * DIE ZEIT KOMMT ALS ZAHL HEREIN, nicht aus der Uhr: dieser Kern rechnet
     * und kennt weder Uhr noch Ablage. Nur so lässt sich der Fall „in einem
     * Jahr" prüfen, ohne die Systemzeit zu verstellen.
     */
    const listeAlt = (jetztMs) => {
        const standMs = Date.parse(STAND + 'T00:00:00Z');
        if (!Number.isFinite(standMs) || !Number.isFinite(jetztMs))
            return false;
        return (jetztMs - standMs) > ALT_NACH_TAGEN * 86400000;
    };
    /**
     * Ein Satz dazu — oder LEER, solange die Liste frisch ist.
     *
     * Leer ist der Normalfall und bleibt es ein halbes Jahr lang. Ein Hinweis,
     * der von Anfang an dasteht, ist nach einer Woche unsichtbar und hilft
     * genau dann nicht, wenn er endlich stimmt.
     */
    const standSatz = (jetztMs) => listeAlt(jetztMs)
        ? 'Die Preisliste ist vom ' + STAND + ' und damit über ein halbes Jahr ' +
            'alt. Die Beträge sind Schätzungen nach alten Preisen.'
        : '';
    /** Die Währung, in der hier gerechnet wird. */
    const WAEHRUNG = 'USD';
    /**
     * Preis je Million Token, getrennt nach Eingabe und Ausgabe.
     *
     * Die Schlüssel sind Modellnamen, wie die Anbieter sie schreiben. Ein
     * Modell, das hier fehlt, bekommt KEINE Schätzung — siehe `schaetzen`.
     *
     * `0` heisst wirklich null und ist kein „unbekannt": die Modelle mit
     * `:free` und die lokalen kosten nichts.
     */
    const PREISE = {
        /* --- kostenlos, aber mit Kontingent ------------------------------- */
        'llama-3.3-70b-versatile': { ein: 0, aus: 0 },
        'llama-3.1-8b-instant': { ein: 0, aus: 0 },
        'gemma2-9b-it': { ein: 0, aus: 0 },
        'meta-llama/llama-3.3-70b-instruct:free': { ein: 0, aus: 0 },
        'google/gemma-2-9b-it:free': { ein: 0, aus: 0 },
        'mistralai/mistral-7b-instruct:free': { ein: 0, aus: 0 },
        'gemini-2.0-flash': { ein: 0, aus: 0 },
        'gemini-2.0-flash-lite': { ein: 0, aus: 0 },
        /* --- kostenpflichtig ---------------------------------------------- */
        'gpt-4o-mini': { ein: 0.15, aus: 0.60 },
        'gpt-4o': { ein: 2.50, aus: 10.00 },
        'claude-3-5-haiku-latest': { ein: 0.80, aus: 4.00 },
        'claude-sonnet-4-5': { ein: 3.00, aus: 15.00 },
        /* --- Embeddings ---------------------------------------------------- */
        'text-embedding-3-small': { ein: 0.02, aus: 0 },
        'text-embedding-004': { ein: 0, aus: 0 }
    };
    /**
     * Aus Text eine Tokenzahl SCHÄTZEN.
     *
     * Vier Zeichen je Token ist die übliche Faustregel für Englisch. Für
     * Deutsch ist sie zu optimistisch — Zusammensetzungen wie
     * „Leitungsdimensionierung" zerfallen in mehr Stücke, als ihre Länge
     * vermuten lässt. Für Code ebenso.
     *
     * Deshalb wird mit 3,6 gerechnet und nicht mit 4: lieber zu viel
     * schätzen als zu wenig. Eine Schätzung, die regelmässig unter dem
     * echten Wert liegt, ist genau die, der man am Monatsende nicht mehr
     * glaubt.
     *
     * Das bleibt eine Schätzung. `unsicherheit()` sagt, wie sehr.
     */
    const ZEICHEN_JE_TOKEN = 3.6;
    const tokenSchaetzen = (text) => {
        const s = String(text ?? '');
        if (!s)
            return 0;
        return Math.ceil(s.length / ZEICHEN_JE_TOKEN);
    };
    /** Dieselbe Schätzung für eine ganze Nachrichtenliste. */
    const tokenAusNachrichten = (nachrichten) => {
        if (!Array.isArray(nachrichten))
            return tokenSchaetzen(nachrichten);
        let n = 0;
        for (const m of nachrichten) {
            if (!m)
                continue;
            n += tokenSchaetzen(m.content);
            /* Jede Nachricht kostet ein paar Token an Gerüst (Rolle, Trenner).
               Vier ist der übliche Aufschlag; er fällt bei langen Nachrichten
               nicht ins Gewicht und bei zwanzig kurzen sehr wohl. */
            n += 4;
        }
        return n;
    };
    /**
     * Wie unsicher eine Schätzung ist, als Faktor nach oben.
     *
     * 1,35 heisst: es kann bis zu 35 % mehr werden. Der Wert ist nicht aus
     * der Luft gegriffen, sondern der übliche Abstand zwischen der
     * Zeichenregel und echten Tokenizern bei gemischtem Text. Wer eine Zahl
     * anzeigt, zeigt eine SPANNE.
     */
    const unsicherheit = () => 1.35;
    /**
     * Was ein Aufruf kosten dürfte.
     *
     * @param modell    der Modellname, wie der Anbieter ihn schreibt
     * @param tokenEin  geschätzte Eingabe-Token
     * @param tokenAus  geschätzte Ausgabe-Token (die Deckelung, nicht die
     *                  Hoffnung — man weiss vorher nicht, wie lang die
     *                  Antwort wird)
     * @param preise    zum Überschreiben in Prüfläufen; sonst `PREISE`
     */
    const schaetzen = (modell, tokenEin, tokenAus, preise = PREISE) => {
        const p = preise[modell];
        if (!p) {
            /* KEINE geratene Zahl. Ein unbekanntes Modell bekommt ein ehrliches
               „weiss ich nicht" — und der Aufrufer entscheidet, ob er trotzdem
               will. Eine erfundene Zahl wäre hier das Schlimmste: sie sähe
               genauso aus wie eine echte. */
            return {
                bekannt: false, modell, tokenEin, tokenAus,
                betrag: 0, hoechstens: 0, waehrung: WAEHRUNG, frei: false,
                satz: 'Für „' + modell + '" ist hier kein Preis hinterlegt. Was der ' +
                    'Aufruf kostet, lässt sich nicht sagen — die Preisliste ist vom ' +
                    STAND + '.'
            };
        }
        const frei = p.ein === 0 && p.aus === 0;
        const betrag = (tokenEin / 1e6) * p.ein + (tokenAus / 1e6) * p.aus;
        const hoechstens = betrag * unsicherheit();
        return {
            bekannt: true, modell, tokenEin, tokenAus,
            betrag, hoechstens, waehrung: WAEHRUNG, frei,
            satz: frei
                ? 'Dieses Modell kostet nichts. (Ein Kontingent kann es trotzdem haben.)'
                : 'Schätzung: rund ' + geld(betrag) + ', höchstens etwa ' + geld(hoechstens) +
                    '. Die Tokenzahl ist aus der Textlänge geschätzt, nicht gezählt.'
        };
    };
    /** Ein Betrag als Text. Kleine Beträge brauchen mehr Stellen. */
    const geld = (betrag, waehrung = WAEHRUNG) => {
        if (!Number.isFinite(betrag))
            return '–';
        /* KOMMA, NICHT PUNKT (E321). Diese Zeichenkette liest ein Mensch — in
           den Einstellungen, in der Bremsmeldung —, und Redion spricht mit
           Menschen deutsch (§3, §53.2). Gefunden auf dem Bild der neuen
           Kostenübersicht: dort stand „0.153 USD" mitten in deutschem Text.
           Die Zahlenfelder daneben behalten den Punkt, weil ein
           `<input type="number">` seinen Wert unabhängig von der Sprache
           hält — ein Komma darin wäre kein deutscher Wert, sondern ein
           ungültiger. */
        const komma = (n, stellen) => n.toFixed(stellen).replace('.', ',');
        if (betrag === 0)
            return '0,00 ' + waehrung;
        if (betrag < 0.01)
            return '< 0,01 ' + waehrung;
        return komma(betrag, betrag < 1 ? 3 : 2) + ' ' + waehrung;
    };
    const VORGABE_GRENZEN = {
        jeAufruf: 0.50, jeLauf: 2.00, jeTag: 5.00, jeMonat: 20.00
    };
    const GRENZ_NAME = {
        jeAufruf: 'für einen einzelnen Aufruf',
        jeLauf: 'für einen Agentenlauf',
        jeTag: 'für heute',
        jeMonat: 'für diesen Monat'
    };
    /**
     * Darf dieser Aufruf laufen?
     *
     * Geprüft wird mit `hoechstens`, nicht mit `betrag`. Das ist der
     * Unterschied zwischen einer Grenze und einer Empfehlung: wer bei 5,00
     * deckelt und mit dem wahrscheinlichen Wert rechnet, gibt regelmässig
     * 6,50 aus.
     *
     * Ein UNBEKANNTES Modell wird durchgelassen — mit gesetztem Hinweis. Es
     * zu sperren hiesse, jeden neuen Modellnamen zu blockieren, bis jemand
     * die Preisliste pflegt; das wäre §47 von der anderen Seite. Der Mensch
     * erfährt aber, dass niemand weiss, was es kostet.
     */
    const pruefen = (schaetzung, grenzen, stand) => {
        if (!schaetzung.bekannt || schaetzung.frei) {
            return { erlaubt: true, grenze: '', satz: schaetzung.satz, schaetzung };
        }
        const k = schaetzung.hoechstens;
        const pruefungen = [
            ['jeAufruf', grenzen.jeAufruf, k],
            ['jeLauf', grenzen.jeLauf, stand.lauf + k],
            ['jeTag', grenzen.jeTag, stand.heute + k],
            ['jeMonat', grenzen.jeMonat, stand.monat + k]
        ];
        for (const [name, grenze, waere] of pruefungen) {
            if (!grenze || grenze <= 0)
                continue;
            if (waere <= grenze)
                continue;
            return {
                erlaubt: false, grenze: name, schaetzung,
                satz: 'Dieser Aufruf würde die Grenze ' + GRENZ_NAME[name] + ' ' +
                    'überschreiten: er käme auf ' + geld(waere) + ' gegen ' +
                    geld(grenze) + '. Die Grenzen stehen unter Einstellungen → KI.'
            };
        }
        return { erlaubt: true, grenze: '', satz: schaetzung.satz, schaetzung };
    };
    /**
     * Ein Kontingent fortschreiben.
     *
     * Läuft das Fenster ab, beginnt es von vorn. Das ist die ganze Logik,
     * und sie steht hier, damit sie geprüft werden kann, ohne eine Minute zu
     * warten — `jetzt` kommt herein.
     */
    const kontingentBuchen = (k, wieviel, jetzt, fensterMs) => {
        if (!k || jetzt >= k.bis) {
            return { verbraucht: wieviel, grenze: k ? k.grenze : 0, bis: jetzt + fensterMs };
        }
        return { ...k, verbraucht: k.verbraucht + wieviel };
    };
    /** Ist noch Platz im Kontingent? */
    const kontingentFrei = (k, wieviel, jetzt) => {
        if (!k || !k.grenze || k.grenze <= 0)
            return true;
        if (jetzt >= k.bis)
            return true;
        return k.verbraucht + wieviel <= k.grenze;
    };
    /** Wie lange noch, bis das Fenster wieder aufgeht? In Sekunden. */
    const kontingentWartet = (k, jetzt) => {
        if (!k || jetzt >= k.bis)
            return 0;
        return Math.ceil((k.bis - jetzt) / 1000);
    };
    /**
     * Aus einer Liste Buchungen den Stand rechnen.
     *
     * @param tag    der heutige Tag als `2026-08-31`
     * @param monat  der Monat als `2026-08`
     */
    const standAus = (buchungen, tag, monat, lauf = 0) => {
        let heute = 0, imMonat = 0;
        for (const b of buchungen || []) {
            if (!b || !Number.isFinite(b.betrag))
                continue;
            if (b.tag === tag)
                heute += b.betrag;
            if (String(b.tag || '').slice(0, 7) === monat)
                imMonat += b.betrag;
        }
        return { heute, monat: imMonat, lauf };
    };
    /**
     * WIE VIEL DES MONATS WIRKLICH GEZÄHLT IST (L104 Punkt 1, E321).
     *
     * Seit E319 liest Redion die echte Tokenzahl aus dem Antwortstrom, wo der
     * Anbieter sie schickt. Wo er es nicht tut — ein eigener Server, ein alter
     * Endpunkt —, bleibt die Schätzung. Beides steht im Buch, unterschieden
     * durch `gezaehlt`.
     *
     * Eine Summe, die beides verschweigt, ist wieder das Problem, das E289 für
     * die Lernzahlen gelöst hat: eine Zahl ohne ihre Grundlage liest sich wie
     * eine Tatsache. Also wird die Grundlage mitgeliefert.
     */
    const belegLage = (buchungen, monat) => {
        let gezaehlt = 0, geschaetzt = 0, anzahl = 0, gezaehlteAnzahl = 0;
        for (const b of buchungen || []) {
            if (!b || !Number.isFinite(b.betrag))
                continue;
            if (monat && String(b.tag || '').slice(0, 7) !== monat)
                continue;
            anzahl++;
            if (b.gezaehlt) {
                gezaehlt += b.betrag;
                gezaehlteAnzahl++;
            }
            else
                geschaetzt += b.betrag;
        }
        const summe = gezaehlt + geschaetzt;
        return { gezaehlt, geschaetzt, summe, anzahl, gezaehlteAnzahl,
            anteil: summe > 0 ? gezaehlt / summe : 0 };
    };
    /**
     * Ein Satz zur Grundlage — oder LEER, wenn es nichts zu sagen gibt.
     *
     * Leer ist der Normalfall für jeden, der lokal arbeitet: ohne Buchung gibt
     * es keine Summe, und „0,00 — 0 % gezählt" wäre eine Zeile, die nichts
     * behauptet und trotzdem Platz nimmt.
     */
    const belegSatz = (lage) => {
        if (!lage || !lage.anzahl)
            return '';
        if (lage.gezaehlteAnzahl === lage.anzahl)
            return 'Alle ' + lage.anzahl + ' Aufrufe mit gezählten Token vom Anbieter.';
        if (lage.gezaehlteAnzahl === 0)
            return 'Geschätzt — kein Anbieter hat eine Tokenzahl zurückgemeldet. ' +
                'Die Schätzung greift bewusst zu hoch.';
        return lage.gezaehlteAnzahl + ' von ' + lage.anzahl + ' Aufrufen gezählt, ' +
            'der Rest geschätzt (bewusst zu hoch).';
    };
    /** Was je Anbieter zusammenkam — für die Anzeige. */
    const jeAnbieter = (buchungen, monat) => {
        const aus = Object.create(null);
        for (const b of buchungen || []) {
            if (!b || !Number.isFinite(b.betrag))
                continue;
            if (monat && String(b.tag || '').slice(0, 7) !== monat)
                continue;
            const a = b.anbieter || 'unbekannt';
            aus[a] = (aus[a] || 0) + b.betrag;
        }
        return aus;
    };
    /**
     * Alte Buchungen wegwerfen.
     *
     * Ein Buch, das ewig wächst, ist irgendwann selbst das Problem. Behalten
     * wird, was in den Monatsstand einfliessen kann — der Rest ist Historie
     * und gehört nicht in `meta`.
     */
    const kuerzen = (buchungen, abTag) => (buchungen || []).filter(b => b && String(b.tag || '') >= abTag);
    return {
        STAND, ALT_NACH_TAGEN, listeAlt, standSatz,
        WAEHRUNG, PREISE, VORGABE_GRENZEN, ZEICHEN_JE_TOKEN,
        tokenSchaetzen, tokenAusNachrichten, unsicherheit,
        schaetzen, pruefen, geld,
        kontingentBuchen, kontingentFrei, kontingentWartet,
        standAus, jeAnbieter, belegLage, belegSatz, kuerzen
    };
})();
window.KiKosten = KiKosten;
