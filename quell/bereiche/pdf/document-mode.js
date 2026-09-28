"use strict";
/* ============================================================================
 * bereiche/pdf/document-mode.ts — ein Arbeitsraum fuer vorhandene Dokumente
 * ----------------------------------------------------------------------------
 * Der Dokumentmodus ist nur eine Ansicht. Er legt weder PDF-Seiten noch
 * Blaetter ein zweites Mal ab: dieselben `pdfseite`-/`blatt`-Bloecke werden
 * mit Seitenleiste, Arbeitsflaeche und Inspector zusammengesetzt (E126).
 * ==========================================================================*/
const DocumentMode = (() => {
    const states = new Map();
    /* DIE ZULETZT ANGESEHENE SEITE BLEIBT (E349). GoodNotes öffnet ein
       Dokument dort, wo man es verlassen hat; hier begann jedes Öffnen bei
       Seite 1, weil der Zustand nur im Arbeitsspeicher lag. Gemerkt wird je
       Dokument als Meta, nicht am Seitenblock — Blättern soll weder `edited`
       anheben noch eine Fassung erzeugen. */
    const SEITEN_MERKER = 'dokSeite:';
    const gemerkteSeite = (pageId) => {
        const n = Number(Store.getMeta(SEITEN_MERKER + pageId));
        return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
    };
    const seiteMerken = (pageId, index) => {
        if (Store.getMeta(SEITEN_MERKER + pageId) === index)
            return;
        Store.setMeta(SEITEN_MERKER + pageId, index);
    };
    /* DER ZOOM BLEIBT AUCH (Audit F07). E349 merkte die SEITE, den Zoom
       nicht: nach jedem Neuladen stand er wieder auf 100 %, und wer sein
       Skript auf 140 % liest, musste das jedes Mal von Hand herstellen.
  
       Genau wie die Seite als Meta, nicht am Seitenblock — eine Ansicht ist
       kein Inhalt: Zoomen soll weder `edited` anheben noch eine Fassung
       erzeugen. Und je Dokument, nicht global: ein Skript in Kleindruck
       braucht einen anderen Zoom als ein Foto-Scan. */
    const ZOOM_MERKER = 'dokZoom:';
    const gemerkterZoom = (pageId) => {
        const n = Number(Store.getMeta(ZOOM_MERKER + pageId));
        /* Die Grenzen des Reglers, nicht mehr: ein kaputter Wert aus einer
           aelteren Fassung darf keine 4000-Pixel-Seite bauen. */
        return Number.isFinite(n) && n >= 60 && n <= 180 ? Math.round(n) : 100;
    };
    const zoomMerken = (pageId, zoom) => {
        if (Store.getMeta(ZOOM_MERKER + pageId) === zoom)
            return;
        Store.setMeta(ZOOM_MERKER + pageId, zoom);
    };
    /* ══ EINZELSEITE ODER FORTLAUFEND (E398, Audit F03 Rest) ══════════════════
       Der Pruefbericht schlaegt eine Wahl zwischen „Einzelseite" und
       „Fortlaufend" vor, mit Einzelseite als Vorgabe am Telefon. Redur hat am
       4. September das ERSTE bestellt und das ZWEITE nicht:
  
         Die Wahl kommt. Die VORGABE bleibt Fortlaufend, auch am Telefon.
  
       Und das ist keine Vorsicht, sondern seine eigene Ansage aus E299: „die
       pdf seiten sollte wie goodnotes sich ganz oeffnen komplet wie one note".
       Eine Vorgabe, die das zuruecknimmt, waere eine Entscheidung GEGEN ihn.
       Einzelseite ist deshalb ein Angebot, kein neuer Normalfall.
  
       WARUM ES DIE WAHL UEBERHAUPT BRAUCHT — gemessen an vier A4-Blaettern:
  
                                     Telefon 390x844   Rechner 1360x900
         Blaetter gleichzeitig im Bild        2                1
         ein Blatt als Anteil des Bildes    72 %            213 %
  
       Am Rechner passt ein Blatt ohnehin nicht ins Bild; dort steht immer
       genau eines, und die Wahl aendert praktisch nichts. Am TELEFON teilen
       sich zwei Blaetter den Bildschirm — und genau das meinte der Befund mit
       „Nutzer wissen nicht sicher, welche Seite aktiv ist". Wer das nicht
       will, schaltet es hier ab.
  
       ALS META, NICHT AM BLOCK — genau wie Seite und Zoom. Eine Ansicht ist
       kein Inhalt: umschalten soll weder `edited` anheben noch eine Fassung
       erzeugen. Und je Dokument, aus demselben Grund wie beim Zoom: ein
       gescanntes Buch liest sich anders als ein handbeschriebenes Heft. */
    const LAUF_MERKER = 'dokLauf:';
    /**
     * Rollt dieses Dokument, oder steht eine Seite? (E551)
     *
     * DIE VORGABE HÄNGT AM DOKUMENT, UND ZWAR AUS EINEM GRUND, DER IN REDURS
     * EIGENEN WORTEN STEHT — in zweien, die einander nicht widersprechen,
     * sondern von zwei verschiedenen Dingen reden:
     *
     *   PDF und Heft (E299):  „die PDF SEITEN sollte wie goodnotes sich ganz
     *                          oeffnen komplet wie one note so"
     *   Folien (E548/E549):   „1:1 wie powerpoint"
     *
     * Ein Skript liest man durch, man blättert es nicht — dabei bleibt es, und
     * `bausteine.css` sagt an seiner Stelle dasselbe. Eine PRÄSENTATION aber
     * rollt in PowerPoint nirgends: dort steht eine Folie, und die Liste
     * links wechselt sie. Die Rolle ist genau das, was einen Foliensatz nicht
     * wie PowerPoint aussehen lässt.
     *
     * Also: ein quer liegender Foliensatz steht von Haus aus, alles andere
     * rollt von Haus aus. Das ist keine Entscheidung GEGEN E299, sondern beide
     * Ansagen dort, wo sie gemeint waren.
     *
     * UND DER SCHALTER BLEIBT DER STÄRKERE. Wer bei einem Foliensatz einmal
     * „▤ Fortlaufend zeigen" gedrückt hat, bekommt beim nächsten Öffnen die
     * Rolle — `meta` gewinnt gegen die Vorgabe, sonst wäre der Schalter eine
     * Attrappe.
     */
    const gemerkterLauf = (pageId) => {
        const gemerkt = Store.getMeta(LAUF_MERKER + pageId);
        if (gemerkt === 'einzel')
            return true;
        if (gemerkt === 'rolle')
            return false;
        try {
            return typeof Folienvorlagen !== 'undefined' &&
                Folienvorlagen.istFoliensatz(pageId) === true;
        }
        catch {
            return false;
        }
    };
    const laufMerken = (pageId, einzeln) => {
        const wert = einzeln ? 'einzel' : 'rolle';
        if (Store.getMeta(LAUF_MERKER + pageId) === wert)
            return;
        Store.setMeta(LAUF_MERKER + pageId, wert);
    };
    const stateFor = (pageId) => {
        const known = states.get(pageId);
        if (known)
            return known;
        /* BEIDE SEITENSPALTEN SIND ZU, AUCH AM RECHNER (E296). Der Inspector
           stand dort bisher offen, weil Platz da war — 280 px, dauerhaft, fuer
           eine Liste, die bei einem frisch eingelesenen PDF leer ist. Wer sie
           braucht, holt sie mit `ⓘ`; wer liest, liest. */
        const created = { index: gemerkteSeite(pageId), zoom: gemerkterZoom(pageId), lupe: false, zoomVorher: 0,
            thumbnailsOpen: false, inspectorOpen: false,
            einzeln: gemerkterLauf(pageId),
            toolsOpen: Store.getMeta('dokWerkzeuge:' + pageId) !== false };
        states.set(pageId, created);
        return created;
    };
    /* ══ EINE SEITE ALS BILD (E469) ═════════════════════════════════════════
       Seitenbild (oder weisses Papier) und die Marken darueber, doppelt so
       gross wie Blattpunkte (A4 → 1191 × 1684), gedreht, wie die Seite
       steht. Die Marken kommen als SVG durch dieselbe Hand wie auf dem
       Blatt (`Marken.zeichneMarke`), dann als Bild auf die Leinwand. Was
       nicht mitkommt, steht in L133: die Textbloecke eines Blatts und
       Bildmarken (ein `<img>` im SVG darf die Leinwand nicht anfassen). */
    const bildLaden = (url) => new Promise((ok, nein) => {
        const i = new Image();
        i.onload = () => ok(i);
        i.onerror = () => nein(new Error('Bild nicht lesbar'));
        i.src = url;
    });
    /**
     * Eine Seite auf eine Leinwand malen und als Bild herausgeben.
     *
     * ZWEI AUFRUFER, EINE RECHNUNG (E488). „Als Bild sichern" will nur den
     * Blob, der PDF-Export braucht auch die Masse — und zwar dieselben. Eine
     * zweite Stelle, die aus `bw`, `bh` und der Drehung Pixel rechnet, wäre
     * die Sorte Abschrift, die irgendwann von der ersten abweicht (§8).
     *
     * `typ` und `guete` gehen an `toBlob`: PNG für ein einzelnes Bild
     * (verlustfrei), JPEG für das PDF (weil `DCTDecode` genau das nimmt).
     */
    const seiteZeichnen = async (block, typ = 'image/png', guete = 0.92, nimm) => {
        if (!block)
            return null;
        const bw = Number(block.bw) || Number(block.blattBreite) || SheetSpace.A4_BREITE;
        const bh = Number(block.bh) || Number(block.blattHoehe) || SheetSpace.A4_HOEHE;
        const g = SheetSpace.gedrehtVon(block);
        const W = Math.round(bw * 2), H = Math.round(bh * 2);
        const quer = g === 90 || g === 270;
        const leinwand = document.createElement('canvas');
        leinwand.width = quer ? H : W;
        leinwand.height = quer ? W : H;
        const stift = leinwand.getContext('2d');
        if (!stift)
            return null;
        stift.fillStyle = '#ffffff';
        stift.fillRect(0, 0, leinwand.width, leinwand.height);
        stift.translate(leinwand.width / 2, leinwand.height / 2);
        stift.rotate(g * Math.PI / 180);
        stift.translate(-W / 2, -H / 2);
        if (block.bildDateiId && typeof Dateien !== 'undefined') {
            try {
                const url = await Dateien.adresse(String(block.bildDateiId));
                if (url)
                    stift.drawImage(await bildLaden(url), 0, 0, W, H);
            }
            catch { /* dann ohne Seitenbild — die Marken kommen trotzdem */ }
        }
        /* WELCHE MARKEN INS BILD GEHEN (E506). Ohne Filter alle — so malt „Als
           Bild sichern" weiterhin die ganze Seite. Der PDF-Export lässt die
           weg, die er als echte Annotation obendrauf schreibt; stünden sie
           auch im Bild, stände jeder Strich zweimal da. */
        const alleMarken = Array.isArray(block.marken) ? block.marken : [];
        const marken = nimm ? alleMarken.filter(nimm) : alleMarken;
        if (marken.length && typeof Marken !== 'undefined') {
            /* ── DIE BILDMARKEN (E479, L133) ────────────────────────────────────
               Ein Foto auf der Seite fehlte auf dem gesicherten Bild. ZWEI
               Gründe, beide gemessen und nicht geraten:
      
               1. `zeichneMarke` setzt das `<image>` ERST NACH, wenn die Adresse
                  aus der Ablage da ist (`bildNachladen`) — `outerHTML` gleich
                  danach hat höchstens den Platzhalter.
               2. Und selbst mit Adresse hilft es nichts: ein SVG, das über ein
                  `<img>` auf die Leinwand kommt, darf NICHTS nachladen. Eine
                  `blob:`-Adresse bleibt darin leer (nachgemessen: der Pixel ist
                  das Platzhalterblau 197/214/243 statt Rot).
      
               Was GEHT, ist `data:` — dieselbe Messung, Pixel exakt rot, und
               die Leinwand bleibt sauber (kein `SecurityError` beim Sichern).
               Also werden die Bilder vorher gelesen und als Daten eingesetzt.
      
               `foreignObject` (womit der getippte Text eines Blatts käme) ist
               KEIN Weg: es zeichnet zwar, TRÜBT aber die Leinwand — `toBlob`
               schlägt danach fehl, und das Sichern ginge gar nicht mehr. Das
               steht so in L133, damit es niemand ein zweites Mal ausprobiert. */
            const bildDaten = new Map();
            for (const m of marken) {
                const id = m && m.art === 'bild' ? String(m.dateiId || '') : '';
                if (!id || bildDaten.has(id) || typeof Dateien === 'undefined')
                    continue;
                try {
                    const url = await Dateien.adresse(id);
                    if (!url)
                        continue;
                    const roh = await (await fetch(url)).blob();
                    bildDaten.set(id, await new Promise((fertig, schief) => {
                        const leser = new FileReader();
                        leser.onload = () => fertig(String(leser.result));
                        leser.onerror = () => schief(new Error('lesen'));
                        leser.readAsDataURL(roh);
                    }));
                }
                catch { /* dann bleibt der Platzhalter, wie bisher */ }
            }
            const att = (wert) => String(wert ?? '')
                .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
            const alsBildMarke = (m) => {
                const daten = bildDaten.get(String(m.dateiId || ''));
                if (!daten)
                    return null;
                const pts = InkGeometry.points(m.pts);
                if (pts.length < 2)
                    return null;
                const box = InkGeometry.rectangle(pts[0], pts[1]);
                const grad = InkGeometry.drehung(m);
                const dreh = grad ? ' transform="rotate(' + att(grad) + ' ' +
                    att(box.x + box.width / 2) + ' ' + att(box.y + box.height / 2) + ')"' : '';
                return '<image x="' + att(box.x) + '" y="' + att(box.y) + '" width="' + att(box.width) +
                    '" height="' + att(box.height) + '" preserveAspectRatio="none"' + dreh +
                    ' href="' + att(daten) + '"/>';
            };
            const innen = marken.map((m) => {
                try {
                    if (m && m.art === 'bild') {
                        const eigen = alsBildMarke(m);
                        if (eigen)
                            return eigen;
                    }
                    return Marken.zeichneMarke(m)?.outerHTML || '';
                }
                catch {
                    return '';
                }
            }).join('');
            /* Die Verlauf-Vorlagen der Abdeckbänder zuerst (E545) — sonst fällt
               der Deckel im Seitenbild auf seine feste Farbe zurück. */
            const defs = typeof Marken.verlaufDefs === 'function'
                ? (Marken.verlaufDefs(marken)?.outerHTML || '') : '';
            const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + bw + ' ' + bh + '" width="' + W + '" height="' + H + '">' + defs + innen + '</svg>';
            const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
            try {
                stift.drawImage(await bildLaden(url), 0, 0, W, H);
            }
            catch { /* eine Marke, die das SVG-Bild verweigert, laesst den Rest stehen */ }
            finally {
                URL.revokeObjectURL(url);
            }
        }
        const pixelBreite = leinwand.width, pixelHoehe = leinwand.height;
        const blob = await new Promise(fertig => leinwand.toBlob(b => fertig(b), typ, guete));
        leinwand.width = 0;
        leinwand.height = 0;
        if (!blob)
            return null;
        /* Die SEITE misst in PDF-Punkten, das BILD in Pixeln — hier doppelt so
           viele, damit auch ein Ausdruck scharf bleibt. Bei einer gedrehten
           Seite tauschen beide ihre Kanten, und zwar gemeinsam. */
        return { blob, pixelBreite, pixelHoehe,
            breite: quer ? bh : bw, hoehe: quer ? bw : bh };
    };
    const seiteAlsBild = async (block) => (await seiteZeichnen(block))?.blob ?? null;
    /* ══ DAS GANZE DOKUMENT ALS PDF (E488, L133) ════════════════════════════
       Jede Seite wird gemalt wie für „Als Bild sichern" — Seitenbild, Marken,
       Drehung — und als JPEG in ein PDF gelegt (`PdfWriter`). Was dabei
       entsteht, ist die ABBILDUNG des Dokuments mit allem darauf; der Text
       der ursprünglichen PDF ist darin nicht mehr durchsuchbar. Das ist eine
       Grenze und keine Schwäche des Wegs: das Original bleibt unangetastet
       (E106), und wer den Text braucht, hat es noch.
  
       STÜCKWEISE, mit einem Rückruf für den Fortschritt: bei vierzig Seiten
       dauert es Sekunden, und eine Oberfläche, die dabei nichts sagt, sieht
       kaputt aus. Der Rückruf darf auch `false` sagen — dann bricht es ab
       und gibt `null`, statt ein halbes Dokument zu liefern. */
    /**
     * EINE MARKE AUS BLATTPUNKTEN IN SEITENPUNKTE (E506).
     *
     * Marken liegen im Blattraum: Ursprung oben links der UNGEDREHTEN Seite.
     * Das gemalte Bild dreht sich mit `gedreht` (E467) — bei 90 und 270 sind
     * Breite und Höhe der fertigen Seite getauscht. Eine Annotation muss
     * dieselbe Drehung mitmachen, sonst liegt sie quer zu ihrem eigenen
     * Strich.
     *
     * DIE DREHUNG IST EINE MATRIX, kein Tausch von x und y — das Stift-
     * Dossier nennt auf Seite 6 ausdrücklich den Ad-hoc-Tausch als den
     * Fehler, nach dem Ink „versetzt, gespiegelt oder um 90 Grad gedreht"
     * erscheint. Hier ist es die Drehung um die Blattmitte, danach die
     * Verschiebung in die Mitte der fertigen Seite; genau die drei Schritte,
     * die `seiteZeichnen` an der Leinwand macht.
     *
     * Der Schreiber dreht danach nur noch die y-Achse um (Seite → Default
     * User Space) — das ist SEINE Sache und steht dort.
     */
    const aufSeite = (marke, block) => {
        if (!marke)
            return null;
        const bw = Number(block?.bw) || Number(block?.blattBreite) || SheetSpace.A4_BREITE;
        const bh = Number(block?.bh) || Number(block?.blattHoehe) || SheetSpace.A4_HOEHE;
        const g = SheetSpace.gedrehtVon(block);
        const quer = g === 90 || g === 270;
        const pw = quer ? bh : bw, ph = quer ? bw : bh;
        const dreh = (q) => {
            const dx = (Number(q[0]) || 0) - bw / 2, dy = (Number(q[1]) || 0) - bh / 2;
            const rx = g === 90 ? -dy : g === 180 ? -dx : g === 270 ? dy : dx;
            const ry = g === 90 ? dx : g === 180 ? -dy : g === 270 ? -dx : dy;
            return [Math.round((pw / 2 + rx) * 100) / 100, Math.round((ph / 2 + ry) * 100) / 100];
        };
        return {
            striche: (marke.striche || []).map((s) => s.map(dreh)),
            kontur: (marke.kontur || []).map((k) => k ? k.map(dreh) : null),
            farbe: marke.farbe, breite: marke.breite,
            deckkraft: marke.deckkraft, name: marke.name
        };
    };
    const alsPdf = async (seiten, melden) => {
        if (typeof PdfWriter === 'undefined' || !Array.isArray(seiten) || !seiten.length)
            return null;
        const schreiber = PdfWriter.neu();
        /* ══ HANDSCHRIFT WIRD ANNOTATION (E506) ═══════════════════════════════
           Was `Marken.annotierbar` sagt, geht NICHT ins Bild, sondern als
           echte `/Ink`-Annotation obendrauf. Die Regel steht in `marken.ts`,
           weil dort auch Farbe, Breite und Druckkurve stehen (§8); hier wird
           nur gefragt.
    
           KANN DIE APP DAS ÜBERHAUPT? Ein älterer Stand von `Marken` oder ein
           Schreiber ohne Annotationen darf das PDF nicht kaputt machen — dann
           gehen alle Marken wie bisher ins Bild. */
        const kannAnnot = typeof Marken !== 'undefined' && !!Marken.annotierbar && !!Marken.alsAnnotation;
        for (let i = 0; i < seiten.length; i++) {
            if (melden && melden(i, seiten.length) === false)
                return null;
            const block = seiten[i];
            const roh = Array.isArray(block?.marken) ? block.marken : [];
            const annot = kannAnnot ? roh.filter((m) => Marken.annotierbar(m)) : [];
            const bild = await seiteZeichnen(block, 'image/jpeg', 0.88, annot.length ? (m) => !Marken.annotierbar(m) : undefined);
            if (!bild)
                continue;
            schreiber.seite({ bild: bild.blob, pixelBreite: bild.pixelBreite, pixelHoehe: bild.pixelHoehe,
                breite: bild.breite, hoehe: bild.hoehe,
                marken: annot.map((m) => aufSeite(Marken.alsAnnotation(m), block))
                    .filter(Boolean) });
        }
        /* Keine einzige Seite hat sich malen lassen — dann ist ein PDF mit null
           Seiten die falsche Antwort. Lieber gar keines und ein Wort dazu. */
        if (!schreiber.seiten())
            return null;
        if (melden)
            melden(seiten.length, seiten.length);
        return schreiber.schliessen();
    };
    /** Ein Blob als Datei zum Speichern anbieten — ohne Server, ohne Fenster. */
    const herunterladen = (blob, name) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { a.remove(); URL.revokeObjectURL(url); }, 2000);
    };
    /* Die offenen PDF-Quellen der Suche (E468), je Quelle ein Griff — und
       seit E671 steht dieser Speicher in `leser.ts`, nicht mehr hier.
  
       WARUM ER UMGEZOGEN IST. E670 brauchte dieselbe Rechnung ein zweites
       Mal (das Werkzeug „Text ändern" sucht das Wort unter dem Zeiger) und
       legte sie in `leser.ts` ab — ohne die hiesige mitzunehmen. Damit gab
       es zwei Speicher für dieselbe Sache, und genau davor warnt §8. Der
       volle Lauf hat es an einer anderen Stelle sichtbar gemacht: `test537`
       zählte einen Querverweis MEHR, weil `Dateien.alsBlob` plötzlich an
       zwei Stellen stand.
  
       Das Loslassen bleibt hier ausgelöst, aber es wird dort getan: ein
       neuer Aufbau gibt die Quellen frei, sonst hält pdf.js je Dokument
       einen Arbeiter. */
    const griffeSchliessen = () => {
        try {
            PdfLeser?.quellenSchliessen?.();
        }
        catch { /* egal */ }
    };
    /* ── DER NACHTRAG DER VERWEISE (E477, L133) ──────────────────────────────
       Seiten, die VOR E473 eingelesen wurden, tragen kein `verweise`-Feld.
       Sie zeigen deshalb keine Verweise — und niemand sieht, warum: eine
       Seite ohne Verweise und eine Seite, an der noch niemand nachgesehen
       hat, sehen gleich aus.
  
       Beim Öffnen eines Dokuments wird darum je Original EINMAL ein Auftrag
       angelegt (`PdfEinlesen.verweiseNachtragen`). Er läuft in der
       Auftragsmaschine — im Hintergrund, mit Pacht und Abbrechen-Knopf —,
       schreibt jeder Seite ihr Feld (auch die leere Liste) und ist danach
       für immer erledigt.
  
       DAS IST NICHT DIE RÜCKKEHR VON E473. Dort hing die ganze
       Original-PDF am ANSEHEN JEDER SEITE, dreimal dieselben Bytes je
       Blick. Hier wird sie einmal je Original geöffnet, nie im Anzeigeweg,
       und das Ansehen selbst liest weiter nur den Block. */
    let verweisHorcher = [];
    const verweisHorchenAus = () => {
        verweisHorcher.forEach(f => { try {
            f();
        }
        catch { /* egal */ } });
        verweisHorcher = [];
    };
    const nachtragAnstossen = (bloecke, neuMalen) => {
        if (typeof PdfEinlesen === 'undefined' || !PdfEinlesen.verweiseNachtragen)
            return;
        const quellen = new Set();
        bloecke.forEach(b => {
            if (b && b.type === 'pdfseite' && b.quelleId && !Array.isArray(b.verweise))
                quellen.add(String(b.quelleId));
        });
        if (!quellen.size)
            return;
        verweisHorchenAus();
        if (typeof Ereignisse !== 'undefined' && Ereignisse.horche) {
            /* Das Ende malt die Verweisschichten neu — sonst stünde der Nachtrag
               in der Ablage und auf dem Bildschirm bis zum nächsten Öffnen
               nichts. Auch im Fehlerfall abmelden: ein Horcher, der auf ein
               Ereignis wartet, das nie kommt, hängt am Dokument fest. */
            const fertig = (d) => {
                if (!d || d.art !== PdfEinlesen.AUFTRAG_VERWEISE)
                    return;
                verweisHorchenAus();
                neuMalen();
            };
            verweisHorcher.push(Ereignisse.horche(ARTEN.auftragBeendet, fertig));
            verweisHorcher.push(Ereignisse.horche(ARTEN.auftragFehler, fertig));
        }
        quellen.forEach(id => { void PdfEinlesen.verweiseNachtragen(id); });
    };
    /** Dokumentbausteine auch innerhalb vorhandener Spalten finden. */
    /* ══ EIN SPRUNG IN EIN ANDERES DOKUMENT (E487) ══════════════════════════
       Die Suche im Studio galt bis hierher dem OFFENEN Dokument (L133). Mit
       „Alle Dokumente" findet sie auch Stellen in fremden — und dann muss
       Redion dorthin springen: erst die andere Seite öffnen, dann in ihr die
       richtige Dokumentseite wählen und dieselbe Suche wieder aufmachen.
  
       `App.oeffne` baut den Studio-Aufbau neu; alles, was der neue Aufbau
       von diesem Sprung wissen muss, steht so lange hier. Nicht in `meta` —
       ein Wunsch, der einen Neustart überlebt, wäre ein Gespenst: man öffnet
       Redion und die Suche geht von selbst auf. */
    let sprungWunsch = null;
    const documentsIn = (page) => {
        if (!page?.id)
            return [];
        const found = [];
        const seen = new Set();
        const visit = (id, depth) => {
            if (depth > 8 || seen.has(id))
                return;
            seen.add(id);
            Store.childrenOf(id).forEach((block) => {
                if (!block || block.alive === false)
                    return;
                if (block.type === 'pdfseite' || block.type === 'blatt')
                    found.push(block);
                else if (block.type === 'columns' || block.type === 'columns3' || block.type === 'spalte')
                    visit(block.id, depth + 1);
            });
        };
        visit(page.id, 0);
        /* IN DER REIHENFOLGE DES INHALTS, nicht nach `nr` (E467). Bis E466
           wurden Seiten derselben Quelle nach ihrer PDF-Seitenzahl sortiert —
           ein Sicherheitsnetz, das `einlesen.ts` nie brauchte (es legt die
           Seiten der Reihe nach an) und das seit E467 im Weg steht: wer eine
           Seite nach oben schiebt, schiebt sie im `content` der Eltern, und
           genau das soll man sehen. `nr` bleibt, was es ist — die Seite der
           QUELLE, nach der „feiner rechnen" greift —, und darf nicht wandern. */
        return found;
    };
    /* ══ DIE SUCHE ÜBER ALLE DOKUMENTE (E487) ═══════════════════════════════
       Was durchsucht wird, ist NICHT die PDF-Quelle: die läge für jedes
       fremde Dokument einzeln zu lesen an, und ein Suchfeld, das dabei
       zehn Sekunden steht, benutzt niemand. Durchsucht wird, was ohnehin im
       Speicher liegt — `suchtext` der PDF-Seite (E107), der Text der Text-
       und Zettelmarken eines Blatts und der Text seiner Kinder.
  
       Der Unterschied ist ehrlich zu nennen und steht am Knopf: im OFFENEN
       Dokument findet die Suche die Stelle auf der Seite, in fremden findet
       sie die SEITE. Wer hinspringt, sucht dort mit derselben Frage weiter
       und bekommt die Stelle.
  
       GRENZEN: höchstens 60 fremde Treffer und höchstens 4000 durchsuchte
       Blöcke. Beides wird GESAGT, wenn es greift (§35) — eine Liste, die
       stillschweigend aufhört, behauptet, es gebe nicht mehr. */
    const FREMD_HOECHSTENS = 60;
    const FREMD_BLOECKE = 4000;
    /** Die Seite, zu der ein Dokumentblock gehört — dieselbe Leiter, die
     *  `documentsIn` hinabsteigt, nur andersherum. */
    const seiteZu = (block) => {
        let jetzt = block;
        for (let n = 0; jetzt && n < 10; n++) {
            const eltern = jetzt.parentId ? Store.getBlock(jetzt.parentId) : null;
            if (!eltern)
                return null;
            if (eltern.type === 'page')
                return eltern;
            jetzt = eltern;
        }
        return null;
    };
    /**
     * Alle Dokumentseiten ausserhalb der gegebenen Seite, die das Wort tragen.
     *
     * `ausser` ist die Seite, die gerade offen ist — ihre Treffer stehen
     * schon als Kästen auf dem Papier und gehören nicht noch einmal in die
     * Liste.
     */
    /**
     * TRÄGT DIESE DOKUMENTSEITE DAS WORT? Und wenn ja, in welchem Text?
     *
     * Die eine Stelle, an der das entschieden wird (§8) — seit E500 fragen
     * zwei danach: die Suche über mehrere Dokumente (E487) und die
     * Schalensuche, die jetzt die STELLE nachliefert statt nur das Dokument.
     * Zwei Abschriften derselben Regel liefen auseinander, und dann fände die
     * eine Suche etwas, das die andere nicht kennt.
     *
     * Was durchsucht wird, ist NICHT die PDF-Quelle: die läge für jedes
     * Dokument einzeln zu lesen an. Durchsucht wird, was ohnehin im Speicher
     * liegt — `suchtext` der PDF-Seite (E107), der Text der Text- und
     * Zettelmarken eines Blatts und der Text seiner Kinder.
     */
    const fundIm = (block, q) => {
        if (!block || !q)
            return '';
        if (block.type === 'pdfseite') {
            const text = String(block.suchtext || block.ocrText || '');
            return text.toLowerCase().includes(q) ? text : '';
        }
        for (const m of (Array.isArray(block.marken) ? block.marken : [])) {
            if ((m?.art === 'text' || m?.art === 'zettel') && String(m.text ?? '').toLowerCase().includes(q)) {
                return String(m.text);
            }
        }
        for (const kind of Store.childrenOf(block.id)) {
            if (String(kind?.text ?? '').toLowerCase().includes(q))
                return String(kind.text);
        }
        return '';
    };
    /**
     * DIE ERSTE STELLE IN DIESEM DOKUMENT, die das Wort trägt (E500).
     *
     * Die Schalensuche (Strg P) findet Seiten; bei einem Dokument mit
     * zweihundert Seiten landete man damit auf Seite eins und musste dort
     * ein zweites Mal suchen. Diese Funktion liefert die Seitenzahl, den
     * Block und einen Ausschnitt nach — mit derselben Rechnung wie die
     * Suche im Studio.
     */
    const stelleIn = (page, wort) => {
        const q = String(wort || '').trim().toLowerCase();
        if (q.length < 2 || !page)
            return null;
        const liste = documentsIn(page);
        for (let i = 0; i < liste.length; i++) {
            const fund = fundIm(liste[i], q);
            if (!fund)
                continue;
            const roh = fund.replace(/\s+/g, ' ');
            const wo = roh.toLowerCase().indexOf(q);
            const von = Math.max(0, wo - 30);
            const auszug = (von > 0 ? '… ' : '') + roh.slice(von, von + 90).trim()
                + (roh.length > von + 90 ? ' …' : '');
            return { blockId: String(liste[i].id), nr: i + 1, auszug };
        }
        return null;
    };
    const fremdeTreffer = (wort, ausser) => {
        const q = String(wort || '').trim().toLowerCase();
        if (q.length < 2)
            return { liste: [], mehr: false };
        const liste = [];
        let gesehen = 0;
        let mehr = false;
        const stelle = (text) => {
            const roh = String(text ?? '').replace(/\s+/g, ' ');
            const wo = roh.toLowerCase().indexOf(q);
            if (wo < 0)
                return roh.slice(0, 90);
            const von = Math.max(0, wo - 30);
            return (von > 0 ? '… ' : '') + roh.slice(von, von + 90).trim() + (roh.length > von + 90 ? ' …' : '');
        };
        for (const block of Object.values(Store.cache.blocks)) {
            if (liste.length >= FREMD_HOECHSTENS) {
                mehr = true;
                break;
            }
            if (++gesehen > FREMD_BLOECKE) {
                mehr = true;
                break;
            }
            if (!block || block.alive === false)
                continue;
            if (block.type !== 'pdfseite' && block.type !== 'blatt')
                continue;
            const seite = seiteZu(block);
            if (!seite || !seite.alive || seite.id === ausser)
                continue;
            if (typeof Konten !== 'undefined' && Konten.darf && !Konten.darf('lesen', seite.id))
                continue;
            const fund = fundIm(block, q);
            if (!fund)
                continue;
            liste.push({ seiteId: seite.id, blockId: block.id,
                name: String(seite.text || 'Ohne Titel'), icon: String(seite.icon || '📄'),
                nr: documentsIn(seite).findIndex(b => b.id === block.id) + 1,
                auszug: stelle(fund) });
        }
        /* Nach Dokument, dann nach Seite — sonst stünden die Seiten eines
           Dokuments in der Reihenfolge des Speichers durcheinander. */
        liste.sort((a, b) => a.name.localeCompare(b.name) || a.nr - b.nr);
        return { liste, mehr };
    };
    const available = (page) => documentsIn(page).length > 0;
    const active = (page) => !!page?.dokumentModus && available(page);
    /** Vor einem Deep-Link den einen Dokumentblock waehlen, der gleich
        gerendert werden soll. Der Zustand ist nur Ansicht und wird nicht als
        zweite Dokumentstruktur gespeichert. */
    const select = (page, blockId) => {
        const index = documentsIn(page).findIndex(block => block.id === blockId);
        if (index < 0)
            return false;
        stateFor(page.id).index = index;
        seiteMerken(page.id, index);
        return true;
    };
    const toggle = (page, next) => {
        if (!page?.id || (!available(page) && next !== false))
            return;
        Store.updateBlock(page.id, { dokumentModus: next ?? !page.dokumentModus });
        App.zeichneSeite();
    };
    /**
     * Wie die Seite heisst — und bei einer Folie: WELCHE (E547).
     *
     * Hier stand für jedes `blatt` der eine Satz „A4-Blatt". Bei einer
     * eingelesenen Präsentation heissen damit 27 Einträge gleich, im
     * `aria-label` ebenso („A4-Blatt öffnen", 27-mal). Für einen Menschen am
     * Bildschirm unbrauchbar, für ein Vorleseprogramm schlimmer (§38).
     *
     * Ein Blatt mit eigenem Text trägt seinen Namen selbst — der
     * `.pptx`-Einleser setzt ihn aus dem Folientitel (E540). Ein leeres Blatt
     * aus dem Slash-Menü hat keinen und bleibt „A4-Blatt", wie es war.
     */
    const sourceLabel = (documentBlock) => {
        if (documentBlock.type === 'pdfseite')
            return documentBlock.herkunft === 'bild'
                ? 'Bild' + (documentBlock.bildName ? ' · ' + String(documentBlock.bildName).slice(0, 40) : '')
                : 'PDF · Seite ' + (Number(documentBlock.nr) || 1);
        const eigen = String(documentBlock.text || '').trim();
        return eigen ? eigen.slice(0, 60) : 'A4-Blatt';
    };
    const linkedObjects = (page, documentBlock) => Object.values(Store.cache.blocks).filter(block => {
        if (!block?.alive || !block.sourceRef)
            return false;
        const source = block.sourceRef;
        return source.blockId === documentBlock.id ||
            (!source.blockId && source.pageId === page.id);
    });
    /* Sicheres HTML für das Folien-Menü (§19). Es ersetzt WIRKLICH — der
       Fehler, der beim Lesen richtig aussieht, ist hier keiner. Der Name
       einer Marke oder eines Layouts kommt aus den Daten. */
    const escapeHtml = (wert) => String(wert ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    /**
     * Ist DIESE Seite ein Foliensatz? (E549)
     *
     * Gefragt wird `Folienvorlagen` — dort steht die Regel (quer statt
     * hochkant, und warum), und eine zweite Fassung hier liefe ihr davon.
     * Fehlt das Modul (Einzeldatei, halb geladenes Fenster), ist die Antwort
     * „nein": dann gibt es auch keinen Katalog zu zeigen.
     */
    const istFoliensatz = (page) => {
        try {
            return typeof Folienvorlagen !== 'undefined' &&
                Folienvorlagen.istFoliensatz(page?.id);
        }
        catch {
            return false;
        }
    };
    /**
     * Wie heisst hier EIN Blatt — „Folie" oder „Seite"? (E552)
     *
     * Redur: „weiter mache gleich wie powerpoint". In PowerPoint heisst nichts
     * „Seite": nicht die Liste links, nicht der Stand unten, nicht „Neue
     * Folie", nicht „Folie duplizieren". Das Wort ist kein Schmuck — wer in
     * einer Präsentation „Seite 3 von 7" liest, liest die Sprache eines
     * anderen Programms.
     *
     * EIN ORT FÜR DAS WORT, nicht zwanzig. Die Alternative wäre, an jeder der
     * gut zwanzig Stellen `istFoliensatz(page) ? … : …` zu schreiben — und die
     * einundzwanzigste vergisst dann jemand. Das ist derselbe Grund, aus dem
     * §8 keine zweiten Kataloge will, nur eine Nummer kleiner.
     *
     * DIE DATEN HEISSEN WEITER `seite` UND `pdfseite`. Übersetzt wird, was ein
     * Mensch liest — nicht, was gespeichert ist (§53.3, Grenze 1).
     */
    const wortEins = (page) => istFoliensatz(page) ? 'Folie' : 'Seite';
    const wortViele = (page) => istFoliensatz(page) ? 'Folien' : 'Seiten';
    /**
     * Das Folien-Menü aus dem Bandkatalog bauen und zeigen (E549).
     *
     * Kein eigener Katalog: `Register.menueband.inReiter('praesentation')`
     * gibt die Gruppen, wie sie auch im Band stünden — samt `zeigen()`, also
     * ohne das, was hier gar nicht ginge.
     */
    const folienMenue = (knopf) => {
        const gruppen = (() => {
            try {
                return Register?.menueband?.inReiter?.('praesentation') || [];
            }
            catch {
                return [];
            }
        })();
        const eintraege = gruppen.flatMap((g) => g.eintraege || []);
        if (!eintraege.length) {
            UI.toast('Für diese Folien gibt es gerade nichts');
            return;
        }
        const kasten = knopf.getBoundingClientRect();
        /* `gruppe`, NICHT `name` — so heisst das Feld in `inReiter()`
           (nachgesehen, nicht erinnert, E21). Der erste Entwurf schrieb
           `g.name`, und die Überschriften waren LEER: drei graue Streifen von
           12 px Höhe ohne Text. Gemerkt hat es das Bild, nicht der Prüflauf —
           der las das Register statt des Menüs und blieb grün (§55.2).
           DER HINWEIS STEHT AM `title`, NICHT IM MENÜ. Als `.sub` daneben
           drückte er die Namen auf drei Zeilen („Neue / Folie", gemessen 56 px
           statt 35). Für Zeiger und Vorleseprogramm reicht `title` (§38), und
           die Liste bleibt lesbar. */
        const html = gruppen.map((g) => '<div class="grp">' + escapeHtml(String(g.gruppe || '')) + '</div>' +
            (g.eintraege || []).map((e) => `<button data-fm="${escapeHtml(String(e.id))}"` +
                (e.hinweis ? ` title="${escapeHtml(String(e.hinweis))}"` +
                    ` aria-label="${escapeHtml(String(e.name) + ' — ' + String(e.hinweis))}"` : '') +
                '>' + escapeHtml(String(e.name)) + '</button>').join('')).join('<hr>');
        const menue = UI.menu(html, kasten.left, kasten.bottom + 4);
        knopf.setAttribute('aria-expanded', 'true');
        menue.addEventListener('click', (ev) => {
            const ziel = ev.target?.closest('[data-fm]');
            if (!ziel)
                return;
            menue.remove();
            knopf.setAttribute('aria-expanded', 'false');
            const eintrag = eintraege.find((e) => String(e.id) === ziel.dataset['fm']);
            try {
                eintrag?.tun?.();
            }
            catch {
                UI.toast('Das ging gerade nicht');
            }
        });
    };
    /* ══════════════════════════════════════════════════════════════════════
     * DAS FOLIENBAND — Reiter ÜBER der Folie (E550)
     * ----------------------------------------------------------------------
     * Redur: „oben mit menü … 1:1 wie powerpoint". E549 hat den KATALOG
     * gebaut (ein Reiter „Präsentation" im Band, ein Menü in der
     * Dokumentleiste); was fehlte, war der ORT — eine Reiterzeile mit einem
     * Band darunter, wie sie jedes Textprogramm über dem Blatt hat.
     *
     * WARUM NICHT EINFACH `#menueband` DORT ZEIGEN. Weil es gemessen
     * schlechter war (E549): am Rechner ist das globale Band eine zugeklappte
     * LADE hinter `#studio-tools`, und im Dokumentmodus legte sich seine Ecke
     * „Werkzeuge ⌄" bei 1440 × 852 deckungsgleich über die Dokumentleiste.
     * Zwei Köpfe übereinander. Das Folienband fliesst dagegen IN der Spalte
     * mit — es überdeckt nichts, es nimmt Platz.
     *
     * WELCHE REITER — UND DIE GRÜNDE SIND GEMESSEN, NICHT GEWÄHLT
     *
     * Alle 151 Einträge des Bandkatalogs sind bei offenem Foliensatz
     * aufgerufen worden, jeder einzeln, und nachgesehen wurde, ob danach ein
     * Block, ein Menü oder ein Fehler da war:
     *
     *     start        14 Knöpfe  ·  14 tun nichts   (Absatz und Schrift
     *                                                 brauchen eine
     *                                                 Schreibmarke; im
     *                                                 Dokumentmodus gibt es
     *                                                 keine)
     *     einfuegen    69 Knöpfe  ·  65 tun nichts
     *     ansicht      10 Knöpfe  ·   2 tun etwas sichtbar, der Rest sind
     *                                 Vollbild/Drucken — die Messung SIEHT
     *                                 sie nur nicht
     *     verlauf       9 Knöpfe  ·   3 sichtbar (Rückgängig auf leerem
     *                                 Stapel tut zu Recht nichts)
     *     ueberpruefen  6 Knöpfe  ·   5 sichtbar
     *     hilfe         6 Knöpfe  ·   3 sichtbar
     *
     * Abgestürzt ist keiner, und die Seite meldete null Fehler. Draussen
     * bleiben deshalb genau die zwei, bei denen es eindeutig ist: `start` und
     * `einfuegen`. 79 von 83 Knöpfen ohne Wirkung wäre kein Menüband, sondern
     * eine Enttäuschungsmaschine (derselbe Grund wie `zeigen()` im Register).
     *
     * UND `zeichnen` BLEIBT AUCH DRAUSSEN, aus einem anderen Grund: seine
     * dreissig Knöpfe stehen als Zeichenleiste schon dauerhaft zwei Zeilen
     * tiefer. Dieselbe Sache an zwei sichtbaren Stellen gleichzeitig ist
     * genau das, was §8 verbietet — und die dreissig hätten die Reihe
     * ohnehin gesprengt.
     *
     * WAS DAS BAND NICHT SELBST ZEICHNET: die Knöpfe. Die kommen aus
     * `Menueband.knopf` und `Menueband.gruppeZeichnen` (dort seit E550
     * hinausgereicht). Ein zweiter Zeichner hätte die Probe, das `an()`, den
     * Satz für Vorleseprogramme und das Kürzel im Tooltip nachbauen müssen —
     * vier Sachen, die man je einzeln vergisst.
     * ══════════════════════════════════════════════════════════════════════ */
    /** Die Reiter, die das Folienband zeigt — in dieser Reihenfolge. */
    const FOLIENBAND_REITER = ['praesentation', 'zeichnen', 'ansicht', 'verlauf',
        'ueberpruefen', 'hilfe'];
    /**
     * „Zeichnen" ist ein Reiter wie in PowerPoint — aber sein Inhalt kommt
     * NICHT aus dem Register (E552).
     *
     * Redur: „weiter mache gleich wie powerpoint". PowerPoint hat einen
     * Reiter „Zeichnen"; Redion hatte eine Zeichenleiste, die immer dastand.
     * Beides zusammen wären zwei Leisten für dieselbe Sache.
     *
     * WARUM NICHT DIE REGISTEREINTRÄGE. Der Reiter `zeichnen` im Bandkatalog
     * hat dreissig Einträge, und alle vierzehn geprüften bedienen die
     * SEITENfläche, nicht die Dokumentschicht. Gemessen bei offenem
     * Foliensatz: kein einziger änderte das gewählte Werkzeug des Dokuments,
     * und `an()` gab bei ALLEN vierzehn `true` zurück — im Band stünden also
     * vierzehn gleichzeitig gewählte Knöpfe. Ein Werkzeugkasten, in dem
     * alles markiert ist, sagt nichts (E212 hat genau das einmal repariert).
     *
     * Also zieht die ECHTE Zeichenleiste um: dasselbe Element, dieselben
     * Knöpfe, dieselben Griffe — nur an einem anderen Platz. Ein Nachbau
     * hätte `applyPen`, `inkSync`, den Verlauf und die Stiftoptionen
     * mitkopieren müssen, und eine Kopie davon wäre still auseinandergelaufen.
     */
    const ZEICHEN_REITER = 'zeichnen';
    /**
     * Ab dieser Fensterbreite bekommt ein Foliensatz das Band.
     *
     * Darunter bleibt es beim Knopf „📽️ Folie" aus E549. Das ist keine
     * Bequemlichkeit: bei 390 px sind Kopfleiste (48) und Zeichenleiste (53)
     * schon 101 px, und die Folie selbst ist dort nur 194 px hoch. Ein Band
     * von rund 110 px nähme ihr mehr als die Hälfte — PowerPoint zeigt am
     * Telefon aus demselben Grund keines.
     */
    const BAND_AB = 900;
    /** Welcher Reiter zuletzt offen war — je Seite gemerkt. */
    const bandReiterVon = (pageId) => {
        const gemerkt = String(Store.getMeta('folienbandReiter:' + pageId, '') || '');
        return FOLIENBAND_REITER.includes(gemerkt) ? gemerkt : FOLIENBAND_REITER[0];
    };
    /**
     * Das Folienband bauen — Reiterzeile und Band darunter.
     *
     * Gibt `null`, wenn es hier keines geben soll: kein Foliensatz, zu
     * schmales Fenster, oder kein Reiter mit Inhalt. Der Aufrufer hängt dann
     * nichts ein, statt eine leere Leiste zu zeigen.
     */
    const folienbandBauen = (page, zeichenleiste) => {
        if (!istFoliensatz(page))
            return null;
        if (innerWidth < BAND_AB)
            return null;
        const inReiter = (id) => {
            try {
                return Register?.menueband?.inReiter?.(id) || [];
            }
            catch {
                return [];
            }
        };
        /* Nur Reiter, die WIRKLICH etwas zeigen. `zeigen()` im Register kann
           einen ganz leergeräumt haben — in der Einzeldatei etwa. */
        const offen = FOLIENBAND_REITER
            .map(id => ({ id, gruppen: id === ZEICHEN_REITER ? [] : inReiter(id) }))
            /* „Zeichnen" hängt an der LEISTE, nicht am Register — siehe oben.
               Gibt es sie nicht (gesperrte Seite, kein Recht), fehlt der Reiter,
               statt leer dazustehen. */
            .filter(r => r.id === ZEICHEN_REITER
            ? !!zeichenleiste
            : r.gruppen.some((g) => (g.eintraege || []).length));
        if (!offen.length)
            return null;
        const namen = {};
        try {
            for (const r of (Register?.menueband?.REITER || []))
                namen[String(r.id)] = String(r.name);
        }
        catch { /* dann stehen die Kennungen da, und das ist immer noch lesbar */ }
        const band = document.createElement('div');
        band.className = 'folienband';
        const reiterzeile = document.createElement('div');
        reiterzeile.className = 'folienband-reiter';
        reiterzeile.setAttribute('role', 'tablist');
        reiterzeile.setAttribute('aria-label', 'Folienband');
        const flaeche = document.createElement('div');
        flaeche.className = 'folienband-flaeche';
        flaeche.setAttribute('role', 'tabpanel');
        let aktiv = bandReiterVon(String(page?.id || ''));
        if (!offen.some(r => r.id === aktiv))
            aktiv = offen[0].id;
        /* ══ DAS BAND KLAPPT ZU (E612) ═══════════════════════════════════════
           Redur, 16. September, mit einem Bild des Studios: „hier sieht es sehr
           viel aus und haben nicht so viel Platz für Bearbeiten … will nicht so
           viel Sachen sehen aber trotzdem alles machen kann".
    
           Gemessen waren es 301 px über der ersten Folie, und nichts davon liess
           sich wegklicken. Die Fläche ist mit 74 px der grösste Posten, den ein
           Klick zurückholen kann.
    
           DIE VORGABE IST `data-ruhig` — kein zweiter Schalter (§8). Das globale
           Menüband ist seit E236 überall zugeklappt voreingestellt; hier gilt
           dasselbe, nur an die ruhige Fassung gehängt, die im Studio ohnehin
           schon am `body` steht (gemessen: `data-ruhig="an"`).
    
           DIE REITERZEILE BLEIBT STEHEN. Sie ist der Griff — wie `.mb-rechts`
           die 36-px-Zeile in E383 hält. Wer sie mit ausblendet, hat geklappt
           und dabei gelöscht. */
        const MERKE_ZU = 'folienbandZu';
        const ruhigAn = () => document.body.dataset['ruhig'] !== 'aus';
        let zu = ruhigAn() && Store.getMeta(MERKE_ZU, true) === true;
        const flaecheFuellen = () => {
            /* BEIM REITER „ZEICHNEN" TRITT DIE LEISTE AN DIE STELLE DES BANDES.
               Sie bleibt IMMER ein Kind des Bandes und wird nur `hidden` — ein
               Aus- und Einhängen würde bei jedem Reiterwechsel ihre Griffe und
               ihren Verlaufszustand durch den Baum schieben. */
            if (zeichenleiste) {
                zeichenleiste.hidden = aktiv !== ZEICHEN_REITER;
                zeichenleiste.setAttribute('aria-label', aktiv === ZEICHEN_REITER ? 'Zeichnen' : 'PDF bearbeiten');
            }
            /* ZUGEKLAPPT VERSTECKT DIE FLÄCHE — aber NIE die Zeichenleiste.
               Sie ist ein Kind des Bandes (E552), und wer beim Reiter „Zeichnen"
               zuklappte, stünde ohne Werkzeuge da (§47). Deshalb hängt ihre
               Sichtbarkeit oben allein am Reiter, nicht an `zu`. */
            flaeche.hidden = (aktiv === ZEICHEN_REITER && !!zeichenleiste) || zu;
            flaeche.replaceChildren();
            if (flaeche.hidden)
                return;
            const gruppen = (offen.find(r => r.id === aktiv)?.gruppen || [])
                .filter((g) => (g.eintraege || []).length);
            gruppen.forEach((g, i) => {
                if (i) {
                    const strich = document.createElement('div');
                    strich.className = 'folienband-trenner';
                    strich.setAttribute('aria-hidden', 'true');
                    flaeche.appendChild(strich);
                }
                /* DERSELBE ZEICHNER WIE IM GLOBALEN BAND (§8). Fehlt er — halb
                   geladenes Fenster —, bleibt die Fläche leer statt falsch. */
                try {
                    flaeche.appendChild(Menueband.gruppeZeichnen(g));
                }
                catch { /* dann eben nicht */ }
            });
            /* DIE ZEICHEN MÜSSEN GEFÜLLT WERDEN, SONST SIND SIE NICHT DA.
               `Menueband.knopf` hängt für einen Symbolnamen nur ein leeres
               `<span data-sym="plus">` ein — gemalt wird es von
               `Register.symbole.fuelle(wurzel)`. Im globalen Band passiert das
               an drei Stellen nach jedem Neuzeichnen; hier wäre es beinahe
               vergessen worden, und auf dem ersten Bild stand die ganze Reihe
               als nackter Text da („Neue Folie   Folienliste   Präsentieren"),
               ohne ein einziges Zeichen. Kein Prüflauf hätte das gemeldet: die
               Knöpfe waren alle da, hiessen richtig und taten das Richtige. */
            if (Register?.symbole?.fuelle) {
                try {
                    Register.symbole.fuelle(flaeche);
                }
                catch { /* ohne Zeichen bleibt der Name — schlechter, aber nicht kaputt */ }
            }
            flaeche.setAttribute('aria-label', namen[aktiv] || aktiv);
        };
        /** Auf- und zuklappen, und es hinterher merken. */
        const zuSetzen = (neu) => {
            zu = neu;
            try {
                Store.setMeta(MERKE_ZU, neu);
            }
            catch { /* das Merken ist Bequemlichkeit, kein Auftrag */ }
            band.dataset['zu'] = neu ? 'an' : 'aus';
            reiterzeile.querySelectorAll('[data-fb-reiter]').forEach(x => x.setAttribute('aria-expanded', String(!neu)));
            const k = reiterzeile.querySelector('[data-fb-klapp]');
            if (k) {
                k.setAttribute('aria-expanded', String(!neu));
                k.title = neu ? 'Band aufklappen' : 'Band zuklappen';
                k.setAttribute('aria-label', k.title);
            }
            flaecheFuellen();
        };
        offen.forEach(r => {
            const t = document.createElement('button');
            t.type = 'button';
            t.className = 'folienband-reiter-knopf';
            t.dataset['fbReiter'] = r.id;
            t.setAttribute('role', 'tab');
            t.textContent = namen[r.id] || r.id;
            t.setAttribute('aria-selected', String(r.id === aktiv));
            t.setAttribute('aria-expanded', String(!zu));
            t.addEventListener('click', () => {
                /* DER REITER IST DER GRIFF (E612). Ein Klick auf den SCHON
                   gewählten Reiter klappt auf und wieder zu — wörtlich das Muster
                   der Strichstärken-Klappe (E465): „die schon gewählte Stufe ein
                   zweites Mal antippen". Ein Klick auf einen ANDEREN Reiter
                   wechselt und klappt auf; so macht es PowerPoint auch, und ein
                   Reiter, der nichts zeigt, wäre ein toter Knopf.
        
                   „Zeichnen" ist ausgenommen: dort steht die Leiste selbst, und
                   `zu` würde sie nicht treffen (siehe `flaecheFuellen`). Ein
                   zweiter Klick darauf soll nichts tun, statt einen Zustand zu
                   merken, den man nicht sieht. */
                if (r.id === aktiv) {
                    if (r.id !== ZEICHEN_REITER)
                        zuSetzen(!zu);
                    return;
                }
                aktiv = r.id;
                try {
                    Store.setMeta('folienbandReiter:' + String(page?.id || ''), aktiv);
                }
                catch { /* das Merken ist Bequemlichkeit, kein Auftrag */ }
                reiterzeile.querySelectorAll('[data-fb-reiter]').forEach(x => x.setAttribute('aria-selected', String(x.dataset['fbReiter'] === aktiv)));
                if (r.id === ZEICHEN_REITER)
                    flaecheFuellen();
                else
                    zuSetzen(false);
            });
            reiterzeile.appendChild(t);
        });
        /* EIN ZEICHEN, DASS DA NOCH ETWAS IST (E612, Lehre aus E383).
           Beim Hinsehen (§55.3) sagte die Reiterzeile allein nicht, dass sich
           darunter etwas aufklappen lässt — genau der Fund, den E383 beim
           Klapp-Pfeil des Menübandes gemacht hat: „allein an der rechten Kante
           kann er zu einer Zierde werden, die niemand anklickt". Dort war die
           Antwort, ihm ein Wort zu geben; hier genügt das Zeichen, weil die
           Reiter daneben schon sagen, WAS aufklappt.
    
           §37: der Knopf ist so hoch wie die Reiterzeile (35 px) und damit ein
           Nebenweg. Das ist keine neue Abweichung — die Zeile ist seit E550 so
           hoch, und ihre Reiter sind es auch; ein 44-px-Knopf darin würde die
           Zeile aufblasen und einen Teil des gewonnenen Platzes zurücknehmen.
           Am Finger gilt weiter `pdf-studio.css:516` mit 44 px für die Zeile. */
        const klapp = document.createElement('button');
        klapp.type = 'button';
        klapp.className = 'folienband-klapp';
        klapp.dataset['fbKlapp'] = '1';
        klapp.textContent = '\u2304';
        klapp.addEventListener('click', () => zuSetzen(!zu));
        reiterzeile.appendChild(klapp);
        band.append(reiterzeile, flaeche);
        if (zeichenleiste)
            band.appendChild(zeichenleiste);
        band.dataset['zu'] = zu ? 'an' : 'aus';
        klapp.setAttribute('aria-expanded', String(!zu));
        klapp.title = zu ? 'Band aufklappen' : 'Band zuklappen';
        klapp.setAttribute('aria-label', klapp.title);
        flaecheFuellen();
        /* VON AUSSEN UMSCHALTBAR (E552): „✎ Annotieren" holt den Reiter
           „Zeichnen" nach vorn. Das ist der Preis dafür, dass die Leiste nicht
           mehr immer dasteht — wer annotieren will, soll den Stift sehen, ohne
           ihn erst zu suchen. PowerPoint macht dasselbe, wenn man in den
           Freihandmodus geht. */
        band.reiterWaehlen = (id) => {
            if (!offen.some(r => r.id === id) || aktiv === id)
                return;
            aktiv = id;
            try {
                Store.setMeta('folienbandReiter:' + String(page?.id || ''), aktiv);
            }
            catch { /* das Merken ist Bequemlichkeit, kein Auftrag */ }
            reiterzeile.querySelectorAll('[data-fb-reiter]').forEach(x => x.setAttribute('aria-selected', String(x.dataset['fbReiter'] === aktiv)));
            flaecheFuellen();
        };
        return band;
    };
    /** Die Masse eines Dokumentblocks — PDF-Seite wie Blatt, in Punkten. */
    const masseVon = (block) => ({
        bw: Number(block?.bw) || Number(block?.blattBreite) || SheetSpace.A4_BREITE,
        bh: Number(block?.bh) || Number(block?.blattHoehe) || SheetSpace.A4_HOEHE,
    });
    /**
     * Die Marken eines Blocks als kleines SVG für die Miniatur (E547).
     *
     * `null`, wenn es nichts zu zeichnen gibt — dann bleibt der Bleistift.
     *
     * DIE ABDECKUNG DECKT AUCH HIER. Das ist kein Beiwerk: `zeichneMarke`
     * gibt sie zugedeckt heraus, und genau darum darf diese Vorschau derselbe
     * Zeichner sein und kein zweiter (E266, §8). Eine Seitenliste, in der die
     * Antworten offen stehen, wäre schlimmer als gar keine Vorschau.
     *
     * BILDMARKEN werden mitgezeichnet, aber nur, wenn ihre Adresse SCHON
     * bekannt ist. Sonst löste eine Liste mit 27 Folien 27 Dateilesungen aus,
     * nur um Daumennagel-Bilder zu füllen — dieselbe Vorsicht wie bei den
     * PDF-Vorschaubildern eine Funktion weiter unten.
     */
    const markenVorschau = (block, mass) => {
        const marken = Array.isArray(block?.marken) ? block.marken : [];
        if (!marken.length || typeof Marken === 'undefined')
            return null;
        const bekannt = (m) => m?.art !== 'bild' ||
            (typeof Dateien !== 'undefined' && !!Dateien.adresseBekannt?.(m.dateiId));
        const raum = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        raum.setAttribute('class', 'document-thumbnail-marken');
        raum.setAttribute('viewBox', '0 0 ' + mass.bw + ' ' + mass.bh);
        raum.setAttribute('preserveAspectRatio', 'none');
        raum.setAttribute('aria-hidden', 'true');
        const defs = typeof Marken.verlaufDefs === 'function' ? Marken.verlaufDefs(marken) : null;
        if (defs)
            raum.appendChild(defs);
        let gezeichnet = 0;
        for (const marke of marken) {
            if (!bekannt(marke))
                continue;
            try {
                const knoten = Marken.zeichneMarke(marke);
                if (knoten) {
                    raum.appendChild(knoten);
                    gezeichnet++;
                }
            }
            catch { /* eine Marke, die sich weigert, lässt den Rest stehen */ }
        }
        return gezeichnet ? raum : null;
    };
    /**
     * EINE MINIATUR — seit E480 in einer ZEILE mit ihrem Menüknopf.
     *
     * Warum eine Zeile und nicht ein Knopf im Knopf: ein `<button>` in einem
     * `<button>` gibt es in HTML nicht, und ein `<div role="button">` daraus
     * zu machen hiesse, Tastatur und Screenreader von Hand nachzubauen, was
     * der echte Knopf mitbringt (§38). Also stehen beide nebeneinander, und
     * `.document-thumbnail` bleibt, was es war — Prüfläufe und CSS finden
     * es unverändert.
     */
    const thumbnail = (documentBlock, index, selected) => {
        const zeile = document.createElement('div');
        zeile.className = 'document-thumb-zeile';
        zeile.dataset.documentThumbZeile = String(index);
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'document-thumbnail' + (selected ? ' is-selected' : '');
        button.dataset.documentIndex = String(index);
        button.setAttribute('aria-label', sourceLabel(documentBlock) + ' öffnen');
        button.setAttribute('aria-current', selected ? 'page' : 'false');
        const preview = document.createElement('span');
        preview.className = 'document-thumbnail-preview';
        /* DAS MASS KOMMT VOM BLOCK, NICHT AUS DEM STILBLATT (E547).
           `.document-thumbnail-preview` trägt `aspect-ratio:210/297` — A4
           hochkant, fest verdrahtet. Eine 16:9-Folie stand darin hochkant und
           gequetscht: gemessen 0,71 statt 1,78. Die Vorgabe im Stilblatt bleibt
           für alles ohne eigene Masse. */
        const mass = masseVon(documentBlock);
        if (mass.bw > 0 && mass.bh > 0)
            preview.style.aspectRatio = mass.bw + ' / ' + mass.bh;
        if (documentBlock.type === 'pdfseite' && documentBlock.bildDateiId && typeof Dateien !== 'undefined') {
            const image = document.createElement('img');
            image.alt = '';
            image.loading = 'lazy';
            /* Die Adresse selbst ist bereits Arbeit: sie liest alle Chunks und legt
               eine Blob-URL an. Darum hier nur die Kennung vormerken; geladen wird
               unten erst fuer wirklich sichtbare Vorschaubilder. */
            image.dataset.documentThumbnailFile = documentBlock.bildDateiId;
            preview.appendChild(image);
        }
        else {
            /* DIE MINIATUR ZEIGT DIE FOLIE (E547). Hier stand für alles, was
               keine PDF-Seite mit Bild ist, ein Bleistift — bei 27 Folien also 27
               gleiche leere Kästchen, in denen niemand etwas findet. Die Marken
               liegen bereit, und `Marken.zeichneMarke` zeichnet sie längst für
               Vortrag, Druck und Seitenbild; hier ist es dieselbe Stelle, nur
               klein (§8). Bleibt nichts zu zeichnen, bleibt auch der Bleistift. */
            const gemalt = markenVorschau(documentBlock, mass);
            if (gemalt)
                preview.appendChild(gemalt);
            else {
                const blank = document.createElement('span');
                blank.className = 'document-thumbnail-blank';
                blank.textContent = documentBlock.type === 'blatt' ? '✎' : documentBlock.herkunft === 'bild' ? '🖼' : 'PDF';
                preview.appendChild(blank);
            }
        }
        const label = document.createElement('span');
        label.className = 'document-thumbnail-label';
        /* DIE NUMMER GEHÖRT DAZU. Bei 27 Folien zählt niemand die Kästchen ab,
           und der Name allein sagt nicht, die wievielte es ist. */
        label.textContent = (index + 1) + ' · ' + sourceLabel(documentBlock);
        /* Lesezeichen und Drehung (E467): das Zeichen an der Ecke, die Drehung
           am Bild — das Vorschaubild ist das ungedrehte Raster. */
        const g = SheetSpace.gedrehtVon(documentBlock);
        if (g) {
            button.dataset.gedreht = String(g);
            preview.style.setProperty('--dreh', g + 'deg');
        }
        if (documentBlock.lesezeichen) {
            button.classList.add('hat-lesezeichen');
            const mark = document.createElement('span');
            mark.className = 'document-thumbnail-mark';
            mark.textContent = '🔖';
            mark.setAttribute('aria-label', 'Lesezeichen');
            preview.appendChild(mark);
        }
        button.append(preview, label);
        /* DAS MENÜ AN DER SEITE (E480), GoodNotes' „…": dieselben Griffe wie im
           Inspector, aber für DIESE Seite — nicht für die, die man gerade
           ansieht. Der Knopf misst 44 px (§37) und sagt, wozu er gehört. */
        const menue = document.createElement('button');
        menue.type = 'button';
        menue.className = 'document-thumb-menue-knopf';
        menue.dataset.documentThumbMenue = String(index);
        menue.setAttribute('aria-haspopup', 'menu');
        menue.setAttribute('aria-expanded', 'false');
        menue.setAttribute('aria-label', sourceLabel(documentBlock) + ': Menü');
        menue.title = 'Was mit dieser Seite geschehen soll';
        menue.textContent = '⋯';
        zeile.append(button, menue);
        return zeile;
    };
    /** Nur die sichtbare Handvoll Vorschaubilder aus IndexedDB holen. Ein
        geschlossenes mobiles Panel hat keinen sichtbaren Schnitt und loest
        deshalb auch bei Dokumenten mit hunderten Seiten keine Lesewelle aus. */
    const activateVisibleThumbnails = (panel) => {
        let scheduled = false;
        const loadVisible = () => {
            scheduled = false;
            if (!panel.isConnected)
                return;
            const panelRect = panel.getBoundingClientRect();
            if (panelRect.width < 2 || panelRect.height < 2 ||
                panelRect.bottom <= 0 || panelRect.top >= window.innerHeight ||
                panelRect.right <= 0 || panelRect.left >= window.innerWidth)
                return;
            const top = Math.max(0, panelRect.top) - 220;
            const bottom = Math.min(window.innerHeight, panelRect.bottom) + 220;
            panel.querySelectorAll('img[data-document-thumbnail-file]').forEach(image => {
                if (image.src || image.dataset.loading === 'true')
                    return;
                const rect = image.getBoundingClientRect();
                if (rect.bottom < top || rect.top > bottom)
                    return;
                const fileId = image.dataset.documentThumbnailFile;
                if (!fileId)
                    return;
                const known = Dateien.adresseBekannt?.(fileId);
                if (known) {
                    image.src = known;
                    return;
                }
                image.dataset.loading = 'true';
                Dateien.adresse(fileId).then((url) => {
                    if (url && image.isConnected)
                        image.src = url;
                    delete image.dataset.loading;
                }).catch(() => { delete image.dataset.loading; });
            });
        };
        const schedule = () => {
            if (scheduled)
                return;
            scheduled = true;
            requestAnimationFrame(loadVisible);
        };
        panel.addEventListener('scroll', schedule, { passive: true });
        schedule();
    };
    /* DIE ORIGINALDATEI IST EINE ANGABE, KEIN BAND UEBER DEM PAPIER (E384).
       Sie stand als volle Zeile zwischen Werkzeugleiste und erstem Blatt und
       kostete dort 45 Pixel — am Telefon von 844. Gebraucht wird sie selten
       (einmal, wenn man das Original sucht), gesehen wurde sie immer. Sie
       zieht deshalb in den Inspector, zu den uebrigen Angaben ueber das
       Dokument; der Weg zur Datei bleibt derselbe (`Dateien`), nur der Platz
       ist ein anderer.
  
       Wie in OneNote: die Datei selbst als erste Zeile, der Ausdruck darunter.
       Gesucht wird der `file`-Block, den `PdfEinlesen` an Stelle 0 anlegt —
       und ersatzweise die `quelleId` der ersten Seite, damit auch aeltere
       Dokumente ihre Datei zeigen. */
    const originalKnopf = (page, documentBlock) => {
        const originalBlock = Store.childrenOf(page.id)
            .find((b) => b && b.alive !== false && b.type === 'file' && b.dateiId &&
            (b.original || /\.pdf$/i.test(String(b.text || ''))));
        const quelleId = originalBlock?.dateiId || documentBlock?.quelleId || '';
        if (!quelleId)
            return null;
        const zeile = document.createElement('button');
        zeile.type = 'button';
        zeile.className = 'document-original';
        zeile.dataset.documentOriginal = String(quelleId);
        const zeichen = document.createElement('span');
        zeichen.className = 'do-zeichen';
        zeichen.textContent = '📕';
        const name = document.createElement('span');
        name.className = 'do-name';
        name.textContent = String(originalBlock?.text || 'Original-PDF');
        const wort = document.createElement('span');
        wort.className = 'do-wort';
        wort.textContent = 'Original öffnen';
        zeile.append(zeichen, name, wort);
        zeile.title = 'Die unveränderte PDF-Datei — darunter steht ihr Ausdruck.';
        return zeile;
    };
    const renderInspector = (container, page, documentBlock) => {
        const links = linkedObjects(page, documentBlock);
        const cards = links.filter(block => block.type === 'flashcard');
        const tasks = links.filter(block => block.type === 'todo');
        const notes = links.filter(block => block.type !== 'flashcard' && block.type !== 'todo');
        container.replaceChildren();
        const heading = document.createElement('div');
        heading.className = 'document-inspector-heading';
        const title = document.createElement('strong');
        title.textContent = 'Dokumentdetails';
        const close = document.createElement('button');
        close.type = 'button';
        close.dataset.documentAction = 'inspector-close';
        close.setAttribute('aria-label', 'Inspector schließen');
        close.textContent = '✕';
        heading.append(title, close);
        const source = document.createElement('div');
        source.className = 'document-inspector-source';
        source.textContent = sourceLabel(documentBlock) + ' · ' + (page.text || 'Ohne Titel');
        const actions = document.createElement('div');
        actions.className = 'document-inspector-actions';
        const makeAction = (action, label) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.dataset.documentAction = action;
            button.textContent = label;
            return button;
        };
        actions.append(makeAction('source-actions', '＋ Aus Inhalt'), makeAction('select-region', '⌗ Ausschnitt'), makeAction('recognize', '⌁ Erkennen'));
        /* BEIM NEUZEICHNEN DEN RUHEZUSTAND MITNEHMEN (E498). Der Inspector baut
           seine Knöpfe frisch; ohne diese vier Zeilen stünden sie nach einem
           Seitenwechsel wieder offen da, obwohl das Zoom-Fenster noch offen
           ist. Denselben Zustand setzt `ausschnittRuhen` beim Öffnen und
           Schliessen — hier ist er nur die Startstellung. */
        if (stateFor(page.id).lupe) {
            for (const was of ['select-region', 'recognize']) {
                const knopf = actions.querySelector('[data-document-action="' + was + '"]');
                if (!knopf)
                    continue;
                knopf.disabled = true;
                knopf.setAttribute('aria-disabled', 'true');
                knopf.title = 'Ruht, solange das Zoom-Fenster offen ist — der Ausschnitt gilt der ganzen Seite.';
            }
        }
        /* DER EXPORT GILT DEM DOKUMENT, nicht der Seite (E488).
    
           ER STEHT NEBEN „PDF hinzufügen", und das Bild hat den Platz gewählt:
           im ersten Entwurf lag er in der Gruppe ganz unten, unter „Mit dieser
           Seite verbunden" — auf dem Bildschirmfoto war er gar nicht zu sehen,
           weil der Inspector vorher endet. Hier oben steht die Ausfuhr neben
           der Einfuhr, direkt unter den Seitengriffen.
    
           „Als Bild sichern" dort unten meint weiterhin genau die eine Seite,
           die man ansieht — deshalb sind es zwei Knöpfe und nicht einer mit
           einer Frage. */
        /* Dasselbe Zeichen wie „Als Bild sichern" darüber: beides ist ein
           Herunterladen, und „⤓" kam auf dem Bild schmal und eng am Wort
           heraus. Zwei Zeichen für dieselbe Sache wären eine Sprache zu viel. */
        const pdfKnopf = makeAction('export-pdf', '⬇ Als PDF sichern');
        pdfKnopf.className = 'document-import';
        /* WAS DIESER KNOPF WIRKLICH TUT, STEHT DA — und nicht nur im `title`
           (E505). Das Stift-Dossier, Seite 9 und 18: Flattening ist eine
           legitime Wahl fuer unveraenderliche Weitergabe, aber es soll eine
           ENTSCHEIDUNG sein, und vorher soll eine editierbare Masterkopie
           existieren.
    
           Beides ist bei Redion erfuellt — das Original wird nie angefasst
           (E106), und die Marken bleiben in der Ablage. Nur WUSSTE es niemand:
           der Satz stand im `title`, er nannte allein den verlorenen Suchtext,
           und am Telefon gibt es kein Hover (§37). Wer dort exportierte, erfuhr
           gar nichts und merkte es erst beim Empfaenger. */
        /* SEIT E506 STIMMT DIE HÄLFTE NICHT MEHR, DIE HIER STAND: die Striche
           sind für ein fremdes Programm sehr wohl Anmerkungen. Ein Satz, der
           schlechter redet, als die App ist, ist genauso falsch wie einer, der
           zu viel verspricht (§33). */
        pdfKnopf.title = 'Das ganze Dokument mit allen Marken als PDF speichern. '
            + 'Deine Handschrift wird zu echten Anmerkungen, die ein fremdes PDF-Programm '
            + 'anklicken, verschieben und löschen kann. Die Seite darunter wird ein Bild: '
            + 'ihr Text ist darin nicht mehr durchsuchbar, und Verweise sind keine Verweise '
            + 'mehr. Dein Original und deine Marken bleiben in Redion unverändert.';
        const importButton = makeAction('import', '＋ PDF hinzufügen');
        importButton.className = 'document-import';
        /* DIE KENNUNG, NICHT DAS OBJEKT (E471, L102 zum zweiten Mal). `darf`
           schlaegt mit dem zweiten Argument in `Store.getBlock` nach; mit einem
           Objekt findet es nichts, laeuft die Freigabenkette nie ab und endet
           bei der Standardrolle „voll" — jede Rechtefrage im Dokument sagte ja.
           §26: „Ein Tor, das ohne Seitenkennung befragt wird, sagt ja." */
        const mayEdit = !page.gesperrt && (typeof Konten === 'undefined' || Konten.darf('bearbeiten', page.id));
        importButton.disabled = !mayEdit;
        importButton.title = mayEdit
            ? 'Eine weitere PDF in dieses Dokument einlesen'
            : 'Zum Hinzufügen brauchst du Bearbeitungsrechte und ein entsperrtes Dokument.';
        const summary = document.createElement('div');
        summary.className = 'document-inspector-summary';
        [['🎴', 'Lernkarten', cards.length], ['☑', 'Aufgaben', tasks.length], ['¶', 'Notizen', notes.length]]
            .forEach(([icon, label, count]) => {
            const row = document.createElement('div');
            const left = document.createElement('span');
            left.textContent = String(icon) + ' ' + String(label);
            const number = document.createElement('b');
            number.textContent = String(count);
            row.append(left, number);
            summary.appendChild(row);
        });
        const list = document.createElement('div');
        list.className = 'document-inspector-list';
        links.slice(0, 24).forEach(block => {
            const button = document.createElement('button');
            button.type = 'button';
            button.dataset.documentOpen = block.id;
            const icon = block.type === 'flashcard' ? '🎴' : block.type === 'todo' ? '☑' : '¶';
            button.textContent = icon + ' ' + String(block.text || 'Ohne Text').replace(/::.*$/, '').slice(0, 90);
            list.appendChild(button);
        });
        if (!links.length) {
            const empty = document.createElement('p');
            empty.textContent = 'Deine Gedanken neben dem Papier. Wähle „Aus Inhalt“, um eine Notiz, Aufgabe oder Lernkarte mit dieser Seite zu verbinden.';
            list.appendChild(empty);
        }
        /* DER RANDSTREIFEN (E301, L107; hierher E384). Ein Schalter fuer das
           ganze Dokument: wer neben seinem Skript schreibt, will das fuer das
           ganze Skript. Aus ist die Vorgabe — ein Rand, den niemand bestellt
           hat, nimmt der Seite Platz weg. Mit Wort statt nur Zeichen (§38). */
        const randAn = Number(page.randBreite) > 0;
        const randKnopf = document.createElement('button');
        randKnopf.type = 'button';
        randKnopf.dataset.documentAction = 'rand';
        randKnopf.className = 'document-rand-knopf' + (randAn ? ' an' : '');
        randKnopf.textContent = '⇥ Randstreifen ' + (randAn ? 'aus' : 'an');
        randKnopf.setAttribute('aria-pressed', randAn ? 'true' : 'false');
        randKnopf.title = 'Ein Streifen zum Schreiben neben der Seite — für das ganze Dokument.';
        /* EINZELSEITE ODER FORTLAUFEND (E398). Neben dem Randstreifen und aus
           demselben Grund hier statt in der Leiste: E384 hat den Randstreifen
           aus der Leiste geholt, weil sie am Telefon 411 px breit war in einem
           390 px breiten Fenster. Ein zweiter Schalter dort haette denselben
           Fehler ein zweites Mal gemacht.
    
           NUR AB ZWEI SEITEN. Bei einem einzigen Blatt sind Einzelseite und
           Fortlaufend dasselbe Bild — ein Schalter, der nichts tut, ist
           schlimmer als keiner: er laesst einen suchen, was sich geaendert hat.
           `test395 §5` haelt fest, dass er dann fehlt. */
        const laufKnopf = documentsIn(page).length > 1 ? (() => {
            const einzeln = gemerkterLauf(page.id);
            const knopf = document.createElement('button');
            knopf.type = 'button';
            knopf.dataset.documentAction = 'lauf';
            knopf.className = 'document-lauf-knopf' + (einzeln ? ' an' : '');
            /* Das Wort sagt, was ein Druck BEWIRKT — wie beim Randstreifen. Wo man
               gerade steht, sagt die Sprechblase, und `aria-pressed` sagt es dem
               Screenreader (§38). */
            knopf.textContent = einzeln ? '▤ Fortlaufend zeigen' : '▢ Einzelseite zeigen';
            knopf.setAttribute('aria-pressed', einzeln ? 'true' : 'false');
            knopf.title = einzeln
                ? 'Gerade steht eine Seite allein im Bild. Drücken zeigt wieder alle untereinander.'
                : 'Gerade stehen alle Seiten untereinander. Drücken zeigt nur die, auf der du bist.';
            return knopf;
        })() : null;
        /* ══ DIE SEITE SELBST (E467) — GoodNotes' Seitenmenue ═══════════════════
           Einfuegen (leer, mit dem Papier aus der Auswahl darunter), Duplizieren,
           Drehen, nach oben, nach unten, Lesezeichen, Loeschen. Alles an der
           Seite, die man ansieht; alles ueber `data-document-action`, damit der
           eine Verteiler unten es findet. Ein Lesezeichen ist ein Feld an der
           Seite (`lesezeichen`) und keine zweite Liste (§8). */
        const seiten = documentsIn(page);
        const seitenIndex = Math.max(0, seiten.findIndex(block => block.id === documentBlock.id));
        const darfSeiten = !page.gesperrt && (typeof Konten === 'undefined' || Konten.darf('bearbeiten', page.id));
        const seite = document.createElement('div');
        seite.className = 'document-inspector-seite';
        const seiteTitel = document.createElement('h3');
        seiteTitel.className = 'document-section-title';
        /* DAS WORT KOMMT AUS EINER HAND (E552) — „Folie" im Foliensatz, „Seite"
           sonst. Die Griffe darunter sind dieselben; nur ihr Wort wechselt. */
        const eins = wortEins(page), viele = wortViele(page);
        seiteTitel.textContent = eins + ' ' + (seitenIndex + 1) + ' von ' + seiten.length +
            (SheetSpace.gedrehtVon(documentBlock) ? ' · ' + SheetSpace.gedrehtVon(documentBlock) + '°' : '') +
            (documentBlock.lesezeichen ? ' · 🔖' : '');
        const knoepfe = document.createElement('div');
        knoepfe.className = 'document-seite-knoepfe';
        const seitenKnopf = (action, zeichen, wort, titel, an) => {
            const knopf = document.createElement('button');
            knopf.type = 'button';
            knopf.dataset.documentAction = action;
            const z = document.createElement('span');
            z.className = 'zeichen';
            z.setAttribute('aria-hidden', 'true');
            z.textContent = zeichen;
            const w = document.createElement('span');
            w.className = 'wort';
            w.textContent = wort;
            knopf.append(z, w);
            knopf.title = titel;
            knopf.disabled = !darfSeiten;
            if (typeof an === 'boolean') {
                knopf.setAttribute('aria-pressed', an ? 'true' : 'false');
                knopf.classList.toggle('an', an);
            }
            return knopf;
        };
        knoepfe.append(seitenKnopf('page-add', '＋', eins + ' danach', 'Eine leere ' + eins + ' hinter dieser einfügen — mit dem Papier aus der Auswahl darunter'), seitenKnopf('page-duplicate', '⧉', 'Duplizieren', 'Diese ' + eins + ' mit allem darauf verdoppeln'), seitenKnopf('page-rotate', '⟳', 'Drehen', 'Diese ' + eins + ' um 90° im Uhrzeigersinn drehen'), seitenKnopf('page-up', '↑', 'Nach oben', 'Diese ' + eins + ' eine Stelle nach vorn'), seitenKnopf('page-down', '↓', 'Nach unten', 'Diese ' + eins + ' eine Stelle nach hinten'), seitenKnopf('page-bookmark', '🔖', 'Lesezeichen', documentBlock.lesezeichen ? 'Lesezeichen entfernen' : 'Diese ' + eins + ' mit einem Lesezeichen merken', !!documentBlock.lesezeichen), seitenKnopf('page-delete', '🗑', 'Löschen', 'Diese ' + eins + ' in den Papierkorb legen — von dort kommt sie zurück'), 
        /* E469: Bilder und weitere PDF-Seiten hinter diese Seite; die Seite als Bild sichern. */
        seitenKnopf('page-add-image', '🖼', 'Bild als ' + eins, 'Ein Foto, einen Scan oder eine Grafik als neue ' + eins + ' hinter dieser einfügen'), seitenKnopf('page-add-camera', '📷', 'Foto aufnehmen', 'Mit der Kamera eine neue ' + eins + ' hinter dieser aufnehmen — am Rechner ohne Kamera öffnet sich der Dateiwähler'), seitenKnopf('page-add-pdf', '📕', 'PDF hier einfügen', 'Die Seiten einer weiteren PDF hinter dieser ' + eins + ' einfügen'), seitenKnopf('page-export-image', '⬇', 'Als Bild sichern', 'Diese ' + eins + ' mit allem darauf als PNG speichern'), 
        /* E496: dieselbe Seite in ein anderes Dokument — kopieren oder verschieben. */
        seitenKnopf('page-to-doc', '↗', 'In anderes Dokument', 'Diese ' + eins + ' mit allem darauf in ein anderes Dokument kopieren oder verschieben'), 
        /* E499: ein mehrseitiges Blatt (E118) in einzelne Seiten zerlegen. */
        seitenKnopf('page-split', '⌸', 'In ' + viele + ' zerlegen', 'Dieses mehrseitige Blatt in einzelne A4-' + viele + ' zerlegen — danach greifen Drehen, Löschen und Verschieben je ' + eins));
        /* DER GRIFF STEHT NUR BEI EINEM MEHRSEITIGEN BLATT (E499). Bei allem
           anderen — einer PDF-Seite, einem einseitigen Blatt — gäbe es nichts
           zu zerlegen; ein Knopf, der dann eine Absage gibt, wäre ein Knopf zu
           viel. Er verschwindet nicht, er ruht: so bleibt die Reihe der Griffe
           gleich, und wer ihn sucht, findet ihn mit seinem Grund. */
        {
            const teilbar = documentBlock?.type === 'blatt'
                && SheetSpace.seiten(Number(documentBlock.blattHoehe) || SheetSpace.A4_HOEHE) > 1;
            const knopf = knoepfe.querySelector('[data-document-action="page-split"]');
            if (knopf && !teilbar) {
                knopf.disabled = true;
                knopf.setAttribute('aria-disabled', 'true');
                knopf.title = documentBlock?.type === 'blatt'
                    ? 'Dieses Blatt ist schon eine einzelne ' + wortEins(page) + '.'
                    : 'Nur ein mehrseitiges Blatt lässt sich zerlegen.';
            }
        }
        /* Sichern darf jeder, der lesen darf. */
        const sichernKnopf = knoepfe.querySelector('[data-document-action="page-export-image"]');
        if (sichernKnopf)
            sichernKnopf.disabled = false;
        /* DAS LESEZEICHEN BRAUCHT DASSELBE RECHT WIE ALLES ANDERE (E473).
           E467 hatte es freigegeben mit dem Satz „es aendert die Seite nicht" —
           das stimmt nicht: es schreibt `lesezeichen` in den Seitenblock, und
           der geht in den Abgleich und in jede Sicherung. Auf einer fremden
           Seite mit Leserecht ist das eine Aenderung wie jede andere (§26). */
        const papierZeile = document.createElement('label');
        papierZeile.className = 'document-seite-papier';
        const papierWort = document.createElement('span');
        papierWort.textContent = 'Papier für neue Seiten';
        const papierWahl = document.createElement('select');
        papierWahl.dataset.documentPapier = '';
        papierWahl.setAttribute('aria-label', 'Papier für neue Seiten');
        const papiere = (typeof Blatt !== 'undefined' && Array.isArray(Blatt.PAPIERE)) ? Blatt.PAPIERE : [{ id: 'blanko', name: 'Blanko' }];
        const gemerkt = String(Store.getMeta('heft:papier', 'blanko'));
        papiere.forEach(p => {
            const o = document.createElement('option');
            o.value = p.id;
            o.textContent = p.name;
            if (p.id === gemerkt)
                o.selected = true;
            papierWahl.appendChild(o);
        });
        papierWahl.addEventListener('change', () => Store.setMeta('heft:papier', papierWahl.value));
        papierZeile.append(papierWort, papierWahl);
        seite.append(seiteTitel, knoepfe, papierZeile);
        /* Die Liste der Lesezeichen — nur, wenn es welche gibt. Jedes ist ein
           Sprung (`data-document-index`, derselbe Weg wie die Miniaturen). */
        const gemerkte = seiten.map((block, i) => ({ block, i })).filter(x => x.block.lesezeichen);
        if (gemerkte.length) {
            const liste = document.createElement('div');
            liste.className = 'document-lesezeichen';
            const kopf = document.createElement('strong');
            kopf.textContent = 'Lesezeichen';
            liste.appendChild(kopf);
            gemerkte.forEach(({ block, i }) => {
                const knopf = document.createElement('button');
                knopf.type = 'button';
                knopf.dataset.documentIndex = String(i);
                knopf.textContent = '🔖 Seite ' + (i + 1) + ' · ' + sourceLabel(block);
                if (i === seitenIndex)
                    knopf.setAttribute('aria-current', 'page');
                liste.appendChild(knopf);
            });
            seite.appendChild(liste);
        }
        /* ══ WAS AUF DIESER SEITE GESPERRT IST (E492, L133) ═══════════════════
           Die Sperre sitzt seit E466 am Knopf der Leiste: Marke wählen, Schloss
           drücken. Damit kann man sperren — aber nicht mehr sehen, WAS gesperrt
           ist. Eine gesperrte Marke lässt sich nicht anfassen; wer sie
           entsperren will, muss sie erst auswählen, und genau das geht bei ihr
           am schlechtesten. Ein Rundlauf ohne Ausgang.
    
           Also eine Liste, wie bei den Lesezeichen darüber: eine Zeile je
           gesperrter Marke, mit ihrem Namen aus `Marken.artWort` (derselben
           Quelle wie die Werkzeugleiste, §8), und je Zeile ein Schloss zum
           Öffnen.
    
           SIE STEHT NUR DA, WENN ES ETWAS ZU ZEIGEN GIBT. Eine Überschrift über
           einer leeren Liste sagt dem Leser nichts, was er nicht schon sieht —
           und sie stünde bei fast jeder Seite (dieselbe Regel wie oben bei den
           Lesezeichen).
    
           GESCHRIEBEN WIRD ÜBER DEN BLOCK, nicht über die Zeichenschicht. Das
           ist derselbe Weg, den „Drehen", „Lesezeichen" und „Löschen" hier
           schon gehen: `Store.updateBlock` und neu zeichnen. Über die Schicht
           ginge es nur, wenn die Marke ausgewählt wäre — und das ist genau das,
           was bei einer gesperrten nicht geht. */
        const gesperrte = (Array.isArray(documentBlock.marken) ? documentBlock.marken : [])
            .map((mark, i) => ({ mark, i }))
            .filter((x) => !!x.mark?.gesperrt);
        if (gesperrte.length) {
            const liste = document.createElement('div');
            liste.className = 'document-gesperrt';
            const kopf = document.createElement('strong');
            kopf.textContent = 'Gesperrt auf dieser Seite (' + gesperrte.length + ')';
            liste.appendChild(kopf);
            gesperrte.forEach(({ mark }) => {
                const zeile = document.createElement('div');
                zeile.className = 'document-gesperrt-zeile';
                const was = document.createElement('span');
                was.className = 'document-gesperrt-was';
                /* Bei einer Marke mit Text sagt der Text mehr als die Art — eine
                   Haftnotiz heisst „Haftnotiz", aber gemeint ist die mit dem Satz
                   darauf. Escapen muss hier niemand: `textContent`, kein HTML. */
                const wort = typeof Marken !== 'undefined' ? Marken.artWort(mark.art) : String(mark.art || '');
                const zeichen = typeof Marken !== 'undefined' ? Marken.artZeichen(mark.art) : '•';
                const eigen = String(mark.text || '').replace(/\s+/g, ' ').trim();
                /* DER STIL GEHÖRT DAZU (Fund des Bildes). Auf dem ersten Bild hiessen
                   zwei Zeilen beide „Linie" — die eine war der Schutzleiter, die
                   andere eine schwarze Linie, und niemand konnte sie auseinander-
                   halten. Der Stil sagt es: „Linie · Schutzleiter". */
                const stil = typeof Marken !== 'undefined' && mark.stil
                    ? (Marken.STIFTE.find((x) => x.id === mark.stil)?.name ?? '') : '';
                was.textContent = zeichen + ' ' + wort + (stil ? ' · ' + stil : '')
                    + (eigen ? ' · ' + eigen.slice(0, 40) : '');
                const auf = document.createElement('button');
                auf.type = 'button';
                auf.dataset.documentAction = 'mark-entsperren';
                auf.dataset.documentMarke = String(mark.id ?? '');
                auf.textContent = '🔓 Entsperren';
                auf.title = wort + ' entsperren — danach lässt sie sich wieder bewegen';
                auf.disabled = !darfSeiten;
                /* UND WELCHE ES IST, ZEIGT DAS BLATT (Fund des Bildes, zweiter Teil).
                   Zwei gleiche schwarze Linien heissen auch mit Stil gleich. Wer
                   die Zeile berührt oder mit der Tastatur erreicht, sieht die Marke
                   auf dem Papier aufleuchten — das beantwortet die Frage „welche
                   denn?" ohne ein einziges zusätzliches Wort.
        
                   Über eine KLASSE am Knoten, nicht über einen Stil am Element: das
                   Aufleuchten gehört ins Stilblatt (§39), und ein hier gesetzter
                   `style` überlebte das nächste `updateNode` ohnehin nicht. */
                const zeigen = (an) => {
                    /* Am `document` und nicht an einem Kasten aus `render`: der
                       Inspector wird auch von dort gerufen, wo es den nicht gibt.
                       `querySelectorAll`, weil dieselbe Kennung auf einer zweiten
                       gezeichneten Seite noch einmal stehen kann — dann leuchten
                       beide, und das ist richtiger, als eine zu raten. */
                    const sicher = String(mark.id ?? '').replace(/["\\]/g, '');
                    if (!sicher)
                        return;
                    document.querySelectorAll('.blatt-marken [data-sid="' + sicher + '"]')
                        .forEach(knoten => knoten.classList.toggle('ist-gezeigt', an));
                };
                zeile.addEventListener('mouseenter', () => zeigen(true));
                zeile.addEventListener('mouseleave', () => zeigen(false));
                auf.addEventListener('focus', () => zeigen(true));
                auf.addEventListener('blur', () => zeigen(false));
                zeile.append(was, auf);
                liste.appendChild(zeile);
            });
            if (gesperrte.length > 1) {
                const alle = document.createElement('button');
                alle.type = 'button';
                alle.className = 'document-gesperrt-alle';
                alle.dataset.documentAction = 'mark-entsperren';
                alle.dataset.documentMarke = '*';
                alle.textContent = '🔓 Alle ' + gesperrte.length + ' entsperren';
                alle.disabled = !darfSeiten;
                liste.appendChild(alle);
            }
            seite.appendChild(liste);
        }
        const original = originalKnopf(page, documentBlock);
        container.append(heading, source);
        if (original)
            container.appendChild(original);
        container.appendChild(seite);
        const linkedTitle = document.createElement('h3');
        linkedTitle.className = 'document-section-title';
        linkedTitle.textContent = 'Mit dieser Seite verbunden';
        const viewTitle = document.createElement('h3');
        viewTitle.className = 'document-section-title';
        viewTitle.textContent = 'Papier & Ansicht';
        /* DAS ZOOM-FENSTER (E469), GoodNotes' Lupe zum Kleinschreiben: ein
           Schalter wie Randstreifen und Einzelseite. Nur eine Ansicht, kein
           Merker: wer das Dokument wieder oeffnet, sieht es normal. */
        const lupeAn = !!stateFor(page.id).lupe;
        const lupeKnopf = document.createElement('button');
        lupeKnopf.type = 'button';
        lupeKnopf.dataset.documentAction = 'lupe';
        lupeKnopf.className = 'document-lupe-knopf' + (lupeAn ? ' an' : '');
        lupeKnopf.textContent = lupeAn ? '🔍 Zoom-Fenster aus' : '🔍 Zoom-Fenster an';
        lupeKnopf.setAttribute('aria-pressed', lupeAn ? 'true' : 'false');
        lupeKnopf.title = 'Die Seite gross zum Kleinschreiben; unten die Übersicht mit dem Ausschnitt.';
        /* EIN- UND AUSFUHR IN EINER ZEILE (E488). Beide waren vorher lose
           Knöpfe im Fluss; mit zweien standen sie eng aneinander und der Text
           stiess an den Rand — auf dem Bild gut zu sehen. Eine eigene Zeile mit
           zwei gleichen Spalten gibt jedem seine Breite und beiden 44 px. */
        const datenZeile = document.createElement('div');
        datenZeile.className = 'document-inspector-daten';
        datenZeile.append(pdfKnopf, importButton);
        /* DERSELBE SATZ ALS SICHTBARER TEXT (E505) — zwei Zeilen, kurz genug,
           dass man sie liest, und da, wo der Knopf steht. Am Telefon ist er
           das Einzige, was der Mensch ueberhaupt zu sehen bekommt. */
        const pdfHinweis = document.createElement('p');
        pdfHinweis.className = 'document-export-hinweis';
        pdfHinweis.textContent = 'Deine Handschrift wird eine echte Anmerkung — in jedem '
            + 'PDF-Programm anklickbar. Die Seite darunter wird ein Bild: ihr Text ist darin '
            + 'nicht mehr durchsuchbar. Original und Marken bleiben in Redion.';
        container.append(datenZeile, pdfHinweis, viewTitle, randKnopf, lupeKnopf);
        if (laufKnopf)
            container.appendChild(laufKnopf);
        container.append(linkedTitle, actions, summary, list);
    };
    const renderDocument = (container, block) => {
        container.replaceChildren();
        /* Auch diese alternative Ansicht muss denselben Block eindeutig im DOM
           tragen wie der normale Editor. Deep-Links, Rollen und Hervorheben
           suchen absichtlich nach `data-bid`; ohne die Kennung war zwar die
           richtige Dokumentseite sichtbar, der Sprung galt aber nie als
           angekommen. Der Stage-Container ist bereits die Hülle dieses einen
           Blocks, deshalb braucht es dafür keinen zweiten Blockknoten. */
        container.dataset.bid = block.id;
        container.appendChild(block.type === 'pdfseite' ? PdfSeite.zeichne(block) : Blatt.zeichne(block));
        /* Die vorhandene Ink-Leiste bleibt Eigentümerin ihrer Aktionen. Der
           Dokumentmodus ergänzt lediglich Namen und Tastatur-Navigation. */
        const toolbar = container.querySelector('.blatt-werk');
        if (toolbar) {
            toolbar.setAttribute('role', 'toolbar');
            toolbar.setAttribute('aria-label', 'Schreiben, markieren und bearbeiten');
            toolbar.querySelectorAll('button').forEach(button => {
                button.type = 'button';
                if (!button.getAttribute('aria-label')) {
                    const label = button.querySelector('.wort')?.textContent?.trim() || button.title;
                    if (label)
                        button.setAttribute('aria-label', label);
                }
            });
            toolbar.addEventListener('keydown', event => {
                if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key))
                    return;
                const target = event.target instanceof Element ? event.target.closest('button') : null;
                if (!target)
                    return;
                const buttons = Array.from(toolbar.querySelectorAll('button'))
                    .filter(button => !button.disabled && button.getClientRects().length > 0);
                const index = buttons.indexOf(target);
                if (index < 0 || !buttons.length)
                    return;
                event.preventDefault();
                const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1
                    : (index + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length;
                buttons[next]?.focus();
                buttons[next]?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
            });
        }
    };
    const selectRegion = (paper, documentBlock, done) => {
        const leseflaeche = paper.closest('.blatt-flur') || paper;
        const warInert = leseflaeche.inert;
        leseflaeche.inert = false;
        paper.classList.add('document-selecting');
        const overlay = document.createElement('div');
        overlay.className = 'document-region-overlay';
        const box = document.createElement('div');
        box.className = 'document-region-box';
        overlay.appendChild(box);
        paper.appendChild(overlay);
        let start = null;
        let end = null;
        const point = (event) => {
            const rect = overlay.getBoundingClientRect();
            return {
                x: Math.max(0, Math.min(rect.width, event.clientX - rect.left)),
                y: Math.max(0, Math.min(rect.height, event.clientY - rect.top))
            };
        };
        const draw = () => {
            if (!start || !end)
                return;
            const x = Math.min(start.x, end.x), y = Math.min(start.y, end.y);
            const width = Math.abs(end.x - start.x), height = Math.abs(end.y - start.y);
            box.style.left = x + 'px';
            box.style.top = y + 'px';
            box.style.width = width + 'px';
            box.style.height = height + 'px';
        };
        const finish = (event) => {
            event.preventDefault();
            event.stopPropagation();
            end = point(event);
            draw();
            const rect = overlay.getBoundingClientRect();
            const width = Number(documentBlock.bw) || Number(documentBlock.blattBreite) || SheetSpace.A4_BREITE;
            const height = Number(documentBlock.bh) || Number(documentBlock.blattHoehe) || SheetSpace.A4_HOEHE;
            const x1 = Math.min(start?.x || 0, end.x), y1 = Math.min(start?.y || 0, end.y);
            const x2 = Math.max(start?.x || 0, end.x), y2 = Math.max(start?.y || 0, end.y);
            cleanup();
            if (x2 - x1 < 8 || y2 - y1 < 8 || !rect.width || !rect.height)
                return;
            done({
                x: x1 / rect.width * width,
                y: y1 / rect.height * height,
                width: (x2 - x1) / rect.width * width,
                height: (y2 - y1) / rect.height * height
            });
        };
        const move = (event) => {
            if (!start)
                return;
            event.preventDefault();
            event.stopPropagation();
            end = point(event);
            draw();
        };
        const down = (event) => {
            if (event.button !== 0)
                return;
            event.preventDefault();
            event.stopPropagation();
            start = point(event);
            end = start;
            draw();
            try {
                overlay.setPointerCapture(event.pointerId);
            }
            catch { /* optional */ }
        };
        const cleanup = () => {
            overlay.removeEventListener('pointerdown', down, true);
            overlay.removeEventListener('pointermove', move, true);
            overlay.removeEventListener('pointerup', finish, true);
            overlay.remove();
            paper.classList.remove('document-selecting');
            leseflaeche.inert = warInert;
            window.removeEventListener('keydown', escapeRegion, true);
        };
        const escapeRegion = (event) => {
            if (event.key !== 'Escape')
                return;
            event.preventDefault();
            event.stopPropagation();
            cleanup();
        };
        window.addEventListener('keydown', escapeRegion, true);
        overlay.addEventListener('pointercancel', cleanup, { once: true });
        overlay.addEventListener('pointerdown', down, true);
        overlay.addEventListener('pointermove', move, true);
        overlay.addEventListener('pointerup', finish, true);
    };
    const openSourceActions = (page, documentBlock, region) => {
        const learning = window.Learning;
        if (!learning?.sourceMenu) {
            UI.toast('Die Lernwerkzeuge sind noch nicht geladen.');
            return;
        }
        learning.sourceMenu(page, documentBlock, region || null);
    };
    const render = (wrap, page) => {
        const documents = documentsIn(page);
        if (!documents.length)
            return false;
        const state = stateFor(page.id);
        state.index = Math.max(0, Math.min(state.index, documents.length - 1));
        const current = documents[state.index];
        if (!current)
            return false;
        /* Die PDF-Quellen der letzten Suche loslassen (E468): ein neuer Aufbau
           oeffnet sie bei Bedarf wieder. */
        griffeSchliessen();
        verweisHorchenAus();
        /* Das Zoom-Fenster ist Ansicht, kein Merker (E469) — und sein Papier
           haengt an DIESEM Aufbau. Ein neuer beginnt ohne (E470). */
        state.lupe = false;
        const workspace = document.createElement('section');
        workspace.className = 'document-workspace document-studio';
        workspace.dataset.pageId = page.id;
        workspace.dataset.documentTools = state.toolsOpen ? 'open' : 'closed';
        workspace.setAttribute('aria-label', 'Dokument: ' + (page.text || 'Ohne Titel'));
        const top = document.createElement('div');
        top.className = 'document-topbar';
        /* ══ EIN ZEICHEN AUS DEM REGISTER, KEIN SCHRIFTZEICHEN (E586) ═════════
           `sym` ist der vierte, freiwillige Teil. Wer ihn angibt, bekommt statt
           des Textes eine Hülle mit `data-sym`; `Register.symbole.fuelle` malt
           sie später aus. Wer ihn weglässt, bekommt weiter seinen Text — und
           das ist richtig so für „+" und „‹", die Zeichen im Wortsinn sind und
           kein Bild.
    
           WARUM ÜBERHAUPT: das Register sagt es seit E272 selbst — „ein Pfeil,
           der aus einer Schrift kommt, sieht auf jedem System anders aus und
           trägt nicht die Farbe seiner Zeile". Daneben stehen dreizehn
           gezeichnete Werkzeuge. */
        const topButton = (action, text, label, sym) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.dataset.documentAction = action;
            button.setAttribute('aria-label', label);
            button.title = label;
            if (sym)
                button.innerHTML = `<span data-sym="${sym}" aria-hidden="true"></span>`;
            else
                button.textContent = text;
            return button;
        };
        /* DER WEG ZURUECK STEHT IM DOKUMENT (E384). Solange Menueband und
           Kopfzeile darueber standen, gab es dort einen Zurueck-Pfeil und eine
           Brotkrume. Beide sind mit der Schale weg — also braucht das Dokument
           seinen eigenen, sonst kommt man aus einem geoeffneten Skript nur noch
           ueber „Normale Seite" heraus, und das ist etwas anderes: es SCHALTET
           die Ansicht um, statt zurueckzugehen. Genau wie bei GoodNotes: `‹` und
           das Wort, wohin es fuehrt.
    
           Ueber `Register.navigation` und nicht ueber `Bibliothek.oeffne()` —
           der PDF-Bereich darf den Wissensbereich nicht kennen (§5 Regel 1). */
        const zurueck = topButton('regal', '‹', 'Zurück zu den Dokumenten');
        zurueck.classList.add('document-zurueck');
        const zurueckWort = document.createElement('span');
        zurueckWort.className = 'dz-wort';
        zurueckWort.textContent = 'Dokumente';
        zurueck.append(zurueckWort);
        const thumbnailButton = topButton('thumbnails', '▤ ' + wortViele(page), wortViele(page) + 'übersicht öffnen');
        thumbnailButton.setAttribute('aria-expanded', String(state.thumbnailsOpen));
        const inspectorButton = topButton('inspector', 'Details', 'Notizen und Verknüpfungen öffnen');
        inspectorButton.setAttribute('aria-expanded', String(state.inspectorOpen));
        const navigation = document.createElement('div');
        navigation.className = 'document-navigation';
        navigation.append(zurueck, thumbnailButton);
        top.append(navigation);
        /* DER RANDSTREIFEN STEHT SEIT E384 IM INSPECTOR (vorher hier, E301/L107).
           Er ist ein Schalter fuer das GANZE Dokument — das sagte schon E301 —
           und damit gehoert er zu den uebrigen Angaben ueber das Dokument, nicht
           in die Leiste, die man bei jedem Blick sieht. Gemessen war die Leiste
           am Telefon 411 px breit in einem 390 px breiten Fenster; jedes Zeichen
           darin kostete den Ausgang. `randKnopf` steht jetzt in
           `renderInspector` und heisst dort beim Namen statt nur `⇥`. */
        const position = document.createElement('span');
        position.className = 'document-position';
        position.textContent = wortEins(page) + ' ' + (state.index + 1) + '/' + documents.length;
        position.setAttribute('aria-live', 'polite');
        position.setAttribute('aria-atomic', 'true');
        const previousButton = topButton('previous', '‹', 'Vorherige Seite');
        const nextButton = topButton('next', '›', 'Nächste Seite');
        const pagination = document.createElement('div');
        pagination.className = 'document-pagination';
        pagination.setAttribute('role', 'group');
        pagination.setAttribute('aria-label', 'Im Dokument blättern');
        pagination.append(previousButton, position, nextButton);
        const zoom = document.createElement('input');
        zoom.type = 'range';
        zoom.min = '60';
        zoom.max = '180';
        zoom.step = '10';
        zoom.value = String(state.zoom);
        zoom.dataset.documentZoom = '';
        zoom.setAttribute('aria-label', 'Dokumentzoom');
        const zoomLabel = document.createElement('span');
        zoomLabel.className = 'document-zoom-label';
        zoomLabel.textContent = state.zoom + ' %';
        const zoomGroup = document.createElement('div');
        zoomGroup.className = 'document-zoom-group';
        zoomGroup.append(zoom, zoomLabel, topButton('fit', 'Anpassen', wortEins(page) + ' an die verfügbare Breite anpassen'));
        /* DER TITEL STEHT JETZT HIER (E296). Der grosse Seitenkopf faellt im
           Dokumentmodus weg; ohne diese Zeile hiesse das offene Dokument
           nirgends mehr beim Namen. `textContent`, nicht `innerHTML` — der Titel
           ist Nutzertext (§19). */
        const titel = document.createElement('div');
        titel.className = 'document-title';
        titel.textContent = page.text || 'Ohne Titel';
        titel.title = page.text || 'Ohne Titel';
        top.append(titel);
        /* UND DER EINE HINWEIS AUS DEM KOPF, DER HIER WEITER GILT. Eine gegen
           Bearbeiten gesperrte Seite sagte das oben in einer eigenen Zeile. Die
           ist mit dem Kopf weg — das Schloss bleibt, mit Wort statt nur Zeichen
           (§38) und mit dem Weg zurueck in der Sprechblase. */
        if (page.gesperrt) {
            const schloss = document.createElement('span');
            schloss.className = 'document-locked';
            schloss.textContent = '🔏 Gesperrt';
            schloss.title = 'Diese Seite ist gegen Bearbeiten gesperrt. ' +
                'Über „Normale Seite" lässt sie sich wieder freigeben.';
            top.append(schloss);
        }
        const topActions = document.createElement('div');
        topActions.className = 'document-top-actions';
        const viewButton = topButton('view', '', 'Ansicht, Lesemodus und Zoom', 'eye');
        viewButton.className = 'document-view-button';
        viewButton.setAttribute('aria-expanded', 'false');
        /* SUCHEN IM DOKUMENT (E468): der Knopf steht bei den Kopfaktionen,
           wie GoodNotes' Lupe; die Leiste dazu klappt unter dem Kopf auf. */
        const findButton = topButton('find', '', 'Im Dokument suchen (Strg F)', 'search');
        findButton.className = 'document-find-button';
        findButton.setAttribute('aria-expanded', 'false');
        /* PRÄSENTIEREN (E493), GoodNotes' Presentation Mode: das Dokument
           gross, ohne Leisten, mit einem Laserpointer und Blättern per Klick
           oder Pfeiltaste. Er steht neben „Drucken", weil beides dasselbe ist —
           das Dokument jemand anderem zeigen, einmal auf Papier, einmal an der
           Wand. */
        const zeigenKnopf = topButton('praesentieren', '▶', 'Vollbild ohne Leisten — blättern mit Klick oder Pfeiltasten, zeigen mit gedrückter Maus');
        /* DAS WORT STEHT IN EINER HÜLLE, damit das Telefon es ausblenden kann
           (E493, Fund von `test285`). Dort ist der Kopf eng: mit dem ganzen
           Wort blieben dem Titel noch 70 px, und `test285` verlangt hundert —
           „E." statt eines Namens ist genau der Fehler, den er hält. Am
           Rechner steht das Wort; am Telefon das Zeichen, mit `aria-label`
           darunter, damit der Knopf seinen Namen behält (§38). */
        const zeigenWort = document.createElement('span');
        zeigenWort.className = 'dz-wort';
        zeigenWort.textContent = ' Präsentieren';
        zeigenKnopf.append(zeigenWort);
        /* DAS FOLIEN-MENÜ (E549). Redur: „oben mit Menü, links Seiten."
           Es steht HIER und nicht im `#menueband`: das ist am Rechner eine
           zugeklappte Lade, und im Dokumentmodus legte es sich beim Versuch als
           Ecke „Werkzeuge ⌄" über genau diese Leiste (gemessen 1440 × 852 px,
           deckungsgleich mit dem Inhalt). Zwei Köpfe übereinander sind
           schlechter als einer — das steht seit dem 6. September so im
           Stilblatt, und es stimmt.
           Der KATALOG ist trotzdem derselbe: gelesen wird `Register.menueband`,
           Reiter `praesentation`, also genau die Liste, die im Band unter
           diesem Reiter steht. Eine Liste, zwei Ansichten (§8). */
        const folienKnopf = topButton('folienmenue', '📽️ Folie', 'Neue Folie, Präsentieren, als PowerPoint sichern');
        folienKnopf.setAttribute('aria-haspopup', 'menu');
        folienKnopf.setAttribute('aria-expanded', 'false');
        folienKnopf.hidden = !istFoliensatz(page);
        topActions.append(findButton, viewButton, inspectorButton, folienKnopf, zeigenKnopf, topButton('print', 'Drucken', 'Bearbeitete Fassung mit Notizen drucken'), topButton('exit', 'Seiteneditor', 'Dokumentmodus verlassen'));
        top.append(topActions);
        const commandbar = document.createElement('div');
        commandbar.className = 'document-commandbar';
        commandbar.setAttribute('aria-label', 'Dokumentansicht');
        commandbar.id = 'document-view-' + page.id;
        viewButton.setAttribute('aria-controls', commandbar.id);
        const modes = document.createElement('div');
        modes.className = 'document-mode-switch';
        modes.setAttribute('role', 'group');
        modes.setAttribute('aria-label', 'Lesen oder annotieren');
        const readButton = topButton('read', 'Lesen', 'Lesen — Zeichenwerkzeuge einklappen');
        const annotateButton = topButton('annotate', '✎ Annotieren', 'Annotieren — mit dem Stift auf der Seite schreiben');
        readButton.setAttribute('aria-pressed', String(!state.toolsOpen));
        annotateButton.setAttribute('aria-pressed', String(state.toolsOpen));
        const canAnnotate = !page.gesperrt && (typeof Konten === 'undefined' || Konten.darf('bearbeiten', page.id));
        if (!canAnnotate) {
            state.toolsOpen = false;
            workspace.dataset.documentTools = 'closed';
            readButton.setAttribute('aria-pressed', 'true');
            annotateButton.setAttribute('aria-pressed', 'false');
        }
        annotateButton.disabled = !canAnnotate;
        if (!canAnnotate)
            annotateButton.title = 'Zum Annotieren brauchst du Bearbeitungsrechte und ein entsperrtes Dokument.';
        modes.append(readButton, annotateButton);
        /* Am Telefon steht die Suche hier statt im Kopf (E468, siehe CSS). */
        const findKlappe = topButton('find', '🔍 Suchen', 'Im Dokument suchen');
        findKlappe.className = 'document-find-klappe';
        /* AM TELEFON STEHT AUCH „PRÄSENTIEREN" HIER (E493, Fund von `test285`).
           Gemessen bei 390 px: die Kopfleiste trug fünf Knöpfe à 44 px plus 88
           für die Navigation — dem Titel blieben 70 px, und `test285` verlangt
           hundert („E." statt eines Namens ist genau der Fehler, den er hält).
    
           Derselbe Weg, den E468 für die Suche gegangen ist: oben ausgeblendet,
           hier in der Ansichtsklappe sichtbar. Zwei Knöpfe für eine Sache sind
           kein zweiter Katalog — es ist EIN `data-document-action`, und der
           Verteiler unten kennt nur ihn. */
        const zeigenKlappe = topButton('praesentieren', '▶ Präsentieren', 'Vollbild ohne Leisten — blättern mit Tipp oder Pfeiltasten');
        zeigenKlappe.className = 'document-zeigen-klappe';
        /* UND SEIT E551 AUCH DAS FOLIEN-MENÜ — aus genau demselben Grund, mit
           genau derselben Zahl. E549 hat „📽️ Folie" oben in die Leiste gestellt
           und die Telefonbreite nicht nachgemessen. Gemessen wurde sie jetzt:
           bei 390 px blieben dem Titel eines Foliensatzes **70 px** — dieselben
           siebzig, die vier Absätze weiter oben schon einmal zu wenig waren, und
           `test285` verlangt hundert.
    
           Warum es niemand gemeldet hat: `test285` öffnet ein PDF, und bei einem
           PDF ist der Knopf ohnehin versteckt. Die Zusage war also da und
           konnte den Fall gar nicht sehen. `test507` misst ihn jetzt an einem
           Foliensatz.
    
           Auf dem Bild war es ausserdem der einzige Knopf der Leiste, der am
           Telefon sein WORT zeigte — alle anderen tragen dort nur ihr Zeichen
           (`font-size:0` plus `::before`). Er sah aus wie ein Fremdkörper, und
           das war er auch. */
        const folienKlappe = topButton('folienmenue', '📽️ Folie', 'Folien: neue Folie, Liste, präsentieren, ausgeben');
        folienKlappe.className = 'document-folien-klappe';
        folienKlappe.setAttribute('aria-haspopup', 'menu');
        folienKlappe.hidden = !istFoliensatz(page);
        commandbar.append(modes, pagination, zoomGroup, findKlappe, zeigenKlappe, folienKlappe);
        // One document-wide tool strip. Each action delegates to the existing page
        // controller; the original controls, undo stacks and mark objects stay intact.
        const drawingbar = document.createElement('div');
        drawingbar.className = 'document-drawingbar';
        drawingbar.setAttribute('role', 'toolbar');
        drawingbar.setAttribute('aria-label', 'PDF bearbeiten');
        /* E572: derselbe Katalog wie auf dem Blatt. Die alte Abschrift hatte
           den Laser vergessen und verwendete andere Symbole für dieselbe Tat. */
        const drawingTools = Marken.WERKZEUGE.map(tool => [tool.id, tool.sym, tool.name]);
        drawingTools.forEach(([tool, icon, label]) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.dataset.documentTool = tool;
            button.title = label;
            button.setAttribute('aria-label', label);
            const glyph = document.createElement('span');
            glyph.dataset.sym = icon;
            glyph.setAttribute('aria-hidden', 'true');
            button.appendChild(glyph);
            drawingbar.appendChild(button);
        });
        const rulerButton = topButton('ink-ruler', '', 'Lineal ein- oder ausblenden');
        rulerButton.innerHTML = '<span data-sym="inkRuler" aria-hidden="true"></span>';
        rulerButton.setAttribute('aria-pressed', 'false');
        drawingbar.append(rulerButton);
        const moreTools = topButton('ink-options', '···', 'Weitere Zeichenoptionen und Leiste einrichten');
        moreTools.setAttribute('aria-expanded', 'false');
        drawingbar.appendChild(moreTools);
        /* ZURÜCK UND VOR STEHEN LINKS (E490, Redurs Bild vom 7. September).
           So steht es bei GoodNotes: ganz links in der Leiste, vor den
           Werkzeugen — und die Hand sucht sie dort, weil sie dort immer waren.
           Vorher standen sie ganz rechts.
    
           `prepend`, nicht `appendChild`: die Reihenfolge im Baum ist auch die
           Reihenfolge für die Tastatur, und wer mit Tab durch die Leiste geht,
           soll sie in derselben Folge treffen wie mit den Augen (§38). Die
           Mitte bleibt die Mitte — das besorgen zwei `auto`-Ränder im
           Stilblatt, nicht ein zweiter Kasten hier. */
        const history = document.createElement('div');
        history.className = 'document-ink-history';
        history.setAttribute('role', 'group');
        history.setAttribute('aria-label', 'Zeichenverlauf');
        history.append(topButton('ink-undo', '', 'Letzten Zeichenstrich rückgängig machen', 'undo'), topButton('ink-redo', '', 'Zeichenstrich wiederholen', 'redo'));
        /* E572: die feste Verlaufskapsel liegt über dem Papier, nicht im
           rollenden Werkzeugband — wie in Redurs neuer Referenz. */
        /* WELCHE SPALTEN ES GIBT, STEHT AM KASTEN (E296). Vorher war das Raster
           fest — 190 px links, 280 px rechts, bei jeder Fensterbreite ueber
           1100 px. Auf 1440 px blieben der Seite damit rund 900, obwohl beide
           Spalten meistens nichts zu sagen hatten. Grundstellung ist jetzt eine
           einzige Spalte; jede Seitenspalte kommt, wenn sie geoeffnet wird. */
        const body = document.createElement('div');
        body.className = 'document-body' +
            (state.thumbnailsOpen ? ' with-thumbnails' : '') +
            (state.inspectorOpen ? ' with-inspector' : '');
        const thumbnails = document.createElement('aside');
        thumbnails.className = 'document-thumbnails' + (state.thumbnailsOpen ? ' is-open' : '');
        thumbnails.id = 'document-thumbnails-' + page.id;
        thumbnails.setAttribute('aria-label', wortViele(page) + 'übersicht');
        thumbnailButton.setAttribute('aria-controls', thumbnails.id);
        const thumbHeader = document.createElement('div');
        thumbHeader.className = 'document-panel-header';
        const thumbTitle = document.createElement('strong');
        thumbTitle.textContent = wortViele(page);
        const thumbClose = topButton('thumbnails-close', '✕', wortViele(page) + 'übersicht schließen');
        thumbHeader.append(thumbTitle, thumbClose);
        thumbnails.appendChild(thumbHeader);
        documents.forEach((block, index) => thumbnails.appendChild(thumbnail(block, index, index === state.index)));
        const center = document.createElement('main');
        center.className = 'document-center' + (state.einzeln ? ' ist-einzeln' : '');
        center.setAttribute('aria-label', 'Papierfläche');
        center.tabIndex = 0;
        /* ══ DIE ROLLE (E299) ══════════════════════════════════════════════════
           ALLE SEITEN UNTEREINANDER, NICHT EINE ZUM BLAETTERN.
    
           Bis E296 zeigte der Dokumentmodus genau eine Seite, und `‹ ›` wechselte
           sie. Redur wollte es anders und hat es genau gesagt: „ich sollte wie
           one note unendlich schrolen haben … pdf sollte ich weder nach unten
           noch nach rechts die seite wechseln koennen". Ein Skript liest man
           durch, man blaettert es nicht.
    
           DIE SEITEN, DIE MAN NICHT SIEHT, WERDEN NICHT GEZEICHNET. Ein
           Vorlesungsskript hat achtzig Seiten; achtzig Zeichenschichten und
           achtzig Bilder auf einmal sind kein Dokument mehr, sondern ein
           stehender Browser. Jede Seite bekommt deshalb zuerst nur ihren Platz
           — die Hoehe folgt aus `bw`/`bh`, also stimmt der Rollbalken von
           Anfang an — und wird gezeichnet, sobald sie in die Naehe kommt.
    
           `‹ ›` und die Miniaturen wechseln nichts mehr, sie SPRINGEN. */
        // The source file remains untouched. Existing pdfseite blocks below are
        // its editable printout: do not duplicate files or discard annotations.
        /* DIE DATEIKARTE STEHT IN DER RUHIGEN FASSUNG NUR NOCH IM DETAILS-
           FENSTER (E612) — und das dreht E464 an dieser einen Stelle um.
    
           Gemessen kostet sie über dem Blatt 40 px Karte, 17 px Hinweis und
           ihre Abstände, zusammen rund 95 von 301. E384 hatte sie schon einmal
           in den Inspector geräumt („die 45 px kostete sie am Telefon von
           844"), E464 hat sie zurückgeholt. Redur hat am 16. September beides
           gegeneinander gesehen und für den Inspector entschieden.
    
           SIE IST NICHT GELÖSCHT: `renderInspector` setzt sie unverändert, und
           `test532 §4` prüft genau das — erst dass sie oben fehlt, dann dass
           sie im Details-Fenster steht. Ohne diese zweite Zusicherung wäre es
           Löschen mit anderem Namen.
    
           Ohne Ruhe (`data-ruhig="aus"`) bleibt alles wie in E464. */
        const original = document.body.dataset['ruhig'] === 'aus'
            ? originalKnopf(page, current) : null;
        if (original) {
            original.classList.add('document-source-master');
            original.querySelector('.do-wort').textContent = 'Original · geschützt';
            center.appendChild(original);
            const copyLabel = document.createElement('div');
            copyLabel.className = 'document-copy-label';
            copyLabel.textContent = 'Arbeitskopie · hier schreiben und mit Notizen drucken';
            center.appendChild(copyLabel);
        }
        /* WELCHE SEITE GERADE GILT, IST BEWEGLICH GEWORDEN (E299). Vorher stand
           sie beim Zeichnen fest — es gab ja nur eine. In der Rolle wandert sie
           mit dem Blick, und „Ausschnitt", „Erkennen" und der Inspector müssen
           die meinen, die man ansieht. */
        const jetzt = () => documents[Math.max(0, Math.min(state.index, documents.length - 1))] || current;
        const staende = [];
        const gezeichnet = new Set();
        let penTool = String(Store.getMeta('dokStift:' + page.id, 'stift'));
        let penColor = String(Store.getMeta('dokTinte:' + page.id, Marken.FARBEN[0]));
        let penWidth = Number(Store.getMeta('dokStrich:' + page.id, Marken.BREITEN[1]));
        const applyPen = (stand) => {
            if (!state.toolsOpen || !canAnnotate || !stand.isConnected)
                return;
            const toolbar = stand.querySelector('.blatt-werk');
            /* DIE HAND IST KEIN STIFT (E468): seit „Lesen" die Schicht auf die Hand
               stellt, stuende sonst beim naechsten „Annotieren" wieder die Hand —
               und die Zeichenleiste bliebe zu (sie zeigt sich nur bei einem
               Zeichenwerkzeug). Dann lieber der Stift. */
            const key = drawingTools.some(([tool]) => tool === penTool) && penTool !== 'schreiben' ? penTool : 'stift';
            /* ERST DAS WERKZEUG, DANN FARBE UND STÄRKE (E674). Seit jedes Werkzeug
               seine Farbe merkt, holte ein Werkzeugwechsel NACH dem Setzen der
               Dokumentfarbe die gemerkte Stiftfarbe zurück — die Dokumentfarbe
               war gesetzt und im selben Atemzug wieder weg. Die Nachbarstelle
               (§45), gefunden beim Lesen, nicht beim Messen. */
            if (toolbar && toolbar.dataset.tool !== key)
                toolbar.querySelector('[data-wz="' + key + '"]')?.click();
            if (toolbar && !toolbar.dataset.documentPenReady) {
                toolbar.dataset.documentPenReady = 'true';
                Array.from(toolbar.querySelectorAll('[data-c]')).find(b => b.dataset.c === penColor)?.click();
                Array.from(toolbar.querySelectorAll('[data-b]')).find(b => Number(b.dataset.b) === penWidth)?.click();
            }
        };
        let treffer = [];
        let trefferNr = -1;
        let suchLauf = 0;
        /* EINE RECHNUNG, NICHT ZWEI (§8, E671). Hier standen `griffVon` und
           `lageVon` — Wort für Wort dasselbe, was seit E670 in `leser.ts`
           steht. Der Unterschied ist nicht Geschmack: zwei Speicher für
           dieselbe Sache öffnen dieselbe PDF zweimal, und wer einen von
           beiden leert, leert den anderen nicht. */
        const lageVon = (block) => (typeof PdfLeser !== 'undefined' && typeof PdfLeser.lageVonBlock === 'function')
            ? PdfLeser.lageVonBlock(block)
            : Promise.resolve([]);
        const norm = (s) => String(s || '').toLowerCase();
        const vereint = (k) => {
            const x0 = Math.min(...k.map(r => r.x)), y0 = Math.min(...k.map(r => r.y));
            return { x: x0, y: y0, w: Math.max(...k.map(r => r.x + r.w)) - x0, h: Math.max(...k.map(r => r.y + r.h)) - y0 };
        };
        const blattMasse = (block) => ({
            bw: Number(block.bw) || Number(block.blattBreite) || SheetSpace.A4_BREITE,
            bh: Number(block.bh) || Number(block.blattHoehe) || SheetSpace.A4_HOEHE
        });
        /**
         * Die Treffer der Suche malen. Ohne `nur` alle Seiten — mit `nur` genau
         * eine.
         *
         * WARUM DAS NICHT GLEICHGÜLTIG IST (E476, L133). `zeichneStand` ruft
         * das hier, sobald eine Seite beim Rollen nachgezogen wird — und rief
         * es bis hierher OHNE `nur`. Bei einem Skript mit hundert Seiten und
         * einer laufenden Suche heisst das: die hundertste nachgezogene Seite
         * reisst neunundneunzig fertige Trefferschichten ab und baut sie neu
         * auf. Rollen durch eine Suche kostete damit quadratisch, und zwar
         * genau dann, wenn der Mensch rollt — also wenn es auffällt.
         *
         * Die Suche selbst (neuer Begriff, nächster Treffer) ruft weiter
         * ohne `nur`: dort ändert sich wirklich jede Seite, und `ist-aktiv`
         * sitzt nur an einer.
         */
        const trefferMalen = (nur) => {
            staende.forEach((stand, i) => {
                if (nur !== undefined && i !== nur)
                    return;
                stand.querySelectorAll('.document-trefferschicht').forEach(e => e.remove());
                const meine = treffer.map((t, n) => ({ t, n })).filter(x => x.t.index === i);
                stand.classList.toggle('hat-treffer', meine.length > 0);
                if (!meine.length || !gezeichnet.has(i))
                    return;
                const papier = stand.querySelector('.blatt-papier');
                const block = documents[i];
                if (!papier || !block)
                    return;
                const { bw, bh } = blattMasse(block);
                const schicht = document.createElement('div');
                schicht.className = 'document-trefferschicht';
                schicht.setAttribute('aria-hidden', 'true');
                meine.forEach(({ t, n }) => {
                    const el = document.createElement('span');
                    el.className = 'document-treffer' + (n === trefferNr ? ' ist-aktiv' : '');
                    el.dataset.treffer = String(n);
                    if (t.rect) {
                        el.style.left = (t.rect.x / bw * 100) + '%';
                        el.style.top = (t.rect.y / bh * 100) + '%';
                        el.style.width = (Math.max(t.rect.w, 4) / bw * 100) + '%';
                        el.style.height = (Math.max(t.rect.h, 4) / bh * 100) + '%';
                    }
                    else {
                        /* Ohne Kasten: ein Band am linken Rand sagt „auf dieser Seite". */
                        el.classList.add('ist-seite');
                    }
                    schicht.appendChild(el);
                });
                papier.appendChild(schicht);
            });
        };
        /* DIE VERWEISE DER PDF liegen als Schicht UEBER dem Papier, aber
           AUSSERHALB davon: sie gehoeren dem Dokument, nicht dem Zeichner der
           Seite (§5 Regel 1), und sie duerfen nicht in der Zeichenschicht
           liegen, die beim Annotieren jeden Zeiger nimmt. Beim Annotieren ist
           die Schicht weg (CSS), sonst finge sie den Stift. Gedrehte Seiten
           bleiben ohne (L133): ihr Papier steht schief, die Schicht nicht. */
        /**
         * Die Verweisschicht neu vermessen.
         *
         * SIE LIEGT SEIT E481 IM PAPIER und nicht mehr daneben. Vorher wurde
         * sie als Geschwister der Bühne von Hand über das Papier gelegt —
         * Kante für Kante nachgerechnet, bei jedem Rollen und jeder
         * Grössenänderung. Das war nicht nur Arbeit, es war auch der Grund,
         * warum eine GEDREHTE Seite ihre Verweise gar nicht erst zeigte
         * (L133): der gemessene Kasten einer gedrehten Seite ist ihre Hülle,
         * nicht ihr Papier, und die Prozentwerte darin sind falsch.
         *
         * Im Papier liegt sie mit `inset:0` von selbst richtig und dreht mit
         * ihm mit. Zu rechnen bleibt nur die Trefffläche (E475), die in
         * Pixeln misst und darum von der Grösse abhängt.
         */
        const verweiseLegen = (nur) => {
            staende.forEach((stand, k) => {
                if (nur !== undefined && k !== nur)
                    return;
                stand.querySelectorAll('.document-verweise').forEach(verweisLuft);
            });
        };
        /**
         * DER FINGER BRAUCHT MEHR ALS SIEBEN PIXEL (E475, §37, L133).
         *
         * GEMESSEN am Telefon (390×780, Seite 344×487 gerendert): eine
         * Verweiszeile einer PDF ist **6,9 px** hoch. Das ist keine Frage des
         * Geschmacks — mit dem Finger ist sie nicht zu treffen, und der Verweis
         * ist im Lesemodus einer der wenigen Wege, die es überhaupt gibt.
         *
         * Der SICHTBARE Verweis bleibt, was er ist: seine echte Fläche aus der
         * PDF. Ihn zu vergrössern hiesse, die halbe Seite unter blaue Kästen
         * zu legen. Gewachsen wird nur die TREFFFLÄCHE — ein `::before` rund
         * um ihn herum, so viel Luft, dass 44 px daraus werden.
         *
         * UND SIE WÄCHST NUR SO WEIT, WIE SIE DARF. Nie über die Hälfte des
         * Abstands zum nächsten Verweis: eine Trefffläche, die den Nachbarn
         * verschluckt, ist keine Verbesserung — sie tauscht „nicht getroffen"
         * gegen „das Falsche getroffen", und das ist schlimmer. In einem
         * Inhaltsverzeichnis mit zwölf Zeilen bekommt also jede Zeile den
         * halben Zeilenabstand, im freien Text die vollen 44 px.
         *
         * Waagerecht und senkrecht getrennt gerechnet: zwei Verweise in EINER
         * Zeile stehen sich seitlich im Weg, nicht nach oben.
         */
        const verweisLuft = (schicht) => {
            const ZIEL = 44;
            const kaesten = [...schicht.querySelectorAll('.document-verweis')]
                .map(el => ({ el, r: el.getBoundingClientRect() }));
            if (!kaesten.length)
                return;
            for (const a of kaesten) {
                /* Unsichtbar (Werkzeuge offen) hat nichts eine Fläche — dann gibt
                   es auch nichts zu rechnen; die nächste Lage holt es nach. */
                if (!a.r.width && !a.r.height) {
                    a.el.style.removeProperty('--verweis-hoch');
                    a.el.style.removeProperty('--verweis-breit');
                    continue;
                }
                let hoch = Math.max(0, (ZIEL - a.r.height) / 2);
                let breit = Math.max(0, (ZIEL - a.r.width) / 2);
                for (const b of kaesten) {
                    if (b === a || (!b.r.width && !b.r.height))
                        continue;
                    const dx = Math.max(b.r.left - a.r.right, a.r.left - b.r.right, 0);
                    const dy = Math.max(b.r.top - a.r.bottom, a.r.top - b.r.bottom, 0);
                    if (!dx && !dy) {
                        hoch = 0;
                        breit = 0;
                        break;
                    } /* sie überlappen schon */
                    if (dy)
                        hoch = Math.min(hoch, dy / 2);
                    if (dx)
                        breit = Math.min(breit, dx / 2);
                }
                a.el.style.setProperty('--verweis-hoch', Math.round(hoch) + 'px');
                a.el.style.setProperty('--verweis-breit', Math.round(breit) + 'px');
            }
        };
        const verweiseMalen = (i) => {
            const stand = staende[i];
            const block = documents[i];
            if (!stand || !block || block.type !== 'pdfseite' || !block.quelleId)
                return;
            /* AUS DEM BLOCK, NICHT AUS DER DATEI (E473). Seit dem Einlesen stehen
               die Verweise am Block (`verweise`, einlesen.ts); das Ansehen einer
               Seite öffnet damit keine PDF mehr. Seiten, die vor E473 eingelesen
               wurden, haben das Feld nicht — sie zeigen keine Verweise, bis sie
               neu eingelesen werden (L133). */
            const l = Promise.resolve(Array.isArray(block.verweise) ? block.verweise : []);
            void l.then((liste) => {
                if (!liste.length || !stand.isConnected)
                    return;
                /* INS PAPIER, nicht daneben (E481): dort liegt sie mit `inset:0`
                   von selbst richtig — und dreht mit einer gedrehten Seite mit. */
                const papier = stand.querySelector('.blatt-papier');
                if (!papier)
                    return;
                stand.querySelectorAll('.document-verweise').forEach(e => e.remove());
                const schicht = document.createElement('div');
                schicht.className = 'document-verweise';
                const { bw, bh } = blattMasse(block);
                liste.forEach((v) => {
                    let el;
                    if (v.url) {
                        /* NUR http, https und mailto — alles andere ist kein Verweis,
                           sondern ein Versteck (§19). */
                        const sicher = typeof Sanitize !== 'undefined' ? Sanitize.url(v.url) : '';
                        if (!sicher || !/^(https?:|mailto:)/i.test(sicher))
                            return;
                        const a = document.createElement('a');
                        a.href = sicher;
                        a.target = '_blank';
                        a.rel = 'noopener noreferrer';
                        a.title = sicher;
                        el = a;
                    }
                    else {
                        const ziel = documents.findIndex(b => b.quelleId === block.quelleId && Number(b.nr) === Number(v.seite));
                        if (ziel < 0)
                            return;
                        const k = document.createElement('button');
                        k.type = 'button';
                        k.dataset.documentIndex = String(ziel);
                        k.title = 'Zu Seite ' + (ziel + 1);
                        k.setAttribute('aria-label', 'Verweis zu Seite ' + (ziel + 1));
                        /* DIE STELLE AUF DER SEITE (E481). Nennt das PDF-Ziel nicht
                           nur die Seite, sondern den Punkt darauf, wird auch dorthin
                           gerollt — ein Querverweis mitten in ein Kapitel landete
                           sonst an dessen Anfang. Der Anteil, nicht die Punktzahl:
                           wie hoch die Seite auf dem Bildschirm steht, weiss erst
                           `springe`. */
                        const zielBlock = documents[ziel];
                        const zielHoehe = zielBlock ? blattMasse(zielBlock).bh : bh;
                        if (typeof v.zielY === 'number' && Number.isFinite(v.zielY) && zielHoehe > 0)
                            k.dataset.documentStelle = String(Math.max(0, Math.min(1, v.zielY / zielHoehe)));
                        el = k;
                    }
                    el.classList.add('document-verweis');
                    el.style.left = (v.x / bw * 100) + '%';
                    el.style.top = (v.y / bh * 100) + '%';
                    el.style.width = (v.w / bw * 100) + '%';
                    el.style.height = (v.h / bh * 100) + '%';
                    schicht.appendChild(el);
                });
                if (!schicht.childElementCount)
                    return;
                papier.appendChild(schicht);
                verweiseLegen(i);
            });
        };
        /** Im Lesemodus: der Text des Blatts wird `inert`, das Papier selbst
            nicht (E468, siehe zeichneStand). Ein PDF-Blatt hat keinen Text —
            dann bleibt nichts zu tun. */
        const stillSetzen = (paper, still) => {
            const flur = paper.closest('.blatt-flur');
            if (flur)
                flur.inert = false;
            paper.inert = false;
            paper.querySelectorAll('.blatt-inhalt').forEach(inhalt => { inhalt.inert = still; });
        };
        /* VOR `zeichneStand` erklaert, nicht dahinter: die erste Buehne wird
           schon beim Aufbau gezeichnet, und `let` kennt keine Vorwegnahme. */
        const zeichneStand = (i) => {
            if (gezeichnet.has(i))
                return;
            const stand = staende[i];
            const block = documents[i];
            if (!stand || !block)
                return;
            gezeichnet.add(i);
            stand.style.removeProperty('height');
            renderDocument(stand, block);
            /* E468: im Lesemodus beginnt auch diese Buehne mit der Hand; dazu die
               Treffer der laufenden Suche und die Verweise der PDF. */
            if (!state.toolsOpen)
                stand.querySelector('.blatt-werk [data-wz="schreiben"]')?.click();
            if (treffer.length)
                trefferMalen(i);
            verweiseMalen(i);
            stand.querySelectorAll('.blatt-papier').forEach(paper => {
                /* NUR DER TEXT WIRD STILL, NICHT DAS PAPIER (E468). Bis hier war das
                   ganze Papier im Lesemodus `inert` — und damit auch jede Marke,
                   die man gerade im Lesemodus antippen soll: das Abdeckband
                   (E266) und die Verweise (E468). Der Text darunter bleibt still,
                   die Zeichenschicht ist im Lesemodus ohnehin durchlaessig
                   (pointer-events:none) bis auf die Marken, die es sein wollen. */
                stillSetzen(paper, !state.toolsOpen);
            });
            requestAnimationFrame(() => applyPen(stand));
        };
        documents.forEach((block, i) => {
            const stand = document.createElement('div');
            stand.className = 'document-stage';
            stand.dataset.standNr = String(i);
            stand.addEventListener('pointerdown', event => {
                if (!(event.target instanceof Element) || event.target.closest('.blatt-reihe'))
                    return;
                state.index = i;
                seiteMerken(page.id, i);
                aktivMarkieren();
                applyPen(stand);
            }, true);
            /* Der Platzhalter in der richtigen Hoehe. Ohne ihn springt der
               Rollbalken bei jeder nachgezeichneten Seite. */
            /* Gedreht heisst quer: die Masse, wie sie stehen (E467). */
            const { bw, bh } = SheetSpace.masseVon(block);
            /* EIN GROBER PLATZHALTER, damit nichts auf null zusammenfaellt. Das
               RICHTIGE Mass setzt `passen()` gleich darauf — hier kann es noch gar
               nicht stimmen, siehe `platzhalterSetzen`. */
            if (bw > 0 && bh > 0)
                stand.style.height = Math.round(Math.max(200, center.clientWidth - 36) * (bh / bw)) + 'px';
            staende.push(stand);
            center.appendChild(stand);
        });
        /* Die erste Seite sofort, damit nie ein leeres Fenster dasteht. */
        zeichneStand(Math.max(0, Math.min(state.index, documents.length - 1)));
        const inspector = document.createElement('aside');
        inspector.className = 'document-inspector' + (state.inspectorOpen ? ' is-open' : '');
        inspector.id = 'document-inspector-' + page.id;
        inspector.setAttribute('aria-label', 'Dokumentdetails und verknüpfte Inhalte');
        inspectorButton.setAttribute('aria-controls', inspector.id);
        renderInspector(inspector, page, current);
        /* ══ DIE VERLAUFSKAPSEL LIEGT IM PAPIERBEREICH (E573) ═════════════════
           E572 hängte sie als viertes Kind in `.document-body`. Das ist am
           Rechner ein Raster mit drei Spalten (0 / Papier / 0) — ohne eigene
           Spaltenangabe landete sie in der dritten, 0 px breiten, und stand
           gemessen bei x = 1440 in einem 1440-px-Fenster. Am TELEFON ist
           `.document-body` gar kein Raster, sondern `display:block`: dort stand
           sie als letzter Block UNTER dem Papier, gemessen bei top = 812 in
           einem 800 px hohen Fenster. Beides heisst dasselbe: Rückgängig war
           nicht erreichbar, und das ist §46 Priorität 1.
    
           Jetzt liegt sie IN `.document-center`, also in der Spalte, in der das
           Papier steht, und klebt dort oben links (`position:sticky`). Das
           braucht kein Raster und keine Sonderregel je Bildschirmbreite — es
           ist derselbe Kasten, in dem auch das Papier rollt. */
        /* ══ DIE VERLAUFSKAPSEL BLEIBT EIN KIND DES KÖRPERS (E573) ════════════
           Sie IN die Papierspalte zu hängen (`center.prepend`) sah nach dem
           kürzeren Weg aus und war der falsche: gemessen baute das Studio danach
           gar nicht mehr auf — `.document-workspace` wurde nie sichtbar, und
           `test437` lief in seine Zeitgrenze. `.document-center` ist der
           Rollkasten, dessen erste Kinder (Original, Beschriftung, Bühnen) von
           Messung, Rollstand und ResizeObserver gelesen werden; ein schwebendes
           Element davor gehört dort nicht hinein.
    
           Sie bleibt also Kind von `.document-body` — und bekommt IM STILBLATT
           ihren Platz: seit E579 in JEDEM Raster `position:absolute` oben
           links, am Rechner wie am Telefon. (Hier stand bis dahin „am Rechner
           als Rasterfeld in derselben Zelle wie das Papier" — das stimmte für
           eine Ansicht und schob in der anderen die Folienfläche um 54 px
           nach unten, gefunden von `test508 §2`.) */
        body.append(thumbnails, center, inspector, history);
        /* ══ DIE SUCHLEISTE (E468) ══════════════════════════════════════════════
           Ein Feld, die Zahl, vor und zurueck, zu. Enter springt zum naechsten
           Treffer, Umschalt+Enter zum vorigen, Escape schliesst (E302). Die
           Treffer selbst liegen NICHT im DOM, sondern in `treffer` (Seite +
           Kasten in Blattpunkten): so findet die Suche auch Seiten, die noch
           nicht gezeichnet sind, und `zeichneStand` malt beim Zeichnen nach. */
        const findbar = document.createElement('div');
        findbar.className = 'document-findbar';
        findbar.hidden = true;
        findbar.setAttribute('role', 'search');
        findbar.id = 'document-find-' + page.id;
        findButton.setAttribute('aria-controls', findbar.id);
        const findFeld = document.createElement('input');
        findFeld.type = 'search';
        findFeld.placeholder = 'Im Dokument suchen …';
        findFeld.setAttribute('aria-label', 'Im Dokument suchen');
        findFeld.dataset.documentFind = '';
        const findZahl = document.createElement('span');
        findZahl.className = 'document-find-zahl';
        findZahl.setAttribute('aria-live', 'polite');
        /* DER SCHALTER „ALLE DOKUMENTE" (E487). Er steht VOR den Pfeilen, weil
           die Pfeile dem offenen Dokument gehören und er die Frage stellt, auf
           welches Dokument sich alles bezieht. Sein Zustand hält sich in `meta`:
           wer über alles sucht, sucht meist wieder über alles. */
        /* „📚" und nicht „🗂": das Karteikartenzeichen kam auf dem Bild als
           blasses Kästchen heraus — es steht nicht in jeder Schrift. Der
           Bücherstapel steht überall und meint dasselbe (die Bibliothek). */
        const findAlleKnopf = topButton('find-alle', '📚', 'Auch in den anderen Dokumenten suchen');
        findAlleKnopf.className = 'document-find-alle';
        let findAlle = Store.getMeta('dokFindAlle') === true;
        findAlleKnopf.setAttribute('aria-pressed', String(findAlle));
        findAlleKnopf.classList.toggle('an', findAlle);
        /* DIE LISTE DER FREMDEN TREFFER. Sie hängt UNTER der Suchleiste und
           nicht im Papier: ein Treffer in einem anderen Dokument hat auf
           diesem Blatt keinen Ort, und ein Kasten irgendwo wäre eine
           Behauptung. */
        const findListe = document.createElement('div');
        findListe.className = 'document-find-liste';
        findListe.hidden = true;
        findbar.append(findFeld, findZahl, findAlleKnopf, topButton('find-previous', '‹', 'Voriger Treffer'), topButton('find-next', '›', 'Nächster Treffer'), topButton('find-close', '✕', 'Suche schließen'), findListe);
        /* DAS FOLIENBAND STEHT ZWISCHEN KOPFLEISTE UND SUCHE (E550) — also
           ÜBER der Zeichenleiste, so wie ein Menüband über dem Blatt steht.
           Es kommt nur bei einem Foliensatz und nur ab 900 px; sonst ist es
           `null` und `append` bekommt nichts (siehe `folienbandBauen`). */
        /* DIE ZEICHENLEISTE WOHNT IM BAND, WENN ES EINES GIBT (E552).
           Gibt es keines — ein PDF, ein Heft, oder ein Fenster unter 900 px —,
           steht sie wie bisher als eigene Leiste zwischen Suche und Inhalt.
           Es ist in beiden Fällen DASSELBE Element; `applyPen`, `inkSync` und
           die Stiftoptionen finden es über `.document-drawingbar`, egal wo es
           hängt. */
        let folienband = folienbandBauen(page, drawingbar);
        workspace.append(top, ...(folienband ? [folienband] : []), findbar, ...(folienband ? [] : [drawingbar]), commandbar, body);
        /**
         * Das Band kommt und geht mit der Fensterbreite.
         *
         * GEFUNDEN BEIM LESEN DES EIGENEN BOGENS, nicht beim Messen: `innerWidth`
         * wird EINMAL beim Zeichnen gefragt. Wer ein Fenster von 1440 auf 800
         * zieht, behielt ein Band, das dort nicht hingehört; wer umgekehrt
         * aufzieht, bekam nie eines. Das Studio zeichnet bei `resize` nicht neu
         * — es rechnet nur Höhen nach (`beiGroesse`), und das ist richtig so.
         * Also hängt sich das Band dort selbst ein und aus.
         */
        const folienbandNachziehen = () => {
            const soll = istFoliensatz(page) && innerWidth >= BAND_AB;
            const ist = !!folienband && folienband.isConnected;
            if (soll === ist)
                return;
            if (!soll) {
                /* DIE LEISTE ZUERST IN SICHERHEIT BRINGEN. Sie ist ein KIND des
                   Bandes; das Band einfach zu entfernen nähme sie mit, und dann
                   gäbe es am schmalen Fenster gar keine Zeichenwerkzeuge mehr —
                   genau der Datenweg, den §47 „nichts wegnehmen" meint, nur als
                   Unfall. Erst zurück an ihren alten Platz, dann das Band weg. */
                drawingbar.hidden = false;
                drawingbar.setAttribute('aria-label', 'PDF bearbeiten');
                findbar.after(drawingbar);
                folienband?.remove();
                folienband = null;
                return;
            }
            folienband = folienbandBauen(page, drawingbar);
            if (folienband)
                top.after(folienband);
        };
        wrap.appendChild(workspace);
        /* ══ DAS EIGENE FORMELHEFT, NEBEN DEM FACHZEICHEN (E503) ═══════════════
           Redur: „wo — wenn beim Elektro, wo die Elektrosymbol ist — beim
           Dokument arbeiten, die im PDF dort sehen kann".
    
           Das Formelheft gab es längst; es stand nur in der Befehlspalette
           (Strg K) und auf der Planfläche. Wer im Dokument arbeitet, findet es
           dort nicht — und das Dokument ist der Ort, an dem nachgeschlagen
           wird: eine Formel braucht man NEBEN der Aufgabe, nicht statt ihrer.
    
           ES STEHT NEBEN DEM FACHZEICHEN, und zwar mit demselben Grund, mit
           dem in E494 die Elemente dorthin kamen: es ist dieselbe Bewegung an
           derselben Stelle der Arbeit — das Schaltzeichen setzen und die
           Formel dazu nachsehen gehören zusammen.
    
           ES IST KEIN WERKZEUG, sondern ein Schalter: `data-document-action`
           und nicht `data-document-tool`. Ein Werkzeug hält man und zeichnet
           damit; dieses Fenster liegt daneben, während man mit einem anderen
           zeichnet — und genau deshalb darf es die Werkzeugwahl nicht anrühren.
    
           DEN ZUSTAND BESITZT ES NICHT. Das Heft geht auch über sein ✕ und
           über Escape zu; abgefragt würde das nie bemerkt. Also horcht der
           Knopf (`Formelheft.horche`) — ein Zustand, eine Quelle (§8). */
        if (typeof Formelheft !== 'undefined') {
            const heft = document.createElement('button');
            heft.type = 'button';
            heft.dataset.documentAction = 'formelheft';
            heft.setAttribute('aria-label', 'Formelheft');
            heft.title = 'Mein eigenes Formelheft — liegt über der Seite; schieben und '
                + 'an der Ecke grösser ziehen';
            heft.setAttribute('aria-pressed', 'false');
            const heftZeichen = document.createElement('span');
            heftZeichen.dataset.sym = 'book';
            heftZeichen.setAttribute('aria-hidden', 'true');
            heft.appendChild(heftZeichen);
            drawingbar.querySelector('[data-document-tool="zeichen"]')?.after(heft);
            const heftSync = () => {
                /* AM ARBEITSRAUM MESSEN, NICHT AM KNOPF — wie `inkSync` daneben.
                   Am Knopf gemessen war der erste Ruf gleich der letzte: er kam,
                   bevor die Leiste im Baum hing, und meldete den Horcher sofort
                   wieder ab. Danach blieb der Knopf für immer losgelassen. */
                if (!workspace.isConnected) {
                    Formelheft.vergiss(heftSync);
                    return;
                }
                heft.setAttribute('aria-pressed', String(!!Formelheft.offen()));
            };
            Formelheft.horche(heftSync);
            heftSync();
        }
        if (typeof Register !== 'undefined')
            Register.symbole.fuelle(drawingbar);
        /* UND DIE ZWEI ANDEREN ORTE MIT GEZEICHNETEN ZEICHEN (E586): die
           Kopfzeile (Suchen, Ansicht) und die Verlaufskapsel. `fuelle` sucht
           nur `[data-sym]` — es fasst nichts an, was keins hat. */
        if (typeof Register !== 'undefined') {
            try {
                Register.symbole.fuelle(top);
                Register.symbole.fuelle(history);
            }
            catch { /* ohne Zeichen bleibt der Name im `aria-label` */ }
        }
        const inkToolbar = () => staende[state.index]?.querySelector('.blatt-werk') || null;
        /* DIE FLÄCHE, AUF DER DIE KNÖPFE WIRKLICH LIEGEN (E614, W2).
           Seit der Tafel ist das einzige Kind von `.blatt-werk` ein `<div>`.
           Wer hier die Leiste nimmt, beobachtet ein Element, das sich nie mehr
           ändert, und fragt nach Kindern, die es nicht mehr hat — beides ohne
           Fehlermeldung. Der Rückfall auf die Leiste ist Absicht: eine Leiste
           ohne Tafel ist ihre eigene Fläche. */
        /* SEIT E618 WIEDER DIE LEISTE SELBST. E614 legte ALLE Kinder in die
           Tafel, also musste hier eine Ebene tiefer gesucht werden. E618 hat
           die WERKZEUGE zurück in die Leiste geholt — und nur um die geht es
           hier: die obere Reihe spiegelt `[data-wz]`, nicht das Zubehör.
           Der Helfer bleibt trotzdem stehen, weil er die Absicht benennt und
           weil ein Rückfall nichts kostet. */
        const inkFlaeche = () => inkToolbar();
        /* ══ EINE SORTIERBEWEGUNG IST KEINE ATTRIBUTÄNDERUNG (E575) ═════════════
           Der Beobachter darüber horcht auf `disabled`, `aria-pressed` und
           `data-tool` — und genau deshalb kam eine Sortierbewegung oben NIE an:
           sie ist eine `childList`-Änderung. Gemessen: den letzten Knopf der
           unteren Leiste nach vorn gezogen, 600 ms gewartet, obere Reihenfolge
           Zeichen für Zeichen unverändert.
           WARUM NICHT EINFACH `childList` OBEN DAZU: `center` enthält die
           Zeichenfläche. Jeder Strich hängt dort Pfade ein, und `inkSync()`
           liefe dann mitten im Zeichnen bei jedem Bild. Der zweite Beobachter
           horcht deshalb nur auf die Leiste selbst, ohne `subtree` — dort sind
           die Kinder genau die Knöpfe, um die es geht. Er wird umgehängt, wenn
           die aktive Seite eine andere Leiste mitbringt. */
        let beobachtet = null;
        const ordnungObserver = new MutationObserver(() => {
            if (!workspace.isConnected) {
                ordnungObserver.disconnect();
                return;
            }
            inkSync();
        });
        const ordnungBeobachten = () => {
            const source = inkFlaeche();
            if (!source || source === beobachtet)
                return;
            ordnungObserver.disconnect();
            ordnungObserver.observe(source, { childList: true });
            beobachtet = source;
        };
        /* ══ DIE KOPIE ZEIGT, WAS DAS ORIGINAL ZEIGT (E583) ══════════════════════
           Die obere Reihe wird EINMAL aus `Marken.WERKZEUGE` gebaut und trägt
           seither dasselbe Zeichen. Für zwölf der dreizehn Werkzeuge stimmt
           das: ein Stift bleibt ein Stift. Für den dreizehnten stimmt es nicht.
    
           `formen` ist kein Werkzeug, sondern ein Knopf für sieben (E375), und
           E515 sagt ausdrücklich, was er zeigen soll: „nicht ‚Formen', sondern
           WELCHE Form gerade gewählt ist — ein Dreieck, ein Pfeil, eine Kurve.
           Ein gemeinsames Werkzeugzeichen nähme genau die Auskunft weg, für die
           dieser Knopf da ist." Der Knopf auf dem Blatt hält das seit E515; er
           schreibt sich beim Formwechsel selbst um (`marken.ts`, `formart`).
    
           GEMESSEN am 15. September 2026 hielt die Kopie es nicht: Dreieck,
           Kurve, Ellipse gewählt — oben dreimal `inkShapes`, dreimal kein
           `data-form`, dreimal der Titel „Form". Im Studio ist die obere Reihe
           die einzige sichtbare (E573); die Auskunft fehlte also genau dort,
           wo gezeichnet wird.
    
           WARUM ALLGEMEIN UND NICHT ALS SONDERFALL FÜR `formen`: derselbe Satz
           gilt für jeden Knopf, der sich unterwegs umschreibt. Eine Zeile
           `if (id === 'formen')` wäre beim nächsten solchen Knopf wieder falsch,
           und niemand würde es merken. Hier wird verglichen, nicht geraten —
           wer sein Zeichen nie ändert, kommt hier nie vorbei.
    
           NUR BEI ABWEICHUNG (E575): `Register.symbole.fuelle` schreibt ein
           frisches `<svg>` hinein. Bei jedem der sechs Rufe von `inkSync()`
           hiesse das sechsmal neues Markup unter dem Finger — derselbe Preis,
           den das Umhängen oben schon gekostet hat. */
        const zeichenSpiegeln = (kopie, echt) => {
            if (!echt)
                return;
            const glyph = kopie.querySelector('[data-sym]');
            const sym = echt.querySelector('[data-sym]')?.dataset.sym || '';
            if (!glyph || !sym)
                return;
            const form = echt.dataset.form || '';
            if (glyph.dataset.sym === sym && (kopie.dataset.form || '') === form)
                return;
            glyph.dataset.sym = sym;
            if (form)
                kopie.dataset.form = form;
            else
                delete kopie.dataset.form;
            try {
                Register.symbole.fuelle(kopie);
            }
            catch { /* dann bleibt das alte Zeichen stehen */ }
            /* AUCH DAS WORT, NICHT NUR DAS BILD (§38): wer die Maus darauf hält
               oder einen Vorleser benutzt, hörte sonst weiter „Form". */
            const titel = echt.getAttribute('title');
            if (titel) {
                kopie.title = titel;
                kopie.setAttribute('aria-label', titel);
            }
        };
        const inkSync = () => {
            if (!workspace.isConnected) {
                Zeichenziel.vergiss(inkSync);
                return;
            }
            const source = inkToolbar();
            source?.dispatchEvent(new Event('ink-studio-ready'));
            /* ══ NUR UMHÄNGEN, WENN SICH WIRKLICH ETWAS GEÄNDERT HAT (E575) ═══════
               Hier stand dasselbe `insertBefore` ohne Bedingung. `insertBefore`
               BEWEGT auch einen Knoten, der schon am richtigen Platz steht: erst
               raus, dann rein. Gemessen mit einem Beobachter auf der oberen
               Leiste ergab ein einziger Klick auf ein Werkzeug **156
               Knotenbewegungen** — dreizehn Knöpfe mal zwei Bewegungen mal sechs
               Rufe von `inkSync()`.
               Der Preis war nicht nur Rechenzeit. Ein bewegter Knoten verliert
               den Fokus: nach dem Klick stand `document.activeElement` auf
               `BODY`, der Knopf war also unter dem Finger weggezogen worden. Und
               jeder Übergang auf ihm (E568: der Wechsel der Auswahl) begann von
               vorn, mitten im Bild.
               Jetzt wird zuerst verglichen und nur bei Abweichung umgehängt. Die
               benutzereigene Reihenfolge (§8/E570) gilt unverändert — sie kommt
               nur ohne Neuaufbau an. */
            const wunsch = Array.from(inkFlaeche()?.querySelectorAll(':scope > [data-wz]') || [])
                .map(real => drawingbar.querySelector(`[data-document-tool="${real.dataset.wz}"]`))
                .filter((button) => !!button);
            const jetzt = Array.from(drawingbar.querySelectorAll(':scope > [data-document-tool]'))
                .filter(button => wunsch.includes(button));
            if (wunsch.some((button, index) => button !== jetzt[index])) {
                wunsch.forEach(button => drawingbar.insertBefore(button, rulerButton));
            }
            const realRuler = source?.querySelector('[data-act="lineal"]');
            /* ══ IM LESEMODUS IST DIE OBERE REIHE AUS (E578) ═══════════════════════
               GEMESSEN am 15. September 2026: im Lesemodus war
               `[data-document-tool="marker"]` sichtbar UND nicht `disabled`. Ein
               gewöhnlicher Mausklick darauf setzte die Zeichenschicht auf `marker`
               und `pointer-events:auto` — und der nächste Zug landete als Marke im
               Block (0 → 1). Ein Dokument, das man ausdrücklich zum LESEN geöffnet
               hat, nahm damit Striche an.
               Die untere Leiste war längst zu (`.blatt-reihe{display:none}`), die
               obere aber nicht — sie hat ihre eigene `disabled`-Rechnung, und
               `state.toolsOpen` kam darin nicht vor. Die Knöpfe sagten dabei sogar
               schon die Wahrheit: ihr `aria-pressed` ist im Lesemodus überall
               `false`. Eine Reihe, die „nichts gewählt" meldet und trotzdem
               schreibt, ist der Widerspruch, der hier weggeht.
               Dasselbe gilt für die gesperrte Seite und für fehlende Rechte:
               beide schliessen dieselbe Reihe über `state.toolsOpen`. */
            rulerButton.disabled = !canAnnotate || !state.toolsOpen || !realRuler;
            rulerButton.setAttribute('aria-pressed', realRuler?.getAttribute('aria-pressed') || 'false');
            workspace.dataset.inkTool = source?.dataset.tool || 'schreiben';
            drawingbar.querySelectorAll('[data-document-tool]').forEach(button => {
                const real = source?.querySelector('[data-wz="' + button.dataset.documentTool + '"]');
                button.disabled = !canAnnotate || !state.toolsOpen || !real || real.disabled;
                button.setAttribute('aria-pressed', String(state.toolsOpen && real?.getAttribute('aria-pressed') === 'true'));
                zeichenSpiegeln(button, real);
            });
            for (const action of ['undo', 'redo']) {
                const real = source?.querySelector('[data-act="' + action + '"]');
                const button = history.querySelector('[data-document-action="ink-' + action + '"]');
                if (button)
                    button.disabled = !canAnnotate || !real || real.disabled;
            }
            /* Die Leiste der aktiven Seite ist nicht immer dieselbe — nachziehen. */
            ordnungBeobachten();
        };
        Zeichenziel.horche(inkSync);
        // History state is published on the existing controls via disabled attrs.
        const inkObserver = new MutationObserver(() => {
            if (!workspace.isConnected) {
                inkObserver.disconnect();
                return;
            }
            inkSync();
        });
        inkObserver.observe(center, { subtree: true, attributes: true, attributeFilter: ['disabled', 'aria-pressed', 'data-tool'] });
        /* DIE HOEHE MISST SICH SELBST (E296). In der CSS stand `calc(100vh -
           150px)`; die 150 waren der Seitenkopf plus die Leisten darueber. Der
           Kopf ist weg, also waere jede feste Zahl ab jetzt eine andere Luecke —
           und sie waere auch vorher schon falsch gewesen, sobald das Menueband
           einmal umbricht. Der Arbeitsraum fragt stattdessen, wo er anfaengt,
           und hoert zwoelf Pixel ueber dem unteren Fensterrand auf.
    
           In Pixeln statt in `vh`: `100vh` meint am Telefon das Fenster MIT der
           Adresszeile, `window.innerHeight` das ohne — und genau das ist die
           Zahl, die zaehlt. Ein `resize` bringt beides wieder zusammen. */
        const hoeheSetzen = () => {
            if (!workspace.isConnected)
                return;
            const oben = Math.round(workspace.getBoundingClientRect().top);
            if (oben < 0 || oben >= window.innerHeight)
                return;
            workspace.style.height = Math.max(240, window.innerHeight - oben) + 'px';
        };
        /* DIE GANZE SEITE PASST INS BILD (E296) — das ist bei GoodNotes die
           Grundstellung, und es ist die Frage, die eine Dokumentansicht
           beantworten muss: sehe ich ein Blatt oder ein Drittel davon.
    
           Vorher stand hier `stage.style.width = zoom + '%'`. Prozent WOVON —
           von der Breite der Mitte. Seit die Mitte nicht mehr 900, sondern 1360
           Pixel breit ist, waere eine A4-Seite bei 100 % gut 1900 Pixel hoch
           geworden: in einem 750 Pixel hohen Kasten sieht man davon ein Drittel.
    
           Also wird ab der HOEHE gerechnet und das Seitenverhaeltnis gibt die
           Breite. Der Zoom bleibt genau das, was er war — ein Faktor auf die
           Ansicht; `bw`/`bh` des Blocks werden nicht angefasst. Die Leiste zaehlt
           mit, weil sie im Fluss ueber dem Papier steht (auch als klebende). */
        /* Die Präsentation (E493) steht weiter unten — ihre drei Merker stehen
           aber HIER, weil `passen()` sie liest und vor ihnen laufen kann.
           `let` in einem Block, das nach seinem ersten Leser deklariert wird,
           wirft beim ersten Lesen (TDZ); der Fehler käme dann aus `passen` und
           niemand suchte ihn in der Präsentation. */
        let zeigenFlaeche = null;
        let laser = null;
        let laserWeg = null;
        const passen = () => {
            if (!workspace.isConnected)
                return;
            const raum = center.clientWidth;
            if (raum < 120)
                return;
            /* ══ IN DER ROLLE GIBT DIE BREITE DAS MASS (E299) ═════════════════════
               Bis hierher wurde aus der HOEHE gerechnet, damit eine ganze Seite
               ins Bild passt. Das war fuer das Blaettern richtig und ist fuers
               Rollen falsch: man rollt ja ohnehin, und Redur will die Seiten
               „ganz oeffnen komplett wie one note" — also gross und lesbar, nicht
               auf Fensterhoehe geschrumpft.
      
               Gemessen auf 1440 px war die Seite mit der Hoehenrechnung 432 px
               breit; die Mitte hatte 1360. Ein Skript liest sich so nicht. */
            let breit = Math.round(Math.min(raum - 36, 980) * (state.zoom / 100));
            /* IM ZOOM-FENSTER GIBT DIE HOEHE DAS MASS (E470). Oben soll die GANZE
               Seite stehen — sonst rollt man oben und schreibt unten, und der
               Rahmen zeigt auf etwas, das man nicht sieht. Der Streifen unten ist
               die Vergroesserung; die Buehne darf klein sein. */
            if (state.lupe) {
                const platz = center.clientHeight - 24;
                const masse = SheetSpace.masseVon(documents[state.index] || {});
                if (platz > 80 && masse.bh > 0)
                    breit = Math.round(Math.max(120, Math.min(breit, platz * masse.bw / masse.bh)));
            }
            /* IN DER PRÄSENTATION GIBT DIE HÖHE DAS MASS (E493). Ein Vortrag
               zeigt eine ganze Folie; auf dem ersten Bild lief die Seite unten
               aus dem Fenster. Und ohne den Zoom: wer präsentiert, will die Seite
               sehen, nicht seine letzte Vergrösserung von gestern. */
            if (zeigenFlaeche) {
                const platz = center.clientHeight - 36;
                const masse = SheetSpace.masseVon(documents[state.index] || {});
                breit = masse.bh > 0 && platz > 80
                    ? Math.round(Math.max(120, Math.min(raum - 36, platz * masse.bw / masse.bh)))
                    : Math.round(raum - 36);
            }
            /* DAS MASS GEHT ANS PAPIER, NICHT AN DIE BUEHNE. Die Zeichenleiste
               gehoert zum Blatt und steht in derselben Huelle; haette die Buehne
               das Passmass, waere die Leiste so schmal wie die Seite — gemessen:
               21 Werkzeuge in 447 px ergaben eine 332 px HOHE Leiste, die mehr
               Platz nahm als das Papier darunter. Die Buehne bleibt also breit,
               die Leiste passt in eine Zeile, und nur das Papier wird gestellt.
               Die Zeichenschicht haengt IM Papier (E100) und geht in Blattmassen
               statt in Pixeln — sie folgt von selbst mit. */
            /* AN DIE MITTE, NICHT AN EINE BUEHNE (E299). Seit die Rolle alle
               Seiten traegt, gibt es nicht mehr die eine. Das Mass steht deshalb
               am gemeinsamen Elternteil und vererbt sich an jede.
      
               OHNE DECKEL NACH OBEN. Der erste Entwurf begrenzte auf die Breite
               der Mitte — und damit tat der Zoom ueber 100 % gar nichts mehr
               (gemessen: 1250 px bei 100 % und bei 130 %). Wer hineinzoomt, will
               Einzelheiten gross sehen und nimmt das seitliche Rollen dafuer in
               Kauf; das ist etwas anderes als ein Seitenwechsel nach rechts, den
               es hier nicht gibt. */
            center.style.setProperty('--doc-blatt', Math.max(120, breit) + 'px');
            platzhalterSetzen(Math.max(120, breit));
            verweiseLegen();
            if (state.lupe)
                requestAnimationFrame(lupeLegen);
        };
        /* ══ E399 · DER PLATZHALTER WAR 283 PX HOCH STATT 1922 ═══════════════════
           E299 schrieb an die Stelle oben: „Der Platzhalter in der Hoehe, die die
           Seite wirklich bekommen wird — sonst springt der Rollbalken, sobald sie
           gezeichnet ist." Genau das tat er nicht.
    
           GEMESSEN an sechs A4-Seiten auf 1360x900:
    
             beim Oeffnen   Rolle 3513   Hoehen [1922, 283, 283, 283, 283, 283]
             nach 1000 px   Rolle 5067   Hoehen [1922, 1837, 283, 283, 283, 283]
             nach 3000 px   Rolle 6620   Hoehen [1837, 1922, 1837, 283, 283, 283]
    
           Der Rollbalken WAECHST mit jeder erreichten Seite. Bei sechs Seiten ist
           das laestig; bei achtzig ist er von Anfang an eine Luege — er zeigt ein
           Viertel des Wegs an, den man wirklich vor sich hat.
    
           DER GRUND: `center.clientWidth` ist NULL, wenn die Buehnen gebaut
           werden. `body.append(thumbnails, center, inspector)` kommt erst danach,
           also haengt der Kasten noch nirgends und hat keine Breite. Aus
           `Math.max(200, 0 - 36)` werden 200, und 200 mal 842/595 sind die 283.
    
           Die Rechnung war nie falsch, sie lief nur zu frueh. Deshalb steht sie
           jetzt in `passen()` — dort ist der Kasten im DOM, dort ist die Breite
           bekannt, und dort wird ohnehin bei jedem Fensterwechsel und bei jedem
           Zoom neu gerechnet. Der Platzhalter folgt beidem mit.
    
           NUR DIE UNGEZEICHNETEN. Eine gezeichnete Seite hat ihre Hoehe von
           ihrem Inhalt (`zeichneStand` nimmt `height` ausdruecklich wieder weg);
           ihr eine feste Zahl zu geben, waere die Rueckkehr desselben Fehlers
           von der anderen Seite. */
        const platzhalterSetzen = (breit) => {
            staende.forEach((stand, i) => {
                if (gezeichnet.has(i))
                    return;
                const block = documents[i];
                if (!block)
                    return;
                const { bw, bh } = SheetSpace.masseVon(block);
                if (bw > 0 && bh > 0)
                    stand.style.height = Math.round(breit * (bh / bw)) + 'px';
            });
            inkSync();
        };
        const beiGroesse = () => {
            if (!workspace.isConnected) {
                window.removeEventListener('resize', beiGroesse);
                return;
            }
            folienbandNachziehen();
            hoeheSetzen();
            passen();
            aktivMarkieren();
            nachziehen();
        };
        window.addEventListener('resize', beiGroesse, { passive: true });
        /* WAS IN DIE NAEHE KOMMT, WIRD GEZEICHNET (E299).
           Ein Fenster von einer Bildhoehe nach oben und unten: so ist die
           naechste Seite schon da, wenn man sie erreicht, und die achtzigste
           bleibt ein Platzhalter, solange niemand hinrollt. */
        /* NACH EINEM SPRUNG SCHWEIGT DAS NACHZIEHEN KURZ.
           Beide wollen die Seitenzahl setzen: `springe` sagt „Seite 2", und das
           weiche Rollen laeuft danach noch — bei einer kurzen Rolle ist Seite 1
           dabei weiter in der Fenstermitte, also setzte `nachziehen` sofort auf
           1 zurueck. Auf dem Bildschirm sprang die Zahl hin und her; test202
           fiel darueber („ist Seite 1/2, soll Seite 2/2").
    
           Eine Sperre, keine feste Wartezeit: sie faellt, sobald das Rollen an
           der gewuenschten Stelle steht. */
        let springtZu = -1;
        /* ══ ERST WIEDERHERSTELLEN, DANN BEOBACHTEN (E644, P73) ═══════════════
           `nachziehen` rechnet aus dem Rollstand, welche Seite in der
           Fenstermitte steht — und MERKT sie. Beim frisch geöffneten Dokument
           steht der Rollstand aber noch auf 0, während die zuletzt gelesene
           Seite erst im `requestAnimationFrame` weiter unten angerollt wird.
           Wer in diesem Spalt eine Fenstergrösse meldet, bekommt von
           `nachziehen` die Antwort „Seite 1" — und die ist dann gemerkt. Die
           zuletzt gelesene Seite ist weg.
    
           GEMESSEN, nicht vermutet. Ein Haken auf `Store.setMeta` am
           20. September zeigte genau einen Schreibvorgang und seinen Weg:
    
               seiteMerken ⟵ nachziehen ⟵ beiGroesse
    
           Auf einem Telefon reicht dafür das Drehen, am Rechner das Ziehen am
           Fensterrand oder das Aufklappen der Seitenleiste.
    
           Diese Sperre ist deshalb keine Wartezeit, sondern eine Reihenfolge:
           solange der gemerkte Stand nicht hergestellt ist, hat der Beobachter
           nichts zu sagen. Sie fällt eine Bildauffrischung später — im
           gleichen `rAF`, in dem die Wiederherstellung passiert. */
        let standGesetzt = false;
        /* NUR DIE AKTIVE SEITE ZEIGT WERKZEUGE (Audit F03).
           Gemessen am 3. September: bei DREI PDF-Seiten standen DREI
           Werkzeugleisten im Dokument, jede mit eigenem Zustand — `test386` §2
           fand es daran, dass sich drei Knöpfe gleichzeitig als gedrückt
           meldeten. Bei achtzig Seiten sind es achtzig Leisten.
    
           Der DOM-Teil des Befundes war schon zu: E299 zeichnet nur, was in die
           Nähe kommt. Was blieb, sind die GEZEICHNETEN — und davon stehen immer
           mehrere gleichzeitig im Bild, weil eine Seite eben höher ist als das
           Fenster. Wer dann eine Leiste antippt, weiss nicht, welcher Seite sie
           gehört.
    
           Die Marke steht an der Bühne, nicht an der Leiste: die Leiste gehört
           zum Blatt und wird von `PdfSeite`/`Blatt` gebaut, die vom Dokument
           nichts wissen und nichts wissen sollen (§5 Regel 1). Das CSS liest
           `[data-aktiv]` und blendet die übrigen aus. */
        const aktivMarkieren = () => {
            previousButton.disabled = state.index === 0;
            nextButton.disabled = state.index === documents.length - 1;
            thumbnails.querySelectorAll('[data-document-index]').forEach(button => {
                if (Number(button.dataset.documentIndex) === state.index)
                    button.setAttribute('aria-current', 'page');
                else
                    button.removeAttribute('aria-current');
            });
            staende.forEach((stand, i) => {
                if (i === state.index)
                    stand.setAttribute('data-aktiv', '');
                else
                    stand.removeAttribute('data-aktiv');
            });
            inkSync();
        };
        const nachziehen = () => {
            if (!center.isConnected)
                return;
            /* Vor der Wiederherstellung schweigt der Beobachter (E644, oben). */
            if (!standGesetzt)
                return;
            /* IN DER EINZELSEITE GIBT ES NICHTS NACHZUZIEHEN (E398). Die Seite
               wechselt dort nur ueber `‹ ›` und die Miniaturen, und beide gehen
               durch `springe`, das Zahl, Miniatur und Marke selbst setzt.
      
               UND ES MUSS KURZSCHLIESSEN, statt nur nichts zu finden. Eine
               ausgeblendete Buehne hat `offsetTop` 0 und `offsetHeight` 0 — damit
               faellt sie in JEDES Naehe-Fenster, und die Schleife unten wuerde
               beim ersten Rollen alle achtzig Seiten zeichnen. Genau das, was
               E299 verhindern wollte. `test395 §3` misst es. */
            if (state.einzeln) {
                springtZu = -1;
                zeichneStand(state.index);
                return;
            }
            const oben = center.scrollTop - center.clientHeight;
            const unten = center.scrollTop + 2 * center.clientHeight;
            let sichtbar = state.index;
            staende.forEach((stand, i) => {
                const y = stand.offsetTop, h = stand.offsetHeight;
                if (y + h >= oben && y <= unten)
                    zeichneStand(i);
                /* Und die Seitenzahl folgt dem Blick: was die Mitte des Fensters
                   kreuzt, ist die Seite, auf der man gerade ist. */
                if (y <= center.scrollTop + center.clientHeight / 2 &&
                    y + h > center.scrollTop + center.clientHeight / 2)
                    sichtbar = i;
            });
            if (springtZu >= 0) {
                const ziel = staende[springtZu]?.offsetTop ?? 0;
                if (Math.abs(center.scrollTop - ziel) > 4)
                    return;
                springtZu = -1;
            }
            if (sichtbar !== state.index) {
                state.index = sichtbar;
                seiteMerken(page.id, sichtbar);
                aktivMarkieren(); /* F03 */
                position.textContent = wortEins(page) + ' ' + (sichtbar + 1) + '/' + documents.length;
                thumbnails.querySelectorAll('.document-thumbnail.is-selected')
                    .forEach(el => el.classList.remove('is-selected'));
                thumbnails.querySelector('[data-document-index="' + sichtbar + '"]')
                    ?.classList.add('is-selected');
                /* Der Inspector zeigt, was mit DIESER Stelle verbunden ist — also
                   muss er mitwandern. Nur wenn er offen ist: sonst wäre es Arbeit
                   für einen Kasten, den niemand sieht. */
                if (state.inspectorOpen)
                    renderInspector(inspector, page, jetzt());
            }
        };
        let rollWartet = false;
        center.addEventListener('scroll', () => {
            if (rollWartet)
                return;
            rollWartet = true;
            requestAnimationFrame(() => { rollWartet = false; nachziehen(); });
        }, { passive: true });
        requestAnimationFrame(() => {
            hoeheSetzen();
            passen();
            /* Zur zuletzt gelesenen Seite, ohne Rollbewegung — beim Oeffnen soll
               nichts fahren. */
            if (state.index > 0 && staende[state.index])
                center.scrollTop = staende[state.index].offsetTop;
            /* UND DIE AKTIVE SEITE MARKIEREN (F03), BEVOR `nachziehen` laeuft.
               `nachziehen` markiert nur, wenn sich der Stand AENDERT — beim
               Oeffnen aendert er sich nicht, und dann traegt keine einzige Buehne
               die Marke. Gemessen: der Prueflauf wartete zwanzig Sekunden auf
               eine sichtbare Leiste, die es nicht gab. */
            aktivMarkieren();
            /* AB HIER DARF BEOBACHTET WERDEN — und keine Zeile früher (E644). */
            standGesetzt = true;
            nachziehen();
            thumbnails.querySelector('.document-thumbnail.is-selected')
                ?.scrollIntoView({ block: 'nearest' });
            activateVisibleThumbnails(thumbnails);
        });
        /* Zu einer Seite springen — zeichnen, hinrollen, Stand merken. Kein
           Neuaufbau: ein Sprung, der die ganze Seite neu zeichnet, verlöre
           jeden angefangenen Strich und jede offene Textstelle. */
        /* ══ PRÄSENTIEREN MIT LASERPOINTER (E493, L133) ═══════════════════════
           GoodNotes' Presentation Mode, auf das übersetzt, was ein Browser kann:
           Vollbild, keine Leisten, blättern mit Klick oder Pfeiltaste, und ein
           roter Punkt, der zeigt und wieder vergeht.
    
           DER LASERPOINTER SCHREIBT NICHT. Das ist der Punkt, an dem sich
           „zeigen" und „zeichnen" unterscheiden, und er ist wörtlich zu nehmen:
           der Punkt ist ein `<div>` über dem Papier, er geht durch keine
           Zeichenschicht, er landet in keiner Marke und in keinem Speicher.
           Wer präsentiert, will nichts ändern — und ein Vortragender, der aus
           Versehen in ein fremdes Skript malt, merkt es erst hinterher.
    
           Deshalb liegt über dem Papier eine eigene Fläche, die alle Zeiger
           abfängt (`.document-zeigen-flaeche`). Sie ist zugleich der Grund,
           warum das Blättern per Klick funktioniert: links blättert zurück,
           rechts vor, wie bei jedem Vortragsprogramm.
    
           ESCAPE MUSS IMMER HERAUSFÜHREN. Das Vollbild kann der Browser von
           sich aus beenden (der Nutzer drückt Escape, oder er wechselt den
           Tab); dann darf die Ansicht nicht in einem Zustand hängenbleiben, den
           niemand mehr verlässt. Darum hängt `zeigenAus` auch am
           `fullscreenchange` — der Zustand wird nie gemerkt, sondern immer am
           Browser abgelesen (dieselbe Lehre wie in `schale.ts`). */
        const laserZeigen = (x, y) => {
            if (!zeigenFlaeche)
                return;
            if (!laser) {
                laser = document.createElement('div');
                laser.className = 'document-laser';
                laser.setAttribute('aria-hidden', 'true');
                zeigenFlaeche.appendChild(laser);
            }
            const r = zeigenFlaeche.getBoundingClientRect();
            laser.style.left = (x - r.left) + 'px';
            laser.style.top = (y - r.top) + 'px';
            laser.classList.add('an');
            if (laserWeg)
                clearTimeout(laserWeg);
        };
        const laserLoeschen = () => {
            if (laserWeg)
                clearTimeout(laserWeg);
            /* Er verglimmt, statt zu verschwinden — ein Punkt, der abrupt weg ist,
               sieht aus wie ein Fehler. Die 700 ms sind die Dauer im Stilblatt. */
            laserWeg = setTimeout(() => { laser?.classList.remove('an'); }, 700);
        };
        const zeigenAn = async () => {
            if (zeigenFlaeche)
                return;
            workspace.dataset.documentZeigen = 'an';
            const flaeche = document.createElement('div');
            flaeche.className = 'document-zeigen-flaeche';
            /* Kein `aria-hidden`: der Knopf zum Verlassen liegt darin, und der
               muss für ein Vorleseprogramm da sein. */
            flaeche.setAttribute('role', 'group');
            flaeche.setAttribute('aria-label', 'Präsentation — links zurück, rechts weiter');
            const raus = document.createElement('button');
            raus.type = 'button';
            raus.className = 'document-zeigen-raus';
            raus.dataset.documentAction = 'praesentieren-aus';
            raus.textContent = '✕ Präsentation beenden';
            flaeche.appendChild(raus);
            center.appendChild(flaeche);
            zeigenFlaeche = flaeche;
            /* Wo der Tipp anfing — für die Unterscheidung „gezeigt" / „geblättert"
               unten. Steht VOR den Horchern, damit die Lesereihenfolge stimmt. */
            const tippVon = [0, 0];
            flaeche.addEventListener('pointerdown', event => {
                tippVon[0] = event.clientX;
                tippVon[1] = event.clientY;
                if (event.target?.closest('.document-zeigen-raus'))
                    return;
                event.preventDefault();
                /* `setPointerCapture` WIRFT, wenn es den Zeiger nicht kennt — und
                   ein Wurf hier bricht den Rest des Handlers ab, der Punkt käme gar
                   nicht erst. Gefunden von `test463`: dort sind die Zeiger
                   synthetisch, im Browser kann es dieselbe Lage geben (ein Zeiger,
                   der zwischen `down` und dem Handler verschwindet). Derselbe
                   Griff wie in `marken.ts`. */
                try {
                    flaeche.setPointerCapture?.(event.pointerId);
                }
                catch { /* dann ohne */ }
                laserZeigen(event.clientX, event.clientY);
            });
            flaeche.addEventListener('pointermove', event => {
                if (event.buttons)
                    laserZeigen(event.clientX, event.clientY);
            });
            flaeche.addEventListener('pointerup', event => {
                if (event.target?.closest('.document-zeigen-raus'))
                    return;
                laserLoeschen();
                /* GEZOGEN IST GEZEIGT, GETIPPT IST GEBLÄTTERT. Wer den Zeiger
                   bewegt hat, wollte zeigen; wer nur getippt hat, wollte weiter.
                   Ohne diese Trennung blätterte jedes Zeigen eine Seite um. */
                const r = flaeche.getBoundingClientRect();
                if (Math.hypot(event.clientX - tippVon[0], event.clientY - tippVon[1]) > 8)
                    return;
                /* ══ EIN TIPP AUF EINE ABDECKUNG DECKT SIE AUF (E556) ══════════════
                   E553 hat den Foliensatz auf den Folienvortrag umgelenkt, wo das
                   längst so ist. Zwei Fälle bleiben aber HIER:
        
                     · eine HOCHKANTE Folie — `istFoliensatz` verlangt quer, und das
                       ist richtig so (sonst bekäme jedes Notizheft den Folienvortrag)
                     · eine Abdeckung auf einer PDF-Seite oder im Heft — eine
                       Übungsaufgabe im eigenen Skript ist genau der Fall, für den
                       E266 die Abdeckung gebaut hat
        
                   In beiden schluckt `.document-zeigen-flaeche` den Zeiger
                   (`inset:0`, `z-index:40`) und der Tipp blättert. Gemessen an einem
                   Heft: `elementsFromPoint` gibt
                   [div.document-zeigen-flaeche, rect[abdeck], svg.blatt-marken, …] —
                   der Deckel liegt als ZWEITER darunter und ist nur über den Stapel
                   zu erreichen, nicht über `event.target`.
        
                   DIE ZEIGEFLÄCHE BLEIBT, WIE SIE IST. Sie `pointer-events:none` zu
                   geben wäre der naheliegende Weg und der falsche: dann liefe der
                   Laserpointer nicht mehr, und ein Klick ins Papier fiele an die
                   Zeichenschicht, die im Vortrag gar nicht zeichnen soll.
        
                   AUFDECKEN IST EINSEITIG, wie im Folienvortrag: auf der Leinwand
                   wieder zuzudecken hilft niemandem. */
                const deckel = document.elementsFromPoint(event.clientX, event.clientY)
                    .map(el => el.closest?.('[data-ink-art="abdeck"]'))
                    .find(Boolean);
                if (deckel && !deckel.hasAttribute('data-auf')) {
                    deckel.setAttribute('data-auf', '1');
                    return;
                }
                springe(state.index + (event.clientX - r.left < r.width / 3 ? -1 : 1), false);
            });
            if (typeof App !== 'undefined' && App.vollbild) {
                try {
                    await App.vollbild(true);
                }
                catch { /* dann eben im Fenster */ }
            }
            passen();
            raus.focus();
        };
        const zeigenAus = () => {
            if (!zeigenFlaeche)
                return;
            if (laserWeg)
                clearTimeout(laserWeg);
            laser = null;
            laserWeg = null;
            zeigenFlaeche.remove();
            zeigenFlaeche = null;
            delete workspace.dataset.documentZeigen;
            if (typeof App !== 'undefined' && App.vollbildAn?.()) {
                void App.vollbild(false);
            }
            passen();
        };
        /* Der Browser kann das Vollbild allein beenden — dann darf die Ansicht
           nicht hängenbleiben. Der Zustand wird nie gemerkt, sondern gelesen. */
        const vollbildGewechselt = () => {
            if (!workspace.isConnected) {
                document.removeEventListener('fullscreenchange', vollbildGewechselt);
                return;
            }
            if (zeigenFlaeche && typeof App !== 'undefined' && App.vollbildAn && !App.vollbildAn())
                zeigenAus();
        };
        document.addEventListener('fullscreenchange', vollbildGewechselt);
        const springe = (i, weich = true) => {
            const nr = Math.max(0, Math.min(documents.length - 1, i));
            state.index = nr;
            seiteMerken(page.id, nr);
            zeichneStand(nr);
            aktivMarkieren(); /* F03 */
            /* NUR DIE MITTE ROLLEN, NICHT DAS FENSTER. `scrollIntoView` schiebt
               JEDEN rollbaren Vorfahren — auch das Dokument selbst, und dann
               wandert der ganze Arbeitsraum nach oben aus dem Bild. Gemessen:
               der Raum endete danach 60 px über dem Fensterrand statt 12.
      
               `offsetTop` ist der Abstand zum naechsten positionierten Vorfahren,
               und das ist `.document-center` (`position:relative` in der CSS,
               genau dafuer gesetzt). */
            const stand = staende[nr];
            if (stand) {
                springtZu = nr;
                if (weich && !AppEinstellung.wenigBewegung() && typeof center.scrollTo === 'function') /* E702 */
                    center.scrollTo({ top: stand.offsetTop, behavior: 'smooth' });
                else
                    center.scrollTop = stand.offsetTop;
            }
            position.textContent = wortEins(page) + ' ' + (nr + 1) + '/' + documents.length;
            thumbnails.querySelectorAll('.document-thumbnail.is-selected')
                .forEach(el => el.classList.remove('is-selected'));
            thumbnails.querySelector('[data-document-index="' + nr + '"]')
                ?.classList.add('is-selected');
            /* Der Streifen des Zoom-Fensters folgt der Seite (E470): erst das
               alte Papier zurueck, dann das neue holen. */
            if (state.lupe && lupeKnoten && documents[nr] && lupeKnoten !== lupePapierVon(staende[nr])) {
                lupeUmziehen(false);
                lupeX = 0;
                lupeY = 0;
                lupeUmziehen(true);
                requestAnimationFrame(lupeLegen);
            }
            /* AUCH NACH EINEM SPRUNG (E467): der Inspector traegt jetzt das
               Seitenmenue („Seite 2 von 5", Lesezeichen gedrueckt oder nicht),
               und das Nachziehen schweigt nach einem Sprung, bis die Rolle
               steht — auf dem Bild stand „Seite 1 von 3" ueber der zweiten. */
            if (state.inspectorOpen)
                renderInspector(inspector, page, jetzt());
            passen();
        };
        const rerender = () => App.zeichneSeite();
        const zahlZeigen = () => {
            if (!findFeld.value.trim() || findFeld.value.trim().length < 2) {
                findZahl.textContent = '';
                return;
            }
            findZahl.textContent = !treffer.length ? 'Nichts gefunden'
                : trefferNr < 0 ? treffer.length + (treffer.length === 1 ? ' Treffer' : ' Treffer')
                    : (trefferNr + 1) + '/' + treffer.length;
        };
        const suchen = async (wort) => {
            const q = norm(wort.trim());
            const lauf = ++suchLauf;
            treffer = [];
            trefferNr = -1;
            if (q.length < 2) {
                trefferMalen();
                zahlZeigen();
                return;
            }
            const neu = [];
            for (let i = 0; i < documents.length && neu.length < 500; i++) {
                const block = documents[i];
                if (!block)
                    continue;
                if (block.type === 'pdfseite') {
                    const stuecke = await lageVon(block);
                    if (lauf !== suchLauf)
                        return;
                    if (stuecke.length) {
                        /* Der Text der Seite, Zeichen fuer Zeichen auf sein Stueck
                           abgebildet — so hat ein Treffer, der ueber zwei Stuecke
                           geht („Aufga" + „be"), den Kasten beider. */
                        let text = '';
                        const karte = [];
                        const anfang = [];
                        stuecke.forEach((s, k) => {
                            const teil = String(s.s);
                            anfang[k] = text.length;
                            for (let c = 0; c < teil.length; c++)
                                karte.push(k);
                            text += teil;
                            if (s.eol) {
                                text += '\n';
                                karte.push(-1);
                            }
                        });
                        const t = norm(text);
                        let von = 0;
                        while (neu.length < 500) {
                            von = t.indexOf(q, von);
                            if (von < 0)
                                break;
                            const bis = von + q.length;
                            const ks = new Set();
                            for (let c = von; c < bis; c++) {
                                const k = karte[c];
                                if (k !== undefined && k >= 0)
                                    ks.add(k);
                            }
                            /* NUR DIE GETROFFENEN ZEICHEN, nicht das ganze Stueck: pdf.js
                               liefert oft eine ganze Zeile als EIN Stueck, und ein Treffer
                               ueber der ganzen Zeile sagt nicht, wo das Wort steht.
                               Anteilig nach Zeichen — eine Naeherung (Buchstaben sind
                               verschieden breit), aber eine, die das Wort trifft statt
                               die Zeile; das Bild vom 7. September zeigte die Zeile. */
                            /* ANTEILIG NACH BREITE, NICHT NACH ZEICHEN (E484, L133).
                               Bis hierher war der Kasten anteilig an der ZAHL der
                               Zeichen — „iiii" und „WWWW" galten damit als gleich
                               breit, und ein Treffer daneben sass ein paar Punkte
                               daneben. Gemessen wird jetzt mit `InkGeometry.textWidth`,
                               und zwar als VERHÄLTNIS: die gemessene Breite bis hierhin
                               geteilt durch die gemessene Breite des ganzen Stücks. Ob
                               die Schrift der Messung dieselbe ist wie die der PDF,
                               fällt im Verhältnis weitgehend heraus — was bleibt, ist,
                               dass ein „i" schmaler zählt als ein „W". */
                            const anteil = (text, bis2) => {
                                const ganz = InkGeometry.textWidth(text, 1);
                                if (!(ganz > 0))
                                    return bis2 / Math.max(1, text.length);
                                return Math.max(0, Math.min(1, InkGeometry.textWidth(text.slice(0, bis2), 1) / ganz));
                            };
                            const kaesten = [...ks].map(k => {
                                const st = stuecke[k];
                                if (!st)
                                    return null;
                                const text = String(st.s);
                                const len = Math.max(1, text.length);
                                const a = Math.max(0, von - (anfang[k] ?? 0)), z = Math.min(len, bis - (anfang[k] ?? 0));
                                const p1 = anteil(text, a), p2 = anteil(text, z);
                                return { x: st.x + st.w * p1, y: st.y, w: Math.max(2, st.w * (p2 - p1)), h: st.h };
                            }).filter((k) => !!k);
                            neu.push({ index: i, rect: kaesten.length ? vereint(kaesten) : null });
                            von = bis;
                        }
                        continue;
                    }
                    if (norm(block.suchtext).includes(q))
                        neu.push({ index: i, rect: null });
                }
                else {
                    let da = false;
                    for (const m of (Array.isArray(block.marken) ? block.marken : [])) {
                        if ((m.art === 'text' || m.art === 'zettel') && norm(m.text).includes(q)) {
                            const b = InkGeometry.bounds(m);
                            neu.push({ index: i, rect: { x: b.x, y: b.y, w: b.width, h: b.height } });
                            da = true;
                        }
                    }
                    if (!da && Store.childrenOf(block.id).some((k) => norm(k.text).includes(q)))
                        neu.push({ index: i, rect: null });
                }
            }
            if (lauf !== suchLauf)
                return;
            treffer = neu;
            trefferNr = -1;
            trefferMalen();
            zahlZeigen();
            fremdZeigen(wort);
        };
        /* ══ DIE FREMDEN TREFFER ANZEIGEN (E487) ══════════════════════════════
           Der Name steht vorne, die Seitenzahl daneben, der Textausschnitt
           darunter — und der Ausschnitt wird ESCAPT, weil er Nutzertext ist
           (§19). Ein PDF mit `<img src=x onerror=…>` im Text ist kein Scherz;
           genau daran hing E112. */
        const fremdZeigen = (wort) => {
            const q = String(wort || '').trim();
            if (!findAlle || q.length < 2) {
                findListe.hidden = true;
                findListe.textContent = '';
                return;
            }
            const { liste, mehr } = fremdeTreffer(q, page.id);
            findListe.textContent = '';
            if (!liste.length) {
                findListe.hidden = false;
                const leer = document.createElement('p');
                leer.className = 'document-find-leer';
                leer.textContent = 'In anderen Dokumenten: nichts gefunden.';
                findListe.appendChild(leer);
                return;
            }
            const kopf = document.createElement('p');
            kopf.className = 'document-find-kopf';
            kopf.textContent = liste.length + (liste.length === 1 ? ' Seite' : ' Seiten')
                + ' in anderen Dokumenten' + (mehr ? ' (es sind mehr — Begriff eingrenzen)' : '');
            findListe.appendChild(kopf);
            for (const t of liste) {
                const knopf = document.createElement('button');
                knopf.type = 'button';
                knopf.className = 'document-find-fund';
                knopf.dataset.documentFund = t.seiteId;
                knopf.dataset.documentFundBlock = t.blockId;
                knopf.title = t.name + ' — Seite ' + t.nr;
                const zeile = document.createElement('span');
                zeile.className = 'document-find-fund-zeile';
                zeile.textContent = t.icon + ' ' + t.name + ' · Seite ' + t.nr;
                const auszug = document.createElement('span');
                auszug.className = 'document-find-fund-text';
                auszug.textContent = t.auszug;
                knopf.append(zeile, auszug);
                findListe.appendChild(knopf);
            }
            findListe.hidden = false;
        };
        /** Zu einem fremden Treffer springen: Seite wählen, öffnen, dort weitersuchen. */
        const zumFremden = (seiteId, blockId) => {
            const ziel = Store.getBlock(seiteId);
            if (!ziel) {
                UI.toast('Diese Seite gibt es nicht mehr.');
                return;
            }
            select(ziel, blockId);
            sprungWunsch = { seiteId, wort: findFeld.value };
            App.oeffne(seiteId);
        };
        const zumTreffer = (n) => {
            if (!treffer.length)
                return;
            trefferNr = ((n % treffer.length) + treffer.length) % treffer.length;
            const t = treffer[trefferNr];
            springe(t.index, false);
            trefferMalen();
            zahlZeigen();
            const el = staende[t.index]?.querySelector('.document-treffer.ist-aktiv');
            if (el && !el.classList.contains('ist-seite')) {
                const r = el.getBoundingClientRect(), c = center.getBoundingClientRect();
                center.scrollTop += (r.top - c.top) - c.height / 3;
            }
        };
        let suchTimer = null;
        findFeld.addEventListener('input', () => {
            if (suchTimer)
                clearTimeout(suchTimer);
            suchTimer = setTimeout(() => { void suchen(findFeld.value); }, 200);
        });
        findFeld.addEventListener('keydown', event => {
            if (event.key !== 'Enter')
                return;
            event.preventDefault();
            zumTreffer(trefferNr + (event.shiftKey ? -1 : 1));
        });
        const findbarSetzen = (an) => {
            findbar.hidden = !an;
            findButton.setAttribute('aria-expanded', String(an));
            findButton.classList.toggle('an', an);
            if (an) {
                /* AM TELEFON LAG DIE SUCHLEISTE UNTER DER ANSICHTSKLAPPE (E473,
                   Fund der Prüfung) — man tippte blind. Die Klappe geht zu, sobald
                   gesucht wird, und zwar hier, damit auch Strg F davon lebt. */
                if (workspace.dataset.documentView === 'open') {
                    workspace.dataset.documentView = 'closed';
                    viewButton.setAttribute('aria-expanded', 'false');
                }
                findFeld.focus();
                if (findFeld.value.trim())
                    void suchen(findFeld.value);
            }
            else {
                suchLauf++;
                treffer = [];
                trefferNr = -1;
                trefferMalen();
                findZahl.textContent = '';
                findListe.hidden = true;
                findListe.textContent = '';
            }
        };
        /* ══ SEITEN WIE GOODNOTES (E467) ═════════════════════════════════════════
           Alles hier arbeitet am `content` der Eltern — der Reihenfolge, die
           auch der gewoehnliche Editor zeigt — und mit den Griffen, die der Kern
           hat: `addBlock` mit Stelle, `baum`/`baumEinfuegen` (frische
           Kennungen), `trashBlock` (Papierkorb, nie endgueltig). Kein zweiter
           Katalog fuer Seiten (§8), kein Loeschen ohne Rueckweg (§9). */
        const darfSeiten = () => !page.gesperrt && (typeof Konten === 'undefined' || Konten.darf('bearbeiten', page.id));
        /** Die Stelle des Blocks im `content` seiner Eltern. */
        const stelleVon = (block) => {
            const eltern = block?.parentId ? Store.getBlock(block.parentId) : null;
            if (!eltern || !Array.isArray(eltern.content))
                return null;
            const index = eltern.content.indexOf(block.id);
            return index < 0 ? null : { eltern, index };
        };
        /** Nach einer Aenderung: Stand auf die Seite mit dieser Kennung setzen und neu bauen. */
        const neuMit = (blockId) => {
            const liste = documentsIn(page);
            const i = blockId ? liste.findIndex(block => block.id === blockId) : -1;
            state.index = Math.max(0, Math.min(liste.length - 1, i >= 0 ? i : state.index));
            seiteMerken(page.id, state.index);
            rerender();
        };
        /* ── WELCHE SEITE IST GEMEINT? (E480) ────────────────────────────────
           Bis hierher galt jeder Seitengriff der Seite, die man ANSIEHT — der
           Inspector kennt nur eine. Das Menü an der Miniatur meint aber die
           Seite, an der es hängt, und die ist meist eine andere. Darum nehmen
           alle Griffe jetzt entgegen, WEN sie meinen; ohne Angabe bleibt es
           die angesehene, und der Inspector ändert sich um kein Zeichen. */
        const seiteEinfuegen = (wen) => {
            const block = wen || jetzt();
            const stelle = stelleVon(block);
            if (!stelle) {
                UI.toast('Diese Seite hat keinen Platz, an dem sich etwas einfügen liesse.');
                return;
            }
            /* Das Papier aus der Auswahl im Inspector — dieselbe Vorgabe wie fuer
               neue Hefte (E264), darum derselbe Merker. */
            const papier = String(Store.getMeta('heft:papier', 'blanko'));
            const neu = Store.addBlock(stelle.eltern.id, 'blatt', {
                text: '', papier, blattBreite: SheetSpace.A4_BREITE, blattHoehe: SheetSpace.A4_HOEHE,
                raumVersion: SheetSpace.RAUM_VERSION
            }, stelle.index + 1);
            /* Eine Zeile muss da sein (E118) — sonst ist das Papier nur Malgrund. */
            Store.addBlock(neu.id, 'text', { text: '' });
            UI.toast('Leere Seite eingefügt');
            neuMit(neu.id);
        };
        const seiteDuplizieren = (wen) => {
            const block = wen || jetzt();
            const stelle = stelleVon(block);
            if (!stelle) {
                UI.toast('Diese Seite lässt sich hier nicht verdoppeln.');
                return;
            }
            const daten = Store.baum(block.id);
            if (!daten)
                return;
            /* Das Lesezeichen bleibt am Original: zwei Zeichen fuer dieselbe
               Stelle waeren eines zu viel. */
            delete daten.lesezeichen;
            const neu = Store.baumEinfuegen(daten, stelle.eltern.id, stelle.index + 1);
            if (!neu)
                return;
            /* DAS SEITENBILD WIRD KOPIERT, NICHT GETEILT (E467). `purgeBlock` nimmt
               die Anhaenge seines Blocks mit — teilten sich Original und Kopie
               eine `bildDateiId`, verloere die Kopie ihr Bild, sobald das Original
               aus dem Papierkorb faellt. Bis die Kopie da ist, zeigt die neue
               Seite das alte Bild; danach ihr eigenes. */
            seitenbildKopieren(block, neu.id);
            UI.toast(wortEins(page) + ' verdoppelt');
            neuMit(neu.id);
        };
        /**
         * DAS SEITENBILD WIRD KOPIERT, NICHT GETEILT (E467, hierher gehoben mit
         * E496).
         *
         * `purgeBlock` nimmt die Anhänge SEINES Blocks mit — teilten sich
         * Original und Kopie eine `bildDateiId`, verlöre die Kopie ihr Bild,
         * sobald das Original aus dem Papierkorb fällt. Bis die Kopie da ist,
         * zeigt die neue Seite das alte Bild; danach ihr eigenes.
         *
         * Es steht seit E496 an EINER Stelle, weil es zwei Aufrufer hat:
         * Duplizieren und Kopieren in ein anderes Dokument. Zwei Abschriften
         * derselben Regel laufen auseinander, und die zweite hätte den ganzen
         * Absatz oben nicht mitbekommen (§8).
         */
        const seitenbildKopieren = (block, zielId) => {
            if (block.type === 'pdfseite' && block.bildDateiId && typeof Dateien !== 'undefined') {
                const alt = String(block.bildDateiId);
                void (async () => {
                    try {
                        const [blob, satz] = await Promise.all([Dateien.alsBlob(alt), Store.dateiHolen(alt)]);
                        if (!blob)
                            return;
                        /* ABGELEITET IST NUR, WAS SICH NEU RECHNEN LAESST (E471, Fund der
                           Prüfung). Das Seitenbild einer PDF-Seite kommt aus der Quelle
                           zurueck und darf darum aus der Sicherung bleiben. Eine
                           BILD-Seite (E469) hat keine Quelle: ihr Bild IST die
                           Nutzerdatei, und mit `abgeleitet: true` waere die Kopie nach
                           dem Einspielen einer `.redion` leer gewesen (§11, §14). */
                        const kopie = await Dateien.ablegen(new File([blob], String(satz?.name || 'seite.webp'), { type: blob.type || 'image/webp' }), 
                        /* DAS MERKMAL ERBT VON DER QUELLDATEI (E473): eine gerasterte
                           PDF-Seite bleibt abgeleitet, eine Bild-Seite bleibt
                           Nutzerdatei. `herkunft` ist nur der Rückfall, wenn der
                           Dateisatz fehlt. */
                        { blockId: zielId, abgeleitet: satz ? !!satz.abgeleitet : block.herkunft !== 'bild' });
                        Store.updateBlock(zielId, { bildDateiId: kopie.id });
                    }
                    catch (e) {
                        UI.toast('Das Seitenbild liess sich nicht mitkopieren: ' + (e instanceof Error ? e.message : String(e)));
                    }
                })();
            }
        };
        const ZIELE_HOECHSTENS = 40;
        const andereDokumente = (ausser) => {
            const raus = [];
            const gesehen = new Set();
            let bloecke = 0;
            for (const block of Object.values(Store.cache.blocks)) {
                if (raus.length >= ZIELE_HOECHSTENS)
                    break;
                if (++bloecke > FREMD_BLOECKE)
                    break;
                if (!block || block.alive === false)
                    continue;
                if (block.type !== 'pdfseite' && block.type !== 'blatt')
                    continue;
                const seite = seiteZu(block);
                if (!seite || !seite.alive || seite.id === ausser || gesehen.has(seite.id))
                    continue;
                gesehen.add(seite.id);
                /* `bearbeiten`, NICHT `edit` — und das ist kein Schönheitsfehler.
                   `edit` ist der Name einer ROLLE (§26); die Frage an das Tor heisst
                   `bearbeiten`, wie überall sonst in dieser Datei (`darfSeiten`,
                   `canAnnotate`). Mit `edit` sagte das Tor auf JEDER Seite nein, und
                   die Liste der Ziele war immer leer — gefunden von `test466`, nicht
                   vom Lesen. Genau der Fehler aus E21: eine Schnittstelle aus dem
                   Gedächtnis geschrieben statt nachgeschlagen.
                   Und eine gesperrte Seite ist auch kein Ziel — dieselbe zweite
                   Bedingung, die `darfSeiten` für die eigene Seite stellt. */
                if (seite.gesperrt)
                    continue;
                if (typeof Konten !== 'undefined' && Konten.darf && !Konten.darf('bearbeiten', seite.id))
                    continue;
                raus.push({ id: seite.id, name: String(seite.text || 'Ohne Titel'),
                    icon: String(seite.icon || '📄'), seiten: documentsIn(seite).length });
            }
            raus.sort((a, b) => a.name.localeCompare(b.name));
            return raus;
        };
        /** Wohin die Seite im Zieldokument kommt: zu den Eltern seiner letzten Seite. */
        const zielEltern = (zielSeite) => {
            const seiten = documentsIn(zielSeite);
            const letzte = seiten[seiten.length - 1];
            const eltern = letzte ? Store.getBlock(letzte.parentId) : null;
            return eltern || zielSeite;
        };
        /**
         * Verschieben oder kopieren — nach der Frage, die der Nutzer beantwortet.
         *
         * DIE REIHENFOLGE BEIM VERSCHIEBEN IST DIE GANZE SICHERHEIT: erst in
         * die neuen Eltern legen, dann `parentId` umhängen, ZULETZT aus den
         * alten nehmen. Bräche irgendetwas dazwischen ab, stünde die Seite in
         * beiden Dokumenten — sichtbar und zu berichtigen. In der anderen
         * Reihenfolge stünde sie in keinem, und niemand wüsste, wo sie war
         * (§51: lieber langsamer als jemals Nutzerdaten verlieren).
         */
        const seiteInsDokument = async (wen) => {
            const block = wen || jetzt();
            if (!block)
                return;
            if (typeof Dialog === 'undefined') {
                UI.toast('Der Dialog ist gerade nicht da.');
                return;
            }
            const ziele = andereDokumente(page.id);
            if (!ziele.length) {
                UI.toast('Es gibt kein anderes Dokument, in das die Seite passen würde.');
                return;
            }
            const wohin = await Dialog.wahl({
                titel: 'In welches Dokument?',
                text: 'Die Seite kommt ans Ende des gewählten Dokuments — mit allem, was darauf steht.',
                knoepfe: ziele.map(z => ({ id: 'ziel:' + z.id, text: z.icon + ' ' + z.name,
                    hinweis: z.seiten === 1 ? 'eine Seite' : z.seiten + ' Seiten' }))
            });
            if (!wohin.startsWith('ziel:'))
                return;
            const zielSeite = Store.getBlock(wohin.slice(5));
            if (!zielSeite || zielSeite.alive === false) {
                UI.toast('Dieses Dokument gibt es nicht mehr.');
                return;
            }
            const liste = documentsIn(page);
            const letzte = liste.length < 2;
            const wie = await Dialog.wahl({
                titel: 'Kopieren oder verschieben?',
                text: letzte
                    ? 'Dies ist die einzige Seite dieses Dokuments — verschieben würde es leeren, darum geht hier nur kopieren.'
                    : 'Beim Verschieben ist die Seite hier weg; beim Kopieren bleibt sie stehen.',
                knoepfe: [
                    { id: 'kopieren', text: '⧉ Kopieren', hinweis: 'Die Seite steht danach in beiden Dokumenten' },
                    ...(letzte ? [] : [{ id: 'verschieben', text: '↗ Verschieben',
                            hinweis: 'Die Seite verlässt dieses Dokument' }])
                ]
            });
            if (wie !== 'kopieren' && wie !== 'verschieben')
                return;
            const ziel = zielEltern(zielSeite);
            if (wie === 'kopieren') {
                const daten = Store.baum(block.id);
                if (!daten) {
                    UI.toast('Diese Seite liess sich nicht lesen.');
                    return;
                }
                /* Das Lesezeichen bleibt am Original — dieselbe Regel wie beim
                   Verdoppeln: zwei Zeichen für dieselbe Stelle wären eines zu viel. */
                delete daten.lesezeichen;
                const neu = Store.baumEinfuegen(daten, ziel.id, -1);
                if (!neu) {
                    UI.toast('Die Kopie liess sich nicht anlegen.');
                    return;
                }
                seitenbildKopieren(block, neu.id);
                UI.toast(wortEins(page) + ' nach „' + String(zielSeite.text || 'Ohne Titel') + '" kopiert');
                return;
            }
            const stelle = stelleVon(block);
            if (!stelle) {
                UI.toast('Diese Seite hat keinen Platz, aus dem sie sich lösen liesse.');
                return;
            }
            Store.updateBlock(ziel.id, { content: [...(ziel.content || []), block.id] });
            Store.updateBlock(block.id, { parentId: ziel.id, parentTable: 'block' });
            Store.updateBlock(stelle.eltern.id, { content: (stelle.eltern.content || []).filter((id) => id !== block.id) });
            UI.toast(wortEins(page) + ' nach „' + String(zielSeite.text || 'Ohne Titel') + '" verschoben');
            const rest = documentsIn(page);
            neuMit(rest[Math.min(rest.length - 1, Math.max(0, stelle.index))]?.id || null);
        };
        /* ══ EIN MEHRSEITIGES BLATT IN SEITEN ZERLEGEN (E499) ══════════════════
           L133: „Mehrseitige Notizhefte als EIN Block — ein `blatt` wächst in
           die Höhe (E118); Seitengriffe gelten ihm als Ganzem. Ein Heft mit
           drei Blattseiten lässt sich nicht seitenweise drehen oder löschen."
    
           In GoodNotes ist jede Seite eine Seite. Redions mehrseitiges Blatt
           ist eine eigene Form, und sie ist nicht falsch — nur die Seitengriffe
           können mit ihr nichts anfangen. Also gibt es einen Griff, der sie in
           GoodNotes-Form bringt: aus einem Blatt von drei A4 werden drei
           Blätter von je einem.
    
           WOHIN EINE MARKE KOMMT: auf die Seite, in der ihre MITTE liegt. Sie
           bleibt dabei GANZ — kein Strich wird geschnitten (§9: nichts
           verlieren). Eine Marke, die über eine Seitengrenze läuft, ragt danach
           über den Rand ihrer Seite hinaus, und weil `.blatt-papier` schneidet,
           ist der Überstand nicht mehr zu SEHEN. Er ist nicht weg — er kommt
           zurück, sobald das Blatt wieder höher wird —, aber ein Nutzer sieht
           das nicht. Darum wird es GESAGT, mit Zahl, bevor irgendetwas
           geschieht (§35). */
        const zerlegbar = (block) => {
            if (!block || block.type !== 'blatt')
                return 0;
            return SheetSpace.seiten(Number(block.blattHoehe) || SheetSpace.A4_HOEHE);
        };
        const seiteZerlegen = async (wen) => {
            const block = wen || jetzt();
            const anzahl = zerlegbar(block);
            if (anzahl < 2) {
                UI.toast(block?.type === 'blatt'
                    ? 'Dieses Blatt ist schon eine einzelne ' + wortEins(page) + '.'
                    : 'Nur ein mehrseitiges Blatt lässt sich in ' + wortViele(page) + ' zerlegen.');
                return;
            }
            const stelle = stelleVon(block);
            if (!stelle) {
                UI.toast('Dieses Blatt hat keinen Platz, an dem die Seiten stehen könnten.');
                return;
            }
            if (typeof Dialog === 'undefined')
                return;
            const A4 = SheetSpace.A4_HOEHE;
            const marken = Array.isArray(block.marken) ? block.marken : [];
            const faecher = Array.from({ length: anzahl }, () => []);
            let ueberGrenze = 0;
            for (const roh of marken) {
                const kopie = JSON.parse(JSON.stringify(roh));
                const kasten = InkGeometry.bounds(kopie);
                const mitte = kasten.y + kasten.height / 2;
                const nr = Math.max(0, Math.min(anzahl - 1, Math.floor(mitte / A4)));
                /* „Über die Grenze" heisst: Oberkante und Unterkante liegen in
                   verschiedenen Seiten. Die Unterkante wird um einen Hauch
                   hereingeholt, damit eine Marke, die genau auf der Grenze endet,
                   nicht als Grenzgängerin zählt. */
                const oben = Math.floor(kasten.y / A4);
                const unten = Math.floor(Math.max(kasten.y, kasten.y + kasten.height - 0.01) / A4);
                if (oben !== unten)
                    ueberGrenze++;
                faecher[nr].push(InkGeometry.move(kopie, 0, -nr * A4));
            }
            const wahl = await Dialog.wahl({
                titel: 'Dieses Blatt in ' + anzahl + ' Seiten zerlegen?',
                text: 'Aus einem Blatt von ' + anzahl + ' Seiten werden ' + anzahl
                    + ' einzelne Blätter. Danach greifen Drehen, Löschen und Verschieben je Seite.'
                    + (ueberGrenze
                        ? ' ACHTUNG: ' + ueberGrenze + (ueberGrenze === 1 ? ' Marke läuft' : ' Marken laufen')
                            + ' über eine Seitengrenze. Sie kommen ganz auf EINE Seite und ragen dort über den Rand'
                            + ' hinaus — sichtbar ist der Überstand dann nicht mehr, verloren ist er nicht.'
                        : ' Keine Marke läuft über eine Seitengrenze.'),
                knoepfe: [
                    { id: 'ja', text: 'In ' + anzahl + ' Seiten zerlegen',
                        hinweis: ueberGrenze ? 'Mit dem Überstand, wie oben beschrieben' : 'Nichts geht dabei verloren' },
                    { id: 'nein', text: 'Abbrechen', hinweis: 'Das Blatt bleibt, wie es ist' }
                ]
            });
            if (wahl !== 'ja')
                return;
            /* DIE REIHENFOLGE, WIEDER: erst die neuen Blätter MIT ihren Marken
               anlegen, dann das Original kürzen. Bräche etwas dazwischen ab,
               stünden Marken doppelt da — sichtbar. Andersherum wären die Seiten
               zwei bis n weg, bevor es sie gibt. */
            for (let i = anzahl - 1; i >= 1; i--) {
                const neu = Store.addBlock(stelle.eltern.id, 'blatt', {
                    text: '', papier: block.papier || 'blanko',
                    blattBreite: Number(block.blattBreite) || SheetSpace.A4_BREITE,
                    blattHoehe: A4, raumVersion: SheetSpace.RAUM_VERSION,
                    marken: faecher[i]
                }, stelle.index + 1);
                /* Eine Zeile muss da sein (E118) — sonst ist das Papier nur Malgrund. */
                Store.addBlock(neu.id, 'text', { text: '' });
            }
            Store.updateBlock(block.id, { blattHoehe: A4, marken: faecher[0] });
            UI.toast('In ' + anzahl + ' Seiten zerlegt'
                + (ueberGrenze ? ' — ' + ueberGrenze + ' mit Überstand' : ''));
            neuMit(block.id);
        };
        const seiteLoeschen = (wen) => {
            const block = wen || jetzt();
            const liste = documentsIn(page);
            if (liste.length < 2) {
                UI.toast('Die letzte Seite bleibt — lösche lieber das Dokument.');
                return;
            }
            const i = liste.findIndex(x => x.id === block.id);
            Store.trashBlock(block.id);
            UI.toast(wortEins(page) + ' im Papierkorb — von dort kommt sie zurück');
            const naechste = liste[Math.min(liste.length - 1, i + 1 < liste.length ? i + 1 : i - 1)];
            neuMit(naechste && naechste.id !== block.id ? naechste.id : null);
        };
        const seiteSchieben = (richtung, wen) => {
            const block = wen || jetzt();
            const stelle = stelleVon(block);
            if (!stelle)
                return;
            const inhalt = [...stelle.eltern.content];
            /* Der Nachbar ist die naechste SEITE in denselben Eltern — ein
               Textblock dazwischen zaehlt nicht als Seite, wird aber uebersprungen. */
            let ziel = stelle.index + richtung;
            while (ziel >= 0 && ziel < inhalt.length) {
                const kandidat = Store.getBlock(inhalt[ziel]);
                if (kandidat && kandidat.alive !== false && (kandidat.type === 'pdfseite' || kandidat.type === 'blatt'))
                    break;
                ziel += richtung;
            }
            if (ziel < 0 || ziel >= inhalt.length) {
                UI.toast(richtung < 0 ? 'Schon die erste Seite.' : 'Schon die letzte Seite.');
                return;
            }
            inhalt.splice(stelle.index, 1);
            inhalt.splice(ziel, 0, block.id);
            Store.updateBlock(stelle.eltern.id, { content: inhalt });
            neuMit(block.id);
        };
        /**
         * EINE SEITE AN EINE BELIEBIGE STELLE (E480) — was das Ziehen in der
         * Miniaturenleiste braucht. `seiteSchieben` tauscht mit dem Nachbarn;
         * hier wird eingefügt, wo losgelassen wurde.
         *
         * `zielIndex` zählt in der SEITENLISTE (0 = ganz vorn, n = ganz
         * hinten), nicht in der Inhaltsliste der Eltern — dazwischen können
         * Textblöcke stehen, die keine Seiten sind.
         *
         * AUCH ÜBER SPALTEN HINWEG (seit E498). Liegen die Seiten eines
         * Dokuments in mehreren Spalten, wandert der Block in die Eltern der
         * Seite, vor die er fällt — mit derselben sicheren Reihenfolge wie in
         * E496. Bis dahin sagte diese Stelle nein, und das war ehrlich,
         * solange es keinen Weg gab, einen Block umzuhängen.
         */
        const seiteAnStelle = (block, zielIndex) => {
            const liste = documentsIn(page);
            const von = liste.findIndex(b => b.id === block.id);
            if (von < 0 || zielIndex === von || zielIndex === von + 1)
                return false;
            const stelle = stelleVon(block);
            if (!stelle)
                return false;
            /* WOHIN: vor die Seite, die an der Zielstelle steht — und wenn dort
               keine mehr steht, hinter die letzte. Die ELTERN ergeben sich
               daraus; über Spalten hinweg sind es andere als die eigenen. */
            const nach = liste[zielIndex] || null;
            const nachbar = nach || liste[liste.length - 1] || block;
            const zielEltern = Store.getBlock(String(nachbar.parentId || '')) || stelle.eltern;
            if (zielEltern.id === stelle.eltern.id) {
                const inhalt = [...(stelle.eltern.content || [])];
                const raus = inhalt.indexOf(block.id);
                if (raus < 0)
                    return false;
                inhalt.splice(raus, 1);
                const ziel = nach ? inhalt.indexOf(nach.id) : -1;
                inhalt.splice(ziel < 0 ? inhalt.length : ziel, 0, block.id);
                Store.updateBlock(stelle.eltern.id, { content: inhalt });
            }
            else {
                /* ÜBER SPALTEN HINWEG (E498). Bis hierher sagte diese Stelle nein:
                   „die Seiten liegen in mehreren Spalten — ziehen geht dort nicht".
                   Das war ehrlich, solange es keinen Weg gab, einen Block
                   umzuhängen; seit E496 gibt es ihn, und es ist derselbe.
        
                   DIESELBE REIHENFOLGE WIE DORT, und aus demselben Grund: erst in
                   die neuen Eltern legen, dann `parentId` umhängen, ZULETZT aus den
                   alten nehmen. Bräche etwas dazwischen ab, stünde die Seite in
                   beiden Spalten — sichtbar. In der anderen Reihenfolge in keiner. */
                const hin = [...(zielEltern.content || [])];
                const ziel = nach ? hin.indexOf(nach.id) : -1;
                hin.splice(ziel < 0 ? hin.length : ziel, 0, block.id);
                Store.updateBlock(zielEltern.id, { content: hin });
                Store.updateBlock(block.id, { parentId: zielEltern.id, parentTable: 'block' });
                Store.updateBlock(stelle.eltern.id, { content: (stelle.eltern.content || []).filter((id) => id !== block.id) });
            }
            UI.toast(wortEins(page) + ' verschoben');
            neuMit(block.id);
            return true;
        };
        /* ══ DAS MENÜ AN DER MINIATUR (E480) ═══════════════════════════════════
           Ein kleines Fenster neben der Zeile, mit denselben Griffen wie im
           Inspector — nur mit der Seite dahinter, an der es hängt. Kein
           zweiter Katalog (§8): die Einträge tragen dieselben
           `data-document-action`, und der eine Klickgriff weiter unten führt
           sie aus; neu ist nur `data-document-ziel`, das sagt, WELCHE Seite.
    
           Es geht zu bei Escape (E302), beim Tippen daneben, beim Rollen der
           Leiste und bei jedem Neuaufbau. */
        let menueOffen = null;
        const menueSchliessen = () => {
            if (!menueOffen)
                return;
            const knopf = menueOffen.dataset.fuer
                ? thumbnails.querySelector('[data-document-thumb-menue="' + menueOffen.dataset.fuer + '"]')
                : null;
            knopf?.setAttribute('aria-expanded', 'false');
            menueOffen.remove();
            menueOffen = null;
        };
        const menueOeffnen = (knopf, index) => {
            const schonOffen = menueOffen?.dataset.fuer === String(index);
            menueSchliessen();
            if (schonOffen)
                return;
            const block = documents[index];
            if (!block)
                return;
            const kasten = document.createElement('div');
            kasten.className = 'document-thumb-menue';
            kasten.dataset.fuer = String(index);
            kasten.setAttribute('role', 'menu');
            kasten.setAttribute('aria-label', sourceLabel(block) + ': Menü');
            const eintrag = (tat, zeichen, text) => {
                const k = document.createElement('button');
                k.type = 'button';
                k.setAttribute('role', 'menuitem');
                k.dataset.documentAction = tat;
                k.dataset.documentZiel = String(index);
                k.innerHTML = '';
                const z = document.createElement('span');
                z.className = 'document-thumb-menue-zeichen';
                z.setAttribute('aria-hidden', 'true');
                z.textContent = zeichen;
                const t = document.createElement('span');
                t.textContent = text;
                k.append(z, t);
                kasten.appendChild(k);
            };
            eintrag('page-add', '＋', wortEins(page) + ' danach');
            eintrag('page-add-camera', '📷', 'Foto aufnehmen');
            eintrag('page-duplicate', '⧉', 'Duplizieren');
            eintrag('page-rotate', '⟳', 'Drehen');
            eintrag('page-up', '↑', 'Nach oben');
            eintrag('page-down', '↓', 'Nach unten');
            eintrag('page-bookmark', '🔖', block.lesezeichen ? 'Lesezeichen weg' : 'Lesezeichen');
            eintrag('page-export-image', '⬇', 'Als Bild sichern');
            eintrag('page-to-doc', '↗', 'In anderes Dokument');
            if (zerlegbar(block) > 1)
                eintrag('page-split', '⌸', 'In Seiten zerlegen');
            eintrag('page-delete', '🗑', 'Löschen');
            thumbnails.appendChild(kasten);
            /* An seinen Knopf legen — und zurückrücken, wo die Leiste zu Ende ist.
               BEIDE Richtungen, denn die Leiste steht am Rechner senkrecht und am
               Telefon waagerecht (E397): eine feste Seite wäre dort immer die
               falsche. `position:absolute` misst im gerollten Kasten, also
               gehört der Rollstand dazu — sonst wandert das Menü beim Rollen. */
            const r = knopf.getBoundingClientRect(), s = thumbnails.getBoundingClientRect();
            const hoch = kasten.offsetHeight || 300, breit = kasten.offsetWidth || 200;
            let oben = r.top - s.top;
            if (oben + hoch > s.height - 8)
                oben = s.height - hoch - 8;
            let links = r.left - s.left;
            if (links + breit > s.width - 8)
                links = s.width - breit - 8;
            kasten.style.top = (Math.max(8, oben) + thumbnails.scrollTop) + 'px';
            kasten.style.left = (Math.max(6, links) + thumbnails.scrollLeft) + 'px';
            knopf.setAttribute('aria-expanded', 'true');
            menueOffen = kasten;
            kasten.querySelector('button')?.focus();
        };
        /* ══ SEITEN ZIEHEN (E480) ══════════════════════════════════════════════
           GoodNotes ordnet Seiten durch Ziehen in der Übersicht. Hier dasselbe,
           mit Zeigerereignissen statt HTML-Drag: nur so trägt es den Finger
           (§37), und nur so lässt es sich prüfen.
    
           WANN BEGINNT DAS ZIEHEN? Nicht bei der ersten Bewegung — die Leiste
           muss sich rollen lassen, und ein Tipp muss ein Tipp bleiben. Also:
    
             · Maus   — nach acht Pixeln Bewegung. Wer mit der Maus zieht,
                        will ziehen; gerollt wird dort mit dem Rad.
             · Finger und Stift — erst nach 350 ms Halten auf der Stelle, wie
                        in GoodNotes. Vorher gehört die Bewegung dem Rollen.
    
           Losgelassen wird VOR der Seite, deren Mitte unter dem Zeiger liegt. */
        let zug = null;
        let marke = null;
        const markeWeg = () => { marke?.remove(); marke = null; };
        const zugEnde = () => {
            if (zug) {
                window.clearTimeout(zug.halten);
                zug.zeile.classList.remove('zieht');
            }
            zug = null;
            markeWeg();
            thumbnails.classList.remove('zieht-gerade');
        };
        /** Vor welcher Seite würde jetzt eingefügt? */
        const zielVon = (y) => {
            const zeilen = [...thumbnails.querySelectorAll('.document-thumb-zeile')];
            for (let i = 0; i < zeilen.length; i++) {
                const r = zeilen[i].getBoundingClientRect();
                if (y < r.top + r.height / 2)
                    return i;
            }
            return zeilen.length;
        };
        const markeLegen = (ziel) => {
            if (!marke) {
                marke = document.createElement('div');
                marke.className = 'document-thumb-marke';
                marke.setAttribute('aria-hidden', 'true');
                thumbnails.appendChild(marke);
            }
            const zeilen = [...thumbnails.querySelectorAll('.document-thumb-zeile')];
            const s = thumbnails.getBoundingClientRect();
            const vor = zeilen[ziel];
            const y = vor ? vor.getBoundingClientRect().top - s.top
                : (zeilen[zeilen.length - 1]?.getBoundingClientRect().bottom ?? s.top) - s.top;
            marke.style.top = (y + thumbnails.scrollTop) + 'px';
        };
        thumbnails.addEventListener('pointerdown', (event) => {
            const ziel = event.target;
            if (!ziel || ziel.closest('.document-thumb-menue, .document-thumb-menue-knopf'))
                return;
            const zeile = ziel.closest('.document-thumb-zeile');
            if (!zeile || !darfSeiten())
                return;
            const index = Number(zeile.dataset.documentThumbZeile);
            const block = documents[index];
            if (!block)
                return;
            zug = { id: block.id, index, x: event.clientX, y: event.clientY, zeile,
                bereit: event.pointerType === 'mouse', laeuft: false, halten: 0 };
            if (event.pointerType !== 'mouse') {
                zug.halten = window.setTimeout(() => {
                    if (!zug)
                        return;
                    zug.bereit = true;
                    zug.zeile.classList.add('bereit');
                    try {
                        navigator.vibrate?.(12);
                    }
                    catch { /* nicht überall */ }
                }, 350);
            }
        });
        thumbnails.addEventListener('pointermove', (event) => {
            if (!zug)
                return;
            const weit = Math.hypot(event.clientX - zug.x, event.clientY - zug.y);
            if (!zug.bereit) {
                /* Vor dem Aufheben zählt Bewegung als Rollen — und bricht das
                   Halten ab, sonst hätte man nach dem Rollen eine Seite am Finger. */
                if (weit > 8)
                    zugEnde();
                return;
            }
            if (!zug.laeuft) {
                if (weit < 8)
                    return;
                zug.laeuft = true;
                zug.zeile.classList.add('zieht');
                thumbnails.classList.add('zieht-gerade');
                try {
                    thumbnails.setPointerCapture(event.pointerId);
                }
                catch { /* optional */ }
            }
            event.preventDefault();
            markeLegen(zielVon(event.clientY));
        });
        /* DER KLICK NACH DEM ZUG BLEIBT UNANGETASTET, und das ist eine
           Entscheidung, keine Lücke (E480).
    
           Hier stand ein Schlucker: nach einem Zug sollte der Klick, der auf
           das Loslassen folgt, nicht mehr an den Miniaturknopf gehen. Er ist
           wieder heraus, weil `test453` ihn ABSCHALTEN konnte, ohne dass
           etwas rot wurde — und beim Nachdenken hält er auch nichts:
    
             · Hat der Zug WIRKLICH umgeordnet, baut `neuMit` die ganze Leiste
               neu. Der Knopf, auf den der Klick zielte, ist dann nicht mehr im
               Baum, und es kommt gar keiner an.
             · Hat er NICHT umgeordnet (auf der eigenen Stelle losgelassen),
               landet der Klick auf der Seite, die man eben aufgehoben hat —
               also dort, wo man ohnehin hinwollte.
    
           Ein Wächter, der nicht rot werden kann, ist eine Behauptung
           (§55.2). */
        const zugLoslassen = (event) => {
            if (!zug)
                return;
            const lief = zug.laeuft;
            const block = Store.getBlock(zug.id);
            const ziel = zielVon(event.clientY);
            zugEnde();
            if (!lief || !block)
                return;
            menueSchliessen();
            seiteAnStelle(block, ziel);
        };
        thumbnails.addEventListener('pointerup', zugLoslassen);
        thumbnails.addEventListener('pointercancel', () => zugEnde());
        thumbnails.addEventListener('scroll', () => { menueSchliessen(); if (zug && !zug.laeuft)
            zugEnde(); });
        thumbnails.addEventListener('keydown', (event) => {
            if (event.key !== 'Escape')
                return;
            if (zug) {
                zugEnde();
                event.stopPropagation();
                return;
            }
            if (menueOffen) {
                const fuer = menueOffen.dataset.fuer;
                menueSchliessen();
                thumbnails.querySelector('[data-document-thumb-menue="' + fuer + '"]')?.focus();
                event.stopPropagation();
            }
        });
        /* Ein Klick irgendwo sonst schliesst das Menü — auch auf der Bühne. */
        workspace.addEventListener('pointerdown', (event) => {
            if (!menueOffen)
                return;
            const z = event.target;
            if (z && z.closest('.document-thumb-menue, .document-thumb-menue-knopf'))
                return;
            menueSchliessen();
        }, true);
        const seiteDrehen = (wen) => {
            const block = wen || jetzt();
            const g = (SheetSpace.gedrehtVon(block) + 90) % 360;
            Store.updateBlock(block.id, { gedreht: g || 0 });
            UI.toast(g ? wortEins(page) + ' um ' + g + '° gedreht' : wortEins(page) + ' wieder aufrecht');
            neuMit(block.id);
        };
        const lesezeichenWechseln = (wen) => {
            const block = wen || jetzt();
            const an = !block.lesezeichen;
            Store.updateBlock(block.id, { lesezeichen: an });
            UI.toast(an ? '🔖 Lesezeichen gesetzt' : 'Lesezeichen entfernt');
            neuMit(block.id);
        };
        const toolsSetzen = (an) => {
            state.toolsOpen = an;
            Store.setMeta('dokWerkzeuge:' + page.id, an);
            workspace.dataset.documentTools = an ? 'open' : 'closed';
            readButton.setAttribute('aria-pressed', String(!an));
            annotateButton.setAttribute('aria-pressed', String(an));
            center.querySelectorAll('.blatt-papier').forEach(paper => {
                stillSetzen(paper, !an);
            });
            /* LESEN HEISST HAND (E468). Bis hier blieb beim Wechsel auf „Lesen"
               das Werkzeug der Zeichenschicht, wie es war — der Stift, die
               Auswahl —, und nur das `inert` des Papiers hielt es fern. Seit das
               Papier nicht mehr still ist (siehe stillSetzen), muss die Schicht
               selbst in die Hand: dann ist sie durchlaessig, bis auf Abdeckband
               und Verweise, die man im Lesemodus antippen soll. Beim Annotieren
               holt `applyPen` den Stift zurueck. */
            staende.forEach(stand => {
                if (!an)
                    stand.querySelector('.blatt-werk [data-wz="schreiben"]')?.click();
                else
                    applyPen(stand);
            });
            passen();
            inkSync();
        };
        const panelsSetzen = () => {
            body.classList.toggle('with-thumbnails', state.thumbnailsOpen);
            body.classList.toggle('with-inspector', state.inspectorOpen);
            thumbnails.classList.toggle('is-open', state.thumbnailsOpen);
            inspector.classList.toggle('is-open', state.inspectorOpen);
            thumbnailButton.setAttribute('aria-expanded', String(state.thumbnailsOpen));
            inspectorButton.setAttribute('aria-expanded', String(state.inspectorOpen));
            if (state.inspectorOpen)
                renderInspector(inspector, page, jetzt());
            if (state.thumbnailsOpen)
                activateVisibleThumbnails(thumbnails);
            passen();
        };
        /* EIN BILD AUS DER ZWISCHENABLAGE WIRD EINE SEITE (E471). Wer einen
           Ausschnitt kopiert oder ein Foto in der Ablage hat, drueckt Strg V —
           und muss es nicht erst als Datei speichern. Nur im Dokument, nur
           wenn wirklich ein Bild darin liegt, und nur mit Bearbeitungsrechten;
           Text in der Ablage geht weiter dorthin, wo der Fokus steht. */
        workspace.addEventListener('paste', (event) => {
            const ziel = event.target;
            if (ziel && (ziel.closest('input, textarea, [contenteditable="true"]')))
                return;
            const dateien = Array.from(event.clipboardData?.files || []).filter(d => /^image\//i.test(d.type));
            if (!dateien.length)
                return;
            event.preventDefault();
            if (!darfSeiten()) {
                UI.toast('Zum Einfügen brauchst du Bearbeitungsrechte und ein entsperrtes Dokument.');
                return;
            }
            const stelle = stelleVon(jetzt());
            void PdfEinlesen.bilderAlsSeiten(dateien, page.id, stelle ? { elternId: stelle.eltern.id, index: stelle.index + 1 } : undefined)
                .then((ids) => { if (ids.length)
                neuMit(ids[ids.length - 1] ?? null); });
        });
        workspace.addEventListener('keydown', event => {
            /* IN DER PRÄSENTATION ZUERST (E493). Blättern mit den Pfeilen, mit
               Leertaste und mit Bild-auf/ab — die Tasten, die jedes
               Vortragsprogramm belegt, und die einzigen, die eine Hand am
               Rednerpult findet. Escape beendet; es steht vor allen anderen
               Escape-Zweigen darunter, weil die Präsentation die äusserste
               Schicht ist. */
            if (zeigenFlaeche) {
                if (event.key === 'Escape') {
                    zeigenAus();
                    event.stopPropagation();
                    return;
                }
                if (['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Spacebar'].includes(event.key)) {
                    event.preventDefault();
                    springe(state.index + 1, false);
                    return;
                }
                if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(event.key)) {
                    event.preventDefault();
                    springe(state.index - 1, false);
                    return;
                }
                if (event.key === 'Home') {
                    event.preventDefault();
                    springe(0, false);
                    return;
                }
                if (event.key === 'End') {
                    event.preventDefault();
                    springe(documents.length - 1, false);
                    return;
                }
            }
            /* Strg F sucht IM DOKUMENT (E468), nicht auf der Seite (Strg F der
               Schale, `seitenSuche`): hier ist die Seite ein Bild. */
            if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === 'f') {
                event.preventDefault();
                event.stopPropagation();
                findbarSetzen(true);
                return;
            }
            if (event.key === 'Escape' && !findbar.hidden) {
                findbarSetzen(false);
                findButton.focus();
                event.stopPropagation();
                return;
            }
            if (event.key === 'Escape' && state.lupe) {
                lupeSetzen(false);
                event.stopPropagation();
                return;
            }
            if (event.key === 'Escape' && workspace.dataset.inkOptions === 'open') {
                workspace.dataset.inkOptions = 'closed';
                moreTools.setAttribute('aria-expanded', 'false');
                moreTools.focus();
                event.stopPropagation();
                return;
            }
            if (event.key === 'Escape' && workspace.dataset.documentView === 'open') {
                workspace.dataset.documentView = 'closed';
                viewButton.setAttribute('aria-expanded', 'false');
                viewButton.focus();
                event.stopPropagation();
                return;
            }
            if (event.key === 'Escape' && (state.thumbnailsOpen || state.inspectorOpen)) {
                const returnTo = state.inspectorOpen ? inspectorButton : thumbnailButton;
                state.thumbnailsOpen = false;
                state.inspectorOpen = false;
                panelsSetzen();
                returnTo.focus();
                event.stopPropagation();
            }
            if (event.target === center && (event.key === 'PageDown' || event.key === 'PageUp')) {
                event.preventDefault();
                springe(state.index + (event.key === 'PageDown' ? 1 : -1));
            }
        });
        workspace.addEventListener('click', event => {
            const element = event.target instanceof Element ? event.target : null;
            const inkButton = element?.closest('.blatt-werk button');
            if (inkButton?.dataset.c) {
                penColor = inkButton.dataset.c;
                Store.setMeta('dokTinte:' + page.id, penColor);
            }
            if (inkButton?.dataset.b) {
                penWidth = Number(inkButton.dataset.b);
                Store.setMeta('dokStrich:' + page.id, penWidth);
            }
            if (inkButton?.dataset.wz && inkButton.dataset.wz !== 'bild') {
                penTool = inkButton.dataset.wz;
                Store.setMeta('dokStift:' + page.id, penTool);
            }
            const tool = element?.closest('[data-document-tool]')?.dataset.documentTool;
            if (tool && canAnnotate) {
                if (tool !== 'bild') {
                    penTool = tool;
                    Store.setMeta('dokStift:' + page.id, tool);
                }
                toolsSetzen(true);
                inkToolbar()?.querySelector('[data-wz="' + tool + '"]')?.click();
                // Eine Auswahlklappe zeigt Möglichkeiten, ohne einen Strich abzulegen.
                if (tool === 'laser' || tool === 'elemente')
                    inkToolbar()?.dispatchEvent(new CustomEvent('ink-panel', {
                        detail: { kind: tool, anchor: element?.closest('[data-document-tool]') }
                    }));
                inkSync();
                return;
            }
            /* Ein Klick in die Zeichenleiste schliesst die Ansichtsklappe nicht
               (E468): „Lesen" stellt die Schicht per Klick auf die Hand, und der
               Klick liefe sonst hier durch und klappte die Klappe zu, aus der
               „Lesen" gerade kam. */
            if (!element?.closest('.document-commandbar,[data-document-action="view"],.blatt-werk')) {
                workspace.dataset.documentView = 'closed';
                viewButton.setAttribute('aria-expanded', 'false');
            }
            const thumb = element?.closest('[data-document-index]');
            if (thumb?.dataset.documentIndex) {
                const nr = Number(thumb.dataset.documentIndex) || 0;
                springe(nr);
                /* UND ZUR STELLE AUF DER SEITE (E481), wenn eine genannt ist.
                   Nach `springe`, weil die Seite erst danach gezeichnet ist und
                   ihre Höhe hat; ein Bild später, weil die weiche Rollbewegung
                   von `springe` sonst gegen diese hier liefe. */
                const anteil = Number(thumb.dataset.documentStelle);
                if (Number.isFinite(anteil) && anteil > 0.02)
                    requestAnimationFrame(() => {
                        const stand = staende[nr];
                        if (!stand)
                            return;
                        center.scrollTop = stand.offsetTop + stand.offsetHeight * anteil - 24;
                    });
                return;
            }
            const original = element?.closest('[data-document-original]');
            if (original?.dataset.documentOriginal) {
                const id = original.dataset.documentOriginal;
                Dateien.adresse(id).then((url) => {
                    if (!url) {
                        UI.toast('Die Originaldatei ist nicht mehr in der Ablage.');
                        return;
                    }
                    window.open(url, '_blank', 'noopener');
                }).catch(() => UI.toast('Die Originaldatei liess sich nicht öffnen.'));
                return;
            }
            const open = element?.closest('[data-document-open]');
            if (open?.dataset.documentOpen) {
                const target = Store.getBlock(open.dataset.documentOpen);
                const sourcePage = target ? Links.seiteVon(target.id) : null;
                if (sourcePage) {
                    toggle(page, false);
                    App.oeffne(sourcePage.id);
                }
                return;
            }
            /* Der Menüknopf einer Miniatur (E480) — vor allen Tatnamen, denn er
               trägt keinen. */
            /* EIN FUND IN EINEM ANDEREN DOKUMENT (E487) — vor den Tatnamen, denn
               er trägt keinen; er trägt die Seite, die er meint. */
            const fund = element?.closest('[data-document-fund]');
            if (fund?.dataset.documentFund) {
                zumFremden(fund.dataset.documentFund, String(fund.dataset.documentFundBlock || ''));
                return;
            }
            const menueKnopf = element?.closest('[data-document-thumb-menue]');
            if (menueKnopf) {
                if (!darfSeiten()) {
                    UI.toast('Zum Ändern der Seiten brauchst du Bearbeitungsrechte und ein entsperrtes Dokument.');
                    return;
                }
                menueOeffnen(menueKnopf, Number(menueKnopf.dataset.documentThumbMenue));
                return;
            }
            const tatKnopf = element?.closest('[data-document-action]');
            const action = tatKnopf?.dataset.documentAction;
            /* WELCHE SEITE IST GEMEINT (E480): der Inspector meint die
               angesehene und sagt nichts; das Menü an der Miniatur nennt sie. */
            const zielNr = Number(tatKnopf?.dataset.documentZiel ?? NaN);
            const zielSeite = Number.isInteger(zielNr) ? documents[zielNr] : undefined;
            if (zielSeite)
                menueSchliessen();
            if (!action)
                return;
            if (action === 'ink-ruler' && canAnnotate) {
                toolsSetzen(true);
                inkToolbar()?.querySelector('[data-act="lineal"]')?.click();
                inkSync();
                return;
            }
            if (action === 'folienmenue') {
                folienMenue(tatKnopf);
                return;
            }
            if (action === 'ink-options') {
                const open = workspace.dataset.inkOptions !== 'open';
                workspace.dataset.inkOptions = open ? 'open' : 'closed';
                moreTools.setAttribute('aria-expanded', String(open));
                if (canAnnotate)
                    toolsSetzen(true);
            }
            if ((action === 'ink-undo' || action === 'ink-redo') && canAnnotate) {
                inkToolbar()?.querySelector('[data-act="' + action.slice(4) + '"]')?.click();
                inkSync();
            }
            /* Das Heft auf- und zuklappen. Der Knopf sagt nichts über seinen
               Zustand — den holt `heftSync` beim Ruf des Hefts (E503). */
            if (action === 'formelheft') {
                try {
                    Formelheft.umschalten();
                }
                catch { /* kein Heft, kein Schaden */ }
            }
            if (action === 'print') {
                const print = Register.menueband.eines('a-drucken');
                if (print?.tun)
                    print.tun();
                else
                    UI.toast('Drucken ist gerade nicht verfügbar.');
            }
            if (action === 'view') {
                const offen = workspace.dataset.documentView !== 'open';
                workspace.dataset.documentView = offen ? 'open' : 'closed';
                viewButton.setAttribute('aria-expanded', String(offen));
            }
            if (action === 'previous')
                springe(state.index - 1);
            if (action === 'next')
                springe(state.index + 1);
            if (action === 'find') {
                findbarSetzen(findbar.hidden);
                return;
            }
            if (action === 'lupe') {
                lupeSetzen(!state.lupe);
                return;
            }
            if (action === 'lupe-zu') {
                lupeSetzen(false);
                return;
            }
            if (action === 'lupe-hoch') {
                lupeRuecken(0, -1);
                return;
            }
            if (action === 'lupe-runter') {
                lupeRuecken(0, 1);
                return;
            }
            if (action === 'lupe-links') {
                lupeRuecken(-1, 0);
                return;
            }
            if (action === 'lupe-rechts') {
                lupeRuecken(1, 0);
                return;
            }
            if (action === 'lupe-weiter') {
                lupeWeiter();
                return;
            }
            if (action === 'page-export-image') {
                const block = zielSeite || jetzt();
                void seiteAlsBild(block).then(blob => {
                    if (!blob) {
                        UI.toast('Die Seite liess sich nicht als Bild zeichnen.');
                        return;
                    }
                    const nr = documentsIn(page).findIndex(b => b.id === block.id) + 1;
                    herunterladen(blob, String(page.text || 'Seite').replace(/[\\/:*?"<>|]+/g, ' ').trim() + ' – Seite ' + nr + '.png');
                    UI.toast(wortEins(page) + ' ' + nr + ' als PNG gesichert');
                });
                return;
            }
            /* ══ EINE MARKE ENTSPERREN (E492) ═══════════════════════════════════
               `*` heisst alle auf dieser Seite. Geschrieben wird in den Block —
               derselbe Weg wie „Drehen" und „Lesezeichen" darunter; über die
               Zeichenschicht ginge es nur mit Auswahl, und gerade die geht bei
               einer gesperrten Marke nicht.
      
               `gesperrt` wird GELÖSCHT und nicht auf `false` gesetzt: so steht es
               in `Marken.sperren` (E466), und eine Marke mit `gesperrt: false`
               wäre dasselbe in anderen Worten — zwei Schreibweisen für einen
               Zustand, und der Vergleich `!!mark.gesperrt` fiele irgendwann
               auseinander (§17: Datenmodell stabil halten). */
            if (action === 'praesentieren') {
                /* ══ EIN FOLIENSATZ BEKOMMT DEN FOLIENVORTRAG (E553) ═══════════════
                   Redur: „wenn ich die gelbe antworten klicke geht es weiter und
                   zeigt mir nicht die antwort".
        
                   GEMESSEN, und sein Satz stimmt aufs Wort. Es gibt ZWEI Vorträge:
        
                     · `Werkzeuge.praesentation` — der Folienvortrag (E266, E544).
                       Ein Tipp auf eine Abdeckung deckt sie auf, der Schrittzähler
                       zählt. Gemessen: Treffer am Deckel, danach `data-auf="1"`,
                       Füllung 0, Folie bleibt 1/2. RICHTIG.
                     · `zeigenAn` — der Dokumentvortrag (E493) mit Laserpointer, für
                       ein PDF an der Wand. Er legt `.document-zeigen-flaeche` über
                       alles (`inset:0`, `z-index:40`), und die schluckt jeden
                       Zeiger. Gemessen: an der Stelle des Deckels liegt
                       `DIV.document-zeigen-flaeche`, nicht das `rect`; ein Tipp
                       rechts davon schaltet von „Folie 1/2" auf „Folie 2/2", und
                       der Deckel bleibt zu.
        
                   Der Knopf in der Dokumentleiste startete IMMER den zweiten — auch
                   bei einem Foliensatz, wo er falsch ist. Das Band startete längst
                   den ersten (`pv-zeigen` in `vorlagen/folien.ts`). Zwei Knöpfe mit
                   demselben Namen, zwei verschiedene Sachen: genau der Fehler, den
                   ein Nutzer nicht auseinanderhalten KANN.
        
                   Der Laserpointer bleibt, wo er hingehört: beim PDF und beim Heft.
                   Fehlt `Werkzeuge` (Einzeldatei, halb geladenes Fenster), bleibt es
                   beim Dokumentvortrag — besser als gar keiner. */
                if (istFoliensatz(page) && typeof Werkzeuge !== 'undefined'
                    && typeof Werkzeuge.praesentation === 'function') {
                    try {
                        void Werkzeuge.praesentation(page);
                        return;
                    }
                    catch { /* dann doch der Dokumentvortrag */ }
                }
                void zeigenAn();
                return;
            }
            if (action === 'praesentieren-aus') {
                zeigenAus();
                return;
            }
            if (action === 'mark-entsperren') {
                if (!darfSeiten()) {
                    UI.toast('Zum Ändern brauchst du Bearbeitungsrechte und ein entsperrtes Dokument.');
                    return;
                }
                const block = zielSeite || jetzt();
                const welche = String(tatKnopf?.dataset.documentMarke ?? '');
                const marken = Array.isArray(block?.marken) ? block.marken : [];
                let offen = 0;
                const neu = marken.map((mark) => {
                    if (!mark?.gesperrt)
                        return mark;
                    if (welche !== '*' && String(mark.id ?? '') !== welche)
                        return mark;
                    offen++;
                    const kopie = { ...mark };
                    delete kopie.gesperrt;
                    return kopie;
                });
                if (!offen) {
                    UI.toast('Diese Marke gibt es nicht mehr.');
                    return;
                }
                Store.updateBlock(block.id, { marken: neu });
                UI.toast(offen === 1 ? 'Entsperrt' : offen + ' Marken entsperrt');
                neuMit(block.id);
                return;
            }
            if (action === 'export-pdf') {
                const knopf = tatKnopf;
                if (knopf?.disabled)
                    return;
                const seiten = documentsIn(page);
                if (!seiten.length) {
                    UI.toast('Dieses Dokument hat keine Seiten.');
                    return;
                }
                /* DER KNOPF SAGT, WIE WEIT ES IST. Ohne das sieht eine Ausfuhr von
                   vierzig Seiten aus wie eine App, die hängt — und der zweite Klick
                   startet dann eine zweite (deshalb `disabled`). */
                const wort = knopf?.textContent || '';
                if (knopf)
                    knopf.disabled = true;
                void alsPdf(seiten, (fertig, gesamt) => {
                    if (knopf)
                        knopf.textContent = fertig >= gesamt
                            ? '⤓ Wird gesichert …' : '⤓ Seite ' + (fertig + 1) + '/' + gesamt + ' …';
                }).then(blob => {
                    if (knopf) {
                        knopf.disabled = false;
                        knopf.textContent = wort;
                    }
                    if (!blob) {
                        UI.toast('Das Dokument liess sich nicht als PDF schreiben.');
                        return;
                    }
                    herunterladen(blob, String(page.text || 'Dokument').replace(/[\\/:*?"<>|]+/g, ' ').trim() + '.pdf');
                    UI.toast(seiten.length + (seiten.length === 1 ? ' Seite' : ' Seiten') + ' als PDF gesichert');
                }).catch(() => {
                    if (knopf) {
                        knopf.disabled = false;
                        knopf.textContent = wort;
                    }
                    UI.toast('Das Dokument liess sich nicht als PDF schreiben.');
                });
                return;
            }
            if (action === 'find-alle') {
                findAlle = !findAlle;
                try {
                    Store.setMeta('dokFindAlle', findAlle);
                }
                catch { /* nur diese Sitzung */ }
                findAlleKnopf.setAttribute('aria-pressed', String(findAlle));
                findAlleKnopf.classList.toggle('an', findAlle);
                fremdZeigen(findFeld.value);
                findFeld.focus();
                return;
            }
            if (action === 'find-next') {
                zumTreffer(trefferNr + 1);
                return;
            }
            if (action === 'find-previous') {
                zumTreffer(trefferNr - 1);
                return;
            }
            if (action === 'find-close') {
                findbarSetzen(false);
                findButton.focus();
                return;
            }
            /* Seiten wie GoodNotes (E467). Das Lesezeichen geht seit E473 durch
               dieselbe Prüfung wie alles andere — es schreibt in den Block. */
            if (action?.startsWith('page-')) {
                if (!darfSeiten()) {
                    UI.toast('Zum Ändern der Seiten brauchst du Bearbeitungsrechte und ein entsperrtes Dokument.');
                    return;
                }
                if (action === 'page-bookmark')
                    lesezeichenWechseln(zielSeite);
                if (action === 'page-add')
                    seiteEinfuegen(zielSeite);
                if (action === 'page-add-image' || action === 'page-add-pdf' || action === 'page-add-camera') {
                    const stelle = stelleVon(zielSeite || jetzt());
                    const anStelle = stelle ? { elternId: stelle.eltern.id, index: stelle.index + 1 } : undefined;
                    if (action === 'page-add-image' || action === 'page-add-camera') {
                        /* Derselbe Weg, ein anderer Wähler (E482): die Kamera macht
                           eine Aufnahme, der Wähler nimmt Dateien. */
                        const holen = action === 'page-add-camera' ? PdfEinlesen.kameraWaehlen : PdfEinlesen.bilderWaehlen;
                        void holen(page.id, anStelle).then((ids) => { if (ids.length)
                            neuMit(ids[ids.length - 1] ?? null); });
                    }
                    else {
                        void PdfEinlesen.waehlen(page.id, anStelle ? { anStelle } : undefined).then((result) => { if (result)
                            rerender(); });
                    }
                }
                if (action === 'page-duplicate')
                    seiteDuplizieren(zielSeite);
                if (action === 'page-to-doc')
                    void seiteInsDokument(zielSeite);
                if (action === 'page-split')
                    void seiteZerlegen(zielSeite);
                if (action === 'page-delete')
                    seiteLoeschen(zielSeite);
                if (action === 'page-up')
                    seiteSchieben(-1, zielSeite);
                if (action === 'page-down')
                    seiteSchieben(1, zielSeite);
                if (action === 'page-rotate')
                    seiteDrehen(zielSeite);
                return;
            }
            if (action === 'thumbnails') {
                state.thumbnailsOpen = !state.thumbnailsOpen;
                panelsSetzen();
            }
            if (action === 'thumbnails-close') {
                state.thumbnailsOpen = false;
                panelsSetzen();
                thumbnailButton.focus();
            }
            if (action === 'inspector') {
                state.inspectorOpen = !state.inspectorOpen;
                panelsSetzen();
            }
            if (action === 'inspector-close') {
                state.inspectorOpen = false;
                panelsSetzen();
                inspectorButton.focus();
            }
            if (action === 'read')
                toolsSetzen(false);
            if (action === 'annotate' && !page.gesperrt &&
                (typeof Konten === 'undefined' || Konten.darf('bearbeiten', page.id))) {
                toolsSetzen(true);
                /* UND DER REITER „ZEICHNEN" KOMMT NACH VORN (E552). Seit die
                   Zeichenleiste im Band wohnt, ist sie unter einem anderen Reiter
                   nicht zu sehen — „Annotieren" zu drücken und keinen Stift zu
                   bekommen wäre schlimmer als die alte Dauerleiste. */
                folienband?.reiterWaehlen?.('zeichnen');
            }
            if (action === 'fit') {
                zoomSetzen(100);
                center.scrollLeft = 0;
            }
            if (action === 'import' && !page.gesperrt &&
                (typeof Konten === 'undefined' || Konten.darf('bearbeiten', page.id))) {
                void PdfEinlesen.waehlen(page.id).then(result => { if (result)
                    rerender(); });
            }
            if (action === 'lauf') {
                /* UMSCHALTEN HEISST NEU AUFBAUEN. Wie beim Randstreifen und beim
                   Inspector: der Kasten bekommt eine andere Marke, der Schalter ein
                   anderes Wort, und in der Einzelseite soll nur EINE Buehne
                   gezeichnet dastehen — das geht am ehrlichsten von vorn. */
                state.einzeln = !state.einzeln;
                laufMerken(page.id, state.einzeln);
                UI.toast(state.einzeln
                    ? 'Einzelseite — nur die Seite, auf der du bist'
                    : 'Fortlaufend — alle Seiten untereinander');
                rerender();
                return;
            }
            if (action === 'rand') {
                /* 45 % der Seitenbreite — gemessen an einer A4-Seite sind das rund
                   acht Zentimeter, und damit passt eine Zeile Handschrift daneben.
                   Der Wert steht an der SEITE, also am Dokument, und überlebt damit
                   den Neustart wie jede andere Einstellung. */
                const an = Number(page.randBreite) > 0;
                Store.updateBlock(page.id, { randBreite: an ? 0 : 0.45 });
                page.randBreite = an ? 0 : 0.45;
                UI.toast(an ? 'Randstreifen aus' : 'Randstreifen an — schreib daneben');
                App.zeichneSeite();
                return;
            }
            if (action === 'regal') {
                /* Zurueck ins Regal, ohne den Dokumentmodus abzuschalten: wer das
                   Skript wieder aufmacht, will es wieder als Dokument sehen. */
                /* `bibliothekOben`, nicht `app-bib`: das eine ist das Regal (die
                   Ablage mit Ordnern), das andere seit dem 6. September die flache
                   Liste „Alle Seiten". Zurück aus einem Dokument will man ins Regal. */
                const eintrag = typeof Register !== 'undefined' && Register.navigation
                    ? Register.navigation.eines('bibliothekOben') : null;
                if (eintrag && typeof eintrag.tun === 'function')
                    eintrag.tun();
                else
                    UI.toast('Das Regal ist gerade nicht erreichbar.');
                return;
            }
            if (action === 'exit')
                toggle(page, false);
            if (action === 'source-actions')
                openSourceActions(page, jetzt());
            if ((action === 'select-region' || action === 'recognize') && state.lupe) {
                UI.toast('Schliess zuerst das Zoom-Fenster — der Ausschnitt gilt der ganzen Seite.');
                return;
            }
            if (action === 'select-region' || action === 'recognize') {
                /* AM STAND DER SEITE, DIE MAN ANSIEHT (E299). Vorher gab es genau
                   eine Bühne; in der Rolle ist es die, auf der der Blick steht. */
                const stand = staende[state.index];
                const paper = stand?.querySelector('.blatt-papier');
                if (!paper) {
                    UI.toast('Diese Seite ist gerade nicht gezeichnet.');
                    return;
                }
                /* Region selection is available in reading mode too. Only the temporary
                   overlay is interactive; the document beneath stays inert. */
                selectRegion(paper, jetzt(), region => {
                    if (action === 'recognize') {
                        const recognition = window.Recognition;
                        if (recognition?.fromSource)
                            recognition.fromSource(page, jetzt(), region);
                        else
                            UI.toast('Die Erkennung ist noch nicht geladen.');
                    }
                    else
                        openSourceActions(page, jetzt(), region);
                });
            }
        });
        zoom.addEventListener('input', () => {
            state.zoom = Number(zoom.value) || 100;
            zoomMerken(page.id, state.zoom); /* F07 */
            passen();
            zoomLabel.textContent = state.zoom + ' %';
        });
        /* ZOOM MIT STRG+RAD UND MIT ZWEI FINGERN (E354), wie in GoodNotes. Der
           Regler bleibt die Wahrheit: beide Wege schreiben in ihn hinein, damit
           Regler, Zahl und Ansicht nie auseinanderlaufen. Ohne Strg rollt das
           Rad wie immer; das Kneifen zaehlt nur Finger, nie Stift oder Maus. */
        const zoomSetzen = (wert) => {
            /* Im Zoom-Fenster (E469) darf es 300 sein — der Regler bleibt bei 180. */
            const neu = Math.max(60, Math.min(state.lupe ? 300 : 180, Math.round(wert)));
            if (neu === state.zoom)
                return;
            state.zoom = neu;
            if (!state.lupe)
                zoomMerken(page.id, neu); /* F07 — auch Strg+Rad und Kneifen; die Lupe merkt nicht */
            zoom.value = String(neu);
            zoomLabel.textContent = neu + ' %';
            passen();
        };
        /* ══ DAS ZOOM-FENSTER (E469, umgebaut E470) ═════════════════════════════
           GoodNotes' Lupe: unten ein Streifen, in den man in Handschriftgroesse
           schreibt, oben die ganze Seite mit dem Rahmen, der zeigt, wo man
           gerade ist.
    
           UND ES IST DIESELBE FLAECHE, nicht zwei. Das echte Papier der aktiven
           Seite WANDERT in den Streifen (ein DOM-Umzug) und wird dort per
           `transform` vergroessert; in der Buehne bleibt ein stilles ABBILD —
           ein Klon ohne Zeigerwege, der bei jeder Aenderung neu entsteht.
           Zwei Zeichenschichten auf demselben Block hielten zwei Kopien der
           Marken (marken.ts, `marks`) und ueberschrieben einander: das waere
           Datenverlust (§51), und darum gibt es sie nicht.
    
           Dass der Zeiger im vergroesserten Streifen trotzdem an der richtigen
           Stelle des Blatts ankommt, rechnet `SheetSpace.zuBlatt` ueber
           `getScreenCTM` — die kennt jede CSS-Verwandlung der Vorfahren.
           Dieselbe Grundlage traegt schon die gedrehte Seite (E467). */
        const LUPE_FAKTOR = 2.6;
        let lupe = null;
        let lupeFenster = null;
        let lupeKnoten = null;
        let lupeHeimat = null;
        let lupeAbbild = null;
        let lupeRahmen = null;
        let lupeBeobachter = null;
        let lupeFrischWartet = false;
        let lupeX = 0, lupeY = 0;
        /** Das Papier einer Buehne: das Kind der Huelle, das nicht die Leiste ist.
            Bei Randstreifen ist es der Flur, bei gedrehten Seiten die Drehhuelle. */
        const lupePapierVon = (stand) => stand?.querySelector('.blatt-huelle > :not(.blatt-reihe):not(.blatt-abbild)') || null;
        /** Das stille Abbild in der Buehne auf den neuesten Stand bringen. */
        const lupeAbbildFrisch = () => {
            if (lupeFrischWartet || !lupeAbbild || !lupeKnoten)
                return;
            lupeFrischWartet = true;
            requestAnimationFrame(() => {
                lupeFrischWartet = false;
                if (!lupeAbbild || !lupeKnoten)
                    return;
                const klon = lupeKnoten.cloneNode(true);
                /* DAS `style` BLEIBT (auf dem Bild gefunden, §55): darin stehen das
                   Seitenverhaeltnis des Papiers und die Masse seiner Linien. Ein
                   `removeAttribute('style')` machte aus der A4-Seite oben einen
                   flachen Streifen mit gequetschter Schrift. Nur die zwei Werte,
                   die dem STREIFEN gehoeren, werden zurueckgenommen. */
                klon.style.removeProperty('transform');
                klon.style.width = '100%';
                klon.classList.add('ist-abbild');
                klon.setAttribute('aria-hidden', 'true');
                lupeAbbild.replaceChildren(klon);
                if (lupeRahmen)
                    lupeAbbild.appendChild(lupeRahmen);
                /* Die Treffer der Suche haengen im Papier und sind mit ihm gewandert;
                   im Abbild werden sie mitgeklont — der Rahmen kommt darueber. */
            });
        };
        /** Streifen und Rahmen an die Stelle legen, die `lupeX`/`lupeY` meinen. */
        const lupeLegen = () => {
            if (!lupeFenster || !lupeKnoten)
                return;
            const breit = Math.max(120, lupeFenster.clientWidth * LUPE_FAKTOR);
            lupeKnoten.style.width = breit + 'px';
            const hoch = lupeKnoten.getBoundingClientRect().height || breit * 1.414;
            const maxX = Math.max(0, breit - lupeFenster.clientWidth);
            const maxY = Math.max(0, hoch - lupeFenster.clientHeight);
            const tx = Math.min(maxX, Math.max(0, lupeX * breit));
            const ty = Math.min(maxY, Math.max(0, lupeY * hoch));
            lupeX = breit > 0 ? tx / breit : 0;
            lupeY = hoch > 0 ? ty / hoch : 0;
            lupeKnoten.style.transform = 'translate(' + (-tx) + 'px, ' + (-ty) + 'px)';
            if (lupeRahmen && hoch > 0) {
                lupeRahmen.style.left = (tx / breit * 100) + '%';
                lupeRahmen.style.top = (ty / hoch * 100) + '%';
                lupeRahmen.style.width = Math.min(100, lupeFenster.clientWidth / breit * 100) + '%';
                lupeRahmen.style.height = Math.min(100, lupeFenster.clientHeight / hoch * 100) + '%';
            }
        };
        /** Den Ausschnitt auf einen Punkt des Abbilds stellen (Anteile 0..1). */
        const lupeZielen = (fx, fy) => {
            if (!lupeFenster || !lupeKnoten)
                return;
            const breit = Math.max(120, lupeFenster.clientWidth * LUPE_FAKTOR);
            const hoch = lupeKnoten.getBoundingClientRect().height || breit * 1.414;
            lupeX = fx - (lupeFenster.clientWidth / breit) / 2;
            lupeY = fy - (lupeFenster.clientHeight / hoch) / 2;
            lupeLegen();
        };
        /** Ruecken: waagrecht ein halbes Fenster, senkrecht 85 Prozent. */
        const lupeRuecken = (dx, dy) => {
            if (!lupeFenster || !lupeKnoten)
                return;
            const breit = Math.max(120, lupeFenster.clientWidth * LUPE_FAKTOR);
            const hoch = lupeKnoten.getBoundingClientRect().height || breit * 1.414;
            lupeX += dx * (lupeFenster.clientWidth / breit) * 0.5;
            lupeY += dy * (lupeFenster.clientHeight / hoch) * 0.85;
            lupeLegen();
        };
        /** „Weiter": eine Streifenhoehe tiefer, am Zeilenende zurueck nach links.
            Der Griff, mit dem man in GoodNotes eine Seite vollschreibt. */
        const lupeWeiter = () => {
            if (!lupeFenster || !lupeKnoten)
                return;
            const breit = Math.max(120, lupeFenster.clientWidth * LUPE_FAKTOR);
            const hoch = lupeKnoten.getBoundingClientRect().height || breit * 1.414;
            const sichtbarX = lupeFenster.clientWidth / breit;
            if (lupeX + sichtbarX * 1.5 < 1) {
                lupeX += sichtbarX * 0.9;
                lupeLegen();
                return;
            }
            lupeX = 0;
            lupeY += (lupeFenster.clientHeight / hoch) * 0.85;
            lupeLegen();
        };
        /** Das Papier der aktiven Seite in den Streifen holen (oder zurueckgeben). */
        const lupeUmziehen = (hinein) => {
            if (hinein) {
                const stand = staende[state.index];
                const knoten = lupePapierVon(stand);
                const huelle = knoten?.parentElement;
                if (!knoten || !huelle || !lupeFenster)
                    return;
                lupeKnoten = knoten;
                lupeHeimat = huelle;
                lupeAbbild = document.createElement('div');
                lupeAbbild.className = 'blatt-abbild';
                lupeAbbild.setAttribute('aria-hidden', 'true');
                lupeAbbild.inert = true;
                lupeRahmen = document.createElement('div');
                lupeRahmen.className = 'document-lupe-rahmen';
                huelle.insertBefore(lupeAbbild, knoten);
                lupeFenster.appendChild(knoten);
                lupeAbbildFrisch();
                /* Jede Aenderung an der echten Flaeche zieht das Abbild nach — ein
                   Beobachter statt eines Hakens in `marken.ts`: der Zeichner soll
                   von der Lupe nichts wissen muessen (§5). */
                const flaeche = knoten.querySelector('svg.blatt-marken');
                if (flaeche) {
                    lupeBeobachter = new MutationObserver(() => lupeAbbildFrisch());
                    lupeBeobachter.observe(flaeche, { childList: true, subtree: true, attributes: true });
                }
                /* AM RAND GEHT ES VON SELBST WEITER (E471), wie in GoodNotes: wer
                   bis an den rechten Rand des Streifens schreibt, will die naechste
                   Stelle sehen und nicht erst einen Knopf suchen. Nur nach einem
                   echten Strich (ein Zeichenwerkzeug fuehrt) und nur, wenn der
                   Zeiger im rechten Achtel losgelassen wird. */
                knoten.addEventListener('pointerup', lupeRandWeiter);
                requestAnimationFrame(lupeLegen);
            }
            else {
                lupeKnoten?.removeEventListener('pointerup', lupeRandWeiter);
                lupeBeobachter?.disconnect();
                lupeBeobachter = null;
                if (lupeKnoten && lupeHeimat) {
                    lupeKnoten.style.removeProperty('width');
                    lupeKnoten.style.removeProperty('transform');
                    if (lupeAbbild && lupeAbbild.parentElement === lupeHeimat)
                        lupeHeimat.insertBefore(lupeKnoten, lupeAbbild);
                    else
                        lupeHeimat.appendChild(lupeKnoten);
                }
                lupeAbbild?.remove();
                lupeKnoten = null;
                lupeHeimat = null;
                lupeAbbild = null;
                lupeRahmen = null;
            }
        };
        /**
         * „AUSSCHNITT" UND „ERKENNEN" RUHEN SICHTBAR, solange das Zoom-Fenster
         * offen ist (E498, letzter offener Punkt aus L133 zum Zoom-Fenster).
         *
         * Beide gelten der GANZEN Seite; im Zoom-Fenster sieht man einen
         * Streifen davon. Ein Ausschnitt, den man dort zieht, läge auf der
         * ganzen Seite ganz woanders — deshalb sagte E470 schon nein, aber
         * ERST NACH DEM DRUCK, als Meldung. Ein Knopf, der aussieht, als ginge
         * er, und dann eine Absage gibt, ist ein Knopf, der zweimal gelesen
         * werden muss (§38: der Zustand gehört an den Knopf).
         *
         * Die Meldung bleibt trotzdem stehen: sie fängt den Weg über die
         * Tastatur und über die Befehlspalette, die den Knopf nicht sieht.
         */
        const ausschnittRuhen = (an) => {
            for (const was of ['select-region', 'recognize']) {
                const knopf = workspace.querySelector('.document-inspector-actions [data-document-action="' + was + '"]');
                if (!knopf)
                    continue;
                knopf.disabled = an;
                knopf.setAttribute('aria-disabled', an ? 'true' : 'false');
                knopf.title = an
                    ? 'Ruht, solange das Zoom-Fenster offen ist — der Ausschnitt gilt der ganzen Seite.'
                    : (was === 'select-region'
                        ? 'Einen Ausschnitt der Seite aufziehen'
                        : 'Den Text im Ausschnitt erkennen lassen');
            }
        };
        const lupeSetzen = (an) => {
            if (an === !!state.lupe)
                return;
            if (an) {
                if (!canAnnotate) {
                    UI.toast('Zum Schreiben im Zoom-Fenster brauchst du Bearbeitungsrechte.');
                    return;
                }
                state.lupe = true;
                workspace.dataset.lupe = 'an';
                ausschnittRuhen(true);
                /* Die ganze Seite soll oben stehen — der Streifen ist die
                   Vergroesserung, nicht der Zoom der Buehne. */
                state.zoomVorher = state.zoom;
                zoomSetzen(100);
                lupe = document.createElement('div');
                lupe.className = 'document-lupe';
                lupe.setAttribute('role', 'group');
                lupe.setAttribute('aria-label', 'Zoom-Fenster: hier gross schreiben');
                lupeFenster = document.createElement('div');
                lupeFenster.className = 'document-lupe-fenster';
                const griffe = document.createElement('div');
                griffe.className = 'document-lupe-griffe';
                griffe.append(topButton('lupe-links', '◀', 'Ausschnitt nach links'), topButton('lupe-hoch', '▲', 'Ausschnitt nach oben'), topButton('lupe-runter', '▼', 'Ausschnitt nach unten'), topButton('lupe-rechts', '▶', 'Ausschnitt nach rechts'), topButton('lupe-weiter', '⏎', 'Weiter — ein Streifen weiter, wie eine neue Zeile'), topButton('lupe-zu', '✕', 'Zoom-Fenster schließen'));
                lupe.append(lupeFenster, griffe);
                workspace.appendChild(lupe);
                lupeX = 0;
                lupeY = 0;
                lupeUmziehen(true);
                /* Ein Tipp ins Abbild stellt den Streifen dorthin — der schnellste
                   Weg zu der Stelle, an der man schreiben will. */
                center.addEventListener('pointerdown', lupeTipp, true);
                requestAnimationFrame(() => { lupeLegen(); passen(); });
            }
            else {
                state.lupe = false;
                workspace.dataset.lupe = 'aus';
                ausschnittRuhen(false);
                center.removeEventListener('pointerdown', lupeTipp, true);
                lupeUmziehen(false);
                lupe?.remove();
                lupe = null;
                lupeFenster = null;
                zoomSetzen(state.zoomVorher || 100);
            }
            inspector.querySelectorAll('.document-lupe-knopf').forEach(k => {
                k.classList.toggle('an', an);
                k.setAttribute('aria-pressed', an ? 'true' : 'false');
                k.textContent = an ? '🔍 Zoom-Fenster aus' : '🔍 Zoom-Fenster an';
            });
        };
        function lupeRandWeiter(event) {
            if (!state.lupe || !lupeFenster)
                return;
            const werk = lupeKnoten?.querySelector('svg.blatt-marken')?.dataset.tool || '';
            if (!['stift', 'marker', 'line', 'arrow'].includes(werk))
                return;
            const r = lupeFenster.getBoundingClientRect();
            if (event.clientX < r.right - r.width / 8)
                return;
            lupeWeiter();
        }
        function lupeTipp(event) {
            if (!state.lupe || !lupeAbbild)
                return;
            const ziel = event.target;
            if (!ziel || !lupeAbbild.contains(ziel))
                return;
            const r = lupeAbbild.getBoundingClientRect();
            if (r.width < 1 || r.height < 1)
                return;
            lupeZielen((event.clientX - r.left) / r.width, (event.clientY - r.top) / r.height);
            event.preventDefault();
            event.stopPropagation();
        }
        center.addEventListener('wheel', (event) => {
            if (!event.ctrlKey && !event.metaKey)
                return;
            event.preventDefault();
            zoomSetzen(state.zoom + (event.deltaY < 0 ? 10 : -10));
        }, { passive: false });
        const finger = new Map();
        let kneifen = null;
        center.addEventListener('pointerdown', (event) => {
            if (event.pointerType !== 'touch')
                return;
            finger.set(event.pointerId, [event.clientX, event.clientY]);
            if (finger.size === 2) {
                const [a, b] = [...finger.values()];
                kneifen = { abstand: Math.hypot(a[0] - b[0], a[1] - b[1]) || 1, zoom: state.zoom };
            }
        }, true);
        center.addEventListener('pointermove', (event) => {
            if (!kneifen || !finger.has(event.pointerId))
                return;
            finger.set(event.pointerId, [event.clientX, event.clientY]);
            const [a, b] = [...finger.values()];
            const abstand = Math.hypot(a[0] - b[0], a[1] - b[1]) || 1;
            zoomSetzen(kneifen.zoom * abstand / kneifen.abstand);
        }, true);
        const fingerWeg = (event) => {
            finger.delete(event.pointerId);
            if (finger.size < 2)
                kneifen = null;
        };
        center.addEventListener('pointerup', fingerWeg, true);
        center.addEventListener('pointercancel', fingerWeg, true);
        /* Ganz zum Schluss, wenn alles steht: fehlende Verweise nachtragen
           (E477). Das Ende des Auftrags malt sie an jeder gezeichneten Seite. */
        nachtragAnstossen(documents, () => {
            staende.forEach((_stand, i) => { if (gezeichnet.has(i))
                verweiseMalen(i); });
        });
        /* ══ DER SPRUNG AUS EINER FREMDEN SUCHE (E487) ═════════════════════════
           Wer in der Liste auf eine Seite eines anderen Dokuments tippt, landet
           hier: `App.oeffne` hat den Aufbau neu gebaut, `select` hat die Seite
           schon gewählt, und der Wunsch sagt, mit welcher Frage weitergesucht
           wird. Die Suche IM Dokument gibt dann die Stelle — das ist genau der
           Unterschied, den der Knopf verspricht.
    
           Der Wunsch wird SOFORT gelöscht, nicht erst nach der Suche: sonst
           ginge die Suchleiste bei jedem weiteren Neuzeichnen dieser Seite
           wieder auf, und niemand wüsste, warum. */
        if (sprungWunsch && sprungWunsch.seiteId === page.id) {
            const wort = sprungWunsch.wort;
            sprungWunsch = null;
            findFeld.value = wort;
            findbarSetzen(true);
            void suchen(wort).then(() => { if (treffer.length)
                zumTreffer(0); });
        }
        return true;
    };
    /* `freigeben` lässt die offenen PDF-Quellen der Suche los (E473): jede
       Seitenzeichnung läuft durch `schale.ts`, und wer das Dokument verlässt,
       soll pdf.js nicht im Rücken behalten. */
    return { available, active, select, toggle, documentsIn, render, sourceLabel, seiteAlsBild, alsPdf,
        /* E500: die Schalensuche fragt danach, welche SEITE eines
           Dokuments das Wort trägt — mit derselben Rechnung wie die
           Suche im Studio (§8). */
        stelleIn,
        /* E500: alle Dokumentstellen zu einem Wort — dieselbe Rechnung
           wie die Suche über mehrere Dokumente (E487), nur ohne die
           Seite auszunehmen, die gerade offen ist. */
        stellenSuchen: (wort) => fremdeTreffer(wort, ''),
        freigeben: () => { griffeSchliessen(); verweisHorchenAus(); } };
})();
window.DocumentMode = DocumentMode;
/* ============================================================================
 * DIE KONTEXTKANTE IM DOKUMENTMODUS (E272 Phase F)
 * ----------------------------------------------------------------------------
 * DIESELBEN WERKZEUGE WIE DER REITER „ZEICHNEN", aus derselben Quelle:
 * `Register.menueband.inReiter('zeichnen')`. Eine zweite Stiftliste hier
 * wäre die dritte Stelle, an der „Marker" definiert wird — nach dem
 * Menüband und der Werkzeugspalte im Dokument selbst.
 *
 * `zeigen()` wird mitgenommen und nicht ausgewertet: die Kante fragt es
 * jedes Mal neu, und ein Werkzeug, das nur mit offener Fläche Sinn hat,
 * verschwindet dann von selbst wieder.
 * ==========================================================================*/
if (typeof Register !== 'undefined' && Register.kontext) {
    const K = Register.kontext;
    /* AUCH HIER EIN LIEFERANT (derselbe Grund wie in `elektro/start.ts`):
       `inReiter('zeichnen')` filtert schon mit `zeigen()`, und die Werkzeuge
       brauchen eine offene Fläche. Beim Laden gibt es keine — einmal gefragt
       hiesse für immer leer. */
    K.meldeLieferant('pdf', () => {
        const raus = [];
        let rang = 20;
        for (const g of (Register.menueband.inReiter('zeichnen') || [])) {
            raus.push({
                bereich: 'pdf', id: 'zeichnen-' + String(g.gruppe).toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                name: String(g.gruppe), zeichen: 'pencil', rang: rang,
                liefern: () => (g.eintraege || [])
                    .filter((e) => {
                    try {
                        return typeof e.zeigen !== 'function' || e.zeigen();
                    }
                    catch {
                        return false;
                    }
                })
                    .map((e) => ({
                    id: String(e.id), name: String(e.name || e.id), unter: e.hinweis,
                    zeichen: e.zeichen,
                    an: (() => {
                        try {
                            return typeof e.an === 'function' ? !!e.an() : false;
                        }
                        catch {
                            return false;
                        }
                    })(),
                    tun: () => { try {
                        e.tun();
                    }
                    catch { /* toter Griff bleibt still */ } }
                }))
            });
            rang += 10;
        }
        return raus;
    });
    /* OCR und Formelheft stehen nicht im Zeichnen-Reiter — sie gehören dem
       Dokument und nicht dem Stift. */
    K.melde({ bereich: 'pdf', id: 'ocr', name: 'Text erkennen (OCR)',
        zeichen: 'camera', rang: 200,
        zeigen: () => typeof Recognition !== 'undefined' && !!Recognition.capturePage,
        tun: () => { try {
            Recognition.capturePage();
        }
        catch { /* … */ } } });
    K.melde({ bereich: 'pdf', id: 'formelheft', name: 'Formelheft',
        zeichen: 'book', rang: 210,
        zeigen: () => typeof Formelheft !== 'undefined' && !!Formelheft.umschalten,
        tun: () => { try {
            Formelheft.umschalten();
        }
        catch { /* … */ } } });
}
