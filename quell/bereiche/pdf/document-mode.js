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
    const gemerkterLauf = (pageId) => Store.getMeta(LAUF_MERKER + pageId) === 'einzel';
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
    const seiteZeichnen = async (block, typ = 'image/png', guete = 0.92) => {
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
        const marken = Array.isArray(block.marken) ? block.marken : [];
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
            const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + bw + ' ' + bh + '" width="' + W + '" height="' + H + '">' + innen + '</svg>';
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
    const alsPdf = async (seiten, melden) => {
        if (typeof PdfWriter === 'undefined' || !Array.isArray(seiten) || !seiten.length)
            return null;
        const schreiber = PdfWriter.neu();
        for (let i = 0; i < seiten.length; i++) {
            if (melden && melden(i, seiten.length) === false)
                return null;
            const bild = await seiteZeichnen(seiten[i], 'image/jpeg', 0.88);
            if (!bild)
                continue;
            schreiber.seite({ bild: bild.blob, pixelBreite: bild.pixelBreite, pixelHoehe: bild.pixelHoehe,
                breite: bild.breite, hoehe: bild.hoehe });
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
    /* Die offenen PDF-Quellen der Suche (E468), je Quelle ein Griff. Ein
       neuer Aufbau schliesst die alten — pdf.js haelt sonst je Dokument
       einen Arbeiter. */
    const griffe = new Map();
    const griffeSchliessen = () => {
        griffe.forEach(g => { void g.then(x => { try {
            x?.schliessen?.();
        }
        catch { /* egal */ } }); });
        griffe.clear();
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
            let fund = '';
            if (block.type === 'pdfseite') {
                const text = String(block.suchtext || block.ocrText || '');
                if (text.toLowerCase().includes(q))
                    fund = text;
            }
            else {
                for (const m of (Array.isArray(block.marken) ? block.marken : [])) {
                    if ((m?.art === 'text' || m?.art === 'zettel') && String(m.text ?? '').toLowerCase().includes(q)) {
                        fund = String(m.text);
                        break;
                    }
                }
                if (!fund)
                    for (const kind of Store.childrenOf(block.id)) {
                        if (String(kind?.text ?? '').toLowerCase().includes(q)) {
                            fund = String(kind.text);
                            break;
                        }
                    }
            }
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
    const sourceLabel = (documentBlock) => documentBlock.type === 'pdfseite'
        ? (documentBlock.herkunft === 'bild'
            ? 'Bild' + (documentBlock.bildName ? ' · ' + String(documentBlock.bildName).slice(0, 40) : '')
            : 'PDF · Seite ' + (Number(documentBlock.nr) || 1))
        : 'A4-Blatt';
    const linkedObjects = (page, documentBlock) => Object.values(Store.cache.blocks).filter(block => {
        if (!block?.alive || !block.sourceRef)
            return false;
        const source = block.sourceRef;
        return source.blockId === documentBlock.id ||
            (!source.blockId && source.pageId === page.id);
    });
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
            const blank = document.createElement('span');
            blank.className = 'document-thumbnail-blank';
            blank.textContent = documentBlock.type === 'blatt' ? '✎' : documentBlock.herkunft === 'bild' ? '🖼' : 'PDF';
            preview.appendChild(blank);
        }
        const label = document.createElement('span');
        label.className = 'document-thumbnail-label';
        label.textContent = sourceLabel(documentBlock);
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
        pdfKnopf.title = 'Das ganze Dokument mit allen Marken als PDF speichern — '
            + 'jede Seite als Bild; der Text der ursprünglichen PDF ist darin nicht mehr durchsuchbar.';
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
        seiteTitel.textContent = 'Seite ' + (seitenIndex + 1) + ' von ' + seiten.length +
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
        knoepfe.append(seitenKnopf('page-add', '＋', 'Seite danach', 'Eine leere Seite hinter dieser einfügen — mit dem Papier aus der Auswahl darunter'), seitenKnopf('page-duplicate', '⧉', 'Duplizieren', 'Diese Seite mit allem darauf verdoppeln'), seitenKnopf('page-rotate', '⟳', 'Drehen', 'Diese Seite um 90° im Uhrzeigersinn drehen'), seitenKnopf('page-up', '↑', 'Nach oben', 'Diese Seite eine Stelle nach vorn'), seitenKnopf('page-down', '↓', 'Nach unten', 'Diese Seite eine Stelle nach hinten'), seitenKnopf('page-bookmark', '🔖', 'Lesezeichen', documentBlock.lesezeichen ? 'Lesezeichen entfernen' : 'Diese Seite mit einem Lesezeichen merken', !!documentBlock.lesezeichen), seitenKnopf('page-delete', '🗑', 'Löschen', 'Diese Seite in den Papierkorb legen — von dort kommt sie zurück'), 
        /* E469: Bilder und weitere PDF-Seiten hinter diese Seite; die Seite als Bild sichern. */
        seitenKnopf('page-add-image', '🖼', 'Bild als Seite', 'Ein Foto, einen Scan oder eine Grafik als neue Seite hinter dieser einfügen'), seitenKnopf('page-add-camera', '📷', 'Foto aufnehmen', 'Mit der Kamera eine neue Seite hinter dieser aufnehmen — am Rechner ohne Kamera öffnet sich der Dateiwähler'), seitenKnopf('page-add-pdf', '📕', 'PDF hier einfügen', 'Die Seiten einer weiteren PDF hinter dieser Seite einfügen'), seitenKnopf('page-export-image', '⬇', 'Als Bild sichern', 'Diese Seite mit allem darauf als PNG speichern'));
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
        container.append(datenZeile, viewTitle, randKnopf, lupeKnopf);
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
        const topButton = (action, text, label) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.dataset.documentAction = action;
            button.setAttribute('aria-label', label);
            button.textContent = text;
            button.title = label;
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
        const thumbnailButton = topButton('thumbnails', '▤ Seiten', 'Seitenübersicht öffnen');
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
        position.textContent = 'Seite ' + (state.index + 1) + '/' + documents.length;
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
        zoomGroup.append(zoom, zoomLabel, topButton('fit', 'Anpassen', 'Seite an die verfügbare Breite anpassen'));
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
        const viewButton = topButton('view', '☷', 'Ansicht, Lesemodus und Zoom');
        viewButton.className = 'document-view-button';
        viewButton.setAttribute('aria-expanded', 'false');
        /* SUCHEN IM DOKUMENT (E468): der Knopf steht bei den Kopfaktionen,
           wie GoodNotes' Lupe; die Leiste dazu klappt unter dem Kopf auf. */
        const findButton = topButton('find', '🔍', 'Im Dokument suchen (Strg F)');
        findButton.className = 'document-find-button';
        findButton.setAttribute('aria-expanded', 'false');
        topActions.append(findButton, viewButton, inspectorButton, topButton('print', 'Drucken', 'Bearbeitete Fassung mit Notizen drucken'), topButton('exit', 'Seiteneditor', 'Dokumentmodus verlassen'));
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
        commandbar.append(modes, pagination, zoomGroup, findKlappe);
        // One document-wide tool strip. Each action delegates to the existing page
        // controller; the original controls, undo stacks and mark objects stay intact.
        const drawingbar = document.createElement('div');
        drawingbar.className = 'document-drawingbar';
        drawingbar.setAttribute('role', 'toolbar');
        drawingbar.setAttribute('aria-label', 'PDF bearbeiten');
        const drawingTools = [
            ['schreiben', 'inkHand', 'Hand / Verschieben'], ['select', 'inkLasso', 'Lasso / Auswahl'],
            ['stift', 'pencil', 'Stift'], ['marker', 'inkMarker', 'Marker'],
            ['radierer', 'inkEraser', 'Radierer'], ['text', 'inkText', 'Text'],
            ['formen', 'inkShapes', 'Formen'], ['zettel', 'comment', 'Haftnotiz'],
            ['bild', 'image', 'Bild'], ['zeichen', 'bolt', 'Fachzeichen'], ['abdeck', 'eye', 'Abdecken']
        ];
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
        const moreTools = topButton('ink-options', '···', 'Alle Stiftoptionen und Bearbeitungsaktionen');
        moreTools.setAttribute('aria-expanded', 'false');
        drawingbar.appendChild(moreTools);
        const history = document.createElement('div');
        history.className = 'document-ink-history';
        history.setAttribute('role', 'group');
        history.setAttribute('aria-label', 'Zeichenverlauf');
        history.append(topButton('ink-undo', '↶', 'Letzten Zeichenstrich rückgängig machen'), topButton('ink-redo', '↷', 'Zeichenstrich wiederholen'));
        drawingbar.appendChild(history);
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
        thumbnails.setAttribute('aria-label', 'Seitenübersicht');
        thumbnailButton.setAttribute('aria-controls', thumbnails.id);
        const thumbHeader = document.createElement('div');
        thumbHeader.className = 'document-panel-header';
        const thumbTitle = document.createElement('strong');
        thumbTitle.textContent = 'Seiten';
        const thumbClose = topButton('thumbnails-close', '✕', 'Seitenübersicht schließen');
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
        const original = originalKnopf(page, current);
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
            if (toolbar && !toolbar.dataset.documentPenReady) {
                toolbar.dataset.documentPenReady = 'true';
                Array.from(toolbar.querySelectorAll('[data-c]')).find(b => b.dataset.c === penColor)?.click();
                Array.from(toolbar.querySelectorAll('[data-b]')).find(b => Number(b.dataset.b) === penWidth)?.click();
            }
            /* DIE HAND IST KEIN STIFT (E468): seit „Lesen" die Schicht auf die Hand
               stellt, stuende sonst beim naechsten „Annotieren" wieder die Hand —
               und die Zeichenleiste bliebe zu (sie zeigt sich nur bei einem
               Zeichenwerkzeug). Dann lieber der Stift. */
            const key = drawingTools.some(([tool]) => tool === penTool) && penTool !== 'schreiben' ? penTool : 'stift';
            if (toolbar?.dataset.tool === key)
                return;
            toolbar?.querySelector('[data-wz="' + key + '"]')?.click();
        };
        let treffer = [];
        let trefferNr = -1;
        let suchLauf = 0;
        const lagen = new Map();
        const griffVon = (quelleId) => {
            let g = griffe.get(quelleId);
            if (!g) {
                g = (async () => {
                    if (typeof PdfLeser === 'undefined' || typeof Dateien === 'undefined')
                        return null;
                    const roh = await Dateien.alsBlob(quelleId);
                    if (!roh)
                        return null;
                    return PdfLeser.oeffne(new Uint8Array(await roh.arrayBuffer()));
                })().catch(() => null);
                griffe.set(quelleId, g);
            }
            return g;
        };
        const lageVon = (block) => {
            let l = lagen.get(block.id);
            if (!l) {
                l = (async () => {
                    if (block.type !== 'pdfseite' || !block.quelleId)
                        return [];
                    const griff = await griffVon(String(block.quelleId));
                    return griff ? griff.textMitLage(Number(block.nr) || 1) : [];
                })().catch(() => []);
                lagen.set(block.id, l);
            }
            return l;
        };
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
        body.append(thumbnails, center, inspector);
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
        workspace.append(top, findbar, drawingbar, commandbar, body);
        wrap.appendChild(workspace);
        if (typeof Register !== 'undefined')
            Register.symbole.fuelle(drawingbar);
        const inkToolbar = () => staende[state.index]?.querySelector('.blatt-werk') || null;
        const inkSync = () => {
            if (!workspace.isConnected) {
                Zeichenziel.vergiss(inkSync);
                return;
            }
            const source = inkToolbar();
            drawingbar.querySelectorAll('[data-document-tool]').forEach(button => {
                const real = source?.querySelector('[data-wz="' + button.dataset.documentTool + '"]');
                button.disabled = !canAnnotate || !real || real.disabled;
                button.setAttribute('aria-pressed', String(state.toolsOpen && real?.getAttribute('aria-pressed') === 'true'));
            });
            for (const action of ['undo', 'redo']) {
                const real = source?.querySelector('[data-act="' + action + '"]');
                const button = history.querySelector('[data-document-action="ink-' + action + '"]');
                if (button)
                    button.disabled = !canAnnotate || !real || real.disabled;
            }
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
                position.textContent = 'Seite ' + (sichtbar + 1) + '/' + documents.length;
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
            nachziehen();
            thumbnails.querySelector('.document-thumbnail.is-selected')
                ?.scrollIntoView({ block: 'nearest' });
            activateVisibleThumbnails(thumbnails);
        });
        /* Zu einer Seite springen — zeichnen, hinrollen, Stand merken. Kein
           Neuaufbau: ein Sprung, der die ganze Seite neu zeichnet, verlöre
           jeden angefangenen Strich und jede offene Textstelle. */
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
                if (weich && !matchMedia('(prefers-reduced-motion: reduce)').matches && typeof center.scrollTo === 'function')
                    center.scrollTo({ top: stand.offsetTop, behavior: 'smooth' });
                else
                    center.scrollTop = stand.offsetTop;
            }
            position.textContent = 'Seite ' + (nr + 1) + '/' + documents.length;
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
                        { blockId: neu.id, abgeleitet: satz ? !!satz.abgeleitet : block.herkunft !== 'bild' });
                        Store.updateBlock(neu.id, { bildDateiId: kopie.id });
                    }
                    catch (e) {
                        UI.toast('Das Seitenbild liess sich nicht mitkopieren: ' + (e instanceof Error ? e.message : String(e)));
                    }
                })();
            }
            UI.toast('Seite verdoppelt');
            neuMit(neu.id);
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
            UI.toast('Seite im Papierkorb — von dort kommt sie zurück');
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
         * NUR IN DENSELBEN ELTERN. Liegen die Seiten eines Dokuments in
         * mehreren Spalten (das kann `documentsIn` finden), gibt es keine eine
         * Reihenfolge, in die man einsortieren könnte — dann sagt es das,
         * statt heimlich etwas anderes zu tun.
         */
        const seiteAnStelle = (block, zielIndex) => {
            const liste = documentsIn(page);
            const eltern = new Set(liste.map(b => String(b.parentId || '')));
            if (eltern.size !== 1) {
                UI.toast('Die Seiten dieses Dokuments liegen in mehreren Spalten — ziehen geht dort nicht.');
                return false;
            }
            const stelle = stelleVon(block);
            if (!stelle)
                return false;
            const von = liste.findIndex(b => b.id === block.id);
            if (von < 0 || zielIndex === von || zielIndex === von + 1)
                return false;
            const inhalt = [...stelle.eltern.content];
            const nachId = liste[zielIndex]?.id ?? null;
            const raus = inhalt.indexOf(block.id);
            if (raus < 0)
                return false;
            inhalt.splice(raus, 1);
            const ziel = nachId ? inhalt.indexOf(nachId) : -1;
            inhalt.splice(ziel < 0 ? inhalt.length : ziel, 0, block.id);
            Store.updateBlock(stelle.eltern.id, { content: inhalt });
            UI.toast('Seite verschoben');
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
            eintrag('page-add', '＋', 'Seite danach');
            eintrag('page-add-camera', '📷', 'Foto aufnehmen');
            eintrag('page-duplicate', '⧉', 'Duplizieren');
            eintrag('page-rotate', '⟳', 'Drehen');
            eintrag('page-up', '↑', 'Nach oben');
            eintrag('page-down', '↓', 'Nach unten');
            eintrag('page-bookmark', '🔖', block.lesezeichen ? 'Lesezeichen weg' : 'Lesezeichen');
            eintrag('page-export-image', '⬇', 'Als Bild sichern');
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
            UI.toast(g ? 'Seite um ' + g + '° gedreht' : 'Seite wieder aufrecht');
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
                    UI.toast('Seite ' + nr + ' als PNG gesichert');
                });
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
                (typeof Konten === 'undefined' || Konten.darf('bearbeiten', page.id)))
                toolsSetzen(true);
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
