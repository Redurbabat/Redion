"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/bereiche/bloecke/arten/schematico-import.ts (npm run bauen:ts). */
const SchematicoImport = (() => {
    const MAX_BYTES = 4 * 1024 * 1024;
    const symbole = new Map([
        ['contactor_coil', { zeichen: 'spule', klemmen: { A1: 'A1', A2: 'A2' } }],
        ['contact_no', { zeichen: 'schliesser', klemmen: { 13: '3', 14: '4' } }],
        ['contact_nc', { zeichen: 'oeffner', klemmen: { 21: '1', 22: '2' } }],
        ['fuse_1p', { zeichen: 'sicherung', klemmen: { 1: '1', 2: '2' } }],
        ['pilot_lamp', { zeichen: 'signalleuchte', klemmen: { X1: 'X1', X2: 'X2' } }],
    ]);
    const objekt = (roh) => roh && typeof roh === 'object' && !Array.isArray(roh) ? roh : {};
    const text = (wert, laenge = 120) => typeof wert === 'string' ? wert.trim().slice(0, laenge) : '';
    const punkt = (werte) => {
        const { x, y } = werte;
        if (typeof x !== 'number' || typeof y !== 'number' || !Number.isFinite(x) || !Number.isFinite(y) ||
            Math.abs(x) > 10_000 || Math.abs(y) > 10_000)
            throw new Error('Schematico enthält ungültige Koordinaten.');
        return { x, y };
    };
    const lesen = (roh) => {
        if (roh.length > MAX_BYTES)
            throw new Error('Die Schematico-Datei ist zu gross.');
        const wurzel = objekt(JSON.parse(roh.replace(/^\uFEFF/, '')));
        const eigeneSymbole = new Set((Array.isArray(wurzel.symbolLibrary) ? wurzel.symbolLibrary : [])
            .map(zeichen => text(objekt(zeichen).id)));
        const projekt = Array.isArray(wurzel.pages) ? wurzel.pages : null;
        const kandidaten = projekt ?? (wurzel.type === 'ems' ? [wurzel.page] : [wurzel]);
        if (kandidaten.length > 250)
            throw new Error('Das Projekt enthält zu viele Blätter.');
        const blaetter = kandidaten.map(objekt).flatMap((daten, i) => daten.pageType === 'schematic' && Array.isArray(daten.components) && Array.isArray(daten.wires)
            ? [{ id: String(i), titel: text(daten.title) || 'Blatt ' + (text(daten.pageNumber) || (i + 1)), daten, eigeneSymbole }]
            : []);
        if (!blaetter.length)
            throw new Error('Die Datei enthält kein Schematico-Stromlaufblatt.');
        return { blaetter, logischeLeitungen: Array.isArray(wurzel.logicalConnections) ? wurzel.logicalConnections : [] };
    };
    const signatur = (draht) => JSON.stringify([draht.from, draht.to].map(roh => {
        const ende = objekt(roh);
        return JSON.stringify([text(ende.componentId, 200), text(ende.pinId)]);
    }).sort());
    const istWeitereLogischeLeitung = (leitungen, bauteile, bekannte) => leitungen.some(rohdraht => {
        const draht = objekt(rohdraht);
        return (bauteile.has(text(objekt(draht.from).componentId, 200)) ||
            bauteile.has(text(objekt(draht.to).componentId, 200))) && bekannte.get(text(draht.id, 200)) !== signatur(draht);
    });
    const importieren = (blatt, logischeLeitungen, holeNetze) => {
        const { daten, eigeneSymbole } = blatt;
        if (!Array.isArray(daten.components) || !Array.isArray(daten.wires) ||
            daten.components.length > 120 || daten.wires.length > 240 ||
            logischeLeitungen.length > 10_000)
            throw new Error('Das Blatt enthält zu viele Bauteile oder Leitungen.');
        if (daten.connectionMode === 'autoconnect')
            throw new Error('Für dieses Blatt müssen die Verbindungen in Schematico explizit gespeichert sein.');
        const quellTeile = daten.components.map(objekt);
        const quellTexte = Array.isArray(daten.texts) ? daten.texts.map(objekt) : [];
        if (quellTexte.length > 200)
            throw new Error('Das Blatt enthält zu viele Texte.');
        const orte = [...quellTeile, ...quellTexte].map(punkt);
        const x0 = Math.min(0, ...orte.map(p => p.x)), y0 = Math.min(0, ...orte.map(p => p.y));
        const ort = (roh) => {
            const { x, y } = punkt(roh);
            return { x: Schaltplan.rasten((x - x0) * 2 + 100), y: Schaltplan.rasten((y - y0) * 2 + 100) };
        };
        const plan = Schaltplan.neuerPlan();
        plan.breite = Math.max(plan.breite, ...orte.map(p => (p.x - x0) * 2 + 220));
        plan.hoehe = Math.max(plan.hoehe, ...orte.map(p => (p.y - y0) * 2 + 220));
        if (plan.breite > 8000 || plan.hoehe > 8000)
            throw new Error('Das Blatt ist für die Redion-Zeichenfläche zu gross.');
        const umsetzung = new Map();
        for (const roh of quellTeile) {
            const id = text(roh.id, 200);
            const symbolId = text(roh.symbolId);
            const symbol = symbole.get(symbolId);
            if (!symbol || eigeneSymbole.has(symbolId) || roh.importedSymbol || (roh.scale !== undefined && roh.scale !== 1))
                throw new Error('Bauteil kann nicht eindeutig zugeordnet werden: ' + (text(roh.bmk) || symbolId || 'ohne Symbol'));
            if (!id || umsetzung.has(id))
                throw new Error('Schematico enthält doppelte oder fehlende Bauteilkennungen.');
            const drehung = roh.rotation ?? 0;
            if (typeof drehung !== 'number' || ![0, 90, 180, 270].includes(drehung))
                throw new Error('Ein Bauteil hat eine nicht unterstützte Drehung.');
            const teil = {
                id: Schaltplan.uid(), zeichen: symbol.zeichen, ...ort(roh),
                drehung, gespiegelt: false, bmk: text(roh.bmk), gruppe: '', ebene: 'plan',
                nummern: Object.fromEntries(Object.entries(symbol.klemmen).filter(([von, zu]) => von !== zu).map(([von, zu]) => [zu, von]))
            };
            const beschriftung = text(roh.functionText);
            if (beschriftung)
                teil.beschriftung = beschriftung;
            umsetzung.set(id, { teil, symbol });
            plan.teile.push(teil);
        }
        const vater = new Map();
        const finden = (id) => {
            let wurzel = id;
            while (vater.has(wurzel))
                wurzel = vater.get(wurzel);
            return wurzel;
        };
        const klemme = (roh) => {
            const ende = objekt(roh);
            const daten = umsetzung.get(text(ende.componentId, 200));
            const pin = text(ende.pinId);
            const nr = daten && Object.hasOwn(daten.symbol.klemmen, pin) ? daten.symbol.klemmen[pin] : undefined;
            if (!daten || !nr)
                throw new Error('Eine Leitungs-Klemme konnte nicht eindeutig übernommen werden.');
            return { teil: daten.teil, nr, schluessel: 'k:' + daten.teil.id + ':' + nr };
        };
        const bekannte = new Map();
        const leitungen = daten.wires.map(objekt);
        for (const draht of leitungen) {
            const id = text(draht.id, 200);
            if (!id || bekannte.has(id))
                throw new Error('Schematico enthält doppelte oder fehlende Leitungskennungen.');
            bekannte.set(id, signatur(draht));
            const von = klemme(draht.from), zu = klemme(draht.to);
            const a = Schaltplan.anschlussOrt(von.teil, von.nr);
            const b = Schaltplan.anschlussOrt(zu.teil, zu.nr);
            if (!a || !b || von.schluessel === zu.schluessel)
                throw new Error('Eine Leitungs-Klemme konnte nicht eindeutig übernommen werden.');
            const pfad = Schaltplan.leitungFuehren(plan, a, b, { teil: von.teil.id, nr: von.nr }, { teil: zu.teil.id, nr: zu.nr });
            if (!pfad || pfad.length < 2)
                throw new Error('Eine Leitung konnte im Redion-Raster nicht geführt werden.');
            plan.leitungen.push({ id: Schaltplan.uid(), ebene: 'plan', punkte: pfad,
                vonTeil: von.teil.id, vonNr: von.nr, nachTeil: zu.teil.id, nachNr: zu.nr });
            const x = finden(von.schluessel), y = finden(zu.schluessel);
            if (x !== y)
                vater.set(x, y);
        }
        if (istWeitereLogischeLeitung(logischeLeitungen, umsetzung, bekannte))
            throw new Error('Das Blatt enthält zusätzliche logische Verbindungen ausserhalb der Zeichnung.');
        const netze = holeNetze(plan).netzVon;
        const erwartetZuNetz = new Map(), netzZuErwartet = new Map();
        for (const { teil, symbol } of umsetzung.values()) {
            for (const nr of Object.values(symbol.klemmen)) {
                const key = 'k:' + teil.id + ':' + nr;
                const gruppe = finden(key), netz = netze.get(key);
                if (netz === undefined || (erwartetZuNetz.has(gruppe) && erwartetZuNetz.get(gruppe) !== netz) ||
                    (netzZuErwartet.has(netz) && netzZuErwartet.get(netz) !== gruppe))
                    throw new Error('Das Redion-Raster würde elektrische Verbindungen verändern.');
                erwartetZuNetz.set(gruppe, netz);
                netzZuErwartet.set(netz, gruppe);
            }
        }
        for (const roh of quellTexte) {
            const t = text(roh.text, 500);
            if (t)
                plan.texte.push({ id: Schaltplan.uid(), ...ort(roh), t, ebene: 'plan' });
        }
        return plan;
    };
    return { MAX_BYTES, lesen, importieren };
})();
